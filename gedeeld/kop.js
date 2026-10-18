/* Kop, voettekst, zijbalkknoppen en voorlezen: gedeeld door alle pagina's.
   Gebruik in een pagina:
     <body data-site="m1">
     <header class="top"><p class="eyebrow">…</p><h1>Module 1 · <em>kernwoorden</em></h1><p class="tagline">…</p></header>
     <div class="shell"><nav class="side" aria-label="Onderdelen"><ol id="nav"></ol></nav><main id="main">…</main></div>
     <script src="../../gedeeld/kop.js"></script>
     <script src="inhoud.js"></script>
   data-site geeft elke site een eigen geheugen voor de ingeklapte zijbalk. */
(function(){
  const me = document.currentScript;
  const IMG = new URL('img/', me.src).href;
  const STER = 'M12 1.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.8l7.1-.7z';
  const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="w1" d="M15.5 9a4 4 0 0 1 0 6"/><path class="w2" d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
  const site = document.body.dataset.site || 'site';

  /* ---------- kop ---------- */
  const hdr = document.querySelector('header.top');
  if(hdr && !hdr.querySelector('.hdr-in')){
    const txt = hdr.innerHTML;
    hdr.innerHTML =
      `<div class="deco" aria-hidden="true"><svg class="sparkles" viewBox="0 0 70 96">
        <g transform="translate(30 6) scale(.75)"><path class="star" d="${STER}"/></g>
        <g transform="translate(6 38) scale(.55)"><path class="star s2" d="${STER}"/></g>
        <g transform="translate(38 66) scale(.6)"><path class="star s3" d="${STER}"/></g></svg>
        <span class="markwrap"><img class="mark" src="${IMG}beeldmerk.png" alt=""><img class="mstar" src="${IMG}ster.png" alt=""></span></div>
      <div class="hdr-in"><span class="logo-clip"><img class="logo" src="${IMG}logo.png" alt="Campus Lievegem"></span><div class="hdr-txt">${txt}</div></div>`;
  }

  /* ---------- voettekst ---------- */
  if(!document.querySelector('footer.school')){
    const f = el('footer', 'school', `<img class="flogo" src="${IMG}logo.png" alt="Campus Lievegem – Tover met talent">`);
    document.body.append(f);
  }

  /* ---------- zijbalkknoppen en meldingsvak ---------- */
  const nav = document.querySelector('nav.side');
  let tog = null, tts = null;
  if(nav){
    tog = el('button', 'nav-toggle', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9 4.5v15M15.5 9.5L13 12l2.5 2.5"/></svg><span class="t">Verberg de onderdelen</span>');
    tog.type = 'button'; tog.id = 'navToggle'; tog.setAttribute('aria-controls', 'nav'); tog.setAttribute('aria-expanded', 'true');
    tts = el('button', 'tts-btn', SPK + '<span class="t">Voorlezen: uit</span>');
    tts.type = 'button'; tts.id = 'ttsBtn'; tts.setAttribute('aria-pressed', 'false'); tts.title = 'Voorlezen aan of uit';
    nav.prepend(tog, tts);
  } else if(hdr){
    tts = el('button', 'tts-btn tts-top', SPK + '<span class="t">Voorlezen: uit</span>');
    tts.type = 'button'; tts.id = 'ttsBtn'; tts.setAttribute('aria-pressed', 'false');
    const box = el('div', 'tts-bar'); box.append(tts); hdr.after(box);
  }
  const toast = el('div', 'tts-toast', SPK + '<div><b>Voorlezen staat aan.</b> Sleep met je muis over een stuk tekst (op een tablet: selecteer de tekst met je vinger). Dat stuk wordt dan voorgelezen. Klik opnieuw op <b>Voorlezen</b> om het uit te zetten.</div><button type="button">Ok</button>');
  toast.setAttribute('role', 'status'); toast.hidden = true;
  document.body.append(toast);

  /* ---------- zijbalk inklappen (keuze onthouden op dit toestel) ---------- */
  if(tog){
    const KEY = site + '_navCollapsed', t = tog.querySelector('.t');
    const apply = c => { document.body.classList.toggle('nav-collapsed', c); tog.setAttribute('aria-expanded', String(!c));
      const lab = c ? 'Toon de onderdelen' : 'Verberg de onderdelen'; t.textContent = lab; tog.title = lab; tog.setAttribute('aria-label', lab); };
    let c = false; try{ c = localStorage.getItem(KEY) === '1'; }catch(e){}
    apply(c);
    tog.addEventListener('click', ()=>{ c = !c; apply(c); try{ localStorage.setItem(KEY, c ? '1' : '0'); }catch(e){}
      setTimeout(()=>window.dispatchEvent(new Event('resize')), 280); });
    const tips = ()=>document.querySelectorAll('nav.side button .lbl').forEach(l=>{ const bt = l.closest('button'); if(bt && !bt.title) bt.title = l.textContent.trim(); });
    document.addEventListener('DOMContentLoaded', tips); document.addEventListener('inhoud-geladen', tips);
  }

  /* ---------- voorlezen: standaard uit, Nederlandstalige (bij voorkeur mannelijke) stem ---------- */
  (function(){
    const btn = tts, ok = toast.querySelector('button');
    if(!btn) return;
    const synth = window.speechSynthesis;
    if(!synth){ btn.hidden = true; return; }
    let on = false, voice = null, last = '', timer = 0, hideT = 0;
    const MALE = /arnaud|bart|frank|maarten|xander|ruben|daan|willem|hannes|stijn|thomas|male|man\b/i;
    function pickVoice(){
      const vs = synth.getVoices().filter(v=>/^nl/i.test(v.lang));
      const be = vs.filter(v=>/nl[-_]BE/i.test(v.lang));
      voice = be.find(v=>MALE.test(v.name)) || vs.find(v=>MALE.test(v.name)) || be[0] || vs.find(v=>/nl[-_]NL/i.test(v.lang)) || vs[0] || null;
    }
    pickVoice(); if(synth.onvoiceschanged !== undefined) synth.onvoiceschanged = pickVoice;
    function speak(t){
      synth.cancel(); if(!t) return;
      const u = new SpeechSynthesisUtterance(t.replace(/\s+/g,' '));
      if(voice){ u.voice = voice; u.lang = voice.lang; } else { u.lang = 'nl-BE'; }
      u.rate = .95; u.pitch = 1; synth.speak(u);
    }
    function showToast(){ toast.hidden = false; clearTimeout(hideT); hideT = setTimeout(()=>{ toast.hidden = true; }, 12000); }
    function set(v){
      on = v; btn.setAttribute('aria-pressed', String(on)); btn.querySelector('.t').textContent = 'Voorlezen: ' + (on ? 'aan' : 'uit');
      if(on){ showToast(); } else { synth.cancel(); toast.hidden = true; last = ''; }
    }
    btn.addEventListener('click', ()=>set(!on));
    ok.addEventListener('click', ()=>{ toast.hidden = true; });
    function check(){ clearTimeout(timer); timer = setTimeout(()=>{ if(!on) return; const t = String(window.getSelection ? window.getSelection() : '').trim(); if(t.length > 1 && t !== last){ last = t; speak(t); } }, 250); }
    document.addEventListener('mouseup', check); document.addEventListener('touchend', check); document.addEventListener('keyup', e=>{ if(e.shiftKey) check(); });
    document.addEventListener('selectionchange', ()=>{ if(on && !String(window.getSelection()).trim()) last = ''; });
    document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && on) synth.cancel(); });
    set(false);
  })();
})();
