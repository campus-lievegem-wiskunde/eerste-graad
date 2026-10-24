/* Toetsen en taken: openzetten met instellingen, module dicht tijdens de toets, invullen en indienen, sleutelcode,
   automatisch en met de hand verbeteren, vrijgeven, resultaat bij de leerling, afdrukpagina, huistaak opnieuw maken.
   Gebruikt de voorbeelden in test/opdracht/ (sleutelcodes TEST-CODE en TAAK-CODE).   node test/opdrachten.js   (eerst test/serve.sh) */
const H = require('./helpers'); const fs = require('fs'); const path = require('path');
const UIT = process.env.SCHERMEN || null; /* map voor schermafbeeldingen (optioneel) */
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const bron = fs.readFileSync(path.join(__dirname, '..', 'gedeeld', 'opdrachten.js'), 'utf8').replace('export const OPDRACHTEN = [',
    `export const OPDRACHTEN = [ { id:'test-toets', titel:'Proeftoets voorbeeld', kort:'Proeftoets', jaar:'1A', rubriek:'toetsen', pad:'test/opdracht/toets/' },
    { id:'test-taak', titel:'Proeftaak voorbeeld', kort:'Proeftaak', jaar:'1A', rubriek:'huistaken', pad:'test/opdracht/taak/' },`);
  await ctx.route(/gedeeld\/opdrachten\.js/, r=>r.fulfill({ contentType:'text/javascript', body:bron }));
  const LK = { uid:'lk', email:'jeroen@svsl.be', displayName:'Jeroen De Jaeger' };
  const L1 = { uid:'l1', email:'an.claes@svsl.be', displayName:'An Claes' }, L2 = { uid:'l2', email:'bo.dewit@svsl.be', displayName:'Bo De Wit' };
  const start = { 'beheerders/jeroen@svsl.be':{ naam:'Jeroen' }, 'leerkrachten/jeroen@svsl.be':{ naam:'Jeroen De Jaeger' },
    'leerlingen/an.claes@svsl.be':{ familienaam:'Claes', voornaam:'An', klas:'1A3', jaar:'1', stroom:'A' },
    'leerlingen/bo.dewit@svsl.be':{ familienaam:'De Wit', voornaam:'Bo', klas:'1A4', jaar:'1', stroom:'A' },
    'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', soort:'niveau', leerkrachten:[LK.email], leerlingen:[L1.email, L2.email], aan:{ m1:{ on:true, uit:[], rt:false } } } };
  const shot = async (p, n)=>{ if(UIT) await p.screenshot({ path:path.join(UIT, n + '.png'), fullPage:true }); };
  const alsGebruiker = async (p, url, u)=>{ await p.evaluate(()=>sessionStorage.removeItem('fake_user')); await H.aanmelden(p, url, u); await p.waitForTimeout(600); };
  const p = await H.pagina(ctx, start);
  const db = ()=>H.fakedb(p);

  /* 1. niets open: de leerling ziet geen rubriektegels */
  await alsGebruiker(p, '1A/', L1);
  check(await p.locator('a.tegel[data-rubriek="toetsen"]').isHidden(), 'leerling: tegel Toetsen verborgen zolang er niets openstaat');

  /* 2. leerkracht: instellingen en Nu openen */
  await alsGebruiker(p, 'dashboard/', LK);
  await p.click('button.tab:has-text("Toetsen en taken")'); await p.waitForTimeout(300);
  const blok = p.locator('.opdr-blok', { hasText:'Proeftoets voorbeeld' });
  await blok.locator('button:has-text("Instellingen")').click();
  await blok.locator('.v-volg').check(); await p.waitForTimeout(250);
  await blok.locator('.v-ziet').selectOption('verbetering'); await p.waitForTimeout(250);
  await blok.locator('.opdr-dicht input[value="m1"]').check(); await p.waitForTimeout(250);
  await blok.locator('button:has-text("Nu openen")').click(); await p.waitForTimeout(400);
  let cfg = (await db())['groepen/1ANg1'].opdr['test-toets'];
  check(cfg && cfg.van && !cfg.tot && cfg.volgorde === true && cfg.ziet === 'verbetering' && cfg.dicht.includes('m1') && cfg.pogingen === 1, 'instellingen bewaard: ' + JSON.stringify(cfg));
  check(/open/.test(await blok.locator('.opdr-staat').textContent()), 'status toont open');
  await shot(p, '1_dashboard_toetsen');

  /* 3. leerling: tegels zichtbaar, module 1 even dicht */
  await alsGebruiker(p, '1A/', L1);
  check(await p.locator('a.tegel[data-rubriek="toetsen"]').isVisible() && await p.locator('a.tegel[data-rubriek="huistaken"]').isHidden(), 'leerling: Toetsen zichtbaar, Huistaken niet');
  await p.goto(H.B + '1A/toetsen/'); await p.waitForTimeout(900);
  check(await p.locator('a.tegel[data-opdr="test-toets"]').isVisible(), 'rubriekpagina toont de toets');
  await p.goto(H.B + '1A/modules/module-1-getallen/'); await p.waitForTimeout(1200);
  check(/even dicht/.test(await p.locator('#app').textContent()), 'module 1 is dicht tijdens de toets');

  /* 4. leerling 1 vult in en dient in */
  await p.goto(H.B + 'test/opdracht/toets/'); await p.waitForTimeout(1200);
  const vraag = id => p.locator(`.ov[data-id="${id}"]`);
  await vraag('v1').locator('input').fill('22'); await vraag('v2').locator('input[value="2"]').check();
  await vraag('v3').locator('input[value="0"]').check(); await vraag('v3').locator('input[value="2"]').check();
  await vraag('v4').locator('input').fill('Gelijkbenig'); await vraag('v5').locator('textarea').fill('Het heeft vier rechte hoeken.');
  await p.waitForTimeout(1800);
  let inz = (await db())['inzendingen/test-toets__an.claes@svsl.be'];
  check(inz && inz.antw.v1 === '22' && inz.antw.v3.join() === '0,2' && inz.volgorde && inz.volgorde.length === 5 && !inz.ingediend, 'automatisch bewaard met volgorde, nog niet ingediend');
  await shot(p, '2_leerling_invullen');
  await p.click('button:has-text("Indienen")'); await p.waitForTimeout(1500);
  inz = (await db())['inzendingen/test-toets__an.claes@svsl.be'];
  check(inz.ingediend && inz.slot === true && inz.poging === 1, 'ingediend met slot (één poging)');
  check(/Ingediend/.test(await p.locator('#app').textContent()) && !(await p.locator('.ov-inp').count()), 'na indienen: geen invulvakken meer');

  /* 5. leerling 2 begint maar dient niet in */
  await alsGebruiker(p, 'test/opdracht/toets/', L2); await p.waitForTimeout(600);
  await vraag('v1').locator('input').fill('20'); await p.waitForTimeout(1800);

  /* 6. leerkracht: sleutelcode, verbeteren, vrijgeven */
  await alsGebruiker(p, 'dashboard/', LK);
  await p.click('button.tab:has-text("Toetsen en taken")'); await p.waitForTimeout(300);
  await p.locator('.opdr-blok', { hasText:'Proeftoets voorbeeld' }).locator('button:has-text("Resultaten")').click(); await p.waitForTimeout(800);
  await p.fill('.sl-code', 'FOUT-CODE'); await p.click('button:has-text("Ontgrendel")'); await p.waitForTimeout(1500);
  check(/klopt niet/.test(await p.locator('.tip').textContent()), 'verkeerde sleutelcode geweigerd');
  await p.fill('.sl-code', 'test-code'); await p.click('button:has-text("Ontgrendel")'); await p.waitForTimeout(1800);
  check(!!(await db())['sleutels/test-toets'], 'sleutel in de databank na de juiste code');
  const rij = n => p.locator('table.opdr-tabel tbody tr', { hasText:n });
  check(/5\/8 \?/.test(await rij('Claes').locator('td').last().textContent()), 'automatisch: An 5/8, open vraag nog te verbeteren: ' + await rij('Claes').locator('td').last().textContent());
  check(/bezig/.test(await rij('De Wit').textContent()), 'Bo: bezig, niet ingediend');
  await rij('Claes').locator('.naam-btn').click(); await p.waitForTimeout(400);
  await p.locator('.detail .ov[data-id="v5"] .ov-punten input').fill('2'); await p.locator('.detail .ov[data-id="v5"] .ov-punten input').dispatchEvent('change'); await p.waitForTimeout(200);
  check(/7\/8/.test(await rij('Claes').locator('td').last().textContent()), 'met de hand: 7/8');
  await shot(p, '3_dashboard_resultaten');
  await p.click('button:has-text("Punten bewaren")'); await p.waitForTimeout(600);
  let r = (await db())['resultaten/test-toets__an.claes@svsl.be'];
  check(r && r.totaal === 7 && r.max === 8 && r.vrij === false && r.hand.includes('v5'), 'punten bewaard, nog niet vrijgegeven');
  await p.click('button:has-text("Resultaten vrijgeven")'); await p.waitForTimeout(700);
  r = (await db())['resultaten/test-toets__an.claes@svsl.be'];
  check(r.vrij === true && r.verbetering && r.verbetering.v1.p === 2, 'vrijgegeven met verbetering');

  /* 7. leerling ziet zijn resultaat */
  await alsGebruiker(p, 'test/opdracht/toets/', L1); await p.waitForTimeout(800);
  check(/7 \/ 8/.test(await p.locator('.opdr-score').textContent()) && await p.locator('.ov-verb').count() === 5, 'leerling: score 7/8 en verbetering per vraag');
  await shot(p, '4_leerling_resultaat');

  /* 8. afdrukpagina */
  await alsGebruiker(p, 'dashboard/afdruk.html?opdr=test-toets&groep=1ANg1', LK); await p.waitForTimeout(900);
  check(await p.locator('.blad').count() === 2 && /Claes An/.test(await p.locator('.blad').first().textContent()) && /7/.test(await p.locator('.hf-res').first().textContent()), 'afdruk: twee leerlingen met hoofding en score');
  await shot(p, '5_afdruk_ingevuld');
  if(UIT) await p.pdf({ path:path.join(UIT, 'voorbeeld_groep.pdf'), format:'A4' });
  await p.goto(H.B + 'dashboard/afdruk.html?opdr=test-toets&soort=sleutel'); await p.waitForTimeout(900);
  check(/gelijkbenig/.test(await p.locator('.blad').textContent()) && await p.locator('.ov-vak.aan').count() === 3, 'afdruk: verbetersleutel');
  await p.goto(H.B + 'dashboard/afdruk.html?opdr=test-toets&soort=blanco'); await p.waitForTimeout(900);
  check(await p.locator('.blad').count() === 1 && !(await p.locator('.ov-vak.aan').count()), 'afdruk: blanco toets');

  /* 9. huistaak: opnieuw maken, de laatste poging telt */
  await alsGebruiker(p, 'dashboard/', LK);
  await p.click('button.tab:has-text("Toetsen en taken")'); await p.waitForTimeout(300);
  await p.locator('.opdr-blok', { hasText:'Proeftaak voorbeeld' }).locator('button:has-text("Nu openen")').click(); await p.waitForTimeout(400);
  await p.locator('.opdr-blok', { hasText:'Proeftoets voorbeeld' }).locator('button:has-text("Nu sluiten")').click(); await p.waitForTimeout(400);
  await alsGebruiker(p, 'test/opdracht/taak/', L1); await p.waitForTimeout(600);
  await vraag('a1').locator('input').fill('40'); await vraag('a2').locator('input').fill('9'); await p.waitForTimeout(300);
  await p.click('button:has-text("Indienen")'); await p.waitForTimeout(1500);
  await p.click('button:has-text("Opnieuw maken")'); await p.waitForTimeout(800);
  check(await vraag('a1').locator('input').inputValue() === '40', 'opnieuw maken: vorige antwoorden staan er nog');
  await vraag('a1').locator('input').fill('42'); await p.waitForTimeout(300);
  await p.click('button:has-text("Indienen")'); await p.waitForTimeout(1500);
  inz = (await db())['inzendingen/test-taak__an.claes@svsl.be'];
  check(inz.poging === 2 && !inz.slot && inz.antw.a1 === '42', 'huistaak: tweede poging telt, geen slot');
  await p.goto(H.B + '1A/modules/module-1-getallen/'); await p.waitForTimeout(1200);
  check(!/even dicht/.test(await p.locator('#app').textContent()), 'module 1 weer open na het sluiten van de toets');

  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
