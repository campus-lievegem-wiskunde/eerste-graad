/* Bordmodus en Volledig scherm zonder de Fullscreen API, met de nep-Firebase.
   node test/bordmodus.js   (eerst test/serve.sh)
   Bord (leerkracht, gedeeld en de eigen bordmodus van 1A module 3 en 2A module 2) en Volledig scherm (leerling)
   vullen het browservenster met CSS, zonder requestFullscreen (dus zonder de browsermelding 'Druk op Esc ...').
   Esc en ✕ Sluiten sluiten het venster. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context(); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const { SITES } = await import('../gedeeld/sites.js'); const pad = id => SITES.find(s=>s.id === id).pad;
  await ctx.addInitScript(()=>{ window.__fs = 0; Element.prototype.requestFullscreen = function(){ window.__fs++; return Promise.resolve(); }; });
  const LK = { uid:'lk', email:'collega.echt@svsl.be', displayName:'Echte Collega' }, LL = { uid:'ll', email:'echte.leerling@svsl.be', displayName:'Echte Leerling' };
  const start = { 'leerkrachten/collega.echt@svsl.be':{ naam:'Echte Collega' },
    'groepen/1ANg1':{ naam:'1ANg1', jaar:'1', stroom:'A', soort:'niveaugroep', leerkrachten:[LK.email], leerlingen:[LL.email], aan:{ m1:{ on:true, uit:[], rt:false } } } };
  /* opent het venster met de knop sel, controleert het en sluit het met Esc of ✕ */
  async function venster(p, sel, ov, naam, sluit){
    await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.locator(sel).first().click(); await p.waitForTimeout(400);
    const r = await p.evaluate(ov=>{ const o = document.querySelector(ov); if(!o) return null; const b = o.getBoundingClientRect();
      return { fs:window.__fs, el:!!document.fullscreenElement, vult:b.left === 0 && b.top === 0 && Math.round(b.width) === innerWidth && Math.round(b.height) === innerHeight }; }, ov);
    check(r && r.fs === 0 && !r.el && r.vult, `${naam}: vult het venster zonder requestFullscreen`);
    if(sluit === 'esc') await p.keyboard.press('Escape'); else await p.locator(ov + ' button', { hasText:'Sluiten' }).first().click();
    await p.waitForTimeout(300);
    check(await p.locator(ov).count() === 0, `${naam}: sluit met ${sluit === 'esc' ? 'Esc' : '✕ Sluiten'}`);
  }
  const p = await H.pagina(ctx, start);
  await H.aanmelden(p, pad('m1'), LK); await p.waitForTimeout(1500);
  await venster(p, '.px-bord-btn', '.px-board', 'Bord (gedeeld, 1A module 1)', 'esc');
  await venster(p, '.px-bord-btn', '.px-board', 'Bord (gedeeld, 1A module 1)', 'knop');
  await p.goto(H.B + pad('m3')); await p.waitForTimeout(2000);
  await venster(p, '.px-bord-btn', '.px-board', 'Bord (eigen, 1A module 3)', 'esc');
  await p.goto(H.B + pad('2a-m2')); await p.waitForTimeout(2000);
  await venster(p, '.bord-btn', '.bord', 'Bord (eigen, 2A module 2)', 'esc');
  check(!p.fouten.length, 'geen fouten op de pagina' + (p.fouten.length ? ': ' + p.fouten.join(' | ') : ''));
  const q = await H.pagina(ctx, start);
  await H.aanmelden(q, pad('m1'), LL); await q.waitForTimeout(1500);
  check(await q.evaluate(()=>document.body.dataset.rol) === 'leerling', 'aangemeld als leerling');
  await venster(q, '.px-vs-btn', '.px-board', 'Volledig scherm (leerling)', 'esc');
  await venster(q, '.px-vs-btn', '.px-board', 'Volledig scherm (leerling)', 'knop');
  check(!q.fouten.length, 'geen fouten op de pagina' + (q.fouten.length ? ': ' + q.fouten.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nAlles OK' : '\nEr zijn fouten'); process.exit(ok ? 0 : 1);
})();
