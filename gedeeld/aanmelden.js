/* Aanmelden met het schoolaccount, rol bepalen, zichtbaarheid en voortgang.
   Een oefenpagina zet op <body>: data-site="m1" data-prefix="m1_herh_v2_" data-inhoud="inhoud.js".
   Volgorde: aanmelden → rol en groepen → voortgang ophalen → inhoud.js laden → wijzigingen om de 30 s doorsturen.
   Andere modules (zoals het dashboard) gebruiken: import { klaar } from '…/aanmelden.js'; const s = await klaar; */
const V = '10.12.2';
export const [{ initializeApp }, A, F, C] = await Promise.all([
  import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
  import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
  import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  import('./firebase-config.js')
]);
export const app = initializeApp(C.firebaseConfig);
export const auth = A.getAuth(app);
export const db = F.getFirestore(app);
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
  const chip = el('div', 'user-chip', `<span class="u-av" aria-hidden="true">${naam.slice(0,1).toUpperCase()}</span><span class="t">Aangemeld als <b></b>${isLk ? ` <a class="linkbtn" href="${up}dashboard/">Dashboard</a>` : ''}<button type="button" class="linkbtn">Afmelden</button></span>`);
  chip.querySelector('b').textContent = naam; chip.title = user.email;
  chip.querySelector('button').addEventListener('click', afmelden);
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
  return 'leerling';
}
async function groepenVan(email){
  const q = F.query(F.collection(db, 'groepen'), F.where('leerlingen', 'array-contains', email));
  const s = await F.getDocs(q);
  return s.docs.map(d=>Object.assign({ id:d.id }, d.data()));
}
/* is een site open, en welke onderdelen zijn uitgezet? (open als minstens één groep hem openzette) */
export function zichtbaarheid(groepen, siteId){
  let open = false; let uit = null;
  groepen.forEach(g=>{
    const a = g.aan && g.aan[siteId];
    if(!a || !a.on) return;
    open = true;
    const u = new Set(a.uit || []);
    uit = uit === null ? u : new Set([...uit].filter(x=>u.has(x)));
  });
  return { open, uit: uit || new Set() };
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
  if(!zicht){ const box = document.querySelector('.tegels'); if(box) box.append(el('p', 'leeg', 'Er staat hier nog niets open. Je leerkracht zet de oefeningen open wanneer je eraan mag beginnen.')); }
}
async function start(u){
  if(started) return; started = true;
  user = u;
  const email = u.email.toLowerCase();
  let rol = 'leerling', groepen = [];
  try{ rol = await rolVan(email); }catch(e){}
  userChip(u, rol);
  B.dataset.rol = rol;
  if(rol === 'leerling'){
    try{ groepen = await groepenVan(email); }catch(e){ console.warn('Groepen ophalen mislukt', e); }
  }
  resolveKlaar({ user:u, email, rol, groepen });
  if(rol === 'leerling') tegelsFilteren(groepen);
  if(!PREFIX || !INHOUD) return;

  /* zichtbaarheid van deze site */
  if(rol === 'leerling'){
    if(!groepen.length){ melding('<b>Je bent nog niet ingedeeld in een groep.</b> Vraag het aan je leerkracht.'); return; }
    const z = zichtbaarheid(groepen, site);
    if(!z.open){ melding('<b>Deze module staat nog niet open.</b> Je leerkracht zet ze open wanneer je eraan mag beginnen.'); return; }
    window.CL_VERBORGEN = z.uit;
  } else {
    const m = document.querySelector('.info-box');
    if(m) m.insertAdjacentElement('afterend', el('div', 'tip lk-tip', '<div>Je bekijkt deze module als <b>' + rol + '</b>: je ziet altijd alle onderdelen. Leerlingen zien enkel wat jij openzet in het dashboard.</div>'));
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

