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
  .ftab{ border-collapse:collapse; margin:.4rem 0; font-variant-numeric:tabular-nums; }
  .ftab th, .ftab td{ border:2px solid var(--tq); padding:.35rem .7rem; text-align:center; }
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
const DARKPAL = new Set(['#127a7f','#4f6668']);
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
        const p = v>=tot-1e-9 ? svgEl('circle',{cx,cy,r,fill:PAL[i%PAL.length],class:'sec'},svg)
          : svgEl('path',{d:`M${cx},${cy} L${cx+r*Math.cos(a0)},${cy+r*Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx+r*Math.cos(a1)},${cy+r*Math.sin(a1)} Z`, fill:PAL[i%PAL.length], class:'sec'+(anim?' pop':'')}, svg);
        if(anim) p.style.animationDelay = (i*0.12)+'s';
        const am = (a0+a1)/2;
        if(v/tot>0.045){ const t = svgText(svg, cx+r*0.66*Math.cos(am), cy+r*0.66*Math.sin(am)+5, d.pct===false? nf(v):nf(v/tot*100,0)+' %', {'text-anchor':'middle', class:'t-big'}); t.style.fill=DARKPAL.has(PAL[i%PAL.length])?'#ffffff':'#173436'; }
        a0 = a1;
      });
      labels.forEach((l,i)=>{ const y = 50+i*24; svgEl('rect',{x:W*0.7, y:y-12, width:16, height:16, rx:3, fill:PAL[i%PAL.length]}, svg); svgText(svg, W*0.7+22, y+1, l); });
    } else {
      const x0 = 20, x1 = W-20, y = 70, h = 56; let x = x0;
      vals.forEach((v,i)=>{ const w=(x1-x0)*v/tot; const r=svgEl('rect',{x, y, width:Math.max(0,w), height:h, fill:PAL[i%PAL.length], class:'sec'+(anim?' fade-in':'')}, svg); if(anim) r.style.animationDelay=(i*0.12)+'s';
        if(v/tot>0.06){ const t=svgText(svg, x+w/2, y+h/2+6, nf(v/tot*100,0)+' %', {'text-anchor':'middle', class:'t-big'}); t.style.fill=DARKPAL.has(PAL[i%PAL.length])?'#ffffff':'#173436'; }
        x += w; });
      labels.forEach((l,i)=>{ const col=i%3, row=Math.floor(i/3); const lx=x0+col*(W-40)/3, ly=y+h+36+row*24; svgEl('rect',{x:lx, y:ly-12, width:16, height:16, rx:3, fill:PAL[i%PAL.length]}, svg); svgText(svg, lx+22, ly+1, l); });
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
      if(pts.length>1){ const pl=svgEl('polyline',{points:pts.map(p=>p.join(',')).join(' '), class:(si%2?'ln2':'ln')+(anim?' draw':'')}, svg); if(ns>1 && si>1) pl.style.stroke=PAL[si%PAL.length]; }
      pts.forEach(p=>{ const c=svgEl('circle',{cx:p[0], cy:p[1], r:4.5, class:'pt'+(si%2?' or':'')}, svg); if(ns>1 && si>1) c.style.fill=PAL[si%PAL.length]; });
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
        if(ns>1) r.style.fill = PAL[si%PAL.length];
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
  if(ns>1){ series.forEach((s,si)=>{ const x=L+10+si*120, y=H-14; svgEl('rect',{x, y:y-11, width:14, height:14, rx:3, fill:PAL[si%PAL.length]}, svg); svgText(svg, x+19, y+1, s.name); }); }
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
  const head = `<thead><tr><th>${cfg.head||'gegeven'}</th><th>turven</th><th>absolute frequentie</th></tr></thead>`;
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
    fb.className='fb'; fb.textContent = Object.keys(done).length===cfg.data.length ? 'Alles is geturfd. Tel nu de turfjes en vul de absolute frequenties en het totaal in.' : '';
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
    tabel:'Een <b>frequentietabel</b> geeft per gegeven de absolute frequentie: hoeveel keer het voorkomt.',
    dot:'In een <b>dotplot</b> staan de gegevens op de horizontale as. Voor elke keer dat een gegeven voorkomt, komt er een bolletje bij.',
    kolom:'In een <b>staafdiagram</b> staan de staven los van elkaar. Elke staaf is zo hoog als de absolute frequentie.',
    strook:'In een <b>strookdiagram</b> is de hele strook 100 %. Elk gegeven krijgt een stuk in verhouding.',
    cirkel:'In een <b>cirkeldiagram</b> is de hele cirkel 100 % of 360°. Hoe groter het deel, hoe groter de middelpuntshoek.'
  };
  const bar = el('div','viz-bar'); const v = el('div','viz mid'); const out = el('div','readout');
  b.append(bar, v, out);
  const tot = sum(d.series[0].values);
  const btns = types.map(([t,l])=>{ const k = el('button','btn ghost', l); k.type='button'; bar.append(k);
    k.addEventListener('click', ()=>{ btns.forEach(x=>x.classList.remove('tool-on')); k.classList.add('tool-on'); v.innerHTML='';
      if(t==='tabel') v.innerHTML = ftabHTML([d.head||'gegeven','absolute frequentie'], d.labels.map((l,i)=>[l, d.series[0].values[i]]).concat([['<b>totaal</b>', '<b>'+tot+'</b>']]));
      else v.append(drawChart(t, Object.assign({}, d, {yTitle: t==='kolom'? 'aantal' : d.yTitle})));
      out.innerHTML = say[t]; });
    return k; });
  btns[0].click();
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
    fb.innerHTML = ok ? '✅ Juist! Elke staaf is zo hoog als de absolute frequentie.' : `❌ Nog niet juist: kijk nog eens naar ${wrong.join(', ')}. Lees de hoogte af op de verticale as.`;
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
<tr><td>absolute frequentie</td><td>Hoeveel keer een gegeven voorkomt. Een frequentietabel zet ze op een rij.</td></tr>
<tr><td>percentage</td><td>absolute frequentie : totaal · 100</td></tr>
<tr><td>middelpuntshoek</td><td>absolute frequentie : totaal · 360°</td></tr>
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
        {html: `<table class="ftab"><thead><tr><th>mening</th><th>turven</th><th>absolute frequentie</th></tr></thead><tbody>
          <tr><td class="l">helemaal akkoord</td><td>${tallySVG(4)}</td><td>[[0]]</td></tr>
          <tr><td class="l">akkoord</td><td>${tallySVG(9)}</td><td>[[1]]</td></tr>
          <tr><td class="l">niet akkoord</td><td>${tallySVG(6)}</td><td>[[2]]</td></tr>
          <tr><td class="l">helemaal niet akkoord</td><td>${tallySVG(3)}</td><td>[[3]]</td></tr>
          <tr><td class="l"><b>totaal</b></td><td></td><td>[[4]]</td></tr></tbody></table>`, block:true, size:'xs', mode:'numeric',
          check:nums([4,9,6,3,22], 1e-9, 'Een bundeltje van vier strepen met een schuine streep erdoor is 5.'), sol:'4 + 9 + 6 + 3 = <b>22</b> leerlingen.'},
        {html:'Hoeveel leerlingen gaven hun mening? [[0]]', mode:'numeric', check:exact(22), sol:'Het totaal: 22 leerlingen.'},
        {html:'Wat betekent de absolute frequentie 9 bij "akkoord"? Kies.', choice:[['a','9 % is akkoord'],['b','9 leerlingen zijn akkoord'],['c','akkoord kwam 9 keer minder voor']], check:(v,c)=>({ok:c==='b', choiceOk:c==='b'}), sol:'De absolute frequentie is het aantal keer dat het gegeven voorkomt: 9 leerlingen antwoordden "akkoord".'}
      ], {letters:true}) },
    { title:'Van dotplot naar tabel', lvl:2, instr:'Elk bolletje is een leerling. Vul de frequentietabel in.',
      build:combo(chartBox('dot', HUISDIER_DOT, 'mid'), list([
        {html: `<table class="ftab"><thead><tr><th>aantal huisdieren</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>totaal</th></tr></thead><tbody>
          <tr><td class="l">absolute frequentie</td><td>[[0]]</td><td>[[1]]</td><td>[[2]]</td><td>[[3]]</td><td>[[4]]</td><td>[[5]]</td><td>[[6]]</td></tr></tbody></table>`, block:true, size:'sm', mode:'numeric',
          check:nums([4,7,6,2,0,1,20], 1e-9, 'Tel de bolletjes per kolom. Waar geen bolletje staat, is de frequentie 0.'), sol:'4, 7, 6, 2, 0 en 1: samen <b>20</b> leerlingen.'}
      ])) },
    { title:'Percentages in de tabel', lvl:2, instr:'25 leerlingen kozen hun favoriete fruit. Bereken voor elk het percentage: absolute frequentie : totaal · 100.',
      build:list([
        {html: `<table class="ftab"><thead><tr><th>fruit</th><th>absolute frequentie</th><th>percentage</th></tr></thead><tbody>
          <tr><td class="l">appel</td><td>8</td><td>[[0]] %</td></tr><tr><td class="l">banaan</td><td>6</td><td>[[1]] %</td></tr>
          <tr><td class="l">aardbei</td><td>9</td><td>[[2]] %</td></tr><tr><td class="l">kiwi</td><td>2</td><td>[[3]] %</td></tr>
          <tr><td class="l"><b>totaal</b></td><td><b>25</b></td><td>[[4]] %</td></tr></tbody></table>`, block:true, size:'sm',
          check:nums([32,24,36,8,100], 1e-9, 'Deel door 25 en vermenigvuldig met 100 (of: vermenigvuldig met 4).'), sol:'8 : 25 · 100 = 32 % · 6 : 25 · 100 = 24 % · 9 : 25 · 100 = 36 % · 2 : 25 · 100 = 8 % · samen <b>100 %</b>.'}
      ]) },
    { title:'Schoolreis', lvl:3, instr:'240 leerlingen kozen één bestemming. 60 kozen de zoo, een derde koos het pretpark, 25 % koos het museum en de rest koos de kust.',
      build:list([
        {html: `<table class="ftab"><thead><tr><th>bestemming</th><th>absolute frequentie</th><th>percentage</th></tr></thead><tbody>
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
    { title:'Eén dataset, vijf voorstellingen', lvl:1, instr:'25 leerlingen gaven hun favoriete sport. Klik op de knoppen en vergelijk de voorstellingen.',
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
      build:combo(html(ftabHTML(['broodbeleg','absolute frequentie'], [['kaas',7],['choco',9],['hesp',5],['confituur',2]])),
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
  const vals = cfg.vals.slice();
  const P = numPlot(vals, cfg.lo, cfg.hi, {xTitle:cfg.xTitle, extra:40, step:cfg.step||1});
  const v = el('div','viz'); v.append(P.svg); b.append(v);
  const out = el('div','readout bigq'); b.append(out);
  b.append(el('div','sub','Sleep het oranje bolletje naar rechts of naar links.'));
  let mk = [];
  const last = vals.length-1;
  function paint(){
    P.drawDots(vals, new Set([last]));
    mk.forEach(g=>g.remove());
    const m = mean(vals), me = median(vals);
    mk = [marker(P, m, 'x̄ = '+nf(m,1), 'or'), marker(P, me, 'Me = '+nf(me,1))];
    if(Math.abs(P.X(m)-P.X(me))<60){ mk[1].setAttribute('transform','translate(0,26)'); }
    out.innerHTML = `Gemiddelde <b>${nf(m,2)}</b> · mediaan <b>${nf(me,2)}</b> · variatiebreedte <b>${nf(range(vals),2)}</b>`;
  }
  let drag=false;
  function setFrom(ev){ const pt=P.svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY; const p=pt.matrixTransform(P.svg.getScreenCTM().inverse()); let x = cfg.lo + (p.x-P.L)/P.pw*(cfg.hi-cfg.lo); x = Math.max(cfg.lo, Math.min(cfg.hi, Math.round(x/(cfg.step||1))*(cfg.step||1))); if(x!==vals[last]){ vals[last]=x; paint(); } }
  P.svg.addEventListener('pointerdown', e=>{ const c = e.target.closest('circle.dot'); if(!c || +c.dataset.i!==last) return; drag=true; P.svg.setPointerCapture(e.pointerId); e.preventDefault(); });
  P.svg.addEventListener('pointermove', e=>{ if(drag) setFrom(e); });
  P.svg.addEventListener('pointerup', ()=>drag=false);
  P.svg.style.height='auto'; paint();
  P.svg.setAttribute('viewBox', `0 0 ${P.W} ${P.H+60}`);
}

/* ============================================================
   ONDERDEEL 7 · MODUS EN VARIATIEBREEDTE
   ============================================================ */
const CHEAT_MATEN = `<h3>Spiekbriefje · centrummaten en spreidingsmaat</h3><table>
<tr><td>modus</td><td>Het gegeven dat het meest voorkomt (de grootste absolute frequentie). Kan ook bij categorische data.</td></tr>
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
        {html: `<table class="ftab"><thead><tr><th>uren slaap</th><th>absolute frequentie</th><th>uren · frequentie</th></tr></thead><tbody>
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
    { title:'De uitschieter', lvl:1, instr:'Acht leerlingen: hoeveel minuten fietsen ze naar school? Sleep het oranje bolletje ver naar rechts (één leerling woont heel ver).',
      build:combo(b=>outlierDemo(b, {vals:[5,8,8,10,12,12,12,15], lo:0, hi:60, step:5, xTitle:'Minuten fietsen'}), choiceList([
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
   NAGEBOOTST REKENTOESTEL (zoals de TI-30XS MultiView)
   Enkel wat we nodig hebben: lijsten invullen (data), 1-Var Stats (2nd data = stat), resultaten bekijken.
   ============================================================ */
(function(){
  const css = `
  .calc-wrap{ display:flex; flex-wrap:wrap; gap:1rem; align-items:flex-start; }
  .tcalc{ width:270px; background:#2d3436; border-radius:22px 22px 30px 30px; padding:14px 14px 18px; box-shadow:0 4px 0 #1b1f20; user-select:none; -webkit-user-select:none; }
  .tcalc .brand{ color:#dfe6e9; font-size:.72rem; letter-spacing:.08em; margin:0 0 6px 4px; }
  .tcalc .scr{ background:#c9d6b9; color:#1d2b14; font-family:ui-monospace, Consolas, "DejaVu Sans Mono", monospace; font-size:14.5px; line-height:1.3; height:6.6em; border-radius:6px; padding:6px 8px; white-space:pre; overflow:hidden; border:3px solid #1b1f20; }
  .tcalc .scr .cur{ background:#1d2b14; color:#c9d6b9; }
  .tcalc .scr .ind{ font-size:10px; height:1.1em; line-height:1.1em; }
  .tcalc .keys{ display:grid; grid-template-columns:repeat(5,1fr); gap:7px; margin-top:12px; }
  .tcalc .k{ font:700 12px/1 var(--f-body); color:#fff; background:#4a5357; border:none; border-radius:8px; height:32px; cursor:pointer; position:relative; box-shadow:0 2px 0 #1b1f20; }
  .tcalc .k small{ position:absolute; top:-12px; left:0; right:0; font-size:9.5px; color:#74b9ff; font-weight:700; }
  .tcalc .k.n{ background:#f1f2f6; color:#1b1f20; font-size:15px; }
  .tcalc .k.zero{ grid-column:2; }
  .tcalc .k.sec{ background:#0984e3; }
  .tcalc .k.ent{ background:#636e72; }
  .tcalc .k.hot{ outline:4px solid var(--orange); outline-offset:1px; transform:translateY(2px); box-shadow:none; }
  .tcalc .keys .gap{ height:4px; grid-column:1/-1; }
  .steps-box{ flex:1; min-width:240px; }
  .steps-box ol{ padding-left:1.3rem; margin:.3rem 0; }
  .steps-box li{ margin:.25rem 0; padding:.15rem .3rem; border-radius:.4rem; }
  .steps-box li.now{ background:var(--or-soft); outline:2px solid var(--orange); }
  .kbd{ display:inline-block; min-width:1.6em; padding:0 .35em; border-radius:.35em; background:#4a5357; color:#fff; font-weight:700; font-size:.85em; text-align:center; }
  .kbd.n{ background:#f1f2f6; color:#1b1f20; border:1px solid #b2bec3; } .kbd.sec{ background:#0984e3; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();
const K = (t, cls) => `<span class="kbd ${cls||''}">${t}</span>`;

function makeCalc(parent){
  const box = el('div','tcalc');
  box.innerHTML = `<div class="brand">TI-30XS MultiView (nagebootst)</div><div class="scr"></div><div class="keys"></div>`;
  const scr = box.querySelector('.scr'), keys = box.querySelector('.keys');
  const S = { mode:'home', second:false, L:[[],[],[]], col:0, row:0, buf:'', menu:0, opt:{data:0, frq:0}, optRow:0, res:[], resTop:0, home:'' };
  const layout = [
    ['2nd','sec','2nd'],['mode','','mode','quit'],['del','','delete'],['◀','','left'],['▶','','right'],
    ['data','','data','stat'],['clear','','clear'],['▲','','up'],['▼','','down'],['enter','ent','enter'],
    ['7','n','7'],['8','n','8'],['9','n','9'],['÷','','÷'],['×','','×'],
    ['4','n','4'],['5','n','5'],['6','n','6'],['−','','−'],['+','','+'],
    ['1','n','1'],['2','n','2'],['3','n','3'],['(−)','n','neg'],['.','n','.'],
    ['0','n zero','0']
  ];
  const btn = {};
  layout.forEach(([lab, cls, code, sec])=>{ const k = el('button','k '+cls, (sec?`<small>${sec}</small>`:'')+lab); k.type='button'; k.dataset.code=code; keys.append(k); btn[code]=k; k.addEventListener('click', ()=>press(code)); });
  parent.append(box);
  const fmtC = x => { if(x===undefined||x===null||x==='') return ''; let r = Math.round(x*1e6)/1e6; return String(r).replace('-','⁻'); };
  function stats(){
    const data = S.L[S.opt.data].filter(v=>v!==undefined && v!=='');
    let fr = S.opt.frq===0 ? data.map(()=>1) : S.L[S.opt.frq-1].slice(0, data.length);
    if(fr.length<data.length || fr.some(f=>f===undefined || f<0)) return null;
    const all = expand(data, fr.map(Number));
    if(!all.length) return null;
    const n = all.length, m = mean(all), s2 = sum(all.map(x=>x*x));
    const sx = n>1 ? Math.sqrt(sum(all.map(x=>(x-m)**2))/(n-1)) : 0, sg = Math.sqrt(sum(all.map(x=>(x-m)**2))/n);
    const so = sorted(all), q = a => median(a);
    const lo = so.slice(0, Math.floor(n/2)), hi = so.slice(Math.ceil(n/2));
    return [['n',n],['x̄',m],['Sx',sx],['σx',sg],['Σx',sum(all)],['Σx²',s2],['minX',so[0]],['Q1',n>1?q(lo):so[0]],['Med',median(all)],['Q3',n>1?q(hi):so[0]],['maxX',so[n-1]]];
  }
  function render(){
    const ind = `<div class="ind">${S.second?'2ND':''}</div>`;
    let lines = [];
    if(S.mode==='home'){ lines = ['', '', S.home||'']; }
    else if(S.mode==='data'){
      const top = Math.max(0, S.row-2);
      const head = ' L1    L2    L3';
      lines.push(head);
      for(let r=top; r<top+3; r++){ let ln=''; for(let c=0;c<3;c++){ let v = S.L[c][r]; let t = (v===undefined?(r<=S.L[c].length?'------':''):fmtC(v)).toString().slice(0,5).padEnd(5,' '); if(c===S.col && r===S.row) t = `<span class="cur">${t}</span>`; ln += ' '+t; } lines.push(ln); }
      lines.push(`L${S.col+1}(${S.row+1})=${S.buf}`);
      scr.innerHTML = ind + lines.join('\n'); return;
    }
    else if(S.mode==='menu'){ lines = ['STAT', '1:1-Var Stats', '2:2-Var Stats', '3:StatVars'].map((t,i)=> i===S.menu+1 ? `<span class="cur">${t}</span>` : t); }
    else if(S.mode==='onevar'){
      const dl = ['L1','L2','L3'].map((t,i)=> i===S.opt.data ? `<span class="cur">${t}</span>` : t).join(' ');
      const fl = ['ONE','L1','L2','L3'].map((t,i)=> i===S.opt.frq ? `<span class="cur">${t}</span>` : t).join(' ');
      lines = ['1-Var Stats', (S.optRow===0?'▸':' ')+'DATA: '+dl, (S.optRow===1?'▸':' ')+'FRQ: '+fl, (S.optRow===2?'▸':' ')+(S.optRow===2?'<span class="cur">CALC</span>':'CALC')];
    }
    else if(S.mode==='res'){
      if(!S.res){ lines = ['', 'FOUT: DIM MISMATCH', '(lijsten niet even lang)']; }
      else { lines = ['1-Var:'+['L1','L2','L3'][S.opt.data]+(S.opt.frq?','+['L1','L2','L3'][S.opt.frq-1]:'')];
        for(let i=S.resTop; i<S.resTop+3 && i<S.res.length; i++){ const [nm,val] = S.res[i]; lines.push(`${i+1}:${nm}=${fmtC(val)}`); } }
    }
    scr.innerHTML = ind + lines.join('\n');
  }
  function commit(){ if(S.buf===''||S.buf==='-') return; const v = Number(S.buf.replace('⁻','-')); if(!isNaN(v)){ S.L[S.col][S.row] = v; } S.buf=''; }
  function press(code){
    if(code==='2nd'){ S.second = !S.second; render(); return; }
    const sec = S.second; S.second = false;
    if(code==='data' && sec){ commit(); S.mode='menu'; S.menu=0; render(); return; }
    if(code==='mode' && sec){ commit(); S.mode='home'; render(); return; }
    if(code==='data'){ if(S.mode==='data'){ render(); return; } S.mode='data'; S.buf=''; render(); return; }
    if(code==='clear'){ if(S.mode==='data'){ if(S.buf) S.buf=''; else { S.L[S.col].splice(S.row,1); } } else { S.mode='home'; S.home=''; } render(); return; }
    if(S.mode==='data'){
      if(/^[0-9.]$/.test(code)){ S.buf += code; }
      else if(code==='neg'){ S.buf = S.buf.startsWith('-') ? S.buf.slice(1) : '-'+S.buf; }
      else if(code==='enter' || code==='down'){ commit(); if(S.row < S.L[S.col].length) S.row++; }
      else if(code==='up'){ commit(); if(S.row>0) S.row--; }
      else if(code==='right'){ commit(); if(S.col<2){ S.col++; S.row=Math.min(S.row, S.L[S.col].length); } }
      else if(code==='left'){ commit(); if(S.col>0){ S.col--; S.row=Math.min(S.row, S.L[S.col].length); } }
      else if(code==='delete'){ if(S.buf) S.buf=S.buf.slice(0,-1); else { S.L[S.col].splice(S.row,1); } }
      render(); return;
    }
    if(S.mode==='menu'){
      if(code==='down') S.menu=Math.min(2,S.menu+1); else if(code==='up') S.menu=Math.max(0,S.menu-1);
      else if(code==='1' || (code==='enter' && S.menu===0)){ S.mode='onevar'; S.optRow=0; }
      render(); return;
    }
    if(S.mode==='onevar'){
      if(code==='down') S.optRow=Math.min(2,S.optRow+1); else if(code==='up') S.optRow=Math.max(0,S.optRow-1);
      else if(code==='right'){ if(S.optRow===0) S.opt.data=Math.min(2,S.opt.data+1); if(S.optRow===1) S.opt.frq=Math.min(3,S.opt.frq+1); }
      else if(code==='left'){ if(S.optRow===0) S.opt.data=Math.max(0,S.opt.data-1); if(S.optRow===1) S.opt.frq=Math.max(0,S.opt.frq-1); }
      else if(code==='enter' && S.optRow===2){ S.res = stats(); S.resTop=0; S.mode='res'; }
      else if(code==='enter'){ S.optRow=Math.min(2,S.optRow+1); }
      render(); return;
    }
    if(S.mode==='res'){
      if(code==='down' && S.res) S.resTop=Math.min(S.res.length-3, S.resTop+1); else if(code==='up') S.resTop=Math.max(0,S.resTop-1);
      render(); return;
    }
    render();
  }
  render();
  return { press, btn, S, render, reset(){ S.mode='home'; S.L=[[],[],[]]; S.col=0; S.row=0; S.buf=''; S.opt={data:0,frq:0}; S.second=false; render(); } };
}

/* --- demo: het toestel doet de stappen voor --- */
function calcDemo(b, cfg){
  const wrap = el('div','calc-wrap'); b.append(wrap);
  const C = makeCalc(wrap);
  const box = el('div','steps-box');
  box.innerHTML = `<b>Stappen</b><ol>${cfg.steps.map(s=>`<li>${s.say}</li>`).join('')}</ol>`;
  const bar = el('div','viz-bar'); const play = el('button','btn','▶ Speel af'); play.type='button'; const rs = el('button','btn ghost','↺ Opnieuw'); rs.type='button'; bar.append(play, rs); box.append(bar);
  wrap.append(box);
  const lis = [...box.querySelectorAll('li')];
  let busy = false, stop = false;
  play.addEventListener('click', async ()=>{
    if(busy) return; busy = true; stop = false; C.reset();
    for(let i=0;i<cfg.steps.length && !stop;i++){
      lis.forEach((l,j)=>l.classList.toggle('now', i===j));
      for(const k of cfg.steps[i].keys){ if(stop) break; const bt = C.btn[k]; if(bt) bt.classList.add('hot'); await sleep(380); C.press(k); await sleep(250); if(bt) bt.classList.remove('hot'); }
      await sleep(700);
    }
    busy = false;
  });
  rs.addEventListener('click', ()=>{ stop = true; lis.forEach(l=>l.classList.remove('now')); C.reset(); });
}
const typeList = arr => arr.flatMap(x=>String(x).split('').map(c=>c==='-'?'neg':c).concat(['enter']));

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
    { title:'Kijk hoe het werkt', lvl:1, instr:'20 jongeren gaven hun schoenmaat. Klik op Speel af en volg de toetsen.',
      build:combo(html(ftabHTML(['schoenmaat', ...SCHOEN.vals.map(String)], [['aantal', ...SCHOEN.fr.map(String)]])), b=>calcDemo(b, {steps:[
        {say:`${K('data')}: open de lijsten.`, keys:['data']},
        {say:'Typ de schoenmaten in L1, telkens gevolgd door enter.', keys:typeList(SCHOEN.vals)},
        {say:`${K('▶')}: naar L2. Typ de aantallen (de frequenties).`, keys:['right', ...typeList(SCHOEN.fr)]},
        {say:`${K('2nd','sec')} ${K('data')}: het menu STAT. Kies 1:1-Var Stats.`, keys:['2nd','data','enter']},
        {say:'DATA: L1 laten staan. FRQ: met ▶ naar L2.', keys:['down','right','right']},
        {say:`Naar CALC en ${K('enter')}.`, keys:['down','enter']},
        {say:'Lees af: n = 20 en x̄ = 40,35. Scroll naar beneden voor Med.', keys:['down','down','down','down','down','down']}
      ]})) },
    { title:'Doe het zelf op het toestel', lvl:1, instr:'Gebruik het nagebootste toestel (of je eigen rekentoestel) met dezelfde schoenmaten.',
      build:combo(html(ftabHTML(['schoenmaat', ...SCHOEN.vals.map(String)], [['aantal', ...SCHOEN.fr.map(String)]])), b=>{ const w=el('div','calc-wrap'); b.append(w); makeCalc(w); }, list([
        {html:'n = [[0]]', mode:'numeric', check:exact(20), sol:'1 + 3 + 5 + 1 + 4 + 3 + 2 + 1 = 20 jongeren.'},
        {html:'x̄ = [[0]]', check:exact(40.35), sol:'Het toestel geeft x̄ = 40,35.'},
        {html:'Med = [[0]]', check:exact(40.5), sol:'Het toestel geeft Med = 40,5: het 10de gegeven is 40, het 11de is 41.'},
        {html:'minX = [[0]] en maxX = [[1]], dus de variatiebreedte is [[2]]', size:'sm', check:nums([37,45,8]), sol:'45 − 37 = <b>8</b>.'},
        {html:'De modus (zelf zoeken in de tabel) = [[0]]', mode:'numeric', check:exact(39), sol:'39 heeft de grootste frequentie (5).'}
      ], {letters:true})) },
    { title:'Een lijst zonder frequenties', lvl:2, instr:'Als elk gegeven apart staat, typ je alles in L1 en kies je FRQ: ONE.',
      build:combo(b=>{ const w=el('div','calc-wrap'); b.append(w); makeCalc(w); }, list([
        {html:'Wachttijden in minuten: 12, 7, 15, 9, 7, 20, 11, 8. x̄ = [[0]] · Med = [[1]]', size:'sm', check:nums([11.125, 10]), sol:'Som 89, en 89 : 8 = 11,125. Geordend: 7, 7, 8, 9, 11, 12, 15, 20: (9 + 11) : 2 = 10.'},
        {html:'Punten: 14, 9, 17, 12, 16, 9, 15. x̄ = [[0]] (rond af op 0,01) · Med = [[1]]', size:'sm', check:v=>{ const a=parseLoose(v[0]), c=parseLoose(v[1]); const f=[Math.abs(a-13.14)<0.006, c===14]; return {ok:f.every(Boolean), fields:f}; }, sol:'92 : 7 = 13,142… ≈ 13,14. Geordend: 9, 9, 12, <b>14</b>, 15, 16, 17.'}
      ], {letters:true})) },
    { title:'Wat geeft het toestel niet?', lvl:2, build:choiceList([
        ['Het toestel geeft de modus.', 'n', 'De modus zoek je zelf: het gegeven met de grootste frequentie.'],
        ['De variatiebreedte vind je als maxX − minX.', 'w', 'Het toestel geeft het maximum en het minimum. Het verschil reken je zelf uit.'],
        ['Als je L2 als FRQ kiest, moeten L1 en L2 even lang zijn.', 'w', 'Bij elk gegeven hoort één frequentie. Anders krijg je een foutmelding.'],
        ['n is de som van alle gegevens.', 'n', 'n is het aantal gegevens. De som is Σx.']
      ], WN) },
    { title:'Groot getal, snel klaar', lvl:3, instr:'32 eieren werden gewogen (in g). Gebruik je rekentoestel.',
      build:combo(html(ftabHTML(['massa (g)','48','50','52','54','56','58','60','62'], [['aantal','2','4','5','7','6','4','3','1']])), list([
        {html:'x̄ = [[0]] g · Med = [[1]] g · variatiebreedte = [[2]] g', size:'sm', check:nums([54.5, 54, 14]), sol:'Σx = 1744, n = 32: x̄ = 1744 : 32 = <b>54,5 g</b>. Het 16de en 17de gegeven zijn 54: Me = <b>54 g</b>. 62 − 48 = <b>14 g</b>.'},
        {html:'Hoeveel eieren wegen meer dan het gemiddelde? [[0]]', mode:'numeric', check:exact(14), sol:'Meer dan 54,5 g: 56, 58, 60 en 62 g: 6 + 4 + 3 + 1 = <b>14</b>.'}
      ], {letters:true})) }
  ]});

/* ============================================================
   REKENBLAD: een klein werkend rekenblad (zoals Excel of Google Spreadsheets)
   ============================================================ */
(function(){
  const css = `
  .sheet{ border:2px solid var(--tq); border-radius:.7rem; background:var(--card); overflow:hidden; }
  .sh-bar{ display:flex; flex-wrap:wrap; gap:.35rem; align-items:center; padding:.4rem .5rem; background:var(--tq-soft); border-bottom:1px solid var(--border); }
  .sh-bar .grp{ display:flex; gap:.3rem; align-items:center; padding-right:.5rem; margin-right:.2rem; border-right:1px solid var(--border); }
  .sh-bar .grp:last-child{ border-right:none; }
  .sh-bar .lab{ font-size:.78rem; font-weight:700; color:var(--accent-dark); margin-right:.15rem; }
  .sh-bar button{ font:inherit; font-size:.85rem; padding:.25rem .55rem; border-radius:.45rem; border:1.5px solid var(--tq); background:var(--card); color:var(--ink); cursor:pointer; display:inline-flex; gap:.3rem; align-items:center; }
  .sh-bar button:hover{ border-color:var(--orange); background:var(--or-soft); }
  .sh-bar button svg{ width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; }
  .sh-fx{ display:flex; align-items:center; gap:.4rem; padding:.3rem .5rem; border-bottom:1px solid var(--border); }
  .sh-fx .nm{ width:4.2rem; text-align:center; font-weight:700; border:1.5px solid var(--border); border-radius:.35rem; padding:.15rem; font-variant-numeric:tabular-nums; }
  .sh-fx .fx{ font-style:italic; font-weight:700; color:var(--accent-dark); }
  .sh-fx input{ flex:1; font:inherit; font-family:ui-monospace, Consolas, monospace; font-size:.95rem; padding:.25rem .4rem; border:1.5px solid var(--border); border-radius:.35rem; background:var(--card); color:var(--ink); min-width:0; }
  .sh-fx input:focus{ outline:none; border-color:var(--orange); }
  .sh-grid{ overflow:auto; max-height:460px; position:relative; }
  .sh-grid table{ border-collapse:collapse; font-variant-numeric:tabular-nums; user-select:none; -webkit-user-select:none; }
  .sh-grid th{ background:var(--tq-soft); color:var(--ink-soft); font-weight:700; font-size:.8rem; border:1px solid var(--border); padding:.1rem .3rem; min-width:2rem; position:sticky; top:0; z-index:2; }
  .sh-grid th.rh{ position:sticky; left:0; z-index:1; }
  .sh-grid th.on{ background:var(--or-soft); color:var(--ink); }
  .sh-grid td{ border:1px solid var(--border); padding:0 .35rem; height:1.75rem; min-width:5.6rem; max-width:12rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:.95rem; cursor:cell; position:relative; background:var(--card); }
  .sh-grid td.num{ text-align:right; }
  .sh-grid td.err{ color:var(--bad); font-weight:700; text-align:center; }
  .sh-grid td.sel{ background:var(--tq-soft); }
  .sh-grid td.act{ outline:2.5px solid var(--accent-dark); outline-offset:-2px; }
  .sh-grid td.ref{ background:var(--or-soft); }
  .sh-grid td.given{ font-weight:700; }
  .sh-grid td .handle{ position:absolute; right:-1px; bottom:-1px; width:9px; height:9px; background:var(--accent-dark); border:1.5px solid var(--card); cursor:crosshair; z-index:3; }
  .sh-grid td input{ position:absolute; inset:0; width:100%; height:100%; border:2px solid var(--orange); font:inherit; padding:0 .3rem; background:var(--card); color:var(--ink); box-sizing:border-box; }
  .sh-grid td input:focus{ outline:none; }
  .sh-chart{ border-top:1px solid var(--border); padding:.6rem; }
  .sh-chart .opts{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:.4rem .8rem; margin:.4rem 0; }
  .sh-chart label{ font-size:.82rem; font-weight:700; color:var(--accent-dark); display:flex; flex-direction:column; gap:.15rem; }
  .sh-chart label input{ font:inherit; font-weight:400; padding:.2rem .4rem; border:1.5px solid var(--border); border-radius:.35rem; background:var(--card); color:var(--ink); }
  .sh-msg{ font-size:.85rem; padding:.3rem .6rem; color:var(--ink-soft); min-height:1.4em; }
  .sh-msg.bad{ color:var(--bad); font-weight:700; }
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
const RB_NAMES = {kolom:'Kolom', staaf:'Staaf', lijn:'Lijn', cirkel:'Cirkel', strook:'Strook'};
function makeSheet(parent, opts){
  const nC = opts.cols || 6, nR = opts.rows || 14;
  const st = opts.state; st.c = st.c || {}; st.dec = st.dec || {};
  const given = new Set(opts.given || []);
  const root = el('div','sheet'); parent.append(root);
  const bar = el('div','sh-bar');
  bar.innerHTML = `<span class="grp"><span class="lab">Invoegen grafiek</span>${Object.keys(RB_ICON).map(k=>`<button type="button" data-ch="${k}" title="${RB_NAMES[k]}diagram"><svg viewBox="0 0 24 24">${RB_ICON[k]}</svg>${RB_NAMES[k]}</button>`).join('')}</span>
    <span class="grp"><span class="lab">Decimalen</span><button type="button" data-dec="-1" title="minder decimalen">,0 ←</button><button type="button" data-dec="1" title="meer decimalen">→ ,00</button></span>
    <span class="grp"><button type="button" data-clear="1" title="geselecteerde cellen leegmaken">Wissen</button></span>`;
  const fxRow = el('div','sh-fx', `<span class="nm">A1</span><span class="fx">fx</span><input type="text" spellcheck="false" autocomplete="off" aria-label="formulebalk">`);
  const gridBox = el('div','sh-grid'); const msg = el('div','sh-msg');
  const chartBox = el('div','sh-chart'); chartBox.hidden = true;
  root.append(bar, fxRow, gridBox, msg, chartBox);
  const nameBox = fxRow.querySelector('.nm'), fx = fxRow.querySelector('input');
  let act = {c:0, r:0}, anc = {c:0, r:0}, editing = null, refPick = null;
  const getRaw = ref => st.c[ref];
  let val = makeEval(getRaw);
  const tbl = document.createElement('table'); gridBox.append(tbl);
  let h = '<thead><tr><th class="rh"></th>'; for(let c=0;c<nC;c++) h += `<th data-col="${c}">${colName(c)}</th>`; h += '</tr></thead><tbody>';
  for(let r=0;r<nR;r++){ h += `<tr><th class="rh" data-row="${r}">${r+1}</th>`; for(let c=0;c<nC;c++) h += `<td data-c="${c}" data-r="${r}"></td>`; h += '</tr>'; }
  tbl.innerHTML = h + '</tbody>';
  const tds = {}; tbl.querySelectorAll('td').forEach(td=>tds[refName(+td.dataset.c, +td.dataset.r)] = td);
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
      td.className = (typeof v==='number'?'num ':'') + (isErr(v)?'err ':'') + (given.has(ref)?'given ':'') + (p.c>=s.c0&&p.c<=s.c1&&p.r>=s.r0&&p.r<=s.r1&&(s.c0!==s.c1||s.r0!==s.r1)?'sel ':'') + (p.c===act.c&&p.r===act.r?'act':'');
    });
    tbl.querySelectorAll('th[data-col]').forEach(th=>th.classList.toggle('on', +th.dataset.col>=s.c0 && +th.dataset.col<=s.c1));
    tbl.querySelectorAll('th[data-row]').forEach(th=>th.classList.toggle('on', +th.dataset.row>=s.r0 && +th.dataset.row<=s.r1));
    const a = tds[refName(act.c, act.r)];
    if(!editing){ const hd = el('span','handle'); hd.title='vulgreep: sleep om door te trekken'; tds[refName(s.c1,s.r1)].append(hd); }
    nameBox.textContent = (s.c0!==s.c1||s.r0!==s.r1) ? selRange() : refName(act.c, act.r);
    if(!editing && document.activeElement!==fx) fx.value = st.c[refName(act.c,act.r)] ?? '';
    const av = val(refName(act.c,act.r));
    msg.className = 'sh-msg' + (isErr(av)?' bad':'');
    msg.textContent = isErr(av) ? errExplain(av.err) : '';
    drawChartPanel();
    if(opts.onChange) opts.onChange();
  }
  function errExplain(e){ return ({'#NAAM?':'#NAAM? Excel kent deze functie of naam niet. Controleer de schrijfwijze (bv. SOM, GEMIDDELDE, MEDIAAN, MODUS, AANTAL.ALS).', '#DEEL/0!':'#DEEL/0! Je deelt door 0 (of door een lege cel).', '#WAARDE!':'#WAARDE! Er klopt iets niet in de formule: rekenen met tekst, of een haakje of puntkomma te veel of te weinig.', '#VERW!':'#VERW! De formule verwijst naar zichzelf of naar een cel die niet bestaat.', '#N/B':'#N/B Er is geen modus: geen enkel getal komt meer dan één keer voor.', '#GETAL!':'#GETAL! Er zijn geen getallen om mee te rekenen.'})[e] || e; }
  function setCell(ref, raw){ if(given.has(ref) && opts.lockGiven) return; if(raw===''||raw==null) delete st.c[ref]; else st.c[ref] = raw; opts.save(); }
  function startEdit(initial, keepRaw){
    const ref = refName(act.c, act.r); if(given.has(ref) && opts.lockGiven){ msg.className='sh-msg'; msg.textContent='Deze cel is gegeven en kan je niet wijzigen.'; return; }
    anc = {...act}; editing = {ref}; paint();
    const td = tds[ref]; td.textContent='';
    const inp = document.createElement('input'); inp.type='text'; inp.spellcheck=false; inp.value = keepRaw ? (st.c[ref] ?? '') : (initial ?? '');
    td.append(inp); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
    editing.inp = inp;
    fx.value = inp.value;
    inp.addEventListener('input', ()=>{ fx.value = inp.value; refPick = null; });
    inp.addEventListener('keydown', e=>{
      if(e.key==='Enter'){ e.preventDefault(); commit(); move(0,1); }
      else if(e.key==='Tab'){ e.preventDefault(); commit(); move(1,0); }
      else if(e.key==='Escape'){ e.preventDefault(); cancel(); }
      else if((e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='ArrowLeft'||e.key==='ArrowRight') && !inp.value.startsWith('=')){ e.preventDefault(); commit(); move(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0, e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0); }
    });
  }
  function commit(){ if(!editing) return; const raw = editing.inp.value; const ref = editing.ref; editing = null; refPick = null; setCell(ref, raw.trim()===''?'':raw); paint(); gridBox.focus({preventScroll:true}); }
  function cancel(){ editing = null; refPick = null; paint(); gridBox.focus({preventScroll:true}); }
  function move(dc, dr, extend){ act = {c:Math.max(0,Math.min(nC-1,act.c+dc)), r:Math.max(0,Math.min(nR-1,act.r+dr))}; if(!extend) anc = {...act}; paint(); tds[refName(act.c,act.r)].scrollIntoView({block:'nearest', inline:'nearest'}); }
  gridBox.tabIndex = 0;
  gridBox.addEventListener('keydown', e=>{
    if(editing || e.target!==gridBox) return;
    if(e.key.startsWith('Arrow')){ e.preventDefault(); move(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0, e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0, e.shiftKey); }
    else if(e.key==='Enter'){ e.preventDefault(); move(0,1); }
    else if(e.key==='Tab'){ e.preventDefault(); move(1,0); }
    else if(e.key==='F2'){ e.preventDefault(); startEdit(null, true); }
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
    const b = e.target.closest('button'); if(!b) return;
    if(editing) commit();
    if(b.dataset.ch){ insertChart(b.dataset.ch); }
    else if(b.dataset.dec){ const s=selBox(); for(let r=s.r0;r<=s.r1;r++) for(let c=s.c0;c<=s.c1;c++){ const ref=refName(c,r); const cur = st.dec[ref] ?? 2; st.dec[ref] = Math.max(0, Math.min(6, cur + +b.dataset.dec)); } opts.save(); paint(); }
    else if(b.dataset.clear){ const s=selBox(); for(let r=s.r0;r<=s.r1;r++) for(let c=s.c0;c<=s.c1;c++) setCell(refName(c,r), ''); paint(); }
  });
  /* grafiek */
  function chartData(ch){
    if(!ch) return null;
    const [a,b] = ch.range.split(':'); const p = parseRef(a), q = parseRef(b||a);
    const c0=Math.min(p.c,q.c), c1=Math.max(p.c,q.c), r0=Math.min(p.r,q.r), r1=Math.max(p.r,q.r);
    const isNum = v => typeof v==='number';
    let hasLabels = c1>c0 && !isNum(val(refName(c0, r0+1<=r1?r0+1:r0))) ;
    if(c1>c0 && [...Array(r1-r0+1)].every((_,i)=>isNum(val(refName(c0,r0+i)))) ) hasLabels = (c1-c0>=1) && false;
    /* eerste kolom als labels als ze tekst bevat of als er meer dan één kolom is */
    hasLabels = c1>c0;
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
    if(s.c0===s.c1 && s.r0===s.r1){ msg.className='sh-msg bad'; msg.textContent='Selecteer eerst de cellen met de gegevens (sleep over de tabel), en klik dan op een grafiek.'; return; }
    const old = st.chart || {};
    st.chart = {type, range:selRange(), title:old.title||'', xTitle:old.xTitle||'', yTitle:old.yTitle||'', yMin:old.yMin??''};
    opts.save(); paint();
    chartBox.scrollIntoView({block:'nearest', behavior:'smooth'});
  }
  let panelBuilt = false, chartHolder, tIn, xIn, yIn, mIn, rangeLab;
  function drawChartPanel(){
    const ch = st.chart; chartBox.hidden = !ch; if(!ch) return;
    if(!panelBuilt){
      panelBuilt = true;
      chartBox.innerHTML = `<div class="viz-bar"><b>Grafiek</b> <span class="pill" data-k="rng"></span><button type="button" class="btn ghost" data-k="del">Grafiek verwijderen</button></div>
        <div class="opts"><label>Grafiektitel<input data-k="title"></label><label>Titel horizontale as<input data-k="xTitle"></label><label>Titel verticale as<input data-k="yTitle"></label><label>Verticale as begint bij<input data-k="yMin" inputmode="decimal" placeholder="automatisch"></label></div><div class="viz" data-k="holder"></div>`;
      chartHolder = chartBox.querySelector('[data-k=holder]'); rangeLab = chartBox.querySelector('[data-k=rng]');
      [tIn,xIn,yIn,mIn] = ['title','xTitle','yTitle','yMin'].map(k=>chartBox.querySelector(`input[data-k=${k}]`));
      [tIn,xIn,yIn,mIn].forEach(inp=>inp.addEventListener('input', ()=>{ if(!st.chart) return; st.chart[inp.dataset.k] = inp.value; opts.save(); renderChart(); if(opts.onChange) opts.onChange(); }));
      chartBox.querySelector('[data-k=del]').addEventListener('click', ()=>{ delete st.chart; opts.save(); paint(); });
    }
    if(document.activeElement!==tIn) tIn.value = ch.title||''; if(document.activeElement!==xIn) xIn.value = ch.xTitle||''; if(document.activeElement!==yIn) yIn.value = ch.yTitle||''; if(document.activeElement!==mIn) mIn.value = ch.yMin??'';
    const pie = ch.type==='cirkel'||ch.type==='strook';
    xIn.parentElement.hidden = pie; yIn.parentElement.hidden = pie; mIn.parentElement.hidden = pie;
    rangeLab.textContent = RB_NAMES[ch.type]+'diagram · gegevens '+ch.range;
    renderChart();
  }
  function renderChart(){
    const ch = st.chart; if(!ch || !chartHolder) return;
    const d = chartData(ch); chartHolder.innerHTML='';
    if(!d.series.length || d.series.every(s=>s.values.every(isNaN))){ chartHolder.textContent = 'Er staan geen getallen in de geselecteerde cellen.'; return; }
    const ym = String(ch.yMin).trim()==='' ? null : parseLoose(ch.yMin);
    chartHolder.append(drawChart(ch.type, {labels:d.labels, series:d.series.map(s=>({name:s.name, values:s.values.map(v=>isNaN(v)?0:v)})), title:ch.title, xTitle:ch.xTitle, yTitle:ch.yTitle, yMin: (ym==null||isNaN(ym))?0:ym, values:ch.type!=='lijn', anim:false}));
  }
  paint();
  return {
    val: ref => makeEval(getRaw)(ref.toUpperCase()), raw: ref => st.c[ref.toUpperCase()] ?? '', chart: () => st.chart || null, chartData: () => chartData(st.chart),
    lock(){ root.style.pointerEvents='none'; root.style.opacity='.9'; }, paint
  };
}

/* ---------- een opdracht in het rekenblad, met een checklist ---------- */
const fIs = (r, ...fns) => sh => { const raw = String(sh.raw(r)).toUpperCase(); return raw.startsWith('=') && fns.some(f=>raw.includes(f.toUpperCase()+'(') || raw.includes((Object.keys(FN_ALIAS).find(k=>FN_ALIAS[k]===f.toUpperCase())||'#')+'(')); };
const vIs = (r, t, tol=1e-6) => sh => { const v = sh.val(r); return typeof v==='number' && Math.abs(v-t)<=tol; };
const tIs = (r, ...ts) => sh => ts.some(t=>String(sh.val(r)).trim().toLowerCase()===t.toLowerCase());
const isF = r => sh => String(sh.raw(r)).startsWith('=');
const allOf = (...fs) => sh => fs.every(f=>f(sh));
const chartIs = (types, test) => sh => { const ch = sh.chart(); if(!ch || !types.includes(ch.type)) return false; return test ? test(ch, sh.chartData()) : true; };
const sameArr = (a, b, tol=1e-6) => a.length===b.length && a.every((x,i)=> typeof x==='number' ? Math.abs(x-b[i])<=tol : String(x).trim().toLowerCase()===String(b[i]).trim().toLowerCase());

function sheetTask(b, st, save, key, task){
  if(!st.c){ st.c = Object.assign({}, task.init||{}); st.dec = Object.assign({}, task.dec||{}); if(task.chart) st.chart = Object.assign({}, task.chart); }
  const two = el('div'); b.append(two);
  const quiz = QZ; const qid = QID('rb'); if(!quiz && task.checks) CLvraag(qid);
  let ul, fb;
  const sh = makeSheet(two, {state:st, save, cols:task.cols, rows:task.rows, given:Object.keys(task.init||{}), lockGiven:task.lockGiven!==false, onChange:()=>{ if(ul && !quiz) mark(false); }});
  if(!task.checks) return;
  ul = el('ul','checklist'); b.append(ul);
  const act = el('div','q-act'); const btn = el('button','btn','Controleer'); btn.type='button'; act.append(btn); fb = el('div','fb'); b.append(act, fb);
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
const CHEAT_RB = `<h3>Spiekbriefje · rekenblad (Excel, Google Spreadsheets)</h3><table>
<tr><td>cel</td><td>Een vakje, genoemd naar kolom en rij: B3 is kolom B, rij 3. Een bereik: B2:B9 (van B2 tot en met B9).</td></tr>
<tr><td>formule</td><td>Begint altijd met <span class="formula">=</span>. Bv. <span class="formula">=B2*4</span> of <span class="formula">=B2/B7*100</span>. Tik op een cel om ze in je formule te zetten.</td></tr>
<tr><td>functies</td><td><span class="formula">=SOM(B2:B9)</span> · <span class="formula">=GEMIDDELDE(B2:B9)</span> · <span class="formula">=MEDIAAN(B2:B9)</span> · <span class="formula">=MODUS(B2:B9)</span> · <span class="formula">=MAX(...)</span> · <span class="formula">=MIN(...)</span> · <span class="formula">=AANTAL(...)</span></td></tr>
<tr><td>tellen</td><td><span class="formula">=AANTAL.ALS(B2:F6;"blauw")</span> telt hoeveel keer "blauw" in het bereik staat.</td></tr>
<tr><td>doortrekken</td><td>Sleep het blokje rechtsonder (de vulgreep) naar beneden: de formule past zich aan (B2 wordt B3, B4 ...). Een $ houdt een verwijzing vast: <span class="formula">$B$9</span>.</td></tr>
<tr><td>grafiek</td><td>Selecteer de tabel (met de titels erbij) en kies een grafiek. In Excel heet een staafdiagram met rechtopstaande staven een <b>kolomdiagram</b>.</td></tr></table>`;
const KLEUREN25 = ['blauw','rood','groen','blauw','zwart','geel','blauw','blauw','groen','rood','zwart','blauw','groen','blauw','geel','rood','blauw','zwart','groen','blauw','rood','blauw','groen','zwart','blauw'];
const kleurInit = () => { const o = {}; KLEUREN25.forEach((k,i)=>{ o[refName(1+i%5, Math.floor(i/5))] = k; }); return o; };
SECTIONS.push({ id:'rekenblad', ic:'rekenblad', nav:'Rekenblad: formules', title:'Werken in een rekenblad', cheat:CHEAT_RB,
  tip:'Dit rekenblad werkt zoals Excel of Google Spreadsheets. Klik op een cel en typ. Een formule begint met =. Druk op Enter om te bevestigen. Dubbelklik om een cel te wijzigen.',
  cards:[
    { title:'Kennismaken: cellen en formules', lvl:1, instr:'Voer de drie opdrachten uit in het rekenblad hieronder.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:5, rows:8, init:{A1:'artikel', B1:'prijs (€)', A2:'pen', B2:'2,5', A3:'schrift', B3:'3', A4:'lat', B4:'1,5'},
        checks:[
          {say:'Typ in cel A5 het woord <b>gom</b> en in B5 de prijs <b>1,2</b>.', test:allOf(tIs('A5','gom'), vIs('B5',1.2)), hint:'Klik op A5, typ gom en druk Enter. Doe hetzelfde in B5 (met een komma).'},
          {say:'Bereken in C2 de prijs van 4 pennen met de formule <span class="formula">=B2*4</span>.', test:allOf(isF('C2'), vIs('C2',10)), hint:'Typ in C2: =B2*4 en druk Enter. Een formule begint altijd met =.'},
          {say:'Bereken in B6 de totale prijs van de vijf artikels met een formule.', test:allOf(isF('B6'), vIs('B6',9.7)), hint:'Bv. =B2+B3+B4+B5 of =SOM(B2:B5).'}
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
        ], why:'Gebruik de knop "→ ,00" om het gemiddelde netjes op twee decimalen te tonen.' }) },
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
  tip:'Selecteer de tabel door erover te slepen, met de titels in de eerste rij. Klik dan bij Invoegen grafiek op het soort diagram. Geef je grafiek altijd een titel.',
  cards:[
    { title:'Een staafdiagram (kolomdiagram)', lvl:1, instr:'Schoenmaten in een klas. Maak er een staafdiagram van.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:10, init:{A1:'schoenmaat', B1:'aantal', A2:'36', B2:'2', A3:'37', B3:'4', A4:'38', B4:'6', A5:'39', B5:'5', A6:'40', B6:'3', A7:'41', B7:'2', A8:'42', B8:'1'},
        checks:[
          {say:'Selecteer A1:B8 en klik op <b>Kolom</b>.', test:chartIs(['kolom','staaf'], (ch,d)=>sameArr(d.labels,['36','37','38','39','40','41','42']) && d.series.length===1 && sameArr(d.series[0].values,[2,4,6,5,3,2,1])), hint:'Sleep van A1 tot B8 zodat beide kolommen geselecteerd zijn, en klik dan op Kolom.'},
          {say:'Geef de grafiek een titel.', test:sh=>!!(sh.chart()&&String(sh.chart().title).trim().length>2), hint:'Typ een titel in het vak Grafiektitel, bv. Schoenmaten in de klas.'},
          {say:'Geef de horizontale as de titel <b>schoenmaat</b> en de verticale as de titel <b>aantal leerlingen</b>.', test:sh=>{ const c=sh.chart(); return !!c && /schoen/i.test(c.xTitle) && /aantal/i.test(c.yTitle); }, hint:'Vul de titels van de assen in onder de grafiek.'}
        ], why:'Een goede grafiek heeft een titel en astitels: zo weet de lezer wat hij ziet.' }) },
    { title:'Percentages en een cirkeldiagram', lvl:2, instr:'Hoe komen 40 leerlingen naar school? Bereken de percentages en maak een cirkeldiagram.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:9, init:{A1:'vervoer', B1:'aantal', C1:'percentage', A2:'fiets', B2:'18', A3:'te voet', B3:'6', A4:'bus', B4:'10', A5:'auto', B5:'6', A6:'totaal'},
        checks:[
          {say:'B6: het totaal met SOM', test:allOf(fIs('B6','SOM'), vIs('B6',40)), hint:'=SOM(B2:B5)'},
          {say:'C2 tot C5: het percentage met een formule (bv. <span class="formula">=B2/$B$6*100</span>, doorgetrokken)', test:allOf(isF('C2'), isF('C5'), vIs('C2',45), vIs('C3',15), vIs('C4',25), vIs('C5',15)), hint:'=B2/$B$6*100: de $-tekens houden B6 vast als je doortrekt. Of typ in elke cel de formule zelf.'},
          {say:'Selecteer A1:B5 en voeg een <b>cirkeldiagram</b> in met een titel.', test:sh=>chartIs(['cirkel'], (ch,d)=>sameArr(d.labels,['fiets','te voet','bus','auto']) && sameArr(d.series[0].values,[18,6,10,6]))(sh) && String(sh.chart().title).trim().length>2, hint:'Selecteer enkel A1:B5 (zonder de rij totaal!) en klik op Cirkel. Vul een titel in.'}
        ], why:'Zonder de rij totaal: anders zou "totaal" de helft van de cirkel innemen!' }) },
    { title:'Een lijndiagram', lvl:2, instr:'De temperatuur van Lieve, die koorts heeft, werd elk uur gemeten.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:9, init:{A1:'tijdstip', B1:'temperatuur (°C)', A2:'16 u', B2:'37,2', A3:'17 u', B3:'38,4', A4:'18 u', B4:'39,1', A5:'19 u', B5:'38,9', A6:'20 u', B6:'38,3', A7:'21 u', B7:'37,8'},
        checks:[
          {say:'Maak een <b>lijndiagram</b> van A1:B7.', test:chartIs(['lijn'], (ch,d)=>d.labels.length===6 && sameArr(d.series[0].values,[37.2,38.4,39.1,38.9,38.3,37.8])), hint:'Selecteer A1:B7 en klik op Lijn.'},
          {say:'Titel: <b>Koorts van Lieve</b>, verticale as: <b>temperatuur (°C)</b>.', test:sh=>{ const c=sh.chart(); return !!c && /koorts/i.test(c.title) && /temp/i.test(c.yTitle); }, hint:'Vul de grafiektitel en de titel van de verticale as in.'},
          {say:'Laat de verticale as beginnen bij <b>36</b>, zodat je het verloop goed ziet.', test:sh=>{ const c=sh.chart(); return !!c && parseLoose(c.yMin)===36; }, hint:'Vul 36 in bij "Verticale as begint bij".'}
        ], why:'Bij een lijndiagram over temperatuur mag de as bij 36 beginnen: je wil het verloop zien, niet de staven vergelijken. Bij een staafdiagram doe je dat nooit!' }) },
    { title:'Twee groepen in één grafiek', lvl:2, instr:'Favoriete kleur van jongens en meisjes.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:5, rows:8, init:{A1:'kleur', B1:'meisjes', C1:'jongens', A2:'zwart', B2:'9', C2:'14', A3:'blauw', B3:'21', C3:'18', A4:'groen', B4:'6', C4:'10', A5:'rood', B5:'8', C5:'7', A6:'paars', B6:'12', C6:'2'},
        checks:[
          {say:'Maak een kolomdiagram van A1:C6: twee kleuren staven, met een legende.', test:chartIs(['kolom','staaf'], (ch,d)=>d.series.length===2 && sameArr(d.series[1].values,[14,18,10,7,2])), hint:'Selecteer de hele tabel, van A1 tot C6, en klik op Kolom.'},
          {say:'D1: typ <b>totaal</b> en bereken in D2 tot D6 het totaal per kleur met een formule.', test:allOf(tIs('D1','totaal'), isF('D2'), isF('D6'), vIs('D2',23), vIs('D3',39), vIs('D4',16), vIs('D5',15), vIs('D6',14)), hint:'=B2+C2 of =SOM(B2:C2), en trek door.'},
          {say:'Geef de grafiek een titel.', test:sh=>!!(sh.chart()&&String(sh.chart().title).trim().length>2), hint:'Vul een grafiektitel in.'}
        ], why:'Met twee reeksen in één staafdiagram kan je jongens en meisjes per kleur vergelijken.' }) },
    { title:'Maak de grafiek eerlijk', lvl:2, instr:'Iemand maakte deze misleidende grafiek over de lonen in drie bedrijven. Maak ze eerlijk.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:6, init:{A1:'bedrijf', B1:'jaarloon (€)', A2:'A', B2:'41000', A3:'B', B3:'42000', A4:'C', B4:'41500'}, chart:{type:'kolom', range:'A1:B4', title:'Jaarloon', xTitle:'', yTitle:'', yMin:'40800'},
        checks:[
          {say:'De grafiek blijft een kolomdiagram van A1:B4.', test:chartIs(['kolom','staaf'], (ch,d)=>sameArr(d.series[0].values,[41000,42000,41500])), hint:'Verwijder de grafiek niet. Of maak ze opnieuw: selecteer A1:B4 en klik op Kolom.'},
          {say:'De verticale as begint bij 0.', test:sh=>{ const c=sh.chart(); return !!c && (String(c.yMin).trim()==='' || parseLoose(c.yMin)===0); }, hint:'Maak het vak "Verticale as begint bij" leeg of typ 0.'},
          {say:'Bereken in C3 hoeveel procent bedrijf B meer betaalt dan bedrijf A (rond niet af).', test:allOf(isF('C3'), vIs('C3', 1000/41000*100, 1e-4)), hint:'=(B3-B2)/B2*100'}
        ], why:'Met de as vanaf 0 zie je dat de lonen bijna even hoog zijn: B betaalt maar 2,4 % meer dan A.' }) },
    { title:'Schoolreis', lvl:3, instr:'270 leerlingen kozen een bestemming: 54 kozen de zoo, een derde koos het pretpark, 30 % koos het museum en de rest koos de kust. Werk alles uit met formules.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:4, rows:8, init:{A1:'bestemming', B1:'aantal', A2:'zoo', A3:'pretpark', A4:'museum', A5:'kust', A6:'totaal', B6:'270'},
        checks:[
          {say:'B2 tot B4: de aantallen (B3 en B4 met een formule die B6 gebruikt)', test:allOf(vIs('B2',54), isF('B3'), isF('B4'), vIs('B3',90), vIs('B4',81)), hint:'B3: =B6/3 · B4: =B6*30/100'},
          {say:'B5: de rest, met een formule', test:allOf(isF('B5'), vIs('B5',45)), hint:'=B6-B2-B3-B4 of =B6-SOM(B2:B4)'},
          {say:'Een cirkeldiagram van A1:B5 met een titel', test:sh=>chartIs(['cirkel'], (ch,d)=>sameArr(d.series[0].values,[54,90,81,45]))(sh) && String(sh.chart().title).trim().length>2, hint:'Selecteer A1:B5 (zonder totaal) en klik op Cirkel.'}
        ] }) },
    { title:'Vrij rekenblad', lvl:2, instr:'Een leeg rekenblad om zelf te oefenen. Je kan ook gegevens plakken (bv. uit een Google Formulier): klik op een cel en plak. Dit telt niet mee.',
      build:(b,st,save,key)=>sheetTask(b,st,save,key,{ cols:8, rows:30, init:{} }) }
  ]});
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
    const key = sec.id + '_' + ci;
    const c = el('div','card');
    const ch = el('div','card-head', `<h3>${card.title}${card.lvl?LVL[card.lvl]:''}</h3>`);
    const rb = el('button','refresh-btn','↺ Opnieuw beginnen'); rb.type='button';
    ch.append(rb); c.append(ch);
    if(card.instr) c.append(el('p','instructions', card.instr));
    const body = el('div'); c.append(body); (card.lvl===3 ? panes.c : panes.b).append(c);
    renderers[key] = ()=>{ body.innerHTML = ''; clearSel(); const st = load(key); const save = ()=>store(key, st); CURKEY = key;
      try{ card.build(body, st, save, key); }catch(err){ console.error(err); body.append(el('p','fb bad','Er liep iets mis bij deze oefening. Klik op “Opnieuw beginnen”.')); } };
    rb.addEventListener('click', ()=>{ wipe(key); renderers[key](); });
    renderers[key]();
  });
  app.append(s); secEls[sec.id] = s;
});

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
