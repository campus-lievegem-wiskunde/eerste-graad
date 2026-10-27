/* 2A Rekenvaardigheden 5 · Vermenigvuldigen en delen van rationale getallen (30 oefeningen, interactief met gedeeld/rv-kader.js en gedeeld/rv-breuk.js).
   Oefeningen, volgorde en uitleg zoals het oorspronkelijke Oefening.html; verbeteren zoals code.gs: deelpunten, foutcodes en
   rode kruisjes ("teller : teller" terwijl het niet opging, een onmogelijke schrap, onmogelijke knipgetallen, "kan niet eenvoudiger" terwijl het wel kon).
   De getallen in het sjabloon van de vraagstukken en de juiste keuze bij de foutenjager staan enkel in de versleutelde sleutel
   (sleutel.enc.json). De andere uitkomsten volgen uit de opgave zelf.
   Factoren f = [[teller met teken, noemer], [teller, noemer, '⋅' of ':'], …], zoals in code.gs. */
(function(){
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ggd = (a, b)=>{ a = Math.abs(a); b = Math.abs(b); while(b){ const t = a % b; a = b; b = t; } return a; };
/* breuken tonen (ook in het dashboard en de pdf: de stijl komt uit gedeeld/rv-breuk.css via opgave.css) */
const brS = (t, n) => `<span class="br"><span class="br-t">${t}</span><span class="br-n">${n}</span></span>`;
const br = (num, den) => (num < 0 ? '−' : '') + (den === 1 ? `<span class="br-int">${Math.abs(num)}</span>` : brS(Math.abs(num), den));
const fx = s => esc(s).replace(/~−(\d+)\/(\d+)/g, (m, a, b)=>brS('−' + a, b)).replace(/(\d+)\/(\d+)/g, (m, a, b)=>brS(a, b)).replace(/ ([+−⋅:]) /g, ' <span class="rv-op">$1</span> ');
const nat = x => { const t = String(x == null ? '' : x).trim(); return /^\d{1,7}$/.test(t) ? +t : null; };
const neg = s => s === '−' || s === '-';
const leeg = '<span class="tl-leeg">……</span>';

/* ---------- oefeningen ---------- */
const E = (id, soort, punten, vraag, extra) => Object.assign({ id, type:'eigen', soort, punten, vraag }, extra);
const rh = (id, a, b) => E(id, 'area', 2, `Bereken ${brS(...a)} van ${brS(...b)} met het rechthoekmodel.`, { a, b, f:[a, [b[0], b[1], '⋅']] });
const stap = (id, expr, f, zin) => E(id, 'msteps', 2, zin ? `Bereken ${fx(expr)}. ${zin}` : `Bereken ${fx(expr)} met het stappenplan.`, { expr, f });
const GEHEEL = 'Een geheel getal schrijf je als breuk met noemer 1.';
const combo = (id, expr, f, dec) => E(id, 'msteps', 2.5, `Bereken ${fx(expr)}. Zet het kommagetal eerst om naar een breuk.`, { expr, f, combo:true, dec:[dec] });
const komma = (id, expr, d) => E(id, 'dmul', 1.5, `Bereken ${fx(expr)} met het stappenplan voor kommagetal maal kommagetal.`, { expr, d });
const vraag = (id, zin, visual, tpl, resLabel, unit, extra) => E(id, 'context', 2, zin, Object.assign({ visual, tpl, resLabel, unit }, extra));
const tweeling = (id, exprs, parts) => E(id, 'twins', 1.5, 'Dezelfde getallen, een andere bewerking. Bereken allebei.', { exprs, parts });
const jager = (id, who, work, expr, f, options) => E(id, 'errfrac', 1.5, `${who} maakte een fout. Kan jij ze vinden?`, { who, work, expr, f, options:options.map((text, i)=>({ id:'abcd'[i], text })) });
const DELEN = [
  { titel:'Breuk van een breuk', vragen:[ rh('ex01', [3, 4], [2, 3]), rh('ex02', [3, 5], [1, 2]), rh('ex03', [5, 6], [3, 4]) ] },
  { titel:'Vermenigvuldigen', vragen:[
    stap('ex04', '−4/9 ⋅ 6/16', [[-4, 9], [6, 16, '⋅']]),
    stap('ex05', '−3/4 ⋅ (−9/2)', [[-3, 4], [-9, 2, '⋅']]),
    stap('ex06', '~−18/24 ⋅ (−4/14)', [[-18, 24], [-4, 14, '⋅']]),
    stap('ex07', '8/50 ⋅ 25/40', [[8, 50], [25, 40, '⋅']]),
    stap('ex08', '−3 ⋅ 4/5', [[-3, 1], [4, 5, '⋅']], 'Gebruik het stappenplan. ' + GEHEEL),
    stap('ex09', '−2/9 ⋅ 45/25 ⋅ 5/4', [[-2, 9], [45, 25, '⋅'], [5, 4, '⋅']]) ] },
  { titel:'Delen', vragen:[
    stap('ex10', '10/7 : 5', [[10, 7], [5, 1, ':']], GEHEEL),
    stap('ex11', '7/8 : 5/2', [[7, 8], [5, 2, ':']]),
    stap('ex12', '~−8/3 : 4', [[-8, 3], [4, 1, ':']], GEHEEL),
    stap('ex13', '−2/3 : (−5/6)', [[-2, 3], [-5, 6, ':']]),
    stap('ex14', '12/35 : (−4/7)', [[12, 35], [-4, 7, ':']]),
    stap('ex15', '~−21/12 : 49/8', [[-21, 12], [49, 8, ':']]) ] },
  { titel:'Kommagetallen', vragen:[
    komma('ex16', '0,3 ⋅ 0,4', [['0,3', 1], ['0,4', 1]]),
    komma('ex17', '−1,5 ⋅ 0,06', [['1,5', -1], ['0,06', 1]]),
    E('ex18', 'dfact', 1.5, 'Weetjes die je van buiten kent. Vul aan.', { rows:[['8', ':', '0,5'], ['−6', '⋅', '0,5'], ['4,7', ':', '0,1'], ['35', '⋅', '0,01'], ['2,4', ':', '0,001'], ['−9', '⋅', '0,1']] }) ] },
  { titel:'Breuken en kommagetallen', vragen:[
    combo('ex19', '0,75 : (−1/4)', [[3, 4], [-1, 4, ':']], '0,75'),
    combo('ex20', '1,25 ⋅ 3/5', [[5, 4], [3, 5, '⋅']], '1,25') ] },
  { titel:'Vraagstukken', vragen:[
    vraag('ex21', `Een dokter raadt aan om ${fx('3/8')} van een dag te slapen. Hoeveel uur moet je dan slapen?`, 'dag', { kind:'van', second:'nat' }, 'Je moet slapen', 'uur'),
    vraag('ex22', `De smartphone van Thaïsa staat voor ${fx('4/9')} vol. Ze koopt een nieuwe smartphone met dubbel zoveel opslag en zet al haar bestanden erop. Voor welk deel staat de nieuwe smartphone vol?`, 'gsm', { kind:'div', second:'nat' }, 'De nieuwe smartphone staat vol voor', ''),
    vraag('ex23', `Een fles bevat ${fx('3/4')} liter limonade. Je schenkt glaasjes van ${fx('1/8')} liter. Hoeveel glaasjes kan je vullen?`, 'fles', { kind:'div', second:'frac' }, 'Je kan vullen', 'glaasjes'),
    vraag('ex24', `${fx('3/5')} van de leerlingen komt met de fiets naar school. Slechts ${fx('1/4')} van die fietsers draagt een helm. Welk deel van alle leerlingen komt met de fiets én draagt een helm?`, 'rooster', { kind:'van', second:'frac' }, 'Deel van alle leerlingen', '', { icons:['🚲', 'helm'] }),
    vraag('ex25', `${fx('2/3')} van de leerlingen eet ’s middags op school. ${fx('3/4')} van hen neemt soep. Welk deel van alle leerlingen eet op school én neemt soep?`, 'rooster', { kind:'van', second:'frac' }, 'Deel van alle leerlingen', '', { icons:['🍽️', '🥣'] }) ] },
  { titel:'Tweelingsommen', vragen:[
    tweeling('ex26', ['2/5 + 3/5', '2/5 ⋅ 3/5'], [{ op:'+', f:[[2, 5], [3, 5]] }, { op:'⋅', f:[[2, 5], [3, 5]] }]),
    tweeling('ex27', ['−3/4 + 2/3', '−3/4 : 2/3'], [{ op:'+', f:[[-3, 4], [2, 3]] }, { op:':', f:[[-3, 4], [2, 3]] }]) ] },
  { titel:'Foutenjager', vragen:[
    jager('ex28', 'Emma', '2/5 ⋅ 3/5 = 6/5', '2/5 ⋅ 3/5', [[2, 5], [3, 5, '⋅']], ['Niets, de berekening is juist.', 'Ze moest eerst gelijknamig maken.', 'Ze hield de noemer zoals bij optellen. Bij vermenigvuldigen doe je ook noemer maal noemer.', 'De uitkomst moet negatief zijn.']),
    jager('ex29', 'Daan', '3/4 : 2/5 = 3/4 ⋅ 2/5 = 6/20 = 3/10', '3/4 : 2/5', [[3, 4], [2, 5, ':']], ['Hij vergat te vereenvoudigen.', 'Hij maakte van delen vermenigvuldigen, maar vergat de tweede breuk om te keren.', 'Niets, de berekening is juist.', 'Hij moest de eerste breuk omkeren.']),
    jager('ex30', 'Sara', '−2/3 ⋅ (−9/4) = −18/12 = −3/2', '−2/3 ⋅ (−9/4)', [[-2, 3], [-9, 4, '⋅']], ['Ze vereenvoudigde fout: 18/12 is niet gelijk aan 3/2.', 'Ze moest de noemers optellen.', 'Niets, de berekening is juist.', 'Twee minnen maken plus: de uitkomst is positief.']) ] }
];
const UITLEG = {
  area:'① Verdeel de rechthoek in kolommen en kleur de tweede breuk (paars). ② Verdeel in rijen en kleur het deel ervan (geel). ③ Het dubbel gekleurde deel is de uitkomst. Reken ook uit: schrap vooraf, ook diagonaal.',
  msteps:'① Bepaal het teken (tel de minnen). ② Schrap vooraf: een teller en een noemer door hetzelfde getal delen, ook diagonaal. ③ Teller maal teller, noemer maal noemer. ④ Eenvoudigste vorm.',
  mdiv:'① Bepaal het teken. ② Kies je aanpak: lukt teller : teller en noemer : noemer? Doe dat. Lukt het niet? Vermenigvuldig met het omgekeerde, schrap vooraf en reken uit. ③ Eenvoudigste vorm.',
  combo:'Zet het kommagetal eerst om naar een breuk en vereenvoudig die. Daarna het stappenplan.',
  dmul:'① Reken uit zonder komma’s. ② Tel alle cijfers na de komma samen: de komma schuift dan vanzelf op zijn plaats. Let op: dit werkt enkel bij kommagetal maal kommagetal, niet bij optellen of aftrekken.',
  dfact:'Deze weetjes ken je van buiten. Kies de bewerking (⋅ of :), vul het getal aan en reken uit.',
  context:'Vul de bewerking in het sjabloon in. Reken daarna uit met het stappenplan: schrap vooraf, ook diagonaal.',
  twins:'Let goed op de bewerking: optellen of vermenigvuldigen/delen? Geef beide uitkomsten in de eenvoudigste vorm.',
  errfrac:'Kies wat er fout ging en noteer de juiste uitkomst in de eenvoudigste vorm.'
};
const BEGRIPPEN = {
  'omgekeerde':'Het omgekeerde van een breuk krijg je door teller en noemer van plaats te wisselen: het omgekeerde van 2/5 is 5/2.',
  'schrap':'Vooraf vereenvoudigen: deel een getal uit de teller en een getal uit de noemer door hetzelfde getal.',
  'stappenplan':'Stap 1: teken. Stap 2: één breukstreep en schrappen. Stap 3: teller maal teller, noemer maal noemer. Stap 4: eenvoudigste vorm.',
  'vereenvoudig':'Teller en noemer door hetzelfde getal delen tot het niet meer kan.',
  'kladblad':'Een blad papier waarop je je berekening noteert.',
  'kommagetal':'Een getal met een komma, zoals 0,75. Het laatste cijfer bepaalt de noemer: tienden (10), honderdsten (100), duizendsten (1000).',
  'rechthoekmodel':'Een rechthoek die je in kolommen en rijen verdeelt. Het dubbel gekleurde deel is het product van de twee breuken.'
};
const CODES = {
  NOEMER_BEHOUDEN:{ label:'Noemer behouden zoals bij optellen', uitleg:'Bij vermenigvuldigen de tellers vermenigvuldigd maar de noemer gehouden (bv. 2/5 ⋅ 3/5 = 6/5).' },
  OPGETELD_I_P_V_MAAL:{ label:'Opgeteld in plaats van vermenigvuldigd/gedeeld', uitleg:'De uitkomst is die van de optelling in plaats van het product of quotiënt.' },
  MAAL_I_P_V_PLUS:{ label:'Vermenigvuldigd in plaats van opgeteld', uitleg:'Bij een optelling de breuken vermenigvuldigd (teller maal teller, noemer maal noemer).' },
  TELLERS_NOEMERS_OPGETELD:{ label:'Tellers en noemers opgeteld', uitleg:'Bij een optelling de tellers en de noemers opgeteld (bv. 2/5 + 3/5 = 5/10).' },
  NIET_OMGEKEERD:{ label:'Niet vermenigvuldigd met het omgekeerde', uitleg:'Bij delen de tweede breuk niet omgekeerd (bv. 3/4 : 2/5 = 3/4 ⋅ 2/5).' },
  TD_ONMOGELIJK:{ label:'"Teller : teller" terwijl het niet opging', uitleg:'Gekozen voor teller : teller en noemer : noemer, terwijl de delingen niet opgingen (rood kruisje).' },
  NIET_EERST_DELEN:{ label:'Niet eerst teller : teller geprobeerd', uitleg:'Meteen met het omgekeerde vermenigvuldigd, terwijl teller : teller en noemer : noemer wel opging. Dat is niet fout, maar omslachtiger.' },
  NIET_GESCHRAPT:{ label:'Niet vooraf geschrapt', uitleg:'Er kon vooraf geschrapt worden (ook diagonaal), maar de leerling deed dat niet.' },
  SCHRAP_ONMOGELIJK:{ label:'Onmogelijke schrap', uitleg:'Een teller en een noemer door een getal willen delen dat geen gemeenschappelijke deler is (rood kruisje).' },
  NIET_VEREENVOUDIGD:{ label:'Niet (volledig) vereenvoudigd', uitleg:'De uitkomst klopt, maar staat niet in de eenvoudigste vorm.' },
  ONTERECHT_NIET:{ label:'"Kan niet eenvoudiger" terwijl het wel kon', uitleg:'Op "kan niet eenvoudiger" geklikt bij een breuk die nog vereenvoudigd kon worden (rood kruisje).' },
  SCHAAR_ONMOGELIJK:{ label:'Onmogelijk knipgetal', uitleg:'Proberen knippen door een getal dat geen deler is van teller en noemer (rood kruisje).' },
  TE_VROEG_KLAAR:{ label:'Te vroeg "klaar"', uitleg:'Op "Klaar met vereenvoudigen" geklikt terwijl er nog verder geknipt kon worden.' },
  TEKENREGEL:{ label:'Verkeerd teken', uitleg:'Het teken van het product of quotiënt klopt niet (minnen verkeerd geteld).' },
  KOMMA_TELLEN:{ label:'Cijfers na de komma fout geteld', uitleg:'Het aantal cijfers na de komma (samen) klopt niet.' },
  KOMMA_PLAATS:{ label:'Plaatswaarde laatste cijfer fout', uitleg:'Bij het omzetten naar een breuk de verkeerde noemer gekozen.' },
  KOMMA_TELLER:{ label:'Fout bij kommagetal → breuk', uitleg:'De teller van de breuk past niet bij het kommagetal.' },
  WEETJE_BEWERKING:{ label:'Weetje: verkeerde bewerking', uitleg:'Bij : 0,5 / ⋅ 0,5 / : 0,1 … de verkeerde bewerking gekozen (bv. : 0,5 = : 2).' },
  WEETJE_GETAL:{ label:'Weetje: verkeerd getal', uitleg:'Bij : 0,5 / ⋅ 0,1 … het verkeerde getal gekozen (2, 10, 100 of 1000).' },
  SJABLOON_FOUT:{ label:'Bewerking fout ingevuld', uitleg:'De bewerking in het sjabloon past niet bij het vraagstuk.' },
  RECHTHOEK_FOUT:{ label:'Rechthoekmodel fout', uitleg:'De kolommen of rijen van het rechthoekmodel stellen niet de juiste breuk voor.' },
  REKENFOUT:{ label:'Rekenfout', uitleg:'Een andere fout in de uitkomst.' },
  FOUTENJAGER:{ label:'Verkeerde fout aangeduid', uitleg:'Bij de foutenjager niet de echte fout gekozen.' }
};

/* ---------- rekenhulp (zoals code.gs) ---------- */
const F = () => ({ s1:null, t:'', n:'' });
const TN = () => ({ t:'', n:'' });
const SN = () => ({ s:null, n:'' });
const SCH = () => ({ mode:null, cuts:[], done:false, for:null, x:0, nv:0, sx:0 });
const CONV = () => ({ pos:null, t:'', sch:SCH() });
const SOLV = () => ({ method:null, flip:[], sign:null, cuts:[], cutsFor:'', x:0, mx:0, res:TN(), sch:SCH() });
const fr = (n, d) => { if(d < 0){ n = -n; d = -d; } const g = ggd(n, d) || 1; return { num:n / g, den:d / g }; };
const mul = (a, b) => fr(a.num * b.num, a.den * b.den);
const dv = (a, b) => fr(a.num * b.den, a.den * b.num);
const add = (a, b) => fr(a.num * b.den + b.num * a.den, a.den * b.den);
const zelfde = (a, b) => !!a && !!b && a.num * b.den === b.num * a.den;
const isRed = f => !!f && (f.num === 0 ? f.den === 1 : ggd(f.num, f.den) === 1);
const kanKnip = f => !!f && f.den > 1 && ggd(f.num, f.den) > 1;
const evalF = f => f.reduce((acc, x, i)=>{ const y = fr(x[0], x[1]); return i === 0 ? y : x[2] === ':' ? dv(acc, y) : mul(acc, y); }, null);
const tnVal = (o, sign) => { const t = nat(o && o.t), n = nat(o && o.n); return t !== null && n ? { num:(sign < 0 ? -1 : 1) * t, den:n } : null; };
const fval = o => { if(!o || o.s1 == null) return null; const t = nat(o.t), n = nat(o.n); if(t === null || !n) return null; return { num:neg(o.s1) ? -t : t, den:n }; };
const sig = b => b ? b.num + '/' + b.den : '';
const naKnip = (b, cuts) => { let num = Math.abs(b.num), den = b.den;
  for(const c0 of cuts || []){ const c = +c0; if(c > 1 && num % c === 0 && den % c === 0){ num /= c; den /= c; } else break; }
  return { num:b.num < 0 ? -num : num, den }; };
/* eindresultaat na de vereenvoudigschaar: enkel als de leerling "klaar" of "kan niet eenvoudiger" koos voor deze breuk */
const eindVan = (b, sch) => !b || !sch || !sch.done || sch.for !== sig(b) ? null : naKnip(b, sch.cuts);
const schOK = (sch, b) => !!eindVan(b, sch);
const decPl = s => (String(s).split(',')[1] || '').length;
const decFr = s => { const p = String(s).split(','), d = p[1] || ''; return { num:+(p[0] + d), den:10 ** d.length }; };
const decTekst = s => { const t = String(s == null ? '' : s).trim().replace('.', ','); return /^\d{1,7}(,\d{1,6})?$/.test(t) ? t : null; };
const decVal = o => { if(!o || o.s == null) return null; const t = decTekst(o.n); if(!t) return null; const f = decFr(t); return { num:neg(o.s) ? -f.num : f.num, den:f.den }; };
const sval = o => { if(!o || o.s == null) return null; const n = nat(o.n); return n === null ? null : neg(o.s) ? -n : n; };
const decTxt = (num, den) => { const D = String(den).length - 1, a = String(Math.abs(num)).padStart(D + 1, '0'); return (num < 0 ? '−' : '') + (D ? a.slice(0, a.length - D) + ',' + a.slice(a.length - D) : a); };
/* breuk als kommagetal (de noemer gaat op in een macht van 10) */
const alsKomma = f => { for(let D = 0; D < 7; D++){ const m = f.num * 10 ** D; if(m % f.den === 0) return decTxt(m / f.den, 10 ** D); } return '…'; };
const POS = { t:10, h:100, d:1000 };
const convBasis = c => { const den = c && POS[c.pos], t = c && nat(c.t); return den && t !== null ? { num:t, den } : null; };
const fracTxt = f => !f ? '…' : (f.num < 0 ? '−' : '') + Math.abs(f.num) + (f.den === 1 ? '' : '/' + f.den);
const WEETJE = { '0,5':2, '0,1':10, '0,01':100, '0,001':1000 };
const dmulInfo = q => ({ Eint:q.d.reduce((s, x)=>s * x[1], 1) * q.d.reduce((p, x)=>p * +x[0].replace(',', ''), 1), Ecnt:q.d.reduce((s, x)=>s + decPl(x[0]), 0) });
const weetje = row => { const k = WEETJE[row[2]], op = row[1] === '⋅' ? ':' : '⋅', x = decFr(row[0].replace('−', '')), sg = row[0].includes('−') ? -1 : 1;
  return { k, op, E:op === '⋅' ? fr(sg * x.num * k, x.den) : fr(sg * x.num, x.den * k) }; };
/* het sjabloon van een vraagstuk: de factoren uit de sleutel ({ a, b }) */
const ctxF = (q, k) => k && k.a && k.b ? [k.a, [k.b[0], k.b[1], q.tpl.kind === 'van' ? '⋅' : ':']] : null;
const tweelingE = p => p.op === '+' ? add(fr(...p.f[0]), fr(...p.f[1])) : evalF([p.f[0], [p.f[1][0], p.f[1][1], p.op]]);

/* ---------- de rekenmachine voor producten en quotiënten: factoren, schrappen ----------
   cfg = { fs:[{ neg, num, den, op }], ready, sign }; v = { method:null|'td'|'om', flip:[], sign, cuts:[{ t, n, d }], cutsFor, res, sch } */
const heeftDeel = cfg => cfg.fs.some(f=>f.op === ':');
function sState(cfg, v){
  const om = v.method === 'om';
  const g = cfg.fs.map((f, i)=>{ const omg = om && f.op === ':' && !!(v.flip || [])[i]; let num = f.num, den = f.den;
    if(omg && num != null){ const t = num; num = den; den = t; }
    return { neg:f.neg, num, den, op:omg ? '⋅' : f.op, deel:f.op === ':', omg }; });
  const alles = cfg.fs.every((f, i)=>f.op !== ':' || !!(v.flip || [])[i]);
  const s = (v.method || '') + '|' + g.map(f=>f.num + '/' + f.den).join(',');
  const T = g.map(f=>f.num), N = g.map(f=>f.den), Th = g.map(()=>[]), Nh = g.map(()=>[]), Tc = g.map(()=>null), Nc = g.map(()=>null), ok = [];
  if(v.cutsFor === s) (v.cuts || []).forEach((c, ci)=>{
    if(T[c.t] != null && N[c.n] != null && T[c.t] % c.d === 0 && N[c.n] % c.d === 0){
      Th[c.t].push({ v:T[c.t], ci }); Nh[c.n].push({ v:N[c.n], ci }); T[c.t] /= c.d; N[c.n] /= c.d; Tc[c.t] = ci; Nc[c.n] = ci; ok.push(Object.assign({ ci }, c)); } });
  return { g, alles, sig:s, T, N, Th, Nh, Tc, Nc, ok };
}
const sBase = (cfg, v) => cfg.sign && !v.sign ? null : tnVal(v.res, cfg.sign && neg(v.sign) ? -1 : 1);
function solverKlaar(cfg, v){
  if(!cfg.ready || (cfg.sign && !v.sign)) return false;
  if(heeftDeel(cfg)){ if(!v.method) return false; if(v.method === 'om' && !cfg.fs.every((f, i)=>f.op !== ':' || !!(v.flip || [])[i])) return false; }
  return schOK(v.sch, sBase(cfg, v));
}
const areaCfg = q => ({ ready:true, sign:false, fs:[{ neg:false, num:q.a[0], den:q.a[1], op:null }, { neg:false, num:q.b[0], den:q.b[1], op:'⋅' }] });
function mCfg(q, v){
  let ready = true;
  const fs = q.f.map((x, i)=>{ let num = Math.abs(x[0]), den = x[1];
    if(q.combo && i === 0){ const c = (v.conv || [])[0], b = convBasis(c), r = b && schOK(c.sch, b) ? naKnip(b, c.sch.cuts) : null;
      if(r){ num = r.num; den = r.den; } else { ready = false; num = den = null; } }
    return { neg:x[0] < 0, num, den, op:x[2] || null }; });
  return { fs, ready, sign:true };
}
const tpVal = o => { const t = nat(o && o.t), n = nat(o && o.n); return t !== null && n ? { num:t, den:n } : null; };
function ctxCfg(q, v){
  const tp = v.tp || {};
  if(q.tpl.kind === 'van'){ const c = tpVal(tp.c), d = tpVal(tp.d);
    return { ready:!!(c && d), sign:false, fs:c && d ? [{ neg:false, num:c.num, den:c.den, op:null }, { neg:false, num:d.num, den:d.den, op:'⋅' }] : [] }; }
  const a = tpVal(tp.a), bn = q.tpl.second === 'nat' ? nat(tp.b && tp.b.t) : null, b = q.tpl.second === 'nat' ? (bn ? { num:bn, den:1 } : null) : tpVal(tp.b);
  return { ready:!!(a && b), sign:false, fs:a && b ? [{ neg:false, num:a.num, den:a.den, op:null }, { neg:false, num:b.num, den:b.den, op:':' }] : [] };
}
const CFG = { area:areaCfg, msteps:mCfg, context:ctxCfg };

/* ---------- verbeteren: { pts, codes, kruis } ---------- */
function schCodes(sch, out){
  if(!sch) return; const x = +sch.x || 0, sx = +sch.sx || 0;
  if(x) out.codes.push('SCHAAR_ONMOGELIJK'); if(sx) out.codes.push('ONTERECHT_NIET'); if(+sch.nv) out.codes.push('TE_VROEG_KLAAR');
  out.kruis += x + sx;
}
/* typische fout bij een verkeerde uitkomst r voor factoren f */
function mdCodes(f, r){
  const Ev = evalF(f), abs = x => ({ num:Math.abs(x.num), den:x.den });
  if(zelfde(r, Ev)) return [];
  if(zelfde(r, { num:-Ev.num, den:Ev.den })) return ['TEKENREGEL'];
  const som = f.reduce((acc, x, i)=>{ const y = fr(x[0], x[1]); return i === 0 ? y : add(acc, y); }, null);
  if(zelfde(abs(r), abs(som))) return ['OPGETELD_I_P_V_MAAL'];
  if(f.some(x=>x[2] === ':')){ const nietOm = f.reduce((acc, x, i)=>{ const y = fr(x[0], x[1]); return i === 0 ? y : mul(acc, y); }, null); if(zelfde(abs(r), abs(nietOm))) return ['NIET_OMGEKEERD']; }
  if(f.length > 1 && f.every(x=>x[1] === f[0][1])){ const hou = { num:f.reduce((a, x)=>a * x[0], 1), den:f[0][1] }; if(zelfde(abs(r), abs(hou))) return ['NOEMER_BEHOUDEN']; }
  return ['REKENFOUT'];
}
/* kon er vooraf geschrapt worden (na omkeren)? */
const kanSchrappen = f => { const T = [], N = []; f.forEach(x=>{ let t = Math.abs(x[0]), n = x[1]; if(x[2] === ':'){ const s = t; t = n; n = s; } T.push(t); N.push(n); });
  return T.some(t=>N.some(n=>ggd(t, n) > 1)); };
/* uitkomst + eenvoudigste vorm */
function uitkomst(f, b, sch, wVal, wSimp, absOnly){
  const Ev = evalF(f), out = { pts:0, codes:[], kruis:0 }, fin = eindVan(b, sch);
  const ok = b && (absOnly ? zelfde({ num:Math.abs(b.num), den:b.den }, { num:Math.abs(Ev.num), den:Ev.den }) : zelfde(b, Ev));
  if(ok){ out.pts += wVal; if(fin && isRed(fin)) out.pts += wSimp; else out.codes.push('NIET_VEREENVOUDIGD'); }
  else if(b){ const c = mdCodes(f, b); if(!(absOnly && c[0] === 'TEKENREGEL')) out.codes.push(...c); }
  schCodes(sch, out);
  return out;
}
/* aanpak bij delen en schrappen */
function aanpakCodes(f, v, out){
  const deel = f.some(x=>x[2] === ':'), mx = +v.mx || 0, x = +v.x || 0;
  if(mx){ out.codes.push('TD_ONMOGELIJK'); out.kruis += mx; }
  if(x){ out.codes.push('SCHRAP_ONMOGELIJK'); out.kruis += x; }
  if(deel && f.length === 2 && Math.abs(f[0][0]) % Math.abs(f[1][0]) === 0 && f[0][1] % f[1][1] === 0 && v.method === 'om') out.codes.push('NIET_EERST_DELEN');
  const geschrapt = Array.isArray(v.cuts) && v.cuts.length > 0 && v.cutsFor;
  if(v.method !== 'td' && kanSchrappen(f) && !geschrapt && v.res && nat(v.res.t) !== null) out.codes.push('NIET_GESCHRAPT');
}
const VERBETER = {
  area(q, v){
    let pts = 0; const codes = [], cols = +v.cols || 1, rows = +v.rows || 1, cs = (v.cs || []).length, rs = (v.rs || []).length;
    if(cs * q.b[1] === cols * q.b[0] && rs * q.a[1] === rows * q.a[0] && cs && rs) pts += .5; else if(cs || rs) codes.push('RECHTHOEK_FOUT');
    const r = uitkomst(q.f, tnVal(v.res, 1), v.sch, 1, .5, false), out = { pts:pts + r.pts, codes:codes.concat(r.codes), kruis:r.kruis };
    aanpakCodes(q.f, v, out); return out;
  },
  msteps(q, v){
    let pts = 0; const codes = [], o0 = { codes:[], kruis:0 }, Ev = evalF(q.f), wilTeken = Ev.num < 0 ? '−' : '+';
    if(q.combo) (q.dec || []).forEach((d, j)=>{ const c = (v.conv || [])[j] || {}, wil = decFr(d), b = convBasis(c), fin = eindVan(b, c.sch);
      if(b && zelfde(b, wil)){ if(fin && isRed(fin)) pts += .5 / q.dec.length; else { pts += .25 / q.dec.length; codes.push('NIET_VEREENVOUDIGD'); } }
      else if(b) codes.push(b.den !== 10 ** decPl(d) ? 'KOMMA_PLAATS' : 'KOMMA_TELLER');
      schCodes(c.sch, o0); });
    if(v.sign === wilTeken || Ev.num === 0) pts += v.sign ? .5 : 0; else if(v.sign) codes.push('TEKENREGEL');
    const r = uitkomst(q.f, v.sign ? tnVal(v.res, neg(v.sign) ? -1 : 1) : null, v.sch, 1, .5, true);
    const out = { pts:pts + r.pts, codes:codes.concat(o0.codes, r.codes), kruis:o0.kruis + r.kruis };
    aanpakCodes(q.f, v, out); return out;
  },
  dmul(q, v){
    let pts = 0; const codes = [], { Eint, Ecnt } = dmulInfo(q), ri = sval(v.int), rc = nat(v.cnt);
    if(ri === Eint) pts += .75; else if(ri !== null) codes.push(ri === -Eint ? 'TEKENREGEL' : 'REKENFOUT');
    if(rc === Ecnt) pts += .75; else if(rc !== null) codes.push('KOMMA_TELLEN');
    return { pts, codes, kruis:0 };
  },
  dfact(q, v){
    let pts = 0; const codes = [];
    q.rows.forEach((row, i)=>{ const st = (v.rows || [])[i] || {}, { k, op, E:Ev } = weetje(row), res = decVal(st.res);
      const okOp = st.op === op, okK = nat(st.k) === k, okR = res && zelfde(res, Ev);
      if(okOp && okK && okR) pts += q.punten / q.rows.length;
      else { if(st.op && !okOp) codes.push('WEETJE_BEWERKING'); if(nat(st.k) !== null && !okK) codes.push('WEETJE_GETAL');
        if(res && !okR && okOp && okK) codes.push(zelfde(res, { num:-Ev.num, den:Ev.den }) ? 'TEKENREGEL' : 'REKENFOUT'); } });
    return { pts, codes, kruis:0 };
  },
  context(q, v, k){
    const f = ctxF(q, k); if(!f) return { pts:0, codes:[], kruis:0 };
    let pts = 0; const codes = [], tp = v.tp || {}, Tk = { a:k.a, b:k.b };
    const same = (x, w) => !!x && x.num === w[0] && x.den === w[1], bnat = o => { const t = nat(o && o.t); return t !== null ? { num:t, den:1 } : null; };
    let ok;
    if(q.tpl.kind === 'van'){ const b = Tk.b[1] === 1 ? bnat(tp.b) : tnVal(tp.b, 1), c = tnVal(tp.c, 1), d = tnVal(tp.d, 1);
      ok = same(tnVal(tp.a, 1), Tk.a) && same(b, Tk.b) && ((same(c, Tk.a) && same(d, Tk.b)) || (same(c, Tk.b) && same(d, Tk.a))); }
    else ok = same(tnVal(tp.a, 1), Tk.a) && same(Tk.b[1] === 1 ? bnat(tp.b) : tnVal(tp.b, 1), Tk.b);
    if(ok) pts += .5; else codes.push('SJABLOON_FOUT');
    const r = uitkomst(f, tnVal(v.res, 1), v.sch, 1, .5, false), out = { pts:pts + r.pts, codes:codes.concat(r.codes), kruis:r.kruis };
    if(ok) aanpakCodes(f, v, out); return out;
  },
  twins(q, v){
    let pts = 0, kruis = 0; const codes = [];
    ['a', 'b'].forEach((k, i)=>{ const p = q.parts[i], st = v[k] || {}, b = fval(st.res), fin = eindVan(b, st.sch), Ev = tweelingE(p);
      if(b && zelfde(b, Ev)){ pts += .5; if(fin && isRed(fin)) pts += .25; else codes.push('NIET_VEREENVOUDIGD'); }
      else if(b){
        if(p.op === '+'){ const prod = mul(fr(...p.f[0]), fr(...p.f[1])), tn = { num:p.f[0][0] + p.f[1][0], den:p.f[0][1] + p.f[1][1] };
          codes.push(zelfde(b, prod) ? 'MAAL_I_P_V_PLUS' : zelfde(b, tn) ? 'TELLERS_NOEMERS_OPGETELD' : zelfde(b, { num:-Ev.num, den:Ev.den }) ? 'TEKENREGEL' : 'REKENFOUT'); }
        else codes.push(...mdCodes([p.f[0], [p.f[1][0], p.f[1][1], p.op]], b)); }
      const o = { codes:[], kruis:0 }; schCodes(st.sch, o); codes.push(...o.codes); kruis += o.kruis; });
    return { pts, codes, kruis };
  },
  errfrac(q, v, k){
    if(!k || !k.good) return { pts:0, codes:[], kruis:0 };
    let pts = 0; const codes = [];
    if(v.choice === k.good) pts += .5; else if(v.choice) codes.push('FOUTENJAGER');
    const r = uitkomst(q.f, fval(v.res), v.sch, .5, .5, false);
    return { pts:pts + r.pts, codes:codes.concat(r.codes), kruis:r.kruis };
  }
};

/* ---------- volledig ingevuld? (zoals het oorspronkelijke Oefening.html) ---------- */
const VOLLEDIG = {
  area:(q, v)=>v.cs.length > 0 && v.rs.length > 0 && solverKlaar(areaCfg(q), v),
  msteps:(q, v)=>solverKlaar(mCfg(q, v), v),
  dmul:(q, v)=>v.int.s != null && nat(v.int.n) !== null && nat(v.cnt) !== null,
  dfact:(q, v)=>v.rows.every(r=>!!r.op && nat(r.k) !== null && r.res.s != null && decTekst(r.res.n) !== null),
  context:(q, v)=>solverKlaar(ctxCfg(q, v), v),
  twins:(q, v)=>['a', 'b'].every(k=>schOK(v[k].sch, fval(v[k].res))),
  errfrac:(q, v)=>!!v.choice && schOK(v.sch, fval(v.res))
};
const LEEG = {
  area:()=>Object.assign({ cols:1, rows:1, cs:[], rs:[], mode:'c' }, SOLV()),
  msteps:q=>Object.assign({ conv:(q.dec || []).map(CONV) }, SOLV()),
  dmul:()=>({ int:SN(), cnt:'' }),
  dfact:q=>({ rows:q.rows.map(()=>({ op:null, k:'', res:SN() })) }),
  context:()=>Object.assign({ N:1, cols:1, rows:1, cs:[], rs:[], mode:'c', tp:{ a:TN(), b:TN(), c:TN(), d:TN() } }, SOLV()),
  twins:()=>({ a:{ res:F(), sch:SCH() }, b:{ res:F(), sch:SCH() } }),
  errfrac:()=>({ choice:null, res:F(), sch:SCH() })
};

/* ---------- figuren (ook voor het dashboard en de pdf) ---------- */
const AR = { W:520, H:320, x0:70, y0:34 };
const HELM = '<path d="M2.5 15.5 C2.5 8.5 7.5 4 13 4 C18.5 4 22 8 22 12.5 L22 15.5 Z" fill="#1e88e5" stroke="#0d47a1" stroke-width="1.3"/>'
  + '<path d="M8 7.8 L10 11.5 M12.8 6.2 L13.6 11 M17.4 7.2 L16.4 11.4" stroke="#e3f2fd" stroke-width="1.8" stroke-linecap="round"/>'
  + '<path d="M1.5 15.5 L23 15.5" stroke="#0d47a1" stroke-width="2.2" stroke-linecap="round"/><path d="M7 15.5 L10.5 20.5 L15 15.5" fill="none" stroke="#37474f" stroke-width="1.4" stroke-linejoin="round"/>';
const icoSVG = (n, x, y, s) => n === 'helm' ? `<g transform="translate(${x - s / 2},${y - s / 2}) scale(${s / 24})">${HELM}</g>` : `<text x="${x}" y="${y + s * .35}" text-anchor="middle" font-size="${s}">${n}</text>`;
const icoHTML = n => n === 'helm' ? `<svg class="h5-ico" viewBox="0 0 24 24" aria-label="fietshelm">${HELM}</svg>` : n;
/* rechthoekmodel: kolommen (paars) = de tweede breuk, rijen (geel) = het deel ervan, gearceerd = de uitkomst */
function areaSVG(v, klik, icons){
  const { W, H, x0, y0 } = AR, C = v.cols || 1, R = v.rows || 1, cs = (v.cs || []).filter(c=>c < C), rs = (v.rs || []).filter(r=>r < R);
  let h = '<defs><pattern id="h5-arc" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)"><rect width="14" height="14" fill="#ffd54f"/><rect width="7" height="14" fill="#9575cd"/></pattern></defs>'
    + `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="#fff"/>`;
  cs.forEach(c=>{ h += `<rect x="${x0 + W * c / C}" y="${y0}" width="${W / C}" height="${H}" fill="#b39ddb" opacity=".55"/>`; });
  rs.forEach(r=>{ h += `<rect x="${x0}" y="${y0 + H * r / R}" width="${W}" height="${H / R}" fill="#ffd54f" opacity=".6"/>`; });
  cs.forEach(c=>rs.forEach(r=>{ h += `<rect x="${x0 + W * c / C}" y="${y0 + H * r / R}" width="${W / C}" height="${H / R}" fill="url(#h5-arc)"/>`;
    if(icons){ const s = Math.min(24, W / C / 2.6, H / R / 1.6), cx = x0 + W * (c + .5) / C, cy = y0 + H * (r + .5) / R;
      h += `<rect x="${cx - s * 1.15}" y="${cy - s * .7}" width="${s * 2.3}" height="${s * 1.4}" rx="6" fill="#fff" opacity=".85"/>` + icoSVG(icons[0], cx - s * .55, cy, s) + icoSVG(icons[1], cx + s * .55, cy, s); } }));
  if(icons){ cs.forEach(c=>{ h += icoSVG(icons[0], x0 + W * (c + .5) / C, y0 - 16, 22); }); rs.forEach(r=>{ h += icoSVG(icons[1], x0 - 22, y0 + H * (r + .5) / R, 24); }); }
  for(let i = 1; i < C; i++) h += `<line x1="${x0 + W * i / C}" x2="${x0 + W * i / C}" y1="${y0}" y2="${y0 + H}" stroke="#35545a" stroke-width="2"/>`;
  for(let i = 1; i < R; i++) h += `<line x1="${x0}" x2="${x0 + W}" y1="${y0 + H * i / R}" y2="${y0 + H * i / R}" stroke="#35545a" stroke-width="2" stroke-dasharray="7 5"/>`;
  h += `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="none" stroke="#17313a" stroke-width="3"/>`;
  if(klik) h += `<rect class="h5-rhklik" x="${x0}" y="${y0}" width="${W}" height="${H}" fill="transparent" style="cursor:pointer"/>`;
  return `<svg class="vis-svg h5-rh" viewBox="0 0 ${W + x0 + 30} ${H + y0 + 20}" aria-label="Rechthoek">${h}</svg>`;
}
function dagSVG(N){
  const x0 = 20, y0 = 44, W = 600, H = 56, st = [[0, '#141b4d'], [5.5, '#1a237e'], [6.5, '#6a4c93'], [7.2, '#ff8a65'], [8.2, '#ffe9a8'], [12, '#fff8dc'], [18.5, '#ffe9a8'], [20, '#ff7043'], [21.2, '#8e3b6e'], [22.2, '#1a237e'], [24, '#141b4d']];
  let h = `<defs><linearGradient id="h5-dag" x1="0" x2="1">${st.map(s=>`<stop offset="${s[0] / 24}" stop-color="${s[1]}"/>`).join('')}</linearGradient></defs><rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="url(#h5-dag)"/>`
    + `<text x="${x0 + W * 2.5 / 24}" y="${y0 + 36}" text-anchor="middle" font-size="22">🌙</text><text x="${x0 + W / 2}" y="${y0 + 37}" text-anchor="middle" font-size="24">☀️</text><text x="${x0 + W * 23 / 24}" y="${y0 + 36}" text-anchor="middle" font-size="18">🌙</text>`;
  for(let k = 1; k < N; k++){ const x = x0 + W * k / N; h += `<line x1="${x}" x2="${x}" y1="${y0 - 6}" y2="${y0 + H + 6}" stroke="#fff" stroke-width="4" opacity=".55"/><line x1="${x}" x2="${x}" y1="${y0 - 6}" y2="${y0 + H + 6}" stroke="#17313a" stroke-width="2" stroke-dasharray="6 4"/>`; }
  h += `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="none" stroke="#17313a" stroke-width="3"/>`;
  [[0, '0 u'], [12, '12 u'], [24, '24 u']].forEach(([u, l])=>{ const x = x0 + W * u / 24; h += `<line x1="${x}" x2="${x}" y1="${y0 + H}" y2="${y0 + H + 6}" stroke="#17313a" stroke-width="2"/><text x="${x}" y="${y0 + H + 22}" font-size="13" font-weight="700" fill="#35545a" text-anchor="middle">${l}</text>`; });
  return `<svg class="vis-svg" viewBox="0 0 640 130" aria-label="Een dag van 24 uur">${h}<text x="${x0}" y="28" font-size="14" font-weight="800" fill="#35545a">1 dag = 24 uur</text></svg>`;
}
function gsmSVG(N){
  const balk = (y, W, lab, vul) => `<text x="20" y="${y - 8}" font-size="14" font-weight="800" fill="#35545a">${lab}</text><rect x="20" y="${y}" width="${W}" height="44" rx="8" fill="#fff" stroke="#17313a" stroke-width="3"/><rect x="22" y="${y + 2}" width="${vul}" height="40" rx="6" fill="#26a69a" opacity=".85"/>`;
  let h = balk(30, 270, '📱 oude smartphone: 4/9 vol', 270 * 4 / 9 - 4) + balk(120, 540, '📱 nieuwe smartphone: dubbel zoveel opslag', 270 * 4 / 9 - 4);
  for(let k = 1; k < N; k++){ const x = 20 + 540 * k / N; h += `<line x1="${x}" x2="${x}" y1="114" y2="170" stroke="#b77900" stroke-width="2" stroke-dasharray="6 4"/>`; }
  return `<svg class="vis-svg" viewBox="0 0 600 190" aria-label="Opslag van de smartphones">${h}</svg>`;
}
function flesSVG(N){
  const x0 = 20, y0 = 40, W = 600, H = 56; let h = `<rect x="${x0}" y="${y0}" width="${W * 3 / 4}" height="${H}" fill="#ffb74d" opacity=".85"/>`;
  for(let k = 1; k < N; k++){ const x = x0 + W * k / N; h += `<line x1="${x}" x2="${x}" y1="${y0 - 6}" y2="${y0 + H + 6}" stroke="#17313a" stroke-width="2" stroke-dasharray="6 4"/>`; }
  h += `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="none" stroke="#17313a" stroke-width="3"/><text x="${x0}" y="28" font-size="14" font-weight="800" fill="#35545a">🧃 1 liter — de fles bevat 3/4 liter</text>`;
  return `<svg class="vis-svg" viewBox="0 0 640 110" aria-label="Fles van 1 liter">${h}</svg>`;
}
const FIGUUR = { dag:dagSVG, gsm:gsmSVG, fles:flesSVG };
const notitie = q => `<div class="h5-schrift"><div class="h5-snaam">✏️ Schrift van ${esc(q.who)}</div><div class="h5-slijn">${fx(q.work)}</div><div class="h5-stempel">?</div></div>`;

/* ---------- lezen: dashboard, pdf, resultaat van de leerling ---------- */
/* een volledig juiste oplossing van de rekenmachine (voor de sleutel en de tests) */
function losOp(cfg, sign){
  const v = SOLV(), [A, Bf] = cfg.fs; v.sign = sign;
  if(heeftDeel(cfg) && cfg.fs.length === 2 && A.num % Bf.num === 0 && A.den % Bf.den === 0){ v.method = 'td'; v.res = { t:String(A.num / Bf.num), n:String(A.den / Bf.den) }; }
  else {
    if(heeftDeel(cfg)){ v.method = 'om'; cfg.fs.forEach((f, i)=>{ if(f.op === ':') v.flip[i] = true; }); }
    const S = sState(cfg, v), T = S.T.slice(), N = S.N.slice();
    T.forEach((t, i)=>N.forEach((n, j)=>{ const d = ggd(T[i], N[j]); if(d > 1){ v.cuts.push({ t:i, n:j, d }); T[i] /= d; N[j] /= d; } }));
    if(v.cuts.length) v.cutsFor = S.sig;
    v.res = { t:String(T.reduce((a, x)=>a * x, 1)), n:String(N.reduce((a, x)=>a * x, 1)) };
  }
  v.sch = vereenvoudig(sBase(cfg, v));
  return v;
}
function vereenvoudig(b){ const g = ggd(b.num, b.den), st = SCH(); if(b.den > 1 && g > 1){ st.mode = 'cut'; st.cuts = [g]; } else st.mode = 'skip'; st.done = true; st.for = sig(b); return st; }
function toon(q, a, modus, k){
  let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){}
  const blanco = modus === 'blanco', sl = modus === 'sleutel';
  if(modus === 'lezen' && !v) return '<p class="tl-niet">Niet ingevuld.</p>';
  if(!v || blanco || sl) v = LEEG[q.soort](q);
  const lijn = (l, r) => `<div class="tl"><span class="tl-l">${l}</span><span class="tl-r">${r}</span></div>`;
  const kr = x => !sl && !blanco && x ? ` <span class="tl-kruis">✕ ${x}</span>` : '';
  /* uitkomst als breuk, met het resultaat na vereenvoudigen; Ev = de juiste uitkomst (sleutel) */
  const res = (Ev, b, sch, raw) => {
    if(sl){ if(!Ev) return leeg; return br(Ev.num, Ev.den); }
    if(blanco) return leeg;
    const f = eindVan(b, sch);
    if(!b) return raw && (raw.t || raw.n) ? esc((neg(raw.s1) ? '−' : '') + (raw.t || '…') + '/' + (raw.n || '…')) : leeg;
    return br(b.num, b.den) + (f && (f.num !== b.num || f.den !== b.den) ? ' → ' + br(f.num, f.den) : '') + (sch && sch.mode === 'skip' && sch.done ? ' <i>(kan niet eenvoudiger)</i>' : '') + kr(sch && (+sch.x || 0) + (+sch.sx || 0));
  };
  /* de rekenmachine: aanpak, schrappen, uitkomst */
  const reken = (cfg, f) => {
    const Ev = f && evalF(f);
    if(sl) return (cfg.sign ? lijn('Teken:', Ev.num < 0 ? '−' : '+') : '') + lijn('Uitkomst:', res(Ev));
    if(blanco) return (cfg.sign ? lijn('Teken:', leeg) : '') + lijn('Schrappen:', leeg) + lijn('Uitkomst:', leeg);
    const S = cfg.ready ? sState(cfg, v) : null;
    const schrap = S && S.ok.length ? S.ok.map(c=>`${S.Th[c.t].find(h=>h.ci === c.ci).v} en ${S.Nh[c.n].find(h=>h.ci === c.ci).v} : ${c.d}`).join(' · ') : 'niet geschrapt';
    return (cfg.sign ? lijn('Teken:', v.sign ? esc(v.sign) : leeg) : '')
      + (heeftDeel(cfg) ? lijn('Aanpak:', v.method === 'td' ? 'teller : teller en noemer : noemer' : v.method === 'om' ? 'maal het omgekeerde' : leeg) + kr(v.mx) : '')
      + lijn('Schrappen:', (v.method === 'td' ? '—' : esc(schrap)) + kr(v.x)) + lijn('Uitkomst:', cfg.ready ? res(null, sBase(cfg, v), v.sch, v.res) : leeg);
  };
  switch(q.soort){
    case 'area': {
      const w = sl ? { cols:q.b[1], rows:q.a[1], cs:Array.from({ length:q.b[0] }, (_, i)=>i), rs:Array.from({ length:q.a[0] }, (_, i)=>i) } : v;
      return `<div class="rv-lees rv-lees-fig"><div class="tl-fig">${areaSVG(blanco ? LEEG.area() : w, false)}</div><div>`
        + lijn('Rechthoek:', blanco ? leeg : `${w.cs.length} van ${w.cols} kolommen, ${w.rs.length} van ${w.rows} rijen`) + reken(areaCfg(q), q.f) + '</div></div>';
    }
    case 'msteps': {
      const conv = (q.dec || []).map((d, j)=>{ const w = decFr(d), c = v.conv[j], b = convBasis(c), f = eindVan(b, c && c.sch), R = fr(w.num, w.den);
        return lijn(esc(d) + ' =', sl ? br(w.num, w.den) + ' = ' + br(R.num, R.den) : blanco || !b ? leeg : br(b.num, b.den) + (f && f.den !== b.den ? ' = ' + br(f.num, f.den) : '') + kr(c.sch && (+c.sch.x || 0) + (+c.sch.sx || 0))); }).join('');
      return '<div class="rv-lees">' + lijn('Opgave:', fx(q.expr)) + conv + reken(mCfg(q, v), q.f) + '</div>';
    }
    case 'dmul': {
      const { Eint, Ecnt } = dmulInfo(q), ri = sval(v.int), rc = nat(v.cnt);
      return '<div class="rv-lees">' + lijn('Zonder komma:', sl ? esc(Eint < 0 ? '−' + -Eint : Eint) : blanco || ri === null ? leeg : esc(String(ri).replace('-', '−')))
        + lijn('Cijfers na de komma:', sl ? esc(Ecnt) : blanco || rc === null ? leeg : esc(rc))
        + lijn(fx(q.expr) + ' =', sl ? esc(decTxt(Eint, 10 ** Ecnt).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '')) : blanco || ri === null || rc === null ? leeg : esc(decTxt(ri, 10 ** rc))) + '</div>';
    }
    case 'dfact':
      return '<div class="rv-lees">' + q.rows.map((row, i)=>{ const st = v.rows[i], w = weetje(row);
        return lijn(esc(row.join(' ')) + ' =', sl ? esc(`${row[0]} ${w.op} ${w.k} = ${alsKomma(w.E)}`) : blanco ? leeg
          : esc(`${row[0]} ${st.op || '?'} ${st.k || '…'} = `) + (decVal(st.res) ? esc((neg(st.res.s) ? '−' : '') + decTekst(st.res.n)) : leeg)); }).join('') + '</div>';
    case 'context': {
      const f = ctxF(q, k), tp = v.tp, T = q.tpl, b2 = T.second === 'nat';
      const vak = (o, alleenT) => { if(sl || blanco) return leeg; if(alleenT) return o.t ? esc(o.t) : '…'; return o.t || o.n ? brS(esc(o.t || '…'), esc(o.n || '…')) : '…'; };
      const sjabloon = sl ? (f ? (T.kind === 'van' ? `${br(...k.a)} van ${br(...k.b)} = ${br(...k.a)} ⋅ ${br(...k.b)}` : `${br(...k.a)} : ${br(...k.b)}`) : leeg)
        : T.kind === 'van' ? `${vak(tp.a)} van ${vak(tp.b, b2)} = ${vak(tp.c)} ⋅ ${vak(tp.d)}` : `${vak(tp.a)} : ${vak(tp.b, b2)}`;
      return '<div class="rv-lees">' + lijn('Bewerking:', sjabloon) + reken(ctxCfg(q, v), f) + '</div>';
    }
    case 'twins':
      return '<div class="rv-lees">' + q.parts.map((p, i)=>{ const st = v['ab'[i]];
        return lijn(fx(q.exprs[i]) + ' =', res(sl ? tweelingE(p) : null, fval(st.res), st.sch, st.res)); }).join('') + '</div>';
    case 'errfrac':
      return '<div class="rv-lees">' + notitie(q) + lijn('Fout:', sl ? (k && k.good ? esc(k.good.toUpperCase()) + ') ' + fx((q.options.find(o=>o.id === k.good) || {}).text) : leeg) : blanco || !v.choice ? leeg : esc(v.choice.toUpperCase()) + ') ' + fx((q.options.find(o=>o.id === v.choice) || {}).text))
        + lijn(fx(q.expr) + ' =', res(sl ? evalF(q.f) : null, fval(v.res), v.sch, v.res)) + '</div>';
  }
  return '';
}

/* ---------- invullen: de interactieve oefeningen ---------- */
const TYPEN = {};
Object.keys(LEEG).forEach(s=>{ TYPEN[s] = { leeg:LEEG[s], volledig:VOLLEDIG[s], uitleg:()=>UITLEG[s] }; });
TYPEN.msteps.uitleg = q=>q.combo ? UITLEG.combo : q.f.some(x=>x[2] === ':') ? UITLEG.mdiv : UITLEG.msteps;
const TIP_BREUK = '<p class="rv-tip">Toestandsteken: kies <b>+</b> of <b>−</b> in het vakje vóór de breuk. Vereenvoudigen? Klik naast de breuk op <b>✂ vereenvoudigen</b> of op <b>✓ kan niet eenvoudiger</b>.</p>';
const TIP_SCHAAR = '<p class="rv-tip">Vereenvoudigen? Klik naast de uitkomst op <b>✂ vereenvoudigen</b> of op <b>✓ kan niet eenvoudiger</b>.</p>';
const werk = (c, cls) => c.root.querySelector('.rv-werk').classList.add(cls);
const opInvoer = (c, f) => { c.ant.oninput = c.vis.oninput = f; };
/* opnieuw tekenen zonder dat het invulvak de focus verliest */
const houdFocus = c => { const a = document.activeElement, p = a && a.dataset ? a.dataset.pad : null; c.teken();
  if(p){ const el = c.root.querySelector(`input[data-pad="${p}"]`); if(el){ el.focus(); const n = el.value.length; try{ el.setSelectionRange(n, n); }catch(e){} } } };
/* breuk zonder tekenvak: teller boven noemer */
const tnVeld = (p, o, label = 'uitkomst') => `<span class="br br-in"><span class="br-t">${window.RV.getal(p + '.t', o.t, 'nat', 'br-get', 'teller van de ' + label)}</span><span class="br-n">${window.RV.getal(p + '.n', o.n, 'nat', 'br-get', 'noemer van de ' + label)}</span></span>`;
const knipKnop = (N, wat, eenheid = 'gelijke stukjes', attr = 'n', kort) => `<div class="h5-knip"><b>${kort || `Verdeel ${wat} in`}</b> <button type="button" class="h5-nknop" data-${attr}="-1" aria-label="minder"${N <= 1 ? ' disabled' : ''}>−</button><span class="h5-nval">${N}</span><button type="button" class="h5-nknop" data-${attr}="1" aria-label="meer">+</button>${kort ? '' : ` <b>${eenheid}</b>`}</div>`;
const bindKnip = (c, max, attr, veld, bij) => c.vis.querySelectorAll(`[data-${attr}]`).forEach(b=>b.onclick = ()=>{ const v = c.huidig(); v[veld] = Math.max(1, Math.min(max, (v[veld] || 1) + +b.getAttribute('data-' + attr))); if(bij) bij(v); c.bewaar(v); c.teken(); });
const kruisje = knop => { knop.classList.remove('br-schud'); void knop.offsetWidth; knop.classList.add('br-schud', 'fout'); knop.insertAdjacentHTML('beforeend', '<i class="rv-kruis" aria-hidden="true">✕</i>'); };

/* de rekenmachine: ① teken ② (bij delen) aanpak ③ schrappen: klik een teller en een noemer (ook diagonaal) en deel ze door
   hetzelfde getal; het oude getal wordt doorstreept, een gekleurde lijn verbindt de twee ④ uitrekenen en vereenvoudigen */
const KLEUR = ['#e65100', '#6a1b9a', '#00838f', '#c2185b', '#2e7d32', '#1565c0', '#8d6e63'];
function sBreuk(S, i, sel, ui){
  const kl = ci => KLEUR[ci % KLEUR.length];
  const oud = h => `<s style="text-decoration-color:${kl(h.ci)}">${h.v}</s>`;
  const nu = (w, ci) => `<b class="h5-nu${ui.versCut != null && ci === ui.versCut ? ' vers' : ''}"${ci != null ? ` style="color:${kl(ci)}"` : ''}>${w}</b>`;
  return `<span class="h5-sbr${S.g[i].omg ? ' omg' : ''}${ui.flipAnim === i ? ' flipin' : ''}">`
    + `<button type="button" class="h5-chip t${sel.t === i ? ' sel' : ''}" data-sc="t" data-i="${i}" aria-label="teller ${S.T[i]}" aria-pressed="${sel.t === i}">${S.Th[i].map(oud).join('')}${nu(S.T[i], S.Tc[i])}</button>`
    + '<span class="h5-sbar"></span>'
    + `<button type="button" class="h5-chip n${sel.n === i ? ' sel' : ''}" data-sc="n" data-i="${i}" aria-label="noemer ${S.N[i]}" aria-pressed="${sel.n === i}">${S.Nh[i].map(oud).join('')}${nu(S.N[i], S.Nc[i])}</button></span>`;
}
/* maalteken tussen de tellers én tussen de noemers */
const maalKol = () => '<span class="h5-maal"><span>⋅</span><span class="h5-mgap"></span><span>⋅</span></span>';
function sRij(c, cfg, S, klik){
  const { v, ui, q } = c, sel = ui.msel && ui.msel.q === q.id ? ui.msel : { t:null, n:null };
  return '<span class="h5-swrap">' + S.g.map((f, i)=>{
    let h = '';
    if(i > 0){
      if(f.deel && v.method === 'om' && f.omg && klik) h += maalKol();
      else if(f.deel && v.method === 'om') h += `<button type="button" class="h5-deel${f.omg ? ' klaar' : ''}" data-flip="${i}" title="${f.omg ? 'Klik om terug te zetten' : 'Delen door een breuk = vermenigvuldigen met het omgekeerde'}">${f.omg ? '⋅' : ':'}</button>`;
      else if(f.op === ':' || !klik) h += `<span class="h5-op">${f.op === ':' ? ':' : '⋅'}</span>`;
      else h += maalKol();
    }
    const lijf = f.num == null ? '<span class="h5-vraag">?</span>' : klik ? sBreuk(S, i, sel, ui) : `<span class="h5-sbr vast"><span class="h5-chip">${f.num}</span><span class="h5-sbar"></span><span class="h5-chip">${f.den}</span></span>`;
    const sg = f.neg ? '<span class="h5-sg">−</span>' : '';
    return h + (i > 0 && f.neg ? `<span class="h5-haak">(</span>${sg}${lijf}<span class="h5-haak">)</span>` : sg + lijf);
  }).join('') + '<svg class="h5-lijnen" aria-hidden="true"></svg></span>';
}
function lijnen(c, cfg){
  const wrap = c.ant.querySelector('.h5-swrap'), svg = wrap && wrap.querySelector('.h5-lijnen'); if(!svg) return;
  const S = sState(cfg, c.huidig()), W = wrap.getBoundingClientRect();
  svg.setAttribute('width', W.width); svg.setAttribute('height', W.height); svg.setAttribute('viewBox', `0 0 ${W.width} ${W.height}`);
  const pos = (k, i) => { const el = wrap.querySelector(`[data-sc="${k}"][data-i="${i}"]`); if(!el) return null; const r = el.getBoundingClientRect(); return { x:r.left - W.left + r.width / 2, y:r.top - W.top + r.height / 2 }; };
  let h = '';
  S.ok.forEach(cut=>{ const a = pos('t', cut.t), b = pos('n', cut.n); if(a && b) h += `<line class="h5-lijn${c.ui.versCut === cut.ci ? ' vers' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${KLEUR[cut.ci % KLEUR.length]}"/>`; });
  const sel = c.ui.msel && c.ui.msel.q === c.q.id ? c.ui.msel : null;
  if(sel && sel.t != null && sel.n != null){ const a = pos('t', sel.t), b = pos('n', sel.n); if(a && b) h += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#b77900" stroke-width="3" stroke-dasharray="6 5"/>`; }
  svg.innerHTML = h;
}
/* de rijen van de rekenmachine in het schriftje; pre = wat vóór de breuken staat (bv. "3/4 van 2/3 =") */
function solverHTML(c, cfg, pre = '', wacht = 'Vul eerst de bewerking in.'){
  const { v, ui, q } = c, RV = window.RV, B = RV.br, S = sState(cfg, v), deel = heeftDeel(cfg), basis = sBase(cfg, v);
  const rij = (gl, lijf, naam, cls = '') => `<div class="srij${cls}"><span class="gelijk">${gl}</span><span class="orig">${lijf}</span>${naam ? `<span class="stapnaam">${naam}</span>` : '<span></span>'}</div>`;
  if(!cfg.ready) return `<div class="schrift h5-schriftje">${rij('', `<span class="rv-tip">${wacht}</span>`, '')}</div>`;
  const r = [];
  if(cfg.sign) r.push(rij('', `<span class="h5-tekenrij">Teken van de uitkomst: ${RV.teken('sign', v.sign, 'teken van de uitkomst')} <span class="rv-tip">tel de minnen: even → <b>+</b>, oneven → <b>−</b></span></span>`, 'teken'));
  if(deel) r.push(rij('', '<span class="h5-aanpak"><span class="h5-apl">Kies je aanpak:</span>'
    + `<button type="button" class="h5-ap${v.method === 'td' ? ' aan' : ''}" data-meth="td" aria-pressed="${v.method === 'td'}">teller : teller<br>en noemer : noemer</button>`
    + `<button type="button" class="h5-ap${v.method === 'om' ? ' aan' : ''}" data-meth="om" aria-pressed="${v.method === 'om'}">maal het<br>omgekeerde</button></span>`
    + (ui.tdFail === q.id ? '<span class="h5-let">✕ Dat gaat niet op: niet alle delingen geven een natuurlijk getal. Vermenigvuldig met het omgekeerde.</span>' : ''), 'aanpak'));
  const sg = cfg.sign ? (neg(v.sign) ? '<span class="h5-rsg">−</span>' : v.sign ? '' : '<span class="h5-vraag">?</span>') : '';
  const keuze = B.keuze('sch', basis, v.sch);
  if(deel && v.method === 'td'){
    const A = S.g[0], Bf = S.g[1];
    r.push(rij('', pre + sRij(c, cfg, S, false), 'opgave'));
    r.push(rij('=', `<span class="h5-resrij">${sg}<span class="h5-tdbr"><span class="h5-tdrij"><span class="h5-tdl">${A.num} : ${Bf.num} =</span>${RV.getal('res.t', v.res.t, 'nat', 'br-get', 'teller')}</span><span class="h5-tdbar"></span>`
      + `<span class="h5-tdrij"><span class="h5-tdl">${A.den} : ${Bf.den} =</span>${RV.getal('res.n', v.res.n, 'nat', 'br-get', 'noemer')}</span></span>${keuze}</span>`, 'uitrekenen'));
  } else if(!deel || v.method === 'om'){
    const klik = !deel || S.alles, omg = S.g.findIndex(f=>f.omg);
    const terugOm = deel && klik && omg > 0 ? `<button type="button" class="br-kn terug" data-flip="${omg}" title="Omkeren ongedaan maken">↶ niet omkeren</button>` : '';
    r.push(rij('', pre + sRij(c, cfg, S, klik), deel && !S.alles ? 'klik op :' : 'schrappen', ' h5-brij'));
    if(klik){
      const sel = ui.msel && ui.msel.q === q.id ? ui.msel : null;
      r.push(rij('', sel && sel.t != null && sel.n != null
        ? `<span class="h5-mcut">Deel <b>${S.T[sel.t]}</b> en <b>${S.N[sel.n]}</b> door <input class="rv-getal h5-deler" type="text" inputmode="numeric" autocomplete="off" aria-label="deler"> <button type="button" class="br-kn h5-schrap">✂ Schrap</button> <button type="button" class="br-kn terug h5-annuleer">annuleer</button></span>`
        : S.ok.length || terugOm ? '<span class="h5-legende">' + S.ok.map(cut=>`<span class="h5-lg" style="border-color:${KLEUR[cut.ci % KLEUR.length]};color:${KLEUR[cut.ci % KLEUR.length]}"><b>${S.Th[cut.t].find(h=>h.ci === cut.ci).v}</b> en <b>${S.Nh[cut.n].find(h=>h.ci === cut.ci).v}</b> : <b>${cut.d}</b>${cut.t !== cut.n ? ' <i>(diagonaal)</i>' : ''}</span>`).join('') + (S.ok.length ? '<button type="button" class="br-kn terug h5-ongedaan" title="Laatste schrap ongedaan maken">↶</button>' : '') + terugOm + '</span>'
        : '<span class="rv-tip">Schrappen: klik een <b>teller</b> en een <b>noemer</b> (ook diagonaal) die je door hetzelfde getal kan delen.</span>', '', ' h5-klein'));
      r.push(rij('=', `<span class="h5-resrij">${sg}${tnVeld('res', v.res)}${keuze}</span>`, 'uitrekenen'));
    } else r.push(rij('', '<span class="rv-tip">Klik op het deelteken <b>:</b> : de breuk erna keert om en je mag vermenigvuldigen.</span>', '', ' h5-klein'));
  }
  return `<div class="schrift h5-schriftje">${r.join('')}</div>`;
}
function solverBind(c, cfg){
  const { q, ui } = c, RV = window.RV, R = c.ant;
  R.querySelectorAll('[data-meth]').forEach(b=>b.onclick = ()=>{
    const m = b.dataset.meth, v = c.huidig(); if(v.method === m || ui.anim) return;
    if(m === 'td'){ const A = cfg.fs[0], Bf = cfg.fs[1];
      if(!(A.num % Bf.num === 0 && A.den % Bf.den === 0)){ v.mx = (v.mx || 0) + 1; c.bewaar(v); ui.tdFail = q.id; ui.anim = true; c.bezig(true); kruisje(b);
        setTimeout(()=>{ ui.anim = false; c.bezig(false); if(c.nogHier()) c.teken(); }, 900); return; } }
    ui.tdFail = null; ui.msel = null;
    Object.assign(v, { method:m, flip:[], cuts:[], cutsFor:'', res:TN(), sch:SCH() }); c.bewaar(v); c.teken(); });
  R.querySelectorAll('[data-flip]').forEach(b=>b.onclick = ()=>{ const i = +b.dataset.flip, v = c.huidig(); v.flip[i] = !v.flip[i]; c.bewaar(v);
    ui.flipAnim = v.flip[i] ? i : null; ui.msel = null; c.teken(); ui.flipAnim = null; });
  R.querySelectorAll('[data-sc]').forEach(b=>b.onclick = ()=>{ if(ui.anim) return;
    const s = ui.msel && ui.msel.q === q.id ? ui.msel : { q:q.id, t:null, n:null }, k = b.dataset.sc, i = +b.dataset.i;
    s[k] = s[k] === i ? null : i; ui.msel = s; c.teken(); const inp = c.ant.querySelector('.h5-deler'); if(inp) inp.focus(); });
  const go = R.querySelector('.h5-schrap');
  if(go){
    const inp = R.querySelector('.h5-deler');
    const schrap = ()=>{ if(ui.anim) return; const d = RV.nat(inp.value), v = c.huidig(), S = sState(cfg, v), s = ui.msel;
      if(d == null || d < 2){ inp.classList.add('rv-ongeldig'); inp.focus(); return; }
      if(S.T[s.t] % d === 0 && S.N[s.n] % d === 0){
        v.cuts = (v.cutsFor === S.sig ? v.cuts : []).concat([{ t:s.t, n:s.n, d }]); v.cutsFor = S.sig; c.bewaar(v); ui.msel = null; ui.versCut = v.cuts.length - 1; c.teken(); ui.versCut = null;
      } else { v.x = (v.x || 0) + 1; c.bewaar(v); ui.anim = true; c.bezig(true); kruisje(go);
        setTimeout(()=>{ ui.anim = false; c.bezig(false); ui.msel = null; if(c.nogHier()) c.teken(); }, 950); } };
    go.onclick = schrap;
    inp.oninput = e=>{ e.stopPropagation(); inp.classList.remove('rv-ongeldig'); };
    inp.onkeydown = e=>{ if(e.key === 'Enter') schrap(); };
    R.querySelector('.h5-annuleer').onclick = ()=>{ ui.msel = null; c.teken(); };
  }
  const un = R.querySelector('.h5-ongedaan'); if(un) un.onclick = ()=>{ const v = c.huidig(); v.cuts.pop(); c.bewaar(v); c.teken(); };
  requestAnimationFrame(()=>{ if(c.nogHier()) lijnen(c, cfg); });
}

/* rechthoekmodel: kolommen en rijen verdelen en aanklikken */
function areaCtl(v, icons){
  const ic = icons || ['', ''];
  return '<div class="h5-modi">'
    + `<button type="button" class="h5-modus${v.mode === 'c' ? ' aan' : ''}" data-armode="c" aria-pressed="${v.mode === 'c'}"><span class="h5-swc kol"></span>① Kolommen ${icoHTML(ic[0])}</button>`
    + `<button type="button" class="h5-modus${v.mode === 'r' ? ' aan' : ''}" data-armode="r" aria-pressed="${v.mode === 'r'}"><span class="h5-swc rij"></span>② Rijen ${icoHTML(ic[1])}</button></div>`
    + (v.mode === 'c' ? knipKnop(v.cols, '', 'kolommen', 'arc', 'Aantal kolommen:') + '<p class="rv-tip">Klik op een kolom om ze te kleuren (nog eens: weg).</p>'
      : knipKnop(v.rows, '', 'rijen', 'arr', 'Aantal rijen:') + '<p class="rv-tip">Klik op een rij om ze te kleuren (nog eens: weg).</p>');
}
function bindArea(c){
  c.vis.querySelectorAll('[data-armode]').forEach(b=>b.onclick = ()=>{ const v = c.huidig(); v.mode = b.dataset.armode; c.bewaar(v); c.teken(); });
  bindKnip(c, 12, 'arc', 'cols', v=>{ v.cs = v.cs.filter(x=>x < v.cols); });
  bindKnip(c, 12, 'arr', 'rows', v=>{ v.rs = v.rs.filter(x=>x < v.rows); });
  const svg = c.vis.querySelector('.h5-rh'), hit = svg && svg.querySelector('.h5-rhklik'); if(!hit) return;
  hit.onclick = ev=>{
    const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse()), v = c.huidig();
    if(v.mode === 'c'){ const k = Math.floor((p.x - AR.x0) / AR.W * v.cols); if(k < 0 || k >= v.cols) return; v.cs = v.cs.includes(k) ? v.cs.filter(x=>x !== k) : v.cs.concat([k]); }
    else { const k = Math.floor((p.y - AR.y0) / AR.H * v.rows); if(k < 0 || k >= v.rows) return; v.rs = v.rs.includes(k) ? v.rs.filter(x=>x !== k) : v.rs.concat([k]); }
    c.bewaar(v); c.teken(); };
}
const breukKleur = (f, kl) => `<span class="h5-kl ${kl}">${brS(f[0], f[1])}</span>`;
TYPEN.area.teken = c=>{
  const { q, v } = c, B = window.RV.br, cfg = areaCfg(q), basis = sBase(cfg, v);
  werk(c, 'h5-rhwerk');
  c.vis.innerHTML = `<div class="h5-rhwrap">${areaSVG(v, true)}<div class="h5-rhzij">${areaCtl(v)}<div class="h5-legend"><span><i class="h5-swc kol"></i>${breukKleur(q.b, 'paars')} <em>${q.b[0]} van de ${q.b[1]} kolommen paars</em></span>`
    + `<span><i class="h5-swc rij"></i>${breukKleur(q.a, 'geel')} ervan <em>${q.a[0]} van de ${q.a[1]} rijen geel</em></span><span><i class="h5-swc beide"></i>gearceerd = de uitkomst</span></div></div></div>`
    + B.paneel('sch', basis, v.sch, c, true);
  c.ant.innerHTML = `<h3>③ Reken uit: ${breukKleur(q.a, 'geel')} van ${breukKleur(q.b, 'paars')} = ${breukKleur(q.a, 'geel')} ⋅ ${breukKleur(q.b, 'paars')}</h3>` + solverHTML(c, cfg);
  bindArea(c); solverBind(c, cfg);
  const basisVan = w => sBase(cfg, w);
  B.bind(c, basisVan); opInvoer(c, ()=>B.ververs(c, basisVan));
};

/* stappenplan vermenigvuldigen en delen (en een kommagetal eerst omzetten) */
TYPEN.msteps.teken = c=>{
  const { q, v } = c, B = window.RV.br, cfg = mCfg(q, v), basis = sBase(cfg, v);
  werk(c, 'h5-stappen');
  const plan = q.f.some(x=>x[2] === ':') ? ['① teken', '② aanpak kiezen', '③ uitrekenen en vereenvoudigen'] : ['① teken', '② schrappen', '③ teller ⋅ teller, noemer ⋅ noemer', '④ eenvoudigste vorm'];
  c.vis.innerHTML = `<div class="h5-opgave"><span class="h5-olab">Opgave</span><span class="h5-oexpr">${fx(q.expr)}</span></div>`
    + (q.combo ? q.dec.map((d, j)=>B.conv(`conv.${j}`, d, v.conv[j])).join('') : `<div class="plan h5-plan">${plan.map(s=>`<span>${s}</span>`).join('')}</div>`
      + '<p class="rv-tip">Uitrekenen: vermenigvuldig wat overblijft na het schrappen (teller maal teller, noemer maal noemer).</p>' + TIP_SCHAAR)
    + B.paneel('sch', basis, v.sch, c, true);
  c.ant.innerHTML = solverHTML(c, cfg, '', 'Zet eerst het kommagetal om naar een breuk: daarna verschijnt het stappenplan.')
    + (q.combo ? q.dec.map((d, j)=>B.paneel(`conv.${j}.sch`, B.convBasis(v.conv[j]), v.conv[j].sch, c, true)).join('') : '');
  B.bindConv(c); solverBind(c, cfg);
  const basisVan = (w, p) => { if(p === 'sch') return sBase(mCfg(q, w), w); const m = p.match(/^conv\.(\d+)\.sch$/); return m ? B.convBasis(w.conv[+m[1]]) : null; };
  B.bind(c, basisVan);
  opInvoer(c, ()=>{ if(mCfg(q, c.huidig()).ready !== cfg.ready) return houdFocus(c); B.ververs(c, basisVan); });
};

/* kommagetal maal kommagetal: ① zonder komma's ② cijfers na de komma tellen ③ de komma schuift naar haar plaats */
function kommaCijfers(v, k){
  const n = nat(v.int.n); if(n === null) return '';
  let d = String(n); while(d.length < k + 1) d = '0' + d;
  const plaats = d.length - k, nullen = d.length - String(n).length;
  return (neg(v.int.s) ? '<span class="h5-dsg">−</span>' : '') + d.split('').map((x, i)=>(i === plaats && k > 0 ? '<span class="h5-komma">,</span>' : '') + `<span class="h5-cijfer${i < nullen ? ' nul' : ''}">${x}</span>`).join('') + (k === 0 ? '<span class="h5-komma start">,</span>' : '');
}
TYPEN.dmul.teken = c=>{
  const { q, v, ui } = c, RV = window.RV;
  const zonder = q.d.map(x=>x[0].replace(',', '').replace(/^0+(?=\d)/, ''));
  c.vis.innerHTML = `<div class="h5-opgave"><span class="h5-olab">Opgave</span><span class="h5-oexpr">${fx(q.expr)}</span></div>`
    + '<div class="plan"><span>① reken uit zonder komma’s</span><span>② tel de cijfers na de komma</span><span>③ de komma schuift op haar plaats</span></div>'
    + '<p class="rv-tip h5-midden">⚠️ Dit werkt enkel bij <b>kommagetal maal kommagetal</b>. Bij optellen en aftrekken zet je de komma’s onder elkaar.</p>';
  const leegUit = '<span class="rv-tip">Vul ① en ② in: dan verschijnt de uitkomst.</span>';
  c.ant.innerHTML = '<div class="schrift h5-schriftje">'
    + `<div class="srij"><span></span><span class="orig">${fx(q.expr)}</span><span class="stapnaam">opgave</span></div>`
    + `<div class="srij"><span class="gelijk">→</span><span class="orig h5-zonder">${zonder.map(n=>`<b>${n}</b>`).join(' <span class="rv-op">⋅</span> ')} = <span class="rv-term">${RV.teken('int.s', v.int.s, 'toestandsteken', true)}${RV.getal('int.n', v.int.n, 'nat', 'breed', 'uitkomst zonder komma')}</span></span><span class="stapnaam">① zonder komma’s</span></div>`
    + `<div class="srij"><span></span><span class="h5-tel">Aantal cijfers na de komma, samen: ${RV.getal('cnt', v.cnt, 'nat', '', 'aantal cijfers na de komma')}</span><span class="stapnaam">② tel</span></div>`
    + `<div class="srij"><span class="gelijk">=</span><span class="orig"><span class="h5-dres">${leegUit}</span></span><span class="stapnaam">③ komma</span></div>`
    + '</div>' + RV.tekenTip;
  const toonUit = anim=>{
    const w = c.huidig(), k = nat(w.cnt), el = c.ant.querySelector('.h5-dres'); if(!el) return;
    clearInterval(ui.dTimer);
    if(k === null || w.int.s == null || nat(w.int.n) === null){ el.innerHTML = leegUit; return; }
    if(!anim || k === 0){ el.innerHTML = kommaCijfers(w, k); return; }
    let stap = 0; el.innerHTML = kommaCijfers(w, 0);
    ui.dTimer = setInterval(()=>{ if(!c.nogHier() || !el.isConnected){ clearInterval(ui.dTimer); return; } stap++; el.innerHTML = kommaCijfers(w, stap); const km = el.querySelector('.h5-komma'); if(km) km.classList.add('hop'); if(stap >= k) clearInterval(ui.dTimer); }, 420);
  };
  toonUit(false);
  opInvoer(c, ()=>toonUit(true));
};

/* weetjes: bewerking kiezen, getal aanvullen, uitrekenen */
TYPEN.dfact.teken = c=>{
  const { q, v } = c, RV = window.RV;
  werk(c, 'h5-weetwerk');
  c.vis.innerHTML = '<div class="h5-weetkaart">🧠 <b>Weetjes</b>: deze ken je van buiten. Delen door of vermenigvuldigen met <b>0,5</b>, <b>0,1</b>, <b>0,01</b> of <b>0,001</b> kan je sneller schrijven.</div>'
    + '<p class="rv-tip">Klik op het vakje met <b>?</b> om de bewerking te kiezen (⋅ of :). Kies het teken van de uitkomst in het tekenvak.</p>';
  c.ant.innerHTML = '<div class="h5-weetjes">' + q.rows.map((r, i)=>{ const st = v.rows[i];
    return `<div class="h5-weetrij"><span class="h5-wq">${fx(r.join(' '))} =</span><span class="h5-wq">${fx(r[0])}</span>`
      + `<button type="button" class="h5-opknop${st.op ? ' aan' : ''}" data-fop="${i}" title="Klik: ⋅ of :" aria-label="bewerking kiezen">${st.op || '?'}</button>`
      + `${RV.getal(`rows.${i}.k`, st.k, 'nat', 'h5-k', 'getal')}<span class="h5-wq">=</span><span class="rv-term">${RV.teken(`rows.${i}.res.s`, st.res.s, 'toestandsteken', true)}${RV.getal(`rows.${i}.res.n`, st.res.n, 'dec', 'h5-wres', 'uitkomst')}</span></div>`; }).join('') + '</div>';
  c.ant.querySelectorAll('[data-fop]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(), r = w.rows[+b.dataset.fop]; r.op = r.op === '⋅' ? ':' : '⋅'; c.bewaar(w); b.textContent = r.op; b.classList.add('aan'); });
};

/* vraagstukken: de bewerking in het sjabloon, daarna dezelfde rekenmachine */
function sjabloon(c){
  const { q, v } = c, RV = window.RV, T = q.tpl;
  const vak = p => tnVeld(`tp.${p}`, v.tp[p], 'breuk'), nat2 = p => RV.getal(`tp.${p}.t`, v.tp[p].t, 'nat', 'br-get', 'getal');
  return T.kind === 'van' ? `<div class="h5-sjabloon">${vak('a')}<span class="h5-van">van</span>${T.second === 'nat' ? nat2('b') : vak('b')}<span class="h5-op">=</span>${vak('c')}<span class="h5-op">⋅</span>${vak('d')}</div>`
    : `<div class="h5-sjabloon">${vak('a')}<span class="h5-op">:</span>${T.second === 'nat' ? nat2('b') : vak('b')}</div>`;
}
TYPEN.context.teken = c=>{
  const { q, v } = c, B = window.RV.br, cfg = ctxCfg(q, v), basis = sBase(cfg, v), N = v.N || 1, fig = FIGUUR[q.visual];
  werk(c, 'h5-vraagwerk');
  if(fig) c.vis.innerHTML = fig(N) + knipKnop(N, { dag:'de dag', gsm:'de nieuwe opslag', fles:'de liter' }[q.visual]);
  else c.vis.innerHTML = `<div class="h5-rhwrap">${areaSVG(v, true, q.icons)}<div class="h5-rhzij">${areaCtl(v, q.icons)}<div class="h5-legend"><span><i class="h5-swc beide"></i>gearceerd: ${icoHTML(q.icons[0])} én ${icoHTML(q.icons[1])}</span></div></div></div>`;
  const eind = B.eind(v.sch, basis);
  c.vis.insertAdjacentHTML('beforeend', '<h3>① Bewerking</h3>' + sjabloon(c) + B.paneel('sch', basis, v.sch, c, true));
  c.ant.innerHTML = '<h3>② Reken uit</h3>' + solverHTML(c, cfg, '', 'Vul eerst de bewerking in het sjabloon volledig in.') + `<div class="h5-antw">${esc(q.resLabel)}: <b>${eind ? br(eind.num, eind.den) : '…'}</b> ${esc(q.unit || '')}</div>`;
  if(fig) bindKnip(c, { dag:24, gsm:36, fles:24 }[q.visual], 'n', 'N'); else bindArea(c);
  solverBind(c, cfg);
  const basisVan = w => sBase(ctxCfg(q, w), w), sleutel = k => k.ready + '|' + k.fs.map(f=>f.num + '/' + f.den).join(',');
  B.bind(c, basisVan);
  opInvoer(c, ()=>{ if(sleutel(ctxCfg(q, c.huidig())) !== sleutel(cfg)) return houdFocus(c); B.ververs(c, basisVan); });
};

/* tweelingsommen: optellen of vermenigvuldigen/delen? */
TYPEN.twins.teken = c=>{
  const { q, v } = c, B = window.RV.br;
  werk(c, 'stapel');
  c.vis.innerHTML = '<div class="h5-tweelingkop">⚔️ optellen / aftrekken &nbsp;·&nbsp; ✖️ vermenigvuldigen / delen</div>';
  const kaart = (k, i) => { const e = q.exprs[i], basis = B.val(v[k].res), titel = i === 0 ? (e.includes('+') ? '⚔️ optellen' : '⚔️ aftrekken') : (e.includes(':') ? '✖️ delen' : '✖️ vermenigvuldigen');
    return `<div class="h5-tkaart"><div class="h5-ttop">${titel}</div><div class="rv-rij"><span class="rv-wisk">${fx(e)} =</span>${B.veld(`${k}.res`, v[k].res)}</div><div class="rv-rij">${B.keuze(`${k}.sch`, basis, v[k].sch)}</div>${B.paneel(`${k}.sch`, basis, v[k].sch, c)}</div>`; };
  c.ant.innerHTML = `<div class="h5-tweeling">${kaart('a', 0)}${kaart('b', 1)}</div>${TIP_BREUK}`;
  const basisVan = (w, p) => B.val(B.pad(w, p.replace('.sch', '.res')));
  B.bind(c, basisVan); opInvoer(c, ()=>B.ververs(c, basisVan));
};

/* foutenjager */
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
  id:'2a-rv-5-rationale-vermenigvuldigen', css:'opgave.css', delen:DELEN, begrippen:BEGRIPPEN, codes:CODES,
  verbeter(q, v, k){ const r = VERBETER[q.soort](q, v || {}, k); return { pts:Math.round(Math.min(q.punten, r.pts) * 100) / 100, codes:[...new Set(r.codes)], kruis:r.kruis || 0 }; },
  volledig(q, a){ let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){} try{ return !!v && VOLLEDIG[q.soort](q, v); }catch(e){ return false; } },
  toon,
  /* een volledig juist antwoord bij sleutel k (voor de tests) */
  voorbeeld(q, k){
    const L = LEEG[q.soort](q), teken = f => evalF(f).num < 0 ? '−' : '+';
    const vul = Ev => { const b = { num:Ev.num, den:Ev.den }; return { res:{ s1:b.num < 0 ? '−' : '+', t:String(Math.abs(b.num)), n:String(b.den) }, sch:vereenvoudig(b) }; };
    switch(q.soort){
      case 'area': return Object.assign(L, { cols:q.b[1], rows:q.a[1], cs:Array.from({ length:q.b[0] }, (_, i)=>i), rs:Array.from({ length:q.a[0] }, (_, i)=>i) }, losOp(areaCfg(q), null));
      case 'msteps': {
        const conv = (q.dec || []).map(d=>{ const w = decFr(d); return { pos:{ 10:'t', 100:'h', 1000:'d' }[w.den], t:String(w.num), sch:vereenvoudig(w) }; });
        L.conv = conv; return Object.assign(L, losOp(mCfg(q, L), teken(q.f))); }
      case 'dmul': { const { Eint, Ecnt } = dmulInfo(q); return { int:{ s:Eint < 0 ? '−' : '+', n:String(Math.abs(Eint)) }, cnt:String(Ecnt) }; }
      case 'dfact': return { rows:q.rows.map(r=>{ const w = weetje(r), t = alsKomma(w.E); return { op:w.op, k:String(w.k), res:{ s:t.startsWith('−') ? '−' : '+', n:t.replace('−', '') } }; }) };
      case 'context': {
        const T = q.tpl, b = k.b, frS = f => ({ t:String(f[0]), n:String(f[1]) });
        L.tp = T.kind === 'van' ? { a:frS(k.a), b:T.second === 'nat' ? { t:String(b[0]), n:'' } : frS(b), c:frS(k.a), d:frS(b) } : { a:frS(k.a), b:T.second === 'nat' ? { t:String(b[0]), n:'' } : frS(b), c:TN(), d:TN() };
        return Object.assign(L, losOp(ctxCfg(q, L), null)); }
      case 'twins': return { a:vul(tweelingE(q.parts[0])), b:vul(tweelingE(q.parts[1])) };
      case 'errfrac': return Object.assign(L, { choice:k.good }, vul(evalF(q.f)));
    }
  },
  invullen:opts=>window.RV.maak(OPG, TYPEN, opts)
};
})();
