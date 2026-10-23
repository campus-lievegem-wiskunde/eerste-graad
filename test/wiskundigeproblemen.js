/* Wiskundige problemen 2A (site 2a-wp), met de nep-Firebase.
   node test/wiskundigeproblemen.js   (eerst test/serve.sh)
   Leerling: enkel open onderdelen, geen letters te zien, een reeks oefenen (juist/fout per vraag, letter per thema en doelen
   worden bewaard), een proeftoets in drie delen (score via _toets, letter per deel in niv). Leerkracht: doelen per letter in de
   module, Bord op een vraag werkt en het dashboard toont de letter per thema, de letters per deel en de doelen per letter. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LL = { uid:'ll', email:'peeters.lotte@svsl.be', displayName:'Lotte Peeters' };
  const LK = { uid:'lk', email:'vandaele.tom@svsl.be', displayName:'Tom Van Daele' };
  const start = { 'leerkrachten/vandaele.tom@svsl.be':{ naam:'Tom Van Daele' },
    'leerlingen/peeters.lotte@svsl.be':{ familienaam:'Peeters', voornaam:'Lotte', klas:'2C', jaar:'2', stroom:'A' },
    'groepen/2ANg2a':{ naam:'2ANg2a', jaar:'2', stroom:'A', soort:'niveaugroep', leerkrachten:[LK.email], leerlingen:[LL.email], aan:{ '2a-wp':{ on:true, uit:['vzm'] } } } };
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, '2A/wiskundige-problemen/', LL); await p.waitForTimeout(1200);
  const nav = await p.locator('nav.side .lbl').allTextContents();
  check(nav.includes('Problemen oplossen') && nav.includes('Getallenleer') && !nav.includes('Verzamelingen') && nav.includes('Proeftoets 3'), 'zijbalk zonder het verborgen onderdeel: ' + nav.join(', '));
  check(!/Vlaamse/i.test(await p.locator('body').innerText()), 'nergens "Vlaamse toetsen"');

  /* een reeks van 10 vragen getallenleer: 9 juist, 1 fout */
  await p.click('button[data-a=kies][data-d=get]'); await p.waitForTimeout(150);
  check(await p.locator('.niv-l, .lkdoelen, .lkinfo').count() === 0, 'leerling ziet geen letters en geen leerkrachtinfo');
  await p.click('form[data-f=keuze] button[type=submit]'); await p.waitForTimeout(300);
  check(await p.locator('.lkcode, .niv-l').count() === 0, 'leerling ziet bij een vraag geen letter of doelcode');
  for(let i = 0; i < 10; i++){
    if(i === 3) await p.click('[data-a=weetniet]'); else { await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); }
    await p.waitForTimeout(60); await p.click('[data-a=verder]'); await p.waitForTimeout(60);
  }
  check(/9 van de 10/.test(await p.locator('.uitslag').innerText()), 'resultaat 9 van de 10');
  check(/Hier werk je nog aan|Dit kan je al/.test(await p.locator('#app').innerText()) && await p.locator('#app .niv-l').count() === 0, 'resultaat toont doelen in woorden, zonder letters');
  const ls = await p.evaluate(()=>({ res:JSON.parse(localStorage.getItem('2a_wp_v1__res') || '{}'), niv:JSON.parse(localStorage.getItem('2a_wp_v1_niv') || '{}'), dg:JSON.parse(localStorage.getItem('2a_wp_v1_doelen') || '{}') }));
  const ids = Object.keys(ls.res);
  check(ids.length === 10 && ids.every(id=>id.startsWith('get_')) && Object.values(ls.res).filter(x=>x === 1).length === 9, 'juist/fout per vraag onder get_…');
  check(ls.niv.get && /^[A-E]$/.test(ls.niv.get.n) && ls.niv.get.j === 9, 'letter per thema bewaard voor het dashboard: ' + JSON.stringify(ls.niv.get));
  check(Object.keys(ls.dg).length >= 5 && Object.keys(ls.dg).every(c=>/^A-GET-[ABCD]\d+$/.test(c)), 'doelen per code bewaard: ' + Object.keys(ls.dg).join(' '));
  check(await p.locator('nav.side .lbl', { hasText:'Mijn fouten' }).count() === 1, 'Mijn fouten verschijnt na een fout');

  /* proeftoets 1: drie delen van 15 vragen (problemen oplossen, getallenleer, omtrek en oppervlakte) */
  await p.click('nav.side button[data-d=toets1]'); await p.click('[data-a=proefstart]'); await p.waitForTimeout(200);
  check(await p.locator('.px-vs-btn, .px-bord-btn').count() === 0, 'geen Bord of Volledig scherm in een proeftoets');
  check(await p.locator('[data-a=tip]').count() === 0, 'geen tips in een proeftoets');
  for(let d = 0; d < 3; d++){
    for(let i = 0; i < 15; i++){ await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); await p.waitForTimeout(40); }
    const vd = p.locator('[data-a=proefverder]'); if(await vd.count()){ await vd.click(); await p.waitForTimeout(150); }
  }
  check(/45 van de 45/.test(await p.locator('#app').innerText()), 'proeftoets 45 van de 45');
  const t = await p.evaluate(()=>({ t:JSON.parse(localStorage.getItem('2a_wp_v1__toets') || '{}'), niv:JSON.parse(localStorage.getItem('2a_wp_v1_niv') || '{}') }));
  check(t.t.toets1_1 && t.t.toets1_1.score === 45 && t.t.toets1_1.n === 45, 'score van de proeftoets via _toets');
  check(t.niv.toets1 && t.niv.toets1.delen && Object.keys(t.niv.toets1.delen).join() === 'wpo,get,ooi', 'letter per deel bewaard: ' + JSON.stringify(t.niv.toets1 && t.niv.toets1.delen));
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await p.waitForTimeout(800);
  const doc = (await H.fakedb(p))['voortgang/ll_2a-wp'];
  check(doc && doc.data && doc.data._res && doc.data.niv && doc.data._toets && doc.data.staat, 'voortgang staat in Firestore (_res, _toets, niv, staat)');
  check(!p.fouten.length, 'leerling: geen JavaScript-fouten ' + p.fouten.join(' | '));

  /* leerkracht: Bord en dashboard */
  const db = await H.fakedb(p);
  const q = await H.pagina(ctx, db);
  await H.aanmelden(q, '2A/wiskundige-problemen/', LK); await q.waitForTimeout(1200);
  check(await q.locator('nav.side .lbl', { hasText:'Verzamelingen' }).count() === 1, 'leerkracht ziet alle onderdelen');
  await q.click('button[data-a=kies][data-d=get]'); await q.waitForTimeout(200);
  check(await q.locator('.lkdoelen .lkl').count() === 4 && await q.locator('.lkdoelen li').count() > 50, 'leerkracht ziet de doelen per letter (A tot D)');
  await q.click('nav.side button[data-d=wpo]'); await q.waitForTimeout(150);
  await q.click('form[data-f=keuze] button[type=submit]'); await q.waitForTimeout(400);
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
  check(cel.length >= 4, 'dashboard toont de letter per thema en per deel van de proeftoets: ' + cel.join(' '));
  await q.click('.naam-btn'); await q.waitForTimeout(1200);
  check(await q.locator('.doelen-lk .doel-thema').count() >= 1 && await q.locator('.doelen-lk li').count() > 20, 'dashboard: doelen per letter in de detailweergave');
  check(!q.fouten.length, 'leerkracht: geen JavaScript-fouten ' + q.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
