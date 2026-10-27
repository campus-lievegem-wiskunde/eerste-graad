/* 2A Rekenvaardigheden 3 · Vermenigvuldigen en delen van gehele getallen (30 oefeningen, interactief met gedeeld/rv-kader.js).
   Oefeningen, volgorde en uitleg zoals het oorspronkelijke Oefening.html; verbeteren zoals code.gs: deelpunten, foutcodes en
   rode kruisjes (tekenparen die niet samen mochten). De twee patroonontdekkers zijn oefenvragen: directe feedback, tellen niet mee.
   De woorden bij wiskundetaal, de ontbrekende getallen, de piramides en de bewerkingen van de vraagstukken staan enkel
   in de versleutelde sleutel (sleutel.enc.json). De andere uitkomsten volgen uit de opgave zelf. */
(function(){
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => n < 0 ? '−' + Math.abs(n) : String(n);
const fmtN = n => n == null || isNaN(n) ? '…' : fmt(n);
const sprong = d => d > 0 ? '+' + d : d < 0 ? '−' + Math.abs(d) : '0';
const uitdr = s => esc(s).replace(/ ([+−⋅:]) /g, ' <span class="rv-op">$1</span> ');
const paren = n => n < 0 ? '(' + fmt(n) + ')' : String(n);
const ICON_PM = '⚔️', ICON_MD = '🧮';

/* ---------- oefeningen ---------- */
const E = (id, soort, punten, vraag, extra) => Object.assign({ id, type:'eigen', soort, punten, vraag }, extra);
const teller = (id, expr, gedurig) => E(id, 'teller', gedurig ? 2 : 1, gedurig ? `Bereken het gedurig product ${expr}.` : `Bereken ${expr}.`, Object.assign({ expr }, gedurig ? { gedurig:true } : {}));
const twins = (id, pairs, vraag) => E(id, 'twins', 1.5, vraag || 'Tweelingsommen: dezelfde getallen, een ander bewerkingsteken.', { pairs });
const paren3 = (id, exprs) => E(id, 'pairs', 1.5, 'Neem de tekens samen en reken uit.', { exprs });
const DELEN = [
  { titel:'Patroonontdekker', vragen:[
    E('ex01', 'pattern', 1, 'Vul de tabel verder aan. Wat zie je gebeuren?', { oefen:true, fixed:'−2', pos:'left', vals:[3, 2, 1, 0, -1, -2, -3], given:2,
      insight:'Wordt de eerste factor 1 kleiner, dan wordt de uitkomst telkens 2 groter. Zo zie je: een negatief getal maal een negatief getal is positief, bijvoorbeeld −1 ⋅ (−2) = 2.' }),
    E('ex02', 'pattern', 1, 'Vul de tabel verder aan. Wat zie je gebeuren?', { oefen:true, fixed:'−4', pos:'right', vals:[3, 2, 1, 0, -1, -2, -3], given:2,
      insight:'Wordt de tweede factor 1 kleiner, dan wordt de uitkomst telkens 4 groter. Ook hier: negatief maal negatief is positief, bijvoorbeeld −4 ⋅ (−1) = 4.' }) ] },
  { titel:'Sprongen op de getallenas', vragen:[
    E('ex03', 'jumps', 1, 'Bereken 4 ⋅ (−3) met sprongen op de getallenas.', { expr:'4 ⋅ (−3)', range:[-15, 5] }),
    E('ex04', 'jumps', 1, 'Bereken 5 ⋅ (−4) met sprongen op de getallenas.', { expr:'5 ⋅ (−4)', range:[-24, 4] }) ] },
  { titel:'Minnetjes tellen', vragen:[ teller('ex05', '−6 ⋅ (−7)'), teller('ex06', '5 ⋅ (−3)'), teller('ex07', '−4 ⋅ 8'),
    teller('ex08', '2 ⋅ 3 ⋅ (−1) ⋅ (−2)', true), teller('ex09', '−2 ⋅ 1 ⋅ 5 ⋅ (−3)', true), teller('ex10', '3 ⋅ (−1) ⋅ (−5) ⋅ 2 ⋅ 2', true),
    teller('ex11', '−3 ⋅ 2 ⋅ (−1) ⋅ 2 ⋅ (−2)', true), teller('ex12', '1 ⋅ (−3) ⋅ (−6) ⋅ 0 ⋅ (−4)', true) ] },
  { titel:'Delen en controleren', vragen:[
    E('ex13', 'divcheck', 1.5, 'Bereken en controleer met de omgekeerde bewerking.', { rows:[ { expr:'−72 : 8', divisor:'8' }, { expr:'−48 : (−4)', divisor:'(−4)' }, { expr:'63 : (−7)', divisor:'(−7)' } ] }) ] },
  { titel:'Productpiramide', vragen:[
    E('ex14', 'pyramid', 1, 'Vul de productpiramide aan.', { cells:{ b0:'−2', b1:'3', b2:'−1', m0:null, m1:null, t:null } }),
    E('ex15', 'pyramid', 1, 'Vul de productpiramide aan. Hier moet je ook delen!', { cells:{ b0:'−3', b1:null, b2:'2', m0:null, m1:'−8', t:null } }) ] },
  { titel:'Vergelijken', vragen:[
    E('ex16', 'compare', 1, 'Vul in met &lt;, &gt; of =.', { items:[['−3 ⋅ (−6)', '2 ⋅ (−9)'], ['4 ⋅ (−3)', '−24 : 2'], ['−9 ⋅ 4', '−6 ⋅ (−6)']] }),
    E('ex17', 'compare', 1, 'Vul in met &lt;, &gt; of =.', { items:[['−12 : 1', '−3 ⋅ 4'], ['−5 ⋅ (−5)', '−100 : (−4)'], ['−36 : (−9)', '−28 : 7']] }) ] },
  { titel:'Wiskundetaal', vragen:[
    E('ex18', 'labels', 1, 'Sleep de juiste woorden onder elk getal.', { rows:[['−54', ':', '(−9)', '=', '6'], ['−4', '⋅', '(−8)', '=', '32']], words:['factor', 'product', 'deeltal', 'deler', 'quotiënt', 'term', 'som', 'verschil'] }),
    E('ex19', 'missing', 1, 'Vul het ontbrekende getal in.', { rows:[ { text:'Eén factor is −8 en het product is 56. Welke is de andere factor?', op:'⋅', right:'(−8)', res:'56' },
      { text:'De deler is −6 en het quotiënt is 7. Welk getal is het deeltal?', op:':', right:'(−6)', res:'7' } ] }) ] },
  { titel:'Vraagstukken', vragen:[
    E('ex20', 'context', 1.5, 'Een duiker start aan het wateroppervlak (0 m). Elke minuut daalt hij 4 meter. Op welke diepte zit hij na 6 minuten?', { visual:'diver', unit:'m', resLabel:'Diepte na 6 minuten' }),
    E('ex21', 'context', 1.5, 'Om 18.00 uur is het 0 °C. Elk uur daalt de temperatuur 3 graden. Hoeveel graden is het om 23.00 uur?', { visual:'thermo', vis:{ start:0, lo:-20, hi:5, from:'18.00 uur', to:'23.00 uur' }, unit:'°C', resLabel:'Temperatuur om 23.00 uur' }),
    E('ex22', 'context', 1.5, 'Op het schoolrekeningoverzicht van Laurien staat: “13 warme maaltijden: −€ 65”. Met hoeveel verandert haar saldo voor 1 warme maaltijd?', { visual:'bank', unit:'€', unitBefore:true, resLabel:'Verandering per maaltijd' }) ] },
  { titel:'Tweelingsommen', vragen:[
    twins('ex23', [['−8 − 4', '−8 : (−4)'], ['−6 + (−2)', '−6 ⋅ (−2)'], ['7 − (−5)', '7 ⋅ (−5)']]),
    twins('ex24', [['−9 − 3', '−9 : (−3)'], ['−4 + 8', '−4 ⋅ 8'], ['−10 − (−2)', '−10 ⋅ (−2)']]),
    twins('ex25', [['−2 − 5 + (−1)', '−2 ⋅ (−5) ⋅ (−1)'], ['−3 + (−2) − (−4)', '−3 ⋅ (−2) ⋅ (−4)'], ['−1 − 2 − (−3) − 4', '−1 ⋅ (−2) ⋅ (−3) ⋅ (−4)']], 'Tweelingsommen met meer getallen.') ] },
  { titel:'Tekenparen', vragen:[
    paren3('ex26', ['−8 + (−4)', '−2 ⋅ (−1) ⋅ 3 ⋅ (−2) ⋅ (−1) ⋅ 5', '7 − (−5) + (−3) − 6 + (−2)']),
    paren3('ex27', ['5 − (+3) + (−4) − (−6) − 1', '−6 − 3', '−2 ⋅ (−3) ⋅ (−5)']),
    paren3('ex28', ['−24 : (−6)', '−4 − (−9) + (−2) − 3 + (+5) − (−1)', '−3 ⋅ (+4)']),
    paren3('ex29', ['−10 + 7 − (−2)', '−1 ⋅ 2 ⋅ (−3) ⋅ (−1) ⋅ (−2)', '−36 : 9']),
    paren3('ex30', ['−7 + (+2) − (−7) + (−5) − 4', '15 : (−3)', '−2 ⋅ 3 ⋅ (−1) ⋅ (−2) ⋅ (−1) ⋅ (−3)']) ] }
];
const STEMPEL = { md:`<span class="h3-stempel md">${ICON_MD} Maal en deel: tel de minnen!</span>`, oefen:'<span class="h3-stempel oefen">✅ Oefenvraag: je ziet meteen of het juist is · telt niet mee</span>' };
const UITLEG = {
  pattern:'Elke rij heeft één factor minder dan de rij erboven. Vul de uitkomsten in: het staafje groeit mee.',
  jumps:'Je start in 0. Klik op de getallenas om een sprong te maken. Maak evenveel sprongen als de eerste factor aangeeft.',
  teller:'① Tik telkens twee minnetjes aan: ze verdwijnen samen. ② Kies het teken van de uitkomst. ③ Noteer de uitkomst.',
  tellerG:'① Tik telkens twee minnetjes aan: ze verdwijnen samen. ② Kies het teken. ③ Vermenigvuldig de getallen zonder teken. ④ Noteer de uitkomst.',
  divcheck:'① Bereken. ② Controleer: doe de omgekeerde bewerking.',
  pyramid:'Elke steen is het product van de twee stenen eronder.',
  compare:'Kies telkens het juiste teken. Je mag eerst in je schrift rekenen.',
  labels:'Klik op een woord en klik daarna op het vakje waar het hoort (of sleep het woord).',
  missing:'Denk na welke bewerking je moet uitvoeren om het ontbrekende getal te vinden.',
  context:'Noteer eerst de bewerking. Vul daarna de uitkomst in.',
  twins:`Links (${ICON_PM}): tik een dubbel teken aan, zoals − en − in − (−5): ze worden samen één teken. Rechts (${ICON_MD}): tik telkens twee minnetjes aan: ze verdwijnen samen. Reken daarna beide uit.`,
  pairs:'Tik telkens twee tekens aan die je samen mag nemen. Mag het niet, dan verschijnt er een rood kruisje. Reken daarna uit.'
};
const BEGRIPPEN = {
  'gedurig product':'Een product met meer dan twee factoren, bijvoorbeeld 2 ⋅ (−3) ⋅ 5.',
  'product':'De uitkomst van een vermenigvuldiging. De getallen die je vermenigvuldigt heten factoren.',
  'factor':'Een getal dat je vermenigvuldigt. In 3 ⋅ 4 = 12 zijn 3 en 4 de factoren.',
  'quotiënt':'De uitkomst van een deling. In 12 : 3 = 4 is 4 het quotiënt.',
  'deeltal':'Het getal dat je deelt. In 12 : 3 = 4 is 12 het deeltal.',
  'deler':'Het getal waardoor je deelt. In 12 : 3 = 4 is 3 de deler.',
  'getallenas':'Een rechte lijn waarop de getallen op gelijke afstanden staan: links van 0 de negatieve getallen, rechts de positieve.',
  'productpiramide':'Een piramide van stenen waarin elke steen het product is van de twee stenen eronder.',
  'bewerking':'De berekening die je noteert, met getallen en tekens.',
  'tweelingsommen':'Twee sommen met exact dezelfde getallen, maar met een ander bewerkingsteken.'
};
const CODES = {
  MAALREGEL_BIJ_PLUSMIN:{ label:'"Min en min is plus" gebruikt bij optellen/aftrekken', uitleg:'Bij een optel- of aftreksom de tekenregel van vermenigvuldigen toegepast (bv. −8 − 4 = 12).' },
  OPTELREGEL_BIJ_MAAL:{ label:'Regel van optellen gebruikt bij maal/deel', uitleg:'Bij vermenigvuldigen of delen het teken van het getal met de grootste absolute waarde genomen (bv. −4 ⋅ 8 = 32).' },
  OPGETELD_I_P_V_MAAL:{ label:'Opgeteld in plaats van vermenigvuldigd', uitleg:'De uitkomst is die van de optelling/aftrekking in plaats van het product of quotiënt.' },
  KRUISJE_PLUSMIN:{ label:'Rode kruisjes bij optellen/aftrekken', uitleg:'Probeerde bij een optel- of aftreksom tekens samen te nemen die geen dubbel teken vormen (bv. de twee minnen in −8 − 4).' },
  KRUISJE_MAALDEEL:{ label:'Rode kruisjes bij maal/deel', uitleg:'Probeerde bij maal of deel een teken samen te nemen dat geen teken van een getal is.' },
  WOORDEN_H3:{ label:'Woorden van optellen gebruikt (term, som, verschil)', uitleg:'Bij een vermenigvuldiging of deling de woorden term, som of verschil gekozen.' },
  OPTELFOUT:{ label:'Fout bij optellen/aftrekken', uitleg:'Een andere fout bij een optel- of aftreksom (leerstof van reeks 2).' },
  TEKENREGEL:{ label:'Tekenregel fout toegepast', uitleg:'Het teken van het product of quotiënt klopt niet (aantal minnen verkeerd geteld of toegepast).' },
  TEKEN_GEKOZEN_FOUT:{ label:'Verkeerd teken gekozen in stap ②', uitleg:'In het stappenplan het verkeerde teken voor de uitkomst gekozen.' },
  MIN_MAAL_MIN:{ label:'Min maal min fout', uitleg:'In de patroontabel een negatief getal maal een negatief getal niet positief gemaakt.' },
  TOESTANDSTEKEN:{ label:'Fout toestandsteken', uitleg:'Het getal klopt, maar het teken van de uitkomst niet.' },
  NUL_FACTOR:{ label:'Factor 0 over het hoofd gezien', uitleg:'Een product met een factor 0 is altijd 0.' },
  PRODUCT_ZONDER_TEKEN:{ label:'Fout bij vermenigvuldigen zonder teken', uitleg:'In stap ③ het product van de getallen zonder teken fout berekend.' },
  DOORWERKFOUT:{ label:'Doorwerkfout', uitleg:'Een eerdere stap was fout, maar daarna is correct verder gerekend.' },
  REKENFOUT:{ label:'Rekenfout', uitleg:'Een andere fout in de uitkomst.' },
  SPRONGEN:{ label:'Sprongen fout (getallenas)', uitleg:'Niet het juiste aantal sprongen of niet de juiste sprong gemaakt.' },
  DELEN_CONTROLE:{ label:'Controle niet benut', uitleg:'De controle (omgekeerde bewerking) gaf niet het deeltal, maar de deling werd niet aangepast.' },
  OMGEKEERDE_BEWERKING:{ label:'Verkeerde bewerking bij ontbrekend getal', uitleg:'Vermenigvuldigd waar gedeeld moest worden (of omgekeerd).' },
  PIRAMIDE:{ label:'Fout in de productpiramide', uitleg:'Minstens één steen van de piramide is fout.' },
  VERGELIJKEN:{ label:'Fout bij vergelijken', uitleg:'Minstens één vergelijking (<, >, =) fout.' },
  WISKUNDETAAL:{ label:'Fout woord gekozen', uitleg:'Factor, product, deeltal, deler of quotiënt verkeerd geplaatst.' },
  BEWERKING_FOUT:{ label:'Verkeerde bewerking', uitleg:'De genoteerde bewerking past niet bij het vraagstuk.' },
  BEWERKING_ONVOLLEDIG:{ label:'Bewerking onvolledig', uitleg:'De bewerking geeft de juiste uitkomst, maar niet alle getallen uit het vraagstuk staan erin.' },
  BEWERKING_ONLEESBAAR:{ label:'Bewerking onleesbaar', uitleg:'De bewerking kon niet gelezen worden.' },
  THERMOMETER:{ label:'Thermometer fout ingesteld', uitleg:'De tweede thermometer staat niet op de juiste temperatuur.' }
};

/* ---------- rekenhulp (zoals code.gs) ---------- */
/* veilige rekenmachine: getallen, + − ⋅ (x, ×, *) : (/) en haakjes, maal en deel eerst */
function reken(str){
  const s = String(str).replace(/[−–—]/g, '-').replace(/[⋅·×xX*]/g, '*').replace(/[:\/]/g, '/').replace(/[€°cCm]/g, '').replace(/\s+/g, '');
  if(!s || !/^[\d+\-*\/()]+$/.test(s)) return null;
  let i = 0; const kijk = ()=>s[i];
  const som = ()=>{ let v = prod(); while(kijk() === '+' || kijk() === '-'){ const o = s[i++], w = prod(); v = o === '+' ? v + w : v - w; } return v; };
  const prod = ()=>{ let v = un(); while(kijk() === '*' || kijk() === '/'){ const o = s[i++], w = un(); if(o === '*') v *= w; else { if(w === 0) throw 0; v /= w; } } return v; };
  const un = ()=>{ if(kijk() === '-'){ i++; return -un(); } if(kijk() === '+'){ i++; return un(); } return at(); };
  const at = ()=>{ if(kijk() === '('){ i++; const v = som(); if(kijk() !== ')') throw 0; i++; return v; } const m = s.slice(i).match(/^\d+/); if(!m) throw 0; i += m[0].length; return +m[0]; };
  try{ const v = som(); if(i !== s.length) return null; return Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : v; }catch(e){ return null; }
}
const isMaal = e => /[⋅:*·×]/.test(e);
const factoren = e => String(e).replace(/[−–]/g, '-').split(/[⋅*:·×\/]/).map(p=>{ const t = p.replace(/[()\s+]/g, ''); return t === '' ? null : +t; }).filter(n=>n !== null && !isNaN(n));
const nat = x => { const t = String(x == null ? '' : x).trim(); return /^\d{1,6}$/.test(t) ? +t : null; };
const neg = s => s === '−' || s === '-';
/* getal met toestandsteken { s:'+'|'−'|null, n } */
const S = () => ({ s:null, n:'' });
const sval = o => { if(!o || o.s == null) return null; const n = nat(o.n); return n === null ? null : neg(o.s) ? -n : n; };
const sdone = o => sval(o) !== null;
const vgl = (a, b) => a < b ? '<' : a > b ? '>' : '=';
function codesMD(expr, r){
  const W = reken(expr), f = factoren(expr);
  if(r === W) return [];
  if(f.includes(0) && r !== 0) return ['NUL_FACTOR'];
  const somAchtig = [f.reduce((a, b)=>a + b, 0)]; if(f.length === 2) somAchtig.push(f[0] - f[1]);
  if(somAchtig.includes(r)) return ['OPGETELD_I_P_V_MAAL'];
  if(r === -W && W !== 0){
    if(f.length === 2){ const groot = Math.abs(f[0]) >= Math.abs(f[1]) ? f[0] : f[1]; if(Math.abs(f[0]) !== Math.abs(f[1]) && Math.sign(r) === Math.sign(groot)) return ['OPTELREGEL_BIJ_MAAL']; }
    return ['TEKENREGEL'];
  }
  return ['REKENFOUT'];
}
function codesPM(expr, r){
  const W = reken(expr); if(r === W) return [];
  const minnen = (String(expr).match(/[−-]/g) || []).length, regel = minnen % 2 === 0 ? 1 : -1;
  if(r === -W && W !== 0) return [Math.sign(r) === regel ? 'MAALREGEL_BIJ_PLUSMIN' : 'TOESTANDSTEKEN'];
  const g = (String(expr).match(/\d+/g) || []).map(Number);
  if(g.length && Math.abs(r) === g.reduce((a, b)=>a * b, 1) && Math.sign(r) === regel) return ['MAALREGEL_BIJ_PLUSMIN'];
  return ['OPTELFOUT'];
}
const sprongInfo = expr => { const f = factoren(expr); return { keer:f[0], stap:f[1] }; };
const patroonRij = (q, a) => q.pos === 'left' ? fmt(a) + ' ⋅ ' + (q.fixed.startsWith('−') ? '(' + q.fixed + ')' : q.fixed) : q.fixed + ' ⋅ ' + paren(a);
const vast = q => +q.fixed.replace('−', '-');

/* ---------- verbeteren: { pts, codes, kruis } ---------- */
const VERBETER = {
  pattern(q, v){
    const open = q.vals.slice(q.given), per = q.punten / open.length, codes = []; let pts = 0;
    open.forEach((a, i)=>{ const W = a * vast(q), r = sval((v.cells || [])[i]);
      if(r === W){ pts += per; return; } if(r === null) return;
      codes.push(Math.abs(r) === Math.abs(W) && W !== 0 ? (a < 0 && vast(q) < 0 ? 'MIN_MAAL_MIN' : 'TEKENREGEL') : 'REKENFOUT'); });
    return { pts, codes };
  },
  jumps(q, v){
    const { keer, stap } = sprongInfo(q.expr), W = keer * stap, s = (v.jumps || []).map(Number), codes = []; let pts = 0, vorig = 0;
    const d = s.map(e=>{ const x = e - vorig; vorig = e; return x; });
    if(s.length === keer && d.every(x=>x === stap)) pts += .5; else if(s.length) codes.push('SPRONGEN');
    const r = sval(v.res); if(r === W) pts += .5; else if(r !== null) codes.push(...codesMD(q.expr, r));
    return { pts, codes };
  },
  teller(q, v){
    const W = reken(q.expr), g = !!q.gedurig, wT = g ? .5 : .25, wA = .5, wR = g ? 1 : .75, codes = []; let pts = 0;
    const sg = v.sign === '+' ? 1 : neg(v.sign) ? -1 : 0, wil = Math.sign(W);
    if(sg !== 0 && (wil === 0 || sg === wil)) pts += wT; else if(sg !== 0) codes.push('TEKEN_GEKOZEN_FOUT');
    let abs = null; if(g){ abs = nat(v.abs); if(abs === Math.abs(W)) pts += wA; else if(abs !== null) codes.push('PRODUCT_ZONDER_TEKEN'); }
    const r = sval(v.res);
    if(r === W) pts += wR;
    else if(r !== null){
      const eigen = sg !== 0 && (!g || abs !== null) ? sg * (g ? abs : Math.abs(r)) : null;
      if(g && eigen !== null && r === eigen && (sg !== wil || abs !== Math.abs(W))) codes.push('DOORWERKFOUT'); else codes.push(...codesMD(q.expr, r));
    }
    return { pts, codes, kruis:+v.x || 0 };
  },
  divcheck(q, v){
    const codes = []; let pts = 0;
    q.rows.forEach((row, i)=>{ const W = reken(row.expr), d = reken(row.divisor), deeltal = W * d, rv = (v.rows || [])[i] || {}, qs = sval(rv.q), c = sval(rv.c);
      if(qs === W) pts += .3; else if(qs !== null){ if(c !== null && c === qs * d && c !== deeltal) codes.push('DELEN_CONTROLE'); codes.push(...codesMD(row.expr, qs)); }
      if(qs !== null && c !== null && c === qs * d) pts += .2; else if(c !== null) codes.push(qs !== null && Math.abs(c) === Math.abs(qs * d) ? 'TEKENREGEL' : 'REKENFOUT'); });
    return { pts, codes };
  },
  pyramid(q, v, k){
    if(!k || !k.key) return { pts:0, codes:[] };
    const ks = Object.keys(k.key), per = q.punten / ks.length, codes = []; let pts = 0;
    ks.forEach(x=>{ const W = k.key[x], r = sval((v.cells || {})[x]); if(r === W){ pts += per; return; } if(r === null) return; codes.push(Math.abs(r) === Math.abs(W) ? 'TEKENREGEL' : 'PIRAMIDE'); });
    return { pts, codes };
  },
  compare(q, v){
    const c = v.c || [], codes = []; let ok = 0;
    q.items.forEach((it, i)=>{ if(c[i] === vgl(reken(it[0]), reken(it[1]))) ok++; else if(c[i]) codes.push('VERGELIJKEN'); });
    return { pts:ok / q.items.length * q.punten, codes };
  },
  labels(q, v, k){
    if(!k || !k.key) return { pts:0, codes:[] };
    const s = v.slots || [], codes = []; let ok = 0;
    k.key.forEach((w, i)=>{ if(s[i] === w) ok++; else if(s[i]) codes.push(['term', 'som', 'verschil'].includes(s[i]) ? 'WOORDEN_H3' : 'WISKUNDETAAL'); });
    return { pts:ok / k.key.length * q.punten, codes };
  },
  missing(q, v, k){
    if(!k || !k.key) return { pts:0, codes:[] };
    const codes = []; let pts = 0;
    k.key.forEach((W, i)=>{ const r = sval((v.rows || [])[i]); if(r === W){ pts += q.punten / k.key.length; return; } if(r === null) return;
      codes.push(Math.abs(r) === Math.abs(k.wrongOp[i]) ? 'OMGEKEERDE_BEWERKING' : Math.abs(r) === Math.abs(W) ? 'TEKENREGEL' : 'REKENFOUT'); });
    return { pts, codes };
  },
  context(q, v, k){
    if(!k || !k.expr) return { pts:0, codes:[] };
    const W = reken(k.expr), codes = []; let pts = 0;
    const bew = String(v.bew || ''), links = bew.split('=')[0], w = reken(links);
    if(bew.trim()){
      if(w === null) codes.push('BEWERKING_ONLEESBAAR'); else if(w !== W) codes.push('BEWERKING_FOUT');
      else { const g = (links.match(/\d+/g) || []).map(Number); if(k.numbers.every(x=>g.includes(x))) pts += .5; else { pts += .25; codes.push('BEWERKING_ONVOLLEDIG'); } }
    }
    const r = sval(v.res);
    if(r === W) pts += 1; else if(r !== null){ if(w !== null && w !== W && r === w) codes.push('DOORWERKFOUT'); else codes.push(...codesMD(k.expr, r)); }
    if(q.visual === 'thermo' && v.temp != null && +v.temp !== W) codes.push('THERMOMETER');
    return { pts, codes };
  },
  twins(q, v){
    const per = q.punten / (q.pairs.length * 2), codes = []; let pts = 0, kruis = 0;
    q.pairs.forEach((p, i)=>{ const pv = (v.pairs || [])[i] || {}, ra = sval(pv.a), rb = sval(pv.b);
      if(ra === reken(p[0])) pts += per; else if(ra !== null) codes.push(...codesPM(p[0], ra));
      if(rb === reken(p[1])) pts += per; else if(rb !== null) codes.push(...codesMD(p[1], rb));
      const xl = pv.L ? +pv.L.x || 0 : 0, xr = pv.R ? +pv.R.x || 0 : 0;
      if(xl) codes.push('KRUISJE_PLUSMIN'); if(xr) codes.push('KRUISJE_MAALDEEL'); kruis += xl + xr; });
    return { pts, codes, kruis };
  },
  pairs(q, v){
    const per = q.punten / q.exprs.length, codes = []; let pts = 0, kruis = 0;
    q.exprs.forEach((e, i)=>{ const ev = (v.ex || [])[i] || {}, r = sval(ev.res), m = isMaal(e);
      if(r === reken(e)) pts += per; else if(r !== null) codes.push(...(m ? codesMD(e, r) : codesPM(e, r)));
      const x = +ev.x || 0; if(x) codes.push(m ? 'KRUISJE_MAALDEEL' : 'KRUISJE_PLUSMIN'); kruis += x; });
    return { pts, codes, kruis };
  }
};

/* ---------- volledig ingevuld? ---------- */
const bewerkingOk = s => window.RV ? window.RV.bewerking(s) : /\d.*[+\-−⋅:x*\/].*\d/.test(String(s || ''));
const VOLLEDIG = {
  pattern:(q, v)=>v.cells.every(sdone),
  jumps:(q, v)=>v.jumps.length > 0 && sdone(v.res),
  teller:(q, v)=>!!v.sign && sdone(v.res) && (!q.gedurig || nat(v.abs) != null),
  divcheck:(q, v)=>v.rows.every(r=>sdone(r.q) && sdone(r.c)),
  pyramid:(q, v)=>Object.keys(v.cells).every(k=>sdone(v.cells[k])),
  compare:(q, v)=>v.c.every(x=>!!x),
  labels:(q, v)=>v.slots.every(x=>!!x),
  missing:(q, v)=>v.rows.every(sdone),
  context:(q, v)=>(q.visual !== 'thermo' || v.temp != null) && bewerkingOk(v.bew) && sdone(v.res),
  twins:(q, v)=>v.pairs.every(p=>sdone(p.a) && sdone(p.b)),
  pairs:(q, v)=>v.ex.every(e=>sdone(e.res))
};
const P0 = () => ({ p:[], x:0 });
const LEEG = {
  pattern:q=>({ cells:q.vals.slice(q.given).map(S) }),
  jumps:()=>({ jumps:[], res:S() }),
  teller:q=>Object.assign({ p:[], x:0, sign:null, res:S() }, q.gedurig ? { abs:'' } : {}),
  divcheck:q=>({ rows:q.rows.map(()=>({ q:S(), c:S() })) }),
  pyramid:q=>{ const c = {}; Object.keys(q.cells).forEach(k=>{ if(q.cells[k] === null) c[k] = S(); }); return { cells:c }; },
  compare:q=>({ c:q.items.map(()=>null) }),
  labels:q=>({ slots:Array(q.rows.length * 3).fill(null) }),
  missing:q=>({ rows:q.rows.map(S) }),
  context:q=>Object.assign(q.visual === 'thermo' ? { temp:null } : {}, { bew:'', res:S() }),
  twins:q=>({ pairs:q.pairs.map(()=>({ L:P0(), R:P0(), a:S(), b:S() })) }),
  pairs:q=>({ ex:q.exprs.map(()=>({ p:[], x:0, res:S() })) })
};

/* ---------- figuren (ook voor het dashboard en de pdf) ---------- */
function nlGeo(q){ const lo = q.range[0], hi = q.range[1], W = 1000, ML = 38, MR = 38, AX = 150, u = (W - ML - MR) / (hi - lo); return { lo, hi, W, AX, u, X:n=>ML + (n - lo) * u }; }
function nlBoog(g, a, b, voorlopig){
  if(a == null || b == null || a === b) return '';
  const x1 = g.X(a), x2 = g.X(b), y = g.AX - 10, h = Math.min(108, 30 + Math.abs(x2 - x1) * .2);
  return `<g class="${voorlopig ? 'nl-voorlopig' : ''}"><path class="nl-boog" d="M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - 2 * h} ${x2} ${y}" marker-end="url(#h3-pijl)"/><text class="nl-booglab" x="${(x1 + x2) / 2}" y="${y - h - 10}">${sprong(b - a)}</text>`
    + (voorlopig ? `<circle class="nl-voorlopigeinde" cx="${x2}" cy="${g.AX}" r="8"/>` : '') + '</g>';
}
function sprongSVG(q, v){
  const g = nlGeo(q), X = g.X, AX = g.AX, stapLab = g.u >= 26 ? 1 : 5;
  let h = '<defs><marker id="h3-pijl" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="nl-pijlkop" d="M0,0 L10,5 L0,10 z"/></marker></defs>';
  h += `<rect x="0" y="0" width="${g.W}" height="240" fill="transparent"/><line class="nl-as" x1="${X(g.lo) - 18}" y1="${AX}" x2="${X(g.hi) + 22}" y2="${AX}"/><path class="nl-askop" d="M${X(g.hi) + 28},${AX} l-12,-7 l0,14 z"/>`;
  for(let n = g.lo; n <= g.hi; n++){ const vijf = n % 5 === 0, l = n === 0 ? 14 : vijf ? 10 : 6;
    h += `<line class="nl-streep${vijf ? ' vijf' : ''}" x1="${X(n)}" y1="${AX - l}" x2="${X(n)}" y2="${AX + l}"/>`;
    if(n % stapLab === 0 || n === 0) h += `<text class="nl-lab${n === 0 ? ' nul' : ''}" x="${X(n)}" y="${AX + 32}">${fmt(n)}</text>`; }
  let vorig = 0; h += '<g class="nl-vast">'; (v.jumps || []).forEach(e=>{ h += nlBoog(g, vorig, e, false); vorig = e; }); h += '</g><g class="nl-voor"></g>';
  h += `<circle class="nl-start" cx="${X(0)}" cy="${AX}" r="9"/>`;
  if((v.jumps || []).length){ const e = v.jumps[v.jumps.length - 1], ty = AX + 44;
    h += `<circle class="nl-einde" cx="${X(e)}" cy="${AX}" r="9"/><rect class="nl-tag" x="${X(e) - 34}" y="${ty}" width="68" height="28" rx="9"/><text class="nl-tagtxt" x="${X(e)}" y="${ty + 20}">${fmt(e)}</text>`; }
  return `<svg class="nl-svg" viewBox="0 0 ${g.W} 240" aria-label="Getallenas">${h}</svg>`;
}
function patroonSVG(q, v){
  const fx = vast(q), waarden = q.vals.map((a, i)=>i < q.given ? a * fx : sval(v.cells[i - q.given]));
  const maxAbs = Math.max(4, ...q.vals.map(a=>Math.abs(a * fx))) + 2, W = 460, H = 300, top = 20, bot = 270, nul = (top + bot) / 2, sc = (bot - top) / 2 / maxAbs;
  const bw = 40, gap = (W - 60 - q.vals.length * bw) / (q.vals.length - 1), stap = maxAbs > 10 ? 4 : 2;
  let h = '';
  for(let t = -Math.floor(maxAbs / stap) * stap; t <= maxAbs; t += stap) h += `<line x1="44" x2="${W - 8}" y1="${nul - t * sc}" y2="${nul - t * sc}" class="pt-lijn${t === 0 ? ' nul' : ''}"/><text x="38" y="${nul - t * sc + 4}" class="pt-lab">${fmt(t)}</text>`;
  q.vals.forEach((a, i)=>{ const x = 52 + i * (bw + gap), w = waarden[i];
    h += `<text x="${x + bw / 2}" y="${H - 6}" class="pt-as">${esc(q.pos === 'left' ? fmt(a) : paren(a))}</text>`;
    if(w === null){ h += `<text x="${x + bw / 2}" y="${nul - 6}" class="pt-vraag">?</text>`; return; }
    const y = w >= 0 ? nul - w * sc : nul, hh = Math.max(2, Math.abs(w) * sc), soort = w > 0 ? 'pos' : w < 0 ? 'neg' : 'nul';
    h += `<rect class="pt-staaf ${soort}${i < q.given ? ' gegeven' : ''}" x="${x}" y="${y}" width="${bw}" height="${hh}" rx="5"/><text x="${x + bw / 2}" y="${w >= 0 ? y - 6 : y + hh + 15}" class="pt-w">${fmt(w)}</text>`; });
  return `<svg class="vis-svg pt-svg" viewBox="0 0 ${W} ${H}" aria-label="Staafdiagram van de uitkomsten">${h}</svg>`;
}
const TH = { top:48, bot:318 };
const thY = (q, t) => TH.bot - (t - q.vis.lo) * (TH.bot - TH.top) / (q.vis.hi - q.vis.lo);
function thSchaal(q, cx){
  let h = `<rect class="th-buis" x="${cx - 13}" y="${TH.top - 14}" width="26" height="${TH.bot - TH.top + 30}" rx="13"/>`;
  for(let t = q.vis.lo; t <= q.vis.hi; t++){ const vijf = t % 5 === 0, Y = thY(q, t);
    h += `<line class="th-streep" x1="${cx + 16}" y1="${Y}" x2="${cx + 16 + (vijf ? 13 : 6)}" y2="${Y}"/>`;
    if(vijf) h += `<text class="th-lab${t === 0 ? ' nul' : ''}" x="${cx + 34}" y="${Y + 4}">${fmt(t)}°</text>`; }
  return h;
}
const thKwik = (q, cx, t) => { const Y = thY(q, t); return `<rect class="th-kwik" x="${cx - 6}" y="${Y}" width="12" height="${TH.bot + 14 - Y}" rx="6"/><circle class="th-bol" cx="${cx}" cy="${TH.bot + 30}" r="22"/>`; };
const thLabel = (q, cx, t, links) => { const Y = thY(q, t), x = links ? cx - 86 : cx + 72; return `<rect class="th-tag" x="${x}" y="${Y - 14}" width="62" height="28" rx="8"/><text class="th-tagtxt" x="${x + 31}" y="${Y + 5}">${fmt(t)} °C</text>`; };
function thDyn(q, doel, voorlopig){
  const cx = 330, s = q.vis.start, t = doel == null ? s : doel;
  let h = thKwik(q, cx, t) + `<line class="th-startlijn" x1="${cx - 78}" y1="${thY(q, s)}" x2="${cx + 14}" y2="${thY(q, s)}"/><text class="th-starttxt" x="${cx - 20}" y="${thY(q, s) - 6}">start</text>`;
  if(doel != null && doel !== s){ const op = doel > s, x = cx - 70, y1 = thY(q, s), y2 = thY(q, doel), punt = op ? y2 + 2 : y2 - 2;
    h += `<line class="th-pijl${voorlopig ? ' voorlopig' : ''}" x1="${x}" y1="${y1}" x2="${x}" y2="${op ? y2 + 10 : y2 - 10}"/><path class="th-pijlkop" d="M${x - 8},${op ? y2 + 12 : y2 - 12} L${x},${punt} L${x + 8},${op ? y2 + 12 : y2 - 12} z"/>`;
    h += `<text class="th-sprong" x="${x - 10}" y="${(y1 + y2) / 2 + 6}">${sprong(doel - s)}</text>`; }
  if(doel != null && !voorlopig) h += thLabel(q, cx, doel, false);
  return h;
}
function thermoSVG(q, v, interactief){
  let h = `<text class="vt-titel" x="140" y="26">🌆 ${esc(q.vis.from)}</text>` + thSchaal(q, 140) + thKwik(q, 140, q.vis.start) + thLabel(q, 140, q.vis.start, true);
  h += `<text class="vt-titel" x="330" y="26">🌙 ${esc(q.vis.to)}</text>` + thSchaal(q, 330) + `<g class="th-dyn">${thDyn(q, v.temp, false)}</g>`;
  if(interactief) h += `<rect class="th-raak" x="230" y="${TH.top - 20}" width="150" height="${TH.bot - TH.top + 80}"/>`;
  return `<svg class="vis-svg th-svg" viewBox="0 0 480 380" aria-label="Twee thermometers">${h}</svg>`;
}
function duikerSVG(){
  const top = 40, sc = 9, Y = d => top + d * sc;
  let h = `<defs><marker id="h3-dv" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#173436"/></marker></defs>`;
  h += `<rect x="0" y="0" width="460" height="${top}" fill="#eef9f9"/><rect x="0" y="${top}" width="460" height="${30 * sc + 20}" fill="#d6f0f1"/>`;
  h += `<path d="M0 ${top} q 20 -8 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0" stroke="#3bc1c5" stroke-width="3" fill="none"/>`;
  for(let d = 0; d <= 30; d += 2){ h += `<line x1="60" x2="${d % 10 === 0 ? 78 : 70}" y1="${Y(d)}" y2="${Y(d)}" stroke="#35545a" stroke-width="${d % 10 === 0 ? 2 : 1}"/>`;
    if(d % 4 === 0 || d === 30) h += `<text x="54" y="${Y(d) + 4}" text-anchor="end" font-size="12" font-weight="${d === 0 ? 900 : 600}" fill="#35545a">${fmt(-d)} m</text>`; }
  h += `<line x1="64" x2="64" y1="${top}" y2="${Y(30)}" stroke="#35545a" stroke-width="2"/><text x="150" y="${top - 10}" font-size="28">🤿</text>`;
  for(let m = 1; m <= 3; m++) h += `<line x1="200" x2="200" y1="${Y((m - 1) * 4 + 1)}" y2="${Y(m * 4 - 1)}" stroke="#173436" stroke-width="3" marker-end="url(#h3-dv)"/><text x="210" y="${Y(m * 4 - 2) + 4}" font-size="13" font-weight="800" fill="#173436">minuut ${m}: −4 m</text>`;
  h += `<text x="210" y="${Y(14)}" font-size="18" font-weight="900" fill="#4f6668">⋮</text><text x="200" y="${Y(20)}" font-size="14" font-weight="800" fill="#173436">na 6 minuten: ?</text>`;
  return `<svg class="vis-svg" viewBox="0 0 460 ${Y(30) + 20}" aria-label="Duiker en dieptemeter">${h}</svg>`;
}
const bankHTML = () => '<div class="bank"><div class="bank-top">🏫 Schoolrekening Laurien · september</div><div class="bank-lijst" style="margin-top:.8rem"><div>🍽️ 13 warme maaltijden<span>−€ 65</span></div></div><div class="bank-nieuw">1 warme maaltijd: <b>?</b></div></div>';
const machine = (paren, over, vers) => {
  let h = ''; for(let i = 0; i < paren; i++) h += `<span class="h3-paar${vers && i === paren - 1 ? ' vers' : ''}"><i class="h3-tegel">−</i><i class="h3-tegel">−</i><b>→</b><i class="h3-tegel plus">+</i></span>`;
  for(let i = 0; i < over; i++) h += '<span class="h3-paar solo"><i class="h3-tegel">−</i></span>';
  return `<div class="h3-machine"><div class="h3-mkop">${ICON_MD} Tekenmachine <span>paren: <b>${paren}</b> · minnetjes over: <b>${over}</b></span></div><div class="h3-mlijf">${paren + over ? h : '<span class="h3-mleeg">Geen minnetjes.</span>'}</div></div>`;
};

/* ---------- lezen: dashboard, pdf, resultaat van de leerling ---------- */
function toon(q, a, modus, k){
  let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){}
  const blanco = modus === 'blanco', sl = modus === 'sleutel', T = window.RV && window.RV.tekens;
  if(modus === 'lezen' && !v) return '<p class="tl-niet">Niet ingevuld.</p>';
  if(!v || blanco || sl) v = LEEG[q.soort](q);
  const lijn = (l, r) => `<div class="tl"><span class="tl-l">${l}</span><span class="tl-r">${r}</span></div>`;
  const leeg = '<span class="tl-leeg">……</span>';
  const g = (o, W) => sl ? (W == null ? leeg : esc(fmt(W))) : blanco ? leeg : sval(o) === null ? (o && (o.n !== '' || o.s) ? esc((neg(o.s) ? '−' : '') + (o.n || '…')) : leeg) : esc(fmt(sval(o)));
  const kr = x => !sl && !blanco && x ? ` <span class="tl-kruis">✕ ${x}</span>` : '';
  /* de uitdrukking zoals de leerling ze herschreef met de tekenparen */
  const herschreven = (expr, st, maal) => T && st && st.p && st.p.length && !sl && !blanco ? T.html(expr, st, null, { maal }) : uitdr(expr);
  switch(q.soort){
    case 'pattern':
      return '<div class="rv-lees">' + q.vals.map((x, i)=>lijn(uitdr(patroonRij(q, x)) + ' =', i < q.given ? esc(fmt(x * vast(q))) : g(v.cells[i - q.given], x * vast(q)))).join('') + '</div>';
    case 'jumps': {
      const { keer, stap } = sprongInfo(q.expr), s = sl ? { jumps:Array.from({ length:keer }, (_, i)=>(i + 1) * stap) } : v;
      return `<div class="rv-lees">${sprongSVG(q, s)}${lijn(uitdr(q.expr) + ' =', g(v.res, keer * stap))}</div>`;
    }
    case 'teller': {
      const W = reken(q.expr), abs = q.expr.replace(/[−()]/g, '').replace(/\s+/g, ' ').trim();
      return '<div class="rv-lees">' + lijn('Minnetjes:', herschreven(q.expr, v, true) + (sl || blanco ? '' : ` · paren: ${(v.p || []).length}`) + kr(v.x))
        + lijn('Teken:', sl ? (W < 0 ? '−' : '+') : blanco || !v.sign ? leeg : esc(v.sign))
        + (q.gedurig ? lijn(esc(abs) + ' =', sl ? esc(Math.abs(W)) : blanco || v.abs === '' ? leeg : esc(v.abs)) : '')
        + lijn(uitdr(q.expr) + ' =', g(v.res, W)) + '</div>';
    }
    case 'divcheck':
      return '<div class="rv-lees">' + q.rows.map((r, i)=>{ const W = reken(r.expr), qs = sl ? W : sval(v.rows[i].q);
        return lijn(uitdr(r.expr) + ' =', g(v.rows[i].q, W) + ` &nbsp; controle: ${qs === null ? '…' : esc(paren(qs))} ⋅ ${esc(r.divisor)} = ${g(v.rows[i].c, sl ? W * reken(r.divisor) : null)}`); }).join('') + '</div>';
    case 'pyramid': {
      const steen = x => q.cells[x] !== null ? `<span class="tl-steen gegeven">${esc(q.cells[x])}</span>` : `<span class="tl-steen">${g(v.cells[x], k && k.key ? k.key[x] : null)}</span>`;
      return `<div class="rv-lees tl-pyr"><div>${steen('t')}</div><div>${steen('m0')}${steen('m1')}</div><div>${steen('b0')}${steen('b1')}${steen('b2')}</div></div>`;
    }
    case 'compare':
      return '<div class="rv-lees">' + q.items.map((it, i)=>{ const kz = sl ? vgl(reken(it[0]), reken(it[1])) : blanco ? null : v.c[i];
        return lijn(`${'abc'[i]})`, `${uitdr(it[0])} <span class="tl-vak">${kz ? esc(kz) : '&nbsp;'}</span> ${uitdr(it[1])}`); }).join('') + '</div>';
    case 'labels':
      return '<div class="rv-lees">' + q.rows.map((row, r)=>lijn('', row.map((tok, c)=>c % 2 ? esc(tok) : `${esc(tok)} <span class="tl-woord">${(sl ? k && k.key && k.key[r * 3 + c / 2] : blanco ? null : v.slots[r * 3 + c / 2]) || '……'}</span>`).join(' '))).join('') + '</div>';
    case 'missing':
      return '<div class="rv-lees">' + q.rows.map((r, i)=>lijn(`${'ab'[i]})`, `${esc(r.text)}<br>${g(v.rows[i], k && k.key ? k.key[i] : null)} ${esc(r.op)} ${esc(r.right)} = ${esc(r.res)}`)).join('') + '</div>';
    case 'context': {
      const W = k && k.expr ? reken(k.expr) : null, fig = q.visual === 'thermo' ? thermoSVG(q, sl ? { temp:W } : v, false) : q.visual === 'diver' ? duikerSVG() : bankHTML();
      const eenh = x => q.unitBefore ? `${esc(q.unit)} ${x}` : q.unit ? `${x} ${esc(q.unit)}` : x;
      return `<div class="rv-lees rv-lees-fig"><div class="tl-fig">${fig}</div><div>`
        + (q.visual === 'thermo' && !sl && !blanco ? lijn('Thermometer:', v.temp == null ? leeg : esc(fmt(v.temp)) + ' °C') : '')
        + lijn('Bewerking:', sl ? (k && k.expr ? uitdr(k.expr) : leeg) : blanco || !v.bew ? leeg : esc(v.bew)) + lijn(esc(q.resLabel) + ':', eenh(g(v.res, W))) + '</div></div>';
    }
    case 'twins':
      return '<div class="rv-lees">' + q.pairs.map((p, i)=>{ const pv = v.pairs[i];
        return lijn(`${ICON_PM}`, `${herschreven(p[0], pv.L, false)} = ${g(pv.a, reken(p[0]))}${kr(pv.L.x)}`) + lijn(`${ICON_MD}`, `${herschreven(p[1], pv.R, true)} = ${g(pv.b, reken(p[1]))}${kr(pv.R.x)}`); }).join('') + '</div>';
    case 'pairs':
      return '<div class="rv-lees">' + q.exprs.map((e, i)=>lijn(`${'abc'[i]})`, `${herschreven(e, v.ex[i], isMaal(e))} = ${g(v.ex[i].res, reken(e))}${kr(v.ex[i].x)}`)).join('') + '</div>';
  }
  return '';
}

/* ---------- invullen: de interactieve oefeningen ---------- */
const TYPEN = {};
Object.keys(LEEG).forEach(s=>{ TYPEN[s] = { leeg:LEEG[s], volledig:VOLLEDIG[s], uitleg:()=>UITLEG[s] }; });
TYPEN.pattern.uitleg = ()=>STEMPEL.oefen + ' ' + UITLEG.pattern;
TYPEN.teller.uitleg = q=>STEMPEL.md + ' ' + (q.gedurig ? UITLEG.tellerG : UITLEG.teller);
TYPEN.pyramid.uitleg = ()=>STEMPEL.md + ' ' + UITLEG.pyramid;
/* getal met toestandsteken: tekenvak (+ boven, − onder) en het getal zonder teken; vooraan verdwijnt een gekozen + */
const veld = (pad, o, cls = '', label = 'uitkomst') => `<span class="rv-term">${window.RV.teken(pad + '.s', o.s, 'toestandsteken van de ' + label, true)}${window.RV.getal(pad + '.n', o.n, 'nat', cls, label)}</span>`;
const TIP = () => window.RV.tekenTip;
const stapel = c => c.root.querySelector('.rv-werk').classList.add('stapel');

TYPEN.pattern.teken = c=>{
  const { q, v } = c;
  c.vis.innerHTML = patroonSVG(q, v) + `<div class="rv-legende"><span>${q.pos === 'left' ? 'eerste factor' : 'tweede factor'} onder elk staafje</span><span><i class="lg-dot h3-pos"></i>positief</span><span><i class="lg-dot h3-neg"></i>negatief</span></div><div class="h3-fb" aria-live="polite"></div>`;
  c.ant.innerHTML = '<h3>Vul de tabel aan</h3><table class="h3-ptabel">' + q.vals.map((a, i)=>`<tr><td class="rv-wisk">${uitdr(patroonRij(q, a))}</td><td class="rv-wisk">=</td><td>${i < q.given ? `<span class="rv-wisk">${esc(fmt(a * vast(q)))}</span>` : veld('cells.' + (i - q.given), v.cells[i - q.given])}</td><td class="h3-merk"${i < q.given ? '' : ` data-merk="${i - q.given}"`}></td></tr>`).join('')
    + '</table>';
  let t = null;
  const fb = ()=>feedback(c, c.huidig());
  c.ant.oninput = ()=>{ c.vis.querySelector('svg').outerHTML = patroonSVG(q, c.huidig()); clearTimeout(t); t = setTimeout(fb, 600); };
  fb();
};
/* directe feedback, enkel bij de oefenvragen (tellen niet mee): de juiste uitkomsten mogen hier berekend worden */
function feedback(c, v){
  const q = c.q; if(!c.nogHier()) return;
  const open = q.vals.slice(q.given), fx = vast(q);
  const st = open.map((a, i)=>{ const r = sval(v.cells[i]), W = a * fx; return r === null ? null : r === W ? 'ok' : Math.abs(r) === Math.abs(W) ? 'teken' : 'fout'; });
  st.forEach((s, i)=>{ const m = c.ant.querySelector(`[data-merk="${i}"]`), inp = c.ant.querySelector(`[data-pad="cells.${i}.n"]`);
    if(m){ m.className = 'h3-merk' + (s === null ? '' : s === 'ok' ? ' ok' : ' fout'); m.textContent = s === null ? '' : s === 'ok' ? '✓' : '✗'; }
    if(inp){ inp.classList.toggle('h3-ok', s === 'ok'); inp.classList.toggle('h3-fout', s !== null && s !== 'ok'); } });
  const box = c.vis.querySelector('.h3-fb'), ingevuld = st.filter(s=>s !== null).length, fout = st.findIndex(s=>s !== null && s !== 'ok'), n = st.filter(s=>s !== null && s !== 'ok').length;
  let cls = '', h = '';
  if(fout >= 0){ const rij = uitdr(patroonRij(q, open[fout])); cls = 'nog';
    h = (st[fout] === 'teken' ? `🤔 <b>Bijna!</b> Bij <span class="rv-wisk">${rij}</span> klopt het getal, maar het teken nog niet.` : `🤔 <b>Nog niet juist</b> bij <span class="rv-wisk">${rij}</span>.`)
      + ` Kijk naar het patroon: wordt de ${q.pos === 'left' ? 'eerste' : 'tweede'} factor 1 kleiner, dan wordt de uitkomst telkens <b>${Math.abs(fx)} groter</b>.` + (n > 1 ? `<br>Er ${n === 2 ? 'is nog 1 andere rij' : 'zijn nog ' + (n - 1) + ' andere rijen'} niet juist.` : ''); }
  else if(ingevuld === open.length){ cls = 'ok'; h = '🎉 <b>Alles juist!</b> ' + esc(q.insight); }
  else if(ingevuld > 0){ cls = 'ok'; h = '👍 <b>Goed zo!</b> Wat je al invulde, is juist. Ga zo verder.'; }
  box.className = 'h3-fb' + (cls ? ' ' + cls : ''); box.innerHTML = h;
}

TYPEN.jumps.teken = c=>{
  const { q, v } = c; stapel(c);
  c.vis.innerHTML = sprongSVG(q, v) + '<div class="rv-legende"><span><i class="lg-dot vol"></i>start in 0</span><span>de pijl toont je sprong: + naar rechts, − naar links</span></div>';
  c.ant.innerHTML = `<div class="nl-paneel"><div><h3>Maak je sprongen</h3><p class="rv-tip">Beweeg over de getallenas: de pijl toont hoe groot je volgende sprong is. Klik om de sprong te maken.</p>
    <div class="rv-rij"><span class="th-paneel">Aantal sprongen: <span class="val">${v.jumps.length}</span></span><button type="button" class="btn ghost h3-terug"${v.jumps.length ? '' : ' disabled'}>↶ Laatste sprong weg</button></div></div>
    <div><h3>Noteer de uitkomst</h3><div class="rv-rij"><span class="rv-wisk">${uitdr(q.expr)} =</span>${veld('res', v.res)}</div>${TIP()}</div></div>`;
  const svg = c.vis.querySelector('svg'), voor = svg.querySelector('.nl-voor'), g = nlGeo(q), van = () => v.jumps.length ? v.jumps[v.jumps.length - 1] : 0;
  const getalBij = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const x = p.matrixTransform(svg.getScreenCTM().inverse()).x; return Math.max(g.lo, Math.min(g.hi, Math.round((x - g.X(g.lo)) / g.u + g.lo))); };
  let laatst = null;
  svg.onpointermove = ev=>{ const n = getalBij(ev); if(n === laatst) return; laatst = n; voor.innerHTML = nlBoog(g, van(), n, true); };
  svg.onpointerleave = ()=>{ voor.innerHTML = ''; laatst = null; };
  svg.onpointerdown = ev=>{ const n = getalBij(ev); if(n === van() || v.jumps.length >= 12) return; const w = window.RV.kopie(c.huidig()); w.jumps.push(n); c.bewaar(w); c.teken(); };
  c.ant.querySelector('.h3-terug').onclick = ()=>{ const w = window.RV.kopie(c.huidig()); w.jumps.pop(); c.bewaar(w); c.teken(); };
};

TYPEN.teller.teken = c=>{
  const { q, v, ui } = c, T = window.RV.tekens, over = T.minnen(q.expr, v.p, true);
  c.vis.innerHTML = `<div class="h3-groot">${T.html(q.expr, v, 'main', { ui, maal:true, kaders:'alle' })}</div><p class="rv-tip h3-midden">Tik een minnetje aan en daarna een tweede: samen verdwijnen ze.</p>` + machine(v.p.length, over, ui.tvers);
  let n = 1; const cirkel = () => '①②③④'[n++];
  const abs = q.expr.replace(/[−()]/g, '').replace(/\s+/g, ' ').trim();
  c.ant.innerHTML = `<h3>${cirkel()} Welk teken krijgt de uitkomst?</h3><div class="rv-rij">` + ['+', '−'].map(s=>`<button type="button" class="vglknop${v.sign === s ? ' aan' : ''}" data-tsign="${s}" aria-pressed="${v.sign === s}">${s}</button>`).join('') + '</div>'
    + (q.gedurig ? `<h3>${cirkel()} Vermenigvuldig de getallen zonder teken</h3><div class="rv-rij"><span class="rv-wisk">${uitdr(abs)} =</span>${window.RV.getal('abs', v.abs, 'nat', 'breed', 'product zonder teken')}</div>` : '')
    + `<h3>${cirkel()} Noteer de uitkomst</h3><div class="rv-rij"><span class="rv-wisk">${uitdr(q.expr)} =</span>${veld('res', v.res)}</div>${TIP()}`;
  T.bind(c, w=>({ st:w, expr:q.expr, maal:true }));
  c.ant.querySelectorAll('[data-tsign]').forEach(b=>b.onclick = ()=>{ const w = window.RV.kopie(c.huidig()); w.sign = b.dataset.tsign; c.bewaar(w); c.teken(); });
};

TYPEN.divcheck.teken = c=>{
  const { q, v } = c; stapel(c);
  c.vis.innerHTML = `<div class="h3-regel"><span class="h3-rtitel">Delen is het omgekeerde van vermenigvuldigen:</span><span class="h3-rvb"><span>${uitdr('12 : 3 = 4')}</span><i>want</i><span>${uitdr('4 ⋅ 3 = 12')}</span></span><span class="h3-rvb"><span>${uitdr('−12 : 3 = −4')}</span><i>want</i><span>${uitdr('−4 ⋅ 3 = −12')}</span></span></div>`;
  const kopie = (w, i) => { const x = sval(w.rows[i].q); return x === null ? '…' : esc(paren(x)); };
  c.ant.innerHTML = '<table class="h3-dtabel"><thead><tr><th>① Bereken</th><th>② Controleer: doe de omgekeerde bewerking</th></tr></thead><tbody>'
    + q.rows.map((r, i)=>`<tr><td><span class="rv-wisk">${uitdr(r.expr)} =</span> ${veld(`rows.${i}.q`, v.rows[i].q, '', 'quotiënt')}</td><td><span class="rv-wisk"><span class="h3-kopie" data-kopie="${i}">${kopie(v, i)}</span> <span class="rv-op">⋅</span> ${esc(r.divisor)} =</span> ${veld(`rows.${i}.c`, v.rows[i].c, '', 'controle')}</td></tr>`).join('')
    + '</tbody></table>' + TIP();
  c.ant.oninput = ()=>{ const w = c.huidig(); c.ant.querySelectorAll('[data-kopie]').forEach(e=>{ e.innerHTML = kopie(w, +e.dataset.kopie); }); };
};

TYPEN.pyramid.teken = c=>{
  const { q, v } = c; stapel(c);
  const steen = k => q.cells[k] === null ? `<div class="h3-steen open">${veld('cells.' + k, v.cells[k], 'smal', 'steen')}</div>` : `<div class="h3-steen"><span class="rv-wisk">${esc(q.cells[k])}</span></div>`;
  c.vis.innerHTML = `<div class="h3-pyr"><div>${steen('t')}</div><div>${steen('m0')}${steen('m1')}</div><div>${steen('b0')}${steen('b1')}${steen('b2')}</div></div>`;
  c.ant.innerHTML = '<p class="rv-tip h3-midden">Elke steen = de steen links eronder <b>⋅</b> de steen rechts eronder.</p>' + TIP();
};

TYPEN.compare.teken = c=>{
  const { q, v } = c; stapel(c);
  c.ant.innerHTML = q.items.map((it, i)=>`<div class="vglrij"><div class="l"><span class="vglletter">${'abc'[i]})</span>${uitdr(it[0])}</div><div class="vglknoppen">`
    + ['<', '>', '='].map(s=>`<button type="button" class="vglknop${v.c[i] === s ? ' aan' : ''}" data-vgl="${i}" data-s="${esc(s)}" aria-pressed="${v.c[i] === s}">${esc(s)}</button>`).join('') + `</div><div class="r">${uitdr(it[1])}</div></div>`).join('');
  c.ant.querySelectorAll('[data-vgl]').forEach(b=>b.onclick = ()=>{ const w = window.RV.kopie(c.huidig()); w.c[+b.dataset.vgl] = b.dataset.s; c.bewaar(w); c.teken(); });
};

TYPEN.labels.teken = c=>{
  const { q, v, ui } = c;
  c.vis.innerHTML = q.rows.map((row, r)=>'<div class="h3-lrij">' + row.map((tok, k)=>{ const getal = k % 2 === 0, si = r * 3 + k / 2;
    return `<div class="h3-lkol"><div class="h3-ltok rv-wisk">${esc(tok)}</div>${getal ? `<button type="button" class="h3-slot${v.slots[si] ? ' vol' : ''}" data-slot="${si}">${v.slots[si] ? esc(v.slots[si]) : '…'}</button>` : ''}</div>`; }).join('') + '</div>').join('');
  c.ant.innerHTML = '<h3>Woorden</h3><p class="rv-tip">Klik op een woord en daarna op een vakje. Een woord mag je meer dan één keer gebruiken. Klik op een ingevuld vakje om het leeg te maken.</p><div class="h3-woorden">'
    + q.words.map(w=>`<button type="button" class="h3-woord${ui.woord === w ? ' aan' : ''}" draggable="true" data-woord="${esc(w)}" aria-pressed="${ui.woord === w}">${esc(w)}</button>`).join('') + '</div>';
  c.ant.querySelectorAll('[data-woord]').forEach(b=>{ b.onclick = ()=>{ ui.woord = ui.woord === b.dataset.woord ? null : b.dataset.woord; c.teken(); }; b.ondragstart = e=>e.dataTransfer.setData('text/plain', b.dataset.woord); });
  const plaats = (si, w)=>{ const x = window.RV.kopie(c.huidig()); x.slots[si] = w; c.bewaar(x); c.teken(); };
  c.vis.querySelectorAll('[data-slot]').forEach(s=>{ const si = +s.dataset.slot;
    s.onclick = ()=>{ if(ui.woord) plaats(si, ui.woord); else if(c.huidig().slots[si]) plaats(si, null); };
    s.ondragover = e=>{ e.preventDefault(); s.classList.add('over'); }; s.ondragleave = ()=>s.classList.remove('over');
    s.ondrop = e=>{ e.preventDefault(); const w = e.dataTransfer.getData('text/plain'); if(w) plaats(si, w); }; });
};

TYPEN.missing.teken = c=>{
  const { q, v } = c; stapel(c);
  c.ant.innerHTML = q.rows.map((r, i)=>`<div class="h3-mrij"><p>${'ab'[i]}) ${esc(r.text)}</p><div class="rv-rij">${veld('rows.' + i, v.rows[i], '', 'ontbrekend getal')}<span class="rv-wisk"><span class="rv-op">${esc(r.op)}</span> ${esc(r.right)} = ${esc(r.res)}</span></div></div>`).join('') + TIP();
};

TYPEN.context.teken = c=>{
  const { q, v, ui } = c, RV = window.RV, thermo = q.visual === 'thermo';
  c.vis.innerHTML = thermo ? thermoSVG(q, v, true) + '<div class="rv-legende"><span>Beweeg over de rechtse thermometer en klik of sleep om de temperatuur in te stellen.</span></div>' : q.visual === 'diver' ? duikerSVG() : bankHTML();
  const voor = q.unitBefore ? `<span class="eenheid">${esc(q.unit)}</span>` : '', na = !q.unitBefore && q.unit ? `<span class="eenheid">${esc(q.unit)}</span>` : '';
  let nr = 0; const cirkel = () => '①②③'[nr++];
  c.ant.innerHTML = (thermo ? `<h3>${cirkel()} Stel de thermometer in</h3><p class="rv-tip">Stel de rechtse thermometer in op de temperatuur om ${esc(q.vis.to)}.</p><div class="th-paneel">Verandering: <span class="val">${v.temp == null ? '…' : sprong(v.temp - q.vis.start)}</span></div>` : '')
    + `<h3>${cirkel()} Bewerking</h3><p class="rv-tip">Schrijf de berekening met de getallen uit het vraagstuk. Gebruik ⋅ (of x) voor maal en : voor delen.</p>${RV.bewerkingVak('bew', v.bew)}
    <h3>${cirkel()} Antwoord</h3><div class="rv-rij"><span class="rv-lbl">${esc(q.resLabel)}:</span>${voor}${veld('res', v.res, 'breed')}${na}</div>${TIP()}`;
  if(!thermo) return;
  const svg = c.vis.querySelector('svg'), raak = svg.querySelector('.th-raak'), dyn = svg.querySelector('.th-dyn');
  const tempBij = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const y = p.matrixTransform(svg.getScreenCTM().inverse()).y; return Math.max(q.vis.lo, Math.min(q.vis.hi, Math.round(q.vis.lo + (TH.bot - y) * (q.vis.hi - q.vis.lo) / (TH.bot - TH.top)))); };
  let laatst = null;
  const zet = t => { const w = RV.kopie(c.huidig()); w.temp = t; c.bewaar(w); };
  raak.onpointermove = ev=>{ const t = tempBij(ev); if(t === laatst) return; laatst = t; if(ui.thSleep){ zet(t); dyn.innerHTML = thDyn(q, t, false); } else dyn.innerHTML = thDyn(q, t, true); };
  raak.onpointerdown = ev=>{ ui.thSleep = true; try{ raak.setPointerCapture(ev.pointerId); }catch(e){} const t = tempBij(ev); laatst = t; zet(t); dyn.innerHTML = thDyn(q, t, false); };
  const stop = ()=>{ if(ui.thSleep){ ui.thSleep = false; c.teken(); } };
  raak.onpointerup = stop; raak.onpointercancel = stop;
  raak.onpointerleave = ()=>{ if(!ui.thSleep){ laatst = null; dyn.innerHTML = thDyn(q, c.huidig().temp, false); } };
};

TYPEN.twins.teken = c=>{
  const { q, v, ui } = c, T = window.RV.tekens; stapel(c);
  c.vis.innerHTML = `<div class="h3-banier"><span class="h3-stempel pm">${ICON_PM} Plus en min: neem een dubbel teken samen</span><span class="h3-stempel md">${ICON_MD} Maal en deel: tel de minnen!</span></div>`;
  c.ant.innerHTML = q.pairs.map((p, i)=>{ const pv = v.pairs[i];
    return `<div class="h3-tweeling"><div class="h3-tw pm"><div class="h3-twkop">${ICON_PM} optellen / aftrekken</div><div class="rv-rij"><span class="rv-wisk">${T.html(p[0], pv.L, i + 'L', { ui, kaders:'hint' })} =</span>${veld(`pairs.${i}.a`, pv.a)}</div></div>`
      + `<div class="h3-tw md"><div class="h3-twkop">${ICON_MD} maal / deel <span>minnetjes over: <b>${T.minnen(p[1], pv.R.p, true)}</b></span></div><div class="rv-rij"><span class="rv-wisk">${T.html(p[1], pv.R, i + 'R', { ui, maal:true, kaders:'hint' })} =</span>${veld(`pairs.${i}.b`, pv.b)}</div></div>`
      + (ui.twfb && ui.twfb.i === i && ui.twfb.tot > Date.now() ? `<div class="h3-twfb toon" data-fb="${i}">${ui.twfb.html}</div>` : `<div class="h3-twfb" data-fb="${i}"></div>`) + '</div>'; }).join('') + TIP();
  T.bind(c, (w, key)=>{ const i = parseInt(key, 10), L = key.slice(-1) === 'L'; return { st:L ? w.pairs[i].L : w.pairs[i].R, expr:q.pairs[i][L ? 0 : 1], maal:!L }; }, key=>{
    const i = parseInt(key, 10), fb = c.ant.querySelector(`[data-fb="${i}"]`); if(!fb) return;
    /* de melding blijft even staan, ook na het opnieuw tekenen */
    ui.twfb = { i, tot:Date.now() + 3500, html:key.slice(-1) === 'L' ? `✋ <b>Stop!</b> Bij optellen en aftrekken (${ICON_PM}) mag je enkel een <b>dubbel teken</b> samennemen, zoals − (−5) of + (−2).` : `✋ <b>Stop!</b> Bij maal en deel (${ICON_MD}) neem je telkens <b>twee minnetjes</b> samen.` };
    fb.innerHTML = ui.twfb.html; fb.classList.add('toon');
    setTimeout(()=>{ const e = c.nogHier() && c.ant.querySelector(`[data-fb="${i}"]`); if(e && ui.twfb && ui.twfb.tot <= Date.now()) e.classList.remove('toon'); }, 3600); });
};

TYPEN.pairs.teken = c=>{
  const { q, v, ui } = c, T = window.RV.tekens; stapel(c);
  c.ant.innerHTML = q.exprs.map((e, i)=>`<div class="h3-prij"><span class="vglletter">${'abc'[i]})</span><span class="rv-wisk h3-pexpr">${T.html(e, v.ex[i], String(i), { ui, maal:isMaal(e), kaders:'geen' })}</span><span class="rv-wisk">=</span>${veld(`ex.${i}.res`, v.ex[i].res)}</div>`).join('') + TIP();
  T.bind(c, (w, key)=>({ st:w.ex[+key], expr:q.exprs[+key], maal:isMaal(q.exprs[+key]) }));
};

const OPG = window.OPGAVE = {
  id:'2a-rv-3-gehele-vermenigvuldigen', css:'opgave.css', delen:DELEN, begrippen:BEGRIPPEN, codes:CODES,
  verbeter(q, v, k){ const r = VERBETER[q.soort](q, v, k); return { pts:Math.round(Math.min(q.punten, r.pts) * 100) / 100, codes:[...new Set(r.codes)], kruis:r.kruis || 0 }; },
  volledig(q, a){ let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){} return !!v && VOLLEDIG[q.soort](q, v); },
  toon,
  /* een volledig juist antwoord bij sleutel k (voor de tests) */
  voorbeeld(q, k){
    const s = n => ({ s:n < 0 ? '−' : '+', n:String(Math.abs(n)) }), L = LEEG[q.soort](q);
    switch(q.soort){
      case 'pattern': return { cells:q.vals.slice(q.given).map(a=>s(a * vast(q))) };
      case 'jumps': { const { keer, stap } = sprongInfo(q.expr); return { jumps:Array.from({ length:keer }, (_, i)=>(i + 1) * stap), res:s(keer * stap) }; }
      case 'teller': { const W = reken(q.expr); return Object.assign(L, { sign:W < 0 ? '−' : '+', res:s(W) }, q.gedurig ? { abs:String(Math.abs(W)) } : {}); }
      case 'divcheck': return { rows:q.rows.map(r=>({ q:s(reken(r.expr)), c:s(reken(r.expr) * reken(r.divisor)) })) };
      case 'pyramid': return { cells:Object.fromEntries(Object.keys(k.key).map(x=>[x, s(k.key[x])])) };
      case 'compare': return { c:q.items.map(it=>vgl(reken(it[0]), reken(it[1]))) };
      case 'labels': return { slots:k.key.slice() };
      case 'missing': return { rows:k.key.map(s) };
      case 'context': return Object.assign(L, { bew:k.expr, res:s(reken(k.expr)) }, q.visual === 'thermo' ? { temp:reken(k.expr) } : {});
      case 'twins': return { pairs:q.pairs.map(p=>({ L:P0(), R:P0(), a:s(reken(p[0])), b:s(reken(p[1])) })) };
      case 'pairs': return { ex:q.exprs.map(e=>({ p:[], x:0, res:s(reken(e)) })) };
    }
  },
  invullen:opts=>window.RV.maak(OPG, TYPEN, opts)
};
})();
