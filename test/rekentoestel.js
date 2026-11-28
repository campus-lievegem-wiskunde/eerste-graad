/* Rekentoestel TI-30XB (gedeeld/ti30xb.js, pagina rekentoestel/), met de nep-Firebase.
   node test/rekentoestel.js   (eerst test/serve.sh)
   Pijltjes: elk kwart van het ronde pad is klikbaar; mode, ▼, ▶, enter zet SCI aan en de cursor is een kader.
   Volledig scherm: knop op de pagina en in het zwevende venster, het toestel vult de schermhoogte,
   uit met de knop Sluiten of Esc, daarna staat het toestel terug op zijn plaats met zijn oude grootte. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const p = await H.pagina(ctx);
  await p.setViewportSize({ width:1366, height:768 });
  await p.goto(H.B + 'rekentoestel/'); await p.waitForSelector('#calc .ti30');
  const key = c => p.evaluate(c=>document.querySelector(`#calc button[data-code="${c}"]`).click(), c);
  /* pijltjes: klik op verschillende plaatsen in elk kwart */
  await p.locator('#calc .pad').scrollIntoViewIfNeeded();
  const pad = await p.locator('#calc .pad').boundingBox();
  const hit = (fx, fy) => p.evaluate(([x, y])=>{ const e = document.elementFromPoint(x, y), k = e && e.closest('button'); return k ? k.dataset.code : null; }, [pad.x + pad.width * fx, pad.y + pad.height * fy]);
  const zones = { up:[[.5,.1],[.3,.2],[.7,.2],[.5,.3]], down:[[.5,.9],[.3,.8],[.7,.8],[.5,.7]], left:[[.06,.5],[.15,.35],[.15,.65],[.3,.5]], right:[[.94,.5],[.85,.35],[.85,.65],[.7,.5]] };
  for(const [code, pts] of Object.entries(zones)){ const r = []; for(const [x, y] of pts) r.push(await hit(x, y)); check(r.every(c=>c === code), `pijltje ${code}: overal in zijn kwart klikbaar (${r.join(', ')})`); }
  /* mode → SCI met echte muisklikken in de kwarten */
  await key('mode');
  await p.mouse.click(pad.x + pad.width * .5, pad.y + pad.height * .8);
  await p.mouse.click(pad.x + pad.width * .85, pad.y + pad.height * .5);
  const kader = await p.evaluate(()=>{ const s = document.querySelector('#calc .lcd .blink'); return s && { t:s.textContent, bs:getComputedStyle(s).boxShadow }; });
  check(kader && kader.t === 'SCI' && /inset/.test(kader.bs), 'cursor staat op SCI met een kader');
  await key('enter'); await key('clear');
  for(const c of ['1','2','3','enter']) await key(c);
  const scr = await p.evaluate(()=>document.querySelector('#calc .lcd').textContent);
  check(/SCI/.test(scr) && /1\.23×102/.test(scr.replace(/\s/g, '')), 'SCI aan: 123 geeft 1.23×10²');
  await key('mode'); await key('down'); await key('left'); await key('enter'); await key('clear');
  check(!/SCI/.test(await p.evaluate(()=>document.querySelector('#calc .ind').textContent)), 'terug naar NORM');
  /* uitleg */
  check(await p.evaluate(()=>/bevestig met enter/.test(document.querySelector('.rt-info').textContent)), 'uitleg: mode, kies met de pijltjes en bevestig met enter');
  /* volledig scherm op de pagina */
  const fs0 = await p.evaluate(()=>getComputedStyle(document.querySelector('#calc .ti30')).fontSize);
  await p.click('#vol'); await p.waitForTimeout(300);
  let st = await p.evaluate(()=>{ const t = document.querySelector('.ti30-stage .ti30'); const r = t && t.getBoundingClientRect(); return { in:!!t, h:r && r.height, vol:!!document.fullscreenElement }; });
  check(st.in && st.h > 768 * .8 && st.h <= 768, `volledig scherm: toestel vult de hoogte (${Math.round(st.h)} van 768 px)`);
  await p.evaluate(()=>document.querySelector('.ti30-stage button[data-code="8"]').click());
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  st = await p.evaluate(()=>({ stage:!!document.querySelector('.ti30-stage'), terug:!!document.querySelector('#calc .ti30'), fs:getComputedStyle(document.querySelector('#calc .ti30')).fontSize, scr:document.querySelector('#calc .lcd').textContent }));
  check(!st.stage && st.terug && st.fs === fs0, 'Esc: toestel terug op de pagina met zijn oude grootte');
  check(/8/.test(st.scr), 'wat je op volledig scherm intikte, staat er nog');
  await p.click('#vol'); await p.waitForTimeout(200); await p.click('.ti30-stage-x'); await p.waitForTimeout(200);
  check(!(await p.$('.ti30-stage')) && !!(await p.$('#calc .ti30')), 'knop Sluiten werkt ook');
  /* zwevend venster */
  await p.evaluate(()=>TI30XB.open()); await p.waitForSelector('.ti30-win .ti30-vs');
  await p.click('.ti30-vs'); await p.waitForTimeout(300);
  check(!!(await p.$('.ti30-stage .ti30')), 'zwevend venster: knop ⛶ zet het toestel op volledig scherm');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  check(!(await p.$('.ti30-stage')) && !!(await p.$('.ti30-win .ti30')), 'Esc: toestel terug in het zwevende venster');
  check(p.fouten.length === 0, 'geen fouten op de pagina: ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
