/* Vrij oefenen 1A en 2A (sites 1a-vrij en 2a-vrij, gedeeld/vrij-oefenen.js), met de nep-Firebase.
   node test/vrijoefenen.js   (eerst test/serve.sh; met SCHERMEN=<map> ook schermafbeeldingen)
   Motor: elke keuze maakt 10 oefeningen, het eigen juiste antwoord wordt aanvaard, een fout of een niet-vereenvoudigde breuk niet.
   Leerling 2A: tegel, verborgen hoofdstuk weg, reeks gehele getallen (9/10), breuken met het breukvak (minteken, vereenvoudigen),
   lege oefeningen (bevestiging), reeks bewaard bij herladen, nieuwe reeks = nieuwe opgaven, één oefening past op het scherm, scores in Firestore.
   Leerling 1A: natuurlijke getallen, geen machten. Leerkracht: dashboard toont laatste en beste score per hoofdstuk. */
const H = require('./helpers'); const fs = require('fs'); const path = require('path');
const SCH = process.env.SCHERMEN || null;
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const shot = async (p, naam) => { if(SCH){ fs.mkdirSync(SCH, { recursive:true }); await p.screenshot({ path:path.join(SCH, naam + '.png') }); } };
  const LL = { uid:'ll2', email:'peeters.noor@svsl.be', displayName:'Noor Peeters' };
  const L1 = { uid:'ll1', email:'janssens.lars@svsl.be', displayName:'Lars Janssens' };
  const LK = { uid:'lk', email:'dejaeger.jeroen@svsl.be', displayName:'Jeroen De Jaeger' };
  const start = { 'leerkrachten/dejaeger.jeroen@svsl.be':{ naam:'Jeroen De Jaeger' },
    'leerlingen/peeters.noor@svsl.be':{ familienaam:'Peeters', voornaam:'Noor', klas:'2E', jaar:'2', stroom:'A' },
    'leerlingen/janssens.lars@svsl.be':{ familienaam:'Janssens', voornaam:'Lars', klas:'1E', jaar:'1', stroom:'A' },
    'groepen/2ANg1':{ naam:'2ANg1', jaar:'2', stroom:'A', soort:'niveaugroep', leerkrachten:[LK.email], leerlingen:[LL.email], aan:{ '2a-vrij':{ on:true, uit:['macht'] } } },
    'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', soort:'niveaugroep', leerkrachten:[LK.email], leerlingen:[L1.email], aan:{ '1a-vrij':{ on:true } } } };
  const P = '2a_vrij_v1_';
  const p = await H.pagina(ctx, start); await p.setViewportSize({ width:1366, height:657 });
  await H.aanmelden(p, '2A/', LL); await p.waitForTimeout(1000);
  check(await p.locator('a.tegel[data-site="2a-vrij"]:visible').count() === 1, 'tegel Vrij oefenen staat open op de 2A-pagina');
  await p.goto(H.B + '2A/vrij-oefenen/'); await p.waitForTimeout(1500);
  const nav = await p.locator('nav.side .lbl').allTextContents();
  check(nav.join('|') === 'Optellen en aftrekken|Vermenigvuldigen en delen|Volgorde van bewerkingen|Alles door elkaar', 'hoofdstukken zonder het verborgen Machten: ' + nav.join(', '));

  /* motor: elke keuze, het eigen juiste antwoord wordt aanvaard */
  const motor = await p.evaluate(()=>{ const V = window.VRIJ, J = V.J; let n = 0, fout = [];
    J.hoofdstukken.forEach(h=>{ const gs = h.bew ? J.getallen.map(x=>x[0]) : ['alle'], bs = h.bew ? h.bew.map(x=>x[0]).concat('alle') : ['alle'];
      gs.forEach(g=>bs.forEach(bw=>{ for(let k = 0; k < 4; k++){ const r = V.maakReeks(J, h.id, g, bw); if(r.length !== 10) fout.push('lengte ' + h.id + g + bw);
        r.forEach(it=>{ n++; const c = V.canoniek(it); if(!V.beoordeel(it, c)) fout.push('juist geweigerd ' + it.html);
          const w = JSON.parse(JSON.stringify(c)); if(w.a != null) w.a += '1'; else w.t = String(Number(w.t) + 1); if(V.beoordeel(it, w)) fout.push('fout aanvaard ' + it.html);
          if(c.n){ if(V.beoordeel(it, { m:c.m, t:String(c.t * 2), n:String(c.n * 2) })) fout.push('niet vereenvoudigd aanvaard ' + it.html); }
          else if(it.s === 'q' && V.beoordeel(it, { m:c.m, t:c.t, n:'1' })) fout.push('noemer 1 aanvaard'); }); } })); });
    return { n, fout:fout.slice(0, 5) }; });
  check(motor.n >= 2000 && !motor.fout.length, `motor 2A: ${motor.n} oefeningen, juist antwoord aanvaard, fout en niet vereenvoudigd geweigerd ${motor.fout.join(' | ')}`);

  /* reeks: gehele getallen, optellen */
  await p.click('.vo-chip[data-g="z"]'); await p.click('.vo-chip[data-b="plus"]'); await p.waitForTimeout(100);
  await shot(p, '1_keuze');
  await p.click('.vo-start'); await p.waitForTimeout(200);
  check(await p.locator('.vo-dot').count() === 10 && /Gehele getallen · Optellen/.test(await p.locator('.vo-badge').innerText()), 'reeks van 10 gestart: gehele getallen · optellen');
  const reeks = () => p.evaluate(k=>JSON.parse(localStorage.getItem(k)), P + 'reeks_optel');
  const vul = async (k, fout) => { const r = await reeks(), it = r.items[k], c = await p.evaluate(it=>VRIJ.canoniek(it), it);
    await p.locator('.vo-dot').nth(k).click(); await p.waitForTimeout(60);
    if(c.a != null) await p.fill('.vo-in', fout ? c.a + '1' : c.a);
    else { if(c.m) await p.click('.vo-mt'); await p.fill('.vo-t', fout ? String(Number(c.t) + 1) : c.t); await p.fill('.vo-n', c.n); }
    return it; };
  const eerste = (await reeks()).items.map(x=>x.html);
  for(let k = 0; k < 9; k++) await vul(k);
  /* herladen: de reeks blijft */
  await p.reload(); await p.waitForTimeout(1500);
  check(await p.locator('.vo-dot.af').count() === 9 && /9 \/ 10 ingevuld/.test(await p.locator('.vo-tel').innerText()), 'na herladen: de reeks met 9 ingevulde oefeningen is er nog');
  await vul(9, true);
  const kaart = await p.locator('.vo-kaart').boundingBox();
  check(kaart.height < 560, `één oefening past op het scherm (kaart ${Math.round(kaart.height)} px hoog)`);
  await shot(p, '2_reeks_gehele_getallen');
  await p.click('.vo-verbeter'); await p.waitForTimeout(200);
  check(/Score 9 \/ 10/.test(await p.locator('.vo-tel').innerText()) && await p.locator('.vo-dot.ok').count() === 9 && await p.locator('.vo-dot.nok').count() === 1, 'verbeterd: score 9/10, 9 groene en 1 rood bolletje');
  check(await p.locator('.vo-res.ok').count() === 1 && await p.locator('.vo-opgave .vo-in:disabled').count() === 1 && await p.locator('.vo-uitleg, .hint-btn').count() === 0, 'enkel ✓ of ✗, het antwoord staat vast, geen uitleg of hint');
  await p.locator('.vo-dot').nth(9).click(); await p.waitForTimeout(80);
  check(await p.locator('.vo-res.nok').count() === 1 && !/[0-9]/.test(await p.locator('.vo-res').innerText()), 'bij een fout: een rood kruisje, zonder het juiste antwoord');
  await shot(p, '3_verbeterd');
  await p.click('.vo-nieuw'); await p.waitForTimeout(200);
  const tweede = (await reeks()).items.map(x=>x.html);
  check(!(await reeks()).klaar && tweede.filter(x=>eerste.includes(x)).length <= 2, 'nieuwe reeks: nieuwe opgaven');
  await p.click('.vo-terug'); await p.waitForTimeout(150);
  check(/9\/10/.test(await p.locator('.vo-cel[data-g="z"][data-b="plus"]').innerText()) && await p.locator('.vo-verder').count() === 1, 'keuzescherm: score 9/10 bij gehele getallen · optellen en "verder met die reeks"');

  /* breuken met het breukvak */
  await p.click('nav.side button:has-text("Vermenigvuldigen en delen")'); await p.waitForTimeout(150);
  await p.click('.vo-chip[data-g="q"]'); await p.click('.vo-chip[data-b="deel"]'); await p.click('.vo-start'); await p.waitForTimeout(200);
  const rq = await p.evaluate(k=>JSON.parse(localStorage.getItem(k)), P + 'reeks_maal');
  check(rq.items.every(x=>x.s === 'q') && await p.locator('.vo-brin .vo-t').count() === 1 && await p.locator('.vo-brin .vo-n').count() === 1, 'breuken: breukvak met teller en noemer');
  await shot(p, '4_breukvak');
  for(let k = 0; k < 10; k++){
    const it = rq.items[k], c = await p.evaluate(it=>VRIJ.canoniek(it), it);
    await p.locator('.vo-dot').nth(k).click(); await p.waitForTimeout(50);
    if(k === 0){ await p.fill('.vo-t', (c.m ? '-' : '') + c.t); await p.fill('.vo-n', c.n); }   /* minteken intikken in de teller */
    else if(k === 1 && c.n){ if(c.m) await p.click('.vo-mt'); await p.fill('.vo-t', String(c.t * 3)); await p.fill('.vo-n', String(c.n * 3)); }   /* niet vereenvoudigd */
    else { if(c.m) await p.click('.vo-mt'); await p.fill('.vo-t', c.t); await p.fill('.vo-n', c.n); }
  }
  const verwacht = rq.items[1].w[1] === 1 ? 10 : 9;
  await p.click('.vo-verbeter'); await p.waitForTimeout(200);
  check(new RegExp(`Score ${verwacht} / 10`).test(await p.locator('.vo-tel').innerText()), `breuken: ${verwacht}/10 (minteken in de teller getikt telt, niet vereenvoudigd is fout)`);

  /* alles door elkaar met lege oefeningen */
  await p.click('nav.side button:has-text("Alles door elkaar")'); await p.waitForTimeout(150);
  await p.click('.vo-start'); await p.waitForTimeout(200);
  const rm = await p.evaluate(k=>JSON.parse(localStorage.getItem(k)), P + 'reeks_mix');
  check(new Set(rm.items.map(x=>x.h)).size >= 2 && !rm.items.some(x=>x.h === 'macht'), 'alles door elkaar: uit meerdere open hoofdstukken, niet uit het verborgen hoofdstuk');
  await p.click('.vo-verbeter'); await p.waitForTimeout(150);
  check(await p.locator('.vo-bevestig').count() === 1, 'lege oefeningen: eerst een bevestiging');
  await p.click('.vo-toch'); await p.waitForTimeout(150);
  check(/Score 0 \/ 10/.test(await p.locator('.vo-tel').innerText()), 'toch verbeteren: lege oefeningen tellen als fout');
  const sc = await p.evaluate(k=>JSON.parse(localStorage.getItem(k)), P + 'scores');
  check(sc['optel|z|plus'].l === 9 && sc['maal|q|deel'].n === 1 && sc['mix|alle|alle'].l === 0, 'scores per keuze bewaard: ' + JSON.stringify(sc));
  check(!p.fouten.length, 'leerling 2A: geen JavaScript-fouten ' + p.fouten.join(' | '));
  await p.goto(H.B); await p.waitForTimeout(1200);
  const db = await H.fakedb(p), doc = db['voortgang/ll2_2a-vrij'];
  check(!!doc && /optel\|z\|plus/.test(doc.data.scores || '') && doc.toets && Object.keys(doc.toets).some(k=>/^optel_z-plus$/.test(k)), 'voortgang in Firestore: scores en de laatste reeks per keuze');

  /* gsm */
  await p.setViewportSize({ width:400, height:800 });
  await p.goto(H.B + '2A/vrij-oefenen/#optel'); await p.waitForTimeout(1500);
  const breed = await p.evaluate(()=>document.documentElement.scrollWidth);
  check(breed <= 400, 'gsm: geen horizontale scroll (' + breed + ' px)');
  await shot(p, '5_gsm');
  await p.setViewportSize({ width:1366, height:657 });

  /* 1A */
  const q = await H.pagina(ctx, await H.fakedb(p)); await q.setViewportSize({ width:1366, height:657 });
  await H.aanmelden(q, '1A/', L1); await q.waitForTimeout(1000);
  check(await q.locator('a.tegel[data-site="1a-vrij"]:visible').count() === 1, '1A: tegel Vrij oefenen staat open');
  await q.goto(H.B + '1A/vrij-oefenen/'); await q.waitForTimeout(1500);
  const nav1 = await q.locator('nav.side .lbl').allTextContents();
  check(nav1.join('|') === 'Optellen en aftrekken|Vermenigvuldigen en delen|Volgorde van bewerkingen|Alles door elkaar', '1A: hoofdstukken zonder machten: ' + nav1.join(', '));
  const m1 = await q.evaluate(()=>{ const V = window.VRIJ, J = V.J; let n = 0, fout = [];
    J.hoofdstukken.forEach(h=>{ (h.bew ? J.getallen.map(x=>x[0]) : ['alle']).forEach(g=>(h.bew ? h.bew.map(x=>x[0]).concat('alle') : ['alle']).forEach(bw=>{ for(let k = 0; k < 4; k++) V.maakReeks(J, h.id, g, bw).forEach(it=>{ n++;
      if(!V.beoordeel(it, V.canoniek(it))) fout.push(it.html); if(/class="vo-g">−/.test(it.html) || it.w[0] < 0) fout.push('negatief ' + it.html); }); })); });
    return { n, fout:fout.slice(0, 5) }; });
  check(m1.n >= 1500 && !m1.fout.length, `motor 1A: ${m1.n} oefeningen, enkel positieve getallen, juist antwoord aanvaard ${m1.fout.join(' | ')}`);
  await q.click('.vo-chip[data-g="n"]'); await q.click('.vo-chip[data-b="alle"]'); await q.click('.vo-start'); await q.waitForTimeout(200);
  await shot(q, '6_1A_reeks');
  check(await q.locator('.vo-dot').count() === 10 && !q.fouten.length, '1A: reeks natuurlijke getallen gestart, geen JavaScript-fouten ' + q.fouten.join(' | '));

  /* leerkracht: dashboard */
  const r = await H.pagina(ctx, await H.fakedb(p));
  await H.aanmelden(r, 'dashboard/', LK); await r.waitForTimeout(1500);
  await r.click('.chip-btn:has-text("2ANg1")'); await r.waitForTimeout(500);
  await r.click('.tab:has-text("Voortgang")'); await r.waitForTimeout(800);
  const ov = await r.locator('table.dt').first().innerText().catch(()=>'');
  check(/Vrij oefenen/.test(ov), 'dashboard: overzicht met de rubriek Vrij oefenen');
  await r.locator('#siteSel').selectOption('2a-vrij'); await r.waitForTimeout(800);
  const txt = await r.locator('table.dt').innerText();
  check(/9\/10/.test(txt) && /beste 9 · 1×/.test(txt) && /0\/10/.test(txt), 'dashboard: per hoofdstuk laatste score, beste score en aantal reeksen');
  await shot(r, '7_dashboard');
  await r.click('.naam-btn'); await r.waitForTimeout(300);
  check(/gehele getallen · optellen: 9\/10/.test(await r.locator('.detail').innerText()), 'dashboard: detail per leerling met de scores per keuze');
  check(!r.fouten.length, 'leerkracht: geen JavaScript-fouten ' + r.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
