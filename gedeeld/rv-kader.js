/* Rekenvaardigheden: kader voor een interactieve oefenreeks, één oefening per scherm met bolletjes en Vorige/Volgende.
   De pagina laadt dit script vóór opgave.js. In opgave.js:
     OPGAVE.invullen = opts => RV.maak(OPGAVE, TYPEN, opts);   (opts van gedeeld/opdracht.js: { antw, onInput(id, tekst) })
   Elke vraag in OPGAVE.delen: { id, type:'eigen', soort, punten, vraag:html (opdrachtzin), ... }; de titel van het deel is de badge.
   TYPEN[soort] = { leeg(q) → beginwaarde, volledig(q, v), uitleg(q) → html, teken(c) }
     c = { q, v (kopie van de waarde), vis, ant (de twee vakken), bewaar(v), teken() (opnieuw tekenen), ui (tijdelijke toestand), bezig(b), huidig() (de waarde nu) }
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
  RV.bewerking = s => { const t = String(s || '').trim(); if(!t || !/^[\d\s+\-−–()=,.€°Ccm⋅·×xX*:\/]+$/.test(t)) return false;
    return (t.match(/\d+/g) || []).length >= 2 && /[+\-−–⋅·×xX*:\/]/.test(t.replace(/^\s*[\-−–]/, '')); };
  const FMT = {
    nat:'Schrijf hier enkel het getal, zonder teken. Het teken kies je in het vakje ervoor.',
    int:'Schrijf een geheel getal, bijvoorbeeld 12 of −7.',
    expr:'Gebruik enkel getallen, +, −, ⋅ (of x), :, haakjes en =. Schrijf minstens twee getallen.'
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

  /* ---------- tekenparen (hoofdstuk 3 tot 7): elk + en − in een uitdrukking is aanklikbaar ----------
     Twee aangeklikte tekens vormen een paar. Plus en min: een bewerkingsteken en het teken tussen de haakjes erachter
     worden samen één teken, de haakjes verdwijnen. Maal en deel (maal = true): twee minnetjes verdwijnen samen, een
     plusje tussen haakjes verdwijnt altijd. Al het andere geeft een rood kruisje (st.x telt ze voor de leerkracht).
     Notatie: 5/6 breuk · ~−5/6 minteken in de teller · 0,75 kommagetal · ⋅ en : bewerkingen. st = { p:[[i, j], …], x } */
  const T = RV.tekens = {};
  T.leeg = () => ({ p:[], x:0 });
  T.tokens = expr => {
    const t = [], ch = Array.from(String(expr)); let teller = false;
    for(let i = 0; i < ch.length; i++){
      const c = ch[i];
      if(c === '~'){ teller = true; continue; }
      if(/\d/.test(c)){
        let d = c; while(i + 1 < ch.length && /[\d,]/.test(ch[i + 1])) d += ch[++i];
        if(ch[i + 1] === '/'){ i++; let n = ''; while(i + 1 < ch.length && /\d/.test(ch[i + 1])) n += ch[++i];
          const tok = { k:'frac', t:d, n }; const v = t.length - 1; if(v >= 0 && t[v].k === 'sign' && t[v].teller) tok.ts = v; t.push(tok); }
        else t.push({ k:'num', ch:d });
      } else if(c === '−' || c === '+' || c === '-'){
        let j = t.length - 1; while(j >= 0 && t[j].k === 'sp') j--;
        t.push({ k:teller || j < 0 || t[j].ch === '(' || t[j].k === 'mop' ? 'sign' : 'op', ch:c === '-' ? '−' : c, teller }); teller = false;
      } else if(c === '⋅' || c === ':'){ t.push({ k:'mop', ch:c }); teller = false; }
      else if(c === '(' || c === ')') t.push({ k:'par', ch:c });
      else if(c === ' ') t.push({ k:'sp', ch:c });
      else t.push({ k:'txt', ch:c });
    }
    return t;
  };
  const volgende = (t, i) => { let j = i + 1; while(j < t.length && (t[j].k === 'sp' || t[j].weg)) j++; return j < t.length ? j : -1; };
  const vorige = (t, i) => { let j = i - 1; while(j >= 0 && (t[j].k === 'sp' || t[j].weg)) j--; return j; };
  const haakjesWeg = (t, s) => { const p = vorige(t, s); if(p >= 0 && t[p].ch === '('){ const n = volgende(t, s), c = n >= 0 ? volgende(t, n) : -1; if(c >= 0 && t[c].ch === ')'){ t[p].weg = true; t[c].weg = true; } } };
  T.check = (t, a, b, maal) => {
    if(a === b || !t[a] || !t[b] || t[a].weg || t[b].weg) return null;
    if(maal){
      if(t[a].k !== 'sign' || t[b].k !== 'sign') return null;
      return { soort:'maal', weg:t[a].ch === '−' && t[b].ch === '−' ? [a, b] : [a, b].filter(i=>t[i].ch === '+') };
    }
    const o = t[a].k === 'op' ? a : t[b].k === 'op' ? b : -1, s = o === a ? b : a;
    if(o < 0 || t[s].k !== 'sign') return null;
    const p = volgende(t, o);
    if(p < 0 || t[p].ch !== '(' || volgende(t, p) !== s) return null;
    return { soort:'plus', op:o, teken:s };
  };
  /* de tokens nadat alle geldige paren toegepast zijn */
  T.pas = (expr, paren, maal) => {
    const t = T.tokens(expr);
    (paren || []).forEach(([a, b])=>{ const r = T.check(t, a, b, maal); if(!r) return;
      if(r.soort === 'maal') r.weg.forEach(i=>{ t[i].weg = true; haakjesWeg(t, i); });
      else { t[r.op].ch = t[r.op].ch === t[r.teken].ch ? '+' : '−'; t[r.teken].weg = true; haakjesWeg(t, r.teken); } });
    return t;
  };
  T.minnen = (expr, paren, maal) => T.pas(expr, paren, maal).filter(x=>!x.weg && x.ch === '−').length;
  /* termen van de (herschreven) uitdrukking: [{ teken:+1|−1, tok, i }] */
  T.termen = t => {
    const uit = [];
    t.forEach((x, i)=>{ if(x.weg || (x.k !== 'num' && x.k !== 'frac')) return;
      let sg = 1, j = vorige(t, i);
      if(x.k === 'frac' && x.ts != null && !t[x.ts].weg){ if(t[x.ts].ch === '−') sg = -sg; if(j === x.ts) j = vorige(t, j); }
      if(j >= 0 && t[j].k === 'sign' && !t[j].teller){ if(t[j].ch === '−') sg = -sg; j = vorige(t, j); }
      if(j >= 0 && t[j].ch === '(') j = vorige(t, j);
      if(j >= 0 && t[j].k === 'op' && t[j].ch === '−') sg = -sg;
      uit.push({ teken:sg, tok:x, i }); });
    return uit;
  };
  /* html: key = aanklikbaar (null: enkel tonen); o = { ui, maal, kaders:'alle'|'hint'|'geen', vervang:{ i:html } } */
  T.html = (expr, st, key, o = {}) => {
    const t = T.pas(expr, st && st.p, o.maal), ui = o.ui || {}, sel = key && ui.tsel && ui.tsel.key === key ? ui.tsel.ti : -1, hint = {};
    if(o.kaders === 'hint'){
      if(o.maal) t.forEach((x, i)=>{ if(!x.weg && x.ch === '−' && x.k === 'sign') hint[i] = 1; });
      else t.forEach((x, i)=>{ if(x.weg || x.k !== 'op') return; const p = volgende(t, i); if(p >= 0 && t[p].ch === '('){ const s = volgende(t, p); if(s >= 0 && t[s].k === 'sign'){ hint[i] = 1; hint[s] = 1; } } });
    }
    const knop = (x, i) => {
      if(!key) return `<span class="rv-op">${x.ch}</span>`;
      const cls = ['rv-sg']; if(o.kaders === 'alle' || hint[i]) cls.push('kader'); if(i === sel) cls.push('sel'); if(ui.tpop && ui.tpop.key === key && ui.tpop.ti === i) cls.push('pop');
      return `<button type="button" class="${cls.join(' ')}" data-sg="${esc(key)}" data-ti="${i}" aria-label="teken ${x.ch === '−' ? 'min' : 'plus'}"${i === sel ? ' aria-pressed="true"' : ''}>${x.ch}</button>`;
    };
    return '<span class="rv-uitdr">' + t.map((x, i)=>{
      if(x.weg) return '';
      if(o.vervang && o.vervang[i] != null) return o.vervang[i];
      if(x.k === 'mop') return `<span class="rv-op">${x.ch}</span>`;
      if(x.k === 'sign' || x.k === 'op') return x.teller ? '' : knop(x, i);
      if(x.k === 'sp') return '<span class="rv-sp"> </span>';
      if(x.k === 'frac') return `<span class="rv-br"><span class="rv-br-t">${x.ts != null && !t[x.ts].weg ? knop(t[x.ts], x.ts) : ''}${esc(x.t)}</span><span class="rv-br-n">${esc(x.n)}</span></span>`;
      return esc(x.ch);
    }).join('') + '</span>';
  };
  /* kliks koppelen; zoek(v, key) → { st, expr, maal } (st is een deel van v); fout(key) voor een extra melding */
  T.bind = (c, zoek, fout) => {
    c.root.querySelectorAll('.rv-werk [data-sg]').forEach(knop=>knop.onclick = ()=>{
      if(c.ui.tbezig) return;
      const key = knop.dataset.sg, ti = +knop.dataset.ti, sel = c.ui.tsel;
      if(!sel || sel.q !== c.q.id || sel.key !== key){ c.ui.tsel = { q:c.q.id, key, ti }; c.teken(); return; }
      if(sel.ti === ti){ delete c.ui.tsel; c.teken(); return; }
      const v = c.huidig(), R = zoek(v, key), r = T.check(T.pas(R.expr, R.st.p, R.maal), sel.ti, ti, R.maal);
      const k1 = c.root.querySelector(`[data-sg="${key}"][data-ti="${sel.ti}"]`);
      c.ui.tbezig = true; c.bezig(true);
      if(r){
        [k1, knop].forEach(k=>{ if(!k) return; const i = +k.dataset.ti; k.classList.add(r.soort === 'maal' ? (r.weg.includes(i) ? 'verdwijn' : 'samen') : (i === r.teken ? 'verdwijn' : 'samen')); });
        setTimeout(()=>{ const v2 = c.huidig(); zoek(v2, key).st.p.push([sel.ti, ti]); c.bewaar(v2);
          delete c.ui.tsel; c.ui.tbezig = false; c.bezig(false); c.ui.tpop = r.soort === 'plus' ? { key, ti:r.op } : null; c.ui.tvers = true;
          if(c.nogHier()) c.teken(); delete c.ui.tpop; delete c.ui.tvers; }, 380);
      } else {
        R.st.x = (R.st.x || 0) + 1; c.bewaar(v);
        [k1, knop].forEach(k=>{ if(k){ k.classList.add('fout'); k.insertAdjacentHTML('beforeend', '<i class="rv-kruis" aria-hidden="true">✕</i>'); } });
        if(fout) fout(key);
        setTimeout(()=>{ delete c.ui.tsel; c.ui.tbezig = false; c.bezig(false); if(c.nogHier()) c.teken(); }, 950);
      }
    });
  };

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
      root.dataset.soort = q.soort; $('.rv-werk').className = 'rv-werk'; vis.innerHTML = ''; ant.innerHTML = ''; vis.oninput = ant.oninput = null;
      const c = { q, v:waarde(q), vis, ant, ui, root, bewaar:v=>bewaar(q, v), teken, bezig:b=>{ bezig = b; }, nogHier:()=>vragen[i] === q, huidig:()=>waarde(q) };
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
