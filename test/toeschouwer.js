/* Toeschouwer (bv. de directeur) met de nep-Firebase.
   node test/toeschouwer.js   (eerst test/serve.sh)
   Beheerder voegt een toeschouwer toe; de toeschouwer ziet een fictieve school (dashboard, Beheer, Fout melden, module),
   alles wat hij doet blijft in de oefenomgeving (cl_zandbak_…) en de echte (nep-)database verandert niet. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const JER = { uid:'jer', email:'dejaeger.jeroen@svsl.be', displayName:'Jeroen De Jaeger' };
  const DIR = { uid:'dir', email:'directeur.test@svsl.be', displayName:'Dirk Directeur' };
  const start = { 'beheerders/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' }, 'leerkrachten/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' },
    'leerkrachten/collega.echt@svsl.be':{ naam:'Echte Collega' },
    'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', soort:'niveaugroep', leerkrachten:['collega.echt@svsl.be'], leerlingen:['echte.leerling@svsl.be'], aan:{} },
    'leerlingen/echte.leerling@svsl.be':{ familienaam:'Echt', voornaam:'Leerling', klas:'1E', jaar:'1', stroom:'A' } };
  /* beheerder voegt de toeschouwer toe */
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, 'dashboard/', JER);
  await p.click('.tab:has-text("Beheer")'); await p.waitForTimeout(400);
  const kaart = p.locator('.dash-card', { hasText:'Toeschouwers' });
  check(await kaart.count() === 1, 'kaart Toeschouwers bij Beheer');
  await kaart.locator('input[type=text]').fill(DIR.displayName); await kaart.locator('input[type=email]').fill(DIR.email);
  await kaart.locator('button:has-text("Toevoegen")').click(); await p.waitForTimeout(500);
  let db = await H.fakedb(p);
  check(!!db['toeschouwers/' + DIR.email] && !db['leerkrachten/' + DIR.email], 'toeschouwer bewaard, niet bij de leerkrachten');
  const echt = JSON.stringify(db);
  /* de toeschouwer meldt aan */
  const q = await H.pagina(ctx, db);
  await H.aanmelden(q, 'dashboard/', DIR); await q.waitForTimeout(600);
  check(await q.locator('.toeschouwer-balk').isVisible(), 'oranje balk Toeschouwer');
  const tabs = await q.locator('.dash-top .tab').allTextContents();
  check(tabs.join('|').includes('Mijn groepen') && tabs.join('|').includes('Fout melden') && tabs.join('|').includes('Beheer'), 'tabbladen: ' + tabs.join(', '));
  const chips = await q.locator('.chips .chip-btn').allTextContents();
  check(chips.length === 2, 'twee groepen in de oefenschool: ' + chips.join(', '));
  await q.waitForTimeout(600);
  const cellen = await q.locator('table.dt tbody td.sc:not(.s0)').count();
  check(cellen > 0, `voorbeeldvoortgang zichtbaar (${cellen} cellen)`);
  const tekst = await q.locator('#dash').innerText();
  check(!tekst.includes('Echt') && !tekst.includes('Echte Collega'), 'geen echte leerlingen of collega\'s te zien');
  /* iets doen: groep openzetten, fout melden */
  await q.click('.tab:has-text("Openzetten")'); await q.waitForTimeout(300);
  await q.locator('.site-blok').nth(1).locator('.switch input').check(); await q.waitForTimeout(400);
  await q.click('.dash-top .tab:has-text("Fout melden")'); await q.waitForTimeout(400);
  await q.selectOption('#f-site', 'm1'); await q.fill('#f-fout', 'test toeschouwer'); await q.fill('#f-alt', 'iets anders');
  await q.click('text=Melding versturen'); await q.waitForTimeout(500);
  const zb = await q.evaluate(e=>JSON.parse(localStorage.getItem('cl_zandbak_' + e) || '{}'), DIR.email);
  check(Object.values(zb).some(d=>d.melder === DIR.email && d.fout === 'test toeschouwer'), 'foutmelding staat in de oefenomgeving');
  /* module als toeschouwer, antwoord geven */
  await q.goto(H.B + '1A/modules/module-1-getallen/'); await q.waitForTimeout(1500);
  check(await q.locator('.toeschouwer-balk').isVisible() && await q.locator('nav.side .lbl').count() > 0, 'module zichtbaar met balk');
  const inp = q.locator('#app input.inp').first();
  if(await inp.count()){ await inp.fill('1'); await inp.press('Enter'); await q.waitForTimeout(300); await q.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await q.waitForTimeout(800); }
  const zb2 = await q.evaluate(e=>JSON.parse(localStorage.getItem('cl_zandbak_' + e) || '{}'), DIR.email);
  check(!!zb2['voortgang/dir_m1'], 'eigen voortgang in de oefenomgeving');
  const na = JSON.stringify(await H.fakedb(q));
  check(na === echt, 'echte (nep-)database onveranderd');
  /* opnieuw beginnen */
  await q.goto(H.B + 'dashboard/'); await q.waitForTimeout(800);
  await q.click('.toeschouwer-balk button'); await q.waitForTimeout(1200);
  const zb3 = await q.evaluate(e=>JSON.parse(localStorage.getItem('cl_zandbak_' + e) || '{}'), DIR.email);
  check(!zb3['voortgang/dir_m1'] && Object.keys(zb3).length > 50, 'opnieuw beginnen: verse oefenschool');
  /* echte collega ziet de toeschouwer nergens */
  const c = await H.pagina(ctx, JSON.parse(echt));
  await H.aanmelden(c, 'dashboard/', { uid:'col', email:'collega.echt@svsl.be', displayName:'Echte Collega' });
  await c.click('button:has-text("Vervanging collega")'); await c.waitForTimeout(300);
  check(!(await c.locator('#dash').innerText()).includes('Directeur'), 'collega ziet de toeschouwer niet bij Vervanging collega');
  check(!p.fouten.length && !q.fouten.length && !c.fouten.length, 'geen JavaScript-fouten ' + [...p.fouten, ...q.fouten, ...c.fouten].join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
