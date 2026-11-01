/* ============================================================
   HULPFUNCTIES
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const PREFIX = 'm5_gehele_v1_';
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
   MODULE 4 · MACHTEN: exacte breuken, notatie, invoer en controle
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
const eH = e => typeof e==='number' ? sg(e) : linP(String(e)) ? linH(e).replace(/ /g, '') : sg(String(e)).replace(/([a-z])/g, '<i>$1</i>');
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
    else if(t==='z') W[k].X = vrijZ(sp, v, save, onCh, o[0]);   /* 1A module 5: vrij vak voor bewerkingen met gehele getallen */
    else if(t==='s') sp.append(tekenvak(v, save, onCh));            /* enkel een tekenvak */
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
    mark(fields){ Object.entries(W).forEach(([k, w]) => { if(w.X){ w.X.mark(true); return; } w.sp.classList.remove('ok', 'bad'); if(fields && fields[k]!=null) w.sp.classList.add(fields[k] ? 'ok' : 'bad'); }); },
    clear(){ Object.values(W).forEach(w => { if(w.X) w.X.mark(null); w.sp.classList.remove('ok', 'bad'); }); },
    lock(){ Object.values(W).forEach(w => w.X && w.X.lock()); root.querySelectorAll('input,button').forEach(x => { if(x.tagName==='INPUT') x.readOnly = true; else if(x.closest('.m4-w,.m4-wi')) x.disabled = true; }); },
    empty(){ return Object.entries(W).some(([k, w]) => isEmptyW(w.t, V[k])); }
  };
}
const isEmptyW = (t, v) => t==='i' ? false : t==='x' ? emptyX(v) : t==='z' ? emptyZ(v) : t==='s' ? !v || !v.s : !v || (t==='m' ? !(v.bt||'').trim() : t==='u' ? !(v.t||'').trim() && (v.z || !v.s) : !(v.t||'').trim()) || (v.n!=null && !String(v.n).trim());

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
  const M = mountW(line, s.v, save, ()=>{ M.clear(); if(!quiz){ fb.className = 'fb'; fb.textContent = ''; } }, ()=>{ if(!quiz) run(); });
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
    bar.append(plus, el('div', 'vx-snel', 'Typen kan ook: ' + [['h', '<kbd>(</kbd> <kbd>)</kbd> haakjes'], ['e', '<kbd>^</kbd> macht'], ['b', '<kbd>/</kbd> breuk'], ['m', '<kbd>*</kbd> maal']].filter(([c]) => mag(c)).map(([, t]) => t).join(' · ')));
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
    .m4-q > .vx-balk{grid-column:2; grid-row:1 / span 4; display:grid; grid-template-columns:repeat(3, 2.35rem); gap:.35rem; margin:2.2rem 0 0; padding:.55rem; border:1.5px solid var(--border); border-radius:.8rem; background:var(--zone-bg, #f4fbfb); position:sticky; top:1rem; width:max-content}
    .m4-q > .vx-balk .vx-tools{display:contents}
    .m4-q > .vx-balk .vx-k{min-width:2.35rem; min-height:2.35rem}
    .m4-q > .vx-balk .vx-snel{grid-column:1 / span 3; width:7.8rem; font-size:.7rem; line-height:1.6}
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
   1A MODULE 5 · REKENEN MET GEHELE GETALLEN
   - getallen tonen: zS (−1 250), zP (haakjes rond een negatief getal)
   - een bewerking lezen (ZX.parse) tot een boom, met de gewone voorrang;
     waarde als eerstegraadsvorm {k, x:{letter:coëfficiënt}} zodat ook 4 · (x + 2) kan
   - VRIJ VAK {{z:k,opties}}: de leerling typt elke tussenstap op een eigen regel (zoals op papier);
     controle per regel: juist / bijna juist (nog niet uitgerekend) / fout met rood kruisje en uitleg.
     Knoppen per oefening: m maal · d gedeeld door · h haakjes · v vierkante haakjes · a absolute waarde
   ============================================================ */
const zS = n => (n < 0 ? MIN : '') + dz(Math.abs(n));
const zP = n => n < 0 ? `(${zS(n)})` : zS(n);
/* een bewerking als tekst: '8 + 4 · (-6)' -> mooi met − en dunne spaties */
const zT = s => String(s).replace(/-/g, MIN).replace(/\*/g, '·').replace(/⦅/g, '(').replace(/⦆/g, ')');
const ZX = {};
/* ---------- rekenen met eerstegraadsvormen ---------- */
ZX.c = k => ({k, x:{}});
ZX.add = (a, b, f=1) => { const x = Object.assign({}, a.x); for(const l in b.x){ x[l] = (x[l]||0) + f*b.x[l]; if(!x[l]) delete x[l]; } return {k:a.k + f*b.k, x}; };
ZX.scal = (a, f) => { const x = {}; for(const l in a.x){ if(a.x[l]*f) x[l] = a.x[l]*f; } return {k:a.k*f, x}; };
ZX.isC = a => !Object.keys(a.x).length;
ZX.eq = (a, b) => { if(typeof b==='number') b = ZX.c(b); if(a.k!==b.k) return false; const ks = new Set([...Object.keys(a.x), ...Object.keys(b.x)]); for(const l of ks) if((a.x[l]||0)!==(b.x[l]||0)) return false; return true; };
ZX.H = a => { /* -6x + 24 */ const t = Object.keys(a.x).sort().map(l => [a.x[l], l]); let s = '';
  t.forEach(([c, l], i) => { const m = Math.abs(c); s += (i ? (c<0 ? ' − ' : ' + ') : (c<0 ? MIN : '')) + (m===1 ? '' : m + ' · ') + `<i>${l}</i>`; });
  if(a.k || !t.length) s += t.length ? (a.k<0 ? ' − ' : ' + ') + dz(Math.abs(a.k)) : zS(a.k); return s; };

/* ---------- lezen: tekst -> tokens -> boom ---------- */
ZX.tok = str => {
  const s = String(str).replace(/[−–]/g, '-').replace(/[×x*](?![a-z])/gi, m => /x/i.test(m) ? m : '·').replace(/\*/g, '·').replace(/[÷/]/g, ':').replace(/⦅/g, '⦅').replace(/,/g, ',');
  const T = []; let i = 0;
  while(i < s.length){ const c = s[i];
    if(c===' '){ i++; continue; }
    if(/\d/.test(c)){ let j = i; let num = '';
      while(j < s.length){ if(/\d/.test(s[j])){ num += s[j]; j++; } else if(s[j]===' ' && /^ \d{3}(?!\d)/.test(s.slice(j)) && /\d$/.test(num)){ j++; } else break; }
      if(s[j]===',' || s[j]==='.') return {err:'Typ enkel gehele getallen (zonder komma).'};
      T.push({t:'n', v:+num, p:i}); i = j; continue; }
    if(/[a-z]/i.test(c)){ T.push({t:'l', v:c.toLowerCase(), p:i}); i++; continue; }
    if('+-·:'.includes(c)){ T.push({t:'o', v:c, p:i}); i++; continue; }
    if('(['.includes(c) || c==='⦅'){ T.push({t:'(', v:c==='[' ? '[' : '(', rood:c==='⦅', p:i}); i++; continue; }
    if(')]'.includes(c) || c==='⦆'){ T.push({t:')', v:c==='⦆' ? ')' : c, rood:c==='⦆', p:i}); i++; continue; }
    if(c==='|'){ T.push({t:'|', p:i}); i++; continue; }
    if(c==='='){ return {err:'Typ geen = in het vak: elke regel begint al met =.'}; }
    return {err:`Het teken <b>${esc(c)}</b> kan ik niet lezen.`};
  }
  return T;
};
/* boom: {t:'n', v} {t:'l', v} {t:'neg', a, kaal} {t:'pos', a} {t:'bin', op, a, b} {t:'grp', br:'('|'['|'|', a, rood} */
ZX.parse = str => {
  const T = ZX.tok(str); if(T.err) return T; if(!T.length) return {leeg:true};
  let i = 0; const fl = {kaal:[], impl:false};
  const peek = () => T[i], eat = () => T[i++];
  function expr(start){
    let a = term(true);
    while(peek() && peek().t==='o' && '+-'.includes(peek().v)){ const op = eat().v; const b = term(false); a = {t:'bin', op: op==='-' ? '−' : '+', a, b}; }
    return a;
  }
  function term(first){
    let a = unary(first, false);
    while(peek() && peek().t==='o' && '·:'.includes(peek().v)){ const op = eat().v; const b = unary(false, true); a = {t:'bin', op, a, b}; }
    return a;
  }
  /* een minteken of plusteken direct na een bewerkingsteken: zonder haakjes (kaal) */
  function unary(first, naMaal){
    const k = peek();
    if(k && k.t==='o' && '+-'.includes(k.v)){ eat(); const a = unary(first, naMaal); const n = {t: k.v==='-' ? 'neg' : 'pos', a}; if(!first) { n.kaal = true; fl.kaal.push(n); } return n; }
    return atom();
  }
  function atom(){
    const k = eat(); if(!k) throw {msg:'De regel stopt te vroeg: er ontbreekt nog een getal.'};
    let n;
    if(k.t==='n'){ n = {t:'n', v:k.v};
      if(peek() && (peek().t==='l')){ const l = eat(); n = {t:'bin', op:'·', a:n, b:{t:'l', v:l.v}, impl:true}; }
      else if(peek() && peek().t==='('){ throw {msg:'Zet een maalteken tussen een getal en een haakje.'}; } }
    else if(k.t==='l') n = {t:'l', v:k.v};
    else if(k.t==='('){ const a = expr(true); const c = eat(); if(!c || c.t!==')') throw {msg:'Er ontbreekt een haakje sluiten.'};
      if((k.v==='[') !== (c.v===']')) throw {msg:'Een vierkant haakje sluit je met een vierkant haakje.'};
      n = {t:'grp', br:k.v, a, rood:k.rood}; }
    else if(k.t==='|'){ const a = expr(true); const c = eat(); if(!c || c.t!=='|') throw {msg:'Er ontbreekt een streep van de absolute waarde.'}; n = {t:'grp', br:'|', a}; }
    else if(k.t===')') throw {msg:'Er staat een haakje sluiten te veel, of er ontbreekt een getal.'};
    else throw {msg:'Twee bewerkingstekens na elkaar: zet het tweede getal tussen haakjes.'};
    if(peek() && (peek().t==='(' || peek().t==='n' || peek().t==='l') ) throw {msg:'Tussen twee getallen of haakjes hoort een bewerkingsteken.'};
    return n;
  }
  try{ const a = expr(true); if(i < T.length){ const k = T[i]; return {err: k.t===')' ? 'Er staat een haakje sluiten te veel.' : 'Deze regel kan ik niet lezen. Kijk de bewerkingstekens en haakjes na.'}; } a.kaal = fl.kaal; return a; }
  catch(e){ if(e && e.msg) return {err:e.msg}; throw e; }
};
/* waarde van een boom (of {err}) */
ZX.val = n => {
  if(n.t==='n') return ZX.c(n.v);
  if(n.t==='l'){ const x = {}; x[n.v] = 1; return {k:0, x}; }
  if(n.t==='neg' || n.t==='pos'){ const a = ZX.val(n.a); if(a.err) return a; return n.t==='neg' ? ZX.scal(a, -1) : a; }
  if(n.t==='grp'){ const a = ZX.val(n.a); if(a.err) return a; if(n.br!=='|') return a; if(!ZX.isC(a)) return {err:'De absolute waarde van een letter kan ik niet uitrekenen.'}; return ZX.c(Math.abs(a.k)); }
  const a = ZX.val(n.a); if(a.err) return a; const b = ZX.val(n.b); if(b.err) return b;
  if(n.op==='+') return ZX.add(a, b); if(n.op==='−') return ZX.add(a, b, -1);
  if(n.op==='·'){ if(ZX.isC(a)) return ZX.scal(b, a.k); if(ZX.isC(b)) return ZX.scal(a, b.k); return {err:'Twee letters vermenigvuldigen doen we hier niet.'}; }
  if(!ZX.isC(b)) return {err:'Delen door een letter doen we hier niet.'};
  if(b.k===0) return {err:'Delen door 0 kan niet.'};
  const r = ZX.scal(a, 1); if(r.k % b.k || Object.values(r.x).some(c => c % b.k)) return {err:'Deze deling gaat niet op: de uitkomst is geen geheel getal. Kijk na of je juist rekende.', nz:true};
  r.k /= b.k; for(const l in r.x) r.x[l] /= b.k; return r;
};
ZX.waarde = s => { const t = typeof s==='string' ? ZX.parse(s) : s; if(t.err || t.leeg) return null; const v = ZX.val(t); return v.err ? null : v; };
/* een boom terug naar tekst (voor bogen en oplossingen) */
ZX.str = (n, top=true) => {
  if(n.t==='n') return dz(n.v);
  if(n.t==='l') return n.v;
  if(n.t==='neg') return MIN + ZX.str(n.a, false);
  if(n.t==='pos') return '+' + ZX.str(n.a, false);
  if(n.t==='grp'){ const [o, c] = n.br==='[' ? ['[', ']'] : n.br==='|' ? ['|', '|'] : ['(', ')']; return o + ZX.str(n.a, true) + c; }
  if(n.impl) return ZX.str(n.a, false) + n.b.v;
  return ZX.str(n.a, false) + ' ' + n.op + ' ' + ZX.str(n.b, false);
};
/* van links naar rechts zonder voorrang (maar met haakjes): de klassieke volgordefout */
ZX.lnr = str => { const T = ZX.tok(str); if(T.err) return null;
  const st = [[]]; for(const k of T){ if(k.t==='(' || k.t==='|') st.push([]); else if(k.t===')'){ const g = st.pop(); if(!st.length) return null; st[st.length-1].push({t:'v', v:plat(g)}); } else st[st.length-1].push(k); }
  function plat(g){ let acc = null, op = null, sign = 1;
    for(const k of g){ if(k.t==='o'){ if(acc===null || op){ if(k.v==='-') sign = -sign; } else op = k.v; continue; }
      const x = sign * (k.t==='n' ? k.v : k.t==='v' ? k.v : NaN); sign = 1;
      if(acc===null) acc = x; else { acc = op==='+' ? acc + x : op==='-' ? acc - x : op==='·' ? acc * x : acc / x; op = null; } }
    return acc; }
  if(st.length!==1) return null; const r = plat(st[0]); return Number.isInteger(r) ? r : null; };
/* aftrekken vergeten om te zetten: elke − (−n) wordt − n */
ZX.zonderTegen = str => { const s = String(str).replace(/[−–]/g, '-'); if(!/-\s*[(⦅]\s*-/.test(s)) return null; const v = ZX.waarde(s.replace(/-\s*[(⦅]\s*-\s*(\d+)\s*[)⦆]/g, '- $1')); return v; };

/* ---------- is een regel al volledig uitgerekend? '' = ja ---------- */
ZX.waarom = (n, doel) => {
  if(ZX.isC(doel)){
    let m = n; if(m.t==='grp' && m.br==='(') return 'Haakjes rond de uitkomst schrijf je niet.';
    if(m.t==='pos') return 'Een + vooraan schrijf je niet.';
    if(m.t==='neg' && m.a.t==='n') return '';
    if(m.t==='n') return '';
    return 'Reken nog verder uit tot één getal.';
  }
  /* met letters: herleid, elke letter één keer, geen haakjes meer */
  const termen = []; const walk = (x, f) => { if(x.t==='bin' && (x.op==='+' || x.op==='−')){ walk(x.a, f); walk(x.b, x.op==='−' ? -f : f); } else termen.push([x, f]); };
  walk(n, 1); const L = {}; let k = 0;
  for(const [t] of termen){ let x = t; if(x.t==='neg' || x.t==='pos') x = x.a;
    if(x.t==='grp') return 'Werk de haakjes nog weg.';
    if(x.t==='n'){ k++; continue; }
    if(x.t==='l'){ L[x.v] = (L[x.v]||0) + 1; continue; }
    if(x.t==='bin' && x.op==='·' && ((x.a.t==='n' && x.b.t==='l') || (x.a.t==='l' && x.b.t==='n'))){ const l = x.a.t==='l' ? x.a.v : x.b.v; L[l] = (L[l]||0) + 1; continue; }
    return 'Reken de producten nog uit.'; }
  if(k > 1) return 'Tel de getallen zonder letter nog samen.';
  if(Object.values(L).some(c => c > 1)) return 'Dezelfde letter staat er meer dan één keer. Neem die termen samen.';
  return '';
};
/* uitleg bij een foute regel: vergelijk met de regel erboven (of de opgave) */
ZX.uitleg = (val, vorig, doel, fout) => {
  const g = (fout||[]).find(([w]) => ZX.eq(val, w)); if(g) return g[1];
  if(vorig && ZX.isC(val)){ const l = ZX.lnr(vorig); if(l!=null && l===val.k && !ZX.eq(val, doel)) return 'Let op de volgorde van de bewerkingen: eerst wat tussen haakjes staat, dan maal en gedeeld door, pas daarna plus en min.';
    const zt = ZX.zonderTegen(vorig); if(zt && ZX.eq(val, zt)) return 'Een negatief getal aftrekken is het tegengestelde optellen: − (−5) wordt + 5.'; }
  if(ZX.eq(ZX.scal(val, -1), doel) && !ZX.eq(val, doel)) return 'Het getal klopt, maar het teken niet. Kijk nog eens naar de mintekens.';
  return 'Deze regel is niet meer gelijk aan de regel erboven. Zoek waar het misging.';
};
/* minteken zonder haakjes na een bewerkingsteken: 5 + −3 */
ZX.kaalUitleg = () => ({fix:true, tekst:`Een negatief getal na een bewerkingsteken staat altijd tussen haakjes: 5 + (${MIN}3), niet 5 + ${MIN}3. Ook al klopt de waarde, op papier schrijf je de haakjes.`});
ZX.zetHaakjes = s => String(s).replace(/([+\-−·:*/]\s*)([−-]\s*\d[\d ]*?)(?=\s*(?:[+\-−·:*/)\]|⦆]|$))/g, (m, a, b) => `${a}⦅${b.trim()}⦆`);

/* controle van het vrije vak. doel: getal of eerstegraadsvorm; o.fout = [[waarde, boodschap]]; o.opg = opgave (tekst) */
function chkZ(v, doel, o={}){
  if(typeof doel==='number') doel = ZX.c(doel);
  if(window.__M4TEST) window.__VXDOEL = doel;
  const R = Array.isArray(v && v.r) ? v.r : [];
  const lines = R.filter(L => (L.s||'').trim());
  let vorig = o.opg || null;
  const res = lines.map(L => { const t = ZX.parse(L.s); if(t.err) return {err:t.err}; const val = ZX.val(t); if(val.err) return {err:val.err};
    const eq = ZX.eq(val, doel); let r;
    if(eq && t.kaal && t.kaal.length) r = {val, eq:false, why:'', uitleg:ZX.kaalUitleg()};
    else r = {val, eq, why: eq ? ZX.waarom(t, doel) : '', uitleg: eq ? '' : ZX.uitleg(val, vorig, doel, o.fout)};
    vorig = L.s; return r; });
  Object.defineProperty(v, '_res', {value:R.map(L => res[lines.indexOf(L)] || null), configurable:true, enumerable:false});
  if(!res.length) return {info:true, msg:'Vul eerst je antwoord in.'};
  const nr = res.length > 1;
  const ek = res.findIndex(r => r.err); if(ek >= 0) return {info:true, msg:(nr ? `Regel ${ek+1}: ` : '') + res[ek].err};
  const fk = res.findIndex(r => !r.eq);
  if(fk >= 0) return {ok:false, msg: nr ? `Regel ${fk+1} klopt niet. Klik op het rode kruisje voor uitleg.` : (u => typeof u==='string' ? u : u.tekst)(res[fk].uitleg)};
  const last = res[res.length-1];
  if(last.why) return {info:true, msg:`<b>Bijna juist!</b> Deze stap klopt. ${last.why} Klik op <b>=</b> en reken verder op een nieuwe regel.`};
  return {ok:true};
}
const emptyZ = v => !v || !Array.isArray(v.r) || !v.r.length || !(v.r[v.r.length-1].s||'').trim();

/* ---------- het vak zelf ---------- */
const VZ_KNOPPEN = 'mdh';
const VZ_IC = { m:'·', d:':', h:'(&#8239;)', v:'[&#8239;]', a:'<span class="vz-abs">|<span class="vx-hok"></span>|</span>' };
const VZ_LAB = { m:['maal', 'maalteken'], d:['gedeeld door', 'deelteken'], h:['haakjes', 'haakjes rond het getal of de selectie'], v:['vierkante haakjes', 'vierkante haakjes'], a:['absolute waarde', 'absolute waarde: twee strepen'] };
/* tekst met rode haakjes (⦅ ⦆) en mooie tekens voor de spiegel achter het invulvak */
const vzMooi = s => esc(String(s)).replace(/-/g, MIN).replace(/\*/g, '·').replace(/\//g, ':').replace(/⦅/g, '<span class="vz-rood">(</span>').replace(/⦆/g, '<span class="vz-rood">)</span>');
function vrijZ(sp, v, save, onCh, opt){
  const mag = c => (opt || VZ_KNOPPEN).includes(c);
  sp.classList.add('m5-z'); sp.dataset.knoppen = opt || VZ_KNOPPEN;
  if(!Array.isArray(v.r) || !v.r.length) v.r = [{s:''}];
  const hist = [JSON.stringify(v.r)]; let undoB = null, bar = null, actief = null;
  const ch = () => { const t = JSON.stringify(v.r); if(t!==hist[hist.length-1]){ hist.push(t); if(hist.length>200) hist.shift(); } if(undoB) undoB.disabled = hist.length<2; save(); onCh(); };
  const terug = () => { if(hist.length<2) return; hist.pop(); v.r = JSON.parse(hist[hist.length-1]); save(); onCh(); draw(); focusEind(); };
  const focusEind = () => { if(actief){ actief.focus({preventScroll:true}); const n = actief.value.length; actief.setSelectionRange(n, n); } };
  /* tekens omzetten tijdens het typen: * wordt ·, / wordt :, - wordt − ; caret blijft staan */
  function netjes(inp){ const p = inp.selectionStart; const t = inp.value.replace(/\*/g, '·').replace(/\//g, ':').replace(/[-–]/g, MIN).replace(/x(?=\s*[\d(])/g, m => mag('m') ? '·' : m);
    if(t!==inp.value){ inp.value = t; inp.setSelectionRange(p, p); } }
  function maat(inp, spie){ spie.innerHTML = vzMooi(inp.value) + '&#8203;'; inp.style.width = Math.max(4.5, spie.scrollWidth / 16 + 1.4) + 'rem'; }
  function draw(){ sp.innerHTML = ''; actief = null;
    v.r.forEach((L, li) => { const isAct = li===v.r.length-1;
      const row = el('div', 'vx-regel vz-regel' + (isAct ? ' actief' : '')); row.append(el('span', 'm4-is vx-is', '='));
      const box = el('span', 'vz-box'); const spie = el('span', 'vz-spiegel'); const inp = el('input', 'vz-in');
      inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.value = (L.s||'').replace(/-/g, MIN); inp.setAttribute('aria-label', 'regel ' + (li+1) + ': typ de bewerking of de uitkomst');
      box.append(spie, inp); row.append(box); sp.append(row);
      requestAnimationFrame(()=>maat(inp, spie)); maat(inp, spie);
      if(isAct){ actief = inp;
        inp.addEventListener('input', ()=>{ netjes(inp); L.s = inp.value; maat(inp, spie); ch(); });
        inp.addEventListener('focus', ()=>row.classList.add('focus')); inp.addEventListener('blur', ()=>row.classList.remove('focus'));
        inp.addEventListener('keydown', e=>{
          if(e.key==='Enter'){ e.preventDefault(); if((L.s||'').trim()){ v.r.push({s:''}); ch(); draw(); focusEind(); } }
          else if(e.key==='Backspace' && inp.value==='' && v.r.length>1){ e.preventDefault(); v.r.pop(); ch(); draw(); focusEind(); }
          else if((e.key===')' || e.key===']' || e.key==='|') && inp.selectionStart===inp.selectionEnd && inp.value[inp.selectionStart]===e.key){ e.preventDefault(); const q = inp.selectionStart + 1; inp.setSelectionRange(q, q); }   /* sluithaakje dat er al staat: overtikken */
          else if(e.key==='(' && mag('h')){ e.preventDefault(); invoeg('(', ')'); }
          else if(e.key==='[' && mag('v')){ e.preventDefault(); invoeg('[', ']'); }
          else if(e.key==='|' && mag('a')){ e.preventDefault(); invoeg('|', '|'); } });
      } else inp.readOnly = true;
    });
    balk(); kruisjes(false); }
  /* twee tekens rond de selectie (of een paar met de cursor ertussen) */
  function invoeg(a, b){ const inp = actief; if(!inp) return; const L = v.r[v.r.length-1];
    const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? s; const x = inp.value;
    inp.value = x.slice(0, s) + a + x.slice(s, e) + (b||'') + x.slice(e); const p = e===s ? s + a.length : e + a.length + (b||'').length;
    L.s = inp.value; ch(); inp.focus({preventScroll:true}); inp.setSelectionRange(p, p); maat(inp, inp.previousSibling); }
  function kruisjes(alle){
    if(!api.check) return; try{ api.check(); }catch(e){ return; }
    const res = v._res || [];
    sp.querySelectorAll('.vz-regel').forEach((row, li) => { row.querySelectorAll('.vx-x, .vx-uit').forEach(x => x.remove());
      const r = res[li]; if(!r || (!alle && li===v.r.length-1)) return; const U = r.err || (r.eq===false ? r.uitleg : ''); if(!U) return;
      const tekst = typeof U==='string' ? U : U.tekst, fix = typeof U==='string' ? null : U.fix;
      const x = el('button', 'vx-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'hier is iets fout: toon uitleg'); x.dataset.tip = 'iets fout? klik voor uitleg';
      const box = el('div', 'vx-uit', `<button type="button" class="vx-uit-dicht" aria-label="sluit">×</button>${tekst}`); box.hidden = true;
      x.addEventListener('mousedown', e=>e.preventDefault());
      x.addEventListener('click', ()=>{ box.hidden = !box.hidden; x.setAttribute('aria-expanded', String(!box.hidden)); });
      box.querySelector('.vx-uit-dicht').addEventListener('click', ()=>{ box.hidden = true; });
      if(fix){ const vb = el('button', 'btn vx-verbeter', 'Verbeter deze stap'); vb.type = 'button'; const k = el('div', 'vx-uit-knop'); k.append(vb); box.append(k);
        vb.addEventListener('click', ()=>{ v.r[li].s = ZX.zetHaakjes(v.r[li].s); ch(); draw(); focusEind(); }); }
      row.append(x, box); }); }
  function balk(){
    if(!bar){ bar = el('div', 'vx-balk vz-balk'); const q = sp.closest('.m4-q'), act = q && q.querySelector(':scope > .q-act'); if(act) q.insertBefore(bar, act); else sp.after(bar); }
    bar.innerHTML = ''; const tools = el('div', 'vx-tools'); bar.append(tools);
    const knop = (ic, lab, tip, fn, cls='') => { const b = el('button', 'vx-k ' + cls, `<span class="vx-ic">${ic}</span>`); b.type = 'button'; b.dataset.tip = lab; b.setAttribute('aria-label', tip);
      b.addEventListener('mousedown', e=>e.preventDefault()); b.addEventListener('click', fn); tools.append(b); return b; };
    if(mag('m')) knop(VZ_IC.m, ...VZ_LAB.m, ()=>invoeg(' · '), 'vz-groot');
    if(mag('d')) knop(VZ_IC.d, ...VZ_LAB.d, ()=>invoeg(' : '), 'vz-groot');
    if(mag('h')) knop(VZ_IC.h, ...VZ_LAB.h, ()=>invoeg('(', ')'));
    if(mag('v')) knop(VZ_IC.v, ...VZ_LAB.v, ()=>invoeg('[', ']'));
    if(mag('a')) knop(VZ_IC.a, ...VZ_LAB.a, ()=>invoeg('|', '|'));
    undoB = knop('↶', 'terug', 'ongedaan maken', terug, 'vx-terug'); undoB.disabled = hist.length<2;
    if(v.r.length>1) knop('✕', 'regel weg', 'de laatste regel weghalen', () => { v.r.pop(); ch(); draw(); focusEind(); }, 'vx-weg');
    const plus = el('button', 'btn ghost vx-plus', '<span class="sr-only">volgende tussenstap</span>'); plus.type = 'button'; plus.dataset.tip = 'volgende tussenstap'; plus.setAttribute('aria-label', 'volgende tussenstap: nieuwe regel');
    plus.addEventListener('mousedown', e=>e.preventDefault());
    plus.addEventListener('click', ()=>{ if(!(v.r[v.r.length-1].s||'').trim()){ focusEind(); return; } v.r.push({s:''}); ch(); draw(); focusEind(); });
    const sn = [['m', '<kbd>*</kbd> maal'], ['d', '<kbd>:</kbd> of <kbd>/</kbd> delen'], ['h', '<kbd>(</kbd> haakjes'], ['v', '<kbd>[</kbd> vierkante haakjes'], ['a', '<kbd>|</kbd> absolute waarde']].filter(([c]) => mag(c)).map(([, t]) => t);
    bar.append(plus, el('div', 'vx-snel', 'Typen kan ook: ' + sn.concat(['<kbd>Enter</kbd> nieuwe regel']).join(' · ')));
  }
  const api = {check:null, toon:()=>kruisjes(false),
    trim(){ let weg = false; while(v.r.length>1 && !(v.r[v.r.length-1].s||'').trim()){ v.r.pop(); weg = true; } if(weg){ ch(); draw(); } }};
  draw();
  return Object.assign(api, {
    mark(on){ const res = v._res || []; sp.querySelectorAll('.vz-regel').forEach((row, li) => { row.classList.remove('ok', 'bad', 'bijna'); const r = res[li]; if(on==null || !r || r.err || r.eq==null) return;
      row.classList.add(!r.eq ? 'bad' : (li===v.r.length-1 && r.why) ? 'bijna' : 'ok'); }); if(on!=null) kruisjes(true); else { const a = sp.querySelector('.vz-regel.actief'); if(a) a.querySelectorAll('.vx-x, .vx-uit').forEach(x => x.remove()); } },
    lock(){ if(bar) bar.remove(); sp.querySelectorAll('input').forEach(i => i.readOnly = true); }
  });
}
/* spiekbriefje bij de knoppen (knop ? rechtsboven op de kaart) */
const VZ_HULP = k => `<h3>Spiekbriefje · zo schrijf je je uitwerking</h3><table>
  <tr><td><span class="vx-k vx-demo"><span class="vx-ic">=</span></span></td><td><b>volgende tussenstap</b>: begint een nieuwe regel (of druk op <kbd>Enter</kbd>). Schrijf elke stap op een eigen regel, zoals op papier. De laatste regel is je antwoord.</td><td><kbd>Enter</kbd></td></tr>
  ${k.includes('m') ? `<tr><td><span class="vx-k vx-demo vz-groot"><span class="vx-ic">${VZ_IC.m}</span></span></td><td><b>maal</b>: zet een maalteken.</td><td><kbd>*</kbd></td></tr>` : ''}
  ${k.includes('d') ? `<tr><td><span class="vx-k vx-demo vz-groot"><span class="vx-ic">${VZ_IC.d}</span></span></td><td><b>gedeeld door</b>: zet een deelteken.</td><td><kbd>:</kbd> <kbd>/</kbd></td></tr>` : ''}
  ${k.includes('h') ? `<tr><td><span class="vx-k vx-demo"><span class="vx-ic">${VZ_IC.h}</span></span></td><td><b>haakjes</b>: zet haakjes, of zet ze rond wat je selecteerde. Een negatief getal na een bewerkingsteken staat altijd tussen haakjes: 7 + (${MIN}3).</td><td><kbd>(</kbd></td></tr>` : ''}
  ${k.includes('v') ? `<tr><td><span class="vx-k vx-demo"><span class="vx-ic">${VZ_IC.v}</span></span></td><td><b>vierkante haakjes</b>: haakjes rond een stuk met haakjes erin.</td><td><kbd>[</kbd></td></tr>` : ''}
  ${k.includes('a') ? `<tr><td><span class="vx-k vx-demo"><span class="vx-ic">${VZ_IC.a}</span></span></td><td><b>absolute waarde</b>: twee strepen, bijvoorbeeld |${MIN}7| = 7.</td><td><kbd>|</kbd></td></tr>` : ''}
  <tr><td><span class="vx-k vx-demo"><span class="vx-ic">↶</span></span></td><td><b>terug</b>: maakt je laatste wijziging ongedaan.</td><td></td></tr>
  <tr><td><span class="vx-k vx-demo"><span class="vx-ic">✕</span></span></td><td><b>regel weg</b>: haalt de laatste regel weg (of druk op de wistoets in een lege regel).</td><td><kbd>⌫</kbd></td></tr></table>
  <p>Het minteken typ je met <kbd>-</kbd>. <b>Bijna juist</b> betekent: je stap klopt, maar je bent nog niet klaar. Een <b class="vx-rood">✕</b> naast een regel betekent dat daar iets fout ging: klik erop voor uitleg.</p>`;
function vzHulp(card){
  const head = card.querySelector('.card-head'); if(!head || head.querySelector('.vx-hulp-btn')) return;
  const b = el('button', 'cheat-btn vx-hulp-btn', '<span aria-hidden="true">?</span>'); b.type = 'button'; b.dataset.tip = 'hoe werken de knoppen?'; b.setAttribute('aria-label', 'hoe werken de knoppen?'); b.setAttribute('aria-expanded', 'false');
  const panel = el('div', 'cheat vx-hulp', VZ_HULP([...new Set([...card.querySelectorAll('.m5-z')].map(x => x.dataset.knoppen || VZ_KNOPPEN).join(''))].join(''))); panel.hidden = true;
  b.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; b.setAttribute('aria-expanded', String(!panel.hidden)); });
  const rb = head.querySelector('.refresh-btn'); head.insertBefore(b, rb || null); head.after(panel);
}
(function(){ const css = `
  .m4-line:has(> .m5-z){flex-wrap:wrap; row-gap:.5rem}
  .m5-z{flex-basis:100%; flex-direction:column; align-items:flex-start; gap:.45rem; padding-left:1.4rem}
  .vz-box{position:relative; display:inline-block}
  .vz-in, .vz-spiegel{font:inherit; font-size:1.2rem; font-weight:700; letter-spacing:0; padding:.3rem .6rem; white-space:pre; font-variant-numeric:tabular-nums}
  .vz-in{position:relative; z-index:1; min-width:4.5rem; height:2.4rem; border:2px solid var(--border); border-radius:.5rem; background:transparent; color:transparent; caret-color:var(--ink); box-sizing:border-box}
  .vz-in:focus{outline:none; border-color:var(--orange); box-shadow:0 0 0 3px var(--or-soft)}
  .vz-spiegel{position:absolute; left:2px; top:2px; color:var(--ink); pointer-events:none; line-height:calc(2.4rem - 4px); padding-top:0; padding-bottom:0}
  .vz-box{background:var(--card); border-radius:.5rem}
  .vz-rood{color:var(--bad)}
  .m5-z > .vz-regel{align-self:stretch} .m5-z .vx-uit{left:1.2rem; width:min(19rem, 80vw)}   /* uitleg blijft binnen de kolom van de oefening */
  .vz-regel.ok .vz-in{border-color:var(--ok)} .vz-regel.ok .vz-box{background:var(--ok-bg)}
  .vz-regel.bad .vz-in{border-color:var(--bad)} .vz-regel.bad .vz-box{background:var(--bad-bg)}
  .vz-regel.bijna .vz-in{border-color:var(--orange)} .vz-regel.bijna .vz-box{background:var(--or-soft)}
  .vz-regel:not(.actief) .vz-in{border-style:dashed}
  .vx-k.vz-groot .vx-ic{font-size:1.35rem; font-weight:900}
  .vz-abs{display:inline-flex; align-items:center; gap:.1rem; font-weight:900} .vz-abs .vx-hok{margin:0}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* ============================================================
   1A MODULE 5 · GEREEDSCHAP
   - oplosser: een bewerking stap per stap uitrekenen (ZX.stappen), zoals op papier
   - getallen controleren in een gewoon vak of uitkomstvak (chkG)
   - getallenas (asSvg) met sprongen; sprongAs: klik start en landing
   - legertjes met nulparen, som-piramide, thermometer
   - bogen: klik de bewerking die eerst moet, reken uit onder de boog (met de trap van de volgorde)
   ============================================================ */

/* ---------- oplosser ---------- */
/* een 'atoom' is een getal: 5, −5 of (−5) */
ZX.isAt = n => n.t==='n' || (n.t==='neg' && n.a.t==='n') || (n.t==='grp' && n.br!=='|' && (n.a.t==='n' || (n.a.t==='neg' && n.a.a.t==='n')));
/* een bewerking die nu mag: beide kanten zijn al getallen */
ZX.mag = n => (n.t==='bin' && ZX.isAt(n.a) && ZX.isAt(n.b)) || (n.t==='grp' && n.br==='|' && ZX.isAt(n.a)) || (n.t==='neg' && n.a.t==='grp' && ZX.isAt(n.a));
/* alle bewerkingen die nu mogen, van links naar rechts */
ZX.klaar = n => { const L = []; const w = x => { if(!x) return; if(ZX.mag(x)){ L.push(x); return; } if(x.t==='bin'){ w(x.a); w(x.b); } else if(x.a) w(x.a); }; w(n); return L; };
ZX.heeftGrp = n => !!n && ((n.t==='grp' && !ZX.isAt(n)) || (n.a && ZX.heeftGrp(n.a)) || (n.b && ZX.heeftGrp(n.b)));
ZX.heeftOp = (n, ops) => !!n && ((n.t==='bin' && ops.includes(n.op)) || (n.a && ZX.heeftOp(n.a, ops)) || (n.b && ZX.heeftOp(n.b, ops)));
/* doelen (Set van knopen) vervangen door hun waarde; lm = staat links vooraan in een uitdrukking */
ZX.vervang = (n, doel, lm=true) => {
  if(doel.has(n)){ const v = ZX.val(n).k; return v < 0 ? (lm ? {t:'neg', a:{t:'n', v:-v}} : {t:'grp', br:'(', a:{t:'neg', a:{t:'n', v:-v}}}) : {t:'n', v}; }
  if(n.t==='bin') return Object.assign({}, n, {a:ZX.vervang(n.a, doel, lm), b:ZX.vervang(n.b, doel, false)});
  if(n.t==='neg' || n.t==='pos') return Object.assign({}, n, {a:ZX.vervang(n.a, doel, false)});
  if(n.t==='grp'){ const a = ZX.vervang(n.a, doel, true); const g = Object.assign({}, n, {a});
    if(n.br==='|') return g;
    if(a.t==='n') return a;
    if(a.t==='neg' && a.a.t==='n') return lm ? a : {t:'grp', br:'(', a};
    if(n.br==='[' && !ZX.heeftGrp(a)) g.br = '(';
    return g; }
  return n;
};
/* alle tussenstappen als tekst. alles: alle bewerkingen die mogen in één regel (zoals in het handboek) */
ZX.stappen = (s, alles=true) => { let t = ZX.parse(s); if(t.err || t.leeg) return null; const L = [ZX.str(t)];
  for(let k=0; k<40 && !ZX.isAt(t); k++){ const E = ZX.klaar(t); if(!E.length) return null;
    for(const e of (alles ? E : [E[0]])){ const v = ZX.val(e); if(v.err) return null; }
    t = ZX.vervang(t, new Set(alles ? E : [E[0]])); L.push(ZX.str(t)); }
  return L; };
/* trede van de trap: 1 haakjes, 2 maal en deel, 3 plus en min */
ZX.trede = (t, e) => { const inGrp = (x, g) => { if(x===e) return g; for(const c of [x.a, x.b]) if(c){ const r = inGrp(c, g || (x.t==='grp' && x.br!=='|')); if(r!=null) return r; } return null; };
  if(inGrp(t, false)) return 1; return e.t==='bin' && '·:'.includes(e.op) ? 2 : e.t==='bin' ? 3 : 1; };
/* getallen in een opgave (met hun teken) */
ZX.getallen = t => { const L = []; const w = x => { if(!x) return; if(x.t==='n'){ L.push(x.v); return; } if(x.t==='neg' && x.a.t==='n'){ L.push(-x.a.v); return; } if(x.a) w(x.a); if(x.b) w(x.b); }; w(t); return L; };
/* een opgave maken: probeer tot alle tussenuitkomsten klein genoeg zijn en elke deling opgaat */
function maakOpg(R, fn, o={}){ const lim = o.lim || 100; let reserve = null;
  for(let k=0; k<600; k++){ const s = fn(R); const L = ZX.stappen(s); if(!L) continue;
    const ok = L.every(l => ZX.getallen(ZX.parse(l)).every(x => Math.abs(x) <= lim)); const w = ZX.waarde(s).k;
    const een = (x => { const z = n => ZX.isAt(n) && Math.abs(ZX.val(n).k) <= 1; const w2 = n => !!n && ((n.t==='bin' && '·:'.includes(n.op) && (z(n.a) || z(n.b))) || w2(n.a) || w2(n.b)); return w2(x); })(ZX.parse(s));
    if(een && !o.een) continue;   /* geen maal of gedeeld door met 0, 1 of −1 */
    if(!reserve && w!==0) reserve = s;
    if(ok && L.length >= (o.min||2) && (o.nul || w!==0)) return s; }
  return reserve || fn(R); }

/* ---------- een getal controleren ---------- */
/* uitkomstvak {{u:k}} of {{u:k,t}}, of gewoon vak {{g:k}}; haakjes rond een negatief getal mogen */
function rdZ(v){ v = v || {}; let t = nrm(v.t||''); const m = t.match(/^\((.*)\)$/); if(m) t = m[1];
  if(v.s==='-' && !v.z) t = '-' + t.replace(/^\+/, '');
  if(/^[+-]?\d+$/.test(t)) return +t; return null; }
function chkG(v, T, fout){ v = v || {}; const t = nrm(v.t||'');
  if(!t) return {info:true, msg:'Vul het getal in.'};
  if(v.n!=null) return {info:true, msg:'Typ een geheel getal, geen breuk.'};
  if(/[.,]/.test(t)) return {info:true, msg:'Typ een geheel getal, zonder komma.'};
  const x = rdZ(v); if(x==null) return {info:true, msg:'Typ enkel een geheel getal.'};
  if(x===T) return {ok:true};
  for(const [F, m] of (fout||[])) if(x===F) return {ok:false, msg:m};
  if(x===-T) return {ok:false, msg:'Het getal klopt, maar het teken niet.'};
  return {ok:false};
}
/* uitkomstvak met tekenvak: het teken moet gekozen zijn (behalve bij 0) */
function chkGt(v, T, fout){ v = v || {}; const t = nrm(v.t||'');
  if(!t) return {info:true, msg:'Vul het getal in.'};
  if(!v.z && !v.s && t!=='0') return {info:true, msg:'Kies eerst het teken: klik op + of op − in het tekenvak.'};
  if(!v.z && /-/.test(t)) return {info:true, msg:'Het minteken hoort in het tekenvak, niet bij het getal.'};
  return chkG(v, T, fout); }
const chkZG = (v, T, fout) => (v && !v.z) ? chkGt(v, T, fout) : chkG(v, T, fout);

/* ---------- getallenas ---------- */
/* o: {lo, hi, W, sprongen:[{van, naar, lab, cls, nieuw}], punten:[{x, lab, cls}], geen0} */
function asSvg(o){
  const W = o.W || 640, pad = 26, y = o.y || 78, H = o.H || 112;
  const X = v => pad + (v - o.lo)*(W - 2*pad)/(o.hi - o.lo); const st = (W - 2*pad)/(o.hi - o.lo);
  const elke = st >= 22 ? 1 : st >= 11 ? 2 : st >= 5 ? 5 : 10;
  let s = `<line class="as-l" x1="${pad-14}" y1="${y}" x2="${W-pad+12}" y2="${y}"/><path class="as-pk" d="M${W-pad+18} ${y} l-9 -5 v10z"/>` + sT(W-pad+12, y+22, 'ℤ', 'k');
  for(let v=o.lo; v<=o.hi; v++){ const x = fx(X(v)), lang = v % elke===0;
    s += `<line class="as-t${v===0 ? ' nul' : ''}" x1="${x}" y1="${y-(lang ? 7 : 4)}" x2="${x}" y2="${y+(lang ? 7 : 4)}"/>`;
    if(lang) s += sT(x, y+21, zS(v), v===0 ? 't as-0' : 'k'); }
  (o.sprongen||[]).forEach(sp => { const x1 = X(sp.van), x2 = X(sp.naar), h = Math.min(48, 14 + Math.abs(x2-x1)*.22), ym = y - 9 - h;
    const d = `M${fx(x1)} ${y-9} Q${fx((x1+x2)/2)} ${fx(ym)} ${fx(x2)} ${y-9}`;
    const dir = x2 > x1 ? 1 : -1;
    s += `<path class="as-sp ${sp.cls||''}${sp.nieuw ? ' nieuw' : ''}${sp.vl ? ' vl' : ''}" pathLength="1" d="${d}"/>`;
    s += `<path class="as-spk ${sp.cls||''}${sp.nieuw ? ' nieuw' : ''}${sp.vl ? ' vl' : ''}" d="M${fx(x2)} ${y-7} l${-dir*9} -7 l${dir*2} 9z"/>`;
    if(sp.lab) s += sT((x1+x2)/2, ym + h*.5 - 8, sp.lab, 'as-lab ' + (sp.cls||'')); });
  (o.punten||[]).forEach(p => { s += `<circle class="as-p ${p.cls||''}" cx="${fx(X(p.x))}" cy="${y}" r="7"/>`; if(p.lab) s += sT(X(p.x), y-20, p.lab, 'as-lab'); });
  if(o.geest!=null) s += `<circle class="as-p geest" cx="${fx(X(o.geest))}" cy="${y}" r="7"/>`;
  return svgWrap(W, H, s, {alt:o.alt || 'getallenas', maxw:o.maxw || W, cls:'m5-as'});
}
/* van een klik naar een getal op de as */
function asKlik(svg, e, o){ const r = svg.getBoundingClientRect(), W = o.W || 640, pad = 26; const x = (e.clientX - r.left)*W/r.width;
  return Math.max(o.lo, Math.min(o.hi, Math.round(o.lo + (x - pad)*(o.hi - o.lo)/(W - 2*pad)))); }
/* bereik van de as rond een paar getallen, minstens 'min' eenheden breed */
function asBereik(xs, min=14){ let lo = Math.min(0, ...xs) - 2, hi = Math.max(0, ...xs) + 2; while(hi - lo < min){ lo--; if(hi - lo < min) hi++; } return {lo, hi}; }

/* ---------- springen op de getallenas: klik het startgetal, sleep (of klik) naar waar je landt, vul in ---------- */
function sprongAs(host, st, save, id, o){
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {f:0}); const a = o.a, b = o.b, T = a + b;
  const B = asBereik([a, T]); const P = paneel(host);
  const fig = el('div', 'm5-asbox'); P.vis.append(fig);
  const k1 = stapKop(P.stap, 1, ''), k2 = stapKop(P.stap, 2, ''), fb = el('div', 'fb'), k3 = stapKop(P.stap, 3, 'Schrijf de uitkomst'), vak = el('div');
  P.stap.insertBefore(fb, k3); P.stap.append(vak);
  let geest = null, nieuw = false, sleep = false;
  function teken(){
    const sp = s.f>=2 ? [{van:a, naar:T, lab:'+ ' + zP(b), cls:b<0 ? 'neg' : 'pos', nieuw}] : s.f===1 && geest!=null && geest!==a ? [{van:a, naar:geest, lab:'+ ' + zP(geest - a), cls:geest<a ? 'neg' : 'pos', vl:true}] : [];
    const pt = s.f>=1 ? [{x:a, cls:'start'}] : []; if(s.f>=2) pt.push({x:T, cls:'eind'});
    fig.innerHTML = asSvg(Object.assign({}, B, {sprongen:sp, punten:pt, geest:s.f<2 ? geest : null, alt:`getallenas van ${B.lo} tot ${B.hi}`}));
    fig.classList.toggle('sleep', s.f<2); nieuw = false;
    k1.innerHTML = `<span class="m5-sk-n">①</span> Klik op het startgetal <b>${zS(a)}</b>.`; k1.classList.toggle('klaar', s.f>=1);
    k2.innerHTML = `<span class="m5-sk-n">②</span> Je telt <b>${zP(b)}</b> op. Sleep vanaf ${zS(a)} naar waar je landt, of klik erop.`; k2.classList.toggle('uit', s.f<1); k2.classList.toggle('klaar', s.f>=2);
    k3.classList.toggle('uit', s.f<2); }
  const waar = e => asKlik(fig.querySelector('svg'), e, B);
  fig.addEventListener('pointerdown', e => { if(s.f>=2) return; if(s.f===1){ sleep = true; try{ fig.setPointerCapture(e.pointerId); }catch(x){} } geest = waar(e); teken(); });
  fig.addEventListener('pointermove', e => { if(s.f>=2) return; const v = waar(e); if(v!==geest){ geest = v; teken(); } });
  fig.addEventListener('pointerleave', () => { if(sleep) return; geest = null; if(s.f<2) teken(); });
  fig.addEventListener('pointerup', e => { if(s.f>=2) return; sleep = false; const v = waar(e);
    if(s.f===0){ if(v===a){ s.f = 1; fb.className = 'fb'; fb.textContent = ''; } else { fb.className = 'fb bad'; fb.innerHTML = `❌ Je klikte op ${zS(v)}. Zoek ${zS(a)}: ${a<0 ? 'links' : 'rechts'} van 0.`; CLres(qid, false); } }
    else if(s.f===1){ if(v===a){ geest = null; teken(); return; }
      if(v===T){ s.f = 2; nieuw = true; fb.className = 'fb'; fb.textContent = ''; vraag(); }
      else { fb.className = 'fb bad'; fb.innerHTML = v===a - b ? `❌ Je sprong de verkeerde kant op. Een ${b<0 ? 'negatief getal optellen: naar links' : 'positief getal optellen: naar rechts'}.` : `❌ Je landde op ${zS(v)}. Tel ${Math.abs(b)} streepjes vanaf ${zS(a)}.`; CLres(qid, false); } }
    geest = null; save(); teken(); });
  function vraag(){ vak.innerHTML = '';
    mQ(vak, st, save, id + 'u', {noCL:true, html:`${zS(a)} + ${zP(b)} ${isq} {{u:a${o.teken===false ? '' : ',t'}}}`, check:V=>chkZG(V.a, T, [[a - b, 'Kijk naar de sprong op de getallenas.']]),
      onOk:silent=>{ if(!silent){ CLres(qid, true); if(o.onOk) o.onOk(); } } }); }
  teken(); if(s.f>=2) vraag();
}

/* ---------- legertjes: de leerling stelt een min- en een plus-leger op; nulparen vallen weg ---------- */
const LKLEUR = {plus:'#d62828', min:'#1d4ed8'};
const soldSvg = soort => { const c = LKLEUR[soort], sym = soort==='plus' ? `<path d="M12 16.5v6M9 19.5h6" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>` : `<path d="M9 19.5h6" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M6.5 6.5a5.5 5.5 0 0 1 11 0z" fill="${c}"/><circle cx="12" cy="8" r="4" fill="#f2c9a0"/><rect x="5" y="12.5" width="14" height="14" rx="4" fill="${c}"/><circle cx="12" cy="19.5" r="5" fill="#fff"/>${sym}<rect x="7" y="26" width="3.5" height="3.5" rx="1" fill="#35545a"/><rect x="13.5" y="26" width="3.5" height="3.5" rx="1" fill="#35545a"/></svg>`; };
const LNAAM = {min:'➖ Min-leger', plus:'➕ Plus-leger'};
function legertjes(host, st, save, id, o){
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {n:[0, 0], f:0}); const a = o.a, b = o.b, T = a + b, MAX = 25;
  const srt = [a<0 ? 'min' : 'plus', b<0 ? 'min' : 'plus'], doel = [Math.abs(a), Math.abs(b)], samen = srt[0]===srt[1], paren = samen ? 0 : Math.min(doel[0], doel[1]);
  const P = paneel(host); const slag = el('div', 'm5-slag'); P.vis.append(slag);
  stapKop(P.stap, 1, 'Stel je legers op');
  P.stap.append(el('p', 'm5-tip', `${zS(a)} + ${zP(b)}: een positief getal is een plus-leger, een negatief getal een min-leger.`));
  const rijen = el('div', 'm5-lrijen'); const act = el('div', 'q-act'); const knop = el('button', 'btn', samen ? '🤝 Samenvoegen' : '⚔️ Ten aanval'); knop.type = 'button'; act.append(knop);
  const fb = el('div', 'fb'); P.stap.append(rijen, act, fb);
  const k2 = stapKop(P.stap, 2, 'Noteer de uitkomst'); const vak = el('div'); P.stap.append(vak);
  let anim = false;
  function kamp(i){ const n = s.n[i], weg = s.f ? (samen ? 0 : paren) : 0;
    const troep = n ? Array.from({length:n}, (_, j) => `<span class="m5-sd${j<weg ? ' dood' : ''}" data-j="${j}">${soldSvg(srt[i])}</span>`).join('') : '<span class="m5-kleeg">Klik hier om soldaatjes toe te voegen</span>';
    return `<div class="m5-kamp ${srt[i]}${s.f ? '' : ' klik'}" data-k="${i}"><div class="m5-kkop"><span>${LNAAM[srt[i]]}</span><span class="m5-kcnt">${s.f && !samen ? (n - weg) + ' over' : n}</span></div><div class="m5-troep">${troep}</div></div>`; }
  function teken(){
    slag.innerHTML = s.f && samen ? `<div class="m5-kamp ${srt[0]} breed"><div class="m5-kkop"><span>${LNAAM[srt[0]]} (samengevoegd)</span><span class="m5-kcnt">${s.n[0] + s.n[1]}</span></div><div class="m5-troep">${Array.from({length:s.n[0] + s.n[1]}, () => `<span class="m5-sd">${soldSvg(srt[0])}</span>`).join('')}</div></div>`
      : `${kamp(0)}<div class="m5-vs">${samen ? '🤝' : '⚔️'}</div>${kamp(1)}`;
    rijen.innerHTML = [0, 1].map(i => `<div class="m5-lrij ${srt[i]}"><span class="m5-lnaam">${LNAAM[srt[i]]}</span><span class="m5-lcnt">${s.n[i]}</span><button type="button" class="btn sm-btn" data-k="${i}" data-d="1"${s.f || s.n[i]>=MAX ? ' disabled' : ''}>1 erbij</button><button type="button" class="btn sm-btn" data-k="${i}" data-d="5"${s.f || s.n[i]>MAX - 5 ? ' disabled' : ''}>5 erbij</button><button type="button" class="btn sm-btn ghost" data-k="${i}" data-d="-1"${s.f || !s.n[i] ? ' disabled' : ''}>1 weg</button></div>`).join('');
    knop.hidden = !!s.f; knop.disabled = anim; k2.classList.toggle('uit', !s.f);
    rijen.querySelectorAll('button').forEach(x => x.addEventListener('click', () => wijzig(+x.dataset.k, +x.dataset.d)));
    if(!s.f && !anim) slag.querySelectorAll('.m5-kamp.klik').forEach(k => k.addEventListener('click', e => wijzig(+k.dataset.k, e.target.closest('.m5-sd') ? -1 : 1))); }
  function wijzig(i, d){ if(s.f || anim) return; s.n[i] = Math.max(0, Math.min(MAX, s.n[i] + d)); fb.className = 'fb'; fb.textContent = ''; save(); teken(); }
  knop.addEventListener('click', () => {
    const fout = [0, 1].find(i => s.n[i]!==doel[i]);
    if(fout!=null){ const x = fout ? b : a; fb.className = 'fb bad'; fb.innerHTML = `❌ Het ${srt[fout]}-leger hoort bij <b>${zS(x)}</b>: zet er ${Math.abs(x)} soldaatjes in.`; CLres(qid, false); return; }
    fb.className = 'fb'; fb.textContent = '';
    const klaar = () => { anim = false; s.f = 1; save(); teken(); toonVraag(); };
    if(samen || REDUCED_M || !paren){ klaar(); return; }
    anim = true; knop.disabled = true; slag.querySelector('.m5-vs').classList.add('vecht');
    const s0 = slag.querySelectorAll('.m5-kamp[data-k="0"] .m5-sd'), s1 = slag.querySelectorAll('.m5-kamp[data-k="1"] .m5-sd'), stap = Math.max(60, Math.min(160, 1400/paren));
    for(let j=0; j<paren; j++) setTimeout(() => { s0[j] && s0[j].classList.add('raak'); s1[j] && s1[j].classList.add('raak'); }, j*stap);
    setTimeout(klaar, paren*stap + 500); });
  function toonVraag(){ if(vak.firstChild) return;
    P.stap.insertBefore(el('p', 'm5-tip', samen ? `Zelfde teken: de legers voegen samen. Er zijn ${s.n[0] + s.n[1]} ${srt[0]}-soldaatjes.` : T ? `${paren} ${paren===1 ? 'nulpaar valt' : 'nulparen vallen'} weg. Er ${Math.abs(T)===1 ? 'blijft' : 'blijven'} ${Math.abs(T)} ${T<0 ? 'min' : 'plus'}-soldaatje${Math.abs(T)===1 ? '' : 's'} over.` : 'Alle soldaatjes vormen nulparen. Er blijft niets over.'), vak);
    mQ(vak, st, save, id + 'u', {noCL:true, html:`${zS(a)} + ${zP(b)} ${isq} {{u:a${o.teken===false ? '' : ',t'}}}`, check:V=>chkZG(V.a, T),
      onOk:silent=>{ if(!silent){ CLres(qid, true); if(o.onOk) o.onOk(); } } }); }
  teken(); if(s.f) toonVraag();
}

/* ---------- piramide: elk vak is de som (of het product) van de twee vakken eronder; de leerling typt elk getal, met een minteken als het negatief is ---------- */
/* basis: getallen onderaan; open: indexen (rij*10 + kolom, rij 0 = onderaan) die de leerling invult; o.op: '+' of '·' */
function piramide(host, st, save, id, o){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {v:{}}); const n = o.basis.length; const W = [o.basis.slice()]; const maal = o.op==='·';
  for(let r=1; r<n; r++){ W[r] = []; for(let c=0; c<n-r; c++) W[r][c] = maal ? W[r-1][c]*W[r-1][c+1] : W[r-1][c] + W[r-1][c+1]; }
  const box = el('div', 'q m5-pir'); host.append(box); if(o.nr) box.append(el('span', 'q-num', o.nr));
  const pir = el('div', 'm5-pir-in'); box.append(pir); const vak = {};
  for(let r=n-1; r>=0; r--){ const rij = el('div', 'm5-pir-rij');
    for(let c=0; c<n-r; c++){ const k = r*10 + c;
      if(o.open.includes(k)){ if(typeof s.v[k]!=='object' || !s.v[k]) s.v[k] = {s:'', t:''}; const v = s.v[k];
        const steen = el('span', 'm5-steen open');
        const i = el('input', 'inp m5-pir-v'); i.type = 'text'; i.autocomplete = 'off'; i.value = v.t || ''; i.setAttribute('aria-label', `rij ${r+1} van onder, vak ${c+1}`);
        i.addEventListener('input', ()=>{ v.t = i.value; save(); steen.classList.remove('ok', 'bad'); }); i.addEventListener('keydown', e=>{ if(e.key==='Enter' && !quiz) run(); });
        steen.append(i); vak[k] = {steen, v, i}; rij.append(steen); }
      else rij.append(el('span', 'm5-steen vast', zS(W[r][c]))); }
    pir.append(rij); }
  const act = el('div', 'q-act'); const btn = el('button', 'btn', 'Controleer'); btn.type = 'button'; act.append(btn); box.append(act); const fb = el('div', 'fb'); box.append(fb);
  const lees = v => rdZ({t:v.t, z:true});
  const goed = k => lees(vak[k].v)===W[Math.floor(k/10)][k%10];
  function run(silent){ const ks = Object.keys(vak);
    if(ks.some(k => !nrm(vak[k].v.t||''))){ if(!silent){ fb.className = 'fb info'; fb.textContent = 'Vul eerst alle stenen in.'; } return; }
    if(ks.some(k => lees(vak[k].v)==null)){ if(!silent){ fb.className = 'fb info'; fb.textContent = 'Typ in elke steen een geheel getal, met een minteken als het negatief is.'; } return; }
    let fout = 0; ks.forEach(k => { const g = goed(+k); if(!g) fout++; vak[k].steen.classList.remove('ok', 'bad'); vak[k].steen.classList.add(g ? 'ok' : 'bad'); });
    fb.className = 'fb ' + (fout ? 'bad' : 'ok'); fb.innerHTML = fout ? `❌ ${fout===1 ? 'Eén steen klopt' : fout + ' stenen kloppen'} nog niet. ${o.whyBad || (maal ? 'Elk vak is het product van de twee vakken eronder.' : 'Elk vak is de som van de twee vakken eronder.')}` : '';
    if(!fout){ fb.className = 'fb'; fb.innerHTML = ''; if(!box.querySelector('.m5-juist')) allesJuist(box, o.why || (maal ? 'Elk vak is het product van de twee vakken eronder.' : 'Elk vak is de som van de twee vakken eronder.')); }
    s.checked = true; save(); if(!silent && !quiz) CLres(qid, !fout); }
  btn.addEventListener('click', ()=>run());
  if(quiz){ btn.hidden = true; quiz.push({pts:o.pts||1, grade:()=>Object.keys(vak).every(k => goed(+k)), reveal:()=>run(true), lock:()=>Object.values(vak).forEach(x => { x.i.readOnly = true; x.steen.querySelectorAll('button').forEach(b => b.disabled = true); })}); }
  else if(s.checked) run(true);
}

/* ---------- twee thermometers: voor (vast) en na (sleep het kwik) ---------- */
const THT = {top:46, bot:286};
function thermoPaar(o){ /* o: {lo, hi, t1, t2 (stand rechts of null), voor:[icoon, uur], na:[icoon, uur], vl (voorlopig)} */
  const Y = t => THT.bot - (t - o.lo)*(THT.bot - THT.top)/(o.hi - o.lo);
  const schaal = cx => { let h = `<rect class="th-buis" x="${cx-12}" y="${THT.top-12}" width="24" height="${THT.bot-THT.top+26}" rx="12"/>`;
    for(let t=o.lo; t<=o.hi; t++){ const v = t % 5===0, y = fx(Y(t)); h += `<line class="th-t${t===0 ? ' nul' : ''}" x1="${cx+14}" y1="${y}" x2="${cx+14+(v ? 12 : 6)}" y2="${y}"/>`; if(v) h += sT(cx+46, y, zS(t) + '°', t===0 ? 'th-lab nul' : 'th-lab'); }
    return h; };
  const kwik = (cx, t) => `<rect class="th-kwik" x="${cx-5}" y="${fx(Y(t))}" width="10" height="${fx(THT.bot + 12 - Y(t))}" rx="5"/><circle class="th-kwik" cx="${cx}" cy="${THT.bot+26}" r="19"/><circle class="th-bolr" cx="${cx}" cy="${THT.bot+26}" r="19"/>`;
  const tag = (cx, t, links) => { const x = links ? cx - 92 : cx + 60, y = Y(t); return `<rect class="th-tag" x="${x}" y="${fx(y-13)}" width="64" height="26" rx="8"/>` + sT(x + 32, y, zS(t) + ' °C', 'th-tagt'); };
  const c1 = 120, c2 = 330; const t2 = o.t2==null ? o.t1 : o.t2;
  let h = sT(c1, 18, `${o.voor[0]} ${o.voor[1]}`, 'th-titel') + schaal(c1) + kwik(c1, o.t1) + tag(c1, o.t1, true);
  h += sT(c2, 18, `${o.na[0]} ${o.na[1]}`, 'th-titel') + schaal(c2) + kwik(c2, t2);
  h += `<line class="th-start" x1="${c2-64}" y1="${fx(Y(o.t1))}" x2="${c2+12}" y2="${fx(Y(o.t1))}"/>`;
  if(o.t2!=null && o.t2!==o.t1){ const x = c2 - 56, y1 = Y(o.t1), y2 = Y(o.t2), op = o.t2 > o.t1;
    h += `<line class="th-pijl${o.vl ? ' vl' : ''}" x1="${x}" y1="${fx(y1)}" x2="${x}" y2="${fx(op ? y2 + 9 : y2 - 9)}"/><path class="th-pijlk" d="M${x-7} ${fx(op ? y2 + 11 : y2 - 11)} L${x} ${fx(y2)} L${x+7} ${fx(op ? y2 + 11 : y2 - 11)}z"/>`;
    h += sT(x - 8, (y1 + y2)/2, (op ? '+' : MIN) + Math.abs(o.t2 - o.t1), 'th-sprong', 'end'); }
  if(o.t2!=null && !o.vl) h += tag(c2, o.t2, false);
  h += `<rect class="th-raak" x="${c2-70}" y="${THT.top-24}" width="150" height="${THT.bot-THT.top+70}"/>`;
  return `<svg class="mf m5-th2" viewBox="0 0 470 330" role="img" aria-label="twee thermometers: ${o.voor[1]} ${zS(o.t1)} °C">${h}</svg>`;
}
function thermoSleep(box, o, zet){ /* zet(t, los): tijdens het slepen los=false, bij loslaten los=true */
  const svg = () => box.querySelector('svg');
  const temp = e => { const s = svg(), pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const y = pt.matrixTransform(s.getScreenCTM().inverse()).y;
    return Math.max(o.lo, Math.min(o.hi, Math.round(o.lo + (THT.bot - y)*(o.hi - o.lo)/(THT.bot - THT.top)))); };
  let sl = false;
  box.addEventListener('pointerdown', e => { if(!e.target.closest('.th-raak')) return; sl = true; try{ box.setPointerCapture(e.pointerId); }catch(x){} zet(temp(e), false); });
  box.addEventListener('pointermove', e => { if(sl) zet(temp(e), false); else if(e.target.closest('.th-raak')) zet(temp(e), null); });
  box.addEventListener('pointerup', e => { if(!sl) return; sl = false; zet(temp(e), true); });
  box.addEventListener('pointerleave', () => { if(!sl) zet(null, null); });
}

/* ---------- hoogte: lift in een gebouw of duiker in de zee; klik of sleep naar de nieuwe plaats ---------- */
function hoogteSvg(o){ /* o: {scene:'lift'|'zee', lo, hi, pos, geest, naam} */
  if(o.scene==='lift'){ const fh = 26, top = 16, bx = 96, bw = 220, Y = f => top + (o.hi - f)*fh, Hh = Y(o.lo - 1) + 10;
    let h = `<rect x="0" y="0" width="360" height="${Y(-1)}" fill="#eef9f9"/><rect x="0" y="${Y(-1)}" width="360" height="${Hh - Y(-1)}" fill="#efe7da"/>`;
    for(let f=o.hi; f>=o.lo; f--){ const ond = f<0;
      h += `<rect class="hg-r" data-v="${f}" x="${bx}" y="${Y(f)}" width="${bw}" height="${fh}" fill="${ond ? '#ddd2c1' : '#ffffff'}" stroke="#9fb3b6"/>`;
      h += `<text x="${bx-10}" y="${Y(f)+17}" text-anchor="end" font-size="14" font-weight="${f===0 ? 900 : 600}" fill="#173436">${zS(f)}</text>`;
      if(!ond) for(let w=0; w<4; w++) h += `<rect x="${bx+76+w*34}" y="${Y(f)+7}" width="20" height="12" rx="2" fill="#c4ebec"/>`;
      else h += `<text x="${bx+150}" y="${Y(f)+18}" text-anchor="middle" font-size="13" font-weight="700" fill="#7a6a55">P${-f}</text>`; }
    h += `<rect x="${bx+8}" y="${Y(o.hi)}" width="40" height="${Y(o.lo - 1) - Y(o.hi)}" fill="#e6eef0" stroke="#9fb3b6"/>`;
    h += `<line x1="0" y1="${Y(-1)}" x2="360" y2="${Y(-1)}" stroke="#5a8a3a" stroke-width="4"/><text x="352" y="${Y(-1)-6}" font-size="11" fill="#3f6b28" font-weight="700" text-anchor="end">straat</text>`;
    const kabine = (f, cls) => `<g class="${cls}"><rect x="${bx+11}" y="${Y(f)+2}" width="34" height="${fh-4}" rx="3"/><text x="${bx+28}" y="${Y(f)+18}" text-anchor="middle" font-size="13">🧍</text></g>`;
    if(o.geest!=null && o.geest!==o.pos) h += kabine(o.geest, 'hg-geest');
    h += kabine(o.pos, 'hg-kab');
    h += `<text x="${bx-36}" y="10" font-size="12" font-weight="800" fill="#173436">verdieping</text>`;
    return `<svg class="mf m5-hg" viewBox="0 0 360 ${Hh}" role="img" aria-label="gebouw met lift, de lift staat op verdieping ${zS(o.pos)}">${h}</svg>`; }
  const top = 20, st = 9, Y = m => top + (o.hi - m)*st, Hh = Y(o.lo) + 22, x0 = 70;
  let h = `<defs><linearGradient id="m5zee" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd3e6"/><stop offset="1" stop-color="#0d4f72"/></linearGradient></defs>`;
  h += `<rect x="0" y="0" width="360" height="${Y(0)}" fill="#e8f6fb"/><rect x="0" y="${Y(0)}" width="360" height="${Hh - Y(0)}" fill="url(#m5zee)"/>`;
  h += `<path d="M0 ${Y(0)} q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#2a8fb0" stroke-width="2"/>`;
  h += `<line x1="${x0}" y1="${Y(o.hi)}" x2="${x0}" y2="${Y(o.lo)}" stroke="#173436" stroke-width="2"/>`;
  for(let m=o.lo; m<=o.hi; m++){ const v = m % 5===0; h += `<line x1="${x0-(v ? 8 : 4)}" y1="${Y(m)}" x2="${x0}" y2="${Y(m)}" stroke="#173436" stroke-width="${m===0 ? 3 : 1.4}"/>`;
    if(v) h += `<text x="${x0-12}" y="${Y(m)+4}" text-anchor="end" font-size="12" font-weight="${m===0 ? 900 : 600}" fill="${m<-12 ? '#ffffff' : '#173436'}">${zS(m)} m</text>`; }
  h += `<rect class="hg-zone" x="${x0}" y="${Y(o.hi)}" width="${290}" height="${Y(o.lo) - Y(o.hi)}" fill="transparent"/>`;
  h += `<text x="250" y="${Y(0)-2}" font-size="26" text-anchor="middle">⛵</text>`;
  (o.extra||[]).forEach(([ic, m]) => { h += `<text x="300" y="${Y(m)+8}" font-size="22" text-anchor="middle">${ic}</text>`; });
  const duiker = (m, cls) => `<g class="${cls}"><line x1="${x0}" y1="${Y(m)}" x2="${x0+60}" y2="${Y(m)}" stroke-dasharray="4 3" stroke="#173436"/><text x="${x0+80}" y="${Y(m)+9}" font-size="24" text-anchor="middle">🤿</text><text x="${x0+104}" y="${Y(m)+5}" font-size="13" font-weight="800" fill="${m<-12 ? '#ffffff' : '#173436'}">${zS(m)} m</text></g>`;
  if(o.geest!=null && o.geest!==o.pos) h += duiker(o.geest, 'hg-geest');
  h += duiker(o.pos, 'hg-kab');
  return `<svg class="mf m5-hg" viewBox="0 0 360 ${Hh}" role="img" aria-label="zee met duiker op ${zS(o.pos)} m">${h}</svg>`;
}
function hoogteWaar(svg, e, o){ const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const y = pt.matrixTransform(svg.getScreenCTM().inverse()).y;
  const v = o.scene==='lift' ? Math.floor(o.hi - (y - 16)/26 + 1) : Math.round(o.hi - (y - 20)/9); return Math.max(o.lo, Math.min(o.hi, v)); }

/* ---------- een verandering: ① beeld bijwerken (thermometer, lift, duiker), ② bewerking schrijven ---------- */
/* o: {soort:'thermo'|'lift'|'zee', van, d, tekst, lo, hi, voor, na, extra, eenheid, onOk} */
function verander(host, st, save, id, o){
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {f:0}); const T = o.van + o.d;
  const P = paneel(host); const fig = el('div', 'm5-vfig'); P.vis.append(fig);
  P.stap.append(el('p', 'm5-vtekst', o.tekst));
  const k1 = stapKop(P.stap, 1, o.soort==='thermo' ? 'Sleep het kwik van de rechtse thermometer naar de nieuwe temperatuur.' : o.soort==='lift' ? 'Klik op de verdieping waar de lift stopt, of sleep de lift.' : 'Klik op de diepte waar de duiker nu zwemt, of sleep hem.');
  const fb = el('div', 'fb'); P.stap.append(fb);
  const k2 = stapKop(P.stap, 2, 'Schrijf de bewerking en de uitkomst'); const vak = el('div'); P.stap.append(vak);
  let geest = null;
  function teken(){
    if(o.soort==='thermo') fig.innerHTML = thermoPaar({lo:o.lo, hi:o.hi, t1:o.van, t2:s.f ? T : geest, vl:!s.f && geest!=null, voor:o.voor, na:o.na});
    else fig.innerHTML = hoogteSvg({scene:o.soort, lo:o.lo, hi:o.hi, pos:s.f ? T : o.van, geest:s.f ? null : geest, extra:o.extra});
    fig.classList.toggle('sleep', !s.f); k1.classList.toggle('klaar', !!s.f); k2.classList.toggle('uit', !s.f); }
  function los(v){ if(s.f || v==null) return;
    if(v===T){ s.f = 1; fb.className = 'fb'; fb.textContent = ''; save(); teken(); vraag(); return; }
    if(v===o.van){ return; }
    const meer = o.soort==='thermo' ? (o.d>0 ? 'warmer' : 'kouder') : (o.d>0 ? 'hoger' : 'lager');
    fb.className = 'fb bad'; fb.innerHTML = (Math.sign(v - o.van)!==Math.sign(o.d) ? `❌ Verkeerde richting: het wordt <b>${meer}</b>.` : `❌ Bijna. Het verschil met ${zS(o.van)} moet ${Math.abs(o.d)} zijn, niet ${Math.abs(v - o.van)}.`); CLres(qid, false); }
  if(o.soort==='thermo') thermoSleep(fig, o, (t, klaar) => { if(s.f) return; if(klaar===true){ geest = null; los(t); teken(); return; } geest = t; teken(); });
  else { let sl = false; const opt = {scene:o.soort, lo:o.lo, hi:o.hi};
    fig.addEventListener('pointerdown', e => { if(s.f) return; sl = true; try{ fig.setPointerCapture(e.pointerId); }catch(x){} geest = hoogteWaar(fig.querySelector('svg'), e, opt); teken(); });
    fig.addEventListener('pointermove', e => { if(s.f) return; const v = hoogteWaar(fig.querySelector('svg'), e, opt); if(v!==geest){ geest = v; teken(); } });
    fig.addEventListener('pointerup', e => { if(s.f || !sl) return; sl = false; const v = hoogteWaar(fig.querySelector('svg'), e, opt); geest = null; los(v); teken(); });
    fig.addEventListener('pointerleave', () => { if(sl || s.f) return; geest = null; teken(); }); }
  function vraag(){ if(vak.firstChild) return;
    mQ(vak, st, save, id + 'b', {noCL:true, html:`${zS(o.van)} + <span class="m4-par">(</span>{{g:d}}<span class="m4-par">)</span> ${isq} {{u:r}}${o.eenheid ? ` <span class="txt">${o.eenheid}</span>` : ''}`,
      check:V=>allOf([['d', chkG(V.d, o.d, [[-o.d, o.d<0 ? 'Een daling of een stap naar beneden is een negatief getal.' : 'Een stijging of een stap naar boven is een positief getal.']])], ['r', chkG(V.r, T)]]),
      onOk:silent=>{ if(!silent){ CLres(qid, true); if(o.onOk) o.onOk(); } } }); }
  teken(); if(s.f) vraag();
}

/* ---------- bogen: welke bewerking eerst? ---------- */
/* kleur per soort zoals in rekenvaardigheid 7: haakjes paars, (machten oranje), maal en deel blauw, plus en min rood */
const LV = ['', 'lv1', 'lv3', 'lv4'];
const BALK = [['Haakjes', 'wat tussen haakjes staat'], ['Maal en deel', 'van links naar rechts'], ['Plus en min', 'van links naar rechts']];
const balkHTML = nu => `<div class="m5-balk"><span class="m5-balk-k">Stappenplan</span>${BALK.map(([k, u], i) => `<span class="m5-bs ${LV[i+1]}${i+1===nu ? ' aan' : ''}"><b>${'①②③'[i]} ${k}</b> <small>${u}</small></span>`).join('<span class="m5-bpijl">→</span>')}</div>`;
/* oud trap-paneel blijft bestaan voor de spiekbriefjes en Toon mij hoe */
const TRAP_TXT = [['haakjes', 'eerst wat tussen haakjes staat'], ['· en :', 'maal en gedeeld door, van links naar rechts'], ['+ en −', 'plus en min, van links naar rechts']];
function trapHTML(nu){ return `<div class="m5-trap"><b>Trap van de volgorde</b>${TRAP_TXT.map(([k, u], i) => `<div class="m5-trede${i+1===nu ? ' aan' : ''}"><span class="m5-tr-n">${i+1}</span><span><b>${k}</b><br><small>${u}</small></span></div>`).join('')}</div>`; }
/* een tekenpaar: + (−5) of − (−5) */
const isTP = x => x.t==='bin' && '+−'.includes(x.op) && x.b.t==='grp' && x.b.br==='(' && x.b.a.t==='neg' && x.b.a.a.t==='n';
const heeftTP = x => !!x && (isTP(x) || heeftTP(x.a) || heeftTP(x.b));
/* boom naar html; klik: bewerkingstekens worden knoppen; sel: [{i, v}] bogen met uitkomst (v null: invulvak) */
function bogHTML(t, o={}){ const K = []; const idx = new Map();
  const w = x => { if(x.t==='bin' || (x.t==='grp' && x.br==='|') || (x.t==='neg' && x.a.t==='grp')){ idx.set(x, K.length); K.push(x); } if(x.a) w(x.a); if(x.b) w(x.b); }; w(t);
  const sel = new Map((o.sel||[]).map(x => [x.i, x]));
  const r = x => {
    let h;
    if(x.t==='n') h = dz(x.v);
    else if(x.t==='l') h = `<i>${x.v}</i>`;
    else if(x.t==='neg') h = MIN + r(x.a);
    else if(x.t==='pos') h = '+' + r(x.a);
    else if(x.t==='grp'){ const [a, c] = x.br==='[' ? ['[', ']'] : x.br==='|' ? ['|', '|'] : ['(', ')']; h = a + r(x.a) + c; }
    else { const i = idx.get(x); const op = x.op;
      if(o.klik && isTP(x)) h = `${r(x.a)} <button type="button" class="bg-tp" data-tp="${i}" aria-label="tekenpaar ${op} (${MIN}"><span>${op}</span><span>(${MIN}</span></button>${dz(x.b.a.a.v)})`;
      else h = `${r(x.a)} ${o.klik ? `<button type="button" class="bg-op" data-i="${i}" aria-label="bewerking ${esc(ZX.str(x))}">${op}</button>` : `<span class="bg-o">${op}</span>`} ${r(x.b)}`; }
    if(idx.has(x)){ const i = idx.get(x); const s = sel.get(i); const lv = s ? LV[ZX.trede(t, x)] : '';
      h = `<span class="bg-s${s ? ' u ' + lv : ''}${o.rood===i ? ' rd' : ''}" data-i="${i}">${h}${s ? `<span class="bg-arc"></span><span class="bg-ub">${s.v!=null ? zS(s.v) : `<input type="text" class="inp bg-in" data-i="${i}" inputmode="numeric" autocomplete="off" aria-label="uitkomst van ${esc(ZX.str(x))}">`}</span>` : ''}</span>`; }
    return h; };
  return {html:r(t), K}; }
/* diagnose van een verkeerde keuze */
function bogFout(t, N){
  const E = ZX.klaar(t), minT = Math.min(...E.map(e => ZX.trede(t, e))), inN = ZX.klaar(N);
  const isMD = e => e.t==='bin' && '·:'.includes(e.op), isPM = N.t==='bin' && '+−'.includes(N.op);
  if(minT===1 && ZX.trede(t, N)!==1){ const g = E.find(e => ZX.trede(t, e)===1); return {code:'V2', msg:`eerst wat tussen haakjes staat: <b>${zT(ZX.str(g))}</b> komt eerst.`}; }
  if(isPM && (ZX.heeftOp(N, '·:') || minT===2)){ const m = inN.find(isMD) || E.find(isMD) || inN[0] || E[0]; return {code:'V1', msg:`eerst maal en gedeeld door, pas daarna plus en min: <b>${zT(ZX.str(m))}</b> komt eerst.`}; }
  const eerst = inN[0] || E.find(e => ZX.trede(t, e)===minT);
  return {code:'V3', msg:`${isPM ? 'plus en min' : 'maal en gedeeld door'} reken je van links naar rechts: <b>${zT(ZX.str(eerst))}</b> komt eerst.`};
}
function bogen(host, st, save, id, o){
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {L:[o.opg], d:[], sel:[], f:0}); if(!Array.isArray(s.sel)) s.sel = s.sel==null ? [] : [s.sel]; if(!s.iv) s.iv = {};
  const P = paneel(host, 'breed-l'); const balk = el('div'); const blad = el('div', 'm5-blad'); P.vis.append(balk, blad);
  const k1 = stapKop(P.stap, 1, 'Klik op de bewerking die eerst moet. Staan er bewerkingen los van elkaar, dan mag je er meerdere aanklikken.');
  const tpTip = el('p', 'm5-tip', `Staat er + (${MIN}…) of ${MIN} (${MIN}…)? Klik eerst op dat <b>tekenpaar</b>: + (${MIN}5) wordt ${MIN} 5 en ${MIN} (${MIN}5) wordt + 5.`); P.stap.append(tpTip);
  const k2 = stapKop(P.stap, 2, 'Typ onder elke boog de uitkomst en ga naar de volgende regel.');
  const act = el('div', 'q-act'); const verder = el('button', 'btn', '↓ Volgende regel'); verder.type = 'button'; const terug = el('button', 'btn ghost', '↶ Regel terug'); terug.type = 'button'; act.append(verder, terug);
  const fb = el('div', 'fb'); P.stap.append(act, fb);
  let rood = null;
  const huidig = () => ZX.parse(s.L[s.L.length-1]);
  function draw(focus){
    blad.innerHTML = ''; const t = huidig(); const H = bogHTML(t);
    s.L.forEach((L, li) => { const tt = ZX.parse(L); const nu = li===s.L.length-1;
      const regel = el('div', 'm5-bog-regel' + (nu ? ' nu' : ''));
      regel.append(el('span', 'm5-bog-is', li ? '=' : ''));
      const d = s.d[li]; const klik = nu && !s.sel.length && !ZX.isAt(tt);
      const HH = bogHTML(tt, {klik, sel: d && d.sel ? d.sel : nu ? s.sel.map(i => ({i, v:null})) : null, rood: nu ? rood : null});
      const ex = el('span', 'm5-bog-ex', HH.html); regel.append(ex);
      if(!nu || ZX.isAt(tt)) regel.append(el('span', 'm5-bog-v', '✓'));
      blad.append(regel);
      if(nu){
        ex.querySelectorAll('.bg-op').forEach(b => { const sp = b.closest('.bg-s');
          ['mouseenter', 'focus'].forEach(ev => b.addEventListener(ev, ()=>sp.classList.add('hov'))); ['mouseleave', 'blur'].forEach(ev => b.addEventListener(ev, ()=>sp.classList.remove('hov')));
          b.addEventListener('click', ()=>kies(tt, HH.K, +b.dataset.i)); });
        ex.querySelectorAll('.bg-tp').forEach(b => b.addEventListener('click', ()=>tekenpaar(tt, HH.K[+b.dataset.tp])));
        const ins = [...ex.querySelectorAll('.bg-in')];
        ins.forEach(inp => { inp.value = s.iv[inp.dataset.i] || ''; inp.addEventListener('input', ()=>{ s.iv[inp.dataset.i] = inp.value; inp.classList.remove('bad'); save(); });
          inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); const j = ins.indexOf(inp); if(j < ins.length-1 && !ins[j+1].value) ins[j+1].focus(); else volgende(); } }); });
        if(focus && ins.length) ins[ins.length-1].focus({preventScroll:true});
        /* nog een losse bewerking aanklikken terwijl er al één gekozen is */
        if(s.sel.length && !ZX.isAt(tt)){ const E = ZX.klaar(tt), minT = Math.min(...E.map(e => ZX.trede(tt, e)));
          ex.querySelectorAll('.bg-s:not(.u)').forEach(sp => { const N = HH.K[+sp.dataset.i]; if(!N || !E.includes(N) || ZX.trede(tt, N)!==minT || isTP(N)) return;
            const opEl = [...sp.childNodes].find(c => c.nodeType===1 && c.classList.contains('bg-o')); if(!opEl) return;
            const b = el('button', 'bg-op', opEl.textContent); b.type = 'button'; b.setAttribute('aria-label', 'ook deze bewerking'); opEl.replaceWith(b); b.addEventListener('click', ()=>kies(tt, HH.K, +sp.dataset.i)); }); }
        if(ZX.isAt(tt)) klaar(tt); }
    });
    const E = ZX.klaar(t);
    balk.innerHTML = balkHTML(ZX.isAt(t) ? 0 : s.sel.length ? ZX.trede(t, H.K[s.sel[0]]) : E.length ? Math.min(...E.map(e => ZX.trede(t, e))) : 0);
    const af = ZX.isAt(t);
    k1.classList.toggle('klaar', af || !!s.sel.length); k2.classList.toggle('uit', !s.sel.length && !af); k2.classList.toggle('klaar', af);
    tpTip.hidden = af || !heeftTP(t);
    verder.hidden = !s.sel.length; terug.hidden = s.L.length<2 && !s.sel.length; act.hidden = verder.hidden && terug.hidden;
  }
  function kies(t, K, i){ const N = K[i]; const E = ZX.klaar(t), minT = Math.min(...E.map(e => ZX.trede(t, e)));
    if(s.sel.includes(i)){ s.sel = s.sel.filter(x => x!==i); delete s.iv[i]; save(); draw(false); return; }
    if(ZX.mag(N) && ZX.trede(t, N)===minT){ s.sel.push(i); rood = null; fb.className = 'fb'; fb.textContent = ''; save(); draw(true); return; }
    const d = bogFout(t, N); rood = i; s.f++; save(); fb.className = 'fb bad'; fb.innerHTML = `❌ <b>${d.code}</b> · ${d.msg}`; CLres(qid, false); draw(false); }
  function tekenpaar(t, N){
    const vv = (x) => x===N ? {t:'bin', op:N.op==='+' ? '−' : '+', a:N.a, b:{t:'n', v:N.b.a.a.v}} : x.t==='bin' ? Object.assign({}, x, {a:vv(x.a), b:vv(x.b)}) : x.a ? Object.assign({}, x, {a:vv(x.a)}) : x;
    s.d[s.L.length-1] = {tp:true}; s.L.push(ZX.str(vv(t))); s.sel = []; s.iv = {}; rood = null; fb.className = 'fb'; fb.textContent = ''; save(); draw(false); }
  function volgende(){ const t = huidig(); const K = bogHTML(t).K; const ins = [...blad.querySelectorAll('.m5-bog-regel.nu .bg-in')];
    let leeg = false, fout = null;
    ins.forEach(inp => { const N = K[+inp.dataset.i]; const x = rdZ({t:inp.value, z:true}); const T = ZX.val(N).k;
      if(x==null){ leeg = true; return; } if(x!==T){ inp.classList.add('bad'); if(!fout) fout = {N, x, T}; } });
    if(leeg){ fb.className = 'fb info'; fb.textContent = 'Typ onder elke boog een geheel getal.'; return; }
    if(fout){ s.f++; save(); fb.className = 'fb bad'; fb.innerHTML = fout.x===-fout.T ? `❌ ${zT(ZX.str(fout.N))}: het getal klopt, maar het teken niet.` : `❌ ${zT(ZX.str(fout.N))} is niet ${zS(fout.x)}. Reken nog eens.`; CLres(qid, false); return; }
    const Ns = s.sel.map(i => K[i]);
    s.d[s.L.length-1] = {sel:s.sel.map(i => ({i, v:ZX.val(K[i]).k}))}; s.L.push(ZX.str(ZX.vervang(t, new Set(Ns)))); s.sel = []; s.iv = {}; fb.className = 'fb'; fb.textContent = ''; save(); draw(false); }
  function klaar(t){ fb.className = 'fb ok'; fb.innerHTML = `✅ Klaar! De uitkomst is <b>${zS(ZX.val(t).k)}</b>.` + (s.f ? '' : ' Alles in één keer juist.');
    if(!s.ok){ s.ok = true; save(); CLres(qid, true); if(o.onOk) setTimeout(o.onOk, 900); } }
  verder.addEventListener('click', volgende);
  terug.addEventListener('click', ()=>{ if(s.sel.length){ s.sel = []; s.iv = {}; } else if(s.L.length>1){ s.L.pop(); s.d.length = s.L.length-1; s.ok = false; } rood = null; fb.className = 'fb'; fb.textContent = ''; save(); draw(false); });
  draw(false);
}

/* ---------- uitwerking als html (oplossing, toon mij hoe) ---------- */
const uitwH = (L) => `<div class="m5-uitw">${L.map((l, i) => `<div>${i ? '= ' : ''}${zT(l)}</div>`).join('')}</div>`;
/* wat gebeurt er in deze stap? (voor Toon mij hoe) */
function stapWat(s){ const t = ZX.parse(s); const E = ZX.klaar(t); if(!E.length) return ''; const tr = Math.min(...E.map(e => ZX.trede(t, e)));
  const lijst = E.filter(e => ZX.trede(t, e)===tr).map(e => zT(ZX.str(e)));
  return (tr===1 ? 'Eerst de haakjes: ' : tr===2 ? 'Maal en gedeeld door, van links naar rechts: ' : 'Plus en min, van links naar rechts: ') + lijst.join(' en ') + '.'; }
const hoeLijnen = L => L.map((l, i) => [(i ? '= ' : '') + zT(l), i < L.length-1 ? stapWat(l) : 'Dit is de uitkomst.']);

/* ---------- indeling zoals de rekenvaardigheden: beeld links, genummerde stappen rechts (op een gsm onder elkaar) ---------- */
function paneel(host, cls){ const w = el('div', 'm5-pan' + (cls ? ' ' + cls : '')), vis = el('div', 'm5-pan-vis'), stap = el('div', 'm5-pan-st'); w.append(vis, stap); host.append(w); return {w, vis, stap}; }
const stapKop = (host, n, t) => { const h = el('p', 'm5-sk', `<span class="m5-sk-n">${'①②③④'[n-1]}</span> ${t}`); host.append(h); return h; };
/* groen vak als alles juist is, met één zin waarom */
const allesJuist = (host, waarom) => { const d = el('div', 'm5-juist', `<b>🎉 Alles juist!</b> <span>${waarom}</span>`); host.append(d); return d; };
/* lijst van wat al juist is, met een groene vink per regel */
const vinkLijst = L => `<div class="m5-vinken">${L.map(t => `<div><span class="m5-vink">✓</span> ${t}</div>`).join('')}</div>`;

/* ---------- staafdiagram bij een patroon: staven boven en onder 0 ---------- */
function staafSvg(o){ /* o: {lab:[...], w:[waarde of null], lo, hi, nu (index van de volgende staaf)} */
  const W = 360, H = 210, L = 34, R = 10, T = 14, B = 26, n = o.lab.length, bw = (W - L - R)/n;
  const Y = v => T + (o.hi - v)*(H - T - B)/(o.hi - o.lo);
  let s = '';
  for(let v=o.lo; v<=o.hi; v++){ if(v % 2) continue; s += `<line class="sd-r${v===0 ? ' nul' : ''}" x1="${L}" y1="${fx(Y(v))}" x2="${W-R}" y2="${fx(Y(v))}"/>`; s += sT(L-6, Y(v), zS(v), v===0 ? 'sd-l nul' : 'sd-l', 'end'); }
  o.lab.forEach((lb, i) => { const x = L + i*bw + bw*.18, w = bw*.64, v = o.w[i];
    if(v!=null && v!==0){ const y1 = Y(Math.max(v, 0)), y2 = Y(Math.min(v, 0)); s += `<rect class="sd-b ${v<0 ? 'neg' : 'pos'}${i===o.nieuw ? ' nieuw' : ''}" x="${fx(x)}" y="${fx(y1)}" width="${fx(w)}" height="${fx(y2 - y1)}" rx="3"/>`;
      s += sT(x + w/2, v>0 ? y1 - 8 : y2 + 9, zS(v), 'sd-w'); }
    else if(v===0) s += sT(x + w/2, Y(0) - 8, '0', 'sd-w');
    else if(i===o.nu) s += `<rect class="sd-b vraag" x="${fx(x)}" y="${fx(Y(o.hi) + 4)}" width="${fx(w)}" height="${fx(Y(o.lo) - Y(o.hi) - 8)}" rx="3"/>` + sT(x + w/2, Y(0), '?', 'sd-w');
    s += sT(x + w/2, H - 10, lb, 'sd-x'); });
  return svgWrap(W, H, s, {alt:'staafdiagram van de uitkomsten', maxw:460, cls:'m5-staaf'});
}

/* ---------- bankapp: saldo met bij- en afschrijvingen ---------- */
function bankHTML(o){ /* o: {naam, start, tr:[[omschrijving, bedrag]], nu (aantal verwerkt)} */
  let saldo = o.start; o.tr.slice(0, o.nu).forEach(([, b]) => saldo += b);
  const rij = ([t, b], i) => `<div class="bk-r${i===o.nu ? ' nu' : i<o.nu ? ' ok' : ''}"><span>${t}</span><b class="${b<0 ? 'af' : 'bij'}">${b<0 ? MIN : '+'} € ${Math.abs(b)}</b></div>`;
  return `<div class="m5-bank"><div class="bk-top">🏦 Rekening van ${o.naam}</div><div class="bk-saldo${saldo<0 ? ' rood' : ''}">Saldo<b>€ ${zS(saldo)}</b>${saldo<0 ? '<span class="bk-rood">je staat rood</span>' : ''}</div>
    <div class="bk-lijst">${o.tr.map(rij).join('')}</div></div>`; }

/* ---------- zoek de fout in het schriftje van een leerling: regel aanklikken, oorzaak kiezen, verbeteren ---------- */
const OORZAAK = [['teg', 'tegengestelde vergeten'], ['tek', 'teken fout'], ['vol', 'volgorde fout'], ['rek', 'rekenfout']];
function schriftFout(host, st, save, id, e){ /* e: {wie, task, lines, wrong, cons, oorzaak, why, fixMQ, onOk} */
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {tried:[], found:false}); const P = paneel(host);
  const blad = el('div', 'm5-schrift'); P.vis.append(blad);
  const k1 = stapKop(P.stap, 1, 'Klik in het schrift op de eerste regel die fout is.'); const fb = el('div', 'fb'); P.stap.append(fb);
  const k2 = stapKop(P.stap, 2, 'Wat ging er mis?'); const kz = el('div'); P.stap.append(kz);
  const k3 = stapKop(P.stap, 3, 'Verbeter die regel.'); const fix = el('div'); P.stap.append(fix);
  function teken(){
    blad.innerHTML = `<div class="sj-naam">✏️ Schrift van ${e.wie}</div><div class="sj-r opg">${e.task}</div>` + e.lines.map((l, i) => `<button type="button" class="sj-r${s.tried.includes(i) ? ' nope' : ''}${s.found && i===e.wrong ? ' fout' : ''}" data-i="${i}"${s.found ? ' disabled' : ''}>${l}</button>`).join('') + (s.found ? '' : '<div class="sj-stempel">?</div>');
    blad.querySelectorAll('button.sj-r').forEach(b => b.addEventListener('click', () => klik(+b.dataset.i)));
    k1.classList.toggle('klaar', s.found); k2.classList.toggle('uit', !s.found); k2.classList.toggle('klaar', !!s.oz); k3.classList.toggle('uit', !s.oz); }
  function klik(i){ if(s.found) return;
    if(i===e.wrong){ s.found = true; fb.className = 'fb ok'; fb.innerHTML = `✅ Juist, de fout zit in regel ${i+1}.`; save(); teken(); kiesOorzaak(); return; }
    const cons = (e.cons||[]).includes(i); if(!s.tried.includes(i)) s.tried.push(i); save(); teken(); CLres(qid, false);
    fb.className = 'fb bad'; fb.textContent = cons ? `❌ In regel ${i+1} loopt het mis, maar de fout begint vroeger.` : `❌ Regel ${i+1} klopt wel. Zoek verder.`; }
  function kiesOorzaak(){ if(kz.firstChild) return;
    qChoice(kz, st, save, id + 'oz', { noCL:true, html:'', opts:OORZAAK, ans:e.oorzaak, why:e.why, whyBad:'Kijk goed naar wat er tussen die twee regels veranderde.',
      after:ok=>{ if(ok && !s.oz){ s.oz = true; save(); teken(); verbeter(); } } });
    if(s.oz) verbeter(); }
  function verbeter(){ if(fix.firstChild) return;
    mQ(fix, st, save, id + '_fix', Object.assign({noCL:true, onOk:silent=>{ if(!silent){ CLres(qid, true); if(e.onOk) e.onOk(); } }}, e.fixMQ)); }
  teken(); if(s.found){ fb.className = 'fb ok'; fb.innerHTML = `✅ Juist, de fout zit in regel ${e.wrong+1}.`; kiesOorzaak(); }
}

(function(){ const css = `
  .m5-as{width:100%; height:auto; touch-action:manipulation}
  .m5-asbox{cursor:crosshair; max-width:660px}
  .mf .as-l, .mf .as-t{stroke:var(--ink); stroke-width:2} .mf .as-t.nul{stroke-width:3}
  .mf .as-pk{fill:var(--ink)} .mf .as-0{font-weight:900}
  .mf .as-sp{fill:none; stroke:var(--accent-dark); stroke-width:3; stroke-dasharray:1; stroke-dashoffset:0}
  .mf .as-sp.neg{stroke:#c2410c} .mf .as-spk{fill:var(--accent-dark)} .mf .as-spk.neg{fill:#c2410c}
  .mf .as-sp.nieuw{animation:m5-teken .9s ease-out both} .mf .as-spk.nieuw{animation:m5-in .2s .85s both}
  @keyframes m5-teken{from{stroke-dashoffset:1} to{stroke-dashoffset:0}} @keyframes m5-in{from{opacity:0} to{opacity:1}}
  .mf .as-lab{font-weight:700; fill:var(--accent-dark)} .mf .as-lab.neg{fill:#c2410c}
  .mf .as-p{fill:var(--orange); stroke:var(--ink); stroke-width:1.5} .mf .as-p.start{fill:var(--tq)} .mf .as-p.geest{fill:var(--or-soft); stroke:var(--orange); stroke-dasharray:3 2}
  .m5-stap{margin:.3rem 0}
  .m5-veld{display:grid; gap:.35rem; margin:.4rem 0; padding:.6rem; border:1.5px solid var(--border); border-radius:.8rem; background:var(--zone-bg); width:max-content; max-width:100%}
  .m5-rij{display:grid; grid-template-columns:repeat(var(--n), 1.75rem); gap:.25rem}
  .m5-sold{width:1.75rem; height:1.75rem; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:900; font-size:1.15rem; transition:transform .6s ease-in, opacity .4s .5s}
  .m5-sold.plus{background:#fde1df; color:#b42318; border:2px solid #d92d20} .m5-sold.min{background:#dbe7ff; color:#1d4ed8; border:2px solid #1d4ed8}
  .m5-sold.leeg{visibility:hidden}
  .m5-veld.weg .m5-rij.p .paar{transform:translateY(55%); opacity:0} .m5-veld.weg .m5-rij.m .paar{transform:translateY(-55%); opacity:0}
  .m5-veld.direct .m5-sold{transition:none}
  .m5-pir{display:flex; flex-wrap:wrap; align-items:flex-start; gap:.4rem 1rem}
  .m5-pir-in{display:flex; flex-direction:column; align-items:center; gap:.25rem}
  .m5-pir-rij{display:flex; gap:.25rem}
  .m5-pir-v{width:4.2rem; height:2.4rem; text-align:center; font:inherit; font-size:1.15rem; font-weight:700; border-radius:.45rem; box-sizing:border-box}
  .m5-pir-v.vast{display:inline-flex; align-items:center; justify-content:center; background:var(--tq-soft); border:2px solid var(--tq)}
  .m5-pir .q-act{flex-basis:100%}
  .m5-th .th-buis{fill:var(--card); stroke:var(--ink); stroke-width:2} .m5-th .th-bol{fill:var(--card); stroke:var(--ink); stroke-width:2}
  .m5-th .th-kwik{fill:#d92d20; transition:y .8s, height .8s} .m5-th .th-t{stroke:var(--ink); stroke-width:1.5} .m5-th .th-t.nul{stroke-width:3}
  .m5-bog{display:grid; grid-template-columns:minmax(0, 1fr) 13.5rem; gap:1rem; align-items:start}
  @media (max-width:700px){ .m5-bog{grid-template-columns:1fr} .m5-bog-r{order:-1} .m5-trap{display:flex; flex-wrap:wrap; gap:.3rem} .m5-trap > b{flex-basis:100%} .m5-trede{flex:1 1 0; margin:0 !important} .m5-trede small{display:none} }
  .m5-bog-regel{display:flex; align-items:flex-start; gap:.4rem; font-size:1.45rem; font-weight:700; margin:.3rem 0; font-variant-numeric:tabular-nums; flex-wrap:wrap}
  .m5-bog-regel:not(.nu){color:var(--ink-soft)}
  .m5-bog-is{min-width:1rem}
  .m5-bog-ex{line-height:1.5}
  .bg-s{border-radius:.35rem; padding:0 .1rem}
  .bg-s.hov{background:var(--or-soft); outline:2px dashed var(--orange)}
  .bg-s.rd{background:var(--bad-bg); outline:2px solid var(--bad)}
  .bg-s.u{position:relative; display:inline-block; margin-bottom:3.4rem; background:#efe3fb; outline:2px solid #8e5bd0; color:var(--ink)}
  .bg-arc{position:absolute; left:6%; right:6%; top:100%; height:1.1rem; border:2.5px solid #8e5bd0; border-top:none; border-radius:0 0 50% 50% / 0 0 100% 100%}
  .bg-ub{position:absolute; left:50%; transform:translateX(-50%); top:calc(100% + 1.25rem); display:inline-flex; gap:.25rem; align-items:center; white-space:nowrap; border:2px solid var(--orange); border-radius:.4rem; padding:0 .4rem; background:var(--card); font-size:1.15rem; color:var(--ink)}
  .bg-ub:has(input){border:none; padding:0; background:transparent}
  .bg-in{width:4.2rem; height:2.1rem; font:inherit; font-size:1.1rem; text-align:center}
  .bg-op{font:inherit; font-weight:900; min-width:1.9rem; padding:0 .3rem; border:2px solid var(--tq); border-radius:.45rem; background:var(--card); color:var(--ink); cursor:pointer; line-height:1.25}
  .bg-op:hover, .bg-op:focus-visible{border-color:var(--orange); background:var(--or-soft); outline:none}
  .m5-trap{border:1.5px solid var(--border); border-radius:.8rem; padding:.6rem; background:var(--zone-bg); font-size:.95rem}
  .m5-trede{display:flex; gap:.45rem; align-items:flex-start; border:2px solid var(--border); border-radius:.55rem; padding:.3rem .5rem; margin:.35rem 0; background:var(--card)}
  .m5-trede.aan{border-color:#8e5bd0; background:#efe3fb}
  .m5-tr-n{flex:none; width:1.3rem; height:1.3rem; border-radius:50%; border:1.5px solid currentColor; display:inline-flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700}
  .m5-uitw{font-weight:700; font-size:1.1rem; line-height:1.6}
  .m5-opg{white-space:nowrap}
  .m5-ctx{display:flex; gap:1rem; align-items:flex-start; flex-wrap:wrap}
  .m5-ctx > .m4-items{flex:1 1 300px}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();

/* stijl van de tweede ronde: indeling, legertjes, thermometers, lift en zee, bogen met kleuren, schrift, bank */
(function(){ const css = `
  .m5-pan{display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:1rem; align-items:start; margin:.3rem 0}
  .m5-pan.breed-l{grid-template-columns:minmax(0, 1.35fr) minmax(0, 1fr)}
  @media (max-width:820px){ .m5-pan, .m5-pan.breed-l{grid-template-columns:1fr} }
  .m5-pan-vis{border:1.5px solid var(--border); border-radius:.9rem; padding:.6rem; background:var(--zone-bg); min-width:0}
  .m5-pan-st{display:flex; flex-direction:column; gap:.45rem; min-width:0}
  .m5-pan-st > .fb{margin:0}
  .m5-sk{margin:.2rem 0 0; font-weight:700; line-height:1.35; padding-left:1.75rem; text-indent:-1.75rem}
  .m5-sk-n{display:inline-block; width:1.75rem; text-indent:0; font-size:1.25rem; color:var(--accent-dark); line-height:1}
  .m5-sk.klaar .m5-sk-n{color:var(--ok)} .m5-sk.uit{opacity:.45}
  .m5-tip{margin:0; font-size:.92rem; color:var(--ink-soft)}
  .m5-vtekst{margin:0; font-size:1.05rem}
  .m5-juist{border:2px solid var(--ok); background:var(--ok-bg); border-radius:.8rem; padding:.55rem .8rem; margin:.5rem 0; animation:m5-pop .35s ease-out}
  .m5-juist b{color:var(--ok); font-size:1.1rem; margin-right:.3rem}
  @keyframes m5-pop{from{transform:scale(.96); opacity:0} to{transform:none; opacity:1}}
  .m5-vinken{display:flex; flex-direction:column; gap:.15rem; font-size:1.1rem; font-weight:700; font-variant-numeric:tabular-nums}
  .m5-vink{color:var(--ok); font-weight:900}
  .m5-asbox{cursor:pointer; max-width:none} .m5-asbox.sleep{touch-action:none; user-select:none}
  .mf .as-sp.vl{stroke-dasharray:.03 .025; opacity:.75} .mf .as-spk.vl{opacity:.6}
  .m5-slag{display:grid; grid-template-columns:minmax(0, 1fr) auto minmax(0, 1fr); gap:.4rem; align-items:stretch}
  .m5-kamp{border:2px solid; border-radius:.8rem; padding:.45rem; min-height:170px; display:flex; flex-direction:column}
  .m5-kamp.breed{grid-column:1 / -1}
  .m5-kamp.min{background:#e8efff; border-color:#7aa0ea} .m5-kamp.plus{background:#fdeaea; border-color:#ec8f8f}
  .m5-kamp.klik{cursor:copy} .m5-kamp.klik .m5-sd{cursor:pointer}
  .m5-kkop{display:flex; justify-content:space-between; gap:.3rem; font-weight:800; font-size:.88rem; margin-bottom:.3rem}
  .m5-kamp.min .m5-kkop{color:#1d4ed8} .m5-kamp.plus .m5-kkop{color:#c01f1f}
  .m5-kcnt{background:#fff; border-radius:999px; padding:0 .55rem; white-space:nowrap}
  .m5-troep{display:flex; flex-wrap:wrap; gap:2px; align-content:flex-start}
  .m5-sd{width:25px; height:31px; display:inline-block; transition:opacity .3s, transform .15s}
  .m5-sd svg{width:100%; height:100%; display:block}
  .m5-sd.dood{opacity:.15; filter:grayscale(1)} .m5-sd.raak{animation:m5-poef .5s ease-in forwards}
  @keyframes m5-poef{50%{transform:scale(1.25) rotate(-8deg)} to{opacity:.15; filter:grayscale(1); transform:none}}
  .m5-kleeg{margin:auto; text-align:center; font-size:.8rem; font-style:italic; color:#4f6668}
  .m5-vs{display:flex; align-items:center; font-size:1.5rem} .m5-vs.vecht{animation:m5-bots .3s ease-in-out infinite alternate}
  @keyframes m5-bots{to{transform:scale(1.3)}}
  .m5-lrijen{display:flex; flex-direction:column; gap:.35rem}
  .m5-lrij{display:flex; flex-wrap:wrap; gap:.35rem; align-items:center; border-radius:.6rem; padding:.3rem .45rem}
  .m5-lrij.min{background:#e8efff} .m5-lrij.plus{background:#fdeaea}
  .m5-lnaam{font-weight:800; min-width:7.2rem; color:#173436} .m5-lcnt{min-width:1.8rem; text-align:center; font-weight:900; background:#fff; color:#173436; border-radius:.4rem}
  .m5-lrij .btn{padding:.2rem .55rem; font-size:.85rem}
  .m5-th2{width:100%; height:auto; max-width:460px; display:block; margin:0 auto}
  .m5-th2 .th-buis{fill:var(--card); stroke:#9fb3b6; stroke-width:2} .m5-th2 .th-kwik{fill:#d92d20} .m5-th2 .th-bolr{fill:none; stroke:#8a2a20; stroke-width:2}
  .m5-th2 .th-t{stroke:var(--ink); stroke-width:1.3} .m5-th2 .th-t.nul{stroke-width:3}
  .m5-th2 .th-lab{font-size:12px; fill:var(--ink-soft); font-weight:600} .m5-th2 .th-lab.nul{font-weight:900; fill:var(--ink)}
  .m5-th2 .th-titel{font-size:16px; font-weight:800; fill:var(--ink)}
  .m5-th2 .th-tag{fill:#173436} .m5-th2 .th-tagt{fill:#fff; font-size:13px; font-weight:800}
  .m5-th2 .th-start{stroke:var(--ink); stroke-width:2; stroke-dasharray:4 3}
  .m5-th2 .th-pijl{stroke:var(--ink); stroke-width:4; stroke-linecap:round} .m5-th2 .th-pijl.vl{stroke-dasharray:7 5} .m5-th2 .th-pijlk{fill:var(--ink)}
  .m5-th2 .th-sprong{font-size:17px; font-weight:900; fill:var(--ink)}
  .m5-th2 .th-raak{fill:transparent; cursor:ns-resize}
  .m5-vfig.sleep{touch-action:none; user-select:none}
  .m5-hg{width:100%; height:auto; max-width:380px; display:block; margin:0 auto; border-radius:.6rem}
  .m5-vfig.sleep .m5-hg{cursor:pointer}
  .m5-hg .hg-kab rect{fill:#3bc1c5; stroke:#127a7f; stroke-width:1.5} .m5-hg .hg-geest{opacity:.45} .m5-hg .hg-geest rect{fill:#fcaf17; stroke:#b77900; stroke-dasharray:3 2}
  .m5-pir-in{gap:.3rem} .m5-pir-rij{gap:.3rem}
  .m5-steen{display:inline-flex; align-items:center; gap:.2rem; min-width:4.6rem; height:2.9rem; padding:0 .25rem; justify-content:center; border-radius:.5rem; box-sizing:border-box; font-size:1.15rem; font-weight:700}
  .m5-steen.vast{background:var(--tq-soft); border:2px solid var(--tq)}
  .m5-steen.open{border:2px solid var(--border); background:var(--card)}
  .m5-steen.ok{border-color:var(--ok); background:var(--ok-bg)} .m5-steen.bad{border-color:var(--bad); background:var(--bad-bg)}
  .m5-steen .m4-teken{height:2.3rem; width:1.5rem}
  .m5-steen .m5-pir-v{width:2.9rem; height:2.2rem; font-size:1.1rem; padding:0}
  .m5-balk{display:flex; flex-wrap:wrap; gap:.3rem; align-items:center; margin-bottom:.5rem; font-size:.85rem}
  .m5-balk-k{font-size:.72rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-soft); margin-right:.2rem}
  .m5-bs{--c:#7b3fb8; border:2px solid var(--c); border-radius:999px; padding:.1rem .6rem; background:var(--card); color:var(--ink)}
  .m5-bs b{color:var(--c)} .m5-bs small{color:var(--ink-soft)}
  .m5-bs.aan{background:var(--c); color:#fff; box-shadow:0 2px 6px rgba(0,0,0,.15)} .m5-bs.aan b, .m5-bs.aan small{color:#fff}
  .m5-bpijl{color:var(--ink-soft)}
  .lv1{--c:#7b3fb8} .lv2{--c:#e06c00} .lv3{--c:#1565c0} .lv4{--c:#ad1457}
  .m5-blad{background:#fffef7; border:1px solid #ece6c8; border-radius:.7rem; padding:.4rem .7rem .6rem 2.4rem; color:#173436; background-image:linear-gradient(to right, transparent 1.6rem, #f3b4b4 1.6rem 1.7rem, transparent 1.7rem); overflow-x:auto}
  .m5-blad .m5-bog-regel{border-bottom:1px solid #e4ecf0; padding:.15rem 0; margin:0}
  .m5-blad .m5-bog-regel:not(.nu){color:#35545a; font-size:1.3rem}
  .m5-bog-v{color:var(--ok); font-weight:900; margin-left:auto}
  .bg-s.u{background:color-mix(in srgb, var(--c, #8e5bd0) 14%, #fff); outline:2px solid var(--c, #8e5bd0)}
  .bg-s.u > .bg-arc{border-color:var(--c, #8e5bd0)}
  .bg-s.u > .bg-ub{border-color:var(--c, #8e5bd0); color:#173436}
  .bg-in{background:#fff; color:#173436}
  .bg-op{background:#fff; color:#173436}
  .bg-tp{display:inline-flex; gap:.15rem; font:inherit; font-weight:900; padding:0 .3rem; border:2px dashed #e0a800; border-radius:.45rem; background:#fff4e0; color:#173436; cursor:pointer; line-height:1.25; animation:m5-puls 1.6s ease-in-out infinite}
  .bg-tp:hover, .bg-tp:focus-visible{border-style:solid; outline:none}
  @keyframes m5-puls{50%{box-shadow:0 0 0 4px rgba(252,175,23,.35)}}
  @media (prefers-reduced-motion:reduce){ .bg-tp, .m5-vs.vecht, .m5-juist{animation:none} }
  .m5-schrift{position:relative; background:#fffef7; border:1px solid #ece6c8; border-radius:.8rem; padding:.8rem 1rem 1.4rem 3rem; color:#3a3a3a; background-image:linear-gradient(to right, transparent 2.1rem, #f3b4b4 2.1rem 2.2rem, transparent 2.2rem), repeating-linear-gradient(to bottom, transparent 0 2.45rem, #dbe7ef 2.45rem 2.5rem); min-height:12rem}
  .sj-naam{font-size:.85rem; color:#4f6668; font-weight:700; margin-bottom:.4rem; font-family:inherit}
  .sj-r{display:block; width:100%; text-align:left; font-family:"Segoe Print","Bradley Hand","Comic Sans MS",cursive; font-size:1.35rem; line-height:2.5rem; min-height:2.5rem; background:transparent; border:0; border-radius:.4rem; color:#2b3a55; padding:0 .4rem}
  button.sj-r{cursor:pointer} button.sj-r:hover:not(:disabled){background:#fff1c2}
  .sj-r.nope{text-decoration:line-through; text-decoration-color:#e57373; color:#7a8a95}
  .sj-r.fout{background:#fdecea; outline:2px solid #e57373}
  .sj-r.opg{font-weight:700}
  .sj-stempel{position:absolute; right:1rem; bottom:.8rem; width:3rem; height:3rem; border-radius:50%; border:4px solid var(--orange); color:var(--orange); font-size:1.7rem; font-weight:900; display:grid; place-items:center; transform:rotate(-12deg)}
  .m5-bank{max-width:340px; margin:0 auto; border-radius:1.2rem; background:#127a7f; color:#fff; padding:.9rem 1rem}
  .bk-top{font-size:.85rem; opacity:.9; font-weight:700}
  .bk-saldo{font-size:.85rem; margin:.6rem 0 .7rem} .bk-saldo b{display:block; font-size:2rem; margin-top:.1rem; transition:color .3s}
  .bk-saldo.rood b{color:#ffb4a8} .bk-rood{display:inline-block; margin-top:.2rem; background:#d92d20; border-radius:999px; padding:0 .6rem; font-weight:800; font-size:.8rem}
  .bk-lijst{background:rgba(255,255,255,.12); border-radius:.8rem; padding:.15rem .7rem}
  .bk-r{display:flex; justify-content:space-between; gap:.6rem; padding:.45rem 0; font-size:.9rem; border-bottom:1px solid rgba(255,255,255,.15); opacity:.55}
  .bk-r:last-child{border-bottom:0} .bk-r.ok{opacity:.85} .bk-r.nu{opacity:1; font-weight:700; background:rgba(255,255,255,.14); margin:0 -.4rem; padding:.45rem .4rem; border-radius:.4rem}
  .bk-r .af{color:#ffd0c8} .bk-r .bij{color:#c9f7d8}
  .m5-staaf{width:100%; height:auto} .mf .sd-r{stroke:var(--border); stroke-width:1} .mf .sd-r.nul{stroke:var(--ink); stroke-width:2}
  .mf .sd-l{font-size:11px; fill:var(--ink-soft)} .mf .sd-l.nul{font-weight:900; fill:var(--ink)}
  .mf .sd-b.pos{fill:var(--tq)} .mf .sd-b.neg{fill:#e8772e} .mf .sd-b.vraag{fill:none; stroke:var(--orange); stroke-width:2; stroke-dasharray:5 4}
  .mf .sd-b.nieuw{animation:m5-in .5s both}
  .mf .sd-w{font-size:12px; font-weight:800; fill:var(--ink)} .mf .sd-x{font-size:12px; font-weight:700; fill:var(--accent-dark)}
  .m5-tl{width:100%; height:auto; display:block}
  @media (max-width:600px){ .m5-bs small{display:none} .m5-kamp{min-height:120px} .m5-lnaam{min-width:0; flex:1 1 100%} }
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* ============================================================
   1A MODULE 5 · GEREEDSCHAP VOOR DE ANDERE ONDERDELEN
   - reeks na elkaar (opgave 1 van 3 …) met groen vak op het einde
   - getal kiezen op de getallenas, getallen rangschikken, venndiagram,
     bewerkingstabel, patroon met staafdiagram, schrift met een fout
   ============================================================ */
/* opgaven na elkaar: bouw(host, i, klaar) maakt opgave i; na de laatste een groen vak */
function naElkaar(b, st, save, n, bouw, slot, gedaan){
  if(st.i==null) st.i = 0; const lijst = el('div', 'm5-gedaan'), host = el('div'); b.append(lijst, host);
  const toon = () => { lijst.innerHTML = gedaan ? gedaan.slice(0, st.i).map(t => `<span class="m5-ok">✓ ${t}</span>`).join('') : '';
    host.innerHTML = '';
    if(st.i < n){ if(n>1) host.append(el('div', 'm5-teller', `Opgave ${st.i + 1} van ${n}`)); const i = st.i; bouw(host, i, () => { if(st.i===i){ st.i++; save(); setTimeout(toon, 900); } }); }
    else allesJuist(host, slot); };
  toon(); }

/* ---------- een getal kiezen op de getallenas ---------- */
/* o: {lo, hi, punten, sprongen, vraag, T, fout:[[v, msg]], na(host) na een juiste klik} */
function asKies(host, st, save, id, o){
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {}); const B = {lo:o.lo, hi:o.hi};
  const P = paneel(host); const fig = el('div', 'm5-asbox'); P.vis.append(fig);
  const k1 = stapKop(P.stap, 1, o.vraag); const fb = el('div', 'fb'); P.stap.append(fb);
  const k2 = o.na ? stapKop(P.stap, 2, o.naKop || 'Schrijf het op') : null; const vak = el('div'); P.stap.append(vak);
  let geest = null;
  const teken = () => { const pt = (o.punten||[]).slice(); if(s.ok) pt.push({x:o.T, cls:'eind', lab:o.lab}); fig.innerHTML = asSvg(Object.assign({}, B, {punten:pt, sprongen:s.ok ? (o.sprongen||[]) : [], geest:s.ok ? null : geest, alt:`getallenas van ${B.lo} tot ${B.hi}`}));
    fig.classList.toggle('sleep', !s.ok); k1.classList.toggle('klaar', !!s.ok); if(k2) k2.classList.toggle('uit', !s.ok); };
  fig.addEventListener('pointermove', e => { if(s.ok) return; const v = asKlik(fig.querySelector('svg'), e, B); if(v!==geest){ geest = v; teken(); } });
  fig.addEventListener('pointerleave', () => { if(s.ok) return; geest = null; teken(); });
  fig.addEventListener('click', e => { if(s.ok) return; const v = asKlik(fig.querySelector('svg'), e, B);
    if(v===o.T){ s.ok = true; save(); fb.className = 'fb ok'; fb.innerHTML = '✅ Juist! ' + (o.why||''); teken(); verder(); if(!o.na){ CLres(qid, true); if(o.onOk) o.onOk(); } return; }
    const f = (o.fout||[]).find(x => x[0]===v); fb.className = 'fb bad'; fb.innerHTML = `❌ Je klikte op ${zS(v)}. ` + (f ? f[1] : (o.whyBad||'')); CLres(qid, false); });
  function verder(){ if(!o.na || vak.firstChild) return; o.na(vak, () => { CLres(qid, true); if(o.onOk) o.onOk(); }); }
  teken(); if(s.ok){ fb.className = 'fb ok'; fb.innerHTML = '✅ Juist! ' + (o.why||''); verder(); }
}

/* ---------- getallen rangschikken: klik ze in de juiste volgorde ---------- */
function rangschik(host, st, save, id, o){ /* o: {getallen:[{w (waarde), h (html)}], op (true: van klein naar groot), nr} */
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {v:[]}); const G = o.getallen;
  const box = el('div', 'q m5-rang'); host.append(box);
  box.append(el('div', 'q-text', (o.nr ? `<span class="q-num">${o.nr}</span>` : '') + `Klik de getallen aan van <b>${o.op===false ? 'groot naar klein' : 'klein naar groot'}</b>.`));
  const pool = el('div', 'm5-pool'), rij = el('div', 'm5-rij'); const act = el('div', 'q-act'); const ctl = el('button', 'btn', 'Controleer'); ctl.type = 'button'; const wis = el('button', 'btn ghost', '↺ Wis'); wis.type = 'button'; act.append(ctl, wis);
  const fb = el('div', 'fb'); box.append(pool, rij, act, fb);
  const juist = G.map((g, i) => i).sort((a, b) => o.op===false ? G[b].w - G[a].w : G[a].w - G[b].w);
  const teken = () => { pool.innerHTML = ''; rij.innerHTML = '';
    G.forEach((g, i) => { if(s.v.includes(i)) return; const c = el('button', 'm5-chip', g.h); c.type = 'button'; c.addEventListener('click', () => { if(s.lock) return; s.v.push(i); save(); fb.className = 'fb'; fb.textContent = ''; teken(); }); pool.append(c); });
    s.v.forEach((i, j) => { if(j) rij.append(el('span', 'm5-rteken', o.op===false ? '&gt;' : '&lt;')); const c = el('button', 'm5-chip in', G[i].h); c.type = 'button'; c.addEventListener('click', () => { if(s.lock) return; s.v = s.v.slice(0, j); save(); teken(); }); rij.append(c); });
    if(!s.v.length) rij.append(el('span', 'm5-rleeg', 'Klik op een getal hierboven.')); };
  const goed = () => s.v.length===G.length && s.v.every((i, j) => G[i].w===G[juist[j]].w);
  function run(silent){ if(s.v.length < G.length){ if(!silent){ fb.className = 'fb info'; fb.textContent = 'Klik eerst alle getallen aan.'; } return; }
    const ok = goed(); fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = ok ? '✅ Juist! ' + (o.why||'') : '❌ Nog niet juist. ' + (o.whyBad || 'Hoe verder links op de getallenas, hoe kleiner het getal.');
    s.checked = true; save(); if(!silent && !quiz) CLres(qid, ok); }
  ctl.addEventListener('click', () => run()); wis.addEventListener('click', () => { if(s.lock) return; s.v = []; save(); fb.className = 'fb'; fb.textContent = ''; teken(); });
  teken();
  if(quiz){ ctl.hidden = true; quiz.push({pts:o.pts||1, grade:goed, reveal:ok => { fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = ok ? '' : 'Juist: ' + juist.map(i => G[i].h).join(o.op===false ? ' &gt; ' : ' &lt; '); }, lock:() => { s.lock = true; }}); }
  else if(s.checked) run(true);
}

/* ---------- venndiagram: sleep de getallen naar de juiste plaats ---------- */
/* zones: pos (enkel ℤ⁺), nul (ℤ⁺ en ℤ⁻), neg (enkel ℤ⁻), buiten (niet in ℤ) */
function venn(host, st, save, id, o){ /* o: {items:[[html, zone]]} */
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {p:{}}); const P = paneel(host, 'breed-l');
  const vd = el('div', 'm5-venn'); P.vis.append(vd);
  vd.innerHTML = `<svg viewBox="0 0 420 270" class="m5-venn-svg" aria-hidden="true"><rect x="10" y="10" width="400" height="200" rx="14" class="vn-z"/><text x="26" y="36" class="vn-l">ℤ</text>
    <ellipse cx="150" cy="112" rx="118" ry="84" class="vn-p"/><ellipse cx="270" cy="112" rx="118" ry="84" class="vn-m"/><text x="70" y="48" class="vn-l p">ℤ⁺</text><text x="330" y="48" class="vn-l m">ℤ⁻</text><text x="16" y="232" class="vn-s">niet in ℤ</text></svg>`;
  const ZONES = {pos:[7, 22, 30, 50], nul:[43, 30, 14, 40], neg:[63, 22, 30, 50], buiten:[3, 81, 94, 16]};
  const bak = {}; Object.entries(ZONES).forEach(([z, [l, t, w, h]]) => { const d = el('div', 'm5-vbak'); d.dataset.z = z; Object.assign(d.style, {left:l + '%', top:t + '%', width:w + '%', height:h + '%'}); vd.append(d); bak[z] = d; });
  stapKop(P.stap, 1, 'Sleep elk getal naar de juiste plaats in het venndiagram. Aantikken en dan op een plaats tikken kan ook.');
  const pool = el('div', 'pool m5-vpool'); P.stap.append(pool); const fb = el('div', 'fb'); P.stap.append(fb);
  P.stap.append(el('p', 'm5-tip', 'ℤ⁺ = {0, 1, 2, 3, …} en ℤ⁻ = {…, −3, −2, −1, 0}. Een getal dat niet geheel is, staat buiten ℤ.'));
  const grp = 'venn' + id; const chips = o.items.map(([h, z], i) => { const c = el('span', 'chip', h); c.dataset.grp = grp; c.dataset.i = i;
    draggable(c, (x, y) => { const z2 = Object.keys(bak).find(k => inRect(bak[k], x, y)); if(z2) zet(c, z2); else terug(c); }); return c; });
  function zet(c, z){ const i = +c.dataset.i; s.p[i] = z; bak[z].append(c); const ok = o.items[i][1]===z; c.classList.remove('chip-ok', 'chip-bad'); c.classList.add(ok ? 'chip-ok' : 'chip-bad'); if(ok) c.dataset.locked = '1'; save(); controle(); }
  function terug(c){ delete s.p[+c.dataset.i]; c.classList.remove('chip-ok', 'chip-bad'); pool.append(c); save(); }
  function controle(){ const fout = chips.filter(c => s.p[c.dataset.i] && o.items[c.dataset.i][1]!==s.p[c.dataset.i]);
    if(fout.length){ fb.className = 'fb bad'; fb.innerHTML = '❌ Het rode getal staat nog niet goed. ' + (o.whyBad || 'Is het positief, negatief, 0, of geen geheel getal?'); }
    else fb.className = 'fb', fb.textContent = '';
    if(chips.every(c => o.items[c.dataset.i][1]===s.p[c.dataset.i]) && !s.ok){ s.ok = true; save(); CLres(qid, true); allesJuist(P.stap, o.why || '0 hoort bij ℤ⁺ en bij ℤ⁻: het staat in het gemeenschappelijke deel.'); }
    else if(fout.length && !s.ok) CLres(qid, false); }
  Object.values(bak).forEach(d => d.addEventListener('click', e => { if(e.target.closest('.chip')) return; if(selChip && selChip.dataset.grp===grp){ const c = selChip; clearSel(); zet(c, d.dataset.z); } }));
  chips.forEach(c => { const z = s.p[c.dataset.i]; if(z) zet(c, z); else pool.append(c); });
  if(s.ok && !P.stap.querySelector('.m5-juist')) allesJuist(P.stap, o.why || '0 hoort bij ℤ⁺ en bij ℤ⁻.');
}

/* ---------- bewerkingstabel: vul elk vak in ---------- */
function tabel(host, st, save, id, o){ /* o: {op:'+'|'−'|'·'|':', rij:[...], kol:[...], open (aantal open vakken; standaard alle)} */
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {v:{}}); const f = (a, b) => o.op==='+' ? a + b : o.op==='−' ? a - b : o.op==='·' ? a*b : a/b;
  const box = el('div', 'q m5-tab'); host.append(box); const t = el('table', 'm5-btab'); box.append(t);
  let h = `<tr><th class="op">${o.op}</th>${o.kol.map(k => `<th>${zS(k)}</th>`).join('')}</tr>`;
  o.rij.forEach((r, i) => { h += `<tr><th>${zS(r)}</th>${o.kol.map((k, j) => `<td><input type="text" class="inp" inputmode="numeric" autocomplete="off" data-k="${i}_${j}" aria-label="${zS(r)} ${o.op} ${zP(k)}"></td>`).join('')}</tr>`; });
  t.innerHTML = h;
  const ins = [...t.querySelectorAll('input')]; ins.forEach(i => { i.value = s.v[i.dataset.k] || ''; i.addEventListener('input', () => { s.v[i.dataset.k] = i.value; i.classList.remove('ok', 'bad'); save(); }); });
  const act = el('div', 'q-act'); const btn = el('button', 'btn', 'Controleer'); btn.type = 'button'; act.append(btn); const fb = el('div', 'fb'); box.append(act, fb);
  const W = k => { const [i, j] = k.split('_').map(Number); return f(o.rij[i], o.kol[j]); };
  const goed = i => rdZ({t:i.value, z:true})===W(i.dataset.k);
  function run(silent){ if(ins.some(i => !i.value.trim())){ if(!silent){ fb.className = 'fb info'; fb.textContent = 'Vul eerst alle vakken in.'; } return; }
    let fout = 0; ins.forEach(i => { const g = goed(i); if(!g) fout++; i.classList.remove('ok', 'bad'); i.classList.add(g ? 'ok' : 'bad'); });
    fb.className = 'fb ' + (fout ? 'bad' : 'ok'); fb.innerHTML = fout ? `❌ ${fout===1 ? 'Eén vak klopt' : fout + ' vakken kloppen'} nog niet. Reken: getal links ${o.op} getal boven.` : '✅ Juist! ' + (o.why||'');
    s.checked = true; save(); if(!silent && !quiz) CLres(qid, !fout); }
  btn.addEventListener('click', () => run());
  if(quiz){ btn.hidden = true; quiz.push({pts:o.pts||1, grade:() => ins.every(goed), reveal:() => run(true), lock:() => ins.forEach(i => i.readOnly = true)}); }
  else if(s.checked) run(true);
}

/* ---------- patroon met staafdiagram: reken van boven naar onder ---------- */
/* o: {a, B (tweede getallen), op:'+'|'−'|'·', vraag, opts, ans, why, slot} */
function patroon(b, st, save, o){
  if(!st.k) st.k = {}; if(st.i==null) st.i = 0; const f = x => o.op==='·' ? o.a*x : o.op==='−' ? o.a - x : o.a + x; const T = o.B.map(f);
  const lab = x => `${o.op} ${zP(x)}`, som = x => `${zP(o.a)} ${o.op} ${zP(x)}`.replace(/^\((.*?)\) /, (m, g) => o.op==='·' ? m : g + ' ');
  const P = paneel(b); const staaf = el('div'); P.vis.append(staaf);
  const lo = Math.min(0, ...T) - 1, hi = Math.max(0, ...T) + 1;
  stapKop(P.stap, 1, 'Reken uit, van boven naar onder.'); const lijst = el('div'), g = el('div'); P.stap.append(lijst, g);
  const k2 = stapKop(P.stap, 2, 'Wat valt je op?'); const bes = el('div'); P.stap.append(bes);
  const toon = anim => { lijst.innerHTML = vinkLijst(o.B.slice(0, st.i).map((x, j) => `${som(x)} = ${zS(T[j])}`));
    staaf.innerHTML = staafSvg({lab:o.B.map(lab), w:o.B.map((x, j) => j < st.i ? T[j] : null), lo, hi, nu:st.i, nieuw:anim ? st.i - 1 : -1});
    g.innerHTML = ''; k2.classList.toggle('uit', st.i < o.B.length);
    if(st.i < o.B.length){ const i = st.i;
      mQ(g, st, save, 'p' + i, { html:`${som(o.B[i])} ${isq} {{u:a}}`, check:V=>chkGt(V.a, T[i], [[-T[i], 'Kijk naar het patroon: hoe veranderen de uitkomsten telkens?']]),
        onOk:silent=>{ if(!silent && st.i===i){ st.k[i] = 1; st.i++; save(); setTimeout(()=>toon(true), 500); } } });
      const fo = g.querySelector('.m4-teken button'); if(fo && anim) fo.focus({preventScroll:true}); }
    else if(!bes.firstChild) qChoice(bes, st, save, 'bes', { html:o.vraag, opts:o.opts, ans:o.ans, why:o.why, whyBad:'Kijk naar de staven: hoe veranderen ze van stap tot stap?',
      after:ok=>{ if(ok && !bes.querySelector('.m5-juist')) allesJuist(bes, o.slot); } }); };
  toon(false);
}

/* ---------- zoek de fout in het schrift: kaart met opgaven na elkaar ---------- */
/* maak(R) geeft [[opgave, foute regel, k (index van de foute stap), oorzaak, waarom], …] */
const WIE5 = ['Lotte', 'Mats', 'Noor', 'Yassin', 'Elise', 'Bram', 'Amira'];
function schriftKaart(title, lvl, maak, n=2){ return { title, lvl, instr:'In elk schrift zit één fout. Klik op de eerste regel die fout is, kies wat er misging en verbeter die regel.',
  build(b, st, save){ const R = makeR(st); const F = maak(R).slice(0, n); const WIE = R.shuffle(WIE5);
    naElkaar(b, st, save, F.length, (host, i, klaar) => { const [E, fout, k, oz, why] = F[i];
      const L = ZX.stappen(E, false); const juist = L[k + 1];
      const W = L.slice(1, k + 1).concat([fout]); const rest = ZX.stappen(fout); if(rest) W.push(...rest.slice(1));
      schriftFout(host, st, save, 'f' + i, { wie:WIE[i], task:zT(E), lines:W.map(l => '= ' + zT(l)), wrong:k, cons:W.map((_, j) => j).filter(j => j>k), oorzaak:oz, why,
        fixMQ:{html:`<span class="m5-opg">${zT(L[k])}</span> {{z:a,mdh}}`, check:V=>chkZ(V.a, ZX.waarde(juist), {opg:L[k]}), sol:'= ' + zT(juist)}, onOk:klaar }); },
      'Je vond elke fout en verbeterde ze.'); } }; }

/* waar of niet waar, en de tekens < = > */
const WNW = [['w', 'waar'], ['n', 'niet waar']];
const PNN = [['+', 'positief'], ['-', 'negatief'], ['0', 'nul']];
const PN = [['+', 'positief'], ['-', 'negatief']];
const tk = n => n>0 ? '+' : n<0 ? '-' : '0';

(function(){ const css = `
  .m5-rang .q-text{margin-bottom:.3rem}
  .m5-pool{display:flex; flex-wrap:wrap; gap:.4rem; min-height:2.6rem}
  .m5-rij{display:flex; flex-wrap:wrap; gap:.35rem; align-items:center; min-height:2.8rem; margin:.4rem 0; padding:.35rem .5rem; border:2px dashed var(--border); border-radius:.6rem}
  .m5-chip{font:inherit; font-size:1.15rem; font-weight:700; min-width:2.6rem; padding:.2rem .6rem; border:2px solid var(--tq); border-radius:.55rem; background:var(--card); color:var(--ink); cursor:pointer}
  .m5-chip:hover{border-color:var(--orange); background:var(--or-soft)} .m5-chip.in{background:var(--tq-soft)}
  .m5-rteken{font-weight:900; color:var(--accent-dark)} .m5-rleeg{color:var(--ink-soft); font-size:.9rem; font-style:italic}
  .m5-venn{position:relative; width:100%; max-width:520px; margin:0 auto; aspect-ratio:420 / 270}
  .m5-venn-svg{position:absolute; inset:0; width:100%; height:100%}
  .m5-venn .vn-z{fill:var(--card); stroke:var(--ink); stroke-width:2} .m5-venn .vn-p{fill:rgba(214,40,40,.08); stroke:#d62828; stroke-width:2} .m5-venn .vn-m{fill:rgba(29,78,216,.08); stroke:#1d4ed8; stroke-width:2}
  .m5-venn .vn-l{font-size:20px; font-weight:800; fill:var(--ink)} .m5-venn .vn-s{font-size:13px; font-weight:700; fill:var(--ink-soft)} .m5-venn .vn-l.p{fill:#c01f1f} .m5-venn .vn-l.m{fill:#1d4ed8}
  .m5-vbak{position:absolute; display:flex; flex-wrap:wrap; gap:.2rem; align-content:center; justify-content:center; border-radius:.5rem; cursor:pointer}
  .m5-vbak .chip{font-size:.95rem; padding:.05rem .4rem}
  .m5-vpool{min-height:2.6rem}
  .m5-btab{border-collapse:collapse; font-size:1.1rem; font-weight:700; font-variant-numeric:tabular-nums}
  .m5-btab th, .m5-btab td{border:1.5px solid var(--border); padding:.2rem; text-align:center; min-width:3.6rem}
  .m5-btab th{background:var(--tq-soft)} .m5-btab th.op{background:var(--orange); color:#173436; font-size:1.3rem}
  .m5-btab input{width:3.4rem; height:2.1rem; text-align:center; font:inherit; box-sizing:border-box}
  .m5-tab{overflow-x:auto}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* ============================================================
   ONDERDELEN 1 TOT 3 · GEHELE GETALLEN, ABSOLUTE WAARDE, ORDENEN
   ============================================================ */
Object.assign(ICONS, {
  z_getal:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M8 12h3M16 9.5v5M13.5 12h5"/>',
  z_abs:'<path d="M6 4v16M18 4v16"/><path d="M10 12h4"/>',
  z_orde:'<path d="M3 15h18"/><path d="M6 12v6M12 12v6M18 12v6"/><path d="M8 7h8l-2-2M16 7l-2 2"/>'
});
const VERZ = {Z:'ℤ', Zp:'ℤ⁺', Zm:'ℤ⁻', Z0:'ℤ₀', N:'ℕ', Zp0:'ℤ⁺₀', Zm0:'ℤ⁻₀'};
const inV = (x, v) => v==='Z' ? true : v==='Zp' || v==='N' ? x>=0 : v==='Zm' ? x<=0 : v==='Z0' ? x!==0 : v==='Zp0' ? x>0 : x<0;
const GG = {};
/* ---------- 1 positief, negatief of nul ---------- */
GG.pnn = { title:'Positief, negatief of nul?', lvl:1,
  instr:'Een positief getal is groter dan 0, een negatief getal is kleiner dan 0. Het toestandsteken (+ of −) staat voor het getal. Is 0 positief of negatief?',
  build(b, st, save){
    const R = makeR(st); const L = R.shuffle([nz(R, -20, -1), nz(R, 1, 20), 0, -R.int(21, 99), R.int(21, 99), nz(R, -9, -1)]);
    reeks(b, L.length, (g, i, nr) => { const x = L[i]; const h = x>0 && R.f() < .4 ? '+' + x : zS(x);
      qChoice(g, st, save, 'k' + i, { nr, html:`<span class="m5-groot">${h}</span>`, opts:PNN, ans:tk(x), alt:x===0 ? [] : [],
        why: x===0 ? '0 is positief én negatief: 0 hoort bij ℤ⁺ en bij ℤ⁻. Kies hier "nul".' : x>0 ? 'Het getal is groter dan 0.' : 'Er staat een minteken voor: het getal is kleiner dan 0.',
        whyBad:'Kijk naar het toestandsteken voor het getal.' }); }, {een:false});
  } };
/* ---------- 2 het toestandsteken in het echt ---------- */
GG.ctx = { title:'Een getal met een teken', lvl:1,
  instr:'Schrijf elke situatie als een geheel getal. Typ een negatief getal met een minteken ervoor.',
  build(b, st, save){
    const R = makeR(st);
    const C = R.shuffle([
      n => [`${n} m onder de zeespiegel`, -n, 'm'], n => [`${n} m boven de zeespiegel`, n, 'm'], n => [`het vriest ${n} graden`, -n, '°C'],
      n => [`${n} euro schuld`, -n, 'euro'], n => [`${n} verdiepingen onder de grond`, -n, ''], n => [`het jaar ${n * 50} voor Christus`, -n*50, ''],
      n => [`een winst van ${n} euro`, n, 'euro'], n => [`${n} punten verliezen`, -n, 'punten']]).slice(0, 6).map(f => f(R.int(2, 18)));
    reeks(b, C.length, (g, i, nr) => { const [tx, T, u] = C[i];
      mQ(g, st, save, 'c' + i, { nr, html:`<span class="txt">${tx}:</span> {{u:a}} <span class="txt">${u}</span>`, check:V=>chkGt(V.a, T), sol:zS(T) }); }, {een:true});
  } };
/* ---------- 3 venndiagram ---------- */
GG.venn = { title:'Het venndiagram', lvl:1,
  instr:'ℤ⁺ zijn de positieve gehele getallen met 0, ℤ⁻ de negatieve gehele getallen met 0. Sleep elk getal naar de juiste plaats.',
  build(b, st, save){
    const R = makeR(st); const it = R.shuffle([[zS(nz(R, 1, 20)), 'pos'], [zS(R.int(21, 150)), 'pos'], [zS(nz(R, -20, -1)), 'neg'], [zS(-R.int(21, 150)), 'neg'], ['0', 'nul'], [R.pick(['2,5', '0,7', `${MIN}1,5`]), 'buiten'], [R.pick(['½', '¾', `${MIN}⅓`]), 'buiten'], ['+' + R.int(2, 9), 'pos']]);
    venn(b, st, save, 'v', {items:it, why:'0 hoort bij ℤ⁺ én bij ℤ⁻: het staat in het gemeenschappelijke deel. Een kommagetal of breuk is geen geheel getal.'});
  } };
/* ---------- 4 ∈ of ∉ ---------- */
GG.el = { title:'Hoort het erbij? ∈ of ∉', lvl:1,
  instr:'∈ betekent "is een element van", ∉ betekent "is geen element van". ℤ₀ zijn de gehele getallen zonder 0, ℕ = ℤ⁺ = {0, 1, 2, …}.',
  build(b, st, save){
    const R = makeR(st); const V = ['Z', 'Zp', 'Zm', 'Z0', 'N', 'Zp0', 'Zm0'];
    const L = []; for(let k=0; k<200 && L.length<8; k++){ const x = R.pick([0, nz(R, -15, 15), nz(R, -15, 15)]), v = R.pick(V); if(L.some(l => l[0]===x && l[1]===v)) continue; if(L.filter(l => inV(l[0], l[1])).length > 5 && inV(x, v)) continue; L.push([x, v]); }
    reeks(b, L.length, (g, i, nr) => { const [x, v] = L[i]; const ok = inV(x, v);
      qChoice(g, st, save, 'e' + i, { nr, html:`<span class="m5-groot">${zS(x)} … ${VERZ[v]}</span>`, opts:[['in', '∈'], ['uit', '∉']], sym:true, ans:ok ? 'in' : 'uit',
        why:`${zS(x)} ${ok ? '∈' : '∉'} ${VERZ[v]}.`, whyBad:'ℤ⁺: 0 en de positieve getallen. ℤ⁻: 0 en de negatieve getallen. Een 0 onderaan betekent: zonder 0.' }); });
  } };
/* ---------- 5 ⊂ of ⊄ ---------- */
GG.deel = { title:'Deelverzameling: ⊂ of ⊄', lvl:2,
  instr:'A ⊂ B betekent: elk element van A is ook een element van B. Zoek je één element van A dat niet in B zit, dan is A ⊄ B.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['ℕ', 'ℤ', 1, 'Elk natuurlijk getal is een geheel getal.'], ['ℤ', 'ℕ', 0, `${MIN}1 ∈ ℤ, maar ${MIN}1 ∉ ℕ.`], ['ℤ⁻', 'ℤ₀', 0, '0 ∈ ℤ⁻, maar 0 ∉ ℤ₀.'], ['ℤ⁻₀', 'ℤ₀', 1, 'De negatieve getallen zonder 0 zitten allemaal in ℤ₀.'],
      ['ℤ⁺', 'ℕ', 1, 'ℤ⁺ en ℕ zijn dezelfde verzameling.'], [`{${MIN}3, 0, 2}`, 'ℤ⁻', 0, '2 ∉ ℤ⁻.'], [`{${MIN}5, ${MIN}1}`, 'ℤ⁻₀', 1, 'Beide getallen zijn negatief.'], ['ℤ₀', 'ℤ', 1, 'Zonder 0 blijven het gehele getallen.'], ['{0}', 'ℤ⁺₀', 0, '0 ∉ ℤ⁺₀.']]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [A, B, ok, why] = L[i];
      qChoice(g, st, save, 'd' + i, { nr, html:`<span class="m5-groot">${A} … ${B}</span>`, opts:[['in', '⊂'], ['uit', '⊄']], sym:true, ans:ok ? 'in' : 'uit', why, whyBad:'Zoek een element van de eerste verzameling dat niet in de tweede zit.' }); });
  } };
/* ---------- verdieping ---------- */
GG.wnw = { title:'Waar of niet waar?', lvl:3,
  instr:'Lees elke uitspraak goed. Is ze altijd waar?',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['Elk natuurlijk getal is een geheel getal.', 'w', 'ℕ ⊂ ℤ.'], ['Elk geheel getal is een natuurlijk getal.', 'n', `${MIN}4 is geheel, maar niet natuurlijk.`],
      ['0 is een element van ℤ₀.', 'n', 'ℤ₀ is ℤ zonder 0.'], ['Er bestaat een grootste negatief geheel getal.', 'w', `${MIN}1 is het grootste negatieve gehele getal.`], ['Er bestaat een kleinste negatief geheel getal.', 'n', 'Je kunt altijd nog 1 aftrekken.'],
      ['ℤ⁺ ∩ ℤ⁻ = {0}.', 'w', '0 is het enige getal dat in allebei zit.'], ['ℤ⁺ ∪ ℤ⁻ = ℤ.', 'w', 'Elk geheel getal is positief, negatief of 0.'], ['ℤ⁺₀ ∪ ℤ⁻₀ = ℤ.', 'n', '0 zit in geen van beide.']]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [z, ans, why] = L[i]; qChoice(g, st, save, 'w' + i, { nr, html:z, opts:WNW, ans, why, whyBad:'Zoek een voorbeeld dat de uitspraak tegenspreekt, of denk aan 0.' }); }, {een:true});
  } };
GG.tel = { title:'Hoeveel elementen?', lvl:3,
  instr:'Schrijf de elementen in gedachten op en tel ze.',
  build(b, st, save){
    const R = makeR(st); const a = -R.int(3, 9), c = R.int(2, 8), d = R.int(2, 6), e = -R.int(5, 12);
    const L = [[`{<i>x</i> ∈ ℤ | ${zS(a)} &lt; <i>x</i> &lt; ${c}}`, c - a - 1], [`{<i>x</i> ∈ ℤ | ${zS(a)} ≤ <i>x</i> ≤ ${c}}`, c - a + 1], [`{<i>x</i> ∈ ℤ⁻ | <i>x</i> ≥ ${zS(e)}}`, -e + 1], [`{<i>x</i> ∈ ℤ₀ | ${zS(-d)} ≤ <i>x</i> ≤ ${d}}`, 2*d]];
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i]; mQ(g, st, save, 't' + i, { nr, html:`${h} heeft {{u:a}} <span class="txt">elementen</span>`, check:V=>chkG(V.a, T, [[T + 1, 'Let op: &lt; betekent dat de grens er niet bij hoort.'], [T - 1, 'Vergeet 0 niet, of de grens als er ≤ of ≥ staat.']]), sol:`${T} elementen` }); }, {een:true});
  } };
GG.welkeV = { title:'Welke verzameling?', lvl:2,
  instr:'Welke verzameling wordt hier opgesomd? Let op de 0 en op de puntjes.',
  build(b, st, save){
    const R = makeR(st); const O = ['N', 'Z', 'Zp', 'Zm', 'Z0', 'Zp0', 'Zm0'].map(v => [v, VERZ[v]]);
    const L = R.shuffle([[`{0, 1, 2, 3, …}`, 'N', ['Zp'], 'ℕ en ℤ⁺ zijn dezelfde verzameling: 0 en de positieve getallen.'], [`{…, ${MIN}3, ${MIN}2, ${MIN}1, 0}`, 'Zm', [], 'De negatieve getallen en 0.'], [`{1, 2, 3, …}`, 'Zp0', [], 'De positieve getallen zonder 0.'],
      [`{…, ${MIN}3, ${MIN}2, ${MIN}1}`, 'Zm0', [], 'De negatieve getallen zonder 0.'], [`{…, ${MIN}2, ${MIN}1, 1, 2, …}`, 'Z0', [], 'Alle gehele getallen behalve 0.'], [`{…, ${MIN}2, ${MIN}1, 0, 1, 2, …}`, 'Z', [], 'Alle gehele getallen.']]);
    reeks(b, L.length, (g, i, nr) => { const [h, ans, alt, why] = L[i]; qChoice(g, st, save, 'v' + i, { nr, html:`<span class="m5-groot">${h}</span>`, opts:O, sym:true, ans, alt, why, whyAlt:why }); }, {een:true});
  } };
const CHEAT_GETAL = `<h3>Spiekbriefje · gehele getallen</h3><table>
  <tr><td>ℤ</td><td>de gehele getallen: {…, ${MIN}2, ${MIN}1, 0, 1, 2, …}</td></tr>
  <tr><td>ℤ⁺ = ℕ</td><td>0 en de positieve gehele getallen</td></tr><tr><td>ℤ⁻</td><td>0 en de negatieve gehele getallen</td></tr>
  <tr><td>ℤ₀</td><td>de gehele getallen zonder 0 (ook ℤ⁺₀ en ℤ⁻₀)</td></tr>
  <tr><td>∈ ∉</td><td>is (geen) element van: ${MIN}3 ∈ ℤ, ${MIN}3 ∉ ℕ</td></tr><tr><td>⊂ ⊄</td><td>is (geen) deelverzameling van: ℕ ⊂ ℤ</td></tr></table>`;
SEC.getal = { id:'getal', ic:'z_getal', nav:'Gehele getallen', title:'Gehele getallen en verzamelingen',
  tip:'Een geheel getal is een natuurlijk getal met een toestandsteken: + of −. 0 heeft geen teken: het is positief én negatief.',
  cheat:CHEAT_GETAL, cards:[GG.pnn, GG.ctx, GG.venn, GG.el, GG.deel, GG.welkeV, GG.wnw, GG.tel] };

/* ============================================================ 2 absolute waarde en tegengestelde */
const AB = {};
AB.afst = { title:'Afstand tot 0', lvl:1,
  instr:'De absolute waarde van een getal is de afstand van dat getal tot 0 op de getallenas. Een afstand is nooit negatief.',
  build(b, st, save){
    const R = makeR(st); const L = [nz(R, -9, -2), R.int(2, 9), nz(R, -9, -3)];
    naElkaar(b, st, save, L.length, (host, i, klaar) => { const x = L[i]; const B = asBereik([x, -x], 12);
      asKies(host, st, save, 'a' + i, Object.assign({}, B, { punten:[{x, cls:'start', lab:zS(x)}], vraag:`Het punt staat bij <b>${zS(x)}</b>. Klik op het getal dat even ver van 0 ligt, aan de andere kant.`, T:-x,
        sprongen:[{van:0, naar:x, lab:String(Math.abs(x)), cls:'pos'}, {van:0, naar:-x, lab:String(Math.abs(x)), cls:'pos'}], why:`${zS(x)} en ${zS(-x)} liggen allebei ${Math.abs(x)} stappen van 0.`, whyBad:'Tel de stappen van het punt tot 0 en spring even ver aan de andere kant.',
        naKop:'Vul aan', na:(vak, ok) => mQ(vak, st, save, 'u' + i, { noCL:true, html:`|${zS(x)}| ${isq} {{u:a}} <span class="txt">en</span> |${zS(-x)}| ${isq} {{u:b}}`, check:V=>allOf([['a', chkG(V.a, Math.abs(x), [[x, 'Een absolute waarde is nooit negatief.']])], ['b', chkG(V.b, Math.abs(x), [[-Math.abs(x), 'Een absolute waarde is nooit negatief.']])]]), onOk:s=>{ if(!s) ok(); } }), onOk:klaar })); },
      'De absolute waarde is de afstand tot 0. Een getal en zijn tegengestelde hebben dezelfde absolute waarde.', L.map(x => `|${zS(x)}| = ${Math.abs(x)}`));
  } };
AB.teg = { title:'Het tegengestelde', lvl:1,
  instr:'Het tegengestelde van een getal ligt even ver van 0, aan de andere kant. Het tegengestelde van 5 is −5, het tegengestelde van −5 is 5. Je schrijft het met een minteken: −(−5) = 5.',
  build(b, st, save){
    const R = makeR(st); const L = R.shuffle([nz(R, -20, -1), R.int(1, 20), nz(R, -20, -1), R.int(21, 99), -R.int(21, 99), 0]);
    reeks(b, L.length, (g, i, nr) => { const x = L[i];
      mQ(g, st, save, 't' + i, { nr, html:`<span class="txt">het tegengestelde van</span> ${zS(x)} ${isq} {{u:a}}`, check:V=>chkG(V.a, -x, [[x, 'Het tegengestelde ligt aan de andere kant van 0: verander het teken.']]), sol:`${MIN}${zP(x)} ${isq} ${zS(-x)}` }); });
  } };
AB.ber = { title:'Absolute waarde en tegengestelde', lvl:1,
  instr:'Bereken. |…| is de absolute waarde, een minteken voor de haakjes is het tegengestelde.',
  build(b, st, save){
    const R = makeR(st); const p = () => R.int(2, 20);
    const L = R.shuffle([[x => `|${zS(-x)}|`, x => x], [x => `|${x}|`, x => x], [x => `${MIN}(${zS(-x)})`, x => x], [x => `${MIN}(+${x})`, x => -x], [x => `${MIN}|${zS(-x)}|`, x => -x], [x => `|${MIN}(${zS(-x)})|`, x => x], [x => `${MIN}(${MIN}(${zS(-x)}))`, x => -x], [x => `${MIN}|${x}|`, x => -x]]).slice(0, 8);
    reeks(b, L.length, (g, i, nr) => { const x = p(); const [h, w] = L[i]; const T = w(x);
      mQ(g, st, save, 'b' + i, { nr, html:`${h(x)} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), hint: (h(x).match(/[(|−]/g)||[]).length > 2 ? ['Werk van binnen naar buiten: eerst wat het dichtst bij het getal staat.'] : undefined, sol:`${h(x)} ${isq} ${zS(T)}` }); });
  } };
AB.welke = { title:'Welke getallen?', lvl:2,
  instr:'Zoek alle gehele getallen die passen. Er zijn er soms twee, soms één, soms geen. Typ ze gescheiden door een puntkomma, bijvoorbeeld 4; −4. Is er geen, typ dan geen.',
  build(b, st, save){
    const R = makeR(st); const n = R.int(2, 15), m = R.int(2, 15);
    const L = R.shuffle([[`|<i>x</i>| = ${n}`, [n, -n]], ['|<i>x</i>| = 0', [0]], [`|<i>x</i>| = ${MIN}${m}`, []], [`${MIN}<i>x</i> = ${n}`, [-n]], [`${MIN}<i>x</i> = ${MIN}${m}`, [m]], [`|<i>x</i>| = ${m} en <i>x</i> &lt; 0`, [-m]]]).slice(0, 5);
    const lees = t => { t = nrm(t||'').toLowerCase(); if(/^geen/.test(t)) return []; const d = t.split(/[;]|\sen\s|\sof\s/).map(x => x.trim()).filter(Boolean); const v = d.map(x => rdZ({t:x, z:true})); return v.some(x => x==null) ? null : v; };
    reeks(b, L.length, (g, i, nr) => { const [h, S] = L[i];
      mQ(g, st, save, 'w' + i, { nr, html:`${h}: <i>x</i> ${isq} {{g:a}}`, check:V=>{ const v = lees((V.a||{}).t); if(v==null) return {info:true, msg:'Typ de getallen gescheiden door een puntkomma, of typ geen.'};
          const ok = v.length===S.length && S.every(x => v.includes(x)); return ok ? {ok:true} : {ok:false, msg: S.length===2 && v.length===1 ? 'Er is nog een tweede getal.' : !S.length ? 'Een absolute waarde kan niet negatief zijn.' : ''}; },
        sol:S.length ? S.map(zS).join(' of ') : 'geen' }); }, {een:true});
  } };
AB.reken = { title:'Rekenen met absolute waarden', lvl:2,
  instr:'Bereken eerst elke absolute waarde. Reken daarna uit.',
  build(b, st, save){
    const R = makeR(st); const L = [0, 1, 2, 3, 4, 5].map(k => { const a = nz(R, -30, 30), c = nz(R, -30, 30);
      return k % 3===0 ? `|${zS(a)}| + |${zS(c)}|` : k % 3===1 ? `|${zS(a)}| − |${zS(c)}|` : `${MIN}|${zS(a)}| + ${zP(c)}`; });
    reeks(b, L.length, (g, i, nr) => { const E = L[i]; const T = ZX.waarde(E).k;
      mQ(g, st, save, 'r' + i, { nr, html:`${E} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), hint:['Schrijf eerst elke absolute waarde als getal. Een absolute waarde is nooit negatief.'], sol:`${E} ${isq} ${zS(T)}` }); });
  } };
AB.vgl = { title:'Vergelijk zonder te rekenen', lvl:3,
  instr:'Vul in met &lt;, = of &gt;.',
  build(b, st, save){
    const R = makeR(st); const a = R.int(3, 12), c = R.int(3, 12);
    const L = R.shuffle([[`|${MIN}${a}|`, `${MIN}${a}`, a, -a], [`${MIN}|${MIN}${c}|`, `${MIN}(${MIN}${c})`, -c, c], [`|${MIN}${a}|`, `|${a}|`, a, a], [`${MIN}(${MIN}${a})`, `|${MIN}${c}|`, a, c], [`${MIN}|${a}|`, `${MIN}|${MIN}${c}|`, -a, -c], [`|${a} − ${a + c}|`, `${c}`, c, c]]);
    reeks(b, L.length, (g, i, nr) => { const [l, r, x, y] = L[i]; const ans = x<y ? '<' : x>y ? '>' : '=';
      qChoice(g, st, save, 'v' + i, { nr, html:`<span class="m5-groot">${l} … ${r}</span>`, opts:VGL, sym:true, ans, why:`${l} = ${zS(x)} en ${r} = ${zS(y)}.` }); });
  } };
AB.hoeveel = { title:'Hoeveel gehele getallen?', lvl:3,
  instr:'Hoeveel gehele getallen voldoen aan de voorwaarde?',
  build(b, st, save){
    const R = makeR(st); const n = R.int(3, 12), m = R.int(3, 12), k = R.int(2, 6);
    const L = [[`|<i>x</i>| &lt; ${n}`, 2*n - 1], [`|<i>x</i>| ≤ ${m}`, 2*m + 1], [`|<i>x</i>| ≤ ${k} en <i>x</i> ≠ 0`, 2*k], [`${k} ≤ |<i>x</i>| ≤ ${k + 3}`, 8]];
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i]; mQ(g, st, save, 'h' + i, { nr, html:`${h}: {{u:a}} <span class="txt">gehele getallen</span>`, check:V=>chkG(V.a, T, [[T - 1, 'Vergeet 0 of de grens niet.'], [Math.floor(T/2), 'Ook de negatieve getallen tellen mee.']]), sol:`${T}` }); }, {een:true});
  } };
AB.ctx = { title:'Absolute waarde in het echt', lvl:2,
  instr:'De absolute waarde is de afstand tot 0. Lees goed wat er gevraagd wordt.',
  build(b, st, save){
    const R = makeR(st); const d = R.int(5, 40), t = R.int(2, 15), s = R.int(10, 90), a = R.int(2, 5);
    const L = [[`Een duiker zwemt op ${zS(-d)} m. Hoeveel meter is hij van het wateroppervlak verwijderd?`, d, 'm'], [`Het is ${zS(-t)} °C. Hoeveel graden onder nul is dat?`, t, '°C'],
      [`Het saldo van Lina is € ${zS(-s)}. Hoeveel euro schuld heeft ze?`, s, 'euro'], [`Een lift staat op verdieping ${zS(-a)}. Hoeveel verdiepingen is hij van het gelijkvloers (verdieping 0) verwijderd?`, a, 'verdiepingen']];
    reeks(b, L.length, (g, i, nr) => { const [tx, T, eh] = L[i]; mQ(g, st, save, 'c' + i, { nr, html:`<span class="txt">${tx}</span> {{u:a}} <span class="txt">${eh}</span>`, check:V=>chkG(V.a, T, [[-T, 'Een afstand is nooit negatief: neem de absolute waarde.']]), sol:`${T} ${eh}` }); }, {een:true});
  } };
const CHEAT_ABS = `<h3>Spiekbriefje · absolute waarde en tegengestelde</h3><table>
  <tr><td>|${MIN}7| = 7</td><td>de absolute waarde is de afstand tot 0; ze is nooit negatief</td></tr>
  <tr><td>${MIN}(${MIN}7) = 7</td><td>het tegengestelde: aan de andere kant van 0, even ver</td></tr>
  <tr><td>${MIN}|${MIN}7| = ${MIN}7</td><td>werk van binnen naar buiten</td></tr></table>`;
SEC.abs = { id:'abs', ic:'z_abs', nav:'Absolute waarde', title:'Absolute waarde en tegengestelde',
  tip:'De absolute waarde is de afstand tot 0. Het tegengestelde vind je door het getal te spiegelen in 0.',
  cheat:CHEAT_ABS, cards:[AB.afst, AB.teg, AB.ber, AB.welke, AB.reken, AB.ctx, AB.vgl, AB.hoeveel] };

/* ============================================================ 3 ordenen en de getallenas */
const OR = {};
OR.lees = { title:'Lees af op de getallenas', lvl:1,
  instr:'Welk getal hoort bij elk punt?',
  build(b, st, save){
    const R = makeR(st); const lo = -R.int(8, 12), hi = lo + 16; const X = R.shuffle([...Array(hi - lo - 1).keys()].map(k => lo + 1 + k).filter(x => x)).slice(0, 4).sort((x, y) => x - y);
    const lab = R.shuffle(['A', 'B', 'C', 'D']);
    b.append(el('div', 'm4-vis', asSvg({lo, hi, punten:X.map((x, j) => ({x, lab:lab[j]})), alt:'getallenas met punten', maxw:640})));
    reeks(b, X.length, (g, i, nr) => { const j = lab.indexOf('ABCD'[i]); mQ(g, st, save, 'l' + i, { nr, html:`${'ABCD'[i]} ${isq} {{u:a}}`, check:V=>chkG(V.a, X[j]), sol:zS(X[j]) }); });
  } };
OR.verd = { title:'Getallenas met een eigen verdeling', lvl:2,
  instr:'Niet elk streepje is 1. Zoek eerst hoeveel één stap waard is.',
  build(b, st, save){
    const R = makeR(st); const stap = R.pick([2, 5, 10, 25]), n0 = -R.int(3, 6), n = 12; const W = k => (n0 + k)*stap;
    const ks = R.shuffle([...Array(n + 1).keys()].filter(k => k!==-n0 && k!==-n0 + 1 && k)).slice(0, 3);
    const W2 = 640, pad = 30, X = k => pad + k*(W2 - 2*pad)/n;
    let s = `<line class="as-l" x1="${pad-14}" y1="60" x2="${W2-pad+12}" y2="60"/><path class="as-pk" d="M${W2-pad+18} 60 l-9 -5 v10z"/>`;
    for(let k=0; k<=n; k++) s += `<line class="as-t${W(k)===0 ? ' nul' : ''}" x1="${fx(X(k))}" y1="53" x2="${fx(X(k))}" y2="67"/>`;
    [-n0, -n0 + 1].forEach(k => { s += sT(X(k), 84, zS(W(k)), W(k)===0 ? 't as-0' : 'k'); });
    ks.forEach((k, j) => { s += `<circle class="as-p" cx="${fx(X(k))}" cy="60" r="7"/>` + sT(X(k), 38, 'PQR'[j], 'as-lab'); });
    b.append(el('div', 'm4-vis', svgWrap(W2, 100, s, {alt:'getallenas met een eigen verdeling', maxw:640, cls:'m5-as'})));
    reeks(b, ks.length, (g, i, nr) => { mQ(g, st, save, 'v' + i, { nr, html:`${'PQR'[i]} ${isq} {{u:a}}`, check:V=>chkG(V.a, W(ks[i]), [[n0 + ks[i], `Eén stap is ${stap}, niet 1.`]]), hint:[`Van 0 naar ${stap} is één stap. Elke stap is dus ${stap} waard.`], sol:zS(W(ks[i])) }); });
  } };
OR.vgl = { title:'Groter of kleiner?', lvl:1,
  instr:'Vul in met &lt; of &gt;. Op de getallenas ligt het kleinste getal het meest links.',
  build(b, st, save){
    const R = makeR(st); const L = R.shuffle([[nz(R, -9, -1), R.int(1, 9)], [-R.int(2, 9), -R.int(10, 19)], [0, nz(R, -9, -1)], [-R.int(11, 20), -R.int(1, 10)], [R.int(1, 15), 0], [-R.int(20, 60), R.int(1, 5)]]);
    reeks(b, L.length, (g, i, nr) => { const [x, y] = R.f() < .5 ? L[i] : L[i].slice().reverse(); const ans = x<y ? '<' : '>';
      qChoice(g, st, save, 'g' + i, { nr, html:`<span class="m5-groot">${zS(x)} … ${zS(y)}</span>`, opts:VGL.filter(o => o[0]!=='='), sym:true, ans, why:`${zS(x<y ? x : y)} ligt links van ${zS(x<y ? y : x)} op de getallenas.`, whyBad:'Bij negatieve getallen: hoe groter de absolute waarde, hoe kleiner het getal.' }); });
  } };
OR.rang = { title:'Rangschik', lvl:1,
  instr:'Klik de getallen in de juiste volgorde aan. Klik je fout, klik dan op een getal in de rij om terug te gaan.',
  build(b, st, save){
    const R = makeR(st); const G = () => { const S = new Set(); while(S.size<6) S.add(R.pick([nz(R, -20, 20), -R.int(1, 9), R.int(0, 9)])); return R.shuffle([...S]).map(w => ({w, h:zS(w)})); };
    rangschik(b, st, save, 'r1', {getallen:G(), nr:'a)'}); rangschik(b, st, save, 'r2', {getallen:G(), op:false, nr:'b)'});
  } };
OR.groen = { title:'Temperaturen in Groenland', lvl:2,
  instr:'In Nuuk (Groenland) is het in de winter flink koud. Bekijk de gemiddelde temperatuur per maand.',
  build(b, st, save){
    const R = makeR(st); const M = ['jan', 'feb', 'maa', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const T = [-8, -8, -9, -4, 1, 4, 7, 6, 3, -2, -5, -7].map(t => t + R.int(-1, 1));
    b.append(el('div', 'm4-vis m5-twee', [0, 6].map(k => `<table class="m5-btab"><tr>${M.slice(k, k + 6).map(m => `<th>${m}</th>`).join('')}</tr><tr>${T.slice(k, k + 6).map(t => `<td>${zS(t)}</td>`).join('')}</tr></table>`).join('')));
    const mn = Math.min(...T), mx = Math.max(...T);
    const kies = (id, nr, html, ans, why) => qChoice(b.querySelector('.m4-items') || b, st, save, id, { nr, html, opts:M.map((m, j) => ['' + j, m]), ans, alt:M.map((m, j) => '' + j).filter(j => T[+j]===T[+ans] && j!==ans), why });
    const g = el('div', 'm4-items een'); b.append(g);
    kies('k1', 'a)', 'In welke maand is het het koudst?', '' + T.indexOf(mn), `${zS(mn)} °C is de laagste temperatuur.`);
    kies('k2', 'b)', 'In welke maand is het het warmst?', '' + T.indexOf(mx), `${zS(mx)} °C is de hoogste temperatuur.`);
    mQ(g, st, save, 'n', { nr:'c)', html:`<span class="txt">In hoeveel maanden is het gemiddeld kouder dan 0 °C?</span> {{u:a}}`, check:V=>chkG(V.a, T.filter(t => t<0).length), sol:'' + T.filter(t => t<0).length });
    const r = el('div'); g.append(r); rangschik(r, st, save, 'r', {getallen:R.shuffle(T.slice(0, 6).map((w, j) => ({w, h:`${M[j]}: ${zS(w)}°`}))), nr:'d)', why:'Van de koudste naar de warmste maand.'});
  } };
OR.race = { title:'Getallenas-race', lvl:2,
  instr:'Klik zo snel mogelijk op het getal dat bovenaan staat. 10 getallen, de tijd loopt. Dit spel telt niet mee.',
  build(b, st, save){
    const box = el('div', 'm5-race'); b.append(box); let timer = null;
    const intro = () => { box.innerHTML = ''; box.append(el('p', '', st.best ? `Jouw beste tijd: <b>${(st.best/10).toFixed(1)} s</b>.` : 'Klaar? Start de race.')); const go = el('button', 'btn', '▶ Start'); go.type = 'button'; go.addEventListener('click', start); box.append(go); };
    function start(){ const R = makeR({seed:1 + Math.floor(Math.random()*2e9)}); const lo = -15, hi = 15; let k = 0, fout = 0; const t0 = Date.now();
      box.innerHTML = ''; const kop = el('div', 'm5-race-kop'), fig = el('div', 'm5-asbox sleep'), fb = el('div', 'fb'); box.append(kop, fig, fb);
      let doel = nz(R, lo + 1, hi - 1);
      const teken = () => { kop.innerHTML = `<span>Getal ${k + 1} / 10</span> <b class="m5-race-doel">${zS(doel)}</b> <span>${fout} fout</span>`; fig.innerHTML = asSvg({lo, hi, alt:'getallenas van −15 tot 15'}); };
      fig.onclick = e => { const v = asKlik(fig.querySelector('svg'), e, {lo, hi});
        if(v===doel){ k++; fb.className = 'fb ok'; fb.textContent = '✓'; if(k>=10){ const t = Math.round((Date.now() - t0)/100) + fout*20; if(!st.best || t < st.best){ st.best = t; save(); } box.innerHTML = ''; box.append(el('div', 'qz-groot', (t/10).toFixed(1) + ' s'), el('p', '', `${fout} keer fout (2 s straf per fout). ${st.best===t ? 'Dat is jouw beste tijd!' : 'Jouw beste tijd: ' + (st.best/10).toFixed(1) + ' s.'}`)); const nog = el('button', 'btn', '↻ Nog eens'); nog.type = 'button'; nog.addEventListener('click', start); box.append(nog); return; }
          let d; do{ d = nz(R, lo + 1, hi - 1); }while(d===doel); doel = d; teken(); }
        else { fout++; fb.className = 'fb bad'; fb.textContent = `Dat is ${zS(v)}.`; teken(); } };
      teken(); }
    intro();
  } };
OR.midden = { title:'Tussen en in het midden', lvl:3,
  instr:'Denk aan de getallenas. Teken hem in gedachten of op een kladblad.',
  build(b, st, save){
    const R = makeR(st); const a = -R.int(5, 30), c = R.int(3, 30), d = -R.int(4, 20)*2, e = R.int(1, 10)*2 + (d % 4 ? 0 : 2);
    const L = [[`Hoeveel gehele getallen liggen er tussen ${zS(a)} en ${c}?`, c - a - 1], [`Welk getal ligt precies in het midden van ${zS(d)} en ${zS(e)}?`, (d + e)/2],
      [`Welk geheel getal ligt ${c} plaatsen links van ${zS(a)}?`, a - c], [`Het midden van ${zS(a)} en een ander getal is ${zS(a + c)}. Wat is dat andere getal?`, a + 2*c]];
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i]; mQ(g, st, save, 'm' + i, { nr, html:`<span class="txt">${h}</span> {{u:a}}`, check:V=>chkG(V.a, T), sol:zS(T) }); }, {een:true});
  } };
OR.rang2 = { title:'Rangschik met absolute waarden', lvl:3,
  instr:'Bereken eerst in gedachten elke uitdrukking. Rangschik dan.',
  build(b, st, save){
    const R = makeR(st); const a = R.int(2, 9), c = R.int(2, 9), d = R.int(2, 9), e = R.int(2, 9);
    const G = [[`|${MIN}${a}|`, a], [`${MIN}|${c}|`, -c], [`${MIN}(${MIN}${d})`, d], [`${MIN}|${MIN}${e}|`, -e], [`${MIN}(+${a + 1})`, -a - 1], ['0', 0]];
    const S = new Set(), U = G.filter(([, w]) => S.has(w) ? false : (S.add(w), true));
    rangschik(b, st, save, 'r', {getallen:R.shuffle(U.map(([h, w]) => ({w, h}))), why:'Bereken eerst elke uitdrukking: dan kun je ze op de getallenas zetten.'});
  } };
const CHEAT_ORDE = `<h3>Spiekbriefje · ordenen</h3><table>
  <tr><td>getallenas</td><td>hoe meer naar links, hoe kleiner: ${MIN}8 &lt; ${MIN}3 &lt; 0 &lt; 2</td></tr>
  <tr><td>twee negatieve getallen</td><td>het getal met de grootste absolute waarde is het kleinste: ${MIN}15 &lt; ${MIN}4</td></tr>
  <tr><td>verdeling</td><td>zoek eerst hoeveel één streepje waard is</td></tr></table>`;
SEC.orde = { id:'orde', ic:'z_orde', nav:'Ordenen', title:'Ordenen en de getallenas',
  tip:'Op de getallenas staan de getallen van klein (links) naar groot (rechts). Elk negatief getal is kleiner dan 0 en dan elk positief getal.',
  cheat:CHEAT_ORDE, cards:[OR.lees, OR.vgl, OR.rang, OR.verd, OR.groen, OR.race, OR.midden, OR.rang2] };
(function(){ const s = document.createElement('style'); s.textContent = `
  .m5-twee{display:flex; flex-wrap:wrap; gap:.5rem} .m5-twee .m5-btab th, .m5-twee .m5-btab td{min-width:2.9rem}
  .m5-race{display:flex; flex-direction:column; gap:.5rem}
  .m5-race-kop{display:flex; gap:1rem; align-items:center; font-weight:700; color:var(--accent-dark)} .m5-race-doel{font-size:2rem; color:var(--ink); min-width:3rem; text-align:center}
  `; document.head.append(s); })();
/* ============================================================
   ONDERDEEL · OPTELLEN VAN GEHELE GETALLEN
   basis: getallen tot 20, oefenen: tot 100, verdieping: groter en redeneren
   ============================================================ */
const nz = (R, lo, hi) => { let x = 0; while(!x) x = R.int(lo, hi); return x; };
/* som als tekst: −7 + (−3) */
const somT = (a, b) => `${zS(a)} + ${zP(b)}`;
/* een paar termen voor optellen; soort: 'zz' beide negatief, 'pn' positief + negatief, 'np', 'pp' */
function somPaar(R, soort, max){
  for(let k=0; k<200; k++){
    const p = R.int(1, max), q = R.int(1, max);
    const [a, b] = soort==='zz' ? [-p, -q] : soort==='pn' ? [p, -q] : soort==='np' ? [-p, q] : [p, q];
    if(Math.abs(a + b) <= max && a + b!==0 && p!==q) return [a, b];
  }
  return [-3, -4];
}
/* hint bij een som: welk teken, welke bewerking met de absolute waarden */
function somHint(a, b, tv){
  const T = a + b, p = Math.abs(a), q = Math.abs(b), u = tv ? ',t' : '';
  const zelfde = (a<0)===(b<0);
  const s1 = zelfde ? `De termen hebben hetzelfde teken (${a<0 ? 'beide negatief' : 'beide positief'}). Behoud het teken en tel de absolute waarden op: ${p} + ${q}.`
    : `De termen hebben een verschillend teken. ${zS(Math.abs(a)>Math.abs(b) ? a : b)} heeft de grootste absolute waarde, dus de uitkomst is ${T<0 ? 'negatief' : 'positief'}. Trek af: ${Math.max(p, q)} − ${Math.min(p, q)}.`;
  const reken = zelfde ? `${p} + ${q}` : `${Math.max(p, q)} − ${Math.min(p, q)}`;
  const vtk = T<0 ? MIN : '+';
  return [s1, {u:'Vul aan.', line:`${somT(a, b)} ${isq} ${vtk} (${reken}) ${isq} {{u:a${u}}}`, check:V=>chkZG(V.a, T), show:`${somT(a, b)} ${isq} ${vtk} (${reken}) ${isq} ${zS(T)}`}];
}
const somMeer = (a, b) => host => { host.innerHTML = '<p>Op de getallenas: start bij ' + zS(a) + ' en spring ' + Math.abs(b) + (b<0 ? ' naar links.' : ' naar rechts.') + '</p>' + asSvg(Object.assign(asBereik([a, a+b]), {W:480, sprongen:[{van:a, naar:a+b, lab:'+ ' + zP(b), cls:b<0 ? 'neg' : 'pos'}], punten:[{x:a, cls:'start'}, {x:a+b}], maxw:520})); };

const OP = {};
/* ---------- 1 ontdek het patroon ---------- */
OP.patroon = { title:'Ontdek het patroon', lvl:1,
  instr:'Reken de sommen van boven naar onder uit. Kijk hoe de staven en de getallenas veranderen.',
  build(b, st, save){
    const R = makeR(st); const a = R.pick([3, 4, 5, -2, -3, -4]); const B = [3, 2, 1, 0, -1, -2, -3]; if(!st.k) st.k = {}; if(st.i==null) st.i = 0;
    const P = paneel(b); const staaf = el('div'), figH = el('div'), uitl = el('p', 'm5-tip'); P.vis.append(staaf, figH, uitl);
    const ber = asBereik([a - 3, a + 3], 12); const lo = Math.min(0, a - 3) - 1, hi = Math.max(0, a + 3) + 1;
    stapKop(P.stap, 1, 'Reken uit, van boven naar onder.'); const lijst = el('div'), g = el('div'); P.stap.append(lijst, g);
    const k2 = stapKop(P.stap, 2, 'Wat valt je op?'); const bes = el('div'); P.stap.append(bes);
    const fig = (anim) => { const i = st.i ? st.i - 1 : null; const pt = [{x:a, cls:'start'}]; B.forEach((x, j) => { if(j < st.i && x) pt.push({x:a + x}); });
      const sp = i!=null && B[i] ? [{van:a, naar:a + B[i], lab:'+ ' + zP(B[i]), cls:B[i]<0 ? 'neg' : 'pos', nieuw:anim}] : [];
      staaf.innerHTML = staafSvg({lab:B.map(x => '+ ' + zP(x)), w:B.map((x, j) => j < st.i ? a + x : null), lo, hi, nu:st.i, nieuw:anim ? st.i - 1 : -1});
      figH.innerHTML = asSvg(Object.assign({}, ber, {W:440, punten:pt, sprongen:sp, alt:'getallenas met de uitkomsten', maxw:520}));
      uitl.innerHTML = i==null ? `Start bij <b>${zS(a)}</b>.` : B[i]>0 ? `${zP(B[i])} optellen: ${B[i]} naar <b>rechts</b>.` : B[i]<0 ? `${zP(B[i])} optellen: ${-B[i]} naar <b>links</b>.` : '0 optellen: je blijft staan.'; };
    const toon = anim => { lijst.innerHTML = vinkLijst(B.slice(0, st.i).map(x => `${somT(a, x)} = ${zS(a + x)}`));
      g.innerHTML = ''; fig(anim); k2.classList.toggle('uit', st.i < B.length);
      if(st.i < B.length){ const i = st.i, x = B[i];
        mQ(g, st, save, 'p' + i, { html:`${somT(a, x)} ${isq} {{u:a}}`, check:V=>chkGt(V.a, a + x, [[a - x, 'Kijk naar het patroon: telkens 1 minder optellen geeft 1 minder.']]),
          onOk:silent=>{ if(!silent && st.i===i){ st.k[i] = 1; st.i++; save(); setTimeout(()=>toon(true), 500); } } });
        const f = g.querySelector('.m4-teken button'); if(f && anim) f.focus({preventScroll:true}); }
      else besluit(); };
    toon(false);
    function besluit(){ if(bes.firstChild) return;
      qChoice(bes, st, save, 'bes', { html:'Wat gebeurt er als je een <b>negatief</b> getal optelt?', opts:[['l', 'je gaat naar links: de uitkomst wordt kleiner'], ['r', 'je gaat naar rechts: de uitkomst wordt groter']], ans:'l',
        why:`Een negatief getal optellen: naar links op de getallenas. Bijvoorbeeld ${somT(a, -2)} = ${zS(a - 2)}.`, whyBad:'Kijk naar de staven: na + 0 zakken ze telkens 1.',
        after:ok=>{ if(ok && !bes.querySelector('.m5-juist')) allesJuist(bes, 'Telkens 1 minder optellen geeft 1 minder. Daarom wordt de uitkomst kleiner als je een negatief getal optelt.'); } }); }
  } };

/* ---------- 2 springen op de getallenas ---------- */
OP.sprong = { title:'Springen op de getallenas', lvl:1,
  instr:'Klik eerst op het startgetal. Sleep dan zoveel stappen als de tweede term: naar rechts als die positief is, naar links als die negatief is.',
  build(b, st, save){
    const R = makeR(st); const P = [somPaar(R, 'pn', 9), somPaar(R, 'np', 9), somPaar(R, 'zz', 6)]; if(st.i==null) st.i = 0;
    const lijst = el('div', 'm5-gedaan'), host = el('div'); b.append(lijst, host);
    const toon = () => { lijst.innerHTML = P.slice(0, st.i).map(([x, y]) => `<span class="m5-ok">✓ ${somT(x, y)} = ${zS(x + y)}</span>`).join('');
      host.innerHTML = '';
      if(st.i < P.length){ host.append(el('div', 'm5-teller', `Opgave ${st.i + 1} van ${P.length}`)); const [x, y] = P[st.i];
        sprongAs(host, st, save, 's' + st.i, {a:x, b:y, onOk:()=>{ st.i++; save(); setTimeout(toon, 900); }}); }
      else allesJuist(host, 'Een positief getal optellen: naar <b>rechts</b>. Een negatief getal optellen: naar <b>links</b>.'); };
    toon();
  } };

/* ---------- 3 legertjes ---------- */
OP.leger = { title:'Plus- en min-soldaten', lvl:1,
  instr:'Een positief getal is een plus-leger, een negatief getal een min-leger. Een plus- en een min-soldaatje samen zijn 0: een nulpaar. Stel de legers op, laat ze vechten en tel wat overblijft.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle([somPaar(R, 'pn', 8), somPaar(R, 'np', 8), somPaar(R, 'zz', 5)]); if(st.i==null) st.i = 0;
    const lijst = el('div', 'm5-gedaan'), host = el('div'); b.append(lijst, host);
    const toon = () => { lijst.innerHTML = P.slice(0, st.i).map(([x, y]) => `<span class="m5-ok">✓ ${somT(x, y)} = ${zS(x + y)}</span>`).join('');
      host.innerHTML = '';
      if(st.i < P.length){ host.append(el('div', 'm5-teller', `Opgave ${st.i + 1} van ${P.length}`)); const [x, y] = P[st.i];
        legertjes(host, st, save, 'l' + st.i, {a:x, b:y, onOk:()=>{ st.i++; save(); setTimeout(toon, 900); }}); }
      else allesJuist(host, 'Verschillend teken: de nulparen vallen weg en het grootste leger wint. Zelfde teken: de legers voegen samen.'); };
    toon();
  } };

/* ---------- 4 de regelkiezer ---------- */
OP.regel = { title:'Kies de juiste regel', lvl:1,
  instr:'Kijk eerst naar de tekens van de twee termen. Kies de regel en vul dan de tussenstap aan.',
  build(b, st, save){
    regelTop(b, `<b>Zelfde teken</b>: behoud het teken en tel de absolute waarden op.<br><span class="m5-vb">${somT(-6, -4)} = ${MIN} (6 + 4) = ${MIN}10</span><br><b>Verschillend teken</b>: neem het teken van het getal met de grootste absolute waarde. Trek de kleinste absolute waarde af van de grootste.<br><span class="m5-vb">${somT(2, -7)} = ${MIN} (7 − 2) = ${MIN}5</span>`);
    const R = makeR(st); const P = R.shuffle([somPaar(R, 'zz', 15), somPaar(R, 'pn', 15), somPaar(R, 'np', 15)]);
    reeks(b, P.length, (g, i, nr) => { const [x, y] = P[i], T = x + y, zelfde = (x<0)===(y<0), p = Math.abs(x), q = Math.abs(y);
      const c = el('div', 'm5-rk'); g.append(c); c.append(el('div', 'm4-line', `<span class="q-num">${nr}</span> ${somT(x, y)}`));
      const stap = el('div');
      qChoice(c, st, save, 'k' + i, { html:'Welke regel?', opts:[['z', 'zelfde teken'], ['v', 'verschillend teken']], ans:zelfde ? 'z' : 'v',
        why: zelfde ? 'Beide termen hebben hetzelfde teken.' : 'De ene term is positief, de andere negatief.', whyBad:'Kijk naar het teken van elke term.',
        after:ok=>{ if(ok && !stap.firstChild) toonStap(); } });
      c.append(stap);
      function toonStap(){
        const op = zelfde ? '+' : '−';
        mQ(stap, st, save, 's' + i, { html:`${somT(x, y)} ${isq} {{s:t}} <span class="m4-par">(</span>{{g:p}} ${op} {{g:q}}<span class="m4-par">)</span> ${isq} {{u:r}}`,
          check:V=>{ const t = (V.t||{}).s, a1 = rdZ(V.p), b1 = rdZ(V.q);
            const tk = t===(T<0 ? '-' : '+') ? {ok:true} : {ok:false, msg: zelfde ? 'Bij hetzelfde teken behoud je het teken van de termen.' : `Neem het teken van het getal met de grootste absolute waarde: ${zS(Math.abs(x)>Math.abs(y) ? x : y)}.`};
            const pq = zelfde ? ((a1===p && b1===q) || (a1===q && b1===p)) : (a1===Math.max(p, q) && b1===Math.min(p, q));
            const pqR = pq ? {ok:true} : {ok:false, msg: zelfde ? `Tel de absolute waarden op: ${p} en ${q}.` : `Trek de kleinste absolute waarde af van de grootste: ${Math.max(p, q)} − ${Math.min(p, q)}.`};
            return allOf([['t', tk], ['p', pqR], ['q', pqR], ['r', chkGt(V.r, T)]]); },
          sol:`${somT(x, y)} ${isq} ${T<0 ? MIN : '+'} (${zelfde ? p + ' + ' + q : Math.max(p, q) + ' − ' + Math.min(p, q)}) ${isq} ${zS(T)}` }); }
    });
  } };

/* ---------- 5 bereken (basis) ---------- */
OP.ber1 = { title:'Bereken', lvl:1,
  instr:'Bepaal eerst het teken van de uitkomst, reken dan. Een negatief getal typ je met een minteken ervoor.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle(['zz', 'zz', 'pn', 'pn', 'np', 'np', 'pn', 'pp'].map(k => somPaar(R, k, 20)));
    reeks(b, P.length, (g, i, nr) => { const [x, y] = P[i], T = x + y;
      mQ(g, st, save, 'b' + i, { nr, html:`${somT(x, y)} ${isq} {{u:a}}`, check:V=>chkGt(V.a, T, [[x - y, 'Je trok af in plaats van op te tellen.'], [Math.sign(T)*(Math.abs(x) + Math.abs(y)), 'De tekens zijn verschillend: trek de absolute waarden van elkaar af.']]),
        hint:somHint(x, y, true), meer:somMeer(x, y), sol:`${somT(x, y)} ${isq} ${zS(T)}` }); });
  } };

/* ---------- 6 bereken (oefenen) ---------- */
OP.ber2 = { title:'Bereken tot 100', lvl:2,
  instr:'Bereken. Een negatief getal typ je met een minteken ervoor.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle(['zz', 'zz', 'pn', 'pn', 'np', 'np', 'pn', 'np'].map(k => somPaar(R, k, 99)));
    reeks(b, P.length, (g, i, nr) => { const [x, y] = P[i], T = x + y;
      mQ(g, st, save, 'c' + i, { nr, html:`${somT(x, y)} ${isq} {{u:a}}`, check:V=>chkG(V.a, T, [[x - y, 'Je trok af in plaats van op te tellen.'], [Math.sign(T)*(Math.abs(x) + Math.abs(y)), 'De tekens zijn verschillend: trek de absolute waarden van elkaar af.']]),
        hint:somHint(x, y, false), meer:somMeer(x, y), sol:`${somT(x, y)} ${isq} ${zS(T)}` }); });
  } };

/* ---------- 7 temperatuur met twee thermometers ---------- */
const UREN = [['🌅', '7.00 uur'], ['☀️', '12.00 uur'], ['🌇', '17.00 uur'], ['🌙', '22.00 uur'], ['🌌', '3.00 uur']];
/* een reeks veranderingen na elkaar (thermometer, lift, duiker) */
function veranderKaart(b, st, save, L, maak, slot){ if(st.i==null) st.i = 0;
  const lijst = el('div', 'm5-gedaan'), host = el('div'); b.append(lijst, host);
  const toon = () => { lijst.innerHTML = L.slice(0, st.i).map(([v, d]) => `<span class="m5-ok">✓ ${somT(v, d)} = ${zS(v + d)}</span>`).join('');
    host.innerHTML = '';
    if(st.i < L.length){ host.append(el('div', 'm5-teller', `Opgave ${st.i + 1} van ${L.length}`)); verander(host, st, save, 'v' + st.i, Object.assign(maak(st.i), {onOk:()=>{ st.i++; save(); setTimeout(toon, 900); }})); }
    else allesJuist(host, slot); };
  toon(); }
OP.temp = { title:'Een dag op de thermometer', lvl:2,
  instr:'Volg de temperatuur van een winterdag. Stel telkens de rechtse thermometer in en schrijf de optelling: een stijging is positief, een daling negatief.',
  build(b, st, save){
    const R = makeR(st); let t = R.int(-8, 3); const V = [];
    [['Tegen de middag stijgt de temperatuur', 1], ['In de namiddag stijgt ze nog wat', 1], ['Bij zonsondergang daalt ze', -1], ['In de nacht daalt ze verder', -1]].forEach(([tx, s]) => { let d;
      for(let k=0; k<50; k++){ d = s*R.int(3, 9); if(t + d >= -14 && t + d <= 14 && t + d!==0) break; } V.push([t, d, tx]); t += d; });
    veranderKaart(b, st, save, V, i => { const [van, d, tx] = V[i];
      return {soort:'thermo', van, d, lo:-15, hi:15, voor:UREN[i], na:UREN[i+1], eenheid:'°C', tekst:`Om ${UREN[i][1]} is het <b>${zS(van)} °C</b>. ${tx} met <b>${Math.abs(d)} °C</b>. Hoe warm is het om ${UREN[i+1][1]}?`}; },
      'Een stijging tel je op als positief getal, een daling als negatief getal.');
  } };

/* ---------- 8 de lift ---------- */
const verd = v => v>0 ? `verdieping ${v}` : v===0 ? 'het gelijkvloers (0)' : `parking ${zS(v)}`;
OP.lift = { title:'Met de lift', lvl:2,
  instr:'De verdiepingen onder de grond zijn negatief. Zet de lift op de juiste verdieping en schrijf de optelling.',
  build(b, st, save){
    const R = makeR(st); const L = [];
    for(let k=0; k<300 && L.length<3; k++){ const v = R.int(-3, 8), d = (L.length===1 ? 1 : -1)*R.int(2, 9), w = v + d;
      if(w < -3 || w > 8 || w===v || L.some(l => l[0]===v)) continue; if(L.length!==1 && !(v>0 && w<0) && k<200) continue; L.push([v, d]); }
    veranderKaart(b, st, save, L, i => { const [v, d] = L[i];
      return {soort:'lift', van:v, d, lo:-3, hi:8, tekst:`De lift staat op <b>${verd(v)}</b>. Hij gaat <b>${Math.abs(d)} verdiepingen naar ${d>0 ? 'boven' : 'beneden'}</b>. Op welke verdieping stopt hij?`}; },
      'Naar boven tel je een positief getal op, naar beneden een negatief getal.');
  } };

/* ---------- 9 duiken ---------- */
OP.duik = { title:'Duiker en haai', lvl:2,
  instr:'Onder het wateroppervlak is de hoogte negatief. Zet de duiker op de juiste diepte en schrijf de optelling.',
  build(b, st, save){
    const R = makeR(st); const L = []; let v = -R.int(3, 9);
    [-1, 1, -1].forEach(s => { let d; for(let k=0; k<50; k++){ d = s*R.int(4, 12); if(v + d >= -28 && v + d <= -1) break; } if(v + d < -28 || v + d > -1) d = s<0 ? -2 : 2; L.push([v, d]); v += d; });
    const zin = (v, d) => d<0 ? `daalt nog <b>${-d} m</b> dieper` : `stijgt <b>${d} m</b>`;
    veranderKaart(b, st, save, L, i => { const [v, d] = L[i];
      return {soort:'zee', van:v, d, lo:-30, hi:8, extra:[['🦈', -24], ['🐦', 5]], eenheid:'m', tekst:`De duiker zwemt op <b>${-v} m</b> onder water (${zS(v)} m). Hij ${zin(v, d)}. Op welke hoogte zwemt hij nu?`}; },
      'Dieper gaan is een negatief getal optellen, stijgen een positief getal.');
  } };

/* ---------- 10 bankapp ---------- */
OP.bank = { title:'De bankapp', lvl:2,
  instr:'Een storting tel je op als positief getal, een betaling als negatief getal. Volg het saldo. Een negatief saldo betekent dat je rood staat.',
  build(b, st, save){
    const R = makeR(st); const naam = R.pick(['Jonas', 'Noor', 'Lina', 'Yassin']); let start, tr;
    const BIJ = [['👵 Storting van oma', 20, 50], ['💼 Zakgeld', 10, 25], ['🎂 Verjaardag', 15, 40]], AF = [['🎮 Game online', 25, 70], ['🍕 Pizza met vrienden', 12, 30], ['🎧 Oortjes', 20, 60], ['🚲 Fietsherstelling', 15, 45]];
    for(let k=0; k<300; k++){ start = R.int(10, 40); const af = R.shuffle(AF), bij = R.shuffle(BIJ);
      tr = [af[0], af[1], bij[0], af[2]].map(([t, lo, hi], j) => [t, (j===2 ? 1 : -1)*R.int(lo, hi)]);
      let s = start; const S = tr.map(([, x]) => s += x); if(S.some(x => x<0) && S.some(x => x>0) && S.every(x => x!==0 && Math.abs(x) <= 99)) break; }
    if(st.i==null) st.i = 0; const P = paneel(b); const app = el('div'); P.vis.append(app); const sp = el('div'); P.stap.append(sp);
    const saldo = n => { let s = start; tr.slice(0, n).forEach(([, x]) => s += x); return s; };
    const toon = () => { app.innerHTML = bankHTML({naam, start, tr, nu:st.i}); sp.innerHTML = '';
      sp.append(el('div', 'm5-vinken', tr.slice(0, st.i).map(([t, x], j) => `<div><span class="m5-vink">✓</span> ${somT(saldo(j), x)} = ${zS(saldo(j + 1))}</div>`).join('')));
      if(st.i < tr.length){ const i = st.i, [t, x] = tr[i], v = saldo(i);
        stapKop(sp, 1, `Lees de volgende regel: <b>${t}</b>.`); stapKop(sp, 2, 'Schrijf de optelling en het nieuwe saldo.');
        mQ(sp, st, save, 'k' + i, { html:`${zS(v)} + <span class="m4-par">(</span>{{g:d}}<span class="m4-par">)</span> ${isq} {{u:r}} <span class="txt">euro</span>`,
          check:V=>allOf([['d', chkG(V.d, x, [[-x, x<0 ? 'Een betaling gaat van je rekening af: een negatief getal.' : 'Een storting komt op je rekening: een positief getal.']])], ['r', chkG(V.r, v + x)]]),
          onOk:silent=>{ if(!silent && st.i===i){ st.i++; save(); setTimeout(toon, 600); } } }); }
      else allesJuist(sp, `Het eindsaldo is € ${zS(saldo(tr.length))}. Bij een negatief saldo sta je rood: je hebt meer uitgegeven dan er op de rekening stond.`); };
    toon();
  } };

/* ---------- 9 som-piramide ---------- */
OP.pir = { title:'Som-piramide', lvl:2,
  instr:'Elk vak is de som van de twee vakken eronder. Vul de piramide aan.',
  build(b, st, save){
    const R = makeR(st); let B;
    for(let k=0; k<200; k++){ B = [0, 0, 0, 0].map(() => nz(R, -20, 20)); const t = B[0] + 3*B[1] + 3*B[2] + B[3]; if(Math.abs(t) <= 100 && B.some(x => x<0) && B.some(x => x>0)) break; }
    piramide(b, st, save, 'p', {basis:B, open:[10, 11, 12, 20, 21, 30], whyBad:'Elk vak is de som van de twee vakken eronder. Let op de tekens.'});
  } };

/* ---------- verdieping ---------- */
OP.groot = { title:'Grote getallen', lvl:3,
  instr:'Bereken. Werk met de absolute waarden en kies dan het teken.',
  build(b, st, save){
    const R = makeR(st); const g = () => R.int(12, 950)*R.pick([1, 5, 10]);
    const P = ['zz', 'pn', 'np', 'pn', 'np', 'zz'].map(k => { let x, y; do{ x = g(); y = g(); }while(x===y); return k==='zz' ? [-x, -y] : k==='pn' ? [x, -y] : [-x, y]; });
    reeks(b, P.length, (gg, i, nr) => { const [x, y] = P[i], T = x + y;
      mQ(gg, st, save, 'g' + i, { nr, html:`${somT(x, y)} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), sol:`${somT(x, y)} ${isq} ${zS(T)}` }); });
  } };
OP.aanvul = { title:'Vul aan zodat het klopt', lvl:3,
  instr:'Welk getal ontbreekt? Een negatief getal na het plusteken mag je met of zonder haakjes typen.',
  build(b, st, save){
    const R = makeR(st);
    const L = [0, 1, 2, 3, 4, 5].map(i => { const x = nz(R, -40, 40), y = nz(R, -40, 40); return [x, y, x + y, i % 2]; });
    reeks(b, L.length, (g, i, nr) => { const [x, y, c, voor] = L[i];
      mQ(g, st, save, 'a' + i, { nr, html: voor ? `{{u:a}} + ${zP(y)} ${isq} ${zS(c)}` : `${zS(x)} + {{u:a}} ${isq} ${zS(c)}`, check:V=>chkG(V.a, voor ? x : y, [[voor ? c + y : c + x, 'Controleer: tel je getal op en kijk of je de uitkomst krijgt.']]),
        sol: voor ? `${zS(x)} + ${zP(y)} ${isq} ${zS(c)}` : `${zS(x)} + ${zP(y)} ${isq} ${zS(c)}` }); });
  } };
OP.teken = { title:'Positief of negatief?', lvl:3,
  instr:'<i>a</i> en <i>b</i> zijn gehele getallen, niet 0. Is de som <i>a</i> + <i>b</i> zeker positief, zeker negatief, of hangt het ervan af?',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['<i>a</i> &gt; 0 en <i>b</i> &gt; 0', '>', 'Twee positieve getallen: de som is positief.'], ['<i>a</i> &lt; 0 en <i>b</i> &lt; 0', '<', 'Twee negatieve getallen: de som is negatief.'],
      ['<i>a</i> &gt; 0 en <i>b</i> &lt; 0', '?', 'Het hangt af van welk getal de grootste absolute waarde heeft: 5 + (−2) = 3 maar 2 + (−5) = −3.'],
      ['<i>a</i> &lt; 0, <i>b</i> &gt; 0 en |<i>a</i>| &gt; |<i>b</i>|', '<', 'Het negatieve getal heeft de grootste absolute waarde, dus de som is negatief.'],
      ['<i>a</i> &lt; 0, <i>b</i> &gt; 0 en |<i>a</i>| &lt; |<i>b</i>|', '>', 'Het positieve getal heeft de grootste absolute waarde, dus de som is positief.']]);
    reeks(b, L.length, (g, i, nr) => { const [c, ans, why] = L[i];
      qChoice(g, st, save, 'z' + i, { nr, html:`${c}. Dan is <i>a</i> + <i>b</i> …`, opts:[['>', 'positief'], ['<', 'negatief'], ['?', 'dat hangt ervan af']], ans, why, whyBad:'Probeer het met een paar getallen die bij de voorwaarde passen.' }); }, {een:true});
  } };
OP.pir2 = { title:'Piramide met gaten', lvl:3,
  instr:'Elk vak is de som van de twee vakken eronder. Nu ontbreken ook getallen onderaan. Zoek eerst een vak waarvan je twee buren kent.',
  build(b, st, save){
    const R = makeR(st); const B = [nz(R, -25, 25), nz(R, -25, 25), nz(R, -25, 25), nz(R, -25, 25)];
    piramide(b, st, save, 'q', {basis:B, open:[1, 2, 10, 12, 21, 30], whyBad:'Werk van onder naar boven en omgekeerd: als je de som en één term kent, zoek je de andere term.'});
  } };

OP.tijd = { title:'Voor en na Christus', lvl:3,
  instr:'Een jaar voor Christus (v.C.) schrijf je als negatief getal, een jaar na Christus (n.C.) als positief getal. Let op: het jaar 0 bestaat niet.',
  build(b, st, save){
    regelTop(b, `Na het jaar 1 v.C. komt meteen het jaar 1 n.C.<div class="m5-tlijn">${['3 v.C.', '2 v.C.', '1 v.C.', '1 n.C.', '2 n.C.', '3 n.C.'].map((j, i) => `<span class="${i<3 ? 'vc' : 'nc'}">${j}</span>`).join('')}</div>Ga je over die grens, dan kom je één jaar verder uit dan het rekenwerk geeft: het jaar 0 sla je over.`);
    const R = makeR(st);
    const j1 = R.int(3, 9)*100 + R.pick([0, 25, 50, 53]), n1 = R.int(1, Math.floor(j1/100) - 1)*100 + R.int(0, 9)*10;
    const j2 = R.pick([753, 509, 336, 146, 44]), n2 = R.pick([800, 1000, 1200, 1500]);
    const y3 = R.int(2, 30)*10, n3 = y3 + R.int(1, 30)*10;
    const L = [
      [`Een tempel werd gebouwd in ${j1} v.C. Hij brandde ${n1} jaar later af. In welk jaar was dat?`, -j1 + n1, null, `${zS(-j1)} + ${n1} = ${zS(-j1 + n1)}: dat is ${j1 - n1} v.C. Je ging niet over de grens, dus je hoeft niets aan te passen.`],
      [`Een stad werd gesticht in ${j2} v.C. In welk jaar vierde ze haar ${n2}ste verjaardag?`, -j2 + n2 + 1, -j2 + n2, `${zS(-j2)} + ${n2} = ${-j2 + n2}, maar je sprong over het jaar 0 dat niet bestaat. Het is dus ${-j2 + n2 + 1} n.C.`],
      [`Een brug werd gebouwd in ${y3} n.C. Een tempel in dezelfde stad is ${n3} jaar ouder. In welk jaar werd de tempel gebouwd?`, y3 - n3 - 1, y3 - n3, `${y3} + ${zP(-n3)} = ${zS(y3 - n3)}, maar het jaar 0 bestaat niet. Het is dus ${n3 - y3 + 1} v.C., of ${zS(y3 - n3 - 1)}.`]];
    reeks(b, L.length, (g, i, nr) => { const [tx, T, naief, uitl] = L[i];
      mQ(g, st, save, 'j' + i, { nr, html:`<span class="txt">${tx}</span> {{u:a}}`, check:V=>chkG(V.a, T, naief!=null ? [[naief, 'Je rekende goed, maar het jaar 0 bestaat niet. Ging je over de grens tussen v.C. en n.C.?']] : [[T - 1, 'Je ging niet over de grens tussen v.C. en n.C.: dan pas je niets aan.']]), sol:uitl }); }, {een:true});
  } };

Object.assign(ICONS, {
  z_optel:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
  z_volg:'<path d="M3 20h5v-5h5v-5h5V5h3"/><path d="M4 15.5l3-3M9 10.5l3-3"/>'
});
const CHEAT_OPTEL = `<h3>Spiekbriefje · optellen</h3><table>
  <tr><td>zelfde teken</td><td>behoud het teken en tel de absolute waarden op<div class="m4-line">${somT(-6, -4)} ${isq} ${MIN}(6 + 4) ${isq} ${MIN}10</div></td></tr>
  <tr><td>verschillend teken</td><td>neem het teken van het getal met de grootste absolute waarde en trek de kleinste absolute waarde af van de grootste<div class="m4-line">${somT(2, -7)} ${isq} ${MIN}(7 − 2) ${isq} ${MIN}5</div></td></tr>
  <tr><td>getallenas</td><td>een positief getal optellen: naar rechts; een negatief getal optellen: naar links</td></tr>
  <tr><td>nulpaar</td><td>een getal en zijn tegengestelde samen zijn 0: ${somT(9, -9)} = 0</td></tr>
  <tr><td>haakjes</td><td>een negatief getal na een bewerkingsteken staat tussen haakjes: 4 + (${MIN}9)</td></tr></table>`;
SEC.optel = { id:'optel', ic:'z_optel', nav:'Optellen', title:'Gehele getallen optellen',
  tip:'Een positief getal optellen: naar rechts op de getallenas. Een negatief getal optellen: naar links. Een negatief getal na een bewerkingsteken staat tussen haakjes.',
  cheat:CHEAT_OPTEL, cards:[OP.patroon, OP.sprong, OP.leger, OP.regel, OP.ber1, OP.ber2, OP.temp, OP.lift, OP.duik, OP.bank, OP.pir, OP.groot, OP.aanvul, OP.teken, OP.pir2, OP.tijd] };
(function(){ const s = document.createElement('style'); s.textContent = `
  .m5-gedaan{display:flex; flex-wrap:wrap; gap:.4rem; margin:.2rem 0 .4rem} .m5-ok{background:var(--ok-bg); color:var(--ok); border-radius:.5rem; padding:.15rem .55rem; font-weight:700}
  .m5-teller{font-size:.85rem; font-weight:700; color:var(--accent-dark); text-transform:uppercase; letter-spacing:.04em}
  .m5-rk{padding:.4rem 0 .6rem; border-bottom:1px solid var(--accent-soft)} .m5-rk .q{padding:.2rem 0}
  .m5-vb{font-weight:700; font-size:1.1rem}
  .m5-besluit{margin-top:.6rem}
  .m5-tlijn{display:flex; flex-wrap:wrap; gap:.25rem; margin:.4rem 0; font-weight:700} .m5-tlijn span{border-radius:.4rem; padding:.1rem .5rem} .m5-tlijn .vc{background:#e8efff; color:#1d4ed8} .m5-tlijn .nc{background:#fdeaea; color:#c01f1f} .m5-tlijn span:nth-child(3){margin-right:.6rem}
  .m5-patroon{display:flex; flex-direction:column; gap:.15rem; font-size:1.2rem; font-variant-numeric:tabular-nums} .m5-ok-r{display:flex; gap:.5rem; align-items:center} .m5-vink{color:var(--ok); font-weight:900}
  `; document.head.append(s); })();
/* ============================================================
   ONDERDELEN 5 TOT 7 · AFTREKKEN, VERMENIGVULDIGEN, DELEN
   ============================================================ */
Object.assign(ICONS, {
  z_aftrek:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  z_maal:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.6"/>',
  z_deel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="8.5" r="1.3"/><circle cx="12" cy="15.5" r="1.3"/>'
});
const verT = (a, b) => `${zS(a)} − ${zP(b)}`;
const AF = {};
/* ---------- 1 patroon ---------- */
AF.patroon = { title:'Ontdek het patroon', lvl:1,
  instr:'Reken de verschillen van boven naar onder uit. Kijk hoe de staven veranderen.',
  build(b, st, save){ const R = makeR(st); const a = R.pick([2, 3, 4, -2, -3]);
    patroon(b, st, save, {a, B:[3, 2, 1, 0, -1, -2, -3], op:'−', vraag:'Wat gebeurt er als je een <b>negatief</b> getal aftrekt?', opts:[['g', 'de uitkomst wordt groter'], ['k', 'de uitkomst wordt kleiner']], ans:'g',
      why:`Telkens 1 minder aftrekken geeft 1 meer. ${verT(a, -2)} = ${zS(a + 2)}: hetzelfde als ${somT(a, 2)}.`, slot:'Een negatief getal aftrekken maakt de uitkomst groter: je telt het tegengestelde op.'}); } };
/* ---------- 2 tweelingsommen ---------- */
AF.tweeling = { title:'Tweelingsommen', lvl:1,
  instr:'Reken beide bewerkingen uit. Wat valt je op?',
  build(b, st, save){
    const R = makeR(st); const P = [[nz(R, -9, 9), R.int(2, 9)], [nz(R, -9, 9), -R.int(2, 9)], [-R.int(2, 9), -R.int(2, 9)]];
    naElkaar(b, st, save, P.length, (host, i, klaar) => { const [a, c] = P[i], T = a - c;
      const Pn = paneel(host); const B = asBereik([a, T]); Pn.vis.append(el('div', '', asSvg(Object.assign({}, B, {sprongen:[{van:a, naar:T, lab:`${MIN} ${zP(c)}`, cls:T<a ? 'neg' : 'pos'}], punten:[{x:a, cls:'start'}, {x:T}], alt:'getallenas', maxw:520}))));
      Pn.vis.append(el('p', 'm5-tip', `${MIN} ${zP(c)} en + ${zP(-c)}: dezelfde sprong.`));
      stapKop(Pn.stap, 1, 'Reken beide uit.');
      mQ(Pn.stap, st, save, 't' + i, { noCL:false, html:`${verT(a, c)} ${isq} {{u:a}} <span class="txt">en</span> ${somT(a, -c)} ${isq} {{u:b}}`, check:V=>allOf([['a', chkGt(V.a, T)], ['b', chkGt(V.b, T)]]),
        hint:[`Kijk naar de sprong op de getallenas: start bij ${zS(a)}.`], onOk:s=>{ if(!s) klaar(); } }); },
      'Aftrekken is hetzelfde als het tegengestelde optellen: a − b = a + (−b).', P.map(([a, c]) => `${verT(a, c)} = ${somT(a, -c)} = ${zS(a - c)}`));
  } };
/* ---------- 3 het stappenplan: tegengestelde optellen ---------- */
AF.stap = { title:'Tel het tegengestelde op', lvl:1,
  instr:'Schrijf het verschil als een som: verander het minteken in een plusteken en neem het tegengestelde van de tweede term. Reken dan uit.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle([[nz(R, -15, 15), R.int(2, 15)], [nz(R, -15, 15), -R.int(2, 15)], [-R.int(2, 15), R.int(2, 15)], [R.int(2, 15), -R.int(2, 15)], [-R.int(2, 15), -R.int(2, 15)], [R.int(1, 9), R.int(10, 20)]]);
    reeks(b, P.length, (g, i, nr) => { const [a, c] = P[i], T = a - c;
      mQ(g, st, save, 's' + i, { nr, html:`${verT(a, c)} ${isq} ${zS(a)} + <span class="m4-par">(</span>{{u:t}}<span class="m4-par">)</span> ${isq} {{u:r}}`,
        check:V=>allOf([['t', chkGt(V.t, -c, [[c, 'Neem het tegengestelde van de tweede term.']])], ['r', chkGt(V.r, T)]]),
        hint:[`Het tegengestelde van ${zS(c)} is ${zS(-c)}.`, {u:'Vul aan.', line:`${somT(a, -c)} ${isq} {{u:a}}`, check:V=>chkGt(V.a, T).ok, show:`${somT(a, -c)} ${isq} ${zS(T)}`}], meer:somMeer(a, -c),
        sol:`${verT(a, c)} ${isq} ${somT(a, -c)} ${isq} ${zS(T)}` }); });
  } };
/* ---------- 4 tekenparen wegwerken ---------- */
AF.paar = { title:'Twee tekens na elkaar', lvl:1,
  instr:'Staan er twee tekens na elkaar, schrijf dan één teken. Twee gelijke tekens worden +, twee verschillende tekens worden −. Kies het teken en reken uit.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle([['+', -1], ['−', -1], ['+', 1], ['−', 1], ['−', -1], ['+', -1]]).map(([o, s]) => [nz(R, -15, 15), o, s*R.int(2, 15)]);
    reeks(b, P.length, (g, i, nr) => { const [a, o, c] = P[i]; const nieuw = (o==='+') === (c>0) ? '+' : '-'; const T = o==='+' ? a + c : a - c; const ct = c<0 ? `(${zS(c)})` : `(+${c})`;
      mQ(g, st, save, 'p' + i, { nr, html:`${zS(a)} ${o} ${ct} ${isq} ${zS(a)} {{s:t}} ${Math.abs(c)} ${isq} {{u:r}}`,
        check:V=>allOf([['t', (V.t||{}).s===nieuw ? {ok:true} : {ok:false, msg: nieuw==='+' ? 'Twee gelijke tekens: plus.' : 'Twee verschillende tekens: min.'}], ['r', chkGt(V.r, T)]]),
        sol:`${zS(a)} ${o} ${ct} ${isq} ${zS(a)} ${nieuw==='+' ? '+' : MIN} ${Math.abs(c)} ${isq} ${zS(T)}` }); });
  } };
/* ---------- 5 bereken tot 100, vrij vak ---------- */
AF.vrij = { title:'Bereken tot 100', lvl:2,
  instr:'Werk uit in het vak. De tussenstap met het tegengestelde mag je schrijven of overslaan.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle([0, 1, 2, 3, 4, 5]).map(k => [nz(R, -60, 60), (k % 2 ? -1 : 1)*R.int(5, 60)]);
    reeks(b, P.length, (g, i, nr) => { const [a, c] = P[i]; const E = verT(a, c);
      mQ(g, st, save, 'v' + i, { nr, html:`<span class="m5-opg">${E}</span> {{z:a,h}}`, check:V=>chkZ(V.a, ZX.waarde(E), {opg:E}), hint:['Schrijf als som: tel het tegengestelde op.', ['Zo begin je:', `= ${somT(a, -c)}`]], sol:uitwH([E, somT(a, -c), zS(a - c)]) }); });
  } };
/* ---------- 6 verschil in het echt ---------- */
AF.verschil = { title:'Hoeveel verschil?', lvl:2,
  instr:'Het verschil is de grootste waarde min de kleinste waarde. Schrijf de aftrekking en reken uit.',
  build(b, st, save){
    const R = makeR(st); const t1 = -R.int(3, 14), t2 = R.int(2, 15), v1 = -R.int(1, 3), v2 = R.int(2, 8), d = -R.int(5, 25), m = R.int(3, 12), j = R.int(2, 8)*100, k = R.int(1, 9)*100;
    const L = [[`'s Nachts was het ${zS(t1)} °C, 's middags ${zS(t2)} °C. Hoeveel graden is het opgewarmd?`, t2, t1, '°C'],
      [`Je neemt de lift van parking ${zS(v1)} naar verdieping ${v2}. Hoeveel verdiepingen ga je omhoog?`, v2, v1, 'verdiepingen'],
      [`Een duiker zwemt op ${zS(d)} m, een meeuw vliegt op ${m} m boven het water. Hoeveel meter zit er tussen?`, m, d, 'm'],
      [`Een tempel werd gebouwd in ${j} v.C. (${zS(-j)}), een andere in ${k} v.C. (${zS(-k)}). Hoeveel jaar zit er tussen?`, Math.max(-j, -k), Math.min(-j, -k), 'jaar']];
    reeks(b, L.length, (g, i, nr) => { const [tx, hoog, laag, u] = L[i]; const T = hoog - laag;
      mQ(g, st, save, 'd' + i, { nr, html:`<span class="txt">${tx}</span> ${zS(hoog)} − ${zP(laag)} ${isq} {{u:a}} <span class="txt">${u}</span>`, check:V=>chkG(V.a, T, [[hoog + laag, 'Een negatief getal aftrekken: tel het tegengestelde op.']]),
        hint:[`${zS(hoog)} − ${zP(laag)} ${isq} ${somT(hoog, -laag)}`], sol:`${zS(hoog)} − ${zP(laag)} ${isq} ${somT(hoog, -laag)} ${isq} ${T}` }); }, {een:true});
  } };
/* ---------- verdieping ---------- */
AF.groot = { title:'Grote getallen', lvl:3,
  instr:'Bereken.',
  build(b, st, save){
    const R = makeR(st); const g = () => R.int(12, 950)*R.pick([1, 5, 10]);
    const P = [[-g(), g()], [g(), -g()], [-g(), -g()], [g(), g()], [-g(), -g()], [-g(), g()]];
    reeks(b, P.length, (gg, i, nr) => { const [a, c] = P[i]; mQ(gg, st, save, 'g' + i, { nr, html:`${verT(a, c)} ${isq} {{u:a}}`, check:V=>chkG(V.a, a - c), sol:`${verT(a, c)} ${isq} ${somT(a, -c)} ${isq} ${zS(a - c)}` }); });
  } };
AF.slier = { title:'Rekenslierten', lvl:3,
  instr:'Volg de pijlen. Vul elk vak in.',
  build(b, st, save){
    const R = makeR(st);
    const L = [0, 1, 2].map(() => { let x = nz(R, -30, 30); const S = []; for(let k=0; k<4; k++){ const c = nz(R, -25, 25), op = R.pick(['+', '−']); const y = op==='+' ? x + c : x - c; S.push([op, c, y]); x = y; } return S; });
    const st0 = L.map(S => S[0][2] - (S[0][0]==='+' ? S[0][1] : -S[0][1]));
    reeks(b, L.length, (g, i, nr) => { const S = L[i];
      mQ(g, st, save, 's' + i, { nr, html:`<span class="m5-slier">${zS(st0[i])}</span> ${S.map(([op, c], k) => `<span class="m5-pijl">${op} ${zP(c)} →</span> {{u:v${k}}}`).join(' ')}`,
        check:V=>allOf(S.map(([, , y], k) => ['v' + k, chkG(V['v' + k], y)])), sol:S.map(([, , y]) => zS(y)).join(' → ') }); }, {een:true});
  } };
AF.aanvul = { title:'Vul aan', lvl:3,
  instr:'Welk getal ontbreekt?',
  build(b, st, save){
    const R = makeR(st); const L = [0, 1, 2, 3, 4, 5].map(k => { const a = nz(R, -40, 40), c = nz(R, -40, 40); return [a, c, a - c, k % 2]; });
    reeks(b, L.length, (g, i, nr) => { const [a, c, d, voor] = L[i];
      mQ(g, st, save, 'a' + i, { nr, html: voor ? `{{u:a}} − ${zP(c)} ${isq} ${zS(d)}` : `${zS(a)} − {{u:a}} ${isq} ${zS(d)}`, check:V=>chkG(V.a, voor ? a : c, [[voor ? d - c : d - a, 'Controleer: vul je getal in en reken.']]), sol:`${verT(a, c)} ${isq} ${zS(d)}` }); });
  } };
const CHEAT_AFTREK = `<h3>Spiekbriefje · aftrekken</h3><table>
  <tr><td>regel</td><td>aftrekken = het tegengestelde optellen<div class="m4-line">${verT(3, 8)} ${isq} ${somT(3, -8)} ${isq} ${MIN}5</div><div class="m4-line">${verT(-4, -6)} ${isq} ${somT(-4, 6)} ${isq} 2</div></td></tr>
  <tr><td>twee tekens</td><td>+ (+…) en − (${MIN}…) worden +; + (${MIN}…) en − (+…) worden ${MIN}</td></tr>
  <tr><td>verschil</td><td>grootste waarde min kleinste waarde</td></tr></table>`;
SEC.aftrek = { id:'aftrek', ic:'z_aftrek', nav:'Aftrekken', title:'Gehele getallen aftrekken',
  tip:'Aftrekken is het tegengestelde optellen: 5 − (−3) = 5 + 3. Zo maak je van elk verschil een som.',
  cheat:CHEAT_AFTREK, cards:[AF.patroon, AF.tweeling, AF.stap, AF.paar, AF.vrij, AF.verschil, AF.groot, AF.slier, AF.aanvul] };

/* ============================================================ 6 vermenigvuldigen */
const prT = (a, b) => `${zS(a)} · ${zP(b)}`;
const MA = {};
MA.patroon1 = { title:'Ontdek het patroon (1)', lvl:1,
  instr:'Reken de producten van boven naar onder uit. Kijk hoe de staven veranderen.',
  build(b, st, save){ const R = makeR(st); const a = R.pick([2, 3, 4]);
    patroon(b, st, save, {a, B:[3, 2, 1, 0, -1, -2, -3], op:'·', vraag:'Een positief getal maal een negatief getal is …', opts:[['+', 'positief'], ['-', 'negatief']], ans:'-',
      why:`Telkens ${a} minder: ${prT(a, -2)} = ${zS(-2*a)}.`, slot:'Positief maal negatief geeft negatief.'}); } };
MA.patroon2 = { title:'Ontdek het patroon (2)', lvl:1,
  instr:'Nu is het eerste getal negatief. Reken van boven naar onder.',
  build(b, st, save){ const R = makeR(st); const a = R.pick([-2, -3, -4]);
    patroon(b, st, save, {a, B:[3, 2, 1, 0, -1, -2, -3], op:'·', vraag:'Een negatief getal maal een negatief getal is …', opts:[['+', 'positief'], ['-', 'negatief']], ans:'+',
      why:`De uitkomsten worden telkens ${-a} groter: ${prT(a, -2)} = ${zS(-2*a)}.`, slot:'Negatief maal negatief geeft positief. Zelfde teken: positief, verschillend teken: negatief.'}); } };
MA.sprong = { title:'Herhaalde sprongen', lvl:1,
  instr:'4 · (−3) betekent: 4 keer een sprong van −3, vanaf 0. Kijk op de getallenas en vul in.',
  build(b, st, save){
    const R = makeR(st); const P = [[R.int(2, 4), -R.int(2, 4)], [R.int(3, 5), -R.int(2, 3)], [R.int(2, 4), R.int(2, 4)]];
    naElkaar(b, st, save, P.length, (host, i, klaar) => { const [n, c] = P[i], T = n*c;
      const Pn = paneel(host); const B = asBereik([0, T], 14); const sp = []; for(let k=0; k<n; k++) sp.push({van:k*c, naar:(k + 1)*c, lab:zP(c), cls:c<0 ? 'neg' : 'pos'});
      Pn.vis.append(el('div', '', asSvg(Object.assign({}, B, {sprongen:sp, punten:[{x:0, cls:'start'}, {x:T}], alt:'getallenas met herhaalde sprongen', maxw:560}))));
      stapKop(Pn.stap, 1, `${n} sprongen van ${zP(c)}.`);
      mQ(Pn.stap, st, save, 'h' + i, { html:`${Array(n).fill(zP(c)).join(' + ')} ${isq} ${prT(n, c)} ${isq} {{u:a}}`, check:V=>chkGt(V.a, T), onOk:s=>{ if(!s) klaar(); } }); },
      'Een positief getal maal een negatief getal: herhaald een negatief getal optellen. De uitkomst is negatief.', P.map(([n, c]) => `${prT(n, c)} = ${zS(n*c)}`));
  } };
MA.min = { title:'Minnetjes tellen', lvl:1,
  instr:'Reken niet uit. Tel de mintekens: een even aantal geeft een positief product, een oneven aantal een negatief product.',
  build(b, st, save){
    const R = makeR(st); const L = [2, 3, 3, 4, 4, 5].map(n => { const f = []; for(let k=0; k<n; k++) f.push(R.sign()*R.int(1, 9)); return f; });
    reeks(b, L.length, (g, i, nr) => { const f = L[i]; const m = f.filter(x => x<0).length; const ans = m % 2 ? '-' : '+';
      qChoice(g, st, save, 'm' + i, { nr, html:`<span class="m5-groot">${f.map((x, k) => k ? zP(x) : zS(x)).join(' · ')}</span>`, opts:PN, ans, why:`${m} ${m===1 ? 'minteken' : 'mintekens'}: ${m % 2 ? 'oneven, dus negatief' : 'even, dus positief'}.`, whyBad:'Tel enkel de mintekens van de factoren.' }); }, {een:true});
  } };
MA.ber = { title:'Bereken', lvl:1,
  instr:'Kies eerst het teken: zelfde teken geeft +, verschillend teken geeft −. Vermenigvuldig dan de absolute waarden.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle(['--', '--', '+-', '+-', '-+', '-+', '++', '-+']).map(s => [(s[0]==='-' ? -1 : 1)*R.int(2, 10), (s[1]==='-' ? -1 : 1)*R.int(2, 10)]);
    reeks(b, P.length, (g, i, nr) => { const [a, c] = P[i], T = a*c;
      mQ(g, st, save, 'b' + i, { nr, html:`${prT(a, c)} ${isq} {{u:a}}`, check:V=>chkGt(V.a, T), hint:[(a<0)===(c<0) ? 'Zelfde teken: het product is positief.' : 'Verschillend teken: het product is negatief.', {u:'Vul aan.', line:`${prT(a, c)} ${isq} ${T<0 ? MIN : '+'} (${Math.abs(a)} · ${Math.abs(c)}) ${isq} {{u:a}}`, check:V=>chkGt(V.a, T).ok, show:zS(T)}], sol:`${prT(a, c)} ${isq} ${zS(T)}` }); });
  } };
MA.tabel = { title:'Bewerkingstabel', lvl:2,
  instr:'Vul de tabel in: het getal links maal het getal boven.',
  build(b, st, save){ const R = makeR(st); tabel(b, st, save, 't', {op:'·', rij:R.shuffle([-3, 2, -5, 4, -1].map(x => x*(R.f() < .5 ? 1 : 1))).slice(0, 4), kol:R.shuffle([-2, 6, -7, 3, -9]).slice(0, 4), why:'Zelfde teken: positief, verschillend teken: negatief.'}); } };
MA.pir = { title:'Productpiramide', lvl:2,
  instr:'Elk vak is het product van de twee vakken eronder. Kies bij elke steen het teken en vul het getal in.',
  build(b, st, save){ const R = makeR(st); const B = [0, 0, 0].map(() => R.sign()*R.int(1, 4)); if(B.every(x => x>0)) B[1] = -B[1];
    piramide(b, st, save, 'p', {basis:B, op:'·', open:[10, 11, 20]}); } };
MA.ctx = { title:'Vermenigvuldigen in het echt', lvl:2,
  instr:'Schrijf in gedachten een vermenigvuldiging en vul de uitkomst in.',
  build(b, st, save){
    const R = makeR(st); const n = R.int(3, 8), d = R.int(2, 6), u = R.int(3, 7), g = R.int(2, 4), p = R.int(4, 9), k = R.int(5, 15);
    const L = [[`De temperatuur daalt ${n} uur lang telkens ${d} graden per uur. Hoeveel is de temperatuur in totaal veranderd?`, -n*d, '°C', `${n} · ${zP(-d)}`],
      [`Een duiker daalt ${u} keer ${g} m. Hoeveel meter is zijn hoogte veranderd?`, -u*g, 'm', `${u} · ${zP(-g)}`],
      [`Bij een spel verlies je ${p} punten per fout. Je maakt ${k} fouten. Hoeveel punten verandert je score?`, -p*k, 'punten', `${k} · ${zP(-p)}`]];
    reeks(b, L.length, (gg, i, nr) => { const [tx, T, eh, op] = L[i]; mQ(gg, st, save, 'c' + i, { nr, html:`<span class="txt">${tx}</span> {{u:a}} <span class="txt">${eh}</span>`, check:V=>chkG(V.a, T, [[-T, 'De verandering is een daling of een verlies: negatief.']]), hint:[`Schrijf als vermenigvuldiging: ${op}.`], sol:`${op} ${isq} ${zS(T)}` }); }, {een:true});
  } };
MA.groot = { title:'Meer factoren', lvl:3,
  instr:'Bepaal eerst het teken (tel de mintekens), reken dan de absolute waarden uit. Zoek handige paren.',
  build(b, st, save){
    const R = makeR(st); const L = [[-25, R.int(2, 9), -4], [R.int(2, 9), -5, -R.int(2, 9), 2], [-2, -3, -R.int(2, 5), -R.int(2, 5)], [R.pick([-50, 50]), -R.int(3, 9), -2], [-R.int(11, 30), -R.int(3, 9)], [-1, -1, -1, -R.int(10, 99)]];
    reeks(b, L.length, (g, i, nr) => { const f = L[i]; const T = f.reduce((p, x) => p*x, 1); const E = f.map((x, k) => k ? zP(x) : zS(x)).join(' · ');
      mQ(g, st, save, 'g' + i, { nr, html:`${E} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), sol:`${E} ${isq} ${zS(T)}` }); });
  } };
MA.vgl = { title:'Vergelijk zonder te rekenen', lvl:3,
  instr:'<i>a</i> is negatief en <i>b</i> is positief (geen van beide is 0). Is de uitdrukking positief of negatief?',
  build(b, st, save){
    const R = makeR(st); const L = R.shuffle([['<i>a</i> · <i>b</i>', '-'], ['<i>a</i> · <i>a</i>', '+'], ['<i>a</i> · <i>a</i> · <i>a</i>', '-'], [`${MIN}<i>a</i> · <i>b</i>`, '+'], ['<i>a</i> · <i>b</i> · <i>b</i>', '-'], [`(${MIN}<i>b</i>) · <i>a</i>`, '+']]);
    reeks(b, L.length, (g, i, nr) => { const [h, ans] = L[i]; qChoice(g, st, save, 'v' + i, { nr, html:`<span class="m5-groot">${h}</span>`, opts:PN, ans, why:'Tel de negatieve factoren: even geeft positief, oneven geeft negatief.', whyBad:'Probeer het met getallen: a = −2 en b = 3.' }); }, {een:true});
  } };
const CHEAT_MAAL = `<h3>Spiekbriefje · vermenigvuldigen</h3><table>
  <tr><td>zelfde teken</td><td>positief: ${prT(-3, -4)} ${isq} 12</td></tr><tr><td>verschillend teken</td><td>negatief: ${prT(-3, 4)} ${isq} ${MIN}12</td></tr>
  <tr><td>meer factoren</td><td>even aantal mintekens: positief, oneven aantal: negatief</td></tr></table>`;
SEC.maal = { id:'maal', ic:'z_maal', nav:'Vermenigvuldigen', title:'Gehele getallen vermenigvuldigen',
  tip:'Bepaal eerst het teken, vermenigvuldig dan de absolute waarden. Zelfde teken: +, verschillend teken: −.',
  cheat:CHEAT_MAAL, cards:[MA.patroon1, MA.patroon2, MA.sprong, MA.min, MA.ber, MA.tabel, MA.pir, MA.ctx, MA.groot, MA.vgl] };

/* ============================================================ 7 delen */
const dlT = (a, b) => `${zS(a)} : ${zP(b)}`;
const DE = {};
DE.omg = { title:'Delen met controle', lvl:1,
  instr:'Delen is de omgekeerde bewerking van vermenigvuldigen. Vul het quotiënt in en controleer met een vermenigvuldiging.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle(['+-', '-+', '--', '-+', '+-', '--']).map(s => { const q = (s[0]==='-' ? -1 : 1)*R.int(2, 9), c = (s[1]==='-' ? -1 : 1)*R.int(2, 9); return [q*c, c]; });
    reeks(b, P.length, (g, i, nr) => { const [a, c] = P[i], T = a/c;
      mQ(g, st, save, 'o' + i, { nr, html:`${dlT(a, c)} ${isq} {{u:q}} <span class="txt">want</span> {{u:p}} · ${zP(c)} ${isq} ${zS(a)}`, check:V=>allOf([['q', chkGt(V.q, T)], ['p', chkGt(V.p, T)]]), sol:`${dlT(a, c)} ${isq} ${zS(T)} want ${zP(T)} · ${zP(c)} ${isq} ${zS(a)}` }); }, {een:true});
  } };
DE.teken = { title:'Positief of negatief?', lvl:1,
  instr:'Reken niet uit. Zelfde teken geeft een positief quotiënt, verschillend teken een negatief quotiënt.',
  build(b, st, save){
    const R = makeR(st); const L = R.shuffle(['--', '+-', '-+', '++', '--', '-+']).map(s => { const q = R.int(2, 12), c = R.int(2, 9); return [(s[0]==='-' ? -1 : 1)*q*c, (s[1]==='-' ? -1 : 1)*c]; });
    reeks(b, L.length, (g, i, nr) => { const [a, c] = L[i]; qChoice(g, st, save, 't' + i, { nr, html:`<span class="m5-groot">${dlT(a, c)}</span>`, opts:PN, ans:a/c>0 ? '+' : '-', why:(a<0)===(c<0) ? 'Zelfde teken: positief.' : 'Verschillend teken: negatief.' }); });
  } };
DE.ber = { title:'Bereken', lvl:1,
  instr:'Kies eerst het teken, deel dan de absolute waarden.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle(['--', '--', '+-', '+-', '-+', '-+', '++', '-+']).map(s => { const q = R.int(2, 10), c = R.int(2, 10); return [(s[0]==='-' ? -1 : 1)*q*c, (s[1]==='-' ? -1 : 1)*c]; });
    reeks(b, P.length, (g, i, nr) => { const [a, c] = P[i], T = a/c;
      mQ(g, st, save, 'b' + i, { nr, html:`${dlT(a, c)} ${isq} {{u:a}}`, check:V=>chkGt(V.a, T), hint:[(a<0)===(c<0) ? 'Zelfde teken: het quotiënt is positief.' : 'Verschillend teken: het quotiënt is negatief.', {u:'Vul aan.', line:`${dlT(a, c)} ${isq} ${T<0 ? MIN : '+'} (${Math.abs(a)} : ${Math.abs(c)}) ${isq} {{u:a}}`, check:V=>chkGt(V.a, T).ok, show:zS(T)}], sol:`${dlT(a, c)} ${isq} ${zS(T)}` }); });
  } };
DE.ber2 = { title:'Bereken met grotere getallen', lvl:2,
  instr:'Bereken. Een negatief getal typ je met een minteken.',
  build(b, st, save){
    const R = makeR(st); const P = [0, 1, 2, 3, 4, 5].map(k => { const c = R.sign()*R.pick([2, 3, 4, 5, 6, 8, 12, 15, 25]), q = R.sign()*R.int(3, 20); return [q*c, c]; });
    reeks(b, P.length, (g, i, nr) => { const [a, c] = P[i]; mQ(g, st, save, 'c' + i, { nr, html:`${dlT(a, c)} ${isq} {{u:a}}`, check:V=>chkG(V.a, a/c), hint:['Bepaal eerst het teken. Deel dan de absolute waarden.'], sol:`${dlT(a, c)} ${isq} ${zS(a/c)}` }); });
  } };
DE.gem = { title:'Gemiddelde temperatuur', lvl:2,
  instr:'Het gemiddelde: tel alle getallen op en deel door het aantal getallen.',
  build(b, st, save){
    const R = makeR(st); const L = [0, 1, 2].map(() => { for(let k=0; k<300; k++){ const T = [0, 0, 0, 0, 0].map(() => R.int(-15, 6)); const s = T.reduce((p, x) => p + x, 0); if(s % 5===0 && s<0) return T; } return [-4, -6, 2, -7, 0]; });
    const D = ['ma', 'di', 'wo', 'do', 'vr'];
    reeks(b, L.length, (g, i, nr) => { const T = L[i]; const s = T.reduce((p, x) => p + x, 0);
      mQ(g, st, save, 'g' + i, { nr, html:`<span class="txt">${T.map((t, j) => `${D[j]} ${zS(t)} °C`).join(', ')}. Gemiddelde:</span> {{u:a}} <span class="txt">°C</span>`, check:V=>chkG(V.a, s/5, [[s, 'Dat is de som. Deel nog door 5.']]),
        hint:['Tel eerst de vijf temperaturen op.', {u:'Vul aan.', line:`<span class="txt">som:</span> {{u:a}}`, check:V=>chkG(V.a, s).ok, show:zS(s)}, `Deel de som door 5: ${zS(s)} : 5.`], sol:`(${T.map(zS).join(' + ').replace(/\+ −/g, '+ (−').replace(/\(−(\d+)/g, '(−$1)')}) : 5 ${isq} ${zS(s)} : 5 ${isq} ${zS(s/5)}` }); }, {een:true});
  } };
DE.wnw = { title:'Waar of niet waar?', lvl:2,
  instr:'Denk na over 0 en over de tekens.',
  build(b, st, save){
    const R = makeR(st); const n = R.int(2, 9);
    const L = R.shuffle([[`0 : ${zP(-n)} ${isq} 0`, 'w', `0 gedeeld door een getal (niet 0) is 0.`], [`${zS(-n)} : 0 ${isq} 0`, 'n', 'Delen door 0 kan niet.'], [`${zS(-n)} : ${zP(-n)} ${isq} 1`, 'w', 'Een getal gedeeld door zichzelf is 1.'], [`${n} : ${zP(-1)} ${isq} ${n}`, 'n', `Delen door ${MIN}1 geeft het tegengestelde: ${zS(-n)}.`],
      [`${zS(-12)} : 3 ${isq} 3 : ${zP(-12)}`, 'n', 'Bij delen mag je niet wisselen.'], [`${zS(-24)} : ${zP(-6)} ${isq} 24 : 6`, 'w', 'Zelfde teken: het quotiënt is positief.']]).slice(0, 5);
    reeks(b, L.length, (g, i, nr) => { const [h, ans, why] = L[i]; qChoice(g, st, save, 'w' + i, { nr, html:`<span class="m5-groot">${h}</span>`, opts:WNW, ans, why }); });
  } };
DE.aanvul = { title:'Vul aan', lvl:3,
  instr:'Welk getal ontbreekt?',
  build(b, st, save){
    const R = makeR(st); const L = [0, 1, 2, 3, 4, 5].map(k => { const q = R.sign()*R.int(2, 15), c = R.sign()*R.int(2, 12); return [q*c, c, q, k % 3]; });
    reeks(b, L.length, (g, i, nr) => { const [a, c, q, w] = L[i];
      const html = w===0 ? `{{u:a}} : ${zP(c)} ${isq} ${zS(q)}` : w===1 ? `${zS(a)} : {{u:a}} ${isq} ${zS(q)}` : `${zS(a)} : ${zP(c)} ${isq} {{u:a}}`;
      mQ(g, st, save, 'a' + i, { nr, html, check:V=>chkG(V.a, w===0 ? a : w===1 ? c : q), sol:`${dlT(a, c)} ${isq} ${zS(q)}` }); });
  } };
DE.groot = { title:'Delen met grote getallen', lvl:3,
  instr:'Bereken. Zoek een handige manier.',
  build(b, st, save){
    const R = makeR(st); const L = [[-R.int(11, 40)*25, 25], [R.int(11, 60)*-50, -50], [-R.int(101, 999)*4, -4], [R.int(21, 99)*-12, 12], [-R.int(10, 99)*100, -R.int(2, 9)*100]];
    reeks(b, L.length, (g, i, nr) => { const [a, c] = L[i]; const T = a/c; mQ(g, st, save, 'g' + i, { nr, html:`${dlT(a, c)} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), sol:`${dlT(a, c)} ${isq} ${zS(T)}` }); });
  } };
const CHEAT_DEEL = `<h3>Spiekbriefje · delen</h3><table>
  <tr><td>regel</td><td>zoals vermenigvuldigen: zelfde teken +, verschillend teken ${MIN}<div class="m4-line">${dlT(-12, -3)} ${isq} 4</div><div class="m4-line">${dlT(12, -3)} ${isq} ${MIN}4</div></td></tr>
  <tr><td>controle</td><td>quotiënt · deler = deeltal</td></tr><tr><td>0</td><td>0 : ${zP(-5)} = 0, maar delen door 0 kan niet</td></tr></table>`;
SEC.deel = { id:'deel', ic:'z_deel', nav:'Delen', title:'Gehele getallen delen',
  tip:'Delen is de omgekeerde bewerking van vermenigvuldigen. De tekenregel is dezelfde: zelfde teken +, verschillend teken −.',
  cheat:CHEAT_DEEL, cards:[DE.omg, DE.teken, DE.ber, DE.ber2, DE.gem, DE.wnw, DE.aanvul, DE.groot] };
(function(){ const s = document.createElement('style'); s.textContent = `
  .m5-slier{display:inline-flex; align-items:center; justify-content:center; min-width:2.6rem; height:2.4rem; border:2px solid var(--tq); border-radius:.5rem; background:var(--tq-soft); padding:0 .4rem}
  .m5-pijl{font-size:1rem; color:var(--accent-dark); white-space:nowrap}
  `; document.head.append(s); })();
/* ============================================================
   ONDERDELEN 8 EN 9 · EIGENSCHAPPEN, DISTRIBUTIVITEIT
   ============================================================ */
Object.assign(ICONS, {
  z_eig:'<path d="M4 8h7M7.5 4.5v7M14 8h6M4 17h6M14 15h6M14 19h6"/>',
  z_distr:'<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M11 6v12"/>'
});
/* letters cursief, rekentekens netjes */
const ltH = s => zT(s).replace(/(^|[^a-z<])([a-z])(?![a-z>])/g, '$1<i>$2</i>');
const GL = [['=', 'gelijk'], ['≠', 'niet gelijk']];
const EI = {};
/* twee uitdrukkingen uitrekenen en vergelijken; P = [[E1, E2, uitleg]] */
function vglKaart(b, st, save, P, slot){
  naElkaar(b, st, save, P.length, (host, i, klaar) => { const [E1, E2, why] = P[i]; const T1 = ZX.waarde(E1).k, T2 = ZX.waarde(E2).k;
    const Pn = paneel(host); Pn.vis.append(el('div', 'm5-vgl2', `<div>${zT(E1)}</div><div class="m5-vq">${T1===T2 ? '=' : '≠'}<span>?</span></div><div>${zT(E2)}</div>`));
    stapKop(Pn.stap, 1, 'Reken beide kanten uit.'); const s1 = el('div'), s2 = el('div', 'm5-rs'); Pn.stap.append(s1, s2);
    const k2 = stapKop(s2, 2, 'Zijn de uitkomsten gelijk?'); k2.classList.add('uit'); const vr = el('div'); s2.append(vr);
    const verder = () => { k2.classList.remove('uit'); if(vr.firstChild) return;
      qChoice(vr, st, save, 'k' + i, { html:'', opts:GL, sym:true, ans:T1===T2 ? '=' : '≠', why, whyBad:'Vergelijk de twee uitkomsten die je net berekende.', after:(ok, nieuw) => { if(ok){ Pn.vis.querySelector('.m5-vq').classList.add('af'); if(nieuw) klaar(); } } }); };
    mQ(s1, st, save, 'r' + i, { html:`${zT(E1)} ${isq} {{u:a}}<span class="m5-nl"></span>${zT(E2)} ${isq} {{u:b}}`, check:V=>allOf([['a', chkGt(V.a, T1)], ['b', chkGt(V.b, T2)]]), onOk:() => verder() }); },
    slot, P.map(([E1, E2]) => `${zT(E1)} ${ZX.waarde(E1).k===ZX.waarde(E2).k ? '=' : '≠'} ${zT(E2)}`));
}
EI.wissel = { title:'Mag je wisselen?', lvl:1,
  instr:'Wissel de twee getallen van plaats. Blijft de uitkomst gelijk? Reken beide kanten uit en vergelijk.',
  build(b, st, save){ const R = makeR(st); const a = nz(R, -9, 9), c = nz(R, -9, 9), f = nz(R, -9, 9), h = nz(R, -9, 9);
    let x = nz(R, -9, 9), y = nz(R, -9, 9); while(x===y) y = nz(R, -9, 9);
    vglKaart(b, st, save, [[`${zS(a)} + ${zP(c)}`, `${zS(c)} + ${zP(a)}`, 'Bij optellen mag je de termen wisselen.'], [`${zS(x)} − ${zP(y)}`, `${zS(y)} − ${zP(x)}`, 'Bij aftrekken mag je niet wisselen: je krijgt het tegengestelde.'],
      [`${zS(f)} · ${zP(h)}`, `${zS(h)} · ${zP(f)}`, 'Bij vermenigvuldigen mag je de factoren wisselen.']],
      'Optellen en vermenigvuldigen zijn <b>commutatief</b>: je mag wisselen (wisseleigenschap). Bij aftrekken mag dat niet.'); } };
EI.schakel = { title:'Mag je schakelen?', lvl:1,
  instr:'Zet de haakjes op een andere plaats. Blijft de uitkomst gelijk? Reken beide kanten uit en vergelijk.',
  build(b, st, save){ const R = makeR(st); const a = nz(R, -9, 9), c = nz(R, -9, 9), d = nz(R, -9, 9), x = nz(R, -9, 9), y = nz(R, -6, 6), z = nz(R, -6, 6), f = R.sign()*R.int(2, 4), g = R.sign()*R.int(2, 4), h = R.sign()*R.int(2, 4);
    vglKaart(b, st, save, [[`(${zS(a)} + ${zP(c)}) + ${zP(d)}`, `${zS(a)} + (${zS(c)} + ${zP(d)})`, 'Bij optellen mag je schakelen.'],
      [`(${zS(x)} − ${zP(y)}) − ${zP(z)}`, `${zS(x)} − (${zS(y)} − ${zP(z)})`, 'Bij aftrekken mag je niet schakelen.'],
      [`(${zS(f)} · ${zP(g)}) · ${zP(h)}`, `${zS(f)} · (${zS(g)} · ${zP(h)})`, 'Bij vermenigvuldigen mag je schakelen.']],
      'Optellen en vermenigvuldigen zijn <b>associatief</b>: je mag schakelen (schakeleigenschap). Bij aftrekken en delen mag dat niet.'); } };
EI.vul = { title:'Bijzondere getallen', lvl:1,
  instr:'Welk getal ontbreekt? Denk aan 0, 1 en het tegengestelde.',
  build(b, st, save){
    const R = makeR(st); const n = () => nz(R, -40, 40);
    const L = R.shuffle([() => { const a = n(); return [`${zS(a)} + {{u:a}} ${isq} ${zS(a)}`, 0, 'Het neutraal element voor de optelling is 0.']; },
      () => { const a = n(); return [`{{u:a}} · ${zP(a)} ${isq} ${zS(a)}`, 1, 'Het neutraal element voor de vermenigvuldiging is 1.']; },
      () => { const a = n(); return [`${zS(a)} + {{u:a}} ${isq} 0`, -a, `Een getal plus zijn tegengestelde is 0. Het tegengestelde van ${zS(a)} is ${zS(-a)}: het symmetrisch element.`]; },
      () => { const a = n(); return [`${zS(a)} · {{u:a}} ${isq} 0`, 0, '0 is opslorpend voor de vermenigvuldiging: elk getal maal 0 is 0.']; },
      () => { const a = n(); return [`{{u:a}} + ${zP(a)} ${isq} 0`, -a, `Het tegengestelde van ${zS(a)} is ${zS(-a)}.`]; },
      () => { const a = n(); return [`${zS(a)} · {{u:a}} ${isq} ${zS(-a)}`, -1, `Maal ${MIN}1 geeft het tegengestelde.`]; }]).map(f => f());
    reeks(b, L.length, (g, i, nr) => { const [h, T, why] = L[i]; mQ(g, st, save, 'v' + i, { nr, html:h, check:V=>chkG(V.a, T), sol:why }); });
  } };
const EIG5 = [['w', 'wisseleigenschap'], ['s', 'schakeleigenschap'], ['n', 'neutraal element'], ['y', 'symmetrisch element'], ['o', 'opslorpend element']];
EI.benoem = { title:'Welke eigenschap?', lvl:1,
  instr:'Welke eigenschap wordt hier gebruikt?',
  build(b, st, save){
    const R = makeR(st); const n = () => nz(R, -20, 20); const a = n(), c = n(), d = n(), e = n(), f = n(), g = n(), h = n();
    const L = R.shuffle([[`${zS(a)} + ${zP(c)} ${isq} ${zS(c)} + ${zP(a)}`, 'w'], [`(${zS(d)} · ${zP(e)}) · ${zP(f)} ${isq} ${zS(d)} · (${zS(e)} · ${zP(f)})`, 's'], [`${zS(g)} + 0 ${isq} ${zS(g)}`, 'n'],
      [`${zS(h)} + ${zP(-h)} ${isq} 0`, 'y'], [`${zS(a)} · 0 ${isq} 0`, 'o'], [`1 · ${zP(c)} ${isq} ${zS(c)}`, 'n'], [`${zS(d)} · ${zP(e)} ${isq} ${zS(e)} · ${zP(d)}`, 'w']]).slice(0, 6);
    const W = {w:'De getallen wisselen van plaats.', s:'De haakjes staan op een andere plaats.', n:'Er verandert niets aan het getal: 0 bij plus, 1 bij maal.', y:'Een getal plus zijn tegengestelde geeft 0.', o:'Maal 0 geeft altijd 0.'};
    reeks(b, L.length, (gg, i, nr) => { const [h2, ans] = L[i]; qChoice(gg, st, save, 'e' + i, { nr, html:`<span class="m5-groot">${h2}</span>`, opts:EIG5, ans, why:W[ans] }); }, {een:true});
  } };
EI.gelijk = { title:'Gelijk of niet?', lvl:2,
  instr:'Reken niet uit. Kies = als beide kanten altijd dezelfde uitkomst geven.',
  build(b, st, save){
    const R = makeR(st); const n = () => nz(R, -30, 30); const a = n(), c = n(), d = n();
    const L = R.shuffle([[`${zS(a)} − ${zP(c)} … ${zS(c)} − ${zP(a)}`, '≠', 'Bij aftrekken mag je niet wisselen.'], [`${zS(a)} · ${zP(c)} · ${zP(d)} … ${zS(d)} · ${zP(a)} · ${zP(c)}`, '=', 'Bij vermenigvuldigen mag je wisselen en schakelen.'],
      [`${zS(a)} + ${zP(c)} + ${zP(d)} … ${zS(d)} + ${zP(c)} + ${zP(a)}`, '=', 'Bij optellen mag je wisselen en schakelen.'], [`(${zS(a)} − ${zP(c)}) − ${zP(d)} … ${zS(a)} − (${zS(c)} − ${zP(d)})`, '≠', 'Bij aftrekken mag je niet schakelen.'],
      [`${zS(a)} − ${zP(c)} … ${zS(a)} + ${zP(-c)}`, '=', 'Aftrekken is het tegengestelde optellen.'], [`${zS(a*4)} : 4 … 4 : ${zP(a*4)}`, '≠', 'Bij delen mag je niet wisselen.']]);
    reeks(b, L.length, (g, i, nr) => { const [h, ans, why] = L[i]; qChoice(g, st, save, 'g' + i, { nr, html:`<span class="m5-groot">${h}</span>`, opts:GL, sym:true, ans, why }); }, {een:true});
  } };
EI.handig = { title:'Handig rekenen', lvl:2,
  instr:'Wissel en schakel slim zodat je makkelijk kan rekenen. Werk uit in het vak.',
  build(b, st, save){
    const R = makeR(st); const a = R.int(11, 89), c = R.int(3, 19), d = R.int(21, 79), m = R.int(3, 19), p = R.int(11, 49);
    const L = R.shuffle([`-${a} + ${c} + ${a}`, `4 · (-${m}) · 25`, `-${d} + ${c} + (-${100 - d})`, `(-2) · ${m} · (-5)`, `${p} + (-${c}) + (-${p}) + ${c} + (-7)`, `-25 · ${R.int(3, 9)} · (-4)`]).slice(0, 4);
    reeks(b, L.length, (g, i, nr) => vrijOpg(g, st, save, 'h' + i, nr, L[i], {k:'mh', hint:['Zoek getallen die samen 0, 10 of 100 geven (bij +) of 10 of 100 (bij ·). Zet ze naast elkaar: je mag wisselen en schakelen.']}));
  } };
/* verdieping */
EI.alle = { title:'Voor alle … ?', lvl:3,
  instr:'∀ betekent "voor alle", ∃! betekent "er bestaat precies één". Is de uitspraak waar of niet waar?',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['∀ <i>a</i> ∈ ℤ: <i>a</i> + 0 = <i>a</i>', 'w', '0 is het neutraal element voor de optelling.'], ['∀ <i>a</i>, <i>b</i> ∈ ℤ: <i>a</i> − <i>b</i> = <i>b</i> − <i>a</i>', 'n', 'Tegenvoorbeeld: 5 − 2 = 3, maar 2 − 5 = −3.'],
      ['∀ <i>a</i> ∈ ℤ, ∃! <i>b</i> ∈ ℤ: <i>a</i> + <i>b</i> = 0', 'w', 'Elk geheel getal heeft precies één tegengestelde.'], ['∀ <i>a</i> ∈ ℤ₀, ∃! <i>b</i> ∈ ℤ: <i>a</i> · <i>b</i> = 1', 'n', 'Voor 2 bestaat er geen geheel getal b met 2 · b = 1.'],
      ['∀ <i>a</i>, <i>b</i> ∈ ℤ: <i>a</i> · <i>b</i> = <i>b</i> · <i>a</i>', 'w', 'Vermenigvuldigen is commutatief.'], ['∀ <i>a</i> ∈ ℤ: <i>a</i> · 0 = 0', 'w', '0 is opslorpend voor de vermenigvuldiging.'],
      ['∀ <i>a</i>, <i>b</i> ∈ ℤ: <i>a</i> − <i>b</i> ∈ ℤ', 'w', 'Het verschil van twee gehele getallen is altijd een geheel getal.'], ['∀ <i>a</i>, <i>b</i> ∈ ℤ₀: <i>a</i> : <i>b</i> ∈ ℤ', 'n', 'Tegenvoorbeeld: 3 : 2 is geen geheel getal.']]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [h, ans, why] = L[i]; qChoice(g, st, save, 'a' + i, { nr, html:`<span class="m5-groot">${h}</span>`, opts:WNW, ans, why }); }, {een:true});
  } };
EI.tegen = { title:'Zoek een tegenvoorbeeld', lvl:3,
  instr:'Kies zelf gehele getallen die tonen dat de uitspraak <b>niet altijd</b> waar is.',
  build(b, st, save){
    const getal = v => { const x = rdZ(v); return x; };
    const L = [
      {h:`<i>a</i> − <i>b</i> = <i>b</i> − <i>a</i>`, k:['a', 'b'], t:'Aftrekken is niet commutatief.', f:([a, c]) => a - c !== c - a, m:'Met die getallen klopt de gelijkheid toevallig wel. Kies twee verschillende getallen.', s:([a, c]) => `${zS(a)} − ${zP(c)} = ${zS(a - c)} en ${zS(c)} − ${zP(a)} = ${zS(c - a)}`},
      {h:`(<i>a</i> − <i>b</i>) − <i>c</i> = <i>a</i> − (<i>b</i> − <i>c</i>)`, k:['a', 'b', 'c'], t:'Aftrekken is niet associatief.', f:([a, c, d]) => (a - c) - d !== a - (c - d), m:'Met die getallen klopt de gelijkheid toevallig wel. Probeer een andere c.', s:([a, c, d]) => `(${zS(a)} − ${zP(c)}) − ${zP(d)} = ${zS(a - c - d)} en ${zS(a)} − (${zS(c)} − ${zP(d)}) = ${zS(a - c + d)}`},
      {h:`|<i>a</i> + <i>b</i>| = |<i>a</i>| + |<i>b</i>|`, k:['a', 'b'], t:'De absolute waarde van een som is niet altijd de som van de absolute waarden.', f:([a, c]) => Math.abs(a + c) !== Math.abs(a) + Math.abs(c), m:'Met die getallen klopt de gelijkheid toevallig wel. Wat als de tekens verschillen?', s:([a, c]) => `|${zS(a)} + ${zP(c)}| = ${Math.abs(a + c)} en |${zS(a)}| + |${zS(c)}| = ${Math.abs(a) + Math.abs(c)}`},
      {h:`<i>a</i> · <i>b</i> &gt; <i>a</i>`, k:['a', 'b'], t:'Vermenigvuldigen maakt een getal niet altijd groter.', f:([a, c]) => !(a*c > a), m:'Met die getallen klopt het wel. Probeer een negatief getal.', s:([a, c]) => `${zS(a)} · ${zP(c)} = ${zS(a*c)}, en dat is niet groter dan ${zS(a)}`}];
    reeks(b, L.length, (g, i, nr) => { const e = L[i];
      mQ(g, st, save, 't' + i, { nr, html:`<span class="txt">Uitspraak:</span> <span class="m5-groot">${e.h}</span><span class="m5-nl"></span>${e.k.map(k => `<i>${k}</i> ${isq} {{u:${k}}}`).join(' <span class="txt">en</span> ')}`,
        check:V=>{ const X = e.k.map(k => getal(V[k])); if(X.some(x => x==null)) return {info:true, msg:'Vul bij elke letter een geheel getal in.'}; return e.f(X) ? {ok:true, msg:e.s(X) + '. ' + e.t} : {ok:false, msg:e.m}; } }); }, {een:true});
  } };
const CHEAT_EIG = `<h3>Spiekbriefje · eigenschappen</h3><table>
  <tr><td>wisselen</td><td>mag bij + en ·: ${MIN}3 + 5 = 5 + (${MIN}3), maar niet bij − en :</td></tr>
  <tr><td>schakelen</td><td>mag bij + en ·: (${MIN}2 · 5) · 7 = ${MIN}2 · (5 · 7), maar niet bij − en :</td></tr>
  <tr><td>neutraal element</td><td>0 voor +: <i>a</i> + 0 = <i>a</i>; 1 voor ·: <i>a</i> · 1 = <i>a</i></td></tr>
  <tr><td>symmetrisch element</td><td>het tegengestelde: <i>a</i> + (${MIN}<i>a</i>) = 0</td></tr>
  <tr><td>opslorpend element</td><td>0 voor ·: <i>a</i> · 0 = 0</td></tr>
  <tr><td>handig rekenen</td><td>zet getallen die samen 0, 10 of 100 geven naast elkaar: 4 · (${MIN}17) · 25 = 4 · 25 · (${MIN}17) = ${MIN}1 700</td></tr></table>`;
SEC.eig = { id:'eig', ic:'z_eig', nav:'Eigenschappen', title:'Eigenschappen van de bewerkingen',
  tip:'Bij optellen en vermenigvuldigen mag je wisselen en schakelen. Zo kan je handig rekenen. Bij aftrekken en delen mag dat niet.',
  cheat:CHEAT_EIG, cards:[EI.wissel, EI.schakel, EI.vul, EI.benoem, EI.gelijk, EI.handig, EI.alle, EI.tegen] };

/* ============================================================ 9 distributiviteit */
const DI = {};
/* rechthoekmodel: hoogte a, breedtes b en c */
function rechtSvg(a, c, d, o={}){ const W = 440, H = 170, x0 = 60, y0 = 30, h = 110; const tot = Math.abs(c) + Math.abs(d); const w1 = Math.max(70, (W - x0 - 20)*Math.abs(c)/tot), w2 = W - x0 - 20 - w1;
  let s = `<rect class="rh-a" x="${x0}" y="${y0}" width="${fx(w1)}" height="${h}"/><rect class="rh-b" x="${fx(x0 + w1)}" y="${y0}" width="${fx(w2)}" height="${h}"/>`;
  s += sT(x0 + w1/2, y0 - 14, zS(c), 'rh-l') + sT(x0 + w1 + w2/2, y0 - 14, zS(d), 'rh-l') + sT(x0 - 22, y0 + h/2, zS(a), 'rh-l');
  s += sT(x0 + w1/2, y0 + h/2, o.p!=null ? zS(o.p) : `${zS(a)} · ${zP(c)}`, 'rh-t') + sT(x0 + w1 + w2/2, y0 + h/2, o.q!=null ? zS(o.q) : `${zS(a)} · ${zP(d)}`, 'rh-t');
  return svgWrap(W, H, s, {alt:'rechthoekmodel', maxw:460, cls:'m5-recht'}); }
DI.recht = { title:'Het rechthoekmodel', lvl:1,
  instr:'Het getal voor de haakjes vermenigvuldig je met elke term tussen de haakjes. Vul de twee vakken in en tel op.',
  build(b, st, save){
    const R = makeR(st); const P = [[R.int(2, 6), R.int(2, 9), -R.int(2, 9)], [-R.int(2, 6), R.int(2, 9), R.int(2, 9)], [-R.int(2, 6), R.int(2, 9), -R.int(2, 9)]];
    naElkaar(b, st, save, P.length, (host, i, klaar) => { const [a, c, d] = P[i], p = a*c, q = a*d;
      const Pn = paneel(host); const fig = el('div', '', rechtSvg(a, c, d)); Pn.vis.append(fig, el('p', 'm5-groot', `${zS(a)} · (${zS(c)} + ${zP(d)})`));
      stapKop(Pn.stap, 1, 'Reken elk vak uit.');
      mQ(Pn.stap, st, save, 'v' + i, { html:`${zS(a)} · ${zP(c)} ${isq} {{u:p}}<span class="m5-nl"></span>${zS(a)} · ${zP(d)} ${isq} {{u:q}}`, check:V=>allOf([['p', chkGt(V.p, p)], ['q', chkGt(V.q, q)]]),
        onOk:s=>{ fig.innerHTML = rechtSvg(a, c, d, {p, q}); if(Pn.stap.querySelector('.m5-rs')) return; const k2 = el('div', 'm5-rs'); Pn.stap.append(k2); stapKop(k2, 2, 'Tel de twee vakken op.');
          mQ(k2, st, save, 's' + i, { html:`${zS(a)} · (${zS(c)} + ${zP(d)}) ${isq} ${zS(p)} + ${zP(q)} ${isq} {{u:r}}`, check:V=>chkGt(V.r, p + q), onOk:s2=>{ if(!s2) klaar(); } }); } }); },
      'Distributiviteit: <i>a</i> · (<i>b</i> + <i>c</i>) = <i>a</i> · <i>b</i> + <i>a</i> · <i>c</i>.', P.map(([a, c, d]) => `${zS(a)} · (${zS(c)} + ${zP(d)}) = ${zS(a*c + a*d)}`));
  } };
DI.uit = { title:'Haakjes uitwerken', lvl:1,
  instr:'Vermenigvuldig het getal voor de haakjes met elke term. Vul de producten in en reken uit.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle([[-R.int(2, 9), R.int(2, 9), R.int(2, 9), '+'], [R.int(2, 9), R.int(2, 9), R.int(2, 9), '−'], [-R.int(2, 9), R.int(2, 9), R.int(2, 9), '−'], [-R.int(2, 9), -R.int(2, 9), R.int(2, 9), '+'], [R.int(2, 9), -R.int(2, 9), R.int(2, 9), '−']]);
    reeks(b, P.length, (g, i, nr) => { const [a, c, d, op] = P[i]; const q = op==='+' ? a*d : -a*d; const T = a*c + q;
      mQ(g, st, save, 'u' + i, { nr, html:`${zS(a)} · (${zS(c)} ${op} ${d}) ${isq} {{u:p}} + ({{u:q}}) ${isq} {{u:r}}`, check:V=>allOf([['p', chkGt(V.p, a*c)], ['q', chkGt(V.q, q, [[-q, op==='−' ? `Let op het minteken: ${zS(a)} · (${MIN}${d}) = ${zS(-a*d)}.` : 'Kijk naar de tekens.']])], ['r', chkGt(V.r, T)]]),
        hint:[`${zS(a)} · ${zP(c)} en ${zS(a)} · ${zP(op==='+' ? d : -d)}`], sol:`${zS(a)} · ${zP(c)} + ${zS(a)} · ${zP(op==='+' ? d : -d)} ${isq} ${zS(a*c)} + ${zP(q)} ${isq} ${zS(T)}` }); }, {een:true});
  } };
DI.ontbreek = { title:'Vul aan', lvl:2,
  instr:'Welk getal ontbreekt? Kijk naar de twee producten.',
  build(b, st, save){
    const R = makeR(st); const P = [0, 1, 2, 3, 4].map(k => [nz(R, -9, 9), nz(R, -9, 9), nz(R, -9, 9), k % 3]);
    reeks(b, P.length, (g, i, nr) => { const [a, c, d, w] = P[i];
      const L = [w===0 ? '{{u:a}}' : zS(a), w===1 ? '{{u:a}}' : zS(c), w===2 ? '{{u:a}}' : zP(d)];
      mQ(g, st, save, 'o' + i, { nr, html:`${L[0]} · (${L[1]} + ${L[2]}) ${isq} ${zS(a*c)} + ${zP(a*d)}`, check:V=>chkG(V.a, [a, c, d][w]), sol:`${zS(a)} · (${zS(c)} + ${zP(d)}) ${isq} ${zS(a*c)} + ${zP(a*d)}` }); });
  } };
DI.handig = { title:'Handig rekenen', lvl:2,
  instr:'Schrijf het tweede getal als een som of verschil met een rond getal. Reken dan met de distributiviteit.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle([[R.int(3, 9), 100, -R.int(1, 3)], [-R.int(3, 9), 100, R.int(1, 4)], [-R.int(3, 9), 100, -R.int(1, 3)], [R.int(3, 9), -100, R.int(1, 3)], [-R.int(11, 15), 10, R.int(1, 2)]]).slice(0, 4);
    reeks(b, P.length, (g, i, nr) => { const [a, r, e] = P[i]; const n = r + e;
      mQ(g, st, save, 'h' + i, { nr, html:`${zS(a)} · ${zP(n)} ${isq} ${zS(a)} · (${zS(r)} ${e<0 ? '−' : '+'} ${Math.abs(e)}) ${isq} {{u:p}} + ({{u:q}}) ${isq} {{u:r}}`,
        check:V=>allOf([['p', chkG(V.p, a*r)], ['q', chkG(V.q, a*e)], ['r', chkG(V.r, a*n)]]), hint:[`Vermenigvuldig ${zS(a)} met ${zS(r)} en met ${zS(e)}.`], sol:`${zS(a*r)} + ${zP(a*e)} ${isq} ${zS(a*n)}` }); }, {een:true});
  } };
DI.buiten = { title:'Buiten haakjes brengen', lvl:2,
  instr:'Beide producten hebben dezelfde factor. Breng die factor buiten haakjes en reken handig.',
  build(b, st, save){
    const R = makeR(st); const P = [100, -100, 100, -100].map(t => { const a = R.sign()*R.int(2, 15), c = R.int(11, 89); return [a, c, t - c]; });
    reeks(b, P.length, (g, i, nr) => { const [a, c, e] = P[i]; const s = c + e;
      mQ(g, st, save, 'b' + i, { nr, html:`${zS(a)} · ${c} + ${zS(a)} · ${zP(e)} ${isq} ${zS(a)} · ({{u:s}}) ${isq} {{u:r}}`, check:V=>allOf([['s', chkG(V.s, s)], ['r', chkG(V.r, a*s)]]),
        hint:[`${c} + ${zP(e)} ${isq} ${zS(s)}`], sol:`${zS(a)} · (${c} + ${zP(e)}) ${isq} ${zS(a)} · ${zP(s)} ${isq} ${zS(a*s)}` }); }, {een:true});
  } };
/* met letters: vrij vak */
function letterOpg(g, st, save, id, nr, E, hint=true){
  const T = ZX.waarde(E);
  mQ(g, st, save, id, { nr, html:`<span class="m5-opg">${ltH(E)}</span> {{z:a,mh}}`, check:V=>chkZ(V.a, T, {opg:E}),
    hint:hint ? ['Vermenigvuldig het getal voor de haakjes met elke term tussen de haakjes. Let op de tekens.'] : undefined, sol:`${ltH(E)} ${isq} ${ZX.H(T).replace(/ · <i>/g, '<i>')}` }); }
DI.letter = { title:'Met letters', lvl:2,
  instr:'Werk de haakjes weg. Een letter vermenigvuldig je zoals een getal: 3 · <i>x</i> schrijf je als 3<i>x</i>.',
  build(b, st, save){
    const R = makeR(st); const x = () => R.pick(['x', 'a', 'y']); const n = () => R.int(2, 9);
    const L = [() => `${n()} · (${x()} + ${n()})`, () => `-${n()} · (${x()} + ${n()})`, () => `${n()} · (${x()} - ${n()})`, () => `-${n()} · (${x()} - ${n()})`, () => `-(${x()} - ${n()})`, () => `-${n()} · (${n()} - ${x()})`];
    const P = L.map(f => f());
    reeks(b, P.length, (g, i, nr) => letterOpg(g, st, save, 'l' + i, nr, P[i]), {een:true});
  } };
/* verdieping */
DI.twee = { title:'Langere haakjes', lvl:3,
  instr:'Werk de haakjes weg. Vermenigvuldig met elke term.',
  build(b, st, save){
    const R = makeR(st); const n = () => R.int(2, 9);
    const P = [`-${n()} · (a - ${n()}b + ${n()})`, `${n()} · (-x + ${n()}y - ${n()})`, `-(${n()}a - b - ${n()})`, `-${n()} · (-${n()}x + ${n()})`];
    reeks(b, P.length, (g, i, nr) => letterOpg(g, st, save, 't' + i, nr, P[i], false), {een:true});
  } };
DI.groot = { title:'Slim met grote getallen', lvl:3,
  instr:'Bereken zo handig mogelijk. Je mag de tussenstappen schrijven.',
  build(b, st, save){
    const R = makeR(st); const a = R.int(12, 48), c = R.int(3, 9), d = R.int(21, 79), e = R.int(13, 37);
    const P = [`-${a} · 99`, `${c} · (-1002)`, `-${e} · ${d} - ${e} · ${100 - d}`, `-25 · (40 - ${c})`, `${e} · (-101)`];
    reeks(b, P.length, (g, i, nr) => vrijOpg(g, st, save, 'g' + i, nr, P[i], {k:'mh', hint:false}), {een:true});
  } };
const CHEAT_DISTR = `<h3>Spiekbriefje · distributiviteit</h3><table>
  <tr><td>regel</td><td><i>a</i> · (<i>b</i> + <i>c</i>) = <i>a</i> · <i>b</i> + <i>a</i> · <i>c</i><div class="m4-line">${MIN}3 · (5 + (${MIN}2)) = ${MIN}15 + 6 = ${MIN}9</div></td></tr>
  <tr><td>met letters</td><td>${MIN}4 · (<i>x</i> − 2) = ${MIN}4<i>x</i> + 8</td></tr>
  <tr><td>een min voor de haakjes</td><td>${MIN}(<i>x</i> − 7) = ${MIN}<i>x</i> + 7: elk teken verandert</td></tr>
  <tr><td>handig</td><td>7 · 98 = 7 · (100 − 2) = 700 − 14 = 686</td></tr></table>`;
SEC.distr = { id:'distr', ic:'z_distr', nav:'Distributiviteit', title:'Distributiviteit en handig rekenen',
  tip:'Het getal voor de haakjes vermenigvuldig je met elke term tussen de haakjes. Let telkens op het teken.',
  cheat:CHEAT_DISTR, cards:[DI.recht, DI.uit, DI.ontbreek, DI.handig, DI.buiten, DI.letter, DI.twee, DI.groot] };
(function(){ const s = document.createElement('style'); s.textContent = `
  .m5-vgl2{display:flex; flex-direction:column; align-items:center; gap:.3rem; font-size:1.35rem; font-weight:700; font-variant-numeric:tabular-nums; padding:.4rem 0}
  .m5-vq{width:2.4rem; height:2.4rem; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--or-soft); border:2px solid var(--orange); font-size:0; color:var(--accent-dark)}
  .m5-vq span{font-size:1.2rem} .m5-vq.af{font-size:1.35rem; background:var(--ok-bg); border-color:var(--ok)} .m5-vq.af span{display:none}
  .m5-recht .rh-a{fill:#e4f6f7; stroke:var(--ink); stroke-width:2} .m5-recht .rh-b{fill:#fff1d6; stroke:var(--ink); stroke-width:2}
  .m5-recht .rh-l{font-size:18px; font-weight:800; fill:var(--ink)} .m5-recht .rh-t{font-size:19px; font-weight:700; fill:#173436}
  .m5-rs{margin-top:.6rem}
  .m5-nl{flex-basis:100%; height:0}
  `; document.head.append(s); })();
/* ============================================================
   ONDERDEEL 10 · GEDURIGE SOM EN GEDURIG PRODUCT
   ============================================================ */
Object.assign(ICONS, {
  z_gedur:'<path d="M3 12h3M9 12h3M15 12h3M4.5 10.5v3M16.5 10.5v3"/><path d="M20 9l1.5 3L20 15"/>'
});
/* som zonder haakjes: −5 + 8 − 3 */
const kaalS = t => t.map((x, i) => i ? (x<0 ? ' − ' : ' + ') + dz(Math.abs(x)) : zS(x)).join('');
const kleurS = t => t.map((x, i) => `<span class="m5-term ${x<0 ? 'neg' : 'pos'}">${i ? (x<0 ? '− ' : '+ ') + dz(Math.abs(x)) : zS(x)}</span>`).join(' ');
const somV = t => t.reduce((p, x) => p + x, 0);
const GD = {};
GD.stap = { title:'Plustermen en mintermen', lvl:1,
  instr:'Tel eerst alle plustermen samen, dan alle mintermen. Reken daarna de twee uitkomsten samen.',
  build(b, st, save){
    const R = makeR(st); const L = [0, 1, 2, 3].map(k => { const n = k<2 ? 4 : 5; const t = []; for(let j=0; j<n; j++) t.push((j===0 || R.f() < .5 ? -1 : 1)*R.int(1, 12)); if(t.every(x => x<0)) t[1] = -t[1]; return t; });
    reeks(b, L.length, (g, i, nr) => { const t = L[i]; const p = somV(t.filter(x => x>0)), m = somV(t.filter(x => x<0));
      mQ(g, st, save, 's' + i, { nr, html:`<span class="m5-groot m5-som">${kleurS(t)}</span><span class="m5-nl"></span><span class="txt m5-pl">plustermen samen</span> {{u:p}} <span class="txt m5-mi">mintermen samen</span> {{u:m}} <span class="txt">uitkomst</span> {{u:r}}`,
        check:V=>allOf([['p', chkGt(V.p, p)], ['m', chkGt(V.m, m)], ['r', chkGt(V.r, p + m)]]),
        hint:[`De plustermen zijn ${t.filter(x => x>0).join(', ')}.`, `Reken tot slot ${zS(p)} + ${zP(m)}.`], sol:`${zS(p)} + ${zP(m)} ${isq} ${zS(p + m)}` }); }, {een:true});
  } };
GD.paar = { title:'Eerst de tekenparen', lvl:1,
  instr:'Schrijf de som zonder haakjes: kies voor elk tekenpaar één teken. Reken dan uit.',
  build(b, st, save){
    const R = makeR(st); const L = [0, 1, 2].map(() => { const a = nz(R, -15, 15); const T = [0, 1, 2, 3].map(() => [R.pick(['+', '−']), R.sign()*R.int(1, 15)]); return [a, T]; });
    reeks(b, L.length, (g, i, nr) => { const [a, T] = L[i]; const nieuw = T.map(([o, c]) => (o==='+') === (c>0) ? '+' : '-'); const val = a + somV(T.map(([o, c]) => o==='+' ? c : -c));
      const E = zS(a) + T.map(([o, c]) => ` ${o} (${c<0 ? MIN : '+'}${c<0 ? -c : c})`).join('');
      mQ(g, st, save, 'p' + i, { nr, html:`<span class="m5-groot">${E}</span><span class="m5-nl"></span>${isq} ${zS(a)} ${T.map(([, c], k) => `{{s:s${k}}} ${Math.abs(c)}`).join(' ')} ${isq} {{u:r}}`,
        check:V=>allOf(T.map((_, k) => ['s' + k, (V['s' + k]||{}).s===nieuw[k] ? {ok:true} : {ok:false, msg:'Twee gelijke tekens worden +, twee verschillende tekens worden −.'}]).concat([['r', chkGt(V.r, val)]])),
        sol:`${E} ${isq} ${kaalS([a].concat(T.map(([o, c]) => o==='+' ? c : -c)))} ${isq} ${zS(val)}` }); }, {een:true});
  } };
GD.vrij = { title:'Bereken de gedurige som', lvl:2,
  instr:'Werk uit in het vak. Je mag eerst de tekenparen wegwerken en daarna plustermen en mintermen samentellen.',
  build(b, st, save){
    const R = makeR(st); const t = () => R.int(2, 60);
    const L = [0, 1, 2, 3].map(k => { let s = zS(-t()); for(let j=0; j<3 + (k>1 ? 1 : 0); j++){ const o = R.pick(['+', '−']), c = R.sign()*t(); s += ` ${o} ${zP(c)}`; } return s; });
    reeks(b, L.length, (g, i, nr) => vrijOpg(g, st, save, 'v' + i, nr, L[i], {k:'h', hint:['Werk eerst de tekenparen weg: twee gelijke tekens worden +, twee verschillende tekens worden −.', 'Tel dan alle plustermen samen en alle mintermen samen.']}), {een:true});
  } };
GD.prod = { title:'Gedurig product', lvl:1,
  instr:'Bepaal eerst het teken: tel de mintekens. Vermenigvuldig dan de absolute waarden.',
  build(b, st, save){
    const R = makeR(st); const L = [3, 3, 4, 4, 3, 4].map(n => { const f = []; for(let k=0; k<n; k++) f.push(R.sign()*R.int(1, n===3 ? 5 : 3)); if(f.every(x => x>0)) f[0] = -f[0]; return f; });
    reeks(b, L.length, (g, i, nr) => { const f = L[i]; const T = f.reduce((p, x) => p*x, 1); const m = f.filter(x => x<0).length; const E = f.map((x, k) => k ? zP(x) : zS(x)).join(' · ');
      mQ(g, st, save, 'p' + i, { nr, html:`${E} ${isq} {{u:a}}`, check:V=>chkGt(V.a, T),
        hint:[`${m} ${m===1 ? 'minteken' : 'mintekens'}: ${m % 2 ? 'oneven, dus negatief' : 'even, dus positief'}.`, `${f.map(x => Math.abs(x)).join(' · ')} ${isq} ${Math.abs(T)}`], sol:`${E} ${isq} ${zS(T)}` }); });
  } };
GD.kassa = { title:'De kassabon', lvl:2,
  instr:'Bedragen die je betaalt zijn positief, kortingen en bonnen zijn negatief. Reken het totaal uit.',
  build(b, st, save){
    const R = makeR(st);
    const W = [['Sportschoenen', 45, 90], ['T-shirt', 8, 25], ['Rugzak', 20, 45], ['Drinkbus', 6, 15], ['Pet', 9, 19], ['Voetbal', 12, 30]];
    const K = [['Korting solden', 5, 20], ['Waardebon', 5, 15], ['Klantenkaart', 2, 6], ['Actie 2e halve prijs', 4, 12]];
    const L = [0, 1].map(() => { const A = R.shuffle(W.slice()).slice(0, 3).map(([n, lo, hi]) => [n, R.int(lo, hi)]); const B = R.shuffle(K.slice()).slice(0, 2).map(([n, lo, hi]) => [n, -R.int(lo, hi)]); return R.shuffle(A.concat(B)); });
    reeks(b, L.length, (g, i, nr) => { const T = L[i]; const tot = somV(T.map(x => x[1])), kort = somV(T.filter(x => x[1]<0).map(x => x[1]));
      const bon = `<div class="m5-bon"><div class="bn-kop">🧾 SPORTWINKEL</div>${T.map(([n, v]) => `<div class="bn-r"><span>${n}</span><b class="${v<0 ? 'neg' : ''}">€ ${zS(v)}</b></div>`).join('')}<div class="bn-r tot"><span>TOTAAL</span><b>€ ?</b></div></div><span class="m5-nl"></span>`;
      mQ(g, st, save, 'k' + i, { nr, html:`${bon}<span class="txt">Hoeveel korting kreeg je in totaal?</span> {{u:k}} <span class="txt">€</span><span class="m5-nl"></span><span class="txt">Hoeveel moet je betalen?</span> {{u:t}} <span class="txt">€</span>`,
        check:V=>allOf([['k', chkG(V.k, kort, [[-kort, 'Een korting is een negatief bedrag.']])], ['t', chkG(V.t, tot)]]),
        hint:['Tel eerst de negatieve bedragen samen: dat is de korting.', 'Tel daarna alle bedragen samen.'], sol:`${kaalS(T.map(x => x[1]))} ${isq} ${zS(tot)}` }); }, {een:true});
  } };
GD.handig = { title:'Handig vermenigvuldigen', lvl:2,
  instr:'Bepaal het teken. Zoek daarna factoren die samen 10 of 100 geven. Werk uit in het vak.',
  build(b, st, save){
    const R = makeR(st); const a = R.int(3, 19), c = R.int(3, 9), d = R.int(11, 29);
    const L = R.shuffle([`-4 · ${a} · (-25)`, `2 · (-${d}) · 5 · (-1)`, `-5 · ${c} · (-2) · (-3)`, `(-50) · (-${c}) · 2`, `-${a} · (-20) · 5`]).slice(0, 4);
    reeks(b, L.length, (g, i, nr) => vrijOpg(g, st, save, 'h' + i, nr, L[i], {k:'mh', hint:['Tel de mintekens: een even aantal geeft een positief product.', 'Zet factoren die samen 10 of 100 geven naast elkaar: 2 · 5, 4 · 25, 20 · 5.']}), {een:true});
  } };
/* verdieping */
GD.schrap = { title:'Tegengestelden schrappen', lvl:3,
  instr:'Zoek tegengestelde getallen: samen zijn ze 0. Bereken zo snel mogelijk.',
  build(b, st, save){
    const R = makeR(st); const a = R.int(21, 99), c = R.int(101, 499), d = R.int(11, 49), e = R.int(3, 19), n = 2*R.int(20, 50), m = R.int(5, 9);
    const L = [[`${zS(-a)} + ${c} + ${a} + ${zP(-c)} + ${zP(-e)}`, -e], [`${d} − ${c} + ${zP(-d)} + ${c} − ${e}`, -e],
      [`1 − 2 + 3 − 4 + 5 − 6 + … + ${n - 1} − ${n}`, -n/2], [`${MIN}1 − 2 − 3 − 4 − … − ${m*2}`, -(m*2)*(m*2 + 1)/2],
      [`(${MIN}1) · (${MIN}1) · (${MIN}1) · … · (${MIN}1) <span class="txt">met ${2*m + 1} factoren</span>`, -1]];
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i]; mQ(g, st, save, 's' + i, { nr, html:`${h} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), sol:`${h} ${isq} ${zS(T)}` }); }, {een:true});
  } };
GD.tram = { title:'De tram en het spel', lvl:3,
  instr:'Schrijf een gedurige som en reken uit.',
  build(b, st, save){
    const R = makeR(st); const s0 = R.int(12, 40); const H = [0, 1, 2, 3, 4].map(() => [R.int(0, 12), R.int(0, 12)]);
    let nu = s0; H.forEach(h => { if(h[1] > nu + h[0]) h[1] = nu + h[0]; nu += h[0] - h[1]; });
    const tram = `<table class="m5-btab m5-tram"><tr><th>halte</th>${H.map((_, k) => `<th>${k + 1}</th>`).join('')}</tr><tr><td>op</td>${H.map(h => `<td>+${h[0]}</td>`).join('')}</tr><tr><td>af</td>${H.map(h => `<td>${MIN}${h[1]}</td>`).join('')}</tr></table>`;
    const r = [R.int(5, 20), -R.int(5, 25), R.int(-10, 15), -R.int(1, 20), R.int(5, 25)]; const tot = somV(r); const mis = R.int(1, 4);
    const L = [[`<span class="txt">In de tram zitten ${s0} mensen. 🚋</span>${tram}<span class="txt">Hoeveel mensen zitten er na halte 5 in de tram?</span> {{u:a}}`, nu, `${s0} ${H.map(h => `+ ${h[0]} − ${h[1]}`).join(' ')} ${isq} ${nu}`],
      [`<span class="txt">Bij een spel scoor je per ronde punten: ${r.map((x, k) => k===mis ? '?' : zS(x)).join(' ; ')}. Je eindscore is ${zS(tot)}. Hoeveel punten scoorde je in ronde ${mis + 1}?</span> {{u:a}}`, r[mis], `${r.map((x, k) => k===mis ? '?' : zP(x)).join(' + ')} ${isq} ${zS(tot)}, dus ? ${isq} ${zS(r[mis])}`]];
    reeks(b, L.length, (g, i, nr) => { const [h, T, sol] = L[i]; mQ(g, st, save, 't' + i, { nr, html:h, check:V=>chkG(V.a, T), sol }); }, {een:true});
  } };
const CHEAT_GEDUR = `<h3>Spiekbriefje · gedurige som en product</h3><table>
  <tr><td>gedurige som</td><td>1. werk de tekenparen weg<span class="m5-nl"></span>2. tel de plustermen samen en de mintermen samen<span class="m5-nl"></span>3. reken de twee uitkomsten samen
    <div class="m4-line">${MIN}5 + 8 − (+3) − (${MIN}4) ${isq} ${MIN}5 + 8 − 3 + 4 ${isq} 12 − 8 ${isq} 4</div></td></tr>
  <tr><td>tegengestelden</td><td>tegengestelde termen schrap je: ${MIN}37 + 12 + 37 ${isq} 12</td></tr>
  <tr><td>gedurig product</td><td>even aantal mintekens: +, oneven aantal: ${MIN}<div class="m4-line">${MIN}2 · 3 · (${MIN}5) ${isq} 30</div></td></tr></table>`;
SEC.gedur = { id:'gedur', ic:'z_gedur', nav:'Gedurige som en product', title:'Gedurige som en gedurig product',
  tip:'Bij een lange som tel je eerst alle plustermen samen en alle mintermen samen. Bij een lang product tel je eerst de mintekens.',
  cheat:CHEAT_GEDUR, cards:[GD.stap, GD.paar, GD.prod, GD.vrij, GD.kassa, GD.handig, GD.schrap, GD.tram] };
(function(){ const s = document.createElement('style'); s.textContent = `
  .m5-term{border-radius:.35rem; padding:0 .25rem} .m5-term.pos{background:#fde1df; color:#9b1c13} .m5-term.neg{background:#dbe7ff; color:#1d4ed8}
  .m5-pl{color:#9b1c13; font-weight:700} .m5-mi{color:#1d4ed8; font-weight:700}
  .m5-bon{font-family:ui-monospace, Menlo, Consolas, monospace; font-size:.95rem; font-weight:500; background:#fffdf5; border:1.5px dashed #b9a97a; border-radius:.3rem; padding:.6rem .9rem; width:100%; max-width:20rem; margin:.3rem 0 .5rem; color:#1f2a2b}
  .bn-kop{text-align:center; font-weight:800; letter-spacing:.08em; margin-bottom:.3rem} .bn-r{display:flex; justify-content:space-between; gap:1rem; padding:.05rem 0} .bn-r b.neg{color:#b42318}
  .bn-r.tot{border-top:1.5px dashed #b9a97a; margin-top:.3rem; padding-top:.3rem}
  .m5-tram th, .m5-tram td{font-weight:600; min-width:2.2rem; padding:.15rem} .m5-tram{margin:.3rem 0}
  `; document.head.append(s); })();
/* ============================================================
   ONDERDEEL · VOLGORDE VAN BEWERKINGEN
   basis: bogen (klik wat eerst moet), oefenen: vrij vak, verdieping: [ ], grote getallen, Game 24
   ============================================================ */
const VG = {};
/* sjablonen; elk krijgt R en geeft een opgave als tekst */
const VT = {
  bog1:[
    R => `${zS(nz(R, -12, 15))} + ${R.int(2, 5)} · ${zP(nz(R, -6, 6))}`,
    R => `${zS(nz(R, -10, 18))} − ${R.int(2, 5)} · ${zP(nz(R, -5, 6))}`,
    R => { const q = R.int(2, 5), k = nz(R, -5, 5); return `${zS(q*k)} : ${zP(q*R.sign())} + ${zP(nz(R, -9, 9))}`; },
    R => `${zS(nz(R, -6, 6))} · ${zP(R.int(2, 5))} − ${R.int(2, 4)} · ${zP(nz(R, -5, 5))}`,
    R => { const q = R.int(2, 4), k = nz(R, -5, 5); return `${zS(q*k)} : ${zP(q)} · ${zP(nz(R, -4, 4))}`; },
    R => `${zS(nz(R, -9, 12))} − ${R.int(3, 9)} + ${zP(nz(R, -9, 9))}`,
    R => `${zS(nz(R, -9, 9))} + ${R.int(2, 4)} · ${R.int(2, 5)} − ${R.int(3, 15)}`],
  bog2:[
    R => `(${zS(nz(R, -9, 9))} − ${R.int(2, 9)}) · ${zP(nz(R, -4, 4))}`,
    R => `${zS(nz(R, -12, 12))} − (${zS(nz(R, -9, 9))} + ${R.int(2, 9)})`,
    R => `${zS(nz(R, -5, 5))} · (${zS(nz(R, -6, 6))} − ${R.int(2, 8)})`,
    R => `(${zS(nz(R, -12, 12))} + ${R.int(2, 9)}) : ${zP(R.pick([-3, -2, 2, 3]))}`,
    R => `${zS(nz(R, -9, 12))} − ${R.int(2, 4)} · (${zS(nz(R, -5, 5))} − ${R.int(2, 6)})`,
    R => `(${zS(nz(R, -6, 6))} − ${R.int(2, 6)}) · (${zS(nz(R, -5, 5))} + ${R.int(2, 5)})`],
  vrij1:[
    R => `${zS(nz(R, -50, 50))} + ${R.int(2, 9)} · ${zP(nz(R, -12, 12))}`,
    R => { const q = R.int(2, 9), k = nz(R, -10, 10); return `${zS(q*k)} : ${zP(q*R.sign())} · ${R.int(2, 6)}`; },
    R => `${R.int(2, 9)} · (${zS(nz(R, -15, 15))} − ${R.int(3, 20)})`,
    R => { const q = R.int(2, 9), k = R.int(2, 10); return `${zS(nz(R, -40, 40))} − ${q*k} : ${zP(-q)}`; },
    R => `${zS(nz(R, -60, 60))} − (${zS(nz(R, -30, 30))} + ${R.int(2, 30)})`,
    R => `${zS(nz(R, 10, 90))} : (${zS(nz(R, -12, 12))} − ${R.int(2, 9)})`,
    R => { const q = R.int(2, 9), k = nz(R, -10, 10); return `${zS(nz(R, -30, 30))} + ${zP(q*k)} : ${q}`; },
    R => `${zS(nz(R, -20, 40))} − ${R.int(2, 9)} · ${zP(nz(R, -9, 9))}`],
  vrij2:[
    R => `${zS(nz(R, -20, 20))} + ${R.int(2, 15)} − ${R.int(2, 9)} · ${R.int(2, 9)}`,
    R => { const q = R.int(2, 9), k = nz(R, -9, 9); return `${zS(q*k)} : ${q} · ${R.int(2, 6)} + ${zP(nz(R, -20, 20))}`; },
    R => `${zS(nz(R, -20, 30))} − ${R.int(2, 9)} · ${R.int(2, 6)} − ${R.int(2, 15)}`,
    R => `${R.int(2, 6)} · (${R.int(5, 30)} − ${R.int(2, 6)} · ${R.int(2, 9)})`,
    R => `(${zS(nz(R, -30, 50))} − ${R.int(1, 20)}) : (${zS(nz(R, -9, 9))} − ${R.int(1, 9)})`,
    R => `(${zS(nz(R, -30, 30))} − ${R.int(2, 6)} · ${R.int(2, 9)}) : ${R.int(2, 6)}`,
    R => `${zS(nz(R, -20, 20))} − ${R.int(2, 6)} · ${R.int(2, 9)} + ${R.int(2, 6)} · ${zP(nz(R, -9, 9))}`,
    R => { const q = R.int(2, 6), k = nz(R, -9, 9), r = R.int(2, 6), m = nz(R, -6, 6); return `${zS(q*k)} : ${zP(-q)} − ${zP(r*m)} : ${zP(-r)}`; }],
  vierk:[
    R => `${zS(nz(R, -30, 30))} − [${zS(nz(R, -9, 9))} · ${R.int(2, 6)} − (${zS(nz(R, -12, 12))} − ${R.int(2, 9)})]`,
    R => { const q = R.int(2, 6), k = nz(R, -9, 9); return `[${zS(q*k)} : ${zP(-q)} − ${R.int(2, 12)}] : ${zP(R.pick([-3, -2, 2, 3, 5]))}`; },
    R => `${zS(nz(R, -60, 60))} : [${zS(R.pick([-12, -8, 8, 12, 16, -16]))} : ${R.pick([2, 4])} + ${R.int(2, 5)} · ${zP(nz(R, -4, 4))}]`,
    R => `[${R.int(5, 30)} − (${R.int(2, 6)} · ${R.int(2, 6)} − ${R.int(1, 15)})] · ${zP(nz(R, -6, 6))}`,
    R => `${R.int(5, 30)} − [(${zS(nz(R, -15, 15))} + ${R.int(2, 12)}) − (${R.int(2, 9)} + ${R.int(2, 9)})] − ${zP(nz(R, -6, 6))} · ${R.int(2, 6)} : ${zP(R.pick([-3, -2, 2, 3]))}`],
  groot:[
    R => `${R.int(11, 40)} · ${zP(-R.int(2, 9))} − ${R.int(20, 90)} − ${R.int(2, 9)*R.int(3, 9)} : ${zP(-R.int(2, 9))}`,
    R => `${zS(-R.int(2, 9))} · (${R.int(80, 97)} + ${R.int(3, 20)}) + ${R.pick([100, 200, 120, 150])} : ${R.pick([2, 4, 5])} · ${R.int(2, 6)}`,
    R => `(${R.int(150, 400)} − ${R.int(10, 60)}) : [${R.int(5, 15)} · ${R.int(2, 6)} − ${zP(-R.int(5, 40))}]`,
    R => `${R.int(100, 300)} − [${R.int(3, 9)} · (${zS(-R.int(11, 30))} − ${R.int(2, 15)}) − ${R.int(5, 40)}]`]
};
const opgN = (R, lijst, n, o) => { const L = R.shuffle(lijst).slice(0, n); while(L.length < n) L.push(R.pick(lijst)); return L.map(f => maakOpg(R, f, o)); };

/* vrij vak met de uitwerking van een opgave */
function vrijOpg(g, st, save, id, nr, E, o={}){
  const L = ZX.stappen(E), T = ZX.waarde(E);
  mQ(g, st, save, id, { nr, html:`<span class="m5-opg">${zT(E)}</span> {{z:a,${o.k || 'mdh'}}}`, check:V=>chkZ(V.a, T, {opg:E}),
    hint: o.hint===false ? undefined : o.hint ? o.hint : ['Welke bewerking moet eerst? Denk aan de trap: eerst haakjes, dan · en : van links naar rechts, dan + en − van links naar rechts.', ['Zo begin je:', '= ' + zT(L[1])]],
    sol:uitwH(L) });
}

/* ---------- 1 en 2 bogen ---------- */
function bogKaart(b, st, save, lijst){
  const R = makeR(st); const P = opgN(R, lijst, 3, {lim:60, min:3}); if(st.i==null) st.i = 0;
  const host = el('div'); b.append(host);
  const toon = () => { host.innerHTML = '';
    if(st.i < P.length){ host.append(el('div', 'm5-teller', `Opgave ${st.i + 1} van ${P.length}`));
      bogen(host, st, save, 'g' + st.i, {opg:P[st.i], onOk:()=>{ st.i++; save(); toon(); }}); }
    else { allesJuist(host, 'Je werkte telkens eerst de haakjes uit, dan maal en gedeeld door, en pas dan plus en min. Zo werk je ook op papier.');
      host.append(el('div', 'm5-gedaan', P.map(E => `<span class="m5-ok">✓ ${zT(E)} = ${zS(ZX.waarde(E).k)}</span>`).join(''))); } };
  toon();
}
VG.bog1 = { title:'Wat eerst?', lvl:1,
  instr:'Klik op het bewerkingsteken van de bewerking die eerst moet. Typ de uitkomst onder de boog en ga naar de volgende regel. De kleur toont welke stap van het stappenplan je zet.',
  build(b, st, save){ bogKaart(b, st, save, VT.bog1); } };
VG.bog2 = { title:'Wat eerst? Met haakjes', lvl:1,
  instr:'Nu staan er ook haakjes. Klik op het bewerkingsteken van de bewerking die eerst moet en typ de uitkomst onder de boog.',
  build(b, st, save){ bogKaart(b, st, save, VT.bog2); } };

/* ---------- 3 welke stap klopt? ---------- */
VG.stap = { title:'Welke stap klopt?', lvl:1,
  instr:'Welke regel volgt juist op de opgave? Let op de volgorde van de bewerkingen.',
  build(b, st, save){
    const R = makeR(st);
    const S = [
      () => { const a = R.int(2, 15), x = R.int(2, 5), y = nz(R, -6, 6); return [`${a} + ${x} · ${zP(y)}`, `${a} + ${zP(x*y)}`, [`${a + x} · ${zP(y)}`, `${a} + ${x*Math.abs(y)}`], 'Maal gaat voor plus.']; },
      () => { const q = R.int(2, 5), k = R.int(2, 6), a = R.int(-9, 9); return [`${zS(a)} − ${q*k} : ${q}`, `${zS(a)} − ${k}`, [`${zS(a - q*k)} : ${q}`, `${zS(a)} − ${q*k - q}`], 'Gedeeld door gaat voor min.']; },
      () => { const q = R.int(2, 4), k = nz(R, -5, 5), r = R.int(2, 4); return [`${zS(q*k*r)} : ${q} · ${r}`, `${zS(k*r)} · ${r}`, [`${zS(q*k*r)} : ${q*r}`], 'Maal en gedeeld door reken je van links naar rechts.']; },
      () => { const a = R.pick([-5, -4, -3, -2, 2, 3, 4, 5]), x = R.int(-6, 6), y = R.int(2, 6); return [`${zS(a)} · (${zS(x)} − ${y})`, `${zS(a)} · ${zP(x - y)}`, [`${zS(a*x)} − ${y}`], 'Eerst wat tussen haakjes staat.']; },
      () => { const a = R.int(-9, 12), x = R.int(3, 9), y = R.int(2, 9); return [`${zS(a)} − ${x} + ${y}`, `${zS(a - x)} + ${y}`, [`${zS(a)} − ${x + y}`], 'Plus en min reken je van links naar rechts.']; }];
    const L = R.shuffle(S).slice(0, 4).map(f => f());
    reeks(b, L.length, (g, i, nr) => { const [E, goed, fout, why] = L[i]; const opts = R.shuffle([['g', '= ' + zT(goed)], ...fout.filter(f => f!==goed).map((f, j) => ['f' + j, '= ' + zT(f)])]);
      qChoice(g, st, save, 'k' + i, { nr, html:`<span class="m5-opg m5-groot">${zT(E)}</span>`, opts, ans:'g', why, whyBad:why + ' Zoek de bewerking die eerst moet.' }); });
  } };

/* ---------- 4 werk uit (oefenen) ---------- */
VG.vrij1 = { title:'Werk uit', lvl:2,
  instr:'Werk uit. Schrijf elke tussenstap op een nieuwe regel: klik op <b>=</b> of druk op <kbd>Enter</kbd>.',
  build(b, st, save){
    const R = makeR(st); const vb = maakOpg(R, VT.vrij1[0], {min:3});
    stapUitleg(b, hoeLijnen(ZX.stappen(vb)), {kop:`Voorbeeld: ${zT(vb)}`});
    const P = opgN(R, VT.vrij1, 4, {min:3});
    reeks(b, P.length, (g, i, nr) => vrijOpg(g, st, save, 'v' + i, nr, P[i]));
  } };
VG.vrij2 = { title:'Werk uit met meer stappen', lvl:2,
  instr:'Werk uit. Reken bij elke stap alles uit wat mag, en schrijf de volgende regel.',
  build(b, st, save){
    const R = makeR(st); const P = opgN(R, VT.vrij2, 4, {min:3});
    reeks(b, P.length, (g, i, nr) => vrijOpg(g, st, save, 'w' + i, nr, P[i]));
  } };

/* ---------- 6 waar staan de haakjes? ---------- */
VG.haak = { title:'Waar staan de haakjes?', lvl:2,
  instr:'Bij elke opgave vielen de haakjes weg. Kies waar ze stonden, zodat de uitkomst klopt.',
  build(b, st, save){
    const R = makeR(st); const L = [];
    for(let k=0; k<300 && L.length<3; k++){
      const a = R.int(2, 12), x = R.pick(['+', '−']), c = R.int(2, 6), y = R.pick(['·', ':']), d = nz(R, -6, 6), z = R.pick(['+', '−']), e = R.int(1, 9);
      const kale = `${a} ${x} ${c} ${y} ${zP(d)} ${z} ${e}`;
      const V = [`(${a} ${x} ${c}) ${y} ${zP(d)} ${z} ${e}`, `${a} ${x} ${c} ${y} (${zS(d)} ${z} ${e})`, `${a} ${x} (${c} ${y} ${zP(d)} ${z} ${e})`, `(${a} ${x} ${c}) ${y} (${zS(d)} ${z} ${e})`];
      const W = V.map(s => { const w = ZX.waarde(s); return w ? w.k : null; }); const juist = R.int(0, 3);
      if(W.some(w => w==null) || W.filter(w => w===W[juist]).length!==1 || ZX.waarde(kale)==null || ZX.waarde(kale).k===W[juist] || Math.abs(W[juist])>200) continue;
      if(L.some(l => l[0]===kale)) continue;
      L.push([kale, V, juist, W[juist]]); }
    reeks(b, L.length, (g, i, nr) => { const [kale, V, juist, w] = L[i];
      qChoice(g, st, save, 'h' + i, { nr, html:`<span class="m5-opg m5-groot">${zT(kale)} = ${zS(w)}</span>`, opts:V.map((s, j) => ['' + j, zT(s)]), ans:'' + juist,
        why:`Reken na: ${zT(V[juist])} = ${zS(w)}.`, whyBad:'Reken de keuze die je maakte uit met de volgorde van bewerkingen en vergelijk.' }); }, {een:true});
  } };

/* ---------- 7 rekenverhalen ---------- */
VG.verhaal = { title:'Rekenverhalen', lvl:2,
  instr:'Schrijf op de eerste regel de bewerking die bij het verhaal past (met haakjes waar nodig). Reken dan uit op de volgende regels.',
  build(b, st, save){
    const R = makeR(st);
    const C = R.shuffle([
      () => { const t = R.int(-3, 6), n = R.int(3, 6), d = R.int(2, 4); return [`Om middernacht is het ${zS(t)} °C. Daarna daalt de temperatuur ${n} uur lang telkens ${d} graden per uur. Hoeveel graden is het dan?`, `${zS(t)} − ${n} · ${d}`, '°C']; },
      () => { const h = R.int(8, 20), n = R.int(2, 4), s = R.int(2, 5), d = R.int(3, 9); return [`Een duiker zwemt op ${h} m onder water (${zS(-h)} m). Hij stijgt ${n} keer ${s} m en daalt daarna nog ${d} m. Op welke hoogte zwemt hij dan?`, `${zS(-h)} + ${n} · ${s} − ${d}`, 'm']; },
      () => { const s = R.int(20, 60), n = R.int(3, 6), p = R.int(12, 25); return [`Op de rekening van Jens staat ${s} euro. Hij koopt ${n} concerttickets van ${p} euro. Hoeveel staat er daarna op zijn rekening?`, `${s} − ${n} · ${p}`, 'euro']; },
      () => { const j = R.int(4, 9), f = R.int(5, 12); return [`Bij een quiz krijg je 3 punten per juist antwoord en verlies je 2 punten per fout antwoord. Lien heeft ${j} juiste en ${f} foute antwoorden. Hoeveel punten heeft ze?`, `${j} · 3 − ${f} · 2`, 'punten']; }]).slice(0, 2).map(f => f());
    reeks(b, C.length, (g, i, nr) => { const [tx, E, u] = C[i]; const T = ZX.waarde(E);
      mQ(g, st, save, 'r' + i, { nr, html:`<span class="txt">${tx}</span> {{z:a,mdh}}`,
        check:V=>{ const r = (V.a.r||[]).filter(L => (L.s||'').trim()); const t = r.length ? ZX.parse(r[0].s) : null;
          if(t && !t.err && ZX.isAt(t) && r.length===1){ const w = ZX.waarde(r[0].s); if(w && ZX.eq(w, T)) return {info:true, msg:'De uitkomst klopt. Schrijf ook de bewerking: zet ze op de eerste regel en reken daaronder uit.'}; }
          return chkZ(V.a, T, {opg:null}); },
        hint:['Welke getallen komen erin voor? Wat gebeurt er meerdere keren? Dat wordt een vermenigvuldiging.', ['Een bewerking die past:', zT(E)]],
        sol:uitwH(ZX.stappen(E)) + `<p>Antwoord: ${zS(T.k)} ${u}.</p>` }); }, {een:true});
  } };

/* ---------- 8 zoek de fout ---------- */
VG.fout = { title:'Zoek de fout', lvl:2,
  instr:'In elk schrift zit één fout. Klik op de eerste regel die fout is, kies wat er misging en verbeter die regel.',
  build(b, st, save){
    const R = makeR(st);
    const F = R.shuffle([
      () => { const a = R.int(5, 20), x = R.int(2, 6), y = R.int(2, 6); return [`${a} − ${x} · ${y}`, `${a - x} · ${y}`, 0, 'vol', 'Maal gaat voor min: eerst ' + x + ' · ' + y + '.']; },
      () => { const q = R.int(2, 5), m = R.int(2, 6), k = R.int(2, 5); return [`${zS(-q*m)} + ${q*k} : ${q}`, `${zS(-q*m + q*k)} : ${q}`, 0, 'vol', `Gedeeld door gaat voor plus: eerst ${q*k} : ${q}.`]; },
      () => { const a = R.int(2, 6), x = R.int(2, 9), y = R.int(2, 9); return [`${a} · (${x} − ${y})`, `${a*x} − ${y}`, 0, 'vol', 'Eerst wat tussen haakjes staat.']; },
      () => { const a = R.int(-9, 9), x = R.int(3, 9), y = R.int(2, 8); return [`${zS(a)} − ${x} + ${y}`, `${zS(a)} − ${x + y}`, 0, 'vol', `Plus en min reken je van links naar rechts: eerst ${zS(a)} − ${x}.`]; },
      () => { const a = R.int(3, 15), x = R.int(2, 5), y = R.int(2, 6); return [`${a} − ${x} · ${zP(-y)}`, `${a} − ${x*y}`, 0, 'tek', `${x} · ${zP(-y)} = ${zS(-x*y)}: een positief getal maal een negatief getal is negatief.`]; },
      () => { const a = R.int(3, 15), x = R.int(2, 5), y = R.int(2, 6); return [`${a} − ${x} · ${zP(-y)}`, `${a - x*y}`, 1, 'teg', `${a} − ${zP(-x*y)}: een negatief getal aftrekken is het tegengestelde optellen, dus ${a} + ${x*y}.`]; },
      () => { const a = R.int(-12, 12), x = R.int(3, 9), y = R.int(3, 9); return [`${zS(a)} + ${x} · ${zP(-y)}`, `${zS(a)} + ${zP(-(x*y + x))}`, 0, 'rek', `${x} · ${zP(-y)} = ${zS(-x*y)}, niet ${zS(-(x*y + x))}: dat is een rekenfout in de tafel van ${x}.`]; }]).slice(0, 3).map(f => f());
    const WIE = R.shuffle(['Lotte', 'Mats', 'Noor', 'Yassin', 'Elise']);
    if(st.i==null) st.i = 0; const host = el('div'); b.append(host);
    const toon = () => { host.innerHTML = '';
      if(st.i < F.length){ host.append(el('div', 'm5-teller', `Opgave ${st.i + 1} van ${F.length}`)); const [E, fout, k, oz, why] = F[st.i];
        const L = ZX.stappen(E, false); const juist = L[k + 1];
        const W = L.slice(1, k + 1).concat([fout]); const rest = ZX.stappen(fout); if(rest) W.push(...rest.slice(1));
        schriftFout(host, st, save, 'f' + st.i, { wie:WIE[st.i], task:zT(E), lines:W.map(l => '= ' + zT(l)), wrong:k, cons:W.map((_, j) => j).filter(j => j>k), oorzaak:oz, why,
          fixMQ:{html:`<span class="m5-opg">${zT(L[k])}</span> {{z:a,mdh}}`, check:V=>chkZ(V.a, ZX.waarde(juist), {opg:L[k]}), sol:'= ' + zT(juist)}, onOk:()=>{ st.i++; save(); setTimeout(toon, 900); } }); }
      else allesJuist(host, 'Je vond elke fout en verbeterde ze. Kijk bij je eigen werk altijd naar de volgorde, de tekens en de tegengestelde.'); };
    toon();
  } };

/* ---------- verdieping ---------- */
VG.vierk = { title:'Met vierkante haakjes', lvl:3,
  instr:'Staan er haakjes binnen haakjes, dan reken je eerst de binnenste haakjes uit. Gebruik de vierkante haakjes als je ze nodig hebt.',
  build(b, st, save){ const R = makeR(st); const P = opgN(R, VT.vierk, 3, {min:4, lim:200});
    reeks(b, P.length, (g, i, nr) => vrijOpg(g, st, save, 'q' + i, nr, P[i], {k:'mdhv', hint:false})); } };
VG.groot = { title:'Grotere getallen', lvl:3,
  instr:'Werk uit. Schrijf elke tussenstap op een nieuwe regel.',
  build(b, st, save){ const R = makeR(st); const P = opgN(R, VT.groot, 3, {min:4, lim:3000});
    reeks(b, P.length, (g, i, nr) => vrijOpg(g, st, save, 'g' + i, nr, P[i], {k:'mdhv', hint:false})); } };

/* Game 24: zoek met de vier getallen (elk precies één keer) een bewerking die 24 geeft */
function los24(nums){
  const S = x => x<0 ? `(${zS(x)})` : String(x);
  const rec = it => { if(it.length===1) return it[0].v===24 ? it[0].s : null;
    for(let i=0; i<it.length; i++) for(let j=0; j<it.length; j++){ if(i===j) continue; const A = it[i], B = it[j], rest = it.filter((_, k) => k!==i && k!==j);
      const opts = [];
      if(i<j){ opts.push([A.v + B.v, `${A.s} + ${B.s}`]); opts.push([A.v*B.v, `${A.p} · ${B.p}`]); }
      opts.push([A.v - B.v, `${A.s} − ${B.p2}`]); if(B.v && A.v % B.v===0) opts.push([A.v/B.v, `${A.p} : ${B.p2}`]);
      for(const [v, s] of opts){ const r = rec(rest.concat([{v, s, p:`(${s})`, p2:`(${s})`}])); if(r) return r; } }
    return null; };
  return rec(nums.map(x => ({v:x, s:S(x), p:S(x), p2:S(x)})));
}
VG.g24 = { title:'Game 24', lvl:3,
  instr:'Maak met de vier getallen een bewerking die <b>24</b> uitkomt. Gebruik elk getal precies één keer, met zijn eigen teken. Je mag +, −, ·, : en haakjes gebruiken.',
  build(b, st, save){
    const R = makeR(st); const sets = [];
    for(let k=0; k<400 && sets.length<2; k++){ const n = sets.length ? [nz(R, -9, 12), nz(R, -9, 9), nz(R, -8, 12), R.int(1, 12)] : [R.int(1, 13), R.int(1, 13), R.int(1, 9), R.int(2, 12)];
      if(sets.length && !n.some(x => x<0)) continue; const s = los24(n); if(s) sets.push([n, s]); }
    reeks(b, sets.length, (g, i, nr) => { const [n, s] = sets[i]; const w = n.slice().sort((x, y) => x - y);
      mQ(g, st, save, 'p' + i, { nr, html:`<span class="m5-24">${n.map(x => `<span class="m5-kaart">${zS(x)}</span>`).join('')}</span> {{z:a,mdh}}`,
        check:V=>{ const r = (V.a.r||[]).filter(L => (L.s||'').trim()); if(!r.length) return {info:true, msg:'Typ je bewerking.'};
          const t = ZX.parse(r[0].s); if(t.err) return {info:true, msg:t.err};
          const gt = ZX.getallen(t).sort((x, y) => x - y);
          if(gt.length!==4 || gt.some((x, j) => x!==w[j])) return {ok:false, msg:`Gebruik elk getal precies één keer, met zijn eigen teken: ${n.map(zS).join(', ')}.`};
          const c = chkZ(V.a, 24, {}); if(c.ok || (c.info && /Bijna/.test(c.msg||''))) return {ok:true}; const v = ZX.waarde(r[0].s);
          return v && !ZX.eq(v, 24) && r.length===1 ? {ok:false, msg:`Jouw bewerking geeft ${zS(v.k)}, niet 24.`} : c; },
        sol:`Een mogelijke oplossing: ${zT(s)} = 24` }); });
  } };

const CHEAT_VOLG = `<h3>Spiekbriefje · volgorde van bewerkingen</h3><table>
  <tr><td>1</td><td><b>haakjes</b> ( ) en [ ]: eerst rekenen binnen de haakjes, de binnenste eerst</td></tr>
  <tr><td>2</td><td><b>· en :</b> van links naar rechts</td></tr>
  <tr><td>3</td><td><b>+ en −</b> van links naar rechts</td></tr>
  <tr><td>voorbeeld</td><td><div class="m5-uitw"><div>9 − 15 : (${MIN}3) · 2</div><div>= 9 − (${MIN}5) · 2</div><div>= 9 − (${MIN}10)</div><div>= 19</div></div></td></tr>
  <tr><td>schrijven</td><td>elke tussenstap op een nieuwe regel die begint met =; een negatief getal na een bewerkingsteken staat tussen haakjes</td></tr></table>`;
SEC.volg = { id:'volg', ic:'z_volg', nav:'Volgorde van bewerkingen', title:'Volgorde van bewerkingen',
  tip:'Zet in gedachten een boog onder de bewerking die eerst moet: eerst haakjes, dan maal en gedeeld door, pas dan plus en min. Telkens van links naar rechts.',
  cheat:CHEAT_VOLG, cards:[VG.bog1, VG.bog2, VG.stap, VG.vrij1, VG.vrij2, VG.haak, VG.verhaal, VG.fout, VG.vierk, VG.groot, VG.g24] };
(function(){ const s = document.createElement('style'); s.textContent = `
  .m5-groot{font-size:1.3rem; font-weight:700}
  .m5-24{display:inline-flex; gap:.4rem} .m5-kaart{display:inline-flex; align-items:center; justify-content:center; min-width:2.6rem; height:3.2rem; padding:0 .4rem; border:2px solid var(--orange); border-radius:.5rem; background:var(--or-soft); font-size:1.3rem; font-weight:900}
  `; document.head.append(s); })();
/* ============================================================
   ONDERDEEL 12 · ALLES DOOR ELKAAR EN VRAAGSTUKKEN
   + ZOEK DE FOUT (schriften van leerlingen)
   ============================================================ */
Object.assign(ICONS, {
  z_mix:'<path d="M4 7h4l8 10h4M4 17h4l2.5-3M13.5 10L16 7h4M18 5l2 2-2 2M18 15l2 2-2 2"/>'
});
const MX = {};
const OPS4 = [['+', '+'], ['−', '−'], ['·', '·'], [':', ':']];
/* een willekeurige bewerking met twee gehele getallen (deling gaat altijd op) */
function bew2(R, max=60){ const op = R.pick(['+', '−', '·', ':']);
  if(op==='·'){ const a = nz(R, -12, 12), c = nz(R, -9, 9); return [`${zS(a)} · ${zP(c)}`, a*c]; }
  if(op===':'){ const q = nz(R, -12, 12), c = nz(R, -9, 9); return [`${zS(q*c)} : ${zP(c)}`, q]; }
  const a = nz(R, -max, max), c = nz(R, -max, max); return op==='+' ? [`${zS(a)} + ${zP(c)}`, a + c] : [`${zS(a)} − ${zP(c)}`, a - c]; }
MX.mix = { title:'Alles door elkaar', lvl:2,
  instr:'Optellen, aftrekken, vermenigvuldigen en delen door elkaar. Kijk eerst goed welke bewerking er staat.',
  build(b, st, save){
    const R = makeR(st); const L = [0, 1, 2, 3, 4, 5, 6, 7].map(() => bew2(R));
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i]; mQ(g, st, save, 'm' + i, { nr, html:`${h} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), sol:`${h} ${isq} ${zS(T)}` }); });
  } };
MX.welke = { title:'Welke bewerking?', lvl:2,
  instr:'Welk bewerkingsteken hoort op de plaats van het vakje?',
  build(b, st, save){
    const R = makeR(st);
    const L = [0, 1, 2, 3, 4, 5].map(() => { for(let k=0; k<100; k++){ const op = R.pick(['+', '−', '·', ':']); let a, c;
        if(op===':'){ c = nz(R, -6, 6); a = c*nz(R, -8, 8); } else { a = nz(R, -12, 12); c = nz(R, -9, 9); }
        const v = {'+':a + c, '−':a - c, '·':a*c, ':':a/c}; const T = v[op]; if(Object.keys(v).filter(o => v[o]===T).length===1) return [a, c, op, T]; }
      return [-6, 3, ':', -2]; });
    reeks(b, L.length, (g, i, nr) => { const [a, c, op, T] = L[i];
      qChoice(g, st, save, 'w' + i, { nr, html:`<span class="m5-groot">${zS(a)} <span class="m5-hok">?</span> ${zP(c)} ${isq} ${zS(T)}</span>`, opts:OPS4, sym:true, ans:op, why:`${zS(a)} ${op} ${zP(c)} ${isq} ${zS(T)}`, whyBad:'Probeer elke bewerking uit en let op het teken.' }); }, {een:true});
  } };
MX.vgl = { title:'Groter of kleiner?', lvl:2,
  instr:'Vergelijk de twee kanten. Soms hoef je niet eens uit te rekenen.',
  build(b, st, save){
    const R = makeR(st); const VGL3 = [['<', '&lt;'], ['=', '='], ['>', '&gt;']];
    const a = R.int(11, 99), c = R.int(2, 9), d = R.int(2, 9);
    const L = R.shuffle([[`${zS(-a)} · ${c}`, '0', -a*c, 0], [`${zS(-c)} · ${zP(-d)}`, `${zS(-c)} − ${d}`, c*d, -c - d], [`${zS(-a)} : ${zP(-1)}`, `${a}`, a, a],
      [`${zS(-c)} − ${zP(-d)}`, `${zS(-c)} + ${d}`, -c + d, -c + d], [`${zS(-2)} · ${zP(-2)} · ${zP(-2)}`, `${zS(-2)} − 2 − 2`, -8, -6], [`|${zS(-a)}|`, `${zS(-a)}`, a, -a]]);
    reeks(b, L.length, (g, i, nr) => { const [l, r, x, y] = L[i]; const ans = x<y ? '<' : x>y ? '>' : '=';
      qChoice(g, st, save, 'v' + i, { nr, html:`<span class="m5-groot">${l} <span class="m5-hok">?</span> ${r}</span>`, opts:VGL3, sym:true, ans, why:`Links ${zS(x)}, rechts ${zS(y)}.` }); }, {een:true});
  } };
MX.slier = { title:'Rekenslierten', lvl:2,
  instr:'Volg de pijlen. Vul elk vak in.',
  build(b, st, save){
    const R = makeR(st);
    const L = [0, 1, 2].map(() => { let x = nz(R, -12, 12); const s0 = x; const S = []; for(let k=0; k<4; k++){ let op = R.pick(['+', '−', '·', ':']), c;
        if(op===':'){ const del = [-5, -4, -3, -2, 2, 3, 4, 5].filter(d => x % d===0 && x!==0); if(!del.length) op = '·'; else c = R.pick(del); }
        if(op==='·'){ c = Math.abs(x) > 20 ? R.pick([-1, 2, -2]) : nz(R, -4, 4); }
        if(op==='+' || op==='−') c = nz(R, -15, 15);
        const y = op==='+' ? x + c : op==='−' ? x - c : op==='·' ? x*c : x/c; S.push([op, c, y]); x = y; } return [s0, S]; });
    reeks(b, L.length, (g, i, nr) => { const [s0, S] = L[i];
      mQ(g, st, save, 's' + i, { nr, html:`<span class="m5-slier">${zS(s0)}</span> ${S.map(([op, c], k) => `<span class="m5-pijl">${op} ${zP(c)} →</span> {{u:v${k}}}`).join(' ')}`,
        check:V=>allOf(S.map(([, , y], k) => ['v' + k, chkG(V['v' + k], y)])), sol:S.map(([, , y]) => zS(y)).join(' → ') }); }, {een:true});
  } };
/* vraagstukken: de leerling schrijft zelf de bewerking in het vrije vak */
const VS = [
  R => { const t = -R.int(2, 9), d = R.int(3, 12); return [`Om 6 uur is het ${zS(t)} °C. Tegen de middag is het ${d} graden warmer. Hoeveel graden is het dan?`, `${zS(t)} + ${d}`, '°C']; },
  R => { const t = R.int(1, 8), d = R.int(10, 20); return [`Het is ${t} °C. 's Nachts daalt de temperatuur ${d} graden. Hoeveel graden is het 's nachts?`, `${t} − ${d}`, '°C']; },
  R => { const s = R.int(20, 90), k = R.int(3, 6)*10, n = R.int(2, 4); return [`Je hebt € ${s} op je rekening. Je koopt ${n} games van € ${k} per stuk. Hoeveel staat er nog op je rekening?`, `${s} − ${n} · ${k}`, 'euro']; },
  R => { const d = R.int(3, 8)*5, n = R.int(2, 5); return [`Een duiker zwemt op ${zS(-d)} m. Hij duikt nog ${n} keer 4 m dieper. Op welke hoogte zwemt hij dan?`, `${zS(-d)} − ${n} · 4`, 'm']; },
  R => { const v = -R.int(1, 3), u = R.int(4, 9); return [`Een lift vertrekt op verdieping ${zS(v)} en stijgt ${u} verdiepingen. Daarna daalt hij 3 verdiepingen. Op welke verdieping stopt hij?`, `${zS(v)} + ${u} − 3`, '']; },
  R => { const n = R.int(4, 9), p = R.int(2, 4)*5, j = R.int(3, 6); return [`Bij een quiz krijg je 10 punten per juist antwoord en verlies je ${p} punten per fout antwoord. Mo heeft ${j} juiste en ${n} foute antwoorden. Hoeveel punten heeft hij?`, `${j} · 10 − ${n} · ${p}`, 'punten']; },
  R => { const T = [0, 1, 2, 3].map(() => R.int(-9, 3)); const s = T.reduce((p, x) => p + x, 0); if(s % 4) T[3] -= s % 4; const s2 = T.reduce((p, x) => p + x, 0); return [`De temperatuur om middernacht was vier dagen na elkaar ${T.map(zS).join(' °C, ')} °C. Wat is de gemiddelde temperatuur?`, `(${T.map((x, k) => k ? zP(x) : zS(x)).join(' + ')}) : 4`, '°C', s2/4]; },
  R => { const g = R.int(5, 9)*100, l = R.int(20, 60); return [`Julius Caesar werd geboren in het jaar ${zS(-100)} (100 v.C.). Een tempel werd ${g} jaar vroeger gebouwd. In welk jaar? Schrijf het als een negatief getal.`, `${zS(-100)} − ${g}`, '']; }];
function vsKaart(title, sel){ return { title, lvl:2,
  instr:'Schrijf de bewerking in het vak en reken uit. Elke stap op een nieuwe regel.',
  build(b, st, save){ const R = makeR(st); const L = R.shuffle(sel.map(i => VS[i])).map(f => f(R));
    reeks(b, L.length, (g, i, nr) => { const [tx, E, eh] = L[i]; const T = ZX.waarde(E).k;
      mQ(g, st, save, 'v' + i, { nr, html:`<span class="txt">${tx}</span> {{z:a,mdh}}`, check:V=>chkZ(V.a, T), hint:['Schrijf eerst een bewerking met de getallen uit de tekst.', ['Zo kan je beginnen:', zT(E)]], sol:`${zT(E)} ${isq} ${zS(T)}${eh ? ' ' + eh : ''}` }); }, {een:true}); } }; }
MX.vs1 = vsKaart('Vraagstukken (1)', [0, 2, 4]);
MX.vs2 = vsKaart('Vraagstukken (2)', [1, 3, 5, 6]);
/* verdieping */
MX.magisch = { title:'Magisch vierkant', lvl:3,
  instr:'In een magisch vierkant is de som van elke rij, elke kolom en elke diagonaal gelijk. Vul de lege vakken in.',
  build(b, st, save){
    const R = makeR(st);
    const L = [0, 1].map(() => { let M = [[-3, 2, 1], [4, 0, -4], [-1, -2, 3]]; const k = R.pick([1, 2, 3, -2]), c = R.int(-12, 4);
      for(let r=R.int(0, 3); r>0; r--) M = M[0].map((_, j) => M.map(row => row[j]).reverse()); if(R.f() < .5) M = M.map(row => row.slice().reverse());
      return M.map(row => row.map(x => k*x + c)); });
    const open = [[0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]];
    reeks(b, L.length, (g, i, nr) => { const M = L[i]; const S = M[0][0] + M[0][1] + M[0][2];
      const cel = (r, c) => open.some(([x, y]) => x===r && y===c) ? `{{u:c${r}${c}}}` : `<b>${zS(M[r][c])}</b>`;
      mQ(g, st, save, 'm' + i, { nr, html:`<span class="txt">De som is telkens ${zS(S)}.</span><span class="m5-nl"></span><table class="m5-magisch">${[0, 1, 2].map(r => `<tr>${[0, 1, 2].map(c => `<td>${cel(r, c)}</td>`).join('')}</tr>`).join('')}</table>`,
        check:V=>allOf(open.map(([r, c]) => ['c' + r + c, chkG(V['c' + r + c], M[r][c])])),
        sol:M.map(row => row.map(zS).join(' ; ')).join(' / ') }); }, {een:true});
  } };
MX.raad = { title:'Raad het getal', lvl:3,
  instr:'Werk terug: doe telkens de omgekeerde bewerking.',
  build(b, st, save){
    const R = makeR(st);
    const L = [0, 1, 2, 3].map(k => { const x = nz(R, -15, 15), m = R.pick([-2, -3, -4, -5, 2, 3]), p = nz(R, -20, 20);
      if(k % 2) return [`Ik denk aan een getal. Ik tel er ${zS(p)} bij en vermenigvuldig de som met ${zS(m)}. Ik krijg ${zS((x + p)*m)}.`, x, `(${zS((x + p)*m)}) : ${zP(m)} − ${zP(p)} ${isq} ${zS(x)}`];
      return [`Ik denk aan een getal. Ik vermenigvuldig het met ${zS(m)} en tel er ${zS(p)} bij. Ik krijg ${zS(x*m + p)}.`, x, `(${zS(x*m + p)} − ${zP(p)}) : ${zP(m)} ${isq} ${zS(x)}`]; });
    reeks(b, L.length, (g, i, nr) => { const [tx, T, sol] = L[i]; mQ(g, st, save, 'r' + i, { nr, html:`<span class="txt">${tx} Aan welk getal dacht ik?</span> {{u:a}}`, check:V=>chkG(V.a, T), sol }); }, {een:true});
  } };
const CHEAT_MIX = `<h3>Spiekbriefje · alles door elkaar</h3><table>
  <tr><td>+</td><td>zelfde teken: tel op en behoud het teken; verschillend teken: trek af, teken van de grootste absolute waarde</td></tr>
  <tr><td>−</td><td>tel het tegengestelde op: 4 − (${MIN}6) ${isq} 4 + 6</td></tr>
  <tr><td>· en :</td><td>zelfde teken: +; verschillend teken: ${MIN}</td></tr>
  <tr><td>vraagstuk</td><td>1. schrijf een bewerking met de getallen uit de tekst 2. reken uit 3. schrijf de eenheid</td></tr></table>`;
SEC.mix = { id:'mix', ic:'z_mix', nav:'Alles door elkaar', title:'Alles door elkaar en vraagstukken',
  tip:'Kijk eerst welke bewerking er staat en welke regel daarbij hoort. Bij een vraagstuk schrijf je eerst een bewerking met de getallen uit de tekst.',
  cheat:CHEAT_MIX, cards:[MX.mix, MX.welke, MX.vgl, MX.slier, MX.vs1, MX.vs2, MX.magisch, MX.raad] };

/* ============================================================ zoek de fout */
/* elke generator: R -> [opgave, foute regel, k (stap met de fout), oorzaak, waarom] */
const FT_GEN = {
  optel:[
    R => { const a = R.int(3, 15), c = R.int(2, 12), d = R.int(2, 12); return [`${zS(a)} − (${MIN}${c}) + ${d}`, `${a - c} + ${d}`, 0, 'teg', `${zS(a)} − (${MIN}${c}): een negatief getal aftrekken is het tegengestelde optellen, dus ${a} + ${c}.`]; },
    R => { const a = R.int(2, 15), c = R.int(2, 15), d = R.int(2, 9); return [`${zS(-a)} + (${MIN}${c}) − ${d}`, `${zS(-a + c)} − ${d}`, 0, 'tek', `Twee negatieve getallen optellen geeft een negatief getal: ${zS(-a)} + (${MIN}${c}) ${isq} ${zS(-a - c)}.`]; },
    R => { const a = R.int(3, 15), c = R.int(3, 15), d = R.int(2, 9); return [`${zS(-a)} − ${c} + (${MIN}${d})`, `${zS(-a - c + 10)} + (${MIN}${d})`, 0, 'rek', `${zS(-a)} − ${c} ${isq} ${zS(-a - c)}. Dat is een rekenfout.`]; },
    R => { const a = R.int(2, 12), c = R.int(2, 12), d = R.int(2, 9); return [`${zS(a)} − (${MIN}${c}) − ${d}`, `${a + c + d}`, 1, 'tek', `${a + c} − ${d} ${isq} ${a + c - d}: het minteken voor ${d} bleef niet staan.`]; },
    R => { const a = R.int(2, 9), c = R.int(10, 20); return [`${zS(a)} − ${c} + ${R.int(2, 9)}`, null, 0, 'tek', `${a} − ${c} is negatief: ${zS(a - c)}.`]; }],
  maal:[
    R => { const a = R.int(2, 9), c = R.int(2, 9), d = R.int(2, 15); return [`${zS(-a)} · (${MIN}${c}) + ${d}`, `${zS(-a*c)} + ${d}`, 0, 'tek', `Min maal min is plus: ${zS(-a)} · (${MIN}${c}) ${isq} ${a*c}.`]; },
    R => { const a = R.int(2, 9), c = R.int(2, 9), d = R.int(2, 15); return [`${zS(-a*c)} : (${MIN}${c}) − ${d}`, `${zS(-a)} − ${d}`, 0, 'tek', `Zelfde teken: het quotiënt is positief, ${zS(-a*c)} : (${MIN}${c}) ${isq} ${a}.`]; },
    R => { const a = R.int(2, 5), c = R.int(2, 5), d = R.int(2, 4); return [`${a} · (${MIN}${c}) · (${MIN}${d})`, `${zS(-a*c*d)}`, 1, 'tek', `${zS(-a*c)} · (${MIN}${d}): min maal min is plus, dus ${a*c*d}.`]; },
    R => { const a = R.int(3, 9), c = R.int(3, 9), d = R.int(2, 15); return [`${zS(-a)} · ${c} − ${d}`, `${zS(-(a*c + a))} − ${d}`, 0, 'rek', `${a} · ${c} ${isq} ${a*c}: een fout in de tafel van ${a}.`]; }],
  volg:[
    R => { const a = R.int(5, 20), x = R.int(2, 6), y = R.int(2, 6); return [`${zS(-a)} − ${x} · ${y}`, `${zS(-a - x)} · ${y}`, 0, 'vol', `Maal gaat voor min: eerst ${x} · ${y}.`]; },
    R => { const q = R.int(2, 5), m = R.int(2, 6), k = R.int(2, 5); return [`${zS(-q*m)} + ${q*k} : ${q}`, `${zS(-q*m + q*k)} : ${q}`, 0, 'vol', `Gedeeld door gaat voor plus: eerst ${q*k} : ${q}.`]; },
    R => { const a = R.int(2, 6), x = R.int(2, 9), y = R.int(2, 9); return [`${zS(-a)} · (${x} − ${y})`, `${zS(-a*x)} − ${y}`, 0, 'vol', 'Eerst wat tussen haakjes staat.']; },
    R => { const a = R.int(3, 15), x = R.int(2, 5), y = R.int(2, 6); return [`${a} − ${x} · (${MIN}${y})`, `${a - x*y}`, 1, 'teg', `${a} − (${MIN}${x*y}): een negatief getal aftrekken is het tegengestelde optellen, dus ${a} + ${x*y}.`]; }],
  diep:[
    R => { const a = R.int(2, 9), c = R.int(3, 9), d = R.int(10, 19), e = R.int(2, 5), w = d - e; return [`${zS(-a)} − [${c} − (${MIN}${d} + ${e})]`, `${zS(-a)} − ${zP(c - w)}`, 1, 'teg', `${c} − (${MIN}${w}): een negatief getal aftrekken is het tegengestelde optellen, dus ${c} + ${w}.`]; },
    R => { const a = R.int(2, 6), c = R.int(2, 6), d = R.int(2, 6), e = R.int(2, 6); return [`${zS(-a)} · ${c} − ${d} · (${MIN}${e})`, null, 1, 'tek', `${d} · (${MIN}${e}) is negatief: ${zS(-d*e)}.`]; },
    R => { const q = R.int(2, 5), k = R.int(2, 6), d = R.int(2, 9); return [`${zS(-d)} − ${q*k} : (${MIN}${q}) · 2`, null, 0, 'tek', `${q*k} : (${MIN}${q}) ${isq} ${zS(-k)}: verschillend teken geeft een negatief quotiënt.`]; }]
};
/* foute regel automatisch maken als die null is: neem de juiste stap en verander het teken van de eerste uitkomst */
function ftMaak(R, f){ const r = f(R); if(r[1]) return r; const k = r[2];
  const L = ZX.stappen(r[0], false); if(!L || !L[k + 1]) return r;
  const t = ZX.parse(L[k]); const e = ZX.klaar(t)[0]; const v = ZX.val(e).k; if(!v) return r;
  const prev = ZX.val; ZX.val = n => n===e ? {k:-v, x:{}} : prev(n);
  try{ r[1] = ZX.str(ZX.vervang(t, new Set([e]))); } finally { ZX.val = prev; }
  return r; }
const FT = {};
const ftKaart = (title, lvl, soort, n) => schriftKaart(title, lvl, R => R.shuffle(FT_GEN[soort].slice()).map(f => ftMaak(R, f)).filter(x => x[1]), n);
FT.optel = ftKaart('Optellen en aftrekken', 1, 'optel', 2);
FT.maal = ftKaart('Vermenigvuldigen en delen', 1, 'maal', 2);
FT.volg = ftKaart('Volgorde van bewerkingen', 2, 'volg', 3);
FT.mix = schriftKaart('Gemengd', 2, R => R.shuffle(FT_GEN.optel.concat(FT_GEN.maal, FT_GEN.volg)).map(f => ftMaak(R, f)).filter(x => x[1]), 3);
FT.diep = ftKaart('Lange opgaven', 3, 'diep', 3);
SEC.fout = { id:'fout', ic:'fout', nav:'Zoek de fout', title:'Zoek de fout',
  tip:'Klik in het schrift op de eerste regel die fout is. Kies dan wat er misging en verbeter die regel. Zo leer je je eigen fouten herkennen.',
  cards:[FT.optel, FT.maal, FT.volg, FT.mix, FT.diep] };
(function(){ const s = document.createElement('style'); s.textContent = `
  .m5-hok{display:inline-flex; align-items:center; justify-content:center; width:2rem; height:2rem; border:2px dashed var(--orange); border-radius:.4rem; color:var(--orange); font-size:1rem; vertical-align:middle}
  .m5-magisch{border-collapse:collapse; margin:.4rem 0} .m5-magisch td{width:4.4rem; height:3rem; border:2px solid var(--tq); text-align:center; font-size:1.2rem}
  .m5-magisch input{width:3.8rem}
  `; document.head.append(s); })();
/* ============================================================
   SNELLE QUIZ · 10 vragen tegen de klok (telt niet mee)
   ============================================================ */
Object.assign(ICONS, {
  m_quiz:'<circle cx="12" cy="13" r="8"/><path d="M12 13V9M12 13l3 2M10 3h4"/>'
});
const SQ = {
  ch:(q, opts, ans, show) => ({kind:'ch', q, opts, ans, show}),
  w:(q, check, show) => ({kind:'w', q, check, show})
};
const sqG = (h, T) => SQ.w(`${h} ${isq} {{u:a}}`, V=>chkG(V.a, T), zS(T));
const QUIZ = [
  R => { const a = nz(R, -30, 30), c = nz(R, -30, 30); return sqG(`${zS(a)} + ${zP(c)}`, a + c); },
  R => { const a = nz(R, -30, 30), c = nz(R, -30, 30); return sqG(`${zS(a)} − ${zP(c)}`, a - c); },
  R => { const a = nz(R, -12, 12), c = nz(R, -12, 12); return sqG(`${zS(a)} · ${zP(c)}`, a*c); },
  R => { const q = nz(R, -12, 12), c = nz(R, -9, 9); return sqG(`${zS(q*c)} : ${zP(c)}`, q); },
  R => { const a = nz(R, -99, 99); return sqG(`|${zS(a)}|`, Math.abs(a)); },
  R => { const a = nz(R, -99, 99); return SQ.w(`<span class="txt">het tegengestelde van</span> ${zS(a)} ${isq} {{u:a}}`, V=>chkG(V.a, -a), zS(-a)); },
  R => { let a = nz(R, -50, 50), c = nz(R, -50, 50); while(a===c) c = nz(R, -50, 50); return SQ.ch(`${zS(a)} … ${zS(c)}`, [['<', '&lt;'], ['>', '&gt;']], a<c ? '<' : '>', a<c ? '&lt;' : '&gt;'); },
  R => { const f = [0, 1, 2, 3].map(() => R.sign()*R.int(2, 9)); const m = f.filter(x => x<0).length; return SQ.ch(`Is ${f.map((x, k) => k ? zP(x) : zS(x)).join(' · ')} positief of negatief?`, PN, m % 2 ? '-' : '+', m % 2 ? 'negatief' : 'positief'); },
  R => { const t = [nz(R, -15, 15), nz(R, -15, 15), nz(R, -15, 15), nz(R, -15, 15)]; return sqG(kaalS(t), somV(t)); },
  R => { const a = nz(R, -20, 20), c = R.int(2, 6), d = nz(R, -6, 6); return sqG(`${zS(a)} + ${c} · ${zP(d)}`, a + c*d); },
  R => { const a = nz(R, -9, 9), c = R.int(2, 9), d = R.int(2, 9); return sqG(`${zS(a)} · (${c} − ${d})`, a*(c - d)); },
  R => { const [h, ans, show] = R.pick([['−3 ∈ ℕ', 'n', 'niet waar'], ['0 ∈ ℤ⁺', 'w', 'waar'], ['−5 ∈ ℤ⁻', 'w', 'waar'], ['ℕ ⊂ ℤ', 'w', 'waar'], ['ℤ ⊂ ℕ', 'n', 'niet waar'], ['0 ∈ ℤ₀', 'n', 'niet waar']]); return SQ.ch(`${h}`, WNW, ans, show); },
  R => { const [h, ans] = R.pick([[`${MIN}4 + 7 ${isq} 7 + (${MIN}4)`, 'w'], [`(${MIN}2 · 5) · 3 ${isq} ${MIN}2 · (5 · 3)`, 's'], [`${MIN}9 · 0 ${isq} 0`, 'o'], [`${MIN}6 + 6 ${isq} 0`, 'y'], [`1 · (${MIN}8) ${isq} ${MIN}8`, 'n']]); return SQ.ch(`Welke eigenschap? ${h}`, EIG5, ans, EIG5.find(o => o[0]===ans)[1]); }
];
function quizKaart(gens){ return (b, st, save) => {
  const N = 10, T = 180, root = el('div', 'qz'); b.append(root);
  let timer = null; const stop = () => { if(timer){ clearInterval(timer); timer = null; } };
  const mm = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  function intro(){
    stop(); root.innerHTML = '';
    root.append(el('p', 'qz-intro', N + ' vragen, ' + mm(T) + ' minuten. Hoeveel krijg jij juist? Deze quiz telt niet mee.'));
    if(st.best) root.append(el('p', 'qz-sub', 'Jouw beste score: <b>' + st.best.score + ' / ' + N + '</b>' + (st.best.time != null ? ' in ' + mm(st.best.time) : '') + '.'));
    const go = el('button', 'btn', '▶ Start de quiz'); go.type = 'button'; go.addEventListener('click', run); root.append(go);
  }
  function run(){
    stop(); root.innerHTML = '';
    const R = makeR({seed:1 + Math.floor(Math.random() * 2e9)});
    const order = []; while(order.length < N) R.shuffle(gens.map((g, i) => i)).forEach(i => { if(order.length < N) order.push(i); });
    const Qs = order.map(i => gens[i](R));
    const top = el('div', 'qz-top'), klok = el('span', 'qz-klok', mm(T)), prog = el('span'), sc = el('span');
    top.append(klok, prog, sc);
    const balk = el('div', 'qz-balk', '<span style="width:100%"></span>'), vak = el('div', 'qz-vak'), fb = el('div', 'fb');
    root.append(top, balk, vak, fb);
    let k = 0, score = 0, over = T, bezig = false; const mis = [], t0 = Date.now();
    timer = setInterval(() => { if(!root.isConnected){ stop(); return; } over--; klok.textContent = mm(Math.max(0, over)); klok.classList.toggle('laag', over <= 20); balk.firstChild.style.width = Math.max(0, over / T * 100) + '%'; if(over <= 0) einde(true); }, 1000);
    function toon(){
      bezig = false; fb.className = 'fb'; fb.textContent = '';
      prog.textContent = 'Vraag ' + (k + 1) + ' / ' + N; sc.textContent = '✓ ' + score;
      const q = Qs[k]; vak.innerHTML = '';
      if(q.kind === 'ch'){ vak.append(el('div', 'qz-q m4-line', q.q)); const ant = el('div', 'qz-ant'); vak.append(ant);
        q.opts.forEach(o => { const bt = el('button', 'btn ghost qz-opt', o[1]); bt.type = 'button'; bt.addEventListener('click', () => antwoord(o[0] === q.ans, bt)); ant.append(bt); }); }
      else {
        const line = el('div', 'qz-q m4-line', tokens(q.q)); vak.append(line); const V = {};
        const M = mountW(line, V, ()=>{}, ()=>{ M.clear(); }, () => go());
        const ok = el('button', 'btn', 'OK'); ok.type = 'button'; const ant = el('div', 'qz-ant'); ant.append(ok); vak.append(ant);
        const go = () => { if(bezig) return; if(M.empty()){ fb.className = 'fb'; fb.textContent = 'Vul eerst je antwoord in.'; return; }
          let r; try{ r = q.check(V) || {}; }catch(e){ r = {}; } if(r.info){ fb.className = 'fb info'; fb.innerHTML = r.msg || ''; return; }
          M.mark(Object.fromEntries(Object.keys(M.W).map(x => [x, !!r.ok]))); M.lock(); antwoord(!!r.ok); };
        ok.addEventListener('click', go);
        const f = line.querySelector('input'); if(f) f.focus({preventScroll:true});
      }
    }
    function antwoord(goed, bt){
      if(bezig) return; bezig = true; const q = Qs[k];
      if(goed) score++; else mis.push(q);
      if(bt) bt.classList.add(goed ? 'goed' : 'fout');
      vak.querySelectorAll('button').forEach(x => { x.disabled = true; });
      fb.className = 'fb ' + (goed ? 'ok' : 'bad'); fb.innerHTML = goed ? 'Juist!' : 'Juist was: <b>' + q.show + '</b>';
      sc.textContent = '✓ ' + score;
      setTimeout(() => { if(!timer) return; k++; if(k >= N) einde(false); else toon(); }, goed ? 700 : 2200);
    }
    function einde(tijdOm){
      if(!timer && !tijdOm) return; stop(); const gebruikt = Math.min(T, Math.round((Date.now() - t0) / 1000));
      const best = !st.best || score > st.best.score || (score === st.best.score && gebruikt < (st.best.time || 1e9));
      if(best){ st.best = {score, time:tijdOm ? null : gebruikt}; save(); }
      root.innerHTML = '';
      root.append(el('div', 'qz-groot', score + ' / ' + N));
      root.append(el('p', '', (tijdOm ? 'De tijd is om. ' : 'Klaar in ' + mm(gebruikt) + '. ') + (best && score > 0 ? 'Dat is jouw beste score!' : 'Jouw beste score: ' + st.best.score + ' / ' + N + '.')));
      if(mis.length){ root.append(el('p', 'qz-sub', 'Dit ging nog mis:')); const ul = el('ul', 'qz-mis');
        mis.forEach(q => ul.append(el('li', '', `<span class="m4-line" style="display:inline-flex">${q.q.replace(/\{\{[^}]*\}\}/g, '…').replace(/ ?<span class="m4-is">=<\/span> …$/, '')}</span> → <b>${q.show}</b>`))); root.append(ul); }
      if(tijdOm && k < N) root.append(el('p', 'qz-sub', (N - k) + ' vragen kwamen niet meer aan bod.'));
      const nog = el('button', 'btn', '↻ Nog eens'); nog.type = 'button'; nog.addEventListener('click', run); root.append(nog);
    }
    toon();
  }
  intro();
}; }
SEC.quiz = { id:'quiz', ic:'m_quiz', nav:'Snelle quiz', title:'Snelle quiz: hoe snel ben jij?',
  tip:'Tien korte vragen tegen de klok. De quiz telt niet mee: speel hem zo vaak je wil en probeer je beste score te verbeteren.',
  cards:[ { title:'Quiz gehele getallen', noReset:true, build:quizKaart(QUIZ) } ] };
(function(){ const css = `
  .qz{display:flex; flex-direction:column; gap:.7rem}
  .qz-top{display:flex; flex-wrap:wrap; gap:.6rem 1.2rem; align-items:center; font-weight:700; color:var(--accent-dark)}
  .qz-klok{font-variant-numeric:tabular-nums; font-size:1.4rem} .qz-klok.laag{color:var(--bad)}
  .qz-balk{height:.55rem; border-radius:999px; background:var(--accent-soft); overflow:hidden}
  .qz-balk span{display:block; height:100%; background:var(--orange); transition:width 1s linear}
  .qz-q{font-size:1.2rem; line-height:1.7}
  .qz-ant{display:flex; flex-wrap:wrap; gap:.5rem; align-items:center}
  .qz-opt.goed{border-color:var(--ok); background:var(--ok-bg)} .qz-opt.fout{border-color:var(--bad); background:var(--bad-bg)}
  .qz-groot{font-size:2.2rem; font-weight:700; color:var(--accent-dark)}
  .qz-mis{margin:.2rem 0 0; padding-left:1.2rem; line-height:1.9}
  .qz-sub{color:var(--ink-soft)}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* ============================================================
   SPELLETJES · vier op een rij met producten, rekenduel
   tegen de computer (makkelijk of slim) of tegen een klasgenoot op een eigen toestel (code).
   Online: Firestore-collectie zeeslag/{code} (dezelfde regels als zeeslag in 1A module 3: speler a maakt,
   speler b doet mee, enkel a en b wijzigen). Codes van 5 tekens met V of D vooraan, zodat ze nooit
   botsen met de zeeslagcodes van 4 tekens. Telt niet mee: enkel gewonnen spelletjes tegen de computer.
   ============================================================ */
Object.assign(ICONS, {
  z_spel:'<rect x="3" y="7" width="18" height="11" rx="4"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r="1"/><circle cx="17.5" cy="13.8" r="1"/>'
});
const SP_TEKENS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let SP_FB = null;
async function spFirebase(){
  if(window.SP_FB_TEST) return window.SP_FB_TEST;
  if(SP_FB) return SP_FB;
  const kop = document.querySelector('script[src*="gedeeld/kop.js"]');
  if(!kop) throw new Error('geen platform');
  const M = await import(new URL('aanmelden.js', kop.src).href);
  const s = await Promise.race([M.klaar, new Promise((_, rej)=>setTimeout(()=>rej(new Error('niet aangemeld')), 15000))]);
  SP_FB = { F:M.F, db:M.db, me:s.email, naam:(s.user && s.user.displayName) || s.email.split('@')[0] };
  return SP_FB;
}
const spFout = e => /aangemeld|platform|module|fetch/i.test(e.message || '') ? 'Tegen een klasgenoot spelen werkt alleen als je aangemeld bent op het oefenplatform.' : /permission|insufficient/i.test(e.message || '') ? 'Dit lukt nog niet: de spelregels in Firebase staan niet goed. Meld het aan je leerkracht.' : (e.message || 'Er ging iets mis.');
const spEsc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
function spKnop(t, cls, fn){ const b = el('button', 'btn' + (cls ? ' ' + cls : ''), t); b.type = 'button'; b.addEventListener('click', fn); return b; }

/* online: lobby (nieuw spel of code), daarna volg(ref, rol) */
function spLobby(box, letter, start, uitleg){
  box.innerHTML = '';
  box.append(el('p', 'sp-uitleg', uitleg));
  const row = el('div', 'sp-lobby');
  const l = el('div'); const nieuw = spKnop('Nieuw spel maken', '', () => maak().catch(e => toon(spFout(e)))); l.append(el('b', '', 'Ik maak een spel'), nieuw);
  const r = el('div'); const inp = el('input', 'inp sp-code-in'); inp.maxLength = 5; inp.placeholder = 'CODE'; inp.setAttribute('aria-label', 'code van het spel'); inp.autocomplete = 'off';
  const mee = spKnop('Meedoen', 'ghost', () => join()); const rr = el('div', 'sp-rij'); rr.append(inp, mee); r.append(el('b', '', 'Ik heb een code'), rr);
  row.append(l, r); const fb = el('div', 'fb'); box.append(row, fb);
  const toon = m => { fb.className = 'fb bad'; fb.textContent = m; };
  const join = () => meedoen(inp.value.trim().toUpperCase()).catch(e => toon(spFout(e)));
  inp.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); join(); } });
  async function maak(){ const FB = await spFirebase(); const { F, db } = FB;
    for(let t=0; t<20; t++){ const c = letter + [...Array(4)].map(() => SP_TEKENS[Math.floor(Math.random()*SP_TEKENS.length)]).join('');
      const ref = F.doc(db, 'zeeslag', c); const s = await F.getDoc(ref); if(s.exists()) continue;
      await F.setDoc(ref, Object.assign({ a:FB.me, an:FB.naam, b:null, bn:'', stap:'wacht', gemaakt:F.serverTimestamp() }, start()));
      return {FB, ref, rol:'a', code:c}; }
    throw new Error('Geen vrije code gevonden. Probeer opnieuw.'); }
  async function meedoen(c){ if(!new RegExp('^' + letter + '[A-Z0-9]{4}$').test(c)) throw new Error(`Een code voor dit spel heeft 5 tekens en begint met ${letter}.`);
    const FB = await spFirebase(); const { F, db } = FB; const ref = F.doc(db, 'zeeslag', c); const s = await F.getDoc(ref);
    if(!s.exists()) throw new Error(`Er is geen spel met code ${c}.`); const d = s.data();
    if(d.a===FB.me) return {FB, ref, rol:'a', code:c}; if(d.b===FB.me) return {FB, ref, rol:'b', code:c};
    if(d.b) throw new Error('Dit spel heeft al twee spelers.');
    await F.updateDoc(ref, { b:FB.me, bn:FB.naam, stap:'spel' }); return {FB, ref, rol:'b', code:c}; }
  return new Promise(res => { const m0 = maak, j0 = meedoen; maak = async () => { const x = await m0(); res(x); return x; }; meedoen = async c => { const x = await j0(c); res(x); return x; }; });
}
/* keuze van de tegenstander bovenaan een spelkaart */
function spModus(b, st, save, opbouw){
  const bar = el('div', 'sp-modus'); const box = el('div', 'sp-box'); b.append(bar, box);
  const M = [['mak', 'Computer · makkelijk'], ['slim', 'Computer · slim'], ['online', 'Klasgenoot (eigen toestel)']];
  let stop = null;
  const kies = k => { st.modus = k; save(); bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.k===k))); if(stop) stop(); box.innerHTML = ''; stop = opbouw(box, k) || null; };
  M.forEach(([k, t]) => { const x = spKnop(t, 'ghost', () => kies(k)); x.dataset.k = k; bar.append(x); });
  kies(st.modus || 'mak');
}
const spWinst = (st, k) => { const w = st.wins || {}; return `Gewonnen tegen de computer: makkelijk ${w.mak || 0}, slim ${w.slim || 0}.`; };

/* ============================================================ vier op een rij met producten */
const VR_STROOK = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
const VR_ABS = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 25, 30, 36];
const VR_RIJEN = (() => { const L = []; const ok = (r, c) => r>=0 && r<6 && c>=0 && c<6;
  for(let r=0; r<6; r++) for(let c=0; c<6; c++) for(const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]){ const w = [0, 1, 2, 3].map(k => [r + k*dr, c + k*dc]); if(w.every(([x, y]) => ok(x, y))) L.push(w.map(([x, y]) => x*6 + y)); }
  return L; })();
function vrNieuw(R){ const vals = R.shuffle(VR_ABS.flatMap(x => [x, -x])); return { vals, kleur:Array(36).fill(''), pion:[R.pick(VR_STROOK), R.pick(VR_STROOK)], beurt:'a', winnaar:'', laatst:-1 }; }
const vrWint = (kleur, w) => VR_RIJEN.some(L => L.every(i => kleur[i]===w));
function vrZetten(S, w){ const Z = []; for(let p=0; p<2; p++) for(const v of VR_STROOK){ if(v===S.pion[p]) continue; const prod = v*S.pion[1-p]; const i = S.vals.indexOf(prod); if(i>=0 && !S.kleur[i]) Z.push({p, v, i}); } return Z; }
function vrDoe(S, z, w){ const T = {vals:S.vals, kleur:S.kleur.slice(), pion:S.pion.slice(), beurt:w==='a' ? 'b' : 'a', winnaar:'', laatst:z.i}; T.pion[z.p] = z.v; T.kleur[z.i] = w; if(vrWint(T.kleur, w)) T.winnaar = w; else if(T.kleur.every(Boolean)) T.winnaar = 'gelijk'; return T; }
function vrComputer(S, w, slim){
  const Z = vrZetten(S, w); if(!Z.length) return null; const ander = w==='a' ? 'b' : 'a';
  const win = Z.filter(z => vrDoe(S, z, w).winnaar===w);
  if(!slim){ if(win.length && Math.random() < .6) return win[0]; return Z[Math.floor(Math.random()*Z.length)]; }
  if(win.length) return win[0];
  const score = z => { const T = vrDoe(S, z, w); let s = 0;
    if(vrZetten(T, ander).some(y => vrDoe(T, y, ander).winnaar===ander)) s -= 1000;
    VR_RIJEN.forEach(L => { if(!L.includes(z.i)) return; const o = L.filter(i => S.kleur[i]===ander).length, m = L.filter(i => S.kleur[i]===w).length; if(!o) s += [1, 4, 20, 100][m]; if(!m && o) s += [0, 2, 12, 60][o]; });
    return s + Math.random(); };
  return Z.map(z => [score(z), z]).sort((a, c) => c[0] - a[0])[0][1]; }
/* het spelbord tekenen en de zet van de leerling volgen. o: {ik ('a'), namen {a, b}, mag (true als ik aan zet ben), zet(z) na een geldige zet met juiste klik} */
function vrBord(host, S, o){
  host.innerHTML = '';
  const kop = el('div', 'sp-stat'); host.append(kop);
  const bord = el('div', 'sp-bord'); host.append(bord);
  const pk = el('div', 'sp-pionnen'); const strook = el('div', 'sp-strook'); const som = el('div', 'sp-som'); const fb = el('div', 'fb'); host.append(pk, strook, som, fb);
  let kies = null, nieuw = null, fouten = 0;
  const naam = w => w==='a' ? o.namen.a : o.namen.b;
  const teken = () => {
    const S2 = nieuw ? Object.assign({}, S, {pion:nieuw.pion}) : S;
    kop.innerHTML = S.winnaar ? (S.winnaar==='gelijk' ? 'Gelijkspel: het bord is vol.' : `<b class="sp-${S.winnaar}">${spEsc(naam(S.winnaar))}</b> ${S.winnaar===o.ik ? 'win' : 'wint'}! Vier op een rij.`) : `<span class="sp-dot sp-${S.beurt}"></span> ${S.beurt===o.ik ? '<b>Jij bent aan zet.</b>' : spEsc(naam(S.beurt)) + ' is aan zet …'}`;
    bord.innerHTML = '';
    const rij = VR_RIJEN.find(L => S.winnaar && L.every(i => S.kleur[i]===S.winnaar)) || [];
    S.vals.forEach((v, i) => { const c = el('button', 'sp-cel' + (S.kleur[i] ? ' sp-' + S.kleur[i] : '') + (i===S.laatst ? ' laatst' : '') + (rij.includes(i) ? ' rij' : ''), zS(v)); c.type = 'button';
      c.disabled = !!S.kleur[i] || !nieuw; c.addEventListener('click', () => klik(i)); bord.append(c); });
    pk.innerHTML = ''; const mag = o.mag() && !S.winnaar && !nieuw;
    if(mag || nieuw) pk.append(el('span', 'sp-vr', nieuw ? '' : 'Welke pion verschuif je?'));
    [0, 1].forEach(p => { const x = spKnop(`<span class="sp-pion">${'①②'[p]}</span> staat op ${zS(S2.pion[p])}`, 'ghost sp-pk', () => { if(!mag) return; kies = kies===p ? null : p; fb.className = 'fb'; fb.textContent = ''; teken(); });
      x.setAttribute('aria-pressed', String(kies===p)); x.disabled = !mag; pk.append(x); });
    strook.innerHTML = ''; VR_STROOK.forEach(v => { const x = el('button', 'sp-sv', `<span>${zS(v)}</span><span class="sp-pp">${[0, 1].filter(p => S2.pion[p]===v).map(p => '①②'[p]).join('')}</span>`); x.type = 'button';
      x.disabled = !mag || kies==null || v===S.pion[kies]; x.addEventListener('click', () => schuif(v)); strook.append(x); });
    som.innerHTML = nieuw ? `Zoek <b>${zS(nieuw.pion[0])} · ${zP(nieuw.pion[1])}</b> op het bord en klik erop.` : (mag && kies!=null ? `Klik op het getal waar pion ${'①②'[kies]} naartoe gaat.` : '');
  };
  function schuif(v){ const pion = S.pion.slice(); pion[kies] = v; const prod = pion[0]*pion[1]; const i = S.vals.indexOf(prod);
    if(S.kleur[i]){ fb.className = 'fb bad'; fb.innerHTML = `${zS(pion[0])} · ${zP(pion[1])} ${isq} ${zS(prod)}, maar dat vak is al bezet. Kies een andere zet.`; return; }
    nieuw = {pion, p:kies, v, i}; fouten = 0; fb.className = 'fb'; fb.textContent = ''; teken(); }
  function klik(i){ if(!nieuw) return;
    if(i!==nieuw.i){ fouten++; fb.className = 'fb bad'; fb.innerHTML = `Nee, dat vak is ${zS(S.vals[i])}. Reken ${zS(nieuw.pion[0])} · ${zP(nieuw.pion[1])} nog eens uit.` + (fouten>=2 ? ' Denk aan de tekenregel: zelfde teken +, verschillend teken −.' : ''); return; }
    const z = {p:nieuw.p, v:nieuw.v, i}; nieuw = null; kies = null; fb.className = 'fb'; fb.textContent = ''; o.zet(z); }
  teken();
  return { fb };
}
function vierLokaal(box, st, save, slim){
  let S = null, tm = null, ik = 'a';
  const info = el('p', 'sp-uitleg', 'Om beurt verschuif je één pion op de strook. Het product van de twee pionnen kleurt een vak in jouw kleur. Wie eerst vier vakken op een rij heeft (horizontaal, verticaal of schuin), wint.');
  const veld = el('div'); const voet = el('div', 'sp-voet'); box.append(info, veld, voet);
  const nieuwSpel = () => { clearTimeout(tm); S = vrNieuw(makeR({seed:1 + Math.floor(Math.random()*2e9)})); st.start = st.start==='b' ? 'a' : 'b'; S.beurt = st.start; save(); stap(); };
  const voetT = () => { voet.innerHTML = ''; voet.append(spKnop('↻ Nieuw spel', 'ghost', nieuwSpel), el('span', 'sp-sub', spWinst(st))); };
  function stap(){
    if(!S.winnaar && !vrZetten(S, S.beurt).length){ const ander = S.beurt==='a' ? 'b' : 'a'; if(!vrZetten(S, ander).length) S.winnaar = 'gelijk'; else S.beurt = ander; }
    if(S.winnaar==='a'){ st.wins = st.wins || {}; st.wins[slim ? 'slim' : 'mak'] = (st.wins[slim ? 'slim' : 'mak'] || 0) + 1; save(); }
    vrBord(veld, S, { ik, namen:{a:'Jij', b:'De computer'}, mag:() => S.beurt===ik, zet:z => { S = vrDoe(S, z, ik); stap(); } }); voetT();
    if(!S.winnaar && S.beurt==='b'){ tm = setTimeout(() => { if(!box.isConnected) return; const z = vrComputer(S, 'b', slim); if(z) S = vrDoe(S, z, 'b'); else S.beurt = 'a'; stap(); }, 1100); }
  }
  nieuwSpel();
  return () => clearTimeout(tm);
}
function vierOnline(box){
  let unsub = null, weg = false;
  const uit = 'Speel tegen een klasgenoot, elk op je eigen toestel. Eén van jullie maakt een spel en krijgt een code; de ander tikt die code in. Wie het spel maakt, begint.';
  const lobby = () => { if(weg) return; spLobby(box, 'V', () => { const S = vrNieuw(makeR({seed:1 + Math.floor(Math.random()*2e9)})); return { spel:'vier', vals:S.vals, kleur:S.kleur, pion:S.pion, beurt:'a', winnaar:'', laatst:-1 }; }, uit).then(volg); };
  function volg({FB, ref, rol, code}){
    box.innerHTML = ''; const kop = el('p', 'sp-code', `Code van dit spel: <b>${code}</b>`); const veld = el('div'); const voet = el('div', 'sp-voet'); box.append(kop, veld, voet);
    voet.append(spKnop('Stoppen', 'ghost', () => { if(unsub) unsub(); unsub = null; lobby(); }));
    let bezig = false;
    unsub = FB.F.onSnapshot(ref, snap => { if(!snap.exists()){ lobby(); return; } const d = snap.data();
      if(d.stap==='wacht' || !d.b){ veld.innerHTML = `<p class="sp-wacht">Wacht op je klasgenoot. Geef de code <b>${code}</b> door.</p>`; return; }
      const S = {vals:d.vals, kleur:d.kleur, pion:d.pion, beurt:d.beurt, winnaar:d.winnaar, laatst:d.laatst};
      vrBord(veld, S, { ik:rol, namen:{a:d.an, b:d.bn}, mag:() => S.beurt===rol && !bezig, zet:async z => { bezig = true; const T = vrDoe(S, z, rol);
        if(!T.winnaar && !vrZetten(T, T.beurt).length) T.beurt = rol;
        try{ await FB.F.updateDoc(ref, { kleur:T.kleur, pion:T.pion, beurt:T.beurt, winnaar:T.winnaar, laatst:T.laatst }); }catch(e){ veld.querySelector('.fb').className = 'fb bad'; veld.querySelector('.fb').textContent = spFout(e); } bezig = false; } });
    }, e => { veld.innerHTML = ''; veld.append(el('div', 'fb bad', spFout(e))); });
  }
  lobby();
  return () => { weg = true; if(unsub) unsub(); };
}
const SP_VIER = { title:'Vier op een rij met producten', noReset:true,
  instr:'Speel tegen de computer of tegen een klasgenoot. Dit spel telt niet mee.',
  build(b, st, save){ if(QZ) return; spModus(b, st, save, (box, k) => k==='online' ? vierOnline(box) : vierLokaal(box, st, save, k==='slim')); } };

/* ============================================================ rekenduel */
const DU_N = 10;
/* makkelijk: twee getallen, kleine tafels; slim: iets grotere getallen en af en toe twee bewerkingen */
const DU_GEN = {
  mak:[
    R => { const a = nz(R, -12, 12), c = nz(R, -12, 12); return [`${zS(a)} + ${zP(c)}`, a + c]; },
    R => { const a = nz(R, -12, 12), c = nz(R, -9, 9); return [`${zS(a)} − ${zP(c)}`, a - c]; },
    R => { const a = nz(R, -6, 6), c = nz(R, -5, 5); return [`${zS(a)} · ${zP(c)}`, a*c]; },
    R => { const q = nz(R, -6, 6), c = nz(R, -5, 5); return [`${zS(q*c)} : ${zP(c)}`, q]; },
    R => { const a = nz(R, -20, 20); return [`|${zS(a)}|`, Math.abs(a)]; }],
  slim:[
    R => { const a = nz(R, -25, 25), c = nz(R, -25, 25); return [`${zS(a)} + ${zP(c)}`, a + c]; },
    R => { const a = nz(R, -25, 25), c = nz(R, -15, 15); return [`${zS(a)} − ${zP(c)}`, a - c]; },
    R => { const a = nz(R, -9, 9), c = nz(R, -9, 9); return [`${zS(a)} · ${zP(c)}`, a*c]; },
    R => { const q = nz(R, -9, 9), c = nz(R, -9, 9); return [`${zS(q*c)} : ${zP(c)}`, q]; },
    R => { const t = [nz(R, -9, 9), nz(R, -9, 9), nz(R, -9, 9)]; return [kaalS(t), somV(t)]; },
    R => { const a = nz(R, -10, 10), d = nz(R, -5, 5); return [`${zS(a)} + 2 · ${zP(d)}`, a + 2*d]; }]
};
const duVraag = (seed, k, niv='mak') => { const R = makeR({seed:seed + k*7919}); return R.pick(DU_GEN[niv])(R); };
/* het scherm: vraag, eigen cijferblok en de andere speler. o: {namen, score() -> [ik, ander], ronde, vraag:[h, T], ok() (eigen juist antwoord), status} */
function duScherm(host){
  host.innerHTML = '';
  const top = el('div', 'sp-score'); const q = el('div', 'sp-q m4-line'); const hl = el('div', 'sp-helften');
  const jij = el('div', 'sp-jij'); const ander = el('div', 'sp-ander'); hl.append(jij, ander);
  const fb = el('div', 'fb'); host.append(top, q, hl, fb);
  const inp = el('input', 'inp sp-in'); inp.setAttribute('inputmode', 'none'); inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'jouw antwoord');
  const pad = el('div', 'sp-pad'); jij.append(el('b', 'sp-wie', 'Jij'), inp, pad);
  let onOk = null, slot = 0;
  ['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', '⌫'].forEach(t => pad.append(spKnop(t, 'ghost sp-k', () => { if(Date.now() < slot) return; if(t==='⌫') inp.value = inp.value.slice(0, -1); else if(t==='−') inp.value = inp.value.startsWith(MIN) ? inp.value.slice(1) : MIN + inp.value; else inp.value += t; })));
  const ok = spKnop('OK', 'sp-ok', () => stuur()); pad.append(ok);
  inp.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); stuur(); } });
  inp.addEventListener('input', () => { inp.value = inp.value.replace(/-/g, MIN).replace(/[^0-9−]/g, ''); });
  function stuur(){ if(Date.now() < slot || !onOk) return; const x = rdZ({t:inp.value, z:true}); if(x==null){ fb.className = 'fb info'; fb.textContent = 'Typ een geheel getal.'; return; } onOk(x); }
  return { top, q, ander, fb, inp,
    vraag(h, cb){ q.innerHTML = `${h} ${isq} <span class="sp-vraagt">?</span>`; inp.value = ''; inp.disabled = false; fb.className = 'fb'; fb.textContent = ''; onOk = cb; if(matchMedia('(pointer:fine)').matches) inp.focus({preventScroll:true}); },
    toon(h, T, wie){ q.innerHTML = `${h} ${isq} <b class="sp-antw">${zS(T)}</b>`; onOk = null; inp.disabled = true; fb.className = 'fb ' + (wie==='ik' ? 'ok' : 'info'); fb.innerHTML = wie==='ik' ? '✅ Jij was het snelst!' : wie==='niemand' ? 'Niemand had het juist.' : `${spEsc(wie)} was sneller.`; },
    straf(){ slot = Date.now() + 2000; inp.value = ''; fb.className = 'fb bad'; fb.textContent = '❌ Niet juist. Twee seconden wachten …'; setTimeout(() => { if(fb.textContent.startsWith('❌')){ fb.className = 'fb'; fb.textContent = ''; } }, 2000); } };
}
function duelLokaal(box, st, save, slim){
  const info = el('p', 'sp-uitleg', `${DU_N} opgaven. Wie eerst het juiste antwoord geeft, krijgt het punt. Een fout antwoord kost je twee seconden.`);
  const veld = el('div'); const voet = el('div', 'sp-voet'); box.append(info, veld, voet);
  let tm = [], ronde = 0, sc = [0, 0], scherm = null;
  const wis = () => { tm.forEach(clearTimeout); tm = []; };
  const voetT = () => { voet.innerHTML = ''; voet.append(spKnop('↻ Opnieuw', 'ghost', start), el('span', 'sp-sub', spWinst(st))); };
  function start(){ wis(); ronde = 0; sc = [0, 0]; scherm = duScherm(veld); scherm.ander.innerHTML = '<b class="sp-wie">De computer</b><div class="sp-denk"><span></span></div><p class="sp-sub">denkt na …</p>'; voetT(); const seed = 1 + Math.floor(Math.random()*2e9); volgende(seed); }
  function score(){ scherm.top.innerHTML = `<span class="sp-a">Jij <b>${sc[0]}</b></span><span class="sp-b">Computer <b>${sc[1]}</b></span><span>Opgave ${Math.min(ronde + 1, DU_N)} van ${DU_N}</span>`; }
  function volgende(seed){ if(!box.isConnected) return wis();
    if(ronde >= DU_N){ const w = sc[0] > sc[1] ? 'Jij wint!' : sc[0] < sc[1] ? 'De computer wint.' : 'Gelijkspel.'; if(sc[0] > sc[1]){ st.wins = st.wins || {}; st.wins[slim ? 'slim' : 'mak'] = (st.wins[slim ? 'slim' : 'mak'] || 0) + 1; save(); }
      score(); scherm.q.innerHTML = `<b>${w}</b>&nbsp;${sc[0]} – ${sc[1]}`; scherm.fb.className = 'fb'; scherm.fb.textContent = ''; scherm.inp.disabled = true; voetT(); return; }
    const [h, T] = duVraag(seed, ronde, slim ? 'slim' : 'mak'); let klaar = false; score();
    const denk = scherm.ander.querySelector('.sp-denk span'); const ms = slim ? 6000 + Math.random()*3000 : 10000 + Math.random()*4000;
    denk.style.transition = 'none'; denk.style.width = '0%'; requestAnimationFrame(() => { denk.style.transition = `width ${ms}ms linear`; denk.style.width = '100%'; });
    const eind = wie => { if(klaar) return; klaar = true; wis(); denk.style.transition = 'none'; denk.style.width = wie==='De computer' ? '100%' : '0%'; scherm.toon(h, T, wie); tm.push(setTimeout(() => { ronde++; volgende(seed); }, 1800)); };
    scherm.vraag(h, x => { if(x===T){ sc[0]++; eind('ik'); } else scherm.straf(); });
    tm.push(setTimeout(() => { if(Math.random() < (slim ? .9 : .75)){ sc[1]++; eind('De computer'); } else { scherm.ander.querySelector('.sp-sub').textContent = 'De computer had het fout!'; tm.push(setTimeout(() => eind('niemand'), 6000)); } }, ms));
  }
  veld.append(spKnop('▶ Start het duel', '', start)); voet.append(el('span', 'sp-sub', spWinst(st)));
  return wis;
}
function duelOnline(box){
  let unsub = null, weg = false, tm = null;
  const uit = `Speel tegen een klasgenoot, elk op je eigen toestel. Eén van jullie maakt een spel en krijgt een code; de ander tikt die code in. ${DU_N} opgaven: wie eerst juist antwoordt, krijgt het punt.`;
  const lobby = () => { if(weg) return; spLobby(box, 'D', () => ({ spel:'duel', seed:1 + Math.floor(Math.random()*2e9), ronde:0, antw:[] }), uit).then(volg); };
  function volg({FB, ref, rol, code}){
    box.innerHTML = ''; const kop = el('p', 'sp-code', `Code van dit spel: <b>${code}</b>`); const veld = el('div'); const voet = el('div', 'sp-voet'); box.append(kop, veld, voet);
    voet.append(spKnop('Stoppen', 'ghost', () => { if(unsub) unsub(); unsub = null; clearTimeout(tm); lobby(); }));
    let scherm = null, toonR = -1;
    unsub = FB.F.onSnapshot(ref, snap => { if(!snap.exists()){ lobby(); return; } const d = snap.data();
      if(d.stap==='wacht' || !d.b){ veld.innerHTML = `<p class="sp-wacht">Wacht op je klasgenoot. Geef de code <b>${code}</b> door.</p>`; return; }
      if(!scherm){ scherm = duScherm(veld); }
      const ander = rol==='a' ? 'b' : 'a'; const naam = w => w==='a' ? d.an : d.bn;
      const winR = r => { const x = (d.antw||[]).find(a => a.r===r); return x ? x.w : null; };
      const sc = w => { let n = 0; for(let r=0; r<DU_N; r++) if(winR(r)===w) n++; return n; };
      scherm.top.innerHTML = `<span class="sp-a">Jij <b>${sc(rol)}</b></span><span class="sp-b">${spEsc(naam(ander))} <b>${sc(ander)}</b></span><span>Opgave ${Math.min(d.ronde + 1, DU_N)} van ${DU_N}</span>`;
      scherm.ander.innerHTML = `<b class="sp-wie">${spEsc(naam(ander))}</b><p class="sp-sub">speelt op een ander toestel</p>`;
      if(d.ronde >= DU_N){ const a = sc(rol), o = sc(ander); scherm.q.innerHTML = `<b>${a > o ? 'Jij wint!' : a < o ? spEsc(naam(ander)) + ' wint.' : 'Gelijkspel.'}</b>&nbsp;${a} – ${o}`; scherm.inp.disabled = true; scherm.fb.className = 'fb'; scherm.fb.textContent = ''; return; }
      const [h, T] = duVraag(d.seed, d.ronde); const w = winR(d.ronde);
      if(w){ if(toonR!==d.ronde + .5){ toonR = d.ronde + .5; scherm.toon(h, T, w===rol ? 'ik' : naam(w)); }
        if(rol==='a'){ clearTimeout(tm); const r = d.ronde; tm = setTimeout(() => FB.F.updateDoc(ref, { ronde:r + 1 }).catch(() => {}), 1800); } return; }
      if(toonR!==d.ronde){ toonR = d.ronde; scherm.vraag(h, x => { if(x!==T){ scherm.straf(); return; } scherm.inp.disabled = true;
        FB.F.updateDoc(ref, { antw:FB.F.arrayUnion({ w:rol, r:d.ronde, t:Date.now() + Math.random() }) }).catch(e => { scherm.fb.className = 'fb bad'; scherm.fb.textContent = spFout(e); }); }); }
    }, e => { veld.innerHTML = ''; veld.append(el('div', 'fb bad', spFout(e))); });
  }
  lobby();
  return () => { weg = true; clearTimeout(tm); if(unsub) unsub(); };
}
const SP_DUEL = { title:'Rekenduel', noReset:true,
  instr:'Wie rekent het snelst? Speel tegen de computer of tegen een klasgenoot. Dit spel telt niet mee.',
  build(b, st, save){ if(QZ) return; spModus(b, st, save, (box, k) => k==='online' ? duelOnline(box) : duelLokaal(box, st, save, k==='slim')); } };
SEC.spel = { id:'spel', ic:'z_spel', nav:'Spelletjes', title:'Spelletjes',
  tip:'Speel tegen de computer of tegen een klasgenoot op een eigen toestel. Je hebt dan een code nodig van wie het spel maakt. De spelletjes tellen niet mee.',
  cards:[SP_VIER, SP_DUEL] };
(function(){ const s = document.createElement('style'); s.textContent = `
  .sp-modus{display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:.6rem}
  .sp-modus .btn.ghost[aria-pressed="true"]{background:var(--tq); border-color:var(--tq); color:#173436}
  .sp-box{display:flex; flex-direction:column; gap:.6rem}
  .sp-uitleg{margin:0; color:var(--ink-soft)} .sp-sub{color:var(--ink-soft); font-size:.9rem}
  .sp-lobby{display:grid; grid-template-columns:repeat(auto-fit, minmax(14rem, 1fr)); gap:.8rem} .sp-lobby > div{display:flex; flex-direction:column; gap:.4rem; align-items:flex-start}
  .sp-rij{display:flex; gap:.4rem; flex-wrap:wrap} .sp-code-in{width:7rem; text-transform:uppercase; letter-spacing:.15em; font-weight:700; text-align:center}
  .sp-code{margin:0; font-size:1.05rem} .sp-code b{letter-spacing:.15em} .sp-wacht{font-size:1.1rem}
  .sp-voet{display:flex; flex-wrap:wrap; gap:.6rem 1rem; align-items:center}
  .sp-stat{font-size:1.1rem; min-height:1.6rem; display:flex; align-items:center; gap:.4rem}
  .sp-dot{display:inline-block; width:1rem; height:1rem; border-radius:50%}
  .sp-dot.sp-a, .sp-cel.sp-a{background:var(--tq)} .sp-dot.sp-b, .sp-cel.sp-b{background:var(--orange)}
  b.sp-a{color:var(--accent-dark)} b.sp-b{color:#b86e00}
  .sp-bord{display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:.3rem; width:100%; max-width:24rem}
  .sp-cel{aspect-ratio:1; max-width:100%; font:inherit; font-size:1.1rem; font-weight:700; border:2px solid var(--tq); border-radius:.5rem; background:var(--card); color:var(--ink); cursor:pointer; font-variant-numeric:tabular-nums; padding:0}
  .sp-cel:not(:disabled):hover{border-color:var(--orange); background:var(--or-soft)} .sp-cel:disabled{cursor:default}
  .sp-cel.sp-a, .sp-cel.sp-b{color:#173436; border-color:transparent} .sp-cel.laatst{outline:3px solid var(--ink); outline-offset:-3px} .sp-cel.rij{box-shadow:0 0 0 3px var(--ok); animation:sp-pols 1s ease-in-out 3}
  @keyframes sp-pols{50%{transform:scale(1.08)}}
  .sp-pionnen{display:flex; flex-wrap:wrap; gap:.4rem; align-items:center} .sp-vr{font-weight:700}
  .btn.ghost.sp-pk[aria-pressed="true"]{background:var(--or-soft); border-color:var(--orange)} .sp-pion{font-size:1.2rem}
  .sp-strook{display:grid; grid-template-columns:repeat(12, minmax(0, 1fr)); gap:.2rem; width:100%; max-width:36rem}
  @media (max-width:560px){ .sp-strook{grid-template-columns:repeat(6, minmax(0, 1fr))} }
  .sp-sv{font:inherit; font-weight:700; display:flex; flex-direction:column; align-items:center; padding:.2rem 0; border:2px solid var(--border); border-radius:.45rem; background:var(--card); color:var(--ink); cursor:pointer}
  .sp-sv:not(:disabled):hover{border-color:var(--orange)} .sp-sv:disabled{cursor:default; opacity:.85} .sp-pp{min-height:1.3rem; color:var(--accent-dark); font-size:1.05rem}
  .sp-som{min-height:1.5rem; font-size:1.1rem}
  .sp-score{display:flex; flex-wrap:wrap; gap:.4rem 1.4rem; font-weight:700; font-size:1.05rem} .sp-score .sp-a b{color:var(--accent-dark)} .sp-score .sp-b b{color:#b86e00}
  .sp-q{font-size:1.6rem; min-height:2.4rem} .sp-vraagt{color:var(--orange)} .sp-antw{color:var(--ok)}
  .sp-helften{display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:1rem; align-items:start}
  @media (max-width:560px){ .sp-helften{grid-template-columns:1fr} .sp-ander{order:-1} }
  .sp-jij, .sp-ander{border:2px solid var(--tq); border-radius:.8rem; padding:.7rem; display:flex; flex-direction:column; gap:.5rem; min-width:0}
  .sp-ander{border-color:var(--orange)} .sp-wie{font-size:1.05rem}
  .sp-in{font-size:1.5rem; font-weight:700; text-align:center; width:100%; box-sizing:border-box}
  .sp-pad{display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:.3rem} .sp-k{font-size:1.25rem; padding:.45rem 0} .sp-ok{grid-column:1 / -1}
  .sp-denk{height:.7rem; border-radius:999px; background:var(--or-soft); overflow:hidden} .sp-denk span{display:block; height:100%; width:0; background:var(--orange)}
  @media (prefers-reduced-motion:reduce){ .sp-cel.rij{animation:none} }
  `; document.head.append(s); })();
/* ============================================================
   PROEFTOETSEN 1–3 · op 20 punten, alle onderdelen door elkaar
   ============================================================ */
const TOETS_TIP = 'Een proeftoets op 20 punten over de hele module. Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Werk zonder spiekbriefje en zonder rekenmachine.';
const tRij = (b, L, fn) => { const g = el('div', 'm4-items'); b.append(g); L.forEach((x, i) => { const row = el('div', 'm4-wn'); g.append(row); fn(row, x, i, 'abcdefgh'[i] + ')'); }); };
/* 1. verzamelingen (2 pt) */
function tVerz(b, st, save){
  const R = makeR(st); const V = [['ℕ', x => x>=0], ['ℤ⁺', x => x>=0], ['ℤ⁻', x => x<=0], ['ℤ₀', x => x!==0]];
  const L = R.shuffle([0, nz(R, -20, -1), R.int(1, 30), nz(R, -9, -1), R.int(2, 9)]).slice(0, 4).map((x, k) => [x, V[(k + R.int(0, 3)) % 4]]);
  tRij(b, L, (row, [x, [n, f]], i, nr) => qChoice(row, st, save, 'v' + i, { nr, html:`<span class="m5-groot">${zS(x)} … ${n}</span>`, opts:[['in', '∈'], ['uit', '∉']], sym:true, ans:f(x) ? 'in' : 'uit' }));
}
/* 2. absolute waarde en ordenen (2 pt) */
function tOrde(b, st, save){
  const R = makeR(st); const G = []; while(G.length < 5){ const x = R.int(-25, 25); if(!G.includes(x)) G.push(x); }
  rangschik(b, st, save, 'r', { getallen:G.map(w => ({w, h:zS(w)})), op:R.f() < .5, pts:2 });
  const a = nz(R, -40, -2), c = nz(R, -15, 15), d = nz(R, -15, 15);
  reeks(b, 2, (g, i, nr) => { const [h, T] = i ? [`|${zS(c)}| − |${zS(d)}|`, Math.abs(c) - Math.abs(d)] : [`|${zS(a)}| + ${zP(a)}`, 0]; mQ(g, st, save, 'a' + i, { nr, html:`${h} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), sol:`${h} ${isq} ${zS(T)}` }); });
}
/* 3. optellen en aftrekken (3 pt) */
function tPlus(b, st, save){
  const R = makeR(st); const L = R.shuffle([0, 1, 2, 3, 4, 5]).map(k => { const a = nz(R, -60, 60), c = (k % 2 ? -1 : 1)*R.int(2, 60); return k<3 ? [`${zS(a)} + ${zP(c)}`, a + c] : [`${zS(a)} − ${zP(c)}`, a - c]; });
  reeks(b, 6, (g, i, nr) => { const [h, T] = L[i]; mQ(g, st, save, 'p' + i, { nr, html:`${h} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), sol:`${h} ${isq} ${zS(T)}` }); });
}
/* 4. vermenigvuldigen en delen (3 pt) */
function tMaal(b, st, save){
  const R = makeR(st); const L = R.shuffle([0, 1, 2, 3, 4, 5]).map(k => { const a = R.sign()*R.int(2, 12), c = (k % 2 ? -1 : 1)*R.int(2, 9); return k<3 ? [`${zS(a)} · ${zP(c)}`, a*c] : [`${zS(a*c)} : ${zP(c)}`, a]; });
  reeks(b, 6, (g, i, nr) => { const [h, T] = L[i]; mQ(g, st, save, 'm' + i, { nr, html:`${h} ${isq} {{u:a}}`, check:V=>chkG(V.a, T), sol:`${h} ${isq} ${zS(T)}` }); });
}
/* 5. gedurige som en product (2 pt) */
function tGedur(b, st, save){
  const R = makeR(st); const t = () => R.int(2, 40);
  let s = zS(-t()); for(let j=0; j<4; j++) s += ` ${R.pick(['+', '−'])} ${zP(R.sign()*t())}`;
  const f = [R.sign()*R.int(2, 5), -R.int(2, 5), R.sign()*R.int(2, 5), -R.pick([2, 5, 10])]; const p = f.map((x, k) => k ? zP(x) : zS(x)).join(' · ');
  reeks(b, 2, (g, i, nr) => vrijOpg(g, st, save, 'g' + i, nr, i ? p : s, {k:'h', hint:false}), {een:true});
}
/* 6. volgorde van bewerkingen (4 pt) */
function tVolg(b, st, save){
  const R = makeR(st); const L = opgN(R, VT.vrij1, 2).concat(opgN(R, VT.vrij2, 1), opgN(R, VT.vierk, 1, {lim:200}));
  reeks(b, 4, (g, i, nr) => vrijOpg(g, st, save, 'o' + i, nr, L[i], {k:i===3 ? 'mdhv' : 'mdh', hint:false}), {een:true});
}
/* 7. distributiviteit (2 pt) */
function tDistr(b, st, save){
  const R = makeR(st); const x = R.pick(['x', 'a']), n = R.int(2, 9), m = R.int(2, 9), a = R.int(3, 9);
  const E = R.pick([`-${n} · (${x} - ${m})`, `-${n} · (${m} + ${x})`, `${n} · (-${x} + ${m})`]); const r = R.pick([98, 99, 102, 101]);
  reeks(b, 2, (g, i, nr) => i ? mQ(g, st, save, 'h', { nr, html:`<span class="txt">Reken handig:</span> ${zS(-a)} · ${r} ${isq} {{u:a}}`, check:V=>chkG(V.a, -a*r), sol:`${zS(-a)} · (100 ${r<100 ? '−' : '+'} ${Math.abs(r - 100)}) ${isq} ${zS(-a*100)} ${r<100 ? '+' : '−'} ${a*Math.abs(r - 100)} ${isq} ${zS(-a*r)}` })
    : letterOpg(g, st, save, 'l', nr, E, false), {een:true});
}
/* 8. eigenschappen (1 pt) */
function tEig(b, st, save){
  const R = makeR(st); const a = nz(R, -20, 20), c = nz(R, -20, 20), d = nz(R, -9, 9);
  const L = R.shuffle([[`${zS(a)} + ${zP(c)} ${isq} ${zS(c)} + ${zP(a)}`, 'w'], [`(${zS(a)} · ${zP(c)}) · ${zP(d)} ${isq} ${zS(a)} · (${zS(c)} · ${zP(d)})`, 's'], [`${zS(a)} + ${zP(-a)} ${isq} 0`, 'y'], [`${zS(c)} · 0 ${isq} 0`, 'o'], [`${zS(d)} · 1 ${isq} ${zS(d)}`, 'n']]).slice(0, 2);
  const g = el('div', 'm4-items een'); b.append(g);
  L.forEach(([h, ans], i) => { const row = el('div', 'm4-wn'); g.append(row); qChoice(row, st, save, 'e' + i, { nr:'ab'[i] + ')', html:`<span class="m5-groot">${h}</span>`, opts:EIG5, ans }); });
}
/* 9. vraagstuk (1 pt) */
const tVraag = i => (b, st, save) => { const R = makeR(st); const [tx, E, eh] = VS[[2, 5, 6][i]](R); const T = ZX.waarde(E).k;
  mQ(b, st, save, 'v', { html:`<span class="txt">${tx}</span> {{z:a,mdh}}`, check:V=>chkZ(V.a, T), sol:`${zT(E)} ${isq} ${zS(T)}${eh ? ' ' + eh : ''}` }); };
function bigToets(i){ return [
  {sec:'Gehele getallen', pts:2, prompt:'Vul aan met ∈ of ∉.', build:tVerz},
  {sec:'Ordenen en absolute waarde', pts:2, build:tOrde},
  {sec:'Optellen en aftrekken', pts:3, prompt:'Bereken.', build:tPlus},
  {sec:'Vermenigvuldigen en delen', pts:3, prompt:'Bereken.', build:tMaal},
  {sec:'Gedurige som en gedurig product', pts:2, prompt:'Bereken. Schrijf de tussenstappen.', build:tGedur},
  {sec:'Volgorde van de bewerkingen', pts:4, prompt:'Bereken. Schrijf de tussenstappen.', build:tVolg},
  {sec:'Distributiviteit', pts:2, prompt:'Werk de haakjes weg en reken handig.', build:tDistr},
  {sec:'Eigenschappen', pts:1, prompt:'Welke eigenschap wordt gebruikt?', build:tEig},
  {sec:'Vraagstuk', pts:1, prompt:'Schrijf een bewerking en reken uit.', build:tVraag(i)}
]; }
[0, 1, 2].forEach(i => { SEC['toets' + (i+1)] = { id:'toets' + (i+1), ic:'toets', nav:'Proeftoets ' + (i+1), title:'Proeftoets ' + (i+1), tip:TOETS_TIP,
  cards:[ { title:'Proeftoets ' + (i+1), noReset:true, build:(b, st, save, key) => proeftoets(b, st, save, key, bigToets(i)) } ] }; });
/* volgorde van de onderdelen in het menu */
const ORDER = ['getal', 'abs', 'orde', 'optel', 'aftrek', 'maal', 'deel', 'eig', 'distr', 'gedur', 'volg', 'mix', 'fout', 'quiz', 'spel', 'toets1', 'toets2', 'toets3'];
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
    const c = el('div','card m4-geenbrk');   /* geen breuken in deze module */
    const ch = el('div','card-head', `<h3>${card.title}${card.lvl?LVL[card.lvl]:''}</h3>`);
    const rb = el('button','refresh-btn', card.keep ? '↺ Opnieuw beginnen' : '↺ Nieuwe opgave'); rb.type='button';
    if(!card.noReset) ch.append(rb); c.append(ch);
    if(card.instr) c.append(el('p','instructions', card.instr));
    const body = el('div'); c.append(body); (card.lvl===3 ? panes.c : panes.b).append(c);
    renderers[key] = ()=>{ body.innerHTML = ''; clearSel(); const st = load(key); const save = ()=>store(key, st); CURKEY = key;
      try{ card.build(body, st, save, key); hintsSamen(body, key); if(body.querySelector('.m5-z')) vzHulp(c); }catch(err){ console.error(err); body.append(el('p','fb bad','Er liep iets mis bij het maken van deze oefening. Klik op “Nieuwe opgave”.')); }
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
