/* Test: leerling met een koppelteken in het e-mailadres (oktober 2026).
   Staat het adres zonder koppelteken in de groep, dan ziet ze niets en toont de melding haar echte adres.
   Staat het adres juist (met koppelteken) in de groep, dan ziet ze de module. Ook: nieuwe leerling met eigen e-mailadres.
   node test/koppelteken.js   (eerst test/serve.sh) */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const ECHT = 'vandamme-peeters.lisa@svsl.be', FOUT = 'vandammepeeters.lisa@svsl.be';
  const LISA = { uid:'lisa', email:'Vandamme-Peeters.Lisa@svsl.be', displayName:'Lisa Vandamme-Peeters' };
  const groep = lln => ({ 'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', leerkrachten:[], leerlingen:lln, aan:{ m1:{ on:true, uit:[] } } } });
  /* 1. adres zonder koppelteken in de groep (zoals maakMail het vroeger maakte) */
  let p = await H.pagina(ctx, groep([FOUT]));
  await H.aanmelden(p, '1A/modules/', LISA); await p.waitForTimeout(500);
  check(!(await p.locator('a.tegel[data-site="m1"]:visible').count()), 'fout adres: tegel van module 1 verborgen');
  check((await p.locator('.tegels .leeg').innerText()).includes(ECHT), 'fout adres: melding toont het echte adres');
  await p.goto(H.B + '1A/modules/module-1-getallen/'); await p.waitForTimeout(800);
  check((await p.locator('.melding').innerText()).includes(ECHT), 'fout adres: melding in de module toont het echte adres');
  /* 2. adres met koppelteken in de groep */
  p = await H.pagina(ctx, groep([ECHT]));
  await H.aanmelden(p, '1A/modules/', LISA); await p.waitForTimeout(500);
  check(await p.locator('a.tegel[data-site="m1"]:visible').count() === 1, 'juist adres: tegel van module 1 zichtbaar');
  await p.goto(H.B + '1A/modules/module-1-getallen/'); await p.waitForTimeout(1200);
  check(!(await p.locator('.melding').count()) && await p.locator('nav.side ol li').count() > 0, 'juist adres: module opent');
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  /* 3. nieuwe leerling met eigen e-mailadres in het dashboard */
  const JER = { uid:'jer', email:'dejaeger.jeroen@svsl.be', displayName:'Jeroen' };
  p = await H.pagina(ctx, { 'beheerders/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' }, 'leerkrachten/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' } });
  await H.aanmelden(p, 'dashboard/', JER); await p.waitForTimeout(800);
  if(!(await p.locator('h4:text-is("Nieuwe leerling toevoegen")').count())){ await p.click('.tab:text-is("Beheer")'); await p.waitForTimeout(600); }
  const rij = p.locator('h4:text-is("Nieuwe leerling toevoegen") + .rij');
  await rij.locator('input').nth(0).fill('Vandamme-Peeters'); await rij.locator('input').nth(1).fill('Lisa'); await rij.locator('input').nth(2).fill('1e');
  await rij.locator('input').nth(3).fill('Vandamme-Peeters.Lisa@svsl.be'); await rij.locator('button').click(); await p.waitForTimeout(500);
  let db = await H.fakedb(p); check(!!db['leerlingen/' + ECHT], 'nieuwe leerling bewaard onder het ingevulde adres');
  await rij.locator('input').nth(0).fill('Peeters'); await rij.locator('input').nth(1).fill('Jan'); await rij.locator('input').nth(2).fill('1F'); await rij.locator('button').click(); await p.waitForTimeout(500);
  db = await H.fakedb(p); check(!!db['leerlingen/peeters.jan@svsl.be'], 'zonder adres: familienaam.voornaam@svsl.be');
  await rij.locator('input').nth(0).fill('Peeters'); await rij.locator('input').nth(1).fill('An'); await rij.locator('input').nth(2).fill('1F'); await rij.locator('input').nth(3).fill('an@gmail.com'); await rij.locator('button').click(); await p.waitForTimeout(400);
  db = await H.fakedb(p); check(!db['leerlingen/an@gmail.com'] && /svsl/.test(await rij.locator('.errmsg').innerText()), 'ander domein geweigerd');
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
