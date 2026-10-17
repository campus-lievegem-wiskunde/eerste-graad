/* Rooktest van het hele platform met de nep-Firebase.
   node test/rooktest.js   (eerst test/serve.sh)
   Beheerder importeert test/voorbeeld.xlsx, koppelt een leerkracht, zet module m1 open voor 1ANg1 (zonder het eerste onderdeel)
   en controleert dat een leerling van 1ANg1 enkel de open onderdelen ziet en dat zijn antwoorden bewaard worden. */
const path = require('path'); const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const JER = { uid:'jer', email:'dejaeger.jeroen@svsl.be', displayName:'Jeroen' };
  const p = await H.pagina(ctx, { 'beheerders/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' }, 'leerkrachten/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' } });
  await H.aanmelden(p, 'dashboard/', JER);
  await p.setInputFiles('input[type=file]', path.join(__dirname, 'voorbeeld.xlsx')); await p.waitForTimeout(600);
  await p.click('text=Importeren'); await p.waitForTimeout(3000);
  let db = await H.fakedb(p);
  check(Object.keys(db).filter(k=>k.startsWith('leerlingen/')).length > 0, 'leerlingen geïmporteerd');
  const kaart = t=>p.locator('.dash-card', { hasText:t });
  const volg = await kaart('Niveaugroepen').locator('tbody tr td:first-child').allTextContents();
  check(volg[0] === '1B' && volg.indexOf('1C') < volg.indexOf('1ANg1'), 'volgorde groepen: ' + volg.slice(0, 5).join(' '));
  await kaart('Niveaugroepen').locator('tbody tr', { has:p.locator('td:first-child:text-is("1ANg1")') }).locator('select.lk-add').selectOption({ label:'Jeroen De Jaeger' }); await p.waitForTimeout(600);
  db = await H.fakedb(p); const g = db['groepen/1ANg1'];
  check(g.leerkrachten.includes(JER.email), 'leerkracht gekoppeld aan 1ANg1');
  /* module openzetten zonder eerste onderdeel (rechtstreeks in de database, zoals het tabblad Openzetten doet) */
  const { SITES } = await import('../gedeeld/sites.js'); const m1 = SITES.find(s=>s.id === 'm1'); const eerste = m1.onderdelen[0].id;
  await p.evaluate(([e])=>{ const d = JSON.parse(localStorage.getItem('__fakedb')); d['groepen/1ANg1'].aan = { m1:{ on:true, uit:[e] } }; localStorage.setItem('__fakedb', JSON.stringify(d)); }, [eerste]);
  db = await H.fakedb(p); const lln = g.leerlingen[0];
  /* leerling */
  const q = await H.pagina(ctx, db);
  await H.aanmelden(q, m1.pad, { uid:'lln1', email:lln, displayName:'Leerling' }); await q.waitForTimeout(1200);
  const nav = await q.locator('nav.side .lbl').allTextContents();
  check(nav.length > 0 && !nav.includes(m1.onderdelen[0].naam), `leerling ziet ${nav.length} onderdelen, zonder "${m1.onderdelen[0].naam}"`);
  const inp = q.locator('#app input.inp').first();
  if(await inp.count()){ await inp.fill('1'); await inp.press('Enter'); await q.waitForTimeout(300); await q.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await q.waitForTimeout(800);
    const d2 = await H.fakedb(q); check(!!d2[`voortgang/lln1_m1`], 'voortgang van de leerling bewaard'); }
  const leeg = await H.pagina(ctx, db); await H.aanmelden(leeg, m1.pad, { uid:'x9', email:'niemand.test@svsl.be', displayName:'X' });
  check(/nog niet ingedeeld/.test(await leeg.locator('main').innerText()), 'leerling zonder groep krijgt de melding');
  check(!p.fouten.length && !q.fouten.length, 'geen JavaScript-fouten ' + [...p.fouten, ...q.fouten].join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
