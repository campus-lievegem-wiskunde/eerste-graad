/* Dashboard, tabblad Rekenvaardigheden (opdrTabNaam; per groep): openzetten met datum en uur, instellingen per toets of taak,
   eigen opening per leerling, resultaten verbeteren, vrijgeven, afdrukken en punten kopiëren.
   Instellingen: groepen/{groep}.opdr.{id} (zie gedeeld/opdrachten.js). Antwoorden: inzendingen/{id}__{e-mail}.
   Punten: resultaten/{id}__{e-mail}. Verbetersleutel: sleutels/{id} (enkel leerkrachten lezen hem).
   Classroom (classroom.js, lijn classroomBalk in dashboard.js): groepen/{groep}.classroom = gekoppelde klas, groepen/{groep}.cr.{id} = opdracht in Classroom. */
import { db, F } from '../gedeeld/aanmelden.js';
import { SITES } from '../gedeeld/sites.js';
import { OPDRACHTEN, RUBRIEKEN_OPDR, RUBRIEKEN_ACTIEF, opdrTabNaam, ZIET, instelling, staat, soortVan, docId, bereken, alleVragen, telt, opSchaal, ontsleutel, naarDb, uitDb } from '../gedeeld/opdrachten.js';
import { tekenOpgave, laadOpgave } from '../gedeeld/opgave-weergave.js';
import * as CR from './classroom.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const knop = (txt, cls = 'btn ghost klein') => { const b = el('button', cls, txt); b.type = 'button'; return b; };
const tijd = ms => ms ? new Date(ms).toLocaleString('nl-BE', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '';
/* ms ↔ waarde van <input type="datetime-local"> (lokale tijd) */
const naarVeld = ms => { if(!ms) return ''; const d = new Date(ms), z = n=>String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; };
const uitVeld = v => v ? new Date(v).getTime() : null;
const komma = x => String(x).replace('.', ',');
const opgUrl = o => new URL(`../${o.pad}opgave.js`, location.href).href;
const STAAT = { dicht:'dicht', gepland:'gepland', open:'open', gesloten:'gesloten' };
function staatTekst(cfg){
  const s = staat(cfg, null);
  return s === 'dicht' ? 'nog niet geopend' : s === 'gepland' ? `opent ${tijd(cfg.van)}` : s === 'open' ? (cfg.tot ? `open tot ${tijd(cfg.tot)}` : 'open') : `gesloten sinds ${tijd(cfg.tot)}`;
}

let H = null; /* hulp uit dashboard.js: ST, render, naamVan, laadLeerlingen, jaarcode */
export function paneOpdrachten(pane, g, hulp){
  H = hulp;
  const lijst = OPDRACHTEN.filter(o=>o.jaar === H.jaarcode(g) && RUBRIEKEN_ACTIEF.includes(o.rubriek)), een = RUBRIEKEN_ACTIEF.length === 1;
  if(H.ST.opdrRes && lijst.includes(H.ST.opdrRes)) return resultaten(pane, g, H.ST.opdrRes);
  const card = el('div', 'dash-card', `<h3>${esc(opdrTabNaam())} voor ${esc(g.naam)}</h3><p class="mini">Een ${een ? 'taak' : 'toets of taak'} die je nog niet opende, zien de leerlingen niet. Kies wanneer ze opent en sluit, of gebruik <b>Nu openen</b> en <b>Nu sluiten</b> tijdens de les. Wijzigingen worden meteen bewaard. Standaard zien de leerlingen hun resultaat niet: dat kies je per ${een ? 'taak' : 'toets'} bij Instellingen, en je geeft het vrij bij Resultaten.</p>`);
  if(!lijst.length){ card.append(el('p', 'mini', `Er zijn nog geen ${een ? esc(opdrTabNaam().toLowerCase()) : 'toetsen of taken'} voor ${esc(H.jaarcode(g))}. Zodra er een klaarstaat, verschijnt ze hier.`)); pane.append(card); return; }
  if(een) lijst.forEach(o=>card.append(blok(g, o)));
  else RUBRIEKEN_OPDR.filter(([rid])=>RUBRIEKEN_ACTIEF.includes(rid)).forEach(([rid, rnaam])=>{
    const os = lijst.filter(o=>o.rubriek === rid); if(!os.length) return;
    const d = el('details', 'rub-blok'); d.open = true; d.append(el('summary', '', `<b>${esc(rnaam)}</b> <span class="mini rub-tel">${os.length}</span>`));
    os.forEach(o=>d.append(blok(g, o))); card.append(d);
  });
  pane.append(card);
  crAlleOpdrachten(g, lijst);
}

/* ---------- één toets of taak: openen, sluiten, instellingen ---------- */
function blok(g, o){
  const b = el('div', 'site-blok opdr-blok');
  let cfg = instelling(g, o);
  const kop = el('div', 'site-kop');
  const naam = el('b', '', esc(o.titel)), st = el('span', 'mini opdr-staat'), msg = el('span', 'mini');
  const open = knop('Nu openen'), sluit = knop('Nu sluiten'), res = knop('Resultaten', 'btn klein'), inst = knop('Instellingen ▸');
  const bekijk = el('a', 'btn ghost klein bekijk', 'Bekijk'); bekijk.href = `../${o.pad}`; bekijk.target = '_blank'; bekijk.rel = 'noopener';
  kop.append(naam, st, open, sluit, res, inst, bekijk, msg); b.append(kop);
  const paneel = el('div', 'opdr-inst'); paneel.hidden = true; b.append(paneel);
  const toon = ()=>{ const s = staat(cfg, null); st.textContent = ' · ' + staatTekst(cfg); st.dataset.staat = s; open.hidden = s === 'open'; sluit.hidden = s !== 'open'; };
  async function bewaar(nieuw){
    msg.className = 'mini'; msg.textContent = ' bewaren…';
    try{ await F.updateDoc(F.doc(db, 'groepen', g.id), { [`opdr.${o.id}`]: nieuw }); g.opdr = g.opdr || {}; g.opdr[o.id] = nieuw; cfg = instelling(g, o); msg.className = 'okmsg'; msg.textContent = ' bewaard'; toon(); vul();
      if(g.classroom && cfg.van) crDoe(`${g.id}|${o.id}`, o.titel, ()=>crOpdracht(g, o)); }
    catch(e){ console.error(e); msg.className = 'errmsg'; msg.textContent = ' bewaren lukte niet'; }
  }
  open.onclick = ()=>{ const nu = Date.now(); bewaar(Object.assign({}, cfg, { van:nu, tot:cfg.tot && cfg.tot > nu ? cfg.tot : null })); };
  sluit.onclick = ()=>{ if(confirm(`${o.titel} nu sluiten voor ${g.naam}? Leerlingen met een eigen opening behouden die.`)) bewaar(Object.assign({}, cfg, { tot:Date.now() })); };
  res.onclick = ()=>{ H.ST.opdrRes = o; H.render(); };
  inst.onclick = ()=>{ paneel.hidden = !paneel.hidden; inst.textContent = paneel.hidden ? 'Instellingen ▸' : 'Instellingen ▾'; };
  function vul(){
    paneel.innerHTML = '';
    const r1 = el('div', 'rij', `<label>Opent op <input type="datetime-local" class="v-van" value="${naarVeld(cfg.van)}"></label><label>Sluit op <input type="datetime-local" class="v-tot" value="${naarVeld(cfg.tot)}"></label>`);
    const p = el('div', 'rij', `<label>Pogingen <select class="v-pog"><option value="1"${cfg.pogingen === 1 ? ' selected' : ''}>Eén poging</option><option value="0"${cfg.pogingen !== 1 ? ' selected' : ''}>Opnieuw mag, de laatste poging telt</option></select></label>`);
    const v = el('label', 'rt-keuze', `<input type="checkbox" class="v-volg"${cfg.volgorde ? ' checked' : ''}> Vragen in een andere volgorde per leerling <span class="mini">(binnen elk deel)</span>`);
    const z = el('div', 'rij', `<label>Na het vrijgeven ziet de leerling <select class="v-ziet">${Object.entries(ZIET).map(([k, t])=>`<option value="${k}"${cfg.ziet === k ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`);
    const mods = SITES.filter(s=>s.jaar === o.jaar);
    const dicht = el('div', 'opdr-dicht', `<p class="mini"><b>Modules dicht zolang deze ${soortVan(o) === 'toets' ? 'toets' : 'taak'} openstaat</b> (voor deze groep)</p>`);
    const dl = el('div', 'onderdelen'); dl.style.marginLeft = '0';
    mods.forEach(s=>dl.append(el('label', '', `<input type="checkbox" value="${esc(s.id)}"${(cfg.dicht || []).includes(s.id) ? ' checked' : ''}> ${esc(s.titel)}`)));
    dicht.append(dl);
    paneel.append(r1, p, v, z, dicht, extraBlok());
    const lees = ()=>Object.assign({}, cfg, { van:uitVeld(paneel.querySelector('.v-van').value), tot:uitVeld(paneel.querySelector('.v-tot').value),
      pogingen:+paneel.querySelector('.v-pog').value, volgorde:paneel.querySelector('.v-volg').checked, ziet:paneel.querySelector('.v-ziet').value,
      dicht:[...dl.querySelectorAll('input:checked')].map(i=>i.value) });
    [...paneel.querySelectorAll('.v-van, .v-tot, .v-pog, .v-volg, .v-ziet'), ...dl.querySelectorAll('input')].forEach(i=>i.onchange = ()=>{
      const n = lees(); if(n.van && n.tot && n.tot <= n.van){ msg.className = 'errmsg'; msg.textContent = ' het sluitmoment ligt vóór het openingsmoment'; return; } bewaar(n); });
  }
  /* eigen opening per leerling (inhaaltoets, verlengde tijd) */
  function extraBlok(){
    const x = el('div', 'opdr-extra', '<p class="mini"><b>Eigen opening voor een leerling</b> (inhalen of meer tijd): gaat voor op de opening van de groep.</p>');
    const ex = cfg.extra || {};
    Object.entries(ex).forEach(([e, w])=>{
      const r = el('div', 'rij', `<span>${esc(H.naamVan(e))}: ${tijd(w.van) || '?'} tot ${w.tot ? tijd(w.tot) : 'niet gesloten'} <span class="mini">(${staat(w, null)})</span></span>`);
      const weg = knop('×', 'btn gevaar klein'); weg.title = 'Eigen opening verwijderen';
      weg.onclick = ()=>{ const n = Object.assign({}, ex); delete n[e]; bewaar(Object.assign({}, cfg, { extra:n })); };
      r.append(weg); x.append(r);
    });
    const r = el('div', 'rij');
    const sel = el('select', '', '<option value="">leerling…</option>' + [...g.leerlingen].sort((a, b)=>H.naamVan(a).localeCompare(H.naamVan(b), 'nl')).map(e=>`<option value="${esc(e)}">${esc(H.naamVan(e))}</option>`).join(''));
    const van = el('input'); van.type = 'datetime-local'; van.value = naarVeld(Date.now()); const tot = el('input'); tot.type = 'datetime-local';
    const ok = knop('Toevoegen');
    ok.onclick = ()=>{ if(!sel.value || !van.value) return; const w = { van:uitVeld(van.value), tot:uitVeld(tot.value) };
      if(w.tot && w.tot <= w.van){ alert('Het sluitmoment ligt vóór het openingsmoment.'); return; }
      bewaar(Object.assign({}, cfg, { extra:Object.assign({}, ex, { [sel.value]:w }) })); };
    r.append(sel, el('span', 'mini', 'van'), van, el('span', 'mini', 'tot'), tot, ok); x.append(r);
    return x;
  }
  toon(); vul();
  return b;
}

/* ---------- resultaten ---------- */
async function haal(col, o){ return (await F.getDocs(F.query(F.collection(db, col), F.where('opdr', '==', o.id)))).docs.map(d=>d.data()); }
async function resultaten(pane, g, o){
  const terug = knop('← Terug naar de lijst'); terug.onclick = ()=>{ H.ST.opdrRes = null; H.render(); };
  const cfg = instelling(g, o);
  const card = el('div', 'dash-card', `<h3>${esc(o.titel)} · ${esc(g.naam)}</h3><p class="mini">${staatTekst(cfg)} · na het vrijgeven ziet de leerling: ${esc(ZIET[cfg.ziet] || cfg.ziet)}</p>`);
  pane.append(el('div', 'rij'), card); pane.firstChild.append(terug);
  const wacht = el('p', 'mini', 'Antwoorden ophalen…'); card.append(wacht);
  let opg, sleutel = null, inz, res;
  try{
    if(!H.ST.leerlingen) await H.laadLeerlingen().catch(()=>{});
    [opg, inz, res] = await Promise.all([laadOpgave(opgUrl(o)), haal('inzendingen', o), haal('resultaten', o)]);
    const k = await F.getDoc(F.doc(db, 'sleutels', o.id)); sleutel = k.exists() ? uitDb(k.data()) : null;
  }catch(e){ console.error(e); wacht.className = 'errmsg'; wacht.textContent = 'Ophalen lukte niet.'; return; }
  wacht.remove();
  if(!sleutel) card.append(sleutelVak(o, ()=>H.render()));

  const I = new Map(inz.map(d=>[d.email, d])), R = new Map(res.map(d=>[d.email, d]));
  const lln = [...g.leerlingen].sort((a, b)=>H.naamVan(a).localeCompare(H.naamVan(b), 'nl'));
  const vragen = alleVragen(opg).filter(telt), gewijzigd = new Set();
  const rec = e => { if(!R.has(e)) R.set(e, { opdr:o.id, email:e, groep:g.id, punten:{}, hand:[], vrij:false }); return R.get(e); };
  const ber = e => bereken(opg, (I.get(e) || {}).antw, sleutel, R.get(e));
  const vrij = lln.some(e=>R.get(e) && R.get(e).vrij);

  /* knoppen */
  const r = el('div', 'rij');
  const bew = knop('Punten bewaren', 'btn klein'), vg = knop(vrij ? 'Vrijgave intrekken' : 'Resultaten vrijgeven', 'btn ghost klein');
  const pdf = el('a', 'btn ghost klein', 'Pdf van de groep'); pdf.href = `afdruk.html?opdr=${encodeURIComponent(o.id)}&groep=${encodeURIComponent(g.id)}`; pdf.target = '_blank';
  const blanco = el('a', 'btn ghost klein', 'Blanco afdrukken'); blanco.href = `afdruk.html?opdr=${encodeURIComponent(o.id)}&soort=blanco`; blanco.target = '_blank';
  const slk = el('a', 'btn ghost klein', 'Verbetersleutel afdrukken'); slk.href = `afdruk.html?opdr=${encodeURIComponent(o.id)}&soort=sleutel`; slk.target = '_blank'; slk.hidden = !sleutel;
  const kopie = knop('Kopieer de punten');
  const m = el('span', 'mini');
  if(cfg.ziet === 'niets'){ vg.disabled = !vrij; vg.title = 'Kies eerst bij Instellingen wat de leerling ziet.'; }
  r.append(bew, vg, pdf, blanco, slk, kopie, m); card.append(r);
  card.append(el('p', 'mini', g.classroom ? 'Punten naar Classroom gaan vanzelf: als conceptpunt zodra een ingediende opdracht volledig verbeterd is, definitief en teruggegeven als je de resultaten vrijgeeft.'
    : 'Koppel deze groep bovenaan aan een Classroom-klas, dan gaan de punten vanzelf naar Classroom. Of plak ze met <b>Kopieer de punten</b> in een rekenblad.'));

  /* tabel leerlingen × vragen */
  const wrap = el('div', 'tbl-wrap'); const t = el('table', 'dt opdr-tabel'); wrap.append(t); card.append(wrap);
  const legende = el('p', 'mini', 'De kolommen volgen de volgorde van de opgave (wijs een kolom aan voor de vraag); bij een andere volgorde per leerling toont het detail de vragen zoals die leerling ze zag. Klik op een naam om de antwoorden te zien en punten aan te passen. <b>?</b> = nog te verbeteren (open vraag of geen sleutel). Een aangepaste score is onderstreept.'); card.append(legende);
  const detailVak = el('div'); pane.append(detailVak);
  function statusVan(e){
    const d = I.get(e); if(!d) return '<span class="mini">niet begonnen</span>';
    const w = (cfg.extra && cfg.extra[e]) || cfg, laat = d.ingediend && w.tot && d.ingediend > w.tot;
    return d.ingediend ? `ingediend ${tijd(d.ingediend)}${laat ? ' <b class="errmsg">te laat</b>' : ''}${d.poging > 1 ? ` · poging ${d.poging}` : ''}` : '<span class="mini">bezig, niet ingediend</span>';
  }
  function tabel(){
    t.innerHTML = `<thead><tr><th>Leerling</th><th>Status</th>${vragen.map((q, i)=>`<th class="c" title="${esc(q.vraag.replace(/<[^>]+>/g, ' ').trim())}">${q.nr || i + 1}<small class="mini"> /${komma(q.punten || 1)}</small></th>`).join('')}<th class="c">Totaal</th>${o.op ? `<th class="c">Op ${o.op}</th>` : ''}</tr></thead>`;
    const tb = el('tbody');
    lln.forEach(e=>{
      const tr = el('tr'); const nb = el('button', 'naam-btn', esc(H.naamVan(e))); nb.type = 'button'; nb.onclick = ()=>detail(e);
      const td0 = el('td'); td0.append(nb); tr.append(td0, el('td', '', statusVan(e)));
      const b = I.get(e) ? ber(e) : null, hand = new Set((R.get(e) || {}).hand || []);
      vragen.forEach(q=>{ const v = b && b.per[q.id], p = v && v.p, mx = q.punten || 1;
        const td = el('td', 'sc ' + (!b ? 's0' : p == null ? 's2' : p >= mx ? 's4' : p > 0 ? 's3' : 's1') + (hand.has(q.id) ? ' hand' : ''), !b ? '·' : p == null ? '?' : komma(p));
        if(v && v.codes && v.codes.length) td.title = v.codes.map(c=>((opg.codes || {})[c] || {}).label || c).join(' · ');
        tr.append(td); });
      tr.append(el('td', 'c', b ? `<b>${komma(b.totaal)}</b>/${komma(b.max)}${b.volledig ? '' : ' ?'}` : '–'));
      if(o.op) tr.append(el('td', 'c', b ? `<b>${komma(opSchaal(o, b.totaal, b.max))}</b>/${o.op}` : '–'));
      tb.append(tr);
    });
    t.append(tb);
    m.className = 'mini'; m.textContent = gewijzigd.size ? ` ${gewijzigd.size} leerling(en) met niet-bewaarde punten` : '';
    if(opg.codes) fouten();
  }
  /* interactieve opdracht: hoe vaak elke foutcode voorkomt in de groep (wijs een code aan voor de uitleg) */
  const foutVak = el('div', 'opdr-fouten'); if(opg.codes) card.append(foutVak);
  function fouten(){
    const tel = {}, wie = {};
    lln.filter(e=>I.has(e)).forEach(e=>Object.values(ber(e).per).forEach(v=>(v.codes || []).forEach(c=>{ tel[c] = (tel[c] || 0) + 1; (wie[c] = wie[c] || new Set()).add(e); })));
    const rij = Object.entries(tel).sort((a, b)=>b[1] - a[1]);
    foutVak.innerHTML = `<h4>Typische fouten in deze groep</h4>` + (rij.length ? `<table class="dt"><thead><tr><th>Fout</th><th class="c">Keer</th><th class="c">Leerlingen</th></tr></thead><tbody>${rij.map(([c, n])=>{ const d = opg.codes[c] || {};
      return `<tr><td title="${esc(d.uitleg || '')}">${esc(d.label || c)}${d.uitleg ? `<br><span class="mini">${esc(d.uitleg)}</span>` : ''}</td><td class="c">${n}</td><td class="c">${wie[c].size}</td></tr>`; }).join('')}</tbody></table>` : '<p class="mini">Nog geen foutcodes (of nog geen verbetersleutel).</p>');
  }
  function detail(e){
    detailVak.innerHTML = '';
    const d = I.get(e); const k = el('div', 'dash-card detail');
    k.append(el('h3', '', `${esc(H.naamVan(e))} · ${esc(o.kort || o.titel)}`), el('p', 'mini', statusVan(e)));
    const nav = el('div', 'rij'); const i = lln.indexOf(e);
    const vor = knop('← Vorige leerling'), vol = knop('Volgende leerling →'), sl = knop('Sluiten');
    vor.disabled = i <= 0; vol.disabled = i >= lln.length - 1; vor.onclick = ()=>detail(lln[i - 1]); vol.onclick = ()=>detail(lln[i + 1]); sl.onclick = ()=>{ detailVak.innerHTML = ''; };
    nav.append(vor, vol, sl);
    if(d && d.slot){ const her = knop('Heropenen (de leerling mag verder werken)'); her.onclick = async ()=>{ if(!confirm('De leerling mag zijn antwoorden opnieuw wijzigen en indienen. Doorgaan?')) return;
      await F.updateDoc(F.doc(db, 'inzendingen', docId(o, e)), { slot:false, ingediend:null }); d.slot = false; d.ingediend = null; tabel(); detail(e); }; nav.append(her); }
    if(d){ const weg = knop('Poging wissen', 'btn gevaar klein'); weg.onclick = async ()=>{ if(!confirm(`Alle antwoorden en punten van ${H.naamVan(e)} voor deze opdracht wissen? De leerling begint dan opnieuw. Dit kan je niet ongedaan maken.`)) return;
      await F.deleteDoc(F.doc(db, 'inzendingen', docId(o, e))); await F.deleteDoc(F.doc(db, 'resultaten', docId(o, e))).catch(()=>{}); I.delete(e); R.delete(e); gewijzigd.delete(e); tabel(); detailVak.innerHTML = ''; }; nav.append(weg); }
    k.append(nav);
    if(!d){ k.append(el('p', '', 'Deze leerling begon nog niet.')); detailVak.append(k); k.scrollIntoView({ behavior:'smooth', block:'start' }); return; }
    const b = ber(e);
    const view = tekenOpgave(opg, { modus:'lezen', antw:d.antw || {}, volgorde:d.volgorde, verbetering:b.per });
    view.querySelectorAll('.ov').forEach(div=>{
      const q = vragen.find(x=>x.id === div.dataset.id), v = q && b.per[q.id]; if(!v) return;
      const rr = el('div', 'rij ov-punten', `<label>Punten <input type="number" min="0" max="${v.max}" step="${opg.verbeter ? 0.25 : 0.5}" value="${v.p == null ? '' : v.p}"> / ${komma(v.max)}</label>`);
      const inp = rr.querySelector('input');
      inp.onchange = ()=>{ const x = rec(e); const w = inp.value === '' ? null : Math.max(0, Math.min(v.max, +inp.value));
        x.punten = Object.assign({}, x.punten, { [q.id]:w }); x.hand = [...new Set([...(x.hand || []), q.id])];
        if(w == null){ delete x.punten[q.id]; x.hand = x.hand.filter(h=>h !== q.id); }
        gewijzigd.add(e); tabel(); };
      div.append(rr);
    });
    k.append(view); detailVak.append(k); k.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  /* bewaren: voor elke leerling met antwoorden het resultaat; verbetering enkel als de leerling die mag zien */
  async function bewaarAlles(vrijNu){
    bew.disabled = vg.disabled = true; m.className = 'mini'; m.textContent = ' bewaren…';
    try{
      const batch = F.writeBatch(db); let n = 0;
      lln.filter(e=>I.has(e)).forEach(e=>{
        const x = rec(e), b = ber(e);
        const doc = { opdr:o.id, email:e, groep:g.id, punten:Object.fromEntries(Object.entries(b.per).map(([id, v])=>[id, v.p])), hand:x.hand || [],
          totaal:b.totaal, max:b.max, volledig:b.volledig, ...(o.op ? { op:o.op, opPunten:opSchaal(o, b.totaal, b.max) } : {}), vrij:vrijNu, ziet:cfg.ziet, bijgewerkt:Date.now(), door:H.ST.me,
          verbetering:vrijNu && cfg.ziet === 'verbetering' ? b.per : null };
        batch.set(F.doc(db, 'resultaten', docId(o, e)), doc); R.set(e, doc); n++;
      });
      await batch.commit(); gewijzigd.clear(); tabel(); naarClassroom();
      m.className = 'okmsg'; m.textContent = ` ${n} resultaten bewaard${vrijNu ? ' en vrijgegeven' : ''}`;
      vg.textContent = vrijNu ? 'Vrijgave intrekken' : 'Resultaten vrijgeven'; return true;
    }catch(e){ console.error(e); m.className = 'errmsg'; m.textContent = ' bewaren lukte niet'; return false; }
    finally{ bew.disabled = false; vg.disabled = cfg.ziet === 'niets' && !lln.some(e=>R.get(e) && R.get(e).vrij); }
  }
  bew.onclick = ()=>bewaarAlles(lln.some(e=>R.get(e) && R.get(e).vrij));
  vg.onclick = ()=>{
    const nu = lln.some(e=>R.get(e) && R.get(e).vrij);
    if(!nu){ const onaf = lln.filter(e=>I.has(e) && !ber(e).volledig).length;
      if(!confirm(`${onaf ? `Bij ${onaf} leerling(en) zijn nog niet alle vragen verbeterd. ` : ''}De leerlingen zien nu: ${ZIET[cfg.ziet].toLowerCase()}. Vrijgeven?`)) return; }
    bewaarAlles(!nu);
  };
  kopie.onclick = async ()=>{
    const rij = e=>{ const l = (H.ST.leerlingen && H.ST.leerlingen.get(e)) || {}; const b = I.has(e) ? ber(e) : null; return [l.familienaam || e, l.voornaam || '', l.klas || '', b ? komma(b.totaal) : '', b ? komma(b.max) : '', ...(o.op ? [b ? komma(opSchaal(o, b.totaal, b.max)) : ''] : [])].join('\t'); };
    const txt = ['Familienaam\tVoornaam\tKlas\tPunten\tMax' + (o.op ? `\tOp ${o.op}` : ''), ...lln.map(rij)].join('\n');
    try{ await navigator.clipboard.writeText(txt); m.className = 'okmsg'; m.textContent = ' gekopieerd: plak in een rekenblad'; }
    catch(e){ const ta = el('textarea'); ta.value = txt; ta.rows = 6; ta.style.width = '100%'; card.append(ta); ta.select(); }
  };
  addEventListener('beforeunload', ev=>{ if(gewijzigd.size){ ev.preventDefault(); ev.returnValue = ''; } });
  /* punten naar Classroom: enkel ingediende en volledig verbeterde opdrachten, niet-bewaarde wijzigingen wachten op Punten bewaren */
  function naarClassroom(){
    if(!g.classroom || !sleutel) return;
    crDoe(`${g.id}|${o.id}|punten`, `punten van ${o.kort || o.titel}`, async ()=>{
      let cr = (g.cr || {})[o.id];
      if(!cr || cr.course !== g.classroom.id){ await crOpdracht(g, o); cr = (g.cr || {})[o.id]; }
      if(!cr) return 'Open eerst de opdracht voor deze groep, dan komt ze in Classroom.';
      const klaar = lln.filter(e=>I.get(e) && I.get(e).ingediend && !gewijzigd.has(e)), lijst = [];
      klaar.forEach(e=>{ const b = ber(e); if(b.volledig) lijst.push({ email:e, p:o.op ? opSchaal(o, b.totaal, b.max) : b.totaal, def:!!(R.get(e) && R.get(e).vrij) }); });
      const u = await CR.zetPunten({ course:cr.course, cw:cr.cw, lijst, groep:lln });
      const delen = [];
      if(u.concept) delen.push(`${u.concept} conceptpunt${u.concept > 1 ? 'en' : ''} gezet`);
      if(u.def) delen.push(`${u.def} definitief`);
      if(u.terug) delen.push(`${u.terug} teruggegeven`);
      let t = !lijst.length ? 'Classroom: nog geen ingediende opdracht die volledig verbeterd is.'
        : `Classroom: ${delen.length ? delen.join(', ') : 'alle punten zijn al bijgewerkt'} (${lijst.length} van ${lln.length} leerlingen ingediend en verbeterd).`;
      if(u.nietInKlas.length) t += ` Niet in de Classroom-klas: ${u.nietInKlas.map(H.naamVan).join(', ')}.`;
      if(u.nietInGroep.length) t += ` In Classroom maar niet in deze groep: ${u.nietInGroep.join(', ')}.`;
      return t;
    });
  }
  tabel(); naarClassroom();
}

/* ---------- Google Classroom ----------
   Alles wat Classroom nodig heeft, loopt via crDoe: met een geldige toegang meteen, anders wacht het tot de leerkracht
   op Verbind met Classroom klikt (Google laat het aanmeldvenster enkel bij een klik open). */
const crWacht = new Map(), crBezig = new Set();
let crVak = null, crG = null, crMelding = '', crKies = null;
/* de koppeling hoort bij de groep: een lijn onder de groepknoppen, boven alle tabbladen (keuze van Jeroen, 31 oktober 2026) */
export function classroomBalk(g, hulp){
  H = hulp;
  if(crG !== g){ crWacht.clear(); crMelding = ''; crKies = null; }
  crG = g; crVak = el('div', 'cr-balk'); crTeken();
  CR.laadGoogle(H.ST.me).catch(e=>{ crMelding = 'Google is niet bereikbaar: ' + e.message; crTeken(); });
  return crVak;
}
function crTeken(){
  if(!crVak) return; const g = crG; crVak.innerHTML = '';
  const k = g.classroom;
  const r = el('div', 'rij', `<b>Google Classroom</b> <span class="mini">${k ? `gekoppeld aan <a href="${esc(k.link || '#')}" target="_blank" rel="noopener">${esc(k.naam)}</a>` : 'deze groep is nog niet gekoppeld aan een Classroom-klas'}</span>`);
  const kies = knop(k ? 'Andere klas' : 'Kies een Classroom-klas', k ? 'btn ghost klein' : 'btn klein'); kies.onclick = crKiesKlas; r.append(kies);
  if(k){ const los = knop('Ontkoppelen'); los.onclick = async ()=>{ if(!confirm(`${g.naam} loskoppelen van ${k.naam}? Wat al in Classroom staat, blijft daar staan.`)) return;
    await F.updateDoc(F.doc(db, 'groepen', g.id), { classroom:F.deleteField() }); delete g.classroom; crWacht.clear(); crMelding = 'Ontkoppeld.'; crTeken(); }; r.append(los); }
  crVak.append(r);
  if(crWacht.size && !CR.verbonden()){
    const w = el('div', 'rij'); const b = knop('Verbind met Classroom', 'btn klein');
    b.onclick = async ()=>{ try{ await CR.verbind(); }catch(e){ crMelding = 'Verbinden lukte niet: ' + e.message + '.'; return crTeken(); } crVoerUit(); };
    w.append(b, el('span', 'mini', `Nog bij te werken in Classroom: ${[...crWacht.values()].map(x=>esc(x.label)).join(', ')}. Eén klik volstaat voor het komende uur.`)); crVak.append(w);
  }
  if(crKies) crVak.append(crKies);
  if(crMelding) crVak.append(el('p', 'mini cr-melding', esc(crMelding)));
}
async function crKiesKlas(){
  const g = crG;
  try{ if(!CR.verbonden()) await CR.verbind(); }catch(e){ crMelding = 'Verbinden lukte niet: ' + e.message + '.'; return crTeken(); }
  crMelding = 'Klassen ophalen…'; crTeken();
  let klassen;
  try{ klassen = await CR.mijnKlassen(); }catch(e){ crMelding = 'Je klassen ophalen lukte niet: ' + e.message; return crTeken(); }
  crMelding = '';
  if(!klassen.length){ crMelding = 'Je geeft in Classroom les in geen enkele actieve klas.'; return crTeken(); }
  const best = CR.besteKlas(klassen, g.naam) || (g.classroom && klassen.find(x=>x.id === g.classroom.id)) || klassen[0];
  crKies = el('div', 'rij');
  const sel = el('select', 'cr-klas', klassen.map(x=>`<option value="${esc(x.id)}"${x === best ? ' selected' : ''}>${esc(x.name)}${x.section ? ' · ' + esc(x.section) : ''}</option>`).join(''));
  const ok = knop('Koppelen', 'btn klein'), weg = knop('Annuleren');
  weg.onclick = ()=>{ crKies = null; crTeken(); };
  ok.onclick = async ()=>{
    const x = klassen.find(k=>k.id === sel.value); const w = { id:x.id, naam:x.name + (x.section ? ' · ' + x.section : ''), link:x.alternateLink || '', door:H.ST.me, op:Date.now() };
    try{ await F.updateDoc(F.doc(db, 'groepen', g.id), { classroom:w }); }catch(e){ crMelding = 'Bewaren lukte niet.'; return crTeken(); }
    g.classroom = w; crKies = null; crMelding = `Gekoppeld aan ${w.naam}.`; crTeken();
    crAlleOpdrachten(g, OPDRACHTEN.filter(o=>o.jaar === H.jaarcode(g) && RUBRIEKEN_ACTIEF.includes(o.rubriek)));
  };
  crKies.append(el('span', 'mini', `Klas voor ${esc(g.naam)}:`), sel, ok, weg); crTeken();
}
/* geopende opdrachten van de groep die nog niet (of in een andere klas) in Classroom staan */
function crAlleOpdrachten(g, lijst){
  if(!g.classroom) return;
  lijst.forEach(o=>{ const c = (g.cr || {})[o.id]; if(instelling(g, o).van && (!c || c.course !== g.classroom.id)) crDoe(`${g.id}|${o.id}`, o.titel, ()=>crOpdracht(g, o)); });
}
async function crDoe(sleutel, label, taak){
  if(crBezig.has(sleutel)) return;
  crWacht.set(sleutel, { label, taak });
  if(CR.verbonden()) return crVoerUit();
  crTeken();
}
async function crVoerUit(){
  for(const [s, { label, taak }] of [...crWacht]){
    if(crBezig.has(s)) continue;
    crWacht.delete(s); crBezig.add(s); crMelding = `Classroom: ${label} bijwerken…`; crTeken();
    try{ crMelding = (await taak()) || ''; }
    catch(e){ console.warn(e); if(e.code === 'token'){ crWacht.set(s, { label, taak }); crMelding = ''; } else crMelding = `Classroom (${label}): ${e.message}`; }
    finally{ crBezig.delete(s); }
    crTeken();
  }
}
async function crOpdracht(g, o){
  const cfg = instelling(g, o); if(!g.classroom || !cfg.van) return '';
  const opg = await laadOpgave(opgUrl(o));
  const max = o.op || bereken(opg, {}, null, null).max;
  const cr = (g.cr || {})[o.id] || null;
  const n = await CR.zetOpdracht({ course:g.classroom.id, cr, o, cfg, max, link:new URL(`../${o.pad}`, location.href).href,
    uitleg:`Maak deze ${soortVan(o)} op het oefenplatform wiskunde: klik op de link en meld je aan met je schoolaccount. Je dient in op het platform; in Classroom hoef je niets te doen. De punten verschijnen hier na de verbetering.` });
  if(!cr || cr.cw !== n.cw || cr.course !== n.course || (n.link && cr.link !== n.link)){
    const w = { course:n.course, cw:n.cw, link:n.link };
    await F.updateDoc(F.doc(db, 'groepen', g.id), { [`cr.${o.id}`]:w }); g.cr = Object.assign({}, g.cr, { [o.id]:w });
  }
  return n.nieuw ? `Classroom: ${o.titel} staat in ${g.classroom.naam}.` : `Classroom: ${o.titel} is bijgewerkt.`;
}

/* sleutelcode intikken: de sleutel uit sleutel.enc.json ontsleutelen en in Firestore zetten (één keer per opdracht) */
function sleutelVak(o, klaar){
  const v = el('div', 'tip', `<div><b>De verbetersleutel staat nog niet klaar.</b> Zonder sleutel zie je de antwoorden, maar wordt er niets automatisch verbeterd. Typ de sleutelcode van deze ${soortVan(o) === 'toets' ? 'toets' : 'taak'} (één keer, daarna werkt het voor alle leerkrachten).
    <div class="rij"><input type="text" class="sl-code" placeholder="bv. K7QM-R2XD" autocomplete="off" spellcheck="false"></div></div>`);
  const ok = knop('Ontgrendel', 'btn klein'), m = el('span', 'mini'); v.querySelector('.rij').append(ok, m);
  ok.onclick = async ()=>{
    const code = v.querySelector('.sl-code').value; if(!code.trim()) return;
    ok.disabled = true; m.className = 'mini'; m.textContent = ' bezig…';
    try{
      const r = await fetch(new URL(`../${o.pad}sleutel.enc.json`, location.href)); if(!r.ok) throw new Error('geen sleutelbestand');
      const enc = await r.json(); let sl;
      try{ sl = await ontsleutel(enc, code); }catch(e){ throw new Error('code'); }
      await F.setDoc(F.doc(db, 'sleutels', o.id), naarDb(Object.assign({}, sl, { opdr:o.id, door:H.ST.me, op:Date.now() })));
      klaar();
    }catch(e){ console.warn(e); ok.disabled = false; m.className = 'errmsg';
      m.textContent = /sleutelbestand/.test(e.message) ? ' het sleutelbestand ontbreekt' : e.message === 'code' ? ' deze code klopt niet' : ' de code klopt, maar bewaren lukte niet (' + (e.code || e.message) + ')'; }
  };
  return v;
}
