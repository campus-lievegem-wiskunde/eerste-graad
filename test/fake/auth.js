let cbs=[]; let cur=null;
try{ const u=sessionStorage.getItem('fake_user'); if(u) cur=JSON.parse(u); }catch(e){}
export function getAuth(){ return {}; }
export class GoogleAuthProvider{ setCustomParameters(p){ this.p=p; } }
export function onAuthStateChanged(a,cb){ cbs.push(cb); setTimeout(()=>cb(cur),50); }
export async function signInWithPopup(){ cur=window.__nextUser||{uid:'u1',email:'jan.peeters@svsl.be',displayName:'Jan Peeters'}; sessionStorage.setItem('fake_user',JSON.stringify(cur)); cbs.forEach(c=>c(cur)); return {user:cur}; }
export async function signInWithRedirect(){}
export async function getRedirectResult(){ return null; }
export async function signOut(){ cur=null; sessionStorage.removeItem('fake_user'); cbs.forEach(c=>c(null)); }
