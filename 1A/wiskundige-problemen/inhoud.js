(function(){
/* ============================================================
   1A Wiskundige problemen · Heuristieken
   Gebouwd met build.sh uit de bronbestanden in 1A-wiskundige-problemen/bron/.
   Pas de bron aan, niet dit bestand.
   ============================================================ */
const PREFIX = (document.body.dataset.prefix) || '1a_wp_heur_v1_';
const CLres   = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };

/* ---------- kleine hulpjes ---------- */
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const knop = (cls, html, fn) => { const b = el('button', cls, html); b.type = 'button'; if(fn) b.addEventListener('click', fn); return b; };
const lees = k => { try{ return JSON.parse(localStorage.getItem(PREFIX + k) || 'null'); }catch(e){ return null; } };
const bewaar = (k, v) => { try{ localStorage.setItem(PREFIX + k, JSON.stringify(v)); }catch(e){} };
const wis = k => { try{ localStorage.removeItem(PREFIX + k); }catch(e){} };
const nieuwZaad = () => Math.floor(Math.random() * 2147483646) + 1;

/* toevalsgetallen uit een zaadgetal: dezelfde opgave komt terug na het herladen */
function RNG(seed){
  let h = seed >>> 0;
  const r = () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = {
    r,
    int:(a, b) => a + Math.floor(r() * (b - a + 1)),
    pick:a => a[Math.floor(r() * a.length)],
    shuffle:a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; },
    kies:(a, n) => R.shuffle(a).slice(0, n),
    naam:() => R.pick(NAMEN),
    namen:n => R.kies(NAMEN, n),
    jongen:() => R.pick(JONGENS), meisje:() => R.pick(MEISJES)
  };
  return R;
}
const MEISJES = ['Lien','Noor','Fien','Lotte','Jana','Elise','Febe','Marie','Amber','Lore','Hanne','Yana','Saar','Mila','Nina','Ella','Ines','Zoë','Lina','Aya'];
const JONGENS = ['Arne','Wout','Lars','Seppe','Jonas','Milan','Rune','Kobe','Senne','Jasper','Thibo','Lucas','Mats','Bram','Ferre','Vic','Adam','Nand','Robbe','Emiel'];
const NAMEN = MEISJES.concat(JONGENS);

/* ---------- getallen schrijven (Vlaamse notatie) ---------- */
const nf = x => {
  if(typeof x !== 'number') return String(x);
  const neg = x < 0; let s = Math.abs(Math.round(x * 1000) / 1000).toString();
  let [g, d] = s.split('.'); if(g.length > 4) g = g.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '−' : '') + g + (d ? ',' + d : '');
};
const ggd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while(b){ [a, b] = [b, a % b]; } return a; };
const kgv = (a, b) => a / ggd(a, b) * b;
/* breuk als HTML (teller boven noemer) */
const br = (t, n) => `<span class="breuk"><span>${t}</span><span>${n}</span></span>`;
const brV = (t, n) => { const g = ggd(t, n); return [t / g, n / g]; };
const uur = m => { m = ((m % 1440) + 1440) % 1440; return Math.floor(m / 60) + '.' + String(m % 60).padStart(2, '0') + ' uur'; };

/* ---------- antwoordmogelijkheden A tot E ----------
   opties(juist, kandidaten, {fmt, sorteer}) geeft { keuzes:[5 teksten], juist:index }.
   Kandidaten zijn typische fouten; ontbreken er, dan vult de functie aan met getallen in de buurt. */
function opties(R, juist, kand, o = {}){
  const fmt = o.fmt || nf, num = typeof juist === 'number';
  const zelfde = (a, b) => num ? Math.abs(a - b) < 1e-9 : String(a) === String(b);
  const lijst = [juist];
  for(const k of kand){ if(lijst.length >= 5) break; if(k == null || (num && (!isFinite(k) || (o.min != null && k < o.min) || (o.geheel !== false && Math.round(k) !== k)))) continue; if(!lijst.some(x=>zelfde(x, k))) lijst.push(k); }
  if(num){ const stap = o.stap || 1; let d = 1; while(lijst.length < 5 && d < 200){ for(const k of [juist + d * stap, juist - d * stap]){ if(lijst.length < 5 && (o.min == null || k >= o.min) && k >= 0 && !lijst.some(x=>zelfde(x, k))) lijst.push(k); } d++; } }
  const volg = num && o.sorteer !== false ? lijst.slice().sort((a, b)=>a - b) : (o.vast ? lijst : R.shuffle(lijst));
  return { keuzes:volg.map(fmt), juist:volg.findIndex(x=>zelfde(x, juist)), waarde:juist };
}
/* vaste lijst van vijf teksten waarvan index j juist is */
const vast = (lijst, j) => ({ keuzes:lijst, juist:j, waarde:lijst[j] });

/* ---------- SVG-hulpjes ---------- */
const svg = (w, h, inner, o = {}) => `<svg class="hfig${o.cls ? ' ' + o.cls : ''}" viewBox="0 0 ${w} ${h}" width="${o.b || w}" role="img" aria-label="${o.label || 'figuur'}">${inner}</svg>`;
const lijn = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w || 2}"${o.d ? ` stroke-dasharray="${o.d}"` : ''}${o.cls ? ` class="${o.cls}"` : ''}${o.st ? ` style="${o.st}"` : ''}/>`;
const rh = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.f || 'none'}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w == null ? 2 : o.w}"${o.rx ? ` rx="${o.rx}"` : ''}${o.cls ? ` class="${o.cls}"` : ''}${o.st ? ` style="${o.st}"` : ''}/>`;
const cirkel = (x, y, r, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.f || 'none'}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w == null ? 2 : o.w}"${o.cls ? ` class="${o.cls}"` : ''}${o.st ? ` style="${o.st}"` : ''}/>`;
const tekst = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 15}" text-anchor="${o.a || 'middle'}" fill="${o.f || 'var(--ink)'}" font-weight="${o.wt || 700}"${o.cls ? ` class="${o.cls}"` : ''}${o.st ? ` style="${o.st}"` : ''} dominant-baseline="middle">${t}</text>`;
const veelhoek = (pts, o = {}) => `<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${o.f || 'none'}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w == null ? 2 : o.w}"${o.cls ? ` class="${o.cls}"` : ''}${o.st ? ` style="${o.st}"` : ''} stroke-linejoin="round"/>`;
const pad = (d, o = {}) => `<path d="${d}" fill="${o.f || 'none'}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w == null ? 2 : o.w}"${o.d ? ` stroke-dasharray="${o.d}"` : ''}${o.cls ? ` class="${o.cls}"` : ''}${o.st ? ` style="${o.st}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
/* maatlijn met tekst ertussen */
function maat(x1, y1, x2, y2, t, o = {}){
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, hor = Math.abs(y2 - y1) < Math.abs(x2 - x1);
  const off = o.off || 14, tx = hor ? mx : mx + (o.links ? -off : off) * 1.6, ty = hor ? my + (o.boven ? -off : off) : my;
  return lijn(x1, y1, x2, y2, { k:'var(--accent-dark)', w:1.5 }) + (hor ? lijn(x1, y1 - 5, x1, y1 + 5, { k:'var(--accent-dark)', w:1.5 }) + lijn(x2, y2 - 5, x2, y2 + 5, { k:'var(--accent-dark)', w:1.5 })
    : lijn(x1 - 5, y1, x1 + 5, y1, { k:'var(--accent-dark)', w:1.5 }) + lijn(x2 - 5, y2, x2 + 5, y2, { k:'var(--accent-dark)', w:1.5 })) + tekst(tx, ty, t, { s:o.s || 14, f:'var(--accent-dark)' });
}

/* ---------- de zes heuristieken ---------- */
const HEUR = {
  schets:{ naam:'een schets maken', kort:'Een schets', ic:'schets', zin:'Teken wat er gegeven is. Een figuur toont vaak meteen wat je moet tellen of berekenen.' },
  vereenv:{ naam:'vereenvoudigen van het probleem', kort:'Vereenvoudigen', ic:'vereenv', zin:'Maak het probleem kleiner of eenvoudiger: kleinere getallen, stukjes verschuiven of wegstrepen.' },
  uitpr:{ naam:'uitproberen van verschillende oplossingen', kort:'Uitproberen', ic:'uitpr', zin:'Probeer een mogelijkheid (bv. een antwoordkeuze), controleer ze en stuur bij.' },
  patroon:{ naam:'een patroon zoeken', kort:'Patroon zoeken', ic:'patroon', zin:'Schrijf de eerste stappen uit, zoek wat zich herhaalt of hoe het groeit, en gebruik dat.' },
  terug:{ naam:'achterwaarts werken', kort:'Achterwaarts werken', ic:'terug', zin:'Je kent het einde. Begin daar en doe elke stap omgekeerd tot je bij het begin bent.' },
  tellen:{ naam:'systematisch tellen', kort:'Systematisch tellen', ic:'tellen', zin:'Schrijf alle mogelijkheden ordelijk op, in een lijst of een tabel, zodat je er geen vergeet of dubbel telt.' }
};
const HEUR_IDS = Object.keys(HEUR);

/* ---------- de vragenpool ----------
   T({ id, h, niv, bron, maak(R) }) met h = heuristiek (of 'mix'), niv 1 = instap, 2 = oefenen, 3 = verdieping.
   maak(R) geeft { tekst, fig, mc:{keuzes, juist} of getal, eenheid, hint:[stappen], uitw:{begrijpen, plannen, uitvoeren, terugkijken}, heur:[...] } */
const POOL = [];
const T = def => { POOL.push(def); return def; };
const poolVan = (h, nivs) => POOL.filter(t=>t.h === h && nivs.includes(t.niv));

/* ============================================================
   MOTOR: één vraag tonen, oefenen (adaptief), testjes, uitgewerkt voorbeeld
   ============================================================ */
const FASEN = { begrijpen:'begrijpen', plannen:'plannen', uitvoeren:'uitvoeren', terugkijken:'terugkijken' };
const FASE_NR = { begrijpen:1, plannen:2, uitvoeren:3, terugkijken:4 };
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const faseLabel = f => `<span class="fase"><span class="fnr">${FASE_NR[f] || ''}</span>${FASEN[f] || f}</span>`;

/* een vraag uit een sjabloon maken */
function maakVraag(tid, seed){
  const t = POOL.find(x=>x.id === tid); if(!t) return null;
  const q = t.maak(RNG(seed));
  q.id = t.id; q.h = t.h; q.niv = t.niv; q.bron = t.bron || q.bron || '';
  if(!q.heur) q.heur = t.h === 'mix' ? [] : [t.h];
  return q;
}
/* tolerant een getal lezen: komma of punt, spaties, een minteken */
function leesGetal(s){
  s = String(s || '').trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(',', '.');
  if(/^-?\d+\/\d+$/.test(s)){ const [a, b] = s.split('/').map(Number); return b ? a / b : NaN; }
  if(!/^-?\d*\.?\d+$/.test(s)) return NaN;
  return Number(s);
}
const zelfdeAntw = (inv, ans) => {
  if(Array.isArray(ans)) return ans.some(a=>zelfdeAntw(inv, a));
  if(typeof ans === 'number'){ const x = leesGetal(inv); return isFinite(x) && Math.abs(x - ans) < 1e-6; }
  const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').replace(/[.!]$/, '').trim();
  return norm(inv) === norm(ans);
};
const antwTekst = q => q.mc ? `${LETTERS[q.mc.juist]} ${q.mc.keuzes[q.mc.juist]}` : nf(q.getal) + (q.eenheid ? ' ' + q.eenheid : '');

/* ---------- invulbare hint: de tussenstappen volgens de vier stappen ---------- */
function hintBlok(q){
  const box = el('div', 'hv-hint');
  box.append(el('p', 'hv-hint-kop', '💡 <b>Hint</b>: los het stap voor stap op. Controleer elke stap apart.'));
  (q.hint || []).forEach((s, i)=>{
    const r = el('div', 'hstap');
    r.append(el('div', 'hstap-kop', faseLabel(s.fase || 'uitvoeren')));
    const inh = el('div', 'hstap-inh');
    inh.append(el('div', 'hstap-v', s.vraag));
    if(s.ans != null){
      const rij = el('div', 'hstap-rij');
      const inp = el('input', 'inp xs'); inp.setAttribute('aria-label', 'antwoord stap ' + (i + 1)); inp.autocomplete = 'off';
      if(typeof s.ans !== 'number' && !(Array.isArray(s.ans) && typeof s.ans[0] === 'number')) inp.classList.replace('xs', 'mid');
      const fb = el('span', 'fb');
      const ctl = ()=>{ const ok = zelfdeAntw(inp.value, s.ans); inp.classList.toggle('ok', ok); inp.classList.toggle('bad', !ok); fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.textContent = ok ? 'Juist!' : 'Nog niet juist.'; };
      inp.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); ctl(); } });
      rij.append(inp); if(s.eenheid) rij.append(el('span', 'eenh', s.eenheid));
      rij.append(knop('btn ghost klein-btn', 'Controleer', ctl), fb);
      inh.append(rij);
    }
    if(s.meer){
      const m = el('div', 'meer', s.meer); m.hidden = true;
      inh.append(knop('linkbtn meer-btn', '🔍 Meer uitleg', ()=>{ m.hidden = !m.hidden; }), m);
    }
    r.append(inh); box.append(r);
  });
  return box;
}
/* de uitwerking in vier stappen (.sol: bord.js toont ze stap voor stap) */
function uitwBlok(q){
  const u = q.uitw || {}, box = el('div', 'hv-uitw'); box.hidden = true;
  box.append(el('p', 'hv-uitw-kop', '<b>Uitwerking</b>'));
  ['begrijpen', 'plannen', 'uitvoeren', 'terugkijken'].forEach(f=>{ if(!u[f]) return; const s = el('div', 'sol', faseLabel(f) + `<div class="sol-inh">${u[f]}</div>`); box.append(s); });
  return box;
}

/* ---------- één vraag tonen ----------
   o.modus: 'oefen' (controleren, hint), 'test' (enkel kiezen), 'kijk' (na het verbeteren)
   o.kies: eerst de heuristiek(en) laten aanvinken (Door elkaar)
   o.st: bewaarde toestand {ant, heur}; o.save(); o.opControle(ok) */
function vraagBlok(q, o){
  const st = o.st || {}; const wrap = el('div', 'hv-wrap');
  const hv = el('div', 'hv' + (q.fig ? ' met-fig' : ''));
  if(q.fig){ const f = el('div', 'hv-fig', q.fig); hv.append(f); }
  const m = el('div', 'hv-main'); hv.append(m);
  m.append(el('div', 'hv-tekst', q.tekst));
  if(q.bron) m.append(el('p', 'hv-bron', 'naar een idee van ' + q.bron));
  /* heuristieken kiezen */
  let kiesBox = null;
  if(o.kies){
    st.heur = st.heur || [];
    kiesBox = el('div', 'hv-kies');
    kiesBox.append(el('p', 'hv-kies-v', '<b>Welke heuristiek gebruik je?</b> Vink er minstens één aan.'));
    const rij = el('div', 'kies-rij');
    HEUR_IDS.forEach(h=>{
      const b = knop('chip kies-chip' + (st.heur.includes(h) ? ' aan' : ''), `<span class="vk" aria-hidden="true"></span>${HEUR[h].kort}`, ()=>{
        if(st.klaar) return;
        const i = st.heur.indexOf(h); if(i >= 0) st.heur.splice(i, 1); else st.heur.push(h);
        b.classList.toggle('aan', i < 0); b.setAttribute('aria-pressed', String(i < 0)); o.save && o.save(); slot();
      });
      b.setAttribute('aria-pressed', String(st.heur.includes(h))); rij.append(b);
    });
    kiesBox.append(rij); m.append(kiesBox);
  }
  /* antwoord */
  const antw = el('div', 'hv-antw');
  let opts = [], inp = null;
  if(q.mc){
    const ch = el('div', 'choices hv-keuzes' + (q.mc.keuzes.some(k=>String(k).replace(/<[^>]+>/g, '').length > 14) ? ' lang' : ''));
    q.mc.keuzes.forEach((k, i)=>{
      const b = knop('opt hv-opt', `<b class="lt">${LETTERS[i]}</b><span class="kz">${k}</span>`, ()=>{
        if(st.klaar || o.modus === 'kijk' || antw.classList.contains('dicht')) return;
        st.ant = i; opts.forEach((x, j)=>x.classList.toggle('chosen', j === i)); o.save && o.save(); if(fb) fb.textContent = '';
      });
      if(st.ant === i) b.classList.add('chosen');
      opts.push(b); ch.append(b);
    });
    antw.append(ch);
  } else {
    const rij = el('div', 'hv-invul');
    inp = el('input', 'inp xs'); inp.setAttribute('aria-label', 'jouw antwoord'); inp.autocomplete = 'off'; inp.inputMode = 'decimal';
    if(st.ant != null) inp.value = st.ant;
    inp.addEventListener('input', ()=>{ st.ant = inp.value; o.save && o.save(); });
    rij.append(el('span', 'hv-antw-lbl', 'Antwoord:'), inp); if(q.eenheid) rij.append(el('span', 'eenh', q.eenheid));
    antw.append(rij);
  }
  m.append(antw);
  const act = el('div', 'q-act'), fb = el('div', 'fb');
  let hintBox = null;
  if(o.modus === 'oefen'){
    const cb = knop('btn', 'Controleer', ()=>controle());
    act.append(cb);
    if(q.hint && q.hint.length && !o.geenHint){
      hintBox = hintBlok(q); hintBox.hidden = !st.hint;
      act.append(knop('btn ghost hint-btn', '💡 Hint', ()=>{ hintBox.hidden = !hintBox.hidden; st.hint = !hintBox.hidden; o.save && o.save(); }));
    }
    if(inp) inp.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); controle(); } });
    m.append(act, fb); if(hintBox) m.append(hintBox);
  }
  wrap.append(hv);
  const uw = uitwBlok(q); wrap.append(uw);
  const uwKnop = knop('btn ghost uitw-btn', 'Bekijk de uitwerking', ()=>{ uw.hidden = !uw.hidden; uwKnop.textContent = uw.hidden ? 'Bekijk de uitwerking' : 'Verberg de uitwerking'; });
  uwKnop.hidden = true;
  const heurNa = el('div', 'hv-heurna'); heurNa.hidden = true;

  function slot(){
    const dicht = o.kies && !(st.heur && st.heur.length) && !st.klaar;
    antw.classList.toggle('dicht', !!dicht); if(inp) inp.disabled = !!dicht || !!st.klaar;
    act.querySelectorAll('button').forEach(b=>{ if(!b.classList.contains('hint-btn')) b.disabled = !!dicht || !!st.klaar; });
    if(dicht) antw.title = 'Vink eerst een heuristiek aan.'; else antw.removeAttribute('title');
  }
  function juistIs(){ return q.mc ? st.ant === q.mc.juist : (st.ant != null && isFinite(leesGetal(st.ant)) && Math.abs(leesGetal(st.ant) - q.getal) < 1e-6); }
  function controle(){
    if(st.klaar) return;
    if(st.ant == null || st.ant === ''){ fb.className = 'fb bad'; fb.textContent = q.mc ? 'Kies eerst een antwoord.' : 'Vul eerst een antwoord in.'; return; }
    if(!q.mc && !isFinite(leesGetal(st.ant))){ fb.className = 'fb bad'; fb.textContent = 'Typ een getal, bijvoorbeeld 12 of 7,5.'; return; }
    const ok = juistIs(); st.pog = (st.pog || 0) + 1;
    if(ok || st.pog >= 2){ st.klaar = true; st.ok = ok; }
    o.opControle && o.opControle(ok, st.klaar);
    o.save && o.save(); toon();
  }
  /* toestand tonen na een controle (ook na het herladen) */
  function toon(){
    if(o.modus === 'oefen'){
      if(st.klaar){
        fb.className = 'fb ' + (st.ok ? 'ok' : 'bad');
        fb.innerHTML = st.ok ? 'Juist!' + (st.pog > 1 ? ' Goed verbeterd.' : '') : `Nog niet juist. Het juiste antwoord is <b>${antwTekst(q)}</b>. Bekijk de uitwerking.`;
        markeer(); act.hidden = true; if(hintBox) hintBox.hidden = true; uwKnop.hidden = false; if(!st.ok){ uw.hidden = false; uwKnop.textContent = 'Verberg de uitwerking'; }
        heurUitleg();
      } else if(st.pog){
        fb.className = 'fb bad'; fb.innerHTML = 'Nog niet juist. Probeer opnieuw' + (q.hint && q.hint.length ? ' of klik op <b>💡 Hint</b>.' : '.');
        if(inp) inp.classList.add('bad');
      }
    }
    if(o.modus === 'kijk'){ markeer(); uwKnop.hidden = false; heurUitleg(); }
    slot();
  }
  function markeer(){
    if(q.mc){ opts.forEach((b, j)=>{ b.disabled = true; b.classList.toggle('chosen', j === st.ant || j === q.mc.juist); b.classList.toggle('good', j === q.mc.juist); b.classList.toggle('wrong', j === st.ant && j !== q.mc.juist); }); }
    else if(inp){ inp.disabled = true; const ok = juistIs(); inp.classList.toggle('ok', ok); inp.classList.toggle('bad', !ok); }
  }
  function heurUitleg(){
    if(!o.kies || !q.heur || !q.heur.length) return;
    const gek = st.heur || [];
    heurNa.innerHTML = `<b>Handig bij deze vraag:</b> ${q.heur.map(h=>HEUR[h].naam + (gek.includes(h) ? ' <span class="vinkje">✓ jij koos dit ook</span>' : '')).join(' · ')}.` +
      (gek.some(h=>!q.heur.includes(h)) ? ` <span class="klein">Een andere aanpak mag ook, als ze tot het juiste antwoord leidt.</span>` : '');
    heurNa.hidden = false;
  }
  m.append(heurNa);
  const onder = el('div', 'hv-onder'); onder.append(uwKnop); m.append(onder);
  toon();
  return { el:wrap, onder, juistIs, st };
}

/* ---------- oefenen: één vraag per keer, adaptief ----------
   kind 'oef': niveau 1 (instap) en 2 (moeilijker); na 2 keer na elkaar juist van de eerste keer gaat het een niveau hoger,
   na 2 keer na elkaar fout een niveau lager. kind 'verd': de verdiepingsvragen (niveau 3), zonder hint. */
function oefenPaneel(secId, h, kind, opts = {}){
  const key = `oef_${secId}_${kind}`, pane = el('div', 'oefen');
  const pool = lvl => kind === 'verd' ? poolVan(h, [3]) : (poolVan(h, [lvl]).length ? poolVan(h, [lvl]) : poolVan(h, [1, 2]));
  function nieuw(st){
    const p = pool(st.lvl), recent = st.hist.slice(-Math.min(4, p.length - 1));
    const kand = p.filter(t=>!recent.includes(t.id));
    const t = (kand.length ? kand : p)[Math.floor(Math.random() * (kand.length ? kand.length : p.length))];
    st.cur = { tid:t.id, seed:nieuwZaad() }; st.v = {}; st.hist.push(t.id); if(st.hist.length > 12) st.hist.shift();
  }
  function teken(){
    pane.innerHTML = '';
    let st = lees(key);
    if(!st || !st.cur || !POOL.find(t=>t.id === st.cur.tid)){ st = { lvl:1, reeks:0, foutreeks:0, n:0, j:0, hist:[] }; nieuw(st); bewaar(key, st); }
    const q = maakVraag(st.cur.tid, st.cur.seed);
    const card = el('div', 'card hcard');
    const lbl = kind === 'verd' ? 'Verdieping' : (st.lvl === 1 ? 'Instap' : 'Moeilijker');
    const head = el('div', 'card-head', `<h3>Vraag ${st.n + 1} <span class="lvl-tag l${kind === 'verd' ? 3 : st.lvl}">${lbl}</span></h3>`);
    const rb = knop('refresh-btn', '↻ Andere vraag', ()=>{ const s = lees(key) || st; if(!s.v || !s.v.klaar) nieuw(s); bewaar(key, s); teken(); });
    rb.title = 'Sla deze vraag over en krijg een andere';
    head.append(rb); card.append(head);
    if(st.melding){ card.append(el('div', 'hv-melding', st.melding)); }
    const vb = vraagBlok(q, { modus:'oefen', kies:opts.kies, geenHint:kind === 'verd', st:st.v, save:()=>bewaar(key, st),
      opControle:(ok, klaar)=>{
        CLres(`${secId}_${q.id}`, ok);
        if(!klaar) return;
        st.n++; if(ok) st.j++;
        st.melding = '';
        if(kind !== 'verd'){
          if(ok && st.v.pog === 1){ st.reeks++; st.foutreeks = 0; } else if(!ok){ st.foutreeks++; st.reeks = 0; } else { st.reeks = 0; st.foutreeks = 0; }
          if(st.lvl === 1 && st.reeks >= 2 && poolVan(h, [2]).length){ st.lvl = 2; st.reeks = 0; st.melding = '👍 Goed bezig! De volgende vragen zijn moeilijker.'; }
          else if(st.lvl === 2 && st.foutreeks >= 2){ st.lvl = 1; st.foutreeks = 0; st.melding = 'De volgende vragen zijn weer wat eenvoudiger. Gebruik gerust de hint.'; }
        }
        volg.hidden = false;
      } });
    card.append(vb.el);
    const volg = knop('btn volg-btn', 'Volgende vraag →', ()=>{ nieuw(st); bewaar(key, st); teken(); pane.scrollIntoView({ block:'nearest' }); });
    volg.hidden = !(st.v && st.v.klaar);
    vb.onder.append(volg);
    pane.append(card);
    pane.append(el('p', 'oef-tel klein', st.n ? `Deze reeks: <b>${st.j}</b> van de ${st.n} vragen juist.` : (kind === 'verd' ? 'Verdieping is moeilijker en heeft geen hints. Probeer deze vragen als je <b>Oefenen</b> goed kan.' : 'Je begint met instapvragen. Lukt het, dan worden ze moeilijker.')));
  }
  teken();
  return pane;
}

/* ---------- testje: n vragen, verbeteren pas op het einde ---------- */
function testPaneel(secId, kiesItems, n, toetsKey, titel){
  const key = 'test_' + secId, pane = el('div', 'testje');
  const niveau = r => r >= .9 ? 'prima' : r >= .7 ? 'goed' : r >= .5 ? 'voldoende' : 'nog niet voldoende';
  function teken(){
    pane.innerHTML = '';
    let st = lees(key);
    if(!st || !st.items || st.items.some(it=>!POOL.find(t=>t.id === it.tid))){ st = { items:kiesItems(), ant:{}, klaar:false }; bewaar(key, st); }
    const intro = el('div', 'tip', `<div><b>${titel}</b>: ${st.items.length} vragen. Je krijgt geen hints en je ziet pas of je antwoorden juist zijn na <b>Verbeter mijn testje</b>. Opnieuw maken mag: je krijgt dan nieuwe vragen en je laatste poging telt.</div>`);
    pane.append(intro);
    const blokken = st.items.map((it, i)=>{
      const q = maakVraag(it.tid, it.seed); st.ant[i] = st.ant[i] || {};
      const card = el('div', 'card hcard');
      card.append(el('div', 'card-head', `<h3>Vraag ${i + 1} van ${st.items.length}</h3>`));
      const vb = vraagBlok(q, { modus:st.klaar ? 'kijk' : 'test', st:st.ant[i], save:()=>bewaar(key, st) });
      card.append(vb.el); pane.append(card);
      if(st.klaar){ card.classList.add(vb.juistIs() ? 'k-ok' : 'k-bad'); card.querySelector('.card-head').append(el('span', 'k-mark ' + (vb.juistIs() ? 'ok' : 'bad'), vb.juistIs() ? '✓ juist' : `✗ juist was ${antwTekst(q)}`)); }
      return { q, vb };
    });
    const act = el('div', 'test-act'), fb = el('div', 'fb');
    if(!st.klaar){
      act.append(knop('btn big', 'Verbeter mijn testje', ()=>{
        const leeg = blokken.filter((b, i)=>st.ant[i].ant == null || st.ant[i].ant === '').length;
        if(leeg && !act.dataset.zeker){ act.dataset.zeker = '1'; fb.className = 'fb bad'; fb.textContent = `Je hebt nog ${leeg === 1 ? 'één vraag' : leeg + ' vragen'} niet beantwoord. Klik nog eens om toch te verbeteren.`; return; }
        const score = blokken.filter(b=>b.vb.juistIs()).length;
        st.klaar = true; st.score = score; bewaar(key, st); CLtoets(toetsKey, score, blokken.length); teken();
        pane.scrollIntoView({ block:'start', behavior:'smooth' });
      }), fb);
    } else {
      const r = st.score / st.items.length;
      const sc = el('div', 'score test-score', `<div class="big">${st.score}/${st.items.length}</div><div>Niveau: <b>${niveau(r)}</b>${r < 1 ? '. Bekijk bij elke fout de uitwerking.' : '. Knap gedaan!'}</div>`);
      pane.prepend(sc);
      act.append(knop('btn big', 'Maak een nieuw testje', ()=>{ wis(key); teken(); pane.scrollIntoView({ block:'start' }); }));
    }
    pane.append(act);
  }
  teken();
  return pane;
}
/* testje van een heuristiek: 3 verschillende sjablonen, één instap en twee moeilijkere */
const kiesTestHeur = h => () => {
  const n1 = poolVan(h, [1]), n2 = poolVan(h, [2]); const R = RNG(nieuwZaad());
  const lijst = R.kies(n1, 1).concat(R.kies(n2, 2));
  while(lijst.length < 3){ const t = R.pick(n1.concat(n2)); if(!lijst.includes(t)) lijst.push(t); }
  return lijst.map(t=>({ tid:t.id, seed:nieuwZaad() }));
};
/* eindtestje: 5 vragen uit Door elkaar, elk met een andere hoofdheuristiek */
const kiesTestMix = () => {
  const R = RNG(nieuwZaad()), kand = R.shuffle(poolVan('mix', [1, 2])), lijst = [], gebruikt = new Set();
  for(const t of kand){ if(lijst.length >= 5) break; const hh = t.hoofd; if(gebruikt.has(hh)) continue; gebruikt.add(hh); lijst.push(t); }
  for(const t of kand){ if(lijst.length >= 5) break; if(!lijst.includes(t)) lijst.push(t); }
  return lijst.map(t=>({ tid:t.id, seed:nieuwZaad() }));
};

/* ---------- uitgewerkt voorbeeld: de vier stappen één voor één, met een vraagje per stap ----------
   vb = { titel, tekst, fig, keuzes?, stappen:[{ fase, tekst, vraag, ans, eenheid, fig }], slot } */
function voorbeeldPaneel(secId, vb){
  const key = 'vb_' + secId, pane = el('div', 'voorbeeld');
  function teken(){
    pane.innerHTML = '';
    const st = lees(key) || { stap:0, ok:{} };
    const card = el('div', 'card hcard vb-opgave');
    const head = el('div', 'card-head', `<h3>Uitgewerkt voorbeeld · ${vb.titel}</h3>`);
    head.append(knop('refresh-btn', '↺ Opnieuw beginnen', ()=>{ wis(key); teken(); }));
    card.append(head);
    const hv = el('div', 'hv' + (vb.fig ? ' met-fig' : ''));
    if(vb.fig) hv.append(el('div', 'hv-fig', vb.fig));
    const m = el('div', 'hv-main'); m.append(el('div', 'hv-tekst', vb.tekst));
    if(vb.keuzes) m.append(el('div', 'choices hv-keuzes vb-keuzes', vb.keuzes.map((k, i)=>`<span class="opt hv-opt"><b class="lt">${LETTERS[i]}</b><span class="kz">${k}</span></span>`).join('')));
    hv.append(m); card.append(hv);
    pane.append(card);
    vb.stappen.forEach((s, i)=>{
      if(i > st.stap) return;
      const blok = el('div', 'card vb-stap');
      blok.append(el('div', 'vb-stap-kop', faseLabel(s.fase)));
      const inh = el('div', 'vb-stap-grid' + (s.fig ? ' met-fig' : ''));
      const tx = el('div', 'vb-tekst', s.tekst);
      inh.append(tx);
      if(s.fig){ const f = el('div', 'vb-fig', s.fig); inh.append(f);
        if(/class="[^"]*anim/.test(s.fig)){ const her = knop('linkbtn her-btn', '↻ Opnieuw afspelen', ()=>{ f.innerHTML = ''; requestAnimationFrame(()=>{ f.innerHTML = s.fig; f.append(her); }); }); f.append(her); } }
      blok.append(inh);
      if(s.vraag){
        const v = el('div', 'vb-vraag');
        v.append(el('div', 'vb-v', '✏️ ' + s.vraag));
        const rij = el('div', 'hstap-rij');
        const inp = el('input', 'inp xs'); inp.setAttribute('aria-label', 'antwoord'); inp.autocomplete = 'off';
        if(typeof s.ans === 'string' || (Array.isArray(s.ans) && typeof s.ans[0] === 'string')) inp.classList.replace('xs', 'mid');
        const fb = el('span', 'fb');
        const verder = knop('btn volg-btn', i < vb.stappen.length - 1 ? '▶ Volgende stap' : '✓ Klaar', ()=>{ if(i < vb.stappen.length - 1){ st.stap = Math.max(st.stap, i + 1); bewaar(key, st); teken(); const n = pane.querySelectorAll('.vb-stap')[i + 1]; if(n) n.scrollIntoView({ block:'nearest', behavior:'smooth' }); } else { st.af = true; bewaar(key, st); teken(); } });
        const toonA = knop('linkbtn', 'Toon het antwoord', ()=>{ inp.value = Array.isArray(s.ans) ? s.ans[0] : s.ans; st.ok[i] = 1; bewaar(key, st); klaarStap(); });
        const klaarStap = ()=>{ inp.classList.add('ok'); fb.className = 'fb ok'; fb.textContent = 'Juist!'; inp.disabled = true; toonA.hidden = true; verder.hidden = (i < st.stap) || (st.af && i === vb.stappen.length - 1); if(s.na) na.hidden = false; };
        const ctl = ()=>{ if(zelfdeAntw(inp.value, s.ans)){ st.ok[i] = 1; bewaar(key, st); klaarStap(); } else { inp.classList.add('bad'); fb.className = 'fb bad'; fb.textContent = s.tip ? 'Nog niet juist. ' + s.tip : 'Nog niet juist. Probeer opnieuw.'; toonA.hidden = false; } };
        inp.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); ctl(); } });
        inp.addEventListener('input', ()=>inp.classList.remove('bad'));
        toonA.hidden = true; verder.hidden = true;
        rij.append(inp); if(s.eenheid) rij.append(el('span', 'eenh', s.eenheid));
        rij.append(knop('btn ghost klein-btn', 'Controleer', ctl), fb, toonA);
        v.append(rij);
        const na = el('div', 'vb-na', s.na || ''); na.hidden = true;
        v.append(na, verder); blok.append(v);
        if(st.ok[i]){ inp.value = Array.isArray(s.ans) ? s.ans[0] : s.ans; klaarStap(); }
      } else if(i < vb.stappen.length - 1 && i >= st.stap){
        blok.append(knop('btn volg-btn', '▶ Volgende stap', ()=>{ st.stap = i + 1; bewaar(key, st); teken(); }));
      }
      pane.append(blok);
    });
    if(st.af && vb.slot) pane.append(el('div', 'tip vb-slot', `<div>${vb.slot}</div>`));
  }
  teken();
  return pane;
}

/* ============================================================
   HEURISTIEK 1 · EEN SCHETS MAKEN
   ============================================================ */
/* schetsen voor de uitwerkingen */
function zebraSvg(n){
  const w = 18, g = 14, W = n * w + (n - 1) * g + 20;
  let s = rh(0, 4, W, 60, { f:'#6b7378', k:'none', w:0 });
  for(let i = 0; i < n; i++) s += rh(10 + i * (w + g), 8, w, 52, { f:'#ffffff', k:'none', w:0 });
  s += maat(10, 76, 10 + w, 76, 'w', { s:12, off:10 }) + maat(10 + w, 76, 10 + w + g, 76, 'a', { s:12, off:10 });
  return svg(W, 96, s, { b:Math.min(300, W * 1.2), label:'zebrapad' });
}
function palenRij(n, o = {}){
  const d = 26, W = (n - 1) * d + 30; let s = lijn(15, 30, 15 + (n - 1) * d, 30, { k:'var(--accent-dark)', w:2 });
  for(let i = 0; i < n; i++) s += cirkel(15 + i * d, 30, 5, { f:'var(--orange)', k:'var(--ink)', w:1.5 }) + (o.nr ? tekst(15 + i * d, 48, i + 1, { s:11 }) : '');
  for(let i = 0; i < n - 1 && o.stuk; i++) s += tekst(15 + i * d + d / 2, 16, o.stuk, { s:10, f:'var(--accent-dark)' });
  return svg(W, 58, s, { b:Math.min(320, W), label:'palen op een rij' });
}
function kringSvg(n, o = {}){
  const r = 70, cx = 90, cy = 88; let s = cirkel(cx, cy, r, { k:'var(--border)', w:1.5 });
  for(let i = 0; i < n; i++){ const a = -Math.PI / 2 + i * 2 * Math.PI / n, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    const f = o.kleur && o.kleur[i] ? o.kleur[i] : 'var(--accent)'; s += cirkel(x, y, n > 16 ? 5 : 7, { f, k:'var(--ink)', w:1.2 }) + (o.lbl && o.lbl[i] ? tekst(cx + (r + 16) * Math.cos(a), cy + (r + 16) * Math.sin(a), o.lbl[i], { s:12 }) : ''); }
  return svg(180, 178, s, { b:190, label:'kring' });
}
function venn2Svg(A, B, x, y, c, z){
  let s = rh(4, 4, 272, 150, { k:'var(--ink)', w:1.5, rx:6 }) + cirkel(105, 82, 58, { f:'rgba(59,193,197,.18)', k:'var(--accent-dark)' }) + cirkel(175, 82, 58, { f:'rgba(252,175,23,.18)', k:'#b77d00' });
  s += tekst(70, 22, A, { s:12, a:'middle' }) + tekst(212, 22, B, { s:12 }) + tekst(80, 84, x) + tekst(140, 84, c) + tekst(202, 84, y) + tekst(255, 140, z, { s:14 });
  return svg(280, 158, s, { b:280, label:'venndiagram' });
}
function venn3Svg(lb, v){
  let s = rh(4, 4, 292, 214, { k:'var(--ink)', w:1.5, rx:6 }) + cirkel(115, 85, 60, { f:'rgba(59,193,197,.16)', k:'var(--accent-dark)' }) + cirkel(185, 85, 60, { f:'rgba(252,175,23,.16)', k:'#b77d00' }) + cirkel(150, 143, 60, { f:'rgba(68,103,194,.12)', k:'#4467c2' });
  s += tekst(62, 26, lb[0], { s:12 }) + tekst(240, 26, lb[1], { s:12 }) + tekst(150, 212, lb[2], { s:12 });
  s += tekst(95, 75, v.a1) + tekst(205, 75, v.a2) + tekst(150, 175, v.a3) + tekst(150, 65, v.b12) + tekst(112, 132, v.b13) + tekst(188, 132, v.b23) + tekst(150, 112, v.c) + tekst(270, 196, v.z, { s:14 });
  return svg(300, 222, s, { b:290, label:'venndiagram met drie verzamelingen' });
}
function rechthoekPalen(pl, pb, o = {}){
  const W = 220, H = Math.max(70, Math.min(150, 220 * pb / pl)), x0 = 30, y0 = 20; let s = rh(x0, y0, W, H, { f:'rgba(59,193,197,.12)', k:'var(--accent-dark)' });
  const pts = []; for(let i = 0; i < pl; i++) pts.push([x0 + W * i / pl, y0]); for(let i = 0; i < pb; i++) pts.push([x0 + W, y0 + H * i / pb]);
  for(let i = 0; i < pl; i++) pts.push([x0 + W - W * i / pl, y0 + H]); for(let i = 0; i < pb; i++) pts.push([x0, y0 + H - H * i / pb]);
  pts.forEach(([x, y], i)=>{ s += cirkel(x, y, 4.5, { f:'var(--orange)', k:'var(--ink)', w:1.2, cls:o.anim ? 'anim-pop' : '', st:o.anim ? `animation-delay:${(i * .08).toFixed(2)}s` : '' }); });
  if(o.L) s += tekst(x0 + W / 2, y0 - 12, o.L, { s:13, f:'var(--accent-dark)' }); if(o.B) s += tekst(x0 + W + 8, y0 + H / 2, o.B, { s:13, a:'start', f:'var(--accent-dark)' });
  return svg(310, H + 40, s, { b:300, label:'palen rond een rechthoek' });
}
function tegelRand(a, b, rand){
  const c = 14, W = (a + 2 * rand) * c, H = (b + 2 * rand) * c; let s = '';
  for(let i = 0; i < a + 2 * rand; i++) for(let j = 0; j < b + 2 * rand; j++){
    const binnen = i >= rand && i < a + rand && j >= rand && j < b + rand;
    s += rh(4 + i * c, 4 + j * c, c, c, { f:binnen ? 'rgba(68,103,194,.35)' : 'var(--or-soft)', k:binnen ? 'none' : 'var(--ink)', w:binnen ? 0 : 1 });
  }
  return svg(W + 8, H + 8, s, { b:Math.min(280, (W + 8) * 1.4), label:'vijver met een rand van tegels' });
}

T({ id:'s01', h:'schets', niv:1, bron:'Wallabie 2011', maak(R){
  const n = R.int(6, 11), w = R.pick([40, 50, 60]), a = R.pick([40, 50, 60, 70]), nm = R.jongen();
  const W = n * w + (n - 1) * a, juist = W / 100;
  return { tekst:`<p>${nm} schildert een zebrapad op de weg. Elke witte streep is ${w} cm breed. Tussen twee witte strepen laat hij telkens ${a} cm asfalt. Hij begint en eindigt met een witte streep. Hij schildert in totaal ${n} witte strepen.</p><p><b>Hoe breed is de weg?</b></p>`,
    mc:opties(R, juist, [n * (w + a) / 100, (n * w + (n + 1) * a) / 100, (n - 1) * (w + a) / 100, (n * w + (n - 2) * a) / 100], { geheel:false, stap:.5, fmt:v=>nf(v) + ' m' }),
    hint:[{ fase:'begrijpen', vraag:'Hoeveel witte strepen zijn er?', ans:n },
      { fase:'plannen', vraag:'Maak een schets met een paar strepen. Hoeveel stroken asfalt liggen er tussen de witte strepen?', ans:n - 1, meer:'Bij 3 witte strepen zijn er 2 stroken asfalt ertussen: wit · asfalt · wit · asfalt · wit.' },
      { fase:'uitvoeren', vraag:'Hoe breed is de weg in cm?', ans:W, eenheid:'cm' }],
    uitw:{ begrijpen:`Je zoekt de breedte van de weg: ${n} witte strepen van ${w} cm en daartussen stroken asfalt van ${a} cm.`,
      plannen:'Maak een schets: zo zie je hoeveel stroken asfalt er zijn.' + zebraSvg(Math.min(n, 7)),
      uitvoeren:`Er zijn ${n} witte strepen en ${n - 1} stroken asfalt (één minder, want je begint en eindigt met wit).<br>${n} · ${w} cm + ${n - 1} · ${a} cm = ${n * w} cm + ${(n - 1) * a} cm = ${W} cm = <b>${nf(juist)} m</b>.`,
      terugkijken:`Fout die vaak gebeurt: ${n} keer (${w} + ${a}) cm rekenen. Dan tel je één strook asfalt te veel.` } };
} });

T({ id:'s02', h:'schets', niv:1, bron:'een klassiek paaltjesprobleem', maak(R){
  const d = R.pick([2, 3, 4, 5]), k = R.int(6, 15), L = d * k, nm = R.naam();
  return { tekst:`<p>${nm} zet een hek langs een rechte weg van ${L} m. Om de ${d} m komt er een paal. Aan het begin en aan het einde van het hek staat ook een paal.</p><p><b>Hoeveel palen zijn er nodig?</b></p>`,
    getal:k + 1, eenheid:'palen',
    hint:[{ fase:'begrijpen', vraag:`Hoeveel stukken van ${d} m passen er in ${L} m?`, ans:k },
      { fase:'plannen', vraag:'Maak een kleine schets: een hek van 3 stukken. Hoeveel palen staan erin?', ans:4 },
      { fase:'uitvoeren', vraag:`Hoeveel palen heb je dan voor ${k} stukken?`, ans:k + 1 }],
    uitw:{ begrijpen:`Een rechte rij palen van ${L} m lang, met ${d} m tussen twee palen, ook een paal aan beide uiteinden.`,
      plannen:'Teken een klein stukje hek en tel.' + palenRij(4, { stuk:d + ' m' }),
      uitvoeren:`${L} : ${d} = ${k} stukken. Bij 3 stukken heb je 4 palen: er is altijd één paal meer dan stukken. Dus ${k} + 1 = <b>${k + 1} palen</b>.`,
      terugkijken:'Op een rechte lijn met een paal aan beide uiteinden: aantal palen = aantal stukken + 1.' } };
} });

T({ id:'s03', h:'schets', niv:1, bron:'een klassiek paaltjesprobleem', maak(R){
  const d = R.pick([3, 4, 5, 6]), k = R.int(8, 20), O = d * k, ding = R.pick(['een boom', 'een lantaarnpaal', 'een bloempot']);
  return { tekst:`<p>Rond een ronde vijver loopt een pad van ${O} m lang. Om de ${d} m zet de gemeente ${ding} langs het pad.</p><p><b>Hoeveel ${ding.replace(/^een /, '').replace('boom', 'bomen').replace('paal', 'palen').replace('pot', 'potten')} staan er rond de vijver?</b></p>`,
    mc:opties(R, k, [k + 1, k - 1, k + 2, 2 * k]),
    hint:[{ fase:'begrijpen', vraag:`Hoeveel stukken van ${d} m passen er in ${O} m?`, ans:k },
      { fase:'plannen', vraag:'Maak een schets van een kring met 4 stukken. Hoeveel paaltjes staan erop?', ans:4, meer:'Bij een gesloten kring valt het begin samen met het einde. Daarom tel je geen paal extra.' }],
    uitw:{ begrijpen:`Het pad is gesloten (een kring) van ${O} m, om de ${d} m staat er iets.`,
      plannen:'Teken een kring met een paar stukken.' + kringSvg(6),
      uitvoeren:`${O} : ${d} = ${k} stukken. In een kring heb je evenveel palen als stukken: de laatste paal is ook de eerste. Antwoord: <b>${k}</b>.`,
      terugkijken:'Vergelijk met een rechte rij: daar heb je één paal meer dan stukken. In een kring niet.' } };
} });

T({ id:'s04', h:'schets', niv:1, bron:'Kangoeroe', maak(R){
  const a = R.int(4, 15), b = R.int(4, 15), nm = R.meisje(), plaats = R.pick(['de kassa', 'de schoolbus', 'het zwembad', 'de frietkraam']);
  return { tekst:`<p>Kinderen staan in een rij voor ${plaats}. ${nm} staat op de ${a}de plaats van voren en op de ${b}de plaats van achteren.</p><p><b>Hoeveel kinderen staan er in de rij?</b></p>`,
    mc:opties(R, a + b - 1, [a + b, a + b + 1, a + b - 2]),
    hint:[{ fase:'plannen', vraag:`Teken ${nm} en de kinderen vóór haar. Hoeveel kinderen staan er vóór ${nm}?`, ans:a - 1 },
      { fase:'uitvoeren', vraag:`Hoeveel kinderen staan er achter ${nm}?`, ans:b - 1 },
      { fase:'uitvoeren', vraag:'Hoeveel kinderen zijn er dan samen (vergeet haar zelf niet)?', ans:a + b - 1 }],
    uitw:{ begrijpen:`${nm} is de ${a}de van voren en de ${b}de van achteren.`,
      plannen:'Maak een schets van de rij: de kinderen vóór haar, zijzelf, de kinderen achter haar.',
      uitvoeren:`Vóór haar: ${a - 1} kinderen. Achter haar: ${b - 1} kinderen. Samen met haar: ${a - 1} + 1 + ${b - 1} = <b>${a + b - 1}</b>.`,
      terugkijken:`${a} + ${b} = ${a + b} is één te veel: dan tel je ${nm} twee keer.` } };
} });

T({ id:'s09', h:'schets', niv:1, bron:'een klassiek zaagprobleem', maak(R){
  const n = R.int(4, 9), t = R.int(2, 6), nm = R.jongen();
  return { tekst:`<p>${nm} zaagt een lange balk in ${n} stukken. Eén zaagsnede duurt ${t} minuten.</p><p><b>Hoeveel minuten zaagt hij in totaal?</b></p>`,
    mc:opties(R, (n - 1) * t, [n * t, (n + 1) * t, (n - 2) * t]),
    hint:[{ fase:'plannen', vraag:'Teken een balk in 3 stukken. Hoeveel zaagsneden heb je nodig?', ans:2 },
      { fase:'uitvoeren', vraag:`Hoeveel zaagsneden heb je voor ${n} stukken?`, ans:n - 1 }],
    uitw:{ begrijpen:`De balk moet in ${n} stukken, één zaagsnede duurt ${t} min.`,
      plannen:'Maak een schets van de balk met de zaagsneden.' + svg(260, 40, rh(5, 8, 250, 24, { f:'#e8c48a', k:'var(--ink)' }) + Array.from({ length:3 }, (_, i)=>lijn(5 + (i + 1) * 62.5, 2, 5 + (i + 1) * 62.5, 38, { k:'var(--bad)', w:2.5, d:'4 3' })).join(''), { b:260 }),
      uitvoeren:`Voor 4 stukken zijn er 3 zaagsneden: altijd één minder dan stukken. ${n} stukken → ${n - 1} zaagsneden → ${n - 1} · ${t} = <b>${(n - 1) * t} minuten</b>.`,
      terugkijken:'Het laatste stuk heeft geen zaagsnede nodig: het blijft vanzelf over.' } };
} });

T({ id:'s05', h:'schets', niv:2, bron:'JWO 2019', maak(R){
  const d = R.pick([5, 6, 8, 10]); let L, B; do{ L = R.int(5, 14) * d + R.pick([0, 0, R.int(1, d - 1)]); B = R.int(3, 8) * d + R.pick([0, R.int(1, d - 1)]); } while(B >= L);
  const pl = Math.ceil(L / d), pb = Math.ceil(B / d), juist = 2 * pl + 2 * pb, nm = R.pick(['Boer Charel', 'Boerin Els', 'Boer Jef', 'Boerin Mieke']);
  return { tekst:`<p>${nm} zet een omheining rond een rechthoekige weide van ${L} m lang en ${B} m breed. Op elke hoek komt een paal. De afstand tussen twee palen naast elkaar mag <b>niet meer</b> zijn dan ${d} m.</p><p><b>Hoeveel palen moet ${nm.split(' ')[0] === 'Boer' ? 'hij' : 'zij'} minstens plaatsen?</b></p>`,
    mc:opties(R, juist, [juist + 4, 2 * Math.floor(L / d) + 2 * Math.floor(B / d), juist - 4, juist + 2]),
    hint:[{ fase:'begrijpen', vraag:`Hoeveel stukken van hoogstens ${d} m heb je minstens nodig voor een lange zijde van ${L} m?`, ans:pl, meer:`${L} : ${d} = ${Math.floor(L / d)}${L % d ? ' rest ' + (L % d) : ''}. Een stuk mag niet langer zijn dan ${d} m: blijft er iets over, dan heb je nog een stuk extra nodig.` },
      { fase:'uitvoeren', vraag:`Hoeveel stukken voor een korte zijde van ${B} m?`, ans:pb },
      { fase:'uitvoeren', vraag:'Hoeveel stukken zijn er rond de hele weide? Dat is ook het aantal palen.', ans:juist }],
    uitw:{ begrijpen:`Een gesloten omheining rond een rechthoek van ${L} m bij ${B} m, met hoogstens ${d} m tussen twee palen.`,
      plannen:'Maak een schets van de weide met de palen.' + rechthoekPalen(Math.min(pl, 12), Math.min(pb, 8), { L:L + ' m', B:B + ' m' }),
      uitvoeren:`Lange zijde: ${L} : ${d} = ${Math.floor(L / d)}${L % d ? ' rest ' + (L % d) + ': nog één stuk extra' : ''}, dus ${pl} stukken. Korte zijde: ${B} : ${d} = ${Math.floor(B / d)}${B % d ? ' rest ' + (B % d) + ': nog één stuk extra' : ''}, dus ${pb} stukken.<br>Rond de weide: ${pl} + ${pb} + ${pl} + ${pb} = ${juist} stukken. Omdat de omheining gesloten is, zijn er evenveel palen als stukken: <b>${juist} palen</b>.`,
      terugkijken:`Fout die vaak gebeurt: per zijde ${pl + 1} en ${pb + 1} palen tellen en dan alles optellen. Dan tel je de 4 hoekpalen dubbel (${juist + 4}).` } };
} });

T({ id:'s06', h:'schets', niv:2, bron:'WizProf 2018', maak(R){
  const t = R.int(7, 9) * 10 + R.pick([0, 5]), c = R.int(1, 4) * 10, a = t + c, b = t - c, [k1, k2] = R.kies(['Mimi', 'Felix', 'Tijger', 'Pluis', 'Minou', 'Garfield'], 2);
  return { tekst:`<p>Kat ${k1} slaapt op de grond, kat ${k2} zit op de tafel. Het hoogteverschil tussen hun oren is ${a} cm. Als de twee katten van plaats wisselen, is het hoogteverschil tussen hun oren nog ${b} cm.</p><p><b>Hoe hoog is de tafel?</b></p>`,
    mc:opties(R, t, [a - b, (a - b) / 2, a, b, a + b].map(x=>x), { fmt:v=>nf(v) + ' cm', stap:5 }),
    hint:[{ fase:'plannen', vraag:'Maak twee schetsen naast elkaar en zet ze op elkaar: tafel + kat op de tafel + … Tel beide verschillen op. Hoeveel is dat?', ans:a + b, eenheid:'cm', meer:`Schets 1: tafel + ${k2} − ${k1} = ${a}. Schets 2: tafel + ${k1} − ${k2} = ${b}. Tel je ze op, dan vallen de katten weg: twee keer de tafel = ${a} + ${b}.` },
      { fase:'uitvoeren', vraag:'Hoe hoog is één tafel?', ans:t, eenheid:'cm' }],
    uitw:{ begrijpen:`Twee situaties: verschil ${a} cm en verschil ${b} cm. Gevraagd: de hoogte van de tafel.`,
      plannen:'Maak een schets van de twee situaties en leg ze naast elkaar.',
      uitvoeren:`Situatie 1: tafel + ${k2} − ${k1} = ${a} cm.<br>Situatie 2: tafel + ${k1} − ${k2} = ${b} cm.<br>Samen: twee tafels (de katten vallen weg) = ${a} + ${b} = ${a + b} cm. Eén tafel = <b>${t} cm</b>.`,
      terugkijken:`Controle: is ${k2} ${c} cm groter dan ${k1}, dan is het eerste verschil ${t} + ${c} = ${a} en het tweede ${t} − ${c} = ${b}. ✓` } };
} });

T({ id:'s07', h:'schets', niv:2, bron:'Wallabie 2017', maak(R){
  const p = R.int(3, 9), q = R.int(3, 11), [x, y] = R.kies(MEISJES, 2);
  const n = p + q;
  return { tekst:`<p>Een aantal kinderen staat in een kring. ${x} is het ${p}de kind links van ${y} en ook het ${q}de kind rechts van ${y}.</p><p><b>Hoeveel kinderen staan er in de kring?</b></p>`,
    mc:opties(R, n, [n - 1, n + 1, n - 2, n + 2]),
    hint:[{ fase:'plannen', vraag:`Teken een kring. Hoeveel kinderen staan er tussen ${y} en ${x} als je naar links telt (zonder hen twee)?`, ans:p - 1 },
      { fase:'uitvoeren', vraag:'En hoeveel staan er tussen hen als je naar rechts telt?', ans:q - 1 },
      { fase:'uitvoeren', vraag:`Hoeveel kinderen in totaal (tel ${x} en ${y} mee)?`, ans:n }],
    uitw:{ begrijpen:`Links van ${y} tellen tot ${x}: ${p} plaatsen. Rechts tellen: ${q} plaatsen.`,
      plannen:'Maak een schets van de kring.' + kringSvg(n, { kleur:Object.assign({}, { 0:'var(--orange)', [p]:'var(--bad)' }), lbl:{ 0:y, [p]:x } }),
      uitvoeren:`Tussen hen staan links ${p - 1} kinderen en rechts ${q - 1}. Samen met ${x} en ${y}: ${p - 1} + ${q - 1} + 2 = <b>${n}</b>.`,
      terugkijken:`Korter: rond de kring is ${p} + ${q} = ${n} stappen, en elke stap komt bij één kind uit.` } };
} });

T({ id:'s08', h:'schets', niv:2, bron:'Kangoeroe', maak(R){
  const [A, B] = R.pick([['voetbal', 'zwemmen'], ['piano', 'gitaar'], ['een hond', 'een kat'], ['Frans', 'Engels'], ['tennis', 'judo']]);
  const x = R.int(4, 11), y = R.int(3, 10), c = R.int(2, 7), z = R.int(1, 6), n = x + y + c + z, a = x + c, b = y + c;
  const Z = { 'voetbal':['voetballen', 'voetballen'], 'zwemmen':['zwemmen', 'zwemmen'], 'piano':['spelen piano', 'piano spelen'], 'gitaar':['spelen gitaar', 'gitaar spelen'], 'een hond':['hebben een hond', 'een hond hebben'], 'een kat':['hebben een kat', 'een kat hebben'], 'Frans':['spreken Frans', 'Frans spreken'], 'Engels':['spreken Engels', 'Engels spreken'], 'tennis':['tennissen', 'tennissen'], 'judo':['doen aan judo', 'aan judo doen'] };
  return { tekst:`<p>In een groep zitten ${n} jongeren. ${a} jongeren ${Z[A][0]}. ${b} jongeren ${Z[B][0]}. ${c} jongeren ${Z[A][0].split(' ')[0] === Z[B][0].split(' ')[0] && Z[A][0].includes(' ') ? Z[A][0].split(' ')[0] + ' ' + Z[A][0].split(' ').slice(1).join(' ') + ' én ' + Z[B][0].split(' ').slice(1).join(' ') : Z[A][0] + ' én ' + Z[B][0]}.</p><p><b>Hoeveel jongeren ${Z[A][1].includes(' ') ? 'doen geen van beide' : 'doen geen van beide'}?</b></p>`,
    mc:opties(R, z, [n - a - b, n - a - b + 2 * c, n - c, c + z, n - a, z + 2], { min:0 }),
    hint:[{ fase:'plannen', vraag:`Teken twee cirkels die overlappen. In het stuk dat ze delen komen ${c} jongeren. Hoeveel komen er in het stuk van enkel ${A}?`, ans:x },
      { fase:'uitvoeren', vraag:`Hoeveel jongeren enkel ${B}?`, ans:y },
      { fase:'uitvoeren', vraag:'Hoeveel jongeren staan in minstens één cirkel?', ans:x + y + c }],
    uitw:{ begrijpen:`${n} jongeren: ${a} bij ${A}, ${b} bij ${B}, ${c} bij allebei.`,
      plannen:'Maak een schets: een venndiagram met twee cirkels.' + venn2Svg(A, B, x, y, c, z),
      uitvoeren:`Enkel ${A}: ${a} − ${c} = ${x}. Enkel ${B}: ${b} − ${c} = ${y}. In de cirkels: ${x} + ${c} + ${y} = ${x + y + c}. Geen van beide: ${n} − ${x + y + c} = <b>${z}</b>.`,
      terugkijken:`Wie ${a} + ${b} rekent, telt de ${c} jongeren van het middenstuk twee keer.` } };
} });

T({ id:'s12', h:'schets', niv:2, bron:'een tegelprobleem', maak(R){
  const a = R.int(3, 9), b = R.int(2, a), juist = 2 * a + 2 * b + 4;
  return { tekst:`<p>Een rechthoekige vijver is ${a} tegels lang en ${b} tegels breed. Rond de vijver leggen we één rij vierkante tegels, zodat de vijver helemaal omringd is (ook op de hoeken).</p><p><b>Hoeveel tegels zijn daarvoor nodig?</b></p>`,
    mc:opties(R, juist, [2 * a + 2 * b, 2 * a + 2 * b + 2, (a + 2) * (b + 2), 2 * a + 2 * b + 8]),
    hint:[{ fase:'plannen', vraag:`Teken het op ruitjespapier. Hoeveel tegels liggen er langs één lange zijde (zonder de hoeken)?`, ans:a },
      { fase:'uitvoeren', vraag:'Hoeveel hoektegels zijn er?', ans:4 },
      { fase:'uitvoeren', vraag:'Hoeveel tegels samen?', ans:juist }],
    uitw:{ begrijpen:`Een rand van één tegel breed rond een vijver van ${a} bij ${b}.`,
      plannen:'Maak een schets op ruitjespapier.' + tegelRand(a, b, 1),
      uitvoeren:`Langs de zijden: ${a} + ${a} + ${b} + ${b} = ${2 * a + 2 * b} tegels. Op de hoeken nog 4 tegels. Samen <b>${juist}</b>.`,
      terugkijken:`Andere manier: het hele vlak is ${a + 2} bij ${b + 2} = ${(a + 2) * (b + 2)} tegels. Zonder de vijver (${a * b}): ${(a + 2) * (b + 2)} − ${a * b} = ${juist}. ✓` } };
} });

T({ id:'s10', h:'schets', niv:3, bron:'een opgave over buurlanden', maak(R){
  const v = { a1:R.int(3, 10), a2:R.int(3, 10), a3:R.int(2, 8), b12:R.int(2, 7), b23:R.int(2, 6), b13:R.int(1, 5), c:R.int(3, 8), z:R.int(2, 6) };
  const F = v.a1 + v.b12 + v.b13 + v.c, N = v.a2 + v.b12 + v.b23 + v.c, D = v.a3 + v.b13 + v.b23 + v.c, FN = v.b12 + v.c, ND = v.b23 + v.c, FD = v.b13 + v.c;
  const n = v.a1 + v.a2 + v.a3 + v.b12 + v.b23 + v.b13 + v.c + v.z;
  return { tekst:`<p>Aan ${n} twaalfjarigen vragen we in welke buurlanden ze al waren: Frankrijk, Nederland of Duitsland.</p><ul class="kort"><li>${F} waren in Frankrijk, ${N} in Nederland en ${D} in Duitsland.</li><li>${FN} waren in Frankrijk én Nederland, ${ND} in Nederland én Duitsland, ${FD} in Frankrijk én Duitsland.</li><li>${v.c} waren in alle drie, ${v.z} in geen enkel.</li></ul><p><b>Hoeveel jongeren waren enkel in Frankrijk?</b></p>`,
    mc:opties(R, v.a1, [F - FN - FD, F - FN, F - FD, v.a1 + v.c, F - v.c], { min:0 }),
    uitw:{ begrijpen:'Drie verzamelingen die elkaar overlappen. Gevraagd: het stuk “enkel Frankrijk”.',
      plannen:'Teken een venndiagram met drie cirkels en vul het in van binnen naar buiten: eerst het midden.',
      uitvoeren:`Midden (alle drie): ${v.c}. Frankrijk én Nederland zonder Duitsland: ${FN} − ${v.c} = ${v.b12}. Frankrijk én Duitsland zonder Nederland: ${FD} − ${v.c} = ${v.b13}.<br>Enkel Frankrijk: ${F} − ${v.b12} − ${v.b13} − ${v.c} = <b>${v.a1}</b>.` + venn3Svg(['Frankrijk', 'Nederland', 'Duitsland'], v),
      terugkijken:`Controle: tel alle stukken op, dan krijg je ${n}. ✓ Wie ${F} − ${FN} − ${FD} rekent, trekt het middenstuk twee keer af.` } };
} });

T({ id:'s11', h:'schets', niv:3, bron:'Wallabie 2017', maak(R){
  let p, q; do{ p = R.int(4, 12); q = R.int(4, 12); } while(p === q || p % q === 0 || q % p === 0 || ggd(p, q) === 1 && R.r() < .5);
  const g = ggd(p, q), juist = p + q - g, [x, y, z] = R.namen(3);
  return { tekst:`<p>${x} wil een touw in ${p} gelijke stukken knippen en duidt de knippunten aan met een stift. ${y} wil hetzelfde touw in ${q} gelijke stukken knippen en duidt ook de knippunten aan. ${z} knipt het touw door op alle aangeduide punten.</p><p><b>Hoeveel stukjes touw heeft ${z}?</b></p>`,
    mc:opties(R, juist, [p + q - 1, p + q, p + q - 2, p + q + 1]),
    uitw:{ begrijpen:`${p - 1} punten van ${x} en ${q - 1} punten van ${y}. Sommige punten kunnen samenvallen.`,
      plannen:`Maak een schets: neem een touw van ${kgv(p, q)} cm. Dan liggen de punten van ${x} om de ${kgv(p, q) / p} cm en die van ${y} om de ${kgv(p, q) / q} cm.`,
      uitvoeren:`Punten van ${x}: ${p - 1}. Punten van ${y}: ${q - 1}. Ze vallen samen op ${g - 1} ${g - 1 === 1 ? 'plaats' : 'plaatsen'} (de ggd van ${p} en ${q} is ${g}).<br>Verschillende knippunten: ${p - 1} + ${q - 1} − ${g - 1} = ${juist - 1}. Stukjes: één meer dan knippunten = <b>${juist}</b>.`,
      terugkijken:'Op een stuk touw zijn er altijd één stuk meer dan knippen. En punten die samenvallen, tel je maar één keer.' } };
} });

T({ id:'s13', h:'schets', niv:3, bron:'een tegelprobleem', maak(R){
  const a = R.int(3, 8), b = R.int(2, a), juist = (a + 4) * (b + 4) - a * b;
  return { tekst:`<p>Rond een rechthoekig zwembad van ${a} tegels lang en ${b} tegels breed leggen we een terras van <b>twee</b> rijen vierkante tegels breed, zodat het zwembad helemaal omringd is.</p><p><b>Hoeveel tegels zijn daarvoor nodig?</b></p>`,
    mc:opties(R, juist, [2 * (2 * a + 2 * b + 4), 4 * a + 4 * b + 8, (a + 4) * (b + 4), 4 * a + 4 * b + 4]),
    uitw:{ begrijpen:`Een rand van twee tegels breed rond een zwembad van ${a} bij ${b}.`,
      plannen:'Maak een schets op ruitjespapier, of reken met de grote rechthoek min het zwembad.' + tegelRand(a, b, 2),
      uitvoeren:`Grote rechthoek: ${a + 4} bij ${b + 4} = ${(a + 4) * (b + 4)} tegels. Zwembad: ${a} bij ${b} = ${a * b}. Terras: ${(a + 4) * (b + 4)} − ${a * b} = <b>${juist}</b>.`,
      terugkijken:`Per rij tellen: de binnenste rij heeft 2·${a} + 2·${b} + 4 = ${2 * a + 2 * b + 4} tegels, de buitenste 2·${a + 2} + 2·${b + 2} + 4 = ${2 * a + 2 * b + 12}. Samen ${juist}. ✓` } };
} });

/* ============================================================
   HEURISTIEK 2 · VEREENVOUDIGEN VAN HET PROBLEEM
   ============================================================ */
/* trapfiguur: buitenmaten W en H, k treden bovenaan */
function trapPunten(R, W, H, k){
  const xs = R.kies(Array.from({ length:W - 1 }, (_, i)=>i + 1), k).sort((a, b)=>b - a);
  const ys = R.kies(Array.from({ length:H - 1 }, (_, i)=>i + 1), k).sort((a, b)=>a - b);
  const p = [[0, H], [W, H], [W, 0]]; xs.forEach((x, i)=>{ p.push([x, i ? ys[i - 1] : 0]); p.push([x, ys[i]]); }); p.push([0, ys[k - 1]]);
  return p;
}
function trapSvg(p, W, H, o = {}){
  const c = Math.min(18, 230 / W, 150 / H), ox = 16, oy = 16, P = p.map(([x, y])=>[ox + x * c, oy + y * c]);
  let s = veelhoek(P, { f:'rgba(59,193,197,.18)', k:'var(--ink)' });
  s += maat(ox, oy + H * c + 14, ox + W * c, oy + H * c + 14, W + ' m', { s:13, off:12 }) + maat(ox + W * c + 14, oy, ox + W * c + 14, oy + H * c, H + ' m', { s:13 });
  if(o.schuif){ s += lijn(ox, oy - 6, ox + W * c, oy - 6, { k:'var(--orange)', w:3, d:'6 3', cls:'anim-in' }) + lijn(ox - 6, oy, ox - 6, oy + H * c, { k:'var(--orange)', w:3, d:'6 3', cls:'anim-in' }); }
  return svg(W * c + 70, H * c + 56, s, { b:Math.min(300, W * c + 70), label:'trapfiguur' });
}
/* breuken als antwoordkeuzes, gesorteerd van klein naar groot */
function opsBreuk(R, [t, n], kand){
  const [a, b] = brV(t, n), lijst = [[a, b]];
  for(const [x, y] of kand){ if(lijst.length >= 5) break; if(!(x > 0 && y > 0)) continue; const [p, q] = brV(x, y); if(!lijst.some(([u, v])=>u * q === p * v)) lijst.push([p, q]); }
  let k = 2; while(lijst.length < 5){ const c = [a * k + 1, b * k]; const [p, q] = brV(c[0], c[1]); if(!lijst.some(([u, v])=>u * q === p * v)) lijst.push([p, q]); k++; }
  lijst.sort((u, v)=>u[0] / u[1] - v[0] / v[1]);
  return { keuzes:lijst.map(([p, q])=>q === 1 ? String(p) : br(p, q)), juist:lijst.findIndex(([p, q])=>p * b === a * q) };
}

T({ id:'v01', h:'vereenv', niv:1, bron:'een opgave over omtrek', maak(R){
  const W = R.int(8, 15), H = R.int(5, 9), k = R.int(2, 4), p = trapPunten(R, W, H, k), juist = 2 * (W + H);
  return { tekst:`<p>Een tuin heeft de vorm van de figuur hiernaast. Alle hoeken zijn rechte hoeken. Je kent enkel de breedte (${W} m) en de hoogte (${H} m).</p><p><b>Hoeveel meter is de omtrek van de tuin?</b></p>`,
    fig:trapSvg(p, W, H),
    mc:opties(R, juist, [W + H, 2 * W + H, W + 2 * H, juist + 2 * k, juist - 2]),
    hint:[{ fase:'plannen', vraag:'Schuif alle horizontale stukjes van de trap naar boven. Hoe lang zijn ze samen?', ans:W, eenheid:'m', meer:'De stukjes vormen samen precies de bovenkant van een rechthoek, even lang als de onderkant.' },
      { fase:'plannen', vraag:'Schuif alle verticale stukjes van de trap naar links. Hoe lang zijn ze samen (met de linkerzijde erbij)?', ans:H, eenheid:'m' },
      { fase:'uitvoeren', vraag:'Hoeveel is de omtrek?', ans:juist, eenheid:'m' }],
    uitw:{ begrijpen:`De omtrek bestaat uit veel stukjes, maar je kent enkel ${W} m en ${H} m.`,
      plannen:'Vereenvoudig: verschuif de stukjes van de trap tot ze een rechthoek vormen.' + trapSvg(p, W, H, { schuif:true }),
      uitvoeren:`Horizontale stukjes bovenaan: samen ${W} m. Verticale stukjes links: samen ${H} m. De omtrek is dus dezelfde als die van een rechthoek van ${W} m bij ${H} m: 2 · (${W} + ${H}) = <b>${juist} m</b>.`,
      terugkijken:'Hoeveel treden er zijn, maakt voor de omtrek niets uit. De oppervlakte verandert wel!' } };
} });

T({ id:'v02', h:'vereenv', niv:1, bron:'JWO 2014', maak(R){
  const k = R.pick([4, 5, 10]); let m = R.int(1, k); if(k === 4 && m % 2) m = m === 3 ? 2 : m + 1;
  const pct = m / k * 50, cw = 260 / k, H = 90, sel = R.kies(Array.from({ length:k }, (_, i)=>i), m);
  let s = rh(10, 10, 260, H, { k:'var(--ink)' });
  for(let i = 1; i < k; i++) s += lijn(10 + i * cw, 10, 10 + i * cw, 10 + H, { k:'var(--border)', w:1, d:'3 3' });
  const tops = Array.from({ length:k }, ()=>R.r());
  sel.forEach(i=>{ const x0 = 10 + i * cw, tx = x0 + cw * (.15 + .7 * tops[i]); s += veelhoek([[x0, 10 + H], [x0 + cw, 10 + H], [tx, 10]], { f:'rgba(252,175,23,.75)', k:'var(--ink)', w:1.5 }); });
  const fig = svg(280, 110, s, { b:280, label:'rechthoek met gekleurde driehoeken' });
  return { tekst:`<p>Een rechthoek is in ${k} even brede stroken verdeeld (stippellijnen). In ${m === 1 ? 'één strook' : m + ' stroken'} staat een gekleurde driehoek: de onderkant is de hele strook, de top ligt op de bovenkant.</p><p><b>Welk percentage van de rechthoek is gekleurd?</b></p>`,
    fig, mc:opties(R, pct, [m / k * 100, 50, (k - m) / k * 50, pct / 2, m * 10], { geheel:false, stap:5, fmt:v=>nf(v) + ' %', min:1 }),
    hint:[{ fase:'plannen', vraag:'Kijk naar één strook. Welk deel van die strook is de driehoek? Typ als percentage.', ans:50, eenheid:'%', meer:'Teken in de strook een lijn van de top recht naar beneden. Elk van de twee stukken is een rechthoek die door de driehoek precies in twee gedeeld wordt.' },
      { fase:'uitvoeren', vraag:'Hoeveel procent van de rechthoek is één strook?', ans:100 / k, eenheid:'%' }],
    uitw:{ begrijpen:`${m} van de ${k} stroken hebben een driehoek met dezelfde onderkant en dezelfde hoogte als de strook.`,
      plannen:'Vereenvoudig: kijk eerst naar één strook alleen.',
      uitvoeren:`Een driehoek met dezelfde basis en hoogte als een rechthoek is de helft ervan, waar de top ook ligt. Eén strook is ${nf(100 / k)} % van de rechthoek, de driehoek dus ${nf(50 / k)} %. ${m} driehoeken: ${m} · ${nf(50 / k)} % = <b>${nf(pct)} %</b>.`,
      terugkijken:'Schuif de top van een driehoek opzij: de oppervlakte verandert niet. Zet je hem in het midden, dan zie je makkelijk dat het de helft is.' } };
} });

T({ id:'v04', h:'vereenv', niv:1, bron:'de som van Gauss', maak(R){
  const n = R.pick([20, 30, 40, 50, 60, 80, 100]), juist = n * (n + 1) / 2;
  return { tekst:`<p>Hoeveel is 1 + 2 + 3 + 4 + … + ${n - 1} + ${n}?</p>`,
    mc:opties(R, juist, [n * n / 2, n * (n - 1) / 2, n * (n + 1), n * n]),
    hint:[{ fase:'plannen', vraag:'Vereenvoudig: neem eerst 1 + 2 + … + 10. Maak paren: 1 + 10, 2 + 9, … Hoeveel is één paar?', ans:11 },
      { fase:'uitvoeren', vraag:`Nu met ${n}: hoeveel is 1 + ${n}?`, ans:n + 1 },
      { fase:'uitvoeren', vraag:`Hoeveel zulke paren zijn er bij 1 tot ${n}?`, ans:n / 2 }],
    uitw:{ begrijpen:`Alle getallen van 1 tot ${n} optellen.`,
      plannen:'Vereenvoudig: probeer het eerst met 1 tot 10 en zoek een slimme manier.',
      uitvoeren:`1 + 10 = 11, 2 + 9 = 11, … : 5 paren van 11 = 55.<br>Zo ook hier: 1 + ${n} = ${n + 1}, 2 + ${n - 1} = ${n + 1}, … Er zijn ${n / 2} paren: ${n / 2} · ${n + 1} = <b>${nf(juist)}</b>.`,
      terugkijken:'Controle met 1 tot 4: 1 + 2 + 3 + 4 = 10 en 2 paren van 5 = 10. ✓' } };
} });

T({ id:'v07', h:'vereenv', niv:1, bron:'een weegschaalprobleem', maak(R){
  const ap = R.int(12, 25) * 10, pe = R.int(12, 25) * 10, a = R.int(2, 4), p = R.int(1, 3), nm = R.naam();
  const X = (a + 1) * ap + p * pe, Y = a * ap + p * pe;
  const [fr, frs] = R.pick([['appel', 'appels'], ['sinaasappel', 'sinaasappels'], ['meloen', 'meloenen']]), [g, gs] = R.pick([['peer', 'peren'], ['kiwi', "kiwi's"], ['banaan', 'bananen']]);
  return { tekst:`<p>${nm} weegt twee zakjes fruit. Alle ${frs} wegen evenveel en alle ${gs} wegen evenveel.</p><ul class="kort"><li>Zakje 1: ${a + 1} ${frs} en ${p} ${p === 1 ? g : gs} wegen samen ${nf(X)} g.</li><li>Zakje 2: ${a} ${frs} en ${p} ${p === 1 ? g : gs} wegen samen ${nf(Y)} g.</li></ul><p><b>Hoeveel weegt één ${fr}?</b></p>`,
    getal:ap, eenheid:'g',
    hint:[{ fase:'plannen', vraag:'Wat zit er in zakje 1 méér dan in zakje 2?', ans:['1 ' + fr, 'een ' + fr, fr, 'één ' + fr], meer:'Streep in beide zakjes weg wat hetzelfde is.' },
      { fase:'uitvoeren', vraag:'Hoeveel weegt zakje 1 meer dan zakje 2?', ans:ap, eenheid:'g' }],
    uitw:{ begrijpen:'Twee zakjes die bijna hetzelfde zijn. Gevraagd: het gewicht van één stuk fruit.',
      plannen:'Vereenvoudig: streep weg wat in beide zakjes zit.',
      uitvoeren:`Zakje 1 heeft precies één ${fr} meer dan zakje 2. Het verschil in gewicht is dus één ${fr}: ${nf(X)} g − ${nf(Y)} g = <b>${ap} g</b>.`,
      terugkijken:`Je hoeft het gewicht van een ${g} niet te kennen. (Het is ${pe} g: ${a} · ${ap} + ${p} · ${pe} = ${nf(Y)}. ✓)` } };
} });

T({ id:'v03', h:'vereenv', niv:2, bron:'Kangoeroe', maak(R){
  const n = R.int(15, 60), N = 2 * n;
  return { tekst:`<p>Hoeveel is ${N} − ${N - 1} + ${N - 2} − ${N - 3} + ${N - 4} − … + 4 − 3 + 2 − 1?</p>`,
    mc:opties(R, n, [0, 1, N, n + 1, n - 1, N - 1]),
    hint:[{ fase:'plannen', vraag:'Vereenvoudig: reken eerst 6 − 5 + 4 − 3 + 2 − 1 uit.', ans:3 },
      { fase:'plannen', vraag:`Neem telkens twee getallen samen: (${N} − ${N - 1}), (${N - 2} − ${N - 3}), … Hoeveel is elk paar?`, ans:1 },
      { fase:'uitvoeren', vraag:`Hoeveel paren zijn er van ${N} tot 1?`, ans:n }],
    uitw:{ begrijpen:`Getallen van ${N} tot 1, afwisselend aftrekken en optellen.`,
      plannen:'Vereenvoudig: probeer het met een kleiner getal, 6 − 5 + 4 − 3 + 2 − 1 = 1 + 1 + 1 = 3.',
      uitvoeren:`Groepeer per twee: (${N} − ${N - 1}) + (${N - 2} − ${N - 3}) + … + (2 − 1). Elk paar is 1 en er zijn ${N} : 2 = ${n} paren. Antwoord: <b>${n}</b>.`,
      terugkijken:'Bij 6 tot 1 vond je 3 = 6 : 2. Hier dus ' + N + ' : 2 = ' + n + '. ✓' } };
} });

T({ id:'v05', h:'vereenv', niv:2, bron:'Wallabie 2019', maak(R){
  /* vierkant 8×8: drie grote kwarten, in het vierde drie middelgrote, en daarin vier kleine */
  const groot = [[4, 0], [0, 4], [4, 4]], mid = [[2, 0], [0, 2], [2, 2]], klein = [[0, 0], [1, 0], [0, 1], [1, 1]];
  let g, mm, kk; do{ g = R.kies(groot, R.int(0, 1)); mm = R.kies(mid, R.int(1, 2)); kk = R.kies(klein, R.int(1, 3)); } while(!g.length && mm.length + kk.length < 3);
  const t = g.length * 16 + mm.length * 4 + kk.length, c = 30;
  let s = '';
  const vak = ([x, y], z, f) => rh(6 + x * c, 6 + y * c, z * c, z * c, { f:f ? 'rgba(59,193,197,.8)' : 'var(--card)', k:'var(--ink)', w:1.5 });
  groot.forEach(p=>{ s += vak(p, 4, g.includes(p)); }); mid.forEach(p=>{ s += vak(p, 2, mm.includes(p)); }); klein.forEach(p=>{ s += vak(p, 1, kk.includes(p)); });
  const stuk = g.length + mm.length + kk.length;
  return { tekst:`<p>Een groot vierkant is verdeeld in kleinere vierkanten, zoals op de figuur.</p><p><b>Welk deel van het grote vierkant is gekleurd?</b></p>`,
    fig:svg(252, 252, s, { b:220, label:'vierkant verdeeld in kleinere vierkanten' }),
    mc:opsBreuk(R, [t, 64], [[stuk, 10], [stuk, 4], [t + 4, 64], [t, 32], [t - 1, 64]]),
    hint:[{ fase:'plannen', vraag:'Verdeel alles in de kleinste vierkantjes. Hoeveel kleine vierkantjes passen in het grote vierkant?', ans:64 },
      { fase:'uitvoeren', vraag:'Hoeveel kleine vierkantjes passen in een middelgroot vierkant?', ans:4 },
      { fase:'uitvoeren', vraag:'Hoeveel kleine vierkantjes zijn er gekleurd?', ans:t }],
    uitw:{ begrijpen:'De stukken zijn niet even groot. Je mag ze dus niet gewoon tellen.',
      plannen:'Vereenvoudig: druk alles uit in de kleinste vierkantjes.',
      uitvoeren:`Groot vierkant: 8 · 8 = 64 kleine vierkantjes. Een kwart = 16, een middelgroot = 4, een klein = 1.<br>Gekleurd: ${g.length} · 16 + ${mm.length} · 4 + ${kk.length} · 1 = ${t}. Deel: ${br(t, 64)}${ggd(t, 64) > 1 ? ' = ' + br(...brV(t, 64)) : ''}.`,
      terugkijken:`${stuk} van de 10 stukken tellen geeft ${br(...brV(stuk, 10))}: dat is fout, want de stukken zijn niet even groot.` } };
} });

/* letters uit blokken van l bij 1 cm */
function letterBlokken(L, l){
  const B = []; const v = (x, y)=>B.push({ x, y, w:1, h:l }), hz = (x, y)=>B.push({ x, y, w:l, h:1 });
  if(L === 'L'){ v(0, 0); v(0, l); hz(1, 2 * l - 1); }
  if(L === 'T'){ hz(0, 0); hz(l, 0); v(l - 1, 1); }
  if(L === 'F'){ v(0, 0); v(0, l); hz(1, 0); hz(1, l - 1); }
  if(L === 'E'){ v(0, 0); v(0, l); hz(1, 0); hz(1, l - 1); hz(1, 2 * l - 1); }
  if(L === 'H'){ v(0, 0); v(0, l); v(l + 1, 0); v(l + 1, l); hz(1, l - 1); }
  if(L === 'U'){ v(0, 0); v(0, l); v(l + 1, 0); v(l + 1, l); hz(1, 2 * l - 1); }
  return B;
}
function omtrekCellen(B){
  const cel = new Set(); B.forEach(b=>{ for(let i = 0; i < b.w; i++) for(let j = 0; j < b.h; j++) cel.add((b.x + i) + ',' + (b.y + j)); });
  let p = 0; cel.forEach(k=>{ const [x, y] = k.split(',').map(Number); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=>{ if(!cel.has((x + dx) + ',' + (y + dy))) p++; }); });
  return { p, n:cel.size };
}
T({ id:'v06', h:'vereenv', niv:2, bron:'een opgave over houten blokken', maak(R){
  const L = R.pick(['L', 'T', 'F', 'E', 'H', 'U']), l = R.pick([3, 4]), B = letterBlokken(L, l), { p } = omtrekCellen(B);
  const nm = R.pick(L === 'L' ? ['Lars', 'Lien', 'Lotte'] : L === 'T' ? ['Thibo', 'Tess', 'Tuur'] : L === 'F' ? ['Ferre', 'Fien', 'Febe'] : L === 'E' ? ['Elise', 'Emiel', 'Ella'] : L === 'H' ? ['Hanne', 'Hugo', 'Hasan'] : ['Ufuk', 'Ulrike', 'Urbain']);
  const som = B.length * 2 * (l + 1), contact = (som - p) / 2, c = 14;
  let s = ''; B.forEach(b=>{ s += rh(6 + b.x * c, 6 + b.y * c, b.w * c, b.h * c, { f:'#e8c48a', k:'var(--ink)', w:1.5 }); });
  const mx = Math.max(...B.map(b=>b.x + b.w)), my = Math.max(...B.map(b=>b.y + b.h));
  return { tekst:`<p>${nm} heeft ${B.length} rechthoekige houten blokken van ${l} cm lang en 1 cm breed. Daarmee legt ${['Lien', 'Lotte', 'Tess', 'Fien', 'Febe', 'Elise', 'Ella', 'Hanne', 'Ulrike'].includes(nm) ? 'ze' : 'hij'} de letter ${L}, zoals op de figuur.</p><p><b>Wat is de omtrek van deze letter?</b></p>`,
    fig:svg(mx * c + 12, my * c + 12, s, { b:Math.min(200, (mx * c + 12) * 1.5), label:'letter uit blokken' }),
    mc:opties(R, p, [som, p + 2, p - 2, p + 4, som - contact]),
    hint:[{ fase:'begrijpen', vraag:'Wat is de omtrek van één blok?', ans:2 * (l + 1), eenheid:'cm' },
      { fase:'plannen', vraag:`Hoeveel is de omtrek van alle ${B.length} blokken samen, als ze los liggen?`, ans:som, eenheid:'cm' },
      { fase:'uitvoeren', vraag:'Hoeveel cm liggen de blokken in totaal tegen elkaar? (Tel elke plaats waar twee blokken elkaar raken.)', ans:contact, eenheid:'cm', meer:'Waar twee blokken 1 cm tegen elkaar liggen, verlies je 2 cm omtrek: 1 cm van elk blok.' }],
    uitw:{ begrijpen:`${B.length} blokken van ${l} cm bij 1 cm vormen de letter ${L}.`,
      plannen:'Vereenvoudig: begin met de losse blokken en kijk wat er verandert als je ze tegen elkaar legt.',
      uitvoeren:`Losse blokken: ${B.length} · ${2 * (l + 1)} cm = ${som} cm. De blokken raken elkaar over ${contact} cm. Op die plaatsen verdwijnt telkens 2 cm omtrek: ${som} − 2 · ${contact} = <b>${p} cm</b>.`,
      terugkijken:'Controle: loop met je vinger rond de letter en tel de centimeters. Je vindt hetzelfde.' } };
} });

T({ id:'v08', h:'vereenv', niv:2, bron:'een klassiek handdrukprobleem', maak(R){
  const n = R.int(6, 16), juist = n * (n - 1) / 2, wat = R.pick(['geeft iedereen elk ander een hand', 'klinkt iedereen met elk ander één keer met het glas']);
  return { tekst:`<p>Op een feestje zijn ${n} personen. Bij het begin ${wat}.</p><p><b>Hoeveel keer gebeurt dat in totaal?</b></p>`,
    mc:opties(R, juist, [n * (n - 1), n * n, n * (n + 1) / 2, n * (n - 2) / 2 + 1]),
    hint:[{ fase:'plannen', vraag:'Vereenvoudig: hoeveel keer met 3 personen?', ans:3 },
      { fase:'plannen', vraag:'En met 4 personen?', ans:6 },
      { fase:'uitvoeren', vraag:`Met ${n} personen: elke persoon doet het met hoeveel anderen?`, ans:n - 1 }],
    uitw:{ begrijpen:`${n} personen, elk paar één keer.`,
      plannen:'Vereenvoudig: neem eerst 3, 4 en 5 personen. Dat geeft 3, 6 en 10.',
      uitvoeren:`Elke persoon doet het met ${n - 1} anderen: ${n} · ${n - 1} = ${n * (n - 1)}. Maar zo tel je elk paar twee keer (A met B en B met A). Dus ${n * (n - 1)} : 2 = <b>${juist}</b>.`,
      terugkijken:'Met 4 personen: 4 · 3 : 2 = 6. Klopt met de tekening. ✓' } };
} });

T({ id:'v09', h:'vereenv', niv:2, bron:'een tornooi', maak(R){
  const n = R.int(11, 64), sport = R.pick(['tafeltennistornooi', 'schaaktornooi', 'tennistornooi', 'badmintontornooi']);
  return { tekst:`<p>Aan een ${sport} doen ${n} spelers mee. Wie een wedstrijd verliest, ligt eruit. Wie wint, speelt verder (soms moet iemand een ronde wachten). Er is geen gelijkspel. Zo gaat het door tot er één winnaar is.</p><p><b>Hoeveel wedstrijden worden er gespeeld?</b></p>`,
    getal:n - 1, eenheid:'wedstrijden',
    hint:[{ fase:'plannen', vraag:'Vereenvoudig: hoeveel spelers vallen er af bij elke wedstrijd?', ans:1 },
      { fase:'uitvoeren', vraag:`Hoeveel spelers moeten er afvallen om nog 1 winnaar over te houden?`, ans:n - 1 }],
    uitw:{ begrijpen:`${n} spelers, afvalsysteem, op het einde één winnaar.`,
      plannen:'Vereenvoudig: tel geen rondes, maar kijk naar één wedstrijd: daarbij valt precies één speler af.',
      uitvoeren:`Om van ${n} spelers naar 1 winnaar te gaan, moeten er ${n - 1} spelers afvallen. Elke wedstrijd laat er één afvallen, dus <b>${n - 1} wedstrijden</b>.`,
      terugkijken:'Controle met 4 spelers: 2 halve finales + 1 finale = 3 wedstrijden = 4 − 1. ✓' } };
} });

T({ id:'v10', h:'vereenv', niv:3, bron:'JWO 2018', maak(R){
  const S = R.pick([6, 12, 18, 24, 30, 36, 48, 60]);
  const A = [20, 180], B = [270, 180], C = [R.int(90, 170), 20], D = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], E = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2], F = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  let s = veelhoek([D, B, E, F], { f:'rgba(252,175,23,.7)', k:'none', w:0 }) + veelhoek([A, B, C]) + lijn(...A, ...E, { w:1.5 }) + lijn(...C, ...D, { w:1.5 });
  [[A, 'A', -10, 8], [B, 'B', 10, 8], [C, 'C', 0, -10], [D, 'D', 0, 14], [E, 'E', 12, -4], [F, 'F', -12, -2]].forEach(([p, t, dx, dy])=>{ s += tekst(p[0] + dx, p[1] + dy, t, { s:14 }); });
  return { tekst:`<p>Driehoek ABC heeft een oppervlakte van ${S} cm². D is het midden van [AB] en E is het midden van [BC]. F is het snijpunt van AE en CD.</p><p><b>Hoeveel cm² is de gekleurde vierhoek DBEF?</b></p>`,
    fig:svg(290, 200, s, { b:280, label:'driehoek ABC' }),
    mc:opties(R, S / 3, [S / 4, S / 6, S / 2, 3 * S / 8, 5 * S / 12], { geheel:false, fmt:v=>nf(v) + ' cm²' }),
    uitw:{ begrijpen:'Twee lijnen vanuit een hoekpunt naar het midden van de overstaande zijde. Gevraagd: het deel DBEF.',
      plannen:'Vereenvoudig: trek ook de derde lijn (van B naar het midden van [AC]). Zo krijg je zes kleine driehoekjes.',
      uitvoeren:`De drie lijnen gaan door hetzelfde punt F en verdelen de driehoek in 6 driehoekjes die allemaal even groot zijn. DBEF bestaat uit 2 van die 6 driehoekjes: ${br(2, 6)} = ${br(1, 3)} van ${S} cm² = <b>${nf(S / 3)} cm²</b>.`,
      terugkijken:`Driehoek DBC is de helft van ABC (D is het midden). Driehoek DBC = DBEF + driehoekje EFC (${br(1, 6)}): ${br(1, 3)} + ${br(1, 6)} = ${br(1, 2)}. ✓` } };
} });

T({ id:'v11', h:'vereenv', niv:3, bron:'een opgave over paginanummers', maak(R){
  const n = R.int(110, 420), juist = 9 + 180 + 3 * (n - 99), nm = R.naam();
  return { tekst:`<p>${nm} nummert de bladzijden van een schrift van 1 tot en met ${n}, met stempels van één cijfer.</p><p><b>Hoeveel cijfers stempelt ${nm} in totaal?</b></p>`,
    mc:opties(R, juist, [3 * n, 9 + 180 + 3 * (n - 100), 9 + 90 + 3 * (n - 99), juist + 3, 2 * n + 9]),
    uitw:{ begrijpen:`Bladzijde 1 tot en met ${n}. Niet elke bladzijde heeft evenveel cijfers.`,
      plannen:'Vereenvoudig: splits in groepen met 1, 2 en 3 cijfers.',
      uitvoeren:`1 tot 9: 9 getallen met 1 cijfer = 9 cijfers.<br>10 tot 99: 90 getallen met 2 cijfers = 180 cijfers.<br>100 tot ${n}: ${n - 99} getallen met 3 cijfers = ${3 * (n - 99)} cijfers.<br>Samen: 9 + 180 + ${3 * (n - 99)} = <b>${nf(juist)}</b>.`,
      terugkijken:`Let op: van 100 tot ${n} zijn er ${n} − 100 + 1 = ${n - 99} getallen, niet ${n - 100}.` } };
} });

T({ id:'v12', h:'vereenv', niv:3, bron:'Wallabie 2019', maak(R){
  const Q = R.int(150, 260), x = R.int(40, Q - 30), P = 4 * Q - x;
  return { tekst:`<p>Een trein heeft 18 rijtuigen achter elkaar. In de trein zitten ${P} reizigers. In elke groep van 5 rijtuigen die op elkaar volgen, zitten samen precies ${Q} reizigers.</p><p><b>Hoeveel reizigers zitten er samen in de twee middelste rijtuigen?</b></p>`,
    mc:opties(R, x, [Math.round(P / 9), Math.round(2 * Q / 5), P - 3 * Q, x + 7, 2 * Q - (P - 2 * Q) + 10]),
    uitw:{ begrijpen:'Rijtuig 1 tot 18. De middelste twee zijn rijtuig 9 en 10.',
      plannen:'Vereenvoudig: streep groepen van 5 weg waarvan je de som kent.',
      uitvoeren:`Rijtuig 1–5 en 14–18: samen 2 · ${Q} = ${2 * Q}. Rijtuig 6–13 dus: ${P} − ${2 * Q} = ${P - 2 * Q}.<br>Rijtuig 6–10 = ${Q}, dus rijtuig 11–13 = ${P - 2 * Q} − ${Q} = ${P - 3 * Q}. Op dezelfde manier is rijtuig 9–13 = ${Q}, dus rijtuig 6–8 = ${P - 3 * Q}.<br>Rijtuig 9 en 10: ${P - 2 * Q} − ${P - 3 * Q} − ${P - 3 * Q} = <b>${x}</b>.`,
      terugkijken:`Controle: 6–8 (${P - 3 * Q}) + 9–10 (${x}) + 11–13 (${P - 3 * Q}) = ${P - 2 * Q}. ✓` } };
} });

/* ============================================================
   HEURISTIEK 3 · UITPROBEREN VAN VERSCHILLENDE OPLOSSINGEN
   ============================================================ */
const probeerTabel = (koppen, rijen) => `<table class="dtable probeer"><thead><tr>${koppen.map(k=>`<th>${k}</th>`).join('')}</tr></thead><tbody>${rijen.map(r=>`<tr${r.ok ? ' class="ok-rij"' : ''}>${r.c.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
function piramideSvg(rijen, o = {}){
  /* rijen: van boven naar onder, elk een lijst teksten */
  const bw = 54, bh = 32, n = rijen.length, W = n * bw + 10; let s = '';
  rijen.forEach((r, i)=>{ const y = 6 + i * bh, x0 = 5 + (n - r.length) * bw / 2;
    r.forEach((t, j)=>{ const vraag = t === '?'; s += rh(x0 + j * bw, y, bw, bh, { f:vraag ? 'rgba(252,175,23,.45)' : (o.kleur && o.kleur(i, j)) || 'var(--card)', k:'var(--ink)', w:1.5 }) + tekst(x0 + j * bw + bw / 2, y + bh / 2 + 1, t, { s:15 }); }); });
  return svg(W, n * bh + 12, s, { b:Math.min(260, W * 1.15), label:'getallenpiramide' });
}

T({ id:'u01', h:'uitpr', niv:1, bron:'een leeftijdsraadsel', maak(R){
  const z = R.int(5, 14), k = R.int(2, 5), S = (k + 1) * z, [v, w, zz] = R.pick([['mama', 'dochter', 'haar'], ['papa', 'zoon', 'zijn'], ['oma', 'kleinzoon', 'haar'], ['opa', 'kleindochter', 'zijn']]);
  const kw = ['', '', 'twee', 'drie', 'vier', 'vijf'][k];
  return { tekst:`<p>Een ${v} is ${kw} keer zo oud als ${zz} ${w}. Samen zijn ze ${S} jaar.</p><p><b>Hoe oud is de ${w}?</b></p>`,
    mc:opties(R, z, [Math.round(S / k), z + 2, z - 2, z + 3, z + 1]),
    hint:[{ fase:'plannen', vraag:`Probeer de ${w} ${z + 2} jaar. Hoe oud is de ${v} dan?`, ans:k * (z + 2) },
      { fase:'uitvoeren', vraag:'Hoe oud zijn ze dan samen?', ans:(k + 1) * (z + 2), meer:`Is dat te veel of te weinig? Probeer dan een jongere of oudere ${w}.` },
      { fase:'uitvoeren', vraag:`Hoe oud is de ${w}?`, ans:z }],
    uitw:{ begrijpen:`De ${v} is ${k} keer zo oud. Samen ${S} jaar.`,
      plannen:'Probeer de antwoordmogelijkheden één voor één en controleer.',
      uitvoeren:probeerTabel([w, v, 'samen'], [z + 2, z, z - 2].sort((a, b)=>a - b).map(x=>({ c:[x, k * x, (k + 1) * x + (x === z ? ' ✓' : (k + 1) * x > S ? ' te veel' : ' te weinig')], ok:x === z }))) + `De ${w} is <b>${z} jaar</b>.`,
      terugkijken:`Controle: ${z} + ${k * z} = ${S} en ${k * z} = ${k} · ${z}. ✓` } };
} });

T({ id:'u02', h:'uitpr', niv:1, bron:'het kippen-en-konijnenprobleem', maak(R){
  const K = R.int(10, 24), r = R.int(2, K - 3), P = 2 * K + 2 * r;
  return { tekst:`<p>Op een boerderij lopen kippen en konijnen rond. Samen zijn het ${K} dieren met in totaal ${P} poten.</p><p><b>Hoeveel konijnen zijn er?</b></p>`,
    mc:opties(R, r, [K - r, r + 1, r - 1, Math.round(P / 4), r + 2], { min:1 }),
    hint:[{ fase:'plannen', vraag:'Stel dat alle dieren kippen zijn. Hoeveel poten zijn dat?', ans:2 * K },
      { fase:'uitvoeren', vraag:'Hoeveel poten komen er bij als je één kip vervangt door een konijn?', ans:2 },
      { fase:'uitvoeren', vraag:'Hoeveel konijnen moet je dus nemen?', ans:r }],
    uitw:{ begrijpen:`${K} dieren, ${P} poten. Een kip heeft 2 poten, een konijn 4.`,
      plannen:'Probeer een aantal konijnen en tel de poten. Stuur bij.',
      uitvoeren:probeerTabel(['konijnen', 'kippen', 'poten'], [r - 1, r, r + 1].map(x=>({ c:[x, K - x, 4 * x + 2 * (K - x) + (x === r ? ' ✓' : '')], ok:x === r }))) + `Elk extra konijn geeft 2 poten meer. Het juiste aantal is <b>${r} konijnen</b>.`,
      terugkijken:`${r} · 4 + ${K - r} · 2 = ${4 * r} + ${2 * (K - r)} = ${P}. ✓` } };
} });

T({ id:'u03', h:'uitpr', niv:1, bron:'een spaarraadsel', maak(R){
  const k = R.int(8, 40), D = R.int(3, 15), g = k + D, S = g + k, [a, b] = [R.meisje(), R.jongen()];
  return { tekst:`<p>${a} en ${b} sparen. Samen hebben ze ${S} euro. ${a} heeft ${D} euro meer dan ${b}.</p><p><b>Hoeveel euro heeft ${a}?</b></p>`,
    getal:g, eenheid:'euro',
    hint:[{ fase:'plannen', vraag:`Probeer: ${b} heeft ${k - 2} euro. Hoeveel heeft ${a} dan?`, ans:k - 2 + D, eenheid:'euro' },
      { fase:'uitvoeren', vraag:'Hoeveel hebben ze dan samen? Is dat genoeg?', ans:2 * (k - 2) + D, eenheid:'euro', meer:`Komt er ${S} uit? Zo niet, geef ${b} wat meer.` },
      { fase:'uitvoeren', vraag:`Hoeveel heeft ${b} echt?`, ans:k, eenheid:'euro' }],
    uitw:{ begrijpen:`Samen ${S} euro, het verschil is ${D} euro.`,
      plannen:`Probeer een bedrag voor ${b}, reken ${a} uit en kijk of de som klopt.`,
      uitvoeren:probeerTabel([b, a, 'samen'], [k - 2, k - 1, k].map(x=>({ c:[x, x + D, 2 * x + D + (x === k ? ' ✓' : '')], ok:x === k }))) + `${a} heeft <b>${g} euro</b>.`,
      terugkijken:`Slim: neem de ${D} euro weg, dan hebben ze evenveel: (${S} − ${D}) : 2 = ${k}. ✓` } };
} });

T({ id:'u04', h:'uitpr', niv:1, bron:'een muntprobleem', maak(R){
  const n5 = R.int(2, 8), n2 = R.int(2, 10), B = 5 * n5 + 2 * n2, n = n5 + n2, nm = R.naam();
  return { tekst:`<p>${nm} betaalt ${B} euro met enkel munten van 2 euro en biljetten van 5 euro. ${nm} gebruikt ${n} stuks in totaal.</p><p><b>Hoeveel biljetten van 5 euro gebruikt ${nm}?</b></p>`,
    mc:opties(R, n5, [n2, n5 + 1, n5 - 1, n5 + 2, Math.floor(B / 5)], { min:0 }),
    hint:[{ fase:'plannen', vraag:`Probeer 1 biljet van 5 euro. Hoeveel munten van 2 euro heb je dan?`, ans:n - 1 },
      { fase:'uitvoeren', vraag:'Hoeveel euro is dat samen?', ans:5 + 2 * (n - 1), eenheid:'euro', meer:'Elk biljet van 5 euro in plaats van een munt van 2 euro brengt 3 euro meer op.' }],
    uitw:{ begrijpen:`${n} stuks, samen ${B} euro.`,
      plannen:'Probeer de mogelijkheden en controleer het bedrag.',
      uitvoeren:probeerTabel(['biljetten van 5', 'munten van 2', 'bedrag'], [n5 - 1, n5, n5 + 1].map(x=>({ c:[x, n - x, 5 * x + 2 * (n - x) + (x === n5 ? ' ✓' : '')], ok:x === n5 }))) + `Antwoord: <b>${n5} biljetten</b>.`,
      terugkijken:`${n5} · 5 + ${n2} · 2 = ${5 * n5} + ${2 * n2} = ${B}. ✓` } };
} });

T({ id:'u05', h:'uitpr', niv:2, bron:'Wallabie 2016', maak(R){
  const p = R.pick([3, 4]), x = R.pick([2, 4, 6]), j = p * x, m = 2 * x, n = j + m, frac = p === 3 ? 'een derde' : 'een vierde';
  return { tekst:`<p>In een klas zitten ${n} leerlingen, telkens per twee naast elkaar. Precies ${frac} van de jongens zit naast een meisje. Precies de helft van de meisjes zit naast een jongen.</p><p><b>Hoeveel jongens zitten er in de klas?</b></p>`,
    mc:opties(R, j, [m, n / 2, j + p, j - p, j + 2].filter(v=>v < n && v > 0)),
    hint:[{ fase:'begrijpen', vraag:`Door welk getal moet het aantal jongens zeker deelbaar zijn?`, ans:p },
      { fase:'plannen', vraag:`Probeer de keuze ${j}. Hoeveel meisjes zijn er dan?`, ans:m },
      { fase:'uitvoeren', vraag:`Hoeveel jongens zitten dan naast een meisje?`, ans:x, meer:'Elke jongen die naast een meisje zit, vormt een gemengd bankje. Er zijn dus evenveel meisjes naast een jongen als jongens naast een meisje.' }],
    uitw:{ begrijpen:`${n} leerlingen in ${n / 2} bankjes. In een gemengd bankje zitten één jongen en één meisje.`,
      plannen:'Probeer de antwoordkeuzes. Het aantal jongens moet deelbaar zijn door ' + p + ', het aantal meisjes door 2.',
      uitvoeren:`Probeer ${j} jongens: dan ${m} meisjes. ${frac[0].toUpperCase() + frac.slice(1)} van ${j} = ${x} jongens zitten naast een meisje, dus ${x} gemengde bankjes en ${x} meisjes naast een jongen. De helft van ${m} is ${x}. ✓ Antwoord: <b>${j} jongens</b>.`,
      terugkijken:`Bankjes: ${x} gemengd, ${(j - x) / 2} met twee jongens, ${(m - x) / 2} met twee meisjes: ${x} + ${(j - x) / 2} + ${(m - x) / 2} = ${n / 2} bankjes. ✓` } };
} });

T({ id:'u06', h:'uitpr', niv:2, bron:'een getallenpiramide', maak(R){
  const a = R.int(2, 15), c = R.int(2, 15), x = R.int(2, 15), T_ = a + 2 * x + c;
  return { tekst:`<p>In deze getallenpiramide is elke steen de som van de twee stenen eronder.</p><p><b>Welk getal hoort op de gekleurde steen?</b></p>`,
    fig:piramideSvg([[T_], ['', ''], [a, '?', c]]),
    mc:opties(R, x, [T_ - a - c, (T_ - a - c) / 2 + 1, x + 2, x - 2, x + 1], { min:1 }),
    hint:[{ fase:'plannen', vraag:`Probeer ${x + 2} op de gekleurde steen. Wat komt er dan bovenaan?`, ans:a + 2 * (x + 2) + c },
      { fase:'uitvoeren', vraag:'Te veel of te weinig? Welk getal past wel?', ans:x }],
    uitw:{ begrijpen:`Onderaan ${a}, ?, ${c}. Bovenaan ${T_}.`,
      plannen:'Probeer een getal, reken de piramide uit en stuur bij.',
      uitvoeren:`Met ? = ${x}: middelste rij ${a + x} en ${x + c}, bovenaan ${a + x} + ${x + c} = ${T_}. ✓ Antwoord: <b>${x}</b>.` + piramideSvg([[T_], [a + x, x + c], [a, x, c]]),
      terugkijken:`De middelste steen telt twee keer mee bovenaan: ${a} + 2 · ${x} + ${c} = ${T_}. Elke 1 erbij geeft 2 meer bovenaan.` } };
} });

T({ id:'u07', h:'uitpr', niv:2, bron:'JWO 2019', maak(R){
  const r = R.pick([2, 2, 3]), c = R.int(3, 6), juist = Math.ceil(r * c / 2), nm = R.pick(['Boer Teun', 'Boerin Ann', 'Boer Rik']);
  let s = rh(4, 4, c * 40 + 8, r * 40 + 8, { f:'#c9b48a', k:'var(--ink)', rx:8 });
  for(let i = 0; i < c; i++) for(let j = 0; j < r; j++) s += `<ellipse cx="${28 + i * 40}" cy="${28 + j * 40}" rx="14" ry="17" fill="#fffaf0" stroke="var(--ink)" stroke-width="1.2"/>`;
  return { tekst:`<p>${nm} legt witte en bruine eieren in de doos van de tekening (${r} rijen van ${c}). Twee bruine eieren mogen niet naast elkaar liggen: niet links of rechts van elkaar en niet boven of onder elkaar.</p><p><b>Hoeveel bruine eieren kan er hoogstens in de doos?</b></p>`,
    fig:svg(c * 40 + 16, r * 40 + 16, s, { b:Math.min(250, c * 50), label:'eierdoos' }),
    mc:opties(R, juist, [r * c / 2 + 1, c, juist - 1, juist + 1, r * c - 1], { min:1 }),
    hint:[{ fase:'plannen', vraag:'Probeer: leg om en om een bruin ei, zoals de zwarte vakjes van een dambord. Hoeveel zijn dat?', ans:juist },
      { fase:'terugkijken', vraag:'Kan er nog één bruin ei bij? Typ ja of nee.', ans:['nee'] }],
    uitw:{ begrijpen:`${r} · ${c} = ${r * c} plaatsen. Bruine eieren mogen geen zijde delen.`,
      plannen:'Probeer verschillende manieren en kijk welke het meeste bruine eieren geeft.',
      uitvoeren:`Om en om, zoals een dambord: ${juist} bruine eieren.` + svg(c * 40 + 16, r * 40 + 16, rh(4, 4, c * 40 + 8, r * 40 + 8, { f:'#c9b48a', k:'var(--ink)', rx:8 }) + Array.from({ length:c * r }, (_, k)=>{ const i = k % c, j = Math.floor(k / c); return `<ellipse cx="${28 + i * 40}" cy="${28 + j * 40}" rx="14" ry="17" fill="${(i + j) % 2 === 0 ? '#9a5b2c' : '#fffaf0'}" stroke="var(--ink)" stroke-width="1.2"/>`; }).join(''), { b:Math.min(250, c * 50) }) + `Antwoord: <b>${juist}</b>.`,
      terugkijken:'Meer kan niet: verdeel de doos in paren van twee plaatsen naast elkaar. In elk paar past hoogstens één bruin ei.' } };
} });

const cijfersom = n => String(n).split('').reduce((a, b)=>a + Number(b), 0);
T({ id:'u08', h:'uitpr', niv:2, bron:'een raadsel met voorwaarden', maak(R){
  const even = R.r() < .5, d = R.pick(even ? [3, 4, 6, 7, 9] : [3, 7, 9]);
  const conds = [n=>n % d === 0, null, n=>(n % 2 === 0) === even];
  let ant, s;
  do{ ant = R.int(12, 99) * d; if(ant > 999) continue; s = cijfersom(ant); } while(ant > 999 || ant < 100 || !conds[2](ant));
  conds[1] = n=>cijfersom(n) === s;
  const pool = []; for(let n = 100; n <= 999; n++){ const ok = conds.map(f=>f(n)); const k = ok.filter(Boolean).length; if(k === 2) pool.push({ n, mis:ok.indexOf(false) }); }
  const afl = []; [0, 1, 2, 0].forEach(m=>{ const c = R.shuffle(pool.filter(p=>p.mis === m && !afl.includes(p.n) && Math.abs(p.n - ant) < 300)); if(c.length) afl.push(c[0].n); });
  while(afl.length < 4){ const c = R.pick(pool).n; if(!afl.includes(c)) afl.push(c); }
  const nm = R.naam();
  return { tekst:`<p>${nm} denkt aan een getal van drie cijfers.</p><ul class="kort"><li>Het getal is deelbaar door ${d}.</li><li>De som van de cijfers is ${s}.</li><li>Het getal is ${even ? 'even' : 'oneven'}.</li></ul><p><b>Welk getal kan het zijn?</b></p>`,
    mc:opties(R, ant, afl, { fmt:String }),
    hint:[{ fase:'plannen', vraag:'Probeer de antwoordkeuzes één voor één. Welke cijfersom heeft het getal bij keuze A?', ans:cijfersom(Math.min(ant, ...afl)) },
      { fase:'uitvoeren', vraag:`Controleer elke keuze: is ze deelbaar door ${d}, klopt de cijfersom en is ze ${even ? 'even' : 'oneven'}? Welk getal voldoet aan alle drie?`, ans:ant }],
    uitw:{ begrijpen:'Drie voorwaarden waaraan het getal tegelijk moet voldoen.',
      plannen:'Probeer elke antwoordkeuze en streep weg wat niet klopt.',
      uitvoeren:probeerTabel(['getal', `deelbaar door ${d}`, `cijfersom ${s}`, even ? 'even' : 'oneven'], [ant, ...afl].sort((a, b)=>a - b).map(n=>({ c:[n, ...conds.map(f=>f(n) ? '✓' : '✗')], ok:n === ant }))) + `Enkel <b>${ant}</b> voldoet aan alle drie.`,
      terugkijken:`${ant} : ${d} = ${ant / d} en ${String(ant).split('').join(' + ')} = ${s}. ✓` } };
} });

T({ id:'u09', h:'uitpr', niv:2, bron:'een dobbelsteenraadsel', maak(R){
  const triples = []; for(let a = 1; a <= 6; a++) for(let b = a + 1; b <= 6; b++) for(let c = b + 1; c <= 6; c++) triples.push([a, b, c]);
  let t, som, prod;
  do{ t = R.pick(triples); som = t[0] + t[1] + t[2]; prod = t[0] * t[1] * t[2]; } while(triples.filter(u=>u[0] + u[1] + u[2] === som && u[0] * u[1] * u[2] === prod).length !== 1 || t[2] < 2);
  const nm = R.naam();
  return { tekst:`<p>${nm} gooit met drie dobbelstenen. De drie dobbelstenen tonen elk een ander aantal ogen. Opgeteld zijn het ${som} ogen. Vermenigvuldigd geeft het ${prod}.</p><p><b>Wat is het grootste aantal ogen dat ${nm} gooide?</b></p>`,
    mc:vast(['2', '3', '4', '5', '6'], t[2] - 2),
    hint:[{ fase:'plannen', vraag:`Probeer: stel dat het grootste aantal 6 is. Welke som moeten de andere twee dan hebben?`, ans:som - 6 },
      { fase:'uitvoeren', vraag:'Typ de drie aantallen ogen van klein naar groot, met een spatie ertussen.', ans:[t.join(' '), t.join(', '), t.join(','), t.join('-')] }],
    uitw:{ begrijpen:`Drie verschillende getallen van 1 tot 6. Som ${som}, product ${prod}.`,
      plannen:'Probeer drietallen met de juiste som en controleer het product.',
      uitvoeren:probeerTabel(['ogen', 'som', 'product'], triples.filter(u=>u[0] + u[1] + u[2] === som).map(u=>({ c:[u.join(', '), som, u[0] * u[1] * u[2] + (u === t ? ' ✓' : '')], ok:u === t }))) + `Het grootste aantal is <b>${t[2]}</b>.`,
      terugkijken:'Door systematisch alle drietallen met die som te proberen, ben je zeker dat er maar één oplossing is.' } };
} });

T({ id:'u10', h:'uitpr', niv:3, bron:'JWO 2018', maak(R){
  const N = 5; let types, uitspr, eLf;
  /* uitspraken: soort en waarheid voor een toewijzing a (true = elf) */
  const soorten = i => { const s = [];
    if(i === 0 || i === N - 1){ const j = i === 0 ? 1 : N - 2; s.push({ t:'Mijn buur is een trol.', f:a=>!a[j] }, { t:'Mijn buur is een elf.', f:a=>a[j] }); }
    else { s.push({ t:'Mijn buren zijn allebei trollen.', f:a=>!a[i - 1] && !a[i + 1] }, { t:'Mijn buren zijn allebei elfen.', f:a=>a[i - 1] && a[i + 1] }, { t:'Ik heb een elf en een trol als buur.', f:a=>a[i - 1] !== a[i + 1] }); }
    return s; };
  const alle = []; for(let m = 0; m < 32; m++) alle.push(Array.from({ length:N }, (_, i)=>!!(m >> i & 1)));
  let poging = 0;
  do{
    types = Array.from({ length:N }, ()=>R.r() < .5);
    uitspr = types.map((e, i)=>{ const opt = soorten(i).filter(s=>s.f(types) === e); return opt.length ? R.pick(opt) : null; });
    if(uitspr.includes(null)){ eLf = -1; poging++; continue; }
    const sols = alle.filter(a=>a.every((e, i)=>uitspr[i].f(a) === e));
    const aantallen = new Set(sols.map(a=>a.filter(Boolean).length));
    eLf = sols.length && aantallen.size === 1 ? [...aantallen][0] : -1;
    poging++;
  } while((eLf < 1) && poging < 500);
  if(eLf < 1){ types = [false, true, false, true, true]; uitspr = [soorten(0)[0], soorten(1)[2], soorten(2)[1], soorten(3)[2], soorten(4)[1]]; eLf = 3; }
  const ordin = ['eerste', 'tweede', 'derde', 'vierde', 'vijfde'];
  return { tekst:`<p>In sprookjesland liegen trollen altijd en spreken elfen altijd de waarheid. Vijf van hen staan naast elkaar op een rij.</p><ul class="kort">${uitspr.map((u, i)=>`<li>De ${ordin[i]} zegt: “${u.t}”</li>`).join('')}</ul><p><b>Hoeveel elfen staan er in de rij?</b></p>`,
    mc:vast(['1', '2', '3', '4', '5'], eLf - 1),
    uitw:{ begrijpen:'Elk wezen is een elf (waarheid) of een trol (liegt). Wat iemand zegt, moet kloppen met wat hij is.',
      plannen:'Probeer: begin bij de eerste. Stel dat hij een elf is en kijk of alles klopt. Zo niet, probeer een trol.',
      uitvoeren:`Een oplossing die klopt: ${types.map((e, i)=>`${ordin[i]} = ${e ? '<b>elf</b>' : 'trol'}`).join(', ')}. Controleer: wat elfen zeggen is waar, wat trollen zeggen is niet waar. Er zijn <b>${eLf} elfen</b>.`,
      terugkijken:'Probeer ook eens een andere start (bv. de eerste is een elf in plaats van een trol): dan loop je vast of kom je opnieuw op hetzelfde aantal elfen uit.' } };
} });

T({ id:'u11', h:'uitpr', niv:3, bron:'VWO 2017', maak(R){
  const a = R.int(1, 9), b = R.int(1, 9), c = R.int(1, 9), d = R.int(1, 9), top = a + 3 * b + 3 * c + d;
  return { tekst:`<p>In deze getallenpiramide is elke steen de som van de twee stenen eronder.</p><p><b>Welk getal hoort op de gekleurde steen?</b></p>`,
    fig:piramideSvg([[top], ['', ''], ['', '', ''], [a, '?', c, d]]),
    mc:opties(R, b, [b + 1, b - 1, b + 3, Math.round((top - a - c - d) / 4), b + 2], { min:0 }),
    uitw:{ begrijpen:`Onderaan ${a}, ?, ${c}, ${d}. Bovenaan ${top}.`,
      plannen:'Probeer een getal op de gekleurde steen, reken naar boven en stuur bij.',
      uitvoeren:`Met ? = ${b}: rij 3: ${a + b}, ${b + c}, ${c + d}; rij 2: ${a + 2 * b + c}, ${b + 2 * c + d}; top: ${top}. ✓ Antwoord: <b>${b}</b>.` + piramideSvg([[top], [a + 2 * b + c, b + 2 * c + d], [a + b, b + c, c + d], [a, b, c, d]]),
      terugkijken:`De gekleurde steen telt 3 keer mee in de top: ${a} + 3 · ${b} + 3 · ${c} + ${d} = ${top}. Eén meer op de steen geeft dus 3 meer bovenaan.` } };
} });

T({ id:'u12', h:'uitpr', niv:3, bron:'een magisch vierkant', maak(R){
  let g = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
  const rot = m => m[0].map((_, i)=>m.map(r=>r[i]).reverse());
  for(let i = R.int(0, 3); i > 0; i--) g = rot(g); if(R.r() < .5) g = g.map(r=>r.slice().reverse());
  const m = R.int(1, 3), k = R.int(0, 12); g = g.map(r=>r.map(v=>v * m + k));
  const M = g[0][0] + g[0][1] + g[0][2], juist = g[2][1];
  const toon = [[g[0][0], g[0][1], g[0][2]], ['', g[1][1], ''], ['', '?', '']];
  const c = 46; let s = '';
  toon.forEach((r, i)=>r.forEach((v, j)=>{ s += rh(5 + j * c, 5 + i * c, c, c, { f:v === '?' ? 'rgba(252,175,23,.45)' : 'var(--card)', k:'var(--ink)', w:1.5 }) + tekst(5 + j * c + c / 2, 5 + i * c + c / 2 + 1, v, { s:17 }); }));
  return { tekst:`<p>In dit magisch vierkant is de som van elke rij, elke kolom en elke diagonaal dezelfde.</p><p><b>Welk getal hoort op het gekleurde vakje?</b></p>`,
    fig:svg(3 * c + 10, 3 * c + 10, s, { b:150, label:'magisch vierkant' }),
    mc:opties(R, juist, [M - g[0][1] - g[1][1], g[0][1], juist + m, juist - m, M - juist], { min:0 }),
    uitw:{ begrijpen:`De bovenste rij is volledig: de som is ${g[0][0]} + ${g[0][1]} + ${g[0][2]} = ${M}.`,
      plannen:'Probeer vakjes te vinden waar maar één getal ontbreekt in een rij, kolom of diagonaal. Vul die eerst in.',
      uitvoeren:`Diagonaal van linksboven: ${M} − ${g[0][0]} − ${g[1][1]} = ${g[2][2]} rechtsonder. Diagonaal van rechtsboven: ${M} − ${g[0][2]} − ${g[1][1]} = ${g[2][0]} linksonder. Onderste rij: ${M} − ${g[2][0]} − ${g[2][2]} = <b>${juist}</b>.`,
      terugkijken:`Controle met de middelste kolom: ${g[0][1]} + ${g[1][1]} + ${juist} = ${M}. ✓` } };
} });

/* ============================================================
   HEURISTIEK 4 · EEN PATROON ZOEKEN
   ============================================================ */
const lucifer = (x1, y1, x2, y2) => lijn(x1, y1, x2, y2, { k:'#d9a441', w:4 }) + cirkel(x2, y2, 3.2, { f:'var(--bad)', k:'none', w:0 });
function luciferFig(soort, n){
  const a = 22; let s = '', W = 0;
  if(soort === 'vierkant'){ for(let i = 0; i <= n; i++) s += lucifer(4 + i * a, 4 + a, 4 + i * a, 4); for(let i = 0; i < n; i++) s += lucifer(4 + i * a, 4, 4 + (i + 1) * a, 4) + lucifer(4 + i * a, 4 + a, 4 + (i + 1) * a, 4 + a); W = n * a + 8; return { s, W, H:a + 8 }; }
  if(soort === 'driehoek'){ const h = a * .866, E = new Map();
    for(let i = 0; i < n; i++){ const x = 4 + i * a / 2, up = i % 2 === 0, P = up ? [[x, 4 + h], [x + a, 4 + h], [x + a / 2, 4]] : [[x, 4], [x + a, 4], [x + a / 2, 4 + h]];
      [[0, 1], [1, 2], [2, 0]].forEach(([u, v])=>{ const k = [P[u], P[v]].map(q=>q.map(z=>Math.round(z))).sort().join('|'); if(!E.has(k)) E.set(k, [P[u], P[v]]); }); }
    E.forEach(([p1, p2])=>{ s += lucifer(p1[0], p1[1], p2[0], p2[1]); });
    W = (n + 1) * a / 2 + 8; return { s, W, H:h + 8 }; }
  /* huisjes */
  const h = a, r = a * .6; for(let i = 0; i <= n; i++) s += lucifer(4 + i * a, 4 + r + h, 4 + i * a, 4 + r);
  for(let i = 0; i < n; i++) s += lucifer(4 + i * a, 4 + r + h, 4 + (i + 1) * a, 4 + r + h) + lucifer(4 + i * a, 4 + r, 4 + i * a + a / 2, 4) + lucifer(4 + (i + 1) * a, 4 + r, 4 + i * a + a / 2, 4);
  W = n * a + 8; return { s, W, H:r + h + 8 };
}
function rijFiguren(maak, nrs){
  let s = '', x = 0; const items = nrs.map(n=>maak(n)); const H = Math.max(...items.map(i=>i.H));
  items.forEach((it, i)=>{ const w = Math.max(it.W, 52), dx = (w - it.W) / 2; s += `<g transform="translate(${x + dx},${H - it.H})">${it.s}</g>` + tekst(x + w / 2, H + 14, 'figuur ' + nrs[i], { s:12, wt:400 }); x += w + 22; });
  return svg(x, H + 24, s, { b:Math.min(330, x * 1.1), label:'rij figuren' });
}

T({ id:'p01', h:'patroon', niv:1, bron:'Wallabie 2009', maak(R){
  const soort = R.pick(['vierkant', 'driehoek', 'huisje']), per = { vierkant:3, driehoek:2, huisje:5 }[soort], k = R.int(10, 30), M = n=>per * n + 1;
  const wat = { vierkant:'vierkantjes', driehoek:'driehoekjes', huisje:'huisjes' }[soort];
  return { tekst:`<p>Met lucifers leg je een rij ${wat}. Je ziet de eerste drie figuren.</p><p><b>Hoeveel lucifers heb je nodig voor figuur ${k}?</b></p>`,
    fig:rijFiguren(n=>luciferFig(soort, n), [1, 2, 3]),
    getal:M(k), eenheid:'lucifers',
    hint:[{ fase:'begrijpen', vraag:'Hoeveel lucifers tel je in figuur 1, 2 en 3? Typ het aantal van figuur 3.', ans:M(3) },
      { fase:'plannen', vraag:'Hoeveel lucifers komen er telkens bij?', ans:per },
      { fase:'uitvoeren', vraag:`Figuur 1 heeft ${M(1)} lucifers. Hoeveel keer komen er ${per} bij tot figuur ${k}?`, ans:k - 1 }],
    uitw:{ begrijpen:`Figuur 1: ${M(1)}, figuur 2: ${M(2)}, figuur 3: ${M(3)} lucifers.`,
      plannen:`Zoek een patroon: er komen telkens ${per} lucifers bij.`,
      uitvoeren:`Figuur ${k} = ${M(1)} + ${k - 1} · ${per} = <b>${M(k)}</b>.<br>Korter: elk ${wat.replace(/jes$/, 'je')} kost ${per} lucifers, plus 1 lucifer om te starten: ${per} · ${k} + 1 = ${M(k)}.`,
      terugkijken:`Controle met figuur 3: ${per} · 3 + 1 = ${M(3)}. ✓` } };
} });

const KLEUR = { rood:'#d64545', blauw:'#3d6fd1', geel:'#f2c230', groen:'#3a9a5b', wit:'#ffffff', zwart:'#222222', paars:'#8a4fc0' };
T({ id:'p02', h:'patroon', niv:1, bron:'een kralenketting', maak(R){
  const p = R.int(3, 5), kl = Object.keys(KLEUR); const basis = R.kies(kl, R.int(2, 3)); let pat;
  do{ pat = Array.from({ length:p }, ()=>R.pick(basis)); } while(new Set(pat).size < 2 || pat[0] === pat[p - 1] && new Set(pat).size === 1);
  const k = R.int(40, 150), juist = pat[(k - 1) % p], nm = R.meisje();
  let s = ''; for(let i = 0; i < 2 * p; i++) s += cirkel(14 + i * 24, 18, 10, { f:KLEUR[pat[i % p]], k:'var(--ink)', w:1.5 }); s += tekst(14 + 2 * p * 24 + 4, 18, '…', { s:20 });
  const anders = kl.filter(c=>c !== juist);
  return { tekst:`<p>${nm} rijgt kralen aan een ketting. Ze herhaalt steeds hetzelfde patroon. Zo begint de ketting:</p>${svg(2 * p * 24 + 30, 36, s, { b:Math.min(330, 2 * p * 24 + 30), label:'kralen' })}<p><b>Welke kleur heeft kraal nummer ${k}?</b></p>`,
    mc:opties(R, juist, R.shuffle(basis.filter(c=>c !== juist)).concat(R.shuffle(anders)), { fmt:String }),
    hint:[{ fase:'begrijpen', vraag:'Na hoeveel kralen begint het patroon opnieuw?', ans:p },
      { fase:'uitvoeren', vraag:`Deel ${k} door ${p}. Hoeveel is de rest?`, ans:k % p, meer:`Rest 0 betekent: de laatste kraal van het patroon. Rest 1: de eerste kraal, enzovoort.` }],
    uitw:{ begrijpen:`Het patroon ${pat.join(' – ')} herhaalt zich.`,
      plannen:`Zoek het patroon: na elke ${p} kralen begint het opnieuw.`,
      uitvoeren:`${k} : ${p} = ${Math.floor(k / p)} rest ${k % p}. Na ${Math.floor(k / p)} volledige patronen is ${k % p === 0 ? 'kraal ' + k + ' de laatste kraal van een patroon' : 'kraal ' + k + ' de ' + (k % p) + 'de kraal van een nieuw patroon'}: <b>${juist}</b>.`,
      terugkijken:`Controle: kraal ${p + ((k - 1) % p) + 1} heeft dezelfde kleur, en die kan je op de tekening tellen.` } };
} });

const DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
T({ id:'p03', h:'patroon', niv:1, bron:'een kalenderprobleem', maak(R){
  const d = R.int(0, 6), N = R.int(30, 400), juist = DAGEN[(d + N) % 7];
  return { tekst:`<p>Vandaag is het ${DAGEN[d]}.</p><p><b>Welke dag is het over ${N} dagen?</b></p>`,
    mc:opties(R, juist, [DAGEN[(d + N + 1) % 7], DAGEN[(d + N + 6) % 7], DAGEN[d], DAGEN[(d + N + 2) % 7], DAGEN[(d + N + 5) % 7]].filter((x, i, a)=>x !== juist && a.indexOf(x) === i), { fmt:String }),
    hint:[{ fase:'begrijpen', vraag:'Na hoeveel dagen is het opnieuw dezelfde dag?', ans:7 },
      { fase:'uitvoeren', vraag:`Deel ${N} door 7. Hoeveel is de rest?`, ans:N % 7 }],
    uitw:{ begrijpen:`Vandaag ${DAGEN[d]}, we tellen ${N} dagen verder.`,
      plannen:'Zoek het patroon: om de 7 dagen is het weer dezelfde dag.',
      uitvoeren:`${N} : 7 = ${Math.floor(N / 7)} rest ${N % 7}. Na ${Math.floor(N / 7)} weken is het weer ${DAGEN[d]}. Nog ${N % 7} dag${N % 7 === 1 ? '' : 'en'} verder: <b>${juist}</b>.`,
      terugkijken:'Controle: over 7 dagen is het dezelfde dag, over 8 dagen een dag later. Het werkt ook met grote getallen.' } };
} });

T({ id:'p04', h:'patroon', niv:1, bron:'Wallabie 2019', maak(R){
  const b = R.pick([2, 3, 7, 8]), e = R.int(20, 2030), cyc = [1, 2, 3, 4].map(i=>Math.pow(b, i) % 10), juist = cyc[(e - 1) % 4];
  const extra = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x=>!cyc.includes(x));
  return { tekst:`<p>${b}<sup>1</sup> = ${b}, ${b}<sup>2</sup> = ${b * b}, ${b}<sup>3</sup> = ${b ** 3}, …</p><p><b>Op welk cijfer eindigt ${b}<sup>${e}</sup>?</b></p>`,
    mc:opties(R, juist, cyc.concat(R.shuffle(extra)), { geheel:true }),
    hint:[{ fase:'plannen', vraag:`Schrijf het laatste cijfer van ${b}<sup>1</sup>, ${b}<sup>2</sup>, ${b}<sup>3</sup>, ${b}<sup>4</sup>, ${b}<sup>5</sup> op. Op welk cijfer eindigt ${b}<sup>5</sup>?`, ans:cyc[0], meer:'Voor het laatste cijfer moet je enkel het laatste cijfer van de vorige macht met ' + b + ' vermenigvuldigen.' },
      { fase:'uitvoeren', vraag:`Het patroon herhaalt zich om de 4. Hoeveel is de rest van ${e} : 4?`, ans:e % 4 }],
    uitw:{ begrijpen:`Gevraagd: het laatste cijfer van een heel grote macht.`,
      plannen:'Zoek een patroon in de laatste cijfers van de eerste machten.',
      uitvoeren:`Laatste cijfers: ${cyc.join(', ')}, ${cyc.join(', ')}, … Het patroon herhaalt zich om de 4.<br>${e} : 4 = ${Math.floor(e / 4)} rest ${e % 4}. Dus ${b}<sup>${e}</sup> eindigt zoals ${b}<sup>${e % 4 || 4}</sup>: op <b>${juist}</b>.`,
      terugkijken:`Rest 0 hoort bij de 4de plaats in het patroon (zoals ${b}<sup>4</sup>), niet bij de eerste.` } };
} });

T({ id:'p05', h:'patroon', niv:2, bron:'JWO 2014', maak(R){
  const w = R.pick(['KAT', 'ZON', 'BOS', 'MUS', 'PEN', 'DAK', 'VIS', 'HUT']), N = R.int(100, 2100), nm = R.naam();
  const stap = (s, i)=> i % 2 === 1 ? s[0] + s[2] + s[1] : s[1] + s[0] + s[2];
  const rij = [w]; for(let i = 1; i <= 6; i++) rij.push(stap(rij[i - 1], i));
  const juist = rij[N % 6];
  const alle = [w, w[0] + w[2] + w[1], w[1] + w[0] + w[2], w[1] + w[2] + w[0], w[2] + w[0] + w[1], w[2] + w[1] + w[0]];
  return { tekst:`<p>${nm} verwisselt in het woord ${w} eerst de laatste twee letters: ${rij[1]}. Dan de eerste twee: ${rij[2]}. Dan weer de laatste twee, dan weer de eerste twee, enzovoort.</p><p><b>Welk woord heeft ${nm} na ${N} verwisselingen?</b></p>`,
    mc:opties(R, juist, R.shuffle(alle.filter(x=>x !== juist)), { fmt:String }),
    hint:[{ fase:'plannen', vraag:'Schrijf de woorden na stap 1 tot 6 op. Welk woord krijg je na stap 6?', ans:[w] },
      { fase:'uitvoeren', vraag:`Om de hoeveel stappen komt hetzelfde woord terug?`, ans:6 },
      { fase:'uitvoeren', vraag:`Hoeveel is de rest van ${N} : 6?`, ans:N % 6 }],
    uitw:{ begrijpen:`Afwisselend de laatste twee en de eerste twee letters verwisselen, ${N} keer.`,
      plannen:`${N} keer uitschrijven kan niet. Schrijf de eerste stappen uit en zoek een patroon.`,
      uitvoeren:`Stap 1: ${rij[1]}, stap 2: ${rij[2]}, stap 3: ${rij[3]}, stap 4: ${rij[4]}, stap 5: ${rij[5]}, stap 6: ${rij[6]}. Na 6 stappen ben je terug bij ${w}.<br>${N} : 6 = ${Math.floor(N / 6)} rest ${N % 6}, dus na ${N} stappen heb je hetzelfde als na ${N % 6} stap${N % 6 === 1 ? '' : 'pen'}: <b>${juist}</b>.`,
      terugkijken:'Met drie letters kan je maar 6 verschillende woorden maken. Je vindt ze hier alle zes, dus het patroon is precies 6 lang.' } };
} });

T({ id:'p06', h:'patroon', niv:2, bron:'JWO 2009', maak(R){
  const f = x=>2 * cijfersom(x); let s0, rij, mu, lam;
  do{ s0 = R.int(1000, 2099); rij = [s0]; while(!rij.slice(0, -1).includes(rij[rij.length - 1])) rij.push(f(rij[rij.length - 1]));
    mu = rij.indexOf(rij[rij.length - 1]); lam = rij.length - 1 - mu; rij.pop(); } while(lam < 2);
  const k = R.int(200, 2099), waarde = n=>{ const i = n - 1; return i < mu ? rij[i] : rij[mu + (i - mu) % lam]; };
  const juist = waarde(k), cyc = rij.slice(mu, mu + lam), v0 = mu + 1;
  return { tekst:`<p>In een rij vakjes staat in elk vakje het dubbel van de som van de cijfers in het vorige vakje.</p><table class="dtable vakjes"><tr><td>${s0}</td><td>${rij[1]}</td><td>${rij[2]}</td><td>…</td></tr></table><p><b>Welk getal staat in vakje ${k}?</b></p>`,
    mc:opties(R, juist, R.shuffle(cyc.filter(x=>x !== juist)).concat([18, 12, 6])),
    hint:[{ fase:'plannen', vraag:'Reken verder: welk getal staat in vakje 4?', ans:rij[3] },
      { fase:'plannen', vraag:'Schrijf verder tot je een getal terugziet. Hoe lang is het stuk dat zich herhaalt?', ans:lam },
      { fase:'uitvoeren', vraag:`Vanaf vakje ${v0} herhaalt het zich. Hoeveel is de rest van (${k} − ${v0}) : ${lam}?`, ans:(k - v0) % lam }],
    uitw:{ begrijpen:`Vakje 1 is ${s0}. Elk volgend vakje: 2 · (som van de cijfers van het vorige).`,
      plannen:'Reken de eerste vakjes uit en zoek een patroon.',
      uitvoeren:`Vakjes: ${rij.concat(cyc).slice(0, mu + lam + 2).join(', ')}, … Vanaf vakje ${v0} herhaalt ${cyc.join(', ')} zich (${lam} getallen).<br>Vakje ${k}: (${k} − ${v0}) : ${lam} = ${Math.floor((k - v0) / lam)} rest ${(k - v0) % lam}, dus het ${(k - v0) % lam + 1}de getal van het patroon: <b>${juist}</b>.`,
      terugkijken:`Controle met een klein vakje: vakje ${v0 + lam} = vakje ${v0} = ${cyc[0]}. ✓` } };
} });

T({ id:'p07', h:'patroon', niv:2, bron:'een klassiek slakkenprobleem', maak(R){
  let D, a, b; do{ a = R.int(3, 7); b = R.int(1, a - 1); D = R.int(a + 4, 30); } while(D % (a - b) === 0 && R.r() < .3);
  const dagen = Math.ceil((D - a) / (a - b)) + 1, dier = R.pick(['slak', 'rups', 'kikker']);
  return { tekst:`<p>Een ${dier} zit op de bodem van een put van ${D} meter diep. Elke dag klimt de ${dier} ${a} meter omhoog, maar elke nacht zakt ${dier === 'kikker' ? 'hij' : 'ze'} ${b} meter terug.</p><p><b>Op welke dag bereikt de ${dier} de bovenrand van de put?</b></p>`,
    mc:opties(R, dagen, [Math.ceil(D / (a - b)), dagen - 1, dagen + 1, Math.ceil(D / a)], { min:1, fmt:v=>'dag ' + v }),
    hint:[{ fase:'plannen', vraag:'Hoeveel meter is de ' + dier + ' hoger na één dag én één nacht?', ans:a - b, eenheid:'m' },
      { fase:'plannen', vraag:'Hoe hoog is de ' + dier + ' op het einde van dag 2 (vóór de nacht)?', ans:(a - b) + a, eenheid:'m' },
      { fase:'uitvoeren', vraag:'Op het einde van welke dag zit de ' + dier + ' voor het eerst op ' + D + ' m of hoger?', ans:dagen, meer:'Pas op: als de ' + dier + ' overdag boven komt, zakt ' + (dier === 'kikker' ? 'hij' : 'ze') + ' niet meer terug.' }],
    uitw:{ begrijpen:`Overdag +${a} m, 's nachts −${b} m. Boven = ${D} m.`,
      plannen:'Schrijf dag per dag op hoe hoog het dier komt en zoek een patroon.',
      uitvoeren:probeerTabel(['dag', 'na de klim', 'na de nacht'], (dagen <= 5 ? Array.from({ length:dagen }, (_, i)=>i + 1) : [1, 2, 3, '…', dagen]).map(dg=>dg === '…' ? { c:['…', '…', '…'] } : { c:[dg, ((dg - 1) * (a - b) + a) + ' m', dg === dagen ? 'boven!' : (dg * (a - b)) + ' m'], ok:dg === dagen })) +
        `Elke dag ${a - b} m hoger. Op het einde van dag ${dagen} haalt de klim ${(dagen - 1) * (a - b) + a} m ≥ ${D} m. Antwoord: <b>dag ${dagen}</b>.`,
      terugkijken:`Wie ${D} : ${a - b} rekent, vergeet dat de ${dier} op de laatste dag niet meer terugzakt.` } };
} });

T({ id:'p08', h:'patroon', niv:2, bron:'Wallabie 2009', maak(R){
  const k = R.int(10, 50), M = n=>4 * (n + 1), c = 9;
  const kader = n=>{ const z = n + 2; let s = ''; for(let i = 0; i < z; i++) for(let j = 0; j < z; j++) if(i === 0 || j === 0 || i === z - 1 || j === z - 1) s += rh(i * c, j * c, c, c, { f:'#222', k:'var(--card)', w:1 }); return { s, W:z * c, H:z * c }; };
  return { tekst:`<p>${R.naam()} maakt met even grote zwarte tegeltjes een rij vierkante kaders. Je ziet de eerste drie figuren.</p><p><b>Hoeveel tegeltjes zijn er nodig voor figuur ${k}?</b></p>`,
    fig:rijFiguren(kader, [1, 2, 3]),
    mc:opties(R, M(k), [4 * k, (k + 2) * (k + 2), 4 * (k + 2), 4 * k + 2, M(k - 1)]),
    hint:[{ fase:'begrijpen', vraag:'Hoeveel tegeltjes heeft figuur 3?', ans:M(3) },
      { fase:'plannen', vraag:'Hoeveel tegeltjes komen er telkens bij?', ans:4 },
      { fase:'uitvoeren', vraag:`Figuur ${k} is een kader met een zijde van hoeveel tegeltjes?`, ans:k + 2 }],
    uitw:{ begrijpen:`Figuur 1: ${M(1)}, figuur 2: ${M(2)}, figuur 3: ${M(3)} tegeltjes.`,
      plannen:'Zoek het patroon: telkens 4 tegeltjes meer (één per zijde).',
      uitvoeren:`Figuur n is een kader van (n + 2) bij (n + 2). Langs elke zijde liggen er n + 1 tegeltjes als je elke hoek maar één keer telt: 4 · (n + 1).<br>Figuur ${k}: 4 · ${k + 1} = <b>${M(k)}</b>.`,
      terugkijken:`Controle met figuur 2: 4 · 3 = 12. Tel maar na. ✓` } };
} });

T({ id:'p09', h:'patroon', niv:2, bron:'Wallaroe 2012', maak(R){
  const f = R.int(2, 4), M = R.int(2 * f + 2, 20), dier = R.pick(['Lars, de gekke mus', 'Pip, het kikkertje', 'Wiebe, de eekhoorn']);
  let pos = 1, n = 0; while(pos < M){ for(let i = 0; i < f && pos < M; i++){ pos++; n++; } if(pos < M){ pos--; n++; } }
  const fw = ['', '', 'twee', 'drie', 'vier'][f];
  return { tekst:`<p>Een hek heeft ${M} paaltjes op een rij. ${dier} zit op het eerste paaltje. ${dier.split(',')[0]} springt ${fw} keer één paaltje naar rechts, dan één paaltje naar links. Dan weer ${fw} keer naar rechts, één naar links, enzovoort.</p><p><b>Na hoeveel sprongen bereikt ${dier.split(',')[0]} voor het eerst het laatste paaltje?</b></p>`,
    mc:opties(R, n, [n - 1, n + 1, M - 1, Math.round((M - 1) * (f + 1) / (f - 1)) + 1, n + 2], { min:1 }),
    hint:[{ fase:'plannen', vraag:`Hoeveel paaltjes is ${dier.split(',')[0]} verder na één reeks van ${f + 1} sprongen?`, ans:f - 1 },
      { fase:'uitvoeren', vraag:'Op welk paaltje zit het dier na 2 reeksen?', ans:1 + 2 * (f - 1) }],
    uitw:{ begrijpen:`Start op paaltje 1, doel paaltje ${M}. Patroon: ${f} sprongen vooruit, 1 terug.`,
      plannen:`Zoek een patroon: na elke ${f + 1} sprongen ben je ${f - 1} paaltjes verder.`,
      uitvoeren:(()=>{ let p = 1, s = 0, r = 0; const reeks = []; while(p + f < M){ p += f - 1; s += f + 1; r++; } reeks.push(`Na ${r} reeks${r === 1 ? '' : 'en'} (${s} sprongen) zit het dier op paaltje ${p}.`); const rest = M - p; reeks.push(`Nog ${rest} sprong${rest === 1 ? '' : 'en'} naar rechts en het is op paaltje ${M}: ${s} + ${rest} = <b>${s + rest}</b>.`); return reeks.join('<br>'); })(),
      terugkijken:'In de laatste reeks spring je niet meer terug: het dier is al aangekomen.' } };
} });

T({ id:'p10', h:'patroon', niv:3, bron:'VWO 2017', maak(R){
  const C = n=>n * (3 * n + 1) / 2, k = R.int(10, 20), nm = R.jongen();
  return { tekst:`<p>${nm} bouwt kaartenhuizen. Een kaartenhuis met 1 verdieping heeft 2 kaarten, met 2 verdiepingen 7 kaarten en met 3 verdiepingen 15 kaarten.</p><p><b>Hoeveel kaarten heeft ${nm} nodig voor een kaartenhuis met ${k} verdiepingen?</b></p>`,
    fig:(()=>{ let s = ''; const n = 3, a = 18, h = 30, H = n * h + 8;
      for(let L = 1; L <= n; L++){ const t = n - L + 1, yb = H - (L - 1) * h, x0 = 6 + (L - 1) * a;
        for(let i = 0; i < t; i++){ const x = x0 + 2 * a * i; s += lijn(x, yb, x + a, yb - h + 4, { k:'#3d6fd1', w:3 }) + lijn(x + a, yb - h + 4, x + 2 * a, yb, { k:'#3d6fd1', w:3 }); }
        for(let i = 0; i < t - 1; i++){ const x = x0 + 2 * a * i + a; s += lijn(x, yb - h + 4, x + 2 * a, yb - h + 4, { k:'#d64545', w:3 }); } }
      return svg(2 * n * a + 12, H + 6, s, { b:170, label:'kaartenhuis met 3 verdiepingen' }); })(),
    mc:opties(R, C(k), [C(k) - k, C(k) + k, k * (3 * k + 1), C(k - 1), 3 * k * k / 2]),
    uitw:{ begrijpen:'2, 7, 15 kaarten voor 1, 2, 3 verdiepingen.',
      plannen:'Zoek het patroon in wat er bij elke verdieping bijkomt.',
      uitvoeren:`Er komen 5, 8, 11, … kaarten bij: telkens 3 meer. De verdieping n (van boven geteld) heeft 3n − 1 kaarten: 2, 5, 8, 11, …<br>Voor ${k} verdiepingen: 2 + 5 + 8 + … + ${3 * k - 1}. Paren zoals bij Gauss: (2 + ${3 * k - 1}) · ${k} : 2 = ${3 * k + 1} · ${k} : 2 = <b>${C(k)}</b>.`,
      terugkijken:`Controle met 3 verdiepingen: (2 + 8) · 3 : 2 = 15. ✓` } };
} });

T({ id:'p11', h:'patroon', niv:3, bron:'Koala 2011', maak(R){
  const n = R.int(4, 8), juist = (2 * n - 1) ** 2 - n * n;
  const vloer = m=>{ const z = 2 * m - 1, c = 10; let s = ''; for(let i = 0; i < z; i++) for(let j = 0; j < z; j++) s += rh(i * c, j * c, c, c, { f:i % 2 === 0 && j % 2 === 0 ? '#3d6fd1' : '#fff', k:'var(--ink)', w:1 }); return { s, W:z * c, H:z * c }; };
  return { tekst:`<p>Een vierkante vloer wordt gelegd met witte en gekleurde tegels, volgens een vast patroon. In elke hoek ligt een gekleurde tegel en rond elke gekleurde tegel liggen witte tegels. Je ziet de vloer met 4 en met 9 gekleurde tegels.</p><p><b>Hoeveel witte tegels zijn er nodig voor een vloer met ${n * n} gekleurde tegels?</b></p>`,
    fig:(()=>{ const a = vloer(2), b = vloer(3); return svg(a.W + b.W + 30, b.H + 4, `<g transform="translate(2,${b.H - a.H + 2})">${a.s}</g><g transform="translate(${a.W + 26},2)">${b.s}</g>`, { b:200, label:'vloeren' }); })(),
    mc:opties(R, juist, [(2 * n + 1) ** 2 - n * n, n * n, 2 * n * n, (2 * n - 1) ** 2, juist + 2 * n]),
    uitw:{ begrijpen:`Gekleurde tegels in een vierkant van ${n} bij ${n}, met witte tegels ertussen.`,
      plannen:'Zoek het patroon: hoe groot is de hele vloer bij 4 en bij 9 gekleurde tegels?',
      uitvoeren:`4 gekleurd (2 bij 2): vloer 3 bij 3 = 9 tegels, 5 wit. 9 gekleurd (3 bij 3): vloer 5 bij 5 = 25, 16 wit.<br>${n} bij ${n} gekleurd: de vloer is ${2 * n - 1} bij ${2 * n - 1} = ${(2 * n - 1) ** 2} tegels. Wit: ${(2 * n - 1) ** 2} − ${n * n} = <b>${juist}</b>.`,
      terugkijken:'Met de formule voor 3 bij 3: 5 · 5 − 9 = 16. Klopt met de tekening. ✓' } };
} });

T({ id:'p12', h:'patroon', niv:3, bron:'een opgave over kommagetallen', maak(R){
  const a = R.int(1, 6), cijfers = String(Math.floor(a * 1e6 / 7)).padStart(6, '0');
  const k = R.int(50, 2026), juist = Number(cijfers[(k - 1) % 6]);
  return { tekst:`<p>${a} : 7 = 0,${cijfers}${cijfers}…</p><p><b>Welk cijfer staat op de ${k}ste plaats na de komma?</b></p>`,
    mc:opties(R, juist, R.shuffle(cijfers.split('').map(Number).filter(x=>x !== juist)).concat([0, 3, 6, 9])),
    uitw:{ begrijpen:`Na de komma komen de cijfers ${cijfers.split('').join(', ')} telkens terug.`,
      plannen:'Zoek het patroon: hoe lang is het stuk dat zich herhaalt?',
      uitvoeren:`Het patroon ${cijfers} is 6 cijfers lang. ${k} : 6 = ${Math.floor(k / 6)} rest ${k % 6}. ${k % 6 === 0 ? 'Rest 0: het laatste cijfer van het patroon' : 'Het ' + (k % 6) + 'de cijfer van het patroon'}: <b>${juist}</b>.`,
      terugkijken:'Rest 0 hoort bij de 6de plaats (zoals plaats 6, 12, 18 …), niet bij de eerste.' } };
} });

/* ============================================================
   HEURISTIEK 5 · ACHTERWAARTS WERKEN
   ============================================================ */
/* pijlenschema: getallen met bewerkingen ertussen (vooruit) en eronder de omgekeerde bewerkingen */
function pijlSchema(waarden, ops, terug){
  const bw = 52, gap = 58, n = waarden.length, W = n * bw + (n - 1) * gap + 10; let s = '';
  waarden.forEach((v, i)=>{ const x = 5 + i * (bw + gap); s += rh(x, 16, bw, 30, { f:i === 0 ? 'rgba(252,175,23,.45)' : 'var(--card)', k:'var(--ink)', w:1.5, rx:6 }) + tekst(x + bw / 2, 32, v, { s:15 }); });
  ops.forEach((o, i)=>{ const x = 5 + i * (bw + gap) + bw; s += pad(`M${x + 4} 22 Q${x + gap / 2} 4 ${x + gap - 4} 22`, { k:'var(--accent-dark)', w:1.5 }) + tekst(x + gap / 2, 8, o, { s:12, f:'var(--accent-dark)' });
    if(terug) s += pad(`M${x + gap - 4} 42 Q${x + gap / 2} 62 ${x + 4} 42`, { k:'var(--orange)', w:2, cls:'anim-in', st:`animation-delay:${(ops.length - i) * .5}s` }) + tekst(x + gap / 2, 64, terug[i], { s:12, f:'#b77d00', cls:'anim-in', st:`animation-delay:${(ops.length - i) * .5}s` }); });
  return svg(W, terug ? 74 : 52, s, { b:Math.min(340, W), label:'pijlenschema' });
}

T({ id:'t01', h:'terug', niv:1, bron:'een denkspelletje', maak(R){
  const nm = R.naam(); let x, a, b, c, r, ops, inv, tussen;
  do{ x = R.int(3, 20); a = R.int(2, 5); b = R.int(3, 20); c = R.pick([2, 3, 4, 5]); } while((a * x + b) % c !== 0);
  r = (a * x + b) / c; ops = ['· ' + a, '+ ' + b, ': ' + c]; inv = [': ' + a, '− ' + b, '· ' + c]; tussen = [x, a * x, a * x + b, r];
  return { tekst:`<p>${nm} denkt aan een getal. ${nm} vermenigvuldigt het met ${a}, telt er ${b} bij en deelt de uitkomst door ${c}. ${nm} krijgt ${r}.</p><p><b>Aan welk getal dacht ${nm}?</b></p>`,
    getal:x,
    hint:[{ fase:'plannen', vraag:`Begin bij het einde. Wat was het getal vóór het delen door ${c}?`, ans:a * x + b },
      { fase:'uitvoeren', vraag:`Wat was het getal vóór “+ ${b}”?`, ans:a * x },
      { fase:'uitvoeren', vraag:`Wat was het getal vóór “· ${a}”?`, ans:x }],
    uitw:{ begrijpen:`Drie bewerkingen na elkaar. Je kent de uitkomst ${r}, gevraagd is het begin.`,
      plannen:'Werk achterwaarts: begin bij de uitkomst en doe elke bewerking omgekeerd, van achter naar voor.',
      uitvoeren:pijlSchema(['?', '', '', r], ops, inv) + `${r} · ${c} = ${a * x + b}, ${a * x + b} − ${b} = ${a * x}, ${a * x} : ${a} = <b>${x}</b>.`,
      terugkijken:`Controle vooruit: ${x} · ${a} = ${a * x}, + ${b} = ${a * x + b}, : ${c} = ${r}. ✓` } };
} });

T({ id:'t02', h:'terug', niv:1, bron:'een snoepraadsel', maak(R){
  const r = R.int(3, 15), g = R.int(2, 10), start = 2 * (r + g), nm = R.jongen(), [zus, br_] = [R.meisje(), R.jongen()];
  return { tekst:`<p>${nm} heeft een zak snoepjes. Eerst geeft hij de helft aan zijn zus ${zus}. Daarna geeft hij er nog ${g} aan zijn vriend ${br_}. Nu heeft ${nm} nog ${r} snoepjes.</p><p><b>Hoeveel snoepjes had ${nm} in het begin?</b></p>`,
    mc:opties(R, start, [2 * r + g, r + g, 2 * r - g, r + 2 * g, start + 2]),
    hint:[{ fase:'plannen', vraag:`Werk achterwaarts. Hoeveel had ${nm} net voor hij er ${g} aan ${br_} gaf?`, ans:r + g },
      { fase:'uitvoeren', vraag:'Dat was de helft. Hoeveel had hij in het begin?', ans:start }],
    uitw:{ begrijpen:`Eerst de helft weg, dan nog ${g} weg. Over: ${r}.`,
      plannen:'Werk achterwaarts: begin bij wat er over is en doe elke stap omgekeerd.',
      uitvoeren:pijlSchema(['?', '', r], [': 2', '− ' + g], ['· 2', '+ ' + g]) + `Vóór het geven aan ${br_}: ${r} + ${g} = ${r + g}. Vóór het geven aan ${zus}: ${r + g} · 2 = <b>${start}</b>.`,
      terugkijken:`Controle: de helft van ${start} is ${start / 2}, min ${g} is ${r}. ✓` } };
} });

T({ id:'t03', h:'terug', niv:1, bron:'een tijdsprobleem', maak(R){
  const T_ = R.int(19, 23) * 60 + R.pick([0, 15, 30, 45, 10, 50, 5]), w = R.int(10, 35), f = R.int(85, 140), start = T_ - w - f, nm = R.meisje();
  const fu = Math.floor(f / 60) + ' uur en ' + (f % 60) + ' minuten';
  return { tekst:`<p>${nm} gaat naar de film. De film duurt ${fu}. Na de film wandelt ze ${w} minuten naar huis. Ze is thuis om ${uur(T_)}.</p><p><b>Hoe laat begon de film?</b></p>`,
    mc:opties(R, start, [T_ - f, T_ - w - f + 60, T_ - w - f - 60, start + 10, T_ - w - (f - 60)].filter(x=>x !== start), { fmt:uur, stap:5 }),
    hint:[{ fase:'plannen', vraag:'Werk achterwaarts. Hoe laat was de film gedaan? Typ zoals 21.35', ans:[uur(T_ - w).replace(' uur', ''), uur(T_ - w)] },
      { fase:'uitvoeren', vraag:`Hoeveel minuten duurt de film in totaal?`, ans:f, eenheid:'min' }],
    uitw:{ begrijpen:`Einde: thuis om ${uur(T_)}. Daarvoor: wandelen (${w} min) en de film (${fu}).`,
      plannen:'Werk achterwaarts: trek de tijden één voor één af, van het einde naar het begin.',
      uitvoeren:`${uur(T_)} − ${w} min = ${uur(T_ - w)} (einde film). ${uur(T_ - w)} − ${fu} = <b>${uur(start)}</b>.`,
      terugkijken:`Controle vooruit: ${uur(start)} + ${fu} = ${uur(start + f)}, + ${w} min = ${uur(T_)}. ✓` } };
} });

T({ id:'t04', h:'terug', niv:1, bron:'een liftraadsel', maak(R){
  let s, a, b, c, e; do{ s = R.int(1, 8); a = R.int(2, 9); b = R.int(1, s + a - 1); c = R.int(1, 7); e = s + a - b + c; } while(e > 15 || s + a - b < 1);
  const nm = R.naam();
  return { tekst:`<p>${nm} stapt in de lift van een hoog gebouw. De lift gaat eerst ${a} verdiepingen omhoog, dan ${b} verdiepingen omlaag en dan nog ${c} verdiepingen omhoog. ${nm} stapt uit op de ${e}de verdieping.</p><p><b>Op welke verdieping stapte ${nm} in?</b></p>`,
    mc:opties(R, s, [e - a - b - c, e + a - b + c, e - a + b + c, s + 2, s - 1].map(Math.abs), { min:1, fmt:v=>'verdieping ' + v }),
    hint:[{ fase:'plannen', vraag:`Werk achterwaarts. Op welke verdieping was de lift vóór de laatste rit van ${c} omhoog?`, ans:e - c },
      { fase:'uitvoeren', vraag:`En vóór de rit van ${b} omlaag?`, ans:e - c + b }],
    uitw:{ begrijpen:`Drie ritten: +${a}, −${b}, +${c}. Einde: verdieping ${e}.`,
      plannen:'Werk achterwaarts: draai elke rit om, van de laatste naar de eerste.',
      uitvoeren:pijlSchema(['?', '', '', e], ['+ ' + a, '− ' + b, '+ ' + c], ['− ' + a, '+ ' + b, '− ' + c]) + `${e} − ${c} = ${e - c}, ${e - c} + ${b} = ${e - c + b}, ${e - c + b} − ${a} = <b>${s}</b>.`,
      terugkijken:`Controle: ${s} + ${a} − ${b} + ${c} = ${e}. ✓` } };
} });

T({ id:'t05', h:'terug', niv:2, bron:'WizKid 2018', maak(R){
  const k = R.pick([2, 3, 4]); let H; do{ H = R.int(9, 26); } while(H % k === 0);
  const start = H - Math.floor(H / k), nm = R.jongen();
  return { tekst:`<p>${nm} moet een draak verslaan door al zijn koppen af te hakken. ${nm} hakt telkens één kop af. Maar telkens als hij in totaal ${k === 2 ? '2, 4, 6, …' : k === 3 ? '3, 6, 9, …' : '4, 8, 12, …'} koppen heeft afgehakt, groeit er meteen één nieuwe kop bij. ${nm} verslaat de draak nadat hij in totaal ${H} koppen heeft afgehakt.</p><p><b>Hoeveel koppen had de draak in het begin?</b></p>`,
    mc:opties(R, start, [H, H - Math.floor(H / k) - 1, H - Math.ceil(H / k), H + Math.floor(H / k), Math.round(H / k)], { min:1 }),
    hint:[{ fase:'plannen', vraag:`Hoeveel keer groeide er een kop bij tijdens die ${H} houwen?`, ans:Math.floor(H / k), meer:`Er groeit een kop bij na kop ${k}, ${2 * k}, ${3 * k}, … Tel hoeveel van die getallen kleiner zijn dan ${H}.` },
      { fase:'uitvoeren', vraag:'Hoeveel koppen waren er dus al in het begin?', ans:start }],
    controle:q=>{ let h = start, n = 0; while(n < 200){ h--; n++; if(n % k === 0) h++; if(h === 0) break; } return n === H; },
    uitw:{ begrijpen:`In totaal ${H} koppen afgehakt. Na elke ${k}de kop groeit er één bij.`,
      plannen:'Werk achterwaarts: op het einde zijn er 0 koppen. Alle afgehakte koppen waren er in het begin of zijn erbij gegroeid.',
      uitvoeren:`Er groeide een kop bij na kop ${Array.from({ length:Math.floor(H / k) }, (_, i)=>(i + 1) * k).join(', ')}: dat is ${Math.floor(H / k)} keer. Begin = afgehakt − bijgegroeid = ${H} − ${Math.floor(H / k)} = <b>${start}</b>.`,
      terugkijken:`Controle vooruit: begin met ${start}, hak af en tel na elke ${k}de houw één kop bij. Na ${H} houwen is er niets meer over. ✓` } };
} });

T({ id:'t06', h:'terug', niv:2, bron:'het waterlelieraadsel', maak(R){
  const D = R.int(20, 60), j = R.int(1, 3), deel = ['', 'de helft', 'een kwart', 'een achtste'][j];
  return { tekst:`<p>In een vijver groeit een waterlelie. Elke dag wordt het stuk vijver dat ze bedekt twee keer zo groot. Na ${D} dagen is de vijver helemaal bedekt.</p><p><b>Na hoeveel dagen was ${deel} van de vijver bedekt?</b></p>`,
    mc:opties(R, D - j, [D / Math.pow(2, j), D - 2 * j, D - j - 1, D - j + 1, Math.round(D / 2)].map(Math.round), { min:1, fmt:v=>v + ' dagen' }),
    hint:[{ fase:'plannen', vraag:`Werk achterwaarts. Na dag ${D} is alles bedekt. Na welke dag was de helft bedekt?`, ans:D - 1 },
      { fase:'uitvoeren', vraag:`Na welke dag was ${deel} bedekt?`, ans:D - j }],
    uitw:{ begrijpen:`Elke dag verdubbelt de bedekte oppervlakte. Na ${D} dagen: alles.`,
      plannen:'Werk achterwaarts: één dag terug betekent de helft.',
      uitvoeren:`Na dag ${D}: alles. Na dag ${D - 1}: de helft.${j > 1 ? ` Na dag ${D - 2}: een kwart.` : ''}${j > 2 ? ` Na dag ${D - 3}: een achtste.` : ''} Antwoord: <b>${D - j} dagen</b>.`,
      terugkijken:`${D} : ${Math.pow(2, j)} is fout: het oppervlak verdubbelt, de dagen worden niet gehalveerd.` } };
} });

T({ id:'t07', h:'terug', niv:2, bron:'een koekjesraadsel', maak(R){
  const [a, b] = R.pick([[2, 3], [3, 2], [3, 4], [4, 3], [2, 4], [4, 2], [3, 3]]), m = (a - 1) * (b - 1), r = m * R.int(1, 4), start = r * a * b / m;
  const [x, y] = [R.jongen(), R.meisje()], fr = { 2:'de helft', 3:'een derde', 4:'een vierde' };
  return { tekst:`<p>Mama bakt koekjes. ${x} eet ${fr[a]} van de koekjes op. Daarna eet ${y} ${fr[b]} van de koekjes die nog over zijn. Nu blijven er nog ${r} koekjes over.</p><p><b>Hoeveel koekjes bakte mama?</b></p>`,
    getal:start, eenheid:'koekjes',
    hint:[{ fase:'plannen', vraag:`Werk achterwaarts. ${y} at ${fr[b]} van wat er lag: welk deel bleef er dan over? Typ als breuk, bv. 2/3.`, ans:[(b - 1) + '/' + b], meer:`Er bleef ${b - 1}/${b} over, en dat zijn ${r} koekjes.` },
      { fase:'uitvoeren', vraag:`Hoeveel koekjes lagen er vóór ${y} begon te eten?`, ans:r * b / (b - 1) },
      { fase:'uitvoeren', vraag:'Hoeveel koekjes bakte mama?', ans:start }],
    uitw:{ begrijpen:`Eerst ${fr[a]} weg, dan ${fr[b]} van de rest weg. Over: ${r}.`,
      plannen:'Werk achterwaarts: begin bij de ' + r + ' koekjes.',
      uitvoeren:`${y} liet ${br(b - 1, b)} over: ${br(b - 1, b)} = ${r} koekjes, dus ${br(1, b)} = ${r / (b - 1)} en alles = ${r * b / (b - 1)} koekjes (vóór ${y}).<br>${x} liet ${br(a - 1, a)} over: ${br(a - 1, a)} = ${r * b / (b - 1)}, dus ${br(1, a)} = ${r * b / (b - 1) / (a - 1)} en alles = <b>${start}</b>.`,
      terugkijken:`Controle: ${fr[a]} van ${start} is ${start / a}, over ${start - start / a}. ${fr[b]} daarvan is ${(start - start / a) / b}, over ${r}. ✓` } };
} });

T({ id:'t08', h:'terug', niv:2, bron:'een rekenketting', maak(R){
  let x, p, q, m, n, r; do{ x = R.int(2, 25); p = R.int(2, 15); q = R.int(2, 5); m = R.int(2, 20); n = R.pick([2, 3, 4, 5, 6]); } while(((x + p) * q - m) % n !== 0 || (x + p) * q - m <= 0);
  r = ((x + p) * q - m) / n;
  return { tekst:`<p>Vul het startgetal in.</p>` + pijlSchema(['?', '', '', '', r], ['+ ' + p, '· ' + q, '− ' + m, ': ' + n]) + `<p><b>Welk getal staat in het eerste vakje?</b></p>`,
    mc:opties(R, x, [(r * n + m) / q + p, ((r + m) * n) / q - p, r * n + m - p, x + 1, x - 1].filter(v=>Number.isInteger(v)), { min:0 }),
    hint:[{ fase:'plannen', vraag:`Werk achterwaarts. Wat is ${r} · ${n}?`, ans:r * n },
      { fase:'uitvoeren', vraag:`Daarna + ${m}. Hoeveel?`, ans:r * n + m },
      { fase:'uitvoeren', vraag:`Daarna : ${q}. Hoeveel?`, ans:(r * n + m) / q }],
    uitw:{ begrijpen:`Vier bewerkingen na elkaar. Je kent het einde: ${r}.`,
      plannen:'Werk achterwaarts met de omgekeerde bewerkingen, van achter naar voor.',
      uitvoeren:pijlSchema(['?', '', '', '', r], ['+ ' + p, '· ' + q, '− ' + m, ': ' + n], ['− ' + p, ': ' + q, '+ ' + m, '· ' + n]) + `${r} · ${n} = ${r * n}; + ${m} = ${r * n + m}; : ${q} = ${x + p}; − ${p} = <b>${x}</b>.`,
      terugkijken:`Controle vooruit: (${x} + ${p}) · ${q} − ${m} = ${(x + p) * q - m}, : ${n} = ${r}. ✓ Let op de volgorde: de laatste bewerking draai je eerst om.` } };
} });

T({ id:'t09', h:'terug', niv:2, bron:'een ochtendplanning', maak(R){
  const T_ = 8 * 60 + R.pick([15, 20, 25, 30]), f = R.int(12, 35), o = R.int(10, 25), a = R.int(8, 20), d = R.int(5, 15), start = T_ - f - o - a - d, nm = R.naam();
  return { tekst:`<p>${nm} moet om ${uur(T_)} op school zijn. Fietsen naar school duurt ${f} minuten. Ontbijten duurt ${o} minuten, douchen ${d} minuten en aankleden ${a} minuten.</p><p><b>Hoe laat moet ${nm} ten laatste opstaan?</b></p>`,
    mc:opties(R, start, [start + 10, start - 10, T_ - f - o - a, start + 60, start + 5], { fmt:uur, stap:5 }),
    hint:[{ fase:'plannen', vraag:'Werk achterwaarts. Hoe laat moet ' + nm + ' op de fiets springen? Typ zoals 7.55', ans:[uur(T_ - f).replace(' uur', ''), uur(T_ - f)] },
      { fase:'uitvoeren', vraag:'Hoeveel minuten heeft ' + nm + ' in totaal nodig van opstaan tot op school?', ans:f + o + a + d, eenheid:'min' }],
    uitw:{ begrijpen:`Einde: ${uur(T_)} op school. Alles samen duurt ${f} + ${o} + ${d} + ${a} minuten.`,
      plannen:'Werk achterwaarts vanaf ' + uur(T_) + '.',
      uitvoeren:`Samen: ${f + o + a + d} minuten. ${uur(T_)} − ${f + o + a + d} min = <b>${uur(start)}</b>.`,
      terugkijken:`Controle vooruit: ${uur(start)} + ${f + o + a + d} min = ${uur(T_)}. ✓` } };
} });

T({ id:'t10', h:'terug', niv:3, bron:'een klassiek knikkerprobleem', maak(R){
  const f = 8 * R.int(1, 5), [A, B, C] = R.namen(3), st = [13 * f / 8, 7 * f / 8, f / 2], vraag = R.int(0, 1);
  return { tekst:`<p>${A}, ${B} en ${C} spelen met knikkers.</p><ul class="kort"><li>Eerst geeft ${A} aan ${B} en aan ${C} zoveel knikkers als ze al hebben.</li><li>Dan geeft ${B} aan ${A} en aan ${C} zoveel knikkers als ze op dat moment hebben.</li><li>Dan geeft ${C} aan ${A} en aan ${B} zoveel knikkers als ze op dat moment hebben.</li></ul><p>Nu heeft elk van hen ${f} knikkers.</p><p><b>Hoeveel knikkers had ${vraag ? B : A} in het begin?</b></p>`,
    mc:opties(R, st[vraag], [f, st[1 - vraag], 3 * f / 2, st[2], st[vraag] + f / 8, st[vraag] - f / 8], { min:1 }),
    controle:q=>{ let [a, b, c] = st; b *= 1; [a, b, c] = [a - b - c, 2 * b, 2 * c]; [a, b, c] = [2 * a, b - a - c, 2 * c]; [a, b, c] = [2 * a, 2 * b, c - a - b]; return a === f && b === f && c === f; },
    uitw:{ begrijpen:`Drie beurten na elkaar. Op het einde heeft iedereen ${f}.`,
      plannen:'Werk achterwaarts: draai de beurten om, van de laatste naar de eerste. Wie iets kreeg, had eerst de helft.',
      uitvoeren:probeerTabel(['moment', A, B, C], [{ c:['einde', f, f, f] }, { c:[`vóór de beurt van ${C}`, f / 2, f / 2, 2 * f] }, { c:[`vóór de beurt van ${B}`, f / 4, 7 * f / 4, f] }, { c:['begin', 13 * f / 8, 7 * f / 8, f / 2], ok:true }]) + `${vraag ? B : A} had in het begin <b>${st[vraag]}</b> knikkers.`,
      terugkijken:`Het totaal blijft altijd ${3 * f}: ${13 * f / 8} + ${7 * f / 8} + ${f / 2} = ${3 * f}. ✓` } };
} });

T({ id:'t11', h:'terug', niv:3, bron:'een sprookje met bruggen', maak(R){
  let p, F, x; do{ p = R.int(3, 20); F = R.int(0, 6); x = (F + 7 * p) / 8; } while(!Number.isInteger(x) || x < 1);
  const nm = R.pick(['Een boer', 'Een koopman', 'Een herder']);
  return { tekst:`<p>${nm} moet over drie bruggen. Bij elke brug staat een tovenaar die eerst het geld van de ${nm.split(' ')[1]} verdubbelt. Daarna moet de ${nm.split(' ')[1]} hem ${p} euro tol betalen. Na de derde brug heeft hij nog ${F} euro.</p><p><b>Hoeveel euro had hij vóór de eerste brug?</b></p>`,
    mc:opties(R, x, [(F + 3 * p) / 8, (F / 8) + p, x + 1, x - 1, Math.round((F + p) / 2)].filter(v=>Number.isInteger(v)), { min:0, fmt:v=>v + ' euro' }),
    controle:q=>{ let g = x; for(let i = 0; i < 3; i++) g = 2 * g - p; return g === F; },
    uitw:{ begrijpen:`Bij elke brug: verdubbelen, dan ${p} euro betalen. Einde: ${F} euro.`,
      plannen:'Werk achterwaarts: eerst de tol terugtellen, dan halveren. Doe dat drie keer.',
      uitvoeren:`Na brug 3: ${F}. Vóór de tol: ${F + p}, vóór het verdubbelen: ${(F + p) / 2}.<br>Na brug 2: ${(F + p) / 2}. Vóór de tol: ${(F + p) / 2 + p}, vóór het verdubbelen: ${((F + p) / 2 + p) / 2}.<br>Na brug 1: ${((F + p) / 2 + p) / 2}. Vóór de tol: ${((F + p) / 2 + p) / 2 + p}, vóór het verdubbelen: <b>${x} euro</b>.`,
      terugkijken:`Controle vooruit: ${x} → ${2 * x} − ${p} = ${2 * x - p} → ${2 * (2 * x - p)} − ${p} = ${4 * x - 3 * p} → ${2 * (4 * x - 3 * p)} − ${p} = ${F}. ✓` } };
} });

T({ id:'t12', h:'terug', niv:3, bron:'een marktraadsel', maak(R){
  const k = R.int(3, 4), r = R.int(0, 5), start = (r + 1) * Math.pow(2, k) - 1, nm = R.pick(['Een fruitverkoper', 'Een boerin op de markt', 'Een groenteman']);
  return { tekst:`<p>${nm} verkoopt appels. Elke klant koopt de helft van de appels die er nog liggen plus nog een halve appel. Toch moet er nooit een appel doorgesneden worden. Na ${k} klanten ${r === 0 ? 'zijn alle appels verkocht' : 'liggen er nog ' + r + ' appel' + (r === 1 ? '' : 's')}.</p><p><b>Hoeveel appels lagen er in het begin?</b></p>`,
    mc:opties(R, start, [r * Math.pow(2, k), (r + 1) * Math.pow(2, k), start - 2, start + 2, Math.pow(2, k) + r]),
    controle:q=>{ let a = start; for(let i = 0; i < k; i++){ a = a - (a / 2 + .5); if(!Number.isInteger(a)) return false; } return a === r; },
    uitw:{ begrijpen:`${k} klanten. Elke klant: de helft plus een halve. Einde: ${r}.`,
      plannen:'Werk achterwaarts. Als na een klant a appels liggen, dan lagen er voordien 2 · a + 1 (want a is de helft min een halve).',
      uitvoeren:(()=>{ const L = [r]; for(let i = 0; i < k; i++) L.unshift(2 * L[0] + 1); return `Van achter naar voor: ${L.slice().reverse().join(' → ')}. In het begin: <b>${start}</b>.`; })(),
      terugkijken:`Controle met de eerste klant: de helft van ${start} is ${start / 2}, plus een halve = ${(start + 1) / 2}. Over: ${start - (start + 1) / 2}. ✓` } };
} });

/* ============================================================
   HEURISTIEK 6 · SYSTEMATISCH TELLEN (lijst of tabel)
   ============================================================ */
const lijstHTML = items => `<div class="lijstje">${items.map(i=>`<span>${i}</span>`).join('')}</div>`;
const fac = n => n <= 1 ? 1 : n * fac(n - 1);
const comb = (n, k) => fac(n) / (fac(k) * fac(n - k));
function rooster(m, n, o = {}){
  const c = o.c || 34, M = 16; let s = '';
  for(let i = 0; i <= n; i++) s += lijn(M + i * c, M, M + i * c, M + m * c, { w:1.6 });
  for(let j = 0; j <= m; j++) s += lijn(M, M + j * c, M + n * c, M + j * c, { w:1.6 });
  if(o.AB){ s += cirkel(M, M + m * c, 5, { f:'var(--orange)', k:'var(--ink)', w:1 }) + tekst(M - 8, M + m * c + 10, 'A', { s:13 }) + cirkel(M + n * c, M, 5, { f:'var(--orange)', k:'var(--ink)', w:1 }) + tekst(M + n * c + 9, M - 8, 'B', { s:13 }); }
  if(o.getallen) for(let j = 0; j <= m; j++) for(let i = 0; i <= n; i++) s += `<rect x="${M + i * c - 9}" y="${M + (m - j) * c - 8}" width="18" height="16" rx="4" fill="var(--card)" stroke="var(--orange)" stroke-width="1"/>` + tekst(M + i * c, M + (m - j) * c + 1, comb(i + j, i), { s:11 });
  return svg(n * c + 2 * M, m * c + 2 * M, s, { b:Math.min(250, (n * c + 2 * M) * 1.3), label:'rooster' });
}

T({ id:'c01', h:'tellen', niv:1, bron:'een opgave over kleren', maak(R){
  const a = R.int(2, 5), b = R.int(2, 4), c = R.int(2, 3), nm = R.meisje();
  return { tekst:`<p>${nm} heeft ${a} T-shirts, ${b} broeken en ${c} paar schoenen. Een outfit is één T-shirt, één broek en één paar schoenen.</p><p><b>Hoeveel verschillende outfits kan ${nm} maken?</b></p>`,
    mc:opties(R, a * b * c, [a + b + c, a * b + c, a * b, 2 * a * b * c, a * c + b]),
    hint:[{ fase:'plannen', vraag:'Neem eerst enkel T-shirts en broeken. Hoeveel combinaties zijn dat? (Maak een tabel.)', ans:a * b },
      { fase:'uitvoeren', vraag:'Elke combinatie kan met elk paar schoenen. Hoeveel outfits?', ans:a * b * c }],
    uitw:{ begrijpen:`${a} T-shirts, ${b} broeken, ${c} paar schoenen. Van elk één.`,
      plannen:'Tel systematisch: maak een tabel van T-shirts en broeken, en zet er dan de schoenen bij.',
      uitvoeren:`<table class="dtable"><tr><th></th>${Array.from({ length:b }, (_, j)=>`<th>broek ${j + 1}</th>`).join('')}</tr>${Array.from({ length:a }, (_, i)=>`<tr><th>T${i + 1}</th>${Array.from({ length:b }, (_, j)=>`<td>T${i + 1}-B${j + 1}</td>`).join('')}</tr>`).join('')}</table>${a} · ${b} = ${a * b} combinaties, elk met ${c} paar schoenen: ${a * b} · ${c} = <b>${a * b * c}</b>.`,
      terugkijken:`Optellen (${a} + ${b} + ${c}) is fout: elk T-shirt kan met elke broek.` } };
} });

const SMAKEN = ['aardbei', 'vanille', 'chocolade', 'citroen', 'mokka', 'pistache', 'mango'];
T({ id:'c02', h:'tellen', niv:1, bron:'een ijsjesprobleem', maak(R){
  const n = R.int(4, 7), sm = SMAKEN.slice(0, n), juist = n * (n - 1) / 2;
  return { tekst:`<p>In de ijssalon zijn er ${n} smaken: ${sm.join(', ')}. Je kiest een hoorntje met twee bolletjes van een <b>verschillende</b> smaak. De volgorde maakt niet uit.</p><p><b>Hoeveel verschillende hoorntjes kan je kiezen?</b></p>`,
    getal:juist, eenheid:'hoorntjes',
    hint:[{ fase:'plannen', vraag:`Maak een lijst. Hoeveel hoorntjes met ${sm[0]}?`, ans:n - 1 },
      { fase:'uitvoeren', vraag:`Hoeveel nieuwe hoorntjes met ${sm[1]} (zonder ${sm[0]}, want die heb je al)?`, ans:n - 2 },
      { fase:'uitvoeren', vraag:'Tel zo verder. Hoeveel samen?', ans:juist }],
    uitw:{ begrijpen:`Twee verschillende smaken uit ${n}, volgorde maakt niet uit.`,
      plannen:'Tel systematisch: begin met de eerste smaak, dan de tweede (zonder de vorige), …',
      uitvoeren:lijstHTML(sm.flatMap((a, i)=>sm.slice(i + 1).map(b=>a + ' + ' + b))) + `${Array.from({ length:n - 1 }, (_, i)=>n - 1 - i).join(' + ')} = <b>${juist}</b>.`,
      terugkijken:`Wie ${n} · ${n - 1} = ${n * (n - 1)} rekent, telt elk hoorntje twee keer (aardbei + vanille en vanille + aardbei).` } };
} });

T({ id:'c03', h:'tellen', niv:1, bron:'een opgave met cijferkaartjes', maak(R){
  const soort = R.pick(['3van3', '2van4', '2van3']), k = soort === '2van4' ? 4 : 3, c = R.kies([1, 2, 3, 4, 5, 6, 7, 8, 9], k).sort();
  const lang = soort === '3van3' ? 3 : 2, juist = fac(k) / fac(k - lang);
  const alle = []; const gen = (pre, rest)=>{ if(pre.length === lang){ alle.push(pre.join('')); return; } rest.forEach((d, i)=>gen(pre.concat(d), rest.filter((_, j)=>j !== i))); }; gen([], c);
  return { tekst:`<p>Je hebt ${k} kaartjes met de cijfers ${c.join(', ')}. Je legt er ${lang} naast elkaar om een getal van ${lang} cijfers te maken. Elk kaartje gebruik je hoogstens één keer.</p><p><b>Hoeveel verschillende getallen kan je maken?</b></p>`,
    mc:opties(R, juist, [k * lang, juist / 2, k, Math.pow(k, lang), juist + 2]),
    hint:[{ fase:'plannen', vraag:`Hoeveel getallen beginnen met ${c[0]}?`, ans:juist / k },
      { fase:'uitvoeren', vraag:'Hoeveel cijfers kunnen vooraan staan?', ans:k }],
    uitw:{ begrijpen:`Getallen van ${lang} cijfers met de kaartjes ${c.join(', ')}, zonder herhaling.`,
      plannen:'Tel systematisch: schrijf de getallen op in volgorde van klein naar groot.',
      uitvoeren:lijstHTML(alle.sort()) + `Er beginnen er ${juist / k} met elk cijfer, en er zijn ${k} cijfers: ${k} · ${juist / k} = <b>${juist}</b>.`,
      terugkijken:'Omdat je in volgorde schrijft, zie je meteen dat je er geen vergeet of dubbel hebt.' } };
} });

T({ id:'c04', h:'tellen', niv:1, bron:'een opgave over wegen', maak(R){
  const a = R.int(2, 5), b = R.int(2, 5), [X, Y, Z] = R.pick([['Gent', 'Lievegem', 'Eeklo'], ['Brugge', 'Gent', 'Aalst'], ['Deinze', 'Nevele', 'Lovendegem']]);
  let s = ''; for(let i = 0; i < a; i++) s += pad(`M30 60 Q${80} ${60 - 45 + i * 90 / Math.max(1, a - 1)} 130 60`, { k:'var(--accent-dark)', w:2 }); for(let j = 0; j < b; j++) s += pad(`M130 60 Q${180} ${60 - 45 + j * 90 / Math.max(1, b - 1)} 230 60`, { k:'#b77d00', w:2 });
  s += [[30, X], [130, Y], [230, Z]].map(([x, t])=>cirkel(x, 60, 7, { f:'var(--card)', k:'var(--ink)' }) + tekst(x, 82, t, { s:12 })).join('');
  return { tekst:`<p>Van ${X} naar ${Y} zijn er ${a} wegen. Van ${Y} naar ${Z} zijn er ${b} wegen.</p><p><b>Hoeveel verschillende routes zijn er van ${X} naar ${Z} via ${Y}?</b></p>`,
    fig:svg(260, 100, s, { b:260, label:'wegen' }),
    mc:opties(R, a * b, [a + b, a * b + 1, 2 * a * b, a * b - 1]),
    hint:[{ fase:'plannen', vraag:`Neem de eerste weg van ${X} naar ${Y}. Met hoeveel wegen kan je daarna verder?`, ans:b },
      { fase:'uitvoeren', vraag:'Hoeveel routes in totaal?', ans:a * b }],
    uitw:{ begrijpen:`${a} wegen voor het eerste stuk, ${b} voor het tweede.`,
      plannen:'Tel systematisch: maak een tabel met de wegen van het eerste stuk in de rijen en van het tweede stuk in de kolommen.',
      uitvoeren:`Elke weg van het eerste stuk kan met elke weg van het tweede stuk: ${a} · ${b} = <b>${a * b}</b> routes.`,
      terugkijken:`${a} + ${b} = ${a + b} telt de wegen, niet de routes.` } };
} });

T({ id:'c05', h:'tellen', niv:2, bron:'een opgave over vierkanten', maak(R){
  const n = R.int(3, 5), juist = Array.from({ length:n }, (_, i)=>(i + 1) ** 2).reduce((a, b)=>a + b, 0);
  return { tekst:`<p>Hieronder zie je een rooster van ${n} bij ${n} hokjes.</p><p><b>Hoeveel vierkanten van eender welke grootte zie je in totaal?</b></p>`,
    fig:rooster(n, n, { c:30 }),
    mc:opties(R, juist, [n * n, n * n + 1, juist - 1, juist - n * n + 1, juist + n]),
    hint:[{ fase:'plannen', vraag:'Tel per grootte. Hoeveel vierkanten van 1 bij 1?', ans:n * n },
      { fase:'uitvoeren', vraag:'Hoeveel vierkanten van 2 bij 2?', ans:(n - 1) ** 2, meer:'Een vierkant van 2 bij 2 kan in ' + (n - 1) + ' posities naast elkaar en ' + (n - 1) + ' posities onder elkaar.' },
      { fase:'uitvoeren', vraag:'Hoeveel vierkanten in totaal?', ans:juist }],
    uitw:{ begrijpen:'Je telt alle vierkanten: kleine en grote.',
      plannen:'Tel systematisch, per grootte, en zet het in een tabel.',
      uitvoeren:`<table class="dtable"><tr><th>grootte</th>${Array.from({ length:n }, (_, i)=>`<td>${i + 1} × ${i + 1}</td>`).join('')}</tr><tr><th>aantal</th>${Array.from({ length:n }, (_, i)=>`<td>${(n - i) ** 2}</td>`).join('')}</tr></table>Samen: ${Array.from({ length:n }, (_, i)=>(n - i) ** 2).join(' + ')} = <b>${juist}</b>.`,
      terugkijken:'Patroon: de aantallen zijn kwadraten (1, 4, 9, …). Zo kan je ook grotere roosters snel tellen.' } };
} });

T({ id:'c06', h:'tellen', niv:2, bron:'een opgave over driehoeken', maak(R){
  const k = R.int(3, 6), juist = k * (k + 1) / 2;
  const T0 = [140, 10], bx0 = 15, bx1 = 265, by = 170; let s = veelhoek([T0, [bx0, by], [bx1, by]]);
  for(let i = 1; i < k; i++){ const x = bx0 + (bx1 - bx0) * (i / k + (R.r() - .5) * .25 / k); s += lijn(T0[0], T0[1], x, by, { w:1.8 }); }
  return { tekst:`<p>Vanuit de top van een driehoek zijn ${k - 1} lijnen naar de onderkant getrokken.</p><p><b>Hoeveel driehoeken zie je in totaal?</b></p>`,
    fig:svg(280, 180, s, { b:250, label:'driehoek met lijnen' }),
    mc:opties(R, juist, [k, 2 * k, juist - 1, juist + k, k * k]),
    hint:[{ fase:'plannen', vraag:'Tel per breedte. Hoeveel smalle driehoekjes (1 stuk van de onderkant)?', ans:k },
      { fase:'uitvoeren', vraag:'Hoeveel driehoeken die 2 stukjes van de onderkant breed zijn?', ans:k - 1 },
      { fase:'uitvoeren', vraag:'Hoeveel in totaal?', ans:juist }],
    uitw:{ begrijpen:`Alle driehoeken hebben de top bovenaan. De onderkant is in ${k} stukjes verdeeld.`,
      plannen:'Tel systematisch: per aantal stukjes van de onderkant.',
      uitvoeren:`1 stukje breed: ${k}, 2 stukjes: ${k - 1}, …, ${k} stukjes: 1. Samen ${Array.from({ length:k }, (_, i)=>k - i).join(' + ')} = <b>${juist}</b>.`,
      terugkijken:`Elke driehoek hoort bij een keuze van twee punten op de onderkant. Met ${k + 1} punten zijn er ${juist} paren. ✓` } };
} });

T({ id:'c07', h:'tellen', niv:2, bron:'een muntprobleem', maak(R){
  const B = R.int(6, 12), opl = []; for(let v = 0; v * 5 <= B; v++) for(let t = 0; v * 5 + t * 2 <= B; t++) opl.push([v, t, B - 5 * v - 2 * t]);
  const juist = opl.length, nm = R.naam();
  return { tekst:`<p>${nm} wil precies ${B} euro betalen met munten van 1 euro, munten van 2 euro en biljetten van 5 euro. ${nm} heeft van elk genoeg. De volgorde maakt niet uit.</p><p><b>Op hoeveel verschillende manieren kan ${nm} betalen?</b></p>`,
    mc:opties(R, juist, [juist - 1, juist + 1, Math.floor(B / 2) + 1, juist + 2, 3]),
    hint:[{ fase:'plannen', vraag:'Begin zonder biljet van 5 euro. Op hoeveel manieren kan je dan betalen met munten van 1 en 2 euro?', ans:Math.floor(B / 2) + 1, meer:'0, 1, 2, … munten van 2 euro, de rest met munten van 1 euro.' },
      { fase:'uitvoeren', vraag:'En met precies één biljet van 5 euro?', ans:Math.floor((B - 5) / 2) + 1 },
      { fase:'uitvoeren', vraag:'Hoeveel manieren in totaal?', ans:juist }],
    uitw:{ begrijpen:`${B} euro met 5, 2 en 1 euro.`,
      plannen:'Tel systematisch: in een tabel, eerst het aantal biljetten van 5, dan het aantal munten van 2.',
      uitvoeren:`<table class="dtable"><tr><th>5 euro</th><th>2 euro</th><th>1 euro</th></tr>${opl.map(o=>`<tr><td>${o[0]}</td><td>${o[1]}</td><td>${o[2]}</td></tr>`).join('')}</table>Dat zijn <b>${juist}</b> manieren.`,
      terugkijken:'Door de tabel ordelijk op te bouwen, vergeet je geen manier.' } };
} });

T({ id:'c08', h:'tellen', niv:2, bron:'een dobbelsteenprobleem', maak(R){
  const s = R.int(3, 11), juist = 6 - Math.abs(s - 7);
  return { tekst:`<p>Je gooit met een rode en een blauwe dobbelsteen en telt de ogen op.</p><p><b>Op hoeveel manieren kan je samen ${s} gooien?</b> (3 op rood en 4 op blauw is een andere manier dan 4 op rood en 3 op blauw.)</p>`,
    mc:opties(R, juist, [Math.ceil(juist / 2), juist + 1, juist - 1, 6, s - 1], { min:1 }),
    hint:[{ fase:'plannen', vraag:'Maak een tabel van 6 bij 6 met de sommen. Hoeveel ogen moet blauw tonen als rood 1 toont? (Typ 0 als het niet kan.)', ans:s - 1 > 6 ? 0 : s - 1 },
      { fase:'uitvoeren', vraag:`Hoeveel vakjes in de tabel bevatten ${s}?`, ans:juist }],
    uitw:{ begrijpen:`Twee dobbelstenen, rood en blauw. Som ${s}.`,
      plannen:'Tel systematisch in een tabel van alle 36 mogelijkheden.',
      uitvoeren:`<table class="dtable dob"><tr><th>+</th>${[1, 2, 3, 4, 5, 6].map(b=>`<th>${b}</th>`).join('')}</tr>${[1, 2, 3, 4, 5, 6].map(a=>`<tr><th>${a}</th>${[1, 2, 3, 4, 5, 6].map(b=>`<td${a + b === s ? ' class="hl"' : ''}>${a + b}</td>`).join('')}</tr>`).join('')}</table>De som ${s} staat <b>${juist}</b> keer in de tabel.`,
      terugkijken:'Patroon: de sommen staan op schuine lijnen. Op de langste lijn (7) staan er 6.' } };
} });

T({ id:'c09', h:'tellen', niv:2, bron:'Wallabie 2019', maak(R){
  const d = R.int(1, 9), N = R.int(40, 130); let juist = 0; for(let i = 1; i <= N; i++) juist += String(i).split('').filter(x=>x === String(d)).length;
  const nm = R.naam();
  return { tekst:`<p>${nm} schrijft alle getallen van 1 tot en met ${N} op.</p><p><b>Hoeveel keer schrijft ${nm} het cijfer ${d}?</b></p>`,
    mc:opties(R, juist, [juist - 1, juist + 1, Math.floor(N / 10), juist - 10, juist + 10], { min:1 }),
    hint:[{ fase:'plannen', vraag:`Tel eerst de eenheden. Hoeveel getallen tot ${N} eindigen op ${d}?`, ans:Array.from({ length:N }, (_, i)=>i + 1).filter(i=>i % 10 === d).length },
      { fase:'uitvoeren', vraag:`Tel nu de tientallen. Hoeveel keer staat ${d} op de plaats van de tientallen?`, ans:Array.from({ length:N }, (_, i)=>i + 1).filter(i=>Math.floor(i / 10) % 10 === d).length }],
    uitw:{ begrijpen:`Gevraagd: hoeveel keer het cijfer ${d} voorkomt, niet in hoeveel getallen.`,
      plannen:'Tel systematisch: eerst de eenheden, dan de tientallen (en de honderdtallen).',
      uitvoeren:(()=>{ const e = Array.from({ length:N }, (_, i)=>i + 1).filter(i=>i % 10 === d).length, t = Array.from({ length:N }, (_, i)=>i + 1).filter(i=>Math.floor(i / 10) % 10 === d).length, h = Array.from({ length:N }, (_, i)=>i + 1).filter(i=>Math.floor(i / 100) === d).length;
        return `Eenheden: ${e} keer. Tientallen: ${t} keer${h ? `. Honderdtallen: ${h} keer` : ''}. Samen: <b>${juist}</b>.`; })(),
      terugkijken:`${d * 11 <= N ? `Het getal ${d * 11} telt twee keer mee: één keer bij de eenheden en één keer bij de tientallen.` : 'Door eerst de eenheden en dan de tientallen te tellen, vergeet je er geen.'}` } };
} });

T({ id:'c10', h:'tellen', niv:3, bron:'een roosterprobleem', maak(R){
  let m, n; do{ m = R.int(2, 4); n = R.int(2, 5); } while(m * n < 6);
  const juist = comb(m + n, m);
  return { tekst:`<p>Een mier loopt over de lijnen van het rooster van A (linksonder) naar B (rechtsboven). Ze loopt altijd naar rechts of naar boven, nooit terug.</p><p><b>Hoeveel verschillende wegen kan de mier nemen?</b></p>`,
    fig:rooster(m, n, { AB:true }),
    mc:opties(R, juist, [m * n, m + n, juist - 1, 2 * (m + n), juist + m]),
    uitw:{ begrijpen:`Het rooster is ${n} hokjes breed en ${m} hokjes hoog.`,
      plannen:'Tel systematisch: schrijf bij elk kruispunt op op hoeveel manieren je er kan komen. Je komt er van links of van onder.',
      uitvoeren:rooster(m, n, { getallen:true, c:38 }) + `Elk getal is de som van het getal links en het getal eronder. Bij B staat <b>${juist}</b>.`,
      terugkijken:'Op de onderste rij en de linkerkolom staat overal 1: daar kan je maar op één manier komen.' } };
} });

T({ id:'c11', h:'tellen', niv:3, bron:'een opgave over cijfersommen', maak(R){
  const s = R.int(3, 7); const L = []; for(let i = 100; i <= 999; i++) if(cijfersom(i) === s) L.push(i);
  return { tekst:`<p><b>Hoeveel getallen van drie cijfers hebben een cijfersom van ${s}?</b></p><p>Bijvoorbeeld: ${L[Math.floor(L.length / 2)]} heeft cijfersom ${s}.</p>`,
    mc:opties(R, L.length, [L.length - s, L.length - 1, L.length + 1, s * 3, comb(s + 2, 2)]),
    uitw:{ begrijpen:`Getallen van 100 tot 999 waarvan de cijfers samen ${s} zijn. Het eerste cijfer is minstens 1.`,
      plannen:'Tel systematisch: per honderdtal (eerste cijfer 1, 2, …).',
      uitvoeren:Array.from({ length:s }, (_, i)=>i + 1).map(h=>`Begint met ${h}: ${L.filter(x=>Math.floor(x / 100) === h).length} getal${L.filter(x=>Math.floor(x / 100) === h).length === 1 ? "" : "len"}`).join('<br>') + `<br>Samen: <b>${L.length}</b>.` + lijstHTML(L.slice(0, 30)) + (L.length > 30 ? '…' : ''),
      terugkijken:'Per honderdtal is er een patroon: telkens één getal minder.' } };
} });

T({ id:'c12', h:'tellen', niv:3, bron:'een opgave over rechthoeken', maak(R){
  const m = R.int(1, 2), n = R.int(3, 5), juist = comb(m + 1, 2) * comb(n + 1, 2);
  return { tekst:`<p>Hieronder zie je een rooster van ${m} bij ${n} hokjes.</p><p><b>Hoeveel rechthoeken (ook vierkanten) zie je in totaal?</b></p>`,
    fig:rooster(m, n, { c:30 }),
    mc:opties(R, juist, [m * n, juist - m * n, comb(n + 1, 2), juist + 1, juist - 1]),
    uitw:{ begrijpen:'Je telt alle rechthoeken, van één hokje tot het hele rooster.',
      plannen:'Tel systematisch: een rechthoek kies je met twee verticale lijnen en twee horizontale lijnen.',
      uitvoeren:`Verticale lijnen: ${n + 1}, daaruit 2 kiezen: ${comb(n + 1, 2)} manieren. Horizontale lijnen: ${m + 1}, daaruit 2 kiezen: ${comb(m + 1, 2)} manier${comb(m + 1, 2) > 1 ? 'en' : ''}. Samen ${comb(n + 1, 2)} · ${comb(m + 1, 2)} = <b>${juist}</b>.`,
      terugkijken:m === 1 ? `Controle per breedte: ${Array.from({ length:n }, (_, i)=>n - i).join(' + ')} = ${juist}. ✓` : 'Controle: tel per hoogte (1 of 2 hokjes) en per breedte in een tabel.' } };
} });

/* ============================================================
   DOOR ELKAAR: elke vraag zegt welke heuristieken handig zijn (heur, de eerste is de hoofdheuristiek)
   ============================================================ */
const M = (def) => { def.h = 'mix'; def.hoofd = def.heur[0]; const maak = def.maak; def.maak = R=>Object.assign(maak(R), { heur:def.heur }); return T(def); };

M({ id:'m01', niv:3, heur:['tellen', 'patroon'], bron:'Wallabie 2019', maak(R){
  const d = R.int(1, 9), tel = N=>{ let c = 0; for(let i = 1; i <= N; i++) c += String(i).split('').filter(x=>x === String(d)).length; return c; };
  const bevat = N=>String(N).includes(String(d));
  let N; do{ N = R.int(35, 150); } while(!bevat(N) || tel(N) < 8);
  const k = tel(N), kand = []; for(let x = 20; x <= 160; x++) if(tel(x) !== k) kand.push(x);
  const afl = R.shuffle(kand.filter(x=>Math.abs(x - N) < 40)).slice(0, 4);
  return { tekst:`<p>De bladzijden van een boek zijn genummerd. De eerste bladzijde heeft nummer 1. In alle paginanummers samen komt het cijfer ${d} precies ${k} keer voor.</p><p><b>Welk nummer kan de laatste bladzijde hebben?</b></p>`,
    mc:opties(R, N, afl),
    hint:[{ fase:'plannen', vraag:`Tel systematisch. Hoeveel keer staat ${d} in de getallen van 1 tot en met 9?`, ans:1 }, { fase:'uitvoeren', vraag:`Hoeveel keer staat ${d} in de getallen van 1 tot en met ${N}?`, ans:k }],
    uitw:{ begrijpen:`Het cijfer ${d} komt ${k} keer voor in de nummers 1 tot de laatste bladzijde.`,
      plannen:'Tel systematisch: per tiental, en zoek een patroon (in elk gewoon tiental één keer bij de eenheden).',
      uitvoeren:`Probeer de keuzes. Tot ${N}: ${k} keer. ✓ ${afl.slice(0, 2).map(x=>`Tot ${x}: ${tel(x)} keer.`).join(' ')} Antwoord: <b>${N}</b>.`,
      terugkijken:`Het tiental ${d}0–${d}9 telt extra mee: daar staat ${d} ook op de plaats van de tientallen.` } };
} });

M({ id:'m02', niv:2, heur:['patroon', 'vereenv'], bron:'Kangoeroe', maak(R){
  const a = R.pick([4, 9]), N = R.int(100, 2100), juist = a === 4 ? (N % 2 ? 4 : 6) : (N % 2 ? 9 : 1);
  return { tekst:`<p>${a}<sup>1</sup> = ${a}, ${a}<sup>2</sup> = ${a * a}, ${a}<sup>3</sup> = ${a ** 3}, …</p><p><b>Op welk cijfer eindigt ${a}<sup>${N}</sup>?</b></p>`,
    mc:opties(R, juist, [a === 4 ? 6 : 1, a === 4 ? 4 : 9, 0, 2, 8, 3]),
    hint:[{ fase:'plannen', vraag:`Op welk cijfer eindigt ${a}<sup>4</sup>?`, ans:a ** 4 % 10 }, { fase:'uitvoeren', vraag:`Is ${N} even of oneven? Typ even of oneven.`, ans:[N % 2 ? 'oneven' : 'even'] }],
    uitw:{ begrijpen:'Gevraagd: het laatste cijfer van een heel grote macht.',
      plannen:'Zoek een patroon in de laatste cijfers.',
      uitvoeren:`Laatste cijfers: ${a === 4 ? '4, 6, 4, 6, …' : '9, 1, 9, 1, …'}: oneven exponent → ${a === 4 ? 4 : 9}, even exponent → ${a === 4 ? 6 : 1}. ${N} is ${N % 2 ? 'oneven' : 'even'}: <b>${juist}</b>.`,
      terugkijken:'Het patroon is hier maar 2 lang. Bij 2, 3, 7 en 8 is het 4 lang.' } };
} });

M({ id:'m03', niv:2, heur:['schets', 'uitpr'], bron:'Wallabie 2010', maak(R){
  const zes = R.r() < .5, nm = R.meisje();
  const L = zes ? ['een vierkant', 'een rechthoek', 'een gelijkzijdige driehoek', 'een trapezium', 'een rechthoekige driehoek'] : ['een gelijkzijdige driehoek', 'een vierkant', 'een rechthoek', 'een trapezium', 'een rechthoekige driehoek'];
  const n = zes ? 6 : 8; let s = ''; const P = Array.from({ length:n }, (_, i)=>[80 + 62 * Math.cos(Math.PI / 2 + i * 2 * Math.PI / n), 76 - 62 * Math.sin(Math.PI / 2 + i * 2 * Math.PI / n)]);
  s += veelhoek(P, { k:'var(--border)', w:1, st:'stroke-dasharray:4 3' }); P.forEach(p=>{ s += cirkel(p[0], p[1], 4.5, { f:'var(--ink)', k:'none', w:0 }); });
  const volg = R.shuffle(L);
  return { tekst:`<p>${nm} tekent de hoekpunten van een regelmatige ${zes ? 'zeshoek' : 'achthoek'}. Door een aantal van die punten te verbinden met lijnstukken, tekent ze een figuur.</p><p><b>Welke figuur kan ${nm} zo onmogelijk tekenen?</b></p>`,
    fig:svg(160, 152, s, { b:150, label:'hoekpunten van een regelmatige veelhoek' }),
    mc:{ keuzes:volg, juist:volg.indexOf(L[0]) },
    hint:[{ fase:'plannen', vraag:'Schets de punten en probeer elke figuur. Hoeveel van de vijf figuren lukken wel?', ans:4 }],
    uitw:{ begrijpen:`${n} punten op een cirkel, op gelijke afstand.`,
      plannen:'Maak een schets en probeer de figuren één voor één.',
      uitvoeren:zes ? 'Rechthoek: twee tegenoverliggende zijden met de punten ertegenover. Gelijkzijdige driehoek: om het andere punt. Trapezium: vier punten naast elkaar. Rechthoekige driehoek: twee tegenoverliggende punten en een derde. Een vierkant lukt niet: de diagonalen van een vierkant staan loodrecht op elkaar, en bij de zeshoek maken de lange diagonalen hoeken van 60°. Antwoord: <b>een vierkant</b>.'
        : 'Vierkant: om het andere punt. Rechthoek, trapezium en rechthoekige driehoek lukken ook. Een gelijkzijdige driehoek lukt niet: dan moeten de punten om de 8 : 3 plaatsen liggen, en dat is geen geheel getal. Antwoord: <b>een gelijkzijdige driehoek</b>.',
      terugkijken:'Bij uitproberen zoek je eerst de figuren die wél lukken. Wat overblijft, is het antwoord.' } };
} });

M({ id:'m05', niv:2, heur:['schets', 'vereenv'], bron:'Wallabie 2019', maak(R){
  const n = R.pick([3, 5]), r = R.pick([2, 3]), weg = r === 3 ? 3 * n - 2 : 2 * n - 1, juist = n ** 3 - weg, nm = R.naam();
  const richt = r === 3 ? 'van voor naar achter, van links naar rechts en van onder naar boven' : 'van voor naar achter en van links naar rechts';
  return { tekst:`<p>${nm} heeft een grote kubus van ${n} × ${n} × ${n} kleine blokjes. ${nm} boort er recht door het midden ${r} tunnels door: ${richt}. Elke tunnel haalt een rij van ${n} blokjes weg.</p><p><b>Hoeveel blokjes blijven er over?</b></p>`,
    mc:opties(R, juist, [n ** 3 - r * n, n ** 3 - r * n + 1, juist - 1, n ** 3 - weg - 1 + 2, juist + 2]),
    hint:[{ fase:'plannen', vraag:'Hoeveel blokjes heeft de kubus in het begin?', ans:n ** 3 }, { fase:'uitvoeren', vraag:'Hoeveel blokjes worden er weggehaald? Let op het middelste blokje!', ans:weg }],
    uitw:{ begrijpen:`${n ** 3} blokjes. ${r} tunnels door het midden.`,
      plannen:'Maak een schets van de tunnels. Ze kruisen elkaar in het middelste blokje.',
      uitvoeren:`Elke tunnel: ${n} blokjes. Samen ${r} · ${n} = ${r * n}, maar het middelste blokje zit in alle ${r} tunnels en mag maar één keer weg: ${r * n} − ${r - 1} = ${weg}. Over: ${n ** 3} − ${weg} = <b>${juist}</b>.`,
      terugkijken:'Het blokje waar tunnels elkaar kruisen, tel je maar één keer.' } };
} });

M({ id:'m06', niv:3, heur:['vereenv', 'patroon'], bron:'Wallabie 2010', maak(R){
  const n = R.int(8, 20), juist = n * (n + 1) / 2 - (n - 1), nm = R.meisje();
  return { tekst:`<p>${nm} schrijft de getallen 1 tot en met ${n} op het bord. Ze veegt telkens twee getallen uit en schrijft in de plaats hun som min 1. Dat doet ze tot er nog maar één getal op het bord staat.</p><p><b>Welk getal is dat?</b></p>`,
    mc:opties(R, juist, [n * (n + 1) / 2, n * (n + 1) / 2 - n, juist + 1, n, juist - 2]),
    hint:[{ fase:'plannen', vraag:'Vereenvoudig: doe het met 1, 2, 3. Welk getal blijft over?', ans:4 }, { fase:'uitvoeren', vraag:`Hoeveel keer veegt ${nm} twee getallen uit als ze met ${n} getallen begint?`, ans:n - 1 }],
    uitw:{ begrijpen:'Bij elke stap: twee getallen worden één getal, en de som daalt met 1.',
      plannen:'Vereenvoudig: probeer met kleine aantallen en zoek een patroon.',
      uitvoeren:`Elke stap verlaagt de som van alle getallen met 1, en er verdwijnt één getal. Van ${n} getallen naar 1 getal: ${n - 1} stappen. Som in het begin: ${n * (n + 1) / 2}. Op het einde: ${n * (n + 1) / 2} − ${n - 1} = <b>${juist}</b>.`,
      terugkijken:'Met 1, 2, 3: som 6, 2 stappen, 6 − 2 = 4. Probeer het: 1 en 2 → 2; 2 en 3 → 4. ✓' } };
} });

M({ id:'m07', niv:2, heur:['tellen', 'vereenv'], bron:'een klokprobleem', maak(R){
  const a = R.int(6, 10), b = R.int(2, 6), uren = []; for(let h = a; h <= 12; h++) uren.push(h); for(let h = 1; h <= b; h++) uren.push(h);
  const juist = uren.reduce((x, y)=>x + y, 0);
  return { tekst:`<p>Een kerkklok slaat elk heel uur zoveel keer als het uur aangeeft: om 3 uur slaat ze 3 keer, om 12 uur 12 keer, om 1 uur 1 keer.</p><p><b>Hoeveel keer slaat de klok van ${a} uur 's morgens tot en met ${b} uur 's middags?</b></p>`,
    mc:opties(R, juist, [juist - a, uren.length, juist + b, (a + 12 + b) * 2, juist - 12]),
    hint:[{ fase:'plannen', vraag:'Tel systematisch. Hoeveel keer slaat de klok in totaal van ' + a + ' uur tot en met 12 uur?', ans:uren.filter((h, i)=>i <= 12 - a).reduce((x, y)=>x + y, 0) }, { fase:'uitvoeren', vraag:'En van 1 uur tot en met ' + b + ' uur?', ans:b * (b + 1) / 2 }],
    uitw:{ begrijpen:`Uren ${uren.join(', ')}. Na 12 uur begint de klok terug bij 1.`,
      plannen:'Tel systematisch: schrijf alle uren op en tel op.',
      uitvoeren:`${uren.join(' + ')} = <b>${juist}</b>.`,
      terugkijken:'Let op: na 12 uur slaat de klok 1 keer, niet 13 keer.' } };
} });

M({ id:'m08', niv:3, heur:['schets', 'uitpr'], bron:'Wallabie 2019', maak(R){
  const n = R.pick([4, 5, 6]), namen = R.namen(n);
  /* alle grafen met graad 1..n-1 voor de eerste n-1 personen: de graad van de laatste */
  const E = []; for(let i = 0; i < n; i++) for(let j = i + 1; j < n; j++) E.push([i, j]);
  const ant = new Set();
  for(let m = 0; m < (1 << E.length); m++){ const g = Array(n).fill(0); E.forEach(([i, j], k)=>{ if(m >> k & 1){ g[i]++; g[j]++; } }); if(g.slice(0, n - 1).every((x, i)=>x === i + 1)) ant.add(g[n - 1]); }
  const juist = [...ant][0];
  const keuzes = Array.from({ length:n }, (_, i)=>i).slice(0, 5); while(keuzes.length < 5) keuzes.push(keuzes.length);
  return { tekst:`<p>${namen.join(', ').replace(/, ([^,]*)$/, ' en $1')} komen elkaar tegen op een feest. Ieder geeft een hand aan iedereen die hij of zij kent, en niemand geeft twee keer een hand aan dezelfde persoon.</p><p>${namen.slice(0, n - 1).map((x, i)=>`${x} geeft ${i + 1} hand${i ? 'en' : ''}`).join(', ')}.</p><p><b>Hoeveel handen geeft ${namen[n - 1]}?</b></p>`,
    mc:opties(R, juist, keuzes, { min:0 }),
    controle:()=>ant.size === 1,
    hint:[{ fase:'plannen', vraag:`Maak een schets met een punt per persoon. ${namen[n - 2]} geeft een hand aan iedereen. Hoeveel handen geeft ${namen[0]} dan nog aan anderen?`, ans:0 }],
    uitw:{ begrijpen:`${n} personen. Je kent het aantal handen van alle personen behalve ${namen[n - 1]}.`,
      plannen:'Maak een schets: een punt per persoon en een lijn voor elke handdruk. Begin bij wie het meest handen geeft.',
      uitvoeren:`${namen[n - 2]} geeft ${n - 1} handen: aan iedereen. Dus ${namen[0]} (1 hand) kent enkel ${namen[n - 2]}. ${n > 4 ? `${namen[n - 3]} geeft ${n - 2} handen: aan iedereen behalve ${namen[0]}. ` : ''}Zo verder werken geeft voor ${namen[n - 1]}: <b>${juist}</b> handen.`,
      terugkijken:'Controle: tel in je schets alle lijnen bij elk punt. Elk aantal klopt. ✓' } };
} });

M({ id:'m12', niv:2, heur:['schets'], bron:'een opgave met coördinaten', maak(R){
  const g = R.int(5, 50) * 10, a = 2 * g, b = 3 * g, nm = R.shuffle(['W', 'I', 'S', 'K']);
  const pos = [[a, 0], [0, a], [a, a], [g, b]], pts = {}; nm.forEach((k, i)=>{ pts[k] = pos[i]; });
  const L = Object.keys(pts).sort((x, y)=>'WISK'.indexOf(x) - 'WISK'.indexOf(y)), paren = []; for(let i = 0; i < 4; i++) for(let j = i + 1; j < 4; j++) paren.push(L[i] + L[j]);
  const hor = paren.filter(p=>pts[p[0]][1] === pts[p[1]][1]);
  const juist = hor[0], afl = R.shuffle(paren.filter(p=>p !== juist)).slice(0, 4);
  return { tekst:`<p>In het vlak liggen vier punten: ${L.map(k=>`${k}(${nf(pts[k][0])}, ${nf(pts[k][1])})`).join(', ')}.</p><p><b>Welke rechte is evenwijdig met de x-as?</b></p>`,
    mc:opties(R, juist, afl, { fmt:String }),
    hint:[{ fase:'plannen', vraag:'Maak een ruwe schets. Een rechte evenwijdig met de x-as is horizontaal: wat hebben alle punten erop gemeen? Typ x of y.', ans:['y', 'de y-coördinaat', 'y-coördinaat'] }],
    uitw:{ begrijpen:'Vier punten met grote coördinaten. Gezocht: een horizontale rechte.',
      plannen:'Maak een schets (niet op schaal). Punten op een horizontale rechte hebben dezelfde y-coördinaat.',
      uitvoeren:`${juist[0]} en ${juist[1]} hebben allebei y = ${nf(pts[juist[0]][1])}. Dus <b>${juist}</b> is evenwijdig met de x-as.`,
      terugkijken:'Twee punten met dezelfde x-coördinaat liggen op een verticale rechte (evenwijdig met de y-as).' } };
} });

M({ id:'m14', niv:2, heur:['patroon', 'tellen'], bron:'een opgave over knipperlichten', maak(R){
  let a, b; do{ a = R.int(4, 15); b = R.int(4, 15); } while(a === b || kgv(a, b) > 120 || kgv(a, b) === Math.max(a, b) && R.r() < .7);
  const juist = kgv(a, b);
  return { tekst:`<p>Een rood lampje knippert om de ${a} seconden. Een groen lampje knippert om de ${b} seconden. Net nu knipperen ze samen.</p><p><b>Na hoeveel seconden knipperen ze voor het eerst weer samen?</b></p>`,
    getal:juist, eenheid:'seconden',
    hint:[{ fase:'plannen', vraag:`Schrijf de tijden van het rode lampje op: ${a}, ${2 * a}, ${3 * a}, … Wat is de vijfde tijd?`, ans:5 * a }, { fase:'uitvoeren', vraag:'Welke tijd staat in de lijst van allebei de lampjes?', ans:juist }],
    uitw:{ begrijpen:`Rood om de ${a} s, groen om de ${b} s.`,
      plannen:'Schrijf systematisch de tijden van beide lampjes op en zoek de eerste tijd die in beide lijsten staat.',
      uitvoeren:`Rood: ${Array.from({ length:Math.min(juist / a, 8) }, (_, i)=>(i + 1) * a).join(', ')}${juist / a > 8 ? ', …, ' + juist : ''}<br>Groen: ${Array.from({ length:Math.min(juist / b, 8) }, (_, i)=>(i + 1) * b).join(', ')}${juist / b > 8 ? ', …, ' + juist : ''}<br>Eerste gemeenschappelijke tijd: <b>${juist} s</b> (het kgv van ${a} en ${b}).`,
      terugkijken:`${a} · ${b} = ${a * b} is ook een gemeenschappelijke tijd, maar ${juist === a * b ? 'hier is dat ook de eerste' : 'niet de eerste'}.` } };
} });

M({ id:'m15', niv:1, heur:['patroon', 'vereenv'], bron:'een opgave over trappen', maak(R){
  const n = R.int(6, 15), juist = n * (n + 1) / 2, c = 12;
  const trap = k=>{ let s = ''; for(let i = 0; i < k; i++) for(let j = 0; j <= i; j++) s += rh(i * c, (k - 1 - j) * c, c, c, { f:'#e8c48a', k:'var(--ink)', w:1 }); return { s, W:k * c, H:k * c }; };
  return { tekst:`<p>Met blokjes bouw je trappen. Je ziet een trap met 1, 2 en 3 treden.</p><p><b>Hoeveel blokjes heb je nodig voor een trap met ${n} treden?</b></p>`,
    fig:rijFiguren(trap, [1, 2, 3]),
    mc:opties(R, juist, [n * n, n * (n - 1) / 2, 2 * n, juist + n, n * (n + 1)]),
    hint:[{ fase:'plannen', vraag:'Hoeveel blokjes heeft de trap met 4 treden?', ans:10 }, { fase:'uitvoeren', vraag:`Een trap met ${n} treden heeft kolommen van 1, 2, …, ${n} blokjes. Hoeveel is 1 + ${n}?`, ans:n + 1 }],
    uitw:{ begrijpen:`Een trap met ${n} treden: kolommen van 1 tot ${n} blokjes.`,
      plannen:'Zoek het patroon: 1, 3, 6, 10, … Er komt telkens één kolom bij.',
      uitvoeren:`1 + 2 + … + ${n}: paren 1 + ${n}, 2 + ${n - 1}, … zijn telkens ${n + 1}. ${n} getallen = ${n / 2} paren: ${n / 2} · ${n + 1} = <b>${juist}</b>.`,
      terugkijken:'Twee dezelfde trappen tegen elkaar vormen een rechthoek van ' + n + ' bij ' + (n + 1) + '. De helft daarvan is je trap.' } };
} });

M({ id:'m16', niv:3, heur:['uitpr', 'tellen'], bron:'een postzegelprobleem', maak(R){
  const [a, b] = R.pick([[3, 5], [3, 7], [4, 5], [5, 7], [4, 7]]), kan = x=>{ for(let i = 0; i * a <= x; i++) if((x - i * a) % b === 0) return true; return false; };
  const nk = []; for(let x = 1; x <= a * b; x++) if(!kan(x)) nk.push(x);
  const groot = nk.filter(x=>x > Math.max(a, b)), juist = groot.length ? R.pick(groot) : nk[nk.length - 1];
  const ok = []; for(let x = juist - 8; x <= juist + 10; x++) if(x > Math.max(a, b) && kan(x)) ok.push(x);
  return { tekst:`<p>Je hebt postzegels van ${a} euro en van ${b} euro, van elk zoveel als je wil.</p><p><b>Welk bedrag kan je NIET precies plakken?</b></p>`,
    mc:opties(R, juist, R.shuffle(ok).slice(0, 4), { fmt:v=>v + ' euro' }),
    hint:[{ fase:'plannen', vraag:'Probeer de keuzes. Kan je ' + ok[0] + ' euro plakken? Typ ja of nee.', ans:['ja'] }],
    uitw:{ begrijpen:`Bedragen die je kan maken met postzegels van ${a} en ${b} euro.`,
      plannen:'Probeer elke keuze: trek telkens ' + b + ' af en kijk of de rest een veelvoud van ' + a + ' is.',
      uitvoeren:`Met ${a} en ${b} euro kan je niet maken: ${nk.join(', ')}. Bij de keuzes is dat enkel <b>${juist} euro</b>.`,
      terugkijken:`Vanaf ${nk[nk.length - 1] + 1} euro kan je elk bedrag maken.` } };
} });

M({ id:'m17', niv:1, heur:['vereenv', 'schets'], bron:'een leesprobleem', maak(R){
  const a = R.int(12, 80), b = a + R.int(15, 90), nm = R.naam();
  return { tekst:`<p>${nm} leest vandaag in een boek van bladzijde ${a} tot en met bladzijde ${b}.</p><p><b>Hoeveel bladzijden leest ${nm} vandaag?</b></p>`,
    mc:opties(R, b - a + 1, [b - a, b - a + 2, b - a - 1, b + a]),
    hint:[{ fase:'plannen', vraag:'Vereenvoudig: van bladzijde 3 tot en met bladzijde 5. Hoeveel bladzijden zijn dat?', ans:3 }],
    uitw:{ begrijpen:`Van ${a} tot en met ${b}: de eerste en de laatste tellen mee.`,
      plannen:'Vereenvoudig: van 3 tot en met 5 zijn het 3 bladzijden (3, 4, 5), en 5 − 3 = 2. Er komt er dus één bij.',
      uitvoeren:`${b} − ${a} + 1 = <b>${b - a + 1}</b> bladzijden.`,
      terugkijken:'“Tot en met” betekent dat je beide grenzen meetelt.' } };
} });

M({ id:'m18', niv:1, heur:['uitpr', 'vereenv'], bron:'een opgave over fietsen', maak(R){
  const F = R.int(10, 30), d = R.int(2, F - 3), W = 2 * F + d;
  return { tekst:`<p>Op de speelplaats staan fietsen en driewielers, samen ${F} stuks. Ze hebben samen ${W} wielen.</p><p><b>Hoeveel driewielers staan er?</b></p>`,
    getal:d, eenheid:'driewielers',
    hint:[{ fase:'plannen', vraag:'Stel dat het allemaal fietsen zijn. Hoeveel wielen?', ans:2 * F }, { fase:'uitvoeren', vraag:'Hoeveel wielen komen er bij per driewieler?', ans:1 }],
    uitw:{ begrijpen:`${F} voertuigen, ${W} wielen. Fiets 2 wielen, driewieler 3.`,
      plannen:'Probeer: begin met allemaal fietsen en vervang er telkens één door een driewieler.',
      uitvoeren:`Allemaal fietsen: ${2 * F} wielen. Er zijn ${W - 2 * F} wielen te weinig, en elke driewieler brengt 1 wiel extra: <b>${d} driewielers</b>.`,
      terugkijken:`${d} · 3 + ${F - d} · 2 = ${3 * d} + ${2 * (F - d)} = ${W}. ✓` } };
} });

M({ id:'m20', niv:1, heur:['schets', 'patroon'], bron:'een tafelprobleem', maak(R){
  const t = R.int(5, 20), P = 2 * t + 2;
  return { tekst:`<p>Aan een vierkante tafel kunnen 4 personen zitten, één aan elke kant. Voor een feest zet je zulke tafels in één lange rij tegen elkaar.</p><p><b>Hoeveel tafels heb je nodig voor ${P} personen?</b></p>`,
    mc:opties(R, t, [P / 4, t + 1, t - 1, P / 2, Math.round(P / 3)], { min:1 }),
    hint:[{ fase:'plannen', vraag:'Maak een schets van 2 tafels tegen elkaar. Hoeveel personen kunnen er zitten?', ans:6 }, { fase:'uitvoeren', vraag:'Hoeveel personen extra per tafel die je bijzet?', ans:2 }],
    uitw:{ begrijpen:`Tafels in één rij, ${P} personen.`,
      plannen:'Maak een schets van 1, 2 en 3 tafels en zoek het patroon: 4, 6, 8, …',
      uitvoeren:`Aan elke tafel zitten 2 personen langs de lange kanten, en aan de uiteinden nog 1 + 1. Met t tafels: 2 · t + 2 personen. 2 · t + 2 = ${P}, dus t = <b>${t}</b>.`,
      terugkijken:`Controle: ${t} tafels → 2 · ${t} + 2 = ${P}. ✓` } };
} });

M({ id:'m21', niv:2, heur:['uitpr', 'vereenv'], bron:'een getallenraadsel', maak(R){
  const k = R.int(3, 5), m = R.int(10, 80), S = k * m + (k * (k - 1)) / 2, groot = m + k - 1, kw = ['', '', '', 'drie', 'vier', 'vijf'][k];
  return { tekst:`<p>${kw[0].toUpperCase() + kw.slice(1)} opeenvolgende natuurlijke getallen hebben samen als som ${S}.</p><p><b>Wat is het grootste van die getallen?</b></p>`,
    mc:opties(R, groot, [Math.round(S / k), groot + 1, groot - 1, m, groot + 2]),
    hint:[{ fase:'plannen', vraag:`Probeer: deel ${S} door ${k}. Ongeveer hoeveel is elk getal?`, ans:[S / k, Math.round(S / k), Math.floor(S / k)] }, { fase:'uitvoeren', vraag:'Wat is het kleinste getal?', ans:m }],
    uitw:{ begrijpen:`${k} getallen na elkaar, bv. 7, 8, 9${k > 3 ? ', 10' : ''}. Som ${S}.`,
      plannen:'Probeer getallen rond het gemiddelde: de som gedeeld door het aantal.',
      uitvoeren:`${S} : ${k} = ${nf(S / k)}. Probeer ${Array.from({ length:k }, (_, i)=>m + i).join(' + ')} = ${S}. ✓ Het grootste is <b>${groot}</b>.`,
      terugkijken:'Het gemiddelde ligt in het midden van de getallen.' } };
} });

M({ id:'m22', niv:3, heur:['uitpr', 'patroon'], bron:'een restraadsel', maak(R){
  const set = R.pick([[3, 4, 5], [2, 3, 5], [3, 4], [4, 5], [2, 3, 4, 5], [2, 5], [3, 5]]), L = set.reduce(kgv), kandN = []; for(let x = L - 1; x < 100; x += L) kandN.push(x);
  const juistUniek = R.pick(kandN), meer = kandN.length > 1;
  const lo = Math.max(0, juistUniek - R.int(1, L - 2)), hi = Math.min(100, juistUniek + R.int(1, L - 2)), nm = R.naam();
  const zin = set.map(d=>`deel je ze per ${d}, dan blijft er ${d - 1} over`).join('; ');
  const ond = meer ? `Het zijn er meer dan ${lo} en minder dan ${hi}.` : 'Het zijn er minder dan 100.';
  return { tekst:`<p>${nm} heeft een zak knikkers: ${zin}. ${ond}</p><p><b>Hoeveel knikkers heeft ${nm}?</b></p>`,
    mc:opties(R, juistUniek, [juistUniek + 1, juistUniek - 2, juistUniek + L, juistUniek - L, juistUniek + 2].filter(x=>x > 0 && x < 110)),
    controle:()=>{ const ok = []; for(let x = 1; x < 100; x++) if(set.every(d=>x % d === d - 1) && (!meer || (x > lo && x < hi))) ok.push(x); return ok.length === 1 && ok[0] === juistUniek; },
    uitw:{ begrijpen:'Bij elke deling blijft er één minder over dan de deler.',
      plannen:'Probeer de keuzes, of zoek een patroon: met één knikker meer zou elke deling precies opgaan.',
      uitvoeren:`Met één knikker meer is het aantal deelbaar door ${set.join(', ')}: een veelvoud van ${L}. Mogelijke aantallen: ${kandN.filter(x=>x < 100).join(', ')}. Met de voorwaarde: <b>${juistUniek}</b>.`,
      terugkijken:`${set.map(d=>`${juistUniek} : ${d} = ${Math.floor(juistUniek / d)} rest ${juistUniek % d}`).join('; ')}. ✓` } };
} });

M({ id:'m23', niv:2, heur:['terug', 'schets'], bron:'een wandelprobleem', maak(R){
  const d = R.int(2, 3), r = R.int(2, 9), tot = r * Math.pow(2, d), nm = R.naam();
  return { tekst:`<p>${nm} wandelt een lange tocht. Elke dag wandelt ${nm} de helft van wat er nog overblijft. Na ${d} dagen blijft er nog ${r} km over.</p><p><b>Hoe lang is de hele tocht?</b></p>`,
    mc:opties(R, tot, [r * 2 * d, r + d * 2, tot / 2, tot * 2, tot + r], { fmt:v=>v + ' km' }),
    hint:[{ fase:'plannen', vraag:`Werk achterwaarts. Hoeveel km bleef er over aan het begin van dag ${d}?`, ans:2 * r, eenheid:'km' }],
    uitw:{ begrijpen:`Elke dag de helft van de rest. Na ${d} dagen: ${r} km over.`,
      plannen:'Werk achterwaarts: een dag terug = het dubbele.',
      uitvoeren:`Na dag ${d}: ${r} km. Begin dag ${d}: ${2 * r} km.${d === 3 ? ` Begin dag 2: ${4 * r} km.` : ''} Begin dag 1: <b>${tot} km</b>.`,
      terugkijken:`Controle: ${tot} → ${tot / 2}${d === 3 ? ` → ${tot / 4}` : ''} → ${r}. ✓` } };
} });

M({ id:'m24', niv:2, heur:['terug', 'schets'], bron:'een trapraadsel', maak(R){
  let a, b, c, m; do{ a = R.int(2, 8); b = R.int(1, 8); c = R.int(1, 8); m = a - b + c + 1; } while(m < 3 || b > a + 5);
  const tot = 2 * m - 1, nm = R.meisje();
  return { tekst:`<p>${nm} staat op de middelste trede van een trap. Ze gaat ${a} treden omhoog, dan ${b} treden omlaag en dan nog ${c} treden omhoog. Nu staat ze op de bovenste trede.</p><p><b>Hoeveel treden heeft de trap?</b></p>`,
    mc:opties(R, tot, [m, tot + 1, tot - 1, a + b + c, 2 * m]),
    hint:[{ fase:'plannen', vraag:'Hoeveel treden staat de bovenste trede hoger dan de middelste?', ans:a - b + c }, { fase:'uitvoeren', vraag:'Hoeveel treden liggen er dan onder de middelste?', ans:a - b + c }],
    uitw:{ begrijpen:`Van de middelste trede: +${a}, −${b}, +${c} → bovenste trede.`,
      plannen:'Maak een schets van de trap. Werk achterwaarts vanaf de bovenste trede.',
      uitvoeren:`De bovenste trede ligt ${a} − ${b} + ${c} = ${a - b + c} treden hoger dan de middelste. Onder de middelste liggen er even veel. Samen: ${a - b + c} + 1 + ${a - b + c} = <b>${tot}</b>.`,
      terugkijken:'Een trap met een middelste trede heeft altijd een oneven aantal treden.' } };
} });

M({ id:'m25', niv:2, heur:['uitpr', 'schets'], bron:'een kalenderraadsel', maak(R){
  const dag = R.pick(['zaterdag', 'zondag', 'woensdag']), di = DAGEN.indexOf(dag), dat = R.int(3, 28), juist = DAGEN[(di + dat - 2 + 700) % 7];
  return { tekst:`<p>In een bepaalde maand vallen er drie ${dag}en op een even datum.</p><p><b>Welke dag van de week is het op de ${dat}ste van die maand?</b></p>`,
    mc:opties(R, juist, R.shuffle(DAGEN.filter(x=>x !== juist)), { fmt:String }),
    hint:[{ fase:'plannen', vraag:`Probeer: als de eerste ${dag} op de 1ste valt, op welke datum valt de tweede ${dag}?`, ans:8 }, { fase:'uitvoeren', vraag:`Op welke datum valt de eerste ${dag} in deze maand?`, ans:2 }],
    uitw:{ begrijpen:`${dag[0].toUpperCase() + dag.slice(1)}en liggen 7 dagen uit elkaar. Drie ervan zijn even.`,
      plannen:'Probeer de mogelijke eerste datum (1 tot 7) en schets de kalender.',
      uitvoeren:`Na 7 dagen wisselt even en oneven. Drie even data kan enkel met 2, 16 en 30. Dus de 2de is een ${dag}. De ${dat}ste ligt ${dat - 2} dagen later: ${dat - 2} : 7 rest ${(dat - 2) % 7}, dus <b>${juist}</b>.`,
      terugkijken:'Begint de reeks op de 4de, dan krijg je 4, 18 en (32 bestaat niet): maar twee even data.' } };
} });

M({ id:'m26', niv:1, heur:['schets', 'patroon'], bron:'een opgave over bomen', maak(R){
  const n = R.int(6, 25), d = R.int(3, 12);
  return { tekst:`<p>Langs een rechte straat staan ${n} bomen op een rij. Tussen twee bomen naast elkaar is telkens ${d} m.</p><p><b>Hoe ver staat de eerste boom van de laatste?</b></p>`,
    getal:(n - 1) * d, eenheid:'m',
    hint:[{ fase:'plannen', vraag:'Maak een schets met 3 bomen. Hoeveel tussenruimtes zijn er?', ans:2 }, { fase:'uitvoeren', vraag:`Hoeveel tussenruimtes bij ${n} bomen?`, ans:n - 1 }],
    uitw:{ begrijpen:`${n} bomen, telkens ${d} m ertussen.`,
      plannen:'Maak een schets: er is altijd één tussenruimte minder dan bomen.' + palenRij(4, { stuk:d + ' m' }),
      uitvoeren:`${n} bomen → ${n - 1} tussenruimtes → ${n - 1} · ${d} = <b>${(n - 1) * d} m</b>.`,
      terugkijken:`${n} · ${d} = ${n * d} is één tussenruimte te veel.` } };
} });

/* ============================================================
   UITGEWERKTE VOORBEELDEN (één per heuristiek, gelijkaardig aan het werkboek, nooit identiek)
   ============================================================ */
const VB = {};

/* --- schets --- */
VB.schets = { titel:'een schets maken',
  tekst:'<p>Boerin Els zet een omheining rond een rechthoekige weide van 72 m lang en 40 m breed. Op elke hoek komt een paal. De afstand tussen twee palen naast elkaar mag niet meer zijn dan 8 m.</p><p><b>Hoeveel palen moet ze minstens plaatsen?</b></p>',
  keuzes:['26', '28', '30', '32', '36'],
  stappen:[
    { fase:'begrijpen', tekst:'Lees de opgave goed. <b>Gegeven:</b> een rechthoek van 72 m bij 40 m, palen op de hoeken, hoogstens 8 m tussen twee palen. <b>Gevraagd:</b> het kleinste aantal palen.',
      vraag:'Hoeveel meter is de omtrek van de weide?', ans:224, eenheid:'m', tip:'Omtrek = 72 + 40 + 72 + 40.' },
    { fase:'plannen', tekst:'Een <b>schets</b> helpt: teken de weide en zet de maten erbij. Zo kan je per zijde nadenken hoeveel stukken van 8 m je nodig hebt.',
      fig:rechthoekPalen(1, 1, { L:'72 m', B:'40 m' }).replace(/<circle[^>]*>/g, ''),
      vraag:'Hoeveel stukken van 8 m passen er in een lange zijde van 72 m?', ans:9 },
    { fase:'uitvoeren', tekst:'Op een lange zijde komen 72 : 8 = 9 stukken, op een korte zijde 40 : 8 = 5 stukken. Zet de palen in je schets. De omheining is <b>gesloten</b>: na het laatste stuk kom je terug bij de eerste paal.',
      fig:rechthoekPalen(9, 5, { L:'72 m', B:'40 m', anim:true }),
      vraag:'Tel de stukken rond de hele weide. Hoeveel palen zijn er?', ans:28, tip:'9 + 5 + 9 + 5 stukken, en bij een gesloten omheining evenveel palen als stukken.' },
    { fase:'terugkijken', tekst:'Controleer op een andere manier: omtrek 224 m : 8 m = 28 stukken, dus 28 palen. Klopt! <br>Een fout die vaak gebeurt: per zijde 10 en 6 palen tellen en dan alles optellen (32). Dan tel je elke hoekpaal twee keer.',
      vraag:'Welke letter is het juiste antwoord?', ans:['B'] }
  ],
  slot:'<b>Een schets maken</b> helpt als de opgave over een situatie gaat die je kan tekenen: een omheining, een rij, een weg, een figuur. Teken alleen wat nodig is en zet de gegevens erbij. Ga nu naar <b>Oefenen</b>.' };

/* --- vereenvoudigen --- */
(function(){
  const W = 14, H = 9, p = [[0, 9], [14, 9], [14, 0], [10, 0], [10, 3], [6, 3], [6, 6], [3, 6], [3, 8], [0, 8]], c = 15, ox = 14, oy = 14;
  const P = p.map(([x, y])=>[ox + x * c, oy + y * c]);
  const basis = veelhoek(P, { f:'rgba(59,193,197,.18)', k:'var(--ink)' }) + maat(ox, oy + H * c + 14, ox + W * c, oy + H * c + 14, W + ' m', { s:13, off:12 }) + maat(ox + W * c + 14, oy, ox + W * c + 14, oy + H * c, H + ' m', { s:13 });
  /* horizontale stukjes van de trap schuiven naar boven, verticale naar links */
  const hor = [[10, 3, 6], [6, 6, 3], [3, 8, 0]], ver = [[10, 0, 3], [6, 3, 6], [3, 6, 8], [0, 8, 9]];
  let anim = '';
  hor.forEach(([x1, y, x2], i)=>{ anim += `<line x1="${ox + x1 * c}" y1="${oy + y * c}" x2="${ox + x2 * c}" y2="${oy + y * c}" stroke="var(--orange)" stroke-width="4" class="anim-schuif" style="--tx:0px;--ty:${-y * c}px;animation-delay:${.3 + i * .5}s"/>`; });
  ver.forEach(([x, y1, y2], i)=>{ anim += `<line x1="${ox + x * c}" y1="${oy + y1 * c}" x2="${ox + x * c}" y2="${oy + y2 * c}" stroke="#4467c2" stroke-width="4" class="anim-schuif" style="--tx:${-x * c}px;--ty:0px;animation-delay:${2 + i * .5}s"/>`; });
  const fig0 = svg(W * c + 70, H * c + 56, basis, { b:280, label:'trapvormige tuin' });
  const fig1 = svg(W * c + 70, H * c + 56, basis + anim, { b:280, label:'stukjes verschuiven' });
  VB.vereenv = { titel:'vereenvoudigen van het probleem',
    tekst:'<p>Een tuin heeft de vorm van de figuur. Alle hoeken zijn rechte hoeken. Je kent alleen de breedte (14 m) en de hoogte (9 m).</p><p><b>Hoeveel meter is de omtrek van de tuin?</b></p>', fig:fig0,
    keuzes:['23 m', '37 m', '42 m', '46 m', '52 m'],
    stappen:[
      { fase:'begrijpen', tekst:'<b>Gegeven:</b> de breedte en de hoogte van de tuin. <b>Gevraagd:</b> de omtrek. De lengte van de stukjes van de trap ken je niet.',
        vraag:'Uit hoeveel stukjes bestaat de rand van de tuin? (Tel alle zijden.)', ans:10 },
      { fase:'plannen', tekst:'Al die stukjes apart meten kan niet. <b>Vereenvoudig</b> het probleem: verschuif de stukjes van de trap. Horizontale stukjes schuif je naar boven, verticale naar links.',
        fig:fig1, vraag:'Hoe lang zijn alle oranje stukjes samen, als ze bovenaan liggen?', ans:14, eenheid:'m', tip:'Ze vormen samen met het bovenste stuk de hele bovenkant.' },
      { fase:'uitvoeren', tekst:'De verschoven stukjes vormen een rechthoek van 14 m bij 9 m. De omtrek van de tuin is dus dezelfde als die van die rechthoek.',
        vraag:'Hoeveel is de omtrek?', ans:46, eenheid:'m', tip:'2 · (14 + 9)' },
      { fase:'terugkijken', tekst:'Klopt dat? Een omtrek is de lengte van de rand. Door te verschuiven verandert de lengte van een stukje niet. Het aantal treden maakt dus niets uit voor de omtrek (wel voor de oppervlakte!).',
        vraag:'Welke letter is het juiste antwoord?', ans:['D'] }
    ],
    slot:'<b>Vereenvoudigen</b> helpt als het probleem te groot of te ingewikkeld lijkt: neem kleinere getallen, verschuif of herschik stukken, streep weg wat gelijk is. Ga nu naar <b>Oefenen</b>.' };
})();

/* --- uitproberen --- */
(function(){
  const rij = (k, ok, i) => `<tr class="anim-rij${ok ? ' ok-rij' : ''}" style="animation-delay:${i * .7}s"><td>${k}</td><td>${15 - k}</td><td>${4 * k} + ${2 * (15 - k)} = ${4 * k + 2 * (15 - k)}</td><td>${ok ? '✓' : 4 * k + 2 * (15 - k) < 42 ? 'te weinig' : 'te veel'}</td></tr>`;
  const tabel = `<table class="dtable probeer anim"><thead><tr><th>konijnen</th><th>kippen</th><th>poten</th><th></th></tr></thead><tbody>${rij(4, false, 0)}${rij(5, false, 1)}${rij(6, true, 2)}</tbody></table>`;
  VB.uitpr = { titel:'uitproberen van verschillende oplossingen',
    tekst:'<p>Op een boerderij lopen kippen en konijnen rond. Samen zijn het 15 dieren met in totaal 42 poten.</p><p><b>Hoeveel konijnen zijn er?</b></p>',
    keuzes:['4', '5', '6', '7', '8'],
    stappen:[
      { fase:'begrijpen', tekst:'<b>Gegeven:</b> 15 dieren, 42 poten. Een konijn heeft 4 poten. <b>Gevraagd:</b> het aantal konijnen.',
        vraag:'Hoeveel poten heeft een kip?', ans:2 },
      { fase:'plannen', tekst:'Er zijn maar vijf antwoordkeuzes. Je kan ze <b>uitproberen</b>: kies een aantal konijnen, reken het aantal poten uit en kijk of het klopt. Is het te veel of te weinig, dan weet je in welke richting je verder moet zoeken.',
        vraag:'Probeer keuze A: 4 konijnen. Hoeveel kippen zijn er dan?', ans:11 },
      { fase:'uitvoeren', tekst:'Zet je pogingen in een tabel. Met 4 konijnen heb je 16 + 22 = 38 poten: te weinig. Neem meer konijnen.',
        fig:tabel, vraag:'Hoeveel konijnen zijn er?', ans:6 },
      { fase:'terugkijken', tekst:'Controleer: 6 konijnen hebben 24 poten, 9 kippen hebben 18 poten. Samen 42. ✓ Kan het ook anders? Elk extra konijn (en een kip minder) geeft 2 poten meer. Er is dus maar één oplossing.',
        vraag:'Hoeveel poten heb je met 7 konijnen en 8 kippen?', ans:44 }
    ],
    slot:'<b>Uitproberen</b> helpt als er weinig mogelijkheden zijn, zoals bij meerkeuzevragen. Probeer slim: begin in het midden en kijk of je hoger of lager moet. Ga nu naar <b>Oefenen</b>.' };
})();

/* --- patroon --- */
(function(){
  const rij = ['ZON', 'ZNO', 'NZO', 'NOZ', 'ONZ', 'OZN', 'ZON', 'ZNO'];
  const lijst = `<div class="lijstje anim">${rij.map((w, i)=>`<span class="anim-rij" style="animation-delay:${i * .45}s">stap ${i}: <b>${w}</b></span>`).join('')}<span>…</span></div>`;
  VB.patroon = { titel:'een patroon zoeken',
    tekst:'<p>Noor verwisselt in het woord ZON eerst de laatste twee letters: ZNO. Dan de eerste twee: NZO. Dan weer de laatste twee, dan weer de eerste twee, enzovoort.</p><p><b>Welk woord heeft Noor na 2026 verwisselingen?</b></p>',
    keuzes:['NZO', 'NOZ', 'ONZ', 'OZN', 'ZNO'],
    stappen:[
      { fase:'begrijpen', tekst:'<b>Gegeven:</b> het woord ZON en de regel: afwisselend de laatste twee en de eerste twee letters verwisselen. <b>Gevraagd:</b> het woord na 2026 keer.',
        vraag:'Welk woord krijg je na stap 3?', ans:['NOZ'], tip:'Stap 2 gaf NZO. Stap 3: verwissel de laatste twee letters.' },
      { fase:'plannen', tekst:'2026 keer uitschrijven is onbegonnen werk. Met drie letters zijn er maar weinig woorden mogelijk, dus waarschijnlijk komt alles terug. Schrijf de eerste stappen uit en <b>zoek een patroon</b>.',
        fig:lijst, vraag:'Na hoeveel stappen krijg je opnieuw ZON?', ans:6 },
      { fase:'uitvoeren', tekst:'Het patroon herhaalt zich om de 6 stappen. Na 6, 12, 18, … en na elk veelvoud van 6 staat er ZON. 2026 : 6 = 337 rest 4. Na 2022 stappen staat er dus ZON, en dan nog 4 stappen.',
        vraag:'Welk woord krijg je na 2026 stappen?', ans:['ONZ'] },
      { fase:'terugkijken', tekst:'Met de letters Z, O en N kan je precies 6 woorden maken. In je lijst staan ze alle zes: het patroon kan dus niet langer zijn. Controle met een klein getal: na 10 stappen heb je hetzelfde als na 10 − 6 = 4 stappen.',
        vraag:'Welk woord krijg je na 10 stappen?', ans:['ONZ'] }
    ],
    slot:'<b>Een patroon zoeken</b> helpt bij heel grote getallen (de 2026ste stap, de 50ste figuur): schrijf de eerste stappen uit, zoek wat terugkomt of hoe het groeit, en gebruik dat. Ga nu naar <b>Oefenen</b>.' };
})();

/* --- achterwaarts werken --- */
VB.terug = { titel:'achterwaarts werken',
  tekst:'<p>Wout denkt aan een getal. Hij telt er 7 bij, vermenigvuldigt de uitkomst met 3 en trekt er dan 5 af. Hij krijgt 46.</p><p><b>Aan welk getal dacht Wout?</b></p>',
  fig:pijlSchema(['?', '', '', '46'], ['+ 7', '· 3', '− 5']),
  stappen:[
    { fase:'begrijpen', tekst:'<b>Gegeven:</b> drie bewerkingen na elkaar en het einde: 46. <b>Gevraagd:</b> het begingetal.',
      vraag:'Welke bewerking deed Wout als laatste? Typ zoals − 5', ans:['− 5', '-5', '- 5', '−5'] },
    { fase:'plannen', tekst:'Je kent het einde, niet het begin. <b>Werk achterwaarts</b>: begin bij 46 en doe elke bewerking omgekeerd, van de laatste naar de eerste. Het omgekeerde van + is −, van · is :.',
      vraag:'Wat is het omgekeerde van “· 3”? Typ zoals : 3', ans:[': 3', ':3'] },
    { fase:'uitvoeren', tekst:'46 + 5 = 51. 51 : 3 = 17. 17 − 7 = …',
      fig:pijlSchema(['?', '', '', '46'], ['+ 7', '· 3', '− 5'], ['− 7', ': 3', '+ 5']),
      vraag:'Aan welk getal dacht Wout?', ans:10 },
    { fase:'terugkijken', tekst:'Controleer vooruit, met de bewerkingen in de gewone volgorde.',
      vraag:'Reken uit: (10 + 7) · 3 − 5 = ?', ans:46 }
  ],
  slot:'<b>Achterwaarts werken</b> helpt als je het einde kent en het begin zoekt: draai elke stap om en begin achteraan. Ga nu naar <b>Oefenen</b>.' };

/* --- systematisch tellen --- */
(function(){
  const sm = ['aardbei', 'vanille', 'chocolade', 'citroen', 'mokka'];
  let t = '<table class="dtable telt anim"><tr><th></th>' + sm.map(s=>`<th>${s}</th>`).join('') + '</tr>';
  sm.forEach((a, i)=>{ t += `<tr><th>${a}</th>` + sm.map((b, j)=>j > i ? `<td class="anim-rij hl" style="animation-delay:${(i * 4 + j) * .18}s">✓</td>` : j === i ? '<td class="grijs">×</td>' : '<td class="grijs">·</td>').join('') + '</tr>'; });
  t += '</table>';
  VB.tellen = { titel:'systematisch tellen',
    tekst:'<p>In de ijssalon kies je een hoorntje met twee bolletjes van een verschillende smaak. Er zijn vijf smaken: aardbei, vanille, chocolade, citroen en mokka. De volgorde maakt niet uit.</p><p><b>Hoeveel verschillende hoorntjes kan je kiezen?</b></p>',
    keuzes:['5', '9', '10', '20', '25'],
    stappen:[
      { fase:'begrijpen', tekst:'<b>Gegeven:</b> 5 smaken, 2 verschillende bolletjes, de volgorde maakt niet uit. <b>Gevraagd:</b> het aantal verschillende hoorntjes.',
        vraag:'Mag je twee keer dezelfde smaak nemen? Typ ja of nee.', ans:['nee'] },
      { fase:'plannen', tekst:'Als je zomaar combinaties opschrijft, vergeet je er een of tel je er een dubbel. <b>Tel systematisch</b>: begin met aardbei en combineer met alle andere smaken. Ga dan naar vanille, maar zonder aardbei, want die combinatie heb je al.',
        vraag:'Hoeveel hoorntjes zijn er met aardbei?', ans:4 },
      { fase:'uitvoeren', tekst:'Zet het in een tabel. Je vult enkel het stuk boven de diagonaal in: aardbei + vanille is hetzelfde hoorntje als vanille + aardbei.',
        fig:t, vraag:'Hoeveel hoorntjes in totaal?', ans:10, tip:'4 + 3 + 2 + 1' },
      { fase:'terugkijken', tekst:'Wie 5 · 4 = 20 rekent, telt elk hoorntje twee keer (de hele tabel zonder de diagonaal). 20 : 2 = 10. ✓',
        vraag:'Hoeveel hoorntjes zijn er als de ijssalon 6 smaken heeft?', ans:15 }
    ],
    slot:'<b>Systematisch tellen</b> helpt als je alle mogelijkheden moet tellen. Schrijf ze ordelijk op, in een lijst of een tabel. Zo vergeet je er geen en tel je er geen twee keer. Ga nu naar <b>Oefenen</b>.' };
})();

/* ============================================================
   ONDERDEEL 1 · DE VIER STAPPEN (kennismaking)
   ============================================================ */
const STAP_UITLEG = [
  ['begrijpen', 'Lees de opgave goed. Wat is gegeven? Wat is gevraagd?'],
  ['plannen', 'Denk na welke heuristiek kan helpen: een schets, een patroon, uitproberen, …'],
  ['uitvoeren', 'Los het probleem op met je plan. Schrijf je tussenstappen op.'],
  ['terugkijken', 'Kan je antwoord? Controleer het, bv. op een andere manier.']
];
const UITSPRAKEN = [
  ['Ik onderstreep wat er gevraagd wordt.', 'begrijpen'], ['Ik zoek welke getallen gegeven zijn.', 'begrijpen'], ['Ik vertel de opgave in mijn eigen woorden.', 'begrijpen'], ['Ik kijk welke eenheid het antwoord moet hebben.', 'begrijpen'],
  ['Ik besluit om eerst een tekening te maken.', 'plannen'], ['Ik denk aan een gelijkaardig probleem dat ik al eens oploste.', 'plannen'], ['Ik kies om de antwoordkeuzes uit te proberen.', 'plannen'], ['Ik beslis om met kleinere getallen te beginnen.', 'plannen'],
  ['Ik reken de omtrek uit.', 'uitvoeren'], ['Ik vul de tabel verder aan.', 'uitvoeren'], ['Ik schrijf de eerste tien stappen van het patroon op.', 'uitvoeren'], ['Ik teken de palen op mijn schets.', 'uitvoeren'],
  ['Ik reken mijn antwoord op een andere manier na.', 'terugkijken'], ['Ik vraag me af of mijn antwoord kan kloppen.', 'terugkijken'], ['Ik vul mijn antwoord in de opgave in om te controleren.', 'terugkijken'], ['Ik kijk of er nog een andere oplossing is.', 'terugkijken']
];
const GEGEVEN_BANK = [
  { tekst:'Lien heeft 3 broers. Ze krijgt elke week 5 euro zakgeld. Een boek kost 18 euro. <b>Hoeveel weken moet Lien sparen voor het boek?</b>', stukken:[['5 euro zakgeld per week', 'gegeven'], ['Lien heeft 3 broers', 'niet nodig'], ['een boek kost 18 euro', 'gegeven'], ['het aantal weken', 'gevraagd']] },
  { tekst:'Een bus vertrekt om 8.10 uur. De rit duurt 35 minuten. Er zitten 42 leerlingen op de bus. <b>Hoe laat komt de bus aan?</b>', stukken:[['vertrek om 8.10 uur', 'gegeven'], ['42 leerlingen', 'niet nodig'], ['de rit duurt 35 minuten', 'gegeven'], ['het uur van aankomst', 'gevraagd']] },
  { tekst:'Een tuin is 12 m lang en 8 m breed. Er staan 4 bomen in. Rond de tuin komt een haag. <b>Hoe lang wordt de haag?</b>', stukken:[['12 m lang', 'gegeven'], ['8 m breed', 'gegeven'], ['er staan 4 bomen', 'niet nodig'], ['de lengte van de haag', 'gevraagd']] },
  { tekst:'Seppe is 12 jaar. Hij fietst elke dag 4 km naar school en 4 km terug. <b>Hoeveel km fietst hij in een schoolweek van 5 dagen?</b>', stukken:[['Seppe is 12 jaar', 'niet nodig'], ['4 km naar school en 4 km terug', 'gegeven'], ['5 schooldagen', 'gegeven'], ['het aantal km in een week', 'gevraagd']] }
];
function stappenKaarten(pane){
  /* kaart 1: uitleg */
  const c1 = el('div', 'card hcard');
  c1.append(el('div', 'card-head', '<h3>Zo los je een wiskundig probleem op</h3>'));
  c1.append(el('div', 'stappen-rij', STAP_UITLEG.map(([f, t])=>`<div class="stap-blok">${faseLabel(f)}<p>${t}</p></div>`).join('')));
  c1.append(el('p', 'klein', 'Bij stap 2 kies je een <b>heuristiek</b>: een slimme manier om een oplossing te zoeken. In deze module leer je er zes.'));
  c1.append(el('div', 'heur-grid', HEUR_IDS.map((h, i)=>`<div class="heur-tegel"><span class="heur-ic">${icon(HEUR[h].ic)}</span><div><b>${i + 1}. ${HEUR[h].naam}</b><p>${HEUR[h].zin}</p></div></div>`).join('')));
  pane.append(c1);

  /* kaart 2: volgorde */
  const key2 = 'stappen_volgorde'; CLvraag(key2);
  const c2 = el('div', 'card hcard'); const h2 = el('div', 'card-head', '<h3>Zet de vier stappen in de juiste volgorde</h3>'); c2.append(h2);
  const teken2 = ()=>{
    [...c2.children].slice(1).forEach(x=>x.remove());
    const st = lees('st_' + key2) || { volg:[], mix:RNG(nieuwZaad()).shuffle(['begrijpen', 'plannen', 'uitvoeren', 'terugkijken']) };
    c2.append(el('p', 'instructions', 'Klik de stappen aan in de volgorde waarin je ze doet.'));
    const rij = el('div', 'choices'), uit = el('div', 'volg-uit'), fb = el('div', 'fb');
    st.mix.forEach(f=>{ const b = knop('opt', FASEN[f], ()=>{ if(st.klaar || st.volg.includes(f)) return; st.volg.push(f); bewaar('st_' + key2, st); teken2(); }); if(st.volg.includes(f)) b.disabled = true; rij.append(b); });
    uit.innerHTML = st.volg.map((f, i)=>`<span class="chip">${i + 1}. ${FASEN[f]}</span>`).join(' ');
    const act = el('div', 'q-act');
    act.append(knop('btn', 'Controleer', ()=>{ if(st.volg.length < 4){ fb.className = 'fb bad'; fb.textContent = 'Klik eerst alle vier de stappen aan.'; return; }
      const ok = st.volg.join() === 'begrijpen,plannen,uitvoeren,terugkijken'; st.klaar = ok; CLres(key2, ok); bewaar('st_' + key2, st);
      fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.textContent = ok ? 'Juist! Eerst begrijpen, dan plannen, uitvoeren en terugkijken.' : 'Nog niet juist. Je moet eerst weten wat er gevraagd is, voor je een plan kan maken.';
      if(!ok){ st.volg = []; bewaar('st_' + key2, st); setTimeout(teken2, 1800); } }));
    act.append(knop('btn ghost', 'Wis', ()=>{ st.volg = []; st.klaar = false; bewaar('st_' + key2, st); teken2(); }));
    c2.append(rij, uit, act, fb);
    if(st.klaar){ fb.className = 'fb ok'; fb.textContent = 'Juist! Eerst begrijpen, dan plannen, uitvoeren en terugkijken.'; }
  };
  teken2(); pane.append(c2);

  /* kaart 3: bij welke stap hoort dit? (4 uitspraken) */
  const key3 = 'stappen_koppel'; CLvraag(key3);
  const c3 = el('div', 'card hcard'); const h3 = el('div', 'card-head', '<h3>Bij welke stap hoort dit?</h3>');
  h3.append(knop('refresh-btn', '↻ Andere zinnen', ()=>{ wis('st_' + key3); teken3(); })); c3.append(h3);
  const teken3 = ()=>{
    [...c3.children].slice(1).forEach(x=>x.remove());
    let st = lees('st_' + key3); if(!st){ const R = RNG(nieuwZaad()); const per = ['begrijpen', 'plannen', 'uitvoeren', 'terugkijken'].map(f=>R.pick(UITSPRAKEN.filter(u=>u[1] === f))); st = { items:R.shuffle(per).map(u=>UITSPRAKEN.indexOf(u)), ant:{} }; bewaar('st_' + key3, st); }
    const grid = el('div', 'koppel-grid');
    st.items.forEach((u, i)=>{ const [zin, f] = UITSPRAKEN[u]; const r = el('div', 'koppel-rij'); r.append(el('span', 'kzin', '“' + zin + '”'));
      const ch = el('div', 'choices klein-keuzes'); ['begrijpen', 'plannen', 'uitvoeren', 'terugkijken'].forEach(g=>{ const b = knop('opt', FASEN[g], ()=>{ if(st.klaar) return; st.ant[i] = g; bewaar('st_' + key3, st); teken3(); }); if(st.ant[i] === g) b.classList.add('chosen'); if(st.klaar){ b.disabled = true; if(g === f) b.classList.add('chosen', 'good'); else if(st.ant[i] === g) b.classList.add('wrong'); } ch.append(b); });
      r.append(ch); grid.append(r); });
    const fb = el('div', 'fb'), act = el('div', 'q-act');
    act.append(knop('btn', 'Controleer', ()=>{ if(Object.keys(st.ant).length < 4){ fb.className = 'fb bad'; fb.textContent = 'Kies bij elke zin een stap.'; return; }
      const ok = st.items.every((u, i)=>st.ant[i] === UITSPRAKEN[u][1]); CLres(key3, ok);
      if(ok){ st.klaar = true; bewaar('st_' + key3, st); teken3(); } else { fb.className = 'fb bad'; fb.textContent = `Nog niet juist: ${st.items.filter((u, i)=>st.ant[i] !== UITSPRAKEN[u][1]).length} zin(nen) staan bij de verkeerde stap.`; } }));
    c3.append(grid, act, fb);
    if(st.klaar){ fb.className = 'fb ok'; fb.textContent = 'Juist! Klik op ↻ Andere zinnen voor nieuwe zinnen.'; }
  };
  teken3(); pane.append(c3);

  /* kaart 4: gegeven, gevraagd of niet nodig */
  const key4 = 'stappen_gegeven'; CLvraag(key4);
  const c4 = el('div', 'card hcard'); const h4 = el('div', 'card-head', '<h3>Stap 1: gegeven, gevraagd of niet nodig?</h3>');
  h4.append(knop('refresh-btn', '↻ Andere opgave', ()=>{ const o = lees('st_' + key4); wis('st_' + key4); teken4(o ? (o.p + 1) % GEGEVEN_BANK.length : 0); })); c4.append(h4);
  const teken4 = p0=>{
    [...c4.children].slice(1).forEach(x=>x.remove());
    let st = lees('st_' + key4); if(!st){ st = { p:p0 != null ? p0 : Math.floor(Math.random() * GEGEVEN_BANK.length), ant:{} }; bewaar('st_' + key4, st); }
    const P = GEGEVEN_BANK[st.p];
    c4.append(el('div', 'given-box', P.tekst));
    const grid = el('div', 'koppel-grid');
    P.stukken.forEach(([t, f], i)=>{ const r = el('div', 'koppel-rij'); r.append(el('span', 'kzin', t));
      const ch = el('div', 'choices klein-keuzes'); ['gegeven', 'gevraagd', 'niet nodig'].forEach(g=>{ const b = knop('opt', g, ()=>{ if(st.klaar) return; st.ant[i] = g; bewaar('st_' + key4, st); teken4(); }); if(st.ant[i] === g) b.classList.add('chosen'); if(st.klaar){ b.disabled = true; if(g === f) b.classList.add('chosen', 'good'); } ch.append(b); });
      r.append(ch); grid.append(r); });
    const fb = el('div', 'fb'), act = el('div', 'q-act');
    act.append(knop('btn', 'Controleer', ()=>{ if(Object.keys(st.ant).length < P.stukken.length){ fb.className = 'fb bad'; fb.textContent = 'Kies bij elk stukje.'; return; }
      const ok = P.stukken.every(([, f], i)=>st.ant[i] === f); CLres(key4, ok);
      if(ok){ st.klaar = true; bewaar('st_' + key4, st); teken4(); } else { fb.className = 'fb bad'; fb.textContent = 'Nog niet juist. Tip: niet alle getallen in een opgave heb je nodig.'; } }));
    c4.append(grid, act, fb);
    if(st.klaar){ fb.className = 'fb ok'; fb.textContent = 'Juist! Een opgave bevat soms gegevens die je niet nodig hebt.'; }
  };
  teken4(); pane.append(c4);
}

/* ============================================================
   OPBOUW: zijbalk, onderdelen en tabbladen
   ============================================================ */
const ICONS = {
  stappen:'<path d="M4 18h4v-4h4v-4h4V6h4"/><circle cx="4" cy="18" r="1"/>',
  schets:'<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
  vereenv:'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/><path d="M11 11l3 3"/>',
  uitpr:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/><path d="M9 11h4M11 9v4"/>',
  patroon:'<circle cx="5" cy="12" r="2"/><rect x="10" y="10" width="4" height="4"/><circle cx="19" cy="12" r="2"/><path d="M5 5v2M12 5v2M19 5v2"/>',
  terug:'<path d="M9 14l-5-5 5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  tellen:'<path d="M4 4h16v16H4z"/><path d="M4 10h16M4 15h16M10 4v16M15 4v16"/>',
  mix:'<path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
  toets:'<path d="M9 4h6v3H9z"/><path d="M15 5h3v16H6V5h3"/><path d="m9 13 2 2 4-4"/>'
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

const SECTIONS = [
  { id:'stappen', nav:'De vier stappen', title:'De vier stappen', ic:'stappen' },
  { id:'schets', nav:'Een schets maken', title:'Een schets maken', ic:'schets', h:'schets' },
  { id:'vereenv', nav:'Vereenvoudigen', title:'Vereenvoudigen van het probleem', ic:'vereenv', h:'vereenv' },
  { id:'uitpr', nav:'Uitproberen', title:'Uitproberen van verschillende oplossingen', ic:'uitpr', h:'uitpr' },
  { id:'patroon', nav:'Een patroon zoeken', title:'Een patroon zoeken', ic:'patroon', h:'patroon' },
  { id:'terug', nav:'Achterwaarts werken', title:'Achterwaarts werken', ic:'terug', h:'terug' },
  { id:'tellen', nav:'Systematisch tellen', title:'Systematisch tellen', ic:'tellen', h:'tellen' },
  { id:'mix', nav:'Door elkaar', title:'Heuristieken door elkaar', ic:'mix', h:'mix' },
  { id:'toets', nav:'Testje door elkaar', title:'Testje door elkaar', ic:'toets', sepBefore:true }
];
if(window.CL_VERBORGEN){ for(let i = SECTIONS.length - 1; i >= 0; i--) if(window.CL_VERBORGEN.has(SECTIONS[i].id)) SECTIONS.splice(i, 1); }

const app = document.getElementById('app'), nav = document.getElementById('nav'), pager = document.getElementById('pager');
const secEls = {}, navLinks = {}, bouwers = {};
/* tabbladen binnen een onderdeel; de keuze wordt per onderdeel onthouden */
function tabs(sec, s, lijst){
  const bar = el('div', 'tabs'); bar.setAttribute('role', 'tablist');
  const panes = {}, knoppen = {};
  const zet = k=>{ Object.keys(panes).forEach(x=>{ panes[x].hidden = x !== k; knoppen[x].setAttribute('aria-selected', String(x === k)); });
    if(!panes[k].dataset.gebouwd){ panes[k].dataset.gebouwd = '1'; lijst.find(l=>l[0] === k)[2](panes[k]); }
    bewaar('stab_' + sec.id, k); document.body.classList.add('vraagmodus'); };
  lijst.forEach(([k, naam])=>{ const b = knop('tab', naam, ()=>zet(k)); b.setAttribute('role', 'tab'); bar.append(b); knoppen[k] = b; const p = el('div', 'tabpane'); p.hidden = true; panes[k] = p; });
  s.append(bar, ...Object.values(panes));
  let k0 = lees('stab_' + sec.id); if(!panes[k0]) k0 = lijst[0][0];
  return ()=>zet(k0);
}
SECTIONS.forEach((sec, si)=>{
  const num = si + 1;
  if(sec.sepBefore) nav.append(el('li', 'sep'));
  const li = el('li'), a = knop('', `${icon(sec.ic)}<span class="n">${num}</span><span class="lbl">${sec.nav}</span>`, ()=>show(sec.id, true));
  li.append(a); nav.append(li); navLinks[sec.id] = a;
  const s = el('section', 'group'); s.id = sec.id; s.hidden = true;
  s.append(el('div', 'sec-head', `<span class="sec-ic">${icon(sec.ic)}</span><h2><span class="num">${num}.</span>${sec.title}</h2>`));
  let start = null;
  if(sec.id === 'stappen'){
    s.append(el('div', 'tip', icon('stappen') + '<div>Een wiskundig probleem los je op in <b>vier stappen</b>. Bij de tweede stap kies je een <b>heuristiek</b>: een slimme zoekmethode. Daarna leer je de heuristieken één voor één.</div>'));
    start = ()=>stappenKaarten(s);
  } else if(HEUR[sec.h]){
    const h = sec.h;
    s.append(el('div', 'tip', icon(sec.ic) + `<div><b>${HEUR[h].naam[0].toUpperCase() + HEUR[h].naam.slice(1)}.</b> ${HEUR[h].zin}</div>`));
    /* alle vraag-id's van dit onderdeel (voor het dashboard) */
    poolVan(h, [1, 2, 3]).forEach(t=>CLvraag(`${sec.id}_${t.id}`));
    start = tabs(sec, s, [
      ['vb', 'Voorbeeld', p=>p.append(voorbeeldPaneel(sec.id, VB[h]))],
      ['oef', 'Oefenen', p=>p.append(oefenPaneel(sec.id, h, 'oef'))],
      ['verd', 'Verdieping', p=>p.append(oefenPaneel(sec.id, h, 'verd'))],
      ['test', 'Testje', p=>p.append(testPaneel(sec.id, kiesTestHeur(h), 3, `${sec.id}_testje`, `Testje: ${HEUR[h].naam}`))]
    ]);
  } else if(sec.id === 'mix'){
    s.append(el('div', 'tip', icon('mix') + '<div>Nu staan de vragen door elkaar. Kies eerst welke heuristiek(en) je gebruikt, en los dan de vraag op. Je keuze telt niet mee: na het controleren zie je welke heuristieken handig waren.</div>'));
    poolVan('mix', [1, 2, 3]).forEach(t=>CLvraag(`mix_${t.id}`));
    start = tabs(sec, s, [
      ['oef', 'Oefenen', p=>p.append(oefenPaneel('mix', 'mix', 'oef', { kies:true }))],
      ['verd', 'Verdieping', p=>p.append(oefenPaneel('mix', 'mix', 'verd', { kies:true }))]
    ]);
  } else if(sec.id === 'toets'){
    start = ()=>{ document.body.classList.add('vraagmodus'); s.append(testPaneel('toets', kiesTestMix, 5, 'toets_1', 'Testje door elkaar')); };
  }
  bouwers[sec.id] = ()=>{ if(start && !s.dataset.gebouwd){ s.dataset.gebouwd = '1'; start(); } };
  app.append(s); secEls[sec.id] = s;
});

function show(id, scroll){
  const idx = SECTIONS.findIndex(s=>s.id === id); if(idx < 0) return;
  SECTIONS.forEach(s=>{ secEls[s.id].hidden = s.id !== id; navLinks[s.id].removeAttribute('aria-current'); });
  navLinks[id].setAttribute('aria-current', 'page');
  document.body.classList.remove('vraagmodus');
  bouwers[id]();
  const sel = secEls[id].querySelector('.tab[aria-selected="true"]'); if(sel) sel.click();
  if(id === 'toets') document.body.classList.add('vraagmodus');
  try{ const a = navLinks[id]; if(nav.scrollWidth > nav.clientWidth) nav.scrollLeft = a.offsetLeft - 16; }catch(e){}
  if(pager){ pager.innerHTML = '';
    if(idx > 0){ const p = SECTIONS[idx - 1]; pager.append(knop('prev', `<small>← Vorige</small>${idx}. ${p.nav}`, ()=>show(p.id, true))); }
    if(idx < SECTIONS.length - 1){ const n = SECTIONS[idx + 1]; pager.append(knop('next', `<small>Volgende →</small>${idx + 2}. ${n.nav}`, ()=>show(n.id, true))); } }
  try{ localStorage.setItem(PREFIX + 'tab', id); }catch(e){}
  if(scroll) window.scrollTo({ top:0, behavior:'smooth' });
}
/* testhaak (enkel voor de testscripts): een bepaalde vraag tonen in Oefenen */
window.__heur = { POOL, maakVraag, toon(secId, tid, seed, kind = 'oef'){ const h = SECTIONS.find(x=>x.id === secId).h || secId; const key = `oef_${secId}_${kind}`;
  bewaar(key, { lvl:POOL.find(t=>t.id === tid).niv === 1 ? 1 : 2, reeks:0, foutreeks:0, n:0, j:0, hist:[], cur:{ tid, seed }, v:{} });
  show(secId, false); const tab = [...secEls[secId].querySelectorAll('.tab')].find(b=>b.textContent === (kind === 'oef' ? 'Oefenen' : 'Verdieping')); const pane = secEls[secId].querySelectorAll('.tabpane')[[...secEls[secId].querySelectorAll('.tab')].indexOf(tab)];
  pane.innerHTML = ''; pane.dataset.gebouwd = '1'; tab.click(); pane.append(oefenPaneel(secId, h, kind, { kies:secId === 'mix' })); } };
if(SECTIONS.length){
  let startId = SECTIONS[0].id;
  try{ const h = location.hash.slice(1), t = localStorage.getItem(PREFIX + 'tab'); if(secEls[h]) startId = h; else if(t && secEls[t]) startId = t; }catch(e){}
  show(startId, false);
}

window.SECTIONS = SECTIONS; window.show = show;
})();
