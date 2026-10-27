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
    } },
  { id:'2a-rv-3-gehele-vermenigvuldigen', url:'2A/rekenvaardigheden/3-gehele-vermenigvuldigen/', blok:'Vermenigvuldigen en delen van gehele getallen', n:30, max:'39',
    sleutel:{ ex14:{ key:{ m0:1, m1:1, t:1 } }, ex15:{ key:{ b1:1, m0:1, t:1 } }, ex18:{ key:['factor', 'factor', 'factor', 'factor', 'factor', 'factor'] }, ex19:{ key:[1, 1], wrongOp:[9, 9] },
      ex20:{ expr:'1 + 1', numbers:[1, 1] }, ex21:{ expr:'1 + 1', numbers:[1, 1] }, ex22:{ expr:'1 + 1', numbers:[1, 1] } },
    async interactie(p, t){
      const sg = (key, n)=>p.locator(`.rv [data-sg="${key}"]`).nth(n).click().then(()=>p.waitForTimeout(60));
      /* patroonontdekker (oefenvraag): directe feedback */
      await t.teken('cells.0.s', '−'); await t.vul('cells.0.n', 2); await t.teken('cells.2.s', '−'); await t.vul('cells.2.n', 2); await p.waitForTimeout(900);
      t.check(await p.locator('.rv .h3-merk.ok').count() === 1 && await p.locator('.rv .h3-merk.fout').count() === 1 && /Bijna/.test(await p.locator('.rv .h3-fb').textContent()), 'patroonontdekker: directe feedback');
      /* sprongen: twee sprongen van −3 vanuit 0, één weg */
      await t.dot(2); const nl = async n=>{ const pt = await p.evaluate(n=>{ const s = document.querySelector('.rv .nl-svg'), m = s.getScreenCTM(); return { x:m.a * (38 + (n + 15) * 924 / 20) + m.e, y:m.d * 150 + m.f }; }, n); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(120); };
      await nl(-3); await nl(-6); await nl(-9); await p.locator('.rv .h3-terug').click(); await p.waitForTimeout(100);
      t.check(/2/.test(await p.locator('.rv .th-paneel .val').textContent()), 'sprongen: aantal sprongen na één weg');
      /* minnetjes tellen: twee minnetjes verdwijnen samen */
      await t.dot(4); await sg('main', 0); await sg('main', 1); await p.waitForTimeout(500);
      t.check(await p.locator('.rv .h3-paar:not(.solo)').count() === 1 && await p.locator('.rv [data-sg="main"]').count() === 0, 'minnetjes tellen: paar gevormd, minnetjes weg');
      await p.locator('.rv [data-tsign="+"]').click(); await t.teken('res.s', '+'); await t.vul('res.n', 42);
      /* tweelingsommen: de twee minnen in −8 − 4 mogen niet samen (rood kruisje), − en − in −8 : (−4) wel */
      await t.dot(22); await sg('0L', 0); await sg('0L', 1); await p.waitForTimeout(300);
      t.check(await p.locator('.rv .rv-kruis').count() === 2 && /Stop/.test(await p.locator('.rv .h3-twfb.toon').textContent()), 'tweelingsommen: rood kruisje en melding');
      await p.waitForTimeout(800); await sg('0R', 0); await sg('0R', 1); await p.waitForTimeout(500);
      t.check(await p.locator('.rv [data-sg="0R"]').count() === 0, 'tweelingsommen: minnetjes bij maal en deel verdwenen');
      /* tekenparen: − (−5) wordt + 5 */
      await t.dot(25); await sg('2', 0); await sg('2', 1); await p.waitForTimeout(500);
      t.check(/7 \+ 5/.test((await p.locator('.rv .h3-prij').nth(2).textContent()).replace(/\s+/g, ' ')), 'tekenparen: − (−5) wordt + 5: ' + (await p.locator('.rv .h3-prij').nth(2).textContent()).replace(/\s+/g, ' '));
      /* wiskundetaal en piramide */
      await t.dot(17); await p.locator('.rv [data-woord="deeltal"]').click(); await p.locator('.rv [data-slot="0"]').click(); await p.waitForTimeout(100);
      t.check((await p.locator('.rv [data-slot="0"]').textContent()) === 'deeltal', 'wiskundetaal: woord geplaatst');
      await t.dot(13); await t.teken('cells.m0.s', '−'); await t.vul('cells.m0.n', 6);
      await p.waitForTimeout(1600);
      const w = await t.antw();
      t.check(w.ex05.p.length === 1 && w.ex05.sign === '+' && w.ex23.pairs[0].L.x === 1 && w.ex23.pairs[0].R.p.length === 1 && w.ex18.slots[0] === 'deeltal' && w.ex14.cells.m0.n === '6' && w.ex03.jumps.length === 2, 'vermenigvuldigen: antwoorden bewaard');
      const r = await p.evaluate(()=>{ const O = window.OPGAVE, q = id=>O.delen.flatMap(d=>d.vragen).find(x=>x.id === id);
        return [O.verbeter(q('ex07'), { p:[], x:0, sign:'−', res:{ s:'+', n:'32' } }), O.verbeter(q('ex23'), { pairs:[{ L:{ p:[], x:2 }, R:{ p:[], x:0 }, a:{ s:'+', n:'12' }, b:S0() }, { L:{ p:[], x:0 }, R:{ p:[], x:0 }, a:S0(), b:S0() }, { L:{ p:[], x:0 }, R:{ p:[], x:0 }, a:S0(), b:S0() }] })];
        function S0(){ return { s:null, n:'' }; } });
      t.check(r[0].pts === .25 && r[0].codes.includes('OPTELREGEL_BIJ_MAAL') && r[1].kruis === 2 && r[1].codes.includes('KRUISJE_PLUSMIN') && r[1].codes.includes('MAALREGEL_BIJ_PLUSMIN'), 'vermenigvuldigen: foutcodes en kruisjes ' + JSON.stringify(r));
    } },
  { id:'2a-rv-4-rationale-optellen', url:'2A/rekenvaardigheden/4-rationale-optellen/', blok:'Optellen en aftrekken van rationale getallen', n:30, max:'55',
    sleutel:{ ex23:{ terms:[[1, 2], [1, 4]] }, ex24:{ terms:[[1, 2], [1, 4]] }, ex25:{ terms:[[1, 2], [1, 4]] }, ex26:{ terms:[[1, 2], [1, 4]] }, ex27:{ terms:[[1, 2], [1, 4]] },
      ex28:{ good:'a' }, ex29:{ good:'a' }, ex30:{ good:'a' } },
    async interactie(p, t){
      const klik = (s, n = 0)=>p.locator('.rv ' + s).nth(n).click().then(()=>p.waitForTimeout(90));
      const sg = (key, n)=>p.locator(`.rv [data-sg="${key}"]`).nth(n).click().then(()=>p.waitForTimeout(60));
      const tekst = s=>p.locator('.rv ' + s).first().textContent().then(x=>x.replace(/\s+/g, ''));
      /* met de schaar open blijft alles op het scherm */
      const schaarPast = async wat=>{ const r = await p.locator('.rv').evaluate(e=>{ e.scrollIntoView({ block:'start' }); const s = document.querySelector('.rv .br-schaar'); return { h:Math.round(e.getBoundingClientRect().height), s:s ? Math.round(s.getBoundingClientRect().bottom) : 999 }; });
        if(process.env.SCHERMEN) await p.locator('.rv').screenshot({ path:`${process.env.SCHERMEN}/schaar_${wat}.png` });
        t.check(r.h <= 600 && r.s <= 640, `${wat}: schaar open, alles op het scherm (${r.h} px, schaar tot ${r.s} px)`); };
      /* legers: verdelen tot de stukjes passen, samenkomen, gelijknamig, uitkomst, kan niet eenvoudiger */
      for(let i = 0; i < 11; i++) await klik('[data-n="1"]');
      t.check(await p.locator('.rv .h4-tag.ok').count() === 2, 'legers: stukjes passen bij 12');
      await klik('.h4-go'); await p.waitForTimeout(1300);
      t.check(await p.locator('.rv .h4-blok[data-r="r"]').count() === 7, 'legers: 7 blokjes samen');
      await t.vul('a', 4); await t.vul('b', 3); await t.teken('res.s1', '+'); await t.vul('res.t', 7); await klik('[data-schniet="sch"]');
      t.check(/=712$/.test(await tekst('.br-res')) && await p.locator('.rv [data-teken="res.s1"].plus-weg').count() === 1, 'legers: uitkomst 7/12, een + vooraan verdwijnt');
      /* legers die vechten en de vereenvoudigschaar: −1/2 + 7/10 */
      await t.dot(4); for(let i = 0; i < 9; i++) await klik('[data-n="1"]');
      await klik('.h4-go'); await p.waitForTimeout(2700);
      t.check(await p.locator('.rv .h4-blok[data-r="r"]').count() === 2, 'legers: vechten, 2 blokjes over');
      await t.teken('res.s1', '+'); await t.vul('res.t', 2); await klik('[data-schniet="sch"]'); await p.waitForTimeout(150);
      t.check(await p.locator('.rv [data-schniet="sch"] .rv-kruis').count() === 1, 'schaar: "kan niet eenvoudiger" terwijl het wel kon → rood kruisje');
      await p.waitForTimeout(1200); await klik('[data-schopen="sch"]'); await schaarPast('legers');
      await p.locator('.rv [data-schgetal="sch"]').fill('3'); await klik('[data-schknip="sch"]'); await p.waitForTimeout(1000);
      await p.locator('.rv [data-schgetal="sch"]').fill('2'); await klik('[data-schknip="sch"]'); await klik('[data-schklaar="sch"]');
      t.check(/=15$/.test(await tekst('.br-res')), 'schaar: 2/10 geknipt door 2 is 1/5');
      /* noemerzoeker */
      await t.dot(5); await klik('[data-pick="24"]'); await t.teken('terms.0.sign', '−'); await t.vul('terms.0.t', 20); await t.teken('terms.1.sign', '+'); await t.vul('terms.1.t', 9);
      t.check(/2024.*924/.test(await tekst('[data-afgeleid]')), 'noemerzoeker: gelijknamige termen verschijnen in stap 3');
      /* stappenplan: de min in de teller van −3/7 en het bewerkingsteken mogen niet samen, − (−1/2) wel */
      await t.dot(12); await sg('main', 0); await sg('main', 1); await p.waitForTimeout(300);
      t.check(await p.locator('.rv .rv-kruis').count() === 2, 'stappenplan: verkeerd tekenpaar → rode kruisjes');
      await p.waitForTimeout(900); await sg('main', 1); await sg('main', 2); await p.waitForTimeout(500);
      t.check(/\+12/.test(await tekst('.srij .orig')), 'stappenplan: − (−1/2) wordt + 1/2: ' + await tekst('.srij .orig'));
      await p.locator('.rv input[data-pad="kgv"]').fill('7'); await p.locator('.rv input[data-pad="kgv"]').press('Enter'); await p.waitForTimeout(200);
      t.check(await p.locator('.rv .h4-kx').count() === 1, 'stappenplan: fout kgv → rood kruisje');
      await p.locator('.rv input[data-pad="kgv"]').fill('14'); await p.waitForTimeout(300);
      t.check(await p.locator('.rv .br-veld').count() === 1, 'stappenplan: juist kgv → stap 3 verschijnt');
      /* kommagetal omzetten naar een breuk */
      await t.dot(16); await klik('[data-pos="conv.0"][data-k="h"]'); await t.vul('conv.0.t', 75);
      await klik('[data-schopen="conv.0.sch"]'); await schaarPast('omzetten'); await p.locator('.rv [data-schgetal="conv.0.sch"]').fill('25'); await klik('[data-schknip="conv.0.sch"]'); await klik('[data-schklaar="conv.0.sch"]');
      t.check(/34/.test(await tekst('[data-omgezet]')), 'omzetten: 0,75 = 3/4 in de omgezette rij');
      /* kommagetallen: een 0 bijzetten */
      await t.dot(13); await klik('[data-dz="0"][data-act="1"]');
      t.check(/3,50/.test(await p.locator('.rv .srij .orig').nth(1).textContent()), 'kommagetallen: 3,5 wordt 3,50');
      /* vraagstuk fles: uitgieten */
      await t.dot(24); await klik('.h4-giet'); await p.waitForTimeout(1600);
      t.check(/Terug/.test(await tekst('.h4-giet')), 'fles: uitgegoten');
      await t.dot(27); await klik('[data-opt="b"]');
      await p.waitForTimeout(1600);
      const w = await t.antw();
      t.check(w.ex01.merged && w.ex01.N === 12 && w.ex01.sch.mode === 'skip' && w.ex05.sch.x === 1 && w.ex05.sch.sx === 1 && w.ex05.sch.cuts[0] === 2 && w.ex13.x === 1 && w.ex13.p.length === 1 && w.ex13.kx === 1
        && w.ex17.conv[0].sch.done && w.ex14.z[0] === 1 && w.ex25.pour && w.ex28.choice === 'b', 'rationale getallen: antwoorden bewaard');
      const r = await p.evaluate(()=>{ const O = window.OPGAVE, q = id=>O.delen.flatMap(d=>d.vragen).find(x=>x.id === id), S = f=>({ mode:'skip', cuts:[], done:true, for:f, x:0, nv:0, sx:0 });
        return [O.verbeter(q('ex28'), { choice:'a', res:{ s1:'+', t:'3', n:'7' }, sch:S('3/7') }, { good:'b' }),
          O.verbeter(q('ex09'), { p:[], x:0, conv:[], kgv:'12', kx:0, kxv:[], terms:[{ sign:'+', t:'8' }, { sign:'+', t:'3' }], res:{ s1:'+', t:'11', n:'' }, sch:S('11/12') })]; });
      t.check(r[0].pts === 0 && r[0].codes.includes('FOUTENJAGER') && r[0].codes.includes('TELLERS_NOEMERS_OPGETELD') && r[1].pts === .75 && r[1].codes.includes('TEKEN_TERM') && r[1].codes.includes('DOORWERKFOUT'), 'rationale getallen: foutcodes ' + JSON.stringify(r));
    } },
  { id:'2a-rv-5-rationale-vermenigvuldigen', url:'2A/rekenvaardigheden/5-rationale-vermenigvuldigen/', blok:'Vermenigvuldigen en delen van rationale getallen', n:30, max:'57',
    sleutel:{ ex21:{ a:[1, 2], b:[2, 1] }, ex22:{ a:[1, 2], b:[2, 1] }, ex23:{ a:[1, 2], b:[1, 4] }, ex24:{ a:[1, 2], b:[1, 4] }, ex25:{ a:[1, 2], b:[1, 4] },
      ex28:{ good:'a' }, ex29:{ good:'a' }, ex30:{ good:'a' } },
    async interactie(p, t){
      const klik = (s, n = 0)=>p.locator('.rv ' + s).nth(n).click().then(()=>p.waitForTimeout(90));
      const tekst = s=>p.locator('.rv ' + s).first().textContent().then(x=>x.replace(/\s+/g, ''));
      /* rechthoekmodel: punt (x, y) in het rooster van C kolommen en R rijen */
      const vak = async (c, r, C, R)=>{ const pt = await p.evaluate(([x, y])=>{ const m = document.querySelector('.rv .h5-rh').getScreenCTM(); return { x:m.a * x + m.e, y:m.d * y + m.f }; }, [70 + 520 * (c + .5) / C, 34 + 320 * (r + .5) / R]);
        await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(120); };
      const schrap = async (ti, ni, d)=>{ await klik(`[data-sc="t"][data-i="${ti}"]`); await klik(`[data-sc="n"][data-i="${ni}"]`); await p.locator('.rv .h5-deler').fill(String(d)); await klik('.h5-schrap'); };
      /* rechthoekmodel 3/4 van 2/3: 3 kolommen (2 paars), 4 rijen (3 geel), diagonaal schrappen */
      await klik('[data-arc="1"]'); await klik('[data-arc="1"]'); await vak(0, 0, 3, 1); await vak(1, 0, 3, 1);
      await klik('[data-armode="r"]'); for(let i = 0; i < 3; i++) await klik('[data-arr="1"]'); for(let r = 0; r < 3; r++) await vak(0, r, 3, 4);
      t.check(await p.locator('.rv .h5-rh rect[fill="url(#h5-arc)"]').count() === 6, 'rechthoekmodel: 6 vakjes gearceerd');
      await schrap(0, 1, 3); await p.waitForTimeout(700);
      t.check(await p.locator('.rv .h5-lijn').count() === 1 && /1/.test(await tekst('[data-sc="t"][data-i="0"] .h5-nu')), 'schrappen: 3 en 3 diagonaal geschrapt, lijn getekend');
      /* een onmogelijke schrap: 4 en 9 door 2 → rood kruisje */
      await t.dot(3); await schrap(0, 0, 2); await p.waitForTimeout(150);
      t.check(await p.locator('.rv .h5-schrap .rv-kruis').count() === 1, 'schrappen: onmogelijke schrap → rood kruisje');
      await p.waitForTimeout(1000); await t.teken('sign', '−'); await schrap(0, 1, 4); await p.waitForTimeout(300); await schrap(1, 0, 3); await p.waitForTimeout(300);
      await t.vul('res.t', 2); await t.vul('res.n', 12); await klik('[data-schopen="sch"]');
      const r1 = await p.locator('.rv').evaluate(e=>{ e.scrollIntoView({ block:'start' }); const s = document.querySelector('.rv .br-schaar'); return { h:Math.round(e.getBoundingClientRect().height), s:s ? Math.round(s.getBoundingClientRect().bottom) : 999 }; });
      t.check(r1.h <= 600 && r1.s <= 640, `stappenplan: schaar open, alles op het scherm (${r1.h} px, schaar tot ${r1.s} px)`);
      await p.locator('.rv [data-schgetal="sch"]').fill('2'); await klik('[data-schknip="sch"]'); await klik('[data-schklaar="sch"]');
      t.check(/=−16$/.test(await tekst('.br-res')), 'stappenplan: −2/12 geknipt tot −1/6: ' + await tekst('.br-res'));
      /* delen: teller : teller gaat niet op bij 7/8 : 5/2 → rood kruisje; maal het omgekeerde, de breuk keert om */
      await t.dot(10); await klik('[data-meth="td"]'); await p.waitForTimeout(150);
      t.check(await p.locator('.rv [data-meth="td"] .rv-kruis').count() === 1, 'delen: teller : teller ging niet op → rood kruisje');
      await p.waitForTimeout(1000); await klik('[data-meth="om"]'); await klik('[data-flip="1"]');
      t.check(await p.locator('.rv .h5-maal').count() === 1 && /2/.test(await tekst('[data-sc="t"][data-i="1"]')), 'delen: 5/2 omgekeerd tot 2/5');
      /* kommagetal maal kommagetal: de komma schuift */
      await t.dot(15); await t.teken('int.s', '+'); await t.vul('int.n', 12); await t.vul('cnt', 2); await p.waitForTimeout(1100);
      t.check(/0,12/.test(await tekst('.h5-dres')), 'kommagetallen: 0,3 ⋅ 0,4 = 0,12: ' + await tekst('.h5-dres'));
      await t.dot(17); await klik('[data-fop="0"]');
      t.check((await tekst('[data-fop="0"]')) === '⋅', 'weetjes: bewerking gekozen');
      /* vraagstuk: na het sjabloon verschijnt de rekenmachine */
      await t.dot(20); for(const [pad, w] of [['tp.a.t', 3], ['tp.a.n', 8], ['tp.b.t', 24], ['tp.c.t', 3], ['tp.c.n', 8], ['tp.d.t', 24]]) await t.vul(pad, w);
      t.check(await p.locator('.rv .h5-swrap').count() === 0, 'vraagstuk: rekenmachine wacht op het sjabloon');
      await t.vul('tp.d.n', 1); await p.waitForTimeout(150);
      t.check(await p.locator('.rv .h5-swrap').count() === 1 && await p.locator('.rv input[data-pad="tp.d.n"]').evaluate(e=>e === document.activeElement), 'vraagstuk: rekenmachine verschijnt, het vak houdt de focus');
      await t.dot(27); await klik('[data-opt="c"]');
      await p.waitForTimeout(1600);
      const w = await t.antw();
      t.check(w.ex01.cs.length === 2 && w.ex01.rs.length === 3 && w.ex01.cuts.length === 1 && w.ex04.x === 1 && w.ex04.cuts.length === 2 && w.ex04.sch.cuts[0] === 2 && w.ex11.mx === 1 && w.ex11.flip[1]
        && w.ex16.cnt === '2' && w.ex18.rows[0].op === '⋅' && w.ex21.tp.d.n === '1' && w.ex28.choice === 'c', 'rationale getallen vermenigvuldigen: antwoorden bewaard');
      const r = await p.evaluate(()=>{ const O = window.OPGAVE, q = id=>O.delen.flatMap(d=>d.vragen).find(x=>x.id === id), S = f=>({ mode:'skip', cuts:[], done:true, for:f, x:0, nv:0, sx:0 });
        return [O.verbeter(q('ex28'), { choice:'a', res:{ s1:'+', t:'6', n:'5' }, sch:S('6/5') }, { good:'c' }),
          O.verbeter(q('ex29'), { choice:'b', res:{ s1:'+', t:'3', n:'10' }, sch:S('3/10') }, { good:'b' }),
          O.verbeter(q('ex10'), { method:'om', flip:[false, true], sign:'−', cuts:[], cutsFor:'', x:0, mx:0, res:{ t:'2', n:'7' }, sch:S('-2/7') })]; });
      t.check(r[0].pts === 0 && r[0].codes.includes('FOUTENJAGER') && r[0].codes.includes('NOEMER_BEHOUDEN') && r[1].pts === .5 && r[1].codes.includes('NIET_OMGEKEERD')
        && r[2].codes.includes('TEKENREGEL') && r[2].codes.includes('NIET_EERST_DELEN') && r[2].codes.includes('NIET_GESCHRAPT'), 'vermenigvuldigen: foutcodes ' + JSON.stringify(r));
    } }
  ,
  { id:'2a-rv-6-machten-wortels', url:'2A/rekenvaardigheden/6-machten-wortels/', blok:'Machten en vierkantswortels', n:30, max:'49,5',
    sleutel:{ ex28:{ good:'a' }, ex29:{ good:'a' }, ex30:{ good:'a' } },
    async interactie(p, t){
      const klik = (s, n = 0)=>p.locator('.rv ' + s).nth(n).click().then(()=>p.waitForTimeout(90));
      const tekst = s=>p.locator('.rv ' + s).first().textContent().then(x=>x.replace(/\s+/g, ''));
      /* 5²: een rij van 5 bouwen, vastzetten, 5 rijen, vastzetten → de vakjes worden genummerd tot 25 */
      for(let i = 0; i < 5; i++) await klik('[data-bld="a"][data-d="1"]');
      await klik('[data-lock="ra"]'); for(let i = 0; i < 4; i++) await klik('[data-bld="r"][data-d="1"]'); await klik('[data-lock="rr"]');
      await p.waitForTimeout(2000);
      t.check(await tekst('.h6-btel b') === '25' && await p.locator('.rv .h6-gn.aan').count() === 25, 'bouwen: vierkant 5 bij 5, de vakjes genummerd tot ' + await tekst('.h6-btel b'));
      await t.vul('n', 2); await p.waitForTimeout(150);
      t.check(await tekst('.h6-keten') === '5⋅5' && await p.locator('.rv input[data-pad="n"]').evaluate(e=>e === document.activeElement), 'macht: herhaalde vermenigvuldiging 5 ⋅ 5, het vak houdt de focus');
      await t.teken('res.s', '+'); await t.vul('res.n', 25);
      /* (−3)³: twee minnen aanklikken, samen verdwijnen ze */
      await t.dot(2); await t.vul('n', 3); await p.waitForTimeout(150);
      t.check(await p.locator('.rv .h6-keten .rv-sg').count() === 3, 'minnen: drie minnen aanklikbaar');
      await klik('.h6-keten .rv-sg', 0); await klik('.h6-keten .rv-sg', 1); await p.waitForTimeout(600);
      t.check(await p.locator('.rv .h6-keten .rv-sg').count() === 1 && /^3⋅3⋅\(−3\)$/.test(await tekst('.h6-keten')), 'minnen: twee minnen samen weg: ' + await tekst('.h6-keten'));
      /* haakjes of niet: het verkeerde grondtal kiezen toont de gevolgen */
      await t.dot(7); await klik('[data-gp="0"][data-g="p"]');
      t.check(await tekst('.h6-twkaart .h6-keten') === '−(3⋅3)', 'haakjes of niet: grondtal 3 bij (−3)² geeft −(3 ⋅ 3)');
      /* macht van een breuk: teller maal teller, noemer maal noemer, kan niet eenvoudiger */
      await t.dot(10); await t.vul('n', 3); await t.teken('s0', '+'); await t.teken('res.s1', '+'); await t.vul('res.t', 1); await t.vul('res.n', 1000);
      await klik('[data-schniet="sch"]');
      t.check(await p.locator('.rv .h6-prod .br-t').textContent() === '1 ⋅ 1 ⋅ 1' && await p.locator('.rv [data-schniet="sch"].aan').count() === 1, 'breuk: 1 ⋅ 1 ⋅ 1 over 10 ⋅ 10 ⋅ 10, kan niet eenvoudiger');
      /* kommagetal: de komma schuift op zijn plaats */
      await t.dot(14); await t.vul('n', 2); await t.vul('i', 9); await t.vul('cnt', 2); await p.waitForTimeout(1100);
      t.check(await tekst('.h6-dres') === '0,09', 'kommagetal: (0,3)² = 0,09: ' + await tekst('.h6-dres'));
      /* vierkantswortel: de zijde zoeken */
      await t.dot(16); for(let i = 0; i < 3; i++) await klik('[data-side="1"]');
      t.check(await tekst('.h6-nval') === '4' && await p.locator('.rv .h6-gn').count() === 16, 'wortel: vierkant met zijde 4 en 16 genummerde vakjes');
      await t.dot(22); await t.vul('x', '0,5'); await p.waitForTimeout(100);
      t.check(await tekst('.h6-spiegel') === '0,5', 'wortel van een kommagetal: het getal staat ook in de tweede factor');
      await t.dot(27); await klik('[data-opt="b"]');
      await p.waitForTimeout(1600);
      const w = await t.antw();
      t.check(w.ex01.bld.num && w.ex01.n === '2' && w.ex01.res.n === '25' && w.ex03.mp.p.length === 1 && w.ex08.parts[0].g === 'p' && w.ex11.sch.mode === 'skip'
        && w.ex15.cnt === '2' && w.ex17.side === 4 && w.ex23.x === '0,5' && w.ex28.choice === 'b', 'machten en wortels: antwoorden bewaard');
      const r = await p.evaluate(()=>{ const O = window.OPGAVE, q = id=>O.delen.flatMap(d=>d.vragen).find(x=>x.id === id);
        return [O.verbeter(q('ex03'), { n:'3', mp:{ p:[], x:0 }, res:{ s:'+', n:'27' } }),
          O.verbeter(q('ex02'), { bld:{ a:7, ra:true, r:7, rr:true, l:1, ll:false, num:true }, n:'2', mp:{ p:[], x:0 }, res:{ s:'+', n:'49' } }),
          O.verbeter(q('ex17'), { side:1, res:'8' }), O.verbeter(q('ex30'), { choice:'c', res:{ s:'+', n:'7' } }, { good:'b' })]; });
      t.check(r[0].pts === .5 && r[0].codes.includes('BOUW_FOUT') && r[0].codes.includes('MINNEN_NIET_GEPAARD') && r[0].codes.includes('TEKEN_MACHT')
        && r[1].pts === 1 && r[1].codes.includes('HAAKJES') && r[2].pts === 0 && r[2].codes.includes('WORTEL_HELFT') && r[2].codes.includes('ZIJDE_NIET_GEZOCHT')
        && r[3].pts === 0 && r[3].codes.includes('FOUTENJAGER') && r[3].codes.includes('WORTEL_SOM'), 'machten: foutcodes ' + JSON.stringify(r));
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
      for(let i = 0; i < R.n; i++){ await dot(i); await rv.evaluate(e=>e.scrollIntoView({ block:'start' })); const h = await rv.evaluate(e=>e.getBoundingClientRect().height); if(process.env.HOOGTES) console.log('     ', wat, i + 1, Math.round(h)); if(process.env.SCHERMEN) await rv.screenshot({ path:`${process.env.SCHERMEN}/${wat}_${i + 1}.png` }); if(h > hoogst){ hoogst = h; waar = i + 1; } }
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
    if(process.env.SCHERMEN) await p.screenshot({ path:`${process.env.SCHERMEN}/sleutel_${R.id}.png`, fullPage:true });
  }
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
