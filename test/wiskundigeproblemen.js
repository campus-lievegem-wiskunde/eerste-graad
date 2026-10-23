/* Wiskundige problemen 2A (site 2a-wp), met de nep-Firebase.
   node test/wiskundigeproblemen.js   (eerst test/serve.sh)
   Leerling: enkel open onderdelen, een reeks oefenen (juist/fout per vraag en niveau worden bewaard), een proeftoets
   (score via _toets, opnieuw maken overschrijft). Leerkracht: Bord op een vraag werkt (antwoorden en volgende vraag
   op het bord) en het dashboard toont het niveau per onderdeel. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LL = { uid:'ll', email:'peeters.lotte@svsl.be', displayName:'Lotte Peeters' };
  const LK = { uid:'lk', email:'vandaele.tom@svsl.be', displayName:'Tom Van Daele' };
  const start = { 'leerkrachten/vandaele.tom@svsl.be':{ naam:'Tom Van Daele' },
    'leerlingen/peeters.lotte@svsl.be':{ familienaam:'Peeters', voornaam:'Lotte', klas:'2C', jaar:'2', stroom:'A' },
    'groepen/2ANg2a':{ naam:'2ANg2a', jaar:'2', stroom:'A', soort:'niveaugroep', leerkrachten:[LK.email], leerlingen:[LL.email], aan:{ '2a-wp':{ on:true, uit:['ver'] } } } };
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, '2A/wiskundige-problemen/', LL); await p.waitForTimeout(1200);
  const nav = await p.locator('nav.side .lbl').allTextContents();
  check(nav.includes('Problemen oplossen') && !nav.includes('Verzamelingenleer') && nav.includes('Proeftoets 3'), 'zijbalk zonder het verborgen onderdeel: ' + nav.join(', '));
  check(!/Vlaamse/i.test(await p.locator('body').innerText()), 'nergens "Vlaamse toetsen"');

  /* een reeks van 10 vragen getallenleer: 9 juist, 1 fout */
  await p.click('button[data-a=kies][data-d=get]'); await p.click('form[data-f=keuze] button[type=submit]'); await p.waitForTimeout(300);
  for(let i = 0; i < 10; i++){
    if(i === 3) await p.click('[data-a=weetniet]'); else { await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); }
    await p.waitForTimeout(60); await p.click('[data-a=verder]'); await p.waitForTimeout(60);
  }
  check(/9 van de 10/.test(await p.locator('.uitslag').innerText()), 'resultaat 9 van de 10');
  const ls = await p.evaluate(()=>({ res:JSON.parse(localStorage.getItem('2a_wp_v1__res') || '{}'), niv:JSON.parse(localStorage.getItem('2a_wp_v1_niv') || '{}') }));
  const ids = Object.keys(ls.res);
  check(ids.length === 10 && ids.every(id=>id.startsWith('get_')) && Object.values(ls.res).filter(x=>x === 1).length === 9, 'juist/fout per vraag onder get_…');
  check(ls.niv.get && /^[A-E]$/.test(ls.niv.get.n) && ls.niv.get.j === 9, 'niveau bewaard voor het dashboard: ' + JSON.stringify(ls.niv.get));
  check(await p.locator('nav.side .lbl', { hasText:'Mijn fouten' }).count() === 1, 'Mijn fouten verschijnt na een fout');

  /* proeftoets 1: 20 vragen, de laatste poging telt */
  await p.click('nav.side button[data-d=toets1]'); await p.click('[data-a=proefstart]'); await p.waitForTimeout(200);
  check(await p.locator('.px-vs-btn, .px-bord-btn').count() === 0, 'geen Bord of Volledig scherm in een proeftoets');
  check(await p.locator('[data-a=tip]').count() === 0, 'geen tips in een proeftoets');
  for(let i = 0; i < 20; i++){ await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); await p.waitForTimeout(50); }
  check(/20 van de 20/.test(await p.locator('.uitslag').innerText()), 'proeftoets 20 van de 20');
  await p.click('.rij [data-a=nav][data-d=toets1]'); await p.click('[data-a=proefstart]'); await p.waitForTimeout(200);
  for(let i = 0; i < 5; i++){ await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); await p.waitForTimeout(50); }
  await p.click('[data-a=stop]'); await p.click('[data-a=stopja]'); await p.waitForTimeout(200);
  const t = await p.evaluate(()=>JSON.parse(localStorage.getItem('2a_wp_v1__toets') || '{}'));
  check(t.toets1_1 && t.toets1_1.score === 5 && t.toets1_1.n === 20, 'opnieuw gemaakt: laatste poging telt (5/20)');
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await p.waitForTimeout(800);
  const doc = (await H.fakedb(p))['voortgang/ll_2a-wp'];
  check(doc && doc.data && doc.data._res && doc.data.niv && doc.data._toets && doc.data.staat, 'voortgang staat in Firestore (_res, _toets, niv, staat)');
  check(!p.fouten.length, 'leerling: geen JavaScript-fouten ' + p.fouten.join(' | '));

  /* leerkracht: Bord en dashboard */
  const db = await H.fakedb(p);
  const q = await H.pagina(ctx, db);
  await H.aanmelden(q, '2A/wiskundige-problemen/', LK); await q.waitForTimeout(1200);
  check(await q.locator('nav.side .lbl', { hasText:'Verzamelingenleer' }).count() === 1, 'leerkracht ziet alle onderdelen');
  await q.click('button[data-a=kies][data-d=pro]'); await q.click('form[data-f=keuze] button[type=submit]'); await q.waitForTimeout(400);
  await q.click('.px-bord-btn'); await q.waitForTimeout(300);
  check(await q.locator('.px-board .wpkaart').count() === 1, 'Bord opent de vraag');
  const stappen = await q.locator('.px-board .px-cnt').innerText();
  check(/stap 0 van [1-9]/.test(stappen), 'oplossingsmethode als stappen: ' + stappen);
  await q.evaluate(()=>__oefensite.vulJuist()); await q.click('.px-board [data-a=bevestig]'); await q.waitForTimeout(150);
  check(await q.locator('.px-board .terug.goed').count() === 1, 'antwoorden op het bord werkt');
  await q.click('.px-board [data-a=verder]'); await q.waitForTimeout(150);
  check(/Vraag 2 van/.test(await q.locator('.px-board .wpkop').innerText()), 'volgende vraag blijft op het bord');
  await q.keyboard.press('Escape'); await q.waitForTimeout(200);
  check(await q.locator('.px-board').count() === 0 && await q.locator('#app .wpkaart').count() === 1, 'bord sluiten: de vraag staat terug in de pagina');
  await q.goto(H.B + 'dashboard/'); await q.waitForTimeout(1500);
  await q.click('.tab:has-text("Voortgang")'); await q.waitForTimeout(500);
  const site = q.locator('#siteSel');
  if(await site.count()){ await site.selectOption('2a-wp'); await q.waitForTimeout(800); }
  const cel = await q.locator('table.dt td.sc .niv-l').allTextContents();
  check(cel.length >= 2, 'dashboard toont het niveau per onderdeel: ' + cel.join(' '));
  check(!q.fouten.length, 'leerkracht: geen JavaScript-fouten ' + q.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
