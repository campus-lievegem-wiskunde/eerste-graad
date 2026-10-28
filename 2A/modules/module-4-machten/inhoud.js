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
function mH(b, e){ return `<span class="m4-m">${bH(b)}${e==null ? '' : `<sup class="m4-sup">${eH(e)}</sup>`}</span>`; }
/* macht met een invulvak als exponent */
const mE = (b, k) => `<span class="m4-m">${bH(b)}<sup class="m4-sup">{{e:${k}}}</sup></span>`;
/* machten met maaltekens ertussen */
const prodH = arr => arr.map(([b, e]) => mH(b, e)).join(' · ');
const isq = '<span class="m4-is">=</span>';

/* ============================================================
   INVOER: tekenvak, slim vak (wordt een breuk bij /), machtvak
   Tokens in een regel: {{u:k}} uitkomst (getal of breuk; {{u:k,t}} met tekenvak)
   {{m:k,opts}} machtvak (opts: i = "1/" typen maakt een breuk, t = tekenvak), {{e:k}} exponent,
   {{b:k}} grondtal, {{g:k}} gewoon vak
   ============================================================ */
const tokens = html => html.replace(/\{\{(\w):(\w+)((?:,\w+)*)\}\}/g, (m, t, k, o) => `<span class="m4-w" data-t="${t}" data-k="${k}" data-o="${o.slice(1)}"></span>`);
function m4inp(cls, val, lab){ const i = el('input', 'm4-in ' + cls); i.type = 'text'; i.autocomplete = 'off'; i.spellcheck = false; i.value = val || ''; i.setAttribute('aria-label', lab); grow(i); i.addEventListener('input', ()=>grow(i)); return i; }
function grow(i){ const n = Math.max(0, i.value.length - (i.classList.contains('ex') ? 2 : 3)); i.style.width = n ? `calc(var(--w) + ${n*.6}em)` : ''; }
const BRK_IC = '<svg viewBox="0 0 14 18" aria-hidden="true"><rect x="2.5" y="1" width="9" height="6" rx="1.2"/><path d="M1 9h12"/><rect x="2.5" y="11" width="9" height="6" rx="1.2"/></svg>';
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
    host.append(i); if(cls==='u') host.append(fbtn);
    if(focus){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  } else {
    const t = m4inp(cls + ' br-get', o.t, lab + ', teller'), n = m4inp(cls + ' br-get', o.n, lab + ', noemer'); first = t;
    t.addEventListener('input', ()=>{ o.t = t.value.replace(/[/:]/, ''); if(/[/:]/.test(t.value)){ t.value = o.t; n.focus(); } save(); onCh(); });
    n.addEventListener('input', ()=>{ o.n = n.value; save(); onCh(); });
    n.addEventListener('keydown', e=>{ if(e.key==='Backspace' && n.value===''){ e.preventDefault(); o.n = null; save(); redraw('t'); onCh(); } });
    t.addEventListener('keydown', e=>{ if(e.key==='ArrowDown' || (e.key==='Enter' && n.value==='')){ e.preventDefault(); n.focus(); } });
    n.addEventListener('keydown', e=>{ if(e.key==='ArrowUp'){ e.preventDefault(); t.focus(); } });
    const br = el('span', 'br br-in'); const bt = el('span', 'br-t'), bn = el('span', 'br-n'); bt.append(t); bn.append(n); br.append(bt, bn); host.append(br); if(cls==='u') host.append(fbtn);
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
        if(focus){ bi.focus(); bi.setSelectionRange(bi.value.length, bi.value.length); }
      };
      draw();
    }
  });
  root.addEventListener('keydown', e=>{ if(e.key==='Enter' && e.target.matches('.m4-in') && !(e.target.classList.contains('br-get') && e.target.closest('.br-t'))){ e.preventDefault(); onEnter && onEnter(); } });
  return {
    W, V,
    mark(fields){ Object.entries(W).forEach(([k, w]) => { w.sp.classList.remove('ok', 'bad'); if(fields && fields[k]!=null) w.sp.classList.add(fields[k] ? 'ok' : 'bad'); }); },
    clear(){ Object.values(W).forEach(w => w.sp.classList.remove('ok', 'bad')); },
    lock(){ root.querySelectorAll('input,button').forEach(x => { if(x.tagName==='INPUT') x.readOnly = true; else if(x.closest('.m4-w')) x.disabled = true; }); },
    empty(){ return Object.entries(W).some(([k, w]) => isEmptyW(w.t, V[k])); }
  };
}
const isEmptyW = (t, v) => !v || (t==='m' ? !(v.bt||'').trim() : t==='u' ? !(v.t||'').trim() && (v.z || !v.s) : !(v.t||'').trim()) || (v.n!=null && !String(v.n).trim());

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
  v = v || {}; const t = nrm(v.t||'').replace('.', ','), n = v.n==null ? null : nrm(v.n);
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
  if(T.pos && linNum(e0) && e0.k<0) return {ok:false, msg:'Schrijf met een <b>positieve</b> exponent: typ eerst <b>1/</b>, dan komt de macht in de noemer.'};
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
  if(q.hint && !quiz){ hintBox(row, act, q.hint, q.meer, qid); }
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
function hintBox(row, act, steps, meer, qid){
  if(window.__M4TEST) steps.forEach((stp, i) => { if(stp && stp.check) window.__M4TEST.push({id:qid + '_hint' + i, check:V=>{ const r = stp.check(V); return typeof r==='boolean' ? {ok:r} : r; }, html:stp.line}); });
  const box = el('div', 'hint-gr'); const ol = el('ol', 'hint-stap'); ol.hidden = true; box.append(ol);
  const nb = el('button', 'btn ghost', '💡 Hint'); nb.type = 'button'; act.append(nb); row.append(box);
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
  .m4-q > .q-act{margin:0; display:flex; flex-wrap:wrap; gap:.35rem; align-items:center}
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
  .m4-brk svg{width:12px; height:16px; fill:none; stroke:currentColor; stroke-width:1.5}
  .m4-brk[aria-pressed="true"]{color:var(--accent-dark)}
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
   ONDERDELEN: ICONEN EN SPIEKBRIEFJES
   ============================================================ */
Object.assign(ICONS, {
  m_neg:'<text x="3" y="18" font-size="13" font-weight="700" fill="currentColor" stroke="none">a</text><text x="11" y="11" font-size="9" font-weight="700" fill="currentColor" stroke="none">−n</text>',
  m_verm:'<text x="1.5" y="18" font-size="11" font-weight="700" fill="currentColor" stroke="none">a·a</text><text x="17" y="9" font-size="7.5" font-weight="700" fill="currentColor" stroke="none">m</text>'
});
const SEC = {};
const CHEAT_NEG = `<h3>Spiekbriefje · negatieve exponent en exponent 0</h3><table>
  <tr><td>negatieve exponent</td><td><div class="m4-line">${mH('a', '-n')} ${isq} ${brH('1', mH('a', 'n'))}</div>omgekeerde nemen en de exponent positief maken</td></tr>
  <tr><td>exponent 0</td><td><div class="m4-line">${mH('a', 0)} ${isq} 1</div>als a ≠ 0</td></tr>
  <tr><td>exponent 1</td><td><div class="m4-line">${mH('a', 1)} ${isq} <i>a</i></div></td></tr>
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
NG.pos = { title:'Van negatieve exponent naar breuk en terug', lvl:1,
  instr:'Staat er een negatieve exponent, schrijf dan als een breuk met een positieve exponent. Staat er een breuk, schrijf ze dan als één macht: de exponent wordt negatief. Rond een negatief grondtal typ je zelf haakjes, bijvoorbeeld <b>(-2)</b>.',
  build(b, st, save){
    const R = makeR(st);
    const bases = R.shuffle(['2', '3', '5', '7', '10', '-3', '-2', 'a', 'x', 'b', 'y']);
    const lijst = [];
    for(let i=0; i<3; i++){ const g = bases[i], n = R.int(2, 6); lijst.push({fw:true, g, n}); }
    for(let i=3; i<5; i++){ const g = bases[i], n = R.int(2, 7); lijst.push({fw:false, g, n}); }
    lijst.push({fw:R.f()<.5, g:R.pick(['x', 'a', '6']), n:1});
    reeks(b, lijst.length, (g, i, nr) => { const it = lijst[i];
      if(it.fw) mQ(g, st, save, 'p' + i, { nr, html:`${mH(it.g, -it.n)} ${isq} ${brH('1', '{{m:a}}')}`,
        check:V=>chkM(V.a, {b:it.g, e:it.n, fout:[[-it.n, 'In de noemer staat de exponent positief.']]}),
        hint:[['Neem het omgekeerde en maak de exponent positief.', `${mH('a', '-n')} ${isq} ${brH('1', mH('a', 'n'))}`]].concat(B(it.g).neg ? [['Het grondtal is negatief: typ er haakjes rond, bijvoorbeeld (-2).']] : []),
        sol:`${mH(it.g, -it.n)} ${isq} ${brH('1', mH(it.g, it.n))}` });
      else mQ(g, st, save, 'p' + i, { nr, html:`${brH('1', it.n===1 ? bH(it.g) : mH(it.g, it.n))} ${isq} ${mE(it.g, 'a')}`,
        check:V=>chkE(V.a, -it.n, [[it.n, 'Een macht in de noemer krijgt een negatieve exponent als je ze naar boven brengt.']]),
        hint:[['Eén gedeeld door een macht: de exponent wordt tegengesteld.', `${brH('1', mH('a', 'n'))} ${isq} ${mH('a', '-n')}`]].concat(it.n===1 ? [[`${bH(it.g)} is hetzelfde als ${mH(it.g, 1)}.`]] : []),
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
    const R = makeR(st); const gs = R.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13]);
    const [p, q] = R.pick([[2, 3], [3, 4], [2, 5], [4, 7], [5, 8]]);
    const L = [
      [mH(gs[0], 0), Q(1)], [mH(-gs[1], 0), Q(1)], [minH(mH(gs[2], 0)), Q(-1), 'Het minteken staat niet bij het grondtal: eerst de macht, dan het minteken.'],
      [mH(gs[3], 1), Q(gs[3])], [mH(-gs[4], 1), Q(-gs[4])], R.f()<.5 ? [mH(`${p}/${q}`, 0), Q(1)] : [mH(`-${p}/${q}`, 1), Q(-p, q)]];
    reeks(b, L.length, (g, i, nr) => { const [h, T, m] = L[i];
      mQ(g, st, save, 'n' + i, { nr, html:`${h} ${isq} {{u:a,t}}`, check:V=>chkU(V.a, T, [[Q(0), 'Een macht met exponent 0 is niet 0, maar 1.'], ...(m ? [[Q(1), m]] : [])]) }); });
    b.append(el('div', 'm4-regel', `<div class="m4-line">${mH('a', 0)} ${isq} 1 &nbsp; en &nbsp; ${mH('a', 1)} ${isq} <i>a</i></div>Waarom is ${mH('a', 0)} = 1? Kijk naar de machtentrap: één trede onder ${mH('a', 1)} = <i>a</i> deel je door <i>a</i>, en <i>a</i> : <i>a</i> = 1.`));
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
  cheat:CHEAT_NEG, cards:[NG.trap, NG.schimmel, NG.pos, NG.reken, NG.nul, NG.exp, NG.wn, NG.komma, NG.vgl, NG.grond] };

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
  if(o.pos && linNum(S) && S.k<0) st.push([`De exponent is negatief. Schrijf met een positieve exponent: typ eerst <b>1/</b>, dan komt de macht in de noemer.`, `${mH(b, S)} ${isq} ${brH('1', mH(b, -S.k))}`]);
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
  const lab = (y, e) => `<text class="t" x="${x0-14}" y="${y+s/2}" text-anchor="end" dominant-baseline="central">${let_ ? `<tspan font-style="italic">${g}</tspan>` : gt}<tspan class="sup" dy="-7">${e}</tspan></text>`;
  const txtOp = k===0 ? 0 : k===1 ? t : 1;
  for(let i=0; i<m; i++){ out += tile(x0 + i*d, y1, '', gt, 1); }
  for(let j=0; j<p; j++){ let x = x0 + j*d, y = y2; if(k===2){ x = lerp(x, x0 + (m+j)*d, t); y = lerp(y2, y1, t); } else if(k>2){ x = x0 + (m+j)*d; y = y1; }
    out += tile(x, y, 'b', gt, 1); }
  if(k<2){ out += lab(y1, m) + lab(y2, p); out += sT(x0 - 40, (y1+y2)/2 + s/2, '·', 'big');
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
    r.append(el('p', '', 'Gebruik de tegels.'));
    const g2 = el('div', 'm4-items een'); r.append(g2);
    mQ(g2, st, save, 'f', { nr:'a)', html:`<span class="txt">Hoeveel factoren ${bH(g)} staan er samen?</span> {{g:a}}`, check:V=>chkE(V.a, m+p, [[m*p, `Je vermenigvuldigde ${m} en ${p}. Tel de tegels.`]]) });
    mQ(g2, st, save, 'm', { nr:'b)', html:`${mH(g, m)} · ${mH(g, p)} ${isq} ${mE(g, 'a')}`, check:V=>chkE(V.a, m+p, [[m*p, 'De exponenten vermenigvuldigen klopt niet: tel de factoren.']]),
      onOk:()=>{ if(!r.querySelector('.m4-regel')) r.append(el('div', 'm4-regel nieuw', `<div class="m4-line">${mH('a', 'm')} · ${mH('a', 'p')} ${isq} ${mH('a', 'm+p')}</div>Hetzelfde grondtal: tel de exponenten op.`)); } });
  } };

/* ---------- som of product? ---------- */
VM.som = { title:'Som of product?', lvl:2,
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
      {pre:`In symbolen: <span class="m4-line" style="display:inline-flex">${mH('a', 'm')} · ${mH('a', 'p')} ${isq} <i>a</i></span> met als exponent`, ans:'m + p', why:''}],
      shuffle(['behoudt het grondtal', 'vermenigvuldigt de grondtallen', 'telt de exponenten op', 'vermenigvuldigt de exponenten', 'm + p', 'm · p', 'm − p']));
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
    stapUitleg(b, [[`${mH('10', -3)} · ${mH('10', 5)}`, 'Hetzelfde grondtal: 10.'], [`${isq} ${mH('10', '-3+5')}`, 'Behoud het grondtal en tel de exponenten op.'], [`${isq} ${mH('10', 2)}`, '−3 + 5 = 2']], {kop:'Voorbeeld'});
    const R = makeR(st); const L = vermPool(R);
    reeks(b, L.length, (g, i, nr) => { const [bb, es] = L[i]; const S = linSum(es);
      mQ(g, st, save, 'e' + i, { nr, html:`${prodE(bb, es)} ${isq} {{m:a}}`, check:V=>chkM(V.a, {b:bb, e:S, fout:prodFout(es)}), hint:vermSteps(bb, es), meer:VM_MEER,
        sol:`${prodE(bb, es)} ${isq} ${mH(bb, S)}, want ${ePlus(es)} = ${linT(S)}` }); });
  } };

/* ---------- met letters, positieve exponent ---------- */
VM.letters = { title:'Met letters: schrijf met een positieve exponent', lvl:2,
  instr:`Schrijf als één macht met een <b>positieve</b> exponent. Is de exponent negatief? Typ dan eerst <b>1/</b>: er komt een breukstreep en je schrijft de macht in de noemer.`,
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
    qChoice(row, st, save, 'pos', { html:`<span class="m4-line" style="display:inline-flex">${mH('b', 'm')} · ${mH('b', -n5)} ${isq} ${mH('b', `m-${n5}`)}</span> Wanneer is die exponent positief?`,
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
const ORDER = ['neg','verm'];
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
