/* Dashboard voor leerkrachten en beheerders. */
import { klaar, db, F, C } from '../gedeeld/aanmelden.js';
import { SITES } from '../gedeeld/sites.js';

const $ = (s, r=document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const root = $('#dash'); root.classList.add('dash');
const ST = { me:null, rol:null, view:'groepen', groepen:[], leerkrachten:[], leerlingen:null, sel:null, sub:'voortgang', site:null, alle:false };
const jaarcode = g => `${g.jaar}${g.stroom}`;
const sitesVoor = g => SITES.filter(s=>s.jaar === jaarcode(g));
const naamVan = e => { const l = ST.leerlingen && ST.leerlingen.get(e); return l ? `${l.familienaam} ${l.voornaam}` : e; };
const lkNaam = e => { const l = ST.leerkrachten.find(x=>x.id === e); return l ? l.naam : e; };
const groepId = naam => naam.trim().replace(/[\/\s]+/g, '-');

/* ---------- gegevens ---------- */
async function laadGroepen(){ const s = await F.getDocs(F.collection(db, 'groepen')); ST.groepen = s.docs.map(d=>Object.assign({ id:d.id, leerkrachten:[], leerlingen:[], aan:{} }, d.data())).sort((a,b)=>(jaarcode(a)+a.naam).localeCompare(jaarcode(b)+b.naam, 'nl', { numeric:true })); }
async function laadLeerkrachten(){ const s = await F.getDocs(F.collection(db, 'leerkrachten')); ST.leerkrachten = s.docs.map(d=>Object.assign({ id:d.id }, d.data())).sort((a,b)=>(a.naam||'').localeCompare(b.naam||'')); }
async function laadLeerlingen(){ const s = await F.getDocs(F.collection(db, 'leerlingen')); ST.leerlingen = new Map(s.docs.map(d=>[d.id, d.data()])); }
async function updGroep(g, data){ await F.updateDoc(F.doc(db, 'groepen', g.id), data); Object.entries(data).forEach(([k, v])=>{ if(!k.includes('.')) g[k] = v; }); }

/* ---------- bovenbalk ---------- */
function render(){
  root.innerHTML = '';
  const top = el('div', 'dash-top');
  const tabs = el('div', 'tabs'); tabs.setAttribute('role', 'tablist');
  const items = [['groepen', 'Mijn groepen']]; if(ST.rol === 'beheerder') items.push(['beheer', 'Beheer']);
  items.forEach(([k, lab])=>{ const b = el('button', 'tab', lab); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(ST.view === k)); b.onclick = ()=>{ ST.view = k; render(); }; tabs.append(b); });
  top.append(tabs); root.append(top);
  const body = el('div'); root.append(body);
  (ST.view === 'beheer' ? viewBeheer : viewGroepen)(body);
}

/* =========================================================
   MIJN GROEPEN
   ========================================================= */
function viewGroepen(body){
  const mijn = ST.groepen.filter(g=>g.leerkrachten.includes(ST.me));
  const toon = ST.alle ? ST.groepen : mijn;
  const kop = el('div', 'rij');
  const kies = el('button', 'btn ghost', 'Mijn groepen kiezen'); kies.type = 'button'; kies.onclick = ()=>kiesGroepen(body);
  const alle = el('label', 'switch', `<input type="checkbox" ${ST.alle ? 'checked' : ''}> Vervanging collega: toon alle groepen`);
  alle.querySelector('input').onchange = e=>{ ST.alle = e.target.checked; if(ST.sel && !ST.alle && !mijn.includes(ST.sel)) ST.sel = null; render(); };
  kop.append(kies, alle); body.append(kop);
  if(!toon.length){ body.append(el('div', 'tip', '<div>Je hebt nog geen groepen. Klik op <b>Mijn groepen kiezen</b> en duid je niveaugroepen aan.</div>')); return; }
  const chips = el('div', 'chips');
  toon.forEach(g=>{ const b = el('button', 'chip-btn', `${esc(g.naam)}<span class="cnt">${g.leerlingen.length}</span>`); b.type = 'button'; b.setAttribute('aria-pressed', String(ST.sel === g)); b.onclick = ()=>{ ST.sel = g; ST.site = null; render(); }; chips.append(b); });
  body.append(chips);
  if(!ST.sel || !toon.includes(ST.sel)) ST.sel = toon[0];
  const g = ST.sel;
  if(!g.leerkrachten.includes(ST.me)) body.append(el('div', 'vervang', `Je bekijkt de groep ${esc(g.naam)} van ${esc(g.leerkrachten.map(lkNaam).join(', ') || 'niemand')} (vervanging).`));
  const sub = el('div', 'tabs');
  [['voortgang', 'Voortgang'], ['leerlingen', 'Leerlingen'], ['aanuit', 'Openzetten']].forEach(([k, lab])=>{ const b = el('button', 'tab', lab); b.type = 'button'; b.setAttribute('aria-selected', String(ST.sub === k)); b.onclick = ()=>{ ST.sub = k; render(); }; sub.append(b); });
  body.append(sub);
  const pane = el('div'); body.append(pane);
  ({ voortgang:paneVoortgang, leerlingen:paneLeerlingen, aanuit:paneAanUit })[ST.sub](pane, g);
}

function kiesGroepen(body){
  body.innerHTML = '';
  const card = el('div', 'dash-card', '<h3>Mijn groepen kiezen</h3><p class="mini">Duid de groepen aan waarvan jij de leerkracht bent. Je kan dit later altijd aanpassen.</p>');
  const per = {};
  ST.groepen.forEach(g=>{ (per[jaarcode(g)] = per[jaarcode(g)] || []).push(g); });
  Object.keys(per).sort().forEach(j=>{
    card.append(el('h4', '', j));
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
  if(!d) return { per, totaal:0, toets:{} };
  let res = {}, toets = {};
  try{ res = JSON.parse((d.data || {})._res || '{}'); }catch(e){}
  try{ toets = JSON.parse((d.data || {})._toets || '{}'); }catch(e){}
  Object.entries(res).forEach(([id, ok])=>{ const o = sectieVan(site, id); if(o) per[o.id][ok ? 'juist' : 'fout']++; });
  let totaal = 0; Object.entries(d.tijd || {}).forEach(([k, s])=>{ totaal += s; if(per[k]) per[k].tijd = s; });
  const tScore = {}; Object.entries(toets).forEach(([key, t])=>{ const o = site.onderdelen.find(x=>key.startsWith(x.id + '_')); if(o) tScore[o.id] = t; });
  return { per, totaal, toets:tScore, bijgewerkt:d.bijgewerkt };
}
async function paneVoortgang(pane, g){
  const sites = sitesVoor(g);
  if(!sites.length){ pane.append(el('p', 'mini', `Er zijn nog geen sites voor ${jaarcode(g)}.`)); return; }
  if(!ST.site || !sites.includes(ST.site)) ST.site = sites[0];
  const r = el('div', 'rij', '<label for="siteSel">Site</label>');
  const sel = el('select'); sel.id = 'siteSel';
  sites.forEach(s=>{ const o = el('option', '', esc(s.titel)); o.value = s.id; o.selected = s === ST.site; sel.append(o); });
  sel.onchange = ()=>{ ST.site = sites.find(s=>s.id === sel.value); render(); };
  const vern = el('button', 'btn ghost klein', '↻ Vernieuwen'); vern.type = 'button'; vern.onclick = render;
  r.append(sel, vern); pane.append(r);
  if(!g.leerlingen.length){ pane.append(el('p', 'mini', 'Deze groep heeft nog geen leerlingen. Voeg ze toe bij het tabblad Leerlingen.')); return; }
  if(!ST.leerlingen) await laadLeerlingen().catch(()=>{});
  const wacht = el('p', 'mini', 'Voortgang ophalen…'); pane.append(wacht);
  const site = ST.site; let data;
  try{ data = await haalVoortgang(site, g.leerlingen); }catch(e){ console.error(e); wacht.className = 'errmsg'; wacht.textContent = 'Ophalen lukte niet.'; return; }
  wacht.remove();
  const ond = site.onderdelen;
  const wrap = el('div', 'tbl-wrap'); const t = el('table', 'dt');
  t.innerHTML = `<thead><tr><th>Leerling</th><th>Werktijd</th>${ond.map(o=>`<th class="rot" title="${esc(o.naam)}">${esc(o.naam)}</th>`).join('')}</tr></thead>`;
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
      const td = el('td', 'sc ' + cls, (txt || '·') + (p.tijd ? `<small>${minuten(p.tijd)}</small>` : ''));
      td.title = `${o.naam}: ${p.juist} juist, ${p.fout} fout${o.vragen ? ` (van ${o.vragen} vragen)` : ''}, ${minuten(p.tijd)}`;
      tr.append(td);
    });
    tb.append(tr);
  });
  t.append(tb); wrap.append(t); pane.append(wrap);
  pane.append(el('div', 'legend-s', '<b>Cel:</b> aantal vragen juist / aantal vragen, met werktijd · <span class="l1">weinig</span><span class="l2">bezig</span><span class="l3">goed op weg</span><span class="l4">(bijna) alles juist</span> · proeftoets: score'));
}
function detail(pane, site, e, v){
  const old = pane.querySelector('.detail'); if(old) old.remove();
  const d = el('div', 'detail', `<h3>${esc(naamVan(e))} · ${esc(site.kort)}</h3><p class="mini">${esc(e)} · totale werktijd ${minuten(v.totaal)}${v.bijgewerkt && v.bijgewerkt.toDate ? ' · laatst actief ' + v.bijgewerkt.toDate().toLocaleString('nl-BE') : ''}</p>`);
  const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Onderdeel</th><th>Juist</th><th>Fout</th><th>Niet gemaakt</th><th>Werktijd</th></tr></thead>';
  const tb = el('tbody');
  site.onderdelen.forEach(o=>{ const p = v.per[o.id], tt = v.toets[o.id];
    tb.append(el('tr', '', o.toets ? `<td>${esc(o.naam)}</td><td colspan="3">${tt ? `score ${tt.score}/${tt.n} op ${new Date(tt.datum).toLocaleDateString('nl-BE')}` : 'nog niet gemaakt'}</td><td>${minuten(p.tijd)}</td>`
      : `<td>${esc(o.naam)}</td><td class="c">${p.juist}</td><td class="c">${p.fout}</td><td class="c">${o.vragen ? Math.max(0, o.vragen - p.juist - p.fout) : '–'}</td><td>${minuten(p.tijd)}</td>`)); });
  t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); d.append(w);
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
  const card = el('div', 'dash-card', `<h3>Wat staat open voor ${esc(g.naam)}?</h3><p class="mini">Een module die uit staat, zien de leerlingen niet. Staat een module open, dan kan je per onderdeel kiezen of het zichtbaar is. Wijzigingen worden meteen bewaard.</p>`);
  const sites = sitesVoor(g);
  if(!sites.length) card.append(el('p', 'mini', `Er zijn nog geen sites voor ${jaarcode(g)}.`));
  sites.forEach(s=>{
    const a = (g.aan && g.aan[s.id]) || { on:false, uit:[] };
    const blok = el('div', 'site-blok');
    const sw = el('label', 'switch', `<input type="checkbox" ${a.on ? 'checked' : ''}> ${esc(s.titel)}`);
    const st = el('span', 'mini'); sw.append(st);
    blok.append(sw);
    const lijst = el('div', 'onderdelen'); lijst.hidden = !a.on;
    s.onderdelen.forEach(o=>{ const l = el('label', '', `<input type="checkbox" value="${esc(o.id)}" ${(a.uit || []).includes(o.id) ? '' : 'checked'}> ${esc(o.naam)}`); lijst.append(l); });
    const knoppen = el('div', 'rij'); knoppen.style.marginLeft = '3.1rem'; knoppen.hidden = !a.on;
    const allesAan = el('button', 'btn ghost klein', 'Alle onderdelen aan'), allesUit = el('button', 'btn ghost klein', 'Alle onderdelen uit');
    allesAan.type = allesUit.type = 'button'; knoppen.append(allesAan, allesUit);
    blok.append(lijst, knoppen); card.append(blok);
    const bewaar = async ()=>{
      const on = sw.querySelector('input').checked;
      const uit = [...lijst.querySelectorAll('input')].filter(i=>!i.checked).map(i=>i.value);
      lijst.hidden = knoppen.hidden = !on;
      st.className = 'mini'; st.textContent = ' · bewaren…';
      try{ await F.updateDoc(F.doc(db, 'groepen', g.id), { [`aan.${s.id}`]: { on, uit } }); g.aan = g.aan || {}; g.aan[s.id] = { on, uit }; st.className = 'okmsg'; st.textContent = ' · bewaard'; }
      catch(e){ console.error(e); st.className = 'errmsg'; st.textContent = ' · bewaren lukte niet'; }
    };
    sw.querySelector('input').onchange = bewaar;
    lijst.querySelectorAll('input').forEach(i=>i.onchange = bewaar);
    allesAan.onclick = ()=>{ lijst.querySelectorAll('input').forEach(i=>i.checked = true); bewaar(); };
    allesUit.onclick = ()=>{ lijst.querySelectorAll('input').forEach(i=>i.checked = false); bewaar(); };
  });
  pane.append(card);
}

/* =========================================================
   BEHEER
   ========================================================= */
function viewBeheer(body){
  importKaart(body);
  leerkrachtenKaart(body);
  groepenKaart(body);
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
        if(vervang.querySelector('input').checked){ const keep = new Set(P.leerlingen.map(l=>l.mail)); await wisCollectie('leerlingen', d=>!keep.has(d.id), t=>m.textContent = 'Opruimen… ' + t); } m.className = 'okmsg'; m.textContent = 'Klaar! Alles is ingelezen.'; await laadAlles(); setTimeout(render, 1200); }
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
  const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Naam</th><th>E-mail</th><th>Groepen</th><th></th></tr></thead>';
  const tb = el('tbody');
  ST.leerkrachten.forEach(l=>{ const tr = el('tr', '', `<td>${esc(l.naam)}</td><td>${esc(l.id)}</td><td>${ST.groepen.filter(g=>g.leerkrachten.includes(l.id)).map(g=>esc(g.naam)).join(', ') || '<span class="mini">nog geen</span>'}</td>`);
    const td = el('td'); if(l.id !== ST.me){ const rm = el('button', 'btn gevaar klein', 'Toegang intrekken'); rm.type = 'button';
      rm.onclick = async ()=>{ if(!confirm(`Toegang van ${l.naam} intrekken?`)) return; await F.deleteDoc(F.doc(db, 'leerkrachten', l.id)); await laadLeerkrachten(); render(); }; td.append(rm); }
    tr.append(td); tb.append(tr); });
  t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); card.append(w);
  const r = el('div', 'rij'); const n = el('input'); n.type = 'text'; n.placeholder = 'Voornaam Familienaam'; const m = el('input'); m.type = 'email'; m.placeholder = `adres@${C.DOMEIN}`;
  const ok = el('button', 'btn', 'Toevoegen'); ok.type = 'button'; const msg = el('span'); r.append(n, m, ok, msg); card.append(r);
  ok.onclick = async ()=>{ const mail = m.value.trim().toLowerCase(); if(!n.value.trim() || !mail.endsWith('@' + C.DOMEIN)){ msg.className = 'errmsg'; msg.textContent = `Vul een naam en een @${C.DOMEIN}-adres in.`; return; }
    await F.setDoc(F.doc(db, 'leerkrachten', mail), { naam:n.value.trim() }); await laadLeerkrachten(); render(); };
  body.append(card);
}
function groepenKaart(body){
  const card = el('div', 'dash-card', '<h3>Niveaugroepen</h3>');
  const t = el('table', 'dt'); t.innerHTML = '<thead><tr><th>Groep</th><th>Jaar</th><th>Soort</th><th>Leerkracht(en)</th><th>Leerlingen</th><th></th></tr></thead>';
  const tb = el('tbody');
  ST.groepen.forEach(g=>{ const tr = el('tr', '', `<td>${esc(g.naam)}</td><td>${esc(jaarcode(g))}</td><td>${esc(g.soort || '')}</td><td>${g.leerkrachten.map(lkNaam).map(esc).join(', ') || '<span class="mini">nog niemand</span>'}</td><td class="c">${g.leerlingen.length}</td>`);
    const td = el('td'); const rm = el('button', 'btn gevaar klein', 'Verwijderen'); rm.type = 'button';
    rm.onclick = async ()=>{ if(!confirm(`Groep ${g.naam} verwijderen? De voortgang van de leerlingen blijft bewaard.`)) return; await F.deleteDoc(F.doc(db, 'groepen', g.id)); await laadGroepen(); render(); };
    td.append(rm); tr.append(td); tb.append(tr); });
  t.append(tb); const w = el('div', 'tbl-wrap'); w.append(t); card.append(w);
  const r = el('div', 'rij'); const n = el('input'); n.type = 'text'; n.placeholder = 'Naam, bv. 1ANg2a';
  const j = el('select', '', '<option value="1A">1A</option><option value="2A">2A</option><option value="1B">1B</option><option value="2B">2B</option>');
  const ok = el('button', 'btn', 'Groep toevoegen'); ok.type = 'button'; r.append(n, j, ok); card.append(r);
  ok.onclick = async ()=>{ const naam = n.value.trim(); if(!naam) return;
    await F.setDoc(F.doc(db, 'groepen', groepId(naam)), { naam, jaar:j.value[0], stroom:j.value[1], soort:'', leerkrachten:[], leerlingen:[], aan:{} }, { merge:true }); await laadGroepen(); render(); };
  body.append(card);
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
async function laadAlles(){ await Promise.all([laadGroepen(), laadLeerkrachten()]); }
const s = await klaar;
ST.me = s.email; ST.rol = s.rol;
if(s.rol === 'leerling'){
  root.append(el('div', 'tip', '<div><b>Dit dashboard is enkel voor leerkrachten.</b> Ga naar de <a href="../">oefeningen</a>.</div>'));
} else {
  try{ await laadAlles(); if(ST.rol === 'beheerder' && !ST.groepen.length) ST.view = 'beheer'; render(); }
  catch(e){ console.error(e); root.append(el('p', 'errmsg', 'Gegevens ophalen lukte niet. Zijn de toegangsregels (firestore.rules) gepubliceerd?')); }
}
