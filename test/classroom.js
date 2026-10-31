/* Google Classroom: groep koppelen aan een klas, opdracht vanzelf in Classroom bij het openen (ingepland en inleverdatum),
   conceptpunten na het verbeteren, definitief en teruggegeven na het vrijgeven, verbinden na een verlopen toegang,
   leerlingen die niet in de klas zitten. Nep-Classroom: test/fake/classroom.js.   node test/classroom.js   (eerst test/serve.sh) */
const H = require('./helpers'); const fs = require('fs'); const path = require('path');
const nepCR = require('./fake/classroom');
const UIT = process.env.SCHERMEN || null;
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const bron = fs.readFileSync(path.join(__dirname, '..', 'gedeeld', 'opdrachten.js'), 'utf8').replace('export const OPDRACHTEN = [',
    `export const OPDRACHTEN = [ { id:'test-toets', titel:'Proeftoets voorbeeld', kort:'Proeftoets', jaar:'1A', rubriek:'toetsen', pad:'test/opdracht/toets/' },
    { id:'test-taak', titel:'Proeftaak voorbeeld', kort:'Proeftaak', jaar:'1A', rubriek:'huistaken', pad:'test/opdracht/taak/', op:5 },`);
  await ctx.route(/gedeeld\/opdrachten\.js/, r=>r.fulfill({ contentType:'text/javascript', body:bron.replace(/OPDR_ZICHTBAAR = '\w+'/, "OPDR_ZICHTBAAR = 'iedereen'").replace(/RUBRIEKEN_ACTIEF = \[[^\]]*\]/, "RUBRIEKEN_ACTIEF = ['toetsen', 'huistaken', 'rekenvaardigheden']") }));
  const LK = { uid:'lk', email:'jeroen@svsl.be', displayName:'Jeroen De Jaeger' };
  const L1 = { uid:'l1', email:'an.claes@svsl.be', displayName:'An Claes' }, L2 = { uid:'l2', email:'bo.dewit@svsl.be', displayName:'Bo De Wit' };
  const nep = await nepCR.installeer(ctx, { klassen:[
    { id:'k1', name:'Wiskunde 2ANg2', leerlingen:[] },
    { id:'k2', name:'Wiskunde', section:'1ANg1', leerlingen:[{ email:'an.claes@svsl.be', naam:'An Claes' }, { email:'cas.extra@svsl.be', naam:'Cas Extra' }] } ] });
  const start = { 'beheerders/jeroen@svsl.be':{ naam:'Jeroen' }, 'leerkrachten/jeroen@svsl.be':{ naam:'Jeroen De Jaeger' },
    'leerlingen/an.claes@svsl.be':{ familienaam:'Claes', voornaam:'An', klas:'1A3', jaar:'1', stroom:'A' },
    'leerlingen/bo.dewit@svsl.be':{ familienaam:'De Wit', voornaam:'Bo', klas:'1A4', jaar:'1', stroom:'A' },
    'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', soort:'niveau', leerkrachten:[LK.email], leerlingen:[L1.email, L2.email], aan:{} } };
  const shot = async (p, n)=>{ if(UIT) await p.screenshot({ path:path.join(UIT, n + '.png'), fullPage:true }); };
  const alsGebruiker = async (p, url, u)=>{ await p.evaluate(()=>sessionStorage.removeItem('fake_user')); await H.aanmelden(p, url, u); await p.waitForTimeout(600); };
  const p = await H.pagina(ctx, start); const db = ()=>H.fakedb(p);
  const naarTab = async ()=>{ await p.click('button.tab:has-text("Toetsen en taken")'); await p.waitForTimeout(400); };
  const blok = n => p.locator('.opdr-blok', { hasText:n });

  /* 1. koppelen: de klas met 1ANg1 in de naam of sectie wordt voorgesteld */
  await alsGebruiker(p, 'dashboard/', LK); await naarTab();
  check(/nog niet gekoppeld/.test(await p.locator('.cr-balk').textContent()), 'groep nog niet gekoppeld');
  await p.click('.cr-balk button:has-text("Kies een Classroom-klas")'); await p.waitForTimeout(500);
  check(await p.locator('select.cr-klas').inputValue() === 'k2', 'klas met sectie 1ANg1 voorgesteld');
  await shot(p, '1_klas_kiezen');
  await p.click('.cr-balk button:has-text("Koppelen")'); await p.waitForTimeout(500);
  let g = (await db())['groepen/1ANg1'];
  check(g.classroom && g.classroom.id === 'k2' && g.classroom.naam === 'Wiskunde · 1ANg1', 'koppeling bewaard: ' + JSON.stringify(g.classroom));
  check(!nep.werk().length, 'nog geen opdracht in Classroom zolang niets geopend is');

  /* 2. toets openen → opdracht in Classroom, gepubliceerd, met link en maximum */
  await blok('Proeftoets voorbeeld').locator('button:has-text("Instellingen")').click();
  await blok('Proeftoets voorbeeld').locator('.v-ziet').selectOption('score'); await p.waitForTimeout(300);
  await blok('Proeftoets voorbeeld').locator('button:has-text("Nu openen")').click(); await p.waitForTimeout(900);
  let w = nep.werk();
  check(w.length === 1 && w[0].courseId === 'k2' && w[0].state === 'PUBLISHED' && w[0].maxPoints === 8 && w[0].title === 'Proeftoets voorbeeld'
    && /test\/opdracht\/toets\/$/.test(w[0].materials[0].link.url) && !w[0].dueDate, 'opdracht in Classroom: ' + JSON.stringify(w[0]));
  g = (await db())['groepen/1ANg1'];
  check(g.cr && g.cr['test-toets'] && g.cr['test-toets'].cw === w[0].id, 'opdracht-id bewaard bij de groep');
  /* sluitmoment invullen → inleverdatum in Classroom */
  const tot = new Date(Date.now() + 3 * 864e5); tot.setSeconds(0, 0);
  const z = n=>String(n).padStart(2, '0'), veld = d=>`${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
  await blok('Proeftoets voorbeeld').locator('.v-tot').fill(veld(tot)); await blok('Proeftoets voorbeeld').locator('.v-tot').dispatchEvent('change'); await p.waitForTimeout(900);
  w = nep.werk();
  check(w.length === 1 && w[0].dueDate && w[0].dueDate.day === tot.getUTCDate() && w[0].dueTime.hours === tot.getUTCHours(), 'inleverdatum = sluitmoment (geen tweede opdracht): ' + JSON.stringify([w[0].dueDate, w[0].dueTime]));
  /* taak ingepland (op 5): opent morgen */
  const van = new Date(Date.now() + 864e5); van.setSeconds(0, 0);
  await blok('Proeftaak voorbeeld').locator('button:has-text("Instellingen")').click();
  await blok('Proeftaak voorbeeld').locator('.v-van').fill(veld(van)); await blok('Proeftaak voorbeeld').locator('.v-van').dispatchEvent('change'); await p.waitForTimeout(900);
  const taak = nep.werk().find(x=>x.title === 'Proeftaak voorbeeld');
  check(taak && taak.state === 'DRAFT' && Math.abs(Date.parse(taak.scheduledTime) - van.getTime()) < 1000 && taak.maxPoints === 5, 'taak ingepland in Classroom, op 5: ' + JSON.stringify(taak && [taak.state, taak.scheduledTime, taak.maxPoints]));
  await shot(p, '2_toetsen_gekoppeld');

  /* 3. An dient in, Bo begint */
  await alsGebruiker(p, 'test/opdracht/toets/', L1); await p.waitForTimeout(600);
  const vraag = id => p.locator(`.ov[data-id="${id}"]`);
  await vraag('v1').locator('input').fill('22'); await vraag('v2').locator('input[value="2"]').check();
  await vraag('v3').locator('input[value="0"]').check(); await vraag('v3').locator('input[value="2"]').check();
  await vraag('v4').locator('input').fill('Gelijkbenig'); await vraag('v5').locator('textarea').fill('Het heeft vier rechte hoeken.');
  await p.waitForTimeout(1500); await p.click('button:has-text("Indienen")'); await p.waitForTimeout(1500);
  await alsGebruiker(p, 'test/opdracht/toets/', L2); await p.waitForTimeout(600);
  await vraag('v1').locator('input').fill('20'); await p.waitForTimeout(1500);

  /* 4. resultaten: open vraag nog niet verbeterd → nog geen punt; met de hand verbeterd + bewaren → conceptpunt */
  await alsGebruiker(p, 'dashboard/', LK); await naarTab();
  await blok('Proeftoets voorbeeld').locator('button:has-text("Resultaten")').click(); await p.waitForTimeout(800);
  await p.fill('.sl-code', 'test-code'); await p.click('button:has-text("Ontgrendel")'); await p.waitForTimeout(1800);
  const cwT = (await db())['groepen/1ANg1'].cr['test-toets'].cw;
  const anSub = ()=>nep.inzendingen(cwT).find(s=>s.userId === 'k2-u0');
  check(anSub().draftGrade == null, 'open vraag nog te verbeteren: nog geen punt in Classroom');
  const melding = await p.locator('.cr-melding').textContent();
  check(/Niet in de Classroom-klas: De Wit Bo|Niet in de Classroom-klas: Bo De Wit/.test(melding) && /Cas Extra/.test(melding), 'melding wie niet in de klas of niet in de groep zit: ' + melding);
  const rij = n => p.locator('table.opdr-tabel tbody tr', { hasText:n });
  await rij('Claes').locator('.naam-btn').click(); await p.waitForTimeout(400);
  await p.locator('.detail .ov[data-id="v5"] .ov-punten input').fill('2'); await p.locator('.detail .ov[data-id="v5"] .ov-punten input').dispatchEvent('change'); await p.waitForTimeout(200);
  await p.click('button:has-text("Punten bewaren")'); await p.waitForTimeout(1200);
  check(anSub().draftGrade === 7 && anSub().assignedGrade == null && anSub().state !== 'RETURNED', 'conceptpunt 7 in Classroom: ' + JSON.stringify(anSub()));
  await shot(p, '3_resultaten_concept');

  /* 5. vrijgeven → definitief en teruggegeven */
  await p.click('button:has-text("Resultaten vrijgeven")'); await p.waitForTimeout(1200);
  check(anSub().assignedGrade === 7 && anSub().state === 'RETURNED', 'na vrijgeven: definitief 7 en teruggegeven');
  check(/1 definitief, 1 teruggegeven/.test(await p.locator('.cr-melding').textContent()), 'melding: ' + await p.locator('.cr-melding').textContent());

  /* 6. toegang verlopen: wachten tot de leerkracht op Verbind met Classroom klikt */
  await p.evaluate(()=>{ sessionStorage.removeItem('cr_token'); });
  await p.reload(); await p.waitForTimeout(1200); await naarTab();
  await blok('Proeftoets voorbeeld').locator('button:has-text("Nu sluiten")').click(); await p.waitForTimeout(600);
  await blok('Proeftaak voorbeeld').locator('button:has-text("Instellingen")').click();
  await blok('Proeftaak voorbeeld').locator('.v-pog').selectOption('1'); await p.waitForTimeout(600);
  const voor = nep.staat.aanroepen.length;
  check(await p.locator('.cr-balk button:has-text("Verbind met Classroom")').isVisible() && /Proeftaak voorbeeld/.test(await p.locator('.cr-balk').textContent()), 'zonder toegang: knop Verbind met Classroom met wat wacht');
  check(nep.staat.aanroepen.length === voor, 'zonder toegang geen aanroep naar Classroom');
  await shot(p, '4_verbinden');
  await p.click('.cr-balk button:has-text("Verbind met Classroom")'); await p.waitForTimeout(1000);
  check(nep.staat.aanroepen.length > voor && !(await p.locator('.cr-balk button:has-text("Verbind met Classroom")').count()), 'na verbinden bijgewerkt: ' + nep.staat.aanroepen.slice(voor).join(' | '));
  check(nep.werk().length === 2, 'nog steeds twee opdrachten in Classroom (geen dubbele)');

  /* 7. ontkoppelen */
  await p.click('.cr-balk button:has-text("Ontkoppelen")'); await p.waitForTimeout(500);
  check(!(await db())['groepen/1ANg1'].classroom && /nog niet gekoppeld/.test(await p.locator('.cr-balk').textContent()), 'ontkoppeld');
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
