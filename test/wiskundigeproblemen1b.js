/* Wiskundige problemen oplossen 1B (site 1b-wp, B-stroom), met de nep-Firebase.
   node test/wiskundigeproblemen1b.js   (eerst test/serve.sh)
   Zelfde inhoud als 2B (site 1b-wp), met een eigen site-id, prefix, tegel en titel voor het eerste jaar.
   Leerling van klas 1B: tegel op de 1B-pagina, titel Wiskundige problemen oplossen, de thema's van de B-stroom, een reeks en een proeftoets,
   voortgang onder 1b-wp (niets onder 1b-wp). Leerkracht: aanvinken bij Openzetten voor groep 1B, letters en doelen in het dashboard. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LL = { uid:'llb', email:'jacobs.senne@svsl.be', displayName:'Senne Jacobs' };
  const LK = { uid:'lk', email:'vandaele.tom@svsl.be', displayName:'Tom Van Daele' };
  const start = { 'leerkrachten/vandaele.tom@svsl.be':{ naam:'Tom Van Daele' },
    'leerlingen/jacobs.senne@svsl.be':{ familienaam:'Jacobs', voornaam:'Senne', klas:'1B', jaar:'1', stroom:'B' },
    'groepen/1B':{ naam:'1B', jaar:'1', stroom:'B', soort:'klas B-stroom', leerkrachten:[LK.email], leerlingen:[LL.email], aan:{ '1b-wp':{ on:true, uit:[] } } },
    'groepen/2B':{ naam:'2B', jaar:'2', stroom:'B', soort:'klas B-stroom', leerkrachten:[LK.email], leerlingen:[], aan:{} } };
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, '1B/', LL); await p.waitForTimeout(1000);
  check(await p.locator('a.tegel[data-site="1b-wp"]:visible').count() === 1, 'tegel Wiskundige problemen staat open op de 1B-pagina');
  check(/Wiskundige problemen oplossen/.test(await p.locator('a.tegel[data-site="1b-wp"] b').innerText()), 'de tegel heet Wiskundige problemen oplossen');
  await p.goto(H.B + '1B/wiskundige-problemen/'); await p.waitForTimeout(1500);
  check((await p.locator('#kopTitel').innerText()).trim() === 'Wiskundige problemen oplossen', 'titel van de site: ' + await p.locator('#kopTitel').innerText());
  await p.click('nav.side button[data-d=get]'); await p.waitForTimeout(150); await p.click('nav.side button[data-d=thuis]'); await p.waitForTimeout(150);
  check((await p.locator('#kopTitel').innerText()).trim() === 'Wiskundige problemen oplossen', 'titel blijft na terugkeren naar het overzicht');
  const nav = await p.locator('nav.side .lbl').allTextContents();
  check(nav.join('|') === 'Overzicht|Problemen oplossen|Getallenleer|Objecten en relaties|Omtrek en oppervlakte|Statistiek|Tabellen en diagrammen|Verhoudingen|Proeftoets 1|Proeftoets 2|Proeftoets 3',
    'thema\'s van de B-stroom in de volgorde van de leeswijzer: ' + nav.join(', '));
  check(!/Algebra|Verzamelingen|Transformaties/.test(nav.join()), 'geen thema\'s van de A-stroom');

  /* omtrek en oppervlakte: knop Formuleblad bij elke vraag (geen formulekader meer), en het gedeelde basisrekentoestel */
  await p.click('nav.side button[data-d=ooi]'); await p.waitForTimeout(150);
  await p.click('form[data-f=keuze] button[type=submit]'); await p.waitForTimeout(300);
  const vak = sel => p.evaluate(s=>{ const e = document.querySelector(s); if(!e) return null; const r = e.getBoundingClientRect(); return { l:r.left, t:r.top, r:r.right, b:r.bottom, pos:getComputedStyle(e).position }; }, sel);
  const H_ = await p.evaluate(()=>innerHeight);
  let kader = 0, knop = 0, rmTotaal = 0, rmBasis = 0, bladGetest = false, rmGetest = false;
  for(let i = 0; i < 10; i++){
    kader += await p.locator('.opgave .formkader').filter({ hasText:/(omtrek|oppervlakte|inhoud)[^=]*=|π/ }).count(); knop += await p.locator('.tools [data-a=form]:has-text("Formuleblad")').count();
    if(!bladGetest){ bladGetest = true;
      await p.click('.tools [data-a=form]'); await p.waitForTimeout(120);
      const t = await p.locator('#form.formblad').innerText();
      check(/Omtrek/.test(t) && /Oppervlakte/.test(t) && /Volume/.test(t) && !/Inhoud|Cilinder|cilinder/.test(t), 'formuleblad met omtrek, oppervlakte en volume');
      check(['rechthoek', 'vierkant', 'driehoek', 'cirkel', 'parallellogram', 'ruit', 'trapezium', 'balk', 'kubus'].every(w=>t.includes(w)) && /lengte × breedte/.test(t) && /π ≈ 3,14/.test(t), 'formules in woorden voor alle afgesproken figuren');
      const f0 = await vak('#form'), og = await vak('.opgave .tekst');
      check(f0.pos === 'fixed' && f0.l < 40 && f0.b > H_ - 40 && f0.b <= H_, 'formuleblad zweeft linksonder op het scherm (' + Math.round(f0.l) + ',' + Math.round(f0.t) + ')');
      check(f0.t >= og.b || f0.r <= og.l || f0.l >= og.r || f0.b <= og.t, 'formuleblad bedekt de tekst van de opgave niet');
      check(await p.locator('#form .paneelkop .vs-greep').count() === 1, 'formuleblad heeft een greepje');
      const kp = await vak('#form .paneelkop'); await p.mouse.move(kp.l + 120, kp.t + 12); await p.mouse.down(); await p.mouse.move(kp.l + 220, kp.t - 60, { steps:5 }); await p.mouse.up(); await p.waitForTimeout(80);
      const f1 = await vak('#form');
      check(Math.abs(f1.l - (f0.l + 100)) <= 3 && Math.abs(f1.t - (f0.t - 72)) <= 3, 'formuleblad versleepbaar');
      await p.click('#form .sluit'); await p.waitForTimeout(80);
      check(await p.locator('#form').count() === 0, 'formuleblad sluit');
    }
    const rm = p.locator('.tools [data-a=calc]');
    if(await rm.count()){ rmTotaal++; await rm.click(); await p.waitForTimeout(80);
      rmBasis += await p.locator('#basisrekentoestel:visible').count() && !(await p.locator('#calc').count()) ? 1 : 0;
      if(!rmGetest){ rmGetest = true;
        check(await rm.getAttribute('aria-expanded') === 'true', 'knop Rekenmachine staat aan');
        const r0 = await vak('#basisrekentoestel'), kaart = await vak('.opgave');
        check(r0.pos === 'fixed' && r0.r > 1366 - 60 && r0.b > H_ - 40, 'basisrekentoestel zweeft rechtsonder op het scherm, los van de opgave');
        check(await p.evaluate(()=>!document.getElementById('basisrekentoestel').closest('.opgave')) && r0.l >= kaart.r - 2, 'het staat niet in of op de opgavekaart');
        const toetsen = (await p.locator('#basisrekentoestel .brt-k').allTextContents()).join(' ');
        check(toetsen === 'C ⌫ ( ) 7 8 9 ÷ 4 5 6 × 1 2 3 − 0 , = +', 'toetsen van het basisrekentoestel: ' + toetsen);
        for(const k of ['2', '×', '(', '3', '+', '4', ')', '=']) await p.click(`#basisrekentoestel .brt-k[data-k="${k}"]`);
        check((await p.locator('#basisrekentoestel .brt-uit').innerText()).trim() === '14', '2 × (3 + 4) = 14');
        check(await p.locator('#basisrekentoestel .vs-greep').count() === 1, 'greepje in de titelbalk');
        const bk = await vak('#basisrekentoestel .brt-balk'); await p.mouse.move(bk.l + 90, bk.t + 10); await p.mouse.down(); await p.mouse.move(bk.l - 100, bk.t - 80, { steps:5 }); await p.mouse.move(bk.l - 310, bk.t - 140, { steps:5 }); await p.mouse.up(); await p.waitForTimeout(80);
        const r1 = await vak('#basisrekentoestel');
        check(Math.abs(r1.l - (r0.l - 400)) <= 3 && Math.abs(r1.t - (r0.t - 150)) <= 3, 'basisrekentoestel versleepbaar');
        await p.click('.tools [data-a=marker]'); await p.waitForTimeout(100); await p.click('.tools [data-a=marker]'); await p.waitForTimeout(100);
        const r2 = await vak('#basisrekentoestel');
        check(r2 && Math.abs(r2.l - r1.l) <= 2 && Math.abs(r2.t - r1.t) <= 2, 'het blijft staan als de vraag opnieuw getekend wordt');
        await p.click('#basisrekentoestel .brt-x'); await p.waitForTimeout(80);
        check(await p.locator('.tools [data-a=calc]').getAttribute('aria-expanded') === 'false' && await p.locator('#basisrekentoestel:visible').count() === 0, 'sluitknop sluit het toestel en zet de knop uit');
        await p.click('.tools [data-a=calc]'); await p.waitForTimeout(80);
        const r3 = await vak('#basisrekentoestel');
        check(Math.abs(r3.l - r0.l) <= 2 && Math.abs(r3.t - r0.t) <= 2, 'opnieuw openen: weer rechtsonder');
      }
      await p.locator('.tools [data-a=calc]').click(); await p.waitForTimeout(40);
    }
    await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); await p.waitForTimeout(60); await p.click('[data-a=verder]'); await p.waitForTimeout(60);
  }
  check(rmTotaal > 0 && rmBasis === rmTotaal, 'altijd het basisrekentoestel (' + rmBasis + ' van ' + rmTotaal + ')');
  check(kader === 0 && knop === 10, 'knop Formuleblad bij elke vraag (' + knop + ' van 10), geen formulekader meer');
  check(await p.locator('.ti30-fab').count() === 0 && await p.evaluate(()=>!window.TI30XB), 'geen knop rechtsonder en geen TI-30XB in de B-stroom');
  check(await p.locator('#app .niv-l').count() === 0, 'leerling ziet geen letters');
  const ls = await p.evaluate(()=>({ niv:JSON.parse(localStorage.getItem('1b_wp_v1_niv') || '{}'), dg:JSON.parse(localStorage.getItem('1b_wp_v1_doelen') || '{}'), res:JSON.parse(localStorage.getItem('1b_wp_v1__res') || '{}') }));
  check(ls.niv.ooi && ls.niv.ooi.t === 10 && ls.niv.ooi.j === 10, 'letter per thema bewaard: ' + JSON.stringify(ls.niv.ooi));
  check(Object.keys(ls.dg).length >= 3 && Object.keys(ls.dg).every(c=>/^B-OOI-[ABCD]\d+$/.test(c)), 'B-doelen bewaard: ' + Object.keys(ls.dg).join(' '));
  check(Object.keys(ls.res).length === 10 && Object.keys(ls.res).every(id=>/^ooi_/.test(id)), 'juist/fout per vraag onder ooi_…');

  /* proeftoets 2: problemen oplossen, verhoudingen, statistiek */
  await p.click('nav.side button[data-d=toets2]'); await p.click('[data-a=proefstart]'); await p.waitForTimeout(200);
  for(let d = 0; d < 3; d++){
    for(let i = 0; i < 15; i++){ await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); await p.waitForTimeout(40); }
    const vd = p.locator('[data-a=proefverder]'); if(await vd.count()){ await vd.click(); await p.waitForTimeout(150); }
  }
  check(/45 van de 45/.test(await p.locator('#app').innerText()), 'proeftoets 45 van de 45');
  const t = await p.evaluate(()=>JSON.parse(localStorage.getItem('1b_wp_v1_niv') || '{}').toets2);
  check(t && t.delen && Object.keys(t.delen).join() === 'wpo,ver,sta', 'letter per deel: ' + JSON.stringify(t && t.delen));
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await p.waitForTimeout(800);
  const doc = (await H.fakedb(p))['voortgang/llb_1b-wp'];
  check(doc && doc.data && doc.data.niv && doc.data._toets && doc.data.doelen, 'voortgang staat in Firestore onder 1b-wp');
  check(!(await H.fakedb(p))['voortgang/llb_2b-wp'], 'niets bewaard onder 2b-wp');
  check(!p.fouten.length, 'leerling: geen JavaScript-fouten ' + p.fouten.join(' | '));

  /* leerkracht: doelen per letter en dashboard */
  const q = await H.pagina(ctx, await H.fakedb(p));
  await H.aanmelden(q, '1B/wiskundige-problemen/', LK); await q.waitForTimeout(1200);
  await q.click('button[data-a=kies][data-d=get]'); await q.waitForTimeout(200);
  const lk = await q.locator('.lkdoelen').innerHTML();
  check(await q.locator('.lkdoelen .lkl').count() === 4 && await q.locator('.lkdoelen li').count() === 44 && /B-GET-/.test(lk), 'leerkracht ziet de 44 B-doelen van getallenleer per letter');
  await q.goto(H.B + 'dashboard/'); await q.waitForTimeout(1500);
  await q.click('.tab:has-text("Voortgang")'); await q.waitForTimeout(500);
  const site = q.locator('#siteSel');
  if(await site.count()){ await site.selectOption('1b-wp'); await q.waitForTimeout(800); }
  const cel = await q.locator('table.dt td.sc .niv-l').allTextContents();
  check(cel.length >= 4, 'dashboard toont de letter per thema en per deel: ' + cel.join(' '));
  await q.click('.naam-btn'); await q.waitForTimeout(1200);
  check(await q.locator('.doelen-lk .doel-thema').count() >= 1 && /B-OOI|omtrek/i.test(await q.locator('.doelen-lk').innerText()), 'dashboard: B-doelen per letter in de detailweergave');
  /* Openzetten: de site staat bij groep 1B (en niet bij 2B), en is er aan en uit te vinken */
  await q.goto(H.B + 'dashboard/'); await q.waitForTimeout(1500);
  await q.click('.tab:has-text("Openzetten")'); await q.waitForTimeout(500);
  const sw = q.locator('.site-blok label.switch:has-text("Wiskundige problemen oplossen · 1ste jaar B-stroom") input');
  check(await sw.count() === 1 && await sw.isChecked(), 'Openzetten voor groep 1B toont Wiskundige problemen oplossen, aangevinkt');
  const blok1b = q.locator('.site-blok:has(label.switch:has-text("Wiskundige problemen oplossen · 1ste jaar B-stroom"))');
  check(await blok1b.locator('.rt-keuze').count() === 1 && await blok1b.locator('.rt-keuze:visible').count() === 0, 'B-stroom: het vinkje voor de knop met het rekentoestel is verborgen');
  await sw.uncheck(); await q.waitForTimeout(600);
  check((await H.fakedb(q))['groepen/1B'].aan['1b-wp'].on === false, 'uitvinken wordt bewaard voor groep 1B');
  await sw.check(); await q.waitForTimeout(600);
  check((await H.fakedb(q))['groepen/1B'].aan['1b-wp'].on === true, 'opnieuw aanvinken wordt bewaard');
  check(!(await H.fakedb(q))['groepen/2B'].aan['1b-wp'], 'groep 2B blijft ongewijzigd');
  /* buiten wiskundige problemen blijft het rekentoestel zoals het was (afspraak 20 november 2026): 2B-module 1 */
  await q.goto(H.B + '2B/modules/module-1-rekenen/'); await q.waitForTimeout(2000);
  check(await q.locator('.ti30-fab').count() === 1 && await q.evaluate(()=>!window.Basisrekentoestel), '2B-module: knop met de TI-30XB blijft, geen basisrekentoestel');
  check(!q.fouten.length, 'leerkracht: geen JavaScript-fouten ' + q.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
