/* 1A Wiskundige problemen · Heuristieken (site 1a-wp), met de nep-Firebase.
   node test/heuristieken1a.js   (eerst test/serve.sh)
   Leerling: tegel op de 1A-pagina, verborgen onderdeel weg, uitgewerkt voorbeeld stap voor stap, oefenen (juist, fout, hint, moeilijker),
   testje van een heuristiek, door elkaar (eerst een heuristiek kiezen), testje door elkaar, voortgang in Firestore.
   Leerkracht: Bord op een vraag, dashboard met juist/aantal en de score van het testje. */
const H = require('./helpers');
const P = '1a_wp_heur_v1_';
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LL = { uid:'llh', email:'peeters.noor@svsl.be', displayName:'Noor Peeters' };
  const LK = { uid:'lk', email:'vandaele.tom@svsl.be', displayName:'Tom Van Daele' };
  const start = { 'leerkrachten/vandaele.tom@svsl.be':{ naam:'Tom Van Daele' },
    'leerlingen/peeters.noor@svsl.be':{ familienaam:'Peeters', voornaam:'Noor', klas:'1E', jaar:'1', stroom:'A' },
    'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', soort:'niveaugroep', leerkrachten:[LK.email], leerlingen:[LL.email], aan:{ '1a-wp':{ on:true, uit:['tellen'] } } } };
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, '1A/', LL); await p.waitForTimeout(1000);
  check(await p.locator('a.tegel[data-site="1a-wp"]:visible').count() === 1, 'tegel Wiskundige problemen staat open op de 1A-pagina');
  await p.goto(H.B + '1A/wiskundige-problemen/'); await p.waitForTimeout(1500);
  const nav = await p.locator('nav.side .lbl').allTextContents();
  check(nav.join('|') === 'De vier stappen|Een schets maken|Vereenvoudigen|Uitproberen|Een patroon zoeken|Achterwaarts werken|Door elkaar|Testje door elkaar', 'onderdelen zonder het verborgen Systematisch tellen: ' + nav.join(', '));

  /* de vier stappen: volgorde */
  const c2 = p.locator('section#stappen .hcard').nth(1);
  for(const f of ['begrijpen', 'plannen', 'uitvoeren', 'terugkijken']){ await c2.locator(`.choices .opt:text-is("${f}")`).click(); await p.waitForTimeout(50); }
  await c2.locator('.btn:has-text("Controleer")').click(); await p.waitForTimeout(100);
  check(/Juist/.test(await c2.locator('.fb').innerText()), 'de vier stappen in de juiste volgorde');

  /* een schets maken: voorbeeld stap voor stap */
  await p.click('nav.side button:has-text("Een schets maken")'); await p.waitForTimeout(300);
  await p.click('section#schets .tab:has-text("Voorbeeld")'); await p.waitForTimeout(200);
  for(const a of ['224', '9', '28', 'B']){
    const st = p.locator('section#schets .vb-stap').last();
    await st.locator('input').fill(a); await st.locator('.btn:has-text("Controleer")').click(); await p.waitForTimeout(80);
    await st.locator('.volg-btn').click(); await p.waitForTimeout(150);
  }
  check(await p.locator('section#schets .vb-stap').count() === 4 && await p.locator('section#schets .vb-slot').count() === 1, 'voorbeeld: vier stappen met elk een vraagje, daarna de samenvatting');

  /* oefenen: twee keer juist → moeilijker */
  await p.click('section#schets .tab:has-text("Oefenen")'); await p.waitForTimeout(200);
  const juistKlik = async (sec, kind = 'oef')=>{
    const q = await p.evaluate(([k])=>{ const s = JSON.parse(localStorage.getItem(k)); const q = __heur.maakVraag(s.cur.tid, s.cur.seed); return { mc:q.mc ? q.mc.juist : null, getal:q.getal }; }, [P + `oef_${sec}_${kind}`]);
    const kaart = p.locator(`section#${sec} .tabpane:not([hidden]) .hcard`);
    if(q.mc != null) await kaart.locator('.hv-opt').nth(q.mc).click(); else await kaart.locator('.hv-invul input').fill(String(q.getal).replace('.', ','));
    await kaart.locator('.btn:has-text("Controleer")').first().click(); await p.waitForTimeout(80);
    return q;
  };
  await juistKlik('schets'); check(/Juist/.test(await p.locator('section#schets .tabpane:not([hidden]) .hcard .fb').first().innerText()), 'oefenen: juist antwoord herkend');
  await p.click('section#schets .tabpane:not([hidden]) .oefen .volg-btn'); await p.waitForTimeout(150);
  await juistKlik('schets'); await p.click('section#schets .tabpane:not([hidden]) .oefen .volg-btn'); await p.waitForTimeout(150);
  check(await p.locator('section#schets .lvl-tag.l2').count() === 1 && /moeilijker/.test(await p.locator('section#schets .hv-melding').innerText()), 'na twee keer juist worden de vragen moeilijker');
  /* hint en twee keer fout */
  await p.click('section#schets .hint-btn'); await p.waitForTimeout(80);
  check(await p.locator('section#schets .hv-hint:visible .hstap input').count() >= 1, 'hint met invulvakjes per stap');
  const qq = await p.evaluate(()=>{ const s = JSON.parse(localStorage.getItem('1a_wp_heur_v1_oef_schets_oef')); const q = __heur.maakVraag(s.cur.tid, s.cur.seed); return q.mc ? q.mc.juist : null; });
  const kaart = p.locator('section#schets .tabpane:not([hidden]) .hcard');
  for(let i = 0; i < 2; i++){ if(qq != null) await kaart.locator('.hv-opt').nth((qq + 1) % 5).click(); else await kaart.locator('.hv-invul input').fill('99999'); await kaart.locator('.btn:has-text("Controleer")').first().click(); await p.waitForTimeout(80); }
  check(await kaart.locator('.hv-uitw:visible .sol').count() === 4, 'na twee keer fout: het juiste antwoord en de uitwerking in vier stappen');
  const res = await p.evaluate(k=>JSON.parse(localStorage.getItem(k) || '{}'), P + '_res');
  const rs = Object.entries(res).filter(([id])=>/^schets_/.test(id));
  check(rs.length === 3 && rs.every(([id])=>/^schets_s\d\d$/.test(id)) && rs.filter(([, v])=>v === 1).length === 2 && res.stappen_volgorde === 1, 'juist/fout per vraag onder schets_… en stappen_…: ' + JSON.stringify(res));

  /* testje van de heuristiek */
  await p.click('section#schets .tab:has-text("Testje")'); await p.waitForTimeout(200);
  const items = await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).items.map(it=>{ const q = __heur.maakVraag(it.tid, it.seed); return { mc:q.mc ? q.mc.juist : null, getal:q.getal }; }), P + 'test_schets');
  check(items.length === 3, 'testje heeft 3 vragen');
  for(let i = 0; i < 3; i++){ const c = p.locator('section#schets .testje .hcard').nth(i); if(items[i].mc != null) await c.locator('.hv-opt').nth(items[i].mc).click(); else await c.locator('input').fill(String(items[i].getal)); }
  check(await p.locator('section#schets .testje .hv-uitw:visible').count() === 0 && await p.locator('section#schets .testje .hint-btn').count() === 0, 'geen hint en geen uitwerking vóór het verbeteren');
  await p.click('section#schets .btn:has-text("Verbeter mijn testje")'); await p.waitForTimeout(200);
  check(/3\/3/.test(await p.locator('section#schets .test-score').innerText()), 'testje 3/3');
  const toets = await p.evaluate(k=>JSON.parse(localStorage.getItem(k) || '{}'), P + '_toets');
  check(toets.schets_testje && toets.schets_testje.score === 3 && toets.schets_testje.n === 3, 'score van het testje bewaard als schets_testje');

  /* door elkaar: eerst een heuristiek kiezen */
  await p.click('nav.side button:has-text("Door elkaar")'); await p.waitForTimeout(300);
  await p.click('section#mix .tab:has-text("Oefenen")'); await p.waitForTimeout(200);
  check(await p.locator('section#mix .hv-antw.dicht').count() === 1, 'antwoorden pas na het kiezen van een heuristiek');
  await p.click('section#mix .kies-chip >> nth=0'); await p.waitForTimeout(80);
  check(await p.locator('section#mix .hv-antw.dicht').count() === 0, 'na het kiezen kan de leerling antwoorden');
  await juistKlik('mix');
  check(await p.locator('section#mix .hv-heurna:visible').count() === 1, 'na het controleren: welke heuristieken handig waren');

  /* testje door elkaar */
  await p.click('nav.side button:has-text("Testje door elkaar")'); await p.waitForTimeout(300);
  const it5 = await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).items.map(it=>{ const q = __heur.maakVraag(it.tid, it.seed); return { mc:q.mc ? q.mc.juist : null, getal:q.getal, hoofd:__heur.POOL.find(t=>t.id === it.tid).hoofd }; }), P + 'test_toets');
  check(it5.length === 5 && new Set(it5.map(x=>x.hoofd)).size === 5, 'testje door elkaar: 5 vragen met elk een andere hoofdheuristiek (' + it5.map(x=>x.hoofd).join(', ') + ')');
  for(let i = 0; i < 4; i++){ const c = p.locator('section#toets .hcard').nth(i); if(it5[i].mc != null) await c.locator('.hv-opt').nth(it5[i].mc).click(); else await c.locator('input').fill(String(it5[i].getal)); }
  await p.click('section#toets .btn:has-text("Verbeter mijn testje")'); await p.waitForTimeout(100);
  check(/nog één vraag niet beantwoord/.test(await p.locator('section#toets .test-act .fb').innerText()), 'waarschuwing bij een onbeantwoorde vraag');
  await p.click('section#toets .btn:has-text("Verbeter mijn testje")'); await p.waitForTimeout(200);
  const t5 = await p.evaluate(k=>JSON.parse(localStorage.getItem(k) || '{}').toets_1, P + '_toets');
  check(t5 && t5.score === 4 && t5.n === 5, 'testje door elkaar 4/5 bewaard als toets_1');
  await p.click('section#toets .btn:has-text("Maak een nieuw testje")'); await p.waitForTimeout(200);
  check(await p.locator('section#toets .hcard').count() === 5 && await p.locator('section#toets .test-score').count() === 0, 'nieuw testje met nieuwe vragen');

  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await p.waitForTimeout(800);
  const doc = (await H.fakedb(p))['voortgang/llh_1a-wp'];
  check(doc && doc.data && doc.data._res && doc.data._toets && /schets_testje/.test(doc.data._toets), 'voortgang staat in Firestore onder 1a-wp');
  check(!p.fouten.length, 'leerling: geen JavaScript-fouten ' + p.fouten.join(' | '));

  /* leerkracht: Bord en dashboard */
  const q = await H.pagina(ctx, await H.fakedb(p));
  await H.aanmelden(q, '1A/wiskundige-problemen/', LK); await q.waitForTimeout(1200);
  check((await q.locator('nav.side .lbl').count()) === 9, 'leerkracht ziet alle 9 onderdelen');
  await q.click('nav.side button:has-text("Achterwaarts werken")'); await q.waitForTimeout(200); await q.click('section#terug .tab:has-text("Oefenen")'); await q.waitForTimeout(300);
  await q.click('section#terug .tabpane:not([hidden]) .px-bord-btn'); await q.waitForTimeout(300);
  await q.click('.px-board .btn:has-text("Volgende stap")'); await q.waitForTimeout(150);
  check(await q.locator('.px-board .sol.px-shown').count() === 1 && /stap 1 van 4/.test(await q.locator('.px-board .px-cnt').innerText()), 'Bord: de uitwerking stap voor stap (4 stappen)');
  await q.click('.px-board .btn:has-text("Sluiten")'); await q.waitForTimeout(150);
  await q.goto(H.B + 'dashboard/'); await q.waitForTimeout(1500);
  await q.click('.tab:has-text("Voortgang")'); await q.waitForTimeout(500);
  const site = q.locator('#siteSel'); if(await site.count()){ await site.selectOption('1a-wp'); await q.waitForTimeout(800); }
  const txt = await q.locator('table.dt').innerText();
  check(/testje 3\/3/.test(txt) && /2\/13/.test(txt) && /4\/5/.test(txt), 'dashboard: juist/aantal per onderdeel, testje 3/3 en testje door elkaar 4/5');
  check(!q.fouten.length, 'leerkracht: geen JavaScript-fouten ' + q.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
