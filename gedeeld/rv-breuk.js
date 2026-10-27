/* Rekenvaardigheden met breuken (hoofdstuk 4 tot 7): breukvak, vereenvoudigschaar en kommagetal → breuk.
   Laadt na gedeeld/rv-kader.js. De stijl staat in gedeeld/rv-breuk.css (opgave.css importeert die, zo heeft ook het dashboard ze).
   Breukvak o = { s1:'+'|'−'|null, t, n }: tekenvak vooraan (+ boven, − onder), teller boven noemer (of een vaste noemer).
   Vereenvoudigschaar st = { mode:null|'cut'|'skip', cuts:[], done, for:'teller/noemer', x, nv, sx }, zoals in het oorspronkelijke
   Oefening.html: ✂ vereenvoudigen opent de schaar en de leerling kiest zelf het knipgetal. Rode kruisjes: x = onmogelijk knipgetal,
   sx = "kan niet eenvoudiger" terwijl het wel kon; nv = te vroeg "klaar". code.gs telt ze zo.
   In een opgave: B.keuze(pad, basis, st) naast de breuk, B.paneel(pad, basis, st, c) waar de schaar mag openklappen,
   B.bind(c, basisVan(v, pad)) na het tekenen en B.ververs(c, basisVan) bij elke invoer (c.ant.oninput).
   Na "Klaar met vereenvoudigen" klapt de schaar dicht (zo blijft alles op één scherm); ✂ opent ze opnieuw met de knippen erin. */
(function(){
  const RV = window.RV, esc = RV.esc, B = RV.br = {};
  const ggd = (a, b)=>{ a = Math.abs(a); b = Math.abs(b); while(b){ const t = a % b; a = b; b = t; } return a; };
  B.ggd = ggd; B.kgv = (a, b)=>a / ggd(a, b) * b;
  B.F = ()=>({ s1:null, t:'', n:'' });
  B.SCH = ()=>({ mode:null, cuts:[], done:false, for:null, x:0, nv:0, sx:0 });
  B.CONV = ()=>({ pos:null, t:'', sch:B.SCH() });
  const pad = (o, p)=>p.split('.').reduce((x, k)=>x == null ? x : x[k], o);
  B.pad = pad;
  /* breuk tonen: teller boven noemer, het teken ervoor (zwart) */
  B.html = (num, den) => (num < 0 ? '−' : '') + (den === 1 ? `<span class="br-int">${Math.abs(num)}</span>` : `<span class="br"><span class="br-t">${Math.abs(num)}</span><span class="br-n">${den}</span></span>`);
  B.val = (o, vastN)=>{ if(!o || o.s1 == null) return null; const t = RV.nat(o.t), n = vastN || RV.nat(o.n); if(t == null || !n) return null; return { num:o.s1 === '−' ? -t : t, den:n }; };
  /* breukvak; vastN = vaste noemer (bv. het kgv) */
  B.veld = (p, o, vastN, label = 'uitkomst') => `<span class="rv-term br-veld">${RV.teken(p + '.s1', o.s1, 'toestandsteken van de ' + label, true)}`
    + `<span class="br br-in"><span class="br-t">${RV.getal(p + '.t', o.t, 'nat', 'br-get', 'teller')}</span><span class="br-n">${vastN ? `<b>${vastN}</b>` : RV.getal(p + '.n', o.n, 'nat', 'br-get', 'noemer')}</span></span></span>`;
  /* teller met een vaste noemer, het teken ervoor apart (termen bij het gelijknamig maken) */
  B.teller = (p, w, noemer, label = 'teller') => `<span class="br br-in"><span class="br-t">${RV.getal(p, w, 'nat', 'br-get', label)}</span><span class="br-n"><b>${noemer == null ? '…' : noemer}</b></span></span>`;

  /* ---------- vereenvoudigschaar ---------- */
  B.na = (basis, cuts)=>{ let num = Math.abs(basis.num), den = basis.den; const ok = [];
    for(const c of cuts || []){ if(c > 1 && num % c === 0 && den % c === 0){ num /= c; den /= c; ok.push(c); } else break; }
    return { num:basis.num < 0 ? -num : num, den, ok }; };
  B.kan = f => !!f && f.den > 1 && ggd(f.num, f.den) > 1;
  B.sig = b => b ? b.num + '/' + b.den : '';
  /* de breuk veranderde: keuze en knippen opnieuw */
  B.sync = (st, basis)=>{
    if(st && st.for && st.for !== B.sig(basis)){ st.done = false; st.cuts = []; st.for = null; if(st.mode === 'skip') st.mode = null; return true; }
    if(st && !basis && st.mode === 'skip'){ st.mode = null; st.done = false; return true; }
    return false;
  };
  B.ok = (st, basis)=>!!st && !!basis && st.done && st.for === B.sig(basis);
  B.eind = (st, basis)=>B.ok(st, basis) ? B.na(basis, st.cuts) : null;
  const SCHAAR = '<circle cx="6" cy="6.5" r="3"/><circle cx="6" cy="17.5" r="3"/><path d="M8.4 8.2 L20 16.5 M8.4 15.8 L20 7.5"/>';
  const ICO_KNIP = `<svg class="br-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">${SCHAAR}</svg>`;
  const ICO_OK = '<svg class="br-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5 L10 18 L20 6"/></svg>';
  const keuzeHTML = (p, basis, st, zonderRes)=>{
    if(!basis) return '';
    st = st || B.SCH();
    let h = `<span class="br-keuze"><button type="button" class="br-kz knip${st.mode === 'cut' ? ' aan' : ''}" data-schopen="${p}" aria-pressed="${st.mode === 'cut'}" title="${st.mode === 'cut' && st.done ? 'Open de schaar om verder te knippen' : 'Open de vereenvoudigschaar'}">${ICO_KNIP}<span>vereenvoudigen</span></button>`
      + `<button type="button" class="br-kz niet${st.mode === 'skip' ? ' aan' : ''}" data-schniet="${p}" aria-pressed="${st.mode === 'skip'}" title="De breuk staat al in de eenvoudigste vorm">${ICO_OK}<span>kan niet eenvoudiger</span></button></span>`;
    const r = !zonderRes && B.eind(st, basis); if(r) h += `<span class="br-res"><span class="br-is">=</span>${B.html(r.num, r.den)}</span>`;
    return h;
  };
  const paneelHTML = (p, basis, st, c)=>{
    st = st || B.SCH(); if(st.mode !== 'cut' || (st.done && basis && st.for === B.sig(basis))) return '';
    if(!basis) return '<div class="br-schaar uit">✂ Vul eerst de breuk volledig in.</div>';
    const r = B.na(basis, st.cuts), k = c.q.id + '|' + p; let keten = B.html(basis.num, basis.den), nu = { num:basis.num, den:basis.den };
    r.ok.forEach(g=>{ nu = { num:nu.num / g, den:nu.den / g }; keten += `<span class="br-pijl">: ${g}</span>` + B.html(nu.num, nu.den); });
    return `<div class="br-schaar"><div class="br-skop"><b>✂ Vereenvoudigschaar</b><span class="br-keten">${keten}</span>`
      + `<button type="button" class="br-sluit" data-schsluit="${p}" aria-label="schaar sluiten" title="Schaar sluiten">✕</button></div>`
      + (`<div class="br-sknop"><label>Deel teller en noemer door <input class="rv-getal br-knipgetal" type="text" inputmode="numeric" autocomplete="off" data-schgetal="${p}" value="${esc((c.ui.schGetal || {})[k] || '')}" aria-label="knipgetal"></label>`
        + `<button type="button" class="br-kn" data-schknip="${p}">✂ Knip</button>${r.ok.length ? `<button type="button" class="br-kn terug" data-schterug="${p}" title="Laatste knip ongedaan maken">↶</button>` : ''}</div>`)
      + (c.ui.schWarn === k && !st.done ? '<div class="br-swarn">✂ Je kan nog verder vereenvoudigen.</div>' : '')
      + `<button type="button" class="br-klaar" data-schklaar="${p}">✔ Klaar met vereenvoudigen</button></div>`;
  };
  /* de knoppen naast de breuk en het resultaat ("= 3/4"); zonderRes: het resultaat staat elders (bv. stap 4 van het stappenplan) */
  B.keuze = (p, basis, st, zonderRes) => `<span class="br-keuzeslot${zonderRes ? ' zonder' : ''}" data-schk="${p}" data-sig="${B.sig(basis)}">${keuzeHTML(p, basis, st, zonderRes)}</span>`;
  /* de schaar zelf: enkel als de leerling op ✂ klikte. zweef: ze opent onderaan over haar kolom, over wat de leerling op dat
     moment niet nodig heeft (stroken, figuur, het omgezette kommagetal), zodat het scherm niet langer wordt */
  B.paneel = (p, basis, st, c, zweef) => `<div class="br-schaarslot${zweef ? ' zweef' : ''}" data-schp="${p}" data-sig="${B.sig(basis)}">${paneelHTML(p, basis, st, c)}</div>`;
  const kruis = knop=>{ knop.classList.remove('br-schud'); void knop.offsetWidth; knop.classList.add('br-schud', 'fout'); knop.insertAdjacentHTML('beforeend', '<i class="rv-kruis" aria-hidden="true">✕</i>'); };
  /* na een invoer: veranderde breuken krijgen een nieuwe keuze, de rest blijft staan (het invulvak houdt de focus) */
  B.ververs = (c, basisVan)=>{
    const v = c.huidig(), paden = new Set(); let gewijzigd = false;
    c.root.querySelectorAll('.rv-werk [data-schk], .rv-werk [data-schp]').forEach(e=>paden.add(e.dataset.schk || e.dataset.schp));
    paden.forEach(p=>{ const st = pad(v, p), basis = basisVan(v, p), oud = B.sig(basis) !== (c.root.querySelector(`[data-schk="${p}"], [data-schp="${p}"]`).dataset.sig);
      const s = B.sync(st, basis); if(s) gewijzigd = true;
      if(!s && !oud) return;
      c.root.querySelectorAll(`[data-schk="${p}"]`).forEach(e=>{ e.dataset.sig = B.sig(basis); e.innerHTML = keuzeHTML(p, basis, st, e.classList.contains('zonder')); });
      c.root.querySelectorAll(`[data-schp="${p}"]`).forEach(e=>{ e.dataset.sig = B.sig(basis); e.innerHTML = paneelHTML(p, basis, st, c); }); });
    if(gewijzigd) c.bewaar(v);
    knoppen(c, basisVan);
  };
  function knoppen(c, basisVan){
    const R = c.root, ui = c.ui, sleutel = p => c.q.id + '|' + p;
    const pas = (p, f)=>{ const v = c.huidig(), st = pad(v, p), basis = basisVan(v, p); if(!st) return; if(f(st, basis) === false) return; c.bewaar(v); c.teken(); };
    const reset = st=>{ st.done = false; st.cuts = []; st.for = null; };
    const knip = (p, knop)=>{
      const inp = R.querySelector(`[data-schgetal="${p}"]`), g = RV.nat(inp ? inp.value : '');
      if(g == null || g < 2){ if(inp){ inp.classList.add('rv-ongeldig'); inp.focus(); } return; }
      const v = c.huidig(), st = pad(v, p), basis = basisVan(v, p); if(!st || !basis) return;
      const r = B.na(basis, st.cuts);
      if(Math.abs(r.num) % g === 0 && r.den % g === 0){
        st.cuts = r.ok.concat([g]); st.for = B.sig(basis); (ui.schGetal = ui.schGetal || {})[sleutel(p)] = ''; ui.schWarn = null; c.bewaar(v); c.teken();
        const n = R.querySelector(`[data-schgetal="${p}"]`); if(n) n.focus();
      } else { st.x = (st.x || 0) + 1; c.bewaar(v); kruis(knop); setTimeout(()=>{ if(c.nogHier()) c.teken(); }, 900); }
    };
    const op = (attr, f) => R.querySelectorAll(`.rv-werk [${attr}]`).forEach(b=>b.onclick = ()=>f(b.getAttribute(attr), b));
    op('data-schopen', p=>pas(p, (st, basis)=>{ ui.schWarn = null;
      if(st.mode === 'cut' && st.done && basis && st.for === B.sig(basis)){ st.done = false; return; }   /* dichtgeklapt: verder knippen */
      st.mode = st.mode === 'cut' ? null : 'cut'; reset(st); }));
    op('data-schsluit', p=>pas(p, st=>{ st.mode = null; reset(st); ui.schWarn = null; }));
    op('data-schniet', (p, b)=>{ const v = c.huidig(), st = pad(v, p), basis = basisVan(v, p); if(!st || !basis) return;
      if(st.mode === 'skip'){ st.mode = null; reset(st); c.bewaar(v); c.teken(); return; }
      if(B.kan(basis)){ st.sx = (st.sx || 0) + 1; c.bewaar(v); kruis(b); setTimeout(()=>{ b.classList.remove('fout'); const x = b.querySelector('.rv-kruis'); if(x) x.remove(); }, 1100); return; }
      st.mode = 'skip'; st.cuts = []; st.done = true; st.for = B.sig(basis); ui.schWarn = null; c.bewaar(v); c.teken(); });
    op('data-schknip', (p, b)=>knip(p, b));
    op('data-schterug', p=>pas(p, st=>{ st.cuts.pop(); ui.schWarn = null; }));
    op('data-schklaar', p=>pas(p, (st, basis)=>{ if(!basis) return false;
      if(st.done){ st.done = false; return; }
      if(B.kan(B.na(basis, st.cuts))){ st.nv = (st.nv || 0) + 1; ui.schWarn = sleutel(p); return; }
      st.done = true; st.for = B.sig(basis); ui.schWarn = null; }));
    R.querySelectorAll('.rv-werk [data-schgetal]').forEach(inp=>{
      inp.oninput = e=>{ e.stopPropagation(); (ui.schGetal = ui.schGetal || {})[sleutel(inp.dataset.schgetal)] = inp.value; inp.classList.remove('rv-ongeldig'); };
      inp.onkeydown = e=>{ if(e.key === 'Enter'){ const b = R.querySelector(`[data-schknip="${inp.dataset.schgetal}"]`); if(b) b.click(); } }; });
  }
  B.bind = (c, basisVan)=>B.ververs(c, basisVan);

  /* ---------- kommagetal → breuk: de plaats van het laatste cijfer bepaalt de noemer. st = { pos:'t'|'h'|'d', t, sch } ---------- */
  const POS = [{ k:'t', lab:'tienden', den:10 }, { k:'h', lab:'honderdsten', den:100 }, { k:'d', lab:'duizendsten', den:1000 }];
  B.POS = POS;
  B.convBasis = st => { const p = st && POS.find(x=>x.k === st.pos), t = st && RV.nat(st.t); return p && t != null ? { num:t, den:p.den } : null; };
  B.convKlaar = st => !!st && B.ok(st.sch, B.convBasis(st));
  B.convUit = st => { const b = B.convBasis(st); return b ? B.na(b, st.sch.cuts) : null; };
  B.conv = (p, dec, st)=>{
    const cijfers = String(dec).replace('−', ''), [geheel, na] = cijfers.split(','), q = POS.find(x=>x.k === st.pos);
    const kol = ['E', 't', 'h', 'd'], cel = [geheel.slice(-1), na[0] || '', na[1] || '', na[2] || ''];
    return `<div class="br-conv"><div class="br-ckop">Kommagetal <b>${esc(cijfers)}</b> omzetten naar een breuk</div><div class="br-crij">`
      + `<table class="br-pwt" aria-label="plaatswaardetabel"><tr>${kol.map(k=>`<th>${k}</th>`).join('')}</tr><tr>${cel.map((d, i)=>`<td${i ? '' : ' class="e"'}>${esc(d)}${i ? '' : '<span class="br-komma">,</span>'}</td>`).join('')}</tr></table>`
      + `<div class="br-cmid"><div class="br-clab">① Waar staat het laatste cijfer?</div><div class="br-posknoppen">${POS.map(x=>`<button type="button" class="br-pos${st.pos === x.k ? ' aan' : ''}" data-pos="${p}" data-k="${x.k}" aria-pressed="${st.pos === x.k}">${x.lab}</button>`).join('')}</div></div></div>`
      + `<div class="br-clab">② Schrijf als breuk en kies ✂ vereenvoudigen of ✓ kan niet eenvoudiger</div><div class="rv-rij"><span class="rv-wisk">${esc(cijfers)} =</span>${B.teller(p + '.t', st.t, q ? q.den : '?')}${B.keuze(p + '.sch', B.convBasis(st), st.sch)}</div></div>`;
  };
  B.bindConv = c => c.root.querySelectorAll('.rv-werk [data-pos]').forEach(b=>b.onclick = ()=>{ const v = c.huidig(), st = pad(v, b.dataset.pos); st.pos = b.dataset.k; st.sch = B.SCH(); c.bewaar(v); c.teken(); });
})();
