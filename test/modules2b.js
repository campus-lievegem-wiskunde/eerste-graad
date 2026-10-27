/* 2B Modules 1-4 (sites 2b-m1 tot 2b-m4), met de nep-Firebase.
   node test/modules2b.js   (eerst test/serve.sh)
   Leerling van klas 2B: tegel Modules, enkel de open modules, verborgen onderdeel weg, kaart controleren en nieuwe opgave,
   puzzels tellen niet mee, proeftoets met score, voortgang in Firestore. Leerkracht: Bord op een kaart, niet in de proeftoets. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LL = { uid:'llb', email:'jacobs.senne@svsl.be', displayName:'Senne Jacobs' };
  const LK = { uid:'lk', email:'vandaele.tom@svsl.be', displayName:'Tom Van Daele' };
  const start = { 'leerkrachten/vandaele.tom@svsl.be':{ naam:'Tom Van Daele' },
    'leerlingen/jacobs.senne@svsl.be':{ familienaam:'Jacobs', voornaam:'Senne', klas:'2B', jaar:'2', stroom:'B' },
    'groepen/2B':{ naam:'2B', jaar:'2', stroom:'B', soort:'klas B-stroom', leerkrachten:[LK.email], leerlingen:[LL.email], aan:{ '2b-m1':{ on:true, uit:['schatten'] }, '2b-m3':{ on:true, uit:[] } } } };
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, '2B/modules/', LL); await p.waitForTimeout(1000);
  check(await p.locator('a.tegel[data-site="2b-m1"]:visible').count() === 1 && await p.locator('a.tegel[data-site="2b-m3"]:visible').count() === 1, 'open modules 1 en 3 staan bij Modules');
  check(await p.locator('a.tegel[data-site="2b-m2"]:visible').count() === 0 && await p.locator('a.tegel[data-site="2b-m4"]:visible').count() === 0, 'gesloten modules 2 en 4 zijn verborgen');

  await p.goto(H.B + '2B/modules/module-1-rekenen/'); await p.waitForTimeout(1500);
  const nav = await p.locator('nav.side .lbl').allTextContents();
  check(nav.join('|') === 'Rekenen met geld|Handig rekenen|Gemiddelde en mediaan|Met de rekenmachine|Puzzels|Snelle quiz|Proeftoets', 'onderdelen zonder het verborgen Schatten: ' + nav.join(', '));

  /* een kaart: fout, dan juist */
  const kaart = p.locator('[data-kaart="geld_komma"]');
  await kaart.locator('.inp').first().fill('1'); await kaart.locator('.q-act .btn').first().click(); await p.waitForTimeout(100);
  check(/Nog niet juist/.test(await kaart.locator('.kfb').innerText()), 'fout antwoord: Nog niet juist');
  await p.evaluate(()=>document.querySelector('[data-kaart="geld_komma"]')._vulJuist()); await kaart.locator('.q-act .btn').first().click(); await p.waitForTimeout(100);
  check(/^Juist/.test(await kaart.locator('.kfb').innerText()), 'juiste antwoorden: Juist!');
  const res = await p.evaluate(()=>JSON.parse(localStorage.getItem('2b_m1_rekenen_v1__res') || '{}'));
  check(['0', '1', '2', '3'].every(i=>res['geld_geld_komma_' + i] === 1), 'juist per vraag bewaard onder geld_geld_komma_…');
  const zaad = await p.evaluate(()=>JSON.parse(localStorage.getItem('2b_m1_rekenen_v1_k_geld_komma')).seed);
  await kaart.locator('.refresh-btn').click(); await p.waitForTimeout(100);
  check(zaad !== await p.evaluate(()=>JSON.parse(localStorage.getItem('2b_m1_rekenen_v1_k_geld_komma')).seed), 'Nieuwe opgave geeft nieuwe getallen');

  /* geld aanklikken */
  await p.evaluate(()=>document.querySelector('[data-kaart="geld_gepast"]')._vulJuist()); await p.locator('[data-kaart="geld_gepast"] .q-act .btn').first().click(); await p.waitForTimeout(100);
  check(/^Juist/.test(await p.locator('[data-kaart="geld_gepast"] .kfb').innerText()), 'gepast betalen met munten en biljetten: Juist!');

  /* puzzels tellen niet mee */
  await p.click('nav.side button:has-text("Puzzels")'); await p.waitForTimeout(200);
  await p.evaluate(()=>document.querySelector('[data-kaart="p_som"]')._vulJuist()); await p.locator('[data-kaart="p_som"] .q-act .btn').first().click(); await p.waitForTimeout(100);
  const res2 = await p.evaluate(()=>JSON.parse(localStorage.getItem('2b_m1_rekenen_v1__res') || '{}'));
  check(/^Juist/.test(await p.locator('[data-kaart="p_som"] .kfb').innerText()) && !Object.keys(res2).some(k=>/^puzzels_/.test(k)), 'puzzel opgelost, telt niet mee');

  /* rekenmachine */
  await p.click('nav.side button:has-text("Gemiddelde en mediaan")'); await p.waitForTimeout(200);
  await p.click('section#gem .rm-knop'); for(const k of ['7', 'x', '6', '=']) await p.click(`.rm-venster .rm-k:text-is("${k}")`);
  check(await p.locator('.rm-uit').innerText() === '42', 'eenvoudige rekenmachine: 7 x 6 = 42');

  /* proeftoets */
  await p.click('nav.side button:has-text("Proeftoets")'); await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelector('.proeftoets')._vulJuist()); await p.waitForTimeout(100);
  await p.click('.proeftoets .pt-actions .btn'); await p.waitForTimeout(300);
  const sc = await p.locator('.proeftoets .score .big').innerText(); const [s1, n1] = sc.split('/').map(Number);
  check(s1 === n1 && n1 >= 20, 'proeftoets volledig juist: ' + sc);
  const toets = await p.evaluate(()=>JSON.parse(localStorage.getItem('2b_m1_rekenen_v1__toets') || '{}'));
  check(toets.toets_1 && toets.toets_1.score === s1, 'score bewaard onder toets_1');
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await p.waitForTimeout(800);
  const doc = (await H.fakedb(p))['voortgang/llb_2b-m1'];
  check(doc && doc.data && doc.data._res && doc.data._toets, 'voortgang staat in Firestore onder 2b-m1');

  /* module 3: punten zetten in het assenstelsel (x-as groen, y-as rood) */
  await p.goto(H.B + '2B/modules/module-3-coordinaten/'); await p.waitForTimeout(1500);
  await p.click('nav.side button:has-text("Assenstelsel")'); await p.waitForTimeout(200);
  const kleur = await p.evaluate(()=>{ const l = [...document.querySelectorAll('[data-kaart="a_assen"] svg.assen line')]; return [...new Set(l.map(x=>x.getAttribute('stroke')))]; });
  check(kleur.includes('var(--as-x)') && kleur.includes('var(--as-y)'), 'assenstelsel met een groene x-as en een rode y-as');
  const zet = p.locator('[data-kaart="a_zet1"]');
  const doel = await p.evaluate(()=>{ const st = JSON.parse(localStorage.getItem('2b_m3_coord_v1_k_a_zet1')); return window.__m2b.maakKaart('a_zet1', st.seed).vragen[0].voorbeeld; });
  for(const [n, [x, y]] of Object.entries(doel)){
    await zet.locator('.pz-k', { hasText:n }).first().click();
    const box = await zet.locator('.pz-fig svg').boundingBox(); const vb = await zet.locator('.pz-fig svg').evaluate(s=>({ width:s.viewBox.baseVal.width }));
    const sx = box.width / vb.width; /* min 0, max 6, cel 38, marge 24 */
    await p.mouse.click(box.x + (24 + x * 38) * sx, box.y + (24 + 12 + (6 - y) * 38) * sx);
  }
  await zet.locator('.q-act .btn').first().click(); await p.waitForTimeout(100);
  check(/^Juist/.test(await zet.locator('.kfb').innerText()), 'punten aanklikken in het assenstelsel: Juist!');
  check(!p.fouten.length, 'leerling: geen JavaScript-fouten ' + p.fouten.join(' | '));

  /* leerkracht: Bord op een kaart, niet in de proeftoets */
  const q = await H.pagina(ctx, await H.fakedb(p));
  await H.aanmelden(q, '2B/modules/module-4-figuren/', LK); await q.waitForTimeout(1500);
  check(await q.locator('section#vlak .card .px-bord-btn').count() > 3, 'leerkracht: knop Bord op de kaarten');
  await q.click('nav.side button:has-text("Aanzichten")'); await q.waitForTimeout(200);
  const fig0 = await q.locator('[data-kaart="z_bouw1"] .bs-fig').innerHTML(); await q.click('[data-kaart="z_bouw1"] [data-d="1"]'); await q.waitForTimeout(100);
  check(fig0 !== await q.locator('[data-kaart="z_bouw1"] .bs-fig').innerHTML(), 'bouwsel draait met de knop');
  await q.click('nav.side button:has-text("Proeftoets")'); await q.waitForTimeout(300);
  check(await q.locator('section#toets .px-bord-btn').count() === 0, 'geen Bord in de proeftoets');
  check(!q.fouten.length, 'leerkracht: geen JavaScript-fouten ' + q.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
