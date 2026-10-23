/* Resultaten gaan nooit verloren: per vraag samengevoegd in res, ook na een mislukt ophalen of met een tweede tabblad.
   node test/resultaten.js   (eerst test/serve.sh) */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LL = { uid:'ll', email:'x@svsl.be', displayName:'X Leerling' };
  const start = { 'groepen/G':{ naam:'G', jaar:'1', stroom:'A', soort:'klas', leerkrachten:[], leerlingen:[LL.email], aan:{ m3:{ on:true, uit:[], rt:false } } },
    /* resultaten en werktijd van een vorige les (oud formaat: enkel data._res) */
    'voortgang/ll_m3':{ email:LL.email, naam:'X', site:'m3', schooljaar:'2026-2027', data:{ _res:JSON.stringify({ lijn_oud_1:1, lijn_oud_2:1 }) }, tijd:{ lijn:600 } } };
  const werk = async (p, sec, n = 3)=>{ await p.evaluate(i=>show(i), sec); await p.waitForTimeout(400);
    await p.evaluate(n=>{ const s = document.querySelector('section.group:not([hidden])'); s.querySelectorAll('input.inp').forEach(i=>{ i.value = '5'; i.dispatchEvent(new Event('input', { bubbles:true })); });
      [...s.querySelectorAll('button')].filter(b=>/Controleer/.test(b.textContent)).slice(0, n).forEach(b=>b.click()); }, n);
    await p.mouse.move(5, 5); await p.waitForTimeout(300); };
  const bewaar = async p=>{ await p.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await p.waitForTimeout(800); };
  const doc = async p=>(await H.fakedb(p))['voortgang/ll_m3'];
  const res = d=>Object.assign({}, JSON.parse((d.data || {})._res || '{}'), d.res || {});

  /* 1. nieuw toestel (lege localStorage) en ophalen mislukt bij het openen */
  const p = await H.pagina(ctx, start);
  await p.goto(H.B + '1A/modules/module-3-data/'); await p.evaluate(u=>{ window.__nextUser = u; window.__getDocFout = 3; }, LL);
  await p.click('#loginBtn'); await p.waitForTimeout(7000);
  await werk(p, 'freq'); await bewaar(p);
  let d = await doc(p), r = res(d);
  check(r.lijn_oud_1 === 1 && r.lijn_oud_2 === 1, 'oude resultaten blijven na een mislukt ophalen');
  check(Object.keys(r).some(k=>k.startsWith('freq_')), 'nieuwe resultaten bewaard (' + Object.keys(r).length + ')');
  check(d.tijd.lijn === 600, 'werktijd van een vorig onderdeel blijft (' + d.tijd.lijn + ')');
  check(d.diag && d.diag.ophaalPogingen === 3 && d.diag.laatGeladen === 1, 'diagnose: 3 pogingen bij het openen, later wel geladen ' + JSON.stringify(d.diag && [d.diag.ophaalPogingen, d.diag.laatGeladen]));

  /* 2. tweede tabblad met een oude toestand: wat het bewaart, wist niets */
  const p2 = await ctx.newPage(); p2.fouten = []; p2.on('pageerror', e=>p2.fouten.push(e.message)); await H.aanmelden(p2, '1A/modules/module-3-data/', LL); await p2.waitForTimeout(1500);
  await werk(p, 'diagram'); await bewaar(p);
  await werk(p2, 'lijn');
  await bewaar(p2);
  d = await doc(p2); r = res(d);
  check(r.lijn_oud_1 === 1 && Object.keys(r).some(k=>k.startsWith('freq_')) && Object.keys(r).some(k=>k.startsWith('diagram_')) && Object.keys(r).some(k=>k.startsWith('lijn_') && !k.startsWith('lijn_oud')),
    'tweede tabblad: alle resultaten samen ' + Object.keys(r).join(','));
  check(!p.fouten.length && !p2.fouten.length, 'geen JavaScript-fouten ' + p.fouten.concat(p2.fouten).join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
