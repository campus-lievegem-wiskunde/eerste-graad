/* Test van het overzicht per groep in Beheer: namen uitklappen bij Niveaugroepen, Leerlingen zonder groep en de kolom Groep bij opzoeken.
   node test/groepsoverzicht.js   (eerst test/serve.sh); schermafbeeldingen met SCHERM=map */
const path = require('path'); const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const shot = async (p, n)=>{ if(process.env.SCHERM) await p.screenshot({ path:path.join(process.env.SCHERM, n + '.png'), fullPage:true }); };
  const JER = { uid:'jer', email:'dejaeger.jeroen@svsl.be', displayName:'Jeroen' };
  const p0 = await H.pagina(ctx, { 'beheerders/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' }, 'leerkrachten/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' } });
  await H.aanmelden(p0, 'dashboard/', JER);
  await p0.setInputFiles('input[type=file]', path.join(__dirname, 'voorbeeld.xlsx')); await p0.waitForTimeout(600);
  await p0.click('text=Importeren'); await p0.waitForTimeout(3000);
  let db = await H.fakedb(p0);
  /* twee leerlingen van 1ANg1 uit hun groep halen, zodat ze zonder groep zitten */
  const g1 = db['groepen/1ANg1']; const los = g1.leerlingen.slice(0, 2); g1.leerlingen = g1.leerlingen.slice(2);
  const p = await H.pagina(ctx, db); await H.aanmelden(p, 'dashboard/', JER); await p.waitForTimeout(800);
  if(!(await p.locator('.dash-card', { hasText:'Niveaugroepen' }).count())){ await p.click('.tab:text-is("Beheer")'); await p.waitForTimeout(600); }
  const kaart = t=>p.locator('.dash-card', { has:p.locator(`h3:text-is("${t}")`) });
  /* namen uitklappen */
  const rij = kaart('Niveaugroepen').locator('tbody tr', { has:p.locator('td:first-child:text-is("1ANg1")') });
  await rij.locator('td.c button').click(); await p.waitForTimeout(500);
  const namen = await kaart('Niveaugroepen').locator('tr.groep-namen li').allTextContents();
  check(namen.length === g1.leerlingen.length && namen.length > 0, `namen van 1ANg1 uitgeklapt (${namen.length})`);
  const l0 = db['leerlingen/' + g1.leerlingen[0]]; check(namen.some(n=>n.includes(l0.familienaam) && n.includes(l0.klas)), 'naam en klas zichtbaar');
  await shot(p, 'niveaugroepen-namen');
  await rij.locator('td.c button').click(); await p.waitForTimeout(300);
  check(!(await kaart('Niveaugroepen').locator('tr.groep-namen').count()), 'opnieuw klikken klapt dicht');
  /* leerlingen zonder groep */
  const zg = kaart('Leerlingen zonder groep'); const zgRijen = await zg.locator('tbody tr').allTextContents();
  check(zgRijen.length === 2 && los.every(e=>zgRijen.some(t=>t.includes(db['leerlingen/' + e].familienaam))), `leerlingen zonder groep: ${zgRijen.length}`);
  await shot(p, 'zonder-groep');
  await zg.locator('tbody tr').first().locator('select').selectOption({ label:'1ANg2a' }); await p.waitForTimeout(700);
  db = await H.fakedb(p); const ingedeeld = los.find(e=>db['groepen/1ANg2a'].leerlingen.includes(e));
  check(!!ingedeeld, 'indelen vanuit de lijst bewaard in de groep');
  check(await kaart('Leerlingen zonder groep').locator('tbody tr').count() === 1, 'lijst zonder groep telt nu 1');
  /* kolom Groep bij opzoeken */
  const lz = db['leerlingen/' + ingedeeld]; const zoek = kaart('Leerling opzoeken en wijzigen');
  await zoek.locator('input[type=search]').fill(lz.familienaam); await p.waitForTimeout(600);
  const hit = zoek.locator('tbody tr', { hasText:ingedeeld }); check(/1ANg2a/.test(await hit.innerText()), 'kolom Groep toont 1ANg2a');
  await zoek.locator('input[type=search]').fill(db['leerlingen/' + los.find(e=>e !== ingedeeld)].familienaam); await p.waitForTimeout(600);
  check(/geen/.test(await zoek.locator('tbody tr', { hasText:los.find(e=>e !== ingedeeld) }).innerText()), 'kolom Groep toont "geen" voor leerling zonder groep');
  await p.setViewportSize({ width:400, height:900 }); await shot(p, 'beheer-400');
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
