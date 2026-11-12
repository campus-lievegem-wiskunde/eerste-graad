/* 1A Proefexamen december (site 1a-pex), met de nep-Firebase.
   node test/proefexamen.js   (eerst test/serve.sh)
   Leerling van 1ANg1: tegel zichtbaar als het proefexamen openstaat, drie proefexamens in het menu, elk met Deel 1 en Deel 2,
   rekentoestel enkel in deel 2, elke vraag heeft punten, leeg verbeteren geeft 0, het totaal komt in Firestore (toets1_0),
   "Opnieuw met andere getallen" (20 keer per deel) zonder fouten, een verborgen proefexamen verdwijnt uit het menu. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LL = { uid:'ll1', email:'janssens.lars@svsl.be', displayName:'Lars Janssens' };
  const LK = 'dejaeger.jeroen@svsl.be';
  const start = { [`leerkrachten/${LK}`]:{ naam:'Jeroen De Jaeger' },
    'leerlingen/janssens.lars@svsl.be':{ familienaam:'Janssens', voornaam:'Lars', klas:'1E', jaar:'1', stroom:'A' },
    'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', soort:'niveaugroep', leerkrachten:[LK], leerlingen:[LL.email], aan:{ '1a-pex':{ on:true, uit:['toets3'] } } } };
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, '1A/modules/', LL); await p.waitForTimeout(800);
  check(await p.locator('a.tegel[data-site="1a-pex"]:visible').count() === 1, 'tegel Proefexamen december staat open in 1A › Modules');
  await p.goto(H.B + '1A/modules/proefexamen-december/'); await p.waitForTimeout(2000);
  const nav = await p.locator('nav.side .lbl').allTextContents();
  check(nav.join('|') === 'Proefexamen 1|Proefexamen 2', 'menu: ' + nav.join(', ') + ' (Proefexamen 3 staat dicht)');
  for(const sid of ['toets1', 'toets2']){
    await p.evaluate(s=>show(s, false), sid); await p.waitForTimeout(400);
    for(const d of [0, 1]){
      await p.click(`#${sid} .tabs .tab >> nth=${d}`); await p.waitForTimeout(200);
      const fab = await p.locator('.ti30-fab:visible').count();
      check(d ? fab === 1 : fab === 0, `${sid} deel ${d + 1}: rekentoestel ${d ? 'zichtbaar' : 'verborgen'}`);
      const pane = p.locator(`#${sid} .tabpane:not([hidden])`);
      const pts = await pane.locator('.pex-q .pt-pts').allTextContents();
      check(pts.length === 10 && pts.every(t => /\/ [1-9]/.test(t)), `${sid} deel ${d + 1}: 10 vragen met punten (${pts.join(' ')})`);
      for(let k = 0; k < 20; k++){ await pane.locator('.pt-actions .btn.ghost').click(); await p.waitForTimeout(60); }
      check(!p.fouten.length, `${sid} deel ${d + 1}: 20 keer nieuwe getallen zonder fouten ${p.fouten.slice(0, 2).join(' | ')}`);
      await pane.locator('.pt-actions .btn.big:not(.ghost)').click(); await p.waitForTimeout(300);
      const sc = await pane.locator('.score .big').first().textContent();
      check(/^0 \/ \d/.test(sc), `${sid} deel ${d + 1}: leeg verbeterd geeft ${sc}`);
    }
    check(/Totaal: 0 \/ \d/.test(await p.locator(`#${sid} .pex-tot`).textContent()), `${sid}: totaal van beide delen bovenaan`);
  }
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); await p.waitForTimeout(1200);
  const db = await H.fakedb(p); const v = db['voortgang/ll1_1a-pex'] || {};
  const t = Object.assign({}, v.toets || {}); try{ Object.assign(t, JSON.parse((v.data || {})._toets || '{}')); }catch(e){}
  check(t.toets1_0 && t.toets1_0.score === 0 && t.toets1_0.n > 30 && t.toets2_0, 'scores van beide proefexamens in Firestore: ' + JSON.stringify(t));
  check(!p.fouten.length, 'geen JavaScript-fouten ' + p.fouten.join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
