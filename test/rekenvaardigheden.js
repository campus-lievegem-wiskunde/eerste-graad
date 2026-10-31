/* Rekenvaardigheden (interactieve opdracht, gedeeld/rv-kader.js): 2A · 2 Optellen en aftrekken van gehele getallen.
   Openzetten, één oefening per scherm (past zonder scrollen op 1366×657), tekenvak + boven en − onder, getallenas, legertjes,
   stappenplan, vergelijken, thermometer, foutenjager, automatisch bewaren, indienen, verbeteren met deelpunten en foutcodes,
   punten op 5, afdrukpagina. De echte sleutel staat niet in de repository: de test zet een eigen testsleutel in de databank.
   Met RV_CODE=<sleutelcode> wordt ook de echte sleutel.enc.json ontgrendeld.   node test/rekenvaardigheden.js   (eerst test/serve.sh) */
const H = require('./helpers'); const fs = require('fs'); const path = require('path');
const UIT = process.env.SCHERMEN || null, CODE = process.env.RV_CODE || null, ID = '2a-rv-2-gehele-optellen', URL = '2A/rekenvaardigheden/2-gehele-optellen/';
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  /* hier voor iedereen zichtbaar (zoals later); test/opdrachten.js test de instelling 'beheerder' */
  const bron = fs.readFileSync(path.join(__dirname, '..', 'gedeeld', 'opdrachten.js'), 'utf8');
  await ctx.route(/gedeeld\/opdrachten\.js/, r=>r.fulfill({ contentType:'text/javascript', body:bron.replace(/OPDR_ZICHTBAAR = '\w+'/, "OPDR_ZICHTBAAR = 'iedereen'") }));
  const LK = { uid:'lk', email:'jeroen@svsl.be', displayName:'Jeroen De Jaeger' }, L1 = { uid:'l1', email:'an.claes@svsl.be', displayName:'An Claes' };
  const start = { 'beheerders/jeroen@svsl.be':{ naam:'Jeroen' }, 'leerkrachten/jeroen@svsl.be':{ naam:'Jeroen De Jaeger' },
    'leerlingen/an.claes@svsl.be':{ familienaam:'Claes', voornaam:'An', klas:'2A3', jaar:'2', stroom:'A' },
    'groepen/2ANg1':{ naam:'2ANg1', jaar:'2', stroom:'A', soort:'niveau', leerkrachten:[LK.email], leerlingen:[L1.email], aan:{} } };
  const shot = async (p, n, vol)=>{ if(UIT) await p.screenshot({ path:path.join(UIT, n + '.png'), fullPage:!!vol }); };
  const als = async (p, url, u)=>{ await p.evaluate(()=>sessionStorage.removeItem('fake_user')); await H.aanmelden(p, url, u); await p.waitForTimeout(600); };
  const p = await H.pagina(ctx, start), db = ()=>H.fakedb(p);

  /* 1. leerkracht zet de opdracht open */
  await als(p, 'dashboard/', LK);
  await p.click('button.tab:has-text("Rekenvaardigheden")'); await p.waitForTimeout(300);
  const blok = p.locator('.opdr-blok', { hasText:'Optellen en aftrekken van gehele getallen' });
  check(await blok.count() === 1, 'dashboard: rekenvaardigheid staat in de lijst van 2A');
  await blok.locator('button:has-text("Nu openen")').click(); await p.waitForTimeout(400);

  /* 2. leerling: rubriektegel en invulscherm */
  await als(p, '2A/rekenvaardigheden/', L1);
  check(await p.locator(`a.tegel[data-opdr="${ID}"]`).isVisible(), 'rubriekpagina toont de tegel');
  await p.setViewportSize({ width:1366, height:657 });
  await p.goto(H.B + URL); await p.waitForTimeout(1200);
  check(await p.locator('.rv-dot').count() === 30, '30 bolletjes, één per oefening');
  const rv = p.locator('.rv'), dot = i=>p.locator(`.rv-dot[data-i="${i}"]`).click().then(()=>p.waitForTimeout(250));
  const past = async n=>{ await rv.evaluate(e=>e.scrollIntoView({ block:'start' })); const h = await rv.evaluate(e=>e.getBoundingClientRect().height); check(h <= 600, `${n}: past op het scherm boven de balk Indienen (${Math.round(h)} px)`); };
  const teken = (pad, w)=>p.locator(`.rv [data-teken="${pad}"] [data-w="${w}"]`).click().then(()=>p.waitForTimeout(80));
  const vul = (pad, w)=>p.locator(`.rv input[data-pad="${pad}"]`).fill(String(w));
  /* term i van stap 1: een dubbel teken werk je weg in de opgave (beide tekens aanklikken), anders kies je het teken */
  const term = async (i, sg, n)=>{ const d = p.locator(`.rv [data-dubbel="s1.${i}"]`);
    if(await d.count()){ await d.locator('[data-k="0"]').click(); await d.locator('[data-k="1"]').click(); await p.waitForTimeout(80);
      check((await p.locator(`.rv [data-pad="s1.${i}.n"]`).locator('xpath=preceding-sibling::span[1]').textContent()).trim() === sg, `dubbel teken van term ${i + 1} wordt ${sg}`); }
    else if(await p.locator(`.rv input[data-pad="s1.${i}.sign"]`).count()) await vul(`s1.${i}.sign`, sg);
    else await teken(`s1.${i}.sign`, sg);
    await vul(`s1.${i}.n`, n); };

  /* getallenas: −12 − 19 */
  const svgKlik = async n=>{ await rv.evaluate(e=>e.scrollIntoView({ block:'start' })); const pt = await p.evaluate(n=>{ const svg = document.querySelector('.rv .nl-svg'), m = svg.getScreenCTM(); return { x:m.a * (38 + (n + 40) * 924 / 50) + m.e, y:m.d * 150 + m.f }; }, n); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(150); };
  await svgKlik(-12); await svgKlik(-31);
  await teken('resSign', '−'); await vul('res', 31);
  check(await p.locator('.rv [data-teken="resSign"] [data-w="−"][aria-pressed="true"]').count() === 1, 'tekenvak: − aangeduid');
  await past('getallenas'); await shot(p, '1_leerling_getallenas');

  /* legertjes: −7 + 11 */
  await dot(5);
  const erbij = (idx, d, n)=>(async()=>{ for(let k = 0; k < n; k++) await p.locator(`.rv [data-leger="${idx}"][data-d="${d}"]`).click(); })();
  await erbij(0, 5, 1); await erbij(0, 1, 2); await erbij(1, 5, 2); await erbij(1, 1, 1);
  await p.locator('.rv .aanval').click(); await p.waitForTimeout(2600);
  check(/over/.test(await p.locator('.rv .kamp').first().textContent()), 'legertjes: gevecht uitgevoerd');
  await teken('resSign', '+'); await vul('res', 4);
  await past('legertjes'); await shot(p, '2_leerling_legertjes');
  /* 19 − (−8): eerst het dubbele teken wegwerken, dan pas de legers opstellen */
  await dot(11);
  check(await p.locator('.rv [data-leger="0"][data-d="1"]').isDisabled(), 'legertjes met dubbel teken: legers wachten op het wegwerken');
  await p.locator('.rv [data-dubbel="dub"] [data-k="1"]').click(); await p.locator('.rv [data-dubbel="dub"] [data-k="0"]').click(); await p.waitForTimeout(100);
  check(/19 \+ 8/.test(await p.locator('.rv .rv-ant').textContent()) && !(await p.locator('.rv [data-leger="0"][data-d="1"]').isDisabled()), 'legertjes: − (−8) wordt + 8, legers vrij');
  await past('legertjes met dubbel teken'); await p.locator('.rv-wis').click(); await p.waitForTimeout(100);
  /* 9 − 15 met een fout teken */
  await dot(6); await teken('resSign', '+'); await vul('res', 6);

  /* stappenplan: −9 + (−6) en 7 − (−5) met een fout dubbel teken */
  await dot(13);
  check(await p.locator('.rv [data-pad="s1.1.n"]').locator('xpath=preceding-sibling::span[1]').getAttribute('class') === 'rv-teken-wacht', 'stappenplan: tekenvak wacht tot het dubbele teken weggewerkt is');
  await term(0, '−', 9); await term(1, '−', 6); await teken('resSign', '−'); await vul('res', 15);
  await past('stappenplan'); await shot(p, '3_leerling_stappenplan');
  /* 7 − (−5): dubbel teken weggewerkt, maar 3 overgeschreven in plaats van 5, daarna juist verder gerekend (doorwerkfout) */
  await dot(16); await term(0, '+', 7);
  check(await p.locator('.rv [data-teken="s1.0.sign"].plus-weg').count() === 1, 'een + vooraan verdwijnt na het aanklikken');
  await term(1, '+', 3); await teken('resSign', '+'); await vul('res', 10);
  check(/7 − \(−5\)/.test(await p.locator('.rv .orig').textContent()) && await p.locator('.rv .rv-dubbel.weg').count() === 1, 'opgave toont het weggewerkte dubbele teken');

  /* opbouw: oefening 15 (half) typt de tekens, oefening 16 (zelf) werkt ook het dubbele teken zelf weg */
  await dot(14); check(await p.locator('.rv input.rv-tekenvakje').count() === 3 && !(await p.locator('.rv .rv-teken').count()), 'stappenplan half: getypte tekenvakjes, ook voor de uitkomst');
  await dot(15); check(!(await p.locator('.rv .rv-dubbel').count()) && await p.locator('.rv input.rv-tekenvakje').count() === 3 && /\(−35\)/.test(await p.locator('.rv .orig').textContent()), 'stappenplan zelf: geen dubbel teken aanklikken, alles typen');
  await term(0, '', 27); await term(1, '-', 35); await vul('resSign', '−'); await vul('res', 8);
  await past('stappenplan zelf'); await p.locator('.rv-wis').click(); await p.waitForTimeout(100); /* weer leeg: de totalen verderop blijven gelijk */
  const r16 = await p.evaluate(()=>{ const O = window.OPGAVE, q = O.delen.flatMap(d=>d.vragen).find(x=>x.id === 'ex16');
    return [O.verbeter(q, { s1:[{ sign:'', n:'27' }, { sign:'-', n:'35' }], resSign:'−', res:'8' }), O.verbeter(q, { s1:[{ sign:'', n:'27' }, { sign:'+', n:'35' }], resSign:'', res:'62' }), O.volledig(q, { s1:[{ sign:'', n:'27' }, { sign:'−', n:'35' }], resSign:'−', res:'8' })]; });
  check(r16[0].pts === 1 && r16[1].codes.includes('DUBBEL_TEKEN') && r16[2], 'stappenplan zelf: + vooraan mag wegblijven, - telt als min, fout dubbel teken herkend ' + JSON.stringify(r16));

  /* vergelijken */
  await dot(19); for(const [i, s] of [[0, '>'], [1, '='], [2, '<']]) await p.locator(`.rv [data-vgl="${i}"][data-s="${s}"]`).click();
  await past('vergelijken');
  /* gedurige som met 6 termen */
  await dot(23); for(const [i, s, n] of [[0, '+', 15], [1, '+', 9], [2, '−', 21], [3, '−', 14], [4, '−', 3], [5, '+', 6]]) await term(i, s, n);
  await vul('plus', 30); await vul('min', 38); await vul('resSign', '−'); await vul('res', 8);
  await past('gedurige som'); await shot(p, '4_leerling_gedurige_som');

  /* thermometer: −6 °C, 11 graden gestegen */
  await dot(24); await rv.evaluate(e=>e.scrollIntoView({ block:'start' }));
  const tp = await p.evaluate(()=>{ const m = document.querySelector('.rv .th-svg').getScreenCTM(); return { x:m.a * 330 + m.e, y:m.d * (318 - 15 * 270 / 25) + m.f }; });
  await p.mouse.click(tp.x, tp.y); await p.waitForTimeout(250);
  await vul('bew', '-6 + 11'); await teken('resSign', '+'); await vul('res', 5);
  check(/\+11/.test(await p.locator('.rv .th-paneel').textContent()), 'thermometer: sprong +11');
  await past('thermometer'); await shot(p, '5_leerling_thermometer');
  await dot(25); await past('lift'); await dot(26); await past('rekening');

  /* foutenjager */
  await dot(27); await p.locator('.rv [data-keuze="b"]').click(); await teken('resSign', '−'); await vul('res', 17);
  await past('foutenjager'); await shot(p, '6_leerling_foutenjager');
  await p.waitForTimeout(1800);
  let inz = (await db())[`inzendingen/${ID}__an.claes@svsl.be`];
  const w = id=>JSON.parse(inz.antw[id]);
  check(inz && w('ex01').start === -12 && w('ex01').end === -31 && w('ex01').resSign === '−' && w('ex06').a === 7 && w('ex06').b === 11 && w('ex06').fought, 'antwoorden automatisch bewaard als JSON: ' + (inz && inz.antw.ex01));
  check(/8 \/ 30 ingevuld/.test(await p.locator('.rv-tel').textContent()), 'teller: ' + await p.locator('.rv-tel').textContent());
  /* opnieuw beginnen wist enkel deze oefening */
  await dot(6); await p.locator('.rv-wis').click(); await p.waitForTimeout(1500);
  inz = (await db())[`inzendingen/${ID}__an.claes@svsl.be`];
  check(inz.antw.ex07 === '' && !!inz.antw.ex06, 'opnieuw beginnen wist oefening 7');
  await dot(6); await teken('resSign', '+'); await vul('res', 6); await p.waitForTimeout(1500);
  await p.setViewportSize({ width:1280, height:1000 });
  await p.click('.opdr-balk button:has-text("Indienen")'); await p.waitForTimeout(1500);
  inz = (await db())[`inzendingen/${ID}__an.claes@svsl.be`];
  check(inz.ingediend && !inz.slot, 'ingediend, opnieuw mag (rekenvaardigheid)');

  /* 3. leerkracht: sleutel, verbeteren met deelpunten en foutcodes, op 5 */
  await als(p, 'dashboard/', LK);
  if(CODE){
    await p.click('button.tab:has-text("Rekenvaardigheden")'); await p.waitForTimeout(300);
    await p.locator('.opdr-blok', { hasText:'Optellen en aftrekken van gehele getallen' }).locator('button:has-text("Resultaten")').click(); await p.waitForTimeout(900);
    await p.fill('.sl-code', CODE); await p.click('button:has-text("Ontgrendel")'); await p.waitForTimeout(2500);
    check(!!(await db())[`sleutels/${ID}`], 'echte sleutel ontgrendeld met de sleutelcode');
  } else {
    /* testsleutel (niet de echte): keuze A bij elke foutenjager, bewerkingen zoals het vraagstuk */
    const v = {}; ['ex28', 'ex29', 'ex30'].forEach(id=>{ v[id] = { choice:'b', toon:'keuze B' }; });
    Object.assign(v, { ex25:{ expr:'-6 + 11', numbers:[6, 11] }, ex26:{ expr:'-3 + 11 - 5', numbers:[3, 11, 5] }, ex27:{ expr:'45 - 59 + 20', numbers:[45, 59, 20] } });
    for(let i = 1; i <= 30; i++){ const id = 'ex' + String(i).padStart(2, '0'); v[id] = Object.assign({ toon:'(test)' }, v[id]); }
    await p.evaluate(s=>{ const d = JSON.parse(localStorage.getItem('__fakedb')); d['sleutels/' + s.opdr] = s; localStorage.setItem('__fakedb', JSON.stringify(d)); }, { opdr:ID, vragen:v });
    await p.reload(); await p.waitForTimeout(900);
    await p.click('button.tab:has-text("Rekenvaardigheden")'); await p.waitForTimeout(300);
    await p.locator('.opdr-blok', { hasText:'Optellen en aftrekken van gehele getallen' }).locator('button:has-text("Resultaten")').click(); await p.waitForTimeout(900);
  }
  const rij = p.locator('table.opdr-tabel tbody tr', { hasText:'Claes' }), cel = i=>rij.locator('td').nth(1 + i);
  const tekst = async i=>(await cel(i).textContent()).trim();
  check(await tekst(1) === '1' && await tekst(6) === '1' && await tekst(14) === '1' && await tekst(20) === '1' && await tekst(24) === '2' && await tekst(25) === '1,5', 'volle punten: getallenas, legertjes, stappenplan, vergelijken, gedurige som, thermometer');
  check(await tekst(7) === '0', 'legertjes 9 − 15: niet opgesteld en fout teken: 0 (' + await tekst(7) + ')');
  check(await tekst(17) === '0,25', 'stappenplan 7 − (−5): één term juist in stap 1 = 0,25 (' + await tekst(17) + ')');
  check(await tekst(28) === '1', 'foutenjager juist: 1 (' + await tekst(28) + ')');
  check(/TOESTANDSTEKEN|Fout toestandsteken/.test(await cel(7).getAttribute('title') || ''), 'foutcode in de tabel: ' + await cel(7).getAttribute('title'));
  const tot = (await rij.locator('td').nth(32).textContent()).trim(), op5 = (await rij.locator('td').nth(33).textContent()).trim();
  check(/^8,75\/34,5/.test(tot) && /^1,3\/5$/.test(op5), `totaal 8,75/34,5 en op 5: ${tot} · ${op5}`);
  check(/Doorwerkfout/.test(await p.locator('.opdr-fouten').textContent()) && /Fout toestandsteken/.test(await p.locator('.opdr-fouten').textContent()), 'overzicht typische fouten in de groep');
  await shot(p, '7_dashboard_resultaten', true);
  await rij.locator('.naam-btn').click(); await p.waitForTimeout(500);
  check(await p.locator('.detail .ov').count() === 30 && await p.locator('.detail .nl-svg').count() === 1 && await p.locator('.detail .tl-niet').count() === 21, 'detail: 30 oefeningen, figuur bij de getallenas, niet ingevulde kort');
  check(/Doorwerkfout/.test(await p.locator('.detail .ov[data-id="ex17"] .ov-verb').textContent()), 'detail: foutcode bij oefening 17');
  await p.locator('.detail .ov[data-id="ex07"] .ov-punten input').fill('0.25'); await p.locator('.detail .ov[data-id="ex07"] .ov-punten input').dispatchEvent('change'); await p.waitForTimeout(200);
  check(/^9\/34,5/.test((await rij.locator('td').nth(32).textContent()).trim()), 'met de hand 0,25 erbij: 9/34,5');
  await p.locator('.detail').screenshot({ path:UIT ? path.join(UIT, '8_dashboard_detail.png') : '/dev/null' }).catch(()=>{});
  await p.click('button:has-text("Punten bewaren")'); await p.waitForTimeout(700);
  const r = (await db())[`resultaten/${ID}__an.claes@svsl.be`];
  check(r && r.totaal === 9 && r.max === 34.5 && r.op === 5 && r.opPunten === 1.3, 'resultaat bewaard met punten op 5: ' + JSON.stringify(r && { t:r.totaal, m:r.max, op:r.opPunten }));

  /* 4. afdrukpagina */
  await p.goto(H.B + `dashboard/afdruk.html?opdr=${ID}&groep=2ANg1`); await p.waitForTimeout(1200);
  check(await p.locator('.blad').count() === 1 && /1,3/.test(await p.locator('.hf-res').textContent()) && await p.locator('.blad .nl-svg').count() === 1, 'afdruk: hoofding met punten op 5 en figuren');
  await shot(p, '9_afdruk', true);
  if(UIT) await p.pdf({ path:path.join(UIT, 'voorbeeld_rekenvaardigheid.pdf'), format:'A4' });
  await p.goto(H.B + `dashboard/afdruk.html?opdr=${ID}&soort=sleutel`); await p.waitForTimeout(1000);
  check(await p.locator('.blad .ov').count() === 30, 'afdruk: verbetersleutel');

  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
