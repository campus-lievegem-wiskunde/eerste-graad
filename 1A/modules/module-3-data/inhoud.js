/* Module 3 · Data en onzekerheid (1A). Motor overgenomen van module 1 en 2. */
/* ============================================================
   HULPFUNCTIES
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
let CURKEY = ''; /* sleutel van de kaart die nu opgebouwd wordt: elk vraag-id begint met onderdeel-id + '_' (nodig voor het dashboard) */
const QID = id => (CURKEY && !String(id).startsWith(CURKEY + '_')) ? CURKEY + '_' + id : String(id);
const PREFIX = 'm3_data_v1_';
let QZ = null; /* verzamelt beoordelaars tijdens het opbouwen van een proeftoetsvraag */
function load(k){ try{ const r = localStorage.getItem(PREFIX+k); if(r){ const p = JSON.parse(r); if(p && typeof p === 'object') return p; } }catch(e){} return {}; }
function store(k,v){ try{ localStorage.setItem(PREFIX+k, JSON.stringify(v)); }catch(e){} }
function wipe(k){ try{ localStorage.removeItem(PREFIX+k); }catch(e){} }
function shuffle(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
const nrm = s => String(s).replace(/\s+/g,'').replace(/[−–]/g,'-');
function parseNum(s){ const t = nrm(s).replace(',', '.'); if(!/^-?\d+(\.\d+)?$/.test(t)) return NaN; return Number(t); }
const showNum = x => String(x).replace('.',',').replace('-','−');
const setTxt = arr => '{' + arr.join(', ').replace(/-/g,'−') + '}';

/* ---------- controles ---------- */
const numIs = t => v => { const x=parseNum(v[0]); if(isNaN(x)) return {ok:false, msg:'Typ enkel een getal.'}; return {ok:Math.abs(x-t)<1e-9}; };


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

function qBlock(parent, st, save, id, q){
  const row = el('div','q'); const qid = QID(id); if(!QZ && !q.noCL) CLvraag(qid);
  row.append(el('div', 'q-text'+(q.block?' block':''), (q.nr?`<span class="q-num">${q.nr}</span>`:'') + (q.help?helpHTML(q.help)+' ':'') + fillInputs(q.html, id, q.size, q.mode)));
  let optBtns = [], wrap = null;
  if(q.choice){
    wrap = el('div','choices');
    if(q.choiceLabel) wrap.append(el('span','step-lab', q.choiceLabel));
    q.choice.forEach(([val,label])=>{ const b=el('button','opt',label); b.type='button'; b.dataset.val=val; wrap.append(b); optBtns.push(b); });
  }
  if(wrap && !q.choiceLast) row.append(wrap);
  if(q.html2) row.append(el('div', q.block2?'':'q-text', fillInputs(q.html2, id, q.size, q.mode)));
  if(wrap && q.choiceLast) row.append(wrap);
  const act = el('div','q-act');
  const btn = el('button','btn','Controleer'); btn.type='button';
  const solBtn = el('button','linkbtn','Toon oplossing'); solBtn.type='button'; solBtn.hidden = true;
  act.append(btn, solBtn);
  const fb = el('div','fb');
  const sol = el('div','sol', q.sol||''); sol.hidden = true;
  row.append(act, fb, sol);
  parent.append(row);
  const quiz = QZ; if(quiz) act.hidden = true;

  const inputs = [...row.querySelectorAll('.inp')].sort((a,b)=>a.dataset.f-b.dataset.f);
  const s = st[id] || (st[id] = {v:[], c:null});
  function paintChoice(){ optBtns.forEach(b=>{ b.classList.toggle('chosen', b.dataset.val===s.c); b.classList.remove('good','wrong'); }); if(q.onChoice) q.onChoice(row, s.c); }
  inputs.forEach((inp,i)=>{
    if(s.v[i]!=null) inp.value = s.v[i];
    inp.addEventListener('input', ()=>{ s.v[i]=inp.value; save(); inp.classList.remove('ok','bad'); });
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter' && !quiz){ e.preventDefault(); run(); } });
  });
  optBtns.forEach(b=> b.addEventListener('click', ()=>{ s.c=b.dataset.val; save(); paintChoice(); fb.textContent=''; }));
  paintChoice();

  function run(){
    const vals = inputs.map(i=>i.value.trim());
    if(inputs.length && vals.every(v=>v==='') && !(q.choice && s.c)){ fb.textContent=''; fb.className='fb'; return; }
    if(q.choice && !s.c){ fb.className='fb info'; fb.textContent='Kies eerst een van de knoppen.'; return; }
    if(inputs.length && vals.some(v=>v==='') && !q.allowEmpty){ fb.className='fb info'; fb.textContent='Vul eerst alle vakjes in.'; return; }
    const r = q.check(vals, s.c) || {ok:false};
    const kind = r.ok ? 'ok' : (r.info ? 'info' : 'bad');
    fb.className = 'fb ' + kind;
    fb.innerHTML = (r.ok ? '✅ Juist! ' : r.info ? '' : '❌ Nog niet juist. ') + (r.msg || (r.ok && q.why ? q.why : ''));
    inputs.forEach((inp,i)=>{ inp.classList.remove('ok','bad');
      if(r.fields){ if(r.fields[i]!=null) inp.classList.add(r.fields[i]?'ok':'bad'); }
      else if(r.ok) inp.classList.add('ok'); else if(!r.info) inp.classList.add('bad'); });
    if(q.choice && r.choiceOk!=null){ optBtns.forEach(b=>{ if(b.dataset.val===s.c) b.classList.add(r.choiceOk?'good':'wrong'); }); }
    if(!r.ok && q.sol) solBtn.hidden = false;
    if(q.after) try{ q.after(!!r.ok, row); }catch(e){}
    s.checked = true; save(); if(!q.noCL) CLres(qid, !!r.ok, !!r.info);
  }
  btn.addEventListener('click', ()=>run());
  solBtn.addEventListener('click', ()=>{ sol.hidden=!sol.hidden; solBtn.textContent = sol.hidden ? 'Toon oplossing' : 'Verberg oplossing'; });
  if(quiz){
    quiz.push({
      grade:()=>{ const vals=inputs.map(i=>i.value.trim());
        if(q.choice && !s.c) return false;
        if(inputs.length && vals.every(v=>v==='') && !q.choice) return false;
        if(inputs.length && vals.some(v=>v==='') && !q.allowEmpty) return false;
        try{ return !!(q.check(vals, s.c)||{}).ok; }catch(e){ return false; } },
      reveal:(ok)=>{ inputs.forEach(inp=>{ inp.classList.remove('ok','bad'); inp.classList.add(ok?'ok':'bad'); }); optBtns.forEach(b=>{ if(b.dataset.val===s.c) b.classList.add(ok?'good':'wrong'); }); },
      lock:()=>{ inputs.forEach(i=>i.readOnly=true); optBtns.forEach(b=>b.disabled=true); }
    });
  } else if(s.checked) run();
}

function qChoice(parent, st, save, id, q){
  const row = el('div','q'); const qid = QID(id); if(!QZ) CLvraag(qid);
  row.append(el('div','q-text', (q.nr?`<span class="q-num">${q.nr}</span>`:'') + `<span class="stmt">${q.html}</span>`));
  const wrap = el('div','choices');
  const btns = q.opts.map(([val,label])=>{ const b=el('button','opt',label); b.type='button'; b.dataset.val=val; wrap.append(b); return b; });
  const fb = el('div','fb');
  row.append(wrap, fb); parent.append(row);
  const quiz = QZ;
  function apply(val, doSave){
    if(quiz){ btns.forEach(b=>b.classList.toggle('chosen', b.dataset.val===val)); if(doSave){ st[id]=val; save(); } return; }
    const ok = val === q.ans;
    btns.forEach(b=>{ b.classList.remove('chosen','good','wrong'); if(b.dataset.val===val) b.classList.add('chosen', ok?'good':'wrong'); });
    fb.className = 'fb ' + (ok?'ok':'bad');
    fb.innerHTML = (ok ? '✅ Juist! ' : '❌ Niet juist. ') + (q.why||'');
    if(doSave){ st[id]=val; save(); CLres(qid, ok); }
  }
  btns.forEach(b=> b.addEventListener('click', ()=>apply(b.dataset.val, true)));
  if(st[id]) apply(st[id], false);
  if(quiz) quiz.push({ grade:()=>st[id]===q.ans,
    reveal:(ok)=>btns.forEach(b=>{ if(b.dataset.val===st[id]) b.classList.add(ok?'good':'wrong'); }),
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

function bankEx(b, st, save, key, lines, words){
  const pool = el('div','pool'); b.append(pool);
  const list = el('div');
  const blanks = [], fbs = [];
  lines.forEach((ln,i)=>{
    const row = el('div','bank-line', `<span class="expr">${ln.expr}</span><span>${ln.pre}</span>`);
    const bl = el('span','blank'); bl.tabIndex=0; bl.dataset.i=i; bl.setAttribute('aria-label','vakje '+(i+1));
    const fb = el('div','fb');
    row.append(bl, fb); list.append(row); blanks.push(bl); fbs.push(fb);
  });
  b.append(list);
  const chips = {};
  const quiz = QZ; const qid = QID('sleep'); if(!quiz) CLvraag(qid);
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
    const ok = chip.dataset.w === lines[i].ans;
    chip.classList.remove('chip-ok','chip-bad'); chip.classList.add(ok?'chip-ok':'chip-bad');
    fbs[i].className = 'fb '+(ok?'ok':'bad');
    fbs[i].textContent = ok ? '✅ Juist! ' + lines[i].why : '❌ Niet juist. Probeer een ander woord.';
    if(lines.every((ln,j)=>st[j]!=null)) CLres(qid, lines.every((ln,j)=>st[j]===ln.ans));
  }
  shuffle(words).forEach(w=>{
    const c = el('span','chip', w); c.dataset.w = w; c.dataset.grp = key;
    draggable(c, (x,y)=>{ const bl = blanks.find(z=>inRect(z,x,y)); if(bl) place(bl,c); else toPool(c); });
    chips[w] = c; pool.append(c);
  });
  const tapPlace = bl => { if(selChip && selChip.dataset.grp===key){ const c=selChip; clearSel(); place(bl,c); } };
  blanks.forEach(bl=>{ bl.addEventListener('click', e=>{ if(e.target.closest('.chip')) return; tapPlace(bl); }); bl.addEventListener('keydown', e=>{ if(e.key==='Enter') tapPlace(bl); }); });
  pool.addEventListener('click', e=>{ if(e.target===pool && selChip && selChip.dataset.grp===key){ const c=selChip; clearSel(); toPool(c); } });
  Object.keys(st).forEach(i=>{ const c=chips[st[i]]; if(c && blanks[i]) place(blanks[i], c); });
  if(quiz) quiz.push({ grade:()=>lines.every((ln,i)=>st[i]===ln.ans),
    reveal:()=>blanks.forEach((bl,i)=>{ const c=bl.firstElementChild; if(c) c.classList.add(st[i]===lines[i].ans?'chip-ok':'chip-bad'); else bl.style.borderColor='var(--bad)'; }),
    lock:()=>Object.values(chips).forEach(c=>c.dataset.locked='1') });
}


function errBlock(parent, st, save, id, e){
  const row = el('div','q');
  row.append(el('div','q-text block', `<span class="q-num">${e.nr}</span><b>${e.task}</b>`));
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
      else { if(!s.tried.includes(i)) s.tried.push(i); save(); paint(); CLres(qid, false); fb.className='fb bad'; fb.textContent = `❌ Stap ${i+1} klopt wel. Zoek verder.`; }
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
    quiz.push({ grade:()=>s.pick===e.wrong, reveal:()=>{ btns[e.wrong].classList.add('found'); }, lock:()=>{ qLocked=true; } });
  } else paint();
}

/* --- proeftoets --- */
function proeftoets(b, st, save, key, items){
  const scoreTop = el('div'); b.append(scoreTop);
  const rows = [];
  items.forEach((q,i)=>{
    const row = el('div','q pt-q');
    row.append(el('div','pt-sec', `Vraag ${i+1} · ${q.sec}`));
    if(q.prompt) row.append(el('div','q-text block', q.prompt));
    const body = el('div'); row.append(body);
    const fb = el('div','fb'); row.append(fb);
    b.append(row);
    const sub = st['q'+i] || (st['q'+i] = {});
    QZ = [];
    try{ q.build(body, sub, save, key+'_q'+i); } finally { rows.push({q, row, fb, graders:QZ}); QZ = null; }
  });
  const actions = el('div','pt-actions');
  const bGrade = el('button','btn big','Verbeter mijn proeftoets'); bGrade.type='button';
  const bReset = el('button','btn ghost big','Begin opnieuw'); bReset.type='button';
  actions.append(bGrade, bReset); b.append(actions);
  const scoreBottom = el('div'); scoreBottom.style.marginTop='1rem'; b.append(scoreBottom);
  function grade(){
    let score = 0;
    rows.forEach(({q,row,fb,graders})=>{
      const res = graders.map(g=>{ try{ return !!g.grade(); }catch(e){ return false; } });
      const ok = res.length>0 && res.every(Boolean);
      if(ok) score++;
      graders.forEach((g,k)=>{ g.reveal && g.reveal(res[k]); g.lock && g.lock(); });
      row.classList.toggle('right', ok); row.classList.toggle('wrongq', !ok);
      fb.className = 'fb '+(ok?'ok':'bad');
      fb.innerHTML = ok ? '✅ Juist.' : '❌ Nog niet (helemaal) juist. Juist antwoord: ' + q.show;
    });
    const n = items.length, pct = score/n;
    const lvl = pct>=.9?'prima':pct>=.7?'goed':pct>=.5?'voldoende':'onvoldoende';
    const html = `<div class="score"><span class="big">${score} / ${n}</span><span>Ik ken de leerstof:</span><span class="lvl">${lvl}</span></div>`;
    scoreTop.innerHTML = html; scoreBottom.innerHTML = html; CLtoets(key, score, n);
    bGrade.disabled = true;
    st.done = true; save();
  }
  bGrade.addEventListener('click', ()=>{ grade(); scoreTop.scrollIntoView({behavior:'smooth', block:'start'}); });
  bReset.addEventListener('click', ()=>{ wipe(key); renderers[key](); });
  if(st.done) grade();
}

/* ============================================================
   INHOUD

/* ============================================================
   EXTRA STIJL VOOR DEZE MODULE (grafieken, assenstelsel, rekenblad, rekentoestel)
   ============================================================ */
(function(){
  const css = `
  /* de leerlingen werken op een Chromebook (liggend scherm): de module gebruikt de volle breedte, zodat tabel en grafiek naast elkaar passen */
  .shell{ max-width:1520px; }
  .nx{ display:grid; grid-template-columns:minmax(0,1.1fr) minmax(300px,1fr); gap:1.4rem; align-items:start; }
  .nx-l{ position:sticky; top:4.5rem; min-width:0; }
  .nx-l > .viz{ margin-top:0; max-width:none; }
  .nx-r{ min-width:0; }
  .nx.tv{ grid-template-columns:auto minmax(0,1fr); }
  .cg2{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1.2rem; align-items:start; }
  .cg-col{ min-width:0; }
  .cg-col .viz-bar .btn{ padding:.3rem .65rem; font-size:.82rem; }
  .cg-v{ min-height:260px; display:flex; align-items:center; justify-content:center; }
  .cg-v .ftab{ margin:0 auto; }
  @media (max-width: 900px){ .cg2{ grid-template-columns:minmax(0,1fr); } }
  .nx-r > :first-child{ margin-top:0; }
  @media (max-width: 900px){ .nx{ grid-template-columns:minmax(0,1fr); } .nx-l{ position:static; } }
  .ch{ width:100%; height:auto; display:block; overflow:visible; touch-action:none; user-select:none; -webkit-user-select:none; }
  .ch text{ fill:var(--ink); font-family:var(--f-body); font-size:13px; }
  .ch .t-soft{ fill:var(--ink-soft); }
  .ch .t-title{ font-weight:700; font-size:15px; }
  .ch .t-big{ font-size:17px; font-weight:700; }
  .ch .t-acc{ fill:var(--accent-dark); font-weight:700; }
  .ch .t-or{ fill:#c47f00; font-weight:700; }
  .ch .ax{ stroke:var(--ink); stroke-width:1.6; fill:none; }
  .ch .gr{ stroke:var(--border); stroke-width:1; }
  .ch .gr2{ stroke:var(--border); stroke-width:1; stroke-dasharray:3 3; }
  .ch .bar{ fill:var(--tq); }
  .ch .bar.hi, .ch .dot.hi{ fill:var(--orange); }
  .ch .dot{ fill:var(--tq); stroke:var(--card); stroke-width:1.5; }
  .ch .ln{ stroke:var(--tq); stroke-width:3; fill:none; stroke-linejoin:round; }
  .ch .ln2{ stroke:var(--orange); stroke-width:3; fill:none; stroke-linejoin:round; }
  .ch .pt{ fill:var(--tq); stroke:var(--card); stroke-width:2; }
  .ch .pt.or{ fill:var(--orange); }
  .ch .proj{ stroke:var(--orange); stroke-width:2.2; stroke-dasharray:6 5; fill:none; }
  .ch .hit{ fill:transparent; cursor:pointer; }
  .ch .sec{ stroke:var(--card); stroke-width:2; }
  .ch .brk{ stroke:var(--ink); stroke-width:1.6; fill:none; }
  .ch .arr{ stroke:var(--orange); stroke-width:2.5; fill:none; }
  .ch .q1{ fill:var(--tq-soft); }
  .ch .lab-bg{ fill:var(--card); }
  .ch .fade-in{ animation:m3fade .5s ease both; }
  @keyframes m3fade{ from{ opacity:0; } to{ opacity:1; } }
  .ch .grow{ transform-box:fill-box; transform-origin:bottom; animation:m3grow .7s ease both; }
  @keyframes m3grow{ from{ transform:scaleY(0); } to{ transform:scaleY(1); } }
  .ch .pop{ transform-box:fill-box; transform-origin:center; animation:m3pop .35s ease both; }
  @keyframes m3pop{ from{ transform:scale(0); } to{ transform:scale(1); } }
  .ch .draw{ stroke-dasharray:1000; stroke-dashoffset:1000; animation:m3draw 1.2s ease forwards; }
  @keyframes m3draw{ to{ stroke-dashoffset:0; } }
  .ch .dragme{ cursor:grab; }
  .viz{ background:var(--zone-bg); border:2px solid var(--border); border-radius:.9rem; padding:.7rem; margin:.4rem 0 .8rem; }
  .viz.narrow{ max-width:460px; }
  .viz.mid{ max-width:620px; }
  .viz-bar{ display:flex; flex-wrap:wrap; gap:.45rem; align-items:center; margin:.5rem 0 .2rem; }
  .viz-bar .lbl{ font-weight:700; color:var(--accent-dark); }
  .viz-bar input[type=range]{ flex:1; min-width:160px; accent-color:var(--orange); }
  .readout{ font-size:1.05rem; margin:.3rem 0; min-height:1.5em; }
  .readout b{ color:var(--accent-dark); }
  .bigq{ font-size:1.12rem; line-height:1.6; }
  .data-row{ display:flex; flex-wrap:wrap; gap:.35rem; margin:.4rem 0; }
  .data-row .dv{ min-width:2.6rem; text-align:center; padding:.3rem .5rem; border:2px solid var(--tq); border-radius:.5rem; background:var(--card); font-weight:700; font-variant-numeric:tabular-nums; transition:all .35s ease; }
  .data-row .dv.hi{ border-color:var(--orange); background:var(--or-soft); }
  .data-row .dv.gone{ opacity:.35; text-decoration:line-through; border-style:dashed; }
  .data-row .dv.mid{ border-color:var(--orange); background:var(--orange); color:#173436; transform:scale(1.12); }
  .data-row button.dv{ cursor:pointer; font:inherit; font-weight:700; color:var(--ink); }
  .data-row button.dv:hover:not(:disabled){ border-color:var(--orange); }
  .ftab{ border-collapse:collapse; margin:.4rem 0; font-variant-numeric:tabular-nums; display:block; max-width:100%; overflow-x:auto; width:max-content; }
  .ftab th, .ftab td{ border:2px solid var(--tq); padding:.35rem .7rem; text-align:center; }
  @media (max-width:520px){ .ftab th, .ftab td{ padding:.3rem .45rem; } }
  .ftab th{ background:var(--tq-soft); color:var(--accent-dark); }
  .ftab td.l{ text-align:left; }
  .ftab td.drop{ min-width:9rem; cursor:pointer; text-align:left; }
  .ftab td.drop:hover{ background:var(--or-soft); }
  .ftab .tally{ font-family:var(--f-body); letter-spacing:.08em; font-weight:700; color:var(--accent-dark); }
  .ftab .inp{ width:4.5rem; }
  .sortbins{ display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:.7rem; margin-top:.6rem; }
  .sortbin{ border:2px dashed var(--tq); border-radius:.8rem; min-height:6rem; padding:.5rem; background:var(--zone-bg); }
  .sortbin h4{ margin:0 0 .4rem; color:var(--accent-dark); }
  .sortbin .chips{ display:flex; flex-wrap:wrap; gap:.35rem; }
  .shake{ animation:m3shake .35s; }
  @keyframes m3shake{ 0%,100%{ transform:translateX(0); } 25%{ transform:translateX(-6px); } 75%{ transform:translateX(6px); } }
  .flyer{ position:fixed; z-index:50; pointer-events:none; transition:all .55s cubic-bezier(.5,.1,.3,1); }
  .checklist{ list-style:none; padding:0; margin:.5rem 0; }
  .checklist li{ padding:.15rem 0; }
  .checklist li.ok::before{ content:'✅ '; } .checklist li.bad::before{ content:'❌ '; } .checklist li.todo::before{ content:'⬜ '; }
  .sent{ display:flex; flex-wrap:wrap; gap:.35rem; align-items:center; }
  .avatars{ display:grid; grid-template-columns:repeat(auto-fill,minmax(64px,1fr)); gap:.4rem; }
  .avatar{ border:2px solid var(--tq); border-radius:.7rem; background:var(--card); padding:.3rem .2rem; text-align:center; cursor:pointer; font:inherit; color:var(--ink); }
  .avatar.done{ border-color:var(--orange); background:var(--or-soft); }
  .avatar .say{ display:block; font-size:.78rem; font-weight:700; color:var(--accent-dark); min-height:1.1em; }
  .memgrid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(70px,1fr)); gap:.4rem; }
  .memgrid .mi{ font-size:2rem; text-align:center; padding:.35rem; border:2px solid var(--border); border-radius:.6rem; background:var(--card); }
  .memgrid button.mi{ cursor:pointer; }
  .memgrid .mi.sel{ border-color:var(--orange); background:var(--or-soft); }
  .memgrid .mi.ok{ border-color:var(--ok); background:var(--ok-bg); }
  .memgrid .mi.bad{ border-color:var(--bad); background:var(--bad-bg); }
  .memgrid .mi.miss{ border-style:dashed; border-color:var(--ok); }
  .rt-box{ height:170px; border-radius:1rem; border:3px solid var(--tq); display:flex; align-items:center; justify-content:center; font-size:1.25rem; font-weight:700; cursor:pointer; user-select:none; background:var(--tq-soft); color:var(--ink); text-align:center; padding:1rem; }
  .rt-box.go{ background:var(--orange); border-color:var(--orange); color:#173436; }
  .headline{ border-left:6px solid var(--orange); padding:.4rem .8rem; font-size:1.15rem; font-weight:700; background:var(--or-soft); border-radius:.4rem; margin:.3rem 0 .6rem; }
  .labbox textarea{ width:100%; min-height:7rem; font:inherit; padding:.5rem; border:2px solid var(--tq); border-radius:.6rem; background:var(--card); color:var(--ink); }
  .two{ display:grid; grid-template-columns:1fr 1fr; gap:1rem; align-items:start; }
  @media (max-width:760px){ .two{ grid-template-columns:1fr; } }
  .formula{ font-family:ui-monospace, Consolas, monospace; background:var(--tq-soft); padding:.05rem .35rem; border-radius:.3rem; }
  .pill{ display:inline-block; padding:.05rem .5rem; border-radius:1rem; background:var(--or-soft); border:1px solid var(--or-line); font-weight:700; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* ============================================================
   GETALLEN EN STATISTIEK
   ============================================================ */
const fmt = s => String(s).replace(/(^|[\s(;,])-(?=\d)/g,'$1−');
/* getal netjes met komma, hoogstens d decimalen, spatie als duizendtalscheiding */
function nf(x, d=2){
  if(x==null || isNaN(x)) return '';
  let r = Math.round(x*Math.pow(10,d))/Math.pow(10,d);
  if(Object.is(r,-0)) r = 0;
  let [i, f] = Math.abs(r).toFixed(d).split('.');
  f = (f||'').replace(/0+$/,'');
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  return (r<0?'−':'') + i + (f?','+f:'');
}
const sum = a => a.reduce((s,x)=>s+x,0);
const mean = a => sum(a)/a.length;
const sorted = a => a.slice().sort((x,y)=>x-y);
function median(a){ const s=sorted(a), n=s.length; return n%2 ? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2; }
function modes(a){ const c=new Map(); a.forEach(x=>c.set(x,(c.get(x)||0)+1)); const m=Math.max(...c.values()); return [...c.keys()].filter(k=>c.get(k)===m).sort((x,y)=>x-y); }
const range = a => Math.max(...a)-Math.min(...a);
const expand = (vals, fr) => vals.flatMap((v,i)=>Array(fr[i]).fill(v));
const countOf = (a, v) => a.filter(x=>x===v).length;
/* invoer met tolerantie: komma of punt, spaties, min-tekens */
function parseLoose(s){ const t = String(s).trim().replace(/\s+/g,'').replace(/[−–]/g,'-').replace(/%$/,'').replace(',', '.'); if(!/^-?\d*\.?\d+$/.test(t)) return NaN; return Number(t); }
/* getal juist binnen een tolerantie (voor afgeronde antwoorden) */
const approx = (t, tol=0.005, hint) => v => { const x=parseLoose(v[0]); if(isNaN(x)) return {ok:false, msg:'Typ enkel een getal.'}; const ok=Math.abs(x-t)<=tol+1e-9; return {ok, msg: ok?'':(hint||'')}; };
const exact = (t, hint) => approx(t, 1e-9, hint);
/* meerdere getallen tegelijk */
const nums = (ts, tol=1e-9, hint) => v => { const xs=v.map(parseLoose); if(xs.some(isNaN)) return {ok:false, msg:'Typ in elk vakje een getal.'}; const f=xs.map((x,i)=>Math.abs(x-ts[i])<=tol+1e-9); return {ok:f.every(Boolean), fields:f, msg:f.every(Boolean)?'':(hint||'')}; };
/* tekstantwoord (hoofdletters en spaties maken niet uit) */
const words = (opts, hint) => v => { const t=String(v[0]).trim().toLowerCase().replace(/\s+/g,' '); return {ok: opts.some(o=>o.toLowerCase()===t), msg:hint||''}; };

/* ============================================================
   ICONEN
   ============================================================ */
const ICONS = {
  coord:'<path d="M12 3v18M3 12h18"/><circle cx="17" cy="7" r="1.8" fill="currentColor"/><path d="M17 7v5M17 7h-5" stroke-dasharray="2 2"/>',
  lijn:'<path d="M3 20h18M3 20V4"/><path d="M5 16l4-5 4 3 6-8"/>',
  soort:'<rect x="3" y="4" width="7" height="7" rx="1.5"/><text x="6.5" y="9.8" text-anchor="middle" font-size="6" fill="currentColor" stroke="none">A</text><rect x="14" y="13" width="7" height="7" rx="1.5"/><text x="17.5" y="18.8" text-anchor="middle" font-size="6" fill="currentColor" stroke="none">7</text><path d="M10 7.5h3.5v5.5"/>',
  freq:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M10 4v16"/><path d="M12.5 12.5v5M14.5 12.5v5M16.5 12.5v5M18.5 12.5v5M12 17l7-4"/>',
  diagram:'<path d="M3 20h18"/><rect x="5" y="11" width="3" height="9"/><rect x="10.5" y="6" width="3" height="14"/><rect x="16" y="14" width="3" height="6"/>',
  taart:'<circle cx="12" cy="12" r="8.5"/><path d="M12 12V3.5M12 12l6.5 5.5"/>',
  mislei:'<path d="M3 20h18M3 20V4"/><rect x="6" y="14" width="4" height="6"/><rect x="13" y="5" width="4" height="15"/><path d="M2 9l2-1-2-1M2 12l2-1-2-1"/>',
  modus:'<path d="M3 20h18"/><circle cx="7" cy="17" r="1.6"/><circle cx="12" cy="17" r="1.6"/><circle cx="12" cy="13" r="1.6"/><circle cx="12" cy="9" r="1.6" fill="currentColor"/><circle cx="17" cy="17" r="1.6"/><circle cx="17" cy="13" r="1.6"/>',
  gem:'<path d="M3 18h18"/><path d="M12 18l-3 3h6z"/><circle cx="5" cy="15" r="1.6"/><circle cx="10" cy="15" r="1.6"/><circle cx="19" cy="15" r="1.6"/>',
  med:'<path d="M12 3v18" stroke-dasharray="2 2"/><rect x="3" y="9" width="4" height="6" rx="1"/><rect x="17" y="9" width="4" height="6" rx="1"/><rect x="10" y="9" width="4" height="6" rx="1" fill="currentColor"/>',
  interp:'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/><path d="M7.5 12l2-3 2 2 2-3"/>',
  toestel:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="7.5" y="5" width="9" height="4.5" rx=".8"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01"/>',
  rekenblad:'<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16"/>',
  rbgraf:'<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M7 17v-4M11 17V9M15 17v-6M19 17V8" />',
  onderzoek:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
  experiment:'<circle cx="12" cy="13" r="7.5"/><path d="M12 13V8.5M12 13l3 2M10 2.5h4M12 2.5v3"/>',
  datalab:'<path d="M4 20V10M9 20V4M14 20v-7M19 20v-11"/><circle cx="19" cy="5" r="1.5" fill="currentColor"/>',
  fout:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5M8.5 8.5l5 5M13.5 8.5l-5 5"/>',
  toets:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  cheat:'<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 14.5h7M9 18h4"/>'
};
const icon = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]||''}</svg>`;
const LVL = {1:'<span class="lvl-badge l1">basis</span>', 2:'<span class="lvl-badge l2">oefenen</span>', 3:'<span class="lvl-badge l3">verdieping</span>'};
const LET = 'abcdefghijklmnop';
const list = (items, opts={}) => (b, st, save, key) => items.forEach((q,i)=> qBlock(b, st, save, key+'_'+i, Object.assign({nr:(opts.letters?LET[i]+'.':(opts.nums?(i+1)+'.':''))}, opts.defaults||{}, q)));
const choiceList = (items, opts) => (b, st, save, key) => items.forEach(([html,ans,why],i)=> qChoice(b, st, save, key+'_'+i, {html, ans, why, opts, nr:items.length>1?(i+1)+'.':''}));
const WN = [['w','Waar'],['n','Niet waar']];
/* een blok met vrije inhoud (uitleg, figuur) gevolgd door vragen */
const combo = (...parts) => (b, st, save, key) => parts.forEach((p,i)=> typeof p==='string' ? b.append(el('div','', p)) : p(b, st, save, key+'_'+i));
const html = s => b => b.append(el('div','', s));

/* ============================================================
   SVG-HULP
   ============================================================ */
const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs={}, parent){ const e=document.createElementNS(NS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.append(e); return e; }
function svgText(parent, x, y, txt, attrs={}){ const t=svgEl('text', Object.assign({x, y}, attrs), parent); t.textContent = txt; return t; }
function newSvg(w, h, cls){ const s=svgEl('svg', {viewBox:`0 0 ${w} ${h}`, class:'ch '+(cls||''), role:'img'}); return s; }
const DARKPAL = new Set(['#127a7f','#4f6668','#4472c4','#264478','#9e480e','#ed7d31','#70ad47','#4285f4','#ea4335','#34a853','#ff6d01']);
const PAL = ['#3bc1c5','#fcaf17','#127a7f','#fdd27a','#8fd8db','#4f6668','#e8890c','#b3e3e5'];
const sleep = ms => new Promise(r=>setTimeout(r, ms));
/* mooie stap voor een as */
function niceStep(maxV, ticks=6){ const raw=maxV/ticks; const p=Math.pow(10,Math.floor(Math.log10(raw||1))); for(const m of [1,2,2.5,5,10]){ if(raw<=m*p) return m*p; } return 10*p; }

/* ============================================================
   GRAFIEKEN TEKENEN
   type: 'kolom' (staven rechtop), 'staaf' (liggend), 'lijn', 'cirkel', 'strook', 'dot'
   d = { labels:[...], series:[{name, values:[...]}], title, xTitle, yTitle, yMin, yMax, step, hi:[indexen], anim:true, pct:true }
   ============================================================ */
function drawChart(type, d, W=560, H=330){
  const svg = newSvg(W, H);
  const labels = d.labels, series = d.series;
  const anim = d.anim !== false;
  if(d.title) svgText(svg, W/2, 20, d.title, {class:'t-title', 'text-anchor':'middle'});
  if(type==='cirkel' || type==='strook'){
    const vals = series[0].values.map(v=>Math.max(0, +v||0)), tot = sum(vals) || 1;
    if(type==='cirkel'){
      const cx = W*0.36, cy = H/2+12, r = Math.min(H/2-30, W*0.3);
      let a0 = -Math.PI/2;
      vals.forEach((v,i)=>{
        const a1 = a0 + v/tot*2*Math.PI;
        const large = (a1-a0)>Math.PI?1:0;
        const p = v>=tot-1e-9 ? svgEl('circle',{cx,cy,r,fill:(d.pal||PAL)[i%PAL.length],class:'sec'},svg)
          : svgEl('path',{d:`M${cx},${cy} L${cx+r*Math.cos(a0)},${cy+r*Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx+r*Math.cos(a1)},${cy+r*Math.sin(a1)} Z`, fill:(d.pal||PAL)[i%PAL.length], class:'sec'+(anim?' pop':'')}, svg);
        if(anim) p.style.animationDelay = (i*0.12)+'s';
        const am = (a0+a1)/2;
        if(v/tot>0.045){ const t = svgText(svg, cx+r*0.66*Math.cos(am), cy+r*0.66*Math.sin(am)+5, d.pct===false? nf(v):nf(v/tot*100,0)+' %', {'text-anchor':'middle', class:'t-big'}); t.style.fill=DARKPAL.has((d.pal||PAL)[i%PAL.length])?'#ffffff':'#173436'; }
        a0 = a1;
      });
      labels.forEach((l,i)=>{ const y = 50+i*24; svgEl('rect',{x:W*0.7, y:y-12, width:16, height:16, rx:3, fill:(d.pal||PAL)[i%PAL.length]}, svg); svgText(svg, W*0.7+22, y+1, l); });
    } else {
      const x0 = 20, x1 = W-20, y = 70, h = 56; let x = x0;
      vals.forEach((v,i)=>{ const w=(x1-x0)*v/tot; const r=svgEl('rect',{x, y, width:Math.max(0,w), height:h, fill:(d.pal||PAL)[i%PAL.length], class:'sec'+(anim?' fade-in':'')}, svg); if(anim) r.style.animationDelay=(i*0.12)+'s';
        if(v/tot>0.06){ const t=svgText(svg, x+w/2, y+h/2+6, nf(v/tot*100,0)+' %', {'text-anchor':'middle', class:'t-big'}); t.style.fill=DARKPAL.has((d.pal||PAL)[i%PAL.length])?'#ffffff':'#173436'; }
        x += w; });
      labels.forEach((l,i)=>{ const col=i%3, row=Math.floor(i/3); const lx=x0+col*(W-40)/3, ly=y+h+36+row*24; svgEl('rect',{x:lx, y:ly-12, width:16, height:16, rx:3, fill:(d.pal||PAL)[i%PAL.length]}, svg); svgText(svg, lx+22, ly+1, l); });
      svg.setAttribute('viewBox', `0 0 ${W} ${y+h+40+Math.ceil(labels.length/3)*24}`);
    }
    return svg;
  }
  /* assen */
  const horiz = type==='staaf';
  const L = horiz ? 130 : 62, R = 16, T = (d.title ? 40 : 18) + (d.yTitle && !horiz ? 16 : 0), B = 62;
  const pw = W-L-R, ph = H-T-B;
  const allV = series.flatMap(s=>s.values.map(Number)).filter(v=>!isNaN(v));
  let yMin = d.yMin!=null ? d.yMin : 0;
  let yMax = d.yMax!=null ? d.yMax : Math.max(...allV, yMin+1);
  if(type==='dot'){ yMax = Math.max(...allV, 4); }
  const step = d.step || niceStep(yMax-yMin);
  if(d.yMax==null) yMax = Math.ceil(yMax/step)*step;
  if(yMax<=yMin) yMax = yMin+step;
  const n = labels.length;
  const vToP = v => (v-yMin)/(yMax-yMin);
  if(type==='dot'){
    /* dotplot: as onderaan, bolletjes gestapeld */
    const base = H-B+6, xs = i => L + pw*(i+0.5)/n;
    svgEl('line',{x1:L-10, y1:base, x2:L+pw+6, y2:base, class:'ax'}, svg);
    const rr = Math.min(11, pw/n/2.6, (base-T-10)/(2.15*yMax));
    labels.forEach((l,i)=>{ svgEl('line',{x1:xs(i), y1:base, x2:xs(i), y2:base+5, class:'ax'}, svg); svgText(svg, xs(i), base+21, l, {'text-anchor':'middle'});
      const v = +series[0].values[i]||0;
      for(let k=0;k<v;k++){ const c=svgEl('circle',{cx:xs(i), cy:base-rr-2-k*rr*2.15, r:rr, class:'dot'+((d.hi||[]).includes(i)?' hi':'')+(anim?' pop':'')}, svg); if(anim) c.style.animationDelay=(i*0.08+k*0.05)+'s'; } });
    if(d.xTitle) svgText(svg, L+pw/2, H-10, d.xTitle, {'text-anchor':'middle', class:'t-soft'});
    svg._xs = xs; svg._base = base; svg._r = rr;
    return svg;
  }
  /* rooster en waarden op de as */
  for(let v=yMin; v<=yMax+1e-9; v+=step){
    const p = vToP(v);
    if(horiz){ const x=L+pw*p; svgEl('line',{x1:x, y1:T, x2:x, y2:T+ph, class:'gr'}, svg); svgText(svg, x, T+ph+18, nf(v), {'text-anchor':'middle', class:'t-soft'}); }
    else { const y=T+ph*(1-p); svgEl('line',{x1:L, y1:y, x2:L+pw, y2:y, class:'gr'}, svg); svgText(svg, L-8, y+4, nf(v), {'text-anchor':'end', class:'t-soft'}); }
  }
  const ns = series.length;
  if(type==='lijn'){
    const xs = i => L + (n===1? pw/2 : pw*i/(n-1));
    series.forEach((s,si)=>{
      const pts = s.values.map((v,i)=> (v===''||v==null||isNaN(+v))?null:[xs(i), T+ph*(1-vToP(+v))]).filter(Boolean);
      if(pts.length>1){ const pl=svgEl('polyline',{points:pts.map(p=>p.join(',')).join(' '), class:(si%2?'ln2':'ln')+(anim?' draw':'')}, svg); if(ns>1 && si>1) pl.style.stroke=(d.pal||PAL)[si%PAL.length]; }
      pts.forEach(p=>{ const c=svgEl('circle',{cx:p[0], cy:p[1], r:4.5, class:'pt'+(si%2?' or':'')}, svg); if(ns>1 && si>1) c.style.fill=(d.pal||PAL)[si%PAL.length]; });
    });
    labels.forEach((l,i)=> svgText(svg, xs(i), T+ph+20, l, {'text-anchor':'middle'}));
    svg._xs = xs;
  } else {
    const slot = (horiz?ph:pw)/n, bw = slot*0.62/ns;
    labels.forEach((l,i)=>{
      series.forEach((s,si)=>{
        const v = +s.values[i]; if(isNaN(v)) return;
        const p = Math.max(0, vToP(Math.max(v,yMin)));
        let r;
        if(horiz){ const y = T+slot*i+slot*0.19+bw*si; r=svgEl('rect',{x:L, y, width:pw*p, height:bw, class:'bar'+((d.hi||[]).includes(i)?' hi':'')+(anim?' fade-in':'')}, svg); }
        else { const x = L+slot*i+slot*0.19+bw*si; r=svgEl('rect',{x, y:T+ph*(1-p), width:bw, height:ph*p, class:'bar'+((d.hi||[]).includes(i)?' hi':'')+(anim?' grow':'')}, svg); }
        if(ns>1) r.style.fill = (d.pal||PAL)[si%PAL.length];
        if(anim) r.style.animationDelay = (i*0.07)+'s';
        if(d.values){ if(horiz) svgText(svg, L+pw*p+6, T+slot*i+slot*0.19+bw*si+bw/2+5, nf(v)); else svgText(svg, L+slot*i+slot*0.19+bw*si+bw/2, T+ph*(1-p)-6, nf(v), {'text-anchor':'middle'}); }
      });
      if(horiz) svgText(svg, L-8, T+slot*(i+0.5)+5, l, {'text-anchor':'end'});
      else svgText(svg, L+slot*(i+0.5), T+ph+20, l, {'text-anchor':'middle'});
    });
    svg._slot = slot;
  }
  /* assen */
  svgEl('line',{x1:L, y1:T+ph, x2:L+pw, y2:T+ph, class:'ax'}, svg);
  svgEl('line',{x1:L, y1:T, x2:L, y2:T+ph, class:'ax'}, svg);
  if(yMin>0 && !horiz && d.brk!==false){ /* zigzag: de as begint niet bij 0 */
    const y=T+ph; svgEl('path',{d:`M${L-7},${y-14} l7,-4 l-7,-4 l7,-4`, class:'brk'}, svg);
  }
  if(d.xTitle) svgText(svg, L+pw/2, H-14, d.xTitle, {'text-anchor':'middle', class:'t-soft'});
  if(d.yTitle){ if(horiz) svgText(svg, L+pw/2, H-14, d.yTitle, {'text-anchor':'middle', class:'t-soft'}); else svgText(svg, 8, T-14, d.yTitle, {class:'t-soft'}); }
  if(ns>1){ series.forEach((s,si)=>{ const x=L+10+si*120, y=H-14; svgEl('rect',{x, y:y-11, width:14, height:14, rx:3, fill:(d.pal||PAL)[si%PAL.length]}, svg); svgText(svg, x+19, y+1, s.name); }); }
  svg._L=L; svg._T=T; svg._pw=pw; svg._ph=ph; svg._yMin=yMin; svg._yMax=yMax; svg._n=n;
  return svg;
}
const chartBox = (type, d, cls) => b => { const v=el('div','viz '+(cls||'mid')); v.append(drawChart(type, d)); b.append(v); };
/* een getoonde frequentietabel */
function ftabHTML(head, rows, opts={}){
  let h = `<table class="ftab"><thead><tr>${head.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>`;
  rows.forEach(r=> h += `<tr>${r.map((c,i)=>`<td${i===0?' class="l"':''}>${c}</td>`).join('')}</tr>`);
  return h + '</tbody></table>';
}

/* ============================================================
   ASSENSTELSEL
   ============================================================ */
const SECTIONS = [];
const coStr = (x,y) => `(${fmt(x)}, ${fmt(y)})`;
function plane(opts={}){
  const mn = opts.min ?? -6, mx = opts.max ?? 6, u = opts.u || 34;
  const ymn = opts.ymin ?? mn, ymx = opts.ymax ?? mx;
  const W = (mx-mn+2)*u, H = (ymx-ymn+2)*u;
  const svg = newSvg(W, H);
  const X = x => (x-mn+1)*u, Y = y => (ymx-y+1)*u;
  if(opts.quad){ /* kwadranten licht kleuren */
    [['I',1,1],['II',-1,1],['III',-1,-1],['IV',1,-1]].forEach(([n,sx,sy])=>{
      const x0 = sx>0?X(0):X(mn)-u/2, x1 = sx>0?X(mx)+u/2:X(0), y0 = sy>0?Y(ymx)-u/2:Y(0), y1 = sy>0?Y(0):Y(ymn)+u/2;
      const r = svgEl('rect',{x:x0, y:y0, width:x1-x0, height:y1-y0, class:'q1'}, svg); r.style.opacity = (n==='I'||n==='III')?'.9':'.45';
      svgText(svg, (x0+x1)/2, (y0+y1)/2+8, 'kwadrant '+n, {'text-anchor':'middle', class:'t-soft'}).style.fontSize='18px';
    });
  }
  for(let x=mn;x<=mx;x++) svgEl('line',{x1:X(x), y1:Y(ymx)-u/2, x2:X(x), y2:Y(ymn)+u/2, class:'gr'}, svg);
  for(let y=ymn;y<=ymx;y++) svgEl('line',{x1:X(mn)-u/2, y1:Y(y), x2:X(mx)+u/2, y2:Y(y), class:'gr'}, svg);
  svgEl('line',{x1:X(mn)-u/2, y1:Y(0), x2:X(mx)+u*0.7, y2:Y(0), class:'ax'}, svg);
  svgEl('line',{x1:X(0), y1:Y(ymn)+u/2, x2:X(0), y2:Y(ymx)-u*0.7, class:'ax'}, svg);
  svgEl('path',{d:`M${X(mx)+u*0.7},${Y(0)} l-9,-5 v10 z`, fill:'currentColor', class:'ax'}, svg);
  svgEl('path',{d:`M${X(0)},${Y(ymx)-u*0.7} l-5,9 h10 z`, fill:'currentColor', class:'ax'}, svg);
  svgText(svg, X(mx)+u*0.55, Y(0)+20, 'x', {class:'t-acc'}).style.fontStyle='italic';
  svgText(svg, X(0)+10, Y(ymx)-u*0.45, 'y', {class:'t-acc'}).style.fontStyle='italic';
  const tx = {}, ty = {};
  for(let x=mn;x<=mx;x++){ if(x===0) continue; svgEl('line',{x1:X(x), y1:Y(0)-4, x2:X(x), y2:Y(0)+4, class:'ax'}, svg); tx[x]=svgText(svg, X(x), Y(0)+18, fmt(x), {'text-anchor':'middle', class:'t-soft'}); }
  for(let y=ymn;y<=ymx;y++){ if(y===0) continue; svgEl('line',{x1:X(0)-4, y1:Y(y), x2:X(0)+4, y2:Y(y), class:'ax'}, svg); ty[y]=svgText(svg, X(0)-8, Y(y)+5, fmt(y), {'text-anchor':'end', class:'t-soft'}); }
  svgText(svg, X(0)-8, Y(0)+18, '0', {'text-anchor':'end', class:'t-soft'});
  const layer = svgEl('g', {}, svg), top = svgEl('g', {}, svg);
  function toData(ev){ const pt = svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return [Math.round(p.x/u - 1 + mn), Math.round(ymx - (p.y/u - 1))]; }
  function point(x, y, name, cls){ const g = svgEl('g', {class:'pop'}, layer); svgEl('circle',{cx:X(x), cy:Y(y), r:6.5, class:'pt '+(cls||'')}, g); if(name){ const t=svgText(g, X(x)+9, Y(y)-9, name, {class:'t-big'}); } return g; }
  /* projectie-animatie: eerst naar de x-as, dan naar de y-as */
  async function project(x, y, name, speed=1){
    const g = svgEl('g', {}, top);
    const lv = svgEl('line',{x1:X(x), y1:Y(y), x2:X(x), y2:Y(y), class:'proj'}, g);
    const steps = 18;
    for(let i=1;i<=steps;i++){ lv.setAttribute('y2', Y(y)+(Y(0)-Y(y))*i/steps); await sleep(22/speed); }
    if(tx[x]){ tx[x].classList.add('t-or'); tx[x].style.fontSize='17px'; }
    const b1 = svgText(g, X(x), Y(0)+(y>0?38:-12), 'x = '+fmt(x), {'text-anchor':'middle', class:'t-or'});
    await sleep(500/speed);
    const lh = svgEl('line',{x1:X(x), y1:Y(y), x2:X(x), y2:Y(y), class:'proj'}, g);
    for(let i=1;i<=steps;i++){ lh.setAttribute('x2', X(x)+(X(0)-X(x))*i/steps); await sleep(22/speed); }
    if(ty[y]){ ty[y].classList.add('t-or'); ty[y].style.fontSize='17px'; }
    svgText(g, X(0)+(x>0?-34:10), Y(y)-8, 'y = '+fmt(y), {'text-anchor':x>0?'end':'start', class:'t-or'});
    await sleep(500/speed);
    const lab = svgText(g, X(x)+(x>=0?12:-12), Y(y)+24, (name||'P')+coStr(x,y), {'text-anchor':x>=0?'start':'end', class:'t-big'});
    lab.classList.add('fade-in');
    return ()=>{ g.remove(); Object.values(tx).concat(Object.values(ty)).forEach(t=>{ t.classList.remove('t-or'); t.style.fontSize=''; }); };
  }
  return {svg, X, Y, u, mn, mx, ymn, ymx, layer, top, toData, point, project};
}
const planeBox = (svg, cls) => { const v = el('div','viz '+(cls||'narrow')); v.append(svg); return v; };

/* --- demo: zo lees je een coördinaat af --- */
function coordDemo(b, pts){
  const P = plane(); pts.forEach(p=>P.point(p[0],p[1],p[2]));
  const v = planeBox(P.svg); b.append(v);
  const bar = el('div','viz-bar');
  const btns = pts.map(p=>{ const k=el('button','btn ghost', `▶ ${p[2]} aflezen`); k.type='button'; bar.append(k); return k; });
  b.append(bar);
  let clear = null, busy = false;
  btns.forEach((k,i)=>k.addEventListener('click', async ()=>{ if(busy) return; busy=true; if(clear) clear(); clear = await P.project(pts[i][0], pts[i][1], pts[i][2]); busy=false; }));
}

/* --- coördinaten aflezen: invulvakken per punt, met animatie na het controleren --- */
function coordRead(b, st, save, key, pts){
  const P = plane(); pts.forEach(p=>P.point(p[0],p[1],p[2]));
  const wrap = el('div','two'); const left = el('div'); const right = el('div');
  left.append(planeBox(P.svg)); wrap.append(left, right); b.append(wrap);
  let clear = null;
  pts.forEach((p,i)=> qBlock(right, st, save, key+'_'+i, {
    html:`<span class="bigq">${p[2]}( [[0]] , [[1]] )</span>`, size:'xs',
    check: v => { const r = nums([p[0],p[1]])(v); if(!r.ok){ const a=parseLoose(v[0]), c=parseLoose(v[1]); if(a===p[1] && c===p[0] && p[0]!==p[1]) r.msg='Je wisselde de twee getallen om. Eerst x (horizontaal), dan y (verticaal).'; else if(Math.abs(a)===Math.abs(p[0]) && Math.abs(c)===Math.abs(p[1])) r.msg='Let op de tekens: links van de y-as is x negatief, onder de x-as is y negatief.'; } return r; },
    sol:`Loodrecht naar de x-as: x = ${fmt(p[0])}. Loodrecht naar de y-as: y = ${fmt(p[1])}. Dus <b>${p[2]}${coStr(p[0],p[1])}</b>.`,
    after: async ok => { if(QZ || !ok) return; if(clear) clear(); clear = await P.project(p[0], p[1], p[2], 1.6); }
  }));
}

/* --- punten zelf aanklikken in het assenstelsel --- */
function coordPlace(b, st, save, key, targets, opts={}){
  const P = plane({quad:opts.quad});
  const prompt = el('div','readout bigq'); b.append(prompt);
  b.append(planeBox(P.svg, 'narrow'));
  const fb = el('div','fb'); b.append(fb);
  const quiz = QZ;
  const done = st.done || (st.done = {});
  const ids = targets.map((t,i)=>QID('klik'+i)); if(!quiz) ids.forEach(id=>CLvraag(id));
  const marks = {};
  function cur(){ return targets.findIndex((t,i)=>!done[i]); }
  function paint(){
    Object.values(marks).forEach(m=>m.remove());
    targets.forEach((t,i)=>{ if(done[i]) marks[i] = P.point(done[i][0], done[i][1], t[2], quiz? 'or' : ''); });
    const c = cur();
    prompt.innerHTML = c<0 ? (quiz? 'Alle punten staan in het assenstelsel.' : '✅ Alle punten staan juist.') : `Klik op het punt <b>${targets[c][2]}${coStr(targets[c][0], targets[c][1])}</b>.`;
  }
  P.svg.addEventListener('click', async ev=>{
    const c = cur(); if(c<0 || P.svg.dataset.locked) return;
    const [x,y] = P.toData(ev);
    if(x<P.mn || x>P.mx || y<P.ymn || y>P.ymx) return;
    const t = targets[c];
    if(quiz){ done[c] = [x,y]; save(); paint(); return; }
    const ok = x===t[0] && y===t[1];
    if(ok){ done[c] = [x,y]; save(); paint(); fb.className='fb ok'; fb.innerHTML = `✅ Juist! ${t[2]} ligt ${t[0]===0?'op de y-as':t[1]===0?'op de x-as':kwadrant(t[0],t[1])}.`; CLres(ids[c], true);
      const cl = await P.project(t[0], t[1], t[2], 2); setTimeout(cl, 1200); }
    else {
      const wrong = P.point(x, y, '', 'or'); setTimeout(()=>wrong.remove(), 1400);
      fb.className='fb bad';
      let m = `Je klikte op ${coStr(x,y)}. `;
      if(x===t[1] && y===t[0]) m += 'Je wisselde x en y om: eerst ga je horizontaal (x), dan verticaal (y).';
      else if(Math.abs(x)===Math.abs(t[0]) && Math.abs(y)===Math.abs(t[1])) m += 'Kijk naar de tekens: een negatieve x ligt links van de y-as, een negatieve y onder de x-as.';
      else m += `Start in de oorsprong: ${Math.abs(t[0])} ${t[0]<0?'naar links':'naar rechts'}, dan ${Math.abs(t[1])} ${t[1]<0?'naar onder':'naar boven'}.`;
      fb.textContent = '❌ ' + m; CLres(ids[c], false);
    }
  });
  paint();
  if(quiz) quiz.push({ grade:()=>targets.every((t,i)=>done[i] && done[i][0]===t[0] && done[i][1]===t[1]),
    reveal:ok=>{ if(!ok) targets.forEach(t=>P.point(t[0],t[1],t[2])); }, lock:()=>{ P.svg.dataset.locked='1'; } });
}
function kwadrant(x,y){ if(x===0||y===0) return x===0&&y===0?'in de oorsprong':(x===0?'op de y-as':'op de x-as'); return 'in kwadrant '+(x>0?(y>0?'I':'IV'):(y>0?'II':'III')); }
const KW = [['I','I'],['II','II'],['III','III'],['IV','IV'],['as','op een as']];
const kwAns = (x,y) => (x===0||y===0)?'as':(x>0?(y>0?'I':'IV'):(y>0?'II':'III'));

/* --- ontdek: sleep het punt en kijk naar de tekens --- */
function coordExplore(b){
  const P = plane({quad:true});
  const out = el('div','readout bigq');
  b.append(planeBox(P.svg), out);
  let x = 3, y = 2;
  const g = svgEl('g', {class:'dragme'}, P.top);
  const c = svgEl('circle',{r:11, class:'pt or'}, g);
  const lv = svgEl('line',{class:'proj'}, P.layer), lh = svgEl('line',{class:'proj'}, P.layer);
  function paint(){
    c.setAttribute('cx', P.X(x)); c.setAttribute('cy', P.Y(y));
    lv.setAttribute('x1',P.X(x)); lv.setAttribute('y1',P.Y(y)); lv.setAttribute('x2',P.X(x)); lv.setAttribute('y2',P.Y(0));
    lh.setAttribute('x1',P.X(x)); lh.setAttribute('y1',P.Y(y)); lh.setAttribute('x2',P.X(0)); lh.setAttribute('y2',P.Y(y));
    const sx = x>0?'positief':x<0?'negatief':'nul', sy = y>0?'positief':y<0?'negatief':'nul';
    out.innerHTML = `P<b>${coStr(x,y)}</b> · x is <b>${sx}</b>, y is <b>${sy}</b> · P ligt <b>${kwadrant(x,y)}</b>.`;
  }
  let drag = false;
  g.addEventListener('pointerdown', e=>{ drag=true; g.setPointerCapture(e.pointerId); e.preventDefault(); });
  g.addEventListener('pointermove', e=>{ if(!drag) return; const [a,bb]=P.toData(e); const nx=Math.max(P.mn,Math.min(P.mx,a)), ny=Math.max(P.ymn,Math.min(P.ymx,bb)); if(nx!==x||ny!==y){ x=nx; y=ny; paint(); } });
  g.addEventListener('pointerup', ()=>drag=false);
  P.svg.addEventListener('click', e=>{ if(e.target.closest('.dragme')) return; const [a,bb]=P.toData(e); x=Math.max(P.mn,Math.min(P.mx,a)); y=Math.max(P.ymn,Math.min(P.ymx,bb)); paint(); });
  paint();
}

/* --- punten kiezen die aan een voorwaarde voldoen --- */
function pickPoints(b, st, save, key, cfg){
  const P = plane({quad:cfg.quad});
  b.append(el('div','readout bigq', cfg.ask));
  b.append(planeBox(P.svg));
  const fb = el('div','fb');
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn);
  b.append(act, fb);
  const sel = st.sel || (st.sel = []);
  const quiz = QZ; const qid = QID('kies'); if(!quiz) CLvraag(qid); else act.hidden = true;
  const gs = cfg.pts.map((p,i)=>{ const g = P.point(p[0],p[1],p[2]); g.style.cursor='pointer';
    const hit = svgEl('circle',{cx:P.X(p[0]), cy:P.Y(p[1]), r:16, class:'hit'}, g);
    g.addEventListener('click', ev=>{ ev.stopPropagation(); if(P.svg.dataset.locked) return; const k=sel.indexOf(i); if(k>=0) sel.splice(k,1); else sel.push(i); save(); paint(); });
    return g; });
  function paint(){ gs.forEach((g,i)=>{ g.querySelector('.pt').classList.toggle('or', sel.includes(i)); }); }
  const good = cfg.pts.map((p,i)=>cfg.test(p[0],p[1])?i:-1).filter(i=>i>=0);
  const isOk = ()=> sel.length===good.length && good.every(i=>sel.includes(i));
  btn.addEventListener('click', ()=>{ const ok=isOk(); fb.className='fb '+(ok?'ok':'bad'); fb.innerHTML = ok? '✅ Juist! '+(cfg.why||'') : `❌ Nog niet juist. ${cfg.hint||''}`; CLres(qid, ok); st.checked=true; save(); });
  paint();
  if(quiz) quiz.push({grade:isOk, reveal:()=>{}, lock:()=>{ P.svg.dataset.locked='1'; }});
}

/* ============================================================
   LIJNDIAGRAM MET AFLEESLIJN
   ============================================================ */
function lineReader(b, d, opts={}){
  const svg = drawChart('lijn', d, 600, 340);
  const v = el('div','viz'); v.append(svg); b.append(v);
  const out = el('div','readout bigq'); b.append(out);
  const n = d.labels.length;
  const g = svgEl('g', {}, svg);
  const ln = svgEl('line', {class:'proj'}, g), lh = svgEl('line', {class:'proj'}, g);
  const vals = d.series[0].values;
  const yp = val => svg._T + svg._ph*(1-(val-svg._yMin)/(svg._yMax-svg._yMin));
  const bar = el('div','viz-bar', `<span class="lbl">${opts.slider||'Schuif'}</span>`);
  const rg = document.createElement('input'); rg.type='range'; rg.min=0; rg.max=n-1; rg.step=1; rg.value=opts.start||0; bar.append(rg); b.append(bar);
  function paint(){ const i=+rg.value, x=svg._xs(i), y=yp(+vals[i]);
    ln.setAttribute('x1',x); ln.setAttribute('x2',x); ln.setAttribute('y1',svg._T+svg._ph); ln.setAttribute('y2',y);
    lh.setAttribute('x1',x); lh.setAttribute('x2',svg._L); lh.setAttribute('y1',y); lh.setAttribute('y2',y);
    out.innerHTML = opts.say(i, vals[i]); }
  rg.addEventListener('input', paint); paint();
}
/* --- ontbrekend punt aanklikken in een lijndiagram --- */
function linePlace(b, st, save, key, d, miss){
  const fb = el('div','fb'); const v = el('div','viz'); b.append(v, fb);
  const quiz = QZ; const qid = QID('lijnpunt'); if(!quiz) CLvraag(qid);
  const want = d.series[0].values[miss.i];
  function draw(){
    v.innerHTML='';
    const vals = d.series[0].values.slice(); vals[miss.i] = st.y!=null ? st.y : null;
    const svg = drawChart('lijn', Object.assign({}, d, {anim:false, series:[{values:vals}]}), 600, 340);
    v.append(svg);
    const T=svg._T, ph=svg._ph, yMin=svg._yMin, yMax=svg._yMax, x=svg._xs(miss.i), snap=miss.snap||d.step||1;
    svgEl('line',{x1:x, y1:T, x2:x, y2:T+ph, class:'gr2'}, svg);
    const hit = svgEl('rect',{x:x-28, y:T-8, width:56, height:ph+16, class:'hit'}, svg);
    if(st.y!=null && st.checked && !quiz){ const ok = st.y===want; [...svg.querySelectorAll('circle.pt')].forEach(c=>{ if(Math.abs(+c.getAttribute('cx')-x)<1) c.classList.add('or'); }); }
    hit.addEventListener('click', ev=>{
      if(v.dataset.locked) return;
      const pt = svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY; const p=pt.matrixTransform(svg.getScreenCTM().inverse());
      let val = yMin + (1-(p.y-T)/ph)*(yMax-yMin); val = Math.round(val/snap)*snap;
      st.y = val; st.checked = true; save(); draw();
      if(quiz) return;
      const ok = val===want; fb.className='fb '+(ok?'ok':'bad');
      fb.innerHTML = ok ? `✅ Juist! ${miss.why}` : `❌ Je zette het punt op ${nf(val)}. ${miss.hint||'Zoek de juiste waarde op de verticale as.'}`;
      CLres(qid, ok);
    });
  }
  draw();
  if(quiz) quiz.push({grade:()=>st.y===want, reveal:()=>{}, lock:()=>{ v.dataset.locked='1'; }});
}

/* ============================================================
   ONDERDEEL 1 · COÖRDINATEN
   ============================================================ */
const CHEAT_COORD = `<h3>Spiekbriefje · coördinaten</h3><table>
<tr><td>assenstelsel</td><td>De x-as is horizontaal, de y-as verticaal. Ze snijden elkaar loodrecht in de <b>oorsprong</b> O(0, 0).</td></tr>
<tr><td>coördinaat</td><td>P(3, −2): eerst het <b>eerste coördinaatgetal</b> (x, horizontaal), dan het <b>tweede coördinaatgetal</b> (y, verticaal).</td></tr>
<tr><td>aflezen</td><td>Projecteer het punt loodrecht op de x-as, dan loodrecht op de y-as.</td></tr>
<tr><td>kwadranten</td><td>I: x &gt; 0 en y &gt; 0 · II: x &lt; 0 en y &gt; 0 · III: x &lt; 0 en y &lt; 0 · IV: x &gt; 0 en y &lt; 0. Een punt op een as ligt in geen enkel kwadrant.</td></tr></table>`;
SECTIONS.push({ id:'coord', ic:'coord', nav:'Coördinaten', title:'Coördinaten van een punt', cheat:CHEAT_COORD,
  tip:'Een coördinaat lees je altijd in dezelfde volgorde: eerst x (horizontaal), dan y (verticaal). Projecteer het punt loodrecht op de assen.',
  cards:[
    { title:'Kijk hoe je een coördinaat afleest', lvl:1, instr:'Klik op een knop. Het punt wordt loodrecht op de x-as geprojecteerd, daarna loodrecht op de y-as.',
      build:(b)=>coordDemo(b, [[4,3,'A'],[-5,2,'B'],[-3,-4,'C'],[2,-5,'D']]) },
    { title:'Lees de coördinaten af', lvl:1, instr:'Vul de coördinaat van elk punt in. Na het controleren zie je hoe je afleest.',
      build:(b,st,save,key)=>coordRead(b,st,save,key, [[5,2,'A'],[-2,4,'B'],[-4,-3,'C'],[3,-5,'D'],[0,-2,'E'],[-6,0,'F']]) },
    { title:'Klik de punten aan', lvl:2, instr:'Klik op de juiste plaats in het assenstelsel. Start telkens in de oorsprong.',
      build:(b,st,save,key)=>coordPlace(b,st,save,key, [[2,5,'K'],[-4,1,'L'],[-1,-3,'M'],[5,-4,'N'],[0,3,'P'],[-5,0,'Q']]) },
    { title:'Ontdek de kwadranten', lvl:2, instr:'Sleep het oranje punt (of klik ergens). Kijk naar de tekens van x en y. Beantwoord dan de vragen.',
      build:combo(b=>coordExplore(b), choiceList([
        ['In welk kwadrant ligt R(−3, 5)?', 'II', 'x is negatief en y is positief: kwadrant II.'],
        ['In welk kwadrant ligt S(4, −1)?', 'IV', 'x is positief en y is negatief: kwadrant IV.'],
        ['In welk kwadrant ligt T(−2, −6)?', 'III', 'Beide coördinaatgetallen zijn negatief: kwadrant III.'],
        ['In welk kwadrant ligt U(0, 4)?', 'as', 'x = 0: U ligt op de y-as, in geen enkel kwadrant.']
      ], KW)) },
    { title:'Waar of niet waar?', lvl:2, build:choiceList([
        ['Als het tweede coördinaatgetal 0 is, dan ligt het punt op de x-as.', 'w', 'y = 0: je gaat niet naar boven of naar onder, dus je blijft op de x-as.'],
        ['A(2, −5) en B(−5, 2) liggen op dezelfde plaats.', 'n', 'De volgorde telt: A ligt in kwadrant IV, B in kwadrant II.'],
        ['Elk punt in kwadrant III heeft twee negatieve coördinaatgetallen.', 'w', 'Links van de y-as (x &lt; 0) en onder de x-as (y &lt; 0).'],
        ['Een punt met x &gt; 0 ligt altijd in kwadrant I.', 'n', 'Het kan ook in kwadrant IV liggen (y &lt; 0) of op de x-as (y = 0).'],
        ['De oorsprong ligt in kwadrant I.', 'n', 'De oorsprong ligt op beide assen, in geen enkel kwadrant.']
      ], WN) },
    { title:'Kies de juiste punten', lvl:2, build:(b,st,save,key)=>pickPoints(b,st,save,key,{ quad:true,
        ask:'Klik alle punten aan waarvan het <b>eerste coördinaatgetal negatief</b> is.',
        pts:[[-3,2,'A'],[4,1,'B'],[-1,-4,'C'],[0,-3,'D'],[2,-2,'E'],[-5,-1,'F'],[3,5,'G']],
        test:(x,y)=>x<0, why:'A, C en F liggen links van de y-as. D ligt op de y-as: daar is x = 0, niet negatief.', hint:'Het eerste coördinaatgetal is x. Negatief betekent: links van de y-as.' }) },
    { title:'Punten in een gebied', lvl:3, build:(b,st,save,key)=>pickPoints(b,st,save,key,{ quad:true,
        ask:'Klik alle punten aan waarvoor <b>x &gt; 0 en y &lt; 0</b>.',
        pts:[[3,-2,'A'],[-2,-3,'B'],[5,-5,'C'],[4,0,'D'],[1,3,'E'],[2,-6,'F'],[0,-4,'G'],[-4,4,'H']],
        test:(x,y)=>x>0&&y<0, why:'A, C en F liggen rechts van de y-as én onder de x-as: kwadrant IV. D en G liggen op een as.', hint:'Rechts van de y-as én strikt onder de x-as. Punten op een as tellen niet mee.' }) },
    { title:'Het midden van een lijnstuk', lvl:3, instr:'Het midden ligt even ver van beide eindpunten. Kijk apart naar x en naar y.',
      build:list([
        {html:'A(−2, 1) en B(4, 5). Het midden M van [AB] is M( [[0]] , [[1]] ).', size:'xs', check:nums([1,3]), sol:'x: halverwege −2 en 4 is (−2 + 4) : 2 = <b>1</b>. y: halverwege 1 en 5 is (1 + 5) : 2 = <b>3</b>. Dus M(1, 3).'},
        {html:'C(−5, −4) en D(1, 2). Het midden N van [CD] is N( [[0]] , [[1]] ).', size:'xs', check:nums([-2,-1]), sol:'x: (−5 + 1) : 2 = <b>−2</b>. y: (−4 + 2) : 2 = <b>−1</b>. Dus N(−2, −1).'},
        {html:'M(2, 3) is het midden van [EF] en E(−1, 3). Dan is F( [[0]] , [[1]] ).', size:'xs', check:nums([5,3]), sol:'Van E naar M: x stijgt met 3, y blijft gelijk. Van M naar F nog eens hetzelfde: F(2 + 3, 3) = <b>F(5, 3)</b>.'}
      ], {letters:true}) },
    { title:'Puzzelen met figuren', lvl:3, instr:'Maak een schets op een rooster. Er is telkens één antwoord.',
      build:list([
        {html:'ABCD is een vierkant met A(−3, −2), B(2, −2) en C(2, 3). Dan is D( [[0]] , [[1]] ).', size:'xs', check:nums([-3,3]), sol:'Zijde 5. D ligt boven A en links van C: <b>D(−3, 3)</b>.'},
        {html:'Driehoek PQR is gelijkbenig met |PR| = |QR|. P(−4, 1), Q(2, 1) en R ligt op 4 eenheden boven [PQ]. Dan is R( [[0]] , [[1]] ).', size:'xs', check:nums([-1,5]), sol:'R ligt recht boven het midden van [PQ]: x = (−4 + 2) : 2 = −1. y = 1 + 4 = 5. Dus <b>R(−1, 5)</b>.'},
        {html:'Een punt ligt in kwadrant II. Het product van de coördinaatgetallen is −8 en het tweede getal is het dubbel van het eerste, maar positief. Het punt is ( [[0]] , [[1]] ).', size:'xs', check:nums([-2,4]), sol:'Kwadrant II: x &lt; 0 en y &gt; 0. y = 2 · |x| en x · y = −8: x = −2, y = 4. Controle: −2 · 4 = −8. Dus <b>(−2, 4)</b>.'}
      ], {letters:true}) }
  ]});

/* ============================================================
   ONDERDEEL 2 · LIJNDIAGRAMMEN
   ============================================================ */
const FIETS = {labels:['0','1','2','3','4','5','6'], series:[{values:[0,18,30,30,45,58,70]}], xTitle:'Tijd (in uur)', yTitle:'Afstand (in km)', step:10, yMax:80};
const HOOGTE = {labels:['0','1','2','3','4','5','6','7'], series:[{values:[600,800,1100,1300,1300,1200,900,700]}], xTitle:'Tijd (in uur)', yTitle:'Hoogte (in m)', step:100, yMin:0, yMax:1400};
SECTIONS.push({ id:'lijn', ic:'lijn', nav:'Lijndiagrammen', title:'Informatie uit een lijndiagram halen', cheat:CHEAT_COORD,
  tip:'Een lijndiagram toont hoe iets verandert, meestal in de tijd. Elk punt is een coördinaat: (tijd, waarde). Lees eerst wat er op de assen staat.',
  cards:[
    { title:'Schuif langs de grafiek', lvl:1, instr:'Een fietstocht. Schuif met de schuifbalk en kijk welk punt je afleest.',
      build:combo(b=>lineReader(b, FIETS, {slider:'Tijd', say:(i,v)=>`Punt <b>(${i}, ${v})</b>: na <b>${i} uur</b> heeft de fietser <b>${v} km</b> afgelegd.`}),
        list([
          {html:'Hoeveel km legde de fietser af in de eerste 2 uur? [[0]] km', mode:'numeric', check:exact(30), sol:'Na 2 uur staat de grafiek op 30 km.'},
          {html:'Hoeveel km legde de fietser af tussen uur 3 en uur 4? [[0]] km', mode:'numeric', check:exact(15), sol:'45 km − 30 km = <b>15 km</b>.'}
        ], {letters:true}),
        choiceList([
          ['Wat betekent het punt (3, 30)?', 'b', 'Het eerste getal is de tijd, het tweede de afstand.'],
        ], [['a','Na 30 uur is de afstand 3 km.'],['b','Na 3 uur heeft de fietser 30 km afgelegd.'],['c','De fietser rijdt 30 km per uur.']]),
        choiceList([
          ['Wat deed de fietser tussen uur 2 en uur 3?', 'c', 'De afstand blijft 30 km: de lijn loopt horizontaal. De fietser stond stil (pauze).'],
        ], [['a','Hij reed het snelst.'],['b','Hij reed terug.'],['c','Hij nam pauze.']])) },
    { title:'Een bergwandeling', lvl:2, build:combo(chartBox('lijn', HOOGTE),
        list([
          {html:'Op welke hoogte start de wandeling? [[0]] m', mode:'numeric', check:exact(600), sol:'Bij tijd 0 staat de grafiek op 600 m.'},
          {html:'Wat is de hoogste hoogte? [[0]] m', mode:'numeric', check:exact(1300), sol:'Het hoogste punt staat op 1300 m (na 3 en na 4 uur).'},
          {html:'Hoeveel meter steeg de wandelaar in het tweede uur (van uur 1 tot uur 2)? [[0]] m', mode:'numeric', check:exact(300), sol:'1100 m − 800 m = <b>300 m</b>.'}
        ], {letters:true}),
        choiceList([
          ['In welk uur daalt de wandelaar het meest?', 'c', 'Van uur 5 naar uur 6 daalt hij 300 m: de lijn is daar het steilst naar beneden.'],
        ], [['a','van uur 4 tot 5'],['b','van uur 3 tot 4'],['c','van uur 5 tot 6'],['d','van uur 6 tot 7']])) },
    { title:'Vul de grafiek aan', lvl:2, instr:'De temperatuur om 14 uur ontbreekt. Het was toen 9 °C. Klik op de juiste hoogte boven 14.',
      build:(b,st,save,key)=>linePlace(b,st,save,key, {labels:['10','11','12','13','14','15','16'], series:[{values:[2,4,6,8,9,7,5]}], xTitle:'Tijdstip (in uur)', yTitle:'Temperatuur (in °C)', step:1, yMax:10},
        {i:4, snap:1, why:'Het punt (14, 9) staat juist.', hint:'Tel de hokjes op de verticale as: elk hokje is 1 °C.'}) },
    { title:'Twee lijnen vergelijken', lvl:3, instr:'Twee steden: de gemiddelde maximumtemperatuur per maand.',
      build:combo(chartBox('lijn', {labels:['jan','feb','mrt','apr','mei','jun'], series:[{name:'Gent', values:[6,8,11,15,18,21]},{name:'Lissabon', values:[15,16,19,19,23,26]}], yTitle:'Temperatuur (in °C)', step:5, yMax:30}),
        list([
          {html:'Hoeveel graden scheelt het in januari? [[0]] °C', mode:'numeric', check:exact(9), sol:'15 °C − 6 °C = <b>9 °C</b>.'},
          {html:'In welke maand is het verschil het kleinst? [[0]]', check:words(['april','apr']), sol:'In april: 19 °C − 15 °C = 4 °C. De lijnen liggen daar het dichtst bij elkaar.'}
        ], {letters:true})) }
  ]});
/* ============================================================
   NIEUWE OPGAVEN MET TOEVALSGETALLEN + EXTRA COÖRDINAATOEFENINGEN
   ============================================================ */
(function(){
  const css = `
  .gen-bar{ display:flex; justify-content:flex-end; margin:.2rem 0 .6rem; }
  .gen-bar .btn{ display:inline-flex; gap:.35rem; align-items:center; }
  .ch .pt.blink{ animation:blink 1s ease-in-out infinite; fill:var(--orange); }
  @keyframes blink{ 50%{ r:10; } }
  @media (prefers-reduced-motion: reduce){ .ch .pt.blink{ animation:none; } }
  .ch .poly{ fill:var(--or-soft); fill-opacity:.55; stroke:var(--accent-dark); stroke-width:2.5; stroke-linejoin:round; }
  .ch .poly.bad{ stroke:var(--bad); stroke-dasharray:6 5; fill:none; }
  .ch .poly.part{ fill:none; stroke-dasharray:7 6; }
  .ch .arrow{ stroke:var(--orange); stroke-width:3; fill:none; marker-end:url(#pijlpunt); }
  .ch .hitpt{ fill:transparent; cursor:pointer; }
  .ch .pt.miss{ fill:#b9c7c8; }
  .shot-log{ display:flex; flex-wrap:wrap; gap:.3rem; margin:.4rem 0; }
  .shot-log .dv.hit{ border-color:var(--ok); background:var(--ok-bg); }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* toevalsgetallen met een vaste seed: dezelfde opgave na herladen, een nieuwe met de knop */
function rng(seed){ let a = seed>>>0; return ()=>{ a = (a + 0x6D2B79F5)>>>0; let t = a; t = Math.imul(t ^ t>>>15, t | 1); t ^= t + Math.imul(t ^ t>>>7, t | 61); return ((t ^ t>>>14)>>>0) / 4294967296; }; }
const rInt = (r, lo, hi) => lo + Math.floor(r()*(hi-lo+1));
const rPick = (r, arr) => arr[Math.floor(r()*arr.length)];
const rNZ = (r, lo, hi) => { let v; do{ v = rInt(r, lo, hi); }while(v===0); return v; };
/* kaart met de knop "Nieuwe opgave": make(rnd) maakt de gegevens, render tekent de oefening */
const fresh = (make, render) => (b, st, save, key) => {
  if(st.seed==null){ st.seed = Math.floor(Math.random()*1e9); save(); }
  const box = el('div'); b.append(box);
  const bar = el('div','gen-bar'); const nb = el('button','btn ghost','↻ Nieuwe opgave'); nb.type='button'; bar.append(nb);
  function draw(){ box.innerHTML=''; st.s = st.s || {}; const old = CURKEY; CURKEY = key; try{ render(box, st.s, save, key, make(rng(st.seed))); } finally { CURKEY = old; } }
  nb.addEventListener('click', ()=>{ st.seed = (st.seed + 7919) >>> 0; st.s = {}; save(); draw(); box.scrollIntoView({block:'nearest', behavior:'smooth'}); });
  if(!QZ) b.prepend(bar);
  draw();
};
/* n verschillende punten in het rooster, niet op elkaar, met letters */
function randPts(r, n, opt={}){
  const lim = opt.lim || 6, pts = [], used = new Set(), names = opt.names || 'ABCDEFGHKLMNPQRSTUVW';
  let guard = 0;
  while(pts.length<n && guard++<500){
    const x = rInt(r, -lim, lim), y = rInt(r, -lim, lim);
    if(!opt.axes && (x===0 || y===0)) continue;
    if(used.has(x+','+y)) continue;
    used.add(x+','+y); pts.push([x, y, names[pts.length]]);
  }
  return pts;
}
const ptsGen = (n, opt={}) => r => { const p = randPts(r, n, opt); if(opt.oneAxis){ const k = rInt(r, 0, n-1); const v = rNZ(r, -5, 5); p[k][0] = r()<.5 ? 0 : v; p[k][1] = p[k][0]===0 ? v : 0; } return p; };

/* --- welk punt is het? klik op het punt met de gevraagde coördinaat --- */
function whichPoint(b, st, save, key, cfg){
  const P = plane();
  b.append(el('div','readout bigq'));
  const prompt = b.lastChild;
  b.append(planeBox(P.svg, 'narrow'));
  const fb = el('div','fb'); b.append(fb);
  const quiz = QZ; const asks = cfg.asks;
  const ids = asks.map((a,i)=>QID('welk'+i)); if(!quiz) ids.forEach(id=>CLvraag(id));
  const done = st.done || (st.done = []);
  const gs = cfg.pts.map((p,i)=>{ const g = P.point(p[0], p[1], p[2]); const hit = svgEl('circle',{cx:P.X(p[0]), cy:P.Y(p[1]), r:17, class:'hitpt'}, g); g.dataset.i=i; return g; });
  function cur(){ return asks.findIndex((a,i)=>done[i]==null); }
  function paint(){
    gs.forEach((g,i)=>g.querySelector('.pt').classList.toggle('or', done.some((d,k)=>d===i && asks[k]===i)));
    const c = cur(); const t = c<0 ? null : cfg.pts[asks[c]];
    prompt.innerHTML = c<0 ? (quiz ? 'Je koos alle punten.' : '✅ Alle punten gevonden.') : `Welk punt heeft als coördinaat <b>${coStr(t[0], t[1])}</b>? Klik erop.`;
  }
  gs.forEach((g,i)=>g.addEventListener('click', async ev=>{
    ev.stopPropagation(); if(P.svg.dataset.locked) return;
    const c = cur(); if(c<0) return; const want = asks[c], t = cfg.pts[want], p = cfg.pts[i];
    if(quiz){ done[c] = i; save(); paint(); return; }
    if(i===want){ done[c] = i; save(); fb.className='fb ok'; fb.innerHTML = `✅ Juist! Dat is <b>${t[2]}${coStr(t[0],t[1])}</b>.`; CLres(ids[c], true); paint(); const cl = await P.project(t[0], t[1], t[2], 2.2); setTimeout(cl, 1200); }
    else { fb.className='fb bad'; let m = `${p[2]} is ${coStr(p[0],p[1])}. `;
      m += t[0]===0 ? `x = 0: het punt ligt op de y-as, ${Math.abs(t[1])} ${t[1]<0?'onder':'boven'} de oorsprong.` : t[1]===0 ? `y = 0: het punt ligt op de x-as, ${Math.abs(t[0])} ${t[0]<0?'links':'rechts'} van de oorsprong.` : `Start in de oorsprong: ${Math.abs(t[0])} ${t[0]<0?'naar links':'naar rechts'}, dan ${Math.abs(t[1])} ${t[1]<0?'naar onder':'naar boven'}.`;
      fb.textContent = '❌ '+m; CLres(ids[c], false); }
  }));
  paint();
  if(quiz) quiz.push({ grade:()=>asks.every((a,k)=>done[k]===a), reveal:()=>{}, lock:()=>{ P.svg.dataset.locked='1'; } });
}
/* negen punten; geen lokpunten met omgewisselde x en y of een ander teken */
const whichGen = r => {
  const pts = []; const used = new Set();
  const twin = (x,y) => [[y,x],[-x,y],[x,-y],[-x,-y]].some(([u,v])=>used.has(u+','+v));
  let guard = 0;
  while(pts.length<9 && guard++<2000){ const x = rInt(r,-6,6), y = rInt(r,-6,6); if(used.has(x+','+y) || twin(x,y)) continue; used.add(x+','+y); pts.push([x,y]); }
  const names = 'ABCDEFGHKLMN'; const out = pts.map((p,k)=>[p[0], p[1], names[k]]);
  return { pts: out, asks: out.map((_,i)=>[i, r()]).sort((a,b)=>a[1]-b[1]).slice(0,3).map(x=>x[0]) };
};

/* --- het vierde punt: parallellogram, rechthoek, ruit of vierkant --- */
const SOORT = { par:'parallellogram', rh:'rechthoek', ruit:'ruit', vk:'vierkant' };
function quadGen(soort, tilted){
  return r => {
    for(let t=0;t<400;t++){
      let A=[rInt(r,-5,1), rInt(r,-5,1)], v, w;
      if(soort==='vk'){ const p=rInt(r,2,5), q = tilted ? rInt(r,1,2)*(r()<.5?1:-1) : 0; v=[p,q]; w=[-q,p]; }
      else if(soort==='rh'){ if(tilted){ const k=rInt(r,1,2), m=rInt(r,2,3); v=[2*k,k]; w=[-m,2*m]; } else { v=[rInt(r,2,6),0]; w=[0,rInt(r,2,5)]; if(v[0]===w[1]) continue; } }
      else if(soort==='ruit'){ if(tilted){ v=[5,0]; w=rPick(r,[[3,4],[4,3],[-3,4],[-4,3]]); } else { const h=rInt(r,2,4), k=rInt(r,1,4); if(h===k) continue; v=[h,-k]; w=[h,k]; } }
      else { v=[rInt(r,3,5),0]; w=[rNZ(r,-2,3), rInt(r,2,4)]; if(tilted){ v=[rInt(r,3,4), rNZ(r,-2,2)]; } }
      const B=[A[0]+v[0], A[1]+v[1]], C=[B[0]+w[0], B[1]+w[1]], D=[A[0]+w[0], A[1]+w[1]];
      const all=[A,B,C,D]; if(all.some(p=>Math.abs(p[0])>6 || Math.abs(p[1])>6)) continue;
      const shift = [rInt(r,-1,2), rInt(r,-1,2)]; const Q = all.map(p=>[p[0]+shift[0], p[1]+shift[1]]); if(Q.some(p=>Math.abs(p[0])>6 || Math.abs(p[1])>6)) continue;
      return { soort, P:Q, miss:rInt(r,0,3) };
    }
    return { soort, P:[[-2,-1],[3,-1],[4,2],[-1,2]], miss:3 };
  };
}
function fourthPoint(b, st, save, key, cfg){
  const N = 'ABCD', want = cfg.P[cfg.miss];
  const P = plane();
  const defs = svgEl('defs', {}, P.svg); defs.innerHTML = '<marker id="pijlpunt" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--orange)"/></marker>';
  const given = [0,1,2,3].filter(i=>i!==cfg.miss);
  const part = svgEl('polyline', {class:'poly part', points:[1,2,3].map(k=>(cfg.miss+k)%4).map(i=>`${P.X(cfg.P[i][0])},${P.Y(cfg.P[i][1])}`).join(' ')}, P.layer);
  given.forEach(i=>P.point(cfg.P[i][0], cfg.P[i][1], N[i]+coStr(cfg.P[i][0], cfg.P[i][1])));
  b.append(el('div','readout bigq', `ABCD is een <b>${SOORT[cfg.soort]}</b>. Klik op de plaats van <b>${N[cfg.miss]}</b>.`));
  b.append(planeBox(P.svg, 'narrow'));
  const fb = el('div','fb'); b.append(fb);
  const quiz = QZ; const qid = QID('vierde'); if(!quiz) CLvraag(qid);
  let mark = null, poly = null;
  function show(pt, final){
    if(mark) mark.remove(); if(poly) poly.remove();
    const Q = cfg.P.slice(); Q[cfg.miss] = pt;
    poly = svgEl('polygon', {class:'poly'+(final===false?' bad':''), points:Q.map(p=>`${P.X(p[0])},${P.Y(p[1])}`).join(' ')}, P.layer);
    P.layer.prepend(poly);
    mark = P.point(pt[0], pt[1], N[cfg.miss]+coStr(pt[0], pt[1]), final===false?'or':'');
  }
  if(st.pt) show(st.pt, quiz ? null : (st.pt[0]===want[0] && st.pt[1]===want[1]) || false);
  P.svg.addEventListener('click', ev=>{
    if(P.svg.dataset.locked || (st.ok && !quiz)) return;
    const [x,y] = P.toData(ev); if(Math.abs(x)>6 || Math.abs(y)>6) return;
    st.pt = [x,y]; save();
    const ok = x===want[0] && y===want[1];
    if(quiz){ show(st.pt, null); return; }
    show(st.pt, ok); fb.className = 'fb '+(ok?'ok':'bad');
    if(ok){ st.ok = true; save(); fb.innerHTML = `✅ Juist! ${N[cfg.miss]}${coStr(x,y)}. ${why()}`; }
    else fb.innerHTML = `❌ Met ${N[cfg.miss]}${coStr(x,y)} krijg je geen ${SOORT[cfg.soort]}. ${hint()} Klik opnieuw.`;
    CLres(qid, ok);
  });
  const prev = cfg.P[(cfg.miss+3)%4], next = cfg.P[(cfg.miss+1)%4], opp = cfg.P[(cfg.miss+2)%4];
  function why(){ const dx = want[0]-next[0], dy = want[1]-next[1]; return `Van ${N[(cfg.miss+2)%4]} naar ${N[(cfg.miss+1)%4]} is dezelfde stap als van ${N[(cfg.miss+3)%4]} naar ${N[cfg.miss]}: ${stap(next[0]-opp[0], next[1]-opp[1])}.`; }
  function hint(){ return `In een ${SOORT[cfg.soort]} zijn de overstaande zijden evenwijdig en even lang. Doe vanuit ${N[(cfg.miss+3)%4]} dezelfde stap als van ${N[(cfg.miss+2)%4]} naar ${N[(cfg.miss+1)%4]}.`; }
  function stap(dx, dy){ const a = dx===0 ? '' : `${Math.abs(dx)} naar ${dx<0?'links':'rechts'}`, c = dy===0 ? '' : `${Math.abs(dy)} naar ${dy<0?'onder':'boven'}`; return [a,c].filter(Boolean).join(' en ') || 'geen stap'; }
  if(quiz) quiz.push({ grade:()=>!!st.pt && st.pt[0]===want[0] && st.pt[1]===want[1], reveal:ok=>{ if(!ok) show(want, true); }, lock:()=>{ P.svg.dataset.locked='1'; } });
}
/* drie punten: alle mogelijke vierde punten van een parallellogram */
function allFourth(b, st, save, key, cfg){
  const [A,B,C] = cfg.P; const cand = [[A[0]+B[0]-C[0], A[1]+B[1]-C[1]], [A[0]+C[0]-B[0], A[1]+C[1]-B[1]], [B[0]+C[0]-A[0], B[1]+C[1]-A[1]]];
  const P = plane(); [['A',A],['B',B],['C',C]].forEach(([n,p])=>P.point(p[0],p[1],n+coStr(p[0],p[1])));
  b.append(el('div','readout bigq', 'Met A, B en C en een vierde punt D maak je een <b>parallellogram</b>. Er zijn <b>drie</b> mogelijke plaatsen voor D. Klik ze alle drie aan.'));
  b.append(planeBox(P.svg, 'narrow'));
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn); const fb = el('div','fb'); b.append(act, fb);
  const quiz = QZ; const qid = QID('drie'); if(!quiz) CLvraag(qid); else act.hidden = true;
  const sel = st.sel || (st.sel = []); const g = svgEl('g', {}, P.layer);
  function paint(show){ g.innerHTML=''; sel.forEach(p=>{ const ok = cand.some(c=>c[0]===p[0]&&c[1]===p[1]); const c = svgEl('circle',{cx:P.X(p[0]), cy:P.Y(p[1]), r:7, class:'pt '+(show? (ok?'':'or') : 'or')}, g); });
    if(show) cand.forEach(c=>{ if(sel.some(p=>p[0]===c[0]&&p[1]===c[1])){ const others = [A,B,C]; } }); }
  P.svg.addEventListener('click', ev=>{ if(P.svg.dataset.locked) return; const [x,y] = P.toData(ev); if(Math.abs(x)>6||Math.abs(y)>6) return; const k = sel.findIndex(p=>p[0]===x&&p[1]===y); if(k>=0) sel.splice(k,1); else sel.push([x,y]); st.checked=false; save(); paint(false); });
  const isOk = () => sel.length===3 && cand.every(c=>sel.some(p=>p[0]===c[0]&&p[1]===c[1]));
  btn.addEventListener('click', ()=>{ const ok = isOk(); paint(true); fb.className='fb '+(ok?'ok':'bad');
    fb.innerHTML = ok ? `✅ Juist! D${coStr(...cand[0])}, D${coStr(...cand[1])} en D${coStr(...cand[2])}. Telkens is één van de drie punten het overstaande hoekpunt van D.` : `❌ Nog niet. Je hebt ${sel.filter(p=>cand.some(c=>c[0]===p[0]&&c[1]===p[1])).length} van de 3 juiste punten${sel.length>3?' en te veel punten':''}. Tip: kies telkens een van de punten als overstaand hoekpunt van D en doe dezelfde stap als tussen de andere twee.`;
    CLres(qid, ok); st.checked=true; save(); });
  paint(!!st.checked && !quiz);
  if(quiz) quiz.push({ grade:isOk, reveal:()=>paint(true), lock:()=>{ P.svg.dataset.locked='1'; } });
}
const allFourthGen = r => { for(let t=0;t<300;t++){ const A=[rInt(r,-3,2), rInt(r,-3,2)], B=[A[0]+rInt(r,2,3), A[1]+rNZ(r,-2,2)], C=[A[0]+rNZ(r,-1,2), A[1]+rInt(r,2,3)]; const pts=[A,B,C,[A[0]+B[0]-C[0], A[1]+B[1]-C[1]],[A[0]+C[0]-B[0], A[1]+C[1]-B[1]],[B[0]+C[0]-A[0], B[1]+C[1]-A[1]]]; if(pts.every(p=>Math.abs(p[0])<=6&&Math.abs(p[1])<=6)) return {P:[A,B,C]}; } return {P:[[-1,-1],[2,0],[0,2]]}; };

/* --- verschuiven en spiegelen: rekenen met coördinaten, met animatie na het controleren --- */
function moveEx(b, st, save, key, cfg){
  const P = plane();
  const defs = svgEl('defs', {}, P.svg); defs.innerHTML = '<marker id="pijlpunt" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--orange)"/></marker>';
  P.point(cfg.p[0], cfg.p[1], cfg.n+coStr(cfg.p[0], cfg.p[1]));
  if(cfg.mirror==='x') svgEl('line',{x1:P.X(-6)-12, y1:P.Y(0), x2:P.X(6)+12, y2:P.Y(0), class:'arrow', style:'marker-end:none; stroke-dasharray:8 6'}, P.layer);
  if(cfg.mirror==='y') svgEl('line',{x1:P.X(0), y1:P.Y(-6)-12, x2:P.X(0), y2:P.Y(6)+12, class:'arrow', style:'marker-end:none; stroke-dasharray:8 6'}, P.layer);
  const wrap = el('div','two'); const left = el('div'), right = el('div'); left.append(planeBox(P.svg)); wrap.append(left, right); b.append(wrap);
  right.append(el('div','readout', cfg.ask));
  let anim = null;
  qBlock(right, st, save, key, { html:`<span class="bigq">${cfg.n}′( [[0]] , [[1]] )</span>`, size:'xs', check:v=>{ const r = nums(cfg.ans)(v); if(!r.ok) r.msg = cfg.hint; return r; }, sol:cfg.sol,
    after: async ok => { if(QZ || !ok) return; if(anim) anim.remove(); anim = svgEl('g', {}, P.top);
      const [x0,y0] = cfg.p, [x1,y1] = cfg.ans;
      if(cfg.mirror){ svgEl('line',{x1:P.X(x0), y1:P.Y(y0), x2:P.X(x1), y2:P.Y(y1), class:'proj'}, anim); }
      else { svgEl('line',{x1:P.X(x0), y1:P.Y(y0), x2:P.X(x1), y2:P.Y(y0), class:'arrow'}, anim); svgEl('line',{x1:P.X(x1), y1:P.Y(y0), x2:P.X(x1), y2:P.Y(y1), class:'arrow'}, anim); }
      await sleep(300); const g = svgEl('g', {class:'pop'}, anim); svgEl('circle',{cx:P.X(x1), cy:P.Y(y1), r:6.5, class:'pt or'}, g); svgText(g, P.X(x1)+9, P.Y(y1)-9, cfg.n+'′', {class:'t-big'}); } });
}
const moveGen = r => { for(;;){ const p=[rInt(r,-5,5), rInt(r,-5,5)], dx=rNZ(r,-5,5), dy=rNZ(r,-5,5), q=[p[0]+dx, p[1]+dy]; if(Math.abs(q[0])>6||Math.abs(q[1])>6) continue;
  const n = rPick(r, ['P','Q','R','S','T']);
  return { p, n, ans:q, ask:`${n}${coStr(p[0],p[1])} schuift <b>${Math.abs(dx)} naar ${dx<0?'links':'rechts'}</b> en <b>${Math.abs(dy)} naar ${dy<0?'onder':'boven'}</b>. Wat is de coördinaat van het beeldpunt ${n}′?`,
    hint:`Naar ${dx<0?'links':'rechts'} verandert enkel x: het wordt ${dx<0?'kleiner':'groter'}. Naar ${dy<0?'onder':'boven'} verandert enkel y: het wordt ${dy<0?'kleiner':'groter'}.`,
    sol:`x: ${fmt(p[0])} ${dx<0?'−':'+'} ${Math.abs(dx)} = ${fmt(q[0])}. y: ${fmt(p[1])} ${dy<0?'−':'+'} ${Math.abs(dy)} = ${fmt(q[1])}. Dus <b>${n}′${coStr(q[0],q[1])}</b>.` }; } };
const mirrorGen = axes => r => { const p=[rNZ(r,-6,6), rNZ(r,-6,6)], m = rPick(r, axes), n = rPick(r, ['A','B','K','L','M']);
  const q = m==='x' ? [p[0],-p[1]] : m==='y' ? [-p[0],p[1]] : [-p[0],-p[1]];
  const wat = m==='x' ? 'de x-as' : m==='y' ? 'de y-as' : 'de oorsprong O';
  return { p, n, mirror:m, ans:q, ask:`Spiegel ${n}${coStr(p[0],p[1])} tegenover <b>${wat}</b>. Wat is de coördinaat van het spiegelbeeld ${n}′?`,
    hint: m==='x' ? 'Bij spiegelen tegenover de x-as blijft x gelijk en krijgt y het tegengestelde teken.' : m==='y' ? 'Bij spiegelen tegenover de y-as blijft y gelijk en krijgt x het tegengestelde teken.' : 'Spiegelen tegenover de oorsprong: beide coördinaatgetallen krijgen het tegengestelde teken.',
    sol:`${m==='x'?'x blijft, y wordt het tegengestelde':m==='y'?'y blijft, x wordt het tegengestelde':'x en y worden het tegengestelde'}: <b>${n}′${coStr(q[0],q[1])}</b>.` }; };

/* --- tekening met coördinaten: klik de punten in volgorde, de lijnen verschijnen --- */
function connectDots(b, st, save, key, cfg){
  const P = plane(); const pts = cfg.pts;
  const prompt = el('div','readout bigq'); b.append(prompt, planeBox(P.svg, 'narrow'));
  const fb = el('div','fb'); b.append(fb);
  const quiz = QZ; const qid = QID('tekening'); if(!quiz) CLvraag(qid);
  st.k = st.k || 0; let errs = st.errs || 0;
  const lines = svgEl('g', {}, P.layer);
  function paint(){
    lines.innerHTML=''; for(let i=0;i<st.k;i++){ const p=pts[i]; svgEl('circle',{cx:P.X(p[0]), cy:P.Y(p[1]), r:5, class:'pt'}, lines); if(i>0){ const q=pts[i-1]; svgEl('line',{x1:P.X(q[0]), y1:P.Y(q[1]), x2:P.X(p[0]), y2:P.Y(p[1]), class:'poly', style:'fill:none'}, lines); } }
    if(st.k>=pts.length){ const q=pts[pts.length-1], p=pts[0]; if(cfg.close) svgEl('line',{x1:P.X(q[0]), y1:P.Y(q[1]), x2:P.X(p[0]), y2:P.Y(p[1]), class:'poly', style:'fill:none'}, lines);
      prompt.innerHTML = `✅ Klaar: ${cfg.what}!`; }
    else prompt.innerHTML = `Punt ${st.k+1} van ${pts.length}: klik op <b>${coStr(pts[st.k][0], pts[st.k][1])}</b>.` + `<div class="sub">Nog te doen: ${pts.slice(st.k+1).map(p=>coStr(p[0],p[1])).join(' → ')}</div>`;
  }
  P.svg.addEventListener('click', ev=>{
    if(st.k>=pts.length || P.svg.dataset.locked) return; const [x,y] = P.toData(ev); const t = pts[st.k];
    if(x===t[0] && y===t[1]){ st.k++; save(); fb.className='fb'; fb.textContent=''; paint(); if(st.k>=pts.length && !quiz){ CLres(qid, errs<=2); fb.className='fb ok'; fb.textContent = errs ? `Je klikte ${errs} keer mis.` : 'Zonder één fout!'; } }
    else { errs++; st.errs = errs; save(); const w = P.point(x,y,'','or'); setTimeout(()=>w.remove(), 900); fb.className='fb bad'; fb.textContent = `❌ Dat is ${coStr(x,y)}. ${x===t[1]&&y===t[0]?'Je wisselde x en y om.':'Eerst x (horizontaal), dan y (verticaal).'}`; }
  });
  paint();
  if(quiz) quiz.push({ grade:()=>st.k>=pts.length, reveal:()=>{}, lock:()=>{ P.svg.dataset.locked='1'; } });
}

/* --- zeeslag: schiet met coördinaten (telt niet mee) --- */
function battleship(b, st, save, key){
  const rnd = rng(st.seed || (st.seed = Math.floor(Math.random()*1e9)));
  if(!st.ships){ const occ = new Set(); const ships = [];
    for(const len of [3,2,2]){ for(let t=0;t<200;t++){ const hor = rnd()<.5; const x=rInt(rnd,-5,hor?5-len+1:5), y=rInt(rnd,-5,hor?5:5-len+1); const cells=[...Array(len)].map((_,i)=>hor?[x+i,y]:[x,y+i]); if(cells.some(c=>occ.has(c+'')||c[0]===0||c[1]===0)) continue; cells.forEach(c=>occ.add(c+'')); ships.push(cells); break; } }
    st.ships = ships; st.shots = []; save(); }
  const P = plane({min:-5, max:5});
  b.append(el('div','sub','De computer verstopte drie schepen (3, 2 en 2 vakjes lang) op roosterpunten. Ze liggen nooit op een as. Typ een coördinaat en schiet. Hoeveel schoten heb jij nodig?'));
  const two = el('div','two'); const L = el('div'), R = el('div'); L.append(planeBox(P.svg)); two.append(L, R); b.append(two);
  const form = el('div','q-text', '<span class="bigq">Schiet op ( <input class="inp xs" inputmode="text" aria-label="x"> , <input class="inp xs" inputmode="text" aria-label="y"> )</span>');
  const go = el('button','btn','Vuur!'); go.type='button'; const fb = el('div','fb'); const log = el('div','shot-log'); const again = el('button','linkbtn','Nieuw spel'); again.type='button';
  R.append(form, go, fb, log, again);
  const [ix, iy] = form.querySelectorAll('input'); const g = svgEl('g', {}, P.layer);
  const all = () => st.ships.flat(); const isHit = (x,y) => all().some(c=>c[0]===x&&c[1]===y);
  function paint(){ g.innerHTML=''; st.shots.forEach(([x,y])=>{ const h = isHit(x,y); const c = svgEl('circle',{cx:P.X(x), cy:P.Y(y), r:h?9:5, class:'pt '+(h?'or':'miss')}, g); });
    st.ships.forEach(s=>{ if(s.every(c=>st.shots.some(q=>q[0]===c[0]&&q[1]===c[1]))){ svgEl('line',{x1:P.X(s[0][0]), y1:P.Y(s[0][1]), x2:P.X(s[s.length-1][0]), y2:P.Y(s[s.length-1][1]), class:'poly', style:'stroke-width:8; stroke-linecap:round; opacity:.6'}, g); } });
    log.innerHTML = st.shots.map(([x,y])=>`<span class="dv ${isHit(x,y)?'hit':''}">${coStr(x,y)}</span>`).join('');
    const sunk = st.ships.filter(s=>s.every(c=>st.shots.some(q=>q[0]===c[0]&&q[1]===c[1]))).length;
    if(sunk===st.ships.length){ fb.className='fb ok'; fb.innerHTML = `🎉 Alle schepen gezonken in <b>${st.shots.length}</b> schoten!`; go.disabled = true; } }
  function fire(){ const x = parseLoose(ix.value), y = parseLoose(iy.value);
    if(!Number.isInteger(x) || !Number.isInteger(y) || Math.abs(x)>5 || Math.abs(y)>5){ fb.className='fb info'; fb.textContent='Typ twee gehele getallen van −5 tot 5.'; return; }
    if(st.shots.some(q=>q[0]===x&&q[1]===y)){ fb.className='fb info'; fb.textContent=`Op ${coStr(x,y)} schoot je al.`; return; }
    st.shots.push([x,y]); save(); const h = isHit(x,y); fb.className='fb '+(h?'ok':'bad'); fb.textContent = h ? `💥 Raak op ${coStr(x,y)}!` : `💧 Mis: ${coStr(x,y)} is water.`; ix.value=''; iy.value=''; ix.focus(); paint(); }
  go.addEventListener('click', fire); [ix,iy].forEach(i=>i.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); fire(); } }));
  again.addEventListener('click', ()=>{ st.seed = (st.seed+104729)>>>0; delete st.ships; save(); b.innerHTML=''; battleship(b, st, save, key); });
  paint();
}

/* ============================================================
   EXTRA KAARTEN BIJ COÖRDINATEN
   ============================================================ */
const RAKET = [[0,6],[2,3],[2,-2],[4,-5],[1,-4],[-1,-4],[-4,-5],[-2,-2],[-2,3]];
const VIS = [[-6,0],[-4,3],[0,4],[3,2],[5,4],[5,-4],[3,-2],[0,-4],[-4,-3]];
SECTIONS.find(s=>s.id==='coord').cards.push(
  { title:'Welk punt is het?', lvl:1, instr:'Klik op het punt met de gevraagde coördinaat. Met "Nieuwe opgave" krijg je nieuwe punten.',
    build:fresh(whichGen, (b,st,save,key,d)=>whichPoint(b,st,save,key,d)) },
  { title:'Wat is de coördinaat?', lvl:1, instr:'Lees de coördinaat van elk punt af. Met "Nieuwe opgave" krijg je nieuwe punten.',
    build:fresh(ptsGen(4, {oneAxis:true}), (b,st,save,key,pts)=>coordRead(b,st,save,key,pts)) },
  { title:'Punten plaatsen', lvl:1, instr:'Klik de punten aan in het assenstelsel. Met "Nieuwe opgave" krijg je nieuwe punten.',
    build:fresh(ptsGen(5, {oneAxis:true, names:'KLMNPQRS'}), (b,st,save,key,pts)=>coordPlace(b,st,save,key,pts)) },
  { title:'Een tekening met coördinaten', lvl:3, instr:'Klik de punten in de juiste volgorde aan. De lijnen verschijnen vanzelf.',
    build:(b,st,save,key)=>connectDots(b,st,save,key,{pts:RAKET, close:true, what:'een raket'}) },
  { title:'Het vierde punt: rechthoek en vierkant', lvl:2, instr:'Drie hoekpunten zijn gegeven. Klik op de plaats van het vierde hoekpunt. De figuur verschijnt.',
    build:fresh(r=>quadGen(rPick(r,['rh','vk']), false)(r), (b,st,save,key,d)=>fourthPoint(b,st,save,key,d)) },
  { title:'Het vierde punt: parallellogram en ruit', lvl:2, instr:'Drie hoekpunten zijn gegeven. Klik op de plaats van het vierde hoekpunt.',
    build:fresh(r=>quadGen(rPick(r,['par','ruit']), false)(r), (b,st,save,key,d)=>fourthPoint(b,st,save,key,d)) },
  { title:'Verschuiven', lvl:2, instr:'Een punt schuift op in het rooster. Bereken de coördinaat van het beeldpunt.',
    build:fresh(moveGen, (b,st,save,key,d)=>moveEx(b,st,save,key,d)) },
  { title:'Spiegelen tegenover een as', lvl:3, instr:'Spiegel het punt. Kijk wat er met de tekens gebeurt.',
    build:fresh(mirrorGen(['x','y']), (b,st,save,key,d)=>moveEx(b,st,save,key,d)) },
  { title:'Zeeslag', lvl:2, instr:'Een spel om de coördinaten te oefenen. Het telt niet mee.',
    build:(b,st,save,key)=>battleship(b,st,save,key) },
  { title:'Het vierde punt: schuine figuren', lvl:3, instr:'De figuur staat schuin. Kijk hoeveel stappen je horizontaal en verticaal zet tussen twee hoekpunten.',
    build:fresh(r=>quadGen(rPick(r,['vk','rh','par']), true)(r), (b,st,save,key,d)=>fourthPoint(b,st,save,key,d)) },
  { title:'Drie mogelijke parallellogrammen', lvl:3, instr:'Er is meer dan één oplossing!',
    build:fresh(allFourthGen, (b,st,save,key,d)=>allFourth(b,st,save,key,d)) },
  { title:'Spiegelen tegenover de oorsprong', lvl:3, instr:'Spiegelen tegenover de oorsprong O: het beeldpunt ligt even ver van O, maar aan de andere kant.',
    build:fresh(mirrorGen(['o','x','y']), (b,st,save,key,d)=>moveEx(b,st,save,key,d)) },
  { title:'Een tekening met coördinaten (2)', lvl:3, instr:'Klik de punten in de juiste volgorde aan.',
    build:(b,st,save,key)=>connectDots(b,st,save,key,{pts:VIS, close:true, what:'een vis'}) }
);
/* basis eerst, dan oefenen, dan verdieping */
(function(){ const s = SECTIONS.find(x=>x.id==='coord'); s.cards = s.cards.map((c,i)=>[c,i]).sort((a,b)=>(a[0].lvl||1)-(b[0].lvl||1) || a[1]-b[1]).map(x=>x[0]); })();
/* ============================================================
   LIJNDIAGRAMMEN: HINT MET WERKBAAR ASSENSTELSEL + EXTRA OEFENINGEN
   ============================================================ */
(function(){
  const css = `
  .hint-bar{ display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; margin:.3rem 0 .2rem; }
  .hint-bar .btn.on{ outline:3px solid var(--orange); }
  .ch .fine{ stroke:var(--tq); stroke-width:.8; opacity:.55; }
  .ch .fine.half{ stroke-dasharray:3 4; opacity:.45; }
  .ch .guide{ stroke:var(--orange); stroke-width:2.2; stroke-dasharray:6 5; }
  .ch .guide-pt{ fill:var(--orange); stroke:#fff; stroke-width:2; }
  .ch .guide-lab{ font-weight:700; fill:var(--ink); paint-order:stroke; stroke:var(--card); stroke-width:5px; }
  .ch .pin .guide{ stroke:var(--accent-dark); }
  .ch .pin .guide-pt{ fill:var(--accent-dark); }
  .ch .hint-hit{ fill:transparent; cursor:crosshair; }
  .hint-help{ font-size:.88rem; color:var(--ink-soft); }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* lijndiagram met een hintknop: er verschijnt een fijn rooster, en de leerling kan op de grafiek
   klikken of slepen: stippellijnen naar de x-as en de y-as tonen de coördinaat van dat punt */
function lineHint(d, opts={}){
  return b => {
    const v = el('div','viz mid'); b.append(v);
    const svg = drawChart('lijn', Object.assign({anim:false}, d), 600, 340); v.append(svg);
    if(QZ) return;
    const bar = el('div','hint-bar'); const hb = el('button','btn ghost','💡 Hint: werk op het assenstelsel'); hb.type='button';
    const clr = el('button','linkbtn','Wis mijn hulplijnen'); clr.type='button'; clr.hidden = true;
    const help = el('span','hint-help'); help.hidden = true;
    help.textContent = 'Beweeg over de grafiek of klik: de stippellijnen tonen welk punt je afleest. Een klik laat de hulplijnen staan.';
    bar.append(hb, clr, help); b.append(bar);
    const L=svg._L, T=svg._T, pw=svg._pw, ph=svg._ph, yMin=svg._yMin, yMax=svg._yMax, n=d.labels.length, xs=svg._xs;
    const Y = val => T + ph*(1-(val-yMin)/(yMax-yMin));
    const step = d.step || niceStep(yMax-yMin);
    const half = opts.half !== false && d.labels.every(l=>!isNaN(parseLoose(l)));
    let on = false; const grid = svgEl('g', {}, svg), pins = svgEl('g', {}, svg), live = svgEl('g', {}, svg);
    const hit = svgEl('rect', {x:L, y:T-6, width:pw, height:ph+12, class:'hint-hit'}, svg); hit.style.display='none';
    function drawGrid(){
      grid.innerHTML='';
      for(let i=0;i<n;i++) svgEl('line',{x1:xs(i), y1:T, x2:xs(i), y2:T+ph, class:'fine'}, grid);
      if(half) for(let i=0;i<n-1;i++){ const x=(xs(i)+xs(i+1))/2; svgEl('line',{x1:x, y1:T, x2:x, y2:T+ph, class:'fine half'}, grid); }
      const sub = step/(opts.sub || (step%2===0 || step===1 ? 2 : 5));
      for(let y=yMin; y<=yMax+1e-9; y+=sub) svgEl('line',{x1:L, y1:Y(y), x2:L+pw, y2:Y(y), class:'fine'+(Math.abs(y/step-Math.round(y/step))>1e-6?' half':'')}, grid);
    }
    /* waarde op de lijn bij een (eventueel halve) plaats t */
    function valAt(series, t){ const i=Math.floor(t), f=t-i, a=+series.values[i], c=+series.values[Math.min(n-1,i+1)]; return f? a+(c-a)*f : a; }
    function xAt(t){ const i=Math.floor(t), f=t-i; return f? xs(i)+(xs(Math.min(n-1,i+1))-xs(i))*f : xs(i); }
    function labAt(t){ if(Number.isInteger(t)) return d.labels[t]; const a=parseLoose(d.labels[Math.floor(t)]), c=parseLoose(d.labels[Math.floor(t)+1]); return nf(a+(c-a)*(t-Math.floor(t)), 2); }
    function guides(g, t){
      g.innerHTML=''; const x = xAt(t);
      d.series.forEach((s,k)=>{ const val = valAt(s, t), y = Y(val);
        if(k===0) svgEl('line',{x1:x, y1:T+ph, x2:x, y2:Math.min(...d.series.map(ss=>Y(valAt(ss,t)))), class:'guide'}, g);
        svgEl('line',{x1:x, y1:y, x2:L, y2:y, class:'guide'}, g);
        svgEl('circle',{cx:x, cy:y, r:6, class:'guide-pt'}, g);
        const txt = `(${labAt(t)}, ${nf(Math.round(val*100)/100, 2)})`;
        svgText(g, x+(x>L+pw*0.75?-10:10), y-10-(k*16), (d.series.length>1&&s.name?s.name+' ':'')+txt, {'text-anchor':x>L+pw*0.75?'end':'start', class:'guide-lab'});
      });
    }
    function tFrom(ev){ const pt=svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY; const p=pt.matrixTransform(svg.getScreenCTM().inverse());
      let best=0, bd=1e9; const cand=[]; for(let i=0;i<n;i++){ cand.push(i); if(half && i<n-1) cand.push(i+.5); }
      cand.forEach(t=>{ const dd=Math.abs(xAt(t)-p.x); if(dd<bd){ bd=dd; best=t; } }); return best; }
    hit.addEventListener('pointermove', ev=>guides(live, tFrom(ev)));
    hit.addEventListener('pointerleave', ()=>live.innerHTML='');
    hit.addEventListener('click', ev=>{ const g=svgEl('g',{class:'pin'}, pins); guides(g, tFrom(ev)); clr.hidden=false; });
    hb.addEventListener('click', ()=>{ on=!on; hb.classList.toggle('on', on); help.hidden=!on; hit.style.display = on?'':'none'; if(on) drawGrid(); else { grid.innerHTML=''; live.innerHTML=''; } svg.append(hit); });
    clr.addEventListener('click', ()=>{ pins.innerHTML=''; clr.hidden=true; });
  };
}

/* --- punten van een tabel in een lijndiagram plaatsen --- */
function linePlot(b, st, save, key, cfg){
  const quiz = QZ; const qid = QID('plot'); if(!quiz) CLvraag(qid);
  const n = cfg.labels.length; const vals = st.v || (st.v = Array(n).fill(null));
  b.append(el('div','sub', cfg.ask || 'Klik boven elke waarde op de x-as op de juiste hoogte. Klik opnieuw om een punt te verplaatsen.'));
  const v = el('div','viz mid'); b.append(v);
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn); const fb = el('div','fb'); b.append(act, fb);
  if(quiz) act.hidden = true;
  let locked = false;
  function draw(show){
    v.innerHTML='';
    const svg = drawChart('lijn', Object.assign({}, cfg.chart, {labels:cfg.labels, series:[{values:vals.map(x=>x==null?null:x)}], anim:false}), 600, 340); v.append(svg);
    const T=svg._T, ph=svg._ph, yMin=svg._yMin, yMax=svg._yMax;
    if(show) [...svg.querySelectorAll('circle.pt')].forEach(c=>{ const i = cfg.labels.findIndex((_,k)=>Math.abs(svg._xs(k)-(+c.getAttribute('cx')))<1); if(i>=0 && vals[i]!==cfg.values[i]) c.classList.add('or'); });
    for(let i=0;i<n;i++){ const x=svg._xs(i); const w = Math.min(50, svg._pw/n*0.9);
      const hit = svgEl('rect',{x:x-w/2, y:T-8, width:w, height:ph+16, class:'hit'}, svg); hit.style.cursor='crosshair';
      hit.addEventListener('click', ev=>{ if(locked) return; const pt=svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY; const p=pt.matrixTransform(svg.getScreenCTM().inverse());
        let val = yMin + (1-(p.y-T)/ph)*(yMax-yMin); const sn = cfg.snap || 1; val = Math.round(val/sn)*sn; vals[i] = Math.max(yMin, Math.min(yMax, val)); st.checked=false; save(); draw(false); }); }
  }
  const isOk = () => vals.every((x,i)=>x===cfg.values[i]);
  btn.addEventListener('click', ()=>{ const ok = isOk(); draw(true); fb.className='fb '+(ok?'ok':(vals.some(x=>x==null)?'info':'bad'));
    fb.innerHTML = ok ? '✅ Juist! '+(cfg.why||'') : vals.some(x=>x==null) ? 'Plaats eerst alle punten.' : `❌ De oranje punten staan nog niet goed. ${cfg.hint||''}`;
    if(vals.every(x=>x!=null)) CLres(qid, ok); st.checked=true; save(); });
  draw(!!st.checked && !quiz);
  if(quiz) quiz.push({ grade:isOk, reveal:()=>draw(true), lock:()=>{ locked=true; } });
}

/* --- een willekeurig lijndiagram aflezen (nieuwe opgave) --- */
const GROEI = r => {
  const kind = rPick(r, ['plant','water','spaar']);
  if(kind==='plant'){ const v=[rInt(r,2,4)]; for(let i=1;i<8;i++) v.push(v[i-1] + rPick(r,[0,1,2,2,3])); const i=rInt(r,1,6), j=rInt(r,i+1,7);
    return {d:{labels:['0','1','2','3','4','5','6','7'], series:[{values:v}], xTitle:'Tijd (in weken)', yTitle:'Lengte (in cm)', step:2, yMax:Math.ceil((v[7]+2)/2)*2}, i, j, wat:'de plant', eenh:'cm', tijd:'week', v}; }
  if(kind==='water'){ const v=[rPick(r,[80,90,100])]; for(let i=1;i<7;i++) v.push(Math.max(0, v[i-1] - rPick(r,[0,10,10,20]))); const i=rInt(r,1,5), j=rInt(r,i+1,6);
    return {d:{labels:['0','1','2','3','4','5','6'], series:[{values:v}], xTitle:'Tijd (in dagen)', yTitle:'Water in de ton (in liter)', step:10, yMax:100}, i, j, wat:'de regenton', eenh:'liter', tijd:'dag', v}; }
  const v=[rPick(r,[10,20,30])]; for(let i=1;i<7;i++) v.push(v[i-1] + rPick(r,[0,5,10,15]) - (r()<.2?10:0)); const i=rInt(r,1,5), j=rInt(r,i+1,6);
  return {d:{labels:['jan','feb','mrt','apr','mei','jun','jul'], series:[{values:v}], xTitle:'Maand', yTitle:'Spaarpot (in euro)', step:10, yMax:Math.ceil((Math.max(...v)+5)/10)*10}, i, j, wat:'de spaarpot', eenh:'euro', tijd:'maand', v, mnd:true};
};
function lineGenEx(b, st, save, key, g){
  lineHint(g.d)(b);
  const L = g.d.labels, v = g.v;
  list([
    {html:`Lees het punt af bij ${g.mnd?L[g.i]:L[g.i]+' '+g.tijd+(L[g.i]==='1'?'':'en')}: ( ${L[g.i]} , [[0]] )`, size:'xs', check:exact(v[g.i], 'Ga loodrecht naar boven tot de grafiek, dan loodrecht naar de y-as. Gebruik de hint als je twijfelt.'), sol:`Het punt is <b>(${L[g.i]}, ${v[g.i]})</b>.`},
    {html:`Hoeveel ${g.eenh} verschil is er tussen ${L[g.i]} en ${L[g.j]}? [[0]] ${g.eenh}`, size:'sm', check:exact(Math.abs(v[g.j]-v[g.i]), 'Lees beide waarden af en trek af.'), sol:`${Math.max(v[g.i],v[g.j])} − ${Math.min(v[g.i],v[g.j])} = <b>${Math.abs(v[g.j]-v[g.i])} ${g.eenh}</b>.`}
  ], {letters:true})(b, st, save, key);
}

/* ============================================================
   EXTRA KAARTEN BIJ LIJNDIAGRAMMEN
   ============================================================ */
const KAARS = {labels:['0','1','2','3','4','5','6','7','8'], values:[20,18,16,14,12,10,8,6,4]};
const CHOCO = {labels:['0','2','4','6','8','10','12','14'], series:[{values:[80,64,53,45,39,35,32,30]}], xTitle:'Tijd (in minuten)', yTitle:'Temperatuur (in °C)', step:10, yMax:90};
(function(){
  const sec = SECTIONS.find(s=>s.id==='lijn');
  /* de bestaande grafieken krijgen ook de hintknop */
  sec.cards[1].build = combo(lineHint(HOOGTE), list([
          {html:'Op welke hoogte start de wandeling? [[0]] m', mode:'numeric', check:exact(600), sol:'Bij tijd 0 staat de grafiek op 600 m.'},
          {html:'Wat is de hoogste hoogte? [[0]] m', mode:'numeric', check:exact(1300), sol:'Het hoogste punt staat op 1300 m (na 3 en na 4 uur).'},
          {html:'Hoeveel meter steeg de wandelaar in het tweede uur (van uur 1 tot uur 2)? [[0]] m', mode:'numeric', check:exact(300), sol:'1100 m − 800 m = <b>300 m</b>.'}
        ], {letters:true}),
        choiceList([['In welk uur daalt de wandelaar het meest?', 'c', 'Van uur 5 naar uur 6 daalt hij 300 m: de lijn is daar het steilst naar beneden.']],
          [['a','van uur 4 tot 5'],['b','van uur 3 tot 4'],['c','van uur 5 tot 6'],['d','van uur 6 tot 7']]));
  sec.cards[3].build = combo(lineHint({labels:['jan','feb','mrt','apr','mei','jun'], series:[{name:'Gent', values:[6,8,11,15,18,21]},{name:'Lissabon', values:[15,16,19,19,23,26]}], yTitle:'Temperatuur (in °C)', step:5, yMax:30}),
        list([
          {html:'Hoeveel graden scheelt het in januari? [[0]] °C', mode:'numeric', check:exact(9), sol:'15 °C − 6 °C = <b>9 °C</b>.'},
          {html:'In welke maand is het verschil het kleinst? [[0]]', check:words(['april','apr']), sol:'In april: 19 °C − 15 °C = 4 °C. De lijnen liggen daar het dichtst bij elkaar.'}
        ], {letters:true}));
  sec.cards.push(
    { title:'De brandende kaars: van tabel naar grafiek', lvl:1, instr:'Een kaars van 20 cm brandt op. Plaats de punten uit de tabel in het lijndiagram.',
      build:combo(html(ftabHTML(['brandtijd (in uur)', ...KAARS.labels], [['hoogte (in cm)', ...KAARS.values.map(String)]])),
        (b,st,save,key)=>linePlot(b,st,save,key,{labels:KAARS.labels, values:KAARS.values, chart:{xTitle:'Brandtijd (in uur)', yTitle:'Hoogte (in cm)', step:2, yMin:0, yMax:22}, snap:1, hint:'Elk hokje op de verticale as is 2 cm. Zoek eerst de juiste brandtijd, ga dan naar boven.', why:'Elk uur brandt de kaars 2 cm op: de punten liggen op een rechte lijn.'})) },
    { title:'Coördinaten in een lijndiagram', lvl:1, instr:'Elk punt van de grafiek is een coördinaat: (brandtijd, hoogte). Vul aan.',
      build:combo(lineHint({labels:KAARS.labels, series:[{values:KAARS.values}], xTitle:'Brandtijd (in uur)', yTitle:'Hoogte (in cm)', step:2, yMax:22}), list([
        {html:'P( 3 , [[0]] )', size:'xs', check:exact(14), sol:'Na 3 uur is de kaars 14 cm: <b>P(3, 14)</b>.'},
        {html:'Q( [[0]] , 8 )', size:'xs', check:exact(6), sol:'De kaars is 8 cm na 6 uur: <b>Q(6, 8)</b>.'},
        {html:'Wat betekent het punt R(0, 20)? De kaars is [[0]] cm lang na [[1]] uur.', size:'xs', check:nums([20,0]), sol:'Bij de start (0 uur) is de kaars 20 cm.'}
      ], {letters:true})) },
    { title:'Lees af (nieuwe opgave)', lvl:2, instr:'Lees af uit het lijndiagram. Twijfel je? Vraag een hint: dan kan je op het assenstelsel werken.',
      build:fresh(GROEI, (b,st,save,key,g)=>lineGenEx(b,st,save,key,g)) },
    { title:'Tussen twee punten', lvl:2, instr:'Je kan ook tussen twee punten aflezen. Gebruik de hint: de stippellijnen staan ook halverwege.',
      build:combo(lineHint({labels:KAARS.labels, series:[{values:KAARS.values}], xTitle:'Brandtijd (in uur)', yTitle:'Hoogte (in cm)', step:2, yMax:22}), list([
        {html:'Hoe hoog is de kaars na 2,5 uur? [[0]] cm', check:exact(15), sol:'Halverwege 16 cm (2 uur) en 14 cm (3 uur): <b>15 cm</b>.'},
        {html:'Na hoeveel uur is de kaars 11 cm? [[0]] uur', check:exact(4.5), sol:'Halverwege 12 cm (4 uur) en 10 cm (5 uur): na <b>4,5 uur</b>.'}
      ], {letters:true})) },
    { title:'Een kop warme chocolademelk', lvl:2, instr:'De temperatuur van een kop chocolademelk die afkoelt.',
      build:combo(lineHint(CHOCO), list([
        {html:'Hoe warm is de chocolademelk na 4 minuten? [[0]] °C', mode:'numeric', check:exact(53), sol:'Na 4 minuten: <b>53 °C</b>.'},
        {html:'Hoeveel graden koelt ze af in de eerste 2 minuten? [[0]] °C', mode:'numeric', check:exact(16), sol:'80 − 64 = <b>16 °C</b>.'},
        {html:'En tussen minuut 12 en 14? [[0]] °C', mode:'numeric', check:exact(2), sol:'32 − 30 = <b>2 °C</b>.'}
      ], {letters:true}), choiceList([['Welke zin past bij de grafiek?', 'b', 'In het begin daalt de lijn steil, daarna steeds minder steil: eerst snel, dan traag afkoelen.']],
        [['a','De chocolademelk koelt elke minuut evenveel af.'],['b','Eerst koelt ze snel af, daarna steeds trager.'],['c','Eerst koelt ze traag af, daarna steeds sneller.']])) },
    { title:'Welk verhaal past bij de grafiek?', lvl:3, instr:'Lees de grafiek en kies het verhaal dat erbij past.',
      build:combo(lineHint({labels:['0','10','20','30','40','50','60'], series:[{values:[0,2,4,4,4,1,0]}], xTitle:'Tijd (in minuten)', yTitle:'Afstand van huis (in km)', step:1, yMax:5}),
        choiceList([['Welk verhaal past?', 'c', 'Weg van huis tot 4 km (20 min), 20 minuten op dezelfde plaats, dan sneller terug (op 20 minuten van 4 km naar 0).']],
          [['a','Lien fietst 60 minuten zonder te stoppen.'],['b','Lien fietst naar school en blijft daar.'],['c','Lien fietst 20 minuten naar de bakker, wacht 20 minuten en fietst dan terug naar huis.']]),
        list([{html:'Hoeveel km fietst Lien in totaal? [[0]] km', mode:'numeric', check:exact(8), sol:'4 km heen en 4 km terug: <b>8 km</b>.'}], {})) }
  );
  sec.cards = sec.cards.map((c,i)=>[c,i]).sort((a,b)=>(a[0].lvl||1)-(b[0].lvl||1) || a[1]-b[1]).map(x=>x[0]);
})();
/* ============================================================
   ZEESLAG IN HET ASSENSTELSEL (eigen hoofdstuk onder Coördinaten)
   Schieten = zelf een koppel (x, y) intikken. Schiet de tegenstander op jou,
   dan klik je zelf het juiste punt aan in jouw zee. Zo oefen je beide richtingen.
   Online, Firestore: zeeslag/{code} = { a, an, b, bn, stap, klaarA, klaarB, beurt, schoten[], winnaar }
              zeeslag/{code}/geheim/{e-mail} = { schepen } (enkel de eigenaar leest zijn schepen)
   De verdediger beoordeelt elk schot zelf (door het aan te klikken): zo ziet niemand de schepen van de ander.
   ============================================================ */
(function(){
  const css = `
  .zs{ --zs-bg:#f6efdc; --zs-was:rgba(70,140,195,.16); --zs-was2:rgba(59,193,197,.14); --zs-rand:#d8c79e; --zs-papier:#fbf7ec; --zs-ink:#1d3a52; --zs-zacht:#5b6f7d;
       --zs-lijn:#c9d6dc; --zs-romp:#b7c6cf; --zs-mis:#3d8fc6; --zs-raak:#c62a1e; --zs-hover:rgba(252,175,23,.45); --zs-chip:#fff3d6;
       position:relative; background:radial-gradient(ellipse 60% 45% at 12% 18%, var(--zs-was), transparent 70%), radial-gradient(ellipse 55% 50% at 92% 85%, var(--zs-was2), transparent 70%), radial-gradient(ellipse 40% 35% at 70% 10%, var(--zs-was), transparent 70%), var(--zs-bg);
       color:var(--zs-ink); border:2px solid var(--zs-rand); border-radius:1rem; box-shadow:inset 0 0 0 5px var(--zs-bg), inset 0 0 0 6px var(--zs-rand); padding:1rem clamp(.6rem, 2.5vw, 1.4rem) 1.1rem; margin:.3rem 0 .4rem; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .zs{ --zs-bg:#0f2130; --zs-was:rgba(70,140,195,.18); --zs-was2:rgba(59,193,197,.12); --zs-rand:#2e4c60; --zs-papier:#132a3b; --zs-ink:#dbe9f2; --zs-zacht:#93abbb;
       --zs-lijn:#2a4659; --zs-romp:#36546a; --zs-mis:#6fb8ea; --zs-raak:#ff7b72; --zs-hover:rgba(252,175,23,.4); --zs-chip:#3a2c0e; } }
  :root[data-theme="dark"] .zs{ --zs-bg:#0f2130; --zs-was:rgba(70,140,195,.18); --zs-was2:rgba(59,193,197,.12); --zs-rand:#2e4c60; --zs-papier:#132a3b; --zs-ink:#dbe9f2; --zs-zacht:#93abbb;
       --zs-lijn:#2a4659; --zs-romp:#36546a; --zs-mis:#6fb8ea; --zs-raak:#ff7b72; --zs-hover:rgba(252,175,23,.4); --zs-chip:#3a2c0e; }
  .zs-kop{ display:grid; grid-template-columns:56px 1fr 56px; align-items:center; gap:.5rem; margin-bottom:.5rem; }
  .zs-kop svg{ width:56px; height:56px; color:var(--zs-ink); }
  .zs-kop h3{ margin:0; text-align:center; font-size:clamp(1.05rem, 3.4vw, 1.55rem); letter-spacing:.14em; text-transform:uppercase; color:var(--zs-ink); text-wrap:balance; }
  .zs-kop .zs-sub{ display:block; text-align:center; font-size:.85rem; letter-spacing:.2em; text-transform:uppercase; color:var(--zs-zacht); margin-top:.15rem; }
  .zs-stat{ font-size:1.08rem; margin:.3rem 0 .5rem; color:var(--zs-ink); }
  .zs-stat.mijn{ font-weight:800; }
  .zs-actie{ display:flex; flex-wrap:wrap; align-items:center; gap:.6rem; background:var(--zs-papier); border:2px solid var(--zs-rand); border-radius:.8rem; padding:.55rem .8rem; margin:.4rem 0 .6rem; }
  .zs-actie .bigq{ color:var(--zs-ink); }
  .zs-actie .inp{ background:var(--card); }
  .zs-vuur{ font-weight:800; }
  .zs-co{ display:inline-block; font-weight:800; font-size:1.25rem; color:var(--zs-ink); background:var(--zs-chip); border:2px solid var(--orange); border-radius:.5rem; padding:0 .45rem; letter-spacing:.03em; }
  .zs-inkomend{ border-color:var(--orange); }
  .zs-zeeen{ display:flex; flex-wrap:wrap; gap:1rem 1.4rem; align-items:flex-start; }
  .zs-zeeen > div{ flex:1 1 280px; min-width:0; max-width:430px; }
  .zs-zeeen h4{ margin:.1rem 0 .3rem; font-size:.95rem; letter-spacing:.16em; text-transform:uppercase; color:var(--zs-ink); }
  .zs .viz{ background:var(--zs-papier); border-color:var(--zs-rand); margin:0 0 .5rem; max-width:none; }
  .zs .ch .gr{ stroke:var(--zs-lijn); }
  .zs .ch .ax{ stroke:var(--zs-ink); }
  .zs .ch .ax[fill]{ fill:var(--zs-ink); }
  .zs-bord.klik .viz{ border-color:var(--orange); animation:zsGlow 1.4s ease-in-out infinite alternate; }
  @keyframes zsGlow{ from{ box-shadow:0 0 0 0 rgba(252,175,23,.0); } to{ box-shadow:0 0 0 5px rgba(252,175,23,.35); } }
  @media (prefers-reduced-motion: reduce){ .zs-bord.klik .viz{ animation:none; box-shadow:0 0 0 4px rgba(252,175,23,.35); } }
  .ch .zs-dot{ fill:var(--zs-papier); stroke:var(--zs-ink); stroke-width:1.6; }
  .ch .zs-dot.vol{ fill:var(--zs-ink); }
  .ch .zs-romp{ fill:var(--zs-romp); fill-opacity:.6; stroke:var(--zs-ink); stroke-width:1.5; stroke-linejoin:round; }
  .ch .zs-dek{ fill:none; stroke:var(--zs-ink); stroke-width:1; opacity:.35; }
  .ch .zs-mis{ fill:var(--zs-mis); fill-opacity:.25; stroke:var(--zs-mis); stroke-width:2; }
  .ch .zs-x{ stroke:var(--zs-raak); stroke-width:3.2; stroke-linecap:round; }
  .ch .zs-zonk{ fill:var(--zs-raak); fill-opacity:.2; stroke:var(--zs-raak); stroke-width:1.5; }
  .ch .zs-wacht{ fill:none; stroke:var(--orange); stroke-width:3; animation:zsBlink 1s ease-in-out infinite; }
  @keyframes zsBlink{ 50%{ opacity:.25; } }
  .ch .zs-fout{ fill:none; stroke:var(--orange); stroke-width:3; stroke-dasharray:4 3; animation:zsWeg 1.6s ease forwards; }
  @keyframes zsWeg{ 0%,60%{ opacity:1; } 100%{ opacity:0; } }
  .ch .zs-hit{ fill:transparent; cursor:crosshair; }
  .ch .zs-hit:hover{ fill:var(--zs-hover); }
  .zs-vloot{ background:var(--zs-papier); border:2px solid var(--zs-rand); border-radius:.8rem; padding:.45rem .7rem; }
  .zs-vloot h5{ margin:0 0 .25rem; font-size:.8rem; letter-spacing:.18em; text-transform:uppercase; color:var(--zs-zacht); }
  .zs-schip{ display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:.15rem .6rem; padding:.3rem 0; border-top:1px dashed var(--zs-rand); }
  .zs-schip:first-of-type{ border-top:0; }
  .zs-schip b{ color:var(--zs-ink); }
  .zs-schip .lbl{ font-size:.85rem; color:var(--zs-zacht); text-align:right; }
  .zs-schip.weg b{ text-decoration:line-through; text-decoration-color:var(--zs-raak); text-decoration-thickness:2px; }
  .zs-schip.weg .lbl{ color:var(--zs-raak); font-weight:700; }
  .zs-schip svg{ grid-column:1 / -1; height:26px; width:auto; max-width:100%; color:var(--zs-ink); }
  .zs-log{ margin:.1rem 0 .5rem; padding:0; list-style:none; display:flex; flex-direction:column; gap:.15rem; }
  .zs-log li{ color:var(--zs-ink); }
  .zs-voet{ margin:.7rem 0 0; text-align:center; font-size:.9rem; color:var(--zs-zacht); font-style:italic; }
  .zs-knoppen{ display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; }
  .zs-lobby{ display:flex; flex-wrap:wrap; gap:1rem 1.6rem; align-items:flex-end; margin:.4rem 0; }
  .zs-lobby > div{ display:flex; flex-direction:column; gap:.35rem; }
  .zs-code{ font:800 2rem/1 var(--f-body); letter-spacing:.25em; color:var(--zs-ink); background:var(--zs-chip); border:2px dashed var(--orange); border-radius:.6rem; padding:.3rem .2rem .3rem .45rem; display:inline-block; }
  .zs-in{ width:7.5rem; text-transform:uppercase; letter-spacing:.2em; font-weight:800; }
  .zs .fb:empty{ display:none; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();
const ZS_LEN = [5, 4, 3], ZS_M = 3; /* rooster van −3 tot 3 */
const ZS_NAMEN = ['Slagschip', 'Kruiser', 'Torpedobootjager'];
const ZS_TEKENS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const zsEsc = s => String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const zsZeg = r => r === 'mis' ? '💧 mis' : r === 'raak' ? '💥 raak!' : '🔥 raak en gezonken!';
/* kompasroos en meeuw voor de kop, zoals op het werkblad */
const ZS_KOMPAS = `<svg viewBox="0 0 56 56" aria-hidden="true" fill="none" stroke="currentColor"><circle cx="28" cy="28" r="20" stroke-width="1.5"/><circle cx="28" cy="28" r="15" stroke-width=".8" stroke-dasharray="2 2"/>
  <path d="M28 4 L32 28 L28 52 L24 28 Z" fill="currentColor" fill-opacity=".85" stroke-width="1"/><path d="M4 28 L28 24 L52 28 L28 32 Z" fill="currentColor" fill-opacity=".35" stroke-width="1"/>
  <path d="M28 4 L32 28 L28 28 Z" fill="#fcaf17" stroke="none"/><text x="28" y="3.5" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">N</text></svg>`;
const ZS_MEEUW = `<svg viewBox="0 0 56 56" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 26 q8 -10 16 0 q8 -10 16 0"/><path d="M30 40 q5 -6 10 0 q5 -6 10 0" stroke-width="1.5" opacity=".6"/></svg>`;
function zsKader(sub){
  const z = el('div','zs');
  z.append(el('div','zs-kop', `${ZS_KOMPAS}<h3>⚓ Zeeslag assenstelsel ⚓<span class="zs-sub">${sub}</span></h3>${ZS_MEEUW}`));
  return z;
}
const zsVoet = () => el('p','zs-voet','Gebruik (x, y) om te schieten. Schiet de ander op jou? Klik dan zelf het juiste punt aan in jouw zee.');
/* Firebase via aanmelden.js (zelfde module als de pagina, dus dezelfde aanmelding) */
let ZS_FB = null;
async function zsFirebase(){
  if(ZS_FB) return ZS_FB;
  const kop = document.querySelector('script[src*="gedeeld/kop.js"]');
  if(!kop) throw new Error('geen platform');
  const M = await import(new URL('aanmelden.js', kop.src).href);
  const s = await Promise.race([M.klaar, new Promise((_, rej)=>setTimeout(()=>rej(new Error('niet aangemeld')), 15000))]);
  ZS_FB = { F:M.F, db:M.db, me:s.email, naam:(s.user && s.user.displayName) || s.email.split('@')[0] };
  return ZS_FB;
}
function zsSchepen(){
  /* schepen mogen op een as liggen (anders past een schip van 5 niet), maar raken elkaar niet */
  for(let poging=0;poging<500;poging++){
    const occ = new Set(), ships = [];
    for(const len of ZS_LEN){ for(let t=0;t<200;t++){ const hor = Math.random()<.5; const x = rInt(Math.random, -ZS_M, hor?ZS_M-len+1:ZS_M), y = rInt(Math.random, -ZS_M, hor?ZS_M:ZS_M-len+1);
      const cells = [...Array(len)].map((_,i)=>hor?[x+i,y]:[x,y+i]);
      if(cells.some(c=>occ.has(c+''))) continue;
      if(cells.some(([cx,cy])=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>occ.has([cx+dx,cy+dy]+'')))) continue;
      cells.forEach(c=>occ.add(c+'')); ships.push(cells); break; } }
    if(ships.length === ZS_LEN.length) return ships;
  }
  return null;
}
/* een romp rond de roosterpunten van een schip: ronde achtersteven, spitse boeg */
function zsRomp(g, P, cells){
  const u = P.u, xs = cells.map(c=>c[0]), ys = cells.map(c=>c[1]), hor = new Set(ys).size === 1;
  const n = cells.length, L = (n-1)*u, h = u*.34;
  const d = `M${-u*.42},${-h} L${L+u*.05},${-h} Q${L+u*.36},${-h} ${L+u*.52},0 Q${L+u*.36},${h} ${L+u*.05},${h} L${-u*.42},${h} Q${-u*.56},0 ${-u*.42},${-h} Z`;
  const tf = hor ? `translate(${P.X(Math.min(...xs))},${P.Y(ys[0])})` : `translate(${P.X(xs[0])},${P.Y(Math.min(...ys))}) rotate(-90)`;
  const gg = svgEl('g', { transform:tf }, g);
  svgEl('path', { d, class:'zs-romp' }, gg);
  svgEl('line', { x1:-u*.3, y1:0, x2:L+u*.3, y2:0, class:'zs-dek' }, gg);
}
/* een zee: rooster met open bolletjes, eventueel eigen schepen (●) en schoten.
   o.klik(x, y) maakt de zee aanklikbaar (alleen om een binnenkomend schot aan te duiden). */
function zsZee(titel, schoten, schepen, o = {}){
  const w = el('div','zs-bord' + (o.klik ? ' klik' : '')); w.append(el('h4','', titel));
  const P = plane({ min:-ZS_M, max:ZS_M, u:42 }); w.append(planeBox(P.svg));
  P.svg.setAttribute('aria-label', titel);
  const g = svgEl('g', {}, P.layer);
  const opSchip = new Set(); (schepen || []).forEach(s=>{ zsRomp(g, P, s); s.forEach(c=>opSchip.add(c+'')); });
  for(let x=-ZS_M;x<=ZS_M;x++) for(let y=-ZS_M;y<=ZS_M;y++) svgEl('circle', { cx:P.X(x), cy:P.Y(y), r:5.5, class:'zs-dot' + (opSchip.has([x,y]+'') ? ' vol' : '') }, g);
  schoten.forEach(q=>{ const X = P.X(q.x), Y = P.Y(q.y);
    if(!q.r){ svgEl('circle', { cx:X, cy:Y, r:11, class:'zs-wacht' }, g); return; }
    if(q.r === 'mis'){ svgEl('circle', { cx:X, cy:Y, r:9, class:'zs-mis' }, g); return; }
    if(q.zonk || q.r === 'gezonken') svgEl('circle', { cx:X, cy:Y, r:13, class:'zs-zonk' }, g);
    svgEl('line', { x1:X-8, y1:Y-8, x2:X+8, y2:Y+8, class:'zs-x' }, g); svgEl('line', { x1:X-8, y1:Y+8, x2:X+8, y2:Y-8, class:'zs-x' }, g); });
  if(o.klik){
    const hits = svgEl('g', {}, P.top);
    for(let x=-ZS_M;x<=ZS_M;x++) for(let y=-ZS_M;y<=ZS_M;y++){
      const c = svgEl('circle', { cx:P.X(x), cy:P.Y(y), r:P.u*.46, class:'zs-hit', 'data-x':x, 'data-y':y }, hits);
      c.addEventListener('click', ()=>o.klik(x, y));
    }
  }
  w.fout = (x, y) => svgEl('circle', { cx:P.X(x), cy:P.Y(y), r:12, class:'zs-fout' }, g);
  return w;
}
/* vlootlijst zoals op het werkblad: naam, lengte, bolletjes (rood = geraakt) */
function zsVloot(titel, rijen){
  const v = el('div','zs-vloot'); v.append(el('h5','', titel));
  rijen.forEach((r, i)=>{
    const n = ZS_LEN[i], u = 18, W = n*u + u*1.4;
    const bol = [...Array(n)].map((_, k)=>`<circle cx="${u*.7 + k*u}" cy="13" r="5" fill="${r.geraakt[k] ? 'var(--zs-raak)' : 'var(--zs-papier)'}" stroke="currentColor" stroke-width="1.4"/>`).join('');
    const romp = `<path d="M2,6 L${W-u*.6},6 Q${W-u*.2},6 ${W-1},13 Q${W-u*.2},20 ${W-u*.6},20 L2,20 Q-1,13 2,6 Z" fill="var(--zs-romp)" stroke="currentColor" stroke-width="1.2"/>`;
    const rij = el('div','zs-schip' + (r.weg ? ' weg' : ''), `<b>${ZS_NAMEN[i]} (${n})</b><span class="lbl">${r.weg ? 'gezonken' : r.status || ''}</span><svg viewBox="-2 0 ${W+4} 26" aria-hidden="true">${romp}${bol}</svg>`);
    v.append(rij);
  });
  return v;
}
/* rijen voor je eigen vloot uit de schoten van de tegenstander */
const zsEigenVloot = (schepen, schoten) => schepen.map(s=>{ const geraakt = s.map(c=>schoten.some(q=>q.r && q.r !== 'mis' && q.x===c[0] && q.y===c[1])); return { geraakt, weg:geraakt.every(Boolean), status:geraakt.some(Boolean) ? 'geraakt' : 'drijft nog' }; });
/* uitleg bij een foute klik: waar ligt het juiste punt? */
function zsTip(x, y, kx, ky){
  const rl = x === 0 ? 'blijf op de y-as' : `ga ${Math.abs(x)} naar ${x > 0 ? 'rechts' : 'links'}`;
  const ob = y === 0 ? 'blijf op de x-as' : `${Math.abs(y)} naar ${y > 0 ? 'boven' : 'onder'}`;
  return `Je klikte op ${coStr(kx, ky)}. Het schot is op ${coStr(x, y)}: vertrek in de oorsprong, ${rl} (x) en dan ${ob} (y).`;
}
/* invulregel om te schieten: ( x , y ) + Vuur! */
function zsSchietRij(box, onVuur, focus){
  const a = el('div','zs-actie');
  const form = el('span','bigq', 'Schiet op ( <input class="inp xs" inputmode="text" aria-label="x"> , <input class="inp xs" inputmode="text" aria-label="y"> )');
  const go = el('button','btn zs-vuur','💣 Vuur!'); go.type = 'button'; a.append(form, go); box.append(a);
  const fb = el('div','fb'); box.append(fb);
  const [ix, iy] = form.querySelectorAll('input'); if(focus) setTimeout(()=>ix.focus({ preventScroll:true }), 50);
  const vuur = ()=>{ const x = parseLoose(ix.value), y = parseLoose(iy.value);
    if(!Number.isInteger(x) || !Number.isInteger(y) || Math.abs(x)>ZS_M || Math.abs(y)>ZS_M){ fb.className = 'fb info'; fb.textContent = 'Typ twee gehele getallen van −3 tot 3.'; return; }
    const m = onVuur(x, y); if(m){ fb.className = 'fb info'; fb.textContent = m; } else go.disabled = true; };
  go.onclick = vuur; [ix, iy].forEach(i=>i.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); vuur(); } }));
}
/* balk bij een binnenkomend schot */
function zsInkomend(box, wie, x, y){
  const a = el('div','zs-actie zs-inkomend', `<span class="bigq">💣 ${wie} schiet op <span class="zs-co">${coStr(x, y)}</span>. Klik dat punt aan in <b>jouw zee</b>.</span>`);
  a.dataset.x = x; a.dataset.y = y; box.append(a);
  const fb = el('div','fb'); box.append(fb); return fb;
}

function zeeslagOnline(b, st, save, key){
  if(QZ) return;
  const z = zsKader('tegen een klasgenoot'); b.append(z);
  const box = el('div'); z.append(box, zsVoet());
  let FB = null, unsub = null, ref = null, rol = null, code = null, mijnSchepen = null, bezig = false, mis = 0;
  const zelf = () => rol === 'a' ? 'b' : 'a';
  function stop(){ if(unsub){ unsub(); unsub = null; } }
  function lobby(msg){
    stop(); code = null; rol = null; mijnSchepen = null; delete st.code; save();
    box.innerHTML = '';
    box.append(el('p','zs-stat','Speel tegen een klasgenoot, elk op je eigen toestel. Eén van jullie maakt een spel en krijgt een code. De ander tikt die code in.'));
    const row = el('div','zs-lobby');
    const l = el('div'); const nieuw = el('button','btn','Nieuw spel maken'); nieuw.type = 'button'; l.append(el('b','', 'Ik maak een spel'), nieuw);
    const r = el('div'); const inp = el('input','inp zs-in'); inp.maxLength = 4; inp.setAttribute('aria-label','Code van het spel'); inp.placeholder = 'CODE';
    const mee = el('button','btn ghost','Meedoen'); mee.type = 'button'; const rr = el('div','zs-knoppen'); rr.append(inp, mee); r.append(el('b','', 'Ik heb een code'), rr);
    row.append(l, r); box.append(row);
    const fb = el('div','fb'); box.append(fb);
    if(msg){ fb.className = 'fb info'; fb.innerHTML = msg; }
    nieuw.onclick = ()=>maak().catch(e=>{ fb.className = 'fb bad'; fb.textContent = fout(e); });
    const join = ()=>meedoen(inp.value.trim().toUpperCase()).catch(e=>{ fb.className = 'fb bad'; fb.textContent = fout(e); });
    mee.onclick = join; inp.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); join(); } });
  }
  const fout = e => /aangemeld|platform|module|fetch/i.test(e.message) ? 'Zeeslag tegen elkaar werkt alleen als je aangemeld bent op het oefenplatform.' : /permission|insufficient/i.test(e.message) ? 'Dit lukt nog niet: je leerkracht moet zeeslag eerst aanzetten in Firebase.' : e.message;
  async function maak(){
    FB = await zsFirebase(); const { F, db } = FB;
    for(let t=0;t<20;t++){
      const c = [...Array(4)].map(()=>ZS_TEKENS[Math.floor(Math.random()*ZS_TEKENS.length)]).join('');
      const r = F.doc(db, 'zeeslag', c); const s = await F.getDoc(r);
      if(s.exists()) continue;
      await F.setDoc(r, { a:FB.me, an:FB.naam, b:null, bn:'', stap:'wacht', klaarA:false, klaarB:false, beurt:'a', schoten:[], winnaar:null, gemaakt:F.serverTimestamp() });
      return volg(c, 'a');
    }
    throw new Error('Geen vrije code gevonden. Probeer opnieuw.');
  }
  async function meedoen(c){
    if(!/^[A-Z0-9]{4}$/.test(c)) throw new Error('Een code heeft 4 tekens.');
    FB = await zsFirebase(); const { F, db } = FB;
    const r = F.doc(db, 'zeeslag', c); const s = await F.getDoc(r);
    if(!s.exists()) throw new Error(`Er is geen spel met code ${c}.`);
    const d = s.data();
    if(d.a === FB.me) return volg(c, 'a');
    if(d.b === FB.me) return volg(c, 'b');
    if(d.b) throw new Error('Dit spel heeft al twee spelers.');
    await F.updateDoc(r, { b:FB.me, bn:FB.naam, stap:'plaatsen' });
    return volg(c, 'b');
  }
  async function volg(c, rl){
    code = c; rol = rl; st.code = c; save();
    const { F, db } = FB; ref = F.doc(db, 'zeeslag', c);
    try{ const g = await F.getDoc(F.doc(db, 'zeeslag', c, 'geheim', FB.me)); if(g.exists()) mijnSchepen = g.data().schepen.map(s=>(s.c || s).map(p=>[p.x, p.y])); }catch(e){}
    stop(); unsub = F.onSnapshot(ref, snap=>{ if(!snap.exists()){ lobby('Het spel bestaat niet meer.'); return; } toon(snap.data()); }, e=>{ const f = box.querySelector('.fb'); if(f){ f.className = 'fb bad'; f.textContent = fout(e); } });
  }
  /* de verdediger heeft het binnenkomende schot juist aangeklikt: beoordelen en doorgeven */
  async function beoordeel(d){
    if(bezig || !mijnSchepen) return; const last = d.schoten[d.schoten.length-1];
    if(!last || last.w === rol || last.r) return;
    bezig = true;
    try{
      const tegen = d.schoten.filter(q=>q.w === last.w);
      const geraakt = c => tegen.some(q=>q.x===c[0] && q.y===c[1]);
      const schip = mijnSchepen.find(s=>s.some(c=>c[0]===last.x && c[1]===last.y));
      const r = !schip ? 'mis' : schip.every(geraakt) ? 'gezonken' : 'raak';
      const alles = mijnSchepen.every(s=>s.every(geraakt));
      const nieuw = Object.assign({}, last, { r }); if(r === 'gezonken') nieuw.l = schip.length;
      const upd = { schoten:d.schoten.slice(0, -1).concat([nieuw]), beurt:rol };
      if(alles){ upd.stap = 'klaar'; upd.winnaar = last.w; }
      await FB.F.updateDoc(ref, upd);
    } finally { bezig = false; }
  }
  function toon(d){
    /* zodra beide spelers klaar zijn, begint het spel; ook als het doorgeven van stap 'spel' nog niet aangekomen is */
    if(d.stap === 'plaatsen' && d.klaarA && d.klaarB){ FB.F.updateDoc(ref, { stap:'spel' }).catch(()=>{}); d = Object.assign({}, d, { stap:'spel' }); }
    const ik = rol, ander = zelf(), naamAnder = zsEsc((ander === 'a' ? d.an : d.bn) || 'je tegenspeler');
    box.innerHTML = '';
    const kop = el('div','zs-lobby'); kop.append(el('div','', `<span class="mini">Code van dit spel</span><span class="zs-code">${code}</span>`));
    const weg = el('button','linkbtn','Spel verlaten'); weg.type = 'button'; weg.onclick = ()=>lobby(); kop.append(weg); box.append(kop);
    if(d.stap === 'wacht'){ box.append(el('p','zs-stat', 'Geef de code aan je tegenspeler. Het spel start zodra die meedoet.')); return; }
    const klaar = ik === 'a' ? d.klaarA : d.klaarB, klaarAnder = ander === 'a' ? d.klaarA : d.klaarB;
    if(d.stap === 'plaatsen'){
      if(!klaar){
        if(!mijnSchepen) mijnSchepen = zsSchepen();
        box.append(el('p','zs-stat', `Je speelt tegen <b>${naamAnder}</b>. Jouw schepen liggen op de roosterpunten (●). Ze kunnen ook op een as liggen. Tevreden? Dan liggen ze klaar.`));
        const zz = el('div','zs-zeeen'); zz.append(zsZee('Jouw zee', [], mijnSchepen), zsVloot('Jouw vloot', zsEigenVloot(mijnSchepen, []))); box.append(zz);
        const bar = el('div','zs-knoppen');
        const ander_ = el('button','btn ghost','↻ Andere ligging'); ander_.type = 'button'; const ok = el('button','btn','⚓ Mijn schepen liggen klaar'); ok.type = 'button'; bar.append(ander_, ok); box.append(bar);
        ander_.onclick = ()=>{ mijnSchepen = zsSchepen(); toon(d); };
        const okFb = el('div','fb'); box.append(okFb);
        ok.onclick = async ()=>{ ok.disabled = true; okFb.className = 'fb info'; okFb.textContent = 'Je schepen worden doorgegeven …'; const { F, db } = FB;
          try{
            await F.setDoc(F.doc(db, 'zeeslag', code, 'geheim', FB.me), { schepen:mijnSchepen.map(s=>({ c:s.map(([x,y])=>({x,y})) })) }  /* Firestore kent geen lijst in een lijst: elk schip is een object met zijn cellen */);
            await F.updateDoc(ref, ik === 'a' ? { klaarA:true } : { klaarB:true });
          }catch(e){ ok.disabled = false; okFb.className = 'fb bad'; okFb.textContent = 'Je schepen konden niet doorgegeven worden. ' + fout(e); } };
        return;
      }
      box.append(el('p','zs-stat', `Wachten tot ${naamAnder} de schepen klaar heeft…`)); return;
    }
    /* spel of klaar */
    const mijnSchoten = d.schoten.filter(q=>q.w === ik), zijnSchoten = d.schoten.filter(q=>q.w === ander);
    const last = d.schoten[d.schoten.length-1], open = d.stap === 'spel' && last && !last.r;
    const aanZet = d.stap === 'spel' && d.beurt === ik && !open, opMij = open && last.w === ander;
    const stat = el('p','zs-stat' + (aanZet || opMij ? ' mijn' : ''));
    if(d.stap === 'klaar') stat.innerHTML = d.winnaar === ik ? `🎉 Gewonnen! Je liet alle schepen van ${naamAnder} zinken in ${mijnSchoten.length} schoten.` : `${naamAnder} won dit keer. Probeer het nog eens!`;
    else stat.innerHTML = aanZet ? 'Jij bent aan de beurt: typ een coördinaat en vuur.' : opMij ? `${naamAnder} heeft geschoten. Duid het schot aan.` : open ? `Wachten tot ${naamAnder} jouw schot op ${coStr(last.x, last.y)} aanduidt…` : `${naamAnder} is aan de beurt…`;
    box.append(stat);
    let fbIn = null, eigen = null;
    if(aanZet) zsSchietRij(box, (x, y)=>{
      if(mijnSchoten.some(q=>q.x===x && q.y===y)) return `Op ${coStr(x,y)} schoot je al.`;
      FB.F.updateDoc(ref, { schoten:d.schoten.concat([{ w:ik, x, y, r:'' }]) }); mis = 0; }, true);
    if(opMij) fbIn = zsInkomend(box, naamAnder, last.x, last.y);
    const log = el('ul','zs-log');
    const mijnLaatste = [...mijnSchoten].reverse().find(q=>q.r), zijnLaatste = [...zijnSchoten].reverse().find(q=>q.r);
    if(mijnLaatste) log.append(el('li','', `Jouw schot op ${coStr(mijnLaatste.x, mijnLaatste.y)}: ${zsZeg(mijnLaatste.r)}`));
    if(zijnLaatste && !opMij) log.append(el('li','', `Schot van ${naamAnder} op ${coStr(zijnLaatste.x, zijnLaatste.y)}: ${zsZeg(zijnLaatste.r)}`));
    if(log.children.length) box.append(log);
    const zz = el('div','zs-zeeen');
    const zonkLen = mijnSchoten.filter(q=>q.r === 'gezonken').map(q=>q.l);
    const doel = el('div'); doel.append(zsZee(`Zee van ${naamAnder}`, mijnSchoten.filter(q=>q.w), null),
      zsVloot(`Vloot van ${naamAnder}`, ZS_LEN.map(n=>{ const w = zonkLen.includes(n); return { geraakt:Array(n).fill(w), weg:w, status:'drijft nog' }; })));
    const mijn = el('div');
    eigen = zsZee('Jouw zee', opMij ? zijnSchoten.slice(0, -1) : zijnSchoten, mijnSchepen, opMij ? { klik:(x, y)=>{
      if(x === last.x && y === last.y){ fbIn.className = 'fb ok'; fbIn.textContent = 'Juist aangeduid!'; mis = 0; beoordeel(d); return; }
      mis++; eigen.fout(x, y); fbIn.className = 'fb bad'; fbIn.textContent = mis >= 2 ? zsTip(last.x, last.y, x, y) : `Dat is ${coStr(x, y)}. Kijk nog eens: eerst x (horizontaal), dan y (verticaal).`; } } : {});
    mijn.append(eigen, zsVloot('Jouw vloot', zsEigenVloot(mijnSchepen, zijnSchoten)));
    zz.append(doel, mijn); box.append(zz);
    if(d.stap === 'klaar'){ const opnieuw = el('button','btn','Nieuw spel'); opnieuw.type = 'button'; opnieuw.onclick = ()=>lobby(); box.append(opnieuw); }
  }
  /* na herladen terug in hetzelfde spel */
  if(st.code){ zsFirebase().then(f=>{ FB = f; return meedoen(st.code); }).catch(()=>lobby()); }
  else lobby();
}

/* ---- tegen de computer: jij zoekt zijn schepen, hij zoekt de jouwe ---- */
const zsRaak = (schepen, x, y) => schepen.find(sh=>sh.some(c=>c[0]===x && c[1]===y));
function zsUitslag(schepen, schoten, x, y){
  const sh = zsRaak(schepen, x, y); if(!sh) return 'mis';
  const alle = schoten.concat([{x,y}]);
  return sh.every(c=>alle.some(q=>q.x===c[0] && q.y===c[1])) ? 'gezonken' : 'raak';
}
const zsAlles = (schepen, schoten) => schepen.every(sh=>sh.every(c=>schoten.some(q=>q.x===c[0] && q.y===c[1])));
/* de computer: eerst willekeurig (dambordpatroon), na een treffer de buren afzoeken */
function zsComputerSchot(zijn){
  const gedaan = new Set(zijn.map(q=>q.x+','+q.y)), vrij = (x,y) => Math.abs(x)<=ZS_M && Math.abs(y)<=ZS_M && !gedaan.has(x+','+y);
  const open = zijn.filter(q=>q.r === 'raak');
  const doelen = [];
  open.forEach(q=>{ [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{ const x = q.x+dx, y = q.y+dy; if(vrij(x,y)) doelen.push([x,y]); }); });
  /* liefst in het verlengde van twee treffers op een rij */
  const rij = doelen.filter(([x,y])=>open.some(a=>open.some(b=>a!==b && ((a.y===b.y && a.y===y) || (a.x===b.x && a.x===x)))));
  const kies = arr => arr[Math.floor(Math.random()*arr.length)];
  if(rij.length) return kies(rij);
  if(doelen.length) return kies(doelen);
  const alle = []; for(let x=-ZS_M;x<=ZS_M;x++) for(let y=-ZS_M;y<=ZS_M;y++) if(vrij(x,y) && (x+y)%2===0) alle.push([x,y]);
  if(alle.length) return kies(alle);
  for(let x=-ZS_M;x<=ZS_M;x++) for(let y=-ZS_M;y<=ZS_M;y++) if(vrij(x,y)) alle.push([x,y]);
  return kies(alle);
}
function zeeslagComputer(b, st, save, key){
  if(QZ) return;
  if(!st.mijn || !st.comp){ st.mijn = zsSchepen(); st.comp = zsSchepen(); st.ik = []; st.zijn = []; st.stap = 'plaatsen'; st.in = null; st.juist = 0; save(); }
  if(st.juist == null) st.juist = 0;
  const z = zsKader('tegen de computer'); b.append(z);
  const box = el('div'); z.append(box, zsVoet());
  let wacht = false, mis = 0;
  function toon(){
    box.innerHTML = '';
    if(st.stap === 'plaatsen'){
      box.append(el('p','zs-stat', 'Jouw schepen liggen op de roosterpunten (●). De computer verstopte er ook drie. Om beurten schieten jullie. Wie eerst alle schepen van de ander laat zinken, wint.'));
      const zz = el('div','zs-zeeen'); zz.append(zsZee('Jouw zee', [], st.mijn), zsVloot('Jouw vloot', zsEigenVloot(st.mijn, []))); box.append(zz);
      const bar = el('div','zs-knoppen');
      const an = el('button','btn ghost','↻ Andere ligging'); an.type = 'button'; const ok = el('button','btn','⚓ Start het spel'); ok.type = 'button'; bar.append(an, ok); box.append(bar);
      an.onclick = ()=>{ st.mijn = zsSchepen(); save(); toon(); };
      ok.onclick = ()=>{ st.stap = 'spel'; save(); toon(); };
      return;
    }
    const gewonnen = zsAlles(st.comp, st.ik), verloren = zsAlles(st.mijn, st.zijn), inc = st.in;
    const bezig = !gewonnen && !verloren;
    const stat = el('p','zs-stat' + (bezig && !wacht ? ' mijn' : ''));
    const score = st.zijn.length ? ` Je duidde ${st.juist} van de ${st.zijn.length} schoten van de computer meteen juist aan.` : '';
    stat.innerHTML = gewonnen ? `🎉 Gewonnen! Je liet alle schepen van de computer zinken in ${st.ik.length} schoten.${score}` : verloren ? `De computer won dit keer. Probeer het nog eens!${score}` : wacht ? 'De computer mikt…' : inc ? 'De computer heeft geschoten. Duid het schot aan.' : 'Jij bent aan de beurt: typ een coördinaat en vuur.';
    box.append(stat);
    let fbIn = null, eigen = null;
    if(bezig && !wacht && !inc) zsSchietRij(box, (x, y)=>{
      if(st.ik.some(q=>q.x===x && q.y===y)) return `Op ${coStr(x,y)} schoot je al.`;
      st.ik.push({ x, y, r:zsUitslag(st.comp, st.ik, x, y) }); save();
      if(zsAlles(st.comp, st.ik)){ toon(); return; }
      wacht = true; toon();
      setTimeout(()=>{ const [cx, cy] = zsComputerSchot(st.zijn); st.in = { x:cx, y:cy }; mis = 0; save(); wacht = false; toon(); }, 900);
    }, st.ik.length > 0);
    if(bezig && inc) fbIn = zsInkomend(box, 'De computer', inc.x, inc.y);
    const log = el('ul','zs-log'), l1 = st.ik[st.ik.length-1], l2 = st.zijn[st.zijn.length-1];
    if(l1) log.append(el('li','', `Jouw schot op ${coStr(l1.x, l1.y)}: ${zsZeg(l1.r)}`));
    if(l2 && !inc && !wacht) log.append(el('li','', `De computer schoot op ${coStr(l2.x, l2.y)}: ${zsZeg(l2.r)}`));
    if(log.children.length) box.append(log);
    const zz = el('div','zs-zeeen');
    const doel = el('div'); doel.append(zsZee('Zee van de computer', st.ik, gewonnen || verloren ? st.comp : null),
      zsVloot('Vloot van de computer', st.comp.map(s=>{ const w = s.every(c=>st.ik.some(q=>q.x===c[0] && q.y===c[1])); return { geraakt:s.map(()=>w), weg:w, status:'drijft nog' }; })));
    const mijn = el('div');
    eigen = zsZee('Jouw zee', st.zijn, st.mijn, bezig && inc ? { klik:(x, y)=>{
      if(x === inc.x && y === inc.y){ if(!mis) st.juist++; st.zijn.push({ x, y, r:zsUitslag(st.mijn, st.zijn, x, y) }); st.in = null; save(); toon(); return; }
      mis++; eigen.fout(x, y); fbIn.className = 'fb bad'; fbIn.textContent = mis >= 2 ? zsTip(inc.x, inc.y, x, y) : `Dat is ${coStr(x, y)}. Kijk nog eens: eerst x (horizontaal), dan y (verticaal).`; } } : {});
    mijn.append(eigen, zsVloot('Jouw vloot', zsEigenVloot(st.mijn, st.zijn)));
    zz.append(doel, mijn); box.append(zz);
    if(!bezig){ const n = el('button','btn','Nieuw spel'); n.type = 'button'; n.onclick = ()=>{ delete st.mijn; delete st.comp; save(); b.innerHTML = ''; zeeslagComputer(b, st, save, key); }; box.append(n); }
  }
  toon();
}

/* ---- apart hoofdstuk Zeeslag, vlak onder Coördinaten ---- */
ICONS.zeeslag = '<path d="M3 15h18l-2.5 4.5h-13z"/><path d="M7 15V9h7l3 6"/><path d="M10 9V5"/><path d="M2.5 21.5c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/>';
(function(){
  const c = SECTIONS.find(s=>s.id==='coord');
  /* de oude zeeslag uit Coördinaten weghalen, maar zijn plaats houden: zo blijven de bewaarde antwoorden bij de juiste kaart */
  const k = c.cards.findIndex(x=>x.title==='Zeeslag'); if(k >= 0) c.cards[k] = { title:'', lvl:c.cards[k].lvl, skip:true, build:()=>{} };
  const i = SECTIONS.indexOf(c);
  SECTIONS.splice(i+1, 0, { id:'zeeslag', ic:'zeeslag', nav:'Zeeslag', title:'Zeeslag in het assenstelsel',
    tip:'Een schot is een koppel (x, y): eerst x (horizontaal), dan y (verticaal). Jij tikt de coördinaat in om te schieten. Schiet de ander op jou, dan klik je zelf het juiste punt aan.',
    cards:[
      { title:'Zeeslag tegen de computer', lvl:2, instr:'Om beurten schieten: jij tikt een coördinaat in, de computer roept er een af en jij klikt dat punt aan in jouw zee. Het telt niet mee.',
        build:(b,st,save,key)=>zeeslagComputer(b,st,save,key) },
      { title:'Zeeslag tegen een klasgenoot', lvl:2, instr:'Online, elk op je eigen toestel. Eén van jullie maakt een spel, de ander tikt de code in. Het telt niet mee.',
        build:(b,st,save,key)=>zeeslagOnline(b,st,save,key) }
    ]});
})();

/* ============================================================
   SORTEREN IN BAKKEN
   ============================================================ */
function sortBins(b, st, save, key, cfg){
  const pool = el('div','pool'); b.append(pool);
  const grid = el('div','sortbins'); b.append(grid);
  const fb = el('div','fb'); b.append(fb);
  const quiz = QZ;
  const bins = {}; cfg.bins.forEach(([id,lab])=>{ const bx = el('div','sortbin', `<h4>${lab}</h4>`); const ch = el('div','chips'); bx.append(ch); bx.dataset.bin=id; grid.append(bx); bins[id]={bx, ch}; });
  const place = st.p || (st.p = {});
  const ids = cfg.items.map((it,i)=>QID('s'+i)); if(!quiz) ids.forEach(id=>CLvraag(id));
  const chips = cfg.items.map((it,i)=>{ const c = el('span','chip', it.t); c.dataset.i=i; c.dataset.grp=key; return c; });
  function put(c, binId, silent){
    const i = +c.dataset.i, it = cfg.items[i];
    if(binId==null){ resetChipStyle(c); c.classList.remove('chip-ok','chip-bad'); pool.append(c); delete place[i]; save(); return; }
    bins[binId].ch.append(c); place[i] = binId; save();
    if(quiz) return;
    const ok = binId===it.a; c.classList.remove('chip-ok','chip-bad'); c.classList.add(ok?'chip-ok':'chip-bad');
    if(!silent){ fb.className='fb '+(ok?'ok':'bad'); fb.innerHTML = (ok?'✅ Juist! ':'❌ Niet juist. ') + (it.why||''); CLres(ids[i], ok); if(!ok){ c.classList.add('shake'); setTimeout(()=>c.classList.remove('shake'),400); } }
  }
  shuffle(chips).forEach(c=>{ pool.append(c); draggable(c, (x,y)=>{ const k = Object.keys(bins).find(id=>inRect(bins[id].bx,x,y)); put(c, k||null); }); });
  Object.keys(bins).forEach(id=> bins[id].bx.addEventListener('click', e=>{ if(e.target.closest('.chip')) return; if(selChip && selChip.dataset.grp===key){ const c=selChip; clearSel(); put(c, id); } }));
  pool.addEventListener('click', e=>{ if(e.target===pool && selChip && selChip.dataset.grp===key){ const c=selChip; clearSel(); put(c, null); } });
  chips.forEach(c=>{ const p = place[c.dataset.i]; if(p!=null && bins[p]) put(c, p, true); });
  if(quiz) quiz.push({ grade:()=>cfg.items.every((it,i)=>place[i]===it.a),
    reveal:()=>chips.forEach(c=>{ const i=+c.dataset.i; if(place[i]!=null) c.classList.add(place[i]===cfg.items[i].a?'chip-ok':'chip-bad'); }),
    lock:()=>chips.forEach(c=>c.dataset.locked='1') });
}

/* ============================================================
   TURVEN: VAN RUWE DATA NAAR FREQUENTIETABEL
   ============================================================ */
function tallySVG(n){
  if(!n) return '';
  let s = '', x = 2; const H = 20;
  for(let g=0; g<Math.ceil(n/5); g++){
    const k = Math.min(5, n-g*5);
    for(let j=0;j<Math.min(4,k);j++){ s += `<line x1="${x+j*5}" y1="2" x2="${x+j*5}" y2="${H-2}"/>`; }
    if(k===5) s += `<line x1="${x-3}" y1="${H-4}" x2="${x+18}" y2="4"/>`;
    x += 28;
  }
  return `<svg class="tally" width="${x}" height="${H}" viewBox="0 0 ${x} ${H}" style="vertical-align:middle" aria-label="${n} turfjes"><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round">${s}</g></svg>`;
}
function tallyEx(b, st, save, key, cfg){
  b.append(el('div','sub', cfg.ask || 'Ruwe gegevens: tik een antwoord aan en dan de juiste rij in de tabel.'));
  const raw = el('div','data-row'); b.append(raw);
  const tbl = el('table','ftab'); b.append(tbl);
  const head = `<thead><tr><th>${cfg.head||'gegeven'}</th><th>turven</th><th>frequentie</th></tr></thead>`;
  let body = '<tbody>';
  cfg.cats.forEach((c,i)=> body += `<tr data-c="${i}"><td class="l">${c}</td><td class="drop" data-c="${i}"></td><td><input class="inp xs" inputmode="numeric" data-af="${i}" aria-label="frequentie ${c}"></td></tr>`);
  body += `<tr><td class="l"><b>totaal</b></td><td></td><td><input class="inp xs" inputmode="numeric" data-af="tot" aria-label="totaal"></td></tr></tbody>`;
  tbl.innerHTML = head + body;
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn);
  const fb = el('div','fb'); b.append(act, fb);
  const quiz = QZ; const qid = QID('tabel'); if(!quiz) CLvraag(qid); else act.hidden = true;
  const done = st.done || (st.done = {}); const af = st.af || (st.af = {});
  let sel = null;
  const btns = cfg.data.map((v,i)=>{ const k = el('button','dv', v); k.type='button'; raw.append(k);
    k.addEventListener('click', ()=>{ if(done[i]) return; if(sel!=null) btns[sel].classList.remove('hi'); sel = (sel===i)?null:i; if(sel!=null) k.classList.add('hi'); });
    return k; });
  const cells = [...tbl.querySelectorAll('td.drop')];
  function counts(){ const c = cfg.cats.map(()=>0); Object.keys(done).forEach(i=>c[cfg.cats.indexOf(cfg.data[i])]++); return c; }
  function paint(){ const c = counts(); cells.forEach((td,i)=> td.innerHTML = tallySVG(c[i])); btns.forEach((k,i)=>{ k.disabled = !!done[i]; k.classList.toggle('gone', !!done[i]); }); }
  cells.forEach((td,ci)=> td.addEventListener('click', ()=>{
    if(sel==null){ fb.className='fb info'; fb.textContent='Tik eerst een antwoord aan in de rij hierboven.'; return; }
    const i = sel, ok = cfg.data[i]===cfg.cats[ci];
    if(!ok){ td.parentElement.classList.add('shake'); setTimeout(()=>td.parentElement.classList.remove('shake'),400); fb.className='fb bad'; fb.textContent=`❌ "${cfg.data[i]}" hoort niet bij ${cfg.cats[ci]}.`; return; }
    /* vliegend antwoord */
    const r0 = btns[i].getBoundingClientRect(), r1 = td.getBoundingClientRect();
    const f = el('span','dv flyer', cfg.data[i]); f.style.left=r0.left+'px'; f.style.top=r0.top+'px'; f.style.border='2px solid var(--orange)'; f.style.background='var(--or-soft)'; f.style.borderRadius='.5rem'; f.style.padding='.3rem .5rem'; f.style.fontWeight='700';
    document.body.append(f); requestAnimationFrame(()=>{ f.style.left=(r1.left+8)+'px'; f.style.top=(r1.top+4)+'px'; f.style.opacity='.2'; f.style.transform='scale(.6)'; });
    setTimeout(()=>f.remove(), 600);
    done[i] = 1; btns[i].classList.remove('hi'); sel = null; save(); paint();
    fb.className='fb'; fb.textContent = Object.keys(done).length===cfg.data.length ? 'Alles is geturfd. Tel nu de turfjes en vul de frequenties en het totaal in.' : '';
  }));
  const inps = [...tbl.querySelectorAll('input')];
  inps.forEach(inp=>{ const k=inp.dataset.af; if(af[k]!=null) inp.value=af[k]; inp.addEventListener('input', ()=>{ af[k]=inp.value; save(); inp.classList.remove('ok','bad'); }); inp.addEventListener('keydown', e=>{ if(e.key==='Enter' && !quiz){ e.preventDefault(); check(); } }); });
  const truth = k => k==='tot' ? cfg.data.length : countOf(cfg.data, cfg.cats[+k]);
  const okAll = () => inps.every(inp=>parseLoose(inp.value)===truth(inp.dataset.af));
  function check(silent){
    if(inps.some(i=>i.value.trim()==='')){ if(!silent){ fb.className='fb info'; fb.textContent='Vul eerst alle frequenties en het totaal in.'; } return; }
    inps.forEach(inp=>{ inp.classList.remove('ok','bad'); inp.classList.add(parseLoose(inp.value)===truth(inp.dataset.af)?'ok':'bad'); });
    const ok = okAll(); fb.className='fb '+(ok?'ok':'bad');
    fb.innerHTML = ok ? `✅ Juist! ${cfg.why||''}` : '❌ Nog niet juist. Tel de turfjes opnieuw: een bundeltje met een schuine streep is 5. Het totaal is het aantal antwoorden.';
    if(!silent){ CLres(qid, ok); st.checked = true; save(); }
  }
  btn.addEventListener('click', ()=>check());
  paint(); if(st.checked) check(true);
  if(quiz) quiz.push({grade:okAll, reveal:()=>inps.forEach(inp=>inp.classList.add(parseLoose(inp.value)===truth(inp.dataset.af)?'ok':'bad')), lock:()=>inps.forEach(i=>i.readOnly=true)});
}

/* ============================================================
   EEN DATASET, VIJF VOORSTELLINGEN
   ============================================================ */
function chartGallery(b, d){
  const types = [['tabel','Frequentietabel'],['dot','Dotplot'],['kolom','Staafdiagram'],['strook','Strookdiagram'],['cirkel','Cirkeldiagram']];
  const say = {
    tabel:'Een <b>frequentietabel</b> geeft per gegeven de frequentie: hoeveel keer het voorkomt.',
    dot:'In een <b>dotplot</b> staan de gegevens op de horizontale as. Voor elke keer dat een gegeven voorkomt, komt er een bolletje bij.',
    kolom:'In een <b>staafdiagram</b> staan de staven los van elkaar. Elke staaf is zo hoog als de frequentie.',
    strook:'In een <b>strookdiagram</b> is de hele strook 100 %. Elk gegeven krijgt een stuk in verhouding.',
    cirkel:'In een <b>cirkeldiagram</b> is de hele cirkel 100 % of 360°. Hoe groter het deel, hoe groter de middelpuntshoek.'
  };
  /* twee voorstellingen naast elkaar: kies links en rechts zelf welke */
  const tot = sum(d.series[0].values);
  const wrap = el('div','cg2'); b.append(wrap);
  const kant = (start, label) => {
    const col = el('div','cg-col'); const bar = el('div','viz-bar'); bar.append(el('span','lbl', label));
    const v = el('div','viz cg-v'); const out = el('div','readout'); col.append(bar, v, out); wrap.append(col);
    const btns = types.map(([t,l])=>{ const k = el('button','btn ghost', l); k.type='button'; bar.append(k);
      k.addEventListener('click', ()=>{ btns.forEach(x=>x.classList.remove('tool-on')); k.classList.add('tool-on'); v.innerHTML='';
        if(t==='tabel') v.innerHTML = ftabHTML([d.head||'gegeven','frequentie'], d.labels.map((l,i)=>[l, d.series[0].values[i]]).concat([['<b>totaal</b>', '<b>'+tot+'</b>']]));
        else v.append(drawChart(t, Object.assign({}, d, {yTitle: t==='kolom'? 'aantal' : d.yTitle})));
        out.innerHTML = say[t]; });
      return k; });
    btns[start].click();
  };
  kant(0, 'Links:'); kant(2, 'Rechts:');
}

/* ============================================================
   STAAFDIAGRAM BOUWEN DOOR TE SLEPEN
   ============================================================ */
function barBuilder(b, st, save, key, cfg){
  const v = el('div','viz mid'); b.append(v);
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn);
  const fb = el('div','fb'); b.append(act, fb);
  const quiz = QZ; const qid = QID('staven'); if(!quiz) CLvraag(qid); else act.hidden=true;
  const vals = st.v || (st.v = cfg.labels.map(()=>0));
  let svg, dragI = -1;
  function draw(){
    v.innerHTML = '';
    svg = drawChart('kolom', {labels:cfg.labels, series:[{values:vals}], yMax:cfg.yMax, step:cfg.step, yTitle:cfg.yTitle||'aantal', xTitle:cfg.xTitle, title:cfg.title, anim:false, values:true});
    v.append(svg);
    const slot = svg._pw/svg._n;
    cfg.labels.forEach((l,i)=>{
      const x = svg._L+slot*i, y = svg._T + svg._ph*(1-vals[i]/cfg.yMax);
      svgEl('rect',{x:x+slot*0.19, y:y-5, width:slot*0.62, height:10, rx:4, fill:'var(--orange)', class:'dragme'}, svg);
      const hit = svgEl('rect',{x, y:svg._T-10, width:slot, height:svg._ph+20, class:'hit'}, svg); hit.dataset.i = i;
    });
    svg.addEventListener('pointerdown', down);
  }
  function valAt(ev){ const pt=svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY; const p=pt.matrixTransform(svg.getScreenCTM().inverse()); return Math.max(0, Math.min(cfg.yMax, Math.round((1-(p.y-svg._T)/svg._ph)*cfg.yMax/(cfg.snap||1))*(cfg.snap||1))); }
  function down(ev){ const h = ev.target.closest('.hit'); if(!h || v.dataset.locked) return; ev.preventDefault(); dragI = +h.dataset.i; vals[dragI] = valAt(ev); save(); redrawSoon();
    const mv = e=>{ if(dragI<0) return; const nv = valAt(e); if(nv!==vals[dragI]){ vals[dragI]=nv; save(); redrawSoon(); } };
    const up = ()=>{ dragI=-1; document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }
  let raf = 0; function redrawSoon(){ if(raf) return; raf = requestAnimationFrame(()=>{ raf=0; draw(); }); }
  const okAll = () => cfg.values.every((t,i)=>vals[i]===t);
  btn.addEventListener('click', ()=>{ const ok = okAll(); fb.className='fb '+(ok?'ok':'bad');
    const wrong = cfg.labels.filter((l,i)=>vals[i]!==cfg.values[i]);
    fb.innerHTML = ok ? '✅ Juist! Elke staaf is zo hoog als de frequentie.' : `❌ Nog niet juist: kijk nog eens naar ${wrong.join(', ')}. Lees de hoogte af op de verticale as.`;
    CLres(qid, ok); });
  draw();
  if(quiz) quiz.push({grade:okAll, reveal:()=>{}, lock:()=>{ v.dataset.locked='1'; }});
}

/* ============================================================
   CIRKELDIAGRAM: DEEL EN MIDDELPUNTSHOEK
   ============================================================ */
function pieExplore(b){
  const v = el('div','viz narrow'); const bar = el('div','viz-bar','<span class="lbl">Aantal</span>'); const out = el('div','readout bigq');
  const rg = document.createElement('input'); rg.type='range'; rg.min=0; rg.max=20; rg.value=5; bar.append(rg);
  b.append(v, bar, out);
  function paint(){ const k=+rg.value; v.innerHTML=''; v.append(drawChart('cirkel', {labels:['ja','nee'], series:[{values:[k,20-k]}], anim:false}, 460, 260));
    out.innerHTML = `${k} van de 20 leerlingen = <b>${nf(k/20*100)} %</b> · middelpuntshoek = ${k}/20 · 360° = <b>${nf(k/20*360)}°</b>`; }
  rg.addEventListener('input', paint); paint();
}

/* ============================================================
   MISLEIDENDE AS
   ============================================================ */
function misleadDemo(b, cfg){
  const v = el('div','viz mid'); const bar = el('div','viz-bar','<span class="lbl">Verticale as begint bij</span>'); const out = el('div','readout bigq');
  const rg = document.createElement('input'); rg.type='range'; rg.min=0; rg.max=cfg.maxStart; rg.step=cfg.stepStart||1; rg.value=cfg.maxStart; bar.append(rg);
  const lab = el('span','pill'); bar.append(lab);
  b.append(v, bar, out);
  const [a, c] = cfg.compare;
  function paint(){ const y0 = +rg.value; lab.textContent = nf(y0)+' '+(cfg.unit||'');
    v.innerHTML=''; v.append(drawChart('kolom', {labels:cfg.labels, series:[{values:cfg.values}], yMin:y0, yMax:cfg.yMax, step:cfg.step, title:cfg.title, yTitle:cfg.yTitle, anim:false, values:true, hi:[a,c]}));
    const va = cfg.values[a], vc = cfg.values[c];
    const lijkt = (vc-y0)/(va-y0), echt = vc/va;
    out.innerHTML = `Staaf ${cfg.labels[c]} <b>lijkt ${nf(lijkt,1)} keer</b> zo hoog als staaf ${cfg.labels[a]}. In werkelijkheid is ${nf(vc)} maar <b>${nf(echt,2)} keer</b> zo groot als ${nf(va)}.`; }
  rg.addEventListener('input', paint); paint();
}

/* ============================================================
   ONDERDEEL 3 · SOORTEN DATA
   ============================================================ */
const CHEAT_DATA = `<h3>Spiekbriefje · data en voorstellingen</h3><table>
<tr><td>categorisch</td><td>Data waarmee je niet (zinvol) rekent: kleur, sport, geboortemaand, rugnummer.</td></tr>
<tr><td>numeriek</td><td>Data waarmee rekenen zin heeft: lengte, tijd, aantal, massa.</td></tr>
<tr><td>dataset</td><td>Alle verzamelde gegevens samen (ook gegevensset).</td></tr>
<tr><td>frequentie</td><td>Hoeveel keer een gegeven voorkomt. Een frequentietabel zet ze op een rij.</td></tr>
<tr><td>percentage</td><td>frequentie : totaal · 100</td></tr>
<tr><td>middelpuntshoek</td><td>frequentie : totaal · 360°</td></tr>
<tr><td>diagrammen</td><td>lijndiagram (verloop in de tijd), dotplot, staafdiagram (vergelijken), strook- en cirkeldiagram (deel van het geheel).</td></tr></table>`;
const CN = [['c','Categorisch'],['n','Numeriek']];
SECTIONS.push({ id:'soort', ic:'soort', nav:'Soorten data', title:'Categorische of numerieke data?', cheat:CHEAT_DATA,
  tip:'Stel jezelf de vraag: heeft het zin om met deze gegevens te rekenen, bijvoorbeeld een gemiddelde te nemen? Ja: numeriek. Nee: categorisch.',
  cards:[
    { title:'De sportfiche van Noor', lvl:1, instr:'Sleep elk gegeven naar de juiste bak, of tik het aan en tik dan op een bak.',
      build:(b,st,save,key)=>sortBins(b,st,save,key,{bins:[['c','Categorische data'],['n','Numerieke data']], items:[
        {t:'naam: Noor', a:'c', why:'Met een naam kan je niet rekenen.'},
        {t:'lengte: 156 cm', a:'n', why:'Lengtes kan je optellen en vergelijken: numeriek.'},
        {t:'favoriete sport: zwemmen', a:'c', why:'Een sport is een categorie.'},
        {t:'tijd op 60 m: 9,4 s', a:'n', why:'Een tijdsmeting is numeriek.'},
        {t:'geboortemaand: mei', a:'c', why:'Een maand is een categorie.'},
        {t:'aantal trainingen per week: 3', a:'n', why:'Een aantal is numeriek.'},
        {t:'oogkleur: bruin', a:'c', why:'Een kleur is een categorie.'},
        {t:'massa: 44 kg', a:'n', why:'Een massa is numeriek.'}
      ]}) },
    { title:'Welke data levert de vraag op?', lvl:2, build:choiceList([
        ['Hoeveel minuten fiets je naar school?', 'n', 'Minuten zijn een tijdsmeting.'],
        ['Welk vak vind je het leukst?', 'c', 'Een vak is een categorie.'],
        ['Hoeveel huisdieren heb je?', 'n', 'Een aantal: je kan bv. het gemiddelde nemen.'],
        ['Met welk vervoermiddel kom je naar school?', 'c', 'Fiets, bus, te voet ... zijn categorieën.'],
        ['Hoeveel cm spring je ver?', 'n', 'Een afstand is numeriek.'],
        ['Welke kleur heeft je boekentas?', 'c', 'Een kleur is een categorie.']
      ], CN) },
    { title:'Getallen die geen getallen zijn', lvl:3, instr:'Ook data die uit cijfers bestaan, kunnen categorisch zijn. Vraag je af: heeft een gemiddelde hier betekenis?',
      build:(b,st,save,key)=>sortBins(b,st,save,key,{bins:[['c','Categorische data'],['n','Numerieke data']], items:[
        {t:'rugnummer: 10', a:'c', why:'Een rugnummer is een naam in cijfers. Het gemiddelde rugnummer van een ploeg betekent niets.'},
        {t:'postcode: 9930', a:'c', why:'Een postcode duidt een gemeente aan. Je rekent er niet mee.'},
        {t:'schoenmaat: 39', a:'n', why:'Een schoenmaat is een maat: een gemiddelde schoenmaat heeft betekenis.'},
        {t:'telefoonnummer', a:'c', why:'Een telefoonnummer optellen heeft geen zin.'},
        {t:'temperatuur: 18 °C', a:'n', why:'Een temperatuur is een meting.'},
        {t:'T-shirtmaat: M', a:'c', why:'S, M, L zijn categorieën (wel met een volgorde).'},
        {t:'score op de toets: 14/20', a:'n', why:'Met scores kan je rekenen.'},
        {t:'klas: 1Ab', a:'c', why:'Een klas is een categorie.'}
      ]}) }
  ]});

/* ============================================================
   ONDERDEEL 4 · FREQUENTIETABEL
   ============================================================ */
const VERVOER = ['fiets','bus','fiets','te voet','auto','fiets','bus','fiets','auto','fiets','te voet','fiets','bus','fiets','auto','fiets','bus','fiets','te voet','fiets'];
const HUISDIER_DOT = {labels:['0','1','2','3','4','5'], series:[{values:[4,7,6,2,0,1]}], xTitle:'Aantal huisdieren'};
SECTIONS.push({ id:'freq', ic:'freq', nav:'Frequentietabel', title:'Van ruwe data naar een frequentietabel', cheat:CHEAT_DATA,
  tip:'In een lijst met ruwe gegevens zie je moeilijk hoeveel keer iets voorkomt. Turf daarom: zet per antwoord een streepje in de juiste rij. Elke vijfde streep gaat schuin door de andere vier.',
  cards:[
    { title:'Hoe kom je naar school?', lvl:1, instr:'Twintig leerlingen antwoordden. Turf elk antwoord in de juiste rij, tel dan de turfjes.',
      build:(b,st,save,key)=>tallyEx(b,st,save,key,{cats:['fiets','bus','te voet','auto'], data:VERVOER, head:'vervoer', why:'Fiets 10, bus 4, te voet 3, auto 3: samen 20 leerlingen.'}) },
    { title:'Turfjes tellen', lvl:2, instr:'Een klas gaf haar mening over de uitspraak "Een gsm hoort niet in de klas."',
      build:list([
        {html: `<table class="ftab"><thead><tr><th>mening</th><th>turven</th><th>frequentie</th></tr></thead><tbody>
          <tr><td class="l">helemaal akkoord</td><td>${tallySVG(4)}</td><td>[[0]]</td></tr>
          <tr><td class="l">akkoord</td><td>${tallySVG(9)}</td><td>[[1]]</td></tr>
          <tr><td class="l">niet akkoord</td><td>${tallySVG(6)}</td><td>[[2]]</td></tr>
          <tr><td class="l">helemaal niet akkoord</td><td>${tallySVG(3)}</td><td>[[3]]</td></tr>
          <tr><td class="l"><b>totaal</b></td><td></td><td>[[4]]</td></tr></tbody></table>`, block:true, size:'xs', mode:'numeric',
          check:nums([4,9,6,3,22], 1e-9, 'Een bundeltje van vier strepen met een schuine streep erdoor is 5.'), sol:'4 + 9 + 6 + 3 = <b>22</b> leerlingen.'},
        {html:'Hoeveel leerlingen gaven hun mening? [[0]]', mode:'numeric', check:exact(22), sol:'Het totaal: 22 leerlingen.'},
        {html:'Wat betekent de frequentie 9 bij "akkoord"? Kies.', choice:[['a','9 % is akkoord'],['b','9 leerlingen zijn akkoord'],['c','akkoord kwam 9 keer minder voor']], check:(v,c)=>({ok:c==='b', choiceOk:c==='b'}), sol:'De frequentie is het aantal keer dat het gegeven voorkomt: 9 leerlingen antwoordden "akkoord".'}
      ], {letters:true}) },
    { title:'Van dotplot naar tabel', lvl:2, instr:'Elk bolletje is een leerling. Vul de frequentietabel in.',
      build:combo(chartBox('dot', HUISDIER_DOT, 'mid'), list([
        {html: `<table class="ftab"><thead><tr><th>aantal huisdieren</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>totaal</th></tr></thead><tbody>
          <tr><td class="l">frequentie</td><td>[[0]]</td><td>[[1]]</td><td>[[2]]</td><td>[[3]]</td><td>[[4]]</td><td>[[5]]</td><td>[[6]]</td></tr></tbody></table>`, block:true, size:'sm', mode:'numeric',
          check:nums([4,7,6,2,0,1,20], 1e-9, 'Tel de bolletjes per kolom. Waar geen bolletje staat, is de frequentie 0.'), sol:'4, 7, 6, 2, 0 en 1: samen <b>20</b> leerlingen.'}
      ])) },
    { title:'Percentages in de tabel', lvl:2, instr:'25 leerlingen kozen hun favoriete fruit. Bereken voor elk het percentage: frequentie : totaal · 100.',
      build:(b,st,save,key)=>{ const [L, R] = pctNaast(b); pctHulp(R, ['appel','banaan','aardbei','kiwi'], [8,6,9,2], 25); list([
        {html: `<table class="ftab"><thead><tr><th>fruit</th><th>frequentie</th><th>percentage</th></tr></thead><tbody>
          <tr><td class="l">appel</td><td>8</td><td>[[0]] %</td></tr><tr><td class="l">banaan</td><td>6</td><td>[[1]] %</td></tr>
          <tr><td class="l">aardbei</td><td>9</td><td>[[2]] %</td></tr><tr><td class="l">kiwi</td><td>2</td><td>[[3]] %</td></tr>
          <tr><td class="l"><b>totaal</b></td><td><b>25</b></td><td>[[4]] %</td></tr></tbody></table>`, block:true, size:'sm',
          check:nums([32,24,36,8,100], 1e-9, 'Deel door 25 en vermenigvuldig met 100 (of: vermenigvuldig met 4).'), sol:'8 : 25 · 100 = 32 % · 6 : 25 · 100 = 24 % · 9 : 25 · 100 = 36 % · 2 : 25 · 100 = 8 % · samen <b>100 %</b>.'}
      ])(L,st,save,key); } },
    { title:'Schoolreis', lvl:3, instr:'240 leerlingen kozen één bestemming. 60 kozen de zoo, een derde koos het pretpark, 25 % koos het museum en de rest koos de kust.',
      build:list([
        {html: `<table class="ftab"><thead><tr><th>bestemming</th><th>frequentie</th><th>percentage</th></tr></thead><tbody>
          <tr><td class="l">zoo</td><td>[[0]]</td><td>[[1]] %</td></tr><tr><td class="l">pretpark</td><td>[[2]]</td><td>[[3]] %</td></tr>
          <tr><td class="l">museum</td><td>[[4]]</td><td>[[5]] %</td></tr><tr><td class="l">kust</td><td>[[6]]</td><td>[[7]] %</td></tr></tbody></table>`, block:true, size:'sm',
          check:v=>{ const x=v.map(parseLoose); const t=[60,25,80,33.33,60,25,40,16.67]; const f=x.map((a,i)=>i%2? Math.abs(a-t[i])<0.06 : a===t[i]); return {ok:f.every(Boolean), fields:f, msg:'Reken eerst de aantallen uit, de kust is de rest. Rond percentages af op 0,01.'}; },
          sol:'zoo: 60 (60 : 240 · 100 = 25 %) · pretpark: 240 : 3 = 80 (33,33 %) · museum: 25 % van 240 = 60 · kust: 240 − 60 − 80 − 60 = <b>40</b> (16,67 %).'}
      ]) }
  ]});

/* ============================================================
   ONDERDEEL 5 · DIAGRAMMEN
   ============================================================ */
const SPORT = {labels:['voetbal','dans','tennis','zwemmen','andere'], series:[{values:[8,5,3,6,3]}], head:'favoriete sport'};
SECTIONS.push({ id:'diagram', ic:'diagram', nav:'Diagrammen', title:'Diagrammen lezen en kiezen', cheat:CHEAT_DATA,
  tip:'Kies de voorstelling die past bij je data en je vraag. Wil je vergelijken? Staafdiagram. Deel van het geheel? Cirkel- of strookdiagram. Verloop in de tijd? Lijndiagram.',
  cards:[
    { title:'Eén dataset, vijf voorstellingen', lvl:1, instr:'25 leerlingen gaven hun favoriete sport. Kies links en rechts een voorstelling en vergelijk ze naast elkaar.',
      build:(b)=>chartGallery(b, SPORT) },
    { title:'Hoe heet deze voorstelling?', lvl:1, build:(b,st,save,key)=>{
        const items = [['kolom','b'],['cirkel','c'],['dot','a'],['strook','d']];
        const opts = [['a','dotplot'],['b','staafdiagram'],['c','cirkeldiagram'],['d','strookdiagram'],['e','lijndiagram']];
        const g = el('div','two'); b.append(g);
        items.forEach(([t,ans],i)=>{ const box = el('div'); g.append(box); const v=el('div','viz'); v.append(drawChart(t, {labels:['A','B','C','D'], series:[{values:[5,2,4,3]}], anim:false}, 460, 260)); box.append(v);
          qChoice(box, st, save, key+'_'+i, {html:`Voorstelling ${i+1}`, ans, opts, why:'', nr:''}); });
      } },
    { title:'Aflezen in een staafdiagram', lvl:2, instr:'Een klas hield bij hoeveel boeken elke leerling las in de vakantie.',
      build:combo(chartBox('kolom', {labels:['0','1','2','3','4','5'], series:[{values:[3,6,8,4,2,1]}], xTitle:'Aantal gelezen boeken', yTitle:'Aantal leerlingen', step:1, yMax:9}), list([
        {html:'Hoeveel leerlingen lazen 2 boeken? [[0]]', mode:'numeric', check:exact(8), sol:'De staaf boven 2 is 8 hoog.'},
        {html:'Hoeveel leerlingen telt de klas? [[0]]', mode:'numeric', check:exact(24), sol:'3 + 6 + 8 + 4 + 2 + 1 = <b>24</b>.'},
        {html:'Hoeveel leerlingen lazen minstens 3 boeken? [[0]]', mode:'numeric', check:exact(7), sol:'Minstens 3: 3, 4 of 5 boeken. 4 + 2 + 1 = <b>7</b>.'},
        {html:'Hoeveel boeken las de klas samen? [[0]]', mode:'numeric', check:exact(47), sol:'3 · 0 + 6 · 1 + 8 · 2 + 4 · 3 + 2 · 4 + 1 · 5 = 0 + 6 + 16 + 12 + 8 + 5 = <b>47</b>.'}
      ], {letters:true})) },
    { title:'Bouw het staafdiagram', lvl:2, instr:'Sleep elke staaf tot de juiste hoogte (of klik op de juiste hoogte boven een staaf).',
      build:combo(html(ftabHTML(['broodbeleg','frequentie'], [['kaas',7],['choco',9],['hesp',5],['confituur',2]])),
        (b,st,save,key)=>barBuilder(b,st,save,key,{labels:['kaas','choco','hesp','confituur'], values:[7,9,5,2], yMax:10, step:1, title:'Favoriet broodbeleg'})) },
    { title:'Het cirkeldiagram', lvl:2, instr:'Schuif en kijk hoe het deel en de middelpuntshoek samen groeien. Beantwoord dan de vragen.',
      build:combo(b=>pieExplore(b), list([
        {html:'Van 20 leerlingen gaan er 5 met de bus. Welk percentage is dat? [[0]] %', check:exact(25), sol:'5 : 20 · 100 = <b>25 %</b>.'},
        {html:'Hoe groot is de middelpuntshoek voor die 5 leerlingen? [[0]] °', check:exact(90), sol:'5 : 20 · 360° = <b>90°</b>: een kwart van de cirkel.'},
        {html:'Van 40 leerlingen spelen er 12 een instrument. Middelpuntshoek? [[0]] °', check:exact(108), sol:'12 : 40 · 360° = <b>108°</b>.'},
        {html:'Een deel van een cirkeldiagram heeft een middelpuntshoek van 180°. Hoeveel procent is dat? [[0]] %', check:exact(50), sol:'180° is de helft van 360°: <b>50 %</b>.'}
      ], {letters:true})) },
    { title:'Welke voorstelling past?', lvl:2, build:choiceList([
        ['Je wil tonen hoe de temperatuur verandert tijdens een dag.', 'l', 'Een verloop in de tijd toon je met een lijndiagram.'],
        ['Je wil tonen welk deel van je zakgeld naar kleren, snoep en sparen gaat.', 'c', 'Delen van een geheel (100 %): cirkeldiagram (of strookdiagram).'],
        ['Je wil het aantal leerlingen per sportclub vergelijken.', 's', 'Aantallen vergelijken doe je met een staafdiagram.'],
        ['Je wil tonen hoe vaak elke schoenmaat voorkomt in de klas (20 leerlingen).', 'd', 'Weinig numerieke gegevens: elk bolletje is een leerling. Een staafdiagram kan ook.'],
        ['Je wil tonen hoe het aantal inwoners van je gemeente groeide van 2015 tot 2025.', 'l', 'Een evolutie door de jaren heen: lijndiagram.']
      ], [['l','lijndiagram'],['d','dotplot'],['s','staafdiagram'],['c','cirkeldiagram']]) },
    { title:'Twee groepen vergelijken', lvl:3, instr:'Jongens en meisjes uit het eerste jaar kozen hun favoriete pauzeactiviteit.',
      build:combo(chartBox('kolom', {labels:['voetbal','praten','gsm','lezen'], series:[{name:'jongens', values:[18,10,9,3]},{name:'meisjes', values:[6,20,10,4]}], yTitle:'Aantal leerlingen', step:4, yMax:24}), list([
        {html:'Hoeveel leerlingen werden ondervraagd? [[0]]', mode:'numeric', check:exact(80), sol:'Jongens: 18 + 10 + 9 + 3 = 40. Meisjes: 6 + 20 + 10 + 4 = 40. Samen <b>80</b>.'},
        {html:'Hoeveel procent van de meisjes praat het liefst? [[0]] %', check:exact(50), sol:'20 van de 40 meisjes: 20 : 40 · 100 = <b>50 %</b>.'},
        {html:'Hoeveel procent van <b>alle</b> leerlingen kiest gsm? [[0]] %', check:approx(23.75, 0.01), sol:'9 + 10 = 19 van de 80: 19 : 80 · 100 = <b>23,75 %</b>.'}
      ], {letters:true}), choiceList([
        ['Is een cirkeldiagram hier een goede keuze om jongens en meisjes te vergelijken?', 'n', 'In één cirkeldiagram kan je de twee groepen niet naast elkaar zetten. Een staafdiagram met twee kleuren wel.']
      ], [['j','Ja'],['n','Nee']])) },
    { title:'Kan je het weten?', lvl:3, instr:'In een doos zitten 20 knikkers. Lies ordent ze volgens kleur, Jens volgens grootte.',
      build:combo(b=>{ const g=el('div','two'); b.append(g); const a=el('div','viz'); a.append(drawChart('kolom',{labels:['rood','blauw','groen','geel'], series:[{values:[6,8,4,2]}], title:'Volgens kleur', step:2, yMax:8, anim:false},420,260)); const c=el('div','viz'); c.append(drawChart('kolom',{labels:['klein','middel','groot'], series:[{values:[9,7,4]}], title:'Volgens grootte', step:2, yMax:10, anim:false},420,260)); g.append(a,c); },
        choiceList([
          ['Er zijn 4 groene knikkers.', 'w', 'Dat lees je af op het eerste diagram.'],
          ['De 4 groene knikkers zijn de 4 grote knikkers.', 'o', 'Dat kan, maar je kan het niet weten: de diagrammen tonen kleur en grootte apart.'],
          ['Meer dan de helft van de knikkers is klein.', 'n', '9 van de 20 is minder dan de helft (10).'],
          ['30 % van de knikkers is rood.', 'w', '6 : 20 · 100 = 30 %.']
        ], [['w','Waar'],['n','Niet waar'],['o','Kan je niet weten']])) }
  ]});

/* ============================================================
   ONDERDEEL 6 · MISLEIDENDE GRAFIEKEN
   ============================================================ */
SECTIONS.push({ id:'mislei', ic:'mislei', nav:'Misleidende grafieken', title:'Laat je niet misleiden', cheat:CHEAT_DATA,
  tip:'Kijk altijd eerst naar de verticale as: begint ze bij 0? Is de schaalverdeling gelijk? Vergelijk je twee grafieken, hebben ze dan dezelfde schaal?',
  cards:[
    { title:'Schuif met de as', lvl:1, instr:'Vier soorten zaad, en de gemiddelde hoogte van de plantjes na een maand. Schuif de start van de verticale as naar 0 en kijk wat er gebeurt.',
      build:combo(b=>misleadDemo(b, {labels:['A','B','C','D'], values:[21,22,23,26], compare:[0,3], maxStart:20, yMax:27, step:1, unit:'cm', title:'Hoogte na een maand', yTitle:'Hoogte (in cm)'}), list([
        {html:'Met de as vanaf 20 cm: hoeveel keer zo hoog <b>lijkt</b> staaf D als staaf A? [[0]]', check:exact(6), sol:'Boven 20 cm: staaf D is 26 − 20 = 6 hokjes, staaf A is 21 − 20 = 1 hokje. Hij lijkt <b>6 keer</b> zo hoog.'},
        {html:'Hoeveel cm groter is plant D echt dan plant A? [[0]] cm', check:exact(5), sol:'26 cm − 21 cm = <b>5 cm</b>.'}
      ], {letters:true}), choiceList([
        ['Plant D is meer dan dubbel zo groot als plant A.', 'n', '26 cm is lang geen 42 cm. De as die niet bij 0 begint, vergroot het verschil.']
      ], WN)) },
    { title:'Wat is er misleidend?', lvl:2, build:combo(
        chartBox('kolom', {labels:['Bedrijf A','Bedrijf B','Bedrijf C'], series:[{values:[2350,2400,2380]}], yMin:2340, yMax:2410, step:10, title:'Gemiddeld maandloon', yTitle:'Loon (in €)', values:true}),
        choiceList([
          ['Waarom is dit staafdiagram misleidend?', 'a', 'De verticale as begint bij 2340 €. Daardoor lijkt het verschil tussen A en B enorm, terwijl het maar 50 € is.']
        ], [['a','De verticale as begint niet bij 0.'],['b','De staven hebben een andere kleur.'],['c','Er staan te weinig bedrijven op.']]),
        list([{html:'Hoeveel euro verdient men in bedrijf B meer dan in bedrijf A? [[0]] €', mode:'numeric', check:exact(50), sol:'2400 € − 2350 € = <b>50 €</b>: een klein verschil.'}])) },
    { title:'Twee grafieken naast elkaar', lvl:2, instr:'Een school vroeg elk jaar hoeveel procent van de leerlingen met de fiets komt, en hoeveel met de auto.',
      build:combo(b=>{ const g=el('div','two'); b.append(g); const a=el('div','viz'); a.append(drawChart('lijn',{labels:['2021','2022','2023','2024','2025'], series:[{values:[52,50,49,47,46]}], title:'Met de fiets (in %)', yMin:44, yMax:54, step:2, anim:false},420,280)); const c=el('div','viz'); c.append(drawChart('lijn',{labels:['2021','2022','2023','2024','2025'], series:[{values:[20,21,23,24,25]}], title:'Met de auto (in %)', yMin:0, yMax:100, step:20, anim:false},420,280)); g.append(a,c); },
        choiceList([
          ['Volgens de grafieken daalt het fietsen sterk en stijgt het autogebruik nauwelijks.', 'n', 'Het fietsen daalt met 6 procentpunten, het autogebruik stijgt met 5. Dat is ongeveer even veel! De schalen verschillen.'],
          ['De twee grafieken hebben dezelfde schaal op de verticale as.', 'n', 'Links gaat de as van 44 tot 54, rechts van 0 tot 100.'],
          ['Eén lijndiagram met twee lijnen en een as vanaf 0 geeft een eerlijker beeld.', 'w', 'Dan heb je zeker dezelfde schaal en zie je het echte verschil.']
        ], WN)) },
    { title:'Klopt de krantenkop?', lvl:3, build:combo(
        html('<div class="headline">"Merk C maakt tomaten dubbel zo zwaar als merk A!"</div>'),
        chartBox('kolom', {labels:['merk A','merk B','merk C'], series:[{values:[121,123,125]}], yMin:117, yMax:126, step:1, title:'Gemiddelde massa van een tomaat', yTitle:'Massa (in g)', values:true}),
        list([
          {html:'Hoeveel gram zwaarder is een tomaat met merk C dan met merk A? [[0]] g', mode:'numeric', check:exact(4), sol:'125 g − 121 g = <b>4 g</b>.'},
          {html:'Welk percentage is dat van 121 g? Rond af op 0,1. [[0]] %', check:approx(3.3, 0.051), sol:'4 : 121 · 100 ≈ <b>3,3 %</b>. Lang geen verdubbeling (dat zou 100 % zijn).'}
        ], {letters:true}),
        choiceList([['Klopt de krantenkop?', 'n', 'De as begint bij 117 g. Boven 117 is staaf C 8 hokjes en staaf A 4: hij lijkt dubbel zo hoog, maar de tomaat is maar 3,3 % zwaarder.']], [['j','Ja'],['n','Nee']])) }
  ]});
/* ============================================================
   EXTRA: FREQUENTIETABELLEN (NIEUWE OPGAVE) EN DIAGRAMMEN ZELF MAKEN
   ============================================================ */
(function(){
  const css = `
  .dx-drag{ cursor:grab; }
  .dx-drag:active{ cursor:grabbing; }
  .ch .dx-hd{ fill:var(--orange); stroke:var(--card); stroke-width:3; }
  .ch .dx-hdhit{ fill:transparent; cursor:grab; }
  .ch .dx-col{ fill:transparent; cursor:pointer; }
  .ch .dx-col:hover{ fill:var(--or-soft); fill-opacity:.45; }
  .ch .dx-ring{ fill:none; stroke:var(--border); stroke-width:1; }
  .ch .dx-tick{ stroke:var(--ink-soft); stroke-width:1; }
  .dx-legend{ display:flex; flex-wrap:wrap; gap:.3rem .9rem; margin:.3rem 0; }
  .dx-legend span{ display:inline-flex; align-items:center; gap:.35rem; font-variant-numeric:tabular-nums; }
  .dx-legend i{ width:.95rem; height:.95rem; border-radius:.2rem; display:inline-block; }
  .dx-match{ display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:.6rem; margin:.5rem 0; }
  .dx-tile{ position:relative; border:2px solid var(--border); border-radius:.8rem; background:var(--card); padding:.45rem; cursor:pointer; font:inherit; color:var(--ink); text-align:center; min-width:0; }
  .dx-tile:hover{ border-color:var(--tq); }
  .dx-tile.sel{ border-color:var(--orange); background:var(--or-soft); }
  .dx-tile.ok{ border-color:var(--ok); background:var(--ok-bg); cursor:default; }
  .dx-tile .ftab{ margin:.2rem auto; font-size:.92rem; }
  .dx-tile .ftab th, .dx-tile .ftab td{ padding:.2rem .45rem; }
  .dx-tile .tag{ position:absolute; top:.3rem; left:.4rem; font-weight:700; font-size:.8rem; color:var(--ink-soft); }
  .dx-tile .pair{ position:absolute; top:.25rem; right:.4rem; font-weight:700; color:var(--ok); }
  .dx-raw{ display:flex; flex-wrap:wrap; gap:.3rem; margin:.4rem 0; }
  .dx-raw .dv{ cursor:pointer; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* fresh() uit de coördinaten, maar de vraag-id's blijven bij deze kaart, ook na "Nieuwe opgave", en dezelfde opgave na herladen */
const DXfresh = fresh; /* fresh zet nu zelf CURKEY en bewaart de seed meteen */

/* contexten voor de opgaven */
const DX_NUM = [
  {head:'aantal huisdieren', vals:['0','1','2','3','4','5'], wie:'leerlingen'},
  {head:'aantal broers en zussen', vals:['0','1','2','3','4'], wie:'leerlingen'},
  {head:'schoenmaat', vals:['36','37','38','39','40','41'], wie:'leerlingen'},
  {head:'punten op 10', vals:['5','6','7','8','9','10'], wie:'leerlingen'},
  {head:'doelpunten per match', vals:['0','1','2','3','4','5'], wie:'matchen'}
];
const DX_CAT = [
  {head:'vervoer', vals:['fiets','bus','te voet','auto'], wie:'leerlingen'},
  {head:'favoriete fruit', vals:['appel','banaan','peer','kiwi','aardbei'], wie:'leerlingen'},
  {head:'favoriete sport', vals:['voetbal','dans','tennis','zwemmen','judo'], wie:'leerlingen'},
  {head:'kledingstijl', vals:['casual','sportief','formeel','streetwear','andere'], wie:'leerlingen'},
  {head:'huisdier', vals:['hond','kat','konijn','vis','geen'], wie:'leerlingen'}
];
/* n gehele getallen (elk tussen lo en hi) met som tot */
function DXsplit(r, n, tot, lo=0, hi=99){
  const a = Array(n).fill(lo); let rest = tot - lo*n, guard = 0;
  while(rest>0 && guard++<5000){ const i = rInt(r, 0, n-1); if(a[i]<hi){ a[i]++; rest--; } }
  return a;
}
const DXrows = (labels, cells) => labels.map((l,i)=>`<tr><td class="l">${l}</td><td>${cells[i]}</td></tr>`).join('');
const DXtab = (head, col, labels, cells, totCell, col2) => `<table class="ftab"><thead><tr><th>${head}</th><th>${col}</th>${col2?`<th>${col2}</th>`:''}</tr></thead><tbody>`
  + labels.map((l,i)=>`<tr><td class="l">${l}</td><td>${cells[i]}</td>${col2?`<td>${col2 && cells.c2 ? cells.c2[i] : ''}</td>`:''}</tr>`).join('')
  + (totCell!=null ? `<tr><td class="l"><b>totaal</b></td><td>${totCell}</td>${col2?`<td>${cells.t2||''}</td>`:''}</tr>` : '') + '</tbody></table>';
/* welke vakjes fout zijn, in woorden */
const DXwrong = (labels, f) => labels.filter((l,i)=>f[i]===false);

/* ---------- 1. van dotplot naar tabel ---------- */
const DXgenDot = r => { const c = rPick(r, DX_NUM); const fr = DXsplit(r, c.vals.length, rInt(r, 15, 24), 0, 7); return {c, fr}; };
function DXdotToTab(b, s, save, key, d){
  const {c, fr} = d, tot = sum(fr);
  const v = el('div','viz mid'); v.append(drawChart('dot', {labels:c.vals, series:[{values:fr}], xTitle:c.head})); b.append(v);
  const labs = c.vals.concat(['totaal']);
  qBlock(b, s, save, 'tab', {block:true, size:'xs', mode:'numeric',
    html: `<table class="ftab"><thead><tr><th>${c.head}</th><th>frequentie</th></tr></thead><tbody>${DXrows(c.vals, c.vals.map((x,i)=>`[[${i}]]`))}<tr><td class="l"><b>totaal</b></td><td>[[${c.vals.length}]]</td></tr></tbody></table>`,
    check: v => { const r = nums(fr.concat([tot]))(v); if(!r.ok && r.fields){ const w = DXwrong(labs, r.fields);
        r.msg = (w.includes('totaal') && w.length===1) ? `Het totaal is het aantal bolletjes samen: tel alle frequenties op.` : `Tel opnieuw de bolletjes boven ${w.filter(x=>x!=='totaal').join(', ')}. Geen bolletje? Dan is de frequentie 0.`; } return r; },
    sol: `${c.vals.map((x,i)=>`${x}: ${fr[i]}`).join(' · ')} · totaal: ${fr.join(' + ')} = <b>${tot}</b>`});
}

/* ---------- 2. van staafdiagram naar tabel ---------- */
const DXgenBar = r => { const c = rPick(r, DX_CAT.concat(DX_NUM)); const big = r()<.5; const n = c.vals.length;
  const fr = big ? DXsplit(r, n, rInt(r, 12, 25), 1, 9).map(x=>2*x) : DXsplit(r, n, rInt(r, 15, 28), 1, 10);
  return {c, fr, step: big?2:1}; };
function DXbarToTab(b, s, save, key, d){
  const {c, fr, step} = d, tot = sum(fr), yMax = Math.ceil((Math.max(...fr)+1)/step)*step;
  const v = el('div','viz mid'); v.append(drawChart('kolom', {labels:c.vals, series:[{values:fr}], xTitle:c.head, yTitle:'aantal '+c.wie, step, yMax})); b.append(v);
  const labs = c.vals.concat(['totaal']);
  qBlock(b, s, save, 'tab', {block:true, size:'xs', mode:'numeric',
    html: `<table class="ftab"><thead><tr><th>${c.head}</th><th>frequentie</th></tr></thead><tbody>${DXrows(c.vals, c.vals.map((x,i)=>`[[${i}]]`))}<tr><td class="l"><b>totaal</b></td><td>[[${c.vals.length}]]</td></tr></tbody></table>`,
    check: v => { const r = nums(fr.concat([tot]))(v); if(!r.ok && r.fields){ const w = DXwrong(labs, r.fields).filter(x=>x!=='totaal');
        r.msg = w.length ? `Kijk nog eens naar ${w.join(', ')}. Volg de bovenkant van de staaf horizontaal naar de verticale as.${step>1?' Let op: één hokje is '+step+'.':''}` : 'Tel alle frequenties op voor het totaal.'; } return r; },
    sol: `${c.vals.map((x,i)=>`${x}: ${fr[i]}`).join(' · ')} · totaal: <b>${tot}</b>`});
}

/* ---------- 3. ontbrekende frequentie ---------- */
const DXgenMiss = r => { const c = rPick(r, DX_CAT); const tot = rPick(r, [20, 25, 40, 50]); const fr = DXsplit(r, c.vals.length, tot, 1, Math.round(tot*0.45)); return {c, fr, tot, miss:rInt(r, 0, c.vals.length-1)}; };
function DXmissing(b, s, save, key, d){
  const {c, fr, tot, miss} = d, cells = fr.map((x,i)=> i===miss ? '?' : x);
  const [L, R] = pctNaast(b);
  L.append(el('div','', `<p>${tot} ${c.wie} antwoordden. Eén frequentie is weggevallen.</p>` + DXtab(c.head, 'frequentie', c.vals, cells, `<b>${tot}</b>`)));
  b = R;
  const known = fr.filter((x,i)=>i!==miss);
  qBlock(b, s, save, 'a', {nr:'a.', mode:'numeric', html:`Wat is de frequentie van <b>${c.vals[miss]}</b>? [[0]]`, check:exact(fr[miss], 'Trek alle gekende frequenties af van het totaal.'),
    sol:`${tot} − ${known.join(' − ')} = <b>${fr[miss]}</b>`});
  const p = fr[miss]/tot*100;
  qBlock(b, s, save, 'b', {nr:'b.', html:`Hoeveel procent is dat? [[0]] %`, check:approx(p, 0.01, 'Percentage = frequentie : totaal · 100.'),
    sol:`${fr[miss]} : ${tot} · 100 = <b>${nf(p)} %</b>`});
}
/* twee ontbrekende frequenties met een extra aanwijzing (verdieping) */
const DXgenMiss2 = r => { for(let t=0;t<200;t++){ const c = rPick(r, DX_CAT); const n = c.vals.length; const tot = rPick(r, [24, 30, 36, 40]);
    const i = rInt(r, 0, n-1); let j = rInt(r, 0, n-2); if(j>=i) j++;
    const k = rPick(r, [2, 3]); const y = rInt(r, 2, 5); const x = k*y;
    const restN = n-2, rest = tot - x - y; if(rest < restN*2 || rest > restN*9) continue;
    const fr = Array(n); const o = DXsplit(r, restN, rest, 2, 9); let m = 0; for(let q=0;q<n;q++){ fr[q] = q===i ? x : q===j ? y : o[m++]; }
    return {c, fr, tot, i, j, k}; }
  return {c:DX_CAT[0], fr:[10,5,3,2], tot:20, i:0, j:1, k:2}; };
function DXmissing2(b, s, save, key, d){
  const {c, fr, tot, i, j, k} = d, cells = fr.map((x,q)=> q===i||q===j ? '?' : x);
  b.append(el('div','', `<p>${tot} ${c.wie} antwoordden. <b>${c.vals[i]}</b> werd ${k===2?'dubbel':'drie keer'} zo vaak gekozen als <b>${c.vals[j]}</b>.</p>` + DXtab(c.head, 'frequentie', c.vals, cells, `<b>${tot}</b>`)));
  const known = fr.filter((x,q)=>q!==i && q!==j), samen = fr[i]+fr[j];
  qBlock(b, s, save, 'a', {mode:'numeric', html:`${c.vals[i]}: [[0]] &nbsp; ${c.vals[j]}: [[1]]`, size:'xs',
    check: v => { const r = nums([fr[i], fr[j]])(v); if(!r.ok){ const a = parseLoose(v[0]), bb = parseLoose(v[1]); r.msg = (a+bb===samen) ? `De som klopt (${samen}), maar ${c.vals[i]} moet ${k===2?'het dubbel':'drie keer zoveel'} zijn.` : `Samen zijn ze ${tot} − ${known.join(' − ')} = ${samen}. Verdeel dat in ${k+1} gelijke delen.`; } return r; },
    sol:`Samen: ${tot} − ${known.join(' − ')} = ${samen}. ${c.vals[j]} is 1 deel, ${c.vals[i]} is ${k} delen: ${k+1} delen = ${samen}, 1 deel = ${samen} : ${k+1} = <b>${fr[j]}</b>. ${c.vals[i]} = ${k} · ${fr[j]} = <b>${fr[i]}</b>.`});
}

/* ---------- hulp bij percentages: stap voor stap, met een dubbele getallenlijn ---------- */
(function(){
  const css = `
  .ph{ border:2px dashed var(--or-line); background:var(--or-soft); border-radius:.8rem; padding:.6rem .8rem; }
  .ph h4{ margin:0 0 .35rem; font-size:1rem; }
  .ph ol{ margin:.3rem 0 .4rem; padding-left:1.3rem; display:flex; flex-direction:column; gap:.3rem; }
  .ph .ph-bar{ display:flex; gap:.4rem; flex-wrap:wrap; }
  .ph svg{ width:100%; max-width:440px; height:auto; display:block; margin:.2rem 0; }
  .ph svg text{ fill:var(--ink); font-family:var(--f-body); font-size:13px; }
  .ph svg .lnp{ stroke:var(--ink); stroke-width:2; }
  .ph svg .acc{ fill:var(--accent-dark); font-weight:700; }
  .ph svg .orx{ fill:#b26a00; font-weight:700; }
  .ph svg .fil{ fill:var(--tq); fill-opacity:.35; }
  .ph svg .pij{ stroke:#e08a00; stroke-width:1.8; fill:none; stroke-linecap:round; }
  .ph svg .pijk{ fill:none; stroke:#e08a00; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
  .ph svg{ max-width:460px; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();
let PCT_ID = 0;
function pctLijn(f, tot, stap){
  /* stap 0: vraagteken · stap 1: pijl van het totaal naar 100 % · stap 2: ook de pijl bij de frequentie, met het percentage */
  const W = 460, x0 = 110, x1 = W-50, X = v => x0 + (x1-x0)*v/tot, p = f/tot*100, k = 100/tot, kt = '· ' + nf(k, 2);
  const id = 'pk' + (++PCT_ID), pijl = x => `<path class="pij" d="M${x+5},36 C${x+30},40 ${x+30},60 ${x+9},64" marker-end="url(#${id})"/><text x="${x+30}" y="55" class="orx">${kt}</text>`;
  return `<svg viewBox="0 0 ${W} 104" role="img" aria-label="dubbele getallenlijn"><defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M2,1.5 L9,5 L2,8.5" class="pijk"/></marker></defs>
    <rect class="fil" x="${x0}" y="22" width="${X(f)-x0}" height="56" rx="3"/>
    <line class="lnp" x1="${x0}" y1="30" x2="${x1}" y2="30"/><line class="lnp" x1="${x0}" y1="70" x2="${x1}" y2="70"/>
    ${[0, f, tot].map(v=>`<line class="lnp" x1="${X(v)}" y1="24" x2="${X(v)}" y2="36"/><line class="lnp" x1="${X(v)}" y1="64" x2="${X(v)}" y2="76"/>`).join('')}
    <text x="4" y="35">aantal</text><text x="4" y="75">percentage</text>
    <text x="${x0}" y="17" text-anchor="middle">0</text><text x="${X(f)}" y="17" text-anchor="middle" class="acc">${f}</text><text x="${x1}" y="17" text-anchor="middle" class="acc">${tot}</text>
    <text x="${x0}" y="94" text-anchor="middle">0 %</text><text x="${X(f)}" y="94" text-anchor="middle" class="orx">${stap>=2 ? nf(p,2)+' %' : '? %'}</text><text x="${x1}" y="94" text-anchor="middle" class="acc">100 %</text>
    ${stap>=1 ? pijl(x1) : ''}${stap>=2 ? pijl(X(f)) : ''}</svg>`;
}
/* rij: welk gegeven als voorbeeld (de eerste) */
function pctHulp(b, labels, fr, tot){
  const box = el('div','ph'); b.append(box);
  const f = fr[0], q = f/tot, p = q*100, k = 100/tot;
  const stappen = Number.isInteger(Math.round(k*1e6)/1e4) ? [
    `Het totaal is <b>${tot}</b>. Dat is <b>100 %</b>. Je zoekt welk deel <b>${labels[0]}</b> (${f}) is.` + pctLijn(f, tot, 0),
    `Van ${tot} naar 100 %: <b>· ${nf(k,2)}</b>, want ${tot} · ${nf(k,2)} = 100.` + pctLijn(f, tot, 1),
    `Doe hetzelfde bij ${labels[0]}: <b>${f} · ${nf(k,2)} = ${nf(p, 2)} %</b>.` + pctLijn(f, tot, 2),
    `Doe nu hetzelfde voor de andere rijen: telkens <b>· ${nf(k,2)}</b>. Controle: alle percentages samen zijn <b>100 %</b>.`
  ] : [
    `Het totaal is <b>${tot}</b>. Dat is <b>100 %</b>. Je zoekt welk deel <b>${labels[0]}</b> (${f}) is.` + pctLijn(f, tot, 0),
    `Deel de frequentie door het totaal: <b>${f} : ${tot} = ${nf(q, 4)}</b>.`,
    `Maal 100: <b>${nf(q, 4)} · 100 = ${nf(p, 2)} %</b>. Op je rekentoestel: ${f} ÷ ${tot} × 100 enter.`,
    `Doe nu hetzelfde voor de andere rijen. Controle: alle percentages samen zijn <b>100 %</b>.`
  ];
  let n = 0;
  box.innerHTML = `<h4>💡 Hulp bij percentages</h4><ol></ol><div class="ph-bar"><button type="button" class="btn ghost">Toon een tussenstap</button></div>`;
  const ol = box.querySelector('ol'), bt = box.querySelector('button'); ol.hidden = true;
  bt.addEventListener('click', ()=>{ ol.hidden = false; ol.append(el('li','', stappen[n])); n++; if(n >= stappen.length){ bt.disabled = true; bt.textContent = 'Alle stappen staan er'; } else bt.textContent = 'Volgende stap'; });
  return box;
}
/* tabel links, hulp rechts */
function pctNaast(b){ const w = el('div','nx'), l = el('div'), r = el('div'); l.style.minWidth = '0'; r.style.minWidth = '0'; w.append(l, r); b.append(w); return [l, r]; }

/* ---------- 4. kolom percentage ---------- */
const DXgenPct = r => { const c = rPick(r, DX_CAT); const tot = rPick(r, [20, 25, 50]); const fr = DXsplit(r, c.vals.length, tot, 1, Math.round(tot*0.5)); return {c, fr, tot}; };
function DXpctCol(b, s, save, key, d){
  const {c, fr, tot} = d, n = c.vals.length, pc = fr.map(x=>x/tot*100);
  const mult = 100/tot;
  const [L, R] = pctNaast(b); pctHulp(R, c.vals, fr, tot);
  qBlock(L, s, save, 'tab', {block:true, size:'xs',
    html: `<p>${tot} ${c.wie} antwoordden. Vul de kolom percentage in.</p><table class="ftab"><thead><tr><th>${c.head}</th><th>frequentie</th><th>percentage</th></tr></thead><tbody>`
      + c.vals.map((l,i)=>`<tr><td class="l">${l}</td><td>${fr[i]}</td><td>[[${i}]] %</td></tr>`).join('') + `<tr><td class="l"><b>totaal</b></td><td><b>${tot}</b></td><td>[[${n}]] %</td></tr></tbody></table>`,
    check: v => { const r = nums(pc.concat([100]), 0.01)(v); if(!r.ok && r.fields){ const w = DXwrong(c.vals.concat(['totaal']), r.fields);
        r.msg = (w.length===1 && w[0]==='totaal') ? 'Alle percentages samen zijn altijd 100 %.' : `Kijk nog eens naar ${w.join(', ')}. Deel door ${tot} en vermenigvuldig met 100 (of: vermenigvuldig meteen met ${nf(mult)}).`; } return r; },
    sol: c.vals.map((l,i)=>`${l}: ${fr[i]} : ${tot} · 100 = ${nf(pc[i])} %`).join(' · ') + ' · samen <b>100 %</b>'});
}

/* ---------- 5. van percentage naar aantal (verdieping) ---------- */
const DXgenPctBack = r => { const c = rPick(r, DX_CAT); const tot = rPick(r, [40, 60, 80, 120, 160, 200, 240]); const n = c.vals.length; const p = DXsplit(r, n, 20, 1, 9).map(x=>x*5); return {c, tot, p, fr:p.map(x=>x*tot/100)}; };
function DXpctBack(b, s, save, key, d){
  const {c, tot, p, fr} = d, n = c.vals.length;
  qBlock(b, s, save, 'tab', {block:true, size:'xs', mode:'numeric',
    html: `<p>Een enquête bij <b>${tot}</b> ${c.wie} leverde deze percentages op. Bereken de frequenties.</p><table class="ftab"><thead><tr><th>${c.head}</th><th>percentage</th><th>frequentie</th></tr></thead><tbody>`
      + c.vals.map((l,i)=>`<tr><td class="l">${l}</td><td>${p[i]} %</td><td>[[${i}]]</td></tr>`).join('') + `<tr><td class="l"><b>totaal</b></td><td><b>100 %</b></td><td>[[${n}]]</td></tr></tbody></table>`,
    check: v => { const r = nums(fr.concat([tot]))(v); if(!r.ok && r.fields){ const w = DXwrong(c.vals.concat(['totaal']), r.fields);
        r.msg = `Kijk nog eens naar ${w.join(', ')}. ${p[0]} % van ${tot} = ${p[0]} : 100 · ${tot}. Tip: 10 % van ${tot} is ${nf(tot/10)}. Controle: alle aantallen samen zijn ${tot}.`; } return r; },
    sol: c.vals.map((l,i)=>`${l}: ${p[i]} : 100 · ${tot} = ${fr[i]}`).join(' · ') + ` · samen <b>${tot}</b>`});
}

/* ============================================================
   DIAGRAMMEN ZELF MAKEN
   ============================================================ */
/* gemeenschappelijk: grenzen slepen in een cirkel of een strook. U = aantal eenheden (stappen) van het geheel */
function DXdivide(b, st, save, key, cfg){
  const {labels, target, U, kind} = cfg, n = labels.length;
  const quiz = QZ; const qid = QID(kind==='cirkel'?'cirkel':'strook'); if(!quiz) CLvraag(qid);
  /* grenzen: cum[0..n-2] in eenheden, oplopend */
  if(!st.cum || st.cum.length!==n-1){ st.cum = labels.slice(1).map((l,i)=>Math.round((i+1)*U/n)); save(); }
  const cum = st.cum;
  const v = el('div','viz '+(kind==='cirkel'?'narrow':'mid')); b.append(v);
  const leg = el('div','dx-legend'); b.append(leg);
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn);
  const fb = el('div','fb'); b.append(act, fb); if(quiz) act.hidden = true;
  const W = kind==='cirkel' ? 360 : 440, H = kind==='cirkel' ? 330 : 170;
  const svg = newSvg(W, H); v.append(svg);
  const cx = W/2, cy = H/2, R = 140;
  const sx0 = 22, sx1 = W-22, sy = 44, sh = 80;
  const parts = () => { const c = [0, ...cum, U]; return labels.map((l,i)=>c[i+1]-c[i]); };
  const pct = k => k/U*100;
  const ang = u => -Math.PI/2 + u/U*2*Math.PI;
  const pos = u => kind==='cirkel' ? [cx+R*Math.cos(ang(u)), cy+R*Math.sin(ang(u))] : [sx0+(sx1-sx0)*u/U, sy+sh/2];
  function draw(show){
    svg.innerHTML = ''; const c = [0, ...cum, U], pr = parts();
    if(kind==='cirkel'){
      for(let u=0;u<U;u++){ const [x1,y1] = [cx+R*Math.cos(ang(u)), cy+R*Math.sin(ang(u))], [x2,y2] = [cx+(R+6)*Math.cos(ang(u)), cy+(R+6)*Math.sin(ang(u))]; svgEl('line',{x1,y1,x2,y2,class:'dx-tick'}, svg); }
      labels.forEach((l,i)=>{ const a0 = ang(c[i]), a1 = ang(c[i+1]); if(c[i+1]<=c[i]) return; const col = PAL[i%PAL.length];
        if(c[i+1]-c[i]>=U) svgEl('circle',{cx,cy,r:R,fill:col,class:'sec'}, svg);
        else svgEl('path',{d:`M${cx},${cy} L${cx+R*Math.cos(a0)},${cy+R*Math.sin(a0)} A${R},${R} 0 ${(a1-a0)>Math.PI?1:0} 1 ${cx+R*Math.cos(a1)},${cy+R*Math.sin(a1)} Z`, fill:col, class:'sec'}, svg);
        const am = (a0+a1)/2; if(pr[i]/U>0.04){ const t = svgText(svg, cx+R*0.62*Math.cos(am), cy+R*0.62*Math.sin(am)+5, nf(pct(pr[i]),1)+' %', {'text-anchor':'middle', class:'t-big'}); t.style.fill = DARKPAL.has(col)?'#ffffff':'#173436'; } });
    } else {
      for(let u=0;u<=U;u++){ const x = sx0+(sx1-sx0)*u/U; svgEl('line',{x1:x, y1:sy+sh, x2:x, y2:sy+sh+(u%(U/4)===0||u%(U/5)===0?10:5), class:'dx-tick'}, svg); }
      [0,25,50,75,100].forEach(p=>svgText(svg, sx0+(sx1-sx0)*p/100, sy+sh+26, p+' %', {'text-anchor':'middle', class:'t-soft'}));
      labels.forEach((l,i)=>{ const x = sx0+(sx1-sx0)*c[i]/U, w = (sx1-sx0)*pr[i]/U; const col = PAL[i%PAL.length]; svgEl('rect',{x, y:sy, width:Math.max(0,w), height:sh, fill:col, class:'sec'}, svg);
        if(pr[i]/U>0.06){ const t = svgText(svg, x+w/2, sy+sh/2+6, nf(pct(pr[i]),1)+' %', {'text-anchor':'middle', class:'t-big'}); t.style.fill = DARKPAL.has(col)?'#ffffff':'#173436'; } });
    }
    cum.forEach((u,k)=>{ const [x,y] = pos(u);
      if(kind!=='cirkel') svgEl('line',{x1:x, y1:sy-14, x2:x, y2:sy+sh+8, stroke:'var(--orange)', 'stroke-width':3}, svg);
      svgEl('circle',{cx:x, cy:kind==='cirkel'?y:sy-14, r:kind==='cirkel'?9:11, class:'dx-hd'}, svg);
      const h = svgEl('circle',{cx:x, cy:kind==='cirkel'?y:sy-14, r:kind==='cirkel'?22:26, class:'dx-hdhit'}, svg); h.dataset.k = k; });
    if(kind==='cirkel'){ const [x,y] = pos(0); svgEl('circle',{cx:x, cy:y, r:5, fill:'var(--ink)'}, svg); }
    leg.innerHTML = labels.map((l,i)=>`<span><i style="background:${PAL[i%PAL.length]}"></i>${l}: <b>${nf(pct(pr[i]),1)} %</b>${show&&!quiz ? (Math.abs(pr[i]-target[i])<1e-9?' ✅':' ❌') : ''}</span>`).join('');
  }
  function unitAt(ev){ const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    if(kind==='cirkel'){ let a = Math.atan2(p.y-cy, p.x-cx) + Math.PI/2; if(a<0) a += 2*Math.PI; return Math.round(a/(2*Math.PI)*U); }
    return Math.round((p.x-sx0)/(sx1-sx0)*U); }
  let drag = -1;
  svg.addEventListener('pointerdown', ev=>{ const h = ev.target.closest('.dx-hdhit'); if(!h || v.dataset.locked) return; ev.preventDefault(); drag = +h.dataset.k; try{ svg.setPointerCapture(ev.pointerId); }catch(e){} });
  svg.addEventListener('pointermove', ev=>{ if(drag<0) return; let u = unitAt(ev);
    const lo = drag>0 ? cum[drag-1] : 0, hi = drag<cum.length-1 ? cum[drag+1] : U;
    if(kind==='cirkel'){ u = [u-U, u, u+U].reduce((a,x)=>Math.abs(x-cum[drag])<Math.abs(a-cum[drag])?x:a); }
    u = Math.max(lo, Math.min(hi, u)); if(u!==cum[drag]){ cum[drag] = u; save(); draw(false); fb.textContent=''; } });
  const end = ()=>{ drag = -1; }; svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  const okAll = () => parts().every((k,i)=>k===target[i]);
  btn.addEventListener('click', ()=>{ const ok = okAll(); draw(true); fb.className = 'fb '+(ok?'ok':'bad');
    const w = labels.filter((l,i)=>parts()[i]!==target[i]);
    fb.innerHTML = ok ? `✅ Juist! ${cfg.why||''}` : `❌ Nog niet juist: kijk naar ${w.join(', ')}. ${cfg.hint||''}`; CLres(qid, ok); st.checked = true; save(); });
  draw(!!st.checked);
  if(quiz) quiz.push({grade:okAll, reveal:()=>draw(true), lock:()=>{ v.dataset.locked='1'; }});
}
/* cirkeldiagram: aantallen gegeven, totaal 20, 24, 30 of 40 (één leerling = één stap) */
const DXgenPie = r => { const c = rPick(r, DX_CAT.filter(x=>x.vals.length<=5)); const n = rPick(r, [3, 4, 4]); const tot = rPick(r, [20, 20, 24, 30, 40]);
  const vals = c.vals.slice(0, n); return {c, vals, fr:DXsplit(r, n, tot, 2, Math.round(tot*0.5)), tot}; };
function DXpieBuild(b, st, save, key, d){
  const {c, vals, fr, tot} = d;
  b.append(el('div','', DXtab(c.head, 'frequentie', vals, fr, `<b>${tot}</b>`)));
  b.append(el('div','sub', `Sleep de oranje bolletjes over de rand. De cirkel is verdeeld in ${tot} gelijke stukjes: één stukje is één ${c.wie==='leerlingen'?'leerling':'antwoord'} (${nf(100/tot,1)} %).`));
  DXdivide(b, st, save, key, {kind:'cirkel', labels:vals, target:fr, U:tot,
    hint:`Elk deel krijgt zoveel stukjes als zijn frequentie. Of: bereken eerst het percentage (frequentie : ${tot} · 100).`,
    why:'Elk deel is even groot als zijn deel van het totaal: ' + vals.map((l,i)=>`${l} ${fr[i]} : ${tot} · 100 ${Number.isInteger(fr[i]*1000/tot)?"=":"≈"} ${nf(fr[i]/tot*100,1)} %`).join(', ') + '.'});
}
/* strookdiagram: percentages gegeven, stappen van 5 % */
const DXgenStrip = r => { const c = rPick(r, DX_CAT); const n = rPick(r, [3, 4, 5]); const p = DXsplit(r, n, 20, 1, 9); return {c, vals:c.vals.slice(0,n), p}; };
function DXstripBuild(b, st, save, key, d){
  const {c, vals, p} = d;
  b.append(el('div','', `<table class="ftab"><thead><tr><th>${c.head}</th><th>percentage</th></tr></thead><tbody>${DXrows(vals, p.map(x=>x*5+' %'))}<tr><td class="l"><b>totaal</b></td><td><b>100 %</b></td></tr></tbody></table>`));
  b.append(el('div','sub', 'Sleep de oranje grenzen. Eén streepje onder de strook is 5 %.'));
  DXdivide(b, st, save, key, {kind:'strook', labels:vals, target:p, U:20,
    hint:'De hele strook is 100 %. Tel de streepjes: elk streepje is 5 %.', why:'Een strookdiagram toont welk deel van het geheel elke categorie is.'});
}
/* graden: middelpuntshoek uit de tabel, dan de cirkel verdelen (verdieping) */
const DXgenDeg = r => { const c = rPick(r, DX_CAT); const tot = rPick(r, [24, 30, 36, 40, 60]); const n = 4; const vals = c.vals.slice(0,n);
  const unit = 360/tot; const fr = DXsplit(r, n, tot, 2, Math.round(tot*0.5)); return {c, vals, fr, tot, unit}; };
function DXdegBuild(b, st, save, key, d){
  const {c, vals, fr, tot} = d, deg = fr.map(x=>x/tot*360);
  const q = st.q || (st.q = {});
  qBlock(b, q, save, 'g', {block:true, size:'xs', mode:'numeric',
    html:`<table class="ftab"><thead><tr><th>${c.head}</th><th>frequentie</th><th>middelpuntshoek</th></tr></thead><tbody>${vals.map((l,i)=>`<tr><td class="l">${l}</td><td>${fr[i]}</td><td>[[${i}]] °</td></tr>`).join('')}<tr><td class="l"><b>totaal</b></td><td><b>${tot}</b></td><td>[[${vals.length}]] °</td></tr></tbody></table>`,
    check: v => { const r = nums(deg.concat([360]), 0.01)(v); if(!r.ok) r.msg = `Middelpuntshoek = frequentie : ${tot} · 360°. Eén ${c.wie==='leerlingen'?'leerling':'antwoord'} is 360° : ${tot} = ${nf(360/tot,2)}°.`; return r; },
    sol: vals.map((l,i)=>`${l}: ${fr[i]} : ${tot} · 360° = ${nf(deg[i],2)}°`).join(' · ') + ' · samen <b>360°</b>'});
  b.append(el('div','sub', `Verdeel nu de cirkel. Eén stukje op de rand is ${nf(360/tot,2)}°.`));
  DXdivide(b, st, save, key, {kind:'cirkel', labels:vals, target:fr, U:tot, hint:'Gebruik de middelpuntshoeken uit je tabel.', why:'De middelpuntshoeken samen zijn 360°.'});
}

/* ---------- dotplot opbouwen ---------- */
const DXgenDotBuild = r => { const c = rPick(r, DX_NUM); const n = rInt(r, 12, 16); const fr = DXsplit(r, c.vals.length, n, 0, 5); const raw = []; fr.forEach((k,i)=>{ for(let j=0;j<k;j++) raw.push(c.vals[i]); });
  for(let i=raw.length-1;i>0;i--){ const j = Math.floor(r()*(i+1)); [raw[i],raw[j]] = [raw[j],raw[i]]; } return {c, fr, raw}; };
function DXdotBuild(b, st, save, key, d){
  const {c, fr, raw} = d, n = c.vals.length;
  const quiz = QZ; const qid = QID('dotplot'); if(!quiz) CLvraag(qid);
  b.append(el('div','sub', `De ruwe gegevens (${raw.length} ${c.wie}). Tik een gegeven aan om het af te vinken, als hulp.`));
  const rawBox = el('div','data-row dx-raw'); b.append(rawBox);
  const ticked = st.t || (st.t = []);
  raw.forEach((x,i)=>{ const k = el('button','dv', x); k.type='button'; k.classList.toggle('gone', !!ticked[i]); rawBox.append(k);
    k.addEventListener('click', ()=>{ ticked[i] = !ticked[i]; k.classList.toggle('gone', !!ticked[i]); save(); }); });
  b.append(el('div','sub', 'Klik in een kolom om er een bolletje bij te zetten. Klik op het bovenste bolletje om het weg te halen.'));
  const v = el('div','viz mid'); b.append(v);
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn);
  const fb = el('div','fb'); b.append(act, fb); if(quiz) act.hidden = true;
  const cnt = st.c || (st.c = Array(n).fill(0));
  const W = 560, H = 300, L = 30, R = 16, T = 14, base = H-46, pw = W-L-R, xs = i => L + pw*(i+0.5)/n, rr = 11;
  const svg = newSvg(W, H); v.append(svg);
  function draw(show){
    svg.innerHTML = '';
    svgEl('line',{x1:L-10, y1:base, x2:L+pw+6, y2:base, class:'ax'}, svg);
    c.vals.forEach((l,i)=>{ svgEl('line',{x1:xs(i), y1:base, x2:xs(i), y2:base+5, class:'ax'}, svg); svgText(svg, xs(i), base+21, l, {'text-anchor':'middle'});
      for(let k=0;k<cnt[i];k++) svgEl('circle',{cx:xs(i), cy:base-rr-2-k*rr*2.15, r:rr, class:'dot'+(show && !quiz && cnt[i]!==fr[i] ? ' hi':'')}, svg);
      const col = svgEl('rect',{x:xs(i)-pw/n/2, y:T, width:pw/n, height:base-T+28, class:'dx-col'}, svg); col.dataset.i = i; });
    svgText(svg, L+pw/2, H-4, c.head, {'text-anchor':'middle', class:'t-soft'});
  }
  svg.addEventListener('click', ev=>{ if(v.dataset.locked) return; const col = ev.target.closest('.dx-col'); if(!col) return; const i = +col.dataset.i;
    const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const topY = base-rr-2-(cnt[i]-1)*rr*2.15;
    if(cnt[i]>0 && Math.abs(p.y-topY)<=rr+3) cnt[i]--; else if(cnt[i]<9) cnt[i]++;
    save(); draw(false); fb.textContent=''; });
  const okAll = () => cnt.every((k,i)=>k===fr[i]);
  btn.addEventListener('click', ()=>{ const ok = okAll(); draw(true); fb.className='fb '+(ok?'ok':'bad');
    const w = c.vals.filter((l,i)=>cnt[i]!==fr[i]);
    fb.innerHTML = ok ? `✅ Juist! Elk gegeven is één bolletje: ${sum(fr)} bolletjes voor ${sum(fr)} ${c.wie}.` : `❌ Nog niet juist bij ${w.join(', ')} (oranje). Tel in de ruwe gegevens hoeveel keer dat gegeven voorkomt.`;
    CLres(qid, ok); st.checked = true; save(); });
  draw(!!st.checked);
  if(quiz) quiz.push({grade:okAll, reveal:()=>{}, lock:()=>{ v.dataset.locked='1'; }});
}

/* ---------- koppelspel: welke tabel hoort bij welk diagram? ---------- */
const DXgenMatch = r => {
  /* numerieke data: dan passen staafdiagram, cirkel, strook én dotplot */
  const c = rPick(r, DX_NUM); const k0 = rInt(r, 0, c.vals.length-4); const labs = c.vals.slice(k0, k0+4);
  const base = rPick(r, [[2,4,6,8],[1,3,5,11],[2,3,5,10],[1,4,6,9]]);
  const perms = [], seen = new Set(); let guard = 0;
  while(perms.length<4 && guard++<500){ const p = base.map(x=>[x, r()]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]); const k = p.join(','); if(!seen.has(k)){ seen.add(k); perms.push(p); } }
  const types = ['kolom','cirkel','strook','dot']; for(let i=3;i>0;i--){ const j = Math.floor(r()*(i+1)); [types[i],types[j]] = [types[j],types[i]]; }
  const order = [0,1,2,3].map(i=>[i, r()]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  return {c, labs, perms, types, order};
};
function DXmatch(b, st, save, key, d){
  const {c, labs, perms, types, order} = d;
  const quiz = QZ; const qid = QID('koppel'); if(!quiz) CLvraag(qid);
  b.append(el('div','sub', 'Klik een tabel aan en dan het diagram dat erbij hoort. Let op: dezelfde getallen, maar telkens anders verdeeld!'));
  const grid = el('div','dx-match'); b.append(grid);
  const fb = el('div','fb'); b.append(fb);
  const done = st.done || (st.done = {}); let errs = st.errs || 0; let sel = null;
  const NAMES = {kolom:'het staafdiagram', cirkel:'het cirkeldiagram', strook:'het strookdiagram', dot:'de dotplot'};
  const tiles = [];
  perms.forEach((p,i)=>{ const t = el('button','dx-tile', `<span class="tag">tabel ${'ABCD'[i]}</span>` + `<table class="ftab"><thead><tr><th>${c.head}</th><th>aantal</th></tr></thead><tbody>${DXrows(labs, p)}</tbody></table>`); t.type='button'; t.dataset.k='t'; t.dataset.i=i; tiles.push(t); });
  perms.forEach((p,i)=>{ const t = el('button','dx-tile', `<span class="tag">${'1234'[order.indexOf(i)]}</span>`); t.type='button'; t.dataset.k='d'; t.dataset.i=i;
    t.append(drawChart(types[i], {labels:labs, series:[{values:p}], anim:false, step:2, yMax:12}, 360, 250)); tiles.push(t); });
  /* tabellen bovenaan, diagrammen in een andere volgorde eronder */
  tiles.filter(t=>t.dataset.k==='t').forEach(t=>grid.append(t));
  order.forEach(i=>grid.append(tiles[4+i]));
  function paint(){ tiles.forEach(t=>{ const i = +t.dataset.i; t.classList.toggle('ok', !!done[i]); t.classList.toggle('sel', t===sel);
    let pr = t.querySelector('.pair'); if(done[i] && !pr){ pr = el('span','pair', '✓ '+'ABCD'[i]); t.append(pr); } }); }
  tiles.forEach(t=>t.addEventListener('click', ()=>{
    const i = +t.dataset.i; if(done[i] || b.dataset.locked) return;
    if(!sel || sel.dataset.k===t.dataset.k){ sel = (sel===t) ? null : t; paint(); return; }
    const a = sel, ok = +a.dataset.i===i; sel = null;
    if(ok){ done[i] = 1; save(); const ty = types[i];
      fb.className='fb ok'; fb.innerHTML = `✅ Juist! Tabel ${'ABCD'[i]} hoort bij ${NAMES[ty]}.` + (ty==='cirkel'||ty==='strook' ? ` Het grootste deel (${Math.max(...perms[i])} van de ${sum(perms[i])}) hoort bij ${c.head} ${labs[perms[i].indexOf(Math.max(...perms[i]))]}.` : '');
      if(Object.keys(done).length===4 && !quiz){ fb.innerHTML += errs===0 ? ' 🎉 Alles gekoppeld zonder fout!' : ` Alles gekoppeld, met ${errs} ${errs===1?'fout':'fouten'}.`; CLres(qid, errs===0); } }
    else { errs++; st.errs = errs; save(); [a,t].forEach(x=>{ x.classList.add('shake'); setTimeout(()=>x.classList.remove('shake'), 400); });
      fb.className='fb bad'; fb.textContent = '❌ Die horen niet samen. Zoek in de tabel het grootste getal en kijk welk deel van het diagram het grootst is. Dan het kleinste.'; }
    paint(); }));
  paint();
  if(quiz) quiz.push({grade:()=>Object.keys(done).length===4 && errs===0, reveal:()=>{}, lock:()=>{ b.dataset.locked='1'; }});
}

/* ============================================================
   KAARTEN
   ============================================================ */
SECTIONS.find(s=>s.id==='freq').cards.push(
  { title:'Van dotplot naar tabel (nieuwe opgave)', lvl:1, instr:'Tel de bolletjes per kolom. Met "Nieuwe opgave" krijg je een nieuwe dotplot.',
    build:DXfresh(DXgenDot, DXdotToTab) },
  { title:'Van staafdiagram naar tabel', lvl:1, instr:'Lees de hoogte van elke staaf af op de verticale as. Met "Nieuwe opgave" krijg je een nieuw diagram.',
    build:DXfresh(DXgenBar, DXbarToTab) },
  { title:'Een frequentie is weggevallen', lvl:2, instr:'Het totaal is gegeven. Zoek de ontbrekende frequentie.',
    build:DXfresh(DXgenMiss, DXmissing) },
  { title:'De kolom percentage', lvl:2, instr:'Percentage = frequentie : totaal · 100. Met "Nieuwe opgave" krijg je nieuwe getallen.',
    build:DXfresh(DXgenPct, DXpctCol) },
  { title:'Twee frequenties zijn weggevallen', lvl:3, naast:false, instr:'Gebruik het totaal én de aanwijzing.',
    build:DXfresh(DXgenMiss2, DXmissing2) },
  { title:'Van percentage naar aantal', lvl:3, instr:'Je kent het totaal en de percentages. Hoeveel is dat in aantallen?',
    build:DXfresh(DXgenPctBack, DXpctBack) }
);
SECTIONS.find(s=>s.id==='diagram').cards.push(
  { title:'Bouw de dotplot', lvl:1, instr:'Zet voor elk gegeven één bolletje in de juiste kolom.',
    build:DXfresh(DXgenDotBuild, DXdotBuild) },
  { title:'Verdeel het cirkeldiagram', lvl:2, instr:'Maak het cirkeldiagram bij de tabel door de grenzen te verslepen.',
    build:DXfresh(DXgenPie, DXpieBuild) },
  { title:'Bouw het strookdiagram', lvl:2, instr:'Maak het strookdiagram bij de tabel door de grenzen te verslepen.',
    build:DXfresh(DXgenStrip, DXstripBuild) },
  { title:'Welke tabel hoort bij welk diagram?', lvl:2, instr:'Vier tabellen, vier diagrammen. Koppel ze.',
    build:DXfresh(DXgenMatch, DXmatch) },
  { title:'Middelpuntshoeken en cirkeldiagram', lvl:3, instr:'Bereken eerst de middelpuntshoeken, verdeel dan de cirkel.',
    build:DXfresh(DXgenDeg, DXdegBuild) }
);
/* ============================================================
   SOORTEN DATA EN FREQUENTIE: extra uitleg (herwerking oktober 2026)
   Basis en oefenen zeggen gewoon "frequentie"; absolute en relatieve frequentie zijn verdieping.
   ============================================================ */
(function(){
  const css = `
  .sd2{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1.2rem; align-items:start; }
  .sd2 > div{ border:2px solid var(--border); border-radius:.9rem; padding:.7rem .9rem; background:var(--zone-bg); min-width:0; }
  .sd2 h4{ margin:0 0 .2rem; font-size:1.1rem; }
  .sd2 .vr{ margin:.1rem 0 .5rem; color:var(--ink-soft); font-style:italic; }
  .sd2 ul{ margin:.5rem 0 0; padding-left:1.2rem; display:flex; flex-direction:column; gap:.25rem; }
  .sd2 .cat h4{ color:#b26a00; } .sd2 .num h4{ color:var(--accent-dark); }
  .sd-let{ margin:.8rem 0 .2rem; border-left:4px solid var(--orange); padding:.3rem .7rem; background:var(--or-soft); border-radius:0 .5rem .5rem 0; }
  @media (max-width: 900px){ .sd2{ grid-template-columns:minmax(0,1fr); } }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

const SD_UITLEG = `<div class="sd2">
  <div class="cat"><h4>Categorische data</h4><p class="vr">Wat is je favoriete sport?</p>
    ${ftabHTML(['favoriete sport','frequentie'], [['voetbal',8],['dans',5],['tennis',3],['zwemmen',6],['andere',3],['<b>totaal</b>','<b>25</b>']])}
    <ul><li>De antwoorden zijn <b>woorden</b>: groepen of categorieën.</li>
      <li>Je kan <b>tellen</b> hoeveel keer elk antwoord voorkomt (de frequentie) en zien wat het meest voorkomt.</li>
      <li>Rekenen met de antwoorden zelf kan niet: het gemiddelde van voetbal en dans bestaat niet.</li>
      <li>Past bij: staafdiagram, strookdiagram, cirkeldiagram.</li></ul></div>
  <div class="num"><h4>Numerieke data</h4><p class="vr">Hoeveel broers en zussen heb je?</p>
    ${ftabHTML(['aantal broers en zussen','frequentie'], [['0',4],['1',10],['2',7],['3',3],['4',1],['<b>totaal</b>','<b>25</b>']])}
    <ul><li>De antwoorden zijn <b>getallen</b> waarmee rekenen zin heeft.</li>
      <li>Je kan ze ordenen van klein naar groot.</li>
      <li>Je kan een gemiddelde, een mediaan en een variatiebreedte berekenen.</li>
      <li>Past bij: dotplot, staafdiagram, lijndiagram (een verloop in de tijd).</li></ul></div>
</div>
<p class="sd-let"><b>Opgelet:</b> niet elk getal is numerieke data. Een rugnummer, een postcode of een telefoonnummer is een naam in cijfers. Het gemiddelde van twee rugnummers zegt niets, dus dat is <b>categorische</b> data.</p>`;

(function(){
  const soort = SECTIONS.find(s=>s.id==='soort').cards;
  soort.unshift({ title:'Twee soorten data', lvl:1, naast:false, instr:'Lees de uitleg bij de twee tabellen en beantwoord dan de vragen.',
    build:(b,st,save,key)=>{
      b.append(el('div','', SD_UITLEG));
      qChoice(b, st, save, 'a', {html:'In welke tabel kan je het gemiddelde berekenen?', ans:'n', opts:[['c','favoriete sport'],['n','aantal broers en zussen'],['b','in beide']]});
      qChoice(b, st, save, 'b', {html:'Je vraagt: <i>Hoeveel minuten fiets je naar school?</i> Welke soort data krijg je?', ans:'n', opts:CN});
      qChoice(b, st, save, 'c', {html:'Je vraagt: <i>Met welk vervoermiddel kom je naar school?</i> Welke soort data krijg je?', ans:'c', opts:CN});
      qChoice(b, st, save, 'd', {html:'Je noteert de <i>rugnummers</i> van de spelers. Welke soort data is dat?', ans:'c', opts:CN});
    } });

  /* verdieping: de woorden absolute en relatieve frequentie */
  const freq = SECTIONS.find(s=>s.id==='freq').cards;
  freq.push({ title:'Absolute en relatieve frequentie', lvl:3, instr:'In boeken en op toetsen zie je soms twee soorten frequentie. Lees de uitleg en vul de tabel aan.',
    build:(b,st,save,key)=>{
      b.append(el('div','', `<p><b>Absolute frequentie</b> is wat je tot nu toe gewoon <i>frequentie</i> noemde: <b>hoeveel keer</b> een gegeven voorkomt.<br>
        <b>Relatieve frequentie</b> zegt <b>welk deel van het totaal</b> dat is: absolute frequentie : totaal. Je schrijft het als kommagetal of als percentage.</p>
        <p>Voorbeeld: 9 van de 20 leerlingen komen met de fiets. De absolute frequentie is 9. De relatieve frequentie is 9 : 20 = 0,45 = 45 %.</p>`));
      list([{ html:`<table class="ftab"><thead><tr><th>vervoer</th><th>absolute frequentie</th><th>relatieve frequentie (kommagetal)</th><th>relatieve frequentie (%)</th></tr></thead><tbody>
          <tr><td class="l">fiets</td><td>9</td><td>0,45</td><td>45 %</td></tr>
          <tr><td class="l">bus</td><td>5</td><td>[[0]]</td><td>[[1]] %</td></tr>
          <tr><td class="l">te voet</td><td>4</td><td>[[2]]</td><td>[[3]] %</td></tr>
          <tr><td class="l">auto</td><td>2</td><td>[[4]]</td><td>[[5]] %</td></tr>
          <tr><td class="l"><b>totaal</b></td><td><b>20</b></td><td>[[6]]</td><td>[[7]] %</td></tr></tbody></table>`, block:true, size:'xs',
        check:nums([0.25,25,0.2,20,0.1,10,1,100], 1e-9, 'Deel de absolute frequentie door 20. Voor het percentage vermenigvuldig je dan met 100.'),
        sol:'bus 5 : 20 = 0,25 = 25 % · te voet 4 : 20 = 0,2 = 20 % · auto 2 : 20 = 0,1 = 10 % · samen 1 = 100 %' }])(b, st, save, key+'_t');
      qChoice(b, st, save, 'k', {html:'Wat is altijd de som van alle relatieve frequenties?', ans:'1', opts:[['1','1, of 100 %'],['t','het totaal (20)'],['0','dat hangt af van de tabel']]});
    } });
})();

/* ---- misleidende grafieken: het teken voor een onderbroken as (basis) en wanneer dat wél mag (verdieping) ---- */
(function(){
  const mis = SECTIONS.find(s=>s.id==='mislei').cards;
  const KOORTS = {labels:['8 u','10 u','12 u','14 u','16 u','18 u','20 u'], series:[{values:[37.2,38.1,38.9,39.4,38.8,38.2,37.6]}], xTitle:'tijdstip', yTitle:'temperatuur (°C)', yMin:36, yMax:40, step:0.5, anim:false};
  mis.push({ title:'Het teken voor een onderbroken as', lvl:1, instr:'Kijk naar de verticale as van dit lijndiagram over de koorts van Lieve.',
    build:(b,st,save,key)=>{
      chartBox('lijn', KOORTS)(b);
      b.append(el('div','', `<p>De verticale as begint hier niet bij 0 maar bij 36 °C. Dat toon je met een <b>zigzag</b> (een <b>onderbroken as</b>) onderaan de as: zo ziet de lezer meteen dat er een stuk van de as weggelaten is.</p>`));
      qChoice(b, st, save, 'a', {html:'Wat betekent de zigzag onderaan de verticale as?', ans:'w', opts:[['w','Een stuk van de as is weggelaten: ze begint niet bij 0.'],['f','De grafiek is fout getekend.'],['k','De temperatuur daalde even heel snel.']]});
      qChoice(b, st, save, 'b', {html:'Waarom begint de as hier bij 36 °C?', ans:'v', opts:[['v','Zo zie je het verloop van de koorts beter: de verschillen zijn klein (tienden van een graad).'],['m','Om de lezer te misleiden.'],['n','Omdat een temperatuur nooit 0 °C kan zijn.']]});
    } });
  mis.push({ title:'Wanneer mag de as niet bij 0 starten?', lvl:3, instr:'Een as die niet bij 0 begint, is niet altijd misleidend. Lees de vuistregel en beoordeel de situaties.',
    build:(b,st,save,key)=>{
      b.append(el('div','', `<p><b>Vuistregel</b></p><ul>
        <li><b>Staafdiagram</b>: de as begint <b>altijd bij 0</b>. Je vergelijkt de hoogte (de lengte) van de staven. Begint de as hoger, dan lijkt een kleine staaf veel kleiner dan hij is.</li>
        <li><b>Lijndiagram</b>: je kijkt naar het <b>verloop</b> (stijgen, dalen). Zijn de schommelingen klein ten opzichte van de getallen, dan mag de as hoger beginnen, <b>met het teken voor een onderbroken as</b>.</li>
        <li>Vergelijk je twee grafieken, gebruik dan <b>dezelfde schaal</b>, of zet beide reeksen in één grafiek.</li></ul>`));
      choiceList([
        ['Een lijndiagram van je lichaamstemperatuur tijdens een week, as van 36 °C tot 40 °C met een zigzag.', 'j', 'In orde: je wil het verloop zien en de verschillen zijn tienden van een graad.'],
        ['Een staafdiagram dat het jaarloon in drie bedrijven vergelijkt, as vanaf 40 000 €.', 'n', 'Misleidend: bij staven vergelijk je de hoogte, dus de as moet bij 0 beginnen.'],
        ['Een lijndiagram van de prijs van een liter benzine per maand, as van 1,60 € tot 1,90 € met een zigzag.', 'j', 'In orde: het verloop van de prijs staat centraal en de onderbroken as is aangeduid.'],
        ['Twee lijndiagrammen naast elkaar die elk een andere schaal op de verticale as hebben, om twee winkels te vergelijken.', 'n', 'Misleidend: met een andere schaal kan je de twee winkels niet eerlijk vergelijken. Zet ze in één grafiek.']
      ], [['j','in orde'],['n','misleidend']])(b, st, save, key);
    } });
})();

/* ============================================================
   DOTPLOT OP EEN GETALLENAS
   ============================================================ */
function numPlot(vals, lo, hi, opts={}){
  const W = opts.W || 600, step = opts.step || 1;
  const cnt = {}; vals.forEach(v=>cnt[v]=(cnt[v]||0)+1);
  const maxc = Math.max(1, ...Object.values(cnt));
  const L = 30, R = 30, pw = W-L-R, r = Math.min(11, pw/((hi-lo)/step+1)/2.4);
  const H = (opts.extra||40) + maxc*r*2.15 + 50;
  const svg = newSvg(W, H);
  const base = H-40;
  const X = v => L + pw*(v-lo)/(hi-lo);
  svgEl('line',{x1:L-12, y1:base, x2:L+pw+12, y2:base, class:'ax'}, svg);
  for(let v=lo; v<=hi+1e-9; v+=step){ svgEl('line',{x1:X(v), y1:base, x2:X(v), y2:base+5, class:'ax'}, svg); svgText(svg, X(v), base+21, nf(v), {'text-anchor':'middle'}); }
  if(opts.xTitle) svgText(svg, W/2, H-2, opts.xTitle, {'text-anchor':'middle', class:'t-soft'});
  const dots = svgEl('g', {}, svg);
  function drawDots(vs, hiSet){
    dots.innerHTML=''; const c={};
    vs.forEach((v,i)=>{ c[v]=(c[v]||0)+1; const k=c[v]-1; const d=svgEl('circle',{cx:X(v), cy:base-r-2-k*r*2.15, r, class:'dot'+(hiSet&&hiSet.has(i)?' hi':'')}, dots); d.dataset.i=i; });
  }
  drawDots(vals, opts.hi);
  return {svg, X, base, r, lo, hi, step, drawDots, W, H, L, pw};
}
function marker(P, v, txt, cls){ const g=svgEl('g',{}, P.svg); const x=P.X(v); svgEl('path',{d:`M${x},${P.base+28} l-8,12 h16 z`, fill: cls==='or'?'var(--orange)':'var(--accent-dark)'}, g); svgText(g, x, P.base+56, txt, {'text-anchor':'middle', class: cls==='or'?'t-or':'t-acc'}); return g; }

/* --- klik op een kolom van de dotplot (modus, minimum, maximum) --- */
function dotPick(b, st, save, key, cfg){
  const P = numPlot(cfg.vals, cfg.lo, cfg.hi, {xTitle:cfg.xTitle});
  b.append(el('div','readout bigq', cfg.ask));
  const v = el('div','viz mid'); v.append(P.svg); b.append(v);
  const fb = el('div','fb'); b.append(fb);
  const quiz = QZ; const qid = QID('klik'); if(!quiz) CLvraag(qid);
  const ok = x => cfg.ans.includes(x);
  function paint(){ const hs = new Set(); cfg.vals.forEach((x,i)=>{ if(x===st.x) hs.add(i); }); P.drawDots(cfg.vals, hs); }
  for(let x=cfg.lo; x<=cfg.hi; x+=P.step){ const h=svgEl('rect',{x:P.X(x)-P.pw/((cfg.hi-cfg.lo)/P.step+1)/2, y:0, width:P.pw/((cfg.hi-cfg.lo)/P.step+1), height:P.base+30, class:'hit'}, P.svg);
    h.addEventListener('click', ()=>{ if(v.dataset.locked) return; st.x = x; save(); paint(); if(quiz) return;
      const g = ok(x); fb.className='fb '+(g?'ok':'bad'); fb.innerHTML = g ? '✅ Juist! '+(cfg.why||'') : '❌ Niet juist. '+(cfg.hint||''); CLres(qid, g); }); }
  paint();
  if(quiz) quiz.push({grade:()=>ok(st.x), reveal:()=>{}, lock:()=>{ v.dataset.locked='1'; }});
}

/* ============================================================
   GEMIDDELDE: EERLIJK VERDELEN
   ============================================================ */
function levelBlocks(b, vals, names){
  const n = vals.length, u = 28, maxH = Math.max(...vals)+1;
  const W = n*90+40, H = maxH*u+70;
  const v = el('div','viz mid'); const bar = el('div','viz-bar'); const out = el('div','readout bigq');
  const go = el('button','btn','▶ Verdeel eerlijk'); go.type='button'; const back = el('button','btn ghost','↺ Terug'); back.type='button';
  bar.append(go, back); b.append(v, bar, out);
  let h = vals.slice(), busy = false;
  const tot = sum(vals), m = tot/n;
  function draw(moved){
    const svg = newSvg(W, H); v.innerHTML=''; v.append(svg);
    const base = H-40;
    svgEl('line',{x1:10, y1:base, x2:W-10, y2:base, class:'ax'}, svg);
    h.forEach((k,i)=>{ const x = 30+i*90;
      for(let j=0;j<k;j++){ const r=svgEl('rect',{x, y:base-(j+1)*u+2, width:58, height:u-4, rx:5, class:'bar'+(moved && moved.to===i && j===k-1?' hi pop':'')}, svg); }
      svgText(svg, x+29, base+20, names?names[i]:'', {'text-anchor':'middle'});
      svgText(svg, x+29, base-k*u-8, String(k), {'text-anchor':'middle', class:'t-acc'}); });
    if(h.every(x=>x===h[0])){ const y = base-h[0]*u; svgEl('line',{x1:10, y1:y, x2:W-10, y2:y, class:'proj'}, svg); }
  }
  function say(){ out.innerHTML = `Samen <b>${tot}</b> blokjes over <b>${n}</b> torens. ${h.every(x=>x===h[0]) ? `Nu is elke toren <b>${h[0]}</b> hoog: ${tot} : ${n} = <b>${nf(m)}</b>. Dat is het gemiddelde.` : 'Klik op Verdeel eerlijk: telkens gaat er een blokje van de hoogste naar de laagste toren.'}`; }
  go.addEventListener('click', async ()=>{ if(busy) return; busy = true;
    while(true){ let i = h.indexOf(Math.max(...h)), j = h.indexOf(Math.min(...h)); if(h[i]-h[j]<=1) break; h[i]--; h[j]++; draw({to:j}); await sleep(420); }
    say(); busy = false; });
  back.addEventListener('click', ()=>{ if(busy) return; h = vals.slice(); draw(); say(); });
  draw(); say();
}

/* --- het gemiddelde als evenwichtspunt: sleep het steunpunt --- */
function seesaw(b, st, save, key, cfg){
  const W = 600, H = 250, L = 30, pw = W-60, base = 150;
  const X = x => L + pw*(x-cfg.lo)/(cfg.hi-cfg.lo);
  const svg = newSvg(W, H);
  const beam = svgEl('g', {}, svg);
  svgEl('rect',{x:L-14, y:base-3, width:pw+28, height:6, rx:3, fill:'var(--accent-dark)'}, beam);
  for(let x=cfg.lo; x<=cfg.hi; x++){ svgText(beam, X(x), base+22, nf(x), {'text-anchor':'middle'}); }
  const cnt = {}; const r = 11;
  cfg.vals.forEach(x=>{ cnt[x]=(cnt[x]||0)+1; svgEl('circle',{cx:X(x), cy:base-3-r-(cnt[x]-1)*r*2.1, r, class:'dot'}, beam); });
  const tri = svgEl('path', {fill:'var(--orange)', class:'dragme'}, svg);
  svgEl('line',{x1:10, y1:base+64, x2:W-10, y2:base+64, class:'ax'}, svg);
  if(cfg.xTitle) svgText(svg, W/2, H-6, cfg.xTitle, {'text-anchor':'middle', class:'t-soft'});
  const v = el('div','viz mid'); v.append(svg); b.append(v);
  const out = el('div','readout bigq'); b.append(out);
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn);
  const fb = el('div','fb'); b.append(act, fb);
  const quiz = QZ; const qid = QID('wip'); if(!quiz) CLvraag(qid); else act.hidden = true;
  const m = mean(cfg.vals);
  if(st.f==null) st.f = cfg.start ?? cfg.lo;
  beam.style.transition = 'transform .35s ease';
  function paint(){
    const f = st.f, torque = sum(cfg.vals.map(x=>x-f));
    const ang = Math.max(-7, Math.min(7, torque*0.9));
    const x = X(f);
    tri.setAttribute('d', `M${x},${base+3} l-18,61 h36 z`);
    beam.setAttribute('transform', `rotate(${ang} ${x} ${base})`);
    out.innerHTML = `Steunpunt bij <b>${nf(f,1)}</b> · ${Math.abs(torque)<1e-9 ? 'de wip is in <b>evenwicht</b>!' : torque>0 ? 'de wip kantelt naar <b>rechts</b>: schuif het steunpunt naar rechts.' : 'de wip kantelt naar <b>links</b>: schuif het steunpunt naar links.'}`;
  }
  const snap = cfg.snap || 0.5;
  function setFrom(ev){ const pt=svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY; const p=pt.matrixTransform(svg.getScreenCTM().inverse()); let f = cfg.lo + (p.x-L)/pw*(cfg.hi-cfg.lo); f = Math.max(cfg.lo, Math.min(cfg.hi, Math.round(f/snap)*snap)); if(f!==st.f){ st.f=f; save(); paint(); } }
  let drag=false;
  svg.addEventListener('pointerdown', e=>{ if(v.dataset.locked) return; drag=true; try{ svg.setPointerCapture(e.pointerId); }catch(_){} setFrom(e); });
  svg.addEventListener('pointermove', e=>{ if(drag) setFrom(e); });
  svg.addEventListener('pointerup', ()=>drag=false);
  const okF = () => Math.abs(st.f-m)<1e-9;
  btn.addEventListener('click', ()=>{ const ok = okF(); fb.className='fb '+(ok?'ok':'bad'); fb.innerHTML = ok ? `✅ Juist! Het evenwichtspunt is het gemiddelde: (${cfg.vals.join(' + ')}) : ${cfg.vals.length} = ${sum(cfg.vals)} : ${cfg.vals.length} = <b>${nf(m,2)}</b>.` : '❌ De wip is nog niet in evenwicht.'; CLres(qid, ok); });
  paint();
  if(quiz) quiz.push({grade:okF, reveal:()=>{}, lock:()=>{ v.dataset.locked='1'; }});
}

/* ============================================================
   MEDIAAN: ORDENEN EN WEGSTREPEN
   ============================================================ */
function medianStrike(b, st, save, key, cfg){
  const vals = cfg.vals, n = vals.length, srt = sorted(vals), med = median(vals);
  const row = el('div','data-row'); const bar = el('div','viz-bar'); const out = el('div','readout bigq');
  const sortBtn = el('button','btn','▶ Orden van klein naar groot'); sortBtn.type='button'; bar.append(sortBtn);
  b.append(row, bar, out);
  st.gone = st.gone || [];
  const quiz = QZ;
  let boxes = [];
  function build(arr){ row.innerHTML=''; boxes = arr.map((x,i)=>{ const k = el('button','dv', nf(x)); k.type='button'; k.dataset.i=i; row.append(k); return k; }); }
  function paintSorted(){
    boxes.forEach((k,i)=>{ k.classList.toggle('gone', st.gone.includes(i)); k.classList.remove('mid'); });
    const left = boxes.map((k,i)=>i).filter(i=>!st.gone.includes(i));
    if(left.length<=2){ left.forEach(i=>boxes[i].classList.add('mid')); out.innerHTML = left.length===1 ? `Er blijft één getal over: de mediaan is <b>${nf(srt[left[0]])}</b>.` : `Er blijven twee getallen over: de mediaan ligt midden tussen ${nf(srt[left[0]])} en ${nf(srt[left[1]])}. Vul hieronder in.`; }
    else out.innerHTML = `Streep telkens het <b>kleinste</b> en het <b>grootste</b> getal weg (klik erop). Nog ${left.length} getallen over.`;
  }
  async function doSort(anim){
    if(!anim){ build(srt); st.sorted = true; save(); sortBtn.disabled = true; paintSorted(); return; }
    /* FLIP-animatie: elk vakje schuift naar zijn plaats */
    const first = boxes.map(k=>k.getBoundingClientRect());
    const order = vals.map((x,i)=>i).sort((a,c)=>vals[a]-vals[c]||a-c);
    order.forEach(i=>row.append(boxes[i]));
    boxes.forEach((k,i)=>{ const r1=k.getBoundingClientRect(); const dx=first[i].left-r1.left, dy=first[i].top-r1.top; k.style.transition='none'; k.style.transform=`translate(${dx}px,${dy}px)`; });
    await new Promise(r=>requestAnimationFrame(r));
    boxes.forEach(k=>{ k.style.transition='transform .8s ease'; k.style.transform=''; k.classList.add('hi'); });
    await sleep(900);
    build(srt); st.sorted = true; save(); sortBtn.disabled = true; paintSorted();
  }
  row.addEventListener('click', e=>{
    const k = e.target.closest('.dv'); if(!k || !st.sorted) { if(k && !st.sorted){ out.innerHTML='Orden eerst de getallen van klein naar groot.'; } return; }
    const i = +k.dataset.i; const left = boxes.map((x,j)=>j).filter(j=>!st.gone.includes(j));
    if(left.length<=2 || st.gone.includes(i)) return;
    const goneL = st.gone.filter(j=>j<n/2).length, goneR = st.gone.length-goneL;
    const wantLeft = goneL<=goneR; /* afwisselend links en rechts */
    const ok = (i===left[0] && (wantLeft || goneL<goneR+1)) || (i===left[left.length-1] && (!wantLeft || goneR<goneL+1));
    if(!ok || (i===left[0] && goneL>goneR) || (i===left[left.length-1] && goneR>goneL)){ k.classList.add('shake'); setTimeout(()=>k.classList.remove('shake'),400); out.innerHTML = i===left[0]||i===left[left.length-1] ? 'Streep om de beurt links en rechts weg, zodat er links en rechts evenveel verdwijnen.' : 'Streep enkel het kleinste of het grootste getal weg dat nog over is.'; return; }
    st.gone.push(i); save(); paintSorted();
  });
  sortBtn.addEventListener('click', ()=>doSort(true));
  build(vals);
  if(st.sorted) doSort(false); else out.innerHTML = `${n} gegevens. De mediaan is het middelste gegeven, maar eerst moet je ordenen.`;
  qBlock(b, st, save, key+'_me', {html:'De mediaan is Me = [[0]]', check:exact(med, n%2?'Het middelste getal na het ordenen.':'Neem het gemiddelde van de twee middelste getallen: tel ze op en deel door 2.'),
    sol: n%2 ? `Na het ordenen is het ${(n+1)/2}de getal het middelste: <b>${nf(med)}</b>.` : `De twee middelste getallen zijn ${nf(srt[n/2-1])} en ${nf(srt[n/2])}: (${nf(srt[n/2-1])} + ${nf(srt[n/2])}) : 2 = <b>${nf(med)}</b>.`});
}

/* ============================================================
   UITSCHIETER: SLEEP EEN PUNT EN KIJK NAAR GEMIDDELDE EN MEDIAAN
   ============================================================ */
function outlierDemo(b, cfg){
  /* grafiek links; rechts een tabel begin/nu en wat dat betekent */
  const vals = cfg.vals.slice(), start = cfg.vals.slice(), last = vals.length-1, unit = cfg.unit || '';
  const P = numPlot(vals, cfg.lo, cfg.hi, {xTitle:cfg.xTitle, extra:40, step:cfg.step||1});
  const w = el('div','nx'), L = el('div','nx-l'), R = el('div','nx-r'); w.append(L, R); b.append(w);
  const v = el('div','viz'); v.append(P.svg); L.append(v, el('div','sub','Sleep het oranje bolletje naar rechts of naar links.'));
  const tab = el('div'), out = el('div','uit-concl'); R.append(tab, out);
  let mk = [];
  const m0 = mean(start), me0 = median(start), vb0 = range(start);
  function paint(){
    P.drawDots(vals, new Set([last]));
    mk.forEach(g=>g.remove());
    const m = mean(vals), me = median(vals);
    mk = [marker(P, m, 'x̄ = '+nf(m,1), 'or'), marker(P, me, 'Me = '+nf(me,1))];
    mk[1].setAttribute('transform','translate(0,30)');
    const rij = (n, a, c) => `<tr><td class="l">${n}</td><td>${nf(a,2)} ${unit}</td><td>${nf(c,2)} ${unit}</td><td><b>${c-a>=0?'+':'−'} ${nf(Math.abs(c-a),2)}</b></td></tr>`;
    tab.innerHTML = `<table class="ftab"><thead><tr><th>maat</th><th>begin (${start[last]} ${unit})</th><th>nu (${vals[last]} ${unit})</th><th>verschil</th></tr></thead><tbody>${rij('gemiddelde x̄', m0, m)}${rij('mediaan Me', me0, me)}${rij('variatiebreedte', vb0, range(vals))}</tbody></table>`;
    const dm = m - m0, dme = me - me0;
    out.innerHTML = vals[last] < 30 ? '<p>Sleep het oranje bolletje ver naar rechts: die leerling woont heel ver.</p>'
      : `<p><b>Wat zie je?</b> Eén leerling woont nu ver weg: dat is een <b>uitschieter</b>.</p><ul>
        <li>Het <b>gemiddelde</b> steeg met <b>${nf(dm,2)} ${unit}</b>: de uitschieter trekt het gemiddelde mee, want alle gegevens worden opgeteld.</li>
        <li>De <b>mediaan</b> steeg maar met <b>${nf(dme,2)} ${unit}</b>: het middelste gegeven blijft bijna hetzelfde.</li>
        <li>De <b>variatiebreedte</b> wordt veel groter: ze hangt alleen af van het kleinste en het grootste gegeven.</li></ul>
        <p>Besluit: is er een uitschieter, dan geeft de <b>mediaan</b> het eerlijkste beeld van een gewone waarde.</p>`;
  }
  let drag=false;
  function setFrom(ev){ const pt=P.svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY; const p=pt.matrixTransform(P.svg.getScreenCTM().inverse()); let x = cfg.lo + (p.x-P.L)/P.pw*(cfg.hi-cfg.lo); x = Math.max(cfg.lo, Math.min(cfg.hi, Math.round(x/(cfg.step||1))*(cfg.step||1))); if(x!==vals[last]){ vals[last]=x; paint(); } }
  P.svg.addEventListener('pointerdown', e=>{ const c = e.target.closest('circle.dot'); if(!c || +c.dataset.i!==last) return; drag=true; P.svg.setPointerCapture(e.pointerId); e.preventDefault(); });
  P.svg.addEventListener('pointermove', e=>{ if(drag) setFrom(e); });
  P.svg.addEventListener('pointerup', ()=>drag=false);
  P.svg.style.height='auto'; paint();
  P.svg.setAttribute('viewBox', `0 0 ${P.W} ${P.H+80}`);
}

/* ============================================================
   ONDERDEEL 7 · MODUS EN VARIATIEBREEDTE
   ============================================================ */
const CHEAT_MATEN = `<h3>Spiekbriefje · centrummaten en spreidingsmaat</h3><table>
<tr><td>modus</td><td>Het gegeven dat het meest voorkomt (de grootste frequentie). Kan ook bij categorische data.</td></tr>
<tr><td>gemiddelde x̄</td><td>som van alle gegevens : aantal gegevens</td></tr>
<tr><td>mediaan Me</td><td>Orden van klein naar groot. Oneven aantal: het middelste gegeven. Even aantal: het gemiddelde van de twee middelste.</td></tr>
<tr><td>variatiebreedte</td><td>grootste waarde − kleinste waarde (maximum − minimum)</td></tr>
<tr><td>centrummaat</td><td>Modus, gemiddelde en mediaan: een typische waarde voor de dataset.</td></tr>
<tr><td>spreidingsmaat</td><td>Variatiebreedte: hoe ver de gegevens uit elkaar liggen.</td></tr></table>`;
const BROERS = [0,1,1,2,1,0,3,1,2,1,0,2,1,4,1,2,0,1,2,1];
SECTIONS.push({ id:'modus', ic:'modus', nav:'Modus en variatiebreedte', title:'Modus en variatiebreedte', cheat:CHEAT_MATEN,
  tip:'De modus zie je meteen in een dotplot: de hoogste stapel. De variatiebreedte is de afstand tussen het kleinste en het grootste gegeven.',
  cards:[
    { title:'Klik op de modus', lvl:1, instr:'Twintig leerlingen: hoeveel broers en zussen heb je?',
      build:combo((b,st,save,key)=>dotPick(b,st,save,key,{vals:BROERS, lo:0, hi:5, xTitle:'Aantal broers en zussen', ask:'Klik op de kolom van de <b>modus</b>.', ans:[1], why:'1 komt het meest voor (9 keer): de hoogste stapel.', hint:'De modus is het gegeven dat het vaakst voorkomt: zoek de hoogste stapel.'}),
        choiceList([['Wat betekent deze modus?', 'b', 'De modus is een gegeven (1 broer of zus), niet een aantal leerlingen.']], [['a','9 leerlingen hebben broers of zussen.'],['b','De meeste leerlingen hebben 1 broer of zus.'],['c','Gemiddeld heeft een leerling 1 broer of zus.']])) },
    { title:'Klik op het minimum en het maximum', lvl:1, instr:'Dezelfde twintig leerlingen.',
      build:combo((b,st,save,key)=>dotPick(b,st,save,key,{vals:BROERS, lo:0, hi:5, xTitle:'Aantal broers en zussen', ask:'Klik op het <b>maximum</b>: het grootste gegeven.', ans:[4], why:'Het grootste aantal is 4. Bij 5 staat geen bolletje!', hint:'Het maximum is het grootste gegeven dat echt voorkomt.'}),
        list([{html:'Het minimum is [[0]], het maximum is [[1]]. De variatiebreedte is [[2]].', size:'sm', mode:'numeric', check:nums([0,4,4], 1e-9, 'Variatiebreedte = maximum − minimum.'), sol:'minimum 0, maximum 4 · variatiebreedte = 4 − 0 = <b>4</b>.'}])) },
    { title:'Modus en variatiebreedte uit een lijst', lvl:2, build:list([
        {html:'Punten op een quiz: 7, 9, 6, 9, 8, 5, 9, 7, 10. Modus = [[0]] · variatiebreedte = [[1]]', size:'sm', check:nums([9,5]), sol:'9 komt 3 keer voor: modus <b>9</b>. Grootste 10, kleinste 5: 10 − 5 = <b>5</b>.'},
        {html:'Temperaturen (°C): 4, −2, 3, 0, −2, 5, 1. Modus = [[0]] °C · variatiebreedte = [[1]] °C', size:'sm', check:nums([-2,7]), sol:'−2 komt 2 keer voor: modus <b>−2 °C</b>. 5 − (−2) = 5 + 2 = <b>7 °C</b>.'},
        {html:'Lengtes (cm): 152, 160, 148, 155, 160, 149, 158. Modus = [[0]] cm · variatiebreedte = [[1]] cm', size:'sm', check:nums([160,12]), sol:'160 komt 2 keer voor. 160 − 148 = <b>12 cm</b>.'}
      ], {letters:true}) },
    { title:'Modus bij categorische data', lvl:2, instr:'Een klas noteerde haar bloedgroep.',
      build:combo(chartBox('kolom', {labels:['O+','A+','B+','AB+','O−','A−'], series:[{values:[9,8,2,1,2,2]}], yTitle:'Aantal leerlingen', step:1, yMax:10}),
        choiceList([
          ['De modus is ...', 'a', 'O+ komt het meest voor (9 keer).'],
        ], [['a','O+'],['b','9'],['c','A+']]),
        choiceList([
          ['Kan je hier een gemiddelde of een variatiebreedte berekenen?', 'n', 'Bloedgroepen zijn categorische data: rekenen heeft geen zin. Enkel de modus heeft betekenis.']
        ], [['j','Ja'],['n','Nee']])) },
    { title:'Twee modi', lvl:2, build:list([
        {html:'Aantal goals per match: 2, 0, 3, 1, 0, 2, 4, 1, 2, 0. De twee modi zijn [[0]] en [[1]] (kleinste eerst).', size:'sm', check:nums([0,2], 1e-9, 'Tel voor elk getal hoeveel keer het voorkomt.'), sol:'0 komt 3 keer voor en 2 ook 3 keer. Er zijn twee modi: <b>0 en 2</b>.'}
      ]) },
    { title:'Redeneren met de variatiebreedte', lvl:3, build:list([
        {html:'De variatiebreedte van een reeks is 18. Het kleinste getal is 37. Wat is het grootste getal? [[0]]', mode:'numeric', check:exact(55), sol:'maximum − 37 = 18, dus maximum = 37 + 18 = <b>55</b>.'},
        {html:'Reeks: 12, 15, 9, 20, 14. Je voegt één getal toe. Welk getal kan je toevoegen zodat de variatiebreedte 15 wordt? Geef het grootste. [[0]]', mode:'numeric', check:exact(24), sol:'Nu: 20 − 9 = 11. Wil je 15: een nieuw maximum 9 + 15 = <b>24</b> (of een nieuw minimum 20 − 15 = 5).'},
        {html:'Mila scoort 6, 8, 7 en 9 bij een spel. Daarna haalt ze een 10. Variatiebreedte voor de 10: [[0]] · na de 10: [[1]]', size:'sm', check:nums([3,4]), sol:'Voor: 9 − 6 = 3. Na: 10 − 6 = <b>4</b>.'}
      ], {letters:true}) }
  ]});

/* ============================================================
   ONDERDEEL 8 · HET GEMIDDELDE
   ============================================================ */
SECTIONS.push({ id:'gem', ic:'gem', nav:'Het gemiddelde', title:'Het rekenkundig gemiddelde', cheat:CHEAT_MATEN,
  tip:'Het gemiddelde is wat iedereen zou hebben als je alles eerlijk verdeelt: tel alles op en deel door het aantal gegevens.',
  cards:[
    { title:'Eerlijk verdelen', lvl:1, instr:'Vijf vrienden hebben elk een stapel snoepjes. Verdeel eerlijk en kijk wat het gemiddelde is.',
      build:combo(b=>levelBlocks(b, [7,3,6,2,7], ['Ali','Bo','Cas','Dina','Eva']), list([
        {html:'Hoeveel snoepjes zijn er samen? [[0]]', mode:'numeric', check:exact(25), sol:'7 + 3 + 6 + 2 + 7 = <b>25</b>.'},
        {html:'Hoeveel krijgt elk bij eerlijk verdelen? x̄ = [[0]]', mode:'numeric', check:exact(5), sol:'25 : 5 = <b>5</b>.'}
      ], {letters:true})) },
    { title:'Eerlijk verdelen met rest', lvl:1, instr:'Vier torens. Lukt het eerlijk verdelen helemaal?',
      build:combo(b=>levelBlocks(b, [6,2,5,5], ['A','B','C','D']), list([
        {html:'Het gemiddelde is x̄ = [[0]]', check:exact(4.5), sol:'6 + 2 + 5 + 5 = 18 en 18 : 4 = <b>4,5</b>. Twee torens krijgen 5, twee krijgen 4: gemiddeld 4,5. Een gemiddelde hoeft geen gegeven te zijn!'}
      ])) },
    { title:'De wip in evenwicht', lvl:2, instr:'Het gemiddelde is het evenwichtspunt van de dotplot. Sleep het oranje steunpunt tot de wip in evenwicht is.',
      build:(b,st,save,key)=>seesaw(b,st,save,key,{vals:[2,3,3,5,7], lo:0, hi:10, start:1, xTitle:'Aantal uren sport per week'}) },
    { title:'Nog een wip', lvl:2, instr:'Zes leerlingen: hoeveel keer per week eten ze fruit? Zoek het evenwicht.',
      build:(b,st,save,key)=>seesaw(b,st,save,key,{vals:[1,2,3,6,8,10], lo:0, hi:10, start:9, xTitle:'Aantal keer fruit per week'}) },
    { title:'Bereken het gemiddelde', lvl:2, instr:'Rond af op 0,1 waar nodig.',
      build:list([
        {html:'Zakgeld per week (€): 5, 8, 10, 5, 12. x̄ = [[0]] €', check:exact(8), sol:'(5 + 8 + 10 + 5 + 12) : 5 = 40 : 5 = <b>8 €</b>.'},
        {html:'Minuten lezen per dag: 20, 35, 0, 15, 40, 25, 30. x̄ = [[0]] min', check:approx(23.6, 0.051), sol:'Som = 165, en 165 : 7 = 23,57… ≈ <b>23,6 min</b>. Vergeet de 0 niet mee te tellen!'},
        {html:'Temperaturen (°C): −3, 2, −1, 4, −2. x̄ = [[0]] °C', check:exact(0), sol:'−3 + 2 − 1 + 4 − 2 = 0, en 0 : 5 = <b>0 °C</b>.'},
        {html:'Verkochte wafels: 132, 96, 120, 108. x̄ = [[0]]', mode:'numeric', check:exact(114), sol:'456 : 4 = <b>114</b>.'}
      ], {letters:true}) },
    { title:'Gemiddelde uit een frequentietabel', lvl:2, instr:'25 leerlingen: hoeveel uur slaap had je vannacht? Elk gegeven komt meerdere keren voor: vermenigvuldig eerst.',
      build:list([
        {html: `<table class="ftab"><thead><tr><th>uren slaap</th><th>frequentie</th><th>uren · frequentie</th></tr></thead><tbody>
          <tr><td>7</td><td>3</td><td>[[0]]</td></tr><tr><td>8</td><td>9</td><td>[[1]]</td></tr><tr><td>9</td><td>10</td><td>[[2]]</td></tr><tr><td>10</td><td>3</td><td>[[3]]</td></tr>
          <tr><td><b>totaal</b></td><td><b>25</b></td><td>[[4]]</td></tr></tbody></table>`, block:true, size:'sm', mode:'numeric', check:nums([21,72,90,30,213]), sol:'7 · 3 = 21 · 8 · 9 = 72 · 9 · 10 = 90 · 10 · 3 = 30 · samen <b>213</b> uren.'},
        {html:'Het gemiddelde is x̄ = [[0]] uur', check:approx(8.52, 0.005), sol:'213 : 25 = <b>8,52 uur</b>. Deel door 25 (het aantal leerlingen), niet door 4!'}
      ], {letters:true}) },
    { title:'Het ontbrekende gegeven', lvl:3, instr:'Werk met de som: gemiddelde · aantal = som van alle gegevens.',
      build:list([
        {html:'Lisa haalde 12, 15, 14 en ... op vier toetsen. Haar gemiddelde is 14. Wat haalde ze op de vierde toets? [[0]]', mode:'numeric', check:exact(15), sol:'Som = 14 · 4 = 56. Al bekend: 12 + 15 + 14 = 41. Vierde toets: 56 − 41 = <b>15</b>.'},
        {html:'Een bakker verkocht gemiddeld 40 broden per dag van maandag tot zaterdag. Op zaterdag verkocht hij er 70, op de andere dagen samen ... [[0]]', mode:'numeric', check:exact(170), sol:'Som = 40 · 6 = 240. Zonder zaterdag: 240 − 70 = <b>170</b>.'},
        {html:'Het gemiddelde van 9 getallen is 6. Je voegt een tiende getal toe en het gemiddelde wordt 7. Welk getal voegde je toe? [[0]]', mode:'numeric', check:exact(16), sol:'Voor: 9 · 6 = 54. Na: 10 · 7 = 70. Het nieuwe getal: 70 − 54 = <b>16</b>.'},
        {html:'In een klas van 20 is de gemiddelde score 13. Eén leerling krijgt na een herverbetering 6 punten meer. Wat is het nieuwe gemiddelde? [[0]]', check:exact(13.3), sol:'De som stijgt met 6, dus het gemiddelde met 6 : 20 = 0,3. Nieuw gemiddelde: <b>13,3</b>.'}
      ], {letters:true}) }
  ]});

/* ============================================================
   ONDERDEEL 9 · DE MEDIAAN
   ============================================================ */
SECTIONS.push({ id:'med', ic:'med', nav:'De mediaan', title:'De mediaan: het middelste gegeven', cheat:CHEAT_MATEN,
  tip:'Orden altijd eerst van klein naar groot. De mediaan verdeelt de gegevens in twee even grote groepen.',
  cards:[
    { title:'Een oneven aantal', lvl:1, instr:'Hoeveel minuten wachtten 7 klanten aan de kassa?',
      build:(b,st,save,key)=>medianStrike(b,st,save,key,{vals:[6,2,9,4,12,3,5]}) },
    { title:'Een even aantal', lvl:1, instr:'Hoeveel sms\'jes stuurden 8 leerlingen gisteren?',
      build:(b,st,save,key)=>medianStrike(b,st,save,key,{vals:[14,3,22,8,11,5,17,9]}) },
    { title:'Zelf de mediaan bepalen', lvl:2, instr:'Orden eerst (op kladpapier).',
      build:list([
        {html:'15, 9, 21, 12, 18. Me = [[0]]', check:exact(15), sol:'Geordend: 9, 12, <b>15</b>, 18, 21.'},
        {html:'4, 10, 7, 1, 8, 3. Me = [[0]]', check:exact(5.5), sol:'Geordend: 1, 3, <b>4, 7</b>, 8, 10. (4 + 7) : 2 = <b>5,5</b>.'},
        {html:'−2, 5, 0, −4, 3, 1, −1. Me = [[0]]', check:exact(0), sol:'Geordend: −4, −2, −1, <b>0</b>, 1, 3, 5.'},
        {html:'1,2 · 0,8 · 1,5 · 0,9 · 1,1 · 2,0. Me = [[0]]', check:exact(1.15), sol:'Geordend: 0,8 · 0,9 · <b>1,1 · 1,2</b> · 1,5 · 2,0. (1,1 + 1,2) : 2 = <b>1,15</b>.'}
      ], {letters:true}) },
    { title:'De mediaan in een dotplot', lvl:2, instr:'25 leerlingen: hoeveel keer per week sport je? Bij 25 gegevens is het 13de gegeven het middelste: 12 links, 12 rechts.',
      build:combo(b=>{ const v=el('div','viz mid'); v.append(numPlot(expand([0,1,2,3,4,5],[3,5,4,6,5,2]),0,5,{xTitle:'Aantal keer sporten per week'}).svg); b.append(v); }, list([
        {html:'Het middelste gegeven is het hoeveelste? Het [[0]]de', mode:'numeric', check:exact(13), sol:'(25 + 1) : 2 = <b>13</b>.'},
        {html:'Tel van links: de mediaan is Me = [[0]]', mode:'numeric', check:exact(3), sol:'0: gegevens 1 tot 3 · 1: 4 tot 8 · 2: 9 tot 12 · 3: 13 tot 18. Het 13de gegeven is <b>3</b>.'}
      ], {letters:true})) },
    { title:'Mediaan uit een frequentietabel', lvl:2, instr:'20 jongeren gaven hun schoenmaat.',
      build:combo(html(ftabHTML(['schoenmaat','36','37','38','39','40','41','42'], [['aantal','2','3','5','4','3','2','1']])), list([
        {html:'Bij 20 gegevens zijn het [[0]]de en het [[1]]de gegeven de middelste.', size:'sm', mode:'numeric', check:nums([10,11]), sol:'Even aantal: het 10de en het 11de gegeven.'},
        {html:'De mediaan is Me = [[0]]', check:exact(38.5), sol:'36: 1–2 · 37: 3–5 · 38: 6–10 · 39: 11–14. Het 10de is 38, het 11de is 39: (38 + 39) : 2 = <b>38,5</b>.'}
      ], {letters:true})) },
    { title:'Wat verandert er?', lvl:3, build:choiceList([
        ['Reeks 3, 5, 6, 8, 9. Je vervangt 9 door 90. De mediaan verandert.', 'n', 'Het middelste gegeven blijft 6: de grootste waarde schuift enkel verder op.'],
        ['In dezelfde reeks vervang je 9 door 90. Het gemiddelde verandert.', 'w', 'De som stijgt met 81, dus het gemiddelde stijgt met 81 : 5 = 16,2.'],
        ['Bij een even aantal gegevens is de mediaan altijd een van de gegevens.', 'n', 'Het is het gemiddelde van de twee middelste; dat kan een getal zijn dat niet in de lijst staat (bv. 5,5).'],
        ['De helft van de gegevens is kleiner dan of gelijk aan de mediaan.', 'w', 'Dat is net de betekenis van de mediaan.']
      ], WN) }
  ]});

/* ============================================================
   ONDERDEEL 10 · DATA INTERPRETEREN
   ============================================================ */
SECTIONS.push({ id:'interp', ic:'interp', nav:'Data interpreteren', title:'Alle maten samen, en wat ze betekenen', cheat:CHEAT_MATEN,
  tip:'Een maat berekenen is één ding, zeggen wat ze betekent is het belangrijkste. Gebruik de woorden van de context: leerlingen, minuten, euro ...',
  cards:[
    { title:'De uitschieter', lvl:1, naast:false, instr:'Acht leerlingen: hoeveel minuten fietsen ze naar school? Sleep het oranje bolletje ver naar rechts (één leerling woont heel ver). Kijk wat er met de maten gebeurt.',
      build:combo(b=>outlierDemo(b, {vals:[5,8,8,10,12,12,12,15], lo:0, hi:60, step:5, xTitle:'Minuten fietsen', unit:'min'}), choiceList([
        ['Welke maat verandert het meest als één leerling heel ver woont?', 'g', 'Het gemiddelde verschuift mee met de uitschieter. De mediaan blijft bijna gelijk.'],
      ], [['g','het gemiddelde'],['m','de mediaan'],['o','de modus']]), choiceList([
        ['Welke centrummaat geeft dan het eerlijkste beeld van een "gewone" fietstijd?', 'm', 'De mediaan: ze trekt zich weinig aan van één extreme waarde.']
      ], [['g','het gemiddelde'],['m','de mediaan']])) },
    { title:'Welke maat past bij de zin?', lvl:2, instr:'Sleep het juiste woord in elke zin. Dataset: de lengte van 15 basketbalspelers.',
      build:(b,st,save,key)=>bankEx(b,st,save,key,[
        {expr:'De meeste spelers zijn 1,92 m.', pre:'→', ans:'modus', why:'Het meest voorkomende gegeven: de modus.'},
        {expr:'Als je alle lengtes eerlijk verdeelt, is elke speler 1,90 m.', pre:'→', ans:'gemiddelde', why:'Eerlijk verdelen: het gemiddelde.'},
        {expr:'7 spelers zijn hoogstens 1,89 m, 7 spelers zijn minstens 1,89 m.', pre:'→', ans:'mediaan', why:'Het midden van de geordende rij: de mediaan.'},
        {expr:'De grootste speler is 28 cm groter dan de kleinste.', pre:'→', ans:'variatiebreedte', why:'Maximum − minimum: de variatiebreedte.'}
      ], ['modus','gemiddelde','mediaan','variatiebreedte']) },
    { title:'Alles bepalen', lvl:2, instr:'Op een kamp noteerde de leiding hoeveel uur 20 jongeren sliepen.',
      build:combo(b=>{ const v=el('div','viz mid'); v.append(numPlot(expand([6,7,8,9,10],[2,5,7,4,2]),5,11,{xTitle:'Uren slaap'}).svg); b.append(v); }, list([
        {html:'Modus = [[0]] uur', mode:'numeric', check:exact(8), sol:'8 uur komt het vaakst voor (7 keer).'},
        {html:'Gemiddelde x̄ = [[0]] uur', check:exact(7.95), sol:'(2 · 6 + 5 · 7 + 7 · 8 + 4 · 9 + 2 · 10) : 20 = 159 : 20 = <b>7,95 uur</b>.'},
        {html:'Mediaan Me = [[0]] uur', check:exact(8), sol:'Het 10de en 11de gegeven zijn allebei 8: Me = <b>8</b>.'},
        {html:'Variatiebreedte = [[0]] uur', mode:'numeric', check:exact(4), sol:'10 − 6 = <b>4 uur</b>.'}
      ], {letters:true}), choiceList([
        ['Wat betekent de mediaan hier?', 'b', 'De ene helft sliep 8 uur of minder, de andere helft 8 uur of meer.']
      ], [['a','De meeste jongeren sliepen 8 uur.'],['b','De helft van de jongeren sliep hoogstens 8 uur, de andere helft minstens 8 uur.'],['c','Samen sliepen ze 8 uur.']])) },
    { title:'Fastfood', lvl:3, instr:'26 leerlingen: hoeveel dagen per week eet je fastfood? Eén leerling antwoordde 7.',
      build:combo(chartBox('kolom', {labels:['0','1','2','3','4','5','6','7'], series:[{values:[5,11,6,3,0,0,0,1]}], xTitle:'Aantal dagen fastfood per week', yTitle:'Aantal leerlingen', step:2, yMax:12}), list([
        {html:'Gemiddelde met alle 26 leerlingen: x̄ = [[0]] (rond af op 0,01)', check:approx(1.5, 0.006), sol:'(0 · 5 + 1 · 11 + 2 · 6 + 3 · 3 + 7 · 1) : 26 = 39 : 26 = <b>1,50</b>.'},
        {html:'Mediaan met alle 26 leerlingen: Me = [[0]]', check:exact(1), sol:'Het 13de en 14de gegeven zijn allebei 1: Me = <b>1</b>.'},
        {html:'Gemiddelde zonder de leerling met 7 dagen: x̄ = [[0]] (rond af op 0,01)', check:approx(1.28, 0.006), sol:'32 : 25 = <b>1,28</b>.'}
      ], {letters:true}), choiceList([
        ['Wat stel je vast als je die ene leerling weglaat?', 'a', 'Het gemiddelde daalt merkbaar, de mediaan blijft 1.']
      ], [['a','Het gemiddelde daalt, de mediaan blijft gelijk.'],['b','Beide dalen evenveel.'],['c','Er verandert niets.']])) }
  ]});
/* ============================================================
   CENTRUMMATEN EXTRA: NIEUWE OPGAVEN, TOON MIJ HOE, DENKOPDRACHTEN, RAAD MIJN GETALLEN
   ============================================================ */
(function(){
  const css = `
  .mx-how{ margin:.7rem 0 .2rem; }
  .mx-how-panel{ border:2px solid var(--or-line); border-left:6px solid var(--orange); border-radius:.8rem; background:var(--zone-bg); padding:.7rem .9rem; margin-top:.3rem; }
  .mx-stage{ overflow-x:auto; }
  .mx-stage:empty{ display:none; }
  .mx-steps{ list-style:none; padding:0; margin:.6rem 0 0; display:grid; gap:.4rem; }
  .mx-steps li{ display:flex; gap:.55rem; align-items:flex-start; line-height:1.5; }
  .mx-steps li.mx-in{ animation:m3fade .45s ease both; }
  .mx-steps .nr{ flex:none; width:1.6rem; height:1.6rem; border-radius:50%; background:var(--tq); color:var(--on-accent); font-weight:700; display:inline-flex; align-items:center; justify-content:center; font-size:.9rem; }
  .mx-steps b{ color:var(--accent-dark); }
  .mx-stage .ftab td{ transition:background .35s ease; min-width:3.2rem; white-space:nowrap; }
  .mx-stage .ftab th{ white-space:nowrap; }
  .mx-stage .ftab td.new{ background:var(--or-soft); }
  .mx-stage .ftab tr.on td{ background:var(--or-soft); font-weight:700; }
  .mx-strip{ display:flex; height:1.6rem; border:2px solid var(--tq); border-radius:.4rem; overflow:hidden; margin:.5rem 0 .2rem; max-width:620px; background:var(--card); }
  .mx-strip span{ display:block; width:0; transition:width .6s ease; font-size:.75rem; font-weight:700; color:#173436; text-align:center; line-height:1.45rem; overflow:hidden; white-space:nowrap; }
  .mx-sum{ font-size:1.1rem; margin:.35rem 0; min-height:1.5em; }
  .mx-goal{ display:flex; flex-wrap:wrap; gap:.4rem; margin:.3rem 0 .5rem; }
  .mx-goal .pill.ok{ background:var(--ok-bg); border-color:var(--ok); }
  .mx-clues{ display:flex; flex-wrap:wrap; gap:.45rem; margin:.4rem 0 .6rem; }
  .mx-clue{ border:2px solid var(--tq); border-radius:.7rem; padding:.35rem .7rem; background:var(--card); font-weight:700; }
  .mx-clue small{ display:block; font-weight:400; color:var(--ink-soft); }
  .mx-guess{ display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; margin:.4rem 0; }
  .mx-guess .inp{ width:3.6rem; }
  .mx-tries{ display:grid; gap:.3rem; margin:.5rem 0; }
  .mx-try{ display:flex; flex-wrap:wrap; gap:.4rem .9rem; align-items:center; padding:.3rem .5rem; border:1px solid var(--border); border-radius:.5rem; background:var(--card); }
  .mx-try .g{ font-weight:700; font-variant-numeric:tabular-nums; min-width:7.5rem; }
  .mx-try .ok{ color:var(--ok); font-weight:700; } .mx-try .no{ color:var(--bad); font-weight:700; }
  .mx-tbl{ border-collapse:collapse; margin:.4rem 0; font-variant-numeric:tabular-nums; }
  .mx-tbl th, .mx-tbl td{ border:1px solid var(--border); padding:.25rem .6rem; text-align:center; }
  .mx-tbl th{ background:var(--tq-soft); color:var(--accent-dark); }
  .mx-tbl td.up{ color:var(--ok); font-weight:700; } .mx-tbl td.dn{ color:var(--bad); font-weight:700; }
  .mx-lvl{ display:flex; gap:.4rem; flex-wrap:wrap; margin:.2rem 0 .5rem; }
  .mx-lvl .opt.chosen{ border-color:var(--orange); background:var(--or-soft); }
  .ch .mx-dot{ fill:var(--tq); stroke:var(--card); stroke-width:1.5; cursor:grab; }
  .ch .mx-dot.or{ fill:var(--orange); }
  .ch .mx-dot:focus{ outline:none; stroke:var(--ink); stroke-width:3; }
  @media (prefers-reduced-motion: reduce){ .mx-steps li.mx-in{ animation:none; } .mx-strip span, .mx-stage .ftab td{ transition:none; } }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

const MXFAST = () => { try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
const MXn = x => x<0 ? '('+nf(x)+')' : nf(x);           /* negatief getal tussen haakjes in een som */
const MXlist = a => a.map(x=>nf(x)).join(', ');
const MXr2 = x => Math.round(x*100)/100;

/* ============================================================
   TOON MIJ HOE: korte stap-voor-stap animatie met de getallen van de oefening
   MXshowHow(parent, soort, data)
     soort 'gem'      data {vals}                     gemiddelde van een lijst
           'mediaan'  data {vals}                     ordenen en wegstrepen
           'gemTabel' data {head, vals, freq}         gemiddelde uit een frequentietabel
           'medTabel' data {head, vals, freq}         mediaan uit een frequentietabel
           'percent'  data {head, cats, freq}         percentages uit een frequentietabel
   ============================================================ */
function MXshowHow(parent, soort, data){
  if(QZ || !MXHOW[soort]) return null;
  const wrap = el('div','mx-how');
  const bar = el('div','viz-bar');
  const go = el('button','btn ghost','▶ Toon mij hoe'); go.type='button';
  const again = el('button','linkbtn','↺ Nog eens'); again.type='button'; again.hidden = true;
  bar.append(go, again);
  const panel = el('div','mx-how-panel'); panel.hidden = true;
  wrap.append(bar, panel); parent.append(wrap);
  let run = 0;
  async function play(){
    const my = ++run, fast = MXFAST();
    panel.innerHTML = ''; panel.hidden = false;
    const stage = el('div','mx-stage'), ol = el('ol','mx-steps'); panel.append(stage, ol);
    const c = { stage, fast, alive:()=>my===run, wait: ms => fast ? Promise.resolve() : sleep(ms) };
    const steps = MXHOW[soort](data);
    for(let i=0;i<steps.length;i++){
      if(!c.alive()) return;
      ol.append(el('li', fast?'':'mx-in', `<span class="nr">${i+1}</span><div>${steps[i].t}</div>`));
      if(steps[i].go) await steps[i].go(c);
      if(!c.alive()) return;
      if(i<steps.length-1) await c.wait(steps[i].pause ?? 1000);
    }
  }
  go.addEventListener('click', ()=>{
    if(panel.hidden){ go.textContent = '✕ Verberg'; again.hidden = false; play(); }
    else { run++; panel.hidden = true; panel.innerHTML = ''; go.textContent = '▶ Toon mij hoe'; again.hidden = true; }
  });
  again.addEventListener('click', play);
  return wrap;
}
/* vakjes in een rij ordenen met een schuif-animatie (FLIP); geeft de vakjes in de nieuwe volgorde */
async function MXflip(row, boxes, vals, fast){
  const order = vals.map((x,i)=>i).sort((a,c)=>vals[a]-vals[c] || a-c);
  const first = boxes.map(k=>k.getBoundingClientRect());
  order.forEach(i=>row.append(boxes[i]));
  if(!fast){
    boxes.forEach((k,i)=>{ const r1 = k.getBoundingClientRect(); k.style.transition='none'; k.style.transform=`translate(${first[i].left-r1.left}px,${first[i].top-r1.top}px)`; });
    await new Promise(r=>requestAnimationFrame(r)); await new Promise(r=>requestAnimationFrame(r));
    boxes.forEach(k=>{ k.style.transition='transform .8s ease'; k.style.transform=''; });
    await sleep(850);
  }
  boxes.forEach(k=>{ k.style.transition=''; });
  return order.map(i=>boxes[i]);
}
/* tabel voor de animaties: kolommen head, rijen rows (arrays), geeft de td's per rij terug */
function MXtable(stage, head, rows){
  const t = el('table','ftab'); t.innerHTML = `<thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
  const tb = el('tbody'); t.append(tb);
  const tds = rows.map(r=>{ const tr = el('tr'); tb.append(tr); return r.map((c,i)=>{ const td = el('td', i===0?'l':'', c); tr.append(td); return td; }); });
  stage.append(t); return tds;
}
async function MXfill(td, html, c, ms=450){ td.innerHTML = html; td.classList.add('new'); await c.wait(ms); }

const MXHOW = {
  gem: d => {
    const v = d.vals, n = v.length, S = sum(v), m = S/n, ex = MXr2(m)===Math.round(m*1e6)/1e6;
    let boxes = [], out;
    return [
      { t:`Schrijf de ${n} gegevens op.`, go:c=>{ const row = el('div','data-row'); c.stage.append(row); boxes = v.map(x=>{ const k = el('span','dv', nf(x)); row.append(k); return k; }); out = el('div','mx-sum'); c.stage.append(out); } },
      { t:'Tel ze allemaal op.', go:async c=>{ let s = 0; for(let i=0;i<n;i++){ s += v[i]; boxes[i].classList.add('hi'); out.innerHTML = `som = <b>${nf(s)}</b>`; await c.wait(380); } out.innerHTML = `${v.map(MXn).join(' + ')} = <b>${nf(S)}</b>`; } },
      { t:`Tel hoeveel gegevens er zijn: <b>${n}</b>.` },
      { t:`Deel de som door het aantal: ${nf(S)} : ${n} = ${ex ? `<b>${nf(m)}</b>` : `${nf(m,4)}… ≈ <b>${nf(m,1)}</b> (afgerond op 0,1)`}. Dat is het gemiddelde x̄.`,
        go:c=>{ c.stage.append(el('div','mx-sum', `x̄ = ${nf(S)} : ${n} = <b>${ex?nf(m):'≈ '+nf(m,1)}</b>`)); } }
    ];
  },
  mediaan: d => {
    const v = d.vals, n = v.length, s = sorted(v), me = median(v);
    let row, boxes, ord;
    return [
      { t:`Schrijf de ${n} gegevens op.`, go:c=>{ row = el('div','data-row'); c.stage.append(row); boxes = v.map(x=>{ const k = el('span','dv', nf(x)); row.append(k); return k; }); } },
      { t:'Orden ze van klein naar groot.', go:async c=>{ ord = await MXflip(row, boxes, v, c.fast); } },
      { t:`Streep telkens het kleinste én het grootste getal weg, tot er ${n%2?'één getal overblijft':'twee getallen overblijven'}.`,
        go:async c=>{ for(let i=0;i<Math.floor((n-1)/2);i++){ ord[i].classList.add('gone'); ord[n-1-i].classList.add('gone'); await c.wait(500); } } },
      { t: n%2 ? `Het getal in het midden is de mediaan: <b>Me = ${nf(me)}</b>.` : `De mediaan ligt midden tussen ${nf(s[n/2-1])} en ${nf(s[n/2])}: (${nf(s[n/2-1])} + ${nf(s[n/2])}) : 2 = <b>${nf(me)}</b>.`,
        go:c=>{ (n%2 ? [ord[(n-1)/2]] : [ord[n/2-1], ord[n/2]]).forEach(k=>k.classList.add('mid')); } }
    ];
  },
  gemTabel: d => {
    const P = d.vals.map((x,i)=>x*d.freq[i]), S = sum(P), n = sum(d.freq), m = S/n, ex = Math.abs(MXr2(m)-m)<1e-9;
    let tds;
    return [
      { t:'Elk gegeven komt meerdere keren voor. Vermenigvuldig elk gegeven met zijn frequentie.',
        go:async c=>{ tds = MXtable(c.stage, [d.head, 'frequentie', d.head+' · frequentie'], [...d.vals.map((x,i)=>[nf(x), String(d.freq[i]), '']), ['<b>totaal</b>', '', '']]);
          for(let i=0;i<d.vals.length;i++) await MXfill(tds[i][2], `${MXn(d.vals[i])} · ${d.freq[i]} = <b>${nf(P[i])}</b>`, c); } },
      { t:`Tel de producten op: ${P.map(MXn).join(' + ')} = <b>${nf(S)}</b>. Dat is de som van alle gegevens.`, go:c=>MXfill(tds[d.vals.length][2], `<b>${nf(S)}</b>`, c, 0) },
      { t:`Tel de frequenties op. Zo weet je hoeveel gegevens er zijn: <b>${n}</b>.`, go:c=>MXfill(tds[d.vals.length][1], `<b>${n}</b>`, c, 0) },
      { t:`Deel de som door het aantal gegevens (niet door het aantal rijen!): ${nf(S)} : ${n} = ${ex ? `<b>${nf(m)}</b>` : `${nf(m,4)}… ≈ <b>${nf(m,2)}</b>`}.` }
    ];
  },
  medTabel: d => {
    const n = sum(d.freq), odd = n%2===1, k1 = odd ? (n+1)/2 : n/2, k2 = odd ? k1 : n/2+1;
    const all = expand(d.vals, d.freq), me = median(all);
    let tds, rows = [];
    let a = 1; d.freq.forEach((f,i)=>{ rows.push([a, a+f-1]); a += f; });
    const hit = k => rows.findIndex(([p,q])=>k>=p && k<=q);
    return [
      { t:`Tel de frequenties op: er zijn <b>${n}</b> gegevens.`, go:c=>{ tds = MXtable(c.stage, [d.head, 'frequentie', 'welke gegevens?'], d.vals.map((x,i)=>[nf(x), String(d.freq[i]), ''])); } },
      { t: odd ? `${n} is oneven. Het middelste gegeven is het (${n} + 1) : 2 = <b>${k1}de</b> gegeven.` : `${n} is even. De twee middelste gegevens zijn het <b>${k1}de</b> en het <b>${k2}de</b>.` },
      { t:'De tabel is al geordend. Tel af: welke gegevens staan in elke rij?',
        go:async c=>{ for(let i=0;i<rows.length;i++){ const [p,q] = rows[i]; await MXfill(tds[i][2], p===q ? `het ${p}de` : `${p}de tot ${q}de`, c, 500); if(i>=hit(k2)) break; }
          [hit(k1), hit(k2)].forEach(i=>tds[i][0].parentElement.classList.add('on')); } },
      { t: odd ? `Het ${k1}de gegeven is <b>${nf(me)}</b>: Me = <b>${nf(me)}</b>.` :
          (all[k1-1]===all[k2-1] ? `Het ${k1}de en het ${k2}de gegeven zijn allebei ${nf(all[k1-1])}: Me = <b>${nf(me)}</b>.` : `Het ${k1}de gegeven is ${nf(all[k1-1])}, het ${k2}de is ${nf(all[k2-1])}: Me = (${nf(all[k1-1])} + ${nf(all[k2-1])}) : 2 = <b>${nf(me)}</b>.`) }
    ];
  },
  percent: d => {
    const T = sum(d.freq);
    let tds, segs;
    return [
      { t:`Tel alle antwoorden op: ${d.freq.join(' + ')} = <b>${T}</b>. Dat is het totaal.`,
        go:c=>{ tds = MXtable(c.stage, [d.head, 'aantal', 'deel van het totaal', 'percentage'], [...d.cats.map((x,i)=>[x, String(d.freq[i]), '', '']), ['<b>totaal</b>', `<b>${T}</b>`, '', '']]);
          const strip = el('div','mx-strip'); segs = d.cats.map((x,i)=>{ const s = el('span'); const col = PAL[i%PAL.length]; s.style.background = col; if(DARKPAL.has(col)) s.style.color = '#fff'; strip.append(s); return s; }); c.stage.append(strip); } },
      { t:`Deel elk aantal door het totaal ${T}.`, go:async c=>{ for(let i=0;i<d.cats.length;i++) await MXfill(tds[i][2], `${d.freq[i]} : ${T} = ${nf(d.freq[i]/T,4)}`, c); } },
      { t:'Vermenigvuldig met 100: dan heb je het percentage.',
        go:async c=>{ for(let i=0;i<d.cats.length;i++){ const p = d.freq[i]/T*100; await MXfill(tds[i][3], `<b>${nf(p,1)} %</b>`, c, 0); segs[i].style.width = p+'%'; segs[i].textContent = p>=8 ? nf(p,1)+' %' : ''; await c.wait(500); } } },
      { t:'Controle: samen is dat <b>100 %</b>. De hele strook is vol.', go:c=>MXfill(tds[d.cats.length][3], '<b>100 %</b>', c, 0) }
    ];
  }
};

/* ============================================================
   GENERATOREN
   ============================================================ */
/* n gehele getallen met één duidelijke modus */
function MXmodeList(r, n, lo, hi){
  for(let t=0;t<500;t++){
    const v = []; for(let i=0;i<n;i++) v.push(rInt(r, lo, hi));
    const m = rInt(r, lo, hi); for(let k=0;k<3;k++) v[rInt(r,0,n-1)] = m;
    const md = modes(v); if(md.length===1 && countOf(v, md[0])>=3 && range(v)>=3) return v;
  }
  return [3,5,5,7,5,2,8,6,4].slice(0,n);
}
/* n gehele getallen met een geheel gemiddelde */
function MXintMean(r, n, lo, hi){
  for(let t=0;t<500;t++){
    const v = []; for(let i=0;i<n-1;i++) v.push(rInt(r, lo, hi));
    const s = sum(v); const m = rInt(r, Math.ceil((s+lo)/n), Math.floor((s+hi)/n));
    const last = m*n - s; if(last>=lo && last<=hi){ v.splice(rInt(r,0,n-1), 0, last); return v; }
  }
  return [4,6,8,5,7].slice(0,n);
}
const MXCTX = [
  { t:'Punten op een toets (op 10)', lo:2, hi:10, u:'' },
  { t:'Minuten wachten aan de bushalte', lo:1, hi:15, u:' min' },
  { t:'Aantal boeken gelezen dit jaar', lo:0, hi:12, u:'' },
  { t:'Temperatuur om 7 uur ’s morgens', lo:-5, hi:8, u:' °C' },
  { t:'Aantal berichtjes gisteren', lo:2, hi:30, u:'' }
];
const MXTCTX = [
  { t:'Hoeveel huisdieren heb je?', head:'aantal huisdieren', vals:[0,1,2,3,4] },
  { t:'Hoeveel broers en zussen heb je?', head:'broers en zussen', vals:[0,1,2,3,4] },
  { t:'Score op een quiz (op 5)', head:'score', vals:[1,2,3,4,5] },
  { t:'Welke schoenmaat heb je?', head:'schoenmaat', vals:[36,37,38,39,40,41] },
  { t:'Hoeveel keer per week sport je?', head:'keer sporten', vals:[0,1,2,3,4,5] }
];
const MXPCTX = [
  { t:'Wat is je favoriete sport?', head:'sport', cats:['voetbal','basket','zwemmen','dans'] },
  { t:'Welk huisdier heb je?', head:'huisdier', cats:['hond','kat','vis','geen'] },
  { t:'Hoe kom je naar school?', head:'vervoer', cats:['fiets','te voet','bus','auto'] },
  { t:'Wat drink je bij het ontbijt?', head:'drank', cats:['melk','sap','water','thee'] }
];
function MXtab(r){ const c = rPick(r, MXTCTX); for(let t=0;t<200;t++){ const f = c.vals.map(()=>rInt(r,1,8)); const n = sum(f); if(n>=15 && n<=30) return { t:c.t, head:c.head, vals:c.vals, freq:f }; } return { t:c.t, head:c.head, vals:c.vals, freq:c.vals.map(()=>4) }; }

/* modus */
const MXgenDot = r => { const v = MXmodeList(r, rInt(r,15,20), 0, 6); const m = modes(v)[0];
  return { vals:v, lo:0, hi:6, xTitle:'Aantal keer naar de film dit jaar', ask:'Klik op de kolom van de <b>modus</b>.', ans:[m], why:`${m} komt het meest voor (${countOf(v,m)} keer): de hoogste stapel.`, hint:'De modus is het gegeven dat het vaakst voorkomt: zoek de hoogste stapel.' }; };
const MXgenModus = r => [0,1].map(k=>{ const c = k ? rPick(r, [MXCTX[3], MXCTX[0]]) : rPick(r, [MXCTX[1], MXCTX[2], MXCTX[4]]); const v = MXmodeList(r, rInt(r,8,11), c.lo, c.hi); return { c, v, m:modes(v)[0], vb:range(v) }; });
/* gemiddelde */
const MXgenGem1 = r => { const c = rPick(r, MXCTX.filter(x=>x.lo>=0)); return { c, v:MXintMean(r, 5, c.lo, c.hi) }; };
const MXgenGem2 = r => { for(let t=0;t<200;t++){ const c = rPick(r, MXCTX); const n = rInt(r,6,7); const v = []; for(let i=0;i<n;i++) v.push(rInt(r, c.lo, c.hi)); const m = mean(v); if(Math.abs(m*10-Math.round(m*10))>1e-9 && Math.abs(Math.abs(m*100%10)-5)>1e-6) return { c, v }; } return { c:MXCTX[0], v:[7,8,5,9,6,10] }; };
/* mediaan */
const MXgenMed = even => r => { const c = rPick(r, MXCTX); const n = even ? rPick(r,[6,8,10]) : rPick(r,[7,9]); const v = []; const used = new Set();
  while(v.length<n){ const x = rInt(r, c.lo, c.hi); if(used.has(x) && r()<.7) continue; used.add(x); v.push(x); } return { c, v }; };
/* percentages */
const MXgenPct = r => { const c = rPick(r, MXPCTX); const T = rPick(r, [20,25,40,50]);
  let f; do{ const cuts = [rInt(r,1,T-1), rInt(r,1,T-1), rInt(r,1,T-1)].sort((a,b)=>a-b); f = [cuts[0], cuts[1]-cuts[0], cuts[2]-cuts[1], T-cuts[2]]; }while(f.some(x=>x<1));
  return { t:c.t, head:c.head, cats:c.cats, freq:f }; };

/* ============================================================
   RENDERS VOOR DE NIEUWE OPGAVEN
   ============================================================ */
function MXmodusEx(b, st, save, key, d){
  list(d.map(({c,v,m,vb})=>({ html:`${c.t}: ${MXlist(v)}.<br>Modus = [[0]]${c.u} · variatiebreedte = [[1]]${c.u}`, size:'sm', check:nums([m, vb], 1e-9, 'Modus: tel hoe vaak elk getal voorkomt. Variatiebreedte: grootste − kleinste.'),
    sol:`${nf(m)} komt ${countOf(v,m)} keer voor: modus <b>${nf(m)}${c.u}</b>. Grootste ${nf(Math.max(...v))}, kleinste ${nf(Math.min(...v))}: ${nf(Math.max(...v))} − ${MXn(Math.min(...v))} = <b>${nf(vb)}${c.u}</b>.` })), {letters:true})(b, st, save, key);
}
function MXgemEx(b, st, save, key, d, round){
  const m = mean(d.v), S = sum(d.v), n = d.v.length;
  list([{ html:`${d.c.t}: ${MXlist(d.v)}.<br>Het gemiddelde is x̄ = [[0]]${d.c.u}${round?' (rond af op 0,1)':''}`,
    check: round ? approx(Math.round(m*10)/10, 0.0001, 'Tel alles op, deel door het aantal gegevens en rond af op 0,1.') : exact(m, 'Tel alles op en deel door het aantal gegevens.'),
    sol:`(${d.v.map(MXn).join(' + ')}) : ${n} = ${nf(S)} : ${n} = ${round ? `${nf(m,4)}… ≈ <b>${nf(m,1)}${d.c.u}</b>` : `<b>${nf(m)}${d.c.u}</b>`}.` }])(b, st, save, key);
  MXshowHow(b, 'gem', {vals:d.v});
}
function MXgemTabEx(b, st, save, key, d){
  const P = d.vals.map((x,i)=>x*d.freq[i]), S = sum(P), n = sum(d.freq), m = S/n;
  b.append(el('p','', `${n} leerlingen antwoordden op de vraag: <i>${d.t}</i>`));
  list([
    { html:`<table class="ftab"><thead><tr><th>${d.head}</th><th>frequentie</th><th>${d.head} · frequentie</th></tr></thead><tbody>
      ${d.vals.map((x,i)=>`<tr><td>${x}</td><td>${d.freq[i]}</td><td>[[${i}]]</td></tr>`).join('')}
      <tr><td><b>totaal</b></td><td><b>${n}</b></td><td>[[${d.vals.length}]]</td></tr></tbody></table>`, block:true, size:'sm', mode:'numeric',
      check:nums([...P, S], 1e-9, 'Vermenigvuldig in elke rij het gegeven met de frequentie. Tel dan de producten op.'), sol:`${d.vals.map((x,i)=>`${x} · ${d.freq[i]} = ${P[i]}`).join(' · ')} · samen <b>${S}</b>.` },
    { html:'Het gemiddelde is x̄ = [[0]] (rond af op 0,01)', check:approx(MXr2(m), 0.0001, `Deel de som door ${n}, het aantal leerlingen.`), sol:`${S} : ${n} = ${Math.abs(MXr2(m)-m)<1e-9 ? `<b>${nf(m)}</b>` : `${nf(m,4)}… ≈ <b>${nf(m,2)}</b>`}. Deel door ${n} (het aantal leerlingen), niet door ${d.vals.length} (het aantal rijen)!` }
  ], {letters:true})(b, st, save, key);
  MXshowHow(b, 'gemTabel', d);
}
function MXmedEx(b, st, save, key, d){
  const v = d.v, n = v.length, s = sorted(v), me = median(v);
  list([{ html:`${d.c.t}: ${MXlist(v)}.<br>De mediaan is Me = [[0]]${d.c.u}`, check:exact(me, n%2 ? 'Orden eerst. Het middelste getal is de mediaan.' : 'Orden eerst. Neem het gemiddelde van de twee middelste getallen.'),
    sol:`Geordend: ${MXlist(s)}. ${n%2 ? `Het ${(n+1)/2}de getal is het middelste: <b>${nf(me)}</b>.` : `De middelste zijn ${nf(s[n/2-1])} en ${nf(s[n/2])}: (${nf(s[n/2-1])} + ${MXn(s[n/2])}) : 2 = <b>${nf(me)}</b>.`}` }])(b, st, save, key);
  MXshowHow(b, 'mediaan', {vals:v});
}
function MXmedTabEx(b, st, save, key, d){
  const n = sum(d.freq), me = median(expand(d.vals, d.freq));
  b.append(el('p','', `Een klas antwoordde op de vraag: <i>${d.t}</i>`));
  b.append(el('div','', ftabHTML([d.head, ...d.vals.map(String)], [['frequentie', ...d.freq.map(String)]])));
  list([
    { html:'Hoeveel gegevens zijn er? n = [[0]]', mode:'numeric', check:exact(n, 'Tel alle frequenties op.'), sol:`${d.freq.join(' + ')} = <b>${n}</b>.` },
    { html:'De mediaan is Me = [[0]]', check:exact(me, n%2 ? `Zoek het ${(n+1)/2}de gegeven.` : `Zoek het ${n/2}de en het ${n/2+1}de gegeven.`), sol:`${n%2 ? `Het ${(n+1)/2}de gegeven` : `Het gemiddelde van het ${n/2}de en het ${n/2+1}de gegeven`}: Me = <b>${nf(me)}</b>. Bekijk "Toon mij hoe".` }
  ], {letters:true})(b, st, save, key);
  MXshowHow(b, 'medTabel', d);
}
function MXpctEx(b, st, save, key, d){
  const T = sum(d.freq), p = d.freq.map(f=>f/T*100);
  b.append(el('p','', `${T} leerlingen antwoordden op de vraag: <i>${d.t}</i> Bereken voor elk antwoord het percentage.`));
  const [L, R] = pctNaast(b); pctHulp(R, d.cats, d.freq, T); MXshowHow(R, 'percent', d); b = L;
  list([{ html:`<table class="ftab"><thead><tr><th>${d.head}</th><th>aantal</th><th>percentage</th></tr></thead><tbody>
      ${d.cats.map((x,i)=>`<tr><td class="l">${x}</td><td>${d.freq[i]}</td><td>[[${i}]] %</td></tr>`).join('')}
      <tr><td class="l"><b>totaal</b></td><td><b>${T}</b></td><td><b>100 %</b></td></tr></tbody></table>`, block:true, size:'sm',
    check:nums(p, 0.0001, `Deel elk aantal door het totaal ${T} en vermenigvuldig met 100.`), sol:d.cats.map((x,i)=>`${x}: ${d.freq[i]} : ${T} · 100 = <b>${nf(p[i],1)} %</b>`).join('<br>') }])(b, st, save, key);
}

/* ============================================================
   DENKOPDRACHT: MAAK ZELF EEN RIJ (sleep de bolletjes)
   ============================================================ */
function MXline(lo, hi, H, o={}){
  const W = 600, L = 30, pw = W-60, base = o.base || 110, lab = o.lab || 1, R = o.r || 11;
  const svg = newSvg(W, H||190); const X = v => L + pw*(v-lo)/(hi-lo);
  svgEl('line',{x1:L-12, y1:base, x2:L+pw+12, y2:base, class:'ax'}, svg);
  for(let v=lo; v<=hi; v++){ const big = (v-lo)%lab===0; svgEl('line',{x1:X(v), y1:base, x2:X(v), y2:base+(big?6:3), class:'ax'}, svg); if(big) svgText(svg, X(v), base+21, nf(v), {'text-anchor':'middle'}); }
  if(o.xTitle) svgText(svg, W/2, 16, o.xTitle, {'text-anchor':'middle', class:'t-soft'});
  const g = svgEl('g', {}, svg), mk = svgEl('g', {}, svg);
  const P = { svg, X, base, L, pw, W, g, mk, lo, hi };
  P.valAt = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return Math.max(lo, Math.min(hi, Math.round(lo + (p.x-L)/pw*(hi-lo)))); };
  /* bolletjes tekenen; items [{v, cls, i}] stapelen bij gelijke waarden */
  P.dots = items => { g.innerHTML = ''; const c = {}; const r = R;
    items.forEach(it=>{ c[it.v] = (c[it.v]||0)+1; const k = c[it.v]-1;
      const d = svgEl('circle',{cx:X(it.v), cy:base-r-2-k*r*2.15, r, class:'mx-dot '+(it.cls||''), tabindex: it.i!=null ? '0' : '-1'}, g);
      if(it.i!=null){ d.dataset.i = it.i; d.setAttribute('aria-label', 'bolletje '+(it.i+1)+': '+it.v); } }); };
  P.marks = list => { mk.innerHTML = ''; let prev = null;
    list.forEach(([v, txt, cls])=>{ const x = X(v); const off = prev!=null && Math.abs(prev-x)<70 ? 26 : 0; prev = x;
      svgEl('path',{d:`M${x},${base+28} l-8,12 h16 z`, fill: cls==='or'?'var(--orange)':'var(--accent-dark)'}, mk);
      svgText(mk, x, base+56+off, txt, {'text-anchor':'middle', class: cls==='or'?'t-or':'t-acc'}); }); };
  return P;
}
function MXbuildRow(b, st, save, key, d){
  const lo = 0, hi = 15, n = 5;
  if(!st.v) st.v = [1,4,7,10,13];
  const goals = [['x̄', d.mean, a=>Math.abs(mean(a)-d.mean)<1e-9], ['Me', d.med, a=>median(a)===d.med]];
  if(d.mode!=null) goals.push(['modus', d.mode, a=>{ const m = modes(a); return m.length===1 && m[0]===d.mode && countOf(a, m[0])>1; }]);
  b.append(el('div','readout bigq', `Sleep de ${n} bolletjes zodat ${goals.map(([k,v])=>`<b>${k} = ${nf(v)}</b>`).join(' en ')}.`));
  const goalBox = el('div','mx-goal'); b.append(goalBox);
  const P = MXline(lo, hi, 230); const v = el('div','viz mid'); v.append(P.svg); b.append(v);
  const row = el('div','data-row'); b.append(row);
  b.append(el('div','sub','Sleep een bolletje, of klik erop en gebruik de pijltjestoetsen. Bolletjes mogen op elkaar liggen.'));
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn); const fb = el('div','fb'); b.append(act, fb);
  const quiz = QZ; const qid = QID('rij'); if(!quiz) CLvraag(qid); else act.hidden = true;
  const okAll = () => goals.every(g=>g[2](st.v));
  function paint(focusI){
    const a = st.v, m = mean(a), me = median(a);
    P.dots(a.map((x,i)=>({v:x, i, cls: i===focusI?'or':''})));
    P.marks([[m, 'x̄ = '+nf(m,2), 'or'], [me, 'Me = '+nf(me,2)]].sort((p,q)=>p[0]-q[0]));
    const md = modes(a), mdTxt = md.length===1 && countOf(a, md[0])>1 ? nf(md[0]) : 'geen';
    const now = { 'x̄':nf(m,2), 'Me':nf(me,2), 'modus':mdTxt };
    goalBox.innerHTML = goals.map(([k,val,f])=>`<span class="pill${f(a)?' ok':''}">${k} nu ${now[k]} · doel ${nf(val)}${f(a)?' ✓':''}</span>`).join('');
    row.innerHTML = sorted(a).map(x=>`<span class="dv">${nf(x)}</span>`).join('');
    if(focusI!=null){ const c = P.g.querySelector(`[data-i="${focusI}"]`); if(c) c.focus({preventScroll:true}); }
  }
  let drag = null;
  P.svg.addEventListener('pointerdown', e=>{ if(v.dataset.locked) return; const c = e.target.closest('[data-i]'); if(!c) return; drag = +c.dataset.i; try{ P.svg.setPointerCapture(e.pointerId); }catch(_){} e.preventDefault(); paint(drag); });
  P.svg.addEventListener('pointermove', e=>{ if(drag==null) return; const x = P.valAt(e); if(x!==st.v[drag]){ st.v[drag] = x; save(); paint(drag); } });
  const end = ()=>{ if(drag!=null){ drag = null; fb.textContent=''; fb.className='fb'; } };
  P.svg.addEventListener('pointerup', end); P.svg.addEventListener('pointercancel', end);
  P.svg.addEventListener('keydown', e=>{ if(v.dataset.locked) return; const c = e.target.closest('[data-i]'); if(!c) return; const i = +c.dataset.i;
    const dx = e.key==='ArrowRight'||e.key==='ArrowUp' ? 1 : e.key==='ArrowLeft'||e.key==='ArrowDown' ? -1 : 0; if(!dx) return; e.preventDefault();
    st.v[i] = Math.max(lo, Math.min(hi, st.v[i]+dx)); save(); paint(i); });
  btn.addEventListener('click', ()=>{ const ok = okAll(); fb.className = 'fb '+(ok?'ok':'bad');
    const a = st.v, S = sum(a);
    fb.innerHTML = ok ? `✅ Juist! ${MXlist(sorted(a))}: som ${S}, dus x̄ = ${S} : 5 = ${nf(mean(a))}; het middelste getal is ${nf(median(a))}.`
      : `❌ Nog niet. ${Math.abs(mean(a)-d.mean)>1e-9 ? `Voor x̄ = ${nf(d.mean)} moet de som ${nf(d.mean*5)} zijn (nu ${S}). ` : ''}${median(a)!==d.med ? `Het middelste bolletje moet op ${nf(d.med)} liggen. ` : ''}${d.mode!=null && !goals[2][2](a) ? `${nf(d.mode)} moet het vaakst voorkomen (minstens 2 keer).` : ''}`;
    CLres(qid, ok); });
  paint(null);
  if(quiz) quiz.push({ grade:okAll, reveal:()=>{}, lock:()=>{ v.dataset.locked='1'; } });
}
const MXgenRow = withMode => r => {
  for(let t=0;t<2000;t++){
    const a = sorted([0,1,2,3,4].map(()=>rInt(r,0,15))); const m = mean(a), me = median(a);
    if(m%1 || Math.abs(m-me)<1) continue;
    if(withMode){ const md = modes(a); if(md.length!==1 || countOf(a, md[0])<2 || md[0]===me) continue; return { mean:m, med:me, mode:md[0] }; }
    return { mean:m, med:me };
  }
  return withMode ? { mean:6, med:4, mode:3 } : { mean:6, med:4 };
};

/* ============================================================
   DENKOPDRACHT: ÉÉN GETAL ERBIJ
   ============================================================ */
function MXaddOne(b, st, save, key, d){
  const v = d.v, n = v.length, m = mean(v), S = sum(v), ans = (n+1)*(m+1) - S;
  b.append(el('div','readout bigq', `Lotte haalde op ${n} toetsen: <b>${MXlist(v)}</b> (op 20). Welke score moet ze op de volgende toets halen, zodat haar gemiddelde <b>1 punt hoger</b> wordt?`));
  const P = MXline(0, 20, 230); const viz = el('div','viz mid'); viz.append(P.svg); b.append(viz);
  const out = el('div','readout'); b.append(out);
  b.append(el('div','sub','Proberen mag: sleep het oranje bolletje (de nieuwe toets) en kijk wat het gemiddelde doet.'));
  function paint(){
    const items = v.map(x=>({v:x})); if(st.x!=null) items.push({v:st.x, i:0, cls:'or'});
    P.dots(items);
    const all = st.x!=null ? [...v, st.x] : v, mm = mean(all);
    P.marks([[mm, 'x̄ = '+nf(mm,2), 'or']]);
    out.innerHTML = st.x==null ? `Nu: x̄ = <b>${nf(m,2)}</b>. Klik of sleep op de getallenas om de nieuwe toets te plaatsen.` : `Met een ${st.x} erbij: x̄ = <b>${nf(mm,2)}</b> ${Math.abs(mm-(m+1))<1e-9 ? '✓ precies 1 hoger!' : mm>m+1 ? '(meer dan 1 hoger)' : '(nog niet 1 hoger)'}`;
  }
  let drag = false;
  if(!QZ){
    P.svg.addEventListener('pointerdown', e=>{ drag = true; try{ P.svg.setPointerCapture(e.pointerId); }catch(_){} st.x = P.valAt(e); save(); paint(); });
    P.svg.addEventListener('pointermove', e=>{ if(!drag) return; const x = P.valAt(e); if(x!==st.x){ st.x = x; save(); paint(); } });
    P.svg.addEventListener('pointerup', ()=>drag=false); P.svg.addEventListener('pointercancel', ()=>drag=false);
    P.svg.tabIndex = 0; P.svg.setAttribute('aria-label','getallenas: pijltjestoetsen verplaatsen de nieuwe toets');
    P.svg.addEventListener('keydown', e=>{ const dx = e.key==='ArrowRight' ? 1 : e.key==='ArrowLeft' ? -1 : 0; if(!dx) return; e.preventDefault(); st.x = Math.max(0, Math.min(20, (st.x ?? 10)+dx)); save(); paint(); });
  }
  paint();
  list([
    { html:'Het gemiddelde van de eerste toetsen is x̄ = [[0]]', mode:'numeric', check:exact(m), sol:`${S} : ${n} = <b>${nf(m)}</b>.` },
    { html:`Welke score moet ze halen zodat haar gemiddelde ${nf(m+1)} wordt? [[0]]`, mode:'numeric', check:exact(ans, 'Werk met de som: hoeveel moeten alle toetsen samen zijn?'),
      sol:`Nu is de som ${nf(m)} · ${n} = ${S}. Straks ${n+1} toetsen met gemiddelde ${nf(m+1)}: som ${n+1} · ${nf(m+1)} = ${(n+1)*(m+1)}. De nieuwe toets: ${(n+1)*(m+1)} − ${S} = <b>${ans}</b>. Dat is niet ${nf(m+1)}: de nieuwe toets moet ook de vorige toetsen "optrekken".` }
  ], {letters:true})(b, st, save, key);
}
const MXgenAdd = r => { for(let t=0;t<500;t++){ const n = rInt(r,4,6); const v = MXintMean(r, n, 6, 16); const ans = (n+1)*(mean(v)+1) - sum(v); if(ans<=20 && ans>=mean(v)+3) return { v }; } return { v:[12,10,14,12] }; };

/* ============================================================
   WAT ALS? SCHUIFREGELAARS
   ============================================================ */
function MXwhatIf(b, st, save, key){
  const base = [4,6,6,7,8,9,10,12], last = base.length-1;
  if(st.k==null) st.k = 0; if(st.u==null) st.u = base[last];
  const bar1 = el('div','viz-bar', '<span class="lbl">Iedereen wacht extra:</span>');
  const s1 = el('input'); s1.type='range'; s1.min=-3; s1.max=5; s1.step=1; s1.value=st.k; s1.setAttribute('aria-label','iedereen wacht extra minuten');
  const o1 = el('span','pill'); bar1.append(s1, o1);
  const bar2 = el('div','viz-bar', '<span class="lbl">Wachttijd van de laatste klant:</span>');
  const s2 = el('input'); s2.type='range'; s2.min=3; s2.max=40; s2.step=1; s2.value=st.u; s2.setAttribute('aria-label','wachttijd van de laatste klant');
  const o2 = el('span','pill'); bar2.append(s2, o2);
  const viz = el('div','viz mid'); const tbl = el('div'); tbl.style.overflowX = 'auto';
  b.append(bar1, bar2, viz, tbl);
  const M = a => ({ 'gemiddelde':mean(a), 'mediaan':median(a), 'modus':modes(a).length===1 ? modes(a)[0] : null, 'variatiebreedte':range(a) });
  const m0 = M(base);
  function paint(){
    const a = base.map((x,i)=>(i===last ? st.u : x) + st.k);
    o1.textContent = (st.k>0?'+':'') + st.k + ' min'; o2.textContent = (st.u + st.k) + ' min';
    const mm = M(a), keys = Object.keys(mm);
    const P = MXline(0, 45, 220, {lab:5, r:5.5, base:120, xTitle:'Wachttijd aan de kassa (minuten)'});
    P.dots(a.map((x,i)=>({v:x, cls:i===last?'or':''})));
    P.marks([[mm['gemiddelde'], 'x̄ = '+nf(mm['gemiddelde'],2), 'or'], [mm['mediaan'], 'Me = '+nf(mm['mediaan'],2)]].sort((p,q)=>p[0]-q[0]));
    viz.innerHTML = ''; viz.append(P.svg);
    tbl.innerHTML = `<table class="mx-tbl"><thead><tr><th>maat</th><th>begin</th><th>nu</th><th>verschil</th></tr></thead><tbody>${keys.map(k=>{ const a0 = m0[k], a1 = mm[k]; const dd = a0==null||a1==null ? null : a1-a0;
      return `<tr><td>${k}</td><td>${a0==null?'geen':nf(a0,2)}</td><td>${a1==null?'geen':nf(a1,2)}</td><td class="${dd>0?'up':dd<0?'dn':''}">${dd==null?'·':(dd>0?'+':'')+nf(dd,2)}</td></tr>`; }).join('')}</tbody></table>`;
  }
  s1.addEventListener('input', ()=>{ st.k = +s1.value; save(); paint(); });
  s2.addEventListener('input', ()=>{ st.u = +s2.value; save(); paint(); });
  paint();
}

/* ============================================================
   SPEL: RAAD MIJN GETALLEN (telt niet mee)
   ============================================================ */
function MXsecret(r, lv){
  for(let t=0;t<3000;t++){
    const a = sorted(Array.from({length:lv}, ()=>rInt(r,1,10))); const s = sum(a);
    if(s%lv) continue;
    if(lv===3){ if(range(a)<2) continue; return { a, clues:[['x̄','gemiddelde',s/lv], ['Me','mediaan',median(a)], ['vb','variatiebreedte',range(a)]] }; }
    const md = modes(a); if(md.length!==1 || countOf(a, md[0])!==2) continue;
    return { a, clues:[['x̄','gemiddelde',s/lv], ['Me','mediaan',median(a)], ['Mo','modus',md[0]], ['vb','variatiebreedte',range(a)]] };
  }
  return lv===3 ? { a:[2,5,8], clues:[['x̄','gemiddelde',5],['Me','mediaan',5],['vb','variatiebreedte',6]] } : { a:[2,4,4,7,8], clues:[['x̄','gemiddelde',5],['Me','mediaan',4],['Mo','modus',4],['vb','variatiebreedte',6]] };
}
function MXguess(b, st, save, key){
  if(QZ) return;
  if(st.seed==null){ st.seed = Math.floor(Math.random()*1e9); save(); }
  if(!st.lv) st.lv = 3; if(!st.tries) st.tries = []; if(st.wins==null) st.wins = 0;
  const lvBox = el('div','mx-lvl'); const box = el('div'); b.append(lvBox, box);
  [[3,'3 getallen'],[5,'5 getallen (moeilijker)']].forEach(([k,t])=>{ const o = el('button','opt',t); o.type='button'; o.dataset.k = k; lvBox.append(o);
    o.addEventListener('click', ()=>{ if(st.lv===k) return; st.lv = k; st.tries = []; st.won = false; st.seed = (st.seed + 104729)>>>0; save(); draw(); }); });
  function measure(a, k){ if(k==='Mo'){ const m = modes(a); return m.length===1 && countOf(a,m[0])>1 ? m[0] : null; } return k==='x̄' ? mean(a) : k==='Me' ? median(a) : range(a); }
  function draw(){
    lvBox.querySelectorAll('.opt').forEach(o=>o.classList.toggle('chosen', +o.dataset.k===st.lv));
    const S = MXsecret(rng(st.seed), st.lv), lv = st.lv;
    box.innerHTML = '';
    box.append(el('div','readout bigq', `Ik denk aan <b>${lv} gehele getallen</b> van 1 tot en met 10. Dit zijn mijn hints:`));
    box.append(el('div','mx-clues', S.clues.map(([k,name,val])=>`<span class="mx-clue"><small>${name}</small>${k} = ${nf(val)}</span>`).join('')));
    const g = el('div','mx-guess'); const ins = [];
    for(let i=0;i<lv;i++){ const inp = el('input','inp'); inp.type='text'; inp.inputMode='numeric'; inp.autocomplete='off'; inp.setAttribute('aria-label','getal '+(i+1)); g.append(inp); ins.push(inp); }
    const tryB = el('button','btn','Probeer'); tryB.type='button'; g.append(tryB);
    const newB = el('button','btn ghost','↻ Nieuw spel'); newB.type='button'; g.append(newB);
    box.append(g); const fb = el('div','fb'); const log = el('div','mx-tries'); box.append(fb, log);
    box.append(el('div','sub', `Gewonnen spelletjes: <b>${st.wins}</b>. Dit spel telt niet mee.`));
    function showTry(a){
      const parts = S.clues.map(([k,name,val])=>{ const x = measure(a,k); const ok = x!=null && Math.abs(x-val)<1e-9;
        return `<span class="${ok?'ok':'no'}">${k} ${x==null?'geen':nf(x,2)} ${ok?'✓':x==null?'✗':x>val?'↓ te groot':'↑ te klein'}</span>`; });
      log.prepend(el('div','mx-try', `<span class="g">${a.map(x=>nf(x)).join(', ')}</span>${parts.join('')}`));
    }
    st.tries.forEach(showTry);
    function finish(){ fb.className = 'fb ok'; fb.innerHTML = `🎉 Geraden in ${st.tries.length} ${st.tries.length===1?'poging':'pogingen'}! Jouw getallen kloppen met alle hints.${st.lv===5 ? ` Ik dacht aan ${MXlist(S.a)}. Er zijn soms meer oplossingen.` : ''}`; ins.forEach(i=>i.disabled = true); tryB.disabled = true; }
    if(st.won) finish();
    function go(){
      if(st.won) return;
      const a = ins.map(i=>parseLoose(i.value));
      if(a.some(x=>isNaN(x))){ fb.className='fb info'; fb.textContent = `Typ in elk vakje een geheel getal van 1 tot 10.`; return; }
      if(a.some(x=>x<1 || x>10 || x%1)){ fb.className='fb info'; fb.textContent = 'Enkel gehele getallen van 1 tot en met 10.'; return; }
      st.tries.push(a); showTry(a);
      const ok = S.clues.every(([k,,val])=>{ const x = measure(a,k); return x!=null && Math.abs(x-val)<1e-9; });
      if(ok){ st.won = true; st.wins++; save(); finish(); }
      else { save(); fb.className = 'fb bad'; fb.innerHTML = '❌ Nog niet alle hints kloppen. Tip: begin met de som. Die is gemiddelde · ' + lv + ' = <b>' + nf(S.clues[0][2]*lv) + '</b>.'; }
    }
    tryB.addEventListener('click', go);
    ins.forEach(i=>i.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } }));
    newB.addEventListener('click', ()=>{ st.seed = (st.seed + 7919)>>>0; st.tries = []; st.won = false; save(); draw(); });
  }
  draw();
}

/* ============================================================
   KAARTEN
   ============================================================ */
const MXsec = id => SECTIONS.find(s=>s.id===id).cards;
MXsec('modus').push(
  { title:'Klik op de modus (nieuwe opgave)', lvl:1, instr:'Een klas zei hoe vaak ze dit jaar naar de film gingen. Met "Nieuwe opgave" krijg je een nieuwe klas.',
    build:fresh(MXgenDot, (b,st,save,key,d)=>dotPick(b,st,save,key,d)) },
  { title:'Modus en variatiebreedte (nieuwe opgave)', lvl:2, instr:'Met "Nieuwe opgave" krijg je nieuwe getallen.',
    build:fresh(MXgenModus, MXmodusEx) }
);
MXsec('gem').push(
  { title:'Bereken het gemiddelde (nieuwe opgave)', lvl:1, instr:'Lukt het niet? Klik op "Toon mij hoe".',
    build:fresh(MXgenGem1, (b,st,save,key,d)=>MXgemEx(b,st,save,key,d,false)) },
  { title:'Gemiddelde met afronden (nieuwe opgave)', lvl:2, instr:'Rond af op 0,1.',
    build:fresh(MXgenGem2, (b,st,save,key,d)=>MXgemEx(b,st,save,key,d,true)) },
  { title:'Gemiddelde uit een frequentietabel (nieuwe opgave)', lvl:2, instr:'Vermenigvuldig eerst elk gegeven met zijn frequentie.',
    build:fresh(MXtab, MXgemTabEx) },
  { title:'Eén toets erbij', lvl:3, instr:'Een denkopdracht: de nieuwe score is niet gewoon "1 meer dan het gemiddelde".',
    build:fresh(MXgenAdd, MXaddOne) }
);
MXsec('med').push(
  { title:'De mediaan (nieuwe opgave)', lvl:1, instr:'Een oneven aantal gegevens. Lukt het niet? Klik op "Toon mij hoe".',
    build:fresh(MXgenMed(false), MXmedEx) },
  { title:'Mediaan bij een even aantal (nieuwe opgave)', lvl:2, instr:'Bij een even aantal gegevens zijn er twee middelste getallen.',
    build:fresh(MXgenMed(true), MXmedEx) },
  { title:'Mediaan uit een frequentietabel (nieuwe opgave)', lvl:2, instr:'De tabel is al geordend: tel af tot het middelste gegeven.',
    build:fresh(MXtab, MXmedTabEx) }
);
MXsec('interp').push(
  { title:'Maak zelf een rij', lvl:2, instr:'Vijf getallen van 0 tot 15. Kijk hoe het gemiddelde en de mediaan meeschuiven terwijl je sleept.',
    build:fresh(MXgenRow(false), MXbuildRow) },
  { title:'Wat als ...?', lvl:2, instr:'Acht klanten wachten aan de kassa. Verschuif de schuifregelaars en kijk welke maten veranderen.',
    build:combo(MXwhatIf, (b,st,save,key)=>{
      const o = [['a','blijft gelijk'],['b','stijgt met 2'],['c','stijgt met 16']];
      choiceList([['Iedereen wacht 2 minuten langer. Wat gebeurt er met het gemiddelde?', 'b', 'Elk gegeven stijgt met 2, de som stijgt met 8 · 2 = 16 en 16 : 8 = 2. Het gemiddelde stijgt dus ook met 2.']], o)(b, st, save, key+'_a');
      choiceList([['Iedereen wacht 2 minuten langer. Wat gebeurt er met de mediaan?', 'b', 'De volgorde blijft dezelfde: de middelste schuiven ook 2 op.']], o)(b, st, save, key+'_b');
      choiceList([['Iedereen wacht 2 minuten langer. Wat gebeurt er met de variatiebreedte?', 'a', 'Grootste en kleinste stijgen allebei met 2: het verschil blijft gelijk.']], o)(b, st, save, key+'_c');
      choiceList([['De laatste klant wacht plots 40 minuten. Welke maat verandert het minst?', 'm', 'De mediaan blijft gelijk: de uitschieter schuift enkel verder naar rechts. Het gemiddelde en de variatiebreedte stijgen sterk.']], [['g','het gemiddelde'],['m','de mediaan'],['v','de variatiebreedte']])(b, st, save, key+'_d');
    }) },
  { title:'Raad mijn getallen', lvl:2, instr:'Een spel: de computer denkt aan een paar getallen. Raad ze met de hints. Het telt niet mee.',
    build:MXguess },
  { title:'Maak zelf een rij met een modus', lvl:3, instr:'Nu moet ook de modus kloppen: dat getal komt het vaakst voor.',
    build:fresh(MXgenRow(true), MXbuildRow) }
);
MXsec('freq').push(
  { title:'Percentages berekenen (nieuwe opgave)', lvl:2, instr:'Deel door het totaal en vermenigvuldig met 100. Lukt het niet? Klik op "Toon mij hoe".',
    build:fresh(MXgenPct, MXpctEx) }
);
/* ============================================================
   UITLEG STAP VOOR STAP: modus, variatiebreedte, gemiddelde uit een frequentietabel, mediaan
   Figuur links, de stappen rechts. Met "Volgende stap" komt er telkens één stap bij.
   ============================================================ */
(function(){
  const css = `
  .ch .mu-dot{ fill:var(--tq); stroke:var(--card); stroke-width:1.5; transition:fill .25s, opacity .25s; }
  .ch .mu-dot.or{ fill:var(--orange); }
  .ch .mu-dot.dim{ opacity:.28; }
  .ch text.mu-nr{ font-size:10px; font-weight:700; fill:var(--on-accent); pointer-events:none; }
  .ch .mu-pijl{ stroke:var(--orange); stroke-width:2.5; fill:none; }
  .ch .mu-col{ fill:var(--or-soft); }
  .mu-st{ margin:0; padding-left:1.5rem; display:flex; flex-direction:column; gap:.55rem; }
  .mu-st li{ color:var(--ink-soft); line-height:1.45; }
  .mu-st li.nu{ color:var(--ink); }
  .mu-st li.nu::marker{ color:var(--accent-dark); font-weight:700; }
  .mu-bar{ display:flex; flex-wrap:wrap; align-items:center; gap:.6rem; margin:.9rem 0 .3rem; }
  .mu-bar .mu-tel{ color:var(--ink-soft); font-size:.92rem; }
  .mu-fig{ display:flex; flex-direction:column; gap:.8rem; align-items:center; width:100%; }
  .mu-fig .ftab{ margin:0 auto; }
  .ftab td.mu-new{ background:var(--or-soft); font-weight:700; }
  .ftab tr.mu-rij td{ background:var(--or-soft); }
  .mu-plan{ border:2px solid var(--border); border-radius:.9rem; padding:.6rem .9rem; background:var(--zone-bg); }
  .mu-plan h4{ margin:0 0 .35rem; color:var(--accent-dark); }
  .mu-plan ol{ margin:0; padding-left:1.3rem; display:flex; flex-direction:column; gap:.3rem; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* dotplot met gekleurde en genummerde bolletjes. o.cls(rang) geeft een klasse, rang telt vanaf 1 (geordend, per stapel van onder naar boven) */
function MUdot(vals, lo, hi, o={}){
  const srt = vals.slice().sort((a,b)=>a-b);
  const P = numPlot(srt, lo, hi, {xTitle:o.markers?'':o.xTitle, extra:o.extra||60, step:o.step||1});
  P.drawDots([]);
  if(o.markers && o.xTitle) svgText(P.svg, P.W/2, P.H+52, o.xTitle, {'text-anchor':'middle', class:'t-soft'});
  const g = svgEl('g', {}, P.svg), cnt = {};
  srt.forEach((v,i)=>{ cnt[v]=(cnt[v]||0)+1; const k=cnt[v]-1, cx=P.X(v), cy=P.base-P.r-2-k*P.r*2.15;
    svgEl('circle', {cx, cy, r:P.r, class:'mu-dot '+(o.cls?o.cls(i+1, v):'')}, g);
    if(o.nr && (o.nr===true || o.nr(i+1, v))) svgText(g, cx, cy+3.5, String(o.stapel ? k+1 : i+1), {'text-anchor':'middle', class:'mu-nr'}); });
  P.top = v => P.base-P.r-2-((cnt[v]||1)-1)*P.r*2.15-P.r; /* bovenkant van een stapel */
  P.maxTop = Math.min(...Object.keys(cnt).map(v=>P.top(+v)));
  if(o.teken) o.teken(P);
  P.svg.style.height='auto';
  P.svg.setAttribute('viewBox', `0 0 ${P.W} ${P.H+(o.markers?60:0)}`);
  return P;
}
/* dubbele pijl boven de dotplot, van a tot b, met tekst */
function MUpijl(P, a, b, txt){
  const y = P.maxTop-18, x1=P.X(a), x2=P.X(b);
  svgEl('path', {d:`M${x1},${y} H${x2} M${x1+7},${y-6} L${x1},${y} L${x1+7},${y+6} M${x2-7},${y-6} L${x2},${y} L${x2-7},${y+6}`, class:'mu-pijl'}, P.svg);
  svgText(P.svg, (x1+x2)/2, y-9, txt, {'text-anchor':'middle', class:'t-or'});
}
/* korte tekst boven een stapel */
function MUlabel(P, v, txt, cls){ svgText(P.svg, P.X(v), P.top(v)-8, txt, {'text-anchor':'middle', class:cls||'t-or'}); }

/* stap-voor-stap: fig(i) geeft de figuur bij stap i, stappen[i] de tekst */
function MUstappen(b, st, save, key, stappen, fig){
  const w = el('div','nx mu'), L = el('div','nx-l'), R = el('div','nx-r'); w.append(L, R); b.append(w);
  const v = el('div','viz'); L.append(v);
  const ol = el('ol','mu-st'), bar = el('div','mu-bar');
  const vorige = el('button','btn ghost','← Vorige'), volgende = el('button','btn','Volgende stap →'), tel = el('span','mu-tel');
  vorige.type = volgende.type = 'button'; bar.append(vorige, volgende, tel); R.append(ol, bar);
  const sk = 'mu_'+key;
  function toon(){
    const i = Math.max(0, Math.min(stappen.length-1, st[sk]||0));
    v.innerHTML=''; const f = fig(i); v.append(f.svg || f);
    ol.innerHTML = stappen.slice(0, i+1).map((t,j)=>`<li class="${j===i?'nu':''}">${t}</li>`).join('');
    vorige.disabled = i===0; volgende.disabled = i===stappen.length-1;
    volgende.textContent = i===stappen.length-1 ? 'Klaar: beantwoord de vragen' : 'Volgende stap →';
    tel.textContent = `stap ${i+1} van ${stappen.length}`;
  }
  vorige.addEventListener('click', ()=>{ st[sk]=Math.max(0,(st[sk]||0)-1); save(); toon(); });
  volgende.addEventListener('click', ()=>{ st[sk]=Math.min(stappen.length-1,(st[sk]||0)+1); save(); toon(); });
  toon();
  return R;
}
/* een stappenplan-kader */
const MUplan = (titel, stappen) => `<div class="mu-plan"><h4>${titel}</h4><ol>${stappen.map(s=>`<li>${s}</li>`).join('')}</ol></div>`;
/* twee kolommen: links de tabel met invulvakjes, rechts het stappenplan */
function MUnaast(b){ const w = el('div','nx'), L = el('div','nx-l'), R = el('div','nx-r'); w.append(L, R); b.append(w); return [L, R]; }
/* een tabel als figuur */
const MUtab = h => { const d = el('div','mu-fig'); d.innerHTML = h; return d; };

/* ---------------- gegevens ---------------- */
const MU_BROERS = expand([0,1,2,3,4],[4,9,5,1,1]);   /* 20 leerlingen, broers en zussen */
const MU_DIER = {w:[0,1,2,3,4], f:[3,6,5,4,2]};       /* 20 leerlingen, huisdieren */
const MU_SPORT = [1,2,2,3,3,3,3,4,4,4,5,5,6,7,9];     /* 15 leerlingen, uren sport per week */

(function(){
  /* ======================= MODUS ======================= */
  const modus = SECTIONS.find(s=>s.id==='modus').cards;
  const vb = { title:'Variatiebreedte: zo werkt het', lvl:1, naast:false, instr:'Klik telkens op <b>Volgende stap</b> en kijk wat er in de dotplot verandert.',
    build:(b,st,save,key)=>{
      const XT = 'Aantal broers en zussen';
      MUstappen(b, st, save, key, [
        'Dezelfde twintig leerlingen. Hoe ver liggen hun antwoorden uit elkaar? Zoek eerst het <b>kleinste</b> gegeven: het <b>minimum</b> is <b>0</b>.',
        'Zoek dan het <b>grootste</b> gegeven: het <b>maximum</b> is <b>4</b>.',
        '<b>Variatiebreedte = maximum − minimum</b> = 4 − 0 = <b>4</b>. Dat is de breedte van de dotplot: de afstand tussen het kleinste en het grootste gegeven.',
        'Wat zegt dat getal? Is de variatiebreedte <b>klein</b>, dan liggen de gegevens <b>dicht bij elkaar</b>. Is ze <b>groot</b>, dan liggen ze <b>ver uit elkaar</b>. Let op: de variatiebreedte is één getal (4), niet "van 0 tot 4".',
        'Er komt een leerling bij met <b>9</b> broers en zussen. Nu is de variatiebreedte 9 − 0 = <b>9</b>. Eén uitschieter maakt de variatiebreedte veel groter, ook al blijven alle andere gegevens gelijk.'
      ], i=>{
        const vals = i===4 ? MU_BROERS.concat([9]) : MU_BROERS, mx = i===4 ? 9 : 4;
        return MUdot(vals, 0, 10, {xTitle:XT, cls:(r,v)=> (v===0 || (i>=1 && v===mx)) ? 'or' : (i<2?'dim':''),
          teken:P=>{ MUlabel(P, 0, 'min = 0'); if(i>=1 && i<2) MUlabel(P, mx, 'max = '+mx);
            if(i>=2) MUpijl(P, 0, mx, `variatiebreedte = ${mx} − 0 = ${mx}`); }});
      });
      qBlock(b, st, save, key+'_a', {html:'Temperaturen in °C: 4, −2, 7, 1, 8, 3. Variatiebreedte = [[0]] °C', mode:'numeric', check:exact(10), sol:'Maximum 8, minimum −2: 8 − (−2) = <b>10 °C</b>.'});
      qChoice(b, st, save, 'b', {html:'Klas A heeft een variatiebreedte van 3 punten, klas B van 12 punten. Wat betekent dat?', ans:'a', opts:[['a','In klas A liggen de punten dichter bij elkaar.'],['b','Klas B haalde betere punten.'],['c','Klas B heeft meer leerlingen.']], why:'De variatiebreedte zegt hoe ver de gegevens uit elkaar liggen, niet hoe goed ze zijn.'});
    } };
  modus.unshift({ title:'Modus: zo werkt het', lvl:1, naast:false, instr:'Klik telkens op <b>Volgende stap</b> en kijk wat er in de dotplot verandert.',
    build:(b,st,save,key)=>{
      const XT = 'Aantal broers en zussen';
      MUstappen(b, st, save, key, [
        'Twintig leerlingen antwoordden op de vraag: <i>Hoeveel broers en zussen heb je?</i> Elk bolletje is <b>één leerling</b>.',
        'Zoek de <b>hoogste stapel</b>. Bij 1 staan 9 bolletjes: 9 leerlingen hebben 1 broer of zus. Dat antwoord komt het vaakst voor.',
        'De <b>modus</b> is het gegeven dat het vaakst voorkomt: <b>modus = 1</b>.<br>Opgelet: de modus is <b>1</b>, niet 9. Het getal 9 is de <b>frequentie</b>: hoeveel keer het antwoord voorkomt.',
        'Soms zijn er <b>twee modi</b>. In de reeks 2, 3, 3, 4, 5, 5, 6 komen 3 en 5 allebei twee keer voor: de modi zijn 3 en 5. Komt elk gegeven even vaak voor, dan is er <b>geen modus</b>.',
        'Ook bij <b>categorische data</b> is er een modus: het antwoord met de <b>hoogste staaf</b>. Hier is de modus <b>voetbal</b>. Een gemiddelde of mediaan kan je hier niet berekenen.'
      ], i=>{
        if(i===3) return MUdot([2,3,3,4,5,5,6], 0, 8, {xTitle:'Gegevens', cls:(r,v)=>v===3||v===5?'or':'', teken:P=>{ MUlabel(P,3,'modus'); MUlabel(P,5,'modus'); }});
        if(i===4) return drawChart('kolom', {labels:['voetbal','dans','tennis','zwemmen','andere'], series:[{values:[8,5,3,6,3]}], xTitle:'Favoriete sport', yTitle:'Frequentie', yMax:10, step:2, anim:false});
        return MUdot(MU_BROERS, 0, 5, {xTitle:XT, cls:(r,v)=> i===0 ? '' : (v===1?'or':'dim'), nr: i>=1 ? (r,v)=>v===1 : false, stapel:true,
          teken:P=>{ if(i===1) MUlabel(P, 1, '9 keer'); if(i===2){ MUlabel(P, 1, 'modus = 1'); } }});
      });
      qBlock(b, st, save, key+'_a', {html:'Gegevens: 4, 7, 2, 7, 5, 4, 7, 1. Modus = [[0]]', mode:'numeric', check:exact(7), sol:'7 komt drie keer voor, vaker dan elk ander gegeven: modus = <b>7</b>.'});
      qChoice(b, st, save, 'b', {html:'In een dotplot staat de hoogste stapel bij 3, met 8 bolletjes. Wat is de modus?', ans:'3', opts:[['3','3'],['8','8'],['11','3 en 8']], why:'De modus is het gegeven zelf (3). Het aantal bolletjes (8) is de frequentie.'});
    } });
  modus.splice(1, 0, vb);

  /* ======================= GEMIDDELDE UIT EEN FREQUENTIETABEL ======================= */
  const gem = SECTIONS.find(s=>s.id==='gem').cards;
  const tabDier = (stap, rijHi) => {
    const {w, f} = MU_DIER; const pr = w.map((x,i)=>x*f[i]);
    const kop = ['aantal huisdieren','frequentie'].concat(stap>=1 ? ['huisdieren · frequentie'] : []);
    let h = `<table class="ftab"><thead><tr>${kop.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>`;
    w.forEach((x,i)=>{ const toon = stap>=2 || (stap===1 && i===1);
      h += `<tr${rijHi===i?' class="mu-rij"':''}><td class="l">${x}</td><td>${f[i]}</td>${stap>=1?`<td class="${toon && (stap===2 || stap===1)?'mu-new':''}">${toon?`${x} · ${f[i]} = ${pr[i]}`:''}</td>`:''}</tr>`; });
    h += `<tr><td class="l"><b>totaal</b></td><td${stap===3?' class="mu-new"':''}>${stap>=3?'<b>20</b>':''}</td>${stap>=1?`<td${stap===3?' class="mu-new"':''}>${stap>=3?'<b>36</b>':''}</td>`:''}</tr></tbody></table>`;
    return h;
  };
  const uitlegGem = { title:'Gemiddelde uit een frequentietabel: zo werkt het', lvl:1, naast:false, instr:'Klik telkens op <b>Volgende stap</b>. De tabel en de dotplot tonen dezelfde gegevens.',
    build:(b,st,save,key)=>{
      MUstappen(b, st, save, key, [
        'Twintig leerlingen: <i>hoeveel huisdieren heb je?</i> 3 leerlingen hebben er 0, 6 leerlingen hebben er 1, 5 leerlingen hebben er 2 ... In de dotplot is elk bolletje één leerling.',
        'Voor het gemiddelde tel je <b>alle</b> gegevens op. De 6 leerlingen met 1 huisdier hebben samen 1 + 1 + 1 + 1 + 1 + 1 = <b>1 · 6 = 6</b> huisdieren. Daarom maak je een <b>hulpkolom</b>: gegeven · frequentie.',
        'Doe dat voor elke rij: 0 · 3 = 0, 1 · 6 = 6, 2 · 5 = 10, 3 · 4 = 12 en 4 · 2 = 8.',
        'Tel beide kolommen op. Frequentie: 3 + 6 + 5 + 4 + 2 = <b>20</b> leerlingen. Hulpkolom: 0 + 6 + 10 + 12 + 8 = <b>36</b> huisdieren samen.',
        '<b>Gemiddelde = som van alle gegevens : aantal gegevens</b> = 36 : 20 = <b>1,8 huisdieren</b>.<br>Deel door <b>20</b> (het aantal leerlingen), niet door 5 (het aantal rijen). 36 : 5 = 7,2 kan niet: niemand heeft meer dan 4 huisdieren.',
        '<b>Controle</b>: het gemiddelde ligt altijd tussen het kleinste (0) en het grootste gegeven (4), en dicht bij de hoge stapels. 1,8 klopt dus.'
      ], i=>{
        const d = MUtab(tabDier(Math.min(i,3), i===1?1:-1));
        const P = MUdot(expand(MU_DIER.w, MU_DIER.f), 0, 5, {xTitle:'Aantal huisdieren', extra:30, markers:i>=4, cls:(r,v)=> i===1 ? (v===1?'or':'dim') : ''});
        if(i>=4) marker(P, 1.8, 'x̄ = 1,8', 'or');
        d.append(P.svg); return d;
      });
      qChoice(b, st, save, 'a', {html:'Waarom deel je door 20 en niet door 5?', ans:'l', opts:[['l','Er zijn 20 gegevens (leerlingen); 5 is maar het aantal rijen.'],['r','Omdat 20 het grootste getal in de tabel is.'],['g','Dat maakt niet uit, beide zijn goed.']], why:'Het gemiddelde is de som van alle gegevens gedeeld door het aantal gegevens: 20 leerlingen.'});
    } };
  const oefGem = { title:'Gemiddelde uit een frequentietabel: oefen met de hulpkolom', lvl:1, naast:false, instr:'20 leerlingen: hoeveel doelpunten scoorde je op het tornooi? Vul de hulpkolom in, tel op en deel.',
    build:(b,st,save,key)=>{
      const [L, R] = MUnaast(b);
      R.append(el('div','', MUplan('Stappenplan', ['Vermenigvuldig in elke rij: <b>gegeven · frequentie</b>.', 'Tel de frequenties op: zoveel gegevens zijn er.', 'Tel de hulpkolom op: dat is de som van alle gegevens.', 'Deel: <b>som : aantal gegevens</b>.', 'Controleer: ligt je antwoord tussen het kleinste en het grootste gegeven?'])));
      list([
        {html:`<table class="ftab"><thead><tr><th>doelpunten</th><th>frequentie</th><th>doelpunten · frequentie</th></tr></thead><tbody>
          <tr><td>0</td><td>2</td><td>[[0]]</td></tr><tr><td>1</td><td>5</td><td>[[1]]</td></tr><tr><td>2</td><td>6</td><td>[[2]]</td></tr><tr><td>3</td><td>4</td><td>[[3]]</td></tr><tr><td>4</td><td>3</td><td>[[4]]</td></tr>
          <tr><td><b>totaal</b></td><td>[[5]]</td><td>[[6]]</td></tr></tbody></table>`, block:true, size:'xs', mode:'numeric', check:nums([0,5,12,12,12,20,41], 1e-9, 'Vermenigvuldig in elke rij het aantal doelpunten met de frequentie. Tel daarna elke kolom op.'),
          sol:'0 · 2 = 0 · 1 · 5 = 5 · 2 · 6 = 12 · 3 · 4 = 12 · 4 · 3 = 12. Totaal frequentie: <b>20</b>, totaal hulpkolom: <b>41</b>.'},
        {html:'Het gemiddelde is x̄ = [[0]] doelpunten', check:exact(2.05), sol:'41 : 20 = <b>2,05</b> doelpunten. Dat ligt tussen 0 en 4: het klopt.'}
      ], {letters:true})(L, st, save, key);
    } };
  const foutGem = { title:'Gemiddelde: waar zit de fout?', lvl:2, instr:'Lotte en Sam berekenden het gemiddelde uit deze tabel van 20 leerlingen. Allebei fout! Wat liep er mis?',
    build:(b,st,save,key)=>{
      b.append(el('div','', ftabHTML(['doelpunten','frequentie'], [['0',2],['1',5],['2',6],['3',4],['4',3],['<b>totaal</b>','<b>20</b>']])));
      qChoice(b, st, save, 'a', {html:'Lotte rekent: (0 + 1 + 2 + 3 + 4) : 5 = 2. Wat doet ze fout?', ans:'f', opts:[['f','Ze vergeet de frequenties: elk gegeven komt meer dan één keer voor.'],['d','Ze moest door 4 delen.'],['o','Niets, 2 is juist.']], why:'Lotte telt elk gegeven maar één keer. Je moet eerst vermenigvuldigen met de frequentie: de som is 41, niet 10.'});
      qChoice(b, st, save, 'b', {html:'Sam rekent: 41 : 5 = 8,2. Wat doet hij fout?', ans:'d', opts:[['d','Hij deelt door het aantal rijen (5) in plaats van door het aantal leerlingen (20).'],['s','Zijn som klopt niet.'],['o','Niets, 8,2 is juist.']], why:'De som 41 klopt, maar er zijn 20 gegevens. Bovendien kan 8,2 niet: niemand scoorde meer dan 4.'});
      qBlock(b, st, save, key+'_c', {html:'Het juiste gemiddelde is x̄ = [[0]]', check:exact(2.05), sol:'41 : 20 = <b>2,05</b>.'});
    } };
  /* uitleg en oefening vooraan, de foutenjacht bij de andere oefeningen van niveau 2 */
  gem.unshift(uitlegGem, oefGem); gem.push(foutGem);

  /* ======================= MEDIAAN ======================= */
  const med = SECTIONS.find(s=>s.id==='med').cards;
  const uitlegDot = { title:'Mediaan in een dotplot: zo werkt het', lvl:1, naast:false, instr:'Klik telkens op <b>Volgende stap</b>. De bolletjes krijgen een rangnummer.',
    build:(b,st,save,key)=>{
      const XT = 'Uren sport per week';
      MUstappen(b, st, save, key, [
        '15 leerlingen: <i>hoeveel uur sport je per week?</i> In een dotplot staan de gegevens al <b>geordend</b>. Tel van links naar rechts, en in elke stapel van onder naar boven.',
        '15 gegevens: het middelste is het <b>(15 + 1) : 2 = 8ste</b> gegeven. Dan liggen er 7 links en 7 rechts.',
        'Het 8ste bolletje staat bij 4: <b>Me = 4 uur</b>. De helft van de leerlingen sport 4 uur of minder, de andere helft 4 uur of meer.',
        'Er komt een 16de leerling bij die 2 uur sport. Bij een <b>even aantal</b> zijn er twee middelste: het <b>8ste en het 9de</b> gegeven (8 links, 8 rechts).',
        'Het 8ste gegeven is 3, het 9de is 4: <b>Me = (3 + 4) : 2 = 3,5 uur</b>. De mediaan ligt tussen de twee middelste bolletjes in.'
      ], i=>{
        const vals = i>=3 ? MU_SPORT.concat([2]) : MU_SPORT, n = vals.length;
        const mid = n%2 ? [(n+1)/2] : [n/2, n/2+1];
        const P = MUdot(vals, 0, 10, {xTitle:XT, nr:true, markers:i===2||i===4, cls:r=> i===0 ? '' : (mid.includes(r)?'or':'')});
        if(i===2) marker(P, 4, 'Me = 4', 'or');
        if(i===4) marker(P, 3.5, 'Me = 3,5', 'or');
        return P;
      });
      qBlock(b, st, save, key+'_a', {html:'Bij 15 gegevens liggen er [[0]] gegevens links van de mediaan.', mode:'numeric', check:exact(7), sol:'Het 8ste gegeven is de mediaan: 7 links en <b>7</b> rechts.'});
      qChoice(b, st, save, 'b', {html:'Bij 16 gegevens: welke gegevens zijn de middelste?', ans:'89', opts:[['8','het 8ste'],['89','het 8ste en het 9de'],['78','het 7de en het 8ste']], why:'16 : 2 = 8: het 8ste en het 9de gegeven. Links en rechts liggen er dan telkens 8.'});
    } };
  const rang = [[1,4],[5,13],[14,18],[19,19],[20,20]];
  const tabBroers = (stap) => {
    let h = `<table class="ftab"><thead><tr><th>broers en zussen</th><th>frequentie</th>${stap>=1?'<th>rangnummers</th>':''}</tr></thead><tbody>`;
    [0,1,2,3,4].forEach((x,i)=>{ const f=[4,9,5,1,1][i], toon = stap>=2 || (stap===1 && i<2), [a,z] = rang[i];
      h += `<tr${stap>=3 && i===1?' class="mu-rij"':''}><td class="l">${x}</td><td>${f}</td>${stap>=1?`<td class="${toon && stap<=2 && (stap===2? i>=2 : true)?'mu-new':''}">${toon?(a===z?a:`${a} tot ${z}`):''}</td>`:''}</tr>`; });
    return h + `<tr><td class="l"><b>totaal</b></td><td><b>20</b></td>${stap>=1?'<td></td>':''}</tr></tbody></table>`;
  };
  const uitlegFt = { title:'Mediaan uit een frequentietabel: zo werkt het', lvl:1, naast:false, instr:'Klik telkens op <b>Volgende stap</b>. De dotplot toont dezelfde gegevens als de tabel.',
    build:(b,st,save,key)=>{
      MUstappen(b, st, save, key, [
        'Twintig leerlingen: <i>hoeveel broers en zussen heb je?</i> In een frequentietabel zie je de bolletjes niet, maar je kan ze wel <b>tellen</b>.',
        'Geef elk gegeven een <b>rangnummer</b>. De 4 leerlingen met 0 krijgen de rangnummers 1 tot 4. De 9 leerlingen met 1 krijgen 5 tot 13, want 4 + 9 = 13.',
        'Zo verder: 2 krijgt 14 tot 18 (13 + 5), 3 krijgt 19 en 4 krijgt 20. Het laatste rangnummer is altijd het <b>totaal</b>: 20.',
        '20 gegevens is een even aantal: de middelste zijn het <b>10de en het 11de</b> gegeven. Zoek in welke rij die rangnummers zitten: allebei in de rij van <b>1</b> (5 tot 13).',
        '<b>Me = (1 + 1) : 2 = 1</b>. De helft van de leerlingen heeft hoogstens 1 broer of zus.'
      ], i=>{
        const d = MUtab(tabBroers(Math.min(i,3)));
        const nrTot = i===0 ? 0 : (i===1 ? 13 : 20);
        const P = MUdot(MU_BROERS, 0, 5, {xTitle:'Aantal broers en zussen', extra:30, markers:i===4, nr: nrTot ? (r=>r<=nrTot) : false, cls:r=> i>=3 ? (r===10||r===11?'or':'dim') : (i===1 && r>13 ? 'dim' : '')});
        if(i===4) marker(P, 1, 'Me = 1', 'or');
        d.append(P.svg); return d;
      });
      qChoice(b, st, save, 'a', {html:'Een tabel heeft 25 gegevens. Welk rangnummer zoek je voor de mediaan?', ans:'13', opts:[['12','het 12de'],['13','het 13de'],['1213','het 12de en het 13de']], why:'25 is oneven: (25 + 1) : 2 = 13. Het 13de gegeven is de mediaan.'});
    } };
  const oefMed = { title:'Mediaan uit een frequentietabel: oefen met rangnummers', lvl:1, naast:false, instr:'20 leerlingen: wat haalde je op de toets (op 10)? Vul het laatste rangnummer van elke rij in.',
    build:(b,st,save,key)=>{
      const [L, R] = MUnaast(b);
      R.append(el('div','', MUplan('Stappenplan', ['Tel de frequenties op: zoveel gegevens zijn er.', 'Zoek het middelste rangnummer. Oneven: (aantal + 1) : 2. Even: aantal : 2 en het volgende.', 'Tel de frequenties van boven naar onder op: zo vind je het <b>laatste rangnummer</b> van elke rij.', 'Zoek de rij waarin het middelste rangnummer valt.', 'Twee middelste in verschillende rijen? Neem het gemiddelde van die twee gegevens.'])));
      list([
        {html:`<table class="ftab"><thead><tr><th>punten</th><th>frequentie</th><th>laatste rangnummer</th></tr></thead><tbody>
          <tr><td>5</td><td>2</td><td>[[0]]</td></tr><tr><td>6</td><td>3</td><td>[[1]]</td></tr><tr><td>7</td><td>6</td><td>[[2]]</td></tr><tr><td>8</td><td>5</td><td>[[3]]</td></tr><tr><td>9</td><td>3</td><td>[[4]]</td></tr><tr><td>10</td><td>1</td><td>[[5]]</td></tr></tbody></table>`, block:true, size:'xs', mode:'numeric', check:nums([2,5,11,16,19,20], 1e-9, 'Tel telkens de frequentie op bij het vorige laatste rangnummer: 2, dan 2 + 3 = 5, ...'),
          sol:'2 · 2 + 3 = 5 · 5 + 6 = 11 · 11 + 5 = 16 · 16 + 3 = 19 · 19 + 1 = 20.'},
        {html:'Er zijn 20 gegevens. De middelste zijn het [[0]]de en het [[1]]de gegeven.', size:'sm', mode:'numeric', check:nums([10,11]), sol:'Even aantal: 20 : 2 = 10, dus het <b>10de</b> en het <b>11de</b>.'},
        {html:'Zoek in de tabel de rij waarin het 10de en het 11de gegeven zitten. De mediaan is Me = [[0]]', mode:'numeric', check:exact(7), sol:'Het 10de en het 11de gegeven zijn allebei 7: Me = <b>7</b>.'}
      ], {letters:true})(L, st, save, key);
    } };
  med.unshift(uitlegDot, uitlegFt, oefMed);
})();

/* ============================================================
   NAGEBOOTST REKENTOESTEL (de TI-30XB MultiView, gedeeld/ti30xb.js)
   Enkel wat we nodig hebben: lijsten invullen (data), 1-Var Stats (2nd data = stat), resultaten bekijken.
   ============================================================ */
(function(){
  const css = `
  .calc-wrap{ display:flex; flex-wrap:wrap; gap:1rem; align-items:flex-start; }
  .steps-box{ flex:1; min-width:240px; }
  .steps-box ol{ padding-left:1.3rem; margin:.3rem 0; }
  .steps-box li{ margin:.25rem 0; padding:.15rem .3rem; border-radius:.4rem; }
  .steps-box li.now{ background:var(--or-soft); outline:2px solid var(--orange); }
  .steps-box li.done{ color:var(--ink-soft); }
  .kbd{ display:inline-block; min-width:1.6em; padding:0 .35em; border-radius:.35em; background:#4a5357; color:#fff; font-weight:700; font-size:.85em; text-align:center; }
  .kbd.n{ background:#f1f2f6; color:#1b1f20; border:1px solid #b2bec3; } .kbd.sec{ background:#0984e3; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();
const K = (t, cls) => `<span class="kbd ${cls||''}">${t}</span>`;

/* het gedeelde rekentoestel van het platform (gedeeld/ti30xb.js), zoals de TI-30XB MultiView van de leerlingen */
function makeCalc(parent, opts){
  return TI30XB.create(parent, Object.assign({ size:'11px' }, opts));
}

/* --- demo: de leerling klikt zelf op Volgende stap, het toestel drukt de toetsen langzaam in --- */
function calcDemo(b, cfg){
  const wrap = el('div','calc-wrap'); b.append(wrap);
  const C = makeCalc(wrap);
  const box = el('div','steps-box');
  box.innerHTML = `<b>Stappen</b><ol>${cfg.steps.map(s=>`<li>${s.say}</li>`).join('')}</ol>`;
  const bar = el('div','viz-bar'); const next = el('button','btn','▶ Stap 1'); next.type='button'; const rs = el('button','btn ghost','↺ Opnieuw'); rs.type='button'; bar.append(next, rs); box.append(bar);
  wrap.append(box);
  const lis = [...box.querySelectorAll('li')];
  let i = 0, busy = false, run = 0;
  const label = () => { next.disabled = busy || i >= cfg.steps.length; next.textContent = i >= cfg.steps.length ? '✓ Klaar' : busy ? '… het toestel drukt' : `▶ ${i ? 'Volgende stap' : 'Stap 1'} (${i+1}/${cfg.steps.length})`; };
  next.addEventListener('click', async ()=>{
    if(busy || i >= cfg.steps.length) return; busy = true; const me = run, st = cfg.steps[i];
    lis.forEach((l,j)=>{ l.classList.toggle('now', i===j); l.classList.toggle('done', j<i); }); label();
    const slow = st.keys.length > 6 ? [500, 300] : [900, 500];
    for(const k of st.keys){ if(me !== run) return; const bt = C.btn[k]; if(bt) bt.classList.add('hot'); await sleep(slow[0]); if(me !== run){ if(bt) bt.classList.remove('hot'); return; } C.press(k); await sleep(slow[1]); if(bt) bt.classList.remove('hot'); }
    i++; busy = false; label();
  });
  rs.addEventListener('click', ()=>{ run++; i = 0; busy = false; Object.values(C.btn).forEach(x=>x.classList.remove('hot')); lis.forEach(l=>l.classList.remove('now','done')); C.reset(); label(); });
  label();
}
const typeList = arr => arr.flatMap(x=>String(x).split('').map(c=>c==='-'?'neg':c).concat(['enter']));
/* toestel links, tabel en vragen rechts (liggend Chromebookscherm). 'CALC' staat op de plaats van het toestel, zodat de bewaarsleutels gelijk blijven. */
const calcNaast = (...parts) => (b, st, save, key) => {
  const w = el('div','nx tv tx-naast'), L = el('div','nx-l'), R = el('div','nx-r'); w.append(L, R); b.append(w);
  parts.forEach((p,i)=> p==='CALC' ? makeCalc(L) : typeof p==='string' ? R.append(el('div','', p)) : p(R, st, save, key+'_'+i));
};

/* ============================================================
   ONDERDEEL 11 · MET HET REKENTOESTEL
   ============================================================ */
const CHEAT_TOESTEL = `<h3>Spiekbriefje · statistiek met het rekentoestel</h3><table>
<tr><td>1. lijsten</td><td>${K('data')} · gegevens in L1, ${K('enter')} na elk getal · ${K('▶')} naar L2 · frequenties in L2</td></tr>
<tr><td>2. statistiek</td><td>${K('2nd','sec')} ${K('data')} (stat) · ${K('1','n')} 1-Var Stats</td></tr>
<tr><td>3. kiezen</td><td>DATA: L1 · FRQ: L2 (of ONE als elk gegeven één keer telt) · CALC ${K('enter')}</td></tr>
<tr><td>4. aflezen</td><td>x̄ = gemiddelde · Med = mediaan · minX en maxX: variatiebreedte = maxX − minX · n = aantal gegevens</td></tr>
<tr><td>modus</td><td>Geeft het toestel niet: zoek zelf de grootste frequentie.</td></tr>
<tr><td>lijst wissen</td><td>${K('data')} ${K('data')} en kies Clear, of ga op L1 staan en druk ${K('clear')}.</td></tr></table>`;
const SCHOEN = {vals:[37,38,39,40,41,42,43,45], fr:[1,3,5,1,4,3,2,1]};
SECTIONS.push({ id:'toestel', ic:'toestel', nav:'Met het rekentoestel', title:'Statistiek met je rekentoestel', cheat:CHEAT_TOESTEL,
  tip:'Met lijsten gaat het snel: zet de gegevens in L1 en de frequenties in L2. Het toestel berekent het gemiddelde, de mediaan, het minimum en het maximum. De modus zoek je zelf.',
  cards:[
    { title:'Kijk hoe het werkt', lvl:1, instr:'20 jongeren gaven hun schoenmaat. Klik telkens op Volgende stap en kijk welke toetsen het toestel indrukt. Doe mee op je eigen toestel.',
      build:combo(html(ftabHTML(['schoenmaat', ...SCHOEN.vals.map(String)], [['aantal', ...SCHOEN.fr.map(String)]])), b=>calcDemo(b, {steps:[
        {say:`${K('data')}: open de lijsten.`, keys:['data']},
        {say:'Typ de schoenmaten in L1, telkens gevolgd door enter.', keys:typeList(SCHOEN.vals)},
        {say:`${K('▶')}: naar L2. Typ de aantallen (de frequenties).`, keys:['right', ...typeList(SCHOEN.fr)]},
        {say:`${K('2nd','sec')} ${K('data')}: het menu STAT. Kies 1:1-Var Stats.`, keys:['2nd','data','enter']},
        {say:'DATA: L1 laten staan. FRQ: met ▶ naar L2.', keys:['down','right','right']},
        {say:`Naar CALC en ${K('enter')}.`, keys:['down','enter']},
        {say:'Lees af: n = 20 en x̄ = 40,35. Scroll naar beneden voor Med.', keys:['down','down','down','down','down','down','down','down']}
      ]})) },
    { title:'Doe het zelf op het toestel', lvl:1, instr:'Gebruik het nagebootste toestel (of je eigen rekentoestel) met dezelfde schoenmaten.',
      build:calcNaast(html(ftabHTML(['schoenmaat','aantal'], SCHOEN.vals.map((v,i)=>[String(v), String(SCHOEN.fr[i])]))), 'CALC', list([
        {html:'n = [[0]]', mode:'numeric', check:exact(20), sol:'1 + 3 + 5 + 1 + 4 + 3 + 2 + 1 = 20 jongeren.'},
        {html:'x̄ = [[0]]', check:exact(40.35), sol:'Het toestel geeft x̄ = 40,35.'},
        {html:'Med = [[0]]', check:exact(40.5), sol:'Het toestel geeft Med = 40,5: het 10de gegeven is 40, het 11de is 41.'},
        {html:'minX = [[0]] en maxX = [[1]], dus de variatiebreedte is [[2]]', size:'sm', check:nums([37,45,8]), sol:'45 − 37 = <b>8</b>.'},
        {html:'De modus (zelf zoeken in de tabel) = [[0]]', mode:'numeric', check:exact(39), sol:'39 heeft de grootste frequentie (5).'}
      ], {letters:true}), choiceList([
        ['Wat betekent Med = 40,5 hier?', 'h', 'De helft van de jongeren heeft schoenmaat 40 of kleiner, de andere helft 41 of groter.']
      ], [['h','De helft heeft hoogstens maat 40, de andere helft minstens maat 41.'],['x','De meeste jongeren hebben maat 40,5.']]), choiceList([
        ['Een schoenwinkel wil weten van welke maat ze het meest moet bestellen. Welke maat kijkt ze na?', 'm', 'De modus: maat 39 komt het vaakst voor. Het gemiddelde 40,35 is zelfs geen echte schoenmaat.']
      ], [['m','de modus'],['g','het gemiddelde'],['v','de variatiebreedte']])) },
    { title:'Een lijst zonder frequenties', lvl:2, instr:'Als elk gegeven apart staat, typ je alles in L1 en kies je FRQ: ONE.',
      build:calcNaast('CALC', list([
        {html:'Wachttijden in minuten: 12, 7, 15, 9, 7, 20, 11, 8. x̄ = [[0]] · Med = [[1]]', size:'sm', check:nums([11.125, 10]), sol:'Som 89, en 89 : 8 = 11,125. Geordend: 7, 7, 8, 9, 11, 12, 15, 20: (9 + 11) : 2 = 10.'},
        {html:'Punten: 14, 9, 17, 12, 16, 9, 15. x̄ = [[0]] (rond af op 0,01) · Med = [[1]]', size:'sm', check:v=>{ const a=parseLoose(v[0]), c=parseLoose(v[1]); const f=[Math.abs(a-13.14)<0.006, c===14]; return {ok:f.every(Boolean), fields:f}; }, sol:'92 : 7 = 13,142… ≈ 13,14. Geordend: 9, 9, 12, <b>14</b>, 15, 16, 17.'}
      ], {letters:true})) },
    { title:'Wat geeft het toestel niet?', lvl:3, build:choiceList([
        ['Het toestel geeft de modus.', 'n', 'De modus zoek je zelf: het gegeven met de grootste frequentie.'],
        ['De variatiebreedte vind je als maxX − minX.', 'w', 'Het toestel geeft het maximum en het minimum. Het verschil reken je zelf uit.'],
        ['Als je L2 als FRQ kiest, moeten L1 en L2 even lang zijn.', 'w', 'Bij elk gegeven hoort één frequentie. Anders krijg je een foutmelding.'],
        ['n is de som van alle gegevens.', 'n', 'n is het aantal gegevens. De som is Σx.']
      ], WN) },
    { title:'Groot getal, snel klaar', lvl:3, instr:'32 eieren werden gewogen (in g). Gebruik je rekentoestel.',
      build:calcNaast(html(ftabHTML(['massa (g)','aantal'], [['48','2'],['50','4'],['52','5'],['54','7'],['56','6'],['58','4'],['60','3'],['62','1']])), 'CALC', list([
        {html:'x̄ = [[0]] g · Med = [[1]] g · variatiebreedte = [[2]] g', size:'sm', check:nums([54.5, 54, 14]), sol:'Σx = 1744, n = 32: x̄ = 1744 : 32 = <b>54,5 g</b>. Het 16de en 17de gegeven zijn 54: Me = <b>54 g</b>. 62 − 48 = <b>14 g</b>.'},
        {html:'Hoeveel eieren wegen meer dan het gemiddelde? [[0]]', mode:'numeric', check:exact(14), sol:'Meer dan 54,5 g: 56, 58, 60 en 62 g: 6 + 4 + 3 + 1 = <b>14</b>.'}
      ], {letters:true})) }
  ]});
/* ============================================================
   EXTRA BIJ HET REKENTOESTEL: spiekkaart, toetsenquiz, foutenjacht, nieuwe opgaven
   ============================================================ */
(function(){
  const css = `
  .tx-mini{ width:250px; background:#5d6164; padding:10px; border-radius:16px; box-shadow:0 3px 0 #3e4143; }
  .tx-mini .brand{ color:#fff; font:700 .72rem/1 var(--f-body); letter-spacing:.06em; margin:0 0 6px 4px; }
  .tx-mini .scr{ background:#c9d0c3; color:#1c2117; font-family:"DejaVu Sans Mono", Consolas, "Courier New", monospace; font-size:14px; line-height:1.3; min-height:5.4em; border-radius:4px; padding:6px 8px; white-space:pre; overflow:hidden; box-shadow:inset 0 2px 4px rgba(0,0,0,.35); }
  .tx-row{ display:flex; flex-wrap:wrap; gap:1rem; align-items:flex-start; margin:.4rem 0; }
  .tx-row > div:last-child{ flex:1; min-width:220px; }
  .tx-keys{ border-collapse:collapse; margin:.2rem 0; }
  .tx-keys td{ padding:.35rem .5rem; border-bottom:1px solid var(--border); vertical-align:middle; }
  .tx-keys tr{ cursor:pointer; }
  .tx-keys tr:hover td, .tx-keys tr.on td{ background:var(--or-soft); }
  .tx-keys td:first-child{ white-space:nowrap; }
  .tx-seq{ font-size:1.05rem; min-height:1.6em; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();
/* een stilstaand scherm van het toestel */
const TXscr = lines => `<div class="tx-mini"><div class="brand">30XB MultiView</div><div class="scr">${lines.join('\n')}</div></div>`;

/* --- spiekkaart: klik op een rij en de toets licht op --- */
const TX_KEYS = [
  [['data'], 'De lijsten L1, L2 en L3 openen.'],
  [['enter'], 'Een getal in de lijst bevestigen, of een keuze in een menu.'],
  [['right'], 'Naar de volgende lijst (van L1 naar L2).'],
  [['up','down'], 'In een lijst of menu naar boven of naar onder.'],
  [['2nd','data'], 'Het menu STAT: kies 1:1-Var Stats.'],
  [['clear'], 'In een lijst: het getal of de lijst wissen.'],
  [['delete'], 'Eén getal uit de lijst verwijderen.'],
  [['2nd','mode'], 'QUIT: terug naar het gewone rekenscherm.']
];
const TX_LAB = { data:K('data'), enter:K('enter'), right:K('▶'), up:K('▲'), down:K('▼'), '2nd':K('2nd','sec'), clear:K('clear'), delete:K('delete'), mode:K('mode') };
function txCheat(b){
  const row = el('div','tx-row'); b.append(row);
  const cw = el('div'); row.append(cw); const C = makeCalc(cw);
  const right = el('div'); row.append(right);
  const tb = el('table','tx-keys'); right.append(tb);
  TX_KEYS.forEach(([ks, say])=>{
    const tr = el('tr', '', `<td>${ks.map(k=>TX_LAB[k]).join(' ')}</td><td>${say}</td>`); tb.append(tr);
    tr.addEventListener('click', ()=>{
      tb.querySelectorAll('tr').forEach(t=>t.classList.toggle('on', t===tr));
      Object.values(C.btn).forEach(x=>x.classList.remove('hot'));
      ks.forEach(k=>C.btn[k] && C.btn[k].classList.add('hot'));
    });
  });
  right.append(el('p','', '<b>Let op:</b> de modus geeft het toestel niet. Die zoek je zelf in de tabel: het gegeven met de grootste frequentie.'));
}

/* --- welke toetsen druk je in? de leerling drukt ze in op het toestel --- */
function txKeyQuiz(b, st, save, key, tasks){
  const row = el('div','tx-row'); b.append(row);
  const cw = el('div'); row.append(cw); const C = makeCalc(cw);
  const right = el('div'); row.append(right);
  const prompt = el('div','readout bigq'); const seq = el('div','tx-seq'); const fb = el('div','fb');
  right.append(prompt, seq, fb);
  const ids = tasks.map((t,i)=>QID('toets'+i)); ids.forEach(id=>CLvraag(id));
  st.done = st.done || 0; let typed = [], missed = false;
  function paint(){
    const t = tasks[st.done];
    prompt.innerHTML = t ? `<b>${st.done+1}/${tasks.length}.</b> ${t.say}` : '✅ Alles juist. Je kent de toetsen!';
    seq.innerHTML = typed.length ? 'Jij drukte: ' + typed.map(k=>TX_LAB[k]||k).join(' ') : '';
  }
  cw.addEventListener('click', e=>{
    const k = e.target.closest('.k'); if(!k) return; const t = tasks[st.done]; if(!t) return;
    typed.push(k.dataset.code);
    const alts = t.keys; const okPrefix = alts.some(a=>typed.every((x,i)=>a[i]===x));
    if(!okPrefix){ fb.className='fb bad'; fb.innerHTML = '❌ Dat is niet de juiste toets. ' + t.hint; missed = true; typed = []; paint(); return; }
    if(alts.some(a=>a.length===typed.length)){
      CLres(ids[st.done], !missed); fb.className='fb ok'; fb.innerHTML = '✅ Juist! ' + (t.why||'');
      st.done++; save(); typed = []; missed = false; setTimeout(()=>{ C.reset(); paint(); }, 900); return;
    }
    paint();
  });
  paint();
}
const TX_TASKS = [
  {say:'Open de lijsten om gegevens in te typen.', keys:[['data']], hint:'Zoek de toets met het woord data.'},
  {say:'Je typte een getal in L1. Bevestig het.', keys:[['enter']], hint:'Na elk getal druk je op dezelfde toets.'},
  {say:'Ga van L1 naar L2 om de frequenties te typen.', keys:[['right']], hint:'L2 staat rechts van L1.'},
  {say:'Open het menu STAT.', keys:[['2nd','data']], hint:'STAT staat in het blauw boven een toets: eerst 2nd.', why:'2nd data = stat.'},
  {say:'Wis een verkeerd getal uit de lijst.', keys:[['clear'],['delete']], hint:'Gebruik clear of delete.'},
  {say:'Ga terug naar het gewone rekenscherm (QUIT).', keys:[['2nd','mode']], hint:'QUIT staat in het blauw boven mode.', why:'2nd mode = quit.'}
];

/* --- foutenjacht: wat ging er mis op het toestel? --- */
const TX_OORZAAK = [['one','FRQ stond op ONE'],['verg','Er is een gegeven vergeten'],['typ','Er is een getal verkeerd getypt'],['frq','Er ontbreekt een frequentie in L2'],['ok','Alles klopt']];
function txHunt(b, st, save, key, cases){
  cases.forEach((c,i)=>{
    const box = el('div','q'); b.append(box);
    box.append(el('div','q-text block', `<span class="q-num">${i+1}.</span>${c.task}`));
    const row = el('div','tx-row'); row.innerHTML = TXscr(c.scr); const r2 = el('div'); row.append(r2); box.append(row);
    qChoice(r2, st, save, key+'_'+i, {html:'Wat ging er mis?', ans:c.ans, why:c.why, opts:TX_OORZAAK});
  });
}
const TX_CASES = [
  {task:`Schoenmaat van 20 jongeren: ${ftabHTML(['maat','37','38','39','40','41','42','43','45'], [['aantal','1','3','5','1','4','3','2','1']])} Ruben zette de maten in L1 en de aantallen in L2. Zijn toestel toont:`,
    scr:['1-Var:L1','1:n=8','2:x̄=40.625','5:Σx=325'], ans:'one', why:'Er zijn 20 jongeren, maar n = 8: het toestel telde elke maat maar één keer. Bij FRQ moet L2 staan in plaats van ONE. Dan krijg je n = 20 en x̄ = 40,35.'},
  {task:'Wachttijden in minuten: 12, 7, 15, 9, 7, 20, 11, 8. Lies typte alles in L1 (FRQ: ONE). Haar toestel toont:',
    scr:['1-Var:L1','1:n=7','2:x̄=9.857142857','B:maxX=15'], ans:'verg', why:'Er zijn 8 wachttijden, maar n = 7. Het maximum is 15 in plaats van 20: Lies vergat 20 te typen.'},
  {task:'Dezelfde wachttijden: 12, 7, 15, 9, 7, 20, 11, 8. Arne typte alles in L1 (FRQ: ONE). Zijn toestel toont:',
    scr:['1-Var:L1','1:n=8','2:x̄=15.625','B:maxX=51'], ans:'typ', why:'n = 8 klopt, maar het maximum is 51. Dat getal staat niet in de lijst: Arne typte 51 in plaats van 15.'},
  {task:`Punten op 10: ${ftabHTML(['punten','5','6','7','8','9'], [['aantal','2','4','7','5','3']])} Yara typte de punten in L1 en de aantallen in L2, en koos FRQ: L2. Haar toestel toont:`,
    scr:['','DIM MISMATCH',''], ans:'frq', why:'L1 heeft 5 getallen. Als L2 er maar 4 heeft, zijn de lijsten niet even lang. Bij elk gegeven hoort één frequentie.'},
  {task:`Aantal broers en zussen: ${ftabHTML(['aantal','3','4','5'], [['frequentie','2','5','3']])} Noor typte 3, 4, 5 in L1 en 2, 5, 3 in L2, met FRQ: L2. Haar toestel toont:`,
    scr:['1-Var:L1,L2','1:n=10','2:x̄=4.1','5:Σx=41'], ans:'ok', why:'n = 2 + 5 + 3 = 10 en Σx = 2·3 + 5·4 + 3·5 = 41. Het gemiddelde 41 : 10 = 4,1 klopt.'}
];

/* --- nieuwe opgave: een lijst getallen, het toestel rekent --- */
const txGen = r => { const n = rInt(r,6,9); const v = []; for(let i=0;i<n;i++) v.push(rInt(r,4,30)); const what = rPick(r, [['wachttijden','min'],['punten op 30',''],['temperaturen','°C'],['leeftijden','jaar']]); return {v, what}; };
function txGenEx(b, st, save, key, d){
  const v = d.v, m = mean(v), me = median(v), u = d.what[1] ? ' '+d.what[1] : '';
  b.append(el('div','readout bigq', `${d.what[0][0].toUpperCase()+d.what[0].slice(1)}: <b>${v.join(', ')}</b>`));
  const row = el('div','tx-row'); b.append(row); const cw = el('div'), qs = el('div'); row.append(cw, qs); makeCalc(cw);
  const exactM = Math.abs(m*100-Math.round(m*100))<1e-9;
  list([
    {html:'n = [[0]]', mode:'numeric', check:exact(v.length), sol:`Er zijn ${v.length} getallen.`},
    {html:`x̄ = [[0]]${u} ${exactM?'':'(rond af op 0,01)'}`, check:approx(m, exactM?1e-9:0.006), sol:`Σx = ${sum(v)} en ${sum(v)} : ${v.length} = ${nf(m,4)}${exactM?'':' ≈ <b>'+nf(m,2)+'</b>'}.`},
    {html:`Med = [[0]]${u}`, check:exact(me), sol:`Geordend: ${sorted(v).join(', ')}. De mediaan is <b>${nf(me)}</b>.`},
    {html:`variatiebreedte = [[0]]${u}`, mode:'numeric', check:exact(range(v)), sol:`maxX − minX = ${Math.max(...v)} − ${Math.min(...v)} = <b>${range(v)}</b>.`}
  ], {letters:true})(qs, st, save, key);
}

SECTIONS.find(s=>s.id==='toestel').cards.push(
  { title:'Spiekkaart: de toetsen voor statistiek', lvl:1, instr:'Klik op een rij: de toets licht op het toestel op.',
    build:b=>txCheat(b) },
  { title:'Welke toets druk je in?', lvl:1, instr:'Druk de juiste toetsen in op het toestel.',
    build:(b,st,save,key)=>txKeyQuiz(b,st,save,key,TX_TASKS) },
  { title:'Foutenjacht op het toestel', lvl:3, instr:'Vijf leerlingen gebruikten hun rekentoestel. Kijk naar het scherm: wat ging er mis?',
    build:(b,st,save,key)=>txHunt(b,st,save,key,TX_CASES) },
  { title:'Toetspunten met het toestel', lvl:2, instr:'22 leerlingen kregen hun punten op 10. Zet de punten in L1 en de aantallen in L2.',
    build:calcNaast(html(ftabHTML(['punten','aantal'], [['4','1'],['5','2'],['6','4'],['7','6'],['8','5'],['9','3'],['10','1']])), 'CALC', list([
      {html:'n = [[0]]', mode:'numeric', check:exact(22), sol:'1 + 2 + 4 + 6 + 5 + 3 + 1 = 22.'},
      {html:'x̄ = [[0]] (rond af op 0,01)', check:approx(7.14, 0.006), sol:'Σx = 157 en 157 : 22 = 7,136… ≈ <b>7,14</b>.'},
      {html:'Med = [[0]]', check:exact(7), sol:'Het 11de en het 12de gegeven zijn allebei 7: Me = <b>7</b>.'},
      {html:'variatiebreedte = [[0]] · modus = [[1]]', size:'sm', check:nums([6,7]), sol:'10 − 4 = <b>6</b>. De grootste frequentie (6) hoort bij <b>7</b>.'}
    ], {letters:true})) },
  { title:'Nieuwe opgave op het toestel', lvl:2, instr:'Typ de getallen in L1 (FRQ: ONE). Met "Nieuwe opgave" krijg je nieuwe getallen.',
    build:fresh(txGen, (b,st,save,key,d)=>txGenEx(b,st,save,key,d)) },
  { title:'Terugrekenen vanaf het scherm', lvl:3, instr:'Het toestel geeft n, x̄ en Σx. Met twee ervan vind je de derde.',
    build:combo(html(TXscr(['1-Var:L1','1:n=25','2:x̄=?','5:Σx=450'])), list([
      {html:'Het scherm toont n = 25 en Σx = 450. Dan is x̄ = [[0]]', check:exact(18), sol:'x̄ = Σx : n = 450 : 25 = <b>18</b>.'},
      {html:'Een ander scherm toont n = 15 en x̄ = 7,2. Dan is Σx = [[0]]', check:exact(108), sol:'Σx = x̄ · n = 7,2 · 15 = <b>108</b>.'},
      {html:'n = 12 en x̄ = 15. Je voegt nog het getal 28 toe. Het nieuwe gemiddelde is [[0]]', check:exact(16), sol:'De som was 12 · 15 = 180. Nu 180 + 28 = 208 en 208 : 13 = <b>16</b>.'},
      {html:'Klas A: n = 20 en x̄ = 14. Klas B: n = 25 en x̄ = 15,8. Het gemiddelde van alle 45 leerlingen is [[0]]', check:exact(15), sol:'20 · 14 = 280 en 25 · 15,8 = 395. (280 + 395) : 45 = 675 : 45 = <b>15</b>. Let op: het is niet (14 + 15,8) : 2.'}
    ], {letters:true})) }
);

/* ============================================================
   REKENBLAD: een klein werkend rekenblad dat eruitziet en werkt als Google Spreadsheets
   (de leerlingen werken op een Chromebook). Nederlandse functienamen, puntkomma tussen argumenten.
   ============================================================ */
(function(){
  const css = `
  .gs{ --gs-blue:#0b57d0; --gs-blue2:#1a73e8; --gs-green:#188038; --gs-bar:#f9fbfd; --gs-tool:#edf2fa; --gs-head:#f8f9fa; --gs-line:#e1e3e1; --gs-headtxt:#444746; --gs-selhead:#d3e3fd; --gs-sel:rgba(14,101,235,.10); --gs-cell:#ffffff; --gs-txt:#1f1f1f; --gs-hover:rgba(68,71,70,.08); --gs-menu:#ffffff; --gs-err:#d93025;
    border:1px solid var(--gs-line); border-radius:8px; background:var(--gs-bar); color:var(--gs-txt); font-family:Arial, "Liberation Sans", Roboto, sans-serif; font-size:14px; box-shadow:0 1px 3px rgba(60,64,67,.15); position:relative; min-width:0; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .gs{ --gs-blue:#a8c7fa; --gs-blue2:#7cacf8; --gs-green:#6dd58c; --gs-bar:#1e1f20; --gs-tool:#282a2c; --gs-head:#28292a; --gs-line:#3c4043; --gs-headtxt:#c4c7c5; --gs-selhead:#0842a0; --gs-sel:rgba(124,172,248,.18); --gs-cell:#131314; --gs-txt:#e3e3e3; --gs-hover:rgba(255,255,255,.08); --gs-menu:#2d2e30; --gs-err:#f28b82; } }
  :root[data-theme="dark"] .gs{ --gs-blue:#a8c7fa; --gs-blue2:#7cacf8; --gs-green:#6dd58c; --gs-bar:#1e1f20; --gs-tool:#282a2c; --gs-head:#28292a; --gs-line:#3c4043; --gs-headtxt:#c4c7c5; --gs-selhead:#0842a0; --gs-sel:rgba(124,172,248,.18); --gs-cell:#131314; --gs-txt:#e3e3e3; --gs-hover:rgba(255,255,255,.08); --gs-menu:#2d2e30; --gs-err:#f28b82; }
  .gs-top{ display:flex; align-items:center; gap:.6rem; padding:.45rem .7rem .1rem; }
  .gs-logo{ width:26px; height:34px; flex:none; }
  .gs-file{ display:flex; flex-direction:column; min-width:0; flex:1; }
  .gs-file .nm{ font-size:1.05rem; color:var(--gs-txt); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .gs-menu{ display:flex; flex-wrap:wrap; gap:0; margin-left:-.35rem; }
  .gs-menu > span{ position:relative; }
  .gs-menu > span > button{ font:inherit; font-size:.86rem; color:var(--gs-txt); background:transparent; border:0; border-radius:4px; padding:.12rem .4rem; cursor:pointer; }
  .gs-menu > span > button:hover, .gs-menu > span > button.on{ background:var(--gs-hover); }
  .gs-drop{ position:absolute; left:0; top:100%; z-index:30; background:var(--gs-menu); border-radius:6px; box-shadow:0 2px 6px rgba(60,64,67,.3), 0 1px 2px rgba(60,64,67,.2); padding:.35rem 0; min-width:15rem; }
  .gs-drop button{ display:flex; width:100%; align-items:center; gap:.7rem; font:inherit; font-size:.86rem; color:var(--gs-txt); background:transparent; border:0; text-align:left; padding:.35rem 1rem; cursor:pointer; white-space:nowrap; }
  .gs-drop button:hover{ background:var(--gs-hover); }
  .gs-drop button .k{ margin-left:auto; color:var(--gs-headtxt); font-size:.78rem; }
  .gs-drop hr{ border:0; border-top:1px solid var(--gs-line); margin:.3rem 0; }
  .gs-drop .lb{ padding:.2rem 1rem; font-size:.75rem; color:var(--gs-headtxt); text-transform:uppercase; letter-spacing:.05em; }
  .gs-share{ font:inherit; font-size:.86rem; font-weight:700; color:#0b57d0; background:#c2e7ff; border:0; border-radius:999px; padding:.45rem 1rem; flex:none; cursor:default; }
  .gs-tools{ display:flex; flex-wrap:wrap; align-items:center; gap:.1rem; background:var(--gs-tool); border-radius:999px; margin:.3rem .5rem .35rem; padding:.2rem .6rem; }
  .gs-tools button{ font:inherit; font-size:.86rem; color:var(--gs-txt); background:transparent; border:0; border-radius:4px; min-width:28px; height:28px; padding:0 .3rem; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:.15rem; }
  .gs-tools button:hover{ background:var(--gs-hover); }
  .gs-tools button.on{ background:var(--gs-selhead); }
  .gs-tools .sep{ width:1px; height:20px; background:var(--gs-line); margin:0 .25rem; }
  .gs-tools svg{ width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
  .gs-tools .bold{ font-weight:800; font-size:1rem; font-family:Arial, sans-serif; }
  .gs-tools .sw{ width:16px; height:12px; border:1px solid var(--gs-line); display:inline-block; border-radius:2px; }
  .gs-tools .zoom{ font-size:.82rem; color:var(--gs-headtxt); padding:0 .3rem; }
  .gs-tools .wrap{ position:relative; }
  .sh-fx{ display:flex; align-items:center; gap:.3rem; padding:.2rem .4rem; border-top:1px solid var(--gs-line); border-bottom:1px solid var(--gs-line); background:var(--gs-cell); }
  .sh-fx .nm{ width:5.5rem; text-align:left; padding:.1rem .35rem; font-size:.86rem; font-variant-numeric:tabular-nums; border-right:1px solid var(--gs-line); }
  .sh-fx .fx{ font-style:italic; font-family:Georgia, serif; color:var(--gs-headtxt); padding:0 .3rem; }
  .sh-fx input{ flex:1; font:inherit; font-size:.9rem; padding:.15rem .4rem; border:0; background:var(--gs-cell); color:var(--gs-txt); min-width:0; }
  .sh-fx input:focus{ outline:none; }
  .sh-grid:focus{ outline:none; }
  .sh-grid{ overflow:auto; max-height:460px; position:relative; background:var(--gs-cell); }
  .sh-grid table{ border-collapse:collapse; font-variant-numeric:tabular-nums; user-select:none; -webkit-user-select:none; table-layout:fixed; }
  .sh-grid th{ background:var(--gs-head); color:var(--gs-headtxt); font-weight:400; font-size:.75rem; border:1px solid var(--gs-line); padding:.1rem .3rem; position:sticky; top:0; z-index:2; width:6.2rem; }
  .sh-grid th.rh{ position:sticky; left:0; z-index:1; width:2.6rem; text-align:center; }
  .sh-grid thead th.rh{ z-index:3; }
  .sh-grid th.on{ background:var(--gs-selhead); color:var(--gs-txt); font-weight:700; }
  .sh-grid th .rz{ position:absolute; right:-3px; top:0; bottom:0; width:7px; cursor:col-resize; z-index:4; }
  .sh-grid td{ border:1px solid var(--gs-line); padding:0 .3rem; height:1.45rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:.86rem; cursor:cell; position:relative; background:var(--gs-cell); color:var(--gs-txt); }
  .sh-grid td.num{ text-align:right; }
  .sh-grid td.err{ color:var(--gs-txt); text-align:left; }
  .sh-grid td.err::after{ content:""; position:absolute; right:0; top:0; border-style:solid; border-width:0 7px 7px 0; border-color:transparent var(--gs-err) transparent transparent; }
  .sh-grid td.sel{ background-image:linear-gradient(var(--gs-sel), var(--gs-sel)); }
  .sh-grid td.act{ outline:2px solid var(--gs-blue2); outline-offset:-2px; }
  .sh-grid td.ref{ outline:2px dashed var(--gs-blue2); outline-offset:-2px; }
  .sh-grid td .handle{ position:absolute; right:-1px; bottom:-1px; width:7px; height:7px; background:var(--gs-blue2); border:1px solid var(--gs-cell); border-radius:50%; cursor:crosshair; z-index:3; }
  .sh-grid td input{ position:absolute; inset:0; width:100%; height:100%; border:2px solid var(--gs-blue2); font:inherit; padding:0 .25rem; background:var(--gs-cell); color:var(--gs-txt); box-sizing:border-box; box-shadow:0 2px 6px rgba(60,64,67,.3); }
  .sh-grid td input:focus{ outline:none; }
  .xl-ac{ position:absolute; z-index:20; background:var(--gs-menu); border-radius:6px; box-shadow:0 2px 6px rgba(60,64,67,.3); font-size:.82rem; min-width:16rem; max-height:13rem; overflow:auto; padding:.25rem 0; }
  .xl-ac div{ padding:.3rem .7rem; cursor:pointer; display:flex; flex-direction:column; gap:.05rem; }
  .xl-ac div b{ font-weight:700; }
  .xl-ac div span{ color:var(--gs-headtxt); font-size:.75rem; }
  .xl-ac div.on, .xl-ac div:hover{ background:var(--gs-hover); }
  .gs-help{ position:absolute; z-index:19; background:var(--gs-menu); border-radius:6px; box-shadow:0 2px 6px rgba(60,64,67,.3); font-size:.82rem; padding:.4rem .7rem; max-width:22rem; }
  .gs-help code{ font-family:"Roboto Mono", Consolas, monospace; font-size:.82rem; }
  .xl-sheets{ display:flex; align-items:center; gap:.2rem; background:var(--gs-bar); border-top:1px solid var(--gs-line); font-size:.82rem; padding:.2rem .5rem; }
  .xl-sheets .ic{ color:var(--gs-headtxt); padding:0 .4rem; font-size:1rem; }
  .xl-sheets .gs-tab{ background:var(--gs-selhead); color:var(--gs-blue); font-weight:700; border-radius:6px; padding:.25rem .8rem; }
  .xl-sheets .agg{ margin-left:auto; display:flex; gap:.6rem; font-variant-numeric:tabular-nums; }
  .xl-sheets .agg span{ background:var(--gs-cell); border:1px solid var(--gs-line); border-radius:6px; padding:.15rem .6rem; }
  .sh-chart{ border-top:1px solid var(--gs-line); padding:.6rem; background:var(--gs-bar); display:flex; flex-wrap:wrap; gap:.8rem; align-items:flex-start; }
  .sh-chart .xlc{ flex:1 1 380px; min-width:0; max-width:640px; background:var(--gs-cell); border:1px solid var(--gs-line); border-radius:4px; padding:.4rem; }
  .sh-chart .xlc.on{ outline:2px solid var(--gs-blue2); }
  .sh-chart .xlc .ch .bar{ fill:#4285f4; } .sh-chart .xlc .ch .ln{ stroke:#4285f4; } .sh-chart .xlc .ch .pt{ fill:#4285f4; } .sh-chart .xlc .ch .ln2{ stroke:#ea4335; } .sh-chart .xlc .ch .pt.or{ fill:#ea4335; }
  .sh-chart .xlc .ch .gr{ stroke:var(--gs-line); }
  .gs-ed{ flex:0 1 270px; min-width:230px; background:var(--gs-cell); border:1px solid var(--gs-line); border-radius:8px; font-size:.84rem; }
  .gs-ed .hd{ display:flex; align-items:center; justify-content:space-between; padding:.5rem .7rem; font-size:.95rem; }
  .gs-ed .hd button{ font:inherit; background:transparent; border:0; color:var(--gs-headtxt); cursor:pointer; font-size:1rem; }
  .gs-ed .tb{ display:flex; border-bottom:1px solid var(--gs-line); }
  .gs-ed .tb button{ flex:1; font:inherit; font-size:.84rem; background:transparent; border:0; border-bottom:3px solid transparent; padding:.4rem; color:var(--gs-headtxt); cursor:pointer; }
  .gs-ed .tb button.on{ color:var(--gs-blue); border-bottom-color:var(--gs-blue); font-weight:700; }
  .gs-ed .pn{ padding:.6rem .7rem; display:flex; flex-direction:column; gap:.55rem; }
  .gs-ed label{ display:flex; flex-direction:column; gap:.2rem; color:var(--gs-headtxt); font-size:.78rem; }
  .gs-ed input, .gs-ed select{ font:inherit; font-size:.86rem; color:var(--gs-txt); background:var(--gs-cell); border:1px solid var(--gs-line); border-radius:4px; padding:.3rem .4rem; }
  .gs-ed details{ border-top:1px solid var(--gs-line); padding-top:.4rem; }
  .gs-ed summary{ cursor:pointer; color:var(--gs-txt); font-weight:700; padding:.15rem 0; }
  .gs-ed details > div{ display:flex; flex-direction:column; gap:.5rem; padding:.4rem 0 .2rem; }
  .gs-ed .del{ font:inherit; font-size:.82rem; background:transparent; border:1px solid var(--gs-line); border-radius:999px; color:var(--gs-txt); padding:.3rem .8rem; cursor:pointer; align-self:flex-start; }
  .sh-msg{ font-size:.82rem; padding:.25rem .6rem; color:var(--gs-headtxt); min-height:1.4em; background:var(--gs-cell); }
  .sh-msg.bad{ color:var(--gs-err); font-weight:700; }
  .rb-task{ display:grid; grid-template-columns:minmax(0,1fr) minmax(240px, 300px); gap:1rem; align-items:start; }
  .rb-task .rb-opd{ position:sticky; top:4.5rem; }
  .rb-task .rb-opd h4{ margin:0 0 .3rem; }
  @media (max-width: 1000px){ .rb-task{ grid-template-columns:minmax(0,1fr); } .rb-task .rb-opd{ position:static; } }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* ---------- celadressen ---------- */
const colName = i => { let s=''; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26); } return s; };
const colIdx = s => { let n=0; for(const ch of s) n = n*26 + (ch.charCodeAt(0)-64); return n-1; };
const parseRef = r => { const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(String(r).toUpperCase()); return m ? {c:colIdx(m[1]), r:+m[2]-1} : null; };
const refName = (c,r) => colName(c)+(r+1);
function rangeCells(a, b){ const p=parseRef(a), q=parseRef(b); const out=[]; for(let r=Math.min(p.r,q.r); r<=Math.max(p.r,q.r); r++) for(let c=Math.min(p.c,q.c); c<=Math.max(p.c,q.c); c++) out.push(refName(c,r)); return out; }

/* ---------- formules ---------- */
const FERR = e => ({err:e});
const isErr = v => v && typeof v==='object' && 'err' in v;
function tokenize(src){
  const t = []; let i = 0;
  while(i<src.length){
    const ch = src[i];
    if(/\s/.test(ch)){ i++; continue; }
    if(ch==='"'){ let j=i+1, s=''; while(j<src.length && src[j]!=='"'){ s+=src[j]; j++; } if(j>=src.length) throw '#WAARDE!'; t.push({k:'str', v:s}); i=j+1; continue; }
    if(/[0-9]/.test(ch) || (ch==='.' && /[0-9]/.test(src[i+1]||''))){
      let m = /^\d*(?:[.,]\d+)?/.exec(src.slice(i))[0];
      t.push({k:'num', v:Number(m.replace(',','.'))}); i+=m.length; continue; }
    const mref = /^\$?[A-Za-z]{1,2}\$?\d+(?::\$?[A-Za-z]{1,2}\$?\d+)?/.exec(src.slice(i));
    const mfun = /^[A-Za-z][A-Za-z0-9.]*(?=\s*\()/.exec(src.slice(i));
    if(mfun){ t.push({k:'fn', v:mfun[0].toUpperCase()}); i+=mfun[0].length; continue; }
    if(mref){ t.push({k:'ref', v:mref[0].toUpperCase().replace(/\$/g,'')}); i+=mref[0].length; continue; }
    if(/[A-Za-z]/.test(ch)){ const w=/^[A-Za-z_]+/.exec(src.slice(i))[0]; t.push({k:'name', v:w}); i+=w.length; continue; }
    if('+-*/^()%;,&'.includes(ch)){ t.push({k:'op', v:ch}); i++; continue; }
    if(ch==='<'||ch==='>'||ch==='='){ let o=ch; if((src[i+1]==='='||src[i+1]==='>') && ch!=='=') { o+=src[i+1]; i++; } t.push({k:'op', v:o}); i++; continue; }
    throw '#NAAM?';
  }
  return t;
}
const FN_ALIAS = {SUM:'SOM', AVERAGE:'GEMIDDELDE', MEDIAN:'MEDIAAN', MODE:'MODUS', 'MODE.SNGL':'MODUS', 'MODUS.ENKELV':'MODUS', COUNT:'AANTAL', COUNTIF:'AANTAL.ALS', ROUND:'AFRONDEN', COUNTA:'AANTALARG'};
function numsOf(args){ const out=[]; args.forEach(a=>{ if(Array.isArray(a)) a.forEach(x=>{ if(typeof x==='number') out.push(x); else if(isErr(x)) throw x.err; }); else if(isErr(a)) throw a.err; else if(typeof a==='number') out.push(a); else if(typeof a==='string' && a!==''){ const n=Number(a.replace(',','.')); if(isNaN(n)) throw '#WAARDE!'; out.push(n); } }); return out; }
function critMatch(x, c){
  if(typeof c==='number') return typeof x==='number' && x===c;
  const s = String(c).trim(); const m = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(s); const op = m[1]||'=', rhs = m[2];
  const rn = Number(rhs.replace(',','.'));
  if(rhs!=='' && !isNaN(rn) && typeof x==='number'){ return op==='='?x===rn: op==='<>'?x!==rn: op==='<'?x<rn: op==='>'?x>rn: op==='<='?x<=rn: x>=rn; }
  const xs = String(x??'').toLowerCase(), r = rhs.toLowerCase();
  return op==='<>' ? xs!==r : op==='=' ? xs===r : false;
}
const FUNCS = {
  SOM: a => sum(numsOf(a)),
  GEMIDDELDE: a => { const n=numsOf(a); if(!n.length) throw '#DEEL/0!'; return mean(n); },
  MEDIAAN: a => { const n=numsOf(a); if(!n.length) throw '#GETAL!'; return median(n); },
  MODUS: a => { const n=numsOf(a); const c=new Map(); n.forEach(x=>c.set(x,(c.get(x)||0)+1)); const m=Math.max(0,...c.values()); if(m<2) throw '#N/B'; return n.find(x=>c.get(x)===m); },
  MAX: a => { const n=numsOf(a); return n.length? Math.max(...n) : 0; },
  MIN: a => { const n=numsOf(a); return n.length? Math.min(...n) : 0; },
  AANTAL: a => numsOf(a).length,
  AANTALARG: a => a.flat().filter(x=>x!=='' && x!=null).length,
  'AANTAL.ALS': a => { if(a.length!==2) throw '#WAARDE!'; const r = Array.isArray(a[0])?a[0]:[a[0]]; return r.filter(x=>critMatch(x, a[1])).length; },
  AFRONDEN: a => { const x=numsOf([a[0]])[0], d=a.length>1?numsOf([a[1]])[0]:0; const f=Math.pow(10,d); return Math.round(x*f)/f; },
  ABS: a => Math.abs(numsOf([a[0]])[0])
};
function makeEval(getRaw){
  const cache = {}, busy = {};
  function cellVal(ref){
    if(ref in cache) return cache[ref];
    const raw = getRaw(ref);
    let v;
    if(raw==null || raw==='') v = '';
    else if(String(raw).startsWith('=')){
      if(busy[ref]) return FERR('#VERW!');
      busy[ref] = true;
      try{ v = evalFormula(String(raw).slice(1)); }catch(e){ v = FERR(typeof e==='string'? e : (isErr(e)? e.err : '#WAARDE!')); }
      busy[ref] = false;
    } else {
      const t = String(raw).trim(); const n = Number(t.replace(/\s/g,'').replace(',','.'));
      v = (t!=='' && !isNaN(n) && /^[-+]?[\d\s]*[.,]?\d+%?$/.test(t.replace('%',''))) ? n : t;
    }
    cache[ref] = v; return v;
  }
  function evalFormula(src){
    const T = tokenize(src); let p = 0;
    const peek = () => T[p], take = () => T[p++];
    const isOp = (v) => T[p] && T[p].k==='op' && T[p].v===v;
    function num(x){ if(isErr(x)) throw x.err; if(Array.isArray(x)) throw '#WAARDE!'; if(x==='') return 0; if(typeof x==='number') return x; const n=Number(String(x).replace(',','.')); if(isNaN(n)) throw '#WAARDE!'; return n; }
    function expr(){ let a = term(); while(isOp('+')||isOp('-')){ const o=take().v; const b=term(); a = o==='+'? num(a)+num(b) : num(a)-num(b); } return a; }
    function term(){ let a = power(); while(isOp('*')||isOp('/')){ const o=take().v; const b=power(); if(o==='*') a=num(a)*num(b); else { if(num(b)===0) throw '#DEEL/0!'; a=num(a)/num(b); } } return a; }
    function power(){ let a = unary(); while(isOp('^')){ take(); a = Math.pow(num(a), num(unary())); } return a; }
    function unary(){ if(isOp('-')){ take(); return -num(unary()); } if(isOp('+')){ take(); return num(unary()); } let a = primary(); if(isOp('%')){ take(); a = num(a)/100; } return a; }
    function primary(){
      const t = take(); if(!t) throw '#WAARDE!';
      if(t.k==='num') return t.v;
      if(t.k==='str') return t.v;
      if(t.k==='ref'){ if(t.v.includes(':')){ const [a,b]=t.v.split(':'); return rangeCells(a,b).map(cellVal); } return cellVal(t.v); }
      if(t.k==='fn'){
        const name = FN_ALIAS[t.v] || t.v; const f = FUNCS[name]; if(!f) throw '#NAAM?';
        if(!isOp('(')) throw '#NAAM?'; take();
        const args = [];
        if(!isOp(')')){ args.push(expr()); while(isOp(';')||isOp(',')){ take(); args.push(expr()); } }
        if(!isOp(')')) throw '#WAARDE!'; take();
        return f(args);
      }
      if(t.k==='op' && t.v==='('){ const v = expr(); if(!isOp(')')) throw '#WAARDE!'; take(); return v; }
      if(t.k==='name') throw '#NAAM?';
      throw '#WAARDE!';
    }
    const v = expr(); if(p<T.length) throw '#WAARDE!';
    if(Array.isArray(v)) return v[0] ?? 0;
    return v;
  }
  return cellVal;
}
/* formule kopiëren: relatieve verwijzingen verschuiven */
function shiftFormula(f, dc, dr){
  if(!String(f).startsWith('=')) return f;
  return String(f).split('"').map((part,i)=> i%2 ? part : part.replace(/(\$?)([A-Za-z]{1,2})(\$?)(\d+)(?![A-Za-z0-9.(])/g, (m,a,c,b,r, off, whole)=>{
    const prev = whole[off-1]; if(prev && /[A-Za-z.]/.test(prev)) return m;
    const nc = a ? colIdx(c.toUpperCase()) : colIdx(c.toUpperCase())+dc, nr = b ? +r : +r+dr;
    if(nc<0 || nr<1) return '#VERW!';
    return a+colName(nc)+b+nr; })).join('"');
}

/* ---------- het rekenblad zelf ---------- */
const RB_ICON = {
  kolom:'<path d="M3 20h18"/><rect x="5" y="11" width="3" height="9"/><rect x="10.5" y="6" width="3" height="14"/><rect x="16" y="14" width="3" height="6"/>',
  staaf:'<path d="M4 3v18"/><rect x="4" y="5" width="9" height="3"/><rect x="4" y="10.5" width="14" height="3"/><rect x="4" y="16" width="6" height="3"/>',
  lijn:'<path d="M3 20h18M3 20V4"/><path d="M5 16l4-5 4 3 6-8"/>',
  cirkel:'<circle cx="12" cy="12" r="8.5"/><path d="M12 12V3.5M12 12l6.5 5.5"/>',
  strook:'<rect x="3" y="8" width="18" height="8"/><path d="M10 8v8M15 8v8"/>'
};
const RB_NAMES = {kolom:'Kolomdiagram', staaf:'Staafdiagram', lijn:'Lijndiagram', cirkel:'Cirkeldiagram', strook:'100% gestapeld staafdiagram'};
const RB_FUNCS = ['SOM','GEMIDDELDE','MEDIAAN','MODUS','MIN','MAX','AANTAL','AANTAL.ALS','AFRONDEN'];
const GS_LOGO = '<svg class="gs-logo" viewBox="0 0 26 34" aria-hidden="true"><path d="M3 0h14l9 9v22a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3z" fill="#0f9d58"/><path d="M17 0v6a3 3 0 0 0 3 3h6z" fill="#87ceac"/><rect x="5.5" y="14" width="15" height="12" rx="1" fill="#fff"/><path d="M5.5 18h15M5.5 22h15M11 14v12" stroke="#0f9d58" stroke-width="1.4"/></svg>';
const GS_SVG = {
  pct:'<span class="bold">%</span>', decm:'<span style="font-size:.8rem">.0<sub>←</sub></span>', decp:'<span style="font-size:.8rem">.00<sub>→</sub></span>',
  fill:'<svg viewBox="0 0 24 24"><path d="M5 12l7-7 7 7-7 7z"/><path d="M19 15c0 1.5 1 2.5 1 3.5a1 1 0 0 1-2 0c0-1 1-2 1-3.5z"/></svg>',
  sum:'<span class="bold">Σ</span>', chart:'<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8 16v-4M12 16V8M16 16v-6"/></svg>'
};
function makeSheet(parent, opts){
  const nC = opts.cols || 6, nR = opts.rows || 14;
  const st = opts.state; st.c = st.c || {}; st.dec = st.dec || {};
  const given = new Set(opts.given || []);
  st.fmt = st.fmt || {}; st.w = st.w || {};
  const root = el('div','sheet gs'); parent.append(root);
  const FILLS = [['', 'Geen'], ['#fff2cc','Lichtgeel'], ['#d9ead3','Lichtgroen'], ['#cfe2f3','Lichtblauw'], ['#fce5cd','Lichtoranje']];
  /* menubalk zoals in Google Spreadsheets */
  const MENUS = [
    ['Bestand', [['act','xlsx','Downloaden als Microsoft Excel (.xlsx)']]],
    ['Bewerken', [['clear','1','Waarden wissen','Delete']]],
    ['Weergave', []],
    ['Invoegen', [['ch','kolom','Diagram'], ['hr'], ['lb','Functie'], ...RB_FUNCS.map(f=>['fn',f,f])]],
    ['Opmaak', [['act','bold','Vet','Ctrl+B'], ['act','pct','Getal: percentage'], ['dec','1','Meer decimalen'], ['dec','-1','Minder decimalen']]],
    ['Gegevens', []], ['Tools', []], ['Extensies', []], ['Help', []]
  ];
  const item = ([k,v,t,kb]) => k==='hr' ? '<hr>' : k==='lb' ? `<div class="lb">${v}</div>` : `<button type="button" data-${k}="${v}">${t}${kb?`<span class="k">${kb}</span>`:''}</button>`;
  const top = el('div','gs-top', `${GS_LOGO}<div class="gs-file"><span class="nm">${opts.file||'Naamloze spreadsheet'}</span><div class="gs-menu">${MENUS.map(([m,its])=>`<span><button type="button" data-menu="${m}">${m}</button><div class="gs-drop" hidden>${its.length ? its.map(item).join('') : '<div class="lb">Niet nodig in deze oefening</div>'}</div></span>`).join('')}</div></div><button type="button" class="gs-share" tabindex="-1">Delen</button>`);
  const tools = el('div','gs-tools', `<span class="zoom">100%</span><span class="sep"></span>
    <button type="button" data-act="pct" title="Opmaken als percentage">${GS_SVG.pct}</button><button type="button" data-dec="-1" title="Minder decimalen">${GS_SVG.decm}</button><button type="button" data-dec="1" title="Meer decimalen">${GS_SVG.decp}</button><span class="sep"></span>
    <button type="button" data-act="bold" title="Vet (Ctrl+B)"><span class="bold">B</span></button>
    <span class="wrap"><button type="button" data-menu="fill" title="Opvulkleur">${GS_SVG.fill}</button><div class="gs-drop" hidden>${FILLS.map(([c,n])=>`<button type="button" data-fill="${c}"><span class="sw" style="background:${c||'transparent'}"></span>${n}</button>`).join('')}</div></span><span class="sep"></span>
    <span class="wrap"><button type="button" data-menu="fx" title="Functies">${GS_SVG.sum}</button><div class="gs-drop" hidden>${RB_FUNCS.map(f=>`<button type="button" data-fn="${f}">${f}</button>`).join('')}</div></span>
    <button type="button" data-ch="kolom" title="Diagram invoegen">${GS_SVG.chart}</button>`);
  const closeDrops = () => root.querySelectorAll('.gs-drop').forEach(d=>{ d.hidden = true; d.previousElementSibling && d.previousElementSibling.classList.remove('on'); });
  root.addEventListener('click', e=>{ const m = e.target.closest('[data-menu]'); if(!m) return; const d = m.nextElementSibling; const open = d.hidden; closeDrops(); d.hidden = !open; m.classList.toggle('on', open); });
  document.addEventListener('pointerdown', e=>{ if(!e.target.closest || !e.target.closest('.gs-menu, .gs-tools .wrap')) closeDrops(); });
  const fxRow = el('div','sh-fx', `<span class="nm">A1</span><span class="fx">fx</span><input type="text" spellcheck="false" autocomplete="off" aria-label="formulebalk">`);
  const gridBox = el('div','sh-grid'); const msg = el('div','sh-msg');
  const sheets = el('div','xl-sheets', '<span class="ic" title="Blad toevoegen">+</span><span class="ic" title="Alle bladen">☰</span><span class="gs-tab">Blad1 ▾</span><span class="agg"></span>');
  const status = sheets;
  const chartBox = el('div','sh-chart'); chartBox.hidden = true;
  const bar = root;
  root.append(top, tools, fxRow, gridBox, msg, sheets, chartBox);
  const rib = tools;
  const nameBox = fxRow.querySelector('.nm'), fx = fxRow.querySelector('input');
  let act = {c:0, r:0}, anc = {c:0, r:0}, editing = null, refPick = null;
  const getRaw = ref => st.c[ref];
  let val = makeEval(getRaw);
  const tbl = document.createElement('table'); gridBox.append(tbl);
  let h = '<thead><tr><th class="rh"></th>'; for(let c=0;c<nC;c++) h += `<th data-col="${c}">${colName(c)}</th>`; h += '</tr></thead><tbody>';
  for(let r=0;r<nR;r++){ h += `<tr><th class="rh" data-row="${r}">${r+1}</th>`; for(let c=0;c<nC;c++) h += `<td data-c="${c}" data-r="${r}"></td>`; h += '</tr>'; }
  tbl.innerHTML = h + '</tbody>';
  const tds = {}; tbl.querySelectorAll('td').forEach(td=>tds[refName(+td.dataset.c, +td.dataset.r)] = td);
  const colW = c => { const th = tbl.querySelector(`th[data-col="${c}"]`); if(st.w[c]) th.style.width = st.w[c]+'px'; };
  tbl.querySelectorAll('th[data-col]').forEach(th=>{ const c=+th.dataset.col; const rz=el('span','rz'); rz.title='sleep om de kolom breder of smaller te maken'; th.append(rz); colW(c);
    rz.addEventListener('pointerdown', e=>{ e.preventDefault(); e.stopPropagation(); const x0=e.clientX, w0=th.getBoundingClientRect().width;
      const mv = ev=>{ st.w[c] = Math.max(40, Math.min(360, Math.round(w0 + ev.clientX - x0))); th.style.width = st.w[c]+'px'; };
      const up = ()=>{ document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); opts.save(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); });
    rz.addEventListener('dblclick', e=>{ e.stopPropagation(); let m=40; Object.entries(tds).forEach(([ref,td])=>{ if(parseRef(ref).c===c) m=Math.max(m, td.scrollWidth+8); }); st.w[c]=Math.min(360,m); th.style.width=st.w[c]+'px'; opts.save(); }); });
  const selBox = () => ({c0:Math.min(act.c,anc.c), c1:Math.max(act.c,anc.c), r0:Math.min(act.r,anc.r), r1:Math.max(act.r,anc.r)});
  const selRange = () => { const s=selBox(); return refName(s.c0,s.r0)+':'+refName(s.c1,s.r1); };
  function paint(){
    val = makeEval(getRaw);
    const s = selBox();
    Object.entries(tds).forEach(([ref,td])=>{
      if(editing && editing.ref===ref) return;
      const v = val(ref), p = parseRef(ref);
      const dec = st.dec[ref];
      td.textContent = isErr(v) ? v.err : (typeof v==='number' ? nf(v, dec!=null?dec:6).replace(/^(.*,\d*?)$/, m=>m) : v);
      if(typeof v==='number' && dec!=null && dec>0){ let t=nf(v,dec); const k=t.indexOf(','); const have = k<0?0:t.length-k-1; if(have<dec) t = (k<0? t+',' : t) + '0'.repeat(dec-have); td.textContent = t; }
      const fm = st.fmt[ref] || {};
      if(fm.pct && typeof v==='number'){ const d2 = dec!=null?dec:0; td.textContent = nf(v*100, d2).replace(/^(-?[\d ]+)$/, m=>d2>0? m+','+'0'.repeat(d2) : m) + '%'; }
      td.style.fontWeight = (fm.b || given.has(ref)) ? '700' : ''; td.style.background = fm.fill || '';
      td.className = (typeof v==='number'?'num ':'') + (isErr(v)?'err ':'') + (given.has(ref)?'given ':'') + (p.c>=s.c0&&p.c<=s.c1&&p.r>=s.r0&&p.r<=s.r1&&(s.c0!==s.c1||s.r0!==s.r1)?'sel ':'') + (p.c===act.c&&p.r===act.r?'act':'');
    });
    tbl.querySelectorAll('th[data-col]').forEach(th=>th.classList.toggle('on', +th.dataset.col>=s.c0 && +th.dataset.col<=s.c1));
    tbl.querySelectorAll('th[data-row]').forEach(th=>th.classList.toggle('on', +th.dataset.row>=s.r0 && +th.dataset.row<=s.r1));
    const a = tds[refName(act.c, act.r)];
    if(!editing){ const hd = el('span','handle'); hd.title='vulgreep: sleep om door te trekken'; tds[refName(s.c1,s.r1)].append(hd); }
    nameBox.textContent = (s.c0!==s.c1||s.r0!==s.r1) ? selRange() : refName(act.c, act.r);
    { const nums=[]; let cnt=0; for(let r=s.r0;r<=s.r1;r++) for(let c=s.c0;c<=s.c1;c++){ const x=val(refName(c,r)); if(x!==''&&x!=null&&!isErr(x)) cnt++; if(typeof x==='number') nums.push(x); }
      status.querySelector('.agg').innerHTML = (cnt>1) ? (nums.length ? `<span>Som: ${nf(sum(nums),6)}</span><span>Gemiddelde: ${nf(mean(nums),6)}</span>` : `<span>Aantal: ${cnt}</span>`) : ''; }
    rib.querySelectorAll('[data-act=bold]').forEach(b=>b.classList.toggle('on', !!(st.fmt[refName(act.c,act.r)]||{}).b));
    if(!editing && document.activeElement!==fx) fx.value = st.c[refName(act.c,act.r)] ?? '';
    const av = val(refName(act.c,act.r));
    msg.className = 'sh-msg' + (isErr(av)?' bad':'');
    msg.textContent = isErr(av) ? errExplain(av.err) : '';
    drawChartPanel();
    if(opts.onChange) opts.onChange();
  }
  function errExplain(e){ return ({'#NAAM?':'#NAAM? Spreadsheets kent deze functie of naam niet. Controleer de schrijfwijze (bv. SOM, GEMIDDELDE, MEDIAAN, MODUS, AANTAL.ALS).', '#DEEL/0!':'#DEEL/0! Je deelt door 0 (of door een lege cel).', '#WAARDE!':'#WAARDE! Er klopt iets niet in de formule: rekenen met tekst, of een haakje of puntkomma te veel of te weinig.', '#VERW!':'#VERW! De formule verwijst naar zichzelf of naar een cel die niet bestaat.', '#N/B':'#N/B Er is geen modus: geen enkel getal komt meer dan één keer voor.', '#GETAL!':'#GETAL! Er zijn geen getallen om mee te rekenen.'})[e] || e; }
  function setCell(ref, raw){ if(given.has(ref) && opts.lockGiven) return; if(raw===''||raw==null) delete st.c[ref]; else st.c[ref] = raw; opts.save(); }
  function startEdit(initial, keepRaw){
    const ref = refName(act.c, act.r); if(given.has(ref) && opts.lockGiven){ msg.className='sh-msg'; msg.textContent='Deze cel is gegeven en kan je niet wijzigen.'; return; }
    anc = {...act}; editing = {ref}; paint();
    const td = tds[ref]; td.textContent='';
    const inp = document.createElement('input'); inp.type='text'; inp.spellcheck=false; inp.value = keepRaw ? (st.c[ref] ?? '') : (initial ?? '');
    td.append(inp); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
    editing.inp = inp;
    fx.value = inp.value;
    inp.addEventListener('input', ()=>{ fx.value = inp.value; refPick = null; acShow(inp); helpShow(inp); });
    inp.addEventListener('keydown', e=>{
      if(ac && !ac.hidden && (e.key==='ArrowDown'||e.key==='ArrowUp')){ e.preventDefault(); acMove(e.key==='ArrowDown'?1:-1); return; }
      if(ac && !ac.hidden && e.key==='Tab'){ e.preventDefault(); acPick(); return; }
      if(e.key==='Enter'){ e.preventDefault(); commit(); move(0,1); }
      else if(e.key==='Tab'){ e.preventDefault(); commit(); move(1,0); }
      else if(e.key==='Escape'){ e.preventDefault(); cancel(); }
      else if((e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='ArrowLeft'||e.key==='ArrowRight') && !inp.value.startsWith('=')){ e.preventDefault(); commit(); move(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0, e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0); }
    });
  }
  /* functievoorstellen tijdens het typen, zoals in Excel */
  const FN_HELP = {SOM:'telt getallen op', GEMIDDELDE:'het rekenkundig gemiddelde', MEDIAAN:'het middelste getal', MODUS:'het getal dat het vaakst voorkomt', MAX:'het grootste getal', MIN:'het kleinste getal', AANTAL:'telt de cellen met een getal', AANTALARG:'telt de niet-lege cellen', 'AANTAL.ALS':'telt de cellen die voldoen aan een voorwaarde', AFRONDEN:'rondt af op een aantal decimalen', ABS:'de absolute waarde'};
  let ac = null, acI = 0, acList = [];
  function acShow(inp){
    const m = /^=.*?([A-Za-z][A-Za-z.]*)$/.exec(inp.value);
    if(!m || /[A-Za-z]\d/.test(m[1])){ if(ac) ac.hidden = true; return; }
    const pre = m[1].toUpperCase(); acList = Object.keys(FN_HELP).filter(f=>f.startsWith(pre));
    if(!acList.length){ if(ac) ac.hidden = true; return; }
    if(!ac){ ac = el('div','xl-ac'); root.style.position='relative'; root.append(ac); ac.addEventListener('pointerdown', e=>{ const d=e.target.closest('[data-f]'); if(!d) return; e.preventDefault(); acI = +d.dataset.i; acPick(); }); }
    acI = 0; ac.hidden = false; ac.dataset.pre = pre;
    ac.innerHTML = acList.map((f,i)=>`<div data-f="${f}" data-i="${i}" class="${i===0?'on':''}"><b>${f}</b><span>${FN_HELP[f]}</span></div>`).join('');
    const r = inp.getBoundingClientRect(), R = root.getBoundingClientRect(); ac.style.left = (r.left-R.left)+'px'; ac.style.top = (r.bottom-R.top+2)+'px';
  }
  /* formulehulp: de schrijfwijze van de functie waarin je typt, zoals in Google Spreadsheets */
  const FN_SYN = {SOM:'SOM(waarde1; [waarde2; ...])', GEMIDDELDE:'GEMIDDELDE(waarde1; [waarde2; ...])', MEDIAAN:'MEDIAAN(waarde1; [waarde2; ...])', MODUS:'MODUS(waarde1; [waarde2; ...])', MAX:'MAX(waarde1; [waarde2; ...])', MIN:'MIN(waarde1; [waarde2; ...])', AANTAL:'AANTAL(waarde1; [waarde2; ...])', AANTALARG:'AANTALARG(waarde1; [waarde2; ...])', 'AANTAL.ALS':'AANTAL.ALS(bereik; criterium)', AFRONDEN:'AFRONDEN(waarde; [aantal_decimalen])', ABS:'ABS(waarde)'};
  let help = null;
  function helpShow(inp){
    const v = inp.value.replace(/"[^"]*"/g, '""'); let depth = 0, fn = null;
    for(let i=v.length-1;i>=0;i--){ if(v[i]===')') depth++; else if(v[i]==='('){ if(depth) depth--; else { const m = /([A-Za-z][A-Za-z.]*)$/.exec(v.slice(0,i)); fn = m ? m[1].toUpperCase() : null; break; } } }
    if(!v.startsWith('=') || !fn || !FN_SYN[FN_ALIAS[fn]||fn] || (ac && !ac.hidden)){ if(help) help.hidden = true; return; }
    if(!help){ help = el('div','gs-help'); root.append(help); }
    const f = FN_ALIAS[fn]||fn; help.hidden = false; help.innerHTML = `<code>${FN_SYN[f]}</code><br>${FN_HELP[f]||''}`;
    const r = inp.getBoundingClientRect(), R = root.getBoundingClientRect(); help.style.left = (r.left-R.left)+'px'; help.style.top = (r.bottom-R.top+2)+'px';
  }
  function acMove(d){ acI = (acI + d + acList.length) % acList.length; [...ac.children].forEach((c,i)=>c.classList.toggle('on', i===acI)); }
  function acPick(){ if(!editing || !ac) return; const inp = editing.inp; const pre = ac.dataset.pre; inp.value = inp.value.slice(0, inp.value.length - pre.length) + acList[acI] + '('; fx.value = inp.value; ac.hidden = true; inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); helpShow(inp); }
  function insertFn(f){
    const s0 = selBox();
    if(!editing){ startEdit('', false); if(!editing) return; }
    const inp = editing.inp; let v = inp.value; if(!v.startsWith('=')) v = '=';
    let arg = '';
    if(f==='SOM' && v==='='){ /* AutoSom: neem de getallen boven (of links van) de actieve cel */
      let r = act.r-1; while(r>=0 && typeof val(refName(act.c,r))==='number') r--; if(r<act.r-1) arg = refName(act.c,r+1)+':'+refName(act.c,act.r-1);
      else { let c = act.c-1; while(c>=0 && typeof val(refName(c,act.r))==='number') c--; if(c<act.c-1) arg = refName(c+1,act.r)+':'+refName(act.c-1,act.r); } }
    inp.value = v + f + '(' + arg + (arg?')':''); fx.value = inp.value; inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
    msg.className='sh-msg'; msg.textContent = arg ? `AutoSom koos ${arg}. Klopt het bereik? Druk dan op Enter.` : `${f}: ${FN_HELP[f]||''}. Sleep over de cellen of typ het bereik, sluit met ) en druk op Enter.`;
  }
  function commit(){ if(!editing) return; if(ac) ac.hidden = true; if(help) help.hidden = true; let raw = editing.inp.value; if(raw.startsWith('=')){ const open = (raw.replace(/"[^"]*"/g,'').match(/\(/g)||[]).length - (raw.replace(/"[^"]*"/g,'').match(/\)/g)||[]).length; if(open>0) raw += ')'.repeat(open); } const ref = editing.ref; editing = null; refPick = null; setCell(ref, raw.trim()===''?'':raw); paint(); gridBox.focus({preventScroll:true}); }
  function cancel(){ if(ac) ac.hidden = true; if(help) help.hidden = true; editing = null; refPick = null; paint(); gridBox.focus({preventScroll:true}); }
  function move(dc, dr, extend){ act = {c:Math.max(0,Math.min(nC-1,act.c+dc)), r:Math.max(0,Math.min(nR-1,act.r+dr))}; if(!extend) anc = {...act}; paint(); tds[refName(act.c,act.r)].scrollIntoView({block:'nearest', inline:'nearest'}); }
  gridBox.tabIndex = 0;
  gridBox.addEventListener('keydown', e=>{
    if(editing || e.target!==gridBox) return;
    if(e.key.startsWith('Arrow')){ e.preventDefault(); move(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0, e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0, e.shiftKey); }
    else if(e.key==='Enter'){ e.preventDefault(); move(0,1); }
    else if(e.key==='Tab'){ e.preventDefault(); move(1,0); }
    else if(e.key==='F2'){ e.preventDefault(); startEdit(null, true); }
    else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='b'){ e.preventDefault(); const on = !(st.fmt[refName(act.c,act.r)]||{}).b; const s=selBox(); for(let r=s.r0;r<=s.r1;r++) for(let c=s.c0;c<=s.c1;c++){ const ref=refName(c,r); st.fmt[ref] = Object.assign({}, st.fmt[ref], {b:on}); } opts.save(); paint(); }
    else if(e.key==='Delete'||e.key==='Backspace'){ e.preventDefault(); const s=selBox(); for(let r=s.r0;r<=s.r1;r++) for(let c=s.c0;c<=s.c1;c++) setCell(refName(c,r), ''); paint(); }
    else if(e.key.length===1 && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); startEdit(e.key); }
  });
  /* plakken uit een ander programma (bv. de antwoorden van een Google Formulier) */
  gridBox.addEventListener('paste', e=>{
    if(editing) return; const txt = (e.clipboardData||window.clipboardData).getData('text'); if(!txt) return; e.preventDefault();
    txt.replace(/\r/g,'').split('\n').filter((l,i,a)=>!(i===a.length-1 && l==='')).forEach((line,i)=> line.split('\t').forEach((v,j)=>{ const c=act.c+j, r=act.r+i; if(c<nC && r<nR) setCell(refName(c,r), v.trim()); }));
    paint();
  });
  /* muis: selecteren, verwijzing in een formule kiezen, vulgreep */
  let mouse = null;
  tbl.addEventListener('pointerdown', e=>{
    const td = e.target.closest('td'); if(!td) return;
    const c = +td.dataset.c, r = +td.dataset.r;
    if(e.target.classList.contains('handle')){ e.preventDefault(); mouse = {mode:'fill', from:selBox(), to:{c, r}}; return; }
    if(editing && editing.ref===refName(c,r)) return;
    if(editing && editing.inp.value.startsWith('=')){
      const v = editing.inp.value; const caret = editing.inp.selectionStart ?? v.length;
      const before = v.slice(0, caret);
      if(refPick || /[=(;,+\-*/^:&<>]$/.test(before)){
        e.preventDefault();
        if(!refPick) refPick = {start:caret, end:caret, a:{c,r}};
        refPick.a = {c,r}; const t = refName(c,r);
        editing.inp.value = v.slice(0, refPick.start) + t + v.slice(refPick.end); refPick.end = refPick.start + t.length;
        fx.value = editing.inp.value; markRefs([refName(c,r)]);
        mouse = {mode:'ref'}; setTimeout(()=>{ editing && editing.inp.focus(); editing && editing.inp.setSelectionRange(refPick.end, refPick.end); }, 0);
        return;
      }
    }
    if(editing) commit();
    e.preventDefault();
    if(e.shiftKey){ act = {c, r}; } else { act = {c, r}; anc = {c, r}; }
    mouse = {mode:'sel'}; paint(); gridBox.focus({preventScroll:true});
  });
  tbl.addEventListener('dblclick', e=>{ const td = e.target.closest('td'); if(!td) return; act = {c:+td.dataset.c, r:+td.dataset.r}; anc={...act}; startEdit(null, true); });
  function cellAt(e){ const t = document.elementFromPoint(e.clientX, e.clientY); const td = t && t.closest && t.closest('td'); if(!td || !tbl.contains(td)) return null; return {c:+td.dataset.c, r:+td.dataset.r}; }
  function markRefs(list){ Object.values(tds).forEach(td=>td.classList.remove('ref')); list.forEach(r=>tds[r] && tds[r].classList.add('ref')); }
  document.addEventListener('pointermove', e=>{
    if(!mouse) return; const p = cellAt(e); if(!p) return;
    if(mouse.mode==='sel'){ if(p.c!==act.c||p.r!==act.r){ act = p; paint(); } }
    else if(mouse.mode==='ref' && refPick && editing){ const t = (p.c===refPick.a.c && p.r===refPick.a.r) ? refName(p.c,p.r) : refName(Math.min(p.c,refPick.a.c),Math.min(p.r,refPick.a.r))+':'+refName(Math.max(p.c,refPick.a.c),Math.max(p.r,refPick.a.r)); const v = editing.inp.value; editing.inp.value = v.slice(0, refPick.start)+t+v.slice(refPick.end); refPick.end = refPick.start+t.length; fx.value = editing.inp.value; const [a,b]=t.split(':'); markRefs(b?rangeCells(a,b):[a]); }
    else if(mouse.mode==='fill'){ mouse.to = p; const f = mouse.from; const dr = p.r - f.r1, dc = p.c - f.c1; const box = Math.abs(dr)>=Math.abs(dc) ? {c0:f.c0,c1:f.c1,r0:Math.min(f.r0,p.r),r1:Math.max(f.r1,p.r)} : {c0:Math.min(f.c0,p.c),c1:Math.max(f.c1,p.c),r0:f.r0,r1:f.r1}; const l=[]; for(let r=box.r0;r<=box.r1;r++) for(let c=box.c0;c<=box.c1;c++) l.push(refName(c,r)); markRefs(l); }
  });
  document.addEventListener('pointerup', ()=>{
    if(!mouse) return; const m = mouse; mouse = null;
    if(m.mode==='fill' && m.to){ const f = m.from, p = m.to; const dr = p.r - f.r1, dc = p.c - f.c1;
      if(Math.abs(dr)>=Math.abs(dc) && p.r>f.r1){ for(let r=f.r1+1;r<=p.r;r++) for(let c=f.c0;c<=f.c1;c++){ const srcR = f.r0 + (r-f.r0)%(f.r1-f.r0+1); const src = st.c[refName(c,srcR)]; setCell(refName(c,r), src==null?'':shiftFormula(src, 0, r-srcR)); if(st.dec[refName(c,srcR)]!=null) st.dec[refName(c,r)] = st.dec[refName(c,srcR)]; } act={c:f.c0,r:f.r0}; anc={c:f.c1,r:p.r}; }
      else if(Math.abs(dc)>Math.abs(dr) && p.c>f.c1){ for(let c=f.c1+1;c<=p.c;c++) for(let r=f.r0;r<=f.r1;r++){ const srcC = f.c0 + (c-f.c0)%(f.c1-f.c0+1); const src = st.c[refName(srcC,r)]; setCell(refName(c,r), src==null?'':shiftFormula(src, c-srcC, 0)); } act={c:f.c0,r:f.r0}; anc={c:p.c,r:f.r1}; }
      markRefs([]); paint(); }
    if(m.mode==='ref'){ markRefs([]); }
  });
  /* formulebalk */
  fx.addEventListener('focus', ()=>{ if(editing) return; });
  fx.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); setCell(refName(act.c,act.r), fx.value.trim()===''?'':fx.value); fx.blur(); paint(); move(0,1); } else if(e.key==='Escape'){ fx.blur(); paint(); } });
  fx.addEventListener('input', ()=>{ if(editing) { editing.inp.value = fx.value; } });
  /* knoppen */
  bar.addEventListener('click', e=>{
    const b = e.target.closest('.gs-menu button, .gs-tools button'); if(!b || b.dataset.menu) return;
    closeDrops();
    if(editing) commit();
    if(b.dataset.fn){ insertFn(b.dataset.fn); return; }
    if(b.dataset.act==='fxlist'){ startEdit('=', false); if(!editing) return; acShow(editing.inp); msg.className='sh-msg'; msg.textContent='Kies een functie uit de lijst (of typ verder).'; return; }
    if(b.dataset.act==='xlsx'){ downloadXlsx(); return; }
    const forSel = f => { const s=selBox(); for(let r=s.r0;r<=s.r1;r++) for(let c=s.c0;c<=s.c1;c++) f(refName(c,r)); opts.save(); paint(); };
    if(b.dataset.act==='bold'){ const on = !(st.fmt[refName(act.c,act.r)]||{}).b; forSel(ref=>{ st.fmt[ref] = Object.assign({}, st.fmt[ref], {b:on}); }); return; }
    if(b.dataset.act==='pct'){ const on = !(st.fmt[refName(act.c,act.r)]||{}).pct; forSel(ref=>{ st.fmt[ref] = Object.assign({}, st.fmt[ref], {pct:on}); }); return; }
    if(b.dataset.fill!=null){ forSel(ref=>{ st.fmt[ref] = Object.assign({}, st.fmt[ref], {fill:b.dataset.fill}); }); return; }
    if(b.dataset.ch){ insertChart(b.dataset.ch); }
    else if(b.dataset.dec){ const s=selBox(); for(let r=s.r0;r<=s.r1;r++) for(let c=s.c0;c<=s.c1;c++){ const ref=refName(c,r); const cur = st.dec[ref] ?? ((st.fmt[ref]||{}).pct ? 0 : 2); st.dec[ref] = Math.max(0, Math.min(6, cur + +b.dataset.dec)); } opts.save(); paint(); }
    else if(b.dataset.clear){ const s=selBox(); for(let r=s.r0;r<=s.r1;r++) for(let c=s.c0;c<=s.c1;c++) setCell(refName(c,r), ''); paint(); }
  });
  /* downloaden als echt Excel-bestand (met formules in het Engels, zoals Excel ze opslaat) */
  function toExcelFormula(f){
    const EN = {SOM:'SUM', GEMIDDELDE:'AVERAGE', MEDIAAN:'MEDIAN', MODUS:'MODE', AANTAL:'COUNT', AANTALARG:'COUNTA', 'AANTAL.ALS':'COUNTIF', AFRONDEN:'ROUND', MAX:'MAX', MIN:'MIN', ABS:'ABS'};
    return f.split('"').map((part,i)=>{ if(i%2) return part; let t = part.replace(/(\d),(\d)/g, '$1.$2').replace(/;/g, ',');
      return t.replace(/([A-Za-z][A-Za-z.]*)\s*\(/g, (m,n)=>(EN[n.toUpperCase()]||n.toUpperCase())+'('); }).join('"');
  }
  function downloadXlsx(){
    const go = () => { try{
      const ws = {}; let maxC=0, maxR=0;
      Object.keys(st.c).forEach(ref=>{ const raw = String(st.c[ref]); const p = parseRef(ref); maxC=Math.max(maxC,p.c); maxR=Math.max(maxR,p.r); const v = val(ref);
        if(raw.startsWith('=')) ws[ref] = {f:toExcelFormula(raw.slice(1)), t:typeof v==='number'?'n':'s', v:isErr(v)?v.err:v};
        else if(typeof v==='number') ws[ref] = {t:'n', v}; else ws[ref] = {t:'s', v:raw};
        const fm = st.fmt[ref]; if(fm && fm.pct) ws[ref].z = '0' + ((st.dec[ref]||0)>0 ? '.'+'0'.repeat(st.dec[ref]) : '') + '%'; else if(st.dec[ref]!=null && typeof v==='number') ws[ref].z = '0' + (st.dec[ref]>0 ? '.'+'0'.repeat(st.dec[ref]) : ''); });
      ws['!ref'] = 'A1:'+refName(Math.max(maxC,0), Math.max(maxR,0));
      ws['!cols'] = [...Array(maxC+1)].map((_,c)=>({wpx: st.w[c] || 90}));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Blad1'); XLSX.writeFile(wb, (opts.file||'rekenblad')+'.xlsx');
      msg.className='sh-msg'; msg.textContent='Het bestand is gedownload. In Google Spreadsheets open je het met Bestand > Importeren: je formules werken daar ook.';
    }catch(e){ msg.className='sh-msg bad'; msg.textContent='Downloaden lukte hier niet. Probeer het op de website van de school.'; } };
    if(window.XLSX) return go();
    const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; sc.onload = go; sc.onerror = ()=>{ msg.className='sh-msg bad'; msg.textContent='Downloaden lukte niet: geen internetverbinding met de downloadbibliotheek.'; }; document.head.append(sc);
  }
  /* grafiek */
  function chartData(ch){
    if(!ch) return null;
    const [a,b] = ch.range.split(':'); const p = parseRef(a), q = parseRef(b||a);
    const c0=Math.min(p.c,q.c), c1=Math.max(p.c,q.c), r0=Math.min(p.r,q.r), r1=Math.max(p.r,q.r);
    const isNum = v => typeof v==='number';
    /* eerste kolom = labels zodra er meer dan één kolom geselecteerd is */
    const hasLabels = c1>c0;
    const firstRowHead = [...Array(c1-c0+1)].some((_,j)=>{ const v = val(refName(c0+j, r0)); return v!=='' && !isNum(v); }) && r1>r0;
    const dr0 = firstRowHead ? r0+1 : r0;
    const labels = [], series = [];
    for(let r=dr0;r<=r1;r++) labels.push(hasLabels ? String(dispPlain(val(refName(c0,r)))) : String(r-dr0+1));
    for(let c=(hasLabels?c0+1:c0); c<=c1; c++){ const vals=[]; for(let r=dr0;r<=r1;r++){ const v=val(refName(c,r)); vals.push(isNum(v)?v:NaN); } series.push({name: firstRowHead ? String(val(refName(c,r0))) : colName(c), values:vals}); }
    return {labels, series};
  }
  const dispPlain = v => isErr(v) ? v.err : typeof v==='number' ? nf(v,6) : v;
  function insertChart(type){
    const s = selBox();
    if(s.c0===s.c1 && s.r0===s.r1){ msg.className='sh-msg bad'; msg.textContent='Selecteer eerst de cellen met de gegevens (sleep over de tabel) en kies dan Invoegen > Diagram.'; return; }
    const old = st.chart || {};
    st.chart = {type, range:selRange(), title:old.title||'', xTitle:old.xTitle||'', yTitle:old.yTitle||'', yMin:old.yMin??''};
    opts.save(); paint();
    chartBox.scrollIntoView({block:'nearest', behavior:'smooth'});
  }
  let panelBuilt = false, chartHolder, tIn, xIn, yIn, mIn, typeSel, rngIn, edTab = 'instellen';
  function drawChartPanel(){
    const ch = st.chart; chartBox.hidden = !ch; if(!ch) return;
    if(!panelBuilt){
      panelBuilt = true;
      /* het diagram met rechts de diagrameditor, zoals in Google Spreadsheets */
      chartBox.innerHTML = `<div class="xlc on" data-k="holder"></div>
        <div class="gs-ed" aria-label="Diagrameditor"><div class="hd"><b>Diagrameditor</b></div>
          <div class="tb"><button type="button" data-ed="instellen">Instellen</button><button type="button" data-ed="aanpassen">Aanpassen</button></div>
          <div class="pn" data-p="instellen"><label>Diagramtype<select data-k="type">${Object.keys(RB_NAMES).map(k=>`<option value="${k}">${RB_NAMES[k]}</option>`).join('')}</select></label>
            <label>Gegevensbereik<input data-k="range" spellcheck="false"></label><button type="button" class="del" data-k="del">Diagram verwijderen</button></div>
          <div class="pn" data-p="aanpassen" hidden>
            <details open><summary>Diagram- en astitels</summary><div><label>Diagramtitel<input data-k="title"></label><label data-as>Titel horizontale as<input data-k="xTitle"></label><label data-as>Titel verticale as<input data-k="yTitle"></label></div></details>
            <details data-as open><summary>Verticale as</summary><div><label>Min.<input data-k="yMin" inputmode="decimal" placeholder="Automatisch"></label></div></details></div></div>`;
      chartHolder = chartBox.querySelector('[data-k=holder]');
      [tIn,xIn,yIn,mIn] = ['title','xTitle','yTitle','yMin'].map(k=>chartBox.querySelector(`input[data-k=${k}]`));
      typeSel = chartBox.querySelector('select[data-k=type]'); rngIn = chartBox.querySelector('input[data-k=range]');
      const showEd = k => { edTab = k; chartBox.querySelectorAll('[data-ed]').forEach(b=>b.classList.toggle('on', b.dataset.ed===k)); chartBox.querySelectorAll('[data-p]').forEach(p=>p.hidden = p.dataset.p!==k); };
      chartBox.querySelectorAll('[data-ed]').forEach(b=>b.addEventListener('click', ()=>showEd(b.dataset.ed))); showEd(edTab);
      [tIn,xIn,yIn,mIn].forEach(inp=>inp.addEventListener('input', ()=>{ if(!st.chart) return; st.chart[inp.dataset.k] = inp.value; opts.save(); renderChart(); if(opts.onChange) opts.onChange(); }));
      typeSel.addEventListener('change', ()=>{ if(!st.chart) return; st.chart.type = typeSel.value; opts.save(); drawChartPanel(); if(opts.onChange) opts.onChange(); });
      rngIn.addEventListener('change', ()=>{ if(!st.chart) return; const v = rngIn.value.trim().toUpperCase().replace(/\$/g,'');
        if(/^[A-Z]{1,2}\d+:[A-Z]{1,2}\d+$/.test(v)){ st.chart.range = v; opts.save(); msg.className='sh-msg'; msg.textContent=''; drawChartPanel(); if(opts.onChange) opts.onChange(); }
        else { msg.className='sh-msg bad'; msg.textContent='Typ een bereik zoals A1:B5.'; rngIn.value = st.chart.range; } });
      chartBox.querySelector('[data-k=del]').addEventListener('click', ()=>{ delete st.chart; opts.save(); paint(); });
    }
    if(document.activeElement!==tIn) tIn.value = ch.title||''; if(document.activeElement!==xIn) xIn.value = ch.xTitle||''; if(document.activeElement!==yIn) yIn.value = ch.yTitle||''; if(document.activeElement!==mIn) mIn.value = ch.yMin??'';
    typeSel.value = ch.type; if(document.activeElement!==rngIn) rngIn.value = ch.range;
    const pie = ch.type==='cirkel'||ch.type==='strook';
    chartBox.querySelectorAll('[data-as]').forEach(x=>x.hidden = pie);
    renderChart();
  }
  function renderChart(){
    const ch = st.chart; if(!ch || !chartHolder) return;
    const d = chartData(ch); chartHolder.innerHTML='';
    if(!d.series.length || d.series.every(s=>s.values.every(isNaN))){ chartHolder.textContent = 'Er staan geen getallen in de geselecteerde cellen.'; return; }
    const ym = String(ch.yMin).trim()==='' ? null : parseLoose(ch.yMin);
    chartHolder.append(drawChart(ch.type, {labels:d.labels, series:d.series.map(s=>({name:s.name, values:s.values.map(v=>isNaN(v)?0:v)})), title:ch.title, xTitle:ch.xTitle, yTitle:ch.yTitle, yMin: (ym==null||isNaN(ym))?0:ym, values:ch.type!=='lijn', anim:false, brk:false, pal:['#4285f4','#ea4335','#fbbc04','#34a853','#ff6d01','#46bdc6','#7baaf7','#f07b72']}));
  }
  paint();
  return {
    val: ref => makeEval(getRaw)(ref.toUpperCase()), raw: ref => st.c[ref.toUpperCase()] ?? '', fmt: ref => st.fmt[ref.toUpperCase()] || {}, chart: () => st.chart || null, chartData: () => chartData(st.chart),
    lock(){ root.style.pointerEvents='none'; root.style.opacity='.9'; }, paint
  };
}

/* ---------- een opdracht in het rekenblad, met een checklist ---------- */
const fIs = (r, ...fns) => sh => { const raw = String(sh.raw(r)).toUpperCase(); return raw.startsWith('=') && fns.some(f=>raw.includes(f.toUpperCase()+'(') || raw.includes((Object.keys(FN_ALIAS).find(k=>FN_ALIAS[k]===f.toUpperCase())||'#')+'(')); };
const vIs = (r, t, tol=1e-6) => sh => { const v = sh.val(r); if(typeof v!=='number') return false; if(Math.abs(v-t)<=tol) return true; const f = sh.fmt ? sh.fmt(r) : {}; return !!(f.pct && Math.abs(v*100-t)<=tol*100); };
const tIs = (r, ...ts) => sh => ts.some(t=>String(sh.val(r)).trim().toLowerCase()===t.toLowerCase());
const isF = r => sh => String(sh.raw(r)).startsWith('=');
const allOf = (...fs) => sh => fs.every(f=>f(sh));
const chartIs = (types, test) => sh => { const ch = sh.chart(); if(!ch || !types.includes(ch.type)) return false; return test ? test(ch, sh.chartData()) : true; };
const sameArr = (a, b, tol=1e-6) => a.length===b.length && a.every((x,i)=> typeof x==='number' ? Math.abs(x-b[i])<=tol : String(x).trim().toLowerCase()===String(b[i]).trim().toLowerCase());

function sheetTask(b, st, save, key, task){
  if(!st.c){ st.c = Object.assign({}, task.init||{}); st.dec = Object.assign({}, task.dec||{}); if(task.chart) st.chart = Object.assign({}, task.chart); }
  const two = el('div', task.checks ? 'rb-task' : ''); b.append(two);
  const links = el('div'); links.style.minWidth = '0'; two.append(links);
  const quiz = QZ; const qid = QID('rb'); if(!quiz && task.checks) CLvraag(qid);
  let ul, fb;
  const sh = makeSheet(links, {state:st, save, cols:task.cols, rows:task.rows, given:Object.keys(task.init||{}), lockGiven:task.lockGiven!==false, onChange:()=>{ if(ul && !quiz) mark(false); }});
  if(!task.checks) return;
  /* de opdrachten staan rechts naast het rekenblad (onder elkaar op een smal scherm) */
  const opd = el('div','rb-opd'); opd.append(el('h4','','Opdrachten')); two.append(opd);
  ul = el('ul','checklist'); opd.append(ul);
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn); fb = el('div','fb'); opd.append(act, fb);
  if(quiz) act.hidden = true;
  function results(){ return task.checks.map(c=>{ try{ return !!c.test(sh); }catch(e){ return false; } }); }
  function mark(show){ const res = results(); ul.innerHTML=''; task.checks.forEach((c,i)=>{ const li=el('li', show ? (res[i]?'ok':'bad') : 'todo', c.say); ul.append(li); }); return res; }
  btn.addEventListener('click', ()=>{ const res = mark(true); const ok = res.every(Boolean); fb.className='fb '+(ok?'ok':'bad');
    const first = task.checks.findIndex((c,i)=>!res[i]);
    fb.innerHTML = ok ? '✅ Juist! '+(task.why||'') : '❌ Nog niet alles klopt. '+(task.checks[first].hint||''); CLres(qid, ok); st.checked = true; save(); });
  mark(!!st.checked && !quiz);
  if(quiz) quiz.push({ grade:()=>results().every(Boolean), reveal:()=>mark(true), lock:()=>sh.lock() });
}

/* ============================================================
   ONDERDEEL 12 · REKENBLAD: TABELLEN EN FORMULES
   ============================================================ */
const CHEAT_RB = `<h3>Spiekbriefje · Google Spreadsheets</h3><table>
<tr><td>cel</td><td>Een vakje, genoemd naar kolom en rij: B3 is kolom B, rij 3. Een bereik: B2:B9 (van B2 tot en met B9).</td></tr>
<tr><td>formule</td><td>Begint altijd met <span class="formula">=</span>. Bv. <span class="formula">=B2*4</span> of <span class="formula">=B2/B7*100</span>. Tik op een cel om ze in je formule te zetten.</td></tr>
<tr><td>functies</td><td><span class="formula">=SOM(B2:B9)</span> · <span class="formula">=GEMIDDELDE(B2:B9)</span> · <span class="formula">=MEDIAAN(B2:B9)</span> · <span class="formula">=MODUS(B2:B9)</span> · <span class="formula">=MAX(...)</span> · <span class="formula">=MIN(...)</span> · <span class="formula">=AANTAL(...)</span></td></tr>
<tr><td>tellen</td><td><span class="formula">=AANTAL.ALS(B2:F6;"blauw")</span> telt hoeveel keer "blauw" in het bereik staat.</td></tr>
<tr><td>doortrekken</td><td>Sleep het blokje rechtsonder (de vulgreep) naar beneden: de formule past zich aan (B2 wordt B3, B4 ...). Een $ houdt een verwijzing vast: <span class="formula">$B$9</span>.</td></tr>
<tr><td>tussen argumenten</td><td>Een puntkomma: <span class="formula">=AANTAL.ALS(B2:B9;"ja")</span>. Een kommagetal typ je met een komma: 2,5.</td></tr><tr><td>diagram</td><td>Selecteer de tabel (met de titels erbij) en kies <b>Invoegen &gt; Diagram</b>. In de <b>diagrameditor</b> rechts kies je bij <b>Instellen</b> het diagramtype en bij <b>Aanpassen</b> de titels en het begin van de verticale as. Een staafdiagram met rechtopstaande staven heet er een <b>kolomdiagram</b>.</td></tr><tr><td>opmaak</td><td>Vet: <b>B</b> of Ctrl+B. Percentage: <b>%</b>. Decimalen: <b>.0←</b> en <b>.00→</b> in de werkbalk.</td></tr></table>`;
const KLEUREN25 = ['blauw','rood','groen','blauw','zwart','geel','blauw','blauw','groen','rood','zwart','blauw','groen','blauw','geel','rood','blauw','zwart','groen','blauw','rood','blauw','groen','zwart','blauw'];
const kleurInit = () => { const o = {}; KLEUREN25.forEach((k,i)=>{ o[refName(1+i%5, Math.floor(i/5))] = k; }); return o; };
SECTIONS.push({ id:'rekenblad', ic:'rekenblad', nav:'Rekenblad: formules', title:'Werken in een rekenblad', cheat:CHEAT_RB,
  tip:'Dit rekenblad werkt zoals Google Spreadsheets op je Chromebook. Klik op een cel en typ. Een formule begint met =. Druk op Enter om te bevestigen. Dubbelklik om een cel te wijzigen. Tussen de argumenten van een functie typ je een puntkomma.',
  cards:[
    { title:'Kennismaken: cellen en formules', lvl:1, instr:'Voer de drie opdrachten uit in het rekenblad hieronder.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:5, rows:8, init:{A1:'artikel', B1:'prijs (€)', A2:'pen', B2:'2,5', A3:'schrift', B3:'3', A4:'lat', B4:'1,5'},
        checks:[
          {say:'Typ in cel A5 het woord <b>gom</b> en in B5 de prijs <b>1,2</b>.', test:allOf(tIs('A5','gom'), vIs('B5',1.2)), hint:'Klik op A5, typ gom en druk Enter. Doe hetzelfde in B5 (met een komma).'},
          {say:'Bereken in C2 de prijs van 4 pennen met de formule <span class="formula">=B2*4</span>.', test:allOf(isF('C2'), vIs('C2',10)), hint:'Typ in C2: =B2*4 en druk Enter. Een formule begint altijd met =.'},
          {say:'Bereken in B6 de totale prijs van de vier artikels met een formule.', test:allOf(isF('B6'), vIs('B6',8.2)), hint:'Bv. =B2+B3+B4+B5 of =SOM(B2:B5).'}
        ], why:'Je gebruikte een formule: verander je een prijs, dan rekent het rekenblad alles opnieuw uit.' }) },
    { title:'De functie SOM en doortrekken', lvl:1, instr:'Vijf leerlingen spaarden drie maanden. Gebruik formules en trek ze door met de vulgreep.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:6, rows:8, init:{A1:'naam', B1:'jan', C1:'feb', D1:'mrt', E1:'totaal', A2:'Arne', B2:'12', C2:'8', D2:'15', A3:'Bo', B3:'5', C3:'5', D3:'5', A4:'Chloë', B4:'20', C4:'0', D4:'10', A5:'Daan', B5:'7', C5:'14', D5:'9', A6:'Emma', B6:'10', C6:'12', D6:'11'},
        checks:[
          {say:'Typ in E2 <span class="formula">=SOM(B2:D2)</span>.', test:allOf(fIs('E2','SOM'), vIs('E2',35)), hint:'Typ =SOM( en sleep dan over B2 tot D2, sluit met ) en druk Enter.'},
          {say:'Trek de formule door tot E6 (sleep de vulgreep van E2 naar E6).', test:allOf(fIs('E6','SOM'), vIs('E3',15), vIs('E4',30), vIs('E5',30), vIs('E6',33)), hint:'Klik op E2 en sleep het blokje rechtsonder naar beneden tot E6.'},
          {say:'Bereken in E7 het totaal van alle spaarpotten.', test:allOf(isF('E7'), vIs('E7',143)), hint:'=SOM(E2:E6)'}
        ], why:'Doortrekken past de formule aan per rij: in E3 staat =SOM(B3:D3).' }) },
    { title:'Een frequentietabel met AANTAL.ALS', lvl:2, instr:'25 leerlingen gaven hun lievelingskleur (B1:F5). Maak de frequentietabel in A8:B13 met formules.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:6, rows:14, init:Object.assign(kleurInit(), {A7:'kleur', B7:'aantal', A8:'blauw', A9:'rood', A10:'groen', A11:'zwart', A12:'geel', A13:'totaal'}),
        checks:[
          {say:'Tel in B8 hoeveel keer <b>blauw</b> voorkomt met <span class="formula">=AANTAL.ALS(B1:F5;"blauw")</span>.', test:allOf(fIs('B8','AANTAL.ALS'), vIs('B8',10)), hint:'Typ =AANTAL.ALS(B1:F5;"blauw") in B8. Tekst staat tussen aanhalingstekens.'},
          {say:'Doe hetzelfde voor rood, groen, zwart en geel (B9 tot B12).', test:allOf(...['B9','B10','B11','B12'].map(r=>fIs(r,'AANTAL.ALS')), vIs('B9',4), vIs('B10',5), vIs('B11',4), vIs('B12',2)), hint:'Je kan ook verwijzen naar de kleur in kolom A: =AANTAL.ALS($B$1:$F$5;A9). Met de $-tekens kan je doortrekken.'},
          {say:'Bereken in B13 het totaal met SOM. Klopt het met 25?', test:allOf(fIs('B13','SOM'), vIs('B13',25)), hint:'=SOM(B8:B12)'}
        ] }) },
    { title:'Centrummaten met functies', lvl:2, instr:'De tijden (in seconden) op de 60 m van 12 leerlingen staan in kolom B.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:5, rows:14, init:Object.assign({A1:'leerling', B1:'tijd (s)', D1:'maat', E1:'waarde', D2:'gemiddelde', D3:'mediaan', D4:'modus', D5:'maximum', D6:'minimum', D7:'variatiebreedte'}, ...[9.8,10.4,9.1,11.2,10.4,9.6,10.0,12.3,9.9,10.4,10.8,9.5].map((v,i)=>({['A'+(i+2)]:'lln '+(i+1), ['B'+(i+2)]:String(v).replace('.',',')}))),
        checks:[
          {say:'E2: het gemiddelde met <span class="formula">=GEMIDDELDE(B2:B13)</span>', test:allOf(fIs('E2','GEMIDDELDE'), vIs('E2',123.4/12,1e-6)), hint:'=GEMIDDELDE(B2:B13)'},
          {say:'E3: de mediaan met MEDIAAN', test:allOf(fIs('E3','MEDIAAN'), vIs('E3',10.2)), hint:'=MEDIAAN(B2:B13)'},
          {say:'E4: de modus met MODUS', test:allOf(fIs('E4','MODUS'), vIs('E4',10.4)), hint:'=MODUS(B2:B13)'},
          {say:'E5 en E6: het maximum en het minimum met MAX en MIN', test:allOf(fIs('E5','MAX'), fIs('E6','MIN'), vIs('E5',12.3), vIs('E6',9.1)), hint:'=MAX(B2:B13) en =MIN(B2:B13)'},
          {say:'E7: de variatiebreedte met een formule die E5 en E6 gebruikt', test:allOf(isF('E7'), vIs('E7',3.2)), hint:'=E5-E6'}
        ], why:'Met de knoppen .0← en .00→ in de werkbalk toon je het gemiddelde netjes op twee decimalen.' }) },
    { title:'Gemiddelde uit een frequentietabel', lvl:3, instr:'Een frequentietabel: hoeveel keer per week sporten 30 leerlingen? Bereken het gemiddelde met een hulpkolom.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:10, init:{A1:'keer sport', B1:'aantal', C1:'keer · aantal', A2:'0', B2:'4', A3:'1', B3:'7', A4:'2', B4:'9', A5:'3', B5:'6', A6:'4', B6:'3', A7:'5', B7:'1', A8:'totaal', A9:'gemiddelde'},
        checks:[
          {say:'C2: <span class="formula">=A2*B2</span>, doorgetrokken tot C7', test:allOf(isF('C2'), isF('C7'), vIs('C2',0), vIs('C3',7), vIs('C4',18), vIs('C5',18), vIs('C6',12), vIs('C7',5)), hint:'Typ =A2*B2 in C2 en trek door tot C7.'},
          {say:'B8 en C8: de totalen met SOM', test:allOf(fIs('B8','SOM'), fIs('C8','SOM'), vIs('B8',30), vIs('C8',60)), hint:'=SOM(B2:B7) en =SOM(C2:C7)'},
          {say:'C9: het gemiddelde = totaal van kolom C gedeeld door het aantal leerlingen', test:allOf(isF('C9'), vIs('C9',2)), hint:'=C8/B8'}
        ], why:'60 : 30 = 2: gemiddeld sporten de leerlingen 2 keer per week. Let op: =GEMIDDELDE(A2:A7) geeft 2,5, en dat is fout, want het telt niet hoeveel leerlingen elk antwoord gaven.' }) }
  ]});

/* ============================================================
   ONDERDEEL 13 · REKENBLAD: GRAFIEKEN
   ============================================================ */
SECTIONS.push({ id:'rbgraf', ic:'rbgraf', nav:'Rekenblad: grafieken', title:'Grafieken maken in een rekenblad', cheat:CHEAT_RB,
  tip:'Selecteer de tabel door erover te slepen, met de titels in de eerste rij. Kies dan Invoegen > Diagram. In de diagrameditor kies je bij Instellen het diagramtype en bij Aanpassen de titels. Geef je diagram altijd een titel.',
  cards:[
    { title:'Een staafdiagram (kolomdiagram)', lvl:1, instr:'Schoenmaten in een klas. Maak er een staafdiagram van.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:10, init:{A1:'schoenmaat', B1:'aantal', A2:'36', B2:'2', A3:'37', B3:'4', A4:'38', B4:'6', A5:'39', B5:'5', A6:'40', B6:'3', A7:'41', B7:'2', A8:'42', B8:'1'},
        checks:[
          {say:'Selecteer A1:B8 en kies <b>Invoegen &gt; Diagram</b>. Kies als diagramtype <b>Kolomdiagram</b>.', test:chartIs(['kolom','staaf'], (ch,d)=>sameArr(d.labels,['36','37','38','39','40','41','42']) && d.series.length===1 && sameArr(d.series[0].values,[2,4,6,5,3,2,1])), hint:'Sleep van A1 tot B8 zodat beide kolommen geselecteerd zijn en kies Invoegen > Diagram.'},
          {say:'Geef het diagram een titel.', test:sh=>!!(sh.chart()&&String(sh.chart().title).trim().length>2), hint:'Open in de diagrameditor het tabblad Aanpassen en typ een diagramtitel, bv. Schoenmaten in de klas.'},
          {say:'Geef de horizontale as de titel <b>schoenmaat</b> en de verticale as de titel <b>aantal leerlingen</b>.', test:sh=>{ const c=sh.chart(); return !!c && /schoen/i.test(c.xTitle) && /aantal/i.test(c.yTitle); }, hint:'Diagrameditor > Aanpassen > Diagram- en astitels.'}
        ], why:'Een goede grafiek heeft een titel en astitels: zo weet de lezer wat hij ziet.' }) },
    { title:'Percentages en een cirkeldiagram', lvl:2, instr:'Hoe komen 40 leerlingen naar school? Bereken de percentages en maak een cirkeldiagram.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:9, init:{A1:'vervoer', B1:'aantal', C1:'percentage', A2:'fiets', B2:'18', A3:'te voet', B3:'6', A4:'bus', B4:'10', A5:'auto', B5:'6', A6:'totaal'},
        checks:[
          {say:'B6: het totaal met SOM', test:allOf(fIs('B6','SOM'), vIs('B6',40)), hint:'=SOM(B2:B5)'},
          {say:'C2 tot C5: het percentage met een formule (bv. <span class="formula">=B2/$B$6*100</span>, doorgetrokken)', test:allOf(isF('C2'), isF('C5'), vIs('C2',45), vIs('C3',15), vIs('C4',25), vIs('C5',15)), hint:'=B2/$B$6*100, of =B2/$B$6 met de knop % in de werkbalk. De $-tekens houden B6 vast als je doortrekt.'},
          {say:'Selecteer A1:B5, kies Invoegen &gt; Diagram en maak er een <b>cirkeldiagram</b> met een titel van.', test:sh=>chartIs(['cirkel'], (ch,d)=>sameArr(d.labels,['fiets','te voet','bus','auto']) && sameArr(d.series[0].values,[18,6,10,6]))(sh) && String(sh.chart().title).trim().length>2, hint:'Selecteer enkel A1:B5 (zonder de rij totaal!), kies Invoegen > Diagram en zet het diagramtype op Cirkeldiagram. Vul bij Aanpassen een titel in.'}
        ], why:'Zonder de rij totaal: anders zou "totaal" de helft van de cirkel innemen!' }) },
    { title:'Een lijndiagram', lvl:2, instr:'De temperatuur van Lieve, die koorts heeft, werd elk uur gemeten.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:9, init:{A1:'tijdstip', B1:'temperatuur (°C)', A2:'16 u', B2:'37,2', A3:'17 u', B3:'38,4', A4:'18 u', B4:'39,1', A5:'19 u', B5:'38,9', A6:'20 u', B6:'38,3', A7:'21 u', B7:'37,8'},
        checks:[
          {say:'Maak een <b>lijndiagram</b> van A1:B7.', test:chartIs(['lijn'], (ch,d)=>d.labels.length===6 && sameArr(d.series[0].values,[37.2,38.4,39.1,38.9,38.3,37.8])), hint:'Selecteer A1:B7, kies Invoegen > Diagram en zet het diagramtype op Lijndiagram.'},
          {say:'Titel: <b>Koorts van Lieve</b>, verticale as: <b>temperatuur (°C)</b>.', test:sh=>{ const c=sh.chart(); return !!c && /koorts/i.test(c.title) && /temp/i.test(c.yTitle); }, hint:'Diagrameditor > Aanpassen: vul de diagramtitel en de titel van de verticale as in.'},
          {say:'Laat de verticale as beginnen bij <b>36</b>, zodat je het verloop goed ziet.', test:sh=>{ const c=sh.chart(); return !!c && parseLoose(c.yMin)===36; }, hint:'Diagrameditor > Aanpassen > Verticale as: typ 36 bij Min.'}
        ], why:'Bij een lijndiagram over temperatuur mag de as bij 36 beginnen: je wil het verloop zien, niet de staven vergelijken. Bij een staafdiagram doe je dat nooit!' }) },
    { title:'Twee groepen in één grafiek', lvl:2, instr:'Favoriete kleur van jongens en meisjes.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:5, rows:8, init:{A1:'kleur', B1:'meisjes', C1:'jongens', A2:'zwart', B2:'9', C2:'14', A3:'blauw', B3:'21', C3:'18', A4:'groen', B4:'6', C4:'10', A5:'rood', B5:'8', C5:'7', A6:'paars', B6:'12', C6:'2'},
        checks:[
          {say:'Maak een kolomdiagram van A1:C6: twee kleuren staven, met een legende.', test:chartIs(['kolom','staaf'], (ch,d)=>d.series.length===2 && sameArr(d.series[1].values,[14,18,10,7,2])), hint:'Selecteer de hele tabel, van A1 tot C6, en kies Invoegen > Diagram (kolomdiagram).'},
          {say:'D1: typ <b>totaal</b> en bereken in D2 tot D6 het totaal per kleur met een formule.', test:allOf(tIs('D1','totaal'), isF('D2'), isF('D6'), vIs('D2',23), vIs('D3',39), vIs('D4',16), vIs('D5',15), vIs('D6',14)), hint:'=B2+C2 of =SOM(B2:C2), en trek door.'},
          {say:'Geef het diagram een titel.', test:sh=>!!(sh.chart()&&String(sh.chart().title).trim().length>2), hint:'Diagrameditor > Aanpassen: vul een diagramtitel in.'}
        ], why:'Met twee reeksen in één staafdiagram kan je jongens en meisjes per kleur vergelijken.' }) },
    { title:'Maak de grafiek eerlijk', lvl:2, instr:'Iemand maakte deze misleidende grafiek over de lonen in drie bedrijven. Maak ze eerlijk.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:6, init:{A1:'bedrijf', B1:'jaarloon (€)', A2:'A', B2:'41000', A3:'B', B3:'42000', A4:'C', B4:'41500'}, chart:{type:'kolom', range:'A1:B4', title:'Jaarloon', xTitle:'', yTitle:'', yMin:'40800'},
        checks:[
          {say:'De grafiek blijft een kolomdiagram van A1:B4.', test:chartIs(['kolom','staaf'], (ch,d)=>sameArr(d.series[0].values,[41000,42000,41500])), hint:'Verwijder het diagram niet. Of maak het opnieuw: selecteer A1:B4 en kies Invoegen > Diagram.'},
          {say:'De verticale as begint bij 0.', test:sh=>{ const c=sh.chart(); return !!c && (String(c.yMin).trim()==='' || parseLoose(c.yMin)===0); }, hint:'Diagrameditor > Aanpassen > Verticale as: maak Min. leeg of typ 0.'},
          {say:'Bereken in C3 hoeveel procent bedrijf B meer betaalt dan bedrijf A (rond niet af).', test:allOf(isF('C3'), vIs('C3', 1000/41000*100, 1e-4)), hint:'=(B3-B2)/B2*100'}
        ], why:'Met de as vanaf 0 zie je dat de lonen bijna even hoog zijn: B betaalt maar 2,4 % meer dan A.' }) },
    { title:'Schoolreis', lvl:3, instr:'270 leerlingen kozen een bestemming: 54 kozen de zoo, een derde koos het pretpark, 30 % koos het museum en de rest koos de kust. Werk alles uit met formules.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:8, init:{A1:'bestemming', B1:'aantal', A2:'zoo', A3:'pretpark', A4:'museum', A5:'kust', A6:'totaal', B6:'270'},
        checks:[
          {say:'B2 tot B4: de aantallen (B3 en B4 met een formule die B6 gebruikt)', test:allOf(vIs('B2',54), isF('B3'), isF('B4'), vIs('B3',90), vIs('B4',81)), hint:'B3: =B6/3 · B4: =B6*30/100'},
          {say:'B5: de rest, met een formule', test:allOf(isF('B5'), vIs('B5',45)), hint:'=B6-B2-B3-B4 of =B6-SOM(B2:B4)'},
          {say:'Een cirkeldiagram van A1:B5 met een titel', test:sh=>chartIs(['cirkel'], (ch,d)=>sameArr(d.series[0].values,[54,90,81,45]))(sh) && String(sh.chart().title).trim().length>2, hint:'Selecteer A1:B5 (zonder totaal), kies Invoegen > Diagram en zet het diagramtype op Cirkeldiagram.'}
        ] }) },
    { title:'Vrij rekenblad', lvl:2, instr:'Een leeg rekenblad om zelf te oefenen. Je kan ook gegevens plakken (bv. uit de antwoorden van een Google Formulier): klik op een cel en plak met Ctrl+V. Dit telt niet mee.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:8, rows:30, init:{} }) }
  ]});
/* ============================================================
   HOOFDSTUK ONDERZOEK
   Vervangt de papieren bundel (onderzoek van Frank) en p. 17 nr. 11.
   ============================================================ */
(function(){
  const css = `
  .order-list{ list-style:none; padding:0; margin:.4rem 0; display:grid; gap:.35rem; max-width:620px; }
  .order-list li{ display:flex; align-items:center; gap:.5rem; border:2px solid var(--tq); border-radius:.6rem; background:var(--card); padding:.35rem .5rem; transition:transform .25s ease; }
  .order-list li .nr{ font-weight:800; color:var(--accent-dark); min-width:1.4rem; }
  .order-list li .tx{ flex:1; }
  .order-list li button{ border:1.5px solid var(--tq); background:var(--tq-soft); color:var(--ink); border-radius:.4rem; width:2rem; height:1.8rem; cursor:pointer; font:inherit; font-weight:700; }
  .order-list li.ok{ border-color:var(--ok); background:var(--ok-bg); } .order-list li.bad{ border-color:var(--bad); background:var(--bad-bg); }
  .school svg{ width:100%; max-width:520px; display:block; }
  .school .p{ transition:all .35s ease; }
  .school .p.f{ fill:var(--orange); } .school .p.n{ fill:#b9c7c8; }
  .school .p.pick{ stroke:var(--accent-dark); stroke-width:3.5; }
  .school .p.dim{ opacity:.25; }
  .meter{ display:flex; align-items:center; gap:.6rem; margin:.25rem 0; font-weight:700; }
  .meter .bar{ flex:1; max-width:340px; height:18px; border-radius:9px; background:var(--tq-soft); overflow:hidden; border:1.5px solid var(--border); }
  .meter .bar i{ display:block; height:100%; width:0; background:var(--orange); transition:width .6s ease; }
  .meter .bar.true i{ background:var(--accent-dark); }
  .btnrow{ display:flex; flex-wrap:wrap; gap:.4rem; margin:.4rem 0; }
  .btnrow .btn.on{ outline:3px solid var(--orange); }
  .avatar .face{ font-size:1.6rem; display:block; }
  .avatar .nm{ display:block; font-size:.72rem; color:var(--muted, #557); }
  .timebar{ height:10px; border-radius:5px; background:var(--tq-soft); overflow:hidden; margin:.4rem 0; max-width:620px; }
  .timebar i{ display:block; height:100%; background:var(--orange); width:100%; transition:width 1s linear; }
  .rt-times{ display:flex; flex-wrap:wrap; gap:.35rem; margin:.5rem 0; }
  .lab-out{ margin-top:.8rem; }
  .lab-out .two > div{ min-width:0; }
  .lab-measures td:first-child{ font-weight:700; color:var(--accent-dark); }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* --- volgorde: zet de stappen in de juiste volgorde (pijltjes, ook op een tablet) --- */
function orderEx(b, st, save, key, cfg){
  const quiz = QZ; const qid = QID('o'); if(!quiz) CLvraag(qid);
  if(!st.ord){ let o; do{ o = shuffle(cfg.items.map((_,i)=>i)); }while(o.every((x,i)=>x===i)); st.ord = o; }
  const ol = el('ol','order-list'); b.append(ol);
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn); const fb = el('div','fb'); b.append(act, fb);
  if(quiz) act.hidden = true;
  let locked = false;
  function paint(show){
    ol.innerHTML='';
    st.ord.forEach((it,pos)=>{
      const li = el('li', show ? (it===pos?'ok':'bad') : '', `<span class="nr">${pos+1}</span><span class="tx">${cfg.items[it]}</span>`);
      const up = el('button','', '▲'); up.type='button'; up.setAttribute('aria-label','hoger'); up.disabled = pos===0 || locked;
      const dn = el('button','', '▼'); dn.type='button'; dn.setAttribute('aria-label','lager'); dn.disabled = pos===st.ord.length-1 || locked;
      up.addEventListener('click', ()=>swap(pos, pos-1)); dn.addEventListener('click', ()=>swap(pos, pos+1));
      li.append(up, dn); ol.append(li);
    });
  }
  function swap(i,j){ [st.ord[i], st.ord[j]] = [st.ord[j], st.ord[i]]; st.checked=false; save(); paint(false); fb.textContent=''; fb.className='fb'; }
  const good = () => st.ord.every((x,i)=>x===i);
  btn.addEventListener('click', ()=>{ const ok = good(); paint(true); fb.className='fb '+(ok?'ok':'bad'); fb.innerHTML = ok ? '✅ Juist! '+(cfg.why||'') : '❌ Nog niet. De groene stappen staan al goed. '+(cfg.hint||''); CLres(qid, ok); st.checked=true; save(); });
  paint(!!st.checked && !quiz);
  if(quiz) quiz.push({ grade:good, reveal:()=>paint(true), lock:()=>{ locked=true; paint(true); } });
}

/* --- meerkeuze met eigen knoppen per vraag --- */
const choiceEach = items => (b, st, save, key) => items.forEach((q,i)=> qChoice(b, st, save, key+'_'+i, {html:q.html, ans:q.ans, why:q.why, opts:q.opts, nr:items.length>1?(i+1)+'.':''}));

/* --- steekproef: wie vraag je het? --- */
const SCHOOL_N = 120;
const SCHOOL = (()=>{ /* 48 van de 120 leerlingen (40 %) komen met de fiets; vast patroon zodat iedereen hetzelfde ziet */
  const f = Array(SCHOOL_N).fill(false); let seed = 7; const rnd = () => (seed = (seed*9301+49297)%233280)/233280;
  const idx = [...Array(SCHOOL_N).keys()].sort(()=>rnd()-.5).slice(0,48); idx.forEach(i=>f[i]=true); return f; })();
function sampleDemo(b){
  const box = el('div','viz mid school'); b.append(box);
  const W=520, H=250, cols=15, rows=8, gx=W/cols, gy=(H-10)/rows;
  const svg = newSvg(W, H); box.append(svg);
  const dots = SCHOOL.map((f,i)=>{ const c=svgEl('circle',{cx:gx*(i%cols)+gx/2, cy:gy*Math.floor(i/cols)+gy/2+5, r:Math.min(gx,gy)*.36, class:'p '+(f?'f':'n')}, svg); return c; });
  box.append(el('div','sub', '<span class="pill" style="background:var(--orange)">●</span> komt met de fiets &nbsp; <span class="pill" style="background:#b9c7c8">●</span> komt niet met de fiets'));
  const bar = el('div','btnrow'); b.append(bar);
  const out = el('div'); b.append(out);
  const fiets = SCHOOL.map((f,i)=>f?i:-1).filter(i=>i>=0), niet = SCHOOL.map((f,i)=>f?-1:i).filter(i=>i>=0);
  const pickR = (arr,n) => shuffle(arr).slice(0,n);
  const ways = [
    ['Aan de fietsenstalling', ()=>[...pickR(fiets,18), ...pickR(niet,2)], 'Aan de fietsenstalling staan vooral fietsers: je overschat het aantal fietsers.'],
    ['Aan de bushalte', ()=>[...pickR(fiets,2), ...pickR(niet,18)], 'Aan de bushalte staan vooral busreizigers: je onderschat het aantal fietsers.'],
    ['Enkel je 4 beste vrienden', ()=>[...pickR(fiets,3), ...pickR(niet,1)], 'Vier leerlingen is veel te weinig: toevallig fietsen er 3 van de 4.'],
    ['20 leerlingen, willekeurig gekozen', ()=>pickR([...Array(SCHOOL_N).keys()],20), 'Willekeurig kiezen geeft een resultaat dicht bij de werkelijkheid. Probeer het een paar keer: het schommelt een beetje.'],
    ['60 leerlingen, willekeurig gekozen', ()=>pickR([...Array(SCHOOL_N).keys()],60), 'Hoe meer leerlingen je willekeurig kiest, hoe dichter je bij de echte 40 % komt.']
  ];
  let busy = false;
  ways.forEach(([lab, fn, why])=>{ const bt = el('button','btn ghost', lab); bt.type='button'; bar.append(bt);
    bt.addEventListener('click', async ()=>{ if(busy) return; busy = true; bar.querySelectorAll('.btn').forEach(x=>x.classList.toggle('on', x===bt));
      const pick = fn(); const set = new Set(pick);
      dots.forEach((d,i)=>{ d.classList.remove('pick'); d.classList.toggle('dim', !set.has(i)); });
      for(const i of pick){ dots[i].classList.add('pick'); await sleep(pick.length>30?25:80); }
      const k = pick.filter(i=>SCHOOL[i]).length, pct = k/pick.length*100;
      out.innerHTML = `<div class="meter"><span style="min-width:9rem">jouw steekproef</span><span class="bar"><i></i></span><span>${k} van ${pick.length} = ${nf(pct,0)} %</span></div>
        <div class="meter"><span style="min-width:9rem">de hele school</span><span class="bar true"><i></i></span><span>48 van 120 = 40 %</span></div><div class="fb info">${why}</div>`;
      requestAnimationFrame(()=>{ const is = out.querySelectorAll('.bar i'); is[0].style.width = pct+'%'; is[1].style.width = '40%'; });
      busy = false; });
  });
  out.append(el('div','sub','Kies hierboven hoe je de leerlingen ondervraagt.'));
}

/* --- virtuele klas: tik elke leerling aan om het antwoord te horen --- */
const KLAS_NAMEN = ['Arne','Bram','Chloë','Daan','Emma','Finn','Gust','Hanne','Ilias','Jana','Kobe','Lina','Mats','Nora','Oscar','Paulien','Ruben','Sara','Tibo','Ulla','Victor','Wout','Yara','Zoë'];
/* m = jongen, v = meisje: elk kind krijgt een gezichtje dat bij de naam past */
const KLAS_GESL = 'mmvmvmmvmvmvmvmvmvmvmmvv';
const KLAS_SPORT = ['voetbal','dansen','zwemmen','voetbal','hockey','tennis','voetbal','dansen','voetbal','zwemmen','hockey','dansen','voetbal','tennis','voetbal','dansen','hockey','zwemmen','voetbal','dansen','tennis','hockey','zwemmen','dansen'];
const SPORT_CATS = ['voetbal','dansen','zwemmen','hockey','tennis'];
const FACES_M = ['👦','👦🏻','👦🏽','👦🏼','👦🏾'], FACES_V = ['👧','👧🏼','👧🏽','👧🏻','👧🏾'];
const FACES = KLAS_NAMEN.map((_, i)=>(KLAS_GESL[i] === 'v' ? FACES_V : FACES_M)[i % 5]);
function classSurvey(b, st, save, key){
  const asked = st.asked || (st.asked = []);
  b.append(el('div','sub','Tik elke leerling aan en noteer in gedachten (of op een blad) wat ze antwoorden.'));
  const grid = el('div','avatars'); b.append(grid);
  const cnt = el('div','sub'); b.append(cnt);
  KLAS_NAMEN.forEach((nm,i)=>{ const a = el('button','avatar'+(asked.includes(i)?' done':''), `<span class="face">${FACES[i%FACES.length]}</span><span class="nm">${nm}</span><span class="say">${asked.includes(i)?KLAS_SPORT[i]:''}</span>`); a.type='button'; grid.append(a);
    a.addEventListener('click', ()=>{ if(!asked.includes(i)){ asked.push(i); save(); } a.classList.add('done'); a.querySelector('.say').textContent = KLAS_SPORT[i]; paintCnt(); }); });
  function paintCnt(){ cnt.innerHTML = asked.length<24 ? `Je ondervroeg <b>${asked.length}</b> van de 24 leerlingen.` : '✅ Je ondervroeg de hele klas. Vul nu de tabel in.'; }
  paintCnt();
}

/* --- geheugenexperiment (het onderzoek van Frank, nu digitaal) --- */
const MEM_SHOW = ['🍎','🚲','🐶','⚽','🎸','🌵','🚀','🍕','🐢','⏰','🎈','🔑','🦋','🍩','📚','🌈','🐘','🧲','🎩','🚗'];
const MEM_DECOY = ['🍌','🛴','🐱','🏀','🎺','🌻','✈️','🍔','🐸','⌚','🎁','🔒','🐝','🍪','📷','☀️','🦒','🔦','👟','🚌'];
const MEM_KLAS = [8,11,9,12,10,7,13,9,11,10,14,6,9,12,10,11,8,15,9,10,12,9,11,13];
function memoryExp(b, st, save, key){
  const box = el('div'); b.append(box);
  let timer = null;
  function stage(){
    clearInterval(timer); box.innerHTML='';
    if(st.mem==null){
      box.append(el('div','sub','Je krijgt <b>1 minuut</b> om 20 afbeeldingen te bekijken. Daarna zie je 40 afbeeldingen en tik je aan welke je gezien hebt. Een fout aangetikte afbeelding kost een punt.'));
      const go = el('button','btn','Start het experiment'); go.type='button'; box.append(go);
      go.addEventListener('click', ()=>{ st.phase='kijk'; save(); look(); });
      if(st.phase==='kijk' || st.phase==='kies') { st.phase=null; save(); }
      return;
    }
    result();
  }
  function look(){
    box.innerHTML='';
    const tb = el('div','timebar','<i></i>'); const lab = el('div','sub'); box.append(lab, tb);
    const g = el('div','memgrid'); MEM_SHOW.forEach(e=>g.append(el('div','mi', e))); box.append(g);
    const done = el('button','btn ghost','Ik ben klaar'); done.type='button'; box.append(done);
    let left = 60; const bar = tb.querySelector('i');
    const tick = ()=>{ lab.innerHTML = `Prent ze in je geheugen! Nog <b>${left}</b> seconden.`; bar.style.width = (left/60*100)+'%'; };
    tick(); timer = setInterval(()=>{ left--; tick(); if(left<=0) choose(); }, 1000);
    done.addEventListener('click', choose);
  }
  function choose(){
    clearInterval(timer); box.innerHTML='';
    box.append(el('div','sub','Tik alle afbeeldingen aan die je daarnet gezien hebt. Tik nog eens om het te herstellen.'));
    const order = shuffle([...MEM_SHOW, ...MEM_DECOY]); const sel = new Set();
    const g = el('div','memgrid'); box.append(g);
    order.forEach(e=>{ const bt = el('button','mi', e); bt.type='button'; g.append(bt); bt.addEventListener('click', ()=>{ sel.has(e)?sel.delete(e):sel.add(e); bt.classList.toggle('sel', sel.has(e)); }); });
    const ok = el('button','btn','Klaar: toon mijn score'); ok.type='button'; box.append(ok);
    ok.addEventListener('click', ()=>{
      const good = [...sel].filter(e=>MEM_SHOW.includes(e)).length, bad = sel.size-good;
      st.mem = Math.max(0, good-bad); st.memDetail = {good, bad}; st.phase=null; save();
      g.querySelectorAll('.mi').forEach(bt=>{ const e=bt.textContent; const shown=MEM_SHOW.includes(e);
        bt.disabled = true; bt.classList.remove('sel'); if(sel.has(e)) bt.classList.add(shown?'ok':'bad'); else if(shown) bt.classList.add('miss'); });
      ok.remove(); const r = el('div'); box.append(r); result(r);
    });
  }
  function result(into){
    const host = into || box;
    const {good, bad} = st.memDetail || {good:st.mem, bad:0};
    host.append(el('div','fb ok', `Je herkende <b>${good}</b> afbeeldingen juist en tikte er <b>${bad}</b> fout aan. Jouw score: <b>${st.mem}</b>.`));
    const all = [...MEM_KLAS, st.mem]; const lo = Math.min(5, st.mem), hi = Math.max(16, st.mem);
    const v = el('div','viz mid'); const P = numPlot(all, lo, hi, {xTitle:'score geheugenexperiment (oranje = jij)', hi:new Set([all.length-1])}); v.append(P.svg); host.append(v);
    const lower = MEM_KLAS.filter(x=>x<st.mem).length, same = MEM_KLAS.filter(x=>x===st.mem).length;
    host.append(el('div','sub', `Van de 24 leerlingen van de klas scoorden er <b>${lower}</b> lager dan jij${same?` en <b>${same}</b> evenveel`:''}. De mediaan van de klas is 10.`));
    const again = el('button','linkbtn','Doe het experiment opnieuw'); again.type='button'; host.append(again);
    again.addEventListener('click', ()=>{ st.mem=null; st.memDetail=null; save(); stage(); });
  }
  stage();
}

/* --- reactietijd: klik zodra het vak oranje wordt --- */
function reactionExp(b, st, save, key){
  const times = st.rt || (st.rt = []);
  const boxEl = el('div','rt-box'); b.append(boxEl);
  const row = el('div','rt-times'); b.append(row);
  const ctl = el('div','btnrow'); const reset = el('button','linkbtn','Begin opnieuw'); reset.type='button'; ctl.append(reset); b.append(ctl);
  let state = 'idle', t0 = 0, to = null;
  function paint(){
    row.innerHTML = times.map((t,i)=>`<span class="dv">${t}</span>`).join('') || '<span class="sub">Nog geen metingen.</span>';
    if(times.length>=10){ boxEl.className='rt-box'; boxEl.textContent = '✅ 10 metingen klaar. Werk ze hieronder verder uit.'; state='done'; }
    else if(state==='idle'){ boxEl.className='rt-box'; boxEl.textContent = `Meting ${times.length+1} van 10: tik hier om te starten.`; }
  }
  boxEl.addEventListener('pointerdown', ()=>{
    if(state==='done') return;
    if(state==='idle'){ state='wait'; boxEl.className='rt-box'; boxEl.textContent='Wacht tot het vak oranje wordt ...'; to = setTimeout(()=>{ state='go'; boxEl.className='rt-box go'; boxEl.textContent='NU!'; t0 = performance.now(); }, 1200+Math.random()*2300); return; }
    if(state==='wait'){ clearTimeout(to); state='idle'; boxEl.textContent='Te vroeg! Tik om opnieuw te proberen.'; return; }
    if(state==='go'){ const t = Math.round(performance.now()-t0); times.push(t); save(); state='idle'; paint(); if(st.onMeasure) st.onMeasure(); }
  });
  reset.addEventListener('click', ()=>{ clearTimeout(to); times.length=0; state='idle'; save(); paint(); });
  paint();
}
const rtCheck = (st, f, tol, what) => v => {
  const t = st.rt || []; if(t.length<10) return {ok:false, info:true, msg:'Doe eerst de 10 metingen hierboven.'};
  const x = parseLoose(v[0]); if(isNaN(x)) return {ok:false, msg:'Typ enkel een getal.'};
  const want = f(t); const ok = Math.abs(x-want)<=tol; return {ok, msg: ok?`${what} = ${nf(want, Number.isInteger(want)?0:1)} ms.`:'Kijk je berekening nog eens na. Gebruik je rekentoestel met lijsten.'};
};

/* --- datalab: eigen gegevens verwerken (telt niet mee) --- */
function dataLab(b, st, save, key){
  const box = el('div','labbox'); b.append(box);
  box.append(el('div','sub','Plak hier de antwoorden op één vraag (bv. een kolom uit de antwoorden van je Google Formulier), of typ ze: één antwoord per regel, of gescheiden door komma\'s of puntkomma\'s. Getallen met een komma mogen: 1,5.'));
  const ta = el('textarea'); ta.value = st.txt || ''; ta.placeholder = 'voetbal\ndansen\nvoetbal\n...'; box.append(ta);
  const opt = el('div','btnrow'); box.append(opt);
  const qIn = el('input','inp'); qIn.placeholder='je onderzoeksvraag'; qIn.value = st.q || ''; qIn.style.minWidth='18rem'; qIn.style.flex='1';
  const ex = el('button','btn ghost','Voorbeeld laden'); ex.type='button';
  opt.append(qIn, ex);
  const out = el('div','lab-out'); b.append(out);
  ex.addEventListener('click', ()=>{ ta.value = '2;1;0;3;1;2;2;1;0;1;4;2;1;3;2;1;0;2;1;1;2;3'; qIn.value = 'Hoeveel huisdieren hebben de leerlingen van onze klas?'; st.txt=ta.value; st.q=qIn.value; save(); run(); });
  ta.addEventListener('input', ()=>{ st.txt = ta.value; save(); run(); });
  qIn.addEventListener('input', ()=>{ st.q = qIn.value; save(); run(); });
  function parse(){
    const t = ta.value.trim(); if(!t) return [];
    const parts = /[\n;\t]/.test(t) ? t.split(/[\n;\t]+/) : t.split(/,\s+|,(?=\D)|(?<=\D),/);
    return parts.map(x=>x.trim()).filter(x=>x!=='');
  }
  function run(){
    out.innerHTML='';
    const raw = parse(); if(raw.length<2){ out.append(el('div','sub','Vul minstens twee antwoorden in.')); return; }
    const numsV = raw.map(parseLoose); const numeric = numsV.every(x=>!isNaN(x));
    const vals = numeric ? numsV : raw.map(x=>x.toLowerCase());
    const cats = numeric ? [...new Set(vals)].sort((a,b)=>a-b) : [...new Set(vals)].sort((a,b)=>countOf(vals,b)-countOf(vals,a));
    const n = vals.length;
    const fr = cats.map(c=>countOf(vals,c));
    const head = el('div','sub', `<b>${n}</b> antwoorden · ${numeric?'<b>numerieke</b> data: je kan ermee rekenen.':'<b>categorische</b> data: je kan ze tellen, niet uitrekenen.'}`);
    out.append(head);
    const two = el('div'); out.append(two);
    const left = el('div'), right = el('div'); two.append(left, right);
    left.innerHTML = ftabHTML([numeric?'waarde':'antwoord','frequentie','percentage'], [...cats.map((c,i)=>[numeric?nf(c,6):c, fr[i], nf(fr[i]/n*100,1)+' %']), ['<b>totaal</b>', '<b>'+n+'</b>', '<b>100 %</b>']]);
    const m = [['aantal gegevens', n], ['modus', modes(vals).map(x=>numeric?nf(x,6):x).join(' en ') + (Math.max(...fr)===1?' (elk gegeven komt één keer voor: geen modus)':'')]];
    if(numeric){ const s=sorted(vals); m.push(['gemiddelde', nf(mean(vals),2)], ['mediaan', nf(median(vals),2)], ['kleinste · grootste', nf(s[0],6)+' · '+nf(s[s.length-1],6)], ['variatiebreedte', nf(s[s.length-1]-s[0],6)]); }
    left.insertAdjacentHTML('beforeend', '<h4 style="margin:.8rem 0 .2rem">Maten</h4>'+ftabHTML(['maat','waarde'], m).replace('class="ftab"','class="ftab lab-measures"'));
    const types = numeric ? [['kolom','staafdiagram'],['dot','stippendiagram'],['lijn','lijndiagram']] : [['kolom','staafdiagram'],['staaf','liggend staafdiagram'],['cirkel','cirkeldiagram'],['strook','strookdiagram']];
    if(!types.some(t=>t[0]===st.type)) st.type = types[0][0];
    const tb = el('div','btnrow'); right.append(tb);
    types.forEach(([t,lab])=>{ const bt=el('button','btn ghost'+(st.type===t?' on':''), lab); bt.type='button'; tb.append(bt); bt.addEventListener('click', ()=>{ st.type=t; save(); run(); }); });
    right.style.marginTop='1rem'; const v = el('div','viz mid'); right.append(v);
    const labels = cats.map(c=>numeric?nf(c,6):c);
    v.append(drawChart(st.type, {labels, series:[{name:'aantal', values:fr}], title: st.q || '', xTitle: numeric?'waarde':'', yTitle: (st.type==='cirkel'||st.type==='strook')?'':'aantal', anim:false}));
    if(st.type==='lijn') right.append(el('div','fb info','Let op: een lijndiagram past bij gegevens die in de tijd veranderen. Voor een frequentietabel kies je beter een staaf- of stippendiagram.'));
    const top = cats[fr.indexOf(Math.max(...fr))];
    const besluit = numeric
      ? `Besluit: we ondervroegen ${n} leerlingen. Gemiddeld is het antwoord ${nf(mean(vals),1)}, de mediaan is ${nf(median(vals),1)}. Het meest gegeven antwoord is ${nf(top,6)}.`
      : `Besluit: we ondervroegen ${n} leerlingen. Het meest gekozen antwoord is "${top}" (${fr[cats.indexOf(top)]} van de ${n}, dat is ${nf(Math.max(...fr)/n*100,0)} %).`;
    out.append(el('div','headline', besluit));
    out.append(el('div','sub','Schrijf dit besluit in je eigen woorden en vul aan: wat had je verwacht? Is je groep groot genoeg om iets te besluiten over alle leerlingen van de school?'));
  }
  run();
}

/* ============================================================
   ONDERDEEL 14 · EEN ONDERZOEK OPZETTEN
   ============================================================ */
const CHEAT_OZ = `<h3>Spiekbriefje · statistisch onderzoek</h3><table>
<tr><td>1. vraag</td><td>Een duidelijke onderzoeksvraag: wat wil je te weten komen, en over wie?</td></tr>
<tr><td>2. plan</td><td>Wie ondervraag je (een goede steekproef) en hoe (enquête, meting, experiment)?</td></tr>
<tr><td>3. verzamelen</td><td>De ruwe data noteren of laten invullen (Google Formulier).</td></tr>
<tr><td>4. verwerken</td><td>Frequentietabel, diagram, centrummaten (rekentoestel of rekenblad).</td></tr>
<tr><td>5. besluit</td><td>Een antwoord op je vraag, met getallen erbij. Kan je het besluit vertrouwen?</td></tr>
<tr><td>goede vraag</td><td>niet vaag, niet sturend, antwoorden die niet overlappen en alle mogelijkheden dekken</td></tr>
<tr><td>steekproef</td><td>groot genoeg en willekeurig gekozen, niet enkel je vrienden of één plek</td></tr></table>`;
const VQ = [['v','vaag'],['s','sturend'],['o','antwoorden overlappen'],['g','goede vraag']];
SECTIONS.push({ id:'onderzoek', ic:'onderzoek', nav:'Een onderzoek opzetten', title:'Een statistisch onderzoek opzetten', cheat:CHEAT_OZ,
  tip:'Een onderzoek doorloopt altijd dezelfde stappen: vraag, plan, data verzamelen, verwerken en besluit. Het besluit is maar zo goed als je vraag en je steekproef.',
  cards:[
    { title:'De onderzoekscyclus', lvl:1, instr:'Lien wil weten hoe de leerlingen van het eerste jaar naar school komen. Zet haar stappen in de juiste volgorde met de pijltjes.',
      build:(b,st,save,key)=>orderEx(b,st,save,key,{ items:[
        'Ze schrijft haar vraag op: "Hoe komen de leerlingen van het eerste jaar naar school?"',
        'Ze beslist wie ze ondervraagt (alle 1ste jaars) en maakt een Google Formulier.',
        'De leerlingen vullen het formulier in: ze heeft de ruwe data.',
        'Ze maakt een frequentietabel en een staafdiagram.',
        'Ze schrijft: "45 % komt met de fiets, de fiets is het meest gebruikte vervoermiddel."'
      ], hint:'Begin bij de vraag en eindig bij het besluit.', why:'Vraag, plan, verzamelen, verwerken, besluit: de onderzoekscyclus.' }) },
    { title:'Wat is er mis met de vraag?', lvl:1, instr:'Sorteer de enquêtevragen. Sleep of tik elke vraag naar de juiste bak.',
      build:(b,st,save,key)=>sortBins(b,st,save,key,{bins:[['v','Vaag'],['s','Sturend'],['o','Antwoorden overlappen'],['g','Goede vraag']], items:[
        {t:'Sport je veel?', a:'v', why:'Wat is "veel"? Iedereen bedoelt iets anders.'},
        {t:'Vind jij ook dat de pauze te kort is?', a:'s', why:'"Ook" duwt je naar het antwoord ja.'},
        {t:'Hoeveel uur gamen? 0-2 u · 2-4 u · 4-6 u', a:'o', why:'Wie 2 uur gamet, past in twee vakjes.'},
        {t:'Hoeveel broers en zussen heb je?', a:'g', why:'Duidelijk, en het antwoord is een getal.'},
        {t:'Eet je gezond?', a:'v', why:'Wat is gezond? De antwoorden zeggen weinig.'},
        {t:'De nieuwe schoolbel is toch veel te luid, niet?', a:'s', why:'De vraag geeft het antwoord al.'},
        {t:'Hoe oud ben je? 10-12 · 12-14 · 14-16', a:'o', why:'Wie 12 is, past in twee vakjes.'},
        {t:'Met welk vervoermiddel kom je meestal naar school?', a:'g', why:'Duidelijk en niet sturend.'}
      ]}) },
    { title:'Verbeter de vraag', lvl:2, instr:'Kies telkens de beste versie van de vraag.',
      build:choiceEach([
        {html:'Lees je veel?', opts:[['a','Lees je heel veel?'],['b','Hoeveel boeken las je de voorbije maand?'],['c','Lees jij ook graag?']], ans:'b', why:'Met een getal weet je precies wat iemand bedoelt.'},
        {html:'Vind jij ook dat er te veel huiswerk is?', opts:[['a','Hoeveel minuten per dag besteed je aan huiswerk?'],['b','Er is toch te veel huiswerk?'],['c','Haat je huiswerk?']], ans:'a', why:'Een neutrale vraag die je kan meten.'},
        {html:'Hoeveel zakgeld krijg je per week? 0-5 € · 5-10 € · 10-20 €', opts:[['a','0-5 € · 5-10 € · 10-20 € · meer dan 20 €'],['b','minder dan 5 € · 5 € tot minder dan 10 € · 10 € tot minder dan 20 € · 20 € of meer'],['c','weinig · gemiddeld · veel']], ans:'b', why:'Geen overlap (5 € hoort maar bij één vakje) en alle bedragen passen ergens.'}
      ]) },
    { title:'Wie vraag je het?', lvl:1, instr:'In deze school komen 48 van de 120 leerlingen met de fiets: 40 %. Een onderzoeker weet dat niet en ondervraagt een deel van de leerlingen. Probeer de manieren uit en vergelijk met de echte 40 %.',
      build:combo(b=>sampleDemo(b), choiceList([
        ['Je ondervraagt enkel leerlingen aan de fietsenstalling. Wat gebeurt er met het percentage fietsers?', 'h', 'Je ondervraagt vooral fietsers: het percentage is te hoog.'],
        ['Je ondervraagt willekeurig 60 leerlingen. Wat gebeurt er met het percentage fietsers?', 'j', 'Bij een grote, willekeurige steekproef kom je dicht bij de echte 40 %.']
      ], [['h','te hoog'],['l','te laag'],['j','ongeveer juist']])) },
    { title:'Ondervraag de klas', lvl:2, instr:'Wat is de favoriete sport van de 24 leerlingen van 1C? Ondervraag ze allemaal en verwerk de antwoorden.',
      build:combo((b,st,save,key)=>classSurvey(b,st,save,key), list([
        {html:'voetbal: [[0]] · dansen: [[1]] · zwemmen: [[2]] · hockey: [[3]] · tennis: [[4]]', size:'xs', mode:'numeric', check:nums(SPORT_CATS.map(c=>countOf(KLAS_SPORT,c)), 0, 'Tel opnieuw. Samen moet het 24 zijn.'), sol:'voetbal 7, dansen 6, zwemmen 4, hockey 4, tennis 3: samen 24.'},
        {html:'Welk percentage van de klas koos voetbal? Rond af op een geheel getal. [[0]] %', mode:'numeric', check:approx(29.17, 0.5), sol:'7 : 24 · 100 = 29,17 % ≈ <b>29 %</b>.'}
      ], {letters:true}), choiceEach([
        {html:'Welk diagram past het best om te tonen welk deel van de klas elke sport koos?', opts:[['k','staafdiagram'],['c','cirkeldiagram'],['l','lijndiagram']], ans:'c', why:'Een cirkeldiagram toont hoe het geheel (de klas) verdeeld is. Een staafdiagram mag ook, een lijndiagram niet: er is geen verloop in de tijd.'},
        {html:'Welk besluit is juist?', opts:[['a','De meeste leerlingen van de school spelen voetbal.'],['b','In 1C is voetbal de favoriete sport: 7 van de 24 leerlingen kozen het.'],['c','Meer dan de helft van 1C koos voetbal.']], ans:'b', why:'Je ondervroeg enkel 1C, dus je besluit gaat over 1C. 7 van 24 is minder dan de helft.'}
      ])) }
  ]});

/* ============================================================
   ONDERDEEL 15 · EXPERIMENTEN
   ============================================================ */
SECTIONS.push({ id:'experiment', ic:'experiment', nav:'Experimenten', title:'Zelf data verzamelen met een experiment', cheat:CHEAT_OZ,
  tip:'Bij een experiment verzamel je zelf de data door te meten. Daarna verwerk je ze zoals altijd: tabel, diagram, centrummaten.',
  cards:[
    { title:'Het geheugenexperiment', lvl:1, instr:'Hoeveel afbeeldingen onthoud je in één minuut? Doe het experiment en vergelijk jezelf met de 24 leerlingen van 1Z.',
      build:combo((b,st,save,key)=>memoryExp(b,st,save,key),
        '<h4 style="margin:1rem 0 .3rem">De scores van 1Z</h4>'+ftabHTML(['score','6','7','8','9','10','11','12','13','14','15'], [['aantal leerlingen','1','1','2','5','4','4','3','2','1','1']]),
        list([
          {html:'Hoeveel leerlingen deden mee? [[0]]', mode:'numeric', check:exact(24), sol:'1 + 1 + 2 + 5 + 4 + 4 + 3 + 2 + 1 + 1 = 24.'},
          {html:'Modus = [[0]]', mode:'numeric', check:exact(9), sol:'Score 9 komt het vaakst voor (5 keer).'},
          {html:'Mediaan = [[0]]', check:exact(10), sol:'24 gegevens: de mediaan ligt tussen het 12de en het 13de gegeven. Beide zijn 10, dus Me = <b>10</b>.'},
          {html:'Gemiddelde (afgerond op 0,1) = [[0]]', check:approx(10.4, 0.05), sol:'(6 + 7 + 2 · 8 + 5 · 9 + 4 · 10 + 4 · 11 + 3 · 12 + 2 · 13 + 14 + 15) : 24 = 249 : 24 = 10,375 ≈ <b>10,4</b>.'},
          {html:'Variatiebreedte = [[0]]', mode:'numeric', check:exact(9), sol:'15 − 6 = <b>9</b>.'}
        ], {letters:true})) },
    { title:'Het reactietijdexperiment', lvl:2, instr:'Hoe snel reageer jij? Tik op het vak zodra het oranje wordt. Je reactietijd wordt gemeten in milliseconden (1000 ms = 1 s). Doe 10 metingen.',
      build:(b,st,save,key)=>{ reactionExp(b,st,save,key);
        b.append(el('div','sub','Werk je eigen 10 metingen uit met je rekentoestel (of met het rekenblad).'));
        list([
          {html:'Gemiddelde (afgerond op 1 ms) = [[0]] ms', check:rtCheck(st, mean, 1, 'Het gemiddelde'), sol:'Tel de 10 tijden op en deel door 10.'},
          {html:'Mediaan = [[0]] ms', check:rtCheck(st, median, 0.5, 'De mediaan'), sol:'Orden de 10 tijden. De mediaan is het gemiddelde van het 5de en het 6de gegeven.'},
          {html:'Variatiebreedte = [[0]] ms', check:rtCheck(st, t=>Math.max(...t)-Math.min(...t), 0, 'De variatiebreedte'), sol:'De traagste tijd min de snelste tijd.'}
        ], {letters:true})(b,st,save,key+'_m');
        choiceEach([
          {html:'Stel dat je één keer zat te dromen en pas na 2000 ms tikte. Welke maat verandert dan het meest?', opts:[['g','het gemiddelde'],['m','de mediaan'],['n','geen van beide']], ans:'g', why:'Eén uitschieter trekt het gemiddelde mee omhoog. De mediaan schuift hoogstens een plaatsje op.'},
          {html:'Welke maat geeft dan het beste beeld van jouw gewone reactietijd?', opts:[['g','het gemiddelde'],['m','de mediaan']], ans:'m', why:'De mediaan trekt zich weinig aan van één uitschieter.'}
        ])(b,st,save,key+'_c'); } }
  ]});

/* ============================================================
   ONDERDEEL 16 · KRITISCH LEZEN
   ============================================================ */
const KRIT = [['as','misleidende as'],['weinig','te weinig mensen ondervraagd'],['groep','verkeerde groep ondervraagd'],['uit','gemiddelde met een uitschieter'],['ok','het besluit klopt']];
const krantEx = items => (b, st, save, key) => items.forEach((it,i)=>{
  const wrap = el('div','q'); b.append(wrap);
  wrap.append(el('div','headline', (items.length>1?`${LET[i]}. `:'')+it.kop));
  if(it.info) wrap.append(el('div','sub', it.info));
  if(it.chart){ const v=el('div','viz narrow'); v.append(drawChart(it.chart[0], Object.assign({anim:false}, it.chart[1]), 460, 280)); wrap.append(v); }
  qChoice(wrap, st, save, key+'_'+i, {html:'Wat is er aan de hand?', ans:it.ans, why:it.why, opts:KRIT});
});
SECTIONS.push({ id:'kritisch', ic:'mislei', nav:'Kritisch lezen', title:'Kritisch lezen: klopt het besluit?', cheat:CHEAT_OZ,
  tip:'Lees een krantenkop met statistiek altijd kritisch. Waar begint de as? Hoeveel mensen werden ondervraagd, en wie? Is het gemiddelde eerlijk, of zit er een uitschieter in?',
  cards:[
    { title:'Krantenkoppen', lvl:1, instr:'Lees elke krantenkop en de uitleg erbij. Wat is er aan de hand?',
      build:krantEx([
        {kop:'Leerlingen slapen steeds minder!', chart:['kolom',{labels:['2022','2023','2024'], series:[{values:[8.6,8.5,8.4]}], yMin:8.3, yMax:8.7, step:0.1, title:'Gemiddeld aantal uren slaap', brk:false}], ans:'as', why:'De as begint bij 8,3 uur. In werkelijkheid slapen de leerlingen maar 12 minuten minder dan in 2022.'},
        {kop:'90 % van de jongeren wil een zwembad in Lievegem', info:'Het onderzoek werd gedaan bij 50 leden van de zwemclub.', ans:'groep', why:'Leden van een zwemclub willen natuurlijk een zwembad. Ze zijn geen goede steekproef van alle jongeren.'},
        {kop:'Drie op vier leerlingen eten liever frietjes dan pasta', info:'De journalist vroeg het aan 4 leerlingen.', ans:'weinig', why:'Met 4 leerlingen kan je niets besluiten over alle leerlingen.'},
        {kop:'Leerlingen van 1A krijgen gemiddeld 28 euro zakgeld per week!', info:'21 leerlingen krijgen tussen 0 en 10 euro. Eén leerling kreeg een week 500 euro voor zijn verjaardag.', ans:'uit', why:'Die ene uitschieter trekt het gemiddelde omhoog. De mediaan (ongeveer 6 euro) geeft een eerlijker beeld.'},
        {kop:'Steeds meer leerlingen komen met de fiets', info:'Alle 600 leerlingen van de school werden twee jaar na elkaar bevraagd.', chart:['kolom',{labels:['2023','2024'], series:[{values:[180,240]}], title:'Aantal leerlingen met de fiets', yTitle:'aantal'}], ans:'ok', why:'Iedereen werd bevraagd, de as begint bij 0 en de stijging van 180 naar 240 is echt.'}
      ]) },
    { title:'Zelf een kop schrijven', lvl:2, instr:'Op 200 ondervraagde 1ste jaars kozen er 84 voor een schoolreis naar zee, 70 voor een pretpark en 46 voor de Ardennen.',
      build:combo(list([
        {html:'Welk percentage koos voor zee? [[0]] %', check:exact(42), sol:'84 : 200 · 100 = <b>42 %</b>.'}
      ], {}), choiceEach([
        {html:'Welke krantenkop is eerlijk?', opts:[['a','Bijna alle leerlingen willen naar zee!'],['b','Meer dan 4 op 10 eerstejaars kiezen voor zee'],['c','De Ardennen zijn saai volgens leerlingen']], ans:'b', why:'42 % is iets meer dan 4 op 10. "Bijna alle" overdrijft, en over saai werd niets gevraagd.'}
      ])) }
  ]});

/* ============================================================
   ONDERDEEL 17 · DATALAB (telt niet mee)
   ============================================================ */
SECTIONS.push({ id:'datalab', ic:'datalab', nav:'Datalab: mijn onderzoek', title:'Datalab: verwerk je eigen onderzoek', cheat:CHEAT_OZ,
  tip:'Hier verwerk je de antwoorden van je eigen onderzoek, bijvoorbeeld uit een Google Formulier. Het datalab maakt de frequentietabel, de diagrammen en de maten. Jij schrijft het besluit. Dit telt niet mee.',
  cards:[
    { title:'Mijn eigen onderzoek', lvl:1, instr:'Plak of typ de antwoorden op één vraag van je onderzoek.',
      build:(b,st,save,key)=>dataLab(b,st,save,key) }
  ]});
/* ============================================================
   KLASSESSIE: de hele klas doet tegelijk een experiment
   De leerkracht start een sessie (code op het bord), de leerlingen doen mee met de code,
   de leerkracht start de ronde voor iedereen tegelijk en het bord toont live de klastabel en de dotplot.
   Firestore: klassessie/{code} (van de leerkracht) en klassessie/{code}/deelnemers/{email} (elke leerling enkel zijn eigen).
   ============================================================ */
(function(){
  const css = `
  .ks{ border:2px dashed var(--border); border-radius:1rem; padding:.8rem 1rem; margin:.6rem 0 1rem; background:var(--zone-bg); display:flex; flex-direction:column; gap:.6rem; }
  .ks h3{ margin:0; font-size:1.1rem; color:var(--accent-dark); }
  .ks-rij{ display:flex; flex-wrap:wrap; gap:.6rem; align-items:center; }
  .ks-in{ width:7.5rem; text-transform:uppercase; letter-spacing:.15em; font-weight:700; text-align:center; }
  .ks-lk{ border-top:1px solid var(--border); padding-top:.6rem; }
  .ks-lk .lab{ font-weight:700; }
  .ks-tel{ font-size:4rem; font-weight:800; color:var(--orange); text-align:center; line-height:1.2; }
  .ks-bord{ position:fixed; inset:0; z-index:200; background:var(--bg, #fff); overflow:auto; padding:1.2rem max(16px, env(safe-area-inset-left, 0px)); display:flex; flex-direction:column; gap:1rem; }
  .ks-kop{ display:flex; flex-wrap:wrap; align-items:center; gap:1rem 2rem; justify-content:space-between; }
  .ks-kop h2{ margin:0; font-size:1.6rem; }
  .ks-code{ font-size:1.15rem; }
  .ks-code b{ font-size:3.2rem; letter-spacing:.2em; color:var(--accent-dark); vertical-align:middle; margin-left:.4rem; }
  .ks-status{ font-size:1.15rem; font-weight:700; }
  .ks-grid{ display:grid; grid-template-columns:minmax(260px,.8fr) minmax(0,1.6fr); gap:1.4rem; align-items:start; }
  .ks-grid .ftab{ width:100%; font-size:1.05rem; }
  .ks-grid .ftab td.wacht{ color:var(--ink-soft); font-style:italic; }
  .ks-maten{ display:flex; flex-wrap:wrap; gap:.6rem; margin-top:.6rem; }
  .ks-maten span{ border:2px solid var(--border); border-radius:.7rem; padding:.35rem .8rem; background:var(--card); font-size:1.05rem; }
  .ks-maten b{ color:var(--accent-dark); }
  @media (max-width: 900px){ .ks-grid{ grid-template-columns:minmax(0,1fr); } }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

const KS_EXP = { geheugen:'Het geheugenexperiment', reactie:'Het reactietijdexperiment' };
const KS_TEKENS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let KS_FB = null;
async function ksFirebase(){
  if(KS_FB) return KS_FB;
  const kop = document.querySelector('script[src*="gedeeld/kop.js"]');
  if(!kop) throw new Error('geen platform');
  const M = await import(new URL('aanmelden.js', kop.src).href);
  const s = await Promise.race([M.klaar, new Promise((_, rej)=>setTimeout(()=>rej(new Error('niet aangemeld')), 15000))]);
  const vol = (s.user && s.user.displayName) || s.email.split('@')[0], d = vol.split(' ');
  KS_FB = { F:M.F, db:M.db, me:s.email, rol:s.rol, naam: d.length>1 ? `${d[0]} ${d[d.length-1][0]}.` : d[0] };
  return KS_FB;
}
const ksFout = e => /aangemeld|platform|module|fetch/i.test(e.message) ? 'Een klassessie werkt alleen als je aangemeld bent op het oefenplatform.' : /permission|insufficient/i.test(e.message) ? 'Dit lukt nog niet: de klassessie moet eerst aangezet worden in Firebase.' : e.message;

/* ---------- het kader bovenaan het onderdeel Experimenten ---------- */
function ksPaneel(sec){
  const box = el('div','ks'); sec.append(box);
  const fb = el('div','fb');
  const leerling = el('div');
  function start(msg){
    leerling.innerHTML = '';
    const inp = el('input','inp ks-in'); inp.maxLength = 4; inp.placeholder = 'CODE'; inp.setAttribute('aria-label','Code van de klassessie');
    const mee = el('button','btn','Meedoen'); mee.type = 'button';
    const rij = el('div','ks-rij'); rij.append(inp, mee);
    leerling.append(el('p','', 'Doet je klas het experiment samen? Typ de code die je leerkracht op het bord toont.'), rij);
    const join = ()=>{ fb.className = 'fb'; fb.textContent = ''; ksMeedoen(inp.value.trim().toUpperCase()).catch(e=>{ fb.className = 'fb bad'; fb.textContent = ksFout(e); }); };
    mee.onclick = join; inp.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); join(); } });
    if(msg){ fb.className = 'fb info'; fb.innerHTML = msg; }
  }
  box.append(el('h3','', '👩‍🏫 Samen met de klas'), leerling, fb);
  start();

  /* enkel voor leerkrachten: een klassessie starten */
  ksFirebase().then(FB=>{
    if(FB.rol !== 'leerkracht' && FB.rol !== 'beheerder') return;
    const lk = el('div','ks-lk');
    lk.append(el('p','', '<span class="lab">Voor de leerkracht:</span> start een klassessie. Het bord toont een code; de leerlingen doen mee op hun Chromebook. Jij start de ronde, zodat iedereen tegelijk begint. De resultaten verschijnen live in een klastabel en een dotplot.'));
    const rij = el('div','ks-rij');
    Object.entries(KS_EXP).forEach(([k, t])=>{ const bt = el('button','btn ghost', '▶ Klassessie starten: '+t.replace('Het ','').toLowerCase()); bt.type = 'button'; bt.dataset.exp = k; rij.append(bt);
      bt.onclick = ()=>ksMaak(k).catch(e=>{ fb.className = 'fb bad'; fb.textContent = ksFout(e); }); });
    lk.append(rij); box.insertBefore(lk, fb);
  }).catch(()=>{});

  /* ---------- leerling ---------- */
  let unsub = null, ronde = null, bezig = false;
  async function ksMeedoen(code){
    if(!/^[A-Z0-9]{4}$/.test(code)) throw new Error('Een code heeft 4 tekens.');
    const FB = await ksFirebase(); const { F, db } = FB;
    const ref = F.doc(db, 'klassessie', code); const s = await F.getDoc(ref);
    if(!s.exists()) throw new Error(`Er is geen klassessie met code ${code}.`);
    const mij = F.doc(db, 'klassessie', code, 'deelnemers', FB.me);
    await F.setDoc(mij, { naam:FB.naam, ronde:s.data().ronde, klaar:false, n:0 });
    ronde = s.data().ronde; bezig = false;
    if(unsub) unsub();
    unsub = F.onSnapshot(ref, snap=>{
      if(!snap.exists()){ if(unsub) unsub(); unsub = null; start('De klassessie is gestopt.'); return; }
      const d = snap.data();
      if(d.ronde !== ronde){ ronde = d.ronde; bezig = false; F.setDoc(mij, { naam:FB.naam, ronde, klaar:false, n:0 }).catch(()=>{}); }
      if(bezig) return;
      if(d.status === 'loopt'){ bezig = true; ksDoe(d.exp, code, mij); return; }
      leerling.innerHTML = '';
      leerling.append(el('p','', `Je doet mee met de klassessie <b>${code}</b>: ${KS_EXP[d.exp].toLowerCase()}.`));
      leerling.append(el('div','fb info', d.status === 'klaar' ? 'De ronde is afgesloten. Kijk naar het bord.' : '⏳ Wacht tot je leerkracht de ronde start. Iedereen begint tegelijk.'));
    }, e=>{ fb.className = 'fb bad'; fb.textContent = ksFout(e); });
  }
  /* aftellen en dan het experiment, het resultaat gaat naar het bord */
  function ksDoe(exp, code, mij){
    const { F } = KS_FB;
    leerling.innerHTML = ''; fb.className = 'fb'; fb.textContent = '';
    const tel = el('div','ks-tel'); leerling.append(el('p','', `Klassessie <b>${code}</b>: ${KS_EXP[exp].toLowerCase()}. Iedereen begint tegelijk!`), tel);
    let n = 3; tel.textContent = n;
    const t = setInterval(()=>{ n--; if(n>0){ tel.textContent = n; return; } clearInterval(t); tel.remove(); loop(); }, 1000);
    function loop(){
      const area = el('div'); leerling.append(area);
      const tmp = {}; let weg = false;
      if(exp === 'geheugen'){
        memoryExp(area, tmp, ()=>{
          if(tmp.mem == null || weg) return; weg = true;
          F.setDoc(mij, { score:tmp.mem, goed:tmp.memDetail.good, fout:tmp.memDetail.bad, klaar:true }, { merge:true }).catch(e=>{ fb.className = 'fb bad'; fb.textContent = ksFout(e); });
          setTimeout(()=>{ area.querySelectorAll('.linkbtn').forEach(x=>x.remove()); area.append(el('div','fb info', '📺 Je score staat nu op het bord bij de resultaten van je klas.')); }, 0);
        }, 'ks');
        const go = area.querySelector('button.btn'); if(go) go.click();
      } else {
        tmp.rt = [];
        reactionExp(area, tmp, ()=>{
          if(weg) return; const tijden = tmp.rt.slice();
          if(tijden.length < 10){ F.setDoc(mij, { n:tijden.length }, { merge:true }).catch(()=>{}); return; }
          weg = true;
          F.setDoc(mij, { n:10, tijden, mediaan:median(tijden), gem:Math.round(mean(tijden)), klaar:true }, { merge:true }).catch(e=>{ fb.className = 'fb bad'; fb.textContent = ksFout(e); });
          area.querySelectorAll('.btnrow').forEach(x=>x.remove());
          area.append(el('div','fb info', `📺 Jouw mediaan is <b>${nf(median(tijden),1)} ms</b>. Ze staat nu op het bord bij de resultaten van je klas.`));
        }, 'ks');
      }
    }
  }
}

/* ---------- leerkracht: sessie maken en het bord ---------- */
async function ksMaak(exp){
  const FB = await ksFirebase(); const { F, db } = FB;
  for(let t=0;t<20;t++){
    const c = [...Array(4)].map(()=>KS_TEKENS[Math.floor(Math.random()*KS_TEKENS.length)]).join('');
    const r = F.doc(db, 'klassessie', c); const s = await F.getDoc(r);
    if(s.exists()) continue;
    await F.setDoc(r, { lk:FB.me, exp, status:'wacht', ronde:1, gemaakt:F.serverTimestamp() });
    return ksBord(c, exp);
  }
  throw new Error('Geen vrije code gevonden. Probeer opnieuw.');
}
function ksBord(code, exp){
  const { F, db } = KS_FB;
  const ref = F.doc(db, 'klassessie', code), col = F.collection(db, 'klassessie', code, 'deelnemers');
  const bord = el('div','ks-bord'); document.body.append(bord);
  const kop = el('div','ks-kop');
  kop.append(el('h2','', `${KS_EXP[exp]} · samen met de klas`), el('div','ks-code', `Ga naar Module 3 › Experimenten en typ de code <b>${code}</b>`));
  const knoppen = el('div','ks-rij'), status = el('div','ks-status');
  const bStart = el('button','btn big','▶ Start voor iedereen'), bStop = el('button','btn big','⏹ Ronde afsluiten'), bNieuw = el('button','btn ghost','↻ Nieuwe ronde'), bScherm = el('button','btn ghost','⛶ Volledig scherm'), bSluit = el('button','btn ghost','✕ Klassessie stoppen');
  [bStart, bStop, bNieuw, bScherm, bSluit].forEach(b=>{ b.type = 'button'; knoppen.append(b); });
  const grid = el('div','ks-grid'), links = el('div'), rechts = el('div'); grid.append(links, rechts);
  bord.append(kop, status, knoppen, grid);
  let sess = { status:'wacht', ronde:1 }, lln = [];
  const u1 = F.onSnapshot(ref, s=>{ if(s.exists()){ sess = s.data(); teken(); } });
  const u2 = F.onSnapshot(col, q=>{ lln = q.docs.map(d=>d.data()); teken(); });
  const zet = p => F.updateDoc(ref, p).catch(e=>{ status.textContent = ksFout(e); });
  bStart.onclick = ()=>zet({ status:'loopt' });
  bStop.onclick = ()=>zet({ status:'klaar' });
  bNieuw.onclick = ()=>zet({ status:'wacht', ronde:(sess.ronde||1)+1 });
  bScherm.onclick = ()=>{ try{ document.fullscreenElement ? document.exitFullscreen() : bord.requestFullscreen(); }catch(e){} };
  bSluit.onclick = async ()=>{
    u1(); u2(); try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){}
    try{ const q = await F.getDocs(col); for(const d of q.docs) await F.deleteDoc(F.doc(db, 'klassessie', code, 'deelnemers', d.id)); await F.deleteDoc(ref); }catch(e){}
    bord.remove();
  };
  function teken(){
    const nu = lln.filter(l=>l.ronde === sess.ronde).sort((a,b)=>a.naam.localeCompare(b.naam));
    const klaar = nu.filter(l=>l.klaar);
    bStart.hidden = sess.status !== 'wacht'; bStop.hidden = sess.status !== 'loopt'; bNieuw.hidden = sess.status !== 'klaar';
    status.textContent = sess.status === 'wacht' ? `Ronde ${sess.ronde}: ${nu.length} ${nu.length===1?'leerling doet':'leerlingen doen'} mee. Start als iedereen er is.`
      : sess.status === 'loopt' ? `Ronde ${sess.ronde} loopt: ${klaar.length} van ${nu.length} klaar.` : `Ronde ${sess.ronde} is afgesloten: ${klaar.length} resultaten.`;
    const res = l => exp === 'geheugen' ? (l.klaar ? `<b>${l.score}</b>` : '') : (l.klaar ? `<b>${nf(l.mediaan,1)} ms</b>` : (l.n ? `${l.n} van 10 metingen` : ''));
    const kopRes = exp === 'geheugen' ? 'score' : 'mediaan reactietijd';
    links.innerHTML = `<h3>Klastabel</h3><table class="ftab"><thead><tr><th>leerling</th><th>${kopRes}</th></tr></thead><tbody>${nu.map(l=>`<tr><td class="l">${ksEsc(l.naam)}</td><td class="${l.klaar?'':'wacht'}">${res(l) || (sess.status==='loopt'?'bezig ...':'doet mee')}</td></tr>`).join('') || '<tr><td colspan="2" class="wacht">Nog niemand. Typ de code op je Chromebook.</td></tr>'}</tbody></table>`;
    rechts.innerHTML = '';
    if(!klaar.length){ rechts.append(el('p','sub', 'Hier verschijnt de dotplot zodra de eerste resultaten binnenkomen.')); return; }
    let vals, lo, hi, step, xt;
    if(exp === 'geheugen'){ vals = klaar.map(l=>l.score); lo = 0; hi = Math.max(20, ...vals); step = 1; xt = 'score geheugenexperiment'; }
    else { const m = klaar.map(l=>l.mediaan); vals = m.map(v=>Math.round(v/25)*25); lo = Math.min(200, Math.floor(Math.min(...vals)/50)*50); hi = Math.max(500, Math.ceil(Math.max(...vals)/50)*50); step = 50; xt = 'mediaan reactietijd (ms, afgerond op 25 ms)'; }
    const v = el('div','viz'); v.append(numPlot(vals, lo, hi, {xTitle:xt, step}).svg); rechts.append(el('h3','', 'Dotplot van de klas'), v);
    const echt = exp === 'geheugen' ? vals : klaar.map(l=>l.mediaan), u = exp === 'geheugen' ? '' : ' ms';
    const mo = modes(echt);
    rechts.append(el('div','ks-maten', `<span>aantal: <b>${echt.length}</b></span><span>modus: <b>${mo.length === echt.length && echt.length > 1 ? 'geen' : mo.map(x=>nf(x,1)).join(' en ')+u}</b></span><span>mediaan: <b>${nf(median(echt),1)}${u}</b></span><span>gemiddelde: <b>${nf(mean(echt),1)}${u}</b></span><span>variatiebreedte: <b>${nf(range(echt),1)}${u}</b></span>`));
  }
  teken();
}
const ksEsc = typeof zsEsc === 'function' ? zsEsc : (s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));

SECTIONS.find(s=>s.id==='experiment').top = ksPaneel;
/* ============================================================
   DE VERWERKINGSOPDRACHTEN UIT HET WERKBOEK, MET ANDERE GETALLEN
   + VERDIEPING ZOALS HET DIFFERENTIATIETRAJECT (pepers)
   ============================================================ */
/* geen verwijzingen meer naar het werkboek in de oefeningen (afspraak oktober 2026) */
const WBsec = id => SECTIONS.find(s=>s.id===id).cards;
/* letters als antwoord: volgorde, spaties en komma's maken niet uit */
const WBletters = (ans, hint) => v => { const got = String(v[0]).toUpperCase().replace(/[^A-Z]/g,'').split('').sort().join(''); const ok = got===ans.split('').sort().join(''); return {ok, msg:ok?'':(hint||'')}; };

/* --- coördinaten --- */
WBsec('coord').push(
  { title:'Coördinaten aflezen', lvl:2, instr:'Lees de coördinaten van de punten af.',
    build:combo((b,st,save,key)=>coordRead(b,st,save,key, [[2,4,'A'],[-5,1,'B'],[0,-3,'C'],[4,-2,'D'],[-3,-4,'E'],[-2,0,'F']]),
      choiceList([
        ['D ligt in kwadrant II.', 'n', 'D(4, −2): x positief en y negatief, dus kwadrant IV.'],
        ['F ligt op de x-as.', 'w', 'F(−2, 0): het tweede coördinaatgetal is 0, dus F ligt op de x-as.'],
        ['C ligt op de y-as.', 'w', 'C(0, −3): het eerste coördinaatgetal is 0, dus C ligt op de y-as.']
      ], WN)) },
  { title:'Punten plaatsen (2)', lvl:2, naast:false, instr:'Plaats de punten in het assenstelsel.',
    build:combo((b,st,save,key)=>coordPlace(b,st,save,key, [[4,2,'J'],[0,-3,'K'],[-2,-5,'L'],[-3,3,'M'],[5,-1,'N'],[-6,0,'P']]), list([
      {html:'Welke punten hebben een strikt negatieve y-coördinaat? Typ de letters: [[0]]', size:'sm', check:WBletters('KLN', 'Kijk naar het tweede getal: kleiner dan 0, dus onder de x-as.'), sol:'K(0, −3), L(−2, −5) en N(5, −1): <b>K, L en N</b>. P(−6, 0) ligt op de x-as: 0 is niet negatief.'}
    ]))},
  { title:'Waar of niet waar? (2)', lvl:2, instr:'Is de uitspraak waar of niet waar?',
    build:choiceList([
      ['Als het tweede coördinaatgetal 0 is, dan ligt het punt op de x-as.', 'w', 'Bv. (5, 0): je gaat 5 naar rechts en 0 naar boven, je blijft op de x-as.'],
      ['P(−4, 1) en Q(4, −1) liggen in hetzelfde kwadrant.', 'n', 'P ligt in kwadrant II, Q in kwadrant IV.'],
      ['Als een punt in kwadrant IV ligt, is het eerste coördinaatgetal positief en het tweede negatief.', 'w', 'Kwadrant IV: rechts van de y-as (x > 0) en onder de x-as (y < 0).'],
      ['Als R(a, −3) en S(2, b) in hetzelfde kwadrant liggen, dan liggen ze in kwadrant IV.', 'w', 'S heeft x = 2 > 0: kwadrant I of IV. R heeft y = −3 < 0: kwadrant III of IV. Samen kan enkel IV.']
    ], WN) }
);
/* verdieping zoals D5, D7, D8 en D9 */
WBsec('coord').push(
  { title:'Uitdaging: speurtocht naar A, B en C', lvl:3, instr:'Zoek de punten A, B en C met de aanwijzingen.',
    build:list([
      {html:'A ligt in kwadrant IV. Het product van de coördinaatgetallen is −12 en hun som is 1. A( [[0]] , [[1]] )', size:'xs', check:nums([4,-3]), sol:'Kwadrant IV: x > 0 en y < 0. 4 · (−3) = −12 en 4 + (−3) = 1. Dus <b>A(4, −3)</b>.'},
      {html:'B ligt op de x-as, 3 eenheden links van de oorsprong. B( [[0]] , [[1]] )', size:'xs', check:nums([-3,0]), sol:'Op de x-as is y = 0. Links van O is x negatief: <b>B(−3, 0)</b>.'},
      {html:'C ligt in kwadrant II. Het product van de coördinaatgetallen is −8 en hun som is 2. C( [[0]] , [[1]] )', size:'xs', check:nums([-2,4]), sol:'Kwadrant II: x < 0 en y > 0. (−2) · 4 = −8 en −2 + 4 = 2. Dus <b>C(−2, 4)</b>.'},
      {html:'ABCD is een parallellogram. D( [[0]] , [[1]] )', size:'xs', check:nums([5,1]), sol:'Van B naar A: 7 naar rechts en 3 naar onder. Zet die stap ook vanaf C: (−2 + 7, 4 − 3) = <b>D(5, 1)</b>.'}
    ], {letters:true}) },
  { title:'Uitdaging: een vlieger', lvl:3, instr:'A(1, 4), B(4, 1) en C(1, −2). ABCD is een vlieger met AC als symmetrieas.',
    build:combo(b=>{ const P = plane(); [[1,4,'A'],[4,1,'B'],[1,-2,'C']].forEach(p=>P.point(p[0],p[1],p[2])); svgEl('line',{x1:P.X(1), y1:P.Y(4), x2:P.X(1), y2:P.Y(-2), class:'proj'}, P.layer); b.append(planeBox(P.svg)); }, list([
      {html:'D is het spiegelbeeld van B tegenover de as AC. D( [[0]] , [[1]] )', size:'xs', check:nums([-2,1]), sol:'B ligt 3 rechts van de as x = 1. D ligt 3 links ervan, op dezelfde hoogte: <b>D(−2, 1)</b>.'},
      {html:'Is AC geen symmetrieas maar BD? Dan ligt D op de rechte door B, evenwijdig met de x-as. Welk coördinaatgetal van D ligt dan vast? y = [[0]]', size:'xs', check:exact(1), sol:'BD staat loodrecht op AC en gaat door het midden (1, 1) van AC. Dus y = <b>1</b>, en D ligt links van AC (x < 1).'}
    ], {letters:true})) },
  { title:'Uitdaging: een gelijkbenige driehoek', lvl:3, instr:'A(−3, −2) en B(5, −2). ∆ABC is gelijkbenig met |AC| = |BC| en heeft een oppervlakte van 24.',
    build:list([
      {html:'Het eerste coördinaatgetal van C is [[0]]', size:'xs', check:exact(1), sol:'C ligt even ver van A als van B: recht boven of onder het midden van [AB]. (−3 + 5) : 2 = <b>1</b>.'},
      {html:'De basis |AB| = [[0]] en de hoogte is [[1]]', size:'xs', check:nums([8,6]), sol:'|AB| = 5 − (−3) = <b>8</b>. Oppervlakte = 8 · h : 2 = 24, dus h = <b>6</b>.'},
      {html:'Er zijn twee mogelijkheden: C(1, [[0]]) of C(1, [[1]])', size:'xs', check:v=>{ const a=parseLoose(v[0]), c=parseLoose(v[1]); const ok = (a===4&&c===-8)||(a===-8&&c===4); return {ok, msg:ok?'':'De hoogte 6 kan je naar boven en naar onder tellen vanaf y = −2.'}; }, sol:'−2 + 6 = <b>4</b> en −2 − 6 = <b>−8</b>.'}
    ], {letters:true}) }
);

/* --- lijndiagram --- */
const WB_BALLON = {labels:['0','10','20','30','40','50','60','70'], series:[{values:[0,200,450,600,600,500,300,0]}], xTitle:'Tijd (in minuten)', yTitle:'Hoogte (in m)', step:100, yMax:700};
WBsec('lijn').push(
  { title:'Een ballonvaart', lvl:2, instr:'Een luchtballon stijgt op en landt weer.',
    build:combo(lineHint(WB_BALLON),
      choiceList([['Van welke twee grootheden toont dit lijndiagram het verband?', 'b', 'Op de horizontale as staat de tijd, op de verticale as de hoogte.']], [['a','hoogte en snelheid'],['b','tijd en hoogte'],['c','tijd en afstand']]),
      choiceList([['Wat betekent het punt (30, 600)?', 'a', 'Eerst de tijd (30 min), dan de hoogte (600 m).']], [['a','Na 30 minuten vliegt de ballon op 600 m.'],['b','Na 600 minuten vliegt de ballon op 30 m.'],['c','De ballon stijgt 30 m per minuut.']]),
      list([
        {html:'Op welke hoogte vliegt de ballon na 50 minuten? [[0]] m', mode:'numeric', check:exact(500), sol:'Bij 50 min staat de grafiek op <b>500 m</b>.'},
        {html:'Hoeveel minuten blijft de ballon op dezelfde hoogte? [[0]] min', mode:'numeric', check:exact(10), sol:'Van 30 tot 40 minuten blijft hij op 600 m: <b>10 minuten</b>.'}
      ], {letters:true})) },
  { title:'Een tweede ballon', lvl:2, instr:'Een tweede ballon vliegt dezelfde dag. Plaats de punten uit de tabel.',
    build:combo(html(ftabHTML(['tijd (in min)','0','10','20','30','40','50','60','70'], [['hoogte (in m)','0','100','300','500','700','700','400','0']])),
      (b,st,save,key)=>linePlot(b,st,save,key,{labels:['0','10','20','30','40','50','60','70'], values:[0,100,300,500,700,700,400,0], chart:{xTitle:'Tijd (in minuten)', yTitle:'Hoogte (in m)', step:100, yMin:0, yMax:800}, snap:100, hint:'Elk hokje op de verticale as is 100 m.', why:'Deze ballon gaat hoger (700 m) maar landt ook na 70 minuten.'})) }
);

/* --- soorten data --- */
WBsec('soort').push(
  { title:'Numeriek of categorisch?', lvl:2, instr:'Welke soort data levert elke vraag op?',
    build:choiceList([
      ['Hoeveel minuten fiets je naar school?', 'n', 'Een tijdsduur: je kan ermee rekenen.'],
      ['Welke kleur heeft je fiets?', 'c', 'Een kleur is een categorie.'],
      ['Hoeveel broers en zussen heb je?', 'n', 'Een aantal: je kan er een gemiddelde van nemen.'],
      ['Welke sport doe je het liefst?', 'c', 'Een sport is een categorie.'],
      ['Wat is je postcode?', 'c', 'Een postcode is een getal, maar rekenen ermee is niet zinvol.'],
      ['Hoeveel kilogram weegt je boekentas?', 'n', 'Een massa: je kan ermee rekenen.'],
      ['In welke klas zit je (bv. 1Ab)?', 'c', 'Een klas is een groep, geen getal.'],
      ['Hoeveel berichtjes stuur je per dag?', 'n', 'Een aantal: numeriek.']
    ], CN) }
);

/* --- diagrammen --- */
WBsec('diagram').push(
  { title:'Het openluchtzwembad', lvl:2, instr:'Lees het diagram en beantwoord de vragen.',
    build:combo(chartBox('lijn', {title:'Bezoekers van een openluchtzwembad', labels:['apr','mei','jun','jul','aug','sep','okt'], series:[{values:[0,12,30,52,48,15,0]}], xTitle:'Maand', yTitle:'Bezoekers (· 100)', step:10, yMax:60}),
      choiceList([['Hoe noemen we deze grafiek?', 'l', 'De punten zijn verbonden met lijnstukken.']], [['l','lijndiagram'],['s','staafdiagram'],['d','dotplot'],['c','cirkeldiagram']]),
      list([
        {html:'Hoeveel bezoekers kwamen er in juli? [[0]]', mode:'numeric', check:exact(5200), sol:'De grafiek staat op 52 en de as telt per 100: 52 · 100 = <b>5200</b>.'},
        {html:'In welke maand kwamen de meeste bezoekers? [[0]]', check:words(['juli','jul']), sol:'Het hoogste punt staat bij <b>juli</b>.'}
      ], {letters:true}),
      choiceList([['"Er zijn maar twee maanden zonder bezoekers." Klopt dit?', 'n', 'In april en oktober zijn er geen bezoekers. Maar van november tot maart staat er niets op de grafiek: dan is het zwembad ook dicht.']], WN)) },
  { title:'Naar de sportclub', lvl:2, instr:'20 leden vertelden hoe ze naar de sportclub komen.',
    build:combo(chartBox('dot', {labels:['fiets','te voet','bus','auto','trein','step'], series:[{values:[7,3,2,6,0,2]}], xTitle:'Vervoer'}),
      choiceList([['Hoe noemen we deze voorstelling?', 'd', 'Per gegeven een bolletje, gestapeld boven de categorie.']], [['s','staafdiagram'],['d','dotplot'],['l','lijndiagram']]),
      choiceList([['Waarom staat er geen bolletje bij trein?', 'b', 'Een categorie zonder bolletjes heeft frequentie 0.']], [['a','Die gegevens zijn verloren gegaan.'],['b','Geen enkel lid komt met de trein.'],['c','De trein telt niet mee.']]),
      list([
        {html:'Hoeveel procent van de leden komt <b>niet</b> met de auto? [[0]] %', mode:'numeric', check:exact(70), sol:'20 − 6 = 14 leden. 14 / 20 = 70 / 100 = <b>70 %</b>.'}
      ])) },
  { title:'Uitdaging: de ontbrekende week', lvl:3, instr:'De staaf van week 4 is weg. Je weet: in week 4 liep Jana dubbel zoveel als in week 1.',
    build:combo(chartBox('kolom', {title:'Gelopen afstand per week', labels:['week 1','week 2','week 3','week 4','week 5'], series:[{values:[18,24,15,NaN,21]}], yTitle:'Afstand (in km)', step:10, yMax:40, values:true}), list([
      {html:'In week 4 liep Jana [[0]] km.', mode:'numeric', check:exact(36), sol:'2 · 18 km = <b>36 km</b>.'},
      {html:'In de vijf weken samen liep ze [[0]] km.', mode:'numeric', check:exact(114), sol:'18 + 24 + 15 + 36 + 21 = <b>114 km</b>.'},
      {html:'Gemiddeld liep ze [[0]] km per week.', check:exact(22.8), sol:'114 : 5 = <b>22,8 km</b>.'}
    ], {letters:true})) },
  { title:'Uitdaging: overnachtingen in percent', lvl:3, instr:'Een kuststad telde in 2025 1 450 000 overnachtingen in het centrum en 550 000 buiten het centrum.',
    build:list([
      {html:'Percentage in het centrum: [[0]] % · buiten het centrum: [[1]] %', size:'sm', check:nums([72.5, 27.5]), sol:'Totaal 2 000 000. 1 450 000 / 2 000 000 = 0,725 = <b>72,5 %</b>. 100 % − 72,5 % = <b>27,5 %</b>.'},
      {html:'Hoeveel overnachtingen waren er gemiddeld per dag (2025 telt 365 dagen)? Rond af op een geheel getal: [[0]]', mode:'numeric', check:exact(5479), sol:'2 000 000 : 365 = 5479,45… ≈ <b>5479</b>.'},
      {html:'Hoe groot wordt de middelpuntshoek van het stuk "centrum" in een cirkeldiagram? [[0]]°', check:exact(261), sol:'72,5 % van 360° = 0,725 · 360° = <b>261°</b>.'}
    ], {letters:true}) }
);

/* --- misleidende grafieken --- */
WBsec('mislei').push(
  { title:'Zonnebloemen en potgrond', lvl:2, instr:'Een onderzoek naar de gemiddelde hoogte van zonnebloemen bij vier soorten potgrond.',
    build:combo(chartBox('kolom', {title:'Effect van potgrond', labels:['grond A','grond B','grond C','grond D'], series:[{values:[152,151,154,156]}], yTitle:'Hoogte (in cm)', yMin:150, yMax:157, step:1, values:true, brk:false}),
      list([
        {html:'Hoeveel keer zo hoog lijkt staaf D in de grafiek als staaf B? [[0]] keer', mode:'numeric', check:exact(6), sol:'Staaf D is 6 hokjes hoog (156 − 150), staaf B 1 hokje (151 − 150): <b>6 keer</b>.'},
        {html:'Hoeveel cm zijn de zonnebloemen bij D echt hoger dan bij B? [[0]] cm', mode:'numeric', check:exact(5), sol:'156 cm − 151 cm = <b>5 cm</b>. Dat is weinig op 151 cm.'}
      ], {letters:true}),
      choiceList([['Waarom is deze grafiek misleidend?', 'b', 'De verticale as begint bij 150 cm. Kleine verschillen lijken daardoor heel groot. Een eerlijk staafdiagram start bij 0.']], [['a','Er staan te weinig staven op.'],['b','De verticale as start niet bij 0.'],['c','De staven hebben geen kleur.']])) }
);

/* --- centrummaten interpreteren --- */
const WB_RIT = [12,15,8,20,15,25,10,15,30,12,18,15,22,8,10,15,35,12,20,13];
WBsec('interp').push(
  { title:'De weg naar school', lvl:2, instr:'20 leerlingen noteerden hoeveel minuten ze onderweg zijn naar school.',
    build:combo(html(`<div class="data-row">${WB_RIT.map(v=>`<span class="dv">${v}</span>`).join('')}</div>`), list([
      {html:'De modus is [[0]] min.', mode:'numeric', check:exact(15), sol:'15 komt 5 keer voor, meer dan elk ander gegeven.'},
      {html:'Het gemiddelde is [[0]] min.', check:exact(16.5), sol:'De som is 330. 330 : 20 = <b>16,5 min</b>.'},
      {html:'De mediaan is [[0]] min.', check:exact(15), sol:'Geordend: 8, 8, 10, 10, 12, 12, 12, 13, 15, <b>15</b>, <b>15</b>, 15, 15, 18, 20, 20, 22, 25, 30, 35. Het 10de en 11de gegeven zijn 15: Me = <b>15</b>.'},
      {html:'De variatiebreedte is [[0]] min.', mode:'numeric', check:exact(27), sol:'35 − 8 = <b>27 min</b>.'}
    ], {letters:true}),
    choiceList([['Wat betekent de mediaan 15 min?', 'b', 'De mediaan verdeelt de geordende gegevens in twee gelijke groepen.']], [['a','De meeste leerlingen zijn 15 minuten onderweg.'],['b','De helft van de leerlingen is 15 minuten of minder onderweg, de andere helft 15 minuten of meer.'],['c','Als iedereen even lang onderweg was, zou dat 15 minuten zijn.']])) },
  { title:'Uren sport per week', lvl:2, instr:'20 jongeren vertelden hoeveel uur ze per week sporten.',
    build:combo(chartBox('dot', {labels:['0','1','2','3','4','5','6','7','8'], series:[{values:[1,2,4,5,3,2,1,0,2]}], xTitle:'Aantal uren sport per week'}), list([
      {html:'De modus is [[0]] uur.', mode:'numeric', check:exact(3), sol:'Boven 3 staan de meeste bolletjes (5).'},
      {html:'Het gemiddelde is [[0]] uur.', check:exact(3.45), sol:'1·0 + 2·1 + 4·2 + 5·3 + 3·4 + 2·5 + 1·6 + 2·8 = 69. 69 : 20 = <b>3,45 uur</b>.'},
      {html:'De mediaan is [[0]] uur.', check:exact(3), sol:'Tel de bolletjes van links: het 10de en het 11de bolletje staan allebei bij 3. Me = <b>3</b>.'},
      {html:'De variatiebreedte is [[0]] uur.', mode:'numeric', check:exact(8), sol:'8 − 0 = <b>8 uur</b>.'}
    ], {letters:true})) }
);

/* --- verdieping bij het gemiddelde --- */
WBsec('gem').push(
  { title:'Uitdaging: één meting erbij', lvl:3, instr:'Wat verandert er als er één meting bijkomt?',
    build:list([
      {html:'Van 15 metingen is het gemiddelde 12. Er komt één meting bij en het gemiddelde wordt 12,5. De nieuwe meting is [[0]]', check:exact(20), sol:'Voor: 15 · 12 = 180. Na: 16 · 12,5 = 200. De nieuwe meting is 200 − 180 = <b>20</b>.'},
      {html:'Het gemiddelde van 6, 10, 9, 5, 7, 12 en x is 8. Dan is x = [[0]]', check:exact(7), sol:'7 · 8 = 56. 56 − (6 + 10 + 9 + 5 + 7 + 12) = 56 − 49 = <b>7</b>.'}
    ], {letters:true}) },
  { title:'Uitdaging: punten omrekenen', lvl:3, instr:'Zeven vrienden beantwoordden 9, 12, 14, 8, 11, 16 en 13 vragen juist. Per juist antwoord krijg je 4 punten.',
    build:list([
      {html:'De gemiddelde score is [[0]] punten (rond af op 0,01).', check:approx(47.43, 0.006), sol:'Gemiddeld aantal juiste antwoorden: 83 : 7 = 11,857… Maal 4: 332 : 7 = 47,428… ≈ <b>47,43</b>.'},
      {html:'De mediaan van de scores is [[0]] punten.', check:exact(48), sol:'Geordend: 8, 9, 11, <b>12</b>, 13, 14, 16. Me = 12 juiste antwoorden, dus 12 · 4 = <b>48 punten</b>.'}
    ], {letters:true}) }
);
/* ============================================================
   VROEGERE SIGNAALOEFENINGEN, nu gewone oefeningen in hun eigen hoofdstuk
   (afspraak: geen apart hoofdstuk signaaloefeningen, ook niet in latere modules)
   ============================================================ */
const SG_COORD = [
  {sec:'coördinaten', go:'coord', adv:'punten plaatsen in een assenstelsel', prompt:'Klik de punten aan.',
    build:(b,st,save,key)=>coordPlace(b,st,save,key, [[-3,4,'J'],[-1,2,'K'],[4,-3,'L'],[0,-5,'P'],[5,0,'Q']]), show:'J(−3, 4), K(−1, 2), L(4, −3), P(0, −5) en Q(5, 0).'},
  {sec:'kwadranten', go:'coord', adv:'de kwadranten', build:(b,st,save,key)=>qChoice(b,st,save,key, {html:'In welk kwadrant ligt R(5, −2)?', ans:'IV', opts:KW}), show:'kwadrant IV (x positief, y negatief).'},
  {sec:'coördinaten', go:'coord', adv:'de tekens van de coördinaatgetallen',
    build:list([{html:'Bij welke punten is het eerste coördinaatgetal strikt positief en het tweede negatief? A(2, −3), B(−2, −3), C(3, 0), D(4, −1). Typ de letters: [[0]]', size:'sm', check:WBletters('AD')}]), show:'A en D. C(3, 0) heeft y = 0, en 0 is niet negatief.'},
  {sec:'lijndiagram', go:'lijn', adv:'een punt in een lijndiagram lezen', prompt:'Het lijndiagram toont hoeveel ijsjes een kraam per week verkocht.',
    build:combo(chartBox('lijn', {labels:['1','2','3','4','5','6','7'], series:[{values:[40,80,80,60,100,70,50]}], xTitle:'Week', yTitle:'Aantal ijsjes', step:20, yMax:120, anim:false}),
      (b,st,save,key)=>qChoice(b,st,save,key, {html:'Wat betekent het punt (3, 80)?', ans:'a', opts:[['a','In week 3 werden 80 ijsjes verkocht.'],['b','In week 80 werden 3 ijsjes verkocht.'],['c','Er werden 3 keer 80 ijsjes verkocht.']]})),
    show:'In week 3 werden 80 ijsjes verkocht.'},
  {sec:'gemiddelde', go:'gem', adv:'het gemiddelde berekenen', prompt:'In week 8 verkocht de kraam 30 ijsjes.',
    build:list([{html:'Hoeveel ijsjes werden er gemiddeld per week verkocht in de 8 weken? [[0]]', check:exact(63.75)}]), show:'(40 + 80 + 80 + 60 + 100 + 70 + 50 + 30) : 8 = 510 : 8 = 63,75.'}
];
const SG_DATA = [
  {sec:'frequentietabel', go:'freq', adv:'totalen in een tabel', prompt:ftabHTML(['lievelingsfruit','meisjes','jongens'], [['appel','12','18'],['banaan','9','6'],['peer','4','11'],['kiwi','15','5']]),
    build:list([{html:'Hoeveel leerlingen deden mee? [[0]]', mode:'numeric', check:exact(80)}]), show:'30 + 15 + 15 + 20 = 80.'},
  {sec:'percentages', go:'freq', adv:'een percentage berekenen uit een tabel',
    build:list([{html:'Hoeveel procent van de leerlingen kiest kiwi? [[0]] %', mode:'numeric', check:exact(25)}]), show:'15 + 5 = 20 en 20 / 80 = 25 / 100 = 25 %.'},
  {sec:'diagram kiezen', go:'diagram', adv:'de juiste voorstelling kiezen',
    build:(b,st,save,key)=>qChoice(b,st,save,key, {html:'Je wil meisjes en jongens vergelijken. Welke voorstelling past het best?', ans:'s', opts:[['l','lijndiagram'],['s','staafdiagram met twee kleuren'],['c','één cirkeldiagram']]}), show:'een staafdiagram met twee kleuren: zo staan de staven van meisjes en jongens naast elkaar.'},
  {sec:'misleidend', go:'mislei', adv:'misleidende grafieken herkennen', prompt:'Het gemiddelde jaarloon in drie bedrijven.',
    build:combo(chartBox('kolom', {labels:['bedrijf A','bedrijf B','bedrijf C'], series:[{values:[41500,42500,41000]}], yTitle:'Jaarloon (in €)', yMin:40000, yMax:43000, step:500, values:true, brk:false, anim:false}),
      (b,st,save,key)=>qChoice(b,st,save,key, {html:'Waarom is deze grafiek misleidend?', ans:'b', opts:[['a','Er staan maar drie bedrijven op.'],['b','De verticale as start niet bij 0.'],['c','Er staan getallen boven de staven.']]})),
    show:'De as start bij 40 000 €: het verschil (hoogstens 1500 €) lijkt veel groter dan het is.'},
  {sec:'soorten data', go:'soort', adv:'numerieke en categorische data',
    build:(b,st,save,key)=>qChoice(b,st,save,key, {html:'Welke vraag levert <b>numerieke</b> data op?', ans:'b', opts:[['a','Wat is je lievelingskleur?'],['b','Hoeveel minuten sport je per dag?'],['c','In welke maand ben je jarig?']]}), show:'Hoeveel minuten sport je per dag? Met minuten kan je rekenen.'}
];
const SG_BAG = [16,15,18,18,21,17,19,18,22,20,19,18,23,16,17,20,18,19,21,25];
const SG_BAGHTML = `Van 20 reizigers werd de bagage gewogen (in kg):<div class="data-row">${SG_BAG.map(v=>`<span class="dv">${v}</span>`).join('')}</div>`;
const SG_MATEN = [
  {sec:'modus', go:'modus', adv:'de modus', prompt:SG_BAGHTML, build:list([{html:'De modus is [[0]] kg.', mode:'numeric', check:exact(18)}]), show:'18 kg (5 keer).'},
  {sec:'gemiddelde', go:'gem', adv:'het gemiddelde', build:list([{html:'Het gemiddelde is [[0]] kg.', check:exact(19)}]), show:'380 : 20 = 19 kg.'},
  {sec:'mediaan', go:'med', adv:'de mediaan bij een even aantal gegevens', build:list([{html:'De mediaan is [[0]] kg.', check:exact(18.5)}]), show:'Het 10de gegeven is 18 en het 11de is 19: (18 + 19) : 2 = 18,5 kg.'},
  {sec:'variatiebreedte', go:'modus', adv:'de variatiebreedte', build:list([{html:'De variatiebreedte is [[0]] kg.', mode:'numeric', check:exact(10)}]), show:'25 − 15 = 10 kg.'},
  {sec:'betekenis', go:'interp', adv:'de betekenis van een centrummaat',
    build:(b,st,save,key)=>qChoice(b,st,save,key, {html:'Wat betekent de variatiebreedte van 10 kg?', ans:'c', opts:[['a','De meeste reizigers hebben 10 kg bagage.'],['b','Gemiddeld heeft een reiziger 10 kg bagage.'],['c','De zwaarste bagage weegt 10 kg meer dan de lichtste.']]}), show:'De zwaarste bagage weegt 10 kg meer dan de lichtste.'}
];
const sgKaart = items => combo(...items.flatMap(q=>q.prompt ? [`<div class="q-text block">${q.prompt}</div>`, q.build] : [q.build]));
const SG_IJS = chartBox('lijn', {labels:['1','2','3','4','5','6','7'], series:[{values:[40,80,80,60,100,70,50]}], xTitle:'Week', yTitle:'Aantal ijsjes', step:20, yMax:120, anim:false});
(function(){
  const sec = id => SECTIONS.find(s=>s.id===id).cards;
  sec('coord').push({ title:'Punten, kwadranten en tekens', lvl:2, naast:false, instr:'Klik de punten aan en beantwoord de vragen.', build:sgKaart(SG_COORD.slice(0,3)) });
  sec('lijn').push({ title:'Een ijsjeskraam', lvl:2, instr:'Het lijndiagram toont hoeveel ijsjes een kraam per week verkocht.', build:SG_COORD[3].build });
  sec('gem').push({ title:'Gemiddelde uit een lijndiagram', lvl:2, instr:'Het lijndiagram toont hoeveel ijsjes een kraam per week verkocht. In week 8 verkocht de kraam 30 ijsjes.', build:combo(SG_IJS, SG_COORD[4].build) });
  sec('freq').push({ title:'Lievelingsfruit', lvl:2, instr:'Lees de tabel en beantwoord de vragen.', build:sgKaart(SG_DATA.slice(0,2)) });
  sec('diagram').push({ title:'Meisjes en jongens vergelijken', lvl:2, instr:'Kies de voorstelling die het best past.', build:SG_DATA[2].build });
  sec('mislei').push({ title:'Het jaarloon in drie bedrijven', lvl:2, instr:'Het gemiddelde jaarloon in drie bedrijven.', build:SG_DATA[3].build });
  sec('soort').push({ title:'Welke vraag geeft getallen?', lvl:1, instr:'Kies de juiste vraag.', build:SG_DATA[4].build });
  sec('interp').push({ title:'Bagage wegen', lvl:2, instr:'Bepaal alle maten en zeg wat ze betekenen.', build:sgKaart(SG_MATEN.map((q,i)=>i ? Object.assign({}, q, { prompt:null }) : q)) });
})();
/* ============================================================
   ZOEK DE FOUT
   ============================================================ */
SECTIONS.push({ id:'fout', ic:'fout', nav:'Zoek de fout', title:'Zoek de fout',
  tip:'In elke oplossing zit precies één fout. Klik op de eerste stap die fout is. Daarna verbeter je die stap.',
  cards:[
    { title:'Foute oplossingen', build:(b,st,save,key)=>{
        const E = [
          {task:'Bepaal de mediaan van 7, 3, 9, 4, 6.', lines:['Er zijn 5 gegevens.','Het middelste gegeven is het 3de.','Het 3de gegeven is 9, dus Me = 9.'], wrong:2,
            why:'Je moet de gegevens eerst ordenen: 3, 4, 6, 7, 9.', fix:'Me = [[0:xs]]', mode:'numeric', fixCheck:exact(6), fixSol:'Geordend: 3, 4, <b>6</b>, 7, 9. Me = 6.'},
          {task:'Bereken het gemiddelde van 4, 0, 6, 2.', lines:['4 + 0 + 6 + 2 = 12','Er zijn 3 gegevens, want 0 telt niet mee.','12 : 3 = 4'], wrong:1,
            why:'0 is ook een gegeven. Er zijn 4 gegevens.', fix:'12 : [[0:xs]] = [[1:xs]]', fixCheck:nums([4,3]), fixSol:'12 : 4 = <b>3</b>.'},
          {task:'Punt P ligt 3 eenheden links van de y-as en 2 eenheden boven de x-as. Noteer P.', lines:['3 naar links: de x-coördinaat is −3.','2 naar boven: de y-coördinaat is 2.','P(2, −3)'], wrong:2,
            why:'Eerst de x-coördinaat, dan de y-coördinaat.', fix:'P( [[0:xs]] , [[1:xs]] )', fixCheck:nums([-3,2]), fixSol:'P(−3, 2).'},
          {task:'6 van de 24 leerlingen kiezen tennis. Welk percentage is dat?', lines:['6 van de 24 leerlingen','6 : 24 = 0,25','0,25 = 2,5 %'], wrong:2,
            why:'0,25 = 25 honderdsten = 25 %.', fix:'0,25 = [[0:xs]] %', mode:'numeric', fixCheck:exact(25), fixSol:'0,25 · 100 = <b>25 %</b>.'},
          {task:'Bepaal de variatiebreedte van 8, 12, 5, 15, 9.', lines:['Het grootste gegeven is 15.','Het eerste gegeven is 8.','15 − 8 = 7'], wrong:1,
            why:'Je neemt het kleinste gegeven, niet het eerste.', fix:'Variatiebreedte = 15 − [[0:xs]] = [[1:xs]]', fixCheck:nums([5,10]), fixSol:'15 − 5 = <b>10</b>.'},
          {task:'Bereken het gemiddelde uit de tabel: 3 leerlingen hebben 1 huisdier, 2 leerlingen hebben 4 huisdieren.', lines:['Er zijn 3 + 2 = 5 leerlingen.','Samen hebben ze 1 + 4 = 5 huisdieren.','5 : 5 = 1 huisdier per leerling.'], wrong:1,
            why:'Je moet elke waarde vermenigvuldigen met haar frequentie.', fix:'3 · 1 + 2 · 4 = [[0:xs]], dus x̄ = [[1:xs]]', fixCheck:nums([11,2.2]), fixSol:'3 · 1 + 2 · 4 = 11 huisdieren. 11 : 5 = <b>2,2</b>.'}
        ];
        E.forEach((e,i)=>errBlock(b, st, save, 'e'+i, Object.assign({nr:LET[i]+'.'}, e)));
      }}
  ]});

/* ============================================================
   PROEFTOETSEN
   ============================================================ */
const PQ = {
  place: targets => ({sec:'Coördinaten', prompt:'Klik de punten aan in het assenstelsel.',
    build:(b,st,save,key)=>coordPlace(b,st,save,key,targets), show:targets.map(t=>`${t[2]}${coStr(t[0],t[1])}`).join(', ')}),
  kw: pts => ({sec:'Kwadranten', prompt:'Waar ligt het punt?',
    build:choiceList(pts.map(([n,x,y])=>[`${n}${coStr(x,y)}`, kwAns(x,y)]), KW), show:pts.map(([n,x,y])=>`${n}: ${kwadrant(x,y)}`).join(' · ')}),
  q: (sec, prompt, items, show, pre) => ({sec, prompt:(prompt||'')+(pre?pre:''), build:list(items, {letters:items.length>1}), show}),
  qc: (sec, prompt, chart, items, show) => ({sec, prompt, build:combo(chartBox(chart[0], Object.assign({anim:false}, chart[1]), 'mid'), list(items, {letters:items.length>1})), show}),
  ch: (sec, prompt, items, opts, show) => ({sec, prompt, build:choiceList(items, opts), show}),
  sort: (sec, prompt, items) => ({sec, prompt, build:(b,st,save,key)=>sortBins(b,st,save,key,{bins:[['c','Categorische data'],['n','Numerieke data']], items}), show:items.map(i=>`${i.t}: ${i.a==='c'?'categorisch':'numeriek'}`).join(' · ')}),
  bars: cfg => ({sec:'Diagram tekenen', prompt:`Sleep de staven tot de juiste hoogte. ${cfg.ask}`, build:(b,st,save,key)=>barBuilder(b,st,save,key,cfg), show:cfg.labels.map((l,i)=>`${l}: ${cfg.values[i]}`).join(', ')}),
  dot: cfg => ({sec:'Modus', prompt:'', build:(b,st,save,key)=>dotPick(b,st,save,key,cfg), show:`de modus is ${cfg.ans.join(' en ')}`}),
  oz: (items) => ({sec:'Onderzoeksvraag', prompt:'Wat is er mis met de vraag?', build:choiceList(items, VQ), show:items.map(([h,a])=>`${h}: ${VQ.find(o=>o[0]===a)[1]}`).join(' · ')}),
  krant: it => ({sec:'Kritisch lezen', prompt:'', build:krantEx([it]), show:KRIT.find(o=>o[0]===it.ans)[1]+'. '+it.why}),
  err: e => ({sec:'Zoek de fout', prompt:'Klik op de stap die fout is.', build:(b,st,save)=>errBlock(b,st,save,'e',Object.assign({nr:''},e)), show:`stap ${e.wrong+1}`})
};
const rawRow = vals => `<div class="data-row">${vals.map(v=>`<span class="dv">${fmt(v)}</span>`).join('')}</div>`;

/* --- vragenpool: per onderdeel vaste vragen en/of een generator met toevalsgetallen --- */
const PXshuf = (r, arr) => { const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const PXnames = 'ABCDEFGHKLMNPQRSTUVW';
/* een samenstelling van n in k delen, elk deel minstens lo */
function PXparts(r, n, k, lo=1){ const p = Array(k).fill(lo); for(let i=0;i<n-k*lo;i++) p[rInt(r,0,k-1)]++; return p; }
const PXsec = (sec, item) => Object.assign({}, item, {sec});
const PXlist = arr => arr.map(x=>fmt(String(x).replace('.',','))).join(', ');
const PXnum = x => nf(x, 2);

/* coördinaten: drie punten, één op een as, de andere in verschillende kwadranten */
function PXpts(r, n){
  const out = [], used = new Set(), quads = PXshuf(r, [[1,1],[-1,1],[-1,-1],[1,-1]]);
  for(let i=0;i<n-1;i++){ let x, y; do{ x = quads[i][0]*rInt(r,1,6); y = quads[i][1]*rInt(r,1,6); }while(used.has(x+','+y) || Math.abs(x)===Math.abs(y)); used.add(x+','+y); out.push([x,y]); }
  const v = rNZ(r,-6,6); out.push(r()<.5 ? [0,v] : [v,0]);
  const o = PXshuf(r, out); const st = rInt(r, 0, 10);
  return o.map((p,i)=>[p[0], p[1], PXnames[st+i]]);
}
const PXread = pts => ({sec:'Coördinaten', prompt:'Lees de coördinaat van elk punt af.',
  build:(b,st,save,key)=>coordRead(b,st,save,key,pts), show:pts.map(t=>`${t[2]}${coStr(t[0],t[1])}`).join(', ')});

const PX_SORT = [['haarkleur','c'],['postcode','c'],['favoriete vak','c'],['merk van je gsm','c'],['geboorteland','c'],['lievelingsdier','c'],['kleur van je fiets','c'],['muziekstijl','c'],['rugnummer van een voetballer','c'],['soort ontbijt','c'],['taal die je thuis spreekt','c'],['telefoonnummer','c'],
  ['aantal broers','n'],['lengte in cm','n'],['zakgeld per week','n'],['schoenmaat','n'],['temperatuur','n'],['aantal sms\'jes per dag','n'],['gewicht van je boekentas','n'],['aantal punten op een toets','n'],['tijd op de 100 m','n'],['aantal huisdieren','n'],['leeftijd in jaren','n'],['minuten fietsen naar school','n']];

const PX_FREQ = [
  {t:'Het aantal kinderen in het gezin van', lo:1, vals:5},
  {t:'Het aantal keer sporten per week van', lo:0, vals:5},
  {t:'Toetsresultaten op 10 van', lo:4, vals:5},
  {t:'Het aantal huisdieren van', lo:0, vals:4},
  {t:'Het aantal keer dat deze week te laat kwamen:', lo:0, vals:4, after:true}
];
const PX_BARS = [
  {title:'Lievelingskleur', labels:['rood','blauw','groen','geel']},
  {title:'Huisdieren in 1Z', labels:['hond','kat','vis','konijn']},
  {title:'Afwezigen per dag', labels:['ma','di','wo','do','vr']},
  {title:'Favoriete sport', labels:['voetbal','dans','tennis','zwemmen']},
  {title:'Vervoer naar school', labels:['fiets','te voet','bus','auto']},
  {title:'Lievelingsfruit', labels:['appel','banaan','peer','kiwi','druif']}
];
const PX_DOT = [
  {xTitle:'Aantal keer sporten per week', lo:0, hi:6},
  {xTitle:'Aantal huisdieren', lo:0, hi:5},
  {xTitle:'Punten op 10', lo:4, hi:10},
  {xTitle:'Aantal broers en zussen', lo:0, hi:5},
  {xTitle:'Aantal boeken gelezen deze maand', lo:0, hi:6}
];
const PX_TOESTEL = [['aantal boeken','aantal leerlingen'],['aantal fouten','aantal leerlingen'],['leeftijd','aantal deelnemers'],['aantal broers en zussen','aantal leerlingen'],['doelpunten per match','aantal matchen'],['aantal keer sporten','aantal leerlingen']];
const PX_OZ = [['Vind jij ook dat de les te lang duurt?','s'],['Hoeveel minuten fiets je naar school?','g'],['Hoe oud ben je? 11-12 · 12-13 · 13-14','o'],['Eet je veel snoep?','v'],
  ['Je speelt toch ook graag buiten?','s'],['Hoeveel uur slaap je per nacht? minder dan 7 · 7 tot minder dan 9 · 9 of meer','g'],['Wat vind je van school?','v'],['Hoeveel uur per week speel je videogames?','g'],
  ['Iedereen weet dat sporten gezond is. Hoe vaak sport jij?','s'],['Hoeveel broers en zussen heb je? 0-1 · 1-2 · 3 of meer','o'],['Hoe kom je meestal naar school? te voet · fiets · bus · auto · anders','g'],['Ben je vaak moe?','v'],
  ['Vind je ook niet dat de refter te duur is?','s'],['Hoeveel zakgeld krijg je per week? 0-5 euro · 5-10 euro · 10-15 euro','o'],['Hoeveel minuten lees je per dag in een boek?','g'],['Sport je veel?','v']];

const POOL = [
  /* 1 coördinaten */
  { fixed:[PQ.place([[3,-2,'A'],[-4,5,'B'],[0,-3,'C']]), PQ.place([[-2,-4,'A'],[5,1,'B'],[-3,0,'C']]), PQ.place([[1,-5,'A'],[-6,3,'B'],[0,4,'C']])],
    gen:r => r()<.5 ? PQ.place(PXpts(r,3)) : PXread(PXpts(r,3)) },
  /* 2 kwadranten */
  { fixed:[PQ.kw([['P',-3,-5],['Q',4,0]]), PQ.kw([['R',2,-6],['S',0,3]]), PQ.kw([['T',-1,7],['U',-5,0]])],
    gen:r => { const p = PXpts(r,3); const a = p.find(q=>q[0]!==0 && q[1]!==0), b = r()<.5 ? p.find(q=>q[0]===0 || q[1]===0) : p.filter(q=>q[0]!==0 && q[1]!==0)[1]; return PQ.kw([[a[2],a[0],a[1]],[b[2],b[0],b[1]]]); } },
  /* 3 lijndiagram */
  { fixed:[
    PQ.qc('Lijndiagram', 'Een bergwandeling: de hoogte op elk uur.', ['lijn', HOOGTE], [
      {html:'Na 2 uur is de wandelaar op [[0]] m hoogte.', mode:'numeric', check:exact(1100)},
      {html:'Tussen uur 4 en uur 7 daalt hij [[0]] m.', mode:'numeric', check:exact(600)}], 'a. 1100 m · b. 1300 − 700 = 600 m'),
    PQ.qc('Lijndiagram', 'Een fietstocht: de afgelegde afstand op elk uur.', ['lijn', FIETS], [
      {html:'Na 3 uur heeft hij [[0]] km gefietst.', mode:'numeric', check:exact(30)},
      {html:'Hij pauzeert tussen uur [[0]] en uur [[1]].', size:'xs', check:nums([2,3])}], 'a. 30 km · b. tussen uur 2 en 3 (de lijn is vlak)'),
    PQ.qc('Lijndiagram', 'De temperatuur op een lentedag.', ['lijn', {labels:['8 u','10 u','12 u','14 u','16 u','18 u'], series:[{values:[6,9,13,15,12,8]}], xTitle:'Tijdstip', yTitle:'Temperatuur (°C)', yMin:0, yMax:16, step:2}], [
      {html:'Om [[0]] u is het het warmst.', mode:'numeric', check:exact(14)},
      {html:'Tussen 8 u en 14 u stijgt de temperatuur [[0]] °C.', mode:'numeric', check:exact(9)}], 'a. 14 u · b. 15 − 6 = 9 °C'),
    PQ.qc('Lijndiagram', 'De hoogte van een plant, elke week gemeten.', ['lijn', {labels:['0','1','2','3','4','5','6'], series:[{values:[2,5,9,12,14,15,15]}], xTitle:'Tijd (in weken)', yTitle:'Hoogte (in cm)', yMin:0, yMax:16, step:1}], [
      {html:'Na 3 weken is de plant [[0]] cm hoog.', mode:'numeric', check:exact(12)},
      {html:'Tussen week 1 en week 4 groeit de plant [[0]] cm.', mode:'numeric', check:exact(9)}], 'a. 12 cm · b. 14 − 5 = 9 cm'),
    PQ.qc('Lijndiagram', 'Een tas thee koelt af.', ['lijn', {labels:['0','5','10','15','20','25'], series:[{values:[80,64,52,44,38,34]}], xTitle:'Tijd (in minuten)', yTitle:'Temperatuur (°C)', yMin:0, yMax:90, step:10}], [
      {html:'Na 10 minuten is de thee [[0]] °C.', mode:'numeric', check:exact(52)},
      {html:'In de eerste 5 minuten daalt de temperatuur [[0]] °C.', mode:'numeric', check:exact(16)}], 'a. 52 °C · b. 80 − 64 = 16 °C'),
    PQ.qc('Lijndiagram', 'Het geld in de spaarpot van Noor, telkens op de eerste dag van de maand.', ['lijn', {labels:['jan','feb','mrt','apr','mei','jun'], series:[{values:[10,25,25,40,30,50]}], xTitle:'Maand', yTitle:'Bedrag (in euro)', yMin:0, yMax:60, step:5}], [
      {html:'Tussen april en mei haalde Noor [[0]] euro uit de spaarpot.', mode:'numeric', check:exact(10)},
      {html:'Van januari tot juni kwam er in totaal [[0]] euro bij.', mode:'numeric', check:exact(40)}], 'a. 40 − 30 = 10 euro · b. 50 − 10 = 40 euro')
  ]},
  /* 4 soorten data */
  { fixed:[
    PQ.sort('Soorten data', 'Sleep elk gegeven naar de juiste bak.', [{t:'haarkleur', a:'c'}, {t:'aantal broers', a:'n'}, {t:'postcode', a:'c'}, {t:'lengte in cm', a:'n'}, {t:'favoriete vak', a:'c'}, {t:'zakgeld per week', a:'n'}]),
    PQ.sort('Soorten data', 'Sleep elk gegeven naar de juiste bak.', [{t:'schoenmaat', a:'n'}, {t:'merk van je gsm', a:'c'}, {t:'temperatuur', a:'n'}, {t:'geboorteland', a:'c'}, {t:'aantal sms\'jes per dag', a:'n'}, {t:'lievelingsdier', a:'c'}]),
    PQ.sort('Soorten data', 'Sleep elk gegeven naar de juiste bak.', [{t:'gewicht van je boekentas', a:'n'}, {t:'kleur van je fiets', a:'c'}, {t:'aantal punten op een toets', a:'n'}, {t:'muziekstijl', a:'c'}, {t:'tijd op de 100 m', a:'n'}, {t:'rugnummer van een voetballer', a:'c'}])],
    gen:r => { const c = PXshuf(r, PX_SORT.filter(x=>x[1]==='c')).slice(0,3), n = PXshuf(r, PX_SORT.filter(x=>x[1]==='n')).slice(0,3);
      return PQ.sort('Soorten data', 'Sleep elk gegeven naar de juiste bak.', PXshuf(r, c.concat(n)).map(([t,a])=>({t, a}))); } },
  /* 5 frequentietabel */
  { fixed:[
    PQ.q('Frequentietabel', 'Het aantal kinderen in het gezin van 10 leerlingen:', [
      {html:'Absolute frequentie van 3 kinderen: [[0]]', mode:'numeric', check:exact(4)},
      {html:'Relatieve frequentie van 2 kinderen: [[0]] %', mode:'numeric', check:exact(30)}], 'a. 4 · b. 3 van de 10 = 30 %', rawRow([3,2,4,3,3,1,2,3,4,2])),
    PQ.q('Frequentietabel', 'Toetsresultaten op 10 van 10 leerlingen:', [
      {html:'Absolute frequentie van 5: [[0]]', mode:'numeric', check:exact(4)},
      {html:'Relatieve frequentie van 7: [[0]] %', mode:'numeric', check:exact(30)}], 'a. 4 · b. 3 van de 10 = 30 %', rawRow([5,7,6,5,8,7,5,6,5,7])),
    PQ.q('Frequentietabel', 'Het aantal keer dat 12 leerlingen deze week te laat kwamen:', [
      {html:'Absolute frequentie van 1: [[0]]', mode:'numeric', check:exact(5)},
      {html:'Relatieve frequentie van 2: [[0]] %', mode:'numeric', check:exact(25)}], 'a. 5 · b. 3 van de 12 = 25 %', rawRow([2,0,1,3,1,0,2,1,1,4,1,2]))],
    gen:r => { const c = rPick(r, PX_FREQ), n = rPick(r, [10, 20]); const fr = PXparts(r, n, c.vals, 1); const vals = fr.map((_,i)=>c.lo+i);
      const raw = PXshuf(r, expand(vals, fr)); const [i, j] = PXshuf(r, vals.map((_,k)=>k)).slice(0,2);
      const pr = c.after ? `Het aantal keer dat ${n} leerlingen deze week te laat kwamen:` : `${c.t} ${n} leerlingen:`;
      return PQ.q('Frequentietabel', pr, [
        {html:`Absolute frequentie van ${vals[i]}: [[0]]`, mode:'numeric', check:exact(fr[i])},
        {html:`Relatieve frequentie van ${vals[j]}: [[0]] %`, mode:'numeric', check:exact(fr[j]/n*100)}],
        `a. ${fr[i]} · b. ${fr[j]} van de ${n} = ${nf(fr[j]/n*100)} %`, rawRow(raw)); } },
  /* 6 diagram tekenen of kiezen */
  { fixed:[
    PQ.bars({labels:['rood','blauw','groen','geel'], values:[6,8,3,5], yMax:10, step:1, title:'Lievelingskleur', ask:'Rood 6, blauw 8, groen 3, geel 5.'}),
    PQ.bars({labels:['hond','kat','vis','konijn'], values:[9,7,2,4], yMax:10, step:1, title:'Huisdieren in 1Z', ask:'Hond 9, kat 7, vis 2, konijn 4.'}),
    PQ.bars({labels:['ma','di','wo','do','vr'], values:[5,8,2,7,4], yMax:10, step:1, title:'Afwezigen per dag', ask:'Maandag 5, dinsdag 8, woensdag 2, donderdag 7, vrijdag 4.'}),
    PQ.ch('Diagram kiezen', 'Welk diagram past het best?', [['De temperatuur elk uur van een dag.','l'],['Welk deel van de klas met de fiets, te voet of met de bus komt.','c'],['Het aantal leerlingen per lievelingssport vergelijken.','k']], [['k','staafdiagram'],['c','cirkeldiagram'],['l','lijndiagram']], '1. lijndiagram (verloop in de tijd) · 2. cirkeldiagram (delen van een geheel) · 3. staafdiagram (aantallen vergelijken)'),
    PQ.ch('Diagram kiezen', 'Welk diagram past het best?', [['Hoe je zakgeld besteed wordt: welk deel aan snoep, kleren en sparen.','c'],['Het aantal bezoekers van het zwembad elke maand van het jaar, om de evolutie te zien.','l'],['Het aantal punten van vijf leerlingen op een toets vergelijken.','k']], [['k','staafdiagram'],['c','cirkeldiagram'],['l','lijndiagram']], '1. cirkeldiagram · 2. lijndiagram · 3. staafdiagram')],
    gen:r => { const c = rPick(r, PX_BARS); const v = c.labels.map(()=>rInt(r,1,9));
      return PQ.bars({labels:c.labels, values:v, yMax:10, step:1, title:c.title, ask:c.labels.map((l,i)=>`${l} ${v[i]}`).join(', ')+'.'}); } },
  /* 7 misleidende grafiek */
  { fixed:[
    PQ.qc('Misleidende grafiek', 'De verkoop van twee winkels.', ['kolom', {labels:['winkel A','winkel B'], series:[{values:[52,56]}], yMin:50, title:'Verkochte fietsen', brk:false}], [
      {html:'Op de grafiek lijkt de staaf van B [[0]] keer zo hoog als die van A.', mode:'numeric', check:exact(3)},
      {html:'B verkocht 4 fietsen meer dan A. Dat is ongeveer [[0]] % meer (rond af op een geheel getal).', mode:'numeric', check:approx(8,0.5)}], 'a. 6 tegenover 2 hokjes: 3 keer · b. 4 : 52 · 100 ≈ 8 %'),
    PQ.qc('Misleidende grafiek', 'Bezoekers van twee musea op één dag.', ['kolom', {labels:['museum A','museum B'], series:[{values:[102,108]}], yMin:100, title:'Aantal bezoekers', brk:false}], [
      {html:'Op de grafiek lijkt de staaf van B [[0]] keer zo hoog als die van A.', mode:'numeric', check:exact(4)},
      {html:'In werkelijkheid had B [[0]] bezoekers meer.', mode:'numeric', check:exact(6)}], 'a. 8 tegenover 2 hokjes: 4 keer · b. 108 − 102 = 6'),
    PQ.qc('Misleidende grafiek', 'De prijs van een bioscoopticket.', ['kolom', {labels:['2020','2025'], series:[{values:[31,35]}], yMin:30, title:'Prijs van een gezinsticket (euro)', brk:false}], [
      {html:'Op de grafiek lijkt de staaf van 2025 [[0]] keer zo hoog als die van 2020.', mode:'numeric', check:exact(5)},
      {html:'In werkelijkheid steeg de prijs met [[0]] euro.', mode:'numeric', check:exact(4)}], 'a. 5 tegenover 1 hokje: 5 keer · b. 35 − 31 = 4 euro'),
    PQ.qc('Misleidende grafiek', 'Leden van twee sportclubs.', ['kolom', {labels:['club A','club B'], series:[{values:[41,45]}], yMin:40, step:1, title:'Aantal leden', brk:false}], [
      {html:'Op de grafiek lijkt de staaf van B [[0]] keer zo hoog als die van A.', mode:'numeric', check:exact(5)},
      {html:'In werkelijkheid heeft B [[0]] leden meer.', mode:'numeric', check:exact(4)}], 'a. 5 tegenover 1 hokje: 5 keer · b. 45 − 41 = 4'),
    PQ.qc('Misleidende grafiek', 'Verkochte ijsjes op twee dagen.', ['kolom', {labels:['zaterdag','zondag'], series:[{values:[203,206]}], yMin:200, step:1, title:'Aantal ijsjes', brk:false}], [
      {html:'Op de grafiek lijkt de staaf van zondag [[0]] keer zo hoog als die van zaterdag.', mode:'numeric', check:exact(2)},
      {html:'In werkelijkheid werden er op zondag [[0]] ijsjes meer verkocht.', mode:'numeric', check:exact(3)}], 'a. 6 tegenover 3 hokjes: 2 keer · b. 206 − 203 = 3'),
    PQ.qc('Misleidende grafiek', 'Het aantal leerlingen op twee scholen.', ['kolom', {labels:['school A','school B'], series:[{values:[74,80]}], yMin:72, step:1, title:'Aantal leerlingen in het 1ste jaar', brk:false}], [
      {html:'Op de grafiek lijkt de staaf van B [[0]] keer zo hoog als die van A.', mode:'numeric', check:exact(4)},
      {html:'In werkelijkheid heeft school B [[0]] leerlingen meer.', mode:'numeric', check:exact(6)}], 'a. 8 tegenover 2 hokjes: 4 keer · b. 80 − 74 = 6')
  ]},
  /* 8 modus in een dotplot */
  { fixed:[
    PQ.dot({vals:[2,3,3,1,4,3,2,5,3,2,1,3], lo:0, hi:6, xTitle:'Aantal keer sporten per week', ask:'Klik op de kolom van de <b>modus</b>.', ans:[3], why:'', hint:''}),
    PQ.dot({vals:[1,2,2,0,3,2,4,1,2,3,1,2,5], lo:0, hi:6, xTitle:'Aantal huisdieren', ask:'Klik op de kolom van de <b>modus</b>.', ans:[2], why:'', hint:''}),
    PQ.dot({vals:[5,6,6,7,8,6,7,5,6,9,7,6], lo:4, hi:10, xTitle:'Punten op 10', ask:'Klik op de kolom van de <b>modus</b>.', ans:[6], why:'', hint:''})],
    gen:r => { const c = rPick(r, PX_DOT); const k = c.hi-c.lo+1; const m = rInt(r, c.lo+1, c.hi-1); const top = rInt(r,4,5);
      const fr = Array.from({length:k}, (_,i)=> c.lo+i===m ? top : rInt(r,0,top-1));
      const vals = PXshuf(r, expand(fr.map((_,i)=>c.lo+i), fr));
      return PQ.dot({vals, lo:c.lo, hi:c.hi, xTitle:c.xTitle, ask:'Klik op de kolom van de <b>modus</b>.', ans:[m], why:'', hint:''}); } },
  /* 9 gemiddelde */
  { fixed:[
    PQ.q('Gemiddelde', '', [{html:'Bereken het gemiddelde van 4, 7, 7, 9, 13. &nbsp;x̄ = [[0]]', check:exact(8)}], '40 : 5 = 8'),
    PQ.q('Gemiddelde', '', [{html:'Bereken het gemiddelde van 15, 11, 18, 12, 14, 8. &nbsp;x̄ = [[0]]', check:exact(13)}], '78 : 6 = 13'),
    PQ.q('Gemiddelde', '', [{html:'Bereken het gemiddelde van 2,5 · 3 · 4,5 · 6. &nbsp;x̄ = [[0]]', check:exact(4)}], '16 : 4 = 4'),
    PQ.q('Gemiddelde', 'Het aantal huisdieren van 20 leerlingen.', [{html:'Bereken het gemiddeld aantal huisdieren per leerling. &nbsp;x̄ = [[0]]', check:exact(1.75)}], '(0 · 3 + 1 · 5 + 2 · 7 + 3 · 4 + 4 · 1) : 20 = 35 : 20 = 1,75', ftabHTML(['aantal huisdieren','0','1','2','3','4'], [['aantal leerlingen','3','5','7','4','1']])),
    PQ.q('Gemiddelde', '', [{html:'Het gemiddelde van 5 getallen is 6. Hun som is [[0]].', mode:'numeric', check:exact(30)}], '5 · 6 = 30')],
    gen:r => { const n = rPick(r,[4,5,5,6]); let vals;
      do{ const m = rInt(r,5,14) + (n%2===0 && r()<.4 ? .5 : 0); vals = Array.from({length:n-1}, ()=>rInt(r,1,20)); const last = n*m - sum(vals); vals.push(last); }while(vals[n-1]<1 || vals[n-1]>25 || vals[n-1]!==Math.round(vals[n-1]));
      vals = PXshuf(r, vals); const m = sum(vals)/n;
      return PQ.q('Gemiddelde', '', [{html:`Bereken het gemiddelde van ${PXlist(vals)}. &nbsp;x̄ = [[0]]`, check:exact(m)}], `${sum(vals)} : ${n} = ${PXnum(m)}`); } },
  /* 10 mediaan */
  { fixed:[
    PQ.q('Mediaan', '', [{html:'Bepaal de mediaan van 12, 5, 9, 15, 7, 10. &nbsp;Me = [[0]]', check:exact(9.5)}], 'geordend 5, 7, 9, 10, 12, 15: (9 + 10) : 2 = 9,5'),
    PQ.q('Mediaan', '', [{html:'Bepaal de mediaan van 21, 17, 25, 19, 30. &nbsp;Me = [[0]]', check:exact(21)}], 'geordend 17, 19, 21, 25, 30: Me = 21'),
    PQ.q('Mediaan', '', [{html:'Bepaal de mediaan van 8, 3, 11, 6, 9, 14, 2, 10. &nbsp;Me = [[0]]', check:exact(8.5)}], 'geordend 2, 3, 6, 8, 9, 10, 11, 14: (8 + 9) : 2 = 8,5')],
    gen:r => { const n = rPick(r,[5,6,7,8]); const vals = Array.from({length:n}, ()=>rInt(r,1,30)); const s = sorted(vals), me = median(vals);
      const how = n%2 ? `Me = ${fmt(me)}` : `(${s[n/2-1]} + ${s[n/2]}) : 2 = ${PXnum(me)}`;
      return PQ.q('Mediaan', '', [{html:`Bepaal de mediaan van ${PXlist(vals)}. &nbsp;Me = [[0]]`, check:exact(me)}], `geordend ${PXlist(s)}: ${how}`); } },
  /* 11 interpreteren */
  { fixed:[
    PQ.ch('Interpreteren', 'Kies de beste maat.', [['De lonen in een klein bedrijf: 9 werknemers verdienen ongeveer 2500 euro, de baas verdient 15 000 euro. Welke maat geeft het beste beeld van een gewoon loon?','m']], [['g','gemiddelde'],['m','mediaan'],['v','variatiebreedte']], 'de mediaan, want de baas is een uitschieter'),
    PQ.ch('Interpreteren', 'Kies de juiste maat.', [['"De meeste leerlingen van 1Z hebben schoenmaat 38." Welke maat wordt hier gebruikt?','mo']], [['mo','modus'],['g','gemiddelde'],['m','mediaan']], 'de modus: het gegeven dat het vaakst voorkomt'),
    PQ.ch('Interpreteren', 'Waar of niet waar?', [['Als je één gegeven heel groot maakt, verandert de mediaan veel.','n'],['Het gemiddelde hoeft geen gegeven uit de reeks te zijn.','w']], WN, '1. niet waar · 2. waar'),
    PQ.ch('Interpreteren', 'Kies de juiste maat.', [['In een klas haalt iedereen 7 op 10, behalve één leerling die 1 op 10 haalt. Welke maat verandert door die ene leerling?','g']], [['g','gemiddelde'],['m','mediaan'],['mo','modus']], 'het gemiddelde: de mediaan en de modus blijven 7'),
    PQ.ch('Interpreteren', 'Kies de juiste maat.', [['Je wil weten welke frisdrank het populairst is in de klas. Welke maat kan je gebruiken?','mo']], [['mo','modus'],['g','gemiddelde'],['m','mediaan']], 'de modus: bij categorische data kan je geen gemiddelde of mediaan berekenen'),
    PQ.ch('Interpreteren', 'Waar of niet waar?', [['De modus is altijd het grootste gegeven.','n'],['Bij een even aantal gegevens kan de mediaan een getal zijn dat niet in de reeks staat.','w']], WN, '1. niet waar · 2. waar'),
    PQ.ch('Interpreteren', 'Waar of niet waar?', [['De variatiebreedte zegt hoe ver de gegevens uit elkaar liggen.','w'],['Als iedereen 2 punten bijkrijgt, stijgt het gemiddelde met 2.','w']], WN, '1. waar · 2. waar')
  ]},
  /* 12 rekentoestel */
  { fixed:[
    PQ.q('Rekentoestel', 'Gebruik je rekentoestel met lijsten.', [{html:'x̄ = [[0]] &nbsp; Med = [[1]]', size:'sm', check:nums([2.6,3])}], 'x̄ = 52 : 20 = 2,6 · Med = 3', ftabHTML(['aantal boeken','1','2','3','4','5'], [['aantal leerlingen','3','6','8','2','1']])),
    PQ.q('Rekentoestel', 'Gebruik je rekentoestel met lijsten.', [{html:'x̄ = [[0]] &nbsp; Med = [[1]]', size:'sm', check:nums([1.95,2])}], 'x̄ = 39 : 20 = 1,95 · Med = 2', ftabHTML(['aantal fouten','0','1','2','3','4'], [['aantal leerlingen','2','5','7','4','2']])),
    PQ.q('Rekentoestel', 'Gebruik je rekentoestel met lijsten.', [{html:'x̄ = [[0]] &nbsp; Med = [[1]]', size:'sm', check:nums([12.3,12])}], 'x̄ = 246 : 20 = 12,3 · Med = 12', ftabHTML(['leeftijd','10','11','12','13','14'], [['aantal deelnemers','1','4','6','6','3']]))],
    gen:r => { const [h1, h2] = rPick(r, PX_TOESTEL); const lo = h1==='leeftijd' ? rInt(r,10,12) : rInt(r,0,1); const vals = [0,1,2,3,4].map(i=>lo+i);
      const fr = PXparts(r, 20, 5, 1); const all = expand(vals, fr); const m = mean(all), me = median(all);
      return PQ.q('Rekentoestel', 'Gebruik je rekentoestel met lijsten.', [{html:'x̄ = [[0]] &nbsp; Med = [[1]]', size:'sm', check:nums([m, me])}],
        `x̄ = ${sum(all)} : 20 = ${PXnum(m)} · Med = ${PXnum(me)}`, ftabHTML([h1, ...vals.map(String)], [[h2, ...fr.map(String)]])); } },
  /* 13 onderzoeksvraag */
  { fixed:[PQ.oz([PX_OZ[0], PX_OZ[1]]), PQ.oz([PX_OZ[2], PX_OZ[3]]), PQ.oz([PX_OZ[4], PX_OZ[5]])],
    gen:r => { const a = rPick(r, PX_OZ); const b = rPick(r, PX_OZ.filter(x=>x[1]!==a[1])); return PQ.oz([a, b]); } },
  /* 14 kritisch lezen */
  { fixed:[
    PQ.krant({kop:'80 % van de leerlingen wil meer frietjes in de refter', info:'Gevraagd aan 5 leerlingen in de rij aan het frietkraam.', ans:'groep', why:'Wie aan het frietkraam staat, eet graag frietjes (en 5 leerlingen is ook erg weinig).'}),
    PQ.krant({kop:'Onze school scoort steeds beter op de fietstest!', chart:['kolom',{labels:['2022','2023','2024'], series:[{values:[71,72,74]}], yMin:70, title:'Gemiddelde score fietstest (op 100)', brk:false}], ans:'as', why:'De as begint bij 70: een stijging van 3 punten op 100 lijkt enorm.'}),
    PQ.krant({kop:'Gemiddelde klas leest 15 boeken per jaar', info:'In een klas van 20 lezen 19 leerlingen 0 tot 5 boeken. Eén leerling las 250 boeken.', ans:'uit', why:'Eén uitschieter trekt het gemiddelde omhoog. De mediaan geeft een eerlijker beeld.'}),
    PQ.krant({kop:'Alle leerlingen haten wiskunde', info:'Twee leerlingen in de gang zeiden dat ze wiskunde niet leuk vinden.', ans:'weinig', why:'Met twee leerlingen kan je niets besluiten over alle leerlingen.'}),
    PQ.krant({kop:'Leerlingen willen een langere middagpauze', info:'Gevraagd aan de 30 leerlingen van de voetbalclub die over de middag op het plein speelt.', ans:'groep', why:'Wie over de middag voetbalt, wil natuurlijk meer tijd. Ze zijn geen goede steekproef van alle leerlingen.'}),
    PQ.krant({kop:'Een gemiddeld huis in onze straat kost bijna 1 miljoen euro', info:'In de straat staan 9 gewone huizen van ongeveer 300 000 euro en één kasteel van 7 miljoen euro.', ans:'uit', why:'Het kasteel is een uitschieter: (9 · 300 000 + 7 000 000) : 10 = 970 000 euro, terwijl bijna alle huizen 300 000 euro kosten.'}),
    PQ.krant({kop:'Prijs van een schoolmaaltijd explodeert!', chart:['kolom',{labels:['2023','2024','2025'], series:[{values:[4.5,4.6,4.8]}], yMin:4.4, yMax:4.9, step:0.1, title:'Prijs van een schoolmaaltijd (euro)', brk:false}], ans:'as', why:'De as begint bij 4,40 euro: een stijging van 30 cent lijkt een explosie.'}),
    PQ.krant({kop:'Meer dan de helft van de leerlingen komt met de fiets', info:'Alle 480 leerlingen van de school werden bevraagd: 260 komen met de fiets.', ans:'ok', why:'Iedereen werd bevraagd, en 260 is meer dan de helft van 480 (240).'})
  ]},
  /* 15 zoek de fout */
  { fixed:[
    PQ.err({task:'Bepaal de mediaan van 7, 3, 9, 4, 6.', lines:['Er zijn 5 gegevens.','Het middelste gegeven is het 3de.','Het 3de gegeven is 9, dus Me = 9.'], wrong:2}),
    PQ.err({task:'Bereken het gemiddelde van 4, 0, 6, 2.', lines:['4 + 0 + 6 + 2 = 12','Er zijn 3 gegevens, want 0 telt niet mee.','12 : 3 = 4'], wrong:1}),
    PQ.err({task:'Bepaal de variatiebreedte van 8, 12, 5, 15, 9.', lines:['Het grootste gegeven is 15.','Het eerste gegeven is 8.','15 − 8 = 7'], wrong:1}),
    PQ.err({task:'6 van de 24 leerlingen kiezen tennis. Welk percentage is dat?', lines:['6 van de 24 leerlingen','6 : 24 = 0,25','0,25 = 2,5 %'], wrong:2}),
    PQ.err({task:'Bepaal de mediaan van 4, 9, 2, 7, 5, 8.', lines:['Geordend: 2, 4, 5, 7, 8, 9.','Er zijn 6 gegevens, dus er zijn twee middelste: 5 en 7.','Me = 5 + 7 = 12'], wrong:2}),
    PQ.err({task:'Q ligt op de x-as, 4 eenheden links van de oorsprong. Noteer Q.', lines:['Op de x-as is de y-coördinaat 0.','4 naar links: de x-coördinaat is −4.','Q(0, −4)'], wrong:2}),
    PQ.err({task:'Bereken het gemiddelde uit de tabel: 3 leerlingen hebben 1 huisdier, 2 leerlingen hebben 4 huisdieren.', lines:['Er zijn 3 + 2 = 5 leerlingen.','Samen hebben ze 1 + 4 = 5 huisdieren.','5 : 5 = 1 huisdier per leerling.'], wrong:1})
  ]}
];

/* een toets trekken: per onderdeel een vaste vraag of een nieuwe met toevalsgetallen */
function PXdraw(prev){
  return POOL.map((slot,i)=>{
    const p = prev && prev[i]; const seed = Math.floor(Math.random()*1e9);
    if(slot.gen && (!slot.fixed.length || Math.random()<.7)) return {g:seed};
    let f; do{ f = Math.floor(Math.random()*slot.fixed.length); }while(slot.fixed.length>1 && p && p.f===f);
    return {f};
  });
}
const PXitems = pick => POOL.map((slot,i)=>{ const p = pick[i] || {f:0};
  if(p.g!=null && slot.gen){ try{ return slot.gen(rng(p.g)); }catch(e){ console.error(e); } }
  return slot.fixed[Math.min(p.f||0, slot.fixed.length-1)]; });
function PXtoets(b, st, save, key){
  let pk = load(key+'_pick'); if(!Array.isArray(pk.s) || pk.s.length!==POOL.length){ pk = {s:PXdraw()}; store(key+'_pick', pk); }
  const bar = el('div','gen-bar'); const nb = el('button','btn ghost','🎲 Nieuwe toets met andere vragen'); nb.type='button'; bar.append(nb); b.append(bar);
  nb.addEventListener('click', ()=>{ store(key+'_pick', {s:PXdraw(pk.s)}); wipe(key); renderers[key](); b.scrollIntoView({block:'start', behavior:'smooth'}); });
  proeftoets(b, st, save, key, PXitems(pk.s));
}

/* --- proeftoets rekenblad (zoals de KT, in Google Spreadsheets) --- */
const DIEREN20 = ['hond','kat','hond','vis','konijn','hond','kat','kat','hond','konijn','vis','hond','kat','konijn','hond','kat','vis','hond','konijn','kat'];
const TOETS_RB = [
  {sec:'Frequentietabel', prompt:'20 leerlingen gaven hun lievelingsdier (A2:A21). Vul D2:D5 met AANTAL.ALS en D6 met SOM.',
    build:(b,st,save,key)=>sheetTask(b,st,save,key,{cols:5, rows:21, init:Object.assign({A1:'dier', C1:'dier', D1:'aantal', C2:'hond', C3:'kat', C4:'vis', C5:'konijn', C6:'totaal'}, ...DIEREN20.map((d,i)=>({['A'+(i+2)]:d}))),
      checks:[ {say:'D2 tot D5 met AANTAL.ALS', test:allOf(...['D2','D3','D4','D5'].map(r=>fIs(r,'AANTAL.ALS')), vIs('D2',7), vIs('D3',6), vIs('D4',3), vIs('D5',4))},
               {say:'D6: het totaal met SOM', test:allOf(fIs('D6','SOM'), vIs('D6',20))} ]}),
    show:'hond 7, kat 6, vis 3, konijn 4, totaal 20 (bv. =AANTAL.ALS($A$2:$A$21;C2) en =SOM(D2:D5))'},
  {sec:'Percentages', prompt:'Bereken in C2 tot C5 het percentage met een formule en trek door.',
    build:(b,st,save,key)=>sheetTask(b,st,save,key,{cols:4, rows:7, init:{A1:'sport', B1:'aantal', C1:'percentage', A2:'voetbal', B2:'12', A3:'dans', B3:'9', A4:'tennis', B4:'6', A5:'hockey', B5:'3', A6:'totaal', B6:'30'},
      checks:[ {say:'C2 tot C5 met een formule', test:allOf(isF('C2'), isF('C5'), vIs('C2',40), vIs('C3',30), vIs('C4',20), vIs('C5',10))} ]}),
    show:'=B2/$B$6*100 (of =B2/$B$6 met de knop % in de werkbalk), doorgetrokken: 40, 30, 20, 10'},
  {sec:'Cirkeldiagram', prompt:'Maak een cirkeldiagram van de tabel (zonder totaal) met als titel <b>Favoriete sport</b>.',
    build:(b,st,save,key)=>sheetTask(b,st,save,key,{cols:3, rows:7, init:{A1:'sport', B1:'aantal', A2:'voetbal', B2:'12', A3:'dans', B3:'9', A4:'tennis', B4:'6', A5:'hockey', B5:'3', A6:'totaal', B6:'30'},
      checks:[ {say:'cirkeldiagram van A1:B5 met de juiste titel', test:sh=>chartIs(['cirkel'], (ch,d)=>sameArr(d.series[0].values,[12,9,6,3]))(sh) && /favoriete sport/i.test(sh.chart().title)} ]}),
    show:'selecteer A1:B5, Invoegen > Diagram, diagramtype Cirkeldiagram, bij Aanpassen de titel Favoriete sport'},
  {sec:'Centrummaten', prompt:'Sprongen bij verspringen (in m). Bereken met functies: E2 gemiddelde, E3 mediaan, E4 variatiebreedte.',
    build:(b,st,save,key)=>sheetTask(b,st,save,key,{cols:5, rows:10, init:Object.assign({A1:'sprong (m)', D2:'gemiddelde', D3:'mediaan', D4:'variatiebreedte'}, ...[3.4,2.9,4.1,3.6,3.0,3.8,3.2,4.0].map((v,i)=>({['A'+(i+2)]:String(v).replace('.',',')}))),
      checks:[ {say:'E2: GEMIDDELDE', test:allOf(fIs('E2','GEMIDDELDE'), vIs('E2',3.5))},
               {say:'E3: MEDIAAN', test:allOf(fIs('E3','MEDIAAN'), vIs('E3',3.5))},
               {say:'E4: een formule met MAX en MIN', test:allOf(isF('E4'), vIs('E4',1.2))} ]}),
    show:'=GEMIDDELDE(A2:A9) = 3,5 · =MEDIAAN(A2:A9) = 3,5 · =MAX(A2:A9)-MIN(A2:A9) = 1,2'},
  {sec:'Staafdiagram', prompt:'Maak een kolomdiagram van A1:B6 met titel, astitel <b>aantal</b> op de verticale as, en de verticale as vanaf 0.',
    build:(b,st,save,key)=>sheetTask(b,st,save,key,{cols:3, rows:7, init:{A1:'maand', B1:'regendagen', A2:'jan', B2:'18', A3:'feb', B3:'15', A4:'mrt', B4:'16', A5:'apr', B5:'14', A6:'mei', B6:'13'},
      checks:[ {say:'kolomdiagram van A1:B6 met titel en astitel aantal, as vanaf 0', test:sh=>chartIs(['kolom','staaf'], (ch,d)=>sameArr(d.series[0].values,[18,15,16,14,13]))(sh) && String(sh.chart().title).trim().length>2 && /aantal/i.test(sh.chart().yTitle) && (String(sh.chart().yMin).trim()==='' || parseLoose(sh.chart().yMin)===0)} ]}),
    show:'selecteer A1:B6, Invoegen > Diagram (Kolomdiagram), bij Aanpassen een titel en de astitel, Verticale as Min. leeg of 0'}
];

const PT_TIP = `${POOL.length} vragen: één per onderdeel, telkens getrokken uit een grote vragenpool. Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Werk op kladpapier, met je rekentoestel en zonder spiekbriefje. Met <b>Begin opnieuw</b> maak je dezelfde toets opnieuw, met <b>Nieuwe toets</b> krijg je andere vragen.`;
[1,2,3].forEach(i=> SECTIONS.push({ id:'toets'+i, ic:'toets', nav:'Proeftoets '+i, title:'Proeftoets '+i, tip:PT_TIP,
  cards:[ { title:'Proeftoets '+i, build:PXtoets } ] }));
SECTIONS.push({ id:'toets4', ic:'toets', nav:'Proeftoets rekenblad', title:'Proeftoets rekenblad',
  tip:'Vijf opdrachten in het rekenblad, zoals de toets in Google Spreadsheets. Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Gebruik altijd formules.',
  cards:[ { title:'Proeftoets rekenblad', build:(b,st,save,key)=>proeftoets(b,st,save,key,TOETS_RB) } ] });

/* --- volgorde en lijnen tussen de hoofdstukken --- */
(function(){
  const SEP = new Set(['soort','modus','toestel','onderzoek','fout','toets1']);
  SECTIONS.forEach(s=>{ s.sepBefore = SEP.has(s.id); });
})();
/* ============================================================
   BORDMODUS (elke kaart groot projecteren) EN SNELLE QUIZ PER HOOFDSTUK
   ============================================================ */
(function(){
  const css = `
  .px-hbtns{ display:inline-flex; gap:.4rem; align-items:center; flex-wrap:wrap; }
  .px-bord-btn{ border:1.5px solid var(--border); background:var(--card); border-radius:.6rem; padding:.3rem .7rem; font-size:.78rem; font-weight:700; cursor:pointer; color:var(--ink-soft); white-space:nowrap; }
  .px-bord-btn:hover{ border-color:var(--accent); color:var(--accent-dark); }
  @media (max-width:700px){ .px-bord-btn{ display:none; } }
  .px-board{ position:fixed; inset:0; z-index:3000; background:var(--bg); overflow:auto; padding:0 max(16px, env(safe-area-inset-right, 0px)) 2rem max(16px, env(safe-area-inset-left, 0px)); }
  .px-board .px-bar{ position:sticky; top:0; z-index:2; display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; padding:.6rem 0; background:var(--bg); border-bottom:2px solid var(--border); margin-bottom:1rem; }
  .px-board .px-bar .px-cnt{ font-weight:700; font-size:1.05rem; color:var(--accent-dark); margin-right:auto; }
  .px-board .px-bar .px-none{ color:var(--ink-soft); font-size:.85rem; }
  .px-board > .card{ max-width:1200px; margin:0 auto; }
  .px-board .viz.narrow{ max-width:min(720px, 100%); }
  .px-board .viz.mid{ max-width:min(1000px, 100%); }
  .px-board .sol.px-shown{ animation:pxIn .35s ease-out; border-color:var(--orange); }
  @keyframes pxIn{ from{ opacity:0; transform:translateY(6px); } }
  @media (prefers-reduced-motion: reduce){ .px-board .sol.px-shown{ animation:none; } }

  .px-quiz{ display:grid; gap:.7rem; }
  .px-quiz .px-top{ display:flex; flex-wrap:wrap; gap:.6rem 1.2rem; align-items:center; font-weight:700; color:var(--accent-dark); }
  .px-quiz .px-clock{ font-variant-numeric:tabular-nums; font-size:1.4rem; }
  .px-quiz .px-clock.low{ color:var(--bad); }
  .px-quiz .px-track{ height:.55rem; border-radius:999px; background:var(--accent-soft); overflow:hidden; }
  .px-quiz .px-track span{ display:block; height:100%; background:var(--orange); transition:width 1s linear; }
  .px-quiz .px-q{ font-size:1.2rem; }
  .px-quiz .px-ans{ display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; }
  .px-quiz .px-ans .inp{ font-size:1.15rem; width:6.5em; }
  .px-quiz .px-big{ font-size:2.2rem; font-weight:700; color:var(--accent-dark); }
  .px-quiz .px-miss{ margin:.2rem 0 0; padding-left:1.2rem; }
  .px-quiz .px-miss li{ margin:.2rem 0; }
  .px-quiz > .btn{ justify-self:start; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();
ICONS.quiz = '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M12 13.5l3 2M10 2.5h4M12 2.5V6M18.5 6.5l1.5-1.5"/>';

/* ---------- bordmodus ---------- */
let PXboard = null;
function PXsteps(card){ return [...card.querySelectorAll('.sol, button')].filter(e=> e.classList.contains('sol') || (!e.closest('.px-bar') && !e.classList.contains('linkbtn') && /toon mij hoe|toon de oplossing|^\s*▶/i.test(e.textContent))); }
function PXopen(card){
  if(PXboard) PXclose();
  const home = {parent:card.parentElement, next:card.nextSibling};
  const ov = el('div','px-board'); ov.setAttribute('role','dialog'); ov.setAttribute('aria-label','Bordmodus');
  const bar = el('div','px-bar');
  const cnt = el('span','px-cnt');
  const prev = el('button','btn ghost','◀ Vorige stap'), next = el('button','btn','Volgende stap ▶'), close = el('button','btn ghost','✕ Sluiten');
  [prev,next,close].forEach(b=>b.type='button');
  const none = el('span','px-none','Deze oefening heeft geen uitgeschreven oplossing. Los ze samen op en klik op Controleer.');
  bar.append(cnt, none, prev, next, close); ov.append(bar, card);
  document.body.append(ov);
  const shown = []; /* elementen die de bordmodus zichtbaar maakte */
  function paint(){
    const steps = PXsteps(card); const n = steps.length;
    none.hidden = n>0; prev.hidden = next.hidden = n===0;
    const done = steps.filter(e=>shown.includes(e)).length;
    cnt.textContent = n ? `Oplossing: stap ${done} van ${n}` : 'Bordmodus';
    prev.disabled = !shown.some(e=>e.classList.contains('sol'));
    next.disabled = done>=n;
  }
  function step(){
    const st = PXsteps(card).find(e=>!shown.includes(e)); if(!st) return;
    shown.push(st);
    if(st.classList.contains('sol')){ st.hidden = false; st.classList.add('px-shown'); const lb = st.parentElement && st.parentElement.querySelector('.q-act .linkbtn'); if(lb){ lb.hidden = false; lb.textContent = 'Verberg oplossing'; } }
    else st.click();
    st.scrollIntoView({block:'center', behavior:'smooth'}); paint();
  }
  function back(){ for(let i=shown.length-1;i>=0;i--){ const e = shown[i]; if(e.classList.contains('sol')){ shown.splice(i,1); e.hidden = true; e.classList.remove('px-shown'); const lb = e.parentElement && e.parentElement.querySelector('.q-act .linkbtn'); if(lb) lb.textContent = 'Toon oplossing'; break; } } paint(); }
  next.addEventListener('click', step); prev.addEventListener('click', back); close.addEventListener('click', ()=>PXclose());
  const key = e=>{ if(e.key==='Escape'){ PXclose(); return; } if(e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return; if(e.key==='ArrowRight' || e.key==='PageDown'){ e.preventDefault(); step(); } else if(e.key==='ArrowLeft' || e.key==='PageUp'){ e.preventDefault(); back(); } };
  document.addEventListener('keydown', key);
  const mo = new MutationObserver(()=>paint()); mo.observe(card, {childList:true, subtree:true});
  const html = document.documentElement; const fs0 = html.style.fontSize; html.style.fontSize = window.innerWidth>900 ? '150%' : '118%';
  document.body.style.overflow = 'hidden';
  PXboard = {card, home, ov, key, mo, fs0, shown};
  try{ if(ov.requestFullscreen && window.innerWidth>900) ov.requestFullscreen().catch(()=>{}); }catch(e){}
  paint(); close.focus();
}
function PXclose(){
  const B = PXboard; if(!B) return; PXboard = null;
  B.mo.disconnect(); document.removeEventListener('keydown', B.key);
  B.shown.forEach(e=>{ if(e.classList.contains('sol') && e.isConnected){ e.hidden = true; e.classList.remove('px-shown'); const lb = e.parentElement && e.parentElement.querySelector('.q-act .linkbtn'); if(lb) lb.textContent = 'Toon oplossing'; } });
  try{ if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); }catch(e){}
  document.documentElement.style.fontSize = B.fs0; document.body.style.overflow = '';
  if(B.home.next && B.home.next.parentElement===B.home.parent) B.home.parent.insertBefore(B.card, B.home.next); else B.home.parent.append(B.card);
  B.ov.remove(); B.card.scrollIntoView({block:'start'});
  const bb = B.card.querySelector('.px-bord-btn'); if(bb) bb.focus({preventScroll:true});
}
/* na het opbouwen van alle onderdelen: een knop "Bord" in elke kaartkop (niet in de proeftoetsen) */
setTimeout(()=>{
  document.querySelectorAll('#app section.group').forEach(sec=>{
    if(/^toets/.test(sec.id)) return;
    sec.querySelectorAll('.card > .card-head').forEach(ch=>{
      if(ch.querySelector('.px-bord-btn')) return;
      const wrap = el('span','px-hbtns'); const bb = el('button','px-bord-btn','⛶ Bord'); bb.type='button'; bb.title='Toon deze oefening groot op het bord, met de oplossing stap voor stap';
      const rb = ch.querySelector('.refresh-btn'); wrap.append(bb); if(rb) wrap.append(rb); ch.append(wrap);
      bb.addEventListener('click', ()=>PXopen(ch.parentElement));
    });
  });
}, 0);

/* ---------- snelle quiz met timer (telt niet mee) ---------- */
const PXq = {
  num:(q, ans, show, extra) => Object.assign({kind:'num', q, ans, show}, extra||{}),
  pair:(q, ans, show, extra) => Object.assign({kind:'pair', q, ans, show}, extra||{}),
  ch:(q, opts, ans, show) => ({kind:'ch', q, opts, ans, show})
};
const PXdir = (d, ax) => ax==='x' ? (d<0?'naar links':'naar rechts') : (d<0?'naar onder':'naar boven');
const PX_QUIZ = {
  coord:[
    r => { const ax = r()<.15; const x = ax && r()<.5 ? 0 : rNZ(r,-7,7), y = ax && x!==0 ? 0 : rNZ(r,-7,7);
      return PXq.ch(`Waar ligt het punt <b>${coStr(x,y)}</b>?`, KW.map(([v,l])=>[v, l==='op een as'?l:'kwadrant '+l]), kwAns(x,y), kwadrant(x,y)); },
    r => { const x = rNZ(r,-9,9), y = rNZ(r,-9,9), w = r()<.5 ? 'x' : 'y'; const n = rPick(r, ['P','Q','R','S']);
      return PXq.num(`Wat is de <b>${w}-coördinaat</b> van ${n}${coStr(x,y)}?`, w==='x'?x:y, fmt(w==='x'?x:y)); },
    r => { const x = rInt(r,-5,5), y = rInt(r,-5,5), ax = r()<.5 ? 'x' : 'y', d = rNZ(r,-4,4); const X = ax==='x'?x+d:x, Y = ax==='y'?y+d:y;
      return PXq.pair(`A${coStr(x,y)} schuift <b>${Math.abs(d)} ${PXdir(d,ax)}</b>. Waar komt het punt terecht?`, [X,Y], `A'${coStr(X,Y)}`); },
    r => { const x = rNZ(r,-6,6), y = rNZ(r,-6,6);
      return PXq.pair(`P ligt <b>${Math.abs(x)} ${x<0?'links':'rechts'}</b> van de y-as en <b>${Math.abs(y)} ${y<0?'onder':'boven'}</b> de x-as. Noteer P.`, [x,y], `P${coStr(x,y)}`); },
    r => { const x = rInt(r,-6,6), y = x===0 ? rNZ(r,-6,6) : rInt(r,-6,6);
      return PXq.pair('Lees de coördinaat van punt <b>K</b> af.', [x,y], `K${coStr(x,y)}`, {viz:b=>{ const P = plane(); P.point(x,y,'K'); b.append(planeBox(P.svg,'narrow')); }}); }
  ],
  data:[
    r => { const [t,a] = rPick(r, PX_SORT); return PXq.ch(`Is <b>${t}</b> categorische of numerieke data?`, [['c','categorisch'],['n','numeriek']], a, a==='c'?'categorisch':'numeriek'); },
    r => { const n = rPick(r,[10,20,25,50]), k = rInt(r,1,n-1); const what = rPick(r, ['komen met de fiets','hebben een hond','spelen een instrument','dragen een bril']);
      return PXq.num(`${k} van de ${n} leerlingen ${what}. Welk percentage is dat? (in %)`, k/n*100, nf(k/n*100)+' %'); },
    r => { const vals = Array.from({length:rInt(r,9,12)}, ()=>rInt(r,1,5)); const v = rPick(r, vals);
      return PXq.num(`Hoe vaak komt <b>${v}</b> voor? &nbsp;${vals.join(', ')}`, countOf(vals,v), String(countOf(vals,v))); },
    r => { const S = [['De temperatuur elk uur van een dag.','l'],['De lengte van een baby elke maand.','l'],['Welk deel van de klas met de fiets, te voet of met de bus komt.','c'],['Hoe je zakgeld verdeeld wordt over snoep, kleren en sparen.','c'],['Het aantal leerlingen per lievelingssport vergelijken.','k'],['De punten van vijf leerlingen op een toets vergelijken.','k']];
      const [t,a] = rPick(r,S); const O = [['k','staafdiagram'],['c','cirkeldiagram'],['l','lijndiagram']]; return PXq.ch(`Welk diagram past het best? ${t}`, O, a, O.find(o=>o[0]===a)[1]); },
    r => { const p = rPick(r,[5,10,20,25,30,40,50,75]); return PXq.num(`Een sector in een cirkeldiagram stelt <b>${p} %</b> voor. Hoeveel graden is de hoek?`, p*3.6, nf(p*3.6)+'°'); },
    r => { const n = rPick(r,[20,25,40,50]); const p = rPick(r, n===25?[4,20,40,60,80]:n===40?[25,50,75,10,5]:[10,20,30,40,50,60]); const k = n*p/100;
      return PXq.num(`${p} % van de ${n} leerlingen sport elke dag. Hoeveel leerlingen zijn dat?`, k, nf(k)); }
  ],
  maten:[
    r => { const n = rPick(r,[3,4,5]), m = rInt(r,3,12); let v; do{ v = Array.from({length:n-1}, ()=>rInt(r,1,20)); v.push(n*m-sum(v)); }while(v[n-1]<1 || v[n-1]>20);
      return PXq.num(`Het <b>gemiddelde</b> van ${PXlist(v)}?`, m, `${sum(v)} : ${n} = ${m}`); },
    r => { const n = rPick(r,[4,5,5,6,7]); const v = Array.from({length:n}, ()=>rInt(r,1,20)); const me = median(v);
      return PXq.num(`De <b>mediaan</b> van ${PXlist(v)}?`, me, `geordend ${PXlist(sorted(v))}: Me = ${nf(me)}`); },
    r => { const m = rInt(r,1,9); const v = [m,m,m]; while(v.length<rInt(r,7,9)){ const x = rInt(r,1,9); if(x!==m && countOf(v,x)<2) v.push(x); }
      const w = PXshuf(r, v); return PXq.num(`De <b>modus</b> van ${PXlist(w)}?`, m, `${m} komt ${countOf(w,m)} keer voor`); },
    r => { const v = Array.from({length:rInt(r,5,7)}, ()=>rInt(r,1,30)); return PXq.num(`De <b>variatiebreedte</b> van ${PXlist(v)}?`, range(v), `${Math.max(...v)} − ${Math.min(...v)} = ${range(v)}`); },
    r => { const n = rInt(r,3,8), m = rInt(r,4,12); return PXq.num(`Het gemiddelde van ${n} getallen is ${m}. Wat is hun <b>som</b>?`, n*m, `${n} · ${m} = ${n*m}`); }
  ]
};
function PXquiz(gens, cfg){ return (b, st, save, key) => {
  const N = cfg.n || 10, T = cfg.t || 180;
  const root = el('div','px-quiz'); b.append(root);
  let timer = null;
  const stop = () => { if(timer){ clearInterval(timer); timer = null; } };
  const mm = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  function intro(){
    stop(); root.innerHTML = '';
    root.append(el('div','readout bigq', `${N} vragen, ${mm(T)} minuten. Hoeveel krijg jij juist? Deze quiz telt niet mee.`));
    if(st.best) root.append(el('div','sub', `Jouw beste score: <b>${st.best.score} / ${N}</b>${st.best.time!=null?` in ${mm(st.best.time)}`:''}.`));
    const go = el('button','btn big','▶ Start de quiz'); go.type='button'; go.addEventListener('click', run); root.append(go);
  }
  function run(){
    stop(); root.innerHTML = '';
    const r = rng(Math.floor(Math.random()*1e9));
    const order = []; while(order.length<N){ PXshuf(r, gens.map((_,i)=>i)).forEach(i=>{ if(order.length<N) order.push(i); }); }
    const Q = []; order.forEach(i=>{ let q, t = 0; do{ q = gens[i](r); }while(t++<20 && Q.some(x=>x.q===q.q)); Q.push(q); });
    const top = el('div','px-top'); const clock = el('span','px-clock', mm(T)); const prog = el('span'); const sc = el('span');
    top.append(clock, prog, sc);
    const track = el('div','px-track', '<span style="width:100%"></span>');
    const area = el('div'); const fb = el('div','fb');
    root.append(top, track, area, fb);
    let k = 0, score = 0, left = T, busy = false; const miss = []; const t0 = Date.now();
    timer = setInterval(()=>{ if(!root.isConnected){ stop(); return; } left--; clock.textContent = mm(Math.max(0,left)); clock.classList.toggle('low', left<=20); track.firstChild.style.width = Math.max(0, left/T*100)+'%'; if(left<=0) end(true); }, 1000);
    function show(){
      busy = false; fb.className = 'fb'; fb.textContent = '';
      prog.textContent = `Vraag ${k+1} / ${N}`; sc.textContent = `✅ ${score}`;
      const q = Q[k]; area.innerHTML = '';
      area.append(el('div','px-q', q.q));
      if(q.viz) q.viz(area);
      const ans = el('div','px-ans'); area.append(ans);
      if(q.kind==='ch'){ q.opts.forEach(([v,l])=>{ const bt = el('button','opt',l); bt.type='button'; bt.addEventListener('click', ()=>answer(v, bt)); ans.append(bt); }); }
      else {
        const ins = q.kind==='pair' ? [0,1].map(()=>el('input','inp xs')) : [el('input','inp')];
        ins.forEach(i=>{ i.type='text'; i.autocomplete='off'; i.setAttribute('inputmode','text'); i.setAttribute('aria-label','antwoord'); });
        if(q.kind==='pair'){ ans.append(el('span','bigq','(')); ans.append(ins[0]); ans.append(el('span','bigq',',')); ans.append(ins[1]); ans.append(el('span','bigq',')')); } else ans.append(ins[0]);
        const ok = el('button','btn','OK'); ok.type='button'; ans.append(ok);
        const go = () => { if(ins.some(i=>i.value.trim()==='')){ fb.className='fb info'; fb.textContent = 'Vul eerst je antwoord in.'; return; } answer(ins.map(i=>parseLoose(i.value))); };
        ok.addEventListener('click', go); ins.forEach(i=>i.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } }));
        ins[0].focus({preventScroll:true});
      }
    }
    function answer(v, bt){
      if(busy) return; busy = true; const q = Q[k];
      const good = q.kind==='ch' ? v===q.ans : q.kind==='pair' ? Math.abs(v[0]-q.ans[0])<1e-9 && Math.abs(v[1]-q.ans[1])<1e-9 : Math.abs(v[0]-q.ans)<1e-9;
      if(good) score++; else miss.push(q);
      if(bt) bt.classList.add(good?'good':'wrong');
      area.querySelectorAll('input, .opt, .btn').forEach(x=>x.disabled = true);
      fb.className = 'fb '+(good?'ok':'bad'); fb.innerHTML = good ? '✅ Juist!' : `❌ Juist was: <b>${q.show}</b>`;
      sc.textContent = `✅ ${score}`;
      setTimeout(()=>{ if(!timer) return; k++; if(k>=N) end(false); else show(); }, good ? 700 : 1800);
    }
    function end(timeUp){
      if(!timer && !timeUp) return; stop(); const used = Math.min(T, Math.round((Date.now()-t0)/1000));
      const best = !st.best || score>st.best.score || (score===st.best.score && used<(st.best.time||1e9));
      if(best){ st.best = {score, time: timeUp ? null : used}; save(); }
      root.innerHTML = '';
      root.append(el('div','px-big', `${score} / ${N}`));
      root.append(el('div','readout', (timeUp ? '⏰ De tijd is om. ' : `Klaar in ${mm(used)}. `) + (best && score>0 ? '🎉 Dat is jouw beste score!' : `Jouw beste score: ${st.best.score} / ${N}.`)));
      if(miss.length){ root.append(el('div','sub','Dit ging nog mis:')); const ul = el('ul','px-miss'); miss.forEach(q=>ul.append(el('li','', `${q.q.replace(/<div[\s\S]*$/,'')} → <b>${q.show}</b>`))); root.append(ul); }
      if(timeUp && k<N) root.append(el('div','sub', `${N-k} vragen kwamen niet meer aan bod.`));
      const again = el('button','btn big','↻ Nog eens'); again.type='button'; again.addEventListener('click', run); root.append(again);
    }
    show();
  }
  intro();
}; }
(function(){
  const at = SECTIONS.findIndex(s=>s.id==='fout');
  const sec = { id:'quiz', ic:'quiz', nav:'Snelle quiz', title:'Snelle quiz: hoe snel ben jij?',
    tip:'Tien korte vragen tegen de klok. De quiz telt niet mee: speel hem zo vaak je wil en probeer je beste score te verbeteren.',
    cards:[
      { title:'Quiz coördinaten', instr:'Kwadranten, coördinaten aflezen en punten verschuiven.', build:PXquiz(PX_QUIZ.coord, {}) },
      { title:'Quiz data voorstellen', instr:'Soorten data, frequenties, percentages en diagrammen.', build:PXquiz(PX_QUIZ.data, {}) },
      { title:'Quiz centrummaten', instr:'Gemiddelde, mediaan, modus en variatiebreedte, uit het hoofd.', build:PXquiz(PX_QUIZ.maten, {}) }
    ]};
  if(at<0) SECTIONS.push(sec); else SECTIONS.splice(at+1, 0, sec);
})();
/* ============================================================
   KAARTEN ORDENEN: basis, dan oefenen, dan verdieping (stabiel)
   ============================================================ */
SECTIONS.forEach(s=>{ if(!s.cards || /^toets/.test(s.id)) return; s.cards = s.cards.map((c,i)=>[c,i]).sort((a,b)=>(a[0].lvl||1)-(b[0].lvl||1) || a[1]-b[1]).map(x=>x[0]); });
/* onderdelen die de leerkracht uitzette, verbergen */
if(window.CL_VERBORGEN){ for(let i = SECTIONS.length - 1; i >= 0; i--) if(window.CL_VERBORGEN.has(SECTIONS[i].id)) SECTIONS.splice(i, 1); }
const app = document.getElementById('app');
const nav = document.getElementById('nav');
const pager = document.getElementById('pager');
const renderers = {};
const secEls = {}, navLinks = {};
SECTIONS.forEach((sec, si)=>{
  const num = si+1;
  if(sec.sepBefore){ nav.append(el('li','sep')); }
  const li = el('li');
  const a = el('button','', `${icon(sec.ic)}<span class="n">${num}</span><span class="lbl">${sec.nav}</span>`);
  a.type = 'button'; a.addEventListener('click', ()=>show(sec.id, true));
  li.append(a); nav.append(li); navLinks[sec.id] = a;

  const s = el('section','group'); s.id = sec.id; s.hidden = true;
  const head = el('div','sec-head', `<span class="sec-ic">${icon(sec.ic)}</span><h2><span class="num">${num}.</span>${sec.title}</h2>`);
  s.append(head);
  if(sec.cheat){
    const cb = el('button','cheat-btn', icon('cheat')); cb.type='button'; cb.dataset.tip='spiekbriefje'; cb.setAttribute('aria-label','spiekbriefje'); cb.setAttribute('aria-expanded','false');
    const panel = el('div','cheat', sec.cheat); panel.hidden = true;
    cb.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; cb.setAttribute('aria-expanded', String(!panel.hidden)); });
    head.append(cb); s.append(panel);
  }
  if(sec.tip) s.append(el('div','tip', icon('bulb') + `<div>${sec.tip}</div>`));
  if(sec.top) sec.top(s);  /* bv. de klassessie bij Experimenten */
  /* tabbladen: basis en oefenen / verdieping */
  const hasCh = sec.cards.some(c=>c.lvl===3) && sec.cards.some(c=>c.lvl!==3);
  let panes = {b:s, c:s};
  if(hasCh){
    const bar = el('div','tabs'); bar.setAttribute('role','tablist');
    const tb1 = el('button','tab', 'Basis en oefenen'), tb2 = el('button','tab', 'Verdieping');
    [tb1,tb2].forEach(b=>{ b.type='button'; b.setAttribute('role','tab'); bar.append(b); });
    const p1 = el('div','tabpane'), p2 = el('div','tabpane');
    s.append(bar, p1, p2); panes = {b:p1, c:p2};
    const setTab = k => { p1.hidden = k!=='b'; p2.hidden = k!=='c'; tb1.setAttribute('aria-selected', String(k==='b')); tb2.setAttribute('aria-selected', String(k==='c')); clearSel(); try{ localStorage.setItem(PREFIX+'stab_'+sec.id, k); }catch(e){} };
    tb1.addEventListener('click', ()=>setTab('b')); tb2.addEventListener('click', ()=>setTab('c'));
    let k0 = 'b'; try{ k0 = localStorage.getItem(PREFIX+'stab_'+sec.id) || 'b'; }catch(e){}
    setTab(k0);
    p2.append(el('div','tip', icon('bulb') + '<div>Verdieping is moeilijker. Probeer deze oefeningen als je <b>Basis en oefenen</b> goed kan.</div>'));
  }
  sec.cards.forEach((card,ci)=>{
    if(card.skip) return; /* lege plaats: houdt de nummering (en dus de bewaarde antwoorden) van de volgende kaarten */
    const key = sec.id + '_' + ci;
    const c = el('div','card');
    const ch = el('div','card-head', `<h3>${card.title}${card.lvl?LVL[card.lvl]:''}</h3>`);
    const rb = el('button','refresh-btn','↺ Opnieuw beginnen'); rb.type='button';
    ch.append(rb); c.append(ch);
    if(card.instr) c.append(el('p','instructions', card.instr));
    const body = el('div'); c.append(body); (card.lvl===3 ? panes.c : panes.b).append(c);
    if(card.naast === false) body.classList.add('no-naast');
    renderers[key] = ()=>{ body.innerHTML = ''; clearSel(); const st = load(key); const save = ()=>store(key, st); CURKEY = key;
      try{ card.build(body, st, save, key); naast(body); naastTabel(body); }catch(err){ console.error(err); body.append(el('p','fb bad','Er liep iets mis bij deze oefening. Klik op “Opnieuw beginnen”.')); } };
    rb.addEventListener('click', ()=>{ wipe(key); renderers[key](); });
    renderers[key]();
  });
  app.append(s); secEls[sec.id] = s;
});

/* een grafiek of figuur met daarna vragen of een tabel: op een breed (Chromebook)scherm naast elkaar, figuur links */
function naast(root){
  root.querySelectorAll('.viz').forEach(v=>{
    const P = v.parentElement; if(!P || v.closest('.nx, .sheet, .zs, .no-naast, .pt-q, .cg2')) return;
    /* enkel bij één figuur per kaart: zijn er meer figuren (bv. een reeks kleine voorstellingen met elk een vraag), dan blijft alles onder elkaar */
    const kaart = v.closest('.card'); if(kaart && kaart.querySelectorAll('.viz').length > 1) return;
    const na = []; for(let n = v.nextElementSibling; n; n = n.nextElementSibling) na.push(n);
    /* een gegeven tabel vlak boven de figuur (bv. een diagram bouwen): tabel links, figuur rechts */
    const vo = v.previousElementSibling;
    if(vo && !vo.querySelector('input') && (vo.matches('table.ftab') || vo.querySelector('table.ftab')) && ![...vo.querySelectorAll('tr')].some(tr=>tr.children.length > 4)){
      const w = el('div','nx tv'), l = el('div','nx-l'), r = el('div','nx-r'); w.dataset.auto='fig'; P.insertBefore(w, vo); l.append(vo); r.append(v); w.append(l, r); return; }
    if(!na.length || na.some(x=>x.matches('.viz') || x.querySelector('.viz'))) return;
    if(!na.some(x=>x.matches('input, table, select, textarea') || x.querySelector('input, table, select, textarea, .chip, .opt'))) return;
    /* een brede tabel (veel kolommen) past niet naast de figuur */
    if(na.some(x=>[...x.querySelectorAll('tr')].some(tr=>tr.children.length > 4))) return;
    const w = el('div','nx'), l = el('div','nx-l'), r = el('div','nx-r'); w.dataset.auto='fig';
    P.insertBefore(w, v); l.append(v); na.forEach(x=>r.append(x)); w.append(l, r);
  });
}
/* een gegeven tabel (zonder invulvakjes) met daarna vragen: tabel links, vragen rechts */
function naastTabel(root){
  root.querySelectorAll('table.ftab').forEach(t=>{
    if(t.querySelector('input') || t.closest('.nx, .sheet, .zs, .no-naast, .pt-q, .cg2, .viz, .ph') || [...t.querySelectorAll('tr')].some(tr=>tr.children.length > 4)) return;
    let E = t; while(E.parentElement && E.parentElement !== root && !E.nextElementSibling) E = E.parentElement;
    if(E === root || !E.nextElementSibling) return;
    const na = []; for(let n = E.nextElementSibling; n; n = n.nextElementSibling) na.push(n);
    if(na.some(x=>x.matches('.viz, table') || x.querySelector('.viz'))) return;
    if(!na.some(x=>x.matches('input, select') || x.querySelector('input, select, .opt'))) return;
    const P = E.parentElement, w = el('div','nx tv'); w.dataset.auto='tab'; const l = el('div','nx-l'), r = el('div','nx-r');
    P.insertBefore(w, E); l.append(E); na.forEach(x=>r.append(x)); w.append(l, r);
  });
}
/* ook als een oefening zichzelf opnieuw tekent (Nieuwe opgave, Volgende ...) */
new MutationObserver(ms=>{ const s = new Set(); ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType===1 && !n.classList.contains('nx') && (n.matches('.viz, table.ftab') || n.querySelector('.viz, table.ftab'))) s.add(n.closest('.card') || n.parentElement); })); s.forEach(c=>{ if(c){ naast(c); naastTabel(c); } }); }).observe(app, { childList:true, subtree:true });

function show(id, scroll){
  const idx = SECTIONS.findIndex(s=>s.id===id); if(idx<0) return;
  clearSel();
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
