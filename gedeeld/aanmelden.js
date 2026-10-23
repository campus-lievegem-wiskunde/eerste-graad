/* Aanmelden met het schoolaccount, rol bepalen, zichtbaarheid en voortgang.
   Een oefenpagina zet op <body>: data-site="m1" data-prefix="m1_herh_v2_" data-inhoud="inhoud.js".
   Volgorde: aanmelden → rol en groepen → voortgang ophalen → inhoud.js laden → wijzigingen om de 30 s doorsturen.
   Andere modules (zoals het dashboard) gebruiken: import { klaar } from '…/aanmelden.js'; const s = await klaar;
   Een toeschouwer (collectie toeschouwers, bv. de directeur) werkt in een oefenomgeving: F en db wijzen dan naar
   zandbak.js: hij leest de echte gegevens, maar wat hij wijzigt blijft in deze browser. F en db zijn daarom 'let' (live bindings). */
const V = '10.12.2';
export let [{ initializeApp }, A, F, C] = await Promise.all([
  import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
  import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
  import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  import('./firebase-config.js')
]);
export const app = initializeApp(C.firebaseConfig);
export const auth = A.getAuth(app);
export let db = F.getFirestore(app);
const B = document.body, site = B.dataset.site || 'site', PREFIX = B.dataset.prefix || null, INHOUD = B.dataset.inhoud || null;
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const ls = { get:k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, keys:()=>{ try{ return Object.keys(localStorage); }catch(e){ return []; } } };
const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
let resolveKlaar; export const klaar = new Promise(r=>resolveKlaar = r);

/* ---------- aanmeldscherm ---------- */
const main = document.querySelector('main') || document.body;
const gate = el('div', 'login-gate', `<div class="login-card">
  <h2>Meld je aan</h2>
  <p>Gebruik je schoolaccount (<b>@${C.DOMEIN}</b>). Zo wordt je werk bewaard en kan je leerkracht je voortgang zien.</p>
  <button type="button" class="btn big" id="loginBtn">Aanmelden met Google</button>
  <p class="login-msg" role="status"></p><div class="login-hulp" hidden></div></div>`);
const msg = gate.querySelector('.login-msg');
function lock(on){ B.classList.toggle('needs-login', on); gate.hidden = !on; }
main.prepend(gate); lock(true);
const provider = new A.GoogleAuthProvider();
provider.setCustomParameters({ hd: C.DOMEIN, prompt: 'select_account' });
/* Aanmelden gebeurt altijd met een pop-upvenster. De omleidingsmethode (redirect) werkt niet op iPhone en in
   Chrome/Safari met afgeschermde opslag, omdat het aanmeldvenster op firebaseapp.com staat en de site op github.io. */
const hulp = gate.querySelector('.login-hulp');
const ua = navigator.userAgent || '';
const IOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
/* ingebouwde browser van een app (Smartschool, Gmail, Instagram …): Google laat daar niet aanmelden */
const INAPP = (IOS && !/Safari\//.test(ua)) || /; wv\)/.test(ua) || /FBAN|FBAV|Instagram|Line\/|Smartschool/i.test(ua);
function toonHulp(titel){
  const browser = IOS ? 'Safari' : 'Chrome';
  hulp.hidden = false;
  hulp.innerHTML = `<p><b>${titel}</b></p><ol>
    <li>Kopieer de link met de knop hieronder.</li>
    <li>Open <b>${browser}</b> en plak de link in de adresbalk.</li>
    <li>Tik daar op <b>Aanmelden met Google</b>.</li></ol>
    <button type="button" class="btn ghost" id="kopieerLink">Kopieer de link</button> <span class="mini" id="kopieerOk"></span>`;
  hulp.querySelector('#kopieerLink').onclick = async ()=>{
    const ok = hulp.querySelector('#kopieerOk');
    try{ await navigator.clipboard.writeText(location.href); ok.textContent = 'Gekopieerd!'; }
    catch(e){ ok.textContent = location.href; }
  };
}
if(INAPP) toonHulp(`Je opent deze pagina in de browser van een app. Aanmelden lukt het best in ${IOS ? 'Safari' : 'Chrome'}.`);
gate.querySelector('#loginBtn').addEventListener('click', async ()=>{
  msg.textContent = '';
  try{ await A.signInWithPopup(auth, provider); }
  catch(e){
    const c = (e && e.code) || '';
    if(c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return;
    if(c === 'auth/popup-blocked'){ msg.textContent = 'Je browser hield het aanmeldvenster tegen. Tik nog een keer op de knop.'; toonHulp('Lukt het nog niet? Open de site in een gewone browser.'); return; }
    if(/operation-not-supported|web-storage-unsupported|disallowed/.test(c)){ msg.textContent = 'Aanmelden kan niet in deze browser.'; toonHulp('Open de site in een gewone browser:'); return; }
    if(c === 'auth/network-request-failed'){ msg.textContent = 'Geen internetverbinding. Probeer opnieuw.'; return; }
    msg.textContent = 'Aanmelden lukte niet. Probeer opnieuw.' + (c ? ` (${c.replace('auth/', '')})` : '');
  }
});

/* ---------- naam, rol en afmelden ---------- */
function userChip(user, rol){
  if(document.querySelector('.user-chip')) return;
  const naam = (user.displayName || user.email).split(' ')[0];
  const isLk = rol === 'leerkracht' || rol === 'beheerder';
  const up = new URL('../', import.meta.url).href;
  const chip = el('div', 'user-chip', `<span class="u-av" aria-hidden="true">${naam.slice(0,1).toUpperCase()}</span><span class="t">Aangemeld als <b></b>${isLk ? ` <a class="linkbtn" href="${up}dashboard/">Dashboard</a>${PREFIX ? ` <a class="linkbtn fout-link" href="${up}dashboard/?melden=${encodeURIComponent(site)}"><svg class="ic-fout" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 2.6 19.6a1 1 0 0 0 .9 1.5h17a1 1 0 0 0 .9-1.5L12 3.2z"/><path d="M12 9.5v5"/><circle cx="12" cy="17.6" r=".4"/></svg>Fout melden</a>` : ''}` : ''}<button type="button" class="linkbtn">Afmelden</button></span>`);
  chip.querySelector('b').textContent = naam; chip.title = user.email;
  chip.querySelector('button').addEventListener('click', afmelden);
  /* Fout melden: het onderdeel dat nu open staat gaat mee (laatst bewaard tabblad van de module, anders de hash) */
  const fl = chip.querySelector('.fout-link');
  if(fl) fl.addEventListener('click', ()=>{ const ond = ls.get(PREFIX + 'tab') || location.hash.slice(1) || ''; fl.href = `${up}dashboard/?melden=${encodeURIComponent(site)}${ond ? '&ond=' + encodeURIComponent(ond) : ''}`; });
  const nav = document.querySelector('nav.side');
  if(nav){ const ol = nav.querySelector('ol'); nav.insertBefore(chip, ol); }
  else { const bar = document.querySelector('.tts-bar'); (bar || main).prepend(chip); }
}
function melding(html){
  const app = document.getElementById('app') || main;
  const m = el('div', 'tip melding', `<div>${html}</div>`);
  app.innerHTML = ''; app.append(m);
  document.querySelectorAll('nav.side ol, .pager').forEach(x=>x.hidden = true);
}

/* ---------- rol en groepen ---------- */
async function rolVan(email){
  const [b, l] = await Promise.all([
    F.getDoc(F.doc(db, 'beheerders', email)).catch(()=>null),
    F.getDoc(F.doc(db, 'leerkrachten', email)).catch(()=>null)]);
  if(b && b.exists()) return 'beheerder';
  if(l && l.exists()) return 'leerkracht';
  if(db.zandbak) return 'leerling';
  const t = await F.getDoc(F.doc(db, 'toeschouwers', email)).catch(()=>null);
  return t && t.exists() ? 'toeschouwer' : 'leerling';
}
/* toeschouwer: vanaf nu gaat alles via de oefenomgeving (echte gegevens lezen, wijzigingen enkel lokaal); daarin is hij leerkracht en beheerder */
async function naarZandbak(u, email){
  const Z = await import('./zandbak.js');
  db = Z.open(email, u.displayName || email, F, db); F = Z;
  B.dataset.toeschouwer = '1';
  const balk = el('div', 'toeschouwer-balk', `<span><b>Toeschouwer · oefenomgeving.</b> Je ziet de echte gegevens. Wat je hier wijzigt, blijft in deze browser: niemand anders ziet het en de echte database verandert niet.</span>`);
  const her = el('button', 'linkbtn', 'Oefenomgeving opnieuw beginnen'); her.type = 'button';
  her.onclick = ()=>{ if(!confirm('Alles wat je in de oefenomgeving wijzigde wissen? Je ziet daarna weer de echte gegevens zoals ze zijn.')) return; Z.herbegin(); wipeLocal(); location.reload(); };
  balk.append(her); B.prepend(balk);
  return rolVan(email);
}
async function groepenVan(email){
  const q = F.query(F.collection(db, 'groepen'), F.where('leerlingen', 'array-contains', email));
  const s = await F.getDocs(q);
  return s.docs.map(d=>Object.assign({ id:d.id }, d.data()));
}
/* is een site open, en welke onderdelen zijn uitgezet? (open als minstens één groep hem openzette) */
export function zichtbaarheid(groepen, siteId){
  let open = false; let uit = null; let rt = false;
  groepen.forEach(g=>{
    const a = g.aan && g.aan[siteId];
    if(!a || !a.on) return;
    open = true; if(a.rt) rt = true;
    const u = new Set(a.uit || []);
    uit = uit === null ? u : new Set([...uit].filter(x=>u.has(x)));
  });
  return { open, uit: uit || new Set(), rt };
}
/* knop met het rekentoestel rechtsonder (gedeeld/ti30xb.js), als de leerkracht hem aanzette voor deze module */
function rekentoestelKnop(){
  const knop = () => window.TI30XB && window.TI30XB.fab && window.TI30XB.fab();
  if(window.TI30XB) return knop();
  const sc = document.createElement('script'); sc.src = new URL('ti30xb.js', import.meta.url).href; sc.onload = knop; document.head.append(sc);
}

/* ---------- voortgang ---------- */
let user = null, ref = null, dirty = new Set(), tijd = {}, tijdDirty = false, started = false;
function ownKey(k){ return PREFIX && typeof k === 'string' && k.startsWith(PREFIX); }
function wipeLocal(){ if(!PREFIX) return; ls.keys().forEach(k=>{ if(ownKey(k)) rawRemove.call(localStorage, k); }); }
async function flush(){
  if(!ref || (!dirty.size && !tijdDirty)) return;
  const data = {};
  dirty.forEach(k=>{ const v = ls.get(k); data[k.slice(PREFIX.length)] = v == null ? F.deleteField() : v; });
  const keys = [...dirty]; dirty.clear();
  const tijdNu = tijdDirty ? Object.assign({}, tijd) : null; tijdDirty = false;
  const payload = { email:user.email.toLowerCase(), naam:user.displayName || '', site, schooljaar:C.SCHOOLJAAR, bijgewerkt:F.serverTimestamp(), data };
  if(tijdNu) payload.tijd = tijdNu;
  try{ await F.setDoc(ref, payload, { merge:true }); }
  catch(e){ console.warn('Opslaan in Firebase mislukt, later opnieuw', e); keys.forEach(k=>dirty.add(k)); if(tijdNu) tijdDirty = true; }
}
async function afmelden(){
  await flush().catch(()=>{});
  wipeLocal(); try{ localStorage.removeItem('cl_uid'); }catch(e){}
  await A.signOut(auth); location.reload();
}
function watchStorage(){
  Storage.prototype.setItem = function(k, v){ rawSet.call(this, k, v); if(this === localStorage && ownKey(k)) dirty.add(k); };
  Storage.prototype.removeItem = function(k){ rawRemove.call(this, k); if(this === localStorage && ownKey(k)) dirty.add(k); };
  setInterval(flush, 30000);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') flush(); });
  addEventListener('pagehide', ()=>{ flush(); });
}
/* actieve werktijd: enkel als de pagina zichtbaar is en er de laatste 60 s iets gebeurde */
function watchTime(){
  let last = Date.now();
  ['pointerdown','keydown','scroll','input','touchstart'].forEach(ev=>addEventListener(ev, ()=>{ last = Date.now(); }, { passive:true, capture:true }));
  setInterval(()=>{
    if(document.visibilityState !== 'visible' || Date.now() - last > 60000) return;
    const sec = document.querySelector('section.group:not([hidden])');
    const id = sec ? sec.id : '_pagina';
    tijd[id] = (tijd[id] || 0) + 5; tijdDirty = true;
  }, 5000);
}
/* resultaten per vraag (1 = juist bij de laatste controle, 0 = fout) en proeftoetsscores */
function koppelResultaten(){
  const read = k => { try{ return JSON.parse(ls.get(PREFIX + k) || '{}') || {}; }catch(e){ return {}; } };
  const R = read('_res'), T = read('_toets');
  window.CL = {
    vraag(){},
    res(id, ok, info){ if(info) return; R[id] = ok ? 1 : 0; localStorage.setItem(PREFIX + '_res', JSON.stringify(R)); },
    toets(key, score, n){ T[key] = { score, n, datum: Date.now() }; localStorage.setItem(PREFIX + '_toets', JSON.stringify(T)); }
  };
}
/* startpagina's: tegels van sites die niet openstaan verbergen (voor leerlingen) */
function tegelsFilteren(groepen){
  const tegels = [...document.querySelectorAll('a.tegel[data-site]')];
  if(!tegels.length) return;
  let zicht = 0;
  tegels.forEach(t=>{ const z = zichtbaarheid(groepen, t.dataset.site); t.hidden = !z.open; if(z.open) zicht++; });
  /* tegels zonder data-site (bv. Modules) blijven altijd zichtbaar: dan geen melding */
  if(!zicht && !document.querySelector('a.tegel:not([data-site])')){ const box = document.querySelector('.tegels'); if(box) box.append(el('p', 'leeg', 'Er staat hier nog niets open. Je leerkracht zet de oefeningen open wanneer je eraan mag beginnen.')); }
}
/* ---------- bekijk als leerling (leerkrachten, beheerders en toeschouwers) ----------
   De keuze staat in sessionStorage cl_als_<site> (enkel dit tabblad). De module toont dan wat een leerling van die groep ziet:
   enkel de open onderdelen, de rekentoestelknop zoals ingesteld, geen Bord. Antwoorden worden niet bewaard. */
const ALS = 'cl_als_' + site;
const alsGroep = () => { try{ return sessionStorage.getItem(ALS); }catch(e){ return null; } };
function alsUit(){ try{ sessionStorage.removeItem(ALS); }catch(e){} wipeLocal(); location.reload(); }
async function kiesAlsLeerling(email){
  const tip = document.querySelector('.lk-tip'); if(!tip) return;
  let groepen = [];
  try{
    const { SITES } = await import('./sites.js'); const s = SITES.find(x=>x.id === site); if(!s) return;
    groepen = (await F.getDocs(F.collection(db, 'groepen'))).docs.map(d=>Object.assign({ id:d.id }, d.data()))
      .filter(g=>`${g.jaar}${g.stroom}` === s.jaar)
      .sort((a, b)=>(((b.leerkrachten || []).includes(email)) - ((a.leerkrachten || []).includes(email))) || String(a.naam).localeCompare(String(b.naam), 'nl', { numeric:true }));
  }catch(e){ console.warn('Groepen ophalen mislukt', e); return; }
  if(!groepen.length) return;
  const r = el('div', 'als-kies', '<label>Bekijk als leerling van </label>');
  const sel = el('select', '', '<option value="">kies een groep</option>' + groepen.map(g=>{ const z = zichtbaarheid([g], site); return `<option value="${g.id}">${g.naam}${(g.leerkrachten || []).includes(email) ? ' (mijn groep)' : ''}${z.open ? '' : ' · module dicht'}</option>`; }).join(''));
  sel.id = 'alsLeerling'; r.querySelector('label').htmlFor = sel.id;
  sel.onchange = ()=>{ if(!sel.value) return; try{ sessionStorage.setItem(ALS, sel.value); }catch(e){} wipeLocal(); location.reload(); };
  r.append(sel); tip.querySelector('div').append(r);
}
async function alsLeerling(email){
  const id = alsGroep();
  let g = null; try{ const s = await F.getDoc(F.doc(db, 'groepen', id)); if(s.exists()) g = Object.assign({ id }, s.data()); }catch(e){}
  B.dataset.rol = 'leerling'; B.dataset.alsLeerling = '1';
  const balk = el('div', 'toeschouwer-balk als-balk', `<span>Je bekijkt deze module <b>als leerling van ${g ? g.naam : id}</b>. Je antwoorden worden niet bewaard.</span>`);
  const terug = el('button', 'linkbtn', 'Terug naar de leerkrachtweergave'); terug.type = 'button'; terug.onclick = alsUit;
  balk.append(terug); B.prepend(balk);
  if(!g){ melding('<b>Deze groep bestaat niet meer.</b>'); return; }
  const z = zichtbaarheid([g], site);
  if(!z.open){ melding('<b>Deze module staat nog niet open.</b> Je leerkracht zet ze open wanneer je eraan mag beginnen.'); return; }
  window.CL_VERBORGEN = z.uit;
  if(z.rt) rekentoestelKnop();
  wipeLocal(); koppelResultaten();
  const s = el('script'); s.src = INHOUD;
  s.onload = ()=>document.dispatchEvent(new Event('inhoud-geladen'));
  document.body.append(s);
}
async function start(u){
  if(started) return; started = true;
  user = u;
  const email = u.email.toLowerCase();
  let rol = 'leerling', groepen = [];
  try{ rol = await rolVan(email); }catch(e){}
  if(rol === 'toeschouwer') rol = await naarZandbak(u, email);
  userChip(u, rol);
  B.dataset.rol = rol;
  if(rol === 'leerling'){
    try{ groepen = await groepenVan(email); }catch(e){ console.warn('Groepen ophalen mislukt', e); }
  }
  resolveKlaar({ user:u, email, rol, groepen, toeschouwer:!!db.zandbak });
  if(rol === 'leerling') tegelsFilteren(groepen);
  if(!PREFIX || !INHOUD) return;

  /* zichtbaarheid van deze site */
  if(rol === 'leerling'){
    if(!groepen.length){ melding('<b>Je bent nog niet ingedeeld in een groep.</b> Vraag het aan je leerkracht.'); return; }
    const z = zichtbaarheid(groepen, site);
    if(!z.open){ melding('<b>Deze module staat nog niet open.</b> Je leerkracht zet ze open wanneer je eraan mag beginnen.'); return; }
    window.CL_VERBORGEN = z.uit;
    if(z.rt) rekentoestelKnop();
  } else if(alsGroep()){
    await alsLeerling(email); return;
  } else {
    rekentoestelKnop();
    const m = document.querySelector('.info-box');
    if(m) m.insertAdjacentElement('afterend', el('div', 'tip lk-tip', db.zandbak
      ? '<div>Je bekijkt deze module als <b>toeschouwer</b>: je ziet alle onderdelen zoals een leerkracht. Je antwoorden blijven in je oefenomgeving in deze browser; niemand anders ziet ze.</div>'
      : '<div>Je bekijkt deze module als <b>' + rol + '</b>: je ziet altijd alle onderdelen. Leerlingen zien enkel wat jij openzet in het dashboard. De knop met het rekentoestel rechtsonder krijgen ze alleen als je hem aanzet.</div>'));
    kiesAlsLeerling(email);
  }

  ref = F.doc(db, 'voortgang', `${u.uid}_${site}`);
  /* gedeelde Chromebook: wis wat een vorige gebruiker hier achterliet */
  if(ls.get('cl_uid') !== u.uid){ wipeLocal(); try{ rawSet.call(localStorage, 'cl_uid', u.uid); }catch(e){} }
  try{
    const snap = await F.getDoc(ref);
    if(snap.exists()){
      const d = snap.data();
      Object.entries(d.data || {}).forEach(([k, v])=>{ if(typeof v === 'string') rawSet.call(localStorage, PREFIX + k, v); });
      tijd = Object.assign({}, d.tijd || {});
    }
  }catch(e){ console.warn('Voortgang ophalen mislukt; ik werk verder met wat op dit toestel staat', e); }
  ls.keys().forEach(k=>{ if(ownKey(k)) dirty.add(k); });
  koppelResultaten(); watchStorage(); watchTime();
  const s = el('script'); s.src = INHOUD;
  s.onload = ()=>document.dispatchEvent(new Event('inhoud-geladen'));
  document.body.append(s);
}
A.onAuthStateChanged(auth, async u=>{
  if(!u){ lock(true); return; }
  if(!u.email || !u.email.toLowerCase().endsWith('@' + C.DOMEIN)){
    msg.textContent = `Gebruik je schoolaccount (@${C.DOMEIN}). Je bent afgemeld.`;
    await A.signOut(auth); lock(true); return;
  }
  lock(false); start(u);
});

