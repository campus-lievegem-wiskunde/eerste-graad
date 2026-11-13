/* Oplossingssleutel van een module (dashboard/sleutel.html), met de nep-Firebase.
   node test/sleutel.js   (eerst test/serve.sh)
   Leerkracht: knop Sleutel in het dashboard (Openzetten en Voortgang) en link in de module, sleutel van 1A heuristieken met
   7 hoofdstukken en 93 opgaven, elk met antwoord en uitwerking in vier stappen, telkens hetzelfde voorbeeld, hoofdstuk uitvinken,
   niets in localStorage van de module. Leerling en toeschouwer: pagina niet beschikbaar, geen link. Onbekende site: melding. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LK = { uid:'lk', email:'vandaele.tom@svsl.be', displayName:'Tom Van Daele' };
  const LL = { uid:'lls', email:'peeters.noor@svsl.be', displayName:'Noor Peeters' };
  const TS = { uid:'ts', email:'kijker.karel@svsl.be', displayName:'Karel Kijker' };
  const start = { 'leerkrachten/vandaele.tom@svsl.be':{ naam:'Tom Van Daele' }, 'toeschouwers/kijker.karel@svsl.be':{ naam:'Karel Kijker' },
    'leerlingen/peeters.noor@svsl.be':{ familienaam:'Peeters', voornaam:'Noor', klas:'1E', jaar:'1', stroom:'A' },
    'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', soort:'niveaugroep', leerkrachten:[LK.email], leerlingen:[LL.email], aan:{ '1a-wp':{ on:true }, 'm1':{ on:true } } } };
  const URL = 'dashboard/sleutel.html?site=1a-wp';
  const klaar = p=>p.waitForSelector('body[data-sleutel-klaar]', { timeout:8000 }).then(()=>true, ()=>false);

  /* 1. leerkracht: de sleutel zelf */
  let p = await H.pagina(ctx, start);
  await H.aanmelden(p, URL, LK);
  check(await klaar(p) && !p.fouten.length, 'leerkracht: de sleutel wordt opgebouwd zonder fouten ' + p.fouten.join(' | '));
  const titels = await p.locator('.sl-hfst > h2').allTextContents();
  check(titels.length === 7 && /Een schets maken/.test(titels[0]) && /Systematisch tellen/.test(titels[5]) && /door elkaar/.test(titels[6]), 'zes heuristieken en daarna Door elkaar: ' + titels.join(' | '));
  const tel = await p.evaluate(()=>[...document.querySelectorAll('.sl-hfst')].map(h=>h.querySelectorAll('.sl-item').length));
  check(tel.join() === '13,12,12,12,12,12,20', 'aantal opgaven per hoofdstuk: ' + tel.join(', '));
  const onvolledig = await p.evaluate(()=>[...document.querySelectorAll('.sl-item')].filter(a=>a.querySelectorAll('.sl-stap').length !== 4 || !a.querySelector('.sl-antw b').textContent.trim()
    || !a.querySelector('.hv-tekst').textContent.trim() || (a.querySelector('.sl-keuzes') && a.querySelectorAll('.sl-keuzes li.juist').length !== 1) || /undefined|NaN/.test(a.textContent)).map(a=>a.querySelector('.sl-code').textContent));
  check(!onvolledig.length, 'elke opgave heeft een opgave, één antwoord en vier stappen ' + onvolledig.join(', '));
  const groepen = await p.locator('#h-schets .sl-groep > h3').allTextContents();
  check(groepen.join('|') === 'Instap|Moeilijker|Verdieping', 'per heuristiek: instap, moeilijker, verdieping');
  const mix = await p.locator('#h-mix .sl-groep > h3').allTextContents();
  check(mix.length >= 5 && /^Hoofdheuristiek: een schets maken/.test(mix[0]) && await p.locator('#h-mix .sl-extra').count() === 20, 'Door elkaar: per hoofdheuristiek, met de handige heuristieken bij elke opgave (' + mix.length + ' groepen)');
  check((await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('1a_wp')))).length === 0 && !Object.keys(await H.fakedb(p)).some(k=>k.startsWith('voortgang/')), 'de sleutel bewaart niets (geen localStorage van de module, geen voortgang)');
  const eerste = await p.locator('#h-schets .sl-item').first().innerText();
  await p.reload(); await klaar(p);
  check(eerste === await p.locator('#h-schets .sl-item').first().innerText(), 'telkens hetzelfde vaste voorbeeld');
  await p.uncheck('#kies-mix');
  check(!(await p.locator('#h-mix').isVisible()) && await p.locator('.sl-inhoud li:visible').count() === 6, 'een hoofdstuk uitvinken haalt het uit de pagina en de inhoud');
  await p.emulateMedia({ media:'print' });
  check(!(await p.locator('#balk').isVisible()) && await p.locator('#h-schets .sl-item').first().isVisible(), 'afdrukken: de knoppenbalk valt weg, de sleutel blijft');
  await p.emulateMedia({ media:'screen' });

  /* 2. leerkracht: knoppen in het dashboard en link in de module */
  await p.goto(H.B + 'dashboard/'); await p.waitForTimeout(1500);
  await p.locator('button:has-text("1ANg1"), a:has-text("1ANg1"), .groep:has-text("1ANg1")').first().click().catch(()=>{}); await p.waitForTimeout(800);
  await p.locator('.tab:has-text("Openzetten")').first().click().catch(()=>{}); await p.waitForTimeout(800);
  const knoppen = p.locator('a.sleutel-knop');
  check(await knoppen.count() === 1 && /sleutel\.html\?site=1a-wp$/.test(await knoppen.first().getAttribute('href')), 'dashboard, Openzetten: knop Sleutel enkel bij Heuristieken (' + await knoppen.count() + ')');
  await p.goto(H.B + '1A/wiskundige-problemen/'); await p.waitForTimeout(1500);
  const link = p.locator('.lk-tip .lk-sleutel a');
  check(await link.count() === 1 && /dashboard\/sleutel\.html\?site=1a-wp$/.test(await link.getAttribute('href')), 'module: link Oplossingssleutel in de tip voor de leerkracht');
  check(await p.locator('nav.side .lbl').count() === 9 && await p.evaluate(()=>!window.CL_SLEUTEL), 'de module zelf werkt gewoon (9 onderdelen)');
  await p.goto(H.B + '1A/modules/module-1-getallen/'); await p.waitForTimeout(1500);
  check(await p.locator('.lk-tip').count() === 1 && await p.locator('.lk-sleutel').count() === 0, 'module zonder sleutel: geen link');
  await p.goto(H.B + 'dashboard/sleutel.html?site=m1'); await p.waitForTimeout(1200);
  check(/geen oplossingssleutel/.test(await p.locator('#app').innerText()), 'site zonder sleutel: melding');
  await p.close();

  /* 3. leerling */
  p = await H.pagina(ctx, start);
  await H.aanmelden(p, URL, LL); await p.waitForTimeout(800);
  check(/enkel voor leerkrachten/.test(await p.locator('#app').innerText()) && await p.locator('.sl-item').count() === 0 && await p.evaluate(()=>!window.CL_SLEUTEL), 'leerling: pagina niet beschikbaar, niets geladen');
  await p.goto(H.B + '1A/wiskundige-problemen/'); await p.waitForTimeout(1500);
  check(await p.locator('.lk-sleutel').count() === 0, 'leerling: geen link in de module');
  await p.close();

  /* 4. toeschouwer */
  p = await H.pagina(ctx, start);
  await H.aanmelden(p, URL, TS); await p.waitForTimeout(800);
  check(/enkel voor leerkrachten/.test(await p.locator('#app').innerText()) && await p.locator('.sl-item').count() === 0, 'toeschouwer: pagina niet beschikbaar');
  await p.goto(H.B + '1A/wiskundige-problemen/'); await p.waitForTimeout(1500);
  check(await p.locator('.lk-tip').count() === 1 && await p.locator('.lk-sleutel').count() === 0, 'toeschouwer: geen link in de module');
  await p.close();

  await b.close(); console.log(ok ? 'Alles OK' : 'ER ZIJN FOUTEN'); process.exit(ok ? 0 : 1);
})();
