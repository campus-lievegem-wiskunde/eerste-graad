/* Aanmelden met het schoolaccount en voortgang bewaren in Firebase.
   Een oefenpagina zet op <body>: data-site="m1" data-prefix="m1_herh_v2_" data-inhoud="inhoud.js".
   Volgorde: aanmelden → voortgang ophalen → inhoud.js laden → wijzigingen om de 30 s doorsturen. */
const V = '10.12.2';
const [{ initializeApp }, A, F, C] = await Promise.all([
  import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
  import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
  import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  import('./firebase-config.js')
]);
const app = initializeApp(C.firebaseConfig);
const auth = A.getAuth(app);
const db = F.getFirestore(app);
const B = document.body, site = B.dataset.site || 'site', PREFIX = B.dataset.prefix || null, INHOUD = B.dataset.inhoud || null;
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const ls = { get:k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, keys:()=>{ try{ return Object.keys(localStorage); }catch(e){ return []; } } };
const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;

/* ---------- aanmeldscherm ---------- */
const main = document.querySelector('main') || document.body;
const gate = el('div', 'login-gate', `<div class="login-card">
  <h2>Meld je aan</h2>
  <p>Gebruik je schoolaccount (<b>@${C.DOMEIN}</b>). Zo wordt je werk bewaard en kan je leerkracht je voortgang zien.</p>
  <button type="button" class="btn big" id="loginBtn">Aanmelden met Google</button>
  <p class="login-msg" role="status"></p></div>`);
const msg = gate.querySelector('.login-msg');
function lock(on){ B.classList.toggle('needs-login', on); gate.hidden = !on; }
main.prepend(gate); lock(true);
const provider = new A.GoogleAuthProvider();
provider.setCustomParameters({ hd: C.DOMEIN, prompt: 'select_account' });
gate.querySelector('#loginBtn').addEventListener('click', async ()=>{
  msg.textContent = '';
  try{ await A.signInWithPopup(auth, provider); }
  catch(e){
    if(e && /popup-blocked|operation-not-supported/.test(e.code||'')) return A.signInWithRedirect(auth, provider);
    if(e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') msg.textContent = 'Aanmelden lukte niet. Probeer opnieuw.';
  }
});

/* ---------- naam en afmelden in de zijbalk ---------- */
function userChip(user){
  if(document.querySelector('.user-chip')) return;
  const naam = (user.displayName || user.email).split(' ')[0];
  const chip = el('div', 'user-chip', `<span class="u-av" aria-hidden="true">${naam.slice(0,1).toUpperCase()}</span><span class="t">Aangemeld als <b></b><button type="button" class="linkbtn">Afmelden</button></span>`);
  chip.querySelector('b').textContent = naam; chip.title = user.email;
  chip.querySelector('button').addEventListener('click', afmelden);
  const nav = document.querySelector('nav.side');
  if(nav){ const ol = nav.querySelector('ol'); nav.insertBefore(chip, ol); }
  else { const bar = document.querySelector('.tts-bar'); (bar || main).prepend(chip); }
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
  const payload = { email:user.email, naam:user.displayName || '', site, schooljaar:C.SCHOOLJAAR, bijgewerkt:F.serverTimestamp(), data };
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
async function start(u){
  if(started) return; started = true;
  user = u; userChip(u);
  if(!PREFIX || !INHOUD){ return; }
  ref = F.doc(db, 'voortgang', `${u.uid}_${site}`);
  /* gedeelde Chromebook: wis wat een vorige leerling hier achterliet */
  if(ls.get('cl_uid') !== u.uid){ wipeLocal(); try{ rawSet.call(localStorage, 'cl_uid', u.uid); }catch(e){} }
  try{
    const snap = await F.getDoc(ref);
    if(snap.exists()){
      const d = snap.data();
      Object.entries(d.data || {}).forEach(([k, v])=>{ if(typeof v === 'string') rawSet.call(localStorage, PREFIX + k, v); });
      tijd = Object.assign({}, d.tijd || {});
    }
  }catch(e){ console.warn('Voortgang ophalen mislukt; ik werk verder met wat op dit toestel staat', e); }
  /* wat lokaal stond maar nog niet in Firebase: meteen doorsturen */
  ls.keys().forEach(k=>{ if(ownKey(k)) dirty.add(k); });
  watchStorage(); watchTime();
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
A.getRedirectResult(auth).catch(()=>{});
