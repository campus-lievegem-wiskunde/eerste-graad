/* ============================================================
   HULPFUNCTIES
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const PREFIX = '2a_m4_machten_v1_';
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
    else if(t==='x') W[k].X = vrijVak(sp, v, save, onCh);
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
const isEmptyW = (t, v) => t==='i' ? false : t==='x' ? emptyX(v) : !v || (t==='m' ? !(v.bt||'').trim() : t==='u' ? !(v.t||'').trim() && (v.z || !v.s) : !(v.t||'').trim()) || (v.n!=null && !String(v.n).trim());

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
  if(window.__M4TEST) window.__M4TEST.push({id:qid, check:q.check, html:q.html});
  if(q.hint && !quiz){ hintBox(row, act, q.hint, q.meer, qid); const sig = hintSig(q.hint, q.meer); if(sig){ row.dataset.hsig = sig; row._hint = {steps:q.hint, meer:q.meer}; } }
  act.append(solBtn); row.append(sol);
  const evaluate = () => { try{ return q.check(s.v) || {ok:false}; }catch(e){ console.error(e); return {ok:false}; } };
  function run(silent){
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
    quiz.push({ pts:q.pts||1, grade:()=>!M.empty() && !!evaluate().ok,
      reveal:ok=>{ M.mark(Object.fromEntries(Object.keys(M.W).map(k=>[k, ok]))); if(!ok){ const r = M.empty() ? {} : evaluate(); if(r.msg){ fb.className = 'fb bad'; fb.innerHTML = '❌ ' + r.msg; } if(q.sol) solBtn.hidden = false; } },
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
/* controle: doel is een eentermvorm; fout = [[eentermvorm, boodschap], ...] */
function chkX(v, doel, fout=[]){
  const lines = VX.ok(v) ? v.r.filter(L => !VX.leeg(L.b)) : [];
  const res = lines.map(L => { const val = VX.val(L.b); return val.err ? val : {val, why:VX.waarom(L.b)}; });
  Object.defineProperty(v, '_res', {value:VX.ok(v) ? v.r.map(L => res[lines.indexOf(L)] || null) : [], configurable:true, enumerable:false});
  if(!res.length) return {info:true, msg:'Vul eerst je antwoord in.'};
  const nr = res.length > 1;
  for(let k=0; k<res.length; k++){ const r = res[k]; if(r.err) return {info:true, msg:(nr ? `Regel ${k+1}: ` : '') + r.err}; r.eq = VX.eq(r.val, doel); }
  const fk = res.findIndex(r => !r.eq);
  if(fk >= 0){ const g = fout.find(([w]) => VX.eq(res[fk].val, w)); return {ok:false, msg:(nr ? `Regel ${fk+1} klopt niet. ` : '') + (g ? g[1] : '')}; }
  const last = res[res.length-1];
  if(last.why) return {info:true, msg:`<b>Bijna juist!</b> Dit is een juiste tussenstap. ${last.why} Klik op <b>= (volgende tussenstap)</b> en reken verder op een nieuwe regel.`};
  return {ok:true};
}
/* ---------- tekenen en bewerken ---------- */
const XP_IC = '<i>x</i><sup style="color:var(--orange)">n</sup>';
const HK_IC = '(&#8239;)<sup style="color:var(--orange)">n</sup>';
function vrijVak(sp, v, save, onCh){
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
    balk(); }
  /* de knoppenbalk staat op een vaste plek: onder het antwoord, boven Controleer */
  function balk(){
    if(!bar){ bar = el('div', 'vx-balk'); const q = sp.closest('.m4-q'), act = q && q.querySelector(':scope > .q-act'); if(act) q.insertBefore(bar, act); else sp.after(bar); }
    bar.innerHTML = ''; const tools = el('div', 'vx-tools'); bar.append(tools);
    const knop = (ic, lab, tip, fn, cls='') => { const b = el('button', 'vx-k ' + cls, `<span class="vx-ic">${ic}</span><span class="vx-lab">${lab}</span>`); b.type = 'button'; b.dataset.tip = tip; b.setAttribute('aria-label', tip);
      b.addEventListener('mousedown', e=>e.preventDefault()); b.addEventListener('click', ()=>{ index(); const n = foc && P.has(foc.n) ? foc.n : laatsteA(v.r[v.r.length-1].b); fn(n); }); tools.append(b); return b; };
    knop('<span class="vx-dot">·</span><span class="vx-hok"></span>', 'maal', 'nog een factor erbij (maal)', n => { const a = nieuweFactor(n); ch(); draw(); focus(a); });
    knop(XP_IC, 'macht', 'exponent bij het actieve vakje', n => { if(n.e==null){ n.e = ''; ch(); draw(); focus(n, 'e'); } else { n.e = null; ch(); draw(); focus(n.k==='a' ? n : laatsteA(n.b)); } });
    knop(HK_IC, 'haakjes', 'haakjes met een exponent', n => { const leeg = n.k==='a' && !nrm(n.s||''); const g = haakjes(n); ch(); draw(); if(leeg) focus(n); else focus(g, 'e'); });
    knop(BRK_IC, 'breuk', 'breuk', n => { const a = breuk(n); ch(); draw(); focus(a); }, 'vx-brk');
    undoB = knop('↶', 'terug', 'ongedaan maken', terug, 'vx-terug'); undoB.disabled = hist.length<2;
    if(v.r.length>1) knop('✕', 'regel weg', 'deze regel weghalen', () => { v.r.pop(); ch(); draw(); focus(laatsteA(v.r[v.r.length-1].b)); }, 'vx-weg');
    const plus = el('button', 'btn ghost vx-plus', '= (volgende tussenstap)'); plus.type = 'button'; plus.dataset.tip = 'reken verder op een nieuwe regel';
    plus.addEventListener('click', ()=>{ v.r.push({b:VX.R()}); ch(); draw(); focus(v.r[v.r.length-1].b.f[0]); });
    bar.append(plus, el('div', 'vx-snel', 'Typen kan ook: <kbd>(</kbd> <kbd>)</kbd> haakjes · <kbd>^</kbd> macht · <kbd>/</kbd> breuk · <kbd>*</kbd> maal'));
  }
  function rend(n, actief){
    if(n.k==='row'){ const s = el('span', 'vx-rij'); n.f.forEach((f, i) => { if(i) s.append(el('span', 'vx-maal', '·')); s.append(rend(f, actief)); }); return s; }
    if(n.k==='frac'){ const br = el('span', 'br vx-br'), bt = el('span', 'br-t'), bn = el('span', 'br-n'); bt.append(rend(n.t, actief)); bn.append(rend(n.n, actief)); br.append(bt, bn); return br; }
    const fe = el('span', 'vx-f' + (n.k==='g' ? ' vx-g' : '')); const x = {};
    if(n.k==='a'){ const bi = m4inp('b vx-b', n.s, 'getal of letter'); x.b = bi; fe.append(bi);
      if(actief){ bi.addEventListener('focus', ()=>{ foc = {n, w:'b'}; actiefVak(bi); }); bi.addEventListener('input', ()=>typ(n, bi)); bi.addEventListener('keydown', e=>toets(e, n, bi)); } else bi.readOnly = true; }
    else { const groot = n.b.k==='frac' ? ' groot' : ''; fe.append(el('span', 'vx-par' + groot, '('), rend(n.b, actief), el('span', 'vx-par' + groot, ')')); }
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
    if(x.includes('^')){ n.s = zonder('^'); if(n.e==null) n.e = ''; ch(); draw(); focus(n, 'e'); return; }
    if(x.includes('(')){ const voor = x.split('(')[0];
      if(voor && voor!=='-'){ n.s = voor; const a = nieuweFactor(n); index(); haakjes(a); }
      else { n.s = ''; const g = haakjes(n); if(voor==='-'){ index(); rijVan(g).f.splice(P.get(g).i, 0, VX.A('-')); } }
      ch(); draw(); focus(voor && voor!=='-' ? laatsteA(rijVan(n).f[P.get(n).i + 1]) : n); return; }
    if(x.includes(')')){ n.s = zonder(')'); const g = haakVan(n); if(g){ if(g.e==null) g.e = ''; ch(); draw(); focus(g, 'e'); } else { bi.value = n.s; ch(); } return; }
    if(x.includes('/')){ n.s = zonder('/'); const a = breuk(n); ch(); draw(); focus(a); return; }
    if(/[*·]/.test(x)){ const [a, ...b] = x.split(/[*·]/); n.s = a; const m = nieuweFactor(n); m.s = b.join(''); ch(); draw(); focus(m); return; }
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
  draw();
  return {
    mark(on){ const res = v._res || []; sp.querySelectorAll('.vx-regel').forEach((row, li) => { row.classList.remove('ok', 'bad', 'bijna'); const r = res[li]; if(on==null || !r || r.err || r.eq==null) return;
      row.classList.add(!r.eq ? 'bad' : (li===v.r.length-1 && r.why) ? 'bijna' : 'ok'); }); },
    lock(){ if(bar) bar.remove(); sp.querySelectorAll('.vx-actief').forEach(x => x.classList.remove('vx-actief')); }
  };
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
  .vx-k{border:1.5px solid var(--border); background:var(--card, #fff); color:var(--accent-dark); border-radius:.5rem; min-width:3.1rem; min-height:2.9rem; padding:.2rem .35rem; cursor:pointer; font:inherit; font-weight:700; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:.1rem}
  .vx-ic{font-size:1rem; line-height:1.1; display:inline-flex; align-items:center; min-height:1.15rem}
  .vx-lab{font-size:.68rem; font-weight:600; color:var(--ink-soft); line-height:1}
  .vx-plus{min-height:2.9rem}
  .vx-snel{flex-basis:100%; font-size:.78rem; color:var(--ink-soft)}
  .vx-snel kbd{font:inherit; font-weight:700; border:1px solid var(--border); border-radius:.25rem; padding:0 .3rem; background:var(--zone-bg, #f6fbfb); color:var(--accent-dark)}
  .vx-f .m4-in.vx-actief{border-color:var(--orange); border-width:2.5px; box-shadow:0 0 0 3px var(--or-soft)}
  .vx-k:hover, .vx-k:focus-visible{border-color:var(--accent-dark)}
  .vx-k sup{font-size:.7em}
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
   ONDERDEEL 1 · MACHTEN: HERHALING
   grondtal en exponent, uitschrijven, haakjes en minteken, machten van 10
   ============================================================ */
Object.assign(ICONS, {
  m_herh:'<text x="4" y="18" font-size="14" font-weight="700" fill="currentColor" stroke="none">a</text><text x="13" y="10" font-size="9" font-weight="700" fill="currentColor" stroke="none">n</text>'
});
/* tabel met machten die je vanbuiten kent */
const MACHT_TABEL = (() => { const cel = (b, n) => `<td>${mH(String(b), n)} = ${Math.pow(b, n)}</td>`;
  const rij = arr => `<tr>${arr.join('')}</tr>`;
  const kw = [], i0 = [...Array(15).keys()].map(i => i + 1).concat([20, 25]);
  for(let i=0; i<i0.length; i+=6) kw.push(rij(i0.slice(i, i+6).map(b => cel(b, 2))));
  return `<table class="m4-mtab"><tr><th colspan="6">kwadraten</th></tr>${kw.join('')}<tr><th colspan="6">derdemachten</th></tr>${rij([1, 2, 3, 4, 5, 10].map(b => cel(b, 3)))}<tr><th colspan="6">machten van 2 en 3</th></tr>${rij([[2, 4], [2, 5], [2, 6], [2, 8], [2, 10], [3, 4]].map(([b, n]) => cel(b, n)))}</table>`; })();
const CHEAT_HERH = `<h3>Spiekbriefje · machten</h3><table>
  <tr><td>macht</td><td><div class="m4-line">${mH('a', 'n')} ${isq} <i>a</i> · <i>a</i> · … · <i>a</i></div><i>n</i> factoren <i>a</i>; <i>a</i> is het <b>grondtal</b>, <i>n</i> de <b>exponent</b></td></tr>
  <tr><td>voorbeeld</td><td><div class="m4-line">${mH('2', 5)} ${isq} 2 · 2 · 2 · 2 · 2 ${isq} 32</div></td></tr>
  <tr><td>haakjes</td><td><div class="m4-line">${mH('-3', 2)} ${isq} (−3) · (−3) ${isq} 9</div><div class="m4-line">${minH(mH('3', 2))} ${isq} −(3 · 3) ${isq} −9</div>zonder haakjes hoort het minteken niet bij het grondtal</td></tr>
  <tr><td>machten van 10</td><td><div class="m4-line">${mH('10', 4)} ${isq} 10 000</div>de exponent is het aantal nullen</td></tr></table><h3>Vanbuiten kennen</h3>${MACHT_TABEL}`;
const HR = {};

/* ---------- grondtal en exponent ---------- */
HR.ge = { title:'Grondtal en exponent', lvl:1,
  instr:'Wat is het grondtal en wat is de exponent? Staat het minteken tussen haakjes, dan hoort het bij het grondtal.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${mH('a', 'n')} ${isq} <i>a</i> · <i>a</i> · … · <i>a</i> <span class="txt">(<i>n</i> factoren)</span></div><i>a</i> is het grondtal, <i>n</i> is de exponent.`);
    const R = makeR(st); const g = R.shuffle([2, 3, 4, 5, 6, 7, 9]);
    /* [html, grondtal, exponent] */
    const L = [[mH(g[0], R.int(3, 6)), String(g[0])], [mH(-g[1], R.int(2, 5)), String(-g[1])], [minH(mH(g[2], R.int(2, 4))), String(g[2])],
      [mH('x', R.int(5, 9)), 'x'], [mH('2/3', R.int(2, 4)), '2/3'], [mH(String(g[3]), 1), String(g[3])]];
    L.forEach(x => x.push(+x[0].match(/m4-sup">([^<]+)</)[1].replace(MIN, '-')));
    reeks(b, L.length, (gr, i, nr) => { const [h, bb, e] = L[i];
      mQ(gr, st, save, 'g' + i, { nr, html:`${h} <span class="txt">grondtal:</span> {{b:a}} <span class="txt">exponent:</span> {{g:b}}`,
        check:V=>{ const x = rdB(V.a);
          const rb = !x || x.bad ? {info:true, msg:'Typ het grondtal: een getal, een breuk of een letter.'} : sameB(x, bb) ? {ok:true} :
            (x.kind!=='l' && qEq(qNeg(x.q), B(bb).q)) ? {ok:false, msg: B(bb).neg ? 'Het minteken staat tussen de haakjes: het hoort bij het grondtal.' : 'Er staan geen haakjes: het minteken hoort niet bij het grondtal.'} : {ok:false};
          return allOf([['a', rb], ['b', chkE(V.b, e)]]); },
        sol:`grondtal ${bH(bb)}, exponent ${e}` }); });
  } };

/* ---------- schrijf als een macht ---------- */
HR.alsm = { title:'Schrijf als een macht', lvl:1,
  instr:'Schrijf het product als één macht. Rond een negatief grondtal of een breuk typ je zelf haakjes, bijvoorbeeld <b>(-2)</b>.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['5', R.int(3, 6)], ['-2', R.int(3, 5)], ['a', R.int(4, 7)], ['10', R.int(3, 6)], ['-7', R.int(2, 4)], ['y', R.int(3, 6)], ['3', R.int(3, 5)]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, n] = L[i]; const f = Array(n).fill(bH(bb)).join(' · ');
      mQ(g, st, save, 'a' + i, { nr, html:`${f} ${isq} {{m:a}}`, check:V=>chkM(V.a, {b:bb, e:n, keep:false}),
        hint:['Tel het aantal gelijke factoren: dat is de exponent. De factor zelf is het grondtal.', 'Is het grondtal negatief of een breuk? Typ er dan haakjes rond.'],
        sol:`${f} ${isq} ${mH(bb, n)}` }); });
  } };

/* ---------- schrijf uit en reken uit ---------- */
HR.uit = { title:'Schrijf uit en reken uit', lvl:1,
  instr:'Reken de macht uit. Bij een negatief grondtal kies je eerst het teken in het tekenvak.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['2', R.int(4, 7)], ['3', R.int(3, 4)], ['-2', R.int(3, 6)], ['-3', R.int(2, 3)], ['5', 3], ['-1', R.int(5, 9)], ['-10', R.int(2, 4)], ['4', 3]]).slice(0, 6);
    stapUitleg(b, [[`${mH('-2', 3)}`, 'Het grondtal is −2, de exponent is 3.'], [`${isq} (−2) · (−2) · (−2)`, 'Schrijf uit: 3 factoren −2.'], [`${isq} −8`, 'Drie mintekens: er blijft er één over, dus negatief. 2 · 2 · 2 = 8.']], {kop:'Voorbeeld'});
    reeks(b, L.length, (g, i, nr) => { const [bb, n] = L[i]; const T = powQ(bb, n); const f = Array(n).fill(bH(bb)).join(' · ');
      mQ(g, st, save, 'u' + i, { nr, html:`${mH(bb, n)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T, [[Q(bVal(bb).n*n), 'Je vermenigvuldigde het grondtal met de exponent. Schrijf de macht uit als een product.']]),
        hint:[{u:'Schrijf de macht uit als een product en reken uit.', line:`${f} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), show:`${f} ${isq} ${qH(T)}`}],
        sol:`${mH(bb, n)} ${isq} ${f} ${isq} ${qH(T)}` }); });
  } };

/* ---------- haakjes of geen haakjes ---------- */
HR.haak = { title:'Haakjes of geen haakjes?', lvl:2,
  instr:'Reken uit. Kijk eerst waar het minteken bij hoort: bij het grondtal (tussen haakjes) of vóór de macht.',
  build(b, st, save){
    const R = makeR(st); const a = R.pick([2, 3, 4, 5]), c = R.pick([2, 3]), d = R.pick([1, 10]);
    const L = [[mH(-a, 2), Q(a*a)], [minH(mH(a, 2)), Q(-a*a)], [mH(-c, 3), Q(-c*c*c)], [minH(mH(c, 3)), Q(-c*c*c)], [minH(mH(-d, 4)), Q(-Math.pow(d, 4))], [minH(mH(-c, 3)), Q(c*c*c)]];
    const tbl = `<table class="m4-tabel"><tr><th>met haakjes</th><th>zonder haakjes</th></tr><tr><td>${mH('-3', 2)} ${isq} (−3) · (−3) ${isq} 9</td><td>${minH(mH('3', 2))} ${isq} −(3 · 3) ${isq} −9</td></tr></table>`;
    regelTop(b, tbl + 'Zonder haakjes reken je eerst de macht uit en zet je het minteken ervoor.');
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i];
      mQ(g, st, save, 'h' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), sol:`${h} ${isq} ${qH(T)}` }); });
  } };

/* ---------- machten van 10 ---------- */
HR.tien = { title:'Machten van 10', lvl:2, brk:false,
  instr:'Bij een macht van 10 is de exponent het aantal nullen.',
  build(b, st, save){
    const R = makeR(st); const n = R.shuffle([2, 3, 4, 5, 6, 7, 8, 9]);
    const it = reeks(b, 6, (g, i, nr) => {
      if(i<3){ const T = Q(Math.pow(10, n[i])); mQ(g, st, save, 't' + i, { nr, html:`${mH('10', n[i])} ${isq} {{u:a}}`, check:V=>chkU(V.a, T, [[Q(10*n[i]), 'Een macht is geen vermenigvuldiging met de exponent: schrijf 1 met ' + n[i] + ' nullen.']]), sol:`${mH('10', n[i])} ${isq} ${dz(Math.pow(10, n[i]))}` }); }
      else { const k = n[i]; mQ(g, st, save, 't' + i, { nr, html:`${dz(Math.pow(10, k))} ${isq} ${mE('10', 'a')}`, check:V=>chkE(V.a, k, [[k+1, 'Tel enkel de nullen.']]), sol:`${dz(Math.pow(10, k))} ${isq} ${mH('10', k)}` }); }
    });
  } };

/* ---------- breuk als grondtal ---------- */
HR.breuk = { title:'Een breuk als grondtal', lvl:2,
  instr:'Staat de breuk tussen haakjes, dan neem je zowel de teller als de noemer tot de macht. Zonder haakjes hoort de exponent enkel bij de noemer (of de teller).',
  build(b, st, save){
    const R = makeR(st); const [p, q] = R.pick([[2, 3], [3, 4], [2, 5], [3, 5], [1, 4]]); const [r, s] = R.pick([[1, 2], [2, 3], [3, 2]]);
    const L = [[mH(`${p}/${q}`, 2), qPow(Q(p, q), 2)], [brH(p, mH(q, 2)), Q(p, q*q)], [mH(`-${r}/${s}`, 3), qPow(Q(-r, s), 3)], [mH(`-${r}/${s}`, 2), qPow(Q(-r, s), 2)],
      [brH(mH(p, 3), q), Q(p*p*p, q)], [minH(mH(`${r}/${s}`, 2)), qNeg(qPow(Q(r, s), 2))]];
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i];
      mQ(g, st, save, 'b' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), sol:`${h} ${isq} ${qH(T)}` }); });
  } };

/* ---------- uit het hoofd ---------- */
HR.hoofd = { title:'Kwadraten en derdemachten uit het hoofd', lvl:2, brk:false,
  instr:'Deze machten ken je best vanbuiten. Reken ze uit zonder rekenmachine.',
  build(b, st, save){
    const wrap = el('div', 'm4-hoe'); b.append(wrap);
    const open = el('button', 'btn ghost', '▶ Spiekbriefje'); open.type = 'button'; const box = el('div', 'sa m4-sa', MACHT_TABEL); box.hidden = true; wrap.append(open, box);
    open.addEventListener('click', ()=>{ box.hidden = !box.hidden; open.textContent = (box.hidden ? '▶ Spiekbriefje' : '■ Verberg het spiekbriefje'); });
    const R = makeR(st);
    const L = R.shuffle([[11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [20, 2], [25, 2], [2, 3], [3, 3], [4, 3], [5, 3], [10, 3], [2, 10], [3, 4]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, n] = L[i]; const T = Q(Math.pow(bb, n));
      mQ(g, st, save, 'k' + i, { nr, html:`${mH(bb, n)} ${isq} {{u:a}}`, check:V=>chkU(V.a, T, [[Q(bb*n), 'Een macht is een herhaalde vermenigvuldiging, niet grondtal maal exponent.']]), sol:`${mH(bb, n)} ${isq} ${T.n}` }); });
  } };

/* ---------- verdieping: machten van 0,1 ---------- */
HR.nul1 = { title:'Machten van 0,1', lvl:3,
  instr:'Reken uit. Je mag je antwoord als kommagetal of als breuk schrijven.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['0,1', 2], ['0,1', 3], ['0,1', 5], ['0,2', 2], ['0,3', 3], ['0,5', 2], ['-0,1', 3], ['-0,2', 4]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, n] = L[i]; const T = powQ(bb, n);
      mQ(g, st, save, 'n' + i, { nr, html:`${mH(bb, n)} ${isq} {{u:a,t}}`, check:V=>chkUD(V.a, T, [[qMul(bVal(bb), Q(n)), 'Je vermenigvuldigde met de exponent.']]), sol:`${mH(bb, n)} ${isq} ${qKomma(T)}` }); });
  } };

/* ---------- verdieping: getalwaarde ---------- */
HR.waarde = { title:'Getalwaarde berekenen', lvl:3,
  instr:'Vul de gegeven waarden in en reken uit. Let op het minteken en de haakjes.',
  build(b, st, save){
    const R = makeR(st); const a = -R.int(2, 4), c = R.int(2, 3);
    b.append(el('p', 'm4-line', `<span class="txt">Neem</span> <i>a</i> ${isq} ${sg(a)} <span class="txt">en</span> <i>b</i> ${isq} ${c}.`));
    const L = [[`${mH('a', 2)}`, Q(a*a)], [minH(mH('a', 2)), Q(-a*a)], [mH('a', 3), Q(a*a*a)], [`${mH('a', 2)} · <i>b</i>`, Q(a*a*c)], [`${mH('b', 3)} ${MIN} ${mH('a', 2)}`, Q(c*c*c - a*a)], [`${par(minH('<i>a</i>'))}<sup class="m4-sup">3</sup>`, Q(-a*a*a)]];
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i];
      mQ(g, st, save, 'w' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), sol:`${h} ${isq} ${qH(T)}` }); });
  } };

SEC.herh = { id:'herh', ic:'m_herh', nav:'Machten: herhaling', title:'Machten: herhaling',
  tip:'Een macht is een korte schrijfwijze voor een product van gelijke factoren. Haakjes rond een negatief grondtal typ je zelf: <b>(-2)</b>.',
  cheat:CHEAT_HERH, cards:[HR.ge, HR.alsm, HR.uit, HR.haak, HR.tien, HR.breuk, HR.hoofd, HR.nul1, HR.waarde] };

(function(){ const s = document.createElement('style'); s.textContent = `.m4-mtab{border-collapse:collapse; margin:.2rem 0; font-size:1.05rem} .m4-mtab td{padding:.25rem .7rem; white-space:nowrap; border-bottom:1px solid var(--accent-soft)} .m4-mtab th{text-align:left; padding:.5rem .7rem .2rem; color:var(--accent-dark); font-size:.9rem}`; document.head.append(s); })();

/* ============================================================
   ONDERDELEN: ICONEN EN SPIEKBRIEFJES
   ============================================================ */
Object.assign(ICONS, {
  m_neg:'<text x="3" y="18" font-size="13" font-weight="700" fill="currentColor" stroke="none">a</text><text x="11" y="11" font-size="9" font-weight="700" fill="currentColor" stroke="none">−n</text>',
  m_verm:'<text x="1.5" y="18" font-size="11" font-weight="700" fill="currentColor" stroke="none">a·a</text><text x="17" y="9" font-size="7.5" font-weight="700" fill="currentColor" stroke="none">m</text>'
});
/* waarom a^0 = 1: machtentrap van 2 met telkens : 2 per trede naar beneden */
const NUL_SVG = (() => { const W = 470, H = 196, sw = 86, dy = 24, x0 = 12, y0 = 52, bot = 192; let o = '';
  const T = [[3, '8'], [2, '4'], [1, '2'], [0, '1'], [-1, '½']];
  T.forEach(([e, v], i) => { const x = x0 + i*(sw + 4), y = y0 + i*dy; const nul = e===0;
    o += `<rect x="${x}" y="${y}" width="${sw}" height="${bot - y}" rx="6" style="fill:${nul ? 'var(--or-soft)' : 'var(--accent-soft)'};stroke:${nul ? 'var(--orange)' : 'var(--tq)'};stroke-width:${nul ? 3 : 2}"/>`;
    o += `<text class="t big" x="${x + sw/2}" y="${y + 24}" text-anchor="middle" dominant-baseline="central">2<tspan class="sup" dy="-9">${sg(e)}</tspan><tspan dy="9"> = ${v}</tspan></text>`;
    if(i){ const xa = x0 + (i-1)*(sw + 4) + sw/2 + 16, xb = x + sw/2 - 16, ya = y0 + (i-1)*dy - 8;
      o += `<path class="pijl" d="M${xa} ${ya} Q${(xa + xb)/2} ${ya - 30} ${xb} ${y - 8}"/><text class="t" x="${(xa + xb)/2}" y="${ya - 26}" text-anchor="middle" style="fill:var(--accent-dark);font-weight:700">: 2</text>`; } });
  return svgWrap(W, H, o, {alt:'machtentrap: 2 tot de derde is 8, dan telkens delen door 2: 4, 2, 1, een half', maxw:470}); })();
const NUL_UITLEG = `<div class="m4-line">${mH('a', 0)} ${isq} 1 &nbsp; en &nbsp; ${mH('a', 1)} ${isq} <i>a</i> &nbsp;<span class="txt">(a ≠ 0)</span></div>
  ${NUL_SVG}
  <div>Eén trede lager: de exponent wordt 1 kleiner en je deelt door het grondtal. Van ${mH('2', 1)} = 2 naar ${mH('2', 0)}: 2 : 2 = <b>1</b>.</div>
  <div class="m4-line">${mH('a', 3)} : ${mH('a', 3)} ${isq} <span class="m4-m"><i>a</i><sup class="m4-sup">3−3</sup></span> ${isq} ${mH('a', 0)} &nbsp; en ook &nbsp; ${brH('<i>a</i> · <i>a</i> · <i>a</i>', '<i>a</i> · <i>a</i> · <i>a</i>')} ${isq} 1</div>`;
const CHEAT_NEG = `<h3>Spiekbriefje · negatieve exponent en exponent 0</h3><table>
  <tr><td>negatieve exponent</td><td><div class="m4-line">${mH('a', '-n')} ${isq} ${brH('1', mH('a', 'n'))}</div>omgekeerde nemen en de exponent positief maken</td></tr>
  <tr><td>exponent 0 en 1</td><td>${NUL_UITLEG}</td></tr>
  <tr><td>haakjes</td><td><div class="m4-line">${mH('-3', 2)} ${isq} 9 &nbsp; maar &nbsp; ${minH(mH('3', 2))} ${isq} ${MIN}9</div>zonder haakjes hoort het minteken niet bij het grondtal</td></tr>
  <tr><td>teken</td><td>negatief grondtal: even exponent geeft een positief getal, oneven exponent een negatief getal</td></tr></table>`;

/* typische fouten bij een macht met een negatieve exponent */
function negFout(b, e){ const g = bVal(b), T = qPow(g, e), P = qPow(g, -e); const f = [];
  if(e<0){ if(!qEq(qNeg(P), T)) f.push([qNeg(P), `Een negatieve exponent maakt het getal niet negatief. Neem het omgekeerde: ${mH(b, e)} ${isq} ${brH('1', mH(b, -e))}.`]);
    if(!qEq(P, T)) f.push([P, `Je vergat het omgekeerde te nemen: ${mH(b, e)} ${isq} ${brH('1', mH(b, -e))}.`]);
    if(g.d===1) f.push([Q(g.n*e), `Je vermenigvuldigde het grondtal met de exponent. Een macht is een herhaalde vermenigvuldiging.`]);
    if(!qEq(qNeg(T), T)) f.push([qNeg(T), 'Kijk nog eens naar het teken.']); }
  return f; }
const powQ = (b, e) => qPow(bVal(b), e);

/* ---------- de machtentrap ---------- */
function trapSvg(g, EX, cur, pop){
  const W = 450, H = 272, w = 58, x0 = 20;
  let s = '<defs><marker id="m4pijl" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path class="pijlk" d="M0 0L8 4L0 8z"/></marker></defs>';
  EX.forEach((e, i) => { const x = x0 + i*w, y = 34 + i*28;
    s += `<rect class="trede${i===cur ? ' nu' : i<cur ? ' af' : ''}" x="${x}" y="${y}" width="${w}" height="${H-8-y}" rx="3"/>`;
    s += `<text class="t${i>cur ? ' muted' : ''}" x="${x+w/2}" y="${y+15}" text-anchor="middle" dominant-baseline="central">${sPow(g, e)}</text>`;
    if(i<cur) s += `<g class="${i===pop ? 'pop' : ''}">${sQ(x+w/2, y+47, qPow(Q(g), e))}</g>`;
    else if(i===cur) s += sT(x+w/2, y+47, '?', 'big');
    if(i<cur && i<EX.length-1){ const x1 = x + w*.62, x2 = x + w*1.38, ya = y - 2, yb = y + 26;
      s += `<path class="pijl" d="M${x1} ${ya} Q${x+w} ${ya-22} ${x2} ${yb}"/>` + sT(x+w, ya-17, '÷ ' + g, 'op'); }
  });
  s += sT(W-8, 16, 'exponent 1 kleiner: ÷ ' + g, 'k', 'end');
  return svgWrap(W, H, s, {alt:`machtentrap met grondtal ${g}`});
}
const NG = {};
NG.trap = { title:'De machtentrap', lvl:1, keep:true,
  instr:'Daal de trap af. Eén trede lager wordt de exponent 1 kleiner en deel je door het grondtal. Vul telkens de waarde in.',
  build(b, st, save){
    const R = makeR(st); const g = R.pick([2, 3, 5, 10]); const EX = [3, 2, 1, 0, -1, -2, -3];
    if(st.i==null) st.i = 1;
    const wrap = el('div', 'm4-naast breed-l'); b.append(wrap);
    const vis = el('div', 'm4-vis'), rt = el('div'); wrap.append(vis, rt);
    let pop = -1; const fig = () => { vis.innerHTML = trapSvg(g, EX, st.i, pop); };
    function vraag(){ rt.innerHTML = ''; fig();
      if(st.i < EX.length){
        const e = EX[st.i], T = qPow(Q(g), e), prev = qPow(Q(g), EX[st.i-1]);
        rt.append(el('p', '', `<b>Trede ${st.i+1}</b>: de exponent is nu <b>${sg(e)}</b>. Deel de waarde van de vorige trede door ${g}.`));
        mQ(rt, st, save, 'tr' + st.i, { html:`${mH(g, e)} ${isq} {{u:a}}`,
          check:V=>chkU(V.a, T, [[Q(g*e), `Je vermenigvuldigde ${g} met ${sg(e)}. Deel de vorige waarde door ${g}.`], [qNeg(qPow(Q(g), -e)), 'Een negatieve exponent maakt het getal niet negatief. Deel de vorige waarde door ' + g + '.'], [Q(0), `Delen door ${g} geeft nooit 0.`]]),
          hint:[{u:`Deel de vorige waarde door ${g}.`, line:`${qH(prev)} : ${g} ${isq} {{u:a}}`, check:V=>chkU(V.a, T), show:`${qH(prev)} : ${g} ${isq} ${qH(T)}`}],
          meer: prev.d===1 && prev.n>1 ? '' : `Een breuk delen door ${g}: de teller blijft, de noemer wordt ${g} keer zo groot. Bijvoorbeeld <span class="m4-line" style="display:inline-flex">${brH(1, g)} : ${g} ${isq} ${brH(1, g*g)}</span>`,
          onOk:silent=>{ if(silent) return; pop = st.i; st.i++; save(); setTimeout(vraag, 650); } });
        const f = rt.querySelector('.m4-teken button'); if(f && pop>=0) f.focus();
      } else {
        rt.append(el('p', '', '✅ Je bent onderaan de trap.'));
        qChoice(rt, st, save, 'vgl', { html:`Vergelijk ${mH(g, -3)} ${isq} ${qH(qPow(Q(g), -3))} met ${mH(g, 3)} ${isq} ${g*g*g}. Wat is ${mH(g, -3)}?`,
          opts:[['om', `het omgekeerde van ${mH(g, 3)}`], ['te', `het tegengestelde van ${mH(g, 3)}`], ['he', `de helft van ${mH(g, 3)}`]], ans:'om',
          why:'Een macht met een negatieve exponent is het omgekeerde van de macht met de positieve exponent.',
          whyBad:`Het tegengestelde van ${g*g*g} is ${MIN}${g*g*g}. Kijk naar de trap: ${qH(qPow(Q(g), -3))} is 1 gedeeld door ${g*g*g}.`,
          after:ok=>{ if(ok && !rt.querySelector('.m4-regel')) regel(); } });
      }
    }
    function regel(){ rt.append(el('div', 'm4-regel nieuw', `<b>Rekenregels</b><div class="m4-line">${mH('a', '-n')} ${isq} ${brH('1', mH('a', 'n'))}</div><div class="m4-line">${mH('a', 0)} ${isq} 1 <span class="txt">(a ≠ 0)</span></div>`));
      const e = -R.int(4, 5); mQ(rt, st, save, 'zonder', { html:`<span class="txt">Nu zonder trap:</span> ${mH(g, e)} ${isq} {{u:a}}`, check:V=>chkU(V.a, qPow(Q(g), e), negFout(String(g), e)), sol:`${mH(g, e)} ${isq} ${brH('1', mH(g, -e))} ${isq} ${qH(qPow(Q(g), e))}` }); }
    vraag();
  } };

/* ---------- een groeiende schimmel: schuifknop in de tijd ---------- */
NG.schimmel = { title:'Een groeiende schimmel', lvl:2,
  instr:'Om 12 uur is een schimmel op een voedingsbodem 1 cm² groot. Elk uur wordt de oppervlakte een aantal keer groter. Schuif eerst naar 13 u en 14 u en kijk hoe de schimmel groeit. Reken dan terug naar vroeger.',
  build(b, st, save){
    const R = makeR(st); const f = R.pick([2, 3, 4]); if(!st.ok) st.ok = {};
    const wrap = el('div', 'm4-naast'); b.append(wrap);
    const vis = el('div', 'm4-vis'), rt = el('div'); wrap.append(vis, rt);
    const A = h => qPow(Q(f), h-12), Amax = Math.pow(f, 2);
    const rad = h => { const a = A(h); return Math.max(3, 86*Math.sqrt(a.n/a.d/Amax)); };
    const svgBox = el('div'); const tijd = el('div', 'm4-tijd'); const sl = el('input', 'm4-schuif'); sl.type = 'range'; sl.min = 9; sl.max = 14; sl.step = 1; sl.value = st.t || 12; sl.setAttribute('aria-label', 'tijdstip');
    vis.append(svgBox, sl, tijd);
    let rNow = rad(+sl.value);
    const teken = (h, r) => { let s = `<circle class="schaal" cx="150" cy="104" r="98"/><circle class="agar" cx="150" cy="104" r="92"/>`;
      s += `<circle class="kol" cx="150" cy="104" r="${fx(r)}"/>`;
      [45, 135, 225, 270, 315].forEach((a, i) => { const rr = r*.2, d = r*.86; if(r<14) return; s += `<circle class="kol" cx="${fx(150+d*Math.cos(a*D2R))}" cy="${fx(104+d*Math.sin(a*D2R))}" r="${fx(rr*(.8+.1*i))}"/>`; });
      s += lab(h, r);
      s += `<line class="as" x1="25" y1="222" x2="275" y2="222"/>`;
      for(let k=9; k<=14; k++){ const x = 25 + (k-9)*50; s += `<line class="tik" x1="${x}" y1="216" x2="${x}" y2="228"/>` + (k===h ? `<circle class="tiknu" cx="${x}" cy="222" r="6"/>` : '') + sT(x, 241, k + ' u', 'k');
        if(k<14) s += sT(x+25, 210, '×' + f, 'op'); }
      svgBox.innerHTML = svgWrap(300, 250, s, {alt:'schimmel op een voedingsbodem', maxw:340}); };
    /* de oppervlakte staat in de schimmel zelf: macht = getal cm², een breuk onder elkaar */
    const lab = (h, r) => { const cx = 150, cy = r<55 ? 104 + r + 26 : 104; /* past het niet in een kleine schimmel, dan net eronder */
      if(h<12 && !st.ok[h]) return `<text class="lab" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central">? cm²</text>`;
      const a = A(h), L = `<text class="lab" x="${cx-8}" y="${cy}" text-anchor="end" dominant-baseline="central">${sPow(f, h-12)}</text>` + `<text class="lab" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central">=</text>`;
      if(a.d===1) return L + `<text class="lab" x="${cx+9}" y="${cy}" dominant-baseline="central">${a.n} cm²</text>`;
      const w = 10*Math.max(String(a.n).length, String(a.d).length) + 6, xm = cx+9+w/2;
      return L + `<text class="lab" x="${fx(xm)}" y="${cy-12}" text-anchor="middle" dominant-baseline="central">${a.n}</text><line class="labl" x1="${cx+9}" y1="${cy}" x2="${fx(cx+9+w)}" y2="${cy}"/><text class="lab" x="${fx(xm)}" y="${cy+12}" text-anchor="middle" dominant-baseline="central">${a.d}</text><text class="lab" x="${fx(cx+14+w)}" y="${cy}" dominant-baseline="central">cm²</text>`; };
    const info = h => { tijd.innerHTML = `<span>om ${h} uur</span><span class="k">${h===12 ? 'begin' : h>12 ? (h-12) + ' uur later' : (12-h) + ' uur vroeger' + (st.ok[h] ? '' : ' · reken het uit hiernaast')}</span>`; };
    const zet = (h, anim) => { st.t = h; save(); const r1 = rad(h), r0 = rNow; rNow = r1; info(h);
      if(anim && !REDUCED_M) tween(420, t => teken(h, lerp(r0, r1, t))); else teken(h, r1); };
    sl.addEventListener('input', ()=>zet(+sl.value, true));
    zet(+sl.value, false);
    rt.append(el('p', '', `Om 12 uur is de oppervlakte 1 cm². Elk uur wordt ze <b>× ${f}</b>. Hoe groot is de schimmel vroeger dan 12 uur? Schrijf de oppervlakte als een macht van ${f} en als een getal (een breuk mag).`));
    const g = el('div', 'm4-items een'); rt.append(g);
    [11, 10, 9].forEach((h, i) => { /* 12 u staat al in de figuur */ const e = h-12, T = A(h);
      mQ(g, st, save, 'h' + h, { nr:'abcd'[i] + ')', html:`<span class="txt">om ${h} u:</span> ${mE(f, 'a')} ${isq} {{u:b}} <span class="txt">cm²</span>`,
        check:V=>allOf([['a', chkE(V.a, e, [[12-h, 'Vóór 12 uur is de exponent negatief.'], [h, 'De exponent is het aantal uren na 12 uur.']])], ['b', chkU(V.b, T, negFout(String(f), e))]]),
        hint: e===0 ? [['Om 12 uur is er nog geen uur voorbij. Hoeveel keer werd er al met ' + f + ' vermenigvuldigd?'], ['Elke macht met exponent 0 is 1.', `${mH(f, 0)} ${isq} 1`]] :
          [{u:'Hoeveel uur na 12 uur is dat? Vroeger dan 12 uur geeft een negatief getal.', line:`${h} ${MIN} 12 ${isq} {{g:a}}`, check:V=>chkE(V.a, e), show:`${h} ${MIN} 12 ${isq} ${sg(e)}`},
           {u:'Een negatieve exponent: neem het omgekeerde.', line:`${mH(f, e)} ${isq} ${brH('1', mH(f, -e))} ${isq} {{u:a}}`, check:V=>chkU(V.a, T), show:`${mH(f, e)} ${isq} ${brH('1', mH(f, -e))} ${isq} ${qH(T)}`}],
        meer:`Een uur terug in de tijd betekent ÷ ${f}. Van 12 u naar ${h} u ga je ${12-h} ${12-h===1 ? 'uur' : 'uren'} terug: ${Array(Math.max(1, 12-h)).fill('÷ ' + f).join(' ')}.`,
        onOk:()=>{ st.ok[h] = true; save(); if(+sl.value===h){ info(h); teken(h, rNow); } } }); });
  } };

/* ---------- schrijf met een positieve exponent ---------- */
NG.pos = { title:'Schrijf met een positieve exponent', lvl:1,
  instr:'Schrijf als een breuk met een positieve exponent. Rond een negatief grondtal typ je zelf haakjes, bijvoorbeeld <b>(-2)</b>.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${mH('a', '-n')} ${isq} ${brH('1', mH('a', 'n'))}</div>Een negatieve exponent: neem het omgekeerde en maak de exponent positief.`);
    const R = makeR(st);
    const bases = R.shuffle(['2', '3', '5', '7', '10', '-3', '-2', 'a', 'x', 'b', 'y']);
    const lijst = [];
    for(let i=0; i<5; i++) lijst.push({g:bases[i], n:R.int(2, 6)});
    lijst.push({g:R.pick(['x', 'a', '6']), n:1});
    reeks(b, lijst.length, (g, i, nr) => { const it = lijst[i];
      mQ(g, st, save, 'p' + i, { nr, html:`${mH(it.g, -it.n)} ${isq} ${brH('1', '{{m:a}}')}`,
        check:V=>chkM(V.a, {b:it.g, e:it.n, fout:[[-it.n, 'In de noemer staat de exponent positief.']]}),
        hint:[['Neem het omgekeerde en maak de exponent positief.', `${mH('a', '-n')} ${isq} ${brH('1', mH('a', 'n'))}`]].concat([['Is het grondtal negatief? Typ er dan haakjes rond, bijvoorbeeld (-2).']]),
        sol:`${mH(it.g, -it.n)} ${isq} ${brH('1', mH(it.g, it.n))}` });
    });
  } };

/* ---------- omgekeerd: een breuk als één macht ---------- */
NG.een = { title:'Schrijf als één macht met een negatieve exponent', lvl:1,
  instr:'Schrijf de breuk als één macht. Typ de exponent in het oranje vakje.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${brH('1', mH('a', 'n'))} ${isq} ${mH('a', '-n')}</div>Eén gedeeld door een macht: breng de macht naar boven en maak de exponent tegengesteld.`);
    const R = makeR(st);
    const bases = R.shuffle(['2', '3', '5', '7', '10', '-3', '-2', 'a', 'x', 'b', 'y']);
    const lijst = [];
    for(let i=0; i<5; i++) lijst.push({g:bases[i], n:R.int(2, 7)});
    lijst.push({g:R.pick(['x', 'a', '6']), n:1});
    reeks(b, lijst.length, (g, i, nr) => { const it = lijst[i];
      mQ(g, st, save, 'q' + i, { nr, html:`${brH('1', it.n===1 ? bH(it.g) : mH(it.g, it.n))} ${isq} ${mE(it.g, 'a')}`,
        check:V=>chkE(V.a, -it.n, [[it.n, 'Een macht in de noemer krijgt een negatieve exponent als je ze naar boven brengt.']]),
        hint:[['Eén gedeeld door een macht: de exponent wordt tegengesteld.', `${brH('1', mH('a', 'n'))} ${isq} ${mH('a', '-n')}`]].concat([[`Staat er geen exponent? Dan is de exponent 1: <i>a</i> ${isq} ${mH('a', 1)}.`]]),
        sol:`${brH('1', it.n===1 ? bH(it.g) : mH(it.g, it.n))} ${isq} ${mH(it.g, -it.n)}` });
    });
  } };

/* ---------- reken uit ---------- */
function negPool(R){
  const t = [
    () => { const g = R.pick([2, 3, 4, 5]); const n = g===2 ? R.int(3, 6) : g===3 ? R.int(2, 4) : R.int(2, 3); return [String(g), -n]; },
    () => R.pick([['-3', -2], ['-2', -4], ['-5', -2], ['-4', -2], ['-6', -2]]),
    () => R.pick([['-2', -3], ['-2', -5], ['-3', -3], ['-4', -3], ['-5', -1]]),
    () => ['10', -R.int(2, 5)],
    () => [String(R.pick([4, 6, 7, 8, 9])), -1],
    () => ['-1', -R.pick([3, 5, 7, 9])]
  ];
  return R.shuffle(t.map(f=>f()));
}
const negSteps = (b, e) => { const T = powQ(b, e), P = powQ(b, -e);
  return [{u:'Neem het omgekeerde en maak de exponent positief.', line:`${mH(b, e)} ${isq} ${brH('1', '{{m:a}}')}`, check:V=>chkM(V.a, {b, e:-e}), show:`${mH(b, e)} ${isq} ${brH('1', mH(b, -e))}`},
    {u:'Reken de macht in de noemer uit. Let op het teken.', line:`${mH(b, -e)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, P), show:`${mH(b, -e)} ${isq} ${qH(P)}`},
    [`Schrijf 1 gedeeld door ${qH(P)} als een breuk.${P.n<0 ? ' Een negatieve noemer: het minteken zet je in het tekenvak.' : ''}`, `${brH('1', qH(P))} ${isq} ${qH(T)}`]]; };
NG.reken = { title:'Reken uit', lvl:2,
  instr:'Reken de macht uit. Kies eerst het teken in het tekenvak (+ boven, − onder) en typ dan het getal. Wil je een breuk, klik dan op het breukicoontje naast het vak.',
  build(b, st, save){
    stapUitleg(b, [[mH('-2', -3), 'Een negatieve exponent.'], [`${isq} ${brH('1', mH('-2', 3))}`, 'Neem het omgekeerde en maak de exponent positief.'],
      [`${isq} ${brH('1', MIN + '8')}`, `${mH('-2', 3)} = (−2) · (−2) · (−2) = −8: drie mintekens, dus negatief.`], [`${isq} ${qH(Q(-1, 8))}`, 'Het minteken zet je voor de breuk.']], {kop:'Voorbeeld'});
    const R = makeR(st); const pool = negPool(R);
    reeks(b, 6, (g, i, nr) => { const [bb, e] = pool[i]; const T = powQ(bb, e);
      mQ(g, st, save, 'r' + i, { nr, html:`${mH(bb, e)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T, negFout(bb, e)), hint:negSteps(bb, e),
        sol:`${mH(bb, e)} ${isq} ${brH('1', mH(bb, -e))} ${isq} ${brH('1', qH(powQ(bb, -e)))} ${isq} ${qH(T)}` }); });
  } };

/* ---------- exponent 0 en 1 ---------- */
NG.nul = { title:'Exponent 0 en exponent 1', lvl:1,
  instr:'Reken uit. Kijk goed of het minteken bij het grondtal hoort.',
  build(b, st, save){
    b.append(el('div', 'm4-regel', NUL_UITLEG));
    const R = makeR(st); const gs = R.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13]);
    const [p, q] = R.pick([[2, 3], [3, 4], [2, 5], [4, 7], [5, 8]]);
    const L = [
      [mH(gs[0], 0), Q(1)], [mH(-gs[1], 0), Q(1)], [minH(mH(gs[2], 0)), Q(-1), 'Het minteken staat niet bij het grondtal: eerst de macht, dan het minteken.'],
      [mH(gs[3], 1), Q(gs[3])], [mH(-gs[4], 1), Q(-gs[4])], R.f()<.5 ? [mH(`${p}/${q}`, 0), Q(1)] : [mH(`-${p}/${q}`, 1), Q(-p, q)]];
    reeks(b, L.length, (g, i, nr) => { const [h, T, m] = L[i];
      mQ(g, st, save, 'n' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T, [[Q(0), 'Een macht met exponent 0 is niet 0, maar 1.'], ...(m ? [[Q(1), m]] : [])]) }); });
  } };

/* ---------- vul de exponent in ---------- */
NG.exp = { title:'Vul de exponent in', lvl:2,
  instr:'Welke exponent hoort in het oranje vakje?',
  build(b, st, save){
    const R = makeR(st);
    const g2 = R.pick([2, 3]), n2 = g2===2 ? R.int(3, 6) : R.int(2, 4);
    const L = R.shuffle([[String(g2), -n2], ['10', -R.int(3, 6)], [String(R.pick([3, 5, 7])), 0], [String(R.pick([4, 6, 9])), -1], ['-2', -R.pick([3, 5])], ['-3', -2]]);
    reeks(b, L.length, (g, i, nr) => { const [bb, e] = L[i], T = powQ(bb, e), P = powQ(bb, -e);
      const st2 = e===0 ? [['Welke exponent geeft altijd 1?']] : e===-1 ? [['Eén gedeeld door het grondtal is het omgekeerde van het grondtal.', `${brH('1', bH(bb))} ${isq} ${mH(bb, -1)}`]] :
        [{u:`Schrijf de noemer ${Math.abs(P.n)} als een macht van ${bH(bb)}${P.n<0 ? ' (let op het teken)' : ''}.`, line:`${qH(P)} ${isq} ${mE(bb, 'a')}`, check:V=>chkE(V.a, -e), show:`${qH(P)} ${isq} ${mH(bb, -e)}`},
         ['Eén gedeeld door een macht: de exponent wordt tegengesteld.', `${brH('1', mH(bb, -e))} ${isq} ${mH(bb, e)}`]];
      mQ(g, st, save, 'x' + i, { nr, html:`${mE(bb, 'a')} ${isq} ${qH(T)}`, check:V=>chkE(V.a, e, [[-e, 'Het resultaat is een breuk met 1 in de teller: de exponent is negatief.']]), hint:st2 }); });
  } };

/* ---------- waar of niet waar ---------- */
NG.wn = { title:'Waar of niet waar?', lvl:2,
  instr:'Klik op <b>Waar</b> of <b>Niet waar</b>.',
  build(b, st, save){
    const R = makeR(st);
    /* [grondtal, exponent, minteken ervoor, rechterlid] */
    const S = [['2', -3, false, Q(-8)], ['5', 0, false, Q(0)], ['10', -2, false, Q(1, 100)], ['-4', -2, false, Q(1, 16)], ['2', -2, true, Q(1, 4)],
      ['3', -1, false, Q(1, 3)], ['-1', -3, false, Q(1)], ['-7', 0, false, Q(1)], ['4', -2, false, Q(-16)], ['2', -4, false, Q(1, 8)], ['-2', -3, false, Q(-1, 8)], ['6', 0, true, Q(-1)]];
    const pick = R.shuffle(S).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    pick.forEach(([bb, e, mn, rhs], i) => { const T = mn ? qNeg(powQ(bb, e)) : powQ(bb, e); const ok = qEq(T, rhs); const lh = mn ? minH(mH(bb, e)) : mH(bb, e);
      const w = `${lh} ${isq} ${qH(T)}` + (e<0 ? `, want ${lh} ${isq} ${mn ? MIN : ''}${brH('1', mH(bb, -e))}` : '');
      const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'w' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${lh} ${isq} ${qH(rhs)}</span>`, opts:WN, ans: ok ? 'w' : 'n', why:w, whyBad:w }); });
  } };

/* ---------- verdieping: kommagetallen ---------- */
NG.komma = { title:'Kommagetallen met een negatieve exponent', lvl:3,
  instr:'Schrijf het kommagetal eerst als een breuk. Reken dan uit en schrijf je antwoord als een geheel getal of een breuk.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['0,5', -2], ['0,1', -3], ['0,2', -1], ['0,25', -2], ['1,5', -2], ['-0,5', -3], ['0,4', -2], ['2,5', -1], ['-0,2', -2]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, e] = L[i], T = powQ(bb, e);
      mQ(g, st, save, 'k' + i, { nr, html:`${mH(bb, e)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T, negFout(bb, e)),
        sol:(()=>{ const v = bVal(bb); return `${bH(bb)} ${isq} ${qH(v)}, dus ${mH(bb, e)} ${isq} ${mH(qS(v), e)} ${isq} ${mH(qS(qInv(v)), -e)} ${isq} ${qH(T)}`; })() }); });
  } };

/* ---------- verdieping: vergelijken ---------- */
NG.vgl = { title:'Kleiner dan, gelijk aan of groter dan?', lvl:3,
  instr:'Vergelijk zonder rekenmachine. Kies &lt;, = of &gt;.',
  build(b, st, save){
    const R = makeR(st);
    const V = (bb, e, mn) => ({h:mn ? minH(mH(bb, e)) : mH(bb, e), q: mn ? qNeg(powQ(bb, e)) : powQ(bb, e)});
    const N = (q, h) => ({h: h || qH(q), q});
    const P = R.shuffle([[V('2', -3), V('3', -2)], [V('-2', -3), V('2', -3)], [V('10', -2), N(Q(1, 100), '0,01')], [V('5', 0), V('1', 5)], [V('-3', -2), V('3', -2, true)],
      [V('0,5', -1), N(Q(2))], [V('2', -5), V('4', -2)], [V('-5', -2), V('-5', -3)], [V('2', -4), V('4', -2)], [V('3', -1), N(Q(3, 10), '0,3')]]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    P.forEach(([l, r], i) => { const c = qCmp(l.q, r.q); const ans = c<0 ? '<' : c>0 ? '>' : '=';
      const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'v' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${l.h} <span class="m4-is">…</span> ${r.h}</span>`, opts:VGL, sym:true, ans,
        why:`${l.h} ${isq} ${qH(l.q)} en ${r.h} ${isq} ${qH(r.q)}`, whyBad:'Reken beide kanten uit als een breuk en vergelijk dan.' }); });
  } };

/* ---------- verdieping: welk grondtal? ---------- */
NG.grond = { title:'Welk grondtal?', lvl:3,
  instr:'Welk getal past in het vak? Soms zijn er twee mogelijkheden: één is genoeg.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([[-2, Q(1, 49)], [-3, Q(-1, 8)], [-4, Q(1, 10000)], [-1, Q(4)], [-2, Q(9, 4)], [-3, Q(27)], [-1, Q(-1, 5)], [-2, Q(1, 36)]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [e, T] = L[i];
      mQ(g, st, save, 'g' + i, { nr, html:`<span class="m4-m"><span class="m4-par">(</span>{{b:a}}<span class="m4-par">)</span><sup class="m4-sup">${sg(e)}</sup></span> ${isq} ${qH(T)}`,
        check:V=>{ const x = rdB(V.a); if(!x || x.bad || x.kind==='l') return {info:true, msg:'Typ een getal of een breuk.'}; if(x.q.n===0) return {ok:false};
          const ok = qEq(qPow(x.q, e), T); const two = e%2===0; return ok ? {ok:true, msg: two ? `Ook ${qH(qNeg(x.q))} kan, want de exponent is even.` : ''} : {ok:false, msg: qEq(qPow(x.q, -e), T) ? 'Let op: de exponent is negatief, dus je zoekt het omgekeerde.' : ''}; } }); });
  } };

SEC.neg = { id:'neg', ic:'m_neg', nav:'Negatieve exponent en exponent 0', title:'Negatieve exponent en exponent 0',
  tip:'Staat er een tekenvak naast het antwoord, kies dan eerst het teken: <b>+</b> boven of <b>−</b> onder. Wil je een breuk, klik dan op het breukicoontje naast het vak: de teller en de noemer komen onder elkaar (met de pijltjestoetsen ga je van teller naar noemer).',
  cheat:CHEAT_NEG, cards:[NG.trap, NG.schimmel, NG.pos, NG.een, NG.reken, NG.nul, NG.exp, NG.wn, NG.komma, NG.vgl, NG.grond] };

/* ============================================================
   ONDERDEEL 3 · BREUK TOT EEN NEGATIEVE MACHT
   (a/b)^-n = (b/a)^n : de breuk omdraaien en de exponent tegengesteld maken
   ============================================================ */
Object.assign(ICONS, {
  m_brk:'<text x="5" y="10" font-size="8" font-weight="700" fill="currentColor" stroke="none">a</text><path d="M3 12h9"/><text x="5" y="20" font-size="8" font-weight="700" fill="currentColor" stroke="none">b</text><text x="13" y="9" font-size="8" font-weight="700" fill="currentColor" stroke="none">−n</text>'
});
const abH = (t, n, e) => `<span class="m4-m">${par(brH(t, n))}<sup class="m4-sup">${e}</sup></span>`;
const AB = abH('<i>a</i>', '<i>b</i>', `${MIN}<i>n</i>`), BA = abH('<i>b</i>', '<i>a</i>', '<i>n</i>');
const CHEAT_BRK = `<h3>Spiekbriefje · breuk tot een negatieve macht</h3><table>
  <tr><td>regel</td><td><div class="m4-line">${AB} ${isq} ${BA}</div>draai de breuk om en maak de exponent positief</td></tr>
  <tr><td>voorbeeld</td><td><div class="m4-line">${mH('2/3', -2)} ${isq} ${mH('3/2', 2)} ${isq} ${qH(Q(9, 4))}</div></td></tr>
  <tr><td>geheel getal</td><td><div class="m4-line">${mH('5', -2)} ${isq} ${mH('1/5', 2)} ${isq} ${qH(Q(1, 25))}</div></td></tr>
  <tr><td>minteken</td><td><div class="m4-line">${mH('-4/7', -1)} ${isq} ${qH(Q(-7, 4))}</div>het minteken blijft bij de breuk</td></tr></table>`;
/* macht met een breukgrondtal-vak en een exponentvak */
const pE = (kb, ke) => `<span class="m4-m">${par(`{{b:${kb}}}`)}<sup class="m4-sup">{{e:${ke}}}</sup></span>`;
const BK = {};

/* ---------- animatie: de breuk draait om ---------- */
function omdraaiSvg(p, q, n, k, t){
  const W = 440, H = 170; let s = '';
  const bx = 70, by = 85;
  const swap = k===1 ? t : k>1 ? 1 : 0;
  const yT = lerp(by - 22, by + 22, swap), yN = lerp(by + 22, by - 22, swap);
  const xs = lerp(0, 1, swap);
  s += `<text class="t big" x="${bx - 30}" y="${by}" text-anchor="middle" dominant-baseline="central" style="font-size:52px;font-weight:300">(</text><text class="t big" x="${bx + 30}" y="${by}" text-anchor="middle" dominant-baseline="central" style="font-size:52px;font-weight:300">)</text>`;
  s += `<line class="brl" x1="${bx - 16}" y1="${by}" x2="${bx + 16}" y2="${by}"/>`;
  s += `<text class="t big" x="${fx(bx + (k===1 ? Math.sin(Math.PI*xs)*-16 : 0))}" y="${fx(yT)}" text-anchor="middle" dominant-baseline="central" style="fill:var(--accent-dark)">${p}</text>`;
  s += `<text class="t big" x="${fx(bx + (k===1 ? Math.sin(Math.PI*xs)*16 : 0))}" y="${fx(yN)}" text-anchor="middle" dominant-baseline="central" style="fill:#b46f00">${q}</text>`;
  const e = k===0 ? -n : n;
  s += `<text class="t big" x="${bx + 44}" y="${by - 30}" text-anchor="start" dominant-baseline="central"${k===1 ? ` opacity="${fx(Math.abs(1-2*t))}"` : ''}>${sg(k===1 && t<.5 ? -n : e)}</text>`;
  if(k===1){ s += `<defs><marker id="m4pijl2" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="pijlk" d="M0 0L8 4L0 8z"/></marker></defs><path class="pijl" style="marker-start:url(#m4pijl2);marker-end:url(#m4pijl2)" d="M${bx - 40} ${by - 30} Q${bx - 62} ${by} ${bx - 40} ${by + 30}"/>`; }
  if(k>=2){ const x2 = 200; s += sT(x2 - 26, by, '=', 'big');
    s += `<text class="t big" x="${x2 + 14}" y="${by - 20}" text-anchor="middle" dominant-baseline="central">${q}<tspan class="sup" dy="-9">${n}</tspan></text><line class="brl" x1="${x2 - 8}" y1="${by}" x2="${x2 + 36}" y2="${by}"/><text class="t big" x="${x2 + 14}" y="${by + 22}" text-anchor="middle" dominant-baseline="central">${p}<tspan class="sup" dy="-9">${n}</tspan></text>`; }
  if(k>=3){ const x3 = 300, T = qPow(Q(q, p), n); s += sT(x3 - 26, by, '=', 'big') + `<g class="pop">${sQ(x3 + 10, by, T, 'big')}</g>`; }
  return s;
}
BK.anim = { title:'De breuk draait om', lvl:1, keep:true,
  instr:'Bekijk stap voor stap wat er gebeurt met een breuk tot een negatieve macht. Vul daarna zelf in.',
  build(b, st, save){
    const R = makeR(st); const [p, q] = R.pick([[2, 3], [3, 4], [2, 5], [3, 5]]); const n = R.pick([2, 3]);
    const wrap = el('div', 'm4-naast breed-l'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    stepFig(l, { W:440, H:170, maxw:520, alt:'een breuk die omdraait', steps:[
      {cap:`${mH(`${p}/${q}`, -n)}: een breuk met een negatieve exponent.`, draw:t=>omdraaiSvg(p, q, n, 0, t)},
      {cap:'Een negatieve exponent: neem het omgekeerde. Teller en noemer wisselen van plaats, de exponent wordt positief.', draw:t=>omdraaiSvg(p, q, n, 1, t), ms:1500},
      {cap:'Neem teller en noemer tot de macht.', draw:t=>omdraaiSvg(p, q, n, 2, t)},
      {cap:'Reken uit.', draw:t=>omdraaiSvg(p, q, n, 3, t)}] });
    const it = el('div', 'm4-items een'); r.append(it);
    const [a, c] = R.pick([[3, 4], [2, 7], [4, 5]]);
    mQ(it, st, save, 'a', { nr:'a)', html:`${mH(`${a}/${c}`, -1)} ${isq} {{u:a}}`, check:V=>chkU(V.a, Q(c, a), [[Q(-a, c), 'Een negatieve exponent maakt de breuk niet negatief: draai ze om.'], [Q(a, c), 'Draai de breuk om.']]), sol:`${mH(`${a}/${c}`, -1)} ${isq} ${qH(Q(c, a))}` });
    mQ(it, st, save, 'b', { nr:'b)', html:`${mH(`${p}/${q}`, -2)} ${isq} ${pE('a', 'b')}`, check:V=>{ const x = rdB(V.a);
        return allOf([['a', x && !x.bad && x.kind==='q' && qEq(x.q, Q(q, p)) ? {ok:true} : {ok:false, msg:'Draai de breuk om: de noemer komt boven.'}], ['b', chkE(V.b, 2, [[-2, 'Na het omdraaien is de exponent positief.']])]]); },
      onOk:()=>{ if(!r.querySelector('.m4-regel')) r.append(el('div', 'm4-regel nieuw', `<div class="m4-line">${AB} ${isq} ${BA}</div>Draai de breuk om en maak de exponent positief.`)); } });
  } };

/* ---------- schrijf met een positieve exponent ---------- */
BK.pos = { title:'Draai om: schrijf met een positieve exponent', lvl:1,
  instr:'Schrijf als een breuk tot een macht met een positieve exponent. Klik op het breukicoontje om een breuk te maken.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${AB} ${isq} ${BA}</div>Draai de breuk om en maak de exponent positief.`);
    const R = makeR(st);
    const L = R.shuffle([['2/5', 3], ['3/7', 2], ['4/9', 2], ['5/3', 4], ['-2/3', 3], ['-1/4', 2], ['7/2', 5], ['-5/6', 2]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, n] = L[i]; const inv = qInv(bVal(bb));
      mQ(g, st, save, 'p' + i, { nr, html:`${mH(bb, -n)} ${isq} ${pE('a', 'b')}`,
        check:V=>{ const x = rdB(V.a); const rb = !x || x.bad || x.kind==='l' ? {info:true, msg:'Typ het grondtal als breuk.'} : qEq(x.q, inv) ? {ok:true} : qEq(x.q, bVal(bb)) ? {ok:false, msg:'Draai de breuk om.'} : qEq(x.q, qNeg(inv)) ? {ok:false, msg:'Het minteken blijft bij de breuk.'} : {ok:false};
          return allOf([['a', rb], ['b', chkE(V.b, n, [[-n, 'De exponent wordt positief.']])]]); },
        hint:['Wissel teller en noemer van plaats.', 'Maak de exponent positief.'], sol:`${mH(bb, -n)} ${isq} ${mH(qS(inv), n)}` }); });
  } };

/* ---------- reken uit ---------- */
BK.reken = { title:'Reken uit', lvl:2,
  instr:'Reken uit. Kies eerst het teken in het tekenvak. Je antwoord is een vereenvoudigde breuk of een geheel getal.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['2/3', -2], ['3/4', -1], ['1/2', -3], ['-2/5', -2], ['-3/4', -1], ['1/3', -2], ['-1/2', -3], ['5/2', -2], ['2/7', -1], ['4/3', -2]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, e] = L[i]; const T = powQ(bb, e); const inv = qS(qInv(bVal(bb)));
      mQ(g, st, save, 'r' + i, { nr, html:`${mH(bb, e)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T, negFout(bb, e)),
        hint:[{u:'Draai de breuk om en maak de exponent positief.', line:`${mH(bb, e)} ${isq} ${pE('a', 'b')}`, check:V=>{ const x = rdB(V.a); return !!x && !x.bad && x.kind!=='l' && qEq(x.q, qInv(bVal(bb))) && chkE(V.b, -e).ok; }, show:`${mH(bb, e)} ${isq} ${mH(inv, -e)}`},
          {u:'Neem teller en noemer tot de macht.', line:`${mH(inv, -e)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), show:`${mH(inv, -e)} ${isq} ${qH(T)}`}],
        sol:`${mH(bb, e)} ${isq} ${mH(inv, -e)} ${isq} ${qH(T)}` }); });
  } };

/* ---------- geheel getal of stambreuk ---------- */
BK.stam = { title:'Gehele getallen en stambreuken', lvl:2,
  instr:'Een geheel getal is een breuk met noemer 1. Reken uit.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${abH('1', '<i>a</i>', `${MIN}<i>n</i>`)} ${isq} ${mH('a', 'n')} &nbsp; en &nbsp; ${mH('a', '-n')} ${isq} ${abH('1', '<i>a</i>', '<i>n</i>')}</div>`);
    const R = makeR(st);
    const L = R.shuffle([['1/2', -4], ['1/3', -3], ['1/5', -2], ['1/10', -3], ['-1/2', -5], ['-1/3', -2], ['4', -2], ['-6', -2]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, e] = L[i]; const T = powQ(bb, e);
      mQ(g, st, save, 's' + i, { nr, html:`${mH(bb, e)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T, negFout(bb, e)), sol:`${mH(bb, e)} ${isq} ${mH(qS(qInv(bVal(bb))), -e)} ${isq} ${qH(T)}` }); });
  } };

/* ---------- waar of niet waar ---------- */
BK.wn = { title:'Waar of niet waar?', lvl:2,
  instr:'Klik op <b>Waar</b> of <b>Niet waar</b>.',
  build(b, st, save){
    const R = makeR(st);
    /* [grondtal, exponent, rechterlid] */
    const S = R.shuffle([['2/3', -1, Q(-2, 3)], ['2/3', -1, Q(3, 2)], ['1/4', -2, Q(16)], ['3/5', -2, Q(-9, 25)], ['-1/2', -3, Q(-8)], ['-1/2', -2, Q(-4)], ['5/2', -2, Q(4, 25)], ['3/4', -2, Q(9, 16)]]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    S.forEach(([bb, e, rhs], i) => { const T = powQ(bb, e); const ok = qEq(T, rhs);
      const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'w' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${mH(bb, e)} ${isq} ${qH(rhs)}</span>`, opts:WN, ans: ok ? 'w' : 'n',
        why:`${mH(bb, e)} ${isq} ${mH(qS(qInv(bVal(bb))), -e)} ${isq} ${qH(T)}`, whyBad:`${mH(bb, e)} ${isq} ${mH(qS(qInv(bVal(bb))), -e)} ${isq} ${qH(T)}` }); });
  } };

/* ---------- grondtal of exponent zoeken ---------- */
BK.zoek = { title:'Vul het grondtal of de exponent in', lvl:2,
  instr:'Welk grondtal of welke exponent past? Klik op het breukicoontje om een breuk te typen.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([
      ['e', '3/5', -3, Q(125, 27)], ['e', '2/3', -2, Q(9, 4)], ['e', '1/2', -5, Q(32)], ['e', '4/5', 2, Q(16, 25)],
      ['b', '5/3', -2, Q(9, 25)], ['b', '2/7', -1, Q(7, 2)], ['b', '1/3', -4, Q(81)], ['b', '-3/2', -3, Q(-8, 27)]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [w, bb, e, T] = L[i];
      if(w==='e') mQ(g, st, save, 'z' + i, { nr, html:`${mE(bb, 'a')} ${isq} ${qH(T)}`, check:V=>chkE(V.a, e, [[-e, 'Kijk of de breuk omgedraaid is: dan is de exponent negatief.']]), sol:`${mH(bb, e)} ${isq} ${qH(T)}` });
      else mQ(g, st, save, 'z' + i, { nr, html:`<span class="m4-m">${par('{{b:a}}')}<sup class="m4-sup">${sg(e)}</sup></span> ${isq} ${qH(T)}`,
        check:V=>{ const x = rdB(V.a); if(!x || x.bad || x.kind==='l') return {info:true, msg:'Typ een getal of een breuk.'}; if(x.q.n===0) return {ok:false};
          if(qEq(qPow(x.q, e), T)) return {ok:true, msg: e%2===0 ? `Ook ${qH(qNeg(x.q))} kan, want de exponent is even.` : ''};
          return {ok:false, msg: qEq(qPow(x.q, -e), T) ? 'De exponent is negatief: het grondtal is het omgekeerde.' : ''}; }, sol:`${mH(bb, e)} ${isq} ${qH(T)}` }); });
  } };

/* ---------- verdieping: getalwaarde ---------- */
BK.waarde = { title:'Getalwaarde met negatieve exponenten', lvl:3,
  instr:'Vul de gegeven waarden in en reken uit.',
  build(b, st, save){
    const R = makeR(st); const [p, q] = R.pick([[2, 3], [3, 4], [2, 5]]); const c = -R.pick([2, 3]);
    const A = Q(p, q), C = Q(c);
    b.append(el('p', 'm4-line', `<span class="txt">Neem</span> <i>a</i> ${isq} ${qH(A)} <span class="txt">en</span> <i>b</i> ${isq} ${sg(c)}.`));
    const L = [[mH('a', -1), qInv(A)], [mH('a', -2), qPow(A, -2)], [mH('b', -2), qPow(C, -2)], [mH('b', -3), qPow(C, -3)], [`${mH('a', -1)} · <i>b</i>`, qMul(qInv(A), C)], [`${mH('a', -1)} + ${mH('b', -1)}`, Q(q*c + p, p*c)]];
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i];
      mQ(g, st, save, 'v' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), sol:`${h} ${isq} ${qH(T)}` }); });
  } };

/* ---------- verdieping: a of het omgekeerde? ---------- */
BK.kleiner = { title:'Wanneer is a kleiner dan a⁻¹?', lvl:3,
  instr:'Vergelijk het getal <i>a</i> met <i>a</i><sup>−1</sup>. Kies &lt;, = of &gt;.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([Q(3), Q(1, 2), Q(-2), Q(-1, 3), Q(1), Q(-1), Q(5, 4), Q(-3, 2)]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    L.forEach((A, i) => { const c = qCmp(A, qInv(A)); const ans = c<0 ? '<' : c>0 ? '>' : '=';
      const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'k' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex"><i>a</i> ${isq} ${qH(A)}: &nbsp; <i>a</i> <span class="m4-is">…</span> ${mH('a', -1)}</span>`, opts:VGL, sym:true, ans,
        why:`${mH('a', -1)} ${isq} ${qH(qInv(A))}`, whyBad:`Reken eerst ${mH('a', -1)} uit: dat is het omgekeerde van ${qH(A)}.` }); });
    b.append(el('div', 'tip', icon('bulb') + '<div>Ontdek je het patroon? Kijk naar getallen groter dan 1, tussen 0 en 1, tussen −1 en 0 en kleiner dan −1.</div>'));
  } };

SEC.brk = { id:'brk', ic:'m_brk', nav:'Breuk tot een negatieve macht', title:'Een breuk tot een negatieve macht',
  tip:'Klik op het breukicoontje naast een vak om een breuk te maken. Staat er een tekenvak, kies dan eerst het teken.',
  cheat:CHEAT_BRK, cards:[BK.anim, BK.pos, BK.reken, BK.stam, BK.wn, BK.zoek, BK.waarde, BK.kleiner] };

/* ============================================================
   ONDERDEEL 4 · POSITIEF OF NEGATIEF?
   het teken van een macht bepalen zonder te rekenen, minnen per twee wegklikken
   ============================================================ */
Object.assign(ICONS, {
  m_teken:'<text x="2" y="11" font-size="11" font-weight="900" fill="currentColor" stroke="none">+</text><text x="12" y="20" font-size="12" font-weight="900" fill="currentColor" stroke="none">−</text><path d="M4 20L20 4"/>'
});
const CHEAT_TEKEN = `<h3>Spiekbriefje · het teken van een macht</h3><table>
  <tr><td>positief grondtal</td><td>de macht is altijd positief: ${mH('2', 5)} ${isq} 32</td></tr>
  <tr><td>negatief grondtal, even exponent</td><td>positief: ${mH('-2', 4)} ${isq} 16 (de minnen vallen per twee weg)</td></tr>
  <tr><td>negatief grondtal, oneven exponent</td><td>negatief: ${mH('-2', 3)} ${isq} −8 (er blijft één minteken over)</td></tr>
  <tr><td>minteken vóór de macht</td><td>${minH(mH('2', 4))} ${isq} −16: eerst de macht, dan het minteken</td></tr>
</table>`;
const TK = {};
const PN = [['+', 'positief'], ['-', 'negatief']];
/* teken van een uitdrukking: [html, waarde] */
const tkV = (bb, e, mn) => { const v = powQ(bb, e); return [mn ? minH(mH(bb, e)) : mH(bb, e), mn ? qNeg(v) : v]; };

/* ---------- minnen per twee wegklikken ---------- */
TK.minnen = { title:'Minnen per twee wegklikken', lvl:1,
  instr:'Klik telkens twee mintekens aan: samen geven ze +. Blijft er één minteken over, dan is het product negatief.',
  build(b, st, save){
    const R = makeR(st);
    const n1 = R.int(4, 6), n2 = R.int(5, 7) | 1, k = R.int(3, 5);
    const L = [
      {html:`${mH('-2', n1)} ${isq} ` + Array(n1).fill('(−2)').join(' · '), fac:Array(n1).fill('2'), neg:Array(n1).fill(true)},
      {html:`${mH('-1', n2)}`, fac:Array(n2).fill('1'), neg:Array(n2).fill(true)},
      {html:`${mH('-3', 2)} · ${mH('-3', k)}`, fac:Array(2 + k).fill('3'), neg:Array(2 + k).fill(true)},
      {html:`(−5) · 4 · (−2) · (−1) · 3`, fac:['5', '4', '2', '1', '3'], neg:[true, false, true, true, false]}];
    const it = el('div', 'm4-items een'); b.append(it);
    let klaar = 0;
    L.forEach((q, i) => minnenWeg(it, st, save, 'm' + i, Object.assign({nr:'abcd'[i] + ')'}, q, {onOk:()=>{ if(++klaar>=1 && !b.querySelector('.m4-regel')) b.append(el('div', 'm4-regel nieuw', '<b>Even</b> aantal mintekens: positief. <b>Oneven</b> aantal mintekens: negatief.')); }})));
  } };

/* ---------- teken zonder te rekenen ---------- */
TK.zonder = { title:'Positief of negatief? Reken niet uit.', lvl:1,
  instr:'Bepaal het teken zonder de macht uit te rekenen.',
  build(b, st, save){
    regelTop(b, `Negatief grondtal: <b>even</b> exponent geeft een positief getal, <b>oneven</b> exponent een negatief getal.<div class="m4-line">${mH('-2', 4)} ${isq} 16 &nbsp; ${mH('-2', 3)} ${isq} −8</div>`);
    const R = makeR(st);
    const L = R.shuffle([tkV('-3', R.int(3, 9) | 1), tkV('-2', 2*R.int(3, 6)), tkV('-7', 5), tkV('5', 3, true), tkV('-1', 100 + 2*R.int(0, 9) + 1), tkV('-4', 2*R.int(1, 4), true),
      tkV('-10', 2*R.int(2, 4)+1), tkV('6', R.int(2, 9))]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    L.forEach(([h, v], i) => { const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'z' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h}</span>`, opts:PN, ans: v.n>0 ? '+' : '-',
        why: v.n>0 ? 'Positief.' : 'Negatief.', whyBad:'Kijk of het minteken bij het grondtal hoort (haakjes) en of de exponent even of oneven is.' }); });
  } };

/* ---------- sorteren ---------- */
TK.sort = { title:'Sorteer: positief of negatief?', lvl:2,
  instr:'Tik een kaartje aan en tik dan op het juiste vak.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([tkV('-2', 6), tkV('-2', 5), tkV('2', 5, true), tkV('-5', 2, true), tkV('-1', 11), tkV('-3', 4), tkV('-6', 3), tkV('-4', 2), tkV('3', 7), tkV('-1', 6, true)]).slice(0, 8);
    sorteer(b, st, save, 's', { items:L.map(([h, v]) => [h, v.n>0 ? '+' : '-']), bins:[['+', 'positief'], ['-', 'negatief']],
      why:'Een negatieve exponent verandert het teken niet. Een minteken vóór de macht wel.', whyBad:'Kijk naar de haakjes en naar de exponent: even of oneven?' });
  } };

/* ---------- reken uit met het teken ---------- */
TK.reken = { title:'Reken uit: eerst het teken', lvl:2,
  instr:'Bepaal eerst het teken in het tekenvak, reken dan de macht uit.',
  build(b, st, save){
    const R = makeR(st); const a = R.pick([2, 3]);
    const L = R.shuffle([tkV(String(-a), 4), tkV(String(a), 4, true), tkV(String(-a), 3, true), tkV('-1', R.int(7, 15)), tkV('-5', 2, true), tkV('-2', 5), tkV('-10', 3), tkV('-3', 3)]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i];
      mQ(g, st, save, 'r' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), sol:`${h} ${isq} ${qH(T)}` }); });
  } };

/* ---------- even of oneven ---------- */
TK.even = { title:'Even of oneven?', lvl:2,
  instr:'Wat weet je over de exponent <i>n</i>? Kies het juiste antwoord.',
  build(b, st, save){
    const R = makeR(st); const g = R.pick(['-2', '-3', '-5']);
    const L = [[`${mH(g, 'n')} is positief.`, 'e'], [`${mH(g, 'n')} is negatief.`, 'o'], [`${minH(mH(g, 'n'))} is positief.`, 'o'], [`${mH('-1', 'n')} ${isq} 1`, 'e'], [`${mH('-1', 'n')} ${isq} −1`, 'o'], [`${minH(mH('-1', 'n'))} ${isq} −1`, 'e']];
    const it = el('div', 'm4-items'); b.append(it);
    L.forEach(([h, ans], i) => { const row = el('div', 'm4-wn'); it.append(row);
      qChoice(row, st, save, 'e' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h}</span> <span class="txt">Dan is <i>n</i> …</span>`, opts:[['e', 'even'], ['o', 'oneven']], ans,
        why: ans==='e' ? 'Een even aantal mintekens valt per twee weg.' : 'Bij een oneven aantal mintekens blijft er één over.', whyBad:'Tel de mintekens: vallen ze per twee weg?' }); });
  } };

/* ---------- product van machten ---------- */
TK.prod = { title:'Het teken van een product', lvl:2,
  instr:'Bepaal het teken van het product zonder uit te rekenen.',
  build(b, st, save){
    const R = makeR(st);
    const mk = (a, c) => { const [h1, v1] = a, [h2, v2] = c; return [`${h1} · ${h2}`, qMul(v1, v2)]; };
    const L = R.shuffle([mk(tkV('-2', 3), tkV('-3', 2)), mk(tkV('-1', 5), tkV('-1', 8)), mk(tkV('-4', 3), tkV('-5', 3)), mk(tkV('2', 4, true), tkV('-3', 3)), mk(tkV('-7', 2), tkV('-2', 7)), mk(tkV('-1', 6), tkV('-6', 5))]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    L.forEach(([h, v], i) => { const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'p' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h}</span>`, opts:PN, ans: v.n>0 ? '+' : '-',
        why:'Bepaal eerst het teken van elke macht, dan het teken van het product.', whyBad:'Bepaal eerst het teken van elke macht. Tel daarna de mintekens.' }); });
  } };

/* ---------- verdieping: met letters ---------- */
TK.letters = { title:'Het teken met letters', lvl:3,
  instr:'Het getal <i>a</i> is negatief en het getal <i>b</i> is positief. Is de uitdrukking positief of negatief?',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([[mH('a', 3), '-'], [mH('a', 4), '+'], [minH(mH('a', 2)), '-'], [`<span class="m4-m">(${MIN}<i>a</i>)<sup class="m4-sup">3</sup></span>`, '+'], [`${mH('a', 2)} · ${mH('b', 3)}`, '+'], [`${mH('a', 5)} · <i>b</i>`, '-'], [mH('a', 7), '-'], [`${minH(mH('b', 4))} · ${mH('a', 3)}`, '+']]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    L.forEach(([h, ans], i) => { const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'l' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h}</span>`, opts:PN, ans, why:'', whyBad:'Kies een voorbeeld: neem <i>a</i> = −2 en <i>b</i> = 3 en reken het teken uit.' }); });
  } };

/* ---------- verdieping: grote exponenten ---------- */
TK.groot = { title:'Grote exponenten', lvl:3,
  instr:'Reken uit zonder rekenmachine.',
  build(b, st, save){
    const R = makeR(st); const j = 2000 + R.int(10, 40), k = j + 1;
    const v = n => Q(n % 2 ? -1 : 1);
    const L = [[`${mH('-1', j)} + ${mH('-1', k)}`, qMul(Q(1), Q(0))], [`${mH('-1', j)} · ${mH('-1', k)}`, qMul(v(j), v(k))], [`${minH(mH('1', j))} ${MIN} ${mH('-1', k)}`, Q(-1 - v(k).n)],
      [`${mH('-1', 2*j+1)} · ${mH('-1', 3)}`, Q(1)], [`${mH('-1', j)} ${MIN} ${mH('-1', j+2)}`, Q(0)], [`${mH('-1', 7)} + ${mH('-1', 8)} + ${mH('-1', 9)}`, Q(-1)]];
    L[0][1] = Q(v(j).n + v(k).n);
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i];
      mQ(g, st, save, 'g' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), sol:`${h} ${isq} ${qH(T)}` }); });
  } };

SEC.teken = { id:'teken', ic:'m_teken', nav:'Positief of negatief?', title:'Positief of negatief?',
  tip:'Kijk eerst of het minteken bij het grondtal hoort (haakjes) of vóór de macht staat. Bij een negatief grondtal beslist de exponent: even of oneven.',
  cheat:CHEAT_TEKEN, cards:[TK.minnen, TK.zonder, TK.sort, TK.reken, TK.even, TK.prod, TK.letters, TK.groot] };

/* ============================================================
   MACHTEN VERMENIGVULDIGEN: eenzelfde grondtal, exponenten optellen
   ============================================================ */
const CHEAT_VERM = `<h3>Spiekbriefje · machten vermenigvuldigen</h3><table>
  <tr><td>rekenregel</td><td><div class="m4-line">${mH('a', 'm')} · ${mH('a', 'p')} ${isq} ${mH('a', 'm+p')}</div>Machten met hetzelfde grondtal vermenigvuldigen: je behoudt het grondtal en je telt de exponenten op.</td></tr>
  <tr><td>voorbeeld</td><td><div class="m4-line">${mH('2', 3)} · ${mH('2', 4)} ${isq} (2 · 2 · 2) · (2 · 2 · 2 · 2) ${isq} ${mH('2', 7)}</div></td></tr>
  <tr><td>negatieve exponent</td><td><div class="m4-line">${mH('5', -3)} · ${mH('5', 7)} ${isq} ${mH('5', 4)}</div>want −3 + 7 = 4</td></tr>
  <tr><td>exponent 1</td><td><div class="m4-line">${bH('a')} · ${mH('a', 5)} ${isq} ${mH('a', 6)}</div>want <i>a</i> = ${mH('a', 1)}</td></tr>
  <tr><td>let op</td><td><div class="m4-line">${mH('2', 3)} + ${mH('2', 4)} ≠ ${mH('2', 7)}</div>een som van machten is geen macht<div class="m4-line">${mH('2', 3)} · ${mH('5', 4)}</div>verschillende grondtallen: de regel geldt niet</td></tr></table>`;
/* exponent tussen haakjes als ze negatief is: 3 + (−5) */
const ePlus = es => es.map(e => { const L = linOf(e); return (L.c===0 && L.k<0) || L.c<0 ? `(${linT(L)})` : linT(L); }).join(' + ');
const linSum = es => es.reduce((a, e) => linAdd(a, e), {c:0, k:0, v:null});
const prodE = (b, es) => es.map(e => e===1 ? bH(b) : mH(b, e)).join(' · ');
/* hints bij "schrijf als één macht" */
function vermSteps(b, es, o={}){ const S = linSum(es); const tb = B(b);
  const st = [{u:'Welk grondtal blijft staan?', line:'grondtal: {{b:a}}', check:V=>sameB(rdB({t:nrm((V.a||{}).t||'').replace(/^\((.*)\)$/, '$1'), n:(V.a||{}).n}), b), show:`grondtal: ${bH(b)}`},
    {u:'Tel de exponenten op.' + (es.includes(1) ? ` Let op: ${bH(b)} = ${mH(b, 1)}.` : ''), line:`${ePlus(es)} ${isq} {{g:a}}`, check:V=>chkE(V.a, S), show:`${ePlus(es)} ${isq} ${linT(S)}`}];
  if(o.pos && linNum(S) && S.k<0) st.push([`De exponent is negatief. Schrijf met een positieve exponent: klik op het breukicoontje (of typ <b>1/</b>), dan komt de macht in de noemer.`, `${mH(b, S)} ${isq} ${brH('1', mH(b, -S.k))}`]);
  else st.push(['Schrijf de macht met dat grondtal en die exponent.' + ((tb.kind==='q' || tb.neg) ? ' Typ haakjes rond het grondtal.' : '')]);
  return st; }
const VM_MEER = `<div class="m4-line">${mH('a', 3)} · ${mH('a', 4)} ${isq} (<i>a</i> · <i>a</i> · <i>a</i>) · (<i>a</i> · <i>a</i> · <i>a</i> · <i>a</i>) ${isq} ${mH('a', 7)}</div>Je telt het aantal factoren <i>a</i>: 3 + 4 = 7.`;
const VM = {};

/* ---------- tegels schuiven samen ---------- */
function tegelSvg(g, m, p, k, t){
  const W = 520, H = 200, s = 38, d = 44, x0 = 64, y1 = 44, y2 = 130; const n = m + p; const let_ = B(g).kind==='l';
  let out = '';
  const tile = (x, y, cls, txt, op=1) => `<g opacity="${fx(op)}"><rect class="tegel ${cls}" x="${fx(x)}" y="${fx(y)}" width="${s}" height="${s}" rx="5"/>` + (txt ? `<text class="t" x="${fx(x+s/2)}" y="${fx(y+s/2)}" text-anchor="middle" dominant-baseline="central"${let_ ? ' font-style="italic"' : ''}>${txt}</text>` : '') + '</g>';
  const dot = (x, y, op=1) => `<text class="t" x="${fx(x)}" y="${fx(y)}" text-anchor="middle" dominant-baseline="central" opacity="${fx(op)}">·</text>`;
  const gt = let_ ? g : sg(g);
  const lab = (y, e) => `<text class="t big" x="${x0-14}" y="${y+s/2}" text-anchor="end" dominant-baseline="central">${let_ ? `<tspan font-style="italic">${g}</tspan>` : gt}<tspan class="sup" dy="-9">${e}</tspan></text>`;
  const txtOp = k===0 ? 0 : k===1 ? t : 1;
  for(let i=0; i<m; i++){ out += tile(x0 + i*d, y1, '', gt, 1); }
  for(let j=0; j<p; j++){ let x = x0 + j*d, y = y2; if(k===2){ x = lerp(x, x0 + (m+j)*d, t); y = lerp(y2, y1, t); } else if(k>2){ x = x0 + (m+j)*d; y = y1; }
    out += tile(x, y, 'b', gt, 1); }
  if(k<2){ out += lab(y1, m) + lab(y2, p); out += sT(x0 - 30, (y1+y2)/2 + s/2, '·', 'big');
    if(k===1){ for(let i=0; i<m-1; i++) out += dot(x0 + i*d + s + 3, y1 + s/2, txtOp); for(let j=0; j<p-1; j++) out += dot(x0 + j*d + s + 3, y2 + s/2, txtOp); } }
  else { for(let i=0; i<n-1; i++) out += dot(x0 + i*d + s + 3, y1 + s/2, k===2 ? (i<m-1 ? 1 : (t>.9 ? (t-.9)*10 : 0)) : 1);
    if(k===3){ const xr = x0 + n*d - (d-s); out += `<path class="as" fill="none" d="M${x0} ${y1+s+10} v8 H${fx(xr)} v-8"/>` + `<text class="t big" x="${fx((x0+xr)/2)}" y="${y1+s+40}" text-anchor="middle" dominant-baseline="central">${let_ ? `<tspan font-style="italic">${g}</tspan>` : gt}<tspan class="sup" dy="-8">${n}</tspan></text>` + sT((x0+xr)/2, y1+s+70, `${m} + ${p} = ${n} factoren`, 't'); }
  }
  return out;
}
VM.tegels = { title:'Tegels schuiven samen', lvl:1,
  instr:'Bekijk stap voor stap wat er gebeurt als je twee machten met hetzelfde grondtal vermenigvuldigt.',
  build(b, st, save){
    const R = makeR(st); const g = R.pick(['2', '3', 'a', 'x']); const m = R.int(2, 5), p = R.int(2, 5);
    const wrap = el('div', 'm4-naast breed-l'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    stepFig(l, { W:520, H:200, maxw:640, alt:'tegels van twee machten', steps:[
      {cap:`${mH(g, m)} · ${mH(g, p)}: elke macht is een rij tegels.`, draw:t=>tegelSvg(g, m, p, 0, t)},
      {cap:`Schrijf elke macht uit als een product: ${mH(g, m)} heeft ${m} factoren ${bH(g)}, ${mH(g, p)} heeft er ${p}.`, draw:t=>tegelSvg(g, m, p, 1, t)},
      {cap:'Schuif de tweede rij achter de eerste: alles wordt één lang product.', draw:t=>tegelSvg(g, m, p, 2, t), ms:1300},
      {cap:`Tel de factoren: ${m} + ${p} = ${m+p}.`, draw:t=>tegelSvg(g, m, p, 3, t)}] });
    r.append(el('p', '', 'Speel de stappen links af. Tel dan de tegels en vul in.'));
    const g2 = el('div', 'm4-items een'); r.append(g2);
    mQ(g2, st, save, 'f', { nr:'a)', html:`<span class="txt">Hoeveel factoren ${bH(g)} staan er samen?</span> {{g:a}}`, check:V=>chkE(V.a, m+p, [[m*p, `Je vermenigvuldigde ${m} en ${p}. Tel de tegels.`]]) });
    mQ(g2, st, save, 'm', { nr:'b)', html:`${mH(g, m)} · ${mH(g, p)} ${isq} ${mE(g, 'a')}`, check:V=>chkE(V.a, m+p, [[m*p, 'De exponenten vermenigvuldigen klopt niet: tel de factoren.']]),
      onOk:()=>{ if(!r.querySelector('.m4-regel')) r.append(el('div', 'm4-regel nieuw', `<div class="m4-line">${mH('a', 'm')} · ${mH('a', 'p')} ${isq} ${mH('a', 'm+p')}</div>Hetzelfde grondtal: tel de exponenten op.`)); } });
  } };

/* ---------- som of product? ---------- */
VM.som = { brk:false, title:'Som of product?', lvl:2,
  instr:'Onderzoek: kan je een som of een product van twee machten schrijven als één macht?',
  build(b, st, save){
    const R = makeR(st); const g = R.pick([2, 3]); let m = R.int(2, g===2 ? 4 : 3), p = R.int(1, g===2 ? 3 : 2); if(m===p) m++;
    const S = Math.pow(g, m) + Math.pow(g, p), P = Math.pow(g, m+p);
    const it = el('div', 'm4-items een'); b.append(it);
    mQ(it, st, save, 's', { nr:'a)', html:`${mH(g, m)} + ${mH(g, p)} ${isq} {{u:a}}`, check:V=>chkU(V.a, Q(S)), sol:`${Math.pow(g, m)} + ${Math.pow(g, p)} = ${S}` });
    mQ(it, st, save, 'p', { nr:'b)', html:`${mH(g, m)} · ${mH(g, p)} ${isq} {{u:a}}`, check:V=>chkU(V.a, Q(P)), sol:`${Math.pow(g, m)} · ${Math.pow(g, p)} = ${P}` });
    const row = el('div', 'm4-wn'); it.append(row);
    qChoice(row, st, save, 'k', { nr:'c)', html:`Welke uitkomst kan je schrijven als één macht van ${g}?`, opts:[['s', 'de som'], ['p', 'het product'], ['b', 'allebei'], ['g', 'geen van beide']], ans:'p',
      why:`${P} = ${mH(g, m+p)}, maar ${S} ligt tussen twee machten van ${g} in.`, whyBad:`Maak de machten van ${g}: ${[1, 2, 3, 4, 5, 6].map(k => Math.pow(g, k)).join(', ')}, … Welke uitkomst staat in dat rijtje?` });
    mQ(it, st, save, 'e', { nr:'d)', html:`${mH(g, m)} · ${mH(g, p)} ${isq} ${P} ${isq} ${mE(g, 'a')}`, check:V=>chkE(V.a, m+p, [[m*p, 'Bij een product van machten vermenigvuldig je de exponenten niet.']]),
      hint:[{u:`Schrijf ${P} als een product van factoren ${g}. Hoeveel factoren zijn het?`, line:`${P} ${isq} ${Array(m+p).fill(g).join(' · ')} ${isq} ${mE(g, 'a')}`, check:V=>chkE(V.a, m+p), show:`${P} ${isq} ${mH(g, m+p)}`}] });
    b.append(el('div', 'tip', icon('bulb') + `<div>Een <b>som</b> van machten kan je meestal niet als één macht schrijven: ${mH(g, m)} + ${mH(g, p)} ≠ ${mH(g, m+p)}. Een <b>product</b> van machten met hetzelfde grondtal wel.</div>`));
  } };

/* ---------- de rekenregel in woorden ---------- */
VM.woorden = { title:'De rekenregel in woorden', lvl:1,
  instr:'Sleep de juiste woorden naar de vakjes, of tik een woord aan en tik dan op een vakje.',
  build(b, st, save, key){
    const w = st.w || (st.w = {});
    bankEx(b, w, save, key, [
      {pre:'Machten met hetzelfde grondtal vermenigvuldigen: je', ans:'behoudt het grondtal', why:'Het grondtal verandert niet.'},
      {pre:'en je', ans:'telt de exponenten op', post:'.', why:'Je telt het aantal factoren.'},
      {pre:`In symbolen: <span class="m4-line" style="display:inline-flex">${mH('a', 'm')} · ${mH('a', 'p')} ${isq} <i>a</i></span>`, ans:'m + p', why:''}],
      shuffle(['behoudt het grondtal', 'vermenigvuldigt de grondtallen', 'telt de exponenten op', 'vermenigvuldigt de exponenten', 'm + p', 'm · p', 'm − p']));
    /* de twee eerste vakjes in één doorlopende zin; het derde vakje staat als exponent bij a */
    const rows = b.querySelectorAll('.bank-line');
    if(rows.length===3){ const fb0 = rows[0].querySelector('.fb'); [...rows[1].childNodes].forEach(n => { if(!(n.classList && n.classList.contains('fb')) && !(n.classList && n.classList.contains('expr'))) rows[0].insertBefore(n, fb0); });
      const fb1 = rows[1].querySelector('.fb'); rows[0].append(fb1); rows[1].remove(); rows[2].querySelector('.blank').classList.add('m4-expblank'); }
    const row = el('div', 'm4-wn'); b.append(row);
    qChoice(row, st, save, 'ver', { html:`Kan je ${mH('2', 3)} · ${mH('5', 4)} met deze regel als één macht schrijven?`, opts:[['j', 'ja'], ['n', 'nee']], ans:'n',
      why:'De grondtallen zijn verschillend (2 en 5), dus de regel geldt niet.', whyBad:'Kijk naar de grondtallen: de regel geldt alleen bij hetzelfde grondtal.' });
  } };

/* ---------- schrijf als één macht ---------- */
function vermPool(R){
  const nz = (a, b) => { const x = R.int(a, b); return x===0 ? b : x; };
  const g1 = String(R.pick([3, 5, 7])), m1 = R.int(2, 6), p1 = R.int(2, 6);
  const g2 = String(R.pick([2, 3, 6])); let a2 = -R.int(2, 6), b2 = R.int(2, 8); if(a2+b2===0) b2++;
  const g3 = String(R.pick([10, 5, 4])), a3 = -R.int(1, 5), b3 = -R.int(2, 5);
  const g4 = String(R.pick([7, 9, 11])), b4 = R.int(2, 8);
  const g5 = R.pick(['-2', '-3', '-5']), a5 = R.int(2, 5), b5 = R.int(2, 5);
  const e6 = [nz(-5, 6), nz(-5, 6), nz(-5, 6)]; if(e6.reduce((x, y) => x+y)===0) e6[1] += e6[1]<0 ? -1 : 1;
  return [[g1, [m1, p1]], [g2, [a2, b2]], [g3, [a3, b3]], [g4, [1, b4]], [g5, [a5, b5]], ['10', e6]];
}
const prodFout = es => es.length===2 ? [[es[0]*es[1], 'Je vermenigvuldigde de exponenten. Bij vermenigvuldigen van machten tel je ze op.']] : [];
VM.een = { title:'Schrijf als één macht', lvl:2,
  instr:'Schrijf als één macht. Typ het grondtal en de exponent. Rond een negatief grondtal typ je zelf haakjes, bijvoorbeeld <b>(-2)</b>.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${mH('a', 'm')} · ${mH('a', 'p')} ${isq} ${mH('a', 'm+p')}</div>Hetzelfde grondtal: behoud het grondtal en tel de exponenten op.`);
    stapUitleg(b, [[`${mH('10', -3)} · ${mH('10', 5)}`, 'Hetzelfde grondtal: 10.'], [`${isq} ${mH('10', '-3+5')}`, 'Behoud het grondtal en tel de exponenten op.'], [`${isq} ${mH('10', 2)}`, '−3 + 5 = 2']], {kop:'Voorbeeld'});
    const R = makeR(st); const L = vermPool(R);
    reeks(b, L.length, (g, i, nr) => { const [bb, es] = L[i]; const S = linSum(es);
      mQ(g, st, save, 'e' + i, { nr, html:`${prodE(bb, es)} ${isq} {{m:a}}`, check:V=>chkM(V.a, {b:bb, e:S, fout:prodFout(es)}), hint:vermSteps(bb, es), meer:VM_MEER,
        sol:`${prodE(bb, es)} ${isq} ${mH(bb, S)}, want ${ePlus(es)} = ${linT(S)}` }); });
  } };

/* ---------- met letters, positieve exponent ---------- */
VM.letters = { title:'Met letters: schrijf met een positieve exponent', lvl:2,
  instr:`Schrijf als één macht met een <b>positieve</b> exponent. Is de exponent negatief? Klik dan op het breukicoontje (of typ <b>1/</b>) en schrijf de macht in de noemer.`,
  build(b, st, save){
    const R = makeR(st); const lets = R.shuffle(['a', 'b', 'p', 'x', 'y', 't']);
    const L = [[R.int(2, 4), -R.int(5, 8)], [-R.int(1, 4), -R.int(2, 4)], [R.int(4, 7), -R.int(1, 3)], [-R.int(3, 5), R.int(4, 6), 1], [-R.int(4, 7), 0], [R.int(1, 3), -R.int(2, 4), -R.int(2, 4)]];
    L[4][1] = -L[4][0] - 1; /* som -1: 1 gedeeld door de letter */
    L.forEach(es => { if(es.reduce((x, y) => x+y)===0) es[1] += es[1]<0 ? -1 : 1; });
    reeks(b, L.length, (g, i, nr) => { const es = L[i], x = lets[i]; const S = linSum(es);
      mQ(g, st, save, 'l' + i, { nr, html:`${prodE(x, es)} ${isq} {{m:a,i}}`, check:V=>chkM(V.a, {b:x, e:S, pos:true, fout:prodFout(es)}), hint:vermSteps(x, es, {pos:true}).slice(1), meer:VM_MEER,
        sol:`${prodE(x, es)} ${isq} ${mH(x, S)}` + (S.k<0 ? ` ${isq} ${brH('1', S.k===-1 ? bH(x) : mH(x, -S.k))}` : '') }); });
  } };

/* ---------- breuken en kommagetallen als grondtal ---------- */
VM.breuk = { title:'Breuken en kommagetallen als grondtal', lvl:2,
  instr:'Het grondtal blijft hetzelfde. Welke exponent hoort in het oranje vakje?',
  build(b, st, save){
    const R = makeR(st);
    const pos = R.shuffle(['2/3', '3/4', '1/2', '5/2', '4/7', '3/5']), neg = R.shuffle(['-3/4', '-2/5', '-1/3', '-5/2']), dc = R.shuffle(['0,5', '1,2', '0,3', '2,5']);
    const L = [[pos[0], [R.int(2, 4), R.int(2, 5)]], [dc[0], [R.int(3, 6), -R.int(1, 2)]], [neg[0], [-R.int(2, 3), R.int(4, 6)]], [pos[1], [R.int(3, 5), 1]], [dc[1], [-R.int(2, 4), -R.int(1, 3)]], [neg[1], [R.int(2, 3), -R.int(1, 2), R.int(3, 4)]]];
    reeks(b, L.length, (g, i, nr) => { const [bb, es] = L[i]; const S = linSum(es);
      mQ(g, st, save, 'b' + i, { nr, html:`${prodE(bb, es)} ${isq} ${mE(bb, 'a')}`, check:V=>chkE(V.a, S, prodFout(es)), hint:vermSteps(bb, es).slice(1, 2), meer:VM_MEER,
        sol:`${prodE(bb, es)} ${isq} ${mH(bb, S)}` }); });
  } };

/* ---------- als één macht en uitrekenen ---------- */
VM.reken = { title:'Schrijf als één macht en reken uit', lvl:2,
  instr:'Schrijf eerst als één macht. Reken die macht dan uit. Kies het teken in het tekenvak.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['2', [-5, 3]], ['-3', [2, 1]], ['10', [-4, 2]], ['5', [-3, 3]], ['-2', [-4, 1]], ['3', [-4, 2]], ['4', [-3, 2]], ['-2', [3, 2]], ['-1', [4, 3]], ['6', [-1, -1]]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, es] = L[i]; const S = es[0] + es[1]; const T = powQ(bb, S);
      mQ(g, st, save, 'r' + i, { nr, html:`${prodE(bb, es)} ${isq} ${mE(bb, 'a')} ${isq} {{u:b,t}}`,
        check:V=>allOf([['a', chkE(V.a, S, prodFout(es))], ['b', chkU(V.b, T, negFout(bb, S))]]),
        hint:[{u:'Tel de exponenten op.', line:`${ePlus(es)} ${isq} {{g:a}}`, check:V=>chkE(V.a, S), show:`${ePlus(es)} ${isq} ${S}`},
          S<0 ? {u:'Reken de macht uit: neem het omgekeerde.', line:`${mH(bb, S)} ${isq} ${brH('1', mH(bb, -S))} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), show:`${mH(bb, S)} ${isq} ${qH(T)}`}
            : {u:S===0 ? 'Een macht met exponent 0 is …' : 'Reken de macht uit. Let op het teken.', line:`${mH(bb, S)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), show:`${mH(bb, S)} ${isq} ${qH(T)}`}],
        sol:`${prodE(bb, es)} ${isq} ${mH(bb, S)} ${isq} ${qH(T)}` }); });
  } };

/* ---------- letters in de exponent ---------- */
VM.lexp = { title:'Letters in de exponent', lvl:2,
  instr:'Tel de exponenten op, ook als er een letter in staat. Typ de exponent in het oranje vakje, bijvoorbeeld <b>m-5</b> of <b>3k</b>.',
  build(b, st, save){
    const R = makeR(st); const n5 = R.int(2, 7), n3 = R.int(2, 6);
    const L = R.shuffle([['b', 'm', -n5], ['x', 'n', n3], ['a', '2k', 'k'], ['y', 'm+1', 'm'], ['2', 'n', 4], ['c', '-p', '3p']]);
    reeks(b, L.length, (g, i, nr) => { const [x, e1, e2] = L[i]; const S = linAdd(e1, e2);
      mQ(g, st, save, 'x' + i, { nr, html:`${mH(x, e1)} · ${mH(x, e2)} ${isq} ${mE(x, 'a')}`, check:V=>chkE(V.a, S),
        hint:[['Tel de exponenten op, net zoals bij getallen. Een voorbeeld met een andere letter:', `${mH('a', 'k')} · ${mH('a', 2)} ${isq} ${mH('a', 'k+2')} &nbsp; en &nbsp; ${mH('a', '3k')} · ${mH('a', 'k')} ${isq} ${mH('a', '4k')}`]],
        sol:`${mH(x, e1)} · ${mH(x, e2)} ${isq} ${mH(x, S)}` }); });
    const row = el('div', 'm4-wn'); b.append(row);
    qChoice(row, st, save, 'pos', { html:`<span class="m4-line" style="display:inline-flex">${mH('b', 'm')} · ${mH('b', -n5)} ${isq} ${mH('b', `m-${n5}`)}</span><span class="txt" style="display:block;margin-top:.4rem">Wanneer is die exponent positief?</span>`,
      opts:[['g', `als m &gt; ${n5}`], ['k', `als m &lt; ${n5}`], ['n', `als m &gt; ${MIN}${n5}`], ['i', `als m = ${n5}`]], ans:'g',
      why:`m − ${n5} is positief als m groter is dan ${n5}. Bijvoorbeeld m = ${n5+2}: ${n5+2} − ${n5} = 2.`, whyBad:`Probeer een getal: neem m = ${n5+2} en m = ${n5-1}. Wanneer is m − ${n5} positief?` });
  } };

/* ---------- verdieping: moeilijkere exponenten ---------- */
VM.lexp2 = { title:'Moeilijkere exponenten met letters', lvl:3,
  instr:'Schrijf als één macht. Soms moet je een getal eerst als macht schrijven.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([
      ['a', ['4m', '5m-3'], null], ['x', ['2m', 'm'], null], ['y', ['-3x', 'x+1'], null], ['b', ['a+1', '2a+2'], null],
      ['2', ['n'], [8, 3]], ['3', ['2k', 1], [9, 2]], ['5', ['1-2t', '3t'], null], ['10', ['-n'], [1000, 3]]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [x, es, extra] = L[i]; let S = linSum(es); if(extra) S = linAdd(S, extra[1]);
      const lh = prodE(x, es) + (extra ? ' · ' + extra[0] : '');
      mQ(g, st, save, 'y' + i, { nr, html:`${lh} ${isq} ${mE(x, 'a')}`, check:V=>chkE(V.a, S),
        sol:(extra ? `${extra[0]} = ${mH(x, extra[1])}, dus ` : '') + `${lh} ${isq} ${mH(x, S)}` }); });
  } };

/* ---------- verdieping: ontbrekende exponent ---------- */
VM.ontbr = { title:'De ontbrekende exponent', lvl:3,
  instr:'Welke exponent hoort in het oranje vakje?',
  build(b, st, save){
    const R = makeR(st);
    /* [grondtal, html-links met {{e:a}}, antwoord] */
    const k = R.int(2, 4), p = R.int(4, 7);
    const L = R.shuffle([
      ['a', `${mH('a', '-k')} · ${mE('a', 'a')} ${isq} ${mH('a', `k+${k}`)}`, `2k+${k}`],
      ['x', `${mH('x', p)} · ${mE('x', 'a')} ${isq} ${mH('x', -2)}`, -2-p],
      ['3', `${mE('3', 'a')} · ${mH('3', -4)} ${isq} ${brH('1', 27)}`, 1],
      ['y', `${mE('y', 'a')} · ${mH('y', 3)} · ${mH('y', -1)} ${isq} ${brH('1', mH('y', 4))}`, -6],
      ['10', `${mE('10', 'a')} · ${mH('10', 4)} ${isq} 0,001`, -7],
      ['-2', `${mH('-2', 3)} · ${mE('-2', 'a')} ${isq} ${brH('1', 4)}`, -5],
      ['m', `${mH('m', '2n')} · ${mE('m', 'a')} ${isq} ${mH('m', 0)}`, '-2n']]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [x, h, ans] = L[i];
      mQ(g, st, save, 'o' + i, { nr, html:h, check:V=>chkE(V.a, ans), sol:`De ontbrekende exponent is ${eH(ans)}.` }); });
  } };

/* ---------- verdieping: verklaar de rekenregel ---------- */
VM.verkl = { title:'Verklaar de rekenregel', lvl:3, keep:true,
  instr:'Waarom tel je de exponenten op? Zet de stappen van de verklaring in de juiste volgorde.',
  build(b, st, save){
    orderEx(b, st, save, 'o', { lab:'Jouw verklaring:', html:`<span class="m4-line" style="display:inline-flex">${mH('a', 'm')} · ${mH('a', 'p')} ${isq} ${mH('a', 'm+p')}</span>`, lines:[
      `${mH('a', 'm')} is een product van <i>m</i> factoren <i>a</i> en ${mH('a', 'p')} is een product van <i>p</i> factoren <i>a</i>.`,
      `Dus ${mH('a', 'm')} · ${mH('a', 'p')} ${isq} (<i>a</i> · <i>a</i> · … · <i>a</i>) · (<i>a</i> · <i>a</i> · … · <i>a</i>).`,
      'Samen is dat één product van <i>m</i> + <i>p</i> factoren <i>a</i>.',
      `Een product van <i>m</i> + <i>p</i> factoren <i>a</i> is ${mH('a', 'm+p')}.`],
      why:'Zo zie je waarom je bij het vermenigvuldigen de exponenten optelt.' });
  } };

SEC.verm = { id:'verm', ic:'m_verm', nav:'Machten vermenigvuldigen', title:'Machten met hetzelfde grondtal vermenigvuldigen',
  tip:'Het oranje vakje is de exponent. Laat je het leeg, dan is de exponent 1. Haakjes rond een negatief grondtal typ je zelf: <b>(-2)</b>.',
  cheat:CHEAT_VERM, cards:[VM.tegels, VM.som, VM.woorden, VM.een, VM.letters, VM.breuk, VM.reken, VM.lexp, VM.lexp2, VM.ontbr, VM.verkl] };

/* ============================================================
   ONDERDEEL 6 · MACHTEN DELEN
   eenzelfde grondtal: de exponenten aftrekken; eerst met :, daarna als breuk
   ============================================================ */
Object.assign(ICONS, {
  m_del:'<text x="1.5" y="18" font-size="11" font-weight="700" fill="currentColor" stroke="none">a:a</text><text x="18" y="9" font-size="7.5" font-weight="700" fill="currentColor" stroke="none">m</text>'
});
const CHEAT_DEL = `<h3>Spiekbriefje · machten delen</h3><table>
  <tr><td>rekenregel</td><td><div class="m4-line">${mH('a', 'm')} : ${mH('a', 'p')} ${isq} ${mH('a', 'm-p')}</div>Machten met hetzelfde grondtal delen: je behoudt het grondtal en je trekt de exponenten af (a ≠ 0).</td></tr>
  <tr><td>als breuk</td><td><div class="m4-line">${brH(mH('a', 'm'), mH('a', 'p'))} ${isq} ${mH('a', 'm-p')}</div></td></tr>
  <tr><td>voorbeeld</td><td><div class="m4-line">${mH('5', 7)} : ${mH('5', 3)} ${isq} ${mH('5', 4)}</div>want 7 − 3 = 4</td></tr>
  <tr><td>let op</td><td><div class="m4-line">${mH('2', 3)} : ${mH('2', -4)} ${isq} ${mH('2', 7)}</div>want 3 − (−4) = 3 + 4 = 7</td></tr></table>`;
/* exponenten aftrekken als tekst: 3 − (−4) */
const eMin = (m, p) => { const P = linOf(p); const pt = (P.c===0 && P.k<0) || P.c<0 || (P.c && P.k) ? `(${linT(P)})` : linT(P); return `${linT(m)} ${MIN} ${pt}`; };
const linSub = (a, b) => { a = linOf(a); b = linOf(b); return {c:a.c-b.c, k:a.k-b.k, v:a.v||b.v}; };
const qtH = (b, m, p, breuk) => breuk ? brH(m===1 ? bH(b) : mH(b, m), p===1 ? bH(b) : mH(b, p)) : `${m===1 ? bH(b) : mH(b, m)} : ${p===1 ? bH(b) : mH(b, p)}`;
function delSteps(b, m, p){ const S = linSub(m, p);
  return [{u:'Welk grondtal blijft staan?', line:'grondtal: {{b:a}}', check:V=>sameB(rdB(V.a), b), show:`grondtal: ${bH(b)}`},
    {u:'Trek de exponenten af: exponent van het deeltal min exponent van de deler.' + (typeof p==='number' && p<0 ? ' Aftrekken van een negatief getal is optellen.' : ''), line:`${eMin(m, p)} ${isq} {{g:a}}`, check:V=>chkE(V.a, S), show:`${eMin(m, p)} ${isq} ${linT(S)}`}]; }
const DL = {};

/* ---------- tegels schrappen ----------
   links de breuk met exponenten, rechts dezelfde breuk met factoren (elk een eigen breukstreep).
   k=0 beide breuken · k=1 paren tonen (g/g = 1) · k=2 schrappen, enkel op de tegels · k=3 resultaat */
function schrapSvg(g, m, p, k, t){
  const s = 34, d = 40, yT = 34, yN = 124, yM = (yT + s + yN)/2, xL = 42, xE = 98, x0 = 128; let out = '';
  const let_ = B(g).kind==='l'; const gt = let_ ? g : sg(g); const gs = let_ ? `<tspan font-style="italic">${g}</tspan>` : gt;
  const tile = (x, y, cls, op=1) => `<g opacity="${fx(op)}"><rect class="tegel ${cls}" x="${fx(x)}" y="${fx(y)}" width="${s}" height="${s}" rx="5"/><text class="t" x="${fx(x+s/2)}" y="${fx(y+s/2)}" text-anchor="middle" dominant-baseline="central"${let_ ? ' font-style="italic"' : ''}>${gt}</text></g>`;
  const macht = (x, y, e) => `<text class="t big" x="${fx(x)}" y="${fx(y)}" text-anchor="middle" dominant-baseline="central">${gs}<tspan class="sup" dy="-9">${e}</tspan></text>`;
  const bl = (x1, x2) => `<line class="brl" x1="${fx(x1)}" y1="${fx(yM)}" x2="${fx(x2)}" y2="${fx(yM)}" style="stroke-width:2.5"/>`;
  /* breuk met exponenten */
  out += macht(xL, yT + s/2, m) + bl(xL - 30, xL + 30) + macht(xL, yN + s/2, p);
  out += sT(xE, yM, '=', 't big');
  /* breuk met factoren */
  out += bl(x0 - 6, x0 + m*d - d + s + 6);
  const fade = k>=2 ? (k===2 ? 1 - .45*t : .55) : 1;
  for(let i=0; i<m; i++) out += tile(x0 + i*d, yT, '', i<p ? fade : 1);
  for(let j=0; j<p; j++) out += tile(x0 + j*d, yN, 'b', fade);
  /* paren: oranje kader rond de teller- en de noemertegel, geen lijn over de breukstreep */
  if(k===1) for(let j=0; j<p; j++){ const tt = Math.min(1, Math.max(0, t*p - j)); if(tt<=0) continue;
    [yT, yN].forEach(y => { out += `<rect x="${fx(x0 + j*d - 3)}" y="${fx(y - 3)}" width="${s+6}" height="${s+6}" rx="7" style="fill:none;stroke:var(--orange);stroke-width:3;opacity:${fx(tt)}"/>`; });
    out += sT(x0 + j*d + s/2, yN + s + 20, '= 1', 't'); }
  /* schrappen: een rode schuine streep binnen elke tegel */
  if(k>=2) for(let j=0; j<p; j++){ const tt = k===2 ? Math.min(1, Math.max(0, t*p*1.4 - j)) : 1; if(tt<=0) continue; const x = x0 + j*d;
    [yT, yN].forEach(y => { out += `<line x1="${fx(x + 4)}" y1="${fx(y + s - 4)}" x2="${fx(x + 4 + (s-8)*tt)}" y2="${fx(y + s - 4 - (s-8)*tt)}" style="stroke:var(--bad);stroke-width:3;stroke-linecap:round"/>`; }); }
  if(k>=3){ const xr = x0 + m*d - d + s + 30; out += sT(xr, yM, '=', 't big') + macht(xr + 40, yM, m-p) + sT(xr + 40, yM + 38, `${m} − ${p} = ${m-p}`, 'k'); }
  return out;
}
DL.schrap = { title:'Tegels schrappen', lvl:1, keep:true,
  instr:'Een deling is een breuk. Bekijk stap voor stap welke factoren je mag schrappen.',
  build(b, st, save){
    const R = makeR(st); const g = R.pick(['2', '3', 'a', 'x']); const p = R.int(2, 3), m = p + R.int(2, 4);
    const fac = n => Array(n).fill(bH(g)).join(' · ');
    const paren = Array(p).fill(brH(bH(g), bH(g))).join(' · ') + ' · ' + fac(m-p);
    const W = 128 + m*40 - 40 + 34 + 30 + 80;
    const wrap = el('div', 'm4-naast breed-l'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    stepFig(l, { W, H:200, maxw:620, alt:'een breuk met exponenten en dezelfde breuk met factoren als tegels', steps:[
      {cap:`Schrijf de deling als breuk. Een breuk met de exponenten is gelijk aan een breuk met de factoren:<div class="m4-line">${mH(g, m)} : ${mH(g, p)} ${isq} ${brH(mH(g, m), mH(g, p))} ${isq} ${brH(fac(m), fac(p))}</div>`, draw:t=>schrapSvg(g, m, p, 0, t)},
      {cap:`Gelijke factoren mogen geschrapt worden in teller en noemer. Waarom? Zet telkens een factor ${bH(g)} van de teller boven een factor ${bH(g)} van de noemer. Zo een breukje is 1, want een getal gedeeld door zichzelf is 1. En vermenigvuldigen met 1 verandert niets:<div class="m4-line">${brH(fac(m), fac(p))} ${isq} ${paren} ${isq} ${Array(p).fill('1').join(' · ')} · ${fac(m-p)}</div>`, draw:t=>schrapSvg(g, m, p, 1, t), ms:1600},
      {cap:`Schrap de ${p} paren: één streep op de factor in de teller en één op de factor in de noemer. De breukstreep schrap je niet. In de teller blijven er ${m-p} factoren over.`, draw:t=>schrapSvg(g, m, p, 2, t), ms:1600},
      {cap:`Er blijven ${m-p} factoren ${bH(g)} over, dus ${m} − ${p} ${isq} ${m-p}:<div class="m4-line">${mH(g, m)} : ${mH(g, p)} ${isq} ${mH(g, m-p)}</div>`, draw:t=>schrapSvg(g, m, p, 3, t)}] });
    r.append(el('p', '', 'Speel de stappen links af en vul in.'));
    const it = el('div', 'm4-items een'); r.append(it);
    mQ(it, st, save, 'f', { nr:'a)', html:`<span class="txt">Hoeveel factoren ${bH(g)} blijven er over?</span> {{g:a}}`, check:V=>chkE(V.a, m-p, [[m+p, 'Je telde alles samen. Tel enkel wat niet geschrapt is.']]) });
    mQ(it, st, save, 'm', { nr:'b)', html:`${mH(g, m)} : ${mH(g, p)} ${isq} ${mE(g, 'a')}`, check:V=>chkE(V.a, m-p, [[m+p, 'Bij delen trek je de exponenten af.']]),
      onOk:()=>{ if(!r.querySelector('.m4-regel')) r.append(el('div', 'm4-regel nieuw', `<div class="m4-line">${mH('a', 'm')} : ${mH('a', 'p')} ${isq} ${mH('a', 'm-p')}</div>Hetzelfde grondtal: trek de exponenten af.`)); } });
  } };

/* ---------- de rekenregel in woorden ---------- */
DL.woorden = { title:'De rekenregel in woorden', lvl:1,
  instr:'Sleep de juiste woorden naar de vakjes, of tik een woord aan en tik dan op een vakje.',
  build(b, st, save, key){
    const w = st.w || (st.w = {});
    bankEx(b, w, save, key, [
      {pre:'Machten met hetzelfde grondtal delen: je', ans:'behoudt het grondtal', why:'Het grondtal verandert niet.'},
      {pre:'en je', ans:'trekt de exponenten af', post:'.', why:'Je schrapt evenveel factoren als de deler heeft.'},
      {pre:`In symbolen: <span class="m4-line" style="display:inline-flex">${mH('a', 'm')} : ${mH('a', 'p')} ${isq} <i>a</i></span>`, ans:'m − p', why:''}],
      shuffle(['behoudt het grondtal', 'deelt de grondtallen', 'trekt de exponenten af', 'deelt de exponenten', 'm − p', 'm : p', 'm + p']));
    const rows = b.querySelectorAll('.bank-line');
    if(rows.length===3){ const fb0 = rows[0].querySelector('.fb'); [...rows[1].childNodes].forEach(n => { if(!(n.classList && (n.classList.contains('fb') || n.classList.contains('expr')))) rows[0].insertBefore(n, fb0); });
      rows[0].append(rows[1].querySelector('.fb')); rows[1].remove(); rows[2].querySelector('.blank').classList.add('m4-expblank'); }
    const row = el('div', 'm4-wn'); b.append(row);
    qChoice(row, st, save, 'ver', { html:`Kan je ${mH('6', 5)} : ${mH('2', 3)} met deze regel als één macht schrijven?`, opts:[['j', 'ja'], ['n', 'nee']], ans:'n',
      why:'De grondtallen zijn verschillend (6 en 2), dus de regel geldt niet.', whyBad:'Kijk naar de grondtallen: de regel geldt alleen bij hetzelfde grondtal.' });
  } };

/* ---------- schrijf als één macht (met :) ---------- */
function delPool(R){
  const g1 = String(R.pick([3, 7, 11])), m1 = R.int(6, 12), p1 = R.int(2, 5);
  const g2 = String(R.pick([2, 5, 6])), m2 = -R.int(2, 5), p2 = R.int(2, 6);
  const g3 = String(R.pick([10, 4])), m3 = R.int(2, 6), p3 = -R.int(2, 5);
  const g4 = R.pick(['-2', '-5']), m4 = R.int(5, 9), p4 = R.int(2, 4);
  const g5 = String(R.pick([8, 9])), m5 = R.int(4, 9);
  const g6 = String(R.pick([3, 6])), m6 = R.int(2, 4), p6 = m6 + R.int(2, 4);
  return [[g1, m1, p1], [g2, m2, p2], [g3, m3, p3], [g4, m4, p4], [g5, m5, 1], [g6, m6, p6]];
}
DL.een = { title:'Schrijf als één macht', lvl:2,
  instr:'Schrijf als één macht. Typ het grondtal en de exponent. Rond een negatief grondtal typ je zelf haakjes.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${mH('a', 'm')} : ${mH('a', 'p')} ${isq} ${mH('a', 'm-p')}</div>Hetzelfde grondtal: behoud het grondtal en trek de exponenten af.`);
    stapUitleg(b, [[`${mH('2', 3)} : ${mH('2', -4)}`, 'Hetzelfde grondtal: 2.'], [`${isq} ${mH('2', '3-(-4)')}`, 'Trek de exponenten af. Zet een negatieve exponent tussen haakjes.'], [`${isq} ${mH('2', 7)}`, '3 − (−4) = 3 + 4 = 7']], {kop:'Voorbeeld'});
    const R = makeR(st); const L = delPool(R);
    reeks(b, L.length, (g, i, nr) => { const [bb, m, p] = L[i]; const S = m - p;
      mQ(g, st, save, 'd' + i, { nr, html:`${qtH(bb, m, p)} ${isq} {{m:a}}`, check:V=>chkM(V.a, {b:bb, e:S, fout:[[m+p, 'Je telde de exponenten op. Bij delen trek je ze af.'], [p-m, 'Exponent van het deeltal min exponent van de deler, niet omgekeerd.']]}), hint:delSteps(bb, m, p).concat([['Schrijf de macht met dat grondtal en die exponent.']]),
        sol:`${qtH(bb, m, p)} ${isq} ${mH(bb, S)}, want ${eMin(m, p)} = ${S}` }); });
  } };

/* ---------- als breuk ---------- */
DL.breuk = { title:'Schrijf als één macht: de deling als breuk', lvl:2,
  instr:'Een breukstreep betekent delen. Schrijf als één macht.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${brH(mH('a', 'm'), mH('a', 'p'))} ${isq} ${mH('a', 'm-p')}</div>Exponent van de teller min exponent van de noemer.`);
    const R = makeR(st); const L = delPool(R);
    reeks(b, L.length, (g, i, nr) => { const [bb, m, p] = L[i]; const S = m - p;
      mQ(g, st, save, 'f' + i, { nr, html:`${qtH(bb, m, p, true)} ${isq} {{m:a}}`, check:V=>chkM(V.a, {b:bb, e:S, fout:[[m+p, 'Je telde de exponenten op. Trek ze af.'], [p-m, 'Exponent van de teller min exponent van de noemer.']]}), hint:delSteps(bb, m, p),
        sol:`${qtH(bb, m, p, true)} ${isq} ${mH(bb, S)}` }); });
  } };

/* ---------- aftrekken van een negatieve exponent ---------- */
DL.aftrek = { title:'Aftrekken van een negatieve exponent', lvl:2,
  instr:'Welke exponent hoort in het oranje vakje? Let op: aftrekken van een negatief getal is optellen.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([[R.int(2, 6), -R.int(2, 6)], [-R.int(2, 6), -R.int(2, 6)], [-R.int(1, 4), R.int(2, 5)], [0, -R.int(2, 5)], [-R.int(5, 9), -R.int(1, 4)], [R.int(1, 3), -1]]);
    const gs = R.shuffle(['2', '3', '5', '7', '10', 'a', 'x', 'y']);
    reeks(b, L.length, (g, i, nr) => { const [m, p] = L[i]; const bb = gs[i]; const S = m - p;
      mQ(g, st, save, 'a' + i, { nr, html:`${qtH(bb, m, p)} ${isq} ${mE(bb, 'a')}`, check:V=>chkE(V.a, S, [[m+p, 'Je telde op in plaats van af te trekken.'], [m - Math.abs(p), 'Aftrekken van een negatief getal is optellen: ' + eMin(m, p) + ' = ' + sg(S) + '.']]),
        hint:[{u:'Trek de exponenten af.', line:`${eMin(m, p)} ${isq} {{g:a}}`, check:V=>chkE(V.a, S), show:`${eMin(m, p)} ${isq} ${sg(S)}`}], sol:`${eMin(m, p)} = ${sg(S)}` }); });
  } };

/* ---------- met letters: positieve exponent ---------- */
DL.letters = { title:'Met letters: schrijf met een positieve exponent', lvl:2,
  instr:'Schrijf als één macht met een <b>positieve</b> exponent. Is de exponent negatief? Klik dan op het breukicoontje (of typ <b>1/</b>) en schrijf de macht in de noemer.',
  build(b, st, save){
    const R = makeR(st); const lets = R.shuffle(['a', 'b', 'p', 'x', 'y', 't']);
    const L = [[R.int(2, 4), R.int(6, 9)], [R.int(5, 8), R.int(2, 4)], [-R.int(1, 3), R.int(2, 4)], [R.int(2, 4), -R.int(2, 4)], [1, R.int(3, 5)], [-R.int(4, 6), -R.int(1, 3)]];
    reeks(b, L.length, (g, i, nr) => { const [m, p] = L[i], x = lets[i]; const S = m - p;
      mQ(g, st, save, 'l' + i, { nr, html:`${qtH(x, m, p, i%2===1)} ${isq} {{m:a,i}}`, check:V=>chkM(V.a, {b:x, e:S, pos:true, fout:[[m+p, 'Je telde de exponenten op. Trek ze af.']]}), hint:delSteps(x, m, p).slice(1),
        sol:`${qtH(x, m, p)} ${isq} ${mH(x, S)}` + (S<0 ? ` ${isq} ${brH('1', S===-1 ? bH(x) : mH(x, -S))}` : '') }); });
  } };

/* ---------- als één macht en uitrekenen ---------- */
DL.reken = { title:'Schrijf als één macht en reken uit', lvl:2,
  instr:'Schrijf eerst als één macht. Reken die macht dan uit. Kies het teken in het tekenvak.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['2', 3, 6], ['-3', 5, 2], ['10', -2, 1], ['5', 4, 6], ['-2', 1, 4], ['3', -1, 1], ['-1', 7, 2], ['4', 2, 2]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, m, p] = L[i]; const S = m - p; const T = powQ(bb, S);
      mQ(g, st, save, 'r' + i, { nr, html:`${qtH(bb, m, p)} ${isq} ${mE(bb, 'a')} ${isq} {{u:b,t}}`,
        check:V=>allOf([['a', chkE(V.a, S, [[m+p, 'Bij delen trek je de exponenten af.']])], ['b', chkU(V.b, T, negFout(bb, S))]]),
        hint:[{u:'Trek de exponenten af.', line:`${eMin(m, p)} ${isq} {{g:a}}`, check:V=>chkE(V.a, S), show:`${eMin(m, p)} ${isq} ${S}`},
          {u:S<0 ? 'Reken de macht uit: neem het omgekeerde.' : S===0 ? 'Exponent 0: …' : 'Reken de macht uit.', line:`${mH(bb, S)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), show:`${mH(bb, S)} ${isq} ${qH(T)}`}],
        sol:`${qtH(bb, m, p)} ${isq} ${mH(bb, S)} ${isq} ${qH(T)}` }); });
  } };

/* ---------- verdieping: breuken met letters ---------- */
DL.mix = { title:'Vermenigvuldigen en delen samen', lvl:3,
  instr:'Schrijf als één macht met een positieve exponent. Werk eerst de teller uit, dan de deling.',
  build(b, st, save){
    const R = makeR(st);
    /* [letter, exponenten teller, exponenten noemer] */
    const L = R.shuffle([['a', [3, -2], [4]], ['x', [5, 2], [-1, 3]], ['y', [-4], [2, 1]], ['b', [6, -1], [2, 2]], ['p', [2], [3, -4]], ['t', [-2, -3], [-6]]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [x, t, n] = L[i]; const S = t.reduce((a, c) => a+c, 0) - n.reduce((a, c) => a+c, 0);
      const h = brH(prodE(x, t), prodE(x, n));
      mQ(g, st, save, 'x' + i, { nr, html:`${h} ${isq} {{m:a,i}}`, check:V=>chkM(V.a, {b:x, e:S, pos:true}),
        sol:`${h} ${isq} ${brH(mH(x, t.reduce((a, c) => a+c, 0)), mH(x, n.reduce((a, c) => a+c, 0)))} ${isq} ${mH(x, S)}` + (S<0 ? ` ${isq} ${brH('1', S===-1 ? bH(x) : mH(x, -S))}` : '') }); });
  } };

/* ---------- verdieping: letters in de exponent ---------- */
DL.lexp = { title:'Letters in de exponent', lvl:3,
  instr:'Trek de exponenten af, ook als er een letter in staat. Typ de exponent, bijvoorbeeld <b>2m-6</b>.',
  build(b, st, save){
    const R = makeR(st); const k = R.int(2, 5);
    const L = R.shuffle([['f', '2m-4', 2], ['g', '-3x', '-5x+1'], ['a', 'n+3', 'n'], ['b', '3k', 'k-2'], ['2', 'n+5', k], ['c', '4p', '6p']]);
    reeks(b, L.length, (g, i, nr) => { const [x, m, p] = L[i]; const S = linSub(m, p);
      mQ(g, st, save, 'q' + i, { nr, html:`${mH(x, m)} : ${mH(x, p)} ${isq} ${mE(x, 'a')}`, check:V=>chkE(V.a, S, [[linAdd(m, p), 'Bij delen trek je af.']]),
        hint:[['Trek de exponenten af. Zet de exponent van de deler tussen haakjes: alle tekens erin keren om.', `${mH('a', '3k')} : ${mH('a', 'k-2')} ${isq} ${mH('a', '3k-(k-2)')} ${isq} ${mH('a', '2k+2')}`]],
        sol:`${mH(x, m)} : ${mH(x, p)} ${isq} ${mH(x, S)}` }); });
  } };

/* ---------- verdieping: verklaar ---------- */
DL.verkl = { title:'Verklaar de rekenregel', lvl:3, keep:true,
  instr:'Waarom trek je de exponenten af? Zet de stappen van de verklaring in de juiste volgorde.',
  build(b, st, save){
    orderEx(b, st, save, 'o', { lab:'Jouw verklaring:', html:`<span class="m4-line" style="display:inline-flex">${mH('a', 'm')} : ${mH('a', 'p')} ${isq} ${mH('a', 'm-p')} <span class="txt">(m &gt; p, a ≠ 0)</span></span>`, lines:[
      `${mH('a', 'm')} : ${mH('a', 'p')} ${isq} ${brH(mH('a', 'm'), mH('a', 'p'))}: een deling is een breuk.`,
      'In de teller staan <i>m</i> factoren <i>a</i>, in de noemer <i>p</i> factoren <i>a</i>.',
      'Je schrapt <i>p</i> factoren <i>a</i> in de teller en in de noemer.',
      `In de teller blijven <i>m</i> − <i>p</i> factoren <i>a</i> over: dat is ${mH('a', 'm-p')}.`],
      why:'Zo zie je waarom je bij het delen de exponenten aftrekt.' });
  } };

SEC.del = { id:'del', ic:'m_del', nav:'Machten delen', title:'Machten met hetzelfde grondtal delen',
  tip:'Exponent van het deeltal (of de teller) min exponent van de deler (of de noemer). Zet een negatieve exponent tussen haakjes als je aftrekt.',
  cheat:CHEAT_DEL, cards:[DL.schrap, DL.woorden, DL.een, DL.breuk, DL.aftrek, DL.letters, DL.reken, DL.mix, DL.lexp, DL.verkl] };
/* ============================================================
   ONDERDEEL 7 · MACHT VAN EEN MACHT
   (a^m)^p = a^(m·p): de exponenten vermenigvuldigen
   ============================================================ */
Object.assign(ICONS, {
  m_mm:'<text x="0" y="17" font-size="11" font-weight="700" fill="currentColor" stroke="none">(a</text><text x="13" y="10" font-size="7" font-weight="700" fill="currentColor" stroke="none">m</text><text x="17" y="17" font-size="11" font-weight="700" fill="currentColor" stroke="none">)</text><text x="21" y="8" font-size="7" font-weight="700" fill="currentColor" stroke="none">p</text>'
});
/* (a^m)^p in html */
const mmH = (b, m, p) => `<span class="m4-m">(${mH(b, m)})<sup class="m4-sup">${eH(p)}</sup></span>`;
const linMul = (a, b) => { a = linOf(a); b = linOf(b); if(a.c && b.c) return null; return a.c ? {c:a.c*b.k, k:a.k*b.k, v:a.v} : {c:b.c*a.k, k:a.k*b.k, v:b.v}; };
/* exponenten vermenigvuldigen als tekst: 3 · (−2) */
const eMul = (m, p) => [m, p].map((e, i) => { const L = linOf(e); return (i && ((L.c===0 && L.k<0) || L.c<0)) || (L.c && L.k) ? `(${linT(L)})` : linT(L); }).join(' · ');
const CHEAT_MM = `<h3>Spiekbriefje · macht van een macht</h3><table>
  <tr><td>rekenregel</td><td><div class="m4-line">${mmH('a', 'm', 'p')} ${isq} ${mH('a', 'm·p')}</div>Een macht tot een macht: je behoudt het grondtal en je vermenigvuldigt de exponenten.</td></tr>
  <tr><td>voorbeeld</td><td><div class="m4-line">${mmH('2', 3, 4)} ${isq} ${mH('2', 3)} · ${mH('2', 3)} · ${mH('2', 3)} · ${mH('2', 3)} ${isq} ${mH('2', 12)}</div>want 3 · 4 = 12</td></tr>
  <tr><td>negatieve exponent</td><td><div class="m4-line">${mmH('a', -2, 3)} ${isq} ${mH('a', -6)} ${isq} ${brH('1', mH('a', 6))}</div></td></tr>
  <tr><td>let op</td><td><div class="m4-line">${mH('a', 3)} · ${mH('a', 4)} ${isq} ${mH('a', 7)}</div>vermenigvuldigen van machten: optellen<div class="m4-line">${mmH('a', 3, 4)} ${isq} ${mH('a', 12)}</div>macht van een macht: vermenigvuldigen</td></tr></table>`;
function mmSteps(b, m, p, o={}){ const S = linMul(m, p);
  const st = [{u:'Welk grondtal blijft staan?', line:'grondtal: {{b:a}}', check:V=>sameB(rdB(V.a), b), show:`grondtal: ${bH(b)}`},
    {u:'Vermenigvuldig de exponenten.', line:`${eMul(m, p)} ${isq} {{g:a}}`, check:V=>chkE(V.a, S), show:`${eMul(m, p)} ${isq} ${linT(S)}`}];
  if(o.pos && linNum(S) && S.k<0) st.push([`De exponent is negatief. Klik op het breukicoontje (of typ <b>1/</b>): de macht komt in de noemer.`, `${mH(b, S)} ${isq} ${brH('1', mH(b, -S.k))}`]);
  return st; }
const MM = {};

/* ---------- groepjes tegels ---------- */
function groepSvg(g, m, p, k, t){
  const s = 38, d = 42, x0 = 84, y0 = 28, rh = 52; let out = ''; const let_ = B(g).kind==='l'; const gt = let_ ? g : sg(g);
  const tile = (x, y, cls) => `<rect class="tegel ${cls}" x="${fx(x)}" y="${fx(y)}" width="${s}" height="${s}" rx="5"/><text class="t" x="${fx(x+s/2)}" y="${fx(y+s/2)}" text-anchor="middle" dominant-baseline="central"${let_ ? ' font-style="italic"' : ''}>${gt}</text>`;
  const pw = (x, y, e, anc='end') => `<text class="t big" x="${x}" y="${y}" text-anchor="${anc}" dominant-baseline="central">${let_ ? `<tspan font-style="italic">${g}</tspan>` : gt}<tspan class="sup" dy="-9">${e}</tspan></text>`;
  const yL = y0 + p*rh + 18; const u = k===0 ? 0 : k===1 ? t : 1;
  for(let r=0; r<p; r++){
    const yr = y0 + r*rh;
    if(k<2) out += `<g opacity="${fx(1-u)}">${pw(x0 - 14, yr + s/2, m)}</g>`;
    if(k===0) out += `<rect x="${x0 - 6}" y="${yr - 5}" width="${m*d + 4}" height="${s + 10}" rx="8" style="fill:none;stroke:var(--tq);stroke-width:2;stroke-dasharray:5 4"/>`;
    for(let i=0; i<m; i++){ const x = lerp(x0 + i*d, x0 + (r*m + i)*d, u), y = lerp(yr, yL, u); out += tile(x, y, r%2 ? 'b' : ''); }
  }
  if(k===0) out += sT(x0 + m*d + 30, y0 + (p*rh)/2 - 8, `${p} keer`, 't', 'start');
  if(k>=2){ const xr = x0 + m*p*d - (d-s);
    out += `<path class="as" fill="none" d="M${x0} ${yL+s+8} v8 H${fx(xr)} v-8"/>` + pw(fx((x0+xr)/2), yL+s+36, m*p, 'middle') + sT((x0+xr)/2, yL+s+64, `${p} groepjes van ${m}: ${m} · ${p} = ${m*p} factoren`, 't'); }
  return out;
}
MM.groep = { title:'Groepjes tegels', lvl:1, keep:true,
  instr:'Bekijk stap voor stap wat een macht van een macht betekent. Vul daarna in.',
  build(b, st, save){
    const R = makeR(st); const g = R.pick(['2', '3', 'a', 'x']); const m = R.int(2, 3), p = m===3 ? R.int(2, 3) : R.int(2, 4);
    const H = 28 + p*52 + 18 + 38 + 80;
    const wrap = el('div', 'm4-naast breed-l'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    stepFig(l, { W:520, H, maxw:640, alt:'groepjes tegels van een macht van een macht', steps:[
      {cap:`${mmH(g, m, p)}: neem ${p} keer de macht ${mH(g, m)}.`, draw:t=>groepSvg(g, m, p, 0, t)},
      {cap:`${mmH(g, m, p)} ${isq} ${Array(p).fill(mH(g, m)).join(' · ')}: zet alle groepjes achter elkaar.`, draw:t=>groepSvg(g, m, p, 1, t), ms:1400},
      {cap:`Tel de factoren: ${p} groepjes van ${m}, dus ${m} · ${p} = ${m*p}.`, draw:t=>groepSvg(g, m, p, 2, t)}] });
    r.append(el('p', '', 'Speel de stappen links af en vul in.'));
    const it = el('div', 'm4-items een'); r.append(it);
    mQ(it, st, save, 'f', { nr:'a)', html:`<span class="txt">Hoeveel factoren ${bH(g)} zijn er samen?</span> {{g:a}}`, check:V=>chkE(V.a, m*p, [[m+p, 'Je telde de exponenten op. Tel de tegels: er zijn ' + p + ' groepjes van ' + m + '.']]) });
    mQ(it, st, save, 'm', { nr:'b)', html:`${mmH(g, m, p)} ${isq} ${mE(g, 'a')}`, check:V=>chkE(V.a, m*p, [[m+p, 'Bij een macht van een macht tel je niet op: je vermenigvuldigt.']]),
      onOk:()=>{ if(!r.querySelector('.m4-regel')) r.append(el('div', 'm4-regel nieuw', `<div class="m4-line">${mmH('a', 'm', 'p')} ${isq} ${mH('a', 'm·p')}</div>Behoud het grondtal en vermenigvuldig de exponenten.`)); } });
  } };

/* ---------- de rekenregel in woorden ---------- */
MM.woorden = { title:'De rekenregel in woorden', lvl:1,
  instr:'Sleep de juiste woorden naar de vakjes, of tik een woord aan en tik dan op een vakje.',
  build(b, st, save, key){
    const w = st.w || (st.w = {});
    bankEx(b, w, save, key, [
      {pre:'Een macht tot een macht: je', ans:'behoudt het grondtal', why:'Het grondtal verandert niet.'},
      {pre:'en je', ans:'vermenigvuldigt de exponenten', post:'.', why:'Je neemt p keer een groepje van m factoren.'},
      {pre:`In symbolen: <span class="m4-line" style="display:inline-flex">${mmH('a', 'm', 'p')} ${isq} <i>a</i></span>`, ans:'m · p', why:''}],
      shuffle(['behoudt het grondtal', 'vermenigvuldigt de grondtallen', 'vermenigvuldigt de exponenten', 'telt de exponenten op', 'm · p', 'm + p', 'm − p']));
    const rows = b.querySelectorAll('.bank-line');
    if(rows.length===3){ const fb0 = rows[0].querySelector('.fb'); [...rows[1].childNodes].forEach(n => { if(!(n.classList && (n.classList.contains('fb') || n.classList.contains('expr')))) rows[0].insertBefore(n, fb0); });
      rows[0].append(rows[1].querySelector('.fb')); rows[1].remove(); rows[2].querySelector('.blank').classList.add('m4-expblank'); }
    const row = el('div', 'm4-wn'); b.append(row);
    qChoice(row, st, save, 'ver', { html:`Is ${mmH('2', 3, 2)} hetzelfde als ${mH('2', 3)} · ${mH('2', 2)}?`, opts:[['j', 'ja'], ['n', 'nee']], ans:'n',
      why:`${mmH('2', 3, 2)} ${isq} ${mH('2', 3)} · ${mH('2', 3)} ${isq} ${mH('2', 6)}, maar ${mH('2', 3)} · ${mH('2', 2)} ${isq} ${mH('2', 5)}.`, whyBad:`Schrijf ${mmH('2', 3, 2)} uit: dat is ${mH('2', 3)} · ${mH('2', 3)}.` });
  } };

/* ---------- schrijf als één macht ---------- */
function mmPool(R){
  return [[String(R.pick([3, 5, 7])), R.int(2, 5), R.int(2, 4)], [String(R.pick([2, 6])), -R.int(2, 4), R.int(2, 3)], ['10', R.int(2, 4), -R.int(2, 3)],
    [R.pick(['-2', '-3']), R.int(2, 3), R.int(2, 3)], [String(R.pick([4, 9])), -R.int(1, 3), -R.int(2, 4)], [String(R.pick([5, 8])), R.int(3, 7), 0]];
}
MM.een = { title:'Schrijf als één macht', lvl:2,
  instr:'Schrijf als één macht. Typ het grondtal en de exponent. Rond een negatief grondtal typ je zelf haakjes.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${mmH('a', 'm', 'p')} ${isq} ${mH('a', 'm·p')}</div>Een macht tot een macht: behoud het grondtal en vermenigvuldig de exponenten.`);
    stapUitleg(b, [[mmH('5', -2, 3), 'Hetzelfde grondtal: 5.'], [`${isq} ${mH('5', '(-2)·3')}`, 'Vermenigvuldig de exponenten.'], [`${isq} ${mH('5', -6)}`, '(−2) · 3 = −6']], {kop:'Voorbeeld'});
    const R = makeR(st); const L = mmPool(R);
    reeks(b, L.length, (g, i, nr) => { const [bb, m, p] = L[i]; const S = m*p;
      mQ(g, st, save, 'm' + i, { nr, html:`${mmH(bb, m, p)} ${isq} {{m:a}}`, check:V=>chkM(V.a, {b:bb, e:S, fout:[[m+p, 'Je telde de exponenten op. Bij een macht van een macht vermenigvuldig je ze.']]}),
        hint:mmSteps(bb, m, p).concat([['Schrijf de macht met dat grondtal en die exponent.' + (B(bb).neg ? ' Typ haakjes rond het grondtal.' : '')]]), sol:`${mmH(bb, m, p)} ${isq} ${mH(bb, S)}, want ${eMul(m, p)} = ${S}` }); });
  } };

/* ---------- optellen of vermenigvuldigen? ---------- */
MM.welke = { title:'Optellen of vermenigvuldigen?', lvl:2,
  instr:'Wat doe je met de exponenten? Kies, en schrijf daarna als één macht.',
  build(b, st, save){
    const R = makeR(st); const lets = R.shuffle(['a', 'b', 'x', 'y', 't', 'p']);
    const L = R.shuffle([['v', 2, 5], ['m', 3, 4], ['v', -2, 6], ['m', -3, 2], ['v', 4, 4], ['m', 5, 1]]);
    const OPTS = [['+', 'optellen'], ['x', 'vermenigvuldigen']];
    reeks(b, L.length, (g, i, nr) => { const [t, m, p] = L[i]; const x = lets[i]; const h = t==='v' ? `${mH(x, m)} · ${mH(x, p)}` : mmH(x, m, p); const S = t==='v' ? m + p : m*p; const W = t==='v' ? m*p : m + p;
      const row = el('div', 'm4-wn'); g.append(row); const it = el('div', 'm4-items een');
      qChoice(row, st, save, 'k' + i, { nr, html:`<span class="m4-line" style="display:inline-flex">${h}</span>`, opts:OPTS, ans:t==='v' ? '+' : 'x',
        why:t==='v' ? 'Machten met hetzelfde grondtal vermenigvuldigen: exponenten optellen.' : 'Een macht van een macht: exponenten vermenigvuldigen.', whyBad:t==='v' ? 'Er staan twee machten naast elkaar met een maalteken: dat is vermenigvuldigen van machten.' : 'Er staat een macht tussen haakjes met een exponent erbuiten: een macht van een macht.' });
      row.append(it);
      mQ(it, st, save, 'e' + i, { html:`${h} ${isq} ${mE(x, 'a')}`, check:V=>chkE(V.a, S, [[W, t==='v' ? 'Je vermenigvuldigde. Bij een product van machten tel je op.' : 'Je telde op. Bij een macht van een macht vermenigvuldig je.']]), sol:`${h} ${isq} ${mH(x, S)}` }); });
  } };

/* ---------- met letters: positieve exponent ---------- */
MM.pos = { title:'Met letters: schrijf met een positieve exponent', lvl:2,
  instr:'Schrijf als één macht met een <b>positieve</b> exponent. Is de exponent negatief? Klik dan op het breukicoontje (of typ <b>1/</b>) en schrijf de macht in de noemer.',
  build(b, st, save){
    const R = makeR(st); const lets = R.shuffle(['a', 'b', 'p', 'x', 'y', 't']);
    const L = R.shuffle([[-R.int(2, 3), R.int(2, 4)], [R.int(2, 5), -R.int(1, 3)], [-R.int(1, 4), -R.int(2, 3)], [R.int(2, 4), R.int(2, 3)], [-1, R.int(4, 7)], [R.int(3, 6), -1]]);
    reeks(b, L.length, (g, i, nr) => { const [m, p] = L[i], x = lets[i]; const S = m*p;
      mQ(g, st, save, 'p' + i, { nr, html:`${mmH(x, m, p)} ${isq} {{m:a,i}}`, check:V=>chkM(V.a, {b:x, e:S, pos:true, fout:[[m+p, 'Je telde de exponenten op. Vermenigvuldig ze.'], [-S, 'Kijk naar het teken: ' + eMul(m, p) + ' = ' + sg(S) + '.']]}), hint:mmSteps(x, m, p, {pos:true}).slice(1),
        sol:`${mmH(x, m, p)} ${isq} ${mH(x, S)}` + (S<0 ? ` ${isq} ${brH('1', mH(x, -S))}` : '') }); });
  } };

/* ---------- ontbrekende exponent ---------- */
MM.ontbr = { title:'Welke exponent ontbreekt?', lvl:2,
  instr:'Welke exponent hoort in het oranje vakje?',
  build(b, st, save){
    const R = makeR(st); const lets = R.shuffle(['a', 'b', 'x', 'y', 'c', 'k']);
    /* [binnen of buiten ontbreekt, bekende exponent, uitkomst-exponent, als breuk tonen] */
    const L = R.shuffle([['u', 2, 10], ['i', 3, 12], ['u', -2, 8], ['i', 4, -8], ['u', 2, -6, true], ['i', -3, 9]]);
    reeks(b, L.length, (g, i, nr) => { const [w, k, S, br] = L[i]; const x = lets[i]; const ans = S / k;
      const h = w==='u' ? `<span class="m4-m">(${mH(x, k)})<sup class="m4-sup">{{e:a}}</sup></span>` : `<span class="m4-m">(${mE(x, 'a')})<sup class="m4-sup">${eH(k)}</sup></span>`;
      const rhs = br ? brH('1', mH(x, -S)) : mH(x, S);
      mQ(g, st, save, 'o' + i, { nr, html:`${h} ${isq} ${rhs}`, check:V=>chkE(V.a, ans, [[S - k, 'Je trok af. Bij een macht van een macht vermenigvuldig je: welk getal maal ' + sg(k) + ' geeft ' + sg(S) + '?'], [-ans, 'Kijk naar het teken.']]),
        hint:[[br ? `Schrijf eerst ${rhs} als een macht met een negatieve exponent: ${mH(x, S)}.` : 'De exponenten worden vermenigvuldigd.', `${sg(k)} · ? ${isq} ${sg(S)}`]], sol:`${sg(k)} · ${sg(ans)} = ${sg(S)}` }); });
  } };

/* ---------- uitrekenen: let op het teken ---------- */
MM.reken = { title:'Reken uit: let op het teken', lvl:2,
  instr:'Reken uit. Kies het teken in het tekenvak. Kijk goed waar de haakjes staan.',
  build(b, st, save){
    const R = makeR(st);
    /* [html, waarde, fout-waarde met uitleg] */
    const p2 = (h, e) => `<span class="m4-m">(${h})<sup class="m4-sup">${eH(e)}</sup></span>`;
    const L = R.shuffle([
      [mmH('-2', 2, 3), Q(64)], [mmH('-2', 3, 2), Q(64)], [p2(minH(mH('2', 2)), 3), Q(-64), [[Q(64), `${minH(mH('2', 2))} ${isq} ${MIN}4: het minteken hoort niet bij het grondtal 2.`]]],
      [minH(mmH('3', 2, 2)), Q(-81), [[Q(81), 'Het minteken staat vóór de macht: het hoort niet bij het grondtal.']]], [mmH('-1', 3, 5), Q(-1)], [mmH('-10', 2, -1), Q(1, 100)], [mmH('2', -1, 3), Q(1, 8)], [p2(minH(mH('1', 4)), 3), Q(-1)]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [h, T, fout] = L[i];
      mQ(g, st, save, 'r' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T, fout),
        hint:[['Werk eerst de macht tussen de haakjes uit (of vermenigvuldig de exponenten). Kijk daarna naar het teken: hoort het minteken bij het grondtal?']], sol:`${h} ${isq} ${qH(T)}` }); });
  } };

/* ---------- verdieping: letters in de exponent ---------- */
MM.lexp = { title:'Letters in de exponent', lvl:3,
  instr:'Vermenigvuldig de exponenten, ook als er een letter in staat. Typ de exponent, bijvoorbeeld <b>3n+6</b>.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['a', 'n+2', 3], ['x', 2, 'k'], ['b', '2m', -1], ['2', 'n', 4], ['y', '3-n', 2], ['c', -2, 'p+1']]);
    reeks(b, L.length, (g, i, nr) => { const [x, m, p] = L[i]; const S = linMul(m, p);
      mQ(g, st, save, 'q' + i, { nr, html:`${mmH(x, m, p)} ${isq} ${mE(x, 'a')}`, check:V=>chkE(V.a, S, [[linAdd(m, p), 'Je telde op. Vermenigvuldig de exponenten.']]),
        hint:[['Vermenigvuldig de exponenten. Staat er een som tussen haakjes, vermenigvuldig dan elke term.', `${mmH('a', 'n+2', 3)} ${isq} ${mH('a', '3(n+2)')} ${isq} ${mH('a', '3n+6')}`]],
        sol:`${mmH(x, m, p)} ${isq} ${mH(x, S)}` }); });
  } };

/* ---------- verdieping: slim rekenen ---------- */
MM.slim = { title:'Slim rekenen: zelfde grondtal maken', lvl:3,
  instr:'Schrijf het grondtal als een macht. Welke exponent hoort in het oranje vakje?',
  build(b, st, save){
    const R = makeR(st);
    /* [opgave-html, grondtal, exponent, uitleg] */
    const a = R.int(3, 6), c = R.int(2, 4), d = R.int(2, 5), f = R.int(2, 4);
    const L = [[mH('4', a), '2', 2*a, `4 ${isq} ${mH('2', 2)}, dus ${mH('4', a)} ${isq} ${mmH('2', 2, a)}`],
      [mH('8', c), '2', 3*c, `8 ${isq} ${mH('2', 3)}`], [mH('9', -d), '3', -2*d, `9 ${isq} ${mH('3', 2)}`],
      [mH('100', f), '10', 2*f, `100 ${isq} ${mH('10', 2)}`], [`${mH('4', 3)} · ${mH('2', 5)}`, '2', 11, `${mH('4', 3)} ${isq} ${mH('2', 6)}, en 6 + 5 = 11`],
      [`${mH('27', 2)} : ${mH('3', 4)}`, '3', 2, `${mH('27', 2)} ${isq} ${mH('3', 6)}, en 6 − 4 = 2`]];
    reeks(b, L.length, (g, i, nr) => { const [h, bb, S, u] = L[i];
      mQ(g, st, save, 's' + i, { nr, html:`${h} ${isq} ${mE(bb, 'a')}`, check:V=>chkE(V.a, S), hint:[[`Schrijf het grondtal als een macht van ${bb}.`, u]], sol:`${h} ${isq} ${mH(bb, S)}: ${u}` }); });
  } };

/* ---------- verdieping: verklaar ---------- */
MM.verkl = { title:'Verklaar de rekenregel', lvl:3, keep:true,
  instr:'Waarom vermenigvuldig je de exponenten? Zet de stappen van de verklaring in de juiste volgorde.',
  build(b, st, save){
    orderEx(b, st, save, 'o', { lab:'Jouw verklaring:', html:`<span class="m4-line" style="display:inline-flex">${mmH('a', 'm', 'p')} ${isq} ${mH('a', 'm·p')}</span>`, lines:[
      `${mmH('a', 'm', 'p')} is een product van <i>p</i> factoren ${mH('a', 'm')}.`,
      `Machten met hetzelfde grondtal vermenigvuldigen: je telt de exponenten op.`,
      `Je telt <i>p</i> keer de exponent <i>m</i> op: <i>m</i> + <i>m</i> + … + <i>m</i>.`,
      `<i>p</i> keer <i>m</i> is <i>m</i> · <i>p</i>, dus je krijgt ${mH('a', 'm·p')}.`],
      why:'Een macht van een macht is een herhaald product: daarom vermenigvuldig je.' });
  } };

SEC.mm = { id:'mm', ic:'m_mm', nav:'Macht van een macht', title:'Macht van een macht',
  tip:'Een macht tot een macht: vermenigvuldig de exponenten. Twee machten met hetzelfde grondtal vermenigvuldigen: tel de exponenten op.',
  cheat:CHEAT_MM, cards:[MM.groep, MM.woorden, MM.een, MM.welke, MM.pos, MM.ontbr, MM.reken, MM.lexp, MM.slim, MM.verkl] };
/* ============================================================
   ONDERDEEL 8 · MACHT VAN EEN PRODUCT
   (a·b)^n = a^n · b^n: elke factor tot de macht
   ============================================================ */
Object.assign(ICONS, {
  m_prod:'<text x="0" y="17" font-size="10" font-weight="700" fill="currentColor" stroke="none">(ab)</text><text x="21" y="8" font-size="7" font-weight="700" fill="currentColor" stroke="none">n</text>'
});
/* (c·x^m·y^k)^p in html: coëfficiënt c (1 en −1 zonder cijfer), factoren [[x, m], ...] */
const coefH = c => c===1 ? '' : c===-1 ? MIN : sg(c);
const facH = fs => fs.map(([x, m]) => m===1 ? bH(x) : mH(x, m)).join('');
const pPH = (c, fs, p) => `<span class="m4-m">(${coefH(c)}${facH(fs)})<sup class="m4-sup">${eH(p)}</sup></span>`;
/* het antwoord: coëfficiënt-vak en per letter een exponent-vak */
const pAnt = fs => fs.map(([x], i) => mE(x, 'abcd'[i])).join('');
const CHEAT_PROD = `<h3>Spiekbriefje · macht van een product</h3><table>
  <tr><td>rekenregel</td><td><div class="m4-line"><span class="m4-m">(<i>a</i> · <i>b</i>)<sup class="m4-sup"><i>n</i></sup></span> ${isq} ${mH('a', 'n')} · ${mH('b', 'n')}</div>Een product tot een macht: je verheft elke factor tot die macht.</td></tr>
  <tr><td>met een getal</td><td><div class="m4-line">${pPH(-2, [['a', 3]], 2)} ${isq} ${mH('-2', 2)} · ${mmH('a', 3, 2)} ${isq} 4${mH('a', 6)}</div>vergeet het getal niet</td></tr>
  <tr><td>slim rekenen</td><td><div class="m4-line">${mH('2', 3)} · ${mH('5', 3)} ${isq} <span class="m4-m">(2 · 5)<sup class="m4-sup">3</sup></span> ${isq} ${mH('10', 3)} ${isq} 1000</div>zelfde exponent: eerst de grondtallen vermenigvuldigen</td></tr>
  <tr><td>let op</td><td><div class="m4-line"><span class="m4-m">(<i>a</i> + <i>b</i>)<sup class="m4-sup">2</sup></span> ≠ ${mH('a', 2)} + ${mH('b', 2)}</div>de regel geldt niet voor een som</td></tr></table>`;
const PR = {};

/* ---------- animatie: factoren sorteren ---------- */
function sorteerSvg(a, b, n, k, t){
  const s = 38, d = 44, gp = 22, x0 = 30, y0 = 50; let out = '';
  const la = B(a).kind==='l', lb = B(b).kind==='l';
  const tile = (x, y, cls, g, it) => `<rect class="tegel ${cls}" x="${fx(x)}" y="${fx(y)}" width="${s}" height="${s}" rx="5"/><text class="t" x="${fx(x+s/2)}" y="${fx(y+s/2)}" text-anchor="middle" dominant-baseline="central"${it ? ' font-style="italic"' : ''}>${it ? g : sg(g)}</text>`;
  const u = k===0 ? 0 : k===1 ? t : 1;
  for(let i=0; i<n; i++){
    const xg = x0 + i*(2*d + gp);
    const xa = lerp(xg, x0 + i*d, u), xb = lerp(xg + d, x0 + n*d + gp + i*d, u);
    if(k===0) out += `<rect x="${xg - 5}" y="${y0 - 5}" width="${2*d + 2}" height="${s + 10}" rx="8" style="fill:none;stroke:var(--tq);stroke-width:2;stroke-dasharray:5 4"/>`;
    out += tile(xa, y0, '', a, la) + tile(xb, y0, 'b', b, lb);
  }
  if(k===0) out += sT(x0 + n*(2*d + gp) / 2, y0 + s + 34, `${n} keer het product ${la ? a : sg(a)} · ${lb ? b : sg(b)}`, 't');
  if(k>=2){ const xa2 = x0 + n*d - (d-s), xb1 = x0 + n*d + gp, xb2 = xb1 + n*d - (d-s);
    const pw = (x, g, it) => `<text class="t big" x="${fx(x)}" y="${y0+s+36}" text-anchor="middle" dominant-baseline="central">${it ? `<tspan font-style="italic">${g}</tspan>` : sg(g)}<tspan class="sup" dy="-9">${n}</tspan></text>`;
    out += `<path class="as" fill="none" d="M${x0} ${y0+s+8} v8 H${fx(xa2)} v-8"/><path class="as" fill="none" d="M${xb1} ${y0+s+8} v8 H${fx(xb2)} v-8"/>`;
    out += pw((x0+xa2)/2, a, la) + sT((xa2 + xb1)/2, y0+s+36, '·', 'big') + pw((xb1+xb2)/2, b, lb); }
  return out;
}
PR.sorteer = { title:'Factoren sorteren', lvl:1, keep:true,
  instr:'Bekijk stap voor stap wat er gebeurt als je een product tot een macht verheft. Vul daarna in.',
  build(b, st, save){
    const R = makeR(st); const [fa, fb] = R.pick([['2', '3'], ['a', 'b'], ['3', 'x'], ['x', 'y']]); const n = R.int(2, 4);
    const W = 520, H = 160;
    const PH = `<span class="m4-m">(${bH(fa)} · ${bH(fb)})<sup class="m4-sup">${n}</sup></span>`;
    const wrap = el('div', 'm4-naast breed-l'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    stepFig(l, { W, H, maxw:640, alt:'factoren van een product tot een macht', steps:[
      {cap:`${PH}: ${n} keer het product ${bH(fa)} · ${bH(fb)}.`, draw:t=>sorteerSvg(fa, fb, n, 0, t)},
      {cap:'Bij vermenigvuldigen mag je de volgorde veranderen: zet gelijke factoren samen.', draw:t=>sorteerSvg(fa, fb, n, 1, t), ms:1500},
      {cap:`${PH} ${isq} ${mH(fa, n)} · ${mH(fb, n)}`, draw:t=>sorteerSvg(fa, fb, n, 2, t)}] });
    r.append(el('p', '', 'Speel de stappen links af en vul in.'));
    const it = el('div', 'm4-items een'); r.append(it);
    mQ(it, st, save, 'm', { nr:'a)', html:`${PH} ${isq} ${mE(fa, 'a')} · ${mE(fb, 'b')}`, check:V=>allOf([['a', chkE(V.a, n)], ['b', chkE(V.b, n)]]),
      onOk:()=>{ if(!r.querySelector('.m4-regel')) r.append(el('div', 'm4-regel nieuw', `<div class="m4-line"><span class="m4-m">(<i>a</i> · <i>b</i>)<sup class="m4-sup"><i>n</i></sup></span> ${isq} ${mH('a', 'n')} · ${mH('b', 'n')}</div>Verhef elke factor tot de macht.`)); } });
  } };

/* ---------- de rekenregel in woorden ---------- */
PR.woorden = { title:'De rekenregel in woorden', lvl:1,
  instr:'Sleep de juiste woorden naar de vakjes, of tik een woord aan en tik dan op een vakje.',
  build(b, st, save, key){
    const w = st.w || (st.w = {});
    bankEx(b, w, save, key, [
      {pre:'Een product tot een macht: je verheft', ans:'elke factor', post:'tot die macht.', why:'Elke factor komt n keer voor.'},
      {pre:`In symbolen: <span class="m4-line" style="display:inline-flex"><span class="m4-m">(<i>a</i> · <i>b</i>)<sup class="m4-sup"><i>n</i></sup></span> ${isq} ${mH('a', 'n')} · <i>b</i></span>`, ans:'n', why:''}],
      shuffle(['elke factor', 'enkel de eerste factor', 'enkel de letters', 'n', '2n', '1']));
    const rows = b.querySelectorAll('.bank-line'); if(rows.length===2) rows[1].querySelector('.blank').classList.add('m4-expblank');
    const row = el('div', 'm4-wn'); b.append(row);
    qChoice(row, st, save, 'som', { html:`Geldt de regel ook voor een som? Is <span class="m4-m">(<i>a</i> + <i>b</i>)<sup class="m4-sup">2</sup></span> ${isq} ${mH('a', 2)} + ${mH('b', 2)}?`, opts:[['j', 'ja'], ['n', 'nee']], ans:'n',
      why:`Neem <i>a</i> = 1 en <i>b</i> = 2: (1 + 2)<sup>2</sup> = 9, maar ${mH('1', 2)} + ${mH('2', 2)} = 5. De regel geldt enkel voor een product.`, whyBad:'Probeer het met getallen: neem a = 1 en b = 2.' });
  } };

/* ---------- werk uit ---------- */
function prodPool(R){
  const L = R.shuffle(['a', 'b', 'x', 'y']); const [x, y] = [L[0], L[1]].sort();
  return [[R.pick([2, 3]), [[x, 1]], R.int(2, 4)], [-R.pick([2, 3]), [[x, R.int(2, 3)]], 3], [R.pick([4, 5]), [[x, R.int(2, 4)]], 2],
    [-10, [[x, R.int(2, 5)], [y, 1]], R.int(2, 3)], [R.pick([3, 10]), [[x, 2], [y, R.int(2, 3)]], 2], [-R.pick([2, 5]), [[x, 1], [y, R.int(3, 4)]], 2]];
}
PR.werk = { title:'Werk uit', lvl:2, brk:false,
  instr:'Verhef elke factor tot de macht: het getal én elke letter. Kies het teken van het getal in het tekenvak.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line"><span class="m4-m">(<i>a</i> · <i>b</i>)<sup class="m4-sup"><i>n</i></sup></span> ${isq} ${mH('a', 'n')} · ${mH('b', 'n')}</div>Een product tot een macht: verhef elke factor tot die macht.`);
    stapUitleg(b, [[pPH(-2, [['a', 3]], 3), 'Drie factoren: −2 en a³.'], [`${isq} ${mH('-2', 3)} · ${mmH('a', 3, 3)}`, 'Verhef elke factor tot de derde macht.'], [`${isq} ${MIN}8${mH('a', 9)}`, '(−2)³ = −8 en 3 · 3 = 9']], {kop:'Voorbeeld'});
    const R = makeR(st); const L = prodPool(R);
    reeks(b, L.length, (g, i, nr) => { const [c, fs, p] = L[i]; const C = qPow(Q(c), p); const h = pPH(c, fs, p);
      mQ(g, st, save, 'w' + i, { nr, html:`${h} ${isq} {{u:c,t}}${pAnt(fs)}`,
        check:V=>allOf([['c', chkU(V.c, C, [[Q(c*p), `Je vermenigvuldigde ${sg(c)} met ${p}. Neem ${sg(c)} ${p} keer als factor.`], [Q(c), 'Vergeet het getal niet tot de macht te verheffen.']])],
          ...fs.map(([x, m], j) => ['abcd'[j], chkE(V['abcd'[j]], m*p, [[m+p, 'Een macht van een macht: vermenigvuldig de exponenten.'], [m, `Verhef ook ${bH(x)} tot de macht.`]])])]),
        hint:[{u:`Verhef het getal ${sg(c)} tot de macht ${p}.`, line:`${mH(String(c), p)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, C), show:`${mH(String(c), p)} ${isq} ${qH(C)}`},
          ...fs.map(([x, m]) => ({u:`Verhef ${m===1 ? bH(x) : mH(x, m)} tot de macht ${p}.`, line:`${m===1 ? `<span class="m4-m">${bH(x)}<sup class="m4-sup">${p}</sup></span>` : mmH(x, m, p)} ${isq} ${mE(x, 'a')}`, check:V=>chkE(V.a, m*p), show:`${mH(x, m*p)}`}))],
        sol:`${h} ${isq} ${qH(C)}${fs.map(([x, m]) => mH(x, m*p)).join('')}` }); });
  } };

/* ---------- waar of niet waar ---------- */
PR.wn = { title:'Waar of niet waar?', lvl:2,
  instr:'Is de gelijkheid waar of niet waar? Let op het getal en het teken.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([[`${pPH(2, [['a', 1]], 3)} ${isq} 2${mH('a', 3)}`, 'n', 'Ook het getal 2 gaat tot de derde macht: 8<i>a</i><sup>3</sup>.'],
      [`${pPH(3, [['x', 1]], 2)} ${isq} 9${mH('x', 2)}`, 'w', ''], [`${pPH(-1, [['a', 1]], 2)} ${isq} ${mH('a', 2)}`, 'w', ''],
      [`${pPH(-2, [['b', 1]], 3)} ${isq} 8${mH('b', 3)}`, 'n', '(−2)³ = −8: een oneven exponent houdt het minteken.'], [`${pPH(1, [['a', 1], ['b', 1]], 4)} ${isq} ${mH('a', 4)}${mH('b', 4)}`, 'w', ''],
      [`<span class="m4-m">(<i>a</i> + <i>b</i>)<sup class="m4-sup">2</sup></span> ${isq} ${mH('a', 2)} + ${mH('b', 2)}`, 'n', 'De regel geldt niet voor een som.'], [`${minH(pPH(2, [['a', 1]], 2))} ${isq} ${MIN}4${mH('a', 2)}`, 'w', ''],
      [`${pPH(2, [['a', 2]], 3)} ${isq} 6${mH('a', 6)}`, 'n', '2³ = 8, niet 6.']]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    L.forEach(([h, ans, why], i) => { const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'v' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h}</span>`, opts:WN, ans, why:why || 'Elke factor gaat tot de macht.', whyBad:why || 'Verhef elke factor tot de macht, ook het getal en het minteken.' }); });
  } };

/* ---------- slim rekenen ---------- */
PR.slim = { title:'Slim rekenen: zelfde exponent', lvl:2, brk:false,
  instr:'Dezelfde exponent? Vermenigvuldig eerst de grondtallen. Reken zo uit zonder rekenmachine.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['2', '5', 3], ['4', '25', 2], ['0,5', '2', R.int(4, 9)], ['20', '5', 3], ['0,25', '4', R.int(3, 7)], ['2', '50', 2], ['5', '2', R.int(4, 6)]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [x, y, n] = L[i]; const P = qMul(bVal(x), bVal(y)); const T = qPow(P, n); const h = `${mH(x, n)} · ${mH(y, n)}`;
      mQ(g, st, save, 's' + i, { nr, html:`${h} ${isq} <span class="m4-m">({{g:b}})<sup class="m4-sup">${n}</sup></span> ${isq} {{u:a}}`,
        check:V=>allOf([['b', (() => { const v = rdG((V.b||{}).t); return !v ? {info:true, msg:'Vermenigvuldig de grondtallen en typ dat getal tussen de haakjes.'} : {ok:qEq(v, P)}; })()], ['a', chkU(V.a, T)]]),
        hint:[[`Dezelfde exponent ${n}: ${h} ${isq} (${sg(x)} · ${sg(y)})<sup>${n}</sup>. Hoeveel is ${sg(x)} · ${sg(y)}?`]], sol:`${h} ${isq} (${sg(x)} · ${sg(y)})<sup>${n}</sup> ${isq} ${mH(qS(P), n)} ${isq} ${qH(T)}` }); });
  } };

/* ---------- negatieve exponent ---------- */
PR.neg = { title:'Met een negatieve exponent', lvl:2, brk:false,
  instr:'Schrijf met positieve exponenten. Moet iets in de noemer? Klik dan eerst op het breukicoontje en vul daarna de noemer in.',
  build(b, st, save){
    const R = makeR(st); const x = R.pick(['a', 'x', 'y']);
    const L = R.shuffle([[2, 1, -3], [3, 1, -2], [5, 2, -2], [10, 3, -1], [4, 1, -2], [2, 3, -2]]);
    reeks(b, L.length, (g, i, nr) => { const [c, m, p] = L[i]; const C = c ** -p; const h = pPH(c, [[x, m]], p);
      mQ(g, st, save, 'n' + i, { nr, html:`${h} ${isq} {{i:i}}{{u:c}}${mE(x, 'a')}{{/i}}`,
        check:V=>allOf([['i', (V.i||{}).i ? {ok:true} : {ok:false, msg:'Een negatieve exponent: het omgekeerde nemen. Klik op het breukicoontje, dan komt de macht in de noemer.'}], ['c', chkU(V.c, Q(C), [[Q(c), 'Verhef ook het getal tot de macht.']])], ['a', chkE(V.a, -m*p, [[m*p, 'De macht staat al in de noemer: schrijf de exponent positief.'], [m - p, 'Vermenigvuldig de exponenten.']])]]),
        hint:[['Wat betekent een negatieve exponent? Je neemt het omgekeerde: 1 gedeeld door de macht met een positieve exponent. Klik op het breukicoontje.', `${pPH(2, [['a', 1]], -2)} ${isq} ${brH('1', pPH(2, [['a', 1]], 2))}`], ['Werk de noemer uit: verhef elke factor tot de macht.']],
        sol:`${h} ${isq} ${brH('1', pPH(c, [[x, m]], -p))} ${isq} ${brH('1', C + mH(x, -m*p))}` }); });
  } };

/* ---------- verdieping: letters in de exponent ---------- */
PR.lexp = { title:'Letters in de exponent', lvl:3,
  instr:'Verhef elke factor tot de macht. Typ de exponenten, bijvoorbeeld <b>2n</b>.',
  build(b, st, save){
    const L = [[[['a', 2], ['b', 3]], 'n'], [[['x', 'n'], ['y', 1]], 3], [[['a', 'n+1'], ['b', 1]], 2], [[['p', 2], ['q', 3]], 'k'], [[['x', 1], ['y', 2]], 'n-1'], [[['a', '2n'], ['b', 'n']], 2]].filter(([fs, p]) => fs.every(([, m]) => linMul(m, p)));
    reeks(b, L.length, (g, i, nr) => { const [fs, p] = L[i]; const h = pPH(1, fs, p);
      mQ(g, st, save, 'q' + i, { nr, html:`${h} ${isq} ${pAnt(fs)}`, check:V=>allOf(fs.map(([x, m], j) => ['abcd'[j], chkE(V['abcd'[j]], linMul(m, p), [[linAdd(m, p), 'Vermenigvuldig de exponenten.']])])),
        hint:[['Verhef elke factor tot de macht: vermenigvuldig de exponenten. Staat er een som, vermenigvuldig dan elke term.', `${pPH(1, [['a', 'n+1']], 2)} ${isq} ${mH('a', '2n+2')}`]],
        sol:`${h} ${isq} ${fs.map(([x, m]) => mH(x, linMul(m, p))).join('')}` }); });
  } };

/* ---------- verdieping: = of ≠ ---------- */
PR.gelijk = { title:'Gelijk of niet gelijk?', lvl:3,
  instr:'Zijn de twee uitdrukkingen gelijk voor elke waarde van de letters?',
  build(b, st, save){
    const R = makeR(st); const GN = [['=', '='], ['≠', '≠']];
    const L = R.shuffle([[pPH(-2, [['a', 1]], 4), `16${mH('a', 4)}`, '='], [pPH(-3, [['x', 1]], 3), `27${mH('x', 3)}`, '≠'], [minH(pPH(2, [['a', 1]], 2)), pPH(-2, [['a', 1]], 2), '≠'],
      [pPH(1, [['a', 2], ['b', 1]], 3), `${mH('a', 6)}${mH('b', 3)}`, '='], [`<span class="m4-m">(2 + <i>a</i>)<sup class="m4-sup">2</sup></span>`, `4 + ${mH('a', 2)}`, '≠'], [`<span class="m4-m">(2 · 5)<sup class="m4-sup">3</sup></span>`, `2 · ${mH('5', 3)}`, '≠'], [pPH(-1, [['a', 1]], 3), minH(mH('a', 3)), '=']]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    L.forEach(([l, r, ans], i) => { const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'g' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${l} <span class="m4-is">?</span> ${r}</span>`, opts:GN, ans, sym:true,
        why:ans==='=' ? 'Elke factor gaat tot de macht en het teken klopt.' : 'Kies een getal voor de letter en reken beide kanten uit: ze verschillen.', whyBad:'Kies een getal voor de letter, bijvoorbeeld 1 of 2, en reken beide kanten uit.' }); });
  } };

/* ---------- verdieping: verklaar ---------- */
PR.verkl = { title:'Verklaar de rekenregel', lvl:3, keep:true,
  instr:'Waarom verhef je elke factor tot de macht? Zet de stappen van de verklaring in de juiste volgorde.',
  build(b, st, save){
    const ab = '(<i>a</i> · <i>b</i>)';
    orderEx(b, st, save, 'o', { lab:'Jouw verklaring:', html:`<span class="m4-line" style="display:inline-flex"><span class="m4-m">${ab}<sup class="m4-sup"><i>n</i></sup></span> ${isq} ${mH('a', 'n')} · ${mH('b', 'n')}</span>`, lines:[
      `<span class="m4-m">${ab}<sup class="m4-sup"><i>n</i></sup></span> is een product van <i>n</i> factoren ${ab}.`,
      'Bij vermenigvuldigen mag je de volgorde van de factoren veranderen.',
      'Zet alle factoren <i>a</i> samen en alle factoren <i>b</i> samen.',
      `Je krijgt <i>n</i> factoren <i>a</i> en <i>n</i> factoren <i>b</i>: ${mH('a', 'n')} · ${mH('b', 'n')}.`],
      why:'Daarom gaat elke factor tot de macht.' });
  } };

SEC.prod = { id:'prod', ic:'m_prod', nav:'Macht van een product', title:'Macht van een product',
  tip:'Verhef elke factor tot de macht: ook het getal en het minteken. De regel geldt niet voor een som.',
  cheat:CHEAT_PROD, cards:[PR.sorteer, PR.woorden, PR.werk, PR.wn, PR.slim, PR.neg, PR.lexp, PR.gelijk, PR.verkl] };
/* ============================================================
   ONDERDEEL 9 · MACHT VAN EEN QUOTIËNT
   (a/b)^n = a^n / b^n: teller en noemer tot de macht
   ============================================================ */
Object.assign(ICONS, {
  m_quot:'<text x="1" y="17" font-size="15" font-weight="300" fill="currentColor" stroke="none">(</text><text x="7" y="9" font-size="7.5" font-weight="700" fill="currentColor" stroke="none">a</text><path d="M6 11h7"/><text x="7" y="19" font-size="7.5" font-weight="700" fill="currentColor" stroke="none">b</text><text x="14" y="17" font-size="15" font-weight="300" fill="currentColor" stroke="none">)</text><text x="19" y="8" font-size="7" font-weight="700" fill="currentColor" stroke="none">n</text>'
});
/* breuk tussen haakjes tot een macht, teller en noemer als html */
const qPH = (t, n, p) => abH(t, n, eH(p));
const QAB = qPH('<i>a</i>', '<i>b</i>', 'n');
const CHEAT_QUOT = `<h3>Spiekbriefje · macht van een quotiënt</h3><table>
  <tr><td>rekenregel</td><td><div class="m4-line">${QAB} ${isq} ${brH(mH('a', 'n'), mH('b', 'n'))}</div>Een quotiënt tot een macht: je verheft de teller en de noemer tot die macht (b ≠ 0).</td></tr>
  <tr><td>met een deelteken</td><td><div class="m4-line"><span class="m4-m">(<i>a</i> : <i>b</i>)<sup class="m4-sup"><i>n</i></sup></span> ${isq} ${mH('a', 'n')} : ${mH('b', 'n')}</div></td></tr>
  <tr><td>voorbeeld</td><td><div class="m4-line">${qPH('2<i>a</i>', '3', 2)} ${isq} ${brH('4' + mH('a', 2), '9')}</div></td></tr>
  <tr><td>slim rekenen</td><td><div class="m4-line">${mH('120', 4)} : ${mH('60', 4)} ${isq} <span class="m4-m">(120 : 60)<sup class="m4-sup">4</sup></span> ${isq} ${mH('2', 4)} ${isq} 16</div></td></tr>
  <tr><td>negatieve exponent</td><td><div class="m4-line">${qPH('2', '<i>a</i>', -3)} ${isq} ${qPH('<i>a</i>', '2', 3)} ${isq} ${brH(mH('a', 3), '8')}</div>eerst omdraaien</td></tr></table>`;
const QT = {};

/* ---------- ontdek: breuken vermenigvuldigen ---------- */
function quotSvg(a, b, n, k, t){
  const y = 80; let s = ''; const it = v => B(v).kind==='l';
  const tx = (x, yy, v, cls='t big') => `<text class="${cls}" x="${fx(x)}" y="${fx(yy)}" text-anchor="middle" dominant-baseline="central"${it(v) ? ' font-style="italic"' : ''}>${it(v) ? v : sg(v)}</text>`;
  const fr = (x, top, bot, w=28) => `${top}<line class="brl" x1="${fx(x - w/2)}" y1="${y}" x2="${fx(x + w/2)}" y2="${y}"/>${bot}`;
  const op = (v, o=1) => `<g opacity="${fx(o)}">${v}</g>`;
  /* stap 0: (a/b)^n */
  s += `<text class="t big" x="20" y="${y}" text-anchor="middle" dominant-baseline="central" style="font-size:46px;font-weight:300">(</text><text class="t big" x="68" y="${y}" text-anchor="middle" dominant-baseline="central" style="font-size:46px;font-weight:300">)</text>`;
  s += fr(44, tx(44, y - 20, a), tx(44, y + 22, b)) + `<text class="t big" x="80" y="${y - 30}" dominant-baseline="central">${n}</text>`;
  if(k>=1){ const o = k===1 ? t : 1; let x = 122; s += op(sT(104, y, '=', 'big'), o);
    for(let i=0; i<n; i++){ if(i) s += op(sT(x - 22, y, '·', 'big'), o); s += op(fr(x, tx(x, y - 20, a), tx(x, y + 22, b)), o); x += 44; } }
  if(k>=2){ const o = k===2 ? t : 1; const x0 = 122 + n*44 + 6; const top = Array(n).fill(it(a) ? a : sg(a)).join(' · '), bot = Array(n).fill(it(b) ? b : sg(b)).join(' · ');
    const w = 20 + n*30; const xc = x0 + 18 + w/2;
    s += op(sT(x0, y, '=', 'big') + `<text class="t big" x="${fx(xc)}" y="${y - 20}" text-anchor="middle" dominant-baseline="central" style="fill:var(--accent-dark)"${it(a) ? ' font-style="italic"' : ''}>${top}</text><line class="brl" x1="${fx(xc - w/2)}" y1="${y}" x2="${fx(xc + w/2)}" y2="${y}"/><text class="t big" x="${fx(xc)}" y="${y + 22}" text-anchor="middle" dominant-baseline="central" style="fill:#b46f00"${it(b) ? ' font-style="italic"' : ''}>${bot}</text>`, o); }
  if(k>=3){ const o = k===3 ? t : 1; const x0 = 122 + n*44 + 6 + 18 + 20 + n*30 + 22; const xc = x0 + 30;
    s += op(sT(x0, y, '=', 'big') + `<text class="t big" x="${fx(xc)}" y="${y - 20}" text-anchor="middle" dominant-baseline="central">${it(a) ? `<tspan font-style="italic">${a}</tspan>` : sg(a)}<tspan class="sup" dy="-8">${n}</tspan></text><line class="brl" x1="${fx(xc - 18)}" y1="${y}" x2="${fx(xc + 22)}" y2="${y}"/><text class="t big" x="${fx(xc)}" y="${y + 24}" text-anchor="middle" dominant-baseline="central">${it(b) ? `<tspan font-style="italic">${b}</tspan>` : sg(b)}<tspan class="sup" dy="-8">${n}</tspan></text>`, o); }
  return s;
}
QT.ontdek = { title:'Teller en noemer tot de macht', lvl:1, keep:true,
  instr:'Bekijk stap voor stap wat er gebeurt als je een breuk tot een macht verheft. Vul daarna in.',
  build(b, st, save){
    const R = makeR(st); const [a, c] = R.pick([['2', '3'], ['a', 'b'], ['3', '5'], ['x', '2']]); const n = R.pick([2, 3]);
    const PH = qPH(bH(a), bH(c), n);
    const wrap = el('div', 'm4-naast breed-l'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    stepFig(l, { W:520, H:150, maxw:640, alt:'een breuk tot een macht', steps:[
      {cap:`${PH}: een breuk tot de macht ${n}.`, draw:t=>quotSvg(a, c, n, 0, t)},
      {cap:`Een macht is een herhaald product: ${n} keer dezelfde breuk.`, draw:t=>quotSvg(a, c, n, 1, t)},
      {cap:'Breuken vermenigvuldigen: teller maal teller, noemer maal noemer.', draw:t=>quotSvg(a, c, n, 2, t)},
      {cap:`Schrijf als machten: ${PH} ${isq} ${brH(mH(a, n), mH(c, n))}`, draw:t=>quotSvg(a, c, n, 3, t)}] });
    r.append(el('p', '', 'Speel de stappen links af en vul in.'));
    const it = el('div', 'm4-items een'); r.append(it);
    mQ(it, st, save, 'm', { nr:'a)', html:`${PH} ${isq} ${brH(mE(a, 'a'), mE(c, 'b'))}`, check:V=>allOf([['a', chkE(V.a, n)], ['b', chkE(V.b, n, [[1, 'Ook de noemer gaat tot de macht.']])]]),
      onOk:()=>{ if(!r.querySelector('.m4-regel')) r.append(el('div', 'm4-regel nieuw', `<div class="m4-line">${QAB} ${isq} ${brH(mH('a', 'n'), mH('b', 'n'))}</div>Verhef de teller en de noemer tot de macht.`)); } });
  } };

/* ---------- de rekenregel in woorden ---------- */
QT.woorden = { title:'De rekenregel in woorden', lvl:1,
  instr:'Sleep de juiste woorden naar de vakjes, of tik een woord aan en tik dan op een vakje.',
  build(b, st, save, key){
    const w = st.w || (st.w = {});
    bankEx(b, w, save, key, [
      {pre:'Een quotiënt tot een macht: je verheft', ans:'de teller en de noemer', post:'tot die macht.', why:'Elke factor in de teller en in de noemer komt n keer voor.'},
      {pre:`Met een deelteken: <span class="m4-line" style="display:inline-flex"><span class="m4-m">(<i>a</i> : <i>b</i>)<sup class="m4-sup"><i>n</i></sup></span> ${isq} ${mH('a', 'n')} : <i>b</i></span>`, ans:'n', why:''}],
      shuffle(['de teller en de noemer', 'enkel de teller', 'enkel de noemer', 'n', '−n', '1']));
    const rows = b.querySelectorAll('.bank-line'); if(rows.length===2) rows[1].querySelector('.blank').classList.add('m4-expblank');
    const row = el('div', 'm4-wn'); b.append(row);
    qChoice(row, st, save, 'ver', { html:`Is ${mH('2/3', 2)} ${isq} ${brH(mH('2', 2), '3')}?`, opts:[['j', 'ja'], ['n', 'nee']], ans:'n',
      why:`Ook de noemer gaat tot de macht: ${mH('2/3', 2)} ${isq} ${brH(mH('2', 2), mH('3', 2))} ${isq} ${qH(Q(4, 9))}.`, whyBad:`Schrijf uit: ${mH('2/3', 2)} ${isq} ${brH('2', '3')} · ${brH('2', '3')}.` });
  } };

/* ---------- reken uit met getallen ---------- */
QT.getal = { title:'Reken uit', lvl:2,
  instr:'Verhef de teller en de noemer tot de macht. Kies het teken in het tekenvak. Klik op het breukicoontje om een breuk te maken.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${QAB} ${isq} ${brH(mH('a', 'n'), mH('b', 'n'))}</div>Een quotiënt tot een macht: verhef de teller en de noemer tot die macht.`);
    const R = makeR(st);
    const L = R.shuffle([['2/3', 3], ['-3/4', 2], ['-1/2', 5], ['5/2', 2], ['-2/5', 3], ['1/10', 3], ['3/2', 4], ['-4/3', 1]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [bb, n] = L[i]; const q = bVal(bb); const T = qPow(q, n); const ta = Math.abs(q.n);
      mQ(g, st, save, 'g' + i, { nr, html:`${mH(bb, n)} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T, [[Q(ta**n * (T.n<0 ? -1 : 1), q.d), 'Ook de noemer gaat tot de macht.'], [Q(ta*n * (T.n<0 ? -1 : 1), q.d*n), 'Je vermenigvuldigde met de exponent. Neem de factor ' + n + ' keer.']]),
        hint:[{u:'Verhef de teller en de noemer tot de macht.', line:`${mH(bb, n)} ${isq} ${q.n<0 ? MIN : ''}${brH(mH(String(ta), n), mH(String(q.d), n))} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), show:`${qH(T)}`},
          ['Een negatieve breuk met een even exponent geeft een positief getal, met een oneven exponent een negatief getal.']],
        sol:`${mH(bb, n)} ${isq} ${qH(T)}` }); });
  } };

/* ---------- werk uit met letters ---------- */
QT.letters = { title:'Werk uit met letters', lvl:2, brk:false,
  instr:'Verhef de teller en de noemer tot de macht. Vergeet het getal niet.',
  build(b, st, save){
    const R = makeR(st);
    /* [teller-factoren, noemer-factoren, exponent]; factoren: [getal] of [letter, exponent] */
    const L = R.shuffle([[['a', 1], [3], 2], [[2], ['x', 1], 3], [['a', 2], ['b', 1], 3], [[2, 'a', 1], [5], 2], [['x', 3], [2, 'y', 1], 2], [['p', 1], ['q', 4], 5]]);
    reeks(b, L.length, (g, i, nr) => { const [t, n, p] = L[i];
      const fh = f => typeof f[0]==='number' ? (f.length===1 ? String(f[0]) : f[0] + (f[2]===1 ? bH(f[1]) : mH(f[1], f[2]))) : (f[1]===1 ? bH(f[0]) : mH(f[0], f[1]));
      /* antwoordvakken: getal -> uitkomstvak, letter -> exponentvak */
      let k = 0; const keys = []; const ah = f => { const out = [];
        if(typeof f[0]==='number'){ const kk = 'abcd'[k++]; keys.push([kk, 'u', f[0]**p]); out.push(`{{u:${kk}}}`); if(f.length>1){ const ke = 'abcd'[k++]; keys.push([ke, 'e', f[2]*p]); out.push(mE(f[1], ke)); } }
        else { const ke = 'abcd'[k++]; keys.push([ke, 'e', f[1]*p]); out.push(mE(f[0], ke)); }
        return out.join(''); };
      const h = qPH(fh(t), fh(n), p); const ant = brH(ah(t), ah(n));
      const solF = f => typeof f[0]==='number' ? (f[0]**p) + (f.length>1 ? mH(f[1], f[2]*p) : '') : mH(f[0], f[1]*p);
      mQ(g, st, save, 'l' + i, { nr, html:`${h} ${isq} ${ant}`,
        check:V=>allOf(keys.map(([kk, w, v]) => [kk, w==='u' ? chkU(V[kk], Q(v), [[Q(v**(1/p)), 'Verhef ook het getal tot de macht.']]) : chkE(V[kk], v, [[v/p + p, 'Een macht van een macht: vermenigvuldig de exponenten.'], [v/p, 'Verhef ook deze factor tot de macht.']])])),
        hint:[['Verhef elke factor in de teller en in de noemer tot de macht.', `${qPH('2<i>a</i>', '3', 2)} ${isq} ${brH('4' + mH('a', 2), '9')}`]],
        sol:`${h} ${isq} ${brH(solF(t), solF(n))}` }); });
  } };

/* ---------- slim rekenen ---------- */
QT.slim = { title:'Slim rekenen: zelfde exponent', lvl:2,
  instr:'Dezelfde exponent? Deel eerst de grondtallen. Reken zo uit zonder rekenmachine.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['120', '60', 4, ':'], ['15', '5', 3, ':'], ['6', '3', 5, '/'], ['100', '50', 3, ':'], ['36', '12', 2, '/'], ['2', '4', 5, '/'], ['0,6', '0,2', 3, ':']]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [x, y, n, w] = L[i]; const P = qMul(bVal(x), qInv(bVal(y))); const T = qPow(P, n);
      const h = w===':' ? `${mH(x, n)} : ${mH(y, n)}` : brH(mH(x, n), mH(y, n));
      mQ(g, st, save, 's' + i, { nr, html:`${h} ${isq} <span class="m4-m">({{b:b}})<sup class="m4-sup">${n}</sup></span> ${isq} {{u:a}}`,
        check:V=>allOf([['b', (() => { const v = rdB(V.b); return !v ? {info:true, msg:'Deel de grondtallen en typ het quotiënt tussen de haakjes.'} : {ok:!v.bad && v.kind!=='l' && qEq(v.q, P)}; })()], ['a', chkU(V.a, T)]]),
        hint:[[`Dezelfde exponent ${n}: deel eerst ${sg(x)} door ${sg(y)}.`]], sol:`${h} ${isq} ${mH(qS(P), n)} ${isq} ${qH(T)}` }); });
  } };

/* ---------- negatieve exponent ---------- */
QT.neg = { title:'Met een negatieve exponent', lvl:2,
  instr:'Werk uit en schrijf met positieve exponenten. Schrijf elke tussenstap op een nieuwe regel.',
  build(b, st, save){
    const R = makeR(st); const x = R.pick(['a', 'x', 'y']);
    /* [getal, getal boven?, exponent] : (2/a)^-3 of (a/3)^-2 */
    const L = R.shuffle([[2, true, -3], [3, false, -2], [5, true, -2], [-2, true, -3], [-3, false, -2], [4, false, -2]]);
    reeks(b, L.length, (g, i, nr) => { const [c, boven, p] = L[i]; const C = c ** -p, E = -p;
      const h = boven ? qPH(sg(c), bH(x), p) : qPH(bH(x), sg(c), p);
      const sol = (C<0 ? MIN : '') + (boven ? brH(mH(x, E), Math.abs(C)) : brH(Math.abs(C), mH(x, E)));
      /* waarde van de opgave als eentermvorm: (c/x)^p of (x/c)^p */
      const breuk = boven ? VX.mono(Q(c), {[x]:-1}) : VX.mono(Q(1, c), {[x]:1});
      const doel = VX.pow(breuk, p);
      const fout = [[VX.pow(breuk, E), 'Een negatieve exponent maakt de macht niet positief zonder omdraaien. Draai de breuk om.'],
        [boven ? VX.mono(Q(1, c), {[x]:E}) : VX.mono(Q(c), {[x]:-E}), 'Verhef ook het getal tot de macht.']];
      mQ(g, st, save, 'v' + i, { nr, html:`${h} {{x:a}}`, check:V=>chkX(V.a, doel, fout),
        hint:[['Is de exponent negatief? Wat doe je dan eerst met de breuk?'], ['Verhef daarna de teller en de noemer tot de macht.']],
        sol:`${h} ${isq} ${boven ? qPH(bH(x), sg(c), E) : qPH(sg(c), bH(x), E)} ${isq} ${sol}` }); }, {een:true});
  } };

/* ---------- meerkeuze: meerdere juiste antwoorden ---------- */
QT.mk = { title:'Welke zijn gelijk?', lvl:2, keep:true,
  instr:'Duid <b>alle</b> uitdrukkingen aan die gelijk zijn aan de gegeven macht. Er is meer dan één juist antwoord.',
  build(b, st, save){
    const g = el('div', 'm4-items een'); b.append(g);
    multiKeuze(g, st, save, 'k1', { nr:'a)', html:`Gelijk aan ${mH('2/3', -2)}:`, opts:shuffle([['a', qH(Q(9, 4)), true], ['b', mH('3/2', 2), true], ['c', brH(mH('3', 2), mH('2', 2)), true], ['d', qH(Q(-4, 9)), false], ['e', qH(Q(4, 9)), false], ['f', brH(mH('2', -2), mH('3', -2)), true]]),
      why:'Omdraaien en de exponent positief maken geeft 9/4.', whyBad:'Draai de breuk om: de exponent wordt positief. Een negatieve exponent maakt het getal niet negatief.' });
    multiKeuze(g, st, save, 'k2', { nr:'b)', html:`Gelijk aan ${qPH('<i>a</i>', '<i>b</i>', 3)}:`, opts:shuffle([['a', brH(mH('a', 3), mH('b', 3)), true], ['b', `${mH('a', 3)} : ${mH('b', 3)}`, true], ['c', qPH('<i>b</i>', '<i>a</i>', -3), true], ['d', brH(mH('a', 3), '<i>b</i>'), false], ['e', brH('3<i>a</i>', '3<i>b</i>'), false]]),
      why:'Teller en noemer tot de macht; omdraaien met een tegengestelde exponent geeft hetzelfde.', whyBad:'Kijk of zowel de teller als de noemer tot de derde macht gaan.' });
  } };

/* ---------- verdieping: letters in de exponent ---------- */
QT.lexp = { title:'Letters in de exponent', lvl:3,
  instr:'Verhef de teller en de noemer tot de macht. Typ de exponenten, bijvoorbeeld <b>3n</b>.',
  build(b, st, save){
    const L = [[['a', 'n'], ['b', 2], 3], [['x', 'n+1'], ['y', 1], 2], [['a', 1], ['b', 'k'], 3], [['p', 2], ['q', 3], 'n'], [['x', 2], ['y', 'n'], 4], [['a', '2k'], ['b', 1], 'k-1']].filter(([t, n, p]) => linMul(t[1], p) && linMul(n[1], p));
    reeks(b, L.length, (g, i, nr) => { const [t, n, p] = L[i]; const h = qPH(t[1]===1 ? bH(t[0]) : mH(t[0], t[1]), n[1]===1 ? bH(n[0]) : mH(n[0], n[1]), p);
      const St = linMul(t[1], p), Sn = linMul(n[1], p);
      mQ(g, st, save, 'q' + i, { nr, html:`${h} ${isq} ${brH(mE(t[0], 'a'), mE(n[0], 'b'))}`, check:V=>allOf([['a', chkE(V.a, St, [[linAdd(t[1], p), 'Vermenigvuldig de exponenten.']])], ['b', chkE(V.b, Sn, [[linAdd(n[1], p), 'Vermenigvuldig de exponenten.']])]]),
        hint:[['Verhef teller en noemer tot de macht: vermenigvuldig de exponenten.']], sol:`${h} ${isq} ${brH(mH(t[0], St), mH(n[0], Sn))}` }); });
  } };

/* ---------- verdieping: alles samen ---------- */
QT.mix = { title:'Alles samen', lvl:3, brk:false,
  instr:'Werk uit. Schrijf met positieve exponenten. Kies het teken van het getal in het tekenvak.',
  build(b, st, save){
    const items = [
      [qPH('2' + mH('a', 2), '<i>b</i>', 3), brH(`{{u:c,t}}${mE('a', 'a')}`, mE('b', 'b')), {c:Q(8), a:6, b:3}, brH('8' + mH('a', 6), mH('b', 3))],
      [qPH(MIN + '<i>x</i>', '2<i>y</i>', 2), brH(mE('x', 'a'), `{{u:c,t}}${mE('y', 'b')}`), {c:Q(4), a:2, b:2}, brH(mH('x', 2), '4' + mH('y', 2))],
      [qPH(mH('a', 3), '2', -2), brH('{{u:c,t}}', mE('a', 'a')), {c:Q(4), a:6}, brH('4', mH('a', 6))],
      [qPH(MIN + '3', mH('x', 2), 3), brH('{{u:c,t}}', mE('x', 'a')), {c:Q(-27), a:6}, brH(MIN + '27', mH('x', 6))],
      [qPH(mH('a', 2), mH('b', -1), 2), `${mE('a', 'a')}${mE('b', 'b')}`, {a:4, b:2}, mH('a', 4) + mH('b', 2)],
      [qPH('<i>x</i>', MIN + '5', -2), brH('{{u:c,t}}', mE('x', 'a')), {c:Q(25), a:2}, brH('25', mH('x', 2))]];
    reeks(b, items.length, (g, i, nr) => { const [h, ant, T, sol] = items[i];
      mQ(g, st, save, 'x' + i, { nr, html:`${h} ${isq} ${ant}`, check:V=>allOf(Object.entries(T).map(([k, v]) => [k, k==='c' ? chkU(V.c, v) : chkE(V[k], v)])),
        hint:[['Is de exponent negatief? Draai dan eerst de breuk om.'], ['Verhef elke factor in de teller en in de noemer tot de macht, ook het getal en het minteken.']], sol:`${h} ${isq} ${sol}` }); });
  } };

/* ---------- verdieping: verklaar ---------- */
QT.verkl = { title:'Verklaar de rekenregel', lvl:3, keep:true,
  instr:'Waarom verhef je teller en noemer tot de macht? Zet de stappen van de verklaring in de juiste volgorde.',
  build(b, st, save){
    const ab = brH('<i>a</i>', '<i>b</i>');
    orderEx(b, st, save, 'o', { lab:'Jouw verklaring:', html:`<span class="m4-line" style="display:inline-flex">${QAB} ${isq} ${brH(mH('a', 'n'), mH('b', 'n'))} <span class="txt">(b ≠ 0)</span></span>`, lines:[
      `${QAB} is een product van <i>n</i> factoren ${ab}.`,
      'Breuken vermenigvuldigen: teller maal teller en noemer maal noemer.',
      'In de teller staan <i>n</i> factoren <i>a</i>, in de noemer <i>n</i> factoren <i>b</i>.',
      `Dat is ${brH(mH('a', 'n'), mH('b', 'n'))}.`],
      why:'Daarom gaan teller en noemer allebei tot de macht.' });
  } };

SEC.quot = { id:'quot', ic:'m_quot', nav:'Macht van een quotiënt', title:'Macht van een quotiënt',
  tip:'Verhef de teller en de noemer tot de macht. Bij een negatieve exponent draai je de breuk eerst om.',
  cheat:CHEAT_QUOT, cards:[QT.ontdek, QT.woorden, QT.getal, QT.letters, QT.slim, QT.neg, QT.mk, QT.lexp, QT.mix, QT.verkl] };
/* ============================================================
   ONDERDEEL 10 · REKENREGELS DOOR ELKAAR
   ============================================================ */
Object.assign(ICONS, {
  m_door:'<path d="M3 6h12l-3-3M15 6l-3 3"/><path d="M19 16H7l3-3M7 16l3 3"/>'
});
const CHEAT_DOOR = `<h3>Spiekbriefje · rekenregels door elkaar</h3><table>
  <tr><td>vermenigvuldigen</td><td><div class="m4-line">${mH('a', 'm')} · ${mH('a', 'p')} ${isq} ${mH('a', 'm+p')}</div>exponenten optellen</td></tr>
  <tr><td>delen</td><td><div class="m4-line">${mH('a', 'm')} : ${mH('a', 'p')} ${isq} ${mH('a', 'm-p')}</div>exponenten aftrekken</td></tr>
  <tr><td>macht van een macht</td><td><div class="m4-line">${mmH('a', 'm', 'p')} ${isq} ${mH('a', 'm·p')}</div>exponenten vermenigvuldigen</td></tr>
  <tr><td>product en quotiënt</td><td><div class="m4-line"><span class="m4-m">(<i>a</i> · <i>b</i>)<sup class="m4-sup"><i>n</i></sup></span> ${isq} ${mH('a', 'n')} · ${mH('b', 'n')} &nbsp; ${QAB} ${isq} ${brH(mH('a', 'n'), mH('b', 'n'))}</div>elke factor tot de macht</td></tr>
  <tr><td>geen regel</td><td><div class="m4-line">${mH('a', 3)} + ${mH('a', 5)} &nbsp; ${mH('2', 3)} · ${mH('5', 4)}</div>een som, of verschillende grondtallen en exponenten<div class="m4-line">${mH('a', 3)} + ${mH('a', 3)} ${isq} 2${mH('a', 3)}</div>gelijke termen mag je wel samentellen</td></tr></table>`;
const RG = [['+', 'exponenten optellen'], ['-', 'exponenten aftrekken'], ['x', 'exponenten vermenigvuldigen'], ['e', 'elke factor tot de macht'], ['g', 'geen rekenregel']];
const DR = {};

/* ---------- welke rekenregel? ---------- */
DR.kies = { title:'Welke rekenregel?', lvl:1,
  instr:'Welke rekenregel gebruik je? Je hoeft niet uit te rekenen.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([[`${mH('a', 3)} · ${mH('a', 5)}`, '+'], [`${mH('x', 7)} : ${mH('x', 2)}`, '-'], [mmH('a', 3, 4), 'x'], [pPH(2, [['a', 1]], 5), 'e'], [qPH('<i>a</i>', '<i>b</i>', 3), 'e'],
      [`${mH('a', 3)} + ${mH('a', 5)}`, 'g'], [`${mH('2', 3)} · ${mH('5', 4)}`, 'g'], [`${mH('a', -2)} · ${mH('a', 6)}`, '+'], [brH(mH('b', 4), mH('b', 9)), '-'], [mmH('y', -2, 3), 'x'], [`${mH('2', 5)} ${MIN} ${mH('2', 3)}`, 'g']]).slice(0, 6);
    const g = el('div', 'm4-items een'); b.append(g);
    L.forEach(([h, ans], i) => { const row = el('div', 'm4-wn'); g.append(row);
      const why = {'+':'Machten met hetzelfde grondtal vermenigvuldigen.', '-':'Machten met hetzelfde grondtal delen.', 'x':'Een macht van een macht.', 'e':'Een product of quotiënt tot een macht.', 'g':'Een som of verschil, of verschillende grondtallen met verschillende exponenten: geen rekenregel.'}[ans];
      qChoice(row, st, save, 'k' + i, { nr:'abcdefgh'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h}</span>`, opts:RG, ans, why, whyBad:'Kijk naar de bewerking tussen de machten en naar de haakjes.' }); });
  } };

/* ---------- schrijf als één macht ---------- */
DR.een = { title:'Schrijf als één macht', lvl:2,
  instr:'Schrijf als één macht met een positieve exponent. Werk stap voor stap: eerst de haakjes.',
  build(b, st, save){
    const R = makeR(st); const lets = R.shuffle(['a', 'b', 'x', 'y', 't', 'p', 'c']);
    /* [html-maker, exponent] */
    const L = R.shuffle([[x => `${mmH(x, 2, 3)} · ${bH(x)}`, 7], [x => `${mH(x, 5)} · ${mH(x, -2)} : ${bH(x)}`, 2], [x => mmH(x, 4, 2) + ' : ' + mH(x, 3), 5], [x => `<span class="m4-m">(${mH(x, 3)} · ${bH(x)})<sup class="m4-sup">2</sup></span>`, 8],
      [x => brH(`${mH(x, 2)} · ${mH(x, 6)}`, mH(x, 5)), 3], [x => brH(mH(x, 3), mmH(x, 2, 4)), -5], [x => `${mmH(x, -1, 3)} · ${mH(x, 7)}`, 4]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [f, S] = L[i]; const x = lets[i]; const h = f(x);
      mQ(g, st, save, 'e' + i, { nr, html:`${h} ${isq} {{m:a,i}}`, check:V=>chkM(V.a, {b:x, e:S, pos:true}),
        hint:[['Werk eerst de haakjes uit (macht van een macht: vermenigvuldigen).'], ['Vermenigvuldigen: exponenten optellen. Delen: exponenten aftrekken. Vergeet niet: <i>a</i> = ' + mH('a', 1) + '.']],
        sol:`${h} ${isq} ${mH(x, S)}` + (S<0 ? ` ${isq} ${brH('1', mH(x, -S))}` : '') }); });
  } };

/* ---------- meerkeuze zoals op de toets ---------- */
DR.mk = { title:'Kies het juiste antwoord', lvl:2,
  instr:'Kies het juiste antwoord. Reken niet alles uit: denk na met de rekenregels.',
  build(b, st, save){
    const R = makeR(st); const s6 = Array(6).fill(mH('6', 6)).join(' + ');
    const L = R.shuffle([
      [s6, [['a', mH('6', 7), 1], ['b', mH('36', 6)], ['c', mH('6', 36)], ['d', mH('36', 36)]], `Zes keer ${mH('6', 6)} is 6 · ${mH('6', 6)} ${isq} ${mH('6', 7)}.`],
      [`De helft van ${mH('2', 96)}`, [['a', mH('2', 95), 1], ['b', mH('1', 96)], ['c', mH('2', 48)], ['d', mH('1', 48)]], `${mH('2', 96)} : 2 ${isq} ${mH('2', 96)} : ${mH('2', 1)} ${isq} ${mH('2', 95)}.`],
      [`${mH('2', 10)} + ${mH('2', 10)}`, [['a', mH('2', 11), 1], ['b', mH('2', 20)], ['c', mH('4', 10)], ['d', mH('4', 20)]], `2 · ${mH('2', 10)} ${isq} ${mH('2', 11)}.`],
      [`Het dubbel van ${mH('4', 5)}`, [['a', mH('2', 11), 1], ['b', mH('4', 10)], ['c', mH('8', 5)], ['d', mH('4', 6)]], `${mH('4', 5)} ${isq} ${mH('2', 10)} en 2 · ${mH('2', 10)} ${isq} ${mH('2', 11)}.`],
      [`${mH('3', 4)} · ${mH('3', 4)} · ${mH('3', 4)}`, [['a', mH('3', 12), 1], ['b', mH('3', 64)], ['c', mH('9', 12)], ['d', mH('9', 4)]], 'Exponenten optellen: 4 + 4 + 4 = 12.'],
      [`${mH('10', 3)} · ${mH('10', 3)}`, [['a', mH('10', 6), 1], ['b', mH('100', 6)], ['c', mH('10', 9)], ['d', mH('20', 6)]], 'Hetzelfde grondtal: exponenten optellen.'],
      [`${mH('5', 8)} : ${mH('5', 8)}`, [['a', '1', 1], ['b', '0'], ['c', mH('5', 1)], ['d', mH('1', 8)]], `${mH('5', 0)} ${isq} 1.`]]).slice(0, 5);
    const g = el('div', 'm4-items een'); b.append(g);
    L.forEach(([h, opts, why], i) => { const row = el('div', 'm4-wn'); g.append(row);
      const o = R.shuffle(opts.slice());
      qChoice(row, st, save, 'm' + i, { nr:'abcde'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h} ${isq} …</span>`, opts:o.map(([v, l]) => [v, `<span class="m4-line">${l}</span>`]), ans:'a', why, whyBad:'Denk na: welke rekenregel past hier? Een som van gelijke machten is een veelvoud.' }); });
  } };

/* ---------- gelijk of niet gelijk ---------- */
DR.gelijk = { title:'Gelijk of niet gelijk?', lvl:2,
  instr:'Zijn de twee uitdrukkingen gelijk voor elke waarde van <i>a</i>?',
  build(b, st, save){
    const R = makeR(st); const GN = [['=', '='], ['≠', '≠']];
    const L = R.shuffle([[`${mH('a', 3)} + ${mH('a', 3)}`, `2${mH('a', 3)}`, '='], [`${mH('a', 3)} · ${mH('a', 3)}`, mH('a', 9), '≠'], [mmH('a', 3, 2), mH('a', 6), '='], [`${mH('a', 2)} + ${mH('a', 3)}`, mH('a', 5), '≠'],
      [`${mH('2', 3)} · ${mH('2', 3)}`, mH('4', 6), '≠'], [pPH(2, [['a', 1]], 3), `6${mH('a', 3)}`, '≠'], [`${mH('a', 6)} : ${mH('a', 2)}`, mH('a', 3), '≠'], [pPH(-1, [['a', 1]], 4), mH('a', 4), '='], [`${mH('a', 2)} · ${mH('a', 2)} · ${mH('a', 2)}`, mmH('a', 2, 3), '=']]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    L.forEach(([l, r, ans], i) => { const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'g' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${l} <span class="m4-is">?</span> ${r}</span>`, opts:GN, ans, sym:true,
        why:ans==='=' ? 'Ze zijn gelijk.' : 'Neem een getal voor a, bijvoorbeeld 2, en reken beide kanten uit.', whyBad:'Neem een getal voor a, bijvoorbeeld 2, en reken beide kanten uit.' }); });
  } };

/* ---------- werk uit met een getal ervoor ---------- */
DR.coef = { title:'Werk uit: getal en letter', lvl:2, brk:false,
  instr:'Reken het getal en de macht apart uit. Kies het teken in het tekenvak.',
  build(b, st, save){
    const R = makeR(st); const x = R.pick(['a', 'x', 'y']);
    const c = (k, m) => k + (m===1 ? bH(x) : mH(x, m));
    const L = R.shuffle([[`${c(2, 3)} · ${c(5, 4)}`, 10, 7], [`${pPH(3, [[x, 2]], 2)} · ${bH(x)}`, 9, 5], [`${c(12, 6)} : ${c(4, 2)}`, 3, 4], [`${pPH(-2, [[x, 1]], 3)} · ${mH(x, 2)}`, -8, 5],
      [`${c(4, 3)} · (${c(MIN + '3', 2)})`, -12, 5], [`${pPH(2, [[x, 2]], 3)} : ${c(4, 1)}`, 2, 5], [`${c(MIN + '6', 5)} : ${c(2, 3)}`, -3, 2]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [h, C, E] = L[i];
      mQ(g, st, save, 'c' + i, { nr, html:`${h} ${isq} {{u:c,t}}${mE(x, 'a')}`, check:V=>allOf([['c', chkU(V.c, Q(C))], ['a', chkE(V.a, E)]]),
        hint:[['Werk eerst de haakjes uit: elke factor tot de macht.'], ['Reken de getallen samen uit. Gebruik voor de letters de rekenregels.']], sol:`${h} ${isq} ${sg(C)}${mH(x, E)}` }); });
  } };

/* ---------- ontbrekende exponent ---------- */
DR.ontbr = { title:'Welke exponent ontbreekt?', lvl:2,
  instr:'Welke exponent hoort in het oranje vakje?',
  build(b, st, save){
    const R = makeR(st); const x = R.pick(['a', 'x', 'b']);
    const box = '{{e:a}}'; const mB = `<span class="m4-m">${bH(x)}<sup class="m4-sup">${box}</sup></span>`;
    const L = R.shuffle([[`${mB} · ${mH(x, 3)} ${isq} ${mH(x, 10)}`, 7], [`<span class="m4-m">(${mB})<sup class="m4-sup">3</sup></span> ${isq} ${mH(x, 12)}`, 4], [`${mH(x, 9)} : ${mB} ${isq} ${mH(x, 2)}`, 7],
      [`<span class="m4-m">(${mH(x, 2)})<sup class="m4-sup">${box}</sup></span> · ${bH(x)} ${isq} ${mH(x, 9)}`, 4], [`${mB} : ${mH(x, 4)} ${isq} ${brH('1', mH(x, 2))}`, 2]]);
    reeks(b, L.length, (g, i, nr) => { const [h, ans] = L[i];
      mQ(g, st, save, 'o' + i, { nr, html:h, check:V=>chkE(V.a, ans), hint:[['Welke rekenregel hoort hierbij? Schrijf de exponenten als een vergelijking.']], sol:`De ontbrekende exponent is ${ans}.` }); });
  } };

/* ---------- slim rekenen ---------- */
DR.slim = { title:'Reken slim uit', lvl:2,
  instr:'Reken uit zonder rekenmachine. Schrijf eerst als één macht.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([[`${mH('2', 10)} : ${mH('2', 8)}`, Q(4)], [`${mH('5', 3)} · ${mH('2', 3)}`, Q(1000)], [`${mH('4', 5)} : ${mH('2', 8)}`, Q(4)], [`${mH('9', 2)} · ${mH('3', -3)}`, Q(3)],
      [`${mH('0,5', 7)} · ${mH('2', 7)}`, Q(1)], [`${mH('25', 3)} : ${mH('5', 5)}`, Q(5)], [`${mH('-3', 7)} : ${mH('-3', 5)}`, Q(9)], [`${mH('2', 3)} : ${mH('2', 5)}`, Q(1, 4)]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [h, T] = L[i];
      mQ(g, st, save, 's' + i, { nr, html:`${h} ${isq} {{u:a}}`, check:V=>chkU(V.a, T), hint:[['Maak dezelfde grondtallen (bijvoorbeeld 4 = 2²) of dezelfde exponenten, en gebruik dan een rekenregel.']], sol:`${h} ${isq} ${qH(T)}` }); });
  } };

/* ---------- verdieping: voor elke waarde? ---------- */
DR.kwant = { title:'Voor elke waarde?', lvl:3,
  instr:'Is de uitspraak waar of niet waar?',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([[`Voor alle getallen <i>a</i> geldt ${pPH(-1, [['a', 1]], 2)} ${isq} ${mH('a', 2)}`, 'w', ''], [`Voor alle getallen <i>a</i> geldt ${pPH(-1, [['a', 1]], 3)} ${isq} ${mH('a', 3)}`, 'n', 'Neem a = 1: (−1)³ = −1, maar 1³ = 1.'],
      [`Voor alle getallen <i>a</i> ≠ 0 geldt ${mH('a', 0)} ${isq} 1`, 'w', ''], [`Voor alle getallen <i>a</i> geldt ${minH(mH('a', 2))} ${isq} ${pPH(-1, [['a', 1]], 2)}`, 'n', 'Neem a = 1: −1² = −1, maar (−1)² = 1.'],
      [`Er bestaat een getal <i>a</i> met ${mH('a', 2)} ${isq} ${mH('a', 3)}`, 'w', 'Bijvoorbeeld a = 0 of a = 1.'], [`Voor alle natuurlijke getallen <i>n</i> geldt ${mH('2', 'n')} + ${mH('2', 'n')} ${isq} ${mH('2', 'n+1')}`, 'w', ''],
      [`Voor alle natuurlijke getallen <i>n</i> geldt ${mH('2', 'n')} + ${mH('2', 'n')} ${isq} ${mH('4', 'n')}`, 'n', 'Neem n = 1: 2 + 2 = 4, maar n = 2: 4 + 4 = 8 en 4² = 16.'], [`Voor alle natuurlijke getallen <i>n</i> geldt ${mH('2', 'n')} · ${mH('2', 'n')} ${isq} ${mH('4', 'n')}`, 'w', '']]).slice(0, 6);
    const g = el('div', 'm4-items een'); b.append(g);
    L.forEach(([h, ans, why], i) => { const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'w' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h}</span>`, opts:WN, ans, why:why || 'Dat volgt uit de rekenregels.', whyBad:'Probeer een paar getallen: 0, 1, −1, 2.' }); });
  } };

/* ---------- verdieping: sommen van machten ---------- */
DR.som = { title:'Sommen van gelijke machten', lvl:3,
  instr:'Gelijke machten optellen geeft een veelvoud. Welke exponent hoort in het oranje vakje? Typ bijvoorbeeld <b>n+1</b>.',
  build(b, st, save){
    const L = [[`${mH('2', 'n')} + ${mH('2', 'n')}`, '2', 'n+1', `2 · ${mH('2', 'n')} ${isq} ${mH('2', 'n+1')}`], [`${mH('3', 'n')} + ${mH('3', 'n')} + ${mH('3', 'n')}`, '3', 'n+1', `3 · ${mH('3', 'n')}`],
      [`${mH('2', 'n+1')} ${MIN} ${mH('2', 'n')}`, '2', 'n', `${mH('2', 'n+1')} ${isq} 2 · ${mH('2', 'n')}`], [`5 · ${mH('5', 'n')}`, '5', 'n+1', `5 ${isq} ${mH('5', 1)}`],
      [mH('4', 'n'), '2', '2n', `4 ${isq} ${mH('2', 2)}`], [`${mH('8', 'n')} · ${mH('2', 'n')}`, '2', '4n', `8 ${isq} ${mH('2', 3)}`], [`${mH('2', 'n')} · ${mH('5', 'n')}`, '10', 'n', 'zelfde exponent']];
    reeks(b, L.length, (g, i, nr) => { const [h, bb, S, u] = L[i];
      mQ(g, st, save, 's' + i, { nr, html:`${h} ${isq} ${mE(bb, 'a')}`, check:V=>chkE(V.a, S), hint:[[u]], sol:`${h} ${isq} ${mH(bb, S)}` }); });
  } };

SEC.door = { id:'door', ic:'m_door', nav:'Rekenregels door elkaar', title:'Rekenregels door elkaar',
  tip:'Kijk eerst welke bewerking er staat: vermenigvuldigen (optellen), delen (aftrekken), macht van een macht (vermenigvuldigen), product of quotiënt tot een macht (elke factor). Bij een som is er geen rekenregel.',
  cheat:CHEAT_DOOR, cards:[DR.kies, DR.een, DR.mk, DR.gelijk, DR.coef, DR.ontbr, DR.slim, DR.kwant, DR.som] };
/* ============================================================
   ONDERDEEL 11 · WETENSCHAPPELIJKE SCHRIJFWIJZE
   a · 10^n met 1 ≤ a < 10 (één cijfer verschillend van 0 voor de komma)
   ============================================================ */
Object.assign(ICONS, {
  m_wet:'<text x="0" y="16" font-size="9" font-weight="700" fill="currentColor" stroke="none">a·10</text><text x="19" y="8" font-size="7" font-weight="700" fill="currentColor" stroke="none">n</text>'
});
const CHEAT_WET = `<h3>Spiekbriefje · wetenschappelijke schrijfwijze</h3><table>
  <tr><td>vorm</td><td><div class="m4-line"><i>a</i> · ${mH('10', 'n')}</div>voor de komma van <i>a</i> staat precies één cijfer dat geen 0 is; <i>n</i> is een geheel getal</td></tr>
  <tr><td>groot getal</td><td><div class="m4-line">4 500 000 ${isq} ${wH('4,5', 6)}</div>de komma schuift 6 plaatsen naar links: positieve exponent</td></tr>
  <tr><td>klein getal</td><td><div class="m4-line">0,000 32 ${isq} ${wH('3,2', -4)}</div>de komma schuift 4 plaatsen naar rechts: negatieve exponent</td></tr>
  <tr><td>rekenen</td><td><div class="m4-line">(${wH('3', 4)}) · (${wH('5', 2)}) ${isq} ${wH('15', 6)} ${isq} ${wH('1,5', 7)}</div>getallen samen, machten van 10 samen, daarna opnieuw wetenschappelijk schrijven</td></tr>
  <tr><td>rekenmachine</td><td>tik <b>×10ⁿ</b> voor de exponent, en <b>(−)</b> voor een negatieve exponent</td></tr></table>`;
/* willekeurig getal: mantisse als tekst ('4,5'), exponent */
function wRand(R, klein){ const d = R.pick([1, 2, 2, 3]); let m = String(R.int(1, 9)); if(d>1){ let r = ''; for(let i=1; i<d; i++) r += R.int(i===d-1 ? 1 : 0, 9); m += ',' + r; }
  return [m, klein ? -R.int(2, 7) : R.int(3, 9)]; }
const wGetal = (m, e) => qKomma(wQ(m, e));
const WT = {};

/* ---------- machten van 10 ---------- */
WT.tien = { title:'Machten van 10', lvl:1,
  instr:'Een macht van 10 als gewoon getal, en omgekeerd. Tel de nullen.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">${mH('10', 4)} ${isq} 10 000 &nbsp; ${mH('10', -3)} ${isq} ${brH('1', '1000')} ${isq} 0,001</div>Positieve exponent: het aantal nullen. Negatieve exponent: het aantal cijfers na de komma.`);
    const R = makeR(st); const a = R.int(3, 7), c = R.int(2, 5), d = R.int(5, 9), f = R.int(2, 6);
    const L = [[`${mH('10', a)} ${isq} {{g:a}}`, V=>{ const v = rdG((V.a||{}).t); return v ? {ok:qEq(v, qPow(Q(10), a))} : {info:true, msg:'Typ een getal.'}; }, `${mH('10', a)} ${isq} ${qKomma(qPow(Q(10), a))}`],
      [`${mH('10', -c)} ${isq} {{g:a}}`, V=>{ const v = rdG((V.a||{}).t); return v ? {ok:qEq(v, qPow(Q(10), -c))} : {info:true, msg:'Typ een kommagetal, bijvoorbeeld 0,01.'}; }, `${mH('10', -c)} ${isq} ${qKomma(qPow(Q(10), -c))}`],
      [`${qKomma(qPow(Q(10), d))} ${isq} ${mE('10', 'a')}`, V=>chkE(V.a, d), `${mH('10', d)}`], [`${qKomma(qPow(Q(10), -f))} ${isq} ${mE('10', 'a')}`, V=>chkE(V.a, -f, [[f, 'Een getal kleiner dan 1: de exponent is negatief.']]), `${mH('10', -f)}`],
      [`1 ${isq} ${mE('10', 'a')}`, V=>chkE(V.a, 0), mH('10', 0)], [`${brH('1', '100')} ${isq} ${mE('10', 'a')}`, V=>chkE(V.a, -2), mH('10', -2)]];
    reeks(b, L.length, (g, i, nr) => { const [h, check, sol] = L[i]; mQ(g, st, save, 't' + i, { nr, html:h, check, sol }); });
  } };

/* ---------- herkennen ---------- */
WT.herken = { title:'Is het wetenschappelijk geschreven?', lvl:1,
  instr:'Is het getal in wetenschappelijke schrijfwijze geschreven?',
  build(b, st, save){
    regelTop(b, `<div class="m4-line"><i>a</i> · ${mH('10', 'n')}</div>Voor de komma van <i>a</i> staat precies één cijfer dat geen 0 is. De exponent <i>n</i> is een geheel getal.`);
    const R = makeR(st);
    const L = R.shuffle([[wH('3,2', 5), 'j'], [wH('32', 4), 'n', 'Voor de komma staan twee cijfers.'], [wH('0,5', 3), 'n', 'Voor de komma staat een 0.'], [wH('1', -3), 'j'], [wH('10', 2), 'n', 'Voor de komma staan twee cijfers.'],
      [wH('2,5', -7), 'j'], [wH('-4,1', 3), 'j'], [wH('12,5', -2), 'n', 'Voor de komma staan twee cijfers.'], [`3,2 · ${mH('100', 3)}`, 'n', 'Het moet een macht van 10 zijn.'], [wH('9,99', 0), 'j']]).slice(0, 6);
    const g = el('div', 'm4-items'); b.append(g);
    L.forEach(([h, ans, why], i) => { const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'h' + i, { nr:'abcdef'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h}</span>`, opts:[['j', 'ja'], ['n', 'nee']], ans,
        why:ans==='j' ? 'Eén cijfer verschillend van 0 voor de komma en een macht van 10.' : why, whyBad:ans==='j' ? 'Kijk nog eens: één cijfer (geen 0) voor de komma, en een macht van 10. Ook een negatief getal of exponent 0 mag.' : why }); });
  } };

/* ---------- de komma schuift ---------- */
function kommaSvg(D, p0, p1, k, t){
  const dx = 30, x0 = 30, y = 70; let s = ''; const n = D.length; const hops = Math.abs(p0 - p1);
  const first = D.search(/[1-9]/);
  for(let i=0; i<n; i++){ const keep = k<2 || (i>=first && i < Math.max(p1, D.replace(/0+$/, '').length));
    s += `<text class="t big" x="${x0 + i*dx}" y="${y}" text-anchor="middle" dominant-baseline="central" style="${keep ? '' : 'opacity:.3'}">${D[i]}</text>`; }
  const cx = p => x0 + p*dx - dx/2;
  const pos = k===0 ? p0 : k===1 ? lerp(p0, p1, t) : p1;
  if(k===0 && p0===n) s += `<text class="t" x="${cx(p0) + 2}" y="${y + 6}" style="fill:var(--ink-soft)">,</text>`;
  s += `<text class="t big" x="${fx(cx(pos) + 2)}" y="${y + 8}" style="fill:var(--orange);font-weight:900">,</text>`;
  if(k>=1){ const done = k===1 ? Math.floor(t*hops + 1e-9) : hops; const dir = p1 < p0 ? -1 : 1;
    for(let j=0; j<done; j++){ const a = cx(p0 + dir*j), c2 = cx(p0 + dir*(j+1)); s += `<path class="pijl" d="M${fx(a)} ${y - 22} Q${fx((a+c2)/2)} ${y - 46} ${fx(c2)} ${y - 22}"/>`; }
    s += sT(x0 + (n-1)*dx/2, y + 46, `${done} ${done===1 ? 'plaats' : 'plaatsen'} naar ${dir<0 ? 'links' : 'rechts'}`, 't'); }
  return s;
}
WT.schuif = { title:'De komma schuift', lvl:1, keep:true,
  instr:'Bekijk hoe de komma schuift tot er één cijfer (geen 0) voor de komma staat. Vul daarna in.',
  build(b, st, save){
    const R = makeR(st); const klein = R.int(0, 1)===1;
    let D, p0, p1, m, e;
    if(klein){ const z = R.int(2, 4); const sig = String(R.int(11, 99)); D = '0'.repeat(z + 1) + sig; p0 = 1; p1 = z + 2; e = p0 - p1; m = sig[0] + ',' + sig[1]; }
    else { const z = R.int(3, 6); const sig = String(R.int(11, 99)); D = sig + '0'.repeat(z); p0 = D.length; p1 = 1; e = p0 - p1; m = sig[0] + ',' + sig[1]; }
    const T = wQ(m, e); const W = 60 + D.length*30;
    const wrap = el('div', 'm4-naast breed-l'); b.append(wrap); const l = el('div'), r = el('div'); wrap.append(l, r);
    stepFig(l, { W:Math.max(W, 360), H:140, maxw:560, alt:'een komma die schuift', steps:[
      {cap:`Het getal ${qKomma(T)}.`, draw:t=>kommaSvg(D, p0, p1, 0, t)},
      {cap:'Schuif de komma tot er één cijfer (geen 0) voor de komma staat. Tel de sprongen.', draw:t=>kommaSvg(D, p0, p1, 1, t), ms:1800},
      {cap:`${qKomma(T)} ${isq} ${wH(m, e)}: ${Math.abs(e)} ${Math.abs(e)===1 ? 'plaats' : 'plaatsen'} naar ${e>0 ? 'links, dus een positieve' : 'rechts, dus een negatieve'} exponent.`, draw:t=>kommaSvg(D, p0, p1, 2, t)}] });
    r.append(el('p', '', 'Speel de stappen links af en vul in.'));
    const it = el('div', 'm4-items een'); r.append(it);
    mQ(it, st, save, 'p', { nr:'a)', html:`<span class="txt">Hoeveel plaatsen schuift de komma?</span> {{g:a}}`, check:V=>{ const v = rdG((V.a||{}).t); return v ? {ok:qEq(v, Q(Math.abs(e)))} : {info:true, msg:'Typ een getal.'}; } });
    mQ(it, st, save, 'w', { nr:'b)', html:`${qKomma(T)} ${isq} {{g:a}} · ${mE('10', 'b')}`, check:V=>chkW(V.a, V.b, T), sol:`${qKomma(T)} ${isq} ${wH(m, e)}`,
      onOk:()=>{ if(!r.querySelector('.m4-regel')) r.append(el('div', 'm4-regel nieuw', 'Groot getal: de komma schuift naar links, de exponent is positief. Klein getal (tussen 0 en 1): de komma schuift naar rechts, de exponent is negatief.')); } });
  } };

/* ---------- schrijf wetenschappelijk ---------- */
WT.schrijf = { title:'Schrijf wetenschappelijk', lvl:2, brk:false,
  instr:'Schrijf in wetenschappelijke schrijfwijze. Typ in het eerste vak een kommagetal met één cijfer (geen 0) voor de komma.',
  build(b, st, save){
    const R = makeR(st); const L = R.shuffle([wRand(R, false), wRand(R, false), wRand(R, false), wRand(R, true), wRand(R, true), wRand(R, true)]);
    reeks(b, L.length, (g, i, nr) => { const [m, e] = L[i]; const T = wQ(m, e);
      mQ(g, st, save, 's' + i, { nr, html:`${qKomma(T)} ${isq} {{g:a}} · ${mE('10', 'b')}`, check:V=>chkW(V.a, V.b, T),
        hint:[['Zet de komma na het eerste cijfer dat geen 0 is.'], [`Tel hoeveel plaatsen de komma schuift. Naar links: positieve exponent. Naar rechts: negatieve exponent.`]], sol:`${qKomma(T)} ${isq} ${wH(m, e)}` }); });
  } };

/* ---------- als gewoon getal ---------- */
WT.gewoon = { title:'Schrijf als gewoon getal', lvl:2,
  instr:'Schrijf als gewoon getal. Je mag spaties typen tussen groepjes van drie cijfers.',
  build(b, st, save){
    const R = makeR(st); const L = R.shuffle([wRand(R, false), wRand(R, false), wRand(R, false), wRand(R, true), wRand(R, true), wRand(R, true)]);
    reeks(b, L.length, (g, i, nr) => { const [m, e] = L[i]; const T = wQ(m, e);
      mQ(g, st, save, 'g' + i, { nr, html:`${wH(m, e)} ${isq} {{g:a}}`, check:V=>{ const v = rdG((V.a||{}).t); if(!v) return {info:true, msg:'Typ een getal, bijvoorbeeld 45 000 of 0,0032.'};
          if(qEq(v, T)) return {ok:true}; if(qEq(v, wQ(m, -e))) return {ok:false, msg:'Je schoof de komma de verkeerde kant op.'}; return {ok:false}; },
        hint:[[e>0 ? `Positieve exponent: schuif de komma ${e} plaatsen naar rechts (het getal wordt groter).` : `Negatieve exponent: schuif de komma ${-e} plaatsen naar links (het getal wordt kleiner).`]], sol:`${wH(m, e)} ${isq} ${qKomma(T)}` }); });
  } };

/* ---------- ordenen ---------- */
WT.orden = { title:'Rangschik van klein naar groot', lvl:2, keep:true,
  instr:'Tik de getallen aan van klein naar groot.',
  build(b, st, save){
    const R = makeR(st); const k = R.int(3, 6);
    const V = [['2,1', k], ['9,8', k - 1], ['1,5', k + 1], ['4', -2], ['7,5', -3], ['-3', k]];
    const S = V.map(([m, e]) => [wQ(m, e), wH(m, e)]).sort((x, y) => qCmp(x[0], y[0]));
    orderEx(b, st, save, 'o', { lab:'Van klein naar groot:', html:'Kijk eerst naar het teken, dan naar de exponent, en pas daarna naar het getal voor de macht.', lines:S.map(x => `<span class="m4-line" style="display:inline-flex">${x[1]}</span>`),
      why:'Een negatief getal is het kleinst. Bij positieve getallen beslist eerst de exponent.' });
  } };

/* ---------- contexten ---------- */
WT.context = { title:'Grote en kleine getallen rondom ons', lvl:2, brk:false,
  instr:'Schrijf het getal uit de zin in wetenschappelijke schrijfwijze.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['De afstand van de aarde tot de zon is ongeveer 150 000 000 km.', '1,5', 8], ['Een bacterie is ongeveer 0,000 002 m lang.', '2', -6], ['Op aarde wonen ongeveer 8 100 000 000 mensen.', '8,1', 9],
      ['Een haar is ongeveer 0,000 07 m dik.', '7', -5], ['Licht legt per seconde ongeveer 300 000 km af.', '3', 5], ['Een rode bloedcel is ongeveer 0,000 007 5 m breed.', '7,5', -6],
      ['Je hart klopt in een leven ongeveer 3 000 000 000 keer.', '3', 9], ['Een zandkorrel weegt ongeveer 0,000 044 g.', '4,4', -5]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [zin, m, e] = L[i]; const T = wQ(m, e);
      mQ(g, st, save, 'c' + i, { nr, html:`<span class="txt">${zin}</span><br>{{g:a}} · ${mE('10', 'b')}`, check:V=>chkW(V.a, V.b, T), sol:wH(m, e) }); }, {een:true});
  } };

/* ---------- product en quotiënt ---------- */
WT.reken = { title:'Vermenigvuldigen en delen', lvl:2, brk:false,
  instr:'Reken uit en schrijf het resultaat wetenschappelijk. Een negatief getal? Typ het minteken in het eerste vak.',
  build(b, st, save){
    regelTop(b, `<div class="m4-line">(${wH('4', -3)}) · (${wH('5', 7)}) ${isq} 20 · ${mH('10', 4)} ${isq} ${wH('2', 5)}</div>Vermenigvuldig (of deel) de getallen en de machten van 10 apart. Schrijf daarna opnieuw wetenschappelijk.`);
    const R = makeR(st);
    const L = R.shuffle([[['3', 4], '·', ['2', 5]], [['4', -3], '·', ['5', 7]], [['8', 6], ':', ['2', 2]], [['-3', 5], '·', ['2', -2]], [['1,5', 3], ':', ['5', -2]], [['-6', 8], ':', ['-3', 2]], [['2,5', -4], '·', ['4', -3]], [['9', 2], ':', ['-3', 6]]]).slice(0, 6);
    reeks(b, L.length, (g, i, nr) => { const [[m1, e1], op, [m2, e2]] = L[i]; const A = wQ(m1, e1), C = wQ(m2, e2); const T = op==='·' ? qMul(A, C) : qMul(A, qInv(C));
      const h = `(${wH(m1, e1)}) ${op} (${wH(m2, e2)})`; const E = op==='·' ? e1 + e2 : e1 - e2; const M = op==='·' ? qMul(qDec(m1.includes(',') ? m1 : m1 + ',0'), qDec(m2.includes(',') ? m2 : m2 + ',0')) : qMul(qDec(m1.includes(',') ? m1 : m1 + ',0'), qInv(qDec(m2.includes(',') ? m2 : m2 + ',0')));
      mQ(g, st, save, 'r' + i, { nr, html:`${h} ${isq} {{g:a}} · ${mE('10', 'b')}`, check:V=>chkW(V.a, V.b, T),
        hint:[[`Getallen: ${sg(m1)} ${op} ${sg(m2)} ${isq} ${qKomma(M)}. Machten van 10: ${op==='·' ? 'exponenten optellen' : 'exponenten aftrekken'}, ${mH('10', E)}.`], ['Staat er nu geen of meer dan één cijfer voor de komma? Schuif de komma en pas de exponent aan.']],
        sol:`${h} ${isq} ${qKomma(M)} · ${mH('10', E)} ${isq} ${wH(qKomma(qMul(T, qPow(Q(10), -Math.floor(Math.log10(Math.abs(T.n/T.d)) + 1e-9)))), Math.floor(Math.log10(Math.abs(T.n/T.d)) + 1e-9))}` }); });
  } };

/* ---------- rekenmachine: aflezen ---------- */
const tScherm = (inv, m, e) => scherm(inv, `${m.replace(',', '.')}<span style="font-size:.85em">×10</span><sup>${sg(e)}</sup>`);
WT.toestel = { title:'Rekenmachine: het scherm aflezen', lvl:2, brk:false,
  instr:'De rekenmachine toont een heel groot of heel klein resultaat in wetenschappelijke schrijfwijze. Schrijf op wat je leest. Let op: het toestel toont een punt, jij schrijft een komma.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([['45000000×3000000', '1,35', 14], ['0.0006×0.0004', '2,4', -7], ['2^40', '1,099511628', 12], ['1÷8000000', '1,25', -7], ['123456789×1000', '1,23456789', 11], ['0.3^10', '5,9049', -6]]).slice(0, 4);
    reeks(b, L.length, (g, i, nr) => { const [inv, m, e] = L[i]; const T = wQ(m, e);
      mQ(g, st, save, 'a' + i, { nr, html:`${tScherm(inv, m, e)} <span class="txt">betekent</span> {{g:a}} · ${mE('10', 'b')}`, check:V=>chkW(V.a, V.b, T), sol:wH(m, e) }); });
  } };

/* ---------- rekenmachine: intikken ---------- */
WT.intik = { title:'Rekenmachine: intikken', lvl:2,
  instr:'Hoe tik je het getal in op je rekenmachine? Kies de juiste toetsen.',
  build(b, st, save){
    const k = t => `<span class="m4-toets">${t}</span>`;
    const L = [[wH('3,2', -5), [['a', `3.2 ${k('×10ⁿ')} ${k('(−)')} 5`, 1], ['b', `3.2 ${k('×')} 10 ${k('^')} 5 ${k('(−)')}`], ['c', `3.2 ${k('×10ⁿ')} ${k('−')} 5`], ['d', `3.2 ${k('×')} ${k('×10ⁿ')} ${k('(−)')} 5`]], 'Na ×10ⁿ tik je de exponent. Voor een negatieve exponent gebruik je de toets (−), niet de mintoets.'],
      [wH('-4', 8), [['a', `${k('(−)')} 4 ${k('×10ⁿ')} 8`, 1], ['b', `4 ${k('×10ⁿ')} ${k('(−)')} 8`], ['c', `${k('(−)')} 4 ${k('×')} 8`], ['d', `${k('−')} 4 ${k('×')} 10 8`]], 'Het minteken hoort bij het getal 4: tik eerst (−).'],
      [wH('6,02', 23), [['a', `6.02 ${k('×10ⁿ')} 23`, 1], ['b', `6.02 ${k('×')} 10 ${k('×')} 23`], ['c', `6.02 ${k('^')} 23`], ['d', `6.02 ${k('×10ⁿ')} 10 23`]], 'Met ×10ⁿ tik je enkel nog de exponent.']];
    const R = makeR(st); const g = el('div', 'm4-items een'); b.append(g);
    L.forEach(([h, opts, why], i) => { const row = el('div', 'm4-wn'); g.append(row);
      qChoice(row, st, save, 'k' + i, { nr:'abc'[i] + ')', html:`Tik in: <span class="m4-line" style="display:inline-flex">${h}</span>`, opts:R.shuffle(opts.slice()), ans:'a', why, whyBad:why }); });
  } };

/* ---------- verdieping: optellen en aftrekken ---------- */
WT.som = { title:'Optellen en aftrekken', lvl:3, brk:false,
  instr:'Reken uit en schrijf wetenschappelijk. Maak eerst de exponenten gelijk, of schrijf als gewoon getal.',
  build(b, st, save){
    const R = makeR(st);
    const L = R.shuffle([[['3', 4], '+', ['5', 3]], [['6,2', 5], MIN, ['2', 4]], [['4', -3], '+', ['3', -4]], [['9', 6], '+', ['2', 6]], [['1', 5], MIN, ['5', 4]], [['2,5', -2], MIN, ['5', -3]]]).slice(0, 5);
    reeks(b, L.length, (g, i, nr) => { const [[m1, e1], op, [m2, e2]] = L[i]; const A = wQ(m1, e1), C = wQ(m2, e2); const T = op==='+' ? Q(A.n*C.d + C.n*A.d, A.d*C.d) : Q(A.n*C.d - C.n*A.d, A.d*C.d);
      const h = `${wH(m1, e1)} ${op} ${wH(m2, e2)}`;
      mQ(g, st, save, 'm' + i, { nr, html:`${h} ${isq} {{g:a}} · ${mE('10', 'b')}`, check:V=>chkW(V.a, V.b, T),
        hint:[[`Schrijf beide als gewoon getal: ${qKomma(A)} ${op} ${qKomma(C)} ${isq} ${qKomma(T)}. Schrijf dat wetenschappelijk.`]], sol:`${h} ${isq} ${qKomma(T)}` }); });
  } };

/* ---------- verdieping: voorvoegsels ---------- */
WT.si = { title:'Kilo, mega, micro, nano', lvl:3, keep:true,
  instr:'Voorvoegsels zijn machten van 10. Welke exponent hoort in het oranje vakje?',
  build(b, st, save){
    regelTop(b, `<div class="m4-tabel">tera T = ${mH('10', 12)} · giga G = ${mH('10', 9)} · mega M = ${mH('10', 6)} · kilo k = ${mH('10', 3)}<br>milli m = ${mH('10', -3)} · micro µ = ${mH('10', -6)} · nano n = ${mH('10', -9)}</div>`);
    const L = [['1 nanometer (nm)', 'm', -9], ['1 gigabyte (GB)', 'byte', 9], ['1 micrometer (µm)', 'm', -6], ['1 megawatt (MW)', 'W', 6], ['1 milligram (mg)', 'g', -3], ['1 terabyte (TB)', 'byte', 12]];
    reeks(b, L.length, (g, i, nr) => { const [w, e, n] = L[i];
      mQ(g, st, save, 'v' + i, { nr, html:`<span class="txt">${w} ${isq}</span> ${mE('10', 'a')} <span class="txt">${e}</span>`, check:V=>chkE(V.a, n, [[-n, 'Kijk naar het teken: is het een groot of een klein voorvoegsel?']]), sol:`${w} = ${mH('10', n)} ${e}` }); });
  } };

(function(){ const s = document.createElement('style'); s.textContent = `.m4-toets{display:inline-block; padding:0 .35rem; margin:0 .1rem; border:1.5px solid var(--ink-soft); border-radius:.3rem; background:var(--zone-bg); font-size:.9em}`; document.head.append(s); })();

SEC.wet = { id:'wet', ic:'m_wet', nav:'Wetenschappelijke schrijfwijze', title:'Wetenschappelijke schrijfwijze',
  tip:'Eén cijfer (geen 0) voor de komma, maal een macht van 10. Groot getal: positieve exponent. Getal tussen 0 en 1: negatieve exponent.',
  cheat:CHEAT_WET, cards:[WT.tien, WT.herken, WT.schuif, WT.schrijf, WT.gewoon, WT.orden, WT.context, WT.reken, WT.toestel, WT.intik, WT.som, WT.si] };
/* ============================================================
   ONDERDEEL 12 · ZOEK DE FOUT
   typische fouten: duid de eerste foute stap aan en verbeter
   ============================================================ */
Object.assign(ICONS, {
  m_fout:'<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/><path d="M8 8l4 4M12 8l-4 4"/>'
});
const ln = h => `<span class="m4-line" style="display:inline-flex">${h}</span>`;
const FT = {};
/* macht met een letterlijke exponent-tekst (niet uitgerekend): a^(3·4) */
const mT = (b, t) => `<span class="m4-m">${bHp(b)}<sup class="m4-sup">${t}</sup></span>`;
const foutKaart = (title, lvl, maak) => ({ title, lvl, instr:'Klik op de eerste stap die fout is. Verbeter die stap daarna.', build(b, st, save){ const R = makeR(st); const L = maak(R); L.forEach((e, i) => errBlock(b, st, save, 'f' + i, Object.assign({nr:'ab'[i] + ')'}, e))); } });

FT.verm = foutKaart('Vermenigvuldigen en delen', 2, R => { const x = R.pick(['a', 'x', 'y']), m = R.int(2, 5), p = R.int(3, 6), q = R.pick([2, 3]), k = q*R.int(2, 4);
  return [{task:`Schrijf als één macht: ${mH(x, m)} · ${mH(x, p)}`, lines:[ln(`${mH(x, m)} · ${mH(x, p)} ${isq} ${mT(x, `${m}·${p}`)}`), ln(`${isq} ${mH(x, m*p)}`)], wrong:0, cons:[1],
      why:'Machten met hetzelfde grondtal vermenigvuldigen: je telt de exponenten op, je vermenigvuldigt ze niet.', fixMQ:{html:`${mH(x, m)} · ${mH(x, p)} ${isq} {{m:a}}`, check:V=>chkM(V.a, {b:x, e:m+p}), sol:mH(x, m+p)}},
    {task:`Schrijf als één macht: ${mH('2', k)} : ${mH('2', q)}`, lines:[ln(`${mH('2', k)} : ${mH('2', q)} ${isq} ${mT('2', `${k}:${q}`)}`), ln(`${isq} ${mH('2', k/q)}`)], wrong:0, cons:[1],
      why:'Machten met hetzelfde grondtal delen: je trekt de exponenten af.', fixMQ:{html:`${mH('2', k)} : ${mH('2', q)} ${isq} {{m:a}}`, check:V=>chkM(V.a, {b:'2', e:k-q}), sol:mH('2', k-q)}}]; });

FT.teken = foutKaart('Het minteken', 2, R => { const g = R.pick([3, 4, 5]);
  return [{task:`Bereken ${minH(mH(String(g), 2))}.`, lines:[ln(`${minH(mH(String(g), 2))} ${isq} (${MIN}${g}) · (${MIN}${g})`), ln(`${isq} ${g*g}`)], wrong:0, cons:[1],
      why:`De exponent hoort enkel bij ${g}: ${minH(mH(String(g), 2))} ${isq} ${MIN}(${g} · ${g}).`, fixMQ:{html:`${minH(mH(String(g), 2))} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, Q(-g*g)), sol:sg(-g*g)}},
    {task:`Bereken ${mH('-2', 3)}.`, lines:[ln(`${mH('-2', 3)} ${isq} (${MIN}2) · (${MIN}2) · (${MIN}2)`), ln(`${isq} 8`)], wrong:1,
      why:'Drie mintekens: er blijft er één over, dus het resultaat is negatief.', fixMQ:{html:`(${MIN}2) · (${MIN}2) · (${MIN}2) ${isq} {{u:a,t}}`, check:V=>chkU(V.a, Q(-8)), sol:sg(-8)}}]; });

FT.neg = foutKaart('Negatieve exponent', 2, R => { const n = R.pick([2, 3]); const [p, q] = R.pick([[2, 3], [3, 4], [2, 5]]);
  return [{task:`Bereken ${mH('2', -n)}.`, lines:[ln(`${mH('2', -n)} ${isq} ${minH(mH('2', n))}`), ln(`${isq} ${MIN}${2**n}`)], wrong:0, cons:[1],
      why:'Een negatieve exponent maakt het getal niet negatief: je neemt het omgekeerde.', fixMQ:{html:`${mH('2', -n)} ${isq} {{u:a}}`, check:V=>chkU(V.a, Q(1, 2**n)), sol:qH(Q(1, 2**n))}},
    {task:`Bereken ${mH(`${p}/${q}`, -2)}.`, lines:[ln(`${mH(`${p}/${q}`, -2)} ${isq} ${mH(`${q}/${p}`, 2)}`), ln(`${isq} ${brH(q*q, p)}`)], wrong:1,
      why:'Ook de noemer gaat tot de macht.', fixMQ:{html:`${mH(`${q}/${p}`, 2)} ${isq} {{u:a}}`, check:V=>chkU(V.a, Q(q*q, p*p)), sol:qH(Q(q*q, p*p))}}]; });

FT.prod = foutKaart('Macht van een product', 2, R => { const c = R.pick([3, 4, 5]), m = R.int(2, 3), x = R.pick(['a', 'x']);
  return [{task:`Werk uit: ${pPH(c, [[x, m]], 2)}`, lines:[ln(`${pPH(c, [[x, m]], 2)} ${isq} ${mH(String(c), 2)} · ${mmH(x, m, 2)}`), ln(`${isq} ${2*c}${mH(x, 2*m)}`)], wrong:1,
      why:`${mH(String(c), 2)} ${isq} ${c} · ${c} ${isq} ${c*c}, niet 2 · ${c}.`, fixMQ:{html:`${mH(String(c), 2)} · ${mmH(x, m, 2)} ${isq} {{u:c}}${mE(x, 'a')}`, check:V=>allOf([['c', chkU(V.c, Q(c*c))], ['a', chkE(V.a, 2*m)]]), sol:`${c*c}${mH(x, 2*m)}`}},
    {task:`Werk uit: ${pPH(2, [[x, 1]], 3)}`, lines:[ln(`${pPH(2, [[x, 1]], 3)} ${isq} 2 · ${mH(x, 3)}`), ln(`${isq} 2${mH(x, 3)}`)], wrong:0, cons:[1],
      why:'Elke factor gaat tot de macht, ook het getal 2.', fixMQ:{html:`${pPH(2, [[x, 1]], 3)} ${isq} {{u:c}}${mE(x, 'a')}`, check:V=>allOf([['c', chkU(V.c, Q(8))], ['a', chkE(V.a, 3)]]), sol:`8${mH(x, 3)}`}}]; });

FT.mm = foutKaart('Macht van een macht en exponent 0', 2, R => { const m = R.int(2, 5), p = R.int(3, 5), g = R.pick(['5', '7', '9']);
  return [{task:`Schrijf als één macht: ${mmH('a', m, p)}`, lines:[ln(`${mmH('a', m, p)} ${isq} ${mT('a', `${m}+${p}`)}`), ln(`${isq} ${mH('a', m+p)}`)], wrong:0, cons:[1],
      why:'Een macht van een macht: je vermenigvuldigt de exponenten.', fixMQ:{html:`${mmH('a', m, p)} ${isq} {{m:a}}`, check:V=>chkM(V.a, {b:'a', e:m*p}), sol:mH('a', m*p)}},
    {task:`Bereken ${mH(g, 0)}.`, lines:[ln(`${mH(g, 0)} ${isq} ${g} · 0`), ln(`${isq} 0`)], wrong:0, cons:[1],
      why:`Een macht met exponent 0 is 1: ${mH(g, 0)} ${isq} ${mH(g, 3)} : ${mH(g, 3)} ${isq} 1.`, fixMQ:{html:`${mH(g, 0)} ${isq} {{u:a}}`, check:V=>chkU(V.a, Q(1)), sol:'1'}}]; });

FT.wet = foutKaart('Wetenschappelijke schrijfwijze', 2, R => { const [m, e] = [R.pick(['4,5', '3,2', '7,1']), -R.int(3, 5)]; const T = wQ(m, e);
  return [{task:`Schrijf ${qKomma(T)} wetenschappelijk.`, lines:[ln(`De komma schuift ${-e} plaatsen naar rechts.`), ln(`${qKomma(T)} ${isq} ${wH(m, -e)}`)], wrong:1,
      why:'Een getal tussen 0 en 1 krijgt een negatieve exponent.', fixMQ:{html:`${qKomma(T)} ${isq} {{g:a}} · ${mE('10', 'b')}`, check:V=>chkW(V.a, V.b, T), sol:wH(m, e)}},
    {task:`Bereken (${wH('3', 4)}) · (${wH('5', 3)}).`, lines:[ln(`(${wH('3', 4)}) · (${wH('5', 3)}) ${isq} 15 · ${mH('10', 7)}`), ln(`${isq} ${wH('1,5', 6)}`)], wrong:1,
      why:`15 ${isq} ${wH('1,5', 1)}: de exponent wordt één groter, niet kleiner.`, fixMQ:{html:`15 · ${mH('10', 7)} ${isq} {{g:a}} · ${mE('10', 'b')}`, check:V=>chkW(V.a, V.b, wQ('1,5', 8)), sol:wH('1,5', 8)}}]; });

SEC.fout = { id:'fout', ic:'m_fout', nav:'Zoek de fout', title:'Zoek de fout',
  tip:'Lees elke stap en vraag je af: welke rekenregel staat hier, en klopt hij? De eerste stap die fout is, telt.',
  cheat:CHEAT_DOOR, cards:[FT.verm, FT.teken, FT.neg, FT.prod, FT.mm, FT.wet] };
/* ============================================================
   ONDERDEEL 13 · SNELLE QUIZ: 10 vragen in 3 minuten, telt niet mee
   ============================================================ */
Object.assign(ICONS, {
  m_quiz:'<circle cx="12" cy="13" r="8"/><path d="M12 13V9M12 13l3 2M10 3h4"/>'
});
const SQ = {
  ch:(q, opts, ans, show) => ({kind:'ch', q, opts, ans, show}),
  w:(q, check, show) => ({kind:'w', q, check, show})
};
const QUIZ = [
  R => { const n = R.int(2, 5); const T = qPow(Q(-2), n); return SQ.w(`${mH('-2', n)} ${isq} {{u:a}}`, V=>chkU(V.a, T), sg(T.n)); },
  R => { const g = R.pick([2, 3, 5, 10]), n = R.int(1, g===10 ? 3 : 2); const T = qPow(Q(g), -n); return SQ.w(`${mH(String(g), -n)} ${isq} {{u:a}}`, V=>chkUD(V.a, T), qH(T)); },
  R => { const m = R.int(2, 7), p = R.int(-3, 6); return SQ.w(`${mH('a', m)} · ${mH('a', p)} ${isq} ${mE('a', 'a')}`, V=>chkE(V.a, m+p), mH('a', m+p)); },
  R => { const m = R.int(2, 9), p = R.int(-3, 5); return SQ.w(`${mH('x', m)} : ${mH('x', p)} ${isq} ${mE('x', 'a')}`, V=>chkE(V.a, m-p), mH('x', m-p)); },
  R => { const m = R.int(-3, 5) || 2, p = R.int(2, 4); return SQ.w(`${mmH('y', m, p)} ${isq} ${mE('y', 'a')}`, V=>chkE(V.a, m*p), mH('y', m*p)); },
  R => { const c = R.pick([2, 3, 5]), n = R.pick([2, 3]); return SQ.w(`${pPH(c, [['a', 1]], n)} ${isq} {{u:c}}${mE('a', 'a')}`, V=>allOf([['c', chkU(V.c, Q(c**n))], ['a', chkE(V.a, n)]]), `${c**n}${mH('a', n)}`); },
  R => { const [p, q] = R.pick([[2, 3], [3, 4], [2, 5], [4, 7]]); return SQ.w(`${mH(`${p}/${q}`, -1)} ${isq} {{u:a}}`, V=>chkU(V.a, Q(q, p)), qH(Q(q, p))); },
  R => { const x = R.pick(['7', '−12', 'a', '0,5']); return SQ.w(`${mH(x.replace('−', '-'), 0)} ${isq} {{u:a}}`, V=>chkU(V.a, Q(1)), '1'); },
  R => { const g = R.int(2, 9), n = R.int(2, 9); const neg = R.f() < .5; const h = neg ? minH(mH(String(g), n)) : mH(String(-g), n); const pos = !neg && n % 2===0;
    return SQ.ch(`Is ${h} positief of negatief?`, [['+', 'positief'], ['-', 'negatief']], pos ? '+' : '-', pos ? 'positief' : 'negatief'); },
  R => { const [m, e, ok] = R.pick([['3,2', 5, true], ['32', 4, false], ['0,7', -2, false], ['7', -3, true], ['10', 3, false], ['1,05', 8, true]]);
    return SQ.ch(`Is ${wH(m, e)} een wetenschappelijke schrijfwijze?`, [['j', 'ja'], ['n', 'nee']], ok ? 'j' : 'n', ok ? 'ja' : 'nee'); },
  R => { const [m, e] = wRand(R, R.f() < .5); const T = wQ(m, e); return SQ.w(`${qKomma(T)} ${isq} ${sg(m)} · ${mE('10', 'a')}`, V=>chkE(V.a, e), wH(m, e)); },
  R => { const k = R.int(5, 40); return SQ.ch(`${mH('2', k)} + ${mH('2', k)} ${isq} …`, [['a', mH('2', k+1)], ['b', mH('2', 2*k)], ['c', mH('4', k)], ['d', mH('4', 2*k)]], 'a', mH('2', k+1)); }
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
  cards:[ { title:'Quiz machten', noReset:true, build:quizKaart(QUIZ) } ] };

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
   PROEFTOETSEN 1–3 · op 30 punten, niveau van de toets
   eigen opgaven, geïnspireerd op de soorten vragen van de toets
   ============================================================ */
const TOETS_TIP = 'Een proeftoets op 30 punten over de hele module. Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Werk zonder spiekbriefje en zonder rekenmachine, behalve waar het gevraagd wordt.';
const tReeks = (b, n, fn) => reeks(b, n, fn);

/* 1. bereken (3 pt) */
function tBereken(b, st, save){
  const R = makeR(st); const [p, q] = R.pick([[2, 3], [3, 4], [2, 5], [3, 5]]); const n = R.pick([3, 5]), k = 2000 + R.int(10, 40);
  const g1 = R.pick([3, 4]), g2 = R.pick([2, 5]);
  const L = R.shuffle([[mH('-2', 4), Q(16)], [minH(mH(String(g1), 2)), Q(-g1*g1)], [mH(String(g2), -2), Q(1, g2*g2)], [mH(`${p}/${q}`, -2), Q(q*q, p*p)], [mH('-1', 2*k + 1), Q(-1)], [mH('-3', n), qPow(Q(-3), n)]]);
  tReeks(b, 6, (g, i, nr) => { const [h, T] = L[i]; mQ(g, st, save, 'b' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T), sol:`${h} ${isq} ${qH(T)}` }); });
}
/* 2. positief of negatief (2 pt) */
function tTeken(b, st, save){
  const R = makeR(st); const PN2 = [['+', 'positief'], ['-', 'negatief']];
  const L = R.shuffle([[`${mH('-5', 7)}`, '-'], [`${mH('-4', 10)}`, '+'], [minH(mH('6', 4)), '-'], [`${mH('-2', 3)} · ${mH('-3', 5)}`, '+'], [`${mH('-7', -3)}`, '-'], [minH(mH('-2', 6)), '-']]).slice(0, 4);
  const g = el('div', 'm4-items'); b.append(g);
  L.forEach(([h, ans], i) => { const row = el('div', 'm4-wn'); g.append(row); qChoice(row, st, save, 't' + i, { nr:'abcd'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h}</span>`, opts:PN2, ans }); });
}
/* 3. schrijf als één macht met een positieve exponent (6 pt) */
function tEen(b, st, save){
  const R = makeR(st); const x = R.pick(['a', 'x', 'b']);
  const m = R.int(3, 6), p = R.int(2, 5), c = R.int(2, 4), d = R.int(2, 3);
  const L = [[`${mH(x, m)} · ${mH(x, p)} · ${bH(x)}`, m + p + 1], [`${mH(x, -m)} · ${mH(x, p)}`, p - m], [brH(mH(x, p), mH(x, p + c)), -c], [mmH(x, -d, c), -d*c],
    [`<span class="m4-m">(${mH(x, c)} · ${bH(x)})<sup class="m4-sup">${d}</sup></span> : ${mH(x, d)}`, (c + 1)*d - d], [brH(`${mmH(x, 2, 3)} · ${mH(x, -1)}`, mH(x, 4)), 1]];
  tReeks(b, 6, (g, i, nr) => { const [h, S] = L[i]; mQ(g, st, save, 'e' + i, { nr, html:`${h} ${isq} {{m:a,i}}`, check:V=>chkM(V.a, {b:x, e:S, pos:true}), sol:`${h} ${isq} ${mH(x, S)}` + (S<0 ? ` ${isq} ${brH('1', mH(x, -S))}` : '') }); });
}
/* 4. werk uit: product en quotiënt (4 pt) */
function tWerk(b, st, save){
  const R = makeR(st); const c = R.pick([2, 3]), m = R.int(2, 4), n = R.pick([2, 3]);
  const L = [[pPH(-c, [['a', m]], 3), `{{u:c,t}}${mE('a', 'a')}`, {c:Q((-c)**3), a:3*m}, `${sg((-c)**3)}${mH('a', 3*m)}`],
    [pPH(2, [['a', 1], ['b', n]], 4), `{{u:c,t}}${mE('a', 'a')}${mE('b', 'b')}`, {c:Q(16), a:4, b:4*n}, `16${mH('a', 4)}${mH('b', 4*n)}`],
    [qPH(mH('x', 3), '2', 2), brH(mE('x', 'a'), '{{u:c,t}}'), {c:Q(4), a:6}, brH(mH('x', 6), '4')],
    [qPH('3', mH('y', 2), -2), brH(mE('y', 'a'), '{{u:c,t}}'), {c:Q(9), a:4}, brH(mH('y', 4), '9')]];
  tReeks(b, 4, (g, i, nr) => { const [h, ant, T, sol] = L[i]; mQ(g, st, save, 'w' + i, { nr, html:`${h} ${isq} ${ant}`, check:V=>allOf(Object.entries(T).map(([k, v]) => [k, k==='c' ? chkU(V.c, v) : chkE(V[k], v)])), sol:`${h} ${isq} ${sol}` }); });
}
/* 5. slim rekenen (3 pt) */
function tSlim(b, st, save){
  const R = makeR(st); const n = R.int(3, 6), k = R.int(3, 5);
  const L = R.shuffle([[`${mH('5', n)} · ${mH('2', n)}`, qPow(Q(10), n)], [`${mH('4', k)} : ${mH('2', 2*k - 2)}`, Q(4)], [`${mH('0,25', 5)} · ${mH('4', 5)}`, Q(1)], [`${mH('9', 3)} · ${mH('3', -5)}`, Q(3)], [`${mH('150', 3)} : ${mH('50', 3)}`, Q(27)]]).slice(0, 3);
  tReeks(b, 3, (g, i, nr) => { const [h, T] = L[i]; mQ(g, st, save, 's' + i, { nr, html:`${h} ${isq} {{u:a}}`, check:V=>chkU(V.a, T), sol:`${h} ${isq} ${qH(T)}` }); });
}
/* 6. kies het juiste antwoord (3 pt) */
function tKies(b, st, save){
  const R = makeR(st); const k = 2*R.int(10, 30), j = R.int(5, 9);
  const L = R.shuffle([[`${mH('3', k)} + ${mH('3', k)} + ${mH('3', k)}`, [['a', mH('3', k+1)], ['b', mH('3', 3*k)], ['c', mH('9', k)], ['d', mH('9', 3*k)]]],
    [`De helft van ${mH('2', k)}`, [['a', mH('2', k-1)], ['b', mH('1', k)], ['c', mH('2', k/2)], ['d', mH('1', k/2)]]],
    [`<span class="m4-m">(<span class="m4-m">(${MIN}<i>a</i>)<sup class="m4-sup">2</sup></span>)<sup class="m4-sup">${j}</sup></span>`, [['a', mH('a', 2*j)], ['b', minH(mH('a', 2*j))], ['c', mH('a', 2+j)], ['d', minH(mH('a', 2+j))]]],
    [`${mH('10', j)} · ${mH('10', j)}`, [['a', mH('10', 2*j)], ['b', mH('100', 2*j)], ['c', mH('10', j*j)], ['d', mH('20', j)]]]]).slice(0, 3);
  const g = el('div', 'm4-items een'); b.append(g);
  L.forEach(([h, opts], i) => { const row = el('div', 'm4-wn'); g.append(row); qChoice(row, st, save, 'k' + i, { nr:'abc'[i] + ')', html:`<span class="m4-line" style="display:inline-flex">${h} ${isq} …</span>`, opts:R.shuffle(opts.slice()).map(([v, l]) => [v, `<span class="m4-line">${l}</span>`]), ans:'a' }); });
}
/* 7. wetenschappelijke schrijfwijze (5 pt) */
function tWet(b, st, save){
  const R = makeR(st); const [m1, e1] = wRand(R, false), [m2, e2] = wRand(R, true), [m3, e3] = wRand(R, R.f() < .5);
  const [a, x, c, y] = [R.pick(['4', '6', '8']), R.int(3, 6), R.pick(['2', '5']), -R.int(2, 5)];
  const T4 = qMul(wQ(a, x), wQ(c, y));
  const L = [[`${qKomma(wQ(m1, e1))} ${isq} {{g:a}} · ${mE('10', 'b')}`, V=>chkW(V.a, V.b, wQ(m1, e1)), wH(m1, e1)], [`${qKomma(wQ(m2, e2))} ${isq} {{g:a}} · ${mE('10', 'b')}`, V=>chkW(V.a, V.b, wQ(m2, e2)), wH(m2, e2)],
    [`${wH(m3, e3)} ${isq} {{g:a}}`, V=>{ const v = rdG((V.a||{}).t); return {ok:!!v && qEq(v, wQ(m3, e3))}; }, qKomma(wQ(m3, e3))],
    [`(${wH(a, x)}) · (${wH(c, y)}) ${isq} {{g:a}} · ${mE('10', 'b')}`, V=>chkW(V.a, V.b, T4), qKomma(T4), 2]];
  tReeks(b, 4, (g, i, nr) => { const [h, check, sol, pts] = L[i]; mQ(g, st, save, 'w' + i, { nr, html:h, check, sol, pts:pts || 1 }); });
}
/* 8. context (2 pt) */
const T_CTX = [
  {zin:'Een virus is 0,000 000 2 m lang. Hoeveel virussen passen er naast elkaar op 1 mm (0,001 m)?', T:Q(5000), sol:`${mH('10', -3)} : (${wH('2', -7)}) ${isq} ${wH('5', 3)}`},
  {zin:'Een lichtjaar is ongeveer 9 460 000 000 000 km. Een ster staat op 4 lichtjaar. Hoeveel km is dat?', T:Q(37840000000000), sol:`4 · ${wH('9,46', 12)} ${isq} ${wH('3,784', 13)}`},
  {zin:'Een zandkorrel weegt 0,000 05 g. Hoeveel weegt een zak met 6 000 000 zandkorrels, in gram?', T:Q(300), sol:`(${wH('5', -5)}) · (${wH('6', 6)}) ${isq} ${wH('3', 2)}`}];
const tCtx = i => (b, st, save) => { const c = T_CTX[i];
  mQ(b, st, save, 'c', { html:`<span class="txt">${c.zin}</span><br><span class="txt">Antwoord in wetenschappelijke schrijfwijze:</span> {{g:a}} · ${mE('10', 'b')}`, check:V=>chkW(V.a, V.b, c.T), sol:c.sol }); };
/* 9. zoek de fout (2 pt) */
const T_FOUT = [
  {task:`Schrijf als één macht: ${mmH('a', 3, 4)} · ${mH('a', 2)}`, lines:[ln(`${mmH('a', 3, 4)} · ${mH('a', 2)} ${isq} ${mH('a', 7)} · ${mH('a', 2)}`), ln(`${isq} ${mH('a', 9)}`)], wrong:0, cons:[1]},
  {task:`Bereken ${mH('-2', -3)}.`, lines:[ln(`${mH('-2', -3)} ${isq} ${brH('1', mH('-2', 3))}`), ln(`${isq} ${brH('1', '8')}`)], wrong:1},
  {task:`Werk uit: ${pPH(-3, [['x', 2]], 2)}`, lines:[ln(`${pPH(-3, [['x', 2]], 2)} ${isq} ${mH('-3', 2)} · ${mmH('x', 2, 2)}`), ln(`${isq} ${MIN}9${mH('x', 4)}`)], wrong:1}];
const tFout = i => (b, st, save) => errBlock(b, st, save, 'f', Object.assign({nr:'', pts:2}, T_FOUT[i]));

function bigToets(i){ return [
  {sec:'Bereken', pts:3, prompt:'Bereken. Kies het teken in het tekenvak. Schrijf een breuk vereenvoudigd.', build:tBereken},
  {sec:'Positief of negatief?', pts:2, prompt:'Is het resultaat positief of negatief? Reken niet uit.', build:tTeken},
  {sec:'Schrijf als één macht', pts:6, prompt:'Schrijf als één macht met een positieve exponent.', build:tEen},
  {sec:'Macht van een product en van een quotiënt', pts:4, prompt:'Werk uit. Schrijf met positieve exponenten.', build:tWerk},
  {sec:'Slim rekenen', pts:3, prompt:'Reken uit zonder rekenmachine.', build:tSlim},
  {sec:'Kies het juiste antwoord', pts:3, build:tKies},
  {sec:'Wetenschappelijke schrijfwijze', pts:5, build:tWet},
  {sec:'Toepassing', pts:2, prompt:'Je mag je rekenmachine gebruiken.', build:tCtx(i)},
  {sec:'Zoek de fout', pts:2, prompt:'Klik op de eerste stap die fout is.', build:tFout(i)}
]; }
[0, 1, 2].forEach(i => { SEC['toets' + (i+1)] = { id:'toets' + (i+1), ic:'toets', nav:'Proeftoets ' + (i+1), title:'Proeftoets ' + (i+1), tip:TOETS_TIP,
  cards:[ { title:'Proeftoets ' + (i+1), noReset:true, build:(b, st, save, key) => proeftoets(b, st, save, key, bigToets(i)) } ] }; });
const ORDER = ['herh','teken','neg','brk','verm','del','mm','prod','quot','door','wet','fout','quiz','toets1','toets2','toets3'];
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
      try{ card.build(body, st, save, key); hintsSamen(body, key); }catch(err){ console.error(err); body.append(el('p','fb bad','Er liep iets mis bij het maken van deze oefening. Klik op “Nieuwe opgave”.')); }
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
