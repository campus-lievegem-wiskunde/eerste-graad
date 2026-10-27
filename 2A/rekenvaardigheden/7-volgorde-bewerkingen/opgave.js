/* 2A Rekenvaardigheden 7 · Volgorde van bewerkingen (30 oefeningen, interactief met gedeeld/rv-kader.js en gedeeld/rv-breuk.js).
   Oefeningen, volgorde en uitleg zoals het oorspronkelijke Oefening.html; verbeteren zoals code.gs: de rekenmotor speelt elke regel
   van de leerling na, elke tussenstap wordt nagerekend (deelpunten), typische fouten krijgen een foutcode.
   Rode kruisjes: een bewerking in de verkeerde volgorde (V1 tot V4), een tekenpaar dat niet samen mag, "teller : teller" terwijl het
   niet opging, een onmogelijke schrap, onmogelijke knipgetallen, "kan niet eenvoudiger" terwijl het wel kon.
   Rekenen regel per regel: v = { L:[{ m:[aangeklikte bewerkingen], p:[[bewerkingsteken, teken], …] (tekenparen), x, e:[{ c, n }] (volgordefouten) }] }.
   Een aangeklikte bewerking m = { id, r:{ s, n[, d] }, sch } (+ bij breuk maal of gedeeld door breuk: fo, method, flip, cuts, cutsFor, x, mx),
   een breuk vereenvoudigen m = { id, simp:true, v, sch }.
   Het toestandsteken staat niet vanzelf op +: de leerling kiest het altijd in het tekenvak (in het origineel betekende een leeg vakje +).
   Enkel de volgorde van het stappenplan (oefening 1) en de juiste keuze bij de foutenjager staan in de versleutelde sleutel
   (sleutel.enc.json); de uitkomsten volgen uit de opgave zelf. */
(function(){
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const leeg = '<span class="tl-leeg">……</span>';

/* ======================= rekenmotor (letterlijk zoals code.gs en het oorspronkelijke Oefening.html) =======================
   Schrijfwijze van de opgaven: - min · + plus · * maal · : gedeeld door · ^ macht · √ wortel · 3/4 breuk · 2,4 kommagetal · ( ) en [ ] haakjes */
const VO_CODES = { V1:'eerst maal en deel', V2:'niet van links naar rechts', V3:'eerst de haakjes', V4:'eerst machten en wortels' };
function voParse(str){
  const s = String(str).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[⋅·×]/g, '*');
  let i = 0;
  const peek = () => s[i], eat = () => s[i++];
  function expr(){ let n = term(); while(peek() === '+' || peek() === '-'){ const op = eat(); n = { t:'b', op, a:n, b:term() }; } return n; }
  function term(){ let n = unary(); while(peek() === '*' || peek() === ':'){ const op = eat(); n = { t:'b', op, a:n, b:unary() }; } return n; }
  function unary(){ if(peek() === '-'){ eat(); const x = postfix(); if(x.t === 'n'){ x.s = -x.s; return x; } return { t:'neg', e:x }; } return postfix(); }
  function postfix(){ const a = atom(); if(peek() === '^'){ eat(); let d = ''; while(/\d/.test(peek() || '')) d += eat(); return { t:'p', b:a, e:Number(d) }; } return a; }
  function atom(){
    const c = peek();
    if(/\d/.test(c || '')){
      let d = ''; while(/[\d,]/.test(peek() || '')) d += eat();
      if(peek() === '/'){ eat(); let n = ''; while(/\d/.test(peek() || '')) n += eat(); d += '/' + n; }
      return { t:'n', s:1, v:d };
    }
    if(c === '(' || c === '['){ eat(); const inner = expr(); eat(); return inner.t === 'n' ? inner : { t:'g', br:c, e:inner }; }
    if(c === '√'){ eat(); const a = atom(); return { t:'r', e:a.t === 'g' ? a.e : a }; }
    throw new Error('Onbekend teken in opgave: ' + c + ' (' + str + ')');
  }
  const out = expr();
  if(i < s.length) throw new Error('Opgave niet volledig gelezen: ' + str);
  return out;
}
const voKids = n => n.t === 'b' ? [n.a, n.b] : n.t === 'p' ? [n.b] : (n.t === 'r' || n.t === 'g' || n.t === 'neg') ? [n.e] : [];
function voNumber(root){ let k = 0; (function walk(n){ n.id = k++; voKids(n).forEach(walk); })(root); return root; }
function voFind(root, id){ if(root.id === id) return root; for(const c of voKids(root)){ const f = voFind(c, id); if(f) return f; } return null; }
const voContains = (root, id) => !!voFind(root, id);
const voLeaf = n => !!n && n.t === 'n';
/* is deze knoop nu aan de beurt? (alle onderdelen zijn al getallen) */
function voRedex(n){
  if(n.t === 'b') return voLeaf(n.a) && voLeaf(n.b);
  if(n.t === 'p') return voLeaf(n.b);
  if(n.t === 'r') return voLeaf(n.e);
  if(n.t === 'neg') return (n.e.t === 'p' || n.e.t === 'r') && voRedex(n.e);
  return false;
}
const voLevel = n => n.t === 'b' ? ((n.op === '*' || n.op === ':') ? 3 : 4) : 2;
/* waarom mag deze bewerking nog niet? → foutcode */
function voCode(n){
  const RANK = { V3:4, V1:3, V4:2, V2:1 }, self = n.t === 'neg' ? n.e : n;
  let best = null, why = '';
  const put = (c, w) => { if(!best || RANK[c] > RANK[best]){ best = c; why = w || VO_CODES[c]; } };
  voKids(self).forEach(c => {
    if(voLeaf(c)) return;
    if(self.t === 'r') put('V3', 'eerst onder het wortelteken');
    else if(c.t === 'g') put('V3');
    else if(c.t === 'p' || c.t === 'r' || c.t === 'neg') put('V4');
    else if(c.t === 'b'){ const cMul = c.op === '*' || c.op === ':', nMul = self.op === '*' || self.op === ':'; if(cMul && !nMul) put('V1'); else put('V2'); }
  });
  return { code:best || 'V2', why };
}
/* tekenpaar: + (−…) of − (−…) → het bewerkingsteken en het teken van het getal erna */
function voPairLeaf(n){
  if(!n || n.t !== 'b' || (n.op !== '+' && n.op !== '-')) return null;
  let l = n.b; while(l.t === 'b') l = l.a;
  return (l.t === 'n' && l.s < 0) ? l : null;
}
function voApplyPairs(root, pairs){
  (pairs || []).forEach(([o, l]) => { const op = voFind(root, o), lf = voFind(root, l);
    if(op && lf && voPairLeaf(op) === lf){ op.op = op.op === '+' ? '-' : '+'; lf.s = 1; lf.pm = true; op.pm = true; } });
  return root;
}
const norm = s => String(s == null ? '' : s).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '');
const parseNatStr = s => { const t = norm(s); return /^\d{1,6}$/.test(t) ? Number(t) : null; };
const parseDecStr = s => { const t = norm(s).replace('.', ','); return /^\d{1,7}(,\d{1,7})?$/.test(t) ? t : null; };
const sigOf = base => base ? base.num + '/' + base.den : '';
const schOK = (st, base) => !!st && !!base && st.done && st.for === sigOf(base);
function applyCuts(base, cuts){
  let num = Math.abs(base.num), den = base.den; const ok = [];
  for(const c of (cuts || [])){ if(c > 1 && num % c === 0 && den % c === 0){ num /= c; den /= c; ok.push(c); } else break; }
  return { num:base.num < 0 ? -num : num, den, ok };
}
const mReady = m => m.fo !== 'div' || (m.method === 'td' || (m.method === 'om' && !!m.flip));
/* uitkomst van een aangeklikte bewerking → nieuw getal */
function voResLeaf(q, m){
  const r = m.r || {}, sg = r.s === '−' ? -1 : 1;
  if(q.kind === 'dec'){ const d = parseDecStr(r.n); return { t:'n', s:sg, v:d == null ? '?' : d.replace(/^0+(?=\d)/, '') }; }
  const t = parseNatStr(r.n);
  if(t == null) return { t:'n', s:sg, v:'?' };
  if(q.kind !== 'frac' || String(r.d || '').trim() === '') return { t:'n', s:sg, v:String(t) };
  const d = parseNatStr(r.d);
  if(!d) return { t:'n', s:sg, v:'?' };
  const res = applyCuts({ num:t, den:d }, m.sch && m.sch.mode === 'cut' ? m.sch.cuts : []);
  return { t:'n', s:sg, v:res.den === 1 ? String(res.num) : res.num + '/' + res.den };
}
function voFracBase(m){ const r = m && m.r; if(!r) return null; const t = parseNatStr(r.n), d = parseNatStr(r.d); return t != null && d ? { num:t, den:d } : null; }
const voSimpBase = m => { const x = String(m.v).match(/^(\d+)\/(\d+)$/); return x ? { num:Number(x[1]), den:Number(x[2]) } : null; };
/* enkel gehele getallen (en geen deling) → de uitkomst is zeker een geheel getal */
function voIntOnly(n){
  if(n.t === 'n') return !/\//.test(n.v) && !/,/.test(n.v);
  if(n.t === 'b' && n.op === ':') return false;
  return voKids(n).every(voIntOnly);
}
function voMarkDone(q, m){
  if(m.simp){ const b = voSimpBase(m); return !!b && schOK(m.sch, b); }
  const r = m.r || {};
  if(r.s == null) return false;
  if(m.fo && !mReady(m)) return false;
  if(q.kind === 'dec') return parseDecStr(r.n) != null;
  if(parseNatStr(r.n) == null) return false;
  if(q.kind !== 'frac' || String(r.d || '').trim() === '') return true;
  const b = voFracBase(m);
  return !!b && schOK(m.sch, b);
}
function voSubst(n, byId, q){
  if(byId[n.id] && byId[n.id].simp){ const b = voSimpBase(byId[n.id]), r = applyCuts(b, byId[n.id].sch.cuts);
    return { t:'n', s:n.s, v:r.den === 1 ? String(r.num) : r.num + '/' + r.den, nw:true }; }
  if(byId[n.id]){ const l = voResLeaf(q, byId[n.id]); l.nw = true; return l; }
  const c = Object.assign({}, n); delete c.id; delete c.nw; delete c.pm;
  if(n.t === 'b'){ c.a = voSubst(n.a, byId, q); c.b = voSubst(n.b, byId, q); }
  else if(n.t === 'p') c.b = voSubst(n.b, byId, q);
  else if(n.t === 'r' || n.t === 'g' || n.t === 'neg') c.e = voSubst(n.e, byId, q);
  if(c.t === 'g' && c.e.t === 'n') return c.e;                 /* haakjes rond één getal vallen weg */
  return c;
}
/* alle regels van een oefening opbouwen */
function voLines(q, v){
  let ast = voNumber(voParse(q.expr));
  const out = [];
  (v.L || []).forEach((e, k) => {
    voApplyPairs(ast, e.p);
    out.push({ ast, e, k });
    if(k < v.L.length - 1){ const byId = {}; (e.m || []).forEach(m => { byId[m.id] = m; }); ast = voNumber(voSubst(ast, byId, q)); }
  });
  return out;
}
/* breuk maal of gedeeld door breuk binnen een kaartje */
const voLeafFrac = n => { const m = String(n.v).match(/^(\d+)\/(\d+)$/); return { neg:n.s < 0, num:m ? Number(m[1]) : Number(n.v), den:m ? Number(m[2]) : 1 }; };
const voFracOp = (q, n) => q.kind === 'frac' && !!n && n.t === 'b' && (n.op === '*' || n.op === ':') && voLeaf(n.a) && voLeaf(n.b) && (/\//.test(n.a.v) || /\//.test(n.b.v));
const voFs = n => { const A = voLeafFrac(n.a), B = voLeafFrac(n.b); A.op = null; B.op = n.op === ':' ? ':' : '⋅'; return [A, B]; };
function mState(fs, m){
  const om = m.method === 'om';
  const g = fs.map(f => { const flipped = om && f.op === ':' && !!m.flip; let num = f.num, den = f.den;
    if(flipped){ const t = num; num = den; den = t; }
    return { neg:f.neg, num, den, op:flipped ? '⋅' : f.op, div:f.op === ':', flipped }; });
  const allFlipped = !fs.some(f => f.op === ':') || (om && !!m.flip);
  const sig = (m.method || '') + '|' + g.map(f => f.num + '/' + f.den).join(',');
  const T = g.map(f => f.num), N = g.map(f => f.den), Th = g.map(() => []), Nh = g.map(() => []), Tc = g.map(() => null), Nc = g.map(() => null), ok = [];
  if(m.cutsFor === sig) (m.cuts || []).forEach((c, ci) => {
    if(T[c.t] != null && N[c.n] != null && T[c.t] % c.d === 0 && N[c.n] % c.d === 0){
      Th[c.t].push({ v:T[c.t], ci }); Nh[c.n].push({ v:N[c.n], ci }); T[c.t] /= c.d; N[c.n] /= c.d; Tc[c.t] = ci; Nc[c.n] = ci; ok.push(Object.assign({ ci }, c)); } });
  return { g, allFlipped, sig, T, N, Th, Nh, Tc, Nc, ok };
}
const SCH = () => ({ mode:null, cuts:[], done:false, for:null, x:0, nv:0, sx:0 });
const LINE = () => ({ m:[], p:[], x:0, e:[] });
const emptyRes = q => q.kind === 'frac' ? { s:null, n:'', d:'' } : { s:null, n:'' };
const voAllDone = (q, e) => (e.m || []).length > 0 && e.m.every(m => voMarkDone(q, m));

/* ======================= oefeningen ======================= */
const E = (id, soort, punten, vraag, extra) => Object.assign({ id, type:'eigen', soort, punten, vraag }, extra);
const vo = (id, kind, expr, punten) => E(id, 'vo', punten, 'Bereken <span class="h7-titel">' + voStatic(expr) + '</span>', { kind, expr });
const jager = (id, who, expr, lines, options) => E(id, 'errvo', 1.5, `${who} maakte een fout. Kan jij ze vinden?`, { who, expr, lines, options:options.map((text, i)=>({ id:'abcd'[i], text })) });
let DELEN;
const maakDelen = () => [
  { titel:'Weetjes: wat eerst?', vragen:[ E('ex01', 'first', 2, 'Dit ken je van buiten: de volgorde van de bewerkingen.', { items:['-16:4*2', '10-6:2', '8-2+5', '2*(3+4)', '4+5^2', '20:5*2', '12-√9*2', '-3^2*2'] }) ] },
  { titel:'Eerst maal en deel', vragen:[ vo('ex02', 'int', '-5+3*(-2)', 1.5), vo('ex03', 'int', '-16:4*2', 1.5), vo('ex04', 'int', '-6*5-(-10)', 1.5), vo('ex05', 'int', '10-6:(-2)', 1.5), vo('ex06', 'int', '-4+24:(-8)', 1.5) ] },
  { titel:'Haakjes eerst', vragen:[ vo('ex07', 'int', '(-5+3)*7', 2), vo('ex08', 'int', '-6+(3-5*2)', 2), vo('ex09', 'int', '24:(6-3^2)', 2), vo('ex10', 'int', '[2^2+(-9)]:[-10-(-5)]*(-2)', 2) ] },
  { titel:'Machten en wortels', vragen:[ vo('ex11', 'int', '2*3-3^1', 2), vo('ex12', 'int', '-√49-8:4', 2), vo('ex13', 'int', '(1-3)^2-2^3', 2), vo('ex14', 'int', '-(-6)^2:√(2^3+8^0)', 2), vo('ex15', 'int', '-3^2*2:(2*3)', 2), vo('ex16', 'int', '4^2-2*√64-2^3', 2) ] },
  { titel:'Alles samen', vragen:[ vo('ex17', 'int', '√81-3*(2^2-√4):2*3', 2.5), vo('ex18', 'int', '7-3*(5-8)^2-(-6)', 2.5), vo('ex19', 'int', '-(-3)^2-3*(√81-3*5)', 2.5), vo('ex20', 'int', '-1^4+(5^2-3*5)^2', 2.5) ] },
  { titel:'Kommagetallen en breuken', vragen:[ vo('ex21', 'dec', '2,4:2*(-4)', 2), vo('ex22', 'frac', '-3/5-4/5*1/2', 2.5), vo('ex23', 'frac', '5/2-3^2*1/2', 2.5), vo('ex24', 'frac', '(5/6-1/6):(-1/2)', 2.5),
    vo('ex25', 'frac', '-3/4-5/2*7/10', 2.5), vo('ex26', 'frac', '-5/20:2*32/10+(-8/20)^2', 2.5), vo('ex27', 'frac', '(1-3/4)*2/3-(-5/6)', 2.5), vo('ex28', 'frac', '5*(-2/5)^2-8/5+2/5*(-7/2)', 2.5) ] },
  { titel:'Foutenjager', vragen:[
    jager('ex29', 'Lotte', '18:3*2', ['18:6', '3'], ['Niets, de berekening is juist.', 'Maal en deel doe je van links naar rechts: eerst 18 : 3.', '18 : 6 is niet 3.', 'Delen gaat altijd voor vermenigvuldigen.']),
    jager('ex30', 'Omar', '-4^2+20', ['16+20', '36'], ['Het grondtal is 4, niet −4: −4² = −16.', 'Niets, de berekening is juist.', 'Hij moest eerst 4 + 20 doen.', '4² is 8.']) ] }
];
const UITLEG = {
  first:'① Zet de stappen van het stappenplan in de juiste volgorde: klik ze aan van eerst naar laatst. ② Klik bij elke opgave de bewerking aan die je als eerste moet uitvoeren.',
  vo:'Klik de bewerking aan die je eerst moet doen. Staan er bewerkingen los van elkaar, dan mag je er meerdere tegelijk aanklikken. Vul onder elke boog de uitkomst in en klik op ↓ Volgende regel. Staat er + (−…) of − (−…)? Klik dan eerst de twee tekens van het tekenpaar aan.',
  errvo:'Kies wat er fout ging en noteer de juiste uitkomst.'
};
const BEGRIPPEN = {
  'stappenplan':'Eerst wat tussen haakjes staat, dan machten en wortels, dan maal en deel van links naar rechts, en tot slot plus en min van links naar rechts.',
  'tekenpaar':'Een bewerkingsteken en het teken van het getal erna, zoals − (−10). Twee gelijke tekens worden +, twee verschillende tekens worden −.',
  'grondtal':'Het getal dat je herhaald vermenigvuldigt. In (−3)² is dat −3, in −3² is dat 3.',
  'vereenvoudig':'Teller en noemer door hetzelfde getal delen tot het niet meer kan.'
};
const CODES = {
  V1_MAAL_EERST:{ label:'Plus of min vóór maal of deel', uitleg:'Een optelling of aftrekking aangeklikt terwijl er nog vermenigvuldigd of gedeeld moest worden (rood kruisje V1).' },
  V2_LINKS_RECHTS:{ label:'Niet van links naar rechts', uitleg:'Bij bewerkingen van hetzelfde niveau (maal en deel, of plus en min) niet links begonnen, bv. −16 : 4 ⋅ 2 (rood kruisje V2).' },
  V3_HAAKJES:{ label:'Haakjes of wortelteken niet eerst', uitleg:'Een bewerking aangeklikt terwijl wat tussen haakjes of onder het wortelteken staat nog niet uitgerekend was (rood kruisje V3).' },
  V4_MACHT_EERST:{ label:'Machten en wortels niet eerst', uitleg:'Een bewerking aangeklikt terwijl er nog een macht of wortel uitgerekend moest worden (rood kruisje V4).' },
  GRONDTAL:{ label:'Minteken bij het grondtal gerekend', uitleg:'−3² = −9 en −(−6)² = −36: zonder haakjes hoort het minteken vóór de macht niet bij het grondtal.' },
  WEETJE_STAPPENPLAN:{ label:'Stappenplan in de verkeerde volgorde', uitleg:'Haakjes → machten en wortels → maal en deel → plus en min.' },
  TEKENPAAR_FOUT:{ label:'Tekenpaar dat niet samen mag', uitleg:'Twee tekens aangeklikt die geen tekenpaar vormen, bv. een deelteken en het minteken erna (rood kruisje).' },
  TEKENFOUT:{ label:'Verkeerd teken in een tussenstap', uitleg:'Het getal klopt, het toestandsteken niet.' },
  MAAL_EXPONENT:{ label:'Grondtal maal exponent', uitleg:'Bv. 2³ = 6 in plaats van 2 ⋅ 2 ⋅ 2 = 8.' },
  WORTEL_HELFT:{ label:'Helft in plaats van wortel', uitleg:'√64 is niet 32: het is het getal dat met zichzelf vermenigvuldigd 64 geeft.' },
  BREUK_OPTELLEN:{ label:'Tellers en noemers opgeteld', uitleg:'Bij optellen en aftrekken van breuken eerst gelijknamig maken; de noemers tel je niet op.' },
  TT_ONMOGELIJK:{ label:'Teller : teller die niet opgaat', uitleg:'"Teller : teller en noemer : noemer" gekozen terwijl dat geen natuurlijke getallen geeft (rood kruisje).' },
  SCHRAP_ONMOGELIJK:{ label:'Onmogelijke schrap', uitleg:'Teller en noemer gedeeld door een getal dat van één van beide geen deler is (rood kruisje).' },
  KOMMA_FOUT:{ label:'Komma op de verkeerde plaats', uitleg:'De cijfers kloppen, maar de komma staat verkeerd.' },
  NIET_VEREENVOUDIGD:{ label:'Niet (volledig) vereenvoudigd', uitleg:'De uitkomst klopt, maar staat niet in de eenvoudigste vorm.' },
  ONTERECHT_NIET:{ label:'"Kan niet eenvoudiger" terwijl het wel kon', uitleg:'Op "kan niet eenvoudiger" geklikt bij een breuk die nog vereenvoudigd kon worden (rood kruisje).' },
  SCHAAR_ONMOGELIJK:{ label:'Onmogelijk knipgetal', uitleg:'Proberen knippen door een getal dat geen deler is van teller en noemer (rood kruisje).' },
  TE_VROEG_KLAAR:{ label:'Te vroeg "klaar"', uitleg:'Op "Klaar met vereenvoudigen" geklikt terwijl er nog verder geknipt kon worden.' },
  REKENFOUT:{ label:'Rekenfout in een tussenstap', uitleg:'Een andere fout in een tussenuitkomst.' },
  ONAF:{ label:'Niet afgewerkt', uitleg:'De berekening werd niet tot één getal uitgewerkt.' },
  FOUTENJAGER:{ label:'Verkeerde fout aangeduid', uitleg:'Bij de foutenjager niet de echte fout gekozen.' }
};
const VCODE = { V1:'V1_MAAL_EERST', V2:'V2_LINKS_RECHTS', V3:'V3_HAAKJES', V4:'V4_MACHT_EERST' };

/* ======================= verbeteren (zoals code.gs) ======================= */
const gcd = (a, b)=>{ a = Math.abs(a); b = Math.abs(b); while(b){ const t = a % b; a = b; b = t; } return a; };
const red = f => { if(!f) return null; if(f.den < 0) f = { num:-f.num, den:-f.den }; const g = gcd(f.num, f.den) || 1; return { num:f.num / g, den:f.den / g }; };
const fAdd = (a, b) => red({ num:a.num * b.den + b.num * a.den, den:a.den * b.den });
const fSub = (a, b) => red({ num:a.num * b.den - b.num * a.den, den:a.den * b.den });
const fMul = (a, b) => red({ num:a.num * b.num, den:a.den * b.den });
const fDiv = (a, b) => b.num === 0 ? null : red({ num:a.num * b.den, den:a.den * b.num });
const fEq = (a, b) => !!a && !!b && a.num * b.den === b.num * a.den;
const fAbs = a => a ? { num:Math.abs(a.num), den:a.den } : null;
const isqrt = n => { const r = Math.round(Math.sqrt(n)); return r * r === n ? r : null; };
/* waarde van een getal-knoop */
function leafVal(n){
  const s = String(n.v), sg = n.s < 0 ? -1 : 1;
  let m = s.match(/^(\d+)\/(\d+)$/);
  if(m) return red({ num:sg * Number(m[1]), den:Number(m[2]) });
  m = s.match(/^(\d+)(?:,(\d+))?$/);
  if(m){ const d = m[2] || ''; return red({ num:sg * Number(m[1] + d), den:Math.pow(10, d.length) }); }
  return null;
}
/* exacte waarde van een (deel)uitdrukking */
function evalN(n){
  if(!n) return null;
  if(n.t === 'n') return leafVal(n);
  if(n.t === 'g') return evalN(n.e);
  if(n.t === 'neg'){ const x = evalN(n.e); return x ? { num:-x.num, den:x.den } : null; }
  if(n.t === 'p'){ const b = evalN(n.b); if(!b) return null; return red({ num:Math.pow(b.num, n.e), den:Math.pow(b.den, n.e) }); }
  if(n.t === 'r'){ const x = evalN(n.e); if(!x || x.num < 0) return null; const a = isqrt(x.num), b = isqrt(x.den); return a === null || b === null ? null : { num:a, den:b }; }
  if(n.t === 'b'){ const a = evalN(n.a), b = evalN(n.b); if(!a || !b) return null;
    return n.op === '+' ? fAdd(a, b) : n.op === '-' ? fSub(a, b) : n.op === '*' ? fMul(a, b) : fDiv(a, b); }
  return null;
}
const countOps = n => !n ? 0 : ((n.t === 'b' || n.t === 'p' || n.t === 'r') ? 1 : 0) + voKids(n).reduce((s, c)=>s + countOps(c), 0);
const fracTxt = f => !f ? '…' : (f.num < 0 ? '−' : '') + Math.abs(f.num) + (f.den === 1 ? '' : '/' + f.den);
function decTxt(f){
  if(!f) return '…';
  let num = Math.abs(f.num), den = f.den, k = 0;
  while(den !== 1 && k < 8){ num *= 10; k++; const g = gcd(num, den); num /= g; den /= g; }
  if(den !== 1) return fracTxt(f);
  let s = String(num);
  if(k){ while(s.length <= k) s = '0' + s; s = s.slice(0, -k) + ',' + s.slice(-k); }
  return (f.num < 0 ? '−' : '') + s;
}
const fmt = n => n < 0 ? '−' + Math.abs(n) : String(n);
function schCodes(sch, out){
  if(!sch) return;
  const x = Number(sch.x) || 0, sx = Number(sch.sx) || 0, nv = Number(sch.nv) || 0;
  if(x) out.codes.push('SCHAAR_ONMOGELIJK'); if(sx) out.codes.push('ONTERECHT_NIET'); if(nv) out.codes.push('TE_VROEG_KLAAR');
  out.kruis += x + sx;
}
/* welke fout zit er in een tussenstap? */
function stepCode(node, truth, stud){
  if(!stud || !truth) return 'REKENFOUT';
  if(fEq(fAbs(stud), fAbs(truth)) && !fEq(stud, truth)) return node.t === 'neg' && stud.num > 0 ? 'GRONDTAL' : 'TEKENFOUT';
  const pw = node.t === 'neg' ? node.e : node;
  if(pw.t === 'p'){ const b = evalN(pw.b); if(b && fEq(fAbs(stud), fAbs(red({ num:b.num * pw.e, den:b.den })))) return 'MAAL_EXPONENT'; }
  if(pw.t === 'r'){ const x = evalN(pw.e); if(x && fEq(fAbs(stud), fAbs(red({ num:x.num, den:x.den * 2 })))) return 'WORTEL_HELFT'; }
  if(node.t === 'b' && (node.op === '+' || node.op === '-')){
    const a = evalN(node.a), b = evalN(node.b);
    if(a && b && (a.den !== 1 || b.den !== 1)){ const sum = node.op === '+' ? a.num + b.num : a.num - b.num; if(fEq(stud, red({ num:sum, den:a.den + b.den }))) return 'BREUK_OPTELLEN'; }
  }
  for(let k = 1; k <= 3; k++){ const p = Math.pow(10, k);
    if(fEq(stud, red({ num:truth.num * p, den:truth.den })) || fEq(stud, red({ num:truth.num, den:truth.den * p }))) return 'KOMMA_FOUT'; }
  return 'REKENFOUT';
}
/* kruisjes van één regel (voor het dashboard): volgorde, tekenparen, aanpak, schrappen, schaar */
const regelKruis = e => (e.e || []).length + (Number(e.x) || 0) + (e.m || []).reduce((s, m)=>s + (Number(m.x) || 0) + (Number(m.mx) || 0) + (m.sch ? (Number(m.sch.x) || 0) + (Number(m.sch.sx) || 0) : 0), 0);
function gradeVO(q, v){
  const out = { pts:0, codes:[], kruis:0 };
  if(!v.L || !v.L.length) return out;
  const Ls = voLines(q, v), K = Ls.length - 1, total = countOps(voParse(q.expr)) || 1, want = evalN(voParse(q.expr));
  let done = 0, good = 0, orderErr = 0;
  Ls.forEach((ln, k)=>{
    const e = ln.e || {};
    (e.e || []).forEach(x=>{ orderErr++; out.codes.push(VCODE[x.c] || 'V2_LINKS_RECHTS'); });
    const px = Number(e.x) || 0; if(px){ out.codes.push('TEKENPAAR_FOUT'); out.kruis += px; }
    (e.m || []).forEach(m=>{
      schCodes(m.sch, out);
      if(m.x){ out.codes.push('SCHRAP_ONMOGELIJK'); out.kruis += Number(m.x) || 0; }
      if(m.mx){ out.codes.push('TT_ONMOGELIJK'); out.kruis += Number(m.mx) || 0; }
      if(k === K || m.simp) return;                   /* laatste regel: nog niet doorgerekend */
      const node = voFind(ln.ast, m.id); if(!node) return;
      done++;
      const truth = evalN(node), stud = leafVal(voResLeaf(q, m));
      if(fEq(truth, stud)) good++; else out.codes.push(stepCode(node, truth, stud));
    });
  });
  out.kruis += orderErr;
  const last = Ls[K], finished = last.ast.t === 'n' && !((last.e.m || []).length);
  let fin = 0;
  if(finished){ const got = leafVal(last.ast);
    if(fEq(got, want)){ const m = String(last.ast.v).match(/^(\d+)\/(\d+)$/); if(m && gcd(Number(m[1]), Number(m[2])) > 1){ fin = 0.5; out.codes.push('NIET_VEREENVOUDIGD'); } else fin = 1; } }
  else out.codes.push('ONAF');
  const progress = Math.min(1, done / total), orderScore = progress * Math.max(0, 1 - orderErr / 3), stepScore = Math.min(1, good / total);
  out.pts = q.punten * (0.2 * orderScore + 0.5 * stepScore + 0.3 * fin);
  return out;
}
const WSTEP = { h:'haakjes', mw:'machten en wortels', md:'maal en deel', pm:'plus en min' };
function firstKey(ex){
  const a = voNumber(voParse(ex)); let r = null;
  (function w(n){ if(r !== null) return; if(voRedex(n)){ r = n; return; } voKids(n).forEach(w); })(a);
  return { ast:a, node:r };
}
function gradeFirst(q, v, k){
  const out = { pts:0, codes:[], kruis:0 }, ord = Array.isArray(v.ord) ? v.ord : [], order = k && Array.isArray(k.order) ? k.order : [];
  let pos = 0; order.forEach((x, i)=>{ if(ord[i] === x) pos++; });
  if(order.length && ord.length && pos < 4) out.codes.push('WEETJE_STAPPENPLAN');
  let ok = 0;
  q.items.forEach((ex, i)=>{ const K = firstKey(ex), pick = v.pick ? v.pick[i] : null, nd = pick == null ? null : voFind(K.ast, Number(pick));
    if(nd && nd === K.node) ok++; else if(nd) out.codes.push(VCODE[voCode(nd).code] || 'V2_LINKS_RECHTS'); });
  out.pts = q.punten * (0.25 * pos / 4 + 0.75 * ok / q.items.length);
  return out;
}
const sval = o => { if(!o) return null; const t = String(o.n == null ? '' : o.n).trim(); if(!/^\d{1,9}$/.test(t)) return null; return (o.s === '−' || o.s === '-') ? -Number(t) : Number(t); };
const errAns = q => evalN(voParse(q.expr)).num;
function gradeErrvo(q, v, k){
  const out = { pts:0, codes:[], kruis:0 }, ans = errAns(q);
  if(k && k.good){ if(v.choice === k.good) out.pts += q.punten / 2; else if(v.choice) out.codes.push('FOUTENJAGER'); }
  const r = sval(v.res);
  if(r === ans) out.pts += q.punten / 2; else if(r !== null) out.codes.push(Math.abs(r) === Math.abs(ans) ? 'TEKENFOUT' : 'REKENFOUT');
  return out;
}
const VERBETER = { vo:(q, v)=>gradeVO(q, v), first:gradeFirst, errvo:gradeErrvo };

/* ---------- volledig ingevuld? (zoals het oorspronkelijke Oefening.html) ---------- */
const snOK = o => !!o && o.s != null && parseNatStr(o.n) != null;
const VOLLEDIG = {
  vo:(q, v)=>{ if(!v.L || !v.L.length) return false; const Ls = voLines(q, v), cur = Ls[Ls.length - 1]; return cur.ast.t === 'n' && !(cur.e.m || []).length; },
  first:(q, v)=>(v.ord || []).length === 4 && (v.pick || []).length === q.items.length && v.pick.every(x=>x != null),
  errvo:(q, v)=>!!v.choice && snOK(v.res)
};
const LEEG = {
  vo:()=>({ L:[LINE()] }),
  first:q=>({ ord:[], pick:q.items.map(()=>null) }),
  errvo:()=>({ choice:null, res:{ s:null, n:'' } })
};

/* ======================= weergave van de uitdrukkingen (ook in het dashboard en de pdf) ======================= */
const brS = (t, n) => `<span class="br"><span class="br-t">${t}</span><span class="br-n">${n}</span></span>`;
const br = (num, den) => (num < 0 ? '−' : '') + (den === 1 ? `<span class="br-int">${Math.abs(num)}</span>` : brS(Math.abs(num), den));
/* haakjes en vierkante haakjes over de volle hoogte (ook rond breuken) */
const hk = d => `<span class="h7-hk" aria-hidden="true"><svg viewBox="0 0 10 100" preserveAspectRatio="none"><path d="${d}"/></svg></span>`;
const PARL = hk('M8.5 2 Q0.5 50 8.5 98'), PARR = hk('M1.5 2 Q9.5 50 1.5 98'), BRL = hk('M8.5 2 H2.5 V98 H8.5'), BRR = hk('M1.5 2 H7.5 V98 H1.5');
const VPW = (inner, cls) => `<span class="h7-hkw${cls ? ' ' + cls : ''}">${PARL}<span class="h7-hkin">${inner}</span>${PARR}</span>`;
const VBW = (inner, cls) => `<span class="h7-hkw${cls ? ' ' + cls : ''}">${BRL}<span class="h7-hkin">${inner}</span>${BRR}</span>`;
/* wortelteken: de V staat op de schrijflijn, de streep loopt over alles */
const RTV_SVG = '<svg viewBox="0 0 20 100" preserveAspectRatio="none"><path d="M0.5 62 L5 55 L10.5 99 L20 0"/></svg>';
const RTV = `<span class="h7-rtv" aria-hidden="true">${RTV_SVG}</span>`;
const VOP = { '+':'+', '-':'−', '*':'⋅', ':':':' };
const valHTML = v => { const m = String(v).match(/^(\d+)\/(\d+)$/); return m ? brS(m[1], m[2]) : `<span class="h7-num">${esc(v)}</span>`; };
/* ctx: { live, weet, marks:{ id:niveau }, pick:id, sel:{ kind, id }, fresh, fracClick } → { h, par } (par: er staan ronde haakjes in, dan worden de buitenste haakjes [ ]) */
function voH(n, afterOp, ctx, clickId){
  const live = ctx.live;
  const wrapMark = (id, h) => ctx.pick === id ? `<span class="h7-mark h7-pick">${h}</span>` : ctx.marks && ctx.marks[id] ? `<span class="h7-mark lv${ctx.marks[id]}">${h}</span>` : h;
  const selCls = id => ctx.sel && ctx.sel.id === id ? ' sel' : '';
  if(n.t === 'n'){
    const neg = n.s < 0, frac = /\//.test(n.v);
    let sign = '';
    if(neg) sign = live && !ctx.weet && afterOp ? `<button type="button" class="h7-sg${selCls(n.id)}" data-vs="${n.id}" aria-label="teken min">−</button>` : '<span class="h7-sgt">−</span>';
    const fclick = live && ctx.fracClick && frac;
    let h = sign + (fclick ? `<span class="h7-unit h7-fr" role="button" tabindex="0" data-vo="${n.id}" title="Klik om deze breuk te vereenvoudigen">${valHTML(n.v)}</span>` : valHTML(n.v));
    if(ctx.marks && ctx.marks[n.id]) h = `<span class="h7-mark lv${ctx.marks[n.id]}">${h}</span>`;
    const cls = 'h7-leaf' + ((n.nw && ctx.fresh) || (n.pm && ctx.fresh === 'pm') ? ' h7-nieuw' : '');
    if(neg && afterOp) return { h:`<span class="${cls}">${VPW(h)}</span>`, par:true };
    return { h:`<span class="${cls}">${h}</span>`, par:false };
  }
  if(n.t === 'b'){
    const L = voH(n.a, afterOp, ctx), R = voH(n.b, true, ctx), sym = VOP[n.op];
    const op = live ? `<button type="button" class="h7-op${selCls(n.id)}${n.pm && ctx.fresh === 'pm' ? ' pop' : ''}" data-vo="${n.id}" aria-label="bewerking ${sym}">${sym}</button>` : `<span class="h7-opt">${sym}</span>`;
    return { h:wrapMark(n.id, L.h + op + R.h), par:L.par || R.par };
  }
  if(n.t === 'g'){ const I = voH(n.e, false, ctx); return { h:I.par ? VBW(I.h, 'h7-grp') : VPW(I.h, 'h7-grp'), par:true }; }
  if(n.t === 'p' || n.t === 'r' || n.t === 'neg'){
    const unitId = clickId != null ? clickId : n.id;
    let inner, par = false, wholeClick;
    if(n.t === 'neg'){
      const I = voH(n.e, false, ctx, n.id);
      inner = '<span class="h7-sgt">−</span>' + I.h; par = I.par;
      wholeClick = voLeaf(voKids(n.e)[0]);
      const out = wrapMark(n.id, live && wholeClick ? `<span class="h7-unit" role="button" tabindex="0" data-vo="${n.id}">${inner}</span>` : inner);
      return afterOp ? { h:VPW(out), par:true } : { h:out, par };
    }
    if(n.t === 'p'){
      const b = n.b, B = voH(b, false, ctx); let bh;
      if(b.t === 'n'){ par = b.s < 0 || /\//.test(b.v); bh = par ? VPW(B.h) : B.h; }
      else { bh = B.h; par = true; }
      wholeClick = b.t === 'n' && !(ctx.fracClick && /\//.test(b.v));   /* breuk als grondtal: klik de exponent */
      const expH = live && !wholeClick && clickId == null ? `<button type="button" class="h7-exp" data-vo="${unitId}" aria-label="macht">${n.e}</button>` : String(n.e);
      inner = `<span class="h7-pw">${bh}<sup>${expH}</sup></span>`;
    } else {
      const I = voH(n.e, false, ctx); par = I.par;
      wholeClick = voLeaf(n.e);
      const w = live && !wholeClick && clickId == null ? `<span class="h7-rtv h7-rtklik" role="button" tabindex="0" data-vo="${unitId}" aria-label="wortel">${RTV_SVG}</span>` : RTV;
      inner = `<span class="h7-rt">${w}<span class="h7-rtin">${I.h}</span></span>`;
    }
    if(clickId != null) return { h:inner, par };             /* deel van −macht of −wortel */
    return { h:wrapMark(n.id, live && wholeClick ? `<span class="h7-unit" role="button" tabindex="0" data-vo="${n.id}">${inner}</span>` : inner), par };
  }
  return { h:'', par:false };
}
const voHTML = (n, ctx) => '<span class="h7-expr">' + voH(n, false, ctx || {}).h + '</span>';
const voStatic = expr => voHTML(voNumber(voParse(expr)), {});
const marksVan = ln => { const marks = {}; (ln.e.m || []).forEach(m=>{ const nd = voFind(ln.ast, m.id); if(nd) marks[m.id] = m.simp ? 'S' : voLevel(nd); }); return marks; };
const notitie = q => `<div class="h7-schrift"><div class="h7-snaam">✏️ Schrift van ${esc(q.who)}</div><div class="h7-slijn"><span class="h7-sis"></span>${voStatic(q.expr)}</div>`
  + q.lines.map(l=>`<div class="h7-slijn"><span class="h7-sis">=</span>${voStatic(l)}</div>`).join('') + '<div class="h7-stempel">?</div></div>';

/* ---------- een volledig juiste oplossing (voor de sleutel en de tests) ---------- */
const vereenvoudig = b => { const g = gcd(b.num, b.den), st = SCH(); if(b.den > 1 && g > 1){ st.mode = 'cut'; st.cuts = [g]; } else st.mode = 'skip'; st.done = true; st.for = sigOf(b); return st; };
function vulMark(q, nd){
  const W = evalN(nd), s = W.num < 0 ? '−' : '+', A = Math.abs(W.num);
  if(voFracOp(q, nd)){
    const m = { id:nd.id, fo:nd.op === '*' ? 'mul' : 'div', method:nd.op === ':' ? 'om' : null, flip:nd.op === ':', cuts:[], cutsFor:'', x:0, mx:0 };
    const S = mState(voFs(nd), m), t = S.T.reduce((a, x)=>a * x, 1), n = S.N.reduce((a, x)=>a * x, 1);
    return Object.assign(m, { r:{ s, n:String(t), d:String(n) }, sch:vereenvoudig({ num:t, den:n }) });
  }
  if(q.kind === 'dec') return { id:nd.id, r:{ s, n:decTxt(fAbs(W)) }, sch:SCH() };
  if(q.kind === 'frac') return { id:nd.id, r:{ s, n:String(A), d:W.den === 1 ? '' : String(W.den) }, sch:W.den === 1 ? SCH() : vereenvoudig({ num:A, den:W.den }) };
  return { id:nd.id, r:{ s, n:String(A) }, sch:SCH() };
}
function voorbeeldVO(q){
  const v = { L:[LINE()] };
  for(let g = 0; g < 40; g++){
    const K = v.L.length - 1, e = v.L[K], ast = voLines(q, v)[K].ast;
    if(ast.t === 'n') break;
    (function w(n){ const l = voPairLeaf(n); if(l) e.p.push([n.id, l.id]); voKids(n).forEach(w); })(ast);
    const na = voLines(q, v)[K].ast, marks = [];
    (function w(n){ if(voRedex(n)){ marks.push(n); return; } voKids(n).forEach(w); })(na);
    e.m = marks.map(nd=>vulMark(q, nd));
    v.L.push(LINE());
  }
  return v;
}

/* ---------- lezen: dashboard, pdf, resultaat van de leerling ---------- */
function toon(q, a, modus, k){
  let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){}
  const blanco = modus === 'blanco', sl = modus === 'sleutel';
  if(modus === 'lezen' && !v) return '<p class="tl-niet">Niet ingevuld.</p>';
  if(!v || blanco || sl) v = LEEG[q.soort](q);
  const lijn = (l, r) => `<div class="tl"><span class="tl-l">${l}</span><span class="tl-r">${r}</span></div>`;
  const kr = x => !sl && !blanco && x ? ` <span class="tl-kruis">✕ ${x}</span>` : '';
  switch(q.soort){
    case 'vo': {
      if(blanco) return '<div class="rv-lees h7-lees">' + lijn('', voStatic(q.expr)) + lijn('=', leeg) + lijn('=', leeg) + '</div>';
      const w = sl ? voorbeeldVO(q) : v, Ls = voLines(q, w), K = Ls.length - 1, af = VOLLEDIG.vo(q, w);
      return '<div class="rv-lees h7-lees">' + ((w.L[0].p || []).length ? lijn('', voStatic(q.expr)) : '') + Ls.map((ln, i)=>i === K && !af && !(ln.e.m || []).length && i > 0 ? ''
        : lijn(i || (w.L[0].p || []).length ? '=' : '', voHTML(ln.ast, { marks:marksVan(ln) }) + kr(regelKruis(ln.e)))).join('') + (af ? '' : lijn('', '<i>niet afgewerkt</i>')) + '</div>';
    }
    case 'first': {
      const ord = sl ? (k && k.order) || [] : v.ord || [];
      return '<div class="rv-lees h7-lees">' + lijn('Stappenplan:', ord.length ? esc(ord.map(x=>WSTEP[x] || x).join(' → ')) : sl ? '(volgens de sleutel)' : leeg)
        + q.items.map((ex, i)=>{ const K = firstKey(ex), pick = sl ? K.node.id : blanco ? null : v.pick[i];
          return lijn('abcdefgh'[i] + ')', voHTML(K.ast, { pick:pick == null ? null : Number(pick) }) + (!sl && !blanco && pick == null ? ' ' + leeg : '')); }).join('') + '</div>';
    }
    case 'errvo': {
      const opt = id => { const o = q.options.find(x=>x.id === id); return o ? esc(id.toUpperCase()) + ') ' + esc(o.text) : leeg; };
      const r = sval(v.res);
      return '<div class="rv-lees">' + notitie(q) + lijn('Fout:', sl ? (k && k.good ? opt(k.good) : leeg) : blanco || !v.choice ? leeg : opt(v.choice))
        + lijn(voStatic(q.expr) + ' =', sl ? esc(fmt(errAns(q))) : blanco || r === null ? leeg : esc(fmt(r))) + '</div>';
    }
  }
  return '';
}

/* ======================= invullen: de interactieve oefeningen ======================= */
const TYPEN = {};
Object.keys(LEEG).forEach(s=>{ TYPEN[s] = { leeg:LEEG[s], volledig:VOLLEDIG[s], uitleg:()=>UITLEG[s] }; });
const RV = () => window.RV;
const werk = (c, cls) => c.root.querySelector('.rv-werk').classList.add(...cls.split(' '));
const opInvoer = (c, f) => { c.ant.oninput = c.vis.oninput = f; };
const kruisje = knop => { knop.classList.remove('br-schud'); void knop.offsetWidth; knop.classList.add('br-schud', 'fout'); knop.insertAdjacentHTML('beforeend', '<i class="rv-kruis" aria-hidden="true">✕</i>'); };
const schud = el => { el.classList.remove('br-schud'); void el.offsetWidth; el.classList.add('br-schud'); };
const TIP_TEKEN = '<p class="rv-tip">Toestandsteken: kies <b>+</b> of <b>−</b> in het vakje vóór je uitkomst.</p>';
const TIP_BREUK = '<p class="rv-tip">Is de uitkomst een geheel getal? Laat de noemer dan leeg. Staat er een breuk, kies dan naast de breuk: <b>✂ vereenvoudigen</b> of <b>✓ kan niet eenvoudiger</b>.</p>';
const LADDER = [['Haakjes', 'wat tussen haakjes of onder het wortelteken staat'], ['Machten en wortels', ''], ['Maal en deel', 'van links naar rechts'], ['Plus en min', 'van links naar rechts']];
const ladderHTML = () => '<div class="h7-ladder"><span class="h7-ltitel">Stappenplan</span>' + LADDER.map((r, i)=>(i ? '<span class="h7-lpijl">→</span>' : '')
  + `<span class="h7-trede lv${i + 1}"><b>${'①②③④'[i]}</b> ${r[0]}${r[1] ? ` <small>${r[1]}</small>` : ''}</span>`).join('') + '</div>';
/* breukvak met tekenvak, teller en noemer (de noemer leeg laten = geheel getal) */
const fracVeld = (p, o) => `<span class="rv-term br-veld">${RV().teken(p + '.s', o.s, 'toestandsteken van de uitkomst', true)}<span class="br br-in"><span class="br-t">${RV().getal(p + '.n', o.n, 'nat', 'br-get', 'teller')}</span><span class="br-n">${RV().getal(p + '.d', o.d, 'nat', 'br-get', 'noemer')}</span></span></span>`;
const mOf = (w, p) => { const x = p.split('.'), e = w.L[+x[1]]; return e && e.m[+x[3]]; };
const mNode = (q, w, p) => { const x = p.split('.'), ln = voLines(q, w)[+x[1]], m = mOf(w, p); return ln && m ? voFind(ln.ast, m.id) : null; };
const voCur = (q, w) => { const Ls = voLines(q, w); return { ast:Ls[Ls.length - 1].ast, e:w.L[w.L.length - 1], K:Ls.length - 1 }; };

/* ---------- breuk maal of gedeeld door breuk: aanpak, omkeren, schrappen (zoals hoofdstuk 5) ---------- */
const KLEUR = ['#e65100', '#6a1b9a', '#00838f', '#c2185b', '#2e7d32', '#1565c0', '#8d6e63'];
function foBreuk(c, p, S, i, sel){
  const ui = c.ui, kl = ci => KLEUR[ci % KLEUR.length], vers = ui.versCut && ui.versCut.k === p ? ui.versCut.ci : null;
  const oud = h => `<s style="text-decoration-color:${kl(h.ci)}">${h.v}</s>`;
  const nu = (w, ci) => `<b class="h7-nu${vers != null && ci === vers ? ' vers' : ''}"${ci != null ? ` style="color:${kl(ci)}"` : ''}>${w}</b>`;
  return `<span class="h7-sbr${S.g[i].flipped ? ' omg' : ''}${ui.flipAnim === p && i === 1 ? ' flipin' : ''}">`
    + `<button type="button" class="h7-chip t${sel.t === i ? ' sel' : ''}" data-sc="t" data-i="${i}" data-mk="${p}" aria-label="teller ${S.T[i]}" aria-pressed="${sel.t === i}">${S.Th[i].map(oud).join('')}${nu(S.T[i], S.Tc[i])}</button>`
    + '<span class="h7-sbar"></span>'
    + `<button type="button" class="h7-chip n${sel.n === i ? ' sel' : ''}" data-sc="n" data-i="${i}" data-mk="${p}" aria-label="noemer ${S.N[i]}" aria-pressed="${sel.n === i}">${S.Nh[i].map(oud).join('')}${nu(S.N[i], S.Nc[i])}</button></span>`;
}
const maalKol = () => '<span class="h7-maal"><span>⋅</span><span class="h7-mgap"></span><span>⋅</span></span>';
function foRij(c, p, m, S, klik){
  const ui = c.ui, sel = ui.msel && ui.msel.q === c.q.id && ui.msel.k === p ? ui.msel : { t:null, n:null }, deel = m.fo === 'div';
  return `<span class="h7-swrap" data-swrap="${p}">` + S.g.map((f, i)=>{
    let h = '';
    if(i > 0){
      if(deel && m.method === 'om' && f.flipped) h += maalKol();
      else if(deel && m.method === 'om') h += `<button type="button" class="h7-deel" data-flip="${p}" title="Delen door een breuk = vermenigvuldigen met het omgekeerde">:</button>`;
      else if(!klik) h += `<span class="h7-fop">${f.op === ':' ? ':' : '⋅'}</span>`;
      else h += maalKol();
    }
    const lijf = klik ? foBreuk(c, p, S, i, sel) : `<span class="h7-sbr vast"><span class="h7-chip">${f.num}</span><span class="h7-sbar"></span><span class="h7-chip">${f.den}</span></span>`;
    const sg = f.neg ? '<span class="h7-fsg">−</span>' : '';
    return h + (i > 0 && f.neg ? `<span class="h7-haak">(</span>${sg}${lijf}<span class="h7-haak">)</span>` : sg + lijf);
  }).join('') + '<svg class="h7-lijnen" aria-hidden="true"></svg></span>';
}
function foHTML(c, p, m, nd){
  const { q, ui } = c, B = RV().br, S = mState(voFs(nd), m), deel = m.fo === 'div', basis = voFracBase(m), r = [];
  const sel = ui.msel && ui.msel.q === q.id && ui.msel.k === p ? ui.msel : null;
  if(deel) r.push('<div class="h7-aanpak"><span class="h7-apl">Aanpak:</span>'
    + `<button type="button" class="h7-ap${m.method === 'td' ? ' aan' : ''}" data-meth="td" data-mk="${p}" aria-pressed="${m.method === 'td'}">teller : teller<br>en noemer : noemer</button>`
    + `<button type="button" class="h7-ap${m.method === 'om' ? ' aan' : ''}" data-meth="om" data-mk="${p}" aria-pressed="${m.method === 'om'}">maal het<br>omgekeerde</button>`
    + (ui.tdFail === p ? '<span class="h7-let">✕ Dat gaat niet op: niet alle delingen geven een natuurlijk getal. Vermenigvuldig met het omgekeerde.</span>' : '') + '</div>');
  if(deel && m.method === 'td'){
    const A = S.g[0], Bf = S.g[1];
    r.push(`<div class="h7-frij"><span class="h7-is">=</span>${RV().teken(p + '.r.s', m.r.s, 'toestandsteken van de uitkomst', true)}<span class="h7-tdbr"><span class="h7-tdrij"><span class="h7-tdl">${A.num} : ${Bf.num} =</span>${RV().getal(p + '.r.n', m.r.n, 'nat', 'br-get', 'teller')}</span><span class="h7-tdbar"></span>`
      + `<span class="h7-tdrij"><span class="h7-tdl">${A.den} : ${Bf.den} =</span>${RV().getal(p + '.r.d', m.r.d, 'nat', 'br-get', 'noemer')}</span></span>${B.keuze(p + '.sch', basis, m.sch)}</div>`);
  } else if(!deel || m.method === 'om'){
    const klik = S.allFlipped;
    r.push(`<div class="h7-frij h7-brij">${foRij(c, p, m, S, klik)}</div>`);
    if(klik){
      const terug = deel ? `<button type="button" class="br-kn terug" data-flip="${p}" title="Omkeren ongedaan maken">↶ niet omkeren</button>` : '';
      r.push(sel && sel.t != null && sel.n != null
        ? `<div class="h7-mcut">Deel <b>${S.T[sel.t]}</b> en <b>${S.N[sel.n]}</b> door <input class="rv-getal h7-deler" type="text" inputmode="numeric" autocomplete="off" data-deler="${p}" aria-label="deler"> <button type="button" class="br-kn" data-schrap="${p}">✂ Schrap</button> <button type="button" class="br-kn terug" data-annuleer="${p}">annuleer</button></div>`
        : S.ok.length || terug ? '<div class="h7-legende">' + S.ok.map(cut=>{ const kl = KLEUR[cut.ci % KLEUR.length];
          return `<span class="h7-lg" style="border-color:${kl};color:${kl}"><b>${S.Th[cut.t].find(h=>h.ci === cut.ci).v}</b> en <b>${S.Nh[cut.n].find(h=>h.ci === cut.ci).v}</b> : <b>${cut.d}</b>${cut.t !== cut.n ? ' <i>(diagonaal)</i>' : ''}</span>`; }).join('')
          + (S.ok.length ? `<button type="button" class="br-kn terug" data-cutundo="${p}" title="Laatste schrap ongedaan maken">↶</button>` : '') + terug + (S.ok.length ? '' : '<span class="rv-tip h7-ktip">Schrappen: klik een <b>teller</b> en een <b>noemer</b> (ook diagonaal).</span>') + '</div>'
        : '<p class="rv-tip h7-ktip">Schrappen: klik een <b>teller</b> en een <b>noemer</b> (ook diagonaal) die je door hetzelfde getal kan delen.</p>');
      r.push(`<div class="h7-frij"><span class="h7-is">=</span>${fracVeld(p + '.r', m.r)}${B.keuze(p + '.sch', basis, m.sch)}</div>`);
    } else r.push('<p class="rv-tip h7-ktip">Klik op het deelteken <b>:</b> : de breuk erna keert om en je mag vermenigvuldigen.</p>');
  } else r.push('<p class="rv-tip h7-ktip">Kies eerst je aanpak.</p>');
  return `<div class="h7-fo">${r.join('')}</div>`;
}
function foLijnen(c){
  const w = c.huidig();
  c.ant.querySelectorAll('[data-swrap]').forEach(wrap=>{
    const p = wrap.dataset.swrap, svg = wrap.querySelector('.h7-lijnen'), m = mOf(w, p), nd = mNode(c.q, w, p);
    if(!svg || !m || !nd) return;
    const S = mState(voFs(nd), m), W = wrap.getBoundingClientRect();
    svg.setAttribute('width', W.width); svg.setAttribute('height', W.height); svg.setAttribute('viewBox', `0 0 ${W.width} ${W.height}`);
    const pos = (k, i) => { const el = wrap.querySelector(`[data-sc="${k}"][data-i="${i}"]`); if(!el) return null; const r = el.getBoundingClientRect(); return { x:r.left - W.left + r.width / 2, y:r.top - W.top + r.height / 2 }; };
    let h = '';
    S.ok.forEach(cut=>{ const a = pos('t', cut.t), b = pos('n', cut.n); const vers = c.ui.versCut && c.ui.versCut.k === p && c.ui.versCut.ci === cut.ci;
      if(a && b) h += `<line class="h7-lijn${vers ? ' vers' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${KLEUR[cut.ci % KLEUR.length]}"/>`; });
    const sel = c.ui.msel && c.ui.msel.q === c.q.id && c.ui.msel.k === p ? c.ui.msel : null;
    if(sel && sel.t != null && sel.n != null){ const a = pos('t', sel.t), b = pos('n', sel.n); if(a && b) h += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#b77900" stroke-width="3" stroke-dasharray="6 5"/>`; }
    svg.innerHTML = h;
  });
}
function foBind(c){
  const { q, ui } = c, R = c.ant;
  R.querySelectorAll('[data-meth][data-mk]').forEach(b=>b.onclick = ()=>{
    if(ui.vbusy) return;
    const p = b.dataset.mk, meth = b.dataset.meth, w = c.huidig(), m = mOf(w, p), nd = mNode(q, w, p);
    if(!m || !nd || m.method === meth) return;
    if(meth === 'td'){ const [A, Bf] = voFs(nd);
      if(!(A.num % Bf.num === 0 && A.den % Bf.den === 0)){ m.mx = (m.mx || 0) + 1; c.bewaar(w); ui.tdFail = p; ui.vbusy = true; c.bezig(true); kruisje(b);
        setTimeout(()=>{ ui.vbusy = false; c.bezig(false); if(c.nogHier()) c.teken(); }, 900); return; } }
    ui.tdFail = null; ui.msel = null;
    Object.assign(m, { method:meth, flip:false, cuts:[], cutsFor:'', r:emptyRes(q), sch:SCH() }); c.bewaar(w); c.teken(); });
  R.querySelectorAll('[data-flip]').forEach(b=>b.onclick = ()=>{ const p = b.dataset.flip, w = c.huidig(), m = mOf(w, p); if(!m) return;
    m.flip = !m.flip; m.cuts = []; m.cutsFor = ''; c.bewaar(w); ui.flipAnim = m.flip ? p : null; ui.msel = null; c.teken(); ui.flipAnim = null; });
  R.querySelectorAll('[data-sc][data-mk]').forEach(b=>b.onclick = ()=>{ if(ui.vbusy) return;
    const p = b.dataset.mk, s = ui.msel && ui.msel.q === q.id && ui.msel.k === p ? ui.msel : { q:q.id, k:p, t:null, n:null }, k = b.dataset.sc, i = +b.dataset.i;
    s[k] = s[k] === i ? null : i; ui.msel = s; c.teken(); const inp = R.querySelector(`[data-deler="${p}"]`); if(inp) inp.focus(); });
  R.querySelectorAll('[data-schrap]').forEach(go=>{
    const p = go.dataset.schrap, inp = R.querySelector(`[data-deler="${p}"]`);
    const schrap = ()=>{ if(ui.vbusy) return; const d = RV().nat(inp.value), w = c.huidig(), m = mOf(w, p), nd = mNode(q, w, p), s = ui.msel;
      if(!m || !nd || !s) return;
      if(d == null || d < 2){ inp.classList.add('rv-ongeldig'); inp.focus(); return; }
      const S = mState(voFs(nd), m);
      if(S.T[s.t] % d === 0 && S.N[s.n] % d === 0){
        m.cuts = (m.cutsFor === S.sig ? m.cuts || [] : []).concat([{ t:s.t, n:s.n, d }]); m.cutsFor = S.sig; c.bewaar(w); ui.msel = null; ui.versCut = { k:p, ci:m.cuts.length - 1 }; c.teken(); ui.versCut = null;
      } else { m.x = (m.x || 0) + 1; c.bewaar(w); ui.vbusy = true; c.bezig(true); kruisje(go);
        setTimeout(()=>{ ui.vbusy = false; c.bezig(false); ui.msel = null; if(c.nogHier()) c.teken(); }, 950); } };
    go.onclick = schrap;
    inp.oninput = e=>{ e.stopPropagation(); inp.classList.remove('rv-ongeldig'); };
    inp.onkeydown = e=>{ if(e.key === 'Enter') schrap(); };
  });
  R.querySelectorAll('[data-annuleer]').forEach(b=>b.onclick = ()=>{ ui.msel = null; c.teken(); });
  R.querySelectorAll('[data-cutundo]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(), m = mOf(w, b.dataset.cutundo); if(m && m.cuts){ m.cuts.pop(); c.bewaar(w); c.teken(); } });
  requestAnimationFrame(()=>{ if(c.nogHier()) foLijnen(c); });
}

/* ---------- rekenen regel per regel ---------- */
function kaart(c, cur, K, m, i){
  const { q, ui } = c, B = RV().br, nd = voFind(cur.ast, m.id); if(!nd) return '';
  const p = `L.${K}.m.${i}`, nieuw = ui.vnewMark === m.id ? ' nieuw' : '';
  if(m.simp) return `<div class="h7-kaart lvS${nieuw}"><div class="h7-kkop"><span class="h7-expr">${nd.s < 0 ? '<span class="h7-sgt">−</span>' : ''}${valHTML(nd.v)}</span><span class="h7-klab">vereenvoudigen</span>`
    + `<button type="button" class="h7-kweg" data-simpx="${i}" title="Toch niet vereenvoudigen" aria-label="toch niet vereenvoudigen">✕</button></div><div class="h7-krij">${B.keuze(p + '.sch', voSimpBase(m), m.sch)}</div></div>`;
  if(m.fo) return `<div class="h7-kaart lv${voLevel(nd)}${nieuw}"><div class="h7-kkop">${voHTML(nd, {})}</div>${foHTML(c, p, m, nd)}</div>`;
  const veld = q.kind === 'frac' && !voIntOnly(nd) ? fracVeld(p + '.r', m.r) + B.keuze(p + '.sch', voFracBase(m), m.sch)
    : `<span class="rv-term">${RV().teken(p + '.r.s', m.r.s, 'toestandsteken van de uitkomst', true)}${RV().getal(p + '.r.n', m.r.n, q.kind === 'dec' ? 'dec' : 'nat', '', 'uitkomst')}</span>`;
  return `<div class="h7-kaart lv${voLevel(nd)}${nieuw}"><div class="h7-kkop">${voHTML(nd, {})}<span class="h7-is">=</span>${veld}</div></div>`;
}
const schaarPad = p => /^L\.\d+\.m\.\d+\.sch$/.test(p);
const basisVan = (w, p) => { if(!schaarPad(p)) return null; const m = mOf(w, p); return !m ? null : m.simp ? voSimpBase(m) : voFracBase(m); };
TYPEN.vo.teken = c=>{
  const { q, v, ui } = c, B = RV().br;
  werk(c, 'h7-vowerk');
  const Ls = voLines(q, v), K = Ls.length - 1, cur = Ls[K], klaar = cur.ast.t === 'n', vsel = ui.vsel && ui.vsel.q === q.id ? ui.vsel : null;
  const lijnen = Ls.map((ln, idx)=>{ const nu = idx === K;
    const ctx = { live:nu && !klaar, fracClick:q.kind === 'frac', marks:marksVan(ln), sel:nu ? vsel : null, fresh:nu ? ui.vfresh : false };
    return `<div class="h7-lijn${nu ? ' nu' : ''}${nu && ui.vfresh === true ? ' in' : ''}"><span class="h7-is">${idx ? '=' : ''}</span>${voHTML(ln.ast, ctx)}</div>`; }).join('');
  const panelen = cur.e.m.map((m, i)=>{ const p = `L.${K}.m.${i}.sch`, b = basisVan(v, p); return m.sch ? B.paneel(p, b, m.sch, c, true) : ''; }).join('');
  c.vis.innerHTML = ladderHTML() + `<div class="h7-blad">${lijnen}</div><div class="h7-melding" role="status"></div>` + panelen;
  const kaarten = cur.e.m.map((m, i)=>({ m, i })).sort((a, b)=>a.m.id - b.m.id).map(({ m, i })=>kaart(c, cur, K, m, i)).join('');
  const kan = voAllDone(q, cur.e), breukKaart = q.kind === 'frac' && cur.e.m.some(m=>{ const nd = voFind(cur.ast, m.id); return !m.simp && nd && !voIntOnly(nd); });
  let staart = '';
  if(klaar) staart = '<p class="h7-af">Je bent klaar met deze oefening. Wil je toch iets aanpassen? Klik op <b>↶ Regel terug</b>.</p>';
  else if(vsel) staart = '<p class="rv-tip h7-hint">Tekenpaar: klik nu het tweede teken aan.</p>';
  else if(!cur.e.m.length) staart = `<p class="rv-tip h7-hint">Klik in de opgave de bewerking aan die je eerst doet.${q.kind === 'frac' ? ' Wil je eerst een breuk vereenvoudigen? Klik dan op die breuk.' : ''}</p>`;
  c.ant.innerHTML = (kaarten ? `<div class="h7-kaarten">${kaarten}</div>` : '') + staart
    + `<div class="h7-knoppen">${klaar ? '' : `<button type="button" class="btn h7-volg"${kan ? '' : ' disabled'}>↓ Volgende regel</button>`}${K > 0 ? '<button type="button" class="btn ghost h7-terug">↶ Regel terug</button>' : ''}</div>`
    + (kaarten ? (breukKaart ? TIP_BREUK : TIP_TEKEN) : '');
  const blad = c.vis.querySelector('.h7-blad'); blad.scrollTop = blad.scrollHeight;
  /* de kaartjes houden hun scrollpositie bij het opnieuw tekenen; een nieuw kaartje komt in beeld */
  if(ui.antQ === q.id && ui.antK === K) c.ant.scrollTop = ui.antTop || 0;
  c.ant.onscroll = ()=>{ ui.antQ = q.id; ui.antK = K; ui.antTop = c.ant.scrollTop; };
  if(ui.vnewMark != null){ const nk = c.ant.querySelector('.h7-kaart.nieuw'); if(nk) nk.scrollIntoView({ block:'nearest' }); }
  /* kliks in de opgave */
  c.vis.querySelectorAll('.h7-lijn.nu [data-vo]').forEach(el=>{
    el.onclick = ev=>{ ev.stopPropagation(); voKlik(c, Number(el.dataset.vo), el); };
    el.onkeydown = ev=>{ if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); el.click(); } };
  });
  c.vis.querySelectorAll('.h7-lijn.nu [data-vs]').forEach(el=>el.onclick = ev=>{ ev.stopPropagation(); voTeken(c, Number(el.dataset.vs)); });
  const volg = c.ant.querySelector('.h7-volg');
  if(volg) volg.onclick = ()=>{ if(ui.vbusy) return; const w = c.huidig(); if(!voAllDone(q, w.L[w.L.length - 1])) return;
    w.L.push(LINE()); c.bewaar(w); ui.vsel = null; ui.msel = null; ui.vfresh = true; c.teken(); ui.vfresh = false; };
  const terug = c.ant.querySelector('.h7-terug');
  if(terug) terug.onclick = ()=>{ if(ui.vbusy) return; const w = c.huidig(); if(w.L.length > 1){ w.L.pop(); c.bewaar(w); ui.vsel = null; ui.msel = null; c.teken(); } };
  c.ant.querySelectorAll('[data-simpx]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(); w.L[w.L.length - 1].m.splice(+b.dataset.simpx, 1); c.bewaar(w); c.teken(); });
  foBind(c);
  B.bind(c, basisVan);
  const volgKan = ()=>{ const b = c.ant.querySelector('.h7-volg'); if(b){ const w = c.huidig(); b.disabled = !voAllDone(q, w.L[w.L.length - 1]); } };
  opInvoer(c, ()=>{ B.ververs(c, basisVan); volgKan(); });
};
/* een bewerking, een macht, een wortel of een breuk in de opgave aanklikken */
function voKlik(c, id, el){
  const { q, ui } = c; if(ui.vbusy) return;
  const w = c.huidig(), C = voCur(q, w), node = voFind(C.ast, id); if(!node) return;
  if(ui.vsel && ui.vsel.q === q.id){
    if(ui.vsel.kind === 'sign'){ voPaar(c, id, ui.vsel.id); return; }
    if(ui.vsel.id === id){ ui.vsel = null; c.teken(); return; }
    ui.vsel = null;
  }
  const mi = C.e.m.findIndex(m=>m.id === id);
  if(mi >= 0){ C.e.m.splice(mi, 1); c.bewaar(w); c.teken(); return; }
  if(node.t === 'n'){                       /* een breuk aanklikken = vereenvoudigen */
    if(!(q.kind === 'frac' && /\//.test(node.v))) return;
    if(C.e.m.some(m=>{ const nd = voFind(C.ast, m.id); return nd && nd !== node && voContains(nd, id); })){ schud(el); return; }
    C.e.m.push({ id, simp:true, v:node.v, sch:Object.assign(SCH(), { mode:'cut' }) }); c.bewaar(w); ui.vnewMark = id; c.teken(); ui.vnewMark = null;
    const g = c.root.querySelector(`[data-schgetal="L.${C.K}.m.${C.e.m.length - 1}.sch"]`); if(g) g.focus();
    return;
  }
  if(voPairLeaf(node)){ ui.vsel = { q:q.id, kind:'op', id }; c.teken(); return; }
  if(voRedex(node)){
    C.e.m = C.e.m.filter(m=>!(m.simp && voContains(node, m.id)));
    C.e.m.push(Object.assign({ id, r:emptyRes(q), sch:SCH() }, voFracOp(q, node) ? { fo:node.op === '*' ? 'mul' : 'div', method:null, flip:false, cuts:[], cutsFor:'', x:0, mx:0 } : {}));
    c.bewaar(w); ui.vnewMark = id; c.teken(); ui.vnewMark = null;
    const f = c.root.querySelector(`[data-teken="L.${C.K}.m.${C.e.m.length - 1}.r.s"] [data-w="+"]`); if(f) f.focus();
    return;
  }
  /* volgorde klopt niet → rood kruisje met foutcode (bewaard) */
  const cd = voCode(node);
  C.e.e.push({ c:cd.code, n:id }); c.bewaar(w);
  ui.vbusy = true; c.bezig(true);
  el.classList.add('fout'); el.insertAdjacentHTML('beforeend', '<i class="rv-kruis" aria-hidden="true">✕</i>');
  const mel = c.vis.querySelector('.h7-melding'); if(mel) mel.innerHTML = `<span class="h7-code"><b>${cd.code}</b> · ${esc(cd.why)}</span>`;
  setTimeout(()=>{ ui.vbusy = false; c.bezig(false); if(c.nogHier()) c.teken(); }, 1900);
}
/* het teken van een negatief getal tussen haakjes aanklikken (tekenpaar) */
function voTeken(c, leafId){
  const { q, ui } = c; if(ui.vbusy) return;
  if(ui.vsel && ui.vsel.q === q.id){
    if(ui.vsel.kind === 'op'){ voPaar(c, ui.vsel.id, leafId); return; }
    if(ui.vsel.id === leafId){ ui.vsel = null; c.teken(); return; }
  }
  ui.vsel = { q:q.id, kind:'sign', id:leafId }; c.teken();
}
function voPaar(c, opId, leafId){
  const { q, ui } = c, w = c.huidig(), C = voCur(q, w), op = voFind(C.ast, opId), lf = voFind(C.ast, leafId);
  const b1 = c.vis.querySelector(`.h7-lijn.nu [data-vo="${opId}"]`), b2 = c.vis.querySelector(`.h7-lijn.nu [data-vs="${leafId}"]`);
  ui.vbusy = true; c.bezig(true);
  if(op && lf && voPairLeaf(op) === lf){
    if(b2) b2.classList.add('verdwijn'); if(b1) b1.classList.add('samen');
    setTimeout(()=>{
      const w2 = c.huidig(), C2 = voCur(q, w2);
      C2.e.p.push([opId, leafId]);
      C2.e.m = C2.e.m.filter(m=>{ if(m.simp) return true; const nd = voFind(C2.ast, m.id); return !(nd && voContains(nd, leafId)); });
      c.bewaar(w2); ui.vsel = null; ui.vbusy = false; c.bezig(false); ui.vfresh = 'pm'; if(c.nogHier()) c.teken(); ui.vfresh = false;
    }, 380);
  } else {
    C.e.x = (C.e.x || 0) + 1; c.bewaar(w);
    [b1, b2].forEach(b=>{ if(b){ b.classList.add('fout'); b.insertAdjacentHTML('beforeend', '<i class="rv-kruis" aria-hidden="true">✕</i>'); } });
    const mel = c.vis.querySelector('.h7-melding'); if(mel) mel.innerHTML = '<span class="h7-code">Deze twee tekens vormen geen tekenpaar.</span>';
    setTimeout(()=>{ ui.vsel = null; ui.vbusy = false; c.bezig(false); if(c.nogHier()) c.teken(); }, 950);
  }
}

/* ---------- weetjes: het stappenplan en wat eerst? ---------- */
const WLAD = [['pm', 'Plus en min, van links naar rechts'], ['md', 'Maal en deel, van links naar rechts'], ['h', 'Haakjes'], ['mw', 'Machten en wortels']];
TYPEN.first.teken = c=>{
  const { q, v } = c;
  werk(c, 'stapel h7-weetwerk');
  c.vis.innerHTML = '<h3>① Het stappenplan: wat doe je eerst, wat daarna?</h3><p class="rv-tip">Klik de vier stappen aan in de juiste volgorde. Nog eens klikken = weghalen.</p>'
    + '<div class="h7-wlad">' + WLAD.map(([k, t])=>{ const i = v.ord.indexOf(k);
      return `<button type="button" class="h7-wstap${i >= 0 ? ' aan' : ''}" data-wk="${k}" aria-pressed="${i >= 0}"><span class="h7-wnr">${i >= 0 ? i + 1 : ''}</span>${t}</button>`; }).join('') + '</div>';
  c.ant.innerHTML = '<h3>② Welke bewerking doe je als eerste?</h3><p class="rv-tip">Klik bij elke opgave één bewerking aan: een rekenteken, een macht of een wortel.</p>'
    + '<div class="h7-wgrid">' + q.items.map((ex, i)=>`<div class="h7-witem" data-wi="${i}"><span class="h7-wlet">${'abcdefgh'[i]})</span>${voHTML(voNumber(voParse(ex)), { live:true, weet:true, pick:v.pick[i] })}</div>`).join('') + '</div>';
  c.vis.querySelectorAll('[data-wk]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(), k = b.dataset.wk, i = w.ord.indexOf(k);
    if(i >= 0) w.ord.splice(i, 1); else if(w.ord.length < 4) w.ord.push(k); c.bewaar(w); c.teken(); });
  c.ant.querySelectorAll('.h7-witem [data-vo]').forEach(el=>{
    el.onclick = ev=>{ ev.stopPropagation(); const wi = Number(el.closest('[data-wi]').dataset.wi), id = Number(el.dataset.vo), w = c.huidig();
      w.pick[wi] = w.pick[wi] === id ? null : id; c.bewaar(w); c.teken(); };
    el.onkeydown = ev=>{ if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); el.click(); } };
  });
};

/* ---------- foutenjager ---------- */
TYPEN.errvo.teken = c=>{
  const { q, v } = c;
  c.vis.innerHTML = notitie(q) + '<h3>① Wat ging er mis?</h3><div class="keuzes">'
    + q.options.map(o=>`<button type="button" class="keuze${v.choice === o.id ? ' aan' : ''}" data-opt="${o.id}" aria-pressed="${v.choice === o.id}"><span class="letter">${o.id.toUpperCase()}</span><span>${esc(o.text)}</span></button>`).join('') + '</div>';
  c.ant.innerHTML = '<h3>② Wat is de juiste uitkomst?</h3>' + `<div class="rv-rij"><span class="rv-wisk h7-groot">${voStatic(q.expr)} =</span><span class="rv-term">${RV().teken('res.s', v.res.s, 'toestandsteken van de uitkomst', true)}${RV().getal('res.n', v.res.n, 'nat')}</span></div>` + TIP_TEKEN;
  c.vis.querySelectorAll('[data-opt]').forEach(b=>b.onclick = ()=>{ const w = c.huidig(); w.choice = b.dataset.opt; c.bewaar(w); c.teken(); });
};

DELEN = maakDelen();
const OPG = window.OPGAVE = {
  id:'2a-rv-7-volgorde-bewerkingen', css:'opgave.css', delen:DELEN, begrippen:BEGRIPPEN, codes:CODES,
  verbeter(q, v, k){ let r; try{ r = VERBETER[q.soort](q, v || {}, k); }catch(e){ r = { pts:0, codes:[], kruis:0 }; }
    return { pts:Math.round(Math.max(0, Math.min(q.punten, r.pts)) * 100) / 100, codes:[...new Set(r.codes)], kruis:r.kruis || 0 }; },
  volledig(q, a){ let v = null; try{ v = a == null || a === '' ? null : typeof a === 'string' ? JSON.parse(a) : a; }catch(e){} try{ return !!v && VOLLEDIG[q.soort](q, v); }catch(e){ return false; } },
  toon,
  /* een volledig juist antwoord bij sleutel k (voor de sleutel en de tests) */
  voorbeeld(q, k){
    switch(q.soort){
      case 'vo': return voorbeeldVO(q);
      case 'first': return { ord:(k && k.order || []).slice(), pick:q.items.map(ex=>firstKey(ex).node.id) };
      case 'errvo': { const n = errAns(q); return { choice:k && k.good, res:{ s:n < 0 ? '−' : '+', n:String(Math.abs(n)) } }; }
    }
  },
  invullen:opts=>window.RV.maak(OPG, TYPEN, opts)
};
})();
