const DEL={__del:1};
const AU=(...v)=>({__au:v}), AR=(...v)=>({__ar:v});
function store(){ try{ return JSON.parse(localStorage.getItem('__fakedb')||'{}'); }catch(e){ return {}; } }
function save(d){ Storage.prototype.setItem.call(localStorage,'__fakedb',JSON.stringify(d)); }
function apply(d,k,v){
  if(v&&v.__del){ delete d[k]; return; }
  if(v&&v.__au){ d[k]=[...new Set([...(d[k]||[]),...v.__au])]; return; }
  if(v&&v.__ar){ d[k]=(d[k]||[]).filter(x=>!v.__ar.includes(x)); return; }
  if(k.includes('.')){ const [a,b]=k.split('.'); d[a]=d[a]||{}; d[a][b]=v; return; }
  d[k]=v;
}
export function getFirestore(){ return {}; }
export function doc(db,col,id){ return {path:col+'/'+id, id}; }
export function collection(db,col){ return {col}; }
export function where(f,op,v){ return {f,op,v}; }
export function query(c,...w){ return {col:c.col,w}; }
export function deleteField(){ return DEL; }
export const arrayUnion=AU, arrayRemove=AR;
export function serverTimestamp(){ return 'TS'; }
export async function getDoc(r){ const d=store()[r.path]; return {exists:()=>!!d, data:()=>d, id:r.id}; }
export async function getDocs(q){ const all=store(); const col=q.col; const out=[];

  for(const [p,d] of Object.entries(all)){ const [c,id]=p.split('/'); if(c!==col) continue;
    if((q.w||[]).every(w=> w.op==='=='? d[w.f]===w.v : w.op==='in'? w.v.includes(d[w.f]) : w.op==='array-contains'? (d[w.f]||[]).includes(w.v) : true)) out.push({id,data:()=>d,ref:{path:p,id}}); }
  return {docs:out}; }
export async function setDoc(r,p,o){ const all=store(); const d=(o&&o.merge)?(all[r.path]||{}):{}; for(const [k,v] of Object.entries(p)){ if(v && typeof v==='object' && !Array.isArray(v) && !v.__del && !v.__au && !v.__ar && d[k] && typeof d[k]==='object' && !Array.isArray(d[k])){ for(const [kk,vv] of Object.entries(v)){ if(vv&&vv.__del) delete d[k][kk]; else d[k][kk]=vv; } } else apply(d,k,v); } all[r.path]=d; save(all); }
export async function updateDoc(r,p){ const all=store(); const d=all[r.path]; if(!d) throw new Error('not found '+r.path); for(const [k,v] of Object.entries(p)) apply(d,k,v); save(all); }
export async function deleteDoc(r){ const all=store(); delete all[r.path]; save(all); }
export function writeBatch(){ const ops=[]; return { set(r,d,o){ ops.push([r,d,o]); }, delete(r){ ops.push([r,null]); }, async commit(){ for(const [r,d,o] of ops){ if(d===null) await deleteDoc(r); else await setDoc(r,d,o); } } }; }
