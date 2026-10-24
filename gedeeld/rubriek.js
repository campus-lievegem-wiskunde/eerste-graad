/* Rubriekpagina voor toetsen, huistaken en rekenvaardigheden: één tegel per opdracht uit gedeeld/opdrachten.js.
   De pagina zet op <body>: data-jaar="1A" data-rubriek="toetsen". Laden vóór aanmelden.js, zodat die de tegels kan filteren. */
import { OPDRACHTEN, soortVan } from './opdrachten.js';
const B = document.body, box = document.querySelector('.tegels');
const IC = { toets:'<path d="M9 4h6v3H9z"/><path d="M15 5h3v16H6V5h3"/><path d="m9 13 2 2 4-4"/>', taak:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>' };
const lijst = OPDRACHTEN.filter(o=>o.jaar === B.dataset.jaar && o.rubriek === B.dataset.rubriek);
lijst.forEach(o=>{
  const a = document.createElement('a'); a.className = 'tegel'; a.dataset.opdr = o.id; a.href = new URL('../../' + o.pad, import.meta.url).href;
  a.innerHTML = `<span class="t-ic"><svg viewBox="0 0 24 24">${IC[soortVan(o)]}</svg></span><span><b></b><span class="sub"></span></span><span class="pijl">→</span>`;
  a.querySelector('b').textContent = o.titel; a.querySelector('.sub').textContent = o.sub || (soortVan(o) === 'toets' ? 'Toets' : 'Taak: opnieuw maken mag, je laatste poging telt');
  box.append(a);
});
if(!lijst.length){ const p = document.createElement('p'); p.className = 'leeg'; p.textContent = 'Hier staat nog niets.'; box.append(p); }
