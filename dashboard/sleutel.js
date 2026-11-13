/* Oplossingssleutel van een module voor leerkrachten: dashboard/sleutel.html?site=<site-id>. Enkel voor leerkrachten en beheerders.
   Een pdf maken: Afdrukken, dan Opslaan als PDF (zoals dashboard/afdruk.html).

   Een module doet mee als haar element in gedeeld/sites.js "sleutel": true heeft en haar inhoud.js de afspraak hieronder volgt:
   staat window.CL_SLEUTEL_VRAAG op true, dan bouwt inhoud.js geen oefeningen (geen DOM, geen localStorage) maar zet het
   window.CL_SLEUTEL = { titel, ondertitel, nota (html), css:[bestanden naast inhoud.js],
     hoofdstukken:[{ id, titel, intro (html), groepen:[{ titel, items:[{ code, bron, labels:[tekst], extra (html),
       opgave (html), fig (html), keuzes:[{ letter, tekst (html), juist }] of null, antwoord (tekst), stappen:[{ nr, naam, html }] }] }] }] }.
   Voorbeeld: 1A/wiskundige-problemen (bron 85_sleutel.js). */
import { klaar } from '../gedeeld/aanmelden.js';
import { SITES } from '../gedeeld/sites.js';
const q = new URLSearchParams(location.search), app = document.getElementById('app'), balk = document.getElementById('balk');
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
document.getElementById('druk').onclick = ()=>print();

const s = await klaar;
const site = SITES.find(x=>x.id === q.get('site') && x.sleutel);
if(s.rol === 'leerling' || s.toeschouwer) app.append(el('p', 'errmsg', 'Deze pagina is enkel voor leerkrachten.'));
else if(!site) app.append(el('p', 'errmsg', 'Voor deze module is er geen oplossingssleutel.'));
else laad().then(teken).catch(e=>{ console.error(e); app.append(el('p', 'errmsg', 'De oplossingssleutel ophalen lukte niet. Vernieuw de pagina.')); });

/* inhoud.js van de module laden in sleutelmodus */
function laad(){
  return new Promise((ok, fout)=>{
    window.CL_SLEUTEL_VRAAG = true;
    const sc = el('script'); sc.src = `../${site.pad}inhoud.js`;
    sc.onload = ()=>window.CL_SLEUTEL ? ok(window.CL_SLEUTEL) : fout(new Error('geen CL_SLEUTEL'));
    sc.onerror = ()=>fout(new Error('inhoud.js niet geladen'));
    document.body.append(sc);
  });
}
function item(it, nr){
  const a = el('article', 'sl-item');
  a.append(el('div', 'sl-item-kop', `<span class="sl-nr">${nr}</span>${(it.labels || []).map(l=>`<span class="sl-label">${esc(l)}</span>`).join('')}<span class="sl-bron">${esc(it.bron || '')}</span><span class="sl-code">${esc(it.code || '')}</span>`));
  const rij = el('div', 'sl-rij'), opg = el('div', 'sl-opg'), opl = el('div', 'sl-opl');
  opg.append(el('div', 'hv-tekst', it.opgave));
  if(it.fig) opg.append(el('div', 'sl-fig', it.fig));
  if(it.keuzes) opg.append(el('ol', 'sl-keuzes', it.keuzes.map(k=>`<li class="${k.juist ? 'juist' : ''}"><b>${esc(k.letter)}</b><span>${k.tekst}</span></li>`).join('')));
  const juist = (it.keuzes || []).find(k=>k.juist);
  opl.append(el('p', 'sl-antw', `<span>Antwoord</span><b>${juist ? `${esc(juist.letter)} · ${juist.tekst}` : esc(it.antwoord)}</b>`));
  if(it.extra) opl.append(el('p', 'sl-extra', it.extra));
  (it.stappen || []).forEach(st=>opl.append(el('div', 'sl-stap', `<span class="sl-stap-nr">${esc(st.nr)}</span><div><b class="sl-stap-naam">${esc(st.naam)}</b><div class="sol-inh">${st.html}</div></div>`)));
  rij.append(opg, opl); a.append(rij);
  return a;
}
function teken(K){
  (K.css || []).forEach(c=>{ const l = el('link'); l.rel = 'stylesheet'; l.href = `../${site.pad}${c}`; document.head.append(l); });
  document.title = `Oplossingssleutel · ${K.titel}`;
  const tel = h=>h.groepen.reduce((n, g)=>n + g.items.length, 0);
  const kop = el('header', 'sl-kop', `<img src="../gedeeld/img/logo.png" alt="Campus Lievegem">
    <div><p class="sl-eyebrow">Oplossingssleutel voor leerkrachten</p><h1>${esc(K.titel)}</h1>
    <p class="sl-onder">${esc(K.ondertitel || site.titel)} · ${K.hoofdstukken.reduce((n, h)=>n + tel(h), 0)} opgaven · afgedrukt op ${new Date().toLocaleDateString('nl-BE', { day:'numeric', month:'long', year:'numeric' })}</p></div>`);
  app.append(kop);
  if(K.nota) app.append(el('div', 'sl-nota', K.nota));
  const inh = el('nav', 'sl-inhoud', '<h2>Inhoud</h2>'), ol = el('ol'); inh.append(ol); inh.setAttribute('aria-label', 'Inhoud'); app.append(inh);
  const kies = document.getElementById('kies');
  K.hoofdstukken.forEach((h, i)=>{
    const sec = el('section', 'sl-hfst'); sec.id = 'h-' + h.id;
    sec.append(el('h2', '', `<span class="num">${i + 1}.</span> ${esc(h.titel)}`));
    if(h.intro) sec.append(el('p', 'sl-intro', h.intro));
    let nr = 0;
    h.groepen.forEach(g=>{
      const gr = el('div', 'sl-groep'); gr.append(el('h3', '', esc(g.titel)));
      g.items.forEach(it=>gr.append(item(it, `${i + 1}.${++nr}`)));
      sec.append(gr);
    });
    app.append(sec);
    const li = el('li', '', `<a href="#h-${esc(h.id)}">${esc(h.titel)}</a><span>${tel(h)} opgaven</span>`); ol.append(li);
    /* kiezen wat er afgedrukt wordt */
    const lab = el('label', 'kies-vak'), vak = el('input'); vak.type = 'checkbox'; vak.checked = true; vak.id = 'kies-' + h.id;
    vak.onchange = ()=>{ sec.hidden = !vak.checked; li.hidden = !vak.checked; };
    lab.append(vak, document.createTextNode(' ' + h.titel)); kies.append(lab);
  });
  balk.hidden = false;
  document.body.dataset.sleutelKlaar = '1';
}
