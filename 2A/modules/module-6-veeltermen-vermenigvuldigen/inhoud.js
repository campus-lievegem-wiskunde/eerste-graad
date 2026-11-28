/* ============================================================
   HULPFUNCTIES
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const PREFIX = '2a_m6_product_v1_';
let CURKEY = ''; /* sleutel van de kaart die nu opgebouwd wordt: vraag-id's beginnen met onderdeel-id + '_' */
const QID = id => (CURKEY && !String(id).startsWith(CURKEY + '_')) ? CURKEY + '_' + id : String(id);
let QZ = null; /* verzamelt beoordelaars tijdens het opbouwen van een proeftoetsvraag */
function load(k){ try{ const r = localStorage.getItem(PREFIX+k); if(r){ const p = JSON.parse(r); if(p && typeof p === 'object') return p; } }catch(e){} return {}; }
function store(k,v){ try{ localStorage.setItem(PREFIX+k, JSON.stringify(v)); }catch(e){} }
function wipe(k){ try{ localStorage.removeItem(PREFIX+k); }catch(e){} }
function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function shuffle(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ---------- toevalsgenerator met zaadje (zelfde opgave na herladen) ---------- */
function mulberry(seed){ let a = seed>>>0; return ()=>{ a = (a + 0x6D2B79F5)>>>0; let t = a; t = Math.imul(t ^ (t>>>15), t | 1); t ^= t + Math.imul(t ^ (t>>>7), t | 61); return ((t ^ (t>>>14))>>>0) / 4294967296; }; }
const UPP = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const LOW = 'abcdefghkmnprstuvwxyz';
const GREEK = ['α','β','γ','δ','ε'];
function makeR(st, key='seed'){
  if(!st[key]) st[key] = 1 + Math.floor(Math.random()*2e9);
  const f = mulberry(st[key]);
  const R = {
    f, int:(a,b)=>a + Math.floor(f()*(b-a+1)), real:(a,b)=>a + f()*(b-a),
    pick:arr=>arr[Math.floor(f()*arr.length)],
    sign:()=> f()<.5?-1:1,
    shuffle:arr=>{ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(f()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; },
    letters:(n, pool=UPP)=> R.shuffle(pool.split('')).slice(0,n),
    /* opeenvolgende letters vermijden we niet: willekeurige letters uit de pool */
  };
  return R;
}

/* ---------- getallen ---------- */
const nrm = s => String(s).replace(/\s+/g,'').replace(/[−–]/g,'-');
function parseNum(s){ const t = nrm(s).replace(',', '.'); if(!/^-?\d*(\.\d+)?$/.test(t) || t==='' || t==='-' ) return NaN; return Number(t); }
function roundTo(x, d){ const m = Math.pow(10,d); return Math.round(x*m)/m; }
function fmtN(x, dec){ let s = (dec!=null ? roundTo(x,dec) : roundTo(x,6)).toString(); if(s.includes('e')) s = x.toFixed(8).replace(/0+$/,''); s = s.replace('.',','); return s.replace('-','−'); }
/* graden: "67,5" "67°30'" "67 30" "67°30′20″" */
function parseDeg(s){
  let t = String(s).trim().replace(/[−–]/g,'-').replace(/’|'|′/g,"'").replace(/"|″|''/g,'"').replace(/º/g,'°');
  if(t==='') return NaN;
  let m = t.match(/^(-?\d+(?:[.,]\d+)?)\s*°?\s*(?:(\d+(?:[.,]\d+)?)\s*'\s*)?(?:(\d+(?:[.,]\d+)?)\s*"\s*)?$/);
  if(!m) m = t.match(/^(-?\d+)\s*°?\s+(\d+)(?:\s*'?\s+(\d+)\s*"?)?\s*'?$/);
  if(!m) return NaN;
  const d = parseFloat(m[1].replace(',','.')), mi = m[2]?parseFloat(m[2].replace(',','.')):0, se = m[3]?parseFloat(m[3].replace(',','.')):0;
  if(mi>=60 || se>=60) return NaN;
  return d + Math.sign(d||1)*(mi/60 + se/3600);
}
function fmtDeg(x){ /* 67.5 -> 67°30′ ; 20.511 -> 20°30′40″ */
  const neg = x<0; x = Math.abs(x);
  let tot = Math.round(x*3600); const d = Math.floor(tot/3600); tot -= d*3600; const m = Math.floor(tot/60); const s = tot - m*60;
  return (neg?'−':'') + d + '°' + (m||s ? ' ' + m + '′' : '') + (s ? ' ' + s + '″' : '');
}
const degIs = (t, tol=0.01) => v => { const x = parseDeg(v[0]); if(isNaN(x)) return {ok:false, msg:'Noteer een hoekgrootte, bijvoorbeeld 47 of 47°.'}; return {ok:Math.abs(x-t)<=tol+1e-9}; };
const numIs = (t, tol=1e-9) => v => { const x=parseNum(v[0]); if(isNaN(x)) return {ok:false, msg:'Typ enkel een getal.'}; return {ok:Math.abs(x-t)<=tol+1e-9}; };

/* ---------- notatie ---------- */
const hat = L => `<span class="ht">${L}&#770;</span>`;     /* Â via combinerend dakje */
const hatT = L => L + '̂';
const ang3 = (a,b,c) => a + hat(b) + c;
const bars = s => `|${s}|`;

/* ---------- iconen ---------- */
const T = (s, size=9, y=15.5) => `<text x="12" y="${y}" text-anchor="middle" font-size="${size}">${s}</text>`;
const ICONS = {
  tools:'<path d="M3 20L12 4l9 16z"/><path d="M12 9.5v10.5"/><path d="M7.5 16.5a5.5 5.5 0 0 1 9 0"/>',
  punt:'<circle cx="5" cy="17" r="1.6" fill="currentColor"/><path d="M8 14.5l13-8"/><path d="M3 10.5h8"/><circle cx="3" cy="10.5" r="1.3" fill="currentColor"/>',
  element:T('∈',17,18),
  liniaal:'<rect x="2.5" y="8" width="19" height="8" rx="1.2"/><path d="M6 8v3M9.5 8v4.5M13 8v3M16.5 8v4.5M20 8v3"/>',
  passer:'<circle cx="12" cy="4.5" r="1.6"/><path d="M11 6L6 20M13 6l4.5 12"/><path d="M17.5 18l.8 2.5"/><path d="M3 14.5a10 10 0 0 0 4 4.5" stroke-dasharray="1.5 1.5"/>',
  hoek:'<path d="M3.5 19.5h17M3.5 19.5L15 5"/><path d="M10 19.5a6.5 6.5 0 0 0-2.4-5"/>',
  gradenboog:'<path d="M3 18h18"/><path d="M5 18a7 7 0 0 1 14 0"/><path d="M12 18V11M7.5 13.5l1.2 1.2M16.5 13.5l-1.2 1.2"/>',
  inspringend:'<path d="M12 12l8-6M12 12h9"/><path d="M14.5 10.2a3.2 3.2 0 1 0 1 1.8" />',
  bissectrice:'<path d="M3 19.5h18M3 19.5L18 6M3 19.5l18-6.3"/><path d="M9.5 19.5a6.5 6.5 0 0 0-1-3.6M9 16.1a6.5 6.5 0 0 0-1.6-1.9"/>',
  verband:'<path d="M3 17L21 7M5 5l14 14"/><path d="M9.5 14.5a3 3 0 0 0 5 0" />',
  fout:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3l5 5"/><path d="M8.3 8.3l4.4 4.4M12.7 8.3l-4.4 4.4"/>',
  toets:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3.2H9zM8.5 12l2 2 4.5-4.5M8.5 17.5h7"/>',
  cheat:'<path d="M5.5 3h9l4 4v14h-13z"/><path d="M14.5 3v4h4M8.5 11h7M8.5 14.5h7M8.5 18h4"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  play:'<path d="M7 4.5v15l12-7.5z"/>',
  vraag:'<path d="M4 4.5h16v11.5H10l-6 4.5z"/>'+T('?',9,13.8)
};
const icon = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const LVL = {1:'<span class="lvl-badge l1">basis</span>', 2:'<span class="lvl-badge l2">oefenen</span>', 3:'<span class="lvl-badge l3">verdieping</span>'};

/* ============================================================
   VRAAG-BLOKKEN
   ============================================================ */
function fillInputs(html, id, defSize, mode){
  return html.replace(/\[\[(\d+)(?::(\w+))?\]\]/g, (m,i,sz)=> sz==='pm' ?
    `<span class="pm"><span class="pm-sw"><button type="button" data-s="+" aria-label="plus">+</button><button type="button" data-s="-" aria-label="min">−</button></span><input type="text" class="inp xs" id="${id}-f${i}" data-f="${i}" autocomplete="off" spellcheck="false" inputmode="numeric" aria-label="antwoordvak ${+i+1}: kies + of − en typ het getal"></span>` :
    `<input type="text" class="inp ${sz||defSize||''}" id="${id}-f${i}" data-f="${i}" autocomplete="off" spellcheck="false" ${mode?`inputmode="${mode}"`:''} aria-label="antwoordvak ${+i+1}">`);
}
function helpHTML(html){ return `<span class="help"><button type="button" class="help-btn" aria-label="Hulp">${icon('info')}</button><span class="help-pop" role="tooltip">${html}</span></span>`; }
document.addEventListener('click', e=>{
  const b = e.target.closest('.help-btn');
  document.querySelectorAll('.help.open').forEach(h=>{ if(!b || h!==b.parentElement) h.classList.remove('open'); });
  if(b) b.parentElement.classList.toggle('open');
});

/* qBlock: tekst met invulvakjes, optioneel keuzeknoppen en/of een tekenblad.
   q.check(vals, keuze, B) -> {ok, msg, info, fields} */
function qBlock(parent, st, save, id, q){
  const row = el('div','q'); const qid = QID(id); if(!QZ && !q.noCL) CLvraag(qid);
  row.append(el('div', 'q-text'+(q.block?' block':''), (q.nr?`<span class="q-num">${q.nr}</span>`:'') + (q.help?helpHTML(q.help)+' ':'') + fillInputs(q.html, id, q.size, q.mode)));
  let optBtns = [], wrap = null;
  if(q.choice){
    wrap = el('div','choices');
    if(q.choiceLabel) wrap.append(el('span','step-lab', q.choiceLabel));
    q.choice.forEach(([val,label])=>{ const b=el('button','opt',label); b.type='button'; b.dataset.val=val; wrap.append(b); optBtns.push(b); });
  }
  let B = null;
  const s = st[id] || (st[id] = {v:[], c:null});
  if(q.board){ const host = el('div'); row.append(host); B = makeBoard(host, s, save, id, q.board); B._demo = ()=> q.demo ? (typeof q.demo==='function' ? q.demo(B) : q.demo) : null; }
  if(wrap && !q.choiceLast) row.append(wrap);
  if(q.html2) row.append(el('div', q.block2?'':'q-text', fillInputs(q.html2, id, q.size, q.mode)));
  if(wrap && q.choiceLast) row.append(wrap);
  const act = el('div','q-act');
  const btn = el('button','btn','Controleer'); btn.type='button';
  const solBtn = el('button','linkbtn','Toon oplossing'); solBtn.type='button'; solBtn.hidden = true;
  const demoLbl = q.demoFirst ? ' Bekijk hoe het moet' : ' Toon de werkwijze';
  const demoBtn = el('button','btn ghost demo-btn', icon('play')+demoLbl); demoBtn.type='button'; demoBtn.hidden = !(q.demoFirst && q.demo);
  demoBtn.style.display='inline-flex'; demoBtn.style.alignItems='center'; demoBtn.style.gap='.3rem';
  act.append(btn, demoBtn, solBtn);
  const fb = el('div','fb');
  const sol = el('div','sol', q.sol||''); sol.hidden = true;
  row.append(act, fb, sol);
  parent.append(row);
  row._q = q; row._B = B; row._qid = qid;
  const quiz = QZ; if(quiz){ btn.hidden = true; }

  const inputs = [...row.querySelectorAll('.inp')].filter(i=>!i.closest('.board')).sort((a,b)=>a.dataset.f-b.dataset.f);
  function paintChoice(){ optBtns.forEach(b=>{ b.classList.toggle('chosen', b.dataset.val===s.c); b.classList.remove('good','wrong'); }); if(q.onChoice) q.onChoice(row, s.c); }
  inputs.forEach((inp,i)=>{
    if(s.v[i]!=null) inp.value = s.v[i];
    inp.addEventListener('input', ()=>{ s.v[i]=inp.value; save(); inp.classList.remove('ok','bad'); });
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter' && !quiz){ e.preventDefault(); run(); } });
  });
  optBtns.forEach(b=> b.addEventListener('click', ()=>{ if(b.disabled) return; s.c=b.dataset.val; save(); paintChoice(); fb.textContent=''; }));
  paintChoice();

  function evaluate(){
    const vals = inputs.map(i=>i.value.trim());
    try{ return q.check(vals, s.c, B) || {ok:false}; }catch(e){ console.error(e); return {ok:false, msg:''}; }
  }
  function run(silent){
    const vals = inputs.map(i=>i.value.trim());
    if(!q.board && inputs.length && vals.every(v=>v==='') && !(q.choice && s.c)){ fb.textContent=''; fb.className='fb'; return; }
    if(q.choice && !s.c && !q.choiceOptional){ fb.className='fb info'; fb.textContent='Kies eerst een van de knoppen.'; return; }
    if(inputs.length && vals.some(v=>v==='') && !q.allowEmpty){ fb.className='fb info'; fb.textContent='Vul eerst alle vakjes in.'; return; }
    const r = evaluate();
    const kind = r.ok ? 'ok' : (r.info ? 'info' : 'bad');
    fb.className = 'fb ' + kind;
    fb.innerHTML = (r.ok ? '✅ Juist! ' : r.info ? '' : '❌ Nog niet juist. ') + (r.msg || (r.ok && q.why ? q.why : ''));
    inputs.forEach((inp,i)=>{ inp.classList.remove('ok','bad');
      if(r.fields){ if(r.fields[i]!=null) inp.classList.add(r.fields[i]?'ok':'bad'); }
      else if(r.ok) inp.classList.add('ok'); else if(!r.info) inp.classList.add('bad'); });
    if(q.choice && r.choiceOk!=null){ optBtns.forEach(b=>{ if(b.dataset.val===s.c) b.classList.add(r.choiceOk?'good':'wrong'); }); }
    if(!r.ok && q.sol) solBtn.hidden = false;
    if(!r.ok && q.demo && B) demoBtn.hidden = false;
    s.checked = true; save(); if(!q.noCL) CLres(qid, !!r.ok, !!r.info);
  }
  btn.addEventListener('click', ()=>run());
  solBtn.addEventListener('click', ()=>{ sol.hidden=!sol.hidden; solBtn.textContent = sol.hidden ? 'Toon oplossing' : 'Verberg oplossing'; });
  demoBtn.addEventListener('click', ()=>{
    if(B.demoActive()){ B.stopDemo(); demoBtn.innerHTML = icon('play')+demoLbl; return; }
    demoBtn.innerHTML = '■ Stop';
    B.playDemo(typeof q.demo==='function' ? q.demo(B) : q.demo, ()=>{});
  });
  if(quiz){
    quiz.push({
      pts: q.pts || 1,
      grade:()=>{ const vals=inputs.map(i=>i.value.trim());
        if(q.choice && !s.c && !q.choiceOptional) return false;
        if(!q.board && inputs.length && vals.every(v=>v==='') && !q.choice) return false;
        if(inputs.length && vals.some(v=>v==='') && !q.allowEmpty) return false;
        return !!evaluate().ok; },
      reveal:(ok)=>{ inputs.forEach(inp=>{ inp.classList.remove('ok','bad'); inp.classList.add(ok?'ok':'bad'); }); optBtns.forEach(b=>{ if(b.dataset.val===s.c) b.classList.add(ok?'good':'wrong'); });
        if(!ok){ const r = evaluate(); if(r.msg){ fb.className='fb bad'; fb.innerHTML = '❌ ' + r.msg; } if(q.demo && B) demoBtn.hidden=false; if(q.sol) solBtn.hidden=false; } },
      lock:()=>{ inputs.forEach(i=>i.readOnly=true); optBtns.forEach(b=>b.disabled=true); if(B) B.lock(); }
    });
  } else if(s.checked) run(true);
  return {row, B, fb};
}

function qChoice(parent, st, save, id, q){
  const row = el('div','q'); const qid = QID(id); if(!QZ) CLvraag(qid);
  row.append(el('div','q-text', (q.nr?`<span class="q-num">${q.nr}</span>`:'') + `<span class="stmt">${q.html}</span>`));
  if(q.fig){ const fh = el('div',''); if(typeof q.fig==='function') q.fig(fh); else fh.innerHTML = q.fig; row.append(fh); }
  const wrap = el('div','choices');
  const btns = q.opts.map(([val,label])=>{ const b=el('button','opt'+(q.sym?' sym':''),label); b.type='button'; b.dataset.val=val; wrap.append(b); return b; });
  const fb = el('div','fb');
  row.append(wrap, fb); parent.append(row); row._qc = q;
  const quiz = QZ;
  function apply(val, doSave){
    if(quiz){ btns.forEach(b=>b.classList.toggle('chosen', b.dataset.val===val)); if(doSave){ st[id]=val; save(); } return; }
    const ok = val === q.ans || (q.alt||[]).includes(val);
    btns.forEach(b=>{ b.classList.remove('chosen','good','wrong'); if(b.dataset.val===val) b.classList.add('chosen', ok?'good':'wrong'); });
    fb.className = 'fb ' + (ok?'ok':'bad');
    fb.innerHTML = (ok ? '✅ Juist! ' : '❌ Niet juist. ') + (ok ? ((val!==q.ans && q.whyAlt) || q.why||'') : (q.whyBad||q.why||''));
    if(doSave){ st[id]=val; save(); CLres(qid, ok); }
    if(q.after) q.after(ok, doSave);
  }
  btns.forEach(b=> b.addEventListener('click', ()=>{ if(b.disabled) return; apply(b.dataset.val, true); }));
  if(st[id]) apply(st[id], false);
  if(quiz) quiz.push({ pts:q.pts||1, grade:()=>st[id]===q.ans || (q.alt||[]).includes(st[id]),
    reveal:(ok)=>btns.forEach(b=>{ if(b.dataset.val===st[id]) b.classList.add(ok?'good':'wrong'); if(!ok && b.dataset.val===q.ans) b.style.outline='2px dashed var(--ok)'; }),
    lock:()=>btns.forEach(b=>b.disabled=true) });
}

/* ============================================================
   SLEEP-MOTOR (slepen of aantikken)
   ============================================================ */
let selChip = null;
function clearSel(){ if(selChip){ selChip.classList.remove('chip-sel'); selChip=null; } }
function toggleSel(chip){ if(selChip===chip){ clearSel(); return; } clearSel(); selChip=chip; chip.classList.add('chip-sel'); }
function resetChipStyle(chip){ ['position','left','top','transform','zIndex'].forEach(p=>chip.style[p]=''); }
function draggable(chip, onDrop){
  chip.tabIndex = 0;
  chip.addEventListener('pointerdown', e=>{
    if(e.button!==0 || chip.dataset.locked) return;
    e.preventDefault();
    const sx=e.clientX, sy=e.clientY; let moved=false;
    const r = chip.getBoundingClientRect(); const ox=sx-r.left, oy=sy-r.top;
    const mv = e2=>{
      if(!moved && Math.hypot(e2.clientX-sx, e2.clientY-sy) > 5){
        moved = true; clearSel(); chip.classList.add('dragging');
        chip.style.position='fixed'; chip.style.left=r.left+'px'; chip.style.top=r.top+'px'; chip.style.transform='none';
        document.body.append(chip);
      }
      if(moved){ chip.style.left=(e2.clientX-ox)+'px'; chip.style.top=(e2.clientY-oy)+'px'; }
    };
    const up = e2=>{
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      if(moved){ chip.classList.remove('dragging'); resetChipStyle(chip); onDrop(e2.clientX, e2.clientY); }
      else toggleSel(chip);
    };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  });
  chip.addEventListener('keydown', e=>{ if(chip.dataset.locked) return; if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggleSel(chip); } });
}
const inRect = (elm,x,y)=>{ const r=elm.getBoundingClientRect(); return x>=r.left && x<=r.right && y>=r.top && y<=r.bottom; };

/* woorden/notaties naar vakjes slepen. lines: [{pre (html links), ans, why}] */
function bankEx(b, st, save, key, lines, words){
  const pool = el('div','pool'); b.append(pool);
  const list = el('div');
  const blanks = [], fbs = [];
  lines.forEach((ln,i)=>{
    const row = el('div','bank-line', `<span class="expr">${ln.expr||''}</span><span>${ln.pre||''}</span>`);
    const bl = el('span','blank'); bl.tabIndex=0; bl.dataset.i=i; bl.setAttribute('aria-label','vakje '+(i+1));
    const fb = el('div','fb');
    row.append(bl); if(ln.post) row.append(el('span','',ln.post)); row.append(fb); list.append(row); blanks.push(bl); fbs.push(fb);
  });
  b.append(list);
  const chips = {};
  const quiz = QZ; const qid = QID('sleep'); if(!quiz) CLvraag(qid);
  const okW = (i,w)=> Array.isArray(lines[i].ans) ? lines[i].ans.includes(w) : w===lines[i].ans;
  function toPool(chip){
    const par = chip.parentElement;
    if(par && par.classList.contains('blank')){ const i=+par.dataset.i; delete st[i]; fbs[i].textContent=''; }
    chip.classList.remove('chip-ok','chip-bad'); pool.append(chip); save();
  }
  function place(bl, chip){
    const i = +bl.dataset.i;
    if(bl.firstElementChild && bl.firstElementChild!==chip) toPool(bl.firstElementChild);
    const par = chip.parentElement;
    if(par && par.classList.contains('blank') && par!==bl){ const j=+par.dataset.i; delete st[j]; fbs[j].textContent=''; }
    bl.append(chip);
    st[i] = chip.dataset.w; save();
    if(quiz) return;
    const ok = okW(i, chip.dataset.w);
    chip.classList.remove('chip-ok','chip-bad'); chip.classList.add(ok?'chip-ok':'chip-bad');
    fbs[i].className = 'fb '+(ok?'ok':'bad');
    fbs[i].innerHTML = ok ? '✅ Juist! ' + (lines[i].why||'') : '❌ Niet juist. ' + (lines[i].bad||'Probeer een ander.');
    if(lines.every((ln,j)=>st[j]!=null)) CLres(qid, lines.every((ln,j)=>okW(j, st[j])));
  }
  words.forEach(w=>{
    const c = el('span','chip', w); c.dataset.w = w; c.dataset.grp = key;
    draggable(c, (x,y)=>{ const bl = blanks.find(z=>inRect(z,x,y)); if(bl) place(bl,c); else toPool(c); });
    chips[w] = c; pool.append(c);
  });
  const tapPlace = bl => { if(selChip && selChip.dataset.grp===key){ const c=selChip; clearSel(); place(bl,c); } };
  blanks.forEach(bl=>{ bl.addEventListener('click', e=>{ if(e.target.closest('.chip')) return; tapPlace(bl); }); bl.addEventListener('keydown', e=>{ if(e.key==='Enter') tapPlace(bl); }); });
  pool.addEventListener('click', e=>{ if(e.target===pool && selChip && selChip.dataset.grp===key){ const c=selChip; clearSel(); toPool(c); } });
  Object.keys(st).forEach(i=>{ if(!/^\d+$/.test(i)) return; const c=chips[st[i]]; if(c && blanks[i]) place(blanks[i], c); });
  if(quiz) quiz.push({ pts:1, grade:()=>lines.every((ln,i)=>okW(i, st[i])),
    reveal:()=>blanks.forEach((bl,i)=>{ const c=bl.firstElementChild; if(c) c.classList.add(okW(i,st[i])?'chip-ok':'chip-bad'); else bl.style.borderColor='var(--bad)'; }),
    lock:()=>Object.values(chips).forEach(c=>c.dataset.locked='1') });
}

/* --- zoek de fout --- */
function errBlock(parent, st, save, id, e){
  const row = el('div','q');
  row.append(el('div','q-text block', `<span class="q-num">${e.nr}</span><b>${e.task}</b>`));
  if(e.fig) row.append(el('div','', e.fig));
  const ol = el('ol','err-lines');
  const s = st[id] || (st[id] = {tried:[], found:false});
  const fb = el('div','fb');
  const fixBox = el('div','fix'); fixBox.hidden = true;
  const quiz = QZ; let qLocked = false; const qid = QID(id); if(!quiz) CLvraag(qid);
  const btns = e.lines.map((ln,i)=>{
    const li = el('li'); const b = el('button','err-line', `<span class="ln">Stap ${i+1}</span><span>${ln}</span>`); b.type='button';
    li.append(b); ol.append(li);
    b.addEventListener('click', ()=>{
      if(quiz){ if(qLocked) return; s.pick=i; save(); btns.forEach((x,j)=>x.classList.toggle('picked', j===i)); return; }
      if(s.found) return;
      if(i===e.wrong){ s.found=true; save(); paint(); CLres(qid, true); }
      else { const cons = (e.cons||[]).includes(i); if(!cons && !s.tried.includes(i)) s.tried.push(i); save(); paint(); CLres(qid, false); fb.className='fb bad'; fb.textContent = !cons ? `❌ Stap ${i+1} klopt wel. Zoek verder.` : `❌ In stap ${i+1} loopt het mis, maar de fout begint vroeger. Zoek de eerste stap die fout is.`; }
    });
    return b;
  });
  row.append(ol, fb, fixBox);
  parent.append(row);
  function paint(){
    btns.forEach((b,i)=>{ b.classList.toggle('nope', s.tried.includes(i)); b.classList.toggle('found', s.found && i===e.wrong); });
    if(s.found){
      fb.className='fb ok'; fb.innerHTML = `✅ Juist, de fout zit in stap ${e.wrong+1}. ${e.why}`;
      if(fixBox.hidden){ fixBox.hidden=false; fixBox.append(el('div','sub','Verbeter deze stap:')); if(e.fixMQ) mQ(fixBox, st, save, id+'_fix', Object.assign({noCL:true}, e.fixMQ)); else qBlock(fixBox, st, save, id+'_fix', {noCL:true, html:e.fix, check:e.fixCheck, sol:e.fixSol, mode:e.mode}); }
    }
  }
  if(quiz){
    btns.forEach((x,j)=>x.classList.toggle('picked', j===s.pick));
    quiz.push({ pts:e.pts||1, grade:()=>s.pick===e.wrong, reveal:()=>{ btns[e.wrong].classList.add('found'); }, lock:()=>{ qLocked=true; } });
  } else paint();
}

/* --- proeftoets (met punten) --- */
function proeftoets(b, st, save, key, items){
  const scoreTop = el('div'); b.append(scoreTop);
  const rows = [];
  items.forEach((q,i)=>{
    const row = el('div','q pt-q');
    const head = el('div','pt-sec', `Vraag ${i+1} · ${q.sec}`);
    const ptsTag = el('span','pt-pts',''); head.append(ptsTag);
    row.append(head);
    if(q.prompt) row.append(el('div','q-text block', q.prompt));
    const body = el('div'); row.append(body);
    const fb = el('div','fb'); row.append(fb);
    b.append(row);
    const sub = st['q'+i] || (st['q'+i] = {});
    QZ = [];
    try{ q.build(body, sub, save, key+'_q'+i); }
    catch(err){ console.error(err); }
    finally{ const g = QZ; QZ = null; let tot = g.reduce((s,x)=>s+(x.pts!=null?x.pts:1),0);
      /* vaste punten per vraag: de deelvragen worden herschaald */
      if(q.pts && tot){ const f = q.pts/tot; g.forEach(x=>x.pts = (x.pts!=null?x.pts:1)*f); tot = q.pts; }
      ptsTag.textContent = '/ ' + fmtN(tot, 2); rows.push({q, row, fb, graders:g, tot, ptsTag}); }
  });
  const actions = el('div','pt-actions');
  const bGrade = el('button','btn big','Verbeter mijn proeftoets'); bGrade.type='button';
  const bReset = el('button','btn ghost big','Nieuwe proeftoets'); bReset.type='button';
  actions.append(bGrade, bReset); b.append(actions);
  const scoreBottom = el('div'); scoreBottom.style.marginTop='1rem'; b.append(scoreBottom);
  function grade(){
    let score = 0, total = 0;
    rows.forEach(({q,row,fb,graders,tot,ptsTag})=>{
      let got = 0;
      const res = graders.map(g=>{ let ok=false; try{ ok = !!g.grade(); }catch(e){ ok=false; } if(ok) got += (g.pts!=null?g.pts:1); return ok; });
      total += tot; score += got;
      graders.forEach((g,k)=>{ try{ g.reveal && g.reveal(res[k]); g.lock && g.lock(); }catch(e){} });
      const full = Math.abs(got-tot)<1e-9 && tot>0;
      row.classList.toggle('right', full); row.classList.toggle('wrongq', !full);
      ptsTag.textContent = fmtN(got, 2) + ' / ' + fmtN(tot, 2);
      fb.className = 'fb '+(full?'ok':'bad');
      fb.innerHTML = full ? '✅ Alles juist.' : (got>0 ? '◐ Gedeeltelijk juist. ' : '❌ Nog niet juist. ') + (q.show ? 'Juist antwoord: ' + (typeof q.show==='function'?q.show():q.show) : '');
    });
    score = Math.round(score*10)/10; total = Math.round(total*10)/10;
    const pct = total ? score/total : 0;
    const lvl = pct>=.9?'prima':pct>=.7?'goed':pct>=.5?'voldoende':'onvoldoende';
    const html = `<div class="score"><span class="big">${fmtN(score, 1)} / ${fmtN(total, 1)}</span><span>Ik ken de leerstof:</span><span class="lvl">${lvl}</span></div>`;
    scoreTop.innerHTML = html; scoreBottom.innerHTML = html; CLtoets(key, score, total);
    bGrade.disabled = true;
    st.done = true; save();
  }
  bGrade.addEventListener('click', ()=>{ grade(); scoreTop.scrollIntoView({behavior:'smooth', block:'start'}); });
  bReset.addEventListener('click', ()=>{ wipe(key); renderers[key](); });
  if(st.done) grade();
}
function ctlBtn(label, fn, ghost=true){ const b = el('button', 'btn'+(ghost?' ghost':''), label); b.type='button'; b.addEventListener('click', fn); return b; }
/* animatie-hulp voor dynamische figuren */
function tween(ms, fn, done){ const t0 = performance.now(); const tick = now=>{ const t = Math.min(1,(now-t0)/ms); fn(t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2); if(t<1) requestAnimationFrame(tick); else if(done) done(); }; requestAnimationFrame(tick); }

/* ============================================================
   HULP VAN 2A MODULE 3: tekst-escape en stappen ordenen
   ============================================================ */
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
/* ============================================================
   VOLGORDE: stappen in de juiste volgorde zetten (aantikken of slepen)
   lines: array html, in de juiste volgorde. alt: extra juiste volgordes (arrays van indexen)
   ============================================================ */
function orderEx(parent, st, save, id, cfg){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {seq:[], order:null});
  if(!s.order){ let o; do{ o = shuffle(cfg.lines.map((_,i)=>i)); }while(cfg.lines.length>2 && o.every((x,i)=>x===i)); s.order = o; save(); }
  const wrap = el('div','ord');
  if(cfg.html) wrap.append(el('div','q-text block', cfg.html));
  const pool = el('div','ord-pool'); const list = el('ol','ord-list');
  wrap.append(el('div','ord-lab','Tik de stappen aan in de juiste volgorde:'), pool, el('div','ord-lab',cfg.lab||'Jouw bewijs:'), list);
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; const rst = el('button','btn ghost','Wis mijn volgorde'); rst.type='button';
  const solB = el('button','linkbtn','Toon oplossing'); solB.type='button'; solB.hidden = true;
  act.append(btn, rst, solB); const fb = el('div','fb'); const sol = el('div','sol', '<ol>'+cfg.lines.map(l=>`<li>${l}</li>`).join('')+'</ol>'); sol.hidden = true;
  wrap.append(act, fb, sol); parent.append(wrap);
  let locked = false;
  const correct = ()=>{ const okSeqs = [cfg.lines.map((_,i)=>i), ...(cfg.alt||[])]; return okSeqs.some(q=>q.length===s.seq.length && q.every((x,i)=>x===s.seq[i])); };
  function paint(){
    pool.innerHTML=''; list.innerHTML='';
    s.order.forEach(i=>{ if(s.seq.includes(i)) return; const b = el('button','ord-step', cfg.lines[i]); b.type='button';
      b.addEventListener('click', ()=>{ if(locked) return; s.seq.push(i); save(); fb.textContent=''; paint(); }); pool.append(b); });
    s.seq.forEach((i,j)=>{ const li = el('li','ord-done'); const b = el('button','ord-step in', cfg.lines[i]); b.type='button';
      b.title = 'Tik om terug te leggen';
      b.addEventListener('click', ()=>{ if(locked) return; s.seq.splice(j); save(); fb.textContent=''; paint(); }); li.append(b); list.append(li); });
    if(!s.seq.length) list.append(el('li','ord-empty','(nog leeg)'));
  }
  function run(){
    if(s.seq.length < cfg.lines.length){ fb.className='fb info'; fb.textContent='Leg eerst alle stappen op hun plaats.'; return; }
    const ok = correct(); fb.className='fb '+(ok?'ok':'bad');
    if(ok) fb.innerHTML = '✅ Juist! ' + (cfg.why||'');
    else { const first = s.seq.findIndex((x,i)=>x!==i); fb.innerHTML = `❌ Nog niet juist. Stap ${first+1} staat niet op zijn plaats. ` + (cfg.hint||'Tik op een stap in je bewijs om vanaf daar opnieuw te beginnen.'); solB.hidden = false; }
    [...list.querySelectorAll('.ord-step')].forEach((b,j)=>b.classList.add(s.seq[j]===j || ok ? 'good':'wrong'));
    s.checked = true; save(); if(!quiz) CLres(qid, ok);
  }
  btn.addEventListener('click', run);
  rst.addEventListener('click', ()=>{ if(locked) return; s.seq = []; save(); fb.textContent=''; paint(); });
  solB.addEventListener('click', ()=>{ sol.hidden=!sol.hidden; solB.textContent = sol.hidden?'Toon oplossing':'Verberg oplossing'; });
  paint();
  if(quiz){ btn.hidden = true; quiz.push({pts:cfg.pts||1, grade:()=>correct(), reveal:ok=>{ fb.className='fb '+(ok?'ok':'bad'); if(!ok){ sol.hidden=false; } }, lock:()=>{ locked=true; } }); }
  else if(s.checked && s.seq.length===cfg.lines.length) run();
}


/* ============================================================
   MOTOR VAN 2A MODULE 4 (MACHTEN): exacte breuken, notatie, invoer en controle
   aangevuld voor module 6: widgets p (vrij veeltermvak), t (termvak) en z (tekenvak), q.onCh in mQ
   ============================================================ */
const ggd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while(b){ [a, b] = [b, a % b]; } return a || 1; };
function Q(n, d=1){ if(d===0) return null; if(d<0){ n = -n; d = -d; } const g = ggd(n, d); return {n:n/g, d:d/g}; }
const qMul = (a, b) => Q(a.n*b.n, a.d*b.d);
const qInv = a => Q(a.d, a.n);
const qNeg = a => Q(-a.n, a.d);
function qPow(a, e){ let r = Q(1); const b = e<0 ? qInv(a) : a; for(let i=0; i<Math.abs(e); i++) r = qMul(r, b); return r; }
const qEq = (a, b) => !!a && !!b && a.n===b.n && a.d===b.d;
const qCmp = (a, b) => a.n*b.d - b.n*a.d;
/* "0,25" -> 1/4 */
function qDec(s){ const t = nrm(s).replace('.', ','); const m = t.match(/^(-?)(\d*),(\d+)$/); if(!m) return null; const p = Math.pow(10, m[3].length); return Q((m[1]?-1:1)*(+(m[2]||0)*p + +m[3]), p); }

/* ---------- grondtal: '2', '-3', '2/3', '-2/3', '0,5', 'a' ---------- */
function B(s){
  if(typeof s==='object') return s;
  s = String(s);
  if(/^[a-z]$/.test(s)) return {s, kind:'l', neg:false};
  if(s.includes('/')){ const [t, n] = s.split('/'); const q = Q(+t, +n); return {s, kind:'q', q, neg:q.n<0}; }
  if(s.includes(',')){ const q = qDec(s); return {s, kind:'d', q, neg:q.n<0}; }
  return {s, kind:'n', q:Q(+s), neg:+s<0};
}
const bVal = b => B(b).q;   /* null bij een letter */
/* breuk terug naar een grondtal-tekst: 3/2 of 2 */
const qS = q => q.d===1 ? String(q.n) : q.n + '/' + q.d;
const D2R = Math.PI/180;

/* ---------- notatie in html ---------- */
const MIN = '−';
const sg = s => String(s).replace(/-/g, MIN);
const brH = (t, n, cls='') => `<span class="br${cls?' '+cls:''}"><span class="br-t">${t}</span><span class="br-n">${n}</span></span>`;
/* een breuk als waarde: −3/4 met het minteken ervoor */
function qH(q){ if(q.d===1) return sg(q.n); return `<span class="m4-g">${q.n<0 ? MIN : ''}${brH(Math.abs(q.n), q.d)}</span>`; }
/* minteken voor een macht, zonder tussenruimte */
const minH = h => `<span class="m4-g">${MIN}${h}</span>`;
const par = h => `<span class="m4-par">(</span>${h}<span class="m4-par">)</span>`;
/* grondtal met haakjes waar nodig */
function bH(b){ b = B(b);
  if(b.kind==='l') return `<i>${b.s}</i>`;
  if(b.kind==='q') return par(qH(b.q));
  return b.neg ? `(${sg(b.s)})` : sg(b.s); }
/* grondtal van een macht: ook een kommagetal krijgt haakjes, (0,5)³ */
const bHp = b => { b = B(b); return b.kind==='d' && !b.neg ? `(${sg(b.s)})` : bH(b); };
/* lineaire uitdrukking met één letter (exponenten): {c, k, v} */
function linP(s){
  const t = nrm(s).replace(/[·*]/g, '').toLowerCase();
  if(t==='') return null;
  const terms = t.match(/[+-]?[^+-]+/g); if(!terms || terms.join('')!==t) return null;
  let c = 0, k = 0, v = null;
  for(const term of terms){ const m = term.match(/^([+-]?)(\d*)([a-z]?)$/); if(!m || (!m[2] && !m[3])) return null;
    const f = (m[1]==='-' ? -1 : 1) * (m[2]==='' ? 1 : +m[2]);
    if(m[3]){ if(v && v!==m[3]) return null; v = m[3]; c += f; } else k += f; }
  return {c, k, v: c===0 ? null : v};
}
const linOf = e => typeof e==='object' ? e : linP(String(e));
const linEq = (a, b) => !!a && !!b && a.c===b.c && a.k===b.k && (a.c===0 || a.v===b.v);
const linAdd = (a, b) => { a = linOf(a); b = linOf(b); return {c:a.c+b.c, k:a.k+b.k, v:a.v||b.v}; };
const linNum = L => L.c===0;
function linH(L){ L = linOf(L); if(L.c===0) return sg(L.k);
  const c = L.c===1 ? '' : L.c===-1 ? MIN : sg(L.c);
  return `${c}<i>${L.v}</i>` + (L.k ? (L.k>0 ? ' + ' : ' ' + MIN + ' ') + Math.abs(L.k) : ''); }
const linT = L => { L = linOf(L); return linH(L).replace(/<[^>]+>/g, ''); };
/* macht in html: mH('-3', 4) -> (−3)⁴ ; e = null: geen exponent */
/* een exponent als rekenstap (−3+5, 3−(−4), 2·3) blijft zo staan: in een voorbeeld is dat net de tussenstap */
const eStap = s => !/[a-z]/i.test(s) && /[\d)]\s*[-+−·*]\s*[(\d−-]/.test(s);
const eH = e => typeof e==='number' ? sg(e) : eStap(String(e)) ? sg(String(e)).replace(/\*/g, '·') : linP(String(e)) ? linH(e).replace(/ /g, '') : sg(String(e)).replace(/([a-z])/g, '<i>$1</i>');
/* theoriekader bovenaan een kaart die een nieuwe regel brengt */
const regelTop = (b, html) => b.append(el('div', 'm4-regel', html));
function mH(b, e){ return `<span class="m4-m">${e==null ? bH(b) : bHp(b)}${e==null ? '' : `<sup class="m4-sup">${eH(e)}</sup>`}</span>`; }
/* macht met een invulvak als exponent */
const mE = (b, k) => `<span class="m4-m">${bHp(b)}<sup class="m4-sup">{{e:${k}}}</sup></span>`;
/* machten met maaltekens ertussen */
const prodH = arr => arr.map(([b, e]) => mH(b, e)).join(' · ');
const isq = '<span class="m4-is">=</span>';

/* ============================================================
   INVOER: tekenvak, slim vak (wordt een breuk bij /), machtvak
   Tokens in een regel: {{u:k}} uitkomst (getal of breuk; {{u:k,t}} met tekenvak)
   {{m:k,opts}} machtvak (opts: i = "1/" typen maakt een breuk, t = tekenvak), {{e:k}} exponent,
   {{b:k}} grondtal, {{g:k}} gewoon vak
   ============================================================ */
/* {{i:k}} … {{/i}}: een stuk dat de leerling zelf in de noemer zet met het breukicoontje (1 over …) */
const tokens = html => html.replace(/\{\{i:(\w+)\}\}/g, '<span class="m4-wi" data-k="$1">').replace(/\{\{\/i\}\}/g, '</span>').replace(/\{\{(\w):(\w+)((?:,\w+)*)\}\}/g, (m, t, k, o) => `<span class="m4-w" data-t="${t}" data-k="${k}" data-o="${o.slice(1)}"></span>`);
function m4inp(cls, val, lab){ const i = el('input', 'm4-in ' + cls); i.type = 'text'; i.autocomplete = 'off'; i.spellcheck = false; i.value = val || ''; i.setAttribute('aria-label', lab); grow(i); i.addEventListener('input', ()=>grow(i)); return i; }
function grow(i){ const n = Math.max(0, i.value.length - (i.classList.contains('ex') ? 2 : 3)); i.style.width = n ? `calc(var(--w) + ${n*.6}em)` : ''; }
const BRK_IC = '<svg viewBox="0 0 14 18" aria-hidden="true"><rect x="4.5" y="2.5" width="5" height="4" rx=".9"/><path d="M1.5 9h11"/><rect x="4.5" y="11.5" width="5" height="4" rx=".9"/></svg>';
/* tekenvak zoals in de rekenvaardigheden: + boven, − onder */
function tekenvak(o, save, onCh){
  const tv = el('span', 'm4-teken'); tv.setAttribute('role', 'group'); tv.setAttribute('aria-label', 'kies het teken');
  [['+', '+'], ['-', MIN]].forEach(([w, l]) => { const b = el('button', '', l); b.type = 'button'; b.dataset.w = w; b.setAttribute('aria-label', w==='+' ? 'plus' : 'min');
    b.addEventListener('click', ()=>{ o.s = o.s===w ? '' : w; save(); paint(true); onCh(); }); tv.append(b); });
  function paint(net){ tv.classList.toggle('gekozen', !!o.s); tv.classList.toggle('plus-weg', o.s==='+'); tv.classList.toggle('net', !!net && o.s==='+');
    tv.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.w===o.s))); }
  paint(false); return tv;
}
/* slim vak: typ je /, dan wordt het een breuk met teller en noemer onder elkaar */
function slimVak(host, o, save, onCh, cls, lab, focus){
  host.innerHTML = '';
  const redraw = f => slimVak(host, o, save, onCh, cls, lab, f);
  /* bij een uitkomst: één knopje 'breuk' (leerlingen typen niet graag een schuine streep); / of : typen werkt ook */
  const fbtn = el('button', 'm4-brk', BRK_IC); fbtn.type = 'button'; fbtn.dataset.tip = o.n==null ? 'maak er een breuk van' : 'geen breuk';
  fbtn.setAttribute('aria-label', o.n==null ? 'maak er een breuk van' : 'maak er geen breuk van'); fbtn.setAttribute('aria-pressed', String(o.n!=null));
  fbtn.addEventListener('mousedown', e=>e.preventDefault());
  fbtn.addEventListener('click', ()=>{ if(o.n==null){ o.n = ''; save(); redraw((o.t||'').trim() ? 'n' : 't'); } else { o.n = null; save(); redraw('t'); } onCh(); });
  let first;
  if(o.n==null){
    const i = m4inp(cls, o.t, lab); first = i;
    i.addEventListener('keydown', e=>{ if(e.key==='ArrowDown'){ e.preventDefault(); o.n = ''; save(); redraw('n'); onCh(); } });
    i.addEventListener('input', ()=>{ const v = i.value.replace(':', '/'), p = v.indexOf('/');
      if(p>=0){ o.t = v.slice(0, p); o.n = v.slice(p+1); save(); redraw('n'); } else { o.t = v; save(); } onCh(); });
    host.append(i); if(cls==='u' || cls==='b') host.append(fbtn);
    if(focus){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  } else {
    const t = m4inp(cls + ' br-get', o.t, lab + ', teller'), n = m4inp(cls + ' br-get', o.n, lab + ', noemer'); first = t;
    t.addEventListener('input', ()=>{ o.t = t.value.replace(/[/:]/, ''); if(/[/:]/.test(t.value)){ t.value = o.t; n.focus(); } save(); onCh(); });
    n.addEventListener('input', ()=>{ o.n = n.value; save(); onCh(); });
    n.addEventListener('keydown', e=>{ if(e.key==='Backspace' && n.value===''){ e.preventDefault(); o.n = null; save(); redraw('t'); onCh(); } });
    t.addEventListener('keydown', e=>{ if(e.key==='ArrowDown' || (e.key==='Enter' && n.value==='')){ e.preventDefault(); n.focus(); } });
    n.addEventListener('keydown', e=>{ if(e.key==='ArrowUp'){ e.preventDefault(); t.focus(); } });
    const br = el('span', 'br br-in'); const bt = el('span', 'br-t'), bn = el('span', 'br-n'); bt.append(t); bn.append(n); br.append(bt, bn); host.append(br); if(cls==='u' || cls==='b') host.append(fbtn);
    if(focus==='n'){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } else if(focus){ t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
  }
  return first;
}
/* alle widgets van een regel opbouwen; V = bewaarde waarden per sleutel */
function mountW(root, V, save, onCh, onEnter){
  const W = {};
  root.querySelectorAll('.m4-w').forEach(sp => {
    const k = sp.dataset.k, t = sp.dataset.t, o = (sp.dataset.o||'').split(',').filter(Boolean);
    const v = V[k] || (V[k] = {}); W[k] = {sp, t, o};
    sp.classList.add('m4-w' + t);
    if(t==='u'){ /* tekenvak enkel met ,t: bij oefeningen waar het teken iets is om over na te denken */
      if(o.includes('t')){ delete v.z; sp.append(tekenvak(v, save, onCh)); } else v.z = true; const h = el('span', 'm4-slim'); sp.append(h); slimVak(h, v, save, onCh, 'u', 'uitkomst'); }
    else if(t==='b'){ const h = el('span', 'm4-slim'); sp.append(h); slimVak(h, v, save, onCh, 'b', 'grondtal'); }
    else if(t==='e' || t==='g'){ const i = m4inp(t==='e' ? 'ex' : 'g', v.t, t==='e' ? 'exponent' : 'antwoord'); i.addEventListener('input', ()=>{ v.t = i.value; save(); onCh(); }); sp.append(i); }
    else if(t==='x') W[k].X = vrijVak(sp, v, save, onCh, o[0]);
    else if(t==='p' || t==='t') W[k].X = veelVak(sp, v, save, onCh, o[0], t==='t');
    else if(t==='z') sp.append(tekenvak(v, save, onCh));
    else if(t==='m'){
      /* machtvak: grondtal (haakjes typt de leerling zelf) en een oranje exponent; met ,i maakt "1/" er een breuk van */
      const draw = focus => { sp.innerHTML = '';
        const bi = m4inp('b', v.bt, 'grondtal'), ex = m4inp('ex', v.e, 'exponent');
        bi.addEventListener('input', ()=>{ const x = bi.value;
          if(o.includes('i') && !v.i && /^\s*1\s*\//.test(x)){ v.i = true; v.bt = x.replace(/^\s*1\s*\//, ''); save(); draw('b'); onCh(); return; }
          v.bt = x; save(); onCh(); });
        bi.addEventListener('keydown', e=>{ if(e.key==='Backspace' && v.i && bi.value===''){ e.preventDefault(); v.i = false; save(); draw('b'); onCh(); } });
        ex.addEventListener('input', ()=>{ v.e = ex.value; save(); onCh(); });
        const sup = el('span', 'm4-exp'); sup.append(ex);
        const pw = el('span', 'm4-mv'); pw.append(bi, sup);
        if(v.i){ const br = el('span', 'br m4-inv'); br.append(el('span', 'br-t', '1')); const bn = el('span', 'br-n'); bn.append(pw); br.append(bn); sp.append(br); }
        else sp.append(pw);
        if(o.includes('i')){ /* ook hier het breukicoontje: 1 over de macht, zonder schuine streep */
          const fb = el('button', 'm4-brk', BRK_IC); fb.type = 'button'; fb.dataset.tip = v.i ? 'geen breuk' : 'maak er een breuk van';
          fb.setAttribute('aria-label', v.i ? 'maak er geen breuk van' : 'zet de macht in de noemer'); fb.setAttribute('aria-pressed', String(!!v.i));
          fb.addEventListener('mousedown', e=>e.preventDefault());
          fb.addEventListener('click', ()=>{ v.i = !v.i; save(); draw('b'); onCh(); }); sp.append(fb); }
        if(focus){ bi.focus(); bi.setSelectionRange(bi.value.length, bi.value.length); }
      };
      draw();
    }
  });
  root.querySelectorAll('.m4-wi').forEach(sp => {
    const k = sp.dataset.k, v = V[k] || (V[k] = {}); W[k] = {sp, t:'i', o:[]};
    const box = el('span', 'm4-wi-in'); [...sp.childNodes].forEach(n => box.append(n));
    const fb = el('button', 'm4-brk', BRK_IC); fb.type = 'button'; fb.addEventListener('mousedown', e=>e.preventDefault());
    const draw = () => { sp.innerHTML = '';
      if(v.i){ const br = el('span', 'br m4-inv'); br.append(el('span', 'br-t', '1')); const bn = el('span', 'br-n'); bn.append(box); br.append(bn); sp.append(br); } else sp.append(box);
      fb.dataset.tip = v.i ? 'geen breuk' : 'maak er een breuk van'; fb.setAttribute('aria-label', v.i ? 'maak er geen breuk van' : 'zet dit in de noemer'); fb.setAttribute('aria-pressed', String(!!v.i)); sp.append(fb); };
    fb.addEventListener('click', ()=>{ v.i = !v.i; save(); draw(); onCh(); const f = box.querySelector('input'); if(f) f.focus({preventScroll:true}); });
    draw();
  });
  root.addEventListener('keydown', e=>{ if(e.key==='Enter' && e.target.matches('.m4-in') && !(e.target.classList.contains('br-get') && e.target.closest('.br-t'))){ e.preventDefault(); onEnter && onEnter(); } });
  return {
    W, V,
    mark(fields){ Object.entries(W).forEach(([k, w]) => { if(w.X && !w.X.enkel){ w.X.mark(true); return; } w.sp.classList.remove('ok', 'bad'); if(fields && fields[k]!=null) w.sp.classList.add(fields[k] ? 'ok' : 'bad'); }); },
    clear(){ Object.values(W).forEach(w => { if(w.X && !w.X.enkel) w.X.mark(null); w.sp.classList.remove('ok', 'bad'); }); },
    lock(){ Object.values(W).forEach(w => w.X && w.X.lock()); root.querySelectorAll('input,button').forEach(x => { if(x.tagName==='INPUT') x.readOnly = true; else if(x.closest('.m4-w,.m4-wi')) x.disabled = true; }); },
    empty(){ return Object.entries(W).some(([k, w]) => isEmptyW(w.t, V[k])); }
  };
}
const isEmptyW = (t, v) => t==='i' ? false : t==='x' ? emptyX(v) : (t==='p' || t==='t') ? emptyP(v) : t==='z' ? !(v && v.s) : !v || (t==='m' ? !(v.bt||'').trim() : t==='u' ? !(v.t||'').trim() && (v.z || !v.s) : !(v.t||'').trim()) || (v.n!=null && !String(v.n).trim());

/* ---------- lezen ---------- */
/* uitkomst: {q, simp} of {err, info} */
function rdU(v){
  v = v || {}; const t = nrm(v.t||''), n = v.n==null ? null : nrm(v.n);
  if(v.z){ /* zonder tekenvak: een minteken mag vooraan in het vak */ const m = t.match(/^-\s*/); return rdU({t: m ? t.slice(m[0].length) : t, n: v.n, s: m ? '-' : '+'}); }
  if(t==='' || n==='') return {err:'Vul het getal volledig in.'};
  if(!v.s) return {err:'Kies eerst het teken: klik op + of op − in het tekenvak.'};
  if(/-/.test(t + (n||''))) return {err:'Het minteken hoort in het tekenvak, niet bij het getal.'};
  if(/[.,]/.test(t + (n||''))){ const d = n==null ? qDec(t) : null; return {err:'Schrijf je antwoord als een breuk, niet als een kommagetal.', dec: d ? (v.s==='-' ? qNeg(d) : d) : null}; }
  if(!/^\d+$/.test(t) || (n!=null && !/^\d+$/.test(n))) return {err:'Typ enkel cijfers.'};
  const N = +t, D = n==null ? 1 : +n; if(D===0) return {err:'De noemer kan geen 0 zijn.'};
  return {q:Q((v.s==='-' ? -1 : 1)*N, D), simp: n==null || (ggd(N, D)===1 && D!==1)};
}
/* grondtal uit een slim vak */
function rdB(v){
  v = v || {}; let t = nrm(v.t||'').replace('.', ','), n = v.n==null ? null : nrm(v.n);
  /* haakjes rond het hele grondtal mogen: (−2), (0,5) */
  if(n==null){ const m = t.match(/^\((.*)\)$/); if(m) t = m[1]; } else if(t[0]==='(' && n.slice(-1)===')'){ t = t.slice(1); n = n.slice(0, -1); }
  if(t==='') return null;
  if(n!=null){ if(!/^-?\d+$/.test(t) || !/^-?\d+$/.test(n) || +n===0) return {bad:true};
    const q = Q(+t, +n); return {kind:'q', q, neg:q.n<0, simp: ggd(+t, +n)===1}; }
  if(/^[a-z]$/i.test(t)) return {kind:'l', s:t.toLowerCase(), neg:false};
  if(/^-[a-z]$/i.test(t)) return {kind:'l', s:t.slice(1).toLowerCase(), neg:true, minL:true};
  if(/^-?\d+$/.test(t)) return {kind:'n', q:Q(+t), neg:+t<0};
  if(/^-?\d*,\d+$/.test(t)) return {kind:'d', q:qDec(t), neg:t[0]==='-'};
  return {bad:true};
}
const sameB = (a, b) => { b = B(b); if(!a || a.bad) return false; if(b.kind==='l') return a.kind==='l' && a.s===b.s && !a.neg; return a.kind!=='l' && qEq(a.q, b.q); };
/* exponent: leeg = 1 */
const rdE = s => { const t = nrm(s||''); return t==='' ? {c:0, k:1, v:null} : linP(t); };

/* ---------- controle ---------- */
/* uitkomst vergelijken met een breuk. fout: [[Q, boodschap], ...] voor typische fouten */
function chkU(v, T, fout){
  const r = rdU(v);
  if(r.err){ if(r.dec && qEq(r.dec, T)) return {info:true, msg:'Het getal klopt, maar schrijf het als een breuk.'}; return {info:true, msg:r.err}; }
  if(qEq(r.q, T)) return r.simp ? {ok:true} : {info:true, msg:'Juist, maar vereenvoudig de breuk nog.'};
  for(const [F, m] of (fout||[])) if(qEq(r.q, F)) return {ok:false, msg:m};
  if(qEq(qNeg(r.q), T)) return {ok:false, msg:'Het getal klopt, maar kijk nog eens naar het teken.'};
  return {ok:false};
}
/* machtvak vergelijken met een doel {b, e, s, pos}. e mag een geheel getal of een lineaire uitdrukking zijn */
function chkM(v, T){
  v = v || {};
  const raw = nrm(v.bt||''); const pm = raw.match(/^\((.*)\)$/); const h = !!pm; const inner = pm ? pm[1] : raw;
  if(/[()]/.test(inner)) return {ok:false, msg:'Kijk de haakjes na: één haakje openen voor het grondtal en één sluiten erna.'};
  const b = rdB(inner.includes('/') ? {t:inner.split('/')[0], n:inner.split('/')[1]} : {t:inner});
  if(!b) return {info:true, msg:'Vul het grondtal in.'};
  if(b.bad) return {ok:false, msg:'Het grondtal kan ik niet lezen. Typ een getal, een breuk of een letter.'};
  const e0 = rdE(v.e); if(!e0) return {ok:false, msg:'De exponent kan ik niet lezen.'};
  if(b.minL) return {ok:false, msg:'Het minteken staat niet bij de letter.'};
  if(!sameB(b, T.b)){ if(T.keep!==false) return {ok:false, msg:`Behoud het grondtal: het grondtal blijft ${bH(T.b)}.`}; return {ok:false}; }
  const tb = B(T.b);
  if((tb.kind==='q' || tb.neg) && !h) return {ok:false, msg: tb.kind==='q' ? 'Typ haakjes rond de breuk. Anders staat de exponent enkel bij de noemer.' : `Typ haakjes rond het negatieve grondtal: ${bH(T.b)}. Zonder haakjes hoort het minteken niet bij het grondtal.`};
  const e = v.i ? {c:-e0.c, k:-e0.k, v:e0.v} : e0;
  if(T.s!=null && (v.s||'+')!==T.s) return {ok:false, msg:'Kijk nog eens naar het teken voor de macht.'};
  if(!linEq(e, linOf(T.e))){ for(const [F, m] of (T.fout||[])) if(linEq(e, linOf(F))) return {ok:false, msg:m}; return {ok:false}; }
  if(T.pos && linNum(e0) && e0.k<0) return {ok:false, msg:'Schrijf met een <b>positieve</b> exponent: klik op het breukicoontje (of typ <b>1/</b>), dan komt de macht in de noemer.'};
  if(v.i && linNum(e0) && e0.k===0) return {ok:false, msg:'Dat kan eenvoudiger.'};
  return {ok:true};
}
/* exponent-vak */
function chkE(v, e, fout){ const x = linP((v||{}).t||''); if(!x) return {info:true, msg:'Typ een exponent, bijvoorbeeld 3 of −2.'};
  if(linEq(x, linOf(e))) return {ok:true}; for(const [F, m] of (fout||[])) if(linEq(x, linOf(F))) return {ok:false, msg:m}; return {ok:false}; }
/* meerdere vakken: [[k, r]] -> samen */
function allOf(list){ const fields = {}; let ok = true, info = false, msg = '';
  for(const [k, r] of list){ if(!r.info) fields[k] = !!r.ok; if(!r.ok){ ok = false;
    if(r.info){ if(!msg){ info = true; msg = r.msg || ''; } } else if(!msg || info){ info = false; msg = r.msg || ''; } } }
  return {ok, info: !ok && info, msg, fields}; }

/* ============================================================
   VRAAG MET WIDGETS: q = {html, nr, check(V)->{ok,msg,info,fields}, sol, hint:[...], meer, why, pts}
   ============================================================ */
function mQ(parent, st, save, id, q){
  const qid = QID(id); const quiz = QZ; if(!quiz && !q.noCL) CLvraag(qid);
  const s = st[id] || (st[id] = {v:{}}); if(!s.v) s.v = {};
  const row = el('div', 'q m4-q' + (q.cls ? ' ' + q.cls : ''));
  const line = el('div', 'm4-line', (q.nr ? `<span class="q-num">${q.nr}</span>` : '') + tokens(q.html));
  const act = el('div', 'q-act');
  const btn = el('button', 'btn', 'Controleer'); btn.type = 'button';
  const solBtn = el('button', 'linkbtn', 'Toon oplossing'); solBtn.type = 'button'; solBtn.hidden = true;
  act.append(btn);
  const fb = el('div', 'fb'); const sol = el('div', 'sol', q.sol || ''); sol.hidden = true;
  row.append(line, act, fb); parent.append(row);
  const M = mountW(line, s.v, save, ()=>{ M.clear(); if(q.onCh) q.onCh(s.v, row); if(!quiz){ fb.className = 'fb'; fb.textContent = ''; } }, ()=>{ if(!quiz) run(); });
  if(q.onCh) q.onCh(s.v, row);
  if(!quiz) Object.values(M.W).forEach(w => { if(w.X){ w.X.check = () => q.check(s.v); w.X.toon(); } });
  if(window.__M4TEST) window.__M4TEST.push({id:qid, check:q.check, html:q.html});
  if(q.hint && !quiz){ hintBox(row, act, q.hint, q.meer, qid); const sig = hintSig(q.hint, q.meer); if(sig){ row.dataset.hsig = sig; row._hint = {steps:q.hint, meer:q.meer}; } }
  act.append(solBtn); row.append(sol);
  const evaluate = () => { try{ return q.check(s.v) || {ok:false}; }catch(e){ console.error(e); return {ok:false}; } };
  function run(silent){
    if(!silent) Object.values(M.W).forEach(w => w.X && w.X.trim());
    if(M.empty()){ if(!silent){ fb.className = 'fb info'; fb.textContent = 'Vul eerst alle vakjes in.'; } return; }
    const r = evaluate();
    fb.className = 'fb ' + (r.ok ? 'ok' : r.info ? 'info' : 'bad');
    fb.innerHTML = (r.ok ? '✅ Juist! ' : r.info ? '' : '❌ Nog niet juist. ') + (r.msg || (r.ok && q.why ? q.why : ''));
    M.mark(r.fields || (r.info ? null : Object.fromEntries(Object.keys(M.W).map(k=>[k, !!r.ok]))));
    if(!r.ok && !r.info && q.sol) solBtn.hidden = false;
    if(r.ok && q.onOk) q.onOk(silent);
    s.checked = true; save(); if(!silent && !q.noCL) CLres(qid, !!r.ok, !!r.info);
  }
  btn.addEventListener('click', ()=>run());
  solBtn.addEventListener('click', ()=>{ sol.hidden = !sol.hidden; solBtn.textContent = sol.hidden ? 'Toon oplossing' : 'Verberg oplossing'; });
  if(quiz){ btn.hidden = true;
    quiz.push({ pts:q.pts||1, grade:()=>{ Object.values(M.W).forEach(w => w.X && w.X.trim()); return !M.empty() && !!evaluate().ok; },
      reveal:ok=>{ Object.values(M.W).forEach(w => { if(w.X){ w.X.check = () => q.check(s.v); w.X.trim(); } }); M.mark(Object.fromEntries(Object.keys(M.W).map(k=>[k, ok]))); if(!ok){ const r = M.empty() ? {} : evaluate(); if(r.msg){ fb.className = 'fb bad'; fb.innerHTML = '❌ ' + r.msg; } if(q.sol) solBtn.hidden = false; } },
      lock:()=>M.lock() }); }
  else if(s.checked) run(true);
  return {row, M, fb, run};
}

/* ============================================================
   HINTS: 💡 Hint toont stap per stap; een stap is tekst of een invulregel
   step: [tekst, regel] of {u, line (met tokens), check(V)->bool, show (html van het antwoord)}
   meer: html (of functie(host)) voor 🔍 Meer uitleg
   ============================================================ */
/* een hint zonder invulregels: tekst die bij elke vraag van de kaart dezelfde kan zijn */
const hintSig = (steps, meer) => typeof meer==='function' || steps.some(x => x && typeof x==='object' && !Array.isArray(x)) ? null : JSON.stringify([steps, meer||'']);
/* staat bij elke vraag van een kaart dezelfde hint? dan één hint bovenaan voor de hele oefening */
function hintsSamen(body, key){
  const rows = [...body.querySelectorAll('.m4-q')].filter(r => r.querySelector(':scope > .q-act > .m4-hb'));
  if(rows.length < 2 || !rows.every(r => r.dataset.hsig && r.dataset.hsig===rows[0].dataset.hsig)) return;
  const {steps, meer} = rows[0]._hint;
  rows.forEach(r => { r.querySelector(':scope > .q-act > .m4-hb').remove(); const hb = r.querySelector(':scope > .hint-gr'); if(hb) hb.remove(); });
  const wrap = el('div', 'm4-kaarthint'); const act = el('div', 'q-act'); wrap.append(act);
  const first = rows[0].closest('.m4-items') || rows[0]; first.parentNode.insertBefore(wrap, first);
  hintBox(wrap, act, steps, meer, key + '_hint');
  act.querySelector('.m4-hb').textContent = '💡 Hint voor deze oefening';
}
function hintBox(row, act, steps, meer, qid){
  if(window.__M4TEST) steps.forEach((stp, i) => { if(stp && stp.check) window.__M4TEST.push({id:qid + '_hint' + i, check:V=>{ const r = stp.check(V); return typeof r==='boolean' ? {ok:r} : r; }, html:stp.line}); });
  const box = el('div', 'hint-gr'); const ol = el('ol', 'hint-stap'); ol.hidden = true; box.append(ol);
  const nb = el('button', 'btn ghost m4-hb', '💡 Hint'); nb.type = 'button'; act.append(nb); row.append(box);
  let n = 0;
  const next = () => { nb.hidden = n >= steps.length; nb.textContent = '💡 Volgende stap'; if(n >= steps.length && meer && !box.querySelector('.hint-fig')) addMeer(); };
  function addMeer(){ const d = el('details', 'hint-fig'); d.append(el('summary', '', '🔍 Meer uitleg')); const inn = el('div', 'hint-in'); d.append(inn);
    if(typeof meer==='function') meer(inn); else inn.innerHTML = meer; box.append(d); }
  nb.addEventListener('click', ()=>{ if(n >= steps.length) return; const stp = steps[n++]; ol.hidden = false;
    const li = el('li'); ol.append(li);
    if(Array.isArray(stp) || typeof stp==='string'){ const a = Array.isArray(stp) ? stp : [stp]; li.innerHTML = `${a[0]}${a[1] ? `<div class="hint-regel">${a[1]}</div>` : ''}`; next(); return; }
    nb.hidden = true;
    li.innerHTML = `${stp.u}<div class="hint-regel">${tokens(stp.line)} <button type="button" class="btn sm-btn">OK</button> <button type="button" class="linkbtn">toon</button></div><div class="fb"></div>`;
    const V = {}; const reg = li.querySelector('.hint-regel'); const fb = li.querySelector('.fb'); const [ok, show] = reg.querySelectorAll(':scope > button');
    const M = mountW(reg, V, ()=>{}, ()=>{ M.clear(); }, ()=>chk());
    const done = () => { M.lock(); ok.hidden = show.hidden = true; next(); };
    function chk(){ if(M.empty()){ fb.className = 'fb info'; fb.textContent = 'Vul eerst in.'; return; }
      let r = stp.check(V); if(typeof r==='boolean') r = {ok:r};
      M.mark(Object.fromEntries(Object.keys(M.W).map(k=>[k, !!r.ok])));
      if(r.ok){ fb.className = 'fb ok'; fb.textContent = '✅ Juist!'; done(); } else { fb.className = 'fb ' + (r.info ? 'info' : 'bad'); fb.innerHTML = r.msg || '❌ Nog niet juist. Probeer opnieuw of klik op toon.'; } }
    ok.addEventListener('click', chk);
    show.addEventListener('click', ()=>{ reg.innerHTML = stp.show; fb.className = 'fb'; fb.textContent = ''; next(); });
    const f = reg.querySelector('input'); if(f) f.focus();
  });
  return box;
}

/* ============================================================
   TOON MIJ HOE: een uitwerking regel per regel, met Vorige en Volgende
   lines: [[wiskunde, uitleg], ...]
   ============================================================ */
function stapUitleg(parent, lines, o={}){
  const wrap = el('div', 'm4-hoe'); parent.append(wrap);
  const open = el('button', 'btn ghost', '▶ ' + (o.label || 'Toon mij hoe')); open.type = 'button'; wrap.append(open);
  const box = el('div', 'sa m4-sa'); box.hidden = true; wrap.append(box);
  if(o.kop) box.append(el('div', 'm4-sa-kop', o.kop));
  const list = el('div', 'm4-sa-lijst'); box.append(list);
  const ctl = el('div', 'sa-ctl'); const bp = el('button', 'btn ghost', '◀ Vorige stap'), bn = el('button', 'btn', 'Volgende stap ▶'), cnt = el('span', 'sa-cnt');
  [bp, bn].forEach(b => b.type = 'button'); ctl.append(bp, bn, cnt); box.append(ctl);
  let i = 0;
  function go(k, anim){ i = k; list.innerHTML = '';
    lines.slice(0, k+1).forEach(([m, u], j) => { const r = el('div', 'm4-sa-r' + (j===k ? ' now' + (anim ? ' net' : '') : ''), `<span class="m4-sa-m">${m}</span><span class="m4-sa-u">${u||''}</span>`); list.append(r); });
    bp.disabled = k<=0; bn.disabled = k>=lines.length-1; cnt.textContent = `stap ${k+1} van ${lines.length}`; }
  open.addEventListener('click', ()=>{ box.hidden = !box.hidden; open.textContent = (box.hidden ? '▶ ' : '■ ') + (box.hidden ? (o.label || 'Toon mij hoe') : 'Verberg de uitleg'); if(!box.hidden) go(0, true); });
  bp.addEventListener('click', ()=>{ if(i>0) go(i-1, false); });
  bn.addEventListener('click', ()=>{ if(i<lines.length-1) go(i+1, true); });
  return wrap;
}

/* ============================================================
   ANIMATIE IN STAPPEN MET EEN SVG-FIGUUR (handmatig, zoals in module 3)
   cfg: {W, H, steps:[{cap, draw:(t)=>svg}], alt}
   ============================================================ */
const fx = x => Math.round(x*10)/10;
const svgWrap = (W, H, inner, o={}) => `<svg class="mf${o.cls?' '+o.cls:''}" viewBox="0 0 ${W} ${H}" style="max-width:${o.maxw||W*1.2}px" role="img" aria-label="${esc(o.alt||'figuur')}">${inner}</svg>`;
const sT = (x, y, s, cls='t', anc='middle') => `<text class="${cls}" x="${fx(x)}" y="${fx(y)}" text-anchor="${anc}" dominant-baseline="central">${s}</text>`;
/* macht in svg-tekst: grondtal met exponent hoog */
const sPow = (b, e) => `${b}<tspan class="sup" dy="-7">${sg(e)}</tspan><tspan dy="7"> </tspan>`;
/* breuk in svg op (x, y) */
function sQ(x, y, q, cls='v'){ if(q.d===1) return sT(x, y, sg(q.n), cls);
  const w = Math.max(String(Math.abs(q.n)).length, String(q.d).length)*7 + 6; const sx = q.n<0 ? 7 : 0;
  return (q.n<0 ? sT(x - w/2 - 2, y, MIN, cls) : '') + sT(x+sx/2, y-9, Math.abs(q.n), cls) + `<line class="brl" x1="${fx(x-w/2+sx/2)}" y1="${y}" x2="${fx(x+w/2+sx/2)}" y2="${y}"/>` + sT(x+sx/2, y+9.5, q.d, cls); }
function stepFig(parent, cfg){
  const box = el('div', 'sa'); parent.append(box);
  const fig = el('div', 'sa-fig'); const cap = el('div', 'sa-cap'); const row = el('div', 'sa-nums'); const ctl = el('div', 'sa-ctl');
  box.append(fig, cap, row, ctl);
  row.append(el('span', 'sa-lab', 'Ga naar stap:'));
  const nums = cfg.steps.map((_, k) => { const b = el('button', 'btn ghost sa-num', String(k+1)); b.type = 'button'; b.addEventListener('click', ()=>go(k, true)); row.append(b); return b; });
  const bp = el('button', 'btn ghost', '◀ Vorige stap'), bn = el('button', 'btn', 'Volgende stap ▶'), cnt = el('span', 'sa-cnt');
  [bp, bn].forEach(b => { b.type = 'button'; ctl.append(b); }); ctl.append(cnt);
  let i = 0, run = 0;
  const draw = (k, t) => { fig.innerHTML = svgWrap(cfg.W, cfg.H, cfg.steps[k].draw(t), {alt:cfg.alt, maxw:cfg.maxw}); };
  function go(k, anim){ run++; const my = run; i = k;
    cap.innerHTML = cfg.steps.slice(0, k+1).map((s, j) => `<div class="${j===k ? 'now' : 'old'}"><b>${j+1}.</b> ${s.cap}</div>`).join('');
    cnt.textContent = `stap ${k+1} van ${cfg.steps.length}`; bp.disabled = k<=0; bn.disabled = k>=cfg.steps.length-1;
    nums.forEach((b, j) => { b.classList.toggle('on', j===k); b.classList.toggle('seen', j<k); });
    if(anim && !REDUCED_M) tween(cfg.steps[k].ms || 1100, t => { if(my===run) draw(k, t); }); else draw(k, 1);
    if(cfg.onStep) cfg.onStep(k); }
  bp.addEventListener('click', ()=>{ if(i>0) go(i-1, false); });
  bn.addEventListener('click', ()=>{ if(i<cfg.steps.length-1) go(i+1, true); });
  go(cfg.start||0, false);
  return {go};
}
const REDUCED_M = (()=>{ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();
const lerp = (a, b, t) => a + (b-a)*t;

/* ---------- reeks vragen met a), b), ... in een raster ---------- */
function reeks(b, n, fn, o={}){ const g = el('div', 'm4-items' + (o.een ? ' een' : '')); b.append(g); for(let i=0; i<n; i++) fn(g, i, 'abcdefghij'[i] + ')'); return g; }
const WN = [['w', 'Waar'], ['n', 'Niet waar']];
const VGL = [['<', '&lt;'], ['=', '='], ['>', '&gt;']];

/* ============================================================
   STIJL VAN DEZE MODULE
   ============================================================ */
(function(){
  const css = `
  .br{display:inline-flex; flex-direction:column; align-items:center; vertical-align:middle; line-height:1.05; margin:0 .1em}
  .br-t{border-bottom:2px solid currentColor; padding:0 .15em .06em; display:inline-flex; align-items:center; justify-content:center; gap:.15em; align-self:stretch}
  .br-n{padding:.06em .15em 0; display:inline-flex; align-items:center; gap:.15em}
  .br > .br-t, .br > .br-n{font-size:.85em}
  .br.mini{font-size:.62rem; font-weight:900} .br.mini > .br-t, .br.mini > .br-n{font-size:1em; padding:0 .2em}
  .m4-m{display:inline-flex; align-items:center; white-space:nowrap}
  .m4-m > .m4-sup, .m4-mv > .m4-exp{align-self:flex-start; font-size:.7em; font-weight:700; margin-left:.05em; line-height:1; position:relative; top:-.15em}
  .m4-par{font-size:1.75em; font-weight:300; line-height:1; transform:scaleX(.8); display:inline-block}
  .m4-is{margin:0 .25em}
  .m4-line{font-size:1.3rem; font-weight:700; display:flex; flex-wrap:wrap; align-items:center; gap:.15rem .25rem; line-height:1.3; font-variant-numeric:tabular-nums}
  .m4-line .q-num{font-size:1rem}
  .m4-line .txt{font-size:1rem; font-weight:400}
  .m4-q{display:flex; flex-wrap:wrap; align-items:center; gap:.35rem .8rem; padding:.75rem .2rem .45rem; margin:0}
  .m4-g{display:inline-flex; align-items:center}
  .m4-q > .q-act{margin:0; flex-basis:100%; display:flex; flex-wrap:wrap; gap:.35rem; align-items:center}
  .m4-q > .q-act .btn{padding:.35rem .8rem; font-size:.92rem}
  .m4-q > .fb, .m4-q > .sol, .m4-q > .hint-gr{flex-basis:100%; margin:0}
  .m4-q > .fb:empty{display:none}
  .m4-q.stapel{flex-direction:column; align-items:flex-start}
  .m4-items{display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap:0 1.4rem; align-items:start}
  .m4-items.een{grid-template-columns:1fr}
  .m4-w{display:inline-flex; align-items:center; gap:.2rem; vertical-align:middle}
  .m4-slim{display:inline-flex; align-items:center; gap:.15rem}
  .m4-in{--w:3.4rem; width:var(--w); height:2.3rem; padding:.15rem .3rem; border:2px solid var(--border); border-radius:.5rem; font:inherit; font-size:1.15rem; font-weight:700; text-align:center; background:var(--card); color:var(--ink); font-variant-numeric:tabular-nums; max-width:12rem}
  .m4-in:focus{outline:none; border-color:var(--orange); box-shadow:0 0 0 3px var(--or-soft)}
  .m4-in.b{--w:2.9rem}
  .m4-in.g{--w:3.2rem}
  .m4-in.ex{--w:2.2rem; height:1.75rem; font-size:.95rem; border-color:var(--orange); padding:.05rem .15rem}
  .m4-in.br-get{height:1.85rem; font-size:1.02rem}
  .br.br-in > .br-t{border-bottom-width:3px; padding:0 .1em 3px} .br.br-in > .br-n{padding-top:3px}
  .br.br-in > .br-t, .br.br-in > .br-n{font-size:1rem}
  .m4-w.ok .m4-in{border-color:var(--ok); background:var(--ok-bg)} .m4-w.bad .m4-in{border-color:var(--bad); background:var(--bad-bg)}
  .m4-w.ok .m4-teken{border-color:var(--ok)} .m4-w.bad .m4-teken{border-color:var(--bad)}
  .m4-brk{border:0; background:transparent; padding:.2rem; margin-left:.15rem; cursor:pointer; color:#9bb8ba; display:inline-flex; align-self:center; border-radius:.3rem}
  .m4-brk:hover, .m4-brk:focus-visible{color:var(--accent-dark)}
  .card.m4-geenbrk .m4-w .m4-brk{display:none}
  .bank-line .blank.m4-expblank{min-width:4.2rem; min-height:1.6rem; font-size:.85em; align-self:flex-start; margin-left:-.35rem; transform:translateY(-.55rem)}
  .m4-brk svg{width:12px; height:16px; fill:none; stroke:currentColor; stroke-width:1.5}
  .m4-brk[aria-pressed="true"]{color:var(--accent-dark)}
  .m4-wi{display:inline-flex; align-items:center; vertical-align:middle} .m4-wi .br-n{padding:.55rem .2rem .1rem} .m4-wi-in{display:inline-flex; align-items:center; gap:.2rem}
  .m4-wi.bad > .m4-brk{color:var(--bad); outline:2px solid var(--bad); outline-offset:1px}
  .m4-teken{display:inline-flex; flex-direction:column; border:2px dashed var(--accent-dark); border-radius:.45rem; overflow:hidden; height:2.6rem; width:1.9rem; flex:none; background:var(--card)}
  .m4-teken.gekozen{border-style:solid; border-color:var(--border)}
  .m4-teken button{flex:1; border:0; margin:0; padding:0; background:transparent; color:var(--ink-soft); font:inherit; font-size:1.05rem; font-weight:900; line-height:1; cursor:pointer}
  .m4-teken button + button{border-top:1px solid var(--border)}
  .m4-teken button:hover{background:var(--or-soft); color:var(--ink)}
  .m4-teken button[aria-pressed="true"]{background:var(--tq); color:var(--ink)}
  .m4-teken button:focus-visible{outline:2px solid var(--orange); outline-offset:-2px}
  .m4-teken.gekozen button[aria-pressed="false"]{color:var(--border)}
  .m4-teken.plus-weg button[data-w="+"]{color:transparent; background:transparent}
  .m4-teken.plus-weg.net button[data-w="+"]{animation:m4-plus-weg 1.2s ease-in forwards}
  @keyframes m4-plus-weg{0%, 45%{color:var(--ink); background:var(--tq)} 100%{color:transparent; background:transparent}}
  .m4-knop{display:inline-flex; flex-direction:column; gap:2px; margin-right:.1rem}
  .m4-knop button{font:inherit; font-size:.8rem; font-weight:900; line-height:1; min-width:2.1rem; height:1.45rem; padding:0 .2rem; border:1.5px dashed var(--accent-dark); border-radius:.35rem; background:var(--card); color:var(--ink-soft); cursor:pointer; display:inline-flex; align-items:center; justify-content:center}
  .m4-knop button:has(.br){height:1.6rem}
  .m4-knop button:hover{background:var(--or-soft); color:var(--ink)}
  .m4-knop button[aria-pressed="true"]{background:var(--tq); color:var(--ink); border-style:solid; border-color:var(--tq)}
  .m4-mv{display:inline-flex; align-items:center}
  .m4-hk{font-size:2rem; font-weight:300; line-height:1; color:var(--accent-dark)}
  .m4-mv > .m4-exp{font-size:1rem; top:0; transform:translateY(-.5rem)}
  .m4-m > .m4-sup:has(.m4-w){top:0; transform:translateY(-.5rem)}
  .m4-sup .m4-in.ex{height:1.5rem; font-size:.88rem; --w:2rem}
  .m4-inv > .br-t{font-size:1.15rem} .m4-inv > .br-n{font-size:1rem}
  .br-n:has(.m4-mv){padding-top:.6rem}
  .m4-naast{display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:1rem; align-items:start}
  .m4-naast.breed-l{grid-template-columns:minmax(0, 1.2fr) minmax(0, 1fr)}
  @media (max-width:820px){ .m4-naast, .m4-naast.breed-l{grid-template-columns:1fr} }
  .m4-vis{border:1.5px solid var(--border); border-radius:.8rem; padding:.5rem; background:var(--zone-bg)}
  .m4-regel{border:2px solid var(--tq); background:var(--tq-soft); border-radius:.7rem; padding:.45rem .8rem; margin:.5rem 0; font-size:1.05rem}
  .m4-regel .m4-line{font-size:1.25rem}
  .m4-regel.nieuw{animation:m4-pop .5s ease-out}
  @keyframes m4-pop{0%{transform:scale(.92); opacity:0} 100%{transform:none; opacity:1}}
  .m4-hoe{margin:.3rem 0 .4rem}
  .m4-sa-kop{font-weight:700; margin-bottom:.3rem}
  .m4-sa-lijst{display:flex; flex-direction:column; gap:.25rem}
  .m4-sa-r{display:grid; grid-template-columns:minmax(10rem, max-content) minmax(0, 1fr); gap:.2rem 1rem; align-items:center; padding:.2rem .5rem; border-radius:.5rem; color:var(--ink-soft)}
  .m4-sa-r.now{background:var(--accent-soft); color:var(--ink)}
  .m4-sa-r.net{animation:m4-pop .45s ease-out}
  .m4-sa-m{font-size:1.25rem; font-weight:700; display:inline-flex; align-items:center; flex-wrap:wrap; gap:.15rem}
  .m4-sa-u{font-size:.98rem}
  @media (max-width:600px){ .m4-sa-r{grid-template-columns:1fr} }
  .sa{border:2px solid var(--accent); border-radius:12px; padding:.6rem; margin:.5rem 0; background:var(--card)}
  .sa-cap{min-height:2.4em; padding:.45rem .7rem; border-radius:10px; background:var(--accent-soft); font-size:1.02rem; line-height:1.45}
  .sa-cap .old{color:var(--ink-soft); font-size:.92rem} .sa-cap .now{font-weight:600}
  .sa-ctl{display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; margin-top:.5rem}
  .sa-cnt{color:var(--ink-soft); font-size:.9rem; margin-left:auto}
  .sa-nums{display:flex; flex-wrap:wrap; gap:.35rem; align-items:center; padding:.45rem .1rem 0} .sa-lab{font-size:.85rem; font-weight:700; margin-right:.2rem} .sa-num{min-width:2.4rem; padding:.2rem .5rem} .sa-num.seen{opacity:.75}
  .btn.ghost.on, .btn.ghost.on:hover{--fill:var(--accent-dark); background:var(--accent-dark); color:#fff}
  .mf{display:block; width:100%; margin:.2rem auto; user-select:none; -webkit-user-select:none; font-family:var(--f-body)}
  .mf text{fill:var(--ink); font-weight:700}
  .mf .t{font-size:16px} .mf .v{font-size:14px} .mf .k{font-size:12px; font-weight:400; fill:var(--ink-soft)} .mf .big{font-size:20px}
  .mf .sup{font-size:.68em}
  .mf .brl{stroke:var(--ink); stroke-width:1.4}
  .mf .trede{fill:var(--tq-soft); stroke:var(--accent-dark); stroke-width:1.5}
  .mf .trede.nu{fill:var(--or-soft); stroke:var(--orange); stroke-width:2.5}
  .mf .trede.af{fill:var(--tq); fill-opacity:.35}
  .mf .pijl{fill:none; stroke:var(--orange); stroke-width:2; marker-end:url(#m4pijl)}
  .mf .pijlk{fill:var(--orange)}
  .mf .op{fill:#9a5b00; font-size:12.5px}
  .mf .pop{animation:m4-pop .5s ease-out; transform-box:fill-box; transform-origin:center}
  .mf .tegel{stroke:var(--accent-dark); stroke-width:1.6; fill:var(--tq-soft)}
  .mf .tegel.b{fill:var(--or-soft); stroke:#c98a00}
  .mf .tegel.c{fill:var(--tq); fill-opacity:.4}
  .mf .schaal{fill:var(--card); stroke:var(--ink-soft); stroke-width:2}
  .mf .agar{fill:#f6efcf} .mf .kol{fill:#7fb069; stroke:#4f7d3c; stroke-width:1.2}
  .mf .lab{font-size:17px; font-weight:700; fill:#1f3d14; stroke:#fff; stroke-width:3.5px; paint-order:stroke; stroke-linejoin:round} .mf .labl{stroke:#1f3d14; stroke-width:1.8}
  .mf .as{stroke:var(--ink-soft); stroke-width:1.6; fill:none} .mf .tik{stroke:var(--ink-soft); stroke-width:1.2}
  .mf .tiknu{fill:var(--orange)}
  .mf .muted{fill:var(--ink-soft)}
  .m4-schuif{width:100%; accent-color:var(--orange); margin:.2rem 0}
  .m4-tijd{display:flex; justify-content:space-between; align-items:center; gap:.5rem; font-weight:700; flex-wrap:wrap}
  .m4-opp{font-size:1.25rem; font-weight:700; display:flex; align-items:center; gap:.3rem; min-height:3rem; flex-wrap:wrap}
  .m4-tabel{border-collapse:collapse; margin:.3rem 0; font-size:1.05rem}
  .m4-tabel th, .m4-tabel td{border:1.5px solid var(--border); padding:.25rem .55rem; text-align:center}
  .m4-tabel th{background:var(--accent-soft)}
  .hint-gr{margin:.2rem 0 .3rem} .hint-stap{margin:.3rem 0 .4rem; padding:.5rem .8rem .5rem 2rem; border-radius:10px; background:var(--or-soft)} .hint-stap li{margin:.25rem 0}
  .hint-regel{font-weight:700; margin:.15rem 0 .2rem; display:flex; flex-wrap:wrap; align-items:center; gap:.3rem; font-size:1.12rem} .hint-regel .sm-btn{padding:.15rem .7rem; font-size:.85rem} .hint-stap .fb{margin:.1rem 0 .2rem; min-height:0} .hint-stap .fb:empty{display:none}
  .hint-fig{margin:.2rem 0 .5rem} .hint-fig summary{cursor:pointer; font-weight:700; color:var(--accent-dark)}
  .hint-in{padding:.4rem .6rem; border-radius:10px; background:var(--or-soft)}
  .cheat .m4-line{font-size:1.1rem}
  .m4-wn .q-text{font-size:1.2rem; font-weight:700}
  .ord-pool{display:flex; flex-direction:column; gap:.35rem; margin:.3rem 0 .6rem}
  .ord-list{margin:.3rem 0; padding-left:1.6rem; display:flex; flex-direction:column; gap:.35rem}
  .ord-lab{font-weight:700; color:var(--accent-dark); margin-top:.3rem}
  .ord-step{font:inherit; text-align:left; padding:.45rem .7rem; border:2px solid var(--accent); border-radius:10px; background:var(--card); color:var(--ink); cursor:pointer; width:100%; display:flex; flex-wrap:wrap; align-items:center; gap:.2rem}
  .ord-step:hover{border-color:var(--orange); background:var(--or-soft)}
  .ord-step.in{background:var(--accent-soft)}
  .ord-step.good{border-color:var(--ok); background:var(--ok-bg)} .ord-step.wrong{border-color:var(--bad); background:var(--bad-bg)}
  .ord-empty{color:var(--ink-soft); list-style:none; margin-left:-1.4rem}
  .m4-wn{padding:.35rem 0; margin:0}
  .m4-wn .choices{margin:.25rem 0 0}
  .m4-wn .fb:empty{display:none}
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* ============================================================
   EXTRA BOUWSTENEN: kommagetallen, wetenschappelijke schrijfwijze,
   meerkeuze met meerdere juiste antwoorden, sorteren, minnen wegklikken
   ============================================================ */
const SEC = {};
/* uitkomst die ook als kommagetal mag (machten van 0,1, getalwaarde met kommagetallen) */
function chkUD(v, T, fout){ v = v || {}; const t = nrm(v.t||'').replace('.', ',');
  if(v.n==null && t.includes(',')){ let s = t;
    if(!v.z){ if(!v.s) return {info:true, msg:'Kies eerst het teken: klik op + of op − in het tekenvak.'}; if(v.s==='-') s = '-' + s; }
    const d = qDec(s); if(!d) return {info:true, msg:'Dat getal kan ik niet lezen.'};
    if(qEq(d, T)) return {ok:true}; for(const [F, m] of (fout||[])) if(qEq(d, F)) return {ok:false, msg:m}; return {ok:false}; }
  return chkU(v, T, fout); }
/* getal uit een gewoon vak: geheel getal of kommagetal, ook met spaties (12 500) */
function rdG(s){ const t = nrm(s||'').replace('.', ','); if(/^-?\d+$/.test(t)) return Q(+t); if(/^-?\d*,\d+$/.test(t)) return qDec(t); return null; }
/* waarde als kommagetal-tekst: 3/4 -> 0,75 ; enkel voor noemers met 2 en 5 */
function qKomma(q){ let n = Math.abs(q.n), d = q.d, k = 0;
  while(d > 1){ if(d % 2===0){ n *= 5; d /= 2; } else if(d % 5===0){ n *= 2; d /= 5; } else return null; k++; }
  let s = String(n); if(k){ s = s.padStart(k+1, '0'); s = s.slice(0, -k) + ',' + s.slice(-k); s = s.replace(/,?0+$/, ''); }
  const [a, c] = s.split(','); return (q.n<0 ? MIN : '') + a.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (c ? ',' + c : ''); }
/* getal met spaties per drie cijfers voor het scherm: 1250000 -> 1 250 000 */
const dz = x => { const s = String(x); const [a, b] = s.split(','); return a.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (b ? ',' + b : ''); };
/* wetenschappelijke schrijfwijze: mantisse als tekst ('3,2'), exponent als getal */
const wH = (m, e) => `<span class="m4-g">${sg(m)} · ${mH('10', e)}</span>`;
/* controle: mantisse-vak en exponent-vak samen, T = exacte waarde */
function chkW(Vm, Ve, T){
  const m = rdG((Vm||{}).t), x = linP((Ve||{}).t||'');
  if(!m) return {info:true, msg:'Typ in het eerste vak een getal, bijvoorbeeld 3,2.', fields:{}};
  if(!x || !linNum(x)) return {info:true, msg:'Typ een geheel getal als exponent.', fields:{}};
  const v = qMul(m, qPow(Q(10), x.k)); const am = Q(Math.abs(m.n), m.d);
  const wet = qCmp(am, Q(1))>=0 && qCmp(am, Q(10))<0;
  if(qEq(v, T)) return wet ? {ok:true, fields:{a:true, b:true}} : {ok:false, msg:'De waarde klopt, maar dit is geen wetenschappelijke schrijfwijze: voor de komma staat precies één cijfer dat geen 0 is.', fields:{a:false, b:false}};
  if(qEq(qNeg(v), T)) return {ok:false, msg:'Kijk naar het teken van het getal.', fields:{a:false, b:true}};
  if(qEq(qMul(m, qPow(Q(10), -x.k)), T)) return {ok:false, msg:'Kijk naar het teken van de exponent: is het getal groot (positieve exponent) of klein (negatieve exponent)?', fields:{a:true, b:false}};
  return {ok:false, fields:{a:false, b:false}};
}
/* exacte waarde m · 10^e uit een mantisse-tekst */
const wQ = (m, e) => qMul(qDec(String(m).includes(',') ? m : m + ',0'), qPow(Q(10), e));

/* ---------- meerkeuze met meerdere juiste antwoorden ---------- */
function multiKeuze(parent, st, save, id, q){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {sel:[]});
  const row = el('div', 'q m4-mk'); parent.append(row);
  row.append(el('div', 'q-text', (q.nr ? `<span class="q-num">${q.nr}</span>` : '') + q.html));
  const wrap = el('div', 'choices'); row.append(wrap);
  const btns = q.opts.map(([v, lab]) => { const b = el('button', 'opt m4-mk-opt', lab); b.type = 'button'; b.dataset.val = v; b.setAttribute('aria-pressed', String(s.sel.includes(v))); wrap.append(b);
    b.addEventListener('click', ()=>{ if(b.disabled) return; const i = s.sel.indexOf(v); if(i>=0) s.sel.splice(i, 1); else s.sel.push(v); b.setAttribute('aria-pressed', String(s.sel.includes(v))); fb.textContent = ''; btns.forEach(x => x.classList.remove('good', 'wrong')); save(); }); return b; });
  const act = el('div', 'q-act'); const btn = el('button', 'btn', 'Controleer'); btn.type = 'button'; act.append(btn); row.append(act);
  const fb = el('div', 'fb'); row.append(fb);
  const goed = () => { const ok = q.opts.filter(o => o[2]).map(o => o[0]); return ok.length===s.sel.length && ok.every(v => s.sel.includes(v)); };
  function run(silent){ if(!s.sel.length){ fb.className = 'fb info'; fb.textContent = 'Kies eerst minstens één antwoord.'; return; }
    const ok = goed(); btns.forEach(b => { const o = q.opts.find(x => x[0]===b.dataset.val); b.classList.toggle('good', s.sel.includes(b.dataset.val) && o[2]); b.classList.toggle('wrong', s.sel.includes(b.dataset.val) && !o[2]); });
    const mist = q.opts.filter(o => o[2] && !s.sel.includes(o[0])).length;
    fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = ok ? '✅ Juist! ' + (q.why||'') : '❌ Nog niet juist. ' + (mist ? `Er ${mist===1 ? 'is nog één juist antwoord' : 'zijn nog ' + mist + ' juiste antwoorden'} dat je niet koos. ` : '') + (q.whyBad||'');
    s.checked = true; save(); if(!silent) CLres(qid, ok); }
  btn.addEventListener('click', ()=>run());
  if(quiz){ btn.hidden = true; quiz.push({pts:q.pts||1, grade:goed, reveal:ok=>{ btns.forEach(b => { const o = q.opts.find(x => x[0]===b.dataset.val); if(o[2]) b.classList.add('good'); else if(s.sel.includes(b.dataset.val)) b.classList.add('wrong'); }); }, lock:()=>btns.forEach(b => b.disabled = true)}); }
  else if(s.checked) run(true);
}

/* ---------- sorteren in vakken: tik een kaartje aan, tik dan een vak ---------- */
function sorteer(parent, st, save, id, q){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {in:{}});
  const box = el('div', 'm4-sort'); parent.append(box);
  const pool = el('div', 'm4-sort-pool'); box.append(pool);
  const bins = el('div', 'm4-sort-bins'); box.append(bins);
  const binEl = {}; q.bins.forEach(([k, lab]) => { const d = el('div', 'm4-sort-bin'); d.dataset.k = k; d.append(el('div', 'm4-sort-lab', lab)); const z = el('div', 'm4-sort-zone'); d.append(z); bins.append(d); binEl[k] = z;
    d.addEventListener('click', e=>{ if(e.target.closest('.m4-sort-chip')) return; if(sel!=null){ s.in[sel] = k; sel = null; save(); paint(); } }); });
  const act = el('div', 'q-act'); const btn = el('button', 'btn', 'Controleer'); btn.type = 'button'; act.append(btn); box.append(act);
  const fb = el('div', 'fb'); box.append(fb);
  let sel = null, locked = false;
  function paint(){ pool.innerHTML = ''; Object.values(binEl).forEach(z => z.innerHTML = ''); fb.textContent = '';
    q.items.forEach(([h], i) => { const c = el('button', 'm4-sort-chip' + (sel===i ? ' sel' : ''), h); c.type = 'button'; c.dataset.i = i;
      c.addEventListener('click', ()=>{ if(locked) return; if(s.in[i]!=null){ delete s.in[i]; sel = null; save(); paint(); return; } sel = sel===i ? null : i; paint(); });
      (s.in[i]!=null ? binEl[s.in[i]] : pool).append(c); });
    if(!pool.children.length) pool.append(el('span', 'm4-sort-leeg', 'Alle kaartjes liggen in een vak.')); }
  const goed = () => q.items.every(([, k], i) => s.in[i]===k);
  function run(silent){ if(q.items.some((_, i) => s.in[i]==null)){ fb.className = 'fb info'; fb.textContent = 'Leg eerst alle kaartjes in een vak.'; return; }
    const fout = q.items.filter(([, k], i) => s.in[i]!==k).length;
    [...box.querySelectorAll('.m4-sort-zone .m4-sort-chip')].forEach(c => { const i = +c.dataset.i; c.classList.add(s.in[i]===q.items[i][1] ? 'good' : 'wrong'); });
    fb.className = 'fb ' + (fout ? 'bad' : 'ok'); fb.innerHTML = fout ? `❌ ${fout===1 ? 'Eén kaartje ligt' : fout + ' kaartjes liggen'} nog in het verkeerde vak. Tik een kaartje aan om het terug te leggen. ${q.whyBad||''}` : '✅ Juist! ' + (q.why||'');
    s.checked = true; save(); if(!silent) CLres(qid, !fout); }
  btn.addEventListener('click', ()=>run());
  paint();
  if(quiz){ btn.hidden = true; quiz.push({pts:q.pts||1, grade:goed, reveal:()=>run(true), lock:()=>{ locked = true; }}); }
  else if(s.checked) run(true);
}

/* ---------- minnen per twee wegklikken (zoals rekenvaardigheid 6) ---------- */
/* factoren: array van html-stukjes; neg: welke factoren een minteken hebben */
function minnenWeg(parent, st, save, id, q){
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {weg:[], open:null, teken:null});
  const box = el('div', 'q m4-min'); parent.append(box);
  if(q.nr || q.html) box.append(el('div', 'q-text', (q.nr ? `<span class="q-num">${q.nr}</span>` : '') + (q.html||'')));
  const rij = el('div', 'm4-min-rij'); box.append(rij);
  const uitleg = el('div', 'm4-min-uitleg'); box.append(uitleg);
  const kies = el('div', 'choices'); box.append(kies);
  const fb = el('div', 'fb'); box.append(fb);
  const nNeg = q.neg.filter(Boolean).length;
  function paint(){ rij.innerHTML = '';
    q.fac.forEach((h, i) => { if(i) rij.append(el('span', 'm4-min-x', '·'));
      const f = el('span', 'm4-min-f');
      if(q.neg[i]){ const m = el('button', 'm4-min-m' + (s.weg.includes(i) ? ' weg' : '') + (s.open===i ? ' open' : ''), MIN); m.type = 'button'; m.setAttribute('aria-label', 'minteken van factor ' + (i+1));
        m.addEventListener('click', ()=>klik(i)); f.append('(', m, el('span', '', h), ')'); }
      else f.innerHTML = h;
      rij.append(f); });
    const over = nNeg - s.weg.length;
    uitleg.innerHTML = s.weg.length ? `${s.weg.length/2} ${s.weg.length===2 ? 'paar' : 'paren'} minnen weggeklikt: ${MIN} · ${MIN} = +. Nog ${over} ${over===1 ? 'minteken' : 'mintekens'} over.` : '';
    kies.hidden = over > 1;
  }
  function klik(i){ if(s.weg.includes(i) || s.teken) return;
    if(s.open==null){ s.open = i; } else if(s.open===i){ s.open = null; } else { s.weg.push(s.open, i); s.open = null; }
    save(); paint(); }
  [['+', 'Het product is positief'], ['-', 'Het product is negatief']].forEach(([v, lab]) => { const b = el('button', 'opt', lab); b.type = 'button'; b.dataset.val = v; kies.append(b);
    b.addEventListener('click', ()=>{ s.teken = v; save(); check(false); }); });
  function check(silent){ const ans = nNeg % 2 ? '-' : '+'; const ok = s.teken===ans;
    kies.querySelectorAll('button').forEach(b => { b.classList.remove('chosen', 'good', 'wrong'); if(b.dataset.val===s.teken) b.classList.add('chosen', ok ? 'good' : 'wrong'); });
    fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = ok ? `✅ Juist! ${nNeg} ${nNeg===1 ? 'minteken' : 'mintekens'}: ${nNeg%2 ? 'er blijft er één over, dus negatief.' : 'ze vallen per twee weg, dus positief.'} ${q.why||''}` : '❌ Niet juist. Tel de mintekens die overblijven.';
    if(!silent) CLres(qid, ok); if(ok && q.onOk) q.onOk(); }
  paint(); if(s.teken) check(true);
}

/* ---------- toestelscherm (TI-30XB-achtig) ---------- */
const scherm = (boven, onder) => `<span class="m4-scherm"><span class="m4-scherm-b">${boven}</span><span class="m4-scherm-o">${onder}</span></span>`;

(function(){ const css = `
  .m4-mk .choices{display:flex; flex-wrap:wrap; gap:.4rem}
  .m4-mk-opt[aria-pressed="true"]{background:var(--accent-soft); border-color:var(--accent-dark)}
  .m4-mk-opt .m4-m, .m4-mk-opt .m4-g{font-size:1.15rem}
  .m4-sort-pool{display:flex; flex-wrap:wrap; gap:.4rem; min-height:2.8rem; padding:.5rem; border:2px dashed var(--tq); border-radius:.7rem; background:var(--zone-bg)}
  .m4-sort-leeg{color:var(--ink-soft); font-size:.9rem; align-self:center}
  .m4-sort-bins{display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:.6rem; margin:.6rem 0}
  .m4-sort-bin{border:2px solid var(--tq); border-radius:.7rem; padding:.4rem; min-height:6rem; cursor:pointer; background:var(--card)}
  .m4-sort-bin:hover{border-color:var(--orange); background:var(--or-soft)}
  .m4-sort-lab{font-weight:700; color:var(--accent-dark); margin-bottom:.3rem}
  .m4-sort-zone{display:flex; flex-wrap:wrap; gap:.35rem}
  .m4-sort-chip{font:inherit; font-size:1.15rem; font-weight:700; padding:.25rem .6rem; border:2px solid var(--accent); border-radius:.6rem; background:var(--card); color:var(--ink); cursor:pointer; display:inline-flex; align-items:center}
  .m4-sort-chip.sel{border-color:var(--orange); background:var(--or-soft); box-shadow:0 0 0 3px var(--or-soft)}
  .m4-sort-chip.good{border-color:var(--ok); background:var(--ok-bg)} .m4-sort-chip.wrong{border-color:var(--bad); background:var(--bad-bg)}
  .m4-min-rij{display:flex; flex-wrap:wrap; align-items:center; gap:.25rem; font-size:1.35rem; font-weight:700; margin:.3rem 0}
  .m4-min-f{display:inline-flex; align-items:center}
  .m4-min-x{margin:0 .1rem}
  .m4-min-m{font:inherit; font-weight:900; border:2px solid transparent; border-radius:.4rem; background:var(--or-soft); color:var(--ink); padding:0 .25rem; cursor:pointer; line-height:1.2}
  .m4-min-m:hover{border-color:var(--orange)}
  .m4-min-m.open{border-color:var(--orange); background:var(--orange)}
  .m4-min-m.weg{background:transparent; color:var(--ink-soft); text-decoration:line-through; text-decoration-color:var(--bad); text-decoration-thickness:3px; cursor:default}
  .m4-min-uitleg{color:var(--ink-soft); font-size:.95rem; margin:.2rem 0 .3rem}
  .m4-scherm{display:inline-flex; flex-direction:column; align-items:flex-end; min-width:11rem; padding:.35rem .6rem; border-radius:.4rem; background:#c9d6c3; color:#1d2a1a; font-family:ui-monospace, Consolas, monospace; font-size:1.15rem; font-weight:700; border:3px solid #55605a; line-height:1.25}
  .m4-scherm-b{align-self:flex-start; font-size:.95rem}
  .m4-ladder{display:flex; flex-direction:column; gap:.2rem}
  .q-text .br:has(input) > .br-t{padding-top:.45em; padding-bottom:.2em} .q-text .br:has(input) > .br-n{padding-top:.55em}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* ============================================================
   VRIJ ANTWOORDVAK {{x:k}}: de leerling bouwt zelf het antwoord op, zoals op papier:
   factoren, exponenten, haakjes (rond een getal, een product of een breuk) en breuken,
   en zoveel regels (tussenstappen) als nodig. Controle per regel:
   juist / bijna juist (juiste tussenstap, nog niet uitgewerkt) / fout.
   knopen: rij {k:'row', f:[factor]} · breuk {k:'frac', t:rij, n:rij}
           factor: getal/letter {k:'a', s, e} of haakjes {k:'g', b:rij|breuk, e}  (e = null: geen exponent)
   v = {r:[{b:rij|breuk}]}
   ============================================================ */
const VX = {};
VX.A = (s='') => ({k:'a', s, e:null});
VX.R = (...f) => ({k:'row', f:f.length ? f : [VX.A()]});
/* ---------- rekenen met eentermvormen {c:Q, v:{letter:exponent}} ---------- */
VX.mono = (c, v={}) => ({c, v});
VX.mul = (a, b) => { const v = Object.assign({}, a.v); for(const k in b.v){ v[k] = (v[k]||0) + b.v[k]; if(!v[k]) delete v[k]; } return VX.mono(qMul(a.c, b.c), v); };
VX.pow = (a, n) => { const v = {}; for(const k in a.v){ if(a.v[k]*n) v[k] = a.v[k]*n; } return VX.mono(qPow(a.c, n), v); };
VX.inv = a => VX.pow(a, -1);
VX.eq = (a, b) => { if(!qEq(a.c, b.c)) return false; const ks = new Set([...Object.keys(a.v), ...Object.keys(b.v)]); for(const k of ks) if((a.v[k]||0)!==(b.v[k]||0)) return false; return true; };
const isNum = s => /^-?\d+$/.test(s);
/* doel maken: xm(getal, {letter:exponent}) · fout-exponenten van één letter omzetten */
const xm = (c, v={}) => VX.mono(typeof c==='object' ? c : Q(c), Object.fromEntries(Object.entries(v).filter(([, e]) => e)));
const eK = e => typeof e==='object' ? e.k : e;
const foutM = (x, F, c=1) => (F||[]).map(([e, m]) => [xm(c, {[x]:eK(e)}), m]);
/* ---------- een regel lezen ---------- */
VX.atom = s => { s = nrm(s).replace(/\./g, ',');
  if(s==='-') return VX.mono(Q(-1));
  if(/^-?\d+$/.test(s)) return VX.mono(Q(+s));
  if(/^-?\d*,\d+$/.test(s)) return VX.mono(qDec(s));
  if(/^-?[a-z]$/i.test(s)) return VX.mono(Q(s[0]==='-' ? -1 : 1), {[s.slice(-1).toLowerCase()]:1});
  return null; };
VX.val = node => {
  if(node.k==='row'){ let r = VX.mono(Q(1)); for(const f of node.f){ const x = VX.val(f); if(x.err) return x; r = VX.mul(r, x); } return r; }
  if(node.k==='frac'){ const t = VX.val(node.t); if(t.err) return t; const n = VX.val(node.n); if(n.err) return n; if(n.c.n===0) return {err:'De noemer kan geen 0 zijn.'}; return VX.mul(t, VX.inv(n)); }
  let b;
  let min = false; /* −3² en −a²: het minteken staat buiten de macht */
  if(node.k==='a'){ let s = nrm(node.s||''); if(!s) return {err:'Er staat nog een leeg vakje.'}; if(node.e!=null && s.length>1 && s[0]==='-'){ min = true; s = s.slice(1); }
    b = VX.atom(s); if(!b) return {err:`<b>${s}</b> kan ik niet lezen. Zet elk getal en elke letter in een eigen vakje.`}; }
  else { b = VX.val(node.b); if(b.err) return b; }
  if(node.e==null) return b;
  const t = nrm(node.e||''); if(!t) return {err:'Vul de exponent in, of haal hem weg.'}; if(!/^-?\d+$/.test(t)) return {err:'Een exponent is een geheel getal.'};
  if(b.c.n===0 && +t<=0) return {err:'0 tot de macht 0 of tot een negatieve macht bestaat niet.'};
  const r = VX.pow(b, +t); return min ? VX.mul(VX.mono(Q(-1)), r) : r;
};
/* waarom is een regel nog niet volledig uitgewerkt? '' = wel uitgewerkt */
VX.waarom = body => {
  const at = [], gr = []; const walk = n => { if(n.k==='row') n.f.forEach(walk); else if(n.k==='frac'){ walk(n.t); walk(n.n); } else if(n.k==='g'){ gr.push(n); walk(n.b); } else at.push(n); };
  walk(body); const E = n => n.e==null ? null : +nrm(n.e);
  if(at.concat(gr).some(n => E(n)!=null && E(n)<0)) return 'Er staat nog een negatieve exponent. Maak hem positief.';
  if(gr.length) return gr.some(g => g.e!=null && g.b.k==='row' && g.b.f.length===1 && g.b.f[0].k==='a') ? 'Reken de macht nog uit.' : 'Werk de haakjes nog uit.';
  if(at.some(n => isNum(nrm(n.s)) && n.e!=null)) return 'Reken de macht van het getal nog uit.';
  if(at.some(n => n.e!=null && (E(n)===0 || E(n)===1))) return 'Een exponent 0 of 1 schrijf je niet. Werk die nog uit.';
  if(at.some(n => /,/.test(n.s))) return 'Schrijf geen kommagetal, maar een breuk.';
  if(at.some(n => nrm(n.s)==='-')) return 'Schrijf het minteken bij het getal vooraan.';
  const rij = (r, boven) => { const f = r.f, g = f.filter(n => isNum(nrm(n.s))), l = f.filter(n => !isNum(nrm(n.s)));
    if(g.length>1) return 'Vermenigvuldig de getallen nog.';
    if(g.length && f[0]!==g[0]) return 'Zet het getal vooraan.';
    if(g.length && Math.abs(+nrm(g[0].s))===1 && l.length) return 'Een factor 1 schrijf je niet.';
    if(!boven && (g.length && +nrm(g[0].s)<0 || l.some(n => /^-/.test(nrm(n.s))))) return 'Zet het minteken vooraan in de teller.';
    if(l.some((n, i) => /^-/.test(nrm(n.s)) && (g.length || f[0]!==n))) return 'Zet het minteken vooraan.';
    const ls = l.map(n => nrm(n.s).replace('-', '').toLowerCase()); if(new Set(ls).size < ls.length) return 'Dezelfde letter staat er meer dan één keer. Schrijf die als één macht.';
    if(ls.join('') !== [...ls].sort().join('')) return 'Zet de letters in alfabetische volgorde.';
    return ''; };
  if(body.k==='row') return rij(body, true);
  let w = rij(body.t, true) || rij(body.n, false); if(w) return w;
  const n = body.n.f, t = body.t.f;
  if(n.length===1 && isNum(nrm(n[0].s)) && Math.abs(+nrm(n[0].s))===1) return 'Een noemer 1 schrijf je niet.';
  const L = fs => fs.filter(x => !isNum(nrm(x.s))).map(x => nrm(x.s).replace('-', '').toLowerCase());
  if(L(t).some(x => L(n).includes(x))) return 'Dezelfde letter staat in de teller en in de noemer. Vereenvoudig nog.';
  const gt = t.find(x => isNum(nrm(x.s))), gn = n.find(x => isNum(nrm(x.s)));
  if(gt && gn && ggd(+nrm(gt.s), +nrm(gn.s)) > 1) return 'Vereenvoudig de breuk nog.';
  return '';
};
VX.leeg = body => { let leeg = true; const walk = n => { if(n.k==='row') n.f.forEach(walk); else if(n.k==='frac'){ walk(n.t); walk(n.n); } else if(n.k==='g'){ leeg = false; } else if(nrm(n.s||'')) leeg = false; }; walk(body); return leeg; };
VX.ok = v => !!v && Array.isArray(v.r) && v.r.every(L => L && L.b && (L.b.k==='row' || L.b.k==='frac'));
const emptyX = v => !VX.ok(v) || !v.r.length || VX.leeg(v.r[v.r.length-1].b);
/* uitleg bij een foute regel: wat ging er (waarschijnlijk) mis? */
VX.uitleg = (body, val, doel, fout) => {
  const g = fout.find(([w]) => VX.eq(val, w)); if(g) return g[1];
  const minAs = []; const walk = n => { if(n.k==='row') n.f.forEach(walk); else if(n.k==='frac'){ walk(n.t); walk(n.n); } else if(n.k==='g') walk(n.b); else if(n.e!=null && /^-\d+$/.test(nrm(n.s)) && /^\d+$/.test(nrm(n.e||''))) minAs.push(n); };
  walk(body); const minA = minAs[0];
  const tegen = VX.eq(VX.mul(VX.mono(Q(-1)), val), doel);
  if(tegen && minA){ const x = +nrm(minA.s).slice(1), e = +nrm(minA.e);
    return {fix:minAs, tekst:`Het teken klopt niet. Vergeet je haakjes rond een negatief getal? Zonder haakjes hoort de exponent enkel bij het getal, niet bij het minteken.<br>${MIN}${x}<sup>${e}</sup> ${isq} ${MIN}(${Array(e).fill(x).join(' · ')}) ${isq} ${sg(-(x**e))}<br>(${MIN}${x})<sup>${e}</sup> ${isq} ${Array(e).fill(`(${MIN}${x})`).join(' · ')} ${isq} ${sg((-x)**e)}.`}; }
  if(tegen) return 'Het teken klopt niet. Tel de mintekens nog eens: een negatief getal tot een even macht is positief, tot een oneven macht negatief.';
  if(VX.eq(VX.inv(val), doel)) return 'Teller en noemer zijn verwisseld. Moest je de breuk omdraaien, of heb je ze twee keer omgedraaid?';
  const zelfdeL = VX.eq(VX.mono(Q(1), val.v), VX.mono(Q(1), doel.v));
  if(zelfdeL) return 'De letters kloppen, maar het getal niet. Heb je elk getal tot de macht verheven en juist uitgerekend?';
  if(qEq(val.c, doel.c)) return 'Het getal klopt, maar de exponent van een letter niet. Kijk de exponenten nog eens na.';
  return 'Deze regel is niet meer gelijk aan de opgave. Vergelijk hem met de regel erboven.';
};
/* −2³ zonder haakjes, terwijl de uitkomst toevallig klopt (oneven exponent): toch haakjes vragen */
VX.minHaak = body => {
  const as = []; const walk = n => { if(n.k==='row') n.f.forEach(walk); else if(n.k==='frac'){ walk(n.t); walk(n.n); } else if(n.k==='g') walk(n.b); else if(n.e!=null && /^-\d+$/.test(nrm(n.s)) && /^\d+$/.test(nrm(n.e||''))) as.push(n); };
  walk(body); if(!as.length) return null; const x = +nrm(as[0].s).slice(1), e = +nrm(as[0].e);
  return {fix:as, tekst:`Zet haakjes rond een negatief getal met een exponent. Zonder haakjes hoort de exponent enkel bij het getal, niet bij het minteken.<br>${MIN}${x}<sup>${e}</sup> ${isq} ${MIN}(${Array(e).fill(x).join(' · ')})<br>(${MIN}${x})<sup>${e}</sup> ${isq} ${Array(e).fill(`(${MIN}${x})`).join(' · ')}` + (e%2 ? `<br>Hier is de uitkomst toevallig dezelfde omdat de exponent oneven is, maar je bedoelt (${MIN}${x})<sup>${e}</sup>.` : '')};
};
/* controle: doel is een eentermvorm; fout = [[eentermvorm, boodschap], ...] */
function chkX(v, doel, fout=[]){
  if(window.__M4TEST) window.__VXDOEL = doel;
  const lines = VX.ok(v) ? v.r.filter(L => !VX.leeg(L.b)) : [];
  const res = lines.map(L => { const val = VX.val(L.b); if(val.err) return val; const eq = VX.eq(val, doel);
    const mh = eq && VX.minHaak(L.b); if(mh) return {val, eq:false, why:'', uitleg:mh};
    return {val, eq, why:VX.waarom(L.b), uitleg: eq ? '' : VX.uitleg(L.b, val, doel, fout)}; });
  Object.defineProperty(v, '_res', {value:VX.ok(v) ? v.r.map(L => res[lines.indexOf(L)] || null) : [], configurable:true, enumerable:false});
  if(!res.length) return {info:true, msg:'Vul eerst je antwoord in.'};
  const nr = res.length > 1;
  const ek = res.findIndex(r => r.err); if(ek >= 0) return {info:true, msg:(nr ? `Regel ${ek+1}: ` : '') + res[ek].err};
  const fk = res.findIndex(r => !r.eq);
  if(fk >= 0) return {ok:false, msg:(nr ? `Regel ${fk+1} klopt niet. Klik op het rode kruisje voor uitleg.` : (u => typeof u==='string' ? u : u.tekst)(res[fk].uitleg))};
  const last = res[res.length-1];
  if(last.why) return {info:true, msg:`<b>Bijna juist!</b> Dit is een juiste tussenstap. ${last.why} Klik op <b>=</b> en reken verder op een nieuwe regel.`};
  return {ok:true};
}
/* ---------- tekenen en bewerken ---------- */
const XP_IC = '<i>x</i><sup style="color:var(--orange)">n</sup>';
const HK_IC = '(&#8239;)<sup style="color:var(--orange)">n</sup>';
/* knoppen per oefening: {{x:k}} geeft alle knoppen; {{x:k,meh}} enkel maal (m), macht (e), haakjes (h) en breuk (b) die je opgeeft */
const VX_KNOPPEN = 'mehb';
function vrijVak(sp, v, save, onCh, opt){
  const mag = c => (opt || VX_KNOPPEN).includes(c); sp.dataset.knoppen = opt || VX_KNOPPEN;
  if(!VX.ok(v) || !v.r.length) v.r = [{b:VX.R()}];
  let P = new Map(), IN = new Map(), foc = null;
  /* ongedaan maken: na elke wijziging een momentopname */
  const hist = [JSON.stringify(v.r)]; let undoB = null;
  const ch = () => { const t = JSON.stringify(v.r); if(t!==hist[hist.length-1]){ hist.push(t); if(hist.length>200) hist.shift(); } if(undoB) undoB.disabled = hist.length<2; save(); onCh(); };
  const terug = () => { if(hist.length<2) return; hist.pop(); v.r = JSON.parse(hist[hist.length-1]); save(); onCh(); draw(); focus(laatsteA(v.r[v.r.length-1].b)); };
  /* ouders opzoeken: P.get(knoop) = {o, key, i} */
  const index = () => { P = new Map();
    const walk = (n, o, key, i) => { P.set(n, {o, key, i});
      if(n.k==='row') n.f.forEach((f, j) => walk(f, n, 'f', j)); else if(n.k==='frac'){ walk(n.t, n, 't'); walk(n.n, n, 'n'); } else if(n.k==='g') walk(n.b, n, 'b'); };
    v.r.forEach(L => walk(L.b, L, 'b')); };
  const rijVan = n => P.get(n).o;                      /* de rij waarin een factor staat */
  const zet = (n, nieuw) => { const p = P.get(n); if(p.key==='f') p.o.f[p.i] = nieuw; else p.o[p.key] = nieuw; };
  const eersteA = n => n.k==='a' ? n : n.k==='row' ? eersteA(n.f[0]) : n.k==='frac' ? eersteA(n.t) : eersteA(n.b);
  const laatsteA = n => n.k==='a' ? n : n.k==='row' ? laatsteA(n.f[n.f.length-1]) : n.k==='frac' ? laatsteA(n.t) : laatsteA(n.b);
  const haakVan = n => { let p = P.get(n); while(p){ if(p.o.k==='g') return p.o; p = P.get(p.o); } return null; };
  const actiefVak = i => { sp.querySelectorAll('.vx-actief').forEach(x => x.classList.remove('vx-actief')); i.classList.add('vx-actief'); };
  const focus = (n, w='b') => { if(!n) return; foc = {n, w}; const x = IN.get(n); const i = x && (w==='e' && x.e ? x.e : x.b || x.e); if(i){ i.focus({preventScroll:true}); i.setSelectionRange(i.value.length, i.value.length); } };
  /* bewerkingen */
  const nieuweFactor = n => { const r = rijVan(n), a = VX.A(); r.f.splice(P.get(n).i + 1, 0, a); return a; };
  const haakjes = n => { const g = {k:'g', b:VX.R(n), e:''}; zet(n, g); return g; };   /* haakjes rond de factor, met een exponent erachter */
  const breuk = n => { /* de rij van deze factor wordt een teller (of: weer geen breuk) */
    const r = rijVan(n), p = P.get(r);
    if(p.o.k==='frac'){ const fr = p.o; zet(fr, fr.t); return eersteA(fr.t); }
    const fr = {k:'frac', t:r, n:VX.R()}; zet(r, fr); return fr.n.f[0]; };
  let bar = null;
  function draw(){ index(); IN = new Map(); sp.innerHTML = '';
    v.r.forEach((L, li) => { const actief = li===v.r.length-1;
      const row = el('div', 'vx-regel' + (actief ? ' actief' : '')); row.append(el('span', 'm4-is vx-is', '='), rend(L.b, actief)); sp.append(row); });
    balk(); kruisjes(false); }
  /* rood kruisje naast een foute regel; klik erop voor uitleg. Tijdens het werken enkel bij de vorige regels. */
  function kruisjes(alle){
    if(!api.check) return; try{ api.check(); }catch(e){ return; }
    const res = v._res || [];
    sp.querySelectorAll('.vx-regel').forEach((row, li) => { row.querySelectorAll('.vx-x, .vx-uit').forEach(x => x.remove());
      const r = res[li]; if(!r || (!alle && li===v.r.length-1)) return; const U = r.err || (r.eq===false ? r.uitleg : ''); if(!U) return; const tekst = typeof U==='string' ? U : U.tekst, fix = typeof U==='string' ? null : U.fix;
      const x = el('button', 'vx-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'hier is iets fout: toon uitleg'); x.dataset.tip = 'iets fout? klik voor uitleg';
      const box = el('div', 'vx-uit', `<button type="button" class="vx-uit-dicht" aria-label="sluit">×</button>${tekst}`); box.hidden = true;
      x.addEventListener('mousedown', e=>e.preventDefault());
      x.addEventListener('click', ()=>{ box.hidden = !box.hidden; x.setAttribute('aria-expanded', String(!box.hidden)); });
      box.querySelector('.vx-uit-dicht').addEventListener('click', ()=>{ box.hidden = true; });
      if(fix){ const vb = el('button', 'btn vx-verbeter', 'Verbeter deze stap'); vb.type = 'button'; box.append(el('div', 'vx-uit-knop'));
        box.lastChild.append(vb);
        vb.addEventListener('click', ()=>{ index(); fix.forEach(a => { if(!P.has(a)) return; const g = {k:'g', b:VX.R(a), e:a.e, rood:true}; a.e = null; zet(a, g); index(); }); ch(); draw(); focus(laatsteA(v.r[v.r.length-1].b)); }); }
      row.append(x, box); }); }
  /* de knoppenbalk staat op een vaste plek: onder het antwoord, boven Controleer */
  function balk(){
    if(!bar){ bar = el('div', 'vx-balk'); const q = sp.closest('.m4-q'), act = q && q.querySelector(':scope > .q-act'); if(act) q.insertBefore(bar, act); else sp.after(bar); }
    bar.innerHTML = ''; const tools = el('div', 'vx-tools'); bar.append(tools);
    const knop = (ic, lab, tip, fn, cls='') => { const b = el('button', 'vx-k ' + cls, `<span class="vx-ic">${ic}</span>`); b.type = 'button'; b.dataset.tip = lab; b.setAttribute('aria-label', tip);
      b.addEventListener('mousedown', e=>e.preventDefault()); b.addEventListener('click', ()=>{ index(); const n = foc && P.has(foc.n) ? foc.n : laatsteA(v.r[v.r.length-1].b); fn(n); }); tools.append(b); return b; };
    if(mag('m')) knop('<span class="vx-dot">·</span><span class="vx-hok"></span>', 'maal', 'nog een factor erbij (maal)', n => { const a = nieuweFactor(n); ch(); draw(); focus(a); });
    if(mag('e')) knop(XP_IC, 'macht', 'exponent bij het actieve vakje', n => { if(n.e==null){ n.e = ''; ch(); draw(); focus(n, 'e'); } else { n.e = null; ch(); draw(); focus(n.k==='a' ? n : laatsteA(n.b)); } });
    if(mag('h')) knop(HK_IC, 'haakjes', 'haakjes met een exponent', n => { const leeg = n.k==='a' && !nrm(n.s||''); const g = haakjes(n); ch(); draw(); if(leeg) focus(n); else focus(g, 'e'); });
    if(mag('b')) knop(BRK_IC, 'breuk', 'breuk', n => { const a = breuk(n); ch(); draw(); focus(a); }, 'vx-brk');
    undoB = knop('↶', 'terug', 'ongedaan maken', terug, 'vx-terug'); undoB.disabled = hist.length<2;
    if(v.r.length>1) knop('✕', 'regel weg', 'deze regel weghalen', () => { v.r.pop(); ch(); draw(); focus(laatsteA(v.r[v.r.length-1].b)); }, 'vx-weg');
    const plus = el('button', 'btn ghost vx-plus', '<span class="sr-only">volgende tussenstap</span>'); plus.type = 'button'; plus.dataset.tip = 'volgende tussenstap'; plus.setAttribute('aria-label', 'volgende tussenstap: nieuwe regel');
    plus.addEventListener('click', ()=>{ v.r.push({b:VX.R()}); ch(); draw(); focus(v.r[v.r.length-1].b.f[0]); });
    bar.append(plus, el('div', 'vx-snel', '<span>Typen kan ook:</span>' + [['h', '<kbd>(</kbd> <kbd>)</kbd> haakjes'], ['e', '<kbd>^</kbd> macht'], ['b', '<kbd>/</kbd> breuk'], ['m', '<kbd>*</kbd> maal']].filter(([c]) => mag(c)).map(([, t]) => `<span>${t}</span>`).join('')));
  }
  function rend(n, actief){
    if(n.k==='row'){ const s = el('span', 'vx-rij'); n.f.forEach((f, i) => { if(i) s.append(el('span', 'vx-maal', '·')); s.append(rend(f, actief)); }); return s; }
    if(n.k==='frac'){ const br = el('span', 'br vx-br'), bt = el('span', 'br-t'), bn = el('span', 'br-n'); bt.append(rend(n.t, actief)); bn.append(rend(n.n, actief)); br.append(bt, bn); return br; }
    const fe = el('span', 'vx-f' + (n.k==='g' ? ' vx-g' : '')); const x = {};
    if(n.k==='a'){ const bi = m4inp('b vx-b', n.s, 'getal of letter'); x.b = bi; fe.append(bi);
      if(actief){ bi.addEventListener('focus', ()=>{ foc = {n, w:'b'}; actiefVak(bi); }); bi.addEventListener('input', ()=>typ(n, bi)); bi.addEventListener('keydown', e=>toets(e, n, bi)); } else bi.readOnly = true; }
    else { const groot = (n.b.k==='frac' ? ' groot' : '') + (n.rood ? ' rood' : ''); fe.append(el('span', 'vx-par' + groot, '('), rend(n.b, actief), el('span', 'vx-par' + groot, ')')); }
    if(n.e!=null){ const ex = m4inp('ex', n.e, 'exponent'); x.e = ex; const sup = el('span', 'm4-exp'); sup.append(ex); fe.append(sup);
      if(actief){ ex.addEventListener('focus', ()=>{ foc = {n, w:'e'}; actiefVak(ex); });
        ex.addEventListener('input', ()=>{ const t = ex.value.replace(/[−–]/g, '-').replace(/[^-\d]/g, ''); n.e = t; if(ex.value!==t) ex.value = t; ch(); });
        ex.addEventListener('keydown', e=>{ if(e.key==='Backspace' && ex.value===''){ e.preventDefault(); n.e = null; ch(); draw(); focus(n.k==='a' ? n : laatsteA(n.b)); } }); }
      else ex.readOnly = true; }
    IN.set(n, x); return fe;
  }
  /* typen: ^ exponent · ( haakjes · ) uit de haakjes naar hun exponent · / breuk · * nieuwe factor · 3a wordt 3 · a */
  function typ(n, bi){
    const x = bi.value.replace(/[−–]/g, '-').replace(/:/g, '/'); index();
    const zonder = c => x.replace(c, '');
    if(x.includes('^') && mag('e')){ n.s = zonder('^'); if(n.e==null) n.e = ''; ch(); draw(); focus(n, 'e'); return; }
    if(x.includes('(') && mag('h')){ const voor = x.split('(')[0];
      if(voor && voor!=='-'){ n.s = voor; const a = nieuweFactor(n); index(); haakjes(a); }
      else { n.s = ''; const g = haakjes(n); if(voor==='-'){ index(); rijVan(g).f.splice(P.get(g).i, 0, VX.A('-')); } }
      ch(); draw(); focus(voor && voor!=='-' ? laatsteA(rijVan(n).f[P.get(n).i + 1]) : n); return; }
    if(x.includes(')') && mag('h')){ n.s = zonder(')'); const g = haakVan(n); if(g){ if(g.e==null) g.e = ''; ch(); draw(); focus(g, 'e'); } else { bi.value = n.s; ch(); } return; }
    if(x.includes('/') && mag('b')){ n.s = zonder('/'); const a = breuk(n); ch(); draw(); focus(a); return; }
    if(/[*·]/.test(x) && mag('m')){ const [a, ...b] = x.split(/[*·]/); n.s = a; const m = nieuweFactor(n); m.s = b.join(''); ch(); draw(); focus(m); return; }
    const m = x.match(/^(-?\d+(?:[.,]\d+)?|-?[a-z])([a-z\d].*)$/i);
    if(m && !(/^-?\d/.test(m[1]) && /^\d/.test(m[2]))){ n.s = m[1]; const a = nieuweFactor(n); a.s = m[2]; ch(); draw(); focus(a); return; }
    n.s = x; if(bi.value!==x) bi.value = x; ch();
  }
  function toets(e, n, bi){ index();
    if(e.key==='Backspace' && bi.value===''){ const r = rijVan(n), p = P.get(r);
      if(r.f.length>1){ e.preventDefault(); const i = P.get(n).i; r.f.splice(i, 1); ch(); draw(); focus(laatsteA(r.f[Math.max(0, i-1)])); }
      else if(p.o.k==='frac' && p.key==='n'){ e.preventDefault(); const t = p.o.t; zet(p.o, t); ch(); draw(); focus(laatsteA(t)); }
      else if(p.o.k==='g'){ e.preventDefault(); zet(p.o, n); ch(); draw(); focus(n); } }
    else if(e.key==='ArrowDown' || e.key==='ArrowUp'){ let q = P.get(rijVan(n));
      while(q && q.o.k!=='frac') q = P.get(q.o);
      if(q){ e.preventDefault(); focus(e.key==='ArrowDown' ? eersteA(q.o.n) : eersteA(q.o.t)); } }
  }
  const api = {check:null, toon:()=>kruisjes(false),
    trim(){ let weg = false; while(v.r.length>1 && VX.leeg(v.r[v.r.length-1].b)){ v.r.pop(); weg = true; } if(weg){ ch(); draw(); } }};
  draw();
  return Object.assign(api, {
    mark(on){ const res = v._res || []; sp.querySelectorAll('.vx-regel').forEach((row, li) => { row.classList.remove('ok', 'bad', 'bijna'); const r = res[li]; if(on==null || !r || r.err || r.eq==null) return;
      row.classList.add(!r.eq ? 'bad' : (li===v.r.length-1 && r.why) ? 'bijna' : 'ok'); }); if(on!=null) kruisjes(true); else { const a = sp.querySelector('.vx-regel.actief'); if(a) a.querySelectorAll('.vx-x, .vx-uit').forEach(x => x.remove()); } },
    lock(){ if(bar) bar.remove(); sp.querySelectorAll('.vx-actief').forEach(x => x.classList.remove('vx-actief')); }
  });
}
/* ---------- knop rechtsboven op de kaart: hoe werken de knoppen? ---------- */
const VX_HULP = (k=VX_KNOPPEN) => `<h3>Spiekbriefje · zo bouw je je antwoord</h3><table>
  ${k.includes("m") ? `<tr><td><span class="vx-k vx-demo"><span class="vx-ic"><span class="vx-dot">·</span><span class="vx-hok"></span></span></span></td><td><b>maal</b>: zet er nog een factor bij, met een maalteken ertussen. Typ je <b>8a</b>, dan wordt dat vanzelf 8 · <i>a</i>.</td><td><kbd>*</kbd></td></tr>` : ""}
  ${k.includes("e") ? `<tr><td><span class="vx-k vx-demo"><span class="vx-ic">${XP_IC}</span></span></td><td><b>macht</b>: geeft het actieve vakje een exponent. Nog eens klikken haalt de exponent weg.</td><td><kbd>^</kbd></td></tr>` : ""}
  ${k.includes("h") ? `<tr><td><span class="vx-k vx-demo"><span class="vx-ic">${HK_IC}</span></span></td><td><b>haakjes</b>: zet haakjes met een exponent rond het actieve vakje, bijvoorbeeld (${MIN}3)<sup>2</sup>. Is het vakje leeg, dan bouw je tussen de haakjes verder, ook een breuk: <span class="m4-line" style="display:inline-flex">${abH('2', '3', '2')}</span>.</td><td><kbd>(</kbd> <kbd>)</kbd></td></tr>` : ""}
  ${k.includes("b") ? `<tr><td><span class="vx-k vx-brk vx-demo"><span class="vx-ic">${BRK_IC}</span></span></td><td><b>breuk</b>: wat er staat wordt de teller, eronder komt een noemer. Met de pijltjes ↑ en ↓ spring je tussen teller en noemer.</td><td><kbd>/</kbd></td></tr>` : ""}
  <tr><td><span class="vx-k vx-demo"><span class="vx-ic">↶</span></span></td><td><b>terug</b>: maakt je laatste wijziging ongedaan. Ook handig: in een leeg vakje haalt de wistoets dat vakje weg.</td><td><kbd>⌫</kbd></td></tr>
  <tr><td><span class="vx-k vx-demo"><span class="vx-ic">✕</span></span></td><td><b>regel weg</b>: haalt de laatste regel weg.</td><td></td></tr>
  <tr><td><span class="btn ghost vx-plus vx-demo">=</span></td><td><b>volgende tussenstap</b>: begint een nieuwe regel. Klik je daarna toch meteen op Controleer, dan verdwijnt de lege regel vanzelf. Schrijf elke stap op een eigen regel, zoals op papier.</td><td></td></tr></table>
  <p><b>Het oranje vakje</b> is actief: daar werken de knoppen op. <b>Bijna juist</b> betekent: je stap klopt, maar je bent nog niet klaar. Een <b class="vx-rood">✕</b> naast een regel betekent dat daar iets fout ging: klik erop voor uitleg.</p>`;
function vxHulp(card){
  const head = card.querySelector('.card-head'); if(!head || head.querySelector('.vx-hulp-btn')) return;
  const b = el('button', 'cheat-btn vx-hulp-btn', '<span aria-hidden="true">?</span>'); b.type = 'button'; b.dataset.tip = 'hoe werken de knoppen?'; b.setAttribute('aria-label', 'hoe werken de knoppen?'); b.setAttribute('aria-expanded', 'false');
  const panel = el("div", "cheat vx-hulp", VX_HULP([...new Set([...card.querySelectorAll(".m4-wx")].map(x => x.dataset.knoppen || VX_KNOPPEN).join(""))].join(""))); panel.hidden = true;
  b.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; b.setAttribute('aria-expanded', String(!panel.hidden)); });
  const rb = head.querySelector('.refresh-btn'); head.insertBefore(b, rb || null); head.after(panel);
}
(function(){ const css = `
  .m4-line:has(> .m4-wx){flex-wrap:wrap; row-gap:.5rem}
  .m4-wx{flex-basis:100%; flex-direction:column; align-items:flex-start; gap:.5rem; padding-left:1.4rem}
  .vx-regel{display:flex; align-items:center; gap:.4rem; flex-wrap:wrap}
  .vx-is{width:1rem; text-align:center}
  .vx-rij, .vx-f{display:inline-flex; align-items:center}
  .vx-rij{gap:.12rem} .vx-maal{color:var(--ink-soft); padding:0 .05rem}
  .vx-br{margin:0 .1rem} .vx-br > .br-t, .vx-br > .br-n{padding:.15rem .25rem; display:flex; justify-content:center} .vx-br > .br-n{padding-top:.45rem}
  .vx-f .m4-in.b{--w:2.3rem}
  .vx-f > .m4-exp{align-self:flex-start; line-height:1; margin-left:.05em; transform:translateY(-.5rem)}
  .vx-rij:has(> .vx-f > .m4-exp){padding-top:.45rem}
  .vx-par{font-size:1.6rem; font-weight:300; line-height:1; color:var(--accent-dark); padding:0 .05rem}
  .vx-par.groot{font-size:3.6rem; transform:scaleX(.55); margin:0 -.3rem}
  .vx-balk{display:flex; flex-wrap:wrap; align-items:center; gap:.5rem .8rem; margin:.4rem 0 .2rem 2.8rem}
  .vx-tools{display:flex; flex-wrap:wrap; gap:.3rem}
  /* mini-rekenmachine naast de uitwerking (op een smal scherm eronder) */
  @media (min-width:640px){
    .m4-q:has(> .vx-balk){display:grid; grid-template-columns:minmax(0, max-content) auto; justify-content:start; column-gap:2.5rem; align-items:start}
    .m4-q:has(> .vx-balk) > *{grid-column:1}
    .m4-q > .vx-balk{grid-column:2; grid-row:1 / span 4; display:grid; grid-template-columns:repeat(3, 2.35rem); gap:.3rem .35rem; margin:2.2rem 0 0; padding:.4rem .55rem; border:1.5px solid var(--border); border-radius:.8rem; background:var(--zone-bg, #f4fbfb); position:sticky; top:1rem; width:max-content}
    .m4-q > .vx-balk .vx-tools{display:contents}
    .m4-q > .vx-balk .vx-k{min-width:2.35rem; min-height:2.35rem}
    .m4-q > .vx-balk .vx-snel{grid-column:1 / span 3; width:7.8rem; font-size:.6rem; line-height:1.3}
    .m4-q > .vx-balk .vx-snel kbd{display:inline-block; line-height:1; padding:0 .2rem; vertical-align:middle}
  }
  .vx-plus{font-size:0 !important; padding:0 !important; min-width:2.35rem; min-height:2.35rem}
  .m4-q > .vx-balk .vx-plus{grid-column:1 / span 3}
  .vx-plus::before{content:'='; font-size:1.4rem; font-weight:700}
  .vx-k{border:1.5px solid var(--border); background:var(--card, #fff); color:var(--accent-dark); border-radius:.5rem; min-width:2.15rem; min-height:2.15rem; padding:.2rem .35rem; cursor:pointer; font:inherit; font-weight:700; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:.1rem}
  .vx-ic{font-size:.9rem; line-height:1.1; display:inline-flex; align-items:center; min-height:1.15rem}
  .vx-k{position:relative}
  .vx-plus{position:relative}
  .vx-k::after, .vx-plus::after{content:attr(data-tip); position:absolute; left:50%; top:calc(100% + 5px); transform:translateX(-50%); white-space:nowrap; background:var(--ink); color:var(--bg, #fff); font-size:.75rem; font-weight:700; padding:.2rem .5rem; border-radius:.35rem; opacity:0; pointer-events:none; transition:opacity .15s; z-index:20}
  .vx-k:hover::after, .vx-plus:hover::after{opacity:1; transition-delay:1s}
  .vx-plus{min-height:2.15rem; padding:.2rem .8rem; font-size:.9rem}
  .vx-snel{flex-basis:100%; font-size:.78rem; color:var(--ink-soft)}
  .vx-snel > span{display:block}
  .vx-snel kbd{font:inherit; font-weight:700; border:1px solid var(--border); border-radius:.25rem; padding:0 .3rem; background:var(--zone-bg, #f6fbfb); color:var(--accent-dark)}
  .vx-regel{position:relative}
  .m4-items:has(.m4-wx){grid-template-columns:minmax(0, 1fr) !important}
  .sr-only{position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap}
  .card-head .vx-hulp-btn{margin-left:auto; margin-right:.5rem; font-weight:700; font-size:1.1rem; width:32px; height:32px; border:2px solid var(--accent); color:var(--accent-dark); background:var(--accent-soft)}
  .card-head:has(.vx-hulp-btn) .refresh-btn{margin-left:0}
  .vx-hulp td:first-child{width:3.2rem; text-align:center} .vx-hulp td:last-child{white-space:nowrap}
  .vx-hulp kbd{font:inherit; font-weight:700; border:1px solid var(--border); border-radius:.25rem; padding:0 .3rem; color:var(--accent-dark)}
  .vx-demo{cursor:default; pointer-events:none} .vx-demo::after{display:none}
  .vx-hulp p{margin:.6rem 0 0; font-size:.88rem} .vx-rood{color:var(--bad)}
  .vx-x{border:0; background:transparent; color:var(--bad); font-weight:700; font-size:1.05rem; cursor:pointer; padding:.1rem .35rem; border-radius:50%; line-height:1}
  .vx-x:hover, .vx-x:focus-visible, .vx-x[aria-expanded="true"]{background:var(--bad-bg)}
  .vx-uit{position:absolute; left:2rem; top:calc(100% + .2rem); z-index:5; width:min(26rem, 85vw); font-weight:400; color:var(--ink); background:var(--card, #fff); border:2px solid var(--bad); border-radius:.6rem; padding:.55rem 2rem .55rem .75rem; box-shadow:0 6px 18px rgba(0,0,0,.14); font-size:.92rem; line-height:1.5}
  .vx-uit[hidden]{display:none}
  .vx-uit-knop{margin-top:.5rem} .vx-verbeter{font-size:.85rem; padding:.3rem .8rem}
  .vx-par.rood{color:var(--bad); font-weight:500}
  .vx-uit-dicht{position:absolute; right:.3rem; top:.15rem; border:0; background:transparent; font-size:1.2rem; cursor:pointer; color:var(--ink-soft)}
  .vx-f .m4-in.vx-actief{border-color:var(--orange); border-width:2.5px; box-shadow:0 0 0 3px var(--or-soft)}
  .vx-k:hover, .vx-k:focus-visible{border-color:var(--accent-dark)}
  .vx-k sup{font-size:.7em; align-self:flex-start; line-height:1; margin-top:-.15em; margin-left:.05em}
  .vx-dot{font-size:1.6em; line-height:0}
  .vx-hok{display:inline-block; width:.7rem; height:.85rem; border:1.5px solid currentColor; border-radius:.2rem; margin-left:.15rem}
  .vx-k.vx-brk svg{width:12px; height:16px; fill:none; stroke:currentColor; stroke-width:1.5}
  .vx-k.vx-weg{color:var(--ink-soft)}
  .vx-k.vx-terug .vx-ic{font-size:1.2rem} .vx-k:disabled{opacity:.4; cursor:default}
  .vx-regel.ok .m4-in{border-color:var(--ok); background:var(--ok-bg)}
  .vx-regel.bad .m4-in{border-color:var(--bad); background:var(--bad-bg)}
  .vx-regel.bijna .m4-in{border-color:var(--orange); background:var(--or-soft)}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* ============================================================
   MODULE 6 · VEELTERMEN: rekenkern, notatie en het vrije veeltermvak
   Een uitdrukking (opgave, tussenstap of antwoord) heeft altijd dezelfde vorm:
     som   {k:'s', t:[term]}
     term  {k:'t', s:'+'|'-', f:[factor]}
     factor: getal of letter {k:'a', s, e, m}, breuk {k:'q', t, n, m} of haakjes {k:'g', b:som, e, m}
     (e = null: geen exponent · m = true: met een maalteken ervoor)
   EX.parse('(2x-3)^2') maakt die vorm uit tekst, EX.html toont hem, EX.val rekent hem uit tot een veelterm.
   ============================================================ */
const qAdd = (a, b) => Q(a.n*b.d + b.n*a.d, a.d*b.d);
const abH = (t, n, e) => `<span class="m4-m">${par(brH(t, n))}<sup class="m4-sup">${e}</sup></span>`;
/* rangschikken in dalende machten: 'wenselijk' (juist, met een tip) of 'verplicht' (bijna juist) */
const DALEND = 'wenselijk';

/* ---------- veeltermen: lijst van termen {c:Q, v:{letter:exponent}}; een exponent is lineair {c, k, v} (3, 3p, 2n + 1) ---------- */
const EXP = { n:k => ({c:0, k, v:null}), add:(a, b) => ({c:a.c+b.c, k:a.k+b.k, v:a.v||b.v}), nul:a => a.c===0 && a.k===0, een:a => a.c===0 && a.k===1 };
const PV = {};
PV.key = v => Object.keys(v).sort().map(x => x + '^' + linT(v[x]).replace(/ /g, '')).join(' ');
PV.T = (c, v={}) => ({c, v});
PV.norm = ts => { const m = new Map(); ts.forEach(t => { const k = PV.key(t.v), o = m.get(k); if(o) o.c = qAdd(o.c, t.c); else m.set(k, {c:t.c, v:Object.assign({}, t.v)}); }); return [...m.values()].filter(t => t.c.n!==0); };
PV.c = q => PV.norm([PV.T(typeof q==='object' ? q : Q(q))]);
PV.add = (a, b) => PV.norm(a.concat(b));
PV.neg = a => a.map(t => PV.T(qNeg(t.c), t.v));
PV.sub = (a, b) => PV.add(a, PV.neg(b));
PV.tmul = (s, t) => { const v = Object.assign({}, s.v); for(const x in t.v){ v[x] = v[x] ? EXP.add(v[x], t.v[x]) : t.v[x]; if(EXP.nul(v[x])) delete v[x]; } return PV.T(qMul(s.c, t.c), v); };
PV.mul = (a, b) => PV.norm(a.flatMap(s => b.map(t => PV.tmul(s, t))));
PV.pow = (a, n) => { let r = PV.c(1); for(let i=0; i<n; i++) r = PV.mul(r, a); return r; };
PV.eq = (a, b) => PV.sub(a, b).length===0;
PV.som = (...ps) => ps.reduce((r, p) => PV.add(r, p), []);
/* dalende machten: eerst de letter die alfabetisch eerst komt */
PV.deg = (t, x) => { const e = t.v[x]; return !e ? 0 : e.c ? 1000*e.c + e.k : e.k; };
PV.sort = a => { const L = [...new Set(a.flatMap(t => Object.keys(t.v)))].sort(); return a.slice().sort((s, t) => { for(const x of L){ const d = PV.deg(t, x) - PV.deg(s, x); if(d) return d; } return 0; }); };
/* een breuk als kommagetal, als dat kan: 1/4 -> 0,25 */
const decS = q => { let d = q.d, k2 = 0, k5 = 0; while(d%2===0){ d /= 2; k2++; } while(d%5===0){ d /= 5; k5++; } if(d!==1) return null;
  const k = Math.max(k2, k5); const s = String(Math.round(Math.abs(q.n)*Math.pow(10, k)/q.d)).padStart(k+1, '0'); return (q.n<0 ? '-' : '') + (k ? s.slice(0, -k) + ',' + s.slice(-k) : s); };
/* veelterm als tekst die EX.parse weer leest; o.dec: kommagetallen in plaats van breuken */
PV.str = (p, o={}) => { if(!p.length) return '0';
  return p.map((t, i) => { const neg = t.c.n<0, c = neg ? qNeg(t.c) : t.c;
    const lets = Object.keys(t.v).sort().map(x => { const e = t.v[x]; return x + (EXP.een(e) ? '' : '^' + (e.c ? '{' + linT(e).replace(/ /g, '') + '}' : e.k)); }).join('');
    const cs = c.d===1 ? (c.n===1 && lets ? '' : String(c.n)) : (o.dec && decS(c) ? decS(c) : c.n + '/' + c.d);
    return (neg ? '-' : i ? '+' : '') + cs + lets; }).join(''); };

/* ---------- uitdrukkingen: lezen, tonen, uitrekenen ---------- */
const EX = {};
EX.A = (s='', m=false) => ({k:'a', s, e:null, m});
EX.T = (s='+', f) => ({k:'t', s, f:f || [EX.A()]});
EX.S = (...t) => ({k:'s', t:t.length ? t : [EX.T()]});
/* tekst -> uitdrukking. 2x^2 · ^{3p} voor een letter als exponent · 1/2x is een half x · * of · is een zichtbaar maalteken */
EX.parse = str => {
  const s = String(str).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/·/g, '*').replace(/\./g, ',');
  let i = 0; const pk = () => s[i];
  const som = () => { const S = {k:'s', t:[]}; let sg = '+'; if(pk()==='+' || pk()==='-') sg = s[i++]; S.t.push(term(sg)); while(pk()==='+' || pk()==='-'){ const g = s[i++]; S.t.push(term(g)); } return S; };
  const term = sg => { const T = {k:'t', s:sg, f:[]}; let m = false;
    while(i < s.length){ const c = pk(); if(c==='*'){ i++; m = true; continue; } if(c==='+' || c==='-' || c===')') break; const f = factor(); f.m = m && T.f.length>0; m = false; T.f.push(f); }
    if(!T.f.length) T.f.push(EX.A()); return T; };
  const factor = () => { const c = pk(); let f;
    if(c==='('){ i++; f = {k:'g', b:som(), e:null, m:false}; if(pk()===')') i++; }
    else if(/\d/.test(c)){ let num = ''; while(i<s.length && /[\d,]/.test(s[i])) num += s[i++];
      if(pk()==='/' && /\d/.test(s[i+1]||'')){ i++; let den = ''; while(i<s.length && /\d/.test(s[i])) den += s[i++]; f = {k:'q', t:num, n:den, m:false}; } else f = EX.A(num); }
    else if(/[a-z]/i.test(c)){ i++; f = EX.A(c.toLowerCase()); }
    else { i++; return EX.A('?'); }
    if(pk()==='^'){ i++; let e = '';
      if(pk()==='{'){ i++; while(i<s.length && s[i]!=='}') e += s[i++]; i++; } else { while(i<s.length && /\d/.test(s[i])) e += s[i++]; }
      if(f.k==='q') f = {k:'g', b:{k:'s', t:[{k:'t', s:'+', f:[f]}]}, e, m:false}; else f.e = e; }
    return f; };
  const r = som(); if(i < s.length) throw new Error('EX.parse: ' + str); return r;
};
/* een leeg vakje zonder maalteken naast andere factoren telt niet mee (bv. het plekje achter een haakje) */
EX.leegA = f => f.k==='a' && !nrm(f.s||'') && f.e==null;
EX.weg = (f, T) => EX.leegA(f) && !f.m && T.f.some(g => g!==f && !EX.leegA(g));
EX.leeg = S => S.t.every(T => T.f.every(EX.leegA));
EX.numA = f => f.k==='q' || (f.k==='a' && /^\d+(,\d+)?$/.test(nrm(f.s||'').replace('.', ',')));
EX.val = n => {
  if(n.k==='s'){ if(EX.leeg(n)) return {err:'Er staat nog niets.'}; let r = []; for(const T of n.t){ const x = EX.val(T); if(x.err) return x; r = PV.add(r, x); } return r; }
  if(n.k==='t'){ const fs = n.f.filter(f => !EX.weg(f, n)); if(fs.every(EX.leegA)) return {err:'Er staat nog een lege term. Vul hem in of haal het + of − weg.'};
    let r = PV.c(n.s==='-' ? -1 : 1); for(const f of fs){ const x = EX.val(f); if(x.err) return x; r = PV.mul(r, x); } return r; }
  if(n.k==='q'){ const t = nrm(n.t||'').replace('.', ','), d = nrm(n.n||''); if(!/^\d+(,\d+)?$/.test(t) || !/^\d+$/.test(d)) return {err:'Vul de breuk volledig in: een getal boven en een getal onder.'};
    if(+d===0) return {err:'De noemer kan geen 0 zijn.'}; return PV.c(qMul(t.includes(',') ? qDec(t) : Q(+t), Q(1, +d))); }
  let b;
  if(n.k==='a'){ const s = nrm(n.s||'').replace('.', ','); if(!s) return {err:'Er staat nog een leeg vakje.'};
    if(/^\d+$/.test(s)) b = PV.c(Q(+s)); else if(/^\d*,\d+$/.test(s)) b = PV.c(qDec(s)); else if(/^[a-z]$/i.test(s)) b = [PV.T(Q(1), {[s.toLowerCase()]:EXP.n(1)})];
    else return {err:`<b>${esc(s)}</b> kan ik niet lezen. Zet elk getal en elke letter in een eigen vakje.`};
    if(n.e==null) return b; const e = nrm(n.e||''); if(!e) return {err:'Vul de exponent in, of haal hem weg.'};
    if(/^\d+$/.test(e)) return +e>20 ? {err:'Die exponent is te groot.'} : PV.pow(b, +e);
    const L = linP(e); if(!L) return {err:'Die exponent kan ik niet lezen.'};
    if(/^[a-z]$/i.test(s)) return EXP.nul(L) ? PV.c(1) : [PV.T(Q(1), {[s.toLowerCase()]:L})];
    return {err:'Een getal met een letter als exponent reken je hier niet uit.'}; }
  b = EX.val(n.b); if(b.err) return b; if(n.e==null) return b;
  const e = nrm(n.e||''); if(!e) return {err:'Vul de exponent in, of haal hem weg.'};
  if(!/^\d+$/.test(e)){ const L = linP(e); if(L && b.length===1 && qEq(b[0].c, Q(1))){ const v = {}; for(const x in b[0].v){ const E = b[0].v[x]; if(E.c) return {err:'Die macht reken je hier niet uit.'}; v[x] = {c:L.c*E.k, k:L.k*E.k, v:L.v}; } return [PV.T(Q(1), v)]; }
    return {err:'Bij haakjes moet de exponent een getal zijn.'}; }
  return +e>12 ? {err:'Die exponent is te groot.'} : PV.pow(b, +e);
};
EX.p = str => { const r = EX.val(EX.parse(str)); if(r.err) throw new Error('EX.p: ' + str + ' ' + r.err); return r; };
/* tonen */
EX.eH = e => sg(e).replace(/([a-z])/g, '<i>$1</i>');
EX.html = n => {
  if(n.k==='s') return n.t.map((T, i) => { const h = EX.html(T); return i===0 ? (T.s==='-' ? MIN + h : h) : (T.s==='-' ? ' ' + MIN + ' ' : ' + ') + h; }).join('');
  if(n.k==='t') return n.f.map((f, i) => (i && f.m ? ' · ' : '') + EX.html(f)).join('');
  if(n.k==='q') return brH(n.t, n.n);
  if(n.k==='a'){ const b = /^[a-z]$/i.test(n.s) ? `<i>${n.s}</i>` : esc(n.s); return n.e==null ? b : `<span class="m4-m">${b}<sup class="m4-sup">${EX.eH(n.e)}</sup></span>`; }
  const inn = EX.html(n.b); const h = /class="br"/.test(inn) ? par(inn) : `(${inn})`;
  return n.e==null ? h : `<span class="m4-m"><span class="m6-g">${h}</span><sup class="m4-sup">${EX.eH(n.e)}</sup></span>`;
};
/* uitdrukking in html: EH('(2x-3)^2') · PH(veelterm) in dalende machten · HH(veelterm) met haakjes als het nodig is */
const EH = str => `<span class="m6-x">${EX.html(EX.parse(str))}</span>`;
const PH = (p, o={}) => EH(PV.str(o.zo ? p : PV.sort(p), o));
const HH = (p, o={}) => { const h = PH(p, o); return p.length>1 || (p[0] && p[0].c.n<0) ? `(${h})` : h; };
/* grondtal van een kwadraat: haakjes, behalve rond één letter */
const KH = p => p.length===1 && qEq(p[0].c, Q(1)) && Object.keys(p[0].v).length===1 && EXP.een(Object.values(p[0].v)[0]) ? PH(p) : `(${PH(p)})`;

/* ---------- is een regel volledig uitgewerkt en herleid? '' = ja ---------- */
EX.waarom = S => {
  let gr = null; const zoek = n => { if(n.k==='g'){ gr = gr || n; } if(n.k==='s') n.t.forEach(zoek); else if(n.k==='t') n.f.forEach(zoek); else if(n.k==='g') zoek(n.b); }; zoek(S);
  if(gr) return gr.e==null ? 'Werk de haakjes nog uit.' : gr.b.t.length>1 ? (nrm(gr.e)==='2' ? 'Werk het kwadraat nog uit.' : 'Werk de macht nog uit.') : 'Reken de macht nog uit.';
  for(const T of S.t){ const fs = T.f.filter(f => !EX.weg(f, T)); const ex = f => f.e==null ? null : nrm(f.e);
    if(fs.some(f => f.k==='a' && EX.numA(f) && f.e!=null)) return 'Reken de macht van het getal nog uit.';
    if(fs.some(f => f.k==='a' && (ex(f)==='0' || ex(f)==='1'))) return 'Een exponent 0 of 1 schrijf je niet. Werk die nog uit.';
    const g = fs.filter(EX.numA), l = fs.filter(f => !EX.numA(f));
    if(g.length>1) return 'Vermenigvuldig de getallen nog.';
    if(g.length && fs[0]!==g[0]) return 'Zet het getal vooraan.';
    const gv = g.length ? EX.val(g[0]) : null;
    if(gv && !gv.err && gv.length===1 && qEq(gv[0].c, Q(1)) && l.length) return 'Een factor 1 schrijf je niet.';
    if(gv && !gv.err && !gv.length) return S.t.length>1 || l.length ? 'Een term 0 schrijf je niet.' : '';
    if(g.length && g[0].k==='q'){ if(+nrm(g[0].n)===1) return 'Een noemer 1 schrijf je niet.'; const t = nrm(g[0].t); if(/^\d+$/.test(t) && ggd(+t, +nrm(g[0].n))>1) return 'Vereenvoudig de breuk nog.'; }
    const ls = l.map(f => nrm(f.s||'').toLowerCase()); if(new Set(ls).size<ls.length) return 'Dezelfde letter staat er meer dan één keer. Schrijf die als één macht.';
    if(ls.join('')!==[...ls].sort().join('')) return 'Zet de letters in alfabetische volgorde.';
    if(fs.some((f, i) => i && f.m)) return 'Laat het maalteken weg tussen het getal en de letters: schrijf 6<i>x</i> en niet 6 · <i>x</i>.'; }
  const keys = S.t.map(T => { const v = EX.val(T); return v.err || v.length!==1 ? null : PV.key(v[0].v); });
  if(keys.some((k, i) => k!=null && keys.indexOf(k)!==i)) return 'Neem de gelijksoortige termen nog samen.';
  return '';
};
/* staat een herleide veelterm in één letter niet in dalende machten? */
EX.rang = S => { const ts = S.t.map(T => EX.val(T)); if(ts.some(x => x.err || x.length!==1)) return false;
  const L = new Set(); ts.forEach(x => Object.keys(x[0].v).forEach(k => L.add(k))); if(L.size!==1) return false; const x = [...L][0];
  if(ts.some(t => t[0].v[x] && t[0].v[x].c)) return false;
  const d = ts.map(t => t[0].v[x] ? t[0].v[x].k : 0); return d.some((e, i) => i && e>=d[i-1]); };
/* −3² geschreven waar (−3)² bedoeld is: haakjes eromheen */
EX.haakMin = S => { const c = JSON.parse(JSON.stringify(S)); let gevonden = null;
  const walk = n => { if(n.k==='s') n.t.forEach(T => { if(T.s==='-' && T.f.length===1 && T.f[0].k==='a' && T.f[0].e!=null && nrm(T.f[0].e)!=='1'){ const a = T.f[0]; gevonden = gevonden || {s:a.s, e:a.e}; T.s = '+'; T.f[0] = {k:'g', b:{k:'s', t:[{k:'t', s:'-', f:[Object.assign({}, a, {e:null, m:false})]}]}, e:a.e, m:a.m}; } else T.f.forEach(walk); }); else if(n.k==='g') walk(n.b); };
  walk(c); return {S:c, a:gevonden}; };
EX.ctx = c => { if(!c) return null; const o = Object.assign({}, c); ['a', 'b'].forEach(k => { if(typeof o[k]==='string') o[k] = EX.p(o[k]); }); if(o.f) o.f = o.f.map(x => typeof x==='string' ? EX.p(x) : x); return o; };
/* uitleg bij een foute regel */
EX.uitleg = (S, val, D, fout, ctx) => {
  for(const [F, m] of fout) if(PV.eq(val, typeof F==='string' ? EX.p(F) : F)) return m;
  const hm = EX.haakMin(S); if(hm.a){ const alt = EX.val(hm.S); if(!alt.err && PV.eq(alt, D)){ const x = /^[a-z]$/i.test(hm.a.s) ? `<i>${hm.a.s}</i>` : hm.a.s, e = hm.a.e;
    return `Zet haakjes rond een negatieve term met een exponent: (${MIN}${x})<sup>${e}</sup> en ${MIN}${x}<sup>${e}</sup> zijn niet hetzelfde. Zonder haakjes hoort de exponent niet bij het minteken.`; } }
  const is = (...ps) => PV.eq(val, PV.som(...ps));
  const een = (p, k) => p.length===1 && PV.key(p[0].v)===k;
  if(ctx && ctx.k==='kw'){ const A = ctx.a, B = ctx.b, A2 = PV.pow(A, 2), B2 = PV.pow(B, 2), M = PV.mul(PV.c(2), PV.mul(A, B));
    if(is(A2, B2)) return 'Je vergat het dubbel product in het midden. Het kwadraat van een tweeterm is niet <i>a</i>² + <i>b</i>²: er komt 2 · <i>a</i> · <i>b</i> bij.';
    if(is(A2, PV.mul(PV.c(Q(1, 2)), M), B2)) return `Vergeet de factor 2 niet: het dubbel product is 2 · ${HH(A)} · ${HH(B)} ${isq} ${PH(M)}.`;
    if(is(A2, PV.neg(M), B2)) return `Kijk naar het teken van het dubbel product: 2 · ${HH(A)} · ${HH(B)} ${isq} ${PH(M)}. Tel de mintekens.`;
    if(is(A2, M, PV.neg(B2)) || is(PV.neg(A2), M, B2) || is(PV.neg(A2), M, PV.neg(B2))) return `Een kwadraat is nooit negatief: ${KH(A)}² ${isq} ${PH(A2)} en ${KH(B)}² ${isq} ${PH(B2)}.`;
    const r1 = PV.sub(val, PV.add(M, B2)); if(r1.length===1 && A2.length===1) return `Het kwadraat van de eerste term klopt niet. Kwadrateer de hele term, ook het getal: ${KH(A)}² ${isq} ${PH(A2)}.`;
    const r3 = PV.sub(val, PV.add(A2, M)); if(r3.length===1 && B2.length===1) return `Het kwadraat van de tweede term klopt niet. Kwadrateer de hele term, ook het getal: ${KH(B)}² ${isq} ${PH(B2)}.`;
    const r2 = PV.sub(val, PV.add(A2, B2)); if(M.length===1 && een(r2, PV.key(M[0].v))) return `Het dubbel product klopt niet: 2 · ${HH(A)} · ${HH(B)} ${isq} ${PH(M)}.`; }
  if(ctx && ctx.k==='tt'){ const A2 = PV.pow(ctx.a, 2), B2 = PV.pow(ctx.b, 2);
    if(is(A2, B2)) return `Het is een verschil van twee kwadraten: ${PH(A2)} ${MIN} ${PH(B2)}. Het teken van de tegengestelde term zorgt voor het minteken.`;
    if(is(PV.neg(A2), B2)) return 'De gelijke term komt eerst: (gelijke term)² min (tegengestelde term)².'; }
  if(ctx && ctx.k==='prod' && ctx.f.length===2){ const [F1, F2] = ctx.f; const pp = F1.flatMap(s => F2.map(t => ({s, t, p:PV.norm([PV.tmul(s, t)])})));
    const tH = t => HH([t]);
    for(const x of pp) if(PV.eq(val, PV.sub(D, x.p))) return `Je vergat een product: ${tH(x.s)} · ${tH(x.t)}. Vermenigvuldig elke term van de eerste factor met elke term van de tweede.`;
    for(const x of pp) if(PV.eq(val, PV.sub(D, PV.mul(PV.c(2), x.p)))) return `Kijk naar het teken van ${tH(x.s)} · ${tH(x.t)} ${isq} ${PH(x.p)}. Tel de mintekens.`;
    if(pp.length===4 && is(pp[0].p, pp[3].p)) return 'Je vermenigvuldigde enkel de eerste termen met elkaar en de laatste termen met elkaar. Elke term maal elke term: dat zijn 4 producten.'; }
  if(PV.eq(PV.neg(val), D)) return 'Het teken klopt niet. Tel de mintekens nog eens.';
  const ks = p => p.map(t => PV.key(t.v)).sort().join('|');
  if(ks(val)===ks(D)) return 'De letters en de exponenten kloppen, maar een getal niet. Reken de getallen nog eens na.';
  return 'Deze regel is niet meer gelijk aan de opgave. Vergelijk hem met de regel erboven.';
};
EX.okV = v => !!v && Array.isArray(v.r) && v.r.length>0 && v.r.every(L => L && L.b && L.b.k==='s');
const emptyP = v => !EX.okV(v) || EX.leeg(v.r[v.r.length-1].b);
const vpDoel = (v, k, d) => { if(window.__VPREC && v && typeof v==='object') window.__VPREC.set(v, {k, d}); };

/* ---------- controle ----------
   chkP: vrij vak met regels. o = {fout:[[veelterm of tekst, boodschap]], rang:true (rangschikken gevraagd), mp:true (met de formule), ctx, dec}
   chkT: één term in een vakje · chkZ: tekenvak */
function chkP(v, doel, o={}){
  const D = typeof doel==='string' ? EX.p(doel) : doel; vpDoel(v, 'p', D);
  const een = !!(v && v._een);
  const lines = EX.okV(v) ? v.r.filter(L => !EX.leeg(L.b)) : [];
  const ctx = EX.ctx(o.ctx);
  const res = lines.map(L => { const val = EX.val(L.b); if(val.err) return {err:val.err}; const eq = PV.eq(val, D);
    return {val, eq, why: eq ? EX.waarom(L.b) : '', uitleg: eq ? '' : EX.uitleg(L.b, val, D, o.fout||[], ctx)}; });
  if(v && typeof v==='object') Object.defineProperty(v, '_res', {value:EX.okV(v) ? v.r.map(L => res[lines.indexOf(L)] || null) : [], configurable:true, enumerable:false});
  if(!res.length) return {info:true, msg:'Vul eerst je antwoord in.'};
  const nr = res.length>1;
  const ek = res.findIndex(r => r.err); if(ek>=0) return {info:true, msg:(nr ? `Regel ${ek+1}: ` : '') + res[ek].err};
  const fk = res.findIndex(r => !r.eq);
  if(fk>=0) return {ok:false, msg: nr ? `Regel ${fk+1} klopt niet. Klik op het rode kruisje voor uitleg.` : res[fk].uitleg};
  if(o.mp && lines.some(L => L.b.t.length>=4 || L.b.t.some(T => T.f.filter(f => f.k==='g' && f.b.t.length>1).length>=2))) return {info:true, msg:'Je rekende juist, maar deze oefening vraagt de <b>formule</b>: zonder de vier producten uit te schrijven. Probeer het nog eens met de formule.'};
  const last = res[res.length-1], LL = lines[lines.length-1];
  if(last.why) return {info:true, msg:`<b>Bijna juist!</b> ${een ? 'Je antwoord klopt, maar is nog niet klaar.' : 'Dit is een juiste tussenstap.'} ${last.why}` + (een ? '' : ' Klik op <b>=</b> en reken verder op een nieuwe regel.')};
  if(EX.rang(LL.b)){ const netjes = PH(D, {dec:o.dec});
    if(o.rang || DALEND==='verplicht'){ last.why = 'rangschik'; return {info:true, msg:`<b>Bijna juist!</b> Rangschik nog in dalende machten: ${netjes}.` + (een ? '' : ' Klik op <b>=</b> en schrijf het op een nieuwe regel.')}; }
    return {ok:true, msg:`Tip: in dalende machten schrijf je ${netjes}.`}; }
  return {ok:true};
}
function chkT(v, doel, fout=[]){
  const D = typeof doel==='string' ? EX.p(doel) : doel; vpDoel(v, 't', D);
  if(emptyP(v)) return {info:true, msg:'Vul eerst alle vakjes in.'};
  const S = v.r[v.r.length-1].b, val = EX.val(S); if(val.err) return {info:true, msg:val.err};
  if(PV.eq(val, D)){ const w = EX.waarom(S); return w ? {info:true, msg:'Juist, maar nog niet klaar. ' + w} : {ok:true}; }
  for(const [F, m] of fout) if(PV.eq(val, typeof F==='string' ? EX.p(F) : F)) return {ok:false, msg:m};
  if(PV.eq(PV.neg(val), D)) return {ok:false, msg:'Kijk nog eens naar het teken.'};
  return {ok:false};
}
function chkZ(v, s){ vpDoel(v, 'z', s); if(!v || !v.s) return {info:true, msg:'Kies het teken: klik op + of op − in het tekenvak.'}; return v.s===s ? {ok:true} : {ok:false, msg:'Kijk nog eens naar het teken: tel de mintekens.'}; }

/* ============================================================
   HET VRIJE VEELTERMVAK {{p:k}} en het termvak {{t:k}}
   {{p:k,opts}}: p plus · n min · m maal · e macht · h haakjes · b breuk · l letters in de exponent · 1 één regel
   {{t:k,opts}}: één term in een vakje (standaard enkel e)
   ============================================================ */
const VP_KNOPPEN = 'pnmeh';
function veelVak(sp, v, save, onCh, opt, enkel){
  opt = opt || (enkel ? 'e' : VP_KNOPPEN);
  const mag = c => opt.includes(c); sp.dataset.knoppen = opt;
  const een = enkel || mag('1');
  if(!EX.okV(v)) v.r = [{b:EX.S()}];
  if(een && v.r.length>1) v.r = v.r.slice(-1);
  Object.defineProperty(v, '_een', {value:een, configurable:true, enumerable:false});
  let P = new Map(), IN = new Map(), foc = null, alle = [];
  const hist = [JSON.stringify(v.r)]; let undoB = null;
  const ch = () => { const t = JSON.stringify(v.r); if(t!==hist[hist.length-1]){ hist.push(t); if(hist.length>200) hist.shift(); } if(undoB) undoB.disabled = hist.length<2; save(); onCh(); };
  const terug = () => { if(hist.length<2) return; hist.pop(); v.r = JSON.parse(hist[hist.length-1]); save(); onCh(); draw(); focus(eind(v.r[v.r.length-1].b)); };
  const index = () => { P = new Map(); const walk = (n, o, key, i) => { P.set(n, {o, key, i});
    if(n.k==='s') n.t.forEach((t, j) => walk(t, n, 't', j)); else if(n.k==='t') n.f.forEach((f, j) => walk(f, n, 'f', j)); else if(n.k==='g') walk(n.b, n, 'b'); };
    v.r.forEach(L => walk(L.b, L, 'b')); };
  const ouder = n => P.get(n).o;
  const zet = (n, nw) => { const p = P.get(n); if(p.key==='f' || p.key==='t') p.o[p.key][p.i] = nw; else p.o[p.key] = nw; index(); };
  const eind = n => n.k==='s' ? eind(n.t[n.t.length-1]) : n.k==='t' ? eind(n.f[n.f.length-1]) : n.k==='g' ? (n.e!=null ? {n, w:'e'} : eind(n.b)) : n.k==='q' ? {n, w:'n'} : {n, w:n.e!=null ? 'e' : 'b'};
  const begin = n => n.k==='s' ? begin(n.t[0]) : n.k==='t' ? begin(n.f[0]) : n.k==='g' ? begin(n.b) : {n, w:n.k==='q' ? 't' : 'b'};
  const groepVan = n => { let p = P.get(n); while(p){ if(p.o.k==='g') return p.o; p = P.get(p.o); } return null; };
  const regelVan = n => { let p = P.get(n); while(p && p.o.k) p = P.get(p.o); return p ? p.o : null; };
  const actiefVak = i => { sp.querySelectorAll('.vx-actief').forEach(x => x.classList.remove('vx-actief')); i.classList.add('vx-actief'); };
  const focus = t => { if(!t || !t.n) return; foc = t; const x = IN.get(t.n); const i = x && (x[t.w] || x.b || x.t || x.e); if(i){ i.focus({preventScroll:true}); const L = i.value.length; try{ i.setSelectionRange(L, L); }catch(e){} } };
  /* bouwstenen */
  const nieuwA = (s='', m=false, auto=false) => { const a = EX.A(s, m); if(auto) a.auto = true; return a; };
  const naFactor = (n, a) => { const p = P.get(n); p.o.f.splice(p.i + 1, 0, a); index(); return a; };
  const naTerm = (T, s) => { const p = P.get(T); const nt = EX.T(s); p.o.t.splice(p.i + 1, 0, nt); index(); return nt.f[0]; };
  const weg = n => { const p = P.get(n); p.o.f.splice(p.i, 1); index(); };
  const alsGroep = (a, s='+') => { const g = {k:'g', b:{k:'s', t:[EX.T(s)]}, e:null, m:!!a.m && !a.auto}; zet(a, g); return g.b.t[0].f[0]; };
  const schoon = x => x.replace(/[−–]/g, '-').replace(/:/g, '/').replace(/·/g, '*').replace(/\./g, ',').replace(/\s/g, '');
  /* typen: elk teken kan de vorm veranderen. Geeft het vakje terug waar de cursor naartoe gaat: {n, w} */
  function gewoon(a, x){
    if(x && a.auto) delete a.auto;
    let m = x.match(/^([a-z])(\d+)(.*)$/i);
    if(m && mag('e') && a.e==null){ a.s = m[1].toLowerCase(); a.e = m[2]; if(!m[3]) return {n:a, w:'e'}; return gewoon(naFactor(a, nieuwA()), m[3]); }
    m = x.match(/^(\d+(?:,\d*)?|[a-z])([a-z].*)$/i);
    if(m){ a.s = /^[a-z]$/i.test(m[1]) ? m[1].toLowerCase() : m[1]; return gewoon(naFactor(a, nieuwA()), m[2]); }
    a.s = /^[a-z]$/i.test(x) ? x.toLowerCase() : x; return {n:a, w:'b'};
  }
  function voedB(a, x){
    x = schoon(x); const i = x.search(/[-+^()*\/]/);
    if(i<0) return gewoon(a, x);
    const c = x[i], na = x.slice(i+1);
    const t = i ? gewoon(a, x.slice(0, i)) : (a.s = '', {n:a, w:'b'});
    if(t.w==='e') return voedE(t.n, t.n.e + x.slice(i));
    return teken(t.n, c, na);
  }
  function teken(a, c, na){
    const leeg = EX.leegA(a), T = ouder(a), eerste = T.f[0]===a;
    const negeer = () => voedB(a, (a.s||'') + na);
    if(c==='+' || c==='-'){
      if(leeg && a.auto){ if(enkel) return negeer(); weg(a); return voedB(naTerm(T, c), na); }
      if(leeg && eerste){ if(enkel && P.get(T).i>0) return negeer(); T.s = c; return voedB(a, na); }
      if(leeg){ if(c==='-' && mag('h')) return voedB(alsGroep(a, '-'), na); return negeer(); }
      if(enkel) return negeer();
      return voedB(naTerm(T, c), na);
    }
    if(c==='^'){
      if(!mag('e')) return negeer();
      if(leeg && a.auto){ const i = P.get(a).i, vorige = T.f[i-1]; weg(a);
        if(vorige && vorige.k==='q'){ const r = voedQ(vorige, 'n', (vorige.n||'') + '^' + na); return r; }
        if(vorige){ if(vorige.e==null) vorige.e = ''; return voedE(vorige, vorige.e + na); } return begin(T); }
      if(leeg) return negeer();
      if(a.e==null) a.e = ''; return voedE(a, a.e + na);
    }
    if(c==='('){
      if(!mag('h')) return negeer();
      if(leeg) return voedB(alsGroep(a, '+'), na);
      const g = {k:'g', b:EX.S(), e:null, m:false}; naFactor(a, g); return voedB(g.b.t[0].f[0], na);
    }
    if(c===')'){
      const g = groepVan(a); if(!g) return negeer();
      if(leeg && T.f.length>1) weg(a);
      return uitGroep(g, na);
    }
    if(c==='*'){
      if(!mag('m')) return negeer();
      if(leeg){ if(!eerste){ a.m = true; delete a.auto; } return voedB(a, na); }
      return voedB(naFactor(a, nieuwA('', true)), na);
    }
    if(c==='/'){
      if(!mag('b')) return negeer();
      const s = nrm(a.s||''); if(a.e!=null || (s && !/^\d+(,\d+)?$/.test(s))) return negeer();
      const q = {k:'q', t:s, n:'', m:!!a.m}; zet(a, q); return s ? voedQ(q, 'n', na) : voedQ(q, 't', na);
    }
    return negeer();
  }
  function uitGroep(g, na){ const p = P.get(g), T = p.o, nx = T.f[p.i+1];
    if(nx && !(nx.k==='a' && EX.leegA(nx))) return begin(nx);
    const b = nx || naFactor(g, nieuwA('', false, true)); return voedB(b, na); }
  function voedE(n, x){
    x = schoon(x); const i = x.search(mag('l') ? /[-+*()\/^]/ : /[-+*()\/^a-z]/i);
    if(i<0){ n.e = x; return {n, w:'e'}; }
    n.e = x.slice(0, i); const rest = x.slice(i);
    if(rest[0]==='^') return voedE(n, n.e + rest.slice(1));
    const T = ouder(n), nx = T.f[P.get(n).i+1];
    const b = nx && nx.k==='a' && EX.leegA(nx) ? nx : naFactor(n, nieuwA('', false, true));
    return voedB(b, rest);
  }
  function voedQ(q, w, x){
    x = schoon(x);
    if(w==='t'){ const i = x.search(/[^\d,]/); if(i<0){ q.t = x; return {n:q, w:'t'}; } q.t = x.slice(0, i); if(x[i]==='/') return voedQ(q, 'n', (q.n||'') + x.slice(i+1)); return {n:q, w:'t'}; }
    const i = x.search(/[^\d]/); if(i<0){ q.n = x; return {n:q, w:'n'}; }
    q.n = x.slice(0, i); const rest = x.slice(i);
    if(rest[0]==='^'){ if(!mag('e')) return {n:q, w:'n'}; const m0 = q.m; q.m = false; const g = {k:'g', b:{k:'s', t:[{k:'t', s:'+', f:[q]}]}, e:'', m:m0}; zet(q, g); return voedE(g, rest.slice(1)); }
    if(rest[0]==='/') return {n:q, w:'n'};
    return voedB(naFactor(q, nieuwA('', false, true)), rest);
  }
  /* een lege plek achter een haakje of exponent opruimen (bij een nieuwe regel) */
  const opruim = S => { S.t.forEach(T => { T.f.forEach(f => { if(f.k==='g') opruim(f.b); }); const k = T.f.filter(f => !(f.auto && EX.leegA(f))); T.f = k.length ? k : [EX.A()]; }); };
  /* wistoets in een leeg vakje */
  function wis(n, w){
    if(w==='e'){ n.e = null; ch(); draw(); focus(n.k==='g' ? eind(n.b) : {n, w:'b'}); return; }
    if(n.k==='q'){ if(w==='n' || !n.n){ const a = EX.A(n.t, n.m); zet(n, a); ch(); draw(); focus({n:a, w:'b'}); } return; }
    if(n.e!=null) return;
    const T = ouder(n), pt = P.get(T), S = pt.o, ia = P.get(n).i;
    if(T.f.length>1){ weg(n); ch(); draw(); focus(ia>0 ? eind(T.f[ia-1]) : begin(T.f[0])); return; }
    if(pt.i===0 && T.s==='-'){ T.s = '+'; ch(); draw(); focus({n, w:'b'}); return; }
    if(S.t.length>1){ S.t.splice(pt.i, 1); index(); ch(); draw(); focus(pt.i>0 ? eind(S.t[pt.i-1]) : begin(S.t[0])); return; }
    const g = P.get(S).o; if(g.k==='g'){ const a = EX.A('', g.m); zet(g, a); ch(); draw(); focus({n:a, w:'b'}); }
  }
  function toets(e, n, w, inp){ index();
    const L = inp.value.length, pos = inp.selectionStart, end = inp.selectionEnd, i = alle.indexOf(inp);
    if(e.key==='Backspace' && inp.value===''){ e.preventDefault(); wis(n, w); return; }
    if(e.key==='ArrowLeft' && pos===0 && end===0 && i>0){ e.preventDefault(); const x = alle[i-1]; x.focus(); x.setSelectionRange(x.value.length, x.value.length); return; }
    if(e.key==='ArrowRight' && pos===L){
      if(i>=0 && i<alle.length-1){ e.preventDefault(); const x = alle[i+1]; x.focus(); x.setSelectionRange(0, 0); return; }
      if(enkel) return;
      e.preventDefault(); const g = groepVan(n);
      if(g){ const t = uitGroep(g, ''); ch(); draw(); focus(t); return; }
      if(!(n.k==='a' && EX.leegA(n))){ const b = naFactor(n, nieuwA('', false, true)); ch(); draw(); focus({n:b, w:'b'}); } return; }
    if((e.key==='ArrowDown' || e.key==='ArrowUp') && n.k==='q'){ e.preventDefault(); focus({n, w:e.key==='ArrowDown' ? 'n' : 't'}); }
  }
  /* vorm zonder de getallen: verandert die, dan tekenen we opnieuw */
  const vorm = n => n.k==='s' ? '[' + n.t.map(vorm).join() + ']' : n.k==='t' ? n.s + '(' + n.f.map(vorm).join() + ')' : n.k==='g' ? 'g' + (n.m ? 'm' : '') + (n.e==null ? '' : '^') + vorm(n.b) : n.k==='q' ? 'q' + (n.m ? 'm' : '') : 'a' + (n.m ? 'm' : '') + (n.e==null ? '' : '^') + (n.auto ? '*' : '') + (/^[a-z]$/i.test(n.s||'') ? 'L' : '');
  function hook(inp, n, w, actief){
    if(!actief){ inp.readOnly = true; inp.tabIndex = -1; return; }
    inp.addEventListener('focus', ()=>{ foc = {n, w}; actiefVak(inp); });
    inp.addEventListener('input', ()=>{ index(); const L = v.r[v.r.length-1], voor = vorm(L.b);
      const t = w==='b' ? voedB(n, inp.value) : w==='e' ? voedE(n, inp.value) : voedQ(n, w, inp.value);
      const nu = w==='b' ? n.s : w==='e' ? n.e : n[w];
      if(vorm(L.b)!==voor || t.n!==n || t.w!==w || nu!==inp.value){ ch(); draw(); focus(t); } else ch(); });
    inp.addEventListener('keydown', e=>toets(e, n, w, inp));
  }
  function rendS(S, actief){ const s = el('span', 'm6-som');
    S.t.forEach((T, i) => {
      if(i>0 || T.s==='-'){ const op = el(actief ? 'button' : 'span', 'm6-op' + (i===0 ? ' voor' : ''), T.s==='-' ? MIN : '+');
        if(actief){ op.type = 'button'; op.tabIndex = -1; op.dataset.tip = 'ander teken'; op.setAttribute('aria-label', 'teken van deze term: klik om te wisselen'); op.addEventListener('mousedown', e=>e.preventDefault());
          op.addEventListener('click', ()=>{ index(); T.s = T.s==='-' ? '+' : '-'; ch(); draw(); focus(foc && P.has(foc.n) ? foc : eind(T)); }); }
        s.append(op); }
      T.f.forEach((f, j) => { if(!actief && EX.weg(f, T)) return; if(j && f.m) s.append(el('span', 'vx-maal', '·')); s.append(rendF(f, actief)); });
    });
    return s; }
  function rendF(n, actief){ const x = {};
    if(n.k==='a'){ const fe = el('span', 'vx-f'); const bi = m4inp('b vx-b' + (n.auto && EX.leegA(n) ? ' m6-auto' : '') + (/^[a-z]$/i.test(n.s||'') ? ' m6-let' : ''), n.s, 'getal of letter'); x.b = bi; fe.append(bi); hook(bi, n, 'b', actief);
      if(n.e!=null) fe.append(expIn(n, x, actief)); IN.set(n, x); return fe; }
    if(n.k==='q'){ const br = el('span', 'br vx-br m6-q'), bt = el('span', 'br-t'), bn = el('span', 'br-n');
      const ti = m4inp('b vx-b', n.t, 'teller'), ni = m4inp('b vx-b', n.n, 'noemer'); x.t = ti; x.n = ni; bt.append(ti); bn.append(ni); br.append(bt, bn);
      hook(ti, n, 't', actief); hook(ni, n, 'n', actief); IN.set(n, x); return br; }
    const fe = el('span', 'vx-f vx-g'); const groot = n.b.t.some(T => T.f.some(f => f.k==='q')) ? ' groot' : '';
    fe.append(el('span', 'vx-par' + groot, '('), rendS(n.b, actief), el('span', 'vx-par' + groot, ')'));
    if(n.e!=null) fe.append(expIn(n, x, actief)); IN.set(n, x); return fe;
  }
  function expIn(n, x, actief){ const ex = m4inp('ex', n.e, 'exponent'); x.e = ex; const sup = el('span', 'm4-exp'); sup.append(ex); hook(ex, n, 'e', actief); return sup; }
  let bar = null;
  function draw(){ index(); IN = new Map(); sp.innerHTML = '';
    v.r.forEach((L, li) => { const actief = li===v.r.length-1;
      const row = el('div', 'vx-regel m6-regel' + (actief ? ' actief' : '')); if(!een) row.append(el('span', 'm4-is vx-is', '=')); row.append(rendS(L.b, actief)); sp.append(row); });
    alle = [...sp.querySelectorAll('.vx-regel.actief input')];
    if(enkel) mini(); else balk(); kruisjes(false); }
  const doe = (fn) => () => { index(); const L = v.r[v.r.length-1]; const t = foc && P.has(foc.n) && regelVan(foc.n)===L ? foc : eind(L.b); fn(t); };
  const typ = c => t => { const n = t.n, w = t.w; const cur = w==='b' ? (n.s||'') : w==='e' ? (n.e||'') : (n[w]||'');
    const r = w==='b' ? voedB(n, cur + c) : w==='e' ? voedE(n, cur + c) : voedQ(n, w, cur + c); ch(); draw(); focus(r); };
  function macht(t){ const n = t.n;
    if(t.w==='e' || (n.k==='a' && n.e!=null)){ n.e = null; ch(); draw(); focus(n.k==='g' ? eind(n.b) : {n, w:'b'}); return; }
    if(n.k==='g'){ n.e = ''; ch(); draw(); focus({n, w:'e'}); return; }
    typ('^')(n.k==='q' ? {n, w:'n'} : t); }
  function haak(t){ const n = t.n, g = groepVan(n);
    if(g){ const LT = g.b.t[g.b.t.length-1]; if(LT.f[LT.f.length-1]===n && (n.k!=='a' || !EX.leegA(n) || n.auto)){ if(n.auto && EX.leegA(n)) weg(n); const r = uitGroep(g, ''); ch(); draw(); focus(r); return; } }
    typ('(')(t); }
  function breukK(t){ const n = t.n; if(n.k==='q'){ const a = EX.A(n.t, n.m); zet(n, a); ch(); draw(); focus({n:a, w:'b'}); return; } typ('/')(t); }
  function balk(){
    if(!bar){ bar = el('div', 'vx-balk m6-balk'); const q = sp.closest('.m4-q'), act = q && q.querySelector(':scope > .q-act'); if(act) q.insertBefore(bar, act); else sp.after(bar); }
    bar.innerHTML = ''; const tools = el('div', 'vx-tools'); bar.append(tools);
    const knop = (ic, lab, tip, fn, cls='') => { const b = el('button', 'vx-k ' + cls, `<span class="vx-ic">${ic}</span>`); b.type = 'button'; b.dataset.tip = lab; b.setAttribute('aria-label', tip);
      b.addEventListener('mousedown', e=>e.preventDefault()); b.addEventListener('click', doe(fn)); tools.append(b); return b; };
    if(mag('p')) knop('<span class="m6-kt">+</span>', 'plus', 'plus: een nieuwe term', typ('+'));
    if(mag('n')) knop(`<span class="m6-kt">${MIN}</span>`, 'min', 'min: een nieuwe term', typ('-'));
    if(mag('m')) knop('<span class="vx-dot">·</span><span class="vx-hok"></span>', 'maal', 'nog een factor erbij (maal)', typ('*'));
    if(mag('e')) knop(XP_IC, 'macht', 'exponent bij het actieve vakje', macht);
    if(mag('h')) knop('(&#8239;&#8239;)', 'haakjes', 'haakjes openen of sluiten', haak);
    if(mag('b')) knop(BRK_IC, 'breuk', 'breuk', breukK, 'vx-brk');
    undoB = knop('↶', 'terug', 'ongedaan maken', terug, 'vx-terug'); undoB.disabled = hist.length<2;
    if(!een && v.r.length>1) knop('✕', 'regel weg', 'deze regel weghalen', () => { v.r.pop(); ch(); draw(); focus(eind(v.r[v.r.length-1].b)); }, 'vx-weg');
    if(!een){ const plus = el('button', 'btn ghost vx-plus', '<span class="sr-only">volgende tussenstap</span>'); plus.type = 'button'; plus.dataset.tip = 'volgende tussenstap'; plus.setAttribute('aria-label', 'volgende tussenstap: nieuwe regel');
      plus.addEventListener('click', ()=>{ opruim(v.r[v.r.length-1].b); v.r.push({b:EX.S()}); ch(); draw(); focus(begin(v.r[v.r.length-1].b)); }); bar.append(plus); }
    bar.append(el('div', 'vx-snel', '<span>Typen kan ook:</span>' + [['e', '<kbd>^</kbd> macht: x^2'], ['h', '<kbd>(</kbd> <kbd>)</kbd> haakjes'], ['m', '<kbd>*</kbd> maal'], ['b', '<kbd>/</kbd> breuk']].filter(([c]) => mag(c)).map(([, t]) => `<span>${t}</span>`).join('')));
  }
  /* termvak: kleine knopjes naast het vak */
  function mini(){ const m = el('span', 'm6-mini');
    const knop = (ic, tip, fn) => { const b = el('button', 'm4-brk m6-mk', ic); b.type = 'button'; b.dataset.tip = tip; b.setAttribute('aria-label', tip); b.addEventListener('mousedown', e=>e.preventDefault()); b.addEventListener('click', doe(fn)); m.append(b); };
    if(mag('e')) knop('<i>x</i><sup>n</sup>', 'macht', macht);
    if(mag('b')) knop(BRK_IC, 'breuk', breukK);
    if(m.childNodes.length) sp.append(m); }
  function kruisjes(alleR){
    if(een || !api.check) return; try{ api.check(); }catch(e){ return; }
    const res = v._res || [];
    sp.querySelectorAll('.vx-regel').forEach((row, li) => { row.querySelectorAll('.vx-x, .vx-uit').forEach(x => x.remove());
      const r = res[li]; if(!r || (!alleR && li===v.r.length-1)) return; const U = r.err || (r.eq===false ? r.uitleg : ''); if(!U) return;
      const x = el('button', 'vx-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'hier is iets fout: toon uitleg'); x.dataset.tip = 'iets fout? klik voor uitleg';
      const box = el('div', 'vx-uit', `<button type="button" class="vx-uit-dicht" aria-label="sluit">×</button>${U}`); box.hidden = true;
      x.addEventListener('mousedown', e=>e.preventDefault());
      x.addEventListener('click', ()=>{ box.hidden = !box.hidden; x.setAttribute('aria-expanded', String(!box.hidden)); });
      box.querySelector('.vx-uit-dicht').addEventListener('click', ()=>{ box.hidden = true; });
      row.append(x, box); }); }
  const api = {check:null, enkel, toon:()=>kruisjes(false),
    trim(){ let w = false; while(v.r.length>1 && EX.leeg(v.r[v.r.length-1].b)){ v.r.pop(); w = true; } if(w){ ch(); draw(); } }};
  draw();
  return Object.assign(api, {
    mark(on){ if(enkel) return; const res = v._res || []; sp.querySelectorAll('.vx-regel').forEach((row, li) => { row.classList.remove('ok', 'bad', 'bijna'); const r = res[li]; if(on==null || !r || r.err || r.eq==null) return;
      row.classList.add(!r.eq ? 'bad' : (li===v.r.length-1 && r.why) ? 'bijna' : 'ok'); }); if(on!=null) kruisjes(true); else { const a = sp.querySelector('.vx-regel.actief'); if(a) a.querySelectorAll('.vx-x, .vx-uit').forEach(x => x.remove()); } },
    lock(){ if(bar) bar.remove(); sp.querySelectorAll('.m6-mini').forEach(x => x.remove()); sp.querySelectorAll('.vx-actief').forEach(x => x.classList.remove('vx-actief')); sp.querySelectorAll('button.m6-op').forEach(b => b.disabled = true); }
  });
}
/* ---------- spiekbriefje: hoe werken de knoppen? ---------- */
const VP_HULP = k => `<h3>Spiekbriefje · zo bouw je je antwoord</h3><table>
  <tr><td><span class="vx-k vx-demo"><span class="vx-ic"><span class="m6-kt">+</span></span></span> <span class="vx-k vx-demo"><span class="vx-ic"><span class="m6-kt">${MIN}</span></span></span></td><td><b>plus en min</b>: een nieuwe term. Typen kan ook. Klik je op een + of ${MIN} tussen twee termen, dan wisselt het teken.</td><td><kbd>+</kbd> <kbd>-</kbd></td></tr>
  ${k.includes('m') ? `<tr><td><span class="vx-k vx-demo"><span class="vx-ic"><span class="vx-dot">·</span><span class="vx-hok"></span></span></span></td><td><b>maal</b>: een maalteken met een nieuwe factor, bijvoorbeeld 2 · 3<i>x</i>. Typ je <b>4x</b>, dan staan 4 en <i>x</i> vanzelf in twee vakjes, zonder maalteken.</td><td><kbd>*</kbd></td></tr>` : ''}
  ${k.includes('e') ? `<tr><td><span class="vx-k vx-demo"><span class="vx-ic">${XP_IC}</span></span></td><td><b>macht</b>: een exponent bij het actieve vakje. Typ <b>x^2</b> of <b>x2</b> voor <i>x</i><sup>2</sup>. Met het pijltje → ga je uit de exponent.</td><td><kbd>^</kbd></td></tr>` : ''}
  ${k.includes('h') ? `<tr><td><span class="vx-k vx-demo"><span class="vx-ic">(&#8239;&#8239;)</span></span></td><td><b>haakjes</b>: openen, en op het einde van de haakjes weer sluiten. Na het sluiten kan je een exponent zetten: (2<i>x</i>)<sup>2</sup>. Typ je ${MIN} na een maalteken, dan komen er vanzelf haakjes: 2 · (${MIN}3).</td><td><kbd>(</kbd> <kbd>)</kbd></td></tr>` : ''}
  ${k.includes('b') ? `<tr><td><span class="vx-k vx-brk vx-demo"><span class="vx-ic">${BRK_IC}</span></span></td><td><b>breuk</b>: het getal wordt de teller, eronder komt de noemer. Typ <b>1/2x</b> voor ${EH('1/2x')}. Met ↑ en ↓ spring je tussen teller en noemer.</td><td><kbd>/</kbd></td></tr>` : ''}
  <tr><td><span class="vx-k vx-demo"><span class="vx-ic">↶</span></span></td><td><b>terug</b>: maakt je laatste wijziging ongedaan. In een leeg vakje haalt de wistoets dat vakje weg.</td><td><kbd>⌫</kbd></td></tr>
  ${k.includes('1') ? '' : `<tr><td><span class="btn ghost vx-plus vx-demo">=</span></td><td><b>volgende tussenstap</b>: een nieuwe regel. Schrijf elke stap op een eigen regel, zoals op papier. Met <b>✕</b> haal je de laatste regel weg.</td><td></td></tr>`}</table>
  <p><b>Het oranje vakje</b> is actief: daar werken de knoppen op. <b>Bijna juist</b> betekent: je stap klopt, maar je bent nog niet klaar. Een <b class="vx-rood">✕</b> naast een regel betekent dat daar iets fout ging: klik erop voor uitleg.</p>`;
function vpHulp(card){
  const head = card.querySelector('.card-head'); if(!head || head.querySelector('.vx-hulp-btn')) return;
  const b = el('button', 'cheat-btn vx-hulp-btn', '<span aria-hidden="true">?</span>'); b.type = 'button'; b.dataset.tip = 'hoe werken de knoppen?'; b.setAttribute('aria-label', 'hoe werken de knoppen?'); b.setAttribute('aria-expanded', 'false');
  const panel = el('div', 'cheat vx-hulp', VP_HULP([...new Set([...card.querySelectorAll('.m4-wp')].map(x => x.dataset.knoppen || VP_KNOPPEN).join(''))].join(''))); panel.hidden = true;
  b.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; b.setAttribute('aria-expanded', String(!panel.hidden)); });
  const rb = head.querySelector('.refresh-btn'); head.insertBefore(b, rb || null); head.after(panel);
}
(function(){ const css = `
  .m4-line:has(> .m4-wp){flex-wrap:wrap; row-gap:.5rem}
  .m4-wp{flex-basis:100%; flex-direction:column; align-items:flex-start; gap:.5rem; padding-left:1.4rem}
  .m4-items:has(.m4-wp){grid-template-columns:minmax(0, 1fr) !important}
  .m6-som{display:inline-flex; align-items:center; flex-wrap:wrap; gap:.12rem}
  .m6-som:has(> .vx-f > .m4-exp){padding-top:.45rem}
  .m6-op{font:inherit; font-weight:700; font-size:1.2rem; border:0; background:transparent; color:var(--ink); padding:0 .3rem; border-radius:.3rem; line-height:1.2}
  button.m6-op{cursor:pointer} button.m6-op:hover{background:var(--or-soft)}
  .m6-op.voor{padding:0 .1rem 0 0}
  .vx-f .m4-in.m6-auto{--w:1.15rem; border-style:dashed; opacity:.65; padding:0}
  .vx-f .m4-in.m6-auto:focus{--w:2.3rem; opacity:1}
  .m4-in.m6-let{font-style:italic}
  .m6-q{margin:0 .1rem} .m6-q .m4-in.b{--w:2.1rem; height:1.8rem; font-size:1rem}
  .m6-q .m4-in.vx-actief{border-color:var(--orange); border-width:2.5px; box-shadow:0 0 0 3px var(--or-soft)}
  .m4-wt{display:inline-flex; align-items:center; gap:.1rem; vertical-align:middle}
  .m4-wt .vx-regel{display:inline-flex}
  .m4-wt.ok .m4-in{border-color:var(--ok); background:var(--ok-bg)} .m4-wt.bad .m4-in{border-color:var(--bad); background:var(--bad-bg)}
  .m6-mini{display:inline-flex; flex-direction:column; gap:1px; margin-left:.05rem}
  .m6-mk{font-size:.72rem; font-weight:700; line-height:1; padding:.15rem .2rem; position:relative}
  .m6-mk i{font-family:inherit} .m6-mk sup{font-size:.75em; color:var(--orange)}
  .m6-mk::after, .m6-op[data-tip]::after{content:attr(data-tip); position:absolute; left:50%; top:calc(100% + 4px); transform:translateX(-50%); white-space:nowrap; background:var(--ink); color:var(--bg, #fff); font-size:.72rem; font-weight:700; padding:.15rem .45rem; border-radius:.35rem; opacity:0; pointer-events:none; transition:opacity .15s; z-index:20}
  .m6-mk:hover::after, button.m6-op:hover::after{opacity:1; transition-delay:1s}
  button.m6-op{position:relative}
  .m6-kt{font-size:1.25rem; line-height:1}
  .m6-x{white-space:normal}
  .m6-g{display:inline; white-space:nowrap}
  .m6-x .m4-m{vertical-align:baseline}
  .m4-wz .m4-teken.plus-weg button[data-w="+"]{color:var(--ink); background:var(--tq)}
  .m4-wz .m4-teken.plus-weg.net button[data-w="+"]{animation:none}
  .m4-wz.ok .m4-teken{border-color:var(--ok)} .m4-wz.bad .m4-teken{border-color:var(--bad)}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* ============================================================
   ONDERDEEL · VEELTERM MAAL VEELTERM (uitgebreide distributiviteit)
   ============================================================ */
Object.assign(ICONS, {
  m6_vv:'<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M11 5v14M3 12h18"/>',
  m6_kw:'<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M12 4v16M4 12h16"/><path d="M4 4l8 8" stroke-dasharray="2 2"/>'
});
/* ---------- kleine hulpjes om opgaven te maken (als tekst voor EX.parse) ---------- */
const trm = (c, m='') => (c<0 ? '-' : '+') + (Math.abs(c)===1 && m ? '' : String(Math.abs(c))) + m;
const som = (...ts) => ts.filter(Boolean).join('').replace(/^\+/, '');
const hT = s => /^-/.test(s) ? `(${s})` : s;
const nz = (R, a, b) => { let x = 0; while(!x) x = R.int(a, b); return x; };
const termen = str => EX.parse(str).t.map(T => (T.s==='-' ? '-' : '') + T.f.map(f => f.k==='q' ? f.t + '/' + f.n : f.s + (f.e!=null ? '^' + (/^\d+$/.test(f.e) ? f.e : '{' + f.e + '}') : '')).join(''));
/* svg: uitdrukking als tekst met cursieve letters en exponenten */
const sX = str => { const sup = e => `<tspan class="sup" dy="-7">${sg(e)}</tspan><tspan dy="7">&#8202;</tspan>`;
  const w = n => n.k==='s' ? n.t.map((T, i) => (i ? (T.s==='-' ? ` ${MIN} ` : ' + ') : (T.s==='-' ? MIN : '')) + w(T)).join('')
    : n.k==='t' ? n.f.map((f, i) => (i && f.m ? ' · ' : '') + w(f)).join('') : n.k==='q' ? `${n.t}/${n.n}`
    : n.k==='a' ? (/^[a-z]$/i.test(n.s) ? `<tspan font-style="italic">${n.s}</tspan>` : n.s) + (n.e==null ? '' : sup(n.e)) : '(' + w(n.b) + ')' + (n.e==null ? '' : sup(n.e));
  return w(EX.parse(str)); };
const sXp = p => sX(PV.str(PV.sort(p)));
/* een uitwerking regel per regel (Toon mij hoe) voor het product van twee veeltermen */
function prodHoe(f1, f2){
  const A = termen(f1), Bt = termen(f2), D = EX.p(`(${f1})(${f2})`);
  const pr = A.flatMap((a, i) => Bt.map((b, j) => `${i || j ? hT(a) : a}*${hT(b)}`));
  const uit = A.flatMap(a => Bt.map(b => PV.str(EX.p(`${a}*${hT(b)}`))));
  const L = [[EH(`(${f1})(${f2})`), `Elke term van de eerste factor maal elke term van de tweede: ${A.length} · ${Bt.length} ${isq} ${A.length*Bt.length} producten.`],
    [`${isq} ${EH(pr.map((x, i) => (i ? '+' : '') + x).join(''))}`, 'Vermenigvuldig. Zet een negatieve term tussen haakjes.'],
    [`${isq} ${EH(uit.map((x, i) => (i && !/^-/.test(x) ? '+' : '') + x).join(''))}`, 'Werk elk product uit: getallen maal getallen, letters maal letters. Tel de mintekens.']];
  const H = PV.str(PV.sort(D)); if(H!==uit.map((x, i) => (i && !/^-/.test(x) ? '+' : '') + x).join('')) L.push([`${isq} ${PH(D)}`, 'Herleid: neem de gelijksoortige termen samen en rangschik in dalende machten.']);
  return L;
}
const CHEAT_VV = `<h3>Spiekbriefje · veelterm maal veelterm</h3><table>
  <tr><td>werkwijze</td><td><b>1</b> vermenigvuldig elke term van de eerste veelterm met elke term van de tweede<br><b>2</b> werk elk product uit<br><b>3</b> herleid: neem de gelijksoortige termen samen</td></tr>
  <tr><td>voorbeeld</td><td><div class="m4-line">${EH('(2x+3)(x-4)')}</div><div class="m4-line">${isq} ${EH('2x*x+2x*(-4)+3*x+3*(-4)')}</div><div class="m4-line">${isq} ${EH('2x^2-8x+3x-12')}</div><div class="m4-line">${isq} ${EH('2x^2-5x-12')}</div></td></tr>
  <tr><td>tekenregel</td><td>+ maal + ${isq} + &nbsp; ${MIN} maal ${MIN} ${isq} + &nbsp; + maal ${MIN} ${isq} ${MIN}</td></tr>
  <tr><td>machten</td><td><div class="m4-line">${EH('x^2*x^3')} ${isq} ${EH('x^5')}</div>hetzelfde grondtal: exponenten optellen</td></tr>
  <tr><td>netjes</td><td>schrijf de uitkomst in dalende machten: eerst de hoogste exponent</td></tr></table>`;
const VV = {};

/* ---------- het rechthoekmodel ---------- */
function rechtSvg(p, q, k, t){
  const x0 = 70, y0 = 40, X = 150, s = 18, P = p*s, V = q*s, xs = x0 + X, ys = y0 + X, Wd = X + P, Ht = X + V;
  const it = '<tspan font-style="italic">x</tspan>'; let o = '';
  if(k<2) o += `<rect class="tegel" x="${x0}" y="${y0}" width="${Wd}" height="${Ht}" rx="2"/>`;
  else { const op = k===2 ? t : 1;
    o += `<g opacity="${fx(.25 + .75*op)}"><rect class="tegel" x="${x0}" y="${y0}" width="${X}" height="${X}"/><rect class="tegel b" x="${xs}" y="${y0}" width="${P}" height="${X}"/><rect class="tegel b" x="${x0}" y="${ys}" width="${X}" height="${V}"/><rect class="tegel c" x="${xs}" y="${ys}" width="${P}" height="${V}"/></g>`;
    o += `<g opacity="${fx(op)}">` + sT(x0 + X/2, y0 + X/2, sX('x^2'), 't big') + sT(xs + P/2, y0 + X/2, sX(p + 'x'), 't') + sT(x0 + X/2, ys + V/2, sX(q + 'x'), 't') + sT(xs + P/2, ys + V/2, String(p*q), 't') + '</g>'; }
  if(k===1){ const d = fx(t); o += `<path class="m6-snij" d="M${xs} ${y0} v${fx(Ht*d)}M${x0} ${ys} h${fx(Wd*d)}"/>`; }
  else if(k>1) o += `<path class="m6-snij" d="M${xs} ${y0} v${Ht}M${x0} ${ys} h${Wd}"/>`;
  if(k===0){ o += `<path class="as" d="M${x0} ${y0-8} v-6 H${x0+Wd} v6"/>` + sT(x0 + Wd/2, y0 - 26, `${it} + ${p}`, 't big');
    o += `<path class="as" d="M${x0-8} ${y0} h-6 V${y0+Ht} h6"/>` + sT(x0 - 22, y0 + Ht/2, `${it} + ${q}`, 't big', 'end'); }
  else { o += sT(x0 + X/2, y0 - 16, it, 't big') + sT(xs + P/2, y0 - 16, String(p), 't big') + sT(x0 - 14, y0 + X/2, it, 't big', 'end') + sT(x0 - 14, ys + V/2, String(q), 't big', 'end'); }
  if(k>=3){ const op = k===3 ? t : 1; o += `<g opacity="${fx(op)}">` + sT(x0 + Wd/2, y0 + Ht + 30, `${sX('x^2')} + ${p}${it} + ${q}${it} + ${p*q}`, 't big') + sT(x0 + Wd/2, y0 + Ht + 58, `${isq.replace(/<[^>]+>/g, '')} ${sX(`x^2+${p+q}x+${p*q}`)}`, 't big') + '</g>'; }
  return o;
}
VV.recht = { title:'Het rechthoekmodel', lvl:1,
  instr:'Een rechthoek met lengte en breedte <i>x</i> + een getal. Bekijk de stappen links en vul dan in.',
  build(b, st, save){
    const R = makeR(st); const p = R.int(1, 5); let q = R.int(1, 5); if(q===p) q = p%5 + 1;
    const opg = `(x+${p})(x+${q})`, D = EX.p(opg);
    const wrap = el('div', 'm4-naast'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    stepFig(l, { W:340, H:360, maxw:380, alt:'rechthoek verdeeld in vier stukken', steps:[
      {cap:`De oppervlakte van de rechthoek is lengte maal breedte: ${EH(opg)}.`, draw:t=>rechtSvg(p, q, 0, t)},
      {cap:`Verdeel de lengte in <i>x</i> en ${p}, de breedte in <i>x</i> en ${q}.`, draw:t=>rechtSvg(p, q, 1, t)},
      {cap:`Zo krijg je vier stukken: ${EH('x*x')} ${isq} ${EH('x^2')}, ${EH(p + '*x')} ${isq} ${EH(p + 'x')}, ${EH(q + '*x')} ${isq} ${EH(q + 'x')} en ${p} · ${q} ${isq} ${p*q}.`, draw:t=>rechtSvg(p, q, 2, t)},
      {cap:`Tel de vier stukken op en neem de gelijksoortige termen samen: ${EH(`${p}x+${q}x`)} ${isq} ${EH(`${p+q}x`)}.`, draw:t=>rechtSvg(p, q, 3, t)}] });
    const g = el('div', 'm4-items een'); r.append(g);
    const cel = `<table class="m6-rt"><tr><th></th><th><i>x</i></th><th>${p}</th></tr><tr><th><i>x</i></th><td>{{t:a}}</td><td>{{t:b}}</td></tr><tr><th>${q}</th><td>{{t:c}}</td><td>{{t:d}}</td></tr></table>`;
    mQ(g, st, save, 'd', { nr:'a)', html:`<span class="txt">De oppervlakte van elk stuk:</span> ${cel}`,
      check:V=>allOf([['a', chkT(V.a, 'x^2', [['2x', `<i>x</i> · <i>x</i> ${isq} ${EH('x^2')}, niet 2<i>x</i>.`]])], ['b', chkT(V.b, p + 'x')], ['c', chkT(V.c, q + 'x')], ['d', chkT(V.d, String(p*q), [[String(p+q), `Het stuk rechtsonder is ${p} · ${q}, niet ${p} + ${q}.`]])]]),
      sol:`${EH('x^2')}, ${EH(p + 'x')}, ${EH(q + 'x')} en ${p*q}` });
    const g2 = el('div', 'm4-items een'); b.append(g2);
    mQ(g2, st, save, 's', { nr:'b)', html:`<span class="txt">Herleid:</span> ${EH(opg)} ${isq} {{p:a,pnme1}}`,
      check:V=>chkP(V.a, D, {fout:[[`x^2+${p*q}`, 'Je vergat de twee rechthoeken in het midden.'], [`x^2+${p+q}`, `De rechthoeken in het midden zijn ${EH(p + 'x')} en ${EH(q + 'x')}: met een <i>x</i>.`]]}),
      sol:`${EH(opg)} ${isq} ${EH(`x^2+${p}x+${q}x+${p*q}`)} ${isq} ${PH(D)}` });
  } };

/* ---------- boogjes: elke term maal elke term ---------- */
/* breedte van een term in de svg (ongeveer): cijfers en letters 10,5 px, exponent 7 px */
const wEst = s => { let w = 0, sup = false; for(const c of s.replace(/^\+/, '')){ if(c==='^'){ sup = true; continue; } if(sup && /\d/.test(c)){ w += 7; continue; } sup = false; w += c==='-' ? 11 : c==='/' ? 6 : 10.5; } return w; };
function boogSvg(T, k, t){
  const y = 110, abs = s => s.replace(/^[+-]/, '');
  const stuk = [['(', 8], [T[0], wEst(T[0]), 0], ['op', 12, 1], [abs(T[1]), wEst(abs(T[1])), 1], [')', 8], ['(', 8], [T[2], wEst(T[2]), 2], ['op', 12, 3], [abs(T[3]), wEst(abs(T[3])), 3], [')', 8]];
  const gap = [4, 10, 10, 4, 8, 4, 10, 10, 4];
  const tot = stuk.reduce((s, x) => s + x[1], 0) + gap.reduce((s, x) => s + x, 0); let x = (340 - tot)/2; const X = [];
  let o = '';
  stuk.forEach(([txt, w, i], n) => { const cx = x + w/2;
    if(txt==='op') o += sT(cx, y, /^-/.test(T[i]) ? MIN : '+', 't big');
    else { o += sT(cx, y, txt==='(' || txt===')' ? txt : sX(txt), 't big'); if(i!=null) X[i] = cx; }
    x += w + (gap[n] || 0); });
  const paar = [[0, 2], [0, 3], [1, 2], [1, 3]];
  paar.forEach(([i, j], n) => { if(n+1>k) return; const x1 = X[i], x2 = X[j], boven = i===0, y1 = boven ? 90 : 130, h = 26 + (x2 - x1)*.14;
    const d = `M${x1} ${y1} Q${fx((x1+x2)/2)} ${fx(boven ? y1 - h*2 : y1 + h*2)} ${x2} ${y1}`; const nu = n+1===k && k<=4, L = (x2 - x1)*1.6;
    o += `<path class="m6-boog${nu ? '' : ' af'}" d="${d}"${nu ? ` stroke-dasharray="${fx(L)}" stroke-dashoffset="${fx(L*(1-t))}"` : ''}/>`; });
  paar.forEach(([i, j], n) => { if(n+1>k) return; const a = T[i].replace(/^\+/, ''), c = T[j].replace(/^\+/, ''); const pr = PV.str(EX.p(`${a}*${hT(c)}`));
    o += `<g opacity="${n+1===k && k<=4 ? fx(t) : 1}">` + sT(24, 190 + n*24, `${sX(a)} · ${sX(hT(c))} = ${sX(pr)}`, 't', 'start') + '</g>'; });
  if(k>=5){ const pr = paar.map(([i, j]) => PV.str(EX.p(`${T[i].replace(/^\+/, '')}*${hT(T[j].replace(/^\+/, ''))}`)));
    const sm = pr.map((x, i) => (i && !/^-/.test(x) ? '+' : '') + x).join(''); const D = EX.p(sm);
    o += `<g opacity="${fx(k===5 ? t : 1)}">` + sT(24, 296, `= ${sX(sm)}`, 't', 'start') + sT(24, 320, `= ${sXp(D)}`, 't big', 'start') + '</g>'; }
  return o;
}
VV.boog = { title:'Elke term maal elke term', lvl:1,
  instr:'Speel de boogjes af: elke term van de eerste tweeterm gaat naar elke term van de tweede. Vul dan de vier producten in, met hun teken.',
  build(b, st, save){
    const R = makeR(st); const a = R.pick([1, 2, 3]), c = R.pick([1, 2, 3, 4]); let bb = nz(R, -6, 6), d = nz(R, -6, 6); if(bb>0 && d>0) d = -d;
    const x = R.pick(['x', 'x', 'a', 'y']);
    const T = [trm(a, x).replace(/^\+/, ''), trm(bb), trm(c, x).replace(/^\+/, ''), trm(d)];
    const f1 = som(T[0], T[1]), f2 = som(T[2], T[3]), opg = `(${f1})(${f2})`, D = EX.p(opg);
    const wrap = el('div', 'm4-naast'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    const paar = [[0, 2], [0, 3], [1, 2], [1, 3]].map(([i, j]) => [T[i].replace(/^\+/, ''), T[j].replace(/^\+/, '')]);
    stepFig(l, { W:340, H:336, maxw:400, alt:'boogjes tussen de termen van twee tweetermen', steps:[
      {cap:`${EH(opg)}: twee tweetermen. Elke term van de eerste vermenigvuldig je met elke term van de tweede.`, draw:t=>boogSvg(T, 0, t)},
      ...paar.map(([u, w], n) => ({cap:`Boogje ${n+1}: ${EH(u)} · ${EH(hT(w))} ${isq} ${EH(PV.str(EX.p(`${u}*${hT(w)}`)))}`, draw:t=>boogSvg(T, n+1, t)})),
      {cap:'Tel de vier producten op en herleid: neem de gelijksoortige termen samen.', draw:t=>boogSvg(T, 5, t)}] });
    const g = el('div', 'm4-items een'); r.append(g);
    paar.forEach(([u, w], n) => { const P = EX.p(`${u}*${hT(w)}`);
      mQ(g, st, save, 'p' + n, { nr:'abcd'[n] + ')', html:`${EH(u)} · ${EH(hT(w))} ${isq} {{t:a}}`, check:V=>chkT(V.a, P, [[EX.p(`${u}+${hT(w)}`), 'Vermenigvuldig, tel niet op.']]), sol:`${EH(u)} · ${EH(hT(w))} ${isq} ${PH(P)}` }); });
    const g2 = el('div', 'm4-items een'); b.append(g2);
    mQ(g2, st, save, 'h', { nr:'e)', html:`<span class="txt">Samen en herleid:</span> ${EH(opg)} ${isq} {{p:a,pnme1}}`, check:V=>chkP(V.a, D, {ctx:{k:'prod', f:[f1, f2]}}), sol:prodHoe(f1, f2).map(([m]) => m).join(' ') });
  } };

/* ---------- de tabelmethode ---------- */
function tabelQ(g, st, save, id, nr, f1, f2){
  const A = termen(f1), Bt = termen(f2), opg = `(${f1})(${f2})`, D = EX.p(opg);
  let h = `<table class="m6-tab"><tr><th>·</th>${Bt.map(t => `<th>${EH(t)}</th>`).join('')}</tr>`;
  A.forEach((a, i) => { h += `<tr><th>${EH(a)}</th>${Bt.map((_, j) => `<td>{{t:c${i}${j}}}</td>`).join('')}</tr>`; }); h += '</table>';
  mQ(g, st, save, id, { nr, html:`<span class="txt">${EH(opg)}</span> ${h} <span class="m6-dus"><span class="txt">Herleid:</span> ${EH(opg)} ${isq} {{p:h,pnme1}}</span>`,
    check:V=>allOf([...A.flatMap((a, i) => Bt.map((t, j) => [`c${i}${j}`, chkT(V[`c${i}${j}`], EX.p(`${a}*${hT(t)}`))])), ['h', chkP(V.h, D, {ctx:{k:'prod', f:[f1, f2]}})]]),
    hint:['Vul elk vakje: de term links van de rij maal de term boven de kolom. Let op het teken.', 'Tel daarna alle vakjes op en neem de gelijksoortige termen samen.'],
    sol:`${EH(opg)} ${isq} ${PH(D)}` });
}
VV.tabel = { title:'De tabelmethode', lvl:2,
  instr:'Vul de tabel in: elk vakje is de term van de rij maal de term van de kolom. Tel dan alles op en herleid.',
  build(b, st, save){
    const R = makeR(st); const x = R.pick(['x', 'a']);
    const g = el('div', 'm4-items een'); b.append(g);
    tabelQ(g, st, save, 't0', 'a)', som(trm(R.int(2, 4), x), trm(nz(R, -5, 5))), som(trm(R.int(1, 3), x), trm(nz(R, -7, -1))));
    tabelQ(g, st, save, 't1', 'b)', som(trm(R.int(1, 3), x), trm(nz(R, -4, 4))), som(trm(1, x + '^2'), trm(nz(R, -5, 5), x), trm(nz(R, -6, 6))));
  } };

/* ---------- vrij vak: werk uit en herleid ---------- */
function vrijProd(b, st, save, items, o={}){
  const R = makeR(st, 'vb'); const vb = o.vb ? o.vb(R) : null;
  if(vb) stapUitleg(b, prodHoe(vb[0], vb[1]), {kop:'Voorbeeld', label:'Toon mij hoe'});
  reeks(b, items.length, (g, i, nr) => { const [f1, f2, extra={}] = items[i]; const opg = extra.opg || `(${f1})(${f2})`, D = EX.p(opg);
    mQ(g, st, save, 'v' + i, { nr, html:`${EH(opg)} {{p:a,${o.knop || 'pnmeh'}}}`, check:V=>chkP(V.a, D, Object.assign({ctx: f2 ? {k:'prod', f:[f1, f2]} : null}, extra.chk || {})),
      hint: o.hint || ['Vermenigvuldig elke term van de eerste factor met elke term van de tweede. Schrijf alle producten op één regel.', 'Werk elk product uit: getallen maal getallen, letters maal letters (exponenten optellen). Tel de mintekens.', 'Herleid: neem de gelijksoortige termen samen. Schrijf de uitkomst in dalende machten.'],
      sol: f2 ? prodHoe(f1, f2).map(([m]) => m).join(' ') : `${EH(opg)} ${isq} ${PH(D, extra.chk && extra.chk.dec ? {dec:true} : {})}` }); }, {een:true});
}
VV.vrij = { title:'Werk uit en herleid', lvl:2,
  instr:'Werk uit en herleid. Schrijf elke tussenstap op een nieuwe regel met <b>=</b>. Typ <b>x^2</b> voor <i>x</i><sup>2</sup>.',
  build(b, st, save){
    const R = makeR(st); const L = R.shuffle(['x', 'a', 'y', 'p']);
    const k = () => R.int(1, 5), n = () => nz(R, -9, 9);
    const items = [[som(trm(k(), L[0]), trm(R.int(1, 7))), som(trm(k(), L[0]), trm(-R.int(1, 8)))],
      [som(trm(k(), L[1]), trm(-R.int(1, 6))), som(trm(R.int(2, 5), L[1]), trm(-R.int(1, 6)))],
      [som(trm(R.int(2, 7)), trm(-R.int(1, 4), L[2])), som(trm(R.int(1, 3), L[2]), trm(n()))],
      [som(trm(-R.int(1, 4), L[3]), trm(n())), som(trm(R.int(2, 6), L[3]), trm(n()))]];
    vrijProd(b, st, save, items, {vb:R2 => [som(trm(R2.int(2, 4), 'x'), trm(-R2.int(2, 7))), som(trm(R2.int(2, 5), 'x'), trm(R2.int(1, 4)))]});
  } };
VV.meer = { title:'Met machten en meer termen', lvl:2,
  instr:'Werk uit en herleid. Bij een tweeterm maal een drieterm krijg je 6 producten. Rangschik de uitkomst in dalende machten.',
  build(b, st, save){
    const R = makeR(st);
    const items = R.shuffle([
      [som(trm(1, 'x^2'), trm(R.int(2, 5))), som(trm(R.int(2, 4), 'x'), trm(-R.int(1, 5)))],
      [som(trm(R.int(2, 3), 'a'), trm(nz(R, -4, 4))), som(trm(1, 'a^2'), trm(nz(R, -5, 5), 'a'), trm(nz(R, -6, 6)))],
      [som(trm(1, 'x^2'), trm(R.int(2, 6), 'x')), som(trm(R.int(2, 4), 'x'), trm(-R.int(1, 5)))],
      [som(trm(R.int(2, 4), 'a'), trm(R.pick([1, -1]), 'b')), som(trm(1, 'a'), trm(-R.int(2, 4), 'b'))],
      [som(trm(R.int(2, 3), 'y^3'), trm(-1, 'y')), som(trm(1, 'y^2'), trm(R.int(2, 5)))]]).slice(0, 4);
    vrijProd(b, st, save, items, {vb:R2 => [som(trm(1, 'x^2'), trm(-R2.int(2, 4))), som(trm(R2.int(2, 3), 'x'), trm(R2.int(1, 5)))]});
  } };
VV.brk = { title:'Met breuken en kommagetallen', lvl:2,
  instr:'Werk uit en herleid. Een breuk maak je met <b>/</b> of met de breukknop. Vereenvoudig breuken.',
  build(b, st, save){
    const R = makeR(st);
    const kq = R.pick([2, 3, 4]), m1 = nz(R, -5, 5), n1 = kq*R.pick([-2, -1, 1, 2]);
    const m2 = nz(R, -6, 6), n2 = 2*R.pick([-3, -2, -1, 1, 2, 3]);
    const m3 = R.pick([-3, -2, -1, 1, 2, 3]), n3 = 5*R.pick([-2, -1, 1, 2]);
    const items = [[som(`1/${kq}x`, trm(m1)), som(trm(kq, 'x'), trm(n1))],
      [som('0,5a', trm(m2)), som('2a', trm(n2)), {chk:{dec:true}}],
      [som('0,2x^2', trm(m3)), som('5x^2', trm(n3)), {chk:{dec:true}}],
      [som('2/3y', trm(-R.int(1, 4))), som('3/4y', trm(R.int(1, 5)))]];
    vrijProd(b, st, save, items, {knop:'pnmehb'});
  } };
/* verdieping */
VV.drie = { title:'Drie factoren', lvl:3,
  instr:'Werk uit en herleid. Vermenigvuldig eerst twee factoren en herleid. Vermenigvuldig dat dan met de derde factor.',
  build(b, st, save){
    const R = makeR(st); const [p1, p2, p3] = R.shuffle([1, 2, 3, 4]); const k = R.int(2, 4);
    const items = [[`(x+${p1})(x-${p2})(x+${p3})`], [`${k}a(a-${R.int(1, 5)})(a+${R.int(1, 5)})`], [`(2y-1)(y+${R.int(1, 4)})(y-${R.int(1, 3)})`]];
    vrijProd(b, st, save, items.map(([o]) => ['', '', {opg:o}]), {hint:['Begin met de eerste twee factoren: elke term maal elke term. Herleid.', 'Zet je uitkomst tussen haakjes en vermenigvuldig met de derde factor: elke term maal elke term.', 'Herleid en rangschik in dalende machten.']});
  } };
VV.somp = { title:'Som en verschil van producten', lvl:3,
  instr:'Werk uit en herleid. Werk elk product eerst uit <b>tussen haakjes</b>. Een min voor de haakjes verandert het teken van elke term erin.',
  build(b, st, save){
    const R = makeR(st); const n = () => R.int(1, 6);
    const items = [[`(x+${n()})(x-${n()})-(x-${n()})(x+${n()})`], [`(2a-${n()})(a+${n()})+(a-${n()})(3a+${n()})`], [`${R.int(2, 4)}y(y-${n()})-(y+${n()})(2y-${n()})`]];
    vrijProd(b, st, save, items.map(([o]) => ['', '', {opg:o}]), {hint:['Werk het eerste product uit en zet de uitkomst tussen haakjes.', 'Werk het tweede product uit en zet de uitkomst ook tussen haakjes.', 'Werk de haakjes weg: staat er een min voor, dan verandert het teken van elke term. Herleid.']});
  } };
VV.ontbr = { title:'Vul aan zodat het klopt', lvl:3,
  instr:'Welke term moet in het vakje staan? Reken na: werk de linkerkant uit en vergelijk.',
  build(b, st, save){
    const R = makeR(st); const g = el('div', 'm4-items een'); b.append(g);
    const a = R.int(2, 7); let bb = R.int(2, 7); if(bb===a) bb++;
    mQ(g, st, save, 'o0', { nr:'a)', html:`(<i>x</i> + {{t:u}})(${EH('x-' + bb)}) ${isq} ${PH(EX.p(`(x+${a})(x-${bb})`))}`, check:V=>allOf([['u', chkT(V.u, String(a))]]),
      hint:[`Het laatste getal is ${MIN}${a*bb}: het product van het getal in het vakje en ${MIN}${bb}.`], sol:`${a}` });
    const k = R.int(2, 5), c = nz(R, -6, 6), d = R.pick([-4, -3, -2, 2, 3, 4]);
    mQ(g, st, save, 'o1', { nr:'b)', html:`({{t:u}} ${c<0 ? MIN : '+'} ${Math.abs(c)})(${EH(som('x', trm(d)))}) ${isq} ${PH(EX.p(`(${k}x${trm(c)})(x${trm(d)})`))}`, check:V=>allOf([['u', chkT(V.u, k + 'x')]]),
      hint:[`De eerste term van de uitkomst is ${PH(EX.p(k + 'x^2'))}: dat is de term in het vakje maal <i>x</i>.`], sol:EH(k + 'x') });
    const kk = R.int(2, 4), u = R.int(1, 5), w = R.int(2, 4), vv = R.int(1, 6);
    mQ(g, st, save, 'o2', { nr:'c)', html:`(${EH(kk + 'a')} ${MIN} {{t:u}})({{t:w}} + ${vv}) ${isq} ${PH(EX.p(`(${kk}a-${u})(${w}a+${vv})`))}`,
      check:V=>allOf([['u', chkT(V.u, String(u))], ['w', chkT(V.w, w + 'a')]]),
      hint:[`De eerste term ${PH(EX.p(`${kk*w}a^2`))} is ${EH(kk + 'a')} maal het tweede vakje.`, `De laatste term ${MIN}${u*vv} is het eerste vakje maal ${vv}, met een minteken.`], sol:`${u} en ${EH(w + 'a')}` });
  } };

SEC.vv = { id:'vv', ic:'m6_vv', nav:'Veelterm maal veelterm', title:'Een veelterm vermenigvuldigen met een veelterm',
  tip:'Typ je antwoord zoals op papier: <b>2x^2</b> wordt 2<i>x</i><sup>2</sup>. Met <b>+</b> en <b>−</b> begin je een nieuwe term, met <b>=</b> een nieuwe regel voor een tussenstap. Klik op <b>?</b> rechtsboven op een kaart voor uitleg bij de knoppen.',
  cheat:CHEAT_VV, cards:[VV.recht, VV.boog, VV.tabel, VV.vrij, VV.meer, VV.brk, VV.drie, VV.somp, VV.ontbr] };
(function(){ const css = `
  .m6-rt, .m6-tab{border-collapse:collapse; margin:.2rem 0; font-size:1.1rem}
  .m6-rt th, .m6-rt td, .m6-tab th, .m6-tab td{border:1.5px solid var(--border); padding:.3rem .45rem; text-align:center}
  .m6-rt th, .m6-tab th{background:var(--accent-soft); font-weight:700; min-width:2.2rem}
  .m6-rt th:first-child, .m6-tab th:first-child{background:var(--accent-soft)}
  .m6-rt tr:first-child th:first-child{background:transparent; border-color:transparent}
  .m6-tab tr:first-child th:first-child{color:var(--ink-soft)}
  .m6-dus{display:inline-flex; align-items:center; gap:.3rem; flex-wrap:wrap; flex-basis:100%}
  .m4-wp[data-knoppen*="1"]{flex-basis:auto; padding-left:0}
  .m4-line:has(> .m4-wp[data-knoppen*="1"]){flex-wrap:wrap}
  .mf .m6-snij{stroke:var(--accent-dark); stroke-width:2; stroke-dasharray:6 5; fill:none}
  .mf .m6-boog{fill:none; stroke:var(--orange); stroke-width:2.6; stroke-linecap:round}
  .mf .m6-boog.af{stroke:var(--accent-dark); stroke-width:1.8; opacity:.55}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* ============================================================
   ONDERDEEL · KWADRAAT VAN EEN TWEETERM
   Eén formule (a + b)² = a² + 2ab + b², b mag negatief zijn.
   Werkwijze: links a², rechts b², midden open; dan het dubbel product 2 · a · b met zijn teken;
   rangschikken in dalende machten is een aparte stap.
   ============================================================ */
const CHEAT_KW = `<h3>Spiekbriefje · kwadraat van een tweeterm</h3><table>
  <tr><td>formule</td><td><div class="m4-line">${EH('(a+b)^2')} ${isq} ${EH('a^2+2*a*b+b^2')}</div><i>b</i> mag ook negatief zijn</td></tr>
  <tr><td>werkwijze</td><td><b>1</b> noteer links <i>a</i>² en rechts <i>b</i>², laat plaats in het midden<br><b>2</b> vul het midden in: het dubbel product 2 · <i>a</i> · <i>b</i>, met zijn teken<br><b>3</b> reken uit en rangschik in dalende machten</td></tr>
  <tr><td>voorbeeld</td><td><div class="m4-line">${EH('(3x-5)^2')} &nbsp; <span class="txt"><i>a</i> ${isq} 3<i>x</i>, <i>b</i> ${isq} ${MIN}5</span></div><div class="m4-line">${isq} ${EH('(3x)^2+2*3x*(-5)+(-5)^2')}</div><div class="m4-line">${isq} ${EH('9x^2-30x+25')}</div></td></tr>
  <tr><td>let op</td><td><div class="m4-line">${EH('(a+b)^2')} ≠ ${EH('a^2+b^2')}</div>een kwadraat is altijd positief: ${EH('(-5)^2')} ${isq} 25<br>kwadrateer de hele term: ${EH('(3x)^2')} ${isq} ${EH('9x^2')}</td></tr></table>`;
const KW = {};
const kwm = (p, e=2) => `<span class="m4-m"><span class="m6-g">${KH(p)}</span><sup class="m4-sup">${e}</sup></span>`;
/* (a + b)² als tekst; b met zijn teken ('-5', '+2y' of '2y') */
const kwOpg = (a, b) => `(${som(a, /^[+-]/.test(b) ? b : '+' + b)})^2`;
function kwDelen(a, b){ const A = EX.p(a), B = EX.p(b.replace(/^\+/, '')), A2 = PV.pow(A, 2), B2 = PV.pow(B, 2), M = PV.mul(PV.c(2), PV.mul(A, B));
  const D = PV.som(A2, M, B2), nat = PV.norm([...A2, ...M, ...B2]); return {A, B, A2, B2, M, D, nat, rang: PV.str(nat)!==PV.str(PV.sort(D))}; }
/* het getal niet gekwadrateerd: (3x)² = 3x² */
const kwNiet = A => A.length===1 && !qEq(A[0].c, Q(1)) && !qEq(A[0].c, Q(-1)) && Object.keys(A[0].v).length ? [PV.T(A[0].c, PV.pow(A, 2)[0].v)] : null;
const kwFout = A => { const F = [[A, 'Je vergat te kwadrateren.'], [PV.mul(PV.c(2), A), `Kwadrateren is niet maal 2: ${kwm(A)} ${isq} ${HH(A)} · ${HH(A)}.`], [PV.neg(PV.pow(A, 2)), 'Een kwadraat is nooit negatief.']];
  const n = kwNiet(A); if(n) F.push([n, `Kwadrateer de hele term, ook het getal: ${kwm(A)} ${isq} ${PH(PV.pow(A, 2))}.`]); return F; };
/* Toon mij hoe: de werkwijze van de kwadraten eerst */
function kwHoe(a, b){ const K = kwDelen(a, b);
  const L = [[EH(kwOpg(a, b)), `<i>a</i> ${isq} ${PH(K.A)} en <i>b</i> ${isq} ${PH(K.B)}. Het teken hoort bij de term.`],
    [`${isq} ${kwm(K.A)} + <span class="m6-gat">…</span> + ${kwm(K.B)}`, 'Eerst de twee kwadraten: links <i>a</i>², rechts <i>b</i>². Het midden laat je open.'],
    [`${isq} ${kwm(K.A)} + 2 · ${HH(K.A)} · ${HH(K.B)} + ${kwm(K.B)}`, 'Dan het midden: het dubbel product 2 · <i>a</i> · <i>b</i>.'],
    [`${isq} ${PH(K.nat, {zo:true})}`, 'Reken elke term uit. Een kwadraat is altijd positief. Het teken van het dubbel product volgt uit de mintekens.']];
  if(K.rang) L.push([`${isq} ${PH(K.D)}`, 'Rangschik in dalende machten: eerst de hoogste exponent.']);
  return L; }
const kwHint = (a, b) => { const K = kwDelen(a, b); return [
  {u:'Wat is <i>a</i> en wat is <i>b</i>? Neem het teken mee.', line:'<i>a</i> = {{t:a}} &nbsp; <i>b</i> = {{t:b}}', check:V=>allOf([['a', chkT(V.a, K.A)], ['b', chkT(V.b, K.B)]]), show:`<i>a</i> = ${PH(K.A)} &nbsp; <i>b</i> = ${PH(K.B)}`},
  ['Noteer links <i>a</i>² en rechts <i>b</i>². Laat plaats in het midden.', `${kwm(K.A)} + <span class="m6-gat">…</span> + ${kwm(K.B)}`],
  ['Vul het midden in: het dubbel product. Tel de mintekens voor het teken.', `${kwm(K.A)} + 2 · ${HH(K.A)} · ${HH(K.B)} + ${kwm(K.B)}`],
  K.rang ? 'Reken uit en rangschik in dalende machten.' : 'Reken elke term uit.']; };

/* ---------- het vierkant ---------- */
function vierkSvg(p, k, t){
  const x0 = 70, y0 = 40, X = 150, s = 20, P = p*s, xs = x0 + X, ys = y0 + X, Z = X + P;
  const it = '<tspan font-style="italic">x</tspan>'; let o = '';
  if(k<2) o += `<rect class="tegel" x="${x0}" y="${y0}" width="${Z}" height="${Z}" rx="2"/>`;
  else { const o2 = k===2 ? t : 1, o3 = k<3 ? 0 : k===3 ? t : 1;
    o += `<rect class="m6-leeg" x="${x0}" y="${y0}" width="${Z}" height="${Z}"/>`;
    o += `<g opacity="${fx(o2)}"><rect class="tegel" x="${x0}" y="${y0}" width="${X}" height="${X}"/><rect class="tegel" x="${xs}" y="${ys}" width="${P}" height="${P}"/>` + sT(x0 + X/2, y0 + X/2, sX('x^2'), 't big') + sT(xs + P/2, ys + P/2, String(p*p), 't') + '</g>';
    o += `<g opacity="${fx(o3)}"><rect class="tegel b" x="${xs}" y="${y0}" width="${P}" height="${X}"/><rect class="tegel b" x="${x0}" y="${ys}" width="${X}" height="${P}"/>` + sT(xs + P/2, y0 + X/2, sX(p + 'x'), 't') + sT(x0 + X/2, ys + P/2, sX(p + 'x'), 't') + '</g>'; }
  if(k===1){ const d = fx(t); o += `<path class="m6-snij" d="M${xs} ${y0} v${fx(Z*d)}M${x0} ${ys} h${fx(Z*d)}"/>`; }
  else if(k>1) o += `<path class="m6-snij" d="M${xs} ${y0} v${Z}M${x0} ${ys} h${Z}"/>`;
  if(k===0){ o += `<path class="as" d="M${x0} ${y0-8} v-6 H${x0+Z} v6"/>` + sT(x0 + Z/2, y0 - 26, `${it} + ${p}`, 't big');
    o += `<path class="as" d="M${x0-8} ${y0} h-6 V${y0+Z} h6"/>` + sT(x0 - 22, y0 + Z/2, `${it} + ${p}`, 't big', 'end'); }
  else o += sT(x0 + X/2, y0 - 16, it, 't big') + sT(xs + P/2, y0 - 16, String(p), 't big') + sT(x0 - 14, y0 + X/2, it, 't big', 'end') + sT(x0 - 14, ys + P/2, String(p), 't big', 'end');
  const yb = y0 + Z + 32;
  if(k===2) o += `<g opacity="${fx(t)}">` + sT(x0 + Z/2, yb, `${sX('x^2')} +  …  + ${p*p}`, 't big') + '</g>';
  if(k===3) o += sT(x0 + Z/2, yb, `${sX('x^2')} + 2 · ${it} · ${p} + ${p*p}`, 't big');
  if(k>=4) o += sT(x0 + Z/2, yb, `${sX('x^2')} + 2 · ${it} · ${p} + ${p*p}`, 't big') + `<g opacity="${fx(k===4 ? t : 1)}">` + sT(x0 + Z/2, yb + 28, `= ${sX(`x^2+${2*p}x+${p*p}`)}`, 't big') + '</g>';
  return o;
}
KW.vierk = { title:'Het vierkant', lvl:1,
  instr:'Een vierkant met zijde <i>x</i> + een getal. Speel de stappen af: eerst de twee vierkanten op de diagonaal, dan de twee rechthoeken.',
  build(b, st, save){
    const R = makeR(st); const p = R.int(2, 5); const opg = `(x+${p})^2`, D = EX.p(opg);
    const wrap = el('div', 'm4-naast'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    stepFig(l, { W:340, H:370, maxw:380, alt:'vierkant verdeeld in twee vierkanten en twee rechthoeken', steps:[
      {cap:`De oppervlakte van het vierkant is zijde maal zijde: ${EH(opg)} ${isq} ${EH(`(x+${p})(x+${p})`)}.`, draw:t=>vierkSvg(p, 0, t)},
      {cap:`Verdeel elke zijde in <i>x</i> en ${p}.`, draw:t=>vierkSvg(p, 1, t)},
      {cap:`Eerst de twee vierkanten op de diagonaal: ${EH('x^2')} links en ${EH(`${p}^2`)} ${isq} ${p*p} rechts. Het midden laat je open.`, draw:t=>vierkSvg(p, 2, t)},
      {cap:`Dan het midden: twee gelijke rechthoeken van <i>x</i> · ${p}. Samen is dat 2 · <i>x</i> · ${p}: het <b>dubbel product</b>.`, draw:t=>vierkSvg(p, 3, t)},
      {cap:`Samen: ${EH(opg)} ${isq} ${PH(D)}.`, draw:t=>vierkSvg(p, 4, t)}] });
    const g = el('div', 'm4-items een'); r.append(g);
    const cel = `<table class="m6-rt"><tr><th></th><th><i>x</i></th><th>${p}</th></tr><tr><th><i>x</i></th><td>{{t:a}}</td><td>{{t:b}}</td></tr><tr><th>${p}</th><td>{{t:c}}</td><td>{{t:d}}</td></tr></table>`;
    mQ(g, st, save, 'd', { nr:'a)', html:`<span class="txt">De oppervlakte van elk stuk:</span> ${cel}`,
      check:V=>allOf([['a', chkT(V.a, 'x^2', [['2x', `<i>x</i> · <i>x</i> ${isq} ${EH('x^2')}, niet 2<i>x</i>.`]])], ['b', chkT(V.b, p + 'x')], ['c', chkT(V.c, p + 'x')], ['d', chkT(V.d, String(p*p), [[String(2*p), `${p} · ${p} ${isq} ${p*p}, niet ${2*p}.`]])]]),
      sol:`${EH('x^2')}, ${EH(p + 'x')}, ${EH(p + 'x')} en ${p*p}` });
    const g2 = el('div', 'm4-items een'); b.append(g2);
    mQ(g2, st, save, 's', { nr:'b)', html:`<span class="txt">Herleid:</span> ${EH(opg)} ${isq} {{p:a,pnme1}}`,
      check:V=>chkP(V.a, D, {ctx:{k:'kw', a:'x', b:String(p)}}), sol:`${EH(opg)} ${isq} ${EH(`x^2+2*x*${p}+${p}^2`)} ${isq} ${PH(D)}` });
  } };

/* ---------- het kwadraatkader (werkwijze van de collega) ---------- */
function kaderQ(g, st, save, id, nr, a, b){
  const K = kwDelen(a, b), sgn = K.M[0].c.n<0 ? '-' : '+', absM = sgn==='-' ? PV.neg(K.M) : K.M, opg = kwOpg(a, b);
  const html = `<div class="m6-kader"><div class="m6-k-r"><span class="m6-k-opg">${EH(opg)}</span><span class="m6-k-ab"><span><i>a</i> = {{t:a}}</span><span><i>b</i> = {{t:b}}</span></span></div>
    <div class="m6-k-r m6-k-som"><span class="m4-is">=</span><span class="m6-slot buiten"><small><i>a</i>²</small>{{t:a2}}</span><span class="m6-slot midden"><small>2 · <i>a</i> · <i>b</i></small><span class="m6-z">{{z:s}}{{t:ab}}</span><span class="m6-wachttekst">eerst <i>a</i>² en <i>b</i>²</span></span><span class="m6-plus">+</span><span class="m6-slot buiten"><small><i>b</i>²</small>{{t:b2}}</span></div>`
    + (K.rang ? `<div class="m6-k-r m6-k-rang"><span class="txt">Rangschik in dalende machten:</span> <span class="m4-is">=</span> {{p:r,pnme1}}</div>` : '') + '</div>';
  mQ(g, st, save, id, { nr, html, cls:'m6-kq',
    onCh:(V, row)=>{ const mid = row.querySelector('.m6-slot.midden'); if(!mid) return; const klaar = !emptyP(V.a2) && !emptyP(V.b2); mid.classList.toggle('wacht', !klaar); mid.querySelectorAll('input, button').forEach(x => x.disabled = !klaar); },
    check:V=>allOf([['a', chkT(V.a, K.A, [[PV.neg(K.A), `Neem het teken mee: <i>a</i> ${isq} ${PH(K.A)}.`]])], ['b', chkT(V.b, K.B, [[PV.neg(K.B), `Neem het teken mee: <i>b</i> ${isq} ${PH(K.B)}.`]])],
      ['a2', chkT(V.a2, K.A2, kwFout(K.A))], ['b2', chkT(V.b2, K.B2, kwFout(K.B))], ['s', chkZ(V.s, sgn)],
      ['ab', chkT(V.ab, absM, [[PV.mul(PV.c(Q(1, 2)), absM), 'Vergeet de factor 2 niet: het dubbel product is 2 · <i>a</i> · <i>b</i>.']])],
      ...(K.rang ? [['r', chkP(V.r, K.D, {rang:true})]] : [])]),
    sol:kwHoe(a, b).map(([m]) => m).join(' ') });
}
KW.kader = { title:'Het kwadraatkader', lvl:1,
  instr:`Werk met het kader. Noteer eerst <i>a</i> en <i>b</i>, met hun teken. Vul dan links <i>a</i>² en rechts <i>b</i>² in. Daarna gaat het midden open: het dubbel product 2 · <i>a</i> · <i>b</i>. Kies het teken in het tekenvak.`,
  build(b, st, save){
    const R = makeR(st); const x = R.pick(['x', 'a', 'y']);
    b.append(el('div', 'm4-regel', `<div class="m4-line">${EH('(a+b)^2')} ${isq} <span class="m6-uit">${EH('a^2')}</span> + <span class="m6-mid">2 · <i>a</i> · <i>b</i></span> + <span class="m6-uit">${EH('b^2')}</span></div>Eerst de twee kwadraten links en rechts, dan het dubbel product in het midden.`));
    const g = el('div', 'm4-items een'); b.append(g);
    const k1 = R.int(2, 5), k2 = R.int(2, 4), c = R.int(2, 6);
    kaderQ(g, st, save, 'k0', 'a)', trm(k1, x).slice(1), '+' + R.int(1, 7));
    kaderQ(g, st, save, 'k1', 'b)', trm(k2, x).slice(1), '-' + R.int(1, 7));
    if(R.f()<.5) kaderQ(g, st, save, 'k2', 'c)', String(c), '+' + x); else kaderQ(g, st, save, 'k2', 'c)', '-' + c, '+' + trm(R.int(2, 3), x).slice(1));
  } };

/* ---------- in een tabel ---------- */
KW.tabel = { title:'Kwadraat in een tabel', lvl:2,
  instr:'Vul de tabel in. <i>b</i> is de tweede term met zijn teken. Bij 2 · <i>a</i> · <i>b</i> typ je ook het teken.',
  build(b, st, save){
    const R = makeR(st);
    const rij = [[trm(R.int(2, 5), 'x').slice(1), '-' + R.int(1, 6)], ['x^2', '+' + R.int(2, 6)], ['-' + trm(R.int(2, 4), 'y').slice(1), '+' + R.int(1, 5)], [trm(R.int(2, 4), 'a').slice(1), '+' + trm(R.int(2, 3), 'b').slice(1)]];
    const K = rij.map(([a, c]) => kwDelen(a, c));
    let h = '<div class="m6-scroll"><table class="m6-tab m6-kwt"><tr><th></th><th><i>a</i></th><th><i>b</i></th><th><i>a</i>²</th><th>2 · <i>a</i> · <i>b</i></th><th><i>b</i>²</th></tr>';
    rij.forEach(([a, c], i) => { h += `<tr><th>${EH(kwOpg(a, c))}</th>${['a', 'b', 'c', 'd', 'e'].map(k => `<td>{{t:${k}${i}}}</td>`).join('')}</tr>`; });
    h += '</table></div>';
    const g = el('div', 'm4-items een'); b.append(g);
    mQ(g, st, save, 'tab', { html:h,
      check:V=>allOf(K.flatMap((k, i) => [[`a${i}`, chkT(V[`a${i}`], k.A)], [`b${i}`, chkT(V[`b${i}`], k.B, [[PV.neg(k.B), `<i>b</i> is de tweede term mét zijn teken: ${PH(k.B)}.`]])],
        [`c${i}`, chkT(V[`c${i}`], k.A2, kwFout(k.A))], [`d${i}`, chkT(V[`d${i}`], k.M, [[PV.mul(PV.c(Q(1, 2)), k.M), 'Vergeet de factor 2 niet.']])], [`e${i}`, chkT(V[`e${i}`], k.B2, kwFout(k.B))]])),
      hint:['Een kwadraat is altijd positief.', 'Het teken van 2 · <i>a</i> · <i>b</i> volgt uit de tekens van <i>a</i> en <i>b</i>: tel de mintekens.'],
      sol:K.map((k, i) => `${EH(kwOpg(...rij[i]))} ${isq} ${PH(k.D)}`).join('<br>') });
  } };

/* ---------- vrij vak ---------- */
function vrijKw(b, st, save, items, o={}){
  const R = makeR(st, 'vb'); if(o.vb){ const [a, c] = o.vb(R); stapUitleg(b, kwHoe(a, c), {kop:'Voorbeeld', label:'Toon mij hoe'}); }
  reeks(b, items.length, (g, i, nr) => { const [a, c, extra={}] = items[i]; const opg = kwOpg(a, c), K = kwDelen(a, c);
    mQ(g, st, save, 'q' + i, { nr, html:`${EH(opg)} {{p:a,${o.knop || 'pnmeh'}}}`, check:V=>chkP(V.a, K.D, Object.assign({mp:true, ctx:{k:'kw', a:K.A, b:K.B}}, extra)),
      hint:kwHint(a, c), sol:kwHoe(a, c).map(([m]) => m).join(' ') }); }, {een:true});
}
KW.vrij = { title:'Werk uit met de formule', lvl:2,
  instr:'Werk uit met de formule: links <i>a</i>², rechts <i>b</i>², dan het dubbel product. Je mag de tussenstap opschrijven of meteen de uitkomst. Rangschik in dalende machten.',
  build(b, st, save){
    const R = makeR(st); const L = R.shuffle(['x', 'a', 'y', 't']);
    vrijKw(b, st, save, R.shuffle([[trm(R.int(2, 5), L[0]).slice(1), '-' + R.int(1, 7)], [String(R.int(2, 9)), '+' + L[1]], ['-' + trm(R.int(2, 4), L[2]).slice(1), '+' + R.int(1, 6)], [trm(R.int(2, 4), 'x').slice(1), (R.f()<.5 ? '+' : '-') + trm(R.int(2, 5), 'y').slice(1)]]),
      {vb:R2 => [trm(R2.int(2, 4), 'x').slice(1), '-' + R2.int(2, 6)]});
  } };
KW.macht = { title:'Met machten en twee letters', lvl:2,
  instr:'Werk uit met de formule. Kwadrateer de hele term: het getal én elke letter (exponenten maal 2).',
  build(b, st, save){
    const R = makeR(st);
    vrijKw(b, st, save, [['x^2', '-' + R.int(2, 6)], [`${R.int(2, 4)}a^2b`, '+' + R.int(1, 5)], [`${R.int(2, 7)}x^3`, '+' + R.int(2, 5) + 'y'], [`-${R.int(2, 3)}x^3`, '-y^2']]);
  } };
KW.brk = { title:'Met breuken en kommagetallen', lvl:2,
  instr:'Werk uit met de formule. Een breuk kwadrateer je door teller en noemer te kwadrateren.',
  build(b, st, save){
    const R = makeR(st);
    vrijKw(b, st, save, [['1/2x', '-' + R.pick([2, 4, 6, 8])], ['0,1x^2', '-' + R.int(2, 5), {dec:true}], [`2/3a`, '+' + R.pick([3, 6])], ['0,5', '+' + R.int(2, 4) + 'y', {dec:true}]].slice(0, 4), {knop:'pnmehb'});
  } };
/* ---------- meerkeuze met de klassieke fouten ---------- */
KW.mk = { title:'Kies de juiste uitkomst', lvl:2,
  instr:'Welke uitkomst is juist? De andere uitkomsten bevatten een fout die vaak gemaakt wordt.',
  build(b, st, save){
    const R = makeR(st); const g = el('div', 'm4-items een'); b.append(g);
    const it = R.shuffle([[trm(R.int(2, 5), 'x').slice(1), '-' + R.int(1, 6)], [trm(R.int(2, 4), 'a').slice(1), '+' + R.int(2, 7)], [String(R.int(2, 7)), '-' + trm(R.int(2, 3), 'y').slice(1)], [trm(R.int(2, 3), 'x').slice(1), '+' + trm(R.int(2, 4), 'y').slice(1)], ['-' + trm(R.int(2, 5), 'p').slice(1), '-' + R.int(1, 5)]]);
    it.forEach(([a, c], i) => { const K = kwDelen(a, c);
      const afl = [PV.add(K.A2, K.B2), PV.som(K.A2, PV.neg(K.M), K.B2), PV.som(K.A2, PV.mul(PV.c(Q(1, 2)), K.M), K.B2), PV.som(K.A2, K.M, PV.neg(K.B2))];
      const n1 = kwNiet(K.A), n2 = kwNiet(K.B); if(n1) afl.push(PV.som(n1, K.M, K.B2)); if(n2) afl.push(PV.som(K.A2, K.M, n2));
      const gezien = new Set([PH(K.D)]); const opts = [['j', PH(K.D)], ...R.shuffle(afl).filter(p => { const h = PH(p); if(gezien.has(h)) return false; gezien.add(h); return true; }).slice(0, 3).map((p, k) => ['f' + k, PH(p)])];
      const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'm' + i, { nr:'abcde'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${EH(kwOpg(a, c))} ${isq} …</span>`, opts:R.shuffle(opts).map(([v, l]) => [v, `<span class="m4-line">${l}</span>`]), ans:'j',
        why:`${kwm(K.A)} + 2 · ${HH(K.A)} · ${HH(K.B)} + ${kwm(K.B)} ${isq} ${PH(K.D)}`, whyBad:'Gebruik de formule: links <i>a</i>², rechts <i>b</i>², dan het dubbel product 2 · <i>a</i> · <i>b</i> met zijn teken. Een kwadraat is nooit negatief.' }); });
  } };
/* ---------- verdieping ---------- */
function aanvQ(g, st, save, id, nr, html, keys, gelijk, canon, hint){
  mQ(g, st, save, id, { nr, html, hint,
    check:V=>{ const vals = keys.map(k => emptyP(V[k]) ? null : EX.val(V[k].r[0].b));
      if(vals.every(x => x && !x.err) && keys.every(k => !EX.waarom(V[k].r[0].b))){ const [L, Rr] = gelijk(vals); if(PV.eq(L, Rr)) return allOf(keys.map(k => [k, {ok:true}])); }
      return allOf(keys.map((k, i) => [k, chkT(V[k], canon[i])])); },
    sol:canon.map(c => PH(EX.p(c))).join(' en ') });
}
KW.aanv = { title:'Vul de ontbrekende termen aan', lvl:3,
  instr:'Vul de vakjes in zodat de gelijkheid klopt. Denk aan de formule: links <i>a</i>², midden 2 · <i>a</i> · <i>b</i>, rechts <i>b</i>².',
  build(b, st, save){
    const R = makeR(st); const g = el('div', 'm4-items een'); b.append(g);
    const k = R.int(2, 5), n = R.int(2, 5);
    aanvQ(g, st, save, 'a0', 'a)', `<span class="m4-m"><span class="m6-g">({{t:u}} + ${EH(n + 'b')})</span><sup class="m4-sup">2</sup></span> ${isq} ${PH(EX.p(`${k*k}a^2`))} + ${PH(EX.p(`${2*k*n}ab`))} + {{t:w}}`, ['u', 'w'],
      ([u, w]) => [PV.pow(PV.add(u, EX.p(n + 'b')), 2), PV.som(EX.p(`${k*k}a^2+${2*k*n}ab`), w)], [k + 'a', `${n*n}b^2`],
      [`Het dubbel product is 2 · (eerste term) · ${EH(n + 'b')}. Wat moet de eerste term zijn?`]);
    const k2 = R.int(2, 5), m = R.int(2, 4);
    aanvQ(g, st, save, 'a1', 'b)', `<span class="m4-m"><span class="m6-g">(${EH(k2 + 'x')} ${MIN} {{t:u}})</span><sup class="m4-sup">2</sup></span> ${isq} {{t:w}} ${MIN} ${PH(EX.p(`${2*k2*m}xy`))} + ${PH(EX.p(`${m*m}y^2`))}`, ['u', 'w'],
      ([u, w]) => [PV.pow(PV.sub(EX.p(k2 + 'x'), u), 2), PV.som(w, EX.p(`-${2*k2*m}xy+${m*m}y^2`))], [m + 'y', `${k2*k2}x^2`],
      ['Welke term geeft in het kwadraat de laatste term?']);
    const c = R.int(2, 5);
    aanvQ(g, st, save, 'a2', 'c)', `<span class="m4-m"><span class="m6-g">({{t:u}} ${MIN} 1)</span><sup class="m4-sup">2</sup></span> ${isq} ${PH(EX.p(`${c*c}p^4`))} ${MIN} {{t:w}} + 1`, ['u', 'w'],
      ([u, w]) => [PV.pow(PV.sub(u, PV.c(1)), 2), PV.som(EX.p(`${c*c}p^4+1`), PV.neg(w))], [`${c}p^2`, `${2*c}p^2`],
      ['Welke term geeft in het kwadraat de eerste term? Denk aan de exponent.']);
  } };
KW.derde = { title:'Tot de derde macht', lvl:3,
  instr:'Werk uit en herleid. Een derde macht is een kwadraat maal nog eens de tweeterm: (<i>a</i> + <i>b</i>)³ = (<i>a</i> + <i>b</i>)² · (<i>a</i> + <i>b</i>).',
  build(b, st, save){
    const R = makeR(st);
    reeks(b, 2, (g, i, nr) => { const opg = [`(x+${R.int(1, 4)})^3`, `(${R.int(2, 3)}y-1)^3`][i], D = EX.p(opg);
      mQ(g, st, save, 'd' + i, { nr, html:`${EH(opg)} {{p:a,pnmeh}}`, check:V=>chkP(V.a, D),
        hint:['Schrijf als een kwadraat maal de tweeterm.', 'Werk het kwadraat uit met de formule en zet het tussen haakjes.', 'Vermenigvuldig dat met de tweeterm: elke term maal elke term. Herleid.'], sol:`${EH(opg)} ${isq} ${PH(D)}` }); }, {een:true});
  } };
KW.verkl = { title:'Waarom klopt de formule?', lvl:3, keep:true,
  instr:'Leg de formule uit met de distributieve eigenschap: zet de stappen in de juiste volgorde.',
  build(b, st, save){
    orderEx(b, st, save, 'ord', { html:`Waarom is ${EH('(a+b)^2')} ${isq} ${EH('a^2+2ab+b^2')}?`, lab:'Jouw uitleg:',
      lines:[`${EH('(a+b)^2')} ${isq} ${EH('(a+b)(a+b)')}`, `${isq} ${EH('a*a+a*b+b*a+b*b')}`, `${isq} ${EH('a^2+ab+ab+b^2')}`, `${isq} ${EH('a^2+2ab+b^2')}`],
      why:'Een kwadraat is een product van twee gelijke factoren. Elke term maal elke term geeft vier producten, en <i>ab</i> en <i>ba</i> zijn gelijk.' });
    const g = el('div', 'm4-items een'); b.append(g);
    let row = el('div', 'm4-wn'); g.append(row);
    qChoice(row, st, save, 'm1', { nr:'b)', html:'Waarom staat er 2<i>ab</i> in het midden?', opts:[['j', '<i>ab</i> en <i>ba</i> zijn gelijk, samen 2<i>ab</i>'], ['f1', 'je vermenigvuldigt <i>a</i> en <i>b</i> met de exponent 2'], ['f2', 'het is het kwadraat van <i>ab</i>']], ans:'j',
      why:'<i>a</i> · <i>b</i> + <i>b</i> · <i>a</i> = <i>ab</i> + <i>ab</i> = 2<i>ab</i>: daarom heet het het dubbel product.', whyBad:'Kijk naar de tweede en de derde stap van je uitleg.' });
    row = el('div', 'm4-wn'); g.append(row);
    qChoice(row, st, save, 'm2', { nr:'c)', html:`${EH('(x-3)^2')} ${isq} ${EH('(x+(-3))^2')}. Werkt de formule dan nog?`, opts:[['j', `ja: ${EH('x^2+2*x*(-3)+(-3)^2')} ${isq} ${EH('x^2-6x+9')}`], ['f1', 'nee, dan heb je een andere formule nodig'], ['f2', `ja, maar dan is ${EH('b^2')} negatief: ${EH('x^2-6x-9')}`]], ans:'j',
      why:'De formule werkt ook als <i>b</i> negatief is. Het dubbel product wordt dan negatief, het kwadraat blijft positief.', whyBad:'Vul <i>b</i> = −3 in de formule in. Een kwadraat is nooit negatief.' });
  } };
KW.letters = { title:'Meerdere letters en breuken', lvl:3,
  instr:'Werk uit met de formule en rangschik in dalende machten. Vereenvoudig breuken.',
  build(b, st, save){
    const R = makeR(st);
    vrijKw(b, st, save, [['1/2a', '-2/3b'], ['0,3x^2y', '-2y', {dec:true}], ['-3/4p', '+2q']], {knop:'pnmehb'});
  } };

SEC.kw = { id:'kw', ic:'m6_kw', nav:'Kwadraat van een tweeterm', title:'Het kwadraat van een tweeterm',
  tip:`Eén formule voor alles: ${EH('(a+b)^2')} ${isq} ${EH('a^2+2ab+b^2')}. Is de tweede term negatief, dan is <i>b</i> negatief: bij ${EH('(x-4)^2')} is <i>b</i> = ${MIN}4. Noteer eerst links <i>a</i>² en rechts <i>b</i>², dan het dubbel product in het midden.`,
  cheat:CHEAT_KW, cards:[KW.vierk, KW.kader, KW.tabel, KW.vrij, KW.macht, KW.brk, KW.mk, KW.aanv, KW.derde, KW.verkl, KW.letters] };
(function(){ const css = `
  .m6-gat{display:inline-block; min-width:2.2rem; border-bottom:2px dashed var(--orange); text-align:center; color:var(--orange)}
  .m6-uit{background:var(--tq-soft); border-radius:.35rem; padding:0 .2rem} .m6-mid{background:var(--or-soft); border-radius:.35rem; padding:0 .25rem}
  .m6-kader{display:flex; flex-direction:column; gap:.55rem; border:2px solid var(--tq); border-radius:.8rem; padding:.55rem .8rem; background:var(--card)}
  .m6-k-r{display:flex; flex-wrap:wrap; align-items:center; gap:.4rem .9rem}
  .m6-k-opg{font-size:1.35rem}
  .m6-k-ab{display:inline-flex; gap:1rem; flex-wrap:wrap} .m6-k-ab > span{display:inline-flex; align-items:center; gap:.3rem}
  .m6-k-som{gap:.35rem .5rem; align-items:flex-end}
  .m6-slot{display:inline-flex; flex-direction:column; align-items:center; gap:.15rem; padding:.25rem .35rem .3rem; border-radius:.6rem; border:2px solid transparent}
  .m6-slot small{font-size:.8rem; font-weight:700; color:var(--accent-dark)}
  .m6-slot.buiten{background:var(--tq-soft); border-color:var(--tq)}
  .m6-slot.midden{background:var(--or-soft); border-color:var(--orange)}
  .m6-slot.midden small{color:#9a5b00}
  .m6-slot.midden.wacht{border-style:dashed; opacity:.75; pointer-events:none}
  .m6-slot.midden.wacht .m6-z{display:none}
  .m6-wachttekst{display:none; font-size:.85rem; font-weight:400; font-style:italic; color:#9a5b00; padding:.55rem .2rem}
  .m6-slot.midden.wacht .m6-wachttekst{display:block}
  @media (max-width:520px){ .m6-kader{padding:.5rem .45rem} .m6-k-som{gap:.3rem .3rem} .m6-slot{padding:.2rem .2rem .25rem} .m6-wachttekst{max-width:5.2rem; text-align:center; padding:.3rem .1rem} }
  .m6-z{display:inline-flex; align-items:center; gap:.25rem}
  .m6-plus{font-size:1.3rem; padding-bottom:.6rem}
  .m6-k-som > .m4-is{padding-bottom:.6rem}
  .m6-k-rang{padding-top:.2rem; border-top:1.5px dashed var(--border)}
  .m6-scroll{max-width:100%; min-width:0; overflow-x:auto}
  .m4-q:has(> .m4-line > .m6-scroll), .m4-line:has(> .m6-scroll){min-width:0; max-width:100%}
  .m6-kwt td{padding:.25rem .3rem}
  .m6-kwt th:first-child{white-space:nowrap; text-align:left}
  .mf .m6-leeg{fill:var(--card); stroke:var(--accent-dark); stroke-width:1.5}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* proefstuk: eerst veelterm maal veelterm en het kwadraat van een tweeterm */
const ORDER = ['vv', 'kw'];
const SECTIONS = ORDER.map(id=>SEC[id]).filter(Boolean);

/* ============================================================
   OPBOUW VAN DE SITE
   ============================================================ */
/* onderdelen die de leerkracht uitzette, verbergen */
if(window.CL_VERBORGEN){ for(let i = SECTIONS.length - 1; i >= 0; i--) if(window.CL_VERBORGEN.has(SECTIONS[i].id)) SECTIONS.splice(i, 1); }
const app = document.getElementById('app');
const nav = document.getElementById('nav');
const pager = document.getElementById('pager');
const renderers = {};
const secEls = {}, navLinks = {}, secBuilt = {};
const LET = 'abcdefghijklmnop';

function buildSection(sec, num){
  const s = secEls[sec.id];
  const head = el('div','sec-head', `<span class="sec-ic">${icon(sec.ic)}</span><h2><span class="num">${num}.</span>${sec.title}</h2>`);
  s.append(head);
  if(sec.cheat){
    const cb = el('button','cheat-btn', icon('cheat')); cb.type='button'; cb.dataset.tip='spiekbriefje'; cb.setAttribute('aria-label','spiekbriefje'); cb.setAttribute('aria-expanded','false');
    const panel = el('div','cheat', sec.cheat); panel.hidden = true;
    cb.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; cb.setAttribute('aria-expanded', String(!panel.hidden)); });
    head.append(cb); s.append(panel);
  }
  if(sec.tip) s.append(el('div','tip', icon('bulb') + `<div>${sec.tip}</div>`));
  if(sec.intro) s.append(el('div','', sec.intro));
  /* tabbladen: basis en oefenen / verdieping */
  const hasCh = sec.cards.some(c=>c.lvl===3) && sec.cards.some(c=>c.lvl!==3);
  let panes = {b:s, c:s};
  if(hasCh){
    const bar = el('div','tabs'); bar.setAttribute('role','tablist');
    const tb1 = el('button','tab', 'Basis en oefenen'), tb2 = el('button','tab', 'Verdieping');
    [tb1,tb2].forEach(b=>{ b.type='button'; b.setAttribute('role','tab'); bar.append(b); });
    const p1 = el('div','tabpane'), p2 = el('div','tabpane');
    s.append(bar, p1, p2); panes = {b:p1, c:p2};
    const setTab = k => { p1.hidden = k!=='b'; p2.hidden = k!=='c'; tb1.setAttribute('aria-selected', String(k==='b')); tb2.setAttribute('aria-selected', String(k==='c')); try{ localStorage.setItem(PREFIX+'stab_'+sec.id, k); }catch(e){} };
    tb1.addEventListener('click', ()=>setTab('b')); tb2.addEventListener('click', ()=>setTab('c'));
    let k0 = 'b'; try{ k0 = localStorage.getItem(PREFIX+'stab_'+sec.id) || 'b'; }catch(e){}
    setTab(k0);
    p2.append(el('div','tip', icon('bulb') + '<div>Verdieping is moeilijker. Probeer deze oefeningen als je <b>Basis en oefenen</b> goed kan.</div>'));
  }
  sec.cards.forEach((card,ci)=>{
    const key = sec.id + '_' + ci;
    const c = el('div','card' + (card.brk===false ? ' m4-geenbrk' : ''));
    const ch = el('div','card-head', `<h3>${card.title}${card.lvl?LVL[card.lvl]:''}</h3>`);
    const rb = el('button','refresh-btn', card.keep ? '↺ Opnieuw beginnen' : '↺ Nieuwe opgave'); rb.type='button';
    if(!card.noReset) ch.append(rb); c.append(ch);
    if(card.instr) c.append(el('p','instructions', card.instr));
    const body = el('div'); c.append(body); (card.lvl===3 ? panes.c : panes.b).append(c);
    renderers[key] = ()=>{ body.innerHTML = ''; clearSel(); const st = load(key); const save = ()=>store(key, st); CURKEY = key;
      try{ card.build(body, st, save, key); hintsSamen(body, key); if(body.querySelector('.m4-wx')) vxHulp(c); if(body.querySelector('.m4-wp')) vpHulp(c); }catch(err){ console.error(err); body.append(el('p','fb bad','Er liep iets mis bij het maken van deze oefening. Klik op “Nieuwe opgave”.')); }
      save(); };
    rb.addEventListener('click', ()=>{ wipe(key); renderers[key](); });
    renderers[key]();
  });
}

SECTIONS.forEach((sec, si)=>{
  const num = si+1;
  if(sec.id==='toets1'){ nav.append(el('li','sep')); }
  const li = el('li');
  const a = el('button','', `${icon(sec.ic)}<span class="n">${num}</span><span class="lbl">${sec.nav}</span>`);
  a.type = 'button'; a.addEventListener('click', ()=>show(sec.id, true));
  li.append(a); nav.append(li); navLinks[sec.id] = a;
  const s = el('section','group'); s.id = sec.id; s.hidden = true;
  app.append(s); secEls[sec.id] = s;
});

function show(id, scroll){
  const idx = SECTIONS.findIndex(s=>s.id===id); if(idx<0) return;
  clearSel();
  if(!secBuilt[id]){ secBuilt[id] = true; buildSection(SECTIONS[idx], idx+1); }
  SECTIONS.forEach(s=>{ secEls[s.id].hidden = s.id!==id; navLinks[s.id].removeAttribute('aria-current'); });
  navLinks[id].setAttribute('aria-current','page');
  try{ const ol = nav; const a = navLinks[id]; if(ol.scrollWidth > ol.clientWidth) ol.scrollLeft = a.offsetLeft - 16; }catch(e){}
  pager.innerHTML = '';
  if(idx>0){ const p=SECTIONS[idx-1]; const b=el('button','prev',`<small>← Vorige</small>${idx}. ${p.nav}`); b.type='button'; b.addEventListener('click',()=>show(p.id,true)); pager.append(b); }
  if(idx<SECTIONS.length-1){ const n=SECTIONS[idx+1]; const b=el('button','next',`<small>Volgende →</small>${idx+2}. ${n.nav}`); b.type='button'; b.addEventListener('click',()=>show(n.id,true)); pager.append(b); }
  try{ localStorage.setItem(PREFIX+'tab', id); }catch(e){}
  if(scroll) window.scrollTo({top:0, behavior:'smooth'});
}
let startId = SECTIONS[0].id;
try{ const h = location.hash.slice(1); const t = localStorage.getItem(PREFIX+'tab'); if(secEls[h]) startId=h; else if(t && secEls[t]) startId=t; }catch(e){}
show(startId, false);
