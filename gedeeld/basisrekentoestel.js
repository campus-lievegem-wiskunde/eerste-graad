/* Basisrekentoestel voor wiskundige problemen in de B-stroom (1B en 2B).
   kop.js laadt dit bestand enkel op de sites 1b-wp en 2b-wp. Op de andere pagina's van 1B en 2B blijft het rekentoestel
   zoals het was (afspraak 20 november 2026).
   Afspraken (Tom Van Daele, 16 november 2026):
   - bij problemen oplossen in de B-stroom is het rekentoestel altijd dit basistoestel, nooit de wetenschappelijke TI-30XB;
   - toetsen: cijfers, komma, + − × ÷, =, C, ⌫ en haakjes; geen %, √, ± of geheugen;
   - het venster zweeft rechtsonder op het scherm, los van de opgave, en is versleepbaar aan de titelbalk
     (gedeeld/versleep.js: greepje ⠿, pijltjestoetsen, dubbelklik zet terug, de plek wordt niet onthouden).
   Gebruik:  Basisrekentoestel.wissel()  opent of sluit;  .open()  .sluit()  .wis()  .isOpen()  .druk('7').
   Bij openen en sluiten krijgt document de gebeurtenis 'basisrekentoestel' (detail.open). */
(function(){
  'use strict';
  if(window.Basisrekentoestel) return;

  const css = `
  .brt{ position:fixed; right:max(16px, env(safe-area-inset-right, 0px)); bottom:16px; z-index:3100; width:236px; box-sizing:border-box;
    background:var(--card, #fff); color:var(--ink, #173436); border:2px solid var(--accent, #3BC1C5); border-radius:.9rem;
    box-shadow:0 8px 24px rgba(0,0,0,.2); overflow:hidden; font-family:inherit; }
  .brt.vs-los{ z-index:3100 !important; overflow:hidden; }
  .brt[hidden]{ display:none; }
  .brt-balk{ display:flex; justify-content:space-between; align-items:center; background:var(--accent, #3BC1C5); color:var(--on-accent, #fff);
    font-weight:800; padding:.35rem .5rem .35rem .6rem; }
  .brt-balk .vs-greep{ opacity:.85; }
  .brt-x{ background:none; border:none; color:inherit; font:inherit; font-size:1.05rem; line-height:1; cursor:pointer; padding:.2rem .4rem; border-radius:.4rem; }
  .brt-x:hover, .brt-x:focus-visible{ background:rgba(255,255,255,.3); }
  .brt-scherm{ margin:.5rem; padding:.4rem .6rem; border-radius:.5rem; background:#e8f3ef; color:#173436; text-align:right; font-variant-numeric:tabular-nums; }
  .brt-som{ min-height:1.2rem; font-size:.85rem; overflow-wrap:anywhere; }
  .brt-uit{ display:block; font-size:1.55rem; font-weight:800; white-space:nowrap; overflow-x:auto; }
  .brt-toetsen{ display:grid; grid-template-columns:repeat(4, 1fr); gap:.3rem; padding:0 .5rem .5rem; }
  .brt-k{ font:inherit; font-weight:800; font-size:1.05rem; min-height:2.15rem; padding:0; border-radius:.5rem; border:1.5px solid var(--border, #cfe3e4);
    background:var(--card, #fff); color:var(--ink, #173436); cursor:pointer; touch-action:manipulation; }
  .brt-k:hover{ border-color:var(--orange, #FCAF17); }
  .brt-k:focus-visible{ outline:2px solid var(--orange, #FCAF17); outline-offset:1px; }
  .brt-k.op{ color:var(--accent-dark, #1f8f93); background:var(--tq-soft, #e8f8f8); }
  .brt-k.wis{ color:var(--bad, #b3261e); }
  .brt-k.is{ background:var(--orange, #FCAF17); border-color:var(--orange, #FCAF17); color:#2b1b00; }
  @media print{ .brt{ display:none; } }`;

  /* toetsen: [wat de leerling ziet, intern teken, soort, voorleesnaam] */
  const TOETSEN = [
    ['C', 'C', 'wis', 'alles wissen'], ['⌫', '⌫', 'wis', 'laatste teken wissen'], ['(', '(', 'op', 'haakje openen'], [')', ')', 'op', 'haakje sluiten'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['÷', '/', 'op', 'gedeeld door'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['×', '*', 'op', 'maal'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['−', '-', 'op', 'min'],
    ['0', '0'], [',', '.', '', 'komma'], ['=', '=', 'is', 'is gelijk aan'], ['+', '+', 'op', 'plus']];

  let venster = null, somEl = null, uitEl = null;
  let expr = '', klaar = false, ans = null;

  /* ---------- rekenen: eigen ontleder (geen eval), met voorrangsregels, haakjes en 2(3 + 4) = 2 × (3 + 4) ---------- */
  function rekenUit(s){
    let i = 0;
    const kijk = () => s[i];
    function getal(){
      const m = /^\d+(\.\d*)?|^\.\d+/.exec(s.slice(i));
      if(!m) throw new Error('getal');
      i += m[0].length; return parseFloat(m[0]);
    }
    function factor(){
      if(kijk() === '-'){ i++; return -factor(); }
      if(kijk() === '+'){ i++; return factor(); }
      let v;
      if(kijk() === '('){ i++; v = som(); if(kijk() === ')') i++; }   /* een vergeten haakje achteraan sluiten we zelf */
      else v = getal();
      while(kijk() === '('){ i++; const w = som(); if(kijk() === ')') i++; v *= w; }
      return v;
    }
    function term(){
      let v = factor();
      while(kijk() === '*' || kijk() === '/'){
        const o = s[i++], w = factor();
        if(o === '/' && w === 0) throw new Error('nul');
        v = o === '*' ? v * w : v / w;
      }
      return v;
    }
    function som(){
      let v = term();
      while(kijk() === '+' || kijk() === '-'){ const o = s[i++], w = term(); v = o === '+' ? v + w : v - w; }
      return v;
    }
    const v = som();
    if(i < s.length || !isFinite(v)) throw new Error('rest');
    return parseFloat(v.toPrecision(10));   /* 0,1 + 0,2 = 0,3 */
  }
  const mooi = s => String(s).replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\+/g, ' + ').replace(/-/g, ' − ').replace(/\./g, ',').replace(/\s+/g, ' ').trim();
  const getalTekst = v => { let t = String(v); if(/e/.test(t)) t = v.toFixed(Math.abs(v) < 1 ? 10 : 0).replace(/\.?0+$/, ''); return t.replace('.', ',').replace('-', '−'); };

  function toon(){
    if(!venster) return;
    somEl.textContent = mooi(expr) + (klaar ? ' =' : '');
    if(!klaar){   /* tijdens het typen: het getal dat je intikt in het groot, de hele som erboven */
      const m = /[\d.]+$/.exec(expr);
      if(m) uitEl.textContent = m[0].replace('.', ','); else if(!expr) uitEl.textContent = '0';
    }
    uitEl.scrollLeft = uitEl.scrollWidth;
  }
  const OPS = '+-*/';
  function druk(k){
    if(k === 'C'){ expr = ''; klaar = false; if(uitEl) uitEl.textContent = '0'; toon(); return; }
    if(k === '⌫'){ if(klaar){ klaar = false; } else expr = expr.slice(0, -1); if(!expr && uitEl) uitEl.textContent = '0'; toon(); return; }
    if(k === '='){
      if(!expr || klaar) return;
      try{ ans = rekenUit(expr.replace(/[+\-*/(]+$/, '') || '0'); uitEl.textContent = getalTekst(ans); klaar = true; }
      catch(e){ ans = null; uitEl.textContent = 'Fout'; klaar = true; }
      toon(); return;
    }
    if(klaar){   /* na = : een bewerking rekent verder met de uitkomst, iets anders begint een nieuwe som */
      expr = OPS.includes(k) && ans != null ? String(ans) : '';
      klaar = false;
    }
    if(expr.length >= 40) return;
    const laatste = expr.slice(-1);
    if(OPS.includes(k)){
      if(!expr || laatste === '('){ if(k !== '-') return; }                       /* enkel een minteken kan vooraan staan */
      else if(OPS.includes(laatste)){ expr = expr.slice(0, -1); if(!expr || expr.slice(-1) === '('){ if(k !== '-'){ toon(); return; } } }   /* twee bewerkingen na elkaar: de laatste telt */
      else if(laatste === '.') expr = expr.slice(0, -1);
    } else if(k === '.'){
      const deel = /[\d.]*$/.exec(expr)[0];
      if(deel.includes('.')) return;                                              /* één komma per getal */
      if(!deel) expr += '0';
    } else if(k === ')'){
      const open = (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
      if(open <= 0 || laatste === '(' || OPS.includes(laatste)) return;
    }
    expr += k; toon();
  }

  /* het venster hangt aan de pagina; staat een kaart op het bord of in volledig scherm, dan hangt het daarin (anders is het onzichtbaar) */
  const ouder = () => document.fullscreenElement || document.body;
  function hang(){ if(venster && venster.parentNode !== ouder()) ouder().append(venster); }

  function bouw(){
    if(!document.getElementById('brt-css')){ const st = document.createElement('style'); st.id = 'brt-css'; st.textContent = css; document.head.append(st); }
    const p = document.createElement('div'); p.className = 'brt'; p.id = 'basisrekentoestel'; p.hidden = true; p.tabIndex = -1;
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Rekenmachine'); p.setAttribute('data-versleep', '');
    const balk = document.createElement('div'); balk.className = 'brt-balk vs-kop';
    const titel = document.createElement('b'); titel.textContent = 'Rekenmachine';
    const x = document.createElement('button'); x.type = 'button'; x.className = 'brt-x'; x.textContent = '✕'; x.setAttribute('aria-label', 'Sluit de rekenmachine');
    x.addEventListener('click', sluit);
    balk.append(titel, x);
    const scherm = document.createElement('div'); scherm.className = 'brt-scherm';
    somEl = document.createElement('div'); somEl.className = 'brt-som';
    uitEl = document.createElement('output'); uitEl.className = 'brt-uit'; uitEl.setAttribute('aria-live', 'polite'); uitEl.textContent = '0';
    scherm.append(somEl, uitEl);
    const toetsen = document.createElement('div'); toetsen.className = 'brt-toetsen toetsen';
    TOETSEN.forEach(([t, k, soort, naam]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'brt-k' + (soort ? ' ' + soort : ''); b.textContent = t; b.dataset.k = t;
      if(naam) b.setAttribute('aria-label', naam);
      b.addEventListener('click', () => druk(k));
      toetsen.append(b);
    });
    p.append(balk, scherm, toetsen);
    /* toetsenbord: werkt zodra het venster de focus heeft (na openen of een klik op een toets) */
    p.addEventListener('keydown', e => {
      if(e.ctrlKey || e.metaKey || e.altKey || e.target.closest('.vs-greep')) return;
      const m = { Enter:'=', '=':'=', Backspace:'⌫', Delete:'C', Escape:'C', c:'C', C:'C', '*':'*', x:'*', X:'*', '×':'*', '/':'/', ':':'/', '÷':'/', '-':'-', '−':'-', '+':'+', ',':'.', '.':'.', '(':'(', ')':')' };
      const k = /^\d$/.test(e.key) ? e.key : m[e.key];
      if(!k) return;
      if(e.key === 'Enter' && e.target.closest('button')) return;   /* Enter op een toets drukt die toets */
      e.preventDefault(); druk(k);
    });
    venster = p; hang();
  }
  function meld(){ document.dispatchEvent(new CustomEvent('basisrekentoestel', { detail:{ open:isOpen() } })); }
  function isOpen(){ return !!(venster && venster.isConnected && !venster.hidden); }
  function open(){ if(!venster) bouw(); hang(); if(venster.hidden){ venster.hidden = false; toon(); meld(); } venster.focus({ preventScroll:true }); }
  function sluit(){ if(!venster || venster.hidden) return; venster.hidden = true; meld(); }
  function wissel(){ if(isOpen()) sluit(); else open(); }
  function wis(){ druk('C'); }

  document.addEventListener('fullscreenchange', () => { if(isOpen()) hang(); });

  window.Basisrekentoestel = { open, sluit, wissel, wis, isOpen, druk: t => { const r = TOETSEN.find(x => x[0] === t || x[1] === t); if(r) druk(r[1]); }, rekenUit };
})();
