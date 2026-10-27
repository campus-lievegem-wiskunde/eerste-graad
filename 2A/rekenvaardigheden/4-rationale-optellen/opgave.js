/* 2A Rekenvaardigheden 4 · Optellen en aftrekken van rationale getallen (30 oefeningen, interactief met gedeeld/rv-kader.js en gedeeld/rv-breuk.js).
   Oefeningen, volgorde en uitleg zoals het oorspronkelijke Oefening.html; verbeteren zoals code.gs: deelpunten, foutcodes en
   rode kruisjes (tekenparen die niet samen mochten, een fout kgv, onmogelijke knipgetallen, "kan niet eenvoudiger" terwijl het wel kon).
   De termen van de vraagstukken en denkvragen en de juiste keuze bij de foutenjager staan enkel in de versleutelde sleutel
   (sleutel.enc.json). De andere uitkomsten volgen uit de opgave zelf.
   Notatie in een uitdrukking: 5/6 breuk · ~−5/6 minteken in de teller · 0,75 kommagetal. */
(function(){
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ggd = (a, b)=>{ a = Math.abs(a); b = Math.abs(b); while(b){ const t = a % b; a = b; b = t; } return a; };
const kgv2 = (a, b)=>a / ggd(a, b) * b;
/* breuken tonen (ook in het dashboard en de pdf: de stijl komt uit gedeeld/rv-breuk.css via opgave.css) */
const brS = (t, n) => `<span class="br"><span class="br-t">${t}</span><span class="br-n">${n}</span></span>`;
const br = (num, den) => (num < 0 ? '−' : '') + (den === 1 ? `<span class="br-int">${Math.abs(num)}</span>` : brS(Math.abs(num), den));
const fx = s => esc(s).replace(/~−(\d+)\/(\d+)/g, (m, a, b)=>brS('−' + a, b)).replace(/(\d+)\/(\d+)/g, (m, a, b)=>brS(a, b)).replace(/ ([+−]) /g, ' <span class="rv-op">$1</span> ');
const nat = x => { const t = String(x == null ? '' : x).trim(); return /^\d{1,7}$/.test(t) ? +t : null; };
const neg = s => s === '−' || s === '-';
const leeg = '<span class="tl-leeg">……</span>';

/* ---------- oefeningen ---------- */
const E = (id, soort, punten, vraag, extra) => Object.assign({ id, type:'eigen', soort, punten, vraag }, extra);
const legers = (id, expr, terms, zin) => E(id, 'legers', 1.5, `Bereken ${fx(expr)}. ${zin}`, { expr, terms });
const noemer = (id, expr, terms) => E(id, 'kgv', 2, `Bereken ${fx(expr)}. Zoek eerst de kleinste gemeenschappelijke noemer.`, { expr, terms });
const stap = (id, expr, terms) => E(id, 'fsteps', 2, `Bereken ${fx(expr)} met het stappenplan.`, { expr, terms });
const combo = (id, expr, terms, dec) => E(id, 'fsteps', 2.5, `Bereken ${fx(expr)}. Zet het kommagetal eerst om naar een breuk.`, { expr, terms, combo:true, dec:[dec] });
const komma = (id, expr, dterms) => E(id, 'dsteps', 1.5, `Bereken ${fx(expr)} met het stappenplan voor kommagetallen.`, { expr, dterms });
const jager = (id, who, work, expr, terms, options) => E(id, 'errfrac', 1.5, `${who} maakte een fout. Kan jij ze vinden?`, { who, work, expr, terms, options:options.map((text, i)=>({ id:'abcd'[i], text })) });
const DELEN = [
  { titel:'Legers met breuken', vragen:[
    legers('ex01', '1/3 + 1/4', [[1, 3], [1, 4]], 'Twee positieve legers versterken elkaar.'),
    legers('ex02', '−1/2 − 1/6', [[-1, 2], [-1, 6]], 'Twee negatieve legers versterken elkaar.'),
    legers('ex03', '3/4 − 1/3', [[3, 4], [-1, 3]], 'Een positief en een negatief leger vechten.'),
    legers('ex04', '−5/6 + 1/4', [[-5, 6], [1, 4]], 'Een negatief en een positief leger vechten.'),
    legers('ex05', '−1/2 + 7/10', [[-1, 2], [7, 10]], 'Een negatief en een positief leger vechten.') ] },
  { titel:'Noemerzoeker (kgv)', vragen:[
    noemer('ex06', '~−5/6 + 3/8', [[-5, 6], [3, 8]]),
    noemer('ex07', '3/4 − 7/10', [[3, 4], [-7, 10]]),
    noemer('ex08', '1/3 − 3/4 + 7/6', [[1, 3], [-3, 4], [7, 6]]) ] },
  { titel:'Stappenplan breuken', vragen:[
    stap('ex09', '2/3 − 1/4', [[2, 3], [-1, 4]]),
    stap('ex10', '2 + (−5/6)', [[2, 1], [-5, 6]]),
    stap('ex11', '~−5/6 + 1/2', [[-5, 6], [1, 2]]),
    stap('ex12', '−4 − (~−17/6)', [[-4, 1], [17, 6]]),
    stap('ex13', '~−3/7 − (−1/2)', [[-3, 7], [1, 2]]) ] },
  { titel:'Kommagetallen', vragen:[
    komma('ex14', '3,5 − 1,25', [['3,5', 1], ['1,25', -1]]),
    komma('ex15', '−0,6 + 2,45', [['0,6', -1], ['2,45', 1]]),
    komma('ex16', '1,2 − 4,375 + 0,05', [['1,2', 1], ['4,375', -1], ['0,05', 1]]) ] },
  { titel:'Breuken en kommagetallen', vragen:[
    combo('ex17', '−0,75 + 5/6', [[-3, 4], [5, 6]], '0,75'),
    combo('ex18', '13/5 − 2,4', [[13, 5], [-12, 5]], '2,4'),
    combo('ex19', '~−7/4 − 0,25 − 2', [[-7, 4], [-1, 4], [-2, 1]], '0,25'),
    combo('ex20', '7/10 − 1,3 + 1/5', [[7, 10], [-13, 10], [1, 5]], '1,3'),
    combo('ex21', '1,5 − (−3/4) + (−1/8)', [[3, 2], [3, 4], [-1, 8]], '1,5'),
    combo('ex22', '−2,35 + 7/20 − (−3/4)', [[-47, 20], [7, 20], [3, 4]], '2,35') ] },
  { titel:'Vraagstukken', vragen:[
    E('ex23', 'context', 1.5, `Lotte eet ${fx('1/4')} van een pizza en Milan eet ${fx('1/3')} van dezelfde pizza. Welk deel van de pizza blijft er over?`, { visual:'pizza', vis:[[1, 4, 'Lotte'], [1, 3, 'Milan']], resLabel:'Deel dat overblijft' }),
    E('ex24', 'context', 1.5, `Op maandag wordt ${fx('1/5')} van een muur wit geschilderd, op dinsdag nog eens ${fx('1/3')}. Welk deel van de muur moet nog geschilderd worden?`, { visual:'muur', vis:[[1, 5, 'maandag'], [1, 3, 'dinsdag']], resLabel:'Deel dat nog geschilderd moet worden' }),
    E('ex25', 'context', 1.5, `Een fles van 1 liter is voor ${fx('3/4')} gevuld. Je giet er 0,4 liter uit in een glas. Welk deel van de fles is nog gevuld? Geef je antwoord als breuk.`, { visual:'fles', vis:{ vol:[3, 4], giet:'0,4' }, resLabel:'Deel van de fles dat nog gevuld is' }) ] },
  { titel:'Denkvragen', vragen:[
    E('ex26', 'context', 1.5, `Welke breuk is ${fx('3/7')} minder dan ${fx('−1/2')}?`, { visual:'geen', resLabel:'De breuk' }),
    E('ex27', 'context', 1.5, `Lien wandelt ${fx('3/4')} km, rust even en wandelt daarna nog ${fx('2/5')} km. Hoeveel km wandelt ze in totaal?`, { visual:'geen', resLabel:'Aantal km' }) ] },
  { titel:'Foutenjager', vragen:[
    jager('ex28', 'Lotte', '2/3 + 1/4 = 3/7', '2/3 + 1/4', [[2, 3], [1, 4]], ['Niets, de berekening is juist.', 'Ze telde de tellers en de noemers op. Ze moest eerst gelijknamig maken.', 'Ze moest de noemers vermenigvuldigen en de tellers optellen.', 'De uitkomst moet negatief zijn.']),
    jager('ex29', 'Ahmed', '1 − 2/7 = ~−1/7', '1 − 2/7', [[1, 1], [-2, 7]], ['Hij moest 2/7 − 1 berekenen.', 'Niets, de berekening is juist.', 'Hij schreef 1 als 1/7. Dat moet 7/7 zijn.', 'Hij vergat te vereenvoudigen.']),
    jager('ex30', 'Noor', '−0,75 + 1/2 = ~−75/10 + 5/10 = ~−70/10 = −7', '−0,75 + 1/2', [[-3, 4], [1, 2]], ['Ze vergat het minteken bij 1/2.', 'Ze moest −0,75 als −3/4 schrijven, maar 75/10 is ook goed.', 'Niets, de berekening is juist.', 'Het laatste cijfer van 0,75 staat bij de honderdsten: 0,75 = 75/100.']) ] }
];
const UITLEG = {
  legers:'① Verdeel beide stroken in even grote stukjes tot alle lijnen passen (gelijke noemer): dan worden de legers blokjes. ② Laat de legers samenkomen: rood (positief) en blauw (negatief) heffen elkaar op. ③ Noteer de uitkomst en vereenvoudig.',
  kgv:'① Klik op de kleinste gemeenschappelijke noemer. ② Schrijf elke breuk met die noemer. ③ Reken uit en vereenvoudig.',
  fsteps:'Stap 1: dubbele tekens wegwerken (klik de twee tekens aan). Stap 2: gelijknamig maken met het kgv. Stap 3: tellers samennemen. Stap 4: vereenvoudigen.',
  combo:'Stap 0: zet het kommagetal om naar een breuk en vereenvoudig die. Daarna het stappenplan: dubbele tekens, gelijknamig maken, tellers samennemen, vereenvoudigen.',
  dsteps:'① Zorg dat alle termen evenveel cijfers na de komma hebben (vul aan met nullen). ② Denk de komma’s weg en reken uit. ③ Zet de komma terug in de uitkomst.',
  context:'Verdeel de afbeelding in gelijke stukjes: dat helpt je om te rekenen. Geef je antwoord als breuk in de eenvoudigste vorm.',
  denk:'Denk goed na welke bewerking je nodig hebt. Geef je antwoord als breuk in de eenvoudigste vorm.',
  errfrac:'Kies wat er fout ging en noteer de juiste uitkomst in de eenvoudigste vorm.'
};
const BEGRIPPEN = {
  'kleinste gemeenschappelijke noemer':'Het kleinste getal dat een veelvoud is van alle noemers (het kgv van de noemers).',
  'gelijknamig':'Breuken zijn gelijknamig als ze dezelfde noemer hebben.',
  'vereenvoudig':'Teller en noemer door hetzelfde getal delen tot het niet meer kan. Het grootste getal waardoor dat in één keer kan, is de ggd.',
  'stroken':'Stroken die je in gelijke stukjes verdeelt. Zijn alle stukjes even groot, dan hebben de breuken dezelfde noemer.',
  'stappenplan':'Stap 1: dubbele tekens wegwerken. Stap 2: gelijknamig maken. Stap 3: tellers samennemen. Stap 4: vereenvoudigen.',
  'kladblad':'Een blad papier waarop je je berekening noteert.',
  'kommagetallen':'Getallen met een komma, zoals 0,75. Het laatste cijfer bepaalt de noemer: tienden (10), honderdsten (100), duizendsten (1000).'
};
const CODES = {
  TELLERS_NOEMERS_OPGETELD:{ label:'Tellers en noemers opgeteld', uitleg:'De tellers bij elkaar opgeteld én de noemers bij elkaar opgeteld (bv. 2/3 + 1/4 = 3/7).' },
  TELLER_NIET_MEE:{ label:'Teller niet mee vermenigvuldigd', uitleg:'Bij het gelijknamig maken enkel de noemer veranderd: de teller bleef dezelfde.' },
  GEHEEL_ALS_BREUK:{ label:'Geheel getal fout als breuk', uitleg:'Een geheel getal (bv. 2 of 1) niet correct als breuk geschreven (2 = 12/6, 1 = 7/7).' },
  GELIJKNAMIG_FOUT:{ label:'Fout bij gelijknamig maken', uitleg:'Een gelijknamige breuk heeft een verkeerde teller.' },
  KGV_FOUT:{ label:'Fout kgv', uitleg:'Een getal ingevuld of gekozen dat geen gemeenschappelijk veelvoud van de noemers is (rood kruisje bij het kgv).' },
  GEEN_KLEINSTE:{ label:'Niet de kleinste gemeenschappelijke noemer', uitleg:'Een gemeenschappelijk veelvoud gekozen, maar niet het kleinste.' },
  NIET_VEREENVOUDIGD:{ label:'Niet (volledig) vereenvoudigd', uitleg:'De uitkomst klopt, maar staat niet in de eenvoudigste vorm.' },
  ONTERECHT_NIET:{ label:'"Kan niet eenvoudiger" terwijl het wel kon', uitleg:'Op "kan niet eenvoudiger" geklikt bij een breuk die nog vereenvoudigd kon worden (rood kruisje).' },
  SCHAAR_ONMOGELIJK:{ label:'Onmogelijk knipgetal', uitleg:'Proberen knippen door een getal dat geen deler is van teller en noemer (rood kruisje).' },
  TE_VROEG_KLAAR:{ label:'Te vroeg "klaar"', uitleg:'Op "Klaar met vereenvoudigen" geklikt terwijl er nog verder geknipt kon worden.' },
  KOMMA_PLAATS:{ label:'Plaatswaarde laatste cijfer fout', uitleg:'Bij het omzetten naar een breuk de verkeerde noemer gekozen (tienden, honderdsten, duizendsten).' },
  KOMMA_TELLER:{ label:'Fout bij kommagetal → breuk', uitleg:'De teller van de breuk past niet bij het kommagetal.' },
  NULLEN_AANVULLEN:{ label:'Niet evenveel cijfers na de komma', uitleg:'Niet (juist) aangevuld met nullen voor het wegdenken van de komma.' },
  KOMMA_TERUG:{ label:'Komma fout teruggezet', uitleg:'De cijfers kloppen, maar de komma staat op de verkeerde plaats.' },
  TOESTANDSTEKEN:{ label:'Fout toestandsteken', uitleg:'Het getal klopt, maar het teken van de uitkomst niet.' },
  TEKEN_TERM:{ label:'Verkeerd teken bij een term', uitleg:'Bij het gelijknamig maken het verkeerde teken (+ of −) gekozen.' },
  TEKENPAAR_KRUISJE:{ label:'Rode kruisjes bij tekenparen', uitleg:'Twee tekens samen willen nemen die geen dubbel teken vormen.' },
  DOORWERKFOUT:{ label:'Doorwerkfout', uitleg:'Een eerdere stap was fout, maar daarna is correct verder gerekend.' },
  REKENFOUT:{ label:'Rekenfout', uitleg:'Een andere fout in de uitkomst.' },
  FOUTENJAGER:{ label:'Verkeerde fout aangeduid', uitleg:'Bij de foutenjager niet de echte fout gekozen.' }
};

/* ---------- rekenhulp (zoals code.gs) ---------- */
const F = () => ({ s1:null, t:'', n:'' });
const SCH = () => ({ mode:null, cuts:[], done:false, for:null, x:0, nv:0, sx:0 });
const CONV = () => ({ pos:null, t:'', sch:SCH() });
const PM = () => ({ sign:null, t:'' });
const SN = () => ({ s:null, n:'' });
const kgvT = terms => terms.reduce((a, t)=>kgv2(a, t[1]), 1);
const verwacht = terms => { const K = kgvT(terms); return { num:terms.reduce((s, t)=>s + t[0] * K / t[1], 0), den:K }; };
const red = f => { const g = ggd(f.num, f.den) || 1; return { num:f.num / g, den:f.den / g }; };
const isRed = f => !!f && (f.num === 0 ? f.den === 1 : ggd(f.num, f.den) === 1);
const zelfde = (a, b) => !!a && !!b && a.num * b.den === b.num * a.den;
const kanKnip = f => !!f && f.den > 1 && ggd(f.num, f.den) > 1;
const fval = (o, vastN) => { if(!o || o.s1 == null) return null; const t = nat(o.t), n = vastN || nat(o.n); if(t === null || !n) return null; return { num:neg(o.s1) ? -t : t, den:n }; };
const sig = b => b ? b.num + '/' + b.den : '';
const naKnip = (b, cuts) => { let num = Math.abs(b.num), den = b.den;
  for(const c0 of cuts || []){ const c = +c0; if(c > 1 && num % c === 0 && den % c === 0){ num /= c; den /= c; } else break; }
  return { num:b.num < 0 ? -num : num, den }; };
/* eindresultaat na de vereenvoudigschaar: enkel als de leerling "klaar" of "kan niet eenvoudiger" koos voor deze breuk */
const eindVan = (b, sch) => !b || !sch || !sch.done || sch.for !== sig(b) ? null : naKnip(b, sch.cuts);
const schOK = (sch, b) => !!eindVan(b, sch);
const decPl = s => (String(s).split(',')[1] || '').length;
const decFr = s => { const p = String(s).split(','), d = p[1] || ''; return { num:+(p[0] + d), den:10 ** d.length }; };
const zonderKomma = (s, z) => +(String(s).replace(',', '') + '0'.repeat(Math.max(0, z)));
const decTekst = s => { const t = String(s == null ? '' : s).trim().replace('.', ','); return /^\d{1,7}(,\d{1,6})?$/.test(t) ? t : null; };
const decVal = o => { if(!o || o.s == null) return null; const t = decTekst(o.n); if(!t) return null; const f = decFr(t); return { num:neg(o.s) ? -f.num : f.num, den:f.den }; };
const sval = o => { if(!o || o.s == null) return null; const n = nat(o.n); return n === null ? null : neg(o.s) ? -n : n; };
const decTxt = (num, den) => { const D = String(den).length - 1, a = String(Math.abs(num)).padStart(D + 1, '0'); return (num < 0 ? '−' : '') + (D ? a.slice(0, a.length - D) + ',' + a.slice(a.length - D) : a); };
const POS = { t:10, h:100, d:1000 };
const convBasis = c => { const den = c && POS[c.pos], t = c && nat(c.t); return den && t !== null ? { num:t, den } : null; };
const termVan = t => ({ sign:t[0] < 0 ? -1 : 1, num:Math.abs(t[0]), den:t[1] });
const kommaInfo = q => { const D = Math.max(...q.dterms.map(t=>decPl(t[0]))); return { D, Eint:q.dterms.reduce((s, t)=>s + t[1] * zonderKomma(t[0], D - decPl(t[0])), 0) }; };

/* typische fout bij een uitkomst (breuk) */
function breukCodes(terms, r){
  const E = verwacht(terms);
  if(zelfde(r, E)) return [];
  if(E.num !== 0 && zelfde(r, { num:-E.num, den:E.den })) return ['TOESTANDSTEKEN'];
  const sn = terms.reduce((a, t)=>a + t[0], 0), sd = terms.reduce((a, t)=>a + t[1], 0);
  if(sd > 0 && (zelfde(r, { num:sn, den:sd }) || zelfde(r, { num:-sn, den:sd }))) return ['TELLERS_NOEMERS_OPGETELD'];
  return ['REKENFOUT'];
}
/* uitkomst + vereenvoudigen: wRes voor de juiste waarde, wSimp voor de eenvoudigste vorm */
function uitkomst(terms, res, sch, vastN, wRes, wSimp, eigen){
  const E = verwacht(terms), uit = { pts:0, codes:[], kruis:0 }, b = fval(res, vastN), fin = eindVan(b, sch);
  if(b && zelfde(b, E)){ uit.pts += wRes; if(fin && zelfde(fin, E) && isRed(fin)) uit.pts += wSimp; else uit.codes.push('NIET_VEREENVOUDIGD'); }
  else if(b){ if(eigen && zelfde(b, eigen) && !zelfde(eigen, E)) uit.codes.push('DOORWERKFOUT'); else uit.codes.push(...breukCodes(terms, b)); }
  if(sch){ const x = +sch.x || 0, sx = +sch.sx || 0; if(x) uit.codes.push('SCHAAR_ONMOGELIJK'); if(sx) uit.codes.push('ONTERECHT_NIET'); if(+sch.nv) uit.codes.push('TE_VROEG_KLAAR'); uit.kruis += x + sx; }
  return uit;
}
/* gelijknamige termen (teken + teller) met noemer K */
function termenPunten(terms, tv, K, w){
  const uit = { pts:0, codes:[] }, per = w / terms.length;
  terms.forEach((t, i)=>{ const x = (tv || [])[i] || {}, tt = nat(x.t), sg = neg(x.sign) ? -1 : x.sign === '+' ? 1 : 0;
    if(!K || tt === null) return;
    const wil = Math.abs(t[0]) * K / t[1], wilSg = t[0] < 0 ? -1 : 1;
    if(tt === wil && (sg === wilSg || wil === 0)){ uit.pts += per; return; }
    if(tt === wil) uit.codes.push('TEKEN_TERM');
    else if(t[1] === 1 && tt === Math.abs(t[0])) uit.codes.push('GEHEEL_ALS_BREUK');
    else if(tt === Math.abs(t[0]) && K !== t[1]) uit.codes.push('TELLER_NIET_MEE');
    else uit.codes.push('GELIJKNAMIG_FOUT'); });
  return uit;
}
/* wat de leerling zelf zou uitkomen met zijn gelijknamige termen (voor doorwerkfouten) */
function eigenSom(tv, K){
  if(!K || !Array.isArray(tv)) return null; let s = 0;
  for(const x of tv){ const tt = nat(x && x.t); if(tt === null || !x.sign) return null; s += (neg(x.sign) ? -1 : 1) * tt; }
  return { num:s, den:K };
}

/* ---------- verbeteren: { pts, codes, kruis } ---------- */
const VERBETER = {
  legers(q, v){
    const N = +v.N || 1, codes = [], ok = q.terms.every(t=>N % t[1] === 0), a = nat(v.a), b = nat(v.b); let pts = 0;
    if(ok){
      const wa = Math.abs(q.terms[0][0]) * N / q.terms[0][1], wb = Math.abs(q.terms[1][0]) * N / q.terms[1][1];
      if(a === wa) pts += .25; else if(a !== null) codes.push(a === Math.abs(q.terms[0][0]) ? 'TELLER_NIET_MEE' : 'GELIJKNAMIG_FOUT');
      if(b === wb) pts += .25; else if(b !== null) codes.push(b === Math.abs(q.terms[1][0]) ? 'TELLER_NIET_MEE' : 'GELIJKNAMIG_FOUT');
    }
    const eigen = a !== null && b !== null ? { num:Math.sign(q.terms[0][0]) * a + Math.sign(q.terms[1][0]) * b, den:N } : null;
    const r = v.merged && ok ? uitkomst(q.terms, v.res, v.sch, N, .5, .5, eigen) : { pts:0, codes:[], kruis:0 };
    return { pts:pts + r.pts, codes:codes.concat(r.codes), kruis:r.kruis };
  },
  kgv(q, v){
    const K = kgvT(q.terms), pick = +v.pick || null, codes = []; let pts = 0;
    if(pick === K) pts += .5; else if(pick) codes.push(q.terms.every(t=>pick % t[1] === 0) ? 'GEEN_KLEINSTE' : 'KGV_FOUT');
    const tr = termenPunten(q.terms, v.terms, pick, .5);
    const r = pick ? uitkomst(q.terms, v.res, v.sch, pick, .5, .5, eigenSom(v.terms, pick)) : { pts:0, codes:[], kruis:0 };
    return { pts:pts + tr.pts + r.pts, codes:codes.concat(tr.codes, r.codes), kruis:r.kruis };
  },
  fsteps(q, v){
    const K = kgvT(q.terms), codes = []; let pts = 0, kruis = +v.x || 0;
    if(kruis) codes.push('TEKENPAAR_KRUISJE');
    if(q.combo){ const per = .5 / q.dec.length;
      q.dec.forEach((d, j)=>{ const c = (v.conv || [])[j] || {}, wil = decFr(d), b = convBasis(c), fin = eindVan(b, c.sch);
        if(b && zelfde(b, wil)){ if(fin && isRed(fin)) pts += per; else { pts += per / 2; codes.push('NIET_VEREENVOUDIGD'); } }
        else if(b) codes.push(b.den !== 10 ** decPl(d) ? 'KOMMA_PLAATS' : 'KOMMA_TELLER');
        if(c.sch){ kruis += (+c.sch.x || 0) + (+c.sch.sx || 0); if(+c.sch.x) codes.push('SCHAAR_ONMOGELIJK'); if(+c.sch.sx) codes.push('ONTERECHT_NIET'); if(+c.sch.nv) codes.push('TE_VROEG_KLAAR'); } }); }
    /* enkel een juist kgv wordt aanvaard; kruisjes = eerder foute pogingen */
    const kv = nat(v.kgv), kx = +v.kx || 0;
    if(kv === K) pts += kx ? .25 : .5;
    if(kx){ codes.push('KGV_FOUT'); kruis += kx; }
    const tr = termenPunten(q.terms, v.terms, kv === K ? K : null, .5);
    const r = kv === K ? uitkomst(q.terms, v.res, v.sch, K, .5, .5, eigenSom(v.terms, K)) : { pts:0, codes:[], kruis:0 };
    return { pts:pts + tr.pts + r.pts, codes:codes.concat(tr.codes, r.codes), kruis:kruis + r.kruis };
  },
  dsteps(q, v){
    const { D, Eint } = kommaInfo(q), z = Array.isArray(v.z) ? v.z.map(Number) : [], codes = []; let pts = 0;
    const nullenOk = q.dterms.every((t, i)=>decPl(t[0]) + (z[i] || 0) === D);
    if(nullenOk) pts += .5; else codes.push('NULLEN_AANVULLEN');
    const eigen = q.dterms.reduce((s, t, i)=>s + t[1] * zonderKomma(t[0], z[i] || 0), 0), ri = sval(v.int);
    if(ri === Eint) pts += .5;
    else if(ri !== null) codes.push(!nullenOk && ri === eigen ? 'DOORWERKFOUT' : ri === -Eint ? 'TOESTANDSTEKEN' : 'REKENFOUT');
    const Ew = { num:Eint, den:10 ** D }, rr = decVal(v.res);
    if(rr && zelfde(rr, Ew)) pts += .5;
    else if(rr){ const cijfers = String(v.res.n).replace(/[^\d]/g, '').replace(/^0+/, ''), wil = String(Math.abs(Eint)).replace(/^0+/, '');
      codes.push(zelfde(rr, { num:-Ew.num, den:Ew.den }) ? 'TOESTANDSTEKEN' : cijfers === wil ? 'KOMMA_TERUG' : ri !== null && ri !== Eint && zelfde(rr, { num:ri, den:Ew.den }) ? 'DOORWERKFOUT' : 'REKENFOUT'); }
    return { pts, codes, kruis:0 };
  },
  context(q, v, k){
    if(!k || !k.terms) return { pts:0, codes:[], kruis:0 };
    return uitkomst(k.terms, v.res, v.sch, null, 1, .5, null);
  },
  errfrac(q, v, k){
    if(!k || !k.good) return { pts:0, codes:[], kruis:0 };
    let pts = 0; const codes = [];
    if(v.choice === k.good) pts += .5; else if(v.choice) codes.push('FOUTENJAGER');
    const r = uitkomst(q.terms, v.res, v.sch, null, .5, .5, null);
    return { pts:pts + r.pts, codes:codes.concat(r.codes), kruis:r.kruis };
  }
};

/* ---------- volledig ingevuld? (zoals het oorspronkelijke Oefening.html) ---------- */
const fdone = (o, vastN) => fval(o, vastN) !== null;
const termenAf = v => v.terms.every(t=>!!t.sign && nat(t.t) !== null);
const VOLLEDIG = {
  legers:(q, v)=>!!v.merged && nat(v.a) !== null && nat(v.b) !== null && fdone(v.res, v.N) && schOK(v.sch, fval(v.res, v.N)),
  kgv:(q, v)=>!!v.pick && termenAf(v) && fdone(v.res, v.pick) && schOK(v.sch, fval(v.res, v.pick)),
  fsteps:(q, v)=>{ const K = nat(v.kgv) === kgvT(q.terms) ? kgvT(q.terms) : null; return v.conv.every(c=>schOK(c.sch, convBasis(c))) && !!K && termenAf(v) && fdone(v.res, K) && schOK(v.sch, fval(v.res, K)); },
  dsteps:(q, v)=>v.int.s != null && nat(v.int.n) !== null && v.res.s != null && decTekst(v.res.n) !== null,
  context:(q, v)=>fdone(v.res) && schOK(v.sch, fval(v.res)),
  errfrac:(q, v)=>!!v.choice && fdone(v.res) && schOK(v.sch, fval(v.res))
};
const LEEG = {
  legers:()=>({ N:1, merged:false, a:'', b:'', res:F(), sch:SCH() }),
  kgv:q=>({ pick:null, terms:q.terms.map(PM), res:F(), sch:SCH() }),
  fsteps:q=>({ p:[], x:0, conv:(q.dec || []).map(CONV), kgv:'', kx:0, kxv:[], terms:q.terms.map(PM), res:F(), sch:SCH() }),
  dsteps:q=>({ z:q.dterms.map(()=>0), int:SN(), res:SN() }),
  context:()=>({ N:1, pour:false, res:F(), sch:SCH() }),
  errfrac:()=>({ choice:null, res:F(), sch:SCH() })
};

/* ---------- figuren (ook voor het dashboard en de pdf) ---------- */
const opGrens = (k, N, grenzen) => grenzen.some(g=>Math.abs(k / N - g) < 1e-9);
function pizzaSVG(q, N){
  const cx = 180, cy = 180, r = 150, grijs = ['#9fb3b6', '#c7d3d5'], grenzen = [0, 1]; let a0 = -Math.PI / 2, h = '', acc = 0;
  h += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f4c26b" stroke="#c98a2b" stroke-width="8"/>`;
  for(let i = 0; i < 14; i++){ const a = i * 2.3, rr = 30 + (i * 37) % 100; h += `<circle cx="${cx + rr * Math.cos(a)}" cy="${cy + rr * Math.sin(a)}" r="9" fill="#c0392b" opacity=".85"/>`; }
  q.vis.forEach(([p, d, wie], i)=>{ const a1 = a0 + 2 * Math.PI * p / d, groot = a1 - a0 > Math.PI ? 1 : 0, am = (a0 + a1) / 2;
    h += `<path d="M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${groot} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z" fill="${grijs[i]}" stroke="#fff" stroke-width="3"/>`
      + `<text x="${cx + r * .6 * Math.cos(am)}" y="${cy + r * .6 * Math.sin(am)}" text-anchor="middle" font-size="15" font-weight="900" fill="#173436">${esc(wie)}</text>`
      + `<text x="${cx + r * .6 * Math.cos(am)}" y="${cy + r * .6 * Math.sin(am) + 20}" text-anchor="middle" font-size="16" font-weight="900" fill="#173436">${p}/${d}</text>`;
    acc += p / d; grenzen.push(acc); a0 = a1; });
  for(let k = 0; k < N && N > 1; k++){ const a = -Math.PI / 2 + 2 * Math.PI * k / N, op = opGrens(k, N, grenzen);
    h += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="${op ? '#173436' : '#7a4a00'}" stroke-width="${op ? 3 : 2}" stroke-dasharray="7 5"/>`; }
  const am = (a0 + 3 * Math.PI / 2) / 2;
  h += `<text x="${cx + r * .55 * Math.cos(am)}" y="${cy + r * .55 * Math.sin(am) + 12}" text-anchor="middle" font-size="40" font-weight="900" fill="#173436">?</text>`;
  return `<svg class="vis-svg h4-pizza" viewBox="0 0 360 360" aria-label="Pizza">${h}</svg>`;
}
function muurSVG(q, N){
  const x0 = 20, y0 = 30, W = 540, H = 220, grenzen = [0, 1]; let h = '', x = x0, acc = 0;
  for(let r = 0; r < 11; r++) for(let c = 0; c < 15; c++) h += `<rect x="${x0 + c * 40 - (r % 2 ? 20 : 0)}" y="${y0 + r * 20}" width="38" height="18" fill="#d7a57a" stroke="#b9855c"/>`;
  h = `<clipPath id="h4-muur"><rect x="${x0}" y="${y0}" width="${W}" height="${H}"/></clipPath><g clip-path="url(#h4-muur)">${h}</g>`;
  q.vis.forEach(([p, d, dag], i)=>{ const w = W * p / d;
    h += `<rect x="${x}" y="${y0}" width="${w}" height="${H}" fill="#ffffff" opacity=".96"/><text x="${x + w / 2}" y="${y0 + H / 2 - 6}" text-anchor="middle" font-size="16" font-weight="900" fill="#173436">${esc(dag)}</text><text x="${x + w / 2}" y="${y0 + H / 2 + 18}" text-anchor="middle" font-size="18" font-weight="900" fill="#173436">${p}/${d}</text>`;
    x += w; acc += p / d; grenzen.push(acc);
    if(i === 0) h += `<line x1="${x}" x2="${x}" y1="${y0}" y2="${y0 + H}" stroke="#35545a" stroke-width="3" stroke-dasharray="9 6"/>`; });
  h += `<text x="${(x + x0 + W) / 2}" y="${y0 + H / 2 + 14}" text-anchor="middle" font-size="44" font-weight="900" fill="#173436">?</text>`;
  for(let k = 1; k < N; k++){ const xx = x0 + W * k / N, op = opGrens(k, N, grenzen);
    h += `<line x1="${xx}" x2="${xx}" y1="${y0 - 6}" y2="${y0 + H + 6}" stroke="${op ? '#173436' : '#6d4700'}" stroke-width="${op ? 2.5 : 1.8}" stroke-dasharray="5 4"/>`; }
  h += `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="none" stroke="#35545a" stroke-width="3"/><text x="${x + 8}" y="${y0 - 8}" font-size="22">🖌️</text>`;
  return `<svg class="vis-svg" viewBox="0 0 580 270" aria-label="Muur">${h}</svg>`;
}
/* fles (1 liter) en een glas met dezelfde breedte: de streepjes liggen even ver uit elkaar */
const BT = { x:70, gx:330, W:130, top:80, bot:350 };
function flesSVG(q, N, gegoten){
  const [p, d] = q.vis.vol, giet = parseFloat(String(q.vis.giet).replace(',', '.')), H = BT.bot - BT.top, GH = H * .5, gtop = BT.bot - GH;
  const fb = p / d - (gegoten ? giet : 0), fg = (gegoten ? giet : 0) / .5; let h = '';
  h += `<rect class="h4-vloei h4-fles" x="${BT.x}" y="${BT.top}" width="${BT.W}" height="${H}" style="transform:scaleY(${fb})"/>`;
  for(let k = 1; k < N; k++){ const y = BT.bot - H * k / N; h += `<line x1="${BT.x}" x2="${BT.x + BT.W}" y1="${y}" y2="${y}" stroke="#35545a" stroke-width="1.4" stroke-dasharray="5 4" opacity=".75"/>`; }
  h += `<path d="M${BT.x + 45},18 L${BT.x + 85},18 L${BT.x + 85},50 L${BT.x + BT.W},${BT.top} L${BT.x + BT.W},${BT.bot} L${BT.x},${BT.bot} L${BT.x},${BT.top} L${BT.x + 45},50 Z" fill="none" stroke="#35545a" stroke-width="4"/>`;
  h += `<line x1="${BT.x - 10}" x2="${BT.x}" y1="${BT.top}" y2="${BT.top}" stroke="#35545a" stroke-width="2"/><text x="${BT.x - 14}" y="${BT.top + 5}" text-anchor="end" font-size="13" font-weight="800" fill="#35545a">1 liter</text>`;
  h += `<text x="${BT.x + BT.W / 2}" y="${BT.bot + 26}" text-anchor="middle" font-size="15" font-weight="900" fill="#173436">fles</text>`;
  h += `<rect class="h4-vloei h4-glas" x="${BT.gx}" y="${gtop}" width="${BT.W}" height="${GH}" style="transform:scaleY(${fg})"/>`;
  for(let k = 1; k < N; k++){ const y = BT.bot - H * k / N; if(y <= gtop + .5) break; h += `<line x1="${BT.gx}" x2="${BT.gx + BT.W}" y1="${y}" y2="${y}" stroke="#35545a" stroke-width="1.4" stroke-dasharray="5 4" opacity=".75"/>`; }
  h += `<path d="M${BT.gx - 6},${gtop - 14} L${BT.gx},${BT.bot} L${BT.gx + BT.W},${BT.bot} L${BT.gx + BT.W + 6},${gtop - 14}" fill="none" stroke="#35545a" stroke-width="4" stroke-linejoin="round"/>`;
  h += `<text x="${BT.gx + BT.W / 2}" y="${BT.bot + 26}" text-anchor="middle" font-size="15" font-weight="900" fill="#173436">glas</text>`;
  h += `<text class="h4-giettag" x="${BT.gx + BT.W / 2}" y="${gtop - 24}" text-anchor="middle" font-size="15" font-weight="900" fill="#173436" style="opacity:${gegoten ? 1 : 0}">${esc(q.vis.giet)} liter</text>`;
  h += `<defs><marker id="h4-pijl" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9fb3b6"/></marker></defs><path d="M${BT.x + BT.W + 20},200 L${BT.gx - 20},200" stroke="#9fb3b6" stroke-width="3" marker-end="url(#h4-pijl)"/>`;
  return `<svg class="vis-svg h4-flessvg" viewBox="0 0 520 390" aria-label="Fles en glas">${h}</svg>`;
}
const FIGUUR = { pizza:pizzaSVG, muur:muurSVG, fles:flesSVG };
const notitie = q => `<div class="h4-schrift"><div class="h4-snaam">✏️ Schrift van ${esc(q.who)}</div><div class="h4-slijn">${fx(q.work)}</div><div class="h4-stempel">?</div></div>`;

/* ---------- lezen: dashboard, pdf, resultaat van de leerling ---------- */
function toon(q, a, modus, k){
  let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){}
  const blanco = modus === 'blanco', sl = modus === 'sleutel', T = window.RV && window.RV.tekens;
  if(modus === 'lezen' && !v) return '<p class="tl-niet">Niet ingevuld.</p>';
  if(!v || blanco || sl) v = LEEG[q.soort](q);
  const lijn = (l, r) => `<div class="tl"><span class="tl-l">${l}</span><span class="tl-r">${r}</span></div>`;
  const kr = x => !sl && !blanco && x ? ` <span class="tl-kruis">✕ ${x}</span>` : '';
  const g = w => blanco || w === '' || w == null ? leeg : esc(w);
  /* uitkomst als breuk, met het resultaat na vereenvoudigen */
  const res = (terms, o, sch, vastN) => {
    if(sl){ if(!terms) return leeg; const E = verwacht(terms), R = red(E); return br(E.num, E.den) + (R.den !== E.den ? ' = ' + br(R.num, R.den) : ''); }
    if(blanco) return leeg;
    const b = fval(o, vastN), f = eindVan(b, sch);
    if(!b) return o && (o.t || o.n) ? esc((neg(o.s1) ? '−' : '') + (o.t || '…') + '/' + (vastN || o.n || '…')) : leeg;
    return br(b.num, b.den) + (f && (f.num !== b.num || f.den !== b.den) ? ' → ' + br(f.num, f.den) : '') + (sch && sch.mode === 'skip' && sch.done ? ' <i>(kan niet eenvoudiger)</i>' : '') + kr(sch && (+sch.x || 0) + (+sch.sx || 0));
  };
  const termen = (terms, tv, K) => terms.map((t, i)=>{ if(sl) return (i && t[0] > 0 ? '+ ' : '') + br(t[0] * K / t[1], K); const x = tv[i] || {}; return x.t === '' || x.t == null ? '…' : (neg(x.sign) ? '−' : x.sign === '+' && i ? '+' : '') + brS(esc(x.t), K || '…'); }).join(' ');
  switch(q.soort){
    case 'legers': {
      const K = kgvT(q.terms), N = sl ? K : +v.N || 1, ok = q.terms.every(t=>N % t[1] === 0);
      return '<div class="rv-lees">' + lijn('Stroken:', blanco ? leeg : `verdeeld in ${N} stukjes${ok ? '' : ' (past nog niet)'}`)
        + lijn('Gelijknamig:', q.terms.map((t, i)=>`${br(t[0], t[1])} = ${t[0] < 0 ? '−' : ''}${brS(sl ? Math.abs(t[0]) * N / t[1] : g([v.a, v.b][i]), N)}`).join(' &nbsp; '))
        + (sl || blanco ? '' : lijn('Legers:', v.merged ? 'samengekomen' : 'niet samengekomen'))
        + lijn(fx(q.expr) + ' =', v.merged || sl ? res(q.terms, v.res, v.sch, N) : leeg) + '</div>';
    }
    case 'kgv': {
      const K = kgvT(q.terms), pick = sl ? K : v.pick;
      return '<div class="rv-lees">' + lijn('kgv:', pick ? esc(pick) : leeg) + lijn('Gelijknamig:', blanco ? leeg : termen(q.terms, v.terms, pick))
        + lijn(fx(q.expr) + ' =', res(q.terms, v.res, v.sch, pick)) + '</div>';
    }
    case 'fsteps': {
      const K = kgvT(q.terms), kv = sl ? K : nat(v.kgv), ok = kv === K;
      const tekens = T && v.p && v.p.length && !sl && !blanco ? T.html(q.expr, v, null, {}) : fx(q.expr);
      const conv = (q.dec || []).map((d, j)=>{ const w = decFr(d), c = v.conv[j], b = convBasis(c), f = eindVan(b, c && c.sch);
        return lijn(esc(d) + ' =', sl ? br(w.num, w.den) + ' = ' + br(red(w).num, red(w).den) : blanco || !b ? leeg : br(b.num, b.den) + (f && f.den !== b.den ? ' = ' + br(f.num, f.den) : '') + kr(c.sch && (+c.sch.x || 0) + (+c.sch.sx || 0))); }).join('');
      return '<div class="rv-lees">' + lijn('Tekens:', tekens + kr(v.x)) + conv
        + lijn('kgv:', (kv === null ? leeg : esc(kv)) + kr(v.kx)) + lijn('Gelijknamig:', blanco ? leeg : termen(q.terms, v.terms, ok ? K : null))
        + lijn('Uitkomst:', ok ? res(q.terms, v.res, v.sch, K) : leeg) + '</div>';
    }
    case 'dsteps': {
      const { D, Eint } = kommaInfo(q), z = sl ? q.dterms.map(t=>D - decPl(t[0])) : v.z;
      const rij = f => q.dterms.map((t, i)=>(i ? (t[1] < 0 ? ' − ' : ' + ') : t[1] < 0 ? '−' : '') + f(t, i)).join('');
      return '<div class="rv-lees">' + lijn('Evenveel cijfers:', blanco ? leeg : esc(rij((t, i)=>t[0] + '0'.repeat(z[i] || 0))))
        + lijn('Zonder komma:', sl ? esc(Eint < 0 ? '−' + -Eint : Eint) : blanco || sval(v.int) === null ? leeg : esc(String(sval(v.int)).replace('-', '−')))
        + lijn(fx(q.expr) + ' =', sl ? esc(decTxt(Eint, 10 ** D)) : blanco || !decVal(v.res) ? leeg : esc((neg(v.res.s) ? '−' : '') + decTekst(v.res.n))) + '</div>';
    }
    case 'context': {
      const fig = FIGUUR[q.visual] ? `<div class="tl-fig">${FIGUUR[q.visual](q, sl || blanco ? 1 : +v.N || 1, !sl && !blanco && v.pour)}</div>` : '';
      return `<div class="rv-lees${fig ? ' rv-lees-fig' : ''}">${fig}<div>` + lijn(esc(q.resLabel) + ':', res(k && k.terms, v.res, v.sch)) + '</div></div>';
    }
    case 'errfrac':
      return '<div class="rv-lees">' + notitie(q) + lijn('Fout:', sl ? (k && k.good ? esc(k.good.toUpperCase()) + ') ' + esc((q.options.find(o=>o.id === k.good) || {}).text) : leeg) : blanco || !v.choice ? leeg : esc(v.choice.toUpperCase()) + ') ' + esc((q.options.find(o=>o.id === v.choice) || {}).text))
        + lijn(fx(q.expr) + ' =', res(q.terms, v.res, v.sch)) + '</div>';
  }
  return '';
}

/* ---------- invullen: de interactieve oefeningen ---------- */
const TYPEN = {};
Object.keys(LEEG).forEach(s=>{ TYPEN[s] = { leeg:LEEG[s], volledig:VOLLEDIG[s], uitleg:()=>UITLEG[s] }; });
TYPEN.fsteps.uitleg = q=>q.combo ? UITLEG.combo : UITLEG.fsteps;
TYPEN.context.uitleg = q=>q.visual === 'geen' ? UITLEG.denk : UITLEG.context;
const TIP_BREUK = '<p class="rv-tip">Toestandsteken: kies <b>+</b> of <b>−</b> in het vakje vóór de breuk. Vereenvoudigen? Klik naast de breuk op <b>✂ vereenvoudigen</b> of op <b>✓ kan niet eenvoudiger</b>.</p>';
const werk = (c, cls) => c.root.querySelector('.rv-werk').classList.add(cls);
const opInvoer = (c, f) => { c.ant.oninput = c.vis.oninput = f; };

/* legers met breuken: twee stroken; pas als de stukjes even groot zijn (N is een veelvoud van beide noemers), worden de
   gekleurde delen blokjes = soldaten. Gelijke tekens versterken elkaar, tegengestelde tekens heffen elkaar op. */
const LG = { rij:[0, 50], res:104, h:40 };
const lgInfo = (q, N) => { const [A, Bt] = q.terms.map(termVan), okA = N % A.den === 0, okB = N % Bt.den === 0;
  return { A, B:Bt, okA, okB, ok:okA && okB, ca:okA ? A.num * N / A.den : 0, cb:okB ? Bt.num * N / Bt.den : 0, same:A.sign === Bt.sign }; };
const lgPos = (i, N) => `calc(${i * 100 / N}% + 2px)`;
function lgStrook(T, ok, N, top){
  let h = `<div class="h4-strook" style="top:${top}px">`;
  if(!ok) h += `<div class="h4-vul ${T.sign < 0 ? 'min' : 'plus'}" style="width:${100 * T.num / T.den}%"></div>`;
  for(let i = 1; i < T.den; i++) h += `<div class="h4-lijn eigen" style="left:${100 * i / T.den}%"></div>`;
  for(let i = 1; i < N; i++) h += `<div class="h4-lijn knip${(i * T.den) % N === 0 ? ' past' : ''}" style="left:${100 * i / N}%"></div>`;
  return h + '</div>';
}
function lgVeld(v, I){
  const N = v.N || 1; let h = lgStrook(I.A, I.okA, N, LG.rij[0]) + lgStrook(I.B, I.okB, N, LG.rij[1]);
  h += `<div class="h4-strook res" style="top:${LG.res}px">${Array.from({ length:Math.max(0, N - 1) }, (_, i)=>`<div class="h4-lijn knip" style="left:${100 * (i + 1) / N}%"></div>`).join('')}</div>`;
  const blok = (rij, i, top, sg, extra = '') => `<div class="h4-blok ${sg < 0 ? 'min' : 'plus'}${extra}" data-r="${rij}" style="left:${lgPos(i, N)};width:calc(${100 / N}% - 4px);top:${top + 3}px"></div>`;
  for(let i = 0; i < I.ca; i++) h += blok('a', i, LG.rij[0], I.A.sign, v.merged ? ' spook' : '');
  for(let i = 0; i < I.cb; i++) h += blok('b', i, LG.rij[1], I.B.sign, v.merged ? ' spook' : '');
  if(I.ok && v.merged){ const r = I.A.sign * I.ca + I.B.sign * I.cb; for(let i = 0; i < Math.abs(r); i++) h += blok('r', i, LG.res, r); }
  return h;
}
const knipKnop = (N, wat) => `<div class="h4-knip"><b>Verdeel ${wat} in</b> <button type="button" class="h4-nknop" data-n="-1" aria-label="minder stukjes"${N <= 1 ? ' disabled' : ''}>−</button><span class="h4-nval">${N}</span><button type="button" class="h4-nknop" data-n="1" aria-label="meer stukjes">+</button> <b>gelijke stukjes</b></div>`;
const bindKnip = (c, max, bij) => c.vis.querySelectorAll('[data-n]').forEach(b=>b.onclick = ()=>{ if(c.ui.anim) return; const v = c.huidig(); v.N = Math.max(1, Math.min(max, (v.N || 1) + +b.dataset.n)); if(bij) bij(v); c.bewaar(v); c.teken(); });

TYPEN.legers.teken = c=>{
  const { q, v } = c, RV = window.RV, B = RV.br, N = v.N || 1, I = lgInfo(q, N);
  const lab = T => `<span class="h4-lgteken ${T.sign < 0 ? 'min' : 'plus'}">${T.sign < 0 ? '−' : '+'}</span>${brS(T.num, T.den)}`;
  const tag = ok => `<span class="h4-tag${ok ? ' ok' : ''}">${ok ? 'stukjes passen' : 'past nog niet'}</span>`;
  c.vis.innerHTML = `<div class="h4-lg"><div class="h4-lglabs"><div style="top:${LG.rij[0]}px">${lab(I.A)}</div><div style="top:${LG.rij[1]}px">${lab(I.B)}</div><div class="res" style="top:${LG.res}px">samen</div></div>`
    + `<div class="h4-lgveld">${lgVeld(v, I)}</div><div class="h4-lgtags"><div style="top:${LG.rij[0]}px">${tag(I.okA)}</div><div style="top:${LG.rij[1]}px">${tag(I.okB)}</div></div></div>`
    + knipKnop(N, 'elke strook')
    + '<div class="h4-actie">' + (v.merged ? '<button type="button" class="btn ghost h4-terug">↶ Legers terugzetten</button><span class="rv-tip">Tel de blokjes die overblijven.</span>'
      : `<button type="button" class="btn h4-go"${I.ok ? '' : ' disabled'}>${I.same ? '🤝 Laat de legers samenkomen' : '⚔️ Laat de legers vechten'}</button>`
        + (I.ok ? `<span class="rv-tip">${I.same ? 'Twee legers met hetzelfde teken versterken elkaar.' : 'Een rood en een blauw blokje heffen elkaar op.'}</span>` : '<span class="rv-tip h4-let">De stukjes zijn nog niet even groot. Verdeel verder tot alle lijnen passen.</span>')) + '</div>';
  const basis = v.merged ? B.val(v.res, N) : null;
  const gelijk = (T, p, w) => `<span class="rv-wisk">${T.sign < 0 ? '−' : ''}${brS(T.num, T.den)} = ${T.sign < 0 ? '−' : ''}</span>${B.teller(p, w, N, 'teller')}`;
  c.vis.insertAdjacentHTML('beforeend', B.paneel('sch', basis, v.sch, c, true));
  c.ant.innerHTML = '<h3>① Schrijf gelijknamig</h3>' + (I.ok ? `<div class="rv-rij h4-gelijk">${gelijk(I.A, 'a', v.a)}<span class="h4-tussen"></span>${gelijk(I.B, 'b', v.b)}</div>` : '<p class="rv-tip">Verdeel eerst de stroken tot de stukjes van beide legers even groot zijn.</p>')
    + '<h3>② Uitkomst en ③ vereenvoudigen</h3>' + (v.merged ? `<div class="rv-rij"><span class="rv-wisk">${fx(q.expr)} =</span>${B.veld('res', v.res, N)}</div><div class="rv-rij">${B.keuze('sch', basis, v.sch)}</div>${TIP_BREUK}` : '<p class="rv-tip">Laat eerst de legers samenkomen.</p>');
  bindKnip(c, 30, w=>{ w.merged = false; w.sch = SCH(); });
  const go = c.vis.querySelector('.h4-go'); if(go) go.onclick = ()=>lgAnim(c, I);
  const terug = c.vis.querySelector('.h4-terug'); if(terug) terug.onclick = ()=>{ const w = c.huidig(); w.merged = false; c.bewaar(w); c.teken(); };
  const basisVan = w => w.merged ? B.val(w.res, w.N || 1) : null;
  B.bind(c, basisVan); opInvoer(c, ()=>B.ververs(c, basisVan));
};
function lgAnim(c, I){
  if(c.ui.anim) return; c.ui.anim = true; c.bezig(true);
  const veld = c.vis.querySelector('.h4-lgveld'), N = c.huidig().N, A = [...veld.querySelectorAll('.h4-blok[data-r="a"]')], Bb = [...veld.querySelectorAll('.h4-blok[data-r="b"]')], top = (LG.res + 3) + 'px';
  c.vis.querySelector('.h4-go').disabled = true;
  A.forEach((b, i)=>{ b.style.top = top; b.style.left = lgPos(i, N); });
  Bb.forEach((b, i)=>{ b.style.top = top; b.style.left = lgPos(I.same ? I.ca + i : i, N); b.style.zIndex = 2; });
  const klaar = ()=>{ c.ui.anim = false; c.bezig(false); const w = c.huidig(); w.merged = true; c.bewaar(w); if(c.nogHier()) c.teken(); };
  if(I.same){ setTimeout(klaar, 1000); return; }
  setTimeout(()=>{ const m = Math.min(I.ca, I.cb); for(let i = 0; i < m; i++){ A[i].classList.add('poef'); Bb[i].classList.add('poef'); }
    setTimeout(()=>{ (I.ca > I.cb ? A.slice(m) : Bb.slice(m)).forEach((b, j)=>{ b.style.left = lgPos(j, N); }); setTimeout(klaar, 750); }, 650); }, 850);
}

/* noemerzoeker: kgv kiezen bij de veelvouden, gelijknamig maken en uitrekenen */
TYPEN.kgv.teken = c=>{
  const { q, v } = c, RV = window.RV, B = RV.br, K = v.pick, T = q.terms.map(termVan);
  const afgeleid = w => termenAf(w) ? w.terms.map((t, i)=>(neg(t.sign) ? ' − ' : i ? ' + ' : '') + brS(esc(t.t), K)).join('').replace(/ ([+−]) /g, ' <span class="rv-op">$1</span> ') : '<span class="h4-vraag">…</span>';
  const basis = K ? B.val(v.res, K) : null;
  c.vis.innerHTML = '<div class="h4-kgv"><div class="h4-kkop">Veelvouden van de noemers: klik op de kleinste gemeenschappelijke noemer</div>'
    + T.map(t=>`<div class="h4-krij"><span class="h4-klab">van ${t.den}:</span>${Array.from({ length:10 }, (_, i)=>(i + 1) * t.den).map(m=>`<button type="button" class="h4-chip${v.pick === m ? ' aan' : ''}" data-pick="${m}" aria-pressed="${v.pick === m}">${m}</button>`).join('')}<span class="h4-kdots">…</span></div>`).join('') + '</div>'
    + '<h3>③ Reken uit en vereenvoudig</h3>' + (K ? `<div class="rv-rij"><span class="rv-wisk">${fx(q.expr)} = <span data-afgeleid>${afgeleid(v)}</span> =</span>${B.veld('res', v.res, K)}${B.keuze('sch', basis, v.sch)}</div>${TIP_BREUK}` : '<p class="rv-tip">Kies eerst het kgv.</p>');
  c.ant.innerHTML = `<h3>① Kleinste gemeenschappelijke noemer: <span class="h4-kval">${K || '…'}</span></h3><h3>② Maak de breuken gelijknamig</h3>`
    + T.map((t, i)=>`<div class="rv-rij"><span class="rv-wisk">${t.sign < 0 ? '−' : ''}${brS(t.num, t.den)} =</span><span class="rv-term">${RV.teken(`terms.${i}.sign`, v.terms[i].sign, 'teken van de term', true)}${B.teller(`terms.${i}.t`, v.terms[i].t, K, 'teller')}</span></div>`).join('')
    + '<p class="rv-tip">Kies het teken (<b>+</b> of <b>−</b>) en schrijf de teller zonder teken.</p>' + B.paneel('sch', basis, v.sch, c, true);
  c.vis.querySelectorAll('[data-pick]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(); w.pick = +b.dataset.pick; w.sch = SCH(); c.bewaar(w); c.teken(); });
  const basisVan = w => w.pick ? B.val(w.res, w.pick) : null;
  B.bind(c, basisVan);
  opInvoer(c, ()=>{ const w = c.huidig(), a = c.vis.querySelector('[data-afgeleid]'); if(a) a.innerHTML = afgeleid(w); B.ververs(c, basisVan); });
};

/* stappenplan met breuken (en één kommagetal): het kgv krijgt directe feedback, juist → de noemers verschijnen, fout → rood kruisje */
TYPEN.fsteps.teken = c=>{
  const { q, v, ui } = c, RV = window.RV, B = RV.br, Tk = RV.tekens, K0 = kgvT(q.terms), K = nat(v.kgv) === K0 ? K0 : null;
  werk(c, 'h4-stappen');
  const decI = Tk.tokens(q.expr).map((x, i)=>x.k === 'num' && x.ch.includes(',') ? i : -1).filter(i=>i >= 0);
  const vervang = w => Object.fromEntries(decI.map((ti, j)=>{ const r = B.convKlaar(w.conv[j]) ? B.convUit(w.conv[j]) : null; return [ti, r ? br(r.num, r.den) : '<span class="h4-vraag">?</span>']; }));
  const plan = ['Stap 1 · dubbele tekens wegwerken', 'Stap 2 · gelijknamig maken (kgv)', 'Stap 3 · tellers samennemen', 'Stap 4 · vereenvoudigen'];
  const basis = K ? B.val(v.res, K) : null, eind = B.eind(v.sch, basis);
  const kx = v.kgv && !K && v.kxv.includes(String(nat(v.kgv))) ? '<i class="h4-kx" aria-hidden="true">✕</i>' : '';
  c.vis.innerHTML = (q.combo ? q.dec.map((d, j)=>B.conv(`conv.${j}`, d, v.conv[j])).join('') : `<div class="plan h4-plan">${plan.map(s=>`<span>${s}</span>`).join('')}</div>`)
    + B.paneel('sch', basis, v.sch, c, q.combo) + '<p class="rv-tip">Stap 2: kies bij elke term het teken en schrijf de teller met het kgv als noemer. Een geheel getal zoals 2 schrijf je ook als breuk.</p>';
  c.ant.innerHTML = '<div class="schrift h4-schriftje">'
    + `<div class="srij"><span></span><span class="orig">${Tk.html(q.expr, v, 'main', { ui, kaders:'hint' })}</span><span class="stapnaam">Stap 1</span></div>`
    + (q.combo ? `<div class="srij"><span class="gelijk">=</span><span class="orig" data-omgezet>${Tk.html(q.expr, v, null, { vervang:vervang(v) })}</span><span class="stapnaam">omgezet</span></div>` : '')
    + `<div class="srij"><span></span><span class="h4-kgvlijn">kgv van de noemers = ${RV.getal('kgv', v.kgv, 'nat', '', 'kgv')}<span data-kx>${kx}</span></span><span class="stapnaam">Stap 2</span></div>`
    + `<div class="srij"><span class="gelijk">=</span><span class="termen">${q.terms.map((t, i)=>`<span class="rv-term">${RV.teken(`terms.${i}.sign`, v.terms[i].sign, 'teken van de term', i === 0)}${B.teller(`terms.${i}.t`, v.terms[i].t, K, 'teller')}</span>`).join('')}</span><span class="stapnaam">Stap 2</span></div>`
    + `<div class="srij"><span class="gelijk">=</span><span class="termen">${K ? B.veld('res', v.res, K) + B.keuze('sch', basis, v.sch, true) : '<span class="rv-tip">Vul eerst het juiste kgv in.</span>'}</span><span class="stapnaam">Stap 3</span></div>`
    + `<div class="srij"><span class="gelijk">=</span><span class="termen">${eind ? `<span class="h4-eind">${br(eind.num, eind.den)}</span>` : '<span class="rv-tip">Kies bij stap 3: ✂ vereenvoudigen of ✓ kan niet eenvoudiger.</span>'}</span><span class="stapnaam">Stap 4</span></div>`
    + '</div>' + (q.combo ? q.dec.map((d, j)=>B.paneel(`conv.${j}.sch`, B.convBasis(v.conv[j]), v.conv[j].sch, c, true)).join('') : '');
  Tk.bind(c, w=>({ st:w, expr:q.expr, maal:false }));
  B.bindConv(c);
  const basisVan = (w, p) => { if(p === 'sch') return nat(w.kgv) === K0 ? B.val(w.res, K0) : null; const m = p.match(/^conv\.(\d+)\.sch$/); return m ? B.convBasis(w.conv[+m[1]]) : null; };
  B.bind(c, basisVan);
  /* kgv: juist → noemers invullen; fout → rood kruisje (na even wachten, bij Enter of bij het verlaten) */
  let wacht = null;
  const kgvIn = c.ant.querySelector('input[data-pad="kgv"]'), kxVak = c.ant.querySelector('[data-kx]');
  const controleer = ()=>{ clearTimeout(wacht); const w = c.huidig(), n = nat(w.kgv); if(n === null || n === K0 || !c.nogHier()) return;
    if(!w.kxv.includes(String(n))){ w.kxv.push(String(n)); w.kx = (w.kx || 0) + 1; c.bewaar(w); }
    if(kxVak) kxVak.innerHTML = '<i class="h4-kx" aria-hidden="true">✕</i>'; };
  kgvIn.addEventListener('blur', controleer);
  kgvIn.addEventListener('keydown', e=>{ if(e.key === 'Enter') controleer(); });
  opInvoer(c, e=>{
    const w = c.huidig();
    if(e && e.target === kgvIn){ if(kxVak) kxVak.innerHTML = ''; clearTimeout(wacht);
      if(nat(w.kgv) === K0){ c.teken(); const n = c.root.querySelector('[data-teken="terms.0.sign"] button'); if(n) n.focus(); return; }
      wacht = setTimeout(controleer, 900); return; }
    const o = c.ant.querySelector('[data-omgezet]'); if(o) o.innerHTML = Tk.html(q.expr, w, null, { vervang:vervang(w) });
    B.ververs(c, basisVan);
  });
};

/* enkel kommagetallen: ① evenveel cijfers na de komma (nullen aanklikken) ② komma's wegdenken ③ komma terugzetten */
TYPEN.dsteps.teken = c=>{
  const { q, v } = c, RV = window.RV, D = Math.max(...q.dterms.map(t=>decPl(t[0])));
  const delen = q.dterms.map(t=>{ const [w, d] = t[0].split(','); return { sign:t[1], w, d:d || '' }; }), W = Math.max(...delen.map(p=>p.w.length));
  let tab = '<table class="h4-uitlijn" aria-label="komma onder komma">';
  delen.forEach((p, r)=>{ const z = v.z[r] || 0;
    tab += `<tr><td class="sg">${p.sign < 0 ? '−' : r ? '+' : ''}</td>`;
    for(let i = 0; i < W; i++) tab += `<td>${p.w[p.w.length - W + i] || ''}</td>`;
    tab += '<td class="km">,</td>';
    for(let i = 0; i < D; i++){
      if(p.d[i]) tab += `<td>${p.d[i]}</td>`;
      else if(i < p.d.length + z) tab += `<td class="nul"><button type="button" class="h4-nul aan" data-dz="${r}" data-act="-1" title="Klik om deze 0 weg te halen">0</button></td>`;
      else tab += `<td class="mis"><button type="button" class="h4-nul" data-dz="${r}" data-act="1" title="Klik om een 0 bij te zetten" aria-label="0 bijzetten"></button></td>`;
    }
    tab += '</tr>'; });
  tab += '</table>';
  const rij = f => '<span class="rv-uitdr">' + delen.map((p, i)=>(p.sign < 0 ? (i ? ' <span class="rv-op">−</span> ' : '−') : i ? ' <span class="rv-op">+</span> ' : '') + `<b>${f(p, i)}</b>`).join('') + '</span>';
  const met = (p, i) => p.w + ',' + p.d + '0'.repeat(v.z[i] || 0);
  c.vis.innerHTML = '<div class="plan"><span>① evenveel cijfers na de komma</span><span>② komma’s wegdenken en uitrekenen</span><span>③ komma terugzetten</span></div>'
    + '<h3>① Zorg voor evenveel cijfers na de komma</h3><p class="rv-tip">Klik op een leeg vakje om er een 0 in te zetten. Klik op een 0 om ze weer weg te halen.</p>' + `<div class="h4-uitlijnwrap">${tab}</div>`;
  const vak = p => `<span class="rv-term">${RV.teken(p + '.s', v[p].s, 'toestandsteken', true)}${RV.getal(p + '.n', v[p].n, p === 'res' ? 'dec' : 'nat', 'breed', p === 'res' ? 'uitkomst' : 'uitkomst zonder komma')}</span>`;
  c.ant.innerHTML = '<div class="schrift h4-schriftje">'
    + `<div class="srij"><span></span><span class="orig">${fx(q.expr)}</span><span class="stapnaam">opgave</span></div>`
    + `<div class="srij"><span class="gelijk">=</span><span class="orig">${rij(met)}</span><span class="stapnaam">①</span></div>`
    + `<div class="srij"><span class="gelijk">→</span><span class="orig">${rij((p, i)=>met(p, i).replace(',', '').replace(/^0+(?=\d)/, ''))} = </span><span class="stapnaam">②</span></div>`
    + `<div class="srij"><span class="gelijk">=</span><span class="termen">${vak('int')}</span><span class="stapnaam">② zonder komma</span></div>`
    + `<div class="srij"><span class="gelijk">=</span><span class="termen">${vak('res')}</span><span class="stapnaam">③ komma terug</span></div>`
    + '</div>' + window.RV.tekenTip;
  c.vis.querySelectorAll('[data-dz]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(), r = +b.dataset.dz; w.z[r] = Math.max(0, (w.z[r] || 0) + +b.dataset.act); c.bewaar(w); c.teken(); });
};

/* vraagstukken: de afbeelding zelf in stukjes verdelen; enkel de uitkomst invullen, de bewerking hoort op het kladblad */
TYPEN.context.teken = c=>{
  const { q, v, ui } = c, B = window.RV.br, fig = FIGUUR[q.visual], N = v.N || 1;
  if(!fig) werk(c, 'stapel');
  const anim = ui.giet === q.id; delete ui.giet;
  if(fig) c.vis.innerHTML = fig(q, N, anim ? !v.pour : v.pour) + `<div class="h4-actie">${knipKnop(N, { pizza:'de pizza', muur:'de muur', fles:'de fles' }[q.visual])}`
    + (q.visual === 'fles' ? `<button type="button" class="btn h4-giet">${v.pour ? '↶ Terug in de fles' : `🫗 Uitgieten: ${esc(q.vis.giet)} liter`}</button>` : '') + '</div>';
  const basis = B.val(v.res);
  c.ant.innerHTML = `<p class="h4-klad">📝 Noteer je bewerkingen op je kladblad. Vul hier enkel de uitkomst in.</p><h3>Antwoord in de eenvoudigste vorm</h3>`
    + `<div class="rv-rij"><span class="rv-lbl">${esc(q.resLabel)}:</span>${B.veld('res', v.res)}</div><div class="rv-rij">${B.keuze('sch', basis, v.sch)}</div>${fig ? '' : B.paneel('sch', basis, v.sch, c)}${TIP_BREUK}`;
  if(fig) c.vis.insertAdjacentHTML('beforeend', B.paneel('sch', basis, v.sch, c, true));
  if(fig) bindKnip(c, { pizza:24, muur:30, fles:40 }[q.visual]);
  const giet = c.vis.querySelector('.h4-giet');
  if(giet) giet.onclick = ()=>{ if(ui.anim) return; const w = c.huidig(); w.pour = !w.pour; c.bewaar(w); ui.giet = q.id; c.teken(); };
  if(anim){ ui.anim = true; const svg = c.vis.querySelector('svg'), [p, d] = q.vis.vol, g = parseFloat(String(q.vis.giet).replace(',', '.'));
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ if(!c.nogHier()){ ui.anim = false; return; }
      svg.querySelector('.h4-fles').style.transform = `scaleY(${p / d - (v.pour ? g : 0)})`; svg.querySelector('.h4-glas').style.transform = `scaleY(${(v.pour ? g : 0) / .5})`;
      svg.querySelector('.h4-giettag').style.opacity = v.pour ? 1 : 0; setTimeout(()=>{ ui.anim = false; }, 1450); })); }
  const basisVan = w => B.val(w.res);
  B.bind(c, basisVan); opInvoer(c, ()=>B.ververs(c, basisVan));
};

/* foutenjager met breuken */
TYPEN.errfrac.teken = c=>{
  const { q, v } = c, B = window.RV.br, basis = B.val(v.res);
  c.vis.innerHTML = notitie(q) + '<h3>① Wat ging er mis?</h3><div class="keuzes">'
    + q.options.map(o=>`<button type="button" class="keuze${v.choice === o.id ? ' aan' : ''}" data-opt="${o.id}" aria-pressed="${v.choice === o.id}"><span class="letter">${o.id.toUpperCase()}</span><span>${fx(o.text)}</span></button>`).join('') + '</div>';
  c.ant.innerHTML = '<h3>② Wat is de juiste uitkomst? (eenvoudigste vorm)</h3>'
    + `<div class="rv-rij"><span class="rv-wisk">${fx(q.expr)} =</span>${B.veld('res', v.res)}</div><div class="rv-rij">${B.keuze('sch', basis, v.sch)}</div>${TIP_BREUK}`;
  c.vis.insertAdjacentHTML('beforeend', B.paneel('sch', basis, v.sch, c, true));
  c.vis.querySelectorAll('[data-opt]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(); w.choice = b.dataset.opt; c.bewaar(w); c.teken(); });
  const basisVan = w => B.val(w.res);
  B.bind(c, basisVan); opInvoer(c, ()=>B.ververs(c, basisVan));
};

const OPG = window.OPGAVE = {
  id:'2a-rv-4-rationale-optellen', css:'opgave.css', delen:DELEN, begrippen:BEGRIPPEN, codes:CODES,
  verbeter(q, v, k){ const r = VERBETER[q.soort](q, v || {}, k); return { pts:Math.round(Math.min(q.punten, r.pts) * 100) / 100, codes:[...new Set(r.codes)], kruis:r.kruis || 0 }; },
  volledig(q, a){ let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){} try{ return !!v && VOLLEDIG[q.soort](q, v); }catch(e){ return false; } },
  toon,
  /* een volledig juist antwoord bij sleutel k (voor de tests) */
  voorbeeld(q, k){
    const L = LEEG[q.soort](q);
    /* breuk met teken + vereenvoudigen tot de eenvoudigste vorm */
    const vul = (E, vastN) => { const b = vastN ? { num:E.num * vastN / E.den, den:vastN } : red(E), g = ggd(b.num, b.den), st = SCH();
      if(b.den > 1 && g > 1){ st.mode = 'cut'; st.cuts = [g]; } else st.mode = 'skip';
      st.done = true; st.for = sig(b); return { res:{ s1:b.num < 0 ? '−' : '+', t:String(Math.abs(b.num)), n:vastN ? '' : String(b.den) }, sch:st }; };
    const gelijk = K => q.terms.map(t=>({ sign:t[0] < 0 ? '−' : '+', t:String(Math.abs(t[0]) * K / t[1]) }));
    switch(q.soort){
      case 'legers': { const N = kgvT(q.terms); return Object.assign(L, { N, merged:true, a:String(Math.abs(q.terms[0][0]) * N / q.terms[0][1]), b:String(Math.abs(q.terms[1][0]) * N / q.terms[1][1]) }, vul(verwacht(q.terms), N)); }
      case 'kgv': { const K = kgvT(q.terms); return Object.assign(L, { pick:K, terms:gelijk(K) }, vul(verwacht(q.terms), K)); }
      case 'fsteps': { const K = kgvT(q.terms);
        const conv = (q.dec || []).map(d=>{ const w = decFr(d), g = ggd(w.num, w.den), st = SCH(); if(g > 1){ st.mode = 'cut'; st.cuts = [g]; } else st.mode = 'skip'; st.done = true; st.for = sig(w);
          return { pos:{ 10:'t', 100:'h', 1000:'d' }[w.den], t:String(w.num), sch:st }; });
        return Object.assign(L, { conv, kgv:String(K), terms:gelijk(K) }, vul(verwacht(q.terms), K)); }
      case 'dsteps': { const { D, Eint } = kommaInfo(q); return { z:q.dterms.map(t=>D - decPl(t[0])), int:{ s:Eint < 0 ? '−' : '+', n:String(Math.abs(Eint)) }, res:{ s:Eint < 0 ? '−' : '+', n:decTxt(Math.abs(Eint), 10 ** D) } }; }
      case 'context': return Object.assign(L, { N:k && k.terms ? kgvT(k.terms) : 1 }, vul(verwacht(k.terms)));
      case 'errfrac': return Object.assign(L, { choice:k.good }, vul(verwacht(q.terms)));
    }
  },
  invullen:opts=>window.RV.maak(OPG, TYPEN, opts)
};
})();
