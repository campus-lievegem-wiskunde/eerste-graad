/* 2A Module 6 (veeltermen vermenigvuldigen): elke vraag met een veeltermvak, termvak of tekenvak aanvaardt haar eigen oplossing,
   en elk onderdeel opent zonder JavaScript-fouten, ook na een nieuwe opgave.
   node test/veeltermen2a.js   (eerst test/serve.sh) */
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const ctx = await b.newContext(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  await ctx.route(/fonts\.googleapis/, r=>r.fulfill({ contentType:'text/css', body:'' }));
  await ctx.route(/\/_test6\.html/, r=>r.fulfill({ contentType:'text/html', body:`<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../../../gedeeld/stijl.css"></head>
    <body data-site="2a-m6" data-prefix="2a_m6_product_v1_"><header class="top"><h1>t</h1></header><div class="shell"><nav class="side"><ol id="nav"></ol></nav><main id="main"><div id="app"></div><div class="pager" id="pager"></div></main></div>
    <script>window.__M4TEST = []; window.__VPREC = new WeakMap(); window.CL = { vraag(){}, res(){}, toets(){} };</script>
    <script src="../../../gedeeld/kop.js"></script><script src="inhoud.js"></script></body></html>` }));
  for(let ronde = 0; ronde < 8; ronde++){
    const p = await ctx.newPage(); const fout = []; p.on('pageerror', e=>fout.push(e.message)); p.on('console', m=>{ if(m.type()==='error') fout.push(m.text()); });
    const url = 'http://localhost:8765/2A/modules/module-6-veeltermen-vermenigvuldigen/_test6.html';
    await p.goto(url); await p.evaluate(()=>localStorage.clear()); await p.goto(url); await p.waitForTimeout(400);
    const res = await p.evaluate(()=>{
      SECTIONS.forEach(s=>show(s.id, false)); document.querySelectorAll('.tabpane').forEach(x=>x.hidden = false);
      const bouw = (k, d) => k==='z' ? {s:d} : {r:[{b:EX.parse(PV.str(PV.sort(d)))}]};
      const uit = { n:0, mis:[], over:[] };
      for(const t of __M4TEST){
        const keys = [...String(t.html).matchAll(/\{\{(\w):(\w+)/g)].map(m=>[m[1], m[2]]);
        if(!keys.length) continue; const V = {}; keys.forEach(([, k])=>V[k] = {}); const klaar = new Set();
        for(let i = 0; i < 4; i++){ try{ t.check(V); }catch(e){}
          keys.forEach(([ty, k])=>{ if(klaar.has(k)) return; const r = __VPREC.get(V[k]); if(r){ V[k] = bouw(r.k, r.d); klaar.add(k); } }); }
        const vreemd = keys.filter(([, k])=>!klaar.has(k)); if(vreemd.length){ uit.over.push(t.id + ' ' + vreemd.map(x=>x.join(':')).join(',')); continue; }
        let r; try{ r = t.check(V); }catch(e){ r = { msg:'fout: ' + e.message }; }
        uit.n++; if(!r || !r.ok) uit.mis.push(t.id + ' → ' + JSON.stringify(r).slice(0, 200));
      }
      return uit; });
    check(res.mis.length === 0, `ronde ${ronde+1}: ${res.n} vragen aanvaarden hun eigen oplossing` + (res.mis.length ? '\n  ' + res.mis.join('\n  ') : ''));
    if(res.over.length) console.log('     zonder automatische oplossing: ' + res.over.join(' | '));
    check(!fout.length, `ronde ${ronde+1}: geen JavaScript-fouten ` + fout.slice(0, 3).join(' | '));
    await p.close();
  }
  /* boogjes bij Werk uit en herleid: eerst tekenen, bij a) en b) schrijft elk boogje zijn product in de tussenstap, bij c) en d) niet */
  { const p = await ctx.newPage(); const fout = []; p.on('pageerror', e=>fout.push(e.message));
    const url = 'http://localhost:8765/2A/modules/module-6-veeltermen-vermenigvuldigen/_test6.html';
    await p.goto(url); await p.evaluate(()=>localStorage.clear()); await p.goto(url); await p.waitForTimeout(400);
    await p.evaluate(()=>show('vv', false)); await p.waitForTimeout(300);
    const k = p.locator('.card', { has:p.locator('.card-head h3', { hasText:'Werk uit en herleid' }) }).first();
    const qa = k.locator('.m4-q').nth(0), qc = k.locator('.m4-q').nth(2);
    check(!(await qa.locator('.m4-wp').isVisible()), 'boogjes: het vrije vak wacht tot de boogjes getekend zijn');
    const B = qa.locator('.m6-bg-b'); const nb = await B.count(), na = await qa.locator('.m6-bg-a').count();
    for(let i = 0; i < na; i++) for(let j = 0; j < nb; j++) await B.nth(j).click();
    const uit = (await qa.locator('.m6-bg-uit').innerText()).replace(/\s+/g, ' ');
    const verwacht = await p.evaluate(()=>{ const c = [...document.querySelectorAll('.card')].find(x=>x.querySelector('h3').textContent.startsWith('Werk uit en herleid'));
      const t = [...c.querySelectorAll('.m4-q')][0].querySelector('.sol .m4-is').nextElementSibling.textContent; return t.replace(/\s+/g, ' ').trim(); });
    check(await qa.locator('.m4-wp').isVisible() && uit.includes(verwacht), `boogjes: ${na * nb} boogjes schrijven de tussenstap (${uit})`);
    check(await qa.locator('.m6-bg-svg path').count() === 2 * na * nb, 'boogjes: elk boogje is getekend');
    check(await qc.locator('.m6-bg-uit').count() === 0 && !(await qc.locator('.m4-wp').isVisible()), 'boogjes: bij c) geen tussenstap van de boogjes, vrij vak wacht');
    await p.reload(); await p.waitForTimeout(400); await p.evaluate(()=>show('vv', false)); await p.waitForTimeout(300);
    check(await k.locator('.m4-q').nth(0).locator('.m4-wp').isVisible(), 'boogjes: blijven bewaard na herladen');
    check(!fout.length, 'boogjes: geen JavaScript-fouten ' + fout.slice(0, 3).join(' | '));
    await p.close(); }
  await b.close(); process.exit(ok ? 0 : 1);
})();
