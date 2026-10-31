/* Pagina van één toets, huistaak of rekenvaardigheid. De pagina zet op <body> data-opdr="<id uit gedeeld/opdrachten.js>",
   laadt eerst opgave.js (window.OPGAVE, zie gedeeld/opgave-weergave.js) en daarna dit bestand en aanmelden.js.
   Leerling: de antwoorden komen in inzendingen/<id>__<e-mail> en worden automatisch bewaard; Indienen zet ingediend
   (bij één poging ook slot: daarna weigert Firestore elke wijziging). De verbetersleutel staat niet in de pagina:
   het dashboard verbetert en schrijft resultaten/<id>__<e-mail>; de leerling ziet dat pas als de leerkracht het vrijgeeft.
   Leerkracht, beheerder of toeschouwer: invullen kan, maar er wordt niets bewaard.
   Een interactieve opdracht (rekenvaardigheden) zet zelf OPGAVE.invullen(opts) → element en OPGAVE.volledig(q, antwoord)
   (zie gedeeld/rv-kader.js); dan tekent die het invulscherm in plaats van gedeeld/opgave-weergave.js, altijd in de vaste volgorde. */
import { klaar, db, F, C } from './aanmelden.js';
import { OPDRACHTEN, groepVoor, docId, schud, soortVan, opdrZichtbaar, uitDb, rubriekNaam } from './opdrachten.js';
import { tekenOpgave, maxPunten } from './opgave-weergave.js';

const B = document.body, app = document.getElementById('app'), OPG = window.OPGAVE;
const o = OPDRACHTEN.find(x=>x.id === B.dataset.opdr);
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const wanneer = ms => new Date(ms).toLocaleString('nl-BE', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' });
const woord = () => soortVan(o) === 'toets' ? 'toets' : 'taak';
const kaart = (titel, html) => el('div', 'opdr-kaart', `<h2>${titel}</h2>${html || ''}`);
const invulScherm = opts => OPG.invullen ? OPG.invullen(opts) : tekenOpgave(OPG, Object.assign({ modus:'invullen' }, opts));

const s = await klaar;
if(!opdrZichtbaar(s.rol, s.toeschouwer)){ app.append(kaart('Deze pagina is nog niet beschikbaar')); }
else if(!o || !OPG || OPG.id !== o.id){ app.append(kaart('Deze pagina is niet in orde', '<p>De opgave of de catalogus ontbreekt. Meld het aan je leerkracht.</p>')); }
else if(s.rol !== 'leerling') voorbeeld();
else leerling();

/* ---------- leerkracht: voorbeeld ---------- */
async function voorbeeld(){
  const tip = el('div', 'tip lk-tip', `<div>Je bekijkt deze ${woord()} als <b>${s.toeschouwer ? 'toeschouwer' : s.rol}</b>. Invullen kan, maar er wordt niets bewaard. Openzetten, resultaten en afdrukken: <a href="${new URL('../dashboard/', import.meta.url).href}">Dashboard</a> › ${rubriekNaam(o.rubriek)}. Totaal: ${maxPunten(OPG)} punten.</div>`);
  app.append(tip);
  const blok = el('div'); app.append(blok);
  blok.append(invulScherm({}));
  try{
    const k = await F.getDoc(F.doc(db, 'sleutels', o.id));
    if(k.exists()){ const b = el('button', 'btn ghost', 'Toon de verbetersleutel'); b.type = 'button';
      b.onclick = ()=>{ const aan = b.dataset.aan !== '1'; b.dataset.aan = aan ? '1' : ''; b.textContent = aan ? 'Verberg de verbetersleutel' : 'Toon de verbetersleutel';
        blok.innerHTML = ''; blok.append(aan ? tekenOpgave(OPG, { modus:'sleutel', sleutel:uitDb(k.data()) }) : invulScherm({})); };
      tip.querySelector('div').append(' ', b); }
  }catch(e){}
}

/* ---------- leerling ---------- */
async function leerling(){
  const email = s.email, best = groepVoor(s.groepen, o, email);
  if(!best){ app.append(kaart(`Deze ${woord()} staat niet open`, '<p>Je leerkracht zet ze open wanneer je eraan mag beginnen.</p>')); return; }
  const { g, cfg } = best;
  const ref = F.doc(db, 'inzendingen', docId(o, email));
  let inz = null;
  try{ const d = await F.getDoc(ref); inz = d.exists() ? d.data() : null; }
  catch(e){ console.warn(e); app.append(kaart('Ophalen lukte niet', '<p>Controleer je internetverbinding en laad de pagina opnieuw.</p>')); return; }
  const st = best.s, venster = (cfg.extra && cfg.extra[email]) || cfg;
  app.innerHTML = '';
  if(st === 'gepland'){ app.append(kaart(`Deze ${woord()} is nog niet open`, `<p>Ze opent op <b>${wanneer(venster.van)}</b>.</p>`)); return; }
  if(st === 'gesloten'){
    app.append(kaart(`Deze ${woord()} is gesloten`, inz && inz.ingediend ? `<p>Je diende in op ${wanneer(inz.ingediend)}.</p>` : inz ? '<p>Je hebt niet op Indienen geklikt. Je leerkracht ziet wel de antwoorden die bewaard werden.</p>' : '<p>Je hebt niets ingediend.</p>'));
    return resultaat(inz);
  }
  if(inz && inz.slot){ app.append(kaart('Ingediend', `<p>Je diende deze ${woord()} in op ${wanneer(inz.ingediend)}. Je kan niets meer wijzigen.</p>`)); return resultaat(inz); }
  if(inz && inz.ingediend){
    const k = kaart('Ingediend', `<p>Je diende in op ${wanneer(inz.ingediend)} (poging ${inz.poging || 1}). Je mag opnieuw: je laatste poging telt.</p>`);
    const b = el('button', 'btn', 'Opnieuw maken'); b.type = 'button';
    b.onclick = async ()=>{ b.disabled = true; try{ await F.setDoc(ref, { ingediend:null }, { merge:true }); inz.ingediend = null; app.innerHTML = ''; invullen(); }catch(e){ b.disabled = false; alert('Dat lukte niet. Probeer opnieuw.'); } };
    k.append(b); app.append(k); return resultaat(inz);
  }
  invullen();

  function invullen(){
    const antw = Object.assign({}, inz && inz.antw);
    const volgorde = cfg.volgorde && !OPG.invullen ? (inz && inz.volgorde) || schud(OPG, o.id + email) : null;
    app.append(el('div', 'info-box', `<div>Je antwoorden worden vanzelf bewaard, ook als je de pagina sluit. Klik op <b>Indienen</b> als je klaar bent.${venster.tot ? ` Deze ${woord()} sluit op <b>${wanneer(venster.tot)}</b>.` : ''}${cfg.pogingen === 1 ? ' Je hebt één poging: na het indienen kan je niets meer wijzigen.' : ''}</div>`));
    const status = el('span', 'opdr-status', inz && inz.bewaard ? 'Bewaard.' : '');
    let timer = null, wacht = false;
    const basis = ()=>({ opdr:o.id, email, naam:s.user.displayName || '', groep:g.id, schooljaar:C.SCHOOLJAAR, antw, volgorde:volgorde || null, bewaard:Date.now() });
    async function bewaar(){
      clearTimeout(timer); timer = null; if(!wacht) return; wacht = false;
      status.textContent = 'Bewaren…';
      try{ await F.setDoc(ref, basis(), { merge:true }); status.textContent = 'Bewaard om ' + new Date().toLocaleTimeString('nl-BE', { hour:'2-digit', minute:'2-digit' }) + '.'; }
      catch(e){ console.warn(e); wacht = true; status.textContent = 'Bewaren lukte niet, we proberen het zo opnieuw.'; timer = setTimeout(bewaar, 8000); }
    }
    app.append(invulScherm({ antw, volgorde, onInput:(id, w)=>{ antw[id] = w; wacht = true; status.textContent = 'Nog niet bewaard…'; clearTimeout(timer); timer = setTimeout(bewaar, 1200); } }));
    addEventListener('pagehide', bewaar); document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') bewaar(); });
    const balk = el('div', 'opdr-balk'); const knop = el('button', 'btn', 'Indienen'); knop.type = 'button';
    knop.onclick = async ()=>{
      const leeg = OPG.delen.flatMap(d=>d.vragen).filter(q=>{ const a = antw[q.id]; return OPG.volledig ? !OPG.volledig(q, a) : a == null || a === '' || (Array.isArray(a) && !a.length); }).length;
      if(!confirm((leeg ? `Je liet ${leeg} vraag${leeg > 1 ? 'en' : ''} open. ` : '') + (cfg.pogingen === 1 ? `Wil je je ${woord()} indienen? Daarna kan je niets meer wijzigen.` : `Wil je je ${woord()} indienen?`))) return;
      if(groepVoor(s.groepen, o, email)?.s !== 'open'){ alert(`Deze ${woord()} is intussen gesloten.`); location.reload(); return; }
      knop.disabled = true; clearTimeout(timer);
      const nu = Date.now();
      try{ await F.setDoc(ref, Object.assign(basis(), { ingediend:nu, op:F.serverTimestamp(), slot:cfg.pogingen === 1, poging:((inz && inz.poging) || 0) + 1 }), { merge:true });
        inz = Object.assign(inz || {}, { ingediend:nu, slot:cfg.pogingen === 1, poging:((inz && inz.poging) || 0) + 1 }); wacht = false; location.reload(); }
      catch(e){ console.warn(e); knop.disabled = false; status.textContent = 'Indienen lukte niet. Controleer je internetverbinding en probeer opnieuw.'; }
    };
    balk.append(knop, status); app.append(balk);
  }

  /* resultaat: enkel als de leerkracht het vrijgaf (anders weigert Firestore het lezen) */
  async function resultaat(inz){
    let r = null; try{ const d = await F.getDoc(F.doc(db, 'resultaten', docId(o, email))); r = d.exists() ? d.data() : null; }catch(e){}
    if(!r || !r.vrij){ app.append(el('p', 'mini', 'Je resultaat verschijnt hier zodra je leerkracht het vrijgeeft.')); return; }
    const k = kaart('Je resultaat', `<p class="opdr-score">${String(r.totaal).replace('.', ',')} / ${String(r.max).replace('.', ',')}${r.op && r.opPunten != null ? ` <span class="opdr-op">(${String(r.opPunten).replace('.', ',')} / ${r.op})</span>` : ''}</p>`); app.append(k);
    if(r.ziet === 'verbetering' && r.verbetering) app.append(tekenOpgave(OPG, { modus:'lezen', antw:(inz && inz.antw) || {}, volgorde:inz && inz.volgorde, verbetering:r.verbetering }));
  }
}
