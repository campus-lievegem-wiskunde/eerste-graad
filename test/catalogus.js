/* Maakt gedeeld/sites.js opnieuw: per module de onderdelen en het aantal controleerbare vragen.
   Nieuwe module? Voeg in gedeeld/sites.js een element toe met id, titel, kort, jaar, rubriek, pad, prefix en onderdelen:[]
   en draai dan: test/serve.sh && node test/catalogus.js */
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
(async()=>{
  const bestand = path.join(__dirname, '..', 'gedeeld', 'sites.js');
  const { SITES } = await import(bestand + '?' + Date.now());
  const b = await chromium.launch(); const ctx = await b.newContext();
  await ctx.route(/fonts\.googleapis/, r=>r.fulfill({ contentType:'text/css', body:'' }));
  /* vaste toevalsgetallen: sommige onderdelen maken een wisselend aantal vragen (bv. roosters), zodat de telling anders elke keer kan verschillen */
  await ctx.addInitScript(()=>{ let h = 20261024; Math.random = ()=>{ h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
  /* hulppagina: laadt kop.js en inhoud.js zonder aanmelden en telt elke CLvraag */
  await ctx.route(/\/_catalogus\.html/, r=>{ const u = new URL(r.request().url()); r.fulfill({ contentType:'text/html', body:`<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../../../gedeeld/stijl.css"></head>
    <body data-site="${u.searchParams.get('site')}" data-prefix="${u.searchParams.get('prefix')}" data-stroom="${u.searchParams.get('stroom') || 'A'}"><header class="top"><h1>t</h1></header><div class="shell"><nav class="side"><ol id="nav"></ol></nav><main id="main"><div id="app"></div><div class="pager" id="pager"></div></main></div>
    <script>window.__ids=[]; window.CL={ vraag:id=>__ids.push(id), res(){}, toets(){} };</script>
    <script src="../../../gedeeld/ti30xb.js"></script><script src="../../../gedeeld/kop.js"></script><script src="inhoud.js"></script></body></html>` }); });
  const uit = []; let fouten = 0;
  for(const s of SITES){
    const p = await ctx.newPage(); const fout = []; p.on('pageerror', e=>fout.push(e.message));
    await p.goto(`http://localhost:8765/${s.pad}_catalogus.html?site=${s.id}&prefix=${s.prefix}&stroom=${/B$/.test(s.jaar || '') ? 'B' : 'A'}`); await p.waitForTimeout(800);
    const secs = await p.evaluate(()=>SECTIONS.map(x=>({ id:x.id, naam:x.nav, toets:/^toets/.test(x.id) })));
    for(const sec of secs) await p.evaluate(id=>show(id, false), sec.id);
    await p.waitForTimeout(300);
    const ids = await p.evaluate(()=>[...new Set(__ids)]);
    const lang = [...secs].sort((a, c)=>c.id.length - a.id.length); secs.forEach(x=>x.vragen = 0);
    ids.forEach(id=>{ const sec = lang.find(x=>id.startsWith(x.id + '_')); if(sec) sec.vragen++; });
    uit.push(Object.assign({}, s, { onderdelen:secs })); console.log(s.id, secs.length + ' onderdelen', ids.length + ' vragen', fout.slice(0, 2).join(' | ')); await p.close();
    if(fout.length || !secs.length){ fouten++; console.log('NIET OK', s.id, fout.length ? 'JavaScript-fouten' : 'geen onderdelen'); }
  }
  fs.writeFileSync(bestand, '/* Overzicht van alle sites en hun onderdelen (automatisch gemaakt met test/catalogus.js).\n   Een nieuwe site: hier toevoegen met onderdelen:[] en het script opnieuw draaien. vragen = aantal controleerbare vragen per onderdeel. */\nexport const SITES = ' + JSON.stringify(uit, null, 1) + ';\n');
  await b.close(); process.exit(fouten ? 1 : 0);
})();
