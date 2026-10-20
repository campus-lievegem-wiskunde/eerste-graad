/* Oefenomgeving voor een toeschouwer (bv. de directeur).
   Dezelfde functies als firebase-firestore die het platform gebruikt. Lezen gebeurt in de echte database
   (de toeschouwer ziet de echte groepen, leerlingen, collega's en voortgang); elke wijziging komt in een laag
   bovenop, in localStorage van deze browser (sleutel cl_zandbak_<e-mail>). Daarna leest hij de echte gegevens
   mét zijn eigen wijzigingen erover. Niets gaat naar de echte database; collega's zien er niets van. */
const rawSet = Storage.prototype.setItem, rawGet = Storage.prototype.getItem, rawRemove = Storage.prototype.removeItem;
const DEL = { __del:1 }, TS = '__ts';
let SLEUTEL = 'cl_zandbak', R = null, RDB = null;
/* laag: { pad: document } of { pad: null } voor een document dat hij verwijderde */
function laag(){ try{ return JSON.parse(rawGet.call(localStorage, SLEUTEL) || '{}') || {}; }catch(e){ return {}; } }
function bewaar(d){ try{ rawSet.call(localStorage, SLEUTEL, JSON.stringify(d)); }catch(e){ console.warn('Oefenomgeving bewaren lukte niet', e); } }
/* tijdstempels worden als { __ts: iso } bewaard en komen terug met toDate(), zoals bij Firestore */
const tijdstempel = iso => ({ toDate:()=>new Date(iso), toMillis:()=>Date.parse(iso), toJSON:()=>({ [TS]:iso }) });
function revive(v){
  if(Array.isArray(v)) return v.map(revive);
  if(v && typeof v === 'object'){ if(TS in v) return tijdstempel(v[TS]); const o = {}; for(const [k, x] of Object.entries(v)) o[k] = revive(x); return o; }
  return v;
}
/* echt document (met Timestamp-objecten) omzetten naar gewone JSON */
function plat(v){
  if(Array.isArray(v)) return v.map(plat);
  if(v && typeof v === 'object'){ if(typeof v.toDate === 'function') return { [TS]:v.toDate().toISOString() }; const o = {}; for(const [k, x] of Object.entries(v)) o[k] = plat(x); return o; }
  return v;
}
const isSpeciaal = v => v && typeof v === 'object' && (v.__del || v.__au || v.__ar || v.__srv);
function waarde(v, oud){
  if(v && v.__srv) return { [TS]:new Date().toISOString() };
  if(v && v.__au) return [...new Set([...(Array.isArray(oud) ? oud : []), ...v.__au])];
  if(v && v.__ar) return (Array.isArray(oud) ? oud : []).filter(x=>!v.__ar.includes(x));
  return plat(v);
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
const past = (d, w) => (w || []).every(x=>x.op === '==' ? d[x.f] === x.v : x.op === 'in' ? x.v.includes(d[x.f]) : x.op === 'array-contains' ? (d[x.f] || []).includes(x.v) : true);
const snap = (id, path, d) => ({ id, ref:{ path, id }, exists:()=>d != null, data:()=>d == null ? undefined : revive(d) });
/* huidig document: eerst de laag, anders de echte database (null = bestaat niet) */
async function huidig(r){
  const L = laag(); if(r.path in L) return L[r.path];
  const s = await R.getDoc(R.doc(RDB, ...r.path.split('/'))).catch(()=>null);
  return s && s.exists() ? plat(s.data()) : null;
}

export function getFirestore(){ return { zandbak:true }; }
export function doc(db, col, id){ return { path:col + '/' + id, id }; }
export function collection(db, col){ return { col }; }
export function where(f, op, v){ return { f, op, v }; }
export function query(c, ...w){ return { col:c.col, w }; }
export function deleteField(){ return DEL; }
export const arrayUnion = (...v)=>({ __au:v }), arrayRemove = (...v)=>({ __ar:v });
export function serverTimestamp(){ return { __srv:1 }; }
export async function getDoc(r){ return snap(r.id, r.path, await huidig(r)); }
export async function getDocs(q){
  const echt = R.query(R.collection(RDB, q.col), ...(q.w || []).map(x=>R.where(x.f, x.op, x.v)));
  const s = await R.getDocs(echt);
  const L = laag(), out = [];
  s.docs.forEach(d=>{ const p = q.col + '/' + d.id; if(!(p in L)) out.push(snap(d.id, p, plat(d.data()))); });
  Object.entries(L).forEach(([p, d])=>{ const i = p.indexOf('/'); if(d && p.slice(0, i) === q.col && past(d, q.w)) out.push(snap(p.slice(i + 1), p, d)); });
  return { docs:out, size:out.length, empty:!out.length, forEach:f=>out.forEach(f) };
}
export async function setDoc(r, p, o){ const d = (o && o.merge) ? (await huidig(r) || {}) : {}; voegSamen(d, p); const L = laag(); L[r.path] = d; bewaar(L); }
export async function updateDoc(r, p){ const d = await huidig(r); if(!d) throw new Error('Document bestaat niet: ' + r.path); for(const [k, v] of Object.entries(p)) zetPad(d, k, v); const L = laag(); L[r.path] = d; bewaar(L); }
export async function addDoc(c, p){ const id = Math.random().toString(36).slice(2, 12); await setDoc({ path:c.col + '/' + id, id }, p); return { id, path:c.col + '/' + id }; }
export async function deleteDoc(r){ const L = laag(); L[r.path] = null; bewaar(L); }
export function writeBatch(){ const ops = []; return {
  set(r, d, o){ ops.push(()=>setDoc(r, d, o)); }, update(r, d){ ops.push(()=>updateDoc(r, d)); }, delete(r){ ops.push(()=>deleteDoc(r)); },
  async commit(){ for(const f of ops) await f(); } }; }

/* oefenomgeving openen bovenop de echte database (F en db van aanmelden.js).
   In zijn laag is de toeschouwer leerkracht en beheerder, zodat hij alles ziet en kan uitproberen. */
export function open(email, naam, echteF, echteDb){
  SLEUTEL = 'cl_zandbak_' + email; R = echteF; RDB = echteDb;
  const L = laag();
  if(!L['leerkrachten/' + email]){ L['leerkrachten/' + email] = { naam }; L['beheerders/' + email] = { naam }; bewaar(L); }
  return getFirestore();
}
/* al zijn wijzigingen wissen: hij ziet weer de echte gegevens zoals ze zijn */
export function herbegin(){ try{ rawRemove.call(localStorage, SLEUTEL); }catch(e){} }
