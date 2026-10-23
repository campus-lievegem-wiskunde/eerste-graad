/* Test van Beheer, "Site openzetten voor alle groepen van een jaar": aan en uit voor alle groepen van 2A,
   de keuze per onderdeel en de rekentoestelknop blijven per groep, groepen van een ander jaar veranderen niet.
   node test/allesopen.js   (eerst test/serve.sh); schermafbeelding met SCHERM=map */
const path = require('path'); const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const JER = { uid:'jer', email:'dejaeger.jeroen@svsl.be', displayName:'Jeroen' };
  const groep = (naam, jaar, stroom, aan)=>({ naam, jaar, stroom, soort:'niveaugroep', leerkrachten:[], leerlingen:[], aan });
  const start = { 'beheerders/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' }, 'leerkrachten/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' },
    'groepen/2ANg1':groep('2ANg1', '2', 'A', {}), 'groepen/2ANg2a':groep('2ANg2a', '2', 'A', { '2a-wp':{ on:true, uit:['ver'], rt:true } }),
    'groepen/2ANg3':groep('2ANg3', '2', 'A', { '2a-wp':{ on:false, uit:['alg'] } }), 'groepen/1ANg1':groep('1ANg1', '1', 'A', {}), 'groepen/2B':groep('2B', '2', 'B', {}) };
  const p = await H.pagina(ctx, start); await H.aanmelden(p, 'dashboard/', JER); await p.waitForTimeout(800);
  await p.click('.tab:text-is("Beheer")'); await p.waitForTimeout(600);
  const k = p.locator('.dash-card', { has:p.locator('h3:text-is("Site openzetten voor alle groepen van een jaar")') });
  check(await k.count() === 1, 'kaart staat in Beheer');
  await k.locator('select').first().selectOption('2A'); await k.locator('select').nth(1).selectOption('2a-wp'); await p.waitForTimeout(200);
  check(/open in 1 van de 3 groepen van 2A \(2ANg2a\)/.test(await k.innerText()), 'stand vooraf: 1 van de 3 groepen');
  if(process.env.SCHERM) await k.screenshot({ path:path.join(process.env.SCHERM, 'alles-open.png') });
  await k.locator('button', { hasText:'Aan voor alle groepen' }).click(); await p.waitForTimeout(800);
  let db = await H.fakedb(p);
  check(['2ANg1', '2ANg2a', '2ANg3'].every(g=>db['groepen/' + g].aan['2a-wp'].on === true), 'aan voor alle groepen van 2A');
  { const a = db['groepen/2ANg2a'].aan['2a-wp']; check(a.on === true && a.rt === true && a.uit.join() === 'ver', 'verborgen onderdelen en rekentoestelknop van 2ANg2a behouden'); }
  check(db['groepen/2ANg3'].aan['2a-wp'].uit.join() === 'alg', 'verborgen onderdeel van 2ANg3 behouden');
  check(!db['groepen/1ANg1'].aan['2a-wp'] && !db['groepen/2B'].aan['2a-wp'], 'groepen van 1A en 2B ongewijzigd');
  check(/open in 3 van de 3 groepen/.test(await k.innerText()) && await k.locator('button', { hasText:'Aan voor alle groepen' }).isDisabled(), 'stand bijgewerkt, knop Aan uitgeschakeld');
  await k.locator('button', { hasText:'Uit voor alle groepen' }).click(); await p.waitForTimeout(800);
  db = await H.fakedb(p);
  check(['2ANg1', '2ANg2a', '2ANg3'].every(g=>db['groepen/' + g].aan['2a-wp'].on === false), 'uit voor alle groepen van 2A');
  check(db['groepen/2ANg2a'].aan['2a-wp'].rt === true && db['groepen/2ANg2a'].aan['2a-wp'].uit.join() === 'ver', 'na uitzetten blijft de keuze per groep bewaard');
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
