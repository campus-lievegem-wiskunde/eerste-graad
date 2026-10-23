/* Dashboard voor leerkrachten en beheerders. */
import { klaar, db, F, C } from '../gedeeld/aanmelden.js';
import { SITES } from '../gedeeld/sites.js';

const $ = (s, r=document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const root = $('#dash'); root.classList.add('dash');
const ST = { me:null, rol:null, view:'groepen', groepen:[], leerkrachten:[], leerlingen:null, sel:null, sub:'voortgang', site:null, alle:false, bsub:'beheren', fouten:null, filter:'open', open:new Set(), zgJaar:'', ookDicht:false, uitgeklapt:new Set(), rubDicht:new Set(), rubOpen:new Set() };
const jaarcode = g => `${g.jaar}${g.stroom}`;
const sitesVoor = g => SITES.filter(s=>s.jaar === jaarcode(g));
/* rubrieken in vaste volgorde; een site zonder (gekende) rubriek komt achteraan bij Andere */
const RUBRIEKEN = [['modules', 'Modules'], ['rekenvaardigheden', 'Rekenvaardigheden'], ['basisgeletterdheid', 'Basisgeletterdheid'], ['heuristieken', 'Heuristieken'], ['wiskundige-problemen', 'Wiskundige problemen']];
function perRubriek(sites){
  const groepen = RUBRIEKEN.map(([id, naam])=>({ id, naam, sites:sites.filter(s=>s.rubriek === id) }));
  const rest = sites.filter(s=>!RUBRIEKEN.some(([id])=>id === s.rubriek)); if(rest.length) groepen.push({ id:'andere', naam:'Andere', sites:rest });
  return groepen.filter(r=>r.sites.length);
}
const staatOpen = (g, s) => !!(g.aan && g.aan[s.id] && g.aan[s.id].on);
const naamVan = e => { const l = ST.leerlingen && ST.leerlingen.get(e); return l ? `${l.familienaam} ${l.voornaam}` : e; };
const lkNaam = e => { const l = ST.leerkrachten.find(x=>x.id === e); return l ? l.naam : e; };
const groepId = naam => naam.trim().replace(/[\/\s]+/g, '-');

/* ---------- gegevens ---------- */
async function laadGroepen(){ const s = await F.getDocs(F.collection(db, 'groepen')); ST.groepen = s.docs.map(d=>Object.assign({ id:d.id, leerkrachten:[], leerlingen:[], aan:{} }, d.data())).sort(groepVolgorde); }
/* volgorde: per jaar eerst de B-klas, dan de klasgroepen (1C, 1D), dan de niveaugroepen (1ANg1 … 1ANg3) */
const groepRang = g => /^\d\s*B$/i.test(g.naam) ? 0 : /^\d\s*[A-Z]$/i.test(g.naam) ? 1 : 2;
function groepVolgorde(a, b){ return (String(a.jaar).localeCompare(String(b.jaar))) || (groepRang(a) - groepRang(b)) || a.naam.localeCompare(b.naam, 'nl', { numeric:true, sensitivity:'base' }); }
async function laadLeerkrachten(){ if(ST.rol === 'beheerder'){ const b = await F.getDocs(F.collection(db, 'beheerders')).catch(()=>null); ST.beheerders = new Set(b ? b.docs.map(d=>d.id) : []); }
  const s = await F.getDocs(F.collection(db, 'leerkrachten')); ST.leerkrachten = s.docs.map(d=>Object.assign({ id:d.id }, d.data())).sort((a,b)=>(a.naam||'').localeCompare(b.naam||'')); }
async function laadLeerlingen(){ const s = await F.getDocs(F.collection(db, 'leerlingen')); ST.leerlingen = new Map(s.docs.map(d=>[d.id, d.data()])); }
async function updGroep(g, data){ await F.updateDoc(F.doc(db, 'groepen', g.id), data); Object.entries(data).forEach(([k, v])=>{ if(!k.includes('.')) g[k] = v; }); }

/* ---------- bovenbalk ---------- */
function render(){
  root.innerHTML = '';
  const top = el('div', 'dash-top');
  const tabs = el('div', 'tabs'); tabs.setAttribute('role', 'tablist');
  const items = [['groepen', 'Mijn groepen'], ['fout', `${IC_FOUT}Fout melden`]]; if(ST.rol === 'beheerder') items.push(['beheer', 'Beheer']);
  items.forEach(([k, lab])=>{ const b = el('button', 'tab', lab); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(ST.view === k)); b.onclick = ()=>{ ST.view = k; render(); }; tabs.append(b); });
  top.append(tabs); root.append(top);
  const body = el('div'); root.append(body);
  ({ beheer:viewBeheer, fout:viewFout, groepen:viewGroepen })[ST.view](body);
}

/* =========================================================
   MIJN GROEPEN
   ========================================================= */
function viewGroepen(body){
  const mijn = ST.groepen.filter(g=>g.leerkrachten.includes(ST.me));
  const kop = el('div', 'rij');
  const kies = el('button', 'btn ghost', 'Mijn groepen kiezen'); kies.type = 'button'; kies.onclick = ()=>kiesGroepen(body);
  const verv = el('button', 'btn ghost', ST.collega ? '← Terug naar mijn groepen' : 'Vervanging collega'); verv.type = 'button';
  verv.onclick = ()=>{ if(ST.collega){ ST.collega = null; ST.sel = null; render(); } else kiesCollega(body); };
  kop.append(kies, verv); body.append(kop);
  const toon = ST.collega ? ST.groepen.filter(g=>g.leerkrachten.includes(ST.collega)) : mijn;
  if(ST.collega) body.append(el('div', 'vervang', `Vervanging: je bekijkt de groepen van ${esc(lkNaam(ST.collega))}. Kies een groep.`));
  if(!toon.length){ if(ST.collega){ body.append(el('p', 'mini', 'Deze collega heeft nog geen groepen.')); return; } body.append(el('div', 'tip', '<div>Je hebt nog geen groepen. Klik op <b>Mijn groepen kiezen</b> en duid je niveaugroepen aan.</div>')); return; }
  const chips = el('div', 'chips');
  toon.forEach(g=>{ const b = el('button', 'chip-btn', `${esc(g.naam)}<span class="cnt">${g.leerlingen.length}</span>`); b.type = 'button'; b.setAttribute('aria-pressed', String(ST.sel === g)); b.onclick = ()=>{ ST.sel = g; ST.site = null; render(); }; chips.append(b); });
  body.append(chips);
  if(!ST.sel || !toon.includes(ST.sel)) ST.sel = toon[0];
  const g = ST.sel;
  const sub = el('div', 'tabs');
  [['voortgang', 'Voortgang'], ['leerlingen', 'Leerlingen'], ['aanuit', 'Openzetten']].forEach(([k, lab])=>{ const b = el('button', 'tab', lab); b.type = 'button'; b.setAttribute('aria-selected', String(ST.sub === k)); b.onclick = ()=>{ ST.sub = k; render(); }; sub.append(b); });
  body.append(sub);
  const pane = el('div'); body.append(pane);
  ({ voortgang:paneVoortgang, leerlingen:paneLeerlingen, aanuit:paneAanUit })[ST.sub](pane, g);
}

function kiesCollega(body){
  body.innerHTML = '';
  const card = el('div', 'dash-card', '<h3>Vervanging collega</h3><p class="mini">Kies de collega die je vervangt. Daarna zie je zijn of haar groepen.</p>');
  const chips = el('div', 'chips');
  ST.leerkrachten.filter(l=>l.id !== ST.me).forEach(l=>{
    const n = ST.groepen.filter(g=>g.leerkrachten.includes(l.id));
    const b = el('button', 'chip-btn', `${esc(l.naam || l.id)}<span class="cnt">${n.length}</span>`); b.type = 'button'; b.title = n.map(g=>g.naam).join(', ') || 'nog geen groepen';
    b.onclick = ()=>{ ST.collega = l.id; ST.sel = null; ST.site = null; render(); }; chips.append(b); });
  if(!chips.children.length) chips.append(el('p', 'mini', 'Er zijn nog geen andere leerkrachten.'));
  const terug = el('button', 'btn ghost', 'Annuleren'); terug.type = 'button'; terug.onclick = render;
  card.append(chips, terug); body.append(card);
}

function kiesGroepen(body){
  body.innerHTML = '';
  const card = el('div', 'dash-card', '<h3>Mijn groepen kiezen</h3><p class="mini">Duid de groepen aan waarvan jij de leerkracht bent. Je kan dit later altijd aanpassen.</p>');
  const per = {};
  ST.groepen.forEach(g=>{ (per[g.jaar] = per[g.jaar] || []).push(g); });
  Object.keys(per).sort().forEach(j=>{
    card.append(el('h4', '', j === '1' ? '1ste jaar' : j === '2' ? '2de jaar' : j));
    const box = el('div', 'lijst-check');
    per[j].forEach(g=>{ const l = el('label', '', `<input type="checkbox" value="${esc(g.id)}" ${g.leerkrachten.includes(ST.me) ? 'checked' : ''}> ${esc(g.naam)} <span class="mini">${g.leerkrachten.filter(x=>x !== ST.me).map(lkNaam).map(esc).join(', ')}</span>`); box.append(l); });
    card.append(box);
  });
  if(!ST.groepen.length) card.append(el('p', '', 'Er zijn nog geen groepen. De beheerder maakt ze aan.'));
  const r = el('div', 'rij'); const ok = el('button', 'btn', 'Bewaren'); const terug = el('button', 'btn ghost', 'Annuleren'); const m = el('span');
  ok.type = terug.type = 'button'; r.append(ok, terug, m); card.append(r); body.append(card);
  terug.onclick = render;
  ok.onclick = async ()=>{
    ok.disabled = true; m.textContent = 'Bezig met bewaren…';
    try{
      for(const g of ST.groepen){
        const want = card.querySelector(`input[value="${CSS.escape(g.id)}"]`).checked, has = g.leerkrachten.includes(ST.me);
        if(want === has) continue;
        await F.updateDoc(F.doc(db, 'groepen', g.id), { leerkrachten: want ? F.arrayUnion(ST.me) : F.arrayRemove(ST.me) });
        g.leerkrachten = want ? [...g.leerkrachten, ST.me] : g.leerkrachten.filter(x=>x !== ST.me);
      }
      ST.sel = null; render();
    }catch(e){ console.error(e); m.className = 'errmsg'; m.textContent = 'Bewaren lukte niet.'; ok.disabled = false; }
  };
}

/* ---------- voortgang ---------- */
function sectieVan(site, vraagId){ let best = null; site.onderdelen.forEach(o=>{ if(vraagId.startsWith(o.id + '_') && (!best || o.id.length > best.id.length)) best = o; }); return best; }
function minuten(s){ if(!s) return '–'; const m = Math.round(s / 60); return m < 1 ? '<1 min' : `${m} min`; }
async function haalVoortgang(site, emails){
  const out = new Map();
  for(let i = 0; i < emails.length; i += 30){
    const q = F.query(F.collection(db, 'voortgang'), F.where('site', '==', site.id), F.where('email', 'in', emails.slice(i, i + 30)));
    (await F.getDocs(q)).docs.forEach(d=>out.set(d.data().email, d.data()));
  }
  return out;
}
function verwerk(site, d){
  const per = {}; site.onderdelen.forEach(o=>per[o.id] = { juist:0, fout:0, tijd:0 });
  if(!d) return { per, totaal:0, toets:{}, niv:{} };
  let res = {}, toets = {};
  try{ res = JSON.parse((d.data || {})._res || '{}'); }catch(e){}
  try{ toets = JSON.parse((d.data || {})._toets || '{}'); }catch(e){}
  /* niveau A-E per onderdeel na de laatste reeks (sites die dat bijhouden, zoals wiskundige problemen): data.niv */
  let niv = {}; try{ niv = JSON.parse((d.data || {}).niv || '{}') || {}; }catch(e){}
  /* sinds 23 oktober 2026 ook per vraag in res en per proeftoets in toets (samengevoegd bij elke bewaring) */
  res = Object.assign({}, res, d.res || {}); toets = Object.assign({}, toets, d.toets || {});
  Object.entries(res).forEach(([id, ok])=>{ const o = sectieVan(site, id); if(o) per[o.id][ok ? 'juist' : 'fout']++; });
  let totaal = 0; Object.entries(d.tijd || {}).forEach(([k, s])=>{ totaal += s; if(per[k]) per[k].tijd = s; });
  const tScore = {}; Object.entries(toets).forEach(([key, t])=>{ const o = site.onderdelen.find(x=>key.startsWith(x.id + '_')); if(o) tScore[o.id] = t; });
  return { per, totaal, toets:tScore, niv, bijgewerkt:d.bijgewerkt, diag:d.diag, nRes:Object.keys(res).length };
}
/* knop "Bekijk": opent de module in een nieuw tabblad (leerkrachten zien er altijd alle onderdelen) */
const IC_FOUT = '<svg class="ic-fout" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 2.6 19.6a1 1 0 0 0 .9 1.5h17a1 1 0 0 0 .9-1.5L12 3.2z"/><path d="M12 9.5v5"/><circle cx="12" cy="17.6" r=".4"/></svg>';
const OOG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const moduleUrl = (s, ond)=>`../${s.pad}${ond ? '#' + encodeURIComponent(ond) : ''}`;
function bekijkKnop(s){ const a = el('a', 'btn ghost klein bekijk', OOG + 'Bekijk'); a.href = moduleUrl(s); a.target = '_blank'; a.rel = 'noopener'; a.title = `${s.titel} openen in een nieuw tabblad`; return a; }

async function paneVoortgang(pane, g){
  const sites = sitesVoor(g);
  if(!sites.length){ pane.append(el('p', 'mini', `Er zijn nog geen sites voor ${jaarcode(g)}.`)); return; }
  /* in de keuzelijst: eerst het overzicht, dan de sites per rubriek; gesloten sites enkel met het vinkje */
  const zicht = sites.filter(s=>ST.ookDicht || staatOpen(g, s) || s === ST.site);
  if(ST.site && !sites.includes(ST.site)) ST.site = null;
  const r = el('div', 'rij', '<label for="siteSel">Site</label>');
  const sel = el('select'); sel.id = 'siteSel';
  { const o = el('option', '', 'Overzicht van alle open sites'); o.value = ''; o.selected = !ST.site; sel.append(o); }
  perRubriek(zicht).forEach(rb=>{ const og = el('optgroup'); og.label = rb.naam;
    rb.sites.forEach(s=>{ const o = el('option', '', esc(s.titel) + (staatOpen(g, s) ? '' : ' (dicht)')); o.value = s.id; o.selected = s === ST.site; og.append(o); }); sel.append(og); });
  sel.onchange = ()=>{ ST.site = sites.find(s=>s.id === sel.value) || null; render(); };
  const dicht = el('label', 'mini ook-dicht', `<input type="checkbox" ${ST.ookDicht ? 'checked' : ''}> ook gesloten sites`);
  dicht.querySelector('input').onchange = e=>{ ST.ookDicht = e.target.checked; render(); };
  const vern = el('button', 'btn ghost klein', '↻ Vernieuwen'); vern.type = 'button'; vern.onclick = render;
  r.append(sel); if(ST.site) r.append(bekijkKnop(ST.site)); r.append(vern, dicht); pane.append(r);
  if(!g.leerlingen.length){ pane.append(el('p', 'mini', 'Deze groep heeft nog geen leerlingen. Voeg ze toe bij het tabblad Leerlingen.')); return; }
  if(!ST.leerlingen) await laadLeerlingen().catch(()=>{});
  if(!ST.site) return overzicht(pane, g, zicht.filter(s=>ST.ookDicht || staatOpen(g, s)));
  const wacht = el('p', 'mini', 'Voortgang ophalen…'); pane.append(wacht);
  const site = ST.site; let data;
  try{ data = await haalVoortgang(site, g.leerlingen); }catch(e){ console.error(e); wacht.className = 'errmsg'; wacht.textContent = 'Ophalen lukte niet.'; return; }
  wacht.remove();
  const ond = site.onderdelen;
  const wrap = el('div', 'tbl-wrap'); const t = el('table', 'dt');
  t.innerHTML = `<thead><tr><th>Leerling</th><th>Werktijd</th>${ond.map(o=>`<th class="rot"><a class="th-link" href="${moduleUrl(site, o.id)}" target="_blank" rel="noopener" title="${esc(o.naam)} bekijken">${esc(o.naam)}</a></th>`).join('')}</tr></thead>`;
  const tb = el('tbody');
  const lln = [...g.leerlingen].sort((a,b)=>naamVan(a).localeCompare(naamVan(b), 'nl'));
  lln.forEach(e=>{
    const v = verwerk(site, data.get(e));
    const tr = el('tr');
    const nb = el('button', 'naam-btn', esc(naamVan(e))); nb.type = 'button'; nb.onclick = ()=>detail(pane, site, e, v);
    const td0 = el('td'); td0.append(nb); tr.append(td0, el('td', '', minuten(v.totaal)));
    ond.forEach(o=>{
      const p = v.per[o.id], tt = v.toets[o.id];
      let txt = '', cls = 's0';
      if(o.toets){ if(tt){ const r_ = tt.score / tt.n; txt = `${tt.score}/${tt.n}`; cls = r_ >= .8 ? 's4' : r_ >= .6 ? 's3' : r_ >= .4 ? 's2' : 's1'; } }
      else if(p.juist + p.fout){ const r_ = o.vragen ? p.juist / o.vragen : 0; txt = `${p.juist}${o.vragen ? '/' + o.vragen : ''}`; cls = r_ >= .8 ? 's4' : r_ >= .5 ? 's3' : r_ >= .2 ? 's2' : 's1'; }
      const nv = v.niv[o.id];
      const td = el('td', 'sc ' + cls, (nv ? `<b class="niv-l" title="niveau na de laatste reeks">${esc(nv.n)}</b>` : '') + (txt || (nv ? '' : '·')) + (p.tijd ? `<small>${minuten(p.tijd)}</small>` : ''));
      td.title = `${o.naam}: ${p.juist} juist, ${p.fout} fout${o.vragen ? ` (van ${o.vragen} vragen)` : ''}${nv ? `, niveau ${nv.n} na de laatste reeks (${nv.j}/${nv.t})` : ''}, ${minuten(p.tijd)}`;
      tr.append(td);
    });
    tb.append(tr);
  });
  t.append(tb); wrap.append(t); pane.append(wrap);
  pane.append(el('div', 'legend-s', '<b>Cel:</b> aantal vragen juist / aantal vragen, met werktijd · <span class="l1">weinig</span><span class="l2">bezig</span><span class="l3">goed op weg</span><span class="l4">(bijna) alles juist</span> · proeftoets: score'));
  if(data && [...data.values()].some(d=>d && d.data && d.data.niv)) pane.append(el('p', 'mini', '<b class="niv-l">B</b> = niveau na de laatste reeks van minstens 5 vragen (A hoogste, E laagste).'));
}
/* overzicht: leerlingen × sites, per site het deel van de vragen juist en de werktijd; klik op een site voor de tabel per onderdeel */
function samenvatting(site, v){
  let juist = 0, vragen = 0, ts = 0, tn = 0;
  site.onderdelen.forEach(o=>{ if(o.toets){ const t = v.toets[o.id]; if(t){ ts += t.score; tn += t.n; } } else { juist += v.per[o.id].juist; vragen += o.vragen || 0; } });
  return { juist, vragen, r:vragen ? juist / vragen : 0, toets:tn ? ts / tn : null };
}
async function overzicht(pane, g, sites){
  if(!sites.length){ pane.append(el('p', 'mini', 'Voor deze groep staat nog geen enkele site open. Zet er een open bij het tabblad Openzetten.')); return; }
  const wacht = el('p', 'mini', 'Voortgang ophalen…'); pane.append(wacht);
  let data;
  try{ data = await Promise.all(sites.map(s=>haalVoortgang(s, g.leerlingen))); }catch(e){ console.error(e); wacht.className = 'errmsg'; wacht.textContent = 'Ophalen lukte niet.'; return; }
  wacht.remove();
  const rbs = perRubriek(sites);
  const wrap = el('div', 'tbl-wrap'); const t = el('table', 'dt overzicht');
  t.innerHTML = `<thead><tr><th rowspan="2">Leerling</th><th rowspan="2">Werktijd</th>${rbs.map(rb=>`<th class="rub" colspan="${rb.sites.length}">${esc(rb.naam)}</th>`).join('')}</tr>`
    + `<tr>${rbs.map(rb=>rb.sites.map(s=>`<th class="rot"><button type="button" class="th-link" data-site="${esc(s.id)}" title="${esc(s.titel)}: tabel per onderdeel">${esc(s.kort || s.titel)}</button></th>`).join('')).join('')}</tr></thead>`;
  t.querySelectorAll('button[data-site]').forEach(b=>b.onclick = ()=>{ ST.site = SITES.find(s=>s.id === b.dataset.site); render(); });
  const volg = rbs.flatMap(rb=>rb.sites);
  const tb = el('tbody');
  [...g.leerlingen].sort((a,b)=>naamVan(a).localeCompare(naamVan(b), 'nl')).forEach(e=>{
    const tr = el('tr'); let totaal = 0; const cellen = [];
    volg.forEach(s=>{
      const v = verwerk(s, data[sites.indexOf(s)].get(e)); totaal += v.totaal; const z = samenvatting(s, v);
      let txt = '·', cls = 's0';
      if(z.juist || z.toets != null){ txt = z.vragen ? `${Math.round(z.r * 100)} %` : `${Math.round(z.toets * 100)} %`; const r_ = z.vragen ? z.r : z.toets; cls = r_ >= .8 ? 's4' : r_ >= .5 ? 's3' : r_ >= .2 ? 's2' : 's1'; }
      const td = el('td', 'sc ' + cls, txt + (v.totaal ? `<small>${minuten(v.totaal)}</small>` : ''));
      td.title = `${s.titel}: ${z.juist}${z.vragen ? ' van ' + z.vragen : ''} vragen juist${z.toets != null ? `, proeftoetsen gemiddeld ${Math.round(z.toets * 100)} %` : ''}, ${minuten(v.totaal)}`;
      cellen.push(td);
    });
    tr.append(el('td', '', esc(naamVan(e))), el('td', '', minuten(totaal)), ...cellen); tb.append(tr);
  });
  t.append(tb); wrap.append(t); pane.append(wrap);
  pane.append(el('div', 'legend-s', '<b>Cel:</b> deel van alle vragen van de site juist, met werktijd · <span class="l1">weinig</span><span class="l2">bezig</span><span class="l3">goed op weg</span><span class="l4">(bijna) alles juist</span> · klik op een site voor de tabel per onderdeel'));
}
/* diagnose (tijdelijk): wat de module van deze leerling meestuurde bij het bewaren */
function diagRegel(v){
  const g = v.diag, tijdstip = x=>x ? new Date(x).toLocaleString('nl-BE') : '';
  if(!g) return el('p', 'mini diag', `<b>Diagnose:</b> nog niets ontvangen (de leerling opende de module nog niet sinds de diagnose online staat). Resultaten in Firebase: ${v.nRes || 0}.`);
  const p = el('p', 'mini diag', `<b>Diagnose:</b> ${esc(g.toestel || '?')} · ${g.sessies || 0}× geopend · ${g.controles || 0}× gecontroleerd`
    + `${g.genegeerd ? ` (${g.genegeerd} zonder score)` : ''} · resultaten op het toestel: ${g.resNu ?? '?'}, in Firebase: ${v.nRes || 0}`
    + ` · ${g.bewaren || 0}× bewaard${g.bewaardFout ? `, ${g.bewaardFout}× mislukt` : ''}${g.mislukt ? ` · ${g.mislukt}× resultaat niet in het browsergeheugen` : ''}`
    + `${g.fout ? `<br>Laatste fout (${tijdstip(g.foutOp)}): ${esc(g.fout)}` : ''}${g.jsfout ? `<br>Laatste JavaScript-fout (${tijdstip(g.jsfoutOp)}): ${esc(g.jsfout)}` : ''}`
    + `<br>Laatst doorgestuurd: ${tijdstip(g.op)}`);
  p.title = g.ua || ''; return p;
}
function detail(pane, site, e, v){
  const old = pane.querySelector('.detail'); if(old) old.remove();
  const d = el('div', 'detail', `<h3>${esc(naamVan(e))} · ${esc(site.kort)}</h3><p class="mini">${esc(e)} · totale werktijd ${minuten(v.totaal)}${v.bijgewerkt && v.bijgewerkt.toDate ? ' · laatst actief ' + v.bijgewerkt.toDate().toLocaleString('nl-BE') : ''}</p>`);
  const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Onderdeel</th><th>Juist</th><th>Fout</th><th>Niet gemaakt</th><th>Werktijd</th></tr></thead>';
  const tb = el('tbody');
  site.onderdelen.forEach(o=>{ const p = v.per[o.id], tt = v.toets[o.id];
    const nv = v.niv && v.niv[o.id], nm = esc(o.naam) + (nv ? ` <b class="niv-l" title="niveau na de laatste reeks">${esc(nv.n)}</b>` : '');
    tb.append(el('tr', '', o.toets ? `<td>${nm}</td><td colspan="3">${tt ? `score ${tt.score}/${tt.n} op ${new Date(tt.datum).toLocaleDateString('nl-BE')}` : 'nog niet gemaakt'}</td><td>${minuten(p.tijd)}</td>`
      : `<td>${nm}</td><td class="c">${p.juist}</td><td class="c">${p.fout}</td><td class="c">${o.vragen ? Math.max(0, o.vragen - p.juist - p.fout) : '–'}</td><td>${minuten(p.tijd)}</td>`)); });
  t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); d.append(w);
  d.append(diagRegel(v));
  const sl = el('button', 'btn ghost klein', 'Sluiten'); sl.type = 'button'; sl.onclick = ()=>d.remove(); { const _r = el('div', 'rij'); _r.append(sl); d.append(_r); }
  pane.prepend(d); d.scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ---------- leerlingen van een groep ---------- */
async function paneLeerlingen(pane, g){
  if(!ST.leerlingen){ pane.append(el('p', 'mini', 'Leerlingenlijst ophalen…')); await laadLeerlingen(); pane.innerHTML = ''; }
  const card = el('div', 'dash-card', `<h3>Leerlingen in ${esc(g.naam)} (${g.leerlingen.length})</h3>`);
  const andere = ST.groepen.filter(x=>x !== g && jaarcode(x) === jaarcode(g));
  if(g.leerlingen.length){
    const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Leerling</th><th>Klas</th><th>Verplaatsen naar</th><th></th></tr></thead>';
    const tb = el('tbody');
    [...g.leerlingen].sort((a,b)=>naamVan(a).localeCompare(naamVan(b), 'nl')).forEach(e=>{
      const l = ST.leerlingen.get(e) || {};
      const tr = el('tr', '', `<td>${esc(naamVan(e))}</td><td>${esc(l.klas || '')}</td>`);
      const s = el('select', '', '<option value="">…</option>' + andere.map(x=>`<option value="${esc(x.id)}">${esc(x.naam)}</option>`).join(''));
      s.onchange = async ()=>{ const doel = andere.find(x=>x.id === s.value); if(!doel) return;
        await updGroep(g, { leerlingen: F.arrayRemove(e) }); g.leerlingen = g.leerlingen.filter(x=>x !== e);
        await F.updateDoc(F.doc(db, 'groepen', doel.id), { leerlingen: F.arrayUnion(e) }); doel.leerlingen = [...new Set([...doel.leerlingen, e])];
        render(); };
      const td = el('td'); td.append(s);
      const rm = el('button', 'btn gevaar klein', 'Uit groep'); rm.type = 'button';
      rm.onclick = async ()=>{ await updGroep(g, { leerlingen: F.arrayRemove(e) }); g.leerlingen = g.leerlingen.filter(x=>x !== e); render(); };
      const td2 = el('td'); td2.append(rm); tr.append(td, td2); tb.append(tr);
    });
    t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); card.append(w);
  } else card.append(el('p', 'mini', 'Nog geen leerlingen.'));
  pane.append(card);

  const add = el('div', 'dash-card', '<h3>Leerlingen toevoegen</h3>');
  const kandidaten = [...ST.leerlingen.entries()].filter(([e, l])=>`${l.jaar}${l.stroom}` === jaarcode(g) && !g.leerlingen.includes(e));
  const klassen = [...new Set(kandidaten.map(([, l])=>l.klas))].sort();
  const r = el('div', 'rij', '<label for="klasSel">Klas</label>');
  const ks = el('select', '', '<option value="">alle klassen</option>' + klassen.map(k=>`<option>${esc(k)}</option>`).join('')); ks.id = 'klasSel';
  const zoek = el('input'); zoek.type = 'search'; zoek.placeholder = 'Zoek op naam';
  r.append(ks, zoek); add.append(r);
  const box = el('div', 'lijst-check'); add.append(box);
  const bezet = new Map(); ST.groepen.filter(x=>jaarcode(x) === jaarcode(g)).forEach(x=>x.leerlingen.forEach(e=>bezet.set(e, x.naam)));
  const teken = ()=>{ box.innerHTML = ''; const z = zoek.value.trim().toLowerCase();
    kandidaten.filter(([e, l])=>(!ks.value || l.klas === ks.value) && (!z || `${l.familienaam} ${l.voornaam}`.toLowerCase().includes(z)))
      .sort((a,b)=>`${a[1].familienaam} ${a[1].voornaam}`.localeCompare(`${b[1].familienaam} ${b[1].voornaam}`, 'nl'))
      .forEach(([e, l])=>box.append(el('label', '', `<input type="checkbox" value="${esc(e)}"> ${esc(l.familienaam)} ${esc(l.voornaam)} <span class="mini">${esc(l.klas)}${bezet.has(e) ? ' · nu in ' + esc(bezet.get(e)) : ''}</span>`)));
    if(!box.children.length) box.append(el('p', 'mini', 'Geen leerlingen gevonden.')); };
  ks.onchange = teken; zoek.oninput = teken; teken();
  const r2 = el('div', 'rij'); const ok = el('button', 'btn', 'Toevoegen aan ' + esc(g.naam)); ok.type = 'button';
  const verpl = el('label', '', '<input type="checkbox" checked> uit hun huidige groep halen (verplaatsen)');
  r2.append(ok, verpl); add.append(r2); pane.append(add);
  ok.onclick = async ()=>{
    const gekozen = [...box.querySelectorAll('input:checked')].map(i=>i.value); if(!gekozen.length) return;
    ok.disabled = true;
    if(verpl.querySelector('input').checked){
      for(const x of ST.groepen.filter(x=>x !== g && jaarcode(x) === jaarcode(g))){
        const weg = gekozen.filter(e=>x.leerlingen.includes(e)); if(!weg.length) continue;
        await F.updateDoc(F.doc(db, 'groepen', x.id), { leerlingen: F.arrayRemove(...weg) }); x.leerlingen = x.leerlingen.filter(e=>!weg.includes(e));
      }
    }
    await F.updateDoc(F.doc(db, 'groepen', g.id), { leerlingen: F.arrayUnion(...gekozen) }); g.leerlingen = [...new Set([...g.leerlingen, ...gekozen])];
    render();
  };
}

/* ---------- openzetten ---------- */
function paneAanUit(pane, g){
  const card = el('div', 'dash-card', `<h3>Wat staat open voor ${esc(g.naam)}?</h3><p class="mini">Een module die uit staat, zien de leerlingen niet. Staat een module open, dan kan je per onderdeel kiezen of het zichtbaar is, en of de leerlingen de knop met het rekentoestel krijgen. Wijzigingen worden meteen bewaard.</p>`);
  const sites = sitesVoor(g);
  if(!sites.length) card.append(el('p', 'mini', `Er zijn nog geen sites voor ${jaarcode(g)}.`));
  /* per rubriek een inklapbaar blok; per site staan de onderdelen ingeklapt achter een samenvatting */
  const rubBlok = {};
  const rubTel = rb => { const n = rb.sites.filter(s=>staatOpen(g, s)).length; return `${n} van ${rb.sites.length} open`; };
  const rubs = perRubriek(sites);
  rubs.forEach(rb=>{
    const d = el('details', 'rub-blok'); const k_ = g.id + '|' + rb.id;
    /* standaard open als er in de rubriek iets openstaat (of als er maar één rubriek is); daarna onthouden zolang het dashboard openstaat */
    d.open = ST.rubDicht.has(k_) ? false : ST.rubOpen.has(k_) || rubs.length === 1 || rb.sites.some(s=>staatOpen(g, s));
    d.ontoggle = ()=>{ if(d.open){ ST.rubDicht.delete(k_); ST.rubOpen.add(k_); } else { ST.rubOpen.delete(k_); ST.rubDicht.add(k_); } };
    const sm = el('summary', '', `<b>${esc(rb.naam)}</b> <span class="mini rub-tel">${rubTel(rb)}</span>`); d.append(sm);
    rb.sites.forEach(s=>rubBlok[s.id] = { d, rb, sm }); card.append(d);
  });
  sites.forEach(s=>{
    const a = (g.aan && g.aan[s.id]) || { on:false, uit:[] };
    const blok = el('div', 'site-blok');
    const sw = el('label', 'switch', `<input type="checkbox" ${a.on ? 'checked' : ''}> ${esc(s.titel)}`);
    const st = el('span', 'mini'); sw.append(st);
    const sam = el('button', 'btn ghost klein ond-sam'); sam.type = 'button';
    const klap = ()=>{ const lijst_ = blok.querySelector('.onderdelen'); const uit_ = ST.uitgeklapt.has(g.id + '|' + s.id) && sw.querySelector('input').checked;
      if(lijst_){ lijst_.hidden = rt_.hidden = kn_.hidden = !uit_; }
      const n = s.onderdelen.length, aan = lijst_ ? [...lijst_.querySelectorAll('input')].filter(i=>i.checked).length : n;
      sam.hidden = !sw.querySelector('input').checked; sam.innerHTML = `${aan} van ${n} onderdelen ${uit_ ? '▾' : '▸'}`; };
    sam.onclick = ()=>{ const k = g.id + '|' + s.id; if(ST.uitgeklapt.has(k)) ST.uitgeklapt.delete(k); else ST.uitgeklapt.add(k); klap(); };
    let rt_, kn_;
    const kop = el('div', 'site-kop'); kop.append(sw, sam, bekijkKnop(s)); blok.append(kop);
    const rt = el('label', 'rt-keuze', `<input type="checkbox" ${a.rt ? 'checked' : ''}> Knop met het rekentoestel tonen <span class="mini">(rechtsonder op elke pagina van deze module)</span>`); rt.hidden = !a.on; blok.append(rt);
    const lijst = el('div', 'onderdelen'); lijst.hidden = !a.on;
    s.onderdelen.forEach(o=>{ const l = el('label', '', `<input type="checkbox" value="${esc(o.id)}" ${(a.uit || []).includes(o.id) ? '' : 'checked'}> ${esc(o.naam)} <a class="ond-link" href="${moduleUrl(s, o.id)}" target="_blank" rel="noopener" title="${esc(o.naam)} bekijken" aria-label="${esc(o.naam)} bekijken">${OOG}</a>`); lijst.append(l); });
    const knoppen = el('div', 'rij'); knoppen.style.marginLeft = '3.1rem'; knoppen.hidden = !a.on;
    const allesAan = el('button', 'btn ghost klein', 'Alle onderdelen aan'), allesUit = el('button', 'btn ghost klein', 'Alle onderdelen uit');
    allesAan.type = allesUit.type = 'button'; knoppen.append(allesAan, allesUit);
    blok.append(lijst, knoppen); rubBlok[s.id].d.append(blok); rt_ = rt; kn_ = knoppen; klap();
    const bewaar = async ()=>{
      const on = sw.querySelector('input').checked;
      const uit = [...lijst.querySelectorAll('input')].filter(i=>!i.checked).map(i=>i.value);
      const r = rt.querySelector('input').checked;
      if(on && !g.aan?.[s.id]?.on) ST.uitgeklapt.add(g.id + '|' + s.id);
      klap();
      st.className = 'mini'; st.textContent = ' · bewaren…';
      try{ await F.updateDoc(F.doc(db, 'groepen', g.id), { [`aan.${s.id}`]: { on, uit, rt:r } }); g.aan = g.aan || {}; g.aan[s.id] = { on, uit, rt:r }; st.className = 'okmsg'; st.textContent = ' · bewaard'; const rb = rubBlok[s.id]; rb.sm.querySelector('.rub-tel').textContent = rubTel(rb.rb); klap(); }
      catch(e){ console.error(e); st.className = 'errmsg'; st.textContent = ' · bewaren lukte niet'; }
    };
    sw.querySelector('input').onchange = bewaar;
    lijst.querySelectorAll('input').forEach(i=>i.onchange = bewaar);
    rt.querySelector('input').onchange = bewaar;
    allesAan.onclick = ()=>{ lijst.querySelectorAll('input').forEach(i=>i.checked = true); bewaar(); };
    allesUit.onclick = ()=>{ lijst.querySelectorAll('input').forEach(i=>i.checked = false); bewaar(); };
  });
  pane.append(card);
}

/* =========================================================
   FOUT MELDEN (leerkracht) en FOUTEN (beheer)
   collectie fouten/{id}: melder, naam, site, onderdeel, waar, fout, alternatief, status, reactie, datum, bijgewerkt
   ========================================================= */
const STATUS = { nieuw:'Nieuw', bezig:'In behandeling', opgelost:'Opgelost', niet:'Niet aangepast' };
const siteVan = id => SITES.find(s=>s.id === id);
const ondNaam = (site, id) => { const o = site && site.onderdelen.find(o=>o.id === id); return o ? o.naam : id; };
const datumTxt = d => { try{ return new Date(d).toLocaleString('nl-BE', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }catch(e){ return d || ''; } };
const plaats = f => { const s = siteVan(f.site); return `${esc(s ? s.titel : f.site || 'Andere pagina')}${f.onderdeel ? ' › ' + esc(ondNaam(s, f.onderdeel)) : ''}`; };
const nieuwId = () => new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14) + '_' + Math.random().toString(36).slice(2, 7);
async function laadFouten(){
  const q = ST.rol === 'beheerder' ? F.collection(db, 'fouten') : F.query(F.collection(db, 'fouten'), F.where('melder', '==', ST.me));
  const s = await F.getDocs(q); ST.fouten = s.docs.map(d=>Object.assign({ id:d.id }, d.data())).sort((a, b)=>String(b.datum).localeCompare(String(a.datum)));
}
/* blok met de drie velden van een melding */
function foutTekst(f){
  return `<dl class="fout-dl"><dt>Waar</dt><dd>${plaats(f)}${f.waar ? '<br>' + esc(f.waar) : ''}</dd><dt>Wat is fout</dt><dd>${esc(f.fout)}</dd><dt>Gewenst alternatief</dt><dd>${esc(f.alternatief)}</dd></dl>`;
}
function viewFout(body){
  const card = el('div', 'dash-card', `<h3>Fout melden</h3><p class="mini">Zag je een fout in een module? Omschrijf waar ze staat, wat er fout is en wat het zou moeten zijn. De beheerder krijgt je melding en past de module aan.</p>`);
  const vk = ST.voorkeur || {}; ST.voorkeur = null;
  const per = {}; SITES.forEach(s=>{ (per[s.jaar] = per[s.jaar] || []).push(s); });
  const sm = el('select', '', '<option value="">Kies een module</option>' + Object.keys(per).sort().map(j=>`<optgroup label="${esc(j)}">${per[j].map(s=>`<option value="${esc(s.id)}" ${vk.site === s.id ? 'selected' : ''}>${esc(s.titel)}</option>`).join('')}</optgroup>`).join('') + `<option value="ander" ${vk.site === 'ander' ? 'selected' : ''}>Andere pagina (startpagina, dashboard, rekentoestel …)</option>`);
  const so = el('select'); sm.id = 'f-site'; so.id = 'f-ond';
  const vulOnd = ()=>{ const s = siteVan(sm.value); so.innerHTML = '<option value="">Heel de module of weet ik niet</option>' + (s ? s.onderdelen.map(o=>`<option value="${esc(o.id)}" ${vk.ond === o.id ? 'selected' : ''}>${esc(o.naam)}</option>`).join('') : ''); so.disabled = !s; };
  sm.onchange = ()=>{ vk.ond = null; vulOnd(); }; vulOnd();
  const veld = (id, lab, ph, groot)=>{ const w = el('div', 'f-veld'); const l = el('label', '', lab); l.htmlFor = id; const i = el(groot ? 'textarea' : 'input'); i.id = id; i.placeholder = ph; if(groot) i.rows = 3; else i.type = 'text'; w.append(l, i); return [w, i]; };
  const r1 = el('div', 'f-veld'); const l1 = el('label', '', 'Module en onderdeel'); l1.htmlFor = 'f-site'; const rr = el('div', 'rij'); rr.append(sm, so); r1.append(l1, rr);
  const [w2, waar] = veld('f-waar', 'Welke kaart of vraag?', 'bv. kaart 3 bij Oefenen, vraag b; of de tekst van de vraag');
  const [w3, fout] = veld('f-fout', 'Wat is er fout? *', 'Omschrijf de fout zo goed mogelijk: wat staat er, wat loopt mis?', true);
  const [w4, alt] = veld('f-alt', 'Wat zou het moeten zijn? *', 'Het gewenste alternatief: juiste antwoord, betere uitleg, andere formulering …', true);
  const r = el('div', 'rij'); const ok = el('button', 'btn', 'Melding versturen'); ok.type = 'button'; const m = el('span', 'mini'); r.append(ok, m);
  card.append(r1, w2, w3, w4, r); body.append(card);
  ok.onclick = async ()=>{
    if(!sm.value || !fout.value.trim() || !alt.value.trim()){ m.className = 'errmsg'; m.textContent = 'Kies een module en vul in wat er fout is en wat het zou moeten zijn.'; return; }
    const nu = new Date().toISOString();
    const data = { melder:ST.me, naam:lkNaam(ST.me), site:sm.value, onderdeel:so.value || '', waar:waar.value.trim(), fout:fout.value.trim(), alternatief:alt.value.trim(), status:'nieuw', reactie:'', datum:nu, bijgewerkt:nu };
    ok.disabled = true; m.className = 'mini'; m.textContent = 'Bezig met versturen…';
    try{ const id = nieuwId(); await F.setDoc(F.doc(db, 'fouten', id), data); (ST.fouten = ST.fouten || []).unshift(Object.assign({ id }, data)); ST.verstuurd = true; render(); }
    catch(e){ console.error(e); ok.disabled = false; m.className = 'errmsg'; m.textContent = 'Versturen lukte niet: ' + (e.message || e); }
  };
  if(ST.verstuurd){ ST.verstuurd = false; card.prepend(el('div', 'okmsg f-ok', 'Bedankt! Je melding is verstuurd naar de beheerder.')); }
  /* mijn meldingen */
  const mijn = el('div', 'dash-card', '<h3>Mijn meldingen</h3>'); body.append(mijn);
  const toon = ()=>{ const lijst = (ST.fouten || []).filter(f=>f.melder === ST.me);
    if(!lijst.length){ mijn.append(el('p', 'mini', 'Je hebt nog niets gemeld.')); return; }
    lijst.forEach(f=>{ const it = el('div', 'fout-item', `<div class="fout-kop"><span class="st st-${esc(f.status)}">${esc(STATUS[f.status] || f.status)}</span><span class="mini">${esc(datumTxt(f.datum))}</span></div>${foutTekst(f)}${f.reactie ? `<p class="fout-reactie"><b>Reactie van de beheerder:</b> ${esc(f.reactie)}</p>` : ''}`);
      if(f.status === 'nieuw'){ const rm = el('button', 'btn ghost klein', 'Melding intrekken'); rm.type = 'button';
        rm.onclick = async ()=>{ if(!confirm('Deze melding intrekken?')) return; try{ await F.deleteDoc(F.doc(db, 'fouten', f.id)); ST.fouten = ST.fouten.filter(x=>x !== f); render(); }catch(e){ alert('Mislukt: ' + (e.message || e)); } };
        it.append(rm); }
      mijn.append(it); }); };
  if(ST.fouten) toon(); else { const w = el('p', 'mini', 'Meldingen ophalen…'); mijn.append(w); laadFouten().then(()=>{ w.remove(); toon(); }).catch(e=>{ console.error(e); w.className = 'errmsg'; w.textContent = 'Meldingen ophalen lukte niet. Zijn de toegangsregels (firestore.rules) gepubliceerd?'; }); }
}
function foutenBeheer(body){
  const card = el('div', 'dash-card', '<h3>Fouten gemeld door leerkrachten</h3>'); body.append(card);
  if(!ST.fouten){ card.append(el('p', 'mini', 'Meldingen ophalen…')); laadFouten().then(render).catch(e=>{ console.error(e); card.append(el('p', 'errmsg', 'Meldingen ophalen lukte niet. Zijn de toegangsregels (firestore.rules) gepubliceerd?')); }); return; }
  const r = el('div', 'rij'); const fl = el('select', '', [['open', 'Nieuw en in behandeling'], ['alle', 'Alle meldingen'], ...Object.entries(STATUS)].map(([k, t])=>`<option value="${k}" ${ST.filter === k ? 'selected' : ''}>${t}</option>`).join(''));
  fl.onchange = ()=>{ ST.filter = fl.value; render(); };
  const ver = el('button', 'btn ghost klein', 'Vernieuwen'); ver.type = 'button'; ver.onclick = async ()=>{ await laadFouten(); render(); };
  const tel = Object.keys(STATUS).map(k=>`${STATUS[k]}: ${ST.fouten.filter(f=>f.status === k).length}`).join(' · ');
  r.append(el('label', '', 'Toon'), fl, ver, el('span', 'mini', tel)); card.append(r);
  const lijst = ST.fouten.filter(f=>ST.filter === 'alle' ? true : ST.filter === 'open' ? (f.status === 'nieuw' || f.status === 'bezig') : f.status === ST.filter);
  if(!lijst.length){ card.append(el('p', 'mini', ST.fouten.length ? 'Geen meldingen met deze status.' : 'Er zijn nog geen meldingen.')); return; }
  lijst.forEach(f=>{
    const s = siteVan(f.site);
    const it = el('div', 'fout-item', `<div class="fout-kop"><span class="st st-${esc(f.status)}">${esc(STATUS[f.status] || f.status)}</span><b>${esc(f.naam || f.melder)}</b><span class="mini">${esc(datumTxt(f.datum))}</span></div>${foutTekst(f)}`);
    if(s){ const a = bekijkKnop(s); a.href = moduleUrl(s, f.onderdeel); a.classList.add('fout-bekijk'); it.querySelector('.fout-kop').append(a); }
    const rr = el('div', 'rij');
    const st = el('select', '', Object.entries(STATUS).map(([k, t])=>`<option value="${k}" ${f.status === k ? 'selected' : ''}>${t}</option>`).join('')); st.setAttribute('aria-label', 'Status');
    const re = el('input'); re.type = 'text'; re.value = f.reactie || ''; re.placeholder = 'Reactie voor de leerkracht (optioneel)'; re.className = 'fout-re';
    const ok = el('button', 'btn klein', 'Bewaren'), rm = el('button', 'btn gevaar klein', 'Verwijderen'); ok.type = rm.type = 'button'; const m = el('span', 'mini');
    rr.append(st, re, ok, rm, m); it.append(rr); card.append(it);
    ok.onclick = async ()=>{ const data = { status:st.value, reactie:re.value.trim(), bijgewerkt:new Date().toISOString() }; ok.disabled = true;
      try{ await F.updateDoc(F.doc(db, 'fouten', f.id), data); Object.assign(f, data); render(); }catch(e){ ok.disabled = false; m.className = 'errmsg'; m.textContent = 'Mislukt: ' + (e.message || e); } };
    rm.onclick = async ()=>{ if(!confirm(`Melding van ${f.naam || f.melder} verwijderen?`)) return;
      try{ await F.deleteDoc(F.doc(db, 'fouten', f.id)); ST.fouten = ST.fouten.filter(x=>x !== f); render(); }catch(e){ alert('Mislukt: ' + (e.message || e)); } };
  });
}

/* =========================================================
   BEHEER
   ========================================================= */
function viewBeheer(body){
  const sub = el('div', 'tabs'); const nieuw = (ST.fouten || []).filter(f=>f.status === 'nieuw').length;
  [['beheren', 'Beheren'], ['fouten', `Fouten${nieuw ? ` <span class="cnt-badge">${nieuw}</span>` : ''}`]].forEach(([k, lab])=>{ const b = el('button', 'tab', lab); b.type = 'button'; b.setAttribute('aria-selected', String(ST.bsub === k)); b.onclick = ()=>{ ST.bsub = k; render(); }; sub.append(b); });
  body.append(sub);
  if(ST.bsub === 'fouten'){ foutenBeheer(body); return; }
  importKaart(body);
  leerkrachtenKaart(body);
  if(!ST.toeschouwer) toeschouwersKaart(body);
  groepenKaart(body);
  allesOpenKaart(body);
  zonderGroepKaart(body);
  leerlingenKaart(body);
  wisKaart(body);
}
const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s'’`-]+/g, '');
const maakMail = (fam, voor) => `${norm(fam)}.${norm(voor)}@${C.DOMEIN}`;
function kolom(row, ...namen){ const keys = Object.keys(row); for(const n of namen){ const k = keys.find(k=>k.toLowerCase().replace(/\s+/g, ' ').trim().startsWith(n)); if(k != null && row[k] !== '') return String(row[k]).trim(); } return ''; }
function leesBestand(file){
  return new Promise((res, rej)=>{ const fr = new FileReader(); fr.onerror = rej;
    fr.onload = ()=>{ try{ res(XLSX.read(new Uint8Array(fr.result), { type:'array' })); }catch(e){ rej(e); } };
    fr.readAsArrayBuffer(file); });
}
function ontleed(wb){
  const sheet = n => { const k = wb.SheetNames.find(x=>x.toLowerCase().startsWith(n)); return k ? XLSX.utils.sheet_to_json(wb.Sheets[k], { defval:'' }) : null; };
  const L = sheet('leerling') || XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:'' });
  const leerlingen = [], fouten = [];
  L.forEach((r, i)=>{
    const fam = kolom(r, 'familienaam', 'naam'), voor = kolom(r, 'voornaam'), klas = kolom(r, 'klas').toUpperCase();
    if(!fam && !voor) return;
    let mail = kolom(r, 'e-mail', 'email', 'mail').toLowerCase();
    if(!mail) mail = maakMail(fam, voor);
    let jaar = kolom(r, 'jaar') || (klas.match(/^\d/) || [''])[0];
    let stroom = kolom(r, 'stroom').toUpperCase() || (/^\dB$/.test(klas) ? 'B' : 'A');
    if(!klas || !jaar) fouten.push(`rij ${i + 2}: ${fam} ${voor} mist klas of jaar`);
    leerlingen.push({ mail, familienaam:fam, voornaam:voor, klas, jaar:String(jaar), stroom, groep:kolom(r, 'niveaugroep') });
  });
  const LK = (sheet('leerkracht') || []).map(r=>{ const fam = kolom(r, 'familienaam'), voor = kolom(r, 'voornaam');
    return { mail:(kolom(r, 'e-mail', 'email') || maakMail(fam, voor)).toLowerCase(), naam:`${voor} ${fam}`.trim(), rol:kolom(r, 'rol').toLowerCase(), groepen:(/^voorbeeld/i.test(kolom(r, 'niveaugroep')) ? '' : kolom(r, 'niveaugroep')).split(/[,;]+/).map(x=>x.trim()).filter(Boolean) }; }).filter(x=>x.naam);
  const NG = (sheet('niveaugroep') || []).map(r=>({ naam:kolom(r, 'niveaugroep', 'naam'), jaar:kolom(r, 'jaar'), stroom:kolom(r, 'stroom').toUpperCase() || 'A', soort:kolom(r, 'soort'), lk:kolom(r, 'leerkracht').split(/[,;]+/).map(x=>x.trim()).filter(Boolean) })).filter(x=>x.naam);
  /* groepen die enkel in de leerlingenlijst staan, ook aanmaken */
  leerlingen.forEach(l=>{ if(l.groep && !NG.find(x=>x.naam === l.groep)) NG.push({ naam:l.groep, jaar:l.jaar, stroom:l.stroom, soort:'', lk:[] }); });
  const dub = leerlingen.map(l=>l.mail).filter((m, i, a)=>a.indexOf(m) !== i);
  dub.forEach(m=>fouten.push(`dubbel e-mailadres: ${m}`));
  return { leerlingen, LK, NG, fouten };
}
function importKaart(body){
  const card = el('div', 'dash-card', `<h3>Leerlingenlijst opladen</h3>
    <p class="mini">Excel- of CSV-bestand met een tabblad <b>Leerlingen</b> (Jaar, Stroom, Klas, Familienaam, Voornaam, E-mail, Niveaugroep wiskunde). Optioneel de tabbladen <b>Leerkrachten</b> en <b>Niveaugroepen</b>, zoals in het voorbeeldbestand. Ontbreekt het e-mailadres, dan maak ik het als familienaam.voornaam@${C.DOMEIN}.</p>`);
  const inp = el('input'); inp.type = 'file'; inp.accept = '.xlsx,.xls,.csv';
  const out = el('div'); { const _r = el('div', 'rij'); _r.append(inp); card.append(_r); } card.append(out); body.append(card);
  inp.onchange = async ()=>{
    out.innerHTML = ''; if(!inp.files[0]) return;
    let P; try{ P = ontleed(await leesBestand(inp.files[0])); }catch(e){ console.error(e); out.append(el('p', 'errmsg', 'Dit bestand kan ik niet lezen.')); return; }
    const per = {}; P.leerlingen.forEach(l=>{ const k = `${l.jaar}${l.stroom}`; per[k] = (per[k] || 0) + 1; });
    out.append(el('p', '', `<b>${P.leerlingen.length} leerlingen</b> (${Object.entries(per).sort().map(([k, n])=>`${k}: ${n}`).join(', ')}), <b>${P.LK.length} leerkrachten</b>, <b>${P.NG.length} groepen</b>.`));
    const vb = P.leerlingen.slice(0, 5).map(l=>`<tr><td>${esc(l.familienaam)} ${esc(l.voornaam)}</td><td>${esc(l.klas)}</td><td>${esc(l.jaar)}${esc(l.stroom)}</td><td>${esc(l.mail)}</td><td>${esc(l.groep)}</td></tr>`).join('');
    const w = el('div', 'tbl-wrap', `<table class="dt"><thead><tr><th>Leerling</th><th>Klas</th><th>Jaar</th><th>E-mail</th><th>Groep</th></tr></thead><tbody>${vb}</tbody></table>`); out.append(w);
    if(P.fouten.length) out.append(el('p', 'errmsg', 'Let op: ' + P.fouten.slice(0, 8).map(esc).join(' · ') + (P.fouten.length > 8 ? ` (+${P.fouten.length - 8})` : '')));
    const opt = el('label', '', '<input type="checkbox" checked> Groepen opnieuw vullen met de leerlingen uit het bestand (kolom Niveaugroep wiskunde)');
    const vervang = el('label', '', '<input type="checkbox" checked> Leerlingen die niet in dit bestand staan, uit de lijst verwijderen');
    const ok = el('button', 'btn', 'Importeren'); ok.type = 'button'; const m = el('span');
    { const _r = el('div', 'rij'); _r.append(opt); out.append(_r); const _r2 = el('div', 'rij'); _r2.append(vervang); out.append(_r2); } const r = el('div', 'rij'); r.append(ok, m); out.append(r);
    ok.onclick = async ()=>{ ok.disabled = true; m.className = 'mini'; m.textContent = 'Bezig…';
      try{ await importeer(P, opt.querySelector('input').checked, t=>m.textContent = t);
        if(vervang.querySelector('input').checked){ const keep = new Set(P.leerlingen.map(l=>l.mail)); await wisCollectie('leerlingen', d=>!keep.has(d.id), t=>m.textContent = 'Opruimen… ' + t); } m.className = 'okmsg'; m.textContent = 'Klaar! Alles is ingelezen.'; ST.leerlingen = null; await laadAlles(); setTimeout(render, 1200); }
      catch(e){ console.error(e); m.className = 'errmsg'; m.textContent = 'Importeren lukte niet: ' + (e.message || e); ok.disabled = false; } };
  };
}
async function importeer(P, vullen, meld){
  const ops = [];
  P.leerlingen.forEach(l=>ops.push(['set', F.doc(db, 'leerlingen', l.mail), { familienaam:l.familienaam, voornaam:l.voornaam, klas:l.klas, jaar:l.jaar, stroom:l.stroom, schooljaar:C.SCHOOLJAAR }]));
  const lkMail = new Map(); P.LK.forEach(t=>{ lkMail.set(t.mail, t.mail); lkMail.set(norm(t.naam), t.mail); const [v, ...f] = t.naam.split(' '); lkMail.set(norm(f.join(' ') + v), t.mail); });
  P.LK.forEach(t=>{ ops.push(['set', F.doc(db, 'leerkrachten', t.mail), { naam:t.naam }]); if(t.rol === 'beheerder') ops.push(['set', F.doc(db, 'beheerders', t.mail), { naam:t.naam }]); });
  P.NG.forEach(g=>{
    const lk = new Set(g.lk.map(x=>lkMail.get(x.toLowerCase()) || lkMail.get(norm(x))).filter(Boolean));
    P.LK.forEach(t=>{ if(t.groepen.includes(g.naam)) lk.add(t.mail); });
    const data = { naam:g.naam, jaar:String(g.jaar), stroom:g.stroom, soort:g.soort || '' };
    if(lk.size) data.leerkrachten = F.arrayUnion(...lk);
    if(vullen) data.leerlingen = P.leerlingen.filter(l=>l.groep === g.naam).map(l=>l.mail);
    ops.push(['merge', F.doc(db, 'groepen', groepId(g.naam)), data]);
  });
  for(let i = 0; i < ops.length; i += 400){
    const b = F.writeBatch(db);
    ops.slice(i, i + 400).forEach(([t, ref, d])=>t === 'merge' ? b.set(ref, d, { merge:true }) : b.set(ref, d, { merge:true }));
    await b.commit(); meld(`Bezig… ${Math.min(i + 400, ops.length)}/${ops.length}`);
  }
  /* nieuwe groepen krijgen lege velden */
  for(const g of P.NG){ const ref = F.doc(db, 'groepen', groepId(g.naam)); const s = await F.getDoc(ref); const d = s.data() || {};
    const fix = {}; if(!d.leerkrachten) fix.leerkrachten = []; if(!d.leerlingen) fix.leerlingen = []; if(!d.aan) fix.aan = {};
    if(Object.keys(fix).length) await F.updateDoc(ref, fix); }
}
function leerkrachtenKaart(body){
  const card = el('div', 'dash-card', '<h3>Leerkrachten met toegang</h3>');
  const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Naam</th><th>E-mail</th><th>Groepen</th><th>Beheer</th><th></th></tr></thead>';
  const tb = el('tbody');
  ST.leerkrachten.forEach(l=>{ const tr = el('tr', '', `<td>${esc(l.naam)}</td><td>${esc(l.id)}</td><td>${ST.groepen.filter(g=>g.leerkrachten.includes(l.id)).map(g=>esc(g.naam)).join(', ') || '<span class="mini">nog geen</span>'}</td>`);
    const isB = ST.beheerders && ST.beheerders.has(l.id);
    const bh = el('td', 'c', `<label class="switch" title="${l.id === ST.me ? 'Je kan je eigen beheerrecht niet afnemen' : 'Beheerrecht aan of uit'}"><input type="checkbox" ${isB ? 'checked' : ''} ${l.id === ST.me ? 'disabled' : ''} aria-label="Beheer voor ${esc(l.naam || l.id)}"></label>`);
    bh.querySelector('input').onchange = async e=>{ const aan = e.target.checked;
      if(!confirm(aan ? `${l.naam} beheerrecht geven? Die kan dan leerlingenlijsten opladen, leerkrachten en groepen beheren en alles wissen.` : `Beheerrecht van ${l.naam} afnemen? Die blijft gewone leerkracht.`)){ e.target.checked = !aan; return; }
      try{ if(aan) await F.setDoc(F.doc(db, 'beheerders', l.id), { naam:l.naam || '' }); else await F.deleteDoc(F.doc(db, 'beheerders', l.id)); }
      catch(err){ alert('Mislukt: ' + (err.message || err)); }
      await laadLeerkrachten(); render(); };
    tr.append(bh);
    const td = el('td');
    const ed = el('button', 'btn ghost klein', 'Wijzigen'); ed.type = 'button'; td.append(ed, ' ');
    ed.onclick = ()=>{ const c = tr.children[0], c2 = tr.children[1]; c.innerHTML = ''; c2.innerHTML = '';
      const i = el('input'); i.type = 'text'; i.value = l.naam || ''; const m = el('input'); m.type = 'email'; m.value = l.id; m.size = 30;
      const ok = el('button', 'btn klein', 'Bewaren'); ok.type = 'button'; const msg = el('span');
      c.append(i); c2.append(m, ' ', ok, ' ', msg); i.focus();
      ok.onclick = async ()=>{ const n = i.value.trim(), mail = m.value.trim().toLowerCase();
        if(!n || !mail.endsWith('@' + C.DOMEIN)){ msg.className = 'errmsg'; msg.textContent = `Vul een naam en een @${C.DOMEIN}-adres in.`; return; }
        if(mail !== l.id && ST.leerkrachten.some(x=>x.id === mail)){ msg.className = 'errmsg'; msg.textContent = 'Dit adres bestaat al.'; return; }
        if(mail !== l.id && l.id === ST.me && !confirm('Je wijzigt je eigen e-mailadres. Daarna meld je je aan met het nieuwe adres. Doorgaan?')) return;
        ok.disabled = true; msg.className = 'mini'; msg.textContent = 'Bezig…';
        try{
          if(mail === l.id){ await F.updateDoc(F.doc(db, 'leerkrachten', l.id), { naam:n }); }
          else {
            await F.setDoc(F.doc(db, 'leerkrachten', mail), { naam:n });
            /* groepen: oud adres vervangen door het nieuwe */
            for(const g of ST.groepen.filter(g=>g.leerkrachten.includes(l.id))){
              await F.updateDoc(F.doc(db, 'groepen', g.id), { leerkrachten:g.leerkrachten.map(x=>x === l.id ? mail : x) }); }
            /* beheerder? dan ook verhuizen */
            const b = await F.getDoc(F.doc(db, 'beheerders', l.id)).catch(()=>null);
            if(b && b.exists()){ await F.setDoc(F.doc(db, 'beheerders', mail), Object.assign({}, b.data(), { naam:n })); if(l.id !== ST.me) await F.deleteDoc(F.doc(db, 'beheerders', l.id)); }
            if(l.id !== ST.me) await F.deleteDoc(F.doc(db, 'leerkrachten', l.id));
          }
          await Promise.all([laadLeerkrachten(), laadGroepen()]); render();
        }catch(e){ ok.disabled = false; msg.className = 'errmsg'; msg.textContent = 'Mislukt: ' + (e.message || e); }
      }; }; if(l.id !== ST.me){ const rm = el('button', 'btn gevaar klein', 'Toegang intrekken'); rm.type = 'button';
      rm.onclick = async ()=>{ if(!confirm(`Toegang van ${l.naam} intrekken?`)) return; await F.deleteDoc(F.doc(db, 'leerkrachten', l.id)); if(ST.beheerders && ST.beheerders.has(l.id)) await F.deleteDoc(F.doc(db, 'beheerders', l.id)); await laadLeerkrachten(); render(); }; td.append(rm); }
    tr.append(td); tb.append(tr); });
  t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); card.append(w);
  const r = el('div', 'rij'); const n = el('input'); n.type = 'text'; n.placeholder = 'Voornaam Familienaam'; const m = el('input'); m.type = 'email'; m.placeholder = `adres@${C.DOMEIN}`;
  const ok = el('button', 'btn', 'Toevoegen'); ok.type = 'button'; const msg = el('span'); r.append(n, m, ok, msg); card.append(r);
  ok.onclick = async ()=>{ const mail = m.value.trim().toLowerCase(); if(!n.value.trim() || !mail.endsWith('@' + C.DOMEIN)){ msg.className = 'errmsg'; msg.textContent = `Vul een naam en een @${C.DOMEIN}-adres in.`; return; }
    await F.setDoc(F.doc(db, 'leerkrachten', mail), { naam:n.value.trim() }); await laadLeerkrachten(); render(); };
  body.append(card);
}
/* toeschouwers (bv. de directeur): zien het platform zoals een leerkracht, maar in een oefenomgeving met een fictieve school.
   Ze staan niet bij de leerkrachten, dus collega's zien hen nergens; ze lezen en schrijven geen echte gegevens. */
async function toeschouwersKaart(body){
  const card = el('div', 'dash-card', '<h3>Toeschouwers</h3><p class="mini">Een toeschouwer (bv. de directeur) ziet het platform zoals een leerkracht en beheerder en kan alles uitproberen, maar in een <b>oefenomgeving met een fictieve school</b>. Wat hij doet, blijft in zijn eigen browser: hij staat niet bij de leerkrachten, collega\'s zien hem nergens en hij ziet geen echte leerlingen of voortgang.</p>');
  body.append(card);
  let lijst = [];
  try{ lijst = (await F.getDocs(F.collection(db, 'toeschouwers'))).docs.map(d=>Object.assign({ id:d.id }, d.data())).sort((a, b)=>(a.naam || '').localeCompare(b.naam || '')); }
  catch(e){ card.append(el('p', 'errmsg', 'Toeschouwers ophalen lukte niet. Zijn de nieuwste toegangsregels (firestore.rules) gepubliceerd?')); return; }
  if(lijst.length){
    const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Naam</th><th>E-mail</th><th></th></tr></thead>'; const tb = el('tbody');
    lijst.forEach(x=>{ const tr = el('tr', '', `<td>${esc(x.naam)}</td><td>${esc(x.id)}</td>`); const td = el('td');
      const rm = el('button', 'btn gevaar klein', 'Verwijderen'); rm.type = 'button';
      rm.onclick = async ()=>{ if(!confirm(`${x.naam || x.id} is dan geen toeschouwer meer. Doorgaan?`)) return; await F.deleteDoc(F.doc(db, 'toeschouwers', x.id)); render(); };
      td.append(rm); tr.append(td); tb.append(tr); });
    t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); card.append(w);
  } else card.append(el('p', 'mini', 'Nog geen toeschouwers.'));
  const r = el('div', 'rij'); const n = el('input'); n.type = 'text'; n.placeholder = 'Voornaam Familienaam'; const m = el('input'); m.type = 'email'; m.placeholder = `adres@${C.DOMEIN}`;
  const ok = el('button', 'btn', 'Toevoegen'); ok.type = 'button'; const msg = el('span'); r.append(n, m, ok, msg); card.append(r);
  ok.onclick = async ()=>{ const mail = m.value.trim().toLowerCase();
    if(!n.value.trim() || !mail.endsWith('@' + C.DOMEIN)){ msg.className = 'errmsg'; msg.textContent = `Vul een naam en een @${C.DOMEIN}-adres in.`; return; }
    if(ST.leerkrachten.some(x=>x.id === mail)){ msg.className = 'errmsg'; msg.textContent = 'Dit adres is een leerkracht. Trek eerst de toegang als leerkracht in (een leerkracht werkt altijd met echte gegevens).'; return; }
    ok.disabled = true;
    try{ await F.setDoc(F.doc(db, 'toeschouwers', mail), { naam:n.value.trim() }); render(); }
    catch(e){ ok.disabled = false; msg.className = 'errmsg'; msg.textContent = 'Mislukt: ' + (e.message || e); }
  };
}
function groepenKaart(body){
  const card = el('div', 'dash-card', '<h3>Niveaugroepen</h3>');
  const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Groep</th><th>Jaar</th><th>Soort</th><th>Leerkracht(en)</th><th>Leerlingen</th><th></th></tr></thead>';
  const tb = el('tbody');
  ST.groepen.forEach(g=>{ const tr = el('tr', '', `<td>${esc(g.naam)}</td><td>${esc(jaarcode(g))}</td><td>${esc(g.soort || '')}</td><td class="lk-cel"></td><td class="c"></td>`);
    const cel = tr.querySelector('.lk-cel');
    /* aantal leerlingen: klik om de namen open te klappen */
    const open = ST.open.has(g.id); const nb = el('button', 'btn ghost klein', `${g.leerlingen.length} ${open ? '▾' : '▸'}`); nb.type = 'button';
    nb.title = open ? `Namen van ${g.naam} verbergen` : `Namen van ${g.naam} tonen`; nb.setAttribute('aria-expanded', String(open)); nb.disabled = !g.leerlingen.length;
    nb.onclick = async ()=>{ if(open) ST.open.delete(g.id); else { ST.open.add(g.id); if(!ST.leerlingen){ nb.textContent = '…'; await laadLeerlingen(); } } render(); };
    tr.children[4].append(nb);
    const zet = async (veld, mail)=>{ await F.updateDoc(F.doc(db, 'groepen', g.id), { leerkrachten:F[veld](mail) }); await laadGroepen(); render(); };
    g.leerkrachten.forEach(mail=>{ const ch = el('span', 'lk-chip', esc(lkNaam(mail)));
      const x = el('button', '', '×'); x.type = 'button'; x.title = `${lkNaam(mail)} van ${g.naam} halen`; x.setAttribute('aria-label', x.title);
      x.onclick = ()=>zet('arrayRemove', mail); ch.append(x); cel.append(ch); });
    const vrij = ST.leerkrachten.filter(l=>!g.leerkrachten.includes(l.id));
    if(vrij.length){ const sel = el('select', 'lk-add', '<option value="">+ leerkracht</option>' + vrij.map(l=>`<option value="${esc(l.id)}">${esc(l.naam || l.id)}</option>`).join(''));
      sel.onchange = ()=>{ if(sel.value) zet('arrayUnion', sel.value); }; cel.append(sel); }
    const td = el('td'); const rm = el('button', 'btn gevaar klein', 'Verwijderen'); rm.type = 'button';
    rm.onclick = async ()=>{ if(!confirm(`Groep ${g.naam} verwijderen? De voortgang van de leerlingen blijft bewaard.`)) return; await F.deleteDoc(F.doc(db, 'groepen', g.id)); await laadGroepen(); render(); };
    td.append(rm); tr.append(td); tb.append(tr);
    if(open && ST.leerlingen){ const lijst = [...g.leerlingen].sort((a,b)=>naamVan(a).localeCompare(naamVan(b), 'nl'))
        .map(e=>{ const l = ST.leerlingen.get(e); return `<li>${esc(naamVan(e))}${l && l.klas ? ` <span class="mini">${esc(l.klas)}</span>` : l ? '' : ' <span class="mini">(niet in de leerlingenlijst)</span>'}</li>`; }).join('');
      const dr = el('tr', 'groep-namen', `<td colspan="6"><ol class="namen">${lijst}</ol></td>`); tb.append(dr); } });
  t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); card.append(w);
  const r = el('div', 'rij'); const n = el('input'); n.type = 'text'; n.placeholder = 'Naam, bv. 1ANg2a';
  const j = el('select', '', '<option value="1A">1A</option><option value="2A">2A</option><option value="1B">1B</option><option value="2B">2B</option>');
  const ok = el('button', 'btn', 'Groep toevoegen'); ok.type = 'button'; r.append(n, j, ok); card.append(r);
  ok.onclick = async ()=>{ const naam = n.value.trim(); if(!naam) return;
    await F.setDoc(F.doc(db, 'groepen', groepId(naam)), { naam, jaar:j.value[0], stroom:j.value[1], soort:'', leerkrachten:[], leerlingen:[], aan:{} }, { merge:true }); await laadGroepen(); render(); };
  body.append(card);
}

/* ---------- leerlingen die nog in geen enkele groep zitten ---------- */
async function zonderGroepKaart(body){
  const card = el('div', 'dash-card', '<h3>Leerlingen zonder groep</h3><p class="mini">Leerlingen uit de leerlingenlijst die nog in geen enkele groep zitten. Kies een groep om ze meteen in te delen.</p>');
  const out = el('div', '', '<p class="mini">Lijst ophalen…</p>'); card.append(out); body.append(card);
  if(!ST.leerlingen) await laadLeerlingen();
  const ingedeeld = new Set(ST.groepen.flatMap(g=>g.leerlingen));
  const alle = [...ST.leerlingen.entries()].filter(([e])=>!ingedeeld.has(e))
    .sort(([, a], [, b])=>`${a.jaar}${a.stroom} ${a.klas} ${a.familienaam} ${a.voornaam}`.localeCompare(`${b.jaar}${b.stroom} ${b.klas} ${b.familienaam} ${b.voornaam}`, 'nl'));
  out.innerHTML = '';
  if(!ST.leerlingen.size){ out.append(el('p', 'mini', 'Er is nog geen leerlingenlijst opgeladen.')); return; }
  if(!alle.length){ out.append(el('p', 'okmsg', `Alle ${ST.leerlingen.size} leerlingen zitten in een groep.`)); return; }
  const per = {}; alle.forEach(([, l])=>{ const k = `${l.jaar}${l.stroom}`; per[k] = (per[k] || 0) + 1; });
  if(ST.zgJaar && !per[ST.zgJaar]) ST.zgJaar = '';
  const r = el('div', 'rij'); const jf = el('select', '', `<option value="">Alle jaren (${alle.length})</option>` + Object.keys(per).sort().map(k=>`<option value="${k}" ${k === ST.zgJaar ? 'selected' : ''}>${k} (${per[k]})</option>`).join(''));
  jf.onchange = ()=>{ ST.zgJaar = jf.value; teken(); }; r.append(jf); out.append(r);
  const lijst = el('div'); out.append(lijst);
  const teken = ()=>{ lijst.innerHTML = ''; const toon = alle.filter(([, l])=>!ST.zgJaar || `${l.jaar}${l.stroom}` === ST.zgJaar);
    const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Leerling</th><th>Klas</th><th>Jaar</th><th>Indelen in</th></tr></thead>'; const tb = el('tbody');
    toon.forEach(([e, l])=>{ const tr = el('tr', '', `<td>${esc(l.familienaam)} ${esc(l.voornaam)}</td><td>${esc(l.klas)}</td><td>${esc(l.jaar)}${esc(l.stroom)}</td>`);
      const opties = ST.groepen.filter(g=>jaarcode(g) === `${l.jaar}${l.stroom}`);
      const td = el('td'); const s = el('select', '', '<option value="">…</option>' + opties.map(g=>`<option value="${esc(g.id)}">${esc(g.naam)}</option>`).join(''));
      s.onchange = async ()=>{ const g = opties.find(x=>x.id === s.value); if(!g) return; s.disabled = true;
        await F.updateDoc(F.doc(db, 'groepen', g.id), { leerlingen:F.arrayUnion(e) }); g.leerlingen = [...new Set([...g.leerlingen, e])]; render(); };
      if(!opties.length) td.append(el('span', 'mini', 'geen groep voor dit jaar')); else td.append(s);
      tr.append(td); tb.append(tr); });
    t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); lijst.append(w); };
  teken();
}

/* ---------- leerling opzoeken en wijzigen ---------- */
/* één site in één keer aan of uit zetten voor alle groepen van een jaar; de keuze per onderdeel en de rekentoestelknop blijven per groep bewaard */
function allesOpenKaart(body){
  const card = el('div', 'dash-card', `<h3>Site openzetten voor alle groepen van een jaar</h3><p class="mini">Zet een site in één keer aan of uit voor elke groep van het gekozen jaar. Welke onderdelen per groep verborgen zijn en of de rekentoestelknop zichtbaar is, blijft zoals het per groep ingesteld is. Leerkrachten kunnen het daarna per groep nog aanpassen bij Openzetten.</p>`);
  const jaren = [...new Set(SITES.map(s=>s.jaar))].sort();
  if(!jaren.length){ card.append(el('p', 'mini', 'Er zijn nog geen sites.')); body.append(card); return; }
  if(!jaren.includes(ST.aoJaar)) ST.aoJaar = jaren[0];
  const r = el('div', 'rij');
  const js = el('select'); js.setAttribute('aria-label', 'Jaar'); jaren.forEach(j=>{ const o = el('option', '', esc(j)); o.value = j; o.selected = j === ST.aoJaar; js.append(o); });
  const ss = el('select'); ss.setAttribute('aria-label', 'Site');
  const aan = el('button', 'btn klein', 'Aan voor alle groepen'), uit = el('button', 'btn ghost klein', 'Uit voor alle groepen'); aan.type = uit.type = 'button';
  r.append(js, ss, aan, uit); card.append(r);
  const info = el('p', 'mini'); card.append(info);
  const groepen = () => ST.groepen.filter(g=>jaarcode(g) === js.value);
  const site = () => SITES.find(s=>s.id === ss.value);
  const toon = ()=>{ const gs = groepen(), s = site(); if(!s){ info.textContent = ''; return; }
    const open = gs.filter(g=>staatOpen(g, s));
    info.innerHTML = gs.length ? `<b>${esc(s.titel)}</b> staat nu open in ${open.length} van de ${gs.length} groepen van ${esc(js.value)}${open.length && open.length < gs.length ? ` (${open.map(g=>esc(g.naam)).join(', ')})` : ''}.` : `Er zijn nog geen groepen voor ${esc(js.value)}.`;
    aan.disabled = !gs.length || open.length === gs.length; uit.disabled = !open.length; };
  const vulSites = ()=>{ ss.innerHTML = ''; ST.aoJaar = js.value;
    perRubriek(SITES.filter(s=>s.jaar === js.value)).forEach(rb=>{ const og = el('optgroup'); og.label = rb.naam;
      rb.sites.forEach(s=>{ const o = el('option', '', esc(s.titel)); o.value = s.id; o.selected = s.id === ST.aoSite; og.append(o); }); ss.append(og); });
    toon(); };
  js.onchange = vulSites; ss.onchange = ()=>{ ST.aoSite = ss.value; toon(); };
  const zet = async on=>{
    const s = site(), gs = groepen().filter(g=>staatOpen(g, s) !== on); if(!s || !gs.length) return;
    if(!confirm(`${s.titel} ${on ? 'openzetten' : 'dichtzetten'} voor ${gs.length} groep${gs.length === 1 ? '' : 'en'} van ${js.value}?`)) return;
    aan.disabled = uit.disabled = true; info.className = 'mini'; info.textContent = 'Bewaren…';
    let fout = 0;
    for(const g of gs){ const a = Object.assign({ uit:[] }, (g.aan && g.aan[s.id]) || {}, { on });
      try{ await F.updateDoc(F.doc(db, 'groepen', g.id), { [`aan.${s.id}`]: a }); g.aan = g.aan || {}; g.aan[s.id] = a; }catch(e){ console.error(e); fout++; } }
    toon(); if(fout){ info.className = 'errmsg'; info.textContent = `Bewaren lukte niet voor ${fout} groep${fout === 1 ? '' : 'en'}.`; }
    else info.insertAdjacentHTML('beforeend', ' <span class="okmsg">Bewaard.</span>');
  };
  aan.onclick = ()=>zet(true); uit.onclick = ()=>zet(false);
  vulSites(); body.append(card);
}
function leerlingenKaart(body){
  const card = el('div', 'dash-card', '<h3>Leerling opzoeken en wijzigen</h3><p class="mini">Zoek op naam, klas of e-mailadres. Wijzig je het e-mailadres, dan verhuist de leerling mee in zijn groepen.</p>');
  const r = el('div', 'rij'); const z = el('input'); z.type = 'search'; z.placeholder = 'Zoek een leerling'; r.append(z); card.append(r);
  const out = el('div'); card.append(out); body.append(card);
  const teken = async ()=>{
    if(!ST.leerlingen){ out.innerHTML = '<p class="mini">Lijst ophalen…</p>'; await laadLeerlingen(); }
    out.innerHTML = ''; const q = z.value.trim().toLowerCase(); if(q.length < 2){ out.append(el('p', 'mini', `${ST.leerlingen.size} leerlingen in de lijst. Typ minstens 2 letters.`)); return; }
    const hits = [...ST.leerlingen.entries()].filter(([e, l])=>`${l.familienaam} ${l.voornaam} ${l.klas} ${e}`.toLowerCase().includes(q)).slice(0, 40);
    if(!hits.length){ out.append(el('p', 'mini', 'Geen leerling gevonden.')); return; }
    const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Familienaam</th><th>Voornaam</th><th>Klas</th><th>Jaar</th><th>E-mail</th><th>Groep</th><th></th></tr></thead>'; const tb = el('tbody');
    hits.forEach(([e, l])=>{
      const tr = el('tr', '', `<td>${esc(l.familienaam)}</td><td>${esc(l.voornaam)}</td><td>${esc(l.klas)}</td><td>${esc(l.jaar)}${esc(l.stroom)}</td><td>${esc(e)}</td><td>${esc(ST.groepen.filter(g=>g.leerlingen.includes(e)).map(g=>g.naam).join(', ')) || '<span class="mini">geen</span>'}</td>`);
      const td = el('td'); const ed = el('button', 'btn ghost klein', 'Wijzigen'); ed.type = 'button'; td.append(ed); tr.append(td); tb.append(tr);
      ed.onclick = ()=>{
        const vals = [l.familienaam, l.voornaam, l.klas, `${l.jaar}${l.stroom}`, e];
        [...tr.children].slice(0, 5).forEach((c, i)=>{ c.innerHTML = ''; if(i === 3){ const sl = el('select', '', ['1A','2A','1B','2B'].map(x=>`<option ${x === vals[3] ? 'selected' : ''}>${x}</option>`).join('')); c.append(sl); } else { const inp = el('input'); inp.type = 'text'; inp.value = vals[i] || ''; inp.size = i === 4 ? 26 : i === 2 ? 4 : 12; c.append(inp); } });
        td.innerHTML = ''; const ok = el('button', 'btn klein', 'Bewaren'), rm = el('button', 'btn gevaar klein', 'Verwijderen'); ok.type = rm.type = 'button'; td.append(ok, ' ', rm);
        ok.onclick = async ()=>{
          const v = [...tr.querySelectorAll('input, select')].map(x=>x.value.trim());
          const nieuw = v[4].toLowerCase();
          if(!v[0] || !v[1] || !nieuw.endsWith('@' + C.DOMEIN)){ alert(`Vul familienaam, voornaam en een @${C.DOMEIN}-adres in.`); return; }
          const data = Object.assign({}, l, { familienaam:v[0], voornaam:v[1], klas:v[2].toUpperCase(), jaar:v[3][0], stroom:v[3][1] });
          ok.disabled = true;
          await F.setDoc(F.doc(db, 'leerlingen', nieuw), data);
          if(nieuw !== e){
            await F.deleteDoc(F.doc(db, 'leerlingen', e));
            for(const g of ST.groepen.filter(g=>g.leerlingen.includes(e))){ await F.updateDoc(F.doc(db, 'groepen', g.id), { leerlingen:F.arrayRemove(e) }); await F.updateDoc(F.doc(db, 'groepen', g.id), { leerlingen:F.arrayUnion(nieuw) }); g.leerlingen = g.leerlingen.map(x=>x === e ? nieuw : x); }
            ST.leerlingen.delete(e);
          }
          ST.leerlingen.set(nieuw, data); teken();
        };
        rm.onclick = async ()=>{ if(!confirm(`${l.voornaam} ${l.familienaam} uit de lijst en uit alle groepen verwijderen? De voortgang blijft bewaard.`)) return;
          for(const g of ST.groepen.filter(g=>g.leerlingen.includes(e))){ await F.updateDoc(F.doc(db, 'groepen', g.id), { leerlingen:F.arrayRemove(e) }); g.leerlingen = g.leerlingen.filter(x=>x !== e); }
          await F.deleteDoc(F.doc(db, 'leerlingen', e)); ST.leerlingen.delete(e); teken(); };
      };
    });
    t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); out.append(w);
  };
  let tm = 0; z.oninput = ()=>{ clearTimeout(tm); tm = setTimeout(teken, 250); }; teken();
  /* nieuwe leerling */
  card.append(el('h4', '', 'Nieuwe leerling toevoegen'));
  const r2 = el('div', 'rij'); const f = ['Familienaam', 'Voornaam', 'Klas', 'E-mail (leeg: familienaam.voornaam)'].map(ph=>{ const i = el('input'); i.type = ph[0] === 'E' ? 'email' : 'text'; i.placeholder = ph; i.size = ph === 'Klas' ? 5 : ph[0] === 'E' ? 28 : 14; return i; });
  const ok = el('button', 'btn', 'Toevoegen'); ok.type = 'button'; const m = el('span', 'mini'); r2.append(...f, ok, m); card.append(r2);
  ok.onclick = async ()=>{ const [fam, voor, klas, adres] = f.map(i=>i.value.trim()); if(!fam || !voor || !/^[12][A-Z]$/i.test(klas)){ m.className = 'errmsg'; m.textContent = 'Vul familienaam, voornaam en een klas (bv. 1E) in.'; return; }
    if(adres && !adres.toLowerCase().endsWith('@' + C.DOMEIN)){ m.className = 'errmsg'; m.textContent = `Het e-mailadres moet eindigen op @${C.DOMEIN}.`; return; }
    const K = klas.toUpperCase(), mail = adres ? adres.toLowerCase() : maakMail(fam, voor);
    await F.setDoc(F.doc(db, 'leerlingen', mail), { familienaam:fam, voornaam:voor, klas:K, jaar:K[0], stroom:K[1] === 'B' ? 'B' : 'A', schooljaar:C.SCHOOLJAAR });
    if(ST.leerlingen) ST.leerlingen.set(mail, { familienaam:fam, voornaam:voor, klas:K, jaar:K[0], stroom:K[1] === 'B' ? 'B' : 'A' });
    m.className = 'okmsg'; m.textContent = `Toegevoegd als ${mail}. Een leerkracht kan hem nu in een groep zetten.`; f.forEach(i=>i.value = ''); };
}

/* ---------- opnieuw beginnen ---------- */
async function wisCollectie(naam, filter, meld){
  const docs = (await F.getDocs(F.collection(db, naam))).docs.filter(d=>!filter || filter(d));
  for(let i = 0; i < docs.length; i += 400){ const b = F.writeBatch(db); docs.slice(i, i + 400).forEach(d=>b.delete(d.ref)); await b.commit(); meld(`${naam}: ${Math.min(i + 400, docs.length)}/${docs.length}`); }
  return docs.length;
}
function wisKaart(body){
  const card = el('div', 'dash-card', `<h3>Opnieuw beginnen</h3>
    <p class="mini">Gebruik dit om een testlijst weg te halen of bij de start van een nieuw schooljaar. Leerkrachten en hun toegang blijven altijd bewaard.</p>`);
  const opts = [
    ['lln', true, 'Leerlingenlijst wissen en alle groepen leegmaken (de groepen zelf, hun leerkrachten en wat openstaat blijven)'],
    ['grp', false, 'Ook alle niveaugroepen verwijderen'],
    ['vg', false, 'Ook alle voortgang van leerlingen wissen (antwoorden en werktijd)']];
  opts.forEach(([k, on, t])=>{ const l = el('label', '', `<input type="checkbox" data-k="${k}" ${on ? 'checked' : ''}> ${t}`); const r = el('div', 'rij'); r.append(l); card.append(r); });
  const r = el('div', 'rij', '<label for="bevestig">Typ <b>WISSEN</b> om te bevestigen</label>');
  const bev = el('input'); bev.type = 'text'; bev.id = 'bevestig'; bev.autocomplete = 'off';
  const ok = el('button', 'btn gevaar', 'Wissen'); ok.type = 'button'; const m = el('span', 'mini');
  r.append(bev, ok, m); card.append(r); body.append(card);
  ok.onclick = async ()=>{
    if(bev.value.trim().toUpperCase() !== 'WISSEN'){ m.className = 'errmsg'; m.textContent = 'Typ eerst WISSEN.'; return; }
    const k = x => card.querySelector(`input[data-k="${x}"]`).checked;
    ok.disabled = true; m.className = 'mini'; const meld = t=>m.textContent = 'Bezig… ' + t;
    try{
      if(k('vg')) await wisCollectie('voortgang', null, meld);
      if(k('grp')) await wisCollectie('groepen', null, meld);
      else if(k('lln')){ for(const g of ST.groepen){ if(g.leerlingen.length) await F.updateDoc(F.doc(db, 'groepen', g.id), { leerlingen:[] }); } }
      if(k('lln')) await wisCollectie('leerlingen', null, meld);
      ST.leerlingen = null; await laadAlles(); m.className = 'okmsg'; m.textContent = 'Gewist. Je kan nu een nieuwe lijst opladen.'; setTimeout(render, 1500);
    }catch(e){ console.error(e); m.className = 'errmsg'; m.textContent = 'Wissen lukte niet: ' + (e.message || e); ok.disabled = false; }
  };
}

/* ---------- start ---------- */
async function laadAlles(){ await Promise.all([laadGroepen(), laadLeerkrachten()]); if(ST.rol === 'beheerder') await laadFouten().catch(e=>console.error(e)); }
const s = await klaar;
ST.me = s.email; ST.rol = s.rol; ST.toeschouwer = s.toeschouwer;
if(s.rol === 'leerling'){
  root.append(el('div', 'tip', '<div><b>Dit dashboard is enkel voor leerkrachten.</b> Ga naar de <a href="../">oefeningen</a>.</div>'));
} else {
  /* snelkoppeling "Fout melden" vanuit een module: ?melden=<site-id>&ond=<onderdeel-id> */
  const u = new URLSearchParams(location.search);
  if(u.has('melden')){ ST.view = 'fout'; ST.voorkeur = { site:u.get('melden'), ond:u.get('ond') }; history.replaceState(null, '', location.pathname); }
  try{ await laadAlles(); if(ST.rol === 'beheerder' && !ST.groepen.length && ST.view !== 'fout') ST.view = 'beheer'; render(); }
  catch(e){ console.error(e); root.append(el('p', 'errmsg', 'Gegevens ophalen lukte niet. Zijn de toegangsregels (firestore.rules) gepubliceerd?')); }
}
