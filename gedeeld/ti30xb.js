/* Nagebootst rekentoestel TI-30XB MultiView voor het oefenplatform (Campus Lievegem).
   Gebruik: TI30XB.create(element, {size:'14px', store:'sleutel'}) geeft {el, btn, press(code), reset(), setLists([[...],[...]])}.
   Bron: aparte bestanden in 1A-module-3/bron/rekentoestel (zie overdrachtsdocument). */
(function(root){
'use strict';
/* ============================================================
   GETALLEN: exact (q · √r · π^p met breuk q) of decimaal
   ============================================================ */
const B = BigInt;
const MAXB = 10n ** 18n;
function gcd(a, b){ if(a<0n) a=-a; if(b<0n) b=-b; while(b){ [a, b] = [b, a % b]; } return a; }
function babs(a){ return a<0n ? -a : a; }
/* foutmelding zoals op het toestel */
function Err(code){ this.code = code; }
const fail = code => { throw new Err(code); };

/* r vrij van kwadraten maken: √r = k·√r' */
function sqfree(r){
  let k = 1n, rest = r;
  if(rest > 10n ** 14n) return null;
  for(let f = 2n; f * f <= rest; f += (f===2n ? 1n : 2n)){
    while(rest % (f*f) === 0n){ rest /= f*f; k *= f; }
    if(f > 1000000n) return null;
  }
  return [k, rest];
}
/* exacte waarde; geeft een decimale waarde terug als de getallen te groot worden */
function ex(n, d = 1n, r = 1n, p = 0, dec = false){
  if(d === 0n) fail('DIVIDE BY 0');
  if(d < 0n){ n = -n; d = -d; }
  if(n === 0n) return { e:true, n:0n, d:1n, r:1n, p:0, dec };
  if(r !== 1n){ const s = sqfree(r); if(!s) return fl(Number(n)/Number(d)*Math.sqrt(Number(r))*(p?Math.PI:1), dec); n *= s[0]; r = s[1]; }
  const g = gcd(n, d); n /= g; d /= g;
  if(babs(n) > MAXB || d > MAXB) return fl(Number(n)/Number(d)*Math.sqrt(Number(r))*(p?Math.PI:1), dec);
  return { e:true, n, d, r, p, dec };
}
function fl(v, dec = true){
  if(!isFinite(v)) fail('OVERFLOW');
  if(Math.abs(v) >= 1e100) fail('OVERFLOW');
  if(Math.abs(v) < 1e-99) v = 0;
  return { e:false, v, dec:true };
}
const ZERO = ex(0n), ONE = ex(1n);
const isZero = a => a.e ? a.n === 0n : a.v === 0;
const num = a => a.e ? (Number(a.n) / Number(a.d)) * (a.r===1n ? 1 : Math.sqrt(Number(a.r))) * (a.p ? Math.PI : 1) : a.v;
const isRat = a => a.e && a.r === 1n && a.p === 0;
const isInt = a => isRat(a) ? a.d === 1n : (!a.e && Number.isInteger(a.v));
const withDec = (a, dec) => dec && !a.dec ? Object.assign({}, a, {dec:true}) : a;
/* een decimale waarde terug naar een breuk als dat netjes kan (voor ▸F◂▸D) */
function toFrac(a){
  if(a.e) return Object.assign({}, a, {dec:false});
  const x = a.v; if(Number.isInteger(x) && Math.abs(x) < 1e15) return ex(B(x));
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1, y = x;
  for(let i=0; i<30; i++){
    const ai = Math.floor(y); [h1, h0] = [ai*h1 + h0, h1]; [k1, k0] = [ai*k1 + k0, k1];
    if(k1 > 10000) break;
    if(Math.abs(x - h1/k1) < 1e-10 * Math.max(1, Math.abs(x))) return ex(B(h1), B(k1));
    const fr = y - ai; if(fr < 1e-12) break; y = 1/fr;
  }
  return a;
}

/* ---- rekenen ---- */
function add(a, b){
  const dec = a.dec || b.dec;
  if(isZero(a)) return withDec(b, dec);
  if(isZero(b)) return withDec(a, dec);
  if(a.e && b.e && a.r === b.r && a.p === b.p) return ex(a.n*b.d + b.n*a.d, a.d*b.d, a.r, a.p, dec);
  return fl(num(a) + num(b));
}
const neg = a => a.e ? Object.assign({}, a, {n:-a.n}) : fl(-a.v, a.dec);
const sub = (a, b) => add(a, neg(b));
function mul(a, b){
  const dec = a.dec || b.dec;
  if(a.e && b.e && a.p + b.p <= 1) return ex(a.n*b.n, a.d*b.d, a.r*b.r, a.p + b.p, dec);
  return fl(num(a) * num(b));
}
function div(a, b){
  if(isZero(b)) fail('DIVIDE BY 0');
  const dec = a.dec || b.dec;
  if(a.e && b.e && a.p - b.p >= 0) return ex(a.n*b.d, a.d*b.n*b.r, a.r*b.r, a.p - b.p, dec);
  return fl(num(a) / num(b));
}
/* k-de wortel van een positief BigInt als die geheel is */
function iroot(x, k){
  if(x < 0n) return null; if(x < 2n) return x;
  let g = B(Math.round(Math.pow(Number(x), 1/k)));
  for(const c of [g-1n, g, g+1n]){ if(c >= 0n && c ** B(k) === x) return c; }
  return null;
}
function powInt(a, k){
  if(k === 0) return ex(1n, 1n, 1n, 0, a.dec);
  if(k < 0){ if(isZero(a)) fail('DIVIDE BY 0'); return withDec(div(ONE, powInt(a, -k)), a.dec); }
  if(a.e && k <= 400 && a.p * k <= 1){
    const bits = Math.abs(Math.log2(Math.abs(Number(a.n)) + 1)) + Math.log2(Number(a.d) + 1);
    if(bits * k < 200){
      const rr = a.r === 1n ? [1n, 1n] : (k % 2 === 0 ? [a.r ** B(k/2), 1n] : [a.r ** B((k-1)/2), a.r]);
      return ex((a.n ** B(k)) * rr[0], a.d ** B(k), rr[1], a.p * k, a.dec);
    }
  }
  return fl(Math.pow(num(a), k));
}
function pow(a, b){
  if(isZero(a) && isZero(b)) fail('DOMAIN');
  if(isInt(b) && Math.abs(num(b)) <= 1e6) return withDec(powInt(a, Number(b.e ? b.n : b.v)), b.dec);
  const x = num(a), y = num(b);
  if(isRat(b) && isRat(a) && b.d <= 10n){
    const q = Number(b.d), m = Number(b.n);
    const rn = iroot(babs(a.n), q), rd = iroot(a.d, q);
    if(rn !== null && rd !== null && (a.n >= 0n || q % 2 === 1)) return withDec(powInt(ex(a.n < 0n ? -rn : rn, rd), m), a.dec || b.dec);
    if(q === 2 && a.n > 0n) return withDec(powInt(sqrtV(a), m), a.dec || b.dec);
  }
  if(x < 0){
    if(isRat(b) && b.d % 2n === 1n) return fl((Number(b.n) % 2 === 0 ? 1 : -1) * Math.pow(-x, y));
    fail('DOMAIN');
  }
  if(x === 0 && y < 0) fail('DIVIDE BY 0');
  return fl(Math.pow(x, y));
}
function sqrtV(a){
  if(num(a) < 0) fail('DOMAIN');
  if(isRat(a)) return ex(1n, a.d, a.n * a.d, 0, a.dec);
  return fl(Math.sqrt(num(a)));
}
function nroot(i, a){
  const k = num(i);
  if(k === 0 || (num(a) < 0 && !(isInt(i) && Math.abs(k) % 2 === 1))) fail('DOMAIN');
  if(isInt(i) && k > 0 && isRat(a)){
    if(k === 2) return sqrtV(a);
    const rn = iroot(babs(a.n), k), rd = iroot(a.d, k);
    if(rn !== null && rd !== null) return ex(a.n < 0n ? -rn : rn, rd, 1n, 0, a.dec || i.dec);
  }
  const x = num(a);
  return fl(x < 0 ? -Math.pow(-x, 1/k) : Math.pow(x, 1/k));
}
function fact(a){
  if(!isInt(a) || num(a) < 0 || num(a) > 69) fail('DOMAIN');
  let r = 1n; for(let i = 2n; i <= B(num(a)); i++) r *= i;
  return r > MAXB ? fl(Number(r)) : ex(r);
}
function nPr(n, r){
  if(!isInt(n) || !isInt(r) || num(n) < 0 || num(r) < 0) fail('DOMAIN');
  const N = num(n), R = num(r); if(R > N) return ex(0n);
  let v = 1n; for(let i = N - R + 1; i <= N; i++) v *= B(i);
  return v > MAXB ? fl(Number(v)) : ex(v);
}
function nCr(n, r){
  if(!isInt(n) || !isInt(r) || num(n) < 0 || num(r) < 0) fail('DOMAIN');
  const N = num(n), R = num(r); if(R > N) return ex(0n);
  let v = 1n; for(let i = 1; i <= Math.min(R, N - R); i++){ v = v * B(N - i + 1) / B(i); }
  return v > MAXB ? fl(Number(v)) : ex(v);
}

/* ---- hoeken ---- */
/* waarde (in de hoekmodus) → graden als exacte breuk, of null */
function degExact(a, ang){
  if(!a.e) return null;
  if(ang === 'DEG' && isRat(a)) return [a.n, a.d];
  if(ang === 'RAD' && a.r === 1n && a.p === 1) return [a.n * 180n, a.d];
  if(ang === 'GRAD' && isRat(a)) return [a.n * 9n, a.d * 10n];
  return null;
}
const toRad = (x, ang) => ang === 'DEG' ? x * Math.PI / 180 : ang === 'GRAD' ? x * Math.PI / 200 : x;
const fromRad = (x, ang) => ang === 'DEG' ? x * 180 / Math.PI : ang === 'GRAD' ? x * 200 / Math.PI : x;
/* exacte sinus van een veelvoud van 30° of 45° */
function sinDeg(D){
  D = ((D % 360) + 360) % 360;
  const T = {0:ZERO, 30:ex(1n,2n), 45:ex(1n,2n,2n), 60:ex(1n,2n,3n), 90:ONE};
  const s = D <= 90 ? T[D] : D <= 180 ? T[180-D] : D <= 270 ? (T[D-180] && neg(T[D-180])) : (T[360-D] && neg(T[360-D]));
  return s || null;
}
function trig(f, a, ang){
  const de = degExact(a, ang);
  if(de && de[1] === 1n && de[0] % 15n === 0n){
    const D = Number(de[0]);
    if(D % 30 === 0 || D % 45 === 0){
      const s = sinDeg(D), c = sinDeg(D + 90);
      if(f === 'sin') return s; if(f === 'cos') return c;
      if(isZero(c)) fail('DOMAIN');
      return div(s, c);
    }
  }
  const x = toRad(num(a), ang);
  let v = f === 'sin' ? Math.sin(x) : f === 'cos' ? Math.cos(x) : Math.tan(x);
  if(f === 'tan' && Math.abs(Math.cos(x)) < 1e-12) fail('DOMAIN');
  if(Math.abs(v) < 1e-12) v = 0;
  return fl(v);
}
/* exacte boog: waarde in de lijst → graden */
function sameV(a, b){ return a.e && b.e && a.n === b.n && a.d === b.d && a.r === b.r && a.p === b.p; }
function atrig(f, a, ang){
  const x = num(a);
  if((f === 'sin' || f === 'cos') && Math.abs(x) > 1 + 1e-12) fail('DOMAIN');
  const cand = f === 'tan' ? [[ZERO,0],[ex(1n,3n,3n),30],[ONE,45],[ex(1n,1n,3n),60]] : [[ZERO,0],[ex(1n,2n),30],[ex(1n,2n,2n),45],[ex(1n,2n,3n),60],[ONE,90]];
  if(a.e){
    for(const [v, D] of cand){
      for(const sg of [1, -1]){
        const w = sg === 1 ? v : neg(v);
        if(sameV(a, w) || (isZero(a) && isZero(w))){
          let deg = f === 'cos' ? (sg === 1 ? 90 - D : 90 + D) : sg * D;
          if(ang === 'DEG') return ex(B(deg));
          if(ang === 'GRAD') return ex(B(deg) * 10n, 9n);
          return ex(B(deg), 180n, 1n, deg === 0 ? 0 : 1);
        }
      }
    }
  }
  const r = f === 'sin' ? Math.asin(x) : f === 'cos' ? Math.acos(x) : Math.atan(x);
  return fl(fromRad(r, ang));
}
function logV(a, base){
  const x = num(a); if(x <= 0) fail('DOMAIN');
  if(base === 10 && isRat(a)){
    for(const [m, sg] of [[a.n, 1], [a.d, -1]]){
      const other = sg === 1 ? a.d : a.n;
      if(other === 1n){ const s = m.toString(); if(/^10*$/.test(s)) return ex(B(sg * (s.length - 1))); }
    }
  }
  if(base === 'e' && isRat(a) && a.n === 1n && a.d === 1n) return ZERO;
  return fl(base === 10 ? Math.log10(x) : Math.log(x));
}
function tenPow(a){
  if(isInt(a) && Math.abs(num(a)) <= 99){ const k = num(a); return k >= 0 ? ex(10n ** B(k), 1n, 1n, 0, a.dec) : ex(1n, 10n ** B(-k), 1n, 0, a.dec); }
  return fl(Math.pow(10, num(a)));
}
const ePow = a => isZero(a) ? ONE : fl(Math.exp(num(a)));
function hyp(f, a){
  const x = num(a);
  const v = { sinh:Math.sinh, cosh:Math.cosh, tanh:Math.tanh, asinh:Math.asinh, acosh:Math.acosh, atanh:Math.atanh }[f](x);
  if(isNaN(v)) fail('DOMAIN');
  return fl(v);
}
/* een hoek met eenheid omzetten naar de hoekmodus */
function angUnit(a, unit, ang){
  if(unit === 'deg'){
    if(ang === 'DEG') return a;
    if(ang === 'RAD') return a.e && isRat(a) ? ex(a.n, a.d * 180n, 1n, 1, a.dec) : fl(num(a) * Math.PI / 180);
    return mul(a, ex(10n, 9n));
  }
  if(unit === 'rad'){
    if(ang === 'RAD') return a;
    return fl(fromRad(num(a), ang));
  }
  if(ang === 'GRAD') return a;
  return ang === 'DEG' ? mul(a, ex(9n, 10n)) : fl(num(a) * Math.PI / 200);
}
/* ============================================================
   WEERGAVE VAN GETALLEN (zoals het scherm van het toestel)
   ============================================================ */
const NEG = '⁻';
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
/* decimaal getal → {m, e} met m als tekst; S = instellingen */
function decParts(x, S, maxDig = 10){
  const fix = S.fix;
  if(x === 0) return { m: fix == null ? '0' : (0).toFixed(fix), e: null };
  const sg = x < 0 ? NEG : ''; const ax = Math.abs(x);
  let e = Math.floor(Math.log10(ax));
  const rnd = Number(ax.toPrecision(maxDig)); e = Math.floor(Math.log10(rnd));
  let sci = S.nota !== 'NORM' || e >= 10 || ax < 1e-9;
  if(!sci && fix != null && ax < 0.5 * Math.pow(10, -fix) && ax < 1e-9) sci = true;
  if(!sci){
    let s;
    if(fix != null){ s = ax.toFixed(fix); if(s.replace('.','').replace(/^0+/,'').length > 10 && e >= 10) sci = true; }
    else { s = ax < 1 ? ax.toFixed(maxDig).replace(/0+$/, '').replace(/\.$/, '') : Number(ax.toPrecision(maxDig)).toString(); if(/e/.test(s)){ s = ax.toFixed(Math.min(20, Math.max(0, maxDig - 1 - e))); s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''); } }
    if(!sci) return { m: sg + s, e: null };
  }
  if(S.nota === 'ENG'){ e = Math.floor(e / 3) * 3; }
  let m = ax / Math.pow(10, e);
  let ms = fix != null ? m.toFixed(fix) : Number(m.toPrecision(S.nota === 'ENG' ? maxDig : maxDig)).toString();
  if(Number(ms) >= (S.nota === 'ENG' ? 1000 : 10)){ e += S.nota === 'ENG' ? 3 : 1; m = ax / Math.pow(10, e); ms = fix != null ? m.toFixed(fix) : Number(m.toPrecision(maxDig)).toString(); }
  return { m: sg + ms, e };
}
function decHTML(x, S){
  const p = decParts(x, S);
  if(p.e === null) return esc(p.m);
  const ex = String(p.e).replace('-', NEG);
  return S.print === 'MATH' ? `${esc(p.m)}×10<sup>${ex}</sup>` : `${esc(p.m)}*10^${ex}`;
}
const bigOK = (n, lim = 9999n) => babs(n) <= lim;
/* breuk in MathPrint (gestapeld) of Classic (a⁄b) */
const fracHTML = (t, b, S) => S.print === 'MATH' ? `<span class="fr"><span>${t}</span><span>${b}</span></span>` : `${t}⁄${b}`;
/* exacte waarde → html, of null als ze decimaal moet */
function exactHTML(a, S){
  if(!a.e || a.dec || S.fix != null || S.nota !== 'NORM') return null;
  const sg = a.n < 0n ? NEG : ''; const n = babs(a.n), d = a.d;
  if(a.r === 1n && a.p === 0){
    if(d === 1n) return n < 10n ** 10n ? sg + n : null;
    if(!bigOK(d) || !bigOK(n, 10n ** 10n)) return null;
    if(a.disp === 'mixed' && n > d){ const u = n / d, rr = n % d; return sg + u + (S.print === 'MATH' ? '' : '⌟') + fracHTML(rr, d, S); }
    return sg + fracHTML(n, d, S);
  }
  if(!bigOK(n) || !bigOK(d)) return null;
  const core = (n === 1n ? '' : String(n)) + (a.r !== 1n ? (S.print === 'MATH' ? `<span class="rt">√<span class="rad">${a.r}</span></span>` : `√(${a.r})`) : '') + (a.p ? 'π' : '');
  if(d === 1n) return sg + (core || '1');
  return sg + fracHTML(core || '1', d, S);
}
/* ▸DMS */
function dmsHTML(x){
  const sg = x < 0 ? NEG : ''; x = Math.abs(x);
  let D = Math.floor(x), m = (x - D) * 60, M = Math.floor(m + 1e-9), s = Math.round((m - M) * 60 * 1e6) / 1e6;
  if(s >= 60){ s -= 60; M++; } if(M >= 60){ M -= 60; D++; }
  return `${sg}${D}°${M}'${Number(s.toPrecision(8))}"`;
}
/* een resultaat → html */
function valHTML(a, S){
  if(a.disp === 'dms') return dmsHTML(num(a));
  if(a.disp === 'pct') return decHTML(num(a) * 100, S) + '%';
  return exactHTML(a, S) || decHTML(num(a), S);
}
/* kort voor lijsten en tabellen (max w tekens) */
function shortTxt(a, w = 6){
  if(a.e && !a.dec && a.r === 1n && a.p === 0 && a.d !== 1n){ const t = (a.n < 0n ? NEG : '') + babs(a.n) + '/' + a.d; if(t.length <= w) return t; }
  const x = num(a); if(x === 0) return '0';
  const sg = x < 0 ? NEG : ''; const ax = Math.abs(x); const room = w - sg.length;
  for(let p = Math.min(10, room); p >= 1; p--){
    let s = Number(ax.toPrecision(p)).toString();
    if(/e/.test(s)) s = ax.toFixed(Math.min(20, room)).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    if(s.startsWith('0.')) s = s.slice(1);
    if(s.length <= room && !/e/.test(s)) return sg + s;
  }
  const e = Math.floor(Math.log10(ax)), m = ax / Math.pow(10, e);
  const es = 'ᴇ' + String(e).replace('-', NEG); const mr = room - es.length;
  return sg + (mr >= 3 ? Number(m.toPrecision(Math.max(1, mr - 1))).toString() : Math.round(m).toString()).slice(0, Math.max(1, mr)) + es;
}
/* ============================================================
   INVOER: een boom van tokens en sjablonen (MathPrint)
   token  {t:'k', v:'3'}
   sjabloon {t:'frac'|'mixed'|'pow'|'sqrt'|'root'|'tenp'|'ep'|'sci', s:[[...], ...]}
   ============================================================ */
const T = v => ({ t:'k', v });
const TPL = (t, n) => ({ t, s:Array.from({length:n}, ()=>[]) });
const MEMV = ['x','y','z','t','a','b','c'];
const STATV = { 'S:n':'n', 'S:x̄':'x̄', 'S:Sx':'Sx', 'S:σx':'σx', 'S:Σx':'Σx', 'S:Σx²':'Σx²', 'S:minX':'minX', 'S:Q1':'Q1', 'S:Med':'Med', 'S:Q3':'Q3', 'S:maxX':'maxX',
  'S:ȳ':'ȳ', 'S:Sy':'Sy', 'S:σy':'σy', 'S:Σy':'Σy', 'S:Σy²':'Σy²', 'S:Σxy':'Σxy', 'S:a':'a', 'S:b':'b', 'S:r':'r', 'S:minY':'minY', 'S:maxY':'maxY' };
const FUNCS = ['sin(','cos(','tan(','sin⁻¹(','cos⁻¹(','tan⁻¹(','sinh(','cosh(','tanh(','sinh⁻¹(','cosh⁻¹(','tanh⁻¹(','log(','ln(','√(','10^(','e^(','randint(','R▸Pr(','R▸Pθ(','P▸Rx(','P▸Ry(','S:x′(','S:y′('];
const POSTFIX = ['²','⁻¹','!','%','°','′','″','ʳ','ᵍ'];
const CONV = ['▸DMS','▸F◂▸D','▸n/d◂▸Un/d','▸%'];
const SHOW = { '×':'*', '−':'-', '⁻':'⁻', ' nPr ':' nPr ', ' nCr ':' nCr ', 'S:x′(':'x′(', 'S:y′(':'y′(', '⁄':'⁄', '⌟':'⌟', 'ˣ√':'ˣ√', '×10^':'ᴇ' };
const tokTxt = v => SHOW[v] != null ? SHOW[v] : STATV[v] != null ? STATV[v] : v;
const isDigitTok = n => n.t === 'k' && /^[0-9.]$/.test(n.v);
const clone = x => JSON.parse(JSON.stringify(x));

/* ---- de editor met cursor ---- */
class Editor {
  constructor(root){ this.root = root || []; this.stack = []; this.i = this.root.length; }
  arr(){ const f = this.stack[this.stack.length-1]; return f ? f.node.s[f.k] : this.root; }
  get empty(){ return this.root.length === 0; }
  clear(){ this.root = []; this.stack = []; this.i = 0; }
  set(root){ this.root = root; this.stack = []; this.i = root.length; }
  enter(node, k, atEnd){ const a = this.arr(); this.stack.push({ node, k, pa:a, pi:a.indexOf(node) }); this.i = atEnd ? node.s[k].length : 0; }
  ins(node, slot = 0){ const a = this.arr(); a.splice(this.i, 0, node); this.i++; if(node.s && slot != null && slot >= 0){ this.i--; this.enter(node, slot, false); } }
  /* de getallen vlak voor de cursor wegnemen (voor teller, eenheid of index) */
  takeNumber(){ const a = this.arr(); let j = this.i; while(j > 0 && isDigitTok(a[j-1])) j--; const run = a.splice(j, this.i - j); this.i = j; return run; }
  right(){ const a = this.arr();
    if(this.i < a.length){ const n = a[this.i]; if(n.s) this.enter(n, 0, false); else this.i++; return true; }
    const f = this.stack[this.stack.length-1]; if(!f) return false;
    if(f.k < f.node.s.length - 1){ f.k++; this.i = 0; } else { this.stack.pop(); this.i = this.arr().indexOf(f.node) + 1; }
    return true; }
  left(){ const a = this.arr();
    if(this.i > 0){ const n = a[this.i-1]; if(n.s){ this.i--; this.enter(n, n.s.length - 1, true); } else this.i--; return true; }
    const f = this.stack[this.stack.length-1]; if(!f) return false;
    if(f.k > 0){ f.k--; this.i = f.node.s[f.k].length; } else { this.stack.pop(); this.i = this.arr().indexOf(f.node); }
    return true; }
  vert(dir){ for(let j = this.stack.length - 1; j >= 0; j--){ const f = this.stack[j], t = f.node.t; let to = null;
      if(t === 'frac'){ if(dir > 0 && f.k === 0) to = 1; if(dir < 0 && f.k === 1) to = 0; }
      if(t === 'mixed'){ if(dir > 0 && f.k < 2) to = 2; if(dir < 0 && f.k === 2) to = 1; }
      if(to == null) continue;
      const deeper = j < this.stack.length - 1; this.stack.length = j + 1; f.k = to; this.i = deeper ? 0 : Math.min(this.i, f.node.s[to].length); return true; }
    return false; }
  home(){ this.stack = []; this.i = 0; }
  end(){ this.stack = []; this.i = this.root.length; }
  del(){ const a = this.arr();
    if(this.i < a.length){ a.splice(this.i, 1); return; }
    if(this.i > 0){ a.splice(this.i - 1, 1); this.i--; return; }
    const f = this.stack[this.stack.length-1];
    if(f && f.node.s.every(s=>s.length === 0)){ this.stack.pop(); const pa = this.arr(); const k = pa.indexOf(f.node); pa.splice(k, 1); this.i = k; } }
  /* overschrijven (standaard op het toestel): de gewone token onder de cursor wegnemen */
  over(){ const a = this.arr(); if(this.i < a.length && !a[this.i].s) a.splice(this.i, 1); }
  /* de laatste token vlak voor de cursor (voor de toets x yzt abc) */
  prev(){ const a = this.arr(); return a[this.i - 1]; }
}

/* ---- boom → html (met cursor) ---- */
function treeHTML(arr, S, cur){
  const out = []; const isCur = cur && cur.arr === arr;
  const C = '<span class="cur"></span>';
  if(arr.length === 0) return `<span class="slot">${isCur ? C : ''}</span>`;
  arr.forEach((n, j)=>{
    if(isCur && cur.i === j) out.push(C);
    if(n.t === 'k'){ out.push(`<span class="tk">${esc(tokTxt(n.v))}</span>`); return; }
    const s = k => treeHTML(n.s[k], S, cur);
    const M = S.print === 'MATH';
    if(n.t === 'frac') out.push(M ? `<span class="fr"><span>${s(0)}</span><span>${s(1)}</span></span>` : `${s(0)}⁄${s(1)}`);
    else if(n.t === 'mixed') out.push(M ? `${s(0)}<span class="fr"><span>${s(1)}</span><span>${s(2)}</span></span>` : `${s(0)}⌟${s(1)}⁄${s(2)}`);
    else if(n.t === 'pow') out.push(M ? `<sup>${s(0)}</sup>` : `^${s(0)}`);
    else if(n.t === 'sqrt') out.push(M ? `<span class="rt">√<span class="rad">${s(0)}</span></span>` : `√(${s(0)})`);
    else if(n.t === 'root') out.push(M ? `<sup class="ix">${s(0)}</sup><span class="rt">√<span class="rad">${s(1)}</span></span>` : `${s(0)}ˣ√${s(1)}`);
    else if(n.t === 'tenp') out.push(M ? `10<sup>${s(0)}</sup>` : `10^(${s(0)})`);
    else if(n.t === 'ep') out.push(M ? `e<sup>${s(0)}</sup>` : `e^(${s(0)})`);
    else if(n.t === 'sci') out.push(M ? `×10<sup>${s(0)}</sup>` : `ᴇ${s(0)}`);
  });
  if(isCur && cur.i === arr.length) out.push(C);
  return out.join('');
}

/* ---- een waarde terug als invoer (plakken uit de geschiedenis, recall) ---- */
const digits = s => s.split('').map(c => T(c === '-' || c === NEG ? '⁻' : c));
function valTree(a, S){
  if(a.e && !a.dec && a.r === 1n && a.p === 0){
    const sg = a.n < 0n ? [T('⁻')] : [];
    if(a.d === 1n) return sg.concat(digits(String(babs(a.n))));
    if(S.print === 'MATH'){ const f = TPL('frac', 2); f.s[0] = digits(String(babs(a.n))); f.s[1] = digits(String(a.d)); return sg.concat([f]); }
    return sg.concat(digits(String(babs(a.n))), [T('⁄')], digits(String(a.d)));
  }
  if(a.e && !a.dec && bigOK(a.n) && bigOK(a.d)){
    const top = [];
    if(babs(a.n) !== 1n || (a.r === 1n && !a.p)) top.push(...digits(String(babs(a.n))));
    if(a.r !== 1n){ const r = TPL('sqrt', 1); r.s[0] = digits(String(a.r)); top.push(r); }
    if(a.p) top.push(T('π'));
    const sg = a.n < 0n ? [T('⁻')] : [];
    if(a.d === 1n) return sg.concat(top);
    const f = TPL('frac', 2); f.s[0] = top; f.s[1] = digits(String(a.d)); return sg.concat([f]);
  }
  const x = num(a); let s = Number(x.toPrecision(10)).toString();
  const m = s.match(/^(-?[\d.]+)e([+-]\d+)$/);
  if(m){ const sc = TPL('sci', 1); sc.s[0] = digits(String(Number(m[2]))); return digits(m[1]).concat([sc]); }
  return digits(s);
}
/* ============================================================
   UITREKENEN: Equation Operating System (volgorde zoals de handleiding)
   1 haakjes · 2 functies met ( · 3 breuken · 4 achtervoegsels (x², x⁻¹, !, %, °)
   5 machten en wortels · 6 tegengestelde · 7 nPr nCr · 8 maal, delen, impliciet maal
   9 plus en min · 10 omzettingen (▸F◂▸D, ▸n/d◂▸Un/d, ▸DMS, ▸%) · 11 enter sluit haakjes
   ============================================================ */
function lexTree(arr){
  const out = []; let numbuf = '';
  const flush = () => { if(numbuf){ out.push({ k:'num', s:numbuf }); numbuf = ''; } };
  arr.forEach(n => {
    if(isDigitTok(n)){ numbuf += n.v; return; }
    flush();
    if(n.t === 'k') out.push({ k:'tok', v:n.v }); else out.push({ k:'tpl', n });
  });
  flush(); return out;
}
function numLit(s){
  if((s.match(/\./g) || []).length > 1 || s === '.') fail('SYNTAX');
  const [i, f = ''] = s.split('.');
  const n = B((i || '0') + f), d = 10n ** B(f.length);
  return ex(n, d, 1n, 0, s.includes('.'));
}
const STARTS = v => v === '(' || v === 'π' || v === 'Ans' || v === 'rand' || MEMV.includes(v) || FUNCS.includes(v) || STATV[v] != null || /^L[123]$/.test(v) || v === '⁻';

/* ctx: { S, mem, ans, stat, rng, list:(k)=>V (in formules) } */
function evalTree(arr, ctx){
  const toks = lexTree(arr); let p = 0;
  const peek = () => toks[p];
  const isTok = (t, v) => t && t.k === 'tok' && (v == null || t.v === v);
  const S = ctx.S;
  function slot(arr2){ if(!arr2.length) fail('SYNTAX'); return evalTree(arr2, ctx); }
  function args(){ const a = [expr(0)]; while(isTok(peek(), ',')){ p++; a.push(expr(0)); } if(isTok(peek(), ')')) p++; else if(peek()) fail('SYNTAX'); return a; }
  function nud(){
    const t = toks[p++]; if(!t) fail('SYNTAX');
    if(t.k === 'num') return numLit(t.s);
    if(t.k === 'tpl'){
      const n = t.n;
      if(n.t === 'frac') return div(slot(n.s[0]), slot(n.s[1]));
      if(n.t === 'mixed'){ const u = slot(n.s[0]), f = div(slot(n.s[1]), slot(n.s[2])); return num(u) < 0 ? sub(u, f) : add(u, f); }
      if(n.t === 'sqrt') return sqrtV(slot(n.s[0]));
      if(n.t === 'root') return nroot(slot(n.s[0]), slot(n.s[1]));
      if(n.t === 'tenp') return tenPow(slot(n.s[0]));
      if(n.t === 'ep') return ePow(slot(n.s[0]));
      fail('SYNTAX');
    }
    const v = t.v;
    if(v === '(') { const e = expr(0); if(isTok(peek(), ')')) p++; else if(peek()) fail('SYNTAX'); return e; }
    if(v === '⁻') return neg(expr(50));
    if(v === 'π') return ex(1n, 1n, 1n, 1);
    if(v === 'Ans') return ctx.ans || ZERO;
    if(v === 'rand') return fl(ctx.rng());
    if(MEMV.includes(v)) return ctx.mem[v] || ZERO;
    if(/^L[123]$/.test(v)){ if(!ctx.list) fail('SYNTAX'); return ctx.list(Number(v[1]) - 1); }
    if(STATV[v] != null){ const st = ctx.stat; const k = STATV[v]; if(!st || st[k] == null) fail('SYNTAX'); if(st[k] === 'Error') fail('DIVIDE BY 0'); return st[k]; }
    if(FUNCS.includes(v)){
      const a = args(); const one = () => { if(a.length !== 1) fail('ARGUMENT'); return a[0]; };
      const ang = S.ang;
      switch(v){
        case 'sin(': case 'cos(': case 'tan(': return trig(v.slice(0,3), one(), ang);
        case 'sin⁻¹(': case 'cos⁻¹(': case 'tan⁻¹(': return atrig(v.slice(0,3), one(), ang);
        case 'sinh(': case 'cosh(': case 'tanh(': return hyp(v.slice(0,4), one());
        case 'sinh⁻¹(': case 'cosh⁻¹(': case 'tanh⁻¹(': return hyp('a' + v.slice(0,4), one());
        case 'log(': return logV(one(), 10);
        case 'ln(': return logV(one(), 'e');
        case '√(': return sqrtV(one());
        case '10^(': return tenPow(one());
        case 'e^(': return ePow(one());
        case 'randint(': { if(a.length !== 2) fail('ARGUMENT'); if(!isInt(a[0]) || !isInt(a[1])) fail('DOMAIN'); let lo = num(a[0]), hi = num(a[1]); if(lo > hi) [lo, hi] = [hi, lo]; return ex(B(lo + Math.floor(ctx.rng() * (hi - lo + 1)))); }
        case 'R▸Pr(': { if(a.length !== 2) fail('ARGUMENT'); return sqrtV(add(mul(a[0], a[0]), mul(a[1], a[1]))); }
        case 'R▸Pθ(': { if(a.length !== 2) fail('ARGUMENT'); const x = num(a[0]), y = num(a[1]); if(x === 0 && y === 0) return ZERO; return fl(fromRad(Math.atan2(y, x), ang)); }
        case 'P▸Rx(': { if(a.length !== 2) fail('ARGUMENT'); return mul(a[0], trig('cos', a[1], ang)); }
        case 'P▸Ry(': { if(a.length !== 2) fail('ARGUMENT'); return mul(a[0], trig('sin', a[1], ang)); }
        case 'S:x′(': { const st = ctx.stat; if(!st || st.a == null) fail('SYNTAX'); if(num(st.a) === 0) fail('DIVIDE BY 0'); return fl((num(one()) - num(st.b)) / num(st.a)); }
        case 'S:y′(': { const st = ctx.stat; if(!st || st.a == null) fail('SYNTAX'); return fl(num(st.a) * num(one()) + num(st.b)); }
      }
    }
    fail('SYNTAX');
  }
  function lbp(t){
    if(!t) return 0;
    if(t.k === 'tpl'){ if(t.n.t === 'pow') return 60; if(t.n.t === 'sci') return 80; return 30; }
    if(t.k === 'num') return 30;
    const v = t.v;
    if(v === '+' || v === '−') return 20;
    if(v === '×' || v === '÷') return 30;
    if(v === ' nPr ' || v === ' nCr ') return 40;
    if(v === '^' || v === 'ˣ√') return 60;
    if(POSTFIX.includes(v)) return 70;
    if(v === '⁄') return 75; if(v === '⌟') return 76; if(v === '×10^') return 80;
    if(CONV.includes(v)) return 10;
    if(v === '→') return 5;
    if(STARTS(v) && v !== '⁻') return 30;
    return 0;
  }
  function led(left, t){
    if(t.k === 'tpl'){
      if(t.n.t === 'pow'){ p++; const e = slot(t.n.s[0]); return pow(left, e); }
      if(t.n.t === 'sci'){ p++; const e = slot(t.n.s[0]); return withDec(mul(left, tenPow(e)), true); }
      return mul(left, nud());
    }
    if(t.k === 'num'){ if(left.angPart){ const r = expr(69); return Object.assign({}, add(left, r), { angPart:true }); } return mul(left, nud()); }
    const v = t.v;
    if(STARTS(v) && v !== '⁻' && !['+','−','×','÷'].includes(v)) return mul(left, nud());
    p++;
    switch(v){
      case '+': return add(left, expr(20));
      case '−': return sub(left, expr(20));
      case '×': return mul(left, expr(30));
      case '÷': return div(left, expr(30));
      case ' nPr ': return nPr(left, expr(40));
      case ' nCr ': return nCr(left, expr(40));
      case '^': return pow(left, expr(S.print === 'MATH' ? 59 : 60));
      case 'ˣ√': return nroot(left, expr(60));
      case '⁄': return div(left, expr(75));
      case '⌟': { const f = expr(76); return num(left) < 0 ? sub(left, f) : add(left, f); }
      case '×10^': return withDec(mul(left, tenPow(expr(80))), true);
      case '²': return mul(left, left);
      case '⁻¹': return div(ONE, left);
      case '!': return fact(left);
      case '%': return withDec(div(left, ex(100n)), true);
      case '°': return Object.assign({}, angUnit(left, 'deg', S.ang), { angPart:true, dec:true });
      case '′': return Object.assign({}, angUnit(div(left, ex(60n)), 'deg', S.ang), { angPart:true, dec:true });
      case '″': return Object.assign({}, angUnit(div(left, ex(3600n)), 'deg', S.ang), { angPart:true, dec:true });
      case 'ʳ': return angUnit(left, 'rad', S.ang);
      case 'ᵍ': return angUnit(left, 'grad', S.ang);
      case '▸F◂▸D': { const a = left.e && !left.dec ? Object.assign({}, left, { dec:true, disp:null }) : toFrac(left); return a; }
      case '▸n/d◂▸Un/d': return Object.assign({}, left, { disp: left.disp === 'mixed' ? null : 'mixed' });
      case '▸%': return Object.assign({}, left, { disp:'pct' });
      case '▸DMS': return Object.assign({}, left, { disp:'dms' });
      case '→': {
        const w = toks[p++]; if(!w || w.k !== 'tok') fail('SYNTAX');
        if(MEMV.includes(w.v)){ ctx.store = [w.v, left]; return left; }
        if(w.v === 'rand'){ ctx.seed = left; return left; }
        fail('SYNTAX');
      }
    }
    fail('SYNTAX');
  }
  function expr(rbp){
    let left = nud();
    while(true){ const t = peek(); const bp = lbp(t); if(bp <= rbp) break; left = led(left, t); }
    return left;
  }
  if(!toks.length) fail('SYNTAX');
  const v = expr(0);
  if(p < toks.length) fail('SYNTAX');
  return v;
}
/* ============================================================
   STATISTIEK (1-Var en 2-Var, zoals het toestel)
   ============================================================ */
function quart(sortedVals){ const n = sortedVals.length; if(!n) return NaN; return n % 2 ? sortedVals[(n-1)/2] : (sortedVals[n/2-1] + sortedVals[n/2]) / 2; }
/* gewogen mediaan als de frequenties geen gehele getallen zijn */
function wMedian(pairs){ const tot = pairs.reduce((s,p)=>s+p[1], 0); let c = 0;
  for(let i=0;i<pairs.length;i++){ c += pairs[i][1]; if(Math.abs(c - tot/2) < 1e-12 && i+1 < pairs.length) return (pairs[i][0] + pairs[i+1][0]) / 2; if(c > tot/2) return pairs[i][0]; }
  return pairs[pairs.length-1][0]; }
function stat1(xs, fs){
  if(!xs.length) fail('STAT');
  if(fs && fs.length !== xs.length) fail('DIM MISMATCH');
  const x = xs.map(num), f = fs ? fs.map(num) : x.map(()=>1);
  if(f.some(v => v < 0 || v > 99)) fail('FRQ DOMAIN');
  const n = f.reduce((s,v)=>s+v, 0); if(n === 0) fail('STAT');
  const sx = x.reduce((s,v,i)=>s+v*f[i], 0), sx2 = x.reduce((s,v,i)=>s+v*v*f[i], 0);
  const m = sx / n;
  const ss = x.reduce((s,v,i)=>s+f[i]*(v-m)*(v-m), 0);
  const intF = f.every(Number.isInteger);
  const pairs = x.map((v,i)=>[v, f[i]]).filter(p=>p[1] > 0).sort((a,b)=>a[0]-b[0]);
  let q1, med, q3;
  if(intF){ const all = []; pairs.forEach(([v,k])=>{ for(let j=0;j<k;j++) all.push(v); }); const N = all.length;
    med = quart(all); q1 = N > 1 ? quart(all.slice(0, Math.floor(N/2))) : all[0]; q3 = N > 1 ? quart(all.slice(Math.ceil(N/2))) : all[0]; }
  else { med = wMedian(pairs); q1 = med; q3 = med; }
  const F = v => fl(v);
  return { kind:1, n:F(n), 'x̄':F(m), Sx:(intF && n > 1) ? F(Math.sqrt(ss/(n-1))) : 'Error', 'σx':F(Math.sqrt(ss/n)), 'Σx':F(sx), 'Σx²':F(sx2),
    minX:F(pairs[0][0]), Q1:F(q1), Med:F(med), Q3:F(q3), maxX:F(pairs[pairs.length-1][0]) };
}
function stat2(xs, ys){
  if(!xs.length || !ys.length || xs.length !== ys.length) fail('STAT');
  const x = xs.map(num), y = ys.map(num), n = x.length;
  const S1 = a => a.reduce((s,v)=>s+v, 0);
  const sx = S1(x), sy = S1(y), sx2 = S1(x.map(v=>v*v)), sy2 = S1(y.map(v=>v*v)), sxy = S1(x.map((v,i)=>v*y[i]));
  const mx = sx/n, my = sy/n;
  const ssx = sx2 - n*mx*mx, ssy = sy2 - n*my*my, sp = sxy - n*mx*my;
  const F = v => fl(v);
  const a = ssx === 0 ? 'Error' : sp / ssx;
  const res = { kind:2, n:F(n), 'x̄':F(mx), Sx:n>1?F(Math.sqrt(Math.max(0,ssx)/(n-1))):'Error', 'σx':F(Math.sqrt(Math.max(0,ssx)/n)),
    'ȳ':F(my), Sy:n>1?F(Math.sqrt(Math.max(0,ssy)/(n-1))):'Error', 'σy':F(Math.sqrt(Math.max(0,ssy)/n)),
    'Σx':F(sx), 'Σx²':F(sx2), 'Σy':F(sy), 'Σy²':F(sy2), 'Σxy':F(sxy),
    a: a === 'Error' ? 'Error' : F(a), b: a === 'Error' ? 'Error' : F(my - a*mx), r:(ssx > 0 && ssy > 0) ? F(sp/Math.sqrt(ssx*ssy)) : 'Error',
    minX:F(Math.min(...x)), maxX:F(Math.max(...x)), minY:F(Math.min(...y)), maxY:F(Math.max(...y)) };
  return res;
}
const STAT1_ITEMS = ['n','x̄','Sx','σx','Σx','Σx²','minX','Q1','Med','Q3','maxX'];
const STAT2_ITEMS = ['n','x̄','Sx','σx','ȳ','Sy','σy','Σx','Σx²','Σy','Σy²','Σxy','a','b','r','x′','y′','minX','maxX','minY','maxY'];
const LABELS = '123456789ABCDEFGHIJKLMNOP';
/* ============================================================
   HET TOESTEL: toetsen, schermen en toepassingen
   ============================================================ */
const DEFAULTS = () => ({ ang:'DEG', nota:'NORM', fix:null, print:'MATH' });
/* toetsen: [code, label, 2nd-label, soort] in 9 rijen van 5 (de pijltjes staan apart) */
const KEYS = [
  ['2nd','2nd','','sec'], ['mode','mode','quit',''], ['delete','delete','insert',''], null, null,
  ['log','log','10<sup>x</sup>',''], ['prb','prb','angle',''], ['data','data','stat',''], null, null,
  ['ln','ln','e<sup>x</sup>',''], ['frac','<span class="kfr"><i>n</i><i>d</i></span>','U<span class="kfr s"><i>n</i><i>d</i></span>',''], ['x10','×10<sup><i>n</i></sup>','<span class="kfr s"><i>n</i><i>d</i></span>◂▸U<span class="kfr s"><i>n</i><i>d</i></span>',''], ['table','table','f◂▸d',''], ['clear','clear','',''],
  ['pi','π','hyp',''], ['sin','sin','sin<sup>-1</sup>',''], ['cos','cos','cos<sup>-1</sup>',''], ['tan','tan','tan<sup>-1</sup>',''], ['÷','÷','K','op'],
  ['pow','^','<sup>x</sup>√‾',''], ['inv','<i>x</i><sup>-1</sup>','',''], ['(','(','%',''], [')',')','▸%',''], ['×','×','','op'],
  ['sq','<i>x</i><sup>2</sup>','√‾',''], ['7','7','','n'], ['8','8','','n'], ['9','9','','n'], ['−','−','◂◑','op'],
  ['var','<i>x</i><span class="kvar"><i>yzt</i><i>abc</i></span>','clear var',''], ['4','4','','n'], ['5','5','','n'], ['6','6','','n'], ['+','+','◑▸','op'],
  ['sto','sto▸','recall',''], ['1','1','','n'], ['2','2','','n'], ['3','3','','n'], ['toggle','◂▸','','kring'],
  ['on','on','off',''], ['0','0','reset','n'], ['.','.',',','n'], ['neg','(−)','ans','n'], ['enter','enter','','kring']
];
const CSS30 = `
.ti30{ --kw:3.1em; font-size:var(--ti-fs, 13px); display:inline-block; position:relative; background:#5d6164; border-radius:2.2em 2.2em 3.2em 3.2em; padding:.9em .8em 1.6em; box-shadow:0 .35em 0 #3e4143, 0 .6em 1.2em rgba(0,0,0,.25); user-select:none; -webkit-user-select:none; -webkit-tap-highlight-color:transparent; outline:none; color:#222; font-family:"Segoe UI", Carlito, Calibri, Arial, sans-serif; }
.ti30:focus-visible{ box-shadow:0 0 0 3px #3BC1C5, 0 .35em 0 #3e4143; }
.ti30 .face{ background:linear-gradient(#ffffff, #eef0f1); border-radius:1.7em 1.7em 2.6em 2.6em; padding:1em .9em 1.2em; }
.ti30 .brand{ text-align:center; line-height:1.05; margin:.1em 0 .7em; }
.ti30 .brand b{ display:block; font:700 1.75em/1 "Segoe UI", Arial, sans-serif; color:#1b6fb5; letter-spacing:.01em; }
.ti30 .brand b span{ font-weight:400; }
.ti30 .brand i{ font:italic 700 1.05em/1 "Segoe UI", Arial, sans-serif; color:#3a9ad9; letter-spacing:.06em; }
.ti30 .lcdwrap{ background:#5d6164; border-radius:.7em; padding:.55em; margin:0 .1em .9em; }
.ti30 .lcd{ background:#c9d0c3; color:#1c2117; border-radius:.25em; height:7.2em; padding:.15em .45em .3em; display:flex; flex-direction:column; overflow:hidden; font-family:"DejaVu Sans Mono", Consolas, "Courier New", monospace; font-size:1.18em; line-height:1.18; box-shadow:inset 0 .12em .3em rgba(0,0,0,.35); position:relative; }
.ti30 .lcd.off > *{ visibility:hidden; }
.ti30 .ind{ font-size:.58em; height:1.25em; display:flex; gap:.9em; letter-spacing:.04em; white-space:nowrap; }
.ti30 .ind .r{ margin-left:auto; }
.ti30 .body{ flex:1; overflow:hidden; display:flex; flex-direction:column; }
.ti30 .home{ margin-top:auto; }
.ti30 .ent{ display:flex; flex-wrap:wrap; align-items:center; column-gap:.6em; min-height:1.2em; }
.ti30 .ent .o{ margin-left:auto; white-space:nowrap; }
.ti30 .ent .i{ word-break:break-all; }
.ti30 .sel{ outline:1.5px solid #1c2117; outline-offset:1px; }
.ti30 .ln{ white-space:pre; height:1.2em; overflow:hidden; }
.ti30 .inv{ background:#1c2117; color:#c9d0c3; }
.ti30 .blink{ animation:ti-b 1s steps(1) infinite; }
.ti30 .cur{ display:inline-block; width:.55em; height:1em; vertical-align:-.12em; background:#1c2117; animation:ti-b 1s steps(1) infinite; }
.ti30 .ins .cur{ width:.14em; }
.ti30 .ng{ display:inline-block; transform:translateY(.28em); }
.ti30 .ml{ display:inline-block; transform:translateY(.22em); }
@keyframes ti-b{ 50%{ opacity:0; } }
@media (prefers-reduced-motion: reduce){ .ti30 .cur, .ti30 .blink{ animation:none; } }
.ti30 .fr{ display:inline-flex; flex-direction:column; vertical-align:middle; font-size:.78em; text-align:center; line-height:1.05; margin:0 .08em; }
.ti30 .fr > span:first-child{ border-bottom:1.5px solid currentColor; padding:0 .1em .05em; }
.ti30 .fr > span:last-child{ padding:.05em .1em 0; }
.ti30 sup{ font-size:.72em; vertical-align:.55em; line-height:0; }
.ti30 sup.ix{ margin-right:-.15em; }
.ti30 .rt .rad{ border-top:1.5px solid currentColor; padding:0 .05em; }
.ti30 .slot{ display:inline-block; min-width:.5em; height:.85em; border:1px dotted currentColor; vertical-align:-.05em; }
.ti30 .slot .cur{ width:.5em; height:.85em; vertical-align:top; }
.ti30 .err{ text-align:center; margin:auto 0; }
.ti30 .keys{ display:grid; grid-template-columns:repeat(5, var(--kw)); column-gap:.55em; row-gap:.15em; position:relative; }
.ti30 .kc{ display:flex; flex-direction:column; align-items:center; }
.ti30 .kl{ font-size:.7em; line-height:1.15; height:1.2em; color:#1f84d0; font-weight:600; white-space:nowrap; letter-spacing:-.01em; }
.ti30 .k{ width:100%; height:2.05em; border-radius:1.05em; border:1px solid #9aa0a4; background:linear-gradient(#ffffff, #e6e8ea); color:#1d1f21; font:600 1em/1 "Segoe UI", Calibri, Arial, sans-serif; cursor:pointer; padding:0; box-shadow:0 .14em 0 #8d9296; display:flex; align-items:center; justify-content:center; touch-action:manipulation; }
.ti30 .k:active, .ti30 .k.down{ transform:translateY(.12em); box-shadow:0 .02em 0 #8d9296; }
.ti30 .k.n{ border-radius:.45em; font-size:1.35em; height:1.7em; font-weight:500; box-shadow:0 .1em 0 #8d9296; }
.ti30 .k.op{ background:linear-gradient(#5a6064, #43484c); color:#fff; border-color:#33373a; font-size:1.35em; height:1.6em; box-shadow:0 .1em 0 #2b2e30; }
.ti30 .k.sec{ background:linear-gradient(#3aa0ea, #1d83cf); color:#fff; border-color:#156cae; }
.ti30 .k.kring{ border:2.5px solid #2c3033; }
.ti30 .k sup{ font-size:.65em; vertical-align:.5em; line-height:0; }
.ti30 .k.hot, .ti30 .k.hot.op{ outline:.25em solid #FCAF17; outline-offset:.1em; }
.ti30 .kfr{ display:inline-flex; flex-direction:column; font-size:.72em; line-height:.95; font-style:italic; }
.ti30 .kfr i:first-child{ border-bottom:1px solid currentColor; }
.ti30 .kfr.s{ font-size:.85em; vertical-align:middle; }
.ti30 .kvar{ display:inline-flex; flex-direction:column; font-size:.55em; line-height:1; margin-left:.1em; }
.ti30 .pad{ position:absolute; right:-.1em; top:-.15em; width:calc(var(--kw) * 2 + .55em); height:5.3em; border-radius:2.6em 2.6em 2.2em 2.2em / 2.6em; background:linear-gradient(#6a6f73, #4d5155); box-shadow:0 .14em 0 #34373a; }
.ti30 .pad button{ position:absolute; background:transparent; border:none; cursor:pointer; color:#c5cacd; font-size:.8em; padding:0; }
.ti30 .pad .disc{ position:absolute; left:50%; top:50%; width:3.6em; height:3.6em; margin:-1.8em 0 0 -1.8em; border-radius:50%; background:radial-gradient(circle at 50% 45%, #3f4346 0 35%, #2d3033 36% 100%); pointer-events:none; }
.ti30 .pad .u{ left:30%; right:30%; top:0; height:35%; } .ti30 .pad .d{ left:30%; right:30%; bottom:0; height:35%; }
.ti30 .pad .l{ left:0; width:35%; top:25%; bottom:25%; } .ti30 .pad .r{ right:0; width:35%; top:25%; bottom:25%; }
.ti30 .pad button.hot{ outline:.25em solid #FCAF17; border-radius:.6em; }
.ti30 .pad button span{ position:relative; z-index:1; }
`;
let cssDone = false;
function addCSS(){ if(cssDone || typeof document === 'undefined') return; cssDone = true; const s = document.createElement('style'); s.textContent = CSS30; document.head.append(s); }

/* ---- menu's ---- */
const MENUS = {
  prb: { tabs:[{ t:'PRB', it:[['nPr',' nPr '],['nCr',' nCr '],['!','!']] }, { t:'RAND', it:[['rand','rand'],['randint(','randint(']] }] },
  angle: { tabs:[{ t:'DMS', it:[['°','°'],["′","′"],['″','″'],['ʳ','ʳ'],['ᵍ','ᵍ'],['▸DMS','▸DMS']] }, { t:'R◂▸P', it:[['R▸Pr(','R▸Pr('],['R▸Pθ(','R▸Pθ('],['P▸Rx(','P▸Rx('],['P▸Ry(','P▸Ry(']] }] },
  ls: { tabs:[{ t:'', it:[['L1','L1'],['L2','L2'],['L3','L3']] }] }
};

function create(parent, opts = {}){
  addCSS();
  const root = document.createElement('div'); root.className = 'ti30'; root.tabIndex = 0;
  root.setAttribute('role', 'application'); root.setAttribute('aria-label', 'Rekentoestel TI-30XB MultiView (nagebootst)');
  if(opts.size) root.style.setProperty('--ti-fs', opts.size);
  root.innerHTML = `<div class="face"><div class="brand"><b>TI-<span>30XB</span></b><i>MultiView</i></div><div class="lcdwrap"><div class="lcd"><div class="ind"></div><div class="body"></div></div></div><div class="keys"></div></div>`;
  const lcd = root.querySelector('.lcd'), ind = root.querySelector('.ind'), body = root.querySelector('.body'), keys = root.querySelector('.keys');
  const btn = {};
  KEYS.forEach(k => {
    const c = document.createElement('div'); c.className = 'kc';
    if(!k){ c.style.visibility = 'hidden'; c.innerHTML = '<span class="kl"></span><span class="k"></span>'; keys.append(c); return; }
    const [code, lab, sec, cls] = k;
    c.innerHTML = `<span class="kl">${sec}</span>`;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'k ' + cls; b.dataset.code = code; b.innerHTML = lab;
    b.setAttribute('aria-label', code);
    c.append(b); keys.append(c); btn[code] = b;
  });
  const pad = document.createElement('div'); pad.className = 'pad';
  pad.innerHTML = '<span class="disc"></span>';
  [['up','u','▲'],['down','d','▼'],['left','l','◀'],['right','r','▶']].forEach(([code, cl, t])=>{ const b = document.createElement('button'); b.type = 'button'; b.className = 'k ' + cl; b.dataset.code = code; b.setAttribute('aria-label', code); b.innerHTML = `<span>${t}</span>`; b.style.cssText = 'height:auto;width:auto;border:none;background:transparent;box-shadow:none;border-radius:.6em;'; pad.append(b); btn[code] = b; });
  keys.append(pad);
  parent.append(root);

  /* ---- toestand ---- */
  let st;
  function fresh(){
    return { on:true, app:'home', sec:false, hyp:false, ins:false, S:DEFAULTS(), ed:new Editor(), hist:[], from:0, sel:null, ans:ZERO,
      mem:Object.fromEntries(MEMV.map(v=>[v, ZERO])), K:null, L:[[],[],[]], F:[null,null,null], stat:null, statOpt:{1:[0,0], 2:[0,1]},
      tab:{ f:[], start:[T('0')], step:[T('1')], auto:true, ask:[] }, contrast:0, seed:12345, lastVar:false };
  }
  st = fresh();
  let rngState = st.seed;
  const rng = () => { rngState = (rngState * 1103515245 + 12345) % 2147483648; return rngState / 2147483648; };
  const ctx = extra => Object.assign({ S:st.S, mem:st.mem, ans:st.ans, stat:st.stat, rng }, extra || {});
  /* app-stapel voor menu's en fouten */
  let A = { name:'home' };
  const go = (name, data) => { A = Object.assign({ name, back:A }, data || {}); };
  const goHome = () => { A = { name:'home' }; st.sel = null; };

  /* ---- bewaren (enkel getallen, lijsten en instellingen) ---- */
  const enc = v => { if(!v) return null; const o = v.e ? { e:1, n:String(v.n), d:String(v.d), r:String(v.r), p:v.p, dec:v.dec?1:0 } : { e:0, v:v.v }; if(v.disp) o.disp = v.disp; return o; };
  const dec_ = o => { if(!o) return ZERO; const v = o.e ? ex(B(o.n), B(o.d), B(o.r), o.p, !!o.dec) : fl(o.v); if(o.disp) v.disp = o.disp; return v; };
  function save(){ if(!opts.store) return; try{ localStorage.setItem(opts.store, JSON.stringify({ S:st.S, mem:Object.fromEntries(MEMV.map(v=>[v, enc(st.mem[v])])), ans:enc(st.ans), L:st.L.map(l=>l.map(enc)), F:st.F, K:st.K, tab:st.tab, hist:st.hist.slice(-20).map(h=>({ tree:h.tree, html:h.html, res:enc(h.res) })) })); }catch(e){} }
  function load(o){ if(o.S) Object.assign(st.S, o.S); if(o.mem) MEMV.forEach(v=>{ st.mem[v] = dec_(o.mem[v]); }); if(o.ans) st.ans = dec_(o.ans); if(o.L) st.L = o.L.map(l=>l.map(dec_)); if(o.F) st.F = o.F; if(o.K) st.K = o.K; if(o.tab) st.tab = Object.assign(st.tab, o.tab); if(o.hist) st.hist = o.hist.map(h=>({ tree:h.tree || undefined, html:h.html || undefined, res:h.res ? dec_(h.res) : undefined })); }

  if(opts.store){ try{ const raw = localStorage.getItem(opts.store); if(raw) load(JSON.parse(raw)); }catch(e){} }

  /* ---- invoer in een editor (gedeeld door home, data, formule, table, K) ---- */
  function prefixAns(ed){ if(A.name === 'home' && ed.empty && st.hist.length) ed.ins(T('Ans')); }
  function edKey(ed, code, sec){
    const M = st.S.print === 'MATH';
    const put = v => { if(!st.ins) ed.over(); ed.ins(T(v)); };
    if(/^[0-9]$/.test(code)){ put(code); return true; }
    switch(code){
      case '.': put(sec ? ',' : '.'); return true;
      case 'neg': put(sec ? 'Ans' : '⁻'); return true;
      case '+': case '−': case '×': prefixAns(ed); put(code); return true;
      case '÷': prefixAns(ed); put('÷'); return true;
      case 'pow':
        if(sec){ if(M){ const r = TPL('root', 2); const run = ed.takeNumber(); if(run.length){ r.s[0] = run; ed.ins(r, 1); } else ed.ins(r, 0); } else put('ˣ√'); return true; }
        prefixAns(ed); if(M) ed.ins(TPL('pow', 1), 0); else put('^'); return true;
      case 'inv': prefixAns(ed); put('⁻¹'); return true;
      case '(': put(sec ? '%' : '('); return true;
      case ')': if(sec) prefixAns(ed); put(sec ? '▸%' : ')'); return true;
      case 'sq': if(sec){ if(M) ed.ins(TPL('sqrt', 1), 0); else put('√('); return true; } prefixAns(ed); put('²'); return true;
      case 'pi': if(sec){ st.hyp = !st.hyp; return true; } put('π'); return true;
      case 'sin': case 'cos': case 'tan': { const h = st.hyp; st.hyp = false; put(code + (h ? 'h' : '') + (sec ? '⁻¹' : '') + '('); return true; }
      case 'log': if(sec){ if(M) ed.ins(TPL('tenp', 1), 0); else put('10^('); return true; } put('log('); return true;
      case 'ln': if(sec){ if(M) ed.ins(TPL('ep', 1), 0); else put('e^('); return true; } put('ln('); return true;
      case 'frac':
        if(M){ const t = TPL(sec ? 'mixed' : 'frac', sec ? 3 : 2); const run = ed.takeNumber(); if(run.length){ t.s[0] = run; ed.ins(t, 1); } else ed.ins(t, 0); }
        else put(sec ? '⌟' : '⁄');
        return true;
      case 'x10': if(sec){ prefixAns(ed); put('▸n/d◂▸Un/d'); return true; } if(M) ed.ins(TPL('sci', 1), 0); else put('×10^'); return true;
      case 'table': if(sec){ prefixAns(ed); put('▸F◂▸D'); return true; } return false;
      case 'var': {
        const p = ed.prev();
        if(st.lastVar && p && p.t === 'k' && MEMV.includes(p.v) && A.name !== 'tablef'){ p.v = MEMV[(MEMV.indexOf(p.v) + 1) % MEMV.length]; }
        else put('x');
        st.lastVarNow = true; return true; }
      case 'left': if(sec) ed.home(); else ed.left(); return true;
      case 'right': if(sec) ed.end(); else ed.right(); return true;
      case 'delete': if(sec){ st.ins = !st.ins; return true; } ed.del(); return true;
    }
    return false;
  }

  /* ---- uitrekenen op het hoofdscherm ---- */
  function evaluate(tree){
    const c = ctx();
    let v = evalTree(tree, c);
    if(c.store){ st.mem[c.store[0]] = v; }
    if(c.seed){ rngState = Math.abs(Math.round(num(c.seed))) || 1; }
    return v;
  }
  function enter(){
    let tree;
    if(st.ed.empty){
      if(!st.hist.length) return;
      if(st.K) tree = [T('Ans')].concat(clone(st.K));
      else { const last = [...st.hist].reverse().find(h=>h.tree); if(!last) return; tree = clone(last.tree); }
    } else { tree = clone(st.ed.root); if(st.K) tree = tree.concat(clone(st.K)); }
    try{
      let v = evaluate(tree);
      /* zoals het toestel: een breuk verschijnt eerst als kommagetal, ◂▸ wisselt (behalve als je zelf met n/d een breuk intikte) */
      if(v.e && !v.dec && !v.disp && v.r === 1n && v.p === 0 && v.d !== 1n && !hasFrac(tree)) v = Object.assign({}, v, { dec:true });
      st.ans = v; st.hist.push({ tree, res:v }); if(st.hist.length > 40){ st.hist.shift(); st.from = Math.max(0, st.from - 1); }
      st.ed.clear(); st.ins = false; save();
    }catch(e){ if(!(e instanceof Err)) throw e; go('error', { code:e.code }); }
  }
  function hasFrac(arr){ return arr.some(n => n.t === 'frac' || n.t === 'mixed' || (n.t === 'k' && (n.v === '⁄' || n.v === '⌟')) || (n.s && n.s.some(hasFrac))); }
  function toggle(){
    const last = st.hist[st.hist.length - 1]; if(!last || !last.res) return;
    const v = last.res; let alt = null;
    if(v.disp === 'mixed' || v.disp === 'pct' || v.disp === 'dms'){ alt = Object.assign({}, v, { disp:null, dec:true }); }
    else if(v.e && !v.dec && !(v.r === 1n && v.p === 0 && v.d === 1n)) alt = Object.assign({}, v, { dec:true });
    else if(v.dec || !v.e){ const f = toFrac(v); if(f.e && !f.dec && !(f.d === 1n && v.e)) alt = f; else if(v.e && v.dec) alt = Object.assign({}, v, { dec:false }); }
    if(!alt) return;
    const h = valHTML(v, st.S);
    st.hist.push({ html:h + '◂▸', res:alt });
  }
  function pasteHist(){
    const h = st.hist[st.sel.i]; if(!h) return;
    if(st.sel.part === 'in' && h.tree) clone(h.tree).forEach(n => st.ed.ins(n, null));
    else if(h.res) valTree(h.res, st.S).forEach(n => st.ed.ins(n, null));
    st.sel = null;
  }
  function histMove(dir){
    const parts = []; st.hist.forEach((h, i)=>{ parts.push({ i, part:'in' }); if(h.res) parts.push({ i, part:'res' }); });
    if(!parts.length) return;
    let k = st.sel ? parts.findIndex(p=>p.i === st.sel.i && p.part === st.sel.part) : parts.length;
    k += dir; if(k >= parts.length){ st.sel = null; return; } if(k < 0) k = 0;
    st.sel = parts[k];
  }

  /* ---- data en formules ---- */
  const D = { c:0, r:0, ed:new Editor(), dirty:false };
  function recalcFormulas(){
    for(let c = 0; c < 3; c++){ const f = st.F[c]; if(!f) continue;
      try{ st.L[c] = calcFormula(f, c); }catch(e){ st.F[c] = null; } }
  }
  function refsOf(tree, out = new Set()){ tree.forEach(n=>{ if(n.t === 'k' && /^L[123]$/.test(n.v)) out.add(Number(n.v[1]) - 1); if(n.s) n.s.forEach(s=>refsOf(s, out)); }); return out; }
  function calcFormula(tree, own){
    const refs = [...refsOf(tree)]; if(!refs.length || refs.includes(own)) fail('FORMULA');
    const len = st.L[refs[0]].length; if(refs.some(r=>st.L[r].length !== len)) fail('DIM MISMATCH');
    const out = [];
    for(let i = 0; i < len; i++) out.push(evalTree(tree, ctx({ list:k => { const v = st.L[k][i]; if(!v) fail('DIM MISMATCH'); return v; } })));
    return out;
  }
  function dataCommit(){
    if(!D.dirty) return true;
    if(D.ed.empty){ D.dirty = false; return true; }
    try{
      const v = evalTree(clone(D.ed.root), ctx());
      if(D.r >= 42) fail('DIM MISMATCH');
      st.L[D.c][D.r] = v; D.dirty = false; D.ed.clear(); recalcFormulas(); save(); return true;
    }catch(e){ if(!(e instanceof Err)) throw e; go('error', { code:e.code }); return false; }
  }

  /* ---- tabel ---- */
  const TB = { row:0, sel:0, col:0, top:0, ed:new Editor() };
  const tabX = i => { const c = ctx(); return add(evalTree(st.tab.start, c), mul(ex(B(i)), evalTree(st.tab.step, c))); };
  function tabY(x){ try{ return evalTree(clone(st.tab.f), ctx({ mem:Object.assign({}, st.mem, { x }) })); }catch(e){ return null; } }

  /* ---- statistiek ---- */
  function runStat(kind){
    const o = st.statOpt[kind];
    try{
      st.stat = kind === 1 ? stat1(st.L[o[0]], o[1] ? st.L[o[1]-1] : null) : stat2(st.L[o[0]], st.L[o[1]]);
      st.stat.title = kind === 1 ? `1-Var:L${o[0]+1}${o[1] ? ',L' + o[1] : ''}` : `2-Var:L${o[0]+1},L${o[1]+1}`;
      go('statres', { sel:0, top:0 }); A.back = { name:'home' };
    }catch(e){ if(!(e instanceof Err)) throw e; go('error', { code:e.code }); A.back = { name:'home' }; }
  }
  const statItems = () => !st.stat ? [] : (st.stat.kind === 1 ? STAT1_ITEMS : STAT2_ITEMS);

  /* ---- toetsen verwerken ---- */
  function curEd(){ const n = A.name === 'menu' || A.name === 'error' ? A.target : A.name;
    return n === 'data' ? D.ed : n === 'frmla' ? D.ed : n === 'tablef' ? TB.fed : n === 'kedit' ? st.Ked : n === 'tabset' ? TB.ed : n === 'tabask' ? TB.ed : st.ed; }
  function openMenu(def, title, target){ go('menu', { def, tab:0, sel:0, title, target: target || A.name }); }
  function menuPick(item){
    const back = A.back; const tgt = A.target;
    A = back;
    if(typeof item[1] === 'function'){ item[1](); return; }
    const ed = tgt === 'data' || tgt === 'frmla' ? D.ed : tgt === 'tablef' ? TB.fed : tgt === 'kedit' ? st.Ked : st.ed;
    if(tgt === 'data') D.dirty = true;
    if(tgt === 'home' && (item[1] === ' nPr ' || item[1] === ' nCr ' || item[1] === '!' || item[1] === '▸DMS' || /^[°′″ʳᵍ]$/.test(item[1]))) prefixAns(ed);
    ed.ins(T(item[1]));
  }
  function press(code){
    if(code === 'on'){ if(st.sec){ st.sec = false; st.on = false; render(); return; } if(!st.on){ st.on = true; render(); return; } render(); return; }
    if(!st.on) return;
    if(code === '2nd'){ st.sec = !st.sec; render(); return; }
    const sec = st.sec; st.sec = false;
    st.lastVarNow = false;
    handle(code, sec);
    st.lastVar = st.lastVarNow;
    render();
  }
  function handle(code, sec){
    const n = A.name;
    /* toetsen die overal werken */
    if(sec && code === '−'){ st.contrast = Math.max(-4, st.contrast - 1); return; }
    if(sec && code === '+'){ st.contrast = Math.min(4, st.contrast + 1); return; }
    if(n === 'error'){ if(code === 'clear' || code === 'left' || code === 'right'){ A = A.back; } else if(sec && code === 'mode') goHome(); return; }
    if(sec && code === 'mode'){ if(n === 'data') dataCommit(); goHome(); return; }
    if(sec && code === '0'){ go('menu', { title:'Reset', def:{ tabs:[{ t:'', it:[['No', ()=>{}], ['Yes', ()=>{ const keep = st.contrast; st = fresh(); st.contrast = keep; A = { name:'home' }; save(); }]] }] }, tab:0, sel:0, target:'home' }); return; }
    if(code === 'mode' && !sec){ go('mode', { r:0, c:['DEG','RAD','GRAD'].indexOf(st.S.ang) }); return; }
    if(sec && code === 'var' && n !== 'menu'){ go('menu', { title:'Clear Var', def:{ tabs:[{ t:'', it:[['Yes', ()=>{ MEMV.forEach(v=>{ st.mem[v] = ZERO; }); save(); }], ['No', ()=>{}]] }] }, tab:0, sel:0, target:n }); return; }
    if(sec && code === 'sto' && n !== 'menu'){ go('menu', { title:'Recall Var', def:{ tabs:[{ t:'', it:MEMV.map(v=>[`${v}=${shortTxt(st.mem[v], 9)}`, ()=>{ const ed = curEd(); if(A.name === 'data') D.dirty = true; valTree(st.mem[v], st.S).forEach(x=>ed.ins(x, null)); }]) }] }, tab:0, sel:0, target:n }); return; }
    if(sec && code === 'data' && n !== 'frmla'){ if(n === 'data' && !dataCommit()) return; const it = [['1-Var Stats', ()=>{ go('statset', { kind:1, row:0 }); }], ['2-Var Stats', ()=>{ go('statset', { kind:2, row:0 }); }]]; if(st.stat) it.push(['StatVars', ()=>{ go('statres', { sel:0, top:0 }); }]); go('menu', { title:'STATS', def:{ tabs:[{ t:'', it }] }, tab:0, sel:0, target:'home' }); return; }
    if(code === 'prb' && !['mode','statset','statres','menu','tabset'].includes(n)){ openMenu(sec ? MENUS.angle : MENUS.prb); return; }
    if(sec && code === '÷' && (n === 'home')){ if(st.K){ st.K = null; return; } st.Ked = new Editor(); go('kedit'); return; }
    if(code === 'table' && !sec && ['home','data','tablef','tabset','tabview','tabask','statres'].includes(n)){ if(n === 'data' && !dataCommit()) return; TB.fed = new Editor(clone(st.tab.f)); TB.fed.i = TB.fed.root.length; goHome(); go('tablef'); return; }
    if(code === 'data' && !sec && n !== 'frmla' && n !== 'menu'){ if(n === 'data'){ if(!dataCommit()) return; go('menu', { title:null, def:{ tabs:[
          { t:'CLEAR', it:[1,2,3].map(k=>[`Clear L${k}`, ()=>{ st.L[k-1] = []; st.F[k-1] = null; recalcFormulas(); save(); }]).concat([['Clear ALL', ()=>{ st.L = [[],[],[]]; st.F = [null,null,null]; save(); }]]) },
          { t:'FORMULA', it:[['Add/Edit Frmla', ()=>{ D.ed = new Editor(st.F[D.c] ? clone(st.F[D.c]) : []); go('frmla'); }]].concat([1,2,3].map(k=>[`Clear L${k} Frmla`, ()=>{ st.F[k-1] = null; save(); }])).concat([['Clear ALL', ()=>{ st.F = [null,null,null]; save(); }]]) } ] }, tab:0, sel:0, target:'data' }); return; }
      goHome(); D.ed = new Editor(); D.dirty = false; go('data'); return; }
    ({ home:homeKey, menu:menuKey, mode:modeKey, data:dataKey, frmla:frmlaKey, statset:statsetKey, statres:statresKey, tablef:tablefKey, tabset:tabsetKey, tabview:tabviewKey, kedit:keditKey }[n] || (()=>{}))(code, sec);
  }
  function homeKey(code, sec){
    const ed = st.ed;
    if(st.sel){
      if(code === 'up'){ histMove(-1); return; } if(code === 'down'){ histMove(1); return; }
      if(code === 'enter'){ pasteHist(); return; }
      if(code === 'clear'){ st.sel = null; return; }
      st.sel = null;
    }
    if(code === 'enter'){ enter(); return; }
    if(code === 'clear'){ st.hyp = false; if(!ed.empty) ed.clear(); else st.from = st.hist.length; return; }
    if(code === 'up' || code === 'down'){ if(ed.vert(code === 'up' ? -1 : 1)) return; if(code === 'up') histMove(-1); return; }
    if(code === 'toggle'){ if(ed.empty) toggle(); return; }
    if(code === 'sto' && !sec){ prefixAns(ed); ed.ins(T('→')); return; }
    if(sec && (code === 'up' || code === 'down')) return;
    edKey(ed, code, sec);
  }
  function menuKey(code){
    const tabs = A.def.tabs, items = tabs[A.tab].it;
    if(code === 'left' && tabs.length > 1){ A.tab = (A.tab + tabs.length - 1) % tabs.length; A.sel = 0; return; }
    if(code === 'right' && tabs.length > 1){ A.tab = (A.tab + 1) % tabs.length; A.sel = 0; return; }
    if(code === 'down'){ A.sel = Math.min(items.length - 1, A.sel + 1); return; }
    if(code === 'up'){ A.sel = Math.max(0, A.sel - 1); return; }
    if(code === 'enter'){ menuPick(items[A.sel]); return; }
    if(code === 'clear'){ A = A.back; return; }
    if(/^[1-9]$/.test(code) && Number(code) <= items.length){ menuPick(items[Number(code) - 1]); return; }
  }
  const MODE_ROWS = [['DEG','RAD','GRAD'], ['NORM','SCI','ENG'], ['FLOAT','0','1','2','3','4','5','6','7','8','9'], ['CLASSIC','MATHPRINT']];
  const modeCur = r => r === 0 ? ['DEG','RAD','GRAD'].indexOf(st.S.ang) : r === 1 ? ['NORM','SCI','ENG'].indexOf(st.S.nota) : r === 2 ? (st.S.fix == null ? 0 : st.S.fix + 1) : (st.S.print === 'MATH' ? 1 : 0);
  function modeKey(code){
    const row = MODE_ROWS[A.r];
    if(code === 'right'){ if(A.c < row.length - 1) A.c++; else if(A.r < 3){ A.r++; A.c = 0; } return; }
    if(code === 'left'){ if(A.c > 0) A.c--; else if(A.r > 0){ A.r--; A.c = MODE_ROWS[A.r].length - 1; } return; }
    if(code === 'down'){ if(A.r < 3){ A.r++; A.c = modeCur(A.r); } return; }
    if(code === 'up'){ if(A.r > 0){ A.r--; A.c = modeCur(A.r); } return; }
    if(code === 'enter'){ const v = row[A.c];
      if(A.r === 0) st.S.ang = v; else if(A.r === 1) st.S.nota = v; else if(A.r === 2) st.S.fix = v === 'FLOAT' ? null : Number(v); else st.S.print = v === 'MATHPRINT' ? 'MATH' : 'CLASSIC';
      save(); return; }
    if(code === 'clear'){ goHome(); return; }
  }
  function dataKey(code, sec){
    const len = () => st.L[D.c].length;
    if(st.F[D.c] && (/^[0-9.]$/.test(code) || code === 'neg')) return;
    if(code === 'enter' || code === 'down'){ if(sec && code === 'down'){ D.r = len(); return; } const was = D.dirty; if(!dataCommit()) return; if(code === 'down' || was) D.r = Math.min(D.r + 1, len()); return; }
    if(code === 'up'){ if(sec){ D.r = 0; return; } if(!dataCommit()) return; D.r = Math.max(0, D.r - 1); return; }
    if(code === 'left' || code === 'right'){ if(!dataCommit()) return; D.c = (D.c + (code === 'right' ? 1 : 2)) % 3; D.r = Math.min(D.r, len()); return; }
    if(code === 'clear'){ if(D.dirty){ D.ed.clear(); D.dirty = false; } else if(D.r < len() && !st.F[D.c]){ D.ed.clear(); D.dirty = true; } return; }
    if(code === 'delete' && !D.dirty){ if(D.r < len() && !st.F[D.c]){ st.L[D.c].splice(D.r, 1); recalcFormulas(); save(); } return; }
    if(code === 'toggle') return;
    if(!D.dirty && (/^[0-9.]$/.test(code) || ['neg','pi','frac','sq','pow','(','sin','cos','tan','log','ln','var'].includes(code))){ D.ed.clear(); }
    if(edKey(D.ed, code, sec)) D.dirty = true;
  }
  function frmlaKey(code, sec){
    if(code === 'data' && !sec){ openMenu(MENUS.ls, null, 'frmla'); return; }
    if(code === 'clear'){ if(!D.ed.empty) D.ed.clear(); else { A = { name:'data' }; } return; }
    if(code === 'enter'){
      const tree = clone(D.ed.root);
      try{ const vals = calcFormula(tree, D.c); st.F[D.c] = tree; st.L[D.c] = vals; recalcFormulas(); save(); D.ed = new Editor(); D.dirty = false; A = { name:'data' }; }
      catch(e){ if(!(e instanceof Err)) throw e; go('error', { code:e.code }); }
      return; }
    edKey(D.ed, code, sec);
  }
  function statsetKey(code){
    const o = st.statOpt[A.kind];
    if(code === 'down'){ A.row = Math.min(2, A.row + 1); return; }
    if(code === 'up'){ A.row = Math.max(0, A.row - 1); return; }
    if(A.row < 2 && (code === 'left' || code === 'right')){ const max = A.kind === 1 && A.row === 1 ? 3 : 2; o[A.row] = Math.max(0, Math.min(max, o[A.row] + (code === 'right' ? 1 : -1))); return; }
    if(code === 'enter'){ if(A.row === 2) runStat(A.kind); else A.row++; return; }
    if(code === 'clear'){ goHome(); return; }
  }
  function statresKey(code){
    const items = statItems();
    if(code === 'down'){ A.sel = Math.min(items.length - 1, A.sel + 1); return; }
    if(code === 'up'){ A.sel = Math.max(0, A.sel - 1); return; }
    const k = LABELS.indexOf(code);
    if(code === 'enter' || (k >= 0 && k < items.length)){
      const it = items[code === 'enter' ? A.sel : k];
      goHome(); st.ed.ins(T(it === 'x′' ? 'S:x′(' : it === 'y′' ? 'S:y′(' : 'S:' + it)); return; }
    if(code === 'clear'){ goHome(); return; }
  }
  function tablefKey(code, sec){
    if(code === 'enter'){ if(TB.fed.empty){ go('error', { code:'INVALID FUNCTION' }); return; } st.tab.f = clone(TB.fed.root); save(); TB.row = 0; TB.ed = new Editor(clone(st.tab.start)); TB.fresh = true; go('tabset'); A.back = { name:'home' }; return; }
    if(code === 'clear'){ if(!TB.fed.empty) TB.fed.clear(); else goHome(); return; }
    if(code === 'var'){ TB.fed.ins(T('x')); return; }
    edKey(TB.fed, code, sec);
  }
  function tabsetKey(code, sec){
    const field = () => TB.row === 0 ? 'start' : 'step';
    const keep = () => { if(TB.row < 2) st.tab[field()] = clone(TB.ed.root); };
    const load = () => { if(TB.row < 2){ TB.ed = new Editor(clone(st.tab[field()])); TB.fresh = true; } };
    if(code === 'down' || (code === 'enter' && TB.row < 3)){ keep(); TB.row = Math.min(3, TB.row + 1); load(); return; }
    if(code === 'up'){ keep(); TB.row = Math.max(0, TB.row - 1); load(); return; }
    if(TB.row === 2 && (code === 'left' || code === 'right')){ st.tab.auto = code === 'left'; return; }
    if(code === 'enter' && TB.row === 3){
      try{ const s = evalTree(st.tab.start, ctx()), d = evalTree(st.tab.step, ctx()); if(isZero(d)) fail('DOMAIN'); }catch(e){ if(!(e instanceof Err)) throw e; go('error', { code:e.code }); return; }
      save(); TB.sel = 0; TB.top = 0; TB.col = 0; TB.ask = st.tab.auto ? null : []; TB.ed = new Editor(); go('tabview'); A.back = { name:'home' }; return; }
    if(code === 'clear'){ if(TB.row < 2 && !TB.ed.empty) TB.ed.clear(); else goHome(); return; }
    if(TB.row < 2){ if(TB.fresh && (/^[0-9.]$/.test(code) || code === 'neg')) TB.ed.clear(); TB.fresh = false; edKey(TB.ed, code, sec); }
  }
  function tabviewKey(code, sec){
    if(code === 'down'){ TB.sel++; if(TB.ask && TB.sel > TB.ask.length) TB.sel = TB.ask.length; return; }
    if(code === 'up'){ if(TB.ask){ TB.sel = Math.max(0, TB.sel - 1); } else TB.sel--; return; }
    if(code === 'left' || code === 'right'){ TB.col = code === 'right' ? 1 : 0; return; }
    if(code === 'clear'){ if(TB.ask && !TB.ed.empty) TB.ed.clear(); else goHome(); return; }
    if(TB.ask && TB.col === 0){
      if(code === 'enter'){ if(TB.ed.empty) return; try{ const v = evalTree(clone(TB.ed.root), ctx()); TB.ask[TB.sel] = v; TB.ed.clear(); TB.sel = Math.min(TB.sel + 1, TB.ask.length); }catch(e){ if(!(e instanceof Err)) throw e; go('error', { code:e.code }); } return; }
      edKey(TB.ed, code, sec);
    }
  }
  function keditKey(code, sec){
    if(code === 'enter'){ st.K = st.Ked.empty ? null : clone(st.Ked.root); goHome(); save(); return; }
    if(code === 'clear'){ if(!st.Ked.empty) st.Ked.clear(); else goHome(); return; }
    edKey(st.Ked, code, sec);
  }

  /* ---- tekenen ---- */
  const curOf = ed => ({ arr:ed.arr(), i:ed.i });
  const padR = (s, w) => { s = String(s); return s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length); };
  const lines = arr => arr.map(l=>`<div class="ln">${l}</div>`).join('');
  function indicator(extra){
    const S = st.S; const L = [];
    if(st.sec) L.push('2ND'); else if(st.hyp) L.push('HYP');
    if(S.fix != null) L.push('FIX'); if(S.nota !== 'NORM') L.push(S.nota);
    L.push(S.ang); if(st.K) L.push('K');
    if(extra) L.push(extra);
    const arrows = A.name === 'home' && st.hist.length ? '↑↓' : '';
    return L.map(t=>`<span>${t}</span>`).join('') + `<span class="r">${arrows}</span>`;
  }
  /* het minteken van een negatief getal en het maalteken staan op het toestel lager, in het midden */
  function signs(){
    const w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT); const todo = [];
    while(w.nextNode()) if(/[⁻*]/.test(w.currentNode.nodeValue)) todo.push(w.currentNode);
    todo.forEach(t => { const f = document.createDocumentFragment();
      t.nodeValue.split(/([⁻*])/).forEach(x => { if(!x) return; if(x === '⁻' || x === '*'){ const sp = document.createElement('span'); sp.className = x === '⁻' ? 'ng' : 'ml'; sp.textContent = x; f.append(sp); } else f.append(x); });
      t.replaceWith(f); });
  }
  function render(){ render0(); signs(); }
  function render0(){
    lcd.classList.toggle('off', !st.on);
    lcd.style.filter = st.contrast ? `contrast(${1 + st.contrast * 0.12}) brightness(${1 - st.contrast * 0.04})` : '';
    root.classList.toggle('ins', !!st.ins);
    ind.innerHTML = indicator();
    const S = st.S; const n = A.name;
    if(n === 'home'){
      const from = st.sel ? Math.min(st.from, st.sel.i) : st.from;
      const h = st.hist.slice(from).map((e, k)=>{ const i = from + k; const si = st.sel && st.sel.i === i;
        const inH = e.html != null ? e.html : treeHTML(e.tree, S, null);
        return `<div class="ent"><span class="i${si && st.sel.part === 'in' ? ' sel' : ''}">${inH}</span><span class="o${si && st.sel.part === 'res' ? ' sel' : ''}">${valHTML(e.res, S)}</span></div>`; }).join('');
      const cur = st.sel ? '' : `<div class="ent"><span class="i">${st.ed.empty ? '<span class="cur"></span>' : treeHTML(st.ed.root, S, curOf(st.ed))}</span></div>`;
      body.innerHTML = `<div class="home">${h}${cur}</div>`;
      const sel = body.querySelector('.sel'); if(sel) sel.scrollIntoView({ block:'nearest' }); else body.scrollTop = body.scrollHeight;
      return;
    }
    if(n === 'error'){ const c = A.code; body.innerHTML = `<div class="err">${c}<br>Error</div>`; return; }
    if(n === 'mode'){
      body.innerHTML = lines(MODE_ROWS.map((row, r)=>{ const cur = modeCur(r);
        return row.map((t, c)=>{ let cls = c === cur ? 'inv' : ''; if(r === A.r && c === A.c) cls += ' blink'; return `<span class="${cls}">${t}</span>`; }).reduce((s, x, c)=> s + (r === 2 && c > 1 ? '' : c ? ' ' : '') + x, ''); }));
      return;
    }
    if(n === 'menu'){
      const tabs = A.def.tabs, items = tabs[A.tab].it;
      const head = A.title ? `<span class="inv">${A.title}</span>` : tabs.map((t, i)=>i === A.tab ? `<span class="inv">${t.t}</span>` : t.t).join(' ');
      const top = Math.max(0, Math.min(A.sel - 1, items.length - 3));
      const L = [head];
      for(let i = top; i < Math.min(items.length, top + 3); i++){
        const mark = (i === top + 2 && i < items.length - 1) ? '↓' : (i === top && top > 0) ? '↑' : ':';
        L.push(`<span class="${i === A.sel ? 'inv' : ''}">${i + 1}${mark}</span>${esc(items[i][0])}`);
      }
      body.innerHTML = lines(L); return;
    }
    if(n === 'data' || n === 'frmla'){
      ind.innerHTML = [0,1,2].map(c=>`<span style="width:6.2em">${st.F[c] ? '♦' : ''}L${c+1}</span>`).join('');
      const top = Math.max(0, Math.min(D.r - 2, Math.max(...st.L.map(l=>l.length)) - 2));
      const L = [];
      for(let r = top; r < top + 3; r++){
        L.push([0,1,2].map(c=>{ const v = st.L[c][r]; let t = v ? shortTxt(v, 6) : (r === st.L[c].length ? '------' : '');
          t = padR(t, 6); if(c === D.c && r === D.r && n === 'data') t = `<span class="inv">${t}</span>`; return t; }).join('│'));
      }
      let bot;
      if(n === 'frmla') bot = `♦L${D.c+1}=${treeHTML(D.ed.root, S, curOf(D.ed))}`;
      else if(D.dirty) bot = `L${D.c+1}(${D.r+1})=${treeHTML(D.ed.root, S, curOf(D.ed))}`;
      else { const v = st.L[D.c][D.r]; bot = `L${D.c+1}(${D.r+1})=${v ? valHTML(v, S) : ''}`; if(st.F[D.c]) bot = `♦L${D.c+1}=${treeHTML(st.F[D.c], S, null)}`; }
      body.innerHTML = lines(L) + `<div class="ent" style="border-top:1px solid currentColor">${bot}</div>`; return;
    }
    if(n === 'statset'){
      const o = st.statOpt[A.kind]; const opt = (arr, v, r)=>arr.map((t, i)=>`<span class="${i === v ? 'inv' : ''}${A.row === r && i === v ? ' blink' : ''}">${t}</span>`).join(' ');
      const L = A.kind === 1 ? ['1-VAR STATS', 'DATA: ' + opt(['L1','L2','L3'], o[0], 0), 'FRQ: ' + opt(['ONE','L1','L2','L3'], o[1], 1)]
        : ['2-VAR STATS', 'xDATA: ' + opt(['L1','L2','L3'], o[0], 0), 'yDATA: ' + opt(['L1','L2','L3'], o[1], 1)];
      L.push(' '.repeat(12) + `<span class="${A.row === 2 ? 'inv blink' : ''}">CALC</span>`);
      body.innerHTML = lines(L); return;
    }
    if(n === 'statres'){
      const items = statItems(); const top = Math.max(0, Math.min(A.sel - 1, items.length - 3));
      const L = [`<span class="inv">${st.stat.title}</span>`];
      for(let i = top; i < Math.min(items.length, top + 3); i++){
        const k = items[i]; const v = st.stat[k];
        const mark = (i === top + 2 && i < items.length - 1) ? '↓' : (i === top && top > 0) ? '↑' : ':';
        const val = k === 'x′' || k === 'y′' ? '' : '=' + (v === 'Error' ? 'Error' : decHTML(num(v), Object.assign({}, S, { print:'CLASSIC' })));
        L.push(`<span class="${i === A.sel ? 'inv' : ''}">${LABELS[i]}</span>${mark}${k}${val}`);
      }
      body.innerHTML = lines(L); return;
    }
    if(n === 'tablef'){ body.innerHTML = `<div class="ent">y=${treeHTML(TB.fed.root, S, curOf(TB.fed))}</div>`; return; }
    if(n === 'tabset'){
      const f = (r, k) => TB.row === r ? treeHTML(TB.ed.root, S, curOf(TB.ed)) : treeHTML(st.tab[k], S, null);
      body.innerHTML = `<div class="ent">Start=${f(0, 'start')}</div><div class="ent">Step=${f(1, 'step')}</div>`
        + `<div class="ln"><span class="${st.tab.auto ? 'inv' : ''}${TB.row === 2 && st.tab.auto ? ' blink' : ''}">Auto</span>  <span class="${!st.tab.auto ? 'inv' : ''}${TB.row === 2 && !st.tab.auto ? ' blink' : ''}">Ask-x</span></div>`
        + `<div class="ln">${' '.repeat(14)}<span class="${TB.row === 3 ? 'inv blink' : ''}">OK</span></div>`;
      return;
    }
    if(n === 'tabview'){
      ind.innerHTML = `<span style="width:7em;text-align:center">x</span><span style="width:7em;text-align:center">y</span>`;
      const top = TB.ask ? Math.max(0, TB.sel - 2) : (TB.sel < TB.top ? (TB.top = TB.sel) : TB.sel > TB.top + 2 ? (TB.top = TB.sel - 2) : TB.top);
      const L = []; let selX = null, selY = null;
      for(let r = top; r < top + 3; r++){
        let x = null; try{ x = TB.ask ? TB.ask[r] : tabX(r); }catch(e){}
        const y = x ? tabY(x) : null;
        let xs = padR(x ? shortTxt(x, 6) : '', 6), ys = padR(x ? (y ? shortTxt(y, 7) : 'ERROR') : '', 7);
        if(r === TB.sel){ selX = x; selY = y; if(TB.col === 0) xs = `<span class="inv">${xs}</span>`; else ys = `<span class="inv">${ys}</span>`; }
        L.push(xs + '│' + ys);
      }
      let bot;
      if(TB.ask && TB.col === 0 && (!TB.ed.empty || !selX)) bot = 'x=' + treeHTML(TB.ed.root, S, curOf(TB.ed));
      else bot = TB.col === 0 ? 'x=' + (selX ? valHTML(selX, S) : '') : 'y=' + (selY ? valHTML(selY, S) : '');
      body.innerHTML = lines(L) + `<div class="ent" style="border-top:1px solid currentColor">${bot}</div>`; return;
    }
    if(n === 'kedit'){ body.innerHTML = `<div class="ent">K=${treeHTML(st.Ked.root, S, curOf(st.Ked))}</div>`; return; }
  }

  /* ---- muis, aanraken en toetsenbord ---- */
  const flash = code => { const b = btn[code]; if(!b) return; b.classList.add('down'); setTimeout(()=>b.classList.remove('down'), 120); };
  root.addEventListener('click', e => { const b = e.target.closest('button[data-code]'); if(!b || !root.contains(b)) return; press(b.dataset.code); });
  const KB = { Enter:'enter', '=':'enter', Backspace:'delete', Delete:'delete', Escape:'clear', ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
    '+':'+', '-':'−', '*':'×', '/':'÷', '^':'pow', '(':'(', ')':')', '.':'.', ',':'.', '!':null, 'p':'pi', 'x':'var' };
  root.addEventListener('keydown', e => {
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    let code = /^[0-9]$/.test(e.key) ? e.key : KB[e.key];
    if(e.key === '%'){ press('2nd'); code = '('; }
    if(!code) return;
    e.preventDefault(); flash(code); press(code);
  });

  render();
  return {
    el:root, btn, press, render,
    get state(){ return st; },
    reset(){ const keep = st.contrast; st = fresh(); st.contrast = keep; A = { name:'home' }; render(); },
    /* voor oefeningen: lijsten vooraf invullen, bv. setLists([[1,2,3],[4,5,6]]) */
    setLists(ls){ ls.forEach((l, i)=>{ st.L[i] = l.map(v=>typeof v === 'number' ? (Number.isInteger(v) ? ex(B(v)) : fl(v)) : v); }); render(); },
    screenText(){ return lcd.innerText; }
  };
}
root.TI30XB = { create, version:'1.0' };
})(typeof window !== 'undefined' ? window : globalThis);
