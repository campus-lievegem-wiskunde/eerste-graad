/* Afdrukpagina: ?opdr=<id>&groep=<groep>[&ll=<e-mail>] = de ingevulde toets per leerling, met hoofding, punten en verbetering;
   ?opdr=<id>&soort=blanco = de lege toets op papier; ?opdr=<id>&soort=sleutel = de verbetersleutel. Enkel voor leerkrachten.
   Een pdf maken: Afdrukken, dan Opslaan als PDF. */
import { klaar, db, F } from '../gedeeld/aanmelden.js';
import { OPDRACHTEN, bereken, opdrZichtbaar, opSchaal, uitDb } from '../gedeeld/opdrachten.js';
import { tekenOpgave, laadOpgave, maxPunten } from '../gedeeld/opgave-weergave.js';
const q = new URLSearchParams(location.search), app = document.getElementById('app');
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const komma = x => String(x).replace('.', ',');
document.getElementById('druk').onclick = ()=>print();

const s = await klaar;
const o = OPDRACHTEN.find(x=>x.id === q.get('opdr')), soort = q.get('soort') || 'ingevuld';
if(s.rol === 'leerling' || !opdrZichtbaar(s.rol, s.toeschouwer)) app.append(el('p', 'errmsg', 'Deze pagina is (nog) niet beschikbaar.'));
else if(!o) app.append(el('p', 'errmsg', 'Onbekende toets of taak.'));
else bouw().catch(e=>{ console.error(e); app.append(el('p', 'errmsg', 'Ophalen lukte niet.')); });

function hoofding({ naam = '', klas = '', datum = '', lk = '', res = '', max, op = '' }){
  return el('table', 'hoofding', `<tr><td class="hf-school" rowspan="1"><img src="../gedeeld/img/logo.png" alt="Campus Lievegem"><b>Middenschool SV</b>Lt. Dobbelaerestraat 16 - 9930 LIEVEGEM</td>
    <td><div class="hf-veld"><span>Naam: <b>${esc(naam)}</b></span></div><div class="hf-veld"><span>Klas: <b>${esc(klas)}</b></span><span>Nr. ……</span></div>
    <div class="hf-veld"><span>${esc(o.rubriek === 'toetsen' ? 'Toets' : 'Taak')}: ${esc(o.kort || '')}</span><span>Datum: ${esc(datum)}</span></div></td></tr>
    <tr><td>Vak: <b>Wiskunde</b><br>Vakleerkracht: ${esc(lk)}</td><td>Resultaat:<div class="hf-res"><b>${esc(res)}</b> / ${komma(max)}${o.op ? `<span class="hf-op"> · <b>${esc(op)}</b> / ${o.op}</span>` : ''}</div></td></tr>
    <tr><td colspan="2" class="hf-titel">${esc(o.titel)}</td></tr>`);
}
async function bouw(){
  const opg = await laadOpgave(new URL(`../${o.pad}opgave.js`, location.href).href), max = maxPunten(opg);
  let sleutel = null; try{ const k = await F.getDoc(F.doc(db, 'sleutels', o.id)); sleutel = k.exists() ? uitDb(k.data()) : null; }catch(e){}
  document.title = `${o.titel} · afdrukken`;
  if(soort === 'blanco' || soort === 'sleutel'){
    if(soort === 'sleutel' && !sleutel){ app.append(el('p', 'errmsg', 'De verbetersleutel staat nog niet klaar: typ eerst de sleutelcode bij Resultaten in het dashboard.')); return; }
    const b = el('section', 'blad'); b.append(hoofding({ res:soort === 'sleutel' ? 'SLEUTEL' : '', max }), tekenOpgave(opg, { modus:soort, sleutel })); app.append(b); return;
  }
  const gs = await F.getDoc(F.doc(db, 'groepen', q.get('groep'))); if(!gs.exists()){ app.append(el('p', 'errmsg', 'Deze groep bestaat niet.')); return; }
  const g = gs.data();
  const [inz, res, lln, lks] = await Promise.all(['inzendingen', 'resultaten'].map(c=>F.getDocs(F.query(F.collection(db, c), F.where('opdr', '==', o.id))).then(x=>new Map(x.docs.map(d=>[d.data().email, d.data()]))))
    .concat([F.getDocs(F.collection(db, 'leerlingen')).then(x=>new Map(x.docs.map(d=>[d.id, d.data()]))).catch(()=>new Map()),
      F.getDocs(F.collection(db, 'leerkrachten')).then(x=>new Map(x.docs.map(d=>[d.id, d.data()]))).catch(()=>new Map())]));
  const lk = (g.leerkrachten || []).map(e=>(lks.get(e) || {}).naam || e).join(', ');
  const naam = e => { const l = lln.get(e); return l ? `${l.familienaam} ${l.voornaam}` : e; };
  const wie = (q.get('ll') ? [q.get('ll')] : g.leerlingen || []).filter(e=>inz.has(e)).sort((a, b)=>naam(a).localeCompare(naam(b), 'nl'));
  if(!wie.length){ app.append(el('p', 'mini', 'Er zijn nog geen antwoorden om af te drukken.')); return; }
  app.append(el('p', 'mini balk-info', `${wie.length} leerling(en) · ${esc(g.naam)}${sleutel ? '' : ' · zonder verbetersleutel: enkel de antwoorden en de punten die je met de hand gaf'}`));
  wie.forEach(e=>{
    const d = inz.get(e), b = bereken(opg, d.antw, sleutel, res.get(e)), l = lln.get(e) || {};
    const blad = el('section', 'blad');
    blad.append(hoofding({ naam:naam(e), klas:l.klas || '', datum:d.ingediend ? new Date(d.ingediend).toLocaleDateString('nl-BE') : '', lk, res:b.volledig ? komma(b.totaal) : `${komma(b.totaal)} (onvolledig)`, max:b.max, op:komma(opSchaal(o, b.totaal, b.max)) }),
      tekenOpgave(opg, { modus:'lezen', antw:d.antw || {}, volgorde:d.volgorde, verbetering:b.per }));
    app.append(blad);
  });
}
