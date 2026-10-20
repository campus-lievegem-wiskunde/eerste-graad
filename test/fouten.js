/* Test van Fout melden (leerkracht) en Fouten (beheer) met de nep-Firebase.
   node test/fouten.js   (eerst test/serve.sh); schermafbeeldingen met SCHERM=map */
const H = require('./helpers'); const path = require('path');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const shot = async (p, n)=>{ if(process.env.SCHERM) await p.screenshot({ path:path.join(process.env.SCHERM, n + '.png'), fullPage:true }); };
  const JER = { uid:'jer', email:'dejaeger.jeroen@svsl.be', displayName:'Jeroen' }, FRA = { uid:'fra', email:'vanparijs.frank@svsl.be', displayName:'Frank' };
  const start = { 'beheerders/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' }, 'leerkrachten/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' }, 'leerkrachten/vanparijs.frank@svsl.be':{ naam:'Frank Van Parijs' } };
  const { SITES } = await import('../gedeeld/sites.js'); const m1 = SITES.find(s=>s.id === 'm1'); const ond = m1.onderdelen[1];
  /* leerkracht in een module: snelkoppeling Fout melden neemt module en onderdeel mee */
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, m1.pad, FRA); await p.evaluate(([k, v])=>localStorage.setItem(k, v), [m1.prefix + 'tab', ond.id]);
  await p.click('.user-chip .fout-link'); await p.waitForURL(/dashboard/); await p.waitForTimeout(900);
  check(await p.locator('#f-site').inputValue() === 'm1' && await p.locator('#f-ond').inputValue() === ond.id, `module en onderdeel ingevuld (${ond.naam})`);
  await p.click('text=Melding versturen'); check(await p.locator('.errmsg').count() > 0, 'lege melding wordt geweigerd');
  await p.fill('#f-waar', 'kaart 2, vraag c'); await p.fill('#f-fout', 'De oplossing zegt 12, maar 3 × 5 = 15.'); await p.fill('#f-alt', 'Oplossing 15.');
  await p.click('text=Melding versturen'); await p.waitForTimeout(500);
  let db = await H.fakedb(p); const f = Object.entries(db).filter(([k])=>k.startsWith('fouten/'));
  check(f.length === 1 && f[0][1].melder === FRA.email && f[0][1].status === 'nieuw' && f[0][1].onderdeel === ond.id, 'melding bewaard in fouten/');
  check(/Bedankt/.test(await p.locator('main').innerText()) && await p.locator('.fout-item').count() === 1, 'leerkracht ziet zijn melding');
  check(!(await p.locator('.tab', { hasText:'Beheer' }).count()), 'gewone leerkracht ziet geen Beheer');
  await shot(p, 'fout-melden');
  /* beheerder: tabblad Fouten met teller, status en reactie */
  const q = await H.pagina(ctx, db); await H.aanmelden(q, 'dashboard/', JER); await q.waitForTimeout(500);
  await q.click('.tab:text-is("Beheer")'); check(/Fouten\s*1/.test(await q.locator('.tabs .tab', { hasText:'Fouten' }).innerText()), 'teller 1 nieuwe melding');
  await q.click('.tab:has-text("Fouten")'); check(await q.locator('.fout-item').count() === 1 && /Frank Van Parijs/.test(await q.locator('.fout-item').innerText()), 'beheer ziet melding met melder');
  await shot(q, 'fouten-beheer');
  await q.locator('.fout-item select').selectOption('opgelost'); await q.fill('.fout-re', 'Aangepast, bedankt!'); await q.click('.fout-item >> text=Bewaren'); await q.waitForTimeout(400);
  db = await H.fakedb(q); const g = Object.entries(db).find(([k])=>k.startsWith('fouten/'))[1];
  check(g.status === 'opgelost' && g.reactie === 'Aangepast, bedankt!', 'status en reactie bewaard');
  check(await q.locator('.fout-item').count() === 0, 'opgeloste melding verdwijnt uit filter "Nieuw en in behandeling"');
  /* leerkracht ziet reactie en kan niet meer intrekken */
  const r = await H.pagina(ctx, db); await H.aanmelden(r, 'dashboard/', FRA); await r.click('.tab:text-is("Fout melden")'); await r.waitForTimeout(400);
  check(/Aangepast, bedankt!/.test(await r.locator('.fout-item').innerText()) && !(await r.locator('text=Melding intrekken').count()), 'leerkracht ziet reactie, intrekken niet meer mogelijk');
  await r.setViewportSize({ width:400, height:900 }); await shot(r, 'fout-melden-400');
  check(![...p.fouten, ...q.fouten, ...r.fouten].length, 'geen JavaScript-fouten ' + [...p.fouten, ...q.fouten, ...r.fouten].join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
