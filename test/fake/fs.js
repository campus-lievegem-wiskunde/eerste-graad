const DEL={__del:1};
const AU=(...v)=>({__au:v}), AR=(...v)=>({__ar:v});
function store(){ try{ return JSON.parse(localStorage.getItem('__fakedb')||'{}'); }catch(e){ return {}; } }
function save(d){ Storage.prototype.setItem.call(localStorage,'__fakedb',JSON.stringify(d)); }
/* zoals de echte Firestore: een lijst mag geen lijst bevatten */
function nested(v,inArr){ if(Array.isArray(v)){ if(inArr) return true; return v.some(x=>nested(x,true)); } if(v&&typeof v==='object') return Object.values(v).some(x=>nested(x,false)); return false; }
function check(p,r){ if(nested(p,false)) throw Object.assign(new Error('Function setDoc() called with invalid data. Nested arrays are not supported (found in document '+r.path+')'),{code:'invalid-argument'}); }
function apply(d,k,v){
  if(v&&v.__del){ delete d[k]; return; }
  if(v&&v.__au){ d[k]=[...new Set([...(d[k]||[]),...v.__au])]; return; }
  if(v&&v.__ar){ d[k]=(d[k]||[]).filter(x=>!v.__ar.includes(x)); return; }
  if(k.includes('.')){ const [a,b]=k.split('.'); d[a]=d[a]||{}; d[a][b]=v; return; }
  d[k]=v;
}
export function getFirestore(){ return {}; }
export function doc(db,...parts){ return {path:parts.join('/'), id:parts[parts.length-1]}; }
export function collection(db,...parts){ return {col:parts.join('/')}; }
export function where(f,op,v){ return {f,op,v}; }
export function query(c,...w){ return {col:c.col,w}; }
export function deleteField(){ return DEL; }
export const arrayUnion=AU, arrayRemove=AR;
export function serverTimestamp(){ return 'TS'; }
/* window.__getDocFout = n: de volgende n keer mislukt getDoc van een voortgangsdocument (zoals bij trage wifi) */
export async function getDoc(r){ if(window.__getDocFout>0 && r.path.startsWith('voortgang/')){ window.__getDocFout--; throw Object.assign(new Error('Failed to get document because the client is offline.'),{code:'unavailable'}); } const d=store()[r.path]; return {exists:()=>!!d, data:()=>d, id:r.id}; }
function docsVan(q){ const all=store(); const col=q.col; const out=[];
  for(const [p,d] of Object.entries(all)){ const i=p.lastIndexOf('/'); const c=p.slice(0,i), id=p.slice(i+1); if(c!==col) continue;
    if((q.w||[]).every(w=> w.op==='=='? d[w.f]===w.v : w.op==='in'? w.v.includes(d[w.f]) : w.op==='array-contains'? (d[w.f]||[]).includes(w.v) : true)) out.push({id,data:()=>d,ref:{path:p,id}}); }
  return out; }
export async function getDocs(q){ const docs=docsVan(q); return {docs, size:docs.length, empty:!docs.length, forEach:f=>docs.forEach(f)}; }
export async function setDoc(r,p,o){ check(p,r); const all=store(); const d=(o&&o.merge)?(all[r.path]||{}):{}; for(const [k,v] of Object.entries(p)){ if(v && typeof v==='object' && !Array.isArray(v) && !v.__del && !v.__au && !v.__ar && d[k] && typeof d[k]==='object' && !Array.isArray(d[k])){ for(const [kk,vv] of Object.entries(v)){ if(vv&&vv.__del) delete d[k][kk]; else d[k][kk]=vv; } } else apply(d,k,v); } all[r.path]=d; save(all); }
export async function updateDoc(r,p){ check(p,r); const all=store(); const d=all[r.path]; if(!d) throw new Error('not found '+r.path); for(const [k,v] of Object.entries(p)) apply(d,k,v); save(all); }
export async function deleteDoc(r){ const all=store(); delete all[r.path]; save(all); }
export function writeBatch(){ const ops=[]; return { set(r,d,o){ ops.push([r,d,o]); }, delete(r){ ops.push([r,null]); }, async commit(){ for(const [r,d,o] of ops){ if(d===null) await deleteDoc(r); else await setDoc(r,d,o); } } }; }
export function onSnapshot(r,cb){ let last;
  if(r.col!==undefined){ const tick=()=>{ const docs=docsVan(r); const j=JSON.stringify(docs.map(d=>[d.id,d.data()])); if(j!==last){ last=j; cb({docs, size:docs.length, empty:!docs.length, forEach:f=>docs.forEach(f)}); } }; tick(); const t=setInterval(tick,200); return ()=>clearInterval(t); }
  const tick=()=>{ const d=store()[r.path]; const j=JSON.stringify(d===undefined?null:d); if(j!==last){ last=j; cb({exists:()=>!!d, data:()=>d, id:r.id}); } }; tick(); const t=setInterval(tick,200); return ()=>clearInterval(t); }
