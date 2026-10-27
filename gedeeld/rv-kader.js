/* Rekenvaardigheden: kader voor een interactieve oefenreeks, één oefening per scherm met bolletjes en Vorige/Volgende.
   De pagina laadt dit script vóór opgave.js. In opgave.js:
     OPGAVE.invullen = opts => RV.maak(OPGAVE, TYPEN, opts);   (opts van gedeeld/opdracht.js: { antw, onInput(id, tekst) })
   Elke vraag in OPGAVE.delen: { id, type:'eigen', soort, punten, vraag:html (opdrachtzin), ... }; de titel van het deel is de badge.
   TYPEN[soort] = { leeg(q) → beginwaarde, volledig(q, v), uitleg(q) → html, teken(c) }
     c = { q, v (kopie van de waarde), vis, ant (de twee vakken), bewaar(v), teken() (opnieuw tekenen), ui (tijdelijke toestand), bezig(b) }
   Een antwoord wordt bewaard als JSON-tekst (Firestore weigert lijsten in lijsten): antw[id] = '{"start":-12,...}'.
   Invulvakken: RV.getal(pad, waarde, soort) en het tekenvak RV.teken(pad, waarde) (+ boven, − onder) werken vanzelf via data-pad.
   Een dubbel teken in de opgave: RV.dubbel(pad, buiten, binnen, getal, weg); beide tekens aanklikken zet { sign, weg } op pad. */
(function(){
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const RV = window.RV = {};
  RV.esc = esc;
  RV.fmt = n => n < 0 ? '−' + Math.abs(n) : String(n);
  RV.sprong = d => d > 0 ? '+' + d : d < 0 ? '−' + Math.abs(d) : '0';
  RV.lees = a => { if(a == null || a === '') return null; if(typeof a === 'object') return a; try{ return JSON.parse(a); }catch(e){ return null; } };
  RV.kopie = o => JSON.parse(JSON.stringify(o));
  /* een uitdrukking met zwarte tekens en wat lucht rond + en − */
  RV.uitdr = s => esc(s).replace(/ ([+−]) /g, ' <span class="rv-op">$1</span> ');
  const norm = s => String(s == null ? '' : s).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '');
  RV.nat = s => { const t = norm(s); return /^\d{1,6}$/.test(t) ? Number(t) : null; };
  RV.int = s => { const t = norm(s); return /^[+-]?\d{1,6}$/.test(t) ? Number(t) : null; };
  RV.bewerking = s => { const t = String(s || '').trim(); if(!t || !/^[\d\s+\-−–()=,.€°Cc]+$/.test(t)) return false;
    return (t.match(/\d+/g) || []).length >= 2 && /[+\-−–]/.test(t.replace(/^\s*[\-−–]/, '')); };
  const FMT = {
    nat:'Schrijf hier enkel het getal, zonder teken. Het teken kies je in het vakje ervoor.',
    int:'Schrijf een geheel getal, bijvoorbeeld 12 of −7.',
    expr:'Gebruik enkel getallen, +, −, haakjes en =. Schrijf minstens twee getallen.'
  };
  const geldig = (soort, w) => String(w).trim() === '' || (soort === 'nat' ? RV.nat(w) != null : soort === 'int' ? RV.int(w) != null : soort === 'expr' ? RV.bewerking(w) : true);

  /* invulvak; soort nat (getal zonder teken), int (geheel getal) of expr (bewerking) */
  RV.getal = (pad, w, soort = 'nat', cls = '', label = 'antwoord') =>
    `<input class="rv-getal ${cls}" type="text" autocomplete="off" spellcheck="false" data-pad="${pad}" data-soort="${soort}" value="${esc(w)}" aria-label="${esc(label)}">`;
  RV.bewerkingVak = (pad, w) => `<input class="rv-expr" type="text" autocomplete="off" spellcheck="false" data-pad="${pad}" data-soort="expr" value="${esc(w)}" placeholder="Typ hier je bewerking" aria-label="bewerking">`;
  /* tekenvak: + boven, − onder; de leerling klikt het juiste teken aan.
     vooraan: het getal staat vooraan (eerste term, uitkomst); een gekozen + verschijnt even en verdwijnt dan, want vooraan schrijf je geen + */
  RV.teken = (pad, w, label = 'teken', vooraan = false) => {
    const plus = w === '+' || w === '', min = w === '−' || w === '-';
    return `<span class="rv-teken${plus || min ? ' gekozen' : ''}${vooraan ? ' vooraan' : ''}${vooraan && plus ? ' plus-weg' : ''}" role="group" aria-label="${esc(label)}" data-teken="${pad}">` +
      `<button type="button" data-w="+" aria-pressed="${plus}" title="${vooraan ? 'plus (vooraan schrijf je geen +)' : 'plus'}">+</button><button type="button" data-w="−" aria-pressed="${min}" title="min">−</button></span>`;
  };
  /* dubbel teken in de opgave, bv. − (−9): de leerling klikt beide tekens aan, samen worden ze één teken.
     pad wijst naar een object { sign, weg }: sign wordt het nieuwe teken, weg = true. Nog eens klikken maakt het ongedaan. */
  RV.dubbel = (pad, buiten, binnen, getal, weg) => weg
    ? `<span class="rv-dubbel weg" data-dubbel="${pad}" data-b="${buiten}" data-i="${binnen}"><button type="button" data-k="x" title="Dubbel teken weggewerkt. Klik om het ongedaan te maken.">${buiten} (${binnen}</button>${esc(getal)})</span>`
    : `<span class="rv-dubbel" data-dubbel="${pad}" data-b="${buiten}" data-i="${binnen}" role="group" aria-label="dubbel teken: klik beide tekens aan"><button type="button" data-k="0" aria-pressed="false" title="Klik beide tekens aan">${buiten}</button> (<button type="button" data-k="1" aria-pressed="false" title="Klik beide tekens aan">${binnen}</button>${esc(getal)})</span>`;
  RV.dubbelTip = '<b>Dubbel teken?</b> Klik in de opgave de twee tekens aan: samen worden ze één teken.';
  /* uitkomst = tekenvak + getal zonder teken */
  RV.uitkomst = (v, cls = '') => `<span class="rv-term">${RV.teken('resSign', v.resSign, 'toestandsteken van de uitkomst', true)}${RV.getal('res', v.res, 'nat', cls)}</span>`;
  RV.tekenTip = '<p class="rv-tip">Toestandsteken: kies <b>+</b> of <b>−</b> in het vakje vóór je uitkomst.</p>';
  const zetPad = (o, pad, w) => { const p = pad.split('.'); let x = o; for(let i = 0; i < p.length - 1; i++) x = x[p[i]]; x[p[p.length - 1]] = w; };

  /* begrippen: eerste vermelding krijgt een uitleg bij aanwijzen */
  function begrippen(opg, html){
    const b = opg.begrippen || {}, keys = Object.keys(b).sort((x, y)=>y.length - x.length);
    if(!keys.length) return html;
    const re = new RegExp('(' + keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi'), gehad = new Set();
    return html.split(/(<[^>]+>)/).map(deel=>deel.startsWith('<') ? deel : deel.replace(re, m=>{ const k = m.toLowerCase(); if(gehad.has(k) || !b[k]) return m; gehad.add(k); return `<span class="rv-begrip" title="${esc(b[k])}">${m}</span>`; })).join('');
  }

  RV.maak = function(opg, TYPEN, opts = {}){
    const vragen = opg.delen.flatMap(d=>d.vragen.map(q=>Object.assign({ blok:d.titel }, q))), N = vragen.length;
    const antw = {}; Object.entries(opts.antw || {}).forEach(([id, a])=>{ const w = RV.lees(a); if(w) antw[id] = w; });
    const ui = {}; let i = 0, bezig = false;
    const leeg = q => TYPEN[q.soort].leeg(q), waarde = q => RV.kopie(antw[q.id] || leeg(q));
    const klaar = q => !!antw[q.id] && TYPEN[q.soort].volledig(q, antw[q.id]);
    const root = document.createElement('div'); root.className = 'rv';
    root.innerHTML = `<div class="rv-balk"><div class="rv-dots" role="list"></div><span class="rv-tel"></span></div>
      <div class="rv-kop"><span class="rv-badge"></span><span class="rv-nr"></span><h2 class="rv-titel"></h2><p class="rv-uitleg"></p></div>
      <div class="rv-werk"><div class="rv-vis"></div><div class="rv-ant"></div></div>
      <div class="rv-nav"><button type="button" class="btn ghost rv-vorige">← Vorige</button><button type="button" class="btn ghost rv-wis" title="Wis je antwoord op deze oefening">↺ Opnieuw beginnen</button><button type="button" class="btn rv-volgende">Volgende →</button></div>`;
    const $ = s => root.querySelector(s), vis = $('.rv-vis'), ant = $('.rv-ant');

    function bewaar(q, v){ antw[q.id] = v; if(opts.onInput) opts.onInput(q.id, JSON.stringify(v)); stip(); }
    function teken(){
      const q = vragen[i], T = TYPEN[q.soort];
      $('.rv-badge').textContent = q.blok || ''; $('.rv-nr').textContent = `Oefening ${i + 1} van ${N}`;
      $('.rv-titel').innerHTML = begrippen(opg, q.vraag); $('.rv-uitleg').innerHTML = begrippen(opg, T.uitleg ? T.uitleg(q) : '');
      root.dataset.soort = q.soort; $('.rv-werk').className = 'rv-werk'; vis.innerHTML = ''; ant.innerHTML = '';
      const c = { q, v:waarde(q), vis, ant, ui, root, bewaar:v=>bewaar(q, v), teken, bezig:b=>{ bezig = b; }, nogHier:()=>vragen[i] === q };
      T.teken(c); bind(c);
      $('.rv-vorige').disabled = i === 0;
      const laatste = i === N - 1, vb = $('.rv-volgende'); vb.textContent = laatste ? 'Klaar: indienen ↓' : 'Volgende →';
      stip();
    }
    function bind(c){
      const vak = c.ant.parentNode;
      vak.querySelectorAll('[data-teken]').forEach(g=>{
        const zet = (w, verder)=>{ const v = waarde(c.q); zetPad(v, g.dataset.teken, w); bewaar(c.q, v); if(w === '+' && g.classList.contains('vooraan')) c.ui.netPlus = g.dataset.teken; teken();
          const n = root.querySelector(verder ? `[data-teken="${g.dataset.teken}"] + input` : `[data-teken="${g.dataset.teken}"] [data-w="${w}"]`); if(n) n.focus(); };
        g.querySelectorAll('button').forEach(b=>b.onclick = ()=>zet(b.dataset.w, false));
        g.onkeydown = e=>{ if(e.key === '+'){ e.preventDefault(); zet('+', true); } else if(e.key === '-' || e.key === '−'){ e.preventDefault(); zet('−', true); } };
      });
      /* een + vooraan die net gekozen is: even tonen, dan verdwijnt hij */
      if(c.ui.netPlus){ const g = vak.querySelector(`.plus-weg[data-teken="${c.ui.netPlus}"]`); if(g) g.classList.add('net'); delete c.ui.netPlus; }
      vak.querySelectorAll('[data-dubbel]').forEach(g=>{
        const p = g.dataset.dubbel, sleutel = c.q.id + '|' + p, aan = c.ui[sleutel] || [];
        g.querySelectorAll('button').forEach(b=>{
          if(aan.includes(b.dataset.k)){ b.classList.add('aan'); b.setAttribute('aria-pressed', 'true'); }
          b.onclick = ()=>{
            const v = waarde(c.q);
            if(g.classList.contains('weg')){ zetPad(v, p + '.sign', null); zetPad(v, p + '.weg', false); delete c.ui[sleutel]; bewaar(c.q, v); teken(); return; }
            const s = c.ui[sleutel] = (c.ui[sleutel] || []).filter(k=>k !== b.dataset.k).concat(aan.includes(b.dataset.k) ? [] : [b.dataset.k]);
            if(s.length < 2){ b.classList.toggle('aan', s.includes(b.dataset.k)); b.setAttribute('aria-pressed', String(s.includes(b.dataset.k))); return; }
            delete c.ui[sleutel];
            zetPad(v, p + '.sign', g.dataset.b === g.dataset.i ? '+' : '−'); zetPad(v, p + '.weg', true); bewaar(c.q, v); teken();
            const n = root.querySelector(`input[data-pad="${p}.n"]`); if(n) n.focus();
          };
        });
      });
      vak.querySelectorAll('input[data-pad]').forEach(inp=>{
        inp.addEventListener('input', ()=>{ const v = waarde(c.q); zetPad(v, inp.dataset.pad, inp.value); bewaar(c.q, v); });
        inp.addEventListener('blur', ()=>vorm(vak));
        inp.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ const al = [...vak.querySelectorAll('input[data-pad]')]; const n = al[al.indexOf(inp) + 1]; if(n) n.focus(); } });
      });
      vorm(vak);
    }
    /* enkel een vormcontrole, geen oordeel over juist of fout */
    function vorm(vak){
      const fout = new Set();
      vak.querySelectorAll('input[data-pad]').forEach(inp=>{ const ok = geldig(inp.dataset.soort, inp.value); inp.classList.toggle('rv-ongeldig', !ok); if(!ok) fout.add(inp.dataset.soort); });
      let m = vak.querySelector('.rv-vorm'); if(!m){ m = document.createElement('p'); m.className = 'rv-vorm'; m.setAttribute('role', 'status'); vak.querySelector('.rv-ant').append(m); }
      m.textContent = [...fout].map(s=>FMT[s]).join(' ');
    }
    function stip(){
      let vorig = null;
      $('.rv-dots').innerHTML = vragen.map((q, k)=>{ const nieuw = vorig !== null && q.blok !== vorig; vorig = q.blok;
        return `<button type="button" role="listitem" class="rv-dot${nieuw ? ' nieuw' : ''}${k === i ? ' nu' : ''}${klaar(q) ? ' af' : ''}" data-i="${k}" title="Oefening ${k + 1} · ${esc(q.blok || '')}${klaar(q) ? ' · ingevuld' : ''}" aria-label="Oefening ${k + 1}${klaar(q) ? ', ingevuld' : ''}"${k === i ? ' aria-current="step"' : ''}></button>`; }).join('');
      $('.rv-dots').querySelectorAll('.rv-dot').forEach(d=>d.onclick = ()=>ga(+d.dataset.i));
      $('.rv-tel').textContent = `${vragen.filter(klaar).length} / ${N} ingevuld`;
    }
    function ga(k){
      if(bezig) return; i = Math.max(0, Math.min(N - 1, k)); teken();
      const r = root.getBoundingClientRect(); if(r.top < 0 || r.top > innerHeight * .3) root.scrollIntoView({ behavior:'smooth', block:'start' });
    }
    $('.rv-vorige').onclick = ()=>ga(i - 1);
    $('.rv-volgende').onclick = ()=>{ if(i < N - 1) return ga(i + 1); const b = document.querySelector('.opdr-balk .btn'); if(b){ b.scrollIntoView({ behavior:'smooth', block:'center' }); b.focus({ preventScroll:true }); } };
    $('.rv-wis').onclick = ()=>{ if(bezig) return; const q = vragen[i]; delete ui[q.id]; delete antw[q.id]; if(opts.onInput) opts.onInput(q.id, ''); teken(); };
    teken();
    return root;
  };
})();
