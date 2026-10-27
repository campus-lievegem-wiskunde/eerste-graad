/* Een toets of taak tekenen: om in te vullen (leerling), om te lezen met de antwoorden en de verbetering (leerling na vrijgave,
   afdrukpagina), blanco (papieren versie) of met de verbetersleutel. Gebruikt door gedeeld/opdracht.js en dashboard/afdruk.js.
   window.OPGAVE in opgave.js van de opdracht:
   { id, inleiding?:html, delen:[ { titel?:html, vragen:[ { id, type, punten, vraag:html, ... } ] } ] }
   type getal (eenheid?) · tekst (eenheid?) · keuze (opties:[html]) · meer (opties:[html], meerdere juist) · open (regels?: aantal schrijflijnen)
   · eigen (interactief, rekenvaardigheden): invullen via OPGAVE.invullen, lezen via OPGAVE.toon(q, antwoord, modus, sleutel) → html;
   OPGAVE.codes = { CODE:{ label, uitleg } } geeft de foutcodes een naam; OPGAVE.css = stijlblad naast opgave.js; q.oefen = telt niet mee */
import { juistTekst } from './opdrachten.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const letter = i => String.fromCharCode(65 + i);
export const maxPunten = opg => Math.round(opg.delen.reduce((t, d)=>t + d.vragen.reduce((u, q)=>u + (q.oefen ? 0 : q.punten || 1), 0), 0) * 100) / 100;
const komma = x => String(x).replace('.', ',');

/* opts: { modus:'invullen'|'lezen'|'blanco'|'sleutel', antw, volgorde:[ids], verbetering:{ id:{ p, max, toon } }, sleutel, onInput(id, waarde) } */
export function tekenOpgave(opg, opts = {}){
  const modus = opts.modus || 'invullen', antw = opts.antw || {}, verb = opts.verbetering || null, sl = opts.sleutel && opts.sleutel.vragen;
  const wrap = document.createElement('div'); wrap.className = 'opgave modus-' + modus;
  if(opg.inleiding) wrap.insertAdjacentHTML('beforeend', `<div class="ov-inleiding">${opg.inleiding}</div>`);
  let nr = 0;
  opg.delen.forEach(d=>{
    const vragen = opts.volgorde ? [...d.vragen].sort((a, b)=>opts.volgorde.indexOf(a.id) - opts.volgorde.indexOf(b.id)) : d.vragen;
    const deel = document.createElement('section'); deel.className = 'ov-deel';
    if(d.titel) deel.insertAdjacentHTML('beforeend', `<h2 class="ov-deeltitel">${d.titel}</h2>`);
    vragen.forEach(q=>{
      nr++;
      const max = q.punten || 1, v = verb && verb[q.id], a = antw[q.id];
      const div = document.createElement('div'); div.className = 'ov'; div.dataset.id = q.id;
      const pt = q.oefen ? 'oefenvraag' : (v && v.p != null ? `${komma(v.p)}/${komma(max)}` : komma(max)) + ' p';
      div.innerHTML = `<div class="ov-kop"><span class="ov-nr">${nr}</span><div class="ov-vraag">${q.vraag}</div><span class="ov-pt">${pt}</span></div><div class="ov-antw"></div>`;
      if(q.type === 'eigen') div.classList.add('ov-eigen');
      const box = div.querySelector('.ov-antw');
      const geef = w => opts.onInput && opts.onInput(q.id, w);
      if(q.type === 'eigen') box.innerHTML = opg.toon ? opg.toon(q, a, modus, sl && sl[q.id]) : '';
      else if(modus === 'invullen'){
        if(q.type === 'getal' || q.type === 'tekst'){
          box.innerHTML = `<input class="inp ov-inp" type="text" autocomplete="off" spellcheck="false"${q.type === 'getal' ? ' inputmode="decimal"' : ''} aria-label="Antwoord vraag ${nr}">${q.eenheid ? ` <span class="ov-eenheid">${q.eenheid}</span>` : ''}`;
          const i = box.querySelector('input'); i.value = a == null ? '' : a; i.oninput = ()=>geef(i.value);
        } else if(q.type === 'keuze' || q.type === 'meer'){
          const typ = q.type === 'keuze' ? 'radio' : 'checkbox', gekozen = [].concat(a == null ? [] : a).map(Number);
          q.opties.forEach((o, i)=>{ const l = document.createElement('label'); l.className = 'ov-opt';
            l.innerHTML = `<input type="${typ}" name="ov_${q.id}" value="${i}"${gekozen.includes(i) ? ' checked' : ''}> <b>${letter(i)}</b> <span>${o}</span>`; box.append(l); });
          box.onchange = ()=>{ const x = [...box.querySelectorAll('input:checked')].map(i=>+i.value); geef(q.type === 'keuze' ? (x.length ? x[0] : null) : x); };
        } else {
          box.innerHTML = `<textarea class="ov-tekst" rows="${q.regels || 4}" aria-label="Antwoord vraag ${nr}"></textarea>`;
          const t = box.querySelector('textarea'); t.value = a == null ? '' : a; t.oninput = ()=>geef(t.value);
        }
      } else {
        const toon = modus === 'blanco' ? null : modus === 'sleutel' ? 'sleutel' : 'antw';
        const k = sl && sl[q.id];
        if(q.type === 'getal' || q.type === 'tekst'){
          const w = toon === 'antw' ? esc(a) : toon === 'sleutel' ? esc(juistTekst(q, k)) : '';
          box.innerHTML = `<span class="ov-lijn">${w || '&nbsp;'}</span>${q.eenheid ? ` <span class="ov-eenheid">${q.eenheid}</span>` : ''}`;
        } else if(q.type === 'keuze' || q.type === 'meer'){
          const gekozen = toon === 'antw' ? [].concat(a == null ? [] : a).map(Number) : toon === 'sleutel' && k ? [].concat(k.juist).map(Number) : [];
          q.opties.forEach((o, i)=>box.insertAdjacentHTML('beforeend', `<div class="ov-opt"><span class="ov-vak${gekozen.includes(i) ? ' aan' : ''}" aria-label="${gekozen.includes(i) ? 'aangeduid' : 'niet aangeduid'}"></span> <b>${letter(i)}</b> <span>${o}</span></div>`));
        } else {
          const w = toon === 'antw' ? esc(a) : toon === 'sleutel' && k ? esc(k.toon || '') : '';
          box.innerHTML = `<div class="ov-open" style="min-height:${(q.regels || 4) * 1.9}em">${w}</div>`;
        }
      }
      if(v || (modus === 'sleutel' && q.type === 'open' && sl && sl[q.id] && sl[q.id].richtlijn)){
        const ok = v && v.p != null && v.p >= max, half = v && v.p > 0 && v.p < max;
        const r = document.createElement('div'); r.className = 'ov-verb ' + (!v ? '' : v.p == null ? 'nog' : ok ? 'ok' : half ? 'half' : 'fout');
        r.innerHTML = !v ? `<b>Richtlijn:</b> ${esc(sl[q.id].richtlijn)}`
          : v.p == null ? 'Nog niet verbeterd.'
          : (ok ? '<b>✓ Juist</b>' : `<b>${half ? '½ Deels juist' : '✗ Niet juist'}</b>${v.toon ? ` · juist antwoord: <span class="ov-juist">${esc(v.toon)}</span>` : ''}`) + (v.opm ? `<br><i>${esc(v.opm)}</i>` : '')
            + (v.codes && v.codes.length ? `<br><span class="ov-codes">Foutcodes: ${v.codes.map(c=>`<span title="${esc(((opg.codes || {})[c] || {}).uitleg || '')}">${esc(((opg.codes || {})[c] || {}).label || c)}</span>`).join(' · ')}</span>` : '');
        div.append(r);
      }
      deel.append(div);
    });
    wrap.append(deel);
  });
  return wrap;
}

/* opgave.js van een opdracht laden (dashboard, afdrukpagina): het script zet window.OPGAVE */
const OPGAVEN = {};
export function laadOpgave(url){
  if(!OPGAVEN[url]) OPGAVEN[url] = new Promise((ok, nok)=>{
    const s = document.createElement('script'); s.src = url;
    s.onload = ()=>{ const o = window.OPGAVE; delete window.OPGAVE; if(!o) return nok(new Error('geen OPGAVE in ' + url));
      if(o.css){ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL(o.css, url).href; document.head.append(l); }
      ok(o); };
    s.onerror = ()=>nok(new Error('niet gevonden: ' + url)); document.head.append(s);
  });
  return OPGAVEN[url];
}
