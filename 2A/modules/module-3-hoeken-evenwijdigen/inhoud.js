/* ============================================================
   HULPFUNCTIES
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const PREFIX = '2a_m3_hoeken_v1_';
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
   MODULE 3 · HULP VOOR HOEKFIGUREN
   Eenheid: pixels van het viewBox, y naar beneden; hoeken in graden, tegenwijzerzin (polar uit de motor).
   ============================================================ */
const GR = {a:'α', b:'β', g:'γ', d:'δ'};
/* Â₁ als html */
const hA = (L, i) => i!=null ? `${hat(L)}<sub>${i}</sub>` : hat(L);
const hT = (L, i) => L + '̂' + (i!=null ? ['₀','₁','₂','₃','₄','₅','₆'][i] : '');
const sub = (s,i) => `${s}<sub>${i}</sub>`;
const deg = x => fmtDeg(x).replace(/\s/g,'');
const DEGP = '°';
const sumTxt = arr => arr.map(x=>x+'°').join(' + ');
const par2 = (a,b) => `${a} // ${b}`;
const nPar = (a,b) => `${a} <span class="npar">//</span> ${b}`;

/* ---------- tekenen in svg (klassen: zie CSS onderaan) ---------- */
const fx = x => Math.round(x*10)/10;
function hfWrap(W, H, inner, o={}){
  return `<svg class="hf${o.cls?' '+o.cls:''}" viewBox="0 0 ${W} ${H}" style="max-width:${o.maxw||Math.max(260, W*1.25)}px" role="img" aria-label="${esc(o.alt||'figuur met hoeken')}"><rect class="bg" x="0" y="0" width="${W}" height="${H}" rx="6"/>${inner}</svg>`;
}
function lnSvg(p, q, cls='ln'){ return `<line class="${cls}" x1="${fx(p.x)}" y1="${fx(p.y)}" x2="${fx(q.x)}" y2="${fx(q.y)}"/>`; }
/* volledige rechte door p in richting d, afgeknipt op de rechthoek */
function fullLine(p, d, W, H, pad=6){ const q = polar(p, 10, d); return clipLine(p, q, W, H, pad); }
function lineSvg(p, d, W, H, cls='ln', pad=6){ const [u,v] = fullLine(p, d, W, H, pad); return lnSvg(u, v, cls); }
function wedgePath(v, r, a0, a1){ const p0 = polar(v,r,a0), p1 = polar(v,r,a1); const sw = norm360(a1-a0); return `M${fx(v.x)} ${fx(v.y)}L${fx(p0.x)} ${fx(p0.y)}A${r} ${r} 0 ${sw>180?1:0} 0 ${fx(p1.x)} ${fx(p1.y)}Z`; }
function arcOnly(v, r, a0, a1){ const p0 = polar(v,r,a0), p1 = polar(v,r,a1); const sw = norm360(a1-a0); return `M${fx(p0.x)} ${fx(p0.y)}A${r} ${r} 0 ${sw>180?1:0} 0 ${fx(p1.x)} ${fx(p1.y)}`; }
function tx(x, y, s, cls='val', anc='middle'){ return `<text class="${cls}" x="${fx(x)}" y="${fx(y)}" text-anchor="${anc}" dominant-baseline="central">${s}</text>`; }
/* hoekboog met optioneel vulling, nummer of waarde. a0 -> a1 tegenwijzerzin */
function angSvg(v, a0, a1, o={}){
  const r = o.r || 18; let s = '';
  if(norm360(a1-a0) > 89.5 && norm360(a1-a0) < 90.5 && o.right!==false && !o.fillCls){
    s += rightL(v, a0, o.rcls);
  } else {
    if(o.fillCls) s += `<path class="wedge ${o.fillCls}" d="${wedgePath(v, r, a0, a1)}"/>`;
    if(o.arc!==false) s += `<path class="arc${o.arcCls?' '+o.arcCls:''}" d="${arcOnly(v, r, a0, a1)}"/>`;
  }
  const ma = a0 + norm360(a1-a0)/2;
  if(o.num!=null){ const p = polar(v, o.nr || (r*0.55), ma); s += tx(p.x, p.y, o.num, 'num'); }
  if(o.txt!=null){ const sw = norm360(a1-a0); const p = polar(v, o.tr || (r + (sw<35 ? 16 : 11)), ma); s += tx(p.x, p.y, o.txt, o.tcls||'val'); }
  return s;
}
/* het Belgische teken voor een rechte hoek: losse L met even lange benen, hoek van de L bij het hoekpunt */
function rightL(v, a0, cls){ const g = 2.6, q = 8; const e1 = polar(P(0,0),1,a0), e2 = polar(P(0,0),1,a0+90);
  const c = {x:v.x+g*(e1.x+e2.x), y:v.y+g*(e1.y+e2.y)}; const u1 = {x:c.x+q*e1.x, y:c.y+q*e1.y}, u2 = {x:c.x+q*e2.x, y:c.y+q*e2.y};
  return `<polyline class="rl${cls?' '+cls:''}" points="${fx(u2.x)},${fx(u2.y)} ${fx(c.x)},${fx(c.y)} ${fx(u1.x)},${fx(u1.y)}"/>`; }
function ptSvg(p, name, o={}){ const lp = o.lp || polar(p, o.ld||11, o.la!=null?o.la:120); return `<circle class="pt" cx="${fx(p.x)}" cy="${fx(p.y)}" r="2.4"/>` + (name ? tx(lp.x, lp.y, name, 'ptn') : ''); }
function nmSvg(p, d, W, H, name, o={}){ /* naam van een rechte bij het uiteinde */
  const [u,v] = fullLine(p, d, W, H, 6); const end = o.start ? u : v; const dd = o.start ? d+180 : d;
  const q = polar(end, o.back||14, dd+180); const n = polar(q, o.off||9, dd + (o.side||90)); return tx(n.x, n.y, name, 'nm'); }
const midAng = (a0, a1) => a0 + norm360(a1-a0)/2;

/* ============================================================
   TWEE RECHTEN EN EEN SNIJLIJN
   m = {W,H, A, B, da, db, ds}: A op a, B op b, s door B en A (ds = richting van B naar A)
   hoek 1 = tussen a (vooruit) en s (naar boven), 2, 3, 4 tegenwijzerzin verder
   ============================================================ */
function psMake(o){
  const W = o.W||340, H = o.H||230;
  const ds = o.ds!=null ? o.ds : 70;
  const By = H*0.76, Ay = o.Ay!=null ? o.Ay : H*0.3; const dy = By - Ay, dx = dy / Math.tan(ds*D2R);
  const B = o.B || P(W/2 - dx/2 + (o.shift||0), By);
  const A = o.A || P(B.x + dx, Ay);
  const da = o.da!=null ? o.da : 8, db = o.db!=null ? o.db : da;
  return {W, H, A, B, da, db, ds, n:{a:'a', b:'b', s:'s', A:'A', B:'B', ...(o.n||{})}};
}
/* de vier hoeken bij een snijpunt: [a0, a1] tegenwijzerzin */
function psSectors(dl, ds){ return { 1:[dl, ds], 2:[ds, dl+180], 3:[dl+180, ds+180], 4:[ds+180, dl+360] }; }
function psVal(m, k){ const V = k[0]==='A' ? m.da : m.db; const x = norm360(m.ds - V); const i = +k[1]; return (i%2===1) ? x : 180-x; }
function psAllVals(m){ const r = {}; ['A','B'].forEach(L=>[1,2,3,4].forEach(i=>r[L+i] = psVal(m, L+i))); return r; }
/* soort hoekenpaar: A boven, B onder; binnen = tussen de rechten */
const PAIRTYPE = {
  ov:{naam:'overeenkomstige hoeken', kort:'overeenkomstig', rel:'gelijk', pairs:[['A1','B1'],['A2','B2'],['A3','B3'],['A4','B4']]},
  vb:{naam:'verwisselende binnenhoeken', kort:'verwisselende binnenhoeken', rel:'gelijk', pairs:[['A3','B1'],['A4','B2']]},
  bz:{naam:'binnenhoeken aan dezelfde kant van de snijlijn', kort:'binnenhoeken zelfde kant', rel:'supp', pairs:[['A3','B2'],['A4','B1']]},
  vu:{naam:'verwisselende buitenhoeken', kort:'verwisselende buitenhoeken', rel:'gelijk', pairs:[['A1','B3'],['A2','B4']]},
  uz:{naam:'buitenhoeken aan dezelfde kant van de snijlijn', kort:'buitenhoeken zelfde kant', rel:'supp', pairs:[['A1','B4'],['A2','B3']]},
  os:{naam:'overstaande hoeken', kort:'overstaande hoeken', rel:'gelijk', pairs:[['A1','A3'],['A2','A4'],['B1','B3'],['B2','B4']]},
  nh:{naam:'nevenhoeken', kort:'nevenhoeken', rel:'supp', pairs:[['A1','A2'],['A2','A3'],['A3','A4'],['A4','A1'],['B1','B2'],['B2','B3'],['B3','B4'],['B4','B1']]}
};
const TYPES5 = ['ov','vb','bz','vu','uz'];
function pairType(k1, k2){ for(const [t,o] of Object.entries(PAIRTYPE)) if(o.pairs.some(p=>(p[0]===k1&&p[1]===k2)||(p[0]===k2&&p[1]===k1))) return t; return null; }
const TYPEOPTS = [['ov','overeenkomstige hoeken'],['vb','verwisselende binnenhoeken'],['bz','binnenhoeken aan dezelfde kant van de snijlijn'],['vu','verwisselende buitenhoeken'],['uz','buitenhoeken aan dezelfde kant van de snijlijn']];
const TYPEOPTS7 = [...TYPEOPTS, ['os','overstaande hoeken'],['nh','nevenhoeken']];
/* hoeknaam in html: A3 -> Â₃ met de naam van het punt */
const kH = (m, k) => hA(m.n[k[0]], k[1]);
const kT = (m, k) => hT(m.n[k[0]], +k[1]);

/* tekenen. o: {nums:true, vals:{A1:'62°'}|true, fill:{A1:'or'}, arcs:['A1',...] (standaard alle bij nums), hot:true, sel:[], names:true, zone:false, hide:{b:true} } */
function psSvg(m, o={}){
  const {W, H, A, B, da, db, ds} = m; let s = '';
  if(o.zone){ const [a1,a2] = fullLine(A, da, W, H, 0), [b1,b2] = fullLine(B, db, W, H, 0);
    const pts = [a1, a2, b2, b1]; s += `<polygon class="zone" points="${pts.map(p=>fx(p.x)+','+fx(p.y)).join(' ')}"/>`; }
  const fill = o.fill || {};
  const arcs = o.arcs || (o.nums!==false || o.vals ? ['A1','A2','A3','A4','B1','B2','B3','B4'] : []);
  const R = o.r || 21;
  const sec = L => psSectors(L==='A'?da:db, ds);
  /* vullingen eerst */
  Object.entries(fill).forEach(([k,c])=>{ const v = k[0]==='A'?A:B; const [a0,a1] = sec(k[0])[k[1]]; s += `<path class="wedge ${c}" d="${wedgePath(v, R+3, a0, a1)}"/>`; });
  /* rechten */
  if(!(o.hide&&o.hide.a)) s += lineSvg(A, da, W, H, 'ln' + (o.clsA?' '+o.clsA:''));
  if(!(o.hide&&o.hide.b)) s += lineSvg(B, db, W, H, 'ln' + (o.clsB?' '+o.clsB:''));
  if(!(o.hide&&o.hide.s)) s += lineSvg(B, ds, W, H, 'ln s');
  /* bogen, nummers, waarden */
  arcs.forEach(k=>{ const L = k[0], i = k[1]; const v = L==='A'?A:B; const [a0,a1] = sec(L)[i]; const sw = norm360(a1-a0);
    const rr = R - (sw>120 ? 5 : 0);
    if(o.arcLines!==false) s += `<path class="arc" d="${arcOnly(v, rr, a0, a1)}"/>`;
    const ma = midAng(a0,a1);
    if(o.nums!==false){ const p = polar(v, rr*0.6 + (sw<40? 4:0), ma); s += tx(p.x, p.y, i, 'num'); }
    const val = o.vals===true ? deg(psVal(m,k)) : (o.vals && o.vals[k]);
    if(val){ const L2 = String(val).replace(/<[^>]+>/g,'').length; const p = polar(v, rr + (sw<40 ? 17 : 13) + (L2>4 ? (sw<75 ? Math.min(18, (L2-4)*3.5) : 3) : 0), ma); s += tx(p.x, p.y, val, 'val'); }
  });
  if(o.hot){ ['A','B'].forEach(L=>[1,2,3,4].forEach(i=>{ const v = L==='A'?A:B; const [a0,a1] = sec(L)[i]; const k = L+i;
    s += `<path class="hot${(o.sel||[]).includes(k)?' sel':''}" data-k="${k}" d="${wedgePath(v, R+12, a0, a1)}"/>`; })); }
  /* punten en namen */
  if(o.names!==false){
    /* puntnaam naast de rechte, links van het snijpunt, buiten de boogjes, in de grootste van hoek 2 en 3 */
    const plab = (v, dl) => { const big2 = norm360(dl+180-ds) >= 90; return polar(polar(v, R+11, dl+180), 9, dl+180+(big2?-90:90)); };
    s += ptSvg(A, m.n.A, {lp: plab(A, da)});
    s += ptSvg(B, m.n.B, {lp: plab(B, db)});
    if(!(o.hide&&o.hide.a)) s += nmSvg(A, da, W, H, m.n.a);
    if(!(o.hide&&o.hide.b)) s += nmSvg(B, db, W, H, m.n.b);
    if(!(o.hide&&o.hide.s)) s += nmSvg(B, ds, W, H, m.n.s, {side:-90});
  }
  return s;
}
function psFig(m, o={}){ return hfWrap(m.W, m.H, psSvg(m, o), o); }

/* willekeurige opgavefiguur met evenwijdige (of bijna) rechten */
function psRandom(R, o={}){
  const ds = o.ds!=null ? o.ds : R.pick([R.int(52,78), R.int(102,128)]);
  const da = o.da!=null ? o.da : R.int(-14, 14);
  const db = o.db!=null ? o.db : da;
  return psMake({W:o.W||320, H:o.H||220, ds, da, db, n:o.n});
}
/* gehele hoeken: kies ds zodat A1 een geheel getal is */
function psWithAngle(R, x1, o={}){ /* x1 = grootte van hoek 1 */
  const da = o.da!=null ? o.da : R.int(-12, 12);
  const ds = da + x1;
  const db = o.db!=null ? o.db : da;
  return psMake({W:o.W||320, H:o.H||220, ds, da, db, n:o.n, Ay:o.Ay});
}
const LINE_N = [['a','b','s'],['k','m','p'],['a','b','c'],['d','e','t'],['p','q','r']];
const PT_N = [['A','B'],['K','M'],['P','Q'],['S','T'],['E','F']];
function psNames(R){ const l = R.pick(LINE_N), p = R.pick(PT_N); return {a:l[0], b:l[1], s:l[2], A:p[0], B:p[1]}; }

/* ============================================================
   KLIKBARE FIGUUR: hoeken aanklikken
   ============================================================ */
function hotFig(parent, render, onPick){
  const box = el('div','hf-box'); parent.append(box);
  const paint = ()=>{ box.innerHTML = render(); };
  box.addEventListener('click', e=>{ const h = e.target.closest('.hot'); if(!h) return; onPick(h.dataset.k); });
  paint(); return {paint, box};
}

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
  wrap.append(el('div','ord-lab','Tik de stappen aan in de juiste volgorde:'), pool, el('div','ord-lab','Jouw bewijs:'), list);
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
    if(s.seq.length < cfg.lines.length){ fb.className='fb info'; fb.textContent='Leg eerst alle stappen in je bewijs.'; return; }
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
   BEWIJS SCHRIJVEN: elke regel zelf typen, met knoppen voor ^ ∥ ° α β γ en een dakje
   rows: [{lab, ans:[mogelijke schrijfwijzen], hint}]
   ============================================================ */
/* vergelijken: spaties, hoofdletters, dakjes, indices en gelijkwaardige tekens weg */
function normProof(s){
  return String(s).toLowerCase()
    .replace(/[̂^]/g,'').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, d=>'0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(d)])
    .replace(/\/\/|∥|\|\|/g,'//').replace(/º|°/g,'').replace(/alfa|alpha/g,'α').replace(/beta/g,'β').replace(/gamma/g,'γ').replace(/delta/g,'δ')
    .replace(/[−–]/g,'-').replace(/[·*×]/g,'').replace(/\s+/g,'').replace(/[.;:]$/,'');
}
/* een som in willekeurige volgorde aanvaarden: "a+b+c=180" */
function sameSum(a, b){ const sp = t => { const [l,r] = t.split('='); if(r==null) return null; return [l.split('+').sort().join('+'), r]; };
  const x = sp(a), y = sp(b); if(!x||!y) return false; return (x[0]===y[0] && x[1]===y[1]) || (x[0]===y[1].split('+').sort().join('+') && x[1]===y[0]); }
function eqProof(v, answers){ const n = normProof(v); return answers.some(a=>{ const m = normProof(a); if(n===m) return true;
  if(n.includes('=') && m.includes('=')){ const [l1,r1] = n.split('='), [l2,r2] = m.split('='); if(l1===r2 && r1===l2) return true; if(sameSum(n,m)) return true; }
  return false; }); }
const PROOFKEYS = [['^','dakje'],['α','α'],['β','β'],['γ','γ'],['°','°'],['//','//'],['⇓','⇓'],['Δ','Δ']];
function proofWriter(parent, st, save, id, cfg){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {v:{}, shown:false});
  const wrap = el('div','pw');
  if(cfg.html) wrap.append(el('div','q-text block', cfg.html));
  const grid = el('div','pw-grid'); wrap.append(grid);
  const keys = el('div','pw-keys'); let lastInp = null;
  PROOFKEYS.forEach(([k,lab])=>{ const b = el('button','btn ghost pw-key', lab==='dakje' ? 'Â dakje' : lab); b.type='button';
    b.addEventListener('mousedown', e=>e.preventDefault());
    b.addEventListener('click', ()=>{ const i = lastInp; if(!i || i.readOnly) return; const p = i.selectionStart ?? i.value.length;
      const ins = k==='^' ? '̂' : k; i.value = i.value.slice(0,p) + ins + i.value.slice(i.selectionEnd ?? p); i.focus(); i.setSelectionRange(p+ins.length, p+ins.length); i.dispatchEvent(new Event('input')); });
    keys.append(b); });
  wrap.append(el('div','pw-tip','Een dakje zet je met de knop <b>Â dakje</b> direct na de letter (of typ <b>^</b>). Een index typ je gewoon als cijfer: <b>A^1</b> wordt Â1.'), keys);
  const inputs = [], fbs = [];
  cfg.rows.forEach((r,i)=>{
    const lab = el('div','pw-lab', r.lab||''); const cell = el('div','pw-cell');
    const inp = el('input','inp pw-inp'); inp.type='text'; inp.autocomplete='off'; inp.spellcheck=false; inp.id = `${id}-r${i}`; inp.setAttribute('aria-label', 'regel '+(i+1));
    if(r.ph) inp.placeholder = r.ph;
    if(s.v[i]!=null) inp.value = s.v[i];
    if(r.given!=null){ inp.value = r.given; inp.readOnly = true; inp.classList.add('pw-given'); }
    inp.addEventListener('focus', ()=>{ lastInp = inp; });
    inp.addEventListener('input', ()=>{ inp.value = inp.value.replace(/\^/g,'̂'); s.v[i] = inp.value; save(); inp.classList.remove('ok','bad'); });
    const why = r.why!=null ? el('span','pw-why', r.why) : null;
    const f = el('div','pw-fb');
    cell.append(inp); if(why) cell.append(why); cell.append(f);
    grid.append(lab, cell); inputs.push(inp); fbs.push(f);
  });
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button';
  const solB = el('button','linkbtn','Toon het modelbewijs'); solB.type='button'; solB.hidden = !cfg.solAlways;
  act.append(btn, solB); const fb = el('div','fb'); const sol = el('div','sol', cfg.sol||''); sol.hidden = true;
  wrap.append(act, fb, sol); parent.append(wrap);
  /* r.kw: lijst van woordgroepen; elke groep moet voorkomen (één van de varianten) */
  const kwOk = (v, kw) => { const n = String(v).toLowerCase(); return kw.every(g=>(Array.isArray(g)?g:[g]).some(w=>n.includes(w))); };
  const rowOk = i => cfg.rows[i].given!=null ? true : cfg.rows[i].kw ? kwOk(inputs[i].value, cfg.rows[i].kw) : eqProof(inputs[i].value, cfg.rows[i].ans);
  function run(){
    if(inputs.some(x=>!x.value.trim())){ fb.className='fb info'; fb.textContent='Vul eerst elke regel in.'; return; }
    let all = true;
    inputs.forEach((inp,i)=>{ const ok = rowOk(i); all = all && ok; inp.classList.remove('ok','bad'); if(cfg.rows[i].given==null) inp.classList.add(ok?'ok':'bad');
      fbs[i].textContent = ok ? '' : (cfg.rows[i].hint || ''); });
    fb.className = 'fb '+(all?'ok':'bad'); fb.innerHTML = all ? '✅ Juist! Je bewijs is volledig.' : '❌ Nog niet juist. Kijk naar de rode regels.';
    if(!all) solB.hidden = false; s.checked = true; save(); if(!quiz) CLres(qid, all);
  }
  btn.addEventListener('click', run);
  solB.addEventListener('click', ()=>{ sol.hidden=!sol.hidden; solB.textContent = sol.hidden?'Toon het modelbewijs':'Verberg het modelbewijs'; });
  if(quiz){ btn.hidden = true; quiz.push({pts:cfg.pts||1, grade:()=>inputs.every((_,i)=>rowOk(i)), reveal:ok=>{ inputs.forEach((inp,i)=>{ inp.classList.add(rowOk(i)?'ok':'bad'); }); if(!ok) sol.hidden=false; }, lock:()=>inputs.forEach(x=>x.readOnly=true) }); }
  else if(s.checked) run();
}

/* ============================================================
   ANIMATIE IN STAPPEN ("Toon mij hoe"): steps [{cap, draw:(t)=>svg-binnenwerk, ms}]
   De uitleg blijft staan; knoppen vorige/volgende stap en afspelen.
   ============================================================ */
function stepAnim(parent, cfg){
  const box = el('div','sa'); parent.append(box);
  const fig = el('div','sa-fig'); const cap = el('div','sa-cap'); const ctl = el('div','sa-ctl');
  box.append(fig, cap, ctl);
  const bPrev = el('button','btn ghost','◀ Vorige stap'), bPlay = el('button','btn', cfg.playLabel||'▶ Toon mij hoe'), bNext = el('button','btn ghost','Volgende stap ▶');
  [bPrev,bPlay,bNext].forEach(b=>{ b.type='button'; ctl.append(b); });
  const cnt = el('span','sa-cnt'); ctl.append(cnt);
  let i = -1, run = 0, playing = false;
  const W = cfg.W, H = cfg.H;
  const draw = (k, t)=>{ const stp = cfg.steps[k]; fig.innerHTML = hfWrap(W, H, (cfg.base?cfg.base(k):'') + stp.draw(t), {maxw:cfg.maxw, alt:cfg.alt}); };
  const capHtml = k => (cfg.keepCaps ? cfg.steps.slice(0,k+1).map((s,j)=>`<div class="${j===k?'now':'old'}">${s.cap}</div>`).join('') : cfg.steps[k].cap);
  function go(k, anim){ run++; const my = run; i = k; cap.innerHTML = capHtml(k); cnt.textContent = `stap ${k+1} van ${cfg.steps.length}`;
    bPrev.disabled = k<=0; bNext.disabled = k>=cfg.steps.length-1;
    if(anim && !REDUCED_M){ const ms = cfg.steps[k].ms || 1400; tween(ms, t=>{ if(my===run) draw(k, t); }, ()=>{ if(my===run && playing){ if(k<cfg.steps.length-1) setTimeout(()=>{ if(my===run && playing) go(k+1, true); }, cfg.pause||900); else { playing=false; bPlay.textContent = '⟲ Opnieuw'; } } }); }
    else { draw(k, 1); if(playing){ if(k<cfg.steps.length-1) setTimeout(()=>{ if(my===run && playing) go(k+1, false); }, (cfg.pause||900)+600); else { playing=false; bPlay.textContent='⟲ Opnieuw'; } } }
  }
  bPlay.addEventListener('click', ()=>{ if(playing){ playing=false; run++; bPlay.textContent = cfg.playLabel||'▶ Toon mij hoe'; return; } playing = true; bPlay.textContent = '■ Pauze'; go(i>=cfg.steps.length-1 || i<0 ? 0 : i+1, true); });
  bPrev.addEventListener('click', ()=>{ playing=false; bPlay.textContent = cfg.playLabel||'▶ Toon mij hoe'; if(i>0) go(i-1, false); });
  bNext.addEventListener('click', ()=>{ playing=false; bPlay.textContent = cfg.playLabel||'▶ Toon mij hoe'; if(i<cfg.steps.length-1) go(i+1, true); });
  go(0, false);
  return {go};
}
const REDUCED_M = (()=>{ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();

/* ============================================================
   DYNAMISCHE HOEKFIGUUR MET HANDVATTEN
   cfg: {W,H, st:{...beginwaarden}, handles:(S)=>[{k, x,y}], drag:(k, p, S)=>void, draw:(S)=>svg, info:(S)=>html, ctl:[el]}
   ============================================================ */
function dynAng(parent, cfg){
  const box = el('div','dyn hf-dyn');
  const host = el('div'); box.append(host);
  const info = el('div','dyn-info'); if(cfg.info) box.append(info);
  if(cfg.ctl){ const c = el('div','dyn-ctl'); cfg.ctl.forEach(x=>c.append(x)); box.append(c); }
  parent.append(box);
  const S = cfg.st;
  let svg = null, dk = null;
  function redraw(){
    let s = cfg.draw(S);
    (cfg.handles ? cfg.handles(S) : []).forEach(h=>{ s += `<circle class="hdl" data-k="${h.k}" cx="${fx(h.x)}" cy="${fx(h.y)}" r="${h.r||8}"/>` + (h.lab ? tx(h.x, h.y, h.lab, 'hdl-l') : ''); });
    host.innerHTML = hfWrap(cfg.W, cfg.H, s, {maxw:cfg.maxw, alt:cfg.alt, cls:'drag'}); svg = host.firstChild;
    if(cfg.info) info.innerHTML = cfg.info(S);
    if(cfg.onChange) cfg.onChange(S);
  }
  const toW = e => { const pt = svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return {x:r.x, y:r.y}; };
  host.addEventListener('pointerdown', e=>{ const t = e.target.closest('.hdl'); let k = t ? t.dataset.k : null;
    if(!k){ const p = toW(e); let bd = 16; (cfg.handles ? cfg.handles(S) : []).forEach(h=>{ const d = Math.hypot(p.x-h.x, p.y-h.y); if(d<bd){ bd=d; k=h.k; } }); }
    if(!k) return; dk = k; e.preventDefault(); try{ host.setPointerCapture(e.pointerId); }catch(_){} });
  host.addEventListener('pointermove', e=>{ if(!dk) return; const p = toW(e); p.x = clamp(p.x, 2, cfg.W-2); p.y = clamp(p.y, 2, cfg.H-2); cfg.drag(dk, p, S); redraw(); });
  const up = ()=>{ if(dk && cfg.onDrop) cfg.onDrop(S); dk = null; };
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
  redraw();
  return {S, redraw, box, info};
}

/* ---------- invoer en controle van hoeken ---------- */
const degChk = (t, tol=0.02) => v => { const x = parseDeg(v); if(isNaN(x)) return null; return Math.abs(x - t) <= tol; };
/* meerdere hoekvakken tegelijk: targets = [62, 118, ...] */
function chkDegs(targets, extra){ return vals => { const f = targets.map((t,i)=>{ const x = parseDeg(vals[i]); return !isNaN(x) && Math.abs(x-t)<0.02; });
  const any = vals.some(v=>isNaN(parseDeg(v)));
  const ok = f.every(Boolean); return {ok, fields:f, msg: ok ? (extra||'') : any ? 'Noteer telkens een hoekgrootte, bijvoorbeeld 62 of 62°.' : 'Kijk naar de rode vakjes.'}; }; }
/* keuzelijst als invulvak (select) in een qBlock: [[sel:key]] wordt niet door fillInputs gemaakt, dus eigen veld */
function selHTML(f, opts, cls=''){ return `<select class="inp sel ${cls}" data-f="${f}" aria-label="keuzelijst ${f+1}"><option value="">kies …</option>${opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>`; }

/* ---------- klik-naam-blok: een figuur + een keuzevraag voor de naam van een paar ---------- */
function nameQ(parent, st, save, id, o){
  qChoice(parent, st, save, id, {html:o.html, fig:o.fig, opts:o.opts, ans:o.ans, alt:o.alt, why:o.why, whyBad:o.whyBad, pts:o.pts});
}

/* ---------- redenen (verantwoording) ---------- */
const REDEN = {
  os:'overstaande hoeken', nh:'nevenhoeken', ov:'overeenkomstige hoeken', vb:'verwisselende binnenhoeken', vu:'verwisselende buitenhoeken',
  bz:'binnenhoeken aan dezelfde kant van de snijlijn', uz:'buitenhoeken aan dezelfde kant van de snijlijn', gs:'gestrekte hoek', dr:'som van de hoeken in een driehoek', co:'complementaire hoeken'
};
const REDENOPTS = ['os','nh','ov','vb','vu','bz','uz'].map(k=>[k, REDEN[k]]);

/* ============================================================
   EXTRA STIJL VOOR DEZE MODULE
   ============================================================ */
(function(){
  const css = `
  .hf{display:block; width:100%; margin:.5rem auto; touch-action:manipulation; user-select:none; -webkit-user-select:none; color:var(--ink)}
  .hf.drag{touch-action:none}
  .hf .bg{fill:var(--card); stroke:var(--border); stroke-width:1}
  .hf .ln{stroke:var(--ink); stroke-width:1.7; stroke-linecap:round; fill:none}
  .hf .ln.s{stroke:var(--ink)}
  .hf .ln.help{stroke:var(--accent-dark); stroke-dasharray:6 4; stroke-width:1.5}
  .hf .ln.or{stroke:var(--orange); stroke-width:2.6}
  .hf .ln.tq{stroke:var(--accent); stroke-width:2.6}
  .hf .ln.thin{stroke-width:1.1; stroke:var(--ink-soft)}
  .hf .ln.ghost{stroke:var(--ink-soft); stroke-dasharray:4 4; stroke-width:1.2}
  .hf .zone{fill:var(--accent); opacity:.13}
  .hf .arc{stroke:var(--accent-dark); stroke-width:1.3; fill:none}
  .hf .arc.or{stroke:var(--orange); stroke-width:2}
  .hf .rl{stroke:var(--ink); stroke-width:1.2; fill:none; stroke-linecap:square}
  .hf .wedge{fill:transparent}
  .hf .wedge.or{fill:var(--orange); opacity:.6}
  .hf .wedge.tq{fill:var(--accent); opacity:.55}
  .hf .wedge.gr{fill:var(--ink-soft); opacity:.25}
  .hf .wedge.vi{fill:#b9a0e6; opacity:.6}
  .hf .wedge.ro{fill:#f08a7e; opacity:.55}
  .hf text{font-family:var(--f-body); paint-order:stroke; stroke:var(--card); stroke-width:3.2px; stroke-linejoin:round}
  .hf .num{fill:var(--accent-dark); font-size:10.5px; font-weight:700}
  .hf .val{fill:var(--ink); font-size:12.5px; font-weight:700}
  .hf .val.or{fill:#b26b00} .hf .val.big{font-size:15px}
  .hf .nm{fill:var(--ink); font-size:14px; font-style:italic; font-weight:600}
  .hf .pt{fill:var(--ink)}
  .hf .ptn{fill:var(--ink); font-size:13.5px; font-weight:700}
  .hf .cap{fill:var(--ink); font-size:12px; font-weight:700}
  .hf .hot{fill:transparent; cursor:pointer}
  .hf .hot:hover{fill:var(--orange); opacity:.25}
  .hf .hot.sel{fill:var(--orange); opacity:.55}
  .hf .hot.good{fill:var(--ok); opacity:.35} .hf .hot.badk{fill:var(--bad); opacity:.35}
  .hf .hdl{fill:var(--orange); fill-opacity:.28; stroke:var(--orange); stroke-width:1.8; cursor:grab}
  .hf .hdl-l{fill:var(--ink); font-size:9px; font-weight:700; pointer-events:none}
  .hf .tri{fill:var(--accent); opacity:.08; stroke:none}
  .hf .poly{fill:none; stroke:var(--ink); stroke-width:1.7; stroke-linejoin:round}
  .hf .snij{fill:var(--bad)} .hf .snijt{fill:var(--bad); font-size:11.5px; font-weight:700}
  .hf .okt{fill:var(--ok); font-size:13px; font-weight:700}
  .hf-box{max-width:560px; margin:0 auto}
  .hf .krat{fill:#ecd1a0; stroke:#8a5a1c; stroke-width:2.5}
  .hf .krat.in{fill:#f6e4c0; stroke-width:1.5}
  .hf .plank{stroke:#9c6a2a; stroke-width:9; stroke-linecap:round}
  .hf .plank.thin{stroke-width:7; opacity:.8}
  .hf .blade{stroke:#8a9599; stroke-width:7; stroke-linecap:round}
  .hf .handle{stroke:var(--orange); stroke-width:6; stroke-linecap:round}
  .hf .ring{fill:none; stroke:var(--orange); stroke-width:4}
  .hf .board{fill:#c9d6d8; stroke:#6b7a7d; stroke-width:1.5}
  .hf .leg{stroke:#6b7a7d; stroke-width:5; stroke-linecap:round}
  .hf .water{fill:#bfe6f2} .hf .kade{fill:#cfc6b8; stroke:#8b8172}
  .hf .deck{stroke:#4f6b5a; stroke-width:8; stroke-linecap:round}
  .df-grid{display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:.7rem; margin:.5rem 0}
  .df-card{border:2px solid var(--accent); border-radius:12px; padding:.5rem .7rem; background:var(--card)}
  .df-card .hf{margin:0 auto .3rem}
  .df-n{color:var(--bad)}
  .df-grid.verberg .df-d{background:var(--ink); color:transparent; border-radius:4px; user-select:none}
  .hf-dyn .dyn-info{font-size:1.05rem}
  .dyn.hf-dyn{background:var(--card)} .dyn.hf-dyn .hf .bg{stroke:none}
  .dyn.hf-dyn .dyn-info{background:var(--card); color:var(--ink); border-top-color:var(--border)}
  .dyn.hf-dyn .dyn-ctl{background:var(--accent-soft); color:var(--ink); border-top-color:var(--border)}
  .dyn.hf-dyn .dyn-ctl .btn.ghost{background:var(--card); color:var(--ink)}
  .hf-two{display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,1fr); gap:1rem; align-items:start}
  @media (max-width:760px){ .hf-two{grid-template-columns:1fr} }
  .npar{position:relative; display:inline-block}
  .npar::after{content:''; position:absolute; left:15%; right:15%; top:50%; border-top:1.5px solid currentColor; transform:rotate(-55deg)}
  .def{border-left:4px solid var(--bad); padding:.35rem .7rem; margin:.5rem 0; background:var(--bad-bg); border-radius:0 8px 8px 0}
  .def b.k{color:var(--bad)}
  .eig{border-left:4px solid var(--ok); padding:.35rem .7rem; margin:.5rem 0; background:var(--ok-bg); border-radius:0 8px 8px 0}
  .lbl-def{font-size:.78rem; text-transform:uppercase; letter-spacing:.06em; font-weight:700; color:var(--ink-soft); display:block}
  .sa{border:2px solid var(--accent); border-radius:12px; padding:.6rem; margin:.5rem 0; background:var(--card)}
  .sa-cap{min-height:2.8em; padding:.45rem .7rem; border-radius:10px; background:var(--accent-soft); font-size:1.05rem; line-height:1.45}
  .sa-cap .old{color:var(--ink-soft); font-size:.95rem}
  .sa-cap .now{font-weight:600}
  .sa-ctl{display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; margin-top:.5rem}
  .sa-cnt{color:var(--ink-soft); font-size:.9rem; margin-left:auto}
  .ord-pool{display:flex; flex-direction:column; gap:.35rem; margin:.3rem 0 .6rem}
  .ord-list{margin:.3rem 0; padding-left:1.6rem; display:flex; flex-direction:column; gap:.35rem}
  .ord-lab{font-weight:700; color:var(--accent-dark); margin-top:.3rem}
  .ord-step{font:inherit; text-align:left; padding:.45rem .7rem; border:2px solid var(--accent); border-radius:10px; background:var(--card); color:var(--ink); cursor:pointer; width:100%}
  .ord-step:hover{border-color:var(--orange); background:var(--or-soft)}
  .ord-step.in{background:var(--accent-soft)}
  .ord-step.good{border-color:var(--ok); background:var(--ok-bg)} .ord-step.wrong{border-color:var(--bad); background:var(--bad-bg)}
  .ord-empty{color:var(--ink-soft); list-style:none; margin-left:-1.4rem}
  .pw-grid{display:grid; grid-template-columns:max-content minmax(0,1fr); gap:.45rem .7rem; align-items:start; margin:.5rem 0}
  .pw-lab{font-weight:700; padding-top:.45rem; color:var(--accent-dark)}
  .pw-cell{display:flex; flex-wrap:wrap; align-items:center; gap:.4rem}
  .pw-inp{min-width:min(17rem,100%); flex:1 1 15rem; font-size:1.08rem}
  .pw-why{color:var(--accent-dark); font-size:.92rem}
  .pw-given{background:var(--accent-soft) !important; border-style:dashed !important}
  .pw-fb{flex-basis:100%; color:var(--bad); font-size:.92rem}
  .pw-fb:empty{display:none}
  .pw-keys{display:flex; flex-wrap:wrap; gap:.3rem; margin:.3rem 0}
  .pw-key{padding:.25rem .6rem; min-width:2.4rem}
  .pw-tip{font-size:.9rem; color:var(--ink-soft)}
  .bew{display:grid; grid-template-columns:max-content max-content minmax(0,1fr); gap:.15rem .6rem; align-items:baseline; margin:.4rem 0}
  .bew .r{color:var(--accent-dark); font-size:.92rem}
  .bew .ar{grid-column:1 / span 1; text-align:center}
  .inp.sel{width:auto; max-width:100%; padding-right:1.6rem; cursor:pointer}
  .legend{display:flex; flex-wrap:wrap; gap:.35rem; justify-content:center; margin:.35rem 0}
  .legend .opt.on{border-color:var(--orange) !important; background:var(--or-soft) !important}
  .vec-n{position:relative; display:inline-block; padding-top:.3em; line-height:1} .vec-n i{position:absolute; left:0; right:0; top:0; height:.32em} .vec-n svg{display:block; width:100%; height:100%; fill:none; stroke:currentColor; stroke-width:1.3; vector-effect:non-scaling-stroke}
  .zw{display:inline-block; width:.9em; height:.9em; border-radius:3px; vertical-align:-.1em; margin-right:.25em}
  .zw.or{background:var(--orange)} .zw.tq{background:var(--accent)} .zw.vi{background:#b9a0e6} .zw.ro{background:#f08a7e}
  .hint-fig{margin:.2rem 0 .8rem} .hint-fig summary{cursor:pointer; font-weight:700; color:var(--accent-dark)}
  .hint-in{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:.8rem; align-items:center; padding:.4rem .6rem; border-radius:10px; background:var(--or-soft)}
  @media (max-width:760px){ .hint-in{grid-template-columns:1fr} }
  .stap{display:inline-block; min-width:4.2em; font-weight:700; color:var(--accent-dark)}
.xvgl{margin:.4rem 0 1rem; padding-bottom:.6rem; border-bottom:1px dashed var(--line,#ccc)} .xvgl .stap{min-width:7.2em} .xvgl .inp.wide{max-width:100%}
.hint-gr{margin:.2rem 0 .4rem} .hint-stap{margin:.3rem 0 .5rem; padding:.5rem .8rem .5rem 2rem; border-radius:10px; background:var(--or-soft)} .hint-stap li{margin:.25rem 0} .hint-regel{font-weight:700; margin:.15rem 0 .2rem}
  .rel-ok{color:var(--ok); font-weight:700} .rel-no{color:var(--bad); font-weight:700}
  .mini-tbl{border-collapse:collapse; margin:.4rem 0; font-size:1rem}
  .mini-tbl th, .mini-tbl td{border:1.5px solid var(--border); padding:.3rem .55rem; text-align:center}
  .mini-tbl th{background:var(--accent-soft)}
  .ctx-row{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1rem; align-items:center}
  @media (max-width:760px){ .ctx-row{grid-template-columns:1fr} }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* ============================================================
   ONDERDELEN: ICONEN EN GEDEELDE HULP
   ============================================================ */
Object.assign(ICONS, {
  h_compl:'<path d="M4 20h16M4 20V4"/><path d="M4 20L17 9"/><path d="M10 20a6 6 0 0 0-1.4-3.9M4 13.5a6.5 6.5 0 0 1 3.4 1"/>',
  h_overst:'<path d="M3 17L21 7M3 7l18 10"/><path d="M8.5 9.7a4 4 0 0 0 0 4.6M15.5 9.7a4 4 0 0 1 0 4.6"/>',
  h_aanl:'<path d="M3 18h18M12 18L6 6M12 18l7-9"/><path d="M9.5 13.5a5 5 0 0 1 4-1"/>',
  h_def:'<path d="M5 3h10l4 4v14H5z"/><path d="M8 11h8M8 14.5h8M8 18h5"/><path d="M8 7.5h4"/>',
  h_namen:'<path d="M2 8.5h20M2 15.5h20M8 21l8-18"/><circle cx="10.7" cy="8.5" r="1" fill="currentColor"/><circle cx="13.6" cy="15.5" r="1" fill="currentColor"/>',
  h_eig:'<path d="M2 8.5h20M2 15.5h20M8 21l8-18"/><path d="M13.5 8.5a2.8 2.8 0 0 0-1.2-2.4M16.4 15.5a2.8 2.8 0 0 0-1.2-2.4" stroke-width="2.2"/>',
  h_omgek:'<path d="M2 8.5h20M2 15.5h20M8 21l8-18"/><path d="M19 3.5l2.5 2.5L19 8.5M5 15.5" /><path d="M21.5 6h-5"/>',
  h_ctx:'<path d="M6 21L11 3M18 21L13 3M8.5 13h7M7.2 17.5h9.6M9.7 8.5h4.6"/>',
  h_drie:'<path d="M3 19L12 4l9 15z"/><path d="M1.5 4h21" stroke-dasharray="2 1.5"/>',
  h_vier:'<path d="M4 18L7 5l13 3-3 11z"/><path d="M4 18L20 8" stroke-dasharray="2 1.5"/>',
  h_quiz:'<circle cx="12" cy="13" r="8"/><path d="M12 13V8.5M12 13l3 2M9.5 2.5h5"/>'
});
const CHEAT5 = `<h3>Spiekbriefje · de vijf soorten hoeken</h3><table>
  <tr><td>complementaire hoeken</td><td>twee hoeken waarvan de som 90° is<br>complement van α: 90° − α</td></tr>
  <tr><td>supplementaire hoeken</td><td>twee hoeken waarvan de som 180° is<br>supplement van α: 180° − α</td></tr>
  <tr><td>overstaande hoeken</td><td>twee hoeken waarvan de benen in elkaars verlengde liggen<br><b>eigenschap:</b> overstaande hoeken zijn even groot</td></tr>
  <tr><td>aanliggende hoeken</td><td>twee hoeken met een gemeenschappelijk been en waarvan het andere been gelegen is aan weerszijden van dat gemeenschappelijk been</td></tr>
  <tr><td>nevenhoeken</td><td>twee hoeken die aanliggend zijn en supplementair</td></tr></table>`;

/* één hoekvraag: tekst met één invulvak */
function degQ(parent, st, save, id, html, ans, o={}){
  return qBlock(parent, st, save, id, {html, block:true, mode:'decimal', size:o.size||'sm', sol:o.sol, why:o.why,
    check:v=>{ const x = parseDeg(v[0]); if(isNaN(x)) return {ok:false, msg:'Noteer een hoekgrootte, bijvoorbeeld 47 of 47°30′.'}; const ok = Math.abs(x-ans) < (o.tol||0.02); return {ok, msg: ok ? (o.why||'') : (o.hint||'')}; }});
}
/* een rij hoekvragen met letters a), b), ... */
function degRows(parent, st, save, items){
  items.forEach((it,i)=> degQ(parent, st, save, 'r'+i, `<span class="q-num">${LET[i]})</span> ${it.html}`, it.ans, it));
}
/* ---------- vergelijkingen met x ---------- */
/* lineaire uitdrukking in x lezen: geeft {a, b} voor a·x + b, of null */
function linParse(src){
  const s = String(src).toLowerCase().replace(/[°\s]/g,'').replace(/[·×*]/g,'*').replace(/[−–]/g,'-').replace(/:/g,'/').replace(/,/g,'.');
  let i = 0; const peek = () => s[i];
  function expr(){ let v = term(); if(!v) return null; while(peek()==='+' || peek()==='-'){ const o = s[i++]; const w = term(); if(!w) return null; v = o==='+' ? {a:v.a+w.a, b:v.b+w.b} : {a:v.a-w.a, b:v.b-w.b}; } return v; }
  function term(){ let v = fac(); if(!v) return null;
    while(i < s.length){ const c = peek(); let o = null;
      if(c==='*' || c==='/'){ o = c; i++; } else if(c==='x' || c==='(' || /[0-9.]/.test(c)) o = '*'; else break;
      const w = fac(); if(!w) return null;
      if(o==='*'){ if(v.a && w.a) return null; v = {a:v.a*w.b + w.a*v.b, b:v.b*w.b}; }
      else { if(w.a || !w.b) return null; v = {a:v.a/w.b, b:v.b/w.b}; } }
    return v; }
  function fac(){ const c = peek();
    if(c==='-'){ i++; const v = fac(); return v && {a:-v.a, b:-v.b}; }
    if(c==='+'){ i++; return fac(); }
    if(c==='x'){ i++; return {a:1, b:0}; }
    if(c==='('){ i++; const v = expr(); if(!v || peek()!==')') return null; i++; return v; }
    const m = s.slice(i).match(/^[0-9]+(\.[0-9]+)?/); if(!m) return null; i += m[0].length; return {a:0, b:+m[0]}; }
  const v = expr(); return (v && i===s.length) ? v : null;
}
/* tekst van a·x + b, bv. 3x − 20° */
function linTxt(a, b){ const xs = a===1 ? 'x' : a+'x'; return b ? `${xs} ${b<0?'−':'+'} ${Math.abs(b)}°` : xs; }
/* vraag: vergelijking opstellen, x berekenen en eventueel de hoek
   q = {nr, html, fig, L:[a,b], R:[c,d], x, ang:{lab, v}, help, hintEq, hintSolve, sol} */
function xVglQ(parent, st, save, id, q){
  const wrap = el('div','xvgl'); parent.append(wrap);
  if(q.fig) wrap.append(el('div','', q.fig));
  const C = {a:q.L[0]-q.R[0], b:q.L[1]-q.R[1]};
  let html = `${q.nr?`<span class="q-num">${q.nr}</span> `:''}${q.html}<br><span class="stap">Vergelijking:</span> [[0:wide]]<br><span class="stap">Oplossing:</span> x = [[1]]`;
  if(q.ang) html += `<br><span class="stap">Dus:</span> ${q.ang.lab} = [[2]]`;
  qBlock(wrap, st, save, id, {html, block:true, size:'sm', help:q.help, sol:q.sol,
    check:v=>{ const parts = v[0].split('=');
      let eq = false, solved = false;
      if(parts.length===2){ const l = linParse(parts[0]), r = linParse(parts[1]);
        if(l && r){ const D = {a:l.a-r.a, b:l.b-r.b}; eq = Math.abs(D.a) > 1e-9 && Math.abs(D.a*C.b - D.b*C.a) < 1e-6;
          solved = (l.a===1 && l.b===0 && !r.a) || (r.a===1 && r.b===0 && !l.a); } }
      if(solved) eq = false;
      const xv = parseFloat(String(v[1]).replace(',','.').replace(/[°\s]/g,'')); const fx_ = Math.abs(xv - q.x) < 0.02;
      const fields = [eq, fx_];
      if(q.ang){ const y = parseDeg(v[2]); fields.push(!isNaN(y) && Math.abs(y - q.ang.v) < 0.02); }
      const ok = fields.every(Boolean);
      let msg = '';
      if(!eq) msg = solved ? 'Schrijf eerst de vergelijking met de uitdrukkingen uit de opgave, nog niet het antwoord.' : (parts.length!==2 ? 'Een vergelijking heeft één gelijkheidsteken, bijvoorbeeld 2x + 10 = 70.' : q.hintEq);
      else if(!fx_) msg = q.hintSolve;
      else if(!ok) msg = `Vul x = ${q.x} in de uitdrukking in om ${q.ang.lab} te berekenen.`;
      return {ok, fields, msg}; }});
  /* hint die stap voor stap de oplossing toont */
  const steps = [...(q.pre||[]), ...linSteps(q.L, q.R), ...(q.post||[])];
  const hb = el('div','hint-gr'); const ol = el('ol','hint-stap'); ol.hidden = true;
  const nb = el('button','btn ghost', '💡 Hint: toon de eerste stap'); nb.type = 'button'; let n = 0;
  nb.addEventListener('click', ()=>{ if(n >= steps.length) return; const [u, r] = steps[n++]; ol.hidden = false; ol.append(el('li','', `${u}${r?`<div class="hint-regel">${r}</div>`:''}`));
    nb.textContent = n < steps.length ? '💡 Volgende stap' : ''; nb.hidden = n >= steps.length; });
  hb.append(ol, nb); wrap.append(hb);
}
/* stappen om a·x + b = c·x + d op te lossen: [[uitleg, regel], ...] */
function linSteps(L, R){ const [a, b] = L, [c, d] = R; const out = []; const k = n => n===1 ? '' : n;
  const lt = (p, q) => `${k(p)}x${q ? ` ${q<0?'−':'+'} ${Math.abs(q)}` : ''}`;
  if(c){ out.push([`Breng ${k(c)}x naar het linkerlid: trek ${k(c)}x af in beide leden.`, `${lt(a-c, b)} = ${d}`]); }
  const A = a - c;
  if(b){ out.push([`Breng ${Math.abs(b)} naar het rechterlid: ${b>0?`trek ${b} af`:`tel ${-b} op`} in beide leden.`, `${k(A)}x = ${d} ${b>0?'−':'+'} ${Math.abs(b)}<br>${k(A)}x = ${d-b}`]); }
  if(A!==1){ const x = (d-b)/A; out.push([`Deel beide leden door ${A}.`, `x = ${d-b} : ${A}<br>x = <b>${String(+x.toFixed(4)).replace('.',',')}</b>`]); }
  else out.push(['Nu ken je x.', `x = <b>${d-b}</b>`]);
  return out; }
/* x invullen in een uitdrukking: 2x + 5° -> 2 · 12° + 5° */
const subX = (e, x) => e.replace(/^(\d*)x/, (m,q)=>(q?q+' · ':'')+x+'°');
/* oplossing stap voor stap van a·x + b = c·x + d (geheel x) */
function linSol(a, b, c, d, totTxt){
  const L = linTxt(a,b).replace(/°/g,''), R = c ? linTxt(c,d).replace(/°/g,'') : String(d);
  const A = a-c, Bk = d-b; let s = `${totTxt||`${L} = ${R}`}`;
  if(totTxt) s += `<br>${L} = ${R}`;
  if(c) s += `<br>${a===1?'':a}x − ${c===1?'':c}x = ${d}${b? (b<0?` + ${-b}`:` − ${b}`):''}`;
  else if(b) s += `<br>${a===1?'':a}x = ${d}${b<0?` + ${-b}`:` − ${b}`}`;
  if(c || b) s += `<br>${A===1?'':A}x = ${Bk}`; if(A!==1) s += `<br>x = ${Bk} : ${A}`; s += `<br>x = ${Bk/A}`;
  return s;
}
const COMPL_HINT = 'Het complement van een hoek vind je met 90° − de hoek.';
const SUPPL_HINT = 'Het supplement van een hoek vind je met 180° − de hoek.';
/* hoek met minuten: 43°30′ */
function rDegMin(R, lo, hi){ const d = R.int(lo, hi); const m = R.pick([12,15,30,45,20,40,27,48]); return d + m/60; }
/* hoek met minuten en seconden: 43°27′18″ */
function rDms(R, lo, hi){ return R.int(lo, hi) + R.int(1, 59)/60 + R.int(1, 59)/3600; }
const DMS_TOL = 0.0001;
/* hint met een tekening: een uitklapper onder een vraag */
function hintFig(parent, svg, txt){ const d = el('details','hint-fig', `<summary>💡 Hint met tekening</summary><div class="hint-in">${svg}<div>${txt}</div></div>`); parent.append(d); return d; }
/* tekening voor de vergelijkingen: een rechte of gestrekte hoek verdeeld in stukken */
function partsSvg(total, parts, o={}){ /* parts: [{v, lab, cls}] in tegenwijzerzin vanaf 0° */
  const W = 300, H = total>90 ? 170 : 200, V = total>90 ? P(150, 145) : P(60, 175), R0 = total>90 ? 120 : 140; let s = '', a = 0;
  parts.forEach(p=>{ s += `<path class="wedge ${p.cls}" d="${wedgePath(V, R0-20, a, a+p.v)}"/>` + lnSvg(V, polar(V, R0, a+p.v), 'ln thin'); const m = polar(V, p.v < 40 && String(p.lab).length > 4 ? R0+4 : (R0-20)*0.66, a+p.v/2); s += tx(m.x, m.y, p.lab, 'val'); a += p.v; });
  s += lnSvg(V, polar(V, R0, 0)) + lnSvg(V, polar(V, R0, total));
  if(total===90) s += rightL(V, 0);
  if(o.brace){ o.brace.forEach(([a0,a1,lab])=>{ s += `<path class="arc or" d="${arcOnly(V, R0+6, a0, a1)}"/>`; const m = polar(V, R0+18, (a0+a1)/2); s += tx(m.x, m.y, lab, 'val or'); }); }
  s += `<circle class="pt" cx="${V.x}" cy="${V.y}" r="2.4"/>`;
  return hfWrap(W, H, s, {maxw:340, alt:'hint: hoek verdeeld in stukken'}); }

/* ---------- dynamische uitleg: complement en supplement van α ---------- */
function complDemo(body, mode){
  const W = 320, H = 190, V = P(160, 160);
  const S = {a:35, mode, sep:0, los:false};
  const bC = ctlBtn('Complement (samen 90°)', ()=>{ S.mode='c'; if(S.a>89) S.a=60; D.redraw(); });
  const bS = ctlBtn('Supplement (samen 180°)', ()=>{ S.mode='s'; D.redraw(); });
  const bL = ctlBtn('↔ Leg los van elkaar', ()=>{ if(S.busy) return; S.busy = true; const from = S.sep, to = S.los ? 0 : 1; S.los = !S.los;
    tween(REDUCED_M?10:1400, t=>{ S.sep = from + (to-from)*t; D.redraw(); }, ()=>{ S.busy = false; S.sep = to; D.redraw(); }); });
  const D = dynAng(body, {W, H, st:S, maxw:460, alt:'hoek α met zijn complement of supplement',
    ctl:[bC, bS, bL],
    handles:S=>S.sep>0 ? [] : [{k:'r', ...polar(V, 120, S.a)}],
    drag:(k,p,S)=>{ let a = Math.round(dirAng(V, p)); if(a>270) a = 1; a = clamp(a, 5, S.mode==='c' ? 85 : 175); S.a = a; },
    draw:S=>{ const full = S.mode==='c' ? 90 : 180, e = S.sep; let s = '';
      /* los: α schuift naar links, β schuift naar rechts en draait tot zijn eerste been horizontaal ligt */
      const V1 = P(V.x - 100*e, V.y), V2 = P(V.x + 60*e, V.y), th = -S.a*e, L = 140 - 65*e;
      s += `<path class="wedge tq" d="${wedgePath(V1, 46, 0, S.a)}"/>`;
      s += `<path class="wedge or" d="${wedgePath(V2, 40, S.a+th, full+th)}"/>`;
      s += lnSvg(V1, polar(V1, L, 0)) + lnSvg(V1, polar(V1, L-10, S.a));
      s += lnSvg(V2, polar(V2, L-10, S.a+th)) + lnSvg(V2, polar(V2, S.mode==='c'?L:L+10, full+th));
      if(e < 0.05){ if(S.mode==='c') s += rightL(V, 0); }
      const p1 = polar(V1, 62, S.a/2), p2 = polar(V2, 60, (S.a+full)/2 + th);
      s += tx(p1.x, p1.y, 'α = ' + S.a + '°', 'val'); s += tx(p2.x, p2.y, 'β = ' + (full-S.a) + '°', 'val or');
      s += `<circle class="pt" cx="${fx(V1.x)}" cy="${V1.y}" r="2.4"/>` + (e>0.05 ? `<circle class="pt" cx="${fx(V2.x)}" cy="${V2.y}" r="2.4"/>` : '');
      return s; },
    info:S=>{ bC.classList.toggle('on', S.mode==='c'); bS.classList.toggle('on', S.mode==='s'); bL.classList.toggle('on', S.los);
      bL.textContent = S.los ? '↔ Leg weer tegen elkaar' : '↔ Leg los van elkaar';
      const los = S.los ? `<br><i>α en β liggen nu los van elkaar. Hun som is nog altijd ${S.mode==='c'?90:180}°, dus ze blijven ${S.mode==='c'?'complementair':'supplementair'}.</i>` : '';
      return (S.mode==='c' ? `<span class="zw tq"></span>α = ${S.a}° en <span class="zw or"></span>β = 90° − ${S.a}° = <b>${90-S.a}°</b><br>α + β = 90°: α en β zijn <b>complementaire hoeken</b>. β is het <b>complement</b> van α.`
        : `<span class="zw tq"></span>α = ${S.a}° en <span class="zw or"></span>β = 180° − ${S.a}° = <b>${180-S.a}°</b><br>α + β = 180°: α en β zijn <b>supplementaire hoeken</b>. β is het <b>supplement</b> van α.`) + los; }
  });
  return D;
}

const CP = {};
CP.uitleg = { title:'Complementaire en supplementaire hoeken', lvl:1, noReset:true,
  instr:'Versleep het oranje bolletje. Kies het complement of het supplement. Met <b>Leg los van elkaar</b> zie je dat de hoeken niet tegen elkaar hoeven te liggen.',
  build(b){
    b.append(el('div','def', `<span class="lbl-def">definitie</span><b class="k">Complementaire hoeken</b> zijn twee hoeken waarvan de som 90° is.<br><b class="k">Supplementaire hoeken</b> zijn twee hoeken waarvan de som 180° is.<br><i>De twee hoeken hoeven niet tegen elkaar te liggen.</i>`));
    complDemo(b, 'c');
    b.append(el('div','tip', icon('bulb') + '<div>Het <b>complement</b> van α is 90° − α. Het <b>supplement</b> van α is 180° − α.<br>Een hoek wordt vaak aangeduid met een Griekse letter: α (alfa), β (bèta), γ (gamma), δ (delta).</div>'));
  }};
CP.hoeveel = { title:'Hoeveel graden meet de hoek?', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const items = [];
    const c1 = R.int(12, 78), c2 = R.int(12, 78); const cm = rDegMin(R, 21, 68);
    const s1 = R.int(14, 76), s2 = R.int(95, 166); const sm = rDegMin(R, 31, 140);
    items.push({html:`De hoek die complementair is met een hoek van ${c1}°: [[0]]`, ans:90-c1, hint:COMPL_HINT, sol:`90° − ${c1}° = ${90-c1}°`});
    items.push({html:`De hoek die supplementair is met een hoek van ${s1}°: [[0]]`, ans:180-s1, hint:SUPPL_HINT, sol:`180° − ${s1}° = ${180-s1}°`});
    items.push({html:`De hoek die complementair is met een hoek van ${c2}°: [[0]]`, ans:90-c2, hint:COMPL_HINT, sol:`90° − ${c2}° = ${90-c2}°`});
    items.push({html:`De hoek die supplementair is met een hoek van ${s2}°: [[0]]`, ans:180-s2, hint:SUPPL_HINT, sol:`180° − ${s2}° = ${180-s2}°`});
    const c3 = R.int(3, 87), s3 = R.int(91, 177);
    items.push({html:`Het complement van ${c3}° is [[0]]`, ans:90-c3, hint:COMPL_HINT, sol:`90° − ${c3}° = ${90-c3}°`});
    items.push({html:`Het supplement van ${s3}° is [[0]]`, ans:180-s3, hint:SUPPL_HINT, sol:`180° − ${s3}° = ${180-s3}°`});
    degRows(b, st, save, R.shuffle(items));
  }};
CP.keuze = { title:'Complementair of supplementair?', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const mk = t => { if(t==='c'){ const a = R.int(8,82); return [a, 90-a]; } if(t==='s'){ const a = R.int(15,165); return [a, 180-a]; } let a, c; do{ a = R.int(15,120); c = R.int(15,120); }while(a+c===90 || a+c===180); return [a,c]; };
    const kinds = R.shuffle(['c','s','s','c', R.pick(['n','c','s'])]);
    kinds.forEach((k,i)=>{ const [x,y] = mk(k); const sum = x+y;
      qChoice(b, st, save, 'k'+i, {html:`<span class="q-num">${LET[i]})</span> α = ${x}° en β = ${y}°. Dan zijn α en β …`,
        opts:[['c','complementair'],['s','supplementair'],['n','geen van beide']], ans:k,
        why:`α + β = ${x}° + ${y}° = ${sum}°.`, whyBad:`Tel op: α + β = ${x}° + ${y}° = ${sum}°. ${sum===90?'Som 90°: complementair.':sum===180?'Som 180°: supplementair.':'Geen 90° en geen 180°.'}`}); });
  }};
CP.tabel = { title:'Vul de tabel aan', lvl:2,
  build(b, st, save){ const R = makeR(st);
    /* per rij: welke kolom is gegeven */
    const rows = []; const used = new Set();
    const giv = R.shuffle(['a','a','c','s','a']);
    giv.forEach((g,i)=>{ let a; do{ a = R.int(4, 86); }while(used.has(a)); used.add(a); rows.push({g, a}); });
    let html = `<table class="mini-tbl"><tr><th>α</th><th>complement van α</th><th>supplement van α</th></tr>`;
    let f = 0;
    rows.forEach(r=>{ const a = r.a, c = 90-a, s = 180-a; const cell = (v, given) => given ? fmtDeg(v) : `[[${f++}]]`;
      html += `<tr><td>${cell(a, r.g==='a')}</td><td>${cell(c, r.g==='c')}</td><td>${cell(s, r.g==='s')}</td></tr>`;
    });
    html += '</table>';
    /* de volgorde van de vakjes volgt de tabel van links naar rechts */
    const order = []; rows.forEach(r=>{ const a=r.a; ['a','c','s'].forEach(k=>{ if(r.g!==k) order.push(k==='a'?a:k==='c'?90-a:180-a); }); });
    qBlock(b, st, save, 't', {html, block:true, size:'sm', mode:'decimal', check:chkDegs(order, ''),
      sol:'Complement = 90° − α en supplement = 180° − α. Is het complement gegeven, dan is α = 90° − complement. Is het supplement gegeven, dan is α = 180° − supplement.'});
  }};
/* samengestelde vragen in twee stappen: eerst het laatste deel, dan het eerste deel */
const SAMEN_HELP = 'Lees de vraag <b>van achter naar voor</b>. Bereken eerst het laatste deel (stap 1). Dat resultaat gebruik je in stap 2.';
function samenItems(R, gen){ /* gen(lo, hi) geeft een hoek */
  const name = {c:'complement', s:'supplement'}, tot = {c:90, s:180};
  const kinds = R.shuffle([['c','s'], ['s','c'], ['c','c'], ['s','s']]);
  return kinds.map(([outer, inner])=>{ /* outer van inner van a */
    let a; if(inner==='c') a = gen(5, 85); else if(outer==='c') a = gen(92, 175); else a = gen(10, 170);
    const st1 = tot[inner] - a, st2 = tot[outer] - st1;
    return {outer, inner, a, st1, st2, html:`Het <b>${name[outer]}</b> van het <b>${name[inner]}</b> van ${fmtDeg(a)}`,
      sol:`Stap 1: ${name[inner]} van ${fmtDeg(a)} = ${tot[inner]}° − ${fmtDeg(a)} = ${fmtDeg(st1)}<br>Stap 2: ${name[outer]} van ${fmtDeg(st1)} = ${tot[outer]}° − ${fmtDeg(st1)} = ${fmtDeg(st2)}`}; }); }
function samenRows(b, st, save, items, tol){
  items.forEach((x,i)=>{ const nm = {c:'complement', s:'supplement'};
    qBlock(b, st, save, 'r'+i, {html:`<span class="q-num">${LET[i]})</span> ${x.html}<br><span class="stap">Stap 1:</span> het ${nm[x.inner]} van ${fmtDeg(x.a)} = [[0]]<br><span class="stap">Stap 2:</span> het ${nm[x.outer]} van je uitkomst van stap 1 = [[1]]`,
      block:true, size:tol<0.01?'md':'sm', mode:'decimal', help:SAMEN_HELP,
      check:v=>{ const f = [x.st1, x.st2].map((t,k)=>{ const y = parseDeg(v[k]); return !isNaN(y) && Math.abs(y-t)<tol; });
        return {ok:f[0]&&f[1], fields:f, msg: f[0]&&f[1] ? '' : !f[0] ? `Stap 1: ${nm[x.inner]} = ${x.inner==='c'?90:180}° − de hoek.` : `Stap 2: neem het ${nm[x.outer]} van je uitkomst van stap 1.`}; },
      sol:x.sol}); }); }
CP.samen = { title:'Het complement van het supplement …', lvl:1,
  instr:'Zo een vraag los je in twee stappen op. Begin <b>achteraan</b>: bereken eerst het laatste deel en gebruik die uitkomst voor het eerste deel.',
  build(b, st, save){ const R = makeR(st);
    samenRows(b, st, save, samenItems(R, (lo,hi)=>R.int(lo,hi)), 0.02);
  }};
CP.samenMin = { title:'Complement en supplement met minuten en seconden', lvl:3,
  instr:'Nu tot op de minuut en de seconde. Typ 46°30′ als <b>46 30</b> en 46°30′15″ als <b>46 30 15</b>. Tip: 90° = 89°59′60″ en 180° = 179°59′60″.',
  build(b, st, save){ const R = makeR(st);
    const it = samenItems(R, (lo,hi)=>rDms(R, lo, hi-1)).slice(0,2);
    samenRows(b, st, save, it, DMS_TOL);
    const cm = rDegMin(R, 21, 68), sm = rDms(R, 31, 140);
    degQ(b, st, save, 'm1', `<span class="q-num">c)</span> Het complement van ${fmtDeg(cm)} is [[0]]`, 90-cm, {tol:DMS_TOL, size:'md', hint:'Reken met 89°60′ in plaats van 90°.', sol:`89°60′ − ${fmtDeg(cm)} = ${fmtDeg(90-cm)}`});
    degQ(b, st, save, 'm2', `<span class="q-num">d)</span> Het supplement van ${fmtDeg(sm)} is [[0]]`, 180-sm, {tol:DMS_TOL, size:'md', hint:'Reken met 179°59′60″ in plaats van 180°.', sol:`179°59′60″ − ${fmtDeg(sm)} = ${fmtDeg(180-sm)}`});
  }};
/* signaaloefening: een krat en een poort */
function kratSvg(al){ /* krat met een schuine plank van hoek tot hoek; α tussen plank en staander, β tussen plank en bovenlat */
  const be = 90-al, h = 130, w = clamp(h/Math.tan(be*D2R), 90, 230), W = w+60, H = h+60; let s = '';
  const x0 = 20, y0 = 20;
  s += `<rect x="${x0}" y="${y0}" width="${fx(w+20)}" height="${h+20}" class="krat"/>`;
  s += `<rect x="${x0+10}" y="${y0+10}" width="${fx(w)}" height="${h}" class="krat in"/>`;
  const v = P(x0+10, y0+10), q = P(x0+10+w, y0+10+h); const dd = dirAng(v, q);
  s += `<line class="plank" x1="${v.x}" y1="${v.y}" x2="${fx(q.x)}" y2="${fx(q.y)}"/>`;
  s += angSvg(v, dd, 360, {r:34, txt:'β', tr:46}); s += angSvg(v, 270, dd, {r:28, txt:'α', tr:42});
  return hfWrap(W, H, s, {maxw:W*1.3, alt:'krat met een schuine plank'});
}
function poortSvg(al){ /* poort: bovenste lat horizontaal, schoor van de lat naar de onderkant */
  const W = 300, H = 170; let s = '';
  s += `<rect x="20" y="30" width="260" height="120" class="krat"/>`;
  [62, 94, 126].forEach(y=> s += `<line class="plank thin" x1="20" y1="${y}" x2="280" y2="${y}"/>`);
  const d = 180 + al; const v0 = P(150, 150); const v = lineInter(v0, polar(v0, 10, al), P(0,30), P(10,30)) || P(170,30);
  const vv = P(clamp(v.x, 60, 250), 30); const lo = lineInter(vv, polar(vv,10,d), P(0,150), P(10,150)); let e = lo;
  if(lo.x < 22){ e = lineInter(vv, polar(vv,10,d), P(22,0), P(22,10)); }
  s += `<line class="plank" x1="${fx(vv.x)}" y1="${vv.y}" x2="${fx(e.x)}" y2="${fx(e.y)}"/>`;
  s += `<line class="plank" x1="20" y1="30" x2="280" y2="30"/>`;
  s += angSvg(vv, d, 360, {r:26, txt:'α', tr:40}); s += angSvg(vv, 180, d, {r:30, txt:'β', tr:44});
  return hfWrap(W, H, s, {maxw:340, alt:'poort met een schoor'});
}
CP.poort = { title:'Hoeken in een krat en een poort', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const al = R.int(25, 65), ga = R.int(115, 160);
    const two = el('div','hf-two'); b.append(two);
    const L = el('div'), Rr = el('div'); two.append(L, Rr);
    L.innerHTML = kratSvg(al); Rr.innerHTML = poortSvg(180-ga);
    const a1 = R.int(22, 68), g1 = R.int(110, 160);
    qChoice(L, st, save, 'k1', {html:'In het krat zijn α en β …', opts:[['c','complementair'],['s','supplementair']], ans:'c', why:'De hoek van het krat is een rechte hoek: α + β = 90°.', whyBad:'Kijk naar de hoek van het krat: dat is een rechte hoek.'});
    degQ(L, st, save, 'r1', `Als α = ${a1}°, dan is β = [[0]]`, 90-a1, {hint:COMPL_HINT, sol:`β = 90° − ${a1}° = ${90-a1}°`});
    qChoice(Rr, st, save, 'k2', {html:'In de poort zijn α en β …', opts:[['c','complementair'],['s','supplementair']], ans:'s', why:'Samen vormen ze een gestrekte hoek langs de bovenste lat: α + β = 180°.', whyBad:'α en β liggen samen langs de rechte bovenste lat.'});
    degQ(Rr, st, save, 'r2', `Als α = ${g1}°, dan is β = [[0]]`, 180-g1, {hint:SUPPL_HINT, sol:`β = 180° − ${g1}° = ${180-g1}°`});
  }};
CP.vgl = { title:'Een hoek zoeken met een vergelijking', lvl:2,
  instr:'Stel de hoek voor door α. Schrijf een vergelijking en los ze op. Kom je er niet uit? Open de hint met de tekening.',
  build(b, st, save){ const R = makeR(st);
    const t = [];
    const rep = (k, cls) => Array.from({length:k}, ()=>({v:0, lab:'α', cls}));
    { const k = R.pick([2,3,4,5,8]); const a = 180/(k+1); t.push({html:`Het supplement van een hoek is ${k} keer zo groot als die hoek. Bereken het <b>complement</b> van die hoek.`, ans:90-a,
      sol:`180° − α = ${k}α<br>180° = ${k+1}α<br>α = ${a}°<br>Het complement is 90° − ${a}° = ${90-a}°.`, hint:`Begin met 180° − α = ${k}α.`,
      fig:partsSvg(180, [{v:a, lab:'α', cls:'tq'}, ...rep(k,'or').map(p=>({...p, v:a}))], {brace:[[a, 180, 'supplement']]}),
      figTxt:`De gestrekte hoek (180°) bestaat uit α en het supplement. Het supplement is ${k} keer α. Dus: α + ${k}α = 180°, of ${k+1}α = 180°.`}); }
    { const k = R.pick([2,4,5,8]); const a = 90/(k+1); t.push({html:`Het complement van een hoek is ${k} keer zo groot als die hoek. Bereken het <b>supplement</b> van die hoek.`, ans:180-a,
      sol:`90° − α = ${k}α<br>90° = ${k+1}α<br>α = ${a}°<br>Het supplement is 180° − ${a}° = ${180-a}°.`, hint:`Begin met 90° − α = ${k}α.`,
      fig:partsSvg(90, [{v:a, lab:'α', cls:'tq'}, ...rep(k,'or').map(p=>({...p, v:a}))], {brace:[[a, 90, 'complement']]}),
      figTxt:`De rechte hoek (90°) bestaat uit α en het complement. Het complement is ${k} keer α. Dus: α + ${k}α = 90°, of ${k+1}α = 90°.`}); }
    { const n = R.pick([3,4,6,7,10]); const a = (90*n-180)/(n-1); const w = {3:'drie',4:'vier',6:'zes',7:'zeven',10:'tien'}[n];
      t.push({html:`Het supplement van een hoek is ${w} keer zo groot als het complement van die hoek. Bereken die hoek.`, ans:a,
      sol:`180° − α = ${n} · (90° − α)<br>180° − α = ${90*n}° − ${n}α<br>${n-1}α = ${90*n-180}°<br>α = ${a}°`, hint:`Begin met 180° − α = ${n} · (90° − α).`,
      fig:partsSvg(180, [{v:a, lab:'α', cls:'tq'}, {v:90-a, lab:'', cls:'or'}, {v:90, lab:'90°', cls:'vi'}], {brace:[[a, 90, '90° − α'], [a+0.01, 180, '']]}),
      figTxt:`Oranje is het complement: 90° − α. Het supplement is oranje + paars: 180° − α. Het supplement moet ${n} keer zo groot zijn als het complement: 180° − α = ${n} · (90° − α).`}); }
    { const n = R.pick([4,7,10]); const a = (90*n-180)/(n-1); const w = {4:'vierde',7:'zevende',10:'tiende'}[n];
      t.push({html:`Het complement van een hoek is een ${w} van het supplement van die hoek. Bereken die hoek.`, ans:a,
      sol:`${n} · (90° − α) = 180° − α<br>${90*n}° − ${n}α = 180° − α<br>${90*n-180}° = ${n-1}α<br>α = ${a}°`, hint:`Het complement is ${n} keer kleiner: ${n} · (90° − α) = 180° − α.`,
      fig:partsSvg(180, [{v:a, lab:'α', cls:'tq'}, {v:90-a, lab:'', cls:'or'}, {v:90, lab:'90°', cls:'vi'}], {brace:[[a, 90, '90° − α']]}),
      figTxt:`Oranje is het complement (90° − α), oranje + paars is het supplement (180° − α). Het complement is een ${w} van het supplement, dus ${n} keer het complement is het supplement: ${n} · (90° − α) = 180° − α.`}); }
    t.forEach((it,i)=>{ degQ(b, st, save, 'r'+i, `<span class="q-num">${LET[i]})</span> ${it.html} [[0]]`, it.ans, it); hintFig(b, it.fig, it.figTxt); });
  }};
/* vergelijkingen met x bij complementaire en supplementaire hoeken */
function somItem(R, tot){ /* twee hoeken (a·x + b) en (c·x + d) met som tot */
  for(let n=0;n<200;n++){ const x = R.int(5, tot>90?30:15), a = R.int(1, 4), c = R.int(1, 3), b = R.pick([-1,1])*R.int(0, 25);
    const v1 = a*x + b, v2 = tot - v1, d = v2 - c*x;
    if(v1 >= 15 && v2 >= 15 && Math.abs(d) <= 40 && !(a===c && b===d) && (b || d)) return {x, a, b, c, d, v1, v2}; }
  return {x:20, a:2, b:10, c:1, d:20, v1:50, v2:40};
}
CP.xvgl = { title:'Complementaire en supplementaire hoeken met x', lvl:2,
  instr:'Eén hoek ken je in graden, de andere hoek is een uitdrukking met x. Schrijf eerst een vergelijking, los ze op en bereken daarna de hoek. Typ de vergelijking zo: <b>2x + 10 + 40 = 90</b> (zonder gradentekens mag ook).',
  build(b, st, save){ const R = makeR(st);
    const kinds = [['c','fig'], ['s','fig'], [R.pick(['c','s']), 'txt'], [R.pick(['c','s']), 'fig']];
    kinds.forEach(([k, how], i)=>{ const tot = k==='c' ? 90 : 180; let x, a, bb, v1;
      for(let n=0;n<300;n++){ x = R.int(4, tot>90?30:15); a = R.int(1, 4); bb = R.pick([-1,1])*R.int(2, 25); v1 = a*x + bb; if(v1 >= 30 && v1 <= tot-30) break; }
      const g = tot - v1, e1 = linTxt(a, bb); const woord = k==='c' ? 'complementair' : 'supplementair';
      const nm = R.pick([['α','β'], ['Â','B̂'], ['δ','ε']]);
      const html = how==='fig' ? `De twee hoeken in de tekening zijn ${woord}. Bereken x en de hoek met x.`
        : `${nm[0]} en ${nm[1]} zijn ${woord}, maar ze liggen niet tegen elkaar. ${nm[0]} = ${e1} en ${nm[1]} = ${g}°. Bereken x en ${nm[0]}.`;
      const parts = [{v:v1, lab:e1, cls:'tq'}, {v:g, lab:g+'°', cls:'or'}];
      const fig = how==='fig' ? partsSvg(tot, R.f()<.5 ? parts : parts.reverse()) : null;
      xVglQ(b, st, save, 'r'+i, {nr:LET[i]+')', html, fig, L:[a, bb+g], R:[0, tot], x, ang:{lab: how==='fig' ? 'de hoek met x' : nm[0], v:v1},
        pre:[[`${woord[0].toUpperCase()+woord.slice(1)}e hoeken zijn samen <b>${tot}°</b>.`, ''],
          [`Schrijf de vergelijking: hoek met x + andere hoek = ${tot}.`, `${e1.replace(/°/g,'')} + ${g} = ${tot}`],
          ['Tel de getallen in het linkerlid samen.', `${linTxt(a, bb+g).replace(/°/g,'')} = ${tot}`]],
        post:[['Vul x in om de hoek te berekenen.', `${subX(e1, x)} = <b>${v1}°</b>`]],
        help:`${woord[0].toUpperCase()+woord.slice(1)}e hoeken zijn samen ${tot}°. Schrijf: ${e1.replace(/°/g,'')} + ${g} = ${tot}.`,
        hintEq:`De som van ${woord}e hoeken is ${tot}°. Tel de uitdrukking en ${g}° op en stel dat gelijk aan ${tot}.`,
        hintSolve:`Tel eerst de getallen in het linkerlid samen: ${linTxt(a, bb+g).replace(/°/g,'')} = ${tot}. Breng dan het getal naar het rechterlid.`,
        sol:linSol(a, bb+g, 0, tot, `${e1} + ${g}° = ${tot}°`) + `<br>De hoek is ${e1.replace(/^(\d*)x/, (m,q)=>(q?q+' · ':'')+x+'°')} = <b>${v1}°</b>. Controle: ${v1}° + ${g}° = ${tot}°.`});
    });
  }};
CP.xvgl2 = { title:'Complementaire en supplementaire hoeken: x in beide hoeken', lvl:3,
  instr:'Schrijf eerst een vergelijking met x. Los ze op en bereken daarna de hoek. Typ de vergelijking zo: <b>2x + 10 + x + 20 = 90</b> (zonder gradentekens mag ook).',
  build(b, st, save){ const R = makeR(st);
    const kinds = [['c','fig'], ['s','fig'], [R.pick(['c','s']), 'txt'], ['s','fig']];
    kinds.forEach(([k, how], i)=>{ const tot = k==='c' ? 90 : 180; const t = somItem(R, tot);
      const e1 = linTxt(t.a, t.b), e2 = linTxt(t.c, t.d); const woord = k==='c' ? 'complementair' : 'supplementair';
      const nm = R.pick([['α','β'], ['Â','B̂'], ['δ','ε']]);
      const html = how==='fig' ? `De twee hoeken in de tekening zijn ${woord}. Bereken x en de grootste hoek.`
        : `${nm[0]} en ${nm[1]} zijn ${woord}, maar ze liggen niet tegen elkaar. ${nm[0]} = ${e1} en ${nm[1]} = ${e2}. Bereken x en de grootste hoek.`;
      const fig = how==='fig' ? partsSvg(tot, [{v:t.v1, lab:e1, cls:'tq'}, {v:t.v2, lab:e2, cls:'or'}]) : null;
      const big = Math.max(t.v1, t.v2);
      xVglQ(b, st, save, 'r'+i, {nr:LET[i]+')', html, fig, L:[t.a+t.c, t.b+t.d], R:[0, tot], x:t.x, ang:{lab:'de grootste hoek', v:big},
        pre:[[`${woord[0].toUpperCase()+woord.slice(1)}e hoeken zijn samen <b>${tot}°</b>.`, ''],
          [`Schrijf de vergelijking: de ene hoek + de andere hoek = ${tot}.`, `(${e1.replace(/°/g,'')}) + (${e2.replace(/°/g,'')}) = ${tot}`],
          ['Tel de x-termen samen en tel de getallen samen.', `${linTxt(t.a+t.c, t.b+t.d).replace(/°/g,'')} = ${tot}`]],
        post:[['Vul x in om beide hoeken te berekenen. Kies de grootste.', `${subX(e1, t.x)} = ${t.v1}°<br>${subX(e2, t.x)} = ${t.v2}°<br>De grootste hoek is <b>${big}°</b>.`]],
        help:`${woord[0].toUpperCase()+woord.slice(1)}e hoeken zijn samen ${tot}°. Schrijf: (${e1}) + (${e2}) = ${tot}°.`,
        hintEq:`De som van ${woord}e hoeken is ${tot}°. Tel de twee uitdrukkingen op en stel dat gelijk aan ${tot}.`,
        hintSolve:`Vereenvoudig eerst het linkerlid: ${t.a+t.c}x ${t.b+t.d<0?'−':'+'} ${Math.abs(t.b+t.d)} = ${tot}. Breng het getal naar het rechterlid.`,
        sol:linSol(t.a+t.c, t.b+t.d, 0, tot, `(${e1}) + (${e2}) = ${tot}°`) + `<br>De hoeken zijn ${e1.replace(/^(\d*)x/, (m,q)=>(q?q+' · ':'')+t.x+'°')} = ${t.v1}° en ${tot}° − ${t.v1}° = ${t.v2}°. De grootste is <b>${big}°</b>.`});
    });
  }};
/* niet-aanliggende hoeken: los van elkaar, toch complementair of supplementair */
function losHoek(V, d0, v, lab, cls, r=46){ return `<path class="wedge ${cls}" d="${wedgePath(V, r, d0, d0+v)}"/>` + lnSvg(V, polar(V, 78, d0)) + lnSvg(V, polar(V, 78, d0+v)) + (()=>{ const m = polar(V, r+16, d0+v/2); return tx(m.x, m.y, lab, 'val'); })() + `<circle class="pt" cx="${fx(V.x)}" cy="${fx(V.y)}" r="2.4"/>`; }
CP.los = { title:'Ook losse hoeken kunnen complementair zijn', lvl:1,
  instr:'Complementaire of supplementaire hoeken hoeven <b>niet</b> tegen elkaar te liggen. Alleen hun som telt.',
  build(b, st, save){ const R = makeR(st);
    const A = P(70, 150), Bv = P(250, 120);
    const anim = (al, be, tot, word) => stepAnim(b, {W:340, H:190, maxw:440, keepCaps:true, alt:'twee losse hoeken die tegen elkaar worden gelegd',
      steps:[
        {cap:`α = ${al}° en β = ${be}° liggen los van elkaar. Ze hebben geen gemeenschappelijk been.`, draw:()=> losHoek(A, 0, al, 'α', 'tq') + losHoek(Bv, 200, be, 'β', 'or')},
        {cap:`Schuif β tegen α aan.`, ms:1800, draw:t=>{ const V = lerp(Bv, A, t); const d = 200 + (al - 200)*t; return losHoek(A, 0, al, 'α', 'tq') + losHoek(V, d, be, 'β', 'or', 40); }},
        {cap:`Samen vormen ze een ${tot===90?'rechte':'gestrekte'} hoek: α + β = ${al}° + ${be}° = ${tot}°. α en β zijn <b>${word}</b>, ook als ze niet tegen elkaar liggen.`, draw:()=> losHoek(A, 0, al, 'α', 'tq') + losHoek(A, al, be, 'β', 'or', 40) + (tot===90 ? rightL(A, 0) : '')}
      ]});
    anim(35, 55, 90, 'complementair');
    const qs = R.shuffle(['c','s','n','c','s']).slice(0,4);
    qs.forEach((k,i)=>{ let x, y; if(k==='c'){ x = R.int(15,75); y = 90-x; } else if(k==='s'){ x = R.int(30,150); y = 180-x; } else { do{ x = R.int(20,120); y = R.int(20,120); }while(x+y===90||x+y===180); }
      const d1 = R.int(-20, 40), d2 = R.int(120, 230);
      const fig = hfWrap(340, 170, losHoek(P(80, 120), d1, x, x+'°', 'tq') + losHoek(P(250, 95), d2, y, y+'°', 'or'), {maxw:380, alt:'twee losse hoeken'});
      qChoice(b, st, save, 'l'+i, {nr:LET[i]+')', html:'Deze twee hoeken zijn …', fig, opts:[['c','complementair'],['s','supplementair'],['n','geen van beide']], ans:k,
        why:`${x}° + ${y}° = ${x+y}°.`, whyBad:`Tel op: ${x}° + ${y}° = ${x+y}°. Ze hoeven niet tegen elkaar te liggen.`}); });
  }};
CP.waar = { title:'Waar of niet waar?', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const all = [
      ['Het complement van een scherpe hoek is groter dan het supplement van die hoek.', 'n', 'Het supplement is altijd 90° groter dan het complement.'],
      ['Het supplement van een stompe hoek is een scherpe hoek.', 'w', 'Is α > 90°, dan is 180° − α < 90°.'],
      ['Een stompe hoek heeft geen complement.', 'w', 'Een stompe hoek is al groter dan 90°: er blijft niets over tot 90°.'],
      ['Het supplement van een scherpe hoek is 90° groter dan het complement van die hoek.', 'w', '(180° − α) − (90° − α) = 90°.'],
      ['Er bestaat een hoek waarvan het complement gelijk is aan het supplement.', 'n', '90° − α en 180° − α verschillen altijd 90°.'],
      ['Twee rechte hoeken zijn supplementair.', 'w', '90° + 90° = 180°.'],
      ['Het complement van een hoek van 45° is die hoek zelf.', 'w', '90° − 45° = 45°.'],
      ['De twee hoeken die ontstaan door een hoek van 70° met de bissectrice te verdelen, zijn complementair.', 'n', 'Elke helft is 35°: samen 70°, niet 90°.'],
      ['De bissectrice van een rechte hoek verdeelt die in twee complementaire hoeken.', 'w', 'Elke helft is 45°, samen 90°.'],
      ['De bissectrice van een gestrekte hoek verdeelt die in twee complementaire hoeken.', 'n', 'Elke helft is 90°: samen 180°. Die twee rechte hoeken zijn supplementair.'],
    ];
    R.shuffle(all).slice(0,5).forEach(([s,a,w],i)=> qChoice(b, st, save, 'w'+i, {html:`<span class="q-num">${LET[i]})</span> ${s}`, opts:[['w','waar'],['n','niet waar']], ans:a, why:w, whyBad:w}));
  }};
CP.verschil = { title:'Een hoek en zijn complement of supplement', lvl:3,
  build(b, st, save){ const R = makeR(st);
    const t = [];
    { let a; do{ a = R.int(48, 85); }while(2*a-90<=0); const d = 2*a-90; t.push({html:`Een hoek is ${d}° groter dan zijn complement. Hoe groot is die hoek?`, ans:a, sol:`α − (90° − α) = ${d}°<br>2α − 90° = ${d}°<br>2α = ${d+90}°<br>α = ${a}°`, hint:'Schrijf: α − (90° − α) = …'}); }
    { const a = R.int(20, 80); const d = 180-2*a; t.push({html:`Het supplement van een hoek is ${d}° groter dan die hoek. Hoe groot is die hoek?`, ans:a, sol:`(180° − α) − α = ${d}°<br>180° − 2α = ${d}°<br>2α = ${180-d}°<br>α = ${a}°`, hint:'Schrijf: (180° − α) − α = …'}); }
    { const a = R.pick([30, 36, 45, 54, 60, 72]); const s = 90-a + 180-a; t.push({html:`De som van het complement en het supplement van een hoek is ${s}°. Hoe groot is die hoek?`, ans:a, sol:`(90° − α) + (180° − α) = ${s}°<br>270° − 2α = ${s}°<br>2α = ${270-s}°<br>α = ${a}°`, hint:'Schrijf: (90° − α) + (180° − α) = …'}); }
    { const k = R.pick([2,3,4]); const a = 90/(k+1)*1; const s = 180 - a; t.push({html:`Twee complementaire hoeken: de ene is ${k} keer zo groot als de andere. Bereken het supplement van de kleinste hoek.`, ans:s, sol:`α + ${k}α = 90°<br>${k+1}α = 90°<br>α = ${fmtDeg(a)}<br>supplement: 180° − ${fmtDeg(a)} = ${fmtDeg(s)}`, hint:`α + ${k}α = 90°`}); }
    degRows(b, st, save, t.map(x=>({...x, html:x.html + ' [[0]]'})));
  }};

const SEC = {};
SEC.compl = { id:'compl', ic:'h_compl', nav:'Complementair en supplementair', title:'Complementaire en supplementaire hoeken',
  tip:'<b>Complementair</b>: samen 90°. <b>Supplementair</b>: samen 180°. Ezelsbruggetje: de <b>c</b> van complement komt in het alfabet vóór de <b>s</b> van supplement, en 90 komt vóór 180.',
  cheat:CHEAT5,
  cards:[CP.uitleg, CP.hoeveel, CP.keuze, CP.tabel, CP.samen, CP.poort, CP.vgl, CP.waar, CP.verschil, CP.los, CP.samenMin, CP.xvgl, CP.xvgl2] };

/* ============================================================
   NETFIGUREN: punten en lijnstukken met namen; hoeken als XŶZ
   net = {W,H, pts:{A:{x,y}}, lines:[['A','G','H','C'], ...]}  (punten in volgorde langs het lijnstuk)
   ============================================================ */
function netRays(net, Y){
  const out = [];
  net.lines.forEach(L=>{ const i = L.indexOf(Y); if(i<0) return;
    if(i>0) out.push({to:L[i-1], d:dirAng(net.pts[Y], net.pts[L[i-1]])});
    if(i<L.length-1) out.push({to:L[i+1], d:dirAng(net.pts[Y], net.pts[L[i+1]])}); });
  return out;
}
/* alle hoeken (< 180°) in een punt */
function netAngles(net, Y){ const r = netRays(net, Y); const out = [];
  for(let i=0;i<r.length;i++) for(let j=i+1;j<r.length;j++){ const a = angBetween(r[i].d, r[j].d); if(a>1 && a<179) out.push({Y, X:r[i].to, Z:r[j].to, dx:r[i].d, dz:r[j].d, val:a}); }
  return out; }
const sameDir = (a,b) => adiff(a,b) < 0.6;
function angRelation(g, h){
  if(g.Y!==h.Y) return 'geen';
  const A = [g.dx, g.dz], B = [h.dx, h.dz];
  if((sameDir(A[0]+180,B[0]) && sameDir(A[1]+180,B[1])) || (sameDir(A[0]+180,B[1]) && sameDir(A[1]+180,B[0]))) return 'os';
  let c = null, o1, o2;
  for(const a of A) for(const b of B) if(sameDir(a,b)){ c = a; o1 = A.find(x=>x!==a); o2 = B.find(x=>x!==b); }
  if(c==null) return 'geen';
  if(sameDir(o1+180, o2)) return 'nh';
  const s1 = Math.sin((o1-c)*D2R), s2 = Math.sin((o2-c)*D2R);
  return (s1*s2 < 0) ? 'aan' : 'geen';
}
const angName = g => `${g.X}${hat(g.Y)}${g.Z}`;
/* sector van g tegenwijzerzin: [a0, a1] */
function angSector(g){ return norm360(g.dz - g.dx) < 180 ? [g.dx, g.dz] : [g.dz, g.dx]; }
function netSvg(net, o={}){
  let s = '';
  (o.fills||[]).forEach(([g,c,r])=>{ const [a0,a1] = angSector(g); s += `<path class="wedge ${c}" d="${wedgePath(net.pts[g.Y], r||22, a0, a1)}"/>`; });
  net.lines.forEach(L=>{ s += lnSvg(net.pts[L[0]], net.pts[L[L.length-1]], 'ln'); });
  (o.extra||[]).forEach(x=>s+=x);
  (o.marks||[]).forEach(([g,txt,r,cls])=>{ const [a0,a1] = angSector(g); s += angSvg(net.pts[g.Y], a0, a1, {r:r||18, txt, right:false, tcls:cls}); });
  Object.entries(net.pts).forEach(([k,p])=>{ if(net.hide && net.hide.includes(k)) return; const la = net.lab && net.lab[k]!=null ? net.lab[k] : null;
    let lp; if(la!=null) lp = polar(p, 12, la); else { const c = net.c || P(net.W/2, net.H/2); lp = polar(p, 12, dirAng(c, p)); }
    s += ptSvg(p, k, {lp}); });
  return hfWrap(net.W, net.H, s, {maxw:o.maxw||net.W*1.25, alt:o.alt||'figuur'});
}
/* letters van een netfiguur willekeurig herbenoemen */
function netRename(net, R, pool='ABCDEFGHIKLMNPQRSTUVW'){
  const keys = Object.keys(net.pts); const L = R.shuffle(pool.split('')).slice(0, keys.length).sort();
  /* de volgorde van de buitenpunten blijft alfabetisch als in een boek */
  const map = {}; keys.forEach((k,i)=>map[k]=L[i]);
  const pts = {}; keys.forEach(k=>pts[map[k]] = net.pts[k]);
  const lab = {}; if(net.lab) Object.entries(net.lab).forEach(([k,v])=>lab[map[k]]=v);
  return {...net, pts, lab, lines:net.lines.map(l=>l.map(k=>map[k])), map};
}

/* ---------- twee snijdende rechten in M met nummers ---------- */
function crossMake(R, o={}){ const W = o.W||300, H = o.H||190; const M = P(W/2, H/2); const d1 = o.d1!=null?o.d1:R.int(-25, 25); const x = o.x!=null?o.x:R.int(35, 145); return {W,H,M,d1,d2:d1+x, x}; }
function crossSvg(c, o={}){ /* hoek 1 tussen d1 en d2, dan 2,3,4 tegenwijzerzin */
  const {W,H,M,d1,d2} = c; let s='';
  const sec = {1:[d1,d2], 2:[d2,d1+180], 3:[d1+180,d2+180], 4:[d2+180,d1+360]};
  Object.entries(o.fill||{}).forEach(([k,cl])=>{ const [a0,a1]=sec[k]; s += `<path class="wedge ${cl}" d="${wedgePath(M, 30, a0, a1)}"/>`; });
  s += lineSvg(M, d1, W, H, 'ln', 12) + lineSvg(M, d2, W, H, 'ln', 12);
  [1,2,3,4].forEach(k=>{ const [a0,a1] = sec[k]; const sw = norm360(a1-a0);
    if(o.arcs!==false) s += `<path class="arc" d="${arcOnly(M, 26, a0, a1)}"/>`;
    const lab = o.labels ? o.labels[k] : k;
    if(o.nums!==false && lab!=null){ const p = polar(M, 16 + (sw<50?4:0), midAng(a0,a1)); s += tx(p.x, p.y, lab, 'num'); }
    const v = o.vals && o.vals[k]; if(v){ const p = polar(M, (o.vr||42) + (sw<45?10:0) + (sw<70 && String(v).length>5 ? 12 : 0), midAng(a0,a1)); s += tx(p.x, p.y, v, o.vcls||'val'); } });
  if(o.name!==false) s += ptSvg(M, o.name||'M', {lp:polar(M, 40, d1 - 12)});
  (o.extra||[]).forEach(x=>s+=x);
  return hfWrap(W, H, s, {maxw:o.maxw||380, alt:'twee snijdende rechten'});
}
const crossVal = (c, k) => (k%2===1) ? c.x : 180-c.x;

/* ============================================================
   OVERSTAANDE HOEKEN
   ============================================================ */
const OS = {};
OS.uitleg = { title:'Overstaande hoeken en de puntspiegeling', lvl:1, noReset:true,
  instr:'Versleep de oranje bolletjes om de rechten te draaien. Klik dan op <b>Puntspiegeling om M = rotatie over 180°</b>.',
  build(b, st, save){
    b.append(el('div','def', `<span class="lbl-def">definitie</span><b class="k">Overstaande hoeken</b> zijn twee hoeken waarvan de benen in elkaars verlengde liggen.`));
    b.append(el('div','eig', `<span class="lbl-def">eigenschap</span>Overstaande hoeken zijn even groot.`));
    const W = 320, H = 210, M = P(160, 105);
    const S = {d1:15, d2:62, t:0, busy:false};
    const bAnim = ctlBtn('▶ Puntspiegeling om M = rotatie over 180°', ()=>{ if(S.busy) return; S.busy = true; S.t = 0; tween(REDUCED_M?10:2600, t=>{ S.t = t; D.redraw(); }, ()=>{ S.busy=false; S.done = true; D.redraw(); }); });
    const D = dynAng(b, {W, H, st:S, maxw:470, alt:'twee snijdende rechten met overstaande hoeken', ctl:[bAnim],
      handles:S=>[{k:'d1', ...polar(M, 120, S.d1)}, {k:'d2', ...polar(M, 95, S.d2)}],
      drag:(k,p,S)=>{ let a = dirAng(M, p); if(k==='d1'){ a = sdiff(a, 0); a = clamp(a, -60, 60); S.d1 = Math.round(a); if(norm360(S.d2-S.d1) < 20) S.d2 = S.d1+20; if(norm360(S.d2-S.d1) > 160) S.d2 = S.d1+160; }
        else { let x = norm360(a - S.d1); if(x>180) x -= 180; S.d2 = S.d1 + Math.round(clamp(x, 20, 160)); } S.done = false; },
      draw:S=>{ const c = {W,H,M,d1:S.d1,d2:S.d2,x:norm360(S.d2-S.d1)};
        let s = `<path class="wedge or" d="${wedgePath(M, 34, S.d1, S.d2)}"/>`;
        s += `<path class="wedge ${S.done?'or':'tq'}" d="${wedgePath(M, 34, S.d1+180, S.d2+180)}"/>`;
        if(S.t>0 && S.t<1){ const r = 180*S.t; s += `<path class="wedge or" style="opacity:.85" d="${wedgePath(M, 34, S.d1+r, S.d2+r)}"/>`;
          const p = polar(M, 60, (S.d1+S.d2)/2 + r); s += `<circle class="pt" cx="${fx(p.x)}" cy="${fx(p.y)}" r="1.4"/>`; }
        s += lineSvg(M, S.d1, W, H, 'ln', 8) + lineSvg(M, S.d2, W, H, 'ln', 8);
        [[S.d1,S.d2,'1'],[S.d2,S.d1+180,'2'],[S.d1+180,S.d2+180,'3'],[S.d2+180,S.d1+360,'4']].forEach(([a0,a1,k])=>{ const p = polar(M, 15, midAng(a0,a1)); s += tx(p.x,p.y,k,'num');
          const v = (k==='1'||k==='3') ? c.x : 180-c.x; const q = polar(M, 50, midAng(a0,a1)); s += tx(q.x, q.y, Math.round(v)+'°', 'val'); });
        s += `<circle class="pt" cx="${M.x}" cy="${M.y}" r="2.4"/>` + tx(M.x+14, M.y+16, 'M', 'ptn');
        return s; },
      info:S=>{ const x = Math.round(norm360(S.d2-S.d1));
        return S.done ? `De puntspiegeling om M brengt ${hA('M',1)} op ${hA('M',3)}. Een puntspiegeling <b>bewaart de grootte van een hoek</b>, dus ${hA('M',1)} = ${hA('M',3)} = ${x}°.`
          : `${hA('M',1)} = ${hA('M',3)} = <b>${x}°</b> &nbsp;·&nbsp; ${hA('M',2)} = ${hA('M',4)} = <b>${180-x}°</b>`; }
    });
    b.append(el('div','tip', icon('bulb') + `<div>Draai je de figuur een halve toer (180°) rond M, dan komt elke rechte op zichzelf terecht en valt ${hA('M',1)} precies op ${hA('M',3)}. Dat is een <b>puntspiegeling om M</b>: ${sub('s','M')}(${hA('M',1)}) = ${hA('M',3)}.</div>`));
    qChoice(b, st, save, 'tr', {html:`Welke transformatie brengt ${hA('M',2)} op ${hA('M',4)}?`, opts:[['p','puntspiegeling om M'],['s','spiegeling om een van de rechten'],['t','translatie'],['r','rotatie over 90°']], ans:'p', why:'Overstaande hoeken worden op elkaar afgebeeld door de puntspiegeling om het snijpunt.', whyBad:'Draai de figuur een halve toer rond M. Waar komt de hoek terecht?'});
  }};
OS.welke = { title:'Welke hoek is overstaand?', lvl:1,
  build(b, st, save){ const R = makeR(st);
    for(let i=0;i<3;i++){ const c = crossMake(R, {W:260, H:160}); const k = R.int(1,4); const nm = R.pick(['M','S','P','O','K']); const o = ((k+1)%4)+1;
      qChoice(b, st, save, 'w'+i, {html:`<span class="q-num">${LET[i]})</span> Welke hoek is overstaand met ${hA(nm,k)}?`, fig:crossSvg(c, {name:nm, maxw:300, fill:{[k]:'tq'}}),
        opts:[1,2,3,4].filter(j=>j!==k).map(j=>[String(j), hA(nm,j)]), ans:String(o),
        why:`De benen van ${hA(nm,k)} en ${hA(nm,o)} liggen in elkaars verlengde.`, whyBad:`Overstaande hoeken liggen schuin tegenover elkaar: hun benen liggen in elkaars verlengde. Hoeken die naast elkaar liggen, zijn nevenhoeken.`}); }
  }};
OS.vier = { title:'Noteer de grootte van de andere hoeken', lvl:1,
  build(b, st, save){ const R = makeR(st);
    /* a) twee snijdende rechten */
    const c = crossMake(R); const k = R.int(1,4); const v = crossVal(c,k);
    const vals = {}; [1,2,3,4].forEach(j=>vals[j] = j===k ? Math.round(v)+'°' : '');
    const rest = [1,2,3,4].filter(j=>j!==k);
    b.append(el('div','', crossSvg(c, {name:'P', vals})));
    qBlock(b, st, save, 'a', {html:`<span class="q-num">a)</span> ${rest.map((j,i)=>`${hA('P',j)} = [[${i}]]`).join(' &nbsp; ')}`, size:'sm', mode:'decimal',
      check:chkDegs(rest.map(j=>Math.round(crossVal(c,j)))), sol:`${hA('P',(k+1)%4+1)} = ${Math.round(v)}° (overstaande hoeken). De twee andere zijn nevenhoeken van ${hA('P',k)}: 180° − ${Math.round(v)}° = ${180-Math.round(v)}°.`});
    /* b) diagonalen van een parallellogram */
    const W = 320, H = 190; const sk = R.int(40, 80), wd = R.int(150, 190), hg = R.int(90, 120);
    const A = P(60, 150), Bp = P(60+wd, 150), Dp = P(60+wd*0.0+ (hg/Math.tan(sk*D2R)), 150-hg), Cp = P(Dp.x+wd, Dp.y);
    const sc = Math.min(1, (W-20)/(Cp.x-A.x+20)); const T = p => P(10 + (p.x-A.x)*sc + 10, 20 + (p.y-(150-hg))*sc);
    const a = T(A), bb = T(Bp), cc = T(Cp), dd = T(Dp); const M = lineInter(a, cc, bb, dd);
    const angAC = dirAng(M, cc), angBD = dirAng(M, dd); const x = Math.round(norm360(angBD - angAC));
    let s = `<polygon class="poly" points="${[a,bb,cc,dd].map(p=>fx(p.x)+','+fx(p.y)).join(' ')}"/>` + lnSvg(a,cc) + lnSvg(bb,dd);
    const secs = [[angAC, angBD],[angBD, angAC+180],[angAC+180, angBD+180],[angBD+180, angAC+360]];
    const given = R.int(0,3); const xs = secs.map((q,i)=> i%2===0 ? x : 180-x);
    secs.forEach(([a0,a1],i)=>{ s += `<path class="arc" d="${arcOnly(M, 13, a0, a1)}"/>`; const p = polar(M, 28, midAng(a0,a1)); s += tx(p.x, p.y, i===given ? xs[i]+'°' : ['①','②','③','④'][i], i===given?'val':'num'); });
    s += ptSvg(M, '', {}) + tx(M.x, M.y+14, 'M', 'ptn');
    b.append(el('div','', hfWrap(W, H, s, {maxw:380, alt:'parallellogram met diagonalen'})));
    const others = [0,1,2,3].filter(i=>i!==given);
    qBlock(b, st, save, 'b', {html:`<span class="q-num">b)</span> In het parallellogram snijden de diagonalen elkaar in M. ${others.map((i,j)=>`hoek ${['①','②','③','④'][i]} = [[${j}]]`).join(' &nbsp; ')}`, size:'sm', mode:'decimal',
      check:chkDegs(others.map(i=>xs[i])), sol:`De overstaande hoek is even groot: ${xs[given]}°. De hoeken ernaast zijn nevenhoeken: 180° − ${xs[given]}° = ${180-xs[given]}°.`});
  }};
function osXRows(b, st, save, R, kinds){
    kinds.forEach((kind, i)=>{ const c = crossMake(R, {W:300, H:180}); const pair = R.pick([[1,3],[2,4]]);
      let a, bb, cc = 0, dd, x0, v;
      for(let n=0;n<300;n++){ v = R.int(40, 140); x0 = R.int(5, 30);
        if(kind==='beide'){ a = R.int(2, 5); cc = R.int(1, a-1); bb = v - a*x0; dd = v - cc*x0; if(Math.abs(bb)<=50 && Math.abs(dd)<=60 && bb!==0) break; }
        else { a = kind==='getal' ? R.int(1, 3) : R.int(2, 5); bb = v - a*x0; dd = v; if(Math.abs(bb)>=3 && Math.abs(bb)<=50) break; } }
      /* de hoeken in het paar krijgen grootte v */
      const xs = pair[0]===1 ? v : 180 - v; c.x = xs; c.d2 = c.d1 + xs;
      const e1 = linTxt(a, bb), e2 = kind==='beide' ? linTxt(cc, dd) : v+'°';
      const vals = R.f()<.5 ? {[pair[0]]:e1, [pair[1]]:e2} : {[pair[0]]:e2, [pair[1]]:e1};
      const fig = crossSvg(c, {name:false, nums:false, arcs:false, fill:{[pair[0]]:'tq', [pair[1]]:'tq'}, vals, vr:54, maxw:360, vcls:'val'});
      const solved = linSol(a, bb, cc, dd, null);
      xVglQ(b, st, save, 'r'+i, {nr:LET[i]+')', fig,
        html: kind==='beide' ? 'Bereken x en de grootte van de twee overstaande hoeken.' : 'Bereken x.',
        L:[a, bb], R:[cc, dd], x:x0, ang: kind==='beide' ? {lab:'elke hoek', v} : null,
        pre:[['Overstaande hoeken zijn <b>even groot</b>.', ''], ['Schrijf de vergelijking: de ene hoek = de andere hoek.', `${e1.replace(/°/g,'')} = ${e2.replace(/°/g,'')}`]],
        post: kind==='beide' ? [['Vul x in om de hoek te berekenen.', `${subX(e1, x0)} = <b>${v}°</b>`]] : [],
        help:`Overstaande hoeken zijn even groot. Schrijf: ${e1.replace(/°/g,'')} = ${e2.replace(/°/g,'')}.`,
        hintEq:'De twee hoeken liggen schuin tegenover elkaar: ze zijn even groot. Stel de ene uitdrukking gelijk aan de andere.',
        hintSolve: kind==='beide' ? `Breng ${cc===1?'x':cc+'x'} naar het linkerlid (− ${cc===1?'x':cc+'x'}) en ${Math.abs(bb)} naar het rechterlid (${bb<0?'+':'−'} ${Math.abs(bb)}).`
          : (bb ? `Breng ${Math.abs(bb)} naar het rechterlid: ${bb<0?'tel op':'trek af'}.${a>1?` Deel daarna door ${a}.`:''}` : `Deel door ${a}.`),
        sol: solved + (kind==='beide' ? `<br>Elke hoek is ${e1.replace(/^(\d*)x/, (m,q)=>(q?q+' · ':'')+x0+'°')} = <b>${v}°</b>.` : '')});
    });
}
OS.alpha = { title:'Bereken x met overstaande hoeken', lvl:2,
  instr:'Overstaande hoeken zijn even groot. Schrijf dus een vergelijking: de ene hoek = de andere hoek. Typ ze zo: <b>2x + 10 = 70</b> (zonder gradentekens mag ook).',
  build(b, st, save){ const R = makeR(st); osXRows(b, st, save, R, ['getal', 'getal', 'getal2', 'getal2']); }};
OS.alpha2 = { title:'Overstaande hoeken: x in beide hoeken', lvl:3,
  instr:'Nu staat x in beide hoeken. Schrijf de vergelijking: de ene hoek = de andere hoek. Typ ze zo: <b>3x − 20 = x + 40</b>.',
  build(b, st, save){ const R = makeR(st); osXRows(b, st, save, R, ['beide', 'beide', 'beide']); }};
OS.bewijs = { title:'Bewijs: overstaande hoeken zijn even groot', lvl:3,
  build(b, st, save){
    const c = {W:300, H:170, M:P(150,80), d1:20, d2:150, x:130};
    b.append(el('div','', crossSvg(c, {name:'M', nums:true, arcs:true, extra:[`<path class="arc or" d="${arcOnly(c.M, 30, 150, 200)}"/>`], maxw:330})));
    b.append(el('div','q-text block', `<b>Gegeven:</b> ${hA('M',1)} en ${hA('M',3)} zijn overstaande hoeken.<br><b>Te bewijzen:</b> ${hA('M',1)} = ${hA('M',3)}<br>Gebruik ${hA('M',2)}: hij vormt met ${hA('M',1)} en met ${hA('M',3)} telkens een gestrekte hoek.`));
    orderEx(b, st, save, 'o', {lines:[
      `${hA('M',1)} + ${hA('M',2)} = 180° &nbsp;<span class="r">(gestrekte hoek)</span>`,
      `${hA('M',1)} = 180° − ${hA('M',2)}`,
      `${hA('M',3)} + ${hA('M',2)} = 180° &nbsp;<span class="r">(gestrekte hoek)</span>`,
      `${hA('M',3)} = 180° − ${hA('M',2)}`,
      `⇓ &nbsp; ${hA('M',1)} = ${hA('M',3)}`],
      alt:[[2,3,0,1,4]], why:'Beide hoeken zijn gelijk aan 180° − M̂₂, dus zijn ze even groot.'});
  }};

/* ============================================================
   AANLIGGENDE HOEKEN EN NEVENHOEKEN
   ============================================================ */
/* figuurtjes voor de naamvraag */
function pairFig(R, kind){
  const W = 230, H = 150; const V = P(W/2, H*0.72); let s = ''; const L = R.pick(['A','B','C','D','E','P']);
  if(kind==='os'){ const c = crossMake(R, {W, H}); return {svg:crossSvg(c, {name:L, maxw:260, fill:{1:'tq',3:'or'}, labels:{1:'1',3:'2'}, arcs:false}), L}; }
  if(kind==='nh'){ const d0 = R.int(-12, 12), dc = d0 + R.int(40, 140);
    s += `<path class="wedge tq" d="${wedgePath(V, 34, d0, dc)}"/><path class="wedge or" d="${wedgePath(V, 34, dc, d0+180)}"/>`;
    s += lineSvg(V, d0, W, H, 'ln', 10).replace(/class="ln"/,'class="ln"'); s += lnSvg(V, polar(V, 95, dc));
    const p1 = polar(V, 21, midAng(d0,dc)), p2 = polar(V, 21, midAng(dc, d0+180)); s += tx(p1.x,p1.y,'2','num') + tx(p2.x,p2.y,'1','num');
    s += ptSvg(V, L, {lp:polar(V, 14, d0-90)}); return {svg:hfWrap(W, H, s, {maxw:260}), L}; }
  if(kind==='aan' || kind==='aanR'){ const d0 = R.int(-20, 30); const a1 = kind==='aanR' ? R.int(35,55) : R.int(35, 70); const a2 = kind==='aanR' ? 90-a1 : R.int(35, 70);
    const dc = d0 + a1, d1 = dc + a2;
    s += `<path class="wedge tq" d="${wedgePath(V, 34, d0, dc)}"/><path class="wedge or" d="${wedgePath(V, 34, dc, d1)}"/>`;
    s += lnSvg(V, polar(V, 100, d0)) + lnSvg(V, polar(V, 90, dc)) + lnSvg(V, polar(V, 100, d1));
    if(kind==='aanR') s += rightL(V, d0);
    const p1 = polar(V, 22, midAng(d0,dc)), p2 = polar(V, 22, midAng(dc, d1)); s += tx(p1.x,p1.y,'1','num') + tx(p2.x,p2.y,'2','num');
    s += ptSvg(V, L, {lp:polar(V, 14, d0-100)}); return {svg:hfWrap(W, H, s, {maxw:260}), L}; }
  if(kind==='geen'){ const d0 = R.int(-10, 15), a = R.int(35,50), gap = R.int(25, 45), bb = R.int(35, 50);
    s += `<path class="wedge tq" d="${wedgePath(V, 34, d0, d0+a)}"/><path class="wedge or" d="${wedgePath(V, 38, d0+a+gap, d0+a+gap+bb)}"/>`;
    [d0, d0+a, d0+a+gap, d0+a+gap+bb].forEach(d=> s += lnSvg(V, polar(V, 95, d)));
    const p1 = polar(V, 22, d0+a/2), p2 = polar(V, 26, d0+a+gap+bb/2); s += tx(p1.x,p1.y,'1','num') + tx(p2.x,p2.y,'2','num');
    s += ptSvg(V, L, {lp:polar(V, 14, d0-100)}); return {svg:hfWrap(W, H, s, {maxw:260}), L}; }
}
const NAAM3 = [['os','overstaande hoeken'],['aan','aanliggende hoeken'],['nh','nevenhoeken']];
const AN = {};
AN.uitleg = { title:'Aanliggende hoeken en nevenhoeken', lvl:1, noReset:true,
  instr:'Versleep de oranje bolletjes. Kijk wanneer de hoeken aanliggend zijn en wanneer het nevenhoeken zijn.',
  build(b){
    b.append(el('div','def', `<span class="lbl-def">definitie</span><b class="k">Aanliggende hoeken</b> zijn twee hoeken met een gemeenschappelijk been en waarvan het andere been gelegen is aan weerszijden van dat gemeenschappelijk been.<br><br><span class="lbl-def">definitie</span><b class="k">Nevenhoeken</b> zijn twee hoeken die aanliggend zijn en supplementair.`));
    const W = 320, H = 200, V = P(160, 150);
    const S = {d0:0, dc:70, d1:150};
    const D = dynAng(b, {W, H, st:S, maxw:470, alt:'drie halfrechten uit één punt',
      ctl:[ctlBtn('Maak nevenhoeken', ()=>{ S.d0 = 0; S.d1 = 180; S.dc = 65; D.redraw(); }), ctlBtn('Maak complementaire aanliggende hoeken', ()=>{ S.d0 = 10; S.dc = 50; S.d1 = 100; D.redraw(); })],
      handles:S=>[{k:'d0', ...polar(V, 125, S.d0)}, {k:'dc', ...polar(V, 110, S.dc), lab:''}, {k:'d1', ...polar(V, 125, S.d1)}],
      drag:(k,p,S)=>{ let a = dirAng(V, p); if(a>270) a -= 360; a = clamp(Math.round(a), -10, 190);
        if(k==='d0') S.d0 = clamp(a, -10, S.dc-8); else if(k==='d1') S.d1 = clamp(a, S.dc+8, 190); else S.dc = clamp(a, S.d0+8, S.d1-8);
        if(Math.abs(S.d1 - S.d0 - 180) < 3) S.d1 = S.d0 + 180; if(Math.abs(S.d1 - S.d0 - 90) < 3) S.d1 = S.d0 + 90; },
      draw:S=>{ let s = `<path class="wedge tq" d="${wedgePath(V, 40, S.d0, S.dc)}"/><path class="wedge or" d="${wedgePath(V, 34, S.dc, S.d1)}"/>`;
        const neven = S.d1 - S.d0 === 180;
        s += lnSvg(V, polar(V, 135, S.d0)) + lnSvg(V, polar(V, 135, S.d1)) + `<line class="ln or" x1="${V.x}" y1="${V.y}" x2="${fx(polar(V,125,S.dc).x)}" y2="${fx(polar(V,125,S.dc).y)}"/>`;
        if(neven) s += `<line class="ln ghost" x1="${fx(polar(V,140,S.d0).x)}" y1="${fx(polar(V,140,S.d0).y)}" x2="${fx(polar(V,140,S.d1).x)}" y2="${fx(polar(V,140,S.d1).y)}"/>`;
        if(S.d1 - S.d0 === 90) s += rightL(V, S.d0);
        const p1 = polar(V, 58, midAng(S.d0,S.dc)), p2 = polar(V, 54, midAng(S.dc,S.d1));
        s += tx(p1.x,p1.y, 'α = '+(S.dc-S.d0)+'°', 'val') + tx(p2.x,p2.y, 'β = '+(S.d1-S.dc)+'°', 'val or');
        s += `<circle class="pt" cx="${V.x}" cy="${V.y}" r="2.4"/>`;
        return s; },
      info:S=>{ const a = S.dc-S.d0, bb = S.d1-S.dc, t = a+bb;
        return `α en β hebben het <b>oranje been</b> gemeenschappelijk en de andere benen liggen aan weerszijden: ze zijn <b>aanliggend</b>.<br>α + β = ${a}° + ${bb}° = <b>${t}°</b>: ` +
          (t===180 ? '<span class="rel-ok">ze zijn ook supplementair, dus het zijn nevenhoeken.</span> De twee buitenste benen vormen samen een rechte.' : t===90 ? 'ze zijn aanliggend en <b>complementair</b> (samen een rechte hoek), maar geen nevenhoeken.' : 'ze zijn niet supplementair, dus het zijn <b>geen</b> nevenhoeken.'); }
    });
  }};
AN.naam = { title:'Hoe noem je deze hoeken?', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const kinds = R.shuffle(['os','aan','nh', R.pick(['aanR','nh','os']), R.pick(['aan','os'])]);
    const grid = el('div','hf-two'); b.append(grid);
    kinds.forEach((k,i)=>{ const f = pairFig(R, k); const ans = k==='aanR' ? 'aan' : k;
      const cell = el('div'); grid.append(cell);
      qChoice(cell, st, save, 'n'+i, {html:`<span class="q-num">${LET[i]})</span> ${hA(f.L,1)} en ${hA(f.L,2)} zijn …`, fig:f.svg, opts:NAAM3, ans,
        why: ans==='os' ? 'De benen liggen in elkaars verlengde.' : ans==='nh' ? 'Ze hebben een gemeenschappelijk been en de andere benen vormen samen een rechte: samen 180°.' : 'Ze hebben een gemeenschappelijk been, maar de andere benen vormen geen rechte.',
        whyBad: ans==='aan' ? 'Kies de meest geschikte naam. Vormen de buitenste benen samen een rechte? Neen, dus geen nevenhoeken.' : ans==='nh' ? 'Kijk goed: de twee andere benen vormen samen één rechte. Dan zijn aanliggende hoeken ook supplementair.' : 'Er is geen gemeenschappelijk been: de benen liggen in elkaars verlengde.'}); });
  }};
AN.cs = { title:'Complementair, supplementair of geen van beide?', lvl:1,
  instr:'Kijk naar de figuur. Een rechte hoek is aangeduid met het teken ∟.',
  build(b, st, save){ const R = makeR(st);
    const kinds = R.shuffle(['aanR','nh','aan','os']);
    const grid = el('div','hf-two'); b.append(grid);
    kinds.forEach((k,i)=>{ const f = pairFig(R, k); const cell = el('div'); grid.append(cell);
      const ans = k==='aanR' ? 'c' : k==='nh' ? 's' : 'n';
      qChoice(cell, st, save, 'c'+i, {html:`<span class="q-num">${LET[i]})</span> ${hA(f.L,1)} en ${hA(f.L,2)} zijn …`, fig:f.svg, opts:[['c','complementair'],['s','supplementair'],['n','geen van beide']], ans,
        why: ans==='c' ? 'Samen vormen ze een rechte hoek: 90°.' : ans==='s' ? 'Samen vormen ze een gestrekte hoek: 180°.' : 'Je weet niet dat hun som 90° of 180° is.',
        whyBad: ans==='c' ? 'Zie je het teken voor de rechte hoek? Dan is de som 90°.' : ans==='s' ? 'De buitenste benen vormen een rechte: de som is 180°.' : (k==='os' ? 'Overstaande hoeken zijn even groot, maar hun som is niet altijd 90° of 180°.' : 'Er is geen rechte hoek en geen gestrekte hoek te zien.')}); });
  }};
/* signaaloefening: zeshoek met ster */
function starNet(){
  const W = 300, H = 280, C = P(150, 140), r = 115;
  const out = {}; ['A','B','C','D','E','F'].forEach((k,i)=>out[k] = polar(C, r, 90 - i*60));
  const I = (p,q,u,v) => { const x = lineInter(out[p], out[q], out[u], out[v]); return P(x.x, x.y); };
  /* binnenpunten: snijpunten van de driehoeken ACE en BDF */
  const pts = {...out, G:I('A','C','F','B'), H:I('A','C','B','D'), Ip:I('C','E','B','D'), J:I('C','E','D','F'), K:I('E','A','D','F'), L:I('E','A','F','B')};
  pts.I = pts.Ip; delete pts.Ip;
  const lines = [['A','B'],['B','C'],['C','D'],['D','E'],['E','F'],['F','A'],
    ['A','G','H','C'], ['C','I','J','E'], ['E','K','L','A'], ['B','H','I','D'], ['D','J','K','F'], ['F','L','G','B']];
  return {W, H, pts, lines, c:C};
}
AN.ster = { title:'Hoeken in een ster', lvl:2,
  build(b, st, save){ const R = makeR(st);
    let net = starNet(); net = netRename(net, R, 'ABCDEFGHIJKLMNOPRST'.replace(/[OQ]/g,''));
    /* kandidaat-paren per soort */
    const cand = {os:[], aan:[], nh:[]};
    Object.keys(net.pts).forEach(Y=>{ const g = netAngles(net, Y); for(let i=0;i<g.length;i++) for(let j=i+1;j<g.length;j++){ const r = angRelation(g[i], g[j]); if(cand[r]) cand[r].push([g[i], g[j]]); } });
    const pick = R.shuffle(['os','os','aan','aan','nh','nh']).map(k=>[k, R.pick(cand[k])]);
    const marks = []; const box = el('div'); b.append(box);
    box.innerHTML = netSvg(net, {maxw:340, alt:'regelmatige zeshoek met een zespuntige ster'});
    pick.forEach(([k,[g,h]],i)=>{
      qChoice(b, st, save, 's'+i, {html:`<span class="q-num">${LET[i]})</span> ${angName(g)} en ${angName(h)} zijn …`, opts:NAAM3, ans:k,
        why: k==='os'?'De benen liggen in elkaars verlengde.':k==='nh'?'Gemeenschappelijk been, en de andere benen vormen een rechte.':'Gemeenschappelijk been, de andere benen liggen aan weerszijden maar vormen geen rechte.',
        whyBad:`Zoek het hoekpunt ${g.Y} en volg de benen van beide hoeken.`}); });
  }};
/* één taak: een halfrechte slepen tot een voorwaarde klopt */
function dragTask(parent, st, save, id, cfg){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {d:cfg.start});
  const wrap = el('div','q'); parent.append(wrap);
  wrap.append(el('div','q-text', cfg.html));
  const S = {d:s.d};
  const D = dynAng(wrap, {W:cfg.W||300, H:cfg.H||180, st:S, maxw:400, handles:S=>[{k:'d', ...polar(cfg.V, cfg.len||110, S.d)}],
    drag:(k,p,S)=>{ S.d = Math.round(dirAng(cfg.V, p)); s.d = S.d; save(); fb.textContent=''; },
    draw:S=>cfg.draw(S)});
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn); const fb = el('div','fb'); wrap.append(act, fb);
  const run = ()=>{ const r = cfg.check(S); fb.className = 'fb '+(r.ok?'ok':'bad'); fb.innerHTML = (r.ok?'✅ Juist! ':'❌ Nog niet juist. ') + (r.msg||''); s.checked = true; save(); if(!quiz) CLres(qid, r.ok); };
  btn.addEventListener('click', run);
  if(quiz){ btn.hidden = true; quiz.push({pts:cfg.pts||1, grade:()=>cfg.check(S).ok, reveal:ok=>{ fb.className='fb '+(ok?'ok':'bad'); fb.innerHTML = ok?'✅':'❌ '+(cfg.check(S).msg||''); }, lock:()=>{ D.box.style.pointerEvents='none'; } }); }
  else if(s.checked) run();
}
AN.teken = { title:'Teken zelf de gevraagde hoek', lvl:2,
  instr:'Versleep het oranje bolletje: zo draai je de nieuwe halfrechte (oranje). Klik daarna op Controleer.',
  build(b, st, save){ const R = makeR(st);
    const V = P(150, 140); const d0 = R.int(-5, 15), al = R.int(40, 70); const da = d0 + al;
    dragTask(b, st, save, 't1', {V, start:da+100, html:`<span class="q-num">a)</span> Draai de oranje halfrechte zodat α en γ <b>aanliggende hoeken</b> zijn die <b>niet supplementair</b> zijn.`,
      draw:S=>{ let s = `<path class="wedge tq" d="${wedgePath(V, 30, d0, da)}"/>`; const g = norm360(S.d - da);
        if(g>0 && g<180) s += `<path class="wedge or" d="${wedgePath(V, 24, da, S.d)}"/>`;
        s += lnSvg(V, polar(V, 120, d0)) + lnSvg(V, polar(V, 115, da)) + `<line class="ln or" x1="${V.x}" y1="${V.y}" x2="${fx(polar(V,110,S.d).x)}" y2="${fx(polar(V,110,S.d).y)}"/>`;
        const p = polar(V, 44, d0+al/2); s += tx(p.x,p.y,'α','val'); if(g>0 && g<180){ const q = polar(V, 40, da + g/2); s += tx(q.x,q.y,'γ','val or'); }
        return s + `<circle class="pt" cx="${V.x}" cy="${V.y}" r="2.4"/>`; },
      check:S=>{ const g = norm360(S.d - da); if(!(g>3 && g<177)) return {ok:false, msg:'γ moet aan de andere kant van het gemeenschappelijke been liggen dan α.'};
        if(Math.abs(al+g-180)<=2) return {ok:false, msg:'Nu zijn α en γ samen 180°: dat zijn nevenhoeken. Ze mogen niet supplementair zijn.'};
        return {ok:true, msg:`γ ligt tegen α aan het gemeenschappelijke been, en α + γ = ${al+Math.round(g)}° ≠ 180°.`}; }});
    const d0b = R.int(-5, 10), be = R.int(50, 120); const dbb = d0b + be;
    dragTask(b, st, save, 't2', {V, start:dbb+40, html:`<span class="q-num">b)</span> Draai de oranje halfrechte zodat β en δ <b>nevenhoeken</b> zijn.`,
      draw:S=>{ let s = `<path class="wedge tq" d="${wedgePath(V, 30, d0b, dbb)}"/>`; const g = norm360(S.d - dbb);
        if(g>0 && g<185) s += `<path class="wedge or" d="${wedgePath(V, 24, dbb, S.d)}"/>`;
        s += lnSvg(V, polar(V, 120, d0b)) + lnSvg(V, polar(V, 115, dbb)) + `<line class="ln or" x1="${V.x}" y1="${V.y}" x2="${fx(polar(V,110,S.d).x)}" y2="${fx(polar(V,110,S.d).y)}"/>`;
        const p = polar(V, 44, d0b+be/2); s += tx(p.x,p.y,'β','val'); if(g>0 && g<185){ const q = polar(V, 40, dbb + g/2); s += tx(q.x,q.y,'δ','val or'); }
        return s + `<circle class="pt" cx="${V.x}" cy="${V.y}" r="2.4"/>`; },
      check:S=>{ const g = norm360(S.d - dbb); if(Math.abs(g + be - 180) <= 2) return {ok:true, msg:`β + δ = 180°: het oranje been ligt in het verlengde van het eerste been van β.`};
        return {ok:false, msg:'Nevenhoeken zijn aanliggend én supplementair: het nieuwe been moet in het verlengde liggen van het andere been van β.'}; }});
    const d0c = R.int(0, 20), ga = R.int(25, 65); const dgc = d0c + ga;
    dragTask(b, st, save, 't3', {V, start:dgc+70, html:`<span class="q-num">c)</span> Draai de oranje halfrechte zodat de hoek ε die ontstaat het <b>complement</b> is van de blauwe hoek.`,
      draw:S=>{ let s = `<path class="wedge tq" d="${wedgePath(V, 30, d0c, dgc)}"/>`; const g = norm360(S.d - dgc);
        if(g>0 && g<180) s += `<path class="wedge or" d="${wedgePath(V, 24, dgc, S.d)}"/>`;
        s += lnSvg(V, polar(V, 120, d0c)) + lnSvg(V, polar(V, 115, dgc)) + `<line class="ln or" x1="${V.x}" y1="${V.y}" x2="${fx(polar(V,110,S.d).x)}" y2="${fx(polar(V,110,S.d).y)}"/>`;
        if(Math.abs(g + ga - 90) <= 2) s += rightL(V, d0c);
        const p = polar(V, 44, d0c+ga/2); s += tx(p.x,p.y,ga+'°','val'); if(g>0 && g<180){ const q = polar(V, 40, dgc + g/2); s += tx(q.x,q.y,'ε','val or'); }
        return s + `<circle class="pt" cx="${V.x}" cy="${V.y}" r="2.4"/>`; },
      check:S=>{ const g = norm360(S.d - dgc); if(Math.abs(g + ga - 90) <= 2) return {ok:true, msg:`ε = 90° − ${ga}° = ${90-ga}°: samen een rechte hoek.`};
        return {ok:false, msg:`Het complement van ${ga}° is ${90-ga}°. Samen moeten ze een rechte hoek vormen.`}; }});
  }};
/* contexten: schaar, strijkplank, ophaalbrug */
function schaarSvg(x){ const W = 280, H = 170, M = P(140, 85); let s = '';
  const d1 = x/2, d2 = -x/2;
  [[d1, 'tq'],[d2, 'or']].forEach(([d,c],i)=>{ const p = polar(M, 115, d), q = polar(M, 70, d+180);
    s += `<line class="blade" x1="${fx(M.x)}" y1="${fx(M.y)}" x2="${fx(p.x)}" y2="${fx(p.y)}"/><line class="handle" x1="${fx(M.x)}" y1="${fx(M.y)}" x2="${fx(q.x)}" y2="${fx(q.y)}"/>`;
    const e = polar(M, 82, d+180); s += `<ellipse class="ring" cx="${fx(e.x)}" cy="${fx(e.y)}" rx="16" ry="11" transform="rotate(${fx(-(d+180))} ${fx(e.x)} ${fx(e.y)})"/>`; });
  s += `<circle class="pt" cx="${M.x}" cy="${M.y}" r="4"/>`;
  s += angSvg(M, d2, d1, {r:30, txt:x+'°', tr:44}); s += angSvg(M, d2+180, d1+180, {r:22, txt:'α', tr:36});
  return hfWrap(W, H, s, {maxw:320, alt:'een open schaar'}); }
function plankSvg(x){ const W = 300, H = 180, M = P(150, 100); let s = '';
  s += `<rect class="board" x="30" y="40" width="240" height="12" rx="6"/>`;
  const d1 = 90 - x/2, d2 = 90 + x/2;
  [d1, d2].forEach(d=>{ const top = lineInter(M, polar(M,1,d), P(0,52), P(1,52)), bot = lineInter(M, polar(M,1,d), P(0,170), P(1,170)); s += `<line class="leg" x1="${fx(top.x)}" y1="52" x2="${fx(bot.x)}" y2="170"/>`; });
  s += `<line class="ln thin" x1="10" y1="171" x2="290" y2="171"/>`;
  s += `<circle class="pt" cx="${M.x}" cy="${M.y}" r="3.5"/>`;
  s += angSvg(M, d1, d2, {r:22, txt:x+'°', tr:34}); s += angSvg(M, d2, d1+180, {r:20, txt:'β', tr:32});
  return hfWrap(W, H, s, {maxw:340, alt:'strijkplank met gekruiste poten'}); }
function brugSvg(w){ /* w = hoek tussen het brugdek en de weg op de kade (stomp) */
  const W = 300, H = 170; let s = '';
  s += `<rect class="water" x="0" y="120" width="300" height="50"/>`;
  s += `<rect class="kade" x="190" y="100" width="110" height="70"/>`;
  const V = P(190, 100); const e = polar(V, 150, w);
  s += `<line class="deck" x1="${V.x}" y1="${V.y}" x2="${fx(e.x)}" y2="${fx(e.y)}"/>`;
  s += `<line class="ln thin" x1="${V.x}" y1="${V.y}" x2="20" y2="${V.y}" stroke-dasharray="4 4"/>`;
  s += angSvg(V, 0, w, {r:22, txt:w+'°', tr:36}); s += angSvg(V, w, 180, {r:34, txt:'γ', tr:48});
  return hfWrap(W, H, s, {maxw:340, alt:'ophaalbrug boven het water'}); }
AN.ctx = { title:'Hoeken rondom ons', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const x1 = R.int(30, 70), x2 = R.int(50, 80), x3 = R.int(115, 150);
    const t1 = el('div','ctx-row'); b.append(t1); const a1 = el('div'), c1 = el('div'); t1.append(a1, c1);
    a1.innerHTML = schaarSvg(x1);
    degQ(c1, st, save, 's', `<strong>Een schaar</strong> staat ${x1}° open. Hoe groot is α tussen de handvatten? α = [[0]]`, x1, {hint:'De benen van beide hoeken liggen in elkaars verlengde: overstaande hoeken.', sol:`α = ${x1}° (overstaande hoeken zijn even groot).`});
    const t2 = el('div','ctx-row'); b.append(t2); const a2 = el('div'), c2 = el('div'); t2.append(a2, c2);
    a2.innerHTML = plankSvg(x2);
    degQ(c2, st, save, 'p', `<strong>Een strijkplank</strong>: de gekruiste poten maken bovenaan een hoek van ${x2}°. Hoe groot is β? β = [[0]]`, 180-x2, {hint:'β ligt naast de hoek van '+x2+'° en samen vormen ze een gestrekte hoek: nevenhoeken.', sol:`β = 180° − ${x2}° = ${180-x2}° (nevenhoeken).`});
    const t3 = el('div','ctx-row'); b.append(t3); const a3 = el('div'), c3 = el('div'); t3.append(a3, c3);
    a3.innerHTML = brugSvg(x3);
    degQ(c3, st, save, 'b', `<strong>Een ophaalbrug</strong> maakt een hoek van ${x3}° met de weg op de kade. Welke hoek γ maakt de brug met het wateroppervlak (de gestippelde lijn)? γ = [[0]]`, 180-x3, {hint:'De hoek met de weg en de hoek met het water vormen samen een gestrekte hoek.', sol:`γ = 180° − ${x3}° = ${180-x3}° (nevenhoeken).`});
  }};
AN.alpha = { title:'Bereken α', lvl:2,
  instr:'Overstaande hoeken zijn even groot. Nevenhoeken zijn samen 180°.',
  build(b, st, save){ const R = makeR(st);
    const kinds = R.shuffle(['os','nh','os','nh']);
    kinds.forEach((k,i)=>{ const c = crossMake(R, {W:280, H:170}); let v = Math.round(c.x); let a, expr, sol;
      const form = R.pick(['+','-']); const kk = R.int(8, 40);
      if(k==='os'){ if(form==='+'){ v = Math.max(v, kk+10); c.x = v; c.d2 = c.d1+v; a = v-kk; expr = `α + ${kk}°`; sol = `α + ${kk}° = ${v}° (overstaande hoeken)<br>α = ${a}°`; } else { a = v+kk; expr = `α − ${kk}°`; sol = `α − ${kk}° = ${v}° (overstaande hoeken)<br>α = ${a}°`; } }
      else { const w = 180-v; if(form==='+'){ const kk2 = Math.min(kk, w-5); a = w-kk2; expr = `α + ${kk2}°`; sol = `α + ${kk2}° = 180° − ${v}° = ${w}° (nevenhoeken)<br>α = ${a}°`; } else { a = w+kk; expr = `α − ${kk}°`; sol = `α − ${kk}° = 180° − ${v}° = ${w}° (nevenhoeken)<br>α = ${a}°`; } }
      const vals = k==='os' ? {1:v+'°', 3:expr} : {1:v+'°', 2:expr};
      b.append(el('div','', crossSvg(c, {name:false, nums:false, vals, maxw:320})));
      degQ(b, st, save, 'r'+i, `<span class="q-num">${LET[i]})</span> α = [[0]]`, a, {hint: k==='os' ? 'Deze hoeken liggen schuin tegenover elkaar: ze zijn even groot.' : 'Deze hoeken liggen naast elkaar op een rechte: samen 180°.', sol});
    });
  }};
AN.zwaartelijn = { title:'Hoeken bij een zwaartelijn', lvl:3,
  build(b, st, save){ const R = makeR(st);
    const A = P(R.int(100, 190), 30), Bp = P(30, 170), C = P(R.int(240, 290), 170); const Pm = mid(Bp, C);
    let net = {W:320, H:200, pts:{A, B:Bp, C, P:Pm}, lines:[['A','B'],['A','C'],['B','P','C'],['A','P']], lab:{A:90, B:200, C:-20, P:-90}};
    b.append(el('div','', netSvg(net, {maxw:360})));
    b.append(el('p','instructions', `In driehoek ABC is [AP] de zwaartelijn uit A: P is het midden van [BC].`));
    qChoice(b, st, save, 'a', {html:`<span class="q-num">a)</span> ${ang3('B','A','P')} en ${ang3('P','A','C')} zijn …`, opts:NAAM3, ans:'aan', why:'Gemeenschappelijk been [AP, en AB en AC liggen aan weerszijden. AB en AC vormen geen rechte.', whyBad:'Ze hebben het been [AP gemeenschappelijk. Vormen AB en AC samen een rechte?'});
    qChoice(b, st, save, 'b', {html:`<span class="q-num">b)</span> ${ang3('A','P','B')} en ${ang3('C','P','A')} zijn …`, opts:NAAM3, ans:'nh', why:'Gemeenschappelijk been [PA, en PB en PC vormen samen de rechte BC.', whyBad:'PB en PC liggen in elkaars verlengde. Wat weet je dan over de som?'});
  }};
AN.vgl = { title:'Nevenhoeken met een vergelijking', lvl:3,
  build(b, st, save){ const R = makeR(st); const t = [];
    { const k = R.pick([2,3,4,5,8,9]); const b2 = 180/(k+1); t.push({html:`${hA('B',1)} en ${hA('B',2)} zijn nevenhoeken en ${hA('B',1)} = ${k}${hA('B',2)}. Bereken ${hA('B',1)}.`, ans:k*b2, sol:`${hA('B',1)} + ${hA('B',2)} = 180°<br>${k}${hA('B',2)} + ${hA('B',2)} = 180°<br>${k+1}${hA('B',2)} = 180°<br>${hA('B',2)} = ${b2}° en ${hA('B',1)} = ${k*b2}°`, hint:`Vervang ${hT('B',1)} door ${k}${hT('B',2)} in ${hT('B',1)} + ${hT('B',2)} = 180°.`}); }
    { const b2 = R.int(30, 70), d = R.int(5, 40); const s = 2*b2 + d; t.push({html:`${hA('B',1)} en ${hA('B',2)} zijn aanliggende hoeken met ${hA('B',1)} + ${hA('B',2)} = ${s}° en ${hA('B',1)} = ${hA('B',2)} + ${d}°. Bereken ${hA('B',2)}.`, ans:b2, sol:`${hA('B',2)} + ${d}° + ${hA('B',2)} = ${s}°<br>2${hA('B',2)} = ${s-d}°<br>${hA('B',2)} = ${b2}°`, hint:'Vervang B̂₁ door B̂₂ + '+d+'°.'}); }
    { const d = 3*R.int(2, 13); const b2 = (180 + d)/3;
      t.push({html:`${hA('B',1)} en ${hA('B',2)} zijn nevenhoeken en ${hA('B',1)} = 2${hA('B',2)} − ${d}°. Bereken ${hA('B',1)}.`, ans:2*b2-d, sol:`2${hA('B',2)} − ${d}° + ${hA('B',2)} = 180°<br>3${hA('B',2)} = ${180+d}°<br>${hA('B',2)} = ${b2}°<br>${hA('B',1)} = 2 · ${b2}° − ${d}° = ${2*b2-d}°`, hint:'Vervang B̂₁ door 2B̂₂ − '+d+'° in B̂₁ + B̂₂ = 180°.'}); }
    { const c = R.pick([4,6,8,10,12,14,16,18]); const x = (90+3*c)/2; t.push({html:`${hA('B',1)} en ${hA('B',2)} zijn nevenhoeken. Het complement van ${hA('B',1)} is ${c}° kleiner dan een derde van ${hA('B',2)}. Bereken ${hA('B',1)}.`, ans:x,
      sol:`90° − ${hA('B',1)} = (180° − ${hA('B',1)}) : 3 − ${c}°<br>270° − 3${hA('B',1)} = 180° − ${hA('B',1)} − ${3*c}°<br>${90+3*c}° = 2${hA('B',1)}<br>${hA('B',1)} = ${x}°`, hint:'Schrijf B̂₂ als 180° − B̂₁ en maak een vergelijking met enkel B̂₁.'}); }
    degRows(b, st, save, t);
  }};

/* ============================================================
   DE VIJF HOEKEN: DEFINITIES LEREN EN OEFENEN
   ============================================================ */
const DEF5 = [
  {k:'co', naam:'complementaire hoeken', def:'twee hoeken waarvan de som 90° is', kw:[['som','samen','opgeteld'],['90']]},
  {k:'su', naam:'supplementaire hoeken', def:'twee hoeken waarvan de som 180° is', kw:[['som','samen','opgeteld'],['180']]},
  {k:'os', naam:'overstaande hoeken', def:'twee hoeken waarvan de benen in elkaars verlengde liggen', kw:[['benen'],['verlengde']]},
  {k:'aan', naam:'aanliggende hoeken', def:'twee hoeken met een gemeenschappelijk been en waarvan het andere been gelegen is aan weerszijden van dat gemeenschappelijk been', kw:[['gemeenschappelijk','gemeenschappelijke','zelfde been'],['weerszijden','andere kant','beide kanten','elke kant']]},
  {k:'nh', naam:'nevenhoeken', def:'twee hoeken die aanliggend zijn en supplementair', kw:[['aanliggend'],['supplementair','180']]}
];
function def5Fig(k){ const W = 200, H = 120, V = P(100, 95); let s = '';
  if(k==='co'){ s += lnSvg(V, polar(V,85,0)) + lnSvg(V, polar(V,80,90)) + lnSvg(V, polar(V,85,35)) + `<path class="wedge tq" d="${wedgePath(V,22,0,35)}"/><path class="wedge or" d="${wedgePath(V,18,35,90)}"/>` + rightL(V,0); }
  if(k==='su'){ s += lnSvg(P(15,95), P(185,95)) + lnSvg(V, polar(V,80,60)) + `<path class="wedge tq" d="${wedgePath(V,22,0,60)}"/><path class="wedge or" d="${wedgePath(V,18,60,180)}"/>`; }
  if(k==='os'){ const M = P(100,60); s += lnSvg(polar(M,90,20), polar(M,90,200)) + lnSvg(polar(M,90,150), polar(M,90,330)) + `<path class="wedge tq" d="${wedgePath(M,22,20,150)}"/><path class="wedge or" d="${wedgePath(M,22,200,330)}"/>`; }
  if(k==='aan'){ s += lnSvg(V, polar(V,85,10)) + lnSvg(V, polar(V,85,60)) + lnSvg(V, polar(V,85,125)) + `<path class="wedge tq" d="${wedgePath(V,22,10,60)}"/><path class="wedge or" d="${wedgePath(V,18,60,125)}"/>`; }
  if(k==='nh'){ s += lnSvg(P(15,95), P(185,95)) + lnSvg(V, polar(V,80,115)) + `<path class="wedge tq" d="${wedgePath(V,22,0,115)}"/><path class="wedge or" d="${wedgePath(V,18,115,180)}"/>`; }
  return hfWrap(W, H, s, {maxw:200}); }
const DF = {};
DF.leer = { title:'Leer de vijf definities', lvl:1, noReset:true,
  instr:'Lees elke definitie en kijk naar de figuur. Klik daarna op <b>Verberg de definities</b> en zeg ze luidop of schrijf ze op een blad.',
  build(b){
    const tb = el('div','df-grid'); b.append(tb);
    DEF5.forEach(d=>{ const card = el('div','df-card'); card.innerHTML = `<div class="df-fig">${def5Fig(d.k)}</div><div><b class="df-n">${d.naam[0].toUpperCase()+d.naam.slice(1)}</b> zijn <span class="df-d">${d.def}</span>.</div>`; tb.append(card); });
    const btn = ctlBtn('Verberg de definities', ()=>{ tb.classList.toggle('verberg'); btn.textContent = tb.classList.contains('verberg') ? 'Toon de definities' : 'Verberg de definities'; }, false);
    b.append(btn);
    b.append(el('div','tip', icon('bulb') + `<div>Vergeet de <b>eigenschap</b> niet: overstaande hoeken zijn even groot. Een <b>puntspiegeling</b> om het snijpunt brengt de ene hoek op de andere, en een puntspiegeling bewaart de grootte van een hoek.</div>`));
  }};
DF.sleep = { title:'Welke naam hoort bij de definitie?', lvl:1,
  instr:'Sleep elke naam naar de juiste definitie (of tik eerst op de naam en dan op het vakje).',
  build(b, st, save, key){ const R = makeR(st);
    const order = R.shuffle(DEF5);
    bankEx(b, st, save, key, order.map(d=>({pre:`… zijn ${d.def}.`, ans:d.naam[0].toUpperCase()+d.naam.slice(1), why:''})), R.shuffle(DEF5.map(d=>d.naam[0].toUpperCase()+d.naam.slice(1))));
  }};
DF.aanvul = { title:'Vul de definitie aan', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const items = R.shuffle([
      {html:'Complementaire hoeken zijn twee hoeken waarvan de [[0]] [[1]]° is.', ans:[['som'],['90']]},
      {html:'Supplementaire hoeken zijn twee hoeken waarvan de [[0]] [[1]]° is.', ans:[['som'],['180']]},
      {html:'Overstaande hoeken zijn twee hoeken waarvan de [[0]] in elkaars [[1]] liggen.', ans:[['benen'],['verlengde']]},
      {html:'Aanliggende hoeken zijn twee hoeken met een [[0]] been en waarvan het andere been gelegen is aan [[1]] van dat gemeenschappelijk been.', ans:[['gemeenschappelijk','gemeenschappelijke'],['weerszijden']]},
      {html:'Nevenhoeken zijn twee hoeken die [[0]] zijn en [[1]].', ans:[['aanliggend'],['supplementair']]}
    ]);
    items.forEach((it,i)=> qBlock(b, st, save, 'd'+i, {html:`<span class="q-num">${LET[i]})</span> ${it.html}`, size:'', check:v=>{ const f = v.map((x,j)=>it.ans[j].includes(x.toLowerCase().replace(/[°\s.]/g,''))); return {ok:f.every(Boolean), fields:f, msg:f.every(Boolean)?'':'Kijk naar de rode vakjes. Gebruik de woorden uit de definitie.'}; }, sol:it.html.replace(/\[\[(\d)\]\]/g, (m,j)=>`<b>${it.ans[+j][0]}</b>`)}));
  }};
DF.schrijf = { title:'Schrijf de definitie zelf', lvl:2,
  instr:'Typ de volledige definitie. De computer kijkt of de belangrijke woorden erin staan. Vergelijk daarna met het model.',
  build(b, st, save){ const R = makeR(st);
    R.shuffle(DEF5).slice(0,3).forEach((d,i)=> qBlock(b, st, save, 'w'+i, {html:`<span class="q-num">${LET[i]})</span> ${d.naam[0].toUpperCase()+d.naam.slice(1)} zijn [[0]]`, size:'wide', block:true,
      check:v=>{ const t = v[0].toLowerCase(); const miss = d.kw.filter(g=>!g.some(w=>t.includes(w))); return {ok:!miss.length, msg: miss.length ? `Er ontbreekt nog iets. Denk aan: ${miss.map(g=>'<b>'+g[0]+'</b>').join(' en ')}.` : `Model: <i>${d.naam[0].toUpperCase()+d.naam.slice(1)} zijn ${d.def}.</i>`}; },
      sol:`${d.naam[0].toUpperCase()+d.naam.slice(1)} zijn ${d.def}.`}));
  }};
DF.zin = { title:'Vul aan met de juiste woorden', lvl:2,
  instr:'Sleep de woorden naar de vakjes.',
  build(b, st, save, key){ const R = makeR(st);
    const a = R.int(25, 65), g = 180 - a;
    const V = P(150, 120); const dB = 90 - a;
    let s = lnSvg(P(20,120), P(280,120)) + lnSvg(V, polar(V, 100, 90)) + lnSvg(V, polar(V, 105, dB));
    s += angSvg(V, dB, 90, {r:26, txt:'α', tr:38}) + angSvg(V, 0, dB, {r:34, txt:'β', tr:48}) + angSvg(V, dB, 180, {r:18, txt:'γ', tr:30, arc:true}) + rightL(V, 0);
    b.append(el('div','', hfWrap(300, 140, s, {maxw:340})));
    bankEx(b, st, save, key, [
      {pre:'De som van α en β is', ans:'90°'}, {pre:'α en β zijn aanliggende hoeken die', ans:'complementair', post:'zijn.'},
      {pre:'De som van β en γ is', ans:'180°'}, {pre:'β en γ zijn aanliggende hoeken die supplementair zijn. We noemen ze kortweg', ans:'nevenhoeken'}
    ], R.shuffle(['90°','180°','complementair','supplementair','nevenhoeken','overstaande hoeken']));
  }};
DF.herken = { title:'Herken de soort in een figuur', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const kinds = R.shuffle(['os','nh','aan','aanR', R.pick(['os','nh'])]);
    const grid = el('div','hf-two'); b.append(grid);
    kinds.forEach((k,i)=>{ const f = pairFig(R, k); const cell = el('div'); grid.append(cell);
      const opts = [['os','overstaande hoeken'],['aan','aanliggende hoeken (niet complementair of supplementair)'],['aanR','aanliggende en complementaire hoeken'],['nh','nevenhoeken']];
      qChoice(cell, st, save, 'h'+i, {html:`<span class="q-num">${LET[i]})</span> ${hA(f.L,1)} en ${hA(f.L,2)}:`, fig:f.svg, opts, ans:k,
        why:'Juist benoemd.', whyBad: k==='aanR' ? 'Let op het teken voor de rechte hoek: samen 90°.' : k==='nh' ? 'De buitenste benen vormen een rechte: samen 180°.' : k==='os' ? 'Geen gemeenschappelijk been: de benen liggen in elkaars verlengde.' : 'Gemeenschappelijk been, maar geen rechte hoek en geen rechte.'}); });
  }};
DF.trans = { title:'Hoeken en transformaties', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const c = crossMake(R, {W:280, H:170});
    b.append(el('div','', crossSvg(c, {name:'O', fill:{1:'tq',3:'or'}, maxw:320})));
    qChoice(b, st, save, 't1', {html:`<span class="q-num">a)</span> Welke transformatie brengt de blauwe hoek ${hA('O',1)} op de oranje hoek ${hA('O',3)}?`, opts:[['p','puntspiegeling om O'],['t','translatie'],['s','spiegeling om een rechte door O']], ans:'p', alt:[], why:'Een halve draai (180°) rond O: dat is de puntspiegeling om O.'});
    qChoice(b, st, save, 't2', {html:`<span class="q-num">b)</span> Waarom zijn ${hA('O',1)} en ${hA('O',3)} daardoor even groot?`, opts:[['g','een puntspiegeling bewaart de grootte van een hoek'],['e','een puntspiegeling bewaart de evenwijdigheid'],['l','een puntspiegeling bewaart de lengte van een lijnstuk']], ans:'g', why:'Het beeld van een hoek bij een puntspiegeling is even groot als de hoek zelf.', whyBad:'Het gaat over de grootte van een hoek.'});
    qChoice(b, st, save, 't3', {html:`<span class="q-num">c)</span> Welke hoeken worden ook op elkaar afgebeeld door die puntspiegeling?`, opts:[['24',`${hA('O',2)} en ${hA('O',4)}`],['12',`${hA('O',1)} en ${hA('O',2)}`],['14',`${hA('O',1)} en ${hA('O',4)}`]], ans:'24', why:'Ook dat zijn overstaande hoeken.'});
  }};

SEC.overst = { id:'overst', ic:'h_overst', nav:'Overstaande hoeken', title:'Overstaande hoeken',
  tip:'Overstaande hoeken liggen schuin tegenover elkaar bij twee snijdende rechten. Ze zijn altijd <b>even groot</b>.',
  cheat:CHEAT5, cards:[OS.uitleg, OS.welke, OS.vier, OS.alpha, OS.bewijs, OS.alpha2] };
SEC.aanl = { id:'aanl', ic:'h_aanl', nav:'Aanliggende hoeken en nevenhoeken', title:'Aanliggende hoeken en nevenhoeken',
  tip:'<b>Aanliggend</b>: één been gemeenschappelijk, de andere benen aan weerszijden. <b>Nevenhoeken</b>: aanliggend én samen 180°.',
  cheat:CHEAT5, cards:[AN.uitleg, AN.naam, AN.cs, AN.ster, AN.teken, AN.ctx, AN.alpha, AN.zwaartelijn, AN.vgl] };
SEC.def5 = { id:'def5', ic:'h_def', nav:'De vijf hoeken', title:'De vijf hoeken: definities',
  tip:'Deze vijf definities moet je <b>woord voor woord</b> kennen. Oefen tot je ze zonder kijken kan opschrijven.',
  cheat:CHEAT5, cards:[DF.leer, DF.sleep, DF.aanvul, DF.zin, DF.schrijf, DF.herken, DF.trans] };

/* ============================================================
   EVENWIJDIGEN EN EEN SNIJLIJN: VERKENNER
   cfg: {lock:true (a // b vast), type:'ov', vals:true, omgek:false, zone:false}
   ============================================================ */
const PCOL = ['or','tq','vi','ro'];
function psExplorer(parent, cfg={}){
  const W = 360, H = 240;
  const S = {ds:cfg.ds||66, da:cfg.da!=null?cfg.da:6, db:cfg.db!=null?cfg.db:(cfg.lock?6:-4), lock:!!cfg.lock, type:cfg.type||null, vals:cfg.vals!==false, zone:!!cfg.zone};
  if(S.lock) S.db = S.da;
  const legend = el('div','legend');
  const tbtn = {};
  const types = cfg.types || TYPES5;
  types.forEach(t=>{ const b = el('button','opt', PAIRTYPE[t].naam); b.type='button'; b.addEventListener('click', ()=>{ S.type = S.type===t ? null : t; D.redraw(); }); tbtn[t] = b; legend.append(b); });
  parent.append(legend);
  const ctl = [];
  const bVals = ctlBtn('', ()=>{ S.vals = !S.vals; D.redraw(); }); ctl.push(bVals);
  const bZone = ctlBtn('', ()=>{ S.zone = !S.zone; D.redraw(); }); ctl.push(bZone);
  let bLock = null; if(!cfg.fixedLock){ bLock = ctlBtn('', ()=>{ S.lock = !S.lock; if(S.lock) S.db = S.da; D.redraw(); }); ctl.push(bLock); }
  const model = S => { const m = psMake({W, H, ds:S.ds, da:S.da, db:S.db, n:cfg.n}); return m; };
  const D = dynAng(parent, {W, H, st:S, maxw:620, alt:'twee rechten a en b en een snijlijn s', ctl,
    handles:S=>{ const m = model(S); return [{k:'a', ...polar(m.A, 110, S.da)}, {k:'b', ...polar(m.B, 110, S.db)}, {k:'s', ...polar(m.A, 52, S.ds)}]; },
    drag:(k,p,S)=>{ const m = model(S);
      if(k==='s'){ S.ds = Math.round(clamp(dirAng(m.B, p), 32, 148)); return; }
      const base = k==='a' ? m.A : m.B; let x = sdiff(dirAng(base, p), 0); if(x>90) x -= 180; if(x<-90) x += 180; x = Math.round(clamp(x, -45, 45));
      if(k==='a'){ S.da = x; if(S.lock) S.db = x; } else { S.db = x; if(S.lock) S.da = x; }
      if(!S.lock && cfg.snap!==false && Math.abs(S.da - S.db) <= 1) S.db = S.da; },
    draw:S=>{ const m = model(S); const fill = {};
      if(S.type) PAIRTYPE[S.type].pairs.forEach((p,i)=>{ fill[p[0]] = PCOL[i]; fill[p[1]] = PCOL[i]; });
      let s = psSvg(m, {fill, vals:S.vals, zone:S.zone});
      const par = S.da === S.db;
      if(!par){ const X = lineInter(m.A, polar(m.A, 10, S.da), m.B, polar(m.B, 10, S.db));
        if(X){ const inside = X.x>8 && X.x<W-8 && X.y>8 && X.y<H-8;
          if(inside){ s += `<circle class="snij" cx="${fx(X.x)}" cy="${fx(X.y)}" r="4"/>` + tx(X.x, X.y-12, 'snijpunt', 'snijt'); }
          else { const dir = X.x > W/2 ? 1 : -1; const ex = dir>0 ? W-58 : 58; s += tx(ex, 18, (dir>0?'':'← ') + 'a en b snijden elkaar' + (dir>0?' →':''), 'snijt'); } } }
      else s += tx(W-46, 18, 'a // b', 'okt');
      return s; },
    info:S=>{ const m = model(S); const v = psAllVals(m); const par = S.da===S.db;
      bVals.textContent = S.vals ? 'Verberg de hoekgroottes' : 'Toon de hoekgroottes'; bZone.textContent = S.zone ? 'Verberg de binnenstrook' : 'Kleur de strook tussen a en b';
      if(bLock) bLock.textContent = S.lock ? '🔒 a // b staat vast (klik om los te maken)' : '🔓 a en b draaien los (klik om a // b vast te zetten)';
      Object.entries(tbtn).forEach(([t,b])=>b.classList.toggle('on', S.type===t));
      if(!S.type) return `Kies hierboven een soort hoekenpaar. Versleep de oranje bolletjes om a, b of s te draaien.` + (par ? ' Nu is <b>a // b</b>.' : ' Nu zijn a en b <b>niet</b> evenwijdig.');
      const T = PAIRTYPE[S.type];
      const rows = T.pairs.map((p,i)=>{ const x = v[p[0]], y = v[p[1]]; const okRel = T.rel==='gelijk' ? Math.abs(x-y)<0.5 : Math.abs(x+y-180)<0.5;
        const rel = T.rel==='gelijk' ? `${kH(m,p[0])} = ${Math.round(x)}° en ${kH(m,p[1])} = ${Math.round(y)}°: ${okRel?'<span class="rel-ok">even groot</span>':'<span class="rel-no">niet even groot</span>'}`
          : `${kH(m,p[0])} + ${kH(m,p[1])} = ${Math.round(x)}° + ${Math.round(y)}° = ${Math.round(x+y)}°: ${okRel?'<span class="rel-ok">supplementair</span>':'<span class="rel-no">niet supplementair</span>'}`;
        return `<div><span class="zw ${PCOL[i]}"></span>${rel}</div>`; }).join('');
      return `<b>${T.naam[0].toUpperCase()+T.naam.slice(1)}</b>` + (S.type==='os'||S.type==='nh' ? '' : ` (${T.pairs.length} paren)`) + rows +
        (cfg.omgek && !par ? `<div class="sa-tip">Draai b tot de hoeken ${T.rel==='gelijk'?'even groot':'supplementair'} zijn. Wat zie je dan?</div>` : '') +
        (cfg.omgek && par ? `<div class="rel-ok">De hoeken zijn ${T.rel==='gelijk'?'even groot':'supplementair'} en a // b.</div>` : ''); }
  });
  return D;
}

/* ============================================================
   NETFIGUREN: twee hoeken in verschillende punten op één snijlijn
   ============================================================ */
function transRel(net, g, h){
  if(g.Y===h.Y) return null;
  const Pg = net.pts[g.Y], Ph = net.pts[h.Y]; const ds = dirAng(Pg, Ph);
  const leg = (a, d) => { if(sameDir(a.dx, d) || sameDir(a.dx, d+180)) return {s:a.dx, o:a.dz, oto:a.Z}; if(sameDir(a.dz, d) || sameDir(a.dz, d+180)) return {s:a.dz, o:a.dx, oto:a.X}; return null; };
  const lg = leg(g, ds), lh = leg(h, ds); if(!lg || !lh) return null;
  /* ligt het snijlijn-been echt op de lijn door beide punten? */
  if(!net.lines.some(L=>L.includes(g.Y) && L.includes(h.Y))) return null;
  const sg = sameDir(lg.s, ds) ? 1 : -1, sh = sameDir(lh.s, ds) ? 1 : -1;
  const u = polar(P(0,0),1,ds); const side = d => { const v = polar(P(0,0),1,d); return Math.sign(u.x*v.y - u.y*v.x); };
  const same = side(lg.o) === side(lh.o);
  let t = null;
  if(sg===sh) t = same ? 'ov' : null;
  else if(sg===1 && sh===-1) t = same ? 'bz' : 'vb';
  else t = same ? 'uz' : 'vu';
  if(!t) return null;
  const par = ldiff(lg.o, lh.o) < 0.6;
  const nm = (a,b) => [a,b].sort().join('');
  return {t, par, lx:nm(g.Y, lg.oto), ly:nm(h.Y, lh.oto), sn:nm(g.Y, h.Y)};
}
/* veelhoekfiguren met evenwijdige zijden */
function polyNet(R, kind){
  const W = 320, H = 210; let pts, lines, lab;
  if(kind==='par' || kind==='parE'){ const w = R.int(140, 175), h = R.int(90, 120), sk = R.int(35, 70);
    const A = P(40, 180), B = P(40+w, 180), D = P(40+sk, 180-h), C = P(40+sk+w, 180-h);
    pts = {A, B, C, D}; lines = [['A','B'],['B','C'],['C','D'],['D','A']]; lab = {A:225, B:-45, C:45, D:135};
    if(kind==='par'){ if(R.f()<.5) lines.push(['A','C']); else lines.push(['B','D']); }
    else { const E = lerp(D, C, 1.35); pts.E = E; lines[2] = ['D','C','E']; lab.E = 45; lab.C = 90; } }
  if(kind==='ruit'){ const A = P(160, 18), C = P(160, 192), B = P(160+R.int(55,75), 105), D = P(160-(B.x-160), 105);
    pts = {A, B, C, D}; lines = [['A','B'],['B','C'],['C','D'],['D','A'],['A','C']]; lab = {A:90, B:0, C:-90, D:180}; }
  if(kind==='trap'){ const top = R.int(90, 130), bot = R.int(200, 250), h = R.int(95, 125), off = R.int(10, bot-top-10);
    const A = P(35, 185), B = P(35+bot, 185), D = P(35+off, 185-h), C = P(35+off+top, 185-h);
    pts = {A, B, C, D}; lines = [['A','B'],['B','C'],['C','D'],['D','A'], R.f()<.5 ? ['A','C'] : ['B','D']]; lab = {A:225, B:-45, C:45, D:135}; }
  return {W, H, pts, lines, lab};
}
function pickTransPair(R, net, want){
  const cand = [];
  const Ys = Object.keys(net.pts);
  const all = {}; Ys.forEach(Y=>all[Y] = netAngles(net, Y));
  for(let i=0;i<Ys.length;i++) for(let j=0;j<Ys.length;j++){ if(i===j) continue;
    all[Ys[i]].forEach(g=>all[Ys[j]].forEach(h=>{ const r = transRel(net, g, h); if(r && r.par && (!want || want.includes(r.t))) cand.push({g, h, r}); })); }
  return cand.length ? R.pick(cand) : null;
}

/* ---------- veelkeuze met keuzelijsten in één regel ---------- */
function selQ(parent, st, save, id, o){
  /* o.html bevat {0}, {1}, ...: keuzelijsten; o.opts[i] = [[waarde,label]]; o.ans[i] = waarde of array */
  let f = 0; const html = o.html.replace(/\{(\d)\}/g, (m,i)=> selHTML(f++, o.opts[+i]));
  return qBlock(parent, st, save, id, {html, block:true, sol:o.sol,
    check:v=>{ const fl = v.map((x,i)=> Array.isArray(o.ans[i]) ? o.ans[i].includes(x) : x===o.ans[i]); const ok = fl.every(Boolean); return {ok, fields:fl, msg: ok ? (o.why||'') : (o.hint||'Kijk naar de rode keuzes.')}; }});
}

/* ---------- twee evenwijdigen met twee snijlijnen (alle hoeken genummerd) ---------- */
function ps2Make(R){
  const W = 360, H = 240; const da = R.int(-14, 6);
  const A = P(R.int(120, 160), 72);
  const ds = R.int(58, 80), dt = R.int(100, 128);
  /* B op b: de rechte b is evenwijdig met a, 100 px lager */
  const off = polar(P(0,0), 100, da-90); const Bq = lineInter(A, polar(A,10,ds), P(A.x+off.x, A.y+off.y), polar(P(A.x+off.x, A.y+off.y), 10, da));
  const Cq = P(A.x + R.int(85, 115), 0); Cq.y = A.y - Math.tan(da*D2R)*(Cq.x - A.x);
  const Dq = lineInter(Cq, polar(Cq,10,dt), P(A.x+off.x, A.y+off.y), polar(P(A.x+off.x, A.y+off.y), 10, da));
  return {W, H, da, ds, dt, A, B:Bq, C:Cq, D:Dq};
}
function ps2Sectors(m, k){ /* hoek k = 'A1': A en B op s, C en D op t */
  const L = k[0], i = k[1]; const v = m[L]; const dT = (L==='A'||L==='B') ? m.ds : m.dt;
  return psSectors(m.da, dT)[i];
}
function ps2Svg(m, o={}){ const {W,H} = m; let s = '';
  Object.entries(o.fill||{}).forEach(([k,c])=>{ const [a0,a1] = ps2Sectors(m,k); s += `<path class="wedge ${c}" d="${wedgePath(m[k[0]], 22, a0, a1)}"/>`; });
  s += lineSvg(m.A, m.da, W, H) + lineSvg(m.B, m.da, W, H) + lineSvg(m.B, m.ds, W, H) + lineSvg(m.D, m.dt, W, H);
  ['A','B','C','D'].forEach(L=>[1,2,3,4].forEach(i=>{ const [a0,a1] = ps2Sectors(m, L+i); const sw = norm360(a1-a0); const rr = sw>120 ? 15 : 19;
    s += `<path class="arc" d="${arcOnly(m[L], rr, a0, a1)}"/>`; const p = polar(m[L], rr*0.6 + (sw<50?3:0), midAng(a0,a1)); s += tx(p.x, p.y, i, 'num'); }));
  ['A','B','C','D'].forEach(L=>{ const dT = (L==='A'||L==='B') ? m.ds : m.dt; const big2 = norm360(m.da+180-dT) >= 90;
    s += ptSvg(m[L], L, {lp:polar(polar(m[L], 29, m.da+180), 9, m.da+180+(big2?-90:90))}); });
  s += nmSvg(m.A, m.da, W, H, 'a') + nmSvg(m.B, m.da, W, H, 'b') + nmSvg(m.B, m.ds, W, H, 's', {side:-90}) + nmSvg(m.D, m.dt, W, H, 't', {side:-90});
  return hfWrap(W, H, s, {maxw:520, alt:'twee evenwijdige rechten a en b met twee snijlijnen s en t'}); }
function ps2Val(m, k){ const dT = (k[0]==='A'||k[0]==='B') ? m.ds : m.dt; const x = norm360(dT - m.da); return (+k[1])%2 ? x : 180-x; }
function ps2Type(k1, k2){
  if(k1[0]===k2[0]) return pairType('A'+k1[1], 'A'+k2[1]);
  const onS = L => L==='A'||L==='B'; if(onS(k1[0]) !== onS(k2[0])) return null;
  const top = L => L==='A'||L==='C';
  const [x, y] = top(k1[0]) ? [k1, k2] : [k2, k1];
  return pairType('A'+x[1], 'B'+y[1]);
}

/* ============================================================
   NAMEN
   ============================================================ */
const NM = {};
NM.verk = { title:'Verkenner: hoeken bij twee rechten en een snijlijn', lvl:1, noReset:true,
  instr:'Kies een soort hoekenpaar. Versleep de oranje bolletjes: zo kantel je a, b en de snijlijn s. Maak a en b gerust ook niet evenwijdig: de namen blijven dezelfde.',
  build(b){
    psExplorer(b, {type:'ov', lock:false, da:6, db:6});
    b.append(el('div','tip', icon('bulb') + `<div><b>Binnenhoeken</b> liggen <b>tussen</b> a en b (in de gekleurde strook), <b>buitenhoeken</b> erbuiten.<br><b>Overeenkomstige hoeken</b> liggen op dezelfde plaats bij elk snijpunt.<br><b>Verwisselende</b> hoeken liggen aan verschillende kanten van de snijlijn.<br>Deze namen gelden ook als de rechten <b>niet evenwijdig</b> zijn.</div>`));
    const t = el('div','tbl-wrap'); t.innerHTML = `<table class="mini-tbl"><tr><th colspan="4">overeenkomstige hoeken</th></tr><tr><td>${hA('A',1)} en ${hA('B',1)}</td><td>${hA('A',2)} en ${hA('B',2)}</td><td>${hA('A',3)} en ${hA('B',3)}</td><td>${hA('A',4)} en ${hA('B',4)}</td></tr>
      <tr><th colspan="2">verwisselende binnenhoeken</th><th colspan="2">binnenhoeken aan dezelfde kant van de snijlijn</th></tr><tr><td>${hA('A',3)} en ${hA('B',1)}</td><td>${hA('A',4)} en ${hA('B',2)}</td><td>${hA('A',3)} en ${hA('B',2)}</td><td>${hA('A',4)} en ${hA('B',1)}</td></tr>
      <tr><th colspan="2">verwisselende buitenhoeken</th><th colspan="2">buitenhoeken aan dezelfde kant van de snijlijn</th></tr><tr><td>${hA('A',1)} en ${hA('B',3)}</td><td>${hA('A',2)} en ${hA('B',4)}</td><td>${hA('A',1)} en ${hA('B',4)}</td><td>${hA('A',2)} en ${hA('B',3)}</td></tr></table>`;
    b.append(t);
  }};
/* meerdere hoeken aanklikken */
function pickSet(parent, st, save, id, m, html, target, o={}){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {sel:[]});
  const row = el('div','q'); parent.append(row); row.append(el('div','q-text block', html));
  const H = hotFig(row, ()=>psFig(m, {hot:true, sel:s.sel, vals:o.vals, fill:o.fill, maxw:o.maxw||440}), k=>{ if(s.lock) return; const i = s.sel.indexOf(k); if(i<0) s.sel.push(k); else s.sel.splice(i,1); save(); fb.textContent=''; H.paint(); });
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn); const fb = el('div','fb'); row.append(act, fb);
  const ok = ()=> s.sel.length===target.length && target.every(k=>s.sel.includes(k));
  const run = ()=>{ const g = ok(); fb.className='fb '+(g?'ok':'bad');
    const miss = target.filter(k=>!s.sel.includes(k)).length, extra = s.sel.filter(k=>!target.includes(k)).length;
    fb.innerHTML = g ? '✅ Juist! ' + (o.why||'') : `❌ Nog niet juist. ${miss?`Je mist er nog ${miss}. `:''}${extra?`${extra} aangeklikte hoek${extra>1?'en horen':' hoort'} er niet bij. `:''}${o.hint||''}`;
    s.checked = true; save(); if(!quiz) CLres(qid, g); };
  btn.addEventListener('click', run);
  if(quiz){ btn.hidden = true; quiz.push({pts:o.pts||1, grade:ok, reveal:g=>{ fb.className='fb '+(g?'ok':'bad'); fb.textContent = g?'✅':'❌'; }, lock:()=>{ s.lock = true; } }); }
  else if(s.checked) run();
}
NM.binnen = { title:'Binnenhoeken en buitenhoeken', lvl:1,
  instr:'Klik op de hoeken. Klik nog eens om een hoek terug los te laten.',
  build(b, st, save){ const R = makeR(st); const m = psRandom(R, {db:undefined}); const m2 = psRandom(R);
    pickSet(b, st, save, 'bi', m, '<span class="q-num">a)</span> Klik alle <b>binnenhoeken</b> aan (de hoeken tussen a en b).', ['A3','A4','B1','B2'], {hint:'Binnenhoeken liggen in de strook tussen a en b.'});
    pickSet(b, st, save, 'bu', m2, '<span class="q-num">b)</span> Klik alle <b>buitenhoeken</b> aan.', ['A1','A2','B3','B4'], {hint:'Buitenhoeken liggen buiten de strook tussen a en b.'});
  }};
NM.naam = { title:'Hoe noem je deze hoeken?', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const m = psRandom(R, {n:psNames(R)}); if(R.f()<.4) m.db = m.da + R.pick([-7,7]);
    b.append(el('div','', psFig(m, {maxw:460})));
    if(m.db!==m.da) b.append(el('p','instructions', `Let op: ${m.n.a} en ${m.n.b} zijn hier niet evenwijdig. De namen blijven dezelfde.`));
    const ts = R.shuffle(['ov','vb','bz','vu','uz', R.pick(['os','nh','ov'])]);
    ts.forEach((t,i)=>{ const p = R.pick(PAIRTYPE[t].pairs); const pp = R.f()<.5 ? p : [p[1],p[0]];
      qChoice(b, st, save, 'n'+i, {html:`<span class="q-num">${LET[i]})</span> ${kH(m,pp[0])} en ${kH(m,pp[1])} zijn …`, opts:TYPEOPTS7, ans:t,
        why:'', whyBad: t==='ov' ? 'Ze liggen op dezelfde plaats bij elk snijpunt.' : t==='vb' ? 'Allebei tussen de rechten, aan verschillende kanten van de snijlijn.' : t==='bz' ? 'Allebei tussen de rechten, aan dezelfde kant van de snijlijn.' : t==='vu' ? 'Allebei buiten de rechten, aan verschillende kanten van de snijlijn.' : t==='uz' ? 'Allebei buiten de rechten, aan dezelfde kant van de snijlijn.' : t==='os' ? 'Zelfde snijpunt, benen in elkaars verlengde.' : 'Zelfde snijpunt, samen een gestrekte hoek.'}); });
  }};
NM.zoek = { title:'Klik de gevraagde hoek aan', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const ts = R.shuffle(['ov','vb','vu','bz','uz']).slice(0,4);
    ts.forEach((t,i)=>{ const m = psRandom(R); const p = R.pick(PAIRTYPE[t].pairs); const giv = R.f()<.5 ? p[0] : p[1]; const id = 'z'+i;
      const qid = QID(id); CLvraag(qid); const s = st[id] || (st[id] = {});
      const row = el('div','q'); b.append(row);
      row.append(el('div','q-text block', `<span class="q-num">${LET[i]})</span> Klik de hoek aan die met ${kH(m,giv)} <b>${PAIRTYPE[t].naam}</b> vormt.`));
      const fb = el('div','fb');
      const H = hotFig(row, ()=>psFig(m, {hot:true, sel:s.pick?[s.pick]:[], fill:{[giv]:'tq'}, maxw:420}), k=>{ if(k===giv) return; s.pick = k; save(); H.paint(); run(); });
      row.append(fb);
      function run(){ const ok = pairType(giv, s.pick)===t; fb.className='fb '+(ok?'ok':'bad'); fb.innerHTML = ok ? `✅ Juist! ${kH(m,giv)} en ${kH(m,s.pick)} zijn ${PAIRTYPE[t].naam}.` : `❌ Niet juist. ${kH(m,giv)} en ${kH(m,s.pick)} zijn ${pairType(giv,s.pick) ? PAIRTYPE[pairType(giv,s.pick)].naam : 'geen paar met een naam'}. Probeer opnieuw.`; CLres(qid, ok); }
      if(s.pick) run(); });
  }};
NM.alle = { title:'Geef alle mogelijke paren', lvl:2,
  instr:'Klik alle paren aan die bij de vraag passen. Klik nog eens om een paar terug los te laten.',
  build(b, st, save){ const R = makeR(st); const m = psRandom(R, {n:{...psNames(R)}});
    b.append(el('div','', psFig(m, {maxw:440})));
    const ts = R.shuffle(['vb','vu','bz','uz','ov','os']).slice(0,3);
    ts.forEach((t,i)=>{ const id = 'p'+i; const qid = QID(id); CLvraag(qid); const s = st[id] || (st[id] = {sel:[]});
      const good = PAIRTYPE[t].pairs.map(p=>p.join('-'));
      /* afleiders uit andere soorten */
      const others = R.shuffle(Object.entries(PAIRTYPE).filter(([k])=>k!==t).flatMap(([k,o])=>o.pairs.map(p=>p.join('-')))).slice(0, 6 - Math.min(good.length,4) + 1);
      const optsAll = s.opts || (s.opts = R.shuffle([...good, ...others]));
      const row = el('div','q'); b.append(row); row.append(el('div','q-text block', `<span class="q-num">${LET[i]})</span> Alle <b>${PAIRTYPE[t].naam}</b>:`));
      const wrap = el('div','choices'); row.append(wrap); const fb = el('div','fb');
      optsAll.forEach(pk=>{ const [x,y] = pk.split('-'); const bt = el('button','opt', `${kH(m,x)} en ${kH(m,y)}`); bt.type='button'; bt.classList.toggle('chosen', s.sel.includes(pk));
        bt.addEventListener('click', ()=>{ const j = s.sel.indexOf(pk); if(j<0) s.sel.push(pk); else s.sel.splice(j,1); bt.classList.toggle('chosen'); save(); fb.textContent=''; }); wrap.append(bt); });
      const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn); row.append(act, fb);
      const run = ()=>{ const ok = s.sel.length===good.length && good.every(g=>s.sel.includes(g)); fb.className='fb '+(ok?'ok':'bad');
        fb.innerHTML = ok ? '✅ Juist!' : `❌ Nog niet juist. Er zijn ${good.length} paren ${PAIRTYPE[t].naam}.`; s.checked = true; save(); CLres(qid, ok); };
      btn.addEventListener('click', run); if(s.checked) run(); });
  }};
NM.figuur = { title:'Hoeken in vlakke figuren', lvl:2,
  instr:'In elke figuur zijn twee hoeken aangeduid. Geef hun naam, de evenwijdige rechten en de snijlijn.',
  build(b, st, save){ const R = makeR(st);
    const kinds = R.shuffle(['par','ruit','trap','parE']);
    const namesT = {par:'is een parallellogram', parE:'is een parallellogram (de zijde DC is verlengd tot E)', ruit:'is een ruit', trap:'is een trapezium met AB // DC'};
    kinds.forEach((k,i)=>{ const net = polyNet(R, k); const pk = pickTransPair(R, net, ['ov','vb','bz','vu','uz']); if(!pk) return;
      const svg = netSvg(net, {marks:[[pk.g,'',22],[pk.h,'',22]], fills:[[pk.g,'or',22],[pk.h,'or',22]], maxw:360});
      const parallels = []; /* alle paren evenwijdige zijden */
      const ln = net.lines.map(L=>[L[0], L[L.length-1]]);
      for(let x=0;x<ln.length;x++) for(let y=x+1;y<ln.length;y++){ if(ldiff(dirAng(net.pts[ln[x][0]],net.pts[ln[x][1]]), dirAng(net.pts[ln[y][0]],net.pts[ln[y][1]]))<0.6) parallels.push(`${pk.r.lx}`); }
      const sideName = L => { const a = L[0], z = L[L.length-1]; return [a,z].sort().join(''); };
      const lineOf = nm => { const L = net.lines.find(L=>L.includes(nm[0]) && L.includes(nm[1])); return L ? sideName(L) : nm; };
      const lx = lineOf(pk.r.lx), ly = lineOf(pk.r.ly), sn = lineOf(pk.r.sn);
      const pairs = []; for(let x=0;x<net.lines.length;x++) for(let y=x+1;y<net.lines.length;y++){ const L1 = net.lines[x], L2 = net.lines[y]; if(ldiff(dirAng(net.pts[L1[0]],net.pts[L1[L1.length-1]]), dirAng(net.pts[L2[0]],net.pts[L2[L2.length-1]]))<0.6) pairs.push([sideName(L1), sideName(L2)].sort().join(' // ')); }
      const parAns = [lx, ly].sort().join(' // ');
      const cell = el('div','q'); b.append(cell); cell.append(el('div','q-text block', `<span class="q-num">${LET[i]})</span> ABCD ${namesT[k]}.`)); cell.insertAdjacentHTML('beforeend', svg);
      selQ(cell, st, save, 'f'+i, {html:`${angName(pk.g)} en ${angName(pk.h)} zijn {0} bij {1} en snijlijn {2}.`,
        opts:[TYPEOPTS, [...new Set(pairs)].map(p=>[p,p]), net.lines.map(sideName).map(x=>[x,x])], ans:[pk.r.t, parAns, sn],
        sol:`${angName(pk.g)} en ${angName(pk.h)} zijn <b>${PAIRTYPE[pk.r.t].naam}</b> bij <b>${parAns}</b> en snijlijn <b>${sn}</b>.`,
        hint:'Zoek eerst de rechte die door beide hoekpunten gaat: dat is de snijlijn. De andere benen liggen op de evenwijdige rechten.'}); });
  }};
NM.twee = { title:'Twee evenwijdigen en twee snijlijnen', lvl:3,
  build(b, st, save){ const R = makeR(st); const m = ps2Make(R);
    b.append(el('p','instructions', 'Gegeven: a // b. De rechten s en t snijden a en b.'));
    b.append(el('div','', ps2Svg(m)));
    const cand = []; const Ls = ['A','B','C','D'];
    for(const x of Ls) for(const y of Ls) for(let i=1;i<=4;i++) for(let j=1;j<=4;j++){ const k1 = x+i, k2 = y+j; if(k1>=k2) continue; const t = ps2Type(k1,k2); if(t) cand.push([k1,k2,t]); }
    const by = {}; cand.forEach(c=>(by[c[2]] = by[c[2]]||[]).push(c));
    const ts = R.shuffle(['ov','vb','vu','uz','bz','os','nh']).slice(0,5);
    ts.forEach((t,i)=>{ const [k1,k2] = R.pick(by[t]); const rel = PAIRTYPE[t].rel;
      const sn = (k1[0]===k2[0]) ? '' : ((k1[0]==='A'||k1[0]==='B') ? 's' : 't');
      selQ(b, st, save, 'q'+i, {html:`<span class="q-num">${LET[i]})</span> ${hA(k1[0],k1[1])} en ${hA(k2[0],k2[1])} zijn {0}. Ze zijn {1}.`,
        opts:[TYPEOPTS7, [['g','even groot'],['s','supplementair']]], ans:[t, rel==='gelijk'?'g':'s'],
        sol:`${PAIRTYPE[t].naam}${sn?` bij a // b en snijlijn ${sn}`:''}: ${rel==='gelijk'?'even groot':'supplementair'}.`}); });
  }};

/* ============================================================
   EIGENSCHAPPEN
   ============================================================ */
const EIGZIN = t => `<b>Als</b> twee evenwijdige rechten gesneden worden door een derde rechte, <b>dan</b> zijn elke twee ${PAIRTYPE[t].naam} ${PAIRTYPE[t].rel==='gelijk'?'even groot':'supplementair'}.`;
const OMGZIN = t => `<b>Als</b> twee ${PAIRTYPE[t].naam}, bepaald door twee rechten en een snijlijn, ${PAIRTYPE[t].rel==='gelijk'?'even groot':'supplementair'} zijn, <b>dan</b> zijn de twee rechten evenwijdig.`;
const EG = {};
EG.verk = { title:'Als a // b, dan …', lvl:1, noReset:true,
  instr:'Hier zijn a en b altijd evenwijdig. Kies een soort hoekenpaar en kantel de figuur: wat blijft altijd waar?',
  build(b){
    psExplorer(b, {type:'vb', lock:true, fixedLock:true});
    const box = el('div','eig'); box.innerHTML = `<span class="lbl-def">eigenschappen</span>` + TYPES5.map(t=>`<p style="margin:.3rem 0">${EIGZIN(t)}</p>`).join('');
    b.append(box);
    b.append(el('div','tip', icon('bulb') + '<div>Supplementair zijn betekent: samen 180°. Onthoud: bij evenwijdige rechten zijn er maar <b>twee</b> hoekgroottes. Twee hoeken zijn even groot of samen 180°.</div>'));
  }};
EG.anim = { title:'Bekijk de vijf eigenschappen', lvl:1, noReset:true,
  build(b){
    const m = psMake({W:360, H:230, ds:62, da:8}); const v = psAllVals(m);
    const steps = TYPES5.map((t,i)=>({cap:`<b>${i+1}. ${PAIRTYPE[t].naam[0].toUpperCase()+PAIRTYPE[t].naam.slice(1)}</b><br>${EIGZIN(t)}<br>` + PAIRTYPE[t].pairs.map((p,j)=>`<span class="zw ${PCOL[j]}"></span>${kH(m,p[0])} ${PAIRTYPE[t].rel==='gelijk'?'=':'+'} ${kH(m,p[1])} ${PAIRTYPE[t].rel==='gelijk'?'':'= 180°'}`).join(' &nbsp; '),
      ms:1600, draw:tt=>{ const fill = {}; PAIRTYPE[t].pairs.forEach((p,j)=>{ fill[p[0]] = PCOL[j]; if(tt>0.5) fill[p[1]] = PCOL[j]; }); return psSvg(m, {fill, vals:true}); }}));
    stepAnim(b, {W:360, H:230, steps, maxw:560, keepCaps:false, playLabel:'▶ Speel af'});
  }};
EG.zin = { title:'Vul de eigenschap aan', lvl:1,
  instr:'Sleep <b>even groot</b> of <b>supplementair</b> naar elk vakje.',
  build(b, st, save, key){ const R = makeR(st);
    const ts = R.shuffle(TYPES5);
    bankEx(b, st, save, key, ts.map(t=>({pre:`Als twee evenwijdige rechten gesneden worden door een derde rechte, dan zijn elke twee <b>${PAIRTYPE[t].naam}</b>`, ans:PAIRTYPE[t].rel==='gelijk'?'even groot':'supplementair', post:'.'})),
      ['even groot','supplementair','even groot','supplementair','even groot']);
  }};
EG.acht = { title:'Bepaal de grootte van alle hoeken', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const x = R.int(35, 145); const m = psWithAngle(R, x, {n:{a:'a', b:'b', s:'s', A:'S', B:'T'}});
    const v = psAllVals(m); const g = R.pick(['A1','A2','A3','A4']);
    b.append(el('p','instructions', `De rechte s snijdt de evenwijdige rechten a en b.`));
    b.append(el('div','', psFig(m, {vals:{[g]:Math.round(v[g])+'°'}, maxw:460})));
    const ks = ['A1','A2','A3','A4','B1','B2','B3','B4'].filter(k=>k!==g);
    qBlock(b, st, save, 'a', {html:ks.map((k,i)=>`<span style="white-space:nowrap">${kH(m,k)} = [[${i}]]</span>`).join(' &nbsp; '), block:true, size:'sm', mode:'decimal', check:chkDegs(ks.map(k=>Math.round(v[k]))),
      sol:`Er zijn maar twee groottes: ${Math.round(v.A1)}° en ${Math.round(v.A2)}°. ${kH(m,g)} = ${Math.round(v[g])}°. Overstaande hoeken en overeenkomstige hoeken zijn even groot, nevenhoeken zijn samen 180°.`});
  }};
EG.reden = { title:'Bepaal de hoek en geef de reden', lvl:2,
  instr:'Bij elke stap noteer je waarop je je steunt. Zo schrijf je het ook op een toets.',
  build(b, st, save){ const R = makeR(st);
    const x = R.int(35, 145); const m = psWithAngle(R, x, {n:psNames(R)}); const v = psAllVals(m);
    const g = R.pick(['A1','A2','A3','A4']);
    b.append(el('p','instructions', `Gegeven: ${m.n.a} // ${m.n.b} en ${m.n.s} snijdt ${m.n.a} en ${m.n.b}.`));
    b.append(el('div','', psFig(m, {vals:{[g]:Math.round(v[g])+'°'}, maxw:460})));
    const ts = R.shuffle(TYPES5.filter(t=>PAIRTYPE[t].pairs.some(p=>p.includes(g))));
    ts.forEach((t,i)=>{ const p = PAIRTYPE[t].pairs.find(p=>p.includes(g)); const other = p[0]===g ? p[1] : p[0];
      selQ(b, st, save, 'r'+i, {html:`<span class="q-num">${LET[i]})</span> ${kH(m,g)} en ${kH(m,other)} zijn {0} bij ${m.n.a} // ${m.n.b} en snijlijn ${m.n.s}. Dus is ${kH(m,other)} = {1}`,
        opts:[TYPEOPTS, R.shuffle([[String(Math.round(v[g])), Math.round(v[g])+'°'],[String(180-Math.round(v[g])), (180-Math.round(v[g]))+'°']])], ans:[t, String(Math.round(v[other]))],
        sol:`${PAIRTYPE[t].naam[0].toUpperCase()+PAIRTYPE[t].naam.slice(1)} zijn ${PAIRTYPE[t].rel==='gelijk'?'even groot':'supplementair'}: ${kH(m,other)} = ${Math.round(v[other])}°.`}); });
    const t0 = ts[0], o0 = (p=>p[0]===g?p[1]:p[0])(PAIRTYPE[t0].pairs.find(p=>p.includes(g)));
    const concl = PAIRTYPE[t0].rel==='gelijk' ? `${kH(m,g)} = ${kH(m,o0)}` : `${kH(m,g)} + ${kH(m,o0)} = 180°`;
    const res = Math.round(v[o0]);
    b.append(el('details','sol-show', `<summary style="cursor:pointer;font-weight:700">Zo noteer je vraag a op een toets (open pas als je klaar bent)</summary><div style="line-height:1.9;margin-top:.4em">${m.n.a} // ${m.n.b}<br>&nbsp;&nbsp;⇓ <span style="color:var(--accent-d,#1f8f93)">(${PAIRTYPE[t0].naam})</span><br>${concl}<br>${PAIRTYPE[t0].rel==='gelijk' ? `${kH(m,o0)} = ${res}°` : `${kH(m,o0)} = 180° − ${Math.round(v[g])}° = ${res}°`}</div>`));
  }};
EG.tabel = { title:'Naam en eigenschap in een tabel', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const m = psRandom(R, {n:{a:'a', b:'b', s:'c', A:'A', B:'B'}});
    b.append(el('p','instructions', 'Gegeven: a // b. De rechte c snijdt a en b.'));
    b.append(el('div','', psFig(m, {maxw:440})));
    const ts = R.shuffle(['os','nh','ov','uz','vb','bz','vu']).slice(0,6);
    let html = '<table class="mini-tbl"><tr><th>de twee hoeken</th><th>deze twee hoeken noemen we</th><th>even groot of supplementair?</th></tr>';
    const opts = [], ans = []; let f = 0;
    ts.forEach(t=>{ const p = R.pick(PAIRTYPE[t].pairs); html += `<tr><td>${kH(m,p[0])} en ${kH(m,p[1])}</td><td>${selHTML(f++, TYPEOPTS7)}</td><td>${selHTML(f++, [['g','even groot'],['s','supplementair']])}</td></tr>`; ans.push(t, PAIRTYPE[t].rel==='gelijk'?'g':'s'); });
    html += '</table>';
    qBlock(b, st, save, 't', {html, block:true, check:v=>{ const fl = v.map((x,i)=>x===ans[i]); return {ok:fl.every(Boolean), fields:fl, msg:fl.every(Boolean)?'':'Kijk naar de rode keuzes.'}; },
      sol:ts.map(t=>`${PAIRTYPE[t].naam}: ${PAIRTYPE[t].rel==='gelijk'?'even groot':'supplementair'}`).join('<br>')});
  }};
EG.alg = { title:'Hoeken met een letter', lvl:2,
  build(b, st, save){ const R = makeR(st);
    for(let i=0;i<2;i++){ const t = R.pick(['bz','uz','ov','vb']); const p = R.pick(PAIRTYPE[t].pairs);
      let a, e1, e2, sol, x;
      if(PAIRTYPE[t].rel==='supp'){ const k = R.pick([2,3,4,5]); a = 180/(k+1); if(a%1){ continue; } e1 = 'α'; e2 = k+'α'; x = a; sol = `α + ${k}α = 180° (${PAIRTYPE[t].naam})<br>${k+1}α = 180°<br>α = ${a}°`; }
      else { const c = R.int(10, 40); a = R.int(c+30, 125-c); e1 = `α + ${c}°`; e2 = `2α − ${a - c}°`; x = a + c; /* α + c = 2α − (a − c) => α = a */ sol = `α + ${c}° = 2α − ${a-c}° (${PAIRTYPE[t].naam})<br>${c}° + ${a-c}° = 2α − α<br>α = ${a}°`; }
      const kA = p[0], kB = p[1]; const valA = PAIRTYPE[t].rel==='supp' ? (+kA[1]%2 ? a : 180-a) : x;
      const x1 = (+kA[1])%2 ? (PAIRTYPE[t].rel==='supp' ? a : x) : 180 - (PAIRTYPE[t].rel==='supp' ? a : x);
      const m = psWithAngle(R, clamp(x1, 25, 155), {});
      b.append(el('div','', psFig(m, {vals:{[kA]:e1, [kB]:e2}, arcs:[kA,kB], fill:{[kA]:'or',[kB]:'tq'}, nums:false, maxw:440})));
      degQ(b, st, save, 'a'+i, `<span class="q-num">${LET[i]})</span> Gegeven: a // b. Bereken α. α = [[0]]`, a, {sol, hint: PAIRTYPE[t].rel==='supp' ? 'Deze hoeken zijn samen 180°.' : 'Deze hoeken zijn even groot: stel ze gelijk.'}); }
  }};
EG.som = { title:'Hoeken uit een gegeven som of verschil', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const m = psMake({W:340, H:220, ds:R.int(55, 72), da:R.int(-6, 6)}); b.append(el('div','', psFig(m, {maxw:420})));
    const t = R.pick(['vu','ov','vb']); const p = R.pick(PAIRTYPE[t].pairs); const v = psAllVals(m);
    const sum = Math.round(v[p[0]]) * 2;
    b.append(el('p','instructions', `Gegeven: a // b, s snijdt a en b, en ${kH(m,p[0])} + ${kH(m,p[1])} = ${sum}°.`));
    const x = Math.round(v[p[0]]);
    qBlock(b, st, save, 'q', {html:`${hA('B',1)} = [[0]] &nbsp; ${hA('B',2)} = [[1]] &nbsp; ${hA('B',3)} = [[2]] &nbsp; ${hA('B',4)} = [[3]]`, block:true, size:'sm', mode:'decimal',
      check:chkDegs(['B1','B2','B3','B4'].map(k=>(+k[1])%2 === (+p[0][1])%2 ? x : 180-x)),
      sol:`${kH(m,p[0])} = ${kH(m,p[1])} (${PAIRTYPE[t].naam} bij a // b)<br>dus 2 · ${kH(m,p[0])} = ${sum}° en ${kH(m,p[0])} = ${x}°<br>Dan is elke hoek ${x}° of 180° − ${x}° = ${180-x}°.`});
  }};
EG.verschil = { title:'Een stelsel met hoeken', lvl:3,
  build(b, st, save){ const R = makeR(st);
    const m = psMake({W:340, H:220, ds:R.int(55, 72), da:R.int(-6, 6)}); b.append(el('div','', psFig(m, {maxw:420})));
    const kind = R.pick(['som','vers']);
    let x = R.int(40, 80); if(x%2) x++;
    /* A2 (stomp) en B3 (scherp): buitenhoeken aan dezelfde kant: A2 + B3 = 180 */
    const d = (180 - x) - x;
    const html = kind==='som' ? `Gegeven: a // b en ${hA('A',2)} = ${hA('B',3)} + ${d}°.` : `Gegeven: a // b en ${hA('A',2)} − ${hA('A',1)} = ${d}°.`;
    b.append(el('p','instructions', html));
    qBlock(b, st, save, 'q', {html:`${hA('B',1)} = [[0]] &nbsp; ${hA('B',2)} = [[1]] &nbsp; ${hA('B',3)} = [[2]] &nbsp; ${hA('B',4)} = [[3]]`, block:true, size:'sm', mode:'decimal',
      check:chkDegs([x, 180-x, x, 180-x]),
      sol: kind==='som' ? `${hA('A',2)} + ${hA('B',3)} = 180° (buitenhoeken aan dezelfde kant van de snijlijn)<br>${hA('B',3)} + ${d}° + ${hA('B',3)} = 180°<br>2${hA('B',3)} = ${180-d}° dus ${hA('B',3)} = ${x}°<br>${hA('B',1)} = ${x}°, ${hA('B',2)} = ${hA('B',4)} = ${180-x}°`
        : `${hA('A',1)} + ${hA('A',2)} = 180° (nevenhoeken)<br>${hA('A',1)} + ${hA('A',1)} + ${d}° = 180°<br>2${hA('A',1)} = ${180-d}° dus ${hA('A',1)} = ${x}°<br>${hA('B',1)} = ${hA('B',3)} = ${x}° (overeenkomstige en overstaande hoeken), ${hA('B',2)} = ${hA('B',4)} = ${180-x}°`});
  }};
EG.trans = { title:'Bewijs met een translatie', lvl:3,
  build(b, st, save){
    const m = psMake({W:340, H:220, ds:60, da:6, n:{a:'a', b:'b', s:'s', A:'A', B:'B'}});
    const v = psAllVals(m);
    stepAnim(b, {W:340, H:220, maxw:520, playLabel:'▶ Toon de translatie', steps:[
      {cap:`Gegeven: a // b, s snijdt a en b. Te bewijzen: ${hA('A',1)} = ${hA('B',1)}.`, draw:()=>psSvg(m, {fill:{A1:'or'}, arcs:['A1','B1']})},
      {cap:`Verschuif alles over de vector ${vecAB()}. Het beeld van A is B.`, ms:2200, draw:t=>{ const off = {x:(m.B.x-m.A.x)*t, y:(m.B.y-m.A.y)*t}; const A2 = P(m.A.x+off.x, m.A.y+off.y);
        return psSvg(m, {fill:{}, arcs:['A1','B1']}) + `<path class="wedge or" d="${wedgePath(A2, 20, m.da, m.ds)}"/>` + lineSvg(A2, m.da, 340, 220, 'ln or'); }},
      {cap:`Het beeld van a is een evenwijdige rechte door B: dat is b. Het beeld van s is s zelf (s is de drager van [AB]).`, draw:()=>psSvg(m, {fill:{B1:'or'}, arcs:['A1','B1'], clsB:'or'})},
      {cap:`Dus komt ${hA('A',1)} terecht op ${hA('B',1)}. Een translatie bewaart de grootte van een hoek: ${hA('A',1)} = ${hA('B',1)}.`, draw:()=>psSvg(m, {fill:{A1:'or', B1:'or'}, vals:{A1:Math.round(v.A1)+'°', B1:Math.round(v.B1)+'°'}})}
    ]});
    orderEx(b, st, save, 'o', {html:'Zet het bewijs in de juiste volgorde.', lines:[
      `${tAB()}(a) = b &nbsp;<span class="r">(${tAB()}(A) = B en het beeld van een rechte door een translatie is een evenwijdige rechte)</span>`,
      `${tAB()}(s) = s &nbsp;<span class="r">(s is de drager van ${vecAB()})</span>`,
      `dus is ${tAB()}(${hA('A',1)}) = ${hA('B',1)}`,
      `en ${hA('A',1)} = ${hA('B',1)} &nbsp;<span class="r">(een translatie bewaart de grootte van een hoek)</span>`], alt:[[1,0,2,3]]});
    b.append(el('p','instructions', 'De andere eigenschappen volgen hieruit met overstaande hoeken of nevenhoeken:'));
    orderEx(b, st, save, 'o2', {html:`Bewijs: als a // b, dan zijn de verwisselende binnenhoeken ${hA('A',3)} en ${hA('B',1)} even groot.`, lines:[
      `${hA('A',3)} = ${hA('A',1)} &nbsp;<span class="r">(overstaande hoeken)</span>`, `⇓ &nbsp;<span class="r">(overeenkomstige hoeken ${hA('A',1)} = ${hA('B',1)})</span>`, `${hA('A',3)} = ${hA('B',1)}`]});
    orderEx(b, st, save, 'o3', {html:`Bewijs: als a // b, dan zijn de binnenhoeken aan dezelfde kant ${hA('A',4)} en ${hA('B',1)} supplementair.`, lines:[
      `${hA('A',1)} + ${hA('A',4)} = 180° &nbsp;<span class="r">(nevenhoeken)</span>`, `⇓ &nbsp;<span class="r">(overeenkomstige hoeken ${hA('A',1)} = ${hA('B',1)})</span>`, `${hA('B',1)} + ${hA('A',4)} = 180°`]});
  }};
function vecAB(){ return `<span class="vec-n">AB<i><svg viewBox="0 0 20 6" preserveAspectRatio="none" aria-hidden="true"><path d="M.5 3H19.3M16.2 .6L19.4 3L16.2 5.4"/></svg></i></span>`; }
function tAB(){ return `t<sub>${vecAB()}</sub>`; }
EG.par = { title:'Hoeken in een parallellogram', lvl:3,
  build(b, st, save){ const R = makeR(st); const net = polyNet(R, 'par'); net.lines = net.lines.slice(0,4);
    const angs = {}; ['A','B','C','D'].forEach(Y=>angs[Y] = netAngles(net, Y)[0]);
    b.append(el('div','', netSvg(net, {marks:['A','B','C','D'].map(Y=>[angs[Y],'',18]), maxw:340})));
    const xA = Math.round(angs.A.val);
    degQ(b, st, save, 'a', `ABCD is een parallellogram met ${hA('A')} = ${xA}°. Dan is ${hA('B')} = [[0]]`, 180-xA, {hint:'AD // BC met snijlijn AB: Â en B̂ zijn binnenhoeken aan dezelfde kant van de snijlijn.', sol:`AD // BC met snijlijn AB: binnenhoeken aan dezelfde kant zijn supplementair. B̂ = 180° − ${xA}° = ${180-xA}°.`});
    selQ(b, st, save, 'r', {html:`Waarom is ${hA('B')} + ${hA('C')} = 180°? Omdat {0} // {1} met snijlijn {2}, en ${hA('B')} en ${hA('C')} zijn {3}.`,
      opts:[[['AB','AB'],['BC','BC'],['AD','AD']],[['DC','DC'],['AD','AD'],['BC','BC']],[['BC','BC'],['AB','AB'],['DC','DC']],TYPEOPTS], ans:['AB','DC','BC','bz'],
      sol:'AB // DC met snijlijn BC: B̂ en Ĉ zijn binnenhoeken aan dezelfde kant van de snijlijn, dus supplementair.'});
  }};

/* ============================================================
   OMGEKEERDE EIGENSCHAPPEN
   ============================================================ */
/* figuur met gegeven hoekwaarden in A en B (a en b staan getekend zoals de waarden zeggen) */
function psWithVals(R, kA, vA, kB, vB, o={}){
  const x1 = (+kA[1])%2 ? vA : 180-vA; const y1 = (+kB[1])%2 ? vB : 180-vB;
  const da0 = o.da!=null ? o.da : R.int(-8, 8); const ds = x1 + da0; const db = ds - y1;
  return psMake({W:o.W||340, H:o.H||220, ds, da:da0, db, n:o.n});
}
const OM = {};
OM.verk = { title:'Draai b tot a // b', lvl:1, noReset:true,
  instr:'Nu zijn a en b <b>niet</b> vast evenwijdig. Kies een soort paar en draai b (oranje bolletje bij b) tot de hoeken even groot of supplementair zijn. Kijk wat er gebeurt met a en b.',
  build(b){
    psExplorer(b, {type:'ov', lock:false, da:4, db:-14, omgek:true});
    const box = el('div','eig'); box.innerHTML = `<span class="lbl-def">omgekeerde eigenschappen</span>` + TYPES5.map(t=>`<p style="margin:.3rem 0">${OMGZIN(t)}</p>`).join('');
    b.append(box);
    b.append(el('div','tip', icon('bulb') + '<div>Zijn de hoeken <b>niet</b> even groot (of niet samen 180°), dan snijden a en b elkaar ergens: ze zijn niet evenwijdig.</div>'));
  }};
OM.wissel = { title:'Eigenschap of omgekeerde eigenschap?', lvl:1,
  build(b, st, save){ const R = makeR(st);
    stepAnim(b, {W:360, H:110, maxw:560, playLabel:'▶ Wissel om', steps:[
      {cap:'Een eigenschap: <b>Als</b> a // b, <b>dan</b> zijn overeenkomstige hoeken even groot.', draw:()=>tx(180, 40, 'ALS  a // b', 'val big') + tx(180, 78, 'DAN  overeenkomstige hoeken even groot', 'val big or')},
      {cap:'Wissel het <b>als</b>-deel en het <b>dan</b>-deel om …', ms:1800, draw:t=>tx(180, 40 + 38*t, 'a // b', 'val big') + tx(180, 78 - 38*t, 'overeenkomstige hoeken even groot', 'val big or')},
      {cap:'De omgekeerde eigenschap: <b>Als</b> overeenkomstige hoeken even groot zijn, <b>dan</b> is a // b. Daarmee <b>bewijs</b> je dat rechten evenwijdig zijn.', draw:()=>tx(180, 40, 'ALS  overeenkomstige hoeken even groot', 'val big or') + tx(180, 78, 'DAN  a // b', 'val big')}
    ]});
    const zinnen = R.shuffle([
      ['e', `Als a // b, dan zijn de verwisselende binnenhoeken even groot.`],
      ['o', `Als de verwisselende buitenhoeken even groot zijn, dan is a // b.`],
      ['e', `Als a // b, dan zijn de binnenhoeken aan dezelfde kant van de snijlijn supplementair.`],
      ['o', `Als de binnenhoeken aan dezelfde kant van de snijlijn supplementair zijn, dan is a // b.`],
      ['o', `Als de overeenkomstige hoeken even groot zijn, dan is a // b.`],
      ['e', `Als a // b, dan zijn de buitenhoeken aan dezelfde kant van de snijlijn supplementair.`]]).slice(0,4);
    zinnen.forEach(([k,z],i)=> qChoice(b, st, save, 'z'+i, {html:`<span class="q-num">${LET[i]})</span> ${z}`, opts:[['e','eigenschap'],['o','omgekeerde eigenschap']], ans:k,
      why: k==='e' ? 'Je weet dat de rechten evenwijdig zijn en besluit iets over de hoeken.' : 'Je weet iets over de hoeken en besluit dat de rechten evenwijdig zijn.', whyBad:'Kijk naar het dan-deel: besluit je iets over de hoeken (eigenschap) of over de evenwijdigheid (omgekeerde eigenschap)?'}));
  }};
OM.ja = { title:'Zijn a en b evenwijdig?', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const grid = el('div','hf-two'); b.append(grid);
    for(let i=0;i<4;i++){ const t = R.pick(TYPES5); const p = R.pick(PAIRTYPE[t].pairs); const par = i<2 ? R.f()<.6 : R.f()<.4;
      const vA = R.int(40, 140); let vB;
      if(PAIRTYPE[t].rel==='gelijk') vB = par ? vA : vA + R.pick([-8,-6,-5,5,6,8]); else vB = par ? 180-vA : 180-vA + R.pick([-8,-6,5,7]);
      const m = psWithVals(R, p[0], vA, p[1], vB);
      const cell = el('div'); grid.append(cell);
      const sum = vA + vB;
      selQ(cell, st, save, 'j'+i, {html:`${psFig(m, {vals:{[p[0]]:vA+'°', [p[1]]:vB+'°'}, arcs:[p[0],p[1]], nums:false, maxw:380})}<span class="q-num">${LET[i]})</span> Deze hoeken zijn {0}. Is a // b? {1}`,
        opts:[TYPEOPTS, [['j','ja'],['n','neen']]], ans:[t, par?'j':'n'],
        sol: PAIRTYPE[t].rel==='gelijk' ? `${PAIRTYPE[t].naam}: ${vA}° ${vA===vB?'=':'≠'} ${vB}°, dus ${par?'a // b (omgekeerde eigenschap)':'a en b zijn niet evenwijdig'}.` : `${PAIRTYPE[t].naam}: ${vA}° + ${vB}° = ${sum}° ${sum===180?'':'≠ 180°'}, dus ${par?'a // b (omgekeerde eigenschap)':'a en b zijn niet evenwijdig'}.`}); }
  }};
OM.waarom = { title:'Verklaar waarom a // b', lvl:2,
  instr:'Soms moet je eerst een andere hoek berekenen met nevenhoeken of overstaande hoeken.',
  build(b, st, save){ const R = makeR(st);
    /* gegeven: A1 = x en B-hoek die er nevenhoek van een overeenkomstige is */
    const x = R.int(40, 80); const kB = R.pick(['B2','B4']); const m = psWithVals(R, 'A1', x, kB, 180-x);
    b.append(el('div','', psFig(m, {vals:{A1:x+'°', [kB]:(180-x)+'°'}, maxw:420})));
    qBlock(b, st, save, 'w', {html:`${hA('B',1)} = 180° − ${180-x}° = [[0]] &nbsp; ${selHTML(1, [['os','overstaande hoeken'],['nh','nevenhoeken']])}<br>${hA('A',1)} = ${hA('B',1)}, en dat zijn ${selHTML(2, TYPEOPTS)}<br>⇓<br>a // b`, block:true, size:'sm',
      check:v=>{ const f = [Math.abs(parseDeg(v[0])-x)<0.02, v[1]==='nh', v[2]==='ov']; return {ok:f.every(Boolean), fields:f, msg:f.every(Boolean)?'Gelijke overeenkomstige hoeken: dus a // b (omgekeerde eigenschap).':'Kijk naar de rode vakjes.'}; },
      sol:`${hA('B',1)} = 180° − ${180-x}° = ${x}° (nevenhoeken)<br>${hA('A',1)} = ${x}° = ${hA('B',1)}: gelijke overeenkomstige hoeken<br>⇓<br>a // b`});
    /* b) niet evenwijdig */
    const y = R.int(120, 150), z = 180 - y + R.pick([6,10,-8]);
    const m2 = psWithVals(R, 'A2', y, 'B1', z);
    b.append(el('div','', psFig(m2, {vals:{A2:y+'°', B1:z+'°'}, maxw:420})));
    selQ(b, st, save, 'n', {html:`${hA('A',4)} = ${y}° {0}. ${hA('A',4)} + ${hA('B',1)} = ${y+z}° {1} 180°. Dus is a {2} b.`,
      opts:[[['os','(overstaande hoeken)'],['nh','(nevenhoeken)'],['ov','(overeenkomstige hoeken)']], [['=','='],['≠','≠']], [['//','//'],['niet //','niet //']]], ans:['os','≠','niet //'],
      sol:`${hA('A',4)} = ${hA('A',2)} = ${y}° (overstaande hoeken). ${hA('A',4)} en ${hA('B',1)} zijn binnenhoeken aan dezelfde kant: ${y}° + ${z}° = ${y+z}° ≠ 180°. Dus a en b zijn niet evenwijdig.`});
  }};
OM.hoeveel = { title:'Hoe groot moet α zijn opdat a // b?', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const grid = el('div','hf-two'); b.append(grid);
    const ts = R.shuffle(['ov','vb','bz','vu','uz']).slice(0,3); ts.push('right');
    ts.forEach((t,i)=>{ const cell = el('div'); grid.append(cell);
      if(t==='right'){ const m = psMake({W:320, H:210, ds:90, da:0}); let s = psSvg(m, {arcs:['B2'], nums:false, vals:{B2:'α'}}); s += rightL(m.A, 0);
        cell.innerHTML = hfWrap(320, 210, s, {maxw:340});
        degQ(cell, st, save, 'h'+i, `<span class="q-num">${LET[i]})</span> s ⊥ a. Opdat a // b moet α = [[0]]`, 90, {hint:'Een rechte hoek in A: in B moet de overeenkomstige hoek ook recht zijn.', sol:'α = 90°: dan zijn de overeenkomstige hoeken even groot.'}); return; }
      const p = R.pick(PAIRTYPE[t].pairs); const vA = R.int(48, 132); const want = PAIRTYPE[t].rel==='gelijk' ? vA : 180-vA;
      const m = psWithVals(R, p[0], vA, p[1], want, {W:320, H:210});
      cell.innerHTML = psFig(m, {vals:{[p[0]]:vA+'°', [p[1]]:'α'}, arcs:[p[0],p[1]], nums:false, maxw:340});
      degQ(cell, st, save, 'h'+i, `<span class="q-num">${LET[i]})</span> Opdat a // b moet α = [[0]]`, want, {hint:`Dit zijn ${PAIRTYPE[t].naam}: die moeten ${PAIRTYPE[t].rel==='gelijk'?'even groot':'supplementair'} zijn.`,
        sol:`${PAIRTYPE[t].naam}: α = ${PAIRTYPE[t].rel==='gelijk' ? vA+'°' : '180° − '+vA+'° = '+want+'°'}`}); });
  }};
OM.alfa = { title:'Evenwijdig met een letter', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const m = psMake({W:340, H:220, ds:R.int(60, 75), da:R.int(-6,6)});
    const kind = R.pick(['n','o']);
    const vals = kind==='n' ? {A2:'α', B1:'180° − α'} : {A1:'α', B3:'α'};
    b.append(el('div','', psFig(m, {vals, nums:true, arcs:Object.keys(vals), maxw:440})));
    if(kind==='n') selQ(b, st, save, 'q', {html:`Verklaar waarom a // b.<br>${hA('B',2)} = 180° − (180° − α) = {0} &nbsp; {1}<br>${hA('A',2)} = ${hA('B',2)} = α: dat zijn {2}, dus a // b.`,
      opts:[[['a','α'],['180','180°'],['2a','180° − 2α']], [['nh','(nevenhoeken)'],['os','(overstaande hoeken)']], TYPEOPTS], ans:['a','nh','ov'],
      sol:`${hA('B',2)} = 180° − (180° − α) = α (nevenhoeken). ${hA('A',2)} en ${hA('B',2)} zijn gelijke overeenkomstige hoeken, dus a // b.`});
    else selQ(b, st, save, 'q', {html:`Verklaar waarom a // b.<br>${hA('A',1)} en ${hA('B',3)} zijn {0} en ze zijn {1}. Dus a // b.`,
      opts:[TYPEOPTS, [['g','even groot'],['s','supplementair']]], ans:['vu','g'], sol:'Verwisselende buitenhoeken die even groot zijn: a // b (omgekeerde eigenschap).'});
  }};
OM.ongerijmde = { title:'Bewijs uit het ongerijmde', lvl:3,
  build(b, st, save){
    const m = psMake({W:340, H:220, ds:62, da:6, db:-6}); let s = psSvg(m, {arcs:['A1','B1'], vals:{A1:'', B1:''}});
    s += lineSvg(m.B, m.da, 340, 220, 'ln help') + nmSvg(m.B, m.da, 340, 220, "b′", {side:-90});
    b.append(el('div','', hfWrap(340, 220, s, {maxw:440})));
    b.append(el('div','q-text block', `<b>Gegeven:</b> s snijdt a en b, ${hA('A',1)} = ${hA('B',1)}. <b>Te bewijzen:</b> a // b.<br>Je veronderstelt het omgekeerde en toont aan dat dat tot een tegenspraak leidt.`));
    orderEx(b, st, save, 'o', {lines:[
      `Stel a <span class="npar">//</span> b.`,
      `Teken door B de rechte b′ // a. Noem α de hoek die b′ met s maakt.`,
      `b′ // a ⟹ ${hA('A',1)} = α &nbsp;<span class="r">(overeenkomstige hoeken bij a // b′)</span>`,
      `en ${hA('A',1)} = ${hA('B',1)} &nbsp;<span class="r">(gegeven)</span>, dus ${hA('B',1)} = α &nbsp;(1)`,
      `Doordat b′ ≠ b geldt: ${hA('B',1)} ≠ α &nbsp;(2)`,
      `(1) en (2) spreken elkaar tegen. Dus is a // b.`]});
  }};

SEC.namen = { id:'namen', ic:'h_namen', nav:'Namen bij evenwijdigen en een snijlijn', title:'Hoeken bij twee evenwijdigen en een snijlijn: de namen',
  tip:'Nummer de hoeken in elk snijpunt op dezelfde manier. Dan zie je meteen welke hoeken <b>overeenkomstig</b> zijn: ze dragen hetzelfde nummer.',
  cheat:`<h3>Spiekbriefje · namen</h3><table><tr><td>binnenhoeken</td><td>tussen de twee rechten</td></tr><tr><td>buitenhoeken</td><td>buiten de twee rechten</td></tr><tr><td>overeenkomstige hoeken</td><td>op dezelfde plaats bij elk snijpunt</td></tr><tr><td>verwisselende binnenhoeken</td><td>allebei binnen, aan verschillende kanten van de snijlijn</td></tr><tr><td>binnenhoeken aan dezelfde kant van de snijlijn</td><td>allebei binnen, aan dezelfde kant</td></tr><tr><td>verwisselende buitenhoeken</td><td>allebei buiten, aan verschillende kanten</td></tr><tr><td>buitenhoeken aan dezelfde kant van de snijlijn</td><td>allebei buiten, aan dezelfde kant</td></tr></table>`,
  cards:[NM.verk, NM.binnen, NM.naam, NM.zoek, NM.alle, NM.figuur, NM.twee] };
const CHEATEIG = `<h3>Spiekbriefje · eigenschappen</h3><table>${TYPES5.map(t=>`<tr><td>${PAIRTYPE[t].naam}</td><td>${PAIRTYPE[t].rel==='gelijk'?'even groot':'supplementair (samen 180°)'}</td></tr>`).join('')}</table><p><b>Eigenschap</b>: als a // b, dan … (iets over de hoeken).<br><b>Omgekeerde eigenschap</b>: als de hoeken …, dan a // b.</p>`;
SEC.eig = { id:'eig', ic:'h_eig', nav:'Eigenschappen', title:'Eigenschappen van hoeken bij evenwijdigen',
  tip:'Bij twee <b>evenwijdige</b> rechten en een snijlijn zijn alle hoeken ofwel <b>even groot</b>, ofwel <b>supplementair</b>. Noteer altijd de reden tussen haakjes.',
  cheat:CHEATEIG, cards:[EG.verk, EG.anim, EG.zin, EG.acht, EG.reden, EG.tabel, EG.alg, EG.som, EG.verschil, EG.trans, EG.par] };
SEC.omgek = { id:'omgek', ic:'h_omgek', nav:'Omgekeerde eigenschappen', title:'Omgekeerde eigenschappen: wanneer zijn rechten evenwijdig?',
  tip:'Met een <b>omgekeerde eigenschap</b> bewijs je dat twee rechten <b>evenwijdig</b> zijn. Je vertrekt van de hoeken.',
  cheat:CHEATEIG, cards:[OM.verk, OM.wissel, OM.ja, OM.waarom, OM.hoeveel, OM.alfa, OM.ongerijmde] };
/* ============================================================
   HOEKEN BEREKENEN IN CONTEXTEN (D21 en gelijkaardige situaties)
   ============================================================ */
/* hoek + reden in één regel: html met [[0]] voor de hoek en {R} voor de keuzelijst met redenen */
function degRedQ(parent, st, save, id, html, ans, reasons, o={}){
  const opts = o.opts || REDENOPTS;
  const h = html.replace('{R}', selHTML(1, opts));
  return qBlock(parent, st, save, id, {html:h, block:true, mode:'decimal', size:'sm', sol:o.sol,
    check:v=>{ const x = parseDeg(v[0]); const okA = !isNaN(x) && Math.abs(x-ans)<0.02; const okR = reasons.includes(v[1]);
      return {ok:okA&&okR, fields:[okA, okR], msg: okA&&okR ? (o.why||'') : !okA ? (o.hint||'Kijk nog eens naar de hoekgrootte.') : 'De hoek is juist, maar kies een betere reden.'}; }});
}
/* sector i (1..4) bij snijpunt V van een rechte met richting dl en een snijlijn met richting ds */
function secAng(V, dl, ds, i, o={}){ const [a0,a1] = psSectors(dl, ds)[i]; return angSvg(V, a0, a1, o); }
const CT = {};

/* ---------- ladder: de sporten zijn evenwijdig met de grond ---------- */
function ladderSvg(g, k, o={}){
  const W = 340, H = 240, gy = 210, wallX = 285; let s = '';
  s += `<rect class="kade" x="0" y="${gy}" width="${W}" height="${H-gy}"/>` + `<rect class="kade" x="${wallX}" y="10" width="${W-wallX}" height="${gy-10}"/>`;
  const F1 = P(wallX - 6 - (gy-35)/Math.tan(g*D2R) - 44, gy), F2 = P(F1.x + 44, gy);
  const top = p => P(p.x + (p.y-35)/Math.tan(g*D2R), 35);
  const T1 = top(F1), T2 = top(F2);
  s += lnSvg(P(0,gy), P(wallX,gy), 'ln');
  const hs = [38, 76, 114, 152]; const rungs = hs.map(h=>{ const y = gy - h; const xl = F1.x + h/Math.tan(g*D2R); return [P(xl, y), P(xl+44, y)]; });
  rungs.forEach(([p,q],j)=> s += lnSvg(p, q, 'plank thin'));
  s += lnSvg(F1, T1, 'plank') + lnSvg(F2, T2, 'plank');
  /* gegeven hoek aan de voet van de linkerboom (tussen grond en boom) */
  if(o.foot!==false) s += secAng(F1, 0, g, 1, {r:24, fillCls:'or', txt:o.footTxt||(g+'°'), tr:40});
  const V = rungs[k][0];
  (o.ask||[]).forEach(([i,txt,cls])=> s += secAng(V, 0, g, i, {r:21, fillCls:cls||'tq', txt, tr:33}));
  return hfWrap(W, H, s, {maxw:430, alt:'ladder tegen een muur met sporten evenwijdig aan de grond'});
}
CT.ladder = { title:'De ladder', lvl:1,
  instr:'De sporten van een ladder zijn evenwijdig met de grond. De ladderboom is dan een snijlijn.',
  build(b, st, save){ const R = makeR(st);
    const g = R.int(60, 72); const k = R.int(1, 2);
    b.append(el('div','', ladderSvg(g, k, {ask:[[1,'α','tq'],[4,'β','vi']]})));
    b.append(el('p','instructions', `De ladderboom maakt met de grond een hoek van ${g}°. Bereken de hoeken α en β tussen de ladderboom en een sport.`));
    degRedQ(b, st, save, 'a', `<span class="q-num">a)</span> α = [[0]] want {R}`, g, ['ov'], {sol:`De sport is evenwijdig met de grond. De hoek aan de voet en α liggen op dezelfde plaats: het zijn <b>overeenkomstige hoeken</b>. Dus α = ${g}°.`});
    degRedQ(b, st, save, 'b', `<span class="q-num">b)</span> β = [[0]] want {R}`, 180-g, ['nh','bz'], {sol:`β is de nevenhoek van α: β = 180° − ${g}° = ${180-g}°. Of: β en de hoek aan de voet zijn binnenhoeken aan dezelfde kant van de snijlijn, dus supplementair.`});
  }};
CT.ladderOmg = { title:'Hangt de sport scheef?', lvl:2,
  instr:'Hier gebruik je een omgekeerde eigenschap: uit de hoeken besluit je of een sport evenwijdig is met de grond.',
  build(b, st, save){ const R = makeR(st);
    for(let q=0;q<2;q++){
      const g = R.int(60, 74); const k = R.int(1,2); if(q===0) st.g0 = R.f()<.5; const ok = q===0 ? st.g0 : !st.g0;
      const i = R.pick([1,4]); const exact = i===1 ? g : 180-g; const meet = ok ? exact : exact + R.pick([-4,-3,3,4]);
      b.append(el('div','', ladderSvg(g, k, {ask:[[i, meet+'°', 'tq']]})));
      qChoice(b, st, save, 'c'+q, {nr:LET[q]+')', html:`Aan de voet meet je ${g}°, bij een sport ${meet}°. Is die sport evenwijdig met de grond?`,
        opts:[['j','ja'],['n','nee']], ans: ok ? 'j' : 'n',
        why: ok ? (i===1 ? `${g}° en ${meet}° zijn gelijke <b>overeenkomstige hoeken</b>, dus is de sport evenwijdig met de grond.` : `${g}° + ${meet}° = 180°: <b>binnenhoeken aan dezelfde kant</b> die supplementair zijn, dus is de sport evenwijdig met de grond.`)
                : (i===1 ? `${g}° ≠ ${meet}°: de overeenkomstige hoeken zijn niet even groot, dus is de sport niet evenwijdig met de grond.` : `${g}° + ${meet}° = ${g+meet}° ≠ 180°, dus is de sport niet evenwijdig met de grond.`),
        whyBad:'Vergelijk de twee hoeken: welke soort hoeken zijn het, en moeten ze dan even groot of supplementair zijn?'});
    }
  }};

/* ---------- parkeervakken: schuine lijnen evenwijdig met elkaar, stoeprand evenwijdig met de rijbaan ---------- */
CT.parking = { title:'Schuine parkeervakken', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const p = R.int(48, 68); const W = 340, H = 220, y1 = 160, y2 = 70; let s = '';
    s += `<rect x="0" y="${y2}" width="${W}" height="${y1-y2}" fill="#6b7478" opacity=".85"/><rect class="kade" x="0" y="${y1}" width="${W}" height="${H-y1}"/><rect x="0" y="0" width="${W}" height="${y2}" fill="#6b7478" opacity=".55"/>`;
    s += lnSvg(P(0,y1), P(W,y1), 'ln') + lnSvg(P(0,y2), P(W,y2), 'ln ghost');
    const dx = (y1-y2)/Math.tan(p*D2R); const xs = [40, 105, 170, 235];
    xs.forEach(x=> s += `<line x1="${x}" y1="${y1}" x2="${fx(x+dx)}" y2="${y2}" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`);
    s += tx(W-60, y1+22, 'stoeprand', 'cap') + tx(W-60, y2-14, 'rand van de rijbaan', 'cap');
    s += secAng(P(xs[0],y1), 0, p, 1, {r:22, fillCls:'or', txt:p+'°', tr:36});
    s += secAng(P(xs[2],y1), 0, p, 2, {r:18, fillCls:'tq', txt:'α', tr:30});
    s += secAng(P(xs[3]+dx,y2), 0, p, 3, {r:18, fillCls:'vi', txt:'β', tr:30});
    b.append(el('div','', hfWrap(W, H, s, {maxw:440, alt:'schuine parkeervakken langs een stoeprand'})));
    b.append(el('p','instructions', `De witte lijnen zijn evenwijdig. De stoeprand is evenwijdig met de rand van de rijbaan. Een witte lijn maakt met de stoeprand een hoek van ${p}°.`));
    degRedQ(b, st, save, 'a', `<span class="q-num">a)</span> α = [[0]] want {R}`, 180-p, ['nh'], {sol:`Op de stoeprand zijn alle witte lijnen evenwijdig, dus is de hoek bij elke lijn rechts ${p}°. α is daarvan de nevenhoek: 180° − ${p}° = ${180-p}°.`});
    degRedQ(b, st, save, 'b', `<span class="q-num">b)</span> β = [[0]] want {R}`, p, ['vb'], {sol:`Stoeprand en rijbaanrand zijn evenwijdig, de witte lijn is de snijlijn. β en de hoek van ${p}° bij dezelfde lijn zijn <b>verwisselende binnenhoeken</b>: β = ${p}°.`});
  }};

/* ---------- spoorweg: twee evenwijdige sporen en een weg ---------- */
CT.spoor = { title:'De overweg', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const x = R.int(52, 76); const m = psWithAngle(R, x, {n:{a:'a', b:'b', s:'w', A:'A', B:'B'}}); const v = psAllVals(m);
    const g = R.pick(['A1','A2','A3','A4']);
    let s = '';
    /* dwarsliggers langs de rails */
    for(let t=10;t<m.W;t+=16){ ['A','B'].forEach(L=>{ const V = m[L]; const d = L==='A'?m.da:m.db; const q = polar(V, t - m.W/2 - (V.x - m.W/2), d); const u = polar(q, 6, d+90), w = polar(q, 6, d-90); s += lnSvg(u, w, 'ln thin'); }); }
    s += psSvg(m, {vals:{[g]:Math.round(v[g])+'°'}, fill:{[g]:'or'}});
    b.append(el('div','', hfWrap(m.W, m.H, s, {maxw:460, alt:'twee evenwijdige rails a en b en een weg w die de sporen kruist'})));
    b.append(el('p','instructions', `De rails a en b zijn evenwijdig. De weg w kruist de sporen. Bereken de vier hoeken bij B.`));
    const ks = ['B1','B2','B3','B4'];
    qBlock(b, st, save, 'q', {html:ks.map((k,i)=>`<span style="white-space:nowrap">${kH(m,k)} = [[${i}]]</span>`).join(' &nbsp; '), block:true, size:'sm', mode:'decimal', check:chkDegs(ks.map(k=>Math.round(v[k]))),
      sol:`${kH(m,g)} = ${Math.round(v[g])}°. Bij B is ${kH(m,'B'+g[1])} een overeenkomstige hoek, dus ook ${Math.round(v[g])}°. De overstaande hoek is even groot, de nevenhoeken zijn 180° − ${Math.round(v[g])}° = ${180-Math.round(v[g])}°.`});
  }};

/* ---------- trapleuning: de spijlen zijn evenwijdig, de leuning is een snijlijn ---------- */
CT.trap = { title:'De trapleuning', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const h = R.int(28, 36); /* hellingshoek van de leuning */
    const W = 340, H = 260; let s = '';
    const base = P(40, 245), stepW = 46, stepH = stepW*Math.tan(h*D2R);
    let pts = [base]; for(let i=0;i<5;i++){ const p = pts[pts.length-1]; pts.push(P(p.x, p.y-stepH), P(p.x+stepW, p.y-stepH)); }
    s += `<polyline points="${pts.map(p=>fx(p.x)+','+fx(p.y)).join(' ')} ${fx(pts[pts.length-1].x)},245" fill="var(--accent-soft)" stroke="var(--ink-soft)" stroke-width="1.2"/>`;
    const tops = []; for(let i=0;i<5;i++){ const x = base.x + stepW*i + stepW/2; const yStep = base.y - stepH*(i+1); const yTop = yStep - 52; s += lnSvg(P(x,yStep), P(x,yTop), 'leg'); tops.push(P(x,yTop)); }
    const L0 = polar(tops[0], 30, h+180), L1 = polar(tops[4], 25, h);
    s += lnSvg(L0, L1, 'handle');
    /* gegeven: bij de tweede spijl, onder de leuning, rechts van de spijl (tussen de spijlen) */
    s += angSvg(tops[1], 270, 360+h, {r:18, fillCls:'or', txt:(90+h)+'°', tr:34});
    const opts = [{a0:270, a1:360+h, ans:90+h, r:['ov'], uit:'op dezelfde plaats: overeenkomstige hoeken'},
                  {a0:180+h, a1:270, ans:90-h, r:['bz'], uit:'binnenhoeken aan dezelfde kant van de leuning: samen 180°'},
                  {a0:90, a1:180+h, ans:90+h, r:['vb'], uit:'verwisselende binnenhoeken: even groot'}];
    const c = R.pick(opts);
    s += angSvg(tops[3], c.a0, c.a1, {r:16, fillCls:'tq', txt:'α', tr:28});
    b.append(el('div','', hfWrap(W, H, s, {maxw:440, alt:'trap met verticale spijlen en een schuine leuning'})));
    b.append(el('p','instructions', `De spijlen staan verticaal en zijn dus evenwijdig. De leuning is een snijlijn. Bereken α.`));
    degRedQ(b, st, save, 'a', `α = [[0]] want {R}`, c.ans, c.r, {sol:`α en de hoek van ${90+h}° zijn ${c.uit}. Dus α = ${c.ans}°.`});
  }};

/* ---------- verdieping: een strook papier plooien ---------- */
CT.vouw = { title:'Een strook papier vouwen', lvl:3,
  build(b, st, save){ const R = makeR(st);
    const x = R.int(54, 72); const W = 340, H = 250, yT = 120, yB = 200; let s = '';
    const Q = P(190, yB); const Pp = P(Q.x + (yB-yT)/Math.tan(x*D2R), yT);
    s += `<polygon points="10,${yT} ${fx(Pp.x)},${yT} ${fx(Q.x)},${yB} 10,${yB}" fill="var(--or-soft)" stroke="var(--ink)" stroke-width="1.5"/>`;
    /* omgevouwen deel: gespiegeld rond de vouwlijn */
    const d2 = 2*x; const L = 105; const Q2 = polar(Q, L, d2), P2 = polar(Pp, L, d2);
    s += `<polygon points="${fx(Q.x)},${fx(Q.y)} ${fx(Q2.x)},${fx(Q2.y)} ${fx(P2.x)},${fx(P2.y)} ${fx(Pp.x)},${fx(Pp.y)}" fill="var(--accent-soft)" stroke="var(--ink)" stroke-width="1.5"/>`;
        s += angSvg(Q, x, d2, {r:22, fillCls:'or', txt:x+'°', tr:36});
    s += lnSvg(polar(Q, -18, x), polar(Pp, 18, x), 'ln help');
    const K = lineInter(Q, Q2, P(0,yT), P(10,yT));
    s += angSvg(K, d2+180, 360, {r:16, fillCls:'vi', txt:'β', tr:28});
    s += angSvg(Q, d2, 180, {r:14, fillCls:'tq', txt:'α', tr:28, right:false});
    s += lnSvg(Q, P(Q.x+60, yB), 'ln ghost') + lnSvg(Pp, P(Pp.x+60, yT), 'ln ghost');
    b.append(el('div','', hfWrap(W, H, s, {maxw:440, alt:'een strook papier met evenwijdige randen die schuin is omgevouwen'})));
    b.append(el('p','instructions', `De randen van de strook zijn evenwijdig. Je vouwt de strook langs de stippellijn. Het omgevouwen stuk maakt met de vouwlijn een hoek van ${x}°. Bereken α en β.`));
    degQ(b, st, save, 'a', `<span class="q-num">a)</span> α = [[0]]`, 180-2*x, {hint:'Vouwen verandert een hoek niet: de hoek tussen de vouwlijn en de onderrand vóór het vouwen is ook ' + x + '°. De drie hoeken bij het hoekpunt vormen een gestrekte hoek.',
      sol:`Vóór het vouwen maakte de onderrand ook ${x}° met de vouwlijn (vouwen bewaart hoeken). Samen met α vormen ze een gestrekte hoek: α = 180° − ${x}° − ${x}° = ${180-2*x}°.`});
    degRedQ(b, st, save, 'b', `<span class="q-num">b)</span> β = [[0]] want {R}`, 180-2*x, ['vb'], {sol:`De randen van de strook zijn evenwijdig, de omgevouwen rand is een snijlijn. α en β zijn verwisselende binnenhoeken: β = α = ${180-2*x}°.`});
  }};

/* ---------- verdieping: airhockey, de puck botst tegen twee evenwijdige randen ---------- */
CT.air = { title:'Airhockey', lvl:3,
  build(b, st, save){ const R = makeR(st);
    const a = R.int(50, 64); const W = 340, H = 200, y1 = 20, y2 = 180; let s = '';
    s += `<rect x="10" y="${y1}" width="${W-20}" height="${y2-y1}" rx="10" fill="var(--accent-soft)" stroke="var(--ink)" stroke-width="2"/>`;
    const dx = (y2-y1)/Math.tan(a*D2R);
    const p0 = P(28, y2 - (y2-y1)*0.4), p1 = P(p0.x + (p0.y-y1)/Math.tan(a*D2R), y1), p2 = P(p1.x + dx, y2), p3 = P(Math.min(W-14, p2.x + dx*0.7), y2 - Math.min(W-14-p2.x, dx*0.7)*Math.tan(a*D2R));
    s += `<polyline points="${[p0,p1,p2,p3].map(p=>fx(p.x)+','+fx(p.y)).join(' ')}" fill="none" stroke="var(--orange)" stroke-width="2.4" stroke-dasharray="7 4"/>`;
    s += `<circle cx="${fx(p0.x)}" cy="${fx(p0.y)}" r="7" fill="var(--ink)"/>`;
    s += angSvg(p1, 360-a, 360, {r:22, fillCls:'or', txt:a+'°', tr:36});
    s += angSvg(p2, 180-a, 180, {r:26, fillCls:'tq', txt:'α', tr:40});
    s += angSvg(p2, a, 180-a, {r:20, fillCls:'vi', txt:'β', tr:34});
    b.append(el('div','', hfWrap(W, H, s, {maxw:440, alt:'airhockeytafel met een puck die tegen de randen botst'})));
    b.append(el('p','instructions', `De twee lange randen van de tafel zijn evenwijdig. Bij een botsing is de hoek waaronder de puck aankomt even groot als de hoek waaronder hij vertrekt.`));
    degRedQ(b, st, save, 'a', `<span class="q-num">a)</span> α = [[0]] want {R}`, a, ['vb'], {sol:`De twee randen zijn evenwijdig, het stuk baan ertussen is een snijlijn. α en ${a}° zijn verwisselende binnenhoeken: α = ${a}°.`});
    degQ(b, st, save, 'b', `<span class="q-num">b)</span> β = [[0]]`, 180-2*a, {hint:'De puck vertrekt onder dezelfde hoek α. Samen met β vormen ze een gestrekte hoek.', sol:`De puck vertrekt ook onder ${a}°. β = 180° − ${a}° − ${a}° = ${180-2*a}°.`});
  }};

/* ---------- verdieping: zonnepanelen, de zonnestralen zijn evenwijdig ---------- */
CT.zon = { title:'Zonnepanelen', lvl:3,
  build(b, st, save){ const R = makeR(st);
    const z = R.int(28, 52), p = R.int(25, 40); const W = 340, H = 220, gy = 190; let s = '';
    s += `<rect class="kade" x="0" y="${gy}" width="${W}" height="${H-gy}"/>` + lnSvg(P(0,gy), P(W,gy), 'ln');
    const F = P(170, gy - 30), T = polar(F, 110, p);
    s += lnSvg(P(F.x+8, gy), F, 'leg') + lnSvg(P(T.x-8, gy), polar(F, 100, p), 'leg');
    s += lnSvg(F, T, 'deck');
    const Hit = polar(F, 60, p);
    /* zonnestralen: richting -z (naar rechtsonder) */
    [25, 60, 95].forEach(t=>{ const q = polar(F, t, p); const st0 = polar(q, 170, 180-z); s += `<line x1="${fx(st0.x)}" y1="${fx(st0.y)}" x2="${fx(q.x)}" y2="${fx(q.y)}" stroke="var(--orange)" stroke-width="1.8" stroke-dasharray="${t!==60?'5 4':'0'}"/>`; });
    s += lnSvg(F, polar(F, 45, 0), 'ln ghost');
    s += `<circle cx="22" cy="24" r="14" fill="var(--orange)" opacity=".85"/>`;
    const G = P(Hit.x + (gy - Hit.y)/Math.tan(z*D2R), gy); /* de middelste straal verlengd tot de grond */
    s += lnSvg(Hit, G, 'ln ghost') + angSvg(G, 180-z, 180, {r:22, fillCls:'or', txt:z+'°', tr:36});
    s += angSvg(F, 0, p, {r:24, fillCls:'vi', txt:p+'°', tr:38});
    s += angSvg(Hit, p, 180-z, {r:18, fillCls:'tq', txt:'α', tr:30});
    s += lnSvg(polar(Hit, 50, 180), polar(Hit, 50, 0), 'ln help');
    b.append(el('div','', hfWrap(W, H, s, {maxw:440, alt:'zonnepaneel op de grond met evenwijdige zonnestralen'})));
    b.append(el('p','instructions', `De zonnestralen zijn evenwijdig en maken met de grond een hoek van ${z}°. Het paneel staat ${p}° schuin. Bereken de hoek α tussen een zonnestraal en het paneel. Tip: gebruik de horizontale hulplijn door het punt waar de straal het paneel raakt.`));
    degQ(b, st, save, 'a', `α = [[0]]`, 180-z-p, {hint:'De hulplijn is evenwijdig met de grond. Zoek de hoek van de straal en de hoek van het paneel met die hulplijn.',
      sol:`De hulplijn is evenwijdig met de grond. De straal maakt met de hulplijn ${z}° (overeenkomstige hoeken), het paneel maakt ${p}° met de hulplijn (overeenkomstige hoeken). Samen met α vormen ze een gestrekte hoek: α = 180° − ${z}° − ${p}° = ${180-z-p}°.`});
  }};

SEC.ctx = { id:'ctx', ic:'h_ctx', nav:'Hoeken in contexten', title:'Hoeken berekenen in contexten',
  tip:'Zoek eerst de <b>evenwijdige rechten</b> en de <b>snijlijn</b> in de situatie. Daarna gebruik je de eigenschappen zoals in een gewone figuur.',
  cheat:CHEATEIG, cards:[CT.ladder, CT.spoor, CT.parking, CT.trap, CT.ladderOmg, CT.vouw, CT.air, CT.zon] };
/* ============================================================
   SOM VAN DE HOEKEN VAN EEN DRIEHOEK
   - inzicht: afscheuren (puntspiegeling om het midden van een zijde), dynamische driehoek
   - het bewijs met de evenwijdige door een hoekpunt: bekijken, ordenen, redenen, invullen, volledig schrijven, uit het hoofd, op papier
   ============================================================ */
/* richtingen a en b zo ordenen dat de hoek van a naar b (tegenwijzerzin) kleiner is dan 180° */
function angDirs(a, b){ return norm360(b-a) <= 180 ? [a, b] : [b, a]; }
function angAt(V, X, Y){ return angDirs(dirAng(V,X), dirAng(V,Y)); }
/* driehoek met gegeven hoeken (in graden) bij A en B, passend in W x H */
function triPts(al, be, o={}){
  const W = o.W||320, H = o.H||210, pad = o.pad!=null ? o.pad : 34, rot = o.rot||0;
  const c = Math.sin(be*D2R)/Math.sin((al+be)*D2R);
  let pts = [[0,0],[1,0],[c*Math.cos(al*D2R), c*Math.sin(al*D2R)]];
  pts = pts.map(([x,y])=>[x*Math.cos(rot*D2R)-y*Math.sin(rot*D2R), x*Math.sin(rot*D2R)+y*Math.cos(rot*D2R)]);
  const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1]); const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
  const sc = Math.min((W-2*pad)/(mxx-mnx), (H-2*pad - (o.top||0))/(mxy-mny));
  const ox = (W - (mxx-mnx)*sc)/2, oy = (H - (o.top||0) - (mxy-mny)*sc)/2 + (o.top||0);
  const S = ([x,y]) => P(ox + (x-mnx)*sc, H - oy - (y-mny)*sc + (o.top||0) - (o.top||0));
  const [A,B,C] = pts.map(S); return {A, B, C, W, H, al, be, ga:180-al-be};
}
const triVal = (T, k) => k==='A' ? T.al : k==='B' ? T.be : T.ga;
/* driehoek tekenen. o.n = namen, o.mk = {A:{fill, txt, num, r, arc}}, o.ticks = [[k1,k2,n]] (gelijke zijden) */
function triSvg(T, o={}){
  const n = {A:'A', B:'B', C:'C', ...(o.n||{})}; const V = {A:T.A, B:T.B, C:T.C};
  const G = P((T.A.x+T.B.x+T.C.x)/3, (T.A.y+T.B.y+T.C.y)/3);
  let s = `<polygon class="tri" points="${[T.A,T.B,T.C].map(p=>fx(p.x)+','+fx(p.y)).join(' ')}"/>`;
  Object.entries(o.mk||{}).forEach(([k,m])=>{ if(!m) return; const others = ['A','B','C'].filter(x=>x!==k); const [a0,a1] = angAt(V[k], V[others[0]], V[others[1]]);
    s += angSvg(V[k], a0, a1, {r:m.r||20, fillCls:m.fill, txt:m.txt, num:m.num, tr:m.tr, right:m.right}); });
  s += `<polygon class="poly" points="${[T.A,T.B,T.C].map(p=>fx(p.x)+','+fx(p.y)).join(' ')}"/>`;
  (o.ticks||[]).forEach(([k1,k2,c])=> s += tickSvg(V[k1], V[k2], c||1));
  if(o.names!==false) ['A','B','C'].forEach(k=>{ const d = dirAng(G, V[k]); const lp = polar(V[k], 14, d); s += ptSvg(V[k], n[k], {lp}); });
  return s;
}
/* streepjes voor gelijke zijden */
function tickSvg(p, q, c=1){ const m = mid(p,q), d = dirAng(p,q); let s = '';
  for(let i=0;i<c;i++){ const o = polar(m, (i-(c-1)/2)*5, d); s += lnSvg(polar(o, 6, d+90), polar(o, 6, d-90), 'ln'); } return s; }
const TRI_N = [['A','B','C'],['K','L','M'],['P','Q','R'],['D','E','F'],['R','S','T'],['E','F','G']];

/* ---------- de figuur en de regels van het bewijs (evenwijdige door Z met XY) ---------- */
function proofSetup(R, o={}){
  const names = o.names || R.pick(TRI_N);
  const al = o.al || R.int(45, 70), be = o.be || R.int(40, 65);
  const T = triPts(al, be, {W:340, H:220, pad:40, top:0});
  /* het hoekpunt met de evenwijdige: standaard de top C */
  const n = {A:names[0], B:names[1], C:names[2]};
  return {T, n, X:n.A, Y:n.B, Z:n.C};
}
function proofFig(S, o={}){ const {T, n} = S; const t = o.t==null ? 1 : o.t; let s = '';
  const dp = dirAng(T.A, T.B); const L = 150*Math.min(1, t*1.4);
  const sec1 = angDirs(dp+180, dirAng(T.C, T.A)), sec2 = angAt(T.C, T.A, T.B), sec3 = angDirs(dirAng(T.C, T.B), dp);
  const mk = o.mk || {};
  if(o.par!==false && t>0){ s += lnSvg(polar(T.C, L, dp+180), polar(T.C, L, dp), 'ln help'); if(t>.6) s += tx(polar(T.C, L-10, dp).x, polar(T.C, L-10, dp).y - 11, 'p', 'nm'); }
  s += triSvg(T, {n, mk:{A: mk.A ? {fill:mk.A, r:28} : null, B: mk.B ? {fill:mk.B, r:28} : null}});
  if(o.par!==false && t>.6){
    s += angSvg(T.C, sec1[0], sec1[1], {r:30, fillCls:mk.C1, num:1, nr:19}); s += angSvg(T.C, sec2[0], sec2[1], {r:30, fillCls:mk.C2, num:2, nr:19}); s += angSvg(T.C, sec3[0], sec3[1], {r:30, fillCls:mk.C3, num:3, nr:19});
  } else if(mk.C2) s += angSvg(T.C, sec2[0], sec2[1], {r:30, fillCls:mk.C2});
  return hfWrap(340, 220, s, {maxw:440, alt:`driehoek ${n.A}${n.B}${n.C} met de evenwijdige p door ${n.C}`});
}
function proofLines(S){ const {X, Y, Z} = S;
  return {
    geg:`Δ${X}${Y}${Z}`, tb:`${hA(X)} + ${hA(Y)} + ${hA(Z)} = 180°`,
    c:`Teken door ${Z} de rechte p // ${X}${Y}.`,
    s1:`${hA(Z,1)} = ${hA(X)}`, r1:`verwisselende binnenhoeken (p // ${X}${Y}, snijlijn ${X}${Z})`,
    s2:`${hA(Z,3)} = ${hA(Y)}`, r2:`verwisselende binnenhoeken (p // ${X}${Y}, snijlijn ${Y}${Z})`,
    s3:`${hA(Z,1)} + ${hA(Z,2)} + ${hA(Z,3)} = 180°`, r3:'gestrekte hoek',
    sub:`⇓ &nbsp;${hA(Z,1)} = ${hA(X)}, &nbsp;${hA(Z,2)} = ${hA(Z)}, &nbsp;${hA(Z,3)} = ${hA(Y)}`,
    bs:`${hA(X)} + ${hA(Y)} + ${hA(Z)} = 180°`
  }; }
function proofModelHTML(S, o={}){ const L = proofLines(S);
  const row = (a, b='', cls='') => `<div class="bm-row ${cls}"><span class="bm-f">${a}</span><span class="bm-r">${b ? '('+b+')' : ''}</span></div>`;
  return `<div class="bm${o.cover?' cover':''}">
    ${row('<b>Gegeven:</b> ' + L.geg)}
    ${row('<b>Te bewijzen:</b> ' + L.tb)}
    ${row('<b>Bewijs:</b> ' + L.c)}
    ${row(L.s1, L.r1)}${row(L.s2, L.r2)}${row(L.s3, L.r3)}
    ${row(L.sub)}${row(L.bs, '', 'bm-end')}</div>`; }
/* regels voor de bewijsschrijver */
function proofRows(S, o={}){ const {X, Y, Z} = S; const h = k => k + '^';
  const z1 = `${Z}^1`, z2 = `${Z}^2`, z3 = `${Z}^3`; const sum = `${X}^+${Y}^+${Z}^=180°`;
  const VB = [['verwissel'], ['binnenhoek']];
  const rows = [
    {lab:'Gegeven', ans:[`Δ${X}${Y}${Z}`, `driehoek ${X}${Y}${Z}`, `${X}${Y}${Z}`, `Δ${X}${Z}${Y}`, `Δ${Y}${X}${Z}`, `Δ${Y}${Z}${X}`, `Δ${Z}${X}${Y}`, `Δ${Z}${Y}${X}`], hint:`Noteer de driehoek: Δ${X}${Y}${Z}.`, ph:'Δ…'},
    {lab:'Te bewijzen', ans:[sum], hint:'De som van de drie hoeken is 180°.'},
    {lab:'Hulplijn', ans:[`p//${X}${Y}`, `p//${Y}${X}`, `door ${Z} p//${X}${Y}`, `teken door ${Z} p//${X}${Y}`, `teken door ${Z} de rechte p//${X}${Y}`], why:`(door ${Z})`, hint:`Teken door ${Z} de rechte p evenwijdig met ${X}${Y}: p // ${X}${Y}.`},
    {lab:'Stap 1', ans:[`${z1}=${X}^`, `${z3}=${Y}^`], hint:`Welke hoek bij ${Z} is even groot als ${hA(X)}?`},
    {lab:'reden', kw:VB, hint:'Het zijn verwisselende binnenhoeken.', ph:'reden'},
    {lab:'Stap 2', ans:[`${z3}=${Y}^`, `${z1}=${X}^`], hint:`Welke hoek bij ${Z} is even groot als ${hA(Y)}?`},
    {lab:'reden', kw:VB, hint:'Het zijn verwisselende binnenhoeken.', ph:'reden'},
    {lab:'Stap 3', ans:[`${z1}+${z2}+${z3}=180°`], hint:`De drie hoeken bij ${Z} samen.`},
    {lab:'reden', kw:[['gestrekt']], hint:'Ze vormen samen een gestrekte hoek.', ph:'reden'},
    {lab:'Besluit', ans:[sum, `${X}^+${Y}^+${z2}=180°`], hint:`Vervang ${hA(Z,1)}, ${hA(Z,2)} en ${hA(Z,3)}.`}
  ];
  if(o.blind) rows.forEach((r,i)=>{ r.lab = (i+1)+'.'; delete r.why; r.ph = ''; });
  return rows;
}

const DR = {};
/* ---------- instap: hoeken afscheuren ---------- */
DR.scheur = { title:'Scheur de hoeken af', lvl:1, noReset:true,
  instr:'Teken een driehoek, kleur de drie hoeken en scheur ze af. Leg ze tegen elkaar. Kijk wat er gebeurt.',
  build(b){
    const T = triPts(62, 50, {W:340, H:220, pad:40});
    const MA = mid(T.A, T.C), MB = mid(T.B, T.C);
    const wedge = (V, X, Y, cls, r=30) => { const [a0,a1] = angAt(V, X, Y); return `<path class="wedge ${cls}" d="${wedgePath(V, r, a0, a1)}"/>` + `<path class="arc" d="${arcOnly(V, r, a0, a1)}"/>`; };
    const base = () => `<polygon class="tri" points="${[T.A,T.B,T.C].map(p=>fx(p.x)+','+fx(p.y)).join(' ')}"/><polygon class="poly" points="${[T.A,T.B,T.C].map(p=>fx(p.x)+','+fx(p.y)).join(' ')}"/>` +
      ptSvg(T.A,'A',{lp:polar(T.A,14,205)}) + ptSvg(T.B,'B',{lp:polar(T.B,14,-25)}) + ptSvg(T.C,'C',{lp:polar(T.C,14,90)});
    const gam = wedge(T.C, T.A, T.B, 'vi');
    const rotW = (V, X, Y, cls, M, t) => `<g transform="rotate(${fx(-180*t)} ${fx(M.x)} ${fx(M.y)})">${wedge(V, X, Y, cls)}</g>`;
    const dp = dirAng(T.A, T.B);
    stepAnim(b, {W:340, H:220, maxw:460, keepCaps:true, alt:'driehoek waarvan de hoeken bij A en B naar C worden gedraaid',
      steps:[
        {cap:'Een driehoek met drie gekleurde hoeken: α bij A, β bij B en γ bij C.', draw:()=> base() + wedge(T.A, T.B, T.C, 'or') + wedge(T.B, T.A, T.C, 'tq') + gam},
        {cap:'Draai α over 180° rond het midden van [AC]. Dat is een <b>puntspiegeling</b>: α komt bij C terecht.', ms:1800,
          draw:t=> base() + `<circle cx="${fx(MA.x)}" cy="${fx(MA.y)}" r="3" fill="var(--orange)"/>` + rotW(T.A, T.B, T.C, 'or', MA, t) + wedge(T.B, T.A, T.C, 'tq') + gam},
        {cap:'Doe hetzelfde met β: een puntspiegeling om het midden van [BC].', ms:1800,
          draw:t=> base() + rotW(T.A, T.B, T.C, 'or', MA, 1) + `<circle cx="${fx(MB.x)}" cy="${fx(MB.y)}" r="3" fill="var(--accent)"/>` + rotW(T.B, T.A, T.C, 'tq', MB, t) + gam},
        {cap:'α, γ en β liggen nu naast elkaar en vormen een <b>gestrekte hoek</b>: α + β + γ = 180°. De lijn bovenaan is evenwijdig met [AB].', ms:1200,
          draw:t=> base() + lnSvg(polar(T.C, 160*t, dp+180), polar(T.C, 160*t, dp), 'ln help') + rotW(T.A, T.B, T.C, 'or', MA, 1) + rotW(T.B, T.A, T.C, 'tq', MB, 1) + gam}
      ]});
    b.append(el('div','eig', `<span class="lbl-def">eigenschap</span>De som van de hoeken van een driehoek is <b>180°</b>.`));
  }};
/* ---------- dynamische driehoek ---------- */
DR.dyn = { title:'Versleep de hoekpunten', lvl:1, noReset:true,
  instr:'Versleep de hoekpunten. De hoeken veranderen, maar hun som blijft altijd dezelfde.',
  build(b){
    const S = {A:P(60,180), B:P(290,190), C:P(170,50)};
    dynAng(b, {W:340, H:230, st:S, maxw:460, alt:'driehoek met versleepbare hoekpunten',
      handles:S=>['A','B','C'].map(k=>({k, x:S[k].x, y:S[k].y, r:9})),
      drag:(k,p,S)=>{ const old = S[k]; S[k] = p; const T = {A:S.A, B:S.B, C:S.C}; const ar = Math.abs((T.B.x-T.A.x)*(T.C.y-T.A.y)-(T.C.x-T.A.x)*(T.B.y-T.A.y)); if(ar < 1500) S[k] = old; },
      draw:S=>{ const vals = triRound(S); const T = {A:S.A, B:S.B, C:S.C, al:vals.A, be:vals.B, ga:vals.C};
        return triSvg(T, {mk:{A:{fill:'or', txt:vals.A+'°', r:22}, B:{fill:'tq', txt:vals.B+'°', r:22}, C:{fill:'vi', txt:vals.C+'°', r:22}}, names:true}); },
      info:S=>{ const v = triRound(S); return `<span class="zw or"></span>${hA('A')} = ${v.A}° &nbsp; <span class="zw tq"></span>${hA('B')} = ${v.B}° &nbsp; <span class="zw vi"></span>${hA('C')} = ${v.C}°<br><b>${hA('A')} + ${hA('B')} + ${hA('C')} = ${v.A} + ${v.B} + ${v.C} = 180°</b>`; }});
  }};
/* hoeken afronden zodat de som exact 180 blijft (grootste rest) */
function triRound(S){ const raw = {A:angBetween(dirAng(S.A,S.B), dirAng(S.A,S.C)), B:angBetween(dirAng(S.B,S.A), dirAng(S.B,S.C)), C:angBetween(dirAng(S.C,S.A), dirAng(S.C,S.B))};
  const fl = {}; let sum = 0; Object.keys(raw).forEach(k=>{ fl[k] = Math.floor(raw[k]); sum += fl[k]; });
  Object.keys(raw).sort((a,b)=>(raw[b]-Math.floor(raw[b]))-(raw[a]-Math.floor(raw[a]))).slice(0, 180-sum).forEach(k=>fl[k]++); return fl; }

/* ---------- het bewijs in stappen ---------- */
DR.anim = { title:'Het bewijs stap voor stap', lvl:1, noReset:true,
  instr:'Dit bewijs moet je kennen. Speel de animatie af en lees elke stap. Let op de hulplijn: een <b>evenwijdige door een hoekpunt</b>.',
  build(b){
    const S = {T:triPts(58, 52, {W:340, H:220, pad:40}), n:{A:'A', B:'B', C:'C'}, X:'A', Y:'B', Z:'C'}; const L = proofLines(S);
    stepAnim(b, {W:340, H:220, maxw:460, keepCaps:true, alt:'bewijs van de som van de hoeken van een driehoek',
      steps:[
        {cap:`<b>Gegeven:</b> ${L.geg} &nbsp; <b>Te bewijzen:</b> ${L.tb}`, draw:()=> inner(proofFig(S, {par:false, mk:{A:'or', B:'tq', C2:'vi'}}))},
        {cap:`<b>Hulplijn:</b> ${L.c}`, ms:1400, draw:t=> inner(proofFig(S, {t, mk:{A:'or', B:'tq', C2:'vi'}}))},
        {cap:`${L.s1} &nbsp;<span class="r">(${L.r1})</span>`, ms:900, draw:t=> inner(proofFig(S, {mk:{A:'or', B:'tq', C2:'vi', C1: t>.3 ? 'or' : null}}))},
        {cap:`${L.s2} &nbsp;<span class="r">(${L.r2})</span>`, ms:900, draw:t=> inner(proofFig(S, {mk:{A:'or', B:'tq', C2:'vi', C1:'or', C3: t>.3 ? 'tq' : null}}))},
        {cap:`${L.s3} &nbsp;<span class="r">(${L.r3})</span>`, ms:900, draw:()=> inner(proofFig(S, {mk:{A:'or', B:'tq', C2:'vi', C1:'or', C3:'tq'}}))},
        {cap:`${L.sub}<br><b>${L.bs}</b>`, ms:900, draw:()=> inner(proofFig(S, {mk:{A:'or', B:'tq', C2:'vi', C1:'or', C3:'tq'}}))}
      ]});
  }};
/* binnenwerk van een svg (voor stepAnim, die zelf omhult) */
const inner = svg => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(/^<rect class="bg"[^>]*\/>/, '');

/* ---------- het modelbewijs leren: regels afdekken ---------- */
DR.model = { title:'Leer het bewijs: dek af en controleer', lvl:1, noReset:true,
  instr:'Lees het bewijs. Klik daarna op <b>Dek alles af</b> en zeg of schrijf elke regel zelf. Klik op een regel om te controleren.',
  build(b){
    const S = {T:triPts(58, 52, {W:340, H:220, pad:40}), n:{A:'A', B:'B', C:'C'}, X:'A', Y:'B', Z:'C'};
    const two = el('div','hf-two'); b.append(two);
    const left = el('div','', proofFig(S, {mk:{A:'or', B:'tq', C2:'vi', C1:'or', C3:'tq'}})); const right = el('div','', proofModelHTML(S)); two.append(left, right);
    const bx = right.querySelector('.bm');
    bx.addEventListener('click', e=>{ const r = e.target.closest('.bm-row'); if(r && bx.classList.contains('cover')) r.classList.toggle('open'); });
    const btn = ctlBtn('Dek alles af', ()=>{ const on = !bx.classList.contains('cover'); bx.classList.toggle('cover', on); bx.querySelectorAll('.bm-row').forEach(r=>r.classList.remove('open')); btn.textContent = on ? 'Toon alles' : 'Dek alles af'; });
    const ctl = el('div','dyn-ctl'); ctl.append(btn); b.append(ctl);
    b.append(el('div','tip-box', '💡 Onthoud de structuur: <b>gegeven</b>, <b>te bewijzen</b>, <b>hulplijn</b>, twee keer <b>verwisselende binnenhoeken</b>, een <b>gestrekte hoek</b> en het <b>besluit</b>.'));
  }};
/* ---------- volgorde ---------- */
DR.volg = { title:'Zet het bewijs in de juiste volgorde', lvl:1,
  build(b, st, save){ const R = makeR(st); const S = proofSetup(R); const L = proofLines(S);
    b.append(el('div','', proofFig(S)));
    orderEx(b, st, save, 'o', {html:`<b>Gegeven:</b> ${L.geg} &nbsp; <b>Te bewijzen:</b> ${L.tb}`, lines:[
      L.c, `${L.s1} &nbsp;(${L.r1})`, `${L.s2} &nbsp;(${L.r2})`, `${L.s3} &nbsp;(${L.r3})`, `${L.sub}`, `${L.bs}`], alt:[[0,2,1,3,4,5]],
      why:'Eerst de hulplijn, dan de gelijke hoeken, dan de gestrekte hoek en tot slot het besluit.'});
  }};
/* ---------- redenen slepen ---------- */
DR.reden = { title:'Sleep de juiste reden bij elke stap', lvl:2,
  build(b, st, save){ const R = makeR(st); const S = proofSetup(R); const L = proofLines(S); const {X, Y, Z} = S;
    b.append(el('div','', proofFig(S)));
    b.append(el('p','instructions', `<b>Gegeven:</b> ${L.geg}, p // ${X}${Y} door ${Z}. <b>Te bewijzen:</b> ${L.tb}`));
    const w1 = `verwisselende binnenhoeken, snijlijn ${X}${Z}`, w2 = `verwisselende binnenhoeken, snijlijn ${Y}${Z}`;
    bankEx(b, st, save, 'rd', [
      {pre:`${L.s1} &nbsp;(`, post:')', ans:w1, why:`p en ${X}${Y} zijn evenwijdig, ${X}${Z} is de snijlijn.`},
      {pre:`${L.s2} &nbsp;(`, post:')', ans:w2, why:`Nu is ${Y}${Z} de snijlijn.`},
      {pre:`${L.s3} &nbsp;(`, post:')', ans:'gestrekte hoek', why:'De drie hoeken liggen naast elkaar op de rechte p.'}
    ], R.shuffle([w1, w2, 'gestrekte hoek', 'overeenkomstige hoeken', 'overstaande hoeken', 'nevenhoeken']));
  }};
/* ---------- gaten invullen ---------- */
DR.gaten = { title:'Vul het bewijs aan', lvl:2,
  instr:'Een paar regels staan er al. Schrijf de andere regels zelf. Gebruik de knop <b>Â dakje</b> voor het dakje.',
  build(b, st, save){ const R = makeR(st); const S = proofSetup(R); const L = proofLines(S); const {X, Y, Z} = S;
    b.append(el('div','', proofFig(S)));
    const rows = proofRows(S); const giv = R.shuffle([1,3,5,7,9]).slice(0,2).concat([0]);
    const plain = h => h.replace(/<sub>(\d)<\/sub>/g,'$1').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n));
    const givenTxt = [L.geg, plain(L.tb), `p // ${X}${Y}`, plain(L.s1), 'verwisselende binnenhoeken', plain(L.s2), 'verwisselende binnenhoeken', plain(L.s3), 'gestrekte hoek', plain(L.bs)];
    giv.forEach(i=>{ rows[i].given = givenTxt[i]; });
    proofWriter(b, st, save, 'pw', {rows, sol:proofModelHTML(S)});
  }};
/* ---------- volledig schrijven met hulp ---------- */
DR.schrijf = { title:'Schrijf het volledige bewijs', lvl:2,
  instr:'Andere letters, hetzelfde bewijs. Schrijf elke regel. Bij elke stap hoort een reden.',
  build(b, st, save){ const R = makeR(st); const S = proofSetup(R, {names:R.pick(TRI_N.slice(1))});
    b.append(el('div','', proofFig(S)));
    proofWriter(b, st, save, 'pw', {rows:proofRows(S), sol:proofModelHTML(S)});
  }};
/* ---------- uit het hoofd ---------- */
DR.blind = { title:'Uit het hoofd: zoals op de toets', lvl:2,
  instr:'Nu zonder hulp. Je krijgt alleen de figuur. Schrijf het bewijs regel per regel, in de juiste volgorde: gegeven, te bewijzen, hulplijn, stap 1 en reden, stap 2 en reden, stap 3 en reden, besluit.',
  build(b, st, save){ const R = makeR(st); const S = proofSetup(R, {names:R.pick(TRI_N)});
    b.append(el('div','', proofFig(S, {par:false})));
    b.append(el('p','instructions', `Bewijs dat de som van de hoeken van Δ${S.X}${S.Y}${S.Z} 180° is. Gebruik een hulplijn door ${S.Z}, noem ze p.`));
    proofWriter(b, st, save, 'pw', {rows:proofRows(S, {blind:true}), sol:proofModelHTML(S)});
  }};
/* ---------- op papier, met zelfcontrole ---------- */
const PAPIER_CHECK = ['Ik noteerde <b>gegeven</b> en <b>te bewijzen</b>.', 'Ik tekende de figuur met de <b>hulplijn p</b> door een hoekpunt, evenwijdig met de overstaande zijde.', 'Ik nummerde de drie hoeken bij dat hoekpunt.', 'Stap 1 met de reden <b>verwisselende binnenhoeken</b>.', 'Stap 2 met de reden <b>verwisselende binnenhoeken</b>.', 'Stap 3 met de reden <b>gestrekte hoek</b>.', 'Ik schreef het <b>besluit</b>.', 'Overal staan de dakjes op de hoeken.'];
DR.papier = { title:'Schrijf het bewijs op papier', lvl:2, noReset:true,
  instr:'Schrijvend leren werkt het best. Neem een blad, schrijf het bewijs volledig uit het hoofd en vergelijk daarna met het model. Herhaal dit op verschillende dagen.',
  build(b, st, save){
    const S = {T:triPts(55, 60, {W:340, H:220, pad:40}), n:{A:'R', B:'S', C:'T'}, X:'R', Y:'S', Z:'T'};
    if(st.n==null) st.n = 0;
    const cnt = el('div','pap-cnt'); b.append(cnt);
    const paint = ()=>{ cnt.innerHTML = `Je schreef het bewijs al <b>${st.n}</b> keer foutloos. ` + (st.n>=5 ? '🎉 Top! Herhaal het nog eens vlak voor de toets.' : `Doel: 5 keer, verspreid over een paar dagen.`); };
    paint();
    const det = el('details','pap-model', `<summary>Toon het modelbewijs (pas na het schrijven)</summary><div class="hf-two"><div>${proofFig(S, {mk:{C1:'or', A:'or', C3:'tq', B:'tq', C2:'vi'}})}</div><div>${proofModelHTML(S)}</div></div>`); b.append(det);
    b.append(el('div','ord-lab','Controleer je eigen bewijs:'));
    const ul = el('div','pap-list'); b.append(ul); st.c = st.c || [];
    PAPIER_CHECK.forEach((t,i)=>{ const lab = el('label','pap-item'); const cb = el('input'); cb.type='checkbox'; cb.checked = !!st.c[i];
      cb.addEventListener('change', ()=>{ st.c[i] = cb.checked; save(); }); lab.append(cb, el('span','', t)); ul.append(lab); });
    const ctl = el('div','dyn-ctl');
    ctl.append(ctlBtn('✔ Alles klopte: tel één keer', ()=>{ if(!PAPIER_CHECK.every((_,i)=>st.c[i])){ alert('Vink eerst alle punten aan. Ontbreekt er iets? Schrijf het bewijs dan opnieuw.'); return; } st.n++; st.c = []; save(); ul.querySelectorAll('input').forEach(x=>x.checked=false); det.open = false; paint(); }));
    ctl.append(ctlBtn('Begin opnieuw', ()=>{ st.c = []; save(); ul.querySelectorAll('input').forEach(x=>x.checked=false); }));
    b.append(ctl);
  }};

/* ---------- rekenen met de som ---------- */
DR.reken = { title:'Bereken de derde hoek', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const grid = el('div','hf-two'); b.append(grid);
    for(let i=0;i<4;i++){ const cell = el('div'); grid.append(cell);
      let al, be; if(i===1){ al = 90; be = R.int(25, 60); } else if(i===2){ be = R.int(25, 70); al = be; } else { al = R.int(30, 95); be = R.int(25, 150-al); }
      const nm = R.pick(TRI_N); const T = triPts(al, be, {W:300, H:190, pad:34, rot:i===2 ? 0 : R.pick([0,0,10,-10])});
      let ask, mk = {}, ticks = [];
      const lab = k => { const v = Math.round(triVal(T,k)); return v===90 ? {right:true} : {txt:v+'°'}; };
      if(i===2){ ticks = [['A','C',1],['B','C',1]]; ask = R.pick(['A','C']);
        if(ask==='C') mk = {A:lab('A'), B:{}, C:{fill:'tq', txt:'?'}}; else mk = {A:{fill:'tq', txt:'?'}, B:{}, C:lab('C')}; }
      else { ask = R.pick(i===1 ? ['B','C'] : ['A','B','C']); ['A','B','C'].forEach(k=> mk[k] = k===ask ? {fill:'tq', txt:'?'} : lab(k)); }
      cell.append(el('div','', hfWrap(300, 190, triSvg(T, {n:{A:nm[0], B:nm[1], C:nm[2]}, mk, ticks}), {maxw:340})));
      const ans = Math.round(triVal(T, ask)); const nk = {A:nm[0], B:nm[1], C:nm[2]}[ask];
      degQ(cell, st, save, 'r'+i, `<span class="q-num">${LET[i]})</span> ${hA(nk)} = [[0]]`, ans, {hint: i===2 ? 'De driehoek is gelijkbenig: de basishoeken zijn even groot.' : 'De drie hoeken zijn samen 180°.',
        sol: i===2 ? `In een gelijkbenige driehoek zijn de basishoeken even groot. ${hA(nk)} = ${ans}°.` : `${hA(nk)} = 180° − de twee andere hoeken = ${ans}°.`});
    }
  }};
/* ---------- kan dat? (soorten driehoeken) ---------- */
DR.soort = { title:'Kan dat wel?', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const Q = [
      {html:'Kan een driehoek twee rechte hoeken hebben?', ans:'n', why:'90° + 90° = 180°: voor de derde hoek blijft 0° over.'},
      {html:'Kan een driehoek een stompe en een rechte hoek hebben?', ans:'n', why:'Een stompe en een rechte hoek zijn samen al meer dan 180°.'},
      {html:'Kan een driehoek drie scherpe hoeken hebben?', ans:'j', why:'Ja, bijvoorbeeld 60°, 60° en 60°, of 50°, 60° en 70°.'},
      {html:'In een rechthoekige driehoek zijn de twee andere hoeken samen …', opts:[['90','90°'],['180','180°'],['45','45°']], ans:'90', why:'180° − 90° = 90°: de twee scherpe hoeken zijn complementair.'},
      {html:'Elke hoek van een gelijkzijdige driehoek is …', opts:[['60','60°'],['90','90°'],['45','45°']], ans:'60', why:'De drie hoeken zijn even groot: 180° : 3 = 60°.'},
      {html:'Kan een driehoek hoeken van 50°, 60° en 80° hebben?', ans:'n', why:'50° + 60° + 80° = 190°, niet 180°.'},
      {html:'De tophoek van een gelijkbenige driehoek is 40°. Elke basishoek is dan …', opts:[['70','70°'],['140','140°'],['40','40°']], ans:'70', why:'(180° − 40°) : 2 = 70°.'}
    ];
    R.shuffle(Q).slice(0,5).forEach((q,i)=> qChoice(b, st, save, 'k'+i, {nr:LET[i]+')', html:q.html, opts:q.opts||[['j','ja'],['n','nee']], ans:q.ans, why:q.why}));
  }};
/* ---------- met een letter (D38) ---------- */
DR.alg = { title:'Hoeken met een letter', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const sets = [
      ()=>{ const x = R.pick([20, 30, 36]); const k = [1,2,180/x-3]; return {e:['x', '2x', (180/x-3)+'x'], x, v:[x, 2*x, (180/x-3)*x]}; },
      ()=>{ const x = R.int(30, 50); const c = R.int(5, 20); const r = 180 - x - (x+c); if(r<=10) return null; return {e:['x', `x + ${c}°`, `${r}°`], x, v:[x, x+c, r]}; },
      ()=>{ const x = R.int(25, 40); const c = R.int(5, 15); const r = 180 - x - (2*x - c); if(r<=10) return null; return {e:['x', `2x − ${c}°`, `${r}°`], x, v:[x, 2*x-c, r]}; },
      ()=>{ const x = R.int(20, 32); const c = R.int(10, 20); const r = 180 - 2*x - (3*x - c); if(r<=10) return null; return {e:['2x', `3x − ${c}°`, `${r}°`], x, v:[2*x, 3*x-c, r]}; }
    ];
    let n = 0; for(const g of R.shuffle(sets)){ if(n>=2) break; const d = g(); if(!d || d.v.some(v=>v<12 || v>150)) continue;
      const T = triPts(d.v[0], d.v[1], {W:320, H:200, pad:36});
      b.append(el('div','', hfWrap(320, 200, triSvg(T, {mk:{A:{txt:d.e[0], fill:'or'}, B:{txt:d.e[1], fill:'tq'}, C:{txt:d.e[2], fill:'vi'}}}), {maxw:400})));
      degQ(b, st, save, 'x'+n, `<span class="q-num">${LET[n]})</span> Bereken x. x = [[0]]`, d.x, {hint:'Stel de som van de drie hoeken gelijk aan 180° en los op naar x.', sol:`${d.e.join(' + ')} = 180° → x = ${d.x}°. Controle: ${d.v.join('° + ')}° = 180°.`});
      n++; }
  }};

/* ---------- verdieping: een andere hulplijn ---------- */
DR.ander = { title:'Bewijs met een hulplijn door een ander punt', lvl:3,
  build(b, st, save){
    const T = triPts(58, 52, {W:340, H:220, pad:40}); const dp = dirAng(T.B, T.C);
    let s = lnSvg(polar(T.A, 150, dp+180), polar(T.A, 150, dp), 'ln help') + tx(polar(T.A, 120, dp).x+8, polar(T.A, 120, dp).y+12, 'q', 'nm');
    const s1 = angDirs(dirAng(T.A, T.B), dp+180), s3 = angDirs(dp, dirAng(T.A, T.C));
    s += triSvg(T, {mk:{A:{num:2, r:22}}});
    s += angSvg(T.A, s1[0], s1[1], {r:22, num:1}) + angSvg(T.A, s3[0], s3[1], {r:22, num:3});
    b.append(el('div','', hfWrap(340, 220, s, {maxw:440})));
    b.append(el('p','instructions', 'Hier gaat de hulplijn q door A, evenwijdig met BC. Zet het bewijs in de juiste volgorde.'));
    orderEx(b, st, save, 'o', {lines:[
      `Teken door A de rechte q // BC.`,
      `${hA('A',1)} = ${hA('B')} &nbsp;(verwisselende binnenhoeken, q // BC, snijlijn AB)`,
      `${hA('A',3)} = ${hA('C')} &nbsp;(verwisselende binnenhoeken, q // BC, snijlijn AC)`,
      `${hA('A',1)} + ${hA('A',2)} + ${hA('A',3)} = 180° &nbsp;(gestrekte hoek)`,
      `${hA('A')} + ${hA('B')} + ${hA('C')} = 180°`], alt:[[0,2,1,3,4]]});
  }};
/* ---------- verdieping: de hoek tussen twee bissectrices ---------- */
DR.biss = { title:'De hoek tussen twee bissectrices', lvl:3,
  build(b, st, save){ const R = makeR(st);
    const g = R.pick([40, 50, 60, 70, 80]); const al = R.int(45, 80); const be = 180 - g - al; if(be < 20){ /* zelden */ }
    const T = triPts(al, be, {W:340, H:220, pad:40}); const I = (()=>{ const a = dist(T.B,T.C), bb = dist(T.A,T.C), c = dist(T.A,T.B); const s = a+bb+c; return P((a*T.A.x+bb*T.B.x+c*T.C.x)/s, (a*T.A.y+bb*T.B.y+c*T.C.y)/s); })();
    let s = triSvg(T, {mk:{C:{txt:g+'°', fill:'vi'}}});
    s += lnSvg(T.A, I, 'ln help') + lnSvg(T.B, I, 'ln help') + ptSvg(I, 'S', {lp:polar(I, 13, 90)});
    const [a0,a1] = angAt(I, T.A, T.B); s += angSvg(I, a0, a1, {r:16, fillCls:'tq', txt:'?', tr:28});
    b.append(el('div','', hfWrap(340, 220, s, {maxw:440})));
    b.append(el('p','instructions', `De bissectrices van ${hA('A')} en ${hA('B')} snijden elkaar in S. ${hA('C')} = ${g}°. Bereken ${hA('S')} in ΔABS.`));
    degQ(b, st, save, 'a', `${hA('S')} = [[0]]`, 90 + g/2, {hint:`${hA('A')} + ${hA('B')} = 180° − ${g}°. In ΔABS heb je telkens de helft van ${hA('A')} en ${hA('B')}.`,
      sol:`${hA('A')} + ${hA('B')} = 180° − ${g}° = ${180-g}°. De helften samen: ${(180-g)/2}°. In ΔABS: ${hA('S')} = 180° − ${(180-g)/2}° = ${90+g/2}°.`});
  }};

SEC.drie = { id:'drie', ic:'h_drie', nav:'Som van de hoeken van een driehoek', title:'De som van de hoeken van een driehoek',
  tip:'De som van de hoeken van een driehoek is <b>180°</b>. Het <b>bewijs</b> met de evenwijdige door een hoekpunt moet je volledig kunnen opschrijven.',
  cheat:`<h3>Spiekbriefje · som van de hoeken</h3><p>In elke driehoek: ${hA('A')} + ${hA('B')} + ${hA('C')} = 180°.</p><p><b>Bewijs</b>: teken door C de rechte p // AB.<br>${hA('C',1)} = ${hA('A')} (verwisselende binnenhoeken)<br>${hA('C',3)} = ${hA('B')} (verwisselende binnenhoeken)<br>${hA('C',1)} + ${hA('C',2)} + ${hA('C',3)} = 180° (gestrekte hoek)<br>⇓<br>${hA('A')} + ${hA('B')} + ${hA('C')} = 180°</p>`,
  cards:[DR.scheur, DR.dyn, DR.anim, DR.model, DR.volg, DR.reken, DR.reden, DR.soort, DR.gaten, DR.alg, DR.schrijf, DR.blind, DR.papier, DR.ander, DR.biss] };

(function(){ const css = `
  .bm{border:2px solid var(--accent); border-radius:12px; padding:.5rem .8rem; background:var(--card); line-height:1.5}
  .bm-row{display:flex; flex-wrap:wrap; gap:.2rem .6rem; padding:.18rem .2rem; border-radius:6px}
  .bm-r{color:var(--accent-dark); font-size:.93rem}
  .bm-end{font-weight:700}
  .bm.cover .bm-row{cursor:pointer; background:var(--accent-soft); color:transparent; user-select:none; margin:.15rem 0}
  .bm.cover .bm-row *{color:transparent !important}
  .bm.cover .bm-row.open{background:transparent; color:inherit}
  .bm.cover .bm-row.open *{color:inherit !important} .bm.cover .bm-row.open .bm-r{color:var(--accent-dark) !important}
  .tip-box{margin:.6rem 0; padding:.5rem .8rem; border-radius:10px; background:var(--or-soft)}
  .pap-cnt{font-size:1.08rem; margin:.3rem 0 .6rem}
  .pap-model summary{cursor:pointer; font-weight:700; color:var(--accent-dark); margin:.4rem 0}
  .pap-list{display:flex; flex-direction:column; gap:.3rem; margin:.3rem 0 .6rem}
  .pap-item{display:flex; gap:.5rem; align-items:flex-start; cursor:pointer}
  .pap-item input{width:1.15rem; height:1.15rem; margin-top:.15rem; accent-color:var(--accent)}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
/* ============================================================
   HOEKEN IN DRIEHOEKEN EN VIERHOEKEN (D40 tot D44)
   ============================================================ */
/* punten in wiskundige coördinaten (y omhoog) passend maken in W x H */
function fitPts(pts, W, H, pad=34){
  const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y); const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
  const sc = Math.min((W-2*pad)/(mxx-mnx||1), (H-2*pad)/(mxy-mny||1)); const ox = (W-(mxx-mnx)*sc)/2, oy = (H-(mxy-mny)*sc)/2;
  return pts.map(p=>P(ox+(p.x-mnx)*sc, H-oy-(p.y-mny)*sc)); }
/* veelhoek tekenen; mk per index: {fill, txt, num, right} */
function polySvg(pts, o={}){
  const n = pts.length; const G = P(pts.reduce((s,p)=>s+p.x,0)/n, pts.reduce((s,p)=>s+p.y,0)/n);
  const pl = pts.map(p=>fx(p.x)+','+fx(p.y)).join(' ');
  let s = `<polygon class="tri" points="${pl}"/>`;
  (o.diag||[]).forEach(([i,j])=> s += lnSvg(pts[i], pts[j], 'ln help'));
  (o.mk||[]).forEach((m,i)=>{ if(!m) return; const [a0,a1] = angAt(pts[i], pts[(i+n-1)%n], pts[(i+1)%n]); s += angSvg(pts[i], a0, a1, {r:m.r||20, fillCls:m.fill, txt:m.txt, num:m.num, right:m.right, tr:m.tr}); });
  s += `<polygon class="poly" points="${pl}"/>`;
  (o.ticks||[]).forEach(([i,j,c])=> s += tickSvg(pts[i], pts[j], c||1));
  if(o.names) pts.forEach((p,i)=>{ s += ptSvg(p, o.names[i], {lp:polar(p, 14, dirAng(G,p))}); });
  return s; }
/* vierhoek met gegeven hoeken bij A, B, C (D volgt) */
function quadPts(a, b, c, ab=1, bc=0.8){
  const A = P(0,0), B = P(ab,0); const dBC = 180 - b; const C = polar0(B, bc, dBC);
  const dCD = dBC + 180 - c; /* vanuit C: draai CB over c in wijzerzin */
  const X = lineInter(A, polar0(A, 1, a), C, polar0(C, 1, dCD)); if(!X || X.t<=0 || X.u<=0) return null;
  const Q = [A, B, C, P(X.x, X.y)]; const L = Q.map((p,i)=>dist(p, Q[(i+1)%4])); if(Math.min(...L) < 0.3*Math.max(...L)) return null;
  return Q; }
const polar0 = (c, r, a) => P(c.x + r*Math.cos(a*D2R), c.y + r*Math.sin(a*D2R));
const VR = {};

/* ---------- buitenhoek van een driehoek ---------- */
VR.buiten = { title:'De buitenhoek van een driehoek', lvl:1, noReset:true,
  instr:'Verleng de zijde [AB] voorbij B. De hoek tussen het verlengde en [BC] is een <b>buitenhoek</b>. Versleep C en vergelijk.',
  build(b){
    const S = {C:P(150,55)}; const A = P(40,175), B = P(220,175), D = P(320,175);
    dynAng(b, {W:340, H:210, st:S, maxw:460, alt:'driehoek met een buitenhoek bij B',
      handles:S=>[{k:'C', x:S.C.x, y:S.C.y, r:9}],
      drag:(k,p,S)=>{ S.C = P(clamp(p.x, 20, 300), clamp(p.y, 25, 150)); },
      draw:S=>{ const v = triRound({A, B, C:S.C}); const ext = 180 - v.B;
        const T = {A, B, C:S.C}; let s = lnSvg(B, D, 'ln help') + ptSvg(D, 'D', {lp:polar(D, 13, 90)});
        s += triSvg(T, {mk:{A:{fill:'or', txt:v.A+'°', r:22}, B:{txt:v.B+'°', r:18}, C:{fill:'tq', txt:v.C+'°', r:22}}});
        s += angSvg(B, 0, dirAng(B, S.C), {r:30, fillCls:'vi', txt:ext+'°', tr:46});
        return s; },
      info:S=>{ const v = triRound({A, B, C:S.C}); return `Buitenhoek bij B: <b>${180-v.B}°</b> &nbsp;=&nbsp; <span class="zw or"></span>${v.A}° + <span class="zw tq"></span>${v.C}°`; }});
    b.append(el('div','eig', `<span class="lbl-def">eigenschap</span>Een <b>buitenhoek</b> van een driehoek is gelijk aan de <b>som van de twee niet-aanliggende binnenhoeken</b>.<br>Waarom? De buitenhoek en ${hA('B')} zijn nevenhoeken: samen 180°. En ${hA('A')} + ${hA('C')} = 180° − ${hA('B')}.`));
  }};
VR.buitenReken = { title:'Rekenen met een buitenhoek', lvl:1,
  build(b, st, save){ const R = makeR(st);
    for(let i=0;i<3;i++){ const al = R.int(35, 75), ga = R.int(30, 70); const be = 180-al-ga; const ext = al+ga;
      const T = triPts(al, be, {W:320, H:190, pad:34}); const D = polar(T.B, 80, dirAng(T.A, T.B));
      const kind = i % 3; /* 0: buitenhoek gevraagd, 1: binnenhoek A gevraagd, 2: hoek B gevraagd */
      let s = lnSvg(T.B, D, 'ln help');
      const mk = {A:{txt: kind===1 ? '?' : al+'°', fill: kind===1 ? 'tq' : null}, C:{txt:ga+'°'}, B: kind===2 ? {txt:'?', fill:'tq'} : null};
      s += triSvg(T, {mk}); s += angSvg(T.B, dirAng(T.A,T.B), dirAng(T.B, T.C), {r:26, fillCls: kind===0 ? 'tq' : 'vi', txt: kind===0 ? '?' : ext+'°', tr:42});
      b.append(el('div','', hfWrap(320, 190, s, {maxw:380})));
      const ans = kind===0 ? ext : kind===1 ? al : be;
      degQ(b, st, save, 'r'+i, `<span class="q-num">${LET[i]})</span> ? = [[0]]`, ans, {hint:'Buitenhoek = som van de twee niet-aanliggende binnenhoeken. De buitenhoek en de binnenhoek bij hetzelfde hoekpunt zijn samen 180°.',
        sol: kind===0 ? `${al}° + ${ga}° = ${ext}°` : kind===1 ? `${ext}° − ${ga}° = ${al}°` : `180° − ${ext}° = ${be}° (nevenhoeken)`});
    }
  }};
/* ---------- gelijkbenig en gelijkzijdig ---------- */
VR.gelijk = { title:'Gelijkbenige en gelijkzijdige driehoeken', lvl:1,
  build(b, st, save){ const R = makeR(st);
    const tasks = [
      ()=>{ const top = R.pick([30, 36, 40, 44, 50, 70, 80, 100, 110, 120]); const base = (180-top)/2; return {al:base, be:base, mk:{C:{txt:top+'°'}, A:{txt:'?', fill:'tq'}}, ticks:[['A','C',1],['B','C',1]], ans:base, q:'basishoek', sol:`(180° − ${top}°) : 2 = ${base}°`}; },
      ()=>{ const base = R.int(25, 75); return {al:base, be:base, mk:{A:{txt:base+'°'}, C:{txt:'?', fill:'tq'}}, ticks:[['A','C',1],['B','C',1]], ans:180-2*base, q:'tophoek', sol:`180° − 2 · ${base}° = ${180-2*base}°`}; },
      ()=>({al:60, be:60, mk:{B:{txt:'?', fill:'tq'}}, ticks:[['A','C',1],['B','C',1],['A','B',1]], ans:60, q:'hoek', sol:'In een gelijkzijdige driehoek zijn alle hoeken even groot: 180° : 3 = 60°.'}),
      ()=>({al:45, be:90, mk:{B:{right:true}, A:{txt:'?', fill:'tq'}}, ticks:[['A','B',1],['B','C',1]], ans:45, q:'hoek', sol:'Gelijkbenig en rechthoekig: (180° − 90°) : 2 = 45°.'})
    ];
    R.shuffle(tasks).slice(0,3).forEach((f,i)=>{ const d = f(); const T = triPts(d.al, d.be, {W:300, H:190, pad:34});
      b.append(el('div','', hfWrap(300, 190, triSvg(T, {mk:d.mk, ticks:d.ticks}), {maxw:360})));
      degQ(b, st, save, 'g'+i, `<span class="q-num">${LET[i]})</span> ? = [[0]]`, d.ans, {hint:'Gelijke zijden ⟹ gelijke hoeken ertegenover. De som is 180°.', sol:d.sol}); });
  }};
/* ---------- driehoek en evenwijdige samen ---------- */
VR.combi = { title:'Driehoek en evenwijdige samen', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const al = R.int(45, 72), be = R.int(40, 68); const T = triPts(al, be, {W:340, H:220, pad:36});
    const t = R.pick([0.45, 0.55]); const D = lerp(T.C, T.A, t), E = lerp(T.C, T.B, t);
    let s = triSvg(T, {mk:{A:{txt:al+'°', fill:'or'}, C:{txt:'', r:16}}});
    s += lnSvg(polar(D, 30, dirAng(E,D)), polar(E, 30, dirAng(D,E)), 'ln');
    s += ptSvg(D, 'D', {lp:polar(D, 13, dirAng(E,D)+30)}) + ptSvg(E, 'E', {lp:polar(E, 13, dirAng(D,E)-30)});
    const [e0,e1] = angAt(E, T.B, D); s += angSvg(E, e0, e1, {r:18, fillCls:'tq', txt:'β', tr:30});
    const [d0,d1] = angAt(D, T.C, E); s += angSvg(D, d0, d1, {r:18, fillCls:'vi', txt:'α', tr:30});
    const [b0,b1] = angAt(T.B, T.A, T.C); s += angSvg(T.B, b0, b1, {r:22, txt:be+'°'});
    b.append(el('div','', hfWrap(340, 220, s, {maxw:440})));
    b.append(el('p','instructions', `DE // AB. Bereken α, β en ${hA('C')}.`));
    degRedQ(b, st, save, 'a', `<span class="q-num">a)</span> α = [[0]] want {R}`, al, ['ov'], {sol:`DE // AB en AC is een snijlijn: α en ${hA('A')} zijn overeenkomstige hoeken. α = ${al}°.`});
    degRedQ(b, st, save, 'b', `<span class="q-num">b)</span> β = [[0]] want {R}`, 180-be, ['bz'], {sol:`DE // AB en BC is een snijlijn: β en ${hA('B')} zijn binnenhoeken aan dezelfde kant. β = 180° − ${be}° = ${180-be}°.`});
    degQ(b, st, save, 'c', `<span class="q-num">c)</span> ${hA('C')} = [[0]]`, 180-al-be, {hint:'Som van de hoeken van een driehoek.', sol:`${hA('C')} = 180° − ${al}° − ${be}° = ${180-al-be}°.`});
  }};

/* ---------- vierhoek: som 360° ---------- */
VR.vierDemo = { title:'De som van de hoeken van een vierhoek', lvl:1, noReset:true,
  instr:'Een diagonaal verdeelt de vierhoek in twee driehoeken.',
  build(b){
    const Q = fitPts(quadPts(75, 105, 80, 1, 0.75), 340, 220, 38); const nm = ['A','B','C','D'];
    const base = (mk, diag) => polySvg(Q, {names:nm, mk, diag});
    const mkAll = [{fill:'or', r:22},{fill:'tq', r:22},{fill:'vi', r:22},{fill:'ro', r:22}];
    stepAnim(b, {W:340, H:220, maxw:460, keepCaps:true, alt:'vierhoek ABCD met diagonaal AC',
      steps:[
        {cap:'Vierhoek ABCD met vier hoeken.', draw:()=> base(mkAll)},
        {cap:'Teken de diagonaal [AC]. Je krijgt twee driehoeken: ΔABC en ΔACD.', ms:1000, draw:t=> base(mkAll) + lnSvg(Q[0], lerp(Q[0], Q[2], t), 'ln help')},
        {cap:'In elke driehoek is de som van de hoeken 180°.', draw:()=> `<polygon points="${[Q[0],Q[1],Q[2]].map(p=>fx(p.x)+','+fx(p.y)).join(' ')}" fill="var(--orange)" opacity=".18"/><polygon points="${[Q[0],Q[2],Q[3]].map(p=>fx(p.x)+','+fx(p.y)).join(' ')}" fill="var(--accent)" opacity=".18"/>` + base(mkAll, [[0,2]]) + tx((Q[0].x+Q[1].x+Q[2].x)/3, (Q[0].y+Q[1].y+Q[2].y)/3, '180°', 'val big') + tx((Q[0].x+Q[2].x+Q[3].x)/3, (Q[0].y+Q[2].y+Q[3].y)/3, '180°', 'val big')},
        {cap:`Samen: ${hA('A')} + ${hA('B')} + ${hA('C')} + ${hA('D')} = 180° + 180° = <b>360°</b>.`, draw:()=> base(mkAll, [[0,2]])}
      ]});
    b.append(el('div','eig', `<span class="lbl-def">eigenschap</span>De som van de hoeken van een vierhoek is <b>360°</b>.`));
  }};
VR.vierBewijs = { title:'Zet het bewijs voor de vierhoek in volgorde', lvl:2,
  build(b, st, save){
    const Q = fitPts(quadPts(80, 100, 75, 1, 0.8), 340, 210, 38);
    const sec = (V, X, Y) => angAt(V, X, Y);
    let s = polySvg(Q, {names:['A','B','C','D'], diag:[[0,2]], mk:[null,{num:'', r:16},null,{r:16}]});
    const [a0,a1] = sec(Q[0], Q[1], Q[2]), [c0,c1] = sec(Q[0], Q[2], Q[3]), [e0,e1] = sec(Q[2], Q[3], Q[0]), [f0,f1] = sec(Q[2], Q[0], Q[1]);
    s += angSvg(Q[0], a0, a1, {r:22, num:1}) + angSvg(Q[0], c0, c1, {r:26, num:2}) + angSvg(Q[2], e0, e1, {r:22, num:2}) + angSvg(Q[2], f0, f1, {r:26, num:1});
    b.append(el('div','', hfWrap(340, 210, s, {maxw:440})));
    orderEx(b, st, save, 'o', {html:`<b>Gegeven:</b> vierhoek ABCD. <b>Te bewijzen:</b> ${hA('A')} + ${hA('B')} + ${hA('C')} + ${hA('D')} = 360°.`, lines:[
      `Teken de diagonaal [AC].`,
      `In ΔABC: ${hA('A',1)} + ${hA('B')} + ${hA('C',1)} = 180° &nbsp;(som van de hoeken van een driehoek)`,
      `In ΔACD: ${hA('A',2)} + ${hA('C',2)} + ${hA('D')} = 180° &nbsp;(som van de hoeken van een driehoek)`,
      `Optellen: ${hA('A',1)} + ${hA('A',2)} + ${hA('B')} + ${hA('C',1)} + ${hA('C',2)} + ${hA('D')} = 360°`,
      `⇓ &nbsp;${hA('A',1)} + ${hA('A',2)} = ${hA('A')} en ${hA('C',1)} + ${hA('C',2)} = ${hA('C')}`,
      `${hA('A')} + ${hA('B')} + ${hA('C')} + ${hA('D')} = 360°`], alt:[[0,2,1,3,4,5]]});
  }};
VR.vierReken = { title:'Bereken de vierde hoek', lvl:1,
  build(b, st, save){ const R = makeR(st); const grid = el('div','hf-two'); b.append(grid);
    let i = 0, tries = 0;
    while(i<4 && tries++<60){ let a = R.int(60, 120), bb = R.int(60, 125), c = R.int(55, 125); if(i===1){ a = 90; bb = 90; } if(i===3){ c = 180 - bb; }
      const d = 360-a-bb-c; if(d<45 || d>150) continue; const q = quadPts(a, bb, c, 1, R.pick([0.7, 0.85, 1])); if(!q) continue;
      const pts = fitPts(q, 300, 190, 34); const nm = R.pick([['A','B','C','D'],['K','L','M','N'],['P','Q','R','S']]); const ask = i===1 ? 2 : R.int(0,3);
      const v = [a, bb, c, d]; const mk = v.map((x,k)=> k===ask ? {txt:'?', fill:'tq'} : x===90 ? {right:true} : {txt:x+'°'});
      const cell = el('div'); grid.append(cell); cell.append(el('div','', hfWrap(300, 190, polySvg(pts, {names:nm, mk}), {maxw:340})));
      degQ(cell, st, save, 'v'+i, `<span class="q-num">${LET[i]})</span> ${hA(nm[ask])} = [[0]]`, v[ask], {hint:'De vier hoeken van een vierhoek zijn samen 360°.', sol:`360° − ${v.filter((_,k)=>k!==ask).join('° − ')}° = ${v[ask]}°`});
      i++; }
  }};
VR.vierAlg = { title:'Vierhoek met een letter', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const sets = [
      ()=>{ const x = 36; return {e:['x','2x','3x','4x'], v:[x,2*x,3*x,4*x], x}; },
      ()=>{ const x = R.int(50, 70); const c = R.int(10, 25); const d = 360 - x - (x+c) - 2*x; return {e:['x', `x + ${c}°`, '2x', `${d}°`], v:[x, x+c, 2*x, d], x}; },
      ()=>{ const x = R.int(35, 50); const c = R.int(10, 20); const d = 360 - 2*x - (3*x - c) - 90; return {e:['2x', `3x − ${c}°`, '90°', `${d}°`], v:[2*x, 3*x-c, 90, d], x}; }
    ];
    let n = 0, tries = 0; const order = R.shuffle([0,1,2]); while(n<2 && tries++<80){ const d = sets[order[(n + (tries>40?1:0))%3]](); if(d.v.some(v=>v<40 || v>160)) continue; const q = quadPts(d.v[0], d.v[1], d.v[2], 1, R.pick([0.7,0.85,1])); if(!q) continue;
      const pts = fitPts(q, 320, 200, 36); const mk = d.v.map((v,k)=> v===90 && d.e[k]==='90°' ? {right:true} : {txt:d.e[k], fill:['or','tq','vi','ro'][k]});
      b.append(el('div','', hfWrap(320, 200, polySvg(pts, {names:['A','B','C','D'], mk}), {maxw:400})));
      degQ(b, st, save, 'x'+n, `<span class="q-num">${LET[n]})</span> Bereken x. x = [[0]]`, d.x, {hint:'Stel de som van de vier hoeken gelijk aan 360°.', sol:`${d.e.join(' + ')} = 360° → x = ${d.x}°. Controle: ${d.v.join('° + ')}° = 360°.`}); n++; }
  }};
/* ---------- parallellogram en trapezium ---------- */
VR.parTrap = { title:'Hoeken in een parallellogram en een trapezium', lvl:2,
  build(b, st, save){ const R = makeR(st);
    const a = R.int(55, 80); const q = quadPts(a, 180-a, a, 1, 0.75); const pts = fitPts(q, 320, 190, 34);
    b.append(el('div','', hfWrap(320, 190, polySvg(pts, {names:['A','B','C','D'], mk:[{txt:a+'°', fill:'or'},{txt:'?', fill:'tq'},null,null]}), {maxw:400})));
    b.append(el('p','instructions', 'ABCD is een parallellogram.'));
    degRedQ(b, st, save, 'p1', `<span class="q-num">a)</span> ${hA('B')} = [[0]] want {R}`, 180-a, ['bz'], {sol:`AD // BC, AB is een snijlijn: ${hA('A')} en ${hA('B')} zijn binnenhoeken aan dezelfde kant: ${hA('B')} = 180° − ${a}° = ${180-a}°.`});
    qBlock(b, st, save, 'p2', {html:`<span class="q-num">b)</span> ${hA('C')} = [[0]] &nbsp; ${hA('D')} = [[1]]`, block:true, mode:'decimal', size:'sm', check:chkDegs([a, 180-a]), sol:`${hA('C')} = ${a}° en ${hA('D')} = ${180-a}°: overstaande hoeken van een parallellogram zijn even groot.`});
    const t1 = R.int(55, 80), t2 = R.int(60, 85); const qt = quadPts(t1, t2, 180-t2, 1, 0.55); if(qt){ const pt = fitPts(qt, 320, 170, 30);
      b.append(el('div','', hfWrap(320, 170, polySvg(pt, {names:['A','B','C','D'], mk:[{txt:t1+'°'},{txt:t2+'°'},{txt:'?', fill:'tq'},{txt:'?', fill:'vi'}]}), {maxw:400})));
      b.append(el('p','instructions', 'ABCD is een trapezium met AB // DC.'));
      qBlock(b, st, save, 't', {html:`<span class="q-num">c)</span> ${hA('C')} = [[0]] &nbsp; ${hA('D')} = [[1]]`, block:true, mode:'decimal', size:'sm', check:chkDegs([180-t2, 180-t1]),
        sol:`AB // DC: ${hA('B')} en ${hA('C')} zijn binnenhoeken aan dezelfde kant van BC, dus ${hA('C')} = 180° − ${t2}° = ${180-t2}°. Zo ook ${hA('D')} = 180° − ${t1}° = ${180-t1}°.`}); }
  }};

/* ---------- verdieping: veelhoeken ---------- */
VR.veelhoek = { title:'De som van de hoeken van een veelhoek', lvl:3, noReset:true,
  instr:'Kies het aantal hoekpunten. Vanuit één hoekpunt trek je alle diagonalen: zo verdeel je de veelhoek in driehoeken.',
  build(b){
    const S = {n:5}; const box = el('div'); const info = el('div','dyn-info');
    const ctl = el('div','dyn-ctl'); const minus = ctlBtn('− 1 hoekpunt', ()=>{ if(S.n>3){ S.n--; draw(); } }), plus = ctlBtn('+ 1 hoekpunt', ()=>{ if(S.n<10){ S.n++; draw(); } });
    ctl.append(minus, plus); b.append(box, info, ctl);
    function draw(){ const n = S.n; const pts = []; for(let i=0;i<n;i++){ const a = -90 - 180/n + i*360/n; pts.push(P(170 + 92*Math.cos(a*D2R) * (1 + (i%2)*0.06), 115 - 92*Math.sin(a*D2R))); }
      const nm = 'ABCDEFGHIJ'.split('').slice(0,n); let s = '';
      const cols = ['var(--orange)','var(--accent)','#b9a0e6','#f08a7e'];
      for(let k=1;k<n-1;k++) s += `<polygon points="${[pts[0],pts[k],pts[k+1]].map(p=>fx(p.x)+','+fx(p.y)).join(' ')}" fill="${cols[k%4]}" opacity=".2"/>`;
      const diag = []; for(let k=2;k<n-1;k++) diag.push([0,k]);
      s += polySvg(pts, {names:nm, diag});
      box.innerHTML = hfWrap(340, 230, s, {maxw:440});
      info.innerHTML = `${n} hoekpunten → <b>${n-2} driehoeken</b> → som van de hoeken = (${n} − 2) · 180° = <b>${(n-2)*180}°</b>` + (n>3 ? `<br>Regelmatige ${n}-hoek: elke hoek is ${(n-2)*180}° : ${n} = <b>${fmtN((n-2)*180/n, 2)}°</b>` : ''); }
    draw();
    b.append(el('div','eig', `<span class="lbl-def">eigenschap</span>De som van de hoeken van een veelhoek met n hoekpunten is <b>(n − 2) · 180°</b>.`));
  }};
VR.veelReken = { title:'Rekenen met veelhoeken', lvl:3,
  build(b, st, save){ const R = makeR(st);
    const n1 = R.pick([5,6,7,8]); degQ(b, st, save, 'a', `<span class="q-num">a)</span> De som van de hoeken van een ${n1}-hoek is [[0]]`, (n1-2)*180, {sol:`(${n1} − 2) · 180° = ${(n1-2)*180}°`});
    const n2 = R.pick([5,6,8,9,10,12]); degQ(b, st, save, 'b', `<span class="q-num">b)</span> Elke hoek van een regelmatige ${n2}-hoek is [[0]]`, (n2-2)*180/n2, {sol:`(${n2} − 2) · 180° : ${n2} = ${fmtN((n2-2)*180/n2, 2)}°`});
    const v = [R.int(95, 125), R.int(95, 125), R.int(100, 130), R.int(90, 120)]; const e = 540 - v.reduce((s,x)=>s+x,0);
    degQ(b, st, save, 'c', `<span class="q-num">c)</span> Een vijfhoek heeft hoeken van ${v.join('°, ')}°. De vijfde hoek is [[0]]`, e, {hint:'Een vijfhoek: (5 − 2) · 180° = 540°.', sol:`540° − ${v.join('° − ')}° = ${e}°`});
    const s3 = R.pick([1080, 1440, 1260, 900]); degQ(b, st, save, 'd', `<span class="q-num">d)</span> De som van de hoeken van een veelhoek is ${s3}°. Hoeveel hoekpunten heeft hij? [[0]]`, s3/180+2, {hint:'Deel door 180° en tel er 2 bij.', sol:`${s3}° : 180° = ${s3/180} driehoeken, dus ${s3/180+2} hoekpunten.`});
  }};

SEC.vier = { id:'vier', ic:'h_vier', nav:'Hoeken in driehoeken en vierhoeken', title:'Hoeken in driehoeken en vierhoeken',
  tip:'Driehoek: samen <b>180°</b>. Vierhoek: samen <b>360°</b> (twee driehoeken). Een <b>buitenhoek</b> is gelijk aan de som van de twee niet-aanliggende binnenhoeken.',
  cheat:`<h3>Spiekbriefje · driehoeken en vierhoeken</h3><table><tr><td>driehoek</td><td>som van de hoeken = 180°</td></tr><tr><td>gelijkzijdige driehoek</td><td>elke hoek 60°</td></tr><tr><td>gelijkbenige driehoek</td><td>basishoeken even groot</td></tr><tr><td>rechthoekige driehoek</td><td>scherpe hoeken samen 90°</td></tr><tr><td>buitenhoek</td><td>= som van de twee niet-aanliggende binnenhoeken</td></tr><tr><td>vierhoek</td><td>som van de hoeken = 360°</td></tr><tr><td>veelhoek (n hoekpunten)</td><td>(n − 2) · 180°</td></tr></table>`,
  cards:[VR.buiten, VR.buitenReken, VR.gelijk, VR.combi, VR.vierDemo, VR.vierReken, VR.vierBewijs, VR.vierAlg, VR.parTrap, VR.veelhoek, VR.veelReken] };
/* ============================================================
   FOUTENJAGER, SNELLE QUIZ EN PROEFTOETSEN
   ============================================================ */
const FJ = {};
const degFix = t => v => { const x = parseDeg(v[0]); const ok = !isNaN(x) && Math.abs(x-t)<0.02; return {ok, msg: ok ? '' : 'Reken nog eens na.'}; };
FJ.drie = { title:'De som van de hoeken in een driehoek', lvl:1,
  build(b, st, save){ const R = makeR(st); const a = R.int(35, 70), c = R.int(40, 75);
    errBlock(b, st, save, 'e', {nr:'a)', task:`In ΔABC is ${hA('A')} = ${a}° en ${hA('B')} = ${c}°. Bereken ${hA('C')}.`,
      lines:[`${hA('A')} + ${hA('B')} + ${hA('C')} = 360°`, `${a}° + ${c}° + ${hA('C')} = 360°`, `${hA('C')} = ${360-a-c}°`], wrong:0, cons:[1,2],
      why:'De som van de hoeken van een <b>driehoek</b> is 180°. 360° is de som voor een vierhoek.',
      fix:`${hA('C')} = [[0]]`, fixCheck:degFix(180-a-c), fixSol:`${hA('C')} = 180° − ${a}° − ${c}° = ${180-a-c}°`, mode:'decimal'});
  }};
FJ.supp = { title:'Binnenhoeken aan dezelfde kant', lvl:1,
  build(b, st, save){ const R = makeR(st); const x = R.int(58, 82); const m = psWithAngle(R, 180-x, {});
    b.append(el('div','', psFig(m, {vals:{A3:x+'°', B2:'?'}, fill:{A3:'or', B2:'tq'}, arcs:['A3','B2'], nums:false, maxw:380})));
    errBlock(b, st, save, 'e', {nr:'b)', task:`a // b. Bereken ${hA('B',2)}.`,
      lines:[`${hA('A',3)} en ${hA('B',2)} zijn binnenhoeken aan dezelfde kant van de snijlijn.`, `Dus ${hA('A',3)} = ${hA('B',2)}.`, `${hA('B',2)} = ${x}°`], wrong:1, cons:[2],
      why:'Binnenhoeken aan dezelfde kant van de snijlijn zijn <b>supplementair</b>, niet even groot.',
      fix:`${hA('B',2)} = [[0]]`, fixCheck:degFix(180-x), fixSol:`${hA('B',2)} = 180° − ${x}° = ${180-x}°`, mode:'decimal'});
  }};
FJ.omg = { title:'Evenwijdig of niet?', lvl:2,
  build(b, st, save){ const R = makeR(st); const x = R.int(55, 80);
    errBlock(b, st, save, 'e', {nr:'c)', task:`De snijlijn s snijdt a in A en b in B. ${hA('A',1)} = ${x}° en ${hA('B',1)} = ${x}°. Wat besluit je?`,
      lines:[`${hA('A',1)} en ${hA('B',1)} zijn overeenkomstige hoeken.`, `Ze zijn even groot.`, `Dus snijden a en b elkaar.`], wrong:2,
      why:'Als twee overeenkomstige hoeken even groot zijn, dan zijn de rechten <b>evenwijdig</b> (omgekeerde eigenschap).',
      fix:'Dus zijn a en b [[0]]', fixCheck:v=>{ const ok = /evenwijdig|\/\/|∥/.test(v[0].toLowerCase()); return {ok, msg: ok ? '' : 'Welk woord hoort hier?'}; }, fixSol:'Dus zijn a en b evenwijdig: a // b.'});
  }};
FJ.vier = { title:'De vierde hoek', lvl:1,
  build(b, st, save){ const R = makeR(st); const v = [R.int(80, 95), R.int(95, 115), R.int(100, 120)]; const s = v[0]+v[1]+v[2]; const err = s - 10;
    errBlock(b, st, save, 'e', {nr:'d)', task:`In vierhoek ABCD is ${hA('A')} = ${v[0]}°, ${hA('B')} = ${v[1]}° en ${hA('C')} = ${v[2]}°. Bereken ${hA('D')}.`,
      lines:[`${hA('A')} + ${hA('B')} + ${hA('C')} + ${hA('D')} = 360°`, `${v[0]}° + ${v[1]}° + ${v[2]}° = ${err}°`, `${hA('D')} = 360° − ${err}° = ${360-err}°`], wrong:1, cons:[2],
      why:'Een rekenfout bij het optellen.',
      fix:`${v[0]}° + ${v[1]}° + ${v[2]}° = [[0]]`, fixCheck:degFix(s), fixSol:`${s}°, dus ${hA('D')} = ${360-s}°`, mode:'decimal'});
  }};
FJ.buiten = { title:'De buitenhoek', lvl:2,
  build(b, st, save){ const R = makeR(st); const a = R.int(40, 65), c = R.int(35, 60);
    errBlock(b, st, save, 'e', {nr:'e)', task:`In ΔABC is ${hA('A')} = ${a}° en ${hA('C')} = ${c}°. Bereken de buitenhoek bij B.`,
      lines:[`buitenhoek bij B = 180° − (${hA('A')} + ${hA('C')})`, `= 180° − ${a+c}°`, `= ${180-a-c}°`], wrong:0, cons:[1,2],
      why:`180° − (${hA('A')} + ${hA('C')}) is de <b>binnenhoek</b> ${hA('B')}. De buitenhoek is de som van de twee niet-aanliggende binnenhoeken.`,
      fix:'buitenhoek bij B = [[0]]', fixCheck:degFix(a+c), fixSol:`${a}° + ${c}° = ${a+c}°`, mode:'decimal'});
  }};
FJ.bewijs = { title:'Een fout in het bewijs', lvl:2,
  build(b, st, save){ const R = makeR(st); const S = proofSetup(R); const L = proofLines(S); const {X, Y, Z} = S;
    b.append(el('div','', proofFig(S)));
    const wr = R.pick([0,1]);
    errBlock(b, st, save, 'e', {nr:'f)', task:`Bewijs dat ${L.tb} in Δ${X}${Y}${Z}, met p // ${X}${Y} door ${Z}.`,
      lines:[`${L.s1} &nbsp;(${wr===0 ? 'overeenkomstige hoeken' : L.r1})`, `${L.s2} &nbsp;(${wr===1 ? 'overstaande hoeken' : L.r2})`, `${L.s3} &nbsp;(${L.r3})`, `${L.bs}`], wrong:wr,
      why:`${wr===0 ? hA(Z,1)+' en '+hA(X) : hA(Z,3)+' en '+hA(Y)} zijn <b>verwisselende binnenhoeken</b>: ze liggen tussen de evenwijdigen, aan verschillende kanten van de snijlijn.`,
      fix:'De juiste reden is: [[0]]', fixCheck:v=>{ const t = v[0].toLowerCase(); const ok = t.includes('verwissel') && t.includes('binnen'); return {ok, msg: ok ? '' : 'Ze liggen allebei tussen de evenwijdigen.'}; }, fixSol:'verwisselende binnenhoeken'});
  }};
SEC.fout = { id:'fout', ic:'fout', nav:'Foutenjager', title:'Foutenjager',
  tip:'Iemand anders loste de oefening op. Zoek de eerste stap die fout is en verbeter hem. Zo leer je de valkuilen kennen.',
  cards:[FJ.drie, FJ.supp, FJ.omg, FJ.vier, FJ.buiten, FJ.bewijs] };

/* ---------- snelle quiz: 10 vragen in 3 minuten, telt niet mee ---------- */
const SQ = {
  ch:(q, opts, ans, show) => ({kind:'ch', q, opts, ans, show}),
  deg:(q, ans) => ({kind:'deg', q, ans, show:deg(ans)})
};
const sqFig = m => psFig(m, {nums:true, maxw:240});
const QUIZ = [
  R => { const x = R.int(12, 78); return SQ.deg(`Het complement van ${x}° is …`, 90-x); },
  R => { const x = R.int(25, 160); return SQ.deg(`Het supplement van ${x}° is …`, 180-x); },
  R => { const t = R.pick(TYPES5); const p = R.pick(PAIRTYPE[t].pairs); const m = psRandom(R, {W:260, H:170});
    const opts = TYPEOPTS.map(([v,l])=>[v, l]); return SQ.ch(`${hA('A',p[0][1])} en ${hA('B',p[1][1])} zijn …<br>${sqFig(m)}`, opts, t, PAIRTYPE[t].naam); },
  R => { const x = R.int(40, 140); const k = R.pick(['B1','B2','B3','B4']); const m = psWithAngle(R, x, {W:260, H:170}); const v = psAllVals(m);
    return SQ.deg(`a // b en ${hA('A',1)} = ${Math.round(v.A1)}°. Hoe groot is ${hA('B',k[1])}?<br>${sqFig(m)}`, Math.round(v[k])); },
  R => { const a = R.int(30, 80), c = R.int(30, 80); return SQ.deg(`In een driehoek zijn twee hoeken ${a}° en ${c}°. De derde hoek is …`, 180-a-c); },
  R => { const v = [R.int(70, 110), R.int(70, 110), R.int(70, 110)]; return SQ.deg(`Een vierhoek heeft hoeken van ${v.join('°, ')}°. De vierde hoek is …`, 360-v[0]-v[1]-v[2]); },
  R => { const t = R.pick([20, 30, 40, 50, 70, 80, 100]); return SQ.deg(`De tophoek van een gelijkbenige driehoek is ${t}°. Een basishoek is …`, (180-t)/2); },
  R => { const a = R.int(30, 70), c = R.int(30, 70); return SQ.deg(`In ΔABC is ${hA('A')} = ${a}° en ${hA('C')} = ${c}°. De buitenhoek bij B is …`, a+c); },
  R => { const t = R.pick(['os','nh','ov','vb','bz','vu','uz']); return SQ.ch(`Bij a // b zijn ${PAIRTYPE[t].naam} …`, [['g','even groot'],['s','supplementair']], PAIRTYPE[t].rel==='gelijk' ? 'g' : 's', PAIRTYPE[t].rel==='gelijk' ? 'even groot' : 'supplementair'); },
  R => { const t = R.pick(TYPES5); const x = R.int(50, 80); const ok = R.f()<.5; const y = PAIRTYPE[t].rel==='gelijk' ? (ok ? x : x+R.pick([2,4,6])) : (ok ? 180-x : 180-x+R.pick([2,4,-4]));
    return SQ.ch(`Twee ${PAIRTYPE[t].naam} zijn ${x}° en ${y}°. Zijn de rechten evenwijdig?`, [['j','ja'],['n','nee']], ok ? 'j' : 'n', ok ? 'ja' : 'nee'); },
  R => { const x = R.int(25, 70); return SQ.deg(`In een rechthoekige driehoek is een scherpe hoek ${x}°. De andere scherpe hoek is …`, 90-x); },
  R => { const x = R.int(30, 150); return SQ.deg(`Twee overstaande hoeken: de ene is ${x}°, de andere is …`, x); }
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
    const Q = order.map(i => gens[i](R));
    const top = el('div', 'qz-top'), klok = el('span', 'qz-klok', mm(T)), prog = el('span'), sc = el('span');
    top.append(klok, prog, sc);
    const balk = el('div', 'qz-balk', '<span style="width:100%"></span>'), vak = el('div', 'qz-vak'), fb = el('div', 'fb');
    root.append(top, balk, vak, fb);
    let k = 0, score = 0, over = T, bezig = false; const mis = [], t0 = Date.now();
    timer = setInterval(() => { if(!root.isConnected){ stop(); return; } over--; klok.textContent = mm(Math.max(0, over)); klok.classList.toggle('laag', over <= 20); balk.firstChild.style.width = Math.max(0, over / T * 100) + '%'; if(over <= 0) einde(true); }, 1000);
    function toon(){
      bezig = false; fb.className = 'fb'; fb.textContent = '';
      prog.textContent = 'Vraag ' + (k + 1) + ' / ' + N; sc.textContent = '✓ ' + score;
      const q = Q[k]; vak.innerHTML = ''; vak.append(el('div', 'qz-q', q.q));
      const ant = el('div', 'qz-ant'); vak.append(ant);
      if(q.kind === 'ch') q.opts.forEach(o => { const bt = el('button', 'btn ghost qz-opt', o[1]); bt.type = 'button'; bt.addEventListener('click', () => antwoord(o[0], bt)); ant.append(bt); });
      else {
        const inp = el('input', 'qz-inp'); inp.type = 'text'; inp.autocomplete = 'off'; inp.inputMode = 'decimal'; inp.setAttribute('aria-label', 'antwoord'); inp.placeholder = 'bv. 54°';
        const ok = el('button', 'btn', 'OK'); ok.type = 'button'; ant.append(inp, ok);
        const go = () => { if(!inp.value.trim()){ fb.className = 'fb'; fb.textContent = 'Vul eerst je antwoord in.'; return; } antwoord(inp.value); };
        ok.addEventListener('click', go); inp.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); go(); } });
        inp.focus({preventScroll:true});
      }
    }
    function antwoord(v, bt){
      if(bezig) return; bezig = true; const q = Q[k];
      const goed = q.kind === 'ch' ? v === q.ans : Math.abs(parseDeg(v) - q.ans) < 0.02;
      if(goed) score++; else mis.push(q);
      if(bt) bt.classList.add(goed ? 'goed' : 'fout');
      vak.querySelectorAll('input, button').forEach(x => { x.disabled = true; });
      fb.className = 'fb ' + (goed ? 'ok' : 'bad'); fb.innerHTML = goed ? 'Juist!' : 'Juist was: <b>' + q.show + '</b>';
      sc.textContent = '✓ ' + score;
      setTimeout(() => { if(!timer) return; k++; if(k >= N) einde(false); else toon(); }, goed ? 700 : 2000);
    }
    function einde(tijdOm){
      if(!timer && !tijdOm) return; stop(); const gebruikt = Math.min(T, Math.round((Date.now() - t0) / 1000));
      const best = !st.best || score > st.best.score || (score === st.best.score && gebruikt < (st.best.time || 1e9));
      if(best){ st.best = {score, time:tijdOm ? null : gebruikt}; save(); }
      root.innerHTML = '';
      root.append(el('div', 'qz-groot', score + ' / ' + N));
      root.append(el('p', '', (tijdOm ? 'De tijd is om. ' : 'Klaar in ' + mm(gebruikt) + '. ') + (best && score > 0 ? 'Dat is jouw beste score!' : 'Jouw beste score: ' + st.best.score + ' / ' + N + '.')));
      if(mis.length){ root.append(el('p', 'qz-sub', 'Dit ging nog mis:')); const ul = el('ul', 'qz-mis'); mis.forEach(q => ul.append(el('li', '', q.q.replace(/<br>[\s\S]*$/, '') + ' → <b>' + q.show + '</b>'))); root.append(ul); }
      if(tijdOm && k < N) root.append(el('p', 'qz-sub', (N - k) + ' vragen kwamen niet meer aan bod.'));
      const nog = el('button', 'btn', '↻ Nog eens'); nog.type = 'button'; nog.addEventListener('click', run); root.append(nog);
    }
    toon();
  }
  intro();
}; }
SEC.quiz = { id:'quiz', ic:'h_quiz', nav:'Snelle quiz', title:'Snelle quiz: hoe snel ben jij?',
  tip:'Tien korte vragen tegen de klok. De quiz telt niet mee: speel hem zo vaak je wil en probeer je beste score te verbeteren.',
  cards:[ { title:'Quiz hoeken', noReset:true, build:quizKaart(QUIZ) } ] };

/* ---------- proeftoetsen op 20 ---------- */
function tNamen(b, st, save){ const R = makeR(st); const m = psRandom(R, {n:psNames(R)}); b.append(el('div','', psFig(m, {maxw:400})));
  const pairs = R.shuffle([...TYPES5.map(t=>[t, R.pick(PAIRTYPE[t].pairs)]), ['os', R.pick(PAIRTYPE.os.pairs)], ['nh', R.pick(PAIRTYPE.nh.pairs)]]).slice(0,3);
  pairs.forEach(([t,p],i)=> selQ(b, st, save, 'n'+i, {html:`<span class="q-num">${LET[i]})</span> ${kH(m,p[0])} en ${kH(m,p[1])} zijn {0}`, opts:[TYPEOPTS7], ans:[t], sol:PAIRTYPE[t].naam})); }
function tReken(b, st, save){ const R = makeR(st); const x = R.int(38, 142); const m = psWithAngle(R, x, {n:psNames(R)}); const v = psAllVals(m);
  const g = R.pick(['A1','A2','A3','A4']); b.append(el('div','', psFig(m, {vals:{[g]:Math.round(v[g])+'°'}, fill:{[g]:'or'}, maxw:400})));
  b.append(el('p','instructions', `${m.n.a} // ${m.n.b}. Bereken de hoeken en geef telkens de reden.`));
  const ts = R.shuffle(TYPES5.filter(t=>PAIRTYPE[t].pairs.some(p=>p.includes(g)))).slice(0,2);
  ts.forEach((t,i)=>{ const p = PAIRTYPE[t].pairs.find(p=>p.includes(g)); const o = p[0]===g ? p[1] : p[0];
    degRedQ(b, st, save, 'r'+i, `<span class="q-num">${LET[i]})</span> ${kH(m,o)} = [[0]] want {R}`, Math.round(v[o]), [t], {sol:`${PAIRTYPE[t].naam}: ${Math.round(v[o])}°`}); }); }
function tOmg(b, st, save){ const R = makeR(st); for(let i=0;i<2;i++){ const t = R.pick(TYPES5); const p = R.pick(PAIRTYPE[t].pairs); const x = R.int(52, 80); const ok = i===0 ? R.f()<.5 : !st.ok0; if(i===0) st.ok0 = ok;
    const want = (k, val) => (+k[1])%2 ? val : 180-val; const vA = x; const vB = PAIRTYPE[t].rel==='gelijk' ? (ok ? x : x+R.pick([3,5])) : (ok ? 180-x : 180-x-R.pick([3,5]));
    const m = psWithVals(R, p[0], vA, p[1], vB); b.append(el('div','', psFig(m, {vals:{[p[0]]:vA+'°', [p[1]]:vB+'°'}, arcs:[p[0],p[1]], fill:{[p[0]]:'or', [p[1]]:'tq'}, nums:false, maxw:360})));
    qChoice(b, st, save, 'o'+i, {nr:LET[i]+')', html:'Zijn a en b evenwijdig?', opts:[['j','ja'],['n','nee']], ans: ok ? 'j' : 'n', why:`Het zijn ${PAIRTYPE[t].naam}: ${ok ? 'ze voldoen aan de omgekeerde eigenschap' : 'ze zijn niet ' + (PAIRTYPE[t].rel==='gelijk' ? 'even groot' : 'supplementair')}.`}); } }
function tBewijs(b, st, save){ const R = makeR(st); const S = proofSetup(R, {names:R.pick(TRI_N)}); b.append(el('div','', proofFig(S, {par:false})));
  b.append(el('p','instructions', `Bewijs dat de som van de hoeken van Δ${S.X}${S.Y}${S.Z} 180° is. Gebruik de hulplijn p door ${S.Z}.`));
  proofWriter(b, st, save, 'pw', {rows:proofRows(S, {blind:true}), sol:proofModelHTML(S)}); }
const TOETS_CTX = [CT.ladder, CT.parking, CT.trap], TOETS_DV = [VR.combi, VR.buitenReken, VR.vierAlg];
function bigToets(i){ return [
  {sec:'Namen van hoeken', pts:3, prompt:'Noteer de juiste naam.', build:tNamen},
  {sec:'Eigenschappen', pts:4, build:tReken},
  {sec:'Omgekeerde eigenschappen', pts:2, build:tOmg},
  {sec:'Context', pts:3, build:(b,st,save)=>TOETS_CTX[i].build(b,st,save)},
  {sec:'Bewijs: som van de hoeken van een driehoek', pts:4, build:tBewijs},
  {sec:'Driehoeken en vierhoeken', pts:4, build:(b,st,save)=>TOETS_DV[i].build(b,st,save)}
]; }
const TOETS_TIP = 'Een proeftoets op 20 punten over de hele module. Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Werk zonder spiekbriefje.';
[0,1,2].forEach(i=>{ SEC['toets'+(i+1)] = { id:'toets'+(i+1), ic:'toets', nav:'Proeftoets '+(i+1), title:'Proeftoets '+(i+1), tip:TOETS_TIP,
  cards:[ { title:'Proeftoets '+(i+1), noReset:true, build:(b,st,save,key)=>proeftoets(b,st,save,key,bigToets(i)) } ] }; });

(function(){ const css = `
  .qz{display:flex; flex-direction:column; gap:.7rem}
  .qz-top{display:flex; flex-wrap:wrap; gap:.6rem 1.2rem; align-items:center; font-weight:700; color:var(--accent-dark)}
  .qz-klok{font-variant-numeric:tabular-nums; font-size:1.4rem} .qz-klok.laag{color:var(--bad)}
  .qz-balk{height:.55rem; border-radius:999px; background:var(--accent-soft); overflow:hidden}
  .qz-balk span{display:block; height:100%; background:var(--orange); transition:width 1s linear}
  .qz-q{font-size:1.2rem; line-height:1.7} .qz-q .hf{max-width:260px; margin:.4rem 0}
  .qz-ant{display:flex; flex-wrap:wrap; gap:.5rem; align-items:center}
  .qz-inp{font:inherit; font-size:1.15rem; width:9em; padding:.35rem .6rem; border:2px solid var(--accent); border-radius:.6rem; background:var(--card); color:var(--ink)}
  .qz-opt.goed{border-color:var(--ok); background:var(--ok-bg)} .qz-opt.fout{border-color:var(--bad); background:var(--bad-bg)}
  .qz-groot{font-size:2.2rem; font-weight:700; color:var(--accent-dark)}
  .qz-mis{margin:.2rem 0 0; padding-left:1.2rem; line-height:1.9}
  .qz-sub{color:var(--ink-soft)}
  `; const s = document.createElement('style'); s.textContent = css; document.head.append(s); })();
const ORDER = ['compl','overst','aanl','def5','namen','eig','omgek','ctx','drie','vier','fout','quiz','toets1','toets2','toets3'];
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
