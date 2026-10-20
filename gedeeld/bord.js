/* Bordmodus: één kaart groot op het bord, met de oplossing stap voor stap. Gedeeld door alle modules.
   kop.js laadt dit bestand op elke oefenpagina (#app). Na 'inhoud-geladen' krijgt elke kaartkop een knop ⛶ Bord,
   behalve in de proeftoetsen (onderdeel-id begint met toets). Verborgen onder 700 px (gsm).
   Bouwt een module zelf al een bordknop (.px-bord-btn of .bord-btn), dan bouwt dit bestand er geen.
   Enkel leerkrachten en beheerders (body data-rol, gezet door aanmelden.js) zien Bord, ook de eigen bordknop van een module.
   Leerlingen krijgen op dezelfde plaats ⛶ Volledig scherm: de kaart groot en op volledig scherm, zonder oplossingsstappen. */
(function(){
  const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
  const css = `
  .px-hbtns{ display:inline-flex; gap:.4rem; align-items:center; flex-wrap:wrap; }
  .px-bord-btn{ border:1.5px solid var(--border); background:var(--card); border-radius:.6rem; padding:.3rem .7rem; font-size:.78rem; font-weight:700; cursor:pointer; color:var(--ink-soft); white-space:nowrap; font-family:inherit; }
  .px-bord-btn:hover{ border-color:var(--accent); color:var(--accent-dark); }
  .px-vs-btn{ border:1.5px solid var(--border); background:var(--card); border-radius:.6rem; padding:.3rem .7rem; font-size:.78rem; font-weight:700; cursor:pointer; color:var(--ink-soft); white-space:nowrap; font-family:inherit; }
  .px-vs-btn:hover{ border-color:var(--accent); color:var(--accent-dark); }
  .card-head > .px-vs-btn{ margin-left:auto; }
  .card-head > .px-vs-btn + .refresh-btn{ margin-left:0; }
  body:not([data-rol=leerkracht]):not([data-rol=beheerder]) .px-bord-btn,
  body:not([data-rol=leerkracht]):not([data-rol=beheerder]) .bord-btn{ display:none !important; }
  @media (max-width:700px){ .px-bord-btn, .px-vs-btn{ display:none; } }
  .px-board .px-vs-btn{ display:none; }
  .px-board{ position:fixed; inset:0; z-index:3000; background:var(--bg); overflow:auto; padding:0 max(16px, env(safe-area-inset-right, 0px)) 2rem max(16px, env(safe-area-inset-left, 0px)); }
  .px-board .px-bar{ position:sticky; top:0; z-index:2; display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; padding:.6rem 0; background:var(--bg); border-bottom:2px solid var(--border); margin-bottom:1rem; }
  .px-board .px-bar .px-cnt{ font-weight:700; font-size:1.05rem; color:var(--accent-dark); margin-right:auto; }
  .px-board .px-bar .px-none{ color:var(--ink-soft); font-size:.85rem; }
  .px-board > .card{ max-width:1200px; margin:0 auto; }
  .px-board .sol.px-shown{ animation:pxIn .35s ease-out; border-color:var(--orange); }
  @keyframes pxIn{ from{ opacity:0; transform:translateY(6px); } }
  @media (prefers-reduced-motion: reduce){ .px-board .sol.px-shown{ animation:none; } }
  `;

  let B = null;
  /* stappen: de uitgeschreven oplossingen (.sol) en knoppen die een uitleg of animatie starten;
     een losse knop "Toon oplossing" telt mee als er geen .sol naast staat (eigen oefenvormen zoals venndiagrammen) */
  const UITLEG = /toon mij hoe|toon de oplossing|toon de werkwijze|bekijk hoe het moet|^\s*▶/i;
  const steps = card => [...card.querySelectorAll('.sol, button')].filter(e=>{
    if(e.classList.contains('sol')) return !!(e.textContent.trim() || e.querySelector('svg, img, canvas'));
    if(e.closest('.px-bar, .px-hbtns')) return false;
    if(!e.classList.contains('linkbtn')) return UITLEG.test(e.textContent);
    const act = e.closest('.q-act');
    return /^\s*toon oplossing\s*$/i.test(e.textContent) && !(act && act.parentElement && act.parentElement.querySelector(':scope > .sol'));
  });
  const solLink = s => s.parentElement && s.parentElement.querySelector('.q-act .linkbtn');
  const leerkracht = ()=>/^(leerkracht|beheerder)$/.test(document.body.dataset.rol || '');
  /* vs = volledig scherm voor leerlingen: zelfde venster, zonder stappen */
  function open(card, vs){
    if(B) close();
    const home = {parent:card.parentElement, next:card.nextSibling};
    const ov = el('div','px-board'); ov.setAttribute('role','dialog'); ov.setAttribute('aria-label', vs ? 'Volledig scherm' : 'Bordmodus');
    const bar = el('div','px-bar'), cnt = el('span','px-cnt');
    const prev = el('button','btn ghost','◀ Vorige stap'), next = el('button','btn','Volgende stap ▶'), cls = el('button','btn ghost','✕ Sluiten');
    [prev,next,cls].forEach(b=>b.type='button');
    const none = el('span','px-none','Deze oefening heeft geen uitgeschreven oplossing. Los ze samen op en klik op Controleer.');
    bar.append(cnt, none, prev, next, cls); ov.append(bar, card);
    document.body.append(ov);
    const shown = [];
    function paint(){
      if(vs){ cnt.textContent = 'Volledig scherm'; none.hidden = prev.hidden = next.hidden = true; return; }
      const st = steps(card), n = st.length;
      none.hidden = n>0; prev.hidden = next.hidden = n===0;
      const done = st.filter(e=>shown.includes(e)).length;
      cnt.textContent = n ? `Oplossing: stap ${done} van ${n}` : 'Bordmodus';
      prev.disabled = !shown.some(e=>e.classList.contains('sol'));
      next.disabled = done>=n;
    }
    function step(){
      if(vs) return;
      const st = steps(card).find(e=>!shown.includes(e)); if(!st) return;
      shown.push(st);
      if(st.classList.contains('sol')){ st.hidden = false; st.classList.add('px-shown'); const lb = solLink(st); if(lb){ lb.hidden = false; lb.textContent = 'Verberg oplossing'; } }
      else st.click();
      st.scrollIntoView({block:'center', behavior:'smooth'}); paint();
    }
    function back(){
      if(vs) return;
      for(let i=shown.length-1;i>=0;i--){ const e = shown[i]; if(e.classList.contains('sol')){ shown.splice(i,1); e.hidden = true; e.classList.remove('px-shown'); const lb = solLink(e); if(lb) lb.textContent = 'Toon oplossing'; break; } }
      paint();
    }
    next.addEventListener('click', step); prev.addEventListener('click', back); cls.addEventListener('click', ()=>close());
    const key = e=>{ if(e.key==='Escape'){ close(); return; } if(e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
      if(e.key==='ArrowRight' || e.key==='PageDown'){ e.preventDefault(); step(); } else if(e.key==='ArrowLeft' || e.key==='PageUp'){ e.preventDefault(); back(); } };
    document.addEventListener('keydown', key);
    const mo = new MutationObserver(()=>paint()); mo.observe(card, {childList:true, subtree:true});
    const html = document.documentElement, fs0 = html.style.fontSize; html.style.fontSize = window.innerWidth>900 ? (vs ? '130%' : '150%') : '118%';
    document.body.style.overflow = 'hidden';
    /* volledig scherm: verlaat de leerling het volledig scherm (Esc van de browser), dan sluit ook het venster */
    const fsc = ()=>{ if(vs && !document.fullscreenElement) close(); };
    B = {card, home, ov, key, mo, fs0, shown, fsc};
    try{ if(ov.requestFullscreen && (vs || window.innerWidth>900)) ov.requestFullscreen().then(()=>document.addEventListener('fullscreenchange', fsc)).catch(()=>{}); }catch(e){}
    paint(); cls.focus();
  }
  function close(){
    const b = B; if(!b) return; B = null;
    b.mo.disconnect(); document.removeEventListener('keydown', b.key); document.removeEventListener('fullscreenchange', b.fsc);
    b.shown.forEach(e=>{ if(e.classList.contains('sol') && e.isConnected){ e.hidden = true; e.classList.remove('px-shown'); const lb = solLink(e); if(lb) lb.textContent = 'Toon oplossing'; } });
    try{ if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); }catch(e){}
    document.documentElement.style.fontSize = b.fs0; document.body.style.overflow = '';
    if(b.home.next && b.home.next.parentElement===b.home.parent) b.home.parent.insertBefore(b.card, b.home.next); else b.home.parent.append(b.card);
    b.ov.remove(); b.card.scrollIntoView({block:'start'});
    const bb = b.card.querySelector('.px-vs-btn, .px-bord-btn'); if(bb && bb.offsetParent) bb.focus({preventScroll:true});
  }
  function vsKnop(){
    const vb = el('button','px-vs-btn','⛶ Volledig scherm'); vb.type='button'; vb.title='Toon deze oefening groot, op volledig scherm';
    vb.addEventListener('click', ()=>{ const c = vb.closest('.card'); if(c) open(c, true); });
    return vb;
  }
  function knop(ch){
    if(ch.querySelector('.px-bord-btn')) return;
    const sec = ch.closest('section.group'); if(!sec || /^toets/.test(sec.id)) return;
    const wrap = el('span','px-hbtns'), bb = el('button','px-bord-btn','⛶ Bord'); bb.type='button'; bb.title='Toon deze oefening groot op het bord, met de oplossing stap voor stap';
    const rb = ch.querySelector('.refresh-btn'); wrap.append(bb); if(!leerkracht()) wrap.append(vsKnop()); if(rb) wrap.append(rb); ch.append(wrap);
    bb.addEventListener('click', ()=>open(ch.parentElement));
  }
  /* module met een eigen bordknop: voor leerlingen een knop Volledig scherm er vlak achter */
  function eigenKnop(bb){
    if(leerkracht() || bb.closest('.px-board, .bord') || (bb.nextElementSibling && bb.nextElementSibling.classList.contains('px-vs-btn'))) return;
    bb.after(vsKnop());
  }
  let klaar = false;
  function knoppen(){
    if(klaar) return; klaar = true;
    const app = document.getElementById('app'); if(!app) return;
    const s = document.createElement('style'); s.textContent = css; document.head.append(s);
    const eigen = !!document.querySelector('.px-bord-btn, .bord-btn');   /* de module heeft een eigen bordmodus */
    const alle = eigen ? ()=>app.querySelectorAll('.px-bord-btn, .bord-btn').forEach(eigenKnop)
                       : ()=>app.querySelectorAll('section.group .card > .card-head').forEach(knop);
    alle();
    /* sommige modules bouwen een onderdeel pas als je het opent */
    new MutationObserver(alle).observe(app, {childList:true, subtree:true});
  }
  /* wacht tot de module zelf klaar is (ook haar eigen setTimeout) */
  document.addEventListener('inhoud-geladen', ()=>setTimeout(knoppen, 50));
  if(document.querySelector('#app section.group')) setTimeout(knoppen, 50);
})();
