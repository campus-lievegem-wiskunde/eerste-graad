/* Koppeling met Google Classroom (dashboard, Toetsen en taken). Geen server: het dashboard roept de Classroom API
   rechtstreeks aan met het Google-account van de leerkracht (Google Identity Services, token van één uur, enkel in dit tabblad).
   Classroom laat enkel punten zetten op opdrachten die met dezelfde webclient aangemaakt zijn, dus het dashboard maakt ze zelf.
   Koppeling: groepen/{groep}.classroom = { id, naam, link } en groepen/{groep}.cr.{opdracht-id} = { course, cw, link }. */
import { CLASSROOM_CLIENT_ID, DOMEIN } from '../gedeeld/firebase-config.js';

const SCOPES = ['classroom.courses.readonly', 'classroom.coursework.students', 'classroom.rosters.readonly', 'classroom.profile.emails']
  .map(s=>'https://www.googleapis.com/auth/' + s);
const API = 'https://classroom.googleapis.com/v1/';
const BEWAAR = 'cr_token';

let token = null, client = null, wachtOp = null;
try{ const t = JSON.parse(sessionStorage.getItem(BEWAAR) || 'null'); if(t && t.tot > Date.now() + 60000) token = t; }catch(e){}
export const verbonden = () => !!(token && token.tot > Date.now() + 60000);

/* het script van Google vooraf laden: het aanmeldvenster moet meteen bij de klik openen, anders houdt de browser het tegen */
let laden = null;
export function laadGoogle(email){
  if(laden) return laden;
  laden = new Promise((ok, nok)=>{
    const klaar = ()=>{
      client = google.accounts.oauth2.initTokenClient({ client_id:CLASSROOM_CLIENT_ID, scope:SCOPES.join(' '), hint:email, hd:DOMEIN, prompt:'',
        callback:r=>{ const w = wachtOp; wachtOp = null; if(!w) return;
          if(r.error || !r.access_token) return w.nok(new Error(r.error || 'geen toegang'));
          if(!google.accounts.oauth2.hasGrantedAllScopes(r, ...SCOPES)) return w.nok(new Error('niet alle vinkjes'));
          token = { t:r.access_token, tot:Date.now() + (+r.expires_in || 3600) * 1000 };
          try{ sessionStorage.setItem(BEWAAR, JSON.stringify(token)); }catch(e){}
          w.ok(true); },
        error_callback:e=>{ const w = wachtOp; wachtOp = null; if(w) w.nok(new Error(e && e.type === 'popup_closed' ? 'venster gesloten' : (e && e.type) || 'geen toegang')); } });
      ok();
    };
    if(window.google && google.accounts && google.accounts.oauth2) return klaar();
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = klaar; s.onerror = ()=>{ laden = null; nok(new Error('Google niet bereikbaar')); }; document.head.append(s);
  });
  return laden;
}
/* enkel aanroepen vanuit een klik */
export function verbind(){
  if(verbonden()) return Promise.resolve(true);
  if(!client) return Promise.reject(new Error('Google is nog aan het laden, probeer opnieuw'));
  return new Promise((ok, nok)=>{ wachtOp = { ok, nok }; client.requestAccessToken(); });
}

async function api(pad, { method = 'GET', body = null, params = null } = {}){
  if(!verbonden()) throw Object.assign(new Error('niet verbonden'), { code:'token' });
  const url = new URL(API + pad); if(params) Object.entries(params).forEach(([k, v])=>v != null && url.searchParams.set(k, v));
  const r = await fetch(url, { method, headers:Object.assign({ Authorization:'Bearer ' + token.t }, body ? { 'Content-Type':'application/json' } : {}), body:body ? JSON.stringify(body) : null });
  if(r.status === 401){ token = null; try{ sessionStorage.removeItem(BEWAAR); }catch(e){} throw Object.assign(new Error('niet verbonden'), { code:'token' }); }
  const d = r.status === 204 ? {} : await r.json().catch(()=>({}));
  if(!r.ok) throw Object.assign(new Error((d.error && d.error.message) || ('Classroom gaf fout ' + r.status)), { status:r.status });
  return d;
}
async function alles(pad, veld, params = {}){
  const uit = []; let tk = null;
  do{ const d = await api(pad, { params:Object.assign({ pageSize:100, pageToken:tk }, params) }); uit.push(...(d[veld] || [])); tk = d.nextPageToken; }while(tk);
  return uit;
}

/* klassen waarin ik lesgeef */
export const mijnKlassen = () => alles('courses', 'courses', { teacherId:'me', courseStates:'ACTIVE' });
/* de klas die het best bij de naam van de groep past (bv. 2ANg1 in "Wiskunde 2ANg1") */
export function besteKlas(klassen, groepNaam){
  const n = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const g = n(groepNaam);
  return klassen.find(k=>n(k.name) === g) || klassen.find(k=>n(k.name).includes(g) || n(k.section).includes(g)) || null;
}
/* leerlingen van de klas: e-mail (kleine letters) → { id, naam } */
async function leerlingen(course){
  const m = new Map();
  (await alles(`courses/${course}/students`, 'students')).forEach(s=>{ const e = ((s.profile || {}).emailAddress || '').toLowerCase();
    if(e) m.set(e, { id:s.userId, naam:((s.profile || {}).name || {}).fullName || e }); });
  return m;
}

const datum = ms => { const d = new Date(ms); return { year:d.getUTCFullYear(), month:d.getUTCMonth() + 1, day:d.getUTCDate() }; };
const uur = ms => { const d = new Date(ms); return { hours:d.getUTCHours(), minutes:d.getUTCMinutes() }; };

/* de opdracht in Classroom zetten of bijwerken. cfg = instelling van de groep (van, tot); cr = vorige koppeling of null.
   Opent ze later, dan wordt ze ingepland; de inleverdatum is het sluitmoment (enkel als dat nog moet komen). */
export async function zetOpdracht({ course, cr, o, cfg, max, link, uitleg }){
  const nu = Date.now();
  let cw = null;
  if(cr && cr.course === course && cr.cw){
    try{ cw = await api(`courses/${course}/courseWork/${cr.cw}`); }catch(e){ if(e.status !== 404) throw e; }
    if(cw && cw.state === 'DELETED') cw = null;
  }
  if(!cw){
    const body = { title:o.titel, description:uitleg, workType:'ASSIGNMENT', maxPoints:max, materials:[{ link:{ url:link, title:o.titel } }],
      state:cfg.van > nu ? 'DRAFT' : 'PUBLISHED', ...(cfg.van > nu ? { scheduledTime:new Date(cfg.van).toISOString() } : {}),
      ...(cfg.tot && cfg.tot > nu ? { dueDate:datum(cfg.tot), dueTime:uur(cfg.tot) } : {}) };
    cw = await api(`courses/${course}/courseWork`, { method:'POST', body });
    return { course, cw:cw.id, link:cw.alternateLink || '', nieuw:true };
  }
  const veld = { title:o.titel, maxPoints:max };
  if(cfg.tot && cfg.tot > nu){ veld.dueDate = datum(cfg.tot); veld.dueTime = uur(cfg.tot); }
  if(cw.state === 'DRAFT'){ if(cfg.van > nu) veld.scheduledTime = new Date(cfg.van).toISOString(); else veld.state = 'PUBLISHED'; }
  const masker = Object.keys(veld).filter(k=>JSON.stringify(veld[k]) !== JSON.stringify(cw[k]));
  if(masker.length) cw = await api(`courses/${course}/courseWork/${cw.id}`, { method:'PATCH', params:{ updateMask:masker.join(',') }, body:veld });
  return { course, cw:cw.id, link:cw.alternateLink || cr.link || '', nieuw:false };
}

/* punten zetten. lijst = [{ email, p, def }]: def = definitief en teruggeven (na het vrijgeven), anders conceptpunt.
   groep = alle e-mailadressen van de groep, om te melden wie niet in de klas zit (en omgekeerd). */
export async function zetPunten({ course, cw, lijst, groep }){
  const lln = await leerlingen(course);
  const subs = new Map((await alles(`courses/${course}/courseWork/${cw}/studentSubmissions`, 'studentSubmissions')).map(s=>[s.userId, s]));
  const uit = { concept:0, def:0, terug:0, nietInKlas:[], nietInGroep:[] };
  const inGroep = new Set(groep.map(e=>e.toLowerCase()));
  groep.forEach(e=>{ if(!lln.has(e.toLowerCase())) uit.nietInKlas.push(e); });
  lln.forEach((v, e)=>{ if(!inGroep.has(e)) uit.nietInGroep.push(v.naam); });
  for(const { email, p, def } of lijst){
    const l = lln.get(email.toLowerCase()), s = l && subs.get(l.id); if(!s || p == null) continue;
    const pad = `courses/${course}/courseWork/${cw}/studentSubmissions/${s.id}`;
    if(def){
      if(s.draftGrade !== p || s.assignedGrade !== p){ await api(pad, { method:'PATCH', params:{ updateMask:'draftGrade,assignedGrade' }, body:{ draftGrade:p, assignedGrade:p } }); uit.def++; }
      if(s.state !== 'RETURNED'){ await api(pad + ':return', { method:'POST', body:{} }); uit.terug++; }
    }else if(s.draftGrade !== p){ await api(pad, { method:'PATCH', params:{ updateMask:'draftGrade' }, body:{ draftGrade:p } }); uit.concept++; }
  }
  return uit;
}
