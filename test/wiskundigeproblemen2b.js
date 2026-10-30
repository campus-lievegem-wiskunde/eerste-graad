/* Wiskundige problemen 2B (site 2b-wp, B-stroom), met de nep-Firebase.
   node test/wiskundigeproblemen2b.js   (eerst test/serve.sh)
   Leerling van klas 2B: tegel op de 2B-pagina, de thema's van de B-stroom in de volgorde van de leeswijzer, geen letters te zien,
   eenvoudige rekenmachine (te verslepen), formulekader bij omtrek en oppervlakte, een reeks met letter en B-doelen, een proeftoets in drie delen.
   Leerkracht: doelen per letter (B) in de module en letters en doelen in het dashboard. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LL = { uid:'llb', email:'jacobs.senne@svsl.be', displayName:'Senne Jacobs' };
  const LK = { uid:'lk', email:'vandaele.tom@svsl.be', displayName:'Tom Van Daele' };
  const start = { 'leerkrachten/vandaele.tom@svsl.be':{ naam:'Tom Van Daele' },
    'leerlingen/jacobs.senne@svsl.be':{ familienaam:'Jacobs', voornaam:'Senne', klas:'2B', jaar:'2', stroom:'B' },
    'groepen/2B':{ naam:'2B', jaar:'2', stroom:'B', soort:'klas B-stroom', leerkrachten:[LK.email], leerlingen:[LL.email], aan:{ '2b-wp':{ on:true, uit:[] } } } };
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, '2B/', LL); await p.waitForTimeout(1000);
  check(await p.locator('a.tegel[data-site="2b-wp"]:visible').count() === 1, 'tegel Wiskundige problemen staat open op de 2B-pagina');
  await p.goto(H.B + '2B/wiskundige-problemen/'); await p.waitForTimeout(1500);
  const nav = await p.locator('nav.side .lbl').allTextContents();
  check(nav.join('|') === 'Overzicht|Problemen oplossen|Getallenleer|Objecten en relaties|Omtrek en oppervlakte|Statistiek|Tabellen en diagrammen|Verhoudingen|Proeftoets 1|Proeftoets 2|Proeftoets 3',
    'thema\'s van de B-stroom in de volgorde van de leeswijzer: ' + nav.join(', '));
  check(!/Algebra|Verzamelingen|Transformaties/.test(nav.join()), 'geen thema\'s van de A-stroom');

  /* omtrek en oppervlakte: formulekader bij de vraag, geen knop Formularium */
  await p.click('nav.side button[data-d=ooi]'); await p.waitForTimeout(150);
  await p.click('form[data-f=keuze] button[type=submit]'); await p.waitForTimeout(300);
  let kader = 0, knop = 0, rmEenvoudig = 0, rmTotaal = 0;
  for(let i = 0; i < 10; i++){
    kader += await p.locator('.opgave .formkader').count(); knop += await p.locator('[data-a=form]').count();
    const rm = p.locator('.tools [data-a=calc]');
    if(await rm.count()){ rmTotaal++; await rm.click(); await p.waitForTimeout(60); rmEenvoudig += await p.locator('#calc.eenvoudig').count(); await rm.click(); }
    await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); await p.waitForTimeout(60); await p.click('[data-a=verder]'); await p.waitForTimeout(60);
  }
  check(rmTotaal > 0 && rmEenvoudig === rmTotaal, 'altijd de eenvoudige rekenmachine (' + rmEenvoudig + ' van ' + rmTotaal + ')');
  check(kader >= 3 && knop === 0, 'formulekader bij de vragen (' + kader + ' van 10), geen knop Formularium');
  check(await p.locator('#app .niv-l').count() === 0, 'leerling ziet geen letters');
  const ls = await p.evaluate(()=>({ niv:JSON.parse(localStorage.getItem('2b_wp_v1_niv') || '{}'), dg:JSON.parse(localStorage.getItem('2b_wp_v1_doelen') || '{}'), res:JSON.parse(localStorage.getItem('2b_wp_v1__res') || '{}') }));
  check(ls.niv.ooi && ls.niv.ooi.t === 10 && ls.niv.ooi.j === 10, 'letter per thema bewaard: ' + JSON.stringify(ls.niv.ooi));
  check(Object.keys(ls.dg).length >= 3 && Object.keys(ls.dg).every(c=>/^B-OOI-[ABCD]\d+$/.test(c)), 'B-doelen bewaard: ' + Object.keys(ls.dg).join(' '));
  check(Object.keys(ls.res).length === 10 && Object.keys(ls.res).every(id=>/^ooi_/.test(id)), 'juist/fout per vraag onder ooi_…');

  /* de rekenmachine verslepen aan de kop: ze blijft op die plaats, ook bij de volgende vraag */
  await p.click('nav.side button[data-d=get]'); await p.waitForTimeout(150);
  await p.click('form[data-f=keuze] button[type=submit]'); await p.waitForTimeout(300);
  for(let i = 0; i < 10 && !(await p.locator('.tools [data-a=calc]').count()); i++){ await p.click('[data-a=weetniet]'); await p.waitForTimeout(60); await p.click('[data-a=verder]'); await p.waitForTimeout(80); }
  await p.click('.tools [data-a=calc]'); await p.waitForTimeout(80);
  const r0 = await p.locator('#calc').boundingBox(), kb = await p.locator('#calc .paneelkop b').boundingBox();
  await p.mouse.move(kb.x + 10, kb.y + 5); await p.mouse.down(); await p.mouse.move(kb.x - 250, kb.y + 150, { steps:6 }); await p.mouse.up(); await p.waitForTimeout(80);
  const r1 = await p.locator('#calc').boundingBox();
  await p.click('[data-a=weetniet]'); await p.waitForTimeout(60); await p.click('[data-a=verder]'); await p.waitForTimeout(120);
  if(!(await p.locator('#calc').count()) && await p.locator('.tools [data-a=calc]').count()) await p.click('.tools [data-a=calc]');
  const r2 = await p.locator('#calc').count() ? await p.locator('#calc').boundingBox() : null;
  check(Math.abs(r1.x - r0.x + 260) < 15 && Math.abs(r1.y - r0.y - 145) < 15 && (!r2 || (Math.abs(r2.x - r1.x) < 2 && Math.abs(r2.y - r1.y) < 2)), 'rekenmachine verplaatsen aan de kop; ze blijft op haar plaats');
  await p.click('[data-a=stop]'); await p.click('[data-a=stopja]'); await p.waitForTimeout(150);

  /* proeftoets 2: problemen oplossen, verhoudingen, statistiek */
  await p.click('nav.side button[data-d=toets2]'); await p.click('[data-a=proefstart]'); await p.waitForTimeout(200);
  for(let d = 0; d < 3; d++){
    for(let i = 0; i < 15; i++){ await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); await p.waitForTimeout(40); }
    const vd = p.locator('[data-a=proefverder]'); if(await vd.count()){ await vd.click(); await p.waitForTimeout(150); }
  }
  check(/45 van de 45/.test(await p.locator('#app').innerText()), 'proeftoets 45 van de 45');
  const t = await p.evaluate(()=>JSON.parse(localStorage.getItem('2b_wp_v1_niv') || '{}').toets2);
  check(t && t.delen && Object.keys(t.delen).join() === 'wpo,ver,sta', 'letter per deel: ' + JSON.stringify(t && t.delen));
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await p.waitForTimeout(800);
  const doc = (await H.fakedb(p))['voortgang/llb_2b-wp'];
  check(doc && doc.data && doc.data.niv && doc.data._toets && doc.data.doelen, 'voortgang staat in Firestore onder 2b-wp');
  check(!p.fouten.length, 'leerling: geen JavaScript-fouten ' + p.fouten.join(' | '));

  /* leerkracht: doelen per letter en dashboard */
  const q = await H.pagina(ctx, await H.fakedb(p));
  await H.aanmelden(q, '2B/wiskundige-problemen/', LK); await q.waitForTimeout(1200);
  await q.click('button[data-a=kies][data-d=get]'); await q.waitForTimeout(200);
  const lk = await q.locator('.lkdoelen').innerHTML();
  check(await q.locator('.lkdoelen .lkl').count() === 4 && await q.locator('.lkdoelen li').count() === 44 && /B-GET-/.test(lk), 'leerkracht ziet de 44 B-doelen van getallenleer per letter');
  await q.goto(H.B + 'dashboard/'); await q.waitForTimeout(1500);
  await q.click('.tab:has-text("Voortgang")'); await q.waitForTimeout(500);
  const site = q.locator('#siteSel');
  if(await site.count()){ await site.selectOption('2b-wp'); await q.waitForTimeout(800); }
  const cel = await q.locator('table.dt td.sc .niv-l').allTextContents();
  check(cel.length >= 4, 'dashboard toont de letter per thema en per deel: ' + cel.join(' '));
  await q.click('.naam-btn'); await q.waitForTimeout(1200);
  check(await q.locator('.doelen-lk .doel-thema').count() >= 1 && /B-OOI|omtrek/i.test(await q.locator('.doelen-lk').innerText()), 'dashboard: B-doelen per letter in de detailweergave');
  check(!q.fouten.length, 'leerkracht: geen JavaScript-fouten ' + q.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
