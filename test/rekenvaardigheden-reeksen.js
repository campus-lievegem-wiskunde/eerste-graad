/* Rekenvaardigheden 2A (interactief, gedeeld/rv-kader.js): de reeksen naast het proefstuk (test/rekenvaardigheden.js).
   Per reeks: openzetten, elk scherm past zonder scrollen (1366×657, leeg en volledig ingevuld), enkele interacties,
   een volledig juist ingevulde reeks (OPGAVE.voorbeeld) haalt alle punten en 5/5, detail en afdruk tonen alle oefeningen.
   De echte sleutels staan niet in de repository: de test gebruikt per reeks een eigen, verzonnen testsleutel.
   node test/rekenvaardigheden-reeksen.js [id]   (eerst test/serve.sh) */
const H = require('./helpers'); const fs = require('fs'); const path = require('path');

/* klik op het coördinatenrooster (viewBox 560, -8..8, marge 30) */
const roosterKlik = async (p, x, y)=>{ const pt = await p.evaluate(([x, y])=>{ const s = document.querySelector('.rv .co-svg'), m = s.getScreenCTM(), U = 500 / 16;
  return { x:m.a * (30 + (x + 8) * U) + m.e, y:m.d * (530 - (y + 8) * U) + m.f }; }, [x, y]); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(120); };

const REEKSEN = [
  { id:'2a-rv-1-coordinaten', url:'2A/rekenvaardigheden/1-coordinaten/', blok:'Coördinaten op het rooster', n:30, max:'35,5',
    /* verzonnen testsleutel, niet de echte */
    sleutel:{ ex21:{ answer:[1, 1] }, ex22:{ answer:[1, 1] }, ex23:{ answer:[1, 1] }, ex24:{ answer:[1, 1] }, ex25:{ answer:[1, 1] }, ex26:{ answer:[1, 1] },
      ex27:{ answers:[[1, 1], [2, 2], [3, 3], [4, 4]] }, ex28:{ shape:'vijfhoek' }, ex29:{ shape:'vijfhoek' }, ex30:{ shape:'vijfhoek' } },
    async interactie(p, t){
      /* aflezen: (0, 6) met het tekenvak; een + vooraan verdwijnt */
      await t.vul('v.x', 0); await t.teken('v.ys', '+'); await t.vul('v.y', 6);
      t.check(await p.locator('.rv [data-teken="v.ys"].plus-weg').count() === 1, 'coördinaten: gekozen + verdwijnt');
      /* plaatsen: A(3, −2) aanklikken, nog eens klikken verplaatst */
      await t.dot(6); await roosterKlik(p, 1, 1); await roosterKlik(p, 3, -2);
      /* ontbrekend punt D verschijnt meteen op het rooster */
      await t.dot(20); await t.teken('v.xs', '−'); await t.vul('v.x', 2); await t.teken('v.ys', '+'); await t.vul('v.y', 3);
      t.check(await p.locator('.rv .co-svg .co-punt').count() === 4 && await p.locator('.rv .co-svg .co-veelhoek').count() === 1, 'figuur vervolledigen: D verschijnt en de figuur sluit');
      /* plaatsen en herkennen: vier punten, één weg, opnieuw, figuur kiezen */
      await t.dot(27); for(const [x, y] of [[-4, -1], [0, 2], [0, -3], [5, 5]]) await roosterKlik(p, x, y);
      await p.locator('.rv .co-terug').click(); await roosterKlik(p, -4, -6); await p.locator('.rv [data-figuur="ruit"]').click(); await p.waitForTimeout(150);
      t.check(await p.locator('.rv .co-svg .co-veelhoek').count() === 1 && await p.locator('.rv [data-figuur="ruit"].aan').count() === 1, 'plaatsen en herkennen: veelhoek en gekozen figuur');
      await p.waitForTimeout(1600);
      const w = await t.antw();
      t.check(w.ex01 && w.ex01.v.x === '0' && w.ex07 && w.ex07.A[0] === 3 && w.ex07.A[1] === -2 && w.ex28 && w.ex28.pts.D[1] === -6 && w.ex28.shape === 'ruit', 'coördinaten: antwoorden bewaard ' + JSON.stringify(w.ex07));
      /* verbeteren zoals code.gs: x en y omgewisseld, teken van y fout */
      const r = await p.evaluate(()=>{ const O = window.OPGAVE, q = id=>O.delen.flatMap(d=>d.vragen).find(x=>x.id === id);
        return [O.verbeter(q('ex04'), { v:{ xs:'+', x:'3', ys:'−', y:'4' } }), O.verbeter(q('ex04'), { v:{ xs:'−', x:'4', ys:'−', y:'3' } }), O.verbeter(q('ex21'), { v:{ xs:'−', x:'8', ys:'−', y:'7' } }, { answer:[-2, 3] })]; });
      t.check(r[0].codes[0] === 'XY_OMGEWISSELD' && r[0].pts === 0 && r[1].codes[0] === 'TEKEN_Y' && r[1].pts === .5 && r[2].codes[0] === 'VOLGORDE_HOEKPUNTEN' && r[2].pts === .5, 'coördinaten: foutcodes ' + JSON.stringify(r));
    } }
];

(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const bron = fs.readFileSync(path.join(__dirname, '..', 'gedeeld', 'opdrachten.js'), 'utf8');
  await ctx.route(/gedeeld\/opdrachten\.js/, r=>r.fulfill({ contentType:'text/javascript', body:bron.replace(/OPDR_ZICHTBAAR = '\w+'/, "OPDR_ZICHTBAAR = 'iedereen'") }));
  const LK = { uid:'lk', email:'jeroen@svsl.be', displayName:'Jeroen De Jaeger' }, L1 = { uid:'l1', email:'an.claes@svsl.be', displayName:'An Claes' };
  const start = { 'beheerders/jeroen@svsl.be':{ naam:'Jeroen' }, 'leerkrachten/jeroen@svsl.be':{ naam:'Jeroen De Jaeger' },
    'leerlingen/an.claes@svsl.be':{ familienaam:'Claes', voornaam:'An', klas:'2A3', jaar:'2', stroom:'A' },
    'groepen/2ANg1':{ naam:'2ANg1', jaar:'2', stroom:'A', soort:'niveau', leerkrachten:[LK.email], leerlingen:[L1.email], aan:{} } };
  const als = async (p, url, u)=>{ await p.evaluate(()=>sessionStorage.removeItem('fake_user')); await H.aanmelden(p, url, u); await p.waitForTimeout(600); };
  const p = await H.pagina(ctx, start), db = ()=>H.fakedb(p);
  const zet = (sleutel, w)=>p.evaluate(([s, w])=>{ const d = JSON.parse(localStorage.getItem('__fakedb')); d[s] = w; localStorage.setItem('__fakedb', JSON.stringify(d)); }, [sleutel, w]);
  const alleen = process.argv[2];

  for(const R of REEKSEN.filter(r=>!alleen || r.id === alleen)){
    console.log('== ' + R.id);
    await p.setViewportSize({ width:1280, height:1000 });
    await als(p, 'dashboard/', LK);
    await p.click('button.tab:has-text("Toetsen en taken")'); await p.waitForTimeout(300);
    const blok = p.locator('.opdr-blok', { hasText:R.blok });
    check(await blok.count() === 1, 'dashboard: de reeks staat in de lijst');
    await blok.locator('button:has-text("Nu openen")').click(); await p.waitForTimeout(400);

    await als(p, '2A/rekenvaardigheden/', L1);
    check(await p.locator(`a.tegel[data-opdr="${R.id}"]`).isVisible(), 'rubriekpagina toont de tegel');
    await p.setViewportSize({ width:1366, height:657 });
    await p.goto(H.B + R.url); await p.waitForTimeout(1200);
    check(await p.locator('.rv-dot').count() === R.n, `${R.n} bolletjes, één per oefening`);
    const rv = p.locator('.rv'), dot = i=>p.locator(`.rv-dot[data-i="${i}"]`).click().then(()=>p.waitForTimeout(150));
    const hoogtes = async wat=>{ let hoogst = 0, waar = 0;
      for(let i = 0; i < R.n; i++){ await dot(i); await rv.evaluate(e=>e.scrollIntoView({ block:'start' })); const h = await rv.evaluate(e=>e.getBoundingClientRect().height); if(h > hoogst){ hoogst = h; waar = i + 1; } }
      check(hoogst <= 600, `${wat}: elke oefening past op het scherm boven de balk Indienen (hoogste: oefening ${waar}, ${Math.round(hoogst)} px)`); };
    await hoogtes('leeg');
    const t = { check, dot,
      teken:(pad, w)=>p.locator(`.rv [data-teken="${pad}"] [data-w="${w}"]`).click().then(()=>p.waitForTimeout(80)),
      vul:(pad, w)=>p.locator(`.rv input[data-pad="${pad}"]`).fill(String(w)),
      antw:async()=>{ const d = (await db())[`inzendingen/${R.id}__${L1.email}`]; const o = {}; Object.entries((d && d.antw) || {}).forEach(([k, v])=>{ try{ o[k] = v ? JSON.parse(v) : null; }catch(e){} }); return o; } };
    await dot(0); await R.interactie(p, t);

    /* volledig juist ingevuld (met de testsleutel) */
    const sl = {}; const ids = await p.evaluate(()=>window.OPGAVE.delen.flatMap(d=>d.vragen).map(q=>q.id));
    ids.forEach(id=>{ sl[id] = Object.assign({ toon:'(test)' }, R.sleutel[id]); });
    const antw = await p.evaluate(sl=>{ const O = window.OPGAVE; return Object.fromEntries(O.delen.flatMap(d=>d.vragen).map(q=>[q.id, JSON.stringify(O.voorbeeld(q, sl[q.id]))])); }, sl);
    await zet(`inzendingen/${R.id}__${L1.email}`, { opdr:R.id, email:L1.email, naam:L1.displayName, groep:'2ANg1', antw, bewaard:Date.now() });
    await p.reload(); await p.waitForTimeout(1200);
    check(new RegExp(`${R.n} / ${R.n} ingevuld`).test(await p.locator('.rv-tel').textContent()), 'volledig ingevuld: ' + await p.locator('.rv-tel').textContent());
    await hoogtes('ingevuld');
    await p.setViewportSize({ width:1280, height:1000 });
    await p.click('.opdr-balk button:has-text("Indienen")'); await p.waitForTimeout(1500);
    check(!!(await db())[`inzendingen/${R.id}__${L1.email}`].ingediend, 'ingediend');

    await zet(`sleutels/${R.id}`, { opdr:R.id, vragen:sl });
    await als(p, 'dashboard/', LK);
    await p.click('button.tab:has-text("Toetsen en taken")'); await p.waitForTimeout(300);
    await p.locator('.opdr-blok', { hasText:R.blok }).locator('button:has-text("Resultaten")').click(); await p.waitForTimeout(900);
    const rij = p.locator('table.opdr-tabel tbody tr', { hasText:'Claes' }), cellen = rij.locator('td'), nc = await cellen.count();
    const tot = (await cellen.nth(nc - 2).textContent()).trim(), op5 = (await cellen.nth(nc - 1).textContent()).trim();
    check(tot.startsWith(`${R.max}/${R.max}`) && op5 === '5/5', `alles juist: ${tot} · op 5: ${op5}`);
    await rij.locator('.naam-btn').click(); await p.waitForTimeout(500);
    check(await p.locator('.detail .ov').count() === R.n, 'detail: alle oefeningen met figuur of antwoord');
    await p.goto(H.B + `dashboard/afdruk.html?opdr=${R.id}&groep=2ANg1`); await p.waitForTimeout(1200);
    check(await p.locator('.blad').count() === 1 && /5/.test(await p.locator('.hf-res').textContent()), 'afdruk: blad met punten op 5');
    await p.goto(H.B + `dashboard/afdruk.html?opdr=${R.id}&soort=sleutel`); await p.waitForTimeout(1000);
    check(await p.locator('.blad .ov').count() === R.n, 'afdruk: verbetersleutel');
  }
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
