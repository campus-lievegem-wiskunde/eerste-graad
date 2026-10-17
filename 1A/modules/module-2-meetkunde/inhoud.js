/* ============================================================
   HULPFUNCTIES
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const PREFIX = 'm2_meet_v1_';
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
  return html.replace(/\[\[(\d+)(?::(\w+))?\]\]/g, (m,i,sz)=>
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
  const row = el('div','q'); if(!QZ) CLvraag(id);
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
  row._q = q; row._B = B;
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
    s.checked = true; save(); CLres(id, !!r.ok, !!r.info);
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
  const row = el('div','q'); if(!QZ) CLvraag(id);
  row.append(el('div','q-text', (q.nr?`<span class="q-num">${q.nr}</span>`:'') + `<span class="stmt">${q.html}</span>`));
  if(q.fig) row.append(el('div','', q.fig));
  const wrap = el('div','choices');
  const btns = q.opts.map(([val,label])=>{ const b=el('button','opt'+(q.sym?' sym':''),label); b.type='button'; b.dataset.val=val; wrap.append(b); return b; });
  const fb = el('div','fb');
  row.append(wrap, fb); parent.append(row); row._qc = q;
  const quiz = QZ;
  function apply(val, doSave){
    if(quiz){ btns.forEach(b=>b.classList.toggle('chosen', b.dataset.val===val)); if(doSave){ st[id]=val; save(); } return; }
    const ok = val === q.ans;
    btns.forEach(b=>{ b.classList.remove('chosen','good','wrong'); if(b.dataset.val===val) b.classList.add('chosen', ok?'good':'wrong'); });
    fb.className = 'fb ' + (ok?'ok':'bad');
    fb.innerHTML = (ok ? '✅ Juist! ' : '❌ Niet juist. ') + (ok ? (q.why||'') : (q.whyBad||q.why||''));
    if(doSave){ st[id]=val; save(); CLres(id, ok); }
  }
  btns.forEach(b=> b.addEventListener('click', ()=>{ if(b.disabled) return; apply(b.dataset.val, true); }));
  if(st[id]) apply(st[id], false);
  if(quiz) quiz.push({ pts:q.pts||1, grade:()=>st[id]===q.ans,
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
  const quiz = QZ;
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
  const quiz = QZ; let qLocked = false;
  const btns = e.lines.map((ln,i)=>{
    const li = el('li'); const b = el('button','err-line', `<span class="ln">Stap ${i+1}</span><span>${ln}</span>`); b.type='button';
    li.append(b); ol.append(li);
    b.addEventListener('click', ()=>{
      if(quiz){ if(qLocked) return; s.pick=i; save(); btns.forEach((x,j)=>x.classList.toggle('picked', j===i)); return; }
      if(s.found) return;
      if(i===e.wrong){ s.found=true; save(); paint(); }
      else { const cons = (e.cons||[]).includes(i); if(!cons && !s.tried.includes(i)) s.tried.push(i); save(); paint(); fb.className='fb bad'; fb.textContent = !cons ? `❌ Stap ${i+1} klopt wel. Zoek verder.` : `❌ In stap ${i+1} loopt het mis, maar de fout begint vroeger. Zoek de eerste stap die fout is.`; }
    });
    return b;
  });
  row.append(ol, fb, fixBox);
  parent.append(row);
  function paint(){
    btns.forEach((b,i)=>{ b.classList.toggle('nope', s.tried.includes(i)); b.classList.toggle('found', s.found && i===e.wrong); });
    if(s.found){
      fb.className='fb ok'; fb.innerHTML = `✅ Juist, de fout zit in stap ${e.wrong+1}. ${e.why}`;
      if(fixBox.hidden){ fixBox.hidden=false; fixBox.append(el('div','sub','Verbeter deze stap:')); qBlock(fixBox, st, save, id+'_fix', {html:e.fix, check:e.fixCheck, sol:e.fixSol, mode:e.mode}); }
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
    scoreTop.innerHTML = html; scoreBottom.innerHTML = html; CLtoets(key, score, n);
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
   TEKENBLAD: potlood, gom, geodriehoek, passer, benoemen,
   boogjes, merktekens, zoom, ongedaan maken, geanimeerde werkwijze
   ============================================================ */
const GEO_HALF = 80;           /* halve tekenzijde (mm) */
const PROT_R = 50;             /* straal gradenboog (mm) */
const CMP_LEG = 80;            /* lengte passerbeen (mm) */
const GEO_MOVE_V = 22, GEO_ROT_V = 56;  /* plaats van de handvatten (afstand boven de tekenzijde) */
const TOOL_ICONS = {
  pencil:'<path d="M4 20l1.2-4.6L16.5 4.1a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z"/><path d="M14.5 6l3.5 3.5"/>',
  eraser:'<path d="M8.5 20h11"/><path d="M4.6 14.6l9-9a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8L12 19.8H8.8z"/><path d="M8.6 10.6l5.8 5.8"/>',
  label:'<path d="M4 18l4.5-12L13 18M5.6 14h5.8"/><path d="M15.5 12.5a2.5 2.5 0 1 1 0 5h0a2.5 2.5 0 0 1 0-5zM18 12v6"/>',
  arc:'<path d="M3.5 19.5h17M3.5 19.5L15 6"/><path d="M11.5 19.5a8 8 0 0 0-2.4-5.8"/>',
  tick:'<path d="M3 15l18-6"/><path d="M10 9l1.8 5.4M13.2 8l1.8 5.4"/>',
  geo:'<path d="M2.5 18h19L12 8.5z"/><path d="M8 18a4 4 0 0 1 8 0"/><path d="M12 18v-3"/>',
  compass:'<circle cx="12" cy="4.2" r="1.6"/><path d="M11 5.8L6 20M13 5.8l4.6 12.4"/><path d="M17.6 18.2l.7 2"/>',
  rotL:'<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
  rotR:'<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  zin:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8M8 10.5h5M10.5 8v5"/>',
  zout:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8M8 10.5h5"/>',
  trash:'<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  home:'<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M7 9.5h4M7 12.5h7"/>',
  lift:'<path d="M4 20l1-4L14.5 6.5l3 3L8 19z"/><path d="M3 22h9" stroke-dasharray="2 2"/><path d="M19 2v6M16.5 4.5L19 2l2.5 2.5"/>'
};
const CMP_HELP = '<b>Passer</b>: <span style="color:var(--accent-dark)">✥ blauw midden</span> = verplaatsen (de opening blijft) · <b>potloodbeen</b> slepen = open of dicht · <span style="color:#d4452b">⟳ kleine rode knop</span> = draaien zonder te tekenen · <span style="color:#7c5cd6">✎ paarse knop</span> bovenaan = draaien en een boog tekenen.';
const HANDLE_HELP = {
  cmpMove:'<span style="color:var(--accent-dark)">✥</span> <b>Midden van de passer</b>: sleep om de passer te verplaatsen. De opening blijft hetzelfde.',
  cmpPen:'<b>Potloodbeen</b>: sleep om de passer verder open of dicht te doen.',
  cmpRot:'<span style="color:#7c5cd6">✎</span> <b>Tekenknop</b> (paars, bovenaan): draai rond om een boog te tekenen.',
  cmpTurn:'<span style="color:#d4452b">⟳</span> <b>Draaiknop</b> (rood, klein): draai de passer zonder te tekenen.',
  geoMove:'<span style="color:var(--accent-dark)">✥</span> Sleep om je geodriehoek te verplaatsen. De tekenzijde klikt licht vast op punten.',
  geoRot:'<span style="color:#d4452b">⟳</span> Draai je geodriehoek. Ligt er een punt op de tekenzijde, dan draait hij rond dat punt.'
};
const tIcon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${TOOL_ICONS[k]}</svg>`;
const TOOL_HELP = {
  pencil:'<b>Potlood</b>: tik om een punt te zetten. Sleep langs een rand van je geodriehoek om een lijn te trekken.',
  eraser:'<b>Gom</b>: wrijf over wat je getekend hebt om het uit te gommen.',
  label:'<b>Benoem</b>: tik op een punt om het een naam te geven, of tik ergens om iets te noteren (bv. b, α of 72°).',
  arc:'<b>Boogje</b>: tik in een hoek, dicht bij het hoekpunt. Tik nog eens op het boogje voor het teken ∟ van een rechte hoek, nog eens om het weg te halen.',
  tick:'<b>Merkteken</b>: tik op een lijnstuk of op een boogje. Elke tik zet een streepje extra (tot 3), daarna verdwijnt het.'
};

/* ---------- markup van de geodriehoek (lokale coördinaten: tekenzijde op y=0, top naar boven) ---------- */
function geoMarkup(mode, ghost){
  const cons = mode==='constructie';
  let s = '';
  const body = ghost ? 'rgba(245,164,15,.10)' : 'rgba(150,205,225,.30)';
  const edge = ghost ? DEMO : '#4f8c9c';
  s += `<path d="M${-GEO_HALF} 0 L${GEO_HALF} 0 L0 ${-GEO_HALF} Z" fill="${body}" stroke="${edge}" stroke-width=".4" stroke-linejoin="round"/>`;
  /* gradenboog-band */
  s += `<path d="M${PROT_R} 0 A${PROT_R} ${PROT_R} 0 0 0 ${-PROT_R} 0 L${-(PROT_R-14)} 0 A${PROT_R-14} ${PROT_R-14} 0 0 1 ${PROT_R-14} 0 Z" fill="${ghost?'rgba(245,164,15,.08)':'rgba(255,205,70,.26)'}" stroke="none"/>`;
  /* evenwijdige lijnen en loodlijn */
  const glow = cons && !ghost;
  const lineCol = glow ? '#f5a40f' : (ghost? DEMO : '#3f7f90');
  const lw = glow ? .34 : .14;
  const fil = glow ? ' filter="url(#glow)"' : '';
  let par = '';
  for(let v=10; v<=70; v+=5){ const hw = GEO_HALF - v - 2; if(hw<3) continue; par += `<line x1="${-hw}" y1="${-v}" x2="${hw}" y2="${-v}" stroke="${lineCol}" stroke-width="${v%10?lw*.7:lw}" opacity="${glow?.85:.55}"/>`; }
  s += `<g${fil}>${par}<line x1="0" y1="-1.5" x2="0" y2="${-(GEO_HALF-4)}" stroke="${lineCol}" stroke-width="${glow?.5:.24}" opacity="${glow?1:.85}"/></g>`;
  /* lat op de tekenzijde */
  const tc = ghost ? DEMO : '#173c46';
  for(let u=-77; u<=77; u++){ const len = u%10===0 ? 4.2 : (u%5===0 ? 2.9 : 1.7); s += `<line x1="${u}" y1="0" x2="${u}" y2="${-len}" stroke="${tc}" stroke-width="${u%10===0?.22:.13}"/>`; }
  if(!cons) for(let k=-7;k<=7;k++){ s += `<text x="${k*10}" y="-6.6" font-size="2.7" text-anchor="middle" fill="${tc}" font-weight="600">${Math.abs(k)}</text>`; }
  /* graden */
  for(let d=0; d<=180; d++){ const len = d%10===0 ? 3.6 : (d%5===0 ? 2.5 : 1.4); const a = polar(P(0,0),PROT_R,d), b = polar(P(0,0),PROT_R-len,d);
    s += `<line x1="${f2(a.x)}" y1="${f2(a.y)}" x2="${f2(b.x)}" y2="${f2(b.y)}" stroke="${tc}" stroke-width="${d%10===0?.2:.11}"/>`; }
  if(!cons) for(let d=0; d<=180; d+=10){
    const dd = d===0 ? 2.6 : d===180 ? 177.4 : d;
    const a = polar(P(0,0),PROT_R-6,dd), b = polar(P(0,0),PROT_R-10.3,dd);
    s += `<text x="${f2(a.x)}" y="${f2(a.y)}" font-size="2.35" text-anchor="middle" dominant-baseline="middle" fill="${tc}" font-weight="700" transform="rotate(${90-dd} ${f2(a.x)} ${f2(a.y)})">${d}</text>`;
    s += `<text x="${f2(b.x)}" y="${f2(b.y)}" font-size="2" text-anchor="middle" dominant-baseline="middle" fill="${ghost?DEMO:'#b2452f'}" font-weight="600" transform="rotate(${90-dd} ${f2(b.x)} ${f2(b.y)})">${180-d}</text>`;
  }
  /* gradenschaal langs de schuine zijden (vanuit het nulpunt gemeten) */
  const legR = d => d<=90 ? GEO_HALF/(Math.cos(d*D2R)+Math.sin(d*D2R)) : GEO_HALF/(Math.sin(d*D2R)-Math.cos(d*D2R));
  for(let d=1; d<=179; d++){ if(d===90) continue;
    const r = legR(d); const e = polar(P(0,0), r, d); const inw = d<90 ? {x:-Math.SQRT1_2, y:Math.SQRT1_2} : {x:Math.SQRT1_2, y:Math.SQRT1_2};
    const len = d%10===0 ? 3.4 : (d%5===0 ? 2.4 : 1.3);
    s += `<line x1="${f2(e.x)}" y1="${f2(e.y)}" x2="${f2(e.x+inw.x*len)}" y2="${f2(e.y+inw.y*len)}" stroke="${tc}" stroke-width="${d%10===0?.2:.11}"/>`;
    if(!cons && d%10===0){
      const a = polar(P(0,0), r-5.2, d), b = polar(P(0,0), r-8.6, d);
      s += `<text x="${f2(a.x)}" y="${f2(a.y)}" font-size="2.35" text-anchor="middle" dominant-baseline="middle" fill="${tc}" font-weight="700" transform="rotate(${90-d} ${f2(a.x)} ${f2(a.y)})">${d}</text>`;
      s += `<text x="${f2(b.x)}" y="${f2(b.y)}" font-size="2" text-anchor="middle" dominant-baseline="middle" fill="${ghost?DEMO:'#b2452f'}" font-weight="600" transform="rotate(${90-d} ${f2(b.x)} ${f2(b.y)})">${180-d}</text>`;
    }
  }
  /* nulpunt */
  s += `<circle cx="0" cy="0" r=".9" fill="none" stroke="${tc}" stroke-width=".25"/>`;
  { /* ook in de filmpjes: blauw handvat en rode draaiknop */
    /* handvatten */
    s += `<g class="geo-move"><circle cx="0" cy="${-GEO_MOVE_V}" r="4.4" fill="#1fa6ab" opacity=".92"/><path d="M0 ${-GEO_MOVE_V-3.2}v6.4M-3.2 ${-GEO_MOVE_V}h6.4M0 ${-GEO_MOVE_V-3.2}l-1.1 1.1M0 ${-GEO_MOVE_V-3.2}l1.1 1.1M0 ${-GEO_MOVE_V+3.2}l-1.1-1.1M0 ${-GEO_MOVE_V+3.2}l1.1-1.1M-3.2 ${-GEO_MOVE_V}l1.1-1.1M-3.2 ${-GEO_MOVE_V}l1.1 1.1M3.2 ${-GEO_MOVE_V}l-1.1-1.1M3.2 ${-GEO_MOVE_V}l-1.1 1.1" stroke="#fff" stroke-width=".45" fill="none" stroke-linecap="round"/></g>`;
    s += `<g class="geo-rot"><circle cx="0" cy="${-GEO_ROT_V}" r="4.3" fill="#e0583f"/><path d="M-2.2 ${-GEO_ROT_V-1.6}a2.6 2.6 0 1 1 .2 3.4" stroke="#fff" stroke-width=".55" fill="none" stroke-linecap="round"/><path d="M-2.8 ${-GEO_ROT_V-3.2}l.5 1.8 1.7-.6" stroke="#fff" stroke-width=".5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  return s;
}
/* hulppunt aan de rand van de geodriehoek: je kan niet dóór de geodriehoek tekenen */
function geoEdgeT(th){ const c = Math.abs(Math.cos(th*D2R)), sn = Math.sin(th*D2R); return sn > .02 ? GEO_HALF/(c+sn) : GEO_HALF; }
function geoEdgePt(g, th, out=1.2){ const t = geoEdgeT(th)+out; return geoL2W(g, t*Math.cos(th*D2R), t*Math.sin(th*D2R)); }
function edgeHp(V, rot, wa){ const th = norm360(wa-rot); return (th>.5 && th<179.5) ? geoEdgePt({x:V.x, y:V.y, rot}, th) : polar(V, PROT_R+1.2, wa); }
function geoTransform(g){ return `translate(${f2(g.x)} ${f2(g.y)}) rotate(${f2(-g.rot)})`; }
function geoAxes(g){ return { eu:{x:Math.cos(g.rot*D2R), y:-Math.sin(g.rot*D2R)}, ev:{x:-Math.sin(g.rot*D2R), y:-Math.cos(g.rot*D2R)} }; }
function geoL2W(g,u,v){ const {eu,ev}=geoAxes(g); return {x:g.x+u*eu.x+v*ev.x, y:g.y+u*eu.y+v*ev.y}; }
function geoW2L(g,p){ const {eu,ev}=geoAxes(g); const dx=p.x-g.x, dy=p.y-g.y; return {u:dx*eu.x+dy*eu.y, v:dx*ev.x+dy*ev.y}; }
function geoEdges(g){
  const A = geoL2W(g,-GEO_HALF,0), Bp = geoL2W(g,GEO_HALF,0), C = geoL2W(g,0,GEO_HALF);
  return [{a:A,b:Bp,kind:'hyp'},{a:Bp,b:C,kind:'leg'},{a:C,b:A,kind:'leg'}];
}

/* ---------- markup van de passer ---------- */
function cmpGeom(c, p, side=1){
  const r = dist(c,p);
  const m = mid(c,p);
  let n = r>1e-6 ? {x:side*(p.y-c.y)/r, y:-side*(p.x-c.x)/r} : {x:0,y:-side};
  const h = Math.max(7, Math.sqrt(Math.max(0, CMP_LEG*CMP_LEG - (r/2)*(r/2))) * .45);
  const H = {x:m.x+n.x*h, y:m.y+n.y*h};
  const wp = (()=>{ const d=dist(p,H); return {x:(H.x-p.x)/d, y:(H.y-p.y)/d}; })();
  const wc = (()=>{ const d=dist(c,H); return {x:(H.x-c.x)/d, y:(H.y-c.y)/d}; })();
  const knob = {x:H.x+n.x*14, y:H.y+n.y*14}, turn = {x:H.x+n.x*7.6, y:H.y+n.y*7.6};
  const needleBadge = lerp(c, H, .5), penBadge = lerp(p, H, .5);
  /* richting loodrecht op het potloodbeen: daarlangs wijzen de pijltjes van de opening */
  const legDir = norm360(dirAng(p, H) + 90);
  return {r, H, n, wp, wc, knob, turn, needleBadge, penBadge, legDir, penTop:{x:p.x+wp.x*12, y:p.y+wp.y*12}, needleTop:{x:c.x+wc.x*4.2, y:c.y+wc.y*4.2}};
}
function cmpMarkup(c, p, ghost, active, side=1){
  const g = cmpGeom(c,p,side); const H = g.H;
  const metal = ghost ? 'rgba(245,164,15,.55)' : '#8f9aa2', dark = ghost ? DEMO : '#5d6870';
  const pw1 = {x:p.x+g.wp.x*2.4, y:p.y+g.wp.y*2.4};
  let s = '';
  s += `<line x1="${f2(H.x)}" y1="${f2(H.y)}" x2="${f2(g.needleTop.x)}" y2="${f2(g.needleTop.y)}" stroke="${metal}" stroke-width="2.1" stroke-linecap="round"/>`;
  s += `<line x1="${f2(g.needleTop.x)}" y1="${f2(g.needleTop.y)}" x2="${f2(c.x)}" y2="${f2(c.y)}" stroke="${dark}" stroke-width=".55" stroke-linecap="round"/>`;
  s += `<line x1="${f2(H.x)}" y1="${f2(H.y)}" x2="${f2(g.penTop.x)}" y2="${f2(g.penTop.y)}" stroke="${metal}" stroke-width="2.1" stroke-linecap="round"/>`;
  s += `<line x1="${f2(g.penTop.x)}" y1="${f2(g.penTop.y)}" x2="${f2(pw1.x)}" y2="${f2(pw1.y)}" stroke="${ghost?'rgba(245,164,15,.7)':'#f0b93a'}" stroke-width="1.9"/>`;
  s += `<polygon points="${f2(pw1.x+g.n.x*.9)},${f2(pw1.y+g.n.y*.9)} ${f2(pw1.x-g.n.x*.9)},${f2(pw1.y-g.n.y*.9)} ${f2(p.x)},${f2(p.y)}" fill="${ghost?DEMO:'#d9b38c'}"/>`;
  s += `<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r=".45" fill="${ghost?DEMO:'#2b2b2b'}"/>`;
  s += `<line x1="${f2(H.x)}" y1="${f2(H.y)}" x2="${f2(g.knob.x)}" y2="${f2(g.knob.y)}" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>`;
  if(ghost) s += `<circle cx="${f2(H.x)}" cy="${f2(H.y)}" r="2.6" fill="${dark}"/>`;
  s += `<circle cx="${f2(g.knob.x)}" cy="${f2(g.knob.y)}" r="${active?3.8:3.4}" fill="#7c5cd6" ${active?'stroke="#e3dcf3" stroke-width="1"':''}/>`;
  {
    /* tekenknop (paars): potloodje dat een boog trekt = draaien en tekenen */
    { const k = g.knob, u = {x:.707, y:-.707}, v = {x:.707, y:.707}, A = (d,e)=>`${f2(k.x+.3+u.x*d+v.x*e)},${f2(k.y-.3+u.y*d+v.y*e)}`;
      s += `<polygon points="${A(1.7,.55)} ${A(-.5,.55)} ${A(-1.45,0)} ${A(-.5,-.55)} ${A(1.7,-.55)}" fill="#fff"/><path d="${arcPath({x:k.x,y:k.y},2.3,200,250)}" stroke="#fff" stroke-width=".4" fill="none" stroke-linecap="round"/>`; }
    /* draaiknop (rood, kleiner): draaien zonder te tekenen */
    { const t = g.turn; s += `<circle cx="${f2(t.x)}" cy="${f2(t.y)}" r="2.35" fill="#e0583f" stroke="#fff" stroke-width=".4"/><path d="${arcPath(t,1.25,40,320)}" stroke="#fff" stroke-width=".42" fill="none"/><path d="M${f2(polar(t,1.25,40).x)} ${f2(polar(t,1.25,40).y)}l.65 .95" stroke="#fff" stroke-width=".42" fill="none" stroke-linecap="round"/>`; }
    /* scharnier (midden): verplaatsen (blauw, ✥) */
    const nb = H; s += `<circle cx="${f2(nb.x)}" cy="${f2(nb.y)}" r="3.6" fill="#1fa6ab" stroke="#fff" stroke-width=".45"/>`;
    s += `<path d="M${f2(nb.x)} ${f2(nb.y-2.1)}v4.2M${f2(nb.x-2.1)} ${f2(nb.y)}h4.2" stroke="#fff" stroke-width=".45" stroke-linecap="round"/><path d="M${f2(nb.x-.75)} ${f2(nb.y-1.35)}l.75-.75.75.75M${f2(nb.x-.75)} ${f2(nb.y+1.35)}l.75.75.75-.75M${f2(nb.x-1.35)} ${f2(nb.y-.75)}l-.75.75.75.75M${f2(nb.x+1.35)} ${f2(nb.y-.75)}l.75.75-.75.75" stroke="#fff" stroke-width=".4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return s;
}

/* beste plaats voor de geodriehoek: zo weinig mogelijk van de figuur bedekken, handvatten op het blad */
function bestGeoPose(W, H, objs){
  const samples = [];
  objs.forEach(o=>{
    if(o.t==='pt' && !o.hidden) samples.push({x:o.x,y:o.y,w:4});
    if(o.t==='seg'){ const a=P(o.x1,o.y1), b=P(o.x2,o.y2), L=dist(a,b); for(let k=0;k<=L;k+=4) samples.push({...lerp(a,b,L?k/L:0), w:1}); }
    if(o.t==='txt' || o.t==='lb') samples.push({x:o.x,y:o.y,w:2});
    if(o.t==='am') samples.push({x:o.vx,y:o.vy,w:2});
    if(o.t==='arc'){ for(let a=o.a0;a<=o.a1;a+=8) samples.push({...polar(P(o.cx,o.cy),o.r,a), w:1}); }
  });
  const tri = []; for(let v=0; v<=70; v+=10) for(let u=-(GEO_HALF-v); u<=GEO_HALF-v; u+=10) tri.push([u,v]);
  const inPaper = p => p.x>=2 && p.x<=W-2 && p.y>=2 && p.y<=H-2;
  let best = null;
  for(const rot of [0,180,90,270,45,135,225,315]){
    for(let x=0; x<=W; x+=10) for(let y=0; y<=H; y+=10){
      const g = {x,y,rot};
      const handles = [geoL2W(g,0,GEO_MOVE_V), geoL2W(g,0,GEO_ROT_V)];
      if(!inPaper(handles[0]) || !inPaper(handles[1])) continue;
      let cover = 0; samples.forEach(p=>{ const l = geoW2L(g,p); if(l.v>=-2 && l.v<=GEO_HALF-Math.abs(l.u)+2) cover += p.w; });
      let vis = 0; tri.forEach(([u,v])=>{ if(inPaper(geoL2W(g,u,v))) vis++; });
      const out = [geoL2W(g,-GEO_HALF,0), geoL2W(g,GEO_HALF,0), geoL2W(g,0,GEO_HALF)].filter(p=>!inPaper(p)).length;
      const score = cover*15 - vis + out*400 + ({0:0, 180:12, 90:8, 270:8}[rot] ?? 10);
      if(!best || score < best.score) best = {score, g};
    }
  }
  return best ? best.g : {x:W/2, y:H-6, rot:0};
}
/* ============================================================ */
function makeBoard(host, sst, save, id, cfg){
  const W = cfg.w || 200, H = cfg.h || 120;
  const tools = cfg.tools || ['pencil','eraser','label','arc','tick','geo','compass'];
  const geoMode = (cfg.geo && cfg.geo.mode) || 'meet';
  const given = cfg.given || [];
  const S = sst.bd || (sst.bd = {
    u: (cfg.user||[]).map(o=>({...o})),
    geo: Object.assign({on: tools.includes('geo') && (!cfg.geo || cfg.geo.on!==false)}, (cfg.geo && cfg.geo.pose) || (tools.includes('geo') ? bestGeoPose(W,H,(cfg.given||[]).concat(cfg.user||[])) : {x:W/2,y:H-6,rot:0})),
    cmp: Object.assign({cx:W*0.78, cy:H*0.45, px:W*0.78+30, py:H*0.45, on: !!(cfg.compass && cfg.compass.on)}, (cfg.compass && cfg.compass.pose)||{}),
    tool: ['pencil','label','arc','tick','eraser'].find(t=>tools.includes(t)) || 'none', z:1, vx:0, vy:0
  });
  if(!tools.includes(S.tool)) S.tool = ['pencil','label','arc','tick','eraser'].find(t=>tools.includes(t)) || 'none';
  let locked = false, demoOn = false, demoTok = 0;
  const undoSt = [], redoSt = [];

  /* ---------- DOM ---------- */
  const wrap = el('div','board'); wrap.tabIndex = 0; wrap.setAttribute('aria-label','tekenblad');
  const tb = el('div','tb'); wrap.append(tb);
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','paper'); svg.setAttribute('role','img'); svg.setAttribute('aria-label','tekenblad');
  svg.style.aspectRatio = `${W} / ${H}`;
  svg.innerHTML = `<defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".55" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <rect class="bg" x="${-3*W}" y="${-3*H}" width="${7*W}" height="${7*H}" fill="#fffefa"/>
    <g class="L-given"></g><g class="L-user"></g><g class="L-demo"></g><g class="L-prev"></g><g class="L-geo"></g><g class="L-ggeo"></g><g class="L-cmp"></g><g class="L-gcmp"></g><g class="L-top"></g>`;
  wrap.append(svg);
  const status = el('div','bstatus',''); wrap.append(status);
  const cap = el('div','demo-cap',''); wrap.append(cap);
  host.append(wrap);
  const Lg = svg.querySelector('.L-given'), Lu = svg.querySelector('.L-user'), Ld = svg.querySelector('.L-demo'), Lp = svg.querySelector('.L-prev'),
        Lgeo = svg.querySelector('.L-geo'), Lggeo = svg.querySelector('.L-ggeo'), Lc = svg.querySelector('.L-cmp'), Lgc = svg.querySelector('.L-gcmp'), Ltop = svg.querySelector('.L-top');
  Lgeo.innerHTML = geoMarkup(geoMode,false);

  /* toolbar */
  const tbtn = (key, label, title, cls='') => { const b = el('button','tbtn '+cls, tIcon(key) + (label?`<span class="t">${label}</span>`:'')); b.type='button'; b.title = title||label; b.setAttribute('aria-label', title||label); tb.append(b); return b; };
  const toolBtns = {};
  [['pencil','Potlood'],['eraser','Gom'],['label','Benoem'],['arc','Boogje'],['tick','Merkteken']].forEach(([k,l])=>{ if(tools.includes(k)){ toolBtns[k] = tbtn(k,l); toolBtns[k].addEventListener('click',()=>setTool(k)); } });
  if(tools.includes('geo') || tools.includes('compass')) tb.append(el('span','gap'));
  let geoBtn=null, cmpBtn=null, rotL=null, rotR=null;
  if(tools.includes('geo')){ geoBtn = tbtn('geo','Geodriehoek','Geodriehoek nemen of opbergen'); geoBtn.addEventListener('click',()=>{ S.geo.on=!S.geo.on; if(S.geo.on) bringIntoView('geo'); save(); paintTools(); });
    rotL = tbtn('rotL','','Draai je geodriehoek 1° naar links (toets Q)','icon-only'); rotR = tbtn('rotR','','Draai je geodriehoek 1° naar rechts (toets E)','icon-only');
    rotL.addEventListener('click',e=>rotateGeo(e.shiftKey?.2:1)); rotR.addEventListener('click',e=>rotateGeo(e.shiftKey?-.2:-1)); }
  if(tools.includes('compass')){ cmpBtn = tbtn('compass','Passer','Passer nemen of opbergen'); cmpBtn.addEventListener('click',()=>{ S.cmp.on=!S.cmp.on; if(S.cmp.on){ bringIntoView('cmp'); setStatus(CMP_HELP); } save(); paintTools(); }); }
  tb.append(el('span','gap'));
  const bUndo = tbtn('undo','','Ongedaan maken (Ctrl+Z)','icon-only'), bRedo = tbtn('redo','','Opnieuw doen (Ctrl+Y)','icon-only');
  bUndo.addEventListener('click',undo); bRedo.addEventListener('click',redo);
  const bZin = tbtn('zin','','Inzoomen','icon-only'), bZout = tbtn('zout','','Uitzoomen','icon-only'), bHome = tbtn('home','','Toon het hele blad (met geodriehoek en passer)','icon-only');
  bHome.addEventListener('click', homeView);
  bZin.addEventListener('click',()=>zoomBy(1,null)); bZout.addEventListener('click',()=>zoomBy(-1,null));
  const bClear = tbtn('trash','','Wis alles wat je tekende','icon-only'); bClear.addEventListener('click',()=>{ if(!userObjs().length) return; pushUndo(); S.u = S.u.filter(o=>o.fixed); changed(); setStatus('Alles gewist. Klik op ↶ om het terug te halen.'); });

  function setTool(k){ S.tool = k; save(); paintTools(); setStatus(TOOL_HELP[k]||''); }
  function paintTools(){
    Object.entries(toolBtns).forEach(([k,b])=>b.setAttribute('aria-pressed', String(S.tool===k)));
    if(geoBtn){ geoBtn.setAttribute('aria-pressed', String(!!S.geo.on)); rotL.disabled = rotR.disabled = !S.geo.on; }
    if(cmpBtn) cmpBtn.setAttribute('aria-pressed', String(!!S.cmp.on));
    svg.classList.toggle('t-eraser', S.tool==='eraser'); svg.classList.toggle('t-label', S.tool==='label');
    bUndo.disabled = !undoSt.length; bRedo.disabled = !redoSt.length;
    bZin.disabled = S.z>=4; bZout.disabled = S.z<=ZL[0];
    paintGeo(); paintCmp();
  }
  function setStatus(h){ status.innerHTML = h; }

  /* ---------- weergave / zoom ---------- */
  const ZL = [.5,.65,.8,1,1.5,2,3,4];
  function applyView(){
    const vw = W/S.z, vh = H/S.z;
    S.vx = clamp(S.vx, -W*.8, W*1.8-vw); S.vy = clamp(S.vy, -H*.8, H*1.8-vh);
    svg.setAttribute('viewBox', `${f2(S.vx)} ${f2(S.vy)} ${f2(vw)} ${f2(vh)}`);
  }
  function zoomBy(dir, at){
    const i = ZL.indexOf(S.z); const ni = clamp((i<0?0:i)+dir, 0, ZL.length-1); if(ZL[ni]===S.z) return;
    const vw = W/S.z, vh = H/S.z; const c = at || {x:S.vx+vw/2, y:S.vy+vh/2};
    const fx = (c.x-S.vx)/vw, fy = (c.y-S.vy)/vh;
    S.z = ZL[ni]; const nw = W/S.z, nh = H/S.z; S.vx = c.x - fx*nw; S.vy = c.y - fy*nh;
    applyView(); save(); paintTools();
  }
  function homeView(){
    const pts = [{x:0,y:0},{x:W,y:H}];
    if(S.geo.on) pts.push(...geoFrame());
    if(S.cmp.on) pts.push(...cmpFrame());
    const m = 4, xs = pts.map(q=>q.x), ys = pts.map(q=>q.y);
    const x0 = Math.min(...xs)-m, x1 = Math.max(...xs)+m, y0 = Math.min(...ys)-m, y1 = Math.max(...ys)+m;
    const needW = x1-x0, needH = y1-y0;
    let z = 1; if(needW > W+2*m || needH > H+2*m){ z = ZL.filter(v=>v<=1).reverse().find(v=> W/v >= needW && H/v >= needH) || ZL[0]; }
    panAnim++; S.z = z;
    const vw = W/z, vh = H/z;
    if(z===1){ S.vx = 0; S.vy = 0; } else { S.vx = (x0+x1)/2 - vw/2; S.vy = (y0+y1)/2 - vh/2; }
    applyView(); save(); paintTools();
    setStatus(z===1 ? 'Je ziet weer het hele blad.' : 'Je ziet het hele blad, met je geodriehoek en passer volledig in beeld.');
  }
  let panAnim = 0;
  function panTo(tx, ty, ms=380){
    const id = ++panAnim; const x0 = S.vx, y0 = S.vy; const t0 = performance.now();
    const step = now=>{ if(id!==panAnim) return; const t = Math.min(1,(now-t0)/ms); const e = t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
      S.vx = x0+(tx-x0)*e; S.vy = y0+(ty-y0)*e; applyView(); if(t<1) requestAnimationFrame(step); else { save(); paintCmp(); } };
    requestAnimationFrame(step);
  }
  /* zorg dat een kader (bv. de geodriehoek) volledig in beeld is: schuif het blad mee */
  function ensureVisible(pts, m=3){
    const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y); const x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
    const vw = W/S.z, vh = H/S.z; let tx = S.vx, ty = S.vy;
    if(x1-x0 <= vw-2*m){ if(x0 < tx+m) tx = x0-m; else if(x1 > tx+vw-m) tx = x1-vw+m; }
    if(y1-y0 <= vh-2*m){ if(y0 < ty+m) ty = y0-m; else if(y1 > ty+vh-m) ty = y1-vh+m; }
    tx = clamp(tx, -W*.8, W*1.8-vw); ty = clamp(ty, -H*.8, H*1.8-vh);
    if(Math.abs(tx-S.vx)>.05 || Math.abs(ty-S.vy)>.05) panTo(tx, ty);
  }
  const geoFrame = () => [geoL2W(S.geo,-GEO_HALF,0), geoL2W(S.geo,GEO_HALF,0), geoL2W(S.geo,0,GEO_HALF)];
  const cmpFrame = () => { const c = P(S.cmp.cx,S.cmp.cy), p = P(S.cmp.px,S.cmp.py); const g = cmpGeom(c,p,S.cmp.side||1); return [c, p, g.H, polar(g.knob,4,0), polar(g.knob,4,180), polar(g.knob,4,90), polar(g.knob,4,270)]; };
  function keepToolsVisible(which){ if(which!=='cmp' && S.geo.on) ensureVisible(geoFrame()); if(which!=='geo' && S.cmp.on) setTimeout(()=>ensureVisible(cmpFrame()), which==='cmp'?0:420); }
  function pxmm(){ const w = svg.getBoundingClientRect().width || 800; return w / (W/S.z); }
  const mmOfPx = px => px / pxmm();
  function toW(e){ const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const m = svg.getScreenCTM(); if(!m) return {x:0,y:0}; const r = pt.matrixTransform(m.inverse()); return {x:r.x, y:r.y}; }
  function toScreen(p){ const pt = svg.createSVGPoint(); pt.x=p.x; pt.y=p.y; const m = svg.getScreenCTM(); const r = pt.matrixTransform(m); const wr = wrap.getBoundingClientRect(); return {x:r.x-wr.left, y:r.y-wr.top}; }
  function bringIntoView(which){
    const vw=W/S.z, vh=H/S.z, cx=S.vx+vw/2, cy=S.vy+vh/2;
    if(which==='geo'){ Object.assign(S.geo, bestGeoPose(W,H,given.concat(S.u))); if(S.z>1){ S.z=1; applyView(); } panTo(0,0); }
    if(which==='cmp'){ if(S.cmp.cx<S.vx||S.cmp.cx>S.vx+vw||S.cmp.cy<S.vy||S.cmp.cy>S.vy+vh){ S.cmp.cx=cx; S.cmp.cy=cy; S.cmp.px=cx+30; S.cmp.py=cy; } }
  }

  /* ---------- objecten ---------- */
  const userObjs = () => S.u;
  function strokesAll(){ const L=[]; given.forEach(o=>{ if(o.t==='seg' && !o.noSnap) L.push({a:P(o.x1,o.y1), b:P(o.x2,o.y2), g:true}); }); S.u.forEach(o=>{ if(o.t==='seg') L.push({a:P(o.x1,o.y1), b:P(o.x2,o.y2), g:false, o}); }); return L; }
  function arcsAll(){ const L=[]; given.concat(S.u).forEach(o=>{ if(o.t==='arc') L.push(o); }); return L; }
  function ptsAll(){ const L=[]; given.forEach(o=>{ if(o.t==='pt' && !o.hidden) L.push({x:o.x,y:o.y,name:o.name,g:true}); }); S.u.forEach(o=>{ if(o.t==='pt') L.push({x:o.x,y:o.y,name:o.name,g:false,o}); }); return L; }
  let snapCache = null;
  function snapPts(){
    if(snapCache) return snapCache;
    const L = ptsAll().map(p=>({x:p.x,y:p.y,k:'pt'}));
    const st = strokesAll(), ar = arcsAll();
    st.forEach(s=>{ L.push({x:s.a.x,y:s.a.y,k:'end'}, {x:s.b.x,y:s.b.y,k:'end'}); });
    for(let i=0;i<st.length;i++) for(let j=i+1;j<st.length;j++){ const X = lineInter(st[i].a,st[i].b,st[j].a,st[j].b); if(X && X.t>-.004 && X.t<1.004 && X.u>-.004 && X.u<1.004) L.push({x:X.x,y:X.y,k:'x'}); }
    st.forEach(s=>ar.forEach(a=>lineCircle(s.a,s.b,P(a.cx,a.cy),a.r).forEach(X=>{ if(X.t>-.004&&X.t<1.004 && inArc(a, dirAng(P(a.cx,a.cy),X))) L.push({x:X.x,y:X.y,k:'x'}); })));
    for(let i=0;i<ar.length;i++) for(let j=i+1;j<ar.length;j++) circleCircle(P(ar[i].cx,ar[i].cy),ar[i].r,P(ar[j].cx,ar[j].cy),ar[j].r).forEach(X=>{ if(inArc(ar[i],dirAng(P(ar[i].cx,ar[i].cy),X)) && inArc(ar[j],dirAng(P(ar[j].cx,ar[j].cy),X))) L.push({x:X.x,y:X.y,k:'x'}); });
    return snapCache = L;
  }
  function nearestSnap(p, rad, filter){ let best=null, bd=rad; snapPts().forEach(q=>{ if(filter && !filter(q)) return; const d=dist(p,q); if(d<=bd){ bd=d; best=q; } }); return best; }
  const snapR = () => clamp(mmOfPx(9), 1.0, 3);

  /* ---------- tekenen ---------- */
  function paintGiven(){ Lg.innerHTML = given.map(o=>objSVG(o)).join(''); }
  function paintUser(){ Lu.innerHTML = S.u.map(o=>objSVG(o,{user:true})).join(''); }
  function paintGeo(){
    Lgeo.style.display = (S.geo.on && !demoOn) ? '' : 'none';
    Lgeo.setAttribute('transform', geoTransform(S.geo));
  }
  function cmpSide(){
    if(drag && drag.mode==='cmpRot') return S.cmp.side||1;
    const c = P(S.cmp.cx,S.cmp.cy), p = P(S.cmp.px,S.cmp.py);
    const inV = q => q.x>=S.vx+3 && q.x<=S.vx+W/S.z-3 && q.y>=S.vy+3 && q.y<=S.vy+H/S.z-3;
    const cur = S.cmp.side||1;
    if(inV(cmpGeom(c,p,cur).knob)) return cur;
    if(inV(cmpGeom(c,p,-cur).knob)) return -cur;
    return cur;
  }
  function paintCmp(active){
    if(!S.cmp.on || demoOn){ Lc.innerHTML=''; return; }
    S.cmp.side = cmpSide();
    Lc.innerHTML = cmpMarkup(P(S.cmp.cx,S.cmp.cy), P(S.cmp.px,S.cmp.py), false, active, S.cmp.side);
  }
  function changed(){ snapCache = null; paintUser(); save(); paintTools(); if(cfg.onChange) cfg.onChange(); }
  function pushUndo(){ undoSt.push(JSON.stringify(S.u)); if(undoSt.length>60) undoSt.shift(); redoSt.length = 0; }
  function undo(){ if(!undoSt.length || locked) return; redoSt.push(JSON.stringify(S.u)); S.u = JSON.parse(undoSt.pop()); changed(); }
  function redo(){ if(!redoSt.length || locked) return; undoSt.push(JSON.stringify(S.u)); S.u = JSON.parse(redoSt.pop()); changed(); }
  function prev(html){ Lp.innerHTML = html||''; }
  const ring = (p, col='#f5a40f') => `<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${f2(clamp(mmOfPx(7),1.2,3))}" fill="none" stroke="${col}" stroke-width="${f2(clamp(mmOfPx(1.6),.2,.6))}"/>`;

  /* ---------- geodriehoek: hit-test en snappen ---------- */
  function geoHit(p){
    if(!S.geo.on) return null;
    const l = geoW2L(S.geo, p);
    const tol = clamp(mmOfPx(13), 3.2, 6);
    if(Math.hypot(l.u, l.v-GEO_ROT_V) <= Math.min(tol,5.5)) return {mode:'geoRot'};
    if(Math.hypot(l.u, l.v-GEO_MOVE_V) <= Math.min(Math.max(4.6, tol*.9),5.5)) return {mode:'geoMove'};
    return null;
  }
  function inGeo(p){ if(!S.geo.on) return false; const l = geoW2L(S.geo,p); return l.v >= -0.5 && l.v <= GEO_HALF - Math.abs(l.u) + 0.5; }
  function edgeHit(p){
    if(!S.geo.on) return null;
    const tol = clamp(mmOfPx(10), 1.6, 3.2);
    let best = null, bd = tol;
    geoEdges(S.geo).forEach(E=>{ const t = projT(p,E.a,E.b); if(t<-.01 || t>1.01) return; const d = lineDist(p,E.a,E.b); if(d<bd){ bd=d; best=E; } });
    return best;
  }
  function snapOnEdge(E, p, tap){
    const L = dist(E.a,E.b); let t = clamp(projT(p,E.a,E.b),0,1)*L;
    let best=null, bd = snapR();
    snapPts().forEach(q=>{ if(lineDist(q,E.a,E.b) > 1.0) return; const tq = projT(q,E.a,E.b)*L; if(tq<-.5||tq>L+.5) return; const d = Math.abs(tq-t); if(d<bd){ bd=d; best=tq; } });
    if(best!=null) t = best;
    else if(E.kind==='hyp'){ const u = t - GEO_HALF; const ru = Math.round(u); if(Math.abs(u-ru) <= .38) t = ru + GEO_HALF; }
    else if(tap && E.kind==='leg'){ const q = lerp(E.a,E.b,clamp(t,0,L)/L); const l = geoW2L(S.geo,q); const d = Math.round(Math.atan2(l.v,l.u)/D2R);
      const r = d<=90 ? GEO_HALF/(Math.cos(d*D2R)+Math.sin(d*D2R)) : GEO_HALF/(Math.sin(d*D2R)-Math.cos(d*D2R)); return geoL2W(S.geo, r*Math.cos(d*D2R), r*Math.sin(d*D2R)); }
    return lerp(E.a,E.b,clamp(t,0,L)/L);
  }
  /* draaipunt: een punt dat op de tekenzijde ligt (zoals je potlood erop houdt), anders het nulpunt */
  function geoPivot(){
    let best = null;
    ptsAll().forEach(q=>{ const l = geoW2L(S.geo, q); if(Math.abs(l.v) <= .7 && Math.abs(l.u) <= 78){ if(!best || Math.abs(l.u) < Math.abs(best.u)) best = {p:{x:q.x,y:q.y}, u:l.u, v:0, pt:true}; } });
    return best || {p:{x:S.geo.x, y:S.geo.y}, u:0, v:0, pt:false};
  }
  function geoRotSnap(rot, piv){
    const O = piv ? piv.p : {x:S.geo.x, y:S.geo.y}; const cand = [];
    strokesAll().forEach(s=>{ const d = dirAng(s.a,s.b); cand.push(d, d+90, d+180, d+270); });
    snapPts().forEach(q=>{ if(dist(O,q)<6) return; const th = dirAng(O,q); cand.push(th, th+180); if(!piv || !piv.pt) cand.push(th-90); });
    let best = rot, bd = piv && piv.pt ? 1.3 : .8;
    cand.forEach(c=>{ const d = adiff(c, rot); if(d<bd){ bd=d; best = norm360(c); } });
    return best;
  }
  function geoPosSnap(O){
    const q = nearestSnap(O, snapR());
    if(q) return {x:q.x, y:q.y, snapped:true};
    /* lichte magneet: ligt een punt bijna op de tekenzijde, dan klikt de tekenzijde erop */
    { const ax = geoAxes(S.geo); let bv = null, bd = clamp(mmOfPx(6),.7,1.4);
      ptsAll().forEach(pt=>{ const dx = pt.x-O.x, dy = pt.y-O.y; const u = dx*ax.eu.x+dy*ax.eu.y, v = dx*ax.ev.x+dy*ax.ev.y; if(Math.abs(u) > 78) return; if(Math.abs(v) < bd){ bd = Math.abs(v); bv = {v, pt}; } });
      if(bv) return {x:O.x+bv.v*ax.ev.x, y:O.y+bv.v*ax.ev.y, edgePt:bv.pt}; }
    let best=null, bd = clamp(mmOfPx(5),.6,1.2);
    strokesAll().forEach(s=>{ const t = projT(O,s.a,s.b); if(t<0||t>1) return; const d = lineDist(O,s.a,s.b); if(d<bd){ bd=d; best=projP(O,s.a,s.b); } });
    return best ? {...best, snapped:true} : O;
  }
  function rotateGeo(d){ if(locked||!S.geo.on) return; S.geo.rot = norm360(S.geo.rot + d); save(); paintGeo(); clearTimeout(rotateGeo.t); rotateGeo.t = setTimeout(()=>keepToolsVisible('geo'), 350); }

  /* ---------- passer ---------- */
  function cmpHit(p){
    if(!S.cmp.on) return null;
    const c = P(S.cmp.cx,S.cmp.cy), pe = P(S.cmp.px,S.cmp.py); const g = cmpGeom(c,pe,S.cmp.side||1);
    const tol = clamp(mmOfPx(12), 2.6, 5);
    const dk = dist(p,g.knob), dt = dist(p,g.turn), dh = dist(p,g.H);
    if(dt <= Math.max(2.4, tol*.7) && dt <= dk && dt <= dh) return {mode:'cmpRot', lift:true};
    if(dk <= tol && dk <= dh) return {mode:'cmpRot'};
    if(dh <= Math.max(3.6, tol*.85)) return {mode:'cmpMove'};
    const dPen = segDist(p, pe, g.H), dNeedle = segDist(p, c, g.H);
    if(dPen <= Math.max(1.8, tol*.6) && dPen <= dNeedle) return {mode:'cmpPen'};
    if(dNeedle <= Math.max(1.8, tol*.6)) return {mode:'cmpMove'};
    return null;
  }
  function cmpSnap(p){
    const q = nearestSnap(p, snapR());
    if(q) return {x:q.x,y:q.y,snapped:true};
    if(S.geo.on){ const l = geoW2L(S.geo,p); if(Math.abs(l.v) <= 1.3 && Math.abs(l.u) <= 78){ const ru = Math.round(l.u); if(Math.abs(l.u-ru)<=.45){ const w = geoL2W(S.geo, ru, 0); return {x:w.x,y:w.y,snapped:true}; } } }
    return p;
  }

  /* ---------- acties van de gereedschappen ---------- */
  function addPoint(p){
    const R = snapR();
    const ex = ptsAll().find(q=>dist(q,p) <= R*0.9);
    if(ex){ setStatus(ex.name ? `Hier staat al een punt ${ex.name}.` : 'Hier staat al een punt. Gebruik <b>Benoem</b> om het een naam te geven.'); return; }
    let q = nearestSnap(p, R, s=>s.k!=='pt');
    let np = q ? {x:q.x,y:q.y} : null;
    if(!np && S.geo.on){
      const l = geoW2L(S.geo,p); const rho = Math.hypot(l.u,l.v);
      const thr = Math.atan2(Math.max(l.v,0), l.u)/D2R, te = geoEdgeT(thr);
      if(l.v > -1 && ((rho >= PROT_R-3 && rho <= PROT_R+4) || (rho >= te-2.5 && rho <= te+4))){ const th = Math.round(thr); np = geoEdgePt(S.geo, th); }
      else if(Math.abs(l.v) <= 1.6 && Math.abs(l.u) <= 78){ const ru = Math.round(l.u); const u = Math.abs(l.u-ru)<=.38 ? ru : l.u; np = geoL2W(S.geo,u,0); }
    }
    if(!np){ let bd = clamp(mmOfPx(5),.6,1.2); strokesAll().forEach(s=>{ const t=projT(p,s.a,s.b); if(t<0||t>1) return; const d=lineDist(p,s.a,s.b); if(d<bd){ bd=d; np=projP(p,s.a,s.b); } });
      if(!np) arcsAll().forEach(a=>{ const c=P(a.cx,a.cy); const d=Math.abs(dist(p,c)-a.r); if(d<bd && inArc(a,dirAng(c,p))){ bd=d; np=polar(c,a.r,dirAng(c,p)); } }); }
    np = np || p;
    pushUndo(); const npt = {t:'pt', x:np.x, y:np.y, name:''}; S.u.push(npt); changed();
    if(canName) namePop(npt, '', {ph:'bv. A', what:'punt'}, v=>{ npt.name = v; });
    else setStatus('Punt gezet.');
  }
  function eraseAt(p){
    const R = clamp(mmOfPx(8), 1.4, 3.2); const before = S.u.length;
    S.u = S.u.filter(o=>{
      if(o.fixedGiven) return true;
      switch(o.t){
        case 'pt': return dist(p,o) > R;
        case 'seg': return segDist(p,P(o.x1,o.y1),P(o.x2,o.y2)) > R;
        case 'arc': { const c=P(o.cx,o.cy); return !(Math.abs(dist(p,c)-o.r)<=R && inArc(o, dirAng(c,p))); }
        case 'am': { const c=P(o.vx,o.vy); return !((Math.abs(dist(p,c)-o.r)<=R || dist(p,c)<=o.r) && inArc(o, dirAng(c,p))); }
        case 'tk': return dist(p,o) > R+1;
        case 'lb': return dist(p,o) > R+2;
      }
      return true;
    });
    return S.u.length !== before;
  }
  function angleSectorAt(p){
    const cands = snapPts().filter(q=>dist(q,p)<=32);
    const st = strokesAll();
    let best = null;
    cands.forEach(V=>{
      const dirs = [];
      st.forEach(s=>{ if(segDist(V,s.a,s.b) > .6) return; [s.a,s.b].forEach(e=>{ if(dist(V,e) >= 2.5){ const d = dirAng(V,e); if(!dirs.some(x=>adiff(x,d)<1)) dirs.push(d); } }); });
      if(!dirs.length) return;
      const score = dist(V,p) + (dirs.length>=2 ? 0 : 40);
      if(!best || score < best.score) best = {V, dirs, score};
    });
    if(!best) return null;
    const V = best.V, c = dirAng(V,p); const ds = best.dirs.slice().sort((a,b)=>a-b);
    if(ds.length===1) return {V, a0:ds[0], a1:ds[0]+360};
    let a0 = ds[ds.length-1], a1 = ds[0]+360;
    for(let i=0;i<ds.length-1;i++){ if(c>=ds[i] && c<ds[i+1]){ a0=ds[i]; a1=ds[i+1]; } }
    if(c < ds[0]){ a0 = ds[ds.length-1]-360; a1 = ds[0]; }
    if(a0<0){ a0+=360; a1+=360; }
    return {V, a0, a1};
  }
  function arcAt(p){
    const ex = S.u.find(o=>o.t==='am' && dist(p,P(o.vx,o.vy)) <= o.r+4 && inArc(o, dirAng(P(o.vx,o.vy),p)));
    if(ex){ pushUndo(); const recht = Math.abs((ex.a1-ex.a0)-90) <= 2;
      if(ex.style!=='right' && recht){ ex.style='right'; setStatus('Teken voor een rechte hoek (∟). Tik nog eens om het weg te halen.'); }
      else { S.u.splice(S.u.indexOf(ex),1); if(ex.style!=='right' && !recht) setStatus('Boogje weggehaald. (Het teken ∟ gebruik je enkel bij een rechte hoek.)'); }
      changed(); return; }
    const sec = angleSectorAt(p);
    if(!sec){ setStatus('Tik in een hoek, dicht bij het hoekpunt. Er moeten twee benen zijn.'); return; }
    const r = clamp(dist(p,sec.V), 4, 14);
    pushUndo(); const nam = {t:'am', vx:sec.V.x, vy:sec.V.y, a0:sec.a0, a1:sec.a1, r, style:'arc', n:0}; S.u.push(nam); changed();
    setStatus(Math.abs((sec.a1-sec.a0)-90)<=2 ? 'Boogje gezet. Is het een rechte hoek? Tik er nog eens op voor het teken ∟.' : 'Boogje gezet. Tik er nog eens op om het weg te halen.');
    if(canName){ const ma = (sec.a0+sec.a1)/2; const lp = polar(sec.V, r + ((sec.a1-sec.a0)<40 ? 6.5 : 4.5), ma); namePop(lp, '', {ph:'bv. α of 40°', what:'hoek', greek:true}, v=>{ S.u.push({t:'lb', x:lp.x, y:lp.y, s:v}); }); }
  }
  function tickAt(p){
    const am = S.u.find(o=>o.t==='am' && Math.abs(dist(p,P(o.vx,o.vy))-o.r) <= 2.2 && inArc(o, dirAng(P(o.vx,o.vy),p)));
    if(am){ pushUndo(); am.n = ((am.n||0)+1)%4; changed(); return; }
    const st = strokesAll(); let bs=null, bd = clamp(mmOfPx(8),1.2,2.5);
    st.forEach(s=>{ const d = segDist(p,s.a,s.b); if(d<bd){ bd=d; bs=s; } });
    if(!bs){ setStatus('Tik op een lijnstuk of op een boogje om een merkteken te zetten.'); return; }
    const L = dist(bs.a,bs.b); const ts = [0, L];
    ptsAll().forEach(q=>{ if(lineDist(q,bs.a,bs.b)<=.6){ const t=projT(q,bs.a,bs.b)*L; if(t>.5 && t<L-.5) ts.push(t); } });
    st.forEach(s2=>{ if(s2===bs) return; const X=lineInter(bs.a,bs.b,s2.a,s2.b); if(X && X.t>0.01 && X.t<.99 && X.u>-.01 && X.u<1.01) ts.push(X.t*L); });
    ts.sort((a,b)=>a-b); const tp = clamp(projT(p,bs.a,bs.b),0,1)*L;
    let lo=0, hi=L; for(let i=0;i<ts.length-1;i++) if(tp>=ts[i] && tp<=ts[i+1]){ lo=ts[i]; hi=ts[i+1]; }
    const m = lerp(bs.a,bs.b,(lo+hi)/2/L);
    const ex = S.u.find(o=>o.t==='tk' && dist(o,m) <= 1.5);
    pushUndo();
    if(ex){ ex.n = (ex.n+1)%4; if(!ex.n) S.u.splice(S.u.indexOf(ex),1); }
    else S.u.push({t:'tk', x:m.x, y:m.y, dir:dirAng(bs.a,bs.b), n:1});
    changed();
  }
  /* benoemen: klein invulvenster (verschijnt ook vanzelf na een punt, lijn of boogje) */
  const canName = tools.includes('label');
  let pop = null;
  function closePop(commit=true){ if(!pop) return; const pp = pop; pop = null; if(commit && pp._commit) pp._commit(); pp.remove(); }
  function namePop(anchor, init, o, onApply){
    closePop();
    if(locked || demoOn) return;
    const sp = toScreen(anchor);
    const box = el('div','lbl-pop'); pop = box;
    const lab = el('span','lbl-what', o.what ? `Naam ${o.what==='hoek'?'van de hoek':o.what==='lijn'?'van de lijn':'van het punt'}:` : 'Tekst:'); box.append(lab);
    const inp = el('input'); inp.type='text'; inp.maxLength = 8; inp.placeholder = o.ph||''; inp.value = init||''; inp.setAttribute('aria-label', lab.textContent);
    box.append(inp);
    if(o.greek) ['α','β','γ','δ','ε','°'].forEach(ch=>{ const b=el('button','',ch); b.type='button'; b.addEventListener('pointerdown',e=>e.preventDefault()); b.addEventListener('click',()=>{ inp.setRangeText(ch, inp.selectionStart, inp.selectionEnd, 'end'); inp.focus(); }); box.append(b); });
    const ok = el('button','okb','OK'); ok.type='button'; box.append(ok);
    box.append(el('span','lbl-hint','Enter = klaar · leeg laten = geen naam'));
    let done = false;
    box._commit = ()=>{ if(done) return; done = true; const v = inp.value.trim(); if(v === (init||'')) return; pushUndo(); onApply(v); changed(); };
    const finish = ()=>{ closePop(true); wrap.focus({preventScroll:true}); };
    ok.addEventListener('click', finish);
    inp.addEventListener('keydown', e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); finish(); } if(e.key==='Escape'){ closePop(false); wrap.focus({preventScroll:true}); } });
    wrap.append(box);
    const wr = wrap.getBoundingClientRect();
    box.style.left = clamp(sp.x + 12, 4, Math.max(4, wr.width - box.offsetWidth - 6)) + 'px';
    box.style.top = clamp(sp.y - 58, 46, Math.max(46, wr.height - box.offsetHeight - 40)) + 'px';
    setTimeout(()=>{ inp.focus({preventScroll:true}); inp.select(); }, 0);
  }
  function labelAt(p){
    closePop();
    const R = Math.max(2.2, snapR());
    const up = S.u.filter(o=>o.t==='pt').map(o=>({o, d:dist(o,p)})).filter(x=>x.d<=R).sort((a,b)=>a.d-b.d)[0];
    const gp = given.find(o=>o.t==='pt' && !o.hidden && dist(o,p)<=R);
    if(!up && gp && gp.name){ setStatus(`Dit punt heet al ${gp.name}.`); return; }
    const ul = S.u.filter(o=>o.t==='lb').map(o=>({o,d:dist(o,p)})).filter(x=>x.d<=3.5).sort((a,b)=>a.d-b.d)[0];
    if(up) return namePop(up.o, up.o.name||'', {ph:'bv. A', what:'punt'}, v=>{ up.o.name = v; });
    if(ul) return namePop(ul.o, ul.o.s, {greek:true}, v=>{ if(v) ul.o.s = v; else S.u.splice(S.u.indexOf(ul.o),1); });
    namePop(p, '', {greek:true, ph:'bv. b, α, 72°'}, v=>{ if(v) S.u.push({t:'lb', x:p.x, y:p.y, s:v}); });
  }

  /* ---------- aanwijzer ---------- */
  let drag = null;
  svg.addEventListener('pointerdown', e=>{
    if(locked || demoOn) return;
    if(e.pointerType==='mouse' && e.button!==0) return;
    closePop(true);
    e.preventDefault(); wrap.focus({preventScroll:true});
    try{ svg.setPointerCapture(e.pointerId); }catch(_){}
    const p = toW(e);
    const base = {p0:p, sx:e.clientX, sy:e.clientY, moved:false};
    let h = cmpHit(p) || geoHit(p);
    if(h){
      drag = Object.assign(base, h);
      if(h.mode==='cmpRot'){ const c=P(S.cmp.cx,S.cmp.cy); drag.c=c; drag.lift = !!h.lift || e.shiftKey; drag.r=dist(c,P(S.cmp.px,S.cmp.py)); drag.pa0 = dirAng(c,P(S.cmp.px,S.cmp.py)); drag.ma0 = dirAng(c,p); drag.cum = 0; drag.min=0; drag.max=0; drag.last = drag.ma0; paintCmp(true); }
      if(h.mode==='cmpMove'){ drag.c0 = P(S.cmp.cx,S.cmp.cy); drag.p0c = P(S.cmp.px,S.cmp.py); }
      if(h.mode==='cmpPen'){ drag.off = {x:S.cmp.px-p.x, y:S.cmp.py-p.y}; }
      if(h.mode==='geoRot'){ drag.piv = geoPivot(); drag.rot0 = S.geo.rot; drag.a0 = dirAng(drag.piv.p, p); if(drag.piv.pt) setStatus('Je draait rond het punt op de tekenzijde. Laat los als de tekenzijde door het tweede punt gaat.'); }
      if(h.mode==='geoMove'){ drag.g0 = {x:S.geo.x,y:S.geo.y}; svg.classList.add('grabbing'); }
      return;
    }
    const tool = S.tool;
    if(tool==='eraser'){ drag = Object.assign(base,{mode:'erase', snap:JSON.stringify(S.u), any:false}); if(eraseAt(p)){ drag.any=true; snapCache=null; paintUser(); } return; }
    if(tool==='pencil'){ const E = edgeHit(p); if(E){ drag = Object.assign(base,{mode:'stroke', E, a:snapOnEdge(E,p)}); drag.b = drag.a; prev(`<line x1="${f2(E.a.x)}" y1="${f2(E.a.y)}" x2="${f2(E.b.x)}" y2="${f2(E.b.y)}" stroke="#f5a40f" stroke-width=".25" opacity=".55"/>`); return; } }
    drag = Object.assign(base, {mode: inGeo(p) ? 'tapOrGeo' : 'tapOrPan'});
    if(drag.mode==='tapOrGeo'){ drag.g0 = {x:S.geo.x,y:S.geo.y}; }
    drag.v0 = {x:S.vx, y:S.vy};
  });
  svg.addEventListener('pointermove', e=>{
    const p = toW(e);
    if(!drag){ hover(p); return; }
    if(!drag.moved && Math.hypot(e.clientX-drag.sx, e.clientY-drag.sy) > 5) drag.moved = true;
    switch(drag.mode){
      case 'cmpRot': {
        const ma = dirAng(drag.c,p); drag.cum += sdiff(ma, drag.last); drag.last = ma;
        drag.min = Math.min(drag.min, drag.cum); drag.max = Math.max(drag.max, drag.cum);
        if(drag.max - drag.min > 360){ if(drag.cum===drag.max) drag.min = drag.max-360; else drag.max = drag.min+360; }
        const pa = drag.pa0 + drag.cum; const np = polar(drag.c, drag.r, pa); S.cmp.px = np.x; S.cmp.py = np.y;
        paintCmp(true);
        if(!drag.lift && drag.max-drag.min > .3) prev(`<path d="${arcPath(drag.c, drag.r, drag.pa0+drag.min, drag.pa0+drag.max)}" fill="none" stroke="${PENCIL}" stroke-width=".28"/>`);
        break; }
      case 'cmpMove': {
        let nc = {x:drag.c0.x + p.x-drag.p0.x, y:drag.c0.y + p.y-drag.p0.y}; const sn = cmpSnap(nc);
        const dx = sn.x-drag.c0.x, dy = sn.y-drag.c0.y;
        S.cmp.cx = sn.x; S.cmp.cy = sn.y; S.cmp.px = drag.p0c.x+dx; S.cmp.py = drag.p0c.y+dy; paintCmp(); prev(sn.snapped? ring(sn):''); break; }
      case 'cmpPen': {
        let np = cmpSnap({x:p.x+drag.off.x, y:p.y+drag.off.y}); const c=P(S.cmp.cx,S.cmp.cy); const maxR = CMP_LEG*1.9;
        if(dist(c,np) > maxR){ np = polar(c, maxR, dirAng(c,np)); }
        S.cmp.px = np.x; S.cmp.py = np.y; paintCmp(); prev(np.snapped? ring(np):''); break; }
      case 'geoRot': {
        if(dist(drag.piv.p,p) < 4) break;
        const rot = geoRotSnap(norm360(drag.rot0 + sdiff(dirAng(drag.piv.p,p), drag.a0)), drag.piv);
        const ax = geoAxes({rot}); S.geo.rot = rot; S.geo.x = drag.piv.p.x - drag.piv.u*ax.eu.x - drag.piv.v*ax.ev.x; S.geo.y = drag.piv.p.y - drag.piv.u*ax.eu.y - drag.piv.v*ax.ev.y;
        paintGeo(); prev(ring(drag.piv.p, '#1fa6ab')); break; }
      case 'geoMove': case 'tapOrGeo': {
        if(drag.mode==='tapOrGeo' && !drag.moved) break;
        drag.mode = 'geoMove'; svg.classList.add('grabbing');
        const O = {x:drag.g0.x + p.x-drag.p0.x, y:drag.g0.y + p.y-drag.p0.y}; const sn = geoPosSnap(O);
        S.geo.x = clamp(sn.x, -W*.7, W*1.7); S.geo.y = clamp(sn.y, -H*.7, H*1.7); paintGeo(); prev(sn.snapped? ring(sn) : sn.edgePt ? ring(sn.edgePt,'#1fa6ab') : ''); break; }
      case 'stroke': {
        drag.b = snapOnEdge(drag.E, p);
        prev(`<line x1="${f2(drag.E.a.x)}" y1="${f2(drag.E.a.y)}" x2="${f2(drag.E.b.x)}" y2="${f2(drag.E.b.y)}" stroke="#f5a40f" stroke-width=".25" opacity=".55"/><line x1="${f2(drag.a.x)}" y1="${f2(drag.a.y)}" x2="${f2(drag.b.x)}" y2="${f2(drag.b.y)}" stroke="${PENCIL}" stroke-width=".32" stroke-linecap="round"/>`);
        break; }
      case 'erase': { if(eraseAt(p)){ drag.any=true; snapCache=null; paintUser(); } prev(`<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${f2(clamp(mmOfPx(8),1.4,3.2))}" fill="rgba(245,164,15,.15)" stroke="#f5a40f" stroke-width=".2"/>`); break; }
      case 'tapOrPan': case 'pan': {
        if(!drag.moved) break; drag.mode='pan';
        { panAnim++; const k = 1/pxmm(); S.vx = drag.v0.x - (e.clientX-drag.sx)*k; S.vy = drag.v0.y - (e.clientY-drag.sy)*k; applyView(); }
        break; }
    }
  });
  const endDrag = e=>{
    if(!drag) return;
    const d = drag; drag = null; svg.classList.remove('grabbing'); prev('');
    const p = e ? toW(e) : d.p0;
    switch(d.mode){
      case 'cmpRot': {
        paintCmp(false);
        if(!d.lift && d.max - d.min >= 1){ pushUndo(); let a0 = norm360(d.pa0 + d.min); let a1 = a0 + (d.max-d.min); S.u.push({t:'arc', cx:d.c.x, cy:d.c.y, r:d.r, a0, a1}); changed(); }
        else save();
        break; }
      case 'cmpMove': case 'cmpPen': save(); keepToolsVisible('cmp'); break;
      case 'geoRot': case 'geoMove': save(); keepToolsVisible('geo'); setStatus(d.piv && d.piv.pt ? 'Je draaide rond het punt op de tekenzijde.' : (TOOL_HELP[S.tool]||'')); break;
      case 'stroke': {
        if(!d.moved){ addPoint(snapOnEdge(d.E, d.p0, true)); break; }
        if(dist(d.a,d.b) >= 1){ pushUndo(); S.u.push({t:'seg', x1:d.a.x, y1:d.a.y, x2:d.b.x, y2:d.b.y}); changed(); setStatus('Lijn getrokken langs de '+(d.E.kind==='hyp'?'tekenzijde':'rand')+' van je geodriehoek.');
          if(canName && dist(d.a,d.b) >= 8){ const dr = dirAng(d.a,d.b); const far = lerp(d.a,d.b,.85); let lp = polar(far, 3.6, dr+90); if(!inGeo(polar(far,3.6,dr-90))) lp = polar(far, 3.6, dr-90); namePop(lp, '', {ph:'bv. a', what:'lijn'}, v=>{ S.u.push({t:'lb', x:lp.x, y:lp.y, s:v}); }); } }
        break; }
      case 'erase': { if(d.any){ undoSt.push(d.snap); redoSt.length=0; changed(); } break; }
      case 'tapOrGeo': case 'tapOrPan': {
        if(d.moved) break;
        const tool = S.tool;
        if(tool==='pencil') addPoint(d.p0);
        else if(tool==='label') labelAt(d.p0);
        else if(tool==='arc') arcAt(d.p0);
        else if(tool==='tick') tickAt(d.p0);
        break; }
      case 'pan': save(); break;
    }
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', ()=>{ if(drag && drag.mode==='cmpRot'){ endDrag(null); } else { drag=null; prev(''); paintCmp(); } });
  function hover(p){
    if(locked || demoOn) return;
    let h = '';
    if(S.tool==='pencil'){ const E = edgeHit(p); if(E && !cmpHit(p) && !geoHit(p)) h = `<line x1="${f2(E.a.x)}" y1="${f2(E.a.y)}" x2="${f2(E.b.x)}" y2="${f2(E.b.y)}" stroke="#f5a40f" stroke-width="${f2(clamp(mmOfPx(2.2),.3,.7))}" opacity=".6"/>`; }
    if(S.tool==='eraser') h = `<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${f2(clamp(mmOfPx(8),1.4,3.2))}" fill="none" stroke="#f5a40f" stroke-width=".2"/>`;
    prev(h);
    const g = geoHit(p), c = cmpHit(p);
    svg.classList.toggle('grab', !!(c || (g) || (inGeo(p) && S.tool!=='eraser' && !edgeHit(p))));
    const hm = c ? (c.lift ? 'cmpTurn' : c.mode) : g ? g.mode : null;
    if(hm !== hover.last){ hover.last = hm; setStatus(hm ? HANDLE_HELP[hm] : (TOOL_HELP[S.tool]||'')); }
  }
  svg.addEventListener('pointerleave', ()=>{ if(!drag) prev(''); });
  svg.addEventListener('wheel', e=>{
    if(e.ctrlKey){ e.preventDefault(); zoomBy(e.deltaY<0?1:-1, toW(e)); return; }
    if(S.z>1){ e.preventDefault(); const k = 1/pxmm(); S.vx += e.deltaX*k; S.vy += e.deltaY*k; applyView(); }
  }, {passive:false});
  wrap.addEventListener('keydown', e=>{
    if(locked || demoOn || e.target.tagName==='INPUT') return;
    const k = e.key;
    if((e.ctrlKey||e.metaKey) && (k==='z'||k==='Z')){ e.preventDefault(); undo(); return; }
    if((e.ctrlKey||e.metaKey) && (k==='y'||k==='Y')){ e.preventDefault(); redo(); return; }
    if(!S.geo.on) return;
    const step = e.shiftKey ? .1 : .5;
    const mv = {ArrowLeft:[-step,0], ArrowRight:[step,0], ArrowUp:[0,-step], ArrowDown:[0,step]}[k];
    if(mv){ e.preventDefault(); S.geo.x += mv[0]; S.geo.y += mv[1]; save(); paintGeo(); clearTimeout(rotateGeo.t); rotateGeo.t = setTimeout(()=>keepToolsVisible('geo'), 350); return; }
    if(k==='q'||k==='Q'){ e.preventDefault(); rotateGeo(e.shiftKey?.2:1); }
    if(k==='e'||k==='E'){ e.preventDefault(); rotateGeo(e.shiftKey?-.2:-1); }
  });

  /* ---------- geanimeerde werkwijze ---------- */
  const ease = t => t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
  async function runDemo(steps, tok){
    const anim = (ms, fn) => new Promise((res,rej)=>{ const t0 = performance.now(); const tick = now=>{ if(!demoOn || tok!==demoTok){ rej('stop'); return; } const t = Math.min(1,(now-t0)/ms); fn(ease(t), t); if(t<1) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
    const wait = ms => anim(ms, ()=>{});
    let gg = S.geo.on ? {x:S.geo.x, y:S.geo.y, rot:S.geo.rot} : {x:W/2, y:H+40, rot:0};
    let gc = S.cmp.on ? {c:P(S.cmp.cx,S.cmp.cy), p:P(S.cmp.px,S.cmp.py)} : {c:P(W+20,H/2), p:P(W+50,H/2)};
    let geoShown = !!S.geo.on, cmpShown = !!S.cmp.on;
    const drawn = [];
    /* kies de kant zodat de knoppen van de passer in beeld blijven (zoals bij de echte passer) */
    const sideOf = (c,p)=>{ const k = cmpGeom(c,p,1).knob; return (k.x>3 && k.x<W-3 && k.y>3 && k.y<H-3) ? 1 : -1; };
    const cmpG = (c,p)=>cmpGeom(c,p,sideOf(c,p));
    let cur = null, press = false;
    const curSVG = () => cur ? `<g transform="translate(${f2(cur.x)} ${f2(cur.y)})">${press?'<circle r="2.6" fill="rgba(245,164,15,.25)" stroke="#f5a40f" stroke-width=".35"/>':''}<path d="M0 0L0 7.4 1.9 5.7 3.2 8.7 4.5 8.1 3.2 5.3 5.6 5.3Z" fill="#fff" stroke="#15282d" stroke-width=".42" stroke-linejoin="round"/></g>` : '';
    const ggeo = ()=>{ Lggeo.setAttribute('transform', geoTransform(gg)); Lggeo.style.display = geoShown?'':'none'; gcmp(); };
    const gcmp = ()=>{ Lgc.innerHTML = (cmpShown ? cmpMarkup(gc.c, gc.p, true, false, sideOf(gc.c, gc.p)) : '') + curSVG(); };
    const moveCur = async (to, ms=450) => { if(!to) return; if(!cur){ cur = {...to}; gcmp(); return; } const a = {...cur}; press = false; await anim(ms, t=>{ cur = lerp(a,to,t); gcmp(); }); };
    const handleOf = g => geoL2W(g, 0, GEO_MOVE_V), knobOf = g => geoL2W(g, 0, GEO_ROT_V);
    const redraw = extra => { Ld.innerHTML = drawn.join('') + (extra||''); };
    /* passer draaien zonder te tekenen: met de kleine rode knop */
    const turnNoDraw = async (aTo, ms) => { const c = gc.c, r = dist(gc.c,gc.p), aFrom = dirAng(c,gc.p), da = sdiff(aTo, aFrom); if(Math.abs(da) < 1) { gc.p = polar(c,r,aTo); gcmp(); return; }
      const say = cap.innerHTML; cap.innerHTML = '<span style="color:#d4452b">⟳</span> Draai de passer met de <b style="color:#d4452b">kleine rode knop</b>: zo teken je niets.';
      await moveCur(cmpG(gc.c,gc.p).turn); press = true;
      await anim(ms || Math.max(600, Math.abs(da)*9), t=>{ gc.p = polar(c, r, aFrom + da*t); cur = cmpG(gc.c,gc.p).turn; gcmp(); });
      press = false; gc.p = polar(c,r,aTo); gcmp(); cap.innerHTML = say; };
    Lggeo.innerHTML = geoMarkup(geoMode, true); ggeo(); gcmp();
    for(const s of steps){
      if(s.say!=null) cap.innerHTML = s.say;
      if(s.geo){ const wasShown = geoShown; geoShown = true; const a = {...gg}, b = s.geo; let dr = sdiff(b.rot, a.rot);
        if(!wasShown || s.instant){ gg = {...b, rot:b.rot}; ggeo(); }
        else {
          const tr = dist(a,b) > .5, ro = Math.abs(dr) > .3;
          if(tr){ const mid1 = {x:b.x, y:b.y, rot:a.rot};
            await moveCur(handleOf(a)); press = true;
            await anim((s.dur||1100)*(ro?.55:1), t=>{ gg = {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t, rot:a.rot}; cur = handleOf(gg); ggeo(); });
            press = false; if(!ro) gg = {...mid1}; }
          if(ro){ const c0 = {...gg};
            await moveCur(knobOf(c0)); press = true;
            await anim((s.dur||1100)*(tr?.55:1), t=>{ gg = {x:c0.x, y:c0.y, rot:c0.rot+dr*t}; cur = knobOf(gg); ggeo(); });
            press = false; }
          gg = {x:b.x, y:b.y, rot:b.rot}; ggeo();
        } }
      if(s.geoAbout){ /* draaien rond een punt op de tekenzijde */
        const pv = s.geoAbout.p; const l = geoW2L(gg, pv); const a = {...gg}; const dr = sdiff(s.geoAbout.rot, a.rot);
        await moveCur(knobOf(a)); press = true;
        await anim(s.dur||1200, t=>{ const rot = a.rot + dr*t; const ax = geoAxes({rot}); gg = {rot, x:pv.x - l.u*ax.eu.x, y:pv.y - l.u*ax.eu.y}; cur = knobOf(gg); ggeo();
          redraw(`<circle cx="${f2(pv.x)}" cy="${f2(pv.y)}" r="2.2" fill="none" stroke="#1fa6ab" stroke-width=".45"/>`); });
        press = false; redraw(); }
      if(s.geoOff){ geoShown = false; ggeo(); }
      if(s.cmp){ const was = cmpShown; cmpShown = true; const a = {c:{...gc.c}, p:{...gc.p}}, b = s.cmp;
        if(!was){ gc = {c:{...b.c}, p:{...b.p}}; gcmp(); }
        else {
          const movesC = dist(a.c,b.c) > .3;
          if(movesC){ const off = {x:b.p.x-b.c.x - (a.p.x-a.c.x), y:b.p.y-b.c.y - (a.p.y-a.c.y)};
            await moveCur(cmpG(a.c,a.p).H); press = true;
            await anim((s.dur||1000)*(Math.hypot(off.x,off.y)>.3?.6:1), t=>{ gc = {c:lerp(a.c,b.c,t), p:{x:a.p.x+(b.c.x-a.c.x)*t, y:a.p.y+(b.c.y-a.c.y)*t}}; cur = cmpG(gc.c,gc.p).H; gcmp(); }); press = false; }
          const a2 = {c:{...gc.c}, p:{...gc.p}};
          const r2 = dist(a2.c,a2.p), rb = dist(a2.c,b.p);
          if(dist(a2.p,b.p) > .3 && Math.abs(r2-rb) < .3){ await turnNoDraw(dirAng(a2.c,b.p)); }
          else if(dist(a2.p,b.p) > .3){ await moveCur(lerp(a2.p, cmpG(a2.c,a2.p).H, .3)); press = true;
            await anim((s.dur||1000)*(movesC?.6:1), t=>{ gc = {c:a2.c, p:lerp(a2.p,b.p,t)}; cur = lerp(gc.p, cmpG(gc.c,gc.p).H, .3); gcmp(); }); press = false; }
          gc = {c:{...b.c}, p:{...b.p}}; gcmp();
        } }
      if(s.swing){ const c = gc.c, r = dist(gc.c,gc.p); const [a0,a1] = s.swing;
        await turnNoDraw(a0); gc.p = polar(c,r,a0); await moveCur(cmpG(gc.c,gc.p).knob); press = true;
        await anim(s.dur||1000, t=>{ const a = a0+(a1-a0)*t; gc.p = polar(c,r,a); cur = cmpG(gc.c,gc.p).knob; gcmp(); redraw(`<path d="${arcPath(c,r,Math.min(a0,a),Math.max(a0,a)+.01)}" fill="none" stroke="${DEMO}" stroke-width=".3"/>`); });
        press = false; drawn.push(`<path d="${arcPath(c,r,Math.min(a0,a1),Math.max(a0,a1))}" fill="none" stroke="${DEMO}" stroke-width=".3"/>`); redraw(); }
      if(s.cmpOff){ cmpShown = false; gcmp(); }
      if(s.line){ const [a,b] = s.line; await moveCur(a, 350); press = true;
        await anim(s.dur||800, t=>{ const q = lerp(a,b,t); cur = q; gcmp(); redraw(`<line x1="${f2(a.x)}" y1="${f2(a.y)}" x2="${f2(q.x)}" y2="${f2(q.y)}" stroke="${DEMO}" stroke-width=".4" stroke-linecap="round"/><circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="1" fill="${DEMO}"/>`); });
        press = false; drawn.push(`<line x1="${f2(a.x)}" y1="${f2(a.y)}" x2="${f2(b.x)}" y2="${f2(b.y)}" stroke="${DEMO}" stroke-width="${s.w||.4}" stroke-linecap="round"${s.dash?` stroke-dasharray="${s.dash}"`:''}/>`); redraw(); }
      if(s.pt){ await moveCur(s.pt, 350); press = true; gcmp(); setTimeout(()=>{ press=false; }, 200); drawn.push(objSVG({t:'pt', x:s.pt.x, y:s.pt.y, name:s.name||'', lx:s.lx, ly:s.ly},{color:DEMO})); redraw(); await wait(s.dur||350); }
      if(s.am){ await moveCur(polar(P(s.am.vx,s.am.vy), (s.am.r||7)*.7, (s.am.a0+s.am.a1)/2), 350); drawn.push(amSVG(Object.assign({r:7, style:'arc'}, s.am), DEMO)); redraw(); await wait(s.dur||400); }
      if(s.tk){ await moveCur(s.tk.p, 300); drawn.push(tickMarks(s.tk.p, s.tk.dir, s.tk.n||1, DEMO, .32)); redraw(); await wait(s.dur||300); }
      if(s.lb){ await moveCur(s.lb.p, 300); drawn.push(svgText(s.lb.p.x, s.lb.p.y, s.lb.s, {size:s.lb.size||4.2, color:DEMO})); redraw(); await wait(s.dur||300); }
      if(s.hl){ drawn.push(s.hl); redraw(); }
      if(s.rub){ const [a,b] = s.rub; await moveCur(a, 350); press = true; const n = 3;
        await anim(s.dur||1300, t=>{ const k = t*n; const ph = k%1; const q = (Math.floor(k)%2===0) ? lerp(a,b,ph) : lerp(b,a,ph); cur = q; gcmp();
          redraw(`<line x1="${f2(a.x)}" y1="${f2(a.y)}" x2="${f2(lerp(a,b,Math.min(1,t*1.4)).x)}" y2="${f2(lerp(a,b,Math.min(1,t*1.4)).y)}" stroke="#fffefa" stroke-width="1.6" stroke-linecap="round"/>`); });
        press = false; drawn.push(`<line x1="${f2(a.x)}" y1="${f2(a.y)}" x2="${f2(b.x)}" y2="${f2(b.y)}" stroke="#fffefa" stroke-width="1.6" stroke-linecap="round"/>`); redraw(); }
      if(s.cur){ await moveCur(s.cur, s.dur||450); }
      if(s.wait) await wait(s.wait);
    }
  }
  function playDemo(steps, done){
    if(!steps || !steps.length) return;
    stopDemo();
    demoOn = true; demoTok++; closePop(false); paintGeo(); paintCmp(); prev('');
    panAnim++; S.z=1; S.vx=0; S.vy=0; applyView();
    runDemo(steps, demoTok).then(()=>{ if(done) done(); }).catch(()=>{});
  }
  function stopDemo(){ demoOn = false; demoTok++; Ld.innerHTML=''; Lggeo.style.display='none'; Lgc.innerHTML=''; cap.innerHTML=''; paintGeo(); paintCmp(); }

  /* ---------- API voor controles ---------- */
  const B = {
    W, H, given,
    userObjs, strokesAll, arcsAll,
    pts: ()=>ptsAll(),
    pt: name => { const L = ptsAll().filter(p=>p.name===name); return L.find(p=>!p.g) || L[0] || null; },
    gpt: name => given.find(o=>o.t==='pt' && o.name===name) || null,
    userPts: ()=>S.u.filter(o=>o.t==='pt'),
    segs: ()=>mergeStrokes(S.u.filter(o=>o.t==='seg').map(o=>({a:P(o.x1,o.y1), b:P(o.x2,o.y2)}))),
    rawSegs: ()=>S.u.filter(o=>o.t==='seg').map(o=>({a:P(o.x1,o.y1), b:P(o.x2,o.y2)})),
    arcs: ()=>S.u.filter(o=>o.t==='arc'),
    ams: ()=>S.u.filter(o=>o.t==='am'),
    ticks: ()=>S.u.filter(o=>o.t==='tk'),
    labels: ()=>S.u.filter(o=>o.t==='lb'),
    geo: ()=>({...S.geo}), cmp: ()=>({...S.cmp}),
    playDemo, stopDemo, demoActive: ()=>demoOn,
    lock: ()=>{ locked = true; closePop(false); [...tb.querySelectorAll('button')].forEach(b=>b.disabled=true); wrap.style.opacity='.96'; },
    setStatus,
    redrawGiven: ()=>{ snapCache=null; paintGiven(); },
    el: wrap,
    _inject: objs => { S.u = objs.map(o=>({...o})); changed(); }
  };
  wrap._B = B;

  paintGiven(); paintUser(); applyView(); paintTools();
  setStatus(cfg.status || TOOL_HELP[S.tool] || '');
  return B;
}

/* ============================================================
   CONTROLES OP TEKENINGEN
   ============================================================ */
const mmTxt = mm => fmtN(mm/10, 1) + ' cm';
const cleanLbl = s => String(s).replace(/\s+/g,'').replace(/[’'`]/g,'′').replace(/º/g,'°');
const CK = {
  /* alle getekende (samengevoegde) lijnen die door A en Bp gaan, met hoe ver ze voorbij A en B lopen */
  through(B, A, Bp, tol=0.8){
    const AB = dist(A,Bp); if(AB<1e-6) return [];
    const u = {x:(Bp.x-A.x)/AB, y:(Bp.y-A.y)/AB};
    return B.segs().filter(s=>lineDist(A,s.a,s.b)<=tol && lineDist(Bp,s.a,s.b)<=tol).map(s=>{
      const e1 = (s.a.x-A.x)*u.x+(s.a.y-A.y)*u.y, e2 = (s.b.x-A.x)*u.x+(s.b.y-A.y)*u.y;
      const lo = Math.min(e1,e2), hi = Math.max(e1,e2);
      return {s, beforeA:-lo, afterB:hi-AB, covers: lo<=tol+.4 && hi>=AB-tol-.4};
    }).filter(x=>x.covers);
  },
  kind(x){ /* x uit through() */
    const near = v => Math.abs(v) <= 1.6, far = v => v >= 4;
    if(near(x.beforeA) && near(x.afterB)) return 'seg';
    if(near(x.beforeA) && far(x.afterB)) return 'rayA';
    if(far(x.beforeA) && near(x.afterB)) return 'rayB';
    if(far(x.beforeA) && far(x.afterB)) return 'line';
    return 'other';
  },
  kinds(B, A, Bp){ return CK.through(B,A,Bp).map(CK.kind); },
  hasSeg(B, A, Bp){ return CK.kinds(B,A,Bp).includes('seg'); },
  /* stralen die vertrekken in V (een rechte door V geeft twee richtingen) */
  rays(B, V, tol=0.9, minLen=6){
    const out = [];
    B.segs().forEach(s=>{ if(segDist(V,s.a,s.b) > tol) return; [s.a,s.b].forEach(e=>{ const L = dist(V,e); if(L>=minLen) out.push({dir:dirAng(V,e), len:L, end:e, s}); }); });
    return out;
  },
  /* passerbogen rond C met straal r */
  arcsAt(B, C, r, tolC=1, tolR=1.05){ return B.arcs().filter(a=>dist(P(a.cx,a.cy),C)<=tolC && (r==null || Math.abs(a.r-r)<=tolR)); },
  /* boogje in V dat de hoek met middenrichting midDir en grootte sweep aanduidt */
  amAt(B, V, midDir, sweep, tol=3){
    return B.ams().find(m=>dist(P(m.vx,m.vy),V)<=1.1 && inArc(m, midDir) && Math.abs((m.a1-m.a0)-sweep)<=tol) || null;
  },
  labelsNear(B, p, r){ return B.labels().filter(l=>dist(l,p)<=r).map(l=>({...l, c:cleanLbl(l.s)})); },
  hasLabel(B, p, r, test){ return CK.labelsNear(B,p,r).some(l=> typeof test==='function' ? test(l.c) : l.c===cleanLbl(test)); },
  /* merktekens op lijnstuk [AB] */
  ticksOn(B, A, Bp){ return B.ticks().filter(t=>lineDist(t,A,Bp)<=1.2 && projT(t,A,Bp)>0.03 && projT(t,A,Bp)<0.97).map(t=>t.n); },
  userPt(B, name){ return B.userPts().find(p=>p.name===name) || null; },
  /* naam van een punt controleren met nuttige feedback */
  needPt(B, name, msgs){
    const p = B.pt(name);
    if(p) return {p};
    const lower = B.userPts().find(q=>q.name && q.name.toLowerCase()===name.toLowerCase());
    if(lower) return {err:`Een punt noteer je met een hoofdletter: ${name}, niet ${lower.name}.`};
    const noName = B.userPts().filter(q=>!q.name).length;
    return {err: noName ? `Je zette een punt, maar gaf het nog geen naam. Kies <b>Benoem</b> en tik op het punt om het ${name} te noemen.` : (msgs||`Zet het punt ${name} en geef het die naam met <b>Benoem</b>.`)};
  },
  geoOn(B){ return B.geo().on; }
};
/* lengte van getekend lijnstuk vanuit A naar een punt met naam (of eindpunt) */
function lenCheck(B, A, endName, target, unitTxt){
  const r = CK.needPt(B, endName); if(r.err) return {ok:false, msg:r.err};
  const E = r.p; const L = dist(A, E);
  if(!CK.hasSeg(B, A, E)) return {ok:false, msg:`Punt ${endName} staat er, maar teken ook het lijnstuk [${A.name}${endName}] langs je geodriehoek.`};
  if(Math.abs(L-target) > 1.05) return {ok:false, msg:`Jouw lijnstuk [${A.name}${endName}] is ${mmTxt(L)} lang. Het moet ${unitTxt||mmTxt(target)} zijn${unitTxt?` (= ${mmTxt(target)})`:''}. Leg het nulpunt van je geodriehoek op ${A.name}.`};
  return {ok:true, L};
}

/* ============================================================
   GEANIMEERDE WERKWIJZEN (bouwstenen)
   ============================================================ */
const DM = {
  /* geodriehoek met nulpunt op A, tekenzijde richting dir; kant: +1 = lichaam links van de richting */
  geoAt(A, dir, say, dur){ return {say, geo:{x:A.x, y:A.y, rot:norm360(dir)}, dur}; },
  measure(A, Bp, nameA, nameB, valTxt){
    return [
      {say:`Leg het <b>nulpunt</b> van je geodriehoek op ${nameA} en de tekenzijde langs het lijnstuk.`, geo:{x:A.x, y:A.y, rot:dirAng(A,Bp)}},
      {say:`Lees af bij ${nameB}: <b>${valTxt}</b>.`, hl:`<circle cx="${f2(Bp.x)}" cy="${f2(Bp.y)}" r="2.2" fill="none" stroke="${DEMO}" stroke-width=".4"/>`, wait:1600}
    ];
  },
  drawSeg(A, dir, L, nameA, nameB, valTxt){
    const E = polar(A, L, dir);
    return [
      {say:`Leg het nulpunt van je geodriehoek op ${nameA}.`, geo:{x:A.x, y:A.y, rot:dir}},
      {say:`Trek langs de tekenzijde een lijn van 0 tot ${valTxt}.`, line:[A,E]},
      {say:`Zet een punt bij ${valTxt} en noem het ${nameB}.`, pt:E, name:nameB},
      {wait:900}
    ];
  },
  /* passer: opening |AB| nemen, verplaatsen naar C en een boogje rond richting dir */
  copyLen(A, Bp, C, dir, nameA, nameB, nameC, spread=14){
    const r = dist(A,Bp);
    return [
      {say:`Zet de <b>passerpunt</b> in ${nameA} en het <b>potloodbeen</b> in ${nameB}. Zo zit |${nameA}${nameB}| in je passer.`, cmp:{c:A, p:Bp}},
      {say:`Behoud de opening. Zet de passerpunt in ${nameC}.`, cmp:{c:C, p:polar(C,r,dir-spread)}},
      {say:`Draai aan de <b style="color:#7c5cd6">paarse knop</b>: teken een boogje.`, swing:[dir-spread, dir+spread]},
    ];
  }
};

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
   INHOUD DEEL 1: tekengerei, lijnstukken meten, tekenen en construeren
   ============================================================ */
const SEC = {};
let dir0 = 0;
const VERBS = `<div class="howto">
  <div><span><b>Schetsen</b> = snel tekenen met je geodriehoek. Afstanden zijn niet zo belangrijk.</span></div>
  <div><span><b>Tekenen</b> = tekenen met je geodriehoek. Je mag meten.</span></div>
  <div><span><b>Construeren</b> = tekenen met geodriehoek en passer, <b>zonder te meten</b>. Je geodriehoek heeft dan geen getallen.</span></div></div>`;
/* naam van een eindpunt net voorbij het lijnstuk zetten */
function ptEnd(A, other, name, d=3.8){ const dr = dirAng(other, A); const o = polar(P(0,0), d, dr); return G.pt(A, name, {lx:o.x, ly:o.y}); }
function ptOff(A, ang, name, d=3.8){ const o = polar(P(0,0), d, ang); return G.pt(A, name, {lx:o.x, ly:o.y}); }
function segAround(c, L, dir){ return [polar(c, L/2, dir+180), polar(c, L/2, dir)]; }
const cmTxt = mm => fmtN(mm/10) + ' cm';
/* genereer tot alle punten binnen het blad liggen */
function pickIn(R, gen, W=200, H=115, m=9){ let r; for(let i=0;i<300;i++){ r = gen(); const pts = (Array.isArray(r) ? r : Object.values(r)).filter(p=>p && typeof p==="object" && "x" in p); if(pts.every(p=>p.x>=m && p.x<=W-m && p.y>=m && p.y<=H-m)) return r; } return r; }

/* ---------------- 1. TEKENGEREI ---------------- */
const HOWTO = `<div class="howto">
  <div>${tIcon('geo')}<span><b>Geodriehoek</b><br>Neem hem vast en sleep hem (of gebruik het blauwe handvat ✥). Het nulpunt en de tekenzijde klikken licht vast op punten. Draai aan de <b style="color:#d4452b">rode knop</b>: ligt er een punt op de tekenzijde, dan draait hij rond dat punt. Zo verbind je makkelijk twee punten. Fijn draaien: ⟲ ⟳ of <span class="kbd">Q</span> <span class="kbd">E</span>. Hoeken lees je af op de halve cirkel of langs de schuine zijden.</span></div>
  <div>${tIcon('pencil')}<span><b>Potlood</b><br>Tik om een punt te zetten. Sleep <b>langs de rand</b> van je geodriehoek om een rechte lijn te trekken. De rand licht op als je er dichtbij bent.</span></div>
  <div>${tIcon('compass')}<span><b>Passer</b><br><b style="color:var(--accent-dark)">✥ Blauw</b> (op de naald): de passer verplaatsen, de opening blijft. <b style="color:#c97a00">↔ Oranje</b> (op het potloodbeen): de opening kiezen. <b style="color:#d4452b">⟳ Kleine rode knop</b>: de passer draaien zonder te tekenen. <b style="color:#7c5cd6">✎ Paarse knop</b> bovenaan: draaien en een boog tekenen.</span></div>
  <div>${tIcon('eraser')}<span><b>Gom</b><br>Wrijf over een lijn, punt of boog om die uit te gommen. Fout gegomd? Klik op ↶.</span></div>
  <div>${tIcon('label')}<span><b>Benoemen</b><br>Na een punt, een lijn of een boogje verschijnt vanzelf een vakje: typ de naam en druk op Enter (leeg laten = geen naam). Iets later aanpassen? Kies <b>Benoem</b> en tik erop.</span></div>
  <div>${tIcon('arc')}<span><b>Boogje en merkteken</b><br>Tik in een hoek voor een boogje (nog eens tikken: ∟). Met <b>Merkteken</b> tik je op een lijnstuk of boogje.</span></div>
  <div>${tIcon('zin')}<span><b>Het blad</b><br>Het blad schuift vanzelf mee zodat je geodriehoek en passer in beeld blijven. Zelf verschuiven: sleep het blad. In- en uitzoomen met + en − (of <span class="kbd">Ctrl</span> + scrollen). ${tIcon('home')} toont weer het hele blad, met je geodriehoek en passer volledig in beeld.</span></div>
</div>`;

SEC.gerei = { id:'gerei', ic:'tools', nav:'Je tekengerei', title:'Leer werken met je digitale tekengerei',
  intro: HOWTO + `<div class="tip">${icon('bulb')}<div>Je tekent hier zoals op papier: <b>alleen met je geodriehoek, je passer en je potlood</b>. Er is geen lat. Elke opdracht wordt gecontroleerd tot op <b>1 mm</b> en <b>1°</b> nauwkeurig.${VERBS}</div></div>`,
  cards:[
  { title:'Missies met je geodriehoek', lvl:1, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nA,nB,nC,nD,nE,nF,nX] = R.letters(7);
      /* missie 1 */
      const [A,Bq] = pickIn(R, ()=>{ const a = P(R.int(35,60), R.int(22,50)); return [a, polar(a, R.int(50,72), R.int(-30,25))]; }, 200, 115, 10);
      qBlock(b, st, save, 'm1', { demoFirst:true, nr:'a.', html:`Leg het <b>nulpunt</b> van je geodriehoek (het rondje in het midden van de tekenzijde) op punt ${nA}. Draai hem daarna zodat de tekenzijde door punt ${nB} gaat.`, block:true,
        board:{w:200, h:115, tools:['geo'], given:[G.pt(A,nA), G.pt(Bq,nB)], status:'Sleep je geodriehoek (neem hem in het midden vast). Het nulpunt klikt vast op een punt.'},
        check:(v,c,B)=>{ const g = B.geo(); if(!g.on) return {ok:false, msg:'Neem eerst je geodriehoek: klik op de knop <b>Geodriehoek</b>.'};
          if(dist(g,A) > .7) return {ok:false, msg:`Het nulpunt ligt nog niet op ${nA}. Sleep je geodriehoek tot het nulpunt vastklikt op ${nA}.`};
          const l = geoW2L(g, Bq); if(Math.abs(l.v) > .7 || Math.abs(l.u) > 79.5) return {ok:false, msg:`Het nulpunt ligt goed op ${nA}. Draai nu aan een rode knop tot de tekenzijde door ${nB} gaat.`};
          return {ok:true, msg:`Je geodriehoek ligt perfect: nulpunt op ${nA}, tekenzijde door ${nB}.`}; },
        demo:()=>[{say:`Sleep de geodriehoek tot het nulpunt op ${nA} ligt.`, geo:{x:A.x,y:A.y,rot:0}}, {say:`Draai tot de tekenzijde door ${nB} gaat.`, geo:{x:A.x,y:A.y,rot:dirAng(A,Bq)}}, {wait:1200}] });
      /* missie 2 */
      const [C,D] = pickIn(R, ()=>{ const c = P(R.int(25,60), R.int(15,70)); return [c, polar(c, R.int(60,95), R.int(-40,40))]; }, 200, 115, 10);
      qBlock(b, st, save, 'm2', { demoFirst:true, nr:'b.', html:`Trek met je potlood het lijnstuk [${nC}${nD}]. Leg eerst je geodriehoek zodat de tekenzijde door ${nC} en ${nD} gaat. Sleep dan met het potlood <b>langs de tekenzijde</b> van ${nC} naar ${nD}.`, block:true,
        board:{w:200, h:115, tools:['pencil','eraser','geo'], given:[ptEnd(C,D,nC), ptEnd(D,C,nD)]},
        check:(v,c,B)=>{ const ks = CK.kinds(B,C,D);
          if(ks.includes('seg')) return {ok:true, msg:'Mooi recht getrokken en netjes gestopt in de twee punten.'};
          if(ks.some(k=>k!=='seg')) return {ok:false, msg:`Je lijn loopt voorbij ${nC} of ${nD}. Een lijnstuk stopt in de twee grenspunten. Gom je lijn uit en probeer opnieuw.`};
          if(!B.segs().length) return {ok:false, msg:'Er staat nog geen lijn. Sleep met het potlood langs de tekenzijde (die licht oranje op als je er dichtbij bent).'};
          return {ok:false, msg:`Je lijn gaat niet door ${nC} en ${nD}. Leg je geodriehoek zo dat de tekenzijde door beide punten gaat (beide punten mooi in het midden van de tekenzijde).`}; },
        demo:()=>[{say:`Leg de tekenzijde door ${nC} en ${nD}. Schuif tot beide punten mooi in het midden van de tekenzijde liggen.`, geo:geoOn(C,D)}, {say:`Trek langs de tekenzijde van ${nC} naar ${nD}.`, line:[C,D]}, {wait:800}] });
      /* missie 3 */
      const [E,F] = pickIn(R, ()=>{ const e = P(R.int(25,55), R.int(20,80)); return [e, polar(e, R.int(80,110), R.int(-25,25))]; }, 200, 115, 10);
      qBlock(b, st, save, 'm3', { demoFirst:true, nr:'c.', html:`Zet met je potlood een punt op het lijnstuk [${nE}${nF}] en noem het ${nX}. Tik daarvoor met <b>Benoem</b> op je punt.`, block:true,
        board:{w:200, h:115, tools:['pencil','eraser','label','geo'], geo:{on:false}, given:[G.seg(E,F), ptEnd(E,F,nE), ptEnd(F,E,nF)]},
        check:(v,c,B)=>{ const r = CK.needPt(B, nX); if(r.err) return {ok:false, msg:r.err};
          const X = r.p; if(segDist(X,E,F) > .7) return {ok:false, msg:`Punt ${nX} ligt niet op [${nE}${nF}]. Tik precies op het lijnstuk: je punt klikt er dan op vast.`};
          return {ok:true, msg:`${nX} ∈ [${nE}${nF}]`}; },
        demo:()=>[{say:'Tik met het potlood op het lijnstuk.', pt:mid(E,F)}, {say:`Kies Benoem en tik op het punt: typ ${nX}.`, pt:mid(E,F), name:nX}, {wait:900}] });
    }},
  { title:'Missies met je passer', lvl:1, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nM,nN,nG,nH,nK] = R.letters(5);
      const M = P(R.int(70,120), R.int(45,65)); const N = polar(M, R.int(22,36), R.int(0,359));
      qBlock(b, st, save, 'm4', { demoFirst:true, nr:'a.', html:`Teken met je passer een <b>volledige cirkel</b> met middelpunt ${nM} die door punt ${nN} gaat.`, block:true,
        board:{w:200, h:115, tools:['compass','eraser'], compass:{on:true}, given:[G.pt(M,nM), G.pt(N,nN)], status:'Sleep de naald van de passer naar '+nM+'. Sleep het potloodbeen naar '+nN+'. Draai dan aan de paarse knop bovenaan.'},
        check:(v,c,B)=>{ const arcs = B.arcs(); if(!arcs.length) return {ok:false, msg:'Er staat nog geen passerboog. Draai aan de paarse knop bovenaan je passer.'};
          const okC = arcs.filter(a=>dist(P(a.cx,a.cy),M)<=.8);
          if(!okC.length) return {ok:false, msg:`De naald van je passer stond niet in ${nM}. Sleep de naald naar ${nM}: ze klikt vast op het punt.`};
          const okR = okC.filter(a=>Math.abs(a.r-dist(M,N))<=.8);
          if(!okR.length) return {ok:false, msg:`Je cirkel gaat niet door ${nN}. Zet het potloodbeen precies in ${nN} voor je draait.`};
          if(!okR.some(a=>a.a1-a.a0>=350)) return {ok:false, info:true, msg:'Bijna! Je boog is nog geen volledige cirkel. Draai helemaal rond.'};
          return {ok:true, msg:'Een mooie cirkel!'}; },
        demo:()=>[{say:`Naald in ${nM}, potloodbeen in ${nN}.`, cmp:{c:M, p:N}}, {say:'Draai aan de <b style="color:#7c5cd6">paarse knop</b>: helemaal rond.', swing:[dirAng(M,N), dirAng(M,N)+360], dur:1800}] });
      const Gp = P(R.int(25,45), R.int(18,30)); const Hp = polar(Gp, R.int(30,48), R.int(-20,20));
      const K = P(R.int(105,150), R.int(60,85));
      qBlock(b, st, save, 'm5', { demoFirst:true, nr:'b.', html:`Neem de lengte van [${nG}${nH}] in je passer. Teken daarmee een boogje rond punt ${nK}. <i>Je meet niet: de passer onthoudt de lengte.</i>`, block:true,
        board:{w:200, h:115, tools:['compass','eraser'], compass:{on:true, pose:{cx:150,cy:40,px:175,py:40}}, given:[G.seg(Gp,Hp), ptEnd(Gp,Hp,nG), ptEnd(Hp,Gp,nH), G.pt(K,nK)]},
        check:(v,c,B)=>{ const L = dist(Gp,Hp); const a = CK.arcsAt(B,K,null); if(!a.length) return {ok:false, msg:`Er staat nog geen boogje rond ${nK}. Zet de naald in ${nK} en draai aan de paarse knop.`};
          if(!a.some(x=>Math.abs(x.r-L)<=1)) return {ok:false, msg:`De opening van je passer was niet gelijk aan |${nG}${nH}|. Zet eerst de naald in ${nG} en het potloodbeen in ${nH}. Sleep daarna de hele passer (aan de naald) naar ${nK}.`};
          return {ok:true, msg:`Elk punt van je boogje ligt op afstand |${nG}${nH}| van ${nK}.`}; },
        demo:()=>DM.copyLen(Gp,Hp,K, 30, nG,nH,nK, 25) });
    }},
  { title:'Missies: aanduiden en gommen', lvl:1, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nV,nA,nB,nC,nD,nE,nF,nP] = R.letters(8);
      const V = P(R.int(45,75), R.int(70,85)); const d1 = R.int(-10,15), d2 = d1 + R.int(40,110);
      const A1 = polar(V, 60, d1), A2 = polar(V, 55, d2);
      qBlock(b, st, save, 'm6', { demoFirst:true, nr:'a.', html:`Zet een <b>boogje</b> in de hoek ${hat(nV)} en noteer er de letter α bij (met <b>Benoem</b>).`, block:true,
        board:{w:200, h:100, tools:['arc','label','eraser'], given:[G.ray(V,A1), G.ray(V,A2), ptOff(V, (d1+d2)/2+180, nV)]},
        check:(v,c,B)=>{ const md = (d1+d2)/2; const m = CK.amAt(B, V, md, d2-d1); if(!m) return {ok:false, msg:'Er staat nog geen boogje in de hoek. Kies <b>Boogje</b> en tik binnen de hoek, dicht bij het hoekpunt.'};
          const lab = CK.labelsNear(B, V, 28).find(l=>l.c==='α'); if(!lab) return {ok:false, msg:'Het boogje staat er. Noteer nu α in de hoek: kies <b>Benoem</b>, tik in de hoek en klik op α.'};
          if(!inArc({a0:d1,a1:d2}, dirAng(V,lab))) return {ok:false, msg:'Zet α binnen de hoek, bij het boogje.'};
          return {ok:true}; },
        demo:()=>[{say:'Kies Boogje en tik in de hoek, dicht bij het hoekpunt.', am:{vx:V.x,vy:V.y,a0:d1,a1:d2,r:10}}, {say:'Kies Benoem, tik in de hoek en klik op α.', lb:{p:polar(V,17,(d1+d2)/2), s:'α'}, wait:900}] });
      const L = R.int(35,55); const c1 = P(R.int(40,60), R.int(25,40)), c2 = P(R.int(130,160), R.int(55,75));
      const [p1,q1] = segAround(c1, L, R.int(-30,30)), [p2,q2] = segAround(c2, L, R.int(60,120));
      qBlock(b, st, save, 'm7', { demoFirst:true, nr:'b.', html:`De lijnstukken [${nA}${nB}] en [${nC}${nD}] zijn even lang. Toon dat met <b>hetzelfde merkteken</b> op beide lijnstukken.`, block:true,
        board:{w:200, h:100, tools:['tick','eraser'], given:[G.seg(p1,q1), ptEnd(p1,q1,nA), ptEnd(q1,p1,nB), G.seg(p2,q2), ptEnd(p2,q2,nC), ptEnd(q2,p2,nD)]},
        check:(v,c,B)=>{ const t1 = CK.ticksOn(B,p1,q1), t2 = CK.ticksOn(B,p2,q2);
          if(!t1.length || !t2.length) return {ok:false, msg:'Zet op <b>allebei</b> de lijnstukken een merkteken: kies <b>Merkteken</b> en tik op het lijnstuk.'};
          if(t1[0]!==t2[0]) return {ok:false, msg:`Het merkteken moet hetzelfde zijn: nu staan er ${t1[0]} en ${t2[0]} streepjes.`};
          return {ok:true, msg:`|${nA}${nB}| = |${nC}${nD}|`}; },
        demo:()=>[{say:'Kies Merkteken en tik op elk lijnstuk.', tk:{p:mid(p1,q1), dir:dirAng(p1,q1), n:1}}, {tk:{p:mid(p2,q2), dir:dirAng(p2,q2), n:1}, wait:900}] });
      const Pp = P(R.int(80,120), R.int(40,60)); const dg = R.int(-35,35);
      const [s1a,s1b] = segAround(Pp, 110, dg); const off = polar(Pp, 18, dg+90); const [s2a,s2b] = segAround(off, 100, dg+R.int(8,20));
      qBlock(b, st, save, 'm8', { demoFirst:true, nr:'c.', html:`Hier staan twee lijnen. Gom de lijn uit die <b>niet</b> door punt ${nP} gaat.`, block:true,
        board:{w:200, h:100, tools:['eraser'], user:[{t:'seg',x1:s1a.x,y1:s1a.y,x2:s1b.x,y2:s1b.y},{t:'seg',x1:s2a.x,y1:s2a.y,x2:s2b.x,y2:s2b.y}], given:[G.pt(Pp,nP)]},
        check:(v,c,B)=>{ const s = B.segs(); const thr = s.filter(x=>lineDist(Pp,x.a,x.b)<.5), oth = s.filter(x=>lineDist(Pp,x.a,x.b)>=.5);
          if(!thr.length) return {ok:false, msg:`Oeps, je gomde ook de lijn door ${nP} uit. Klik op ↶ om dat ongedaan te maken.`};
          if(oth.length) return {ok:false, msg:`De lijn die niet door ${nP} gaat, staat er nog. Kies <b>Gom</b> en wrijf erover.`};
          return {ok:true}; },
        demo:()=>[{say:'Kies <b>Gom</b> en wrijf over de lijn die niet door '+nP+' gaat.', rub:[s2a,s2b]}, {wait:700}] });
    }}
  ]};

/* ---------------- LIJNSTUKKEN METEN ---------------- */
function measCheck(vals, i0, Lmm, name){
  const c = parseNum(vals[i0]), m = parseNum(vals[i0+1]); const f = [null,null];
  let msg = '';
  if(isNaN(c) || isNaN(m)) return {ok:false, f:[isNaN(c)?false:null, isNaN(m)?false:null], msg:`|${name}|: typ enkel een getal.`};
  const okC = Math.abs(c*10 - Lmm) <= 1.05, okM = Math.abs(m - Lmm) <= 1.05;
  f[0]=okC; f[1]=okM;
  if(!okC){ if(Math.abs(c - Lmm) <= 1.05) msg = `|${name}|: in het eerste vakje noteer je cm, niet mm.`; else if(Math.abs(c*10-Lmm)<=6) msg = `|${name}|: je zit er net naast. Leg het nulpunt precies op het eerste punt en zoom in.`; else msg = `|${name}| is niet juist gemeten.`; }
  else if(!okM){ msg = Math.abs(m*10 - Lmm) <= 1.05 ? `|${name}|: 1 cm = 10 mm, dus vermenigvuldig met 10.` : `|${name}|: herleid je cm naar mm (1 cm = 10 mm).`; }
  else if(Math.abs(m - c*10) > .01){ f[1]=false; return {ok:false, f, msg:`|${name}|: je cm en mm komen niet overeen.`}; }
  return {ok: okC && okM, f, msg};
}
function twoSegFig(R, letters, opt={}){
  const L1 = R.int(opt.min||24, opt.max||74), L2 = R.int(opt.min||24, opt.max||74);
  const [a1,b1,a2,b2] = pickIn(R, ()=>{ const c1 = P(R.int(46,56), R.int(22,48)), c2 = P(R.int(140,154), R.int(22,52)); return [...segAround(c1, L1, R.int(-50,50)), ...segAround(c2, L2, R.int(-50,50))]; }, 200, 120, 8);
  const [n1,n2,n3,n4] = letters;
  return { L:[L1,L2], S:[[a1,b1],[a2,b2]], N:[[n1,n2],[n3,n4]],
    given:[G.seg(a1,b1), ptEnd(a1,b1,n1), ptEnd(b1,a1,n2), G.seg(a2,b2), ptEnd(a2,b2,n3), ptEnd(b2,a2,n4)] };
}

/* herleiden met decimale strings (geen afrondingsfouten) */
const UNITS = ['km','hm','dam','m','dm','cm','mm'];
function shiftDec(s, n){
  let [ip, fp=''] = String(s).split(','); let digits = ip + fp; let pos = ip.length + n;
  if(pos <= 0){ digits = '0'.repeat(1-pos) + digits; pos = 1; }
  if(pos > digits.length) digits = digits + '0'.repeat(pos - digits.length);
  const ni = digits.slice(0,pos).replace(/^0+(?=\d)/,''), nf = digits.slice(pos).replace(/0+$/,'');
  return nf ? ni+','+nf : ni;
}
function normDecInput(v){
  let t = String(v).replace(/\s+/g,'');
  if(t.includes(',')) t = t.replace(/\./g,''); else if((t.match(/\./g)||[]).length===1) t = t.replace('.',',');
  if(!/^\d*(,\d*)?$/.test(t) || t==='' || t===',') return null;
  if(t.startsWith(',')) t = '0'+t;
  return shiftDec(t, 0);
}
const groupThousands = s => { const [i,f] = s.split(','); const g = i.replace(/\B(?=(\d{3})+(?!\d))/g,' '); return f ? g+','+f : g; };
function convTable(val, from, to){
  const [ip, fp=''] = val.split(',');
  const fi = UNITS.indexOf(from), ti = UNITS.indexOf(to);
  /* kolom van elk cijfer */
  const cells = {}; for(let k=0;k<ip.length;k++) cells[fi-(ip.length-1-k)] = ip[k]; for(let k=0;k<fp.length;k++) cells[fi+1+k] = fp[k];
  const keys = Object.keys(cells).map(Number);
  let lo = Math.min(...keys, ti, fi), hi = Math.max(...keys, ti, fi);
  /* aanvullen met nullen tussen het cijfer en de nieuwe kolom */
  const filled = {};
  for(let c=lo;c<=hi;c++){ if(cells[c]==null){ const left = keys.some(k=>k<c), right = keys.some(k=>k>c); if((c<=ti && !left && c>=Math.min(ti,...keys)) || (c<=ti && left && !right) || (left && right)) filled[c]=true; } }
  let h = '<table class="conv"><tr>'; for(let c=lo;c<=hi;c++) h += `<th>${UNITS[c]||''}</th>`; h += '</tr><tr>';
  for(let c=lo;c<=hi;c++){ const d = cells[c]!=null ? cells[c] : (filled[c] ? '0' : ''); const cl = ['dig']; if(c===ti) cl.push('comma'); h += `<td class="${cl.join(' ')}" style="${c===fi && c!==ti ? 'border-right:2px dashed #95aaae;' : ''}${filled[c]?'color:var(--coral);':''}">${d}</td>`; }
  return h + '</tr></table>';
}
function convItem(R){
  const pairs = [['dm','cm'],['mm','cm'],['m','km'],['mm','cm'],['m','km'],['cm','m'],['mm','m'],['cm','m'],['km','m'],['m','cm'],['dm','mm'],['km','cm'],['hm','m'],['dam','dm'],['cm','dm'],['m','mm'],['km','dm'],['mm','dm']];
  const [from,to] = R.pick(pairs);
  const shift = UNITS.indexOf(to) - UNITS.indexOf(from);
  let val;
  const kind = R.int(0,3);
  if(kind===0) val = String(R.int(2,99));
  else if(kind===1) val = String(R.int(100,9999));
  else if(kind===2) val = R.int(0,99) + ',' + R.int(1,9);
  else val = R.int(0,9) + ',' + String(R.int(1,99)).padStart(2,'0');
  val = shiftDec(val, 0);
  const ans = shiftDec(val, shift);
  return {val, from, to, ans};
}
function convQ(it){
  return { html:`${groupThousands(it.val)} ${it.from} = [[0:md]] ${it.to}`, size:'', mode:'decimal', tv:[it.ans],
    check:v=>{ const n = normDecInput(v[0]); if(n==null) return {ok:false, msg:'Typ een getal (gebruik een komma).'};
      if(n===it.ans) return {ok:true};
      const sh = UNITS.indexOf(it.to)-UNITS.indexOf(it.from);
      if(n===shiftDec(it.val, -sh)) return {ok:false, msg:`Je verschoof de komma de verkeerde kant op. Van ${it.from} naar ${it.to} is een ${sh>0?'kleinere':'grotere'} eenheid, dus het getal wordt ${sh>0?'groter':'kleiner'}.`};
      for(let d=-3; d<=3; d++){ if(d && n===shiftDec(it.val, sh+d)) return {ok:false, msg:`De komma staat ${Math.abs(d)} plaats${Math.abs(d)>1?'en':''} te ver naar ${d>0?'rechts':'links'}. Gebruik de tabel.`}; }
      return {ok:false}; },
    sol:`Zet ${groupThousands(it.val)} in de tabel met het cijfer van de eenheden in de kolom <b>${it.from}</b>. Schuif de komma naar de kolom <b>${it.to}</b>:` + convTable(it.val, it.from, it.to) + `${groupThousands(it.val)} ${it.from} = <b>${groupThousands(it.ans)} ${it.to}</b>` };
}

SEC.meten = { id:'meten', ic:'liniaal', nav:'Lijnstukken meten', title:'Lijnstukken meten en herleiden',
  tip:'Meten doe je zo: leg het <b>nulpunt</b> van je geodriehoek op een grenspunt, leg de <b>tekenzijde</b> langs het lijnstuk en lees af bij het andere grenspunt. Werk tot op 1 mm nauwkeurig. Zoom in als het moeilijk wordt.',
  cheat:`<h3>Spiekbriefje · herleiden</h3><table class="conv"><tr><th>km</th><th>hm</th><th>dam</th><th>m</th><th>dm</th><th>cm</th><th>mm</th></tr><tr><td>1000 m</td><td>100 m</td><td>10 m</td><td>1 m</td><td>0,1 m</td><td>0,01 m</td><td>0,001 m</td></tr></table><p>Naar een <b>kleinere</b> eenheid (naar rechts): het getal wordt groter. Naar een <b>grotere</b> eenheid (naar links): het getal wordt kleiner. 1 cm = 10 mm.</p>`,
  cards:[
  { title:'Meet de lijnstukken', lvl:1, instr:'Meet met je geodriehoek. Noteer de lengte in cm en herleid naar mm.', build:(b,st,save,key)=>{
      const R = makeR(st);
      ['a.','b.'].forEach((nr,qi)=>{
        const F = twoSegFig(R, R.letters(4));
        const [[n1,n2],[n3,n4]] = F.N;
        qBlock(b, st, save, 'q'+qi, { nr, block:true, html:'',
          html2:`<div class="step"><span>|${n1}${n2}| = [[0:xs]] cm = [[1:xs]] mm</span></div><div class="step"><span>|${n3}${n4}| = [[2:xs]] cm = [[3:xs]] mm</span></div>`, block2:true, mode:'decimal',
          board:{w:200, h:120, tools:['pencil','eraser','geo'], given:F.given},
          tv:[F.L[0]/10, F.L[0], F.L[1]/10, F.L[1]].map(x=>fmtN(x)),
          check:v=>{ const r1 = measCheck(v,0,F.L[0],n1+n2), r2 = measCheck(v,2,F.L[1],n3+n4);
            const ok = r1.ok && r2.ok; return {ok, fields:[...r1.f, ...r2.f], msg: ok ? 'Nauwkeurig gemeten!' : [r1.msg, r2.msg].filter(Boolean).join(' ')}; },
          demo:()=>[...DM.measure(F.S[0][0],F.S[0][1],n1,n2,cmTxt(F.L[0])), ...DM.measure(F.S[1][0],F.S[1][1],n3,n4,cmTxt(F.L[1]))],
          sol:`|${n1}${n2}| = ${cmTxt(F.L[0])} = ${F.L[0]} mm<br>|${n3}${n4}| = ${cmTxt(F.L[1])} = ${F.L[1]} mm<br><small>Een afwijking van 1 mm wordt goedgekeurd.</small>` });
      });
    }},
  { title:'Herleid', lvl:1, instr:'Gebruik de tabel van het spiekbriefje. Na een fout antwoord zie je de oplossing in de tabel.', build:(b,st,save,key)=>{
      const R = makeR(st); const seen = new Set(); const items = [];
      while(items.length<8){ const it = convItem(R); const k = it.from+it.to; if(seen.has(k) && R.f()<.7) continue; seen.add(k); items.push(it); }
      const grid = el('div','tf-grid'); b.append(grid);
      items.forEach((it,i)=>qBlock(grid, st, save, 'c'+i, Object.assign({nr:LET[i]+'.'}, convQ(it))));
    }},
  { title:'Welke eenheid ontbreekt?', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st);
      const grid = el('div','tf-grid'); b.append(grid);
      for(let i=0;i<6;i++){ const it = convItem(R);
        qBlock(grid, st, save, 'u'+i, { nr:LET[i]+'.', html:`${groupThousands(it.val)} ${it.from} = ${groupThousands(it.ans)} …`, choice:UNITS.map(u=>[u,u]), choiceLast:true, tc:it.to,
          check:(v,c)=>({ok:c===it.to, choiceOk:c===it.to, msg: c===it.to ? '' : 'Kijk hoeveel plaatsen de komma verschoven is.'}), sol:convTable(it.val, it.from, it.to) }); }
    }},
  { title:'Schrijf in symbolen', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st); const [a,c,d,e,f,g,h,m] = R.letters(8); const len = fmtN(R.int(21,95)/10);
      const Q = [
        [`Het lijnstuk [${a}${c}] is ${len} cm lang.`, [`|${a}${c}| = ${len} cm`, `[${a}${c}] = ${len} cm`, `${a}${c} = ${len} cm`, `|${a}${c}| ≠ ${len} cm`], 'De lengte van een lijnstuk noteer je met verticale streepjes: |…|.'],
        [`De lijnstukken [${d}${e}] en [${f}${g}] zijn even lang.`, [`|${d}${e}| = |${f}${g}|`, `[${d}${e}] = [${f}${g}]`, `${d}${e} = ${f}${g}`, `|${d}${e}| ≠ |${f}${g}|`], '[DE] = [FG] zou betekenen dat het dezelfde lijnstukken zijn. Hier gaat het over de lengtes.'],
        [`De lijnstukken [${a}${h}] en [${c}${m}] zijn niet even lang.`, [`|${a}${h}| ≠ |${c}${m}|`, `|${a}${h}| = |${c}${m}|`, `[${a}${h}] ≠ [${c}${m}]`, `${a}${h} ≠ ${c}${m}`], 'Niet even lang: de lengtes zijn verschillend, dus |…| ≠ |…|.'],
        [`${m} is het midden van [${f}${g}].`, [`${m} ∈ [${f}${g}] en |${f}${m}| = |${m}${g}|`, `|${f}${m}| = |${m}${g}|`, `${m} ∈ [${f}${g}] en |${f}${m}| = |${f}${g}|`, `[${f}${m}] = [${m}${g}]`], 'Het midden ligt óp het lijnstuk én even ver van beide grenspunten.']
      ];
      Q.forEach(([txt,opts,why],i)=>{ const sh = R.shuffle(opts.map((o,k)=>[k===0?'ok':'x'+k, o])); qChoice(b, st, save, 's'+i, {nr:(i+1)+'.', html:txt, opts:sh, ans:'ok', why, whyBad:why}); });
    }},
  { title:'Op schaal', lvl:3, instr:'Meet elk lijnstuk op de tekening tot op 1 mm. Reken daarna om met de schaal.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const sc = R.pick([50,100,200,500]);
      const names = R.letters(4);
      let pts, ok=false, tries=0;
      while(!ok && tries<200){ tries++;
        pts = [P(R.int(18,50), R.int(20,95))]; let d = R.int(-40,40);
        for(let i=1;i<4;i++){ d += R.sign()*R.int(50,120); const L = R.int(38,68); pts.push(polar(pts[i-1], L, d)); }
        ok = pts.every(p=>p.x>10 && p.x<190 && p.y>10 && p.y<110) && dist(pts[0],pts[3])>25 && dist(pts[0],pts[2])>25 && dist(pts[1],pts[3])>25;
      }
      const L = [0,1,2].map(i=>dist(pts[i],pts[i+1]));
      /* afronden op hele mm voor een zuivere opgave */
      for(let i=1;i<4;i++){ const Li = Math.round(L[i-1]); pts[i] = polar(pts[i-1], Li, dirAng(pts[i-1], pts[i])); }
      const Lr = [0,1,2].map(i=>Math.round(dist(pts[i],pts[i+1])));
      const given = []; for(let i=0;i<3;i++) given.push(G.seg(pts[i],pts[i+1],{dash:'2 1.2'}));
      pts.forEach((p,i)=>given.push(ptOff(p, i===0? dirAng(pts[1],p) : i===3 ? dirAng(pts[2],p) : bisDir(dirAng(p,pts[i-1]),dirAng(p,pts[i+1]))+180, names[i])));
      const tot = Lr.reduce((a,c)=>a+c,0);
      const realM = tot*sc/1000;
      qBlock(b, st, save, 'sch', { block:true, html:`Vier vrienden spelen voetbal. ${names[0]} past naar ${names[1]}, ${names[1]} naar ${names[2]} en ${names[2]} naar ${names[3]}. De tekening is op schaal <b>1 : ${sc}</b>. Welke afstand legt de bal in werkelijkheid af?`,
        html2:`<div class="step">|${names[0]}${names[1]}| = [[0:xs]] cm &nbsp; |${names[1]}${names[2]}| = [[1:xs]] cm &nbsp; |${names[2]}${names[3]}| = [[2:xs]] cm</div><div class="step">In werkelijkheid: [[3:xs]] m</div>`, block2:true, mode:'decimal',
        board:{w:200, h:120, tools:['pencil','eraser','geo'], given}, tv:[...Lr.map(x=>fmtN(x/10)), fmtN(realM)],
        check:v=>{ const f = []; let msg='';
          const cm = [0,1,2].map(i=>parseNum(v[i]));
          cm.forEach((c,i)=>{ const ok = !isNaN(c) && Math.abs(c*10-Lr[i])<=1.05; f.push(ok); if(!ok && !msg) msg = `Meet |${names[i]}${names[i+1]}| nog eens.`; });
          const t = parseNum(v[3]); const own = cm.reduce((a,c)=>a+(isNaN(c)?0:c),0)*sc/100;
          const okT = !isNaN(t) && (Math.abs(t-realM) <= 3*sc/1000 + 1e-9 || (f.every(Boolean) && Math.abs(t-own)<0.006));
          f.push(okT);
          if(!okT && !msg){ msg = Math.abs(t*100 - own) < 0.01*own+1e-9 ? 'Je antwoord staat in cm. Herleid nog naar m.' : `Tel de lengtes op tekening op en vermenigvuldig met ${sc}: 1 cm op de tekening is ${sc} cm in werkelijkheid. Herleid dan naar m.`; }
          return {ok:f.every(Boolean), fields:f, msg}; },
        demo:()=>[0,1,2].flatMap(i=>DM.measure(pts[i],pts[i+1],names[i],names[i+1],cmTxt(Lr[i]))),
        sol:`Op de tekening: ${Lr.map(x=>fmtN(x/10)).join(' + ')} = ${fmtN(tot/10)} cm.<br>Schaal 1 : ${sc} → in werkelijkheid ${fmtN(tot/10)} cm · ${sc} = ${fmtN(tot*sc/10)} cm = <b>${fmtN(realM)} m</b>.` });
    }},
  { title:'Vier punten op één rechte', lvl:3, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nA,nB,nC,nD] = R.letters(4);
      let ab = R.int(2,6), bc = R.int(2,6), cd = R.int(2,7); while(cd===bc) cd = R.int(2,7);
      ab = R.f()<.5 ? ab : ab+0.5;
      b.append(el('p','instructions', `De punten ${nA}, ${nB}, ${nC} en ${nD} liggen op één rechte (ze zijn <b>collineair</b>). |${nA}${nB}| = ${fmtN(ab)} cm, |${nB}${nC}| = ${bc} cm en |${nC}${nD}| = ${cd} cm. Schuif de punten op de rechte om alle mogelijkheden te zien.`));
      const sx = 10, y = 22, cmw = 11;
      const snap = x => sx + Math.round((x-sx)/(cmw/2))*(cmw/2);
      const start = [3,6,10,14];
      const pts = {}; [nA,nB,nC,nD].forEach((n,i)=>pts[n] = {x:sx+start[i]*cmw, y, drag:true, c:p=>({x:clamp(snap(p.x), sx, sx+20*cmw), y})});
      dynFig(b, { w:240, h:40, maxw:820, pts,
        draw:Pt=>{ let s = `<line x1="4" y1="${y}" x2="236" y2="${y}" stroke="${INK}" stroke-width=".4"/>`;
          for(let k=0;k<=20;k++){ const x = sx+k*cmw; s += `<line x1="${x}" y1="${y+5}" x2="${x}" y2="${y+7.5}" stroke="#95aaae" stroke-width=".25"/><text x="${x}" y="${y+11}" font-size="3" text-anchor="middle" fill="#95aaae">${k}</text>`; }
          s += `<text x="236" y="${y+11}" font-size="3" text-anchor="end" fill="#95aaae">cm</text>`;
          Object.entries(Pt).forEach(([k,p])=>{ s += objSVG({t:'pt',x:p.x,y:p.y,name:k,ly:-5}); }); return s; },
        info:Pt=>{ const dd = (a,b2)=>fmtN(Math.abs(Pt[a].x-Pt[b2].x)/cmw); return `|${nA}${nB}| = ${dd(nA,nB)} cm &nbsp; |${nB}${nC}| = ${dd(nB,nC)} cm &nbsp; |${nC}${nD}| = ${dd(nC,nD)} cm &nbsp;→&nbsp; <b>|${nB}${nD}| = ${dd(nB,nD)} cm</b>`; } });
      const a1 = bc+cd, a2 = Math.abs(bc-cd);
      qBlock(b, st, save, 'bd', { tv:[String(a1).replace('.',','), String(a2).replace('.',',')], html:`Hoe lang kan [${nB}${nD}] zijn? Er zijn twee mogelijkheden: [[0:xs]] cm of [[1:xs]] cm.`, mode:'decimal',
        check:v=>{ const x = [parseNum(v[0]), parseNum(v[1])]; const want = [a1,a2];
          const f = x.map(z=>want.some(w=>Math.abs(w-z)<1e-9)); const ok = f.every(Boolean) && Math.abs(x[0]-x[1])>1e-9;
          return {ok, fields:f, msg: ok ? `${nD} ligt aan dezelfde kant als ${nC} of aan de andere kant van ${nC}. |${nA}${nB}| speelt geen rol!` : 'Leg eerst [' + nB + nC + '] en schuif dan ' + nD + ' op ' + cd + ' cm van ' + nC + ', links of rechts.'}; },
        sol:`${nD} rechts van ${nC} (verder weg van ${nB}): |${nB}${nD}| = ${bc} + ${cd} = <b>${a1} cm</b>.<br>${nD} aan de kant van ${nB}: |${nB}${nD}| = |${bc} − ${cd}| = <b>${a2} cm</b>.` });
    }}
  ]};

/* ---------------- LIJNSTUKKEN TEKENEN EN CONSTRUEREN ---------------- */
function rayGiven(C, dir, len, nC, nX){ const X = polar(C, len, dir); return [G.ray(C, polar(C, len+12, dir)), ptOff(C, dir+180, nC), ptOff(X, dir+90, nX, 3.6), Object.assign(G.pt(X,''),{small:true})]; }

SEC.construeren = { id:'construeren', ic:'passer', nav:'Lijnstukken tekenen', title:'Lijnstukken tekenen, het midden en construeren',
  intro: VERBS,
  cards:[
  { title:'Teken lijnstukken met een gegeven lengte', lvl:1, instr:'Trek het lijnstuk langs je geodriehoek en zet een punt aan het einde. Geef het eindpunt de juiste naam.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const opts = [ L=>`${fmtN(L/10)} cm`, L=>`${L} mm`, L=>`${fmtN(L/100)} dm`, L=>`${fmtN(L/10)} cm` ];
      ['a.','b.'].forEach((nr,qi)=>{
        const [n1,n2,n3,n4] = R.letters(4);
        const L1 = R.int(30,75), L2 = R.int(25,70);
        const u1 = R.pick(opts), u2 = R.pick(opts.filter(o=>o!==u1));
        const A = P(R.int(20,45), R.int(18,35)), Cc = P(R.int(20,45), R.int(55,75));
        qBlock(b, st, save, 't'+qi, { nr, block:true, html:`Teken [${n1}${n2}] met |${n1}${n2}| = <b>${u1(L1)}</b> en [${n3}${n4}] met |${n3}${n4}| = <b>${u2(L2)}</b>.`,
          board:{w:200, h:110, tools:['pencil','eraser','label','geo'], given:[ptOff(A,135,n1), ptOff(Cc,135,n3)]},
          check:(v,c,B)=>{ const r1 = lenCheck(B, B.gpt(n1), n2, L1, u1(L1)); if(!r1.ok) return r1; const r2 = lenCheck(B, B.gpt(n3), n4, L2, u2(L2)); if(!r2.ok) return r2; return {ok:true, msg:'Precies getekend!'}; },
          demo:B=>{ const d1 = (()=>{ const p=B.pt(n2); return p? dirAng(A,p) : 0; })(), d2 = (()=>{ const p=B.pt(n4); return p? dirAng(Cc,p) : 0; })();
            return [...DM.drawSeg(A, d1, L1, n1, n2, cmTxt(L1)), ...DM.drawSeg(Cc, d2, L2, n3, n4, cmTxt(L2))]; },
          sol:`${u1(L1)} = ${cmTxt(L1)} en ${u2(L2)} = ${cmTxt(L2)}.` });
      });
    }},
  { title:'Duid het midden aan', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nC,nD,nM] = R.letters(3);
      const L = 2*R.int(20,38); /* altijd een even aantal mm: het midden valt op een hele mm */ const dir = R.int(-35,35);
      const c = P(R.int(85,115), R.int(28,45)); const [C,D] = segAround(c, L, dir); const Mt = mid(C,D);
      qBlock(b, st, save, 'mid', { block:true, html:`Meet [${nC}${nD}]. Duid het midden ${nM} aan en zet <b>merktekens</b> om te tonen dat [${nC}${nM}] en [${nM}${nD}] even lang zijn.`,
        html2:`<div class="step">|${nC}${nD}| = [[0:xs]] cm, dus |${nC}${nM}| = |${nM}${nD}| = [[1:xs]] cm</div>`, block2:true, mode:'decimal', tv:[fmtN(L/10), fmtN(L/20)],
        board:{w:200, h:110, tools:['pencil','eraser','label','tick','geo'], given:[G.seg(C,D), ptEnd(C,D,nC), ptEnd(D,C,nD)]},
        check:(v,c2,B)=>{ const a = parseNum(v[0]), h = parseNum(v[1]); const f = [Math.abs(a*10-L)<=1.05, Math.abs(h*10-L/2)<=.8 && Math.abs(h-a/2)<=.051];
          if(!f[0]) return {ok:false, fields:f, msg:`Meet |${nC}${nD}| nog eens nauwkeurig.`};
          if(!f[1]) return {ok:false, fields:f, msg:`Het midden ligt op de helft: ${fmtN(a)} : 2 = ${fmtN(a/2)} cm.`};
          const r = CK.needPt(B, nM); if(r.err) return {ok:false, fields:f, msg:r.err};
          const M = r.p; if(segDist(M,C,D) > .7) return {ok:false, fields:f, msg:`${nM} moet óp het lijnstuk [${nC}${nD}] liggen.`};
          const d1 = dist(C,M), d2 = dist(M,D);
          if(Math.abs(d1-d2) > 1.4) return {ok:false, fields:f, msg:`${nM} ligt niet in het midden: |${nC}${nM}| = ${mmTxt(d1)} en |${nM}${nD}| = ${mmTxt(d2)}. Leg het nulpunt op ${nC} en zet ${nM} bij ${fmtN(L/20)} cm.`};
          const t1 = CK.ticksOn(B,C,M), t2 = CK.ticksOn(B,M,D);
          if(!t1.length || !t2.length) return {ok:false, fields:f, msg:`${nM} staat goed. Zet nu op [${nC}${nM}] én op [${nM}${nD}] hetzelfde merkteken.`};
          if(t1[0]!==t2[0]) return {ok:false, fields:f, msg:'Gebruik op beide stukken hetzelfde merkteken (evenveel streepjes).'};
          return {ok:true, fields:f, msg:`${nM} is het midden van [${nC}${nD}] ⟺ ${nM} ∈ [${nC}${nD}] en |${nC}${nM}| = |${nM}${nD}|.`}; },
        demo:()=>[...DM.measure(C,D,nC,nD,cmTxt(L)), {say:`De helft van ${cmTxt(L)} is ${fmtN(L/20)} cm. Zet daar het punt ${nM}.`, pt:Mt, name:nM, lx:polar(P(0,0),3.6,dir+90).x, ly:polar(P(0,0),3.6,dir+90).y}, {geoOff:true, say:'Zet hetzelfde merkteken op de twee helften.', tk:{p:mid(C,Mt), dir, n:1}}, {tk:{p:mid(Mt,D), dir, n:1}, wait:900}] });
      qChoice(b, st, save, 'def', { html:`Welke uitspraak betekent: “${nM} is het midden van [${nC}${nD}]”?`, ans:'ok',
        opts: R.shuffle([['ok',`${nM} ∈ [${nC}${nD}] en |${nC}${nM}| = |${nM}${nD}|`],['a',`|${nC}${nM}| = |${nM}${nD}|`],['b',`${nM} ∈ [${nC}${nD}]`],['c',`${nM} ∈ [${nC}${nD}] en |${nC}${nM}| = |${nC}${nD}|`]]),
        why:'Het midden ligt óp het lijnstuk en even ver van de twee grenspunten.', whyBad:'Beide voorwaarden zijn nodig: het punt ligt op het lijnstuk én even ver van beide grenspunten.' });
    }},
  { title:'Teken, halveer en teken opnieuw', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nR,nS,nU,nK,nL] = R.letters(5);
      const L = 2*R.int(25,38);
      const Rp = P(R.int(18,35), R.int(20,35));
      qBlock(b, st, save, 'ths', { block:true, html:`1) Teken [${nR}${nS}] met |${nR}${nS}| = ${cmTxt(L)}. 2) Duid het midden ${nU} aan (met merktekens). 3) Teken ergens anders een lijnstuk [${nK}${nL}] zodat |${nK}${nL}| = |${nR}${nU}|.`,
        board:{w:200, h:115, tools:['pencil','eraser','label','tick','geo'], given:[ptOff(Rp,135,nR)]},
        check:(v,c,B)=>{ const Rg = B.gpt(nR); const r1 = lenCheck(B, Rg, nS, L); if(!r1.ok) return r1;
          const S = B.pt(nS); const r = CK.needPt(B, nU); if(r.err) return {ok:false, msg:r.err};
          const U = r.p; if(segDist(U,Rg,S)>.7 || Math.abs(dist(Rg,U)-dist(U,S))>1.4) return {ok:false, msg:`${nU} ligt niet in het midden van [${nR}${nS}]. Dat is bij ${fmtN(L/20)} cm.`};
          const t1 = CK.ticksOn(B,Rg,U), t2 = CK.ticksOn(B,U,S); if(!t1.length || !t2.length || t1[0]!==t2[0]) return {ok:false, msg:`Zet hetzelfde merkteken op [${nR}${nU}] en [${nU}${nS}].`};
          const rk = CK.needPt(B,nK), rl = CK.needPt(B,nL); if(rk.err) return {ok:false, msg:rk.err}; if(rl.err) return {ok:false, msg:rl.err};
          if(!CK.hasSeg(B, rk.p, rl.p)) return {ok:false, msg:`Teken ook het lijnstuk [${nK}${nL}].`};
          if(Math.abs(dist(rk.p,rl.p) - L/2) > 1.05) return {ok:false, msg:`|${nK}${nL}| is ${mmTxt(dist(rk.p,rl.p))}, maar |${nR}${nU}| = ${fmtN(L/20)} cm.`};
          return {ok:true, msg:`|${nR}${nU}| = |${nU}${nS}| = |${nK}${nL}| = ${fmtN(L/20)} cm`}; },
        demo:()=>{ const S = polar(Rp,L,0), U = polar(Rp,L/2,0), K = P(Rp.x, Rp.y+45), Lp = polar(K,L/2,0);
          return [...DM.drawSeg(Rp, 0, L, nR, nS, cmTxt(L)), {say:`De helft is ${fmtN(L/20)} cm: zet ${nU}.`, pt:U, name:nU, ly:4}, {tk:{p:mid(Rp,U),dir:0,n:1}}, {tk:{p:mid(U,S),dir:0,n:1}}, ...DM.drawSeg(K, 0, L/2, '', nL, fmtN(L/20)+' cm'), {pt:K, name:nK, lx:-3, ly:0}, {geoOff:true, wait:800}]; } });
    }},
  { title:'Construeer een even lang lijnstuk', lvl:2, instr:'Construeren = zonder meten. Je geodriehoek heeft hier geen getallen. Gebruik je passer en laat je constructie staan.', build:(b,st,save,key)=>{
      const R = makeR(st);
      ['a.','b.'].forEach((nr,qi)=>{
        const [nA,nB,nC,nX,nD] = R.letters(5);
        const L = R.int(32,62); const [A,Bq] = pickIn(R, ()=>{ const a = P(R.int(22,45), R.int(12,40)); return [a, polar(a, L, R.int(-30,30))]; }, 200, 60, 8);
        const [C] = pickIn(R, ()=>{ const c = P(R.int(25,40), R.int(62,100)); return [c, polar(c,124,dir0=R.int(-15,25))]; }, 200, 120, 6); const dir = dir0;
        const Dt = polar(C, L, dir);
        qBlock(b, st, save, 'c'+qi, { nr, block:true, html:`Construeer op [${nC}${nX} een lijnstuk [${nC}${nD}] met |${nC}${nD}| = |${nA}${nB}|, <b>zonder [${nA}${nB}] te meten</b>. Noem het eindpunt ${nD}.`,
          board:{w:200, h:120, tools:['pencil','eraser','label','tick','geo','compass'], geo:{mode:'constructie', on:false}, compass:{on:true, pose:{cx:150,cy:45,px:178,py:45}},
            given:[G.seg(A,Bq), ptEnd(A,Bq,nA), ptEnd(Bq,A,nB), ...rayGiven(C, dir, 110, nC, nX)]},
          check:(v,c,B)=>{ const arcs = CK.arcsAt(B, C, null);
            if(!arcs.length) return {ok:false, msg:`Je hebt niet geconstrueerd: er staat geen passerboog rond ${nC}. Neem |${nA}${nB}| in je passer en zet de naald in ${nC}.`};
            if(!arcs.some(a=>Math.abs(a.r-L)<=1.05)) return {ok:false, msg:`Je boog rond ${nC} heeft niet de lengte van [${nA}${nB}]. Zet de naald in ${nA}, het potloodbeen in ${nB}, en verplaats de passer dan naar ${nC}.`};
            const r = CK.needPt(B, nD); if(r.err) return {ok:false, msg:`Je boog staat goed. ${r.err.replace('Zet het punt','Zet op het snijpunt van je boog en de halfrechte het punt')}`};
            const D = r.p; if(lineDist(D,C,polar(C,10,dir))>.8 || projT(D,C,polar(C,10,dir))<0) return {ok:false, msg:`${nD} moet op de halfrechte [${nC}${nX} liggen, waar je boog die snijdt.`};
            if(Math.abs(dist(C,D)-L) > 1.05) return {ok:false, msg:`${nD} ligt niet op het snijpunt van je boog en de halfrechte. Tik precies op dat snijpunt: je punt klikt er vast.`};
            return {ok:true, msg:`|${nC}${nD}| = |${nA}${nB}|, en je constructie staat er nog.`}; },
          demo:()=>[...DM.copyLen(A,Bq,C,dir,nA,nB,nC), {cmpOff:true, say:`Het snijpunt van je boog en [${nC}${nX} is ${nD}.`, pt:Dt, name:nD, lx:polar(P(0,0),4,dir-90).x, ly:polar(P(0,0),4,dir-90).y}, {wait:1000}],
          sol:`Werkwijze: passerpunt in ${nA}, potloodbeen in ${nB}. Behoud de opening, zet de passerpunt in ${nC} en teken een boogje dat [${nC}${nX} snijdt. Het snijpunt is ${nD}.` });
      });
    }},
  { title:'Construeer de som van twee lijnstukken', lvl:3, instr:'Zonder meten! Gebruik je passer twee keer na elkaar.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nA,nB,nE,nF,nP,nX,nQ,nR] = R.letters(8);
      const L1 = R.int(25,45), L2 = R.int(20,40);
      const [A,Bq,E,F] = pickIn(R, ()=>{ const a = P(R.int(15,30), R.int(12,35)), e = P(R.int(110,130), R.int(12,35)); return [a, polar(a, L1, R.int(-15,15)), e, polar(e, L2, R.int(-25,25))]; }, 200, 60, 8);
      const Pp = P(R.int(20,35), R.int(80,95)), dir = R.int(-8,12);
      qBlock(b, st, save, 'som', { block:true, html:`Construeer op [${nP}${nX} een lijnstuk [${nP}${nR}] met |${nP}${nR}| = |${nA}${nB}| + |${nE}${nF}|. Noem het tussenpunt ${nQ} (met |${nP}${nQ}| = |${nA}${nB}|).`,
        board:{w:200, h:120, tools:['pencil','eraser','label','tick','geo','compass'], geo:{mode:'constructie', on:false}, compass:{on:true, pose:{cx:160,cy:60,px:185,py:60}},
          given:[G.seg(A,Bq), ptEnd(A,Bq,nA), ptEnd(Bq,A,nB), G.seg(E,F), ptEnd(E,F,nE), ptEnd(F,E,nF), ...rayGiven(Pp, dir, 125, nP, nX)]},
        check:(v,c,B)=>{ const rq = CK.needPt(B,nQ); if(rq.err) return {ok:false, msg:rq.err}; const Q = rq.p;
          if(!CK.arcsAt(B,Pp,L1).length) return {ok:false, msg:`Er staat geen passerboog rond ${nP} met de lengte van [${nA}${nB}].`};
          if(Math.abs(dist(Pp,Q)-L1)>1.05 || lineDist(Q,Pp,polar(Pp,10,dir))>.8) return {ok:false, msg:`${nQ} moet het snijpunt zijn van je eerste boog en de halfrechte.`};
          const rr = CK.needPt(B,nR); if(rr.err) return {ok:false, msg:rr.err}; const Rr = rr.p;
          if(!CK.arcsAt(B,Q,L2).length) return {ok:false, msg:`Zet nu de naald in ${nQ} met de lengte van [${nE}${nF}] en teken een tweede boog.`};
          if(Math.abs(dist(Pp,Rr)-(L1+L2))>1.4 || lineDist(Rr,Pp,polar(Pp,10,dir))>.8) return {ok:false, msg:`${nR} moet verder op de halfrechte liggen, waar je tweede boog die snijdt (niet terug richting ${nP}).`};
          return {ok:true, msg:`|${nP}${nR}| = |${nA}${nB}| + |${nE}${nF}|`}; },
        demo:()=>{ const Q = polar(Pp,L1,dir), Rr = polar(Pp,L1+L2,dir); return [...DM.copyLen(A,Bq,Pp,dir,nA,nB,nP), {pt:Q, name:nQ, ly:4}, ...DM.copyLen(E,F,Q,dir,nE,nF,nQ), {cmpOff:true, pt:Rr, name:nR, ly:4, say:`${nR} ligt op |${nA}${nB}| + |${nE}${nF}| van ${nP}.`}, {wait:900}]; } });
    }},
  { title:'Construeer een driehoek uit drie lijnstukken', lvl:3, instr:'Zonder meten! Werk zoals in je boek: eerst [BC] op de halfrechte, dan twee bogen die elkaar snijden in A.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nA,nB,nC,nX] = R.letters(4);
      let a,bb,c; do{ a = R.int(55,78); bb = R.int(35,62); c = R.int(35,62); } while(bb+c < a+12 || Math.abs(bb-c) > a-12 || Math.abs(bb-c)<3);
      const segs = [[a,'a'],[bb,'b'],[c,'c']];
      const given = []; let y = 12;
      segs.forEach(([L,nm],i)=>{ const p0 = P(14 + i*0, y+i*11); const p1 = P(14+L, y+i*11); given.push(G.seg(p0,p1,{name:nm, nt:-.06, no:0}), Object.assign(G.pt(p0,''),{small:true}), Object.assign(G.pt(p1,''),{small:true})); });
      given.forEach(o=>{ if(o.t==='seg'){ o.name=''; } });
      segs.forEach(([L,nm],i)=>given.push(G.txt(P(8, y+i*11), nm, {size:4.2, italic:true})));
      const Bp = P(R.int(30,45), 108); const dir = R.int(-4,4);
      given.push(...rayGiven(Bp, dir, 135, nB, nX));
      const Ct = polar(Bp, a, dir);
      const At = circleCircle(Bp, c, Ct, bb).sort((p,q)=>p.y-q.y)[0];
      qBlock(b, st, save, 'tri', { block:true, html:`Construeer driehoek ${nA}${nB}${nC} met |${nB}${nC}| = <i>a</i>, |${nA}${nC}| = <i>b</i> en |${nA}${nB}| = <i>c</i>. Begin op de halfrechte [${nB}${nX}. Teken ${nA} boven de halfrechte.`,
        board:{w:200, h:125, tools:['pencil','eraser','label','tick','geo','compass'], geo:{mode:'constructie', on:false}, compass:{on:true, pose:{cx:165,cy:30,px:188,py:30}}, given},
        check:(v,c2,B)=>{ const rc = CK.needPt(B,nC); if(rc.err) return {ok:false, msg:rc.err}; const C = rc.p;
          if(lineDist(C,Bp,polar(Bp,10,dir))>.8 || Math.abs(dist(Bp,C)-a)>1.05) return {ok:false, msg:`${nC} moet op [${nB}${nX} liggen met |${nB}${nC}| = a. Neem a in je passer en zet de naald in ${nB}.`};
          const ra = CK.needPt(B,nA); if(ra.err) return {ok:false, msg:ra.err}; const A = ra.p;
          const e1 = Math.abs(dist(A,Bp)-c), e2 = Math.abs(dist(A,C)-bb);
          if(e1>1.1) return {ok:false, msg:`|${nA}${nB}| moet gelijk zijn aan c. Teken een boog rond ${nB} met opening c.`};
          if(e2>1.1) return {ok:false, msg:`|${nA}${nC}| moet gelijk zijn aan b. Teken een boog rond ${nC} met opening b.`};
          if(!CK.hasSeg(B,A,Bp) || !CK.hasSeg(B,A,C)) return {ok:false, msg:`${nA} staat goed. Teken nu de lijnstukken [${nA}${nB}] en [${nA}${nC}].`};
          if(!CK.arcsAt(B,Bp,c,1,1.1).length || !CK.arcsAt(B,C,bb,1,1.1).length) return {ok:false, info:true, msg:'Je driehoek klopt, maar laat je constructie staan: de passerbogen rond '+nB+' en '+nC+' moeten zichtbaar blijven.'};
          return {ok:true, msg:'Een perfect geconstrueerde driehoek!'}; },
        demo:()=>{ const oa = given.filter(o=>o.t==='seg'); const sp = i=>[P(oa[i].x1,oa[i].y1), P(oa[i].x2,oa[i].y2)];
          const [a0,a1] = sp(0), [b0,b1] = sp(1), [c0,c1] = sp(2); const dA = dirAng(Bp,At), dA2 = dirAng(Ct,At);
          return [...DM.copyLen(a0,a1,Bp,dir,'het begin van a','het einde van a',nB,10), {pt:Ct, name:nC, ly:4.5},
            ...DM.copyLen(c0,c1,Bp,dA,'het begin van c','het einde van c',nB,14), ...DM.copyLen(b0,b1,Ct,dA2,'het begin van b','het einde van b',nC,14),
            {cmpOff:true, say:`Het snijpunt van de twee bogen is ${nA}.`, pt:At, name:nA, ly:-4.5},
            {say:'Teken de lijnstukken langs je geodriehoek.', geo:geoOn(Bp,At)}, {line:[Bp,At]}, {geo:geoOn(Ct,At)}, {line:[Ct,At]}, {geoOff:true, wait:900}]; } });
    }},
  { title:'Construeer een gelijkzijdige driehoek', lvl:3, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nD,nE,nF] = R.letters(3);
      const L = R.int(45,75); const D = P(R.int(40,60), R.int(85,100)); const dir = R.int(-10,10); const E = polar(D,L,dir);
      const Ft = polar(D, L, dir+60);
      qBlock(b, st, save, 'gz', { block:true, html:`Vervolledig de driehoek zonder te meten, zodat |${nD}${nE}| = |${nE}${nF}| = |${nF}${nD}|. Zet ${nF} boven [${nD}${nE}] en duid met merktekens aan dat de zijden even lang zijn.`,
        board:{w:200, h:115, tools:['pencil','eraser','label','tick','geo','compass'], geo:{mode:'constructie', on:false}, compass:{on:true, pose:{cx:165,cy:30,px:188,py:30}}, given:[G.seg(D,E), ptEnd(D,E,nD), ptEnd(E,D,nE)]},
        check:(v,c,B)=>{ const rf = CK.needPt(B,nF); if(rf.err) return {ok:false, msg:rf.err}; const F = rf.p;
          if(Math.abs(dist(D,F)-L)>1.1 || Math.abs(dist(E,F)-L)>1.1) return {ok:false, msg:`${nF} ligt niet goed. Neem |${nD}${nE}| in je passer en teken een boog rond ${nD} én rond ${nE}. ${nF} is het snijpunt.`};
          if(!CK.hasSeg(B,D,F) || !CK.hasSeg(B,E,F)) return {ok:false, msg:`Teken de lijnstukken [${nD}${nF}] en [${nE}${nF}].`};
          if(!CK.arcsAt(B,D,L,1,1.1).length || !CK.arcsAt(B,E,L,1,1.1).length) return {ok:false, info:true, msg:'Laat je passerbogen staan: ze tonen dat je geconstrueerd hebt.'};
          const t = [CK.ticksOn(B,D,E), CK.ticksOn(B,E,F), CK.ticksOn(B,D,F)]; if(t.some(x=>!x.length) || new Set(t.map(x=>x[0])).size>1) return {ok:false, info:true, msg:'Bijna! Zet op de drie zijden hetzelfde merkteken.'};
          return {ok:true, msg:'Een gelijkzijdige driehoek!'}; },
        demo:()=>[{say:`Neem |${nD}${nE}| in je passer.`, cmp:{c:D, p:E}}, {say:`Teken een boog rond ${nD}, boven [${nD}${nE}].`, cmp:{c:D, p:polar(D,L,dir+45)}}, {swing:[dir+45, dir+75]}, {say:`Zelfde opening: boog rond ${nE}.`, cmp:{c:E, p:polar(E,L,dir+135)}}, {swing:[dir+135, dir+105]},
          {cmpOff:true, pt:Ft, name:nF, ly:-4.5, say:`Het snijpunt is ${nF}.`}, {geo:geoOn(D,Ft)}, {line:[D,Ft]}, {geo:geoOn(E,Ft)}, {line:[E,Ft]}, {geoOff:true, tk:{p:mid(D,E),dir,n:1}}, {tk:{p:mid(D,Ft),dir:dir+60,n:1}}, {tk:{p:mid(E,Ft),dir:dir+120,n:1}, wait:900}] });
    }},
  { title:'Teken een driehoek met drie gegeven lengtes', lvl:3, instr:'Hier mag je meten (tekenen). Tip: neem een lengte in je passer door de naald op het nulpunt van je geodriehoek te zetten en het potloodbeen bij de juiste lengte.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nX,nY,nZ,nP] = R.letters(4);
      let xy,xz,yz; do{ xy = R.int(4,7); xz = R.int(4,8); yz = R.int(3,7); } while(xz+yz <= xy+1 || Math.abs(xz-yz) >= xy-1 || xz===yz);
      const X = P(R.int(35,50), 105), dir = R.int(-3,3);
      qBlock(b, st, save, 'dr', { block:true, html:`Teken driehoek ${nX}${nY}${nZ} met |${nX}${nY}| = ${xy} cm, |${nX}${nZ}| = ${xz} cm en |${nY}${nZ}| = ${yz} cm. Begin op de halfrechte [${nX}${nP}. Teken ${nZ} boven de halfrechte.`,
        board:{w:200, h:120, tools:['pencil','eraser','label','tick','geo','compass'], compass:{on:true, pose:{cx:150,cy:25,px:175,py:25}}, geo:{pose:{x:100,y:60,rot:0}}, given:[...rayGiven(X, dir, 120, nX, nP)]},
        check:(v,c,B)=>{ const ry = CK.needPt(B,nY); if(ry.err) return {ok:false, msg:ry.err}; const Y = ry.p;
          if(lineDist(Y,X,polar(X,10,dir))>.8 || Math.abs(dist(X,Y)-xy*10)>1.05) return {ok:false, msg:`${nY} moet op [${nX}${nP} liggen, op ${xy} cm van ${nX}.`};
          const rz = CK.needPt(B,nZ); if(rz.err) return {ok:false, msg:rz.err}; const Z = rz.p;
          if(Math.abs(dist(X,Z)-xz*10)>1.1) return {ok:false, msg:`|${nX}${nZ}| is ${mmTxt(dist(X,Z))}, maar moet ${xz} cm zijn.`};
          if(Math.abs(dist(Y,Z)-yz*10)>1.1) return {ok:false, msg:`|${nY}${nZ}| is ${mmTxt(dist(Y,Z))}, maar moet ${yz} cm zijn.`};
          if(!CK.hasSeg(B,X,Z) || !CK.hasSeg(B,Y,Z)) return {ok:false, msg:`Teken de zijden [${nX}${nZ}] en [${nY}${nZ}].`};
          return {ok:true}; },
        demo:()=>{ const Y = polar(X,xy*10,dir); const Z = circleCircle(X,xz*10,Y,yz*10).sort((p,q)=>p.y-q.y)[0];
          const gp = {x:100,y:55,rot:0}; const g0 = geoL2W(gp,0,0), gx = k=>geoL2W(gp,k*10,0);
          return [{say:'Leg je geodriehoek ergens neer.', geo:gp},
            {say:`Neem ${xy} cm in je passer: naald op het nulpunt, potloodbeen bij ${xy}.`, cmp:{c:g0, p:gx(xy)}}, {say:`Zet de naald in ${nX} en teken een boog op de halfrechte.`, geoOff:true, cmp:{c:X, p:polar(X,xy*10,dir-10)}}, {swing:[dir-10,dir+10]}, {pt:Y, name:nY, ly:4.5},
            {geo:gp, say:`Neem ${xz} cm in je passer.`, cmp:{c:g0, p:gx(xz)}}, {geoOff:true, say:`Boog rond ${nX}.`, cmp:{c:X, p:polar(X,xz*10,dirAng(X,Z)-12)}}, {swing:[dirAng(X,Z)-12, dirAng(X,Z)+12]},
            {geo:gp, say:`Neem ${yz} cm in je passer.`, cmp:{c:g0, p:gx(yz)}}, {geoOff:true, say:`Boog rond ${nY}.`, cmp:{c:Y, p:polar(Y,yz*10,dirAng(Y,Z)-12)}}, {swing:[dirAng(Y,Z)-12, dirAng(Y,Z)+12]},
            {cmpOff:true, pt:Z, name:nZ, ly:-4.5, say:`Het snijpunt is ${nZ}. Teken de zijden.`}, {geo:geoOn(X,Z)}, {line:[X,Z]}, {geo:geoOn(Y,Z)}, {line:[Y,Z]}, {geoOff:true, wait:900}]; } });
    }},
  { title:'Ontdek: de middens van een driehoek', lvl:3, build:(b,st,save,key)=>{
      b.append(el('p','instructions','Sleep de hoekpunten A, B en C. D, E en F zijn de middens van de zijden. Kijk goed naar de vier kleine driehoeken.'));
      let showA = false; const tg = ctlBtn('Toon de oppervlaktes', ()=>{ showA=!showA; tg.textContent = showA?'Verberg de oppervlaktes':'Toon de oppervlaktes'; D.redraw(); });
      const D = dynFig(b, { w:200, h:110, maxw:760, ctl:[tg], pts:{A:{x:25,y:95,drag:true}, B:{x:95,y:12,drag:true}, C:{x:180,y:92,drag:true}},
        draw:Pt=>{ const {A,B:Bq,C} = Pt; const Dm = mid(A,Bq), E = mid(Bq,C), F = mid(A,C);
          let s = objSVG({t:'poly', pts:[Dm,E,F], fill:'rgba(245,164,15,.28)'}) + objSVG({t:'poly', pts:[A,Bq,C], stroke:INK, w:.45}) + objSVG({t:'poly', pts:[Dm,E,F], stroke:'#f5a40f', w:.4});
          s += objSVG(G.pt(A,'A',{lx:-3,ly:2.5})) + objSVG(G.pt(Bq,'B',{lx:0,ly:-3.5})) + objSVG(G.pt(C,'C',{lx:3,ly:2.5})) + objSVG(G.pt(Dm,'D',{lx:-3.5,ly:-1})) + objSVG(G.pt(E,'E',{lx:3.5,ly:-1})) + objSVG(G.pt(F,'F',{lx:0,ly:4}));
          return s; },
        info:Pt=>{ const a = triArea(Pt.A,Pt.B,Pt.C)/100, d = triArea(mid(Pt.A,Pt.B),mid(Pt.B,Pt.C),mid(Pt.A,Pt.C))/100; return showA ? `Oppervlakte ΔABC = ${fmtN(a,1)} cm² &nbsp; Oppervlakte ΔDEF = ${fmtN(d,1)} cm²` : 'Hoeveel keer past ΔDEF in ΔABC?'; } });
      qChoice(b, st, save, 'opp', { html:'Welk deel van de oppervlakte van ΔABC is de oppervlakte van ΔDEF?', opts:[['2','de helft'],['3','een derde'],['4','een vierde'],['8','een achtste']], ans:'4',
        why:'De drie middens verdelen ΔABC in vier even grote driehoeken. ΔDEF is er één van, dus een vierde.', whyBad:'Tel hoeveel even grote driehoekjes er in ΔABC passen. Gebruik de knop “Toon de oppervlaktes”.' });
    }},
  { title:'Ontdek: hoe lang is [PQ]?', lvl:3, build:(b,st,save,key)=>{
      const R = makeR(st);
      const ab = R.pick([6,8,10]); let ac = R.pick([2,4,6,8]); while(ac===ab) ac = R.pick([2,4,6,8]);
      b.append(el('p','instructions',`|AB| = ${ab} cm en |AC| = ${ac} cm. P is het midden van [AB], Q is het midden van [AC]. Sleep C rond A (de afstand |AC| blijft ${ac} cm).`));
      const A = P(100, 60), Bq = P(100+ab*8, 60);
      dynFig(b, { w:200, h:120, maxw:760, pts:{C:{...polar(A, ac*8, 110), drag:true, c:p=>polar(A, ac*8, dirAng(A,p))}},
        draw:Pt=>{ const C = Pt.C, Pm = mid(A,Bq), Q = mid(A,C);
          return objSVG({t:'circ', cx:A.x, cy:A.y, r:ac*8, color:'#cfd9d8', w:.25}) + objSVG(G.seg(A,Bq)) + objSVG(G.seg(A,C)) + objSVG(G.seg(Pm,Q,{color:'#f5a40f', w:.6})) +
            objSVG(G.pt(A,'A',{lx:-3.5,ly:2})) + objSVG(G.pt(Bq,'B',{lx:3.5,ly:0})) + objSVG(G.pt(C,'C',{lx:3,ly:-3})) + objSVG(G.pt(Pm,'P',{lx:0,ly:4})) + objSVG(G.pt(Q,'Q',{lx:-3.5,ly:-2})); },
        info:Pt=>`|PQ| = <b>${fmtN(dist(mid(A,Bq),mid(A,Pt.C))/8,1)} cm</b> &nbsp; (|BC| = ${fmtN(dist(Bq,Pt.C)/8,1)} cm)` });
      const lo = Math.abs(ab-ac)/2, hi = (ab+ac)/2;
      qBlock(b, st, save, 'pq', { tv:[fmtN(lo),fmtN(hi)], html:'|PQ| is minstens [[0:xs]] cm en hoogstens [[1:xs]] cm.', mode:'decimal',
        check:v=>{ const x = parseNum(v[0]), y = parseNum(v[1]); const f = [Math.abs(x-lo)<1e-9, Math.abs(y-hi)<1e-9]; return {ok:f[0]&&f[1], fields:f, msg: f[0]&&f[1] ? '|PQ| is altijd de helft van |BC|.' : 'Sleep C tot de punten A, B en C op één rechte liggen. Wat zie je dan?'}; },
        sol:`Als C tussen A en B ligt (aan dezelfde kant): |PQ| = (${ab} − ${ac}) : 2 = ${fmtN(lo)} cm. Als C aan de andere kant van A ligt: |PQ| = (${ab} + ${ac}) : 2 = ${fmtN(hi)} cm.` });
    }}
  ]};

/* ============================================================
   INHOUD DEEL 2: punt, rechte, halfrechte, lijnstuk + symbolen
   ============================================================ */
const nsp = s => String(s).replace(/\s+/g,'');
/* puntenveld: n punten met minimale onderlinge afstand */
function pointField(R, n, W, H, m=14, minD=18){
  for(let t=0;t<400;t++){ const pts = [];
    for(let i=0;i<n;i++){ let p, k=0; do{ p = P(R.int(m,W-m), R.int(m,H-m)); k++; } while(pts.some(q=>dist(p,q)<minD) && k<200); pts.push(p); }
    let ok = true; for(let i=0;i<n&&ok;i++) for(let j=i+1;j<n&&ok;j++) for(let k=j+1;k<n&&ok;k++) if(lineDist(pts[k],pts[i],pts[j])<3 && dist(pts[i],pts[j])>1) ok=false;
    if(ok) return pts; }
  return Array.from({length:n},(_,i)=>P(20+i*20, 20+(i%3)*25));
}
/* figuurtje voor één begrip */
function conceptFig(kind, names){
  const w=62, h=30; const o = [];
  if(kind==='punt'){ o.push(G.pt(P(31,16), names[0])); }
  if(kind==='rechte2'){ const a=P(18,21), b=P(44,11); const [p,q] = clipLine(a,b,w,h,1); o.push(G.line(p,q), G.pt(a,names[0],{ly:3.6,lx:-1}), G.pt(b,names[1],{ly:3.6,lx:1})); }
  if(kind==='rechte1'){ const a=P(10,22), b=P(52,9); const [p,q] = clipLine(a,b,w,h,1); o.push(G.line(p,q)); o.push(G.txt(P(50,16.5), names[0], {italic:true, size:4.6})); }
  if(kind==='half'){ const a=P(12,20), b=P(40,12); const [,q] = clipRay(a,b,w,h,1); o.push(G.ray(a,q), G.pt(a,names[0],{ly:3.8, lx:-1}), G.pt(b,names[1],{ly:3.8})); }
  if(kind==='half_rev'){ const a=P(50,12), b=P(24,20); const [,q] = clipRay(a,b,w,h,1); o.push(G.ray(a,q), G.pt(a,names[0],{ly:3.8, lx:1}), G.pt(b,names[1],{ly:3.8})); }
  if(kind==='seg'){ const a=P(12,20), b=P(50,11); o.push(G.seg(a,b), G.pt(a,names[0],{ly:3.8,lx:-1}), G.pt(b,names[1],{ly:3.8,lx:1})); }
  return fig(w,h,o,{scale:2.6, fit:false});
}
const BEGRIP = [['punt','punt'],['rechte','rechte'],['halfrechte','halfrechte'],['lijnstuk','lijnstuk']];

/* ---------------- 2. PUNT, RECHTE, HALFRECHTE, LIJNSTUK ---------------- */
SEC.begrippen = { id:'begrippen', ic:'punt', nav:'Punt, rechte, …', title:'Punt, rechte, halfrechte en lijnstuk',
  cheat:`<h3>Spiekbriefje · notaties</h3><table>
    <tr><td>A</td><td>het punt A (hoofdletter)</td></tr>
    <tr><td>AB of <i>a</i></td><td>de rechte door A en B, of de rechte <i>a</i> (kleine letter)</td></tr>
    <tr><td>[AB</td><td>de halfrechte met grenspunt A, door B</td></tr>
    <tr><td>[AB]</td><td>het lijnstuk met grenspunten A en B</td></tr>
    <tr><td>|AB|</td><td>de lengte van het lijnstuk [AB]</td></tr></table>`,
  cards:[
  { title:'Welk begrip? Welke notatie?', lvl:1, instr:'Kies het begrip en noteer het in symbolen. Een rechte door twee punten noteer je met die twee letters, bv. KL.', build:(b,st,save,key)=>{
      const R = makeR(st); const L = R.letters(9); const lo = R.pick(LOW.split(''));
      const rows = R.shuffle([
        {k:'punt', b:'punt', names:[L[0]], ok:v=>v===L[0], show:L[0]},
        {k:'rechte2', b:'rechte', names:[L[1],L[2]], ok:v=>v===L[1]+L[2]||v===L[2]+L[1], show:`${L[1]}${L[2]} of ${L[2]}${L[1]}`},
        {k:'rechte1', b:'rechte', names:[lo], ok:v=>v===lo, show:lo},
        {k:R.pick(['half','half_rev']), b:'halfrechte', names:[L[3],L[4]], ok:v=>v==='['+L[3]+L[4], show:'['+L[3]+L[4]},
        {k:'seg', b:'lijnstuk', names:[L[5],L[6]], ok:v=>v==='['+L[5]+L[6]+']'||v==='['+L[6]+L[5]+']', show:`[${L[5]}${L[6]}] of [${L[6]}${L[5]}]`}
      ]);
      rows.forEach((r,i)=>qBlock(b, st, save, 'r'+i, { nr:LET[i]+'.', html:conceptFig(r.k, r.names) + '<span style="margin-left:.6rem">notatie: [[0:xs]]</span>', choice:BEGRIP, choiceLabel:'begrip', choiceLast:true, tc:r.b, tv:[r.show.split(' of ')[0]],
        check:(v,c)=>{ const n = nsp(v[0]); const okB = c===r.b, okN = r.ok(n);
          let msg = '';
          if(!okB) msg = r.b==='halfrechte' ? 'Het begrip klopt niet: deze lijn is maar aan één kant begrensd.' : r.b==='lijnstuk' ? 'Het begrip klopt niet: deze lijn is aan twee kanten begrensd.' : r.b==='rechte' ? 'Het begrip klopt niet: deze lijn is aan geen enkele kant begrensd.' : 'Het begrip klopt niet.';
          else if(!okN){
            if(r.b==='halfrechte' && n==='['+r.names[1]+r.names[0]) msg = `Bij een halfrechte staat het <b>grenspunt</b> eerst: ${r.names[0]} is het grenspunt.`;
            else if(r.b==='halfrechte' && /\]$/.test(n)) msg = 'Een halfrechte heeft maar één blokhaakje: aan de kant van het grenspunt.';
            else if(r.b==='lijnstuk' && !/\]$/.test(n)) msg = 'Een lijnstuk is aan twee kanten begrensd: gebruik twee blokhaakjes.';
            else if(r.b==='rechte' && /\[/.test(n)) msg = 'Een rechte heeft geen blokhaakjes: ze is niet begrensd.';
            else if(n.toLowerCase()===n && n!==n.toUpperCase() && r.b!=='rechte') msg = 'Punten noteer je met een hoofdletter.';
            else msg = 'De notatie klopt niet.';
          }
          return {ok:okB&&okN, choiceOk:okB, fields:[okN], msg}; },
        sol:`${r.b} · notatie: <b>${r.show}</b>` }));
    }},
  { title:'Hoe lees je de notatie?', lvl:1, build:(b,st,save,key)=>{
      const R = makeR(st);
      const items = R.shuffle(['ray','seg','len','line','ray2']).slice(0,4);
      items.forEach((k,i)=>{ const [x,y] = R.letters(2);
        const opts = [['ray',`de halfrechte met grenspunt ${x}, door ${y}`],['ray2',`de halfrechte met grenspunt ${y}, door ${x}`],['seg',`het lijnstuk met grenspunten ${x} en ${y}`],['len',`de lengte van het lijnstuk [${x}${y}]`],['line',`de rechte door ${x} en ${y}`]];
        const not = {ray:`[${x}${y}`, ray2:`[${y}${x}`, seg:`[${x}${y}]`, len:`|${x}${y}|`, line:`${x}${y}`}[k];
        qChoice(b, st, save, 'n'+i, { nr:(i+1)+'.', html:`Hoe lees je <b>${not}</b>?`, opts:R.shuffle(opts), ans:k,
          why: k==='ray'||k==='ray2' ? 'Eén blokhaakje: aan die kant ligt het grenspunt.' : k==='seg' ? 'Twee blokhaakjes: aan twee kanten begrensd.' : k==='len' ? 'Verticale streepjes betekenen “de lengte van”.' : 'Geen haakjes: de rechte is niet begrensd.' }); });
    }},
  { title:'Schets bij de notatie', lvl:2, instr:'Schetsen = snel tekenen met je geodriehoek. Leg de tekenzijde door de twee punten en trek de lijn. Let op waar de lijn moet stoppen!', build:(b,st,save,key)=>{
      const R = makeR(st);
      ['a.','b.'].forEach((nr,qi)=>{
        const names = R.letters(6); const pts = pointField(R, 6, 200, 100, 16, 24);
        const given = pts.map((p,i)=>G.pt(p, names[i]));
        const pairs = R.shuffle([[0,1],[2,3],[4,5]]);
        const kinds = R.shuffle(['line','ray','seg']);
        const tasks = pairs.map((pr,i)=>{ const [A,Bq] = pr.map(k=>pts[k]), [nA,nB] = pr.map(k=>names[k]); const k = kinds[i];
          return {A,Bq,nA,nB,k, txt: k==='line' ? `de rechte ${nA}${nB}` : k==='ray' ? `de halfrechte [${nA}${nB}` : `het lijnstuk [${nA}${nB}]`}; });
        qBlock(b, st, save, 'sk'+qi, { nr, block:true, html:'Schets ' + tasks.map(t=>'<b>'+t.txt+'</b>').join(', ').replace(/, ([^,]*)$/,' en $1') + '.',
          board:{w:200, h:100, tools:['pencil','eraser','geo'], given},
          check:(v,c,B)=>{ for(const t of tasks){ const ks = CK.kinds(B,t.A,t.Bq);
              const want = t.k==='line' ? 'line' : t.k==='ray' ? 'rayA' : 'seg';
              if(ks.includes(want)) continue;
              if(!ks.length) return {ok:false, msg:`Ik vind ${t.txt} nog niet. De lijn moet door ${t.nA} én ${t.nB} gaan.`};
              const what = {line:'een rechte', rayA:`een halfrechte met grenspunt ${t.nA}`, rayB:`een halfrechte met grenspunt ${t.nB}`, seg:'een lijnstuk', other:'een lijn die op een vreemde plaats stopt'}[ks[0]];
              const hint = t.k==='line' ? `Een rechte loopt voorbij ${t.nA} én voorbij ${t.nB}.` : t.k==='ray' ? `Een halfrechte [${t.nA}${t.nB} begint in ${t.nA} en loopt voorbij ${t.nB}.` : `Een lijnstuk stopt in ${t.nA} en in ${t.nB}.`;
              return {ok:false, msg:`Bij ${t.txt} tekende je ${what}. ${hint}`}; }
            return {ok:true, msg:'Alle drie juist geschetst.'}; },
          demo:()=>tasks.flatMap(t=>{ const d = dirAng(t.A,t.Bq), L = dist(t.A,t.Bq);
            const a = t.k==='line' ? polar(t.A,-10,d) : t.A, e = t.k==='seg' ? t.Bq : polar(t.A, L+12, d);
            return [{say:`${t.txt}: leg de tekenzijde door ${t.nA} en ${t.nB}.`, geo:geoOn(a,e)}, {line:[a,e]}]; }).concat([{geoOff:true, wait:800}]) });
      });
    }},
  { title:'Juist of fout?', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st);
      const pool = [];
      const add = (f, ans, why) => pool.push([f, ans, why]);
      for(let i=0;i<9;i++){ const [x,y] = R.letters(2);
        [()=>add(`|${x}${y}| = |${y}${x}|`,'w','Een lengte hangt niet af van de volgorde van de letters.'),
         ()=>add(`[${x}${y}] = [${y}${x}]`,'w','Het lijnstuk met grenspunten '+x+' en '+y+' is hetzelfde lijnstuk.'),
         ()=>add(`${x}${y} = ${y}${x}`,'w','Het is dezelfde rechte.'),
         ()=>add(`[${x}${y} = [${y}${x}`,'f','De halfrechten hebben een ander grenspunt en lopen in een andere richting.'),
         ()=>add(`[${x}${y}] ⊂ ${x}${y}`,'w','Het lijnstuk ligt op zijn drager, de rechte '+x+y+'.'),
         ()=>add(`${x}${y} ⊂ [${x}${y}`,'f','De rechte loopt ook voorbij '+x+', de halfrechte niet.'),
         ()=>add(`[${x}${y} ⊂ [${y}${x}`,'f','[' +x+y+' loopt voorbij '+y+', [' +y+x+' niet.'),
         ()=>add(`[${x}${y}] ⊂ [${y}${x}`,'w','Alle punten van het lijnstuk liggen ook op de halfrechte [' +y+x+'.'),
         ()=>add(`${x} ∈ [${y}${x}]`,'w', x+' is een grenspunt van het lijnstuk, en grenspunten horen erbij.')][i]();
      }
      const items = R.shuffle(pool).slice(0,6);
      const grid = el('div','tf-grid'); b.append(grid);
      items.forEach(([f,ans,why],i)=>qChoice(grid, st, save, 'j'+i, {nr:(i+1)+'.', html:f, opts:[['w','Juist'],['f','Fout']], ans, why}));
    }}
  ]};

/* ---------------- 3. SYMBOLEN ∈ ∉ ⊂ ⊄ = ---------------- */
function symFigure(R){
  const L = R.letters(6); const lm = R.shuffle(LOW.split('')).slice(0,2);
  const W=200, H=100;
  /* rechte m met 4 punten, rechte n door het 2e punt en een punt E, punt F los */
  for(let t=0;t<300;t++){
    const dm = R.int(-18,18); const c = P(100, R.int(45,60));
    const ts = [-62, R.int(-38,-26), R.int(-4,14), R.int(36,58)];
    const pm = ts.map(s=>polar(c,s,dm));
    const dn = dm + R.sign()*R.int(45,75);
    const E = polar(pm[1], R.sign()*R.int(28,40), dn);
    const F = P(R.int(20,180), R.int(12,88));
    const all = [...pm,E,F];
    if(!all.every(p=>p.x>10&&p.x<190&&p.y>10&&p.y<90)) continue;
    if(lineDist(F,pm[0],pm[3])<10 || lineDist(F,pm[1],E)<10 || all.slice(0,5).some(p=>dist(p,F)<14)) continue;
    const order = R.f()<.5 ? [0,1,2,3] : [3,2,1,0];
    const nm = {}; ['A','B','C','D'].forEach((k,i)=>nm[k]=L[i]);
    const pts = {[L[0]]:pm[order[0]], [L[1]]:pm[order[1]], [L[2]]:pm[order[2]], [L[3]]:pm[order[3]], [L[4]]:E, [L[5]]:F};
    const [m1,m2] = clipLine(pm[0],pm[3],W,H,3), [n1,n2] = clipLine(pm[1],E,W,H,3);
    const lab = (p,q,nme)=>{ const d=dirAng(p,q); const a = polar(q, -7, d); const o = polar(a, 3.6, d+90); return G.txt(o, nme, {italic:true, size:4.6}); };
    const given = [G.line(m1,m2), G.line(n1,n2), lab(m1,m2,lm[0]), lab(n1,n2,lm[1])];
    Object.entries(pts).forEach(([k,p])=>given.push(G.pt(p,k,{lx:polar(P(0,0),3.4,dm+(k===L[4]||k===L[5]?90:-90)).x, ly:polar(P(0,0),3.4,dm+(k===L[4]||k===L[5]?90:-90)).y})));
    /* parameters op m (punt op m) en op n */
    const onM = k => [L[0],L[1],L[2],L[3]].includes(k);
    const tm = k => projT(pts[k], pm[0], pm[3]) * 100;
    const tn = k => projT(pts[k], pm[1], E) * 100;
    return {pts, L, lm, given, onM, tm, tn, sharedOnN: pts[L[order.indexOf(1)]], nOn:[L[order.indexOf(1)], L[4]]};
  }
  return null;
}
/* verzameling op een drager: {line:'m'|'n', lo, hi} (parameters), punt: {pt:k} */
function symStatements(F, R){
  const {L, lm, tm, tn, onM, nOn} = F; const mP = L.slice(0,4);
  const iv = (line, kind, a, b2) => { const t = line==='m'?tm:tn; const ta=t(a), tb=t(b2);
    if(kind==='seg') return {line, lo:Math.min(ta,tb), hi:Math.max(ta,tb)}; if(kind==='ray') return tb>ta ? {line, lo:ta, hi:Infinity} : {line, lo:-Infinity, hi:ta}; return {line, lo:-Infinity, hi:Infinity}; };
  const lineOf = (a,b2) => (mP.includes(a)&&mP.includes(b2)) ? 'm' : (nOn.includes(a)&&nOn.includes(b2)) ? 'n' : null;
  const objs = [];
  const mk = (txt, set) => objs.push({txt, set});
  /* objecten */
  mk(lm[0], {line:'m', lo:-Infinity, hi:Infinity}); mk(lm[1], {line:'n', lo:-Infinity, hi:Infinity});
  for(let i=0;i<4;i++) for(let j=0;j<4;j++) if(i!==j){ const a=mP[i], c=mP[j];
    mk(`[${a}${c}`, iv('m','ray',a,c)); if(i<j) mk(`[${a}${c}]`, iv('m','seg',a,c)); if(i<j) mk(`${a}${c}`, iv('m','line',a,c)); }
  mk(`[${nOn[0]}${nOn[1]}]`, iv('n','seg',nOn[0],nOn[1])); mk(`[${nOn[1]}${nOn[0]}`, iv('n','ray',nOn[1],nOn[0])); mk(`${nOn[0]}${nOn[1]}`, iv('n','line',nOn[0],nOn[1]));
  const ptIn = (k, s) => { if(s.line==='m'){ if(!onM(k)) return false; const t=tm(k); return t>=s.lo-1e-6 && t<=s.hi+1e-6; } else { if(!nOn.includes(k)) return false; const t=tn(k); return t>=s.lo-1e-6 && t<=s.hi+1e-6; } };
  const subset = (s1, s2) => { if(s1.line!==s2.line) return false; return s1.lo>=s2.lo-1e-6 && s1.hi<=s2.hi+1e-6; };
  const eq = (s1,s2) => subset(s1,s2) && subset(s2,s1);
  const st = [];
  L.forEach(k=>objs.forEach(o=>st.push({lhs:k, rhs:o.txt, ans: ptIn(k,o.set)?'∈':'∉'})));
  objs.forEach(o1=>objs.forEach(o2=>{ if(o1===o2 || o1.txt===o2.txt) return; if(/^[a-z]$/.test(o1.txt)) return; st.push({lhs:o1.txt, rhs:o2.txt, ans: eq(o1.set,o2.set)?'=':subset(o1.set,o2.set)?'⊂':'⊄'}); }));
  /* kies 8 met alle symbolen */
  const by = s => R.shuffle(st.filter(x=>x.ans===s));
  const pick = [...by('∈').slice(0,2), ...by('∉').slice(0,1), ...by('⊂').slice(0,2), ...by('⊄').slice(0,2), ...by('=').slice(0,1)];
  /* één lastige: het snijpunt van de twee rechten */
  const shared = nOn[0]; const tricky = st.find(x=>x.lhs===shared && x.rhs===lm[1]); if(tricky && !pick.includes(tricky)) pick[0] = tricky;
  return R.shuffle(pick);
}
const SYMS = [['∈','∈'],['∉','∉'],['⊂','⊂'],['⊄','⊄'],['=','=']];
function symWhy(s){
  if(s.ans==='∈') return `${s.lhs} ligt op ${s.rhs}.`;
  if(s.ans==='∉') return `${s.lhs} ligt niet op ${s.rhs}.`;
  if(s.ans==='=') return `${s.lhs} en ${s.rhs} bestaan uit precies dezelfde punten.`;
  if(s.ans==='⊂') return `Alle punten van ${s.lhs} liggen ook op ${s.rhs}.`;
  return `Niet alle punten van ${s.lhs} liggen op ${s.rhs}.`;
}

SEC.symbolen = { id:'symbolen', ic:'element', nav:'∈ ∉ ⊂ ⊄ =', title:'Symbolen, collineaire punten en concurrente rechten',
  cheat:`<h3>Spiekbriefje · symbolen</h3><table>
    <tr><td>∈ / ∉</td><td>tussen een <b>punt</b> en een rechte, halfrechte of lijnstuk: ligt op / ligt niet op</td></tr>
    <tr><td>⊂ / ⊄</td><td>tussen <b>twee verzamelingen van punten</b>: alle punten liggen erop / niet alle punten liggen erop</td></tr>
    <tr><td>=</td><td>precies dezelfde punten</td></tr>
    <tr><td>collineair</td><td>drie of meer punten op één rechte</td></tr>
    <tr><td>concurrent</td><td>drie of meer rechten door één punt</td></tr>
    <tr><td><i>a</i> ∩ <i>b</i> = {S}</td><td>S is het snijpunt van <i>a</i> en <i>b</i></td></tr></table>`,
  cards:[
  { title:'Vul in met ∈, ∉, ⊂, ⊄ of =', lvl:1, build:(b,st,save,key)=>{
      const R = makeR(st);
      const F = symFigure(R);
      b.append(el('div','', fig(200,100,F.given,{full:true, fit:false, alt:'figuur met twee rechten en punten'})));
      const grid = el('div','sym-grid'); b.append(grid);
      symStatements(F,R).forEach((s,i)=>qChoice(grid, st, save, 's'+i, {nr:LET[i]+'.', html:`${s.lhs} … ${s.rhs}`, opts:SYMS, ans:s.ans, sym:true,
        why:symWhy(s), whyBad: /^[A-Z]$/.test(s.lhs) ? 'Links staat een punt: kies tussen ∈ en ∉.' : 'Links staat een verzameling punten: kies tussen ⊂, ⊄ en =.'}));
    }},
  { title:'Collineair, concurrent en snijpunt', lvl:2, instr:'Schets met je geodriehoek. Zet punten met het potlood en geef ze een naam met Benoem.', build:(b,st,save,key)=>{
      const R = makeR(st);
      /* a: collineair punt */
      { const [nA,nB,nK] = R.letters(3); const [A,Bq] = pickIn(R, ()=>{ const a=P(R.int(40,80),R.int(25,75)); return [a, polar(a,R.int(35,55),R.int(-40,40))]; }, 200, 100, 15);
        qBlock(b, st, save, 'col', { nr:'a.', block:true, html:`Zet een punt ${nK} zodat ${nA}, ${nB} en ${nK} collineair zijn. ${nK} mag niet tussen ${nA} en ${nB} liggen.`,
          board:{w:200, h:100, tools:['pencil','eraser','label','geo'], given:[G.pt(A,nA), G.pt(Bq,nB)]},
          check:(v,c,B)=>{ const r = CK.needPt(B,nK); if(r.err) return {ok:false, msg:r.err}; const K = r.p;
            if(lineDist(K,A,Bq) > .8) return {ok:false, msg:`${nK} ligt niet op de rechte ${nA}${nB}. Leg je tekenzijde door ${nA} en ${nB} en zet ${nK} tegen de tekenzijde.`};
            const t = projT(K,A,Bq); if(t>0.02 && t<0.98) return {ok:false, msg:`${nK} ligt tussen ${nA} en ${nB}. Zet hem voorbij ${nA} of voorbij ${nB}.`};
            if(Math.min(dist(K,A),dist(K,Bq))<2) return {ok:false, msg:`${nK} moet een ander punt zijn dan ${nA} en ${nB}.`};
            return {ok:true, msg:`${nA}, ${nB} en ${nK} liggen op één rechte.`}; },
          demo:()=>{ const d = dirAng(A,Bq); const K = polar(Bq, 20, d); return [{say:`Leg de tekenzijde door ${nA} en ${nB}.`, geo:geoOn(A,K)}, {say:`Zet ${nK} tegen de tekenzijde, voorbij ${nB}.`, pt:K, name:nK}, {wait:900}]; } }); }
      /* b: concurrente rechten */
      { const [nS] = R.letters(1); const S = P(R.int(80,120), R.int(40,60));
        qBlock(b, st, save, 'conc', { nr:'b.', block:true, html:`Schets drie <b>concurrente rechten</b> die door ${nS} gaan.`,
          board:{w:200, h:100, tools:['pencil','eraser','geo'], given:[G.pt(S,nS)]},
          check:(v,c,B)=>{ const ls = B.segs().filter(s=>lineDist(S,s.a,s.b)<=.8);
            const full = ls.filter(s=>{ const L=dist(s.a,s.b), t=projT(S,s.a,s.b)*L; return t>=5 && t<=L-5; });
            const dirs = []; full.forEach(s=>{ const d = dirAng(s.a,s.b); if(!dirs.some(x=>ldiff(x,d)<5)) dirs.push(d); });
            if(dirs.length>=3) return {ok:true, msg:'Drie rechten met één gemeenschappelijk punt: concurrente rechten.'};
            if(ls.length>full.length) return {ok:false, msg:`Een rechte loopt aan beide kanten voorbij ${nS}. Sommige lijnen stoppen in ${nS}.`};
            return {ok:false, msg:`Ik vind ${dirs.length} rechte${dirs.length===1?'':'n'} door ${nS}. Er moeten er minstens drie zijn, elk in een andere richting.`}; },
          demo:()=>[30,95,150].flatMap(d=>[{geo:{x:S.x,y:S.y,rot:d}}, {line:[polar(S,-30,d), polar(S,30,d)]}]).concat([{geoOff:true, wait:700}]) }); }
      /* c: snijpunt */
      { const nm = R.letters(5); const [A,D,Bq,E] = pickIn(R, ()=>{ const X = P(R.int(80,120), R.int(40,60)); const d1 = R.int(0,60), d2 = d1+R.int(55,110);
          return [polar(X,-R.int(28,45),d1), polar(X,R.int(25,40),d1), polar(X,-R.int(28,45),d2), polar(X,R.int(25,40),d2)]; }, 200, 100, 12);
        const X = lineInter(A,D,Bq,E);
        const [nA,nD,nB,nE,nZ] = nm;
        qBlock(b, st, save, 'sn', { nr:'c.', block:true, html:`Schets de rechten ${nA}${nD} en ${nB}${nE}. Zet hun snijpunt en noem het ${nZ}. Vul dan aan.`,
          html2:`<div class="step">${nA}${nD} ∩ ${nB}${nE} = { [[0:sm]] }</div>`, block2:true, tv:[nZ],
          board:{w:200, h:100, tools:['pencil','eraser','label','geo'], given:[G.pt(A,nA),G.pt(D,nD),G.pt(Bq,nB),G.pt(E,nE)]},
          check:(v,c,B)=>{ const okT = nsp(v[0])===nZ;
            if(!CK.kinds(B,A,D).includes('line')) return {ok:false, fields:[okT], msg:`Schets de <b>rechte</b> ${nA}${nD}: ze loopt voorbij ${nA} en voorbij ${nD}.`};
            if(!CK.kinds(B,Bq,E).includes('line')) return {ok:false, fields:[okT], msg:`Schets de <b>rechte</b> ${nB}${nE}: ze loopt voorbij ${nB} en voorbij ${nE}.`};
            const r = CK.needPt(B,nZ); if(r.err) return {ok:false, fields:[okT], msg:r.err};
            if(dist(r.p,X) > 1) return {ok:false, fields:[okT], msg:`${nZ} staat niet op het snijpunt. Tik precies waar de twee rechten elkaar kruisen.`};
            if(!okT) return {ok:false, fields:[okT], msg:`De doorsnede van de twee rechten is de verzameling met hun snijpunt ${nZ}.`};
            return {ok:true, fields:[okT]}; },
          demo:()=>{ const d1=dirAng(A,D), d2=dirAng(Bq,E); return [{geo:geoOn(A,D)}, {line:[polar(A,-12,d1), polar(D,12,d1)]}, {geo:geoOn(Bq,E)}, {line:[polar(Bq,-12,d2), polar(E,12,d2)]}, {geoOff:true, pt:X, name:nZ, ly:-4, say:`Het snijpunt ${nZ}: ${nA}${nD} ∩ ${nB}${nE} = {${nZ}}`}, {wait:900}]; } }); }
    }},
  { title:'Liggen ze op één rechte?', lvl:3, instr:'Kijk niet alleen met je ogen: controleer met je geodriehoek! Leg de tekenzijde door twee punten en kijk of het derde punt er precies op ligt (zoom in).', build:(b,st,save,key)=>{
      const R = makeR(st);
      ['a.','b.','c.'].forEach((nr,i)=>{
        const nm = R.letters(3); const col = R.f()<.5;
        const [A,Bq,C] = pickIn(R, ()=>{ const a = P(R.int(25,60), R.int(20,80)); const d = R.int(-30,30); const L = R.int(110,140); const t = R.real(.35,.65);
          const c = polar(a, L, d); const m = lerp(a,c,t); const off = col ? 0 : R.sign()*R.real(1.6,2.6); return [a, polar(m, off, d+90), c]; }, 200, 100, 10);
        qBlock(b, st, save, 'cl'+i, { nr, html:`Zijn ${nm[0]}, ${nm[1]} en ${nm[2]} collineair?`, choice:[['j','Ja'],['n','Neen']], choiceLast:true, tc:col?'j':'n',
          board:{w:200, h:100, tools:['pencil','eraser','geo'], given:[G.pt(A,nm[0]),G.pt(Bq,nm[1],{ly:-3}),G.pt(C,nm[2])]},
          check:(v,c)=>({ok: c===(col?'j':'n'), choiceOk: c===(col?'j':'n'), msg: col ? `Ze liggen precies op één rechte.` : `${nm[1]} ligt ${fmtN(lineDist(Bq,A,C)/10,2)} cm naast de rechte ${nm[0]}${nm[2]}. Dat zie je bijna niet met je ogen!`}),
          demo:()=>[{say:`Leg de tekenzijde door ${nm[0]} en ${nm[2]}. Ligt ${nm[1]} op de tekenzijde?`, geo:geoOn(A,C)}, {wait:2200}] });
      });
    }}
  ]};

/* ============================================================
   INHOUD DEEL 3: hoeken, hoeken meten en tekenen, inspringende hoeken
   ============================================================ */
const LEG = 88; /* benen lang genoeg om af te lezen aan de schuine zijden van de geodriehoek */
const SOORT = [['nul','nulhoek'],['scherp','scherpe hoek'],['recht','rechte hoek'],['stomp','stompe hoek'],['gestrekt','gestrekte hoek'],['insp','inspringende hoek'],['vol','volle hoek']];
const soortVan = a => a<1e-9 ? 'nul' : a<90-1e-9 ? 'scherp' : Math.abs(a-90)<1e-9 ? 'recht' : a<180-1e-9 ? 'stomp' : Math.abs(a-180)<1e-9 ? 'gestrekt' : a<360-1e-9 ? 'insp' : 'vol';
const soortNaam = k => SOORT.find(x=>x[0]===k)[1];
const SOORT_DEF = {nul:'0°', scherp:'tussen 0° en 90°', recht:'precies 90°', stomp:'tussen 90° en 180°', gestrekt:'precies 180°', insp:'tussen 180° en 360°', vol:'precies 360°'};
/* hoek als gegeven objecten: benen vanuit V in richtingen d1, d2 */
function angleObjs(V, d1, d2, names, o={}){
  const L1 = o.L1||62, L2 = o.L2||62;
  const A = polar(V, L1, d1), C = polar(V, L2, d2);
  const out = [G.ray(V,A), G.ray(V,C)];
  const sweep = norm360(d2-d1) || (o.full?360:0);
  const bis = norm360(d1 + sweep/2);
  if(names){
    const [n1,nv,n2] = names;
    if(nv) out.push(ptOff(V, bis+180, nv, 4));
    if(n1){ const p = polar(V, L1-6, d1); out.push(ptOff(p, d1 - 90*(sweep<=180?1:-1), n1, 3.8)); }
    if(n2){ const p = polar(V, L2-6, d2); out.push(ptOff(p, d2 + 90*(sweep<=180?1:-1), n2, 3.8)); }
  }
  if(o.mark!==false) out.push(G.am(V, d1, d1+sweep, Object.assign({r:o.r||8}, o.am||{})));
  return {objs:out, A, C, P1: names&&names[0] ? polar(V, L1-6, d1) : null, P2: names&&names[2] ? polar(V, L2-6, d2) : null};
}
/* kleine hoek-tegel voor soorten */
function angleTile(a, rot){
  const V = P(32, 22); const d1 = rot, d2 = rot + a; const o = [];
  if(a===0){ o.push(G.ray(V, polar(V,26,d1)), G.ray(V, polar(V,26,d1), {w:.42})); o.push(G.am(V,d1,d1+.01,{r:6})); o.push(G.txt(polar(V,9,d1+12),'0',{size:0.01})); }
  else if(a===360){ o.push(G.ray(V, polar(V,26,d1))); o.push(G.am(V,d1,d1+359.9,{r:6})); }
  else { o.push(G.ray(V, polar(V,26,d1)), G.ray(V, polar(V,26,d2))); o.push(G.am(V,d1,d2,{r: a>180?5:7, style: a===90?'right':'arc'})); }
  o.push(Object.assign(G.pt(V,''),{small:true}));
  return fig(64, 44, o, {scale:3.2, minw:56, minh:56, margin:4});
}
/* klok */
function clockSVG(hAng, mAng, extra=''){
  let s = `<circle cx="50" cy="50" r="44" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
  for(let k=0;k<60;k++){ const a = 90 - k*6; const p = polar(P(50,50), 44, a), q = polar(P(50,50), k%5?41.5:38.5, a); s += `<line x1="${f2(p.x)}" y1="${f2(p.y)}" x2="${f2(q.x)}" y2="${f2(q.y)}" stroke="${INK}" stroke-width="${k%5?.4:1}"/>`; }
  for(let k=1;k<=12;k++){ const p = polar(P(50,50), 32, 90-k*30); s += `<text x="${f2(p.x)}" y="${f2(p.y)}" font-size="7" text-anchor="middle" dominant-baseline="middle" fill="${INK}" font-weight="700">${k}</text>`; }
  s += extra;
  const hp = polar(P(50,50), 22, 90-hAng), mp = polar(P(50,50), 34, 90-mAng);
  s += `<line x1="50" y1="50" x2="${f2(hp.x)}" y2="${f2(hp.y)}" stroke="#1fa6ab" stroke-width="3.2" stroke-linecap="round"/><line x1="50" y1="50" x2="${f2(mp.x)}" y2="${f2(mp.y)}" stroke="#f5a40f" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="50" r="2.4" fill="${INK}"/>`;
  return s;
}
const clockAngle = (h,m) => { const ha = (h%12)*30 + m*0.5, ma = m*6; let d = Math.abs(ha-ma)%360; return Math.min(d, 360-d); };

/* ---------------- 6. HOEKEN: NOTATIE EN SOORTEN ---------------- */
SEC.hoeken = { id:'hoeken', ic:'hoek', nav:'Soorten hoeken', title:'Hoeken: notatie, soorten en hoekgrootte',
  cheat:`<h3>Spiekbriefje · soorten hoeken</h3><table>${SOORT.map(([k,n])=>`<tr><td>${n}</td><td>${SOORT_DEF[k]}</td></tr>`).join('')}</table>`,
  cards:[
  { title:'Hoe noteer je deze hoek?', lvl:1, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nA,nH,nB] = R.letters(3); const gr = R.pick(GREEK);
      const d1 = R.int(-20,30), sw = R.int(40,120); const V = P(40,56);
      const F = angleObjs(V, d1, d1+sw, [nA,nH,nB], {L1:70, L2:62, am:{txt:gr, r:11}});
      b.append(el('div','', fig(130, 70, F.objs, {scale:3.4, alt:'hoek', margin:5})));
      const cands = R.shuffle([
        [`${nA}${hat(nH)}${nB}`, 'w', 'Het hoekpunt staat in het midden, met een dakje.'],
        [`${nB}${hat(nH)}${nA}`, 'w', 'De volgorde van de punten op de benen mag je omwisselen; het hoekpunt blijft in het midden.'],
        [hat(nH), 'w', 'Als er maar één hoek is bij dat hoekpunt, mag je enkel het hoekpunt noteren.'],
        [gr, 'w', 'Hoeken kan je ook met een Griekse letter noteren.'],
        [`${nH}${hat(nA)}${nB}`, 'f', `Het hoekpunt is ${nH}, dus ${nH} moet in het midden staan.`],
        [`${nA}${hat(nB)}${nH}`, 'f', `Het hoekpunt is ${nH}, niet ${nB}.`]
      ]).slice(0,5);
      const grid = el('div','tf-grid'); b.append(grid);
      cands.forEach(([f,ans,why],i)=>qChoice(grid, st, save, 'n'+i, {nr:(i+1)+'.', html:`Is <b>${f}</b> een juiste notatie?`, opts:[['w','Juist'],['f','Fout']], ans, why}));
      qChoice(b, st, save, 'benen', {nr:'6.', html:'Wat zijn de benen van deze hoek?', ans:'ok', opts:R.shuffle([['ok',`[${nH}${nA} en [${nH}${nB}`],['x1',`[${nA}${nH} en [${nB}${nH}`],['x2',`[${nA}${nH}] en [${nH}${nB}]`],['x3',`${nA}${nB}`]]),
        why:`De benen zijn halfrechten met het hoekpunt ${nH} als grenspunt.`});
    }},
  { title:'Welke soort hoek zie je?', lvl:1, instr:'Kijk naar het boogje: dat toont welke hoek bedoeld wordt.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const sizes = R.shuffle([R.int(15,75), 90, R.int(100,165), 180, R.int(200,330), 360, R.int(20,80), R.int(95,170)]);
      const grid = el('div','fig-row'); b.append(grid);
      sizes.forEach((a,i)=>{ const box = el('div','fig-card'); grid.append(box);
        qChoice(box, st, save, 's'+i, {nr:LET[i]+'.', html:'', fig:angleTile(a, R.int(0,359)), opts:SOORT.filter(x=>x[0]!=='nul'), ans:soortVan(a), why:`Een ${soortNaam(soortVan(a))} is ${SOORT_DEF[soortVan(a)]}.`, whyBad:'Kijk goed welke hoek het boogje aanduidt.'}); });
    }},
  { title:'Hoe noem je een hoek van …?', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st); const L = R.letters(8);
      const vals = R.shuffle([[179,'179°'],[89,'89°'],[90,'90°'],[180,'180°'],[360,'360°'],[0,'0°'],[R.int(181,359),null],[91,'91°'],[R.int(1,9),null],[181,'181°']]).slice(0,8);
      const grid = el('div','tf-grid'); b.append(grid);
      vals.forEach(([a,t],i)=>{ const txt = t || (fmtN(a)+'°'); const k = soortVan(a);
        qChoice(grid, st, save, 'v'+i, {nr:(i+1)+'.', html:`${hat(L[i])} = ${txt}, dus ${hat(L[i])} is een …`, opts:SOORT, ans:k, why:`Een ${soortNaam(k)} is ${SOORT_DEF[k]}.`}); });
    }},
  { title:'Hoeken op de klok', lvl:2, instr:'Bepaal door te redeneren de kleinste hoek tussen de wijzers. Tip: tussen twee cijfers is 360° : 12 = 30°. Op een half uur staat de kleine wijzer tussen twee cijfers in!', build:(b,st,save,key)=>{
      const R = makeR(st);
      const times = []; while(times.length<4){ const h = R.int(1,12), m = R.f()<.5 ? 0 : 30; if(times.some(t=>t[0]===h&&t[1]===m)) continue; if(times.length<2 && m===30) continue; times.push([h,m]); }
      const grid = el('div','fig-row'); b.append(grid);
      times.forEach(([h,m],i)=>{ const box = el('div','fig-card'); grid.append(box);
        const sv = document.createElementNS('http://www.w3.org/2000/svg','svg'); sv.setAttribute('viewBox','0 0 100 100'); sv.style.width='150px'; sv.style.margin='0 auto'; sv.style.display='block'; box.append(sv);
        const ha = (h%12)*30 + m*.5, ma = m*6;
        tween(1400, t=>{ sv.innerHTML = clockSVG(ha*t, (ma + 360*(m===0?1:0))*t); });
        const ang = clockAngle(h,m);
        qBlock(box, st, save, 'k'+i, {tv:[String(ang)], tc:soortVan(ang), nr:LET[i]+'.', html:`${h}.${String(m).padStart(2,'0')} uur: hoek = [[0:xs]]°`, mode:'decimal', choice:SOORT.slice(0,5), choiceLast:true,
          check:(v,c)=>{ const x = parseDeg(v[0]); const okA = Math.abs(x-ang)<1e-6, okS = c===soortVan(ang);
            return {ok:okA&&okS, fields:[okA], choiceOk:okS, msg: !okA ? (m===30 ? 'Let op: om half staat de kleine wijzer halfweg tussen twee cijfers (15° verder).' : 'Tel het aantal “stappen” van 30° tussen de wijzers.') : !okS ? 'De hoekgrootte klopt, maar de benaming niet.' : ''}; },
          sol:`${m===30?`De grote wijzer staat op 6, de kleine halfweg tussen ${h%12||12} en ${h%12+1}. `:''}De kleinste hoek is <b>${ang}°</b>: een ${soortNaam(soortVan(ang))}.` });
      });
    }},
  { title:'Zet de wijzers', lvl:3, instr:'Sleep de grote (oranje) wijzer. De kleine wijzer draait vanzelf mee, zoals bij een echte klok.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const goal = R.pick([[90,'een rechte hoek'],[180,'een gestrekte hoek'],[0,'een nulhoek'],[150,'een hoek van 150°'],[60,'een hoek van 60°'],[120,'een hoek van 120°']]);
      const s = st.clk || (st.clk = {t:R.int(1,11)*60 + 10});
      const box = el('div','dyn'); const sv = document.createElementNS('http://www.w3.org/2000/svg','svg'); sv.setAttribute('viewBox','0 0 100 100'); sv.style.maxWidth='280px'; sv.style.display='block'; sv.style.margin='0 auto'; sv.style.touchAction='none'; box.append(sv);
      const info = el('div','dyn-info'); box.append(info); b.append(box);
      const paint = ()=>{ const tm = ((s.t%720)+720)%720; const h = Math.floor(tm/60), m = Math.round(tm%60); sv.innerHTML = clockSVG(tm*0.5, m*6, `<circle cx="${f2(polar(P(50,50),34,90-m*6).x)}" cy="${f2(polar(P(50,50),34,90-m*6).y)}" r="4" fill="rgba(245,164,15,.25)" stroke="#f5a40f" stroke-width=".6" class="handle"/>`); info.innerHTML = `Het is <b>${h||12}.${String(m).padStart(2,'0')} uur</b>. Hoek tussen de wijzers: <b>${fmtN(clockAngle(h,m))}°</b>`; };
      let dragging = false, lastA = null;
      const toW = e => { const pt = sv.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const r = pt.matrixTransform(sv.getScreenCTM().inverse()); return {x:r.x,y:r.y}; };
      sv.addEventListener('pointerdown', e=>{ dragging = true; lastA = null; e.preventDefault(); try{ sv.setPointerCapture(e.pointerId); }catch(_){} });
      sv.addEventListener('pointermove', e=>{ if(!dragging) return; const p = toW(e); const a = norm360(90 - dirAng(P(50,50), p)); const mm = Math.round(a/6)%60; const cur = ((s.t%60)+60)%60; let d = mm - cur; if(d>30) d-=60; if(d<-30) d+=60; s.t += d; save(); paint(); });
      sv.addEventListener('pointerup', ()=>{ dragging=false; }); paint();
      qBlock(b, st, save, 'g', { html:`Zet de klok op een tijd waarbij de wijzers <b>${goal[1]}</b> vormen. Kies een heel of een half uur.`,
        check:()=>{ const tm = ((s.t%720)+720)%720; const m = tm%60; const a = clockAngle(Math.floor(tm/60), m);
          if(m!==0 && m!==30) return {ok:false, msg:'Kies een heel uur (…00) of een half uur (…30).'};
          return Math.abs(a-goal[0])<1e-9 ? {ok:true, msg:'Er zijn nog andere tijden die ook kloppen. Vind je er nog een?'} : {ok:false, msg:`Nu is de hoek ${fmtN(a)}°.`}; } });
    }},
  null, /* vroegere kaart met minuten en seconden: verwijderd (enkel hele graden) */
  { title:'Bereken zonder te meten', lvl:2, instr:'Gebruik wat je weet: een rechte hoek is 90°, een gestrekte hoek is 180°. Noteer enkel het getal.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const types = R.shuffle([0,1,2,3]);
      const grid = el('div','fig-row'); b.append(grid);
      types.forEach((t,i)=>{
        const O = P(55,46); const base = R.int(-12,12); const o = []; let ans, sol;
        if(t===0){ /* rechte hoek gesplitst */ const x = R.int(18,70); const d0 = base + R.pick([0,90]) ; const dR = d0+90, dm = d0 + (90-x);
          o.push(G.ray(O,polar(O,40,d0)), G.ray(O,polar(O,40,dR)), G.ray(O,polar(O,40,dm)), G.am(O,d0,d0+90,{style:'right', r:5}), G.am(O,dm,dR,{r:15, txt:x+'°'}), G.am(O,d0,dm,{r:10, txt:'α', tcol:'#f5a40f', color:'#f5a40f'}));
          ans = 90-x; sol = `α + ${x}° = 90° (rechte hoek) → α = 90° − ${x}° = <b>${ans}°</b>`; }
        if(t===1){ /* gestrekte hoek met twee stralen */ const x = R.int(25,70), y = R.int(25,70); const d0 = base;
          o.push(G.line(polar(O,-48,d0),polar(O,48,d0)), G.ray(O,polar(O,40,d0+x)), G.ray(O,polar(O,40,d0+180-y)), G.am(O,d0,d0+x,{r:12, txt:x+'°'}), G.am(O,d0+180-y,d0+180,{r:12, txt:y+'°'}), G.am(O,d0+x,d0+180-y,{r:8, txt:'α', tcol:'#f5a40f', color:'#f5a40f'}));
          ans = 180-x-y; sol = `${x}° + α + ${y}° = 180° (gestrekte hoek) → α = 180° − ${x}° − ${y}° = <b>${ans}°</b>`; }
        if(t===2){ /* gestrekte hoek met loodlijn */ const x = R.int(20,70); const d0 = base;
          o.push(G.line(polar(O,-48,d0),polar(O,48,d0)), G.ray(O,polar(O,40,d0+90)), G.ray(O,polar(O,40,d0+90+x)), G.am(O,d0,d0+90,{style:'right', r:5}), G.am(O,d0+90,d0+90+x,{r:14, txt:x+'°'}), G.am(O,d0+90+x,d0+180,{r:9, txt:'α', tcol:'#f5a40f', color:'#f5a40f'}));
          ans = 90-x; sol = `90° + ${x}° + α = 180° → α = 180° − 90° − ${x}° = <b>${ans}°</b>`; }
        if(t===3){ /* volle hoek in drie stukken */ const x = R.int(80,140), y = R.int(80,140); const d0 = base;
          o.push(G.ray(O,polar(O,40,d0)), G.ray(O,polar(O,40,d0+x)), G.ray(O,polar(O,40,d0+x+y)), G.am(O,d0,d0+x,{r:9, txt:x+'°'}), G.am(O,d0+x,d0+x+y,{r:12, txt:y+'°'}), G.am(O,d0+x+y,d0+360,{r:7, txt:'α', tcol:'#f5a40f', color:'#f5a40f'}));
          ans = 360-x-y; sol = `${x}° + ${y}° + α = 360° (volle hoek) → α = 360° − ${x}° − ${y}° = <b>${ans}°</b>`; }
        o.push(Object.assign(G.pt(O,''),{small:true}));
        const box = el('div','fig-card'); grid.append(box); box.append(el('div','', fig(110,92,o,{scale:3.4, margin:5})));
        qBlock(box, st, save, 'r'+i, {tv:[String(ans)], nr:LET[i]+'.', html:'α = [[0:xs]]°', mode:'decimal', check:degIs(ans), sol});
      });
    }}
  ]};

/* ---------------- 7. HOEKEN METEN EN TEKENEN ---------------- */
function measAngleQ(R, nm, opt={}){
  const a = opt.a || R.int(12,168);
  const r = pickIn(R, ()=>{ const V = P(R.int(30,170), R.int(25,105)); const d1 = R.int(0,359); return {V, d1, A:polar(V,LEG,d1), C:polar(V,LEG,d1+a)}; }, 200, 130, 6);
  const F = angleObjs(r.V, r.d1, r.d1+a, nm, {L1:LEG, L2:LEG});
  return {a, V:r.V, d1:r.d1, objs:F.objs};
}
function measDemo(V, d1, a, valTxt){
  return [{say:'Leg het <b>nulpunt</b> op het hoekpunt en de tekenzijde op één been.', geo:{x:V.x, y:V.y, rot:d1}},
    {say:`Lees af waar het tweede been de gradenboog snijdt. ${a<90?'Scherpe hoek: neem het kleinste getal.':'Stompe hoek: neem het grootste getal.'} Je leest <b>${valTxt}</b>.`, hl:`<circle cx="${f2(polar(V,PROT_R,d1+a).x)}" cy="${f2(polar(V,PROT_R,d1+a).y)}" r="2.4" fill="none" stroke="${DEMO}" stroke-width=".45"/>`, wait:2400}];
}
/* controle: tweede been tekenen vanuit V, vanaf eerste been d1, hoek a (beide kanten toegelaten) */
function secondLegCheck(B, V, d1, a, nVert, extra={}){
  const rays = CK.rays(B, V, .9, 10).filter(r=>adiff(r.dir, d1) > 2);
  if(!rays.length) return {ok:false, msg:`Teken het tweede been: een lijn die in ${nVert} begint, langs je geodriehoek.`};
  const sweepOf = r => { const s = norm360(r.dir-d1); return a>180 ? (Math.abs(s-a)<Math.abs((360-s)-a) ? s : 360-s) : Math.min(s, 360-s); };
  const best = rays.map(r=>({r, s:sweepOf(r)})).sort((x,y)=>Math.abs(x.s-a)-Math.abs(y.s-a))[0];
  if(Math.abs(best.s - a) > 1.05) return {ok:false, msg:`Jouw hoek is ${Math.round(best.s)}°, niet ${a}°. Leg het nulpunt op ${nVert} en de tekenzijde op het eerste been. ${a<90?'Scherpe hoek: lees het kleinste getal.':a<180?'Stompe hoek: lees het grootste getal.':''}`};
  const ccw = Math.abs(norm360(best.r.dir-d1) - a) < Math.abs(norm360(d1-best.r.dir) - a);
  const lo = ccw ? d1 : best.r.dir, mid = norm360(lo + a/2);
  return {ok:true, dir:best.r.dir, mid, lo};
}

SEC.hoekmeten = { id:'hoekmeten', ic:'gradenboog', nav:'Hoeken meten en tekenen', title:'Hoeken meten en tekenen',
  tip:'<b>Meten:</b> nulpunt op het hoekpunt, tekenzijde op één been, aflezen bij het tweede been. <b>Scherpe hoek</b> → kleinste getal, <b>stompe hoek</b> → grootste getal.<br><b>Tekenen:</b> nulpunt op het hoekpunt, tekenzijde op het been, hulppunt aan de rand van je geodriehoek bij de juiste graad (tik net buiten de rand of op de gradenboog), dan de halfrechte trekken en een boogje zetten.',
  cards:[
  { title:'Schat eerst, meet dan', lvl:1, instr:'Schat eerst de hoekgrootte. Meet daarna met je geodriehoek en kies de juiste benaming.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const sizes = R.shuffle([R.int(15,80), R.int(95,165), R.int(20,170)]);
      sizes.forEach((a,i)=>{ const nm = R.letters(3); const Q = measAngleQ(R, nm, {a});
        const nmT = `${nm[0]}${hat(nm[1])}${nm[2]}`;
        qBlock(b, st, save, 'm'+i, { nr:LET[i]+'.', block:true, html:'', html2:`<div class="step"><span class="step-lab">Schatting</span>${nmT} ≈ [[0:xs]]° &nbsp; <span class="step-lab" style="min-width:auto">Meting</span>${nmT} = [[1:xs]]°</div>`, block2:true, mode:'decimal',
          board:{w:200, h:130, tools:['pencil','eraser','geo'], given:Q.objs},
          choice:SOORT.slice(1,5), choiceLabel:'benaming', choiceLast:true, tv:[String(a), String(a)], tc:soortVan(a),
          check:(v,c)=>{ const s = parseDeg(v[0]), m = parseDeg(v[1]); const okM = Math.abs(m-a)<=1.0001, okS = c===soortVan(a);
            let msg = '';
            if(!okM){ msg = Math.abs((180-m)-a)<=1.0001 ? 'Je las het verkeerde getal af. ' + (a<90?'Bij een scherpe hoek kies je het kleinste getal.':'Bij een stompe hoek kies je het grootste getal.') : 'Meet nog eens: nulpunt precies op het hoekpunt, tekenzijde precies op een been.'; }
            else if(!okS) msg = 'De meting klopt, maar de benaming niet.';
            else if(!isNaN(s)) msg = Math.abs(s-a)<=10 ? 'Goed geschat ook!' : `Je schatting (${fmtN(s)}°) lag nog ${fmtN(Math.abs(s-a))}° naast de meting. Oefen je ogen: vergelijk met een rechte hoek.`;
            return {ok:okM&&okS, fields:[isNaN(s)?false:null, okM], choiceOk:okS, msg}; },
          demo:()=>measDemo(Q.V, Q.d1, a, a+'°'), sol:`${nmT} = ${a}° (1° afwijking wordt goedgekeurd): een ${soortNaam(soortVan(a))}.` });
      });
    }},
  { title:'Teken het tweede been', lvl:2, instr:'Tekenen met je geodriehoek. Zet ook het punt op het tweede been, een boogje en de naam van de hoek (Griekse letter).', build:(b,st,save,key)=>{
      const R = makeR(st);
      const sizes = [R.int(20,85), R.int(95,170)];
      sizes.forEach((a,i)=>{ const [n1,nv,n2] = R.letters(3); const gr = R.pick(GREEK);
        const r = pickIn(R, ()=>{ const V = P(R.int(25,175), R.int(25,105)); const d1 = R.int(0,359); return {V, d1, A:polar(V,LEG,d1), C:polar(V,LEG,d1+a), C2:polar(V,LEG,d1-a)}; }, 200, 130, 6);
        const {V,d1} = r; const A = polar(V,LEG,d1);
        const given = [G.ray(V,A), ptOff(polar(V,LEG-6,d1), d1-90, n1), ptOff(V, d1+180, nv, 4)];
        qBlock(b, st, save, 't'+i, { nr:LET[i]+'.', block:true, html:`Teken het tweede been zodat <b>${n1}${hat(nv)}${n2} = ${a}° = ${gr}</b>. Zet een boogje en noteer ${gr} bij de hoek.`,
          board:{w:200, h:130, tools:['pencil','eraser','label','arc','geo'], given},
          check:(v,c,B)=>{ const r1 = secondLegCheck(B, V, d1, a, nv); if(!r1.ok) return r1;
            const rp = CK.needPt(B, n2, `Zet een punt op het tweede been en noem het ${n2}.`); if(rp.err) return {ok:false, msg:rp.err};
            if(lineDist(rp.p, V, polar(V,10,r1.dir))>.9 || dist(rp.p,V)<5) return {ok:false, msg:`${n2} moet op het tweede been liggen.`};
            if(!CK.amAt(B, V, r1.mid, a)) return {ok:false, msg:'Zet een boogje in de hoek die je tekende (kies <b>Boogje</b> en tik in de hoek bij het hoekpunt).'};
            if(!CK.hasLabel(B, V, 30, gr)) return {ok:false, msg:`Noteer ook de naam ${gr} bij de hoek (met <b>Benoem</b>).`};
            return {ok:true, msg:`${n1}${hatT(nv)}${n2} = ${a}°`}; },
          demo:()=>{ const H = polar(V, LEG, d1+a); const hp = edgeHp(V, d1, d1+a);
            return [{say:`Nulpunt op ${nv}, tekenzijde op het eerste been.`, geo:{x:V.x,y:V.y,rot:d1}}, {say:`Zet een hulppunt bij ${a}°${a<90?' (kleinste getal: scherpe hoek)':' (grootste getal: stompe hoek)'}.`, pt:hp}, {say:'Leg de tekenzijde door het hoekpunt en het hulppunt en trek de halfrechte.', geo:{x:V.x,y:V.y,rot:d1+a}}, {line:[V,H]}, {geoOff:true, pt:polar(V,LEG-8,d1+a), name:n2, lx:polar(P(0,0),4,d1+a+90).x, ly:polar(P(0,0),4,d1+a+90).y},
              {say:`Zet een boogje en noteer ${gr}.`, am:{vx:V.x,vy:V.y,a0:d1,a1:d1+a,r:9}}, {lb:{p:polar(V,15,d1+a/2), s:gr}, wait:900}]; } });
      });
    }},
  { title:'Teken een even grote hoek', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [n1,nA,n2,nO,nX] = R.letters(5); const a = R.pick([R.int(25,80), R.int(100,160)]);
      const VA = P(R.int(30,45), R.int(30,45)); const dA = R.int(-10,30); const FA = angleObjs(VA, dA, dA+a, [n1,nA,n2], {L1:45, L2:45});
      const O = P(R.int(115,130), R.int(78,95)); const dO = R.int(-8,8);
      qBlock(b, st, save, 'eq', { block:true, html:`Teken op de halfrechte [${nO}${nX} een hoek ${hat(nO)} zodat ${hat(nO)} = ${hat(nA)}. Zet een boogje in je hoek.`,
        board:{w:200, h:112, tools:['pencil','eraser','label','arc','geo'], given:[...FA.objs, ...rayGiven(O, dO, 66, nO, nX)]},
        check:(v,c,B)=>{ const r1 = secondLegCheck(B, O, dO, a, nO); if(!r1.ok) return {ok:false, msg: r1.msg.replace(`niet ${a}°`, `maar ${hatT(nA)} is ${a}°. Meet ${hatT(nA)} eerst`)};
          if(!CK.amAt(B, O, r1.mid, a)) return {ok:false, msg:'Je been staat goed. Zet nu nog een boogje in je hoek.'};
          return {ok:true, msg:`${hatT(nO)} = ${hatT(nA)} = ${a}°`}; },
        demo:()=>[...measDemo(VA, dA, a, a+'°'), {say:`Teken op [${nO}${nX} een hoek van ${a}°.`, geo:{x:O.x,y:O.y,rot:dO}}, {pt:edgeHp(O,dO,dO+a)}, {geo:{x:O.x,y:O.y,rot:dO+a}}, {line:[O,polar(O,60,dO+a)]}, {geoOff:true, am:{vx:O.x,vy:O.y,a0:dO,a1:dO+a,r:9}, wait:900}] });
    }},
  { title:'Teken de som en het verschil van twee hoeken', lvl:3, instr:'Meet de twee gegeven hoeken. Teken de nieuwe hoek aan het gegeven been.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nF,nG,nA,nB,nE,nC] = R.letters(6);
      const f = R.int(20,55), g = R.int(f+15, 95);
      const VF = P(22,30), VG = P(22,78); const dF = R.int(0,20), dG = R.int(-10,10);
      const objs = [...angleObjs(VF, dF, dF+f, [null,nF,null], {L1:40,L2:40}).objs, ...angleObjs(VG, dG, dG+g, [null,nG,null], {L1:40,L2:40}).objs];
      const A = P(110,46), dAr = R.int(-5,5); const E = P(118,100), dEr = R.int(-5,5);
      objs.push(...rayGiven(A, dAr, 70, nA, nB).slice(0,2), ...rayGiven(E, dEr, 66, nE, nC).slice(0,2));
      qBlock(b, st, save, 'sv', { block:true, html:`Teken aan [${nA}${nB} een hoek ${hat(nA)} = ${hat(nF)} + ${hat(nG)}. Teken aan [${nE}${nC} een hoek ${hat(nE)} = ${hat(nG)} − ${hat(nF)}. Zet telkens een boogje.`,
        board:{w:200, h:112, tools:['pencil','eraser','label','arc','geo'], given:objs},
        check:(v,c,B)=>{
          const one = (V, d0, want, nm, how)=>{ const rays = CK.rays(B,V,.9,10).filter(r=>adiff(r.dir,d0)>2); if(!rays.length) return {ok:false, msg:`Teken het tweede been van ${hatT(nm)}.`};
            const sw = r=>Math.min(norm360(r.dir-d0), norm360(d0-r.dir)); const bst = rays.sort((x,y)=>Math.abs(sw(x)-want)-Math.abs(sw(y)-want))[0];
            if(Math.abs(sw(bst)-want)>2.05) return {ok:false, msg:`${hatT(nm)} is ${Math.round(sw(bst))}°. ${how}`};
            const ccw = norm360(bst.dir-d0) <= 180; const mid = norm360((ccw?d0:bst.dir) + want/2);
            if(!CK.amAt(B,V,mid,want,4)) return {ok:false, msg:`Zet een boogje in ${hatT(nm)}.`}; return {ok:true}; };
          const r1 = one(A, dAr, f+g, nA, `Het moet ${hatT(nF)} + ${hatT(nG)} = ${f}° + ${g}° = ${f+g}° zijn.`); if(!r1.ok) return r1;
          const r2 = one(E, dEr, g-f, nE, `Het moet ${hatT(nG)} − ${hatT(nF)} = ${g}° − ${f}° = ${g-f}° zijn.`); if(!r2.ok) return r2;
          return {ok:true, msg:`${hatT(nA)} = ${f+g}° en ${hatT(nE)} = ${g-f}°.`}; },
        demo:()=>[...measDemo(VF,dF,f,f+'°'), ...measDemo(VG,dG,g,g+'°'), {say:`${hatT(nA)} = ${f}° + ${g}° = ${f+g}°`, geo:{x:A.x,y:A.y,rot:dAr}}, {pt:edgeHp(A,dAr,dAr+f+g)}, {geo:{x:A.x,y:A.y,rot:dAr+f+g}}, {line:[A,polar(A,55,dAr+f+g)]}, {am:{vx:A.x,vy:A.y,a0:dAr,a1:dAr+f+g,r:9}},
          {say:`${hatT(nE)} = ${g}° − ${f}° = ${g-f}°`, geo:{x:E.x,y:E.y,rot:dEr}}, {pt:edgeHp(E,dEr,dEr+g-f)}, {geo:{x:E.x,y:E.y,rot:dEr+g-f}}, {line:[E,polar(E,55,dEr+g-f)]}, {geoOff:true, am:{vx:E.x,vy:E.y,a0:dEr,a1:dEr+g-f,r:9}, wait:900}] });
    }},
  { title:'Teken een driehoek met een zijde en twee hoeken', lvl:3, build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nA,nO,nE,nM,nP] = R.letters(5);
      const L = R.int(5,7)*10; const m = R.int(35,70), p = R.int(35,70);
      const VM = P(22,24), VP = P(22,62); const dM = R.int(0,15), dP = R.int(0,15);
      const objs = [...angleObjs(VM, dM, dM+m, [null,nM,null], {L1:34,L2:34}).objs, ...angleObjs(VP, dP, dP+p, [null,nP,null], {L1:34,L2:34}).objs];
      const O = P(R.int(85,95), 100); objs.push(ptOff(O, 200, nO, 4));
      qBlock(b, st, save, 'aoe', { block:true, html:`Teken driehoek ${nA}${nO}${nE} met |${nO}${nE}| = ${L/10} cm, ${hat(nO)} = ${hat(nM)} en ${hat(nE)} = ${hat(nP)}. Begin in ${nO}; teken [${nO}${nE}] naar rechts en ${nA} erboven.`,
        board:{w:200, h:112, tools:['pencil','eraser','label','arc','geo','compass'], given:objs},
        check:(v,c,B)=>{ const re = CK.needPt(B,nE); if(re.err) return {ok:false, msg:re.err}; const E = re.p;
          if(Math.abs(dist(O,E)-L)>1.05) return {ok:false, msg:`|${nO}${nE}| moet ${L/10} cm zijn.`};
          const ra = CK.needPt(B,nA); if(ra.err) return {ok:false, msg:ra.err}; const A = ra.p;
          const aO = angBetween(dirAng(O,E), dirAng(O,A)), aE = angBetween(dirAng(E,O), dirAng(E,A));
          if(Math.abs(aO-m)>1.5) return {ok:false, msg:`${hatT(nO)} is ${Math.round(aO)}°, maar ${hatT(nM)} = ${m}°.`};
          if(Math.abs(aE-p)>1.5) return {ok:false, msg:`${hatT(nE)} is ${Math.round(aE)}°, maar ${hatT(nP)} = ${p}°.`};
          if(!CK.hasSeg(B,O,E) || !CK.through(B,O,A).length || !CK.through(B,E,A).length) return {ok:false, msg:'Teken de drie zijden van de driehoek.'};
          return {ok:true}; },
        demo:()=>{ const E = polar(O,L,0); const A = lineInter(O, polar(O,10,m), E, polar(E,10,180-p));
          return [...measDemo(VM,dM,m,m+'°'), ...measDemo(VP,dP,p,p+'°'), {say:`Teken [${nO}${nE}] van ${L/10} cm.`, geo:{x:O.x,y:O.y,rot:0}}, {line:[O,E]}, {pt:E, name:nE, ly:4.5},
            {say:`Teken in ${nO} een hoek van ${m}°.`, geo:{x:O.x,y:O.y,rot:m}}, {line:[O, polar(O, dist(O,A)+8, m)]}, {say:`Teken in ${nE} een hoek van ${p}°.`, geo:{x:E.x,y:E.y,rot:180-p}}, {line:[E, polar(E, dist(E,A)+8, 180-p)]}, {geoOff:true, pt:A, name:nA, ly:-4.5, say:`Het snijpunt is ${nA}.`}, {wait:900}]; } });
    }}
  ]};

/* ---------------- 8. INSPRINGENDE HOEKEN ---------------- */
function reflexDemo(V, d1, a, nm){
  const rest = a - 180, empty = 360 - a;
  return [
    {say:`<b>Manier 1:</b> trek het eerste been door, voorbij ${nm}. Dat is al een gestrekte hoek van 180°.`, geo:{x:V.x,y:V.y,rot:d1+180}}, {line:[V, polar(V,55,d1+180)], dash:'2 1.2', w:.35},
    {say:`Meet het stuk dat overblijft: ${rest}°. Samen: 180° + ${rest}° = <b>${a}°</b>.`, hl:`<circle cx="${f2(polar(V,PROT_R,d1+a).x)}" cy="${f2(polar(V,PROT_R,d1+a).y)}" r="2.4" fill="none" stroke="${DEMO}" stroke-width=".45"/>`, wait:2600},
    {say:`<b>Manier 2:</b> meet de “lege” hoek aan de andere kant: ${empty}°.`, geo:{x:V.x,y:V.y,rot:d1+a}},
    {say:`Een volle hoek is 360°, dus 360° − ${empty}° = <b>${a}°</b>.`, hl:`<circle cx="${f2(polar(V,PROT_R,d1+360).x)}" cy="${f2(polar(V,PROT_R,d1+360).y)}" r="2.4" fill="none" stroke="${DEMO}" stroke-width=".45"/>`, wait:2600}, {geoOff:true}
  ];
}
SEC.inspringend = { id:'inspringend', ic:'inspringend', nav:'Inspringende hoeken', title:'Inspringende hoeken: twee manieren',
  tip:'Een <b>inspringende hoek</b> ligt tussen 180° en 360°. Je gradenboog gaat maar tot 180°, dus je hebt een slimme manier nodig:<br><b>Manier 1:</b> trek één been door (dat is 180°) en meet wat overblijft: 180° + …<br><b>Manier 2:</b> meet de “lege” hoek aan de andere kant en trek die af van de volle hoek: 360° − …',
  cards:[
  { title:'Ontdek de twee manieren', lvl:1, build:(b,st,save,key)=>{
      let mode = 0;
      const V = P(100,58), d1 = 0;
      const btn1 = ctlBtn('Manier 1: 180° + …', ()=>{ mode = mode===1?0:1; anim(); }), btn2 = ctlBtn('Manier 2: 360° − …', ()=>{ mode = mode===2?0:2; anim(); });
      let prog = 1;
      const D = dynFig(b, { w:200, h:116, maxw:760, ctl:[el('span','','Sleep het rode punt. Kies een manier:'), btn1, btn2],
        pts:{K:{...polar(V,48,235), drag:true, c:p=>polar(V,48,dirAng(V,p))}},
        draw:Pt=>{ const a = norm360(dirAng(V,Pt.K)-d1) || 360; let s='';
          s += objSVG(G.ray(V, polar(V,70,d1))) + objSVG(G.ray(V, polar(V,70,dirAng(V,Pt.K))));
          s += objSVG(G.am(V, d1, d1+a, {r:9, color: a>180?'#1fa6ab':INK, w:.5, txt: fmtN(Math.round(a))+'°', size:4, tr:15}));
          if(mode===1 && a>180){ const t = prog; s += objSVG(G.seg(V, polar(V,70*t,d1+180), {dash:'2 1.2', color:'#f5a40f', w:.45}));
            s += objSVG(G.am(V, d1, d1+180*t, {r:22, color:'#f5a40f', w:.45, txt: t>.9?'180°':'', size:3.6, tr:26}));
            if(t>.99) s += objSVG(G.am(V, d1+180, d1+a, {r:28, color:'#b2452f', w:.45, txt: fmtN(Math.round(a-180))+'°', size:3.6, tr:32})); }
          if(mode===2 && a>180){ const t = prog; s += objSVG(G.am(V, d1+a, d1+a+(360-a)*t, {r:22, color:'#f5a40f', w:.5, txt: t>.9? fmtN(Math.round(360-a))+'°':'', size:3.6, tr:27, fill:'rgba(245,164,15,.12)'})); }
          s += objSVG(G.pt(V,''));
          return s; },
        info:Pt=>{ const a = Math.round(norm360(dirAng(V,Pt.K)-d1)) || 360;
          if(a<=180) return `Deze hoek is ${a}°: ${a===180?'een gestrekte hoek':'geen inspringende hoek'}. Sleep verder.`;
          if(mode===1) return `<b>Manier 1:</b> 180° + ${a-180}° = <b>${a}°</b>`;
          if(mode===2) return `<b>Manier 2:</b> 360° − ${360-a}° = <b>${a}°</b>`;
          return `Inspringende hoek van <b>${a}°</b>. Kies een manier om hem met je gradenboog te meten.`; } });
      function anim(){ btn1.classList.toggle('chosen', mode===1); btn2.classList.toggle('chosen', mode===2); prog = 0; tween(1100, t=>{ prog = t; D.redraw(); }); }
      qChoice(b, st, save, 'q1', {html:'Een inspringende hoek meet 255°. Hoe groot is de “lege” hoek aan de andere kant?', opts:[['75','75°'],['105','105°'],['165','165°'],['255','255°']], ans:'105', why:'360° − 255° = 105°.'});
      qChoice(b, st, save, 'q2', {html:'Je trekt een been door en meet nog 40° extra. Hoe groot is de inspringende hoek?', opts:[['140','140°'],['220','220°'],['320','320°'],['400','400°']], ans:'220', why:'180° + 40° = 220°.'});
    }},
  { title:'Meet op twee manieren', lvl:2, instr:'Meet de inspringende hoek met je geodriehoek. Vul beide manieren in.', build:(b,st,save,key)=>{
      const R = makeR(st);
      ['a.','b.'].forEach((nr,i)=>{
        const a = R.int(195,340); const [n1,nv,n2] = R.letters(3);
        const r = pickIn(R, ()=>{ const V = P(R.int(30,170), R.int(25,105)); const d1 = R.int(0,359); return {V,d1, A:polar(V,LEG,d1), C:polar(V,LEG,d1+a), E:polar(V,LEG,d1+180), E2:polar(V,LEG,d1+a+180)}; }, 200, 130, 4);
        const F = angleObjs(r.V, r.d1, r.d1+a, [n1,nv,n2], {L1:LEG, L2:LEG, r:7});
        qBlock(b, st, save, 'r'+i, { nr, block:true, html:`Hoe groot is de inspringende hoek ${n1}${hat(nv)}${n2}?`,
          tv:[a-180,a,360-a,a].map(String), html2:`<div class="step"><span class="step-lab">Manier 1</span>180° + [[0:xs]]° = [[1:xs]]°</div><div class="step"><span class="step-lab">Manier 2</span>360° − [[2:xs]]° = [[3:xs]]°</div>`, block2:true, mode:'decimal',
          board:{w:200, h:130, tools:['pencil','eraser','geo'], given:F.objs},
          check:v=>{ const x = v.map(parseDeg); const f = [Math.abs(x[0]-(a-180))<=1.0001, Math.abs(x[1]-a)<=1.0001 && Math.abs(x[1]-180-x[0])<1e-6, Math.abs(x[2]-(360-a))<=1.0001, Math.abs(x[3]-a)<=1.0001 && Math.abs(360-x[2]-x[3])<1e-6];
            let msg=''; if(!f[0]) msg = 'Manier 1: trek een been door voorbij het hoekpunt en meet het stuk dat overblijft.'; else if(!f[1]) msg='Manier 1: tel 180° op bij je meting.'; else if(!f[2]) msg='Manier 2: meet de hoek aan de andere kant (zonder boogje).'; else if(!f[3]) msg='Manier 2: trek je meting af van 360°.';
            return {ok:f.every(Boolean), fields:f, msg: msg || 'Beide manieren geven dezelfde hoek.'}; },
          demo:()=>reflexDemo(r.V, r.d1, a, nv), sol:`180° + ${a-180}° = ${a}° &nbsp;·&nbsp; 360° − ${360-a}° = ${a}°` });
      });
    }},
  { title:'Teken een inspringende hoek', lvl:2, instr:'Kies zelf je manier. Zet een boogje bij de inspringende hoek (tik aan de kant van de grote hoek).', build:(b,st,save,key)=>{
      const R = makeR(st);
      ['a.','b.'].forEach((nr,i)=>{
        const a = R.int(200,335); const [nv,n1] = R.letters(2);
        const d1 = R.pick([0,180,R.int(-15,15)]); const [V] = pickIn(R, ()=>{ const v = P(R.int(30,170), R.int(25,105)); return [v, polar(v,LEG,d1), polar(v,LEG,d1+a), polar(v,LEG,d1+180)]; }, 200, 130, 4);
        qBlock(b, st, save, 't'+i, { nr, block:true, html:`Teken aan het been een hoek ${hat(nv)} = <b>${a}°</b>.`,
          board:{w:200, h:130, tools:['pencil','eraser','arc','geo'], given:[G.ray(V, polar(V,LEG,d1)), ptOff(polar(V,LEG-6,d1), d1-90, n1), ptOff(V, d1+180+30, nv, 4)]},
          check:(v,c,B)=>{ const r1 = secondLegCheck(B, V, d1, a, nv); if(!r1.ok) return {ok:false, msg: r1.msg.includes('Jouw hoek') ? `${r1.msg.split('.')[0]}. Manier 1: trek het been door en teken nog ${a-180}° bij. Manier 2: teken aan de andere kant ${360-a}°.` : r1.msg};
            if(!CK.amAt(B, V, r1.mid, a, 4)) return {ok:false, msg:'Je been staat goed. Zet nu een boogje bij de <b>inspringende</b> hoek: tik aan de kant van de grote hoek.'};
            return {ok:true, msg:`${hatT(nv)} = ${a}°: 180° + ${a-180}° of 360° − ${360-a}°.`}; },
          demo:()=>[{say:'Manier 1: nulpunt op het hoekpunt, tekenzijde op het been. Het doorgetrokken been is al 180°.', geo:{x:V.x,y:V.y,rot:d1+180}}, {line:[V, polar(V,55,d1+180)], dash:'2 1.2', w:.3}, {say:`Zet een hulppunt bij ${a-180}°: 180° + ${a-180}° = ${a}°.`, pt:edgeHp(V,d1+180,d1+a)}, {say:'Trek het tweede been door het hulppunt.', geo:{x:V.x,y:V.y,rot:d1+a}}, {line:[V, polar(V,60,d1+a)]}, {geoOff:true, say:`Zet het boogje bij de grote hoek. (Manier 2: 360° − ${360-a}° = ${a}°.)`, am:{vx:V.x,vy:V.y,a0:d1,a1:d1+a,r:8}, wait:1500}] });
      });
    }},
  { title:'Bereken de inspringende hoek', lvl:3, build:(b,st,save,key)=>{
      const R = makeR(st);
      const grid = el('div','fig-row'); b.append(grid);
      for(let i=0;i<3;i++){
        const O = P(50,46); const d0 = R.int(-15,15); const o = []; let ans, sol;
        if(i===0){ const x = R.int(30,150); o.push(G.ray(O,polar(O,38,d0)), G.ray(O,polar(O,38,d0+x)), G.am(O,d0,d0+x,{r:9,txt:x+'°'}), G.am(O,d0+x,d0+360,{r:6,txt:'γ',tcol:'#f5a40f',color:'#f5a40f',tr:13})); ans = 360-x; sol = `γ = 360° − ${x}° = <b>${ans}°</b>`; }
        if(i===1){ const x = R.int(25,80); o.push(G.line(polar(O,-40,d0),polar(O,40,d0)), G.ray(O,polar(O,38,d0-x)), G.am(O,d0-x,d0,{r:12,txt:x+'°'}), G.am(O,d0,d0+360-x,{r:7,txt:'δ',tcol:'#f5a40f',color:'#f5a40f',tr:12})); ans = 360-x; sol = `δ = 180° + (180° − ${x}°) = 360° − ${x}° = <b>${ans}°</b>`; }
        if(i===2){ const x = R.int(20,70); o.push(G.line(polar(O,-40,d0),polar(O,40,d0)), G.ray(O,polar(O,38,d0+180+x)), G.am(O,d0+180,d0+180+x,{r:13,txt:x+'°'}), G.am(O,d0,d0+180+x,{r:7,txt:'ε',tcol:'#f5a40f',color:'#f5a40f',tr:12})); ans = 180+x; sol = `ε = 180° + ${x}° = <b>${ans}°</b> (een gestrekte hoek plus ${x}°)`; }
        o.push(Object.assign(G.pt(O,''),{small:true}));
        const box = el('div','fig-card'); grid.append(box); box.append(el('div','',fig(100,92,o,{scale:3.6, margin:5})));
        qBlock(box, st, save, 'b'+i, {tv:[String(ans)], nr:LET[i]+'.', html:`${['γ','δ','ε'][i]} = [[0:xs]]°`, mode:'decimal', check:degIs(ans), sol});
      }
    }}
  ]};

/* ============================================================
   INHOUD DEEL 4: bissectrice en verbanden tussen hoeken
   ============================================================ */
const nrAng = (L, i) => `${hat(L)}<sub>${i}</sub>`;
const nrAngT = (L, i) => `${hatT(L)}${'₀₁₂₃₄₅₆₇₈₉'[i]}`;
const RED = '#f5a40f';

/* ---------------- 9. BISSECTRICE ---------------- */
function bisTile(kind, R){
  const V = P(10, 40); const d1 = R.int(0,15); const o = []; let a, ans, why, bdir, bfrom = V;
  const bl = (dir, extra={}) => G.seg(polar(V,-6,dir), polar(V,46,dir), Object.assign({color:'#1fa6ab', w:.5}, extra));
  if(kind==='eq'){ a = 2*R.int(18,40); const h=a/2; o.push(G.ray(V,polar(V,42,d1)), G.ray(V,polar(V,42,d1+a)), bl(d1+h), G.am(V,d1,d1+h,{r:13, txt:h+'°'}), G.am(V,d1+h,d1+a,{r:17, txt:h+'°'})); bdir=d1+h; ans='j'; why='De twee delen zijn even groot en b gaat door het hoekpunt.'; }
  if(kind==='neq'){ const x = R.int(28,45), y = Math.max(20, x + R.pick([-12,-8,8,12,20])); a = x+y; o.push(G.ray(V,polar(V,42,d1)), G.ray(V,polar(V,42,d1+a)), bl(d1+x), G.am(V,d1,d1+x,{r:13, txt:x+'°'}), G.am(V,d1+x,d1+a,{r:17, txt:y+'°'})); bdir=d1+x; ans='n'; why='De twee delen zijn niet even groot.'; }
  if(kind==='marks'){ a = 2*R.int(20,45); const h=a/2; o.push(G.ray(V,polar(V,42,d1)), G.ray(V,polar(V,42,d1+a)), bl(d1+h), G.am(V,d1,d1+h,{r:12, n:1}), G.am(V,d1+h,d1+a,{r:12, n:1})); bdir=d1+h; ans='j'; why='Dezelfde merktekens: de twee delen zijn even groot.'; }
  if(kind==='off'){ a = 2*R.int(20,40); const h=a/2; const sh = polar(V, 6, d1+h-90); o.push(G.ray(V,polar(V,42,d1)), G.ray(V,polar(V,42,d1+a)), G.seg(polar(sh,4,d1+h), polar(sh,46,d1+h), {color:'#1fa6ab', w:.5})); bdir=d1+h; bfrom=sh; ans='n'; why='b gaat niet door het hoekpunt. Een bissectrice gaat altijd door het hoekpunt.'; }
  if(kind==='total'){ a = 2*R.int(25,60); const h=a/2; o.push(G.ray(V,polar(V,42,d1)), G.ray(V,polar(V,42,d1+a)), bl(d1+h), G.am(V,d1,d1+a,{r:9, txt:a+'°'}), G.am(V,d1,d1+h,{r:20, txt:(h+R.pick([-5,5,0]))+'°'})); bdir=d1+h; const shown = o[o.length-1].txt; ans = parseInt(shown)===h ? 'j' : 'n'; why = ans==='j' ? `${a}° : 2 = ${h}°.` : `${a}° : 2 = ${h}°, niet ${shown}.`; }
  o.push(G.txt(polar(bfrom,50,bdir), 'b', {italic:true, color:'#1fa6ab', size:4.4}));
  o.push(Object.assign(G.pt(V,''),{small:true}));
  return {svg:fig(60,60,o,{scale:3, margin:4}), ans, why};
}
SEC.bissectrice = { id:'bissectrice', ic:'bissectrice', nav:'Bissectrice', title:'De bissectrice van een hoek',
  tip:'De <b>bissectrice</b> (deellijn) van een hoek is de rechte door het hoekpunt die de hoek in twee even grote hoeken deelt.<br><b>Werkwijze:</b> 1) meet de hoek, 2) bereken de helft en zet een hulppunt bij die halve hoek, 3) trek de rechte door het hulppunt en het hoekpunt, benoem ze en duid de even grote hoeken aan met merktekens.',
  cards:[
  { title:'Is b de bissectrice?', lvl:1, build:(b,st,save,key)=>{
      const R = makeR(st);
      const kinds = R.shuffle(['eq','neq','marks','off','total']).slice(0,4);
      const grid = el('div','fig-row'); b.append(grid);
      kinds.forEach((k,i)=>{ const t = bisTile(k,R); const box = el('div','fig-card'); grid.append(box);
        qChoice(box, st, save, 'b'+i, {nr:LET[i]+'.', html:'Is <i>b</i> de bissectrice?', fig:t.svg, opts:[['j','Ja'],['n','Neen']], ans:t.ans, why:t.why}); });
    }},
  { title:'Teken de bissectrice', lvl:2, instr:'Werk zoals in je boek: meten, halveren, hulppunt, rechte. Benoem de bissectrice b en zet merktekens op de twee even grote hoeken.', build:(b,st,save,key)=>{
      const R = makeR(st);
      [R.int(20,40)*2, R.int(48,82)*2].forEach((a,i)=>{
        const [n1,nv,n2] = R.letters(3);
        const r = pickIn(R, ()=>{ const V = P(R.int(25,175), R.int(25,105)); const d1 = R.int(0,359); return {V,d1, A:polar(V,LEG,d1), C:polar(V,LEG,d1+a), B:polar(V,14,d1+a/2+180)}; }, 200, 130, 5);
        const F = angleObjs(r.V, r.d1, r.d1+a, [n1,nv,n2], {L1:LEG, L2:LEG, mark:false});
        const {V,d1} = r; const bd = d1 + a/2;
        qBlock(b, st, save, 'bt'+i, { nr:LET[i]+'.', block:true, html:`Teken de bissectrice <i>b</i> van ${hat(nv)}.`,
          html2:`<div class="step">${hat(nv)} = [[0:xs]]°, dus ${nrAng(nv,1)} = ${nrAng(nv,2)} = [[1:xs]]°</div>`, block2:true, mode:'decimal', tv:[String(a), String(a/2)],
          board:{w:200, h:130, tools:['pencil','eraser','label','arc','tick','geo'], given:F.objs},
          check:(v,c,B)=>{ const x = parseDeg(v[0]), h = parseDeg(v[1]); const f = [Math.abs(x-a)<=1.0001, Math.abs(h-a/2)<=.5001 && Math.abs(h-x/2)<1e-6];
            if(!f[0]) return {ok:false, fields:f, msg:`Meet ${hatT(nv)} eerst nauwkeurig.`};
            if(!f[1]) return {ok:false, fields:f, msg:`De bissectrice deelt de hoek in twee: ${fmtN(x)}° : 2 = ${fmtN(x/2)}°.`};
            const ls = B.segs().filter(s=>segDist(V,s.a,s.b)<=.9 && Math.max(dist(V,s.a),dist(V,s.b))>15);
            if(!ls.length) return {ok:false, fields:f, msg:`Teken de bissectrice: een rechte door het hoekpunt ${nv} en je hulppunt bij ${fmtN(a/2)}°.`};
            const good = ls.find(s=>{ const far = dist(V,s.a)>dist(V,s.b)?s.a:s.b; return adiff(dirAng(V,far), bd) <= 1.05; });
            if(!good){ const s=ls[0]; const far = dist(V,s.a)>dist(V,s.b)?s.a:s.b; return {ok:false, fields:f, msg:`Je rechte maakt ${Math.round(angBetween(dirAng(V,far),d1))}° en ${Math.round(angBetween(dirAng(V,far),d1+a))}° met de benen. Die moeten allebei ${fmtN(a/2)}° zijn.`}; }
            if(!CK.labelsNear(B, V, 75).some(l=>l.c==='b' && lineDist(l, good.a, good.b) <= 9)) return {ok:false, fields:f, msg:'Benoem de bissectrice: zet de letter b bij je rechte (met <b>Benoem</b>).'};
            const m1 = CK.amAt(B, V, d1+a/4, a/2), m2 = CK.amAt(B, V, d1+3*a/4, a/2);
            if(!m1 || !m2) return {ok:false, fields:f, msg:'Zet een boogje in elk van de twee halve hoeken (kies <b>Boogje</b> en tik in elke helft).'};
            if(!m1.n || m1.n!==m2.n) return {ok:false, fields:f, msg:'Zet op beide boogjes hetzelfde merkteken (kies <b>Merkteken</b> en tik op de boogjes).'};
            return {ok:true, fields:f, msg:`b is de bissectrice van ${hatT(nv)} ⟺ ${nrAngT(nv,1)} = ${nrAngT(nv,2)} en ${nv} ∈ b`}; },
          demo:()=>[...measDemo(V, d1, a, a+'°'), {say:`De helft van ${a}° is ${a/2}°. Zet een hulppunt bij ${a/2}°.`, pt:edgeHp(V,d1,bd)}, {say:'Trek een rechte door het hulppunt en het hoekpunt.', geo:{x:V.x,y:V.y,rot:bd}}, {line:[polar(V,-12,bd), polar(V,64,bd)]},
            {geoOff:true, lb:{p:polar(polar(V,60,bd),4,bd+90), s:'b'}, say:'Benoem de rechte b en zet dezelfde merktekens in de twee helften.'}, {am:{vx:V.x,vy:V.y,a0:d1,a1:bd,r:11,n:1}}, {am:{vx:V.x,vy:V.y,a0:bd,a1:d1+a,r:11,n:1}, wait:1000}] });
      });
    }},
  { title:'Bereken met de bissectrice', lvl:2, instr:'Bereken zonder te meten. De rechte b is telkens de bissectrice.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const grid = el('div','fig-row'); b.append(grid);
      /* figuur 1: rechte met halfrechte, b deelt de ene hoek */
      { const [nB] = R.letters(1); const y = 2*R.int(20,40); const x = 180-y; const V = P(50,50); const d0 = R.int(-8,8);
        const o = [G.line(polar(V,-46,d0),polar(V,46,d0)), G.ray(V,polar(V,42,d0+x)), G.seg(V,polar(V,44,d0+x/2),{color:'#1fa6ab', w:.5}), G.txt(polar(V,48,d0+x/2),'b',{italic:true,color:'#1fa6ab'}),
          G.am(V,d0,d0+x/2,{r:9, txt:'1', tr:13}), G.am(V,d0+x/2,d0+x,{r:9, txt:'2', tr:13}), G.am(V,d0+x,d0+180,{r:11, txt:y+'°', tr:16}), ptOff(V, d0-90, nB, 4)];
        const box = el('div','fig-card'); grid.append(box); box.append(el('div','',fig(100,70,o,{scale:3.2, margin:4})));
        qBlock(box, st, save, 'f1', { tv:[fmtDeg(x/2), fmtDeg(x/2)], html:`${nrAng(nB,1)} = [[0:xs]]° &nbsp; ${nrAng(nB,2)} = [[1:xs]]°`, mode:'decimal',
          check:v=>{ const p = v.map(parseDeg); const f = [Math.abs(p[0]-x/2)<1e-6, Math.abs(p[1]-x/2)<1e-6]; return {ok:f[0]&&f[1], fields:f, msg:`Eerst de hele hoek: 180° − ${y}° = ${x}° (nevenhoeken). De bissectrice halveert die.`}; },
          sol:`${nrAng(nB,1)} + ${nrAng(nB,2)} = 180° − ${y}° = ${x}° (gestrekte hoek), dus ${nrAng(nB,1)} = ${nrAng(nB,2)} = ${x}° : 2 = <b>${fmtDeg(x/2)}</b>` }); }
      /* figuur 2: twee snijdende rechten, b deelt hoek 1+2 */
      { const [nC] = R.letters(1); const h = R.int(12,38); const x = 2*h; const V = P(50,50); const d0 = R.int(-8,8);
        const o = [G.line(polar(V,-46,d0),polar(V,46,d0)), G.line(polar(V,-46,d0+x),polar(V,46,d0+x)), G.seg(V,polar(V,44,d0+h),{color:'#1fa6ab', w:.5}), G.txt(polar(V,48,d0+h),'b',{italic:true,color:'#1fa6ab'}),
          G.am(V,d0,d0+h,{r:12, txt:'1', tr:16}), G.am(V,d0+h,d0+x,{r:12, txt:'2', tr:16}), G.am(V,d0+x,d0+180,{r:8, txt:'3', tr:12}), G.am(V,d0+180,d0+180+x,{r:8, txt:'4', tr:12}), ptOff(V, d0-100, nC, 4)];
        const box = el('div','fig-card'); grid.append(box); box.append(el('div','',fig(100,100,o,{scale:3.2, margin:4})));
        qBlock(box, st, save, 'f2', { tv:[h,180-x,x].map(String), html:`${nrAng(nC,1)} = ${h}°. ${nrAng(nC,2)} = [[0:xs]]° &nbsp; ${nrAng(nC,3)} = [[1:xs]]° &nbsp; ${nrAng(nC,4)} = [[2:xs]]°`, mode:'decimal',
          check:v=>{ const p = v.map(parseDeg); const f = [Math.abs(p[0]-h)<1e-6, Math.abs(p[1]-(180-x))<1e-6, Math.abs(p[2]-x)<1e-6]; return {ok:f.every(Boolean), fields:f, msg: !f[0]?'b is de bissectrice: beide helften zijn even groot.':!f[1]?`${nrAngT(nC,3)} is een nevenhoek van ${nrAngT(nC,1)} + ${nrAngT(nC,2)}.`:`${nrAngT(nC,4)} is overstaand met ${nrAngT(nC,1)} + ${nrAngT(nC,2)}.`}; },
          sol:`${nrAng(nC,2)} = ${nrAng(nC,1)} = ${h}° (bissectrice) · ${nrAng(nC,1)} + ${nrAng(nC,2)} = ${x}° · ${nrAng(nC,3)} = 180° − ${x}° = ${180-x}° (nevenhoeken) · ${nrAng(nC,4)} = ${x}° (overstaande hoeken)` }); }
    }},
  { title:'Ontdek: bissectrices van nevenhoeken', lvl:3, build:(b,st,save,key)=>{
      b.append(el('p','instructions','Sleep het rode punt. a en b zijn de bissectrices van de twee nevenhoeken. Kijk naar de hoek tussen a en b.'));
      const V = P(100,72);
      dynFig(b, { w:200, h:84, maxw:760, pts:{K:{...polar(V,50,62), drag:true, c:p=>polar(V,50,clamp(dirAng(V,p)>270?0:dirAng(V,p),8,172))}},
        draw:Pt=>{ const t = dirAng(V,Pt.K); const b1 = t/2, b2 = (t+180)/2;
          return objSVG(G.line(polar(V,-80,0),polar(V,80,0))) + objSVG(G.ray(V,polar(V,64,t))) + objSVG(G.seg(V,polar(V,58,b1),{color:'#1fa6ab',w:.5})) + objSVG(G.seg(V,polar(V,58,b2),{color:RED,w:.5})) +
            objSVG(G.txt(polar(V,62,b1),'a',{italic:true,color:'#1fa6ab'})) + objSVG(G.txt(polar(V,62,b2),'b',{italic:true,color:RED})) +
            objSVG(G.am(V,0,b1,{r:14,n:1})) + objSVG(G.am(V,b1,t,{r:14,n:1})) + objSVG(G.am(V,t,b2,{r:18,n:2})) + objSVG(G.am(V,b2,180,{r:18,n:2})) + objSVG(G.am(V,b1,b2,{r:8,color:'#b2452f',txt:'?',tr:24})); },
        info:Pt=>{ const t = dirAng(V,Pt.K); return `Nevenhoeken: ${fmtN(Math.round(t))}° en ${fmtN(Math.round(180-t))}° &nbsp;·&nbsp; hoek tussen a en b: <b>${fmtN(Math.round((180-t)/2+t/2))}°</b>`; } });
      qBlock(b, st, save, 'ab', { tv:['90'], html:'De bissectrices van twee nevenhoeken maken altijd een hoek van [[0:xs]]°.', mode:'numeric', check:degIs(90), why:'De helft van 180° is 90°: de bissectrices staan loodrecht op elkaar.', sol:'Halve hoek + halve hoek = de helft van 180° = 90°. De bissectrices staan loodrecht op elkaar.' });
    }},
  { title:'Ontdek: bissectrices in een driehoek', lvl:3, build:(b,st,save,key)=>{
      b.append(el('p','instructions','Sleep de hoekpunten. De drie lijnen zijn de bissectrices van de hoeken van de driehoek.'));
      const bis = (V, A, C, col) => { const d = bisDir(dirAng(V,A), dirAng(V,C)); const far = lineInter(V, polar(V,10,d), A, C); return objSVG(G.seg(V, far, {color:col, w:.45})); };
      dynFig(b, { w:200, h:110, maxw:760, pts:{A:{x:25,y:95,drag:true}, B:{x:120,y:12,drag:true}, C:{x:180,y:96,drag:true}},
        draw:Pt=>{ const {A,B:Bq,C} = Pt; const I = incenter(A,Bq,C);
          return objSVG({t:'poly', pts:[A,Bq,C], stroke:INK, w:.45}) + bis(A,Bq,C,'#1fa6ab') + bis(Bq,C,A,RED) + bis(C,A,Bq,'#173436') + objSVG({t:'circ', cx:I.x, cy:I.y, r:1.6, color:'#b2452f', w:.4}) +
            objSVG(G.pt(A,'A',{lx:-3,ly:2.5})) + objSVG(G.pt(Bq,'B',{lx:0,ly:-3.5})) + objSVG(G.pt(C,'C',{lx:3,ly:2.5})); },
        info:()=>'Wat merk je op over de drie bissectrices, hoe je de driehoek ook vervormt?' });
      qChoice(b, st, save, 'tri', {html:'De drie bissectrices van een driehoek …', ans:'conc', opts:[['par','zijn evenwijdig'],['conc','gaan door één punt: ze zijn concurrent'],['loo','staan loodrecht op elkaar'],['soms','gaan soms door één punt']], why:'Ze snijden elkaar altijd in één punt: concurrente rechten.'});
    }}
  ]};

/* ---------------- 10. VERBANDEN TUSSEN HOEKEN ---------------- */
const REASONS = [['over','overstaande hoeken'],['neven','nevenhoeken'],['loodr','loodrechte stand (samen 90°)'],['gestr','gestrekte hoek (180°)'],['vol','volle hoek (360°)'],['bis','bissectrice']];
function compSupQ(R, a){ /* a in decimale graden */
  const c = 90-a, s = 180-a;
  return { tv:[fmtDeg(c), fmtDeg(s)], html:`<b>${fmtDeg(a)}</b> &nbsp; complement: [[0:sm]] &nbsp; supplement: [[1:sm]]`, size:'',
    check:v=>{ const x=parseDeg(v[0]), y=parseDeg(v[1]); const f=[Math.abs(x-c)<1e-6, Math.abs(y-s)<1e-6];
      return {ok:f[0]&&f[1], fields:f, msg: !f[0] && Math.abs(x-s)<1e-6 ? 'Je verwisselde complement (samen 90°) en supplement (samen 180°).' : ''}; },
    sol:`90° − ${fmtDeg(a)} = <b>${fmtDeg(c)}</b> &nbsp; 180° − ${fmtDeg(a)} = <b>${fmtDeg(s)}</b>` };
}
/* hoekmodel (hulp bij vraagstukken): de echte hoeken als figuur */
function angleModel(rows, total, opt={}){
  const CM = {'#f8c9bd':'#fdd98a','#bfdfe3':'#bfeaec','#fde4a8':'#f6eedb','#d9c7f0':'#e3dcf3','#eadfc7':'#efe7d6'};
  const sumW = rows.reduce((a,r)=>a+r.parts.reduce((b,p)=>b+(p.deg!=null?p.deg:p.w),0),0);
  const T = opt.totalDeg || (+((total&&total.txt||'').match(/(90|180|360)°/)||[0,0])[1]) || 180;
  const k = T/sumW, r = 100, V = {x:0,y:0};
  const pt = a=>{ const q=polar(V,r,a); return f2(q.x)+' '+f2(q.y); };
  let s = '', a = 0; const rays = [{a:0, solid:true}], brk = [];
  rows.forEach(row=>{ const ga0 = a;
    row.parts.forEach((p,pi)=>{ const d = (p.deg!=null?p.deg:p.w)*k, a0 = a, a1 = a+d;
      s += `<path class="sec" d="M0 0 ${arcPath(V,r,a0,a1).replace(/^M/,'L')}Z" fill="${CM[p.col]||p.col||'#bfeaec'}" stroke="none"/>`;
      if(p.txt && d >= 11){ const m = polar(V, d>=40 ? r*.6 : r*.74, (a0+a1)/2); s += `<text x="${f2(m.x)}" y="${f2(m.y+4)}" font-size="${d>=25?12:10}" text-anchor="middle" fill="${INK}" font-weight="800">${esc(p.txt)}</text>`; }
      a = a1; rays.push({a, solid: pi===row.parts.length-1}); });
    if(row.label) brk.push({a0:ga0, a1:a, label:row.label, lv:0}); });
  (opt.brackets||[]).forEach(b=>brk.push(Object.assign({lv:1},b)));
  /* stralen: grens tussen hoeken = volle lijn, gelijke delen binnen een hoek = stippellijn */
  rays.forEach(R=>{ if(T>=360 && R.a>=359.9) return; const q = polar(V, r+4, R.a);
    s += `<line x1="0" y1="0" x2="${f2(q.x)}" y2="${f2(q.y)}" stroke="${INK}" stroke-width="${R.solid?1.6:.9}" ${R.solid?'':'stroke-dasharray="3 3"'} stroke-linecap="round"/>`; });
  /* teken voor de rechte hoek: een losse L met even lange benen */
  const rightMark = a0=>{ const e1 = polar({x:0,y:0},1,a0), e2 = polar({x:0,y:0},1,a0+90), g = 4.5, q = 10;
    const c = {x:g*(e1.x+e2.x), y:g*(e1.y+e2.y)}; return `<polyline points="${f2(c.x+q*e2.x)},${f2(c.y+q*e2.y)} ${f2(c.x)},${f2(c.y)} ${f2(c.x+q*e1.x)},${f2(c.y+q*e1.y)}" fill="none" stroke="${INK}" stroke-width="1"/>`; };
  (opt.rightAt || (T===90 ? [0] : [])).forEach(a0=>{ s += rightMark(a0); });
  s += `<circle cx="0" cy="0" r="2.6" fill="${INK}"/>`;
  /* haken met de naam van elke hoek */
  const pts = [V];
  brk.forEach(b=>{ const rb = r + 12 + b.lv*22, m = (b.a0+b.a1)/2, c = Math.cos(m*Math.PI/180);
    s += `<path d="${arcPath(V, rb, b.a0+.8, b.a1-.8)}" fill="none" stroke="${b.lv?'#173436':'#127a7f'}" stroke-width="1.6" stroke-linecap="round"/>`;
    [b.a0+.8, b.a1-.8].forEach(e=>{ const i = polar(V, rb-4, e), o = polar(V, rb+4, e); s += `<line x1="${f2(i.x)}" y1="${f2(i.y)}" x2="${f2(o.x)}" y2="${f2(o.y)}" stroke="${b.lv?'#173436':'#127a7f'}" stroke-width="1.6"/>`; });
    const t = polar(V, rb+9, m); const anc = c>.3?'start':c<-.3?'end':'middle';
    s += `<text x="${f2(t.x)}" y="${f2(t.y+(Math.sin(m*Math.PI/180)>.3?-2:5))}" font-size="11.5" text-anchor="${anc}" fill="${b.lv?'#173436':'#127a7f'}" font-weight="800">${esc(b.label)}</text>`;
    const w = b.label.length*6.6; pts.push(anc==='start'?{x:t.x+w,y:t.y}:anc==='end'?{x:t.x-w,y:t.y}:{x:t.x-w/2,y:t.y},{x:t.x,y:t.y-12},{x:t.x,y:t.y+8}); });
  for(let x=0; x<=T; x+=5){ pts.push(polar(V, r+6, x)); }
  let x0 = Math.min(...pts.map(q=>q.x))-8, x1 = Math.max(...pts.map(q=>q.x))+8, y0 = Math.min(...pts.map(q=>q.y))-8, y1 = Math.max(...pts.map(q=>q.y))+8;
  if(total && total.txt){ s += `<text x="${f2((x0+x1)/2)}" y="${f2(y1+14)}" font-size="12.5" text-anchor="middle" fill="#173436" font-weight="800">${esc(total.txt)}</text>`; y1 += 22; }
  return `<svg viewBox="${f2(x0)} ${f2(y0)} ${f2(x1-x0)} ${f2(y1-y0)}" style="width:100%;max-width:${T===90?300:T===180?420:340}px;display:block" class="bar-model ang-model">${s}</svg>`;
}
function showAngles(host, svg){ host.innerHTML = svg; const secs = [...host.querySelectorAll('.sec')]; secs.forEach(x=>x.style.opacity=0); tween(900, t=>secs.forEach((x,i)=>{ x.style.opacity = Math.max(0, Math.min(1, t*(secs.length+1) - i)); })); }
/* strookmodel (hulp bij vraagstukken) */
function barModel(rows, total, unitW){
  /* rows: [{label, parts:[{w, txt, col}]}] ; total: {w, txt} */
  const W = 300, x0 = 62; let y = 10; let s = '';
  rows.forEach(r=>{ s += `<text x="${x0-6}" y="${y+9}" font-size="9" text-anchor="end" fill="${INK}" font-weight="700">${esc(r.label)}</text>`; let x = x0;
    r.parts.forEach(p=>{ const w = p.w*unitW; s += `<rect class="bar" x="${f2(x)}" y="${y}" width="${f2(w)}" height="18" fill="${p.col||'#bfdfe3'}" stroke="${INK}" stroke-width=".8" rx="2"/><text x="${f2(x+w/2)}" y="${y+12.5}" font-size="8.5" text-anchor="middle" fill="${INK}" font-weight="700">${esc(p.txt||'')}</text>`; x += w; });
    y += 26; });
  if(total){
    /* alle stukken achter elkaar: samen vormen ze het geheel */
    y += 4; s += `<text x="${x0-6}" y="${y+9}" font-size="9" text-anchor="end" fill="${RED}" font-weight="800">samen</text>`; let x = x0;
    rows.forEach(r=>r.parts.forEach(p=>{ const w = p.w*unitW; s += `<rect class="bar" x="${f2(x)}" y="${y}" width="${f2(w)}" height="18" fill="${p.col||'#bfdfe3'}" stroke="${INK}" stroke-width=".8" rx="2"/><text x="${f2(x+w/2)}" y="${y+12.5}" font-size="8.5" text-anchor="middle" fill="${INK}" font-weight="700">${esc(p.txt||'')}</text>`; x += w; }));
    y += 22; const w = x - x0;
    s += `<path d="M${x0} ${y} v4 h${f2(w)} v-4" fill="none" stroke="${RED}" stroke-width="1.2"/><text x="${f2(x0+w/2)}" y="${y+15}" font-size="9" text-anchor="middle" fill="${RED}" font-weight="800">${esc(total.txt)}</text>`; y += 20; }
  return `<svg viewBox="0 0 ${W+20} ${y+4}" style="width:100%;max-width:440px;display:block" class="bar-model">${s}</svg>`;
}
function showBars(host, svg){ host.innerHTML = svg; const bars = [...host.querySelectorAll('rect.bar')]; bars.forEach(r=>{ r.dataset.w = r.getAttribute('width'); r.setAttribute('width','0'); }); tween(900, t=>bars.forEach(r=>r.setAttribute('width', f2(+r.dataset.w*t)))); }
function vraagstuk(R, type){
  const T = type!=null ? type : R.int(0,5);
  let txt, ans, sol, bars, why='';
  if(T===0){ const k = R.pick([2,4,5,8,9]); ans = 90*k/(k+1); txt = `Een hoek is ${k} keer zo groot als zijn complement. Hoe groot is die hoek?`;
    bars = angleModel([{label:'complement', parts:[{w:1,txt:'?'}]},{label:'hoek', parts:Array.from({length:k},()=>({w:1,txt:'?',col:'#f8c9bd'}))}], {w:k+1, txt:'samen 90°'}, 200/(k+1));
    sol = `Complement = 1 deel, hoek = ${k} delen. Samen ${k+1} delen = 90°, dus 1 deel = ${fmtN(90/(k+1))}°. De hoek is ${k} · ${fmtN(90/(k+1))}° = <b>${fmtDeg(ans)}</b>.`; }
  if(T===1){ const k = R.pick([2,3,5,8,11]); ans = 180*k/(k+1); txt = `Een hoek is ${k} keer zo groot als zijn supplement. Hoe groot is die hoek?`;
    bars = angleModel([{label:'supplement', parts:[{w:1,txt:'?'}]},{label:'hoek', parts:Array.from({length:k},()=>({w:1,txt:'?',col:'#f8c9bd'}))}], {w:k+1, txt:'samen 180°'}, 200/(k+1));
    sol = `${k+1} gelijke delen = 180°, dus 1 deel = ${fmtN(180/(k+1))}°. De hoek is ${k} · ${fmtN(180/(k+1))}° = <b>${fmtDeg(ans)}</b>.`; }
  if(T===2){ const d = 2*R.int(10,45); ans = (180-d)/2; txt = `Het supplement van een hoek is ${d}° groter dan de hoek zelf. Hoe groot is die hoek?`;
    bars = angleModel([{label:'hoek', parts:[{w:ans,txt:'?',col:'#f8c9bd'}]},{label:'supplement', parts:[{w:ans,txt:'?'},{w:d,txt:d+'°',col:'#fde4a8'}]}], {w:180, txt:'hoek + supplement = 180°'}, 200/180);
    sol = `Hoek + (hoek + ${d}°) = 180°, dus twee keer de hoek = 180° − ${d}° = ${180-d}°. De hoek is ${180-d}° : 2 = <b>${fmtDeg(ans)}</b>.`; }
  if(T===3){ const d = 2*R.int(5,30); ans = (90+d)/2; txt = `Het complement van een hoek is ${d}° kleiner dan de hoek zelf. Hoe groot is die hoek?`;
    bars = angleModel([{label:'hoek', parts:[{w:ans-d,txt:'?',col:'#f8c9bd'},{w:d,txt:d+'°',col:'#fde4a8'}]},{label:'complement', parts:[{w:ans-d,txt:'?'}]}], {w:90+0, txt:'hoek + complement = 90°'}, 200/90);
    sol = `(Complement + ${d}°) + complement = 90°, dus twee keer het complement = ${90-d}°: complement = ${fmtN((90-d)/2)}°. De hoek is ${fmtN((90-d)/2)}° + ${d}° = <b>${fmtDeg(ans)}</b>.`; }
  if(T===4){ const k = R.pick([3,4,5,7,10]); ans = 90 - 90/(k-1); txt = `Het supplement van een hoek is ${k} keer zo groot als het complement van die hoek. Hoe groot is de hoek?`;
    bars = angleModel([{label:'hoek', parts:[{deg:ans, txt:'?', col:'#f8c9bd'}]}, {label:'c', parts:[{deg:90/(k-1), txt:'', col:'#bfdfe3'}]}, {label:'', parts:[{deg:90, txt:'90°', col:'#fde4a8'}]}], null, {totalDeg:180, rightAt:[90], brackets:[{a0:ans, a1:180, label:`supplement = ${k} · c`}]});
    sol = `Het supplement is altijd 90° groter dan het complement. Dus ${k} · c = c + 90°, of ${k-1} · c = 90°: c = ${fmtN(90/(k-1))}°. De hoek is 90° − ${fmtN(90/(k-1))}° = <b>${fmtDeg(ans)}</b>.`; }
  if(T===5){ const k = R.pick([2,3,4,5]); ans = 180/(k+1); txt = `Op een rechte staan twee nevenhoeken: α en ${k}α. Hoe groot is α?`;
    bars = angleModel([{label:'α', parts:[{w:1,txt:'α',col:'#f8c9bd'}]},{label:`${k}α`, parts:Array.from({length:k},()=>({w:1,txt:'α'}))}], {w:k+1, txt:'samen 180°'}, 200/(k+1));
    sol = `α + ${k}α = ${k+1}α = 180°, dus α = 180° : ${k+1} = <b>${fmtDeg(ans)}</b>.`; }
  return {txt, ans, sol, bars};
}

SEC.verbanden = { id:'verbanden', ic:'verband', nav:'Verbanden tussen hoeken', title:'Verbanden tussen hoeken',
  cheat:`<h3>Spiekbriefje · verbanden</h3><table>
    <tr><td>overstaande hoeken</td><td>benen in elkaars verlengde · altijd even groot</td></tr>
    <tr><td>aanliggende hoeken</td><td>gemeenschappelijk been, de andere benen aan weerskanten</td></tr>
    <tr><td>nevenhoeken</td><td>aanliggend én samen een gestrekte hoek (180°)</td></tr></table>`,
  cards:[
  { title:'Ontdek: overstaande hoeken en nevenhoeken', lvl:1, build:(b,st,save,key)=>{
      b.append(el('p','instructions','Sleep de rode punten: zo draai je de twee rechten. Kies welke hoeken je wil vergelijken.'));
      const O = P(100,55); let hl = 'over';
      const bO = ctlBtn('Overstaande hoeken', ()=>{ hl='over'; paintBtns(); D.redraw(); }), bN = ctlBtn('Nevenhoeken', ()=>{ hl='neven'; paintBtns(); D.redraw(); });
      const paintBtns = ()=>{ bO.classList.toggle('chosen', hl==='over'); bN.classList.toggle('chosen', hl==='neven'); };
      const D = dynFig(b, { w:200, h:110, maxw:760, ctl:[bO,bN],
        pts:{K:{...polar(O,48,20), drag:true, c:p=>polar(O,48,dirAng(O,p))}, L:{...polar(O,48,105), drag:true, c:p=>polar(O,48,dirAng(O,p))}},
        draw:Pt=>{ const a1 = dirAng(O,Pt.K), a2 = dirAng(O,Pt.L);
          const dirs = [a1, a2, a1+180, a2+180].map(norm360).sort((x,y)=>x-y);
          let s = objSVG(G.line(polar(O,-70,a1),polar(O,70,a1))) + objSVG(G.line(polar(O,-70,a2),polar(O,70,a2)));
          const cols = hl==='over' ? ['#f19a86','#bfdfe3','#f19a86','#bfdfe3'] : ['#f19a86','#fde4a8','#e6ecea','#e6ecea'];
          for(let i=0;i<4;i++){ const lo = dirs[i], hi = i<3 ? dirs[i+1] : dirs[0]+360; s += objSVG(G.am(O, lo, hi, {r:14, fill:cols[i], color:INK, w:.3, txt:`${i+1}: ${Math.round(hi-lo)}°`, size:3.4, tr:23})); }
          return s + objSVG(G.pt(O,'',{})); },
        info:Pt=>{ const a1 = dirAng(O,Pt.K), a2 = dirAng(O,Pt.L); const dirs = [a1,a2,a1+180,a2+180].map(norm360).sort((x,y)=>x-y); const h = [0,1,2,3].map(i=>Math.round((i<3?dirs[i+1]:dirs[0]+360)-dirs[i]));
          return hl==='over' ? `Hoek 1 en hoek 3 zijn overstaand: ${h[0]}° en ${h[2]}°. Hoek 2 en hoek 4 ook: ${h[1]}° en ${h[3]}°.` : `Hoek 1 en hoek 2 zijn nevenhoeken: ${h[0]}° + ${h[1]}° = <b>${h[0]+h[1]}°</b>.`; } });
      paintBtns();
      qChoice(b, st, save, 'o', {html:'Overstaande hoeken zijn altijd …', ans:'eq', opts:[['eq','even groot'],['s90','samen 90°'],['s180','samen 180°'],['scherp','scherp']], why:'Hoe je de rechten ook draait: overstaande hoeken zijn even groot.'});
      qChoice(b, st, save, 'n', {html:'Nevenhoeken zijn altijd …', ans:'s180', opts:[['eq','even groot'],['s90','samen 90°'],['s180','samen 180°'],['stomp','stomp']], why:'Samen vormen ze een gestrekte hoek: 180°.'});
    }},
  { title:'Hoe noem je deze hoeken?', lvl:1, instr:'Kies de best passende naam.', build:(b,st,save,key)=>{
      const R = makeR(st); const [nA,nB,nC] = R.letters(3);
      const o = []; const A = P(42,40), Bq = P(122,40), C = P(178,40);
      const t = R.int(30,70); const dA = R.int(-10,10);
      o.push(G.line(polar(A,-36,dA),polar(A,36,dA)), G.line(polar(A,-36,dA+t),polar(A,36,dA+t)));
      [[dA,dA+t],[dA+t,dA+180],[dA+180,dA+180+t],[dA+180+t,dA+360]].forEach(([p,q],i)=>o.push(G.am(A,p,q,{r:7,txt:String(i+1),tr:11})));
      o.push(ptOff(A,dA-60,nA,4));
      const b1 = R.int(30,60), b2 = R.int(30,60); const dB = R.int(-5,20);
      o.push(G.ray(Bq,polar(Bq,32,dB)), G.ray(Bq,polar(Bq,32,dB+b1)), G.ray(Bq,polar(Bq,32,dB+b1+b2)), G.am(Bq,dB,dB+b1,{r:8,txt:'1',tr:12}), G.am(Bq,dB+b1,dB+b1+b2,{r:8,txt:'2',tr:12}), ptOff(Bq,dB-80,nB,4));
      const c1 = R.int(25,65); o.push(G.ray(C,polar(C,30,90)), G.ray(C,polar(C,30,90+c1)), G.ray(C,polar(C,30,180)), G.am(C,90,90+c1,{r:8,txt:'1',tr:12}), G.am(C,90+c1,180,{r:8,txt:'2',tr:12}), G.am(C,90,180,{r:4,style:'right'}), ptOff(C,-45,nC,4));
      b.append(el('div','',fig(200,80,o,{scale:4, margin:4})));
      const OPT = [['over','overstaande hoeken'],['neven','nevenhoeken'],['aanl','aanliggende hoeken (geen nevenhoeken)']];
      const Q = [[`${nrAng(nA,1)} en ${nrAng(nA,3)}`,'over','Hun benen liggen in elkaars verlengde.'],[`${nrAng(nA,1)} en ${nrAng(nA,2)}`,'neven','Ze zijn aanliggend en vormen samen een gestrekte hoek.'],[`${nrAng(nA,2)} en ${nrAng(nA,4)}`,'over','Hun benen liggen in elkaars verlengde.'],[`${nrAng(nA,4)} en ${nrAng(nA,1)}`,'neven','Aanliggend en samen 180°.'],[`${nrAng(nB,1)} en ${nrAng(nB,2)}`,'aanl','Ze hebben een gemeenschappelijk been, maar samen zijn ze geen 180°.'],[`${nrAng(nC,1)} en ${nrAng(nC,2)}`,'aanl','Ze hebben een gemeenschappelijk been. Samen vormen ze een rechte hoek, geen gestrekte hoek: dus geen nevenhoeken.']];
      const grid = el('div','tf-grid'); b.append(grid);
      R.shuffle(Q).slice(0,5).forEach(([h,a,w],i)=>qChoice(grid, st, save, 'q'+i, {nr:(i+1)+'.', html:h, opts:OPT, ans:a, why:w}));
    }},
  { title:'Complement en supplement', lvl:2, instr:'Het complement van α is 90° − α, het supplement van α is 180° − α.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const vals = R.shuffle([R.int(5,30), R.int(31,60), R.int(61,89), R.int(5,89), R.int(5,89)]);
      vals.forEach((a,i)=>qBlock(b, st, save, 'cs'+i, Object.assign({nr:LET[i]+'.'}, compSupQ(R,a))));
    }},
  { title:'Vul aan', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st);
      const a1 = R.int(12,78), a2 = R.int(95,170), a3 = R.int(100,170), a4 = R.int(100,170), a5 = R.int(10,80);
      const items = R.shuffle([
        {html:`Het complement van een hoek van ${a1}° is een hoek van [[0:xs]]°.`, tv:[String(90-a1)], check:degIs(90-a1), sol:`90° − ${a1}° = <b>${90-a1}°</b>`},
        {html:`De supplementaire hoek van een hoek van ${a2}° is een hoek van [[0:xs]]°.`, tv:[String(180-a2)], check:degIs(180-a2), sol:`180° − ${a2}° = <b>${180-a2}°</b>`},
        {html:`Het complement van het supplement van een hoek van ${a3}° is een hoek van [[0:xs]]°.`, tv:[String(a3-90)], check:degIs(a3-90), sol:`Supplement: 180° − ${a3}° = ${180-a3}°. Complement daarvan: 90° − ${180-a3}° = <b>${a3-90}°</b>`},
        {html:`Het supplement van het supplement van een hoek van ${a4}° is een hoek van [[0:xs]]°.`, tv:[String(a4)], check:degIs(a4), sol:`Twee keer het supplement nemen geeft de hoek zelf terug: <b>${a4}°</b>`},
        {html:`De complementaire hoek van een hoek van ${a5}° is een hoek van [[0:xs]]°.`, tv:[String(90-a5)], check:degIs(90-a5), sol:`90° − ${a5}° = <b>${90-a5}°</b>`},
        {html:'Het complement van een hoek is die hoek zelf. Dan meet die hoek [[0:xs]]°.', tv:['45'], check:degIs(45), sol:'α + α = 90°, dus α = <b>45°</b>'},
        {html:'Het supplement van een hoek is die hoek zelf. Dan meet die hoek [[0:xs]]°.', tv:['90'], check:degIs(90), sol:'α + α = 180°, dus α = <b>90°</b>'},
        {tv:['180° − α'], html:'Het supplement van α is [[0:md]].', check:v=>({ok:/^180°?-α$/.test(nsp(v[0]).replace(/[−–]/g,'-')), msg:'Schrijf bv. 180° − α.'}), sol:'<b>180° − α</b>'}
      ]).slice(0,6);
      items.forEach((q,i)=>qBlock(b, st, save, 'v'+i, Object.assign({nr:LET[i]+'.', mode:'text'}, q)));
    }},
  { title:'Bereken alle hoeken en geef de reden', lvl:2, instr:'Bereken zonder te meten. Kies telkens ook waarom.', build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nC] = R.letters(1); const x = R.int(22,68); const V = P(60,48); const d0 = R.int(-6,6);
      /* rechte l (d0), rechte m (d0+x), loodlijn p (d0+90) */
      const o = [G.line(polar(V,-55,d0),polar(V,55,d0)), G.line(polar(V,-46,d0+x),polar(V,46,d0+x)), G.ray(V,polar(V,44,d0+90)),
        G.am(V,d0,d0+x,{r:12,txt:'1',tr:16}), G.am(V,d0+x,d0+90,{r:12,txt:'2',tr:16}), G.am(V,d0+90,d0+180,{r:9,txt:'3',tr:13}), G.am(V,d0+90,d0+180,{r:4,style:'right'}),
        G.am(V,d0+180,d0+180+x,{r:12,txt:'4',tr:16}), G.am(V,d0+180+x,d0+360,{r:9,txt:'5',tr:14}), ptOff(V,d0-120,nC,4.5)];
      b.append(el('div','',fig(120,96,o,{scale:3.6, margin:4})));
      b.append(el('p','instructions', `Gegeven: ${nrAng(nC,1)} = ${x}°.`));
      const rows = [[2, 90-x, ['loodr'], `${nrAngT(nC,1)} + ${nrAngT(nC,2)} = 90°`], [3, 90, ['loodr'], 'loodrechte stand'], [4, x, ['over'], `overstaand met ${nrAngT(nC,1)}`], [5, 180-x, ['neven','gestr'], `nevenhoek van ${nrAngT(nC,1)} (of van ${nrAngT(nC,4)})`]];
      rows.forEach(([i,val,rs,why],k)=>qBlock(b, st, save, 'r'+k, { tv:[String(val)], tc:rs[0], html:`${nrAng(nC,i)} = [[0:xs]]° &nbsp;want …`, mode:'decimal', choice:REASONS, choiceLast:true,
        check:(v,c)=>{ const okV = Math.abs(parseDeg(v[0])-val)<1e-6, okR = rs.includes(c); return {ok:okV&&okR, fields:[okV], choiceOk:okR, msg: !okV ? 'De hoekgrootte klopt niet.' : !okR ? 'De hoekgrootte klopt, maar kies een betere reden.' : ''}; },
        sol:`${nrAng(nC,i)} = <b>${val}°</b> (${why})` }));
    }},
  { title:'Teken met je geodriehoek', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st);
      /* a: overstaande hoeken */
      { const [nB] = R.letters(1); const x = R.int(30,80); const Bp = P(100,56);
        qBlock(b, st, save, 'ov', { nr:'a.', block:true, html:`Teken twee overstaande hoeken ${nrAng(nB,1)} en ${nrAng(nB,2)} met hoekpunt ${nB} en ${nrAng(nB,1)} = ${x}°. Zet in beide hoeken een boogje en noteer 1 en 2.`,
          board:{w:200, h:112, tools:['pencil','eraser','label','arc','geo'], given:[G.pt(Bp,nB,{lx:-3,ly:4})]},
          check:(v,c,B)=>{ const ls = B.segs().filter(s=>{ const L=dist(s.a,s.b), t=projT(Bp,s.a,s.b)*L; return lineDist(Bp,s.a,s.b)<=.9 && t>=8 && t<=L-8; });
            if(ls.length<2) return {ok:false, msg:`Teken twee <b>rechten</b> door ${nB}: elke rechte loopt aan beide kanten voorbij ${nB}.`};
            let pair = null; for(let i=0;i<ls.length;i++) for(let j=i+1;j<ls.length;j++){ const d = ldiff(dirAng(ls[i].a,ls[i].b), dirAng(ls[j].a,ls[j].b)); if(Math.abs(d-x)<=1.05 || Math.abs((180-d)-x)<=1.05) pair = [i,j]; }
            if(!pair){ const d = ldiff(dirAng(ls[0].a,ls[0].b), dirAng(ls[1].a,ls[1].b)); return {ok:false, msg:`Je rechten maken hoeken van ${Math.round(d)}° en ${Math.round(180-d)}°. Er moet een hoek van ${x}° bij zijn.`}; }
            const ms = B.ams().filter(m=>dist(P(m.vx,m.vy),Bp)<1.2 && Math.abs((m.a1-m.a0)-x)<=3);
            const opp = ms.some(m1=>ms.some(m2=>m1!==m2 && adiff((m1.a0+m1.a1)/2+180, (m2.a0+m2.a1)/2)<5));
            if(!opp) return {ok:false, msg:`Zet een boogje in twee <b>overstaande</b> hoeken van ${x}°.`};
            const labs = CK.labelsNear(B, Bp, 22).map(l=>l.c); if(!labs.includes('1') || !labs.includes('2')) return {ok:false, msg:'Noteer de nummers 1 en 2 in de hoeken (met <b>Benoem</b>).'};
            return {ok:true, msg:`${nrAngT(nB,1)} = ${nrAngT(nB,2)} = ${x}°: overstaande hoeken zijn even groot.`}; },
          demo:()=>{ const d = R.int(0,0); return [{say:'Teken een rechte door het punt.', geo:{x:Bp.x,y:Bp.y,rot:d}}, {line:[polar(Bp,-50,d),polar(Bp,50,d)]}, {say:`Zet een hulppunt bij ${x}° en trek een tweede rechte door ${nB}.`, pt:edgeHp(Bp,d,d+x)}, {geo:{x:Bp.x,y:Bp.y,rot:d+x}}, {line:[polar(Bp,-50,d+x),polar(Bp,50,d+x)]}, {geoOff:true, am:{vx:Bp.x,vy:Bp.y,a0:d,a1:d+x,r:9}}, {lb:{p:polar(Bp,14,d+x/2),s:'1'}}, {am:{vx:Bp.x,vy:Bp.y,a0:d+180,a1:d+180+x,r:9}}, {lb:{p:polar(Bp,14,d+180+x/2),s:'2'}, wait:900}]; } }); }
      /* b: nevenhoek */
      { const [n1,nV,n2] = R.letters(3); const a = R.int(35,140); const V = P(100,62); const d1 = R.int(-5,5);
        const F = angleObjs(V, d1, d1+a, [n1,nV,n2], {L1:52, L2:52, am:{txt:'α', r:9}});
        qBlock(b, st, save, 'nv', { nr:'b.', block:true, html:`Teken een nevenhoek β van α (zonder te meten). Duid β aan met een boogje en noteer β.`,
          board:{w:200, h:112, tools:['pencil','eraser','label','arc','geo'], given:F.objs},
          check:(v,c,B)=>{ const ext = [d1, d1+a].map(d=>({d, ok:B.segs().some(s=>lineDist(V,s.a,s.b)<=.9 && ldiff(dirAng(s.a,s.b),d)<1 && [s.a,s.b].some(e=>dist(V,e)>=10 && adiff(dirAng(V,e), d+180)<2))}));
            const e = ext.find(x=>x.ok); if(!e) return {ok:false, msg:'Trek één been van α door, voorbij het hoekpunt: zo ontstaat een gestrekte hoek.'};
            const other = e.d===d1 ? d1+a : d1; const sweep = 180-a;
            const mid = e.d===d1 ? norm360(d1+a+sweep/2) : norm360(d1+180+sweep/2);
            if(!CK.amAt(B, V, mid, sweep, 4)) return {ok:false, msg:'Zet een boogje in de nevenhoek β (naast α, aan de doorgetrokken kant).'};
            if(!CK.hasLabel(B, V, 30, 'β')) return {ok:false, msg:'Noteer β bij de nevenhoek.'};
            return {ok:true, msg:`α + β = 180°, dus β = ${180-a}°.`}; },
          demo:()=>[{say:'Trek het been door, voorbij het hoekpunt.', geo:{x:V.x,y:V.y,rot:d1+180}}, {line:[V, polar(V,50,d1+180)]}, {geoOff:true, say:'β ligt naast α: samen vormen ze een gestrekte hoek.', am:{vx:V.x,vy:V.y,a0:d1+a,a1:d1+180,r:9}}, {lb:{p:polar(V,15,d1+a+(180-a)/2), s:'β'}, wait:900}] }); }
    }},
  { title:'Waar of niet waar?', lvl:2, build:(b,st,save,key)=>{
      const R = makeR(st); const x = R.int(15,75);
      const pool = [
        [`Als twee rechten snijden en één hoek is ${x}°, dan is de overstaande hoek ook ${x}°.`,'w','Overstaande hoeken zijn even groot.'],
        [`Als twee rechten snijden en één hoek is ${x}°, dan is de nevenhoek ${180-x}°.`,'w',`Samen vormen ze een gestrekte hoek: ${x}° + ${180-x}° = 180°.`],
        [`Als twee rechten snijden en één hoek is ${x}°, dan is de overstaande hoek ${180-x}°.`,'n','Overstaande hoeken zijn even groot.'],
        ['Nevenhoeken vormen samen altijd een gestrekte hoek.','w','Nevenhoeken zijn aanliggend en samen 180°.'],
        ['Overstaande hoeken zijn altijd aanliggend.','n','Overstaande hoeken hebben geen gemeenschappelijk been.'],
        ['Twee nevenhoeken kunnen even groot zijn.','w','Als ze allebei 90° zijn.'],
        ['Twee nevenhoeken kunnen allebei stomp zijn.','n','Twee stompe hoeken zijn samen meer dan 180°.'],
        ['Aanliggende hoeken zijn altijd nevenhoeken.','n','Aanliggende hoeken vormen niet altijd samen een gestrekte hoek.'],
        ['Als twee hoeken samen 180° zijn, dan zijn het zeker nevenhoeken.','n','Ze moeten ook aanliggend zijn (een gemeenschappelijk been hebben).'],
        ['Als twee rechten snijden, ontstaan er twee paar overstaande hoeken.','w','Hoek 1 en 3, en hoek 2 en 4.'],
        [`Als een hoek ${x}° is, dan is zijn nevenhoek scherp.`,'n',`De nevenhoek is ${180-x}°: dat is een stompe hoek.`],
        ['Als twee rechten loodrecht snijden, zijn alle vier de hoeken 90°.','w','Overstaand en nevenhoeken van 90° zijn allemaal 90°.']
      ];
      const grid = el('div','tf-grid'); b.append(grid);
      R.shuffle(pool).slice(0,6).forEach(([h,a,w],i)=>qChoice(grid, st, save, 'w'+i, {nr:(i+1)+'.', html:h, opts:[['w','Waar'],['n','Niet waar']], ans:a, why:w}));
    }},
  { title:'De pizza', lvl:3, build:(b,st,save,key)=>{
      const R = makeR(st);
      const s = st.pz || (st.pz = {n:6});
      const range = el('input'); range.type='range'; range.min=2; range.max=24; range.value=s.n; range.setAttribute('aria-label','aantal stukken');
      const lab = el('span','', ''); lab.style.minWidth = '9rem';
      const box = el('div','dyn'); const sv = document.createElementNS('http://www.w3.org/2000/svg','svg'); sv.setAttribute('viewBox','0 0 120 100'); sv.style.maxWidth='420px'; sv.style.display='block'; sv.style.margin='0 auto'; box.append(sv);
      const ctl = el('div','dyn-ctl'); ctl.append(el('span','','Aantal stukken:'), range, lab); box.append(ctl); b.append(box);
      let shown = s.n;
      const paint = n => { const C = P(60,50), r = 42; let h = `<circle cx="60" cy="50" r="${r+3}" fill="#e8b46a"/><circle cx="60" cy="50" r="${r}" fill="#f6d27a"/>`;
        [[48,38],[72,62],[66,30],[44,64],[80,44],[36,46]].forEach(([x,y])=>h += `<circle cx="${x}" cy="${y}" r="3.2" fill="#c8483a"/>`);
        const k = Math.round(n); for(let i=0;i<k;i++){ const p = polar(C, r+3, 90 + i*360/n); h += `<line x1="60" y1="50" x2="${f2(p.x)}" y2="${f2(p.y)}" stroke="#7a4b1c" stroke-width=".9"/>`; }
        h += objSVG(G.am(C, 90, 90+360/n, {r:13, color:RED, w:.7, fill:'rgba(245,164,15,.25)'}));
        sv.innerHTML = h; lab.innerHTML = `<b>${k}</b> stukken → <b>${fmtN(roundTo(360/k,2))}°</b> per stuk`; };
      range.addEventListener('input', ()=>{ const from = shown, to = +range.value; s.n = to; save(); tween(350, t=>{ shown = from + (to-from)*t; paint(Math.round(shown)); }, ()=>{ shown = to; paint(to); }); });
      paint(s.n);
      const ang = R.pick([24,30,36,40,45,20,18,15,60,72]); const nn = R.pick([8,10,12]); const kk = R.int(5,nn-1);
      qBlock(b, st, save, 'p1', { tv:[String(360/ang)], nr:'a.', html:`In hoeveel gelijke stukken moet je de pizza verdelen zodat elke hoek in het midden ${ang}° is? [[0:xs]] stukken`, mode:'numeric', check:numIs(360/ang), sol:`Een volle hoek is 360°. 360° : ${ang}° = <b>${360/ang}</b> stukken.` });
      qBlock(b, st, save, 'p2', { tv:[fmtN(kk*360/nn)], tc:soortVan(kk*360/nn), nr:'b.', html:`De pizza is in ${nn} gelijke stukken verdeeld. Hoe groot is de hoek van ${kk} stukken samen? [[0:xs]]° Welke soort hoek is dat?`, mode:'decimal', choice:SOORT.slice(1,6), choiceLast:true,
        check:(v,c)=>{ const val = kk*360/nn; const okV = Math.abs(parseDeg(v[0])-val)<1e-6, okS = c===soortVan(val); return {ok:okV&&okS, fields:[okV], choiceOk:okS, msg:!okV?`Eén stuk is 360° : ${nn} = ${fmtN(360/nn)}°.`:''}; },
        sol:`360° : ${nn} = ${fmtN(360/nn)}° per stuk; ${kk} · ${fmtN(360/nn)}° = <b>${fmtN(kk*360/nn)}°</b>: een ${soortNaam(soortVan(kk*360/nn))}.` });
    }},
  { title:'Vraagstukken', lvl:3, instr:'', build:(b,st,save,key)=>{
      const R = makeR(st);
      const types = R.shuffle([0,1,2,3,4,5]).slice(0,4);
      types.forEach((t,i)=>{ const V = vraagstuk(R, t);
        const res = qBlock(b, st, save, 'v'+i, { tv:[fmtDeg(V.ans)], nr:LET[i]+'.', html:`${V.txt} [[0:md]]`, mode:'text', check:degIs(V.ans, .001), sol:V.sol });
        const hb = el('button','linkbtn','Hulp: toon de hoeken'); hb.type='button'; const host = el('div','bar-model'); host.hidden = true;
        hb.addEventListener('click', ()=>{ host.hidden = !host.hidden; if(!host.hidden) showAngles(host, V.bars); });
        res.row.querySelector('.q-act').append(hb); res.row.insertBefore(host, res.row.querySelector('.fb'));
      });
    }}
  ]};

/* ============================================================
   INHOUD DEEL 5: zoek de fout en proeftoetsen
   ============================================================ */
SEC.fout = { id:'fout', ic:'fout', nav:'Zoek de fout', title:'Zoek de fout', sepBefore:true,
  tip:'In elke oplossing zit precies één fout. Klik op de eerste stap die fout is. Daarna verbeter je die stap.',
  cards:[
  { title:'Foute oplossingen', build:(b,st,save,key)=>{
      const R = makeR(st);
      const [nA,nB,nM] = R.letters(3);
      const L = 2*R.int(28,44); const half = L/2; const wrongH = (L-10)/20;
      const x = R.int(25,65), dm = R.int(21,49), e = R.int(100,140), bis = 4*R.int(28,40)+2;
      const h = R.pick([1,2,4,5,7,8,10,11]);
      const E = [
        {task:`|${nA}${nB}| = ${fmtN(L/10)} cm. Waar ligt het midden ${nM}?`, lines:[`|${nA}${nB}| = ${fmtN(L/10)} cm`, `${fmtN(L/10)} : 2 = ${fmtN(wrongH)}`, `${nM} ligt op ${fmtN(wrongH)} cm van ${nA}`], wrong:1, cons:[2],
          why:'De deling is fout. Controleer: het dubbel van je antwoord moet weer de hele lengte geven.', fix:`${fmtN(L/10)} : 2 = [[0:xs]]`, mode:'decimal', fixCheck:numIs(half/10, 1e-9), fixSol:`${fmtN(L/10)} : 2 = ${fmtN(half/10)} cm`},
        {task:`Herleid: 0,${String(R.int(11,89))} mm = … cm`, lines:['Van mm naar cm ga je naar een grotere eenheid.','Het getal wordt dus groter.','Ik schuif de komma één plaats naar rechts.'], wrong:1, cons:[2],
          why:'Naar een grotere eenheid wordt het getal kleiner: 10 mm = 1 cm.', fix:'Het getal wordt [[0:md]] (groter / kleiner)', mode:'text', fixCheck:v=>({ok:/^kleiner$/i.test(v[0].trim())}), fixSol:'Kleiner: de komma schuift één plaats naar links.'},
        {task:`Bereken 360° − ${dm+100}°.`, lines:[`360° − ${dm+100}°`, `= 360° − 100° − ${dm}°`, `= 260° − ${dm}° = ${250-dm}°`], wrong:2,
          why:'De laatste aftrekking is fout.', fix:`260° − ${dm}° = [[0:xs]]°`, mode:'decimal', fixCheck:degIs(260-dm), fixSol:`${260-dm}°`},
        {task:`${nrAng(nA,1)} = ${x}°. ${nrAng(nA,1)} en ${nrAng(nA,3)} zijn overstaande hoeken. Bereken ${nrAng(nA,3)}.`, lines:[`${nrAng(nA,1)} en ${nrAng(nA,3)} zijn overstaande hoeken.`, 'Overstaande hoeken zijn samen 180°.', `${nrAng(nA,3)} = 180° − ${x}° = ${180-x}°`], wrong:1, cons:[2],
          why:'Overstaande hoeken zijn even groot. Samen 180° geldt voor nevenhoeken.', fix:`${nrAng(nA,3)} = [[0:xs]]°`, mode:'decimal', fixCheck:degIs(x), fixSol:`${nrAng(nA,3)} = ${x}°`},
        {task:'Bepaal een inspringende hoek met manier 2.', lines:[`De “lege” hoek meet ${360-e-100}°.`, 'Inspringende hoek = 360° − lege hoek', `360° − ${360-e-100}° = ${e+100+10}°`], wrong:2,
          why:'De aftrekking is fout.', fix:`360° − ${360-e-100}° = [[0:xs]]°`, mode:'decimal', fixCheck:degIs(e+100), fixSol:`${e+100}°`},
        {task:`${hat(nB)} = ${bis}°. b is de bissectrice. Bereken ${nrAng(nB,1)}.`, lines:[`b deelt ${hat(nB)} in twee even grote hoeken.`, `${nrAng(nB,1)} = ${bis}° : 2`, `${nrAng(nB,1)} = ${bis/2 - 5}°`], wrong:2,
          why:'De deling is fout.', fix:`${nrAng(nB,1)} = [[0:xs]]°`, mode:'decimal', fixCheck:degIs(bis/2), fixSol:`${bis}° : 2 = ${bis/2}°`},
        {task:`Het is ${h}.30 uur. Hoe groot is de kleinste hoek tussen de wijzers?`, lines:['Tussen twee cijfers op de klok is 30°.', `De kleine wijzer staat precies op ${h}.`, 'De grote wijzer staat op 6.'], wrong:1,
          why:`Om half staat de kleine wijzer halfweg tussen ${h} en ${h+1}.`, fix:'De hoek is [[0:xs]]°', mode:'decimal', fixCheck:degIs(clockAngle(h,30)), fixSol:`${clockAngle(h,30)}°`},
        {task:'Twee hoeken vormen samen een rechte hoek. De ene is 2 keer zo groot als de andere. Hoe groot is de grootste hoek?', lines:['De grootste hoek = 2 delen, de kleinste = 1 deel.', 'Samen zijn ze 180°.', '3 delen = 180°, dus 1 deel = 60° en de grootste hoek = 120°.'], wrong:1, cons:[2],
          why:'Samen vormen ze een rechte hoek: 90°, niet 180°.', fix:'De hoek is [[0:xs]]°', mode:'decimal', fixCheck:degIs(60), fixSol:'3 delen = 90°, 1 deel = 30°, de hoek = 60°.'},
        {task:`Noteer de halfrechte met grenspunt ${nM} die door ${nA} gaat.`, lines:['Een halfrechte is aan één kant begrensd.', `Het grenspunt is ${nM}.`, `Notatie: [${nA}${nM}`], wrong:2,
          why:'Het grenspunt staat vooraan, bij het blokhaakje.', fix:'Notatie: [[0:xs]]', mode:'text', fixCheck:v=>({ok:nsp(v[0])===`[${nM}${nA}`}), fixSol:`[${nM}${nA}`}
      ];
      R.shuffle(E).forEach((e,i)=>errBlock(b, st, save, 'e'+i, Object.assign({nr:LET[i]+'.'}, e)));
    }}
  ]};

/* ---------------- PROEFTOETSEN ---------------- */
/* een oefenkaart hergebruiken in een proeftoets: n vragen houden, punten per vraag (kaart via een functie: pas bekend na het laden) */
function fromCard(get, n, pts){
  return (body, sub, save, key)=>{
    const card = get();
    const start = QZ.length;
    card.build(body, sub, save, key);
    const outer = body.closest('.q'); const rows = [...body.querySelectorAll('.q')].filter(r=>r.parentElement.closest('.q')===outer);
    if(n!=null && rows.length>n){ rows.slice(n).forEach(r=>{ const fc = r.closest('.fig-card'); (fc && fc.querySelectorAll('.q').length===1 ? fc : r).remove(); }); QZ.splice(start+n); }
    QZ.slice(start).forEach((g,i)=>{ g.pts = Array.isArray(pts) ? pts[i] : pts; });
  };
}
const TQ = {
  notatie:   {sec:'Punt, rechte, halfrechte, lijnstuk', prompt:'Kies het begrip en noteer het in symbolen.', build:fromCard(()=>CARD.notatie,3,.5)},
  notatie4:  {sec:'Punt, rechte, halfrechte, lijnstuk', prompt:'Kies het begrip en noteer het in symbolen.', build:fromCard(()=>CARD.notatie,4,.5)},
  juistfout: {sec:'Notaties', prompt:'Juist of fout?', build:fromCard(()=>CARD.juistFout,3,.5)},
  symbolen:  {sec:'∈, ∉, ⊂, ⊄ of =', prompt:'Vul in met ∈, ∉, ⊂, ⊄ of =.', build:fromCard(()=>CARD.symbolen,6,.5)},
  snij:      {sec:'Snijpunten', prompt:'', build:fromCard(()=>NEW.snijpunten,5,.5)},
  meten:     {sec:'Lijnstukken meten', prompt:'Meet de lijnstukken met je geodriehoek. Noteer in cm en herleid naar mm.', build:fromCard(()=>CARD.meet,1,2)},
  herleid:   {sec:'Herleiden', prompt:'Herleid.', build:fromCard(()=>CARD.herleid,4,.5)},
  constr:    {sec:'Construeren', prompt:'Construeer zonder te meten. Laat je constructie staan.', build:fromCard(()=>CARD.constrEven,1,1.5)},
  midden:    {sec:'Het midden', prompt:'', build:fromCard(()=>CARD.midden,2,[1.5,.5])},
  soorten:   {sec:'Soorten hoeken', prompt:'Vul aan.', build:fromCard(()=>CARD.soortGrootte,4,.5)},
  klok:      {sec:'Hoeken op de klok', prompt:'Bepaal de kleinste hoek tussen de wijzers en geef de benaming.', build:fromCard(()=>CARD.klok,2,.5)},
  hoekmeten: {sec:'Hoeken meten', prompt:'Schat, meet en benoem de hoeken.', build:fromCard(()=>CARD.schatMeet,2,1.5)},
  meetReken: {sec:'Hoeken meten en rekenen', prompt:'Meet de hoeken en reken in het bewerkingsvak.', build:fromCard(()=>NEW.meetReken,1,2)},
  been:      {sec:'Hoeken tekenen', prompt:'', build:fromCard(()=>CARD.tweedeBeen,1,1.5)},
  tekenHoek: {sec:'Hoeken tekenen', prompt:'Teken de hoek, zet een boogje en noteer de grootte.', build:fromCard(()=>NEW.tekenHoeken,1,1.5)},
  insmeten:  {sec:'Inspringende hoeken', prompt:'', build:fromCard(()=>CARD.inspMeet,1,1.5)},
  insteken:  {sec:'Inspringende hoeken', prompt:'', build:fromCard(()=>CARD.inspTeken,1,1.5)},
  bistek:    {sec:'Bissectrice', prompt:'', build:fromCard(()=>CARD.bisTeken,1,2)},
  benoem:    {sec:'Overstaande hoeken en nevenhoeken', prompt:'Kies de best passende naam.', build:fromCard(()=>CARD.verbBenoem,4,.5)},
  waar:      {sec:'Overstaande hoeken en nevenhoeken', prompt:'Waar of niet waar?', build:fromCard(()=>CARD.verbWaar,4,.5)},
  rekenA:    {sec:'Hoeken berekenen', prompt:'Bereken zonder te meten.', build:fromCard(()=>CARD.rekenA,4,.5)},
  rekenB:    {sec:'Hoeken berekenen', prompt:'Bereken zonder te meten.', build:fromCard(()=>CARD.rekenB,4,.5)},
  rekenC:    {sec:'Hoeken berekenen', prompt:'Bereken zonder te meten.', build:fromCard(()=>CARD.rekenC,2,1)},
  rekenE:    {sec:'Hoeken berekenen', prompt:'Bereken zonder te meten.', build:fromCard(()=>CARD.rekenE,4,.5)},
  reden:     {sec:'Hoeken berekenen', prompt:'Bereken de hoeken zonder te meten en geef de reden.', build:fromCard(()=>CARD.verbReden,4,.5)},
  vraag:     {sec:'Vraagstuk', prompt:'', build:fromCard(()=>CARD.vraagHoek,1,2)},
  vraag2:    {sec:'Vraagstuk', prompt:'', build:fromCard(()=>CARD.vraagDelen,1,2)}
};
const TOETSEN = [
  ['notatie','symbolen','meten','constr','midden','herleid','soorten','hoekmeten','been','insmeten','bistek','rekenA','rekenC','reden','vraag'],
  ['notatie','juistfout','symbolen','meten','midden','herleid','soorten','klok','meetReken','tekenHoek','insteken','bistek','benoem','rekenB','rekenA','vraag2'],
  ['notatie4','snij','meten','constr','midden','soorten','hoekmeten','been','insmeten','bistek','rekenC','rekenE','waar','reden','vraag']
].map(list=>list.map(k=>TQ[k]));
const TOETS_TIP = 'Een proeftoets over het hele hoofdstuk (zonder complementaire en supplementaire hoeken). Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Daarna kan je bij elke fout de oplossing of de werkwijze bekijken. Werk zonder spiekbriefje.';
[0,1,2].forEach(i=>{ SEC['toets'+(i+1)] = { id:'toets'+(i+1), ic:'toets', nav:'Proeftoets '+(i+1), title:'Proeftoets '+(i+1), tip:TOETS_TIP,
  cards:[ { title:'Proeftoets '+(i+1), noReset:true, build:(b,st,save,key)=>proeftoets(b,st,save,key,TOETSEN[i]) } ] }; });

/* ============================================================
   INHOUD DEEL 6: extra oefeningen, vraagstukken en de nieuwe
   indeling in kleinere hoofdstukken (met tabblad verdieping)
   ============================================================ */
const OLD = {}; Object.keys(SEC).forEach(k=>OLD[k] = SEC[k].cards.slice());
const again = (c, title, lvl) => Object.assign({}, c, {title: title||c.title, lvl: lvl!=null ? lvl : c.lvl});
const calcBox = (lab, inner) => `<div class="calc"><span class="lab">${lab}</span>${inner}</div>`;
const noCross = segs => { for(let i=0;i<segs.length;i++) for(let j=i+1;j<segs.length;j++){ const X = lineInter(segs[i][0],segs[i][1],segs[j][0],segs[j][1]); if(X && X.t>0.02 && X.t<.98 && X.u>0.02 && X.u<.98) return false; } return true; };
const degOk = (x, t, tol=1.0001) => !isNaN(x) && Math.abs(x-t) <= tol;
const pd = v => v.map(parseDeg);

/* ============================================================
   1. TEKENGEREI: animaties en extra missies
   ============================================================ */
function animSteps(kind, A, Bq, C, nA, nB, nC){
  const d = dirAng(A,Bq), L = dist(A,Bq);
  switch(kind){
    case 'move': return [{say:'Neem de geodriehoek vast aan het <b>blauwe handvat ✥</b> (of ergens op de geodriehoek) en sleep hem. Het nulpunt klikt vast op een punt.', geo:{x:A.x, y:A.y, rot:0}}, {wait:700}];
    case 'rot': return [{say:`Leg het nulpunt op ${nA}.`, geo:{x:A.x, y:A.y, rot:0}}, {say:'Draai aan de <b>rode knop</b>. De geodriehoek draait rond het nulpunt en klikt vast als de tekenzijde door een punt gaat.', geo:{x:A.x, y:A.y, rot:d}}, {wait:700}];
    case 'connect': { const O = polar(A, 28, 0); return [{say:`Leg de tekenzijde tegen ${nA}, ergens op de tekenzijde. Het nulpunt hoeft niet op ${nA} te liggen!`, geo:{x:O.x, y:O.y, rot:0}}, {say:`Draai aan de rode knop: de geodriehoek draait nu rond ${nA}, tot de tekenzijde door ${nB} gaat.`, geoAbout:{p:A, rot:d}}, {say:`Schuif hem nog langs de rechte tot ${nA} en ${nB} mooi in het midden van de tekenzijde liggen: zo gebruik je de volle breedte.`, geo:geoOn(A,Bq)}, {say:'Sleep met het potlood langs de tekenzijde.', line:[A,Bq]}, {wait:700}]; }
    case 'measure': return [...DM.measure(A, Bq, nA, nB, cmTxt(L))];
    case 'angle': { const hp = edgeHp(A,d,d+40); return [{say:`Nulpunt op ${nA}, tekenzijde op de halfrechte naar ${nB}.`, geo:{x:A.x, y:A.y, rot:d}}, {say:'Lees 40° af en zet je hulppunt <b>aan de rand</b> van de geodriehoek: tik net buiten de rand (of op de gradenboog). Het punt klikt vast op een hele graad.', pt:hp}, {say:'Leg de tekenzijde door het hoekpunt en het hulppunt en trek de lijn.', geoAbout:{p:A, rot:d+40}}, {line:[A, polar(A,80,d+40)]}, {geoOff:true, say:'Zet een boogje in de hoek.', am:{vx:A.x, vy:A.y, a0:d, a1:d+40, r:10}}, {wait:700}]; }
    case 'open': return [{say:`De passer heeft drie delen. Sleep het <b>potloodbeen</b> om de passer open of dicht te doen. Zet eerst de naald in ${nA} (sleep het blauwe midden ✥).`, cmp:{c:A, p:polar(A,25,d+60)}}, {say:`Sleep het potloodbeen tot in ${nB}: nu zit |${nA}${nB}| in je passer.`, cmp:{c:A, p:Bq}}, {wait:700}];
    case 'arc': { const r = L; return [{cmp:{c:A, p:Bq}, say:`|${nA}${nB}| zit in je passer.`}, {say:`Sleep het <b>blauwe midden ✥</b> om de passer te verplaatsen naar ${nC}. De opening blijft.`, cmp:{c:C, p:polar(C, r, d)}}, {say:'Draai aan de <b style="color:#7c5cd6">paarse knop</b> bovenaan om een boog te tekenen.', swing:[d, d+70]}, {wait:700}]; }
    case 'turn': { const inB = q => q.x>8 && q.x<192 && q.y>8 && q.y<112; const ok = a => [0,20,40].every(x=>inB(polar(A,L,a+x)));
      let t0 = null; for(let k=0;k<72 && t0==null;k++){ for(const sg of [1,-1]){ const a = d + sg*(45+k*5); if(ok(a)){ t0 = a; break; } } } const ta = t0==null ? d+90 : t0;
      return [{cmp:{c:A, p:Bq}, say:`De naald staat in ${nA}, de opening is |${nA}${nB}|.`}, {say:'Wil je eerst ergens anders beginnen? Draai met de <b style="color:#d4452b">kleine rode knop ⟳</b>: de passer draait, maar tekent niets.', cmp:{c:A, p:polar(A, L, ta)}}, {say:'Nu teken je wel: draai aan de <b style="color:#7c5cd6">paarse knop</b> bovenaan.', swing:[ta, ta+40]}, {wait:700}]; }
    case 'name': { const K = mid(A,C); return [{say:'Tik met het potlood: er komt een punt.', pt:K}, {say:'Meteen verschijnt een vakje: typ de naam (bv. K) en druk op Enter.', lb:{p:{x:K.x+2.2, y:K.y-3}, s:'K'}}, {wait:900}]; }
    case 'erase': return [{say:'Een lijn trekken…', geo:geoOn(A,Bq)}, {line:[A,Bq]}, {geoOff:true, say:'Kies <b>Gom</b> en wrijf over de lijn.', rub:[A,Bq]}, {wait:600}];
  }
  return [];
}
const ANIMS = [['move','De geodriehoek verplaatsen'],['rot','De geodriehoek draaien'],['connect','Twee punten verbinden'],['measure','Een lijnstuk meten'],['angle','Een hoek tekenen'],['open','De passer openen'],['arc','Een boog tekenen'],['turn','De passer draaien zonder tekenen'],['name','Een punt benoemen'],['erase','Gommen']];

const NEW = {};
NEW.kijk = { title:'Kijk hoe het werkt', lvl:1, keep:true, instr:'Klik op een knop en kijk naar de animatie. Probeer het daarna zelf op hetzelfde blad.', build:(b,st,save,key)=>{
    const R = makeR(st); const [nA,nB,nC] = R.letters(3);
    const A = P(R.int(35,55), R.int(75,95)); const Bq = polar(A, R.int(55,75), R.int(10,30)); const C = P(R.int(130,165), R.int(70,100));
    const btns = el('div','anim-btns'); b.append(btns);
    const host = el('div'); b.append(host);
    const s = st.bd0 || (st.bd0 = {});
    const B = makeBoard(host, s, save, key+'_kijk', {w:200, h:120, compass:{on:true, pose:{cx:150, cy:35, px:175, py:35}}, given:[G.pt(A,nA), G.pt(Bq,nB), G.pt(C,nC)]});
    ANIMS.forEach(([k,lab])=>{ const bt = ctlBtn('▶ '+lab, ()=>{ btns.querySelectorAll('.btn').forEach(x=>x.classList.remove('chosen')); bt.classList.add('chosen'); B.playDemo(animSteps(k, A, Bq, C, nA, nB, nC)); }); btns.append(bt); });
    const stop = ctlBtn('■ Stop', ()=>{ B.stopDemo(); btns.querySelectorAll('.btn').forEach(x=>x.classList.remove('chosen')); }); btns.append(stop);
  }};

NEW.missieGeo2 = { title:'Meer missies met je geodriehoek', lvl:1, build:(b,st,save,key)=>{
    const R = makeR(st);
    /* d. meten */
    { const [n1,n2] = R.letters(2); const L = R.int(30,75); const [A,Bq] = pickIn(R, ()=>{ const c = P(R.int(60,140), R.int(30,80)); return segAround(c, L, R.int(-40,40)); }, 200, 110, 10);
      qBlock(b, st, save, 'm9', { demoFirst:true, nr:'d.', block:true, html:`Meet het lijnstuk [${n1}${n2}].`, html2:`|${n1}${n2}| = [[0:xs]] cm`, mode:'decimal', tv:[fmtN(L/10)],
        board:{w:200, h:110, tools:['pencil','eraser','geo'], given:[G.seg(A,Bq), ptEnd(A,Bq,n1), ptEnd(Bq,A,n2)]},
        check:v=>{ const x = parseNum(v[0]); if(isNaN(x)) return {ok:false, msg:'Typ een getal.'}; if(Math.abs(x*10-L)<=1.05) return {ok:true, msg:'Nauwkeurig gemeten!'}; if(Math.abs(x-L)<=1.05) return {ok:false, msg:'Je antwoord staat in mm. Noteer in cm.'}; return {ok:false, msg:`Leg het nulpunt precies op ${n1} en de tekenzijde langs het lijnstuk. Lees af bij ${n2}.`}; },
        demo:()=>DM.measure(A,Bq,n1,n2,cmTxt(L)) }); }
    /* e. hulppunt bij een graad */
    { const [nO,nX] = R.letters(2); const x = R.pick([R.int(20,80), R.int(100,160)]); const d0 = R.int(-15,15); const O = P(R.int(55,75), R.int(85,100));
      qBlock(b, st, save, 'm10', { demoFirst:true, nr:'e.', block:true, html:`Zet een <b>hulppunt bij ${x}°</b> boven de halfrechte [${nO}${nX}. Leg het nulpunt op ${nO} en de tekenzijde op de halfrechte. Tik dan vlak naast de gradenboog (of naast een schuine zijde) bij ${x}°.`,
        board:{w:200, h:110, tools:['pencil','eraser','geo'], given:[...rayGiven(O, d0, 100, nO, nX)]},
        check:(v,c,B)=>{ const pts = B.userPts().filter(p=>dist(p,O)>20); if(!pts.length) return {ok:false, msg:'Zet een punt met het potlood (tik) bij de juiste graad.'};
          const best = pts.map(p=>({p, a:norm360(dirAng(O,p)-d0)})).sort((u,w)=>Math.abs(u.a-x)-Math.abs(w.a-x))[0];
          if(Math.abs(best.a-x)<=.6) return {ok:true, msg:`Je hulppunt ligt precies bij ${x}°.`};
          if(Math.abs(best.a-(180-x))<=.6) return {ok:false, msg:`Je hulppunt ligt bij ${180-x}°. Je las de andere schaal: ${x<90?'bij een scherpe hoek neem je het kleinste getal':'bij een stompe hoek neem je het grootste getal'}.`};
          return {ok:false, msg:`Je hulppunt ligt bij ${Math.round(best.a)}°. Ligt het nulpunt op ${nO} en de tekenzijde op de halfrechte?`}; },
        demo:()=>[{say:`Nulpunt op ${nO}, tekenzijde op de halfrechte.`, geo:{x:O.x, y:O.y, rot:d0}}, {say:`Zet een hulppunt aan de rand van je geodriehoek bij ${x}°.`, pt:edgeHp(O,d0,d0+x)}, {wait:900}] }); }
    /* f. loodlijn */
    { const [nP] = R.letters(1); const da = R.int(-25,25); const Q = P(R.int(70,130), R.int(70,90)); const k = R.int(25,40); const Pp = polar(Q, k, da+90);
      const [l1,l2] = clipLine(polar(Q,-60,da), polar(Q,60,da), 200, 110, 4);
      qBlock(b, st, save, 'm11', { demoFirst:true, nr:'f.', block:true, html:`Teken door ${nP} een <b>loodlijn</b> op de rechte <i>a</i>. Leg de <b>loodlijn van je geodriehoek</b> (de lijn door het nulpunt) op <i>a</i> en schuif tot de tekenzijde door ${nP} gaat.`,
        board:{w:200, h:110, tools:['pencil','eraser','geo','arc'], given:[G.line(l1,l2), G.txt(polar(l2,6,da+150),'a',{italic:true, size:4.6}), G.pt(Pp,nP)]},
        check:(v,c,B)=>{ const ls = B.segs().filter(s=>lineDist(Pp,s.a,s.b)<=.8);
          if(!ls.length) return {ok:false, msg:`Teken een lijn die door ${nP} gaat.`};
          const good = ls.find(s=>ldiff(dirAng(s.a,s.b), da+90)<=1);
          if(!good) return {ok:false, msg:`Je lijn door ${nP} staat niet loodrecht op <i>a</i>. Leg de loodlijn van je geodriehoek precies op <i>a</i>.`};
          const F = projP(Pp, l1, l2); if(segDist(F, good.a, good.b) > 1.2) return {ok:false, msg:'Je loodlijn staat goed, maar laat ze doorlopen tot aan de rechte <i>a</i>.'};
          return {ok:true, msg:'Je loodlijn staat precies loodrecht op a.'}; },
        demo:()=>{ const F = projP(Pp, l1, l2); return [{say:'Draai je geodriehoek tot de loodlijn (door het nulpunt) op de rechte a ligt.', geo:{x:F.x, y:F.y, rot:da+90}}, {say:`De tekenzijde gaat nu door ${nP} en staat loodrecht op a. Trek de lijn.`, line:[F, polar(Pp, 12, da+90)]}, {geoOff:true, say:'Duid de rechte hoek aan met ∟.', am:{vx:F.x, vy:F.y, a0:da, a1:da+90, style:'right'}}, {wait:900}]; } }); }
    /* g. evenwijdige */
    { const [nP] = R.letters(1); const da = R.int(-20,20); const k = R.pick([15,20,25,30]); const Q = P(R.int(80,120), R.int(30,50)); const Pp = polar(Q, k, da-90);
      const [l1,l2] = clipLine(polar(Q,-60,da), polar(Q,60,da), 200, 110, 4);
      qBlock(b, st, save, 'm12', { demoFirst:true, nr:'g.', block:true, html:`Teken door ${nP} een rechte die <b>evenwijdig</b> is met <i>a</i>. Leg een van de <b>evenwijdige lijnen</b> van je geodriehoek op <i>a</i> en schuif tot de tekenzijde door ${nP} gaat.`,
        board:{w:200, h:110, tools:['pencil','eraser','geo'], given:[G.line(l1,l2), G.txt(polar(l2,6,da+150),'a',{italic:true, size:4.6}), G.pt(Pp,nP)]},
        check:(v,c,B)=>{ const ls = B.segs().filter(s=>lineDist(Pp,s.a,s.b)<=.8);
          if(!ls.length) return {ok:false, msg:`Teken een lijn die door ${nP} gaat.`};
          const good = ls.find(s=>ldiff(dirAng(s.a,s.b), da)<=1);
          if(!good) return {ok:false, msg:'Je lijn loopt niet evenwijdig met a: de afstand tot a moet overal even groot zijn.'};
          if(dist(good.a,good.b) < 30) return {ok:false, msg:'Je rechte is te kort. Trek ze langer.'};
          return {ok:true, msg:'Evenwijdig: je rechte en a snijden elkaar nooit.'}; },
        demo:()=>[{say:`Leg de tekenzijde door ${nP}, met de evenwijdige lijn op ${k} mm precies op a.`, geo:{x:Pp.x, y:Pp.y, rot:da}}, {say:'Trek de lijn langs de tekenzijde.', line:[polar(Pp,-55,da), polar(Pp,55,da)]}, {wait:900}] }); }
  }};

NEW.missieCmp2 = { title:'Meer missies met je passer', lvl:1, build:(b,st,save,key)=>{
    const R = makeR(st);
    /* c. cirkel met een straal in cm */
    { const [nM] = R.letters(1); const r = R.pick([20,25,30,35,40]); const M = P(R.int(55,80), R.int(45,65));
      qBlock(b, st, save, 'c3', { demoFirst:true, nr:'c.', block:true, html:`Teken een cirkel met middelpunt ${nM} en een straal van <b>${fmtN(r/10)} cm</b>. Neem de straal in je passer met je geodriehoek: naald op het nulpunt, potloodbeen bij ${fmtN(r/10)} cm.`,
        board:{w:200, h:110, tools:['compass','geo','eraser'], compass:{on:true, pose:{cx:160, cy:30, px:180, py:30}}, geo:{pose:{x:120, y:105, rot:0}}, given:[G.pt(M,nM)]},
        check:(v,c,B)=>{ const a = CK.arcsAt(B, M, null, .8); if(!a.length) return {ok:false, msg:`Zet de naald in ${nM} en draai aan de rode knop.`};
          const ok = a.filter(x=>Math.abs(x.r-r)<=1.05); if(!ok.length) return {ok:false, msg:`Je straal is ${mmTxt(a[0].r)}. Neem ${fmtN(r/10)} cm in je passer met de lat van je geodriehoek.`};
          if(!ok.some(x=>x.a1-x.a0>=350)) return {ok:false, info:true, msg:'Bijna: draai helemaal rond voor een volledige cirkel.'};
          return {ok:true}; },
        demo:()=>{ const g0 = P(120,105); return [{say:'Naald op het nulpunt van je geodriehoek…', geo:{x:120, y:105, rot:0}, instant:true}, {cmp:{c:g0, p:polar(g0, 12, 0)}}, {say:`… potloodbeen bij ${fmtN(r/10)} cm.`, cmp:{c:g0, p:polar(g0, r, 0)}}, {say:`Verplaats de passer met het blauwe midden naar ${nM}.`, cmp:{c:M, p:polar(M, r, 0)}}, {say:'Draai helemaal rond.', swing:[0,360], dur:1800}]; } }); }
    /* d. punt op dezelfde afstand van twee punten */
    { const [nA,nB,nP] = R.letters(3); const L = R.int(45,65); const r = R.pick([35,40,45]); const A = P(R.int(40,60), R.int(85,95)); const Bq = polar(A, L, R.int(-5,5));
      const Pt = circleCircle(A, r, Bq, r).sort((p,q)=>p.y-q.y)[0];
      qBlock(b, st, save, 'c4', { demoFirst:true, nr:'d.', block:true, html:`Zet een punt ${nP} <b>boven</b> [${nA}${nB}] dat op ${fmtN(r/10)} cm van ${nA} én op ${fmtN(r/10)} cm van ${nB} ligt. Teken met je passer een boog rond ${nA} en een boog rond ${nB}. ${nP} is het snijpunt.`,
        board:{w:200, h:110, tools:['pencil','compass','geo','eraser','label'], compass:{on:true, pose:{cx:160, cy:30, px:180, py:30}}, geo:{pose:{x:130, y:105, rot:0}}, given:[G.pt(A,nA), G.pt(Bq,nB)]},
        check:(v,c,B)=>{ const rp = CK.needPt(B,nP); if(rp.err) return {ok:false, msg:rp.err}; const p = rp.p;
          if(Math.abs(dist(p,A)-r)>1.05 || Math.abs(dist(p,Bq)-r)>1.05) return {ok:false, msg:`${nP} ligt op ${mmTxt(dist(p,A))} van ${nA} en ${mmTxt(dist(p,Bq))} van ${nB}. Beide moeten ${fmtN(r/10)} cm zijn: zet ${nP} op het snijpunt van de twee bogen.`};
          if(p.y > A.y) return {ok:false, msg:`Zet ${nP} boven [${nA}${nB}].`};
          return {ok:true}; },
        demo:()=>{ const g0 = P(130,105); const dA = dirAng(A,Pt), dB = dirAng(Bq,Pt); return [{geo:{x:130,y:105,rot:0}, instant:true, say:`Neem ${fmtN(r/10)} cm in je passer.`}, {cmp:{c:g0, p:polar(g0,r,0)}}, {say:`Boog rond ${nA}.`, cmp:{c:A, p:polar(A,r,dA-15)}}, {swing:[dA-15, dA+15]}, {say:`Zelfde opening: boog rond ${nB}.`, cmp:{c:Bq, p:polar(Bq,r,dB-15)}}, {swing:[dB-15, dB+15]}, {cmpOff:true, say:`Het snijpunt is ${nP}.`, pt:Pt, name:nP, ly:-4}, {wait:800}]; } }); }
  }};

NEW.missieRecht = { title:'Missie: het teken voor een rechte hoek', lvl:1, build:(b,st,save,key)=>{
    const R = makeR(st); const [nV,nW] = R.letters(2);
    const V = P(R.int(40,60), R.int(80,95)), d1 = R.int(-10,15); const W2 = P(R.int(130,150), R.int(80,95)), e1 = R.int(-10,15), e2 = e1 + R.pick([R.int(55,80), R.int(100,125)]);
    qBlock(b, st, save, 'r1', { demoFirst:true, block:true, html:`Een van deze twee hoeken is een rechte hoek. Duid die aan met het teken <b>∟</b>: kies <b>Boogje</b>, tik in de hoek en tik nog eens op het boogje.`,
      board:{w:200, h:110, tools:['arc','eraser','geo'], geo:{on:false}, given:[G.ray(V,polar(V,55,d1)), G.ray(V,polar(V,55,d1+90)), ptOff(V,d1+225,nV,4), G.ray(W2,polar(W2,55,e1)), G.ray(W2,polar(W2,55,e2)), ptOff(W2,(e1+e2)/2+180,nW,4)]},
      check:(v,c,B)=>{ const m = B.ams().filter(x=>x.style==='right');
        if(m.some(x=>dist(P(x.vx,x.vy),W2)<1.2)) return {ok:false, msg:`${hatT(nW)} is geen rechte hoek. Controleer met de loodlijn van je geodriehoek.`};
        if(!m.some(x=>dist(P(x.vx,x.vy),V)<1.2)) return {ok:false, msg:`Duid de rechte hoek ${hatT(nV)} aan met ∟ (tik twee keer met <b>Boogje</b> in de hoek).`};
        return {ok:true, msg:`${hatT(nV)} = 90°`}; },
      demo:()=>[{say:'Kies Boogje en tik in de rechte hoek…', am:{vx:V.x,vy:V.y,a0:d1,a1:d1+90,r:9}}, {say:'…tik nog eens: het boogje wordt het teken ∟.', am:{vx:V.x,vy:V.y,a0:d1,a1:d1+90,style:'right'}}, {wait:900}] });
  }};

function rectCard(square){ return { title: square ? 'Teken een vierkant' : 'Teken een rechthoek', lvl:3, build:(b,st,save,key)=>{
    const R = makeR(st); const [nA,nB,nC,nD,nX] = R.letters(5);
    const a = square ? R.int(4,6)*10 : R.int(5,7)*10, bb = square ? a : R.int(3,4)*10 + (R.f()<.5?5:0);
    const A = P(R.int(30,45), R.int(105,112)); const d0 = R.int(-6,6);
    const Bt = polar(A,a,d0), Ct = polar(Bt,bb,d0+90), Dt = polar(A,bb,d0+90);
    qBlock(b, st, save, 'rh', { block:true, html: square ? `Teken een vierkant ${nA}${nB}${nC}${nD} met zijde ${a/10} cm. ${nB} ligt op [${nA}${nX}, ${nC} en ${nD} liggen erboven. Gebruik de loodlijn van je geodriehoek.`
        : `Teken een rechthoek ${nA}${nB}${nC}${nD} met |${nA}${nB}| = ${a/10} cm en |${nB}${nC}| = ${fmtN(bb/10)} cm. ${nB} ligt op [${nA}${nX}, ${nC} en ${nD} liggen erboven. Gebruik de loodlijn van je geodriehoek.`,
      board:{w:200, h:125, tools:['pencil','eraser','label','arc','tick','geo','compass'], given:[...rayGiven(A, d0, 125, nA, nX)]},
      check:(v,c,B)=>{ const g = {}; for(const n of [nB,nC,nD]){ const r = CK.needPt(B,n); if(r.err) return {ok:false, msg:r.err}; g[n] = r.p; }
        const Bp = g[nB], Cp = g[nC], Dp = g[nD];
        if(Math.abs(dist(A,Bp)-a)>1.05 || lineDist(Bp,A,polar(A,10,d0))>.8) return {ok:false, msg:`${nB} moet op [${nA}${nX} liggen, op ${a/10} cm van ${nA}.`};
        const angB = angBetween(dirAng(Bp,A), dirAng(Bp,Cp)), angA = angBetween(dirAng(A,Bp), dirAng(A,Dp));
        if(Math.abs(dist(Bp,Cp)-bb)>1.05 || Math.abs(angB-90)>1.05) return {ok:false, msg:`In ${nB} moet een rechte hoek staan en |${nB}${nC}| = ${fmtN(bb/10)} cm. Nu: ${Math.round(angB)}° en ${mmTxt(dist(Bp,Cp))}.`};
        if(Math.abs(dist(A,Dp)-bb)>1.05 || Math.abs(angA-90)>1.05) return {ok:false, msg:`In ${nA} moet een rechte hoek staan en |${nA}${nD}| = ${fmtN(bb/10)} cm.`};
        if(!CK.hasSeg(B,Bp,Cp) || !CK.hasSeg(B,Cp,Dp) || !CK.hasSeg(B,Dp,A)) return {ok:false, msg:'Teken ook de zijden van je '+(square?'vierkant':'rechthoek')+'.'};
        return {ok:true, msg: square ? 'Een perfect vierkant!' : 'Een perfecte rechthoek!'}; },
      demo:()=>[{say:`Teken ${nB} op ${a/10} cm van ${nA}.`, geo:{x:A.x, y:A.y, rot:d0}}, {pt:Bt, name:nB, ly:4}, {say:`Loodlijn in ${nB}: nulpunt op ${nB}, loodlijn op de halfrechte.`, geo:{x:Bt.x, y:Bt.y, rot:d0+90}}, {line:[Bt,Ct]}, {pt:Ct, name:nC, ly:-4, say:`${nC} op ${fmtN(bb/10)} cm.`},
        {say:`Hetzelfde in ${nA}.`, geo:{x:A.x, y:A.y, rot:d0+90}}, {line:[A,Dt]}, {pt:Dt, name:nD, ly:-4}, {say:`Verbind ${nC} en ${nD}.`, geo:geoOn(Dt,Ct)}, {line:[Dt,Ct]}, {geoOff:true, wait:800}] });
  }}; }

/* ============================================================
   2–4. BEGRIPPEN, SYMBOLEN, COLLINEAIR: extra kaarten
   ============================================================ */
NEW.voluit = { title:'Schrijf voluit', lvl:1, build:(b,st,save,key)=>{
    const R = makeR(st);
    const mk = [];
    for(let i=0;i<6;i++){ const [A,Bq,C,D] = R.letters(4); const m = R.pick(LOW.split(''));
      mk.push([
        [`${A} ∈ ${m}`, [`Het punt ${A} ligt op de rechte ${m}.`, `Het punt ${A} ligt niet op de rechte ${m}.`, `De rechte ${m} ligt op het punt ${A}.`]],
        [`${A} ∉ [${Bq}${C}]`, [`Het punt ${A} ligt niet op het lijnstuk [${Bq}${C}].`, `Het punt ${A} ligt op het lijnstuk [${Bq}${C}].`, `Het punt ${A} ligt niet op de halfrechte [${Bq}${C}.`]],
        [`[${A}${Bq}] ⊂ ${m}`, [`Het lijnstuk [${A}${Bq}] ligt op de rechte ${m}.`, `De halfrechte [${A}${Bq} ligt op de rechte ${m}.`, `Het punt ${A} is een element van ${m}.`]],
        [`[${A}${Bq} ⊄ ${m}`, [`De halfrechte [${A}${Bq} ligt niet (helemaal) op de rechte ${m}.`, `De halfrechte [${A}${Bq} ligt op de rechte ${m}.`, `Het lijnstuk [${A}${Bq}] ligt niet op ${m}.`]],
        [`|${A}${Bq}| = |${C}${D}|`, [`De lijnstukken [${A}${Bq}] en [${C}${D}] zijn even lang.`, `De lijnstukken [${A}${Bq}] en [${C}${D}] vallen samen.`, `De rechten ${A}${Bq} en ${C}${D} zijn evenwijdig.`]],
        [`${A}${Bq} ∩ ${C}${D} = {${m.toUpperCase()==='O'?'S':'S'}}`, [`De rechten ${A}${Bq} en ${C}${D} snijden elkaar in het punt S.`, `De rechten ${A}${Bq} en ${C}${D} zijn evenwijdig.`, `Het punt S ligt niet op ${A}${Bq}.`]]
      ][i]);
    }
    R.shuffle(mk).slice(0,5).forEach(([f,opts],i)=>qChoice(b, st, save, 'v'+i, {nr:(i+1)+'.', html:`<b>${f}</b> betekent:`, opts:R.shuffle(opts.map((o,k)=>[k?'x'+k:'ok', o])), ans:'ok', why:'', whyBad:'Kijk naar de symbolen: ∈/∉ voor een punt, ⊂/⊄ voor een verzameling punten, |…| voor een lengte.'}));
  }};
NEW.tellen = { title:'Hoeveel lijnstukken en halfrechten?', lvl:3, build:(b,st,save,key)=>{
    const R = makeR(st);
    const n = R.int(3,5); const names = R.letters(n); const d = R.int(-10,10); const c = P(80,22);
    const pts = names.map((nm,i)=>polar(c, (i-(n-1)/2)*R.int(20,24), d));
    const [p,q] = clipLine(pts[0], pts[n-1], 160, 40, 2);
    const objs = [G.line(p,q), ...pts.map((pt,i)=>G.pt(pt,names[i],{ly:-3.6}))];
    b.append(el('div','', fig(160,40,objs,{fit:false, scale:4.5})));
    b.append(el('p','instructions', `Gebruik enkel de punten ${names.join(', ')} als grenspunten.`));
    const nS = n*(n-1)/2, nH = 2*n;
    qBlock(b, st, save, 'l', { html:`Hoeveel lijnstukken zie je? [[0:xs]]`, mode:'numeric', tv:[String(nS)], check:numIs(nS), sol:`Elk paar punten geeft een lijnstuk: ${n} punten → ${nS} lijnstukken.` });
    qBlock(b, st, save, 'h', { html:`Hoeveel halfrechten (met een van deze punten als grenspunt)? [[0:xs]]`, mode:'numeric', tv:[String(nH)], check:numIs(nH), sol:`Vanuit elk punt vertrekken 2 halfrechten (naar links en naar rechts): ${n} · 2 = ${nH}.` });
    qBlock(b, st, save, 'r', { html:`Hoeveel verschillende rechten zie je? [[0:xs]]`, mode:'numeric', tv:['1'], check:numIs(1), sol:'Alle punten liggen op dezelfde rechte: er is maar 1 rechte.' });
  }};
NEW.rechtenPunten = { title:'Vraagstuk: rechten door punten', lvl:3, instr:'Schets eerst op het tekenblad als je wil.', build:(b,st,save,key)=>{
    const R = makeR(st); const n = R.int(4,6); const ans = n*(n-1)/2;
    const pts = []; for(let i=0;i<n;i++) pts.push(polar(P(100,55), 38, 90 + i*360/n + R.int(-8,8)));
    qBlock(b, st, save, 'rp', { block:true, html:`Je hebt ${n} punten. Geen drie ervan liggen op één rechte. Hoeveel verschillende rechten kun je tekenen die door twee van die punten gaan? [[0:xs]]`, mode:'numeric', tv:[String(ans)],
      board:{w:200, h:110, tools:['pencil','eraser','geo'], given:pts.map((p,i)=>G.pt(p, UPP[i]))},
      check:v=>numIs(ans)(v), sol:`Elk punt kan je verbinden met de ${n-1} andere punten: ${n} · ${n-1} = ${n*(n-1)}. Zo tel je elke rechte twee keer, dus ${n*(n-1)} : 2 = <b>${ans}</b>.` });
  }};
NEW.zetPunt = { title:'Zet het punt zelf', lvl:3, build:(b,st,save,key)=>{
    const R = makeR(st); const [nA,nB,nK,nL,nM] = R.letters(5);
    const A = P(R.int(65,80), R.int(45,65)), Bq = polar(A, R.int(40,55), R.int(-25,25));
    qBlock(b, st, save, 'zp', { block:true, html:`Zet drie punten: <b>${nK}</b> met ${nK} ∈ [${nA}${nB} en ${nK} ∉ [${nA}${nB}] · <b>${nL}</b> met ${nL} ∈ ${nA}${nB} en ${nL} ∉ [${nA}${nB} · <b>${nM}</b> met ${nM} ∈ [${nA}${nB}]. Schets eerst de rechte ${nA}${nB}.`,
      board:{w:200, h:110, tools:['pencil','eraser','label','geo'], given:[G.pt(A,nA), G.pt(Bq,nB)]},
      check:(v,c,B)=>{ const t = p => projT(p,A,Bq);
        for(const n of [nK,nL,nM]){ const r = CK.needPt(B,n); if(r.err) return {ok:false, msg:r.err}; if(lineDist(r.p,A,Bq)>.8) return {ok:false, msg:`${n} moet op de rechte ${nA}${nB} liggen.`}; }
        if(t(B.pt(nK))<=1.02) return {ok:false, msg:`${nK} ligt op [${nA}${nB}, maar niet op [${nA}${nB}]: dus voorbij ${nB}.`};
        if(t(B.pt(nL))>=-0.02) return {ok:false, msg:`${nL} ligt op de rechte, maar niet op [${nA}${nB}: dus aan de andere kant van ${nA}.`};
        const tm = t(B.pt(nM)); if(tm<-.01 || tm>1.01) return {ok:false, msg:`${nM} moet tussen ${nA} en ${nB} liggen.`};
        return {ok:true}; },
      demo:()=>{ const d = dirAng(A,Bq), L = dist(A,Bq); return [{geo:{x:A.x,y:A.y,rot:d}}, {line:[polar(A,-30,d), polar(A,L+30,d)]}, {pt:polar(A,L+18,d), name:nK, ly:-4, say:`${nK} voorbij ${nB}.`}, {pt:polar(A,-18,d), name:nL, ly:-4, say:`${nL} aan de andere kant van ${nA}.`}, {pt:polar(A,L/2,d), name:nM, ly:-4, say:`${nM} tussen ${nA} en ${nB}.`}, {geoOff:true, wait:800}]; } });
  }};
NEW.snijpunten = { title:'Snijpunten en concurrente rechten', lvl:1, build:(b,st,save,key)=>{
    const R = makeR(st); const [na,nb,nc] = R.shuffle(LOW.split('')).slice(0,3); const [P1,P2,P3,nS] = R.letters(4);
    /* figuur 1: drie rechten die twee aan twee snijden */
    const T = [P(R.int(55,75),R.int(15,25)), P(R.int(20,35),R.int(70,80)), P(R.int(110,130),R.int(65,80))];
    const L = (p,q,nm)=>{ const [u,w] = clipLine(lerp(p,q,-.6), lerp(p,q,1.6), 150, 95, 2); return [G.line(u,w), G.txt(polar(w,5,dirAng(u,w)+150), nm, {italic:true, size:4.4})]; };
    const o1 = [...L(T[0],T[1],na), ...L(T[1],T[2],nb), ...L(T[2],T[0],nc), G.pt(T[0],P1,{lx:3,ly:-2}), G.pt(T[1],P2,{lx:-3,ly:-2.5}), G.pt(T[2],P3,{lx:3,ly:-2.5})];
    b.append(el('div','', fig(150,95,o1,{fit:false, scale:3.6})));
    const opts = [[P1,P1],[P2,P2],[P3,P3]];
    qChoice(b, st, save, 's1', {nr:'1.', html:`${na} ∩ ${nb} = { … }`, opts, ans:P2, why:`${P2} ligt op ${na} én op ${nb}.`, sym:true});
    qChoice(b, st, save, 's2', {nr:'2.', html:`${nb} ∩ ${nc} = { … }`, opts, ans:P3, why:`${P3} ligt op ${nb} én op ${nc}.`, sym:true});
    qChoice(b, st, save, 's3', {nr:'3.', html:`${na} ∩ ${nc} = { … }`, opts, ans:P1, why:`${P1} ligt op ${na} én op ${nc}.`, sym:true});
    qChoice(b, st, save, 's4', {nr:'4.', html:`Zijn ${na}, ${nb} en ${nc} concurrente rechten?`, opts:[['j','Ja'],['n','Neen']], ans:'n', why:'Ze hebben niet één gemeenschappelijk punt: er zijn drie verschillende snijpunten.'});
    /* figuur 2: concurrente rechten */
    const S = P(75,48); const o2 = []; const k = R.int(3,4); const dd = R.shuffle([10,40,70,100,135,160]).slice(0,k);
    dd.forEach((d,i)=>{ const [u,w] = clipLine(polar(S,-40,d), polar(S,40,d), 150, 95, 3); o2.push(G.line(u,w)); });
    o2.push(G.pt(S,nS,{lx:3.5,ly:3}));
    b.append(el('div','', fig(150,95,o2,{fit:false, scale:3.6})));
    qChoice(b, st, save, 's5', {nr:'5.', html:`Zijn deze ${k} rechten concurrent?`, opts:[['j','Ja'],['n','Neen']], ans:'j', why:`Ze gaan allemaal door één punt ${nS}.`});
  }};
NEW.snijVraag = { title:'Vraagstuk: hoeveel snijpunten?', lvl:3, instr:'Schets op het blad om te ontdekken. Tel het grootste aantal snijpunten dat mogelijk is.', build:(b,st,save,key)=>{
    const R = makeR(st);
    qBlock(b, st, save, 'q3', { nr:'a.', html:'Hoeveel snijpunten kunnen 3 rechten hoogstens hebben? [[0:xs]]', mode:'numeric', tv:['3'], check:numIs(3), sol:'Elk paar rechten snijdt in één punt: 3 paren → 3 snijpunten.' ,
      board:{w:200, h:110, tools:['pencil','eraser','geo']} });
    const n = R.int(4,5); const ans = n*(n-1)/2;
    qBlock(b, st, save, 'q4', { nr:'b.', html:`Hoeveel snijpunten kunnen ${n} rechten hoogstens hebben? [[0:xs]]`, mode:'numeric', tv:[String(ans)], check:numIs(ans), sol:`Elk paar rechten geeft één snijpunt: ${n} · ${n-1} : 2 = <b>${ans}</b>.` });
    qBlock(b, st, save, 'q0', { nr:'c.', html:'Hoeveel snijpunten hebben 3 concurrente rechten? [[0:xs]]', mode:'numeric', tv:['1'], check:numIs(1), sol:'Concurrente rechten gaan door één punt: 1 snijpunt.' });
  }};

/* ============================================================
   5–6. METEN EN HERLEIDEN: extra kaarten en vraagstukken
   ============================================================ */
NEW.vergelijk = { title:'Meet en vergelijk', lvl:2, instr:'Meet de twee lijnstukken. Kies dan het juiste teken: <, = of >.', build:(b,st,save,key)=>{
    const R = makeR(st);
    ['a.','b.'].forEach((nr,qi)=>{
      const L1 = R.int(35,70); const L2 = L1 + R.pick([0,0,-3,-2,2,3,4,-4]);
      const F = twoSegFig(R, R.letters(4), {min:L1, max:L1}); F.L[1] = L2;
      const [[a1,b1],[a2,b2]] = F.S; const c2 = mid(a2,b2), d2 = dirAng(a2,b2); const [na2,nb2] = segAround(c2, L2, d2);
      F.S[1] = [na2,nb2]; const [[n1,n2],[n3,n4]] = F.N;
      const given = [G.seg(a1,b1), ptEnd(a1,b1,n1), ptEnd(b1,a1,n2), G.seg(na2,nb2), ptEnd(na2,nb2,n3), ptEnd(nb2,na2,n4)];
      const rel = L1===L2 ? '=' : L1<L2 ? '<' : '>';
      qBlock(b, st, save, 'v'+qi, { nr, block:true, html:'', html2:`<div class="step">|${n1}${n2}| = [[0:xs]] cm &nbsp; |${n3}${n4}| = [[1:xs]] cm</div>`, block2:true, mode:'decimal',
        tv:[fmtN(L1/10), fmtN(L2/10)], tc:rel, choice:[['<',`|${n1}${n2}| &lt; |${n3}${n4}|`],['=',`|${n1}${n2}| = |${n3}${n4}|`],['>',`|${n1}${n2}| &gt; |${n3}${n4}|`]], choiceLast:true,
        board:{w:200, h:120, tools:['pencil','eraser','geo'], given},
        check:(v,c)=>{ const x = parseNum(v[0]), y = parseNum(v[1]); const f = [Math.abs(x*10-L1)<=1.05, Math.abs(y*10-L2)<=1.05];
          const okC = c===rel; return {ok:f[0]&&f[1]&&okC, fields:f, choiceOk:okC, msg: !f[0]||!f[1] ? 'Meet nog eens nauwkeurig (zoom in).' : !okC ? 'Vergelijk de twee lengtes nog eens.' : ''}; },
        demo:()=>[...DM.measure(a1,b1,n1,n2,cmTxt(L1)), ...DM.measure(na2,nb2,n3,n4,cmTxt(L2))] });
    });
  }};
NEW.omtrek = { title:'Meet de omtrek', lvl:2, instr:'De omtrek is de lengte van de hele rand: tel alle zijden op.', build:(b,st,save,key)=>{
    const R = makeR(st); const [nA,nB,nC] = R.letters(3);
    let A,Bq,C; do{ A = P(R.int(25,60), R.int(85,100)); Bq = polar(A, R.int(55,85), R.int(-10,10)); C = P(R.int(60,140), R.int(15,35)); } while(Math.min(dist(A,C),dist(Bq,C))<35 || dist(A,C)>85 || dist(Bq,C)>85);
    const L = [dist(A,Bq), dist(Bq,C), dist(C,A)].map(x=>Math.round(x)); Bq = polar(A, L[0], dirAng(A,Bq));
    const l = [dist(A,Bq), dist(Bq,C), dist(C,A)].map(x=>Math.round(x));
    qBlock(b, st, save, 'om', { block:true, html:`Meet de zijden van driehoek ${nA}${nB}${nC} en bereken de omtrek.`,
      html2: calcBox('bewerkingsvak', `|${nA}${nB}| = [[0:xs]] cm &nbsp; |${nB}${nC}| = [[1:xs]] cm &nbsp; |${nC}${nA}| = [[2:xs]] cm &nbsp;→&nbsp; omtrek = [[3:xs]] cm`), block2:true, mode:'decimal',
      tv:[...l.map(x=>fmtN(x/10)), fmtN((l[0]+l[1]+l[2])/10)],
      board:{w:200, h:110, tools:['pencil','eraser','geo'], given:[G.seg(A,Bq), G.seg(Bq,C), G.seg(C,A), ptOff(A,200,nA,4), ptOff(Bq,-20,nB,4), ptOff(C,90,nC,4)]},
      check:v=>{ const x = v.map(parseNum); const real = [dist(A,Bq), dist(Bq,C), dist(C,A)];
        const f = [0,1,2].map(i=>Math.abs(x[i]*10-real[i])<=1.05); const sum = x[0]+x[1]+x[2]; f.push(Math.abs(x[3]-sum)<0.051);
        return {ok:f.every(Boolean), fields:f, msg: f.slice(0,3).every(Boolean) ? (f[3]?'':`Tel je drie metingen op: ${fmtN(roundTo(sum,1))} cm.`) : 'Meet de zijden nog eens.'}; },
      demo:()=>[...DM.measure(A,Bq,nA,nB,mmTxt(dist(A,Bq))), ...DM.measure(Bq,C,nB,nC,mmTxt(dist(Bq,C))), ...DM.measure(C,A,nC,nA,mmTxt(dist(C,A)))] });
  }};
function lengthProblem(R, t){
  const nm = R.pick(['Lotte','Ilias','Noor','Senne','Amira','Wout','Fien','Jonas']);
  if(t===0){ const L = R.int(160,195)/10, s = R.int(15,35)/10; return {html:`Het potlood van ${nm} is ${fmtN(L)} cm lang. Na het slijpen is het ${fmtN(s)} cm korter. Hoe lang is het potlood nu, in mm? [[0:xs]] mm`, ans:roundTo((L-s)*10,4), sol:`${fmtN(L)} cm − ${fmtN(s)} cm = ${fmtN(roundTo(L-s,2))} cm = <b>${fmtN(roundTo((L-s)*10,2))} mm</b>`}; }
  if(t===1){ const k = R.pick([3,4,5,6,8]); const piece = R.int(15,45); const L = piece*k; return {html:`${nm} knipt een lint van ${fmtN(L/10)} cm in ${k} even lange stukken. Hoe lang is elk stuk, in mm? [[0:xs]] mm`, ans:piece, sol:`${fmtN(L/10)} cm = ${L} mm. ${L} mm : ${k} = <b>${piece} mm</b>`}; }
  if(t===2){ const a = R.int(310,380), d = R.int(5,40); return {html:`${nm} springt ${fmtN(a/100)} m ver. ${R.pick(['Haar','Zijn'])} vriend springt ${d} cm verder. Hoe ver springt de vriend, in m? [[0:xs]] m`, ans:(a+d)/100, sol:`${fmtN(a/100)} m = ${a} cm. ${a} cm + ${d} cm = ${a+d} cm = <b>${fmtN((a+d)/100)} m</b>`}; }
  if(t===3){ const sc = R.pick([50,100,200]); const L = R.int(25,75)/10; return {html:`Op een plan met schaal 1 : ${sc} is een kamer ${fmtN(L)} cm lang. Hoe lang is de kamer in werkelijkheid, in m? [[0:xs]] m`, ans:roundTo(L*sc/100,4), sol:`${fmtN(L)} cm · ${sc} = ${fmtN(roundTo(L*sc,2))} cm = <b>${fmtN(roundTo(L*sc/100,3))} m</b>`}; }
  if(t===4){ const s = [R.int(25,45), R.int(30,55), R.int(35,60)]; return {html:`Een driehoek heeft zijden van ${fmtN(s[0]/10)} cm, ${s[1]} mm en ${fmtN(s[2]/100)} dm. Hoe groot is de omtrek, in cm? [[0:xs]] cm`, ans:(s[0]+s[1]+s[2])/10, sol:`${fmtN(s[0]/10)} cm + ${fmtN(s[1]/10)} cm + ${fmtN(s[2]/10)} cm = <b>${fmtN((s[0]+s[1]+s[2])/10)} cm</b>`}; }
  if(t===5){ const r = R.int(3,6), l = R.pick([400,250,300]); return {html:`${nm} loopt ${r} rondjes op een looppiste van ${l} m. Hoeveel km loopt ${nm}? [[0:xs]] km`, ans:r*l/1000, sol:`${r} · ${l} m = ${r*l} m = <b>${fmtN(r*l/1000)} km</b>`}; }
  if(t===6){ const a = R.int(11,19)/10, b2 = R.int(450,950), c = R.int(2,6); return {html:`Een wandeling: eerst ${fmtN(a)} km, dan ${b2} m en tot slot ${c} hm. Hoe lang is de wandeling, in km? [[0:xs]] km`, ans:roundTo(a + b2/1000 + c/10,4), sol:`${fmtN(a)} km + ${fmtN(b2/1000)} km + ${fmtN(c/10)} km = <b>${fmtN(roundTo(a+b2/1000+c/10,4))} km</b>`}; }
  const k = R.int(3,6), h = R.int(18,25)/10; return {html:`Een stapel van ${k} boeken is elk ${fmtN(h)} cm dik. Hoe hoog is de stapel, in mm? [[0:xs]] mm`, ans:roundTo(k*h*10,4), sol:`${k} · ${fmtN(h)} cm = ${fmtN(roundTo(k*h,2))} cm = <b>${fmtN(roundTo(k*h*10,2))} mm</b>`};
}
const lpCard = (title, lvl, types, n) => ({ title, lvl, instr:'Lees goed in welke eenheid je antwoord moet staan.', build:(b,st,save,key)=>{
    const R = makeR(st); R.shuffle(types).slice(0,n).forEach((t,i)=>{ const p = lengthProblem(R,t);
      qBlock(b, st, save, 'p'+i, {nr:LET[i]+'.', html:p.html, mode:'decimal', tv:[fmtN(p.ans)], check:v=>{ const x = parseNum(v[0]); if(isNaN(x)) return {ok:false, msg:'Typ een getal.'}; return {ok:Math.abs(x-p.ans)<1e-6, msg: Math.abs(x*10-p.ans)<1e-6 || Math.abs(x/10-p.ans)<1e-6 || Math.abs(x*100-p.ans)<1e-6 || Math.abs(x/100-p.ans)<1e-6 ? 'Je rekende goed, maar let op de eenheid.' : ''}; }, sol:p.sol}); }); }});

/* ============================================================
   7–8. TEKENEN EN CONSTRUEREN: extra kaart
   ============================================================ */
NEW.vierDelen = { title:'Verdeel in vier gelijke stukken', lvl:2, build:(b,st,save,key)=>{
    const R = makeR(st); const [nA,nB,nM,nK,nL] = R.letters(5); const L = 4*R.int(12,18);
    const A = P(R.int(20,40), R.int(50,70));
    qBlock(b, st, save, 'vd', { block:true, html:`Teken [${nA}${nB}] met |${nA}${nB}| = ${cmTxt(L)}. Duid het midden ${nM} aan. Duid dan het midden ${nK} van [${nA}${nM}] en het midden ${nL} van [${nM}${nB}] aan. Zet merktekens op de vier even lange stukken.`,
      html2:`<div class="step">Elk stuk is [[0:xs]] cm lang.</div>`, block2:true, mode:'decimal', tv:[fmtN(L/40)],
      board:{w:200, h:110, tools:['pencil','eraser','label','tick','geo'], given:[ptOff(A,135,nA)]},
      check:(v,c,B)=>{ const okV = Math.abs(parseNum(v[0])-L/40)<1e-6; const r1 = lenCheck(B, B.gpt(nA), nB, L); if(!r1.ok) return {...r1, fields:[okV]};
        const Bp = B.pt(nB); const want = {[nK]:.25, [nM]:.5, [nL]:.75};
        for(const [n,t] of Object.entries(want)){ const r = CK.needPt(B,n); if(r.err) return {ok:false, fields:[okV], msg:r.err}; if(dist(r.p, lerp(B.gpt(nA),Bp,t))>.9) return {ok:false, fields:[okV], msg:`${n} ligt niet op de juiste plaats. ${n===nM?'':'Halveer eerst [' + nA + nB + '], halveer dan elke helft.'}`}; }
        const pts = [B.gpt(nA), B.pt(nK), B.pt(nM), B.pt(nL), Bp]; const tk = [0,1,2,3].map(i=>CK.ticksOn(B, pts[i], pts[i+1]));
        if(tk.some(x=>!x.length) || new Set(tk.map(x=>x[0])).size>1) return {ok:false, fields:[okV], msg:'Zet op de vier stukken hetzelfde merkteken.'};
        if(!okV) return {ok:false, fields:[okV], msg:`${cmTxt(L)} : 4 = ${fmtN(L/40)} cm.`};
        return {ok:true, fields:[okV]}; },
      demo:()=>{ const Bp = polar(A, L, 0); const s = [0,.25,.5,.75,1].map(t=>lerp(A,Bp,t)); return [...DM.drawSeg(A, 0, L, nA, nB, cmTxt(L)), {pt:s[2], name:nM, ly:4, say:`Midden: ${fmtN(L/20)} cm.`}, {pt:s[1], name:nK, ly:4, say:'De helft van de helft.'}, {pt:s[3], name:nL, ly:4}, {geoOff:true, tk:{p:mid(s[0],s[1]),dir:0,n:1}}, {tk:{p:mid(s[1],s[2]),dir:0,n:1}}, {tk:{p:mid(s[2],s[3]),dir:0,n:1}}, {tk:{p:mid(s[3],s[4]),dir:0,n:1}, wait:800}]; } });
  }};

/* ============================================================
   9–10. HOEKEN, GRADEN EN DE KLOK: extra kaarten
   ============================================================ */
function degItem(R, t){
  const a = R.int(15,85), b2 = R.int(95,170), c = R.int(190,340), h = 2*R.int(20,85), k = R.pick([2,3,4]);
  switch(t){
    case 0: return {html:`90° − ${a}° = [[0:xs]]°`, ans:90-a};
    case 1: return {html:`180° − ${b2}° = [[0:xs]]°`, ans:180-b2};
    case 2: return {html:`360° − ${c}° = [[0:xs]]°`, ans:360-c};
    case 3: return {html:`${a}° + ${b2}° = [[0:xs]]°`, ans:a+b2};
    case 4: return {html:`${b2}° − ${a}° = [[0:xs]]°`, ans:b2-a};
    case 5: return {html:`${h}° : 2 = [[0:xs]]°`, ans:h/2};
    case 6: return {html:`${k} · ${a}° = [[0:xs]]°`, ans:k*a};
    case 7: { const x = R.int(20,60), y = R.int(20,60); return {html:`180° − ${x}° − ${y}° = [[0:xs]]°`, ans:180-x-y}; }
    case 8: { const x = R.int(25,80); return {html:`180° − 2 · ${x}° = [[0:xs]]°`, ans:180-2*x}; }
    case 9: { const x = R.int(40,120), y = R.int(40,120); return {html:`360° − ${x}° − ${y}° − 90° = [[0:xs]]°`, ans:270-x-y}; }
    case 10: { const s2 = 2*R.int(15,85); return {html:`(180° − ${s2}°) : 2 = [[0:xs]]°`, ans:(180-s2)/2}; }
  }
}
const degCard = (title, lvl, types, instr) => ({ title, lvl, instr, build:(b,st,save,key)=>{
    const R = makeR(st); const grid = el('div','tf-grid'); b.append(grid);
    R.shuffle(types).forEach((t,i)=>{ const q = degItem(R,t); qBlock(grid, st, save, 'g'+i, {nr:LET[i]+'.', html:q.html, mode:'numeric', tv:[String(q.ans)], check:degIs(q.ans), sol:`<b>${q.ans}°</b>`}); }); }});
NEW.graden1 = degCard('Rekenen met graden', 1, [0,1,2,3,4,5,6,0], 'Reken tot op 1 graad. Je hebt dit nodig om hoeken te berekenen zonder te meten.');
NEW.graden2 = degCard('Meer rekenen met graden', 2, [7,8,9,10,5,6,2,1], 'Reken stap voor stap. Werk eerst de haakjes en de vermenigvuldiging uit.');
function clockProblem(R, t){
  if(t===0){ const m = R.pick([5,10,15,20,25,35,40,45,50]); return {html:`Hoeveel graden draait de grote wijzer in ${m} minuten? [[0:xs]]°`, ans:6*m, sol:`In 60 minuten draait de grote wijzer 360°, dus 6° per minuut. ${m} · 6° = <b>${6*m}°</b>`}; }
  if(t===1){ const h = R.int(2,9); return {html:`Hoeveel graden draait de kleine wijzer in ${h} uur? [[0:xs]]°`, ans:30*h, sol:`In 12 uur draait de kleine wijzer 360°, dus 30° per uur. ${h} · 30° = <b>${30*h}°</b>`}; }
  if(t===2){ const m = R.pick([10,20,30,40,50,90]); return {html:`Hoeveel graden draait de kleine wijzer in ${m} minuten? [[0:xs]]°`, ans:m/2, sol:`30° per uur = 30° per 60 minuten, dus ½° per minuut. ${m} · ½° = <b>${fmtN(m/2)}°</b>`}; }
  if(t===3){ const a = R.pick([90,180,120,240,270,30,60]); return {html:`Hoeveel minuten duurt het tot de grote wijzer ${a}° gedraaid heeft? [[0:xs]] minuten`, ans:a/6, sol:`6° per minuut: ${a}° : 6° = <b>${a/6} minuten</b>`}; }
  const h = R.int(1,11), m = R.pick([10,20,40,50]); const ang = clockAngle(h,m);
  return {html:`Hoe groot is de kleinste hoek tussen de wijzers om ${h}.${m} uur? [[0:xs]]°`, ans:ang, sol:`Grote wijzer: ${m} · 6° = ${6*m}° (vanaf 12). Kleine wijzer: ${h%12} · 30° + ${m} · ½° = ${fmtN((h%12)*30+m/2)}°. Het verschil is ${fmtN(Math.abs((h%12)*30+m/2-6*m))}°, dus de kleinste hoek is <b>${fmtN(ang)}°</b>.`};
}
const clockCard = (title, lvl, types) => ({ title, lvl, build:(b,st,save,key)=>{ const R = makeR(st);
    types.forEach((t,i)=>{ const p = clockProblem(R,t); qBlock(b, st, save, 'k'+i, {nr:LET[i]+'.', html:p.html, mode:'decimal', tv:[fmtN(p.ans)], check:degIs(p.ans), sol:p.sol}); }); }});

/* ============================================================
   11–12. HOEKEN METEN EN TEKENEN: meten + rekenen
   ============================================================ */
/* twee hoeken op één blad, met benen van 88 mm */
function twoAngles(R, a1, a2, names){
  for(let t=0;t<400;t++){
    const VA = P(R.int(10,30), R.int(108,124)), dA = R.int(0,10);
    const VB = P(R.int(170,190), R.int(8,30)), dB = 180 + R.int(-8,0);
    const A1 = polar(VA,LEG,dA), A2 = polar(VA,LEG,dA+a1), B1 = polar(VB,LEG,dB), B2 = polar(VB,LEG,dB+a2);
    const pts = [VA,A1,A2,VB,B1,B2];
    if(!pts.every(p=>p.x>3 && p.x<197 && p.y>3 && p.y<127)) continue;
    if(!noCross([[VA,A1],[VA,A2],[VB,B1],[VB,B2]].map(([p,q])=>[p,q]))) continue;
    if(segDist(VA, VB, B1) < 15 || segDist(VA, VB, B2) < 15 || segDist(VB, VA, A2) < 15 || segDist(VB, VA, A1) < 15) continue;
    return {VA, dA, VB, dB, objs:[...angleObjs(VA, dA, dA+a1, [null,names[0],null], {L1:LEG, L2:LEG}).objs, ...angleObjs(VB, dB, dB+a2, [null,names[1],null], {L1:LEG, L2:LEG}).objs]};
  }
  return null;
}
NEW.meetReken = { title:'Meet en reken', lvl:2, instr:'Meet de twee hoeken. Reken dan in het bewerkingsvak.', build:(b,st,save,key)=>{
    const R = makeR(st);
    ['a.','b.'].forEach((nr,qi)=>{ const [nA,nB] = R.letters(2); const a = R.int(25,80), c = R.int(25,80); const T = twoAngles(R, a, c, [nA,nB]);
      const big = Math.max(a,c), small = Math.min(a,c);
      qBlock(b, st, save, 'mr'+qi, { nr, block:true, html:'', html2: calcBox('bewerkingsvak', `${hat(nA)} = [[0:xs]]° &nbsp; ${hat(nB)} = [[1:xs]]° &nbsp; ${hat(nA)} + ${hat(nB)} = [[2:xs]]° &nbsp; grootste − kleinste = [[3:xs]]°`), block2:true, mode:'decimal',
        tv:[a,c,a+c,big-small].map(String),
        board:{w:200, h:130, tools:['pencil','eraser','geo'], given:T.objs},
        check:v=>{ const x = pd(v); const f = [degOk(x[0],a), degOk(x[1],c), Math.abs(x[2]-(x[0]+x[1]))<1e-6, Math.abs(x[3]-Math.abs(x[0]-x[1]))<1e-6];
          return {ok:f.every(Boolean), fields:f, msg: !f[0]||!f[1] ? 'Meet de hoeken nog eens: nulpunt op het hoekpunt, tekenzijde op een been.' : !f[2] ? 'Tel je twee metingen op.' : !f[3] ? 'Trek de kleinste meting af van de grootste.' : ''}; },
        demo:()=>[...measDemo(T.VA, T.dA, a, a+'°'), ...measDemo(T.VB, T.dB, c, c+'°')] });
    });
  }};
NEW.driehoekHoeken = { title:'Meet de hoeken van een driehoek', lvl:2, instr:'Meet de drie hoeken en tel ze op. Wat merk je?', build:(b,st,save,key)=>{
    const R = makeR(st); const [nA,nB,nC] = R.letters(3);
    let V, ang; for(let t=0;t<500;t++){ V = [P(R.int(8,30), R.int(108,124)), P(R.int(170,192), R.int(100,124)), P(R.int(55,145), R.int(6,20))];
      const s = [dist(V[0],V[1]), dist(V[1],V[2]), dist(V[2],V[0])]; ang = V.map((p,i)=>angBetween(dirAng(p,V[(i+1)%3]), dirAng(p,V[(i+2)%3])));
      if(Math.min(...s) >= LEG+2 && Math.min(...ang) >= 28) break; }
    const ai = ang.map(x=>Math.round(x));
    qBlock(b, st, save, 'dh', { block:true, html:`Meet de hoeken van driehoek ${nA}${nB}${nC}.`, html2: calcBox('bewerkingsvak', `${hat(nA)} = [[0:xs]]° &nbsp; ${hat(nB)} = [[1:xs]]° &nbsp; ${hat(nC)} = [[2:xs]]° &nbsp; ${hat(nA)} + ${hat(nB)} + ${hat(nC)} = [[3:xs]]°`), block2:true, mode:'decimal',
      tv:[...ai, ai[0]+ai[1]+ai[2]].map(String),
      board:{w:200, h:130, tools:['pencil','eraser','geo'], given:[G.seg(V[0],V[1]), G.seg(V[1],V[2]), G.seg(V[2],V[0]), ptOff(V[0],200,nA,4), ptOff(V[1],-20,nB,4), ptOff(V[2],90,nC,4)]},
      check:v=>{ const x = pd(v); const f = [0,1,2].map(i=>degOk(x[i],ang[i],1.5)); f.push(Math.abs(x[3]-(x[0]+x[1]+x[2]))<1e-6);
        return {ok:f.every(Boolean), fields:f, msg: f.every(Boolean) ? 'Wat merk je? De drie hoeken van een driehoek zijn samen altijd (ongeveer) 180°.' : !f.slice(0,3).every(Boolean) ? 'Meet de hoeken nog eens.' : 'Tel je drie metingen op.'}; },
      demo:()=>V.flatMap((p,i)=>{ let d1 = dirAng(p,V[(i+1)%3]), d2 = dirAng(p,V[(i+2)%3]); if(norm360(d2-d1)>180){ const t=d1; d1=d2; d2=t; } return measDemo(p, d1, ai[i], ai[i]+'°'); }) });
  }};
NEW.vierhoekHoeken = { title:'Meet de hoeken van een vierhoek', lvl:3, instr:'Meet de vier hoeken en tel ze op. Wat merk je?', build:(b,st,save,key)=>{
    const R = makeR(st); const names = R.letters(4);
    let V, ang; for(let t=0;t<600;t++){ V = [P(R.int(8,25), R.int(140,152)), P(R.int(172,192), R.int(135,152)), P(R.int(160,190), R.int(8,25)), P(R.int(10,40), R.int(8,30))];
      const s = V.map((p,i)=>dist(p,V[(i+1)%4])); ang = V.map((p,i)=>angBetween(dirAng(p,V[(i+1)%4]), dirAng(p,V[(i+3)%4])));
      if(Math.min(...s) >= LEG+2 && Math.min(...ang) >= 60) break; }
    const ai = ang.map(x=>Math.round(x));
    qBlock(b, st, save, 'vh', { block:true, html:`Meet de hoeken van vierhoek ${names.join('')}.`, html2: calcBox('bewerkingsvak', names.map((n,i)=>`${hat(n)} = [[${i}:xs]]°`).join(' &nbsp; ') + ` &nbsp; som = [[4:xs]]°`), block2:true, mode:'decimal',
      tv:[...ai, ai.reduce((s,x)=>s+x,0)].map(String),
      board:{w:200, h:160, tools:['pencil','eraser','geo'], given:[...V.map((p,i)=>G.seg(p,V[(i+1)%4])), ...V.map((p,i)=>ptOff(p, [225,315,45,135][i], names[i], 4))]},
      check:v=>{ const x = pd(v); const f = [0,1,2,3].map(i=>degOk(x[i],ang[i],1.5)); f.push(Math.abs(x[4]-(x[0]+x[1]+x[2]+x[3]))<1e-6);
        return {ok:f.every(Boolean), fields:f, msg: f.every(Boolean) ? 'De vier hoeken van een vierhoek zijn samen altijd 360°.' : !f.slice(0,4).every(Boolean) ? 'Meet de hoeken nog eens.' : 'Tel je vier metingen op.'}; },
      demo:()=>V.flatMap((p,i)=>{ let d1 = dirAng(p,V[(i+1)%4]), d2 = dirAng(p,V[(i+3)%4]); if(norm360(d2-d1)>180){ const t=d1; d1=d2; d2=t; } return measDemo(p, d1, ai[i], ai[i]+'°'); }) });
  }};
NEW.tekenHoeken = { title:'Teken hoeken op een halfrechte', lvl:1, instr:'Teken het tweede been, zet een boogje en noteer de grootte (bv. 65°) bij de hoek.', build:(b,st,save,key)=>{
    const R = makeR(st);
    [R.int(20,85), R.int(95,170)].forEach((a,i)=>{ const [nA,nX] = R.letters(2); const d0 = R.int(-15,15);
      const [V] = pickIn(R, ()=>{ const v = P(R.int(20,180), R.int(25,115)); return [v, polar(v,LEG+8,d0), polar(v,LEG,d0+a)]; }, 200, 130, 4);
      qBlock(b, st, save, 'th'+i, { nr:LET[i]+'.', block:true, html:`Teken een hoek ${hat(nA)} van <b>${a}°</b> aan de halfrechte [${nA}${nX}.`,
        board:{w:200, h:130, tools:['pencil','eraser','label','arc','geo'], given:rayGiven(V, d0, LEG, nA, nX)},
        check:(v,c,B)=>{ const r1 = secondLegCheck(B, V, d0, a, nA); if(!r1.ok) return r1;
          if(!CK.amAt(B, V, r1.mid, a)) return {ok:false, msg:'Zet een boogje in je hoek.'};
          if(!CK.hasLabel(B, V, 32, l=>parseDeg(l)===a)) return {ok:false, msg:`Noteer de grootte ${a}° bij de hoek.`};
          return {ok:true}; },
        demo:()=>[{say:`Nulpunt op ${nA}, tekenzijde op de halfrechte.`, geo:{x:V.x,y:V.y,rot:d0}}, {say:`Hulppunt bij ${a}°.`, pt:edgeHp(V,d0,d0+a)}, {geoAbout:{p:V, rot:d0+a}}, {line:[V, polar(V,LEG,d0+a)]}, {geoOff:true, am:{vx:V.x,vy:V.y,a0:d0,a1:d0+a,r:10}}, {lb:{p:polar(V,17,d0+a/2), s:a+'°'}, wait:800}] });
    });
  }};
NEW.evenGroot = { title:'Teken een even grote hoek', lvl:2, build:(b,st,save,key)=>{
    const R = makeR(st); const [n1,nA,n2,nO,nX] = R.letters(5); const a = R.pick([R.int(25,80), R.int(100,155)]);
    const r = pickIn(R, ()=>{ const V = P(R.int(25,175), R.int(25,105)); const d1 = R.int(0,359); return {V,d1, A:polar(V,LEG,d1), C:polar(V,LEG,d1+a)}; }, 200, 130, 5);
    const F = angleObjs(r.V, r.d1, r.d1+a, [n1,nA,n2], {L1:LEG, L2:LEG});
    qBlock(b, st, save, 'm', { nr:'a.', block:true, html:`Meet ${n1}${hat(nA)}${n2}.`, html2: calcBox('bewerkingsvak', `${hat(nA)} = [[0:xs]]°`), block2:true, mode:'decimal', tv:[String(a)],
      board:{w:200, h:130, tools:['pencil','eraser','geo'], given:F.objs},
      check:v=>({ok:degOk(parseDeg(v[0]),a), msg:'Nulpunt op het hoekpunt, tekenzijde op een been.'}), demo:()=>measDemo(r.V, r.d1, a, a+'°') });
    const d0 = R.int(-10,10); const [O] = pickIn(R, ()=>{ const v = P(R.int(20,180), R.int(25,115)); return [v, polar(v,LEG+8,d0), polar(v,LEG,d0+a)]; }, 200, 130, 4);
    qBlock(b, st, save, 't', { nr:'b.', block:true, html:`Teken aan [${nO}${nX} een hoek ${hat(nO)} zodat ${hat(nO)} = ${hat(nA)}. Zet een boogje.`,
      board:{w:200, h:130, tools:['pencil','eraser','arc','geo'], given:rayGiven(O, d0, LEG, nO, nX)},
      check:(v,c,B)=>{ const r1 = secondLegCheck(B, O, d0, a, nO); if(!r1.ok) return {ok:false, msg: r1.msg.replace(`niet ${a}°`, `maar ${hatT(nA)} = ${a}°`)}; if(!CK.amAt(B, O, r1.mid, a)) return {ok:false, msg:'Zet een boogje in je hoek.'}; return {ok:true, msg:`${hatT(nO)} = ${hatT(nA)} = ${a}°`}; },
      demo:()=>[{geo:{x:O.x,y:O.y,rot:d0}, say:`Teken ${a}°.`}, {pt:edgeHp(O,d0,d0+a)}, {geoAbout:{p:O, rot:d0+a}}, {line:[O,polar(O,LEG,d0+a)]}, {geoOff:true, am:{vx:O.x,vy:O.y,a0:d0,a1:d0+a,r:10}, wait:800}] });
  }};
NEW.somVerschil = { title:'Teken de som en het verschil van twee hoeken', lvl:3, build:(b,st,save,key)=>{
    const R = makeR(st); const [nF,nG,nA,nB,nE,nC] = R.letters(6); const f = R.int(20,50), g = R.int(f+20, 85);
    const T = twoAngles(R, f, g, [nF,nG]);
    qBlock(b, st, save, 'm', { nr:'a.', block:true, html:`Meet ${hat(nF)} en ${hat(nG)}. Bereken de som en het verschil.`, html2: calcBox('bewerkingsvak', `${hat(nF)} = [[0:xs]]° &nbsp; ${hat(nG)} = [[1:xs]]° &nbsp; ${hat(nF)} + ${hat(nG)} = [[2:xs]]° &nbsp; ${hat(nG)} − ${hat(nF)} = [[3:xs]]°`), block2:true, mode:'decimal',
      tv:[f,g,f+g,g-f].map(String), board:{w:200, h:130, tools:['pencil','eraser','geo'], given:T.objs},
      check:v=>{ const x = pd(v); const fl = [degOk(x[0],f), degOk(x[1],g), Math.abs(x[2]-x[0]-x[1])<1e-6, Math.abs(x[3]-(x[1]-x[0]))<1e-6]; return {ok:fl.every(Boolean), fields:fl, msg: !fl[0]||!fl[1] ? 'Meet de hoeken nog eens.' : 'Reken met je eigen metingen.'}; },
      demo:()=>[...measDemo(T.VA,T.dA,f,f+'°'), ...measDemo(T.VB,T.dB,g,g+'°')] });
    const A = P(R.int(110,125), R.int(95,105)), dAr = R.int(-5,5); const E = P(R.int(12,25), R.int(118,124)), dEr = R.int(-5,5);
    qBlock(b, st, save, 't', { nr:'b.', block:true, html:`Teken aan [${nA}${nB} een hoek ${hat(nA)} = ${hat(nF)} + ${hat(nG)} en aan [${nE}${nC} een hoek ${hat(nE)} = ${hat(nG)} − ${hat(nF)}. Zet telkens een boogje.`,
      board:{w:200, h:130, tools:['pencil','eraser','label','arc','geo'], given:[...rayGiven(A, dAr, 75, nA, nB).slice(0,2), ...rayGiven(E, dEr, 80, nE, nC).slice(0,2)]},
      check:(v,c,B)=>{ const one = (V, d0, want, nm, how)=>{ const r = secondLegCheck(B, V, d0, want, nm); if(!r.ok) return {ok:false, msg: r.msg.replace(/niet \d+°\./, `maar het moet ${how} zijn.`)}; if(!CK.amAt(B,V,r.mid,want,4)) return {ok:false, msg:`Zet een boogje in ${hatT(nm)}.`}; return {ok:true}; };
        const r1 = one(A, dAr, f+g, nA, `${f}° + ${g}° = ${f+g}°`); if(!r1.ok) return r1; const r2 = one(E, dEr, g-f, nE, `${g}° − ${f}° = ${g-f}°`); if(!r2.ok) return r2;
        return {ok:true, msg:`${hatT(nA)} = ${f+g}° en ${hatT(nE)} = ${g-f}°.`}; },
      demo:()=>[{geo:{x:A.x,y:A.y,rot:dAr}, say:`${f}° + ${g}° = ${f+g}°`}, {pt:edgeHp(A,dAr,dAr+f+g)}, {geoAbout:{p:A, rot:dAr+f+g}}, {line:[A,polar(A,LEG,dAr+f+g)]}, {am:{vx:A.x,vy:A.y,a0:dAr,a1:dAr+f+g,r:10}},
        {geo:{x:E.x,y:E.y,rot:dEr}, say:`${g}° − ${f}° = ${g-f}°`}, {pt:edgeHp(E,dEr,dEr+g-f)}, {geoAbout:{p:E, rot:dEr+g-f}}, {line:[E,polar(E,LEG,dEr+g-f)]}, {geoOff:true, am:{vx:E.x,vy:E.y,a0:dEr,a1:dEr+g-f,r:10}, wait:800}] });
  }};
NEW.driehoekAOE = { title:'Teken een driehoek met een zijde en twee hoeken', lvl:3, build:(b,st,save,key)=>{
    const R = makeR(st); const [nA,nO,nE,nM,nP] = R.letters(5); const L = R.int(8,11)*10; const m = R.int(35,65), p = R.int(35,65);
    const T = twoAngles(R, m, p, [nM,nP]);
    qBlock(b, st, save, 'm', { nr:'a.', block:true, html:`Meet ${hat(nM)} en ${hat(nP)}.`, html2: calcBox('bewerkingsvak', `${hat(nM)} = [[0:xs]]° &nbsp; ${hat(nP)} = [[1:xs]]°`), block2:true, mode:'decimal', tv:[m,p].map(String),
      board:{w:200, h:130, tools:['pencil','eraser','geo'], given:T.objs}, check:v=>{ const x = pd(v); const f = [degOk(x[0],m), degOk(x[1],p)]; return {ok:f[0]&&f[1], fields:f}; },
      demo:()=>[...measDemo(T.VA,T.dA,m,m+'°'), ...measDemo(T.VB,T.dB,p,p+'°')] });
    const O = P(R.int(30,50), 118);
    qBlock(b, st, save, 't', { nr:'b.', block:true, html:`Teken driehoek ${nA}${nO}${nE} met |${nO}${nE}| = ${L/10} cm, ${hat(nO)} = ${hat(nM)} en ${hat(nE)} = ${hat(nP)}. Teken [${nO}${nE}] naar rechts en ${nA} erboven.`,
      board:{w:200, h:130, tools:['pencil','eraser','label','arc','geo','compass'], given:[ptOff(O, 200, nO, 4)]},
      check:(v,c,B)=>{ const re = CK.needPt(B,nE); if(re.err) return {ok:false, msg:re.err}; const E = re.p;
        if(Math.abs(dist(O,E)-L)>1.05) return {ok:false, msg:`|${nO}${nE}| moet ${L/10} cm zijn.`};
        const ra = CK.needPt(B,nA); if(ra.err) return {ok:false, msg:ra.err}; const A = ra.p;
        const aO = angBetween(dirAng(O,E), dirAng(O,A)), aE = angBetween(dirAng(E,O), dirAng(E,A));
        if(Math.abs(aO-m)>1.5) return {ok:false, msg:`${hatT(nO)} is ${Math.round(aO)}°, maar ${hatT(nM)} = ${m}°.`};
        if(Math.abs(aE-p)>1.5) return {ok:false, msg:`${hatT(nE)} is ${Math.round(aE)}°, maar ${hatT(nP)} = ${p}°.`};
        if(!CK.hasSeg(B,O,E) || !CK.through(B,O,A).length || !CK.through(B,E,A).length) return {ok:false, msg:'Teken de drie zijden van de driehoek.'};
        return {ok:true}; },
      demo:()=>{ const E = polar(O,L,0); const A = lineInter(O, polar(O,10,m), E, polar(E,10,180-p));
        return [{say:`Teken [${nO}${nE}] van ${L/10} cm.`, geo:{x:O.x,y:O.y,rot:0}}, {line:[O,E]}, {pt:E, name:nE, ly:4.5}, {say:`Hoek van ${m}° in ${nO}.`, pt:edgeHp(O,0,m)}, {geoAbout:{p:O, rot:m}}, {line:[O, polar(O, dist(O,A)+8, m)]},
          {say:`Hoek van ${p}° in ${nE}.`, geo:{x:E.x,y:E.y,rot:180}}, {pt:edgeHp(E,180,180-p)}, {geoAbout:{p:E, rot:180-p}}, {line:[E, polar(E, dist(E,A)+8, 180-p)]}, {geoOff:true, pt:A, name:nA, ly:-4.5, say:`Het snijpunt is ${nA}.`}, {wait:900}]; } });
  }};

/* ============================================================
   16. HOEKEN BEREKENEN ZONDER METEN
   ============================================================ */
const RA = '#f5a40f';
function calcFig(R, type){
  const O = P(50,46), Lg = 40; const d0 = R.int(-12,12); const o = []; const q = []; let sol = '';
  const ray = d => o.push(G.ray(O, polar(O,Lg,d)));
  const line = d => o.push(G.line(polar(O,-Lg-4,d), polar(O,Lg+4,d)));
  const arc = (a0,a1,txt,r,unk) => o.push(G.am(O, a0, a1, Object.assign({r, txt}, unk?{tcol:RA, color:RA}:{} )));
  const right = (a0) => o.push(G.am(O, a0, a0+90, {style:'right'}));
  switch(type){
    case 'rechte2': { const x = R.int(18,72); ray(d0); ray(d0+90); ray(d0+x); right(d0); arc(d0, d0+x, x+'°', 14); arc(d0+x, d0+90, 'α', 10, true); q.push(['α',90-x]); sol = `${x}° + α = 90° (rechte hoek) → α = 90° − ${x}° = <b>${90-x}°</b>`; break; }
    case 'rechte3': { const x = R.int(15,40), y = R.int(15,40); ray(d0); ray(d0+90); ray(d0+x); ray(d0+x+y); right(d0); arc(d0,d0+x,x+'°',15); arc(d0+x,d0+x+y,y+'°',19); arc(d0+x+y,d0+90,'α',10,true); q.push(['α',90-x-y]); sol = `${x}° + ${y}° + α = 90° → α = 90° − ${x}° − ${y}° = <b>${90-x-y}°</b>`; break; }
    case 'gestrekt2': { const x = R.int(25,155); line(d0); ray(d0+x); arc(d0,d0+x,x+'°',x<45?16:12); arc(d0+x,d0+180,'α',9,true); q.push(['α',180-x]); sol = `${x}° + α = 180° (gestrekte hoek) → α = 180° − ${x}° = <b>${180-x}°</b>`; break; }
    case 'gestrekt3': { const x = R.int(25,70), y = R.int(25,70); line(d0); ray(d0+x); ray(d0+180-y); arc(d0,d0+x,x+'°',13); arc(d0+180-y,d0+180,y+'°',13); arc(d0+x,d0+180-y,'α',8,true); q.push(['α',180-x-y]); sol = `${x}° + α + ${y}° = 180° → α = 180° − ${x}° − ${y}° = <b>${180-x-y}°</b>`; break; }
    case 'loodlijn': { const x = R.int(20,70); line(d0); ray(d0+90); ray(d0+90+x); right(d0); arc(d0+90,d0+90+x,x+'°',15); arc(d0+90+x,d0+180,'α',10,true); q.push(['α',90-x]); sol = `90° + ${x}° + α = 180° → α = 180° − 90° − ${x}° = <b>${90-x}°</b>`; break; }
    case 'vol3': { const x = R.int(80,140), y = R.int(80,140); ray(d0); ray(d0+x); ray(d0+x+y); arc(d0,d0+x,x+'°',9); arc(d0+x,d0+x+y,y+'°',12); arc(d0+x+y,d0+360,'α',7,true); q.push(['α',360-x-y]); sol = `${x}° + ${y}° + α = 360° (volle hoek) → α = 360° − ${x}° − ${y}° = <b>${360-x-y}°</b>`; break; }
    case 'vol4': { const x = R.int(55,100), y = R.int(55,100); ray(d0); ray(d0+90); ray(d0+90+x); ray(d0+90+x+y); right(d0); arc(d0+90,d0+90+x,x+'°',11); arc(d0+90+x,d0+90+x+y,y+'°',14); arc(d0+90+x+y,d0+360,'α',8,true); q.push(['α',270-x-y]); sol = `90° + ${x}° + ${y}° + α = 360° → α = 360° − 90° − ${x}° − ${y}° = <b>${270-x-y}°</b>`; break; }
    case 'gelijk': { const full = R.f()<.5; const k = full ? R.pick([5,6,8,9,10,12]) : R.pick([3,4,5,6]); const tot = full?360:180; const s = tot/k;
      if(full) for(let i=0;i<k;i++) ray(d0+i*s); else { line(d0); for(let i=1;i<k;i++) ray(d0+i*s); }
      for(let i=0;i<k;i++) o.push(G.am(O, d0+i*s, d0+(i+1)*s, {r:i===0?11:8, n:1, txt:i===0?'α':'', tcol:RA, color:i===0?RA:INK}));
      q.push(['α',s]); sol = `De ${full?'volle':'gestrekte'} hoek (${tot}°) is verdeeld in ${k} even grote hoeken (zelfde merkteken): α = ${tot}° : ${k} = <b>${fmtDeg(s)}</b>`; break; }
    case 'insp': { const x = R.int(35,150); ray(d0); ray(d0+x); arc(d0,d0+x,x+'°',13); arc(d0+x,d0+360,'α',7,true); q.push(['α',360-x]); sol = `α + ${x}° = 360° (volle hoek) → α = 360° − ${x}° = <b>${360-x}°</b>`; break; }
    case 'over': { const x = R.int(25,80); line(d0); line(d0+x); arc(d0,d0+x,x+'°',12); arc(d0+180,d0+180+x,'α',12,true); arc(d0+x,d0+180,'β',8,true); q.push(['α',x],['β',180-x]); sol = `α = <b>${x}°</b> (overstaande hoeken zijn even groot) · β = 180° − ${x}° = <b>${180-x}°</b> (nevenhoeken)`; break; }
    case 'bis': { const h = R.int(15,50); const half = R.f()<.5; ray(d0); ray(d0+2*h); o.push(G.seg(O, polar(O,Lg,d0+h), {color:'#1fa6ab', w:.5}), G.txt(polar(O,Lg+4,d0+h),'b',{italic:true, color:'#1fa6ab'}));
      if(half){ o.push(G.am(O,d0,d0+h,{r:12,n:1,txt:h+'°'}), G.am(O,d0+h,d0+2*h,{r:12,n:1}), G.am(O,d0,d0+2*h,{r:22,txt:'α',color:RA,tcol:RA})); q.push(['α',2*h]); sol = `b is de bissectrice: beide helften zijn ${h}°. α = 2 · ${h}° = <b>${2*h}°</b>`; }
      else { o.push(G.am(O,d0,d0+2*h,{r:22,txt:(2*h)+'°'}), G.am(O,d0,d0+h,{r:11,n:1,txt:'α',color:RA,tcol:RA}), G.am(O,d0+h,d0+2*h,{r:11,n:1})); q.push(['α',h]); sol = `b is de bissectrice: α = ${2*h}° : 2 = <b>${h}°</b>`; } break; }
    case 'keten': { const x = R.int(25,70), y = R.int(20, 160-x-20); line(d0); line(d0+x); ray(d0+x+y);
      arc(d0,d0+x,x+'°',11); arc(d0+x,d0+x+y,y+'°',15); arc(d0+x+y,d0+180,'α',9,true); arc(d0+180,d0+180+x,'β',11,true); arc(d0+180+x,d0+360,'γ',8,true);
      q.push(['α',180-x-y],['β',x],['γ',180-x]); sol = `α = 180° − ${x}° − ${y}° = <b>${180-x-y}°</b> (gestrekte hoek) · β = <b>${x}°</b> (overstaand) · γ = 180° − ${x}° = <b>${180-x}°</b> (nevenhoek)`; break; }
    case 'alfa': { const kind = R.int(0,3);
      if(kind===0){ const k = R.pick([2,3,4,5]); const a = 180/(k+1); line(d0); ray(d0+a); arc(d0,d0+a,'α',14,true); arc(d0+a,d0+180,k+' · α',9); q.push(['α',a]); sol = `α + ${k} · α = 180°, dus ${k+1} · α = 180° en α = 180° : ${k+1} = <b>${fmtDeg(a)}</b>`; }
      else if(kind===1){ const k = R.pick([2,5,8]); const a = 90/(k+1); ray(d0); ray(d0+90); ray(d0+a); right(d0); arc(d0,d0+a,'α',16,true); arc(d0+a,d0+90,k+' · α',11); q.push(['α',a]); sol = `α + ${k} · α = 90°, dus ${k+1} · α = 90° en α = 90° : ${k+1} = <b>${fmtDeg(a)}</b>`; }
      else if(kind===2){ const d = 2*R.int(5,30); const a = (180-d)/2; line(d0); ray(d0+a+d); arc(d0,d0+a+d,'α + '+d+'°',12); arc(d0+a+d,d0+180,'α',9,true); q.push(['α',a]); sol = `α + (α + ${d}°) = 180°, dus 2 · α = ${180-d}° en α = <b>${fmtDeg(a)}</b>`; }
      else { const a = 360/6; ray(d0); ray(d0+a); ray(d0+3*a); arc(d0,d0+a,'α',8,true); arc(d0+a,d0+3*a,'2 · α',12); arc(d0+3*a,d0+360,'3 · α',9); q.push(['α',a]); sol = `α + 2 · α + 3 · α = 360°, dus 6 · α = 360° en α = <b>60°</b>`; }
      break; }
  }
  o.push(Object.assign(G.pt(O,''),{small:true}));
  return {o, q, sol};
}
const calcCard = (title, lvl, types, n, instr) => ({ title, lvl, instr: instr || 'Bereken zonder te meten. Noteer enkel het getal.', build:(b,st,save,key)=>{
    const R = makeR(st); const grid = el('div','fig-row'); b.append(grid);
    const list = []; for(let i=0;i<n;i++) list.push(types[i % types.length]);
    R.shuffle(list).forEach((t,i)=>{ const F = calcFig(R,t);
      const box = el('div','fig-card'); grid.append(box); box.append(el('div','', fig(110,92,F.o,{scale:3.3, margin:6})));
      qBlock(box, st, save, 'c'+i, {nr:LET[i]+'.', html:F.q.map(([l],k)=>`${l} = [[${k}:xs]]°`).join(' &nbsp; '), mode:'decimal', tv:F.q.map(([,a])=>fmtDeg(a)),
        check:v=>{ const x = pd(v); const f = F.q.map(([,a],k)=>Math.abs(x[k]-a)<.01); return {ok:f.every(Boolean), fields:f}; }, sol:F.sol});
    }); }});

/* ============================================================
   17. COMPLEMENTAIRE EN SUPPLEMENTAIRE HOEKEN
   ============================================================ */
const csFig = (a1, a2, sum, adj, lab1, lab2) => { const o = []; const O = P(40,40);
  if(adj){ o.push(G.ray(O, polar(O,34,0)), G.ray(O, polar(O,34,a1)), G.ray(O, polar(O,34,a1+a2))); o.push(G.am(O,0,a1,{r:12,txt:lab1+' = '+a1+'°'}), G.am(O,a1,a1+a2,{r:17,txt:lab2+' = '+a2+'°', color:RA, tcol:RA})); if(sum===90) o.push(G.am(O,0,90,{style:'right'})); }
  else { const O2 = P(95,40); o.push(G.ray(O, polar(O,30,0)), G.ray(O, polar(O,30,a1)), G.am(O,0,a1,{r:10,txt:lab1+' = '+a1+'°', tr:16}), G.ray(O2, polar(O2,30,20)), G.ray(O2, polar(O2,30,20+a2)), G.am(O2,20,20+a2,{r:10,txt:lab2+' = '+a2+'°', color:RA, tcol:RA, tr:16}), Object.assign(G.pt(O2,''),{small:true})); }
  o.push(Object.assign(G.pt(O,''),{small:true})); return fig(130,50,o,{scale:2.6, margin:5}); };
const CS_THEORY = `<div class="theory">
  <div><h4>Complementaire hoeken</h4>${csFig(60,30,90,true,'α','β')}
    <p>α = 60° en β = 30°. α + β = 60° + 30° = <b>90°</b>.</p>
    <div class="def"><b>Complementaire hoeken</b> zijn twee hoeken waarvan de som <b>90°</b> is.</div>
    <p>60° is het <b>complement</b> van 30°, en 30° is het complement van 60°.<br>Het complement van α is <b>90° − α</b>.</p>
    ${csFig(35,55,90,false,'γ','δ')}<p style="font-size:.85rem">Complementaire hoeken moeten niet naast elkaar liggen: 35° + 55° = 90°.</p></div>
  <div><h4>Supplementaire hoeken</h4>${csFig(140,40,180,true,'γ','δ')}
    <p>γ = 140° en δ = 40°. γ + δ = 140° + 40° = <b>180°</b>.</p>
    <div class="def"><b>Supplementaire hoeken</b> zijn twee hoeken waarvan de som <b>180°</b> is.</div>
    <p>140° is het <b>supplement</b> van 40°, en 40° is het supplement van 140°.<br>Het supplement van α is <b>180° − α</b>.</p>
    ${csFig(110,70,180,false,'ε','φ')}<p style="font-size:.85rem">Ook deze hoeken zijn supplementair: 110° + 70° = 180°.<br><b>Nevenhoeken</b> zijn aanliggend én supplementair.</p></div>
</div>`;
NEW.csOntdek = { title:'Ontdek: samen 90° of samen 180°', lvl:1, build:(b,st,save,key)=>{
    let mode = 90; const O = P(100,80);
    const b90 = ctlBtn('Rechte hoek (90°)', ()=>{ mode=90; D.P.K.x = polar(O,50,35).x; D.P.K.y = polar(O,50,35).y; paint(); }), b180 = ctlBtn('Gestrekte hoek (180°)', ()=>{ mode=180; D.P.K.x = polar(O,50,70).x; D.P.K.y = polar(O,50,70).y; paint(); });
    const paint = ()=>{ b90.classList.toggle('chosen', mode===90); b180.classList.toggle('chosen', mode===180); D.redraw(); };
    const D = dynFig(b, { w:200, h:95, maxw:720, ctl:[el('span','','Sleep het rode punt.'), b90, b180],
      pts:{K:{...polar(O,50,35), drag:true, c:p=>polar(O,50,clamp(dirAng(O,p)>270?0:dirAng(O,p),3,mode-3))}},
      draw:Pt=>{ const a = dirAng(O,Pt.K); let s = objSVG(G.ray(O, polar(O,62,0))) + objSVG(G.ray(O, polar(O,62,mode))) + objSVG(G.ray(O, polar(O,62,a),{color:RA, w:.5}));
        s += objSVG(G.am(O,0,a,{r:14, fill:'rgba(15,94,110,.18)', txt:'α', tr:20})) + objSVG(G.am(O,a,mode,{r:18, fill:'rgba(245,164,15,.18)', txt:'β', tr:24, color:RA, tcol:RA}));
        if(mode===90) s += objSVG(G.am(O,0,90,{style:'right'})); return s + objSVG(G.pt(O,'')); },
      info:Pt=>{ const a = Math.round(dirAng(O,Pt.K)); return `α = ${a}° &nbsp; β = ${mode-a}° &nbsp; → α + β = <b>${mode}°</b>: α en β zijn <b>${mode===90?'complementair':'supplementair'}</b>. ${mode===90?'Het complement':'Het supplement'} van ${a}° is ${mode-a}°.`; } });
    paint();
  }};
NEW.csHerken = { title:'Complementair, supplementair of geen van beide?', lvl:1, build:(b,st,save,key)=>{
    const R = makeR(st); const grid = el('div','fig-row'); b.append(grid);
    const pairs = R.shuffle([['comp',90],['comp',90],['sup',180],['sup',180],['geen',0],['geen',0]]);
    pairs.forEach(([k],i)=>{ let a1, a2; if(k==='comp'){ a1 = R.int(15,75); a2 = 90-a1; } else if(k==='sup'){ a1 = R.int(30,150); a2 = 180-a1; } else { a1 = R.int(20,80); a2 = R.pick([100-a1, 170-a1, 80-a1+20]); if(a1+a2===90||a1+a2===180) a2 += 7; }
      const adj = R.f()<.5 && a1+a2<=180; const box = el('div','fig-card'); grid.append(box);
      qChoice(box, st, save, 'h'+i, {nr:LET[i]+'.', html:'', fig:csFig(a1,a2,a1+a2,adj,'α','β'), opts:[['comp','complementair'],['sup','supplementair'],['geen','geen van beide']], ans:k,
        why: k==='comp' ? `${a1}° + ${a2}° = 90°.` : k==='sup' ? `${a1}° + ${a2}° = 180°.` : `${a1}° + ${a2}° = ${a1+a2}°: geen 90° en geen 180°.`}); });
  }};
NEW.csTeken = { title:'Teken het complement en het supplement', lvl:2, instr:'Teken zonder te meten.', build:(b,st,save,key)=>{
    const R = makeR(st);
    { const [nV] = R.letters(1); const a = R.int(20,70); const V = P(R.int(55,75),100); const d1 = R.int(-5,8);
      const F = angleObjs(V, d1, d1+a, [null,nV,null], {L1:LEG, L2:LEG, am:{txt:'α', r:9}});
      qBlock(b, st, save, 'cp', { nr:'a.', block:true, html:`Teken het complement γ van α, aanliggend aan α. Gebruik de <b>loodlijn</b> van je geodriehoek. Zet een boogje en noteer γ.`,
        board:{w:200, h:120, tools:['pencil','eraser','label','arc','geo'], geo:{mode:'constructie'}, given:F.objs},
        check:(v,c,B)=>{ const rays = CK.rays(B, V, .9, 10).filter(r=>adiff(r.dir, d1+90)<=1.05);
          if(!rays.length) return {ok:false, msg:`Teken in ${nV} een loodlijn op het eerste been (aan de kant van α).`};
          if(!CK.amAt(B, V, d1+a+(90-a)/2, 90-a, 4)) return {ok:false, msg:'Zet een boogje in γ: tussen α en je loodlijn.'};
          if(!CK.hasLabel(B, V, 30, 'γ')) return {ok:false, msg:'Noteer γ bij de hoek.'};
          return {ok:true, msg:'α + γ = 90°: γ is het complement van α.'}; },
        demo:()=>[{say:'Nulpunt op het hoekpunt. Draai tot de <b>loodlijn</b> op het been ligt: de tekenzijde staat dan loodrecht op het been.', geo:{x:V.x,y:V.y,rot:d1+90}}, {line:[V, polar(V,70,d1+90)]}, {geoOff:true, am:{vx:V.x,vy:V.y,a0:d1+a,a1:d1+90,r:12}}, {lb:{p:polar(V,18,d1+a+(90-a)/2), s:'γ'}, wait:900}] }); }
    { const [nV] = R.letters(1); const a = R.int(35,140); const V = P(R.int(90,110), 85); const d1 = R.int(-5,5);
      const F = angleObjs(V, d1, d1+a, [null,nV,null], {L1:LEG-10, L2:LEG-10, am:{txt:'α', r:9}});
      qBlock(b, st, save, 'sp', { nr:'b.', block:true, html:`Teken het supplement δ van α, aanliggend aan α. Zet een boogje en noteer δ.`,
        board:{w:200, h:120, tools:['pencil','eraser','label','arc','geo'], geo:{mode:'constructie'}, given:F.objs},
        check:(v,c,B)=>{ const ok = B.segs().some(s=>lineDist(V,s.a,s.b)<=.9 && ldiff(dirAng(s.a,s.b),d1)<1 && [s.a,s.b].some(e=>dist(V,e)>=10 && adiff(dirAng(V,e), d1+180)<2));
          if(!ok) return {ok:false, msg:'Trek het eerste been door, voorbij het hoekpunt: zo krijg je een gestrekte hoek (180°).'};
          if(!CK.amAt(B, V, d1+a+(180-a)/2, 180-a, 4)) return {ok:false, msg:'Zet een boogje in δ, naast α.'};
          if(!CK.hasLabel(B, V, 30, 'δ')) return {ok:false, msg:'Noteer δ bij de hoek.'};
          return {ok:true, msg:'α + δ = 180°: δ is het supplement van α (en ze zijn nevenhoeken).'}; },
        demo:()=>[{say:'Trek het been door, voorbij het hoekpunt.', geo:{x:V.x,y:V.y,rot:d1+180}}, {line:[V, polar(V,60,d1+180)]}, {geoOff:true, am:{vx:V.x,vy:V.y,a0:d1+a,a1:d1+180,r:10}}, {lb:{p:polar(V,16,d1+a+(180-a)/2), s:'δ'}, wait:900}] }); }
  }};
NEW.csWaar = { title:'Waar of niet waar?', lvl:2, build:(b,st,save,key)=>{
    const R = makeR(st); const x = R.int(15,75), y = R.int(100,170);
    const pool = [
      [`Het supplement van ${y}° is ${180-y}°.`,'w',`${y}° + ${180-y}° = 180°.`],
      [`Het complement van ${x}° is ${180-x}°.`,'n',`Het complement is 90° − ${x}° = ${90-x}°. ${180-x}° is het supplement.`],
      [`Een hoek van ${x}° is het complement van een hoek van ${90-x}°.`,'w',`${x}° + ${90-x}° = 90°.`],
      [`Een hoek van ${x}° is het supplement van een hoek van ${90+x}°.`,'n',`${x}° + ${90+x}° = ${180+x}°, niet 180°.`],
      ['Twee supplementaire hoeken kunnen even groot zijn.','w','90° + 90° = 180°.'],
      ['Twee complementaire hoeken kunnen allebei stomp zijn.','n','Twee stompe hoeken zijn samen meer dan 180°.'],
      ['Aanliggende hoeken kunnen complementair zijn.','w','Bijvoorbeeld een rechte hoek die door een halfrechte in twee wordt gedeeld.'],
      ['Overstaande hoeken kunnen supplementair zijn.','w','Als ze allebei 90° zijn.'],
      ['Als α + β = 180°, dan zijn α en β zeker nevenhoeken.','n','Ze zijn supplementair, maar niet noodzakelijk aanliggend.'],
      ['Nevenhoeken zijn altijd supplementair.','w','Nevenhoeken zijn aanliggend én supplementair.'],
      ['Een stompe hoek heeft een complement.','n','Een stompe hoek is al groter dan 90°.'],
      ['Het complement van een scherpe hoek is altijd een scherpe hoek.','w','90° min een getal tussen 0 en 90 ligt ook tussen 0 en 90.']
    ];
    const grid = el('div','tf-grid'); b.append(grid);
    R.shuffle(pool).slice(0,6).forEach(([h,a,w],i)=>qChoice(grid, st, save, 'w'+i, {nr:(i+1)+'.', html:h, opts:[['w','Waar'],['n','Niet waar']], ans:a, why:w}));
  }};
NEW.csDenk = { title:'Denkvragen', lvl:3, build:(b,st,save,key)=>{
    const R = makeR(st); const c = R.int(10,70), s = R.int(100,170);
    qBlock(b, st, save, 'd1', { nr:'a.', html:`Het complement van α is ${c}°. Hoe groot is het supplement van α? [[0:xs]]°`, mode:'decimal', tv:[String(180-(90-c))], check:degIs(180-(90-c)), sol:`α = 90° − ${c}° = ${90-c}°. Supplement: 180° − ${90-c}° = <b>${90+c}°</b>` });
    qBlock(b, st, save, 'd2', { nr:'b.', html:`Het supplement van β is ${s}°. Hoe groot is het complement van β? [[0:xs]]°`, mode:'decimal', tv:[String(90-(180-s))], check:degIs(90-(180-s)), sol:`β = 180° − ${s}° = ${180-s}°. Complement: 90° − ${180-s}° = <b>${s-90}°</b>` });
    qBlock(b, st, save, 'd3', { nr:'c.', html:'Het supplement van een scherpe hoek is altijd [[0:xs]]° groter dan het complement van die hoek.', mode:'decimal', tv:['90'], check:degIs(90), sol:'(180° − α) − (90° − α) = <b>90°</b>' });
  }};

/* ============================================================
   18. VRAAGSTUKKEN (zonder complement en supplement)
   ============================================================ */
const PINK = '#f8c9bd', BLUE = '#bfdfe3', YEL = '#fde4a8';
const nParts = (k, txt, col) => Array.from({length:k},()=>({w:1, txt, col}));
function vraagstuk2(R, T){
  let txt, ans, sol, bars;
  if(T===0){ const k = R.pick([2,4,5,8,9]); ans = 90*k/(k+1); txt = `Twee hoeken vormen samen een rechte hoek. De ene hoek is ${k} keer zo groot als de andere. Hoe groot is de grootste hoek?`;
    bars = angleModel([{label:'kleinste', parts:nParts(1,'α',BLUE)}, {label:'grootste', parts:nParts(k,'α',PINK)}], {txt:'samen 90°'}, 220/(k+1));
    sol = `Kleinste = α, grootste = ${k} · α. α + ${k} · α = ${k+1} · α = 90°, dus α = 90° : ${k+1} = ${fmtDeg(90/(k+1))}. De grootste hoek is ${k} · ${fmtDeg(90/(k+1))} = <b>${fmtDeg(ans)}</b>.`; }
  if(T===1){ const k = R.pick([2,3,4,5,8,11]); ans = 180/(k+1); txt = `Twee nevenhoeken: de ene hoek is ${k} keer zo groot als de andere. Hoe groot is de kleinste hoek?`;
    bars = angleModel([{label:'kleinste', parts:nParts(1,'α',PINK)}, {label:'grootste', parts:nParts(k,'α',BLUE)}], {txt:'samen 180°'}, 220/(k+1));
    sol = `Nevenhoeken zijn samen 180°. α + ${k} · α = ${k+1} · α = 180°, dus α = 180° : ${k+1} = <b>${fmtDeg(ans)}</b>.`; }
  if(T===2){ const d = 2*R.int(10,45); ans = (180-d)/2; txt = `Twee hoeken vormen samen een gestrekte hoek. De ene hoek is ${d}° groter dan de andere. Hoe groot is de kleinste hoek?`;
    bars = angleModel([{label:'kleinste', parts:[{w:ans,txt:'α',col:PINK}]}, {label:'grootste', parts:[{w:ans,txt:'α',col:BLUE},{w:d,txt:d+'°',col:YEL}]}], {txt:'samen 180°'}, 220/180);
    sol = `α + (α + ${d}°) = 180°, dus 2 · α = 180° − ${d}° = ${180-d}° en α = ${180-d}° : 2 = <b>${fmtDeg(ans)}</b>.`; }
  if(T===3){ const d = 2*R.int(5,30); ans = (90+d)/2; txt = `Twee hoeken vormen samen een rechte hoek. De ene hoek is ${d}° kleiner dan de andere. Hoe groot is de grootste hoek?`;
    bars = angleModel([{label:'grootste', parts:[{w:ans-d,txt:'α',col:PINK},{w:d,txt:d+'°',col:YEL}]}, {label:'kleinste', parts:[{w:ans-d,txt:'α',col:BLUE}]}], {txt:'samen 90°'}, 220/90);
    sol = `Kleinste = α, grootste = α + ${d}°. 2 · α + ${d}° = 90°, dus 2 · α = ${90-d}° en α = ${fmtDeg((90-d)/2)}. De grootste hoek is ${fmtDeg((90-d)/2)} + ${d}° = <b>${fmtDeg(ans)}</b>.`; }
  if(T===4){ const m = R.pick([[1,2,3],[2,3,4],[1,3,5],[1,1,4],[2,3,7],[1,2,6]]); const s = m[0]+m[1]+m[2]; ans = 180/s; const lab = k => k===1 ? 'α' : k+' · α';
    txt = `Een gestrekte hoek wordt verdeeld in drie hoeken: ${lab(m[0])}, ${lab(m[1])} en ${lab(m[2])}. Hoe groot is α?`;
    bars = angleModel(m.map((k,i)=>({label:lab(k), parts:nParts(k,'α',[PINK,BLUE,YEL][i])})), {txt:'samen 180°'}, 220/s);
    sol = `${lab(m[0])} + ${lab(m[1])} + ${lab(m[2])} = ${s} · α = 180°, dus α = 180° : ${s} = <b>${fmtDeg(ans)}</b>.`; }
  if(T===5){ const m = R.pick([[1,2,3,4],[1,1,2,2],[2,3,3,4],[1,2,2,3]]); const s = m.reduce((a,c)=>a+c,0); ans = 360/s; const lab = k => k===1 ? 'α' : k+' · α';
    txt = `Een volle hoek wordt verdeeld in ${m.length} hoeken: ${m.map(lab).join(', ').replace(/, ([^,]*)$/,' en $1')}. Hoe groot is α?`;
    bars = angleModel(m.map((k,i)=>({label:lab(k), parts:nParts(k,'α',[PINK,BLUE,YEL,'#d9c7f0'][i])})), {txt:'samen 360°'}, 220/s);
    sol = `${s} · α = 360°, dus α = 360° : ${s} = <b>${fmtDeg(ans)}</b>.`; }
  if(T===6){ const d = R.pick([12,20,28,36,44]); ans = (180-d)/4; txt = `Drie hoeken vormen samen een gestrekte hoek. De tweede hoek is 2 keer zo groot als de eerste. De derde hoek is ${d}° groter dan de eerste. Hoe groot is de eerste hoek?`;
    bars = angleModel([{label:'eerste', parts:nParts(1,'α',PINK)}, {label:'tweede', parts:nParts(2,'α',BLUE)}, {label:'derde', parts:[{w:1,txt:'α',col:YEL},{w:d/ans,txt:d+'°',col:'#eadfc7'}]}], {txt:'samen 180°'}, 220/(4+d/ans));
    sol = `α + 2 · α + (α + ${d}°) = 180°, dus 4 · α = 180° − ${d}° = ${180-d}° en α = <b>${fmtDeg(ans)}</b>.`; }
  if(T===7){ const d = R.pick([6,10,14,18,22]); ans = (90-3*d)/4; txt = `Een rechte hoek wordt verdeeld in drie hoeken. De middelste is ${d}° groter dan de kleinste. De grootste is 2 keer zo groot als de middelste. Hoe groot is de kleinste hoek?`;
    bars = angleModel([{label:'kleinste', parts:nParts(1,'α',PINK)}, {label:'middelste', parts:[{w:1,txt:'α',col:BLUE},{w:d/ans,txt:d+'°',col:YEL}]}, {label:'grootste', parts:[{w:1,txt:'α',col:BLUE},{w:d/ans,txt:d+'°',col:YEL},{w:1,txt:'α',col:BLUE},{w:d/ans,txt:d+'°',col:YEL}]}], {txt:'samen 90°'}, 220/(4+3*d/ans));
    sol = `α + (α + ${d}°) + 2 · (α + ${d}°) = 4 · α + ${3*d}° = 90°, dus 4 · α = ${90-3*d}° en α = <b>${fmtDeg(ans)}</b>.`; }
  return {txt, ans, sol, bars};
}
const vraagCard = (title, lvl, types, n) => ({ title, lvl, instr:'Lees goed. Maak een schets van de hoeken. Zit je vast? Klik op “Hulp: toon de hoeken”.', build:(b,st,save,key)=>{
    const R = makeR(st); const list = R.shuffle(types).slice(0,n);
    list.forEach((t,i)=>{ const V = vraagstuk2(R, t);
      const res = qBlock(b, st, save, 'v'+i, { tv:[fmtDeg(V.ans)], nr:LET[i]+'.', html:`${V.txt} [[0:md]]`, mode:'text', check:degIs(V.ans, .001), sol:V.sol });
      const hb = el('button','linkbtn','Hulp: toon de hoeken'); hb.type='button'; const host = el('div','bar-model'); host.hidden = true;
      hb.addEventListener('click', ()=>{ host.hidden = !host.hidden; if(!host.hidden) showAngles(host, V.bars); });
      res.row.querySelector('.q-act').append(hb); res.row.insertBefore(host, res.row.querySelector('.fb')); }); }});

/* ============================================================
   NIEUWE INDELING
   ============================================================ */
const TO = OLD;
const CARD = {
  notatie:TO.begrippen[0], leesNot:TO.begrippen[1], schets:TO.begrippen[2], juistFout:TO.begrippen[3],
  symbolen:TO.symbolen[0], colSnij:TO.symbolen[1], colCheck:TO.symbolen[2],
  meet:TO.meten[0], herleid:TO.meten[1], eenheid:TO.meten[2], symbLen:TO.meten[3], schaal:TO.meten[4], vierPunten:TO.meten[5],
  tekenLen:TO.construeren[0], midden:TO.construeren[1], halveer:TO.construeren[2], constrEven:TO.construeren[3], constrSom:TO.construeren[4], constrTri:TO.construeren[5], constrGz:TO.construeren[6], tekenTri:TO.construeren[7], middensOntdek:TO.construeren[8], pqOntdek:TO.construeren[9],
  hoekNot:TO.hoeken[0], soortTegel:TO.hoeken[1], soortGrootte:TO.hoeken[2], klok:TO.hoeken[3], wijzers:TO.hoeken[4],
  schatMeet:TO.hoekmeten[0], tweedeBeen:TO.hoekmeten[1],
  inspOntdek:TO.inspringend[0], inspMeet:TO.inspringend[1], inspTeken:TO.inspringend[2], inspBereken:TO.inspringend[3],
  bisHerken:TO.bissectrice[0], bisTeken:TO.bissectrice[1], bisBereken:TO.bissectrice[2], bisNeven:TO.bissectrice[3], bisDriehoek:TO.bissectrice[4],
  verbOntdek:TO.verbanden[0], verbBenoem:TO.verbanden[1], csTabel:TO.verbanden[2], csVulAan:TO.verbanden[3], verbReden:TO.verbanden[4], verbTeken:TO.verbanden[5], verbWaar:TO.verbanden[6], pizza:TO.verbanden[7]
};
Object.assign(CARD, {
  rekenA: calcCard('Rechte en gestrekte hoeken', 1, ['rechte2','gestrekt2','gestrekt3','loodlijn','rechte3','rechte2'], 6, 'Een rechte hoek is 90°, een gestrekte hoek is 180°. Bereken zonder te meten.'),
  rekenB: calcCard('Volle hoeken en gelijke delen', 1, ['vol3','insp','gelijk','vol4','gelijk','vol3'], 6, 'Een volle hoek is 360°. Hoeken met hetzelfde merkteken zijn even groot.'),
  rekenC: calcCard('Overstaande hoeken en nevenhoeken', 2, ['over'], 4, 'Overstaande hoeken zijn even groot. Nevenhoeken vormen samen 180°.'),
  rekenD: calcCard('Met de bissectrice', 2, ['bis'], 4, 'De bissectrice b deelt de hoek in twee even grote hoeken.'),
  rekenE: calcCard('Alles door elkaar', 2, ['rechte2','gestrekt3','vol3','over','bis','loodlijn','insp','gelijk'], 8),
  rekenF: calcCard('Meerdere hoeken tegelijk', 3, ['keten'], 3, 'Bereken alle aangeduide hoeken. Begin met de hoek die je meteen kan berekenen.'),
  rekenG: calcCard('Rekenen met α', 3, ['alfa'], 4, 'Hier staan stukken als 3 · α (3 keer α). Hoeveel keer α past er in de hele hoek?'),
  vraagHoek: vraagCard('Vraagstukken met hoeken', 2, [0,1,2,3], 4),
  vraagDelen: vraagCard('Hoeken in stukken verdelen', 2, [4,5,4,5], 3),
  vraagMoeilijk: vraagCard('Moeilijkere vraagstukken', 3, [6,7,5,2], 3),
  lenVraag: lpCard('Vraagstukken met lengtes', 2, [0,1,2,3,4,7], 4),
  herleidVraag: lpCard('Vraagstukken met herleidingen', 2, [5,6,2,0,7], 4),
  herleidVraag2: lpCard('Moeilijkere vraagstukken met eenheden', 3, [4,6,3,5], 3),
  klokVraag: clockCard('Vraagstukken met de klok', 2, [0,1,2,3]),
  klokVraag2: clockCard('Moeilijke kloktijden', 3, [4,4,4])
});

const SEC2 = {};
const S = (id, ic, nav, title, cards, extra={}) => SEC2[id] = Object.assign({id, ic, nav, title, cards}, extra);
const keepOf = id => SEC[id] || {};
S('gerei','tools','Je tekengerei','Leer werken met je digitale tekengerei', [NEW.kijk, TO.gerei[0], NEW.missieGeo2, TO.gerei[1], NEW.missieCmp2, TO.gerei[2], NEW.missieRecht, rectCard(false), rectCard(true)], {intro:keepOf('gerei').intro});
S('begrippen','punt','Punt, rechte, …','Punt, rechte, halfrechte en lijnstuk', [CARD.notatie, CARD.leesNot, NEW.voluit, CARD.schets, CARD.juistFout, NEW.tellen, NEW.rechtenPunten], {cheat:keepOf('begrippen').cheat});
S('symbolen','element','∈ ∉ ⊂ ⊄ =','De symbolen ∈, ∉, ⊂, ⊄ en =', [CARD.symbolen, again(CARD.symbolen,'Nog een figuur',2), NEW.zetPunt], {cheat:keepOf('symbolen').cheat});
S('collineair','punt','Collineair en concurrent','Collineaire punten, concurrente rechten en snijpunten', [NEW.snijpunten, CARD.colSnij, CARD.colCheck, NEW.snijVraag], {cheat:keepOf('symbolen').cheat});
S('meten','liniaal','Lijnstukken meten','Lijnstukken meten', [CARD.meet, CARD.symbLen, NEW.vergelijk, NEW.omtrek, CARD.lenVraag, CARD.schaal, CARD.vierPunten], {tip:keepOf('meten').tip});
S('herleiden','liniaal','Herleiden','Lengtes herleiden', [CARD.herleid, CARD.eenheid, again(CARD.herleid,'Nog meer herleiden',2), CARD.herleidVraag, CARD.herleidVraag2], {cheat:keepOf('meten').cheat});
S('tekenen','passer','Lijnstukken tekenen','Lijnstukken tekenen en het midden', [CARD.tekenLen, CARD.midden, CARD.halveer, NEW.vierDelen, CARD.middensOntdek, CARD.pqOntdek], {intro:VERBS});
S('construeren','passer','Construeren','Construeren met de passer', [CARD.constrEven, CARD.constrSom, CARD.constrTri, CARD.constrGz, CARD.tekenTri], {intro:VERBS});
S('hoeken','hoek','Soorten hoeken','Hoeken: notatie en soorten', [CARD.hoekNot, CARD.soortTegel, CARD.soortGrootte, again(CARD.soortTegel,'Nog meer soorten hoeken',2)], {cheat:keepOf('hoeken').cheat});
S('graden','gradenboog','Graden en de klok','Rekenen met graden en de klok', [NEW.graden1, NEW.graden2, CARD.klok, CARD.klokVraag, CARD.wijzers, CARD.klokVraag2], {cheat:keepOf('hoeken').cheat});
S('hoekmeten','gradenboog','Hoeken meten','Hoeken meten', [CARD.schatMeet, NEW.meetReken, NEW.driehoekHoeken, NEW.vierhoekHoeken], {tip:'<b>Meten:</b> nulpunt op het hoekpunt, tekenzijde op één been, aflezen bij het tweede been (op de halve cirkel of langs de schuine zijde). <b>Scherpe hoek</b> → kleinste getal, <b>stompe hoek</b> → grootste getal.'});
S('hoektekenen','hoek','Hoeken tekenen','Hoeken tekenen', [NEW.tekenHoeken, CARD.tweedeBeen, NEW.evenGroot, NEW.somVerschil, NEW.driehoekAOE], {tip:'<b>Tekenen:</b> nulpunt op het hoekpunt, tekenzijde op het been, hulppunt bij de juiste graad (tik net buiten de rand van je geodriehoek of op de gradenboog: het punt komt aan de rand), dan draai je de geodriehoek rond het hoekpunt tot de tekenzijde door het hulppunt gaat en trek je de halfrechte. Zet een boogje.'});
S('inspringend','inspringend','Inspringende hoeken','Inspringende hoeken: twee manieren', [CARD.inspOntdek, CARD.inspMeet, CARD.inspTeken, CARD.inspBereken], {tip:keepOf('inspringend').tip});
S('bissectrice','bissectrice','Bissectrice','De bissectrice van een hoek', [CARD.bisHerken, CARD.bisTeken, again(CARD.bisTeken,'Nog meer bissectrices',2), CARD.bisDriehoek], {tip:keepOf('bissectrice').tip});
S('verbanden','verband','Overstaand en nevenhoeken','Overstaande hoeken, aanliggende hoeken en nevenhoeken', [CARD.verbOntdek, CARD.verbBenoem, CARD.verbTeken, CARD.verbWaar, CARD.bisNeven],
  {cheat:keepOf('verbanden').cheat});
S('berekenen','verband','Hoeken berekenen','Hoeken berekenen zonder te meten', [CARD.rekenA, CARD.rekenB, CARD.rekenC, CARD.verbReden, CARD.rekenD, CARD.bisBereken, CARD.rekenE, CARD.rekenF, CARD.rekenG],
  {tip:'Je mag niet meten! Gebruik wat je weet:<br>• een rechte hoek is 90° (∟), een gestrekte hoek 180°, een volle hoek 360°<br>• overstaande hoeken zijn even groot · nevenhoeken vormen samen 180°<br>• de bissectrice deelt een hoek in twee even grote hoeken · hetzelfde merkteken = even groot'});
S('compsup','verband','Complementair, supplementair','Complementaire en supplementaire hoeken', [NEW.csOntdek, NEW.csHerken, CARD.csTabel, CARD.csVulAan, NEW.csTeken, NEW.csWaar, NEW.csDenk],
  {intro:CS_THEORY, cheat:`<h3>Spiekbriefje</h3><table><tr><td>complementair</td><td>samen 90° · het complement van α is 90° − α</td></tr><tr><td>supplementair</td><td>samen 180° · het supplement van α is 180° − α</td></tr><tr><td>nevenhoeken</td><td>aanliggend én supplementair</td></tr></table>`});
S('vraagstukken','vraag','Vraagstukken','Vraagstukken', [CARD.vraagHoek, CARD.vraagDelen, CARD.lenVraag, CARD.klokVraag, CARD.vraagMoeilijk, CARD.pizza]);
S('fout','fout','Zoek de fout', SEC.fout.title, SEC.fout.cards, {tip:SEC.fout.tip, sepBefore:true});
['toets1','toets2','toets3'].forEach(k=>SEC2[k] = SEC[k]);
Object.keys(SEC).forEach(k=>delete SEC[k]); Object.assign(SEC, SEC2);

/* volgorde van de onderdelen */
const ORDER = ['gerei','begrippen','symbolen','collineair','meten','herleiden','tekenen','construeren','hoeken','graden','hoekmeten','hoektekenen','inspringend','bissectrice','verbanden','berekenen','compsup','vraagstukken','fout','toets1','toets2','toets3'];
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
    renderers[key] = ()=>{ body.innerHTML = ''; clearSel(); const st = load(key); const save = ()=>store(key, st);
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
