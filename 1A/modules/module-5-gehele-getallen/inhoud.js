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
    s += `<path class="as-sp ${sp.cls||''}${sp.nieuw ? ' nieuw' : ''}" pathLength="1" d="${d}"/>`;
    s += `<path class="as-spk ${sp.cls||''}${sp.nieuw ? ' nieuw' : ''}" d="M${fx(x2)} ${y-7} l${-dir*9} -7 l${dir*2} 9z"/>`;
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

/* ---------- springen op de getallenas: klik het startgetal, klik waar je landt, vul in ---------- */
function sprongAs(host, st, save, id, o){
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {f:0}); const a = o.a, b = o.b, T = a + b;
  const B = asBereik([a, T]); const box = el('div', 'm5-sprong'); host.append(box);
  const tekst = el('p', 'm5-stap'); const fig = el('div', 'm5-asbox'); const fb = el('div', 'fb'); const vak = el('div');
  box.append(tekst, fig, fb, vak);
  let geest = null, nieuw = false;
  function teken(){ const sp = s.f>=2 ? [{van:a, naar:T, lab:(b<0 ? '+ ' : '+ ') + zP(b), cls:b<0 ? 'neg' : 'pos', nieuw}] : [];
    const pt = s.f>=1 ? [{x:a, cls:'start'}] : []; if(s.f>=2) pt.push({x:T, cls:'eind'});
    fig.innerHTML = asSvg(Object.assign({}, B, {sprongen:sp, punten:pt, geest:s.f<2 ? geest : null, alt:`getallenas van ${B.lo} tot ${B.hi}`}));
    nieuw = false;
    tekst.innerHTML = s.f===0 ? `<b>Stap 1.</b> Klik op de getallenas op het startgetal <b>${zS(a)}</b>.` : s.f===1 ? `<b>Stap 2.</b> Je telt <b>${zP(b)}</b> op: ${b>0 ? 'spring ' + b + ' naar rechts' : 'spring ' + (-b) + ' naar links'}? Klik waar je landt.` : `<b>Stap 3.</b> Schrijf de uitkomst.`; }
  fig.addEventListener('pointermove', e => { if(s.f>=2) return; const svg = fig.querySelector('svg'); const v = asKlik(svg, e, B); if(v!==geest){ geest = v; teken(); } });
  fig.addEventListener('pointerleave', () => { geest = null; if(s.f<2) teken(); });
  fig.addEventListener('click', e => { if(s.f>=2) return; const v = asKlik(fig.querySelector('svg'), e, B);
    if(s.f===0){ if(v===a){ s.f = 1; fb.className = 'fb'; fb.textContent = ''; } else { fb.className = 'fb bad'; fb.innerHTML = `❌ Je klikte op ${zS(v)}. Zoek ${zS(a)}: ${a<0 ? 'links' : 'rechts'} van 0.`; CLres(qid, false); } }
    else if(s.f===1){ if(v===T){ s.f = 2; nieuw = true; fb.className = 'fb'; fb.textContent = ''; vraag(); }
      else { fb.className = 'fb bad'; fb.innerHTML = v===a - b ? `❌ Je sprong de verkeerde kant op. Een ${b<0 ? 'negatief getal optellen: naar links' : 'positief getal optellen: naar rechts'}.` : `❌ Je landde op ${zS(v)}. Tel ${Math.abs(b)} streepjes vanaf ${zS(a)}.`; CLres(qid, false); } }
    save(); teken(); });
  function vraag(){ vak.innerHTML = '';
    mQ(vak, st, save, id + 'u', {noCL:true, html:`${zS(a)} + ${zP(b)} ${isq} {{u:a${o.teken===false ? '' : ',t'}}}`, check:V=>chkZG(V.a, T, [[a - b, 'Kijk naar de sprong op de getallenas.']]),
      onOk:silent=>{ if(!silent){ CLres(qid, true); if(o.onOk) o.onOk(); } } }); }
  teken(); if(s.f>=2) vraag();
}

/* ---------- legertjes: + en − soldaten, een nulpaar is samen 0 ---------- */
const sold = x => `<b>${Math.abs(x)}</b> ${x>0 ? 'plus' : 'min'}-${Math.abs(x)===1 ? 'soldaat' : 'soldaten'}`;
function legertjes(host, st, save, id, o){
  const qid = QID(id); if(!QZ) CLvraag(qid);
  const s = st[id] || (st[id] = {}); const a = o.a, b = o.b, T = a + b;
  const pos = (a>0 ? a : 0) + (b>0 ? b : 0), neg = (a<0 ? -a : 0) + (b<0 ? -b : 0), n = Math.max(pos, neg), paren = Math.min(pos, neg);
  const box = el('div', 'm5-leger'); host.append(box);
  box.append(el('p', 'm5-stap', `${zS(a)} + ${zP(b)}: ${sold(a)} en ${sold(b)}. Een plus- en een min-soldaat samen zijn <b>0</b>: een nulpaar.`));
  const veld = el('div', 'm5-veld'); veld.style.setProperty('--n', n); box.append(veld);
  const rijP = el('div', 'm5-rij p'), rijN = el('div', 'm5-rij m'); veld.append(rijP, rijN);
  for(let i=0; i<n; i++){ const p = el('span', 'm5-sold' + (i<pos ? ' plus' : ' leeg'), i<pos ? '+' : ''); const m = el('span', 'm5-sold' + (i<neg ? ' min' : ' leeg'), i<neg ? MIN : ''); if(i<paren){ p.classList.add('paar'); m.classList.add('paar'); } rijP.append(p); rijN.append(m); }
  const act = el('div', 'q-act'); const knop = el('button', 'btn', '⚔ Laat de nulparen verdwijnen'); knop.type = 'button'; act.append(knop); box.append(act);
  const uit = el('div', 'm5-stap'); const vak = el('div'); box.append(uit, vak);
  function na(anim){ veld.classList.add('weg'); if(!anim) veld.classList.add('direct'); knop.hidden = true;
    const over = Math.abs(T); uit.innerHTML = paren ? `${paren} ${paren===1 ? 'nulpaar verdwijnt' : 'nulparen verdwijnen'}. Er ${over===1 ? 'blijft' : 'blijven'} <b>${over}</b> ${T>0 ? 'plus' : T<0 ? 'min' : ''}-soldat${over===1 ? '' : 'en'} over.` : `Er zijn geen nulparen: alle soldaten hebben hetzelfde teken. Tel ze samen.`;
    if(T===0) uit.innerHTML = `Alle soldaten vormen nulparen. Er blijft niets over.`;
    mQ(vak, st, save, id + 'u', {noCL:true, html:`${zS(a)} + ${zP(b)} ${isq} {{u:a${o.teken===false ? '' : ',t'}}}`, check:V=>chkZG(V.a, T),
      onOk:silent=>{ if(!silent){ CLres(qid, true); if(o.onOk) o.onOk(); } } }); }
  knop.addEventListener('click', ()=>{ s.weg = true; save(); na(!REDUCED_M); });
  if(s.weg) na(false);
}

/* ---------- som-piramide: elk vak is de som van de twee vakken eronder ---------- */
/* basis: getallen onderaan; open: indexen (rij*10 + kolom, rij 0 = onderaan) die de leerling invult */
function piramide(host, st, save, id, o){
  const qid = QID(id); const quiz = QZ; if(!quiz) CLvraag(qid);
  const s = st[id] || (st[id] = {v:{}}); const n = o.basis.length; const W = [o.basis.slice()];
  for(let r=1; r<n; r++){ W[r] = []; for(let c=0; c<n-r; c++) W[r][c] = W[r-1][c] + W[r-1][c+1]; }
  const box = el('div', 'q m5-pir'); host.append(box); if(o.nr) box.append(el('span', 'q-num', o.nr));
  const pir = el('div', 'm5-pir-in'); box.append(pir); const inp = {};
  for(let r=n-1; r>=0; r--){ const rij = el('div', 'm5-pir-rij');
    for(let c=0; c<n-r; c++){ const k = r*10 + c;
      if(o.open.includes(k)){ const i = el('input', 'inp m5-pir-v'); i.type = 'text'; i.autocomplete = 'off'; i.inputMode = 'numeric'; i.value = s.v[k] || ''; i.setAttribute('aria-label', `rij ${r+1} van onder, vak ${c+1}`);
        i.addEventListener('input', ()=>{ s.v[k] = i.value; save(); i.classList.remove('ok', 'bad'); }); i.addEventListener('keydown', e=>{ if(e.key==='Enter' && !quiz) run(); }); inp[k] = i; rij.append(i); }
      else rij.append(el('span', 'm5-pir-v vast', zS(W[r][c]))); }
    pir.append(rij); }
  const act = el('div', 'q-act'); const btn = el('button', 'btn', 'Controleer'); btn.type = 'button'; act.append(btn); box.append(act); const fb = el('div', 'fb'); box.append(fb);
  const goed = k => rdZ({t:inp[k].value, z:true})===W[Math.floor(k/10)][k%10];
  function run(silent){ const ks = Object.keys(inp); if(ks.some(k => !inp[k].value.trim())){ if(!silent){ fb.className = 'fb info'; fb.textContent = 'Vul eerst alle vakjes in.'; } return; }
    let fout = 0; ks.forEach(k => { const g = goed(+k); if(!g) fout++; inp[k].classList.remove('ok', 'bad'); inp[k].classList.add(g ? 'ok' : 'bad'); });
    fb.className = 'fb ' + (fout ? 'bad' : 'ok'); fb.innerHTML = fout ? `❌ ${fout===1 ? 'Eén vak klopt' : fout + ' vakken kloppen'} nog niet. ${o.whyBad||'Elk vak is de som van de twee vakken eronder.'}` : '✅ Juist! ' + (o.why||'');
    s.checked = true; save(); if(!silent && !quiz) CLres(qid, !fout); }
  btn.addEventListener('click', ()=>run());
  if(quiz){ btn.hidden = true; quiz.push({pts:o.pts||1, grade:()=>Object.keys(inp).every(k => goed(+k)), reveal:()=>run(true), lock:()=>Object.values(inp).forEach(i => i.readOnly = true)}); }
  else if(s.checked) run(true);
}

/* ---------- thermometer ---------- */
function thermoSvg(o){ /* o: {lo, hi, t (stand), van (vorige stand), merk} */
  const H = 262, x = 46, top = 30, bot = 218, Y = v => bot - (v - o.lo)*(bot - top)/(o.hi - o.lo);
  let s = `<rect class="th-buis" x="${x-9}" y="${top-8}" width="18" height="${bot-top+20}" rx="9"/><circle class="th-bol" cx="${x}" cy="${bot+22}" r="17"/>`;
  s += `<rect class="th-kwik" x="${x-5}" y="${fx(Y(o.t))}" width="10" height="${fx(bot + 14 - Y(o.t))}"/><circle class="th-kwik" cx="${x}" cy="${bot+22}" r="12"/>`;
  for(let v=o.lo; v<=o.hi; v++){ if(v % 2) continue; const y = fx(Y(v)), lang = v % 10===0;
    s += `<line class="th-t${v===0 ? ' nul' : ''}" x1="${x+10}" y1="${y}" x2="${x+(lang ? 22 : v % 5===0 ? 18 : 15)}" y2="${y}"/>`; if(v % 10===0) s += sT(x+40, y, zS(v), v===0 ? 't as-0' : 'k'); }
  if(o.van!=null && o.van!==o.t){ const y1 = Y(o.van), y2 = Y(o.t); s += `<path class="as-sp ${o.t<o.van ? 'neg' : 'pos'} nieuw" pathLength="1" d="M${x-14} ${fx(y1)} C${x-40} ${fx(y1)} ${x-40} ${fx(y2)} ${x-14} ${fx(y2)}"/>`; }
  s += sT(x+8, 8, '°C', 'k', 'start');
  return svgWrap(110, H, s, {alt:`thermometer: ${zS(o.t)} °C`, maxw:110, cls:'m5-th'}); }

/* ---------- bogen: welke bewerking eerst? ---------- */
const TRAP_TXT = [['haakjes', 'eerst wat tussen haakjes staat'], ['· en :', 'maal en gedeeld door, van links naar rechts'], ['+ en −', 'plus en min, van links naar rechts']];
function trapHTML(nu){ return `<div class="m5-trap"><b>Trap van de volgorde</b>${TRAP_TXT.map(([k, u], i) => `<div class="m5-trede${i+1===nu ? ' aan' : ''}"><span class="m5-tr-n">${i+1}</span><span><b>${k}</b><br><small>${u}</small></span></div>`).join('')}</div>`; }
/* boom naar html; klikbaar: bewerkingstekens worden knoppen. sel: {i, v} een boog met uitkomst onder knoop i */
function bogHTML(t, o={}){ const K = []; const idx = new Map();
  const w = x => { if(x.t==='bin' || (x.t==='grp' && x.br==='|') || (x.t==='neg' && x.a.t==='grp')){ idx.set(x, K.length); K.push(x); } if(x.a) w(x.a); if(x.b) w(x.b); }; w(t);
  const r = x => {
    let h;
    if(x.t==='n') h = dz(x.v);
    else if(x.t==='l') h = `<i>${x.v}</i>`;
    else if(x.t==='neg') h = MIN + r(x.a);
    else if(x.t==='pos') h = '+' + r(x.a);
    else if(x.t==='grp'){ const [a, c] = x.br==='[' ? ['[', ']'] : x.br==='|' ? ['|', '|'] : ['(', ')']; h = a + r(x.a) + c; }
    else { const i = idx.get(x); const op = x.op==='·' ? '·' : x.op;
      h = `${r(x.a)} ${o.klik ? `<button type="button" class="bg-op" data-i="${i}" aria-label="bewerking ${esc(ZX.str(x))}">${op}</button>` : `<span class="bg-o">${op}</span>`} ${r(x.b)}`; }
    if(idx.has(x)){ const i = idx.get(x); const sel = o.sel && o.sel.i===i;
      h = `<span class="bg-s${sel ? ' u' : ''}${o.rood===i ? ' rd' : ''}" data-i="${i}">${h}${sel ? `<span class="bg-arc"></span><span class="bg-ub">${o.sel.v!=null ? zS(o.sel.v) : '<input type="text" class="inp bg-in" inputmode="numeric" autocomplete="off" aria-label="uitkomst van deze bewerking">'}</span>` : ''}</span>`; }
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
  const s = st[id] || (st[id] = {L:[o.opg], d:[], sel:null, f:0});
  const wrap = el('div', 'm5-bog'); host.append(wrap);
  const links = el('div', 'm5-bog-l'), rechts = el('div', 'm5-bog-r'); wrap.append(links, rechts);
  const lijst = el('div', 'm5-bog-lijst'); const fb = el('div', 'fb'); const act = el('div', 'q-act'); links.append(lijst, fb, act);
  const terug = el('button', 'btn ghost', '↶ Regel terug'); terug.type = 'button'; act.append(terug);
  let rood = null;
  function draw(focus){
    lijst.innerHTML = '';
    s.L.forEach((L, li) => { const t = ZX.parse(L); const nu = li===s.L.length-1;
      const regel = el('div', 'm5-bog-regel' + (nu ? ' nu' : ''));
      regel.append(el('span', 'm5-bog-is', li ? '=' : ''));
      const d = s.d[li]; const H = bogHTML(t, {klik: nu && s.sel==null && !ZX.isAt(t), sel: d ? {i:d.i, v:d.v} : nu && s.sel!=null ? {i:s.sel} : null, rood: nu ? rood : null});
      const ex = el('span', 'm5-bog-ex', H.html); regel.append(ex); lijst.append(regel);
      if(nu){ ex.querySelectorAll('.bg-op').forEach(b => {
          const sp = b.closest('.bg-s');
          b.addEventListener('mouseenter', ()=>sp.classList.add('hov')); b.addEventListener('mouseleave', ()=>sp.classList.remove('hov'));
          b.addEventListener('focus', ()=>sp.classList.add('hov')); b.addEventListener('blur', ()=>sp.classList.remove('hov'));
          b.addEventListener('click', ()=>kies(t, H.K, +b.dataset.i)); });
        const inp = ex.querySelector('.bg-in');
        if(inp){ const ok = el('button', 'btn sm-btn bg-ok', 'OK'); ok.type = 'button'; inp.parentNode.append(ok);
          const chk = () => antwoord(t, H.K[s.sel], inp);
          inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); chk(); } }); ok.addEventListener('click', chk);
          if(focus) inp.focus({preventScroll:true}); }
        if(ZX.isAt(t)) klaar(t); }
    });
    const t = ZX.parse(s.L[s.L.length-1]); const E = ZX.klaar(t);
    rechts.innerHTML = trapHTML(ZX.isAt(t) ? 0 : s.sel!=null ? ZX.trede(t, bogHTML(t).K[s.sel]) : E.length ? Math.min(...E.map(e => ZX.trede(t, e))) : 0);
    terug.hidden = s.L.length<2 && s.sel==null;
  }
  function kies(t, K, i){ const N = K[i]; const E = ZX.klaar(t), minT = Math.min(...E.map(e => ZX.trede(t, e)));
    if(ZX.mag(N) && ZX.trede(t, N)===minT){ s.sel = i; rood = null; fb.className = 'fb'; fb.textContent = ''; save(); draw(true); return; }
    const d = bogFout(t, N); rood = i; s.f++; save(); fb.className = 'fb bad'; fb.innerHTML = `❌ <b>${d.code}</b> · ${d.msg}`; CLres(qid, false); draw(false); }
  function antwoord(t, N, inp){ const x = rdZ({t:inp.value, z:true}); const T = ZX.val(N).k;
    if(x==null){ fb.className = 'fb info'; fb.textContent = 'Typ een geheel getal onder de boog.'; return; }
    if(x!==T){ s.f++; save(); fb.className = 'fb bad'; fb.innerHTML = x===-T ? '❌ Het getal klopt, maar het teken niet.' : `❌ ${zT(ZX.str(N))} is niet ${zS(x)}. Reken nog eens.`; inp.classList.add('bad'); CLres(qid, false); return; }
    s.d[s.L.length-1] = {i:s.sel, v:T}; s.L.push(ZX.str(ZX.vervang(t, new Set([N])))); s.sel = null; fb.className = 'fb'; fb.textContent = ''; save(); draw(false); }
  function klaar(t){ fb.className = 'fb ok'; fb.innerHTML = `✅ Klaar! De uitkomst is <b>${zS(ZX.val(t).k)}</b>.` + (s.f ? '' : ' Alles in één keer juist.');
    if(!s.ok){ s.ok = true; save(); CLres(qid, true); if(o.onOk) setTimeout(o.onOk, 700); } }
  terug.addEventListener('click', ()=>{ if(s.sel!=null) s.sel = null; else if(s.L.length>1){ s.L.pop(); s.d.length = s.L.length-1; s.ok = false; } rood = null; fb.className = 'fb'; fb.textContent = ''; save(); draw(false); });
  draw(false);
}

/* ---------- uitwerking als html (oplossing, toon mij hoe) ---------- */
const uitwH = (L) => `<div class="m5-uitw">${L.map((l, i) => `<div>${i ? '= ' : ''}${zT(l)}</div>`).join('')}</div>`;
/* wat gebeurt er in deze stap? (voor Toon mij hoe) */
function stapWat(s){ const t = ZX.parse(s); const E = ZX.klaar(t); if(!E.length) return ''; const tr = Math.min(...E.map(e => ZX.trede(t, e)));
  const lijst = E.filter(e => ZX.trede(t, e)===tr).map(e => zT(ZX.str(e)));
  return (tr===1 ? 'Eerst de haakjes: ' : tr===2 ? 'Maal en gedeeld door, van links naar rechts: ' : 'Plus en min, van links naar rechts: ') + lijst.join(' en ') + '.'; }
const hoeLijnen = L => L.map((l, i) => [(i ? '= ' : '') + zT(l), i < L.length-1 ? stapWat(l) : 'Dit is de uitkomst.']);

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
/* ============================================================
   ONDERDEEL · OPTELLEN VAN GEHELE GETALLEN
   basis: getallen tot 20 (met tekenvak), oefenen: tot 100, verdieping: groter en redeneren
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
  instr:'Reken de sommen van boven naar onder uit. Kijk op de getallenas hoe de uitkomst verandert.',
  build(b, st, save){
    const R = makeR(st); const a = R.pick([3, 4, 5, -2, -3, -4]); const B = [3, 2, 1, 0, -1, -2, -3]; if(!st.k) st.k = {};
    const wrap = el('div', 'm4-naast'); b.append(wrap); const lk = el('div'), vis = el('div', 'm4-vis'); wrap.append(lk, vis);
    const ber = asBereik([a - 3, a + 3], 12); const figH = el('div'); const uitl = el('p', 'm5-stap'); vis.append(figH, uitl);
    const fig = (i, anim) => { const pt = [{x:a, cls:'start'}]; B.forEach((x, j) => { if(j < st.i && x) pt.push({x:a + x}); });
      const sp = i!=null && B[i] ? [{van:a, naar:a + B[i], lab:'+ ' + zP(B[i]), cls:B[i]<0 ? 'neg' : 'pos', nieuw:anim}] : [];
      figH.innerHTML = asSvg(Object.assign({}, ber, {W:440, punten:pt, sprongen:sp, alt:'getallenas met de uitkomsten', maxw:520}));
      uitl.innerHTML = i==null ? `Start bij <b>${zS(a)}</b>.` : B[i]>0 ? `${zP(B[i])} optellen: ${B[i]} naar <b>rechts</b>.` : B[i]<0 ? `${zP(B[i])} optellen: ${-B[i]} naar <b>links</b>.` : '0 optellen: je blijft staan.'; };
    const lijst = el('div', 'm5-patroon'), g = el('div'); lk.append(lijst, g); if(st.i==null) st.i = 0;
    const toon = anim => { lijst.innerHTML = B.slice(0, st.i).map((x, j) => `<div class="m5-ok-r"><span>${somT(a, x)} = <b>${zS(a + x)}</b></span> <span class="m5-vink">✓</span></div>`).join('');
      g.innerHTML = ''; fig(st.i ? st.i - 1 : null, anim);
      if(st.i < B.length){ const i = st.i, x = B[i];
        mQ(g, st, save, 'p' + i, { html:`${somT(a, x)} ${isq} {{u:a,t}}`, check:V=>chkGt(V.a, a + x, [[a - x, 'Kijk naar het patroon: telkens 1 minder optellen geeft 1 minder.']]),
          onOk:silent=>{ if(!silent && st.i===i){ st.k[i] = 1; st.i++; save(); setTimeout(()=>toon(true), 500); } } });
        const f = g.querySelector('.m4-teken button'); if(f && anim) f.focus({preventScroll:true}); }
      else besluit(); };
    toon(false);
    function besluit(){ if(lk.querySelector('.m5-besluit')) return; const d = el('div', 'm5-besluit'); lk.append(d);
      qChoice(d, st, save, 'bes', { html:'Wat gebeurt er als je een <b>negatief</b> getal optelt?', opts:[['l', 'je gaat naar links: de uitkomst wordt kleiner'], ['r', 'je gaat naar rechts: de uitkomst wordt groter']], ans:'l',
        why:`Een negatief getal optellen: naar links op de getallenas. Bijvoorbeeld ${somT(a, -2)} = ${zS(a - 2)}.`, whyBad:'Kijk naar de laatste drie sommen: de uitkomst wordt telkens kleiner.' }); }
  } };

/* ---------- 2 springen op de getallenas ---------- */
OP.sprong = { title:'Springen op de getallenas', lvl:1,
  instr:'Klik eerst op het startgetal. Spring dan zoveel stappen als de tweede term: naar rechts als die positief is, naar links als die negatief is.',
  build(b, st, save){
    const R = makeR(st); const P = [somPaar(R, 'pn', 9), somPaar(R, 'np', 9), somPaar(R, 'zz', 6)]; if(st.i==null) st.i = 0;
    const lijst = el('div', 'm5-gedaan'), host = el('div'); b.append(lijst, host);
    const toon = () => { lijst.innerHTML = P.slice(0, st.i).map(([x, y]) => `<span class="m5-ok">✓ ${somT(x, y)} = ${zS(x + y)}</span>`).join('');
      host.innerHTML = '';
      if(st.i < P.length){ host.append(el('div', 'm5-teller', `Opgave ${st.i + 1} van ${P.length}`)); const [x, y] = P[st.i];
        sprongAs(host, st, save, 's' + st.i, {a:x, b:y, onOk:()=>{ st.i++; save(); setTimeout(toon, 900); }}); }
      else host.append(el('div', 'm4-regel nieuw', '✅ Alle sprongen juist. Een positief getal optellen: <b>naar rechts</b>. Een negatief getal optellen: <b>naar links</b>.')); };
    toon();
  } };

/* ---------- 3 legertjes ---------- */
OP.leger = { title:'Plus- en min-soldaten', lvl:1,
  instr:'Plus-soldaten staan voor positieve getallen, min-soldaten voor negatieve. Een plus- en een min-soldaat heffen elkaar op: samen zijn ze 0. Laat de nulparen verdwijnen en tel wat overblijft.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle([somPaar(R, 'pn', 8), somPaar(R, 'np', 8), somPaar(R, 'zz', 5)]); if(st.i==null) st.i = 0;
    const lijst = el('div', 'm5-gedaan'), host = el('div'); b.append(lijst, host);
    const toon = () => { lijst.innerHTML = P.slice(0, st.i).map(([x, y]) => `<span class="m5-ok">✓ ${somT(x, y)} = ${zS(x + y)}</span>`).join('');
      host.innerHTML = '';
      if(st.i < P.length){ host.append(el('div', 'm5-teller', `Opgave ${st.i + 1} van ${P.length}`)); const [x, y] = P[st.i];
        legertjes(host, st, save, 'l' + st.i, {a:x, b:y, onOk:()=>{ st.i++; save(); setTimeout(toon, 900); }}); }
      else host.append(el('div', 'm4-regel nieuw', '✅ Klaar. Verschillend teken: de nulparen verdwijnen, het leger met de meeste soldaten wint. Zelfde teken: alle soldaten blijven over.')); };
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
        mQ(stap, st, save, 's' + i, { html:`${somT(x, y)} ${isq} {{s:t}} <span class="m4-par">(</span>{{g:p}} ${op} {{g:q}}<span class="m4-par">)</span> ${isq} {{u:r,t}}`,
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
  instr:'Kies eerst het teken van de uitkomst in het tekenvak (+ boven, − onder) en typ dan het getal.',
  build(b, st, save){
    const R = makeR(st); const P = R.shuffle(['zz', 'zz', 'pn', 'pn', 'np', 'np', 'pn', 'pp'].map(k => somPaar(R, k, 20)));
    reeks(b, P.length, (g, i, nr) => { const [x, y] = P[i], T = x + y;
      mQ(g, st, save, 'b' + i, { nr, html:`${somT(x, y)} ${isq} {{u:a,t}}`, check:V=>chkGt(V.a, T, [[x - y, 'Je trok af in plaats van op te tellen.'], [Math.sign(T)*(Math.abs(x) + Math.abs(y)), 'De tekens zijn verschillend: trek de absolute waarden van elkaar af.']]),
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

/* ---------- 7 temperatuur met een thermometer ---------- */
OP.temp = { title:'Een dag op de thermometer', lvl:2,
  instr:'Volg de temperatuur van een winterdag. Bij elke verandering tel je op: een stijging is positief, een daling negatief.',
  build(b, st, save){
    const R = makeR(st); const t0 = R.int(-8, 3); const V = []; let t = t0;
    [['tegen de middag stijgt de temperatuur', 1], ['in de namiddag stijgt ze nog wat', 1], ['bij zonsondergang daalt ze', -1], ['in de nacht daalt ze verder', -1]].forEach(([tx, s]) => { let d;
      for(let k=0; k<50; k++){ d = s*R.int(3, 11); if(t + d >= -18 && t + d <= 18 && t + d!==0) break; } V.push([tx, d, t]); t += d; });
    if(st.i==null) st.i = 0;
    const wrap = el('div', 'm5-ctx'); b.append(wrap); const th = el('div', 'm4-vis'); const rt = el('div', 'm4-items een'); wrap.append(th, rt);
    const teken = (anim) => { const nu = st.i ? V[st.i-1][2] + V[st.i-1][1] : t0; const van = anim && st.i ? V[st.i-1][2] : null; th.innerHTML = thermoSvg({lo:-20, hi:20, t:nu, van}); };
    const toon = anim => { rt.innerHTML = ''; teken(anim);
      rt.append(el('p', '', `'s Morgens is het <b>${zS(t0)} °C</b>.`));
      V.forEach(([tx, d, van], i) => { if(i > st.i) return;
        mQ(rt, st, save, 't' + i, { nr:'abcd'[i] + ')', html:`<span class="txt">${tx[0].toUpperCase() + tx.slice(1)} ${d>0 ? 'met' : 'met'} ${Math.abs(d)} °C:</span> ${somT(van, d)} ${isq} {{u:a}} <span class="txt">°C</span>`,
          check:V2=>chkG(V2.a, van + d, [[van - d, d<0 ? 'Een daling is een negatieve verandering: tel ' + zP(d) + ' op.' : 'Een stijging maakt het warmer.']]),
          onOk:silent=>{ if(!silent && st.i===i){ st.i++; save(); toon(true); } } }); });
      if(st.i >= V.length) rt.append(el('div', 'm4-regel nieuw', `✅ 's Avonds laat is het ${zS(t)} °C. Een stijging tel je op als positief getal, een daling als negatief getal.`)); };
    toon(false);
  } };

/* ---------- 8 rekenen in het echt ---------- */
OP.echt = { title:'Rekenen in het echt', lvl:2,
  instr:'Schrijf elke situatie als een optelling in je hoofd en vul de uitkomst in.',
  build(b, st, save){
    const R = makeR(st);
    const h = R.int(4, 15), d = R.int(3, 12), v = R.int(1, 6), w = R.int(v + 2, v + 7), s = -R.int(15, 60), st2 = R.int(30, 90), j = R.pick([480, 625, 753, 1200]), n = R.pick([500, 800, 1000, 1500]);
    const L = [
      [`Een duiker zwemt op ${h} m onder het wateroppervlak. Hij daalt nog ${d} m dieper. Op welke hoogte zwemt hij nu?`, -h - d, 'm', `${zS(-h)} + ${zP(-d)}`],
      [`Een lift staat op verdieping ${v}. Hij gaat ${w} verdiepingen naar beneden. Op welke verdieping stopt hij? (onder de grond: negatief)`, v - w, '', `${v} + ${zP(-w)}`],
      [`Op de rekening van Noor staat ${zS(s)} euro. Ze stort ${st2} euro. Hoeveel staat er nu op haar rekening?`, s + st2, 'euro', `${zS(s)} + ${st2}`],
      [`Een stad werd gesticht in het jaar ${j} voor Christus (${zS(-j)}). In welk jaar vierde ze haar ${n}ste verjaardag? (voor Christus: negatief)`, -j + n, '', `${zS(-j)} + ${n}`]];
    reeks(b, L.length, (g, i, nr) => { const [tx, T, u, som] = L[i];
      mQ(g, st, save, 'e' + i, { nr, html:`<span class="txt">${tx}</span> {{u:a}} <span class="txt">${u}</span>`, check:V=>chkG(V.a, T), hint:[`Schrijf als optelling: ${som}.`], sol:`${som} ${isq} ${zS(T)}` }); }, {een:true});
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
  cheat:CHEAT_OPTEL, cards:[OP.patroon, OP.sprong, OP.leger, OP.regel, OP.ber1, OP.ber2, OP.temp, OP.echt, OP.pir, OP.groot, OP.aanvul, OP.teken, OP.pir2] };
(function(){ const s = document.createElement('style'); s.textContent = `
  .m5-gedaan{display:flex; flex-wrap:wrap; gap:.4rem; margin:.2rem 0 .4rem} .m5-ok{background:var(--ok-bg); color:var(--ok); border-radius:.5rem; padding:.15rem .55rem; font-weight:700}
  .m5-teller{font-size:.85rem; font-weight:700; color:var(--accent-dark); text-transform:uppercase; letter-spacing:.04em}
  .m5-rk{padding:.4rem 0 .6rem; border-bottom:1px solid var(--accent-soft)} .m5-rk .q{padding:.2rem 0}
  .m5-vb{font-weight:700; font-size:1.1rem}
  .m5-besluit{margin-top:.6rem}
  .m5-patroon{display:flex; flex-direction:column; gap:.15rem; font-size:1.2rem; font-variant-numeric:tabular-nums} .m5-ok-r{display:flex; gap:.5rem; align-items:center} .m5-vink{color:var(--ok); font-weight:900}
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
    hint: o.hint===false ? undefined : ['Welke bewerking moet eerst? Denk aan de trap: eerst haakjes, dan · en : van links naar rechts, dan + en − van links naar rechts.', ['Zo begin je:', '= ' + zT(L[1])]],
    sol:uitwH(L) });
}

/* ---------- 1 en 2 bogen ---------- */
function bogKaart(b, st, save, lijst){
  const R = makeR(st); const P = opgN(R, lijst, 3, {lim:60, min:3}); if(st.i==null) st.i = 0;
  const host = el('div'); b.append(host);
  const toon = () => { host.innerHTML = '';
    if(st.i < P.length){ host.append(el('div', 'm5-teller', `Opgave ${st.i + 1} van ${P.length}`));
      bogen(host, st, save, 'g' + st.i, {opg:P[st.i], onOk:()=>{ st.i++; save(); toon(); }}); }
    else { host.append(el('div', 'm4-regel nieuw', '✅ Alle drie juist uitgewerkt. Zo werk je ook op papier: zet in gedachten een boog onder de bewerking die eerst moet.'));
      host.append(el('div', 'm5-gedaan', P.map(E => `<span class="m5-ok">✓ ${zT(E)} = ${zS(ZX.waarde(E).k)}</span>`).join(''))); } };
  toon();
}
VG.bog1 = { title:'Wat eerst?', lvl:1,
  instr:'Klik op het bewerkingsteken van de bewerking die eerst moet. Typ de uitkomst onder de boog en druk op Enter. Zo reken je regel per regel verder.',
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
  instr:'In elke uitwerking zit één fout. Klik op de eerste stap die fout is en verbeter die stap.',
  build(b, st, save){
    const R = makeR(st);
    const F = R.shuffle([
      () => { const a = R.int(5, 20), x = R.int(2, 6), y = R.int(2, 6); return [`${a} − ${x} · ${y}`, `${a - x} · ${y}`, 0, 'Maal gaat voor min: eerst ' + x + ' · ' + y + '.']; },
      () => { const q = R.int(2, 5), m = R.int(2, 6), k = R.int(2, 5); return [`${zS(-q*m)} + ${q*k} : ${q}`, `${zS(-q*m + q*k)} : ${q}`, 0, `Gedeeld door gaat voor plus: eerst ${q*k} : ${q}.`]; },
      () => { const a = R.int(2, 6), x = R.int(2, 9), y = R.int(2, 9); return [`${a} · (${x} − ${y})`, `${a*x} − ${y}`, 0, 'Eerst wat tussen haakjes staat.']; },
      () => { const a = R.int(-9, 9), x = R.int(3, 9), y = R.int(2, 8); return [`${zS(a)} − ${x} + ${y}`, `${zS(a)} − ${x + y}`, 0, `Plus en min reken je van links naar rechts: eerst ${zS(a)} − ${x}.`]; },
      () => { const a = R.int(3, 15), x = R.int(2, 5), y = R.int(2, 6); return [`${a} − ${x} · ${zP(-y)}`, `${a} − ${x*y}`, 0, `${x} · ${zP(-y)} = ${zS(-x*y)}. Kijk naar het teken.`]; },
      () => { const a = R.int(3, 15), x = R.int(2, 5), y = R.int(2, 6); return [`${a} − ${x} · ${zP(-y)}`, `${a - x*y}`, 1, `${a} − ${zP(-x*y)}: een negatief getal aftrekken is het tegengestelde optellen, dus ${a} + ${x*y}.`]; }]).slice(0, 2).map(f => f());
    F.forEach(([E, fout, k, why], i) => {
      const L = ZX.stappen(E, false); const juist = L[k + 1];
      const W = L.slice(1, k + 1).concat([fout]); const rest = ZX.stappen(fout); if(rest) W.push(...rest.slice(1));
      errBlock(b, st, save, 'f' + i, { nr:'abcd'[i] + ')', task:zT(E), lines:W.map(l => '= ' + zT(l)), wrong:k, cons:W.map((_, j) => j).filter(j => j>k), why,
        fixMQ:{html:`<span class="m5-opg">${zT(L[k])}</span> {{z:a,mdh}}`, check:V=>chkZ(V.a, ZX.waarde(juist), {opg:L[k]}), sol:'= ' + zT(juist)} }); });
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
/* volgorde van de onderdelen in het menu (proefstuk: optellen en volgorde van bewerkingen) */
const ORDER = ['optel', 'volg'];
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
