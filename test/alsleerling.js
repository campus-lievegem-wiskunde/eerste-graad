/* Bekijk als leerling, met de nep-Firebase.
   node test/alsleerling.js   (eerst test/serve.sh)
   Een leerkracht kiest in module 1 "Bekijk als leerling van 1ANg1": hij ziet enkel de open onderdelen, geen Bord,
   zijn antwoorden worden niet bewaard, en "Terug" brengt de leerkrachtweergave terug. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const { SITES } = await import('../gedeeld/sites.js'); const m1 = SITES.find(s=>s.id === 'm1'); const eerste = m1.onderdelen[0];
  const LK = { uid:'lk', email:'collega.echt@svsl.be', displayName:'Echte Collega' };
  const start = { 'leerkrachten/collega.echt@svsl.be':{ naam:'Echte Collega' },
    'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', soort:'niveaugroep', leerkrachten:[LK.email], leerlingen:['echte.leerling@svsl.be'], aan:{ m1:{ on:true, uit:[eerste.id], rt:false } } },
    'groepen/1ANg2a':{ naam:'1ANg2a', jaar:'1', stroom:'A', soort:'niveaugroep', leerkrachten:[], leerlingen:[], aan:{} } };
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, m1.pad, LK); await p.waitForTimeout(1500);
  const alle = await p.locator('nav.side .lbl').count();
  const opties = await p.locator('#alsLeerling option').allTextContents();
  check(opties.some(o=>o.startsWith('1ANg1 (mijn groep)')) && opties.some(o=>o.includes('1ANg2a · module dicht')), 'keuzelijst: ' + opties.join(', '));
  await p.selectOption('#alsLeerling', '1ANg1'); await p.waitForTimeout(1800);
  const nav = await p.locator('nav.side .lbl').allTextContents();
  check(await p.locator('.als-balk').isVisible() && nav.length === alle - 1 && !nav.includes(eerste.naam), `als leerling: ${nav.length} van ${alle} onderdelen, zonder "${eerste.naam}"`);
  check(await p.evaluate(()=>document.body.dataset.rol) === 'leerling' && await p.locator('.px-vs-btn').count() >= 0 && await p.locator('.lk-tip').count() === 0, 'leerlingweergave (rol leerling, geen leerkrachttip)');
  const voor = JSON.stringify((await H.fakedb(p))['voortgang/lk_m1'] || null);
  const inp = p.locator('#app input.inp').first();
  if(await inp.count()){ await inp.fill('1'); await inp.press('Enter'); await p.waitForTimeout(300); await p.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await p.waitForTimeout(800); }
  check(JSON.stringify((await H.fakedb(p))['voortgang/lk_m1'] || null) === voor && await inp.count() > 0, 'antwoorden als leerling niet bewaard');
  await p.click('.als-balk button'); await p.waitForTimeout(1800);
  check(await p.locator('.als-balk').count() === 0 && await p.locator('nav.side .lbl').count() === alle, 'terug naar de leerkrachtweergave');
  await p.selectOption('#alsLeerling', '1ANg2a'); await p.waitForTimeout(1500);
  check(/nog niet open/.test(await p.locator('main').innerText()), 'groep met dichte module: melding zoals een leerling');
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
