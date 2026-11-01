/* Versleepbare vensters: gedeeld door alle pagina's (kop.js laadt dit bestand).
   Een leerling kan elk zwevend venster (rekenmachine, woordenboek, formularium, spiekbriefje, uitleg)
   met muis, pen of vinger verslepen, zodat de oefening altijd zichtbaar blijft.
   Afspraken (Tom, 1 november 2026):
   - vastnemen aan de titelbalk (greepje ⠿, handje als cursor); heeft het venster geen titelbalk, dan aan het hele venster;
   - een versleept venster blijft op dezelfde plek op het scherm, ook als de leerling scrolt;
   - de plek wordt niet onthouden: sluiten en opnieuw openen zet het venster op de standaardplek
     (blijft het venster open terwijl de pagina het opnieuw tekent, dan blijft het wel waar het stond);
   - dubbelklikken op de titelbalk zet het venster terug op de standaardplek;
   - met het toetsenbord: greepje aanklikken (Tab) en de pijltjestoetsen.
   Een nieuw venster versleepbaar maken: zet data-versleep op het element (en eventueel class "vs-kop" op de titelbalk).
   Vensters die zichzelf al verslepen (TI-30XB, rekenmachine van de 2B-modules) krijgen hier enkel
   dubbelklik-terugzetten en de standaardplek bij elke opening. */
(function(){
  'use strict';
  if(window.Versleep) return;

  /* welke vensters: selector → waar je het vastneemt */
  const SOORTEN = [
    { sel:'.paneel', kop:'.paneelkop' },                      /* wiskundige problemen 2A en 2B: rekenmachine, woordenboek, formularium */
    { sel:'.cheat', kop:':scope > h3' },                      /* spiekbriefje en "hoe werken de knoppen?" in de modules */
    { sel:'.vx-uit', kop:null },                              /* uitleg bij een foute stap in het vrij antwoordvak */
    { sel:'[data-versleep]', kop:'.vs-kop' }                  /* elk nieuw venster */
  ];
  const ALLES = SOORTEN.map(s => s.sel).join(', ');
  const NIET = 'button, input, select, textarea, a, label, output, [contenteditable], .toetsen';

  const css = `
  .vs-greep{ display:inline-block; margin-right:.4rem; color:inherit; opacity:.65; font-weight:700; letter-spacing:-.1em; cursor:grab; user-select:none; border-radius:.3rem; padding:0 .15rem; }
  .vs-greep:focus-visible{ outline:2px solid var(--orange, #FCAF17); outline-offset:1px; opacity:1; }
  .vs-hand{ cursor:grab; touch-action:none; user-select:none; -webkit-user-select:none; }
  .vs-sleept, .vs-sleept .vs-hand, .vs-sleept .vs-greep{ cursor:grabbing; }
  .vs-los{ position:fixed !important; z-index:2600 !important; margin:0 !important; box-sizing:border-box;
    max-width:calc(100vw - 16px); max-height:calc(100vh - 16px); overflow:auto; box-shadow:0 10px 30px rgba(20,50,55,.25); }
  .cheat.vs-los{ background:var(--card, #fff); }
  .vs-sluit{ float:right; margin-left:.5rem; width:1.7rem; height:1.7rem; border-radius:50%; border:none; background:var(--orange, #FCAF17); color:#1f2d2e; font:700 1rem/1 Carlito, Calibri, Arial, sans-serif; cursor:pointer; }
  .cheat:not(.vs-los) .vs-sluit{ display:none; }
  .rm-balk .vs-greep{ opacity:.8; }
  @media print{ .vs-greep, .vs-sluit{ display:none; } .vs-los{ position:static !important; box-shadow:none; } }
  @media (prefers-reduced-motion: no-preference){ .vs-terug{ transition:left .15s, top .15s; } }`;
  const st = document.createElement('style'); st.id = 'versleep-css'; st.textContent = css; document.head.append(st);

  const plek = new Map();     /* id → {l, t, w} van een open venster dat de pagina opnieuw tekent */
  const STAP = 20;

  function soortVan(el){ return SOORTEN.find(s => el.matches(s.sel)); }
  function kopVan(el, s){
    if(s && s.kop){ try{ const k = el.querySelector(s.kop); if(k) return k; }catch(e){} }
    return el;   /* geen titelbalk: het hele venster */
  }

  /* binnen het scherm houden; is het venster hoger dan het scherm, dan blijft de bovenkant zichtbaar */
  function binnen(el, l, t){
    const r = el.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    l = Math.max(0, Math.min(W - Math.min(r.width, W), l));
    t = Math.max(0, Math.min(H - Math.min(r.height, H), t));
    return [l, t];
  }
  /* op een vaste plek op het scherm zetten (ook als een voorouder een transform heeft) */
  function zet(el, l, t){
    [l, t] = binnen(el, l, t);
    el.style.left = l + 'px'; el.style.top = t + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto';
    const r = el.getBoundingClientRect();
    const dl = r.left - l, dt = r.top - t;
    if(Math.abs(dl) > .5 || Math.abs(dt) > .5){ el.style.left = (l - dl) + 'px'; el.style.top = (t - dt) + 'px'; }
    if(el.id) plek.set(el.id, { l, t, w:el.style.width });
  }
  function maakLos(el){
    if(el.classList.contains('vs-los')) return;
    const r = el.getBoundingClientRect();
    /* een spiekbriefje dat zweeft wordt smaller dan de pagina, zodat het weinig van de oefening bedekt */
    el.style.width = (el.matches('.cheat') ? Math.min(r.width, 520) : r.width) + 'px';
    el.classList.add('vs-los');
    zet(el, r.left, r.top);
  }
  function terug(el){
    if(el.classList.contains('rm-venster')){ el.style.left = el.style.top = el.style.right = el.style.bottom = ''; return; }
    if(el.classList.contains('ti30-win')){ ti30Standaard(el); return; }
    el.classList.remove('vs-los');
    ['left', 'top', 'right', 'bottom', 'width'].forEach(p => el.style.removeProperty(p));
    if(el.id) plek.delete(el.id);
  }

  /* ---------- slepen ---------- */
  function maakVersleepbaar(el){
    if(el.dataset.vsKlaar) return;
    const s = soortVan(el); if(!s) return;
    el.dataset.vsKlaar = '1';
    /* een paneel dat zichzelf al versleept (eigen sleepcode in een oudere bouw van wiskundige problemen): niets dubbel doen */
    if(el.matches('.paneel')){ const b = el.querySelector('.paneelkop b'); try{ if(b && /⠿/.test(getComputedStyle(b, '::before').content)) return; }catch(e){} }
    const kop = kopVan(el, s);
    kop.classList.add('vs-hand');
    if(!kop.querySelector(':scope > .vs-greep')){
      const g = document.createElement('span'); g.className = 'vs-greep'; g.textContent = '⠿'; g.tabIndex = 0;
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', 'Venster verplaatsen met de pijltjestoetsen, Home zet het terug');
      g.title = 'Versleep het venster. Dubbelklik om het terug te zetten.';
      kop.prepend(g);
      g.addEventListener('keydown', e => {
        const d = { ArrowLeft:[-STAP, 0], ArrowRight:[STAP, 0], ArrowUp:[0, -STAP], ArrowDown:[0, STAP] }[e.key];
        if(e.key === 'Home'){ e.preventDefault(); terug(el); return; }
        if(!d) return;
        e.preventDefault(); maakLos(el);
        const r = el.getBoundingClientRect(); zet(el, r.left + d[0], r.top + d[1]);
      });
    }
    /* spiekbriefje dat zweeft: een sluitknop in de titelbalk (klikt op de eigen knop, zodat alles gelijk blijft) */
    if(el.matches('.cheat') && kop !== el && !kop.querySelector('.vs-sluit')){
      const x = document.createElement('button'); x.type = 'button'; x.className = 'vs-sluit'; x.textContent = '×'; x.setAttribute('aria-label', 'Sluiten');
      x.addEventListener('click', () => { const b = eigenKnop(el); if(b) b.click(); else el.hidden = true; });
      kop.prepend(x);
    }
    /* de beweging volgen op het hele document: een snelle beweging buiten de balk breekt het slepen niet af */
    let d = null;
    const beweeg = e => {
      if(!d || e.pointerId !== d.id) return;
      if(!d.bezig){
        if(Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return;   /* pas slepen na een kleine beweging: klikken en dubbelklikken blijven werken */
        d.bezig = true;
        maakLos(el); el.classList.add('vs-sleept');
        d.dx = Math.min(d.dx, el.getBoundingClientRect().width - 24);
        try{ getSelection().removeAllRanges(); }catch(err){}
      }
      e.preventDefault();
      zet(el, e.clientX - d.dx, e.clientY - d.dy);
    };
    const los = e => { if(!d || e.pointerId !== d.id) return; d = null; el.classList.remove('vs-sleept');
      document.removeEventListener('pointermove', beweeg); document.removeEventListener('pointerup', los); document.removeEventListener('pointercancel', los); };
    kop.addEventListener('pointerdown', e => {
      if(e.button !== 0 || (e.target.closest(NIET) && !e.target.closest('.vs-greep'))) return;
      const r = el.getBoundingClientRect();
      d = { x:e.clientX, y:e.clientY, dx:e.clientX - r.left, dy:e.clientY - r.top, id:e.pointerId, bezig:false };
      if(e.pointerType === 'mouse') e.preventDefault();   /* geen tekst selecteren tijdens het slepen */
      document.addEventListener('pointermove', beweeg); document.addEventListener('pointerup', los); document.addEventListener('pointercancel', los);
    });
    kop.addEventListener('dblclick', e => { if(e.target.closest(NIET) && !e.target.closest('.vs-greep')) return; e.preventDefault(); terug(el); });
    /* opnieuw getekend terwijl het open bleef: terug naar waar de leerling het zette */
    if(el.id && plek.has(el.id)){
      const p = plek.get(el.id);
      if(p.w) el.style.width = p.w;
      el.classList.add('vs-los'); zet(el, p.l, p.t);
    }
  }
  function eigenKnop(el){
    let p = el.parentElement;
    for(let i = 0; p && i < 6; i++, p = p.parentElement){
      const b = p.querySelector('.cheat-btn[aria-expanded="true"]'); if(b) return b;
    }
    return null;
  }

  /* ---------- vensters die zichzelf al verslepen ---------- */
  function ti30Standaard(win){
    const r = win.getBoundingClientRect();
    win.style.left = Math.max(0, innerWidth - r.width - 24) + 'px';
    win.style.top = Math.max(0, innerHeight - Math.min(r.height, innerHeight) - 90) + 'px';
    try{ localStorage.removeItem('ti30xb_pos'); }catch(e){}
  }
  function eigenSlepers(el){
    if(el.dataset.vsKlaar) return;
    el.dataset.vsKlaar = '1';
    if(el.classList.contains('ti30-win')){
      ti30Standaard(el);   /* elke opening op de standaardplek */
      el.addEventListener('dblclick', e => { if(e.target.closest('button, .lcd')) return; ti30Standaard(el); });
    }
    if(el.classList.contains('rm-venster')){
      const balk = el.querySelector('.rm-balk');
      if(balk){
        const t = balk.querySelector('span');
        if(t && !t.querySelector('.vs-greep')){ const g = document.createElement('span'); g.className = 'vs-greep'; g.textContent = '⠿'; g.setAttribute('aria-hidden', 'true'); t.prepend(g); }
        balk.title = 'Versleep de rekenmachine. Dubbelklik om ze terug te zetten.';
        balk.addEventListener('dblclick', e => { if(e.target.closest('button')) return; terug(el); });
      }
    }
  }

  /* ---------- alles opvolgen wat de pagina toevoegt, verbergt of weghaalt ---------- */
  function scan(root){
    if(root.nodeType !== 1) return;
    const lijst = root.matches(ALLES) ? [root] : [];
    lijst.push(...root.querySelectorAll(ALLES));
    lijst.forEach(maakVersleepbaar);
    const eigen = root.matches('.ti30-win, .rm-venster') ? [root] : [];
    eigen.push(...root.querySelectorAll('.ti30-win, .rm-venster'));
    eigen.forEach(eigenSlepers);
  }
  const mo = new MutationObserver(lijst => {
    for(const m of lijst){
      if(m.type === 'childList') m.addedNodes.forEach(scan);
      else if(m.type === 'attributes' && m.target.hidden && (m.target.matches(ALLES) || m.target.matches('.rm-venster'))) terug(m.target);   /* gesloten: volgende keer op de standaardplek */
    }
    /* gesloten vensters (weggehaald en niet opnieuw getekend) vergeten hun plek */
    for(const id of [...plek.keys()]) if(!document.getElementById(id)) plek.delete(id);
  });
  function start(){
    scan(document.body);
    mo.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden'] });
  }
  if(document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  addEventListener('resize', () => document.querySelectorAll('.vs-los').forEach(el => { const r = el.getBoundingClientRect(); zet(el, r.left, r.top); }));

  window.Versleep = { maak:maakVersleepbaar, terug };
})();
