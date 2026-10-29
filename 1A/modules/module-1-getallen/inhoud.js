/* ============================================================
   HULPFUNCTIES
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
let CURKEY = ''; /* sleutel van de kaart die nu opgebouwd wordt: elk vraag-id begint met onderdeel-id + '_' (nodig voor het dashboard) */
const QID = id => (CURKEY && !String(id).startsWith(CURKEY + '_')) ? CURKEY + '_' + id : String(id);
const PREFIX = 'm1_herh_v2_';
let QZ = null; /* verzamelt beoordelaars tijdens het opbouwen van een proeftoetsvraag */
function load(k){ try{ const r = localStorage.getItem(PREFIX+k); if(r){ const p = JSON.parse(r); if(p && typeof p === 'object') return p; } }catch(e){} return {}; }
function store(k,v){ try{ localStorage.setItem(PREFIX+k, JSON.stringify(v)); }catch(e){} }
function wipe(k){ try{ localStorage.removeItem(PREFIX+k); }catch(e){} }
function shuffle(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
const gcd = (a,b)=> b ? gcd(b, a%b) : Math.abs(a);
const lcm = (a,b)=> a/gcd(a,b)*b;
const isPrime = n => { if(n<2) return false; for(let i=2;i*i<=n;i++) if(n%i===0) return false; return true; };
const divisors = n => { const r=[]; for(let i=1;i<=n;i++) if(n%i===0) r.push(i); return r; };
function fr(n,d){ return `<span class="fr"><span class="fn">${n}</span><span class="fd">${d}</span></span>`; }
const FIN = (i,j) => `<span class="fr fr-in"><span class="fn">[[${i}:sm]]</span><span class="fd">[[${j}:sm]]</span></span>`;
const BR = inner => `<span class="brace">{</span>${inner}<span class="brace">}</span>`;
function fmt(s){ return String(s).replace(/(-|−)?(\d+)\/(\d+)/g,(m,sg,n,d)=>(sg?'−':'')+fr(n,d)).replace(/(^|[\s(])-/g,'$1−'); }
const nrm = s => String(s).replace(/\s+/g,'').replace(/[−–]/g,'-');
function parseNum(s){ const t = nrm(s).replace(',', '.'); if(!/^-?\d+(\.\d+)?$/.test(t)) return NaN; return Number(t); }
const showNum = x => String(x).replace('.',',').replace('-','−');
const setTxt = arr => '{' + arr.join(', ').replace(/-/g,'−') + '}';

/* ---------- controles ---------- */
const numIs = t => v => { const x=parseNum(v[0]); if(isNaN(x)) return {ok:false, msg:'Typ enkel een getal.'}; return {ok:Math.abs(x-t)<1e-9}; };
const fracExact = (n,d) => v => ({ok: parseNum(v[0])===n && parseNum(v[1])===d});
const fracValue = (N,D, needSimple=true) => v => {
  const n=parseNum(v[0]), d=parseNum(v[1]);
  if(isNaN(n)||isNaN(d)) return {ok:false, msg:'Vul teller en noemer in met een getal.'};
  if(d===0) return {ok:false, msg:'De noemer kan nooit 0 zijn.'};
  if(n*D!==N*d) return {ok:false};
  if(needSimple && gcd(n,d)!==1) return {ok:false, info:true, msg:'Juist berekend, maar vereenvoudig nog.'};
  return {ok:true};
};
function parseSet(v){ const s=String(v).replace(/[−–]/g,'-'); return { nums:(s.match(/-?\d+/g)||[]).map(Number), ell:/\.\.\.|…/.test(s) }; }
const setIs = expected => v => {
  const {nums} = parseSet(v[0]);
  if(!nums.length) return {ok:false, msg:'Noteer de elementen, gescheiden door komma’s.'};
  const a=[...new Set(nums)].sort((x,y)=>x-y), b=[...expected].sort((x,y)=>x-y);
  if(a.length===b.length && a.every((x,i)=>x===b[i])) return {ok:true};
  const missing=b.filter(x=>!a.includes(x)), extra=a.filter(x=>!b.includes(x));
  let msg=''; if(extra.length) msg += `${extra.join(', ').replace(/-/g,'−')} hoort er niet bij. `;
  if(missing.length) msg += `Er ${missing.length===1?'ontbreekt nog 1 element':'ontbreken nog '+missing.length+' elementen'}.`;
  return {ok:false, msg};
};
const infSetIs = seq => v => {
  const {nums, ell} = parseSet(v[0]);
  if(nums.length<3) return {ok:false, msg:'Noteer minstens de eerste drie elementen.'};
  for(let i=0;i<nums.length;i++) if(nums[i]!==seq(i)) return {ok:false, msg:`Kijk nog eens naar het ${i+1}e element.`};
  if(!ell) return {ok:false, info:true, msg:'De elementen kloppen, maar deze verzameling is oneindig: sluit af met drie puntjes (…).'};
  return {ok:true};
};
const digitsIs = expected => v => {
  if(/\d\d/.test(String(v[0]))) return {ok:false, msg:'x is één cijfer. Scheid je oplossingen met komma’s.'};
  return setIs(expected)(v);
};
function factorize(n){ const f=[]; let m=n; for(let p=2;m>1;p++){ while(m%p===0){ f.push(p); m/=p; } } return f; }
const SUP = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
/* priemfactoren als herhaald product (2 · 2 · 3 · 5): machten kennen de leerlingen nog niet */
function powerForm(n){ return factorize(n).join(' · '); }
const factorIs = n => v => {
  let s = nrm(v[0]); if(s.includes('=')) s = s.split('=').pop();
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m=>'^'+m.split('').map(ch=>Object.keys(SUP).find(k=>SUP[k]===ch)).join(''));
  const parts = s.toLowerCase().split(/[.·×*x•∙]/).filter(Boolean);
  if(!parts.length) return {ok:false};
  let prod=1, allPrime=true;
  for(const p of parts){ const m=p.match(/^(\d+)(?:\^(\d+))?$/); if(!m) return {ok:false, msg:'Schrijf je antwoord als product van priemgetallen, met een punt tussen de factoren.'}; const b=+m[1], e=m[2]?+m[2]:1; if(!isPrime(b)) allPrime=false; prod*=Math.pow(b,e); }
  if(prod!==n) return {ok:false, msg:`Jouw product is ${prod}, niet ${n}.`};
  if(!allPrime) return {ok:false, info:true, msg:'Het product klopt, maar niet alle factoren zijn priemgetallen. Ontbind verder.'};
  if(parts.length===1 && !parts[0].includes('^')) return {ok:false, msg:'Noteer als product.'};
  return {ok:true};
};

/* ---------- iconen ---------- */
const T = (s, size=9, y=15.5) => `<text x="12" y="${y}" text-anchor="middle" font-size="${size}">${s}</text>`;
const ICONS = {
  roos:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',
  getallen:'<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/>'+T('123',8.5,15),
  positie:'<path d="M4 8.5h14l-3.2-3.2M20 15.5H6l3.2 3.2"/>',
  benaming:'<path d="M3.5 12.5V4h8.5l9 9-8 8z"/><circle cx="8" cy="8.5" r="1.5"/>',
  deling:'<path d="M5 12h14"/><circle cx="12" cy="6.5" r="1.5" fill="currentColor"/><circle cx="12" cy="17.5" r="1.5" fill="currentColor"/>',
  element:T('∈',17,18),
  opsomming:T('{ }',14,17),
  venn:'<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/><circle cx="6.5" cy="12" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><circle cx="17.5" cy="12" r=".9" fill="currentColor"/>',
  kleuren:'<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/><path d="M12 6.8A6 6 0 0 1 12 17.2A6 6 0 0 1 12 6.8Z" fill="currentColor"/>',
  uitspraken:'<path d="M3.5 12.5l3 3 5-6.5"/><path d="M14.5 8.5l6 6M20.5 8.5l-6 6"/>',
  cijfer:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9l6 6M15 9l-6 6"/>',
  priem:'<path d="M10 3.5v17M10 7.5h7M10 12h7M10 16.5h7"/>',
  ggdkgv:'<path d="M3 8h18M3 16h12"/><path d="M3 5.5v5M9 5.5v5M15 5.5v5M21 5.5v5M3 13.5v5M9 13.5v5M15 13.5v5"/>',
  vraag:'<path d="M4 4.5h16v11.5H10l-6 4.5z"/>'+T('?',9,13.8),
  breukvorm:'<path d="M3 12h6M15 12h6M10.8 10.5h2.4M10.8 13.5h2.4"/><circle cx="6" cy="8" r="1.2" fill="currentColor"/><circle cx="6" cy="16" r="1.2" fill="currentColor"/><circle cx="18" cy="8" r="1.2" fill="currentColor"/><circle cx="18" cy="16" r="1.2" fill="currentColor"/>',
  breuken:'<path d="M3 12h7"/><circle cx="6.5" cy="7.8" r="1.4" fill="currentColor"/><circle cx="6.5" cy="16.2" r="1.4" fill="currentColor"/><path d="M14 12h7M17.5 8.5v7"/>',
  impl:'<path d="M3 9.5h13M3 14.5h13M13.5 6l6 6-6 6"/>',
  raadsel:'<path d="M4 8.5h4.2a2.3 2.3 0 1 1 4.6 0H17v4.2a2.3 2.3 0 1 1 0 4.6v3.2H4z"/>',
  fout:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3l5 5"/><path d="M8.3 8.3l4.4 4.4M12.7 8.3l-4.4 4.4"/>',
  toets:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3.2H9zM8.5 12l2 2 4.5-4.5M8.5 17.5h7"/>',
  cheat:'<path d="M5.5 3h9l4 4v14h-13z"/><path d="M14.5 3v4h4M8.5 11h7M8.5 14.5h7M8.5 18h4"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'
};
ICONS.bewerk = '<path d="M4 7.5h6M7 4.5v6M14 7.5h6M5 15l4 4M9 15l-4 4M14 17h6"/><circle cx="17" cy="14.3" r=".8"/><circle cx="17" cy="19.7" r=".8"/>';
const icon = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;

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
  if(q.hint && !quiz) hintBox(row, act, s, save, id, q.hint);

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

/* ============================================================
   INVULBARE HINTS (afspraak: elke basisoefening met meer dan één stap krijgt een hint
   met invulvakjes voor de tussenstappen, eventueel met "Meer uitleg"; niet in verdieping)
   Gebruik in een vraag: hint:{ stappen:['12 + 18 = [[0]]', ...], ans:[30, ...], extra:'uitleg', titel:'...', sets:[[1,2,3]] }
   sets: groepen vakjes waarvan de volgorde niet uitmaakt. Een stap zonder vakjes is een tussentitel of uitleg.
   De hint telt niet mee in het dashboard en verschijnt niet in een proeftoets.
   ============================================================ */
(function(){
  const css = `
  .q-act .hint-knop{ border-style:dashed; }
  .q-act .hint-knop.on{ border-style:solid; border-color:var(--orange); background:var(--or-soft); }
  .hintbox{ margin:.5rem 0 .3rem; padding:.7rem .9rem; border:2px dashed var(--or-line); border-radius:12px; background:var(--or-soft); }
  .hintbox h4{ margin:0 0 .35rem; font-size:.98rem; }
  /* stappen genummerd; een tussentitel (Manier 1, Manier 2) begint opnieuw bij 1, een uitleg telt niet mee */
  .hintbox ol{ margin:.2rem 0 .5rem; padding:0; list-style:none; display:grid; gap:.45rem; }
  .hintbox li{ line-height:1.9; }
  .hintbox li.hb-stap{ padding-left:1.6rem; position:relative; }
  .hintbox .hb-nr{ position:absolute; left:0; font-weight:700; }
  .hintbox li.hb-kop{ font-weight:800; color:var(--accent-dark); margin-top:.3rem; }
  .hintbox li.hb-uitleg{ line-height:1.5; }
  .hintbox .inp{ min-width:3.2rem; width:4.2rem; margin:0 .25rem; }
  .hintbox .ladder{ margin:.3rem 0 .2rem; }
  .hintbox .ladder td{ padding:.15rem .5rem; }
  .hintbox .ladder .inp{ margin:0; width:3.6rem; }
  .hintbox .hb-bar{ display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; }
  .hintbox .hb-extra{ margin-top:.5rem; padding:.55rem .75rem; border-left:4px solid var(--accent); background:var(--card); border-radius:8px; line-height:1.55; }
  .hintbox .hb-extra p{ margin:.3rem 0; }
  .hintbox .fb{ margin-top:.35rem; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
})();

/* vergelijk één hintvakje met het verwachte antwoord (getal, woord of lijst van mogelijkheden) */
function hintJuist(v, a){
  if(Array.isArray(a)) return a.some(x=>hintJuist(v, x));
  if(typeof a === 'number'){ const x = parseNum(v); return !isNaN(x) && Math.abs(x - a) < 1e-9; }
  return String(v).trim().toLowerCase().replace(/\s+/g,' ') === String(a).toLowerCase();
}

function hintBox(row, act, s, save, id, h){
  const hs = s.h || (s.h = {v:[]});
  const knop = el('button','btn ghost hint-knop','💡 Hint'); knop.type = 'button'; act.append(knop);
  const box = el('div','hintbox'); box.hidden = true;
  box.append(el('h4','', '💡 ' + (h.titel || 'Hint: vul de tussenstappen in')));
  const ol = el('ol'); box.append(ol);
  let nr = 0;
  h.stappen.forEach(st=>{ const t = typeof st === 'string' ? st : st.t;
    if(st.kop){ nr = 0; ol.append(el('li','hb-kop', t)); return; }
    if(st.uitleg){ ol.append(el('li','hb-uitleg', fillInputs(t, id+'-h', 'xs', 'numeric'))); return; }
    ol.append(el('li','hb-stap', `<span class="hb-nr">${++nr}.</span>` + fillInputs(t, id+'-h', 'xs', 'numeric'))); });
  const bar = el('div','hb-bar'); box.append(bar);
  const ctl = el('button','btn ghost','Controleer de hint'); ctl.type = 'button'; bar.append(ctl);
  let extra = null;
  if(h.extra){ const xk = el('button','btn ghost','🔍 Meer uitleg'); xk.type = 'button'; bar.append(xk);
    extra = el('div','hb-extra', h.extra); extra.hidden = !hs.x; box.append(extra);
    xk.addEventListener('click', ()=>{ extra.hidden = !extra.hidden; hs.x = !extra.hidden; save(); }); }
  const fb = el('div','fb'); box.append(fb);
  row.append(box);
  const inps = [...box.querySelectorAll('.inp')].sort((a,b)=>a.dataset.f-b.dataset.f);
  inps.forEach((inp,i)=>{ if(typeof h.ans[i] === 'string' || (Array.isArray(h.ans[i]) && typeof h.ans[i][0] === 'string')) inp.inputMode = 'text'; });
  inps.forEach((inp,i)=>{ if(hs.v[i]!=null) inp.value = hs.v[i];
    inp.addEventListener('input', ()=>{ hs.v[i] = inp.value; save(); inp.classList.remove('ok','bad'); });
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); controle(); } }); });
  function oordeel(vals){
    const ok = vals.map((v,i)=>v==='' ? null : hintJuist(v, h.ans[i]));
    (h.sets||[]).forEach(g=>{ const nodig = g.map(i=>h.ans[i]), gezien = [];
      g.forEach(i=>{ if(vals[i]==='') return; const x = parseNum(vals[i]); const hit = nodig.some(a=>hintJuist(vals[i], a)) && !gezien.includes(x); ok[i] = hit; if(hit) gezien.push(x); }); });
    return ok;
  }
  function controle(){
    const vals = inps.map(i=>i.value.trim());
    if(vals.every(v=>v==='')){ fb.className = 'fb info'; fb.textContent = 'Vul eerst de vakjes van de hint in.'; return; }
    const ok = oordeel(vals); let goed = 0;
    inps.forEach((inp,i)=>{ inp.classList.remove('ok','bad'); if(ok[i]==null) return; inp.classList.add(ok[i]?'ok':'bad'); if(ok[i]) goed++; });
    const leeg = vals.filter(v=>v==='').length;
    if(goed === inps.length){ fb.className = 'fb ok'; fb.innerHTML = '✅ Alle tussenstappen kloppen. Gebruik ze nu voor je antwoord.'; }
    else { fb.className = 'fb bad'; fb.innerHTML = (goed < inps.length - leeg ? 'De rode vakjes kloppen nog niet. ' : '') + (leeg ? 'Vul ook de lege vakjes in.' : '') + (h.extra && extra.hidden ? ' Kijk eens bij 🔍 Meer uitleg.' : ''); }
  }
  ctl.addEventListener('click', controle);
  const open = o => { box.hidden = !o; knop.classList.toggle('on', o); knop.textContent = o ? '💡 Verberg hint' : '💡 Hint'; };
  open(!!hs.o);
  knop.addEventListener('click', ()=>{ hs.o = box.hidden; save(); open(hs.o); });
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

function posDrag(b, st, save, key, cfg){
  const pool = el('div','pool');
  const stage = el('div','stage '+cfg.cls, cfg.html);
  const fb = el('div','feedback');
  b.append(pool, stage, fb);
  const pos = st.pos || (st.pos = {});
  const quiz = QZ; const qid = QID('plaats'); if(!quiz) CLvraag(qid);
  function toPool(chip){ resetChipStyle(chip); chip.classList.remove('chip-ok','chip-bad'); pool.append(chip); delete pos[chip.dataset.id]; save(); }
  function toStage(chip, nx, ny, silent){
    nx = Math.min(.96, Math.max(.04, nx)); ny = Math.min(.95, Math.max(.05, ny));
    const it = cfg.items.find(i=>i.id===chip.dataset.id);
    const z = cfg.zoneAt(nx, ny);
    if(!z){ toPool(chip); return; }
    chip.style.position='absolute'; chip.style.left=(nx*100)+'%'; chip.style.top=(ny*100)+'%'; chip.style.transform='translate(-50%,-50%)';
    stage.append(chip);
    const ok = z === it.zone;
    pos[it.id] = {x:nx, y:ny}; save();
    if(quiz) return;
    chip.classList.remove('chip-ok','chip-bad'); chip.classList.add(ok?'chip-ok':'chip-bad');
    if(!silent){ fb.className='feedback '+(ok?'ok':'bad'); fb.innerHTML = (ok?'✅ ':'❌ ') + fmt(it.d) + (ok?' staat juist. ':' staat nog niet op de juiste plaats. ') + fmt(it.why); }
    pos[it.id] = {x:nx, y:ny}; save();
    if(!silent && cfg.items.every(i=>pos[i.id])) CLres(qid, cfg.items.every(i=>cfg.zoneAt(pos[i.id].x, pos[i.id].y)===i.zone));
  }
  const chips = [];
  shuffle(cfg.items).forEach(it=>{
    const c = el('span','chip', fmt(it.d)); c.dataset.id = it.id; c.dataset.grp = key;
    draggable(c, (x,y)=>{ const r=stage.getBoundingClientRect(); if(inRect(stage,x,y)) toStage(c,(x-r.left)/r.width,(y-r.top)/r.height); else toPool(c); });
    pool.append(c); chips.push(c);
  });
  stage.addEventListener('click', e=>{
    if(e.target.closest('.chip')) return;
    if(selChip && selChip.dataset.grp===key){ const c=selChip; clearSel(); const r=stage.getBoundingClientRect(); toStage(c,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height); }
  });
  pool.addEventListener('click', e=>{ if(e.target===pool && selChip && selChip.dataset.grp===key){ const c=selChip; clearSel(); toPool(c); } });
  chips.forEach(c=>{ const p=pos[c.dataset.id]; if(p) toStage(c,p.x,p.y,true); });
  const placedOk = it => { const p=pos[it.id]; return !!p && cfg.zoneAt(p.x,p.y)===it.zone; };
  if(quiz) quiz.push({ grade:()=>cfg.items.every(placedOk),
    reveal:()=>chips.forEach(c=>c.classList.add(placedOk(cfg.items.find(i=>i.id===c.dataset.id))?'chip-ok':'chip-bad')),
    lock:()=>chips.forEach(c=>c.dataset.locked='1') });
}
const RINGS_HTML = `<div class="ring ring-Q"></div><div class="ring ring-Z"></div><div class="ring ring-N"></div>
  <span class="ring-label" style="top:3%;left:50%">ℚ</span><span class="ring-label" style="top:20%;left:50%">ℤ</span><span class="ring-label" style="top:36%;left:50%">ℕ</span>`;
function ringZone(nx,ny){ const d=Math.hypot(nx-.5,ny-.5); if(d<=.17) return 'N'; if(d<=.33) return 'Z'; if(d<=.5) return 'Q'; return null; }
const VENN2_HTML = `<svg viewBox="0 0 300 200" aria-hidden="true"><circle class="venn-circle" cx="115" cy="100" r="80"/><circle class="venn-circle" cx="185" cy="100" r="80"/><text class="venn-label" x="22" y="30">A</text><text class="venn-label" x="266" y="30">B</text></svg>`;
function venn2Zone(nx,ny){ const x=nx*300, y=ny*200; const a=Math.hypot(x-115,y-100)<=80, b=Math.hypot(x-185,y-100)<=80; if(a&&b) return 'AB'; if(a) return 'A'; if(b) return 'B'; return null; }

/* --- venndiagram kleuren --- */
const VENN_GEOM = {
  2:{w:300,h:200,c:[{x:115,y:100,r:78,l:'A',lx:24,ly:32},{x:185,y:100,r:78,l:'B',lx:264,ly:32}]},
  3:{w:300,h:290,c:[{x:150,y:100,r:78,l:'A',lx:246,ly:30},{x:108,y:180,r:78,l:'B',lx:14,ly:282},{x:192,y:180,r:78,l:'C',lx:272,ly:282}]}
};
const repaintFns = [];
function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function hexRgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function vennColor(parent, st, save, id, item){
  const g = VENN_GEOM[item.n];
  const box = el('div','venn-item');
  box.append(el('div','stmt', item.label));
  const cv = document.createElement('canvas');
  cv.setAttribute('role','img'); cv.setAttribute('aria-label','Venndiagram '+item.label+': tik op een deel om het te kleuren');
  box.append(cv);
  const act = el('div','q-act');
  const bCheck = el('button','btn','Controleer'); bCheck.type='button';
  const bClear = el('button','btn ghost','Wis'); bClear.type='button';
  const bSol = el('button','linkbtn','Toon oplossing'); bSol.type='button'; bSol.hidden=true;
  act.append(bCheck,bClear,bSol);
  const fb = el('div','fb');
  box.append(act, fb); parent.append(box);
  const quiz = QZ; let locked = false; const qid = QID(id); if(!quiz) CLvraag(qid);
  if(quiz){ bCheck.hidden = true; bSol.hidden = true; }
  let sel = new Set(st[id]||[]);
  const code = (x,y)=> g.c.reduce((acc,c,i)=> acc | ((Math.hypot(x-c.x,y-c.y)<=c.r)?(1<<i):0), 0);
  const target = new Set(); for(let k=1;k<(1<<item.n);k++){ if(item.pred(!!(k&1),!!(k&2),!!(k&4))) target.add(k); }
  function paint(){
    const dpr = Math.min(2, window.devicePixelRatio||1);
    cv.width = Math.round(g.w*dpr); cv.height = Math.round(g.h*dpr);
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(cv.width, cv.height);
    const fill = hexRgb(cssVar('--venn-fill')||'#f19a86'), soft = hexRgb(cssVar('--venn-soft')||'#e5f0f1');
    for(let py=0; py<cv.height; py++){ for(let px=0; px<cv.width; px++){
      const k = code(px/dpr, py/dpr); if(!k) continue;
      const col = sel.has(k) ? fill : soft; const o=(py*cv.width+px)*4;
      img.data[o]=col[0]; img.data[o+1]=col[1]; img.data[o+2]=col[2]; img.data[o+3]=255;
    } }
    ctx.putImageData(img,0,0);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const line = cssVar('--venn-line')||'#15282d';
    ctx.strokeStyle=line; ctx.lineWidth=2; ctx.fillStyle=line; ctx.font='bold 18px system-ui, sans-serif';
    g.c.forEach(c=>{ ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.stroke(); ctx.fillText(c.l,c.lx,c.ly); });
  }
  repaintFns.push(paint);
  cv.addEventListener('click', e=>{
    const r = cv.getBoundingClientRect();
    const k = code((e.clientX-r.left)*g.w/r.width, (e.clientY-r.top)*g.h/r.height);
    if(!k || locked) return;
    sel.has(k) ? sel.delete(k) : sel.add(k);
    st[id] = [...sel]; save(); fb.textContent=''; paint();
  });
  bCheck.addEventListener('click', ()=>{
    const extra=[...sel].filter(k=>!target.has(k)).length, miss=[...target].filter(k=>!sel.has(k)).length;
    CLres(qid, !extra && !miss);
    if(!extra && !miss){ fb.className='fb ok'; fb.textContent='✅ Juist gekleurd!'; return; }
    fb.className='fb bad';
    const parts=[]; if(extra) parts.push(`${extra} deel${extra>1?'en':''} te veel`); if(miss) parts.push(`${miss} deel${miss>1?'en':''} te weinig`);
    fb.textContent='❌ Je kleurde '+parts.join(' en ')+'. '+item.hint; bSol.hidden=false;
  });
  bClear.addEventListener('click', ()=>{ sel=new Set(); st[id]=[]; save(); fb.textContent=''; paint(); });
  bSol.addEventListener('click', ()=>{ sel=new Set(target); st[id]=[...sel]; save(); fb.className='fb info'; fb.textContent='Dit is de oplossing. '+item.hint; paint(); });
  paint();
  if(quiz) quiz.push({ grade:()=>sel.size===target.size && [...target].every(k=>sel.has(k)),
    reveal:()=>{}, lock:()=>{ locked=true; bClear.disabled=true; } });
}
function repaintAll(){ repaintFns.forEach(f=>{ try{ f(); }catch(e){} }); }
try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaintAll); }catch(e){}
new MutationObserver(repaintAll).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});

/* --- delingstabel --- */
function tableEx(b, st, save, key, rows){
  const cols = ['D','d','q','r'], L = ['A','B','C','D'];
  let html = '<div class="table-wrap"><table class="dtable"><thead><tr><th></th><th>D</th><th>d</th><th>q</th><th>r</th></tr></thead><tbody>';
  rows.forEach((row,ri)=>{
    html += `<tr><th>${L[ri]}</th>`;
    cols.forEach(c=>{ html += row.hide!==c ? `<td class="given">${row[c]}</td>` : `<td><input type="text" inputmode="numeric" class="inp" id="${key}-r${ri}" data-row="${ri}" autocomplete="off" aria-label="rij ${L[ri]} ${c}"></td>`; });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  b.append(el('div','', html));
  const fb = el('div','fb'); b.append(fb);
  const quiz = QZ;
  const tIns = [...b.querySelectorAll('table .inp')]; const qid = QID('tabel'); if(!quiz) CLvraag(qid);
  const cellOk = inp => { const r=rows[+inp.dataset.row]; return parseNum(inp.value)===r[r.hide]; };
  if(quiz) quiz.push({ grade:()=>tIns.every(cellOk), reveal:()=>tIns.forEach(inp=>inp.classList.add(cellOk(inp)?'ok':'bad')), lock:()=>tIns.forEach(i=>i.readOnly=true) });
  tIns.forEach(inp=>{
    const ri = +inp.dataset.row, row = rows[ri], k='t'+ri;
    if(st[k]!=null) inp.value = st[k];
    if(quiz){ inp.addEventListener('input', ()=>{ st[k]=inp.value; save(); }); return; }
    function check(silent){
      const v = inp.value.trim(); st[k]=inp.value; save();
      inp.classList.remove('ok','bad'); if(v==='') return;
      const ok = parseNum(v) === row[row.hide];
      inp.classList.add(ok?'ok':'bad');
      if(!silent){ fb.className = 'fb '+(ok?'ok':'bad');
        if(tIns.every(x=>x.value.trim()!=='')) CLres(qid, tIns.every(cellOk));
        fb.textContent = ok ? `✅ Rij ${L[ri]} klopt: ${row.D} = ${row.d} · ${row.q} + ${row.r}.` : `❌ Rij ${L[ri]} klopt nog niet. Controleer met D = d · q + r (en r moet kleiner zijn dan d).`; }
    }
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); check(); } });
    inp.addEventListener('change', ()=>check());
    inp.addEventListener('input', ()=>{ st[k]=inp.value; save(); inp.classList.remove('ok','bad'); });
    if(inp.value) check(true);
  });
  b.append(el('div','sub','Opgaande of niet-opgaande deling?'));
  const grid = el('div','tf-grid'); b.append(grid);
  rows.forEach((row,ri)=>{
    const opg = row.r===0;
    qChoice(grid, st, save, 'oq'+ri, { html:`Rij ${L[ri]}`, opts:[['o','Opgaande deling'],['n','Niet-opgaande deling']], ans: opg?'o':'n',
      why: opg ? `De rest is 0 (${row.D} = ${row.d} · ${row.q}).` : `De rest is ${row.r}, niet 0.` });
  });
}

/* --- zoek de fout --- */
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
   ============================================================ */
const LET = 'abcdefghijklmnop';
const list = (items, opts={}) => (b, st, save, key) => items.forEach((q,i)=> qBlock(b, st, save, key+'_'+i, Object.assign({nr:(opts.letters?LET[i]+'.':'')}, opts.defaults||{}, q)));
const choiceList = (items, opts, cols) => (b, st, save, key) => { const box = cols ? el('div','tf-grid') : b; if(cols) b.append(box); items.forEach(([html,ans,why],i)=> qChoice(box, st, save, key+'_'+i, {html:fmt(html), ans, why:fmt(why), opts, nr:(i+1)+'.'})); };
const WN = [['w','Waar'],['n','Niet waar']];

function ggdSol(nums){ const g=nums.reduce(gcd); return nums.map(n=>`del ${n} = ${setTxt(divisors(n))}`).join('<br>') + `<br>De grootste gemeenschappelijke deler is <b>${g}</b>.`; }
function kgvSol(nums){ const L=nums.reduce(lcm), m=Math.max(...nums); const mult=[]; for(let k=m;k<=L;k+=m) mult.push(k); return `Veelvouden van ${m}: ${mult.join(', ')}, …<br>Het eerste veelvoud (≠ 0) dat ook een veelvoud is van ${nums.filter(n=>n!==m).join(' en ')}: <b>${L}</b>.`; }
const ggdQ = nums => ({html:`ggd(${nums.join(', ')}) = [[0]]`, mode:'numeric', size:'xs', check:numIs(nums.reduce(gcd)), sol:ggdSol(nums)});
const kgvQ = nums => ({html:`kgv(${nums.join(', ')}) = [[0]]`, mode:'numeric', size:'xs', check:numIs(nums.reduce(lcm)), sol:kgvSol(nums)});

function fracExpr(a,b){ return b===1 ? String(a) : fr(a,b); }
function fracQ([a,b,op,c,d]){
  const L=lcm(b,d), A=a*L/b, C=c*L/d, R= op==='+'?A+C:A-C, g=gcd(R,L), sym = op==='+'?'+':'−';
  const lhs = `${fracExpr(a,b)} ${sym} ${fracExpr(c,d)}`;
  let sol = `${lhs} = ${fr(A,L)} ${sym} ${fr(C,L)} = ${fr(R,L)}` + (g>1 ? ` = ${fr(R/g,L/g)}` : '');
  sol += `<br><span class="unit">Gelijknamig maken met het kgv van de noemers: kgv(${b}, ${d}) = ${L}.${(gcd(a,b)>1||gcd(c,d)>1)?' Je kan ook eerst de breuken vereenvoudigen.':''}</span>`;
  const N=R/g, D=L/g;
  return {
    html:`<span class="stmt">${lhs}</span>`, block:true, mode:'numeric', block2:true,
    html2:`<div class="step"><span class="step-lab">Gelijknamig maken</span> = ${FIN(0,1)} ${sym} ${FIN(2,3)}</div><div class="step"><span class="step-lab">Uitkomst</span> = ${FIN(4,5)} <span class="unit">vereenvoudigd</span></div>`,
    sol,
    check: v=>{
      const x=v.map(parseNum); if(x.some(isNaN)) return {ok:false, msg:'Vul elk vakje in met een getal.'};
      const [n1,d1,n2,d2,rn,rd]=x;
      if(d1===0||d2===0||rd===0) return {ok:false, msg:'Een noemer kan nooit 0 zijn.'};
      const f1 = n1*b===a*d1, f2 = n2*d===c*d2, same = d1===d2;
      const resVal = rn*D===N*rd, simple = gcd(rn,rd)===1;
      const fields = [f1&&same, f1&&same, f2&&same, f2&&same, resVal&&simple, resVal&&simple];
      if(!same) return {ok:false, fields, msg:'Bij gelijknamige breuken zijn beide noemers gelijk.'};
      if(!(f1&&f2)) return {ok:false, fields, msg:'Je gelijknamige breuken zijn niet gelijk aan de oorspronkelijke breuken.'};
      if(!resVal) return {ok:false, fields, msg:'Je tussenstap klopt, maar je uitkomst nog niet.'};
      if(!simple) return {ok:false, info:true, fields, msg:'Juist berekend, maar vereenvoudig je uitkomst nog.'};
      return {ok:true, fields};
    } };
}

function missingQ(parts, answers, sol){
  return { html: parts, size:'sm', mode:'numeric', sol:fmt(sol),
    check: v=>{ const f=v.map((x,i)=>parseNum(x)===answers[i]); return f.every(Boolean)?{ok:true,fields:f}:{ok:false,fields:f,msg:'De rode vakjes kloppen nog niet.'}; } };
}

/* vraagstuk met 3 stappen */
function probQ(o){
  const stepHtml = o.ans==='geen' ? o.stepHtml : `<span class="dyn">…</span>(${o.nums.join(', ')}) = [[0:xs]]`;
  const stepCheck = o.ans==='geen' ? o.stepCheck : (v => parseNum(v[0]) === o.nums.reduce(o.ans==='ggd'?gcd:lcm));
  return {
    html:o.text, block:true, choiceLabel:'Stap 1 · Kies',
    choice:[['ggd','GGD'],['kgv','KGV'],['geen','Geen van beide']], block2:true, mode:o.mode,
    html2:`<div class="step"><span class="step-lab">Stap 2 · Tussenstap</span> ${stepHtml}</div><div class="step"><span class="step-lab">Stap 3 · Antwoord</span> ${o.ansHtml} <span class="unit">${o.unit}</span></div>`,
    onChoice:(row,c)=>{ const d=row.querySelector('.dyn'); if(d) d.textContent = c==='ggd'?'ggd':c==='kgv'?'kgv':'…'; },
    allowEmpty:true, sol:o.sol,
    check:(v,c)=>{
      if(c!==o.ans) return {ok:false, choiceOk:false, msg:o.why};
      const sv = o.si.map(i=>v[i]), av = o.ai.map(i=>v[i]);
      if(sv.some(x=>x==='')) return {ok:false, info:true, choiceOk:true, msg:'Je keuze is juist! Vul nu de tussenstap in.'};
      const sOk = !!stepCheck(sv).ok || stepCheck(sv)===true;
      const fields = []; o.si.forEach(i=>fields[i]=sOk);
      if(!sOk) return {ok:false, choiceOk:true, fields, msg:'Je keuze is juist, maar de tussenstap klopt nog niet.'};
      if(av.some(x=>x==='')) return {ok:false, info:true, choiceOk:true, fields, msg:'De tussenstap klopt! Vul nu je antwoord in.'};
      const r = o.ansCheck(av); o.ai.forEach(i=>fields[i]=!!r.ok);
      if(r.ok) return {ok:true, choiceOk:true, fields};
      return {ok:false, info:r.info, choiceOk:true, fields, msg: r.msg || 'De tussenstap klopt, maar je antwoord nog niet.'};
    } };
}

function pickNumber(txt){
  const t = String(txt).replace(/[−–]/g,'-');
  const m = t.match(/x\s*=\s*(-?\d+(?:[.,]\d+)?)/i); if(m) return parseNum(m[1]);
  const m2 = t.match(/-?\d+(?:[.,]\d+)?/); return m2 ? parseNum(m2[0]) : NaN;
}
function implQ(text, ans, why, num){
  return { html:`<span class="stmt">${text}</span>`, choice:[['juist','Juist'],['fout','Fout']], html2:'Tegenvoorbeeld (als het fout is): [[0]]', size:'wide', allowEmpty:true,
    check:(v,c)=>{
      if(c!==ans) return {ok:false, choiceOk:false, msg: ans==='juist' ? 'Deze uitspraak is wel juist. Is het rechterdeel altijd waar als het linkerdeel waar is?' : 'Deze uitspraak is fout: er bestaat een tegenvoorbeeld.'};
      if(ans==='juist') return {ok:true, choiceOk:true, msg: why};
      if(!v[0]) return {ok:false, info:true, choiceOk:true, msg:'Juist, de uitspraak is fout! Geef nu nog een tegenvoorbeeld.'};
      if(!num) return {ok:true, choiceOk:true, msg:'Vergelijk jouw tegenvoorbeeld met dit voorbeeld: ' + why};
      const x = pickNumber(v[0]);
      if(isNaN(x)) return {ok:false, info:true, choiceOk:true, msg:'Noem in je tegenvoorbeeld een concreet getal voor x.'};
      const plain = /^\s*(x\s*=\s*)?[−\-]?\d+([.,]\d+)?\s*$/i.test(v[0]);
      const lead = plain ? '' : `Ik lees jouw tegenvoorbeeld als x = ${showNum(x)}. `;
      if(!num.pre(x)) return {ok:false, choiceOk:true, msg:`${lead}Voor x = ${showNum(x)} is het linkerdeel (${num.preT}) niet waar. Een tegenvoorbeeld maakt het linkerdeel wél waar.`};
      if(num.con(x)) return {ok:false, choiceOk:true, msg:`${lead}Voor x = ${showNum(x)} is het rechterdeel (${num.conT}) ook waar, dus dat is geen tegenvoorbeeld.`};
      return {ok:true, choiceOk:true, msg:`${lead}x = ${showNum(x)} is een goed tegenvoorbeeld: ${num.preT} is waar, maar ${num.conT} is niet waar.`};
    } };
}

function posQ(orig, task, newNum, dir, sol){
  return { html:`Oorspronkelijk getal: <b class="stmt">${orig}</b><br>${task}`, block:true, choiceLast:true,
    html2:`Nieuw getal: [[0]]`, choice:[['groter','wordt groter'],['gelijk','blijft gelijk'],['kleiner','wordt kleiner']], sol,
    check:(v,c)=>{ const x=parseNum(v[0]); const nOk=Math.abs(x-newNum)<1e-9, cOk=c===dir;
      if(nOk&&cOk) return {ok:true, choiceOk:true};
      if(!nOk && cOk) return {ok:false, choiceOk:true, msg:'Het nieuwe getal klopt nog niet.'};
      if(nOk && !cOk) return {ok:false, choiceOk:false, fields:[true], msg:'Het nieuwe getal klopt, maar vergelijk het nog eens met het oorspronkelijke getal.'};
      return {ok:false, choiceOk:false}; } };
}

/* ---------- hints bij ontbinden, ggd en kgv, zoek x en de getallenraadsels ---------- */
const HK = t => ({t, kop:true}), HU = t => ({t, uitleg:true});
const delersVan = n => { const d = []; for(let i = 1; i <= n; i++) if(n % i === 0) d.push(i); return d; };
/* deelladder met invulvakjes: rechts de deler, links eronder het quotiënt */
function ladderHint(n){
  const f = factorize(n), ans = []; let m = n, rows = '';
  f.forEach((p,i)=>{ const links = i === 0 ? String(n) : `[[${ans.length}]]`; if(i > 0) ans.push(m);
    rows += `<tr><td>${links}</td><td>[[${ans.length}]]</td></tr>`; ans.push(p); m /= p; });
  rows += `<tr><td>1</td><td></td></tr>`;
  return { titel:'Hint: maak de deelladder af',
    stappen:[
      HU(`Deel telkens door het <b>kleinste priemgetal</b> dat past (eerst 2, dan 3, dan 5, 7, …). Schrijf rechts van de streep waardoor je deelt, en links eronder het quotiënt. Je stopt bij 1.<table class="ladder">${rows}</table>`),
      HU(`De getallen rechts van de streep vormen samen het product. Dat product vul je in als antwoord: ${n} = … · … · …`) ],
    ans,
    extra:`<p><b>Past een priemgetal?</b> Door 2: het getal is even. Door 3: de som van de cijfers is deelbaar door 3. Door 5: het getal eindigt op 0 of 5. Past geen van die, probeer dan 7, 11, 13, …</p>
      <p><b>Voorbeeld met 60.</b> 60 is even: 60 : 2 = 30. 30 is even: 30 : 2 = 15. 15 is oneven, 1 + 5 = 6 is deelbaar door 3: 15 : 3 = 5. 5 is zelf een priemgetal: 5 : 5 = 1.</p>
      <table class="ladder"><tr><td>60</td><td>2</td></tr><tr><td>30</td><td>2</td></tr><tr><td>15</td><td>3</td></tr><tr><td>5</td><td>5</td></tr><tr><td>1</td><td></td></tr></table>
      <p>Dus 60 = 2 · 2 · 3 · 5.</p>` };
}
/* ggd: delers van het kleinste getal, welke delen ook de andere */
function ggdHint(nums){
  const k = Math.min(...nums), rest = nums.filter(x=>x !== k), d = delersVan(k), g = nums.reduce(gcd);
  const gem = d.filter(x=>rest.every(r=>r % x === 0)), ans = [...d, ...gem, g];
  const vak = (from, n) => Array.from({length:n}, (_,i)=>`[[${from+i}]]`).join(' , ');
  return { titel:'Hint: zoek de gemeenschappelijke delers',
    stappen:[
      `Schrijf alle delers van het kleinste getal op: del ${k} = { ${vak(0, d.length)} }`,
      `Welke van die delers zijn ook een deler van ${rest.join(' en van ')}? ${vak(d.length, gem.length)}`,
      `De grootste daarvan: ggd(${nums.join(', ')}) = [[${d.length+gem.length}]]` ],
    ans, sets:[d.map((_,i)=>i), gem.map((_,i)=>d.length+i)],
    extra:`<p><b>ggd</b> = <b>g</b>rootste <b>g</b>emeenschappelijke <b>d</b>eler: het grootste getal waardoor je ${nums.join(' en ')} allemaal kan delen zonder rest.</p>
      <p>Delers vind je in paren: bij 12 is dat 1 · 12, 2 · 6, 3 · 4. Dus del 12 = {1, 2, 3, 4, 6, 12}.</p>
      <p>Je begint bij het kleinste getal, want een gemeenschappelijke deler kan nooit groter zijn dan het kleinste getal.</p>` };
}
/* kgv: veelvouden van het grootste getal tot er een past bij de andere */
function kgvHint(nums){
  const G = Math.max(...nums), rest = nums.filter(x=>x !== G), K = nums.reduce(lcm), n = K / G + 1;
  const ans = [], vv = [];
  for(let i = 1; i <= n; i++){ if(i <= 2) vv.push(String(G*i)); else { vv.push(`[[${ans.length}]]`); ans.push(G*i); } }
  ans.push(K);
  return { titel:'Hint: zoek het kleinste gemeenschappelijke veelvoud',
    stappen:[
      `Schrijf de veelvouden van het grootste getal op: ${vv.join(' , ')} , …`,
      `Welk van die veelvouden is het kleinste dat ook deelbaar is door ${rest.join(' en door ')}? kgv(${nums.join(', ')}) = [[${ans.length-1}]]` ],
    ans,
    extra:`<p><b>kgv</b> = <b>k</b>leinste <b>g</b>emeenschappelijk <b>v</b>eelvoud: het kleinste getal (niet 0) dat in de tafels van ${nums.join(' en ')} allemaal voorkomt.</p>
      <p>Je begint met de tafel van het grootste getal: zo ben je het snelst. Voor elk veelvoud kijk je of het ook deelbaar is door ${rest.join(' en ')}.</p>
      <p>Voorbeeld: kgv(4, 10). Veelvouden van 10: 10, 20, 30, … 10 is niet deelbaar door 4, 20 wel. Dus kgv(4, 10) = 20.</p>` };
}

function threeQ(text, ans, sol, hint){
  return { hint, html:`<span>${text}</span>`, block:true, html2:'[[0]] [[1]] [[2]]', size:'xs', mode:'numeric', sol,
    check:v=>{ const a=v.map(parseNum).sort((x,y)=>x-y), b=[...ans].sort((x,y)=>x-y); if(a.some(isNaN)) return {ok:false,msg:'Vul drie getallen in.'}; return {ok:a.every((x,i)=>x===b[i])}; } };
}
/* hints bij de getallenraadsels: telkens twee manieren, een derde in "Meer uitleg" */
const RH = {
  product30:{ titel:'Hint: twee manieren om dit raadsel op te lossen', stappen:[
      HK('Manier 1: zoek alle drietallen met product 30'),
      'Drie verschillende getallen met product 30: 1 · 2 · [[0]] , 1 · 3 · [[1]] , 1 · 5 · [[2]] , 2 · 3 · [[3]]',
      'Bereken telkens de som: 1 + 2 + 15 = [[4]] , 1 + 3 + 10 = [[5]] , 1 + 5 + 6 = [[6]] , 2 + 3 + 5 = [[7]]',
      HU('Welk drietal heeft som 10? Dat is je antwoord.'),
      HK('Manier 2: ontbind 30 in priemfactoren'),
      '30 = [[8]] · [[9]] · [[10]]',
      'Tel die drie getallen op: [[11]]. Is dat de som uit het raadsel?' ],
    ans:[15,10,6,5,18,14,12,10,2,3,5,10], sets:[[8,9,10]],
    extra:`<p><b>Manier 1</b> werkt altijd: begin met 1 als kleinste getal, dan met 2, … Zo vergeet je geen enkel drietal.</p>
      <p><b>Manier 2</b> werkt hier snel, omdat 30 precies drie verschillende priemfactoren heeft.</p>
      <p><b>Manier 3: proberen en controleren.</b> Kies drie verschillende getallen met som 10, bv. 1, 4 en 5. Het product is 20: te klein. Probeer 2, 3 en 5: het product is 30. Gevonden!</p>` },
  som42:{ titel:'Hint: twee manieren om dit raadsel op te lossen', stappen:[
      HK('Manier 1: zoek het middelste getal'),
      HU('Bij drie opeenvolgende getallen ligt het middelste precies in het midden. Het is het gemiddelde van de drie.'),
      'Het middelste getal = 42 : 3 = [[0]]',
      'Het getal ervoor en het getal erna: [[1]] en [[2]]',
      HK('Manier 2: proberen en bijsturen'),
      'Probeer 10, 11 en 12. Hun som is [[3]]',
      'Hoeveel is dat te weinig? 42 − 33 = [[4]]',
      HU('Maak je elk getal 1 groter, dan wordt de som 3 groter.'),
      'Hoeveel keer moet je dat doen? 9 : 3 = [[5]] keer. Tel dat bij elk getal op.' ],
    ans:[14,13,15,33,9,3], sets:[[1,2]],
    extra:`<p><b>Waarom delen door 3?</b> Neem 13, 14 en 15: het eerste is 1 kleiner dan 14, het laatste 1 groter. Samen is dat evenveel als 14 + 14 + 14 = 3 · 14.</p>
      <p><b>Manier 3: met een letter</b> (voor wie dat al kan). Noem het kleinste getal n. De drie getallen zijn n, n + 1 en n + 2. Hun som is 3 · n + 3 = 42. Dus 3 · n = 39 en n = 13.</p>
      <p>Controleer altijd: 13 + 14 + 15 = 42.</p>` },
  kgv24:{ titel:'Hint: twee manieren om dit raadsel op te lossen', stappen:[
      HK('Manier 1: redeneren'),
      'Noem het kleinste getal k. Het middelste is het dubbel: [[0]] · k. Het grootste is het dubbel van het middelste: [[1]] · k.',
      HU('Het grootste getal is dan een veelvoud van de twee andere getallen. Het kgv is dus gewoon het grootste getal.'),
      'Het grootste getal is [[2]]',
      'Het kleinste: 24 : 4 = [[3]]. Het middelste: [[4]]',
      HK('Manier 2: proberen en een patroon zoeken'),
      'Kleinste 1: de getallen 1, 2 en 4. kgv = [[5]]',
      'Kleinste 2: de getallen 2, 4 en 8. kgv = [[6]]',
      'Kleinste 3: de getallen 3, 6 en 12. kgv = [[7]]',
      HU('Zie je het patroon? Het kgv is telkens het grootste getal, en dat is 4 keer het kleinste. Welk kleinste getal geeft kgv 24?') ],
    ans:[2,4,24,6,12,4,8,12],
    extra:`<p><b>Waarom is het kgv hier het grootste getal?</b> Bij 3, 6 en 12: 12 is deelbaar door 3 en door 6. Het kleinste veelvoud van 12 is 12 zelf, en dat zit dus ook in de tafels van 3 en 6.</p>
      <p>Dat geldt altijd: is het grootste getal een veelvoud van de andere, dan is het kgv het grootste getal.</p>
      <p>Controleer je antwoord: is het middelste het dubbel van het kleinste, het grootste het dubbel van het middelste, en is het kgv 24?</p>` },
  ggd5:{ titel:'Hint: twee manieren om dit raadsel op te lossen', stappen:[
      HK('Manier 1: veelvouden van 5'),
      HU('Is de ggd 5, dan zijn alle drie de getallen deelbaar door 5: het zijn veelvouden van 5.'),
      'Veelvouden van 5 die groter zijn dan 0 en kleiner dan 20: [[0]] , [[1]] , [[2]]',
      'Hun som is [[3]]. Klopt dat met het raadsel?',
      'Controleer de ggd: ggd(5, 10, 15) = [[4]]',
      HK('Manier 2: deel alles door 5'),
      'Elk getal is 5 · iets. Deel de som door 5: 30 : 5 = [[5]]',
      'Drie verschillende getallen (groter dan 0) met som 6: [[6]] , [[7]] , [[8]]',
      HU('Maak die weer 5 keer zo groot. Dan heb je de drie getallen uit het raadsel.') ],
    ans:[5,10,15,30,5,6,1,2,3], sets:[[0,1,2],[6,7,8]],
    extra:`<p><b>Manier 1</b> werkt hier snel, omdat er maar drie veelvouden van 5 kleiner zijn dan 20.</p>
      <p><b>Manier 2</b> werkt ook als er meer mogelijkheden zijn: je maakt het raadsel 5 keer kleiner, lost het makkelijkere raadsel op en maakt alles terug 5 keer groter.</p>
      <p>Controleer altijd alle voorwaarden: verschillend, kleiner dan 20, som 30 en ggd 5.</p>` }
};

/* één oefening op één scherm: gegevens en venndiagram links, de vragen erover rechts */
(function(){ const st = document.createElement('style'); st.textContent = `
  .venn-naast{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1.4rem; align-items:start; }
  .venn-naast > div{ min-width:0; }
  @media (max-width: 760px){ .venn-naast{ grid-template-columns:minmax(0,1fr); } }`; document.head.append(st); })();
function vennNaast(b){
  const ch = [...b.children], k = ch.findIndex(x=>x.classList.contains('stage')); if(k < 0) return;
  const w = el('div','venn-naast'), L = el('div'), R = el('div');
  ch.forEach((x,i)=>(i <= k ? L : R).append(x)); w.append(L, R); b.append(w);
}
function venn2Items(A, B){
  const all = [...new Set([...A,...B])].sort((x,y)=>x-y);
  return all.map(n=>{ const a=A.includes(n), b=B.includes(n); return { id:'n'+n, d:String(n), zone: a&&b?'AB':(a?'A':'B'),
    why: `${n} ${a?'∈':'∉'} A en ${n} ${b?'∈':'∉'} B` + (a&&b ? ', dus in de doorsnede.' : a ? ', dus enkel in A.' : ', dus enkel in B.') }; });
}
const setQ = (label, arr, sol) => ({html:`<span class="stmt">${label} =</span> ${BR('[[0]]')}`, size:'wide', check:setIs(arr), sol});

const CHEAT = `<h3>Spiekbriefje · kenmerken van deelbaarheid</h3><table>
  <tr><td>door 2</td><td>het laatste cijfer is even (0, 2, 4, 6 of 8)</td></tr>
  <tr><td>door 3</td><td>de som van de cijfers is deelbaar door 3</td></tr>
  <tr><td>door 4</td><td>het getal gevormd door de laatste twee cijfers is deelbaar door 4</td></tr>
  <tr><td>door 5</td><td>het laatste cijfer is 0 of 5</td></tr>
  <tr><td>door 6</td><td>het getal is even én de som van de cijfers is deelbaar door 3</td></tr>
  <tr><td>door 9</td><td>de som van de cijfers is deelbaar door 9</td></tr>
  <tr><td>door 10</td><td>het laatste cijfer is 0</td></tr>
  <tr><td>door 25</td><td>de laatste twee cijfers zijn 00, 25, 50 of 75</td></tr>
  <tr><td>door 100</td><td>de laatste twee cijfers zijn 00</td></tr></table>`;


/* ---------- proeftoetsvragen ---------- */
const WORDS = ['een term','de som','het aftrektal','de aftrekker','het verschil','een factor','het product','het deeltal','de deler','het quotiënt'];
const ZN = {N:'ℕ',Z:'ℤ',Q:'ℚ'};
const EL = [['in','∈'],['out','∉']];
const frIn = (n,d) => `<span class="fr fr-in"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
const PQ = {
  roos: items => ({sec:'Soorten getallen', prompt:'Sleep elk getal naar de kleinste verzameling waar het in past: ℕ, ℤ of ℚ.',
    build:(b,st,save,key)=>posDrag(b,st,save,key,{cls:'rings', html:RINGS_HTML, zoneAt:ringZone, items:items.map(([d,z],i)=>({id:'i'+i,d,zone:z,why:''}))}),
    show: items.map(([d,z])=>fmt(d)+' → '+ZN[z]).join(' · ')}),
  input: (sec, q, show, prompt) => ({sec, prompt, build:(b,st,save)=>qBlock(b,st,save,'a',q), show}),
  bank: lines => ({sec:'Benamingen', prompt:'Sleep het juiste woord naar elk vakje. Niet alle woorden worden gebruikt.',
    build:(b,st,save,key)=>bankEx(b,st,save,key,lines.map(([expr,pre,ans])=>({expr,pre,ans,why:''})), WORDS),
    show: lines.map(l=>`${l[1]} ${l[2]}`).join(' · ')}),
  table: rows => ({sec:'Deling met rest', prompt:'Vul de tabel aan en duid bij elke rij aan of de deling opgaand is.',
    build:(b,st,save,key)=>tableEx(b,st,save,key,rows),
    show: rows.map((r,i)=>`rij ${'AB'[i]}: ${r.D} = ${r.d} · ${r.q} + ${r.r} (${r.r===0?'opgaande':'niet-opgaande'} deling)`).join(' · ')}),
  choices: (sec, prompt, list, opts) => ({sec, prompt,
    build:(b,st,save)=>{ const g=el('div','tf-grid'); b.append(g); list.forEach(([h,a],i)=>qChoice(g,st,save,'c'+i,{html:fmt(h),ans:a,opts,nr:LET[i]+'.'})); },
    show: list.map(([h,a])=>fmt(h)+': <b>'+opts.find(o=>o[0]===a)[1]+'</b>').join(' · ')}),
  venn2: (Atxt, Btxt, A, B) => ({sec:'Venn: getallen plaatsen', prompt:`<div class="given-box"><b>Gegeven:</b> ${Atxt}<br>${Btxt}</div>Sleep de getallen naar de juiste plaats in het venndiagram.`,
    build:(b,st,save,key)=>posDrag(b,st,save,key,{cls:'venn2', html:VENN2_HTML, zoneAt:venn2Zone, items:venn2Items(A,B)}),
    show:`enkel in A: ${setTxt(A.filter(x=>!B.includes(x)))} · in A én B: ${setTxt(A.filter(x=>B.includes(x)))} · enkel in B: ${setTxt(B.filter(x=>!A.includes(x)))}`}),
  kleur: (n, label, pred, show) => ({sec:'Venn: kleuren', prompt:`Kleur <b>${label}</b>. Tik op een deel om het te kleuren.`,
    build:(b,st,save)=>{ const g=el('div','venn-grid'); b.append(g); vennColor(g,st,save,'v',{n,label,pred,hint:''}); }, show}),
  ggdkgv: (g, k) => ({sec:'ggd en kgv', build:(b,st,save)=>{ qBlock(b,st,save,'a',ggdQ(g)); qBlock(b,st,save,'b',kgvQ(k)); },
    show:`ggd(${g.join(', ')}) = ${g.reduce(gcd)} · kgv(${k.join(', ')}) = ${k.reduce(lcm)}`}),
  err: e => ({sec:'Zoek de fout', prompt:'Klik op de stap die fout is.', build:(b,st,save)=>errBlock(b,st,save,'e',Object.assign({nr:''},e)), show:`stap ${e.wrong+1}`})
};

const TOETSEN = [
  [ PQ.roos([['6','N'],['-9','Z'],['7/4','Q'],['30/6','N'],['-1,2','Q'],['-16/8','Z']]),
    PQ.input('Getallen vormen', {html:'Het kleinste natuurlijk getal van 3 verschillende cijfers dat deelbaar is door 4. [[0]]', mode:'numeric', check:numIs(104)}, '104'),
    PQ.input('Verwissel cijfers', posQ('4 827,3','Verwissel het cijfer van de <b>honderdtallen</b> met het cijfer van de <b>tienden</b>.', 4327.8, 'kleiner', ''), '4 327,8 · het getal wordt kleiner'),
    PQ.bank([['8 · 15 = 120','120 is','het product'],['93 − 38 = 55','38 is','de aftrekker'],['84 : 7 = 12','84 is','het deeltal']]),
    PQ.table([{D:47,d:6,q:7,r:5,hide:'q'},{D:72,d:8,q:9,r:0,hide:'D'}]),
    PQ.choices('∈ of ∉','Vul in met ∈ of ∉.', [['8 … del 32','in'],['0 … 4ℕ','in'],['5 … del 12','out']], EL),
    PQ.input('Opsomming', setQ('del 40', [1,2,4,5,8,10,20,40], ''), '{1, 2, 4, 5, 8, 10, 20, 40}', 'Noteer door opsomming.'),
    PQ.venn2('A = del 8 = {1, 2, 4, 8}', 'B = 2ℕ &lt; 10 = {0, 2, 4, 6, 8}', [1,2,4,8], [0,2,4,6,8]),
    PQ.kleur(3, '(A ∪ C) \\ B', (a,b,c)=>(a||c)&&!b, 'alles van A en C samen, zonder het deel dat in B ligt'),
    PQ.choices('Waar of niet waar','Waar of niet waar?', [['39 is een priemgetal','n'],['−2 < 0','w'],['5 ∣ 135','w']], WN),
    PQ.input('Vervang x', {html:'<span class="stmt">2x5</span> is deelbaar door 9. Geef alle oplossingen. &nbsp;x = [[0]]', check:digitsIs([2])}, 'x = 2'),
    PQ.input('Priemfactoren', {html:'Ontbind in priemfactoren. <span class="stmt">72 =</span> [[0]]', size:'wide', check:factorIs(72)}, '72 = 2 · 2 · 2 · 3 · 3'),
    PQ.ggdkgv([24,40],[4,9]),
    PQ.input('Vraagstukken', probQ({text:'Een bloemist heeft 30 rozen en 45 tulpen. Hij maakt zo veel mogelijk boeketten met in elk boeket evenveel rozen en evenveel tulpen, zonder dat er bloemen overblijven. <b>Hoeveel boeketten maakt hij?</b>', ans:'ggd', nums:[30,45], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(15), unit:'boeketten', mode:'numeric', why:'', sol:''}), 'GGD · ggd(30, 45) = 15 · 15 boeketten'),
    PQ.input('Gelijkwaardige breuken', missingQ(`${fr(7,35)} = ${frIn('[[0]]',5)} = [[1]] %`, [1,20], ''), fr(1,5)+' = 20%', 'Vul de ontbrekende getallen in.'),
    PQ.input('Breuken rekenen', fracQ([2,3,'+',1,4]), fr(8,12)+' + '+fr(3,12)+' = '+fr(11,12)),
    PQ.input('Implicatiepijl', implQ('x ∈ 2ℕ ⇒ x ∈ 8ℕ','fout','',{pre:x=>Number.isInteger(x)&&x>=0&&x%2===0, con:x=>Number.isInteger(x)&&x>=0&&x%8===0, preT:'x ∈ 2ℕ', conT:'x ∈ 8ℕ'}), 'de uitspraak is fout. Tegenvoorbeeld: x = 2 (2 ∈ 2ℕ, maar 2 ∉ 8ℕ).', 'Is de uitspraak juist of fout? Geef bij fout een tegenvoorbeeld.'),
    PQ.input('Welke getallen?', threeQ('De som van drie opeenvolgende even getallen is 36. Welke getallen zijn het?', [10,12,14], ''), '10, 12 en 14'),
    PQ.err({task:'Bereken '+fr(5,6)+' − '+fr(1,4)+'.', lines:['kgv(6, 4) = 12', fr(5,6)+' = '+fr(10,12), fr(1,4)+' = '+fr(4,12), fr(10,12)+' − '+fr(4,12)+' = '+fr(6,12)+' = '+fr(1,2)], wrong:2})
  ],
  [ PQ.roos([['15','N'],['-4','Z'],['0,6','Q'],['28/7','N'],['-9/3','Z'],['3/8','Q']]),
    PQ.input('Getallen vormen', {html:'Het getal met 7 honderdtallen, 4 eenheden en 2 honderdsten. Alle andere cijfers zijn 0. [[0]]', check:numIs(704.02)}, '704,02'),
    PQ.input('Verwissel cijfers', posQ('6 154,82','Verwissel het cijfer van de <b>tientallen</b> met het cijfer van de <b>tienden</b>.', 6184.52, 'groter', ''), '6 184,52 · het getal wordt groter'),
    PQ.bank([['14 + 29 = 43','43 is','de som'],['6 · 11 = 66','6 is','een factor'],['63 : 9 = 7','9 is','de deler']]),
    PQ.table([{D:58,d:7,q:8,r:2,hide:'r'},{D:81,d:9,q:9,r:0,hide:'d'}]),
    PQ.choices('∈ of ∉','Vul in met ∈ of ∉.', [['12 … del 4','out'],['36 … 9ℕ','in'],['3 … del 0','in']], EL),
    PQ.input('Opsomming', {html:`<span class="stmt">5ℕ =</span> ${BR('[[0]]')}`, size:'wide', check:infSetIs(i=>5*i)}, '{0, 5, 10, 15, …}', 'Noteer door opsomming.'),
    PQ.venn2('A = del 15 = {1, 3, 5, 15}', 'B = 5ℕ ≤ 20 = {0, 5, 10, 15, 20}', [1,3,5,15], [0,5,10,15,20]),
    PQ.kleur(3, '(B ∩ C) \\ A', (a,b,c)=>b&&c&&!a, 'het stuk dat in B én in C ligt, maar niet in A'),
    PQ.choices('Waar of niet waar','Waar of niet waar?', [['0 ∈ ℕ','w'],['7/2 ∈ ℤ','n'],['2 358 is deelbaar door 3','w']], WN),
    PQ.input('Vervang x', {html:'<span class="stmt">47x</span> is deelbaar door 4. Geef alle oplossingen. &nbsp;x = [[0]]', check:digitsIs([2,6])}, 'x ∈ {2, 6}'),
    PQ.input('Priemfactoren', {html:'Ontbind in priemfactoren. <span class="stmt">150 =</span> [[0]]', size:'wide', check:factorIs(150)}, '150 = 2 · 3 · 5 · 5'),
    PQ.ggdkgv([21,35],[10,15]),
    PQ.input('Vraagstukken', probQ({text:'Mila gaat om de 4 dagen zwemmen, Jonas om de 6 dagen. Vandaag zwemmen ze samen. <b>Na hoeveel dagen zwemmen ze opnieuw samen?</b>', ans:'kgv', nums:[4,6], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(12), unit:'dagen', mode:'numeric', why:'', sol:''}), 'KGV · kgv(4, 6) = 12 · na 12 dagen'),
    PQ.input('Gelijkwaardige breuken', missingQ(`${fr(18,27)} = ${frIn('[[0]]',3)} = ${frIn(8,'[[1]]')}`, [2,12], ''), fr(2,3)+' = '+fr(8,12), 'Vul de ontbrekende getallen in.'),
    PQ.input('Breuken rekenen', fracQ([5,8,'-',1,6]), fr(15,24)+' − '+fr(4,24)+' = '+fr(11,24)),
    PQ.input('Implicatiepijl', implQ('x ∈ del 4 ⇒ x ∈ del 8','juist','Elke deler van 4 is ook een deler van 8.'), 'de uitspraak is juist: elke deler van 4 (1, 2, 4) is ook een deler van 8.', 'Is de uitspraak juist of fout? Geef bij fout een tegenvoorbeeld.'),
    PQ.input('Welke getallen?', threeQ('Het product van drie verschillende natuurlijke getallen is 42. Hun som is 12. Welke getallen zijn het?', [2,3,7], ''), '2, 3 en 7'),
    PQ.err({task:'Ontbind 90 in priemfactoren.', lines:['90 : 2 = 45','45 : 3 = 13','13 : 13 = 1','90 = 2 · 3 · 13'], wrong:1})
  ],
  [ PQ.roos([['0','N'],['-25','Z'],['1/9','Q'],['45/9','N'],['-21/3','Z'],['1,75','Q']]),
    PQ.input('Getallen vormen', {html:'Het grootste getal met één cijfer na de komma dat kleiner is dan 10. [[0]]', check:numIs(9.9)}, '9,9'),
    PQ.input('Verwissel cijfers', posQ('1 205,6','Verwissel het cijfer van de <b>duizendtallen</b> met het cijfer van de <b>honderdtallen</b>.', 2105.6, 'groter', ''), '2 105,6 · het getal wordt groter'),
    PQ.bank([['100 − 64 = 36','100 is','het aftrektal'],['17 + 8 = 25','8 is','een term'],['56 : 8 = 7','7 is','het quotiënt']]),
    PQ.table([{D:61,d:9,q:6,r:7,hide:'D'},{D:40,d:5,q:8,r:0,hide:'q'}]),
    PQ.choices('∈ of ∉','Vul in met ∈ of ∉.', [['9 … del 27','in'],['27 … del 9','out'],['50 … 10ℕ','in']], EL),
    PQ.input('Opsomming', setQ('del 50', [1,2,5,10,25,50], ''), '{1, 2, 5, 10, 25, 50}', 'Noteer door opsomming.'),
    PQ.venn2('A = del 16 = {1, 2, 4, 8, 16}', 'B = 4ℕ &lt; 20 = {0, 4, 8, 12, 16}', [1,2,4,8,16], [0,4,8,12,16]),
    PQ.kleur(3, 'B \\ (A ∪ C)', (a,b,c)=>b&&!a&&!c, 'het deel van B dat niet in A en niet in C ligt'),
    PQ.choices('Waar of niet waar','Waar of niet waar?', [['−7 > −10','w'],['91 is een priemgetal','n'],['4 ∣ 1 314','n']], WN),
    PQ.input('Vervang x', {html:'<span class="stmt">1x3</span> is deelbaar door 3. Geef alle oplossingen. &nbsp;x = [[0]]', check:digitsIs([2,5,8])}, 'x ∈ {2, 5, 8}'),
    PQ.input('Priemfactoren', {html:'Ontbind in priemfactoren. <span class="stmt">200 =</span> [[0]]', size:'wide', check:factorIs(200)}, '200 = 2 · 2 · 2 · 5 · 5'),
    PQ.ggdkgv([32,48],[5,6,10]),
    PQ.input('Vraagstukken', probQ({text:'Lars krijgt 60 euro voor zijn verjaardag. Hij spaart '+fr(2,5)+' van dat geld. <b>Hoeveel euro spaart hij?</b>', ans:'geen', stepHtml:'60 : 5 = [[0:xs]]', stepCheck:numIs(12), si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(24), unit:'euro', mode:'numeric', why:'', sol:''}), 'geen van beide · 60 : 5 = 12 en 12 · 2 = 24 euro'),
    PQ.input('Gelijkwaardige breuken', missingQ(`${fr(6,24)} = ${frIn('[[0]]',4)} = [[1]] %`, [1,25], ''), fr(1,4)+' = 25%', 'Vul de ontbrekende getallen in.'),
    PQ.input('Breuken rekenen', fracQ([3,1,'-',5,4]), fr(12,4)+' − '+fr(5,4)+' = '+fr(7,4)),
    PQ.input('Implicatiepijl', implQ('x &gt; 0 ⇒ x &gt; 1','fout','',{pre:x=>x>0, con:x=>x>1, preT:'x > 0', conT:'x > 1'}), 'de uitspraak is fout. Tegenvoorbeeld: x = 1 (1 > 0, maar 1 is niet groter dan 1).', 'Is de uitspraak juist of fout? Geef bij fout een tegenvoorbeeld.'),
    PQ.input('Welke getallen?', threeQ('De som van drie opeenvolgende oneven getallen is 45. Welke getallen zijn het?', [13,15,17], ''), '13, 15 en 17'),
    PQ.err({task:'Is 8 316 deelbaar door 4?', lines:['Kijk naar het getal gevormd door de laatste twee cijfers: 16.','16 is niet deelbaar door 4.','Besluit: 8 316 is niet deelbaar door 4.'], wrong:1})
  ]
];

const SECTIONS = [
  { id:'roos', ic:'roos', nav:'Soorten getallen', title:'Mik de getallen in de juiste ring',
    tip:'Zet elk getal in de kleinste verzameling waar het in past. Vereenvoudig eerst: een breuk of percentage kan ook een natuurlijk of geheel getal zijn.',
    cards:[
      { title:'Roos A', instr:'Sleep elk getal naar de juiste zone: ℕ (midden), ℤ (middelste ring) of ℚ (buitenste ring). Je kan ook een getal aantikken en daarna op de roos tikken.',
        build:(b,st,save,key)=>posDrag(b,st,save,key,{cls:'rings', html:RINGS_HTML, zoneAt:ringZone, items:[
          {id:'a',d:'8',zone:'N',why:'8 is een natuurlijk getal.'},
          {id:'b',d:'-7',zone:'Z',why:'−7 is negatief: geen natuurlijk getal, wel een geheel getal.'},
          {id:'c',d:'3/5',zone:'Q',why:'3/5 = 0,6: geen geheel getal, wel rationaal.'},
          {id:'d',d:'-35/5',zone:'Z',why:'−35/5 = −7: een geheel getal.'},
          {id:'e',d:'0,333…',zone:'Q',why:'0,333… = 1/3: rationaal, geen geheel getal.'},
          {id:'f',d:'40%',zone:'Q',why:'40% = 0,4: rationaal, geen geheel getal.'},
          {id:'g',d:'36/4',zone:'N',why:'36/4 = 9: een natuurlijk getal!'},
          {id:'h',d:'-2,5',zone:'Q',why:'−2,5 ligt tussen −3 en −2: geen geheel getal, wel rationaal.'}
        ]}) },
      { title:'Roos B', instr:'Andere getallen, zelfde opdracht.',
        build:(b,st,save,key)=>posDrag(b,st,save,key,{cls:'rings', html:RINGS_HTML, zoneAt:ringZone, items:[
          {id:'a',d:'1',zone:'N',why:'1 is een natuurlijk getal.'},
          {id:'b',d:'-24/6',zone:'Z',why:'−24/6 = −4: een geheel getal.'},
          {id:'c',d:'-0,75',zone:'Q',why:'−0,75 = −3/4: rationaal, geen geheel getal.'},
          {id:'d',d:'200%',zone:'N',why:'200% = 2: een natuurlijk getal!'},
          {id:'e',d:'-1',zone:'Z',why:'−1 is negatief: wel een geheel getal.'},
          {id:'f',d:'5/8',zone:'Q',why:'5/8 = 0,625: rationaal.'},
          {id:'g',d:'0,777…',zone:'Q',why:'0,777… = 7/9: rationaal.'},
          {id:'h',d:'250%',zone:'Q',why:'250% = 2,5: rationaal, geen geheel getal.'}
        ]}) },
      { title:'Roos C', instr:'Nog een laatste reeks.',
        build:(b,st,save,key)=>posDrag(b,st,save,key,{cls:'rings', html:RINGS_HTML, zoneAt:ringZone, items:[
          {id:'a',d:'-100',zone:'Z',why:'−100 is een negatief geheel getal.'},
          {id:'b',d:'14/2',zone:'N',why:'14/2 = 7: een natuurlijk getal.'},
          {id:'c',d:'-3/7',zone:'Q',why:'−3/7 is geen geheel getal, wel rationaal.'},
          {id:'d',d:'2,25',zone:'Q',why:'2,25 ligt tussen 2 en 3: rationaal.'},
          {id:'e',d:'-60%',zone:'Q',why:'−60% = −0,6: rationaal.'},
          {id:'f',d:'12',zone:'N',why:'12 is een natuurlijk getal.'},
          {id:'g',d:'-42/7',zone:'Z',why:'−42/7 = −6: een geheel getal.'},
          {id:'h',d:'-400%',zone:'Z',why:'−400% = −4: een geheel getal!'}
        ]}) }
    ]},

  { id:'getallen', ic:'getallen', nav:'Getallen vormen', title:'Noteer het gevraagde getal', cheat:true,
    tip:'Denk aan de plaatswaarde van elk cijfer: duizendtallen, honderdtallen, tientallen, eenheden, en na de komma tienden, honderdsten, duizendsten. Bij een breuk vul je teller en noemer apart in.',
    cards:[
      { title:'Reeks A', build:list([
        {html:'Het kleinste natuurlijk getal waarvan de som van de cijfers 20 is. [[0]]', mode:'numeric', check:numIs(299), sol:'Met 2 cijfers kom je hoogstens aan 9 + 9 = 18. Je hebt dus 3 cijfers nodig. Maak het eerste cijfer zo klein mogelijk: 2 + 9 + 9 = 20 → <b>299</b>.'},
        {html:`De breuk met noemer 12 die groter is dan ${fr(1,3)} en kleiner dan ${fr(1,2)}. ${FIN(0,1)}`, mode:'numeric', check:fracExact(5,12), sol:`${fr(1,3)} = ${fr(4,12)} en ${fr(1,2)} = ${fr(6,12)}. Daartussen ligt <b>${fr(5,12)}</b>.`},
        {html:'Het getal met 5 duizendtallen, 3 tientallen en 8 tienden. Alle andere cijfers zijn 0. [[0]]', check:numIs(5030.8), sol:'D = 5, H = 0, T = 3, E = 0, t = 8 → <b>5 030,8</b>.'},
        {html:'Het grootste getal van 3 verschillende cijfers dat deelbaar is door 25. [[0]]', mode:'numeric', check:numIs(975), sol:'Deelbaar door 25: eindigen op 00, 25, 50 of 75. Met verschillende cijfers is het grootste <b>975</b>.'}
      ], {letters:true}) },
      { title:'Reeks B', build:list([
        {html:'Het kleinste natuurlijk getal van 4 verschillende cijfers dat deelbaar is door 9. [[0]]', mode:'numeric', check:numIs(1026), sol:'Begin zo klein mogelijk: 1, 0, 2 en dan nog één cijfer. De som van de cijfers moet een veelvoud van 9 zijn: 1 + 0 + 2 + 6 = 9 → <b>1026</b>.'},
        {html:'Het getal dat precies in het midden ligt tussen 2,4 en 2,5. [[0]]', check:numIs(2.45), sol:'2,4 = 2,40 en 2,5 = 2,50. Het midden is <b>2,45</b>.'},
        {html:`De grootste stambreuk (teller 1) die kleiner is dan ${fr(1,5)}. ${FIN(0,1)}`, mode:'numeric', check:fracExact(1,6), sol:`Hoe groter de noemer, hoe kleiner de stambreuk. De eerste stambreuk na ${fr(1,5)} is <b>${fr(1,6)}</b>.`},
        {html:'Het grootste getal met twee cijfers na de komma dat kleiner is dan 5. [[0]]', check:numIs(4.99), sol:'Net onder 5,00 ligt <b>4,99</b>.'}
      ], {letters:true}) },
      { title:'Reeks C', build:list([
        {html:'Het getal dat 1 tiende groter is dan 3,95. [[0]]', check:numIs(4.05), sol:'3,95 + 0,1 = <b>4,05</b>.'},
        {html:`De kleinste breuk met noemer 9 die groter is dan 1. ${FIN(0,1)}`, mode:'numeric', check:fracExact(10,9), sol:`1 = ${fr(9,9)}. De eerstvolgende breuk met noemer 9 is <b>${fr(10,9)}</b>.`},
        {html:'Het grootste even getal met 3 verschillende cijfers. [[0]]', mode:'numeric', check:numIs(986), sol:'987 is oneven. Het grootste even getal met verschillende cijfers is <b>986</b>.'},
        {html:'Het kleinste natuurlijk getal van 3 cijfers dat deelbaar is door 3 én door 5. [[0]]', mode:'numeric', check:numIs(105), sol:'Deelbaar door 3 én 5 = deelbaar door 15. Het kleinste veelvoud van 15 met 3 cijfers is 15 · 7 = <b>105</b>.'}
      ], {letters:true}) }
    ]},

  { id:'positie', ic:'positie', nav:'Verwissel cijfers', title:'Verwissel de cijfers',
    tip:'Plaatswaarden: D (duizendtallen) · H (honderdtallen) · T (tientallen) · E (eenheden) , t (tienden) · h (honderdsten) · d (duizendsten).',
    cards:[
      { title:'Verwissel en vergelijk', instr:'Voer de opdracht uit, noteer het nieuwe getal en duid aan wat er gebeurt.', build:list([
        posQ('7 316','Verwissel het cijfer van de <b>duizendtallen</b> met het cijfer van de <b>eenheden</b>.', 6317, 'kleiner', 'D = 7 en E = 6 → <b>6 317</b>. 6 317 &lt; 7 316, dus het getal <b>wordt kleiner</b>.'),
        posQ('2 948,5','Verwissel het cijfer van de <b>tientallen</b> met het cijfer van de <b>tienden</b>.', 2958.4, 'groter', 'T = 4 en t = 5 → <b>2 958,4</b>. Het getal <b>wordt groter</b>.'),
        posQ('5 082,37','Verwissel het cijfer van de <b>honderdtallen</b> met het cijfer van de <b>honderdsten</b>.', 5782.3, 'groter', 'H = 0 en h = 7 → <b>5 782,30</b> (= 5 782,3). Het getal <b>wordt groter</b>.'),
        posQ('3 536','Verwissel het cijfer van de <b>duizendtallen</b> met het cijfer van de <b>tientallen</b>.', 3536, 'gelijk', 'D = 3 en T = 3 → <b>3 536</b>. Het getal <b>blijft gelijk</b>.'),
        posQ('64,209','Verwissel het cijfer van de <b>eenheden</b> met het cijfer van de <b>duizendsten</b>.', 69.204, 'groter', 'E = 4 en d = 9 → <b>69,204</b>. Het getal <b>wordt groter</b>.'),
        posQ('9 471,6','Verwissel het cijfer van de <b>duizendtallen</b> met het cijfer van de <b>tienden</b>.', 6471.9, 'kleiner', 'D = 9 en t = 6 → <b>6 471,9</b>. Het getal <b>wordt kleiner</b>.')
      ], {letters:true}) }
    ]},

  { id:'benaming', ic:'benaming', nav:'Benamingen', title:'Noteer de correcte wiskundige benaming',
    cards:[
      { title:'Reeks A', instr:'Sleep het juiste woord naar het vakje, of tik een woord aan en tik daarna op het vakje. Niet alle woorden worden gebruikt.',
        build:(b,st,save,key)=>bankEx(b,st,save,key,[
          {expr:'7 · 40 = 280', pre:'40 is', ans:'een factor', why:'De getallen die je vermenigvuldigt zijn factoren.'},
          {expr:'48 + 6 = 54', pre:'54 is', ans:'de som', why:'De uitkomst van een optelling is de som.'},
          {expr:'61 − 19 = 42', pre:'61 is', ans:'het aftrektal', why:'Het getal waarvan je aftrekt is het aftrektal.'},
          {expr:'96 : 8 = 12', pre:'8 is', ans:'de deler', why:'Het getal waardoor je deelt is de deler.'},
          {expr:'45 : 3 = 15', pre:'15 is', ans:'het quotiënt', why:'De uitkomst van een deling is het quotiënt.'}
        ], ['een term','de som','het aftrektal','de aftrekker','het verschil','een factor','het product','het deeltal','de deler','het quotiënt']) },
      { title:'Reeks B', instr:'Zelfde opdracht, andere bewerkingen.',
        build:(b,st,save,key)=>bankEx(b,st,save,key,[
          {expr:'9 · 12 = 108', pre:'108 is', ans:'het product', why:'De uitkomst van een vermenigvuldiging is het product.'},
          {expr:'23 + 17 = 40', pre:'23 is', ans:'een term', why:'De getallen die je optelt zijn termen.'},
          {expr:'70 − 26 = 44', pre:'26 is', ans:'de aftrekker', why:'Het getal dat je aftrekt is de aftrekker.'},
          {expr:'150 − 85 = 65', pre:'65 is', ans:'het verschil', why:'De uitkomst van een aftrekking is het verschil.'},
          {expr:'72 : 4 = 18', pre:'72 is', ans:'het deeltal', why:'Het getal dat je deelt is het deeltal.'}
        ], ['een term','de som','het aftrektal','de aftrekker','het verschil','een factor','het product','het deeltal','de deler','het quotiënt']) }
    ]},

  { id:'deling', ic:'deling', nav:'Deling met rest', title:'Vul de tabel aan',
    tip:'D = d · q + r (deeltal = deler · quotiënt + rest). De rest is altijd kleiner dan de deler. Is de rest 0? Dan is het een opgaande deling.',
    cards:[
      { title:'Tabel A', instr:'Vul het ontbrekende getal in en druk op Enter.', build:(b,st,save,key)=>tableEx(b,st,save,key,[
        {D:56,d:7,q:8,r:0,hide:'q'},{D:67,d:7,q:9,r:4,hide:'d'},{D:61,d:8,q:7,r:5,hide:'D'},{D:100,d:7,q:14,r:2,hide:'r'} ]) },
      { title:'Tabel B', build:(b,st,save,key)=>tableEx(b,st,save,key,[
        {D:73,d:9,q:8,r:1,hide:'r'},{D:90,d:6,q:15,r:0,hide:'d'},{D:67,d:12,q:5,r:7,hide:'D'},{D:95,d:4,q:23,r:3,hide:'q'} ]) },
      { title:'Tabel C', build:(b,st,save,key)=>tableEx(b,st,save,key,[
        {D:84,d:5,q:16,r:4,hide:'q'},{D:66,d:11,q:6,r:0,hide:'D'},{D:50,d:7,q:7,r:1,hide:'d'},{D:128,d:9,q:14,r:2,hide:'r'} ]) }
    ]},

  { id:'element', ic:'element', nav:'∈ of ∉', title:'Vul in met ∈ of ∉',
    cards:[
      { title:'∈ of ∉', build:choiceList([
        ['6 … del 42','in','42 : 6 = 7, dus 6 is een deler van 42.'],
        ['42 … del 6','out','42 is groter dan 6, dus geen deler van 6.'],
        ['1 … del 13','in','1 is een deler van elk getal.'],
        ['0 … 7ℕ','in','0 = 7 · 0, dus 0 is een veelvoud van 7.'],
        ['7 … del 0','in','0 = 7 · 0, dus 7 is een deler van 0.'],
        ['0 … del 5','out','0 is geen deler van 5: je kan niet delen door 0.'],
        ['45 … 9ℕ','in','45 = 9 · 5.'],
        ['32 … 6ℕ','out','32 : 6 = 5 rest 2.'],
        ['13 … del 39','in','39 = 3 · 13.'],
        ['−4 … 2ℕ','out','2ℕ bevat enkel natuurlijke getallen, geen negatieve.']
      ], [['in','∈'],['out','∉']], true) }
    ]},

  { id:'opsomming', ic:'opsomming', nav:'Opsomming', title:'Noteer door opsomming',
    tip:'Scheid de elementen met komma’s. Is de verzameling oneindig? Noteer de eerste elementen en sluit af met drie puntjes (…).',
    cards:[
      { title:'Verzamelingen', build:list([
        setQ('del 36', [1,2,3,4,6,9,12,18,36], 'del 36 = {1, 2, 3, 4, 6, 9, 12, 18, 36}. Zoek de delers in paren: 1·36, 2·18, 3·12, 4·9, 6·6.'),
        setQ('del 17', [1,17], '17 is een priemgetal: del 17 = {1, 17}.'),
        {html:`<span class="stmt">6ℕ =</span> ${BR('[[0]]')}`, size:'wide', check:infSetIs(i=>6*i), sol:'6ℕ = {0, 6, 12, 18, 24, …}. Vergeet 0 niet: 0 = 6 · 0.'},
        {html:`De gehele getallen die groter zijn dan −3 en kleiner dan 2. <span class="stmt">A =</span> ${BR('[[0]]')}`, size:'wide', check:setIs([-2,-1,0,1]), sol:'A = {−2, −1, 0, 1}. −3 en 2 zelf horen er niet bij.'},
        {html:`De natuurlijke getallen groter dan 5. <span class="stmt">B =</span> ${BR('[[0]]')}`, size:'wide', check:infSetIs(i=>6+i), sol:'B = {6, 7, 8, 9, …}'},
        {html:`De priemgetallen kleiner dan 20. <span class="stmt">P =</span> ${BR('[[0]]')}`, size:'wide', check:setIs([2,3,5,7,11,13,17,19]), sol:'P = {2, 3, 5, 7, 11, 13, 17, 19}. Let op: 1 is geen priemgetal.'},
        {html:`De veelvouden van 4 die kleiner zijn dan 25. <span class="stmt">V =</span> ${BR('[[0]]')}`, size:'wide', check:setIs([0,4,8,12,16,20,24]), sol:'V = {0, 4, 8, 12, 16, 20, 24}.'},
        setQ('del 45', [1,3,5,9,15,45], 'del 45 = {1, 3, 5, 9, 15, 45}.')
      ], {letters:true}) }
    ]},

  { id:'venn', ic:'venn', nav:'Venn: getallen plaatsen', title:'Venndiagram: plaats de getallen',
    cards:[
      { title:'Opgave A', build:(b,st,save,key)=>{
        const A=[1,2,3,6,9,18], B=[0,3,6,9,12,15];
        b.append(el('div','given-box','<b>Gegeven:</b> A = del 18 = {1, 2, 3, 6, 9, 18}<br>B = 3ℕ ≤ 15 = {0, 3, 6, 9, 12, 15}'));
        b.append(el('div','sub','a) Sleep de getallen naar de juiste plaats in het venndiagram.'));
        posDrag(b, st.venn||(st.venn={}), save, key+'v', {cls:'venn2', html:VENN2_HTML, zoneAt:venn2Zone, items:venn2Items(A,B)});
        b.append(el('div','sub','b) Geef door opsomming.'));
        const q = el('div'); b.append(q);
        qBlock(q, st, save, 'o1', setQ('B \\ A', [0,12,15], 'B \\ A = {0, 12, 15}: de elementen van B die niet in A zitten.'));
        qBlock(q, st, save, 'o2', setQ('A ∪ B', [0,1,2,3,6,9,12,15,18], 'A ∪ B = {0, 1, 2, 3, 6, 9, 12, 15, 18}: alle elementen van A en B samen, elk één keer.'));
        b.append(el('div','sub','c) Waar of niet waar?'));
        const g = el('div','tf-grid'); b.append(g);
        [['9 ∈ A ∩ B','w','9 zit in A én in B.'],['{0, 3} ⊂ A','n','0 is geen deler van 18, dus 0 ∉ A.'],['18 ∉ B','w','18 is groter dan 15, dus 18 zit niet in B.']]
          .forEach(([h,a,w],i)=>qChoice(g, st, save, 'w'+i, {html:h, ans:a, why:w, opts:WN}));
        vennNaast(b);
      }},
      { title:'Opgave B', build:(b,st,save,key)=>{
        const A=[1,2,4,5,10,20], B=[0,5,10,15,20,25];
        b.append(el('div','given-box','<b>Gegeven:</b> A = del 20 = {1, 2, 4, 5, 10, 20}<br>B = 5ℕ &lt; 30 = {0, 5, 10, 15, 20, 25}'));
        b.append(el('div','sub','a) Sleep de getallen naar de juiste plaats in het venndiagram.'));
        posDrag(b, st.venn||(st.venn={}), save, key+'v', {cls:'venn2', html:VENN2_HTML, zoneAt:venn2Zone, items:venn2Items(A,B)});
        b.append(el('div','sub','b) Geef door opsomming.'));
        const q = el('div'); b.append(q);
        qBlock(q, st, save, 'o1', setQ('A ∩ B', [5,10,20], 'A ∩ B = {5, 10, 20}: de elementen die in A én in B zitten.'));
        qBlock(q, st, save, 'o2', setQ('A \\ B', [1,2,4], 'A \\ B = {1, 2, 4}: de elementen van A die niet in B zitten.'));
        b.append(el('div','sub','c) Waar of niet waar?'));
        const g = el('div','tf-grid'); b.append(g);
        [['4 ∈ B \\ A','n','4 zit in A, niet in B. Dus 4 ∈ A \\ B.'],['{5, 20} ⊂ A','w','5 en 20 zijn allebei delers van 20.'],['15 ∈ A ∪ B','w','15 zit in B, dus ook in A ∪ B.']]
          .forEach(([h,a,w],i)=>qChoice(g, st, save, 'w'+i, {html:h, ans:a, why:w, opts:WN}));
        vennNaast(b);
      }}
    ]},

  { id:'kleuren', ic:'kleuren', nav:'Venn: kleuren', title:'Kleur het juiste deel van het venndiagram',
    tip:'∩ doorsnede: in beide tegelijk · ∪ unie: in minstens één van beide · \\ verschil: A \\ B is “in A, maar niet in B”. Werk bij haakjes eerst uit wat tussen de haakjes staat.',
    cards:[
      { title:'Kleur', instr:'Tik op een deel om het te kleuren (nog eens tikken = weer wit). Klik daarna op Controleer.', build:(b,st,save,key)=>{
        const grid = el('div','venn-grid'); b.append(grid);
        [
          {n:2,label:'A ∩ B', pred:(a,b)=>a&&b, hint:'A ∩ B: enkel het deel dat in A én in B ligt.'},
          {n:2,label:'A \\ B', pred:(a,b)=>a&&!b, hint:'A \\ B: het deel van A dat niet in B ligt.'},
          {n:2,label:'(A ∪ B) \\ (A ∩ B)', pred:(a,b)=>(a||b)&&!(a&&b), hint:'Eerst alles van A en B samen, dan het middelste stuk (de doorsnede) weglaten.'},
          {n:3,label:'(A ∩ B) \\ C', pred:(a,b,c)=>a&&b&&!c, hint:'Eerst A ∩ B, dan het stuk dat in C ligt weglaten.'},
          {n:3,label:'(B ∪ C) \\ A', pred:(a,b,c)=>(b||c)&&!a, hint:'Eerst alles van B en C samen, dan alles wat in A ligt weglaten.'},
          {n:3,label:'A ∩ B ∩ C', pred:(a,b,c)=>a&&b&&c, hint:'Enkel het middelste stuk: dat ligt in alle drie.'},
          {n:3,label:'C \\ (A ∪ B)', pred:(a,b,c)=>c&&!a&&!b, hint:'Het deel van C dat niet in A en ook niet in B ligt.'},
          {n:3,label:'A ∩ (B ∪ C)', pred:(a,b,c)=>a&&(b||c), hint:'Eerst B ∪ C, dan enkel het stuk daarvan dat ook in A ligt.'},
          {n:3,label:'(A ∪ B) ∩ C', pred:(a,b,c)=>(a||b)&&c, hint:'Eerst A ∪ B, dan enkel het stuk daarvan dat ook in C ligt.'}
        ].forEach((it,i)=> vennColor(grid, st, save, 'v'+i, it));
      }}
    ]},

  { id:'uitspraken', ic:'uitspraken', nav:'Waar of niet waar', title:'Waar of niet waar?', cheat:true,
    tip:'Het teken ∣ betekent “is een deler van”. Bij ≤ en ≥ mag het ook gelijk zijn.',
    cards:[
      { title:'Reeks A', build:choiceList([
        ['9 ≤ 9','w','≤ betekent “kleiner dan of gelijk aan”, en 9 is gelijk aan 9.'],
        ['−3 > −1','n','−3 ligt links van −1 op de getallenas, dus −3 < −1.'],
        ['4 is een deler van 20','w','20 : 4 = 5, zonder rest.'],
        ['30 is een deler van 6','n','Omgekeerd: 6 is een deler van 30.'],
        ['415 ∈ 5ℕ','w','415 eindigt op 5, dus het is een veelvoud van 5.'],
        ['212 ∈ 3ℕ','n','2 + 1 + 2 = 5 en dat is geen veelvoud van 3.'],
        ['2,7 ∈ ℚ','w','2,7 = 27/10, een rationaal getal.'],
        ['-12/4 ∈ ℕ','n','-12/4 = −3, en dat is negatief.'],
        ['29 is een priemgetal','w','29 heeft precies 2 delers: 1 en 29.'],
        ['51 is een priemgetal','n','51 = 3 · 17, dus 51 heeft meer dan 2 delers.'],
        ['3/8 > 2/5','n','Gelijknamig: 15/40 en 16/40, dus 3/8 < 2/5.'],
        ['4 716 is deelbaar door 3','w','4 + 7 + 1 + 6 = 18, en 18 is deelbaar door 3.']
      ], WN, true) },
      { title:'Reeks B', build:choiceList([
        ['−5 ≤ −8','n','−5 ligt rechts van −8, dus −5 > −8.'],
        ['0 > −6','w','Elk negatief getal is kleiner dan 0.'],
        ['1 is een priemgetal','n','1 heeft maar één deler. Een priemgetal heeft precies 2 delers.'],
        ['2 is een priemgetal','w','2 heeft precies 2 delers: 1 en 2. Het is het enige even priemgetal.'],
        ['8 ∣ 56','w','8 · 7 = 56, dus 8 is een deler van 56.'],
        ['12 ∣ 4','n','12 is geen deler van 4. Omgekeerd klopt het wel: 4 ∣ 12.'],
        ['7/3 < 5/2','w','Gelijknamig: 14/6 < 15/6.'],
        ['3 ∈ ℚ','w','3 = 3/1: elk geheel getal is ook rationaal.'],
        ['1,5 ∈ ℤ','n','1,5 ligt tussen 1 en 2: geen geheel getal.'],
        ['5 832 is deelbaar door 9','w','5 + 8 + 3 + 2 = 18, een veelvoud van 9.'],
        ['3 318 is deelbaar door 4','n','De laatste twee cijfers vormen 18, en 18 is niet deelbaar door 4.'],
        ['1 234 is deelbaar door 6','n','1 234 is even, maar 1 + 2 + 3 + 4 = 10 is niet deelbaar door 3. Dus ook niet door 6.']
      ], WN, true) }
    ]},

  { id:'cijfer', ic:'cijfer', nav:'Vervang x', title:'Vervang x door één cijfer', cheat:true,
    tip:'Geef alle mogelijke oplossingen, gescheiden door komma’s.',
    cards:[
      { title:'Zoek x', build:list([
        {html:'<span class="stmt">3 18x</span> is deelbaar door 5. &nbsp;x = [[0]]', hint:{titel:'Hint: gebruik het kenmerk van deelbaarheid door 5', stappen:[
          HU('<b>Kenmerk:</b> een getal is deelbaar door 5 als het eindigt op 0 of op 5.'),
          'Op welke plaats staat x in 3 18x? Het is het [[0:sm]] cijfer.',
          'Welke cijfers mag x dus zijn? x = [[1]] of x = [[2]]'],
          ans:[['laatste','eenheden','achterste'],0,5], sets:[[1,2]],
          extra:'<p>Kijk naar de tafel van 5: 5, 10, 15, 20, 25, 30, … Alle uitkomsten eindigen op 5 of op 0.</p><p>Voorbeeld: 4 27x is deelbaar door 5 als x = 0 (4 270) of x = 5 (4 275).</p>'},
        check:digitsIs([0,5]), sol:'Deelbaar door 5: eindigt op 0 of 5 → x ∈ {0, 5}.'},
        {html:'<span class="stmt">7x4</span> is deelbaar door 3. &nbsp;x = [[0]]', hint:{titel:'Hint: gebruik het kenmerk van deelbaarheid door 3', stappen:[
          HU('<b>Kenmerk:</b> een getal is deelbaar door 3 als de som van zijn cijfers deelbaar is door 3.'),
          'Tel de cijfers die je kent op: 7 + 4 = [[0]]. De som van de cijfers is dus [[1]] + x.',
          'x is een cijfer van 0 tot 9. Dan ligt de som tussen 11 + 0 = 11 en 11 + 9 = [[2]].',
          'Welke veelvouden van 3 liggen tussen 11 en 20? [[3]] , [[4]] , [[5]]',
          'Wat moet je telkens bij 11 tellen om daar te komen? Dat zijn de mogelijke x-en: [[6]] , [[7]] , [[8]]'],
          ans:[11,11,20,12,15,18,1,4,7], sets:[[3,4,5],[6,7,8]],
          extra:'<p><b>Kenmerk van deelbaarheid door 3:</b> een getal is deelbaar door 3 als de som van zijn cijfers deelbaar is door 3.</p><p>Voorbeeld: 2x5 is deelbaar door 3. De som van de cijfers is 2 + x + 5 = 7 + x. Die ligt tussen 7 en 16. De veelvouden van 3 daartussen zijn 9, 12 en 15. Dus x = 2, 5 of 8: 225, 255 en 285 zijn alle drie deelbaar door 3.</p><p>Geef altijd <b>alle</b> mogelijke cijfers, gescheiden door komma’s.</p>'},
        check:digitsIs([1,4,7]), sol:'7 + x + 4 = 11 + x moet een veelvoud van 3 zijn: 12, 15 of 18 → x ∈ {1, 4, 7}.'},
        {html:'<span class="stmt">5x6</span> is deelbaar door 4. &nbsp;x = [[0]]', hint:{titel:'Hint: gebruik het kenmerk van deelbaarheid door 4', stappen:[
          HU('<b>Kenmerk:</b> een getal is deelbaar door 4 als het getal gevormd door de <b>laatste twee cijfers</b> deelbaar is door 4.'),
          'De laatste twee cijfers van 5x6 zijn x en 6. Dat getal kan zijn: 06, 16, 26, 36, 46, 56, 66, 76, 86 of 96.',
          'De tafel van 4 tot 100: 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100.',
          'Welke van de getallen uit stap 2 staan in de tafel van 4? [[0]] , [[1]] , [[2]] , [[3]] , [[4]]',
          'Het cijfer x is telkens het eerste cijfer van die getallen.'],
          ans:[16,36,56,76,96], sets:[[0,1,2,3,4]],
          extra:'<p>Waarom alleen de laatste twee cijfers? 100 is deelbaar door 4. Dus 500 is ook deelbaar door 4, en alleen wat er na de honderdtallen komt, beslist het.</p><p>Voorbeeld: 7 312 is deelbaar door 4, want 12 is deelbaar door 4.</p>'},
        check:digitsIs([1,3,5,7,9]), sol:'De laatste twee cijfers (x6) moeten deelbaar zijn door 4: 16, 36, 56, 76, 96 → x ∈ {1, 3, 5, 7, 9}.'},
        {html:'<span class="stmt">1 &lt; x &lt; 5</span> &nbsp;x = [[0]]', check:digitsIs([2,3,4]), sol:'1 en 5 horen er zelf niet bij → x ∈ {2, 3, 4}.'},
        {html:'<span class="stmt">6x1</span> is deelbaar door 9. &nbsp;x = [[0]]', hint:{titel:'Hint: gebruik het kenmerk van deelbaarheid door 9', stappen:[
          HU('<b>Kenmerk:</b> een getal is deelbaar door 9 als de som van zijn cijfers deelbaar is door 9.'),
          'Tel de cijfers die je kent op: 6 + 1 = [[0]]. De som van de cijfers is dus [[1]] + x.',
          'x is een cijfer van 0 tot 9. Dan ligt de som tussen 7 en [[2]].',
          'Welk veelvoud van 9 ligt tussen 7 en 16? [[3]]',
          'Wat moet je bij 7 tellen om daar te komen? x = [[4]]'],
          ans:[7,7,16,9,2],
          extra:'<p><b>Kenmerk van deelbaarheid door 9:</b> een getal is deelbaar door 9 als de som van zijn cijfers deelbaar is door 9.</p><p>Voorbeeld: 3x5 is deelbaar door 9. De som is 3 + x + 5 = 8 + x, tussen 8 en 17. Het enige veelvoud van 9 daartussen is 9, dus x = 1: 315 = 9 · 35.</p>'},
        check:digitsIs([2]), sol:'6 + x + 1 = 7 + x moet een veelvoud van 9 zijn: 9 → x = 2.'},
        {html:'<span class="stmt">83x</span> gedeeld door 4 heeft als rest 1. &nbsp;x = [[0]]', hint:{titel:'Hint: rest 1 bij delen door 4', stappen:[
          HU('Rest 1 betekent: 83x is <b>1 meer</b> dan een getal uit de tafel van 4. Dus 83x − 1 is deelbaar door 4.'),
          'De getallen van 830 tot 839 die deelbaar zijn door 4 (kijk naar de laatste twee cijfers): [[0]] en [[1]]',
          'Tel er telkens 1 bij: [[2]] en [[3]]',
          'Het laatste cijfer daarvan is x.'],
          ans:[832,836,833,837], sets:[[0,1],[2,3]],
          extra:'<p><b>Kenmerk van deelbaarheid door 4:</b> kijk naar het getal gevormd door de laatste twee cijfers. 32 en 36 zijn deelbaar door 4, dus 832 en 836 ook.</p><p>Controle met een deling: 833 : 4 = 208 rest 1, want 4 · 208 = 832 en 832 + 1 = 833.</p>'},
        check:digitsIs([3,7]), sol:'833 = 4 · 208 + 1 en 837 = 4 · 209 + 1 → x ∈ {3, 7}.'},
        {html:'<span class="stmt">4x2</span> is deelbaar door 6. &nbsp;x = [[0]]', hint:{titel:'Hint: deelbaar door 6 = deelbaar door 2 én door 3', stappen:[
          HU('<b>Kenmerk:</b> een getal is deelbaar door 6 als het deelbaar is door 2 (even) <b>én</b> door 3 (som van de cijfers deelbaar door 3).'),
          'Is 4x2 even, welk cijfer x je ook kiest? Typ ja of nee: [[0:sm]]',
          'Tel de cijfers die je kent op: 4 + 2 = [[1]]. De som van de cijfers is dus [[2]] + x, tussen 6 en [[3]].',
          'Welke veelvouden van 3 liggen tussen 6 en 15 (6 en 15 tellen mee)? [[4]] , [[5]] , [[6]] , [[7]]',
          'Wat moet je telkens bij 6 tellen om daar te komen? Dat zijn de mogelijke x-en.'],
          ans:['ja',6,6,15,6,9,12,15], sets:[[4,5,6,7]],
          extra:'<p>6 = 2 · 3. Een getal dat deelbaar is door 6, is dus deelbaar door 2 én door 3. Je controleert de twee kenmerken apart.</p><p>4x2 eindigt op 2, dus het is altijd even. Dan moet je enkel nog het kenmerk van 3 controleren.</p><p>Voorbeeld: 1x4 is deelbaar door 6. Even: ja. Som 1 + x + 4 = 5 + x, tussen 5 en 14: 6, 9 of 12. Dus x = 1, 4 of 7.</p>'},
        check:digitsIs([0,3,6,9]), sol:'Het getal is even (eindigt op 2). Deelbaar door 3: 4 + x + 2 = 6 + x moet een veelvoud van 3 zijn → x ∈ {0, 3, 6, 9}.'}
      ], {letters:true}) }
    ]},

  { id:'priem', ic:'priem', nav:'Priemfactoren', title:'Ontbind in priemfactoren',
    tip:'Deel telkens door het kleinste priemgetal dat past, tot je 1 overhoudt. Noteer je antwoord als product: zet een punt tussen de factoren, bv. 2 · 2 · 3 · 5.',
    cards:[
      { title:'Ontbind', build:list([84,180,126,250,96,315].map((n,idx)=>{
        const f=factorize(n); let m=n, rows='';
        f.forEach(p=>{ rows+=`<tr><td>${m}</td><td>${p}</td></tr>`; m/=p; }); rows+=`<tr><td>1</td><td></td></tr>`;
        const q = {html:`<span class="stmt">${n} =</span> [[0]]`, size:'wide', check:factorIs(n), sol:`<table class="ladder">${rows}</table>${n} = <b>${powerForm(n)}</b>`};
        q.hint = ladderHint(n);
        if(idx===0) q.help = `<b>Gebruik een deelladder.</b> Deel ${n} door het kleinste priemgetal dat past en schrijf het quotiënt eronder. Ga zo verder tot je 1 krijgt:<table class="ladder"><tr><td>84</td><td>2</td></tr><tr><td>42</td><td>2</td></tr><tr><td>21</td><td>…</td></tr><tr><td>…</td><td>…</td></tr><tr><td>1</td><td></td></tr></table>De getallen rechts van de streep vormen samen het product.`;
        return q;
      }), {letters:true}) }
    ]},

  { id:'ggdkgv', ic:'ggdkgv', nav:'ggd en kgv', title:'Vul aan: ggd en kgv',
    tip:'ggd = grootste gemeenschappelijke deler: schrijf de delers op en zoek de grootste die overal in zit. kgv = kleinste gemeenschappelijk veelvoud (≠ 0): schrijf de veelvouden van het grootste getal op tot je er een vindt dat ook bij de andere past.',
    cards:[
      { title:'Reeks A', build:list([{...ggdQ([18,24]), hint:ggdHint([18,24])}, {...ggdQ([9,16]), hint:ggdHint([9,16])}, {...kgvQ([4,6]), hint:kgvHint([4,6])}, {...kgvQ([3,5,10]), hint:kgvHint([3,5,10])}], {letters:true}) },
      { title:'Reeks B', build:list([{...ggdQ([28,42]), hint:ggdHint([28,42])}, {...ggdQ([30,45,60]), hint:ggdHint([30,45,60])}, {...kgvQ([8,12]), hint:kgvHint([8,12])}, {...kgvQ([6,7]), hint:kgvHint([6,7])}], {letters:true}) },
      { title:'Reeks C', build:list([{...ggdQ([13,39]), hint:ggdHint([13,39])}, {...ggdQ([36,54]), hint:ggdHint([36,54])}, {...kgvQ([4,10,15]), hint:kgvHint([4,10,15])}, {...kgvQ([9,12]), hint:kgvHint([9,12])}], {letters:true}) }
    ]},

  { id:'vraagstukken', ic:'vraag', nav:'Vraagstukken', title:'Waarmee los je het vraagstuk op?',
    tip:'GGD: iets eerlijk verdelen in zo veel mogelijk gelijke groepjes, of in zo groot mogelijke gelijke stukken. KGV: wanneer valt iets opnieuw samen, of wat is het kleinste aantal dat bij beide past? Geen van beide: gewoon rekenen, bijvoorbeeld met breuken.',
    cards:[
      { title:'Vraagstukken', instr:'Stap 1: kies GGD, KGV of geen van beide. Stap 2: noteer je tussenstap. Stap 3: noteer je antwoord.', build:list([
        probQ({text:'Juf Leen heeft 24 stiften en 36 potloden. Ze maakt pakketjes met in elk pakketje evenveel stiften en evenveel potloden. Er mag niets overblijven. <b>Hoeveel pakketjes kan ze maximaal maken?</b>',
          ans:'ggd', nums:[24,36], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(12), unit:'pakketjes', mode:'numeric',
          why:'Je verdeelt in zo veel mogelijk gelijke pakketjes: dat is een GGD-vraag.', sol:'ggd(24, 36) = 12 → <b>12 pakketjes</b>, elk met 2 stiften en 3 potloden.'}),
        probQ({text:'Aan de kust knipperen twee vuurtorens. De eerste flitst om de 9 seconden, de tweede om de 12 seconden. Net flitsten ze tegelijk. <b>Na hoeveel seconden flitsen ze opnieuw tegelijk?</b>',
          ans:'kgv', nums:[9,12], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(36), unit:'seconden', mode:'numeric',
          why:'Je zoekt wanneer iets opnieuw samenvalt: dat is een KGV-vraag.', sol:'kgv(9, 12) = 36 → na <b>36 seconden</b>.'}),
        probQ({text:'Je legt rechthoekige tegeltjes van 6 cm breed en 10 cm lang, allemaal in dezelfde richting, naast en onder elkaar. Zo wil je een zo klein mogelijk vierkant vormen. <b>Hoe lang is de zijde van dat vierkant?</b>',
          ans:'kgv', nums:[6,10], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(30), unit:'cm', mode:'numeric',
          why:'De zijde moet een veelvoud zijn van 6 én van 10, en zo klein mogelijk: dat is een KGV-vraag.', sol:'kgv(6, 10) = 30 → een vierkant met zijde <b>30 cm</b> (5 tegels breed en 3 tegels hoog).'}),
        probQ({text:'Sofie eet '+fr(2,5)+' van een pizza. Haar broer eet '+fr(1,4)+' van dezelfde pizza. <b>Welk deel van de pizza blijft over?</b>',
          ans:'geen', stepHtml:`samen gegeten: ${fr(2,5)} + ${fr(1,4)} = ${FIN(0,1)}`, stepCheck:fracValue(13,20,false), si:[0,1], ai:[2,3], ansHtml:FIN(2,3), ansCheck:fracValue(7,20), unit:'van de pizza', mode:'numeric',
          why:'Hier reken je gewoon met breuken: geen ggd of kgv als eindantwoord.', sol:fr(2,5)+' + '+fr(1,4)+' = '+fr(8,20)+' + '+fr(5,20)+' = '+fr(13,20)+'. Er blijft 1 − '+fr(13,20)+' = <b>'+fr(7,20)+'</b> over.'}),
        probQ({text:'Een rechthoekige vloer is 120 cm breed en 180 cm lang. Je wil hem bedekken met zo groot mogelijke vierkante tegels, zonder te zagen. <b>Hoe lang is de zijde van één tegel?</b>',
          ans:'ggd', nums:[120,180], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(60), unit:'cm', mode:'numeric',
          why:'Zo groot mogelijke gelijke stukken die precies passen: dat is een GGD-vraag.', sol:'ggd(120, 180) = 60 → tegels van <b>60 cm</b>.'}),
        probQ({text:'In een klas zitten 28 leerlingen. '+fr(3,7)+' van de leerlingen komt met de fiets naar school. <b>Hoeveel leerlingen komen met de fiets?</b>',
          ans:'geen', stepHtml:'28 : 7 = [[0:xs]]', stepCheck:numIs(4), si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(12), unit:'leerlingen', mode:'numeric',
          why:'Je berekent een deel van een getal: geen ggd of kgv.', sol:'28 : 7 = 4, en 4 · 3 = <b>12 leerlingen</b>.'}),
        probQ({text:'Worstjes zitten per 6 in een pak, hotdogbroodjes per 8 in een zak. Je wil evenveel worstjes als broodjes kopen. <b>Hoeveel hotdogs kan je dan minimaal maken?</b>',
          ans:'kgv', nums:[6,8], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(24), unit:'hotdogs', mode:'numeric',
          why:'Het kleinste aantal dat zowel bij de pakken als bij de zakken past: dat is een KGV-vraag.', sol:'kgv(6, 8) = 24 → <b>24 hotdogs</b> (4 pakken worstjes en 3 zakken broodjes).'})
      ], {letters:true}) }
    ]},

  { id:'breukvormen', ic:'breukvorm', nav:'Gelijkwaardige breuken', title:'Vul de ontbrekende getallen in',
    tip:'Vereenvoudig eerst de breuk zo ver mogelijk. Daarna vermenigvuldig je teller en noemer met hetzelfde getal. Een percentage is een breuk met noemer 100.',
    cards:[
      { title:'Gelijkwaardige breuken', build:list([
        missingQ(`${fr(6,42)} = <span class="fr fr-in"><span class="fn">[[0]]</span><span class="fd">70</span></span> = <span class="fr fr-in"><span class="fn">3</span><span class="fd">[[1]]</span></span>`, [10,21], '6/42 = 1/7 (deel door 6). Dan 1/7 = 10/70 (×10) en 1/7 = 3/21 (×3).'),
        missingQ(`${fr(12,30)} = <span class="fr fr-in"><span class="fn">[[0]]</span><span class="fd">5</span></span> = [[1]] %`, [2,40], '12/30 = 2/5 (deel door 6). 2/5 = 40/100 = 40%.'),
        missingQ(`${fr(10,16)} = <span class="fr fr-in"><span class="fn">5</span><span class="fd">[[0]]</span></span> = <span class="fr fr-in"><span class="fn">[[1]]</span><span class="fd">40</span></span>`, [8,25], '10/16 = 5/8 (deel door 2). 5/8 = 25/40 (×5).'),
        missingQ(`${fr(36,48)} = <span class="fr fr-in"><span class="fn">[[0]]</span><span class="fd">4</span></span> = [[1]] %`, [3,75], '36/48 = 3/4 (deel door 12). 3/4 = 75/100 = 75%.'),
        missingQ(`${fr(4,50)} = <span class="fr fr-in"><span class="fn">[[0]]</span><span class="fd">25</span></span> = [[1]] %`, [2,8], '4/50 = 2/25 (deel door 2). 2/25 = 8/100 = 8%.')
      ], {letters:true}) }
    ]},

  { id:'breuken', ic:'breuken', nav:'Breuken rekenen', title:'Reken uit',
    tip:'Maak de breuken eerst gelijknamig: dat is je tussenstap. Reken dan uit en vereenvoudig je uitkomst zo ver mogelijk.',
    cards:[
      { title:'Optellen en aftrekken', build:list([
        [3,4,'+',1,6],[7,8,'-',1,3],[9,6,'-',3,4],[2,1,'+',5,9],[5,6,'+',7,10],[14,21,'-',3,9],[11,12,'-',5,8],[4,1,'-',7,3]
      ].map(fracQ), {letters:true}) }
    ]},

  { id:'implicatie', ic:'impl', nav:'Implicatiepijl', title:'Mag de implicatiepijl gebruikt worden?',
    tip:'p ⇒ q is juist als q altijd waar is wanneer p waar is. Eén tegenvoorbeeld is genoeg om te tonen dat het fout is: iets waarvoor het linkerdeel waar is, maar het rechterdeel niet. Je mag je tegenvoorbeeld ook in een zin schrijven.',
    cards:[
      { title:'Juist of fout?', instr:'Kies juist of fout. Is de uitspraak fout? Geef dan een tegenvoorbeeld.', build:list([
        implQ('x &gt; 20 ⇒ x &gt; 5', 'juist', 'Elk getal groter dan 20 is zeker groter dan 5.'),
        implQ('x &lt; 8 ⇒ x &lt; 3', 'fout', '', {pre:x=>x<8, con:x=>x<3, preT:'x < 8', conT:'x < 3'}),
        implQ('x ∈ ℤ ⇒ x ∈ ℕ', 'fout', '', {pre:x=>Number.isInteger(x), con:x=>Number.isInteger(x)&&x>=0, preT:'x ∈ ℤ', conT:'x ∈ ℕ'}),
        implQ('x ∈ 4ℕ ⇒ x ∈ 2ℕ', 'juist', 'Elk veelvoud van 4 is ook een veelvoud van 2, want 4 = 2 · 2.'),
        implQ('x ∈ 3ℕ ⇒ x ∈ 6ℕ', 'fout', '', {pre:x=>Number.isInteger(x)&&x>=0&&x%3===0, con:x=>Number.isInteger(x)&&x>=0&&x%6===0, preT:'x ∈ 3ℕ', conT:'x ∈ 6ℕ'}),
        implQ('Ik woon in Gent ⇒ ik woon in België', 'juist', 'Gent ligt in België, dus wie in Gent woont, woont altijd in België.'),
        implQ('Ik bespeel een instrument ⇒ ik speel gitaar', 'fout', '“Ik speel piano.” Dan bespeel je een instrument, maar geen gitaar.'),
        implQ('x ∈ del 6 ⇒ x ∈ del 12', 'juist', 'Elke deler van 6 (1, 2, 3, 6) is ook een deler van 12.'),
        implQ('x is deelbaar door 2 ⇒ x is deelbaar door 4', 'fout', '', {pre:x=>Number.isInteger(x)&&x%2===0, con:x=>Number.isInteger(x)&&x%4===0, preT:'x is deelbaar door 2', conT:'x is deelbaar door 4'}),
        implQ('Het is zaterdag ⇒ het is weekend', 'juist', 'Zaterdag is altijd een weekenddag.'),
        implQ('Het is weekend ⇒ het is zaterdag', 'fout', '“Het is zondag.” Dan is het weekend, maar geen zaterdag.')
      ], {letters:true}) }
    ]},

  { id:'raadsels', ic:'raadsel', nav:'Welke getallen?', title:'Welke 3 getallen zoeken we?',
    cards:[
      { title:'Getallenraadsels', instr:'Vul de drie getallen in. De volgorde maakt niet uit.', build:list([
        threeQ('Het product van drie verschillende natuurlijke getallen is 30. De som van deze getallen is 10.', [2,3,5], 'Drietallen met product 30: 1·2·15, 1·3·10, 1·5·6 en 2·3·5. Enkel 2 + 3 + 5 = 10 → <b>2, 3 en 5</b>.', RH.product30),
        threeQ('De som van drie opeenvolgende natuurlijke getallen is 42.', [13,14,15], '42 : 3 = 14 is het middelste getal → <b>13, 14 en 15</b>.', RH.som42),
        threeQ('Het kgv van drie verschillende getallen is 24. Het middelste getal is het dubbel van het kleinste. Het grootste getal is het dubbel van het middelste.', [6,12,24], 'Het grootste getal is een veelvoud van de andere twee, dus het kgv is het grootste getal: 24. Dan is het middelste 12 en het kleinste 6 → <b>6, 12 en 24</b>.', RH.kgv24),
        threeQ('De ggd van drie verschillende natuurlijke getallen (groter dan 0) is 5. Alle drie zijn ze kleiner dan 20. Hun som is 30.', [5,10,15], 'Het zijn veelvouden van 5 kleiner dan 20: 5, 10 en 15. Controle: 5 + 10 + 15 = 30 en ggd(5, 10, 15) = 5 → <b>5, 10 en 15</b>.', RH.ggd5)
      ], {letters:true}) }
    ]},

  { id:'fout', ic:'fout', nav:'Zoek de fout', title:'Zoek de fout',
    tip:'In elke oplossing zit precies één fout. Klik op de eerste stap die fout is. Daarna verbeter je die stap.',
    cards:[
      { title:'Foute oplossingen', build:(b,st,save,key)=>{
        const E = [
          {task:'Ontbind 180 in priemfactoren.', lines:['180 : 2 = 90','90 : 2 = 45','45 : 3 = 15','15 : 3 = 5','5 : 5 = 1','180 = 2 · 2 · 3 · 5'], wrong:5,
            why:'In de ladder staan de delers 2, 2, 3, 3 en 5, maar in het product ontbreekt een factor 3.', fix:'180 = [[0:wide]]', fixCheck:factorIs(180), fixSol:'180 = 2 · 2 · 3 · 3 · 5'},
          {task:'Bereken kgv(8, 12).', lines:['Veelvouden van 8: 8, 16, 24, 32, 40, 48, …','Veelvouden van 12: 12, 24, 36, 48, …','Gemeenschappelijke veelvouden: 24, 48, …','kgv(8, 12) = 48'], wrong:3,
            why:'Het kgv is het kleinste gemeenschappelijke veelvoud.', fix:'kgv(8, 12) = [[0:xs]]', mode:'numeric', fixCheck:numIs(24), fixSol:'kgv(8, 12) = 24'},
          {task:'Bereken '+fr(3,4)+' − '+fr(1,6)+'.', lines:['kgv(4, 6) = 12', fr(3,4)+' = '+fr(9,12), fr(1,6)+' = '+fr(3,12), fr(9,12)+' − '+fr(3,12)+' = '+fr(6,12)+' = '+fr(1,2)], wrong:2,
            why:'12 : 6 = 2, dus teller én noemer moeten maal 2.', fix:`${fr(1,6)} = <span class="fr fr-in"><span class="fn">[[0:sm]]</span><span class="fd">12</span></span>`, mode:'numeric', fixCheck:numIs(2), fixSol:fr(1,6)+' = '+fr(2,12)+', en dan is '+fr(9,12)+' − '+fr(2,12)+' = '+fr(7,12)+'.'},
          {task:'Bereken ggd(18, 30).', lines:['del 18 = {1, 2, 3, 6, 9, 18}','del 30 = {1, 2, 3, 5, 6, 10, 15, 30}','Gemeenschappelijke delers: 1, 2, 3, 6, 9','ggd(18, 30) = 9'], wrong:2,
            why:'9 is geen deler van 30.', fix:`Gemeenschappelijke delers: ${BR('[[0:wide]]')}`, fixCheck:setIs([1,2,3,6]), fixSol:'Gemeenschappelijke delers: {1, 2, 3, 6}, dus ggd(18, 30) = 6.'},
          {task:'Is 7 452 deelbaar door 6?', lines:['7 452 is even, dus deelbaar door 2.','7 + 4 + 5 + 2 = 17','17 is niet deelbaar door 3, dus 7 452 is niet deelbaar door 3.','Besluit: 7 452 is niet deelbaar door 6.'], wrong:1,
            why:'De som van de cijfers is fout berekend.', fix:'7 + 4 + 5 + 2 = [[0:xs]]', mode:'numeric', fixCheck:numIs(18), fixSol:'7 + 4 + 5 + 2 = 18. 18 is deelbaar door 3, dus 7 452 is wél deelbaar door 6.'},
          {task:'Vorm het kleinste natuurlijk getal van 4 verschillende cijfers.', lines:['De vier kleinste cijfers zijn 0, 1, 2 en 3.','Van klein naar groot: 0, 1, 2, 3.','Het kleinste getal is 0123 = 123.'], wrong:2,
            why:'Met 0 vooraan heb je maar een getal van 3 cijfers.', fix:'Het kleinste natuurlijk getal is [[0]]', mode:'numeric', fixCheck:numIs(1023), fixSol:'Zet het kleinste cijfer dat geen 0 is vooraan: 1023.'},
          {task:'D = 59 en d = 7. Bereken q en r.', lines:['7 · 8 = 56','59 − 56 = 3','q = 8 en r = 3','Controle: 7 · 8 + 3 = 58'], wrong:3,
            why:'De controle is fout uitgerekend.', fix:'7 · 8 + 3 = [[0:xs]]', mode:'numeric', fixCheck:numIs(59), fixSol:'7 · 8 + 3 = 56 + 3 = 59 = D. De deling klopt dus.'},
          {task:'Is de implicatie x ∈ 2ℕ ⇒ x ∈ 4ℕ juist?', lines:['Neem x = 8: 8 ∈ 2ℕ en 8 ∈ 4ℕ.','Neem x = 12: 12 ∈ 2ℕ en 12 ∈ 4ℕ.','Besluit: de implicatie is juist.'], wrong:2,
            why:'Een paar voorbeelden bewijzen niets. Eén tegenvoorbeeld is genoeg om te tonen dat het fout is.', fix:'Geef een tegenvoorbeeld: x = [[0:xs]]', mode:'numeric',
            fixCheck:v=>{ const x=pickNumber(v[0]); return {ok:Number.isInteger(x)&&x>=0&&x%2===0&&x%4!==0}; }, fixSol:'x = 6: 6 ∈ 2ℕ, maar 6 ∉ 4ℕ. De implicatie is dus fout.'}
        ];
        E.forEach((e,i)=>errBlock(b, st, save, 'e'+i, Object.assign({nr:LET[i]+'.'}, e)));
      }}
    ]},

  { id:'toets1', ic:'toets', nav:'Proeftoets 1', title:'Proeftoets 1',
    tip:'19 vragen: één per onderdeel. Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Werk op kladpapier en zonder spiekbriefje.',
    cards:[ { title:'Proeftoets 1', build:(b,st,save,key)=>proeftoets(b,st,save,key,TOETSEN[0]) } ] },
  { id:'toets2', ic:'toets', nav:'Proeftoets 2', title:'Proeftoets 2',
    tip:'19 vragen: één per onderdeel. Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Werk op kladpapier en zonder spiekbriefje.',
    cards:[ { title:'Proeftoets 2', build:(b,st,save,key)=>proeftoets(b,st,save,key,TOETSEN[1]) } ] },
  { id:'toets3', ic:'toets', nav:'Proeftoets 3', title:'Proeftoets 3',
    tip:'19 vragen: één per onderdeel. Je krijgt pas feedback als je op “Verbeter mijn proeftoets” klikt. Werk op kladpapier en zonder spiekbriefje.',
    cards:[ { title:'Proeftoets 3', build:(b,st,save,key)=>proeftoets(b,st,save,key,TOETSEN[2]) } ] }
];

/* ============================================================
   UITBREIDING: niveaus, verdieping en indeling volgens de cursus
   ============================================================ */
const LVL = {1:'<span class="lvl-badge l1">basis</span>', 2:'<span class="lvl-badge l2">oefenen</span>', 3:'<span class="lvl-badge l3">verdieping</span>'};
const N0 = 'ℕ<sub>0</sub>', Z0 = 'ℤ<sub>0</sub>', ZP = 'ℤ<sup>+</sup>', ZM = 'ℤ<sup>−</sup>', QP = 'ℚ<sup>+</sup>', QM = 'ℚ<sup>−</sup>';
const delOf = n => divisors(n);
const inter = (a,b) => a.filter(x=>b.includes(x));
const minus = (a,b) => a.filter(x=>!b.includes(x));
const union = (a,b) => [...new Set([...a,...b])].sort((x,y)=>x-y);
const multUnion = (ps, i) => { const r=[]; for(let k=0; r.length<=i; k++) if(ps.some(p=>k%p===0)) r.push(k); return r[i]; };
const emptyIs = v => { const s=String(v[0]).replace(/\s+/g,''); if(s==='∅'||s===''||s==='{}'||/^leeg/i.test(s)||s==='Ø'||s==='ø') return {ok:true}; return {ok:false, msg:'Er zijn geen gemeenschappelijke elementen.'}; };

/* meerdere juiste antwoorden aanduiden */
function multiQ(parent, st, save, id, q){
  const row = el('div','q'); const qid = QID(id); CLvraag(qid);
  row.append(el('div','q-text', (q.nr?`<span class="q-num">${q.nr}</span>`:'') + `<span>${q.html}</span>`));
  const wrap = el('div','choices');
  const btns = q.opts.map((lab,i)=>{ const b=el('button','opt',lab); b.type='button'; b.dataset.i=i; wrap.append(b); return b; });
  const act = el('div','q-act'); const go = el('button','btn','Controleer'); go.type='button'; act.append(go);
  const fb = el('div','fb');
  row.append(wrap, act, fb); parent.append(row);
  const s = st[id] || (st[id] = {sel:[], checked:false});
  const paint = ()=> btns.forEach((b,i)=>{ b.classList.toggle('chosen', s.sel.includes(i)); b.classList.remove('good','wrong'); });
  btns.forEach((b,i)=> b.addEventListener('click', ()=>{ s.sel = s.sel.includes(i) ? s.sel.filter(x=>x!==i) : [...s.sel, i]; s.checked=false; save(); paint(); fb.textContent=''; fb.className='fb'; }));
  function run(){
    paint();
    const ok = q.ans.length===s.sel.length && q.ans.every(i=>s.sel.includes(i));
    btns.forEach((b,i)=>{ if(s.sel.includes(i)) b.classList.add(q.ans.includes(i)?'good':'wrong'); });
    const missed = q.ans.filter(i=>!s.sel.includes(i)).length;
    fb.className = 'fb '+(ok?'ok':'bad');
    fb.innerHTML = ok ? '✅ Juist! ' + (q.why||'') : '❌ Nog niet juist. ' + (missed ? `Je mist nog ${missed===1?'een juist antwoord':missed+' juiste antwoorden'}. ` : '') + (s.sel.some(i=>!q.ans.includes(i)) ? 'De rode keuzes zijn fout.' : '');
    s.checked = true; save(); CLres(qid, ok);
  }
  go.addEventListener('click', run);
  paint(); if(s.checked) run();
}
const multiList = items => (b, st, save, key) => items.forEach((q,i)=> multiQ(b, st, save, key+'_'+i, Object.assign({nr:LET[i]+'.'}, q)));

/* bewerking met uitkomst noteren, bv. 21:3=7 */
const normOp = s => String(s).toLowerCase().replace(/\s+/g,'').replace(/[−–]/g,'-').replace(/[x*×·•∙]/g,'.').replace(/[/÷]/g,':');
function opQ(text, a, op, b, res, sol){
  const sym = {'+':'+','-':'-','.':'.',':':':'}[op];
  const ok = [`${a}${sym}${b}=${res}`]; if(op==='+'||op==='.') ok.push(`${b}${sym}${a}=${res}`);
  const show = `${a} ${op==='.'?'·':op==='-'?'−':op} ${b} = ${res}`;
  return { html:text, block:true, html2:'[[0]]', size:'wide', sol: sol || show,
    check: v=>{ const t = normOp(v[0]).replace(/(\d)\.(?=\d{3}(\D|$))/g,'$1');
      if(!t.includes('=')) return {ok:false, info:true, msg:'Noteer de bewerking én de uitkomst, bv. 21 : 3 = 7.'};
      if(ok.includes(t)) return {ok:true};
      const [l, r] = t.split('=');
      if(parseNum(r)===res) return {ok:false, msg:'Je uitkomst klopt, maar de bewerking nog niet.'};
      return {ok:false}; } };
}

/* Romeinse cijfers */
const ROM = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
const toRom = n => ROM.reduce((s,[v,r])=>{ while(n>=v){ s+=r; n-=v; } return s; }, '');
const romSol = n => { const parts=[]; let m=n; ROM.forEach(([v,r])=>{ while(m>=v){ parts.push(`${r} = ${v}`); m-=v; } }); return parts.join(' · ') + ` → <b>${toRom(n)} = ${n}</b>`; };

/* ggd en kgv via priemfactoren */
function pfSol(nums, kind){
  const lines = nums.map(n=>`${n} = ${powerForm(n)}`).join('<br>');
  const r = kind==='ggd' ? nums.reduce(gcd) : nums.reduce(lcm);
  const how = kind==='ggd' ? 'Neem de priemfactoren die in elk getal voorkomen, zo vaak als ze in elk getal minstens voorkomen.' : 'Neem elke priemfactor die voorkomt, zo vaak als hij hoogstens in één getal voorkomt.';
  return `${lines}<br>${how}<br>${kind}(${nums.join(', ')}) = ${r>1?powerForm(r)+' = ':''}<b>${r}</b>`;
}
const pfQ = (nums, kind) => ({html:`${kind}(${nums.join(', ')}) = [[0]]`, mode:'numeric', size:'sm', check:numIs(kind==='ggd'?nums.reduce(gcd):nums.reduce(lcm)), sol:pfSol(nums, kind)});
function euclidQ(a, b){
  if(a<b) [a,b]=[b,a];
  const steps=[`ggd(${a}, ${b})`]; let x=a, y=b;
  while(y){ const r=x%y; steps.push(`= ggd(${y}, ${r}) <span class="unit">${x} : ${y} = ${Math.floor(x/y)} rest ${r}</span>`); x=y; y=r; }
  steps.push(`= <b>${x}</b>`);
  return {html:`ggd(${b}, ${a}) = [[0]]`, mode:'numeric', size:'sm', check:numIs(gcd(a,b)), sol:steps.join('<br>')};
}

/* ---------- nieuwe kaarten ---------- */
const NEW = {
  /* 1. Talstelsels */
  vormen: { title:'Kleinste en grootste getal', lvl:2,
    instr:'Gebruik elk cijfer precies één keer. Voor het grootste getal zet je de cijfers van groot naar klein. Voor het kleinste getal mag je een komma gebruiken: het kleinste cijfer vóór de komma, de rest erna van klein naar groot.',
    build:list([
      [[5,4,3,2],'2,345',5432,'Met de cijfers <b>5, 4, 3 en 2</b>.'],
      [[0,6,2,8],'0,268',8620,'Met de cijfers <b>0, 6, 2 en 8</b>.'],
      [[6,2,9],'2,69',962,'Met de cijfers <b>6, 2 en 9</b>.'],
      [null,'0,123',9876,'Met <b>4 verschillende cijfers</b> naar keuze.'],
      [null,'0,1234',98765,'Met <b>5 verschillende cijfers</b> naar keuze.']
    ].map(([d,sm,lg,txt])=>({ html:`${txt}<br>Kleinste getal: [[0:md]] &nbsp; Grootste getal: [[1:md]]`, block:true,
      sol:`Kleinste getal: <b>${sm}</b> · grootste getal: <b>${String(lg).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}</b>`,
      check:v=>{ const f=[parseNum(v[0])===parseNum(sm), parseNum(v[1])===lg]; return {ok:f[0]&&f[1], fields:f, msg: f[0]||f[1] ? 'Eén van de twee getallen klopt al.' : ''}; } })), {letters:true}) },
  vergelijk: { title:'Welke uitspraken zijn waar?', lvl:2, build:choiceList([
    ['−12,4848 < −12,49','n','−12,49 ligt verder van 0 dan −12,4848, dus −12,49 is het kleinste: −12,4848 > −12,49.'],
    ['23 787 > 23 778','w','Vergelijk cijfer per cijfer: bij de tientallen is 8 > 7.'],
    ['45 545 ⩽ 45 454','n','Bij de honderdtallen is 5 > 4, dus 45 545 > 45 454.'],
    ['3/8 = 0,375','w','3 : 8 = 0,375.'],
    ['−4 < −9','n','−4 ligt rechts van −9 op de getallenas, dus −4 > −9.'],
    ['17 ⩽ 17','w','⩽ betekent “kleiner dan of gelijk aan”.'],
    ['0,628 ⩾ −0,629','w','Een positief getal is altijd groter dan een negatief getal.'],
    ['12/5 < 13/6','n','12/5 = 2,4 en 13/6 ≈ 2,17, dus 12/5 > 13/6.'],
    ['2/5 ⩽ 3/7','w','Gelijknamig: 14/35 ⩽ 15/35.'],
    ['−23 > −24 > −25','w','Op de getallenas ligt −23 rechts van −24, en −24 rechts van −25.']
  ], WN, true) },
  vEven: { title:'Getallen vormen met voorwaarden', lvl:3, build:list([
    {html:'Het kleinste even natuurlijk getal van 5 cijfers. [[0:md]]', mode:'numeric', check:numIs(10000), sol:'Het kleinste getal van 5 cijfers is 10 000, en dat is even → <b>10 000</b>.'},
    {html:'Het grootste oneven natuurlijk getal van vier verschillende cijfers. [[0:md]]', mode:'numeric', check:numIs(9875), sol:'Begin met 9, 8, 7. Het laatste cijfer moet oneven zijn en mag nog niet gebruikt zijn: 5 → <b>9 875</b>.'},
    {html:'Het kleinste even natuurlijk getal met de cijfers 3, 4, 5 en 7 (elk precies één keer). [[0:md]]', mode:'numeric', check:numIs(3574), sol:'Even: het laatste cijfer moet 4 zijn. Zet de andere cijfers van klein naar groot vooraan → <b>3 574</b>.'},
    {html:'Het grootste oneven getal met de cijfers 2, 5, 6 en 8 (elk precies één keer). [[0:md]]', mode:'numeric', check:numIs(8625), sol:'Oneven: het laatste cijfer moet 5 zijn. Zet de andere cijfers van groot naar klein vooraan → <b>8 625</b>.'},
    {html:'Het grootste getal van 3 cijfers met de cijfers 1, 4 en 6 (elk één keer) dat deelbaar is door 4. [[0:md]]', mode:'numeric', check:numIs(416), sol:'Mogelijke getallen: 146, 164, 416, 461, 614, 641. Deelbaar door 4 (laatste twee cijfers): 164 en 416. Het grootste is <b>416</b>.'}
  ], {letters:true}) },
  vPuzzel: { title:'Puzzelen met cijfers', lvl:3, build:list([
    {html:'Met de cijfers 3, 0 en 8 (elk precies één keer) vorm je alle natuurlijke getallen van drie cijfers. Rangschik ze van klein naar groot.<br>[[0:sm]] &lt; [[1:sm]] &lt; [[2:sm]] &lt; [[3:sm]]', block:true, mode:'numeric',
      sol:'Een getal van drie cijfers begint niet met 0: <b>308 &lt; 380 &lt; 803 &lt; 830</b>.',
      check:v=>{ const t=[308,380,803,830]; const f=v.map((x,i)=>parseNum(x)===t[i]); return {ok:f.every(Boolean), fields:f}; }},
    {html:'Een natuurlijk getal bestaat uit 5 verschillende cijfers. De cijfers 2, 5 en 7 komen er zeker in voor. Wat is het verschil van het grootste en het kleinste getal dat je zo kan vormen?<br>Grootste: [[0:md]] &nbsp; Kleinste: [[1:md]] &nbsp; Verschil: [[2:md]]', block:true, mode:'numeric',
      sol:'Grootste: kies er 9 en 8 bij → 98 752. Kleinste: kies er 0 en 1 bij, maar 0 mag niet vooraan → 10 257.<br>Verschil: 98 752 − 10 257 = <b>88 495</b>.',
      check:v=>{ const t=[98752,10257,88495]; const f=v.map((x,i)=>parseNum(x)===t[i]); return {ok:f.every(Boolean), fields:f}; }}
  ], {letters:true}) },
  vRomeins: { title:'Romeinse cijfers', lvl:3,
    instr:'I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Staat een kleiner teken vóór een groter, dan trek je het af: IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900.',
    build:list([
      ...['MCMXLVIII','CDLXXIX','MMXXIV'].map(r=>{ const n=ROM_PARSE(r); return {html:`Een gevel toont het bouwjaar <span class="stmt">${r}</span>. Welk jaar is dat? [[0:sm]]`, mode:'numeric', check:numIs(n), sol:romSol(n)}; }),
      ...[1789, 944, 2026].map(n=>({html:`Schrijf <span class="stmt">${n.toLocaleString('nl-BE').replace('.',' ')}</span> in Romeinse cijfers. [[0:md]]`, sol:romSol(n),
        check:v=>{ const t=String(v[0]).toUpperCase().replace(/\s+/g,''); if(!/^[IVXLCDM]+$/.test(t)) return {ok:false, msg:'Gebruik enkel de letters I, V, X, L, C, D en M.'}; if(t===toRom(n)) return {ok:true}; if(ROM_PARSE(t)===n) return {ok:false, info:true, msg:'De waarde klopt, maar zo schrijf je het niet: gebruik de kortste schrijfwijze (bv. IV in plaats van IIII).'}; return {ok:false}; }}))
    ], {letters:true}) },

  /* 2. Soorten getallen */
  inSub: (title, items, lvl) => ({ title, lvl, build:choiceList(items, WN, true) }),
  vNotatie: { title:'Markeer de juiste uitspraken', lvl:3,
    instr:`${N0} = ℕ zonder 0 · ${ZP} = de positieve gehele getallen (met 0) · ${ZM} = de negatieve gehele getallen (met 0) · ${QP} en ${QM} op dezelfde manier. ⊄ betekent “is geen deelverzameling van”.`,
    build:choiceList([
      ['7 ∉ ℚ','n','7 = 7/1, dus 7 ∈ ℚ.'],
      [`${ZP} ⊂ ℤ`,'w','Elk positief geheel getal is een geheel getal.'],
      ['−3,5 ∈ ℤ','n','−3,5 ligt tussen −4 en −3: geen geheel getal.'],
      ['{3, 5, 7, 9} ⊂ ℕ','w','Alle elementen zijn natuurlijke getallen.'],
      [`−12/4 ∈ ${ZM}`,'w','−12/4 = −3, een negatief geheel getal.'],
      [`ℕ ⊄ ${QP}`,'n',`Elk natuurlijk getal is een positief rationaal getal, dus ℕ ⊂ ${QP}.`],
      [`0 ∈ ${N0}`,'n',`${N0} is ℕ zonder 0.`],
      ['ℤ ⊂ ℚ','w','Elk geheel getal kan je als breuk schrijven, bv. −3 = −3/1.'],
      [`0 ∈ ${ZM}`,'w',`0 hoort zowel bij ${ZP} als bij ${ZM}.`],
      [`−1/2 ∈ ${QP}`,'n','−1/2 is negatief.']
    ], WN, true) },
  vRedeneer: { title:'Waar of niet waar? Denk na', lvl:3, build:choiceList([
    ['Als je een natuurlijk getal deelt door een natuurlijk getal (niet 0), dan is het quotiënt een positief rationaal getal.','w','Het quotiënt is een breuk van twee natuurlijke getallen, en die is nooit negatief.'],
    ['Elk geheel getal is ook een natuurlijk getal.','n','Tegenvoorbeeld: −2 ∈ ℤ, maar −2 ∉ ℕ.'],
    ['Elk rationaal getal heeft een eindig aantal cijfers na de komma.','n','Tegenvoorbeeld: 1/3 = 0,333…'],
    ['Als bij een positieve breuk de teller groter is dan de noemer, dan is de breuk groter dan 1.','w','Bv. 7/5 = 1,4. Je deelt een getal door een kleiner positief getal.'],
    ['Het tegengestelde van een natuurlijk getal is altijd een geheel getal.','w','Bv. het tegengestelde van 6 is −6, en dat is een geheel getal.'],
    ['Tussen twee verschillende gehele getallen ligt altijd nog een ander geheel getal.','n','Tegenvoorbeeld: tussen 3 en 4 ligt geen geheel getal.'],
    ['Tussen twee verschillende rationale getallen ligt altijd nog een ander rationaal getal.','w','Neem bijvoorbeeld het gemiddelde van de twee getallen.']
  ], WN) },
  vVoorwaarden: { title:'Opsomming met voorwaarden', lvl:3,
    instr:`Noteer alle getallen die tegelijk aan alle voorwaarden voldoen. Let op: 0 hoort bij ${ZP}, ${ZM}, ${QP} en ${QM}.`,
    build:list([
      {html:`x ∈ ℤ en x ∉ ${ZP} en x &gt; −4 &nbsp; ${BR('[[0]]')}`, size:'wide', check:setIs([-3,-2,-1]), sol:`x ∉ ${ZP}: x is negatief (niet 0). Groter dan −4 → <b>{−3, −2, −1}</b>.`},
      {html:`x ∈ ${N0} en x ⩽ 6 &nbsp; ${BR('[[0]]')}`, size:'wide', check:setIs([1,2,3,4,5,6]), sol:'<b>{1, 2, 3, 4, 5, 6}</b>: 0 hoort er niet bij.'},
      {html:`x ∈ ℤ en −2 ⩽ x &lt; 3 &nbsp; ${BR('[[0]]')}`, size:'wide', check:setIs([-2,-1,0,1,2]), sol:'−2 hoort erbij, 3 niet → <b>{−2, −1, 0, 1, 2}</b>.'},
      {html:`x ∉ ${QM} en x ∈ ℤ en x &lt; 4 &nbsp; ${BR('[[0]]')}`, size:'wide', check:setIs([1,2,3]), sol:`x ∉ ${QM}: x is strikt positief (0 hoort bij ${QM}). → <b>{1, 2, 3}</b>.`},
      {html:`x ∈ del 12 en x &gt; 3 &nbsp; ${BR('[[0]]')}`, size:'wide', check:setIs([4,6,12]), sol:'del 12 = {1, 2, 3, 4, 6, 12} → <b>{4, 6, 12}</b>.'}
    ], {letters:true}) },

  /* 3. Hoofdbewerkingen */
  vTermen: { title:'Redeneer met de vaktermen', lvl:3, instr:'Bereken uit het hoofd en vul aan.', build:list([
    {html:'De som van twee getallen is 153. De eerste term is 38. De tweede term is [[0:sm]].', mode:'numeric', check:numIs(115), sol:'153 − 38 = <b>115</b>'},
    {html:'Het product is gelijk aan de eerste factor. De tweede factor is [[0:sm]].', mode:'numeric', check:numIs(1), sol:'a · <b>1</b> = a'},
    {html:'De deler is een derde van het deeltal. Het quotiënt is [[0:sm]].', mode:'numeric', check:numIs(3), sol:'Bv. 30 : 10 = <b>3</b>'},
    {html:'Het quotiënt is gelijk aan het deeltal (dat niet 0 is). De deler is [[0:sm]].', mode:'numeric', check:numIs(1), sol:'a : <b>1</b> = a'},
    {html:'Het product is gelijk aan de som van 7 en 21. De eerste factor is 4. De tweede factor is [[0:sm]].', mode:'numeric', check:numIs(7), sol:'7 + 21 = 28 en 28 : 4 = <b>7</b>'},
    {html:'Het verschil is gelijk aan het aftrektal. De aftrekker is [[0:sm]].', mode:'numeric', check:numIs(0), sol:'a − <b>0</b> = a'},
    {html:'Het verschil is 0 en het aftrektal is 47. De aftrekker is [[0:sm]].', mode:'numeric', check:numIs(47), sol:'47 − <b>47</b> = 0'},
    {html:'Het quotiënt is 1 en de deler is 23. Het deeltal is [[0:sm]].', mode:'numeric', check:numIs(23), sol:'<b>23</b> : 23 = 1'}
  ], {letters:true}) },
  vRest: { title:'Redeneer met D = d · q + r', lvl:3, build:list([
    {html:'Bij een deling door 9 is het quotiënt 14 en de rest 5. Het deeltal is [[0:sm]].', mode:'numeric', check:numIs(131), sol:'D = 9 · 14 + 5 = <b>131</b>'},
    {html:'Wat is de grootste rest die je kan krijgen bij een deling door 8? [[0:sm]]', mode:'numeric', check:numIs(7), sol:'De rest is altijd kleiner dan de deler → <b>7</b>.'},
    {html:'Het deeltal is 100, de deler is 8 en de rest is 4. Het quotiënt is [[0:sm]].', mode:'numeric', check:numIs(12), sol:'100 − 4 = 96 en 96 : 8 = <b>12</b>'},
    {html:'Het deeltal is 75, het quotiënt is 8 en de rest is 3. De deler is [[0:sm]].', mode:'numeric', check:numIs(9), sol:'75 − 3 = 72 en 72 : 8 = <b>9</b>. Controle: 3 &lt; 9.'},
    {html:'Een getal gedeeld door 7 geeft rest 3. Welke rest krijg je als je het dubbele van dat getal deelt door 7? [[0:sm]]', mode:'numeric', check:numIs(6), sol:'Bv. 10 = 7 · 1 + 3 en 20 = 7 · 2 + <b>6</b>.'},
    {html:'Een getal gedeeld door 5 geeft rest 4. Welke rest krijg je als je dat getal + 3 deelt door 5? [[0:sm]]', mode:'numeric', check:numIs(2), sol:'Bv. 9 + 3 = 12 = 5 · 2 + <b>2</b>.'}
  ], {letters:true}) },
  bwKies: { title:'Welke bewerking heb je nodig?', lvl:1, build:(b,st,save,key)=>{
    const opts=[['+','optelling (+)'],['-','aftrekking (−)'],['.','vermenigvuldiging (·)'],[':','deling (:)']];
    const W={'+':'Je telt dingen samen.','-':'Je neemt iets weg of zoekt een verschil.','.':'Je neemt telkens evenveel, meerdere keren.',':':'Je verdeelt eerlijk of zoekt hoeveel keer iets erin past.'};
    [['Je verzamelt zegeltjes van twee weken en telt ze samen.','+'],
     ['Er zaten 210 appels in een krat. Er worden er 45 verkocht. Hoeveel blijven er over?','-'],
     ['5 dozen met elk 12 flesjes water: hoeveel flesjes zijn er in totaal?','.'],
     ['36 koekjes eerlijk verdelen over 4 vriendinnen.',':'],
     ['Je hebt twee spaarpotten en wil weten hoeveel geld je in totaal hebt.','+'],
     ['Het verschil in aantal volgers tussen twee kanalen berekenen.','-'],
     ['Een bakker maakt elke dag 6 taarten, 7 dagen na elkaar.','.'],
     ['Een lint van 96 cm knip je in stukken van 8 cm. Hoeveel stukken zijn er?',':'],
     ['Een team had 88 punten en verliest er 19 in de laatste ronde.','-'],
     ['Een school ontvangt twee dozen knikkers en telt het totaal.','+']
    ].forEach(([t,a],i)=> qChoice(b, st, save, key+'_'+i, {html:t, ans:a, opts, why:W[a], nr:(i+1)+'.'}));
  } },
  bwVraag: { title:'Los de vraagstukjes op', lvl:2, instr:'Vul telkens het antwoord in.', build:list([
    ['Nora las dit weekend 138 bladzijden van haar boek. Vandaag las ze er nog 27 bij. Hoeveel bladzijden heeft ze in totaal gelezen?', '138 + 27', 165, 'bladzijden'],
    ['Emma had 96 euro gespaard. Ze kocht een fietsbel van 27 euro. Hoeveel geld heeft ze nog over?', '96 − 27', 69, 'euro'],
    ['Een klas van 24 leerlingen brengt elk 3 euro mee voor een uitstap. Hoeveel euro is dat in totaal?', '24 · 3', 72, 'euro'],
    ['Juf Sarah verdeelt 84 kleurpotloden eerlijk over 6 tafelgroepjes. Hoeveel potloden krijgt elk groepje?', '84 : 6', 14, 'potloden']
  ].map(([t,op,a,u])=>({html:`${t}<br>[[0:sm]] <span class="unit">${u}</span>`, block:true, mode:'numeric', check:numIs(a), sol:`${op} = <b>${a}</b> ${u}`})), {letters:true}) },
  bwNoteer: { title:'Noteer de bewerking én de uitkomst', lvl:2,
    instr:'Schrijf één bewerking met de uitkomst, bv. <b>21 : 3 = 7</b>. Voor “maal” mag je een punt, x of * gebruiken.',
    build:list([
      opQ('Nisa verdeelt haar 21 snoepjes eerlijk tussen zichzelf en haar 2 vriendinnen. Hoeveel snoepjes krijgt ieder?', 21, ':', 3, 7),
      opQ('Op een schoolreis zijn er 6 bussen met elk 28 leerlingen. Hoeveel leerlingen gaan er mee?', 6, '.', 28, 168),
      opQ('Liam spaarde 156 euro. Voor zijn verjaardag kreeg hij er 45 euro bij. Hoeveel euro heeft hij nu?', 156, '+', 45, 201),
      opQ('Een bioscoopzaal heeft 180 plaatsen. Er zijn al 127 tickets verkocht. Hoeveel plaatsen zijn er nog vrij?', 180, '-', 127, 53)
    ], {letters:true}) },
  bwStappen: { title:'Vraagstukken in meerdere stappen', lvl:3, instr:'Werk op kladpapier. Noteer enkel je eindantwoord.', build:list([
    ['In een zaal staan 245 tafels met elk 4 poten. Onder elke poot kleef je een viltdopje van 3 euro. Hoeveel kost dat in totaal?', '245 · 4 = 980 poten<br>980 · 3 = <b>2 940</b> euro', 2940, 'euro'],
    ['Een hart klopt gemiddeld 72 keer per minuut. Hoeveel keer klopt het op één dag?', '24 · 60 = 1 440 minuten<br>1 440 · 72 = <b>103 680</b> keer', 103680, 'keer'],
    ['Een fabriek maakt 9 000 schroeven per dag en verpakt ze in dozen van 125. Hoeveel volle dozen zijn dat in een week van 7 werkdagen?', '9 000 : 125 = 72 dozen per dag<br>72 · 7 = <b>504</b> dozen', 504, 'dozen'],
    ['Mats legt 15 dagen lang elke dag 48 puzzelstukjes. Daarna moet hij er nog 280 leggen. Hoeveel stukjes telt de puzzel?', '15 · 48 = 720<br>720 + 280 = <b>1 000</b> stukjes', 1000, 'stukjes'],
    ['Een school koopt 18 dozen met elk 24 schriften. Ze verdeelt alle schriften eerlijk over 27 klassen. Hoeveel schriften krijgt elke klas?', '18 · 24 = 432 schriften<br>432 : 27 = <b>16</b> schriften', 16, 'schriften']
  ].map(([t,s,a,u])=>({html:`${t}<br>[[0:md]] <span class="unit">${u}</span>`, block:true, mode:'numeric', check:numIs(a), sol:s})), {letters:true}) },

  /* 4. Veelvouden en delers */
  vImpl: { title:'Waar of niet waar? Delers en implicaties', lvl:3,
    instr:'a ∣ b betekent “a is een deler van b”. Een implicatie is waar als de conclusie altijd volgt.',
    build:choiceList([
      ['4 ∣ 8 en 3 ∣ 9 ⇒ 4 ∣ 17','n','17 : 4 = 4 rest 1, dus 4 is geen deler van 17.'],
      ['12 ∣ 24 en 12 ∣ 60 ⇒ 12 ∣ 84','w','Is een getal een deler van twee getallen, dan ook van hun som: 24 + 60 = 84.'],
      ['a ∣ 18 en a ∣ 30 ⇒ a ∣ 48','w','a is een deler van 18 en van 30, dus ook van 18 + 30 = 48.'],
      ['7 ∣ b ⇒ 7 ∣ 3b en 7 ∣ 5b','w','Een deler van b is ook een deler van elk veelvoud van b.'],
      ['6 ∣ r ⇒ 6 ∣ r + 6 en 6 ∣ r + 12','w','6 is een deler van r en van 6 (en 12), dus ook van de som.'],
      ['4 ∣ 20 ⇒ 4 ∣ 4 en 4 ∣ 5','n','20 = 4 · 5, maar 4 is geen deler van 5.'],
      ['a ∣ b en b ∣ c ⇒ a ∣ c','w','Bv. 2 ∣ 4 en 4 ∣ 12 ⇒ 2 ∣ 12. Dit geldt altijd.'],
      ['3 ∣ a · b ⇒ 3 ∣ a','n','Tegenvoorbeeld: 3 ∣ 2 · 6, maar 3 is geen deler van 2.']
    ], WN) },
  vMulti: { title:'Duid alle juiste antwoorden aan', lvl:3, instr:'Er kunnen meerdere antwoorden juist zijn. Tik alle juiste antwoorden aan en klik op Controleer.',
    build:multiList([
      {html:'Het getal <span class="stmt">23 58x</span> is deelbaar door 2. x = …', opts:['0','3','4','7','8'], ans:[0,2,4], why:'Het laatste cijfer moet even zijn.'},
      {html:'Het verschil van 4 321 en 1 234 is deelbaar door …', opts:['3','5','7','9','10'], ans:[0,2,3], why:'4 321 − 1 234 = 3 087 = 9 · 343 = 3 · 3 · 7 · 7 · 7.'},
      {html:'Dit getal is een veelvoud van 3 én van 5.', opts:['75','4 125','2 130','1 040','0'], ans:[0,1,2,4], why:'Eindigt op 0 of 5 én de som van de cijfers is deelbaar door 3. Bij 1 040 is de som 5.'},
      {html:'Het getal <span class="stmt">805x</span> is deelbaar door 3. x = …', opts:['1','2','5','7','8'], ans:[1,2,4], why:'8 + 0 + 5 + x = 13 + x moet deelbaar zijn door 3: 15, 18 of 21.'},
      {html:'Als je een natuurlijk getal deelt door 5, kan de rest … zijn.', opts:['0','3','4','5','6'], ans:[0,1,2], why:'De rest is altijd kleiner dan de deler.'},
      {html:'Een deling door 9 is opgaand. De rest is …', opts:['0','1','3','8','9'], ans:[0], why:'Opgaand betekent: rest 0.'},
      {html:'Dit getal is deelbaar door 9.', opts:['72','0','153','1 001','2 718'], ans:[0,1,2,4], why:'De som van de cijfers moet deelbaar zijn door 9. Bij 1 001 is de som 2.'},
      {html:'Elk veelvoud van 12 is ook een veelvoud van …', opts:['4','24','6','36','1'], ans:[0,2,4], why:'De delers van 12 zijn 1, 2, 3, 4, 6 en 12.'}
    ]) },
  vDelers: { title:'Delers en priemgetallen', lvl:3, build:list([
    {html:`b = 2 · 5 · 7. Noteer alle delers van b. &nbsp; del b = ${BR('[[0]]')}`, size:'wide', check:setIs(delOf(70)), sol:'Combineer de priemfactoren: 1, 2, 5, 7, 2 · 5, 2 · 7, 5 · 7, 2 · 5 · 7 → <b>{1, 2, 5, 7, 10, 14, 35, 70}</b>.'},
    {html:'p, q en r zijn drie verschillende priemgetallen. Hoeveel delers heeft p · q · r? [[0:sm]]', mode:'numeric', check:numIs(8), sol:'1, p, q, r, p·q, p·r, q·r en p·q·r → <b>8</b> delers.'},
    {html:'Geef een deler van 555 555 die niet 1 en niet 555 555 is. Zo bewijs je dat 555 555 geen priemgetal is. [[0:md]]', mode:'numeric',
      check:v=>{ const x=parseNum(v[0]); if(!Number.isInteger(x)) return {ok:false, msg:'Geef een natuurlijk getal.'}; if(x===1||x===555555) return {ok:false, msg:'Die deler heeft elk getal. Zoek een andere.'}; if(x>1 && 555555%x===0) return {ok:true, msg:`555 555 : ${x} = ${555555/x}.`}; return {ok:false, msg:`${x} is geen deler van 555 555.`}; },
      sol:'Het laatste cijfer is 5, dus 5 is een deler. Ook 3 (som van de cijfers = 30), 7, 11, 13, 37 … zijn delers.'},
    {html:'Hoeveel priemgetallen liggen er tussen 50 en 100? [[0:sm]]', mode:'numeric', check:numIs([...Array(50)].map((_,i)=>51+i).filter(isPrime).length),
      sol:'53, 59, 61, 67, 71, 73, 79, 83, 89, 97 → <b>10</b> priemgetallen.'}
  ], {letters:true}) },
  vPriem: { title:'ggd en kgv via priemfactoren', lvl:3, instr:'Ontbind elk getal in priemfactoren op je kladpapier.',
    build:list([pfQ([126,210,462],'ggd'), pfQ([60,84,126],'kgv'), pfQ([180,252],'ggd'), pfQ([180,252],'kgv')], {letters:true}) },
  vEuclides: { title:'Algoritme van Euclides', lvl:3,
    instr:'Deel het grootste getal door het kleinste. Is de rest 0, dan is de deler de ggd. Anders: ggd(a, b) = ggd(b, rest). Herhaal.<br><span class="unit">Voorbeeld: ggd(252, 120) = ggd(120, 12) = ggd(12, 0) = 12</span>',
    build:list([euclidQ(330,84), euclidQ(255,102), euclidQ(1071,462), euclidQ(1001,182)], {letters:true}) },
  vGgdWaar: { title:'Waar of niet waar? ggd en kgv', lvl:3, build:choiceList([
    ['De ggd van twee verschillende priemgetallen is altijd 1.','w','Een priemgetal heeft enkel 1 en zichzelf als deler. 1 is de enige gemeenschappelijke deler.'],
    ['Als ggd(a, b) = 1, dan is ggd(3a, 3b) = 1.','n','3 is een deler van 3a en van 3b. Bv. ggd(2, 5) = 1, maar ggd(6, 15) = 3.'],
    ['Als ggd(a, b) = 1, dan is kgv(a, b) = a · b.','w','Bv. ggd(4, 9) = 1 en kgv(4, 9) = 36 = 4 · 9.'],
    ['Het kgv van twee getallen is altijd groter dan elk van die getallen.','n','Tegenvoorbeeld: kgv(4, 8) = 8.'],
    ['ggd(a, b) · kgv(a, b) = a · b','w','Bv. ggd(6, 8) · kgv(6, 8) = 2 · 24 = 48 = 6 · 8.'],
    ['Als a een deler is van b, dan is ggd(a, b) = a.','w','a is dan een gemeenschappelijke deler, en een grotere deler van a bestaat niet.']
  ], WN) },
  vVraag: { title:'Moeilijkere vraagstukken', lvl:3, instr:'Stap 1: kies GGD, KGV of geen van beide. Stap 2: noteer je tussenstap. Stap 3: noteer je antwoord.', build:list([
    probQ({text:'Twee lopers starten samen. De eerste loopt een ronde in 6 minuten, de tweede in 10 minuten. <b>Na hoeveel minuten komen ze voor het eerst samen voorbij de start?</b>', ans:'kgv', nums:[6,10], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(30), unit:'minuten', mode:'numeric', why:'Je zoekt wanneer iets opnieuw samenvalt: een KGV-vraag.', sol:'kgv(6, 10) = <b>30</b> minuten'}),
    probQ({text:'Een garage is 540 cm lang en 396 cm breed. Je legt de vloer met zo groot mogelijke vierkante tegels, zonder te zagen. <b>Hoe lang is de zijde van een tegel?</b>', ans:'ggd', nums:[540,396], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(36), unit:'cm', mode:'numeric', why:'Zo groot mogelijke gelijke stukken: een GGD-vraag.', sol:'540 = 2² · 3³ · 5 en 396 = 2² · 3² · 11<br>ggd(540, 396) = 2² · 3² = <b>36</b> cm'}),
    probQ({text:'Twee tandwielen grijpen in elkaar: het grote heeft 48 tanden, het kleine 36. <b>Hoeveel keer draait het kleine tandwiel rond voor ze weer in hun beginstand staan?</b>', ans:'kgv', nums:[48,36], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(4), unit:'keer', mode:'numeric', why:'Je zoekt wanneer beide tandwielen opnieuw samen in de beginstand staan: een KGV-vraag.', sol:'kgv(48, 36) = 144 tanden<br>144 : 36 = <b>4</b> keer'}),
    probQ({text:'Een kat krijgt om de 90 dagen een ontwormingspil en om de 120 dagen een vaccin. Vandaag kreeg ze allebei. <b>Binnen hoeveel dagen is dat opnieuw zo?</b>', ans:'kgv', nums:[90,120], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(360), unit:'dagen', mode:'numeric', why:'Wanneer valt het opnieuw samen? KGV.', sol:'kgv(90, 120) = <b>360</b> dagen'}),
    probQ({text:'Je hebt drie linten van 84 cm, 126 cm en 210 cm. Je knipt ze in zo lang mogelijke, even lange stukken. Er blijft niets over. <b>Hoeveel stukken krijg je in totaal?</b>', ans:'ggd', nums:[84,126,210], si:[0], ai:[1], ansHtml:'[[1:xs]]', ansCheck:numIs(10), unit:'stukken', mode:'numeric', why:'Zo lang mogelijke gelijke stukken: GGD.', sol:'ggd(84, 126, 210) = 42 cm<br>84 : 42 + 126 : 42 + 210 : 42 = 2 + 3 + 5 = <b>10</b> stukken'})
  ]) },

  /* 5. Verzamelingen */
  vBewerk: { title:'Bewerkingen met verzamelingen', lvl:3, instr:'∩ = doorsnede (in allebei) · ∪ = unie (in minstens één van beide) · \\ = verschil (in de eerste, niet in de tweede).',
    build:list([
      ['del 18 ∩ del 30', inter(delOf(18),delOf(30))], ['del 9 ∩ del 10', inter(delOf(9),delOf(10))],
      ['del 40 \\ del 24', minus(delOf(40),delOf(24))], ['del 3 ∪ del 5', union(delOf(3),delOf(5))],
      ['del 6 ∪ del 12', union(delOf(6),delOf(12))], ['del 36 ∩ 4ℕ', delOf(36).filter(x=>x%4===0)],
      ['{1, 3, 5, 7, 9} ∩ {5, 7, 9, 11, 13}', inter([1,3,5,7,9],[5,7,9,11,13])], ['{5, 7, 9, 11, 13} \\ {1, 3, 5, 7, 9}', minus([5,7,9,11,13],[1,3,5,7,9])]
    ].map(([lab,arr])=>setQ(lab, arr, `${lab} = <b>${setTxt(arr)}</b>`)), {letters:true}) },
  vOneindig: { title:'Bewerkingen met oneindige verzamelingen', lvl:3,
    instr:'Is de uitkomst oneindig, noteer dan de eerste elementen en sluit af met … . Is de uitkomst leeg, noteer dan ∅ (of laat de accolades leeg en typ “leeg”).',
    build:list([
      {html:`<span class="stmt">2ℕ ∩ 3ℕ =</span> ${BR('[[0]]')}`, size:'wide', check:infSetIs(i=>6*i), sol:'De getallen die zowel even als een drievoud zijn: de zesvouden → <b>{0, 6, 12, 18, …}</b> = 6ℕ'},
      {html:`<span class="stmt">4ℕ \\ 2ℕ =</span> ${BR('[[0]]')}`, size:'wide', check:emptyIs, sol:'Elk viervoud is even → <b>∅</b> (de lege verzameling).'},
      {html:`<span class="stmt">8ℕ ∩ 12ℕ =</span> ${BR('[[0]]')}`, size:'wide', check:infSetIs(i=>24*i), sol:'kgv(8, 12) = 24 → <b>{0, 24, 48, 72, …}</b> = 24ℕ'},
      {html:`<span class="stmt">5ℕ ∪ 10ℕ =</span> ${BR('[[0]]')}`, size:'wide', check:infSetIs(i=>5*i), sol:'Elk tienvoud is al een vijfvoud → <b>{0, 5, 10, 15, …}</b> = 5ℕ'},
      setQ('del 30 \\ 3ℕ', minus(delOf(30), delOf(30).filter(x=>x%3===0)), 'del 30 = {1, 2, 3, 5, 6, 10, 15, 30}. Schrap de drievouden → <b>{1, 2, 5, 10}</b>'),
      setQ('4ℕ ∩ del 4', [4], 'del 4 = {1, 2, 4}. Enkel 4 is een viervoud → <b>{4}</b>'),
      setQ('del 8 ∪ del 12', union(delOf(8),delOf(12)), `<b>${setTxt(union(delOf(8),delOf(12)))}</b>`),
      {html:`<span class="stmt">3ℕ ∪ 4ℕ =</span> ${BR('[[0]]')}`, size:'wide', check:infSetIs(i=>multUnion([3,4],i)), sol:'Alle drievouden en alle viervouden samen → <b>{0, 3, 4, 6, 8, 9, 12, …}</b>'}
    ], {letters:true}) },
  vZoek: { title:'Zoek de verzamelingen', lvl:3, build:(b,st,save,key)=>{
    const A=[0,3,6,9,12,15,18,21,24], B=[2,3,5,7,11,13,17,19].map(p=>p+1), C=[0,2,4,6,8,10,12,14,16,18,20,22,24];
    const AC=inter(A,C), BA=inter(B,A), R=union(AC,BA);
    b.append(el('div','given-box','<b>Gegeven:</b> A = de veelvouden van 3 kleiner dan 25<br>B = de getallen die 1 groter zijn dan een priemgetal kleiner dan 20<br>C = de even natuurlijke getallen kleiner dan 25'));
    list([setQ('B', B, `De priemgetallen kleiner dan 20: 2, 3, 5, 7, 11, 13, 17, 19. Tel er 1 bij → <b>${setTxt(B)}</b>`),
          setQ('A ∩ C', AC, `<b>${setTxt(AC)}</b>`), setQ('B ∩ A', BA, `<b>${setTxt(BA)}</b>`),
          setQ('(A ∩ C) ∪ (B ∩ A)', R, `<b>${setTxt(R)}</b>`)], {letters:true})(b,st,save,key+'_1');
    b.append(el('div','given-box','<b>Gegeven:</b> A \\ B = {1, 2} &nbsp; B \\ A = {7, 8, 9} &nbsp; A ∪ B = {1, 2, 3, 4, 5, 6, 7, 8, 9}'));
    list([setQ('A', [1,2,3,4,5,6], 'Wat niet in A \\ B en niet in B \\ A zit, ligt in de doorsnede: A ∩ B = {3, 4, 5, 6}.<br>A = <b>{1, 2, 3, 4, 5, 6}</b>'),
          setQ('B', [3,4,5,6,7,8,9], 'B = A ∩ B samen met B \\ A = <b>{3, 4, 5, 6, 7, 8, 9}</b>')], {letters:false})(b,st,save,key+'_2');
    const P=[2,3,4,5,6], Q=[-1,1,2,3,4];
    b.append(el('div','given-box',`<b>Gegeven:</b> A = {x ∈ ℕ | 2 ⩽ x &lt; 7} &nbsp; B = {x ∈ ${Z0} | −2 &lt; x ⩽ 4}<br><span class="unit">${Z0} = ℤ zonder 0. Lees “|” als “waarvoor geldt”.</span>`));
    list([setQ('A ∪ B', union(P,Q), `A = {2, 3, 4, 5, 6} en B = {−1, 1, 2, 3, 4} → <b>${setTxt(union(P,Q))}</b>`),
          setQ('A ∩ B', inter(P,Q), `<b>${setTxt(inter(P,Q))}</b>`),
          setQ('A \\ B', minus(P,Q), `<b>${setTxt(minus(P,Q))}</b>`),
          setQ('B \\ A', minus(Q,P), `<b>${setTxt(minus(Q,P))}</b>`)], {letters:false})(b,st,save,key+'_3');
  } },
  vImplLees: { title:'Lezen en noteren met de implicatiepijl', lvl:3, build:(b,st,save,key)=>{
    qChoice(b, st, save, key+'_a', {nr:'a.', html:'Hoe lees je <span class="stmt">x &lt; 5 ⇒ x &lt; 8</span>?', opts:[['1','Als x kleiner is dan 5, dan is x kleiner dan 8.'],['2','Als x kleiner is dan 8, dan is x kleiner dan 5.'],['3','x is kleiner dan 5 en kleiner dan 8.']], ans:'1', why:'Je leest de pijl als “als …, dan …”, van links naar rechts.'});
    qChoice(b, st, save, key+'_b', {nr:'b.', html:`Hoe lees je <span class="stmt">y ∈ ${N0} ⇒ y &gt; 0</span>?`, opts:[['1','Als y groter is dan 0, dan is y een natuurlijk getal.'],['2','Als y een natuurlijk getal verschillend van 0 is, dan is y groter dan 0.'],['3','y is een natuurlijk getal of groter dan 0.']], ans:'2', why:`${N0} is ℕ zonder 0.`});
    const sym = (text, forms, sol) => ({html:`${text}<br>[[0]]`, block:true, size:'wide', sol,
      check:v=>{ const t=String(v[0]).replace(/\s+/g,'').replace(/=>|-->|->|⟹/g,'⇒').replace(/[−–]/g,'-'); return {ok:forms.includes(t), msg: t.includes('⇒')?'':'Gebruik de implicatiepijl ⇒ (je mag ook => typen).'}; }});
    list([ sym('Schrijf in symbolen: “Als x kleiner is dan −9, dan is x kleiner dan −7.”', ['x<-9⇒x<-7'], '<b>x &lt; −9 ⇒ x &lt; −7</b>'),
           sym('Schrijf in symbolen: “Als y groter is dan 30, dan is y − 5 groter dan 25.”', ['y>30⇒y-5>25'], '<b>y &gt; 30 ⇒ y − 5 &gt; 25</b>') ], {letters:false})(b,st,save,key+'_c');
  } },
  vImplVolgt: { title:'Volgt de tweede uitspraak uit de eerste?', lvl:3, instr:'Is de implicatie juist? Geef bij fout een tegenvoorbeeld.', build:list([
    implQ('x ∈ ℕ ⇒ x ∈ ℤ','juist','Elk natuurlijk getal is ook een geheel getal.'),
    implQ('x ∈ ℤ ⇒ x − 3 is negatief','fout','',{pre:x=>Number.isInteger(x), con:x=>x-3<0, preT:'x ∈ ℤ', conT:'x − 3 is negatief'}),
    implQ('x &gt; −50 ⇒ x ∈ ℤ','fout','',{pre:x=>x>-50, con:x=>Number.isInteger(x), preT:'x > −50', conT:'x ∈ ℤ'}),
    implQ('x ∈ 6ℕ ⇒ x ∈ 3ℕ','juist','Elk zesvoud is ook een drievoud: 6 = 2 · 3.'),
    implQ('x ∈ del 12 ⇒ x ∈ del 24','juist','12 is een deler van 24, dus elke deler van 12 is ook een deler van 24.'),
    implQ('x &lt; 100 ⇒ x ⩽ 99','fout','',{pre:x=>x<100, con:x=>x<=99, preT:'x < 100', conT:'x ⩽ 99'})
  ], {letters:true}) },

  /* 6. Breuken */
  vKetting: { title:'Vul de ketting aan', lvl:3, instr:'Alle breuken in een ketting zijn gelijkwaardig.', build:list([
    missingQ(`${fr(2,9)} = ${frIn('[[0]]',18)} = ${frIn('[[1]]',36)} = ${frIn(10,'[[2]]')}`, [4,8,45], '2/9 = 4/18 = 8/36 = 10/45'),
    missingQ(`${fr(4,5)} = ${frIn('[[0]]',15)} = ${frIn(28,'[[1]]')} = ${frIn('[[2]]',100)}`, [12,35,80], '4/5 = 12/15 = 28/35 = 80/100'),
    missingQ(`${frIn(3,'[[0]]')} = ${fr(12,32)} = ${frIn('[[1]]',48)} = ${frIn(27,'[[2]]')}`, [8,18,72], '12/32 = 3/8 = 18/48 = 27/72'),
    missingQ(`${frIn('[[0]]',7)} = ${fr(15,35)} = ${frIn('[[1]]',56)} = ${frIn(33,'[[2]]')}`, [3,24,77], '15/35 = 3/7 = 24/56 = 33/77')
  ], {letters:true}) },
  vVergelijk: { title:'Vergelijk de breuken', lvl:3, build:choiceList([
    ['7/12 … 2/3','<','2/3 = 8/12, dus 7/12 < 8/12.'],
    ['4/9 … 4/7','<','Zelfde teller: hoe groter de noemer, hoe kleiner de breuk.'],
    ['15/100 … 9/36','<','15/100 = 0,15 en 9/36 = 1/4 = 0,25.'],
    ['5/8 … 6/11','>','5/8 = 55/88 en 6/11 = 48/88.'],
    ['13/10 … 9/7','>','13/10 = 91/70 en 9/7 = 90/70.'],
    ['14/42 … 11/33','=','Allebei vereenvoudigd: 1/3.']
  ], [['<','&lt;'],['>','&gt;'],['=','=']], true) },
  vBreuk: { title:'Reken uit met verschillende noemers', lvl:3, build:list([[5,12,'+',4,9],[9,10,'-',2,15],[3,1,'-',5,6],[13,8,'+',7,12],[18,4,'+',5,6],[4,1,'-',11,3]].map(fracQ), {letters:true}) },
  vBreukVraag: { title:'Vraagstukken met breuken en kansen', lvl:3, instr:'Noteer je antwoord als een onvereenvoudigbare breuk.', build:list([
    ['Je hebt 3/4 liter melk. Een derde daarvan gebruik je voor pannenkoeken. Hoeveel liter melk blijft er over?', 1,2, '1/3 van 3/4 = 1/4<br>3/4 − 1/4 = 2/4 = <b>1/2</b> liter'],
    ['Bij een concert is 2/5 van de tickets staanplaats en 1/3 zitplaats op het balkon. De rest is VIP. Welk deel van de tickets is geen VIP?', 11,15, '2/5 + 1/3 = 6/15 + 5/15 = <b>11/15</b>'],
    ['In de klas van Noor zitten 26 leerlingen, telkens per twee: 14 meisjes en 12 jongens. Noor is een meisje. Hoe groot is de kans dat ze naast een meisje zit?', 13,25, 'Naast Noor kan één van de 25 andere leerlingen zitten. Daarvan zijn er 13 meisjes → <b>13/25</b>'],
    ['Je gooit met een gewone dobbelsteen. Hoe groot is de kans dat je een priemgetal gooit?', 1,2, 'Priemgetallen: 2, 3 en 5 → 3/6 = <b>1/2</b>'],
    ['In een klas van 24 leerlingen kiest de juf er 3 voor een mondelinge proef. Hoe groot is de kans dat jij erbij bent?', 1,8, '3/24 = <b>1/8</b>'],
    ['Een zakje bevat één exemplaar van elk euromuntstuk (1, 2, 5, 10, 20 en 50 cent, 1 en 2 euro). Je neemt er blind één uit. Hoe groot is de kans dat het minder dan 10 cent waard is?', 3,8, '1, 2 en 5 cent: 3 van de 8 munten → <b>3/8</b>']
  ].map(([t,n,d,s])=>({html:`${fmt(t)}<br>${FIN(0,1)}`, block:true, mode:'numeric', check:fracValue(n,d), sol:fmt(s)})), {letters:true}) }
};
function ROM_PARSE(r){ const V={I:1,V:5,X:10,L:50,C:100,D:500,M:1000}; let s=0; for(let i=0;i<r.length;i++){ const a=V[r[i]], b=V[r[i+1]]||0; s += a<b ? -a : a; } return s; }

/* ---------- toevoegen aan de onderdelen ---------- */
(function(){
  const S = id => SECTIONS.find(s=>s.id===id);
  const toets = new Set(['toets1','toets2','toets3']);
  SECTIONS.forEach(sec=>{ if(toets.has(sec.id)) return; sec.cards.forEach((c,i)=>{ if(c.lvl==null) c.lvl = i===0 ? 1 : 2; }); });
  const add = (id, ...cards) => S(id).cards.push(...cards);
  add('getallen', NEW.vormen, NEW.vergelijk, NEW.vEven, NEW.vPuzzel, NEW.vRomeins);
  add('roos', NEW.inSub('∈ en ⊂: reeks A', [
      ['0 ∈ ℕ','w','0 is het kleinste natuurlijke getal.'], ['−5 ∈ ℕ','n','ℕ bevat geen negatieve getallen.'], ['−5 ∈ ℤ','w','Elk geheel getal (positief, negatief of 0) hoort bij ℤ.'],
      ['1/2 ∈ ℤ','n','1/2 is geen geheel getal.'], ['1/2 ∈ ℚ','w','1/2 is een breuk van twee gehele getallen.'], ['−8/2 ∈ ℤ','w','−8/2 = −4, een geheel getal.'],
      ['ℕ ⊂ ℤ','w','Elk natuurlijk getal is ook een geheel getal.'], ['ℤ ⊂ ℕ','n','−5 ∈ ℤ, maar −5 ∉ ℕ.'], ['{2, 4, 6} ⊂ ℕ','w','Alle drie zijn natuurlijke getallen.'], ['{−1, 0, 1} ⊂ ℕ','n','−1 hoort niet bij ℕ.']], 2),
    NEW.inSub('∈ en ⊂: reeks B', [
      ['7 ∈ ℤ','w','7 is een geheel getal.'], ['−3/4 ∈ ℤ','n','−3/4 is geen geheel getal.'], ['−3/4 ∈ ℚ','w','−3/4 is een rationaal getal.'], ['9/3 ∈ ℕ','w','9/3 = 3.'],
      ['ℤ ⊂ ℚ','w','Elk geheel getal kan je als breuk schrijven, bv. −3 = −3/1.'], ['ℚ ⊂ ℤ','n','1/2 ∈ ℚ, maar 1/2 ∉ ℤ.'], ['{0, 1, 2} ⊂ ℤ','w','Alle drie zijn gehele getallen.'],
      ['{1/2, 1/3} ⊂ ℤ','n','Geen van beide breuken is een geheel getal.'], ['−12 ∉ ℕ','w','−12 is negatief, dus geen natuurlijk getal.'], ['5 ∉ ℚ','n','5 = 5/1, dus 5 ∈ ℚ.']], 2),
    NEW.inSub('∈ en ⊂: reeks C', [
      ['100 ∈ ℕ','w','100 is een natuurlijk getal.'], ['−100 ∈ ℕ','n','ℕ bevat geen negatieve getallen.'], ['6/3 ∈ ℕ','w','6/3 = 2.'], ['−6/3 ∈ ℕ','n','−6/3 = −2, en dat is negatief.'],
      ['−6/3 ∈ ℤ','w','−6/3 = −2, een geheel getal.'], ['ℕ ⊂ ℚ','w','ℕ ⊂ ℤ ⊂ ℚ.'], ['ℚ ⊂ ℕ','n','−1/2 ∈ ℚ, maar −1/2 ∉ ℕ.'], ['{3, 6, 9} ⊂ ℤ','w','Alle drie zijn gehele getallen.'],
      ['{−2, 1/2} ⊂ ℚ','w','Beide zijn rationale getallen.'], ['{−2, 1/2} ⊂ ℤ','n','1/2 is geen geheel getal.']], 2),
    NEW.vNotatie, NEW.vRedeneer, NEW.vVoorwaarden);
  add('benaming', NEW.vTermen);
  add('deling', NEW.vRest);
  add('uitspraken', NEW.vImpl, NEW.vMulti);
  add('priem', NEW.vDelers, NEW.vPriem);
  add('ggdkgv', NEW.vEuclides, NEW.vGgdWaar);
  add('vraagstukken', NEW.vVraag);
  add('opsomming', NEW.vBewerk, NEW.vOneindig, NEW.vZoek);
  add('implicatie', NEW.vImplLees, NEW.vImplVolgt);
  add('breukvormen', NEW.vKetting, NEW.vVergelijk);
  add('breuken', NEW.vBreuk, NEW.vBreukVraag);
  /* nieuw onderdeel: welke bewerking? */
  SECTIONS.push({ id:'bewerking', ic:'bewerk', nav:'Welke bewerking?', title:'Welke bewerking heb je nodig?',
    tip:'Lees de vraag goed: tel je samen, neem je iets weg, neem je iets meerdere keren of verdeel je eerlijk?',
    cards:[NEW.bwKies, NEW.bwVraag, NEW.bwNoteer, NEW.bwStappen] });
  /* volgorde volgens de cursus; een lijn tussen de hoofdstukken */
  const ORDER = ['getallen','positie', 'roos', 'benaming','deling','bewerking', 'uitspraken','cijfer','priem','ggdkgv','vraagstukken', 'element','opsomming','venn','kleuren','implicatie', 'breukvormen','breuken', 'raadsels','fout','toets1','toets2','toets3'];
  const SEP = new Set(['toets1']);
  const byId = {}; SECTIONS.forEach(s=>byId[s.id]=s);
  const rest = SECTIONS.filter(s=>!ORDER.includes(s.id));
  SECTIONS.length = 0; ORDER.forEach(id=>{ if(byId[id]){ byId[id].sepBefore = SEP.has(id); SECTIONS.push(byId[id]); } }); SECTIONS.push(...rest);
})();

/* ============================================================
   OPBOUW
   ============================================================ */
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
    const panel = el('div','cheat', CHEAT); panel.hidden = true;
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
