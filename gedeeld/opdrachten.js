/* Toetsen, huistaken en rekenvaardigheden: catalogus en gedeelde hulpfuncties (aanmelden.js, opdracht.js, rubriek.js, dashboard).
   Een nieuwe toets of taak: map <jaar>/<rubriek>/<map>/ met index.html, opgave.js en sleutel.enc.json (uitleg in gedeeld/opdracht.js),
   en hier een element achteraan OPDRACHTEN. Het id bestaat uit kleine letters, cijfers en koppeltekens en verandert nooit meer.
   Rubriek toetsen: standaard één poging. Huistaken en rekenvaardigheden: opnieuw mag, de laatste poging telt.
   Instellingen per groep staan in groepen/{groep}.opdr.{id}: { van, tot, pogingen, volgorde, ziet, dicht, extra } (tijden in ms). */
export const OPDRACHTEN = [
  /* { id:'1a-t-m1-getallen', titel:'Toets · Inzicht in getallen', kort:'Toets getallen', jaar:'1A', rubriek:'toetsen', pad:'1A/toetsen/m1-getallen/' }
     op:5 = de punten ook omrekenen naar punten op 5 (dat komt op het rapport) */
  { id:'2a-rv-2-gehele-optellen', titel:'2. Optellen en aftrekken van gehele getallen', kort:'Optellen en aftrekken gehele getallen', jaar:'2A', rubriek:'rekenvaardigheden', pad:'2A/rekenvaardigheden/2-gehele-optellen/', op:5 }
];
/* Wie ziet de rubrieken toetsen, huistaken en rekenvaardigheden en het tabblad in het dashboard?
   'beheerder' = voorlopig enkel beheerders (keuze van Jeroen, 24 oktober 2026; geen toeschouwer, geen collega's, geen leerlingen);
   'iedereen' = alle leerkrachten, en leerlingen zodra iets voor hun groep openstaat. */
export const OPDR_ZICHTBAAR = 'beheerder';
export const opdrZichtbaar = (rol, toeschouwer) => OPDR_ZICHTBAAR === 'iedereen' || (rol === 'beheerder' && !toeschouwer);
/* punten omrekenen naar de schaal van het rapport (o.op, bv. 5), op 0,1 afgerond */
export const opSchaal = (o, totaal, max) => o.op && max ? Math.round(totaal / max * o.op * 10) / 10 : null;
export const RUBRIEKEN_OPDR = [['toetsen', 'Toetsen'], ['huistaken', 'Huistaken'], ['rekenvaardigheden', 'Rekenvaardigheden']];
export const rubriekNaam = id => (RUBRIEKEN_OPDR.find(r=>r[0] === id) || [id, id])[1];
export const soortVan = o => o.rubriek === 'toetsen' ? 'toets' : 'taak';
/* wat de leerling ziet nadat jij de resultaten vrijgeeft */
export const ZIET = { niets:'Niets', score:'Enkel de score', verbetering:'Score en verbetering per vraag' };

export function instelling(g, o){
  const st = { van:null, tot:null, pogingen:soortVan(o) === 'toets' ? 1 : 0, volgorde:false, ziet:'niets', dicht:[], extra:{} };
  return Object.assign(st, (g && g.opdr && g.opdr[o.id]) || {});
}
/* dicht (nog nooit geopend), gepland, open of gesloten; een eigen opening van de leerling (extra) gaat voor */
export function staat(cfg, email, nu = Date.now()){
  const v = (email && cfg.extra && cfg.extra[email]) || cfg;
  if(!v.van) return 'dicht';
  if(nu < v.van) return 'gepland';
  if(v.tot && nu >= v.tot) return 'gesloten';
  return 'open';
}
/* staat er voor iemand van de groep iets open (de groep zelf of een leerling met een eigen opening)? */
export function ergensOpen(cfg, nu = Date.now()){
  return staat(cfg, null, nu) === 'open' || Object.values(cfg.extra || {}).some(x=>staat(x, null, nu) === 'open');
}
/* modules die dicht moeten zolang een toets van de groep openstaat */
export function toetsSluit(groepen, siteId, nu = Date.now()){
  return groepen.some(g=>Object.entries(g.opdr || {}).some(([id, cfg])=>(cfg.dicht || []).includes(siteId) && ergensOpen(cfg, nu)));
}
/* de groep van de leerling waarin de opdracht het verst staat: open, dan gesloten, dan gepland */
export function groepVoor(groepen, o, email, nu = Date.now()){
  const rang = { open:3, gesloten:2, gepland:1, dicht:0 };
  let best = null;
  groepen.forEach(g=>{ if(!g.opdr || !g.opdr[o.id]) return; const cfg = instelling(g, o), s = staat(cfg, email, nu);
    if(!best || rang[s] > rang[best.s]) best = { g, cfg, s }; });
  return best && best.s !== 'dicht' ? best : null;
}
export const docId = (o, email) => `${o.id}__${email}`;

/* volgorde van de vragen: per deel geschud met een vaste kiem (opdracht + e-mail), zodat een leerling altijd dezelfde volgorde krijgt */
export function alleVragen(opg){ return opg.delen.flatMap(d=>d.vragen); }
export function schud(opg, kiem){
  let h = 2166136261; for(const c of kiem){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = ()=>{ h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  return opg.delen.map(d=>{ const a = d.vragen.map(q=>q.id); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }).flat();
}

/* ---------- automatisch verbeteren ----------
   sleutel.vragen[id]: getal { juist:[12, 12.5], tol:0 } · tekst { juist:['gelijkbenig'] } · keuze { juist:2 } · meer { juist:[0, 3] }
   · open { toon:'modelantwoord' } (verbetert de leerkracht). toon = wat de leerling als juist antwoord ziet. */
const getal = s => { if(typeof s === 'number') return s; const t = String(s == null ? '' : s).trim().replace(/\s/g, '').replace(',', '.'); return t === '' || isNaN(+t) ? null : +t; };
const norm = s => String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.]$/, '');
export function verbeter(q, a, k){
  if(!k || q.type === 'open') return null;
  const max = q.punten || 1;
  let ok = false;
  if(q.type === 'getal'){ const x = getal(a); ok = x != null && [].concat(k.juist).some(j=>Math.abs(getal(j) - x) <= (k.tol || 1e-9)); }
  else if(q.type === 'tekst') ok = [].concat(k.juist).some(j=>norm(j) === norm(a));
  else if(q.type === 'keuze') ok = a != null && a !== '' && +a === +k.juist;
  else if(q.type === 'meer'){ const x = [].concat(a || []).map(Number).sort().join(), j = [].concat(k.juist).map(Number).sort().join(); ok = x === j; }
  return ok ? max : 0;
}
export function juistTekst(q, k){
  if(!k) return '';
  if(k.toon != null) return String(k.toon);
  if(q.type === 'keuze') return q.opties[k.juist] != null ? String.fromCharCode(65 + +k.juist) : '';
  if(q.type === 'meer') return [].concat(k.juist).map(i=>String.fromCharCode(65 + +i)).join(', ');
  return [].concat(k.juist)[0] != null ? String([].concat(k.juist)[0]) : '';
}

/* ---------- versleutelde verbetersleutel ----------
   sleutel.enc.json in de map van de opdracht = { v:1, iter, salt, iv, data } (PBKDF2-SHA256 + AES-GCM, base64).
   De leerkracht typt één keer de sleutelcode in het dashboard; de ontsleutelde sleutel komt in Firestore (sleutels/{id}),
   enkel leesbaar voor leerkrachten. Maken: node hulp/versleutel.js <map met sleutel.json>. */
const b64 = { naar:u=>btoa(String.fromCharCode(...u)), van:s=>Uint8Array.from(atob(s), c=>c.charCodeAt(0)) };
async function sleutelUit(code, salt, iter){
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(code.trim().toUpperCase()), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name:'PBKDF2', hash:'SHA-256', salt, iterations:iter }, k, { name:'AES-GCM', length:256 }, false, ['encrypt', 'decrypt']);
}
export async function ontsleutel(enc, code){
  const k = await sleutelUit(code, b64.van(enc.salt), enc.iter);
  const buf = await crypto.subtle.decrypt({ name:'AES-GCM', iv:b64.van(enc.iv) }, k, b64.van(enc.data));
  return JSON.parse(new TextDecoder().decode(buf));
}
export async function versleutel(obj, code, iter = 200000){
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await sleutelUit(code, salt, iter);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name:'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(obj))));
  return { v:1, iter, salt:b64.naar(salt), iv:b64.naar(iv), data:b64.naar(data) };
}

/* interactieve opdracht (type eigen, rekenvaardigheden): opgave.js verbetert zelf met OPGAVE.verbeter(q, waarde, sleutel)
   → { pts, codes:[foutcodes], kruis:aantal rode kruisjes tijdens het maken }; het antwoord staat als JSON-tekst in antw */
function verbeterEigen(opg, q, a, k){
  let w = null; try{ w = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){}
  if(w == null || !opg.verbeter) return { p:k ? 0 : null, codes:[], kruis:0 };
  let r = {}; try{ r = opg.verbeter(q, w, k || null) || {}; }catch(e){ console.warn(e); }
  return { p:k ? Math.round(Math.min(q.punten || 1, Math.max(0, r.pts || 0)) * 100) / 100 : null, codes:r.codes || [], kruis:r.kruis || 0 };
}
/* oefenvragen (q.oefen) tellen niet mee */
export const telt = q => !q.oefen;

/* punten van één leerling: automatisch uit de sleutel, tenzij de leerkracht ze aanpaste (r.hand); open vragen enkel met de hand.
   per[id] = { p (null = nog niet verbeterd), max, toon, codes?, kruis? }; volledig = alle vragen hebben punten */
export function bereken(opg, antw, sleutel, r){
  const sl = (sleutel && sleutel.vragen) || {}, hand = new Set((r && r.hand) || []), punten = (r && r.punten) || {};
  const per = {}; let totaal = 0, max = 0, volledig = true;
  alleVragen(opg).filter(telt).forEach(q=>{
    const m = q.punten || 1, k = sl[q.id], a = (antw || {})[q.id];
    const e = q.type === 'eigen' ? verbeterEigen(opg, q, a, k) : null;
    const p = hand.has(q.id) ? punten[q.id] : e ? e.p : verbeter(q, a, k);
    per[q.id] = Object.assign({ p:p == null ? null : p, max:m, toon:juistTekst(q, k) }, e && (e.codes.length || e.kruis) ? { codes:e.codes, kruis:e.kruis } : {});
    max += m; if(p == null) volledig = false; else totaal += p;
  });
  return { per, totaal:Math.round(totaal * 100) / 100, max:Math.round(max * 100) / 100, volledig };
}
