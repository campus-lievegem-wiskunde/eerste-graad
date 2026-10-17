/* ============================================================
   HULPFUNCTIES
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const PREFIX = '2a_m1_transfo_v1_';
let CURKEY = ''; /* sleutel van de kaart die nu opgebouwd wordt: vraag-id's beginnen met onderdeel-id + '_' */
const QID = id => CURKEY + '_' + id;
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
  const row = el('div','q'); if(!QZ) CLvraag(QID(id));
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
  row._q = q; row._B = B; row._qid = QID(id);
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
    s.checked = true; save(); CLres(row._qid, !!r.ok, !!r.info);
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
    if(doSave){ st[id]=val; save(); CLres(qid, ok); }
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
  .cf .num{fill:var(--ink-soft); font-size:3.5px; font-family:var(--f-body)}
  .cf .axl{fill:var(--ink); font-size:4.6px; font-style:italic; font-family:var(--f-body)}
  .cf .lbl{font-size:5px; font-weight:700; font-family:var(--f-body); paint-order:stroke; stroke:var(--card); stroke-width:1.4px; stroke-linejoin:round}
  .cf .lbl.orig{fill:var(--accent-dark)} .cf .lbl.img{fill:var(--ink)} .cf .lbl.help{fill:var(--ink-soft); font-weight:400; font-size:4.2px}
  .cf .lbl.step{fill:var(--accent-dark); font-size:4.4px}
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
  .vec-n>i{position:absolute; left:-.04em; right:-.12em; top:-.22em; height:.42em; display:block}
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
  .rows .q{margin:.5rem 0}
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

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
  const tok = ++F.token; const say = h => { if(cap) cap.innerHTML = h; };
  const base = [{t:'pt', p:P, n:Pn, c:'orig'}].concat(extraBase);
  const ms = REDUCED ? 1 : 1;
  const run = async (dur, fn) => { if(!F.alive(tok)) throw 0; await twn(REDUCED?30:dur*ms, t=>{ if(F.alive(tok)) fn(t); }); if(!F.alive(tok)) throw 0; };
  const pause = async d => { await wait(REDUCED?30:d); if(!F.alive(tok)) throw 0; };
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
const BIS_LINE = {t:'raw', s:`<line class="help" x1="${X(-6.4)}" y1="${Y(-6.4)}" x2="${X(6.4)}" y2="${Y(6.4)}" style="stroke-dasharray:none; stroke:var(--accent); stroke-width:.6"/><text class="lbl help" x="${X(5.6)}" y="${f2(Y(6.1))}" text-anchor="end">b</text>`};

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
    const A = [R.int(-5,5), R.int(-5,5)], dx = nz(R,1,5), dy = nz(R,1,5);
    const B = [A[0]+dx, A[1]+dy]; if(Math.abs(B[0])>CR || Math.abs(B[1])>CR) continue;
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
    const A = [-5,-4], B = [-2,-2];
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
      {h:`Lees de coördinaat van ${Pn} af.`, html:`${Pn}([[0]], [[1]])`, check:v=>chkPt(v, P, Pn, 'Eerst de x-coördinaat: hoeveel naar links of rechts? Dan de y-coördinaat: hoeveel naar boven of beneden?')},
      vraag('x'), vraag('y'),
      {h:`Noteer de coördinaat van het beeld ${Pn}${PR}.`, html:`${Pn}${PR}([[0]], [[1]])`, check:v=>chkPt(v, Q, Pn+PR, 'Gebruik je antwoorden uit stap 2 en 3.'),
        after:()=>animTrans(F, k, P, Pn, {}, cap)}
    ];
    Rt.append(el('p','instructions', `Spiegel het punt <b>${Pn}</b> om de <b>${ax}</b>. Dat noteer je als ${Pn}${PR} = ${T.kort}(${Pn}).`));
    qSteps(Rt, st, save, 'st', {steps, end:`${Pn}${PR} = ${T.kort}(${Pn}) en ${ptN(Pn+PR,Q[0],Q[1])}. Klik op <b>↺ Nieuwe opgave</b> voor een nieuw punt.`,
      restore:n=>{ if(n>=4) F.draw(finalObjs(k, P, Pn, {})); }});
  }};
}
CO.stapSx = spiegelStappen('sx','Stap voor stap: spiegelen om de x-as');
CO.stapSy = spiegelStappen('sy','Stap voor stap: spiegelen om de y-as');
CO.stapSO = spiegelStappen('sO','Stap voor stap: spiegelen om de oorsprong');

/* --- 5. Stap voor stap verschuiven --- */
function opStep(c, from, to, An, Bn){
  const d = to - from;
  return {h:`Van ${An} naar ${Bn}: wat gebeurt er met de ${c}-coördinaat?`, html:`De ${c}-coördinaat gaat van ${neg(from)} naar ${neg(to)}.`, choice:OPKEUZE, html2:`${neg(from)} <span class="opv">?</span> [[0]] = ${neg(to)}`, opSign:true,
    check:(v,ch)=>{ const n = parseInt2(v[0]); const want = d>0 ? '+' : '-'; const okC = ch===want, okN = n===Math.abs(d);
      let msg = '';
      if(!okC) msg = d>0 ? `${neg(to)} is groter dan ${neg(from)}: je moet er iets <b>bij</b> doen.` : `${neg(to)} is kleiner dan ${neg(from)}: je moet er iets <b>af</b> doen.`;
      else if(isNaN(n)) msg = 'Typ in het vakje enkel een getal zonder teken, bijvoorbeeld 4.';
      else if(n<0) msg = 'Het teken kies je met de knop. Typ in het vakje een getal zonder minteken.';
      else if(!okN) msg = `Tel de hokjes van ${neg(from)} naar ${neg(to)} op de ${c}-as.`;
      return {ok:okC&&okN, choiceOk:okC, fields:[okN], msg}; }};
}
function verschuifStappen(title, lvl=1){
  return { title, lvl, instr:'Werk stap voor stap. Je kijkt eerst wat er gebeurt van A naar B en doet daarna hetzelfde met het punt dat je verschuift.', build:(b,st,save)=>{
    const R = makeR(st); const g = genT(R, {noZero:true}); const [An,Bn,Pn] = ['A','B',R.pick('KLMNPRST'.split(''))];
    const {A,B,P,dx,dy} = g; const Q = [P[0]+dx, P[1]+dy];
    const two = el('div','cf-two'); b.append(two); const L = el('div'), Rt = el('div'); two.append(L, Rt);
    const F = coordFig(L, {maxw:400});
    const vb = [{t:'arrow', a:A, b:B}, {t:'pt', p:A, n:An, c:'orig', away:B}, {t:'pt', p:B, n:Bn, c:'orig', away:A}];
    F.base = vb.concat([{t:'pt', p:P, n:Pn, c:'orig'}]); F.draw([]);
    const cap = el('div','cf-cap'); L.append(cap);
    const ex = {A, B, An, Bn, dx, dy};
    const opx = dx>0?'+':'−', opy = dy>0?'+':'−';
    Rt.append(el('p','instructions', `Gegeven: ${ptN(An,A[0],A[1])}, ${ptN(Bn,B[0],B[1])} en ${ptN(Pn,P[0],P[1])}.<br>Verschuif <b>${Pn}</b> over de vector ${vecN(An,Bn)}.`));
    const steps = [
      opStep('x', A[0], B[0], An, Bn), opStep('y', A[1], B[1], An, Bn),
      {h:`Doe hetzelfde met ${Pn}.`, block:true, html:`<div class="step">x-coördinaat: ${neg(P[0])} ${opx} ${Math.abs(dx)} = [[0]]</div><div class="step">y-coördinaat: ${neg(P[1])} ${opy} ${Math.abs(dy)} = [[1]]</div>`,
        check:v=>{ const r = chkPt(v, Q, Pn+PR, 'Reken de bewerking uit. Gebruik de getallenas als het moeilijk is.'); if(!r.ok && r.msg.startsWith('Je hebt')) r.msg = 'Reken eerst de x-coördinaat uit en dan de y-coördinaat.'; return r; }},
      {h:`Noteer de coördinaat van het beeld ${Pn}${PR}.`, html:`${Pn}${PR}([[0]], [[1]])`, check:v=>chkPt(v, Q, Pn+PR, 'Gebruik je antwoorden uit stap 3.'),
        after:()=>{ F.base = []; return animTrans(F, 't', P, Pn, ex, cap).then(()=>{}); }}
    ];
    qSteps(Rt, st, save, 'st', {steps, end:`${ptN(Pn+PR,Q[0],Q[1])}. Van ${Pn} naar ${Pn}${PR} gebeurt precies hetzelfde als van ${An} naar ${Bn}.`,
      restore:n=>{ if(n>=4){ F.base = []; F.draw(vb.concat([{t:'pt', p:P, n:Pn, c:'orig'}], finalObjs('t', P, Pn, ex))); } }});
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
        qBlock(box, st, save, 'q'+i, { nr:LET[i]+'.', block:true, html:`Verschuif ${Pn} over ${vecN('A','B')}.<br>Van A naar B: x [[0:xs]] en y [[1:xs]]<br>${Pn}${PR}([[2:xs]], [[3:xs]])`,
          help:'Typ bij x en y wat er gebeurt van A naar B, bijvoorbeeld +3 of −2.',
          check:v=>{ const a = parseInt2(v[0]), c = parseInt2(v[1]); const r = chkPt([v[2],v[3]], Q, Pn+PR);
            const f = [a===dx, c===dy, ...r.fields]; const ok = f.every(Boolean);
            let msg = (!f[0]||!f[1]) ? `Kijk van A naar B: x gaat van ${neg(A[0])} naar ${neg(B[0])} en y van ${neg(A[1])} naar ${neg(B[1])}. Gebruik + of −.` : r.msg;
            if(ok){ F.base = []; animTrans(F, 't', P, Pn, ex, cap); }
            return {ok, fields:f, msg}; },
          sol:`x: ${neg(A[0])} → ${neg(B[0])} is ${sgnTxt(dx)}, y: ${neg(A[1])} → ${neg(B[1])} is ${sgnTxt(dy)}.<br>${Pn}${PR}(${neg(P[0])} ${sgnTxt(dx)}, ${neg(P[1])} ${sgnTxt(dy)}) = <b>${ptN(Pn+PR,Q[0],Q[1])}</b>` });
      } else {
        const P = genP(R, k); const T = TRN[k]; const Q = T.f(P[0],P[1]);
        const F = coordFig(box, {maxw:340}); F.base = [{t:'pt', p:P, n:Pn, c:'orig'}]; F.draw([]);
        const cap = el('div','cf-cap'); box.append(cap);
        qBlock(box, st, save, 'q'+i, { nr:LET[i]+'.', block:true, html:`${Pn}${PR} = ${T.kort}(${Pn})<br>${Pn}${PR}([[0:xs]], [[1:xs]])`,
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
    : `Zet ${ptN(Pn,P[0],P[1])} en zijn beeld ${Pn}${PR} = ${TRN[k].kort}(${Pn}) op het rooster.`;
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
  rows.forEach((r,i)=>{
    const host = el('div'); b.append(host);
    const res = qBlock(host, st, save, 'z'+i, { nr:LET[i]+'.', html:`${r.Pn}${PR} = ${r.T.kort}(${r.Pn}) &nbsp; en &nbsp; ${ptN(r.Pn, r.P[0], r.P[1])}, &nbsp; dus &nbsp; ${r.Pn}${PR}([[0:xs]], [[1:xs]])`,
      check:v=>{ const c = chkPt(v, r.Q, r.Pn+PR, 'Welke coördinaat blijft en welke verandert van teken?'); return c; },
      sol:`${r.T.naam}: ` + (r.k==='sx' ? `x blijft ${neg(r.P[0])}, y wordt ${neg(r.Q[1])}` : r.k==='sy' ? `x wordt ${neg(r.Q[0])}, y blijft ${neg(r.P[1])}` : `x wordt ${neg(r.Q[0])} en y wordt ${neg(r.Q[1])}`) + `. Dus <b>${ptN(r.Pn+PR, r.Q[0], r.Q[1])}</b>.` });
  });
}};
CO.zonderT = { title:'Zonder tekening: verschuiven', lvl:2, instr:'Er is geen tekening. Kijk eerst wat er gebeurt van A naar B en doe dan hetzelfde met het punt.', build:(b,st,save)=>{
  const R = makeR(st);
  for(let i=0;i<3;i++){
    let A, B, P; do{ A = [R.int(-8,8), R.int(-8,8)]; B = [A[0]+nz(R,1,7), A[1]+nz(R,1,7)]; P = [R.int(-8,8), R.int(-8,8)]; }while(Math.abs(B[0])>9 || Math.abs(B[1])>9);
    const dx = B[0]-A[0], dy = B[1]-A[1]; const Q = [P[0]+dx, P[1]+dy]; const Pn = 'KLMNPRS'[i+R.int(0,3)];
    qBlock(b, st, save, 't'+i, { nr:LET[i]+'.', block:true, html:`${ptN('A',A[0],A[1])}, ${ptN('B',B[0],B[1])} en ${ptN(Pn,P[0],P[1])}. ${Pn}${PR} is het beeld van ${Pn} door de verschuiving over ${vecN('A','B')}.`,
      html2:`<div class="step">Van A naar B: x [[0:xs]] &nbsp; y [[1:xs]]</div><div class="step">${Pn}${PR}([[2:xs]], [[3:xs]])</div>`, block2:true,
      help:'Typ wat er gebeurt van A naar B met + of −, bijvoorbeeld +5 of −2.',
      check:v=>{ const a = parseInt2(v[0]), c = parseInt2(v[1]); const r = chkPt([v[2],v[3]], Q, Pn+PR); const f = [a===dx, c===dy, ...r.fields]; const ok = f.every(Boolean);
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
      qBlock(b, st, save, 'm'+i, { nr:LET[i]+'.', html:`${ptN('A',A[0],A[1])}, ${ptN('B',B[0],B[1])}, ${ptN(Pn,P[0],P[1])}: verschuif ${Pn} over ${vecN('A','B')}. &nbsp; ${Pn}${PR}([[0:xs]], [[1:xs]])`,
        check:v=>chkPt(v, Q, Pn+PR, 'Kijk eerst wat er gebeurt van A naar B.'), sol:`Van A naar B: x ${sgnTxt(B[0]-A[0])}, y ${sgnTxt(B[1]-A[1])}. Dus <b>${ptN(Pn+PR,Q[0],Q[1])}</b>.` });
    } else { const P = genP(R,k,{max:8}); const T = TRN[k]; const Q = T.f(P[0],P[1]);
      qBlock(b, st, save, 'm'+i, { nr:LET[i]+'.', html:`${ptN(Pn,P[0],P[1])}: &nbsp; ${T.kort}(${Pn}) = ${Pn}${PR}([[0:xs]], [[1:xs]])`, check:v=>chkPt(v, Q, Pn+PR), sol:`${T.naam}: <b>${ptN(Pn+PR,Q[0],Q[1])}</b>` }); }
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
    qBlock(grid, st, save, 'r'+i, { nr:LET[i]+'.', html:`${TRN[k].kort}: &nbsp; (x, y) → ([[0:xs]], [[1:xs]])`, help:'Typ x, −x, y of −y.',
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
    Rt.append(el('p','instructions', `Draai ${Pn} rond de oorsprong O over <b>${deg}</b> (${k==='r90'?'tegenwijzerzin':'wijzerzin'}). Dat noteer je als ${Pn}${PR} = ${TRN[k].kort}(${Pn}).`));
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
    qBlock(host, st, save, 'd'+i, { nr:LET[i]+'.', html:`${ptN(Pn,P[0],P[1])}: &nbsp; ${TRN[k].kort}(${Pn}) = ${Pn}${PR}([[0:xs]], [[1:xs]])`,
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
    qBlock(b, st, save, 'b'+i, { nr:LET[i]+'.', html:`${Pn}${PR} = ${TRN[k].kort}(${Pn}) en ${ptN(Pn+PR,Q[0],Q[1])}. &nbsp; Dan is ${Pn}([[0:xs]], [[1:xs]]).`,
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

const ORDER = ['coord'];
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
