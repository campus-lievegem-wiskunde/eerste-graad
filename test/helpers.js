/* Gemeenschappelijk voor de testscripts: een browsercontext waarin Firebase vervangen is door test/fake/. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const B = 'http://localhost:8765/';
/* SheetJS lokaal (cdnjs is vaak niet bereikbaar in de testomgeving): npm i xlsx, of XLSX_PAD=/pad/naar/xlsx.full.min.js */
function xlsxPad(){ if(process.env.XLSX_PAD) return process.env.XLSX_PAD;
  try{ return require.resolve('xlsx/dist/xlsx.full.min.js', { paths:[process.cwd(), __dirname, '/opt/npm-tools/node_modules'] }); }catch(e){ return null; } }
async function context(opts = {}){
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{ width:opts.breedte || 1280, height:1000 } });
  const fake = n => fs.readFileSync(path.join(__dirname, 'fake', n + '.js'), 'utf8');
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/firebase-(app|auth|firestore)\.js/, r=>{ const m = r.request().url().match(/firebase-(app|auth|firestore)/)[1]; r.fulfill({ contentType:'text/javascript', body:fake({ app:'app', auth:'auth', firestore:'fs' }[m]) }); });
  const x = xlsxPad(); if(x) await ctx.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx/, r=>r.fulfill({ contentType:'text/javascript', body:fs.readFileSync(x, 'utf8') }));
  await ctx.route(/fonts\.googleapis/, r=>r.fulfill({ contentType:'text/css', body:'' }));
  return { b, ctx };
}
/* nieuwe pagina met een lege nep-database (optioneel met startdocumenten) */
async function pagina(ctx, db = {}){
  const p = await ctx.newPage(); p.fouten = []; p.on('pageerror', e=>p.fouten.push(e.message)); p.on('dialog', d=>d.accept());
  await p.goto(B); await p.evaluate(d=>{ localStorage.clear(); sessionStorage.clear(); localStorage.setItem('__fakedb', JSON.stringify(d)); }, db);
  return p;
}
async function aanmelden(p, url, gebruiker){ await p.goto(B + url); await p.evaluate(u=>{ window.__nextUser = u; }, gebruiker); await p.click('#loginBtn'); await p.waitForTimeout(900); }
const fakedb = p => p.evaluate(()=>JSON.parse(localStorage.getItem('__fakedb') || '{}'));
module.exports = { B, context, pagina, aanmelden, fakedb };
