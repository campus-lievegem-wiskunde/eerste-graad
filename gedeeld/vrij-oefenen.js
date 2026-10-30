/* Vrij oefenen: reeksen van 10 bewerkingen met telkens nieuwe getallen, automatisch verbeterd (enkel juist of fout) en een score.
   Keuzes van Jeroen (29 oktober 2026): /mnt/project-files/vrij-oefenen/Keuzes.md.
   De pagina laadt dit script; inhoud.js van het jaar roept VRIJ.start(J) aan met de hoofdstukken, de soorten getallen en de bewerkingen.
   Opslag (prefix uit <body data-prefix>, aanmelden.js spiegelt alles naar Firestore):
     <prefix>scores   { "h|g|b": { n:aantal reeksen, l:laatste score, b:beste score, d:datum } }   (dashboard: per hoofdstuk)
     <prefix>keuze    { h: { g, b } }   laatst gekozen getallen en bewerking per hoofdstuk
     <prefix>reeks_<h> { g, b, i, items:[{ h, b, html, w:[teller, noemer], s }], antw:[…], klaar, r:[1/0], score }
   Een antwoord: { a:'tekst' } (geheel of kommagetal) of { m:minteken, t:teller, n:noemer } (breukvak).
   Soort antwoord s: z geheel getal, d kommagetal, q breuk, qd breuk of kommagetal (opgave met breuken én kommagetallen). */
(function(){
const VO = window.VRIJ = {};
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const kies = a => a[Math.floor(Math.random() * a.length)];
const schud = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- exact rekenen met breuken { n, d } ---------- */
const ggd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while(b){ [a, b] = [b, a % b]; } return a || 1; };
const Q = (n, d = 1) => { if(d < 0){ n = -n; d = -d; } const g = ggd(n, d); return { n:n / g, d:d / g }; };
const R = {
  plus:(a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d),
  min:(a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d),
  maal:(a, b) => Q(a.n * b.n, a.d * b.d),
  deel:(a, b) => b.n === 0 ? null : Q(a.n * b.d, a.d * b.n),
  macht:(a, e) => { let r = Q(1); for(let i = 0; i < e; i++) r = R.maal(r, a); return r; },
  wortel:a => { if(a.n < 0) return null; const n = Math.round(Math.sqrt(a.n)), d = Math.round(Math.sqrt(a.d)); return n * n === a.n && d * d === a.d ? Q(n, d) : null; },
  gelijk:(a, b) => a.n === b.n && a.d === b.d
};
/* aantal cijfers na de komma (−1: geen afbrekend kommagetal) */
function decimalen(q){ let t = q.d, c2 = 0, c5 = 0; while(t % 2 === 0){ t /= 2; c2++; } while(t % 5 === 0){ t /= 5; c5++; } return t === 1 ? Math.max(c2, c5) : -1; }
const MIN = '−';
function komma(q){
  const k = decimalen(q); if(k <= 0) return (q.n < 0 ? MIN : '') + Math.abs(q.n / q.d);
  const s = String(Math.abs(q.n) * (10 ** k / q.d)).padStart(k + 1, '0');
  return (q.n < 0 ? MIN : '') + s.slice(0, -k) + ',' + s.slice(-k);
}
VO.R = R; VO.Q = Q; VO.komma = komma;

/* ---------- uitdrukkingen ----------
   { k:'g', q, v }  getal; v = z (geheel), n (natuurlijk), q (breuk), d (kommagetal)
   { k:'o', o, a, b } bewerking + − · :     { k:'p', b, e } macht     { k:'w', a } vierkantswortel     { k:'m', a } minteken vooraan (−3²) */
const G = (q, v) => ({ k:'g', q, v }), O = (o, a, b) => ({ k:'o', o, a, b }), P = (b, e) => ({ k:'p', b, e }), W = a => ({ k:'w', a }), M = a => ({ k:'m', a });
function ev(t){
  if(!t) return null;
  if(t.k === 'g') return t.q;
  if(t.k === 'm'){ const a = ev(t.a); return a && Q(-a.n, a.d); }
  if(t.k === 'p'){ const b = ev(t.b); return b && R.macht(b, t.e); }
  if(t.k === 'w'){ const a = ev(t.a); return a && R.wortel(a); }
  const a = ev(t.a), b = ev(t.b); if(!a || !b) return null;
  return t.o === '+' ? R.plus(a, b) : t.o === MIN ? R.min(a, b) : t.o === '·' ? R.maal(a, b) : R.deel(a, b);
}
const knopen = (t, f) => { f(t); if(t.a) knopen(t.a, f); if(t.b && typeof t.b === 'object') knopen(t.b, f); };
const PREC = { '+':1, [MIN]:1, '·':2, ':':2 };
const prec = t => t.k === 'o' ? PREC[t.o] : t.k === 'm' ? 1 : t.k === 'p' ? 3 : 4;
const hk = h => `<span class="vo-hk">(</span>${h}<span class="vo-hk">)</span>`;
const WV = '<svg class="wrt-v" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0.5 60 L3 52 L6 100 L10 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
const breuk = (t, n) => `<span class="vo-br"><span>${t}</span><span>${n}</span></span>`;
/* eerste = het getal staat vooraan (geen haakjes rond een negatief getal) */
function html(t, eerste){
  if(t.k === 'g'){
    const q = t.q, neg = q.n < 0, a = Math.abs(q.n);
    const kern = q.d === 1 ? String(a) : t.v === 'd' ? komma(Q(a, q.d)) : breuk(a, q.d);
    const h = `<span class="vo-g">${neg ? MIN : ''}${kern}</span>`;
    return neg && !eerste ? hk(h) : h;
  }
  if(t.k === 'm'){ const h = MIN + html(t.a, true); return eerste ? h : hk(h); }
  if(t.k === 'p'){
    const b = t.b, rond = b.k !== 'g' || b.q.n < 0 || (b.q.d !== 1 && b.v !== 'd');
    return (rond ? hk(html(b, true)) : html(b, true)) + `<sup class="vo-e">${t.e}</sup>`;
  }
  if(t.k === 'w'){ const br = t.a.k === 'g' && t.a.q.d !== 1 && t.a.v !== 'd'; return `<span class="wrt${br ? ' wrt-br' : ''}">${WV}<span class="wrt-in">${html(t.a, true)}</span></span>`; }
  const p = PREC[t.o];
  const l = prec(t.a) < p ? hk(html(t.a, true)) : html(t.a, eerste);
  const rr = prec(t.b) < p || (prec(t.b) === p && (t.o === MIN || t.o === ':')) || t.b.k === 'm';
  const r = rr ? hk(html(t.b, true)) : html(t.b, false);
  return `${l} <span class="vo-op">${t.o}</span> ${r}`;
}
VO.html = t => html(t, true); VO.ev = ev;

/* ---------- getallen ---------- */
function getal(J, v, rol, teken){
  /* 1A: negatieve breuken = breuken met een willekeurig teken */
  if(v === 'qn'){ const g = getal(Object.assign({}, J, { teken:true }), 'q', rol, teken); g.qn = true; return g; }
  const metTeken = J.teken || v === 'z', neg = teken === -1 || (teken !== 1 && metTeken && Math.random() < .5), s = neg ? -1 : 1;
  /* 1A: gehele getallen enkel van −zMax tot zMax (eenvoudige oefeningen) */
  if(v === 'z' && J.zMax) return G(Q(s * (['som', 'somk'].includes(rol) ? ri(1, J.zMax) : rol === 'volg' ? ri(1, 10) : ri(2, rol === 'klein' ? 9 : 10))), 'z');
  if(v === 'z' || v === 'n'){
    const n = rol === 'som' ? (J.teken ? ri(1, 40) : ri(10, 999)) : rol === 'somk' ? (J.teken ? ri(1, 40) : ri(5, 150)) : rol === 'macht' ? ri(1, 10) : rol === 'klein' ? ri(2, 9) : rol === 'volg' ? (J.teken ? ri(1, 12) : ri(2, 12)) : (J.teken ? ri(2, 12) : ri(2, 15));
    return G(Q(s * n), v);
  }
  if(v === 'q'){
    const N = rol === 'macht' ? [2, 3, 4, 5] : J.noemers;
    for(;;){ const d = kies(N), n = ri(1, rol === 'macht' ? d + 2 : 2 * d - 1); if(n % d) return G(Q(s * n, d), 'q'); }
  }
  /* kommagetal, nooit een geheel getal */
  for(;;){
    let x;
    if(rol === 'som' || rol === 'somk') x = Math.random() < .6 ? Q(ri(1, J.teken ? 300 : 999), 10) : Q(ri(1, 999), 100);
    else if(rol === 'macht') x = Math.random() < .7 ? Q(ri(1, 9), 10) : Q(ri(11, 15), 10);
    else if(rol === 'klein') x = Q(ri(1, 9), 10);
    else if(rol === 'volg') x = Q(ri(1, 50), 10);
    else x = Math.random() < .75 ? Q(ri(1, 99), 10) : Q(ri(1, 9), 100);
    if(x.d !== 1) return G(Q(s * x.n, x.d), 'd');
  }
}
/* vermenigvuldigen en delen met kommagetallen: enkel met de factoren uit J.komma ('0,1', '0,25' ...) */
const kommaQ = x => { const [e, f = ''] = String(x).split(','); return Q(Number(e + f), 10 ** f.length); };
function kommaFactor(J, L, m){
  if(!J.komma || !(m === 'd' || m === 'qd')) return L('maal');
  const neg = J.teken && Math.random() < .5;
  return G(R.maal(kommaQ(kies(J.komma)), Q(neg ? -1 : 1)), 'd');
}
/* het andere getal bij een kommafactor: een natuurlijk/geheel getal of een kommagetal */
const kommaAnder = (J, L, m) => !J.komma || m !== 'd' ? L('maal') : Math.random() < .5 ? getal(J, J.geheel, 'maal') : L('maal');
/* wortel uit een kwadraat: √49, √0,49, √(9/16) */
function wortelVan(J, v){
  let r;
  if(v === 'q'){ for(;;){ const d = ri(2, 10), n = ri(1, 9); r = Q(n, d); if(r.d !== 1) break; } }
  else if(v === 'd'){ for(;;){ r = Q(ri(1, 15), 10); if(r.d !== 1) break; } }
  else r = Q(ri(1, J.kwadraat || 15));
  const g = G(R.maal(r, r), v === 'q' && R.maal(r, r).d === 1 ? J.geheel : v); g.wrt = true;   /* een kwadraat onder de wortel valt niet onder zMax */
  return W(g);
}

/* ---------- sjablonen per hoofdstuk en bewerking ---------- */
const keten = (L, rol, n, ops) => { let t = L(rol); for(let i = 1; i < n; i++) t = O(kies(ops), t, L(rol)); return t; };
/* a : b met een uitkomst die opgaat: a = b · c */
function deling(J, L, rol){
  const b = L(rol), c = L(rol), p = R.maal(b.q, c.q);
  const v = p.d === 1 ? (b.v === 'z' || c.v === 'z' ? 'z' : J.geheel) : (b.v === 'd' || c.v === 'd') && decimalen(p) >= 0 && decimalen(p) <= 3 ? 'd' : 'q';
  return O(':', G(p, v), b);
}
const EXP = (v, kort) => v === 'z' || v === 'n' ? kies(kort ? [2, 2, 3] : [2, 2, 3, 3, 4]) : kies([2, 2, 3]);
const SJ = {
  /* maal- en deeltafels: m is het tafelgetal; factor 0 tot 10; delen door het tafelgetal of door de factor */
  tafel:{
    mt:(J, L, m) => { const t = G(Q(+m), 'n'), f = G(Q(ri(0, 10)), 'n'); return Math.random() < .5 ? O('·', t, f) : O('·', f, t); },
    dt:(J, L, m) => { const t = +m, f = ri(0, 10), p = G(Q(t * f), 'n'); return f && Math.random() < .35 ? O(':', p, G(Q(f), 'n')) : O(':', p, G(Q(t), 'n')); }
  },
  optel:{
    plus:(J, L) => O('+', L('som'), L('som')),
    min:(J, L) => O(MIN, L('som'), L('som')),
    som:(J, L, m) => keten(L, 'somk', m === 'q' ? 3 : m === 'd' || m === 'qd' || !J.teken ? ri(3, 4) : ri(3, 5), ['+', MIN])
  },
  maal:{
    maal:(J, L, m) => { if(!J.komma || !(m === 'd' || m === 'qd')) return O('·', L('maal'), L('maal'));
      const a = kommaAnder(J, L, m), k = kommaFactor(J, L, m); return Math.random() < .5 ? O('·', a, k) : O('·', k, a); },
    deel:(J, L, m) => m === 'q' || m === 'qn' ? O(':', L('maal'), L('maal')) : J.komma && (m === 'd' || m === 'qd') ? O(':', kommaAnder(J, L, m), kommaFactor(J, L, m)) : deling(J, L, 'maal'),
    fact:(J, L, m) => { if(J.komma && (m === 'd' || m === 'qd')){ const d = Math.random() < .4; return O(d ? ':' : '·', O('·', kommaAnder(J, L, m), kommaFactor(J, L, m)), kommaFactor(J, L, m)); }
      const n = ri(3, 4); let t = L('klein'); for(let i = 1; i < n; i++) t = O(Math.random() < .75 ? '·' : ':', t, L('klein')); return t; }
  },
  macht:{
    macht:(J, L, m) => { const b = L('macht');
      /* 1A (J.kwadraat): kwadraten tot J.kwadraat², derdemachten tot 5³ */
      if(J.kwadraat && (b.v === 'n' || b.v === 'z')){ const e = Math.random() < .1 ? kies([0, 1]) : kies([2, 2, 2, 3]), s = b.q.n < 0 ? -1 : 1;
        return P(G(Q(s * ri(1, e === 3 ? 5 : J.kwadraat)), b.v), e); }
      return P(b, Math.random() < .1 ? kies([0, 1]) : EXP(b.v)); },
    mmin:(J, L) => { const v = kies([1, 2, 3]); const b = L('macht', v === 1 ? 1 : -1), e = EXP(b.v, true); return v === 2 ? P(b, e) : M(P(v === 1 ? b : b, e)); },
    wortel:(J, L, m) => { const v = () => m === 'qd' ? kies(['q', 'd']) : m; const f = kies([1, 1, 2, 3]);
      return f === 1 ? wortelVan(J, v()) : f === 2 ? M(wortelVan(J, v())) : O(kies(['+', MIN]), wortelVan(J, v()), wortelVan(J, v())); }
  },
  volg:{
    zh:(J, L) => kies([
      () => O('+', L('volg'), O('·', L('volg'), L('volg'))),
      () => O(MIN, L('volg'), O('·', L('volg'), L('volg'))),
      () => O(kies(['+', MIN]), O('·', L('volg'), L('volg')), O('·', L('volg'), L('volg'))),
      () => O(kies(['+', MIN]), O(':', L('volg'), L('volg')), L('volg')),
      () => O(MIN, L('volg'), O(':', L('volg'), L('volg'))),
      () => O('+', O(MIN, L('volg'), O('·', L('volg'), L('volg'))), L('volg'))])(),
    mh:(J, L) => kies([
      () => O('·', O(kies(['+', MIN]), L('volg'), L('volg')), L('volg')),
      () => O('·', L('volg'), O(kies(['+', MIN]), L('volg'), L('volg'))),
      () => O(':', O(kies(['+', MIN]), L('volg'), L('volg')), L('volg')),
      () => O(':', L('volg'), O(kies(['+', MIN]), L('volg'), L('volg'))),
      () => O(MIN, L('volg'), O('·', O('+', L('volg'), L('volg')), L('volg'))),
      () => O('·', O('+', L('volg'), L('volg')), O(MIN, L('volg'), L('volg')))])(),
    mw:(J, L, m) => { const w = () => wortelVan(J, m === 'qd' ? kies(['q', 'd']) : m), p = () => P(L('macht'), 2);
      return kies([
        () => O(kies(['+', MIN]), L('volg'), p()),
        () => P(O(kies(['+', MIN]), L('klein'), L('klein')), 2),
        () => O('·', L('volg'), p()),
        () => O(kies(['+', MIN]), w(), O('·', L('volg'), L('volg'))),
        () => O(MIN, L('volg'), O('·', w(), L('volg'))),
        () => O(kies(['+', MIN]), p(), p()),
        () => O(':', P(O(kies(['+', MIN]), L('klein'), L('klein')), 2), L('volg'))])(); }
  }
};
/* een uitdrukking is bruikbaar als elke tussenuitkomst klopt met de soort getallen */
function bruikbaar(J, t, val, h){
  if(!val) return false;
  let hasQ = false, hasZ = false, hasD = false, ok = true;
  knopen(t, x=>{ if(x.k === 'g'){ if(x.qn) hasZ = true; if(x.v === 'q') hasQ = true; if(x.v === 'd') hasD = true; if(x.v === 'z'){ hasZ = true; if(J.zMax && !x.wrt && Math.abs(x.q.n) > J.zMax) ok = false; } } });
  if(!ok) return false;
  /* zonder teken (1A) blijft alles positief, behalve bij de gehele getallen en de negatieve breuken */
  const nat = !J.teken && !hasZ;
  knopen(t, x=>{
    if(!ok || x.k === 'g') return;
    const w = ev(x); if(!w || Math.abs(w.n) > 1e6 || w.d > 1e6){ ok = false; return; }
    if(nat && w.n < 0) ok = false;
    if(!hasQ && !hasD && w.d !== 1) ok = false;
    if(hasD && !hasQ && (decimalen(w) < 0 || decimalen(w) > 4)) ok = false;
    if(hasQ && w.d > 144) ok = false;
  });
  if(!ok) return false;
  if(hasQ) return val.d <= (h === 'volg' ? 60 : 100) && Math.abs(val.n) <= 400;
  if(hasD) return decimalen(val) >= 0 && decimalen(val) <= (h === 'macht' ? 4 : h === 'volg' ? 2 : 3) && Math.abs(val.n / val.d) <= 1000;
  return Math.abs(val.n) <= (hasZ && J.zMax ? 20 * J.zMax : h === 'optel' && !J.teken ? 3000 : 1000);
}
function soortVan(t){
  let q = false, d = false; knopen(t, x=>{ if(x.k === 'g'){ if(x.v === 'q') q = true; if(x.v === 'd') d = true; } });
  return q && d ? 'qd' : q ? 'q' : d ? 'd' : 'z';
}
function maakOefening(J, h, b, m){
  const L = (rol, teken) => getal(J, m === 'qd' ? kies(['q', 'd']) : m, rol, teken);
  for(let k = 0; k < 600; k++){
    const t = SJ[h][b](J, L, m), val = ev(t);
    if(bruikbaar(J, t, val, h)) return { h, b, html:html(t, true), w:[val.n, val.d], s:soortVan(t) };
  }
  return null;
}
/* een reeks van 10: per bewerking telkens een paar na elkaar (in de volgorde van de keuzelijst) */
/* g en b: 'alle', één id, ids met + ertussen (bv. 'z+q') of een lijst */
const lijst = (x, alle) => x === 'alle' || x == null ? alle.slice() : Array.isArray(x) ? x.slice() : String(x).split('+');
VO.lijst = lijst;
/* sleutel van een keuze: 'alle' als alles gekozen is, anders de ids in vaste volgorde met + ertussen */
VO.sleutel = (x, alle) => { const l = lijst(x, alle); return alle.every(a=>l.includes(a)) ? 'alle' : alle.filter(a=>l.includes(a)).join('+'); };
/* een hoofdstuk kan eigen getallen hebben (de tafels, of extra soorten zoals negatieve breuken) */
const getallenVan = (J, x) => (x && x.getallen) || J.getallen, modesVan = (J, x) => (x && x.modes) || J.modes;
VO.getallenVan = getallenVan;
VO.maakReeks = function(J, h, g, b, zichtbaar){
  const hx = J.hoofdstukken.find(y=>y.id === h), alleG = getallenVan(J, hx).map(x=>x[0]).filter(x=>x !== 'alle'), gs = lijst(g, alleG);
  /* soorten getallen per oefening: alles gekozen = ook breuken en kommagetallen in één oefening */
  const modes = h === 'mix' || alleG.every(a=>gs.includes(a)) ? modesVan(J, hx) : gs.concat(gs.includes('q') && gs.includes('d') ? ['qd'] : []);
  const hs = J.hoofdstukken.filter(x=>x.bew && (!zichtbaar || zichtbaar.includes(x.id)));
  const plan = [];
  if(!hs.length) return [];
  if(h === 'mix'){ const volg = schud(hs); for(let i = 0; i < 10; i++){ const x = volg[i % volg.length]; plan.push([x.id, kies(x.bew)[0]]); } }
  else { const x = hs.find(y=>y.id === h) || J.hoofdstukken.find(y=>y.id === h), bs = lijst(b, x.bew.map(y=>y[0])); for(let i = 0; i < 10; i++) plan.push([h, bs[i % bs.length]]); }
  const orde = J.hoofdstukken.flatMap(x=>(x.bew || []).map(y=>x.id + '|' + y[0]));
  plan.sort((p, q)=>orde.indexOf(p.join('|')) - orde.indexOf(q.join('|')));
  const items = [], gezien = new Set();
  plan.forEach(([hh, bb])=>{
    let it = null;
    for(let k = 0; k < 30 && !it; k++){ const m = kies(h === 'mix' ? modesVan(J, J.hoofdstukken.find(y=>y.id === hh)) : modes); const x = maakOefening(J, hh, bb, m); if(x && !gezien.has(x.html)) it = x; }
    if(it){ gezien.add(it.html); items.push(it); }
  });
  return items;
};

/* ---------- antwoorden lezen en beoordelen ---------- */
const norm = s => String(s == null ? '' : s).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '');
/* getal als tekst → breuk, of null; kommagetal mag met komma of punt */
function leesGetal(s){
  const t = norm(s); const m = t.match(/^([+-]?)(\d+)(?:[.,](\d+))?$/); if(!m) return null;
  const dec = m[3] || '', n = Number(m[2] + dec) * (m[1] === '-' ? -1 : 1);
  return { q:Q(n, 10 ** dec.length), komma:!!dec };
}
VO.leeg = it => it.s === 'q' || it.s === 'qd' ? { m:false, t:'', n:'' } : { a:'' };
VO.ingevuld = (it, a) => !!a && (a.a != null ? norm(a.a) !== '' : norm(a.t) !== '');
VO.beoordeel = function(it, a){
  const w = Q(it.w[0], it.w[1]);
  if(!a) return false;
  if(it.s === 'z' || it.s === 'd'){ const x = leesGetal(a.a); return !!x && R.gelijk(x.q, w); }
  const t = norm(a.t).replace(/^-/, ''), n = norm(a.n), teken = (a.m ? -1 : 1) * (/^-/.test(norm(a.t)) ? -1 : 1);
  const x = leesGetal(t); if(!x || /^[+-]/.test(t)) return false;
  if(n === ''){ if(x.komma && it.s !== 'qd') return false; return R.gelijk(Q(teken * x.q.n, x.q.d), w); }
  if(x.komma || !/^\d+$/.test(n)) return false;
  const tn = x.q.n, nn = Number(n);
  if(nn < 2 || ggd(tn, nn) !== 1) return false;   /* noemer 1 is geen breuk; niet vereenvoudigd telt als fout */
  return R.gelijk(Q(teken * tn, nn), w);
};
/* het juiste antwoord zoals een leerling het intikt (voor de tests) */
VO.canoniek = function(it){
  const w = Q(it.w[0], it.w[1]);
  if(it.s === 'z') return { a:String(w.n) };
  if(it.s === 'd') return { a:komma(w).replace(MIN, '-') };
  return w.d === 1 ? { m:w.n < 0, t:String(Math.abs(w.n)), n:'' } : { m:w.n < 0, t:String(Math.abs(w.n)), n:String(w.d) };
};

/* ---------- pagina ---------- */
const ICO = {
  tafel:'<path d="M4 4h16v16H4zM4 10h16M10 4v16"/>',
  optel:'<path d="M4 9h7M7.5 5.5v7M13 16.5h7"/>',
  maal:'<path d="M5 6l5 5M10 6l-5 5M14 16h6"/><circle cx="17" cy="13" r=".7"/><circle cx="17" cy="19" r=".7"/>',
  macht:'<path d="M4 19l4-10 4 10M5.6 15h4.8"/><path d="M15 6.5a2 2 0 1 1 3.2 1.6L15 11h4"/>',
  volg:'<path d="M8 4c-3 4.5-3 11.5 0 16M16 4c3 4.5 3 11.5 0 16"/>',
  mix:'<path d="M4 7h4l8 10h4M4 17h4l8-10h4"/>'
};
const ico = (h, cls) => `<svg class="${cls || 'ic'}" viewBox="0 0 24 24" aria-hidden="true">${ICO[h] || ICO.mix}</svg>`;

VO.start = function(J){
  const app = document.getElementById('app'), B = document.body, PREFIX = B.dataset.prefix || 'vrij_';
  const VERB = window.CL_VERBORGEN instanceof Set ? window.CL_VERBORGEN : new Set(window.CL_VERBORGEN || []);
  const HS = J.hoofdstukken.filter(x=>!VERB.has(x.id));
  const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
  const lees = k => { try{ const v = localStorage.getItem(PREFIX + k); return v ? JSON.parse(v) : null; }catch(e){ return null; } };
  const schrijf = (k, v) => { try{ if(v == null) localStorage.removeItem(PREFIX + k); else localStorage.setItem(PREFIX + k, JSON.stringify(v)); }catch(e){} };
  const hfd = h => J.hoofdstukken.find(y=>y.id === h), GL = h => getallenVan(J, hfd(h));
  const alleG = h => GL(h).map(x=>x[0]).filter(x=>x !== 'alle'), alleB = h => (hfd(h).bew || []).map(y=>y[0]);
  const alleNaam = h => (GL(h).find(y=>y[0] === 'alle') || [, 'Alles door elkaar'])[1];
  const naamG = (h, g) => g === 'alle' ? alleNaam(h) : String(g).split('+').map(x=>(GL(h).find(y=>y[0] === x) || [, x])[1]).join(' + ');
  /* de keuze per hoofdstuk blijft enkel zolang de pagina open is: bij het openen is niets aangeduid */
  const KZ = {};
  const naamB = (h, b) => { const x = J.hoofdstukken.find(y=>y.id === h); return b === 'alle' ? 'Alles door elkaar' : String(b).split('+').map(z=>((x && x.bew || []).find(y=>y[0] === z) || [, z])[1]).join(' + '); };
  const nrVan = h => HS.filter(x=>x.bew).findIndex(x=>x.id === h) + 1;
  let actief = null, scherm = 'keuze', bevestig = false;

  function tekenNav(){
    const nav = document.getElementById('nav'); if(!nav) return;
    let sep = false;
    nav.innerHTML = HS.map(x=>{ let s = ''; if(!x.bew && !sep){ sep = true; s = '<li class="sep" aria-hidden="true"></li>'; }
      return s + `<li><button type="button" data-h="${x.id}"${x.id === actief ? ' aria-current="page"' : ''}>${ico(x.id)}<span class="n">${x.bew ? nrVan(x.id) : ''}</span><span class="lbl">${esc(x.naam)}</span></button></li>`; }).join('');
    nav.querySelectorAll('button[data-h]').forEach(b=>b.onclick = ()=>ga(b.dataset.h));
  }
  function sectie(h, inhoud){
    const x = J.hoofdstukken.find(y=>y.id === h);
    try{ localStorage.setItem(PREFIX + 'tab', h); }catch(e){}
    app.innerHTML = `<section class="group vo-sectie" id="${h}"><div class="sec-head"><span class="sec-ic">${ico(h, '')}</span><h2>${x.bew ? `<span class="num">${nrVan(h)}.</span> ` : ''}${esc(x.naam)}</h2></div>${inhoud}</section>`;
    return app.querySelector('section');
  }
  const scoreTxt = s => s ? `${s.l}/10` : '–';

  /* ---------- keuze: getallen en bewerking, en de scores ---------- */
  function toonKeuze(h){
    scherm = 'keuze'; bevestig = false;
    const x = J.hoofdstukken.find(y=>y.id === h), k0 = KZ[h] || { g:'', b:'' }, ALLEG = x.bew ? alleG(h) : [];
    /* gekozen getallen en bewerkingen (één of meer); k.g en k.b zijn de sleutels ('alle', 'z' of 'z+q') */
    const kg = x.bew && k0.g ? lijst(k0.g, ALLEG).filter(a=>ALLEG.includes(a)) : [], kb = x.bew && k0.b ? lijst(k0.b, alleB(h)).filter(a=>alleB(h).includes(a)) : [];
    const klaarOm = !x.bew || (kg.length && kb.length);
    const k = { g:VO.sleutel(kg, ALLEG), b:x.bew ? VO.sleutel(kb, alleB(h)) : 'alle' };
    const sc = lees('scores') || {}, rk = lees('reeks_' + h), bezig = rk && !rk.klaar && rk.items && rk.items.length;
    let h2 = '';
    if(x.bew){
      /* meerkeuze: elke knop zet een soort aan of uit; Alles door elkaar zet alles aan */
      const chips = (soort, opties, aan) => opties.map(([id, nm, kort])=>{ const op = id === 'alle' ? opties.every(([i])=>i === 'alle' || aan.includes(i)) : aan.includes(id);
        return `<button type="button" class="vo-chip${op ? ' aan' : ''}${id === 'alle' ? ' vo-alle' : ''}" data-${soort}="${id}" aria-pressed="${op}">${esc(kort || nm)}</button>`; }).join('');
      h2 += `<div class="vo-kies"><div class="vo-rij"><b id="lblG">${esc(x.vraagG || 'Welke getallen?')}</b><div class="vo-chips" role="group" aria-labelledby="lblG">${chips('g', GL(h).filter(y=>y[0] !== 'alle').concat([['alle', alleNaam(h)]]), kg)}</div></div>
        <div class="vo-rij"><b id="lblB">${esc(x.vraagB || 'Welke bewerking?')}</b><div class="vo-chips" role="group" aria-labelledby="lblB">${chips('b', x.bew.concat([['alle', 'Alles door elkaar']]), kb)}</div></div>
        <p class="vo-meer">Kies in elke rij één of meer knoppen. ${alleNaam(h) === 'Alles door elkaar' ? '<b>Alles door elkaar</b> kiest' : `<b>${esc(alleNaam(h))}</b> en <b>Alles door elkaar</b> kiezen`} alles in die rij.</p></div>`;
    } else h2 += `<p class="vo-mixuitleg">Een reeks van 10 bewerkingen uit alle hoofdstukken, met alle soorten getallen door elkaar.</p>`;
    if(bezig) h2 += `<div class="tip vo-bezig"><div>Je reeks <b>${esc(h === 'mix' ? 'Alles door elkaar' : naamG(h, rk.g) + ' · ' + naamB(h, rk.b))}</b> is nog niet verbeterd (${rk.antw.filter((a, i)=>VO.ingevuld(rk.items[i], a)).length} van ${rk.items.length} ingevuld).
      <button type="button" class="btn vo-verder">Verder met die reeks →</button></div></div>`;
    h2 += `<div class="vo-start-rij"><button type="button" class="btn big vo-start"${klaarOm ? '' : ' disabled'}>${bezig ? 'Start een nieuwe reeks van 10' : 'Start een reeks van 10'}</button>${klaarOm ? '' : `<span class="vo-eerst">${esc(x.vraagG ? 'Kies eerst welke tafels en maal- of deeltafels.' : 'Kies eerst welke getallen en welke bewerking.')}</span>`}</div>`;
    /* scores: rijen = getallen, kolommen = bewerkingen; klik op een cel om die keuze te nemen */
    if(x.bew){
      const kol = x.bew.concat([['alle', 'Alles door elkaar']]);
      h2 += `<h3 class="vo-h3">Jouw scores</h3><div class="tbl-wrap"><table class="vo-scores"><thead><tr><th></th>${kol.map(([, nm])=>`<th>${esc(nm)}</th>`).join('')}</tr></thead><tbody>`
        /* veel rijen (de tafels): enkel de rijen met een score */
        + GL(h).filter(y=>y[0] !== 'alle' && (GL(h).length <= 8 || kol.some(([b])=>sc[`${h}|${y[0]}|${b}`]))).concat([['alle', alleNaam(h)]]).map(([g, gn])=>`<tr><th>${esc(gn)}</th>${kol.map(([b])=>{ const s = sc[`${h}|${g}|${b}`];
          return `<td><button type="button" class="vo-cel${s ? ' s' + (s.l >= 8 ? 4 : s.l >= 6 ? 3 : s.l >= 4 ? 2 : 1) : ''}${g === k.g && b === k.b ? ' nu' : ''}" data-g="${g}" data-b="${b}" title="${esc(gn + ' · ' + naamB(h, b))}${s ? `: laatste ${s.l}/10, beste ${s.b}/10, ${s.n} ${s.n === 1 ? 'reeks' : 'reeksen'}` : ': nog niet geoefend'}">${s ? `<b>${s.l}/10</b><small>beste ${s.b} · ${s.n}×</small>` : '–'}</button></td>`; }).join('')}</tr>`).join('')
        + '</tbody></table></div><p class="mini vo-legende">Per keuze je laatste score, je beste score en het aantal reeksen. Klik op een vakje om die keuze te nemen.</p>';
      /* combinaties van meer soorten (die passen niet in de tabel) */
      const enkel = new Set(ALLEG.concat('alle')), enkelB = new Set(alleB(h).concat('alle'));
      const andere = Object.entries(sc).filter(([key])=>{ const [hh, g, b] = key.split('|'); return hh === h && (!enkel.has(g) || !enkelB.has(b)); }).sort((a, b)=>(b[1].d || 0) - (a[1].d || 0));
      if(andere.length) h2 += '<h3 class="vo-h3">Andere combinaties</h3><ul class="vo-andere">' + andere.map(([key, s])=>{ const [, g, b] = key.split('|');
        return `<li><button type="button" class="linkbtn vo-comb" data-g="${esc(g)}" data-b="${esc(b)}">${esc(naamG(h, g) + ' · ' + naamB(h, b))}</button>: laatste <b>${s.l}/10</b>, beste ${s.b}/10, ${s.n} ${s.n === 1 ? 'reeks' : 'reeksen'}</li>`; }).join('') + '</ul>';
    } else { const s = sc['mix|alle|alle']; h2 += `<h3 class="vo-h3">Jouw scores</h3><p class="vo-mixscore">${s ? `Laatste score <b>${s.l}/10</b> · beste score <b>${s.b}/10</b> · ${s.n} ${s.n === 1 ? 'reeks' : 'reeksen'}` : 'Je hebt hier nog geen reeks gemaakt.'}</p>`; }
    const sec = sectie(h, h2);
    const zet = (g, b) => { KZ[h] = { g:g == null ? k.g : g, b:b == null ? k.b : b }; toonKeuze(h); };
    /* een soort aan- of uitzetten; Alles door elkaar zet alles aan, of alles uit als alles al aan stond */
    const wissel = (aan, id, alle) => { if(id === 'alle') return alle.every(a=>aan.includes(a)) ? '' : 'alle'; const l = aan.includes(id) ? aan.filter(a=>a !== id) : aan.concat(id); return l.length ? VO.sleutel(l, alle) : ''; };
    sec.querySelectorAll('.vo-chip[data-g]').forEach(b=>b.onclick = ()=>zet(wissel(kg, b.dataset.g, ALLEG), null));
    sec.querySelectorAll('.vo-chip[data-b]').forEach(b=>b.onclick = ()=>zet(null, wissel(kb, b.dataset.b, alleB(h))));
    sec.querySelectorAll('.vo-cel, .vo-comb').forEach(b=>b.onclick = ()=>zet(b.dataset.g, b.dataset.b));
    sec.querySelector('.vo-start').onclick = ()=>nieuweReeks(h, h === 'mix' ? 'alle' : k.g, h === 'mix' ? 'alle' : k.b);
    const v = sec.querySelector('.vo-verder'); if(v) v.onclick = ()=>toonReeks(h);
  }
  function nieuweReeks(h, g, b){
    const items = VO.maakReeks(J, h, g, b, HS.map(x=>x.id));
    schrijf('reeks_' + h, { g, b, i:0, items, antw:items.map(VO.leeg), klaar:false, start:Date.now() });
    toonReeks(h);
  }

  /* ---------- een reeks: één oefening per scherm ---------- */
  function antwoordVak(it, a, klaar){
    const dis = klaar ? ' disabled' : '';
    if(it.s === 'z' || it.s === 'd') return `<input class="vo-in" id="voIn" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${esc(a.a)}" aria-label="uitkomst"${dis}>`;
    return `<span class="vo-bv"><button type="button" class="vo-mt${a.m ? ' aan' : ''}" aria-pressed="${!!a.m}" title="minteken voor de breuk" aria-label="minteken"${dis}>${MIN}</button>`
      + `<span class="vo-br vo-brin"><input class="vo-t" id="voIn" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${esc(a.t)}" aria-label="teller"${dis}><input class="vo-n" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" value="${esc(a.n)}" aria-label="noemer"${dis}></span></span>`;
  }
  const VORM = { z:'', d:'', q:'Schrijf je breuk vereenvoudigd. Is de uitkomst een geheel getal? Laat de noemer dan leeg.', qd:'Schrijf een vereenvoudigde breuk of een kommagetal. Is de uitkomst een geheel getal? Laat de noemer dan leeg.' };
  function toonReeks(h){
    const rk = lees('reeks_' + h); if(!rk || !rk.items || !rk.items.length) return toonKeuze(h);
    scherm = 'reeks';
    const N = rk.items.length, i = Math.max(0, Math.min(N - 1, rk.i || 0)), it = rk.items[i], a = rk.antw[i] || VO.leeg(it);
    const ingevuld = rk.antw.filter((x, k)=>VO.ingevuld(rk.items[k], x)).length;
    const titel = h === 'mix' ? 'Alles door elkaar' : `${naamG(h, rk.g)} · ${naamB(h, rk.b)}`;
    const dots = rk.items.map((x, k)=>`<button type="button" class="vo-dot${k === i ? ' nu' : ''}${rk.klaar ? (rk.r[k] ? ' ok' : ' nok') : VO.ingevuld(x, rk.antw[k]) ? ' af' : ''}" data-i="${k}" aria-label="Oefening ${k + 1}${rk.klaar ? (rk.r[k] ? ', juist' : ', fout') : VO.ingevuld(x, rk.antw[k]) ? ', ingevuld' : ''}"${k === i ? ' aria-current="step"' : ''}></button>`).join('');
    const teken = rk.klaar ? (rk.r[i] ? '<span class="vo-res ok" role="img" aria-label="juist">✓</span>' : '<span class="vo-res nok" role="img" aria-label="fout">✗</span>') : '';
    const sec = sectie(h, `<div class="vo-kaart${rk.klaar ? ' klaar' : ''}">
      <div class="vo-balk"><div class="vo-dots" role="list">${dots}</div><span class="vo-tel">${rk.klaar ? `Score <b>${rk.score} / ${N}</b>` : `${ingevuld} / ${N} ingevuld`}</span></div>
      <div class="vo-kop"><span class="vo-badge">${esc(titel)}</span><span class="vo-nr">Oefening ${i + 1} van ${N}</span></div>
      ${rk.klaar ? `<div class="vo-score" role="status"><span class="vo-score-g">${rk.score}<small>/${N}</small></span><span>${rk.score === N ? 'Alles juist!' : rk.score >= 8 ? 'Heel goed!' : rk.score >= 5 ? 'Goed bezig.' : 'Blijf oefenen.'} Klik op de bolletjes om je oefeningen te bekijken.</span>
        <span class="vo-score-k"><button type="button" class="btn big vo-nieuw">↻ Nieuwe reeks</button><button type="button" class="btn ghost vo-terug">Andere keuze</button></span></div>` : ''}
      <div class="vo-opgave"><span class="vo-uitdr">${it.html}</span><span class="vo-is">=</span>${antwoordVak(it, a, rk.klaar)}${teken}</div>
      ${!rk.klaar && VORM[it.s] ? `<p class="vo-vorm">${VORM[it.s]}</p>` : ''}
      ${bevestig && !rk.klaar ? `<div class="tip vo-bevestig" role="alert"><div>Nog <b>${N - ingevuld}</b> ${N - ingevuld === 1 ? 'oefening is' : 'oefeningen zijn'} leeg. Een lege oefening telt als fout.
        <span class="vo-bev-k"><button type="button" class="btn vo-toch">Toch verbeteren</button><button type="button" class="btn ghost vo-invul">Verder invullen</button></span></div></div>` : ''}
      <div class="vo-nav"><button type="button" class="btn ghost vo-vorige"${i === 0 ? ' disabled' : ''}>← Vorige</button>
        ${rk.klaar ? '' : `<button type="button" class="btn${ingevuld === N ? '' : ' ghost'} vo-verbeter">Verbeter mijn reeks</button>`}
        <button type="button" class="btn ghost vo-volgende"${i === N - 1 ? ' disabled' : ''}>Volgende →</button></div>
      ${rk.klaar ? '' : '<p class="vo-stop"><button type="button" class="linkbtn vo-terug">Terug naar de keuze</button> (je reeks blijft bewaard)</p>'}
    </div>`);
    const ga2 = k => { const r2 = lees('reeks_' + h); r2.i = Math.max(0, Math.min(N - 1, k)); schrijf('reeks_' + h, r2); bevestig = false; toonReeks(h); const f = app.querySelector('#voIn'); if(f && !f.disabled) f.focus(); };
    sec.querySelectorAll('.vo-dot').forEach(d=>d.onclick = ()=>ga2(+d.dataset.i));
    sec.querySelector('.vo-vorige').onclick = ()=>ga2(i - 1);
    sec.querySelector('.vo-volgende').onclick = ()=>ga2(i + 1);
    sec.querySelectorAll('.vo-terug').forEach(b=>b.onclick = ()=>toonKeuze(h));
    const nw = sec.querySelector('.vo-nieuw'); if(nw) nw.onclick = ()=>nieuweReeks(h, rk.g, rk.b);
    const vb = sec.querySelector('.vo-verbeter'); if(vb) vb.onclick = ()=>{ const r2 = lees('reeks_' + h); if(r2.antw.every((x, k)=>VO.ingevuld(r2.items[k], x))) verbeter(h); else { bevestig = true; toonReeks(h); } };
    const toch = sec.querySelector('.vo-toch'); if(toch) toch.onclick = ()=>verbeter(h);
    const inv = sec.querySelector('.vo-invul'); if(inv) inv.onclick = ()=>{ const r2 = lees('reeks_' + h); const k = r2.antw.findIndex((x, n)=>!VO.ingevuld(r2.items[n], x)); bevestig = false; ga2(k < 0 ? i : k); };
    if(rk.klaar) return;
    /* invoer bewaren zonder opnieuw te tekenen */
    const bewaar = () => {
      const r2 = lees('reeks_' + h), w = r2.antw[i] || VO.leeg(it);
      if(it.s === 'z' || it.s === 'd') w.a = sec.querySelector('.vo-in').value;
      else { const t = sec.querySelector('.vo-t'); if(/^\s*[-−–]/.test(t.value)){ t.value = t.value.replace(/^\s*[-−–]\s*/, ''); w.m = !w.m; const mt = sec.querySelector('.vo-mt'); mt.classList.toggle('aan', w.m); mt.setAttribute('aria-pressed', String(w.m)); }
        w.t = t.value; w.n = sec.querySelector('.vo-n').value; }
      r2.antw[i] = w; schrijf('reeks_' + h, r2);
      const n2 = r2.antw.filter((x, k)=>VO.ingevuld(r2.items[k], x)).length;
      sec.querySelector('.vo-tel').textContent = `${n2} / ${N} ingevuld`;
      const d = sec.querySelectorAll('.vo-dot')[i]; d.classList.toggle('af', VO.ingevuld(it, w));
      const vb2 = sec.querySelector('.vo-verbeter'); vb2.classList.toggle('ghost', n2 !== N);
    };
    const velden = [...sec.querySelectorAll('.vo-opgave input')];
    velden.forEach((f, k)=>{
      f.addEventListener('input', bewaar);
      f.addEventListener('keydown', e=>{
        if(e.key === 'Enter'){ e.preventDefault(); if(i < N - 1) ga2(i + 1); else sec.querySelector('.vo-verbeter').focus(); }
        else if(f.classList.contains('vo-t') && (e.key === 'ArrowDown' || e.key === '/' || e.key === ':')){ e.preventDefault(); velden[1].focus(); }
        else if(f.classList.contains('vo-n') && (e.key === 'ArrowUp' || (e.key === 'Backspace' && f.value === ''))){ e.preventDefault(); velden[0].focus(); }
      });
    });
    const mt = sec.querySelector('.vo-mt');
    if(mt) mt.onclick = ()=>{ const r2 = lees('reeks_' + h), w = r2.antw[i] || VO.leeg(it); w.m = !w.m; r2.antw[i] = w; schrijf('reeks_' + h, r2); mt.classList.toggle('aan', w.m); mt.setAttribute('aria-pressed', String(w.m)); velden[0].focus(); };
  }
  function verbeter(h){
    const rk = lees('reeks_' + h);
    rk.r = rk.items.map((it, k)=>VO.beoordeel(it, rk.antw[k]) ? 1 : 0);
    rk.score = rk.r.reduce((s, x)=>s + x, 0); rk.klaar = true; rk.i = 0; rk.eind = Date.now();
    schrijf('reeks_' + h, rk);
    const key = `${h}|${rk.g}|${rk.b}`, sc = lees('scores') || {}, o = sc[key] || { n:0, b:0 };
    sc[key] = { n:o.n + 1, l:rk.score, b:Math.max(o.b, rk.score), d:Date.now() }; schrijf('scores', sc);
    CLtoets(`${h}_${rk.g}-${rk.b}`, rk.score, rk.items.length);
    bevestig = false; toonReeks(h);
  }
  function ga(h){
    if(!HS.some(x=>x.id === h)) h = HS[0] && HS[0].id;
    if(!h){ app.innerHTML = '<div class="tip"><div>Er staat hier nog niets open.</div></div>'; return; }
    actief = h; tekenNav();
    if(location.hash.slice(1) !== h) history.replaceState(null, '', '#' + h);
    const rk = lees('reeks_' + h);
    if(rk && rk.items && rk.items.length && !rk.klaar) toonReeks(h); else toonKeuze(h);
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', ()=>{ const h = location.hash.slice(1); if(h && h !== actief) ga(h); });
  ga(decodeURIComponent(location.hash.slice(1)));
  /* voor test/catalogus.js en de testscripts */
  window.SECTIONS = HS.map(x=>({ id:x.id, nav:x.naam }));
  window.show = id => ga(id);
  VO.J = J; VO.ga = ga; VO.toonKeuze = toonKeuze; VO.PREFIX = PREFIX;
};
})();
