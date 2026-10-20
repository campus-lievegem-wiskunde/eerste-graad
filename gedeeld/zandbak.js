/* Oefenomgeving voor een toeschouwer (bv. de directeur).
   Dezelfde functies als firebase-firestore die het platform gebruikt, maar alles staat in localStorage van deze browser
   (sleutel cl_zandbak_<e-mail>). Niets gaat naar de echte database; collega's zien er niets van.
   Bij het eerste gebruik wordt een fictieve oefenschool aangemaakt: groepen, leerlingen, collega's, voortgang en meldingen. */
import { SITES } from './sites.js';
import { SCHOOLJAAR } from './firebase-config.js';

const rawSet = Storage.prototype.setItem, rawGet = Storage.prototype.getItem, rawRemove = Storage.prototype.removeItem;
const DEL = { __del:1 }, TS = '__ts';
let SLEUTEL = 'cl_zandbak';
const kopie = o => JSON.parse(JSON.stringify(o));
function store(){ try{ return JSON.parse(rawGet.call(localStorage, SLEUTEL) || '{}') || {}; }catch(e){ return {}; } }
function save(d){ try{ rawSet.call(localStorage, SLEUTEL, JSON.stringify(d)); }catch(e){ console.warn('Oefenomgeving bewaren lukte niet', e); } }
/* tijdstempels worden als { __ts: iso } bewaard en komen terug met toDate(), zoals bij Firestore */
const tijdstempel = iso => ({ toDate:()=>new Date(iso), toMillis:()=>Date.parse(iso), toJSON:()=>({ [TS]:iso }) });
function revive(v){
  if(Array.isArray(v)) return v.map(revive);
  if(v && typeof v === 'object'){ if(TS in v) return tijdstempel(v[TS]); const o = {}; for(const [k, x] of Object.entries(v)) o[k] = revive(x); return o; }
  return v;
}
const isSpeciaal = v => v && typeof v === 'object' && (v.__del || v.__au || v.__ar || v.__srv);
function waarde(v, oud){
  if(v && v.__srv) return { [TS]:new Date().toISOString() };
  if(v && v.__au) return [...new Set([...(Array.isArray(oud) ? oud : []), ...v.__au])];
  if(v && v.__ar) return (Array.isArray(oud) ? oud : []).filter(x=>!v.__ar.includes(x));
  return kopie(v);
}
/* veld met puntnotatie (aan.m1) zetten of wissen */
function zetPad(d, pad, v){
  const delen = pad.split('.'); let o = d;
  for(let i = 0; i < delen.length - 1; i++){ if(!o[delen[i]] || typeof o[delen[i]] !== 'object') o[delen[i]] = {}; o = o[delen[i]]; }
  const k = delen[delen.length - 1];
  if(v && v.__del) delete o[k]; else o[k] = waarde(v, o[k]);
}
/* setDoc met merge: objecten worden samengevoegd, zoals in Firestore */
function voegSamen(d, p){
  for(const [k, v] of Object.entries(p)){
    if(v && typeof v === 'object' && !Array.isArray(v) && !isSpeciaal(v) && d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) voegSamen(d[k], v);
    else if(v && v.__del) delete d[k];
    else d[k] = waarde(v, d[k]);
  }
}

export function getFirestore(){ return { zandbak:true }; }
export function doc(db, col, id){ return { path:col + '/' + id, id }; }
export function collection(db, col){ return { col }; }
export function where(f, op, v){ return { f, op, v }; }
export function query(c, ...w){ return { col:c.col, w }; }
export function deleteField(){ return DEL; }
export const arrayUnion = (...v)=>({ __au:v }), arrayRemove = (...v)=>({ __ar:v });
export function serverTimestamp(){ return { __srv:1 }; }
const snap = (id, path, d) => ({ id, ref:{ path, id }, exists:()=>d !== undefined, data:()=>d === undefined ? undefined : revive(d) });
export async function getDoc(r){ return snap(r.id, r.path, store()[r.path]); }
export async function getDocs(q){
  const out = [];
  for(const [p, d] of Object.entries(store())){
    const i = p.indexOf('/'); if(p.slice(0, i) !== q.col) continue;
    const ok = (q.w || []).every(w=>w.op === '==' ? d[w.f] === w.v : w.op === 'in' ? w.v.includes(d[w.f]) : w.op === 'array-contains' ? (d[w.f] || []).includes(w.v) : true);
    if(ok) out.push(snap(p.slice(i + 1), p, d));
  }
  return { docs:out, size:out.length, empty:!out.length, forEach:f=>out.forEach(f) };
}
export async function setDoc(r, p, o){ const all = store(); const d = (o && o.merge) ? (all[r.path] || {}) : {}; voegSamen(d, p); all[r.path] = d; save(all); }
export async function updateDoc(r, p){ const all = store(); const d = all[r.path]; if(!d) throw new Error('Document bestaat niet: ' + r.path); for(const [k, v] of Object.entries(p)) zetPad(d, k, v); save(all); }
export async function addDoc(c, p){ const id = Math.random().toString(36).slice(2, 12); await setDoc({ path:c.col + '/' + id, id }, p); return { id, path:c.col + '/' + id }; }
export async function deleteDoc(r){ const all = store(); delete all[r.path]; save(all); }
export function writeBatch(){ const ops = []; return {
  set(r, d, o){ ops.push(()=>setDoc(r, d, o)); }, update(r, d){ ops.push(()=>updateDoc(r, d)); }, delete(r){ ops.push(()=>deleteDoc(r)); },
  async commit(){ for(const f of ops) await f(); } }; }

/* ---------- de oefenschool ---------- */
export const DOMEIN_VB = 'voorbeeld.svsl.be';   /* fictieve adressen: bestaan niet echt */
function rng(zaad){ let s = zaad >>> 0; return ()=>{ s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s'’`-]+/g, '');
const VOORNAMEN = ['Amber','Arne','Bo','Cas','Delfien','Elias','Fien','Finn','Hanne','Ilias','Jana','Jens','Kato','Lars','Lena','Lowie','Mila','Milan','Nore','Olivier','Paulien','Robbe','Saar','Seppe','Tess','Thibo','Ulla','Vic','Wout','Yara','Zoë','Lotte','Noah','Emma','Matteo','Lien'];
const FAMNAMEN = ['Aerts','Baert','Claeys','De Bruyne','De Clercq','De Wilde','Dhondt','Goethals','Hermans','Lambrecht','Martens','Mertens','Pauwels','Raes','Segers','Smet','Steenhaut','Van Acker','Van Damme','Vandekerckhove','Verhaeghe','Verstraete','Willems','Wyns'];
const COLLEGAS = [['Anouk', 'Proefmans'], ['Bert', 'Oefenaere'], ['Charlotte', 'Testelin'], ['Dries', 'Voorbeelde'], ['Evi', 'Schetsbergen'], ['Frederik', 'Probeers']];
const GROEPEN = jaar => [
  [`${jaar}B`, 'B', 'klas B-stroom'], [`${jaar}C`, 'A', 'klasgroep'], [`${jaar}D`, 'A', 'klasgroep'],
  ...['g1', 'g2a', 'g2b', 'g2c', 'g2d', 'g2e', 'g3'].map(x=>[`${jaar}AN${x}`, 'A', 'niveaugroep'])];

function oefenschool(email, naam){
  const R = rng(20262027), kies = a => a[Math.floor(R() * a.length)];
  const nu = Date.now(), iso = ms => ({ [TS]:new Date(ms).toISOString() });
  const d = {};
  d['beheerders/' + email] = { naam };
  d['leerkrachten/' + email] = { naam };
  const lk = COLLEGAS.map(([v, f])=>{ const m = `${norm(f)}.${norm(v)}@${DOMEIN_VB}`; d['leerkrachten/' + m] = { naam:`${v} ${f}` }; return m; });
  const gebruikt = new Set();
  let n = 0;
  ['1', '2'].forEach(jaar=>{
    GROEPEN(jaar).forEach(([gnaam, stroom, soort], gi)=>{
      const leerlingen = [];
      const aantal = 5 + Math.floor(R() * 4);
      for(let i = 0; i < aantal; i++){
        let v, f, m; do { v = kies(VOORNAMEN); f = kies(FAMNAMEN); m = `${norm(f)}.${norm(v)}@${DOMEIN_VB}`; } while(gebruikt.has(m));
        gebruikt.add(m);
        const klas = soort === 'niveaugroep' ? `${jaar}${'EFGHIJ'[Math.floor(R() * 6)]}` : gnaam;
        d['leerlingen/' + m] = { familienaam:f, voornaam:v, klas, jaar, stroom, schooljaar:SCHOOLJAAR };
        leerlingen.push(m); n++;
      }
      const leerkrachten = [lk[(gi + Number(jaar)) % lk.length]];
      if(gnaam === `${jaar}ANg1`) leerkrachten.push(email);
      const aan = {};
      SITES.filter(s=>s.jaar === `${jaar}${stroom}`).forEach((s, si)=>{
        if(gnaam === `${jaar}ANg1` ? si === 0 : R() < .35) aan[s.id] = { on:true, uit:[], rt:si === 0 };
      });
      d['groepen/' + gnaam] = { naam:gnaam, jaar, stroom, soort, leerkrachten, leerlingen, aan };
      /* voorbeeldvoortgang voor de modules die openstaan */
      Object.keys(aan).forEach(id=>{
        const s = SITES.find(x=>x.id === id);
        leerlingen.forEach((m, li)=>{
          const ijver = R(); if(ijver < .12) return;
          const res = {}, toets = {}, tijd = {};
          const ver = Math.max(1, Math.round(s.onderdelen.length * ijver * .8));
          s.onderdelen.slice(0, ver).forEach(o=>{
            tijd[o.id] = 60 * (2 + Math.floor(R() * 14));
            if(o.toets){ if(R() < .6){ const nn = 20; toets[o.id + '_1'] = { score:Math.round(nn * (.35 + R() * .65)), n:nn, datum:nu - Math.floor(R() * 10) * 864e5 }; } return; }
            const gemaakt = Math.round((o.vragen || 6) * (.3 + R() * .7));
            for(let q = 0; q < gemaakt; q++) res[`${o.id}_vb${q}`] = R() < .45 + ijver * .5 ? 1 : 0;
          });
          const data = { _res:JSON.stringify(res) }; if(Object.keys(toets).length) data._toets = JSON.stringify(toets);
          const lid = d['leerlingen/' + m];
          d[`voortgang/vb${n}_${li}_${id}`] = { email:m, naam:`${lid.voornaam} ${lid.familienaam}`, site:id, schooljaar:SCHOOLJAAR, bijgewerkt:iso(nu - Math.floor(R() * 5e8)), data, tijd };
        });
      });
    });
  });
  const s0 = SITES[0], o0 = s0 && s0.onderdelen[1];
  const melding = (i, lkM, status, waar, fout, alt, reactie) => {
    const t = new Date(nu - i * 3 * 864e5).toISOString();
    d['fouten/vb' + i] = { melder:lkM, naam:d['leerkrachten/' + lkM].naam, site:s0 ? s0.id : 'ander', onderdeel:o0 ? o0.id : '', waar, fout, alternatief:alt, status, reactie, datum:t, bijgewerkt:t };
  };
  melding(1, lk[0], 'nieuw', 'Kaart 3, vraag b', 'Voorbeeldmelding: de uitleg spreekt over 4 delen, de figuur toont er 5.', 'Figuur met 4 gelijke delen.', '');
  melding(2, lk[2], 'opgelost', 'Kaart 1', 'Voorbeeldmelding: een tikfout in de opgave (“getalen”).', '“getallen”', 'Aangepast, bedankt!');
  return d;
}

/* oefenomgeving openen voor deze toeschouwer; maakt de oefenschool aan als ze nog niet bestaat */
export function open(email, naam){
  SLEUTEL = 'cl_zandbak_' + email;
  if(rawGet.call(localStorage, SLEUTEL) == null) save(oefenschool(email, naam || email));
  return getFirestore();
}
/* alles van de oefenomgeving wissen (volgende keer begint ze opnieuw) */
export function herbegin(){ try{ rawRemove.call(localStorage, SLEUTEL); }catch(e){} }
