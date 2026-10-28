/* Test van het tabblad Leerlingen van een groep: Uit groep en Verplaatsen naar.
   node test/uitgroep.js   (eerst test/serve.sh) */
const path = require('path'); const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const JER = { uid:'jer', email:'dejaeger.jeroen@svsl.be', displayName:'Jeroen' };
  const p0 = await H.pagina(ctx, { 'beheerders/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' }, 'leerkrachten/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' } });
  await H.aanmelden(p0, 'dashboard/', JER);
  await p0.setInputFiles('input[type=file]', path.join(__dirname, 'voorbeeld.xlsx')); await p0.waitForTimeout(600);
  await p0.click('text=Importeren'); await p0.waitForTimeout(3000);
  let db = await H.fakedb(p0);
  db['groepen/1ANg1'].leerkrachten = [JER.email]; db['groepen/1ANg2a'].leerkrachten = [JER.email];
  const p = await H.pagina(ctx, db); await H.aanmelden(p, 'dashboard/', JER); await p.waitForTimeout(800);
  if(await p.locator('.tab:text-is("Mijn groepen")').count()){ await p.click('.tab:text-is("Mijn groepen")'); await p.waitForTimeout(400); }
  await p.click('.chip-btn:has-text("1ANg1")'); await p.waitForTimeout(300);
  await p.click('.tab:text-is("Leerlingen")'); await p.waitForTimeout(800);
  const voor = db['groepen/1ANg1'].leerlingen.length;
  const rijen = ()=>p.locator('table.dt tbody tr');
  check(await rijen().count() === voor, `${voor} leerlingen in 1ANg1`);
  /* Uit groep */
  await rijen().first().locator('button:text-is("Uit groep")').click(); await p.waitForTimeout(700);
  db = await H.fakedb(p);
  check(db['groepen/1ANg1'].leerlingen.length === voor - 1, 'Uit groep: bewaard in de database');
  check(await rijen().count() === voor - 1, 'Uit groep: lijst meteen bijgewerkt');
  check((await p.locator('h3', { hasText:'Leerlingen in 1ANg1' }).innerText()).includes(`(${voor - 1})`), 'Uit groep: teller bijgewerkt');
  /* Verplaatsen naar (de bovenste rij in de alfabetische lijst) */
  const naam = (await rijen().first().locator('td').first().innerText()).trim();
  await rijen().first().locator('select').selectOption({ label:'1ANg2a' }); await p.waitForTimeout(800);
  db = await H.fakedb(p);
  const weg = Object.keys(db).filter(k=>k.startsWith('leerlingen/')).map(k=>k.slice(11)).filter(x=>!db['groepen/1ANg1'].leerlingen.includes(x) && db['groepen/1ANg2a'].leerlingen.includes(x));
  check(db['groepen/1ANg1'].leerlingen.length === voor - 2, 'Verplaatsen: uit 1ANg1 gehaald');
  check(weg.some(x=>naam.includes(db['leerlingen/' + x].familienaam)), `Verplaatsen: ${naam} zit nu in 1ANg2a`);
  check(await rijen().count() === voor - 2, 'Verplaatsen: lijst meteen bijgewerkt');
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
