/* 2A Rekenvaardigheden 1 · Coördinaten op het rooster (30 oefeningen, interactief met gedeeld/rv-kader.js).
   Oefeningen, volgorde en uitleg zoals het oorspronkelijke Oefening.html; verbeteren zoals code.gs:
   deelpunten per coördinaat en foutcodes. Het ontbrekende punt D, de vier oplossingen en de naam van de figuur
   staan enkel in de versleutelde sleutel (sleutel.enc.json). De andere antwoorden volgen uit de opgave zelf.
   Elke coördinaat: tekenvak (+ boven, − onder) en het getal zonder teken; vooraan verdwijnt een gekozen +. */
(function(){
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => n < 0 ? '−' + Math.abs(n) : String(n);
const ptTxt = p => '(' + fmt(p[0]) + ', ' + fmt(p[1]) + ')';

/* ---------- oefeningen ---------- */
const V = (id, soort, punten, vraag, p) => ({ id, type:'eigen', soort, punten, vraag, p });
const lees = (id, A) => V(id, 'read', 1, 'Lees de coördinaat van punt A.', { A });
const plaats = (id, A) => V(id, 'place', 1, 'Duid punt A aan met de gegeven coördinaat.', { A });
const DELEN = [
  { titel:'Coördinaat aflezen', vragen:[ lees('ex01', [0, 6]), lees('ex02', [-1, -6]), lees('ex03', [2, -5]), lees('ex04', [-4, 3]), lees('ex05', [-6, -2]), lees('ex06', [7, -3]) ] },
  { titel:'Punt plaatsen', vragen:[ plaats('ex07', [3, -2]), plaats('ex08', [-7, 0]), plaats('ex09', [-2, 7]), plaats('ex10', [-5, 5]), plaats('ex11', [6, 4]), plaats('ex12', [5, -7]) ] },
  { titel:'Meerdere punten plaatsen', vragen:[
    V('ex13', 'multi', 1, 'Plaats alle gevraagde punten op het rooster.', { A:[-4, 2], B:[2, 4], C:[5, -1] }),
    V('ex14', 'multi', 1, 'Plaats A, B en C.', { A:[-5, -4], B:[0, 4], C:[5, 1] }),
    V('ex15', 'multi', 1, 'Plaats A, B en C.', { A:[-6, 6], B:[1, -4], C:[7, 2] }),
    V('ex16', 'multi', 1, 'Plaats A, B, C en D.', { A:[-6, 3], B:[-2, -4], C:[3, 4], D:[6, -2] }),
    V('ex17', 'multi', 1, 'Plaats alle vier de punten.', { A:[-7, -5], B:[-3, 2], C:[2, -6], D:[6, 5] }) ] },
  { titel:'Coördinaten noteren', vragen:[
    V('ex18', 'coords', 1, 'Noteer de coördinaten van alle hoekpunten.', { A:[-5, -2], B:[-1, 4], C:[5, 4], D:[5, -2] }),
    V('ex19', 'coords', 1, 'Noteer de coördinaten van alle hoekpunten.', { A:[-4, -4], B:[-4, 2], C:[2, 5], D:[6, -1] }),
    V('ex20', 'coords', 1, 'Noteer de coördinaten van alle hoekpunten.', { A:[-6, -3], B:[-2, 4], C:[4, 4], D:[6, -3] }) ] },
  { titel:'Figuur vervolledigen', vragen:[
    V('ex21', 'missing', 1.5, 'ABCD moet een parallellogram worden. Welke coördinaat heeft D?', { A:[-5, -2], B:[1, -2], C:[4, 3] }),
    V('ex22', 'missing', 1.5, 'ABCD moet een parallellogram worden. Welke coördinaat heeft D?', { A:[-3, -4], B:[3, -4], C:[6, 2] }),
    V('ex23', 'missing', 1.5, 'ABCD moet een rechthoek zijn. Waar ligt punt D?', { A:[-4, -2], B:[4, -2], C:[4, 3] }),
    V('ex24', 'missing', 1.5, 'ABCD moet een vierkant zijn. Waar ligt punt D?', { A:[-3, -3], B:[3, -3], C:[3, 3] }),
    V('ex25', 'missing', 1.5, 'ABCD moet een ruit zijn. Waar ligt punt D?', { A:[-5, 0], B:[0, 4], C:[5, 0] }),
    V('ex26', 'missing', 1.5, 'ABCD moet een gelijkbenig trapezium zijn. Waar ligt punt D?', { A:[-4, -2], B:[4, -2], C:[2, 3] }) ] },
  { titel:'Meerdere mogelijkheden', vragen:[
    V('ex27', 'four', 2, 'Gegeven A en B. Geef 4 mogelijkheden om punt C te plaatsen zodat driehoek ABC een gelijkbenige rechthoekige driehoek wordt.', { A:[-3, -2], B:[2, -2] }) ] },
  { titel:'Figuur plaatsen en herkennen', vragen:[
    V('ex28', 'placeshape', 1.5, 'Plaats de 4 punten. Welke figuur ontstaat en wat is de best passende naam?', { A:[-4, -1], B:[0, 2], C:[0, -3], D:[-4, -6] }),
    V('ex29', 'placeshape', 1.5, 'Plaats de 4 punten. Welke figuur ontstaat en wat is de best passende naam?', { A:[-6, -5], B:[-1, -3], C:[1, 1], D:[-4, -1] }),
    V('ex30', 'placeshape', 1.5, 'Plaats de 4 punten. Welke figuur ontstaat en wat is de best passende naam?', { A:[-6, -4], B:[0, -4], C:[0, 0], D:[-6, 0] }) ] }
];
const UITLEG = {
  read:'Eerst x (horizontaal), dan y (verticaal). Werk zorgvuldig en controleer je antwoord voordat je verdergaat.',
  place:'Gebruik de gegeven coördinaat en klik de juiste plaats aan.',
  multi:'Plaats de punten in de juiste volgorde.',
  coords:'Noteer bij elk hoekpunt eerst x, dan y.',
  missing:'Vul de coördinaat van D in. Je ziet D dan op het rooster verschijnen, net zoals wanneer je het op papier tekent.',
  four:'Er bestaan meerdere juiste antwoorden. Zoek er 4; de volgorde maakt niet uit.',
  placeshape:'Plaats eerst alle punten, kies daarna de best passende naam voor de figuur.'
};
const FIGUREN = ['driehoek', 'vierkant', 'rechthoek', 'parallellogram', 'ruit', 'trapezium', 'vijfhoek', 'zeshoek'];
const BEGRIPPEN = {
  'gelijkbenige rechthoekige driehoek':'Een driehoek met één rechte hoek (90°) én twee gelijke zijden (de twee benen naast de rechte hoek).',
  'gelijkbenig trapezium':'Een vierhoek met twee evenwijdige zijden, waarbij de twee andere (niet-evenwijdige) zijden even lang zijn.',
  'parallellogram':'Een vierhoek waarvan de overstaande zijden twee aan twee evenwijdig én even lang zijn.',
  'rechthoek':'Een vierhoek met vier rechte hoeken (90°); de overstaande zijden zijn even lang.',
  'vierkant':'Een vierhoek met vier rechte hoeken én vier gelijke zijden.',
  'ruit':'Een vierhoek met vier gelijke zijden, maar niet noodzakelijk rechte hoeken.',
  'coördinaat':'Een koppel getallen (x, y) dat de exacte plaats van een punt op het rooster aangeeft.',
  'rooster':'Het vlak met horizontale en verticale lijnen waarop je punten kan aanduiden met coördinaten.'
};
const CODES = {
  XY_OMGEWISSELD:{ label:'x en y omgewisseld', uitleg:'(y, x) geschreven in plaats van (x, y), of het punt gespiegeld rond de diagonaal geplaatst.' },
  TEKEN_X:{ label:'Teken van x fout', uitleg:'Het getal van de x-coördinaat klopt, maar links en rechts van de y-as zijn verward.' },
  TEKEN_Y:{ label:'Teken van y fout', uitleg:'Het getal van de y-coördinaat klopt, maar boven en onder de x-as zijn verward.' },
  EEN_VAKJE_ERNAAST:{ label:'Eén vakje ernaast', uitleg:'Eén hokje verkeerd geteld (bv. vanaf 1 beginnen tellen in plaats van vanaf 0).' },
  X_FOUT:{ label:'x-coördinaat fout', uitleg:'De x-coördinaat klopt niet.' },
  Y_FOUT:{ label:'y-coördinaat fout', uitleg:'De y-coördinaat klopt niet.' },
  VOLGORDE_HOEKPUNTEN:{ label:'Volgorde van de hoekpunten', uitleg:'D maakt wel een parallellogram met A, B en C, maar niet in de volgorde ABCD (D ligt niet tegenover B).' },
  NIET_GELIJKBENIG:{ label:'Rechte hoek, maar niet gelijkbenig', uitleg:'De driehoek heeft een rechte hoek, maar de benen zijn niet even lang.' },
  GEEN_RECHTE_HOEK:{ label:'Gelijkbenig, maar geen rechte hoek', uitleg:'Twee zijden zijn even lang, maar de driehoek heeft geen rechte hoek.' },
  DRIEHOEK_FOUT:{ label:'Geen gelijkbenige rechthoekige driehoek', uitleg:'Het gekozen punt C geeft geen rechte hoek en geen gelijke benen.' },
  DUBBELE_OPLOSSING:{ label:'Dezelfde oplossing twee keer', uitleg:'Hetzelfde punt C werd meer dan één keer ingevuld.' },
  NIET_BEST_PASSEND:{ label:'Juiste, maar niet de best passende naam', uitleg:'Bv. "parallellogram" voor een ruit: dat klopt, maar "ruit" zegt meer.' },
  VORM_FOUT:{ label:'Verkeerde figuur', uitleg:'De gekozen naam past niet bij de figuur.' }
};
/* namen die wel kloppen, maar niet de best passende zijn (zoals code.gs) */
const RUIMERE_NAAM = { vierkant:['rechthoek', 'ruit', 'parallellogram', 'trapezium'], rechthoek:['parallellogram', 'trapezium'], ruit:['parallellogram', 'trapezium'], parallellogram:['trapezium'] };

/* ---------- coördinaten lezen: { xs, x, ys, y } → [x, y] ---------- */
const nat = x => { const t = String(x == null ? '' : x).trim(); return /^\d{1,3}$/.test(t) ? +t : null; };
const neg = s => s === '−' || s === '-';
const getal = (s, n) => { const g = nat(n); if(g === null) return null; if(g === 0) return 0; return s == null ? null : neg(s) ? -g : g; };
const co = o => { if(!o) return null; const x = getal(o.xs, o.x), y = getal(o.ys, o.y); return x === null || y === null ? null : [x, y]; };
const pt = p => Array.isArray(p) && p.length === 2 && isFinite(p[0]) && isFinite(p[1]) ? [+p[0], +p[1]] : null;
const leegCo = () => ({ xs:null, x:'', ys:null, y:'' });
const zelfde = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];
/* zoals de leerling het schreef, ook half ingevuld */
const coTekst = o => { if(!o) return '(…, …)'; const d = (s, n) => String(n == null ? '' : n).trim() === '' ? '…' : (nat(n) !== 0 && neg(s) ? '−' : '') + String(n).trim(); return `(${d(o.xs, o.x)}, ${d(o.ys, o.y)})`; };

/* ---------- verbeteren (zoals code.gs) ---------- */
function punt(want, got, w){
  if(!got) return { pts:0, codes:[] };
  if(zelfde(want, got)) return { pts:w, codes:[] };
  if(got[0] === want[1] && got[1] === want[0]) return { pts:0, codes:['XY_OMGEWISSELD'] };
  let pts = 0; const codes = [];
  [[0, 'TEKEN_X', 'X_FOUT'], [1, 'TEKEN_Y', 'Y_FOUT']].forEach(([i, teken, fout])=>{
    const g = got[i], t = want[i];
    if(g === t) pts += w / 2; else if(g === -t) codes.push(teken); else if(Math.abs(g - t) === 1) codes.push('EEN_VAKJE_ERNAAST'); else codes.push(fout);
  });
  return { pts, codes };
}
function punten(want, got, max){
  const keys = Object.keys(want), w = max / keys.length; let pts = 0, codes = [];
  keys.forEach(k=>{ const r = punt(want[k], got[k], w); pts += r.pts; codes = codes.concat(r.codes); });
  return { pts, codes };
}
function driehoekCode(A, B, C){
  const d = (P, Q) => (P[0] - Q[0]) ** 2 + (P[1] - Q[1]) ** 2, s = [d(A, B), d(B, C), d(C, A)].sort((a, b)=>a - b);
  const recht = s[0] > 0 && s[0] + s[1] === s[2], gelijkbenig = s[0] === s[1] || s[1] === s[2];
  return recht && !gelijkbenig ? 'NIET_GELIJKBENIG' : !recht && gelijkbenig ? 'GEEN_RECHTE_HOEK' : 'DRIEHOEK_FOUT';
}
const geplaatst = v => { const o = {}; Object.entries((v && v.pts) || {}).forEach(([k, p])=>{ const q = pt(p); if(q) o[k] = q; }); return o; };
const ingevuld = v => { const o = {}; Object.entries((v && v.pts) || {}).forEach(([k, c])=>{ const q = co(c); if(q) o[k] = q; }); return o; };
const VERBETER = {
  read:(q, v)=>punt(q.p.A, co(v.v), q.punten),
  place:(q, v)=>punt(q.p.A, pt(v.A), q.punten),
  multi:(q, v)=>punten(q.p, geplaatst(v), q.punten),
  coords:(q, v)=>punten(q.p, ingevuld(v), q.punten),
  missing(q, v, k){
    const got = co(v.v); if(!got || !k || !k.answer) return { pts:0, codes:[] };
    if(zelfde(k.answer, got)) return { pts:q.punten, codes:[] };
    const { A, B, C } = q.p, alt = [[A[0] + B[0] - C[0], A[1] + B[1] - C[1]], [B[0] + C[0] - A[0], B[1] + C[1] - A[1]]];
    if(alt.some(a=>zelfde(a, got))) return { pts:.5, codes:['VOLGORDE_HOEKPUNTEN'] };
    return punt(k.answer, got, q.punten);
  },
  four(q, v, k){
    if(!k || !k.answers) return { pts:0, codes:[] };
    const per = q.punten / k.answers.length, gezien = new Set(), codes = []; let pts = 0;
    (v.c || []).forEach(o=>{ const g = co(o); if(!g) return; const s = g.join(',');
      if(gezien.has(s)){ codes.push('DUBBELE_OPLOSSING'); return; } gezien.add(s);
      if(k.answers.some(a=>zelfde(a, g))) pts += per; else codes.push(driehoekCode(q.p.A, q.p.B, g)); });
    return { pts, codes };
  },
  placeshape(q, v, k){
    const r = punten(q.p, geplaatst(v), 1); let pts = r.pts; const codes = r.codes.slice();
    if(k && k.shape && v.shape){ if(v.shape === k.shape) pts += .5; else codes.push((RUIMERE_NAAM[k.shape] || []).includes(v.shape) ? 'NIET_BEST_PASSEND' : 'VORM_FOUT'); }
    return { pts, codes };
  }
};

/* ---------- volledig ingevuld? ---------- */
const VOLLEDIG = {
  read:(q, v)=>!!co(v.v),
  place:(q, v)=>!!pt(v.A),
  multi:(q, v)=>Object.keys(q.p).every(k=>pt((v.pts || {})[k])),
  coords:(q, v)=>Object.keys(q.p).every(k=>co((v.pts || {})[k])),
  missing:(q, v)=>!!co(v.v),
  four:(q, v)=>(v.c || []).length === 4 && v.c.every(o=>co(o)),
  placeshape:(q, v)=>Object.keys(q.p).every(k=>pt((v.pts || {})[k])) && !!v.shape
};
const LEEG = {
  read:()=>({ v:leegCo() }), missing:()=>({ v:leegCo() }),
  place:()=>({ A:null }),
  multi:()=>({ pts:{} }),
  coords:q=>({ pts:Object.fromEntries(Object.keys(q.p).map(k=>[k, leegCo()])) }),
  four:()=>({ c:[leegCo(), leegCo(), leegCo(), leegCo()] }),
  placeshape:()=>({ pts:{}, shape:null })
};

/* ---------- het rooster (ook voor het dashboard en de pdf) ---------- */
const MIN = -8, MAX = 8, M = 30, PLOT = 500, U = PLOT / (MAX - MIN);
const sx = x => M + (x - MIN) * U, sy = y => M + PLOT - (y - MIN) * U;
/* punten { A:[x, y] }, verbind: veelhoek tekenen, nieuw: deze letters zijn van de leerling (andere kleur) */
function rooster(pts, verbind, nieuw = [], interactief = false){
  let h = '';
  for(let i = MIN; i <= MAX; i++){
    const as = i === 0;
    h += `<line class="co-lijn${as ? ' as' : ''}" x1="${sx(i)}" y1="${M}" x2="${sx(i)}" y2="${M + PLOT}"/><line class="co-lijn${as ? ' as' : ''}" x1="${M}" y1="${sy(i)}" x2="${M + PLOT}" y2="${sy(i)}"/>`;
    if(i !== 0) h += `<text class="co-lab" x="${sx(i)}" y="${sy(0) + 19}">${fmt(i)}</text><text class="co-lab" x="${sx(0) - 12}" y="${sy(i) + 5}">${fmt(i)}</text>`;
  }
  h += `<text class="co-lab nul" x="${sx(0) - 11}" y="${sy(0) + 19}">0</text><text class="co-as" x="${M + PLOT + 14}" y="${sy(0) + 5}">x</text><text class="co-as" x="${sx(0)}" y="${M - 14}">y</text>`;
  const lijst = Object.entries(pts).filter(([, p])=>pt(p));
  if(verbind && lijst.length > 2) h += `<polygon class="co-veelhoek" points="${lijst.map(([, p])=>sx(p[0]) + ',' + sy(p[1])).join(' ')}"/>`;
  lijst.forEach(([k, p])=>{ const n = nieuw.includes(k);
    h += `<circle class="co-punt${n ? ' nieuw' : ''}" cx="${sx(p[0])}" cy="${sy(p[1])}" r="8"/><text class="co-letter" x="${sx(p[0]) + 11}" y="${sy(p[1]) - 10}">${esc(k)}</text>`; });
  if(interactief) h += '<g class="co-spook" style="display:none"><circle r="8"/><rect x="12" y="-36" width="74" height="26" rx="8"/><text x="49" y="-17"></text></g>';
  return `<svg class="co-svg" viewBox="0 0 560 560" aria-label="Coördinatenrooster">${h}</svg>`;
}

/* ---------- lezen: dashboard, pdf, resultaat van de leerling ---------- */
function toon(q, a, modus, k){
  let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){}
  const blanco = modus === 'blanco', sl = modus === 'sleutel';
  if(modus === 'lezen' && !v) return '<p class="tl-niet">Niet ingevuld.</p>';
  if(!v || blanco || sl) v = LEEG[q.soort](q);
  const lijn = (l, r) => `<div class="tl"><span class="tl-l">${l}</span><span class="tl-r">${r}</span></div>`;
  const leeg = '<span class="tl-leeg">……</span>', juist = p => p ? esc(ptTxt(p)) : leeg;
  const fig = (pts, verbind, nieuw) => `<div class="rv-lees rv-lees-fig co-lees"><div class="tl-fig">${rooster(pts, verbind, nieuw)}</div><div>`;
  const ks = Object.keys(q.p), gegeven = ks.map(x=>x + esc(ptTxt(q.p[x]))).join(' · ');
  switch(q.soort){
    case 'read':
      return fig(q.p, false) + lijn('A =', sl ? juist(q.p.A) : blanco ? leeg : esc(coTekst(v.v))) + '</div></div>';
    case 'place': {
      const A = sl ? q.p.A : pt(v.A);
      return fig(A ? { A } : {}, false, ['A']) + lijn('Gegeven:', 'A' + esc(ptTxt(q.p.A))) + lijn('Geplaatst:', A ? 'A' + juist(A) : leeg) + '</div></div>';
    }
    case 'multi': {
      const p = sl ? q.p : geplaatst(v);
      return fig(p, false, ks) + lijn('Gegeven:', gegeven) + ks.map(x=>lijn(x + ':', p[x] ? juist(p[x]) : leeg)).join('') + '</div></div>';
    }
    case 'coords':
      return fig(q.p, false) + ks.map(x=>lijn(x + ' =', sl ? juist(q.p[x]) : blanco ? leeg : esc(coTekst(v.pts[x])))).join('') + '</div></div>';
    case 'missing': {
      const D = sl ? k && pt(k.answer) : co(v.v), p = Object.assign({}, q.p, D ? { D } : {});
      return fig(p, !!D, ['D']) + lijn('Gegeven:', gegeven) + lijn('D =', sl ? juist(D) : blanco ? leeg : esc(coTekst(v.v))) + '</div></div>';
    }
    case 'four': {
      const C = sl ? ((k && k.answers) || []).map(pt) : v.c.map(co), p = Object.assign({}, q.p);
      C.forEach((c, i)=>{ if(c) p['C' + (i + 1)] = c; });
      return fig(p, false, ['C1', 'C2', 'C3', 'C4']) + lijn('Gegeven:', gegeven)
        + [0, 1, 2, 3].map(i=>lijn(`C${i + 1} =`, sl ? juist(C[i]) : blanco ? leeg : esc(coTekst(v.c[i])))).join('') + '</div></div>';
    }
    case 'placeshape': {
      const p = sl ? q.p : geplaatst(v), vorm = sl ? k && k.shape : v.shape;
      return fig(p, Object.keys(p).length === ks.length, ks) + lijn('Gegeven:', gegeven) + lijn('Figuur:', vorm ? esc(vorm) : leeg) + '</div></div>';
    }
  }
  return '';
}

/* ---------- invullen: de interactieve oefeningen ---------- */
const TYPEN = {};
Object.keys(LEEG).forEach(s=>{ TYPEN[s] = { leeg:LEEG[s], volledig:VOLLEDIG[s], uitleg:()=>UITLEG[s] }; });
/* (x, y) met een tekenvak en een getal per coördinaat; vooraan verdwijnt een gekozen + */
function coVak(pad, o, naam){
  const RV = window.RV;
  return `<div class="rv-rij co-rij"><span class="rv-lbl">${esc(naam)}</span><span class="co-haak">(</span>`
    + `<span class="rv-term">${RV.teken(pad + '.xs', o.xs, `teken van x bij ${naam}`, true)}${RV.getal(pad + '.x', o.x, 'nat', 'co', `x bij ${naam}`)}</span><span class="co-haak">,</span>`
    + `<span class="rv-term">${RV.teken(pad + '.ys', o.ys, `teken van y bij ${naam}`, true)}${RV.getal(pad + '.y', o.y, 'nat', 'co', `y bij ${naam}`)}</span><span class="co-haak">)</span></div>`;
}
const TIP_CO = '<p class="rv-tip">Kies voor elk getal het teken (<b>+</b> of <b>−</b>) en schrijf het getal zonder teken ernaast. Bij 0 hoef je geen teken te kiezen.</p>';
const gegevenTekst = q => Object.entries(q.p).map(([k, p])=>`${k}${esc(ptTxt(p))}`).join(' · ');
/* klikken op het rooster: dichtstbijzijnde roosterpunt, met een spookpunt bij het bewegen */
function klikbaar(c, bijKlik){
  const svg = c.vis.querySelector('svg'), spook = svg.querySelector('.co-spook');
  svg.classList.add('klik');
  const puntBij = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const m = p.matrixTransform(svg.getScreenCTM().inverse());
    return [Math.max(MIN, Math.min(MAX, Math.round((m.x - M) / U + MIN))), Math.max(MIN, Math.min(MAX, Math.round(MAX - (m.y - M) / U)))]; };
  svg.onpointermove = ev=>{ const p = puntBij(ev); spook.style.display = ''; spook.setAttribute('transform', `translate(${sx(p[0])},${sy(p[1])})`); spook.querySelector('text').textContent = ptTxt(p); };
  svg.onpointerleave = ()=>{ spook.style.display = 'none'; };
  svg.onpointerdown = ev=>{ bijKlik(puntBij(ev)); };
}
function werk(c){ c.root.querySelector('.rv-werk').classList.add('rooster'); }

TYPEN.read.teken = c=>{ werk(c); c.vis.innerHTML = rooster(c.q.p, false);
  c.ant.innerHTML = '<h3>Jouw antwoord</h3><p class="rv-tip">Vul de coördinaat in als <b>(x, y)</b>.</p>' + coVak('v', c.v.v, 'A') + TIP_CO; };
TYPEN.missing.teken = c=>{
  const { q, v } = c; werk(c);
  const teken = w => { const D = co(w.v); c.vis.innerHTML = rooster(Object.assign({}, q.p, D ? { D } : {}), !!D, ['D']); };
  teken(v);
  c.ant.innerHTML = '<h3>Jouw antwoord</h3><p class="rv-tip">Vul de coördinaat in als <b>(x, y)</b>.</p>' + coVak('v', v.v, 'D') + TIP_CO;
  /* D verschijnt meteen op het rooster */
  c.ant.oninput = ()=>teken(c.huidig());
};
TYPEN.coords.teken = c=>{ werk(c); c.vis.innerHTML = rooster(c.q.p, false);
  c.ant.innerHTML = '<h3>Coördinaten</h3><p class="rv-tip">Noteer de coördinaten van elk hoekpunt.</p>' + Object.keys(c.q.p).map(k=>coVak('pts.' + k, c.v.pts[k], k)).join('') + TIP_CO; };
TYPEN.four.teken = c=>{ werk(c); c.vis.innerHTML = rooster(c.q.p, false);
  c.ant.innerHTML = '<h3>Jouw antwoorden</h3><p class="rv-tip">Vul 4 verschillende coördinaten in voor punt C, telkens als <b>(x, y)</b>. De volgorde maakt niet uit.</p>' + [0, 1, 2, 3].map(i=>coVak('c.' + i, c.v.c[i], 'C' + (i + 1))).join('') + TIP_CO; };
TYPEN.place.teken = c=>{
  const { q, v } = c, A = pt(v.A); werk(c);
  c.vis.innerHTML = rooster(A ? { A } : {}, false, ['A'], true);
  c.ant.innerHTML = `<h3>Plaats punt A</h3><p class="rv-tip">Klik op het rooster op de plaats van A. Nog eens klikken verplaatst het punt.</p><p class="co-gegeven"><b>Gegeven:</b> ${gegevenTekst(q)}</p>`;
  klikbaar(c, p=>{ c.bewaar({ A:p }); c.teken(); });
};
/* punten één voor één aanklikken, met "laatste punt weg" */
function plaatsReeks(c, extra){
  const { q, v } = c, ks = Object.keys(q.p), p = geplaatst(v), volgende = ks.find(k=>!p[k]); werk(c);
  c.vis.innerHTML = rooster(p, !!extra && Object.keys(p).length === ks.length, ks, true);
  c.ant.innerHTML = `<h3>Plaats de punten</h3><p class="rv-tip">Klik de punten één voor één aan op het rooster.${volgende ? ` Nu: <b>${volgende}</b>.` : ''}</p><p class="co-gegeven"><b>Te plaatsen:</b> ${gegevenTekst(q)}</p>`
    + `<button type="button" class="btn ghost co-terug"${Object.keys(p).length ? '' : ' disabled'}>↶ Laatste punt weg</button>` + (extra || '');
  klikbaar(c, xy=>{ if(!volgende) return; const w = window.RV.kopie(v); w.pts = Object.assign({}, w.pts, { [volgende]:xy }); c.bewaar(w); c.teken(); });
  c.ant.querySelector('.co-terug').onclick = ()=>{ const laatste = ks.filter(k=>p[k]).pop(); if(!laatste) return; const w = window.RV.kopie(v); delete w.pts[laatste]; c.bewaar(w); c.teken(); };
}
TYPEN.multi.teken = c=>plaatsReeks(c, '');
TYPEN.placeshape.teken = c=>{
  const v = c.v;
  plaatsReeks(c, '<h3 class="co-kies">Kies de figuur</h3><p class="rv-tip">Welke naam past het best bij de figuur die ontstaat?</p><div class="co-figuren">'
    + FIGUREN.map(f=>`<button type="button" class="keuze${v.shape === f ? ' aan' : ''}" data-figuur="${f}" aria-pressed="${v.shape === f}">${esc(f)}</button>`).join('') + '</div>');
  c.ant.querySelectorAll('[data-figuur]').forEach(b=>b.onclick = ()=>{ const w = window.RV.kopie(c.v); w.shape = b.dataset.figuur; c.bewaar(w); c.teken(); });
};

const OPG = window.OPGAVE = {
  id:'2a-rv-1-coordinaten', css:'opgave.css', delen:DELEN, begrippen:BEGRIPPEN, codes:CODES,
  verbeter(q, v, k){ const r = VERBETER[q.soort](q, v, k); return { pts:Math.round(Math.min(q.punten, r.pts) * 100) / 100, codes:[...new Set(r.codes)] }; },
  volledig(q, a){ let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){} return !!v && VOLLEDIG[q.soort](q, v); },
  toon,
  /* een volledig juist antwoord bij sleutel k (voor de tests) */
  voorbeeld(q, k){
    const c = p => ({ xs:p[0] < 0 ? '−' : '+', x:String(Math.abs(p[0])), ys:p[1] < 0 ? '−' : '+', y:String(Math.abs(p[1])) });
    const kaart = (o, f) => Object.fromEntries(Object.entries(o).map(([x, p])=>[x, f(p)]));
    return { read:()=>({ v:c(q.p.A) }), place:()=>({ A:q.p.A }), multi:()=>({ pts:q.p }), coords:()=>({ pts:kaart(q.p, c) }),
      missing:()=>({ v:c(k.answer) }), four:()=>({ c:k.answers.map(c) }), placeshape:()=>({ pts:q.p, shape:k.shape }) }[q.soort]();
  },
  invullen:opts=>window.RV.maak(OPG, TYPEN, opts)
};
})();
