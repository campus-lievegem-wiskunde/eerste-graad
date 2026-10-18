/* ============================================================
   HULPFUNCTIES
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const PREFIX = '2a_m1_transfo_v1_';
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
      if(fixBox.hidden){ fixBox.hidden=false; fixBox.append(el('div','sub','Verbeter deze stap:')); qBlock(fixBox, st, save, id+'_fix', {noCL:true, html:e.fix, check:e.fixCheck, sol:e.fixSol, mode:e.mode}); }
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
    finally{ const g = QZ; QZ = null; const tot = g.reduce((s,x)=>s+(x.pts!=null?x.pts:1),0); ptsTag.textContent = '/ ' + fmtN(tot); rows.push({q, row, fb, graders:g, tot, ptsTag}); }
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
      const full = got===tot && tot>0;
      row.classList.toggle('right', full); row.classList.toggle('wrongq', !full);
      ptsTag.textContent = fmtN(got) + ' / ' + fmtN(tot);
      fb.className = 'fb '+(full?'ok':'bad');
      fb.innerHTML = full ? '✅ Alles juist.' : (got>0 ? '◐ Gedeeltelijk juist. ' : '❌ Nog niet juist. ') + (q.show ? 'Juist antwoord: ' + (typeof q.show==='function'?q.show():q.show) : '');
    });
    const pct = total ? score/total : 0;
    const lvl = pct>=.9?'prima':pct>=.7?'goed':pct>=.5?'voldoende':'onvoldoende';
    const html = `<div class="score"><span class="big">${fmtN(score)} / ${fmtN(total)}</span><span>Ik ken de leerstof:</span><span class="lvl">${lvl}</span></div>`;
    scoreTop.innerHTML = html; scoreBottom.innerHTML = html; CLtoets(key, score, total);
    bGrade.disabled = true;
    st.done = true; save();
  }
  bGrade.addEventListener('click', ()=>{ grade(); scoreTop.scrollIntoView({behavior:'smooth', block:'start'}); });
  bReset.addEventListener('click', ()=>{ wipe(key); renderers[key](); });
  if(st.done) grade();
}

/* ============================================================
   MEETKUNDE-HULPFUNCTIES (eenheid: mm, y naar beneden zoals SVG;
   hoeken in graden, tegenwijzerzin zoals op papier)
   ============================================================ */
const D2R = Math.PI/180;
const P = (x,y)=>({x,y});
const dist = (a,b)=>Math.hypot(a.x-b.x, a.y-b.y);
const norm360 = a => ((a%360)+360)%360;
const dirAng = (a,b)=> norm360(Math.atan2(-(b.y-a.y), b.x-a.x)/D2R);
const polar = (c,r,a)=>({x:c.x + r*Math.cos(a*D2R), y:c.y - r*Math.sin(a*D2R)});
const sdiff = (a,b)=>{ let d = norm360(a-b); return d>180? d-360 : d; };
const adiff = (a,b)=>Math.abs(sdiff(a,b));
const ldiff = (a,b)=>{ const d = norm360(a-b)%180; return Math.min(d, 180-d); };
const lerp = (a,b,t)=>({x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t});
const mid = (a,b)=>lerp(a,b,.5);
/* geodriehoek om twee punten te verbinden: het midden van de tekenzijde tussen beide punten, zodat je de volle breedte gebruikt */
const geoOn = (a,b)=>{ const m = mid(a,b); return {x:m.x, y:m.y, rot:dirAng(a,b)}; };
function lineDist(p,a,b){ const dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy); if(L<1e-9) return dist(p,a); return Math.abs((p.x-a.x)*dy - (p.y-a.y)*dx)/L; }
function projT(p,a,b){ const dx=b.x-a.x, dy=b.y-a.y, L2=dx*dx+dy*dy; return L2? ((p.x-a.x)*dx+(p.y-a.y)*dy)/L2 : 0; }
function projP(p,a,b){ return lerp(a,b,projT(p,a,b)); }
function segDist(p,a,b){ const t = Math.max(0,Math.min(1,projT(p,a,b))); return dist(p,lerp(a,b,t)); }
function lineInter(a,b,c,d){
  const r={x:b.x-a.x,y:b.y-a.y}, s={x:d.x-c.x,y:d.y-c.y}; const den = r.x*s.y - r.y*s.x;
  if(Math.abs(den)<1e-9) return null;
  const t = ((c.x-a.x)*s.y - (c.y-a.y)*s.x)/den; const u = ((c.x-a.x)*r.y - (c.y-a.y)*r.x)/den;
  return {x:a.x+t*r.x, y:a.y+t*r.y, t, u};
}
function lineCircle(a,b,c,r){
  const dx=b.x-a.x, dy=b.y-a.y, fx=a.x-c.x, fy=a.y-c.y; const A=dx*dx+dy*dy, Bq=2*(fx*dx+fy*dy), C=fx*fx+fy*fy-r*r; const disc=Bq*Bq-4*A*C;
  if(disc<0||A<1e-12) return []; const sq=Math.sqrt(disc);
  return [(-Bq-sq)/(2*A), (-Bq+sq)/(2*A)].map(t=>({x:a.x+t*dx, y:a.y+t*dy, t}));
}
function circleCircle(c1,r1,c2,r2){
  const d=dist(c1,c2); if(d<1e-9 || d>r1+r2+1e-9 || d<Math.abs(r1-r2)-1e-9) return [];
  const a=(r1*r1-r2*r2+d*d)/(2*d); const h=Math.sqrt(Math.max(0,r1*r1-a*a));
  const mx=c1.x+a*(c2.x-c1.x)/d, my=c1.y+a*(c2.y-c1.y)/d;
  return [{x:mx+h*(c2.y-c1.y)/d, y:my-h*(c2.x-c1.x)/d},{x:mx-h*(c2.y-c1.y)/d, y:my+h*(c2.x-c1.x)/d}];
}
const inArc = (arc, ang) => norm360(ang - arc.a0) <= (arc.a1-arc.a0) + 1e-6;
/* hoek tussen twee richtingen (0..180) */
const angBetween = (d1,d2)=>adiff(d1,d2);
/* richting van de bissectrice tussen d1 en d2 (binnen de hoek < 180) */
function bisDir(d1,d2){ const s = sdiff(d2,d1); return norm360(d1 + s/2); }
function r1(x){ return Math.round(x*10)/10; }
function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function triArea(a,b,c){ return Math.abs((b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y))/2; }
function incenter(a,b,c){ const la=dist(b,c), lb=dist(a,c), lc=dist(a,b), s=la+lb+lc; return {x:(la*a.x+lb*b.x+lc*c.x)/s, y:(la*a.y+lb*b.y+lc*c.y)/s}; }
/* lijn tot aan de rand van een rechthoek verlengen */
function clipLine(a, b, w, h, pad=2){
  const d = {x:b.x-a.x, y:b.y-a.y}; const ts=[];
  const xs=[pad, w-pad], ys=[pad, h-pad];
  if(Math.abs(d.x)>1e-9) xs.forEach(x=>{ const t=(x-a.x)/d.x; const y=a.y+t*d.y; if(y>=ys[0]-1e-6 && y<=ys[1]+1e-6) ts.push(t); });
  if(Math.abs(d.y)>1e-9) ys.forEach(y=>{ const t=(y-a.y)/d.y; const x=a.x+t*d.x; if(x>=xs[0]-1e-6 && x<=xs[1]+1e-6) ts.push(t); });
  if(ts.length<2) return [a,b];
  return [lerp(a,b,Math.min(...ts)), lerp(a,b,Math.max(...ts))];
}
function clipRay(a, b, w, h, pad=2){ const [p,q] = clipLine(a,b,w,h,pad); const tq = projT(q,a,b), tp = projT(p,a,b); return [a, tq>tp? q : p]; }

/* collineaire lijnstukken samenvoegen (een lijn in twee stukken getekend telt als één lijn) */
function mergeStrokes(list){
  let segs = list.map(s=>({a:{...s.a}, b:{...s.b}}));
  let changed = true;
  while(changed){
    changed = false;
    outer: for(let i=0;i<segs.length;i++) for(let j=i+1;j<segs.length;j++){
      const g = segs[i], s = segs[j];
      const L = dist(g.a,g.b); if(L<1e-6) continue;
      if(ldiff(dirAng(g.a,g.b), dirAng(s.a,s.b))>0.9) continue;
      if(lineDist(s.a,g.a,g.b)>0.45 || lineDist(s.b,g.a,g.b)>0.45) continue;
      const t1 = projT(s.a,g.a,g.b)*L, t2 = projT(s.b,g.a,g.b)*L;
      const lo = Math.min(t1,t2), hi = Math.max(t1,t2);
      if(lo > L+1.2 || hi < -1.2) continue;
      const nlo = Math.min(0,lo), nhi = Math.max(L,hi);
      const A = lerp(g.a,g.b,nlo/L), Bp = lerp(g.a,g.b,nhi/L);
      segs[i] = {a:A, b:Bp}; segs.splice(j,1); changed = true; break outer;
    }
  }
  return segs;
}

/* ---------- SVG-tekenfuncties (gedeeld door tekenblad en figuren) ---------- */
const INK = '#1d2327', PENCIL = '#3b4247', DEMO = '#f5a40f', HILITE = '#1fa6ab';
const f2 = x => Math.round(x*100)/100;
function arcPath(c, r, a0, a1){
  const sweep = a1-a0;
  if(sweep >= 359.9){ const p0=polar(c,r,a0), p1=polar(c,r,a0+180); return `M${f2(p0.x)} ${f2(p0.y)}A${f2(r)} ${f2(r)} 0 1 0 ${f2(p1.x)} ${f2(p1.y)}A${f2(r)} ${f2(r)} 0 1 0 ${f2(p0.x)} ${f2(p0.y)}`; }
  const p0 = polar(c,r,a0), p1 = polar(c,r,a1);
  return `M${f2(p0.x)} ${f2(p0.y)}A${f2(r)} ${f2(r)} 0 ${sweep>180?1:0} 0 ${f2(p1.x)} ${f2(p1.y)}`;
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
/* tekst met dakje: "A^" -> A met ^ erboven */
function svgText(x,y,s,o={}){
  const size = o.size||4.2, col = o.color||INK, anc = o.anchor||'middle', w = o.weight||600, it = o.italic?' font-style="italic"':'';
  let t = esc(s);
  t = t.replace(/(.)\^/g, '$1&#770;');
  return `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${col}" text-anchor="${anc}" font-weight="${w}"${it} dominant-baseline="middle">${t}</text>`;
}
function tickMarks(p, dir, n, col, w=.3, len=2.6){
  if(!n) return '';
  const u = polar(P(0,0),1,dir), nv = polar(P(0,0),1,dir+90);
  let s=''; const gap = 0.9;
  for(let i=0;i<n;i++){ const off = (i-(n-1)/2)*gap; const c = {x:p.x+u.x*off, y:p.y+u.y*off};
    s += `<line x1="${f2(c.x-nv.x*len/2)}" y1="${f2(c.y-nv.y*len/2)}" x2="${f2(c.x+nv.x*len/2)}" y2="${f2(c.y+nv.y*len/2)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; }
  return s;
}
function amSVG(o, col){
  const v = {x:o.vx, y:o.vy}; const r = o.r||7; let s='';
  const w = o.w || .3;
  if(o.style==='right'){
    /* een kleine L met even lange benen, los in de hoek: de hoek van de L ligt vlak bij het hoekpunt,
       de benen lopen evenwijdig met de benen van de rechte hoek en raken ze niet */
    const g = o.g||1.1, q = o.q||3.2, e1 = polar({x:0,y:0},1,o.a0), e2 = polar({x:0,y:0},1,o.a0+90);
    const c = {x:v.x+g*(e1.x+e2.x), y:v.y+g*(e1.y+e2.y)}, u1 = {x:c.x+q*e1.x, y:c.y+q*e1.y}, u2 = {x:c.x+q*e2.x, y:c.y+q*e2.y};
    s += `<polyline points="${f2(u2.x)},${f2(u2.y)} ${f2(c.x)},${f2(c.y)} ${f2(u1.x)},${f2(u1.y)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="square"/>`;
    s += `<circle cx="${f2(v.x)}" cy="${f2(v.y)}" r=".01" fill="none"/>`;
  } else {
    if(o.fill) s += `<path d="M${f2(v.x)} ${f2(v.y)}L${arcPath(v,r,o.a0,o.a1).slice(1)}Z" fill="${o.fill}" stroke="none"/>`;
    s += `<path d="${arcPath(v,r,o.a0,o.a1)}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
    if(o.n){ const ma = (o.a0+o.a1)/2; s += tickMarks(polar(v,r,ma), ma+90, o.n, col, w, 2.2); }
  }
  if(o.txt){ const ma=(o.a0+o.a1)/2; const tr = o.tr || (r + (o.a1-o.a0<40 ? 5.5 : 3.6)); const tp = polar(v,tr,ma); s += svgText(tp.x,tp.y,o.txt,{size:o.size||3.6, color:o.tcol||col, weight:600}); }
  return s;
}
/* één object tekenen. o.t: pt | seg | arc | am | tk | lb | txt | poly | circ */
function objSVG(o, opt={}){
  const col = opt.color || o.color || (opt.user ? PENCIL : INK);
  const w = o.w || (opt.user ? .32 : .42);
  switch(o.t){
    case 'pt': {
      if(o.hidden) return '';
      let s = `<circle cx="${f2(o.x)}" cy="${f2(o.y)}" r="${o.small? .55 : .78}" fill="${col}"/>`;
      if(o.name){ const lx = o.lx!=null? o.lx : 1.9, ly = o.ly!=null? o.ly : -2.4; s += svgText(o.x+lx, o.y+ly, o.name, {size:o.size||4.4, color:col, anchor:o.anc||'middle', weight:600}); }
      return s;
    }
    case 'seg': {
      const dash = o.dash ? ` stroke-dasharray="${o.dash}"` : '';
      let s = `<line x1="${f2(o.x1)}" y1="${f2(o.y1)}" x2="${f2(o.x2)}" y2="${f2(o.y2)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash}/>`;
      if(o.name){ const t = o.nt!=null ? o.nt : .9; const a = lerp(P(o.x1,o.y1),P(o.x2,o.y2),t); const d = dirAng(P(o.x1,o.y1),P(o.x2,o.y2)); const off = polar(a, o.no!=null?o.no:3.4, d+90); s += svgText(off.x, off.y, o.name, {size:4.2, color:col, italic:false, weight:600}); }
      return s;
    }
    case 'arc': return `<path d="${arcPath(P(o.cx,o.cy),o.r,o.a0,o.a1)}" fill="none" stroke="${opt.user? '#4d5459' : col}" stroke-width="${o.w||.28}"/>`;
    case 'circ': return `<circle cx="${f2(o.cx)}" cy="${f2(o.cy)}" r="${f2(o.r)}" fill="${o.fill||'none'}" stroke="${col}" stroke-width="${w}"/>`;
    case 'am': return amSVG(o, o.color || col);
    case 'tk': return tickMarks(P(o.x,o.y), o.dir, o.n, col, .3);
    case 'lb': return svgText(o.x, o.y, o.s, {size:o.size||4.2, color:col, weight:600});
    case 'txt': return svgText(o.x, o.y, o.s, {size:o.size||4, color:o.color||col, anchor:o.anchor||'middle', weight:o.weight||600, italic:o.italic});
    case 'poly': return `<polygon points="${o.pts.map(p=>f2(p.x)+','+f2(p.y)).join(' ')}" fill="${o.fill||'none'}" stroke="${o.stroke||'none'}" stroke-width="${w}" ${o.op?`opacity="${o.op}"`:''}/>`;
  }
  return '';
}
/* statische figuur */
function objBBox(objs){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity; const add=(x,y)=>{ if(!isFinite(x)||!isFinite(y)) return; x0=Math.min(x0,x); y0=Math.min(y0,y); x1=Math.max(x1,x); y1=Math.max(y1,y); };
  objs.forEach(o=>{
    if(o.t==='pt'){ add(o.x,o.y); if(o.name){ const lx=o.lx!=null?o.lx:1.9, ly=o.ly!=null?o.ly:-2.4; add(o.x+lx-2,o.y+ly-2.4); add(o.x+lx+2,o.y+ly+2.4); } }
    if(o.t==='seg'){ add(o.x1,o.y1); add(o.x2,o.y2); }
    if(o.t==='am'){ const r=o.r||7; for(let a=o.a0;a<=o.a1;a+=10){ const p=polar(P(o.vx,o.vy),r,a); add(p.x,p.y); } if(o.txt){ const ma=(o.a0+o.a1)/2; const tr=o.tr||(r+(o.a1-o.a0<40?5.5:3.6)); const p=polar(P(o.vx,o.vy),tr,ma); add(p.x-3,p.y-2.5); add(p.x+3,p.y+2.5); } }
    if(o.t==='txt'||o.t==='lb'){ add(o.x-3,o.y-2.6); add(o.x+3,o.y+2.6); }
    if(o.t==='poly') o.pts.forEach(p=>add(p.x,p.y));
    if(o.t==='circ'||o.t==='arc'){ add(o.cx-o.r,o.cy-o.r); add(o.cx+o.r,o.cy+o.r); }
  });
  return {x0,y0,x1,y1};
}
function fig(w, h, objs, o={}){
  const scale = o.scale || 3.4;
  let vx=0, vy=0, vw=w, vh=h;
  if(o.fit!==false){ const bb = objBBox(objs); if(isFinite(bb.x0)){ const m = o.margin||3; vx = bb.x0-m; vy = bb.y0-m; vw = Math.max(bb.x1-bb.x0+2*m, 20); vh = Math.max(bb.y1-bb.y0+2*m, 12);
    if(o.minw && vw<o.minw){ vx -= (o.minw-vw)/2; vw = o.minw; } if(o.minh && vh<o.minh){ vy -= (o.minh-vh)/2; vh = o.minh; } } }
  return `<svg class="fig" viewBox="${f2(vx)} ${f2(vy)} ${f2(vw)} ${f2(vh)}" style="width:${o.full?'100%':Math.round(vw*scale)+'px'};max-width:100%" role="img" aria-label="${esc(o.alt||'figuur')}">${o.bg===false?'':`<rect x="${f2(vx)}" y="${f2(vy)}" width="${f2(vw)}" height="${f2(vh)}" fill="#fffefa"/>`}${objs.map(x=>objSVG(x)).join('')}</svg>`;
}
/* handige constructors voor gegeven objecten */
const G = {
  pt:(p,name,o={})=>Object.assign({t:'pt', x:p.x, y:p.y, name}, o),
  seg:(a,b,o={})=>Object.assign({t:'seg', x1:a.x, y1:a.y, x2:b.x, y2:b.y, kind:'seg'}, o),
  ray:(a,b,o={})=>Object.assign({t:'seg', x1:a.x, y1:a.y, x2:b.x, y2:b.y, kind:'ray'}, o),     /* a = grenspunt, b = ver punt */
  line:(a,b,o={})=>Object.assign({t:'seg', x1:a.x, y1:a.y, x2:b.x, y2:b.y, kind:'line'}, o),
  am:(v,a0,a1,o={})=>Object.assign({t:'am', vx:v.x, vy:v.y, a0, a1: a1<a0? a1+360 : a1, r:7}, o),
  txt:(p,s,o={})=>Object.assign({t:'txt', x:p.x, y:p.y, s}, o),
  tk:(a,b,n)=>({t:'tk', x:(a.x+b.x)/2, y:(a.y+b.y)/2, dir:dirAng(a,b), n})
};
/* hoek a0 -> a1 tegenwijzerzin, kleinste kant tussen twee richtingen */
function amBetween(v, d1, d2, o={}){ let a0=d1, a1=d2; if(norm360(d2-d1)>180){ a0=d2; a1=d1; } return G.am(v, a0, a1<a0?a1+360:a1, o); }

/* ============================================================
   DYNAMISCHE FIGUREN: punten verslepen, alles rekent live mee
   cfg: {w,h, pts:{K:{x,y, drag:true, c:(p,P)=>p}}, draw:(P)=>svg, info:(P)=>html, ctl:[elements] }
   ============================================================ */
function dynFig(parent, cfg){
  const box = el('div','dyn');
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `0 0 ${cfg.w} ${cfg.h}`); svg.setAttribute('role','img'); svg.setAttribute('aria-label', cfg.alt||'dynamische figuur');
  if(cfg.maxw) svg.style.maxWidth = cfg.maxw+'px';
  svg.style.margin = '0 auto';
  box.append(svg);
  const info = el('div','dyn-info'); if(cfg.info) box.append(info);
  if(cfg.ctl){ const c = el('div','dyn-ctl'); cfg.ctl.forEach(x=>c.append(x)); box.append(c); }
  parent.append(box);
  const Pt = {}; Object.entries(cfg.pts||{}).forEach(([k,v])=>Pt[k]={...v});
  function redraw(){
    let s = `<rect width="${cfg.w}" height="${cfg.h}" fill="#fffefa"/>` + cfg.draw(Pt);
    Object.entries(Pt).forEach(([k,p])=>{ if(p.drag) s += `<circle class="handle" data-k="${k}" cx="${f2(p.x)}" cy="${f2(p.y)}" r="${cfg.hr||3}" fill="rgba(245,164,15,.22)" stroke="#f5a40f" stroke-width=".45"/>`; });
    svg.innerHTML = s;
    if(cfg.info) info.innerHTML = cfg.info(Pt);
    if(cfg.onChange) cfg.onChange(Pt);
  }
  let dk = null;
  const toW = e => { const pt = svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return {x:r.x, y:r.y}; };
  svg.addEventListener('pointerdown', e=>{
    const t = e.target.closest('.handle'); let k = t ? t.dataset.k : null;
    if(!k){ const p = toW(e); let bd = 6; Object.entries(Pt).forEach(([kk,q])=>{ if(q.drag && dist(p,q)<bd){ bd=dist(p,q); k=kk; } }); }
    if(!k) return; dk = k; e.preventDefault(); try{ svg.setPointerCapture(e.pointerId); }catch(_){}
  });
  svg.addEventListener('pointermove', e=>{ if(!dk) return; let p = toW(e); p.x = clamp(p.x, 2, cfg.w-2); p.y = clamp(p.y, 2, cfg.h-2); const c = Pt[dk].c; const np = c ? c(p, Pt) : p; Pt[dk].x = np.x; Pt[dk].y = np.y; redraw(); });
  const up = ()=>{ dk = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  redraw();
  return {P:Pt, redraw, box, svg, info};
}
/* kleine hulp voor knoppen in dyn-ctl */
function ctlBtn(label, fn, ghost=true){ const b = el('button', 'btn'+(ghost?' ghost':''), label); b.type='button'; b.addEventListener('click', fn); return b; }
/* animatie-hulp voor dynamische figuren */
function tween(ms, fn, done){ const t0 = performance.now(); const tick = now=>{ const t = Math.min(1,(now-t0)/ms); fn(t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2); if(t<1) requestAnimationFrame(tick); else if(done) done(); }; requestAnimationFrame(tick); }


/* ============================================================
   EXTRA STIJL VOOR DEZE MODULE (assenstelsel, vectornotatie, stappen)
   ============================================================ */
(function(){
  const css = `
  .cf{display:block; width:100%; max-width:420px; margin:.4rem auto; touch-action:manipulation; user-select:none; -webkit-user-select:none}
  .cf .bg{fill:var(--card)}
  .cf .grid{stroke:var(--border); stroke-width:.35}
  .cf .axis{stroke:var(--ink); stroke-width:.55; fill:none}
  .cf .axhead{fill:var(--ink)}
  .cf .num{fill:var(--ink); font-size:4.2px; font-weight:600; font-family:var(--f-body)}
  .cf .axl{fill:var(--ink); font-size:5.4px; font-style:italic; font-family:var(--f-body)}
  .cf .lbl{font-size:5.6px; font-weight:700; font-family:var(--f-body); paint-order:stroke; stroke:var(--card); stroke-width:1.4px; stroke-linejoin:round}
  .cf .lbl.orig{fill:var(--accent-dark)} .cf .lbl.img{fill:var(--ink)} .cf .lbl.help{fill:var(--ink); font-weight:700; font-size:5.2px}
  .cf text.lbl.help, .cf text.lbl.step, .cf text.lbl.hint{stroke:var(--card); stroke-width:1.4px; stroke-dasharray:none}
  .cf .lbl.step{fill:var(--accent-dark); font-size:5.2px}
  .cf circle.orig{fill:var(--accent-dark); stroke:var(--card); stroke-width:.5}
  .cf circle.img{fill:var(--orange); stroke:var(--ink); stroke-width:.45}
  .cf circle.ghost{fill:none; stroke:var(--orange); stroke-width:.6; stroke-dasharray:1.2 1}
  .cf circle.mine{fill:var(--orange); stroke:var(--ink); stroke-width:.45}
  .cf circle.mineP{fill:var(--accent-dark); stroke:var(--card); stroke-width:.5}
  .cf .help{stroke:var(--ink-soft); stroke-width:.45; stroke-dasharray:1.6 1.2; fill:none}
  .cf .vec{stroke:var(--accent-dark); stroke-width:.7; fill:none}
  .cf .vech{fill:var(--accent-dark)}
  .cf .vec.img{stroke:var(--orange)} .cf .vech.img{fill:var(--orange)}
  .cf .comp{stroke:var(--orange); stroke-width:.8; fill:none}
  .cf .comph{fill:var(--orange)}
  .cf .mark{stroke:var(--ink); stroke-width:.35; fill:none}
  .cf .arc{stroke:var(--orange); stroke-width:.6; fill:none}
  .cf .hot{fill:transparent; cursor:pointer}
  .cf .hov{fill:var(--or-soft); stroke:var(--orange); stroke-width:.4}
  .vec-n{position:relative; display:inline-block; padding-top:.18em; line-height:1.1}
  .vec-n>i{position:absolute; left:0; right:0; top:-.22em; height:.42em; display:block}
  .vec-n>i svg{display:block; width:100%; height:100%; overflow:visible}
  .vec-n>i path{fill:none; stroke:currentColor; stroke-width:1.3; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke}
  .opv{display:inline-block; min-width:.9em; text-align:center; font-weight:700; color:var(--accent-dark)}
  .cf-cap{min-height:2.6em; margin:.3rem auto .2rem; max-width:560px; padding:.45rem .7rem; border:1.5px solid var(--accent); border-radius:10px; background:var(--accent-soft); font-size:1.02rem}
  .cf-cap:empty{display:none}
  .cf-pick{display:flex; flex-wrap:wrap; gap:.35rem; justify-content:center; margin:.3rem 0}
  .cf-pick .opt.on{border-color:var(--orange); background:var(--or-soft)}
  .cf-two{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1rem; align-items:start}
  @media (max-width:760px){ .cf-two{grid-template-columns:1fr} }
  .stp{border-left:3px solid var(--accent); padding:.35rem 0 .35rem .7rem; margin:.5rem 0}
  .stp.done{border-left-color:var(--ok)}
  .stp .stp-h{font-weight:700; color:var(--accent-dark); margin-bottom:.15rem}
  .stp.done .stp-h::after{content:' ✓'; color:var(--ok)}
  .stp .choices{margin:.3rem 0}
  .rule{font-size:1.08rem}
  .opg{font-size:1.18rem; line-height:1.5; padding:.6rem .9rem; margin:.2rem 0 .7rem; border:2px solid var(--accent); border-radius:12px; background:var(--accent-soft)}
  .opg b{color:var(--accent-dark)}
  #coord .q-text, #coord .stp .q-text{font-size:1.06rem}
  #coord .stp .stp-h{font-size:1.06rem}
  .pm{display:inline-flex; align-items:center; gap:.2rem; vertical-align:middle}
  .pm-sw{display:inline-flex; flex-direction:column; gap:2px}
  .pm-sw button{font:inherit; font-weight:700; font-size:.95rem; line-height:1; width:1.7rem; height:1.25rem; padding:0; border:1.5px solid var(--accent); border-radius:6px; background:var(--card); color:var(--ink); cursor:pointer}
  .pm-sw button:hover:not(:disabled){border-color:var(--orange); background:var(--or-soft)}
  .pm-sw button.on{border-color:var(--orange); background:var(--orange); color:#173436}
  .pm-sw button:disabled{cursor:default}
  .stp .row, .q .row{display:flex; flex-wrap:wrap; align-items:center; gap:.4rem; margin:.3rem 0}
  .stp .row .lab, .q .row .lab{min-width:7.2em; font-weight:700}
  .rows .q{margin:.5rem 0}
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* ---------- +/− keuzevakje met invulvak: het invulvak bevat het getal met teken, bv. +4 ---------- */
const pmDigits = v => String(v).replace(/[^0-9]/g,'');
function pmSync(inp){ const sw = inp.parentElement.querySelector('.pm-sw'); const v = String(inp.value).trim(); const s = /^[−–-]/.test(v) ? '-' : /^\+/.test(v) ? '+' : '';
  sw.querySelectorAll('button').forEach(b=>{ b.classList.toggle('on', b.dataset.s===s); b.disabled = inp.readOnly; }); }
document.addEventListener('click', e=>{ const b = e.target.closest('.pm-sw button'); if(!b) return; const inp = b.closest('.pm').querySelector('input'); if(inp.readOnly) return;
  inp.value = (b.dataset.s==='+' ? '+' : '−') + pmDigits(inp.value); inp.dispatchEvent(new Event('input', {bubbles:true})); pmSync(inp); inp.focus(); });
document.addEventListener('input', e=>{ const inp = e.target; if(inp.closest && inp.closest('.pm')) pmSync(inp); });
new MutationObserver(()=>document.querySelectorAll('.pm input').forEach(pmSync)).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['readonly']});
/* controle van een +/−-vak: verwacht verschil d */
function chkPm(v, d){ const t = String(v).trim(); if(!/^[+−–-]/.test(t)) return {ok:false, sign:false}; const n = parseInt2(t); return {ok:n===d, sign:true, n}; }

/* ============================================================
   NOTATIE
   ============================================================ */
const PR = '′';
const vecN = (a,b) => `<span class="vec-n"><i><svg viewBox="0 0 20 6" preserveAspectRatio="none" aria-hidden="true"><path d="M.5 3H19.3M16.2 .6L19.4 3L16.2 5.4"/></svg></i>${a}${b}</span>`;
const neg = x => x<0 ? '−'+(-x) : String(x);              /* −3 met echt minteken */
const co = (x,y) => `(${neg(x)}, ${neg(y)})`;
const ptN = (n,x,y) => `${n}${co(x,y)}`;
const par = x => x<0 ? '('+neg(x)+')' : neg(x);            /* (−3) tussen haakjes in een bewerking */
const sgnTxt = d => d>=0 ? '+ '+d : '− '+(-d);              /* + 4 of − 3 */
const sub = (s,i) => `${s}<sub>${i}</sub>`;
const TRN = {
  sx:{naam:'spiegeling om de x-as', kort:`s<sub>x</sub>`, f:(x,y)=>[x,-y], kx:'blijft', ky:'teken'},
  sy:{naam:'spiegeling om de y-as', kort:`s<sub>y</sub>`, f:(x,y)=>[-x,y], kx:'teken', ky:'blijft'},
  sO:{naam:'spiegeling om de oorsprong O', kort:`s<sub>O</sub>`, f:(x,y)=>[-x,-y], kx:'teken', ky:'teken'},
  r90:{naam:'rotatie rond O over 90°', kort:`r(O, 90°)`, f:(x,y)=>[-y,x]},
  rm90:{naam:'rotatie rond O over −90°', kort:`r(O, −90°)`, f:(x,y)=>[y,-x]},
  r180:{naam:'rotatie rond O over 180°', kort:`r(O, 180°)`, f:(x,y)=>[-x,-y]},
  bis:{naam:'spiegeling om de bissectrice van het eerste kwadrant', kort:`s<sub>b</sub>`, f:(x,y)=>[y,x]}
};
/* invoer: −3, -3, – 3, +4, 4 */
function parseInt2(s){ const t = String(s).replace(/\s+/g,'').replace(/[−–]/g,'-').replace(/^\+/,''); if(!/^-?\d+$/.test(t)) return NaN; return Number(t); }
const noLetters = UPP.replace('O','').replace('X','').replace('Y','');

/* ============================================================
   ASSENSTELSEL (−6 tot 6). Wereld: 1 eenheid = 10 svg-eenheden, y naar boven.
   ============================================================ */
const CU = 10, CR = 6;
const X = x => f2(x*CU), Y = y => f2(-y*CU);
function cfBase(){
  let s = `<rect class="bg" x="-75" y="-75" width="150" height="150"/>`;
  for(let k=-CR;k<=CR;k++){ s += `<line class="grid" x1="${X(k)}" y1="${Y(-CR-.5)}" x2="${X(k)}" y2="${Y(CR+.5)}"/><line class="grid" x1="${X(-CR-.5)}" y1="${Y(k)}" x2="${X(CR+.5)}" y2="${Y(k)}"/>`; }
  s += `<line class="axis" x1="${X(-CR-.8)}" y1="0" x2="${X(CR+.7)}" y2="0"/><line class="axis" x1="0" y1="${Y(-CR-.8)}" x2="0" y2="${Y(CR+.7)}"/>`;
  s += `<path class="axhead" d="M${X(CR+1.05)} 0 l-3.2 -1.6 v3.2z"/><path class="axhead" d="M0 ${Y(CR+1.05)} l-1.6 3.2 h3.2z"/>`;
  s += `<text class="axl" x="${X(CR+.75)}" y="5">x</text><text class="axl" x="2.2" y="${Y(CR+.75)}">y</text>`;
  for(let k=-CR;k<=CR;k++){ if(!k) continue;
    s += `<line class="axis" x1="${X(k)}" y1="-.9" x2="${X(k)}" y2=".9"/><line class="axis" x1="-.9" y1="${Y(k)}" x2=".9" y2="${Y(k)}"/>`;
    s += `<text class="num" x="${X(k)}" y="4.4" text-anchor="middle">${neg(k)}</text><text class="num" x="-1.6" y="${f2(Y(k)+1.2)}" text-anchor="end">${neg(k)}</text>`; }
  s += `<text class="num" x="-1.6" y="4.4" text-anchor="end">O</text>`;
  return s;
}
/* label van een punt: weg van de oorsprong (of van een opgegeven richting) */
function lblPos(x, y, away){
  let dx = x - (away? away[0]:0), dy = y - (away? away[1]:0);
  if(Math.abs(dx)<1e-9 && Math.abs(dy)<1e-9){ dx = 1; dy = 1; }
  const L = Math.hypot(dx,dy); dx/=L; dy/=L;
  /* liefst schuin, zodat het label niet op een rasterlijn staat */
  if(Math.abs(dx)<.35) dx = .6*(dx>=0?1:-1); if(Math.abs(dy)<.35) dy = .6*(dy>=0?1:-1);
  if(x>=5 && dx>0) dx = -Math.abs(dx); if(x<=-5 && dx<0) dx = Math.abs(dx);
  if(y>=5.5 && dy>0) dy = -Math.abs(dy); if(y<=-5.5 && dy<0) dy = Math.abs(dy);
  const lx = X(x) + dx*4.2, ly = Y(y) - dy*4.2 + 1.7;
  return {lx, ly, anchor: dx>0.2 ? 'start' : dx<-0.2 ? 'end' : 'middle'};
}
function cfArrow(a, b, cls, head=2.6){
  const x1=X(a[0]), y1=Y(a[1]), x2=X(b[0]), y2=Y(b[1]); const L = Math.hypot(x2-x1, y2-y1); if(L<.5) return '';
  const ux=(x2-x1)/L, uy=(y2-y1)/L, h=Math.min(head, L*.6);
  const bx = x2-ux*h, by = y2-uy*h;
  return `<line class="${cls}" x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(bx+ux*.3)}" y2="${f2(by+uy*.3)}"/><path class="${cls}h" d="M${f2(x2)} ${f2(y2)} L${f2(bx-uy*h*.45)} ${f2(by+ux*h*.45)} L${f2(bx+uy*h*.45)} ${f2(by-ux*h*.45)}z"/>`;
}
/* rechte-hoekteken (losse L) in wereldcoördinaten: hoekpunt v, richtingen d1 en d2 (eenheidsvectoren, wiskundig) */
function cfRight(v, d1, d2, g=1.1, q=2.6){
  const e1 = {x:d1[0], y:-d1[1]}, e2 = {x:d2[0], y:-d2[1]}; const vx = X(v[0]), vy = Y(v[1]);
  const c = {x:vx + g*(e1.x+e2.x), y:vy + g*(e1.y+e2.y)};
  return `<polyline class="mark" points="${f2(c.x+q*e2.x)},${f2(c.y+q*e2.y)} ${f2(c.x)},${f2(c.y)} ${f2(c.x+q*e1.x)},${f2(c.y+q*e1.y)}"/>`;
}
/* twee streepjes = even lang, op het midden van [a,b] */
function cfTicks(a, b, n=1){
  const x1=X(a[0]), y1=Y(a[1]), x2=X(b[0]), y2=Y(b[1]); const L=Math.hypot(x2-x1,y2-y1); if(L<1) return '';
  const ux=(x2-x1)/L, uy=(y2-y1)/L, mx=(x1+x2)/2, my=(y1+y2)/2; let s='';
  for(let i=0;i<n;i++){ const o=(i-(n-1)/2)*1.2; const cx=mx+ux*o, cy=my+uy*o; s+=`<line class="mark" x1="${f2(cx-uy*1.6)}" y1="${f2(cy+ux*1.6)}" x2="${f2(cx+uy*1.6)}" y2="${f2(cy-ux*1.6)}"/>`; }
  return s;
}
/* objecten: {t:'pt', p:[x,y], n, c:'orig'|'img'|'ghost', away}, {t:'arrow', a, b, c}, {t:'line', a, b, c}, {t:'txt', p, s, c, anchor}, {t:'raw', s} */
function cfObjs(objs){
  let s = '';
  objs.filter(Boolean).forEach(o=>{
    if(o.t==='line') s += `<line class="${o.c||'help'}" x1="${X(o.a[0])}" y1="${Y(o.a[1])}" x2="${X(o.b[0])}" y2="${Y(o.b[1])}"/>`;
    else if(o.t==='arrow') s += cfArrow(o.a, o.b, o.c||'vec');
    else if(o.t==='txt') s += `<text class="lbl ${o.c||'help'}" x="${f2(X(o.p[0])+(o.dx||0))}" y="${f2(Y(o.p[1])+(o.dy||0))}" text-anchor="${o.anchor||'middle'}">${o.s}</text>`;
    else if(o.t==='raw') s += o.s;
  });
  objs.filter(o=>o && o.t==='pt').forEach(o=>{
    s += `<circle class="${o.c||'orig'}" cx="${X(o.p[0])}" cy="${Y(o.p[1])}" r="${o.c==='ghost'?1.9:1.5}"/>`;
    if(o.n){ const L = lblPos(o.p[0], o.p[1], o.away); s += `<text class="lbl ${o.c==='img'||o.c==='mine'?'img':'orig'}" x="${f2(L.lx)}" y="${f2(L.ly)}" text-anchor="${L.anchor}">${o.n}</text>`; }
  });
  return s;
}
function coordFig(parent, o={}){
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','-75 -75 150 150'); svg.setAttribute('class','cf'); svg.setAttribute('role','img'); svg.setAttribute('aria-label', o.alt || 'assenstelsel');
  if(o.maxw) svg.style.maxWidth = o.maxw + 'px';
  svg.innerHTML = `<g>${cfBase()}</g><g class="objs"></g><g class="top"></g>`;
  parent.append(svg);
  const g = svg.querySelector('.objs'), top = svg.querySelector('.top');
  const F = { svg, base:[], token:0,
    draw(objs){ g.innerHTML = cfObjs(F.base.concat(objs||[])); },
    alive(tok){ return svg.isConnected && tok===F.token; },
    /* klikken op roosterpunten: cb([x,y]) */
    clickable(cb){
      let hov = null;
      const toW = e => { const pt = svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return [Math.round(r.x/CU), Math.round(-r.y/CU)]; };
      const ok = p => Math.abs(p[0])<=CR && Math.abs(p[1])<=CR;
      svg.style.cursor = 'crosshair';
      svg.addEventListener('pointermove', e=>{ const p = toW(e); if(!ok(p)){ top.innerHTML=''; return; } if(hov && hov[0]===p[0] && hov[1]===p[1]) return; hov = p; top.innerHTML = `<circle class="hov" cx="${X(p[0])}" cy="${Y(p[1])}" r="2.4"/>`; });
      svg.addEventListener('pointerleave', ()=>{ hov=null; top.innerHTML=''; });
      svg.addEventListener('click', e=>{ const p = toW(e); if(ok(p)) cb(p); });
    }
  };
  F.draw([]);
  return F;
}
const wait = ms => new Promise(r=>setTimeout(r, ms));
const twn = (ms, fn) => new Promise(r=>tween(ms, fn, r));
const lerp2 = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
const REDUCED = (()=>{ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();
/* animaties lopen trager, en elke uitlegzin blijft staan in een genummerde lijst */
const SLOW = 1.7;
function stepSay(cap, keep){ let ol = null;
  return h=>{ if(!cap) return; if(!ol){ if(!keep) cap.innerHTML = ''; ol = el('ol','cap-steps'); cap.append(ol); } ol.append(el('li','',h)); }; }

/* hulpfiguur na de transformatie (statisch eindbeeld) */
function finalObjs(k, P, Pn, ex){
  const Q = TRN[k] ? TRN[k].f(P[0],P[1]) : [P[0]+ex.dx, P[1]+ex.dy];
  const o = [];
  if(k==='sx' || k==='sy' || k==='sO' || k==='bis'){
    o.push({t:'line', a:P, b:Q});
    if(k==='sx' && P[1]) o.push({t:'raw', s:cfRight([P[0],0], [1,0], [0, P[1]>0?1:-1]) + cfTicks(P,[P[0],0]) + cfTicks([P[0],0],Q)});
    if(k==='sy' && P[0]) o.push({t:'raw', s:cfRight([0,P[1]], [0,1], [P[0]>0?1:-1, 0]) + cfTicks(P,[0,P[1]]) + cfTicks([0,P[1]],Q)});
    if(k==='sO') o.push({t:'raw', s:cfTicks(P,[0,0],2) + cfTicks([0,0],Q,2)});
  }
  if(k==='t'){ o.push({t:'arrow', a:P, b:Q, c:'vec img'}); }
  if(k==='r90' || k==='rm90' || k==='r180'){ o.push({t:'line', a:[0,0], b:P}, {t:'line', a:[0,0], b:Q}); o.push({t:'raw', s:arcSvg(P, k==='r90'?90:k==='rm90'?-90:180)}); }
  o.push({t:'pt', p:Q, n:Pn+PR, c:'img', away: k==='t' ? P : undefined});
  return o;
}
function arcSvg(P, deg, frac=1){
  const r = Math.max(4, Math.hypot(P[0],P[1])*CU*.45); const a0 = Math.atan2(P[1],P[0]); const a1 = a0 + deg*D2R*frac;
  const p0 = [r*Math.cos(a0), -r*Math.sin(a0)], p1 = [r*Math.cos(a1), -r*Math.sin(a1)];
  const large = Math.abs(deg*frac)>180 ? 1:0, sweep = deg>0 ? 0:1;
  if(Math.abs(deg*frac)<1) return '';
  return `<path class="arc" d="M${f2(p0[0])} ${f2(p0[1])} A${f2(r)} ${f2(r)} 0 ${large} ${sweep} ${f2(p1[0])} ${f2(p1[1])}"/>`;
}

/* ---------- animaties: geven het eindbeeld terug ---------- */
async function animTrans(F, k, P, Pn, ex, cap, extraBase=[]){
  const tok = ++F.token; const say = stepSay(cap);
  const base = [{t:'pt', p:P, n:Pn, c:'orig'}].concat(extraBase);
  const run = async (dur, fn) => { if(!F.alive(tok)) throw 0; await twn(REDUCED?30:dur*SLOW, t=>{ if(F.alive(tok)) fn(t); }); if(!F.alive(tok)) throw 0; };
  const pause = async d => { await wait(REDUCED?30:d*SLOW+500); if(!F.alive(tok)) throw 0; };
  try{
    if(k==='sx' || k==='sy'){
      const Q = TRN[k].f(P[0],P[1]); const foot = k==='sx' ? [P[0],0] : [0,P[1]];
      const keep = k==='sx' ? 'x' : 'y', chg = k==='sx' ? 'y' : 'x';
      const kv = k==='sx' ? P[0] : P[1], cv = k==='sx' ? P[1] : P[0];
      say(`De spiegelas is de <b>${k==='sx'?'x':'y'}-as</b>. Je gaat vanuit ${Pn} <b>loodrecht</b> naar de as…`);
      await run(900, t=>F.draw(base.concat([{t:'line', a:P, b:lerp2(P,foot,t)}, {t:'pt', p:lerp2(P,foot,t), c:'ghost'}])));
      const mk = {t:'raw', s: k==='sx' ? cfRight(foot,[1,0],[0,P[1]>0?1:-1]) : cfRight(foot,[0,1],[P[0]>0?1:-1,0])};
      await pause(350);
      say(`…en even ver aan de andere kant. De afstand tot de as blijft ${Math.abs(cv)}.`);
      await run(900, t=>F.draw(base.concat([mk, {t:'line', a:P, b:lerp2(foot,Q,t)}, {t:'pt', p:lerp2(foot,Q,t), c:'ghost'}])));
      await pause(300);
      say(`De <b>${keep}-coördinaat blijft</b> ${neg(kv)}. De <b>${chg}-coördinaat verandert van teken</b>: ${neg(cv)} wordt ${neg(-cv)}. Dus ${ptN(Pn+PR, Q[0], Q[1])}.`);
    } else if(k==='sO'){
      const Q = TRN.sO.f(P[0],P[1]);
      say(`Je gaat vanuit ${Pn} in een rechte lijn naar de oorsprong O…`);
      await run(900, t=>F.draw(base.concat([{t:'line', a:P, b:lerp2(P,[0,0],t)}, {t:'pt', p:lerp2(P,[0,0],t), c:'ghost'}])));
      await pause(300);
      say(`…en even ver door aan de andere kant van O.`);
      await run(900, t=>F.draw(base.concat([{t:'raw', s:cfTicks(P,[0,0],2)}, {t:'line', a:P, b:lerp2([0,0],Q,t)}, {t:'pt', p:lerp2([0,0],Q,t), c:'ghost'}])));
      await pause(300);
      say(`<b>Allebei de coördinaten veranderen van teken</b>: ${neg(P[0])} wordt ${neg(Q[0])} en ${neg(P[1])} wordt ${neg(Q[1])}. Dus ${ptN(Pn+PR, Q[0], Q[1])}.`);
    } else if(k==='t'){
      const {A, B, An, Bn} = ex; const dx = B[0]-A[0], dy = B[1]-A[1]; const Q = [P[0]+dx, P[1]+dy];
      const C1 = [B[0], A[1]], C2 = [P[0]+dx, P[1]];
      const hLab = (a, b, d) => ({t:'txt', p:[(a[0]+b[0])/2, a[1]], s:sgnTxt(d).replace(' ',''), c:'step', dy: (dy>0? 5 : -2.2)});
      const vLab = (a, b, d) => ({t:'txt', p:[a[0], (a[1]+b[1])/2], s:sgnTxt(d).replace(' ',''), c:'step', dx:(dx>0? 2.4 : -2.4), anchor:(dx>0?'start':'end'), dy:1.6});
      const vb = [{t:'arrow', a:A, b:B}, {t:'pt', p:A, n:An, c:'orig', away:B}, {t:'pt', p:B, n:Bn, c:'orig', away:A}];
      say(`Kijk eerst naar de vector ${vecN(An,Bn)}: van ${ptN(An,A[0],A[1])} naar ${ptN(Bn,B[0],B[1])}.`);
      F.draw(base.concat(vb)); await pause(900);
      say(`<b>x-coördinaat:</b> van ${neg(A[0])} naar ${neg(B[0])}, dat is <b>${sgnTxt(dx)}</b> (${Math.abs(dx)} ${dx>0?'naar rechts':'naar links'}).`);
      await run(900, t=>F.draw(base.concat(vb, [{t:'arrow', a:A, b:lerp2(A,C1,t), c:'comp'}])));
      const s1 = [{t:'arrow', a:A, b:C1, c:'comp'}, hLab(A,C1,dx)];
      await pause(300);
      say(`<b>y-coördinaat:</b> van ${neg(A[1])} naar ${neg(B[1])}, dat is <b>${sgnTxt(dy)}</b> (${Math.abs(dy)} ${dy>0?'naar boven':'naar beneden'}).`);
      await run(900, t=>F.draw(base.concat(vb, s1, [{t:'arrow', a:C1, b:lerp2(C1,B,t), c:'comp'}])));
      const s2 = s1.concat([{t:'arrow', a:C1, b:B, c:'comp'}, vLab(C1,B,dy)]);
      await pause(500);
      say(`Doe nu <b>hetzelfde</b> met ${Pn}: x-coördinaat ${neg(P[0])} ${sgnTxt(dx)} = ${neg(Q[0])}.`);
      await run(1000, t=>F.draw(base.concat(vb, s2, [{t:'arrow', a:P, b:lerp2(P,C2,t), c:'comp'}, {t:'pt', p:lerp2(P,C2,t), c:'ghost'}])));
      const s3 = s2.concat([{t:'arrow', a:P, b:C2, c:'comp'}, hLab(P,C2,dx)]);
      await pause(300);
      say(`y-coördinaat ${neg(P[1])} ${sgnTxt(dy)} = ${neg(Q[1])}.`);
      await run(1000, t=>F.draw(base.concat(vb, s3, [{t:'arrow', a:C2, b:lerp2(C2,Q,t), c:'comp'}, {t:'pt', p:lerp2(C2,Q,t), c:'ghost'}])));
      await pause(300);
      say(`Dus ${ptN(Pn+PR, Q[0], Q[1])}. De pijl van ${Pn} naar ${Pn}${PR} is even lang en wijst in dezelfde richting als ${vecN(An,Bn)}.`);
      F.draw(base.concat(vb, s3, [{t:'arrow', a:C2, b:Q, c:'comp'}, vLab(C2,Q,dy)], finalObjs('t', P, Pn, {dx, dy})));
      return;
    } else if(k==='r90' || k==='rm90' || k==='r180'){
      const deg = k==='r90'?90:k==='rm90'?-90:180; const Q = TRN[k].f(P[0],P[1]);
      say(`Draai ${Pn} rond O over ${deg===-90?'−90° (in wijzerzin)':deg+'° (in tegenwijzerzin)'}. De afstand tot O blijft gelijk.`);
      await run(1500, t=>{ const a = deg*D2R*t, c=Math.cos(a), s=Math.sin(a); const R = [P[0]*c - P[1]*s, P[0]*s + P[1]*c];
        F.draw(base.concat([{t:'line', a:[0,0], b:P}, {t:'line', a:[0,0], b:R}, {t:'raw', s:arcSvg(P,deg,t)}, {t:'pt', p:R, c:'ghost'}])); });
      await pause(300);
      say(k==='r90' ? `De coördinaten wisselen van plaats en de nieuwe x-coördinaat verandert van teken: (x, y) → (−y, x). Dus ${ptN(Pn+PR,Q[0],Q[1])}.`
        : k==='rm90' ? `De coördinaten wisselen van plaats en de nieuwe y-coördinaat verandert van teken: (x, y) → (y, −x). Dus ${ptN(Pn+PR,Q[0],Q[1])}.`
        : `Een halve draai: allebei de coördinaten veranderen van teken, net als bij een spiegeling om O. Dus ${ptN(Pn+PR,Q[0],Q[1])}.`);
    } else if(k==='bis'){
      const Q = TRN.bis.f(P[0],P[1]); const M = [(P[0]+Q[0])/2, (P[1]+Q[1])/2];
      say(`De bissectrice van het eerste kwadrant is de rechte door O en (1, 1). Je gaat loodrecht naar die rechte…`);
      await run(900, t=>F.draw(base.concat([{t:'line', a:P, b:lerp2(P,M,t)}])));
      await run(900, t=>F.draw(base.concat([{t:'line', a:P, b:lerp2(M,Q,t)}, {t:'pt', p:lerp2(M,Q,t), c:'ghost'}])));
      say(`De x- en de y-coördinaat wisselen van plaats: (x, y) → (y, x). Dus ${ptN(Pn+PR,Q[0],Q[1])}.`);
    }
    F.draw(base.concat(finalObjs(k, P, Pn, ex)));
  }catch(e){ if(e!==0) console.error(e); }
}
/* bissectrice tekenen als extra basis */
const BIS_LINE = {t:'raw', s:`<line class="help" x1="${X(-6.4)}" y1="${Y(-6.4)}" x2="${X(6.4)}" y2="${Y(6.4)}" style="stroke-dasharray:none; stroke:var(--accent); stroke-width:.6"/><text class="lbl axn" x="${X(5.6)}" y="${f2(Y(6.1))}" text-anchor="end">b</text>`};

/* ---------- opgaven maken ---------- */
const nz = (R, a=1, b=6) => R.sign()*R.int(a,b);
function genP(R, k, opt={}){
  for(let i=0;i<200;i++){
    const P = [nz(R, opt.min||1, opt.max||5), nz(R, opt.min||1, opt.max||5)];
    if(opt.diff && Math.abs(P[0])===Math.abs(P[1])) continue;
    return P;
  }
  return [3,2];
}
function genT(R, opt={}){
  for(let i=0;i<500;i++){
    const A = [R.int(-5,5), R.int(-5,5)], dx = nz(R,2,5), dy = nz(R,2,5);
    const B = [A[0]+dx, A[1]+dy]; if(Math.abs(B[0])>CR || Math.abs(B[1])>CR) continue;
    /* een duidelijke vector, niet helemaal aan de rand */
    if(Math.abs(A[0]+B[0])>6 || Math.abs(A[1]+B[1])>6 || Math.hypot(dx,dy)<3.5) continue;
    if(opt.noZero && (A.includes(0) || B.includes(0))) continue;
    const P = [R.int(-5,5), R.int(-5,5)]; const Q = [P[0]+dx, P[1]+dy];
    if(Math.abs(Q[0])>CR || Math.abs(Q[1])>CR) continue;
    if((P[0]===A[0] && P[1]===A[1]) || (P[0]===B[0] && P[1]===B[1]) || (Q[0]===A[0]&&Q[1]===A[1]) || (Q[0]===B[0]&&Q[1]===B[1])) continue;
    if(opt.noZero && (P.includes(0) || Q.includes(0))) continue;
    /* figuur leesbaar: P niet op de vector AB */
    const cr = (B[0]-A[0])*(P[1]-A[1]) - (B[1]-A[1])*(P[0]-A[0]); if(Math.abs(cr) < 6) continue;
    return {A, B, P, dx, dy};
  }
  return {A:[1,4], B:[5,1], P:[-3,2], dx:4, dy:-3};
}

/* ============================================================
   STAPPENKAART: stappen verschijnen een voor een
   steps: [{h, html (met [[i]]), choice:[[val,label]], check(vals, choice)->{ok,msg,fields}, after:()=>Promise}]
   ============================================================ */
function qSteps(parent, st, save, id, cfg){
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {done:0, v:{}, c:{}});
  const wrap = el('div','q'); parent.append(wrap);
  if(cfg.html) wrap.append(el('div','q-text block', cfg.html));
  const list = el('div'); wrap.append(list);
  const endFb = el('div','fb'); wrap.append(endFb);
  function renderStep(i){
    const S = cfg.steps[i]; const sid = id+'s'+i;
    const box = el('div','stp'); list.append(box);
    box.append(el('div','stp-h', `Stap ${i+1}. ${S.h}`));
    if(S.html) box.append(el('div','q-text'+(S.block?' block':''), fillInputs(S.html, sid, S.size||'xs', 'text')));
    let opts = [];
    if(S.choice){ const w = el('div','choices'); S.choice.forEach(([v,l])=>{ const b = el('button','opt',l); b.type='button'; b.dataset.val=v; w.append(b); opts.push(b); }); box.append(w); }
    if(S.html2) box.append(el('div','q-text', fillInputs(S.html2, sid, S.size||'xs', 'text')));
    const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn);
    const fb = el('div','fb'); box.append(act, fb);
    const inputs = [...box.querySelectorAll('.inp')].sort((a,b)=>a.dataset.f-b.dataset.f);
    const sv = s.v[i] || (s.v[i] = []);
    inputs.forEach((inp,j)=>{ if(sv[j]!=null) inp.value = sv[j]; inp.addEventListener('input', ()=>{ sv[j]=inp.value; save(); inp.classList.remove('ok','bad'); });
      inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); run(); } }); });
    const paint = () => { opts.forEach(b=>{ b.classList.toggle('chosen', b.dataset.val===s.c[i]); b.classList.remove('good','wrong'); });
      if(S.opSign) box.querySelectorAll('.opv').forEach(x=>x.textContent = s.c[i]==='+' ? '+' : s.c[i]==='-' ? '−' : '?'); };
    opts.forEach(b=>b.addEventListener('click', ()=>{ if(b.disabled) return; s.c[i]=b.dataset.val; save(); paint(); fb.textContent=''; }));
    paint();
    function lock(){ inputs.forEach(x=>{ x.readOnly = true; x.classList.add('ok'); }); opts.forEach(b=>{ b.disabled = true; if(b.dataset.val===s.c[i]) b.classList.add('good'); }); btn.hidden = true; box.classList.add('done'); }
    async function run(){
      const vals = inputs.map(x=>x.value.trim());
      if(S.choice && !s.c[i]){ fb.className='fb info'; fb.textContent='Kies eerst een van de knoppen.'; return; }
      if(vals.some(v=>v==='')){ fb.className='fb info'; fb.textContent='Vul eerst alle vakjes in.'; return; }
      let r; try{ r = S.check(vals, s.c[i]) || {ok:false}; }catch(e){ console.error(e); r = {ok:false}; }
      fb.className = 'fb ' + (r.ok?'ok':'bad'); fb.innerHTML = (r.ok ? '✅ Juist! ' : '❌ Nog niet juist. ') + (r.msg||'');
      inputs.forEach((x,j)=>{ x.classList.remove('ok','bad'); const f = r.fields ? r.fields[j] : r.ok; if(f!=null) x.classList.add(f?'ok':'bad'); });
      if(S.choice && r.choiceOk!=null) opts.forEach(b=>{ if(b.dataset.val===s.c[i]) b.classList.add(r.choiceOk?'good':'wrong'); });
      if(!r.ok){ CLres(qid, false); return; }
      lock(); s.done = i+1; save();
      if(S.after) await S.after(false);
      next();
    }
    btn.addEventListener('click', run);
    return {lock};
  }
  function next(){
    if(s.done >= cfg.steps.length){ endFb.className='fb ok'; endFb.innerHTML = '✅ ' + (cfg.end || 'Alle stappen zijn juist!'); CLres(qid, true); return; }
    renderStep(s.done);
  }
  /* herstellen na herladen */
  for(let i=0;i<Math.min(s.done, cfg.steps.length);i++){ const r = renderStep(i); r.lock(); }
  if(s.done && cfg.restore) cfg.restore(s.done);
  if(s.done >= cfg.steps.length){ endFb.className='fb ok'; endFb.innerHTML = '✅ ' + (cfg.end || 'Alle stappen zijn juist!'); }
  else renderStep(s.done);
}

/* veelgebruikte controles */
function chkPt(vals, Q, nm, hint){
  const a = parseInt2(vals[0]), b = parseInt2(vals[1]);
  if(isNaN(a) || isNaN(b)) return {ok:false, msg:'Typ in elk vakje een geheel getal, bijvoorbeeld −3 of 4.'};
  const f = [a===Q[0], b===Q[1]]; const ok = f[0] && f[1];
  let msg = '';
  if(!ok){
    if(a===Q[1] && b===Q[0] && Q[0]!==Q[1]) msg = 'Je hebt de x- en de y-coördinaat omgewisseld. Eerst x (horizontaal), dan y (verticaal).';
    else if(a===-Q[0] && Q[0] && !f[0]) msg = 'Kijk nog eens naar het teken van de x-coördinaat.';
    else if(b===-Q[1] && Q[1] && !f[1]) msg = 'Kijk nog eens naar het teken van de y-coördinaat.';
    else msg = hint || 'Tel de hokjes nog eens.';
  }
  return {ok, fields:f, msg};
}
const KEUZE = [['blijft','blijft hetzelfde'],['teken','verandert van teken']];
const OPKEUZE = [['+','+ (erbij)'],['-','− (eraf)']];

/* figuur met uitlegknop: speelt de animatie van transformatie k af */
function demoBox(parent, k, P, Pn, ex, extra=[]){
  const F = coordFig(parent, {maxw:400});
  F.base = [{t:'pt', p:P, n:Pn, c:'orig'}].concat(extra);
  F.draw([]);
  const cap = el('div','cf-cap'); parent.append(cap);
  const ctl = el('div','dyn-ctl');
  const play = ctlBtn(icon('play')+' Bekijk de uitleg', async ()=>{ play.disabled = true; F.base = extra.slice(); await animTrans(F, k, P, Pn, ex, cap, []); F.base = [{t:'pt', p:P, n:Pn, c:'orig'}].concat(extra); play.disabled = false; });
  play.style.display='inline-flex'; play.style.alignItems='center'; play.style.gap='.3rem';
  ctl.append(play); parent.append(ctl);
  return {F, cap, play};
}

/* ============================================================
   KAARTEN: COÖRDINATEN
   ============================================================ */
const CO = {};
/* hint bij de opgaven zonder tekening: een leeg assenstelsel waarin je zelf punten zet en een vector tekent */
function kladblad(parent){
  const host = el('div','klad'); parent.append(host);
  const open = el('button','hintbtn','💡 Hint: teken het zelf in een assenstelsel'); open.type = 'button'; host.append(open);
  const box = el('div','klad-box'); box.hidden = true; host.append(box);
  const pick = el('div','cf-pick'); box.append(pick);
  const mk = t => { const x = el('button','opt',t); x.type = 'button'; pick.append(x); return x; };
  const bP = mk('Zet een punt'), bV = mk('Teken een vector'), bW = el('button','linkbtn','Wis alles'); bW.type = 'button'; pick.append(bW);
  const info = el('div','klad-info'); box.append(info);
  const F = gridFig(box, {g:[-10,10,-10,10], axes:true, maxw:460});
  const s = {mode:'P', pts:[], vecs:[], start:null};
  const paint = () => { bP.classList.toggle('chosen', s.mode==='P'); bV.classList.toggle('chosen', s.mode==='V');
    info.innerHTML = s.mode==='P' ? 'Klik op het rooster om een punt te zetten. Klik er nog eens op om het weg te halen.' : s.start ? 'Klik nu op het eindpunt van de vector.' : 'Klik op het beginpunt van de vector.';
    F.draw(s.vecs.map(v=>({t:'arrow', a:v[0], b:v[1], c:'vec'})).concat(s.start ? [{t:'pt', p:s.start, c:'ghost'}] : [],
      s.pts.map(p=>({t:'pt', p, n:co(p[0],p[1]), c:'mine', r:1.1, sm:true})))); };
  bP.addEventListener('click', ()=>{ s.mode = 'P'; s.start = null; paint(); });
  bV.addEventListener('click', ()=>{ s.mode = 'V'; s.start = null; paint(); });
  bW.addEventListener('click', ()=>{ s.pts = []; s.vecs = []; s.start = null; paint(); });
  open.addEventListener('click', ()=>{ box.hidden = !box.hidden; open.innerHTML = box.hidden ? '💡 Hint: teken het zelf in een assenstelsel' : 'Verberg het assenstelsel'; });
  F.clickable(p=>{
    if(s.mode==='P'){ const i = s.pts.findIndex(q=>ptEq(q,p)); if(i>=0) s.pts.splice(i,1); else s.pts.push(p); }
    else if(!s.start) s.start = p; else { if(!ptEq(s.start,p)) s.vecs.push([s.start, p]); s.start = null; }
    paint(); });
  paint();
}

/* --- 1. Bekijk hoe het werkt --- */
CO.kijk = { title:'Bekijk hoe het werkt', lvl:1, keep:true, noReset:true,
  instr:'Kies een transformatie en klik op <b>Bekijk de uitleg</b>. Sleep het punt <b>P</b> naar een andere plaats en kijk opnieuw: wat gebeurt er telkens met de coördinaten?',
  build:(b,st,save)=>{
    const K = [['sx','spiegelen om de x-as'],['sy','spiegelen om de y-as'],['sO','spiegelen om O'],['t','verschuiven over een vector']];
    if(!st.k) st.k = 'sx'; if(!st.P) st.P = [2,3];
    const pick = el('div','cf-pick'); b.append(pick);
    const btns = K.map(([k,l])=>{ const x = el('button','opt',l); x.type='button'; x.addEventListener('click', ()=>{ st.k=k; save(); paint(); reset(); }); pick.append(x); return [k,x]; });
    const F = coordFig(b, {maxw:420});
    const cap = el('div','cf-cap'); b.append(cap);
    const info = el('div','dyn-info'); info.style.textAlign='center'; b.append(info);
    const ctl = el('div','dyn-ctl'); b.append(ctl);
    const A = [-2,-3], B = [1,-1];
    let busy = false;
    const play = ctlBtn(icon('play')+' Bekijk de uitleg', async ()=>{ if(busy) return; busy = true; play.disabled = true; const ex = {A, B, An:'A', Bn:'B', dx:B[0]-A[0], dy:B[1]-A[1]};
      F.base = []; await animTrans(F, st.k, st.P, 'P', ex, cap); F.base = baseFor(); busy = false; play.disabled = false; });
    play.style.display='inline-flex'; play.style.alignItems='center'; play.style.gap='.3rem'; ctl.append(play);
    function baseFor(){ return st.k==='t' ? [{t:'arrow', a:A, b:B}, {t:'pt', p:A, n:'A', c:'orig', away:B}, {t:'pt', p:B, n:'B', c:'orig', away:A}] : []; }
    function img(){ return st.k==='t' ? [st.P[0]+B[0]-A[0], st.P[1]+B[1]-A[1]] : TRN[st.k].f(st.P[0], st.P[1]); }
    function paint(){ btns.forEach(([k,x])=>x.classList.toggle('chosen', k===st.k)); }
    function reset(){ F.token++; cap.innerHTML = ''; F.base = baseFor(); const Q = img(); const out = Math.abs(Q[0])>CR||Math.abs(Q[1])>CR; if(!busy) play.disabled = out;
      F.draw([{t:'pt', p:st.P, n:'P', c:'orig'}]);
      const nm = st.k==='t' ? `de verschuiving over ${vecN('A','B')}` : 'de '+TRN[st.k].naam;
      info.innerHTML = `${ptN('P', st.P[0], st.P[1])} &nbsp;→&nbsp; ${nm} &nbsp;→&nbsp; <b>${ptN('P'+PR, Q[0], Q[1])}</b>` + (out ? '<br><small>P′ valt buiten het rooster. Sleep P naar een andere plaats.</small>' : ''); }
    /* P verslepen (vastklikken op roosterpunten) */
    let drag = false;
    const toW = e => { const pt = F.svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const r = pt.matrixTransform(F.svg.getScreenCTM().inverse()); return [clamp(Math.round(r.x/CU),-CR,CR), clamp(Math.round(-r.y/CU),-CR,CR)]; };
    F.svg.addEventListener('pointerdown', e=>{ if(busy) return; const p = toW(e); if(Math.hypot(p[0]-st.P[0], p[1]-st.P[1])<=1.5){ drag = true; e.preventDefault(); try{ F.svg.setPointerCapture(e.pointerId); }catch(_){} } });
    F.svg.addEventListener('pointermove', e=>{ if(!drag) return; const p = toW(e); if(p[0]===st.P[0] && p[1]===st.P[1]) return; st.P = p; reset(); });
    const up = ()=>{ if(drag){ drag=false; save(); } }; F.svg.addEventListener('pointerup', up); F.svg.addEventListener('pointercancel', up);
    F.svg.style.cursor = 'grab';
    paint(); reset();
  }};

/* --- 2 tot 4. Stap voor stap spiegelen --- */
function spiegelStappen(k, title, lvl=1){
  return { title, lvl, instr:'Werk stap voor stap. Een nieuwe stap verschijnt als de vorige juist is.', build:(b,st,save)=>{
    const R = makeR(st); const T = TRN[k]; const Pn = R.pick(noLetters.split('')); const P = genP(R, k); const Q = T.f(P[0],P[1]);
    const two = el('div','cf-two'); b.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
    const F = coordFig(L, {maxw:400}); F.base = [{t:'pt', p:P, n:Pn, c:'orig'}]; F.draw([]);
    const cap = el('div','cf-cap'); L.append(cap);
    const ax = k==='sx' ? 'x-as' : k==='sy' ? 'y-as' : 'oorsprong O';
    const vraag = c => ({h:`Wat gebeurt er met de ${c}-coördinaat?`, choice:KEUZE, html2:`De ${c}-coördinaat ${c==='x'?neg(P[0]):neg(P[1])} wordt [[0]].`,
      check:(v,ch)=>{ const want = T['k'+c]; const val = c==='x' ? Q[0] : Q[1]; const n = parseInt2(v[0]); const okC = ch===want, okN = n===val;
        let msg = okC ? '' : (want==='blijft' ? `Bij een spiegeling om de ${ax} verandert de afstand tot de ${c}-as niet: de ${c}-coördinaat blijft.` : `Het beeld ligt aan de andere kant van de ${k==='sO'?'oorsprong':ax}: de ${c}-coördinaat verandert van teken.`);
        if(okC && !okN) msg = isNaN(n) ? 'Typ een geheel getal.' : (want==='blijft' ? 'Als de coördinaat hetzelfde blijft, schrijf je hetzelfde getal.' : 'Van teken veranderen: een positief getal wordt negatief, een negatief getal wordt positief.');
        return {ok:okC&&okN, choiceOk:okC, fields:[okN], msg}; }});
    const steps = [
      vraag('x'), vraag('y'),
      {h:`Noteer de coördinaat van het beeld ${Pn}${PR}.`, html:keepTxt(`${T.kort}(${Pn}) = ${Pn}${PR}([[0]], [[1]])`), check:v=>chkPt(v, Q, Pn+PR, 'Gebruik je antwoorden uit stap 1 en 2.'),
        after:()=>animTrans(F, k, P, Pn, {}, cap)}
    ];
    Rt.append(el('div','opg', `Spiegel het punt <b>${ptN(Pn,P[0],P[1])}</b> om de <b>${ax}</b>.<br>Dat noteer je als ${T.kort}(${Pn}) = ${Pn}${PR}.`));
    qSteps(Rt, st, save, 'st', {steps, end:`${T.kort}(${Pn}) = ${ptN(Pn+PR,Q[0],Q[1])}. Klik op <b>↺ Nieuwe opgave</b> voor een nieuw punt.`,
      restore:n=>{ if(n>=3) F.draw(finalObjs(k, P, Pn, {})); }});
  }};
}
CO.stapSx = spiegelStappen('sx','Stap voor stap: spiegelen om de x-as');
CO.stapSy = spiegelStappen('sy','Stap voor stap: spiegelen om de y-as');
CO.stapSO = spiegelStappen('sO','Stap voor stap: spiegelen om de oorsprong');

/* --- 5. Stap voor stap verschuiven --- */
function verschuifStappen(title, lvl=1){
  return { title, lvl, instr:'Werk stap voor stap. Je kijkt eerst wat er gebeurt van A naar B en doet daarna hetzelfde met het punt dat je verschuift. Kies telkens <b>+</b> of <b>−</b> en typ het getal.', build:(b,st,save)=>{
    const R = makeR(st); const g = genT(R, {noZero:true}); const [An,Bn,Pn] = ['A','B',R.pick('KLMNPRST'.split(''))];
    const {A,B,P,dx,dy} = g; const Q = [P[0]+dx, P[1]+dy];
    const two = el('div','cf-two'); b.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
    const F = coordFig(L, {maxw:400});
    const vb = [{t:'arrow', a:A, b:B}, {t:'pt', p:A, n:An, c:'orig', away:B}, {t:'pt', p:B, n:Bn, c:'orig', away:A}];
    F.base = vb.concat([{t:'pt', p:P, n:Pn, c:'orig'}]); F.draw([]);
    const cap = el('div','cf-cap'); L.append(cap);
    const ex = {A, B, An, Bn, dx, dy};
    Rt.append(el('div','opg', `Gegeven: ${ptN(An,A[0],A[1])} en ${ptN(Bn,B[0],B[1])}<br>Verschuif het punt <b>${ptN(Pn,P[0],P[1])}</b> over de vector ${vecN(An,Bn)}.`));
    const pmMsg = (r, c, from, to) => !r.sign ? `Kies bij de ${c}-coördinaat eerst <b>+</b> of <b>−</b>.` : `De ${c}-coördinaat gaat van ${neg(from)} naar ${neg(to)}: ${to>from?'er komt iets bij, dus +':'er gaat iets af, dus −'}. Tel de hokjes.`;
    const steps = [
      {h:`Wat gebeurt er van ${An} naar ${Bn}?`, block:true,
        html:`<div class="row"><b>${ptN(An,A[0],A[1])} &nbsp;→&nbsp; ${ptN(Bn,B[0],B[1])}</b></div><div class="row"><span class="lab">x-coördinaat:</span> ${neg(A[0])} [[0:pm]] = ${neg(B[0])}</div><div class="row"><span class="lab">y-coördinaat:</span> ${neg(A[1])} [[1:pm]] = ${neg(B[1])}</div>`,
        check:v=>{ const rx = chkPm(v[0], dx), ry = chkPm(v[1], dy); const ok = rx.ok && ry.ok;
          return {ok, fields:[rx.ok, ry.ok], msg: ok ? `Van ${An} naar ${Bn}: x ${sgnTxt(dx)} en y ${sgnTxt(dy)}.` : !rx.ok ? pmMsg(rx,'x',A[0],B[0]) : pmMsg(ry,'y',A[1],B[1])}; },
        after:()=>{ F.draw([{t:'arrow', a:A, b:[B[0],A[1]], c:'comp'}, {t:'arrow', a:[B[0],A[1]], b:B, c:'comp'}]); return Promise.resolve(); }},
      {h:`Doe hetzelfde met ${Pn}.`, block:true,
        html:`<div class="row"><span class="lab">x-coördinaat:</span> ${neg(P[0])} [[0:pm]] = [[1]]</div><div class="row"><span class="lab">y-coördinaat:</span> ${neg(P[1])} [[2:pm]] = [[3]]</div>`,
        check:v=>{ const rx = chkPm(v[0], dx), ry = chkPm(v[2], dy); const nx = parseInt2(v[1]), ny = parseInt2(v[3]);
          const f = [rx.ok, nx===Q[0], ry.ok, ny===Q[1]]; const ok = f.every(Boolean);
          let msg = '';
          if(!rx.ok || !ry.ok) msg = (!rx.sign || !ry.sign) ? 'Kies eerst + of −.' : `Doe met ${Pn} precies hetzelfde als van ${An} naar ${Bn}: x ${sgnTxt(dx)} en y ${sgnTxt(dy)}.`;
          else if(!ok) msg = 'De bewerking is juist. Reken ze nog eens uit, eventueel met de getallenas.';
          return {ok, fields:f, msg}; }},
      {h:`Noteer de coördinaat van het beeld ${Pn}${PR}.`, html:keepTxt(`t<sub>${vecN(An,Bn)}</sub>(${Pn}) = ${Pn}${PR}([[0]], [[1]])`), check:v=>chkPt(v, Q, Pn+PR, 'Gebruik je antwoorden uit stap 2.'),
        after:()=>{ F.base = []; return animTrans(F, 't', P, Pn, ex, cap).then(()=>{}); }}
    ];
    qSteps(Rt, st, save, 'st', {steps, end:`${ptN(Pn+PR,Q[0],Q[1])}. Van ${Pn} naar ${Pn}${PR} gebeurt precies hetzelfde als van ${An} naar ${Bn}.`,
      restore:n=>{ if(n>=3){ F.base = []; F.draw(vb.concat([{t:'pt', p:P, n:Pn, c:'orig'}], finalObjs('t', P, Pn, ex))); } else if(n>=1) F.draw([{t:'arrow', a:A, b:[B[0],A[1]], c:'comp'}, {t:'arrow', a:[B[0],A[1]], b:B, c:'comp'}]); }});
  }};
}
CO.stapT = verschuifStappen('Stap voor stap: verschuiven over een vector');
CO.stapT2 = verschuifStappen('Nog een keer verschuiven', 1);

/* --- 6. Oefenen met de tekening: enkel het beeld --- */
function oefenBeeld(kinds, title, n=3){
  return { title, lvl:2, instr:'Noteer de coördinaat van het beeld. Na het controleren zie je wat er gebeurt.', build:(b,st,save)=>{
    const R = makeR(st);
    const grid = el('div','cf-two'); b.append(grid);
    const letters = R.shuffle(noLetters.split(''));
    for(let i=0;i<n;i++){
      const k = kinds[i % kinds.length]; const box = el('div'); grid.append(box);
      const Pn = letters[i];
      if(k==='t'){
        const g = genT(R); const {A,B,P,dx,dy} = g; const Q = [P[0]+dx,P[1]+dy]; const ex = {A,B,An:'A',Bn:'B',dx,dy};
        const vb = [{t:'arrow', a:A, b:B}, {t:'pt', p:A, n:'A', c:'orig', away:B}, {t:'pt', p:B, n:'B', c:'orig', away:A}];
        const F = coordFig(box, {maxw:340}); F.base = vb.concat([{t:'pt', p:P, n:Pn, c:'orig'}]); F.draw([]);
        const cap = el('div','cf-cap'); box.append(cap);
        qBlock(box, st, save, 'q'+i, { nr:LET[i]+'.', block:true, html:`${ptN('A',A[0],A[1])}, ${ptN('B',B[0],B[1])} en ${ptN(Pn,P[0],P[1])}. Verschuif ${Pn} over ${vecN('A','B')}.<div class="row">Van A naar B: &nbsp;x [[0:pm]] &nbsp; y [[1:pm]]</div>t<sub>${vecN('A','B')}</sub>(${Pn}) = ${Pn}${PR}([[2:xs]], [[3:xs]])`,
          help:'Kies bij x en bij y + of − en typ hoeveel er bij komt of af gaat van A naar B.',
          check:v=>{ const rx = chkPm(v[0], dx), ry = chkPm(v[1], dy); const r = chkPt([v[2],v[3]], Q, Pn+PR);
            if(!rx.sign || !ry.sign) return {ok:false, fields:[rx.sign?null:false, ry.sign?null:false, null, null], msg:'Kies bij x en bij y eerst + of −.'};
            const f = [rx.ok, ry.ok, ...r.fields]; const ok = f.every(Boolean);
            let msg = (!f[0]||!f[1]) ? `Kijk van A naar B: x gaat van ${neg(A[0])} naar ${neg(B[0])} en y van ${neg(A[1])} naar ${neg(B[1])}. Gebruik + of −.` : r.msg;
            if(ok){ F.base = []; animTrans(F, 't', P, Pn, ex, cap); }
            return {ok, fields:f, msg}; },
          sol:`x: ${neg(A[0])} → ${neg(B[0])} is ${sgnTxt(dx)}, y: ${neg(A[1])} → ${neg(B[1])} is ${sgnTxt(dy)}.<br>${Pn}${PR}(${neg(P[0])} ${sgnTxt(dx)}, ${neg(P[1])} ${sgnTxt(dy)}) = <b>${ptN(Pn+PR,Q[0],Q[1])}</b>` });
      } else {
        const P = genP(R, k); const T = TRN[k]; const Q = T.f(P[0],P[1]);
        const F = coordFig(box, {maxw:340}); F.base = [{t:'pt', p:P, n:Pn, c:'orig'}]; F.draw([]);
        const cap = el('div','cf-cap'); box.append(cap);
        qBlock(box, st, save, 'q'+i, { nr:LET[i]+'.', block:true, html:`${ptN(Pn,P[0],P[1])}<br>${T.kort}(${Pn}) = ${Pn}${PR}([[0:xs]], [[1:xs]])`,
          help: k==='sx' ? 'Spiegelen om de x-as: x blijft, y verandert van teken.' : k==='sy' ? 'Spiegelen om de y-as: x verandert van teken, y blijft.' : 'Spiegelen om O: x en y veranderen allebei van teken.',
          check:v=>{ const r = chkPt(v, Q, Pn+PR); if(r.ok){ F.base = []; animTrans(F, k, P, Pn, {}, cap); } return r; },
          sol:`${ptN(Pn,P[0],P[1])} → ${T.naam} → <b>${ptN(Pn+PR,Q[0],Q[1])}</b>` });
      }
    }
  }};
}
CO.oefSpiegel = oefenBeeld(['sx','sy','sO','sy'], 'Spiegelen: noteer het beeld', 4);
CO.oefT = oefenBeeld(['t','t'], 'Verschuiven: noteer het beeld', 2);

/* --- 7. Zelf tekenen: P en P′ aanklikken --- */
CO.teken = { title:'Teken zelf het punt en zijn beeld', lvl:2, instr:'Kies <b>Zet het punt</b> of <b>Zet het beeld</b> en klik dan op het rooster. Klik op <b>Controleer</b> als beide punten staan.', build:(b,st,save)=>{
  const R = makeR(st); const k = R.pick(['sx','sy','sO','t']); const Pn = R.pick(noLetters.split(''));
  let P, Q, ex = {}, vb = [];
  if(k==='t'){ const g = genT(R); P = g.P; Q = [P[0]+g.dx, P[1]+g.dy]; ex = {A:g.A, B:g.B, An:'A', Bn:'B', dx:g.dx, dy:g.dy}; vb = [{t:'arrow', a:g.A, b:g.B}, {t:'pt', p:g.A, n:'A', c:'orig', away:g.B}, {t:'pt', p:g.B, n:'B', c:'orig', away:g.A}]; }
  else { P = genP(R, k); Q = TRN[k].f(P[0],P[1]); }
  const txt = k==='t' ? `Zet ${ptN(Pn,P[0],P[1])} en zijn beeld ${Pn}${PR} door de verschuiving over ${vecN('A','B')} met ${ptN('A',ex.A[0],ex.A[1])} en ${ptN('B',ex.B[0],ex.B[1])}.`
    : `Zet ${ptN(Pn,P[0],P[1])} en zijn beeld op het rooster: ${TRN[k].kort}(${Pn}) = ${Pn}${PR}.`;
  b.append(el('p','q-text block', txt));
  const s = st.m || (st.m = {mode:'P'});
  const pick = el('div','cf-pick'); b.append(pick);
  const bP = el('button','opt',`Zet het punt ${Pn}`), bQ = el('button','opt',`Zet het beeld ${Pn}${PR}`); [bP,bQ].forEach(x=>{ x.type='button'; pick.append(x); });
  const F = coordFig(b, {maxw:420}); F.base = vb;
  const cap = el('div','cf-cap'); b.append(cap);
  const paint = () => { bP.classList.toggle('chosen', s.mode==='P'); bQ.classList.toggle('chosen', s.mode==='Q');
    F.draw([s.P && {t:'pt', p:s.P, n:Pn, c:'mineP'}, s.Q && {t:'pt', p:s.Q, n:Pn+PR, c:'mine'}]); };
  bP.addEventListener('click', ()=>{ s.mode='P'; save(); paint(); }); bQ.addEventListener('click', ()=>{ s.mode='Q'; save(); paint(); });
  let locked = false;
  F.clickable(p=>{ if(locked) return; s[s.mode] = p; if(s.mode==='P' && !s.Q) s.mode = 'Q'; save(); paint(); });
  paint();
  qBlock(b, st, save, 'q', { html:'', allowEmpty:true,
    check:()=>{ if(!s.P || !s.Q) return {ok:false, info:true, msg:'Zet eerst allebei de punten op het rooster.'};
      const okP = s.P[0]===P[0] && s.P[1]===P[1], okQ = s.Q[0]===Q[0] && s.Q[1]===Q[1];
      if(okP && okQ){ locked = true; F.base = []; animTrans(F, k, P, Pn, ex, cap, vb.length?[]:[]); return {ok:true, msg:`${Pn}${PR} staat juist op ${co(Q[0],Q[1])}.`}; }
      if(!okP) return {ok:false, msg:`${Pn} staat niet juist. Eerst de x-coördinaat ${neg(P[0])} (horizontaal), dan de y-coördinaat ${neg(P[1])} (verticaal).`};
      return {ok:false, msg: k==='t' ? 'Het beeld staat niet juist. Doe met het punt hetzelfde als van A naar B: eerst horizontaal, dan verticaal.' : 'Het beeld staat niet juist. Welke coördinaat blijft en welke verandert van teken?'}; },
    sol:`${ptN(Pn,P[0],P[1])} en ${ptN(Pn+PR,Q[0],Q[1])}` });
}};

/* --- 8. Zonder tekening --- */
function zonderRows(R, kinds){
  const letters = R.shuffle(noLetters.split(''));
  return kinds.map((k,i)=>{ const Pn = letters[i]; const P = genP(R, k, {max:9}); const T = TRN[k]; const Q = T.f(P[0],P[1]); return {k, Pn, P, Q, T}; });
}
CO.zonder = { title:'Zonder tekening: spiegelen', lvl:2, instr:'Er is geen tekening. Denk aan de stappen: welke coördinaat blijft, welke verandert van teken? Na een fout antwoord kan je de tekening bekijken.', build:(b,st,save)=>{
  const R = makeR(st); const rows = zonderRows(R, R.shuffle(['sx','sx','sy','sy','sO','sO']));
  const tip = el('div','tip', icon('bulb') + '<div>Hier mogen de getallen groter zijn dan 6. De regel blijft dezelfde.</div>'); b.append(tip);
  kladblad(b);
  rows.forEach((r,i)=>{
    const host = el('div'); b.append(host);
    const res = qBlock(host, st, save, 'z'+i, { nr:LET[i]+'.', html:keepTxt(`${ptN(r.Pn, r.P[0], r.P[1])}    ${r.T.kort}(${r.Pn}) = ${r.Pn}${PR}([[0:xs]], [[1:xs]])`),
      check:v=>{ const c = chkPt(v, r.Q, r.Pn+PR, 'Welke coördinaat blijft en welke verandert van teken?'); return c; },
      sol:`${r.T.naam}: ` + (r.k==='sx' ? `x blijft ${neg(r.P[0])}, y wordt ${neg(r.Q[1])}` : r.k==='sy' ? `x wordt ${neg(r.Q[0])}, y blijft ${neg(r.P[1])}` : `x wordt ${neg(r.Q[0])} en y wordt ${neg(r.Q[1])}`) + `. Dus <b>${ptN(r.Pn+PR, r.Q[0], r.Q[1])}</b>.` });
  });
}};
CO.zonderT = { title:'Zonder tekening: verschuiven', lvl:2, instr:'Er is geen tekening. Kijk eerst wat er gebeurt van A naar B en doe dan hetzelfde met het punt.', build:(b,st,save)=>{
  const R = makeR(st); kladblad(b);
  for(let i=0;i<3;i++){
    let A, B, P; do{ A = [R.int(-8,8), R.int(-8,8)]; B = [A[0]+nz(R,1,7), A[1]+nz(R,1,7)]; P = [R.int(-8,8), R.int(-8,8)]; }while(Math.abs(B[0])>9 || Math.abs(B[1])>9 || Math.abs(P[0]+B[0]-A[0])>9 || Math.abs(P[1]+B[1]-A[1])>9);
    const dx = B[0]-A[0], dy = B[1]-A[1]; const Q = [P[0]+dx, P[1]+dy]; const Pn = 'KLMNPRS'[i+R.int(0,3)];
    qBlock(b, st, save, 't'+i, { nr:LET[i]+'.', block:true, html:`${ptN('A',A[0],A[1])}, ${ptN('B',B[0],B[1])} en ${ptN(Pn,P[0],P[1])}. Verschuif ${Pn} over ${vecN('A','B')}: t<sub>${vecN('A','B')}</sub>(${Pn}) = ${Pn}${PR}.`,
      html2:`<div class="step">Van A naar B: &nbsp;x [[0:pm]] &nbsp; y [[1:pm]]</div><div class="step"><span class="kt">t<sub>${vecN('A','B')}</sub>(${Pn}) = ${Pn}${PR}(</span>[[2:xs]]<span class="kt">, </span>[[3:xs]]<span class="kt">)</span></div>`, block2:true,
      help:'Kies bij x en bij y + of − en typ hoeveel er bij komt of af gaat van A naar B.',
      check:v=>{ const rx = chkPm(v[0], dx), ry = chkPm(v[1], dy); if(!rx.sign || !ry.sign) return {ok:false, msg:'Kies bij x en bij y eerst + of −.'};
        const r = chkPt([v[2],v[3]], Q, Pn+PR); const f = [rx.ok, ry.ok, ...r.fields]; const ok = f.every(Boolean);
        return {ok, fields:f, msg: (!f[0]||!f[1]) ? `x gaat van ${neg(A[0])} naar ${neg(B[0])}: hoeveel erbij of eraf? En y van ${neg(A[1])} naar ${neg(B[1])}?` : (ok?'':'Pas dezelfde bewerkingen toe op de coördinaten van '+Pn+'.')}; },
      sol:`x: ${neg(A[0])} → ${neg(B[0])} is ${sgnTxt(dx)} &nbsp; y: ${neg(A[1])} → ${neg(B[1])} is ${sgnTxt(dy)}<br>${Pn}${PR}(${neg(P[0])} ${sgnTxt(dx)}, ${neg(P[1])} ${sgnTxt(dy)}) = <b>${ptN(Pn+PR,Q[0],Q[1])}</b>` });
  }
}};
CO.mix = { title:'Alles door elkaar', lvl:2, instr:'Spiegelen en verschuiven door elkaar, zonder tekening.', build:(b,st,save)=>{
  const R = makeR(st); const kinds = R.shuffle(['sx','sy','sO','t','t','sx']);
  const letters = R.shuffle(noLetters.split(''));
  kinds.forEach((k,i)=>{
    const Pn = letters[i];
    if(k==='t'){ let A,B,P; do{ A=[R.int(-6,6),R.int(-6,6)]; B=[A[0]+nz(R,1,6), A[1]+nz(R,1,6)]; P=[R.int(-7,7),R.int(-7,7)]; }while(Math.abs(B[0])>8||Math.abs(B[1])>8);
      const Q = [P[0]+B[0]-A[0], P[1]+B[1]-A[1]];
      qBlock(b, st, save, 'm'+i, { nr:LET[i]+'.', html:keepTxt(`${ptN('A',A[0],A[1])}, ${ptN('B',B[0],B[1])}, ${ptN(Pn,P[0],P[1])}:   t<sub>${vecN('A','B')}</sub>(${Pn}) = ${Pn}${PR}([[0:xs]], [[1:xs]])`),
        check:v=>chkPt(v, Q, Pn+PR, 'Kijk eerst wat er gebeurt van A naar B.'), sol:`Van A naar B: x ${sgnTxt(B[0]-A[0])}, y ${sgnTxt(B[1]-A[1])}. Dus <b>${ptN(Pn+PR,Q[0],Q[1])}</b>.` });
    } else { const P = genP(R,k,{max:8}); const T = TRN[k]; const Q = T.f(P[0],P[1]);
      qBlock(b, st, save, 'm'+i, { nr:LET[i]+'.', html:keepTxt(`${ptN(Pn,P[0],P[1])}:   ${T.kort}(${Pn}) = ${Pn}${PR}([[0:xs]], [[1:xs]])`), check:v=>chkPt(v, Q, Pn+PR), sol:`${T.naam}: <b>${ptN(Pn+PR,Q[0],Q[1])}</b>` }); }
  });
}};

/* ============================================================
   VERDIEPING
   ============================================================ */
/* --- ontdek de regel --- */
CO.regel = { title:'Ontdek de regel', lvl:3, keep:true, instr:'Kies een transformatie. Sleep het punt <b>P</b> rond en kijk naar de coördinaten. Vul daarna de regel aan.', build:(b,st,save)=>{
  const K = [['sx','s<sub>x</sub>'],['sy','s<sub>y</sub>'],['sO','s<sub>O</sub>'],['r90','r(O, 90°)'],['rm90','r(O, −90°)'],['bis','spiegelen om de bissectrice']];
  if(!st.k) st.k = 'r90'; if(!st.P) st.P = [4,1];
  const pick = el('div','cf-pick'); b.append(pick);
  const btns = K.map(([k,l])=>{ const x = el('button','opt',l); x.type='button'; x.addEventListener('click', ()=>{ st.k=k; save(); redraw(); }); pick.append(x); return [k,x]; });
  const F = coordFig(b, {maxw:420});
  const info = el('div','dyn-info'); info.style.textAlign='center'; b.append(info);
  function redraw(){ btns.forEach(([k,x])=>x.classList.toggle('chosen', k===st.k)); const P = st.P, Q = TRN[st.k].f(P[0],P[1]);
    F.base = st.k==='bis' ? [BIS_LINE] : []; F.draw([{t:'pt', p:P, n:'P', c:'orig'}].concat(finalObjs(st.k, P, 'P', {})));
    info.innerHTML = `${TRN[st.k].kort}: &nbsp; ${ptN('P',P[0],P[1])} → <b>${ptN('P'+PR,Q[0],Q[1])}</b>`; }
  let drag = false;
  const toW = e => { const pt = F.svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const r = pt.matrixTransform(F.svg.getScreenCTM().inverse()); return [clamp(Math.round(r.x/CU),-CR,CR), clamp(Math.round(-r.y/CU),-CR,CR)]; };
  F.svg.addEventListener('pointerdown', e=>{ const p = toW(e); if(Math.hypot(p[0]-st.P[0], p[1]-st.P[1])<=1.5){ drag = true; e.preventDefault(); try{ F.svg.setPointerCapture(e.pointerId); }catch(_){} } });
  F.svg.addEventListener('pointermove', e=>{ if(!drag) return; const p = toW(e); if(p[0]===st.P[0] && p[1]===st.P[1]) return; st.P = p; redraw(); });
  const up = ()=>{ if(drag){ drag=false; save(); } }; F.svg.addEventListener('pointerup', up); F.svg.addEventListener('pointercancel', up);
  F.svg.style.cursor = 'grab'; redraw();
  const opts = ['x','−x','y','−y'];
  const want = {sx:['x','−y'], sy:['−x','y'], sO:['−x','−y'], r90:['−y','x'], rm90:['y','−x'], bis:['y','x']};
  const grid = el('div','tf-grid'); b.append(grid);
  ['sx','sy','sO','r90','rm90','bis'].forEach((k,i)=>{
    qBlock(grid, st, save, 'r'+i, { nr:LET[i]+'.', html:keepTxt(`${TRN[k].kort}:   (x, y) → ([[0:xs]], [[1:xs]])`), help:'Typ x, −x, y of −y.',
      check:v=>{ const nn = s => String(s).replace(/\s+/g,'').replace(/[−–]/g,'-').toLowerCase(); const w = want[k].map(nn); const f = [nn(v[0])===w[0], nn(v[1])===w[1]];
        const bad = v.some(x=>!/^-?[xy]$/.test(nn(x)));
        return bad ? {ok:false, msg:'Typ in elk vakje x, −x, y of −y.'} : {ok:f[0]&&f[1], fields:f, msg: f[0]&&f[1] ? '' : 'Probeer de regel uit met het punt in de figuur hierboven.'}; },
      sol:`${TRN[k].kort}: (x, y) → (${want[k].join(', ')})` });
  });
}};

/* --- stap voor stap draaien --- */
function draaiStappen(k, title){
  return { title, lvl:3, instr:'Werk stap voor stap.', build:(b,st,save)=>{
    const R = makeR(st); const Pn = R.pick(noLetters.split('')); const P = genP(R, k, {diff:true}); const Q = TRN[k].f(P[0],P[1]);
    const two = el('div','cf-two'); b.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
    const F = coordFig(L, {maxw:400}); F.base = [{t:'pt', p:P, n:Pn, c:'orig'}]; F.draw([]);
    const cap = el('div','cf-cap'); L.append(cap);
    const deg = k==='r90' ? '90°' : '−90°';
    Rt.append(el('div','opg', `Draai <b>${Pn}</b> rond de oorsprong O over <b>${deg}</b> (${k==='r90'?'tegenwijzerzin':'wijzerzin'}).<br>Dat noteer je als ${Pn}${PR} = ${TRN[k].kort}(${Pn}).`));
    const steps = [
      {h:`Lees de coördinaat van ${Pn} af.`, html:`${Pn}([[0]], [[1]])`, check:v=>chkPt(v, P, Pn)},
      {h:'Wissel de x- en de y-coördinaat van plaats.', html:`(${neg(P[1])} ? …) &nbsp;→&nbsp; ([[0]], [[1]])`.replace(`(${neg(P[1])} ? …) &nbsp;→&nbsp; `, ''), check:v=>chkPt(v, [P[1],P[0]], '', 'De y-coördinaat komt vooraan, de x-coördinaat achteraan.')},
      {h: k==='r90' ? 'Verander het teken van de <b>eerste</b> coördinaat (de nieuwe x).' : 'Verander het teken van de <b>tweede</b> coördinaat (de nieuwe y).', html:`${Pn}${PR}([[0]], [[1]])`,
        check:v=>chkPt(v, Q, Pn+PR, k==='r90' ? 'Enkel de eerste coördinaat verandert van teken.' : 'Enkel de tweede coördinaat verandert van teken.'), after:()=>animTrans(F, k, P, Pn, {}, cap)}
    ];
    qSteps(Rt, st, save, 'st', {steps, end:`${ptN(Pn+PR,Q[0],Q[1])}. Controleer op de tekening: |O${Pn}| = |O${Pn}${PR}| en de hoek is ${deg==='90°'?'90°':'90° in wijzerzin'}.`,
      restore:n=>{ if(n>=3) F.draw(finalObjs(k, P, Pn, {})); }});
  }};
}
CO.draai90 = draaiStappen('r90', 'Stap voor stap: draaien over 90°');
CO.draaiM90 = draaiStappen('rm90', 'Stap voor stap: draaien over −90°');
CO.draaiOef = { title:'Draaien rond O', lvl:3, instr:'Noteer de coördinaat van het beeld. Tip: wissel eerst de coördinaten van plaats.', build:(b,st,save)=>{
  const R = makeR(st); const kinds = R.shuffle(['r90','r90','rm90','rm90','r180']); const letters = R.shuffle(noLetters.split(''));
  kinds.forEach((k,i)=>{ const Pn = letters[i]; const P = genP(R,k,{diff:true}); const Q = TRN[k].f(P[0],P[1]);
    const host = el('div'); b.append(host);
    let F = null, cap = null;
    qBlock(host, st, save, 'd'+i, { nr:LET[i]+'.', html:keepTxt(`${ptN(Pn,P[0],P[1])}:   ${TRN[k].kort}(${Pn}) = ${Pn}${PR}([[0:xs]], [[1:xs]])`),
      check:v=>{ const r = chkPt(v, Q, Pn+PR, k==='r180' ? 'Over 180°: allebei de coördinaten veranderen van teken.' : 'Wissel eerst de coördinaten van plaats en verander dan één teken.');
        if(!r.ok && !F){ F = coordFig(host, {maxw:300}); cap = el('div','cf-cap'); host.append(cap); F.base = []; animTrans(F, k, P, Pn, {}, cap); }
        return r; },
      sol:`(x, y) → ${k==='r90'?'(−y, x)':k==='rm90'?'(y, −x)':'(−x, −y)'}, dus <b>${ptN(Pn+PR,Q[0],Q[1])}</b>` });
  });
}};

/* --- terugrekenen --- */
CO.terug = { title:'Terugrekenen: waar lag het punt?', lvl:3, instr:'Je kent het beeld en de transformatie. Zoek het oorspronkelijke punt.', build:(b,st,save)=>{
  const R = makeR(st); const letters = R.shuffle(noLetters.split(''));
  ['sx','sy','sO'].forEach((k,i)=>{ const Pn = letters[i]; const P = genP(R,k); const Q = TRN[k].f(P[0],P[1]);
    qBlock(b, st, save, 'b'+i, { nr:LET[i]+'.', html:keepTxt(`${TRN[k].kort}(${Pn}) = ${ptN(Pn+PR,Q[0],Q[1])}.   Dan is ${Pn}([[0:xs]], [[1:xs]]).`),
      check:v=>chkPt(v, P, Pn, 'Bij een spiegeling kan je gewoon terugspiegelen: dezelfde regel werkt ook terug.'), sol:`Spiegel ${Pn}${PR} terug: <b>${ptN(Pn,P[0],P[1])}</b>` });
  });
  for(let i=0;i<2;i++){ const Pn = letters[3+i]; let A,B,P; do{ A=[R.int(-5,5),R.int(-5,5)]; B=[A[0]+nz(R,1,5), A[1]+nz(R,1,5)]; P=[R.int(-5,5),R.int(-5,5)]; }while(Math.abs(B[0])>6||Math.abs(B[1])>6);
    const dx=B[0]-A[0], dy=B[1]-A[1]; const Q=[P[0]+dx,P[1]+dy];
    qBlock(b, st, save, 'bt'+i, { nr:LET[3+i]+'.', html:`${ptN('A',A[0],A[1])} en ${ptN('B',B[0],B[1])}. ${Pn}${PR} is het beeld van ${Pn} door de verschuiving over ${vecN('A','B')}, met ${ptN(Pn+PR,Q[0],Q[1])}. &nbsp; Dan is ${Pn}([[0:xs]], [[1:xs]]).`,
      check:v=>{ const r = chkPt(v, P, Pn, 'Je moet terug: doe het omgekeerde van wat er gebeurt van A naar B.'); const a = parseInt2(v[0]), c = parseInt2(v[1]);
        if(!r.ok && a===Q[0]+dx && c===Q[1]+dy) r.msg = 'Je hebt nog eens verschoven. Je moet terug: doe het omgekeerde, dus van B naar A.'; return r; },
      sol:`Van A naar B: x ${sgnTxt(dx)}, y ${sgnTxt(dy)}. Terug doe je het omgekeerde: ${neg(Q[0])} ${sgnTxt(-dx)} = ${neg(P[0])} en ${neg(Q[1])} ${sgnTxt(-dy)} = ${neg(P[1])}. Dus <b>${ptN(Pn,P[0],P[1])}</b>.` });
  }
}};

/* --- welke transformatie? --- */
CO.welke = { title:'Welke transformatie?', lvl:3, instr:'Het punt en zijn beeld zijn gegeven. Welke transformatie werd er gebruikt? Er is telkens één juist antwoord.', build:(b,st,save)=>{
  const R = makeR(st); const letters = R.shuffle(noLetters.split(''));
  const ALL = ['sx','sy','sO','r90','rm90'];
  R.shuffle(ALL).slice(0,4).forEach((k,i)=>{
    let P, Q; for(let t=0;t<100;t++){ P = genP(R,k,{diff:true}); Q = TRN[k].f(P[0],P[1]); const hits = ALL.filter(j=>{ const z = TRN[j].f(P[0],P[1]); return z[0]===Q[0] && z[1]===Q[1]; }); if(hits.length===1) break; }
    const Pn = letters[i];
    const host = el('div'); b.append(host);
    qChoice(host, st, save, 'w'+i, { nr:LET[i]+'.', html:`${ptN(Pn,P[0],P[1])} &nbsp;→&nbsp; ${ptN(Pn+PR,Q[0],Q[1])}`, opts:ALL.map(j=>[j, TRN[j].kort]), ans:k, sym:true,
      why:`Juist: ${TRN[k].naam}.`, whyBad:'Kijk welke coördinaat van teken verandert en of de coördinaten van plaats wisselen.' });
  });
}};

/* ============================================================
   ONDERDELEN
   ============================================================ */
ICONS.coord = '<path d="M4 20h17M4 20V3"/><path d="M19 18l2 2-2 2M2 5l2-2 2 2" /><circle cx="15" cy="8" r="1.6" fill="currentColor"/><circle cx="9" cy="14" r="1.6" fill="currentColor"/><path d="M10.4 12.6l3.2-3.2" stroke-dasharray="1.4 1.2"/>';
const SEC = {};
SEC.coord = { id:'coord', ic:'coord', nav:'Coördinaten', title:'Transformaties met coördinaten',
  tip:'Een punt noteer je als <b>P(x, y)</b>: eerst de <b>x-coördinaat</b> (hoeveel naar links of rechts), dan de <b>y-coördinaat</b> (hoeveel naar boven of beneden).',
  cheat:`<h3>Spiekbriefje · coördinaten</h3><table>
    <tr><td>spiegeling om de x-as &nbsp; s<sub>x</sub></td><td>x blijft, y verandert van teken<br>(3, 2) → (3, −2)</td></tr>
    <tr><td>spiegeling om de y-as &nbsp; s<sub>y</sub></td><td>x verandert van teken, y blijft<br>(3, 2) → (−3, 2)</td></tr>
    <tr><td>spiegeling om O &nbsp; s<sub>O</sub></td><td>x en y veranderen van teken<br>(3, 2) → (−3, −2)</td></tr>
    <tr><td>verschuiving over ${vecN('A','B')}</td><td>Kijk wat er gebeurt van A naar B met x en met y.<br>Doe hetzelfde met het punt.<br>A(1, 4), B(5, 1): x + 4, y − 3<br>P(−3, 2) → P′(−3 + 4, 2 − 3) = P′(1, −1)</td></tr>
  </table>`,
  cards:[CO.kijk, CO.stapSx, CO.stapSy, CO.stapSO, CO.stapT, CO.stapT2, CO.oefSpiegel, CO.oefT, CO.teken, CO.zonder, CO.zonderT, CO.mix,
         CO.regel, CO.draai90, CO.draaiM90, CO.draaiOef, CO.terug, CO.welke] };


/* ============================================================
   DEEL 2: ALGEMENE BOUWSTENEN VOOR DE ANDERE ONDERDELEN
   (rooster met willekeurig bereik, transformaties, klikoefeningen,
   sorteren, waar of niet waar, symmetrieassen, ruimtefiguren)
   ============================================================ */
(function(){
  const css = `
  /* knoppen: niet gekozen = turkoois, gekozen = volledig oranje */
  .opt:not(.good):not(.wrong), .err-line:not(.found):not(.nope), .tab{ --el:var(--tq) !important; --er:var(--tq) !important; --fill:var(--card) !important; box-shadow:none !important; }
  .opt:not(.good):not(.wrong):hover, .err-line:not(.found):not(.nope):hover, .tab:hover{ --fill:var(--tq-soft) !important; color:var(--ink); }
  .opt.chosen:not(.good):not(.wrong), .err-line.picked, .tab[aria-selected="true"], .tab:last-child[aria-selected="true"]{ --el:var(--orange) !important; --er:var(--orange) !important; --fill:var(--orange) !important; color:#173436 !important; box-shadow:none !important; }
  .opt.chosen.good, .opt.chosen.wrong, .opt.good, .opt.wrong{ box-shadow:none !important; }
  .opt.good{ border-color:var(--ok) !important; background:var(--ok-bg) !important; color:var(--ok) !important; }
  .opt.wrong{ border-color:var(--bad) !important; background:var(--bad-bg) !important; color:var(--bad) !important; }
  .chip.chip-sel{ box-shadow:none; --el:var(--orange) !important; --er:var(--orange) !important; --fill:var(--orange) !important; color:#173436; }
  .cf polygon.orig, .cf path.orig{ fill:var(--accent); fill-opacity:.18; stroke:var(--accent-dark); stroke-width:.6; stroke-linejoin:round }
  .cf polygon.img, .cf path.img{ fill:var(--orange); fill-opacity:.28; stroke:var(--ink); stroke-width:.55; stroke-linejoin:round }
  .cf polygon.mine, .cf polyline.mine{ fill:var(--orange); fill-opacity:.14; stroke:var(--orange); stroke-width:.55; stroke-dasharray:1.6 1 }
  .cf polygon.ghost, .cf polyline.ghost{ fill:var(--orange); fill-opacity:.12; stroke:var(--orange); stroke-width:.5; stroke-dasharray:1.2 1 }
  .cf polyline.orig{ fill:none; stroke:var(--accent-dark); stroke-width:.7; stroke-linejoin:round }
  .cf polyline.img{ fill:none; stroke:var(--orange); stroke-width:.7; stroke-linejoin:round }
  .cf polygon.soft{ fill:var(--ink-soft); fill-opacity:.12; stroke:var(--ink-soft); stroke-width:.45 }
  .cf .axisL{ stroke:var(--ink); stroke-width:.7 }
  .cf .axisL.hl{ stroke:var(--orange); stroke-width:.9 }
  .cf .cand{ stroke:var(--ink-soft); stroke-width:.5; stroke-dasharray:1.6 1.2; cursor:pointer }
  .cf .cand.on{ stroke:var(--accent-dark); stroke-width:.9; stroke-dasharray:none }
  .cf .cand.ok{ stroke:var(--ok); stroke-width:.9; stroke-dasharray:none }
  .cf .cand.bad{ stroke:var(--bad); stroke-width:.9 }
  .cf .candhit{ stroke:transparent; stroke-width:4; cursor:pointer }
  .cf .bad{ fill:none; stroke:var(--bad); stroke-width:.6 }
  .cf .cpt{ fill:var(--ink) }
  .cf .lbl.cen{ fill:var(--ink) }
  .cf .lattice{ fill:var(--ink-soft) }
  .cf .lbl.sm{ font-size:4.8px }
  .cf image{ pointer-events:none }
  .cf .rim{ fill:none; stroke:var(--ink-soft); stroke-width:.4; stroke-dasharray:1.2 1 }
  .cf .solid{ fill:none; stroke:var(--ink); stroke-width:.6; stroke-linejoin:round }
  .cf .hidden3{ fill:none; stroke:var(--ink-soft); stroke-width:.45; stroke-dasharray:1.4 1.1 }
  .cf .plane{ fill:var(--orange); fill-opacity:.38; stroke:var(--orange); stroke-width:.5 }
  .cf .face{ fill:var(--accent); fill-opacity:.08; stroke:none }
  .pick-pts{ display:flex; flex-wrap:wrap; gap:.35rem; align-items:center; justify-content:center; margin:.35rem 0 }
  .pick-pts .lab{ font-weight:700; margin-right:.2rem }
  .pair-grid{ display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:1rem }
  @media (max-width:760px){ .pair-grid{ grid-template-columns:1fr } }
  .bins{ display:grid; grid-template-columns:repeat(auto-fit, minmax(170px,1fr)); gap:.6rem; margin-top:.4rem }
  .bin{ border:2px dashed var(--tq); border-radius:.7rem; padding:.45rem; min-height:5.5rem; background:var(--zone-bg); display:flex; flex-direction:column; gap:.35rem; cursor:pointer }
  .bin:hover{ border-color:var(--orange) }
  .bin > b{ font-size:.86rem; color:var(--accent-dark) }
  .bin .chip{ align-self:flex-start }
  .photo-q img{ display:block; max-width:100%; width:260px; height:auto; border-radius:.5rem; border:2px solid var(--tq); margin:.3rem 0 }
  .wn .q-text{ flex:1 1 18rem }
  .notat{ font-size:1.12rem }
  .notat .inp{ text-align:center }
  .sym-row{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:1rem }
  .draai-fig{ display:block; width:100%; max-width:300px; margin:.3rem auto }
  .sp-fig{ display:block; width:100%; max-width:260px; margin:.3rem auto }
  .lg{ font-size:1.08rem }
  .mini-note{ font-size:.86rem; color:var(--ink-soft) }
  .kt{ white-space:pre-wrap }
  .sym-row .choices .step-lab{ flex-basis:100% }
  .cf .seg{ stroke:var(--accent-dark); stroke-width:.7; fill:none }
  .cf .seg.img{ stroke:var(--orange) }
  .cf .seg.hl{ stroke-width:1.3 }
  .cf .tri{ stroke:var(--border); stroke-width:.45 }
  .cf .latline{ stroke:var(--ink-soft); stroke-width:.4 }
  .cf .latline.ax{ stroke:var(--accent-dark); stroke-width:.5 }
  .cf polygon.fill{ fill:var(--accent); fill-opacity:.35; stroke:var(--accent-dark); stroke-width:.6 }
  .cf polygon.fill.img{ fill:var(--orange); fill-opacity:.35; stroke:var(--ink) }
  .cf .ghost3{ fill:none; stroke:var(--orange); stroke-width:.6; stroke-dasharray:1.4 1 }
  .symb-row{ display:flex; flex-wrap:wrap; align-items:center; gap:.25rem; font-size:1.12rem; margin:.35rem 0 }
  .symb-row .inp{ text-align:center }
  .vec-in{ position:relative; display:inline-block; padding-top:.35em }
  .vec-in > i{ position:absolute; left:.2em; right:.2em; top:0; height:.42em; display:block }
  .vec-in > i svg{ display:block; width:100%; height:100%; overflow:visible }
  .vec-in > i path{ fill:none; stroke:currentColor; stroke-width:1.3; vector-effect:non-scaling-stroke }
  .word-mir{ display:block; max-width:170px; width:100%; height:auto }
  .let-chip{ font:700 1.6rem/1 Arial, Helvetica, sans-serif; letter-spacing:0 }
  .cf.mini-fig{ display:inline-block; width:64px; height:auto; vertical-align:middle; margin:0 .4rem 0 0 }
  .sp-row{ display:grid; grid-template-columns:repeat(auto-fit, minmax(200px,1fr)); gap:1rem; align-items:start }
  /* namen van rechten en assen: kleine letter, goed leesbaar */
  .cf .lbl.axn{ fill:var(--ink); font-size:5.6px; font-weight:700; font-style:normal }
  /* hints in twee stappen (zoals de oorspronkelijke site) */
  .cf{ --hint:#c25e00 }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .cf{ --hint:#ffb35c } }
  :root[data-theme="dark"] .cf{ --hint:#ffb35c }
  .cf .hintl{ stroke:var(--hint); stroke-width:.6; stroke-dasharray:1.6 1.1; fill:none }
  .cf .hintl.soft{ opacity:.7 }
  .cf .hintl.solid{ stroke-dasharray:none }
  .cf .hintlh{ fill:var(--hint) }
  .cf .hintm{ stroke:var(--hint); stroke-width:.5; fill:none }
  .cf .hintring{ fill:var(--or-soft); fill-opacity:.55; stroke:var(--hint); stroke-width:.55; stroke-dasharray:1 .8 }
  .cf .lbl.hint{ fill:var(--hint); font-size:5.4px }
  .hintbar{ display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; margin:.35rem 0 }
  .hintbtn{ font:inherit; font-size:.95rem; font-weight:700; display:inline-flex; align-items:center; gap:.3rem; padding:.3rem .75rem; border-radius:.6rem; border:1.5px solid var(--or-line); background:var(--or-soft); color:var(--ink); cursor:pointer }
  .hintbtn:hover:not(:disabled){ border-color:var(--orange) }
  .hintbtn:disabled{ opacity:.55; cursor:default }
  .hintbtn.off{ background:var(--card); border-color:var(--border); font-weight:400 }
  .hintinfo{ font-size:.9rem; color:var(--ink-soft) }
  .hint-txt{ font-size:.98rem; padding:.35rem .6rem; border-left:3px solid var(--orange); background:var(--or-soft); border-radius:0 .5rem .5rem 0; margin:.3rem 0 }
  .hint-txt:empty{ display:none }
  .klad{ margin:.4rem 0 .8rem } .klad-box{ margin-top:.4rem } .klad-info{ font-size:.92rem; color:var(--ink-soft); text-align:center; margin:.2rem 0 }

  /* tabel met tekeningen */
  .tb-grid{ display:grid; grid-template-columns:minmax(7.4rem,.7fr) repeat(4, minmax(135px,1fr)); gap:.35rem; min-width:660px; align-items:stretch }
  .tb-slot{ min-height:3rem; display:flex; align-items:center; justify-content:center; padding:.3rem; border-radius:.6rem; text-align:center }
  .tb-slot .chip{ margin:0 }
  .tb-ph{ color:var(--ink-soft); font-size:.88rem; font-style:italic }
  .tb-slot.tb-good{ border-color:var(--ok) !important; background:var(--ok-bg) }
  .tb-slot.tb-bad{ border-color:var(--bad) !important; background:var(--bad-bg) }
  .tb-cell{ border:1px solid var(--border); border-radius:.6rem; padding:.2rem; display:flex; align-items:center; justify-content:center; background:var(--card) }
  .tb-cell svg{ width:100% }
  .tb-cell .cf .lbl{ font-size:8px } .tb-cell .cf .lbl.help{ font-size:7.4px } .tb-cell .cf .lbl.axn{ font-size:8.4px }
  .tb-cell .cf .seg, .tb-cell .cf polygon, .tb-cell .cf .axisL{ stroke-width:.9 }
  .tb-pool{ margin-bottom:.5rem }
  /* eigenschappentabel */
  .tab-wrap{ overflow-x:auto; margin:.4rem 0 }
  .eig-tab{ border-collapse:separate; border-spacing:.3rem; min-width:620px; width:100% }
  .eig-tab th{ font-size:.92rem; text-align:left; color:var(--accent-dark); font-weight:700; padding:.2rem .3rem }
  .eig-tab thead th{ text-align:center; font-size:.86rem }
  .cell-btn{ font:inherit; font-size:.92rem; width:100%; min-height:2.2rem; border-radius:.55rem; border:1.5px solid var(--tq); background:var(--card); color:var(--ink); cursor:pointer }
  .cell-btn.on{ border-color:var(--orange); background:var(--orange); color:#173436; font-weight:700 }
  .cell-btn.good{ border-color:var(--ok); background:var(--ok-bg); color:var(--ok) }
  .cell-btn.wrong{ border-color:var(--bad); background:var(--bad-bg); color:var(--bad) }
  .cheat table.eig-sum td, .cheat table.eig-sum th{ text-align:center; padding:.15rem .3rem }
  .cheat table.eig-sum td:first-child{ text-align:left }
  /* uitleg bij animaties: elke stap blijft staan */
  .cap-steps{ margin:0; padding-left:1.35rem; display:flex; flex-direction:column; gap:.2rem }
  .cap-steps li{ animation:capin .35s ease both }
  .cap-steps li:last-child{ font-weight:700 }
  @keyframes capin{ from{ opacity:0; transform:translateY(3px) } to{ opacity:1; transform:none } }
  @media (prefers-reduced-motion: reduce){ .cap-steps li{ animation:none } }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* ---------- transformaties in wereldcoördinaten (y naar boven) ----------
   op: {t:'s', p, q}  spiegeling om de rechte pq
       {t:'t', v}     translatie over v
       {t:'r', c, deg} rotatie rond c (positief = tegenwijzerzin)
       {t:'p', c}     spiegeling om het punt c */
const r6 = x => { const y = Math.round(x*1e6)/1e6; return y===0 ? 0 : y; };
const ptEq = (a,b,tol=1e-6) => !!a && !!b && Math.abs(a[0]-b[0])<tol && Math.abs(a[1]-b[1])<tol;
function rotPt(P, C, deg){ const a = deg*D2R, c = Math.cos(a), s = Math.sin(a), dx = P[0]-C[0], dy = P[1]-C[1]; return [r6(C[0]+c*dx-s*dy), r6(C[1]+s*dx+c*dy)]; }
function reflPt(P, A, B){ const dx = B[0]-A[0], dy = B[1]-A[1], L = dx*dx+dy*dy; const t = ((P[0]-A[0])*dx + (P[1]-A[1])*dy)/L; const F = [A[0]+t*dx, A[1]+t*dy]; return [r6(2*F[0]-P[0]), r6(2*F[1]-P[1])]; }
function footPt(P, A, B){ const dx = B[0]-A[0], dy = B[1]-A[1], L = dx*dx+dy*dy; const t = ((P[0]-A[0])*dx + (P[1]-A[1])*dy)/L; return [r6(A[0]+t*dx), r6(A[1]+t*dy)]; }
function applyOp(P, op){
  switch(op.t){
    case 's': return reflPt(P, op.p, op.q);
    case 't': return [r6(P[0]+op.v[0]), r6(P[1]+op.v[1])];
    case 'r': return rotPt(P, op.c, op.deg);
    case 'p': return [r6(2*op.c[0]-P[0]), r6(2*op.c[1]-P[1])];
  }
  return P;
}
/* tussenstand van de beweging (t van 0 tot 1) */
function opAt(P, op, t){
  if(op.t==='r') return rotPt(P, op.c, op.deg*t);
  if(op.t==='t') return [P[0]+op.v[0]*t, P[1]+op.v[1]*t];
  const Q = applyOp(P, op); return [P[0]+(Q[0]-P[0])*t, P[1]+(Q[1]-P[1])*t];
}
/* affiene matrix [a,b,c,d,e,f]: x' = a x + b y + e, y' = c x + d y + f */
function opMatAt(op, t){
  if(op.t==='r'){ const a = op.deg*t*D2R, co = Math.cos(a), si = Math.sin(a); const C = op.c; return [co, -si, si, co, C[0]-co*C[0]+si*C[1], C[1]-si*C[0]-co*C[1]]; }
  if(op.t==='t') return [1,0,0,1, op.v[0]*t, op.v[1]*t];
  /* spiegelingen: lineair tussen identiteit en eindmatrix (klapt om) */
  const O = applyOp([0,0], op), X1 = applyOp([1,0], op), Y1 = applyOp([0,1], op);
  const M = [X1[0]-O[0], Y1[0]-O[0], X1[1]-O[1], Y1[1]-O[1], O[0], O[1]];
  const I = [1,0,0,1,0,0]; return I.map((v,i)=>v+(M[i]-v)*t);
}
/* wereldmatrix naar SVG-transform (svg-y = −wereld-y) */
function svgMat(m){ const [a,b,c,d,e,f] = m; return `matrix(${f2(a)} ${f2(-c)} ${f2(-b)} ${f2(d)} ${f2(e*CU)} ${f2(-f*CU)})`; }
const opName = op => op.t==='s' ? 'spiegeling om een as' : op.t==='t' ? 'translatie over een vector' : op.t==='r' ? 'rotatie rond een centrum' : 'spiegeling om een punt';
const degTxt = d => (d<0 ? '−'+(-d) : d) + '°';
const zinTxt = d => d>0 ? 'tegenwijzerzin' : 'wijzerzin';
const angN = d => ((d%360)+360)%360;          /* 0..360 */
const angEq = (a,b) => Math.abs(((a-b)%360+540)%360-180) < 1e-6;
function parseAng(s){ const t = String(s).replace(/\s+/g,'').replace(/[−–]/g,'-').replace(/°$/,'').replace(',', '.'); if(!/^[+-]?\d+(\.\d+)?$/.test(t)) return NaN; return Number(t); }

/* ============================================================
   ROOSTER MET WILLEKEURIG BEREIK: g = [x0, x1, y0, y1]
   ============================================================ */
function gridBase(g, o={}){
  const [x0,x1,y0,y1] = g; let s = '';
  const vx = X(x0)-5, vy = Y(y1)-5, vw = (x1-x0)*CU+10, vh = (y1-y0)*CU+10;
  s += `<rect class="bg" x="${f2(vx-8)}" y="${f2(vy-8)}" width="${f2(vw+16)}" height="${f2(vh+16)}"/>`;
  if(o.lattice){ for(let x=x0;x<=x1;x++) for(let y=y0;y<=y1;y++) s += `<circle class="lattice" cx="${X(x)}" cy="${Y(y)}" r=".55"/>`; }
  else if(!o.plain){ for(let x=x0;x<=x1;x++) s += `<line class="grid" x1="${X(x)}" y1="${Y(y0)}" x2="${X(x)}" y2="${Y(y1)}"/>`;
    for(let y=y0;y<=y1;y++) s += `<line class="grid" x1="${X(x0)}" y1="${Y(y)}" x2="${X(x1)}" y2="${Y(y)}"/>`; }
  if(o.axes){
    s += `<line class="axis" x1="${X(x0-.3)}" y1="0" x2="${X(x1+.5)}" y2="0"/><line class="axis" x1="0" y1="${Y(y0-.3)}" x2="0" y2="${Y(y1+.5)}"/>`;
    s += `<path class="axhead" d="M${X(x1+.85)} 0 l-3.2 -1.6 v3.2z"/><path class="axhead" d="M0 ${Y(y1+.85)} l-1.6 3.2 h3.2z"/>`;
    s += `<text class="axl" x="${X(x1+.55)}" y="5">x</text><text class="axl" x="2.2" y="${Y(y1+.55)}">y</text>`;
    for(let k=x0;k<=x1;k++){ if(!k) continue; s += `<line class="axis" x1="${X(k)}" y1="-.9" x2="${X(k)}" y2=".9"/><text class="num" x="${X(k)}" y="4.4" text-anchor="middle">${neg(k)}</text>`; }
    for(let k=y0;k<=y1;k++){ if(!k) continue; s += `<line class="axis" x1="-.9" y1="${Y(k)}" x2=".9" y2="${Y(k)}"/><text class="num" x="-1.6" y="${f2(Y(k)+1.2)}" text-anchor="end">${neg(k)}</text>`; }
    s += `<text class="num" x="-1.6" y="4.4" text-anchor="end">O</text>`;
  }
  return {s, vb:[vx - (o.axes?2:0), vy - (o.axes?3:0), vw + (o.axes?7:0), vh + (o.axes?6:0)]};
}
/* label bij een punt, weg van 'away' en binnen het rooster */
function lblAt(p, away, g){
  let dx = p[0] - (away? away[0]:p[0]-1), dy = p[1] - (away? away[1]:p[1]-1);
  if(Math.abs(dx)<1e-9 && Math.abs(dy)<1e-9){ dx = 1; dy = 1; }
  const L = Math.hypot(dx,dy); dx/=L; dy/=L;
  if(Math.abs(dx)<.35) dx = .6*(dx>=0?1:-1); if(Math.abs(dy)<.35) dy = .6*(dy>=0?1:-1);
  if(g){ if(p[0]>=g[1]-.6 && dx>0) dx = -Math.abs(dx); if(p[0]<=g[0]+.6 && dx<0) dx = Math.abs(dx);
    if(p[1]>=g[3]-.6 && dy>0) dy = -Math.abs(dy); if(p[1]<=g[2]+.6 && dy<0) dy = Math.abs(dy); }
  return {lx: X(p[0]) + dx*4.2, ly: Y(p[1]) - dy*4.2 + 1.7, anchor: dx>0.2 ? 'start' : dx<-0.2 ? 'end' : 'middle'};
}
const centroid = pts => [pts.reduce((s,p)=>s+p[0],0)/pts.length, pts.reduce((s,p)=>s+p[1],0)/pts.length];
/* rechte door a en b tot aan de rand van het rooster */
function clipG(a, b, g, ext=.4){
  const d = [b[0]-a[0], b[1]-a[1]]; const ts = [];
  const xs = [g[0]-ext, g[1]+ext], ys = [g[2]-ext, g[3]+ext];
  if(Math.abs(d[0])>1e-9) xs.forEach(x=>{ const t=(x-a[0])/d[0]; const y=a[1]+t*d[1]; if(y>=ys[0]-1e-6 && y<=ys[1]+1e-6) ts.push(t); });
  if(Math.abs(d[1])>1e-9) ys.forEach(y=>{ const t=(y-a[1])/d[1]; const x=a[0]+t*d[0]; if(x>=xs[0]-1e-6 && x<=xs[1]+1e-6) ts.push(t); });
  if(ts.length<2) return [a,b];
  const t0 = Math.min(...ts), t1 = Math.max(...ts); return [[a[0]+t0*d[0], a[1]+t0*d[1]], [a[0]+t1*d[0], a[1]+t1*d[1]]];
}
/* objecten op het rooster:
   {t:'pt', p, n, c, away}  {t:'poly', pts, c, names, open}  {t:'axis', p, q, n, hl}  {t:'cen', p, n}
   {t:'img', href, box:[x,y,w,h], m (matrix), op}  {t:'arcC', c, r, a0, a1, cls}  {t:'right', v, d1, d2}
   {t:'ticks', a, b, n}  + de types van cfObjs (line, arrow, txt, raw) */
function gObjs(objs, g){
  let s = '', top = '';
  objs.filter(Boolean).forEach(o=>{
    if(o.t==='poly'){
      const pts = o.pts.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ');
      s += o.open ? `<polyline class="${o.c||'orig'}" points="${pts}"/>` : `<polygon class="${o.c||'orig'}" points="${pts}"/>`;
      if(o.names){ const C = o.away || centroid(o.pts); o.pts.forEach((p,i)=>{ if(!o.names[i]) return; const L = lblAt(p, C, g); top += `<circle class="${o.c==='orig'||!o.c?'orig':'img'}" cx="${X(p[0])}" cy="${Y(p[1])}" r="1.1"/><text class="lbl ${o.c==='orig'||!o.c?'orig':'img'}" x="${f2(L.lx)}" y="${f2(L.ly)}" text-anchor="${L.anchor}">${o.names[i]}</text>`; }); }
    }
    else if(o.t==='axis'){ const [a,b] = clipG(o.p, o.q, g, o.ext!=null?o.ext:.4); s += `<line class="axisL${o.hl?' hl':''}" x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}"/>`;
      if(o.n){ const e = (o.nAt==='start') ? a : b; const d = [b[0]-a[0], b[1]-a[1]]; const L = Math.hypot(d[0],d[1]); const u = [d[0]/L, d[1]/L]; const w = o.nAt==='start' ? [-u[0],-u[1]] : u; const off = [-u[1], u[0]];
        const pp = [e[0] - w[0]*.7 + off[0]*.75, e[1] - w[1]*.7 + off[1]*.75]; top += `<text class="lbl axn" x="${X(pp[0])}" y="${f2(Y(pp[1])+1.9)}" text-anchor="middle">${o.n}</text>`; } }
    else if(o.t==='cen'){ top += `<circle class="cpt" cx="${X(o.p[0])}" cy="${Y(o.p[1])}" r="1.2"/>`; if(o.n){ const L = lblAt(o.p, o.away, g); top += `<text class="lbl cen" x="${f2(L.lx)}" y="${f2(L.ly)}" text-anchor="${L.anchor}">${o.n}</text>`; } }
    else if(o.t==='img'){ const [x,y,w,h] = o.box; const m = o.m || (o.op ? opMatAt(o.op, o.tt==null?1:o.tt) : null);
      s += `<image href="${o.href}" x="${X(x)}" y="${Y(y+h)}" width="${f2(w*CU)}" height="${f2(h*CU)}" preserveAspectRatio="xMidYMid meet"${m?` transform="${svgMat(m)}"`:''}${o.op2?` opacity="${o.op2}"`:''}/>`; }
    else if(o.t==='arcC'){ const r = o.r*CU; const a0 = o.a0*D2R, a1 = o.a1*D2R; if(Math.abs(o.a1-o.a0)<.5) return;
      const p0 = [X(o.c[0])+r*Math.cos(a0), Y(o.c[1])-r*Math.sin(a0)], p1 = [X(o.c[0])+r*Math.cos(a1), Y(o.c[1])-r*Math.sin(a1)];
      const large = Math.abs(o.a1-o.a0)>180 ? 1 : 0, sweep = o.a1>o.a0 ? 0 : 1;
      s += `<path class="${o.cls||'arc'}" d="M${f2(p0[0])} ${f2(p0[1])} A${f2(r)} ${f2(r)} 0 ${large} ${sweep} ${f2(p1[0])} ${f2(p1[1])}"/>`;
      if(o.head){ const ux = Math.cos(a1), uy = Math.sin(a1); const tg = o.a1>o.a0 ? [-uy, ux] : [uy, -ux]; const hx = p1[0], hy = p1[1]; const h = 2.2;
        const bx = hx - tg[0]*h, by = hy + tg[1]*h; s += `<path class="comph" d="M${f2(hx)} ${f2(hy)} L${f2(bx - tg[1]*h*.5)} ${f2(by - tg[0]*h*.5)} L${f2(bx + tg[1]*h*.5)} ${f2(by + tg[0]*h*.5)}z"/>`; } }
    else if(o.t==='right'){ s += cfRight(o.v, o.d1, o.d2, o.gap||1.1, o.q||2.6); }
    else if(o.t==='ticks'){ s += cfTicks(o.a, o.b, o.n||1); }
    else if(o.t==='mark'){ s += `<circle class="bad" cx="${X(o.p[0])}" cy="${Y(o.p[1])}" r="2.6"/>`; }
    else if(o.t!=='pt') s += cfObjs([o]);
  });
  objs.filter(o=>o && o.t==='pt').forEach(o=>{
    top += `<circle class="${o.c||'orig'}" cx="${X(o.p[0])}" cy="${Y(o.p[1])}" r="${o.c==='ghost'?1.9:(o.r||1.4)}"/>`;
    if(o.n){ const L = lblAt(o.p, o.away, g); top += `<text class="lbl ${o.c==='img'||o.c==='mine'?'img':o.c==='cen'?'cen':'orig'}${o.sm?' sm':''}" x="${f2(L.lx)}" y="${f2(L.ly)}" text-anchor="${L.anchor}">${o.n}</text>`; }
  });
  return s + top;
}
/* testhulp: meldt punten en vectoren buiten het rooster */
function oobChk(svg, objs, g){
  const out = q => q && !(q[0]>=g[0]-1e-6 && q[0]<=g[1]+1e-6 && q[1]>=g[2]-1e-6 && q[1]<=g[3]+1e-6);
  objs.filter(Boolean).forEach(o=>{ const ps = o.t==='pt'||o.t==='cen' ? [o.p] : o.t==='arrow' ? [o.a,o.b] : o.t==='poly' ? o.pts : []; if(ps.some(out)){ const c = svg.closest('.card'); (window.__oob = window.__oob || []).push((c && c.querySelector('h3') ? c.querySelector('h3').textContent : '?')+' · '+o.t+' '+JSON.stringify(ps)); } });
}
function gridFig(parent, o={}){
  const g = o.g || [0,12,0,8];
  const B = gridBase(g, o);
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', B.vb.map(f2).join(' ')); svg.setAttribute('class','cf'); svg.setAttribute('role','img'); svg.setAttribute('aria-label', o.alt || 'rooster');
  svg.style.maxWidth = (o.maxw || Math.min(520, Math.round(B.vb[2]*3.6))) + 'px';
  svg.innerHTML = `<g>${B.s}</g><g class="objs"></g><g class="top"></g>`;
  parent.append(svg);
  const gO = svg.querySelector('.objs'), top = svg.querySelector('.top');
  const F = { svg, g, base:[], token:0, last:[],
    draw(objs){ F.last = objs||[]; const all = F.base.concat(objs||[]); if(window.__oobChk) oobChk(svg, all, g); gO.innerHTML = gObjs(all, g); },
    alive(tok){ return svg.isConnected && tok===F.token; },
    toW(e){ const pt = svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return [r.x/CU, -r.y/CU]; },
    clickable(cb, opt={}){
      let hov = null; const step = opt.step || 1;
      const snap = e => { const w = F.toW(e); return [Math.round(w[0]/step)*step, Math.round(w[1]/step)*step]; };
      const ok = p => p[0]>=g[0]-1e-9 && p[0]<=g[1]+1e-9 && p[1]>=g[2]-1e-9 && p[1]<=g[3]+1e-9 && (!opt.allow || opt.allow(p));
      svg.style.cursor = 'crosshair';
      svg.addEventListener('pointermove', e=>{ if(F.locked) return; const p = snap(e); if(!ok(p)){ top.innerHTML=''; hov=null; return; } if(hov && ptEq(hov,p)) return; hov = p; top.innerHTML = `<circle class="hov" cx="${X(p[0])}" cy="${Y(p[1])}" r="2.4"/>`; });
      svg.addEventListener('pointerleave', ()=>{ hov=null; top.innerHTML=''; });
      svg.addEventListener('click', e=>{ if(F.locked) return; const p = snap(e); if(ok(p)) cb(p); });
    }
  };
  F.draw([]);
  return F;
}

/* ---------- beweging van een figuur tonen ----------
   fig: {pts, names, open}  op  ->  animatie + hulplijnen; geeft de eindobjecten terug */
function helpObjs(op, P, Q, g, full=true){
  const o = [];
  if(op.t==='s'){ const S = footPt(P, op.p, op.q); if(!ptEq(P,Q)){ o.push({t:'line', a:P, b:Q});
      if(full){ const d = [op.q[0]-op.p[0], op.q[1]-op.p[1]]; const L = Math.hypot(d[0],d[1]); const u = [d[0]/L, d[1]/L]; const n = [P[0]-S[0], P[1]-S[1]]; const Ln = Math.hypot(n[0],n[1]);
        o.push({t:'right', v:S, d1:u, d2:[n[0]/Ln, n[1]/Ln]}, {t:'ticks', a:P, b:S}, {t:'ticks', a:S, b:Q}); } } }
  if(op.t==='t'){ if(!ptEq(P,Q)) o.push({t:'arrow', a:P, b:Q, c:'vec img'}); }
  if(op.t==='r'){ o.push({t:'line', a:op.c, b:P}, {t:'line', a:op.c, b:Q}); }
  if(op.t==='p'){ if(!ptEq(P,Q)){ o.push({t:'line', a:P, b:Q}); if(full) o.push({t:'ticks', a:P, b:op.c, n:2}, {t:'ticks', a:op.c, b:Q, n:2}); } }
  return o;
}
function opBase(op, o={}){
  if(op.t==='s') return [{t:'axis', p:op.p, q:op.q, n:op.name||'', nAt:op.nAt}];
  if(op.t==='t'){ if(op.hide) return []; const A = op.from || [0,0], B = [A[0]+op.v[0], A[1]+op.v[1]]; return [{t:'arrow', a:A, b:B}, op.name ? {t:'pt', p:A, n:op.name[0], c:'orig', away:B, r:.9} : null, op.name ? {t:'pt', p:B, n:op.name[1], c:'orig', away:A, r:.9} : null]; }
  if(op.t==='r' || op.t==='p') return op.hide ? [] : [{t:'cen', p:op.c, n:op.name||'', away:o.away}];
  return [];
}
/* beginpunt voor een vector v die volledig in het rooster ligt, liefst niet op een punt van de figuur */
function vecFrom(R, g, v, avoid=[]){
  const all = [];
  for(let x=Math.ceil(g[0]); x<=g[1]; x++) for(let y=Math.ceil(g[2]); y<=g[3]; y++){ const to = [x+v[0], y+v[1]]; if(inG(to, g)) all.push([x,y]); }
  if(!all.length) return null;
  const free = all.filter(fr=>!avoid.some(p=>ptEq(p,fr) || ptEq(p,[fr[0]+v[0], fr[1]+v[1]])));
  return R.pick(free.length ? free : all);
}
async function animFig(F, fig, op, cap, opt={}){
  const tok = ++F.token; const say = stepSay(cap, opt.keep);
  const P = fig.pts, Q = P.map(p=>applyOp(p, op)); const nm = fig.names || [];
  const orig = {t:'poly', pts:P, c:'orig', names:nm, open:fig.open};
  const run = async (dur, fn) => { if(!F.alive(tok)) throw 0; await twn(REDUCED?30:dur*SLOW, t=>{ if(F.alive(tok)) fn(t); }); if(!F.alive(tok)) throw 0; };
  const pause = async d => { await wait(REDUCED?30:d*SLOW); if(!F.alive(tok)) throw 0; };
  const extra = opt.extra || [];
  try{
    if(opt.intro) say(opt.intro);
    if(op.t==='p'){
      /* puntspiegeling: eerst elk hoekpunt afzonderlijk door het centrum naar zijn beeld, daarna de hele figuur */
      const cn = op.name || 'het centrum'; const done = []; let saidRest = false;
      const named = nm.some(Boolean);
      if(!named) say(`Spiegel elk hoekpunt afzonderlijk om ${cn}: ga in een rechte lijn naar ${cn} en even ver door aan de andere kant.`);
      for(let i=0;i<P.length;i++){
        if(ptEq(P[i], Q[i])){ if(named) say(`${nm[i]} ligt op ${cn}: ${nm[i]} is een dekpunt.`); done.push({t:'pt', p:Q[i], n:nm[i]? nm[i]+PR : '', c:'img', away:op.c}); continue; }
        if(nm[i]) say(`Spiegel ${nm[i]} om ${cn}: ga van ${nm[i]} in een rechte lijn naar ${cn} en even ver door. Zo vind je ${nm[i]}${PR}.`);
        else if(named && !saidRest){ saidRest = true; say('Doe hetzelfde voor elk ander hoekpunt.'); }
        await run(700, t=>{ const c = lerp2(P[i], op.c, t); F.draw(extra.concat([orig], done, [{t:'line', a:P[i], b:c}, {t:'pt', p:c, c:'ghost'}])); });
        await pause(120);
        await run(700, t=>{ const c = lerp2(op.c, Q[i], t); F.draw(extra.concat([orig], done, [{t:'line', a:P[i], b:c}, {t:'ticks', a:P[i], b:op.c, n:i%3+1}, {t:'pt', p:c, c:'ghost'}])); });
        done.push({t:'line', a:P[i], b:Q[i]}, {t:'ticks', a:P[i], b:op.c, n:i%3+1}, {t:'ticks', a:op.c, b:Q[i], n:i%3+1}, {t:'pt', p:Q[i], n:nm[i]? nm[i]+PR : '', c:'img', away:op.c});
        F.draw(extra.concat([orig], done));
        await pause(450);
      }
      if(P.some((p,i)=>!ptEq(p,Q[i]))){
        say(`Nu de hele figuur: ze krimpt langs de lijnen naar ${cn} en groeit er aan de andere kant weer uit.`);
        await run(1100, t=>F.draw(extra.concat([orig], done, [{t:'poly', pts:P.map(p=>lerp2(p, op.c, t)), c:'ghost', open:fig.open}])));
        await pause(200);
        await run(1100, t=>F.draw(extra.concat([orig], done, [{t:'poly', pts:Q.map(q=>lerp2(op.c, q, t)), c:'ghost', open:fig.open}])));
        await pause(300);
      }
      say(fig.open ? 'Verbind de beeldpunten: zo krijg je het beeld van de hele figuur.' : 'Verbind de beeldpunten: zo krijg je het beeld van de hele figuur. Het beeld staat op zijn kop.');
      F.draw(extra.concat([orig], done, [{t:'poly', pts:Q, c:'ghost', open:fig.open}])); await pause(500);
    }
    else {
      const help = t => P.flatMap(p=>{ if(op.t==='r') return [{t:'line', a:op.c, b:p}, {t:'line', a:op.c, b:opAt(p,op,t)}]; const cur = opAt(p, op, t); return op.t==='t' ? (t>.02 ? [{t:'arrow', a:p, b:cur, c:'comp'}] : []) : [{t:'line', a:p, b:cur}]; });
      if(op.t==='r'){ const R = Math.hypot(P[0][0]-op.c[0], P[0][1]-op.c[1]); const a0 = Math.atan2(P[0][1]-op.c[1], P[0][0]-op.c[0])/D2R;
        await run(1600, t=>F.draw(extra.concat([orig], help(t), [{t:'arcC', c:op.c, r:Math.min(R*.55, 2.2), a0, a1:a0+op.deg*t}, {t:'poly', pts:P.map(p=>opAt(p,op,t)), c:'ghost', open:fig.open}]))); }
      else await run(op.t==='t'?1300:1500, t=>F.draw(extra.concat([orig], help(t), [{t:'poly', pts:P.map(p=>opAt(p,op,t)), c:'ghost', open:fig.open}])));
      await pause(250);
    }
  }catch(e){ if(e!==0) console.error(e); return; }
  if(F.g && Q.some(q=>q[0]<F.g[0]-1e-6 || q[0]>F.g[1]+1e-6 || q[1]<F.g[2]-1e-6 || q[1]>F.g[3]+1e-6)) console.warn('BUITEN ROOSTER', JSON.stringify(Q), JSON.stringify(F.g));
  F.draw(finalFig(fig, op, opt));
  if(opt.end) say(opt.end);
}
function finalFig(fig, op, opt={}){
  const g = null; const P = fig.pts, Q = P.map(p=>applyOp(p, op));
  const o = (opt.extra||[]).slice();
  o.push({t:'poly', pts:P, c:'orig', names:fig.names, open:fig.open});
  if(opt.helpers!==false) P.forEach((p,i)=>{ if(op.t==='s' || op.t==='p') o.push(...helpObjs(op, p, Q[i], g, i===0 || opt.allMarks)); else if(op.t==='t') o.push(...helpObjs(op, p, Q[i], g)); else if(i===0) o.push(...helpObjs(op, p, Q[i], g)); });
  if(op.t==='r'){ const R = Math.hypot(P[0][0]-op.c[0], P[0][1]-op.c[1]); const a0 = Math.atan2(P[0][1]-op.c[1], P[0][0]-op.c[0])/D2R; o.push({t:'arcC', c:op.c, r:Math.min(R*.55, 2.2), a0, a1:a0+op.deg, head:true}); }
  o.push({t:'poly', pts:Q, c:'img', names:(fig.names||[]).map(n=>n? n+PR : ''), open:fig.open});
  return o;
}

/* ============================================================
   KLIKOEFENING OP HET ROOSTER: hoekpunten van het beeld plaatsen
   cfg: {g, axes, fig:{pts, names, open}, op, base:[...], mode:'beeld'|'punt'|'vec'|'as', hint(i, p, want)->tekst, done, extraEnd}
   ============================================================ */
function placeTask(parent, st, save, id, cfg){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {P:{}, cur:0, done:false});
  const mode = cfg.mode || 'beeld';
  const fig = cfg.fig; const op = cfg.op;
  const want = mode==='beeld' ? fig.pts.map(p=>applyOp(p, op)) : [];
  const names = mode==='beeld' ? fig.names.map(n=>n+PR) : mode==='punt' ? [cfg.cname||'O'] : mode==='vec' ? ['beginpunt', 'eindpunt'] : ['punt 1', 'punt 2'];
  const fixed = cfg.fixed || {};             /* reeds gegeven beeldpunten (vervolledigen) */
  const box = el('div','q'); parent.append(box);
  if(cfg.html) box.append(el('div','q-text block lg', cfg.html));
  let pick = null, btns = [];
  const todo = names.map((n,i)=>i).filter(i=>!(i in fixed));
  if(todo.length>1){
    pick = el('div','pick-pts'); pick.append(el('span','lab', mode==='beeld' ? 'Plaats:' : 'Klik:'));
    btns = names.map((n,i)=>{ if(i in fixed) return null; const b = el('button','opt', n); b.type='button'; b.addEventListener('click', ()=>{ if(locked) return; s.cur = i; save(); paint(); }); pick.append(b); return b; });
    box.append(pick);
  }
  const F = gridFig(box, {g:cfg.g, axes:cfg.axes, lattice:cfg.lattice, maxw:cfg.maxw});
  F.base = (cfg.base || []);
  const useHints = mode==='beeld' && !quiz && cfg.hints!==false;
  let hStage = 0, hBar = null, hBtn = null, hOff = null, hInfo = null, hTxt = null;
  if(useHints){
    hBar = el('div','hintbar'); hBtn = el('button','hintbtn','💡 Hint'); hBtn.type = 'button';
    hOff = el('button','hintbtn off','Verberg de hint'); hOff.type = 'button'; hInfo = el('span','hintinfo');
    hBar.append(hBtn, hOff, hInfo); hTxt = el('div','hint-txt'); box.append(hBar, hTxt);
    hBtn.addEventListener('click', ()=>{ if(locked) return; hStage = Math.min(2, hStage+1); paint(); });
    hOff.addEventListener('click', ()=>{ hStage = 0; paint(); });
  }
  const cap = el('div','cf-cap'); box.append(cap);
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type='button';
  const bDemo = el('button','btn ghost', icon('play')+' Toon de werkwijze'); bDemo.type='button'; bDemo.hidden = true; bDemo.style.display='inline-flex'; bDemo.style.alignItems='center'; bDemo.style.gap='.3rem';
  const bWis = el('button','linkbtn','Wis mijn punten'); bWis.type='button';
  act.append(bC, bDemo, bWis); if(quiz) bC.hidden = true;
  const fb = el('div','fb'); box.append(act, fb);
  let locked = false, bad = [];
  if(s.cur==null || (s.cur in fixed)) s.cur = todo[0];
  function mine(){
    const o = [];
    if(mode==='beeld'){
      const pts = names.map((n,i)=> (i in fixed) ? fixed[i] : s.P[i]);
      if(pts.every(Boolean) && pts.length>1) o.push({t:'poly', pts, c:'mine', open:fig.open});
      else if(fig.open && pts.length>1){ /* gedeeltelijke lijn */ }
      pts.forEach((p,i)=>{ if(p && !(i in fixed)) o.push({t:'pt', p, n:names[i], c:'mine', away: centroid(pts.filter(Boolean))}); });
    } else if(mode==='punt'){ if(s.P[0]) o.push({t:'pt', p:s.P[0], n:names[0], c:'mine'}); }
    else if(mode==='vec'){ if(s.P[0]) o.push({t:'pt', p:s.P[0], c:'mine'}); if(s.P[0] && s.P[1]) o.push({t:'arrow', a:s.P[0], b:s.P[1], c:'vec img'}); }
    else if(mode==='as'){ if(s.P[0]) o.push({t:'pt', p:s.P[0], c:'mine'}); if(s.P[1]) o.push({t:'pt', p:s.P[1], c:'mine'}); if(s.P[0] && s.P[1] && !ptEq(s.P[0],s.P[1])) o.push({t:'axis', p:s.P[0], q:s.P[1], hl:true}); }
    bad.forEach(p=>o.push({t:'mark', p}));
    return o;
  }
  function figObjs(){ return cfg.figObjs ? cfg.figObjs() : [{t:'poly', pts:fig.pts, c:'orig', names:fig.names, open:fig.open}]; }
  function hintPaint(){ if(!hBar) return;
    hBar.hidden = locked || s.done; hBtn.innerHTML = hStage ? '💡 Volgende hint' : '💡 Hint'; hBtn.disabled = hStage>=2; hOff.hidden = !hStage;
    hInfo.textContent = hStage && !s.done ? `hint ${hStage} van 2 voor ${names[s.cur]}` : '';
    hTxt.innerHTML = hStage && !s.done ? (cfg.hintTxt ? cfg.hintTxt(hStage, s.cur) : (HINT_TXT[op.t]||[])[hStage-1] || '') : ''; }
  function paint(){ btns.forEach((b,i)=>{ if(b){ b.classList.toggle('chosen', i===s.cur && !locked); b.classList.toggle('good', false); } }); hintPaint();
    if(!s.done) F.draw(figObjs().concat(hStage && fig.pts[s.cur] ? hintObjs(op, fig.pts[s.cur], hStage, names[s.cur]) : [], mine())); }
  F.clickable(p=>{ if(locked || s.done) return;
    bad = []; fb.textContent=''; fb.className='fb';
    if(mode==='beeld' || mode==='vec' || mode==='as'){ s.P[s.cur] = p; const nxt = todo.find(i=>!s.P[i]); if(nxt!=null) s.cur = nxt; }
    else s.P[0] = p;
    save(); paint(); });
  bWis.addEventListener('click', ()=>{ if(locked || s.done) return; s.P = {}; s.cur = todo[0]; bad = []; fb.textContent=''; save(); paint(); });
  function evaluate(){
    if(mode==='beeld'){
      const got = names.map((n,i)=> (i in fixed) ? fixed[i] : s.P[i]);
      if(todo.some(i=>!s.P[i])) return {ok:false, info:true, msg: todo.length>1 ? 'Plaats eerst alle punten.' : 'Klik eerst op het rooster.'};
      const wrong = todo.filter(i=>!ptEq(got[i], want[i]));
      if(!wrong.length) return {ok:true};
      const i = wrong[0]; const p = got[i];
      let msg = '';
      const other = want.findIndex((w,j)=>j!==i && ptEq(w,p));
      if(other>=0) msg = `${names[i]} staat op de plaats van ${names[other]}. Let op de namen: het beeld van ${fig.names[i]} is ${names[i]}.`;
      else if(cfg.hint) msg = cfg.hint(i, p, want[i]);
      else msg = autoHint(op, fig.pts[i], p, fig.names[i]);
      return {ok:false, wrong, msg: (wrong.length>1 ? `${wrong.length} punten staan nog niet juist. ` : '') + msg};
    }
    if(mode==='punt'){ if(!s.P[0]) return {ok:false, info:true, msg:'Klik eerst op het rooster.'}; return ptEq(s.P[0], cfg.ans) ? {ok:true} : {ok:false, msg: cfg.hint ? cfg.hint(0, s.P[0], cfg.ans) : 'Het centrum is het midden van elk lijnstuk tussen een punt en zijn beeld.'}; }
    if(mode==='vec'){ if(!s.P[0] || !s.P[1]) return {ok:false, info:true, msg:'Klik eerst het beginpunt en dan het eindpunt van je vector.'}; const v = [s.P[1][0]-s.P[0][0], s.P[1][1]-s.P[0][1]]; if(ptEq(v, cfg.ans)) return {ok:true};
      if(ptEq(v, [-cfg.ans[0], -cfg.ans[1]])) return {ok:false, msg:'Je vector wijst in de tegengestelde zin. Hij moet van een punt naar zijn beeld wijzen.'}; return {ok:false, msg:'Tel de hokjes van een punt naar zijn beeld: zoveel naar rechts of links en zoveel naar boven of onder.'}; }
    if(mode==='as'){ if(!s.P[0] || !s.P[1] || ptEq(s.P[0],s.P[1])) return {ok:false, info:true, msg:cfg.infoMsg || 'Klik twee verschillende punten die op de spiegelas liggen.'};
      const [A,B] = cfg.ans; const on = p => Math.abs((B[0]-A[0])*(p[1]-A[1]) - (B[1]-A[1])*(p[0]-A[0])) < 1e-6;
      return (on(s.P[0]) && on(s.P[1])) ? {ok:true} : {ok:false, msg:cfg.badMsg || 'De spiegelas staat loodrecht op het lijnstuk tussen een punt en zijn beeld, en gaat door het midden ervan.'}; }
  }
  function finish(animate){
    locked = true; s.done = true; F.locked = true; svgNoCursor(); bC.hidden = true; bWis.hidden = true; if(pick) pick.hidden = true; hStage = 0; hintPaint();
    if(mode==='beeld'){ if(animate) animFig(F, fig, op, cap, {extra:cfg.base? []:[], end:cfg.end}); else F.draw(finalFig(fig, op)); }
    else { F.draw(figObjs().concat(cfg.solObjs ? cfg.solObjs() : mine())); if(cfg.end) cap.innerHTML = cfg.end; }
  }
  const svgNoCursor = () => { F.svg.style.cursor = 'default'; };
  function run(){
    const r = evaluate(); bad = [];
    fb.className = 'fb ' + (r.ok ? 'ok' : r.info ? 'info' : 'bad');
    fb.innerHTML = (r.ok ? '✅ Juist! ' + (cfg.why||'') : r.info ? r.msg : '❌ Nog niet juist. ' + r.msg);
    if(r.info) return;
    if(r.wrong) bad = r.wrong.map(i=>s.P[i]);
    CLres(qid, !!r.ok);
    if(r.ok){ save(); finish(true); }
    else { paint(); if(mode==='beeld') bDemo.hidden = false; }
    save();
  }
  bC.addEventListener('click', run);
  bDemo.addEventListener('click', ()=>{ F.base = cfg.base || []; animFig(F, fig, op, cap, {intro: cfg.demoIntro || '', end:'Zo vind je het beeld. Plaats nu zelf de punten.'}).then(()=>{}); });
  if(s.done) finish(false); else paint();
  if(quiz){ bWis.hidden = false;
    quiz.push({ pts: cfg.pts || 1, grade:()=>!!evaluate().ok,
      reveal:(ok)=>{ if(!ok){ const r = evaluate(); fb.className='fb bad'; fb.innerHTML = '❌ ' + (r.msg||''); F.draw(figObjs().concat(mine(), mode==='beeld' ? [{t:'poly', pts:want, c:'ghost', names:names, open:fig.open}] : cfg.solObjs ? cfg.solObjs(true) : [])); } else { F.draw(figObjs().concat(mine())); } },
      lock:()=>{ locked = true; F.locked = true; bWis.hidden = true; if(pick) pick.hidden = true; } });
  }
  return {F, box};
}
/* hint in twee stappen voor het beeld van één punt (zoals op de oorspronkelijke site):
   stap 1 toont hoe je vertrekt, stap 2 toont waar het beeld komt */
function hintObjs(op, P, stage, lab){
  const Q = applyOp(P, op); const o = [];
  const unit = v => { const L = Math.hypot(v[0], v[1]) || 1; return [v[0]/L, v[1]/L]; };
  const ring = (q, l) => ({t:'raw', s:`<circle class="hintring" cx="${X(q[0])}" cy="${Y(q[1])}" r="2.7"/>` + (l ? `<text class="lbl hint" x="${f2(X(q[0])+3.4)}" y="${f2(Y(q[1])-3.2)}">${l}</text>` : '')});
  const tick = (a, b, n=1) => ({t:'raw', s:cfTicks(a, b, n).replace(/class="mark"/g, 'class="hintm"')});
  if(ptEq(P, Q)) return [ring(P, (lab ? lab.replace(PR,'') : 'Het punt') + ' is een dekpunt')];
  if(op.t==='s'){ const F = footPt(P, op.p, op.q), ax = unit([op.q[0]-op.p[0], op.q[1]-op.p[1]]), n = unit([P[0]-F[0], P[1]-F[1]]);
    o.push({t:'line', a:P, b:F, c:'hintl'}, {t:'raw', s:cfRight(F, ax, n).replace('class="mark"', 'class="hintm"')}, tick(P, F));
    if(stage>=2) o.push({t:'line', a:F, b:Q, c:'hintl'}, tick(F, Q), ring(Q, lab)); }
  else if(op.t==='t'){ const v = op.v; o.push({t:'line', a:[P[0]-v[0]*.3, P[1]-v[1]*.3], b:[P[0]+v[0]*1.3, P[1]+v[1]*1.3], c:'hintl soft'});
    if(stage>=2) o.push({t:'raw', s:cfArrow(P, Q, 'hintl solid').replace('class="hintl solidh"', 'class="hintlh"')}, ring(Q, lab)); }
  else if(op.t==='r'){ const C = op.c, r = Math.hypot(P[0]-C[0], P[1]-C[1]), a0 = Math.atan2(P[1]-C[1], P[0]-C[0])/D2R, sg = op.deg>0 ? 1 : -1;
    o.push({t:'line', a:C, b:P, c:'hintl'}, {t:'arcC', c:C, r, a0, a1:a0+op.deg+sg*25, cls:'hintl soft'});
    if(stage>=2){ const rr = Math.min(1.3, r*.45), am = (a0+op.deg/2)*D2R;
      o.push({t:'line', a:C, b:Q, c:'hintl'}, {t:'arcC', c:C, r:rr, a0, a1:a0+op.deg, cls:'hintl solid'}, {t:'txt', p:[C[0]+(rr+.9)*Math.cos(am), C[1]+(rr+.9)*Math.sin(am)], s:degTxt(op.deg), c:'hint', dy:1.6}, ring(Q, lab)); } }
  else if(op.t==='p'){ const C = op.c; o.push({t:'line', a:P, b:[C[0]+(C[0]-P[0])*.35, C[1]+(C[1]-P[1])*.35], c:'hintl'}, tick(P, C));
    if(stage>=2) o.push({t:'line', a:C, b:Q, c:'hintl'}, tick(C, Q), ring(Q, lab)); }
  return o;
}
const HINT_TXT = {
  s:['Ga vanuit het punt <b>loodrecht</b> naar de spiegelas.', 'Ga <b>even ver</b> door aan de andere kant van de as. Daar ligt het beeld.'],
  t:['Het beeld ligt op een rechte die <b>evenwijdig</b> is met de vector.', 'Schuif het punt <b>even ver en in dezelfde zin</b> als de pijl van de vector.'],
  r:['Het beeld ligt even ver van het centrum: het punt draait op een <b>cirkelboog</b> rond het centrum.', 'Draai over de gegeven hoek. Een positieve hoek is <b>tegenwijzerzin</b>, een negatieve hoek is <b>wijzerzin</b>.'],
  p:['Teken de rechte door het punt en het <b>centrum</b>.', 'Ga <b>even ver</b> door aan de andere kant van het centrum. Daar ligt het beeld.']
};
function autoHint(op, P, got, nm){
  const want = applyOp(P, op);
  if(op.t==='s'){ const S = footPt(P, op.p, op.q); const d1 = Math.hypot(P[0]-S[0], P[1]-S[1]); const d2 = Math.hypot(got[0]-S[0], got[1]-S[1]);
    const perp = Math.abs((got[0]-P[0])*(op.q[0]-op.p[0]) + (got[1]-P[1])*(op.q[1]-op.p[1])) < 1e-6;
    if(perp && Math.abs(d1-d2)>1e-6) return `Ga vanuit ${nm} loodrecht naar de as en dan <b>even ver</b> aan de andere kant.`;
    return `Het lijnstuk van ${nm} naar zijn beeld staat <b>loodrecht</b> op de as, en de as ligt er precies in het midden.`; }
  if(op.t==='t'){ const back = [P[0]-op.v[0], P[1]-op.v[1]]; if(ptEq(got, back)) return 'Je schoof in de tegengestelde zin. Volg de pijl van de vector.';
    return `Schuif ${nm} even ver en in dezelfde richting als de vector: ${Math.abs(op.v[0])} ${op.v[0]>=0?'naar rechts':'naar links'} en ${Math.abs(op.v[1])} ${op.v[1]>=0?'naar boven':'naar beneden'}.`; }
  if(op.t==='r'){ if(ptEq(got, rotPt(P, op.c, -op.deg))) return `Je draaide in de verkeerde zin. ${op.deg>0?'Een positieve hoek betekent tegenwijzerzin.':'Een negatieve hoek betekent wijzerzin.'}`;
    return `Het beeld ligt even ver van het centrum als ${nm}, en de hoek tussen beide is ${degTxt(Math.abs(op.deg))}.`; }
  if(op.t==='p'){ return `Het centrum is het <b>midden</b> van het lijnstuk tussen ${nm} en zijn beeld: ga even ver door aan de andere kant.`; }
  return '';
}

/* ============================================================
   KLEINE VRAAGVORMEN
   ============================================================ */
/* waar of niet waar: rows [{s, ans:'w'|'n', why}] */
function wnRows(parent, st, save, prefix, rows){
  rows.forEach((r,i)=>{ const host = el('div','wn'); parent.append(host);
    qChoice(host, st, save, prefix+i, {nr:LET[i]+'.', html:r.s, opts:[['w','waar'],['n','niet waar']], ans:r.ans, why:r.why||'', whyBad:r.bad||r.why||''}); });
}
/* sorteren in bakken: items [{t, ans (index van de bak)}] */
function sortEx(b, st, save, key, bins, items){
  const qid = QID('sorteer'); const quiz = QZ; if(!quiz) CLvraag(qid);
  const pool = el('div','pool'); b.append(pool);
  const wrap = el('div','bins'); b.append(wrap);
  const fb = el('div','fb'); b.append(fb);
  const zones = bins.map((nm,k)=>{ const z = el('div','bin', `<b>${nm}</b>`); z.dataset.k = k; wrap.append(z); return z; });
  const chips = items.map((it,i)=>{ const c = el('span','chip', it.t); c.dataset.i = i; c.dataset.grp = key; return c; });
  const place = (c, k) => { const i = +c.dataset.i; if(k==null){ delete st[i]; pool.append(c); } else { st[i] = k; zones[k].append(c); } c.classList.remove('chip-ok','chip-bad');
    if(!quiz && k!=null){ const ok = items[i].ans===k; c.classList.add(ok?'chip-ok':'chip-bad'); fb.className = 'fb ' + (ok?'ok':'bad'); fb.innerHTML = ok ? '✅ Juist! ' + (items[i].why||'') : '❌ Niet juist. ' + (items[i].bad||'Probeer een andere bak.'); }
    save(); if(!quiz && items.every((it,j)=>st[j]!=null)) CLres(qid, items.every((it,j)=>st[j]===it.ans)); };
  chips.forEach(c=>{ pool.append(c); draggable(c, (x,y)=>{ const z = zones.find(z=>inRect(z,x,y)); if(z) place(c, +z.dataset.k); else place(c, null); }); });
  zones.forEach(z=>z.addEventListener('click', e=>{ if(e.target.closest('.chip') && e.target.closest('.chip')!==selChip) return; if(selChip && selChip.dataset.grp===key){ const c = selChip; clearSel(); place(c, +z.dataset.k); } }));
  pool.addEventListener('click', e=>{ if(e.target===pool && selChip && selChip.dataset.grp===key){ const c = selChip; clearSel(); place(c, null); } });
  chips.forEach((c,i)=>{ if(st[i]!=null && zones[st[i]]){ zones[st[i]].append(c); if(!quiz) c.classList.add(items[i].ans===st[i]?'chip-ok':'chip-bad'); } });
  if(quiz) quiz.push({ pts:items.length>6?2:1, grade:()=>items.every((it,j)=>st[j]===it.ans),
    reveal:()=>chips.forEach((c,i)=>c.classList.add(st[i]===items[i].ans?'chip-ok':'chip-bad')), lock:()=>chips.forEach(c=>c.dataset.locked='1') });
}
/* keuzevraag waarbij meerdere knoppen aan kunnen (vink alle juiste aan) */
function qMulti(parent, st, save, id, q){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const row = el('div','q'); parent.append(row);
  if(q.html) row.append(el('div','q-text block', (q.nr?`<span class="q-num">${q.nr}</span>`:'') + q.html));
  if(q.fig){ const f = el('div'); if(typeof q.fig==='function') q.fig(f); else f.innerHTML = q.fig; row.append(f); }
  const w = el('div','choices'); row.append(w);
  const s = st[id] || (st[id] = {sel:[], checked:false});
  const btns = q.opts.map(([v,l])=>{ const b = el('button','opt',l); b.type='button'; b.dataset.val=v; w.append(b);
    b.addEventListener('click', ()=>{ if(b.disabled) return; const k = s.sel.indexOf(v); if(k>=0) s.sel.splice(k,1); else { if(q.none && v===q.none) s.sel = []; else if(q.none) s.sel = s.sel.filter(x=>x!==q.none); s.sel.push(v); } s.checked = false; save(); paint(); fb.textContent=''; fb.className='fb'; }); return b; });
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type='button'; act.append(bC); if(quiz) bC.hidden = true;
  const fb = el('div','fb'); row.append(act, fb);
  const okSet = () => { const a = [...q.ans].sort().join(','), b = [...s.sel].sort().join(','); return a===b; };
  function paint(){ btns.forEach(b=>{ b.classList.toggle('chosen', s.sel.includes(b.dataset.val)); b.classList.remove('good','wrong'); }); }
  function run(silent){
    if(!s.sel.length){ fb.className='fb info'; fb.textContent = 'Kies eerst minstens één knop.'; return; }
    const ok = okSet(); paint();
    btns.forEach(b=>{ if(s.sel.includes(b.dataset.val)) b.classList.add(q.ans.includes(b.dataset.val)?'good':'wrong'); });
    fb.className = 'fb ' + (ok?'ok':'bad');
    const miss = q.ans.filter(v=>!s.sel.includes(v)).length, extra = s.sel.filter(v=>!q.ans.includes(v)).length;
    fb.innerHTML = ok ? '✅ Juist! ' + (q.why||'') : '❌ Nog niet juist. ' + (extra ? 'Er staat een knop aan die niet past. ' : '') + (miss ? 'Je bent nog iets vergeten. ' : '') + (q.whyBad||'');
    s.checked = true; save(); if(!silent) CLres(qid, ok); if(ok && q.onOk) q.onOk(silent);
  }
  bC.addEventListener('click', ()=>run(false)); paint(); if(s.checked && !quiz) run(true);
  if(quiz) quiz.push({ pts:q.pts||1, grade:()=>okSet(), reveal:(ok)=>{ btns.forEach(b=>{ if(s.sel.includes(b.dataset.val)) b.classList.add(q.ans.includes(b.dataset.val)?'good':'wrong'); }); if(!ok){ fb.className='fb bad'; fb.innerHTML = '❌ Juist is: ' + q.opts.filter(o=>q.ans.includes(o[0])).map(o=>o[1]).join(', ') + '.'; } }, lock:()=>btns.forEach(b=>b.disabled=true) });
  return {row, fb};
}
/* invullen van een letter of een hoek (puntvul) */
const nrmL = s => String(s).trim().replace(/[′'’`]/g,'');
/* tekst rond invulvakjes bij elkaar houden (anders komen er spaties rond s<sub>a</sub>) */
const keepTxt = h => h.split(/(<sub>\[\[\d+\]\]<\/sub>|\[\[\d+(?::\w+)?\]\])/).map(x=>/^(<sub>)?\[\[/.test(x) ? x : (x ? `<span class="kt">${x}</span>` : '')).join('');
function letterQ(parent, st, save, id, q){
  return qBlock(parent, st, save, id, { nr:q.nr, html:keepTxt(q.html), size:'xs', mode:'text',
    check:v=>{ if(q.kind==='ang'){ const a = parseAng(v[0]); if(isNaN(a)) return {ok:false, msg:'Typ een hoek, bijvoorbeeld 90 of −60.'};
        const ok = q.ans.some(x=>Math.abs(x-a)<1e-6) || (q.mod && q.ans.some(x=>angEq(x,a)));
        if(!ok && q.ans.some(x=>Math.abs(x+a)<1e-6)) return {ok:false, msg:'Kijk naar de zin: tegenwijzerzin is positief, wijzerzin is negatief.'};
        return {ok, msg: ok ? (q.why||'') : (q.bad||'')}; }
      const t = q.kind==='as' ? nrmL(v[0]).toLowerCase() : nrmL(v[0]).toUpperCase();
      if(!t) return {ok:false, msg:'Typ een letter.'};
      const ok = q.ans.map(a=>q.kind==='as'?a.toLowerCase():a.toUpperCase()).includes(t);
      return {ok, msg: ok ? (q.why||'') : (q.bad||'')}; },
    sol:q.sol });
}

/* ============================================================
   SYMMETRIE VAN VLAKKE FIGUREN (automatisch berekend)
   ============================================================ */
function polySame(A, B, tol=1e-4){
  if(A.length!==B.length) return false;
  const used = B.map(()=>false);
  return A.every(p=>{ for(let j=0;j<B.length;j++){ if(!used[j] && ptEq(p,B[j],tol)){ used[j]=true; return true; } } return false; });
}
/* figuur als lijst van veelhoeken; test of een transformatie de figuur op zichzelf afbeeldt (randen vergelijken) */
function edgesOfF(polys){ const E = []; polys.forEach(P=>{ const n = P.length; for(let i=0;i<n;i++) E.push([P[i], P[(i+1)%n]]); }); return E; }
function sameEdgesF(E1, E2){ if(E1.length!==E2.length) return false; const used = E2.map(()=>false), tol = 1e-3;
  return E1.every(e=>{ for(let j=0;j<E2.length;j++){ if(used[j]) continue; const f = E2[j]; if((ptEq(e[0],f[0],tol)&&ptEq(e[1],f[1],tol)) || (ptEq(e[0],f[1],tol)&&ptEq(e[1],f[0],tol))){ used[j]=true; return true; } } return false; }); }
const invariant = (polys, op) => sameEdgesF(edgesOfF(polys), edgesOfF(polys.map(P=>P.map(p=>applyOp(p,op)))));
/* kandidaat-assen door het zwaartepunt: naar elk hoekpunt en elk midden van een zijde */
function candAxes(polys, C, extra=[]){
  const dirs = []; const add = a => { a = ((a%180)+180)%180; if(!dirs.some(d=>Math.abs(d-a)<.5 || Math.abs(Math.abs(d-a)-180)<.5)) dirs.push(a); };
  polys.forEach(P=>P.forEach((p,i)=>{ const q = P[(i+1)%P.length]; [[p[0],p[1]], [(p[0]+q[0])/2, (p[1]+q[1])/2]].forEach(m=>{ if(Math.hypot(m[0]-C[0], m[1]-C[1])>1e-6) add(Math.atan2(m[1]-C[1], m[0]-C[0])/D2R); }); }));
  extra.forEach(add);
  return dirs.sort((a,b)=>a-b).map(a=>({a, p:C, q:[C[0]+Math.cos(a*D2R), C[1]+Math.sin(a*D2R)]}));
}
/* symTask: klik de stippellijnen aan die symmetrieassen zijn + symmetriemiddelpunt ja/nee */
function symTask(parent, st, save, id, f){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {on:[], m:null, checked:false});
  const polys = f.polys; const C = f.C || centroid(polys.flat());
  const cands = (f.cands || candAxes(polys, C, f.extraDirs)).map(c=>({...c, ok: invariant(polys, {t:'s', p:c.p, q:c.q})}));
  const hasM = invariant(polys, {t:'p', c:C});
  const box = el('div','q'); parent.append(box);
  box.append(el('div','q-text block', `<span class="q-num">${f.nr||''}</span><b>${f.naam}</b>`));
  /* figuur in eigen kader */
  const all = polys.flat(); const xs = all.map(p=>p[0]), ys = all.map(p=>p[1]);
  const R = Math.max(...all.map(p=>Math.hypot(p[0]-C[0], p[1]-C[1]))) * 1.18;
  const vb = [X(C[0]-R)-3, Y(C[1]+R)-3, 2*R*CU+6, 2*R*CU+6];
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','cf'); svg.setAttribute('viewBox', vb.map(f2).join(' ')); svg.style.maxWidth = '230px'; svg.setAttribute('role','img'); svg.setAttribute('aria-label', f.naam);
  box.append(svg);
  const mB = el('div','choices'); mB.append(el('span','step-lab','Symmetriemiddelpunt?'));
  const bJ = el('button','opt','ja'), bN = el('button','opt','nee'); [bJ,bN].forEach(b=>{ b.type='button'; mB.append(b); });
  box.append(mB);
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type='button'; act.append(bC); if(quiz) bC.hidden = true;
  const fb = el('div','fb'); box.append(act, fb);
  let locked = false, shown = false;
  function draw(){
    let h = `<rect class="bg" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}"/>`;
    h += polys.map(P=>`<polygon class="orig" points="${P.map(p=>X(p[0])+','+Y(p[1])).join(' ')}"/>`).join('');
    cands.forEach((c,i)=>{ const a = [C[0]-Math.cos(c.a*D2R)*R*.98, C[1]-Math.sin(c.a*D2R)*R*.98], b = [C[0]+Math.cos(c.a*D2R)*R*.98, C[1]+Math.sin(c.a*D2R)*R*.98];
      const on = s.on.includes(i); let cls = 'cand' + (on?' on':''); if(shown){ if(c.ok && on) cls = 'cand ok'; else if(!c.ok && on) cls = 'cand bad'; else if(c.ok && !on) cls = 'cand'; }
      h += `<line class="${cls}" x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}"/><line class="candhit" data-i="${i}" x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}"/>`; });
    if(s.m==='j') h += `<circle class="cpt" cx="${X(C[0])}" cy="${Y(C[1])}" r="1.4" style="fill:var(--orange)"/>`;
    svg.innerHTML = h;
    bJ.classList.toggle('chosen', s.m==='j'); bN.classList.toggle('chosen', s.m==='n');
  }
  svg.addEventListener('click', e=>{ const t = e.target.closest('.candhit'); if(!t || locked) return; const i = +t.dataset.i; const k = s.on.indexOf(i); if(k>=0) s.on.splice(k,1); else s.on.push(i); s.checked = false; shown = false; save(); draw(); fb.textContent=''; });
  bJ.addEventListener('click', ()=>{ if(locked) return; s.m='j'; save(); draw(); }); bN.addEventListener('click', ()=>{ if(locked) return; s.m='n'; save(); draw(); });
  const nOk = cands.filter(c=>c.ok).length;
  const correct = () => cands.every((c,i)=>c.ok === s.on.includes(i)) && (s.m==='j') === hasM;
  function run(silent){
    if(!s.m){ fb.className='fb info'; fb.textContent='Kies ook of de figuur een symmetriemiddelpunt heeft.'; return; }
    const ok = correct(); shown = true; draw();
    const axOk = cands.every((c,i)=>c.ok === s.on.includes(i));
    fb.className = 'fb ' + (ok?'ok':'bad');
    fb.innerHTML = ok ? `✅ Juist! ${f.naam[0].toUpperCase()+f.naam.slice(1)}: ${nOk===0?'geen symmetrieassen':nOk===1?'1 symmetrieas':nOk+' symmetrieassen'}, ${hasM?'wel':'geen'} symmetriemiddelpunt.`
      : '❌ Nog niet juist. ' + (!axOk ? 'Kijk nog eens naar de assen: valt de gespiegelde figuur precies op zichzelf? ' : '') + ((s.m==='j')!==hasM ? (hasM ? 'Draai de figuur een halve slag rond het midden: ze valt op zichzelf, dus er is wel een symmetriemiddelpunt.' : 'Draai de figuur een halve slag rond het midden: ze valt niet op zichzelf.') : '');
    s.checked = true; save(); if(!silent) CLres(qid, ok);
  }
  bC.addEventListener('click', ()=>run(false));
  draw(); if(s.checked && !quiz) run(true);
  if(quiz) quiz.push({ pts:f.pts||1, grade:()=>!!s.m && correct(), reveal:(ok)=>{ shown = true; draw(); if(!ok){ fb.className='fb bad'; fb.innerHTML = `❌ ${nOk===0?'Geen symmetrieassen':nOk===1?'1 symmetrieas':nOk+' symmetrieassen'}, ${hasM?'wel':'geen'} symmetriemiddelpunt.`; } }, lock:()=>{ locked = true; bJ.disabled = bN.disabled = true; } });
}
/* regelmatige veelhoek en ster */
const regPoly = (n, r, rot=90, c=[0,0]) => Array.from({length:n}, (_,k)=>[r6(c[0]+r*Math.cos((rot+360*k/n)*D2R)), r6(c[1]+r*Math.sin((rot+360*k/n)*D2R))]);
const starPoly = (n, r1, r2, rot=90) => Array.from({length:2*n}, (_,k)=>{ const r = k%2 ? r2 : r1; const a = (rot + 180*k/n)*D2R; return [r6(r*Math.cos(a)), r6(r*Math.sin(a))]; });
/* propeller met n schuine bladen (enkel draaisymmetrie) */
function bladePoly(n, r=4){ const pts = []; for(let k=0;k<n;k++){ const a = 360*k/n; [[.6, a-25],[r, a-8],[r*.82, a+14],[.6, a+40]].forEach(([rr,aa])=>pts.push([r6(rr*Math.cos(aa*D2R)), r6(rr*Math.sin(aa*D2R))])); } return pts; }

/* ============================================================
   RUIMTEFIGUREN (schuine projectie)
   ============================================================ */
const PJ = (p, k=.5, ang=35) => [p[0] + k*p[1]*Math.cos(ang*D2R), p[2] + k*p[1]*Math.sin(ang*D2R)];
function solidSVG(kind, o={}){
  /* geeft {svg, planes} met planes als lijsten van 3D-punten */
  const P2 = p => { const q = PJ(p); return [f2(q[0]*CU/2), f2(-q[1]*CU/2)]; };
  const pp = p => P2(p).join(',');
  let edges = [], hidden = [], planes = [], extra = '', faces = [];
  const box = (l,b,h) => { const V = []; for(const z of [0,h]) for(const y of [0,b]) for(const x of [0,l]) V.push([x,y,z]); return V; };
  if(kind==='kubus' || kind==='balk' || kind==='balkvk'){
    const [l,b,h] = kind==='kubus' ? [6,6,6] : kind==='balk' ? [8,4,5] : [5,5,8];
    const V = box(l,b,h); /* index: x + 2y + 4z */
    const E = [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
    E.forEach(([i,j])=>{ (i===2||j===2) ? hidden.push([V[i],V[j]]) : edges.push([V[i],V[j]]); });
    const mx = l/2, my = b/2, mz = h/2;
    planes.push([[mx,0,0],[mx,b,0],[mx,b,h],[mx,0,h]], [[0,my,0],[l,my,0],[l,my,h],[0,my,h]], [[0,0,mz],[l,0,mz],[l,b,mz],[0,b,mz]]);
    if(l===b){ planes.push([[0,0,0],[l,b,0],[l,b,h],[0,0,h]], [[l,0,0],[0,b,0],[0,b,h],[l,0,h]]); }
    if(kind==='kubus'){ planes.push([[0,0,0],[l,0,h],[l,b,h],[0,b,0]], [[0,0,h],[l,0,0],[l,b,0],[0,b,h]], [[0,0,0],[0,b,h],[l,b,h],[l,0,0]], [[0,b,0],[0,0,h],[l,0,h],[l,b,0]]); }
    faces.push([V[0],V[1],V[5],V[4]]);
  }
  if(kind==='piramide'){ const a = 6, h = 7; const B = [[0,0,0],[a,0,0],[a,a,0],[0,a,0]], T = [a/2,a/2,h];
    edges.push([B[0],B[1]],[B[1],B[2]],[B[0],T],[B[1],T],[B[2],T]); hidden.push([B[2],B[3]],[B[3],B[0]],[B[3],T]);
    planes.push([[a/2,0,0],[a/2,a,0],T], [[0,a/2,0],[a,a/2,0],T], [B[0],B[2],T], [B[1],B[3],T]); }
  if(kind==='prisma'){ const a = 5, L = 8; const t = [[0,0,0],[a,0,0],[a/2,0,a*Math.sqrt(3)/2]], u = t.map(p=>[p[0],L,p[2]]);
    edges.push([t[0],t[1]],[t[1],t[2]],[t[2],t[0]],[t[1],u[1]],[t[2],u[2]],[u[1],u[2]]); hidden.push([t[0],u[0]],[u[0],u[1]],[u[0],u[2]]);
    const m = [0,L/2,0]; planes.push([[0,L/2,0],[a,L/2,0],[a/2,L/2,a*Math.sqrt(3)/2]]);
    [[0,1,2],[1,2,0],[2,0,1]].forEach(([i,j,k])=>{ const M = [(t[i][0]+t[j][0])/2, 0, (t[i][2]+t[j][2])/2]; planes.push([M, t[k], u[k], [M[0],L,M[2]]]); }); }
  let curved = '';
  if(kind==='cilinder'){ const r = 3, h = 8; const ell = z => { const pts = []; for(let k=0;k<=48;k++){ const a = 2*Math.PI*k/48; pts.push([r+r*Math.cos(a), r+r*Math.sin(a), z]); } return pts; };
    const bot = ell(0), topE = ell(h);
    curved += `<polyline class="solid" points="${topE.map(pp).join(' ')}"/>`;
    curved += `<polyline class="solid" points="${bot.filter((p,i)=>{ const q = PJ(p); const c = PJ([r,r,0]); return q[1] <= c[1] + 1e-6; }).map(pp).join(' ')}"/>`;
    curved += `<polyline class="hidden3" points="${bot.filter((p,i)=>{ const q = PJ(p); const c = PJ([r,r,0]); return q[1] >= c[1] - 1e-6; }).map(pp).join(' ')}"/>`;
    /* buitenste beschrijvenden */
    const c0 = PJ([r,r,0]); const ex = [0, Math.PI].map(a=>[r+r*Math.cos(a), r+r*Math.sin(a)]);
    ex.forEach(e=>edges.push([[e[0],e[1],0],[e[0],e[1],h]]));
    planes.push([[r,0,0],[r,2*r,0],[r,2*r,h],[r,0,h]], [[0,r,0],[2*r,r,0],[2*r,r,h],[0,r,h]], ell(h/2).slice(0,48), [[r-r*.707,r-r*.707,0],[r+r*.707,r+r*.707,0],[r+r*.707,r+r*.707,h],[r-r*.707,r-r*.707,h]]); }
  if(kind==='bol'){ const r = 4; const c = P2([0,0,0]);
    curved += `<circle class="solid" cx="${c[0]}" cy="${c[1]}" r="${f2(r*CU/2)}"/>`;
    const eq = []; for(let k=0;k<=48;k++){ const a = 2*Math.PI*k/48; eq.push([r*Math.cos(a), r*Math.sin(a), 0]); }
    curved += `<polyline class="hidden3" points="${eq.map(pp).join(' ')}"/>`;
    planes.push(eq.slice(0,48)); const mer = []; for(let k=0;k<48;k++){ const a = 2*Math.PI*k/48; mer.push([r*Math.cos(a), 0, r*Math.sin(a)]); } planes.push(mer);
    const m2 = []; for(let k=0;k<48;k++){ const a = 2*Math.PI*k/48; m2.push([0, r*Math.cos(a), r*Math.sin(a)]); } planes.push(m2); }
  const all = edges.concat(hidden).flat().concat(planes.flat()); const pts2 = all.map(p=>PJ(p));
  if(kind==='bol'){ pts2.push([-4.2,-4.2],[4.2,4.2]); }
  const xs = pts2.map(p=>p[0]*CU/2), ys = pts2.map(p=>-p[1]*CU/2);
  const vb = [Math.min(...xs)-4, Math.min(...ys)-4, Math.max(...xs)-Math.min(...xs)+8, Math.max(...ys)-Math.min(...ys)+8];
  const render = (pl) => {
    let h = `<rect class="bg" x="${f2(vb[0])}" y="${f2(vb[1])}" width="${f2(vb[2])}" height="${f2(vb[3])}"/>`;
    if(pl!=null && planes[pl]) h += `<polygon class="plane" points="${planes[pl].map(pp).join(' ')}"/>`;
    h += hidden.map(([a,b])=>`<line class="hidden3" x1="${P2(a)[0]}" y1="${P2(a)[1]}" x2="${P2(b)[0]}" y2="${P2(b)[1]}"/>`).join('');
    h += edges.map(([a,b])=>`<line class="solid" x1="${P2(a)[0]}" y1="${P2(a)[1]}" x2="${P2(b)[0]}" y2="${P2(b)[1]}"/>`).join('');
    h += curved + (o.extra ? o.extra(P2) : '');
    return h;
  };
  return {vb, planes, render, P2};
}
function solidFig(parent, kind, o={}){
  const S = solidSVG(kind, o);
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','cf'); svg.setAttribute('viewBox', S.vb.map(f2).join(' ')); svg.style.maxWidth = (o.maxw||220)+'px'; svg.setAttribute('role','img'); svg.setAttribute('aria-label', kind);
  svg.innerHTML = S.render(o.plane); parent.append(svg);
  return {svg, S, show:(pl)=>{ svg.innerHTML = S.render(pl); }};
}

/* afbeeldingen */
const IMGDIR = 'img/';
const FIGS = [['laars',135,150],['sleutel',192,91],['gieter',197,136],['vlag',113,150],['hand',130,149],['voetafdruk',167,144],['slak',182,119],['zeilboot',152,149],['hamer',154,145],['paraplu',202,63],['theepot',194,128],['hond',194,119]];
/* een figuurtje in een kader van ongeveer sz × sz roosterhokjes (met de juiste verhouding) */
function figBox(nm, x, y, sz=3){ const f = FIGS.find(z=>z[0]===nm); const r = f[1]/f[2]; const w = r>=1 ? sz : sz*r, h = r>=1 ? sz/r : sz; return [x, y, w, h]; }
const figHref = nm => IMGDIR + 'figuur/' + nm + '.webp';

/* ============================================================
   GENERATOREN VOOR FIGUREN EN TRANSFORMATIES
   ============================================================ */
const inG = (p, g, m=0) => p[0]>=g[0]+m-1e-9 && p[0]<=g[1]-m+1e-9 && p[1]>=g[2]+m-1e-9 && p[1]<=g[3]-m+1e-9;
const polyArea = P => Math.abs(P.reduce((s,p,i)=>{ const q = P[(i+1)%P.length]; return s + p[0]*q[1] - q[0]*p[1]; }, 0))/2;
const cross3 = (a,b,c) => (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
function inPoly(p, P){ let c = false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a = P[i], b = P[j]; if(((a[1]>p[1])!==(b[1]>p[1])) && (p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1]) + a[0])) c = !c; } return c; }
function genPoly(R, n, box){
  for(let t=0;t<400;t++){
    const pts = []; while(pts.length<n){ const p = [R.int(box[0],box[1]), R.int(box[2],box[3])]; if(!pts.some(q=>ptEq(p,q))) pts.push(p); }
    const C = centroid(pts); pts.sort((a,b)=>Math.atan2(a[1]-C[1],a[0]-C[0]) - Math.atan2(b[1]-C[1],b[0]-C[0]));
    if(polyArea(pts) < (n===3 ? 3 : 6)) continue;
    if(pts.some((p,i)=>Math.hypot(p[0]-pts[(i+1)%n][0], p[1]-pts[(i+1)%n][1]) < 2)) continue;
    if(pts.some((p,i)=>Math.abs(cross3(pts[(i+n-1)%n], p, pts[(i+1)%n])) < 1e-9)) continue;
    /* geen symmetrische figuur: anders zijn er meerdere juiste antwoorden mogelijk */
    if(n===3){ const L = pts.map((p,i)=>Math.hypot(p[0]-pts[(i+1)%3][0], p[1]-pts[(i+1)%3][1])); if(Math.abs(L[0]-L[1])<1e-6 || Math.abs(L[1]-L[2])<1e-6 || Math.abs(L[0]-L[2])<1e-6) continue; }
    return pts;
  }
  return [[box[0],box[2]],[box[0]+3,box[2]],[box[0]+1,box[2]+3]].slice(0,n);
}
const NAMES3 = ['ABC','DEF','KLM','PQR','XYZ'], NAMES4 = ['ABCD','PQRS','KLMN','DEFG','EFGH'];
const AXN = ['a','b','c','d','e'], CEN = ['O','M','Z','C'];
function genAxis(R, g, kind){
  const [x0,x1,y0,y1] = g;
  if(kind==='v'){ const c = R.int(x0+3, x1-3); return {t:'s', p:[c,y0], q:[c,y1]}; }
  if(kind==='h'){ const c = R.int(y0+2, y1-2); return {t:'s', p:[x0,c], q:[x1,c]}; }
  const m = R.pick([1,-1]); const cx = R.int(x0+3, x1-3), cy = R.int(y0+2, y1-2); return {t:'s', p:[cx,cy], q:[cx+1, cy+m]};
}
function genOpK(R, g, kind){
  if(kind==='s-v') return genAxis(R, g, 'v'); if(kind==='s-h') return genAxis(R, g, 'h'); if(kind==='s-d') return genAxis(R, g, 'd');
  if(kind==='s') return genAxis(R, g, R.pick(['v','h','v','h','d']));
  if(kind==='t'){ let v; do{ v = [R.int(-7,7), R.int(-5,5)]; }while(Math.hypot(v[0],v[1])<3.5 || !v[0] && !v[1]); return {t:'t', v}; }
  if(kind==='r90' || kind==='r') return {t:'r', c:[R.int(g[0]+2,g[1]-2), R.int(g[2]+2,g[3]-2)], deg:R.pick([90,-90])};
  if(kind==='r180') return {t:'r', c:[R.int(g[0]+2,g[1]-2), R.int(g[2]+2,g[3]-2)], deg:180};
  if(kind==='p') return {t:'p', c:[R.int(g[0]+2,g[1]-2), R.int(g[2]+2,g[3]-2)]};
}
/* opgave: figuur + transformatie waarvan het beeld in het rooster past */
function genTask(R, n, g, kind, o={}){
  for(let t=0;t<800;t++){
    const op = o.op ? o.op(R) : genOpK(R, g, kind);
    const w = o.w || 4, h = o.h || 4;
    const bx = R.int(g[0], g[1]-w), by = R.int(g[2], g[3]-h);
    const pts = genPoly(R, n, [bx, bx+w, by, by+h]);
    const img = pts.map(p=>applyOp(p, op));
    if(!img.every(p=>inG(p, g))) continue;
    if(img.some(p=>Math.abs(p[0]-Math.round(p[0]))>1e-6 || Math.abs(p[1]-Math.round(p[1]))>1e-6)) continue;
    if(op.t==='s'){
      const side = pts.map(p=>Math.sign(r6(cross3(op.p, op.q, p))));
      if(o.cross){ if(!(side.includes(1) && side.includes(-1))) continue; }
      else if(o.dek){ if(side.filter(x=>x===0).length!==1 || (side.includes(1) && side.includes(-1))) continue; }
      else if(side.includes(0) || (side.includes(1) && side.includes(-1))) continue;
      if(!o.cross){ const dmin = Math.min(...pts.map(p=>Math.hypot(...[0,1].map(k=>p[k]-footPt(p,op.p,op.q)[k])))); if(!o.dek && dmin<1) continue; }
    } else {
      if(img.some(q=>pts.some(p=>ptEq(p,q))) && !o.dekC) continue;
      const C1 = centroid(pts), C2 = centroid(img); if(Math.hypot(C1[0]-C2[0], C1[1]-C2[1]) < (o.minD||3)) continue;
      if((op.t==='r'||op.t==='p') && !o.dekC && (inPoly(op.c, pts) || pts.some(p=>ptEq(p,op.c)))) continue;
      if(o.dekC && !pts.some(p=>ptEq(p,op.c))) continue;
      if(op.t==='p' && o.outside && Math.min(...pts.map(p=>Math.hypot(p[0]-op.c[0],p[1]-op.c[1])))<2) continue;
    }
    if(o.check && !o.check(pts, img, op)) continue;
    return {pts, img, op};
  }
  return null;
}

/* ============================================================
   KAARTEN 1: TRANSFORMATIES HERKENNEN
   ============================================================ */
const HK = {};
const TYPES4 = [['s','spiegeling om een as'],['t','translatie over een vector'],['r','rotatie rond een centrum'],['p','spiegeling om een punt']];
const DEF = {
  s:'Bij een <b>spiegeling om een as</b> ligt elk punt en zijn beeld even ver van de spiegelas, op een loodlijn op die as. De figuur klapt om.',
  t:'Bij een <b>translatie over een vector</b> schuift elk punt even ver, in dezelfde richting en in dezelfde zin. De vector bepaalt de richting, de zin en de grootte.',
  r:'Bij een <b>rotatie rond een centrum over een hoek</b> draait elk punt rond het centrum. De afstand tot het centrum blijft gelijk. Een positieve hoek is tegenwijzerzin.',
  p:'Bij een <b>spiegeling om een punt</b> is het centrum het midden van elk lijnstuk tussen een punt en zijn beeld. Dat is hetzelfde als een rotatie over 180°.'
};
/* figuurtje f en zijn beeld f′ op een rooster */
function iconPairObjs(nm, box, op, tt=1, showEl=true){
  const [x,y,w,h] = box; const C = [x+w/2, y+h/2]; const Cq = applyOpAny(C, op);
  const R0 = Math.max(w,h)/2 + .55;
  const o = [];
  if(showEl) o.push(...opBaseAny(op));
  o.push({t:'img', href:figHref(nm), box});
  if(tt>0) o.push({t:'img', href:figHref(nm), box, m:opMatAny(op, tt), op2: tt<1 ? .75 : null});
  o.push({t:'txt', p:[C[0], C[1]+R0], s:'f', c:'orig', dy:-.4});
  if(tt>=1) o.push({t:'txt', p:[Cq[0], Cq[1]+R0], s:'f'+PR, c:'img', dy:-.4});
  return o;
}
/* samengestelde transformaties (lijst) voor de 'geen'-gevallen */
const applyOpAny = (P, op) => Array.isArray(op) ? op.reduce((Q,o)=>applyOp(Q,o), P) : applyOp(P, op);
function opMatAny(op, t){ if(!Array.isArray(op)) return opMatAt(op, t);
  const mul = (A,B) => [A[0]*B[0]+A[1]*B[2], A[0]*B[1]+A[1]*B[3], A[2]*B[0]+A[3]*B[2], A[2]*B[1]+A[3]*B[3], A[0]*B[4]+A[1]*B[5]+A[4], A[2]*B[4]+A[3]*B[5]+A[5]];
  const n = op.length; let M = [1,0,0,1,0,0]; op.forEach((o,i)=>{ const ti = clamp(t*n - i, 0, 1); M = mul(opMatAt(o, ti), M); }); return M; }
const opBaseAny = op => Array.isArray(op) ? [] : opBase(op);
function iconBoxOK(box, op, g){ const [x,y,w,h] = box; const cs = [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(p=>applyOpAny(p, op)); return cs.every(p=>inG(p, g, .15)); }
function genIconPair(R, kind, g, sz=2.6){
  for(let t=0;t<800;t++){
    const nm = R.pick(FIGS)[0]; const box0 = figBox(nm, 0, 0, sz);
    const box = [r6(R.real(g[0]+.3, g[1]-box0[2]-.3)), r6(R.real(g[2]+.5, g[3]-box0[3]-1)), box0[2], box0[3]];
    box[0] = Math.round(box[0]*2)/2; box[1] = Math.round(box[1]*2)/2;
    const C = [box[0]+box[2]/2, box[1]+box[3]/2];
    let op;
    if(kind==='s'){ op = genAxis(R, g, R.pick(['v','h','d'])); const side = [[box[0],box[1]],[box[0]+box[2],box[1]],[box[0],box[1]+box[3]],[box[0]+box[2],box[1]+box[3]]].map(p=>Math.sign(cross3(op.p,op.q,p))); if(side.includes(0) || (side.includes(1)&&side.includes(-1))) continue; }
    else if(kind==='t'){ op = genOpK(R, g, 't'); }
    else if(kind==='r'){ op = {t:'r', c:[R.int(g[0]+1,g[1]-1), R.int(g[2]+1,g[3]-1)], deg:R.pick(o_rdeg)}; }
    else if(kind==='p'){ op = {t:'p', c:[R.int(g[0]+1,g[1]-1), R.int(g[2]+1,g[3]-1)]}; }
    else if(kind==='g'){ const v = R.pick(['v','h']); const ax = genAxis(R, g, v); const d = R.pick([3,4,-3,-4]); op = [ax, {t:'t', v: v==='v' ? [0,d] : [d,0]}];
      const side = [[box[0],box[1]],[box[0]+box[2],box[1]],[box[0],box[1]+box[3]],[box[0]+box[2],box[1]+box[3]]].map(p=>Math.sign(cross3(ax.p,ax.q,p))); if(side.includes(0) || (side.includes(1)&&side.includes(-1))) continue; }
    if(!iconBoxOK(box, op, g)) continue;
    const Cq = applyOpAny(C, op); if(Math.hypot(C[0]-Cq[0], C[1]-Cq[1]) < sz*1.12) continue;
    if((kind==='r'||kind==='p') && Math.hypot(C[0]-op.c[0], C[1]-op.c[1]) < 1.2) continue;
    return {nm, box, op};
  }
  return null;
}
let o_rdeg = [90,-90];
async function animIcon(F, P, cap, txt){
  const tok = ++F.token; F.base = [];
  try{ await twn(REDUCED?30:1700, t=>{ if(F.alive(tok)) F.draw(iconPairObjs(P.nm, P.box, P.op, Math.max(t,.001), true).filter(o=>!(o.t==='txt' && o.s==='f'+PR))); }); }catch(e){}
  if(!F.alive(tok)) return; F.draw(iconPairObjs(P.nm, P.box, P.op, 1, true)); if(cap && txt) cap.innerHTML = txt;
}

/* --- 1. de vier transformaties bekijken --- */
HK.kijk = { title:'Bekijk de vier transformaties', lvl:1, keep:true, noReset:true,
  instr:'Kies een transformatie en klik op <b>Bekijk de beweging</b>. De grijze lijnen tonen wat er met elk punt gebeurt.',
  build:(b,st)=>{
    const g = [0,12,0,8];
    const fig = {pts:[[2,2],[4,2],[4,3],[3,3],[3,6],[2,6]], names:[]};   /* een L-vormige figuur */
    const fl = {pts:[[2,2],[3,2],[3,4],[5,5],[3,6],[2,6]], names:['A','','','','','']};
    const OPS = { s:{t:'s', p:[6,0], q:[6,8], name:'a'}, t:{t:'t', v:[6,-1], from:[5,7.5], name:['X','Y']}, r:{t:'r', c:[7,6], deg:90, name:'O'}, p:{t:'p', c:[6,4], name:'O'} };
    if(!st.k) st.k = 's';
    const pick = el('div','cf-pick'); b.append(pick);
    const bs = TYPES4.map(([k,l])=>{ const x = el('button','opt',l); x.type='button'; x.addEventListener('click', ()=>{ st.k = k; paint(); reset(); }); pick.append(x); return [k,x]; });
    const F = gridFig(b, {g, maxw:480});
    const cap = el('div','cf-cap'); b.append(cap);
    const ctl = el('div','dyn-ctl'); b.append(ctl);
    const play = ctlBtn(icon('play')+' Bekijk de beweging', async ()=>{ play.disabled = true; const op = OPS[st.k]; F.base = opBase(op); await animFig(F, fl, op, cap, {keep:true}); play.disabled = false; });
    play.style.display='inline-flex'; play.style.alignItems='center'; play.style.gap='.3rem'; ctl.append(play);
    const paint = () => bs.forEach(([k,x])=>x.classList.toggle('chosen', k===st.k));
    function reset(){ F.token++; const op = OPS[st.k]; F.base = opBase(op); F.draw([{t:'poly', pts:fl.pts, c:'orig', names:fl.names}]); cap.innerHTML = DEF[st.k]; }
    paint(); reset();
  }};

/* --- 2. welke transformatie zie je? (figuurtjes) --- */
function herkenKaart(title, lvl, multi){
  return { title, lvl, instr: multi ? 'Vink bij elk paar <b>alle</b> transformaties aan die f afbeelden op f′. Past er geen, kies dan <b>geen</b>.' : 'Door welke transformatie is f′ het beeld van f? Na een juist antwoord zie je de beweging.',
    build:(b,st,save)=>{
      const R = makeR(st); const g = [0,10,0,7];
      o_rdeg = multi ? [90,-90,60,-60,120,180] : [90,-90];
      const kinds = multi ? R.shuffle(['s','t','r','p','g','r']).slice(0,4) : R.shuffle(['s','t','r','p']);
      const grid = el('div','pair-grid'); b.append(grid);
      kinds.forEach((k,i)=>{
        const P = genIconPair(R, k, g); if(!P) return;
        const box = el('div'); grid.append(box);
        const F = gridFig(box, {g, maxw:360}); F.draw(iconPairObjs(P.nm, P.box, P.op, 1, false));
        const cap = el('div','cf-cap'); box.append(cap);
        const is180 = P.op.t==='p' || (P.op.t==='r' && Math.abs(P.op.deg)===180);
        const ansSet = k==='g' ? ['geen'] : is180 ? ['r','p'] : [P.op.t];
        const expl = k==='g' ? 'Geen enkele van de vier transformaties past: f′ is gespiegeld én verschoven.' : is180 ? 'Een halve draai: dat is een rotatie over 180° en dus ook een spiegeling om een punt.' : DEF[P.op.t];
        if(multi) qMulti(box, st, save, 'm'+i, { nr:LET[i]+'.', opts:TYPES4.map(([v,l])=>[v,l]).concat([['geen','geen']]), none:'geen', ans:ansSet, why:expl, whyBad:'Kijk of f′ omgeklapt is (spiegeling om een as), even gedraaid staat (translatie) of gedraaid is (rotatie).',
          onOk:()=>{ if(k!=='g') animIcon(F, P, cap, ''); } });
        else qChoice(box, st, save, 'h'+i, { nr:LET[i]+'.', html:'Welke transformatie?', opts:TYPES4, ans:P.op.t==='r'&&Math.abs(P.op.deg)===180 ? 'p' : P.op.t, alt: is180 ? ['r','p'] : [],
          why:expl, whyAlt:'Een rotatie over 180° is hetzelfde als een spiegeling om een punt.', whyBad: 'Is f′ omgeklapt? Staat f′ in dezelfde stand? Is f′ gedraaid?',
          after:(ok, user)=>{ if(ok) { if(user) animIcon(F, P, cap, ''); else F.draw(iconPairObjs(P.nm, P.box, P.op, 1, true)); } } });
      });
    }};
}
HK.welke = herkenKaart('Welke transformatie zie je?', 1, false);
HK.welke2 = herkenKaart('Vink alle transformaties aan die passen', 2, true);

/* --- 3. foto's --- */
/* foto's die de leerkracht koos (fotokeuze), met de transformatie die erbij hoort */
const PHOTOS = [['s_kasteel','s'],['s_vlinder','s'],['s_berg','s'],['t_voetstappen','t'],['t_vissen','t'],['t_autos','t'],['t_kapstokken','t'],['r_reuzenrad','r'],['r_windmolen','r'],['r_frangipani','r'],['r_roosvenster','r'],['r_molentje','r'],['r_scheepsschroef','r'],['r_ventilator','r'],['p_speelkaart','p'],['p_yinyang','p'],['p_speelkaart2','p'],['p_tegel','p']];
const PHOTO_WHY = {s:'Het ene deel is het spiegelbeeld van het andere: er is een spiegelas.', t:'Dezelfde figuur komt telkens terug, verschoven over dezelfde vector.', r:'De figuur valt op zichzelf als je ze rond het midden draait.', p:'Draai de figuur een halve slag rond het midden: ze valt op zichzelf. Dat is een spiegeling om een punt.'};
function photoQ(parent, st, save, id, ph, nr){
  const host = el('div','photo-q'); parent.append(host);
  qChoice(host, st, save, id, { nr, html:'Welke transformatie herken je?', fig:`<img src="${IMGDIR}foto/${ph[0]}.webp" alt="foto" loading="lazy">`, opts:TYPES4.map(([v,l])=>[v, l.replace(' over een vector','').replace(' rond een centrum','')]),
    ans:ph[1], alt: ph[1]==='p' ? ['r'] : [], why:PHOTO_WHY[ph[1]], whyAlt:'Juist: een halve draai, dus een rotatie over 180°. Dat noem je ook een spiegeling om een punt.', whyBad:'Kijk of je een spiegelas ziet, iets dat telkens verschoven terugkomt of iets dat ronddraait.' });
}
HK.fotos = { title:'Foto’s: welke transformatie herken je?', lvl:1, instr:'Kijk goed naar elke foto. Welke transformatie zie je?', build:(b,st,save)=>{
  const R = makeR(st); const by = k => R.shuffle(PHOTOS.filter(p=>p[1]===k));
  const pick = R.shuffle([by('s')[0], by('t')[0], by('r')[0], by('p')[0], by('t')[1], by('r')[1]]);
  const grid = el('div','pair-grid'); b.append(grid);
  pick.forEach((ph,i)=>photoQ(grid, st, save, 'f'+i, ph, LET[i]+'.'));
}};

/* --- 4. in je leefwereld (sorteren) --- */
HK.leef = { title:'Transformaties in je leefwereld', lvl:2, instr:'Sleep elke kaart naar de juiste bak, of tik een kaart aan en daarna de bak.', build:(b,st,save,key)=>{
  const items = [['Een berg en zijn spiegelbeeld in een stil meer',0],['Een lift gaat van verdieping 0 naar verdieping 3',1],['De grote wijzer van een klok van 12.00 u tot 12.15 u',2],['Een schuifdeur die opengaat',1],
    ['De wieken van een windmolen draaien een kwartslag',2],['De linker- en de rechtervleugel van een vlinder',0],['De bovenste en de onderste helft van een heer op een speelkaart',3],['Een toren op een schaakbord schuift drie vakjes op',1]];
  const R = makeR(st);
  sortEx(b, st, save, key, ['spiegeling om een as','translatie','rotatie','spiegeling om een punt'], R.shuffle(items).map(([t,a])=>({t, ans:a, why:['Er is een spiegelas.','Alles schuift even ver in dezelfde richting.','Er wordt gedraaid rond een centrum.','Een halve draai rond het midden.'][a]})));
}};

/* --- 5. wiskundetaal: zinnen aanvullen --- */
function wordFill(parent, st, save, id, q){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {v:[], cur:0});
  const row = el('div','q'); parent.append(row);
  let k = 0; const html = q.html.replace(/\[\[w\]\]/g, ()=>`<span class="blank" data-b="${k++}" tabindex="0"></span>`);
  row.append(el('div','q-text block lg', (q.nr?`<span class="q-num">${q.nr}</span>`:'') + html));
  const blanks = [...row.querySelectorAll('.blank')];
  const fb = el('div','fb');
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type='button'; act.append(bC); if(quiz) bC.hidden = true;
  row.append(act, fb);
  let locked = false;
  const okAt = i => [].concat(q.ans[i]).includes(s.v[i]);
  function paint(){ blanks.forEach((bl,i)=>{ bl.textContent = s.v[i] || ''; bl.style.minWidth = s.v[i] ? '0' : '6rem'; bl.style.padding = '.1rem .5rem'; bl.style.borderColor = i===s.cur && !locked ? 'var(--orange)' : ''; bl.classList.remove('chip-ok','chip-bad'); }); }
  blanks.forEach((bl,i)=>{ bl.addEventListener('click', ()=>{ if(locked) return; s.cur = i; save(); paint(); if(q.bank) q.bank.focus(row); }); });
  row._fill = w => { if(locked) return; s.v[s.cur] = w; const nx = blanks.findIndex((x,i)=>!s.v[i]); if(nx>=0) s.cur = nx; save(); paint(); fb.textContent=''; };
  function run(silent){
    if(blanks.some((x,i)=>!s.v[i])){ fb.className='fb info'; fb.textContent='Vul eerst alle vakjes in.'; return; }
    const ok = blanks.every((x,i)=>okAt(i)); blanks.forEach((bl,i)=>{ bl.style.borderColor = okAt(i) ? 'var(--ok)' : 'var(--bad)'; bl.style.background = okAt(i) ? 'var(--ok-bg)' : 'var(--bad-bg)'; });
    fb.className = 'fb ' + (ok?'ok':'bad'); fb.innerHTML = ok ? '✅ Juist!' : '❌ Nog niet juist. Kijk naar de vakjes in het rood.';
    s.checked = true; save(); if(!silent) CLres(qid, ok);
  }
  bC.addEventListener('click', ()=>run(false)); paint(); if(s.checked && !quiz) run(true);
  if(quiz) quiz.push({ pts:q.pts||1, grade:()=>blanks.every((x,i)=>okAt(i)), reveal:()=>{ blanks.forEach((bl,i)=>{ bl.style.borderColor = okAt(i) ? 'var(--ok)' : 'var(--bad)'; }); }, lock:()=>{ locked = true; } });
  return row;
}
function wordBank(parent, words){
  const bank = el('div','pool'); bank.style.position = 'sticky'; bank.style.top = '0'; bank.style.background = 'var(--card)'; bank.style.zIndex = '3';
  bank.prepend(el('span','mini-note','Klik op een leeg vakje en daarna op het juiste woord. Een woord mag je meermaals gebruiken.'));
  let target = null;
  words.forEach(w=>{ const c = el('button','opt', w); c.type='button'; c.addEventListener('click', ()=>{ if(target && target._fill) target._fill(w); }); bank.append(c); });
  parent.append(bank);
  return { focus:row=>{ target = row; } };
}
HK.zinnen = { title:'Wiskundetaal: zinnen aanvullen', lvl:2, instr:'Bekijk de tekening en vul aan met de juiste begrippen.', build:(b,st,save)=>{
  const g = [0,18,0,12];
  const A = [8,5], B = [11,5], C = [9,8];
  const T = [A,B,C];
  const rot = {t:'r', c:[7,8], deg:80}, tr = {t:'t', v:[6,2]}, sa = {t:'s', p:[6,0], q:[6,12]}, sz = {t:'p', c:[10,4]};
  const F = gridFig(b, {g, maxw:560});
  const nm = (op, n) => ({t:'poly', pts:T.map(p=>applyOp(p,op)), c:'img', names:n});
  F.draw([{t:'axis', p:sa.p, q:sa.q, n:'a', nAt:'end'}, {t:'arrow', a:[11,10], b:[17,12]}, {t:'pt', p:[11,10], n:'X', c:'orig', r:.9, away:[17,12]}, {t:'pt', p:[17,12], n:'Y', c:'orig', r:.9, away:[11,10]},
    {t:'cen', p:rot.c, n:'O'}, {t:'cen', p:sz.c, n:'Z', away:[11,4]},
    {t:'poly', pts:T, c:'orig', names:['A','B','C']}, nm(rot, ['D','E','F']), nm(tr, ['G','H','I']), nm(sa, ['J','K','L']), nm(sz, ['M','N','P'])]);
  const words = ['het beeld','congruente figuren','rotatie','translatie','spiegeling','centrum','hoek','het punt','de as','de vector','tegenwijzerzin','wijzerzin'];
  const bank = wordBank(b, words);
  const rows = [
    {html:'ΔDEF is [[w]] van ΔABC door een [[w]] rond [[w]] O over een [[w]] van 80° in [[w]].', ans:['het beeld','rotatie',['centrum','het punt'],'hoek','tegenwijzerzin']},
    {html:`ΔGHI is [[w]] van ΔABC door een [[w]] over [[w]] ${vecN('X','Y')}.`, ans:['het beeld','translatie','de vector']},
    {html:'ΔJKL is het beeld van ΔABC door een [[w]] om [[w]] a.', ans:['spiegeling','de as']},
    {html:'ΔMNP is het beeld van ΔABC door een [[w]] om [[w]] Z.', ans:['spiegeling','het punt']},
    {html:'ΔABC en ΔJKL hebben dezelfde vorm en dezelfde grootte. Het zijn [[w]].', ans:['congruente figuren']}];
  rows.forEach((r,i)=>wordFill(b, st, save, 'z'+i, {nr:LET[i]+'.', html:r.html, ans:r.ans, bank}));
}};

/* --- verdieping: wees volledig (figuren met symmetrie) --- */
/* alle transformaties (van de vier) die veelhoek P op veelhoek Q afbeelden */
function classifyPair(P, Q){
  const out = new Set(); const n = P.length; const E1 = edgesOfF([Q]);
  const test = (M, tv) => { const img = P.map(p=>[r6(M[0]*p[0]+M[1]*p[1]+tv[0]), r6(M[2]*p[0]+M[3]*p[1]+tv[1])]); return sameEdgesF(edgesOfF([img]), E1); };
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){ if(i===j) continue;
    const a = [P[1][0]-P[0][0], P[1][1]-P[0][1]], b2 = [Q[j][0]-Q[i][0], Q[j][1]-Q[i][1]];
    if(Math.abs(Math.hypot(...a) - Math.hypot(...b2))>1e-6) continue;
    const th = Math.atan2(b2[1],b2[0]) - Math.atan2(a[1],a[0]);
    /* recht (rotatie of translatie) */
    { const c = Math.cos(th), s = Math.sin(th); const M = [c,-s,s,c]; const tv = [Q[i][0]-(c*P[0][0]-s*P[0][1]), Q[i][1]-(s*P[0][0]+c*P[0][1])];
      if(test(M, tv)){ const d = ((th/D2R)%360+360)%360; if(Math.abs(d)<1e-6 || Math.abs(d-360)<1e-6){ if(Math.hypot(...tv)>1e-6) out.add('t'); } else { out.add('r'); if(Math.abs(d-180)<1e-6) out.add('p'); } } }
    /* gespiegeld */
    { const ph2 = Math.atan2(b2[1],b2[0]) + Math.atan2(a[1],a[0]); const c = Math.cos(ph2), s = Math.sin(ph2); const M = [c,s,s,-c]; const tv = [Q[i][0]-(c*P[0][0]+s*P[0][1]), Q[i][1]-(s*P[0][0]-c*P[0][1])];
      if(test(M, tv)){ const z = [M[0]*tv[0]+M[1]*tv[1]+tv[0], M[2]*tv[0]+M[3]*tv[1]+tv[1]]; if(Math.hypot(...z)<1e-6) out.add('s'); } }
  }
  return [...out];
}
const SHAPES = {
  'gelijkbenige driehoek':[[0,0],[4,0],[2,3]], 'rechthoek':[[0,0],[4,0],[4,2],[0,2]], 'vierkant':[[0,0],[3,0],[3,3],[0,3]], 'parallellogram':[[0,0],[3,0],[4,2],[1,2]],
  'vlieger':[[0,0],[2,-1],[4,0],[2,3]].map(p=>[p[0],p[1]+1]), 'rechthoekige driehoek':[[0,0],[3,0],[0,2]], 'gelijkbenig trapezium':[[0,0],[5,0],[4,2],[1,2]], 'L-vorm':[[0,0],[3,0],[3,1],[1,1],[1,3],[0,3]]
};
HK.volledig = { title:'Wees volledig: welke transformaties passen?', lvl:3, instr:'De figuren hebben soms zelf symmetrie. Dan kunnen er meerdere transformaties passen. Vink ze allemaal aan.', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,12,0,8];
  const keys = R.shuffle(Object.keys(SHAPES)).slice(0,4);
  const grid = el('div','pair-grid'); b.append(grid);
  keys.forEach((k,i)=>{
    let task = null;
    for(let t=0;t<600 && !task;t++){
      const kind = R.pick(['s-v','s-h','t','r90','p','t']); const op = genOpK(R, g, kind);
      const base = SHAPES[k]; const rot = R.pick([0,90,180,270]); const sh = base.map(p=>rotPt(p,[0,0],rot));
      const mnx = Math.min(...sh.map(p=>p[0])), mny = Math.min(...sh.map(p=>p[1]));
      const dx = R.int(g[0]-mnx, g[1]-Math.max(...sh.map(p=>p[0]))), dy = R.int(g[2]-mny, g[3]-Math.max(...sh.map(p=>p[1])));
      const P = sh.map(p=>[r6(p[0]+dx), r6(p[1]+dy)]); const Q = P.map(p=>applyOp(p, op));
      if(!P.every(p=>inG(p,g)) || !Q.every(p=>inG(p,g))) continue;
      if(P.some(p=>Q.some(q=>ptEq(p,q))) ) continue;
      const C1 = centroid(P), C2 = centroid(Q); if(Math.hypot(C1[0]-C2[0], C1[1]-C2[1]) < 3) continue;
      if(op.t==='s'){ const side = P.map(p=>Math.sign(r6(cross3(op.p, op.q, p)))); if(side.includes(0) || (side.includes(1)&&side.includes(-1))) continue; }
      task = {P, Q, op, ans: classifyPair(P, Q)};
    }
    if(!task) return;
    const box = el('div'); grid.append(box);
    const F = gridFig(box, {g, maxw:360}); F.draw([{t:'poly', pts:task.P, c:'orig'}, {t:'poly', pts:task.Q, c:'img'}, {t:'txt', p:centroid(task.P), s:'f', c:'orig', dy:1.6}, {t:'txt', p:centroid(task.Q), s:'f'+PR, c:'img', dy:1.6}]);
    const nmT = {s:'spiegeling om een as', t:'translatie', r:'rotatie', p:'spiegeling om een punt'};
    qMulti(box, st, save, 'v'+i, { nr:LET[i]+'.', html:k, opts:TYPES4.concat([['geen','geen']]), none:'geen', ans:task.ans.length?task.ans:['geen'],
      why:'Passend: ' + task.ans.map(x=>nmT[x]).join(', ') + '.', whyBad:'Probeer elke transformatie in gedachten uit. Een figuur met symmetrie kan op meerdere manieren op f′ terechtkomen.' });
  });
}};

/* --- verdieping: zoek zelf de as, de vector of het centrum --- */
HK.zoek = { title:'Zoek de as, de vector of het centrum', lvl:3, instr:'Kies de transformatie en duid ze aan op het rooster. Bij een as of een vector klik je twee roosterpunten, bij een rotatie of puntspiegeling het centrum.', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,10,0,7];
  const k = R.pick(['s','t','r','p']);
  o_rdeg = [90,-90];
  const P = genIconPair(R, k, g); if(!P){ b.append(el('p','','Klik op Nieuwe opgave.')); return; }
  const s = st.z || (st.z = {k:null, pts:[], deg:''});
  const qid = QID('z'); CLvraag(qid);
  const pick = el('div','choices'); b.append(pick);
  const bs = TYPES4.map(([v,l])=>{ const x = el('button','opt',l); x.type='button'; x.addEventListener('click', ()=>{ if(done) return; s.k = v; s.pts = []; save(); paint(); }); pick.append(x); return [v,x]; });
  const F = gridFig(b, {g, maxw:440});
  const degRow = el('div','q-text', 'Draaihoek: [[0]] °'.replace('[[0]]', `<input type="text" class="inp xs" inputmode="text" aria-label="draaihoek">`)); b.append(degRow);
  const degIn = degRow.querySelector('input'); degIn.value = s.deg||''; degIn.addEventListener('input', ()=>{ s.deg = degIn.value; save(); });
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type='button'; const bW = el('button','linkbtn','Wis'); bW.type='button'; act.append(bC, bW); b.append(act);
  const fb = el('div','fb'); b.append(fb);
  let done = false;
  const userOp = () => { if(s.k==='s' && s.pts.length===2 && !ptEq(s.pts[0],s.pts[1])) return {t:'s', p:s.pts[0], q:s.pts[1]};
    if(s.k==='t' && s.pts.length===2) return {t:'t', v:[s.pts[1][0]-s.pts[0][0], s.pts[1][1]-s.pts[0][1]], from:s.pts[0]};
    if(s.k==='p' && s.pts.length===1) return {t:'p', c:s.pts[0]};
    if(s.k==='r' && s.pts.length===1){ const d = parseAng(s.deg); if(!isNaN(d)) return {t:'r', c:s.pts[0], deg:d}; } return null; };
  function paint(){ bs.forEach(([v,x])=>x.classList.toggle('chosen', v===s.k)); degRow.hidden = s.k!=='r';
    const o = iconPairObjs(P.nm, P.box, P.op, 1, false);
    if(s.k==='s'){ s.pts.forEach(p=>o.push({t:'pt', p, c:'mine'})); if(s.pts.length===2 && !ptEq(s.pts[0],s.pts[1])) o.push({t:'axis', p:s.pts[0], q:s.pts[1], hl:true}); }
    if(s.k==='t'){ if(s.pts[0]) o.push({t:'pt', p:s.pts[0], c:'mine'}); if(s.pts.length===2) o.push({t:'arrow', a:s.pts[0], b:s.pts[1], c:'vec img'}); }
    if(s.k==='r' || s.k==='p'){ if(s.pts[0]) o.push({t:'pt', p:s.pts[0], c:'mine', n:'centrum'}); }
    F.draw(o); }
  F.clickable(p=>{ if(done || !s.k) { if(!s.k){ fb.className='fb info'; fb.textContent='Kies eerst de transformatie.'; } return; } const max = (s.k==='s'||s.k==='t') ? 2 : 1; if(s.pts.length>=max) s.pts = []; s.pts.push(p); save(); paint(); });
  bW.addEventListener('click', ()=>{ if(done) return; s.pts = []; save(); paint(); });
  const corners = () => { const [x,y,w,h] = P.box; return [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]; };
  function run(){
    if(!s.k){ fb.className='fb info'; fb.textContent='Kies eerst de transformatie.'; return; }
    const u = userOp(); if(!u){ fb.className='fb info'; fb.textContent = s.k==='r' ? 'Klik het centrum aan en typ de draaihoek.' : s.k==='p' ? 'Klik het centrum aan.' : 'Klik twee roosterpunten.'; return; }
    const ok = corners().every(c=>ptEq(applyOp(c,u), applyOpAny(c,P.op), 1e-4));
    fb.className = 'fb ' + (ok?'ok':'bad');
    if(ok){ fb.innerHTML = '✅ Juist! ' + DEF[s.k]; done = true; s.done = true; save(); CLres(qid, true); animIcon(F, {...P, op:u}, null, ''); bC.hidden = true; bW.hidden = true; return; }
    let msg = '';
    if(s.k!==P.op.t && !(s.k==='r' && P.op.t==='p') && !(s.k==='p' && P.op.t==='r' && Math.abs(P.op.deg)===180)) msg = 'Kijk eerst welke transformatie het is: is f′ omgeklapt, verschoven of gedraaid?';
    else if(s.k==='s') msg = 'De as ligt precies in het midden tussen f en f′ en staat loodrecht op de lijn tussen een punt en zijn beeld.';
    else if(s.k==='t') msg = 'Tel hoeveel hokjes een hoekpunt van f verschuift tot het overeenkomende hoekpunt van f′.';
    else if(s.k==='r') msg = 'Het centrum ligt even ver van een punt en zijn beeld. Een positieve hoek is tegenwijzerzin.';
    else msg = 'Het centrum is het midden tussen een punt van f en het overeenkomende punt van f′.';
    fb.innerHTML = '❌ Nog niet juist. ' + msg; CLres(qid, false);
  }
  bC.addEventListener('click', run);
  if(s.done){ done = true; bC.hidden = true; bW.hidden = true; fb.className='fb ok'; fb.innerHTML='✅ Juist! ' + DEF[s.k]; const u = userOp(); paint(); if(u) F.draw(iconPairObjs(P.nm, P.box, u, 1, true)); } else paint();
}};

/* ============================================================
   KAARTEN 2: SPIEGELEN OM EEN AS
   ============================================================ */
const AS = {};
AS.kijk = { title:'Bekijk het stappenplan', lvl:1, keep:true, noReset:true,
  instr:'Kies een spiegelas en klik op <b>Bekijk de uitleg</b>. Sleep het punt <b>A</b> naar een andere plaats en kijk opnieuw.',
  build:(b,st)=>{
    const g = [0,12,0,8];
    const AX = {v:{t:'s', p:[6,0], q:[6,8], name:'a'}, h:{t:'s', p:[0,4], q:[12,4], name:'a'}, d:{t:'s', p:[2,0], q:[10,8], name:'a'}};
    if(!st.k) st.k = 'v'; if(!st.A) st.A = [3,6];
    const pick = el('div','cf-pick'); b.append(pick);
    const bs = [['v','verticale as'],['h','horizontale as'],['d','schuine as']].map(([k,l])=>{ const x = el('button','opt',l); x.type='button'; x.addEventListener('click', ()=>{ st.k = k; paint(); reset(); }); pick.append(x); return [k,x]; });
    const F = gridFig(b, {g, maxw:480});
    const cap = el('div','cf-cap'); b.append(cap);
    const ctl = el('div','dyn-ctl'); b.append(ctl);
    let busy = false;
    const play = ctlBtn(icon('play')+' Bekijk de uitleg', async ()=>{ if(busy) return; busy = true; play.disabled = true; await stapAs(F, st.A, AX[st.k], cap); busy = false; play.disabled = false; });
    play.style.display='inline-flex'; play.style.alignItems='center'; play.style.gap='.3rem'; ctl.append(play);
    const paint = () => bs.forEach(([k,x])=>x.classList.toggle('chosen', k===st.k));
    function reset(){ F.token++; const op = AX[st.k]; F.base = opBase(op); const Q = applyOp(st.A, op); const out = !inG(Q, g); play.disabled = out || busy;
      F.draw([{t:'pt', p:st.A, n:'A', c:'orig'}]); cap.innerHTML = out ? 'A′ valt buiten het rooster. Sleep A naar een andere plaats.' : (Math.abs(cross3(op.p,op.q,st.A))<1e-9 ? 'A ligt op de spiegelas: A is een <b>dekpunt</b>. A′ = A.' : ''); }
    let drag = false;
    const snap = e => { const w = F.toW(e); return [clamp(Math.round(w[0]),g[0],g[1]), clamp(Math.round(w[1]),g[2],g[3])]; };
    F.svg.addEventListener('pointerdown', e=>{ if(busy) return; const p = snap(e); if(Math.hypot(p[0]-st.A[0], p[1]-st.A[1])<=1.5){ drag = true; e.preventDefault(); try{ F.svg.setPointerCapture(e.pointerId); }catch(_){} } });
    F.svg.addEventListener('pointermove', e=>{ if(!drag) return; const p = snap(e); if(ptEq(p, st.A)) return; st.A = p; reset(); });
    const up = ()=>{ drag = false; }; F.svg.addEventListener('pointerup', up); F.svg.addEventListener('pointercancel', up); F.svg.style.cursor = 'grab';
    paint(); reset();
  }};
async function stapAs(F, A, op, cap){
  const tok = ++F.token; const say = stepSay(cap);
  const S = footPt(A, op.p, op.q), Q = applyOp(A, op);
  const base = [{t:'pt', p:A, n:'A', c:'orig'}];
  const run = async (dur, fn) => { if(!F.alive(tok)) throw 0; await twn(REDUCED?30:dur*SLOW, t=>{ if(F.alive(tok)) fn(t); }); if(!F.alive(tok)) throw 0; };
  const pause = async d => { await wait(REDUCED?30:d*SLOW+400); if(!F.alive(tok)) throw 0; };
  try{
    if(ptEq(A,S)){ say('A ligt op de spiegelas. A heeft zichzelf als beeld: A is een <b>dekpunt</b>.'); F.draw(base); return; }
    const d = [op.q[0]-op.p[0], op.q[1]-op.p[1]]; const L = Math.hypot(...d); const u = [d[0]/L, d[1]/L]; const n = [A[0]-S[0], A[1]-S[1]]; const Ln = Math.hypot(...n);
    const mk = {t:'right', v:S, d1:u, d2:[n[0]/Ln, n[1]/Ln]};
    say('<b>Stap 1.</b> Teken door A een stippellijn <b>loodrecht</b> op de spiegelas a.');
    await run(1000, t=>F.draw(base.concat([{t:'line', a:A, b:lerp2(A,S,t)}])));
    await pause(300);
    say('<b>Stap 2.</b> Noem S het snijpunt van de loodlijn met a. De hoek bij S is recht.');
    F.draw(base.concat([{t:'line', a:A, b:S}, mk, {t:'pt', p:S, n:'S', c:'cen', away:A}])); await pause(1300);
    say('<b>Stap 3.</b> Teken A′ aan de andere kant zodat |AS| = |SA′|.');
    await run(1000, t=>F.draw(base.concat([{t:'line', a:A, b:lerp2(S,Q,t)}, mk, {t:'pt', p:S, n:'S', c:'cen', away:A}, {t:'ticks', a:A, b:S}, {t:'pt', p:lerp2(S,Q,t), c:'ghost'}])));
    F.draw(base.concat([{t:'line', a:A, b:Q}, mk, {t:'pt', p:S, n:'S', c:'cen', away:A}, {t:'ticks', a:A, b:S}, {t:'ticks', a:S, b:Q}, {t:'pt', p:Q, n:'A'+PR, c:'img', away:S}]));
    say(`A′ is het beeld van A door de spiegeling om a. Je noteert s<sub>a</sub>(A) = A′.`);
  }catch(e){ if(e!==0) console.error(e); }
}
/* spiegelopgave op het rooster */
function asTaak(title, lvl, o){
  return { title, lvl, instr:o.instr || 'Klik op het rooster waar de beeldpunten komen. Kies eerst welk punt je plaatst. Klik op <b>Controleer</b> als alle punten staan.', build:(b,st,save)=>{
    const R = makeR(st); const g = o.g || [0,12,0,8];
    const items = o.items || [o];
    items.forEach((it,i)=>{
      const T = genTask(R, it.n, g, it.kind, it.opt||{}); if(!T){ b.append(el('p','','Klik op Nieuwe opgave.')); return; }
      const names = (it.n===1 ? [R.pick(['A','B','P','K'])] : (it.n===3 ? R.pick(NAMES3) : R.pick(NAMES4)).split(''));
      const an = R.pick(AXN); T.op.name = an; T.op.nAt = 'start';
      const fig = {pts:T.pts, names};
      const txt = it.html ? it.html(names, an, T) : `${it.n===1?'':(it.n===3?'Δ':'')}Teken het beeld van ${it.n===1?'het punt ':it.n===3?'Δ':'de vierhoek '}${names.join('')} door de spiegeling om de as ${an}.`;
      if(items.length>1) b.append(el('div','sub', `<b>${LET[i]}.</b>`));
      placeTask(b, st, save, 'p'+i, {g, fig, op:T.op, base:opBase(T.op), html:txt.replace(/^Δ?Teken/,'Teken').replace('door de spiegeling om de as '+an, `door de spiegeling om de as <i>${an}</i>`),
        end:`s<sub>${an}</sub>(${it.n===3?'Δ':''}${names.join('')}) = ${it.n===3?'Δ':''}${names.map(n=>n+PR).join('')}` + (it.opt && it.opt.dek ? `. ${names[T.pts.findIndex(p=>Math.abs(cross3(T.op.p,T.op.q,p))<1e-9)]} ligt op de as: dat punt is een <b>dekpunt</b>.` : '') + (it.opt && it.opt.cross ? '. De punten op de as blijven liggen; de rest klapt om.' : '')});
    });
  }};
}
AS.punt = asTaak('Spiegel een punt', 1, {items:[{n:1, kind:'s-v'}, {n:1, kind:'s-h'}], instr:'Klik op het rooster waar het beeldpunt komt en klik op <b>Controleer</b>.'});
AS.verticaal = asTaak('Spiegel een driehoek om een verticale as', 1, {n:3, kind:'s-v'});
AS.horizontaal = asTaak('Spiegel een vierhoek om een horizontale as', 1, {n:4, kind:'s-h', opt:{dek:true}});
AS.dekpunt = { title:'Wat is een dekpunt?', lvl:1, build:(b,st,save)=>{
  const R = makeR(st); const g = [0,10,0,6];
  const c = R.int(3,7); const R0 = [c, R.int(1,5)], P0 = [c-R.int(1,2), R.int(1,5)], Q0 = [c+R.int(2,3), R.int(1,5)];
  const F = gridFig(b, {g, maxw:360}); F.draw([{t:'axis', p:[c,0], q:[c,6], n:'a', nAt:'start'}, {t:'pt', p:P0, n:'P', c:'orig'}, {t:'pt', p:Q0, n:'Q', c:'orig'}, {t:'pt', p:R0, n:'R', c:'orig'}]);
  qChoice(b, st, save, 'd', { html:'Bij de spiegeling om de as a is één van deze punten een dekpunt. Welk punt, en waarom?',
    opts:R.shuffle([['a','P, want P ligt het dichtst bij de as.'],['b','R, want R ligt op de spiegelas: R heeft zichzelf als beeld.'],['c','Q, want Q ligt het verst van de as.'],['d','Geen enkel punt: bij een spiegeling verandert elk punt van plaats.']]),
    ans:'b', why:'Een dekpunt is een punt dat zichzelf als beeld heeft. Bij een spiegeling om een as zijn dat de punten op de as.', whyBad:'Een dekpunt verandert niet van plaats. Welk punt blijft liggen als je spiegelt?' });
}};
AS.schuin = asTaak('Spiegelen om een schuine as', 2, {n:3, kind:'s-d'});
AS.door = asTaak('De as gaat door de figuur', 2, {n:4, kind:'s', opt:{cross:true}, instr:'De spiegelas snijdt de figuur. Punten op de as zijn dekpunten. Klik waar de beeldpunten komen.'});
AS.teken = { title:'Teken de spiegelas', lvl:2, instr:'[X′Y′] is het spiegelbeeld van [XY]. Klik twee roosterpunten die op de spiegelas liggen.', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,12,0,8];
  const T = genTask(R, 2, g, 's', {check:(pts,img)=>Math.hypot(pts[0][0]-pts[1][0], pts[0][1]-pts[1][1])>=3});
  const fig = {pts:T.pts, names:['X','Y'], open:true};
  placeTask(b, st, save, 'a', {g, fig, op:T.op, mode:'as', ans:[T.op.p, T.op.q],
    figObjs:()=>[{t:'poly', pts:T.pts, c:'orig', names:['X','Y'], open:true}, {t:'poly', pts:T.img, c:'img', names:['X'+PR,'Y'+PR], open:true}],
    solObjs:()=>[{t:'axis', p:T.op.p, q:T.op.q, n:'a', hl:true}, ...helpObjs(T.op, T.pts[0], T.img[0], g), ...helpObjs(T.op, T.pts[1], T.img[1], g)],
    end:'De spiegelas staat loodrecht op [XX′] en [YY′] en gaat door hun middens.' });
}};
/* verdieping: stap voor stap klikken */
AS.stappen = { title:'Stap voor stap op een schuine as', lvl:3, instr:'Volg het stappenplan. Klik telkens het gevraagde punt op het rooster aan (ook tussen de roosterpunten in, op een half hokje).', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,12,0,8];
  let A, op; for(let t=0;t<300;t++){ op = genAxis(R, g, 'd'); A = [R.int(1,11), R.int(1,7)]; const Q = applyOp(A,op); const S = footPt(A, op.p, op.q); if(inG(Q,g) && Math.hypot(A[0]-S[0],A[1]-S[1])>=1.4 && (Math.abs(S[0]*2-Math.round(S[0]*2))<1e-9)) break; }
  op.name = 'a'; op.nAt='start'; const S = footPt(A, op.p, op.q), Q = applyOp(A, op);
  const two = el('div','cf-two'); b.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
  const F = gridFig(L, {g, maxw:440}); F.base = opBase(op);
  const s = st.k || (st.k = {click:null});
  let stage = 0;
  const draw = () => { const o = [{t:'pt', p:A, n:'A', c:'orig'}];
    if(stage>=1){ o.push({t:'line', a:A, b:S}, {t:'pt', p:S, n:'S', c:'cen', away:A}); const d = [op.q[0]-op.p[0], op.q[1]-op.p[1]], Ld = Math.hypot(...d), n = [A[0]-S[0], A[1]-S[1]], Ln = Math.hypot(...n); o.push({t:'right', v:S, d1:[d[0]/Ld,d[1]/Ld], d2:[n[0]/Ln,n[1]/Ln]}); }
    if(stage>=2) o.push({t:'line', a:S, b:Q}, {t:'ticks', a:A, b:S}, {t:'ticks', a:S, b:Q}, {t:'pt', p:Q, n:'A'+PR, c:'img', away:S});
    if(s.click && stage<2) o.push({t:'pt', p:s.click, c:'mine'}); F.draw(o); };
  F.clickable(p=>{ s.click = p; save(); draw(); }, {step:.5});
  Rt.append(el('div','opg', `Spiegel <b>A</b> om de schuine as <i>a</i>. Je mag ook op een half hokje klikken.`));
  const steps = [
    {h:'Teken door A een loodlijn op a. Klik het snijpunt S van die loodlijn met a aan.', check:()=>{ if(!s.click) return {ok:false, msg:'Klik eerst een punt op het rooster.'}; const ok = ptEq(s.click, S); return {ok, msg: ok ? 'S ligt op a, en AS staat loodrecht op a.' : (Math.abs(cross3(op.p,op.q,s.click))<1e-9 ? 'Dat punt ligt op a, maar AS staat niet loodrecht op a. Volg de diagonaal van de hokjes.' : 'S moet op de as a liggen.')}; },
      after:()=>{ stage = 1; s.click = null; save(); draw(); return Promise.resolve(); }},
    {h:'Klik A′ aan: aan de andere kant van a, met |AS| = |SA′|.', check:()=>{ if(!s.click) return {ok:false, msg:'Klik eerst een punt op het rooster.'}; const ok = ptEq(s.click, Q); return {ok, msg: ok ? '' : 'Ga vanuit S even ver door als van A naar S.'}; },
      after:()=>{ stage = 2; s.click = null; save(); draw(); return Promise.resolve(); }}
  ];
  qSteps(Rt, st, save, 'st', {steps, end:'s<sub>a</sub>(A) = A′. Zo spiegel je elk punt, ook op papier zonder ruitjes.', restore:n=>{ stage = n; draw(); }});
  draw();
}};

/* ============================================================
   KAARTEN 3: TRANSLATIE OVER EEN VECTOR
   ============================================================ */
const TR = {};
TR.kijk = { title:'Bekijk hoe je verschuift', lvl:1, keep:true, noReset:true,
  instr:'Sleep het begin- of eindpunt van de vector en klik op <b>Bekijk de beweging</b>. Kijk wat er gelijk blijft.',
  build:(b,st)=>{
    const g = [0,12,0,8];
    if(!st.X) st.X = [7,6]; if(!st.Y) st.Y = [11,4];
    const fig = {pts:[[1,2],[4,2],[2,5]], names:['A','B','C']};
    const F = gridFig(b, {g, maxw:480});
    const cap = el('div','cf-cap'); b.append(cap);
    const ctl = el('div','dyn-ctl'); b.append(ctl);
    let busy = false;
    const op = () => ({t:'t', v:[st.Y[0]-st.X[0], st.Y[1]-st.X[1]], from:st.X, name:['X','Y']});
    const play = ctlBtn(icon('play')+' Bekijk de beweging', async ()=>{ if(busy) return; busy = true; play.disabled = true; F.base = opBase(op()); await animFig(F, fig, op(), cap, {end:`Elk punt schuift even ver, in dezelfde richting en zin als ${vecN('X','Y')}. Dus |XY| = |AA′| = |BB′| = |CC′| en ${vecN('X','Y')} = ${vecN('A','A'+PR)}: het zijn <b>gelijke vectoren</b>.`}); busy = false; play.disabled = false; });
    play.style.display='inline-flex'; play.style.alignItems='center'; play.style.gap='.3rem'; ctl.append(play);
    function reset(){ F.token++; const o = op(); F.base = opBase(o); const out = !fig.pts.every(p=>inG(applyOp(p,o), g)) || ptEq(st.X, st.Y); play.disabled = out || busy;
      F.draw([{t:'poly', pts:fig.pts, c:'orig', names:fig.names}]); cap.innerHTML = out ? 'Het beeld valt buiten het rooster. Maak de vector korter of draai hem.' : `${vecN('X','Y')}: ${Math.abs(o.v[0])} ${o.v[0]>=0?'naar rechts':'naar links'} en ${Math.abs(o.v[1])} ${o.v[1]>=0?'naar boven':'naar beneden'}.`; }
    let drag = null;
    const snap = e => { const w = F.toW(e); return [clamp(Math.round(w[0]),g[0],g[1]), clamp(Math.round(w[1]),g[2],g[3])]; };
    F.svg.addEventListener('pointerdown', e=>{ if(busy) return; const p = snap(e); drag = Math.hypot(p[0]-st.Y[0], p[1]-st.Y[1])<=1.2 ? 'Y' : Math.hypot(p[0]-st.X[0], p[1]-st.X[1])<=1.2 ? 'X' : null; if(drag){ e.preventDefault(); try{ F.svg.setPointerCapture(e.pointerId); }catch(_){} } });
    F.svg.addEventListener('pointermove', e=>{ if(!drag) return; const p = snap(e); if(ptEq(p, st[drag])) return; st[drag] = p; reset(); });
    const up = ()=>{ drag = null; }; F.svg.addEventListener('pointerup', up); F.svg.addEventListener('pointercancel', up); F.svg.style.cursor = 'grab';
    reset();
  }};
TR.waar = { title:'Vectoren: waar of niet waar?', lvl:1, instr:'ΔA′B′C′ is het beeld van ΔABC door de translatie over de vector XY. Waar of niet waar?', build:(b,st,save)=>{
  const g = [0,12,0,8]; const op = {t:'t', v:[5,-2], from:[6,7], name:['X','Y']}; const fig = {pts:[[1,4],[4,5],[2,7]], names:['A','B','C']};
  const F = gridFig(b, {g, maxw:440}); F.base = opBase(op); F.draw(finalFig(fig, op));
  const R = makeR(st);
  wnRows(b, st, save, 'w', R.shuffle([
    {s:`${vecN('X','Y')} = ${vecN('A','A'+PR)}`, ans:'w', why:'Ze hebben dezelfde richting, zin en grootte.'},
    {s:`${vecN('X','Y')} = ${vecN('Y','X')}`, ans:'n', why:`${vecN('X','Y')} en ${vecN('Y','X')} hebben een andere zin: het zijn tegengestelde vectoren.`},
    {s:'|XY| = |CC′|', ans:'w', why:'Elk punt schuift even ver.'},
    {s:'De vector bepaalt enkel hoe ver je verschuift.', ans:'n', why:'De vector bepaalt de richting, de zin én de grootte.'},
    {s:'AA′ ∥ BB′', ans:'w', why:'Alle punten schuiven in dezelfde richting.'},
    {s:`${vecN('X','Y')} en ${vecN('Y','X')} zijn tegengestelde vectoren.`, ans:'w', why:'Ze zijn even lang en evenwijdig, maar wijzen in de andere zin.'}]));
}};
function trTaak(title, lvl, o){
  return { title, lvl, instr:o.instr || 'Klik op het rooster waar de beeldpunten komen en klik op <b>Controleer</b>.', build:(b,st,save)=>{
    const R = makeR(st); const g = [0,12,0,8];
    const T = genTask(R, o.n, g, 't', {minD:3.5}); if(!T){ b.append(el('p','','Klik op Nieuwe opgave.')); return; }
    const names = (o.n===3 ? R.pick(NAMES3) : R.pick(NAMES4)).split('');
    const fig = {pts:T.pts, names};
    if(!o.hide){ /* vector ergens vrij op het rooster */ T.op.from = vecFrom(R, g, T.op.v, T.pts.concat(T.img)); T.op.name = ['X','Y']; }
    else T.op.hide = true;
    const v = T.op.v; const hk = `${Math.abs(v[0])} hokje${Math.abs(v[0])===1?'':'s'} naar ${v[0]>=0?'rechts':'links'} en ${Math.abs(v[1])} hokje${Math.abs(v[1])===1?'':'s'} naar ${v[1]>=0?'boven':'beneden'}`;
    const html = o.hide ? `Verschuif ${o.n===3?'ΔABC'.replace('ABC',names.join('')):'de vierhoek '+names.join('')} <b>${hk}</b>.` : `Teken het beeld van ${o.n===3?'Δ':'de vierhoek '}${names.join('')} door de translatie over ${vecN('X','Y')}.`;
    placeTask(b, st, save, 'p', {g, fig, op:T.op, base:opBase(T.op), html, end: o.hide ? `Dit is een translatie: ${hk}.` : `t<sub>${vecN('X','Y')}</sub>(${o.n===3?'Δ':''}${names.join('')}) = ${o.n===3?'Δ':''}${names.map(n=>n+PR).join('')}`});
  }};
}
TR.vector = trTaak('Verschuif over de vector', 1, {n:3});
TR.hokjes = trTaak('Verschuif een aantal hokjes', 1, {n:4, hide:true});
TR.vier = trTaak('Verschuif een vierhoek', 2, {n:4});
TR.tekenVec = { title:'Teken een vector van deze translatie', lvl:2, instr:'De oranje figuur is het beeld van de blauwe door een translatie. Klik het beginpunt en daarna het eindpunt van een vector die bij deze translatie hoort.', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,12,0,8]; const T = genTask(R, 3, g, 't', {minD:4}); const names = R.pick(NAMES3).split('');
  placeTask(b, st, save, 'v', {g, fig:{pts:T.pts, names}, op:T.op, mode:'vec', ans:T.op.v,
    figObjs:()=>[{t:'poly', pts:T.pts, c:'orig', names}, {t:'poly', pts:T.img, c:'img', names:names.map(n=>n+PR)}],
    solObjs:(rev)=>[{t:'arrow', a:T.pts[0], b:T.img[0], c:'vec img'}],
    end:`Elke vector van een punt naar zijn beeld is juist, bijvoorbeeld ${vecN(names[0], names[0]+PR)}. Waar je begint, maakt niet uit.` });
}};
TR.welke = { title:'Welke vector hoort bij de verschuiving?', lvl:2, build:(b,st,save)=>{
  const R = makeR(st); const g = [0,14,0,9];
  let T, v, cands, placed, segs, objs, ok=0; const labels = [['A','B'],['C','D'],['E','F'],['G','H']];
  const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const segX=(a,b,c,d)=>{ const d1=cr(c,d,a), d2=cr(c,d,b), d3=cr(a,b,c), d4=cr(a,b,d); if(d1*d2<0&&d3*d4<0) return true; if(d1===0&&d2===0) return Math.min(a[0],b[0])<=Math.max(c[0],d[0])&&Math.min(c[0],d[0])<=Math.max(a[0],b[0])&&Math.min(a[1],b[1])<=Math.max(c[1],d[1])&&Math.min(c[1],d[1])<=Math.max(a[1],b[1]); return false; };
  for(let at=0; at<60 && ok<4; at++){
  T = null; for(let t=0;t<300;t++){ T = genTask(R, 4, g, 't', {minD:4, w:3, h:3}); if(T) break; }
  v = T.op.v; cands = R.shuffle([v, [-v[0],-v[1]], [v[1], v[0]].map((x,i)=>x===v[i]?x+1:x), [v[0], -v[1]].map((x,i)=>i===1&&x===v[1]?x+2:x)]).filter((w,i,a)=>a.findIndex(z=>ptEq(z,w))===i);
  while(cands.length<4) cands.push([v[0]+cands.length, v[1]]);
  placed = []; segs = []; objs = [{t:'poly', pts:T.pts, c:'orig'}, {t:'poly', pts:T.img, c:'img'}]; ok = 0;
  [T.pts, T.img].forEach(P=>P.forEach((p,j)=>segs.push([p, P[(j+1)%P.length]])));
  cands.slice(0,4).forEach((w,i)=>{ for(let t=0;t<600;t++){ const fr = [R.int(0,14), R.int(0,9)], to = [fr[0]+w[0], fr[1]+w[1]];
    if(!inG(to,g)) continue; if(placed.some(p=>Math.hypot(p[0]-fr[0],p[1]-fr[1])<2.5 || Math.hypot(p[0]-to[0],p[1]-to[1])<2.5)) continue;
    if(T.pts.concat(T.img).some(p=>Math.hypot(p[0]-fr[0],p[1]-fr[1])<1.5 || Math.hypot(p[0]-to[0],p[1]-to[1])<1.5)) continue;
    if(segs.some(q=>segX(q[0],q[1],fr,to))) continue;
    segs.push([fr,to]); placed.push(fr, to); objs.push({t:'arrow', a:fr, b:to, c:'vec'}, {t:'pt', p:fr, n:labels[i][0], c:'orig', r:.8, away:to}, {t:'pt', p:to, n:labels[i][1], c:'orig', r:.8, away:fr}); ok++; break; } });
  }
  const F = gridFig(b, {g, maxw:500}); F.draw(objs);
  const ansI = cands.findIndex(w=>ptEq(w,v));
  qChoice(b, st, save, 'w', { html:'De oranje vierhoek is het beeld van de blauwe door een verschuiving. Welke vector hoort bij deze verschuiving?', sym:true, opts:labels.map((l,i)=>[String(i), vecN(l[0],l[1])]), ans:String(ansI),
    why:'Die vector heeft dezelfde richting, zin en grootte als de verschuiving.', whyBad:'Tel bij een hoekpunt hoeveel hokjes het naar rechts of links en naar boven of beneden verschuift. Let ook op de zin van de pijl.' });
}};
TR.gelijk = { title:'Gelijke en tegengestelde vectoren', lvl:3, instr:'Gelijke vectoren hebben dezelfde richting, zin en grootte. Tegengestelde vectoren hebben dezelfde richting en grootte, maar een andere zin.', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,14,0,8];
  let v; do{ v = [R.int(-4,4), R.int(-3,3)]; }while(Math.hypot(...v)<2.5);
  const list = R.shuffle([['eq',v],['eq',v],['op',[-v[0],-v[1]]],['other',[v[0],v[1]+(v[1]>0?-1:1)]],['other',[-v[1],v[0]]],['op',[-v[0],-v[1]]]]);
  const L = ['AB','CD','EF','GH','KL','MN','PQ'];
  const objs = []; const placed = []; const info = [];
  const base = [R.int(0,3), R.int(0,8)];
  let main = null; for(let t=0;t<400 && !main;t++){ const fr = [R.int(0,14), R.int(0,8)], to = [fr[0]+v[0], fr[1]+v[1]]; if(inG(to,g)){ main = [fr,to]; placed.push(fr,to); } }
  objs.push({t:'arrow', a:main[0], b:main[1], c:'vec img'}, {t:'pt', p:main[0], n:'X', c:'img', r:.8, away:main[1]}, {t:'pt', p:main[1], n:'Y', c:'img', r:.8, away:main[0]});
  list.forEach(([k,w],i)=>{ for(let t=0;t<600;t++){ const fr = [R.int(0,14), R.int(0,8)], to = [fr[0]+w[0], fr[1]+w[1]]; if(!inG(to,g)) continue; if(placed.some(p=>Math.hypot(p[0]-fr[0],p[1]-fr[1])<2 || Math.hypot(p[0]-to[0],p[1]-to[1])<2)) continue;
    placed.push(fr,to); objs.push({t:'arrow', a:fr, b:to}, {t:'pt', p:fr, n:L[i][0], c:'orig', r:.8, away:to}, {t:'pt', p:to, n:L[i][1], c:'orig', r:.8, away:fr}); info.push({n:L[i], k}); break; } });
  const F = gridFig(b, {g, maxw:520}); F.draw(objs);
  const opts = info.map(x=>[x.n, vecN(x.n[0], x.n[1])]);
  qMulti(b, st, save, 'g', { nr:'a.', html:`Welke vectoren zijn <b>gelijk</b> aan ${vecN('X','Y')}?`, opts, ans:info.filter(x=>x.k==='eq').map(x=>x.n), why:'Dezelfde richting, dezelfde zin en dezelfde grootte.', whyBad:'Tel de hokjes naar rechts of links en naar boven of beneden, en let op de pijl.' });
  qMulti(b, st, save, 't', { nr:'b.', html:`Welke vectoren zijn <b>tegengesteld</b> aan ${vecN('X','Y')}?`, opts, ans:info.filter(x=>x.k==='op').map(x=>x.n), why:'Even lang en evenwijdig, maar in de andere zin.', whyBad:'Een tegengestelde vector is even lang en evenwijdig, maar wijst de andere kant op.' });
}};

/* ============================================================
   KAARTEN 4: ROTATIE ROND EEN CENTRUM
   ============================================================ */
const RT = {};
RT.kijk = { title:'Bekijk hoe je draait', lvl:1, keep:true, noReset:true,
  instr:'Kies een hoek en klik op <b>Bekijk de beweging</b>. Sleep het centrum <b>O</b> naar een andere plaats.',
  build:(b,st)=>{
    const g = [0,12,0,8]; if(st.d==null) st.d = 90; if(!st.O) st.O = [6,3];
    const fig = {pts:[[7,4],[9,4],[9,5],[8,5],[8,7],[7,7]], names:['A','','','','','']};
    const pick = el('div','cf-pick'); b.append(pick);
    const bs = [90,-90,60,-120,150,180].map(d=>{ const x = el('button','opt', `r(O, ${degTxt(d)})`); x.type='button'; x.addEventListener('click', ()=>{ st.d = d; paint(); reset(); }); pick.append(x); return [d,x]; });
    const F = gridFig(b, {g, maxw:480});
    const cap = el('div','cf-cap'); b.append(cap);
    const ctl = el('div','dyn-ctl'); b.append(ctl);
    let busy = false;
    const op = () => ({t:'r', c:st.O, deg:st.d, name:'O'});
    const play = ctlBtn(icon('play')+' Bekijk de beweging', async ()=>{ if(busy) return; busy = true; play.disabled = true; F.base = opBase(op()); await animFig(F, fig, op(), cap, {end:`Elk punt draait over ${degTxt(Math.abs(st.d))} in ${zinTxt(st.d)} rond O. De afstand tot O blijft gelijk: |OA| = |OA′|.${st.d===180?' Een rotatie over 180° is een spiegeling om het punt O.':''}`}); busy = false; play.disabled = false; });
    play.style.display='inline-flex'; play.style.alignItems='center'; play.style.gap='.3rem'; ctl.append(play);
    const paint = () => bs.forEach(([d,x])=>x.classList.toggle('chosen', d===st.d));
    function reset(){ F.token++; F.base = opBase(op()); const out = !fig.pts.every(p=>inG(applyOp(p,op()), [-1,13,-1,9])); play.disabled = out || busy;
      F.draw([{t:'poly', pts:fig.pts, c:'orig', names:fig.names}]); cap.innerHTML = out ? 'Het beeld valt buiten het rooster. Sleep O naar een andere plaats.' : `r(O, ${degTxt(st.d)}): een rotatie rond het centrum O over ${degTxt(Math.abs(st.d))} in <b>${zinTxt(st.d)}</b>.`; }
    let drag = false;
    const snap = e => { const w = F.toW(e); return [clamp(Math.round(w[0]),g[0],g[1]), clamp(Math.round(w[1]),g[2],g[3])]; };
    F.svg.addEventListener('pointerdown', e=>{ if(busy) return; const p = snap(e); if(Math.hypot(p[0]-st.O[0], p[1]-st.O[1])<=1.3){ drag = true; e.preventDefault(); try{ F.svg.setPointerCapture(e.pointerId); }catch(_){} } });
    F.svg.addEventListener('pointermove', e=>{ if(!drag) return; const p = snap(e); if(ptEq(p, st.O)) return; st.O = p; reset(); });
    const up = ()=>{ drag = false; }; F.svg.addEventListener('pointerup', up); F.svg.addEventListener('pointercancel', up); F.svg.style.cursor = 'grab';
    paint(); reset();
  }};
RT.notatie = { title:'Wat betekent de notatie?', lvl:1, build:(b,st,save)=>{
  const R = makeR(st); const angs = R.shuffle([30,45,60,70,80,100,120,135,150,160]).slice(0,4).map((a,i)=>i%2 ? -a : a);
  angs.forEach((a,i)=>{ const A = Math.abs(a);
    qChoice(b, st, save, 'n'+i, { nr:LET[i]+'.', html:`Wat betekent r(O, ${degTxt(a)})?`, opts:R.shuffle([['c',`een rotatie rond het centrum O over ${A}° in ${zinTxt(a)}`],['z',`een rotatie rond het centrum O over ${A}° in ${zinTxt(-a)}`],['s',`een spiegeling om het punt O, gevolgd door een draaiing over ${A}°`],['d',`een rotatie rond het centrum O over ${360-A}° in ${zinTxt(a)}`]]),
      ans:'c', why: a>0 ? 'Een positieve hoek betekent tegenwijzerzin.' : 'Een negatieve hoek betekent wijzerzin.', whyBad:'Afspraak: + is tegenwijzerzin, − is wijzerzin.' }); });
}};
function rtTaak(title, lvl, o){
  return { title, lvl, instr:'Klik op het rooster waar de beeldpunten komen en klik op <b>Controleer</b>.', build:(b,st,save)=>{
    const R = makeR(st); const g = o.g || [0,12,0,8];
    const T = genTask(R, o.n, g, o.kind, o.opt||{}); if(!T){ b.append(el('p','','Klik op Nieuwe opgave.')); return; }
    const names = (o.n===3 ? R.pick(NAMES3) : R.pick(NAMES4)).split('');
    const cn = o.origin ? 'O' : R.pick(['M','O','Z']); T.op.name = cn;
    if(o.origin) T.op.hide = true;
    const fig = {pts:T.pts, names};
    placeTask(b, st, save, 'p', {g, axes:o.axes, fig, op:T.op, base:opBase(T.op), html:`Teken r(${cn}, ${degTxt(T.op.deg)})(${o.n===3?'Δ':''}${names.join('')}).`, end:`r(${cn}, ${degTxt(T.op.deg)})(${o.n===3?'Δ':''}${names.join('')}) = ${o.n===3?'Δ':''}${names.map(n=>n+PR).join('')}: draaien over ${Math.abs(T.op.deg)}° in ${zinTxt(T.op.deg)}.`});
  }};
}
RT.oorsprong = rtTaak('Draai rond de oorsprong', 1, {n:3, kind:'r90', g:[-6,6,-6,6], axes:true, origin:true, opt:{op:R=>({t:'r', c:[0,0], deg:R.pick([90,-90])})}});
RT.centrum = rtTaak('Draai rond een centrum', 2, {n:4, kind:'r90'});
/* punten op een cirkel */
function circlePts(n, r, names, start=90, cw=true){ const o = {}; names.forEach((L,k)=>{ const a = start + (cw?-1:1)*360*k/n; o[L] = [r6(r*Math.cos(a*D2R)), r6(r*Math.sin(a*D2R))]; }); return o; }
function circleRows(R, n, names, k){
  const step = 360/n; const rows = [];
  const idx = L => names.indexOf(L);
  for(let i=0;i<k;i++){
    const type = i<k-2 ? 'img' : i===k-2 ? 'ang' : 'pre';
    const m = R.int(1, n-1); const sgn = R.pick([1,-1]); let deg = sgn*m*step; if(Math.abs(deg)>180 && R.f()<.6) deg = deg - Math.sign(deg)*360;
    const a = R.pick(names); const ai = idx(a); const bi = ((ai - Math.round(deg/step)) % n + n) % n; const bL = names[bi]; /* namen lopen in wijzerzin */
    if(type==='img') rows.push({html:`r(O, ${degTxt(deg)})(${a}) = [[0]]`, ans:[bL], kind:'pt', sol:`${a} draait ${Math.abs(Math.round(deg/step))} plaatsen in ${zinTxt(deg)}: <b>${bL}</b>`});
    else if(type==='pre') rows.push({html:`r(O, ${degTxt(deg)})([[0]]) = ${bL}`, ans:[a], kind:'pt', sol:`Draai terug: <b>${a}</b>`});
    else { const k2 = ((ai - bi) % n + n) % n; const d1 = r6(k2*step), d2 = r6(k2*step - 360); rows.push({html:`r(O, [[0]]°)(${a}) = ${bL}`, ans:[d1,d2], kind:'ang', mod:true, sol:`${degTxt(d1)} of ${degTxt(d2)}`}); }
  }
  return rows;
}
function circleCard(title, lvl, n, instr){
  return { title, lvl, instr, build:(b,st,save)=>{
    const R = makeR(st); const names = 'ABCDEFGHIJKLMN'.replace('O','').split('').slice(0,n);
    const P = circlePts(n, 4, names);
    const g = [-5,5,-5,5];
    const two = el('div','cf-two'); b.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
    const F = gridFig(L, {g, plain:true, maxw:340});
    const objs = [{t:'raw', s:`<circle class="rim" cx="0" cy="0" r="${4*CU}"/>`}, {t:'cen', p:[0,0], n:'O', away:[1,-1]}];
    names.forEach(L=>objs.push({t:'pt', p:P[L], n:L, c:'orig', away:[0,0]}));
    F.draw(objs);
    Rt.append(el('p','mini-note', `De ${n} punten liggen op gelijke afstanden op een cirkel met middelpunt O. Tussen twee buren is de hoek ${360/n}°. Typ een letter of een hoek (met teken).`));
    circleRows(R, n, names, 6).forEach((r,i)=>letterQ(Rt, st, save, 'c'+i, {nr:LET[i]+'.', html:r.html, ans:r.ans, kind:r.kind, mod:r.mod, sol:r.sol, bad: r.kind==='ang' ? 'Tel de plaatsen en vermenigvuldig met de hoek tussen twee buren. Tegenwijzerzin is positief.' : 'Positieve hoek: draai in tegenwijzerzin. Negatieve hoek: in wijzerzin.'}));
  }};
}
RT.klok = circleCard('Twaalf punten op een cirkel', 2, 12, 'Vul aan.');
RT.tien = circleCard('Tien punten op een cirkel', 3, 10, 'Vul aan. Een draaihoek van −90° is hetzelfde als een draaihoek van 270°: beide antwoorden zijn juist.');
/* draaihoek op een afbeelding */
const DRAAI = [['bloem6',6,90,.5,.5],['molentje4',4,15,.49,.49],['reuzenrad8',8,0,.5,.40],['ventilator3',3,80,.5,.42],['wieldop5',5,90,.5,.5],['wieldop8',8,22.5,.5,.5],['windmolen4',4,45,.5,.39],['windroos8',4,0,.5,.5],['zeester5',5,90,.5,.5]];
const DRAAI_NM = {bloem6:'bloem met 6 blaadjes', molentje4:'molentje met 4 wieken', reuzenrad8:'reuzenrad met 8 bakjes', ventilator3:'ventilator met 3 bladen', wieldop5:'wieldop met 5 spaken', wieldop8:'wieldop met 8 spaken', windmolen4:'windmolen met 4 wieken', windroos8:'windroos met 4 grote punten', zeester5:'zeester met 5 armen'};
const DRAAI_SZ = {bloem6:[143,158], molentje4:[147,172], reuzenrad8:[150,157], ventilator3:[131,160], wieldop5:[160,160], wieldop8:[159,160], windmolen4:[127,159], windroos8:[168,165], zeester5:[151,145]};
function draaiFig(parent, d, qi, pi, dir){
  const [nm, n, off, fx, fy] = d; const [w,h] = DRAAI_SZ[nm];
  const W = 100, Hh = W*h/w; const cx = fx*W, cy = fy*Hh; const R = Math.min(W,Hh)*0.47;
  const aQ = off + 360*qi/n, aP = off + 360*pi/n;
  const pt = (a, r) => [cx + r*Math.cos(a*D2R), cy - r*Math.sin(a*D2R)];
  let sweep = ((aP - aQ)%360+360)%360; if(dir<0) sweep = sweep - 360;
  const ra = R*.42; const p0 = pt(aQ, ra), p1 = pt(aQ+sweep, ra);
  const large = Math.abs(sweep)>180 ? 1:0, sw = sweep>0 ? 0:1;
  const tip = (a) => pt(a, R*1.02);
  const hd = (()=>{ const a1 = (aQ+sweep)*D2R; const tg = sweep>0 ? [-Math.sin(a1), -Math.cos(a1)] : [Math.sin(a1), Math.cos(a1)]; const x = p1[0], y = p1[1], s = 3.2; return `M${f2(x)} ${f2(y)} L${f2(x - tg[0]*s - tg[1]*s*.55)} ${f2(y - tg[1]*s + tg[0]*s*.55)} L${f2(x - tg[0]*s + tg[1]*s*.55)} ${f2(y - tg[1]*s - tg[0]*s*.55)}z`; })();
  const lab = (a, L) => { const p = pt(a, R*1.13); return `<text x="${f2(p[0])}" y="${f2(p[1]+2)}" text-anchor="middle" style="font:700 7px var(--f-body); fill:var(--ink); paint-order:stroke; stroke:var(--card); stroke-width:2px">${L}</text>`; };
  const svg = `<svg class="draai-fig" viewBox="-12 -12 ${W+24} ${f2(Hh+24)}" role="img" aria-label="${DRAAI_NM[nm]}"><rect x="-12" y="-12" width="${W+24}" height="${f2(Hh+24)}" fill="var(--card)"/><image href="${IMGDIR}draai/${nm}.webp" x="0" y="0" width="${W}" height="${f2(Hh)}"/>
    <line x1="${f2(cx)}" y1="${f2(cy)}" x2="${f2(tip(aQ)[0])}" y2="${f2(tip(aQ)[1])}" style="stroke:var(--accent-dark); stroke-width:.9"/><line x1="${f2(cx)}" y1="${f2(cy)}" x2="${f2(tip(aP)[0])}" y2="${f2(tip(aP)[1])}" style="stroke:var(--orange); stroke-width:.9"/>
    <path d="M${f2(p0[0])} ${f2(p0[1])} A${f2(ra)} ${f2(ra)} 0 ${large} ${sw} ${f2(p1[0])} ${f2(p1[1])}" style="fill:none; stroke:var(--ink); stroke-width:.9"/><path d="${hd}" style="fill:var(--ink)"/>
    <circle cx="${f2(cx)}" cy="${f2(cy)}" r="1.4" style="fill:var(--ink)"/>${lab(aQ,'Q')}${lab(aP,'P')}</svg>`;
  parent.insertAdjacentHTML('beforeend', svg);
}
RT.draaihoek = { title:'Hoe groot is de draaihoek?', lvl:3, instr:'Een rotatie rond het middelpunt beeldt Q af op P, in de zin van de pijl. Bepaal de draaihoek zonder te meten. Tegenwijzerzin is positief, wijzerzin negatief.', build:(b,st,save)=>{
  const R = makeR(st); const pick = R.shuffle(DRAAI).slice(0,3);
  const grid = el('div','pair-grid'); b.append(grid);
  pick.forEach((d,i)=>{ const n = d[1]; const qi = R.int(0,n-1); let k = R.int(1, n-1); const pi = (qi + k) % n; const dir = R.pick([1,-1]);
    const box = el('div'); grid.append(box); draaiFig(box, d, qi, pi, dir);
    const step = 360/n; const ans = dir>0 ? k*step : -(n-k)*step;
    qBlock(box, st, save, 'd'+i, { nr:LET[i]+'.', html:`${DRAAI_NM[d[0]][0].toUpperCase()+DRAAI_NM[d[0]].slice(1)}. De draaihoek is [[0]] °.`, size:'xs', mode:'text',
      check:v=>{ const a = parseAng(v[0]); if(isNaN(a)) return {ok:false, msg:'Typ een hoek, bijvoorbeeld 72 of −144.'}; if(Math.abs(a-ans)<1e-6) return {ok:true, msg:`360° : ${n} = ${r6(step)}° per stap, en ${Math.round(Math.abs(ans)/step)} stappen in ${zinTxt(ans)}.`};
        if(Math.abs(a+ans)<1e-6) return {ok:false, msg:'Kijk naar de pijl: tegenwijzerzin is positief, wijzerzin is negatief.'};
        if(Math.abs(Math.abs(a) - Math.abs(ans))>1e-6 && Math.abs(a) % step < 1e-6) return {ok:false, msg:`Tel de stappen van Q naar P in de zin van de pijl. Eén stap is 360° : ${n} = ${r6(step)}°.`};
        return {ok:false, msg:`Eén stap is 360° : ${n} = ${r6(step)}°.`}; },
      sol:`${r6(step)}° × ${Math.round(Math.abs(ans)/step)} = ${r6(Math.abs(ans))}°, in ${zinTxt(ans)}: <b>${degTxt(r6(ans))}</b>` });
  });
}};
RT.gelijk = { title:'Dezelfde rotatie, een andere hoek', lvl:3, instr:'r(O, −210°) en r(O, 150°) beelden elk punt op hetzelfde punt af: 150° − 360° = −210°. Vul aan.', build:(b,st,save)=>{
  const R = makeR(st); R.shuffle([30,45,60,90,110,120,135,150,170]).slice(0,4).forEach((a,i)=>{ const pos = i%2===0; const given = pos ? a : -a; const want = pos ? a-360 : 360-a;
    qBlock(b, st, save, 'g'+i, { nr:LET[i]+'.', html:`r(O, ${degTxt(given)}) = r(O, [[0]] °)`, size:'xs', mode:'text', help:'Draai je de andere kant op, dan heb je 360° min die hoek nodig.',
      check:v=>{ const x = parseAng(v[0]); if(isNaN(x)) return {ok:false, msg:'Typ een hoek met teken.'}; return {ok:Math.abs(x-want)<1e-6, msg: Math.abs(x-want)<1e-6 ? '' : Math.abs(x+given)<1e-6 ? 'Dat is de draaiing in de andere zin over dezelfde hoek: dat geeft een ander beeld.' : `Samen met ${Math.abs(given)}° moet je 360° rond.`}; },
      sol:`${degTxt(given)} ${pos?'− 360°':'+ 360°'} = <b>${degTxt(want)}</b>` }); });
}};

/* ============================================================
   KAARTEN 5: SPIEGELEN OM EEN PUNT
   ============================================================ */
const PT = {};
PT.kijk = { title:'Bekijk hoe je om een punt spiegelt', lvl:1, keep:true, noReset:true,
  instr:'Klik op <b>Bekijk de uitleg</b>. Sleep het centrum <b>O</b> naar een andere plaats en kijk opnieuw.',
  build:(b,st)=>{
    const g = [0,12,0,8]; if(!st.O) st.O = [6,4];
    const fig = {pts:[[2,5],[4,7],[5,4]], names:['A','B','C']};
    const F = gridFig(b, {g, maxw:480});
    const cap = el('div','cf-cap'); b.append(cap);
    const ctl = el('div','dyn-ctl'); b.append(ctl);
    let busy = false;
    const op = () => ({t:'p', c:st.O, name:'O'});
    const play = ctlBtn(icon('play')+' Bekijk de uitleg', async ()=>{ if(busy) return; busy = true; play.disabled = true; F.base = opBase(op());
      await animFig(F, fig, op(), cap, {end:'O is het midden van [AA′], [BB′] en [CC′]. Dat is hetzelfde als een halve draai: r(O, 180°). Je noteert s<sub>O</sub>(ΔABC) = ΔA′B′C′.'}); busy = false; play.disabled = false; });
    play.style.display='inline-flex'; play.style.alignItems='center'; play.style.gap='.3rem'; ctl.append(play);
    function reset(){ F.token++; F.base = opBase(op()); const out = !fig.pts.every(p=>inG(applyOp(p,op()), g)); play.disabled = out || busy;
      F.draw([{t:'poly', pts:fig.pts, c:'orig', names:fig.names}]); cap.innerHTML = out ? 'Het beeld valt buiten het rooster. Sleep O naar een andere plaats.' : ''; }
    let drag = false;
    const snap = e => { const w = F.toW(e); return [clamp(Math.round(w[0]),g[0],g[1]), clamp(Math.round(w[1]),g[2],g[3])]; };
    F.svg.addEventListener('pointerdown', e=>{ if(busy) return; const p = snap(e); if(Math.hypot(p[0]-st.O[0], p[1]-st.O[1])<=1.3){ drag = true; e.preventDefault(); try{ F.svg.setPointerCapture(e.pointerId); }catch(_){} } });
    F.svg.addEventListener('pointermove', e=>{ if(!drag) return; const p = snap(e); if(ptEq(p, st.O)) return; st.O = p; reset(); });
    const up = ()=>{ drag = false; }; F.svg.addEventListener('pointerup', up); F.svg.addEventListener('pointercancel', up); F.svg.style.cursor = 'grab';
    reset();
  }};
PT.zelfde = { title:'Spiegelen om een punt is eigenlijk …', lvl:1, build:(b,st,save)=>{
  const R = makeR(st);
  qChoice(b, st, save, 'z', { html:'Spiegelen om een punt O is eigenlijk hetzelfde als …', opts:R.shuffle([['a','spiegelen om een as door O.'],['b','roteren rond het centrum O over 90°.'],['c','roteren rond het centrum O over 180°.'],['d',`verschuiven over de vector ${vecN('O','A')}.`]]), ans:'c',
    why:'Een halve draai rond O brengt elk punt aan de andere kant van O, even ver: O is het midden van [AA′].', whyBad:'Bekijk de animatie bovenaan nog eens: hoe ver draait de figuur?' });
}};
function ptTaak(title, lvl, o){
  return { title, lvl, instr:'Klik op het rooster waar de beeldpunten komen en klik op <b>Controleer</b>.', build:(b,st,save)=>{
    const R = makeR(st); const g = o.g || [0,12,0,8];
    const items = o.items || [o];
    items.forEach((it,i)=>{
      const T = genTask(R, it.n, g, 'p', it.opt||{}); if(!T){ b.append(el('p','','Klik op Nieuwe opgave.')); return; }
      const names = it.n===1 ? [R.pick(['A','B','K','P'])] : (it.n===3 ? R.pick(NAMES3) : R.pick(NAMES4)).split('');
      let cn = it.origin ? 'O' : R.pick(['O','Z','M']); if(it.opt && it.opt.dekC){ cn = names[T.pts.findIndex(p=>ptEq(p,T.op.c))]; }
      T.op.name = cn; if(it.origin || (it.opt && it.opt.dekC)) T.op.hide = true;
      const fig = {pts:T.pts, names};
      if(items.length>1) b.append(el('div','sub', `<b>${LET[i]}.</b>`));
      placeTask(b, st, save, 'p'+i, {g, axes:it.axes, fig, op:T.op, base:opBase(T.op), html:`Teken s<sub>${cn}</sub>(${it.n===3?'Δ':''}${names.join('')}).`,
        end:`${cn} is het midden van elk lijnstuk tussen een punt en zijn beeld.` + (it.opt && it.opt.dekC ? ` ${cn} zelf is een dekpunt: ${cn}′ = ${cn}.` : '')});
    });
  }};
}
PT.punt = ptTaak('Spiegel een punt om een punt', 1, {items:[{n:1}, {n:1}]});
PT.oorsprong = ptTaak('Spiegel om de oorsprong', 1, {n:4, g:[-6,6,-6,6], axes:true, origin:true, opt:{op:()=>({t:'p', c:[0,0]})}});
PT.buiten = ptTaak('Spiegel om een punt buiten de figuur', 2, {n:3, opt:{outside:true}});
PT.hoekpunt = ptTaak('Het centrum is een hoekpunt', 3, {n:4, opt:{dekC:true, minD:1}});
PT.centrum = { title:'Waar ligt het centrum?', lvl:2, instr:'De oranje figuur is het beeld van de blauwe door een spiegeling om een punt. Klik het centrum aan.', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,12,0,8]; const T = genTask(R, 3, g, 'p'); const names = R.pick(NAMES3).split('');
  placeTask(b, st, save, 'c', {g, fig:{pts:T.pts, names}, op:T.op, mode:'punt', ans:T.op.c, cname:'O',
    figObjs:()=>[{t:'poly', pts:T.pts, c:'orig', names}, {t:'poly', pts:T.img, c:'img', names:names.map(n=>n+PR)}],
    solObjs:()=>[...T.pts.flatMap((p,i)=>helpObjs(T.op, p, T.img[i], g)), {t:'cen', p:T.op.c, n:'O'}],
    hint:()=>'Verbind elk punt met zijn beeld. Het centrum is het midden van die lijnstukken.', end:'O is het midden van elk lijnstuk tussen een punt en zijn beeld.' });
}};
/* puntspiegelingen op een rooster van punten */
function latticeRows(R, pts, k, kinds){
  const names = Object.keys(pts); const rows = []; const find = p => names.find(n=>ptEq(pts[n],p));
  for(let t=0; rows.length<k && t<500; t++){
    const kind = kinds[rows.length % kinds.length];
    const c = R.pick(names), a = R.pick(names); if(c===a) continue;
    const img = find(applyOp(pts[a], {t:'p', c:pts[c]})); if(!img) continue;
    const ask = R.pick(['img','img','pre','cen']);
    if(rows.some(r=>r.key===c+a)) continue;
    if(ask==='img') rows.push({key:c+a, html:`s<sub>${c}</sub>(${a}) = [[0]]`, ans:[img], sol:`${c} is het midden van [${a}${img}]: <b>${img}</b>`});
    else if(ask==='pre') rows.push({key:c+a, html:`s<sub>${c}</sub>([[0]]) = ${img}`, ans:[a], sol:`<b>${a}</b>, want ${c} is het midden van [${a}${img}]`});
    else { const cands = names.filter(z=>find(applyOp(pts[a], {t:'p', c:pts[z]}))===img); rows.push({key:c+a, html:`s<sub>[[0]]</sub>(${a}) = ${img}`, ans:cands, sol:`Het midden van [${a}${img}]: <b>${cands.join(' of ')}</b>`}); }
  }
  return rows;
}
PT.rooster = { title:'Punten op een rooster', lvl:2, instr:'De punten liggen op een rooster. Typ telkens de juiste letter.', build:(b,st,save)=>{
  const R = makeR(st); const L = 'ABCDEFGHIJKLMN'.split(''); L.push('P'); const pts = {}; let i = 0;
  for(let y=2;y>=0;y--) for(let x=0;x<5;x++) pts[L[i++]] = [x,y];
  const two = el('div','cf-two'); b.append(two); const A = el('div'), Rt = el('div'); two.append(A, Rt);
  const F = gridFig(A, {g:[0,4,0,2], lattice:true, maxw:300}); F.draw(Object.entries(pts).map(([n,p])=>({t:'pt', p, n, c:'orig', away:[p[0]-.6, p[1]-1]})));
  latticeRows(R, pts, 6, ['img']).forEach((r,j)=>letterQ(Rt, st, save, 'r'+j, {nr:LET[j]+'.', html:r.html, ans:r.ans, kind:'pt', sol:r.sol, bad:'Het centrum is het midden tussen het punt en zijn beeld.'}));
}};
/* ============================================================
   KAARTEN 6: NOTATIE
   ============================================================ */
const NT = {};
/* notatie van een transformatie als tekst */
function opNot(op){
  if(op.t==='s') return `s<sub>${op.name}</sub>`;
  if(op.t==='p') return `s<sub>${op.name}</sub>`;
  if(op.t==='t') return `t<sub>${vecN(op.name[0], op.name[1])}</sub>`;
  if(op.t==='r') return `r(${op.name}, ${degTxt(op.deg)})`;
  return '';
}
/* puntvul-rijen bij een tekening met benoemde punten.
   sc: {pts:{L:[x,y]}, ops:[op met naam]}, kinds: 'img' | 'pre' | 'par' */
function sceneRows(R, sc, k, kinds, o={}){
  const names = Object.keys(sc.pts); const tol = o.tol || 1e-3;
  const find = p => names.find(n=>ptEq(sc.pts[n], p, tol));
  const rows = [], used = new Set();
  for(let t=0; rows.length<k && t<3000; t++){
    const kind = kinds[rows.length % kinds.length];
    const op = R.pick(sc.ops); const a = R.pick(names);
    const b = find(applyOp(sc.pts[a], op)); if(!b || b===a) continue;
    const key = op.key + a; if(used.has(key)) continue;
    if(kind==='img'){ used.add(key); rows.push({html:`${opNot(op)}(${a}) = [[0]]`, ans:[b], kind:'pt', sol:`<b>${b}</b>`}); }
    else if(kind==='pre'){ const pre = names.filter(n=>{ const q = find(applyOp(sc.pts[n], op)); return q===b; }); used.add(key); rows.push({html:`${opNot(op)}([[0]]) = ${b}`, ans:pre, kind:'pt', sol:`<b>${pre.join(' of ')}</b>`}); }
    else {
      /* de transformatie zelf is gevraagd */
      if(op.t==='s'){ const ax = sc.ops.filter(z=>z.t==='s' && find(applyOp(sc.pts[a], z))===b).flatMap(z=>z.alts||[z.name]); if(!ax.length) continue; used.add(key);
        rows.push({html:`s<sub>[[0]]</sub>(${a}) = ${b}`, ans:ax, kind:'as', sol:`de as <b>${ax.join(' of ')}</b>`}); }
      else if(op.t==='p'){ const cs = sc.ops.filter(z=>z.t==='p' && find(applyOp(sc.pts[a], z))===b).map(z=>z.name); used.add(key);
        rows.push({html:`s<sub>[[0]]</sub>(${a}) = ${b}`, ans:cs, kind:'pt', sol:`het midden van [${a}${b}]: <b>${cs.join(' of ')}</b>`}); }
      else if(op.t==='r'){ used.add(key); const d1 = op.deg, d2 = d1>0 ? d1-360 : d1+360;
        rows.push({html:`r(${op.name}, [[0]] °)(${a}) = ${b}`, ans:[d1,d2], kind:'ang', mod:true, sol:`${degTxt(d1)} of ${degTxt(d2)}`}); }
      else continue;
    }
  }
  return rows;
}
function sceneQs(parent, st, save, rows, pre='r', bad){
  rows.forEach((r,j)=>letterQ(parent, st, save, pre+j, {nr:LET[j]+'.', html:r.html, ans:r.ans, kind:r.kind, mod:r.mod, sol:r.sol,
    bad: bad || (r.kind==='ang' ? 'Tegenwijzerzin is positief, wijzerzin negatief.' : r.kind==='as' ? 'Zoek de as waarbij het punt en zijn beeld even ver liggen, loodrecht erop.' : 'Voer de transformatie uit op het punt tussen haakjes.')}));
}

/* --- notaties lezen --- */
NT.lees = { title:'Hoe lees je deze notatie?', lvl:1, instr:'Kies telkens de juiste betekenis.', build:(b,st,save)=>{
  const R = makeR(st); const L = R.letters(9, UPP.replace('O',''));
  const a = R.pick([30,40,50,60,70,80,100,120]) * R.pick([1,-1]);
  const items = R.shuffle([
    {html:`r(O, ${degTxt(a)})`, opts:[['j',`een rotatie rond het centrum O over ${Math.abs(a)}° in ${zinTxt(a)}`],['z',`een rotatie rond het centrum O over ${Math.abs(a)}° in ${zinTxt(-a)}`],['s',`een spiegeling om het punt O over ${Math.abs(a)}°`],['t',`een translatie over ${Math.abs(a)}°`]], why: a>0 ? 'Een positieve hoek is tegenwijzerzin.' : 'Een negatieve hoek is wijzerzin.'},
    {html:`s<sub>b</sub>(${L[0]}) = ${L[1]}`, opts:[['j',`${L[1]} is het beeld van ${L[0]} door de spiegeling om de as b`],['z',`${L[0]} is het beeld van ${L[1]} door de spiegeling om de as b`],['s',`${L[1]} is het beeld van ${L[0]} door de spiegeling om het punt b`],['t',`b is het beeld van ${L[0]} door een spiegeling`]], why:'Tussen haakjes staat het punt dat je afbeeldt, na het gelijkheidsteken staat het beeld. Een kleine letter is een rechte.'},
    {html:`t<sub>${vecN(L[2],L[3])}</sub>(${L[4]}) = ${L[5]}`, opts:[['j',`${L[5]} is het beeld van ${L[4]} door de translatie over de vector ${vecN(L[2],L[3])}`],['z',`${L[4]} is het beeld van ${L[5]} door de translatie over de vector ${vecN(L[2],L[3])}`],['s',`${L[5]} is het beeld van ${L[4]} door de spiegeling om de rechte ${L[2]}${L[3]}`],['t',`${vecN(L[4],L[5])} is het beeld van ${vecN(L[2],L[3])}`]], why:'t staat voor translatie. In de index staat de vector.'},
    {html:`s<sub>O</sub>(Δ${L[6]}${L[7]}${L[8]}) = Δ${L[6]}′${L[7]}′${L[8]}′`, opts:[['j',`Δ${L[6]}′${L[7]}′${L[8]}′ is het beeld van Δ${L[6]}${L[7]}${L[8]} door de spiegeling om het punt O`],['z',`Δ${L[6]}′${L[7]}′${L[8]}′ is het beeld van Δ${L[6]}${L[7]}${L[8]} door de spiegeling om de as O`],['s',`Δ${L[6]}${L[7]}${L[8]} is het beeld van Δ${L[6]}′${L[7]}′${L[8]}′ door een rotatie over 90°`],['t',`Δ${L[6]}′${L[7]}′${L[8]}′ is het beeld van Δ${L[6]}${L[7]}${L[8]} door een translatie over O`]], why:'Een hoofdletter in de index is een punt: je spiegelt om dat punt.'}]);
  items.forEach((q,i)=>qChoice(b, st, save, 'l'+i, {nr:LET[i]+'.', html:`Hoe lees je <span class="lg">${q.html}</span> ?`, opts:R.shuffle(q.opts), ans:'j', why:q.why, whyBad:'Lees de notatie van links naar rechts: welke transformatie, welk element, welk punt en welk beeld?'}));
}};

/* --- noteer in symbolen --- */
const SYMB_K = [['s','spiegeling om een as'],['p','spiegeling om een punt'],['t','translatie'],['r','rotatie']];
function symbQ(parent, st, save, id, q){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {k:null, v:{}});
  const row = el('div','q'); parent.append(row);
  row.append(el('div','q-text block', (q.nr?`<span class="q-num">${q.nr}</span>`:'') + q.html));
  const pick = el('div','choices'); pick.append(el('span','step-lab','Welke transformatie?'));
  const bs = SYMB_K.map(([k,l])=>{ const x = el('button','opt', l); x.type='button'; x.addEventListener('click', ()=>{ if(locked) return; s.k = k; save(); paint(); fb.textContent=''; fb.className='fb'; }); pick.append(x); return [k,x]; });
  row.append(pick);
  const tpl = el('div','symb-row'); row.append(tpl);
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type='button'; act.append(bC); if(quiz) bC.hidden = true;
  const fb = el('div','fb'); row.append(act, fb);
  let locked = false;
  const inp = (f, cls='xs') => `<input type="text" class="inp ${cls}" data-f="${f}" autocomplete="off" spellcheck="false" aria-label="${f}">`;
  const vin = f => `<span class="vec-in"><i><svg viewBox="0 0 20 6" preserveAspectRatio="none" aria-hidden="true"><path d="M.5 3H19.3M16.2 .6L19.4 3L16.2 5.4"/></svg></i>${inp(f,'sm')}</span>`;
  const T = { s:`s<sub>${inp('e')}</sub> ( ${inp('a')} ) = ${inp('b')}`, p:`s<sub>${inp('e')}</sub> ( ${inp('a')} ) = ${inp('b')}`,
    t:`t<sub>${vin('e')}</sub> ( ${inp('a')} ) = ${inp('b')}`, r:`r ( ${inp('e')} , ${inp('h')} ° ) ( ${inp('a')} ) = ${inp('b')}` };
  function paint(){
    bs.forEach(([k,x])=>x.classList.toggle('chosen', k===s.k));
    tpl.innerHTML = s.k ? T[s.k] : '<span class="mini-note">Kies eerst de transformatie.</span>';
    const v = s.v[s.k] || (s.v[s.k] = {});
    tpl.querySelectorAll('.inp').forEach(x=>{ const f = x.dataset.f; if(v[f]!=null) x.value = v[f]; x.readOnly = locked;
      x.addEventListener('input', ()=>{ v[f] = x.value; save(); x.classList.remove('ok','bad'); }); x.addEventListener('keydown', e=>{ if(e.key==='Enter' && !quiz){ e.preventDefault(); run(); } }); });
  }
  const up = x => nrmL(x||'').toUpperCase(), lo = x => nrmL(x||'').toLowerCase();
  function evaluate(){
    if(!s.k) return {ok:false, info:true, msg:'Kies eerst de transformatie.'};
    const v = s.v[s.k] || {}; const need = s.k==='r' ? ['e','h','a','b'] : ['e','a','b'];
    if(need.some(f=>!String(v[f]||'').trim())) return {ok:false, info:true, msg:'Vul eerst alle vakjes in.'};
    if(s.k!==q.k) return {ok:false, msg:'Lees de zin nog eens: welke transformatie wordt er gebruikt?', f:{}};
    const f = {};
    f.a = up(v.a)===q.a; f.b = up(v.b)===q.b;
    if(q.k==='s') f.e = lo(v.e)===q.e.toLowerCase(); else if(q.k==='t') f.e = up(v.e).replace(/\s/g,'')===q.e; else f.e = up(v.e)===q.e;
    if(q.k==='r'){ const h = parseAng(v.h); f.h = !isNaN(h) && angEq(h, q.h); }
    const ok = Object.values(f).every(Boolean);
    let msg = '';
    if(!ok){ if(up(v.a)===q.b && up(v.b)===q.a) msg = 'Let op de volgorde: tussen haakjes staat het punt dat je afbeeldt, na het gelijkheidsteken het beeld.';
      else if(q.k==='r' && !f.h){ const h = parseAng(v.h); msg = (!isNaN(h) && angEq(h, -q.h)) ? 'Kijk naar de zin: tegenwijzerzin is positief, wijzerzin is negatief.' : 'Kijk nog eens naar de draaihoek.'; }
      else if(!f.e) msg = q.k==='t' ? 'Kijk nog eens naar de vector.' : q.k==='s' ? 'Kijk nog eens naar de as.' : 'Kijk nog eens naar het centrum.';
      else msg = 'Kijk naar de vakjes in het rood.'; }
    return {ok, msg, f};
  }
  function mark(r){ tpl.querySelectorAll('.inp').forEach(x=>{ x.classList.remove('ok','bad'); if(r.f && r.f[x.dataset.f]!=null) x.classList.add(r.f[x.dataset.f]?'ok':'bad'); }); }
  function run(silent){
    const r = evaluate(); fb.className = 'fb ' + (r.ok?'ok':r.info?'info':'bad'); fb.innerHTML = r.ok ? '✅ Juist! ' + q.sol : r.info ? r.msg : '❌ Nog niet juist. ' + r.msg;
    if(r.info) return; mark(r); bs.forEach(([k,x])=>{ x.classList.remove('good','wrong'); if(k===s.k) x.classList.add(s.k===q.k?'good':'wrong'); });
    s.checked = true; save(); if(!silent) CLres(qid, !!r.ok);
  }
  bC.addEventListener('click', ()=>run(false)); paint(); if(s.checked && !quiz) run(true);
  if(quiz) quiz.push({ pts:q.pts||1, grade:()=>!!evaluate().ok, reveal:(ok)=>{ const r = evaluate(); mark(r); if(!ok){ fb.className='fb bad'; fb.innerHTML = '❌ Juist is: ' + q.sol; } }, lock:()=>{ locked = true; bs.forEach(([k,x])=>x.disabled = true); tpl.querySelectorAll('.inp').forEach(x=>x.readOnly = true); } });
}
function symbItems(R){
  const L = R.letters(14, UPP.replace('O',''));
  const a1 = R.pick([40,60,70,80,110,130]), a2 = R.pick([30,45,90,120,150]);
  const ax = R.pick(['a','b','c','d']);
  return R.shuffle([
    {k:'r', e:'O', h:a1, a:L[0], b:L[1], html:`${L[1]} is het beeld van ${L[0]} door een rotatie rond het centrum O over ${a1}° in tegenwijzerzin.`, sol:`r(O, ${a1}°)(${L[0]}) = ${L[1]}`},
    {k:'t', e:L[2]+L[3], a:L[4], b:L[5], html:`${L[5]} is het beeld van ${L[4]} door een translatie over de vector ${vecN(L[2],L[3])}.`, sol:`t<sub>${vecN(L[2],L[3])}</sub>(${L[4]}) = ${L[5]}`},
    {k:'s', e:ax, a:L[6], b:L[7], html:`${L[7]} is het beeld van ${L[6]} door de spiegeling om de as ${ax}.`, sol:`s<sub>${ax}</sub>(${L[6]}) = ${L[7]}`},
    {k:'p', e:L[8], a:L[9], b:L[10], html:`${L[10]} is het beeld van ${L[9]} door de spiegeling om het punt ${L[8]}.`, sol:`s<sub>${L[8]}</sub>(${L[9]}) = ${L[10]}`},
    {k:'r', e:'O', h:-a2, a:L[11], b:L[12], html:`${L[12]} is het beeld van ${L[11]} door een rotatie rond het centrum O over ${a2}° in wijzerzin.`, sol:`r(O, −${a2}°)(${L[11]}) = ${L[12]}`}]);
}
NT.schrijf = { title:'Noteer in symbolen', lvl:1, instr:'Kies eerst de soort transformatie. Vul daarna de vakjes in. Een draaihoek typ je met teken.', build:(b,st,save)=>{
  const R = makeR(st); symbItems(R).forEach((q,i)=>symbQ(b, st, save, 's'+i, {...q, nr:LET[i]+'.'}));
}};

/* --- punten in een assenstelsel --- */
function assenScene(R){
  const pool = R.shuffle(UPP.replace('O','').replace('V','').replace('W','').replace('X','').replace('Y','').split(''));
  for(let t=0;t<400;t++){
    let v; do{ v = [R.int(-5,5), R.int(-5,5)]; }while(Math.hypot(...v)<3 || !v[0] || !v[1]);
    const V = [R.int(-6,6), R.int(-6,6)], W = [V[0]+v[0], V[1]+v[1]]; if(!inG(W,[-6,6,-6,6])) continue;
    const OPS = [{t:'s', p:[0,0], q:[0,1], name:'y', key:'sy'}, {t:'s', p:[0,0], q:[1,0], name:'x', key:'sx'}, {t:'p', c:[0,0], name:'O', key:'sO'}, {t:'r', c:[0,0], deg:90, name:'O', key:'r90'}, {t:'r', c:[0,0], deg:-90, name:'O', key:'rm90'}, {t:'t', v, name:['V','W'], key:'t'}];
    const plan = R.shuffle(OPS).slice(0,4).concat([OPS[5], R.pick(OPS.slice(0,5))]);
    const pts = {}; let k = 0; const all = [[0,0], V, W]; let fail = false; const rows = [];
    const add = p => { if(!inG(p,[-6,6,-6,6]) || all.some(q=>ptEq(q,p)) ) return null; all.push(p); const n = pool[k++]; pts[n] = p; return n; };
    plan.forEach((op,i)=>{ if(fail) return; let ok = false;
      for(let u=0;u<60 && !ok;u++){ const A = [R.int(-5,5), R.int(-5,5)]; if(!A[0] || !A[1]) continue; const B = applyOp(A, op); if(!inG(B,[-6,6,-6,6]) || ptEq(A,B) || all.some(q=>ptEq(q,A)||ptEq(q,B))) continue;
        const na = add(A), nb = add(B); const pre = i===3 || i===5;
        rows.push(pre ? {html:`${opNot(op)}([[0]]) = ${nb}`, ans:[na], kind:'pt', sol:`<b>${na}</b>`} : {html:`${opNot(op)}(${na}) = [[0]]`, ans:[nb], kind:'pt', sol:`<b>${nb}</b>`}); ok = true; }
      if(!ok) fail = true; });
    if(fail) continue;
    for(let d=0; d<3; d++){ for(let u=0;u<40;u++){ const p = [R.int(-6,6), R.int(-6,6)]; if(add(p)) break; } }
    return {pts, V, W, rows};
  }
  return null;
}
NT.assen = { title:'Beeldpunten in een assenstelsel', lvl:2, instr:'Bekijk de punten in het assenstelsel. De vector VW is getekend. Typ telkens de juiste letter.', build:(b,st,save)=>{
  const R = makeR(st); const S = assenScene(R); if(!S){ b.append(el('p','','Klik op Nieuwe opgave.')); return; }
  const two = el('div','cf-two'); b.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
  const F = gridFig(L, {g:[-6,6,-6,6], axes:true, maxw:420});
  F.draw([{t:'arrow', a:S.V, b:S.W}, {t:'pt', p:S.V, n:'V', c:'orig', r:.9, away:S.W}, {t:'pt', p:S.W, n:'W', c:'orig', r:.9, away:S.V}].concat(Object.entries(S.pts).map(([n,p])=>({t:'pt', p, n, c:'orig', r:1.1, away:[p[0]-.7, p[1]-.7]}))));
  S.rows.forEach((r,j)=>letterQ(Rt, st, save, 'a'+j, {nr:LET[j]+'.', html:r.html, ans:r.ans, kind:'pt', sol:r.sol, bad:'Bij s<sub>y</sub> verandert x van teken, bij s<sub>x</sub> verandert y van teken, bij s<sub>O</sub> allebei. Bij een translatie schuif je zoals van V naar W.'}));
}};

/* --- verdieping: alles door elkaar op een rooster van punten --- */
function mixScene(cols=5, rows=4, S=2){
  const pts = {}; const L = 'ABCDEFGHIJKLMNPQRSTU'.split(''); let i = 0;
  for(let y=rows-1;y>=0;y--) for(let x=0;x<cols;x++) pts[L[i++]] = [S*x,S*y];
  const ops = [];
  'abcde'.split('').slice(0,cols).forEach((n,x)=>ops.push({t:'s', p:[S*x,0], q:[S*x,1], name:n, key:'s'+n}));
  'fghi'.split('').slice(0,rows).forEach((n,k)=>{ const y = S*(rows-1-k); ops.push({t:'s', p:[0,y], q:[1,y], name:n, key:'s'+n}); });
  Object.entries(pts).forEach(([n,p])=>{ ops.push({t:'p', c:p, name:n, key:'p'+n}); [90,-90].forEach(d=>ops.push({t:'r', c:p, deg:d, name:n, key:'r'+n+d})); });
  return {pts, ops};
}
function mixFig(parent, sc, cols, rows, S=2){
  const W = S*(cols-1), H = S*(rows-1);
  const g = [-1.2, W+1.6, -1, H+1.4];
  const F = gridFig(parent, {g, plain:true, maxw:380});
  const o = [];
  for(let x=0;x<cols;x++){ o.push({t:'line', a:[S*x,-.8], b:[S*x,H+.8], c:'latline ax'}, {t:'txt', p:[S*x,H+.9], s:'abcde'[x], c:'axn', dy:-1.2}); }
  for(let k=0;k<rows;k++){ const y = S*(rows-1-k); o.push({t:'line', a:[-.8,y], b:[W+.8,y], c:'latline ax'}, {t:'txt', p:[W+1,y], s:'fghi'[k], c:'axn', anchor:'start', dy:1.4}); }
  Object.entries(sc.pts).forEach(([n,p])=>o.push({t:'pt', p, n, c:'orig', r:1, away:[p[0]-1, p[1]-1.4]}));
  F.draw(o); return F;
}
NT.mix = { title:'Alle transformaties door elkaar', lvl:3, instr:'De punten liggen op een rooster van vierkanten. De verticale lijnen zijn de assen a tot e, de horizontale lijnen de assen f tot i. Typ een letter of een hoek met teken.', build:(b,st,save)=>{
  const R = makeR(st); const sc = mixScene(5,4);
  /* translaties over een vector tussen twee punten */
  const nm = Object.keys(sc.pts); for(let k=0;k<6;k++){ const a = R.pick(nm), c = R.pick(nm); if(a===c) continue; const v = [sc.pts[c][0]-sc.pts[a][0], sc.pts[c][1]-sc.pts[a][1]]; sc.ops.push({t:'t', v, name:[a,c], key:'t'+a+c}); }
  const two = el('div','cf-two'); b.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
  mixFig(L, sc, 5, 4);
  sceneQs(Rt, st, save, sceneRows(R, sc, 8, ['img','img','par','pre','img','par','pre','par']), 'm');
}};

/* --- verdieping: vlakvulling met gelijkzijdige driehoeken --- */
function triScene(){
  const h = Math.sqrt(3)/2; const L = 'ABCDEFGHIJKLMNPQRST'.split(''); const pts = {}; let i = 0;
  for(let j=2;j>=-2;j--){ const n = 5 - Math.abs(j); const x0 = -(n-1)/2; for(let k=0;k<n;k++) pts[L[i++]] = [r6(2*(x0+k)), r6(2*j*h)]; }
  return pts;
}
NT.vlak = { title:'Een vlakvulling met driehoeken', lvl:3, instr:'De figuur bestaat uit gelijkzijdige driehoeken. Elke hoek van zo’n driehoek is 60°. Typ een letter of een hoek met teken.', build:(b,st,save)=>{
  const R = makeR(st); const pts = triScene(); const names = Object.keys(pts);
  const mid = names.find(n=>ptEq(pts[n],[0,0]));
  const ops = [];
  const nb = names.filter(n=>Math.abs(Math.hypot(...pts[n]) - 2)<1e-6);
  /* assen door twee punten */
  for(let k=0;k<3;k++){ const a = nb[k]; ops.push({t:'s', p:[0,0], q:pts[a], name:mid+a, key:'s'+a}); }
  names.forEach(c=>{ [60,-60,120,-120].forEach(d=>ops.push({t:'r', c:pts[c], deg:d, name:c, key:'r'+c+d})); ops.push({t:'p', c:pts[c], name:c, key:'p'+c}); });
  for(let k=0;k<5;k++){ const a = R.pick(names), c = R.pick(nb.concat(names)); if(a===c) continue; ops.push({t:'t', v:[pts[c][0]-pts[a][0], pts[c][1]-pts[a][1]], name:[a,c], key:'t'+a+c}); }
  const two = el('div','cf-two'); b.append(two); const Lf = el('div'), Rt = el('div'); two.append(Lf, Rt);
  const F = gridFig(Lf, {g:[-4.8,4.8,-3.9,3.9], plain:true, maxw:380});
  const o = []; names.forEach(a=>names.forEach(c=>{ if(a<c && Math.abs(Math.hypot(pts[a][0]-pts[c][0], pts[a][1]-pts[c][1])-2)<1e-6) o.push({t:'line', a:pts[a], b:pts[c], c:'latline'}); }));
  names.forEach(n=>o.push({t:'pt', p:pts[n], n, c:'orig', r:1.35, away:[pts[n][0]-.5, pts[n][1]-1.6]}));
  F.draw(o);
  const sc = {pts, ops: ops.map(op=>op.t==='s' ? {...op, name:op.name} : op)};
  /* een as door twee punten noteer je met die twee letters */
  const rows = sceneRows(R, sc, 7, ['img','par','img','pre','par','img','par']).map(r=>r.kind==='as' ? {...r, kind:'txt'} : r).filter(r=>r.kind!=='txt');
  sceneQs(Rt, st, save, rows, 'v', 'Draai of spiegel in gedachten. Tel de driehoekjes: één stap rond een punt is 60°.');
}};

/* ============================================================
   KAARTEN 7: EIGENSCHAPPEN
   ============================================================ */
const EG = {};
const EIG = [['col','collineariteit'],['evw','evenwijdigheid'],['lood','loodrechte stand'],['len','lengte van een lijnstuk'],['hoek','grootte van een hoek'],['opp','oppervlakte'],['omt','omtrek'],['vorm','vorm']];
/* alle kolommen van de eigenschappentabel: de laatste (beeld evenwijdig met origineel) blijft niet altijd */
const EIG_ALL = EIG.concat([['par','beeld ∥ origineel']]);
const PAR_OK = {s:false, t:true, r:false, p:true};
const EIG_ZIN = {
  col:k=>`Als drie punten collineair zijn, dan zijn hun beeldpunten door een ${TNAAM[k]} ook collineair.`,
  evw:k=>`Een ${TNAAM[k]} bewaart de evenwijdigheid.`,
  lood:k=>`Een ${TNAAM[k]} bewaart de loodrechte stand.`,
  len:k=>`Een ${TNAAM[k]} bewaart de lengte van een lijnstuk.`,
  hoek:k=>`Een ${TNAAM[k]} bewaart de grootte van een hoek.`,
  opp:k=>`Een ${TNAAM[k]} bewaart de oppervlakte.`,
  omt:k=>`Een ${TNAAM[k]} bewaart de omtrek.`,
  vorm:k=>`Een ${TNAAM[k]} bewaart de vorm: het beeld is congruent met de figuur.`,
  par:k=>PAR_OK[k] ? `Bij een ${TNAAM[k]} is het beeld van een rechte altijd evenwijdig met die rechte.` : `Bij een ${TNAAM[k]} is het beeld van een rechte niet altijd evenwijdig met die rechte.`};
const TNAAM = {s:'spiegeling om een as', t:'translatie over een vector', r:'rotatie rond een centrum over een hoek', p:'spiegeling om een punt'};
/* markeringen voor een eigenschap op hoekpunten A, E, B, C, D (trapezium) */
function eigMarks(k, P, img){
  const [A,E,B,C,D] = P; const c = img ? 'img' : ''; const o = [];
  const u = (p,q) => { const d = [q[0]-p[0], q[1]-p[1]], L = Math.hypot(...d); return [d[0]/L, d[1]/L]; };
  if(k==='col'){ const d = u(A,B); o.push({t:'line', a:[A[0]-d[0]*1.4, A[1]-d[1]*1.4], b:[B[0]+d[0]*1.4, B[1]+d[1]*1.4]}); }
  if(k==='evw'){ o.push({t:'line', a:A, b:B, c:'seg hl '+c}, {t:'line', a:D, b:C, c:'seg hl '+c}); }
  if(k==='lood'){ o.push({t:'right', v:A, d1:u(A,B), d2:u(A,D)}); }
  if(k==='len'){ o.push({t:'line', a:A, b:B, c:'seg hl '+c}, {t:'ticks', a:A, b:B, n:2}); }
  if(k==='hoek'){ const a0 = Math.atan2(A[1]-B[1], A[0]-B[0])/D2R, a1 = Math.atan2(C[1]-B[1], C[0]-B[0])/D2R; let d = ((a1-a0+540)%360)-180; o.push({t:'arcC', c:B, r:1.1, a0, a1:a0+d}); const m = (a0 + d/2)*D2R; o.push({t:'txt', p:[B[0]+Math.cos(m)*2.1, B[1]+Math.sin(m)*2.1], s:'45°', c:'help', dy:1.4}); }
  if(k==='opp'){ o.push({t:'poly', pts:[A,B,C,D], c:'fill '+c}, {t:'txt', p:centroid([A,B,C,D]), s:'7,5', c:'help', dy:1.4}); }
  if(k==='omt'){ [[A,B],[B,C],[C,D],[D,A]].forEach(([p,q])=>o.push({t:'line', a:p, b:q, c:'seg hl '+c})); }
  if(k==='vorm'){ o.push({t:'poly', pts:[A,B,C,D], c:'fill '+c}); }
  if(k==='par'){ const d = u(B,C); o.push({t:'line', a:[B[0]-d[0]*1.2, B[1]-d[1]*1.2], b:[C[0]+d[0]*1.2, C[1]+d[1]*1.2], c:'seg hl '+c}); }
  return o;
}
EG.kijk = { title:'Bekijk de eigenschappen', lvl:1, keep:true, noReset:true,
  instr:'Kies een transformatie en een eigenschap. Klik op <b>Bekijk</b>. Wat blijft er hetzelfde bij het beeld?',
  build:(b,st)=>{
    const g = [0,14,0,10];
    const P0 = [[1,1],[3,1],[5,1],[2,4],[1,4]];   /* A, E, B, C, D */
    const fig = {pts:[P0[0],P0[1],P0[2],P0[3],P0[4]], names:['A','E','B','C','D']};
    const OPS = { s:{t:'s', p:[7,0], q:[7,10], name:'a'}, t:{t:'t', v:[8,2], from:[6,7.5], name:['X','Y']}, r:{t:'r', c:[7,2], deg:-90, name:'O'}, p:{t:'p', c:[7,4], name:'O'} };
    if(!st.k) st.k = 's'; if(!st.e) st.e = 'len';
    const pick = el('div','cf-pick'); b.append(pick);
    const bs = TYPES4.map(([k,l])=>{ const x = el('button','opt',l); x.type='button'; x.addEventListener('click', ()=>{ st.k = k; paint(); reset(); }); pick.append(x); return [k,x]; });
    const pick2 = el('div','cf-pick'); b.append(pick2);
    const be = EIG_ALL.map(([k,l])=>{ const x = el('button','opt',l); x.type='button'; x.addEventListener('click', ()=>{ st.e = k; paint(); reset(); }); pick2.append(x); return [k,x]; });
    const F = gridFig(b, {g, maxw:500});
    const cap = el('div','cf-cap'); b.append(cap);
    const ctl = el('div','dyn-ctl'); b.append(ctl);
    let busy = false;
    const names = () => st.e==='col' ? ['A','E','B','C','D'] : ['A','','B','C','D'];
    const play = ctlBtn(icon('play')+' Bekijk', async ()=>{ if(busy) return; busy = true; play.disabled = true; const op = OPS[st.k]; F.base = opBase(op);
      const f = {pts:fig.pts, names:names()}; await animFig(F, f, op, null, {extra:eigMarks(st.e, fig.pts, false), helpers:false});
      const Q = fig.pts.map(p=>applyOp(p, op)); F.draw(finalFig(f, op, {helpers:false, extra:eigMarks(st.e, fig.pts, false)}).concat(eigMarks(st.e, Q, true)));
      cap.innerHTML = EIG_ZIN[st.e](st.k) + ' ' + (typeof VB[st.e]==='function' ? VB[st.e](st.k) : VB[st.e]); busy = false; play.disabled = false; });
    play.style.display='inline-flex'; play.style.alignItems='center'; play.style.gap='.3rem'; ctl.append(play);
    const VB = {col:'A, E en B liggen op één rechte, dus ook A′, E′ en B′.', evw:'AB ∥ DC, dus ook A′B′ ∥ D′C′.', lood:'AB ⊥ AD, dus ook A′B′ ⊥ A′D′.', len:'|AB| = 4, dus ook |A′B′| = 4.', hoek:'De hoek bij B is 45°, dus ook de hoek bij B′.', opp:'Het trapezium is 7,5 hokjes groot, het beeld ook.',
      omt:'Elke zijde blijft even lang, dus de omtrek van A′B′C′D′ is gelijk aan die van ABCD.',
      vorm:k=>'A′B′C′D′ heeft dezelfde vorm en dezelfde grootte als ABCD.' + (k==='s' ? ' Het beeld is wel omgeklapt.' : ''),
      par:k=>PAR_OK[k] ? 'BC en B′C′ zijn evenwijdig.' : 'BC en B′C′ zijn hier <b>niet</b> evenwijdig. Dat is het enige verschil in de tabel.'};
    const paint = () => { bs.forEach(([k,x])=>x.classList.toggle('chosen', k===st.k)); be.forEach(([k,x])=>x.classList.toggle('chosen', k===st.e)); };
    function reset(){ F.token++; F.base = opBase(OPS[st.k]); F.draw([{t:'poly', pts:fig.pts, c:'orig', names:names()}].concat(eigMarks(st.e, fig.pts, false))); cap.innerHTML = 'Klik op <b>Bekijk</b>.'; }
    paint(); reset();
  }};

/* een tekening die één eigenschap illustreert */
function illus(R, prop, kind){
  const g = [0,14,0,9];
  for(let t=0;t<600;t++){
    let base, objs0;
    const s = [R.int(1,6), R.int(1,4)];
    const at = p => [p[0]+s[0], p[1]+s[1]];
    if(prop==='col') base = {A:[0,0], B:[1.5,1], C:[3,2]};
    if(prop==='evw') base = {A:[0,0], B:[3,.8], C:[0,2], D:[3,2.8]};
    if(prop==='lood') base = {A:[0,0], B:[3,0], C:[0,2.4]};
    if(prop==='len') base = {A:[0,0], B:[3,1.5]};
    if(prop==='hoek') base = {A:[3,0], B:[0,0], C:[2,2.1]};
    if(prop==='opp') base = {A:[0,0], B:[3,0], C:[3.5,2], D:[.5,2]};
    if(prop==='omt') base = {A:[0,0], B:[4,0], C:[0,3]};
    if(prop==='vorm') base = {A:[0,0], B:[1,0], C:[1,1.4], D:[2,1.4], E:[2,2.2], F:[1,2.2], G:[1,3], H:[2.6,3], I:[2.6,3.8], J:[0,3.8]};
    const rot = R.pick([0,30,60,-30]); Object.keys(base).forEach(k=>{ base[k] = at(rotPt(base[k], [0,0], rot)); });
    let op;
    if(kind==='s'){ op = genAxis(R, g, R.pick(['v','h','d'])); }
    if(kind==='t'){ op = genOpK(R, g, 't'); op.from = vecFrom(R, g, op.v); if(!op.from) continue; }
    if(kind==='r'){ op = {t:'r', c:[R.int(2,12), R.int(2,7)], deg:R.pick([60,90,-90,-60,120])}; }
    if(kind==='p'){ op = {t:'p', c:[R.int(3,11), R.int(2,7)]}; }
    const P = Object.values(base), Q = P.map(p=>applyOp(p, op));
    if(!P.concat(Q).every(p=>inG(p, g, .3))) continue;
    if(kind==='t' && !inG([op.from[0]+op.v[0], op.from[1]+op.v[1]], g)) continue;
    if(kind==='s'){ const side = P.map(p=>Math.sign(r6(cross3(op.p,op.q,p)))); if(side.includes(0) || (side.includes(1) && side.includes(-1))) continue; }
    const C1 = centroid(P), C2 = centroid(Q); if(Math.hypot(C1[0]-C2[0], C1[1]-C2[1]) < 3.5) continue;
    if((kind==='r'||kind==='p') && Math.min(...P.map(p=>Math.hypot(p[0]-op.c[0], p[1]-op.c[1])))<1.2) continue;
    return {g, op, base, P, Q};
  }
  return null;
}
function illusObjs(I, prop){
  const {op, base} = I; const N = Object.keys(base); const P = N.map(k=>base[k]), Q = P.map(p=>applyOp(p, op));
  const o = [];
  if(op.t==='s') o.push({t:'axis', p:op.p, q:op.q, n:'a', nAt:'start'});
  if(op.t==='t'){ const B = [op.from[0]+op.v[0], op.from[1]+op.v[1]]; o.push({t:'arrow', a:op.from, b:B}, {t:'pt', p:op.from, n:'X', c:'orig', r:.8, away:B}, {t:'pt', p:B, n:'Y', c:'orig', r:.8, away:op.from}); }
  if(op.t==='r'){ const a0 = Math.atan2(P[0][1]-op.c[1], P[0][0]-op.c[0])/D2R; o.push({t:'cen', p:op.c, n:'O'}, {t:'line', a:op.c, b:P[0]}, {t:'line', a:op.c, b:Q[0]}, {t:'arcC', c:op.c, r:1.3, a0, a1:a0+op.deg, head:true}); const m = (a0+op.deg/2)*D2R; o.push({t:'txt', p:[op.c[0]+Math.cos(m)*2.4, op.c[1]+Math.sin(m)*2.4], s:degTxt(op.deg), c:'help', dy:1.4}); }
  if(op.t==='p'){ o.push({t:'cen', p:op.c, n:'O'}, {t:'line', a:P[0], b:Q[0]}, {t:'ticks', a:P[0], b:op.c, n:2}, {t:'ticks', a:op.c, b:Q[0], n:2}); }
  const one = (pts, img) => { const c = img ? 'img' : ''; const nm = N.map(n=>n+(img?PR:''));
    const L = (i,j) => ({t:'line', a:pts[i], b:pts[j], c:'seg '+c});
    const lab = (i, away) => ({t:'pt', p:pts[i], n:nm[i], c:img?'img':'orig', r:1, away});
    const u = (p,q) => { const d = [q[0]-p[0], q[1]-p[1]], Ln = Math.hypot(...d); return [d[0]/Ln, d[1]/Ln]; };
    if(prop==='col'){ const d = u(pts[0], pts[2]); o.push({t:'line', a:[pts[0][0]-d[0]*1.2, pts[0][1]-d[1]*1.2], b:[pts[2][0]+d[0]*1.2, pts[2][1]+d[1]*1.2]}); [0,1,2].forEach(i=>o.push(lab(i, [pts[i][0]-d[1], pts[i][1]+d[0]]))); }
    if(prop==='evw'){ o.push(L(0,1), L(2,3)); const m = [(pts[0][0]+pts[2][0])/2, (pts[0][1]+pts[2][1])/2]; o.push({t:'txt', p:lerp2(pts[0],pts[1],.5), s:img?'a′':'a', c:'axn', dy:3.8}, {t:'txt', p:lerp2(pts[2],pts[3],.5), s:img?'b′':'b', c:'axn', dy:-1.8}); }
    if(prop==='lood'){ o.push(L(0,1), L(0,2), {t:'right', v:pts[0], d1:u(pts[0],pts[1]), d2:u(pts[0],pts[2])}); }
    if(prop==='len'){ o.push(L(0,1), {t:'ticks', a:pts[0], b:pts[1], n:2}); [0,1].forEach(i=>o.push(lab(i, pts[1-i]))); }
    if(prop==='hoek'){ o.push(L(1,0), L(1,2)); const a0 = Math.atan2(pts[0][1]-pts[1][1], pts[0][0]-pts[1][0])/D2R, a1 = Math.atan2(pts[2][1]-pts[1][1], pts[2][0]-pts[1][0])/D2R; const d = ((a1-a0+540)%360)-180;
      o.push({t:'arcC', c:pts[1], r:1, a0, a1:a0+d}); const m = (a0+d/2)*D2R; o.push({t:'txt', p:[pts[1][0]+Math.cos(m)*1.9, pts[1][1]+Math.sin(m)*1.9], s:'46°', c:'help', dy:1.4}); }
    if(prop==='opp'){ o.push({t:'poly', pts, c:'fill '+c}, {t:'txt', p:centroid(pts), s:'6 cm²', c:'help', dy:1.4}); }
    if(prop==='omt'){ o.push(L(0,1), L(1,2), L(2,0), {t:'txt', p:centroid(pts), s:'12 cm', c:'help', dy:1.4}); }
    if(prop==='vorm'){ o.push({t:'poly', pts, c:img ? 'img' : 'orig'}); }
  };
  one(P, false); one(Q, true);
  return o;
}
function illusQ(parent, st, save, id, R, prop, kind, nr){
  const I = illus(R, prop, kind); if(!I){ parent.append(el('p','','Klik op Nieuwe opgave.')); return; }
  const box = el('div'); parent.append(box);
  const F = gridFig(box, {g:tightG(I), plain:true, maxw:360}); F.draw(illusObjs(I, prop));
  qChoice(box, st, save, id+'t', {nr, html:'Welke transformatie zie je?', opts:TYPES4, ans:kind, why:'', whyBad:'Kijk naar wat er getekend is: een as, een vector, een centrum met een draaihoek of een centrum dat het midden is.'});
  qChoice(box, st, save, id+'e', {html:'Welke eigenschap wordt geïllustreerd?', opts:EIG, ans:prop, why:EIG_ZIN[prop](kind), whyBad:'Kijk naar de tekens in de tekening: streepjes, een rechte hoek, een boogje, een gekleurd vlak of een rechte door drie punten.'});
}
EG.illus = { title:'Welke eigenschap wordt geïllustreerd?', lvl:2, instr:'Kies bij elke tekening de transformatie en de eigenschap.', build:(b,st,save)=>{
  const R = makeR(st); const props = R.shuffle(EIG.map(e=>e[0])).slice(0,3); const kinds = R.shuffle(['s','t','r','p']);
  const grid = el('div','pair-grid'); b.append(grid);
  props.forEach((p,i)=>illusQ(grid, st, save, 'i'+i, R, p, kinds[i], LET[i]+'.'));
}};

/* --- de eigenschap zelf benoemen in een zin --- */
EG.benoem = { title:'Benoem de eigenschap', lvl:2, instr:'Vul bij elke tekening de zin aan. Klik op een leeg vakje en daarna op het juiste woord.', build:(b,st,save)=>{
  const R = makeR(st); const props = R.shuffle(EIG.map(e=>e[0])).slice(0,3); const kinds = R.shuffle(['s','t','r','p']);
  const bank = wordBank(b, TYPES4.map(x=>x[1]).concat(EIG.map(x=>x[1])));
  const grid = el('div','pair-grid'); b.append(grid);
  props.forEach((p,i)=>{ const I = illus(R, p, kinds[i]); const box = el('div'); grid.append(box); if(!I){ box.append(el('p','','Klik op Nieuwe opgave.')); return; }
    const F = gridFig(box, {g:tightG(I), plain:true, maxw:360}); F.draw(illusObjs(I, p));
    wordFill(box, st, save, 'z'+i, {nr:LET[i]+'.', html:'Een [[w]] bewaart de [[w]].', ans:[TYPES4.find(x=>x[0]===kinds[i])[1], EIG.find(x=>x[0]===p)[1]], bank}); });
}};
/* uitsnede rond de figuur, het beeld en het element van de transformatie */
function tightG(I){ const op = I.op; const pts = I.P.concat(I.Q);
  if(op.c) pts.push(op.c); if(op.from) pts.push(op.from, [op.from[0]+op.v[0], op.from[1]+op.v[1]]);
  if(op.t==='s'){ I.P.forEach(p=>pts.push(footPt(p, op.p, op.q))); }
  const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1]);
  let g = [Math.min(...xs)-1.6, Math.max(...xs)+1.6, Math.min(...ys)-1.6, Math.max(...ys)+1.6];
  return [Math.max(g[0], I.g[0]-.5), Math.min(g[1], I.g[1]+.5), Math.max(g[2], I.g[2]-.5), Math.min(g[3], I.g[3]+.5)]; }
/* --- tabel met tekeningen: rijen = transformatie, kolommen = eigenschap ---
   Nieuwe opgave: andere volgorde van de transformaties en 4 andere eigenschappen. */
EG.tabel = { title:'Tabel: welke transformatie, welke eigenschap?', lvl:1, instr:'Elke tekening toont een transformatie en een eigenschap die behouden blijft. Sleep een kaartje naar een leeg vak, of tik een kaartje aan en daarna het vak. In een rij staat telkens dezelfde transformatie, in een kolom dezelfde eigenschap.', build:(b,st,save,key)=>{
  const R = makeR(st); const qid = QID('tabel'); CLvraag(qid);
  const K = R.shuffle(['s','t','r','p']); const E = R.shuffle(EIG.map(e=>e[0])).slice(0,4);
  const extra = R.shuffle(EIG.map(e=>e[0]).filter(e=>!E.includes(e))).slice(0,2);
  const s = st.tb || (st.tb = {}); /* slot -> waarde */
  const kName = k => TYPES4.find(x=>x[0]===k)[1], eName = e => EIG.find(x=>x[0]===e)[1];
  const pool = el('div','pool tb-pool'); b.append(pool);
  const wrap = el('div','tab-wrap'); b.append(wrap);
  const grid = el('div','tb-grid'); wrap.append(grid);
  const slots = {}; const mkSlot = (id, ph) => { const z = el('div','bin tb-slot', `<span class="tb-ph">${ph}</span>`); z.dataset.id = id; slots[id] = z; return z; };
  grid.append(el('div','tb-corner'));
  E.forEach((e,j)=>grid.append(mkSlot('c'+j, 'eigenschap?')));
  K.forEach((k,i)=>{ grid.append(mkSlot('r'+i, 'transformatie?'));
    E.forEach((e,j)=>{ const cell = el('div','tb-cell'); grid.append(cell); const I = illus(R, e, k);
      if(I){ const F = gridFig(cell, {g:tightG(I), plain:true, maxw:220}); F.draw(illusObjs(I, e)); } }); });
  const chips = [];
  const mkChip = (val, txt, grp) => { const c = el('span','chip', txt); c.dataset.val = val; c.dataset.grp = key+grp; chips.push(c); return c; };
  R.shuffle(K.map(k=>mkChip(k, kName(k), 't')).concat(E.concat(extra).map(e=>mkChip(e, eName(e), 'e')))).forEach(c=>pool.append(c));
  const fb = el('div','fb');
  const okFor = id => id[0]==='r' ? K[+id.slice(1)] : E[+id.slice(1)];
  const grpOf = id => key + (id[0]==='r' ? 't' : 'e');
  function place(c, id){
    Object.keys(s).forEach(k=>{ if(s[k]===c.dataset.val && grpOf(k)===c.dataset.grp) delete s[k]; });
    if(id==null){ pool.append(c); }
    else { if(grpOf(id)!==c.dataset.grp){ fb.className = 'fb info'; fb.textContent = id[0]==='r' ? 'In de rijen komt een transformatie.' : 'In de kolommen komt een eigenschap.'; pool.append(c); save(); paint(); return; }
      const old = slots[id].querySelector('.chip'); if(old) pool.append(old); slots[id].append(c); s[id] = c.dataset.val; }
    fb.textContent = ''; fb.className = 'fb'; save(); paint(); }
  function paint(chk){ Object.entries(slots).forEach(([id,z])=>{ z.classList.remove('tb-good','tb-bad'); z.querySelector('.tb-ph').hidden = !!z.querySelector('.chip');
      if(chk && s[id]) z.classList.add(s[id]===okFor(id) ? 'tb-good' : 'tb-bad'); }); }
  chips.forEach(c=>draggable(c, (x,y)=>{ const z = Object.values(slots).find(z=>inRect(z,x,y)); place(c, z ? z.dataset.id : null); }));
  Object.values(slots).forEach(z=>z.addEventListener('click', ()=>{ if(selChip && selChip.dataset.grp.startsWith(key)){ const c = selChip; clearSel(); place(c, z.dataset.id); } }));
  pool.addEventListener('click', e=>{ if(e.target===pool && selChip && selChip.dataset.grp.startsWith(key)){ const c = selChip; clearSel(); place(c, null); } });
  /* herstellen */
  Object.entries(s).forEach(([id,v])=>{ const c = chips.find(c=>c.dataset.val===v && c.dataset.grp===grpOf(id)); if(c && slots[id]) slots[id].append(c); });
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type = 'button'; act.append(bC); b.append(act, fb);
  bC.addEventListener('click', ()=>{
    const ids = Object.keys(slots); if(ids.some(id=>!s[id])){ fb.className = 'fb info'; fb.textContent = 'Vul eerst elke rij en elke kolom in.'; return; }
    const bad = ids.filter(id=>s[id]!==okFor(id)); paint(true); CLres(qid, !bad.length);
    if(!bad.length){ fb.className = 'fb ok'; fb.innerHTML = '✅ Juist! Alle vier de transformaties bewaren deze eigenschappen. Klik op <b>↺ Nieuwe opgave</b> voor andere eigenschappen.'; }
    else { fb.className = 'fb bad'; fb.innerHTML = `❌ ${bad.length} ${bad.length===1?'vak klopt':'vakken kloppen'} nog niet. Rij: kijk of er een as, een vector, een centrum met draaihoek of een centrum als midden getekend is. Kolom: kijk naar de tekens, zoals streepjes, een rechte hoek, een boogje of een gekleurd vlak.`; }
  });
  paint();
}};

/* --- rekenen met eigenschappen --- */
EG.reken = { title:'Rekenen met eigenschappen', lvl:2, build:(b,st,save)=>{
  const R = makeR(st); const a = R.int(4,9), h = R.pick([60,65,70,75,80,100,105,110,115,120]), A = a*R.int(3,6);
  const tr = R.pick([`r(O, ${R.pick([40,50,70,-30,-80])}°)`, `s<sub>a</sub>`, `s<sub>O</sub>`, `t<sub>${vecN('X','Y')}</sub>`]);
  b.append(el('div','opg', `ABCD is een parallellogram met |AB| = ${a} cm, ${hat('A')} = ${h}° en een oppervlakte van ${A} cm². A′B′C′D′ is het beeld van ABCD door ${tr}.`));
  qBlock(b, st, save, 'l', {nr:'a.', html:'|A′B′| = [[0]] cm', size:'xs', mode:'decimal', check:numIs(a), why:'De transformatie bewaart de lengte van een lijnstuk.', sol:`${a} cm, want de lengte blijft behouden.`});
  qBlock(b, st, save, 'h', {nr:'b.', html:keepTxt(`${hat('A')}′ = [[0]] °`), size:'xs', mode:'decimal', check:degIs(h), why:'De transformatie bewaart de grootte van een hoek.', sol:`${h}°`});
  qBlock(b, st, save, 'h2', {nr:'c.', html:keepTxt(`${hat('B')}′ = [[0]] °`), size:'xs', mode:'decimal', help:'In een parallellogram zijn twee hoeken naast elkaar samen 180°.', check:v=>{ const r = degIs(180-h)(v); if(!r.ok && Math.abs(parseDeg(v[0])-h)<.01) return {ok:false, msg:`${hat('A')} en ${hat('B')} liggen naast elkaar: samen zijn ze 180°.`}; return r; }, why:'Eerst rekenen in ABCD, dan de eigenschap gebruiken.', sol:`${hat('B')} = 180° − ${h}° = ${180-h}°, en het beeld heeft dezelfde hoek: <b>${180-h}°</b>`});
  qBlock(b, st, save, 'o', {nr:'d.', html:'De oppervlakte van A′B′C′D′ = [[0]] cm²', size:'xs', mode:'decimal', check:numIs(A), why:'Het beeld is congruent, dus de oppervlakte blijft gelijk.', sol:`${A} cm²`});
  qChoice(b, st, save, 'k', {nr:'e.', html:'Is A′B′C′D′ ook een parallellogram?', opts:R.shuffle([['j','Ja, want de transformatie bewaart de evenwijdigheid.'],['n','Nee, door de transformatie zijn de zijden niet meer evenwijdig.'],['e','Enkel als het een translatie is.'],['g','Ja, want het beeld is altijd evenwijdig met het origineel.']]), ans:'j', why:'AB ∥ DC, dus A′B′ ∥ D′C′. Zo ook voor de andere zijden.', whyBad:'Het beeld van een zijde hoeft niet evenwijdig te zijn met die zijde zelf. Maar evenwijdige zijden blijven evenwijdig.'});
}};

/* --- waar of niet waar bij een parallellogram gespiegeld om O --- */
EG.wn = { title:'Een parallellogram gespiegeld om een punt', lvl:2, instr:'KLMN is het beeld van het parallellogram ABCD door de spiegeling om het punt O. Waar of niet waar?', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,14,0,9];
  let P, O; for(let t=0;t<500;t++){ const A = [R.int(0,5), R.int(0,4)], w = R.int(3,4), sx = R.int(1,2), hh = R.int(2,3); P = [A, [A[0]+w, A[1]], [A[0]+w+sx, A[1]+hh], [A[0]+sx, A[1]+hh]]; O = [R.int(5,9), R.int(3,6)];
    const Q = P.map(p=>applyOp(p, {t:'p', c:O})); if(Q.every(p=>inG(p,g)) && Math.hypot(centroid(P)[0]-O[0], centroid(P)[1]-O[1])>=3.2 && !P.some(p=>Math.hypot(p[0]-O[0],p[1]-O[1])<1.5) && !Q.some(q=>inPoly(q,P) || P.some(p=>ptEq(p,q))) && !P.some(p=>inPoly(p,Q))) break; }
  const F = gridFig(b, {g, maxw:460}); const op = {t:'p', c:O};
  F.draw([{t:'poly', pts:P, c:'orig', names:['A','B','C','D']}, {t:'poly', pts:P.map(p=>applyOp(p,op)), c:'img', names:['K','L','M','N']}, {t:'cen', p:O, n:'O'}]);
  const pool = [{s:'KLMN en ABCD zijn congruent.', ans:'w', why:'Een spiegeling om een punt bewaart vorm en grootte.'}, {s:'A, O en K liggen op één rechte.', ans:'w', why:'O is het midden van [AK].'},
    {s:'|AB| = |KL|', ans:'w', why:'De lengte van een lijnstuk blijft behouden.'}, {s:'AB ∥ KL', ans:'w', why:'Bij een spiegeling om een punt is het beeld van een rechte evenwijdig met die rechte.'},
    {s:'O is het midden van [CM].', ans:'w', why:'M is het beeld van C.'}, {s:'|AC| = |KM|', ans:'w', why:'[KM] is het beeld van [AC].'},
    {s:`${hat('B')} is groter dan ${hat('L')}.`, ans:'n', why:'De grootte van een hoek blijft behouden.'}, {s:'De oppervlakte van KLMN is het dubbele van die van ABCD.', ans:'n', why:'De oppervlakte blijft behouden.'},
    {s:'O is het midden van [AL].', ans:'n', why:'Het beeld van A is K, niet L.'}, {s:'KLMN is geen parallellogram.', ans:'n', why:'De evenwijdigheid blijft behouden: KLMN is ook een parallellogram.'}];
  const w = R.shuffle(pool.filter(x=>x.ans==='w')).slice(0,3), n = R.shuffle(pool.filter(x=>x.ans==='n')).slice(0,3);
  wnRows(b, st, save, 'w', R.shuffle(w.concat(n)));
}};

/* --- verdieping: slim tekenen met eigenschappen --- */
EG.slim = { title:'Slim tekenen met eigenschappen', lvl:3, instr:'Teken het beeld van de rechte l zonder elk punt af te beelden. A′ is al gegeven. Klik twee roosterpunten die op het beeld l′ liggen.', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,12,0,8];
  const kinds = R.shuffle(['t','p','s','r']).slice(0,2);
  kinds.forEach((k,i)=>{
    let A, B, op; for(let t=0;t<600;t++){
      const d = R.pick([[1,2],[2,1],[1,-1],[2,-1],[1,-2],[1,1]]); A = [R.int(1,6), R.int(1,7)]; B = [A[0]+d[0], A[1]+d[1]];
      if(k==='t'){ op = genOpK(R, g, 't'); op.from = [R.int(0,8), R.int(0,8)]; op.name = ['X','Y']; if(!inG([op.from[0]+op.v[0], op.from[1]+op.v[1]], g)) continue; }
      if(k==='p'){ op = {t:'p', c:[R.int(3,9), R.int(2,6)], name:'O'}; }
      if(k==='r'){ op = {t:'r', c:[R.int(3,9), R.int(2,6)], deg:R.pick([90,-90]), name:'O'}; }
      if(k==='s'){ const c = R.int(4,8); op = {t:'s', p:[c,0], q:[c,8], name:'a', nAt:'start'}; const tS = (c-A[0])/d[0]; if(Math.abs(tS-Math.round(tS))>1e-9 || !inG([c, A[1]+tS*d[1]], g, 1)) continue; }
      const A2 = applyOp(A, op), B2 = applyOp(B, op); if(!inG(A,g) || !inG(B,g) || !inG(A2,g) || !inG(B2,g) || ptEq(A,A2)) continue;
      if(k!=='s' && Math.abs(cross3(A, B, A2))<1e-9) continue;
      if(k==='s' && Math.abs(A[0]-op.p[0])<1) continue;
      break; }
    const A2 = applyOp(A, op), B2 = applyOp(B, op);
    const help = {t:'Een translatie bewaart de evenwijdigheid, en het beeld van een rechte is een evenwijdige rechte. Dus l′ ∥ l door A′.', p:'Bij een spiegeling om een punt is het beeld van een rechte een evenwijdige rechte. Dus l′ ∥ l door A′.', r:'Een rotatie over 90° bewaart de loodrechte stand: l′ staat loodrecht op l en gaat door A′.', s:'Het snijpunt van l met de as is een dekpunt. l′ gaat door dat punt en door A′.'}[k];
    const tag = {t:`t<sub>${vecN('X','Y')}</sub>`, p:'s<sub>O</sub>', r:`r(O, ${degTxt(op.deg)})`, s:'s<sub>a</sub>'}[k];
    if(kinds.length>1) b.append(el('div','sub', `<b>${LET[i]}.</b>`));
    placeTask(b, st, save, 'l'+i, {g, fig:{pts:[A], names:['A']}, op, mode:'as', ans:[A2, B2], html:`Teken het beeld van l door ${tag}.`,
      figObjs:()=>{ const [p,q] = clipG(A, B, g, .2); return opBase(op).concat([{t:'line', a:p, b:q, c:'seg'}, {t:'txt', p:q, s:'l', c:'axn', dx:2, dy:-1.5}, {t:'pt', p:A, n:'A', c:'orig'}, {t:'pt', p:A2, n:'A'+PR, c:'img'}]); },
      solObjs:()=>{ const [p,q] = clipG(A2, B2, g, .2); return [{t:'line', a:p, b:q, c:'seg img'}, {t:'txt', p:q, s:'l′', c:'axn', dx:2, dy:-1.5}]; },
      infoMsg:'Klik twee verschillende roosterpunten op l′.', badMsg:'Welke eigenschap helpt je? ' + (k==='r' ? 'Denk aan de loodrechte stand.' : k==='s' ? 'Denk aan het dekpunt op de as.' : 'Denk aan evenwijdigheid.'), end:help });
  });
}};

/* --- verdieping: welke transformaties? --- */
EG.welke = { title:'Bijzondere eigenschappen', lvl:3, instr:'Vink telkens alle transformaties aan die passen.', build:(b,st,save)=>{
  const R = makeR(st);
  const qs = [{html:'Bij welke transformatie is het beeld van een rechte <b>altijd evenwijdig</b> met die rechte?', ans:['t','p'], why:'Bij een translatie en bij een spiegeling om een punt. Bij een rotatie of een spiegeling om een as kan de beeldrechte schuin staan.'},
    {html:'Welke transformatie heeft <b>altijd een dekpunt</b> (een punt dat zichzelf als beeld heeft)?', ans:['s','r','p'], why:'De punten op de as, en het centrum van een rotatie of puntspiegeling. Bij een translatie verschuift elk punt.'},
    {html:'Bij welke transformatie wordt de figuur <b>omgeklapt</b>?', ans:['s'], why:'Enkel bij een spiegeling om een as. Een spiegeling om een punt is een halve draai: de figuur klapt niet om.'},
    {html:'Bij welke transformatie verschuift <b>elk punt even ver</b>?', ans:['t'], why:'Enkel bij een translatie. Bij een rotatie gaan punten verder van het centrum ook verder.'}];
  R.shuffle(qs).forEach((q,i)=>qMulti(b, st, save, 'q'+i, {nr:LET[i]+'.', html:q.html, opts:TYPES4, ans:q.ans, why:q.why, whyBad:'Probeer elke transformatie in gedachten uit, bijvoorbeeld met een rechte of een driehoek.'}));
}};

/* --- noteer alles zelf: notatievak met alle tekens, en zinnen met kernwoorden --- */
(function(){
  const css = `
  .nb{ display:flex; flex-direction:column; gap:.4rem; margin:.35rem 0 }
  .nb-view{ position:relative; min-height:2.6rem; display:flex; align-items:flex-end; flex-wrap:wrap; padding:.45rem .7rem; border:2px solid var(--border); border-radius:.6rem; background:var(--card); font-size:1.3rem; cursor:text; line-height:1.5 }
  .nb-view.focus{ border-color:var(--orange) }
  .nb-view.ok{ border-color:var(--ok) } .nb-view.bad{ border-color:var(--bad) }
  .nb-view input{ position:absolute; inset:0; width:100%; height:100%; opacity:0; border:0; font-size:16px; cursor:text }
  .nb-view .nb-ph{ color:var(--ink-soft); font-size:.95rem; align-self:center }
  .nb-view sub{ font-size:.7em } .nb-view .vec-n{ margin:0 .05em }
  .nb-caret{ display:inline-block; width:2px; height:1.15em; background:var(--orange); margin-left:1px; align-self:center; animation:nbBl 1s steps(1) infinite }
  .nb-view:not(.focus) .nb-caret{ display:none }
  @keyframes nbBl{ 50%{ opacity:0 } }
  .nb-keys{ display:flex; flex-wrap:wrap; gap:.3rem }
  .nb-keys button{ font:inherit; font-size:1.05rem; min-width:2.3rem; padding:.25rem .55rem; border-radius:.5rem; border:1.5px solid var(--tq); background:var(--card); color:var(--ink); cursor:pointer }
  .nb-keys button:hover{ border-color:var(--orange) }
  .nb-keys button.on{ background:var(--or-soft); border-color:var(--orange); box-shadow:inset 0 0 0 1.5px var(--orange) }
  .nb-keys .sep{ width:.4rem }
  .nb-hint{ font-size:.9rem; color:var(--ink-soft) }
  .zin-ta{ width:100%; min-height:3.2rem; font:inherit; font-size:1.02rem; padding:.45rem .6rem; border-radius:.6rem; border:2px solid var(--border); background:var(--card); color:var(--ink); resize:vertical; box-sizing:border-box }
  .zin-ta:focus{ outline:none; border-color:var(--orange) }
  .zin-ta.ok{ border-color:var(--ok) } .zin-ta.bad{ border-color:var(--bad) }`;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();
const NB_VEC = '<svg viewBox="0 0 20 6" preserveAspectRatio="none" aria-hidden="true"><path d="M.5 3H19.3M16.2 .6L19.4 3L16.2 5.4"/></svg>';
/* tokens {c, sub, vec}: opeenvolgende vec-tokens vormen samen één vector */
function nbHtml(tk){
  let h = '', i = 0;
  while(i<tk.length){
    const sub = tk[i].sub; let part = '';
    while(i<tk.length && tk[i].sub===sub){
      if(tk[i].vec){ let v = ''; while(i<tk.length && tk[i].sub===sub && tk[i].vec){ v += escH(tk[i].c); i++; } part += `<span class="vec-n"><i>${NB_VEC}</i>${v}</span>`; }
      else { part += escH(tk[i].c); i++; }
    }
    h += sub ? `<sub>${part}</sub>` : part;
  }
  return h;
}
const escH = c => c==='<' ? '&lt;' : c==='>' ? '&gt;' : c==='&' ? '&amp;' : c;
/* vaste schrijfwijze om te vergelijken: _{..} voor de index, >{..} voor een vector */
function nbSer(tk){
  let o = '', sub = 0, vec = 0;
  tk.forEach(t=>{ if(vec && (!t.vec || t.sub!==sub)){ o += '}'; vec = 0; } if(t.sub!==sub){ o += t.sub ? '_{' : '}'; sub = t.sub; } if(t.vec && !vec){ o += '>{'; vec = 1; } o += t.c; });
  if(vec) o += '}'; if(sub) o += '}';
  return o.replace(/[−–]/g,'-').replace(/['’]/g,'′').replace(/°/g,'').replace(/\+(?=\d)/g,'');
}
const nbFlat = x => x.replace(/[_>]\{|\}/g,'');
function notBox(parent, s, opt={}){
  s.tk = s.tk || []; const mode = {sub:0, vec:0};
  const wrap = el('div','nb'); parent.append(wrap);
  const view = el('div','nb-view'); const inp = document.createElement('input'); inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('autocapitalize','off'); inp.setAttribute('aria-label','notatie');
  const show = el('span',''); view.append(show, inp);
  const keys = el('div','nb-keys'); wrap.append(view, keys);
  let locked = false;
  const paint = () => { show.innerHTML = s.tk.length ? nbHtml(s.tk) + '<span class="nb-caret"></span>' : '<span class="nb-ph">Klik hier en noteer…</span><span class="nb-caret"></span>'; bSub.classList.toggle('on', !!mode.sub); bVec.classList.toggle('on', !!mode.vec); };
  const changed = () => { view.classList.remove('ok','bad'); paint(); opt.onChange && opt.onChange(); };
  const add = c => { if(locked) return; if(c===' ') return; s.tk.push({c, sub:mode.sub, vec:mode.vec && /[A-Za-z]/.test(c) ? 1 : 0}); changed(); };
  const back = () => { if(locked) return; s.tk.pop(); changed(); };
  const k = (lab, fn, title) => { const x = el('button','', lab); x.type = 'button'; if(title) x.title = title; x.addEventListener('pointerdown', e=>e.preventDefault()); x.addEventListener('click', ()=>{ fn(); inp.focus(); }); keys.append(x); return x; };
  const bSub = k('x<sub>□</sub> index', ()=>{ mode.sub = mode.sub ? 0 : 1; if(!mode.sub) mode.vec = 0; paint(); }, 'index aan of uit');
  const bVec = k(`<span class="vec-n"><i>${NB_VEC}</i>AB</span> vector`, ()=>{ mode.vec = mode.vec ? 0 : 1; paint(); }, 'vector aan of uit');
  keys.append(el('span','sep'));
  ['s','t','r','(',')','=',',','°','−','′','Δ'].forEach(c=>k(c, ()=>add(c)));
  keys.append(el('span','sep'));
  k('⌫', back, 'wis het laatste teken'); k('Wis alles', ()=>{ if(locked) return; s.tk = []; changed(); });
  inp.addEventListener('input', ()=>{ const v = inp.value; inp.value = ''; [...v].forEach(c=>{ if(/[A-Za-z0-9()=,°′'’+\-−–Δ]/.test(c)) add(c==='-'||c==='–' ? '−' : c==='\'' || c==='’' ? '′' : c); }); });
  inp.addEventListener('keydown', e=>{ if(e.key==='Backspace'){ e.preventDefault(); back(); } else if(e.key==='Enter'){ e.preventDefault(); opt.onEnter && opt.onEnter(); } else if(e.key==='_'){ e.preventDefault(); bSub.click(); } });
  inp.addEventListener('focus', ()=>view.classList.add('focus')); inp.addEventListener('blur', ()=>view.classList.remove('focus'));
  paint();
  return { view, ser:()=>nbSer(s.tk), empty:()=>!s.tk.length, lock(){ locked = true; inp.readOnly = true; keys.querySelectorAll('button').forEach(b=>b.disabled = true); }, mark(ok){ view.classList.remove('ok','bad'); view.classList.add(ok?'ok':'bad'); } };
}
/* één opgave: zin -> notatie */
function zelfNotQ(parent, st, save, id, q){
  const qid = QID(id); CLvraag(qid);
  const s = st[id] || (st[id] = {});
  const row = el('div','q'); parent.append(row);
  row.append(el('div','q-text block', `<span class="q-num">${q.nr}</span>${q.html}`));
  const fb = el('div','fb');
  const box = notBox(row, s, {onChange:()=>{ fb.className = 'fb'; fb.textContent = ''; save(); }, onEnter:()=>run(false)});
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type = 'button'; act.append(bC); row.append(act, fb);
  function evaluate(){
    if(box.empty()) return {info:true, msg:'Noteer eerst de volledige notatie.'};
    const a = box.ser(), w = q.ser;
    if(a===w) return {ok:true};
    const fa = nbFlat(a), fw = nbFlat(w);
    if(fa===fw) return {msg: q.k==='t' ? 'De tekens kloppen, maar zet de vector met een pijl in de index: zet <b>index</b> en <b>vector</b> aan.' : q.k==='r' ? 'De tekens kloppen, maar bij een rotatie staat er niets in de index.' : 'De tekens kloppen, maar zet de as of het centrum in de index: zet <b>index</b> aan.'};
    if(fa[0]!==fw[0]) return {msg:'Welke letter hoort bij deze transformatie? s voor een spiegeling, t voor een translatie, r voor een rotatie.'};
    if(q.k==='r'){ const m = fa.match(/^r\(([^,]*),(-?\d+)\)/); if(m && Number(m[2])===-q.h) return {msg:'Kijk naar de draaizin: tegenwijzerzin is positief, wijzerzin is negatief.'}; if(!/^r\([^,]+,-?\d+\)\(/.test(fa)) return {msg:'Een rotatie noteer je als r(centrum, hoek)(punt) = beeld.'}; }
    if(fa===fw.replace(`(${q.a})=${q.b}`, `(${q.b})=${q.a}`)) return {msg:'Let op de volgorde: tussen haakjes staat het punt dat je afbeeldt, na het gelijkheidsteken het beeld.'};
    if(!fa.includes('=')) return {msg:'Vergeet het gelijkheidsteken en het beeld niet.'};
    return {msg:'Vergelijk met de zin: welke transformatie, welk element (as, vector, centrum), welk punt en welk beeld?'};
  }
  function run(silent){
    const r = evaluate(); fb.className = 'fb ' + (r.ok?'ok':r.info?'info':'bad'); fb.innerHTML = r.ok ? '✅ Juist! ' + q.sol : r.info ? r.msg : '❌ Nog niet juist. ' + r.msg;
    if(r.info) return; box.mark(!!r.ok); s.checked = true; save(); if(!silent) CLres(qid, !!r.ok);
  }
  bC.addEventListener('click', ()=>run(false)); if(s.checked) run(true);
}
/* één opgave: notatie -> zin, nagekeken op kernwoorden */
function zinChk(txt, q){
  const t = ' ' + txt.replace(/\s+/g,' ').trim() + ' ';
  const has = re => re.test(t); const miss = [];
  const P = x => `(het )?(punt )?${x}(?![A-Za-z])`;
  if(!has(/beeld/i)) miss.push('het woord <b>beeld</b>');
  else if(!has(new RegExp(`${q.b}[^.]*beeld van ${P(q.a)}`, 'i')) && !has(new RegExp(`beeld van ${P(q.a)}[^.]*(is|=) ${P(q.b)}`, 'i'))) miss.push(`wie het beeld is van wie (${q.b} is het beeld van ${q.a})`);
  if(q.k==='s'){ if(!has(/spiegeling/i)) miss.push('de naam van de transformatie'); if(!has(new RegExp(`(as|rechte) ${q.e}(?![A-Za-z])`))) miss.push(`de as ${q.e}`); }
  if(q.k==='p'){ if(!has(/spiegeling/i)) miss.push('de naam van de transformatie'); if(!has(new RegExp(`punt ${q.e}(?![A-Za-z])`)) && !has(new RegExp(`puntspiegeling (om|rond) ${q.e}(?![A-Za-z])`, 'i'))) miss.push(`het punt ${q.e} waarom je spiegelt`); }
  if(q.k==='t'){ if(!has(/translatie|verschuiving/i)) miss.push('de naam van de transformatie'); if(!has(/vector/i)) miss.push('het woord <b>vector</b>'); if(!has(new RegExp(`(?<![A-Za-z])${q.e}(?![A-Za-z])`))) miss.push(`de vector ${vecN(q.e[0], q.e[1])}`); }
  if(q.k==='r'){ if(!has(/rotatie|draaiing/i)) miss.push('de naam van de transformatie'); if(!has(new RegExp(`(?<![A-Za-z])${q.e}(?![A-Za-z])`))) miss.push(`het centrum ${q.e}`);
    if(!has(new RegExp(`(?<![0-9])${Math.abs(q.h)} ?(°|graden)`))) miss.push('de hoekgrootte in graden');
    const tw = has(/tegenwijzerzin/i), w = has(/(?<!tegen)wijzerzin/i);
    if(q.h>0 ? (!tw || w) : (!w || tw)) miss.push(tw||w ? 'de juiste draaizin (kijk naar het teken van de hoek)' : 'de draaizin (wijzerzin of tegenwijzerzin)'); }
  return miss;
}
function zelfZinQ(parent, st, save, id, q){
  const qid = QID(id); CLvraag(qid);
  const s = st[id] || (st[id] = {v:''});
  const row = el('div','q'); parent.append(row);
  row.append(el('div','q-text block', `<span class="q-num">${q.nr}</span>Schrijf in woorden: <span class="lg">${q.sol}</span>`));
  const ta = document.createElement('textarea'); ta.className = 'zin-ta'; ta.placeholder = 'Schrijf een volledige zin…'; ta.value = s.v || ''; row.append(ta);
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type = 'button'; act.append(bC);
  const fb = el('div','fb'); row.append(act, fb);
  ta.addEventListener('input', ()=>{ s.v = ta.value; ta.classList.remove('ok','bad'); fb.className = 'fb'; fb.textContent = ''; save(); });
  function run(silent){
    if(!ta.value.trim()){ fb.className = 'fb info'; fb.textContent = 'Schrijf eerst een zin.'; return; }
    const miss = zinChk(ta.value, q); const ok = !miss.length;
    ta.classList.remove('ok','bad'); ta.classList.add(ok?'ok':'bad');
    fb.className = 'fb ' + (ok?'ok':'bad'); fb.innerHTML = ok ? '✅ Juist! Bijvoorbeeld: ' + q.html : '❌ Nog niet volledig. Er ontbreekt: ' + miss.join(', ') + '.';
    s.checked = true; save(); if(!silent) CLres(qid, ok);
  }
  bC.addEventListener('click', ()=>run(false)); if(s.checked) run(true);
}
function zelfItems(R){
  const L = R.letters(13, 'EFGHJKLMNPRSTUVWZ');
  const ax = R.pick(['a','b','c','d']);
  const a1 = R.pick([40,60,70,80,110,130]), a2 = R.pick([30,45,90,120,150]);
  const T = s => s.replace(/−/g,'-');
  const it = {
    t:{k:'t', e:L[0]+L[1], a:L[2], b:L[3], html:`${L[3]} is het beeld van ${L[2]} door de translatie over de vector ${vecN(L[0],L[1])}.`, sol:`t<sub>${vecN(L[0],L[1])}</sub>(${L[2]}) = ${L[3]}`, ser:`t_{>{${L[0]}${L[1]}}}(${L[2]})=${L[3]}`},
    rp:{k:'r', e:'O', h:a1, a:L[4], b:L[5], html:`${L[5]} is het beeld van ${L[4]} door de rotatie rond het centrum O over ${a1}° in tegenwijzerzin.`, sol:`r(O, ${a1}°)(${L[4]}) = ${L[5]}`, ser:`r(O,${a1})(${L[4]})=${L[5]}`},
    rm:{k:'r', e:'O', h:-a2, a:L[6], b:L[7], html:`${L[7]} is het beeld van ${L[6]} door de rotatie rond het centrum O over ${a2}° in wijzerzin.`, sol:`r(O, −${a2}°)(${L[6]}) = ${L[7]}`, ser:T(`r(O,−${a2})(${L[6]})=${L[7]}`)},
    s:{k:'s', e:ax, a:L[8], b:L[9], html:`${L[9]} is het beeld van ${L[8]} door de spiegeling om de as ${ax}.`, sol:`s<sub>${ax}</sub>(${L[8]}) = ${L[9]}`, ser:`s_{${ax}}(${L[8]})=${L[9]}`},
    p:{k:'p', e:L[10], a:L[11], b:L[12], html:`${L[12]} is het beeld van ${L[11]} door de spiegeling om het punt ${L[10]}.`, sol:`s<sub>${L[10]}</sub>(${L[11]}) = ${L[12]}`, ser:`s_{${L[10]}}(${L[11]})=${L[12]}`}};
  const [r1, r2] = R.shuffle(['rp','rm']), [m1, m2] = R.shuffle(['s','p']);
  return { not:R.shuffle([it.t, it[r1], it[m1]]), zin:R.shuffle([it[m2], it[r2]]) };
}
NT.zelf = { title:'Noteer alles zelf', lvl:2, instr:'Noteer eerst de zinnen volledig in symbolen. Typ met je toetsenbord of gebruik de knoppen. Zet <b>index</b> aan voor wat onderaan staat en <b>vector</b> voor een pijl boven twee letters. Schrijf daarna de notaties uit in een volledige zin.', build:(b,st,save)=>{
  const R = makeR(st); const I = zelfItems(R);
  I.not.forEach((q,i)=>zelfNotQ(b, st, save, 'n'+i, {...q, nr:LET[i]+'.'}));
  I.zin.forEach((q,i)=>zelfZinQ(b, st, save, 'z'+i, {...q, nr:LET[i+3]+'.'}));
}};
/* ============================================================
   KAARTEN 7: ROOSTERS
   Punten op een rooster van vierkanten, zoals vraag 5 van de toets:
   eerst beelden aanklikken, dan de notatie aanvullen.
   ============================================================ */
(function(){
  const css = `
  .lt-lab{ margin:.1rem 0 .45rem; font-size:.98rem }
  .lt-list{ display:flex; flex-direction:column; gap:.4rem }
  .lt-row{ font:inherit; font-size:1.12rem; display:flex; align-items:center; gap:.55rem; text-align:left; padding:.35rem .65rem; border-radius:.6rem; border:1.5px solid var(--tq); background:var(--card); color:var(--ink); cursor:pointer }
  .lt-row:hover{ border-color:var(--orange) }
  .lt-row.cur{ border-color:var(--orange); box-shadow:inset 0 0 0 1.5px var(--orange) }
  .lt-row.good{ border-color:var(--ok); background:var(--ok-bg) }
  .lt-row.wrong{ border-color:var(--bad); background:var(--bad-bg) }
  .lt-row .q-num{ margin:0 }
  .lt-slot{ display:inline-block; min-width:1.5em; padding:0 .15em; text-align:center; border-bottom:2px solid var(--tq); font-weight:700 }
  .lt-row.cur .lt-slot{ border-color:var(--orange) }
  .lt-row .lt-sol{ margin-left:auto; font-size:.9rem; color:var(--bad) }
  .lt-hbtn{ font:inherit; font-size:.9rem; padding:.15rem .5rem; border-radius:.5rem; border:1.5px solid var(--or-line); background:var(--or-soft); color:var(--ink); cursor:pointer; margin-left:.3rem }
  .lt-hbtn.on{ border-color:var(--orange); font-weight:700 }
  .lt-qs .q{ display:flex; flex-wrap:wrap; align-items:center; gap:.3rem .6rem; padding:.45rem 0; margin:0 }
  .lt-qs .q-text{ flex:1 1 auto; font-size:1.12rem; margin:0; gap:.15rem }
  .lt-qs .q-text > sub{ align-self:flex-end; margin-bottom:-.45rem; font-size:.8em }
  .lt-qs sub .inp{ width:2.3rem; height:1.7rem; padding:0 .2rem; font-size:.95rem }
  .lt-qs .q-act .btn{ padding:.35rem .8rem }
  .lt-qs .q-act{ margin:0; gap:.4rem }
  .lt-qs .fb, .lt-qs .sol{ flex-basis:100% }
  .lt-qs .fb:empty{ display:none }
  .lt-qs .inp.xs{ width:2.7rem; min-width:0 } .lt-qs .inp.sm{ width:3.8rem; min-width:0 }
  .ro-demo{ display:flex; flex-wrap:wrap; gap:.4rem; margin:.3rem 0 .5rem }
  .cf .latline.sel{ stroke:var(--orange); stroke-width:1.1 }
  .cf .selc{ fill:none; stroke:var(--orange); stroke-width:.8 }
  .cf .selp{ fill:none; stroke:var(--accent-dark); stroke-width:.6; stroke-dasharray:1.3 .8 }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();
const RO = {};
const LAT_P = 'ABCDEFGHIJKLMNPQRSTUVWXYZ', LAT_L = 'abcdefghijkmnpqrstuvwxyz', LS = 2;
/* rooster met cols x rows punten; de punten heten rij per rij vanaf boven, de verticale rechten eerst */
function latScene(R, cols, rows, o={}){
  const pts = {}; let i = 0;
  for(let y=rows-1;y>=0;y--) for(let x=0;x<cols;x++) pts[LAT_P[i++]] = [LS*x, LS*y];
  const names = Object.keys(pts), ops = [], lines = []; let j = 0;
  for(let x=0;x<cols;x++){ const op = {t:'s', p:[LS*x,0], q:[LS*x,1], name:LAT_L[j++], key:'sv'+x, vert:true}; ops.push(op); lines.push(op); }
  for(let k=0;k<rows;k++){ const y = LS*(rows-1-k); const op = {t:'s', p:[0,y], q:[1,y], name:LAT_L[j++], key:'sh'+k, vert:false}; ops.push(op); lines.push(op); }
  names.forEach(n=>{ const c = pts[n]; ops.push({t:'p', c, name:n, key:'p'+n}); [90,-90].concat(o.r180 ? [180] : []).forEach(d=>ops.push({t:'r', c, deg:d, name:n, key:'r'+n+d})); });
  /* translaties over een korte vector tussen twee roosterpunten */
  const nv = o.nv || 4; let tv = 0;
  for(let t=0; tv<nv && t<600; t++){ const a = R.pick(names), b = R.pick(names); if(a===b) continue;
    const v = [pts[b][0]-pts[a][0], pts[b][1]-pts[a][1]];
    if(Math.abs(v[0])>2*LS || Math.abs(v[1])>2*LS) continue;
    if(ops.some(z=>z.t==='t' && ptEq(z.v, v))) continue;
    ops.push({t:'t', v, name:[a,b], key:'t'+a+b}); tv++; }
  return {pts, names, ops, lines, cols, rows, W:LS*(cols-1), H:LS*(rows-1), find:p=>names.find(n=>ptEq(pts[n], p))};
}
function latBase(sc){
  const o = [];
  sc.lines.forEach(L=>{
    if(L.vert){ const x = L.p[0]; o.push({t:'line', a:[x,-1], b:[x,sc.H+1.3], c:'latline'}, {t:'txt', p:[x+.6, sc.H+1.1], s:L.name, c:'axn', anchor:'start'}); }
    else { const y = L.p[1]; o.push({t:'line', a:[-1.2,y], b:[sc.W+1.5,y], c:'latline'}, {t:'txt', p:[sc.W+1.75, y], s:L.name, c:'axn', anchor:'start', dy:1.9}); } });
  /* streepjes: alle zijden van de vakjes zijn even lang */
  for(let r=0;r<sc.rows;r++) for(let c=0;c<sc.cols-1;c++) o.push({t:'ticks', a:[LS*c, LS*r], b:[LS*c+LS, LS*r], n:2});
  for(let c=0;c<sc.cols;c++) for(let r=0;r<sc.rows-1;r++) o.push({t:'ticks', a:[LS*c, LS*r], b:[LS*c, LS*r+LS], n:2});
  sc.names.forEach(n=>{ const p = sc.pts[n]; o.push({t:'pt', p, n, c:'orig', r:1.35, away:[p[0]+1, p[1]-1.4]}); });
  return o;
}
function latFig(parent, sc, o={}){
  const F = gridFig(parent, {g:[-1.5, sc.W+2.1, -1.3, sc.H+2], plain:true, maxw:o.maxw || Math.min(430, 64*sc.cols+60)});
  F.base = latBase(sc); F.draw([]); return F;
}
/* ---------- hulpjes voor hints op het rooster ---------- */
const vakTxt = n => n===1 ? '1 vakje' : n + ' vakjes';
function dirTxt(v){ const dx = Math.round(v[0]/LS), dy = Math.round(v[1]/LS), p = [];
  if(dx) p.push(`${vakTxt(Math.abs(dx))} naar ${dx>0?'rechts':'links'}`);
  if(dy) p.push(`${vakTxt(Math.abs(dy))} naar ${dy>0?'boven':'beneden'}`);
  return p.join(' en ') || 'niets'; }
const hArrow = (a, b) => ({t:'raw', s:cfArrow(a, b, 'hintl solid').replace('class="hintl solidh"', 'class="hintlh"')});
const hRing = q => ({t:'raw', s:`<circle class="hintring" cx="${X(q[0])}" cy="${Y(q[1])}" r="2.7"/>`});
/* trapje: eerst horizontaal, dan verticaal tellen */
function stair(a, b){ const m = [b[0], a[1]], o = [];
  if(!ptEq(a, m)) o.push(hArrow(a, m), {t:'txt', p:[(a[0]+m[0])/2, a[1]], s:String(Math.abs(Math.round((m[0]-a[0])/LS))), c:'hint', dy:4.4});
  if(!ptEq(m, b)) o.push(hArrow(m, b), {t:'txt', p:[m[0], (m[1]+b[1])/2], s:String(Math.abs(Math.round((b[1]-m[1])/LS))), c:'hint', dx:2.2, dy:1.6, anchor:'start'});
  return o; }
function invOp(op){ if(op.t==='t') return {...op, v:[-op.v[0], -op.v[1]]}; if(op.t==='r') return {...op, deg:op.deg===180 ? 180 : -op.deg}; return op; }
const zinLang = d => Math.abs(d)===180 ? 'een halve draai' : `${Math.abs(d)}° in ${zinTxt(d)} (${d>0?'↺':'↻'})`;
/* hint in twee delen bij één punt: geeft {objs, txt} */
function latHint(sc, task, stage){
  const op = task.op, back = task.kind==='pre', use = back ? invOp(op) : op;
  const Pn = back ? task.to : task.from, P = sc.pts[Pn], Q = applyOp(P, use);
  const wat = back ? 'het origineel' : 'het beeld';
  const pre = back && stage===1 ? `Je zoekt het punt dat op ${Pn} terechtkomt. Werk terug vanuit ${Pn}. ` : '';
  if(op.t==='t'){ const [xn, yn] = op.name, a = sc.pts[xn], b = sc.pts[yn];
    const objs = back ? stair(b, a) : stair(a, b);
    if(stage===1) return {objs, txt: pre + (back ? `Van ${xn} naar ${yn} is ${dirTxt(op.v)}. Terug is dat ${dirTxt(use.v)}.` : `Kijk hoe je van ${xn} naar ${yn} gaat: ${dirTxt(op.v)}.`)};
    return {objs: objs.concat(stair(P, Q), [hRing(Q)]), txt:`Doe hetzelfde vanuit ${Pn}: ${dirTxt(use.v)}. Daar ligt ${wat}.`}; }
  if(ptEq(P, Q)) return {objs:[hRing(P)], txt:`${Pn} ligt op ${op.t==='s' ? 'de as '+op.name : 'het centrum'}: ${Pn} is een dekpunt. Het beeld is ${Pn} zelf.`};
  const objs = hintObjs(use, P, stage, '');
  if(op.t==='s'){ const Fp = footPt(P, op.p, op.q), d = [Fp[0]-P[0], Fp[1]-P[1]];
    return {objs, txt: stage===1 ? pre + `Ga vanuit ${Pn} loodrecht naar de as ${op.name}: ${dirTxt(d)}.` : `Ga aan de andere kant van ${op.name} nog eens ${dirTxt(d)}. Daar ligt ${wat}.`}; }
  if(op.t==='p'){ const d = [op.c[0]-P[0], op.c[1]-P[1]];
    return {objs, txt: stage===1 ? pre + `Ga van ${Pn} naar het centrum ${op.name}: ${dirTxt(d)}.` : `Ga vanuit ${op.name} nog eens ${dirTxt(d)}. Daar ligt ${wat}.`}; }
  if(op.t==='r'){ const d = [P[0]-op.c[0], P[1]-op.c[1]], e = [Q[0]-op.c[0], Q[1]-op.c[1]];
    return {objs, txt: stage===1 ? pre + `Van het centrum ${op.name} naar ${Pn} is ${dirTxt(d)}. Draai dat lijnstuk rond ${op.name} over ${zinLang(use.deg)}.` : `Na de draai ga je vanuit ${op.name} ${dirTxt(e)}. Daar ligt ${wat}.`}; }
  return {objs:[], txt:''};
}
/* wat bij een opgave op de tekening oplicht: de as, het centrum of de vector, en het gegeven punt */
function latOpObjs(sc, op, given){
  const o = [];
  if(op.t==='s') o.push(op.vert ? {t:'line', a:[op.p[0],-1], b:[op.p[0],sc.H+1.3], c:'latline sel'} : {t:'line', a:[-1.2,op.p[1]], b:[sc.W+1.5,op.p[1]], c:'latline sel'});
  else if(op.t==='t') o.push({t:'arrow', a:sc.pts[op.name[0]], b:sc.pts[op.name[1]], c:'vec'});
  else o.push({t:'raw', s:`<circle class="selc" cx="${X(op.c[0])}" cy="${Y(op.c[1])}" r="2.3"/>`});
  if(given) o.push({t:'raw', s:`<circle class="selp" cx="${X(given[0])}" cy="${Y(given[1])}" r="2.6"/>`});
  return o;
}
/* opgaven maken: specs [{kind:'img'|'pre', t:'s'|'p'|'t'|'r'}] */
function latGen(R, sc, specs){
  const out = [], used = new Set();
  specs.forEach(sp=>{
    const pool = sc.ops.filter(o=>o.t===sp.t && (sp.deg==null || o.deg===sp.deg));
    for(let tr=0; tr<800; tr++){
      const op = R.pick(pool), a = R.pick(sc.names); const b = sc.find(applyOp(sc.pts[a], op));
      if(!b || b===a || used.has(op.key+a)) continue;
      if(op.t==='t' && (a===op.name[0] || b===op.name[1])) continue;   /* te makkelijk */
      if(out.some(z=>z.op===op) && tr<400) continue;
      used.add(op.key+a);
      out.push({kind:sp.kind, op, from:a, to:b, ans:[sp.kind==='pre' ? a : b], html: sp.kind==='pre' ? `${opNot(op)}([[?]]) = ${b}` : `${opNot(op)}(${a}) = [[?]]`});
      break;
    }
  });
  return out;
}
/* ---------- klikopgaven: het punt aanklikken op het rooster ---------- */
function latTasks(parent, st, save, id, sc, tasks, cfg={}){
  const quiz = QZ; const s = st[id] || (st[id] = {a:{}, r:{}, cur:0});
  const qids = tasks.map((t,k)=>QID(id+'_'+k)); if(!quiz) qids.forEach(q=>CLvraag(q));
  const two = el('div','cf-two'); parent.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
  const F = latFig(L, sc, cfg);
  let hStage = 0, locked = false, revealed = false;
  let hBar = null, hBtn, hOff, hInfo, hTxt;
  if(!quiz){
    hBar = el('div','hintbar'); hBtn = el('button','hintbtn','💡 Hint'); hBtn.type = 'button';
    hOff = el('button','hintbtn off','Verberg de hint'); hOff.type = 'button'; hInfo = el('span','hintinfo');
    hBar.append(hBtn, hOff, hInfo); hTxt = el('div','hint-txt'); L.append(hBar, hTxt);
    hBtn.addEventListener('click', ()=>{ hStage = Math.min(2, hStage+1); paint(); });
    hOff.addEventListener('click', ()=>{ hStage = 0; paint(); });
  }
  Rt.append(el('p','lt-lab', cfg.lab || 'Klik een opgave aan. Klik dan op het juiste punt in het rooster.'));
  const list = el('div','lt-list'); Rt.append(list);
  const rowEl = tasks.map((t,k)=>{ const b = el('button','lt-row'); b.type = 'button';
    b.innerHTML = `<span class="q-num">${LET[k]}.</span><span class="lt-html">${t.html.replace('[[?]]', '<span class="lt-slot"></span>')}</span><span class="lt-sol"></span>`;
    b.addEventListener('click', ()=>{ s.cur = k; hStage = 0; save(); paint(); }); list.append(b); return b; });
  const act = el('div','q-act'); const bC = el('button','btn','Controleer'); bC.type = 'button';
  const bWis = el('button','linkbtn','Wis mijn antwoorden'); bWis.type = 'button'; act.append(bC, bWis); if(quiz) bC.hidden = true;
  const fb = el('div','fb'); Rt.append(act, fb);
  if(s.cur==null || s.cur>=tasks.length) s.cur = 0;
  function paint(){
    rowEl.forEach((b,k)=>{ b.classList.toggle('cur', k===s.cur && !revealed); b.classList.toggle('good', s.r[k]===true); b.classList.toggle('wrong', s.r[k]===false);
      b.querySelector('.lt-slot').textContent = s.a[k] || '?'; });
    const t = tasks[s.cur]; if(!t){ F.draw([]); return; }
    const given = sc.pts[t.kind==='pre' ? t.to : t.from];
    const o = latOpObjs(sc, t.op, given);
    let h = null;
    if(hStage && s.r[s.cur]!==true) h = latHint(sc, t, hStage);
    if(h) o.push(...h.objs);
    if(s.r[s.cur]===true) o.push(...latHint(sc, t, 2).objs, {t:'pt', p:sc.pts[t.kind==='pre' ? t.from : t.to], c:'img', r:1.65});
    else if(s.a[s.cur]) o.push({t:'pt', p:sc.pts[s.a[s.cur]], c:'mine', r:1.75});
    F.draw(o);
    if(hBar){ hBar.hidden = locked || s.r[s.cur]===true; hBtn.innerHTML = hStage ? '💡 Volgende hint' : '💡 Hint'; hBtn.disabled = hStage>=2; hOff.hidden = !hStage;
      hInfo.textContent = hStage ? `hint ${hStage} van 2 bij ${LET[s.cur]}.` : ''; hTxt.innerHTML = h ? h.txt : ''; }
  }
  F.clickable(p=>{ if(locked) return; const n = sc.find(p); if(!n || s.r[s.cur]===true) return;
    s.a[s.cur] = n; delete s.r[s.cur]; fb.textContent = ''; fb.className = 'fb';
    const nxt = tasks.findIndex((t,k)=>k>s.cur && !s.a[k]); const nxt2 = nxt>=0 ? nxt : tasks.findIndex((t,k)=>!s.a[k]);
    if(nxt2>=0 && !quiz){ s.cur = nxt2; hStage = 0; } else if(nxt2>=0) s.cur = nxt2;
    save(); paint(); }, {step:LS, allow:p=>!!sc.find(p)});
  bWis.addEventListener('click', ()=>{ if(locked) return; tasks.forEach((t,k)=>{ if(s.r[k]!==true){ delete s.a[k]; delete s.r[k]; } }); fb.textContent = ''; fb.className = 'fb'; save(); paint(); });
  function run(silent){
    const open = tasks.map((t,k)=>k).filter(k=>s.a[k] && s.r[k]!==true);
    if(!open.length && !silent){ fb.className = 'fb info'; fb.textContent = tasks.every((t,k)=>s.r[k]===true) ? 'Alles is al juist.' : 'Klik eerst een punt aan bij een opgave.'; return; }
    open.forEach(k=>{ const ok = tasks[k].ans.includes(s.a[k]); s.r[k] = ok; if(!silent) CLres(qids[k], ok); });
    const bad = tasks.map((t,k)=>k).filter(k=>s.r[k]===false), todo = tasks.filter((t,k)=>!s.a[k]).length;
    if(bad.length){ s.cur = bad[0]; hStage = 0;
      fb.className = 'fb bad'; fb.innerHTML = `❌ ${bad.map(k=>LET[k]).join(', ')}: nog niet juist. Klik op de opgave en vraag een 💡 hint als je vastzit.`; }
    else if(todo){ fb.className = 'fb ok'; fb.innerHTML = `✅ Wat je aanklikte, is juist. Nog ${todo} ${todo===1?'opgave':'opgaven'} te doen.`; }
    else { fb.className = 'fb ok'; fb.innerHTML = '✅ Alles juist! ' + (cfg.why || 'Klik op een opgave om te zien hoe je het punt vindt.'); }
    save(); paint();
  }
  bC.addEventListener('click', ()=>run(false));
  if(!quiz && Object.keys(s.r).length) run(true); else paint();
  if(quiz){
    tasks.forEach((t,k)=>quiz.push({ pts:1, grade:()=>t.ans.includes(s.a[k]),
      reveal:(ok)=>{ revealed = true; s.r[k] = ok; rowEl[k].querySelector('.lt-sol').textContent = ok ? '' : 'juist: ' + t.ans[0]; paint(); },
      lock:()=>{ locked = true; F.locked = true; bWis.hidden = true; } }));
  }
  return {F};
}

/* ---------- invulopgaven met een gedeelde tekening en een hint per opgave ---------- */
const VIN = f => `<span class="vec-in"><i><svg viewBox="0 0 20 6" preserveAspectRatio="none" aria-hidden="true"><path d="M.5 3H19.3M16.2 .6L19.4 3L16.2 5.4"/></svg></i>[[${f}:sm]]</span>`;
const kt = x => `<span class="kt">${x}</span>`;
/* rijen voor de notatie: kinds img, pre, el (as of centrum), cen, ang, vec, seg */
function latRows(R, sc, kinds){
  const rows = [], used = new Set(), pts = sc.pts, nm = sc.names;
  const ofT = t => sc.ops.filter(o=>o.t===t);
  for(let tr=0; rows.length<kinds.length && tr<6000; tr++){
    const kind = kinds[rows.length];
    if(kind==='img' || kind==='pre'){ const op = R.pick(sc.ops), a = R.pick(nm), b = sc.find(applyOp(pts[a], op));
      if(!b || b===a || used.has(op.key+a)) continue; if(op.t==='t' && (a===op.name[0] || b===op.name[1])) continue;
      if(rows.filter(r=>r.op && r.op.t===op.t).length>=2) continue;
      used.add(op.key+a); const task = {kind, op, from:a, to:b};
      rows.push({task, op, html: kind==='img' ? kt(`${opNot(op)}(${a}) = `) + '[[0]]' : kt(`${opNot(op)}(`) + '[[0]]' + kt(`) = ${b}`), ans: kind==='img' ? [b] : [a], k:'pt', sol:`<b>${kind==='img'?b:a}</b>`}); continue; }
    if(kind==='el'){ const op = R.pick(ofT(R.pick(['s','s','p']))), a = R.pick(nm), b = sc.find(applyOp(pts[a], op)); if(!b || b===a || used.has('e'+a+b)) continue;
      const ln = sc.lines.filter(L=>sc.find(applyOp(pts[a], L))===b).map(L=>L.name), cs = nm.filter(c=>ptEq(applyOp(pts[a], {t:'p', c:pts[c]}), pts[b]));
      used.add('e'+a+b); rows.push({html: kt('s') + '<sub>[[0]]</sub>' + kt(`(${a}) = ${b}`), ans:ln.concat(cs), k:'el', a, b, sol: [ln.length ? `de as <b>${ln.join(' of ')}</b>` : '', cs.length ? `het punt <b>${cs.join(' of ')}</b>` : ''].filter(Boolean).join(' of ')}); continue; }
    if(kind==='cen' || kind==='ang'){ const op = R.pick(ofT('r')), a = R.pick(nm), b = sc.find(applyOp(pts[a], op)); if(!b || b===a || used.has('r'+op.key+a)) continue;
      used.add('r'+op.key+a);
      if(kind==='cen'){ const cs = nm.filter(c=>ptEq(rotPt(pts[a], pts[c], op.deg), pts[b])); rows.push({op, html: kt('r(') + '[[0]]' + kt(`, ${degTxt(op.deg)})(${a}) = ${b}`), ans:cs, k:'cen', a, b, c:op.name, sol:`het centrum <b>${cs.join(' of ')}</b>`}); }
      else { const d1 = op.deg, d2 = d1>0 ? d1-360 : d1+360; rows.push({op, html: kt(`r(${op.name}, `) + '[[0]]' + kt(`°)(${a}) = ${b}`), ans:[d1, d2], k:'ang', a, b, c:op.name, sol:`${degTxt(d1)} of ${degTxt(d2)}`}); }
      continue; }
    if(kind==='vec'){ const a = R.pick(nm), b = R.pick(nm); if(a===b || used.has('v'+a)) continue; const v = [pts[b][0]-pts[a][0], pts[b][1]-pts[a][1]];
      if(Math.abs(v[0])>2*LS || Math.abs(v[1])>2*LS || (!v[0] && !v[1])) continue;
      const pairs = []; nm.forEach(x=>{ const y = sc.find([pts[x][0]+v[0], pts[x][1]+v[1]]); if(y && x!==a) pairs.push(x+y); }); if(!pairs.length) continue;
      used.add('v'+a); rows.push({html: kt('t') + '<sub>' + VIN(0) + '</sub>' + kt(`(${a}) = ${b}`), ans:pairs, k:'vec', a, b, v, sol:`bijvoorbeeld ${pairs.slice(0,2).map(p=>vecN(p[0],p[1])).join(' of ')}`}); continue; }
    if(kind==='seg'){ const L = R.pick(sc.lines), a = R.pick(nm), dirs = [[LS,0],[0,LS],[LS,LS],[LS,-LS]], d = R.pick(dirs); const c = sc.find([pts[a][0]+d[0], pts[a][1]+d[1]]); if(!c) continue;
      const a2 = sc.find(applyOp(pts[a], L)), c2 = sc.find(applyOp(pts[c], L)); if(!a2 || !c2 || (a2===a && c2===c) || used.has('g'+L.name)) continue;
      used.add('g'+L.name); rows.push({html: kt(`s<sub>${L.name}</sub>([${a}${c}]) = [`) + '[[0]]' + kt(']'), ans:[a2+c2, c2+a2], k:'seg', op:L, a, c, a2, c2, sol:`[${a2}${c2}]`, size:'sm'}); continue; }
  }
  return rows;
}
function latRowCheck(r, v){
  const raw = String(v).trim().replace(/[\[\]′'’\s]/g, '');
  if(r.k==='ang'){ const a = parseAng(v); if(isNaN(a)) return {ok:false, msg:'Typ een hoek, bijvoorbeeld 90 of −90.'};
    if(r.ans.some(x=>angEq(x, a))) return {ok:true};
    if(r.ans.some(x=>angEq(x, -a))) return {ok:false, msg:'Kijk naar de zin: tegenwijzerzin is positief, wijzerzin is negatief.'};
    return {ok:false, msg:'Hoeveel keer een kwart draai? Een kwart draai is 90°.'}; }
  if(!raw) return {ok:false, msg:'Typ een letter.'};
  if(r.k==='el'){ if(r.ans.includes(raw)) return {ok:true};
    if(r.ans.some(x=>x.toLowerCase()===raw.toLowerCase())) return {ok:false, msg:'Let op de schrijfwijze: een rechte of as krijgt een kleine letter, een punt een hoofdletter.'};
    return {ok:false, msg:`Het element ligt precies tussen ${r.a} en ${r.b}: een as loodrecht op [${r.a}${r.b}] door het midden, of het midden zelf.`}; }
  const up = raw.toUpperCase();
  if(r.k==='vec'){ if(up.length!==2) return {ok:false, msg:'Typ twee letters: het beginpunt en het eindpunt van de vector.'};
    if(r.ans.includes(up)) return {ok:true};
    if(r.ans.includes(up[1]+up[0])) return {ok:false, msg:'Je vector wijst in de tegengestelde zin. Hij moet wijzen zoals van ' + r.a + ' naar ' + r.b + '.'};
    return {ok:false, msg:`Van ${r.a} naar ${r.b} is ${dirTxt(r.v)}. Zoek twee punten met dezelfde stappen.`}; }
  if(r.k==='seg'){ if(r.ans.includes(up)) return {ok:true}; return {ok:false, msg:'Spiegel elk eindpunt afzonderlijk. Het beeld van het lijnstuk ligt tussen de twee beeldpunten.'}; }
  if(raw!==up) return {ok:false, msg:'Een punt noteer je met een hoofdletter.'};
  return {ok:r.ans.includes(up), msg:r.ans.includes(up) ? '' : 'Voer de transformatie uit op het punt tussen haakjes. Vraag een 💡 hint als je vastzit.'};
}
/* hint in twee delen voor een invulrij */
function latRowHint(sc, r, stage){
  const P = n => sc.pts[n];
  if(r.task) return latHint(sc, r.task, stage);
  if(r.k==='el'){ const mid = [(P(r.a)[0]+P(r.b)[0])/2, (P(r.a)[1]+P(r.b)[1])/2];
    if(stage===1) return {objs:[{t:'line', a:P(r.a), b:P(r.b), c:'hintl'}], txt:`Verbind ${r.a} en ${r.b}. Het gezochte element ligt precies in het midden van [${r.a}${r.b}].`};
    return {objs:[{t:'line', a:P(r.a), b:P(r.b), c:'hintl'}, {t:'ticks', a:P(r.a), b:mid, n:1}, {t:'ticks', a:mid, b:P(r.b), n:1}, hRing(mid)], txt:'Ligt het midden op een roosterlijn die loodrecht staat op het lijnstuk? Dan is die rechte een spiegelas. Is het midden een roosterpunt? Dan is dat punt een centrum.'}; }
  if(r.k==='cen'){ const C = P(r.ans[0]);
    if(stage===1) return {objs:[], txt:`Het centrum ligt even ver van ${r.a} als van ${r.b}. Zoek een punt waarbij de lijnstukken naar ${r.a} en naar ${r.b} even lang zijn en loodrecht op elkaar staan.`};
    return {objs:[{t:'line', a:C, b:P(r.a), c:'hintl'}, {t:'line', a:C, b:P(r.b), c:'hintl'}, hRing(C)], txt:`Probeer het omcirkelde punt: draai ${r.a} erom over ${zinLang(r.op.deg)}.`}; }
  if(r.k==='ang'){ const C = P(r.c), a0 = Math.atan2(P(r.a)[1]-C[1], P(r.a)[0]-C[0])/D2R;
    const base = [{t:'line', a:C, b:P(r.a), c:'hintl'}, {t:'line', a:C, b:P(r.b), c:'hintl'}];
    if(stage===1) return {objs:base, txt:`Verbind het centrum ${r.c} met ${r.a} en met ${r.b}. Hoe groot is de hoek ertussen?`};
    return {objs:base.concat([{t:'arcC', c:C, r:1.3, a0, a1:a0+r.op.deg, cls:'hintl solid'}]), txt:'Draai je van het ene lijnstuk naar het andere in tegenwijzerzin (↺)? Dan is de hoek positief. In wijzerzin (↻) is hij negatief.'}; }
  if(r.k==='vec'){ const s1 = stair(P(r.a), P(r.b));
    if(stage===1) return {objs:s1, txt:`Kijk hoe je van ${r.a} naar ${r.b} gaat: ${dirTxt(r.v)}.`};
    const x = r.ans[0][0], y = r.ans[0][1]; return {objs:s1.concat(stair(P(x), P(y)), [hRing(P(x))]), txt:`Zoek twee punten waarbij je dezelfde stappen zet. Begin bijvoorbeeld in het omcirkelde punt.`}; }
  if(r.k==='seg'){ const t1 = {kind:'img', op:r.op, from:r.a, to:r.a2}, t2 = {kind:'img', op:r.op, from:r.c, to:r.c2};
    const h1 = latHint(sc, t1, stage), h2 = latHint(sc, t2, stage);
    return {objs:h1.objs.concat(h2.objs), txt: stage===1 ? `Spiegel ${r.a} en ${r.c} afzonderlijk om ${r.op.name}. ` + h1.txt : 'Het beeld van het lijnstuk ligt tussen de twee beeldpunten.'}; }
  return {objs:[], txt:''};
}
function latRowsQs(parent, st, save, pre, sc, rows, F, hint){
  let cur = null, stage = 0;
  const hBar = hint.bar, hTxt = hint.txt, hInfo = hint.info, hOff = hint.off;
  const btns = [];
  function draw(){ const r = rows[cur]; const h = r && stage ? latRowHint(sc, r, stage) : null;
    const o = []; if(r && r.op && (r.task || r.k==='seg' || r.k==='ang')) o.push(...latOpObjs(sc, r.op, null));
    if(h) o.push(...h.objs); F.draw(o);
    btns.forEach((b,j)=>{ b.classList.toggle('on', j===cur && stage>0); b.textContent = j===cur && stage===1 ? '💡 Volgende hint' : '💡 Hint'; b.disabled = j===cur && stage>=2; });
    hOff.hidden = !stage; hInfo.textContent = stage ? `hint ${stage} van 2 bij ${LET[cur]}.` : ''; hTxt.innerHTML = h ? h.txt : ''; }
  hOff.addEventListener('click', ()=>{ stage = 0; draw(); });
  hBar.hidden = !!QZ;
  rows.forEach((r,j)=>{
    const q = qBlock(parent, st, save, pre+j, {nr:LET[j]+'.', html:r.html, size:r.size || 'xs', mode:'text', check:v=>latRowCheck(r, v[0]), sol:r.sol});
    if(QZ) return;
    const b = el('button','lt-hbtn','💡 Hint'); b.type = 'button'; btns[j] = b;
    b.addEventListener('click', ()=>{ if(cur!==j){ cur = j; stage = 1; } else stage = Math.min(2, stage+1); draw(); });
    q.row.querySelector('.q-act').append(b);
  });
  draw();
}
function latNotCard(b, st, save, sc, kinds, pre){
  const R = makeR(st);
  const two = el('div','cf-two'); b.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
  const F = latFig(L, sc); Rt.classList.add('lt-qs');
  const bar = el('div','hintbar'); const off = el('button','hintbtn off','Verberg de hint'); off.type = 'button'; const info = el('span','hintinfo'); bar.append(off, info);
  const txt = el('div','hint-txt'); L.append(bar, txt);
  latRowsQs(Rt, st, save, pre, sc, latRows(R, sc, kinds), F, {bar, txt, info, off});
}
const latSize = R => R.pick([[5,4],[4,5],[5,5],[6,4],[4,4]]);

/* --- uitleg: zo werk je op een rooster --- */
RO.kijk = { title:'Zo werk je op een rooster', lvl:1, instr:'Alle vakjes zijn vierkanten van dezelfde grootte. De streepjes tonen dat de zijden even lang zijn. Kies een voorbeeld en kijk hoe je het beeld vindt door vakjes te tellen.', build:(b,st,save)=>{
  const R = makeR(st); const sc = latScene(R, 5, 4, {nv:3});
  const ex = latGen(R, sc, [{kind:'img', t:'s'}, {kind:'img', t:'t'}, {kind:'img', t:'p'}, {kind:'img', t:'r'}, {kind:'pre', t:'t'}]);
  const bar = el('div','ro-demo'); b.append(bar);
  const host = el('div'); b.append(host); const F = latFig(host, sc, {maxw:420});
  const cap = el('div','cf-cap'); b.append(cap);
  const labs = {s:'Spiegeling om een as', t:'Translatie', p:'Spiegeling om een punt', r:'Rotatie'};
  ex.forEach((t,k)=>{ const btn = el('button','btn ghost', icon('play') + ' ' + (t.kind==='pre' ? 'Het origineel zoeken' : labs[t.op.t])); btn.type = 'button'; btn.style.display = 'inline-flex'; btn.style.alignItems = 'center'; btn.style.gap = '.3rem'; bar.append(btn);
    btn.addEventListener('click', ()=>play(t)); });
  async function play(t){
    const tok = ++F.token; const say = stepSay(cap); const ok = () => F.alive(tok);
    const given = sc.pts[t.kind==='pre' ? t.to : t.from]; const base = latOpObjs(sc, t.op, given);
    const note = t.html.replace('[[?]]', '<b>?</b>');
    F.draw(base); say(`Opgave: <span class="lg">${note}</span>`); await wait(REDUCED?30:1300*SLOW); if(!ok()) return;
    const h1 = latHint(sc, t, 1); F.draw(base.concat(h1.objs)); say(h1.txt); await wait(REDUCED?30:2200*SLOW); if(!ok()) return;
    const h2 = latHint(sc, t, 2); F.draw(base.concat(h2.objs)); say(h2.txt); await wait(REDUCED?30:2000*SLOW); if(!ok()) return;
    F.draw(base.concat(h2.objs, [{t:'pt', p:sc.pts[t.kind==='pre' ? t.from : t.to], c:'img', r:1.65}]));
    say(`Dus <span class="lg">${t.html.replace('[[?]]', `<b>${t.ans[0]}</b>`)}</span>`);
  }
}};
/* --- beelden aanklikken --- */
RO.klik = { title:'Klik het beeld aan', lvl:1, instr:'Spiegelingen en translaties op een rooster van vierkanten. Klik bij elke opgave op het beeldpunt. Vraag een hint als je vastzit: eerst zie je hoe je vertrekt, daarna waar het beeld ligt.', build:(b,st,save)=>{
  const R = makeR(st); const [c, r] = latSize(R); const sc = latScene(R, c, r);
  latTasks(b, st, save, 'k', sc, latGen(R, sc, R.shuffle([{kind:'img', t:'s'}, {kind:'img', t:'s'}, {kind:'img', t:'s'}, {kind:'img', t:'p'}, {kind:'img', t:'p'}, {kind:'img', t:'t'}, {kind:'img', t:'t'}])));
}};
RO.klikR = { title:'Draaien op een rooster', lvl:2, instr:'Rotaties over 90° en −90°. Een positieve hoek is tegenwijzerzin (↺), een negatieve hoek wijzerzin (↻). Klik bij elke opgave op het beeldpunt.', build:(b,st,save)=>{
  const R = makeR(st); const [c, r] = latSize(R); const sc = latScene(R, c, r, {r180:true});
  latTasks(b, st, save, 'k', sc, latGen(R, sc, [{kind:'img', t:'r', deg:90}, {kind:'img', t:'r', deg:-90}, {kind:'img', t:'r', deg:90}, {kind:'img', t:'r', deg:-90}, {kind:'img', t:'r', deg:180}, {kind:'img', t:'p'}]),
    {why:'Merk op: een rotatie over 180° geeft hetzelfde beeld als een spiegeling om dat punt.'});
}};
RO.terug = { title:'Zoek het origineel', lvl:2, instr:'Nu is het beeld gegeven. Klik op het punt waarvan het beeld gegeven is. Werk terug: bij een translatie ga je in de omgekeerde zin, bij een rotatie draai je terug.', build:(b,st,save)=>{
  const R = makeR(st); const [c, r] = latSize(R); const sc = latScene(R, c, r);
  latTasks(b, st, save, 'k', sc, latGen(R, sc, R.shuffle([{kind:'pre', t:'s'}, {kind:'pre', t:'s'}, {kind:'pre', t:'p'}, {kind:'pre', t:'t'}, {kind:'pre', t:'t'}, {kind:'pre', t:'r'}])));
}};
/* --- notatie aanvullen --- */
RO.not = { title:'Vul de notatie aan', lvl:2, instr:'Typ de letter van het juiste punt. Vraag een hint bij een opgave: die verschijnt in het rooster.', build:(b,st,save)=>{
  const R = makeR(st); const [c, r] = latSize(R); const sc = latScene(R, c, r);
  latNotCard(b, st, save, sc, ['img','img','pre','img','pre','img','pre'], 'n');
}};
RO.element = { title:'Welke as, welk centrum, welke vector?', lvl:3, instr:'Nu ontbreekt de transformatie zelf. Een rechte of as krijgt een kleine letter, een punt een hoofdletter. Typ een hoek met teken.', build:(b,st,save)=>{
  const R = makeR(st); const [c, r] = latSize(R); const sc = latScene(R, c, r);
  latNotCard(b, st, save, sc, R.shuffle(['el','el','vec','cen','ang','seg']), 'e');
}};
RO.alles = { title:'Alles door elkaar', lvl:3, instr:'Zoals op de toets: beeld, origineel, as, centrum, vector of hoek. Typ een letter of een hoek met teken.', build:(b,st,save)=>{
  const R = makeR(st); const [c, r] = latSize(R); const sc = latScene(R, c, r);
  latNotCard(b, st, save, sc, R.shuffle(['img','img','pre','el','vec','ang','cen','seg']), 'a');
}};
/* ============================================================
   KAARTEN 8: SYMMETRIE IN HET VLAK
   ============================================================ */
const SV = {};
const VLAK = {
  'rechthoek':[[0,0],[6,0],[6,4],[0,4]], 'ruit':[[0,0],[4,-2.6],[8,0],[4,2.6]], 'parallellogram':[[0,0],[5,0],[7,3],[2,3]], 'vierkant':[[0,0],[4,0],[4,4],[0,4]],
  'gelijkbenig trapezium':[[0,0],[7,0],[5,3.2],[2,3.2]], 'vlieger':[[0,0],[3,2.2],[0,7],[-3,2.2]], 'gelijkbenige driehoek':[[0,0],[3.6,0],[1.8,6]], 'gelijkzijdige driehoek':[[0,0],[6,0],[3,5.196152]],
  'regelmatige zeshoek':regPoly(6,4,0), 'ster':starPoly(5,4.4,1.8), 'logo 1':[[-3,0],[-3,2],[1,2],[1,0],[3,0],[3,-2],[-1,-2],[-1,0]], 'logo 2':bladePoly(3), 'regelmatige vijfhoek':regPoly(5,4,90), 'rechthoekige driehoek':[[0,0],[5,0],[0,3]]
};
/* figuur in een eigen kader tekenen; geeft {svg, C, R, vb} */
function polyBox(parent, P, maxw=260){
  const C = centroid(P); const R = Math.max(...P.map(p=>Math.hypot(p[0]-C[0], p[1]-C[1]))) * 1.18;
  const vb = [X(C[0]-R)-3, Y(C[1]+R)-3, 2*R*CU+6, 2*R*CU+6];
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','cf'); svg.setAttribute('viewBox', vb.map(f2).join(' ')); svg.style.maxWidth = maxw+'px'; svg.setAttribute('role','img'); parent.append(svg);
  return {svg, C, R, vb};
}
const ptsAttr = P => P.map(p=>X(p[0])+','+Y(p[1])).join(' ');
SV.kijk = { title:'Onderzoek de symmetrie', lvl:1, keep:true, noReset:true,
  instr:'Kies een figuur. Klik op een stippellijn: de figuur wordt omgeklapt om die lijn. Valt ze op zichzelf? Dan is het een <b>symmetrieas</b>. Met <b>Halve draai</b> onderzoek je of het midden een <b>symmetriemiddelpunt</b> is.',
  build:(b,st)=>{
    const keys = ['rechthoek','vierkant','parallellogram','gelijkbenige driehoek','ruit','regelmatige vijfhoek'];
    if(!st.f) st.f = 'rechthoek';
    const pick = el('div','cf-pick'); b.append(pick);
    const bs = keys.map(k=>{ const x = el('button','opt',k); x.type='button'; x.addEventListener('click', ()=>{ st.f = k; paint(); setup(); }); pick.append(x); return [k,x]; });
    const host = el('div'); b.append(host);
    const cap = el('div','cf-cap'); b.append(cap);
    const ctl = el('div','dyn-ctl'); b.append(ctl);
    const bH = ctlBtn(icon('play')+' Halve draai', ()=>test({t:'p', c:B.C}, null)); bH.style.display='inline-flex'; bH.style.alignItems='center'; bH.style.gap='.3rem'; ctl.append(bH);
    const paint = () => bs.forEach(([k,x])=>x.classList.toggle('chosen', k===st.f));
    let B, cands, tok = 0, found = new Set();
    function draw(ghost, hl){
      let h = `<rect class="bg" x="${B.vb[0]}" y="${B.vb[1]}" width="${B.vb[2]}" height="${B.vb[3]}"/><polygon class="orig" points="${ptsAttr(VLAK[st.f])}"/>`;
      cands.forEach((c,i)=>{ const a = [B.C[0]-Math.cos(c.a*D2R)*B.R*.98, B.C[1]-Math.sin(c.a*D2R)*B.R*.98], e = [B.C[0]+Math.cos(c.a*D2R)*B.R*.98, B.C[1]+Math.sin(c.a*D2R)*B.R*.98];
        const cls = found.has(i) ? (c.ok ? 'cand ok' : 'cand bad') : (hl===i ? 'cand on' : 'cand');
        h += `<line class="${cls}" x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(e[0])}" y2="${Y(e[1])}"/><line class="candhit" data-i="${i}" x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(e[0])}" y2="${Y(e[1])}"/>`; });
      if(ghost) h += `<polygon class="ghost" points="${ptsAttr(ghost)}"/>`;
      h += `<circle class="cpt" cx="${X(B.C[0])}" cy="${Y(B.C[1])}" r="1"/>`;
      B.svg.innerHTML = h;
    }
    async function test(op, i){
      const my = ++tok; const P = VLAK[st.f]; cap.innerHTML = '';
      await twn(REDUCED?30:1300, t=>{ if(my===tok) draw(P.map(p=>opAt(p, op, t)), i); });
      if(my!==tok) return;
      const ok = invariant([P], op);
      if(i!=null){ found.add(i); draw(P.map(p=>applyOp(p, op)), i); cap.innerHTML = ok ? '✅ Het beeld valt samen met de figuur: dit is een <b>symmetrieas</b>.' : '❌ Het beeld valt <b>niet</b> samen met de figuur: dit is geen symmetrieas.'; }
      else { draw(P.map(p=>applyOp(p, op)), null); cap.innerHTML = ok ? '✅ Na een halve draai valt de figuur op zichzelf: het midden is een <b>symmetriemiddelpunt</b>.' : '❌ Na een halve draai valt de figuur niet op zichzelf: er is <b>geen</b> symmetriemiddelpunt.'; }
      const n = cands.filter(c=>c.ok).length;
      if(cands.every((c,j)=>!c.ok || found.has(j))) cap.innerHTML += ` Je vond alle symmetrieassen: ${st.f} heeft er ${n===0?'geen':n}.`;
    }
    function setup(){ tok++; found = new Set(); host.innerHTML = ''; const P = VLAK[st.f]; B = polyBox(host, P, 300);
      cands = candAxes([P], B.C).map(c=>({...c, ok:invariant([P], {t:'s', p:c.p, q:c.q})}));
      B.svg.addEventListener('click', e=>{ const t = e.target.closest('.candhit'); if(!t) return; const i = +t.dataset.i; test({t:'s', p:cands[i].p, q:cands[i].q}, i); });
      draw(null, null); cap.innerHTML = 'Klik op een stippellijn.'; }
    paint(); setup();
  }};
/* vaste kandidaat-assen voor figuren met veel hoekpunten */
const CANDN = {'ster':[10,90], 'logo 2':[6,0], 'regelmatige zeshoek':[12,0], 'regelmatige vijfhoek':[10,90]};
function symCands(k, P){ const c = CANDN[k]; if(!c) return undefined; const C = centroid(P); return Array.from({length:c[0]}, (_,i)=>{ const a = c[1] + 180*i/c[0]; return {a, p:C, q:[C[0]+Math.cos(a*D2R), C[1]+Math.sin(a*D2R)]}; }); }
function symSet(title, lvl, keys, instr){
  return { title, lvl, instr: instr || 'Klik de stippellijnen aan die een symmetrieas zijn. Kies daarna of de figuur een symmetriemiddelpunt heeft.', build:(b,st,save)=>{
    const R = makeR(st); const grid = el('div','sym-row'); b.append(grid);
    R.shuffle(keys).forEach((k,i)=>{ const P = VLAK[k]; symTask(grid, st, save, 'y'+i, {nr:LET[i]+'.', naam:k, polys:[P], cands:symCands(k, P)}); });
  }};
}
SV.vier = symSet('Symmetrie van vierhoeken', 1, ['rechthoek','ruit','parallellogram','vierkant']);
SV.drie = symSet('Trapezium, vlieger en driehoeken', 2, ['gelijkbenig trapezium','vlieger','gelijkbenige driehoek','gelijkzijdige driehoek']);
SV.logo = symSet('Symmetrie in logo’s', 2, ['regelmatige zeshoek','ster','logo 1','logo 2']);
/* letters */
const LETSYM = {H:2,I:2,X:2,O:2, N:1,Z:1,S:1, A:0,T:0,M:0,U:0,V:0,W:0,E:0,C:0,D:0,Y:0, F:3,G:3,J:3,L:3,P:3,R:3};
SV.letters = { title:'Symmetrie van letters', lvl:1, instr:'Sleep elke letter naar de juiste bak, of tik een letter aan en daarna de bak.', build:(b,st,save,key)=>{
  const R = makeR(st); const by = k => R.shuffle(Object.keys(LETSYM).filter(L=>LETSYM[L]===k));
  const pick = R.shuffle([...by(0).slice(0,2), ...by(1).slice(0,2), ...by(2).slice(0,2), ...by(3).slice(0,2)]);
  const WHY = ['Er is een symmetrieas, maar na een halve draai staat de letter op zijn kop.','Na een halve draai valt de letter op zichzelf, maar er is geen symmetrieas.','Er is een symmetrieas én na een halve draai valt de letter op zichzelf.','Geen symmetrieas en geen symmetriemiddelpunt.'];
  sortEx(b, st, save, key, ['enkel spiegelsymmetrisch om een as','enkel spiegelsymmetrisch om een punt','allebei','geen van beide'], pick.map(L=>({t:`<span class="let-chip">${L}</span>`, ans:LETSYM[L], why:WHY[LETSYM[L]]})));
}};
SV.para = { title:'Heeft een parallellogram een symmetrieas?', lvl:2, instr:'Klik op de knoppen: een lichte kopie van het parallellogram wordt gespiegeld. Valt het beeld samen met de figuur? Beantwoord daarna de vragen.', build:(b,st,save)=>{
  const P = [[0,0],[5,0],[7,3],[2,3]]; const M = [3.5,1.5]; const mAD = [1,1.5], mBC = [6,1.5];
  const host = el('div'); b.append(host); const B = polyBox(host, P, 320); const cap = el('div','cf-cap'); b.append(cap);
  const lab = (p, n, away) => { const L = lblAt(p, away); return `<circle class="orig" cx="${X(p[0])}" cy="${Y(p[1])}" r="1"/><text class="lbl orig" x="${f2(L.lx)}" y="${f2(L.ly)}" text-anchor="${L.anchor}">${n}</text>`; };
  let tok = 0;
  function draw(ghost, line){ let h = `<rect class="bg" x="${B.vb[0]}" y="${B.vb[1]}" width="${B.vb[2]}" height="${B.vb[3]}"/><polygon class="orig" points="${ptsAttr(P)}"/>`;
    if(line){ const [a,e] = [line[0], line[1]]; const d = [e[0]-a[0], e[1]-a[1]]; h += `<line class="axisL hl" x1="${X(a[0]-d[0]*.3)}" y1="${Y(a[1]-d[1]*.3)}" x2="${X(e[0]+d[0]*.3)}" y2="${Y(e[1]+d[1]*.3)}"/>`; }
    if(ghost) h += `<polygon class="ghost" points="${ptsAttr(ghost)}"/>`;
    h += ['A','B','C','D'].map((n,i)=>lab(P[i], n, M)).join('') + `<circle class="cpt" cx="${X(M[0])}" cy="${Y(M[1])}" r="1"/><text class="lbl cen" x="${X(M[0])+2}" y="${Y(M[1])+5}">M</text>`;
    B.svg.innerHTML = h; }
  async function go(op, line, txt){ const my = ++tok; await twn(REDUCED?30:1300, t=>{ if(my===tok) draw(P.map(p=>opAt(p, op, t)), line); }); if(my===tok) cap.innerHTML = txt; }
  const ctl = el('div','dyn-ctl'); b.append(ctl);
  [['Spiegel om AC', {t:'s', p:P[0], q:P[2]}, [P[0],P[2]], 'Het beeld valt niet samen met het parallellogram: AC is geen symmetrieas.'],
   ['Spiegel om de rechte door de middens van [AD] en [BC]', {t:'s', p:mAD, q:mBC}, [mAD, mBC], 'Ook nu valt het beeld niet samen met de figuur.'],
   ['Halve draai om M', {t:'p', c:M}, null, 'Na een halve draai rond M valt het parallellogram op zichzelf: M is een symmetriemiddelpunt.']].forEach(([l, op, line, txt])=>{
    const x = ctlBtn(icon('play')+' '+l, ()=>go(op, line, txt)); x.style.display='inline-flex'; x.style.alignItems='center'; x.style.gap='.3rem'; ctl.append(x); });
  draw(null, null);
  wnRows(b, st, save, 'w', [{s:'De diagonaal AC is een symmetrieas van het parallellogram.', ans:'n', why:'Het gespiegelde beeld valt niet samen met de figuur.'},
    {s:'De rechte door de middens van [AD] en [BC] is een symmetrieas.', ans:'n', why:'Ook die rechte is geen symmetrieas.'},
    {s:'M is een symmetriemiddelpunt van het parallellogram.', ans:'w', why:'Na een halve draai rond M valt de figuur op zichzelf.'},
    {s:'Een parallellogram dat geen ruit of rechthoek is, heeft geen enkele symmetrieas.', ans:'w', why:'Enkel ruiten en rechthoeken (en dus vierkanten) hebben symmetrieassen.'}]);
}};
/* vervolledigen */
const HALF_AS = [ {n:'raket', pts:[[6,9],[4,7],[4,4],[2,2],[4,2],[5,0],[6,0]]}, {n:'kerstboom', pts:[[6,9],[3,6],[4,6],[2,3],[5,3],[5,0],[6,0]]}, {n:'huisje', pts:[[6,8],[2,5],[3,5],[3,1],[5,1],[5,3],[6,3]]} ];
const HALF_PT = [ {pts:[[6,4],[4,4],[4,7],[1,7],[1,5],[3,5]]}, {pts:[[6,4],[6,6],[3,6],[3,8],[1,8],[1,5]]}, {pts:[[6,4],[3,4],[3,7],[5,7],[5,6]]} ];
SV.vulAs = { title:'Vervolledig zodat a een symmetrieas is', lvl:2, instr:'Klik op het rooster waar de ontbrekende hoekpunten komen. Kies eerst welk punt je plaatst. De punten op de as liggen al vast.', build:(b,st,save)=>{
  const R = makeR(st); const H = R.pick(HALF_AS); const g = [0,12,0,9]; const op = {t:'s', p:[6,0], q:[6,9], name:'a', nAt:'start'};
  const names = 'ABCDEFG'.split('').slice(0, H.pts.length); const last = H.pts.length-1;
  placeTask(b, st, save, 'v', {g, fig:{pts:H.pts, names, open:true}, op, base:opBase(op), fixed:{0:H.pts[0], [last]:H.pts[last]}, html:`Vervolledig de ${H.n || 'figuur'} zodat de rechte <i>a</i> een symmetrieas is.`, end:'De figuur valt op zichzelf als je spiegelt om a: a is een symmetrieas.'});
}};
SV.vulPt = { title:'Vervolledig zodat M het symmetriemiddelpunt is', lvl:2, instr:'Klik op het rooster waar de ontbrekende hoekpunten komen. M ligt al vast.', build:(b,st,save)=>{
  const R = makeR(st); const H = R.pick(HALF_PT); const g = [0,12,0,8]; const op = {t:'p', c:[6,4], name:'M'};
  const names = 'MBCDEF'.split('').slice(0, H.pts.length);
  placeTask(b, st, save, 'v', {g, fig:{pts:H.pts, names, open:true}, op, base:[], fixed:{0:H.pts[0]}, html:'Vervolledig de figuur zodat M het symmetriemiddelpunt is.', end:'Na een halve draai rond M valt de figuur op zichzelf.'});
}};
SV.wn = { title:'Symmetrie: waar of niet waar?', lvl:2, build:(b,st,save)=>{
  const R = makeR(st);
  const pool = [{s:'Elke driehoek heeft minstens één symmetrieas.', ans:'n', why:'Een driehoek met drie verschillende zijden heeft er geen.'},
    {s:'Als een figuur spiegelsymmetrisch is om een punt, dan is ze ook spiegelsymmetrisch om een as.', ans:'n', why:'Een parallellogram heeft een symmetriemiddelpunt, maar geen symmetrieas.'},
    {s:'Een cirkel heeft oneindig veel symmetrieassen.', ans:'w', why:'Elke rechte door het middelpunt is een symmetrieas.'},
    {s:'Een regelmatige n-hoek is altijd spiegelsymmetrisch om een punt.', ans:'n', why:'Een gelijkzijdige driehoek of een regelmatige vijfhoek niet.'},
    {s:'Een regelmatige n-hoek heeft n symmetrieassen.', ans:'w', why:'Een regelmatige zeshoek heeft er bijvoorbeeld zes.'},
    {s:'Een gelijkbenige driehoek heeft een symmetriemiddelpunt.', ans:'n', why:'Driehoeken hebben nooit een symmetriemiddelpunt.'},
    {s:'Een gelijkzijdige driehoek heeft juist één symmetriemiddelpunt.', ans:'n', why:'Een driehoek heeft geen symmetriemiddelpunt.'},
    {s:'Een vierhoek met 2 symmetrieassen is altijd een rechthoek.', ans:'n', why:'Een ruit heeft ook 2 symmetrieassen.'},
    {s:'Het symmetriemiddelpunt van een parallellogram is het snijpunt van de diagonalen.', ans:'w', why:'Na een halve draai rond dat punt valt het parallellogram op zichzelf.'},
    {s:'Een vierkant heeft 4 symmetrieassen.', ans:'w', why:'Twee diagonalen en twee middenparallellen.'}];
  wnRows(b, st, save, 'w', R.shuffle(pool).slice(0,6));
}};
/* verdieping: tabel vierhoeken */
SV.tabel = { title:'Symmetrie van alle vierhoeken', lvl:3, instr:'Typ het aantal symmetrieassen en kies of er een symmetriemiddelpunt is.', build:(b,st,save)=>{
  const R = makeR(st);
  const rows = [['vierkant',4,'j',VLAK.vierkant],['rechthoek',2,'j',VLAK.rechthoek],['ruit',2,'j',VLAK.ruit],['parallellogram',0,'j',VLAK.parallellogram],['gelijkbenig trapezium',1,'n',VLAK['gelijkbenig trapezium']],['vlieger',1,'n',VLAK.vlieger],['rechthoekig trapezium',0,'n',[[0,0],[6,0],[4,3],[0,3]]],['willekeurige vierhoek',0,'n',[[0,0],[6,1],[5,4],[1,3]]]];
  R.shuffle(rows).slice(0,6).forEach(([n,k,m,P],i)=>{ const C = centroid(P); const Rr = Math.max(...P.map(p=>Math.hypot(p[0]-C[0],p[1]-C[1])))*1.15;
    const mini = `<svg class="cf mini-fig" viewBox="${f2(X(C[0]-Rr))} ${f2(Y(C[1]+Rr))} ${f2(2*Rr*CU)} ${f2(2*Rr*CU)}"><polygon class="orig" points="${ptsAttr(P)}"/></svg>`;
    qBlock(b, st, save, 't'+i, {nr:LET[i]+'.', html:`${mini}<b>${n}</b>: [[0]] symmetrieassen`, size:'xs', mode:'numeric', choice:[['j','wel een symmetriemiddelpunt'],['n','geen symmetriemiddelpunt']], choiceLast:true,
      check:(v,c)=>{ const x = parseNum(v[0]); const okN = x===k, okM = c===m; return {ok:okN && okM, fields:[okN], choiceOk:okM, msg: okN && okM ? '' : (!okN ? 'Tel de assen nog eens. ' : '') + (!okM ? (m==='j' ? 'Draai de figuur een halve slag: ze valt op zichzelf.' : 'Na een halve draai valt de figuur niet op zichzelf.') : '')}; },
      sol:`${k} symmetrieas${k===1?'':'sen'}, ${m==='j'?'wel':'geen'} symmetriemiddelpunt` }); });
}};
/* verdieping: oppervlakte met spiegelingen */
SV.opp = { title:'Oppervlakte met spiegelingen', lvl:3, build:(b,st,save)=>{
  const R = makeR(st); const z = R.int(3,8);
  const S = [[0,0],[4,0],[4,4],[0,4]], M = [2,2];
  const tri = [[[0,0],[4,0],[2,-2]],[[4,0],[4,4],[6,2]],[[4,4],[0,4],[2,6]],[[0,4],[0,0],[-2,2]]];
  const g = [-2.5,6.5,-2.5,6.5]; const F = gridFig(b, {g, plain:true, maxw:300});
  F.draw([{t:'poly', pts:S, c:'fill'}].concat(tri.map(T=>({t:'poly', pts:T, c:'soft'})), [{t:'line', a:[0,0], b:[4,4]}, {t:'line', a:[4,0], b:[0,4]}, {t:'cen', p:M}, {t:'txt', p:[2,0], s:`${z} cm`, c:'help', dy:-2}]));
  b.append(el('p','', `De middelste figuur is een vierkant met zijde ${z} cm. Elke grijze driehoek is het spiegelbeeld van een stukje van het vierkant.`));
  qChoice(b, st, save, 'k', {nr:'a.', html:'Welke transformatie zie je bij elke grijze driehoek?', opts:R.shuffle([['s','een spiegeling om een zijde van het vierkant'],['p','een spiegeling om het midden van het vierkant'],['t','een translatie over een zijde'],['r','een rotatie over 45°']]), ans:'s', why:'Elke grijze driehoek is het spiegelbeeld van een kwart van het vierkant, om een zijde.', whyBad:'Kijk welke driehoek in het vierkant even groot is als een grijze driehoek, en hoe die erop komt.'});
  qBlock(b, st, save, 'a', {nr:'b.', html:'De oppervlakte van de volledige figuur is [[0]] cm².', size:'xs', mode:'decimal', check:numIs(2*z*z), why:'De vier grijze driehoeken zijn samen even groot als het vierkant: een spiegeling bewaart de oppervlakte.',
    sol:`vierkant: ${z} · ${z} = ${z*z} cm². De grijze driehoeken samen: ook ${z*z} cm². Totaal: <b>${2*z*z} cm²</b>`});
}};

/* ============================================================
   KAARTEN 9: SYMMETRIE IN DE RUIMTE
   ============================================================ */
const SR = {};
function infBtn(row){ const inp = row.querySelector('.inp'); const bi = el('button','opt','∞'); bi.type='button'; bi.style.marginLeft='.3rem'; bi.addEventListener('click', ()=>{ if(inp.readOnly) return; inp.value = '∞'; inp.dispatchEvent(new Event('input', {bubbles:true})); }); inp.after(bi); }
const SOLIDS = [['kubus','kubus',9],['balk','balk met drie verschillende afmetingen',3],['balkvk','balk met een vierkant grondvlak',5],['piramide','piramide met een vierkant grondvlak',4],['prisma','recht prisma met een gelijkzijdige driehoek als grondvlak',4],['cilinder','cilinder','∞'],['bol','bol','∞']];
SR.kijk = { title:'Bekijk de symmetrievlakken', lvl:1, keep:true, noReset:true,
  instr:'Kies een ruimtefiguur en klik op <b>Volgend symmetrievlak</b>. Een symmetrievlak verdeelt de figuur in twee congruente helften die elkaars spiegelbeeld zijn.',
  build:(b,st)=>{
    if(!st.k) st.k = 'kubus'; st.i = st.i || 0;
    const pick = el('div','cf-pick'); b.append(pick);
    const bs = SOLIDS.map(([k,l])=>{ const x = el('button','opt',k==='balkvk'?'balk met vierkant grondvlak':k); x.type='button'; x.addEventListener('click', ()=>{ st.k = k; st.i = 0; paint(); setup(); }); pick.append(x); return [k,x]; });
    const host = el('div'); b.append(host); const cap = el('div','cf-cap'); b.append(cap);
    const ctl = el('div','dyn-ctl'); b.append(ctl);
    let S; const nx = ctlBtn('Volgend symmetrievlak', ()=>{ st.i = (st.i+1) % S.S.planes.length; S.show(st.i); say(); }); ctl.append(nx);
    const paint = () => bs.forEach(([k,x])=>x.classList.toggle('chosen', k===st.k));
    const say = () => { const d = SOLIDS.find(s=>s[0]===st.k); const n = d[2]; cap.innerHTML = n==='∞' ? `Een ${d[1]} heeft <b>oneindig veel</b> symmetrievlakken. Hier zie je er ${S.S.planes.length} (vlak ${st.i+1}).` : `Symmetrievlak ${st.i+1} van <b>${n}</b>.`; };
    function setup(){ host.innerHTML = ''; S = solidFig(host, st.k, {maxw:280, plane:st.i}); say(); }
    paint(); setup();
  }};
SR.tel = { title:'Hoeveel symmetrievlakken?', lvl:2, instr:'Typ het aantal symmetrievlakken. Zijn het er oneindig veel, klik dan op de knop ∞.', build:(b,st,save)=>{
  const R = makeR(st); const grid = el('div','sp-row'); b.append(grid);
  R.shuffle(SOLIDS).slice(0,4).forEach(([k,l,n],i)=>{ const box = el('div'); grid.append(box); solidFig(box, k, {maxw:200});
    const r = qBlock(box, st, save, 'n'+i, {nr:LET[i]+'.', html:`${l}: [[0]] symmetrievlakken`, size:'xs', mode:'text',
      check:v=>{ const t = String(v[0]).trim().toLowerCase(); const inf = /^(∞|oneindig( veel)?)$/.test(t); if(n==='∞') return {ok:inf, msg: inf ? 'Elk vlak door de as' + (k==='bol'?' (het middelpunt)':'') + ' is een symmetrievlak.' : 'Je kan de figuur op oneindig veel manieren middendoor snijden.'};
        const x = parseNum(t); if(isNaN(x)) return {ok:false, msg:'Typ een getal of ∞.'}; return {ok:x===n, msg: x===n ? '' : 'Kijk in het eerste onderdeel hoe je ze vindt.'}; },
      sol:`<b>${n}</b>` });
    infBtn(r.row); });
}};
SR.wn = { title:'Ruimtefiguren: waar of niet waar?', lvl:2, build:(b,st,save)=>{
  const R = makeR(st);
  wnRows(b, st, save, 'w', R.shuffle([{s:'Een bol heeft oneindig veel symmetrievlakken.', ans:'w', why:'Elk vlak door het middelpunt.'},
    {s:'Een balk heeft minstens drie symmetrievlakken.', ans:'w', why:'De drie vlakken evenwijdig met de zijvlakken, door het midden.'},
    {s:'Een kubus heeft zes symmetrievlakken.', ans:'n', why:'Een kubus heeft er 9: 3 evenwijdig met de zijvlakken en 6 door twee overstaande ribben.'},
    {s:'Een cilinder heeft een symmetrievlak dat evenwijdig is met het grondvlak.', ans:'w', why:'Het vlak halverwege de hoogte.'},
    {s:'Het snijpunt van de ruimtediagonalen is het symmetriemiddelpunt van een balk.', ans:'w', why:'Spiegel je elk punt om dat punt, dan valt de balk op zichzelf.'},
    {s:'Een piramide met een vierkant grondvlak heeft een symmetriemiddelpunt.', ans:'n', why:'De top heeft geen beeld in de piramide.'}]));
}};
/* een balk spiegelen om een diagonaal vlak */
SR.balkvlak = { title:'Waarom geen symmetrievlak?', lvl:2, instr:'Klik op de knop: de balk wordt gespiegeld om het oranje vlak. Valt het beeld samen met de balk? Kies daarna het juiste antwoord.', build:(b,st,save)=>{
  const R = makeR(st); const l = 8, w = 4, h = 5;
  const V = []; for(const z of [0,h]) for(const y of [0,w]) for(const x of [0,l]) V.push([x,y,z]);
  const E = [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  const n0 = [w, l, 0], Ln = Math.hypot(...n0), n = n0.map(c=>c/Ln);
  const refl = p => { const d = (p[0]-l)*n[0]+p[1]*n[1]+p[2]*n[2]; return [p[0]-2*d*n[0], p[1]-2*d*n[1], p[2]-2*d*n[2]]; };
  const P2 = p => { const q = PJ(p); return [f2(q[0]*CU/2), f2(-q[1]*CU/2)]; };
  const plane = [[l,0,0],[0,w,0],[0,w,h],[l,0,h]];
  const all = V.concat(V.map(refl)).map(p=>PJ(p)); const xs = all.map(p=>p[0]*CU/2), ys = all.map(p=>-p[1]*CU/2);
  const vb = [Math.min(...xs)-4, Math.min(...ys)-4, Math.max(...xs)-Math.min(...xs)+8, Math.max(...ys)-Math.min(...ys)+8];
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','cf'); svg.setAttribute('viewBox', vb.map(f2).join(' ')); svg.style.maxWidth='320px'; b.append(svg);
  const line = (a,c,cls) => `<line class="${cls}" x1="${P2(a)[0]}" y1="${P2(a)[1]}" x2="${P2(c)[0]}" y2="${P2(c)[1]}"/>`;
  function draw(t){ let s = `<rect class="bg" x="${f2(vb[0])}" y="${f2(vb[1])}" width="${f2(vb[2])}" height="${f2(vb[3])}"/><polygon class="plane" points="${plane.map(p=>P2(p).join(',')).join(' ')}"/>`;
    s += E.map(([i,j])=>line(V[i], V[j], (i===2||j===2) ? 'hidden3' : 'solid')).join('');
    if(t>0){ const W = V.map(p=>{ const q = refl(p); return [p[0]+(q[0]-p[0])*t, p[1]+(q[1]-p[1])*t, p[2]+(q[2]-p[2])*t]; }); s += E.map(([i,j])=>line(W[i], W[j], 'ghost3')).join(''); }
    svg.innerHTML = s; }
  draw(0);
  const cap = el('div','cf-cap'); b.append(cap);
  const ctl = el('div','dyn-ctl'); b.append(ctl); let tok = 0;
  const bt = ctlBtn(icon('play')+' Spiegel om het oranje vlak', async ()=>{ const my = ++tok; await twn(REDUCED?30:1500, t=>{ if(my===tok) draw(t); }); if(my===tok) cap.innerHTML = 'Het beeld (oranje stippellijnen) valt <b>niet</b> samen met de balk.'; });
  bt.style.display='inline-flex'; bt.style.alignItems='center'; bt.style.gap='.3rem'; ctl.append(bt);
  qChoice(b, st, save, 'k', {html:'Waarom is het oranje vlak géén symmetrievlak van deze balk?', opts:R.shuffle([['a','Omdat een symmetrievlak altijd evenwijdig is met een zijvlak.'],['b','Omdat een balk geen symmetrievlakken heeft.'],['c','Omdat het grondvlak geen vierkant is: de diagonaal van een rechthoek die geen vierkant is, is geen symmetrieas.'],['d','Omdat het vlak door twee ribben van de balk gaat.']]), ans:'c',
    why:'Bij een balk met een vierkant grondvlak is dit vlak wel een symmetrievlak.', whyBad:'Bij een kubus is zo’n vlak door twee overstaande ribben wél een symmetrievlak. Wat is hier anders?'});
}};
SR.midden = { title:'Heeft de ruimtefiguur een symmetriemiddelpunt?', lvl:2, instr:'Een ruimtefiguur heeft een symmetriemiddelpunt als ze op zichzelf valt bij een spiegeling om dat punt.', build:(b,st,save)=>{
  const R = makeR(st); const M = {kubus:'j', balk:'j', balkvk:'j', piramide:'n', prisma:'n', cilinder:'j', bol:'j'};
  const WHY = {kubus:'Het snijpunt van de ruimtediagonalen.', balk:'Het snijpunt van de ruimtediagonalen.', balkvk:'Het snijpunt van de ruimtediagonalen.', piramide:'Het beeld van de top zou onder het grondvlak liggen.', prisma:'Het beeld van een driehoek die naar boven wijst, wijst naar beneden.', cilinder:'Het midden van de as.', bol:'Het middelpunt.'};
  const grid = el('div','sp-row'); b.append(grid);
  R.shuffle(SOLIDS).slice(0,4).forEach(([k,l],i)=>{ const box = el('div'); grid.append(box); solidFig(box, k, {maxw:180});
    qChoice(box, st, save, 'm'+i, {nr:LET[i]+'.', html:l, opts:[['j','wel een symmetriemiddelpunt'],['n','geen symmetriemiddelpunt']], ans:M[k], why:WHY[k], whyBad:'Spiegel elk hoekpunt in gedachten om het midden van de figuur.'}); });
}};
/* verdieping: welke vlakken zijn symmetrievlakken? */
SR.welk = { title:'Welke vlakken zijn symmetrievlakken?', lvl:3, instr:'Vink alle vlakken aan die een symmetrievlak zijn.', build:(b,st,save)=>{
  const R = makeR(st); const kind = R.pick(['kubus','balk','balkvk']);
  const [l,w,h] = kind==='kubus' ? [6,6,6] : kind==='balk' ? [8,4,5] : [5,5,8];
  const C = [ {pl:[[l/2,0,0],[l/2,w,0],[l/2,w,h],[l/2,0,h]], ok:true}, {pl:[[0,0,h/2],[l,0,h/2],[l,w,h/2],[0,w,h/2]], ok:true},
    {pl:[[0,w/2,0],[l,w/2,0],[l,w/2,h],[0,w/2,h]], ok:true}, {pl:[[l,0,0],[0,w,0],[0,w,h],[l,0,h]], ok:l===w}, {pl:[[0,0,0],[l,0,0],[l,w,h],[0,w,h]], ok:kind==='kubus'},
    {pl:[[l/3,0,0],[l/3,w,0],[l/3,w,h],[l/3,0,h]], ok:false}, {pl:[[l,0,0],[0,w,0],[0,0,h]], ok:false} ];
  const pick = R.shuffle(C).slice(0,5); const names = ['a','b','c','d','e'];
  const grid = el('div','sp-row'); b.append(grid);
  pick.forEach((c,i)=>{ const box = el('div'); grid.append(box); box.append(el('div','sub', `<b>vlak ${names[i]}</b>`));
    const S = solidSVG(kind); const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','cf'); svg.setAttribute('viewBox', S.vb.map(f2).join(' ')); svg.style.maxWidth='170px';
    S.planes.push(c.pl); svg.innerHTML = S.render(S.planes.length-1); box.append(svg); });
  const lab = {kubus:'kubus', balk:'balk met drie verschillende afmetingen', balkvk:'balk met een vierkant grondvlak'}[kind];
  const ans = pick.map((c,i)=>c.ok?names[i]:null).filter(Boolean);
  qMulti(b, st, save, 'w', {html:`Welke vlakken zijn symmetrievlakken van deze ${lab}?`, opts:names.map(n=>[n,'vlak '+n]).concat([['geen','geen enkel']]), none:'geen', ans:ans.length?ans:['geen'],
    why:'Een symmetrievlak verdeelt de figuur in twee helften die elkaars spiegelbeeld zijn.', whyBad:'Spiegel de figuur in gedachten om het vlak: valt ze op zichzelf? Een vlak door twee overstaande ribben werkt enkel als het zijvlak een vierkant is.'});
}};

/* ============================================================
   KAARTEN 10: FOUTENJAGER
   ============================================================ */
const FJ = {};
function foutKaart(title, who, kind){
  return { title, lvl:2, instr:`${who} tekende het beeld van A. Bekijk de tekening goed. Wat ging er fout?`, build:(b,st,save)=>{
    const R = makeR(st); const g = [0,12,0,8]; const right = R.f() < .25;
    let A, op, W; for(let t=0;t<600;t++){
      A = [R.int(1,11), R.int(1,7)];
      if(kind==='s'){ op = genAxis(R, g, R.pick(['v','h'])); op.name = 'a'; op.nAt = 'start'; const Q = applyOp(A, op); const S = footPt(A, op.p, op.q); const d = [op.q[0]-op.p[0], op.q[1]-op.p[1]]; const L = Math.hypot(...d); const sh = R.pick([2,-2,3,-3]); W = [Q[0]+d[0]/L*sh, Q[1]+d[1]/L*sh]; if(Math.hypot(A[0]-S[0], A[1]-S[1])<2) continue; }
      if(kind==='r'){ op = {t:'r', c:[R.int(3,9), R.int(2,6)], deg:90, name:'O'}; W = rotPt(A, op.c, -90); }
      if(kind==='t'){ op = genOpK(R, g, 't'); op.from = [R.int(0,10), R.int(0,8)]; op.name = ['X','Y']; if(!inG([op.from[0]+op.v[0], op.from[1]+op.v[1]], g)) continue; W = [A[0]-op.v[0], A[1]-op.v[1]]; }
      if(kind==='p'){ op = {t:'p', c:[R.int(4,8), R.int(3,5)], name:'O'}; W = [3*op.c[0]-2*A[0], 3*op.c[1]-2*A[1]]; if(Math.hypot(A[0]-op.c[0],A[1]-op.c[1])<1.5) continue; }
      const Q = applyOp(A, op); if(!inG(Q,g) || !inG(W,g) || ptEq(A,op.c||[-9,-9]) || ptEq(Q,A)) continue;
      if(kind==='r' && Math.hypot(A[0]-op.c[0],A[1]-op.c[1])<2) continue;
      break; }
    const Q = applyOp(A, op); const shown = right ? Q : W;
    const F = gridFig(b, {g, maxw:440}); F.base = opBase(op);
    const work = () => { const o = [{t:'pt', p:A, n:'A', c:'orig'}, {t:'pt', p:shown, n:'A'+PR, c:'img', away:A}];
      if(kind==='s') o.push({t:'line', a:A, b:shown}); if(kind==='r') o.push({t:'line', a:op.c, b:A}, {t:'line', a:op.c, b:shown}); if(kind==='t') o.push({t:'arrow', a:A, b:shown, c:'comp'}); if(kind==='p') o.push({t:'line', a:A, b:shown});
      return o; };
    F.draw(work());
    const cap = el('div','cf-cap'); b.append(cap);
    const OPTS = { s:[['n','Niets, de tekening is juist.'],['f','A′ ligt te ver van de as.'],['w',`[AA′] staat niet loodrecht op de as a.`],['p','Ze had om een punt moeten spiegelen.']],
      r:[['a','A′ ligt niet even ver van O als A.'],['w','Er werd in wijzerzin gedraaid; een positieve hoek betekent tegenwijzerzin.'],['c','Er werd over 180° gedraaid in plaats van over 90°.'],['n','Niets, de tekening is juist.']],
      t:[['n','Niets, de tekening is juist.'],['b','Er werd verder verschoven dan |XY|.'],['c','Er werd in een andere richting verschoven.'],['w',`Er werd in de tegengestelde zin verschoven: over ${vecN('Y','X')} in plaats van over ${vecN('X','Y')}.`]],
      p:[['a','A, O en A′ liggen niet op één rechte.'],['n','Niets, de tekening is juist.'],['w','O is niet het midden van [AA′]: A′ ligt twee keer zo ver van O.'],['d','Er had gespiegeld moeten worden om een as door O.']] }[kind];
    const task = {s:'het beeld van A door de spiegeling om a', r:'r(O, 90°)(A)', t:`t<sub>${vecN('X','Y')}</sub>(A)`, p:'s<sub>O</sub>(A)'}[kind];
    qChoice(b, st, save, 'f', {html:`${who} tekende ${task}. Wat ging er fout?`, opts:R.shuffle(OPTS), ans: right ? 'n' : 'w', why: right ? 'De tekening klopt.' : 'Hieronder zie je de juiste tekening.', whyBad:'Controleer de tekening stap voor stap met het stappenplan.',
      after:(ok)=>{ if(!ok) return; const o = work().filter(x=>x.n!=='A'+PR); o.push(...helpObjs(op, A, Q, g), {t:'pt', p:Q, n:'A'+PR, c:'img', away:A}); if(!right) o.push({t:'mark', p:W}); F.draw(o);
        cap.innerHTML = {s:'A′ ligt op de loodlijn door A op a, even ver aan de andere kant.', r:'Een positieve hoek: draaien in tegenwijzerzin.', t:'Volg de zin van de pijl van X naar Y.', p:'O is het midden van [AA′].'}[kind]; } });
  }};
}
FJ.as = foutKaart('Noor spiegelt om een as', 'Noor', 's');
FJ.rot = foutKaart('Lukas draait een punt', 'Lukas', 'r');
FJ.tr = foutKaart('Emma verschuift een punt', 'Emma', 't');
FJ.pt = foutKaart('Ilias spiegelt om een punt', 'Ilias', 'p');
FJ.reken = { title:'Zoek de fout in de redenering', lvl:3, instr:'Elke uitwerking bevat één fout. Klik de eerste stap aan die fout is en verbeter ze daarna.', build:(b,st,save)=>{
  const R = makeR(st);
  /* 1. translatie met coördinaten */
  let A, B, Pp; do{ A = [R.int(-5,5), R.int(-5,5)]; B = [R.int(-5,5), R.int(-5,5)]; Pp = [R.int(-5,5), R.int(-5,5)]; }while(A[0]===B[0] || A[1]===B[1] || Math.abs(B[1]-A[1])<2);
  const dx = B[0]-A[0], dy = B[1]-A[1]; const Q = [Pp[0]+dx, Pp[1]+dy], Wq = [Pp[0]+dx, Pp[1]-dy];
  errBlock(b, st, save, 'e1', {nr:'a.', task:`Bereken het beeld van P${co(...Pp)} door t<sub>${vecN('A','B')}</sub> met A${co(...A)} en B${co(...B)}.`,
    lines:[`Van A naar B: x ${sgnTxt(dx)} en y ${sgnTxt(dy)}.`, `x van P′: ${neg(Pp[0])} ${sgnTxt(dx)} = ${neg(Q[0])}`, `y van P′: ${neg(Pp[1])} ${sgnTxt(-dy)} = ${neg(Wq[1])}`, `P′${co(...Wq)}`], wrong:2, cons:[3],
    why:`Bij y moet je hetzelfde doen als van A naar B: ${sgnTxt(dy)}.`, fix:'P′([[0]], [[1]])', mode:'text', fixCheck:v=>chkPt(v, Q, 'P′'), fixSol:`P′${co(...Q)}`});
  /* 2. draaizin */
  const P2 = [R.int(1,5), R.int(1,5)]; const Q2 = [-P2[1], P2[0]], W2 = [P2[1], -P2[0]];
  errBlock(b, st, save, 'e2', {nr:'b.', task:`Bereken het beeld van P${co(...P2)} door r(O, 90°).`,
    lines:['Een positieve hoek betekent: draaien in wijzerzin.', `Je draait P${co(...P2)} een kwartslag in wijzerzin rond O.`, `P′${co(...W2)}`], wrong:0, cons:[1,2],
    why:'Een positieve hoek betekent tegenwijzerzin. Bij r(O, 90°) wordt (x, y) dus (−y, x).', fix:'P′([[0]], [[1]])', mode:'text', fixCheck:v=>chkPt(v, Q2, 'P′'), fixSol:`P′${co(...Q2)}`});
  /* 3. symmetrie */
  errBlock(b, st, save, 'e3', {nr:'c.', task:'Hoeveel symmetrieassen heeft een parallellogram dat geen ruit of rechthoek is?',
    lines:['Een parallellogram heeft twee paren evenwijdige zijden.', 'De diagonalen snijden elkaar middendoor.', 'Dus is elke diagonaal een symmetrieas.', 'Een parallellogram heeft 2 symmetrieassen.'], wrong:2, cons:[3],
    why:'Spiegel je het parallellogram om een diagonaal, dan valt het niet op zichzelf.', fix:'Aantal symmetrieassen: [[0]]', mode:'numeric', fixCheck:v=>({ok:parseNum(v[0])===0, msg: parseNum(v[0])===0 ? 'Wel een symmetriemiddelpunt: het snijpunt van de diagonalen.' : ''}), fixSol:'0'});
}};
/* ============================================================
   PROEFTOETSEN
   ============================================================ */
/* Eigen vragen op het niveau van de herhalingstoets en de kleine toets.
   Niets is letterlijk overgenomen: andere woorden, getallen, roosters en vraagvormen. */
function tqFoto(){ return {sec:'Transformaties herkennen', prompt:'Welke transformatie herken je in elke foto?', build:(b,st,save)=>{
  const R = makeR(st); const pick = R.shuffle(PHOTOS).slice(0,2); const grid = el('div','pair-grid'); b.append(grid);
  pick.forEach((ph,i)=>photoQ(grid, st, save, 'f'+i, ph, LET[i]+'.'));
}}; }
/* notatie lezen (andere vormen dan op de toetsen) en noteren in symbolen */
function tqNotatie(){ return {sec:'Notatie', prompt:'', build:(b,st,save)=>{
  const R = makeR(st); const L = R.letters(6, UPP.replace('O','')); const a = R.pick([35,45,75,105,135]);
  const items = [
    {html:`s<sub>${L[0]}</sub>([${L[1]}${L[2]}]) = [${L[3]}${L[4]}]`, opts:[['j',`[${L[3]}${L[4]}] is het beeld van [${L[1]}${L[2]}] door de spiegeling om het punt ${L[0]}`],['z',`[${L[1]}${L[2]}] is het beeld van [${L[3]}${L[4]}] door de spiegeling om de as ${L[0]}`],['s',`[${L[3]}${L[4]}] is het beeld van [${L[1]}${L[2]}] door de spiegeling om de as ${L[0].toLowerCase()}`],['t',`${L[0]} is het midden van [${L[1]}${L[2]}]`]]},
    {html:`r(${L[0]}, −${a}°)(${L[1]}) = ${L[2]}`, opts:[['j',`${L[2]} is het beeld van ${L[1]} door de rotatie rond ${L[0]} over ${a}° in wijzerzin`],['z',`${L[2]} is het beeld van ${L[1]} door de rotatie rond ${L[0]} over ${a}° in tegenwijzerzin`],['s',`${L[1]} is het beeld van ${L[2]} door de rotatie rond ${L[0]} over ${a}° in wijzerzin`],['t',`${L[0]} is het beeld van ${L[1]} door een rotatie over −${a}°`]]},
    {html:`s<sub>${L[5].toLowerCase()}</sub>(Δ${L[0]}${L[1]}${L[2]}) = Δ${L[0]}′${L[1]}′${L[2]}′`, opts:[['j',`Δ${L[0]}′${L[1]}′${L[2]}′ is het beeld van Δ${L[0]}${L[1]}${L[2]} door de spiegeling om de as ${L[5].toLowerCase()}`],['z',`Δ${L[0]}′${L[1]}′${L[2]}′ is het beeld van Δ${L[0]}${L[1]}${L[2]} door de spiegeling om het punt ${L[5]}`],['s',`Δ${L[0]}${L[1]}${L[2]} is het beeld van Δ${L[0]}′${L[1]}′${L[2]}′ door een translatie`],['t',`de as ${L[5].toLowerCase()} is het beeld van Δ${L[0]}${L[1]}${L[2]}`]]}];
  const q = R.pick(items);
  qChoice(b, st, save, 'l', {nr:'a.', html:`Hoe lees je <span class="lg">${q.html}</span> ?`, opts:R.shuffle(q.opts), ans:'j'});
  const z = R.pick(symbItems(R)); symbQ(b, st, save, 's', {...z, nr:'b.', html:'Noteer in symbolen: ' + z.html});
}}; }
/* eigenschappen: vink aan wat altijd behouden blijft */
function tqEig(){ return {sec:'Eigenschappen', prompt:'', build:(b,st,save)=>{
  const R = makeR(st); const k = R.pick(['s','t','r','p']);
  const opts = EIG_ALL.filter(e=>e[0]!=='vorm').map(([e,l])=>[e, e==='par' ? 'het beeld van een rechte is evenwijdig met die rechte' : l]);
  const ans = opts.map(o=>o[0]).filter(e=>e!=='par' || PAR_OK[k]);
  qMulti(b, st, save, 'e', {nr:'a.', html:`Wat blijft <b>altijd</b> behouden bij een ${TNAAM[k]}? Vink alles aan wat past.`, opts:R.shuffle(opts), ans, pts:2,
    why:'Alle vier de transformaties bewaren deze eigenschappen.', whyBad:'Elke transformatie is een isometrie. Het beeld van een rechte is enkel bij een translatie en een spiegeling om een punt altijd evenwijdig met die rechte.'});
  EG.benoem.build(b, st, save);
}}; }
const WN_POOL = [{s:'Bij een translatie over een vector die niet nul is, heeft geen enkel punt zichzelf als beeld.', ans:'w'}, {s:'Een ruit heeft twee symmetrieassen en een symmetriemiddelpunt.', ans:'w'},
  {s:'Een gelijkbenig trapezium heeft een symmetriemiddelpunt.', ans:'n'}, {s:'r(O, 270°) en r(O, −90°) geven hetzelfde beeld.', ans:'w'},
  {s:'Bij een spiegeling om een as is het beeld van een rechte altijd evenwijdig met die rechte.', ans:'n'}, {s:'Een spiegeling om een punt bewaart de oppervlakte van een figuur.', ans:'w'},
  {s:'Een regelmatige vijfhoek heeft een symmetriemiddelpunt.', ans:'n'}, {s:'Een balk met drie verschillende afmetingen heeft drie symmetrievlakken.', ans:'w'},
  {s:'s<sub>O</sub>(A) = A′ betekent dat O het midden is van [AA′].', ans:'w'}, {s:'Een cirkel heeft juist twee symmetrieassen.', ans:'n'},
  {s:'Een vierkant valt op zichzelf bij een rotatie over 45° rond zijn middelpunt.', ans:'n'}, {s:'Een punt en zijn beeld liggen bij een spiegeling om een as even ver van die as.', ans:'w'},
  {s:'Bij een rotatie over 90° staat het beeld van een rechte loodrecht op die rechte.', ans:'w'}, {s:'Een spiegeling om een as verandert de grootte van een hoek.', ans:'n'}];
function tqWN(){ return {sec:'Waar of niet waar', prompt:'Waar of niet waar?', build:(b,st,save)=>{ const R = makeR(st); wnRows(b, st, save, 'w', R.shuffle(WN_POOL).slice(0,4)); }}; }
function tqSym(){ return {sec:'Symmetrie in het vlak', prompt:'Duid alle symmetrieassen aan. Heeft de figuur een symmetriemiddelpunt?', build:(b,st,save)=>{
  const R = makeR(st); const k = R.pick(['rechthoek','ruit','gelijkbenig trapezium','vlieger','regelmatige zeshoek','ster','logo 1','gelijkzijdige driehoek']);
  symTask(b, st, save, 'y', {naam:k, polys:[VLAK[k]], pts:2, cands:symCands(k, VLAK[k])});
}}; }
/* rooster van vierkanten met eigen afmetingen en letters (zoals het onderdeel Roosters) */
function tqRooster(kinds){ return {sec:'Notatie op een rooster', prompt:'Het rooster bestaat uit gelijke vierkanten. Vul aan met een letter of een hoek met teken. Een rechte krijgt een kleine letter, een punt een hoofdletter.', build:(b,st,save)=>{
  const R = makeR(st); const [c, r] = R.pick([[5,4],[4,5],[5,3],[6,4]]); const sc = latScene(R, c, r);
  latNotCard(b, st, save, sc, R.shuffle(kinds || ['img','pre','el','vec','ang','seg']), 't');
}}; }
function tqCoord(){ return {sec:'Coördinaten', prompt:'', build:(b,st,save)=>{
  const R = makeR(st); const P = [nz(R,3,14), nz(R,3,14)]; const C = [R.int(-9,9), R.int(-9,9)]; let D; do{ D = [R.int(-9,9), R.int(-9,9)]; }while(D[0]===C[0] || D[1]===C[1]);
  const L = R.pick(['K','M','N','R','T']); const Lp = L+PR;
  b.append(el('p','', `Gegeven: ${ptN(L,P[0],P[1])}, ${ptN('C',C[0],C[1])} en ${ptN('D',D[0],D[1])}. Bepaal de coördinaat van het beeld.`));
  const rows = R.shuffle([[`s<sub>O</sub>(${L})`, [-P[0], -P[1]]], [`t<sub>${vecN('C','D')}</sub>(${L})`, [P[0]+D[0]-C[0], P[1]+D[1]-C[1]]], [R.pick([`s<sub>x</sub>(${L})`,`s<sub>y</sub>(${L})`]), null], [`r(O, 90°)(${L})`, [-P[1], P[0]]]]);
  rows.forEach((rw,i)=>{ if(!rw[1]) rw[1] = rw[0].includes('<sub>x') ? [P[0], -P[1]] : [-P[0], P[1]]; });
  rows.forEach(([t,Q],i)=>qBlock(b, st, save, 'c'+i, {nr:LET[i]+'.', html:keepTxt(`${t} = ${Lp}([[0]], [[1]])`), size:'sm', mode:'text', check:v=>chkPt(v, Q, Lp), sol:`${Lp}${co(...Q)}`}));
}}; }
function tqBeeld(kind){ return {sec:'Beeld tekenen', prompt:'Klik op het rooster waar de beeldpunten komen. Kies eerst welk punt je plaatst.', build:(b,st,save)=>{
  const R = makeR(st); const g = [0,12,0,8]; const k = kind || R.pick(['s','t','r90','p']);
  const T = genTask(R, 3, g, k, {minD:3}); const names = R.pick(NAMES3).split(''); const fig = {pts:T.pts, names};
  let html;
  if(T.op.t==='s'){ T.op.name = 'a'; T.op.nAt = 'start'; html = `Teken s<sub>a</sub>(Δ${names.join('')}).`; }
  if(T.op.t==='t'){ T.op.from = vecFrom(R, g, T.op.v, T.pts.concat(T.img)); T.op.name = ['X','Y']; html = `Teken t<sub>${vecN('X','Y')}</sub>(Δ${names.join('')}).`; }
  if(T.op.t==='r'){ T.op.name = 'O'; html = `Teken r(O, ${degTxt(T.op.deg)})(Δ${names.join('')}).`; }
  if(T.op.t==='p'){ T.op.name = 'O'; html = `Teken s<sub>O</sub>(Δ${names.join('')}).`; }
  placeTask(b, st, save, 'p', {g, fig, op:T.op, base:opBase(T.op), html, pts:2});
}}; }
/* draaihoek bij een regelmatige veelhoek, met teken */
function tqVeelhoek(){ return {sec:'Draaihoek', prompt:'Een rotatie rond het middelpunt M beeldt de regelmatige veelhoek af op zichzelf. Bepaal de draaihoek met teken, zonder te meten.', build:(b,st,save)=>{
  const R = makeR(st); const n = R.pick([5,6,8,9,10,12]); const k = R.int(1, n-1), dir = R.pick([1,-1]);
  const steps = dir>0 ? k : n-k; const ans = dir*steps*360/n; const nm = 'ABCDEFGHJKLM'.slice(0,n).split('');
  const P = nm.map((x,i)=>{ const a = (90 + i*360/n)*D2R; return [r6(3.4*Math.cos(a)), r6(3.4*Math.sin(a))]; });
  const F = gridFig(b, {g:[-4.6,4.6,-4.6,4.6], plain:true, maxw:300});
  F.draw([{t:'poly', pts:P, c:'orig', names:nm}, {t:'cen', p:[0,0], n:'M', away:[1,1]}, {t:'line', a:[0,0], b:P[0]}, {t:'arcC', c:[0,0], r:1.4, a0:90, a1:90+dir*48, head:true}]);
  qBlock(b, st, save, 'd', {html:keepTxt(`De rotatie beeldt A af op ${nm[k]}, in de zin van de pijl. r(M, [[0]] °)(A) = ${nm[k]}`), size:'xs', mode:'text',
    check:v=>{ const a = parseAng(v[0]); if(isNaN(a)) return {ok:false}; if(Math.abs(a+ans)<1e-6) return {ok:false, msg:'Let op het teken: tegenwijzerzin is positief, wijzerzin negatief.'}; return {ok:Math.abs(a-ans)<1e-6}; },
    sol:`Eén stap is 360° : ${n} = ${r6(360/n)}°. Van A naar ${nm[k]} in de zin van de pijl zijn ${steps} stappen: <b>${degTxt(r6(ans))}</b>`});
}}; }
function tqVlakken(){ return {sec:'Symmetrie in de ruimte', prompt:'Hoeveel symmetrievlakken heeft deze ruimtefiguur? Typ ∞ als het er oneindig veel zijn.', build:(b,st,save)=>{
  const R = makeR(st); const [k,l,n] = R.pick(SOLIDS.filter(s=>s[0]!=='prisma')); solidFig(b, k, {maxw:200});
  const r = qBlock(b, st, save, 'n', {html:`${l}: [[0]] symmetrievlakken`, size:'xs', mode:'text', check:v=>{ const t = String(v[0]).trim().toLowerCase(); if(n==='∞') return {ok:/^(∞|oneindig( veel)?)$/.test(t)}; return {ok:parseNum(t)===n}; }, sol:`<b>${n}</b>`});
  infBtn(r.row);
}}; }
const fromCardT = (card, sec, prompt) => ({sec, prompt: prompt!=null ? prompt : (card.instr||''), build:(b,st,save,key)=>card.build(b,st,save,key)});
const TOETSEN2 = [
  [tqFoto(), fromCardT(HK.zinnen, 'Wiskundetaal'), tqNotatie(), tqEig(), tqWN(), tqSym(), tqRooster(), tqCoord(), fromCardT(PT.centrum, 'Het centrum zoeken'), tqBeeld('s'), tqVeelhoek(), tqVlakken()],
  [tqFoto(), fromCardT(HK.volledig, 'Transformaties herkennen'), tqNotatie(), tqBeeld('r90'), tqRooster(['img','img','pre','el','cen','vec']), fromCardT(SV.letters, 'Symmetrie van letters'), tqWN(), tqCoord(), fromCardT(TR.tekenVec, 'Vector tekenen'), fromCardT(EG.reken, 'Eigenschappen', ''), tqVeelhoek(), fromCardT(SR.midden, 'Symmetrie in de ruimte')],
  [tqFoto(), fromCardT(HK.leef, 'Transformaties herkennen'), fromCardT(NT.assen, 'Notatie in een assenstelsel'), tqBeeld('t'), tqEig(), tqSym(), tqRooster(['pre','el','ang','seg','vec','img']), tqWN(), fromCardT(SV.vulPt, 'Figuur vervolledigen'), tqBeeld('p'), tqCoord(), tqVlakken()]
];

/* ============================================================
   ONDERDELEN
   ============================================================ */
ICONS.tf_herken = '<path d="M2.5 18l4-10 4 10z"/><path d="M13.5 18l4-10 4 10z" stroke-dasharray="1.8 1.3"/>';
ICONS.tf_as = '<path d="M12 2.5v19" stroke-dasharray="2 1.6"/><path d="M9.5 17l-6-1 5-9z"/><path d="M14.5 17l6-1-5-9z"/>';
ICONS.tf_tr = '<path d="M2.5 19l3-6 3 6z"/><path d="M13.5 12l3-6 3 6z"/><path d="M6 11.5l7.5-4"/><path d="M11.6 6.4l2 1.1-1.1 2"/>';
ICONS.tf_rot = '<circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 4a8 8 0 1 1-7.5 5.2"/><path d="M2.6 6.6l1.9 2.8 3-1.5"/>';
ICONS.tf_pt = '<circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M3 4.5h6l-3 5z"/><path d="M21 19.5h-6l3-5z"/><path d="M6 7l12 10" stroke-dasharray="1.6 1.3"/>';
ICONS.tf_not = '<text x="9" y="15" text-anchor="middle" font-size="15" font-style="italic">s</text><text x="16.5" y="20" text-anchor="middle" font-size="9">a</text>';
ICONS.tf_eig = '<path d="M2 18.5l4-9 4 9z"/><path d="M14 18.5l4-9 4 9z"/><path d="M10.6 12.5h2.8M10.6 15h2.8"/>';
ICONS.tf_symv = '<path d="M12 2.5v19" stroke-dasharray="2 1.6"/><path d="M12 6C7 3 3 5 3 9s4 7 9 9c5-2 9-5 9-9s-4-6-9-3z"/>';
ICONS.tf_symr = '<path d="M4 8l8-4 8 4v9l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v9"/>';

const CH_ALG = `<tr><td>beeld</td><td>Het punt of de figuur die je krijgt na de transformatie. Het beeld van A noteer je A′.</td></tr>
  <tr><td>dekpunt</td><td>Een punt dat zichzelf als beeld heeft.</td></tr><tr><td>congruent</td><td>Dezelfde vorm en dezelfde grootte.</td></tr>`;
SEC.herken = { id:'herken', ic:'tf_herken', nav:'Herkennen', title:'Transformaties herkennen',
  tip:'Een <b>transformatie</b> van het vlak beeldt elk punt van het vlak af op juist één punt van dat vlak. In deze module leer je er vier.',
  cheat:`<h3>Spiekbriefje · de vier transformaties</h3><table>
    <tr><td>spiegeling om een as</td><td>De figuur klapt om. Elk punt en zijn beeld liggen even ver van de as, loodrecht erop.</td></tr>
    <tr><td>translatie over een vector</td><td>Alles schuift even ver, in dezelfde richting en dezelfde zin.</td></tr>
    <tr><td>rotatie rond een centrum</td><td>Alles draait rond het centrum over dezelfde hoek. + is tegenwijzerzin.</td></tr>
    <tr><td>spiegeling om een punt</td><td>Een halve draai: het centrum is het midden van elk punt en zijn beeld.</td></tr>${CH_ALG}</table>`,
  cards:[HK.kijk, HK.welke, HK.fotos, HK.leef, HK.zinnen, HK.welke2, HK.volledig, HK.zoek] };
SEC.as = { id:'as', ic:'tf_as', nav:'Spiegelen om een as', title:'Spiegelen om een as',
  tip:'Bij een spiegeling om de as a noteer je: s<sub>a</sub>(A) = A′.',
  cheat:`<h3>Spiekbriefje · spiegelen om een as</h3><table>
    <tr><td>stap 1</td><td>Teken door A een loodlijn op de as a.</td></tr><tr><td>stap 2</td><td>Noem S het snijpunt met a.</td></tr>
    <tr><td>stap 3</td><td>Teken A′ aan de andere kant zodat |AS| = |SA′|.</td></tr><tr><td>notatie</td><td>s<sub>a</sub>(A) = A′</td></tr>
    <tr><td>dekpunten</td><td>De punten op de as.</td></tr><tr><td>let op</td><td>Het beeld is omgeklapt.</td></tr></table>`,
  cards:[AS.kijk, AS.punt, AS.verticaal, AS.horizontaal, AS.dekpunt, AS.schuin, AS.door, AS.teken, AS.stappen] };
SEC.trans = { id:'trans', ic:'tf_tr', nav:'Translatie', title:'Translatie over een vector',
  tip:`Een vector ${vecN('X','Y')} heeft een <b>richting</b>, een <b>zin</b> en een <b>grootte</b>. Je noteert t<sub>${vecN('X','Y')}</sub>(A) = A′.`,
  cheat:`<h3>Spiekbriefje · translatie</h3><table>
    <tr><td>werkwijze</td><td>Kijk hoeveel hokjes je van X naar Y gaat (naar rechts of links, naar boven of beneden). Doe hetzelfde vanuit elk hoekpunt.</td></tr>
    <tr><td>notatie</td><td>t<sub>${vecN('X','Y')}</sub>(A) = A′</td></tr><tr><td>gelijke vectoren</td><td>Dezelfde richting, zin en grootte: ${vecN('X','Y')} = ${vecN('A','A′')}.</td></tr>
    <tr><td>tegengesteld</td><td>${vecN('X','Y')} en ${vecN('Y','X')}: zelfde richting en grootte, andere zin.</td></tr></table>`,
  cards:[TR.kijk, TR.waar, TR.vector, TR.hokjes, TR.vier, TR.tekenVec, TR.welke, TR.gelijk] };
SEC.rot = { id:'rot', ic:'tf_rot', nav:'Rotatie', title:'Rotatie rond een centrum',
  tip:'r(O, 90°): een rotatie rond het centrum O over 90°. Een <b>positieve</b> hoek is <b>tegenwijzerzin</b>, een negatieve hoek is wijzerzin.',
  cheat:`<h3>Spiekbriefje · rotatie</h3><table>
    <tr><td>notatie</td><td>r(O, α)(A) = A′</td></tr><tr><td>+ en −</td><td>+ : tegenwijzerzin ↺ &nbsp; − : wijzerzin ↻</td></tr>
    <tr><td>afstand</td><td>|OA| = |OA′|</td></tr><tr><td>dezelfde rotatie</td><td>r(O, 150°) = r(O, −210°), want 150° − 360° = −210°.</td></tr>
    <tr><td>n gelijke delen</td><td>Eén stap is 360° : n.</td></tr><tr><td>dekpunt</td><td>Het centrum O.</td></tr></table>`,
  cards:[RT.kijk, RT.notatie, RT.oorsprong, RT.centrum, RT.klok, RT.tien, RT.draaihoek, RT.gelijk] };
SEC.punt = { id:'punt', ic:'tf_pt', nav:'Spiegelen om een punt', title:'Spiegelen om een punt',
  tip:'Bij een spiegeling om het punt O is O het <b>midden</b> van [AA′]. Je noteert s<sub>O</sub>(A) = A′.',
  cheat:`<h3>Spiekbriefje · spiegelen om een punt</h3><table>
    <tr><td>stap 1</td><td>Teken de rechte door A en O.</td></tr><tr><td>stap 2</td><td>Teken A′ aan de andere kant zodat |AO| = |OA′|.</td></tr>
    <tr><td>notatie</td><td>s<sub>O</sub>(A) = A′</td></tr><tr><td>hetzelfde als</td><td>r(O, 180°)</td></tr><tr><td>dekpunt</td><td>Het centrum O.</td></tr></table>`,
  cards:[PT.kijk, PT.zelfde, PT.punt, PT.oorsprong, PT.buiten, PT.centrum, PT.rooster, PT.hoekpunt] };
SEC.notatie = { id:'notatie', ic:'tf_not', nav:'Notatie', title:'Notatie van transformaties',
  tip:'Lees een notatie van links naar rechts: welke transformatie, welk element (as, vector, centrum), welk punt, en dan het beeld.',
  cheat:`<h3>Spiekbriefje · notatie</h3><table>
    <tr><td>s<sub>a</sub>(A) = B</td><td>B is het beeld van A door de spiegeling om de as a.</td></tr>
    <tr><td>s<sub>O</sub>(A) = B</td><td>B is het beeld van A door de spiegeling om het punt O.</td></tr>
    <tr><td>t<sub>${vecN('X','Y')}</sub>(A) = B</td><td>B is het beeld van A door de translatie over ${vecN('X','Y')}.</td></tr>
    <tr><td>r(O, −90°)(A) = B</td><td>B is het beeld van A door de rotatie rond O over 90° in wijzerzin.</td></tr>
    <tr><td>s<sub>x</sub>, s<sub>y</sub></td><td>spiegeling om de x-as, om de y-as</td></tr></table>`,
  cards:[NT.lees, NT.schrijf, NT.assen, NT.zelf] };
ICONS.tf_rooster = '<path d="M3 6h18M3 12h18M3 18h18M6 3v18M12 3v18M18 3v18"/><circle cx="6" cy="6" r="1.6" fill="currentColor"/><circle cx="18" cy="18" r="1.6" fill="currentColor"/>';
SEC.rooster = { id:'rooster', ic:'tf_rooster', nav:'Roosters', title:'Transformaties op een rooster',
  tip:'Op een rooster van vierkanten tel je <b>vakjes</b>. Rechten krijgen een <b>kleine letter</b>, punten een <b>hoofdletter</b>.',
  cheat:`<h3>Spiekbriefje · werken op een rooster</h3><table>
    <tr><td>s<sub>a</sub>(A)</td><td>Ga loodrecht naar de as a en tel de vakjes. Ga even ver door aan de andere kant.</td></tr>
    <tr><td>s<sub>M</sub>(A)</td><td>Tel de vakjes van A naar M. Zet vanuit M nog eens dezelfde stappen.</td></tr>
    <tr><td>t<sub>${vecN('X','Y')}</sub>(A)</td><td>Tel hoe je van X naar Y gaat. Zet dezelfde stappen vanuit A.</td></tr>
    <tr><td>r(M, 90°)(A)</td><td>Draai het lijnstuk [MA] een kwart draai in tegenwijzerzin ↺. Bij −90° in wijzerzin ↻.</td></tr>
    <tr><td>s<sub>?</sub>(A) = B</td><td>Het ontbrekende element ligt in het midden van [AB]: een as (kleine letter) of een punt (hoofdletter).</td></tr>
    <tr><td>s<sub>a</sub>([AB])</td><td>Spiegel elk eindpunt afzonderlijk.</td></tr></table>`,
  cards:[RO.kijk, RO.klik, RO.klikR, RO.terug, RO.not, RO.element, RO.alles, NT.vlak] };
SEC.eig = { id:'eig', ic:'tf_eig', nav:'Eigenschappen', title:'Eigenschappen van transformaties',
  tip:'De vier transformaties zijn <b>isometrieën</b>: het beeld is congruent met de figuur. Enkel de plaats verandert, en soms de oriëntatie.',
  cheat:`<h3>Spiekbriefje · eigenschappen</h3><table class="eig-sum"><tr><th></th><th>s<sub>a</sub></th><th>t</th><th>r</th><th>s<sub>O</sub></th></tr>
    ${EIG_ALL.map(([e,l])=>`<tr><td>${l}</td>${['s','t','r','p'].map(k=>`<td>${e!=='par' || PAR_OK[k] ? '✓' : 'niet altijd'}</td>`).join('')}</tr>`).join('')}</table>
    <p>✓ = blijft behouden. Een spiegeling om een as klapt de figuur om. Het beeld van een rechte is enkel bij een translatie en een spiegeling om een punt altijd evenwijdig met die rechte.</p>`,
  cards:[EG.kijk, EG.tabel, EG.illus, EG.benoem, EG.reken, EG.wn, EG.slim, EG.welke] };
SEC.symv = { id:'symv', ic:'tf_symv', nav:'Symmetrie in het vlak', title:'Symmetrie in het vlak',
  tip:'Een figuur is <b>spiegelsymmetrisch om een as</b> als ze zichzelf als beeld heeft bij de spiegeling om die as: dat is een <b>symmetrieas</b>. Valt ze op zichzelf bij een spiegeling om een punt, dan is dat punt een <b>symmetriemiddelpunt</b>.',
  cheat:`<h3>Spiekbriefje · symmetrie in het vlak</h3><table>
    <tr><td>vierkant</td><td>4 assen, wel middelpunt</td></tr><tr><td>rechthoek, ruit</td><td>2 assen, wel middelpunt</td></tr>
    <tr><td>parallellogram</td><td>0 assen, wel middelpunt (snijpunt van de diagonalen)</td></tr><tr><td>gelijkbenig trapezium, vlieger</td><td>1 as, geen middelpunt</td></tr>
    <tr><td>gelijkzijdige driehoek</td><td>3 assen, geen middelpunt</td></tr><tr><td>regelmatige n-hoek</td><td>n assen; een middelpunt als n even is</td></tr>
    <tr><td>cirkel</td><td>oneindig veel assen, wel middelpunt</td></tr></table>`,
  cards:[SV.kijk, SV.vier, SV.letters, SV.drie, SV.logo, SV.para, SV.vulAs, SV.vulPt, SV.wn, SV.tabel, SV.opp] };
SEC.symr = { id:'symr', ic:'tf_symr', nav:'Symmetrie in de ruimte', title:'Symmetrie in de ruimte',
  tip:'Een <b>symmetrievlak</b> verdeelt een ruimtefiguur in twee congruente helften die elkaars spiegelbeeld zijn.',
  cheat:`<h3>Spiekbriefje · symmetrievlakken</h3><table>
    <tr><td>kubus</td><td>9</td></tr><tr><td>balk (l, b, h verschillend)</td><td>3</td></tr><tr><td>balk met vierkant grondvlak</td><td>5</td></tr>
    <tr><td>piramide met vierkant grondvlak</td><td>4</td></tr><tr><td>recht prisma, gelijkzijdige driehoek</td><td>4</td></tr><tr><td>cilinder, bol</td><td>oneindig veel</td></tr>
    <tr><td>symmetriemiddelpunt</td><td>kubus en balk: het snijpunt van de ruimtediagonalen</td></tr></table>`,
  cards:[SR.kijk, SR.tel, SR.wn, SR.balkvlak, SR.midden, SR.welk] };
SEC.fout = { id:'fout', ic:'fout', nav:'Foutenjager', title:'Foutenjager',
  tip:'Iemand anders maakte de oefening. Zoek wat er fout ging. Zo leer je de valkuilen kennen.',
  cards:[FJ.as, FJ.rot, FJ.tr, FJ.pt, FJ.reken] };
const TOETS_TIP2 = 'Een proeftoets over de hele module. Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Werk zonder spiekbriefje.';
[0,1,2].forEach(i=>{ SEC['toets'+(i+1)] = { id:'toets'+(i+1), ic:'toets', nav:'Proeftoets '+(i+1), title:'Proeftoets '+(i+1), tip:TOETS_TIP2,
  cards:[ { title:'Proeftoets '+(i+1), noReset:true, build:(b,st,save,key)=>proeftoets(b,st,save,key,TOETSEN2[i]) } ] }; });

const ORDER = ['herken','as','trans','rot','punt','notatie','rooster','coord','eig','symv','symr','fout','toets1','toets2','toets3'];
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
    const c = el('div','card');
    const ch = el('div','card-head', `<h3>${card.title}${card.lvl?LVL[card.lvl]:''}</h3>`);
    const rb = el('button','refresh-btn', card.keep ? '↺ Opnieuw beginnen' : '↺ Nieuwe opgave'); rb.type='button';
    if(!card.noReset) ch.append(rb); c.append(ch);
    if(card.instr) c.append(el('p','instructions', card.instr));
    const body = el('div'); c.append(body); (card.lvl===3 ? panes.c : panes.b).append(c);
    renderers[key] = ()=>{ body.innerHTML = ''; clearSel(); const st = load(key); const save = ()=>store(key, st); CURKEY = key;
      try{ card.build(body, st, save, key); }catch(err){ console.error(err); body.append(el('p','fb bad','Er liep iets mis bij het maken van deze oefening. Klik op “Nieuwe opgave”.')); }
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
try{ window.scrollTo(0,0); requestAnimationFrame(()=>window.scrollTo(0,0)); }catch(e){}
