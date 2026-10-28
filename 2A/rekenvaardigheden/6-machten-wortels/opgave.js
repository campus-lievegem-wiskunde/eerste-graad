/* 2A Rekenvaardigheden 6 · Machten en vierkantswortels (30 oefeningen, interactief met gedeeld/rv-kader.js en gedeeld/rv-breuk.js).
   Oefeningen, volgorde en uitleg zoals het oorspronkelijke Oefening.html; verbeteren zoals code.gs: deelpunten, foutcodes en
   rode kruisjes (onmogelijke knipgetallen, "kan niet eenvoudiger" terwijl het wel kon).
   Minnen wegklikken: in de herhaalde vermenigvuldiging klikt de leerling telkens twee minnen aan, samen verdwijnen ze
   (RV.tekens met maal; mp = { p:[[i, j], …], x }). code.gs telt enkel het aantal paren.
   Enkel de juiste keuze bij de foutenjager staat in de versleutelde sleutel (sleutel.enc.json); de andere uitkomsten volgen uit de opgave. */
(function(){
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ggd = (a, b)=>{ a = Math.abs(a); b = Math.abs(b); while(b){ const t = a % b; a = b; b = t; } return a; };
const nat = x => { const t = String(x == null ? '' : x).trim(); return /^\d{1,9}$/.test(t) ? +t : null; };
const neg = s => s === '−' || s === '-';
const fmt = n => n < 0 ? '−' + Math.abs(n) : String(n);
const fmtN = n => n == null || isNaN(n) ? '…' : fmt(n);
const sq = n => Math.round(Math.sqrt(n));
const leeg = '<span class="tl-leeg">……</span>';

/* ---------- machten, wortels en breuken tonen (ook in het dashboard en de pdf: de stijl komt uit opgave.css) ---------- */
const brS = (t, n) => `<span class="br"><span class="br-t">${t}</span><span class="br-n">${n}</span></span>`;
const br = (num, den) => (num < 0 ? '−' : '') + (den === 1 ? `<span class="br-int">${Math.abs(num)}</span>` : brS(Math.abs(num), den));
/* haakjes over de volle hoogte (ook rond breuken) */
const PARL = '<span class="h6-hk" aria-hidden="true"><svg viewBox="0 0 10 100" preserveAspectRatio="none"><path d="M8.5 2 Q0.5 50 8.5 98"/></svg></span>';
const PARR = '<span class="h6-hk" aria-hidden="true"><svg viewBox="0 0 10 100" preserveAspectRatio="none"><path d="M1.5 2 Q9.5 50 1.5 98"/></svg></span>';
const PW = inner => `<span class="h6-hkw">${PARL}<span class="h6-hkin">${inner}</span>${PARR}</span>`;
const macht = (grond, exp, buiten) => `<span class="h6-pw">${buiten ? '<span class="h6-pwout">−</span>' : ''}${grond}<sup>${exp}</sup></span>`;
const powHTML = (b, exp, buiten) => macht(b < 0 ? PW('−' + Math.abs(b)) : String(b), exp, buiten);
/* wortelteken: de V staat op de schrijflijn, de streep loopt over alles */
const RTV = '<span class="h6-rtv" aria-hidden="true"><svg viewBox="0 0 20 100" preserveAspectRatio="none"><path d="M0.5 62 L5 55 L10.5 99 L20 0"/></svg></span>';
const rootHTML = (inner, buiten) => `<span class="h6-rt">${buiten ? '<span class="h6-rtout">−</span>' : ''}${RTV}<span class="h6-rtin">${inner}</span></span>`;
const opgaveBox = html => `<div class="h6-opgave"><span class="h6-olab">Opgave</span><span class="h6-oexpr">${html}</span></div>`;

/* ---------- oefeningen ---------- */
const E = (id, soort, punten, vraag, extra) => Object.assign({ id, type:'eigen', soort, punten, vraag }, extra);
const pow = (id, b, exp, out, vis, punten, vraag, instr) => E(id, 'power', punten, vraag, Object.assign({ b, exp, out:out || '' }, vis ? { vis } : {}, instr ? { instr } : {}));
const tweeling = (id, parts) => E(id, 'twins2', 1.5, 'Let op de haakjes: wat is telkens het grondtal?', { parts });
const fpow = (id, t, n, exp, ng) => E(id, 'fpow', 2, `Bereken ${macht(PW((ng ? '−' : '') + brS(t, n)), exp)}.`, { t, n, exp, neg:ng });
const dpow = (id, d, ng, exp) => E(id, 'dpow', 1.5, `Bereken (${ng ? '−' : ''}${d})${exp === 2 ? '²' : '³'} met het stappenplan.`, { d, neg:ng, exp });
const wortel = (id, n) => E(id, 'root', 1.5, `Bereken √${n}. Zoek het vierkant met oppervlakte ${n}.`, { n });
const opties = l => l.map((text, i)=>({ id:'abcd'[i], text }));
const DELEN = [
  { titel:'Wat is een macht?', vragen:[
    pow('ex01', 5, 2, '', 'square', 2, 'Bereken 5². Bouw eerst zelf het vierkant.',
      '① Bouw een rij met ＋ en zet ze vast met het slotje. ② Neem de rij een aantal keer en zet vast. Staat het juiste vierkant er, dan worden alle vakjes genummerd. ③ Schrijf de macht als herhaalde vermenigvuldiging en reken uit.'),
    pow('ex02', 7, 2, '−', 'square', 2, 'Bereken −7². Bouw eerst zelf het vierkant. Let op: wat is het grondtal?',
      'Zonder haakjes hoort het minteken niet bij het grondtal. ① Bouw het vierkant van het grondtal: een rij met ＋, vastzetten, dan het aantal rijen, vastzetten. ② Schrijf de herhaalde vermenigvuldiging. ③ Kies het toestandsteken en reken uit.'),
    pow('ex03', -3, 3, '', 'cube', 2, 'Bereken (−3)³. Bouw eerst zelf de kubus.',
      '① Bouw een rij met ＋ en zet ze vast. ② Neem de rij een aantal keer: een vlak. ③ Stapel het vlak. De blokjes tellen hoeveel het er zijn; het minteken zit in de vermenigvuldiging. ④ Klik de minnen per twee weg, kies het toestandsteken en reken uit.'),
    pow('ex04', 5, 3, '', 'cube', 2, 'Bereken 5³. Bouw eerst zelf de kubus.',
      '① Bouw een rij met ＋ en zet ze vast. ② Neem de rij een aantal keer: een vlak. ③ Stapel het vlak. De blokjes worden geteld. ④ Schrijf de herhaalde vermenigvuldiging, kies het toestandsteken en reken uit.') ] },
  { titel:'Machten met een minteken', vragen:[
    pow('ex05', -10, 2, '', null, 1.5, 'Bereken (−10)². Klik de minnen per twee weg.'),
    pow('ex06', -1, 5, '', null, 1.5, 'Bereken (−1)⁵. Klik de minnen per twee weg.'),
    pow('ex07', -2, 4, '', null, 1.5, 'Bereken (−2)⁴. Klik de minnen per twee weg.') ] },
  { titel:'Haakjes of niet?', vragen:[
    tweeling('ex08', [{ b:-3, exp:2, out:'' }, { b:3, exp:2, out:'−' }]),
    tweeling('ex09', [{ b:-4, exp:2, out:'' }, { b:-4, exp:2, out:'−' }]),
    tweeling('ex10', [{ b:-2, exp:4, out:'' }, { b:2, exp:4, out:'−' }]) ] },
  { titel:'Machten van breuken', vragen:[ fpow('ex11', 1, 10, 3, false), fpow('ex12', 1, 2, 4, true), fpow('ex13', 3, 2, 3, true), fpow('ex14', 2, 3, 4, true) ] },
  { titel:'Machten van kommagetallen', vragen:[ dpow('ex15', '0,3', false, 2), dpow('ex16', '0,2', true, 3) ] },
  { titel:'Vierkantswortels', vragen:[ wortel('ex17', 16), wortel('ex18', 49), wortel('ex19', 196) ] },
  { titel:'Wortels verder', vragen:[
    E('ex20', 'rootx', 1.5, 'Bereken −√169.', { kind:'int', n:169, out:'−' }),
    E('ex21', 'rootx', 1.5, `Bereken ${rootHTML(brS(100, 49), true)}.`, { kind:'frac', t:100, n:49, out:'−' }),
    E('ex22', 'rootx', 1.5, `Bereken ${rootHTML(brS(121, 64))}.`, { kind:'frac', t:121, n:64, out:'' }),
    E('ex23', 'rootx', 1.5, 'Bereken −√0,25. Welk kommagetal maal zichzelf geeft 0,25?', { kind:'dec', d:'0,25', out:'−' }) ] },
  { titel:'Weetjes', vragen:[
    E('ex24', 'facts', 2, 'Deze kwadraten en wortels ken je van buiten. Let op het teken. Vul aan.',
      { rows:[['pow', 11], ['pow', 12, '−'], ['pow', -13], ['pow', 14, '−'], ['pow', 15], ['root', 121, '−'], ['root', 144], ['root', 225, '−']] }) ] },
  { titel:'Vraagstukken', vragen:[
    E('ex25', 'ctx7', 1.5, 'Een vierkant plein heeft een zijde van 12 m. Hoe groot is de oppervlakte van het plein?', { kind:'pow2', b:12, unit:'m²', vis:'square', resLabel:'Oppervlakte van het plein' }),
    E('ex26', 'ctx7', 1.5, 'Een vierkante tuin heeft een oppervlakte van 169 m². Rond de tuin komt een haag. Hoe lang wordt de haag (de omtrek van de tuin)?', { kind:'omtrek', b:169, unit:'m', vis:'square', resLabel:'Omtrek van de tuin' }),
    E('ex27', 'ctx7', 1.5, 'Jules bouwt een kubus van 4 blokjes hoog, 4 blokjes breed en 4 blokjes diep. Hoeveel blokjes heeft hij nodig?', { kind:'pow3', b:4, unit:'blokjes', vis:'cube', resLabel:'Aantal blokjes' }) ] },
  { titel:'Foutenjager', vragen:[
    E('ex28', 'errpow', 1.5, 'Wout maakte een fout. Kan jij ze vinden?', { who:'Wout', wrong:'8', b:-2, exp:3, out:'',
      options:opties(['Niets, de berekening is juist.', 'Drie minnen is oneven: de uitkomst is negatief.', 'Hij moest 2 ⋅ 3 rekenen.', 'Het grondtal is 2, niet −2.']) }),
    E('ex29', 'errpow', 1.5, 'Nora maakte een fout. Kan jij ze vinden?', { who:'Nora', wrong:'16', b:4, exp:2, out:'−',
      options:opties(['Zonder haakjes hoort het minteken niet bij het grondtal: −4² = −(4 ⋅ 4).', 'Niets, de berekening is juist.', 'Ze moest 4 ⋅ 2 rekenen.', 'Twee minnen maken plus.']) }),
    E('ex30', 'errpow', 1.5, 'Ilias maakte een fout. Kan jij ze vinden?', { who:'Ilias', root:true, n:25,
      options:opties(['Niets, de berekening is juist.', 'Hij moest eerst optellen onder de wortel: √25 = 5.', '√9 is 4,5.', 'De uitkomst moet negatief zijn.']) }) ] }
];
const UITLEG = {
  power:'① Hoeveel keer staat het grondtal naast elkaar in de vermenigvuldiging? ② Klik telkens twee minnen aan: samen worden ze plus en verdwijnen ze. ③ Kies het toestandsteken en reken uit.',
  twins2:'Duid eerst aan wat het grondtal is. Staan er haakjes, dan hoort het minteken erbij. Je ziet dan de volledige vermenigvuldiging. Klik de minnen per twee weg en reken uit.',
  fpow:'① Schrijf de macht als een herhaalde vermenigvuldiging. ② Klik de minnen per twee weg. ③ Teller maal teller, noemer maal noemer, met het juiste toestandsteken. ④ Vereenvoudigen of niet.',
  dpow:'① Schrijf de macht als een herhaalde vermenigvuldiging en klik de minnen per twee weg. ② We denken de komma’s weg en rekenen uit. ③ Tel de cijfers na de komma samen: de komma schuift op zijn plaats.',
  root:'√16 vraagt: welk vierkant heeft oppervlakte 16? Maak de zijde groter of kleiner. Elk vakje krijgt een nummer: zo tel je de oppervlakte.',
  rootx:'Een minteken vóór de wortel hoort niet onder de wortel. Bij een breuk: wortel van de teller en wortel van de noemer. Bij een kommagetal: welk kommagetal maal zichzelf geeft het getal onder de wortel?',
  facts:'Deze ken je van buiten: de kwadraten tot 15 en hun wortels.',
  ctx7:'Vul de bewerking in en noteer het antwoord met de juiste eenheid. Een tekening op je kladblad helpt.',
  errpow:'Kies wat er fout ging en noteer de juiste uitkomst.'
};
const BEGRIPPEN = {
  'macht':'Een korte schrijfwijze voor een herhaalde vermenigvuldiging: 2⁵ = 2 ⋅ 2 ⋅ 2 ⋅ 2 ⋅ 2.',
  'grondtal':'Het getal dat je herhaald vermenigvuldigt. In (−3)² is dat −3, in −3² is dat 3.',
  'exponent':'Het kleine getal rechtsboven: het zegt hoeveel keer het grondtal naast elkaar staat in de vermenigvuldiging.',
  'omtrek':'De lengte van de rand rondom een figuur.',
  'kwadraat':'De tweede macht van een getal: 5² = 25. Zo groot is het vierkant met zijde 5.',
  'vierkantswortel':'√25 = 5, want 5 ⋅ 5 = 25. Het is de zijde van het vierkant met die oppervlakte.',
  'vereenvoudig':'Teller en noemer door hetzelfde getal delen tot het niet meer kan.',
  'kladblad':'Een blad papier waarop je je berekening noteert.'
};
const CODES = {
  GRONDTAL_FOUT:{ label:'Verkeerd grondtal aangeduid', uitleg:'Bij (−3)² hoort het minteken bij het grondtal, bij −3² niet.' },
  HAAKJES:{ label:'Haakjes over het hoofd gezien', uitleg:'−3² is niet hetzelfde als (−3)²: zonder haakjes blijft het minteken buiten de macht.' },
  TEKEN_MACHT:{ label:'Tekenregel bij machten', uitleg:'Een even aantal minnen geeft een positieve uitkomst, een oneven aantal een negatieve.' },
  MAAL_EXPONENT:{ label:'Grondtal maal exponent', uitleg:'De leerling rekende bv. 5² als 5 ⋅ 2 in plaats van 5 ⋅ 5.' },
  FACTOR_AANTAL:{ label:'Aantal factoren fout', uitleg:'De macht werd niet als evenveel factoren geschreven als de exponent aangeeft.' },
  BOUW_FOUT:{ label:'Vierkant of kubus fout gebouwd', uitleg:'Rij, aantal rijen of aantal lagen klopt niet met het grondtal (of de bouw werd niet afgewerkt).' },
  MINNEN_NIET_GEPAARD:{ label:'Minnen niet per twee weggeklikt', uitleg:'In de herhaalde vermenigvuldiging bleven paren minnen staan die samen plus worden.' },
  TELLER_OF_NOEMER:{ label:'Enkel teller of enkel noemer tot de macht', uitleg:'Bij een macht van een breuk moeten teller én noemer tot de macht.' },
  KOMMA_TELLEN:{ label:'Cijfers na de komma fout geteld', uitleg:'Bij een macht is het aantal cijfers na de komma: aantal cijfers maal de exponent.' },
  WORTEL_KOMMA:{ label:'Verkeerd kommagetal bij de wortel', uitleg:'√0,25 = 0,5 want 0,5 ⋅ 0,5 = 0,25 (twee cijfers na de komma). Niet 0,05 of 0,125.' },
  WORTEL_HELFT:{ label:'Helft in plaats van wortel', uitleg:'√16 is niet 8: het is het getal dat met zichzelf vermenigvuldigd 16 geeft.' },
  WORTEL_TEKEN:{ label:'Teken bij de wortel', uitleg:'Het minteken vóór de wortel hoort er nog bij: −√169 = −13.' },
  WORTEL_SOM:{ label:'Wortel van een som gesplitst', uitleg:'√(9 + 16) is niet √9 + √16: eerst optellen onder de wortel.' },
  ZIJDE_NIET_GEZOCHT:{ label:'Vierkant niet gezocht', uitleg:'Het vierkant met de juiste oppervlakte werd niet gezocht met de knoppen − en + bij de zijde.' },
  NIET_VEREENVOUDIGD:{ label:'Niet (volledig) vereenvoudigd', uitleg:'De uitkomst klopt, maar staat niet in de eenvoudigste vorm.' },
  ONTERECHT_NIET:{ label:'"Kan niet eenvoudiger" terwijl het wel kon', uitleg:'Op "kan niet eenvoudiger" geklikt bij een breuk die nog vereenvoudigd kon worden (rood kruisje).' },
  SCHAAR_ONMOGELIJK:{ label:'Onmogelijk knipgetal', uitleg:'Proberen knippen door een getal dat geen deler is van teller en noemer (rood kruisje).' },
  TE_VROEG_KLAAR:{ label:'Te vroeg "klaar"', uitleg:'Op "Klaar met vereenvoudigen" geklikt terwijl er nog verder geknipt kon worden.' },
  SJABLOON_FOUT:{ label:'Bewerking fout ingevuld', uitleg:'Het getal in de bewerking past niet bij het vraagstuk.' },
  OMTREK_OPP:{ label:'Omtrek verward met oppervlakte', uitleg:'De omtrek van een vierkant is 4 ⋅ zijde, niet zijde ⋅ zijde.' },
  EXPONENT_FOUT:{ label:'Verkeerde exponent', uitleg:'Een kubus van 4 bij 4 bij 4 is 4³ (drie keer 4 als factor).' },
  REKENFOUT:{ label:'Rekenfout', uitleg:'Een andere fout in de uitkomst.' },
  FOUTENJAGER:{ label:'Verkeerde fout aangeduid', uitleg:'Bij de foutenjager niet de echte fout gekozen.' }
};

/* ---------- rekenhulp (zoals code.gs) ---------- */
const F = () => ({ s1:null, t:'', n:'' });
const SN = () => ({ s:null, n:'' });
const SCH = () => ({ mode:null, cuts:[], done:false, for:null, x:0, nv:0, sx:0 });
const MP = () => ({ p:[], x:0 });
const BLD = () => ({ a:0, ra:false, r:1, rr:false, l:1, ll:false, num:false });
const sig = b => b ? b.num + '/' + b.den : '';
const isRed = f => !!f && (f.num === 0 ? f.den === 1 : ggd(f.num, f.den) === 1);
const zelfde = (a, b) => !!a && !!b && a.num * b.den === b.num * a.den;
const naKnip = (b, cuts) => { let num = Math.abs(b.num), den = b.den;
  for(const c of cuts || []){ const g = +c; if(g > 1 && num % g === 0 && den % g === 0){ num /= g; den /= g; } else break; }
  return { num:b.num < 0 ? -num : num, den }; };
const eindVan = (b, sch) => !b || !sch || !sch.done || sch.for !== sig(b) ? null : naKnip(b, sch.cuts);
const schOK = (sch, b) => !!eindVan(b, sch);
const sgn = s => neg(s) ? '−' : s === '' || s === '+' ? '' : null;
const sval = o => { if(!o || o.s == null) return null; const n = nat(o.n); return n === null ? null : neg(o.s) ? -n : n; };
const decTekst = s => { const t = String(s == null ? '' : s).trim().replace('.', ','); return /^\d{1,9}(,\d{1,9})?$/.test(t) ? t : null; };
const decVal = o => { if(!o || o.s == null) return null; const t = decTekst(o.n); if(!t) return null; const p = t.split(','), d = p[1] || ''; const num = +(p[0] + d);
  return { num:neg(o.s) ? -num : num, den:10 ** d.length }; };
const decPl = s => (String(s).split(',')[1] || '').length;
const decTxt = (num, den) => { const D = String(den).length - 1, a = String(Math.abs(num)).padStart(D + 1, '0');
  return (num < 0 ? '−' : '') + (D ? (a.slice(0, a.length - D) + ',' + a.slice(a.length - D)).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '') : a); };
const fval = o => { if(!o || o.s1 == null) return null; const t = nat(o.t), n = nat(o.n); return t === null || !n ? null : { num:neg(o.s1) ? -t : t, den:n }; };
const snOK = (o, soort) => !!o && o.s != null && (soort === 'dec' ? decTekst(o.n) : nat(o.n)) !== null;
const paren = mp => mp && Array.isArray(mp.p) ? mp.p.length : Array.isArray(mp) ? mp.length : 0;
const machtE = (b, exp, out) => b ** exp * (out === '−' ? -1 : 1);
const twinOuter = (p, g) => (p.out === '−' ? 1 : 0) + (p.b < 0 ? 1 : 0) - (g === 'm' ? 1 : 0);
const factE = row => (row[0] === 'pow' ? row[1] * row[1] : sq(row[1])) * (row[2] === '−' ? -1 : 1);
const errE = q => q.root ? sq(q.n) : machtE(q.b, q.exp, q.out);
const dpowInfo = q => ({ wi:(+q.d.replace(',', '')) ** q.exp, wc:decPl(q.d) * q.exp, want:q.neg && q.exp % 2 === 1 ? '−' : '' });
const rootDec = q => { const t0 = +q.d.replace(',', ''), den0 = 10 ** decPl(q.d); return { t0, W:{ num:sq(t0), den:sq(den0) } }; };
function schCodes(sch, out){ if(!sch) return; const x = +sch.x || 0, sx = +sch.sx || 0, nv = +sch.nv || 0;
  if(x) out.codes.push('SCHAAR_ONMOGELIJK'); if(sx) out.codes.push('ONTERECHT_NIET'); if(nv) out.codes.push('TE_VROEG_KLAAR'); out.kruis += x + sx; }
function minusCodes(k, hasMin, outer, mp, codes){ const tot = (hasMin ? k || 0 : 0) + (outer || 0); if(Math.floor(tot / 2) > paren(mp) && k) codes.push('MINNEN_NIET_GEPAARD'); }
const bouwOK = (q, B) => { if(!B) return false; const a = Math.abs(q.b);
  return q.vis === 'square' ? B.ra && B.rr && B.a === a && B.r === a : B.ra && B.rr && B.ll && B.a === a && B.r === a && B.l === a; };

const VERBETER = {
  power(q, v){
    let pts = 0; const codes = [], outer = q.out === '−' ? 1 : 0, Ev = machtE(q.b, q.exp, q.out);
    if(q.vis){ if(bouwOK(q, v.bld)) pts += .5; else codes.push('BOUW_FOUT'); }
    const k = nat(v.n);
    if(k === q.exp) pts += .5; else if(k !== null) codes.push('FACTOR_AANTAL');
    minusCodes(k, q.b < 0, outer, v.mp, codes);
    const r = sval(v.res);
    if(r === Ev) pts += 1;
    else if(r !== null){
      if(Math.abs(r) === Math.abs(q.b) * q.exp) codes.push('MAAL_EXPONENT');
      else if(r === -Ev) codes.push(outer ? 'HAAKJES' : 'TEKEN_MACHT');
      else if(k !== null && k !== q.exp && Math.abs(r) === Math.abs(q.b) ** k) codes.push('FACTOR_AANTAL');
      else codes.push('REKENFOUT');
    }
    return { pts, codes, kruis:0 };
  },
  twins2(q, v){
    let pts = 0; const codes = [];
    q.parts.forEach((p, i)=>{ const st = (v.parts || [])[i] || {}, Ev = machtE(p.b, p.exp, p.out);
      if(st.g === (p.b < 0 ? 'm' : 'p')) pts += .25; else if(st.g) codes.push('GRONDTAL_FOUT');
      const r = sval(st.res);
      if(r === Ev) pts += .5;
      else if(r !== null) codes.push(r === -Ev ? 'HAAKJES' : r === Math.abs(p.b) * p.exp ? 'MAAL_EXPONENT' : 'REKENFOUT'); });
    return { pts, codes, kruis:0 };
  },
  fpow(q, v){
    let pts = 0; const codes = [], out = { codes:[], kruis:0 }, Et = q.t ** q.exp, En = q.n ** q.exp, want = q.neg && q.exp % 2 === 1 ? '−' : '';
    const k = nat(v.n);
    if(k === q.exp) pts += .25; else if(k !== null) codes.push('FACTOR_AANTAL');
    minusCodes(k, q.neg, 0, v.mp, codes);
    const res = v.res || {}, s0 = sgn(v.s0), s1 = sgn(res.s1), pt = nat(res.t), pn = nat(res.n);
    if(s0 === want) pts += .25; else if(s0 !== null) codes.push('TEKEN_MACHT');
    if(pt === Et) pts += .5; else if(pt !== null) codes.push(pt === q.t ? 'TELLER_OF_NOEMER' : pt === q.t * q.exp ? 'MAAL_EXPONENT' : 'REKENFOUT');
    if(pn === En) pts += .5; else if(pn !== null) codes.push(pn === q.n ? 'TELLER_OF_NOEMER' : pn === q.n * q.exp ? 'MAAL_EXPONENT' : 'REKENFOUT');
    if(s1 === want) pts += .25; else if(s1 !== null) codes.push('TEKEN_MACHT');
    const base = pt !== null && pn && s1 !== null ? { num:s1 === '−' ? -pt : pt, den:pn } : null, fin = eindVan(base, v.sch);
    if(base && pt === Et && pn === En){ if(fin && isRed(fin)) pts += .25; else codes.push('NIET_VEREENVOUDIGD'); }
    schCodes(v.sch, out);
    return { pts, codes:codes.concat(out.codes), kruis:out.kruis };
  },
  dpow(q, v){
    let pts = 0; const codes = [], { wi, wc, want } = dpowInfo(q), k = nat(v.n), i = nat(v.i), c = nat(v.cnt), s = sgn(v.s);
    if(k === q.exp) pts += .25; else if(k !== null) codes.push('FACTOR_AANTAL');
    minusCodes(k, q.neg, 0, v.mp, codes);
    if(i === wi) pts += .5; else if(i !== null) codes.push('REKENFOUT');
    if(c === wc) pts += .5; else if(c !== null) codes.push('KOMMA_TELLEN');
    if(s === want) pts += .25; else if(s !== null) codes.push('TEKEN_MACHT');
    return { pts, codes, kruis:0 };
  },
  root(q, v){
    let pts = 0; const codes = [], W = sq(q.n), side = +v.side || 0, r = nat(v.res);
    if(side * side === q.n) pts += .5; else codes.push('ZIJDE_NIET_GEZOCHT');
    if(r === W) pts += 1; else if(r !== null) codes.push(r === q.n / 2 ? 'WORTEL_HELFT' : 'REKENFOUT');
    return { pts, codes, kruis:0 };
  },
  rootx(q, v){
    let pts = 0; const codes = [], out = { codes:[], kruis:0 };
    if(q.kind === 'int'){
      const W = sq(q.n), Ev = q.out === '−' ? -W : W, r = nat(v.r), res = sval(v.res);
      if(r === W) pts += .75; else if(r !== null) codes.push(r === q.n / 2 ? 'WORTEL_HELFT' : 'REKENFOUT');
      if(res === Ev) pts += .75; else if(res !== null) codes.push(res === -Ev ? 'WORTEL_TEKEN' : 'REKENFOUT');
      return { pts, codes, kruis:0 };
    }
    if(q.kind === 'frac'){
      const Wt = sq(q.t), Wn = sq(q.n), want = q.out === '−' ? '−' : '', res = v.res || {}, rt = nat(res.t), rn = nat(res.n), s1 = sgn(res.s1);
      if(s1 === want) pts += .25; else if(s1 !== null) codes.push('WORTEL_TEKEN');
      if(rt === Wt) pts += .5; else if(rt !== null) codes.push(rt === q.t / 2 ? 'WORTEL_HELFT' : 'REKENFOUT');
      if(rn === Wn) pts += .5; else if(rn !== null) codes.push(rn === q.n / 2 ? 'WORTEL_HELFT' : 'REKENFOUT');
      const base = rt !== null && rn && s1 !== null ? { num:s1 === '−' ? -rt : rt, den:rn } : null, fin = eindVan(base, v.sch);
      if(base && rt === Wt && rn === Wn){ if(fin && isRed(fin)) pts += .25; else codes.push('NIET_VEREENVOUDIGD'); }
      schCodes(v.sch, out);
      return { pts, codes:codes.concat(out.codes), kruis:out.kruis };
    }
    /* kommagetal: welk kommagetal maal zichzelf geeft q.d? */
    const { t0, W } = rootDec(q), x = decVal({ s:'', n:v.x }), i = nat(v.i), c = nat(v.cnt), res = decVal(v.res);
    if(x && zelfde(x, W)) pts += .5; else if(x) codes.push('WORTEL_KOMMA');
    if(i === t0) pts += .25; else if(i !== null) codes.push('REKENFOUT');
    if(c === decPl(q.d)) pts += .25; else if(c !== null) codes.push('KOMMA_TELLEN');
    const Ev = { num:q.out === '−' ? -W.num : W.num, den:W.den };
    if(res && zelfde(res, Ev)) pts += .5; else if(res) codes.push(zelfde(res, { num:-Ev.num, den:Ev.den }) ? 'WORTEL_TEKEN' : 'WORTEL_KOMMA');
    return { pts, codes, kruis:0 };
  },
  facts(q, v){
    let pts = 0; const codes = [];
    q.rows.forEach((row, i)=>{ const isNeg = row[2] === '−', Ev = factE(row), r = sval((v.rows || [])[i]);
      if(r === Ev) pts += q.punten / q.rows.length;
      else if(r !== null){
        if(r === -Ev) codes.push(row[0] === 'root' ? 'WORTEL_TEKEN' : isNeg ? 'HAAKJES' : 'TEKEN_MACHT');
        else if(row[0] === 'root' && Math.abs(r) === row[1] / 2) codes.push('WORTEL_HELFT');
        else if(row[0] === 'pow' && Math.abs(r) === Math.abs(row[1]) * 2) codes.push('MAAL_EXPONENT');
        else codes.push('REKENFOUT');
      } });
    return { pts, codes, kruis:0 };
  },
  ctx7(q, v){
    let pts = 0; const codes = [], b = nat(v.b), res = decVal(v.res), een = n => ({ num:n, den:1 });
    if(q.kind === 'omtrek'){
      const Z = sq(q.b), z = decVal(v.z), f1 = decVal({ s:'', n:v.f1 }), f2 = decVal({ s:'', n:v.f2 }), is = (f, n) => f && zelfde(f, een(n));
      if(b === q.b) pts += .25; else if(b !== null) codes.push('SJABLOON_FOUT');
      if(z && zelfde(z, een(Z))) pts += .25; else if(z) codes.push(zelfde(z, een(q.b / 2)) ? 'WORTEL_HELFT' : 'REKENFOUT');
      if(f1 && f2){ if((is(f1, 4) && is(f2, Z)) || (is(f1, Z) && is(f2, 4))) pts += .5; else codes.push(is(f1, Z) && is(f2, Z) ? 'OMTREK_OPP' : 'SJABLOON_FOUT'); }
      if(res && zelfde(res, een(4 * Z))) pts += .5; else if(res) codes.push(zelfde(res, een(q.b)) ? 'OMTREK_OPP' : 'REKENFOUT');
      return { pts, codes, kruis:0 };
    }
    const p = q.kind === 'pow3' ? 3 : 2, Ev = q.b ** p;
    if(q.kind === 'pow3'){ const e = nat(v.e);
      if(b === q.b) pts += .25; else if(b !== null) codes.push('SJABLOON_FOUT');
      if(e === 3) pts += .25; else if(e !== null) codes.push('EXPONENT_FOUT'); }
    else if(b === q.b) pts += .5; else if(b !== null) codes.push('SJABLOON_FOUT');
    if(res && zelfde(res, een(Ev))) pts += 1; else if(res) codes.push(zelfde(res, een(q.b * p)) ? 'MAAL_EXPONENT' : 'REKENFOUT');
    return { pts, codes, kruis:0 };
  },
  errpow(q, v, k){
    let pts = 0; const codes = [], Ev = errE(q), r = sval(v.res);
    if(k && k.good){ if(v.choice === k.good) pts += .75; else if(v.choice) codes.push('FOUTENJAGER'); }
    if(r === Ev) pts += .75;
    else if(r !== null) codes.push(q.root && r === 7 ? 'WORTEL_SOM' : r === -Ev ? (q.out === '−' ? 'HAAKJES' : 'TEKEN_MACHT') : 'REKENFOUT');
    return { pts, codes, kruis:0 };
  }
};

/* ---------- volledig ingevuld? (zoals het oorspronkelijke Oefening.html) ---------- */
const VOLLEDIG = {
  power:(q, v)=>nat(v.n) !== null && snOK(v.res),
  twins2:(q, v)=>v.parts.every(p=>!!p.g && snOK(p.res)),
  fpow:(q, v)=>nat(v.n) !== null && v.s0 != null && schOK(v.sch, fval(v.res)),
  dpow:(q, v)=>nat(v.n) !== null && nat(v.i) !== null && nat(v.cnt) !== null && v.s != null,
  root:(q, v)=>nat(v.res) !== null,
  rootx:(q, v)=>q.kind === 'int' ? nat(v.r) !== null && snOK(v.res) : q.kind === 'frac' ? schOK(v.sch, fval(v.res))
    : decTekst(v.x) !== null && nat(v.i) !== null && nat(v.cnt) !== null && snOK(v.res, 'dec'),
  facts:(q, v)=>v.rows.every(r=>snOK(r)),
  ctx7:(q, v)=>q.kind === 'omtrek' ? nat(v.b) !== null && snOK(v.z, 'dec') && decTekst(v.f1) !== null && decTekst(v.f2) !== null && snOK(v.res, 'dec')
    : nat(v.b) !== null && (q.kind !== 'pow3' || nat(v.e) !== null) && snOK(v.res, 'dec'),
  errpow:(q, v)=>!!v.choice && snOK(v.res)
};
const LEEG = {
  power:q=>q.vis ? { bld:BLD(), n:'', mp:MP(), res:SN() } : { n:'', mp:MP(), res:SN() },
  twins2:q=>({ parts:q.parts.map(()=>({ g:null, mp:MP(), res:SN() })) }),
  fpow:()=>({ n:'', mp:MP(), s0:null, res:F(), sch:SCH() }),
  dpow:()=>({ n:'', mp:MP(), i:'', cnt:'', s:null }),
  root:()=>({ side:1, res:'' }),
  rootx:q=>q.kind === 'int' ? { r:'', res:SN() } : q.kind === 'frac' ? { res:F(), sch:SCH() } : { x:'', i:'', cnt:'', res:SN() },
  facts:q=>({ rows:q.rows.map(()=>SN()) }),
  ctx7:q=>q.kind === 'omtrek' ? { b:'', z:SN(), f1:'', f2:'', res:SN() } : q.kind === 'pow3' ? { b:'', e:'', res:SN() } : { b:'', res:SN() },
  errpow:()=>({ choice:null, res:SN() })
};

/* ---------- figuren: vierkant met genummerde vakjes, kubus van blokjes ---------- */
function gridSVG(cols, rows, o = {}){
  const S = o.S || 44, W = Math.max(cols, 1) * S, H = Math.max(rows, 1) * S, fs = S * (String(cols * rows).length >= 3 ? .34 : .42); let h = '';
  if(!cols) h += `<rect x="0" y="0" width="${S}" height="${S}" rx="4" fill="none" stroke="#9fb3b6" stroke-width="2" stroke-dasharray="5 4"/><text x="${S / 2}" y="${S / 2 + 6}" text-anchor="middle" font-size="18" font-weight="900" fill="#9fb3b6">+</text>`;
  for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++){
    const i = r * cols + c + 1;
    h += `<rect x="${c * S}" y="${r * S}" width="${S - 2}" height="${S - 2}" rx="${Math.min(4, S / 8)}" fill="${o.fill || '#4db6ac'}" stroke="#17313a" stroke-width="1"/>`;
    if(o.nums) h += `<text class="h6-gn${o.shown == null || i <= o.shown ? ' aan' : ''}" data-n="${i}" x="${c * S + (S - 2) / 2}" y="${r * S + (S - 2) / 2 + fs * .36}" text-anchor="middle" font-size="${fs.toFixed(1)}">${i}</text>`;
  }
  if(o.lab){
    h += `<text x="${W / 2}" y="${H + 22}" text-anchor="middle" font-size="15" font-weight="800" fill="#35545a">${o.lab[0]}</text>`;
    h += `<text x="${W + 10}" y="${H / 2 + 5}" font-size="15" font-weight="800" fill="#35545a">${o.lab[1]}</text>`;
  }
  return `<svg class="vis-svg h6-grid" viewBox="-4 -4 ${W + (o.lab ? 70 : 10)} ${H + (o.lab ? 34 : 10)}" aria-label="Vierkant">${h}</svg>`;
}
/* gele kubusjes: nx naast elkaar, nd rijen naar achter, nl lagen hoog */
function cubesSVG(nx, nd, nl, o = {}){
  const S = o.S || 34, dx = S * .5, dy = S * .36, cells = [];
  for(let l = 0; l < nl; l++) for(let d = 0; d < nd; d++) for(let c = 0; c < nx; c++) cells.push({ c, d, l, i:cells.length + 1 });
  const Wt = Math.max(nx, 1) * S + nd * dx, Ht = Math.max(nl, 1) * S + nd * dy; let h = '';
  if(!nx) h += `<rect x="0" y="${Ht - S}" width="${S}" height="${S}" rx="3" fill="none" stroke="#c9a400" stroke-width="2" stroke-dasharray="5 4"/><text x="${S / 2}" y="${Ht - S / 2 + 6}" text-anchor="middle" font-size="18" font-weight="900" fill="#c9a400">+</text>`;
  cells.slice().sort((p, q)=>(q.d - p.d) || (p.l - q.l) || (p.c - q.c)).forEach(p=>{
    const X = p.c * S + p.d * dx, Y = Ht - S - p.l * S - p.d * dy;
    h += `<g class="h6-cb${o.shown != null && p.i <= o.shown ? ' aan' : ''}" data-i="${p.i}"><path class="cf" d="M${X} ${Y} h${S} v${S} h${-S} z"/>`
      + `<path class="ct" d="M${X} ${Y} l${dx} ${-dy} h${S} l${-dx} ${dy} z"/><path class="cr" d="M${X + S} ${Y} l${dx} ${-dy} v${S} l${-dx} ${dy} z"/></g>`;
  });
  if(o.lab){
    h += `<text x="${nx * S / 2}" y="${Ht + 20}" text-anchor="middle" font-size="15" font-weight="800" fill="#6d4c00">${o.lab}</text>`;
    h += `<text x="-10" y="${Ht - nl * S / 2 + 5}" text-anchor="end" font-size="15" font-weight="800" fill="#6d4c00">${o.lab}</text>`;
    h += `<text x="${nx * S + nd * dx / 2 + 10}" y="${Ht - nd * dy / 2 + 12}" font-size="15" font-weight="800" fill="#6d4c00">${o.lab}</text>`;
  }
  const padL = o.lab ? 90 : 6, padR = o.lab ? 100 : 12;
  return `<svg class="vis-svg h6-kubus" viewBox="${-padL} -6 ${Wt + padL + padR} ${Ht + (o.lab ? 30 : 12)}" aria-label="Kubus">${h}</svg>`;
}
function vraagFiguur(q){
  if(q.vis === 'cube') return cubesSVG(q.b, q.b, q.b, { S:30, lab:q.b + ' blokjes' });
  const side = q.kind === 'pow2' ? q.b : sq(q.b), S = Math.min(24, 300 / side), W = side * S, onb = q.kind !== 'pow2'; let g = '';
  for(let r = 0; r < side; r++) for(let c = 0; c < side; c++) g += `<rect x="${c * S}" y="${r * S}" width="${S - 1.5}" height="${S - 1.5}" rx="2" fill="#a5d6a7" stroke="#2e7d32" stroke-width="0.8"/>`;
  if(q.kind === 'omtrek') g += `<rect x="-5" y="-5" width="${W + 8.5}" height="${W + 8.5}" rx="5" fill="none" stroke="#6d4c41" stroke-width="5" stroke-dasharray="3 6" stroke-linecap="round"/>`;
  g += `<text x="${W / 2}" y="${W + 28}" text-anchor="middle" font-size="15" font-weight="800" fill="#2e7d32">${onb ? 'zijde = ?' : q.b + ' m'}</text>`;
  g += `<text x="${W + 16}" y="${W / 2}" font-size="15" font-weight="800" fill="#2e7d32">${onb ? '?' : q.b + ' m'}</text>`;
  if(onb) g += `<text x="${W / 2}" y="${W / 2 + 6}" text-anchor="middle" font-size="20" font-weight="900" fill="#1b5e20" paint-order="stroke" stroke="#fff" stroke-width="4">${q.b} m²</text>`;
  return `<svg class="vis-svg h6-plein" viewBox="-12 -12 ${W + 72} ${W + 52}" aria-label="Vierkant">${g}</svg>`
    + (q.kind === 'omtrek' ? '<div class="h6-haaglab"><span class="h6-haagsw"></span> haag rond de tuin</div>' : '');
}
const notitie = q => `<div class="h6-schrift"><div class="h6-snaam">✏️ Schrift van ${esc(q.who)}</div><div class="h6-slijn">${q.root
  ? `${rootHTML('9 + 16')} = ${rootHTML('9')} + ${rootHTML('16')} = 3 + 4 = 7` : `${powHTML(q.b, q.exp, q.out === '−')} = ${esc(q.wrong)}`}</div><div class="h6-stempel">?</div></div>`;
const errExpr = q => q.root ? rootHTML('9 + 16') : powHTML(q.b, q.exp, q.out === '−');
const factLab = r => r[0] === 'pow' ? powHTML(r[1], 2, r[2] === '−') : rootHTML(r[1], r[2] === '−');

/* ---------- lezen: dashboard, pdf, resultaat van de leerling ---------- */
function toon(q, a, modus, k){
  let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){}
  const blanco = modus === 'blanco', sl = modus === 'sleutel';
  if(modus === 'lezen' && !v) return '<p class="tl-niet">Niet ingevuld.</p>';
  if(!v || blanco || sl) v = LEEG[q.soort](q);
  const lijn = (l, r) => `<div class="tl"><span class="tl-l">${l}</span><span class="tl-r">${r}</span></div>`;
  const kr = () => '';   /* rode kruisjes: enkel directe feedback voor de leerling, niet in het dashboard of de pdf (keuze van Jeroen) */
  const w = (sleutel, eigen) => sl ? sleutel : blanco || eigen == null || eigen === '' ? leeg : eigen;
  const sn = o => sval(o) === null ? null : esc(fmt(sval(o)));
  const dn = o => decVal(o) ? esc((neg(o.s) ? '−' : '') + decTekst(o.n)) : null;
  const n0 = x => nat(x) === null ? null : esc(nat(x));
  const breuk = (b, sch, raw) => {
    if(!b) return raw && (raw.t || raw.n) ? esc((neg(raw.s1) ? '−' : '') + (raw.t || '…') + '/' + (raw.n || '…')) : null;
    const f = eindVan(b, sch);
    return br(b.num, b.den) + (f && (f.num !== b.num || f.den !== b.den) ? ' → ' + br(f.num, f.den) : '') + (sch && sch.mode === 'skip' && sch.done ? ' <i>(kan niet eenvoudiger)</i>' : '') + kr(sch && (+sch.x || 0) + (+sch.sx || 0));
  };
  const minnen = (k, hasMin, outer) => Math.floor(((hasMin ? k : 0) + outer) / 2);
  switch(q.soort){
    case 'power': {
      const a = Math.abs(q.b), B = v.bld || {}, outer = q.out === '−' ? 1 : 0;
      const bouw = q.vis ? lijn(q.vis === 'cube' ? 'Kubus:' : 'Vierkant:', w(q.vis === 'cube' ? `${a} × ${a} × ${a}` : `${a} × ${a}`,
        B.ra || B.a ? `${B.a || 0} × ${B.r || 1}` + (q.vis === 'cube' ? ` × ${B.l || 1}` : '') + (bouwOK(q, B) ? '' : ' (niet af)') : null)) : '';
      return '<div class="rv-lees">' + lijn('Opgave:', powHTML(q.b, q.exp, !!outer)) + bouw + lijn('Exponent:', w(q.exp, n0(v.n)))
        + (minnen(q.exp, q.b < 0, outer) ? lijn('Minnenparen:', w(minnen(q.exp, q.b < 0, outer), nat(v.n) === null ? null : paren(v.mp))) : '')
        + lijn('Uitkomst:', w(esc(fmt(machtE(q.b, q.exp, q.out))), sn(v.res))) + '</div>';
    }
    case 'twins2':
      return '<div class="rv-lees">' + q.parts.map((p, i)=>{ const st = v.parts[i] || {}, a = Math.abs(p.b);
        const grond = g => g === 'm' ? '−' + a : g === 'p' ? String(a) : null;
        return lijn(powHTML(p.b, p.exp, p.out === '−') + ' =', w(esc(fmt(machtE(p.b, p.exp, p.out))), sn(st.res)) + ` <span class="tl-l">grondtal</span> ` + w(esc(grond(p.b < 0 ? 'm' : 'p')), st.g ? esc(grond(st.g)) : null)); }).join('') + '</div>';
    case 'fpow': {
      const Et = q.t ** q.exp, En = q.n ** q.exp, want = q.neg && q.exp % 2 === 1 ? '−' : '+', Ev = { num:want === '−' ? -Et : Et, den:En }, R = naKnip(Ev, [ggd(Et, En)]);
      return '<div class="rv-lees">' + lijn('Opgave:', macht(PW((q.neg ? '−' : '') + brS(q.t, q.n)), q.exp)) + lijn('Exponent:', w(q.exp, n0(v.n)))
        + (q.neg ? lijn('Minnenparen:', w(Math.floor(q.exp / 2), nat(v.n) === null ? null : paren(v.mp))) : '')
        + lijn('Teken tussenstap:', w(want, v.s0 ? esc(v.s0) : null))
        + lijn('Uitkomst:', w(br(Ev.num, Ev.den) + (R.den !== Ev.den ? ' → ' + br(R.num, R.den) : ''), breuk(fval(v.res), v.sch, v.res))) + '</div>';
    }
    case 'dpow': {
      const { wi, wc, want } = dpowInfo(q), i = nat(v.i), c = nat(v.cnt);
      return '<div class="rv-lees">' + lijn('Opgave:', macht(PW((q.neg ? '−' : '') + esc(q.d)), q.exp)) + lijn('Exponent:', w(q.exp, n0(v.n)))
        + (q.neg ? lijn('Minnenparen:', w(Math.floor(q.exp / 2), nat(v.n) === null ? null : paren(v.mp))) : '')
        + lijn('Zonder komma:', w(wi, n0(v.i))) + lijn('Cijfers na de komma:', w(wc, n0(v.cnt)))
        + lijn('Uitkomst:', w(esc((want || '') + decTxt(wi, 10 ** wc)), i !== null && c !== null && v.s ? esc((neg(v.s) ? '−' : '') + decTxt(i, 10 ** c)) : null)) + '</div>';
    }
    case 'root':
      return '<div class="rv-lees">' + lijn('Zijde gezocht:', w(sq(q.n), blanco ? null : esc(v.side))) + lijn(rootHTML(q.n) + ' =', w(sq(q.n), n0(v.res))) + '</div>';
    case 'rootx': {
      const buiten = q.out === '−';
      if(q.kind === 'int') return '<div class="rv-lees">' + lijn(rootHTML(q.n) + ' =', w(sq(q.n), n0(v.r))) + lijn(rootHTML(q.n, buiten) + ' =', w(esc(fmt(buiten ? -sq(q.n) : sq(q.n))), sn(v.res))) + '</div>';
      if(q.kind === 'frac'){ const Ev = { num:buiten ? -sq(q.t) : sq(q.t), den:sq(q.n) }, R = naKnip(Ev, [ggd(Ev.num, Ev.den)]);
        return '<div class="rv-lees">' + lijn(rootHTML(brS(q.t, q.n), buiten) + ' =', w(br(Ev.num, Ev.den) + (R.den !== Ev.den ? ' → ' + br(R.num, R.den) : ''), breuk(fval(v.res), v.sch, v.res))) + '</div>'; }
      const { t0, W } = rootDec(q);
      return '<div class="rv-lees">' + lijn('Maal zichzelf:', w(esc(decTxt(W.num, W.den)), decTekst(v.x) ? esc(decTekst(v.x)) : null)) + lijn('Zonder komma:', w(t0, n0(v.i)))
        + lijn('Cijfers na de komma:', w(decPl(q.d), n0(v.cnt))) + lijn(rootHTML(esc(q.d), buiten) + ' =', w(esc(decTxt(buiten ? -W.num : W.num, W.den)), dn(v.res))) + '</div>';
    }
    case 'facts':
      return '<div class="rv-lees">' + q.rows.map((r, i)=>lijn(factLab(r) + ' =', w(esc(fmt(factE(r))), sn(v.rows[i])))).join('') + '</div>';
    case 'ctx7': {
      if(q.kind === 'omtrek'){ const Z = sq(q.b);
        return '<div class="rv-lees">' + lijn('Zijde:', sl ? rootHTML(q.b) + ` = ${Z} m` : blanco ? leeg : rootHTML(esc(v.b || '…')) + ' = ' + (dn(v.z) || '…') + ' m')
          + lijn('Omtrek:', sl ? `4 ⋅ ${Z} = ${4 * Z} m` : blanco ? leeg : `${esc(v.f1 || '…')} ⋅ ${esc(v.f2 || '…')} = ${dn(v.res) || '…'} m`) + '</div>'; }
      const p = q.kind === 'pow3' ? 3 : 2;
      return '<div class="rv-lees">' + lijn('Bewerking:', sl ? macht(q.b, p) : blanco ? leeg : macht(esc(v.b || '…'), p === 3 ? esc(v.e || '…') : 2))
        + lijn(esc(q.resLabel) + ':', w(`${q.b ** p} ${esc(q.unit)}`, dn(v.res) ? dn(v.res) + ' ' + esc(q.unit) : null)) + '</div>';
    }
    case 'errpow': {
      const opt = id => { const o = q.options.find(x=>x.id === id); return o ? esc(id.toUpperCase()) + ') ' + esc(o.text) : null; };
      return '<div class="rv-lees">' + notitie(q) + lijn('Fout:', w(k && k.good ? opt(k.good) : leeg, v.choice ? opt(v.choice) : null))
        + lijn(errExpr(q) + ' =', w(esc(fmt(errE(q))), sn(v.res))) + '</div>';
    }
  }
  return '';
}

/* ---------- invullen: de interactieve oefeningen ---------- */
const TYPEN = {};
Object.keys(LEEG).forEach(s=>{ TYPEN[s] = { leeg:LEEG[s], volledig:VOLLEDIG[s], uitleg:q=>q.instr || UITLEG[s] }; });
const RV = () => window.RV;
const werk = (c, cls) => c.root.querySelector('.rv-werk').classList.add(...cls.split(' '));
const opInvoer = (c, f) => { c.ant.oninput = c.vis.oninput = f; };
/* opnieuw tekenen zonder dat het invulvak de focus verliest */
const houdFocus = c => { const a = document.activeElement, p = a && a.dataset ? a.dataset.pad : null; c.teken();
  if(p){ const el = c.root.querySelector(`input[data-pad="${p}"]`); if(el){ el.focus(); const n = el.value.length; try{ el.setSelectionRange(n, n); }catch(e){} } } };
const actief = () => { const a = document.activeElement; return a && a.dataset ? a.dataset.pad : null; };
/* uitkomst: tekenvak (+ boven, − onder) en het getal zonder teken */
const term = (p, o, soort = 'nat', label = 'uitkomst') => `<span class="rv-term">${RV().teken(p + '.s', o.s, 'toestandsteken van de ' + label, true)}${RV().getal(p + '.n', o.n, soort)}</span>`;
const TIP_TEKEN = '<p class="rv-tip">Toestandsteken: kies <b>+</b> of <b>−</b> in het vakje vóór je uitkomst.</p>';
const TIP_BREUK = '<p class="rv-tip">Toestandsteken: kies <b>+</b> of <b>−</b> in het vakje vóór de breuk. Vereenvoudigen? Klik naast de breuk op <b>✂ vereenvoudigen</b> of op <b>✓ kan niet eenvoudiger</b>.</p>';
const TIP_MIN = '<p class="rv-tip">Klik twee minnen aan: samen worden ze <b>+</b> en verdwijnen ze.</p>';
const COUNTQ = 'Hoeveel keer staat het grondtal naast elkaar in de vermenigvuldiging? De exponent is';
const rij = (gelijk, inhoud, naam, cls = '') => `<div class="srij${cls ? ' ' + cls : ''}"><span class="gelijk">${gelijk}</span><div class="orig">${inhoud}</div>${naam ? `<span class="stapnaam">${naam}</span>` : '<span></span>'}</div>`;
const exponentRij = v => rij('', `<span class="h6-qlab">${COUNTQ}</span> ${RV().getal('n', v.n, 'nat', 'h6-klein', 'exponent')}`, '①', 'h6-vraagrij');
const WACHT = '<span class="h6-wacht">Vul eerst ① in: dan verschijnt de vermenigvuldiging.</span>';

/* herhaalde vermenigvuldiging als uitdrukking voor RV.tekens: k factoren, buiten = aantal minnen vóór de haakjes */
const keten = (factor, k, buiten) => { let e = Array(k).fill(factor).join(' ⋅ '); for(let j = 0; j < buiten; j++) e = `−(${e})`; return e; };
/* de keten tonen: de minnen zijn aanklikbaar zodra er minstens twee zijn */
function ketenHTML(c, key, expr, st, totaal){
  return `<span class="h6-keten">${RV().tekens.html(expr, st, totaal >= 2 ? key : null, { ui:c.ui, maal:true, kaders:'hint' })}</span>`;
}
/* de indices van de minnen in de uitdrukking, per twee (voor een volledig juist voorbeeld) */
const minParen = expr => { const t = window.RV.tekens.tokens(expr), m = []; t.forEach((x, i)=>{ if(x.ch === '−' && x.k === 'sign') m.push(i); });
  const p = []; for(let i = 0; i + 1 < m.length; i += 2) p.push([m[i], m[i + 1]]); return p; };
/* verandert de exponent, dan begint de keten opnieuw */
const ketenVerandert = (c, k, mpVan) => { const w = c.huidig(), k2 = nat(w.n); if(k2 === k) return false; mpVan(w).p = []; mpVan(w).x = 0; c.bewaar(w); houdFocus(c); return true; };

const powExpr = (q, k) => keten(q.b < 0 ? `(−${Math.abs(q.b)})` : String(q.b), k, q.out === '−' ? 1 : 0);
const fpowExpr = (q, k) => keten(`(${q.neg ? '−' : ''}${q.t}/${q.n})`, k, 0);
const dpowExpr = (q, k) => keten(`(${q.neg ? '−' : ''}${q.d})`, k, 0);
const twinExpr = (p, g) => keten(g === 'm' ? `(−${Math.abs(p.b)})` : String(Math.abs(p.b)), p.exp, twinOuter(p, g));

/* ---------- bouwen: rij maken, vastzetten, rijen (en lagen) kiezen, vastzetten ---------- */
const ICO_LOCK = '<svg class="h6-lk" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10.5 V7.5 a4.5 4.5 0 0 1 9 0 V10.5" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="4.5" y="10.5" width="15" height="11" rx="2.4" fill="currentColor"/><rect x="11" y="14" width="2" height="4" rx="1" fill="#fff"/></svg>';
const ICO_UNLOCK = '<svg class="h6-lk" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10.5 V7.5 a4.5 4.5 0 0 1 8.7 -1.6" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="4.5" y="10.5" width="15" height="11" rx="2.4" fill="currentColor"/><rect x="11" y="14" width="2" height="4" rx="1" fill="#fff"/></svg>';
function bouwPaneel(q, B){
  const kubus = q.vis === 'cube', mx = kubus ? 6 : 8;
  const stap = (nr, lab, veld, slot, n, een, meer, aan, min) => { const vast = B[slot];
    return `<div class="h6-bstap${aan ? '' : ' uit'}${vast ? ' vast' : ''}"><span class="h6-bnr">${nr}</span><span class="h6-blab">${lab}</span>`
      + `<span class="h6-bctl"><button type="button" class="h6-bknop" data-bld="${veld}" data-d="-1"${!aan || vast || n <= min ? ' disabled' : ''} aria-label="minder">−</button>`
      + `<span class="h6-bcnt">${n} <small>${n === 1 ? een : meer}</small></span>`
      + `<button type="button" class="h6-bknop plus" data-bld="${veld}" data-d="1"${!aan || vast || n >= mx ? ' disabled' : ''} aria-label="meer">+</button></span>`
      + `<button type="button" class="h6-slot${vast ? ' aan' : ''}" data-lock="${slot}"${!aan || (veld === 'a' && B.a < 1) ? ' disabled' : ''} aria-pressed="${!!vast}">${vast ? ICO_LOCK + ' vast' : ICO_UNLOCK + ' vastzetten'}</button></div>`; };
  return '<div class="h6-bpaneel">' + stap('①', 'Bouw een rij blokjes', 'a', 'ra', B.a, 'blokje', 'blokjes', true, 0)
    + stap('②', kubus ? 'Neem de rij een aantal keer: een vlak' : 'Neem de rij een aantal keer', 'r', 'rr', B.r, 'rij', 'rijen', B.ra, 1)
    + (kubus ? stap('③', 'Stapel het vlak een aantal keer', 'l', 'll', B.l, 'laag', 'lagen', B.rr, 1) : '') + '</div>';
}
function bouwFiguur(q, B){
  const kubus = q.vis === 'cube', klaar = bouwOK(q, B), tot = Math.abs(q.b) ** q.exp;
  const pic = kubus ? cubesSVG(B.a, B.ra ? B.r : 1, B.rr ? B.l : 1, { shown:B.num ? tot : null }) : gridSVG(B.a, B.ra ? B.r : 1, { nums:klaar, shown:B.num ? null : 0 });
  return `<div class="h6-bouw"><div class="h6-bpic">${pic}</div>${klaar ? `<div class="h6-btel"><b>${B.num ? tot : 0}</b> <small>${kubus ? 'blokjes' : 'vakjes'}</small></div>` : ''}</div>`;
}
function bindBouw(c){
  const q = c.q;
  c.ant.querySelectorAll('[data-bld]').forEach(b=>b.onclick = ()=>{ const v = c.huidig(), B = v.bld, f = b.dataset.bld, mx = q.vis === 'cube' ? 6 : 8;
    B[f] = Math.max(f === 'a' ? 0 : 1, Math.min(mx, B[f] + +b.dataset.d)); B.num = false; c.bewaar(v); c.teken(); });
  c.ant.querySelectorAll('[data-lock]').forEach(b=>b.onclick = ()=>{ const v = c.huidig(), B = v.bld, k = b.dataset.lock;
    if(B[k]){ B[k] = false; B.num = false; if(k === 'ra'){ B.rr = false; B.ll = false; B.r = 1; B.l = 1; } if(k === 'rr'){ B.ll = false; B.l = 1; } }   /* losmaken: wat erna komt ook */
    else B[k] = true;
    c.bewaar(v); c.teken(); });
  /* staat het juiste vierkant of de juiste kubus er: de vakjes worden één voor één genummerd */
  clearInterval(c.ui.h6tel);
  const B = c.v.bld, tot = Math.abs(q.b) ** q.exp;
  if(B.num || !bouwOK(q, B)) return;
  let i = 0; const tel = c.vis.querySelector('.h6-btel b');
  c.ui.h6tel = setInterval(()=>{
    if(!c.nogHier() || !tel || !tel.isConnected){ clearInterval(c.ui.h6tel); return; }
    i++; tel.textContent = i;
    const el = c.vis.querySelector(q.vis === 'cube' ? `.h6-cb[data-i="${i}"]` : `.h6-gn[data-n="${i}"]`); if(el) el.classList.add('aan');
    if(i >= tot){ clearInterval(c.ui.h6tel); const w = c.huidig(); w.bld.num = true; c.bewaar(w); }
  }, Math.max(22, 1600 / tot));
}

/* macht: (bouwen +) herhaalde vermenigvuldiging + minnen wegklikken */
TYPEN.power.teken = c=>{
  const { q, v } = c, k = nat(v.n), outer = q.out === '−' ? 1 : 0, tot = (q.b < 0 ? k || 0 : 0) + outer;
  werk(c, q.vis ? 'h6-bouwwerk' : 'h6-smal');
  c.vis.innerHTML = opgaveBox(powHTML(q.b, q.exp, !!outer)) + (q.vis ? bouwFiguur(q, v.bld) : '');
  c.ant.innerHTML = (q.vis ? bouwPaneel(q, v.bld) : '') + '<div class="schrift h6-schriftje">' + exponentRij(v)
    + rij('=', k ? ketenHTML(c, 'mp', powExpr(q, k), v.mp, tot) : WACHT, 'herhaalde vermenigvuldiging')
    + rij('=', term('res', v.res), 'uitkomst') + '</div>' + (tot >= 2 ? TIP_MIN : TIP_TEKEN);
  if(q.vis) bindBouw(c);
  RV().tekens.bind(c, w=>({ st:w.mp, expr:powExpr(q, nat(w.n)), maal:true }));
  opInvoer(c, ()=>ketenVerandert(c, k, w=>w.mp));
};

/* haakjes of niet? het grondtal kiezen, dan de volledige vermenigvuldiging */
TYPEN.twins2.teken = c=>{
  const { q, v } = c; werk(c, 'stapel');
  c.vis.innerHTML = '<div class="h6-twkop">Met haakjes hoort het minteken bij het grondtal. Zonder haakjes niet.</div>';
  const kaart = i => { const p = q.parts[i], st = v.parts[i], a = Math.abs(p.b);
    let keuze = `<div class="h6-gsel"><span class="h6-qlab">Het grondtal is:</span>` + [['m', '−' + a], ['p', String(a)]].map(([g, lab])=>
      `<button type="button" class="h6-gknop${st.g === g ? ' aan' : ''}" data-gp="${i}" data-g="${g}" aria-pressed="${st.g === g}">${lab}</button>`).join('') + '</div>';
    const tot = (st.g === 'm' ? p.exp : 0) + twinOuter(p, st.g);
    const werkRij = st.g ? `<div class="rv-rij h6-twwerk"><span class="rv-wisk">${powHTML(p.b, p.exp, p.out === '−')} =</span>${ketenHTML(c, 'parts.' + i + '.mp', twinExpr(p, st.g), st.mp, tot)}</div>` : '<div class="rv-rij h6-twwerk"><span class="h6-wacht">Kies eerst het grondtal.</span></div>';
    return `<div class="h6-twkaart"><div class="h6-twexpr">${powHTML(p.b, p.exp, p.out === '−')}</div>${keuze}${werkRij}<div class="rv-rij"><span class="rv-wisk">=</span>${term(`parts.${i}.res`, st.res)}</div></div>`; };
  c.ant.innerHTML = `<div class="h6-tweeling">${kaart(0)}${kaart(1)}</div><p class="rv-tip">Klik twee minnen aan: samen worden ze <b>+</b> en verdwijnen ze. Kies het toestandsteken vóór je uitkomst.</p>`;
  c.ant.querySelectorAll('[data-gp]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(), p = w.parts[+b.dataset.gp]; if(p.g !== b.dataset.g){ p.g = b.dataset.g; p.mp = MP(); } c.bewaar(w); c.teken(); });
  RV().tekens.bind(c, (w, key)=>{ const i = +key.split('.')[1]; return { st:w.parts[i].mp, expr:twinExpr(q.parts[i], w.parts[i].g), maal:true }; });
};

/* macht van een breuk: herhaalde vermenigvuldiging, teller maal teller en noemer maal noemer, vereenvoudigen */
TYPEN.fpow.teken = c=>{
  const { q, v } = c, B = RV().br, k = nat(v.n), basis = B.val(v.res), tot = q.neg ? k || 0 : 0; werk(c, 'h6-smal');
  c.vis.innerHTML = opgaveBox(macht(PW((q.neg ? '−' : '') + brS(q.t, q.n)), q.exp)) + '<div class="h6-regel">Een macht van een breuk: <b>teller maal teller</b> en <b>noemer maal noemer</b>.</div>';
  const herh = x => Array(k).fill(x).join(' ⋅ ');
  c.ant.innerHTML = '<div class="schrift h6-schriftje">' + exponentRij(v)
    + rij('=', k ? ketenHTML(c, 'mp', fpowExpr(q, k), v.mp, tot) : WACHT, 'herhaalde vermenigvuldiging')
    + (k ? rij('=', `<span class="rv-term">${RV().teken('s0', v.s0, 'toestandsteken van de tussenstap', true)}<span class="br h6-prod"><span class="br-t">${herh(q.t)}</span><span class="br-n">${herh(q.n)}</span></span></span>`, 'teller maal teller<br>noemer maal noemer') : '')
    + rij('=', `${B.veld('res', v.res)}${B.keuze('sch', basis, v.sch)}`, 'uitkomst', 'h6-resrij') + '</div>' + (tot >= 2 ? TIP_MIN : '') + TIP_BREUK;
  c.vis.insertAdjacentHTML('beforeend', B.paneel('sch', basis, v.sch, c, true));
  RV().tekens.bind(c, w=>({ st:w.mp, expr:fpowExpr(q, nat(w.n)), maal:true }));
  const basisVan = w => B.val(w.res);
  B.bind(c, basisVan); opInvoer(c, ()=>{ if(!ketenVerandert(c, k, w=>w.mp)) B.ververs(c, basisVan); });
};

/* macht van een kommagetal: we denken de komma's weg, dan tellen we de cijfers na de komma */
function decHTML(iStr, k){
  const n = nat(iStr); if(n === null || k === null) return '';
  let d = String(n); const raw = d; while(d.length < k + 1) d = '0' + d;
  const pos = d.length - k;
  return d.split('').map((ch, i)=>(i === pos && k > 0 ? '<span class="h6-dkomma">,</span>' : '') + `<span class="h6-dcijfer${i < d.length - raw.length ? ' nul' : ''}">${ch}</span>`).join('');
}
const WACHT_DEC = '<span class="h6-wacht">Vul ② en ③ in: dan verschijnt de uitkomst.</span>';
function komma(c, el, iStr, k){
  clearInterval(c.ui.h6komma); if(!el) return;
  if(k === null || nat(iStr) === null){ el.innerHTML = WACHT_DEC; return; }
  let stap = 0; el.innerHTML = decHTML(iStr, 0); if(!k) return;
  c.ui.h6komma = setInterval(()=>{ stap++; el.innerHTML = decHTML(iStr, stap); const x = el.querySelector('.h6-dkomma'); if(x) x.classList.add('hop'); if(stap >= k) clearInterval(c.ui.h6komma); }, 420);
}
const cijfers = d => d.replace(',', '').replace(/^0+(?=\d)/, '');
TYPEN.dpow.teken = c=>{
  const { q, v } = c, k = nat(v.n), cnt = nat(v.cnt), tot = q.neg ? k || 0 : 0; werk(c, 'h6-smal');
  c.vis.innerHTML = opgaveBox(macht(PW((q.neg ? '−' : '') + esc(q.d)), q.exp))
    + '<div class="plan h6-plan"><span>① herhaalde vermenigvuldiging</span><span>② we denken de komma’s weg</span><span>③ cijfers na de komma samen tellen</span></div>';
  c.ant.innerHTML = '<div class="schrift h6-schriftje">' + exponentRij(v)
    + rij('=', k ? ketenHTML(c, 'mp', dpowExpr(q, k), v.mp, tot) : WACHT, 'herhaalde vermenigvuldiging')
    + rij('→', `<span class="h6-qlab">We denken de komma’s weg:</span> ${k ? `<span class="h6-reken">${Array(k).fill(cijfers(q.d)).join(' ⋅ ')} =</span> ` : ''}${RV().getal('i', v.i, 'nat', 'h6-klein', 'zonder komma’s')}`, '② zonder komma’s', 'h6-vraagrij')
    + rij('', `<span class="h6-qlab">Aantal cijfers na de komma, samen:</span> ${RV().getal('cnt', v.cnt, 'nat', 'h6-klein', 'aantal cijfers na de komma')}`, '③ tel', 'h6-vraagrij')
    + rij('=', `<span class="rv-term">${RV().teken('s', v.s, 'toestandsteken van de uitkomst', true)}<span class="h6-dres">${cnt !== null && nat(v.i) !== null ? decHTML(v.i, cnt) : WACHT_DEC}</span></span>`, 'uitkomst') + '</div>'
    + (tot >= 2 ? TIP_MIN : TIP_TEKEN);
  RV().tekens.bind(c, w=>({ st:w.mp, expr:dpowExpr(q, nat(w.n)), maal:true }));
  opInvoer(c, ()=>{ if(ketenVerandert(c, k, w=>w.mp)) return; const p = actief(), w = c.huidig(); if(p === 'i' || p === 'cnt') komma(c, c.ant.querySelector('.h6-dres'), w.i, nat(w.cnt)); });
};

/* vierkantswortel: zoek de zijde; elk vakje krijgt een nummer */
TYPEN.root.teken = c=>{
  const { q, v } = c, s = Math.max(1, Math.min(20, +v.side || 1)), S = Math.min(46, 460 / s); werk(c, 'h6-wortelwerk');
  c.vis.innerHTML = `<div class="h6-wortelpic">${gridSVG(s, s, { S, nums:true, lab:['zijde ' + s, String(s)] })}</div>`;
  c.ant.innerHTML = opgaveBox(rootHTML(q.n))
    + `<div class="h6-zijde"><b>Zijde:</b><button type="button" class="h6-bknop" data-side="-1" aria-label="kleiner"${s <= 1 ? ' disabled' : ''}>−</button><span class="h6-nval">${s}</span><button type="button" class="h6-bknop plus" data-side="1" aria-label="groter"${s >= 20 ? ' disabled' : ''}>+</button></div>`
    + '<p class="rv-tip">Elk vakje heeft een nummer. Het laatste nummer is de oppervlakte van het vierkant.</p>'
    + `<div class="rv-rij"><span class="rv-wisk h6-groot">${rootHTML(q.n)} =</span>${RV().getal('res', v.res, 'nat')}</div>`
    + `<p class="rv-tip">√${q.n} is de zijde van het vierkant met oppervlakte ${q.n}.</p>`;
  c.ant.querySelectorAll('[data-side]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(); w.side = Math.max(1, Math.min(20, (+w.side || 1) + +b.dataset.side)); c.bewaar(w); c.teken(); });
};

/* wortels met een teken, een breuk of een kommagetal */
TYPEN.rootx.teken = c=>{
  const { q, v } = c, buiten = q.out === '−', B = RV().br;
  if(q.kind === 'int'){
    werk(c, 'h6-smal');
    c.vis.innerHTML = opgaveBox(rootHTML(q.n, buiten)) + '<div class="h6-regel">Het minteken staat <b>vóór</b> de wortel: het hoort niet onder de wortel. Eerst de wortel, dan het teken.</div>';
    c.ant.innerHTML = '<div class="schrift h6-schriftje">' + rij('', `<span class="h6-reken">${rootHTML(q.n)} =</span> ${RV().getal('r', v.r, 'nat')}`, '① de wortel')
      + rij('', `<span class="h6-reken">${rootHTML(q.n, true)} =</span> ${term('res', v.res)}`, '② teken erbij') + '</div>' + TIP_TEKEN;
    return;
  }
  if(q.kind === 'frac'){
    werk(c, 'h6-smal');
    const basis = B.val(v.res);
    c.vis.innerHTML = opgaveBox(rootHTML(brS(q.t, q.n), buiten))
      + `<div class="h6-regel">Wortel van een breuk: <span class="h6-rex">${rootHTML(brS('a', 'b'))} = ${brS(rootHTML('a'), rootHTML('b'))}</span>${buiten ? '<span>Het minteken <b>vóór</b> de wortel hoort niet onder de wortel: het blijft staan.</span>' : ''}</div>`;
    const veld = `<span class="rv-term br-veld">${RV().teken('res.s1', v.res.s1, 'toestandsteken van de uitkomst', true)}<span class="br br-in h6-wbr">`
      + `<span class="br-t"><span class="h6-plab">${rootHTML(q.t)} =</span>${RV().getal('res.t', v.res.t, 'nat', 'br-get', 'wortel van de teller')}</span>`
      + `<span class="br-n"><span class="h6-plab">${rootHTML(q.n)} =</span>${RV().getal('res.n', v.res.n, 'nat', 'br-get', 'wortel van de noemer')}</span></span></span>`;
    c.ant.innerHTML = '<div class="schrift h6-schriftje">' + rij('=', veld + B.keuze('sch', basis, v.sch), 'wortel van teller<br>en van noemer', 'h6-resrij') + '</div>' + TIP_BREUK;
    c.vis.insertAdjacentHTML('beforeend', B.paneel('sch', basis, v.sch, c, true));
    const basisVan = w => B.val(w.res);
    B.bind(c, basisVan); opInvoer(c, ()=>B.ververs(c, basisVan));
    return;
  }
  /* kommagetal: welk kommagetal maal zichzelf geeft q.d? */
  werk(c, 'h6-smal');
  const x = decTekst(v.x), xd = x ? cijfers(x) : null, cnt = nat(v.cnt);
  c.vis.innerHTML = opgaveBox(rootHTML(esc(q.d), buiten))
    + `<div class="h6-regel">${rootHTML(esc(q.d))} <span>is het kommagetal dat <b>maal zichzelf</b> ${esc(q.d)} geeft.${buiten ? ' Het minteken <b>vóór</b> de wortel blijft staan.' : ''}</span></div>`;
  c.ant.innerHTML = '<div class="schrift h6-schriftje">'
    + rij('', `<span class="h6-qlab">Welk kommagetal maal zichzelf geeft ${esc(q.d)}?</span> <span class="h6-reken">${PW(RV().getal('x', v.x, 'dec', 'h6-klein', 'kommagetal'))} ⋅ ${PW(`<span class="h6-spiegel">${x ? esc(x) : '…'}</span>`)} = ${esc(q.d)}</span>`, '① zoek', 'h6-vraagrij')
    + rij('→', `<span class="h6-qlab">Controle: we denken de komma’s weg:</span> <span class="h6-reken h6-xdig">${xd ? xd + ' ⋅ ' + xd + ' =' : ''}</span> ${RV().getal('i', v.i, 'nat', 'h6-klein', 'zonder komma’s')}`, '② zonder komma’s', 'h6-vraagrij')
    + rij('', `<span class="h6-qlab">Aantal cijfers na de komma, samen:</span> ${RV().getal('cnt', v.cnt, 'nat', 'h6-klein', 'aantal cijfers na de komma')}`, '③ tel', 'h6-vraagrij')
    + rij('=', `<span class="h6-dres">${cnt !== null && nat(v.i) !== null ? decHTML(v.i, cnt) : WACHT_DEC}</span>`, 'klopt het?')
    + rij('', `<span class="h6-reken">${rootHTML(esc(q.d), buiten)} =</span> ${term('res', v.res, 'dec')}`, '④ uitkomst') + '</div>' + TIP_TEKEN;
  opInvoer(c, ()=>{ const p = actief(), w = c.huidig();
    if(p === 'x'){ const x2 = decTekst(w.x), d2 = x2 ? cijfers(x2) : null; c.ant.querySelector('.h6-spiegel').textContent = x2 || '…'; c.ant.querySelector('.h6-xdig').textContent = d2 ? d2 + ' ⋅ ' + d2 + ' =' : ''; }
    if(p === 'i' || p === 'cnt') komma(c, c.ant.querySelector('.h6-dres'), w.i, nat(w.cnt)); });
};

/* weetjes: kwadraten en wortels van buiten */
TYPEN.facts.teken = c=>{
  const { q, v } = c; werk(c, 'stapel');
  c.vis.innerHTML = '<div class="h6-weetkop">🧠 <b>Van buiten</b>: de kwadraten tot 15² en de wortels die daarbij horen.</div>';
  c.ant.innerHTML = '<div class="h6-weetjes">' + q.rows.map((r, i)=>`<div class="h6-weetrij"><span class="h6-fq">${factLab(r)}</span><span class="rv-wisk">=</span>${term('rows.' + i, v.rows[i])}</div>`).join('') + '</div>' + TIP_TEKEN;
};

/* vraagstukken */
const eenheid = (o, unit) => o && o.n ? (neg(o.s) ? '−' : '') + o.n + ' ' + unit : '…';
TYPEN.ctx7.teken = c=>{
  const { q, v } = c; werk(c, 'h6-vraagwerk');
  c.vis.innerHTML = vraagFiguur(q);
  const antw = `<div class="h6-antwlijn">${esc(q.resLabel)}: <b>${esc(eenheid(v.res, q.unit))}</b></div>`;
  if(q.kind === 'omtrek'){
    c.ant.innerHTML = '<h3>① Hoe lang is een zijde van de tuin?</h3>'
      + `<div class="h6-tpl"><span class="rv-wisk">${rootHTML(RV().getal('b', v.b, 'nat', 'h6-klein', 'getal onder de wortel'))} =</span>${term('z', v.z, 'dec', 'zijde')}<b>m</b></div>`
      + '<h3>② Hoe lang is de omtrek van de tuin?</h3>'
      + `<div class="h6-tpl">${RV().getal('f1', v.f1, 'dec', 'h6-klein', 'eerste factor')}<span class="rv-wisk">⋅</span>${RV().getal('f2', v.f2, 'dec', 'h6-klein', 'tweede factor')}<span class="rv-wisk">=</span>${term('res', v.res, 'dec')}<b>m</b></div>`
      + antw + TIP_TEKEN;
  } else {
    const tpl = `<span class="rv-wisk h6-tplmacht">${RV().getal('b', v.b, 'nat', 'h6-klein', 'grondtal')}<sup>${q.kind === 'pow3' ? RV().getal('e', v.e, 'nat', 'h6-exp', 'exponent') : '2'}</sup> =</span>`;
    c.ant.innerHTML = '<h3>① Bewerking</h3>' + `<div class="h6-tpl">${tpl}${term('res', v.res, 'dec')}<b>${esc(q.unit)}</b></div>` + antw + TIP_TEKEN;
  }
  opInvoer(c, ()=>{ const el = c.ant.querySelector('.h6-antwlijn b'); if(el) el.textContent = eenheid(c.huidig().res, q.unit); });
};

/* foutenjager */
TYPEN.errpow.teken = c=>{
  const { q, v } = c;
  c.vis.innerHTML = notitie(q) + '<h3>① Wat ging er mis?</h3><div class="keuzes">'
    + q.options.map(o=>`<button type="button" class="keuze${v.choice === o.id ? ' aan' : ''}" data-opt="${o.id}" aria-pressed="${v.choice === o.id}"><span class="letter">${o.id.toUpperCase()}</span><span>${esc(o.text)}</span></button>`).join('') + '</div>';
  c.ant.innerHTML = '<h3>② Wat is de juiste uitkomst?</h3>' + `<div class="rv-rij"><span class="rv-wisk h6-groot">${errExpr(q)} =</span>${term('res', v.res)}</div>` + TIP_TEKEN;
  c.vis.querySelectorAll('[data-opt]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(); w.choice = b.dataset.opt; c.bewaar(w); c.teken(); });
};

const vereenvoudig = b => { const g = ggd(b.num, b.den), st = SCH(); if(b.den > 1 && g > 1){ st.mode = 'cut'; st.cuts = [g]; } else st.mode = 'skip'; st.done = true; st.for = sig(b); return st; };
const snW = (n, dec) => ({ s:n < 0 ? '−' : '+', n:dec ? String(dec) : String(Math.abs(n)) });
const OPG = window.OPGAVE = {
  id:'2a-rv-6-machten-wortels', css:'opgave.css', delen:DELEN, begrippen:BEGRIPPEN, codes:CODES,
  verbeter(q, v, k){ const r = VERBETER[q.soort](q, v || {}, k); return { pts:Math.round(Math.min(q.punten, r.pts) * 100) / 100, codes:[...new Set(r.codes)], kruis:r.kruis || 0 }; },
  volledig(q, a){ let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){} try{ return !!v && VOLLEDIG[q.soort](q, v); }catch(e){ return false; } },
  toon,
  /* een volledig juist antwoord bij sleutel k (voor de sleutel en de tests) */
  voorbeeld(q, k){
    const mp = expr => ({ p:minParen(expr), x:0 });
    switch(q.soort){
      case 'power': { const a = Math.abs(q.b), v = { n:String(q.exp), mp:mp(powExpr(q, q.exp)), res:snW(machtE(q.b, q.exp, q.out)) };
        if(q.vis) v.bld = { a, ra:true, r:a, rr:true, l:q.vis === 'cube' ? a : 1, ll:q.vis === 'cube', num:true }; return v; }
      case 'twins2': return { parts:q.parts.map(p=>{ const g = p.b < 0 ? 'm' : 'p'; return { g, mp:mp(twinExpr(p, g)), res:snW(machtE(p.b, p.exp, p.out)) }; }) };
      case 'fpow': { const want = q.neg && q.exp % 2 === 1 ? '−' : '+', b = { num:(want === '−' ? -1 : 1) * q.t ** q.exp, den:q.n ** q.exp };
        return { n:String(q.exp), mp:mp(fpowExpr(q, q.exp)), s0:want, res:{ s1:want, t:String(Math.abs(b.num)), n:String(b.den) }, sch:vereenvoudig(b) }; }
      case 'dpow': { const { wi, wc, want } = dpowInfo(q); return { n:String(q.exp), mp:mp(dpowExpr(q, q.exp)), i:String(wi), cnt:String(wc), s:want || '+' }; }
      case 'root': return { side:sq(q.n), res:String(sq(q.n)) };
      case 'rootx': {
        const buiten = q.out === '−';
        if(q.kind === 'int') return { r:String(sq(q.n)), res:snW(buiten ? -sq(q.n) : sq(q.n)) };
        if(q.kind === 'frac'){ const b = { num:(buiten ? -1 : 1) * sq(q.t), den:sq(q.n) }; return { res:{ s1:buiten ? '−' : '+', t:String(sq(q.t)), n:String(b.den) }, sch:vereenvoudig(b) }; }
        const { t0, W } = rootDec(q), x = decTxt(W.num, W.den);
        return { x, i:String(t0), cnt:String(decPl(q.d)), res:{ s:buiten ? '−' : '+', n:x } };
      }
      case 'facts': return { rows:q.rows.map(r=>snW(factE(r))) };
      case 'ctx7': {
        if(q.kind === 'omtrek'){ const Z = sq(q.b); return { b:String(q.b), z:snW(Z), f1:'4', f2:String(Z), res:snW(4 * Z) }; }
        const v = { b:String(q.b), res:snW(q.b ** (q.kind === 'pow3' ? 3 : 2)) }; if(q.kind === 'pow3') v.e = '3'; return v;
      }
      case 'errpow': return { choice:k && k.good, res:snW(errE(q)) };
    }
  },
  invullen:opts=>window.RV.maak(OPG, TYPEN, opts)
};
})();
