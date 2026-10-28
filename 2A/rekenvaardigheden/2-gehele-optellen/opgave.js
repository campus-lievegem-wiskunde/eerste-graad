/* 2A Rekenvaardigheden 2 · Optellen en aftrekken van gehele getallen (30 oefeningen, interactief met gedeeld/rv-kader.js).
   Oefeningen, volgorde en uitleg zoals het oorspronkelijke Oefening.html; verbeteren zoals code.gs:
   deelpunten per tussenstap en foutcodes. De juiste bewerking van de vraagstukken en de keuze bij de foutenjager
   staan enkel in de versleutelde sleutel (sleutel.enc.json). De uitkomsten volgen uit de opgave zelf. */
(function(){
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => n < 0 ? '−' + Math.abs(n) : String(n);
const fmtN = n => n == null || isNaN(n) ? '…' : fmt(n);
const sprong = d => d > 0 ? '+' + d : d < 0 ? '−' + Math.abs(d) : '0';
const uitdr = s => esc(s).replace(/ ([+−]) /g, ' <span class="rv-op">$1</span> ');
const COL = { plus:'#d62828', min:'#1d4ed8' }; /* enkel de legertjes zijn rood en blauw */

/* ---------- oefeningen ---------- */
const nl = (id, expr, range, punten = 1) => ({ id, type:'eigen', soort:'numberline', punten, expr, range, vraag:`Bereken ${expr} met een sprong op de getallenas.` });
const leger = (id, expr, camps, doubleSign) => ({ id, type:'eigen', soort:'armies', punten:1, expr, camps, doubleSign:!!doubleSign, vraag:`Bereken ${expr} met de legertjes.` });
const stap = (id, expr, n) => ({ id, type:'eigen', soort:'steps', punten:1, expr, n, vraag:`Bereken ${expr} met het stappenplan.` });
const som = (id, expr, n) => ({ id, type:'eigen', soort:'steps', collect:true, punten:2, expr, n, vraag:`Bereken de gedurige som ${expr}.` });
const verg = (id, items) => ({ id, type:'eigen', soort:'compare', punten:1, items, vraag:'Vul in met &lt;, &gt; of =.' });
const jager = (id, who, work, expr, options) => ({ id, type:'eigen', soort:'errorhunt', punten:1, who, work, expr, options:options.map((text, i)=>({ id:'abcd'[i], text })), vraag:`${who} maakte een fout. Kan jij ze vinden?` });
const DELEN = [
  { titel:'Getallenas', vragen:[ nl('ex01', '−12 − 19', [-40, 10]), nl('ex02', '−8 + 13', [-15, 15]), nl('ex03', '25 − 39', [-20, 30]), nl('ex04', '−6 − 17', [-30, 10]), nl('ex05', '−21 + 34', [-25, 20]) ] },
  { titel:'Legertjes', vragen:[ leger('ex06', '−7 + 11', ['min', 'plus']), leger('ex07', '9 − 15', ['plus', 'min']), leger('ex08', '−5 − 8', ['min', 'min']), leger('ex09', '6 + 7', ['plus', 'plus']),
    leger('ex10', '−23 + 17', ['min', 'plus']), leger('ex11', '−12 + (−18)', ['min', 'min']), leger('ex12', '19 − (−8)', ['plus', 'plus'], true), leger('ex13', '−26 − (−29)', ['min', 'plus'], true) ] },
  { titel:'Optellen · stappenplan', vragen:[ stap('ex14', '−9 + (−6)', 2), stap('ex15', '−14 + 8', 2), stap('ex16', '27 + (−35)', 2) ] },
  { titel:'Aftrekken · stappenplan', vragen:[ stap('ex17', '7 − (−5)', 2), stap('ex18', '23 − 41', 2), stap('ex19', '−25 − (−11)', 2) ] },
  { titel:'Vergelijken', vragen:[ verg('ex20', [['−7 + 4', '−7 − 4'], ['5 − (−3)', '5 + 3'], ['−20 − (−6)', '−20 + 10']]), verg('ex21', [['18 + (−25)', '−25 + 18'], ['−9 − 9', '9 − 9'], ['0 − (−14)', '−14']]) ] },
  { titel:'Gedurige sommen', vragen:[ som('ex22', '12 − 7 − (−4) + (−9)', 4), som('ex23', '−6 + (−5) − (−13) − 8 + 2', 5), som('ex24', '15 − (−9) + (−21) − 14 + (−3) − (−6)', 6) ] },
  { titel:'Vraagstukken', vragen:[
    { id:'ex25', type:'eigen', soort:'context', punten:1.5, visual:'thermo', vis:{ start:-6, lo:-10, hi:15 }, unit:'°C', resLabel:'Temperatuur ’s middags',
      vraag:'Om 7.00 uur ’s morgens is het −6 °C. Tegen de middag is de temperatuur 11 graden gestegen. Hoeveel graden is het ’s middags?' },
    { id:'ex26', type:'eigen', soort:'context', punten:1.5, visual:'lift', vis:{ start:-3 }, unit:'', resLabel:'Verdieping',
      vraag:'Mila parkeert haar fiets op verdieping −3 van de parkeergarage. Ze neemt de lift 11 verdiepingen omhoog en daarna 5 verdiepingen omlaag. Op welke verdieping stapt ze uit?' },
    { id:'ex27', type:'eigen', soort:'context', punten:1.5, visual:'bank', vis:{ saldo:45, game:59, oma:20 }, unit:'€', unitBefore:true, resLabel:'Nieuw saldo',
      vraag:'Op de rekening van Jonas staat € 45. Hij koopt online een game van € 59. Daarna stort zijn oma € 20 op zijn rekening. Wat is nu het saldo van Jonas?' } ] },
  { titel:'Foutenjager', vragen:[
    jager('ex28', 'Lotte', '−13 − 4 = −9', '−13 − 4', ['Niets, de berekening is juist.', 'Ze telde 4 op in plaats van 4 af te trekken.', 'Ze vergat het minteken: de uitkomst moet positief zijn.', 'Ze had eerst 4 − 13 moeten berekenen.']),
    jager('ex29', 'Ahmed', '8 − (−6) = 2', '8 − (−6)', ['Hij had 8 en −6 moeten optellen tot −14.', 'Niets, de berekening is juist.', 'Hij werkte het dubbele teken niet weg: − (−6) wordt + 6.', 'Hij had eerst 6 − 8 moeten berekenen.']),
    jager('ex30', 'Noor', '−15 + 9 = −24', '−15 + 9', ['Ze telde 15 en 9 op, maar de tekens verschillen: dan neem je het verschil.', 'Het teken klopt niet: de uitkomst moet positief zijn.', 'Niets, de berekening is juist.', 'Ze had 9 − 15 moeten doen, met als uitkomst 6.']) ] }
];

const UITLEG = {
  numberline:'① Klik het startgetal aan. ② Klik waar je na de sprong uitkomt. ③ Noteer de uitkomst.',
  armiesFight:'Een min-leger en een plus-leger: elk minsoldaatje en elk plussoldaatje die elkaar tegenkomen, schakelen elkaar uit. Wie blijft er over?',
  armiesMerge:'Twee legers met hetzelfde teken vechten niet: ze voegen zich samen tot één groot leger.',
  armiesDouble:'Werk eerst het dubbele teken weg: klik de twee tekens aan. Stel daarna de legertjes op.',
  steps:'Gebruik het stappenplan. Noteer elke tussenstap. Kies voor elk getal het teken in het vakje ervoor. Een dubbel teken werk je weg door in de opgave de twee tekens aan te klikken.',
  compare:'Kies telkens het juiste teken. Je mag eerst in je schrift rekenen.',
  context:'Noteer eerst de bewerking. Vul daarna de uitkomst in.',
  errorhunt:'Kies wat er fout ging en noteer de juiste uitkomst.'
};
const BEGRIPPEN = {
  'getallenas':'Een rechte lijn waarop de getallen op gelijke afstanden staan: links van 0 de negatieve getallen, rechts de positieve.',
  'gedurige som':'Een som met meer dan twee termen, bijvoorbeeld 3 − 5 + 2 − 7.',
  'stappenplan':'Stap 1: dubbele tekens wegwerken. Bij een gedurige som: stap 2 alle plustermen en alle mintermen samennemen. Laatste stap: uitrekenen.',
  'legertjes':'Elk getal is een leger soldaatjes: negatieve getallen vormen een blauw min-leger, positieve getallen een rood plus-leger.',
  'dubbele teken':'Twee tekens na elkaar, zoals − (−5). Die werk je eerst weg.',
  'saldo':'Het bedrag dat op een rekening staat. Een negatief saldo betekent dat je rood staat.',
  'bewerking':'De berekening die je noteert, met getallen en tekens.'
};
const CODES = {
  TEGENGESTELDE:{ label:'Tegengestelde vergeten', uitleg:'Bij aftrekken het getal niet vervangen door zijn tegengestelde (bv. 7 − (−5) = 2 of −13 − 4 = −9).' },
  TOESTANDSTEKEN:{ label:'Fout toestandsteken', uitleg:'Het getal van de uitkomst klopt, maar het teken niet.' },
  ABS_OPGETELD:{ label:'Getallen opgeteld bij verschillende tekens', uitleg:'Bij een plus- en een minterm de getallen opgeteld in plaats van het verschil genomen (bv. −11 + 5 = −16).' },
  ABS_AFGETROKKEN:{ label:'Verschil genomen bij gelijke tekens', uitleg:'Bij twee termen met hetzelfde teken het verschil genomen in plaats van opgeteld.' },
  DUBBEL_TEKEN:{ label:'Dubbel teken fout weggewerkt', uitleg:'In stap 1 een dubbel teken zoals − (−4) of + (−9) verkeerd omgezet.' },
  STAP1_TEKEN:{ label:'Teken overgenomen fout (stap 1)', uitleg:'In stap 1 het teken van een term zonder haakjes verkeerd overgenomen.' },
  STAP1_GETAL:{ label:'Getal overgenomen fout (stap 1)', uitleg:'In stap 1 een getal verkeerd overgeschreven.' },
  SAMENNEMEN:{ label:'Fout bij samennemen (stap 2)', uitleg:'De plustermen of de mintermen verkeerd samengeteld.' },
  DOORWERKFOUT:{ label:'Doorwerkfout', uitleg:'Een eerdere stap was fout, maar daarna is correct verder gerekend.' },
  REKENFOUT:{ label:'Rekenfout', uitleg:'Een andere fout in de uitkomst.' },
  START:{ label:'Startgetal fout (getallenas)', uitleg:'Het verkeerde startgetal aangeduid op de getallenas.' },
  SPRONG_RICHTING:{ label:'Sprong in de verkeerde richting', uitleg:'Op de getallenas de juiste afstand gesprongen, maar in de verkeerde richting.' },
  SPRONG:{ label:'Sprong fout (getallenas)', uitleg:'Op de getallenas een verkeerde sprong gemaakt.' },
  LEGER_OPSTELLING:{ label:'Legers fout opgesteld', uitleg:'Niet het juiste aantal soldaatjes in een legervak.' },
  VERGELIJKEN:{ label:'Fout bij vergelijken', uitleg:'Minstens één vergelijking (<, >, =) fout.' },
  BEWERKING_FOUT:{ label:'Verkeerde bewerking', uitleg:'De genoteerde bewerking past niet bij het vraagstuk.' },
  BEWERKING_ONVOLLEDIG:{ label:'Bewerking onvolledig', uitleg:'De bewerking geeft de juiste uitkomst, maar niet alle getallen uit het vraagstuk staan erin.' },
  BEWERKING_ONLEESBAAR:{ label:'Bewerking onleesbaar', uitleg:'De bewerking kon niet gelezen worden.' },
  THERMOMETER:{ label:'Thermometer fout ingesteld', uitleg:'De tweede thermometer staat niet op de juiste temperatuur.' },
  FOUT_NIET_HERKEND:{ label:'Fout niet herkend (foutenjager)', uitleg:'De verkeerde uitleg gekozen bij de foutenjager.' }
};

/* ---------- rekenhulp (zoals code.gs) ---------- */
/* "15 − (−9) + (−21)" → termen [{ op, lit, t, double }] en waarde */
function termen(expr){
  const s = String(expr).replace(/[−–]/g, '-').replace(/\s+/g, '');
  const m = s.match(/^([+-]?\d+)(.*)$/); if(!m) throw new Error('onleesbaar: ' + expr);
  const t = [{ op:'+', lit:+m[1], t:+m[1], double:false }], re = /([+-])(\d+|\([+-]\d+\))/g; let mm, op = 0;
  while((mm = re.exec(m[2])) !== null){ const lit = +mm[2].replace(/[()]/g, ''); t.push({ op:mm[1], lit, t:mm[1] === '+' ? lit : -lit, double:mm[2][0] === '(' }); op += mm[0].length; }
  if(op !== m[2].length) throw new Error('onleesbaar: ' + expr);
  return { terms:t, value:t.reduce((a, x)=>a + x.t, 0) };
}
/* veilige rekenmachine voor de bewerking van een vraagstuk: getallen, + − en haakjes */
function reken(str){
  const s = String(str).replace(/[−–—]/g, '-').replace(/[€°cC]/g, '').replace(/\s+/g, '');
  if(!s || !/^[\d+\-()]+$/.test(s)) return null;
  let i = 0; const kijk = ()=>s[i];
  const expr = ()=>{ let v = un(); while(kijk() === '+' || kijk() === '-'){ const o = s[i++], w = un(); v = o === '+' ? v + w : v - w; } return v; };
  const un = ()=>{ if(kijk() === '-'){ i++; return -un(); } if(kijk() === '+'){ i++; return un(); } return at(); };
  const at = ()=>{ if(kijk() === '('){ i++; const v = expr(); if(kijk() !== ')') throw 0; i++; return v; } const m = s.slice(i).match(/^\d+/); if(!m) throw 0; i += m[0].length; return +m[0]; };
  try{ const v = expr(); return i === s.length ? v : null; }catch(e){ return null; }
}
const nat = x => { const t = String(x == null ? '' : x).trim(); return /^\d{1,6}$/.test(t) ? +t : null; };
const neg = s => s === '−' || s === '-';
const uit = v => { if(v.resSign == null) return null; const n = nat(v.res); return n == null ? null : neg(v.resSign) ? -n : n; };
const vgl = (a, b) => a < b ? '<' : a > b ? '>' : '=';
const teken = s => s == null ? '?' : neg(s) ? '−' : '+';
const uitTekst = v => v.resSign == null && !v.res ? '…' : (v.resSign == null ? '?' : neg(v.resSign) ? '−' : '') + (v.res === '' || v.res == null ? '…' : v.res);

/* typische fout in een uitkomst */
function fouten(P, r){
  const E = P.value;
  if(P.terms.length === 2){
    const t0 = P.terms[0].t, t1 = P.terms[1].t, b = P.terms[1];
    if(b.op === '-' && r === t0 + b.lit && r !== E) return ['TEGENGESTELDE'];
    if(b.double && r === t0 - t1 && r !== E) return ['DUBBEL_TEKEN'];
    if(r === -E && E !== 0) return ['TOESTANDSTEKEN'];
    const mix = (t0 < 0) !== (t1 < 0);
    if(mix && Math.abs(r) === Math.abs(t0) + Math.abs(t1)) return ['ABS_OPGETELD'];
    if(!mix && Math.abs(r) === Math.abs(Math.abs(t0) - Math.abs(t1))) return ['ABS_AFGETROKKEN'];
    return ['REKENFOUT'];
  }
  return r === -E && E !== 0 ? ['TOESTANDSTEKEN'] : ['REKENFOUT'];
}

/* ---------- verbeteren: { pts, codes, text } per soort ---------- */
const VERBETER = {
  numberline(q, v){
    const P = termen(q.expr), a = P.terms[0].t, E = P.value, codes = []; let pts = 0;
    const st = v.start == null ? null : +v.start, en = v.end == null ? null : +v.end;
    if(st === a) pts += .25; else if(st !== null) codes.push('START');
    if(en !== null && st !== null){
      if(en === E && st === a) pts += .25;
      else if(st === a && en - st === -(E - a)) codes.push('SPRONG_RICHTING');
      else if(en !== E) codes.push('SPRONG');
    }
    const r = uit(v); if(r === E) pts += .5; else if(r !== null) codes.push(...fouten(P, r));
    return { pts, codes };
  },
  armies(q, v){
    const P = termen(q.expr), E = P.value, codes = []; let pts = 0;
    const a = +v.a || 0, b = +v.b || 0;
    if(a === Math.abs(P.terms[0].t) && b === Math.abs(P.terms[1].t)) pts += .5; else if(a + b > 0) codes.push('LEGER_OPSTELLING');
    const r = uit(v); if(r === E) pts += .5; else if(r !== null) codes.push(...fouten(P, r));
    return { pts, codes };
  },
  steps(q, v){
    const P = termen(q.expr), E = P.value, n = P.terms.length, codes = []; let pts = 0;
    const s1 = Array.isArray(v.s1) ? v.s1 : [];
    let ok = 0, som = 0, eigen = true, plus = 0, min = 0;
    for(let i = 0; i < n; i++){
      const t = P.terms[i], x = s1[i] || {}, sg = x.sign === '+' ? 1 : neg(x.sign) ? -1 : 0, g = nat(x.n), wilT = t.t < 0 ? -1 : 1, wilG = Math.abs(t.t);
      if(sg === wilT && g === wilG) ok++;
      else { if(sg !== 0 && sg !== wilT) codes.push(t.double ? 'DUBBEL_TEKEN' : 'STAP1_TEKEN'); if(g !== null && g !== wilG) codes.push('STAP1_GETAL'); }
      if(sg === 0 || g === null) eigen = false; else { som += sg * g; if(sg > 0) plus += g; else min += g; }
    }
    pts += (q.collect ? 1 : .5) * ok / n;
    let eigenUit = eigen ? som : null;
    if(q.collect){
      const p = nat(v.plus), m = nat(v.min);
      if(p !== null && m !== null){ if(eigen && p === plus && m === min) pts += .5; else if(eigen) codes.push('SAMENNEMEN'); eigenUit = p - m; }
      else eigenUit = null;
    }
    const r = uit(v);
    if(r === E) pts += .5;
    else if(r !== null){
      if(eigenUit !== null && r === eigenUit && (ok !== n || codes.includes('SAMENNEMEN'))) codes.push('DOORWERKFOUT');
      else codes.push(...fouten(P, r));
    }
    return { pts, codes };
  },
  compare(q, v){
    const c = Array.isArray(v.c) ? v.c : [], codes = []; let ok = 0;
    q.items.forEach((it, i)=>{ const w = vgl(termen(it[0]).value, termen(it[1]).value); if(c[i] === w) ok++; else if(c[i]) codes.push('VERGELIJKEN'); });
    return { pts:ok / q.items.length, codes };
  },
  context(q, v, k){
    if(!k || !k.expr) return { pts:0, codes:[] };
    const E = termen(k.expr).value, codes = []; let pts = 0;
    const bew = String(v.bew || ''), links = bew.split('=')[0], w = reken(links);
    if(bew.trim()){
      if(w === null) codes.push('BEWERKING_ONLEESBAAR');
      else if(w !== E) codes.push('BEWERKING_FOUT');
      else { const g = (links.match(/\d+/g) || []).map(Number); if(k.numbers.every(x=>g.includes(x))) pts += .5; else { pts += .25; codes.push('BEWERKING_ONVOLLEDIG'); } }
    }
    const r = uit(v);
    if(r === E) pts += 1;
    else if(r !== null){ if(w !== null && w !== E && r === w) codes.push('DOORWERKFOUT'); else if(r === -E && E !== 0) codes.push('TOESTANDSTEKEN'); else codes.push('REKENFOUT'); }
    if(q.visual === 'thermo' && v.temp != null && +v.temp !== E) codes.push('THERMOMETER');
    return { pts, codes };
  },
  errorhunt(q, v, k){
    const P = termen(q.expr), E = P.value, codes = []; let pts = 0;
    if(k && v.choice === k.choice) pts += .5; else if(v.choice && k) codes.push('FOUT_NIET_HERKEND');
    const r = uit(v); if(r === E) pts += .5; else if(r !== null) codes.push(...fouten(P, r));
    return { pts, codes };
  }
};

/* ---------- volledig ingevuld? ---------- */
const uitAf = v => v.resSign != null && nat(v.res) != null;
const bewerkingOk = s => { const t = String(s || '').trim(); if(!t || !/^[\d\s+\-−–()=,.€°Cc]+$/.test(t)) return false; return (t.match(/\d+/g) || []).length >= 2 && /[+\-−–]/.test(t.replace(/^\s*[\-−–]/, '')); };
const VOLLEDIG = {
  numberline:(q, v)=>v.start != null && v.end != null && uitAf(v),
  armies:(q, v)=>(!q.doubleSign || !!(v.dub && v.dub.weg)) && v.a > 0 && v.b > 0 && v.fought && uitAf(v),
  steps:(q, v)=>v.s1.every(t=>t.sign && nat(t.n) != null) && (!q.collect || (nat(v.plus) != null && nat(v.min) != null)) && uitAf(v),
  compare:(q, v)=>v.c.every(x=>!!x),
  context:(q, v)=>(q.visual !== 'thermo' || v.temp != null) && bewerkingOk(v.bew) && uitAf(v),
  errorhunt:(q, v)=>!!v.choice && uitAf(v)
};
const LEEG = {
  numberline:()=>({ start:null, end:null, res:'', resSign:null }),
  armies:q=>Object.assign({ a:0, b:0, fought:false, res:'', resSign:null }, q.doubleSign ? { dub:{ sign:null, weg:false } } : {}),
  steps:q=>Object.assign({ s1:termen(q.expr).terms.map(t=>t.double ? { sign:null, n:'', weg:false } : { sign:null, n:'' }), res:'', resSign:null }, q.collect ? { plus:'', min:'' } : {}),
  compare:q=>({ c:q.items.map(()=>null) }),
  context:q=>Object.assign(q.visual === 'thermo' ? { temp:null } : {}, { bew:'', res:'', resSign:null }),
  errorhunt:()=>({ choice:null, res:'', resSign:null })
};

/* ---------- figuren (ook voor het dashboard en de pdf) ---------- */
function nlGeo(q){ const lo = q.range[0], hi = q.range[1], W = 1000, ML = 38, MR = 38, AX = 150, u = (W - ML - MR) / (hi - lo); return { lo, hi, W, AX, u, X:n=>ML + (n - lo) * u }; }
function nlBoog(g, a, b, voorlopig){
  if(a == null || b == null || a === b) return '';
  const x1 = g.X(a), x2 = g.X(b), d = b - a, y = g.AX - 10, h = Math.min(108, 30 + Math.abs(x2 - x1) * .2);
  return `<g class="${voorlopig ? 'nl-voorlopig' : ''}"><path class="nl-boog" d="M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - 2 * h} ${x2} ${y}" marker-end="url(#nl-pijl)"/>` +
    `<text class="nl-booglab" x="${(x1 + x2) / 2}" y="${y - h - 10}">${sprong(d)}</text>` + (voorlopig ? `<circle class="nl-voorlopigeinde" cx="${x2}" cy="${g.AX}" r="8"/>` : '') + '</g>';
}
function nlSVG(q, v, interactief){
  const g = nlGeo(q), X = g.X, AX = g.AX, stapLab = g.u >= 26 ? 1 : 5;
  let h = '<defs><marker id="nl-pijl" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="nl-pijlkop" d="M0,0 L10,5 L0,10 z"/></marker></defs>';
  h += `<rect x="0" y="0" width="${g.W}" height="240" fill="transparent"/><line class="nl-as" x1="${X(g.lo) - 18}" y1="${AX}" x2="${X(g.hi) + 22}" y2="${AX}"/><path class="nl-askop" d="M${X(g.hi) + 28},${AX} l-12,-7 l0,14 z"/>`;
  for(let n = g.lo; n <= g.hi; n++){
    const vijf = n % 5 === 0, l = n === 0 ? 14 : vijf ? 10 : 6;
    h += `<line class="nl-streep${vijf ? ' vijf' : ''}" x1="${X(n)}" y1="${AX - l}" x2="${X(n)}" y2="${AX + l}"/>`;
    if(n % stapLab === 0 || n === 0) h += `<text class="nl-lab${n === 0 ? ' nul' : ''}" x="${X(n)}" y="${AX + 32}">${fmt(n)}</text>`;
  }
  h += '<g class="nl-vast">' + nlBoog(g, v.start, v.end, false);
  if(v.end != null){ const ty = AX + (v.end === v.start ? 62 : 44);
    h += `<circle class="nl-einde" cx="${X(v.end)}" cy="${AX}" r="9"/><rect class="nl-tag" x="${X(v.end) - 34}" y="${ty}" width="68" height="28" rx="9"/><text class="nl-tagtxt" x="${X(v.end)}" y="${ty + 20}">${fmt(v.end)}</text>`; }
  h += '</g><g class="nl-voor"></g>';
  if(v.start != null){ h += `<circle class="nl-start" cx="${X(v.start)}" cy="${AX}" r="9"/>`; if(v.end !== v.start) h += `<text class="nl-starttxt" x="${X(v.start)}" y="${AX + 54}">start</text>`; }
  if(interactief) h += `<g class="nl-spook" style="display:none"><line x1="0" y1="34" x2="0" y2="${AX + 16}"/><rect x="-26" y="8" width="52" height="26" rx="8"/><text x="0" y="26"></text></g>`;
  return `<svg class="nl-svg" viewBox="0 0 ${g.W} 240" aria-label="Getallenas">${h}</svg>`;
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
  if(doel != null && doel !== s){
    const op = doel > s, x = cx - 70, y1 = thY(q, s), y2 = thY(q, doel), punt = op ? y2 + 2 : y2 - 2;
    h += `<line class="th-pijl${voorlopig ? ' voorlopig' : ''}" x1="${x}" y1="${y1}" x2="${x}" y2="${op ? y2 + 10 : y2 - 10}"/><path class="th-pijlkop" d="M${x - 8},${op ? y2 + 12 : y2 - 12} L${x},${punt} L${x + 8},${op ? y2 + 12 : y2 - 12} z"/>`;
    h += `<text class="th-sprong" x="${x - 10}" y="${(y1 + y2) / 2 + 6}">${sprong(doel - s)}</text>`;
  }
  if(doel != null && !voorlopig) h += thLabel(q, cx, doel, false);
  return h;
}
function thermoSVG(q, v, interactief){
  let h = `<text class="vt-titel" x="140" y="26">🌅 7.00 uur</text>` + thSchaal(q, 140) + thKwik(q, 140, q.vis.start) + thLabel(q, 140, q.vis.start, true);
  h += `<text class="vt-titel" x="330" y="26">☀️ 12.00 uur</text>` + thSchaal(q, 330) + `<g class="th-dyn">${thDyn(q, v.temp, false)}</g>`;
  if(interactief) h += `<rect class="th-raak" x="230" y="${TH.top - 20}" width="150" height="${TH.bot - TH.top + 80}"/>`;
  return `<svg class="vis-svg th-svg" viewBox="0 0 480 380" aria-label="Twee thermometers">${h}</svg>`;
}
function liftSVG(q){
  const fMin = -4, fMax = 10, fh = 24, top = 24, bx = 150, bw = 230, Y = f => top + (fMax - f) * fh;
  let h = `<rect x="0" y="0" width="460" height="${Y(-1)}" fill="#eef9f9"/><rect x="0" y="${Y(-1)}" width="460" height="${Y(fMin - 1) - Y(-1) + 10}" fill="#efe7da"/>`;
  for(let f = fMax; f >= fMin; f--){ const onder = f < 0;
    h += `<rect x="${bx}" y="${Y(f)}" width="${bw}" height="${fh}" fill="${onder ? '#ddd2c1' : '#ffffff'}" stroke="#9fb3b6" stroke-width="1"/>`;
    h += `<text x="${bx - 12}" y="${Y(f) + 17}" text-anchor="end" font-size="13" font-weight="${f === 0 ? 900 : 600}" fill="#173436">${fmt(f)}</text>`;
    if(!onder){ for(let w = 0; w < 4; w++) h += `<rect x="${bx + 70 + w * 38}" y="${Y(f) + 6}" width="22" height="12" rx="2" fill="#c4ebec"/>`; }
    else h += `<text x="${bx + 150}" y="${Y(f) + 17}" text-anchor="middle" font-size="12" fill="#7a6a55">P</text>`; }
  h += `<rect x="${bx + 8}" y="${Y(fMax)}" width="40" height="${Y(fMin - 1) - Y(fMax)}" fill="#e6eef0" stroke="#9fb3b6"/>`;
  h += `<line x1="0" y1="${Y(-1)}" x2="460" y2="${Y(-1)}" stroke="#5a8a3a" stroke-width="4"/><text x="398" y="${Y(-1) - 6}" font-size="11" fill="#3f6b28" font-weight="700" text-anchor="end">straatniveau</text>`;
  const s = q.vis.start;
  h += `<rect x="${bx + 11}" y="${Y(s) + 2}" width="34" height="${fh - 4}" rx="3" fill="#3bc1c5"/><text x="${bx + 28}" y="${Y(s) + 17}" text-anchor="middle" font-size="12">🧍</text>`;
  h += `<text x="${bx + 62}" y="${Y(s) + 17}" font-size="13" font-weight="800" fill="#173436">🚲 Mila</text><text x="${bx - 40}" y="${Y(fMax) - 8}" font-size="12" font-weight="800" fill="#173436">verdieping</text>`;
  return `<svg class="vis-svg lift-svg" viewBox="0 0 460 ${Y(fMin - 1) + 12}" aria-label="Gebouw met lift">${h}</svg>`;
}
const bankHTML = q => `<div class="bank"><div class="bank-top">🏦 Rekening van Jonas</div><div class="bank-saldo">Saldo<b>€ ${q.vis.saldo}</b></div>
  <div class="bank-lijst"><div>🎮 Aankoop game online<span>€ ${q.vis.game}</span></div><div>👵 Storting van oma<span>€ ${q.vis.oma}</span></div></div><div class="bank-nieuw">Nieuw saldo: <b>?</b></div></div>`;
const schrift = q => `<div class="schriftje"><div class="sj-naam">✏️ Schrift van ${esc(q.who)}</div><div class="sj-lijn">${esc(q.work)}</div><div class="sj-stempel">?</div></div>`;
const soldaat = soort => { const c = COL[soort], sym = soort === 'plus' ? `<path d="M12 16.5v6M9 19.5h6" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>` : `<path d="M9 19.5h6" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M6.5 6.5a5.5 5.5 0 0 1 11 0z" fill="${c}"/><circle cx="12" cy="8" r="4" fill="#f2c9a0"/><rect x="5" y="12.5" width="14" height="14" rx="4" fill="${c}"/><circle cx="12" cy="19.5" r="5" fill="#fff"/>${sym}<rect x="7" y="26" width="3.5" height="3.5" rx="1" fill="#35545a"/><rect x="13.5" y="26" width="3.5" height="3.5" rx="1" fill="#35545a"/></svg>`; };
const LEGER = { min:'Min-leger', plus:'Plus-leger' }, LEGERIC = { min:'➖', plus:'➕' };
const samen = q => q.camps[0] === q.camps[1];

/* ---------- lezen: dashboard, pdf, resultaat van de leerling ----------
   modus lezen (antwoord van de leerling), blanco (papier) of sleutel (juiste antwoord) */
function toon(q, a, modus, k){
  let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){}
  const blanco = modus === 'blanco', sl = modus === 'sleutel';
  if(modus === 'lezen' && !v) return '<p class="tl-niet">Niet ingevuld.</p>';
  if(blanco || sl || !v) v = LEEG[q.soort](q);
  const lijn = (l, r) => `<div class="tl"><span class="tl-l">${l}</span><span class="tl-r">${r}</span></div>`;
  const leeg = '<span class="tl-leeg">……</span>', w = x => x == null || x === '' ? leeg : esc(x);
  const E = q.expr ? termen(q.expr).value : k && k.expr ? termen(k.expr).value : null;
  const uitk = () => sl ? (E == null ? leeg : esc(fmt(E))) : blanco ? leeg : uitTekst(v) === '…' ? leeg : esc(uitTekst(v));
  switch(q.soort){
    case 'numberline': {
      const P = termen(q.expr), s = sl ? { start:P.terms[0].t, end:E } : v;
      return `<div class="rv-lees">${nlSVG(q, s, false)}${lijn(uitdr(q.expr) + ' =', uitk())}</div>`;
    }
    case 'armies': {
      const P = termen(q.expr), a1 = sl ? Math.abs(P.terms[0].t) : v.a, a2 = sl ? Math.abs(P.terms[1].t) : v.b, g = n => blanco || (!sl && !n) ? leeg : n + ' soldaatjes';
      return `<div class="rv-lees">${lijn(`${LEGERIC[q.camps[0]]} ${LEGER[q.camps[0]]}`, g(a1))}${lijn(`${LEGERIC[q.camps[1]]} ${LEGER[q.camps[1]]}`, g(a2))}`
        + (!sl && !blanco ? lijn('', v.fought ? (samen(q) ? 'samengevoegd' : 'gevecht uitgevoerd') : 'nog niet ' + (samen(q) ? 'samengevoegd' : 'gevochten')) : '')
        + lijn(uitdr(q.expr) + ' =', uitk()) + '</div>';
    }
    case 'steps': {
      const P = termen(q.expr);
      const s1 = sl ? P.terms.map(t=>({ sign:t.t < 0 ? '−' : '+', n:Math.abs(t.t) })) : v.s1;
      const r1 = blanco ? leeg : s1.map((t, i)=>`${i === 0 && t.sign === '+' ? '' : teken(t.sign) + ' '}${t.n === '' || t.n == null ? '…' : esc(t.n)}`).join(' ');
      let h = lijn('', uitdr(q.expr)) + lijn('=', r1);
      if(q.collect){ const pl = P.terms.filter(t=>t.t > 0).reduce((a, t)=>a + t.t, 0), mi = -P.terms.filter(t=>t.t < 0).reduce((a, t)=>a + t.t, 0);
        h += lijn('=', blanco ? leeg : sl ? `+ ${pl} − ${mi}` : `+ ${w(v.plus)} − ${w(v.min)}`); }
      return `<div class="rv-lees schrift-lees">${h}${lijn('=', uitk())}</div>`;
    }
    case 'compare': {
      return '<div class="rv-lees">' + q.items.map((it, i)=>{ const juist = vgl(termen(it[0]).value, termen(it[1]).value), keuze = sl ? juist : blanco ? null : v.c[i];
        return lijn(`${'abc'[i]})`, `${uitdr(it[0])} <span class="tl-vak">${keuze ? esc(keuze) : '&nbsp;'}</span> ${uitdr(it[1])}`); }).join('') + '</div>';
    }
    case 'context': {
      const fig = q.visual === 'thermo' ? thermoSVG(q, sl ? { temp:E } : v, false) : q.visual === 'lift' ? liftSVG(q) : bankHTML(q);
      const eenh = x => q.unitBefore ? `${esc(q.unit)} ${x}` : q.unit ? `${x} ${esc(q.unit)}` : x;
      return `<div class="rv-lees rv-lees-fig"><div class="tl-fig">${fig}</div><div>`
        + (q.visual === 'thermo' && !sl && !blanco ? lijn('Thermometer:', v.temp == null ? leeg : esc(fmt(v.temp)) + ' °C') : '')
        + lijn('Bewerking:', sl ? (k && k.expr ? uitdr(k.expr.replace(/-/g, '−')) : leeg) : blanco ? leeg : w(v.bew))
        + lijn(esc(q.resLabel) + ':', eenh(uitk())) + '</div></div>';
    }
    case 'errorhunt': {
      const keuze = sl ? k && k.choice : blanco ? null : v.choice;
      return `<div class="rv-lees">${lijn('Schrift van ' + esc(q.who) + ':', `<span class="tl-hand">${esc(q.work)}</span>`)}`
        + q.options.map(o=>`<div class="tl-opt"><span class="ov-vak${keuze === o.id ? ' aan' : ''}"></span> <b>${o.id.toUpperCase()}</b> ${esc(o.text)}</div>`).join('')
        + lijn('Juiste uitkomst: ' + uitdr(q.expr) + ' =', uitk()) + '</div>';
    }
  }
  return '';
}

/* ---------- invullen: de interactieve oefeningen ---------- */
const TYPEN = {};
Object.keys(LEEG).forEach(s=>{ TYPEN[s] = { leeg:LEEG[s], volledig:VOLLEDIG[s] }; });
TYPEN.numberline.uitleg = ()=>UITLEG.numberline;
TYPEN.armies.uitleg = q=>(q.doubleSign ? UITLEG.armiesDouble + ' ' : '') + (samen(q) ? UITLEG.armiesMerge : UITLEG.armiesFight);
['steps', 'compare', 'context', 'errorhunt'].forEach(s=>{ TYPEN[s].uitleg = ()=>UITLEG[s]; });

TYPEN.numberline.teken = c=>{
  const { q, v, ui } = c, RV = window.RV;
  if(!ui[q.id]) ui[q.id] = v.start == null ? 'start' : 'end';
  const mode = ui[q.id];
  c.root.querySelector('.rv-werk').classList.add('stapel');
  c.vis.innerHTML = nlSVG(q, v, true) + '<div class="rv-legende"><span><i class="lg-dot vol"></i>startgetal</span><span><i class="lg-dot hol"></i>eindpunt</span><span>de pijl toont je sprong: + naar rechts, − naar links</span></div>';
  c.ant.innerHTML = `<div class="nl-paneel"><div><h3>Werk met de getallenas</h3><p class="rv-tip">Duid eerst het startgetal aan. Beweeg daarna over de getallenas: de pijl toont hoe groot je sprong is. Klik om het eindpunt vast te zetten.</p>
    <div class="nl-modi"><button type="button" class="nl-modus${mode === 'start' ? ' aan' : ''}" data-mode="start">① Startgetal aanklikken <span class="val">${v.start != null ? fmt(v.start) : '…'}</span></button>
    <button type="button" class="nl-modus${mode === 'end' ? ' aan' : ''}" data-mode="end"${v.start == null ? ' disabled' : ''}>② Sprong maken <span class="val">${v.end != null && v.start != null ? sprong(v.end - v.start) : '…'}</span></button></div></div>
    <div><h3>③ Noteer de uitkomst</h3><p class="rv-tip">Schrijf het getal waar je uitkomt.</p><div class="rv-rij"><span class="rv-wisk">${uitdr(q.expr)} =</span>${RV.uitkomst(v)}</div>${RV.tekenTip}</div></div>`;
  c.ant.querySelectorAll('[data-mode]').forEach(b=>b.onclick = ()=>{ ui[q.id] = b.dataset.mode; c.teken(); });
  const svg = c.vis.querySelector('svg'), spook = svg.querySelector('.nl-spook'), voor = svg.querySelector('.nl-voor'), vast = svg.querySelector('.nl-vast'), g = nlGeo(q);
  const getalBij = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const x = pt.matrixTransform(svg.getScreenCTM().inverse()).x; return Math.max(g.lo, Math.min(g.hi, Math.round((x - g.X(g.lo)) / g.u + g.lo))); };
  let laatst = null;
  svg.onpointermove = ev=>{ const n = getalBij(ev); if(n === laatst) return; laatst = n;
    if(ui[q.id] === 'end' && v.start != null){ spook.style.display = 'none'; voor.innerHTML = nlBoog(g, v.start, n, true); vast.style.opacity = n === v.end ? 1 : .15; }
    else { voor.innerHTML = ''; spook.style.display = ''; spook.setAttribute('transform', `translate(${g.X(n)},0)`); spook.querySelector('text').textContent = fmt(n); } };
  svg.onpointerleave = ()=>{ spook.style.display = 'none'; voor.innerHTML = ''; vast.style.opacity = 1; laatst = null; };
  svg.onpointerdown = ev=>{ const n = getalBij(ev), w = RV.kopie(v);
    if(ui[q.id] === 'start' || w.start == null){ if(w.start !== n) w.end = null; w.start = n; ui[q.id] = 'end'; } else w.end = n;
    c.bewaar(w); c.teken(); };
};

TYPEN.armies.teken = c=>{
  const { q, v, ui } = c, RV = window.RV, merge = samen(q), cnt = [v.a, v.b], anim = ui.legerAnim, wacht = q.doubleSign && !(v.dub && v.dub.weg), lock = v.fought || anim || wacht, klein = v.a + v.b > 36, MAX = 30;
  const troepen = (soort, n, gevallen, extra) => !n ? '<div class="leeg-kamp">Klik hier om soldaatjes<br>toe te voegen</div>'
    : Array.from({ length:n }, (_, i)=>`<span class="soldaat${klein ? ' klein' : ''}${i < gevallen ? ' dood' : ''}${extra || ''}">${soldaat(soort)}</span>`).join('');
  if(merge && v.fought){
    const s = q.camps[0];
    c.vis.innerHTML = `<div class="slag enkel"><div class="kamp ${s} samen"><div class="kampkop"><span>${LEGERIC[s]} ${LEGER[s]} (samengevoegd)</span><span class="cnt">${v.a + v.b}</span></div><div class="troepen t-samen">${troepen(s, v.a + v.b, 0)}</div></div></div>`;
  } else {
    const k = merge ? 0 : Math.min(v.a, v.b);
    const kamp = idx => { const s = q.camps[idx], n = cnt[idx], gev = v.fought ? k : 0;
      return `<div class="kamp ${s}${lock ? '' : ' klikbaar'}" data-kamp="${idx}"><div class="kampkop"><span>${LEGERIC[s]} ${LEGER[s]}</span><span class="cnt">${v.fought ? (n - gev) + ' over' : n}</span></div>
        <div class="troepen t${idx}">${troepen(s, n, gev)}</div>${lock ? '' : '<div class="kamptip">klik in het vak: soldaatje erbij · klik op een soldaatje: weg</div>'}</div>`; };
    c.vis.innerHTML = `<div class="slag">${kamp(0)}<div class="vs">${merge ? '🤝' : '⚔️'}</div>${kamp(1)}</div>`;
  }
  const rij = idx => { const s = q.camps[idx], n = cnt[idx];
    return `<div class="legerrij ${s}"><span class="lbl">${LEGERIC[s]} ${LEGER[s]}</span><span class="aantal">${n}</span>
      <button type="button" data-leger="${idx}" data-d="1"${lock || n >= MAX ? ' disabled' : ''}>1 erbij</button><button type="button" data-leger="${idx}" data-d="5"${lock || n > MAX - 5 ? ' disabled' : ''}>5 erbij</button><button type="button" data-leger="${idx}" data-d="-1"${lock || n <= 0 ? ' disabled' : ''}>1 weg</button></div>`; };
  const actie = merge ? '🤝 Samenvoegen!' : '⚔️ Ten aanval!';
  let nr = 0; const cirkel = () => '①②③'[nr++];
  const dub = q.doubleSign ? (()=>{ const P = termen(q.expr), t0 = P.terms[0], t1 = P.terms[1], op = t1.op === '-' ? '−' : '+';
    const nieuw = v.dub.weg ? ` <span class="rv-op">=</span> ${esc(fmt(t0.t))} <span class="rv-op">${v.dub.sign}</span> ${Math.abs(t1.lit)}` : '';
    return `<div class="rv-rij"><h3 class="rv-inline">${cirkel()} Dubbel teken wegwerken:</h3><span class="rv-wisk">${esc(fmt(t0.t))} ${RV.dubbel('dub', op, t1.lit < 0 ? '−' : '+', Math.abs(t1.lit), v.dub.weg)}${nieuw}</span></div>`
      + (v.dub.weg ? '' : `<p class="rv-tip">${RV.dubbelTip}</p>`); })() : '';
  c.ant.innerHTML = dub + `<h3>${cirkel()} Stel je legers op</h3>${q.doubleSign && !wacht ? '' : `<p class="rv-tip">${wacht ? 'Werk eerst het dubbele teken weg.' : 'Zet in elk vak het juiste aantal soldaatjes.'}</p>`}${rij(0)}${rij(1)}`
    + (v.fought ? '<button type="button" class="btn ghost rv-breed opnieuw">↺ Legers opnieuw opstellen</button>' : `<button type="button" class="btn rv-breed aanval"${v.a === 0 || v.b === 0 || anim || wacht ? ' disabled' : ''}>${actie}</button>`)
    + (q.doubleSign && !v.fought ? '' : `<p class="rv-tip">${v.fought ? (merge ? 'De legers zijn samengevoegd. Hoeveel soldaatjes telt het leger nu?' : 'Het gevecht is voorbij. Tel de soldaatjes die overblijven.') : `Klik op ${actie.slice(3)} als je legers klaarstaan.`}</p>`)
    + `<h3>${cirkel()} Noteer de uitkomst</h3><div class="rv-rij"><span class="rv-wisk">${uitdr(q.expr)} =</span>${RV.uitkomst(v)}</div>${RV.tekenTip}`;
  const wijzig = (idx, d)=>{ const w = RV.kopie(v), key = idx ? 'b' : 'a', voor = w[key]; w[key] = Math.max(0, Math.min(MAX, w[key] + d)); if(w[key] === voor) return;
    w.fought = false; c.bewaar(w); c.teken();
    if(d > 0){ const s = c.vis.querySelectorAll(`.t${idx} .soldaat`); for(let i = Math.max(0, s.length - d); i < s.length; i++) s[i].classList.add('erbij'); } };
  c.ant.querySelectorAll('[data-leger]').forEach(b=>b.onclick = ()=>wijzig(+b.dataset.leger, +b.dataset.d));
  if(!lock) c.vis.querySelectorAll('.kamp[data-kamp]').forEach(k=>k.onclick = ev=>wijzig(+k.dataset.kamp, ev.target.closest('.soldaat') ? -1 : 1));
  const op = c.ant.querySelector('.opnieuw'); if(op) op.onclick = ()=>{ const w = RV.kopie(v); w.fought = false; c.bewaar(w); c.teken(); };
  const at = c.ant.querySelector('.aanval'); if(at) at.onclick = ()=>merge ? samenvoegen(c) : vechten(c);
};
function vergrendel(c){ c.ant.querySelectorAll('[data-leger], .aanval').forEach(b=>b.disabled = true); c.vis.querySelectorAll('.kamp').forEach(k=>{ k.onclick = null; k.classList.remove('klikbaar'); }); c.vis.querySelectorAll('.kamptip').forEach(t=>t.remove()); }
function vechten(c){
  const v = c.v, k = Math.min(v.a, v.b); c.ui.legerAnim = true; c.bezig(true); vergrendel(c);
  c.vis.querySelector('.vs').classList.add('vecht');
  const s0 = c.vis.querySelectorAll('.t0 .soldaat'), s1 = c.vis.querySelectorAll('.t1 .soldaat'), stap = Math.max(45, Math.min(140, 1400 / k));
  for(let i = 0; i < k; i++) setTimeout(()=>{ if(s0[i]) s0[i].classList.add('raak'); if(s1[i]) s1[i].classList.add('raak'); }, i * stap);
  setTimeout(()=>{ c.ui.legerAnim = false; c.bezig(false); const w = window.RV.kopie(v); w.fought = true; c.bewaar(w); if(c.nogHier()) c.teken(); }, k * stap + 550);
}
/* samenvoegen: de soldaatjes marcheren naar één groot leger */
function samenvoegen(c){
  c.ui.legerAnim = true; c.bezig(true); vergrendel(c);
  const oud = [...c.vis.querySelectorAll('.t0 .soldaat, .t1 .soldaat')].map(e=>e.getBoundingClientRect());
  const w = window.RV.kopie(c.v); w.fought = true; c.bewaar(w); c.teken();
  const nu = [...c.vis.querySelectorAll('.t-samen .soldaat')];
  nu.forEach((e, i)=>{ const o = oud[i]; if(!o) return; const n = e.getBoundingClientRect(); e.style.transition = 'none'; e.style.transform = `translate(${o.left - n.left}px,${o.top - n.top}px)`; });
  requestAnimationFrame(()=>requestAnimationFrame(()=>nu.forEach((e, i)=>{ e.style.transition = ''; e.classList.add('vlieg'); e.style.transitionDelay = (i * .02) + 's'; e.style.transform = ''; })));
  setTimeout(()=>{ c.ui.legerAnim = false; c.bezig(false); if(c.nogHier()) c.teken(); }, 900 + nu.length * 20);
}

TYPEN.steps.teken = c=>{
  const { q, v } = c, RV = window.RV;
  const plan = q.collect ? ['Stap 1 · dubbele tekens wegwerken', 'Stap 2 · plustermen en mintermen samennemen', 'Stap 3 · uitrekenen'] : ['Stap 1 · dubbele tekens wegwerken', 'Stap 2 · uitrekenen'];
  c.root.querySelector('.rv-werk').classList.add('stapel');
  c.vis.innerHTML = '<div class="plan">' + plan.map(p=>`<span>${p}</span>`).join('') + '</div>';
  const P = termen(q.expr), dubbel = P.terms.some(t=>t.double);
  const orig = P.terms.map((t, i)=>i === 0 ? esc(fmt(t.lit)) : !t.double ? ` <span class="rv-op">${t.op === '-' ? '−' : '+'}</span> ${t.lit}`
    : ' ' + RV.dubbel(`s1.${i}`, t.op === '-' ? '−' : '+', t.lit < 0 ? '−' : '+', Math.abs(t.lit), v.s1[i].weg)).join('');
  const tekenvak = (t, i) => !P.terms[i].double ? RV.teken(`s1.${i}.sign`, t.sign, `teken van term ${i + 1}`, i === 0)
    : t.weg ? `<span class="vast-teken" title="uit het dubbele teken">${esc(t.sign)}</span>` : '<span class="rv-teken-wacht" title="Klik eerst in de opgave de twee tekens van het dubbele teken aan">?</span>';
  const term = v.s1.map((t, i)=>`<span class="rv-term">${tekenvak(t, i)}${RV.getal(`s1.${i}.n`, t.n, 'nat', '', `getal van term ${i + 1}`)}</span>`).join('');
  const rij2 = q.collect ? `<div class="srij"><span class="gelijk">=</span><div class="termen"><span class="rv-term"><span class="vast-teken">+</span>${RV.getal('plus', v.plus, 'nat', '', 'som van de plustermen')}</span><span class="rv-term"><span class="vast-teken">−</span>${RV.getal('min', v.min, 'nat', '', 'som van de mintermen')}</span></div><span class="stapnaam">Stap 2</span></div>` : '';
  c.ant.innerHTML = `<div class="schrift"><div class="srij"><span></span><span class="orig">${orig}</span><span></span></div>
    <div class="srij"><span class="gelijk">=</span><div class="termen">${term}</div><span class="stapnaam">Stap 1</span></div>${rij2}
    <div class="srij"><span class="gelijk">=</span><div class="termen">${RV.uitkomst(v)}</div><span class="stapnaam">Stap ${q.collect ? 3 : 2}</span></div></div>
    <p class="rv-tip">${dubbel ? RV.dubbelTip + ' ' : ''}Stap 1: kies voor elk getal het teken (<b>+</b> of <b>−</b>) en schrijf het getal <b>zonder</b> teken ernaast. ${q.collect ? 'Stap 2: tel alle plustermen samen en alle mintermen samen. Stap 3: reken uit.' : 'Stap 2: reken uit.'} Kies ook het toestandsteken van je uitkomst.</p>`;
};

TYPEN.compare.teken = c=>{
  const { q, v } = c, RV = window.RV;
  c.root.querySelector('.rv-werk').classList.add('stapel');
  c.ant.innerHTML = q.items.map((it, i)=>`<div class="vglrij"><div class="l"><span class="vglletter">${'abc'[i]})</span>${uitdr(it[0])}</div><div class="vglknoppen">`
    + ['<', '>', '='].map(s=>`<button type="button" class="vglknop${v.c[i] === s ? ' aan' : ''}" data-vgl="${i}" data-s="${esc(s)}" aria-pressed="${v.c[i] === s}">${esc(s)}</button>`).join('')
    + `</div><div class="r">${uitdr(it[1])}</div></div>`).join('');
  c.ant.querySelectorAll('[data-vgl]').forEach(b=>b.onclick = ()=>{ const w = RV.kopie(v); w.c[+b.dataset.vgl] = b.dataset.s; c.bewaar(w); c.teken(); });
};

TYPEN.context.teken = c=>{
  const { q, v, ui } = c, RV = window.RV, thermo = q.visual === 'thermo';
  c.vis.innerHTML = thermo ? thermoSVG(q, v, true) + '<div class="rv-legende"><span>Beweeg over de rechtse thermometer en klik of sleep om de temperatuur in te stellen.</span></div>' : q.visual === 'lift' ? liftSVG(q) : bankHTML(q);
  const voor = q.unitBefore ? `<span class="eenheid">${esc(q.unit)}</span>` : '', na = !q.unitBefore && q.unit ? `<span class="eenheid">${esc(q.unit)}</span>` : '';
  let nr = 0; const cirkel = () => '①②③'[nr++];
  c.ant.innerHTML = (thermo ? `<h3>${cirkel()} Stel de thermometer in</h3><p class="rv-tip">Stel de rechtse thermometer in op de temperatuur van ’s middags.</p>
      <div class="th-paneel">Sprong: <span class="val">${v.temp == null ? '…' : sprong(v.temp - q.vis.start)}</span></div>` : '')
    + `<h3>${cirkel()} Bewerking</h3><p class="rv-tip">Schrijf de berekening met de getallen uit het vraagstuk, bijvoorbeeld met +, − en haakjes.</p>${RV.bewerkingVak('bew', v.bew)}
    <h3>${cirkel()} Antwoord</h3><div class="rv-rij"><span class="rv-lbl">${esc(q.resLabel)}:</span>${voor}${RV.uitkomst(v, 'breed')}${na}</div>${RV.tekenTip}`;
  if(!thermo) return;
  const svg = c.vis.querySelector('svg'), raak = svg.querySelector('.th-raak'), dyn = svg.querySelector('.th-dyn');
  const tempBij = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const y = pt.matrixTransform(svg.getScreenCTM().inverse()).y; return Math.max(q.vis.lo, Math.min(q.vis.hi, Math.round(q.vis.lo + (TH.bot - y) * (q.vis.hi - q.vis.lo) / (TH.bot - TH.top)))); };
  let laatst = null, w = RV.kopie(v);
  const zet = t => { w = RV.kopie(c.v); w.temp = t; c.v.temp = t; c.bewaar(w); };
  raak.onpointermove = ev=>{ const t = tempBij(ev); if(t === laatst) return; laatst = t; if(ui.thSleep){ zet(t); dyn.innerHTML = thDyn(q, t, false); } else dyn.innerHTML = thDyn(q, t, true); };
  raak.onpointerdown = ev=>{ ui.thSleep = true; try{ raak.setPointerCapture(ev.pointerId); }catch(e){} const t = tempBij(ev); laatst = t; zet(t); dyn.innerHTML = thDyn(q, t, false); };
  const stop = ()=>{ if(ui.thSleep){ ui.thSleep = false; c.teken(); } };
  raak.onpointerup = stop; raak.onpointercancel = stop;
  raak.onpointerleave = ()=>{ if(!ui.thSleep){ laatst = null; dyn.innerHTML = thDyn(q, c.v.temp, false); } };
};

TYPEN.errorhunt.teken = c=>{
  const { q, v } = c, RV = window.RV;
  c.vis.innerHTML = schrift(q);
  c.ant.innerHTML = '<h3>① Wat ging er mis?</h3><div class="keuzes">' + q.options.map(o=>`<button type="button" class="keuze${v.choice === o.id ? ' aan' : ''}" data-keuze="${o.id}" aria-pressed="${v.choice === o.id}"><span class="letter">${o.id.toUpperCase()}</span><span>${esc(o.text)}</span></button>`).join('')
    + `</div><h3>② Wat is de juiste uitkomst?</h3><div class="rv-rij"><span class="rv-wisk">${uitdr(q.expr)} =</span>${RV.uitkomst(v)}</div>${RV.tekenTip}`;
  c.ant.querySelectorAll('[data-keuze]').forEach(b=>b.onclick = ()=>{ const w = RV.kopie(v); w.choice = b.dataset.keuze; c.bewaar(w); c.teken(); });
};

const OPG = window.OPGAVE = {
  id:'2a-rv-2-gehele-optellen', css:'opgave.css', delen:DELEN, begrippen:BEGRIPPEN, codes:CODES,
  verbeter(q, v, k){ const r = VERBETER[q.soort](q, v, k); return { pts:Math.round(Math.min(q.punten, r.pts) * 100) / 100, codes:[...new Set(r.codes)] }; },
  volledig(q, a){ let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){} return !!v && VOLLEDIG[q.soort](q, v); },
  toon,
  invullen:opts=>window.RV.maak(OPG, TYPEN, opts)
};
})();
