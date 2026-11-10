/* Versleepbare vensters (gedeeld/versleep.js), met de nep-Firebase.
   node test/versleep.js   (eerst test/serve.sh)
   Wiskundige problemen 2A: rekenmachine en woordenboek verslepen, blijven staan bij opnieuw tekenen en scrollen,
   dubbelklik zet terug, sluiten en opnieuw openen = standaardplek. Spiekbriefje in 1A module 1: blijft in de pagina,
   versleept zweeft het en schuift de oefening terug omhoog, sluitknop. 2B-modules en TI-30XB: dubbelklik zet terug. */
const H = require('./helpers');
(async()=>{
  const { b, ctx } = await H.context({ breedte:1366 }); let ok = true; const check = (c, t)=>{ console.log((c ? 'OK   ' : 'FOUT ') + t); if(!c) ok = false; };
  const LK = { uid:'lk', email:'vandaele.tom@svsl.be', displayName:'Tom Van Daele' };
  const p = await H.pagina(ctx, { 'leerkrachten/vandaele.tom@svsl.be':{ naam:'Tom Van Daele' } });
  await p.setViewportSize({ width:1366, height:650 });
  const rect = sel => p.evaluate(s=>{ const e = document.querySelector(s); if(!e) return null; const r = e.getBoundingClientRect(); return { l:Math.round(r.left), t:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height), pos:getComputedStyle(e).position }; }, sel);
  const sleep = async (sel, dx, dy) => { const r = await rect(sel); const x = r.l + r.w / 2, y = r.t + Math.min(14, r.h / 2);
    await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x + dx / 2, y + dy / 2, { steps:4 }); await p.mouse.move(x + dx, y + dy, { steps:4 }); await p.mouse.up(); };

  /* ---------- wiskundige problemen 2A ---------- */
  await H.aanmelden(p, '2A/wiskundige-problemen/', LK); await p.waitForTimeout(1200);
  await p.click('nav.side button[data-d=wpo]'); await p.waitForTimeout(150);
  await p.click('form[data-f=keuze] button[type=submit]'); await p.waitForTimeout(300);
  for(let i = 0; i < 20 && !(await p.locator('.tools [data-a=calc]').count()); i++){
    await p.evaluate(()=>__oefensite.vulJuist()); await p.click('[data-a=bevestig]'); await p.waitForTimeout(60); await p.click('[data-a=verder]'); await p.waitForTimeout(80);
  }
  check(await p.locator('.tools [data-a=calc]').count() === 1, 'vraag met rekenmachine gevonden');
  await p.click('.tools [data-a=calc]'); await p.waitForTimeout(150);
  check(await p.locator('#calc .paneelkop .vs-greep').count() === 1, 'rekenmachine heeft een greepje in de titelbalk');
  const r0 = await rect('#calc');
  await sleep('#calc .paneelkop', -500, 60); await p.waitForTimeout(80);
  const r1 = await rect('#calc');
  check(r1.pos === 'fixed' && Math.abs(r1.l - (r0.l - 500)) <= 3 && Math.abs(r1.t - (r0.t + 60)) <= 3, `rekenmachine versleept (${r0.l},${r0.t}) → (${r1.l},${r1.t})`);
  await p.click('#calc button[data-k="7"]'); await p.click('#calc button[data-k="×"]'); await p.click('#calc button[data-k="6"]'); await p.click('#calc button[data-k="="]');
  check((await p.locator('#calc output').innerText()).trim() === '42', 'toetsen werken na het slepen: 7 × 6 = 42');
  await p.click('.tools [data-a=marker]'); await p.waitForTimeout(120);   /* de pagina tekent de vraag opnieuw */
  const r2 = await rect('#calc');
  check(r2 && Math.abs(r2.l - r1.l) <= 2 && Math.abs(r2.t - r1.t) <= 2, 'opnieuw getekend: rekenmachine blijft waar ze stond');
  await p.click('.tools [data-a=marker]'); await p.waitForTimeout(80);
  await p.mouse.wheel(0, 300); await p.waitForTimeout(150);
  const r3 = await rect('#calc');
  check(Math.abs(r3.t - r1.t) <= 2, 'bij scrollen blijft ze op dezelfde plek op het scherm');
  await p.mouse.wheel(0, -300); await p.waitForTimeout(100);
  await p.dblclick('#calc .paneelkop b'); await p.waitForTimeout(100);
  const r4 = await rect('#calc');
  check(r4.pos === 'absolute' && Math.abs(r4.l - r0.l) <= 2 && Math.abs(r4.t - r0.t) <= 2, 'dubbelklik zet ze terug op de standaardplek');
  await sleep('#calc .paneelkop', -400, 60); await p.waitForTimeout(60);
  await p.click('#calc .sluit'); await p.waitForTimeout(100); await p.click('.tools [data-a=calc]'); await p.waitForTimeout(100);
  const r5 = await rect('#calc');
  check(r5.pos === 'absolute' && Math.abs(r5.l - r0.l) <= 2, 'sluiten en opnieuw openen: weer op de standaardplek (niet onthouden)');
  await p.focus('#calc .vs-greep'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft');
  const r6 = await rect('#calc');
  check(Math.abs(r6.l - (r0.l - 40)) <= 2, 'pijltjestoetsen op het greepje verplaatsen het venster');
  await p.click('.tools [data-a=wb]'); await p.waitForTimeout(120);
  await sleep('#wb .paneelkop', -300, 40); await p.waitForTimeout(60);
  check((await rect('#wb')).pos === 'fixed', 'woordenboek versleepbaar');
  await p.fill('#wbz', 'oppervlakte'); await p.waitForTimeout(100);
  check((await rect('#wb')).pos === 'fixed', 'typen in het woordenboek laat het venster staan');
  check(p.fouten.length === 0, 'geen fouten op de pagina: ' + p.fouten.join(' | '));

  /* ---------- spiekbriefje 1A module 1 ---------- */
  await p.goto(H.B + '1A/modules/module-1-getallen/'); await p.waitForTimeout(1200);
  const sec = await p.evaluate(()=>{ const b = [...document.querySelectorAll('.cheat-btn')].find(x=>!x.classList.contains('vx-hulp-btn')); const s = b && b.closest('section'); return s && s.id; });
  check(!!sec, 'onderdeel met spiekbriefje: ' + sec);
  await p.evaluate(id=>{ const a = document.querySelector(`nav.side a[href="#${id}"], nav.side [data-sec="${id}"]`); if(a) a.click(); }, sec); await p.waitForTimeout(200);
  const kaart = `section#${sec} .card`;
  const k0 = await rect(kaart);
  await p.click(`section#${sec} .cheat-btn`); await p.waitForTimeout(120);
  const c0 = await rect(`section#${sec} .cheat`), k1 = await rect(kaart);
  check(c0.pos === 'static' && k1.t > k0.t + 40, 'spiekbriefje opent in de pagina zoals voorheen');
  await sleep(`section#${sec} .cheat > h3`, 400, 80); await p.waitForTimeout(100);
  const c1 = await rect(`section#${sec} .cheat`), k2 = await rect(kaart);
  check(c1.pos === 'fixed' && Math.abs(k2.t - k0.t) <= 2, 'versleept: het zweeft en de oefening schuift terug omhoog');
  check(await p.locator(`section#${sec} .cheat .vs-sluit:visible`).count() === 1, 'zwevend spiekbriefje heeft een sluitknop');
  await p.click(`section#${sec} .cheat .vs-sluit`); await p.waitForTimeout(100);
  check(await p.locator(`section#${sec} .cheat`).isHidden() && await p.getAttribute(`section#${sec} .cheat-btn`, 'aria-expanded') === 'false', 'sluitknop sluit het spiekbriefje (knop mee bijgewerkt)');
  await p.click(`section#${sec} .cheat-btn`); await p.waitForTimeout(100);
  check((await rect(`section#${sec} .cheat`)).pos === 'static', 'opnieuw openen: weer in de pagina');

  /* ---------- uitleg bij een foute stap (vrij antwoordvak): geen titelbalk, dus aan het hele kadertje ---------- */
  await p.goto(H.B + '1A/modules/module-5-gehele-getallen/'); await p.waitForTimeout(1200);
  await p.evaluate(()=>{ const r = document.createElement('div'); r.style.position = 'relative'; r.innerHTML = '<div class="vx-uit" id="proefuitleg"><button type="button" class="vx-uit-dicht">×</button>Kijk naar het teken.</div>';
    document.querySelector('main').prepend(r); });
  await p.waitForTimeout(100);
  const u0 = await rect('#proefuitleg');
  await sleep('#proefuitleg', 200, 100); await p.waitForTimeout(60);
  const u1 = await rect('#proefuitleg');
  check(u1.pos === 'fixed' && Math.abs(u1.l - (u0.l + 200)) <= 3, 'uitlegkadertje bij een stap versleepbaar');
  await p.evaluate(()=>{ document.getElementById('proefuitleg').hidden = true; }); await p.waitForTimeout(60);
  check(await p.evaluate(()=>!document.getElementById('proefuitleg').classList.contains('vs-los')), 'gesloten uitlegkadertje gaat terug naar zijn plek');

  /* ---------- 2B module 1: rekenmachine ---------- */
  await p.goto(H.B + '2B/modules/module-1-rekenen/'); await p.waitForTimeout(1200);
  await p.evaluate(()=>{ const b = document.querySelector('.rm-knop'); b.closest('section').hidden = false; b.click(); }); await p.waitForTimeout(120);
  const m0 = await rect('.rm-venster');
  await sleep('.rm-balk', -500, -200); await p.waitForTimeout(60);
  const m1 = await rect('.rm-venster');
  check(Math.abs(m1.l - (m0.l - 500)) <= 3, '2B-modules: rekenmachine versleepbaar');
  await p.dblclick('.rm-balk span'); await p.waitForTimeout(80);
  const m2 = await rect('.rm-venster');
  check(Math.abs(m2.l - m0.l) <= 2 && Math.abs(m2.t - m0.t) <= 2, '2B-modules: dubbelklik zet ze terug');
  await sleep('.rm-balk', -300, -100); await p.click('.rm-venster .rm-x'); await p.evaluate(()=>document.querySelector('.rm-knop').click()); await p.waitForTimeout(80);
  const m3 = await rect('.rm-venster');
  check(Math.abs(m3.l - m0.l) <= 2, '2B-modules: opnieuw openen op de standaardplek');

  await p.click('.rm-venster .rm-x');
  /* ---------- TI-30XB ---------- */
  await p.evaluate(()=>{ localStorage.setItem('ti30xb_pos', JSON.stringify({ l:.05, t:.05 })); });
  await p.waitForFunction(()=>window.TI30XB && document.querySelector('.ti30-fab'), null, { timeout:5000 }).catch(()=>{});
  check(await p.locator('.ti30-fab').count() === 1, 'knop met het rekentoestel staat er (leerkracht)');
  await p.click('.ti30-fab'); await p.waitForTimeout(200);
  const t0 = await rect('.ti30-win');
  check(t0.l > 1366 / 2, 'TI-30XB opent op de standaardplek rechts, niet op een onthouden plek (' + t0.l + ',' + t0.t + ')');
  await p.evaluate(()=>{ const w = document.querySelector('.ti30-win'); w.style.left = '20px'; w.style.top = '20px'; w.dispatchEvent(new MouseEvent('dblclick', { bubbles:true })); });
  const t1 = await rect('.ti30-win');
  check(Math.abs(t1.l - t0.l) <= 2 && Math.abs(t1.t - t0.t) <= 2, 'TI-30XB: dubbelklik op de rand zet het terug');
  check(p.fouten.length === 0, 'geen fouten op de pagina: ' + p.fouten.join(' | '));

  await b.close(); process.exit(ok ? 0 : 1);
})();
