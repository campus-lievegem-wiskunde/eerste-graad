(function(){
/* ============================================================
   2B Modules (B-stroom, Max wiskunde 2B)
   Gebouwd met build.sh uit 2B-modules/bron/ en 2B-modules/m<n>/.
   Pas de bron aan, niet dit bestand.
   ============================================================ */
const PREFIX = (document.body.dataset.prefix) || '2b_mx_v1_';
const CLres   = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };

/* ---------- kleine hulpjes ---------- */
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const knop = (cls, html, fn) => { const b = el('button', cls, html); b.type = 'button'; if(fn) b.addEventListener('click', fn); return b; };
/* opslag: localStorage, met een kopie in het geheugen voor als de browser geen opslag toelaat (voorbeeldpagina, privévenster) */
const GEHEUGEN = {};
const lees = k => { try{ const v = localStorage.getItem(PREFIX + k); if(v != null) return JSON.parse(v); }catch(e){} return k in GEHEUGEN ? JSON.parse(GEHEUGEN[k]) : null; };
const bewaar = (k, v) => { GEHEUGEN[k] = JSON.stringify(v); try{ localStorage.setItem(PREFIX + k, GEHEUGEN[k]); }catch(e){} };
const wis = k => { delete GEHEUGEN[k]; try{ localStorage.removeItem(PREFIX + k); }catch(e){} };
const nieuwZaad = () => Math.floor(Math.random() * 2147483646) + 1;

/* toevalsgetallen uit een zaadgetal: dezelfde opgave komt terug na het herladen */
function RNG(seed){
  let h = seed >>> 0;
  const r = () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = {
    r,
    int:(a, b) => a + Math.floor(r() * (b - a + 1)),
    /* veelvoud van stap tussen a en b */
    stap:(a, b, s) => s * (Math.ceil(a / s) + Math.floor(r() * (Math.floor(b / s) - Math.ceil(a / s) + 1))),
    pick:a => a[Math.floor(r() * a.length)],
    shuffle:a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; },
    kies:(a, n) => R.shuffle(a).slice(0, n),
    kans:p => r() < p,
    naam:() => R.pick(NAMEN), namen:n => R.kies(NAMEN, n),
    jongen:() => R.pick(JONGENS), meisje:() => R.pick(MEISJES)
  };
  return R;
}
const MEISJES = ['Lien','Noor','Fien','Lotte','Jana','Elise','Febe','Marie','Amber','Lore','Hanne','Yana','Saar','Mila','Nina','Ella','Ines','Zoë','Lina','Aya','Sara','Eva','Julie','Lisa','Amira'];
const JONGENS = ['Arne','Wout','Lars','Seppe','Jonas','Milan','Rune','Kobe','Senne','Jasper','Thibo','Lucas','Mats','Bram','Ferre','Vic','Adam','Nand','Robbe','Emiel','Yusuf','Levi','Mo','Hugo','Tuur'];
const NAMEN = MEISJES.concat(JONGENS);

/* ---------- getallen schrijven (Vlaamse notatie) ---------- */
const rnd = (x, d = 6) => Math.round(x * 10 ** d) / 10 ** d;
const nf = (x, dec) => {
  if(typeof x !== 'number') return String(x);
  const neg = x < -1e-12; let s = dec != null ? Math.abs(x).toFixed(dec) : Math.abs(rnd(x, 6)).toString();
  if(/e/.test(s)) s = Math.abs(x).toFixed(8).replace(/0+$/, '');
  let [g, d] = s.split('.'); if(g.length > 3) g = g.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '-' : '') + g + (d ? ',' + d : '');
};
/* bedrag in euro: altijd twee cijfers na de komma, geen ,00 bij gehele bedragen als kort = true */
const eur = (x, kort) => '€ ' + (kort && Math.abs(x - Math.round(x)) < 1e-9 ? nf(Math.round(x)) : nf(x, 2));
const minN = x => x < 0 ? '-' + nf(-x) : nf(x);              /* minteken zoals in het werkboek: -4 */
const tussen = x => x < 0 ? `(${minN(x)})` : nf(x);           /* negatief getal achter een bewerkingsteken krijgt haakjes */
const X = ' x ', D = ' : ';                                   /* bewerkingstekens zoals in het werkboek */

/* tolerant een getal lezen: komma of punt, spaties, € en eenheden weg, minteken */
function leesGetal(s){
  s = String(s == null ? '' : s).trim().replace(/€|euro/gi, '').replace(/[−–]/g, '-').replace(/\s/g, '');
  s = s.replace(/(cm²|dm²|mm²|km²|m²|km|cm|mm|dm|m|kg|ton|mg|cg|dg|g|ml|cl|dl|l|ha|a|ca|°c|°|uur|u|min)$/i, '');
  s = s.replace(',', '.');
  if(!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}
const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.!]$/, '').replace(/\s+/g, ' ').trim();
/* antwoord vergelijken: a is een getal, een tekst of een lijst van aanvaarde antwoorden */
function zelfde(inv, a){
  if(Array.isArray(a)) return a.some(x=>zelfde(inv, x));
  if(a && typeof a === 'object' && !(a instanceof RegExp) && a.min != null){ const x = leesGetal(inv); return isFinite(x) && x >= a.min - 1e-9 && x <= a.max + 1e-9 && (!a.veelvoud || Math.abs(x / a.veelvoud - Math.round(x / a.veelvoud)) < 1e-9); }
  if(typeof a === 'number'){ const x = leesGetal(inv); return isFinite(x) && Math.abs(x - a) < 1e-6; }
  if(a instanceof RegExp) return a.test(norm(inv).replace(/\s/g, '').replace(/[−–]/g, '-'));
  return norm(inv) === norm(a);
};
/* afronden zoals bij schatten: naar het dichtstbijzijnde tiental, honderdtal ... */
const afr = (x, s) => Math.round(x / s) * s;
/* aanvaarde afrondingen van een getal bij het schatten */
function afrondingen(x){
  const r = new Set(); const a = Math.abs(x);
  if(a < 20) [1, 5, 10].forEach(s=>r.add(afr(x, s)));
  else if(a < 100) [10, 5].forEach(s=>r.add(afr(x, s)));
  else if(a < 1000) [10, 100, 50].forEach(s=>r.add(afr(x, s)));
  else [100, 500, 1000].forEach(s=>r.add(afr(x, s)));
  r.delete(0);
  return [...r];
}
const som = a => a.reduce((s, x)=>s + x, 0);
const rij = (n, f) => Array.from({ length:n }, (_, i)=>f(i));

/* ============================================================
   FIGUREN: SVG-hulpjes, geld, getallenas, rooster, assenstelsel
   ============================================================ */
const svg = (w, h, inner, o = {}) => `<svg class="hfig${o.cls ? ' ' + o.cls : ''}" viewBox="0 0 ${w} ${h}" width="${o.b || w}" style="max-width:100%;height:auto" role="img" aria-label="${o.label || 'figuur'}">${inner}</svg>`;
const at = o => (o.cls ? ` class="${o.cls}"` : '') + (o.st ? ` style="${o.st}"` : '') + (o.d ? ` stroke-dasharray="${o.d}"` : '');
const lijn = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w || 2}" stroke-linecap="round"${at(o)}/>`;
const rh = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.f || 'none'}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w == null ? 2 : o.w}"${o.rx ? ` rx="${o.rx}"` : ''}${at(o)}/>`;
const cirkel = (x, y, r, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.f || 'none'}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w == null ? 2 : o.w}"${at(o)}/>`;
const tekst = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 15}" text-anchor="${o.a || 'middle'}" fill="${o.f || 'var(--ink)'}" font-weight="${o.wt || 700}" dominant-baseline="central"${at(o)}>${t}</text>`;
const veelhoek = (pts, o = {}) => `<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${o.f || 'none'}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w == null ? 2 : o.w}" stroke-linejoin="round"${at(o)}/>`;
const pad = (d, o = {}) => `<path d="${d}" fill="${o.f || 'none'}" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w == null ? 2 : o.w}" stroke-linejoin="round" stroke-linecap="round"${at(o)}/>`;

/* rechte hoek in een hoekpunt P met benen naar A en B: een losse L met even lange benen,
   een beetje naar binnen geschoven zodat ze de benen van de hoek niet raakt (Belgische notatie) */
function rhoekL(P, A, B, o = {}){
  const s = o.s || 10, g = o.g || 4;
  const u = (Q)=>{ const dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  const a = u(A), b = u(B);
  /* hoek van de L ligt op afstand g van beide benen, de benen van de L lopen evenwijdig met de benen van de hoek */
  const c = [P[0] + (a[0] + b[0]) * g, P[1] + (a[1] + b[1]) * g];
  const p1 = [c[0] + a[0] * s, c[1] + a[1] * s], p2 = [c[0] + b[0] * s, c[1] + b[1] * s];
  return `<polyline points="${p1.join(',')} ${c.join(',')} ${p2.join(',')}" fill="none" stroke="${o.k || 'var(--ink)'}" stroke-width="${o.w || 1.6}" stroke-linejoin="miter"/>`;
}

/* ---------- geld ---------- */
const GELD = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];   /* in cent */
const BILJET = { 500:['#9aa3a8','#5f686d'], 1000:['#e0675f','#9d2f29'], 2000:['#5b8fd8','#26508f'], 5000:['#f2a04f','#a85c12'], 10000:['#5fb56a','#2c7a37'], 20000:['#e2c454','#8b7419'], 50000:['#a77cc0','#5d3478'] };
const geldNaam = c => c >= 100 ? '€ ' + (c / 100) : c + ' cent';
const isBiljet = c => c >= 500;
/* één munt of biljet als SVG-fragment met de linkerbovenhoek (of het middelpunt van de munt) op x, y */
function geldStuk(c, x, y){
  if(isBiljet(c)){
    const w = 96 + Math.log2(c / 500) * 6, h = 52 + Math.log2(c / 500) * 2.4, [k, d] = BILJET[c];
    return `<g transform="translate(${x},${y})"><rect width="${w}" height="${h}" rx="5" fill="${k}" stroke="${d}" stroke-width="2"/>`+
      `<rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="3" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/>`+
      `<circle cx="${w * .7}" cy="${h / 2}" r="${h * .26}" fill="#fff" fill-opacity=".35"/>`+
      `<text x="12" y="${h / 2 + 1}" font-size="${h * .42}" font-weight="800" fill="#fff" dominant-baseline="central">${c / 100}</text>`+
      `<text x="${w - 8}" y="12" font-size="10" font-weight="800" fill="#fff" text-anchor="end" dominant-baseline="central">EURO</text></g>`;
  }
  const r = { 1:15, 2:17, 5:19, 10:18, 20:20, 50:22, 100:21, 200:24 }[c];
  const koper = c <= 5, goud = c >= 10 && c <= 50;
  let s = `<g transform="translate(${x},${y})">`;
  if(koper || goud){ const [f, k] = koper ? ['#d48a55', '#8c4a20'] : ['#e6c45a', '#8f7218']; s += `<circle r="${r}" fill="${f}" stroke="${k}" stroke-width="2"/><circle r="${r - 4}" fill="none" stroke="${k}" stroke-opacity=".45" stroke-width="1"/>`; }
  else { const [buiten, binnen] = c === 100 ? ['#e6c45a', '#cfd4d6'] : ['#cfd4d6', '#e6c45a']; s += `<circle r="${r}" fill="${buiten}" stroke="#6d6d6d" stroke-width="2"/><circle r="${r * .66}" fill="${binnen}" stroke="#6d6d6d" stroke-width="1.2"/>`; }
  const t = c >= 100 ? c / 100 : c, onder = c >= 100 ? 'EURO' : 'CENT';
  s += `<text y="-2" font-size="${r * .78}" font-weight="800" fill="#2b2b2b" text-anchor="middle" dominant-baseline="central">${t}</text>`;
  s += `<text y="${r * .52}" font-size="${Math.max(6, r * .3)}" font-weight="800" fill="#2b2b2b" text-anchor="middle" dominant-baseline="central">${onder}</text></g>`;
  return s;
}
const stukBreedte = c => isBiljet(c) ? 96 + Math.log2(c / 500) * 6 : ({ 1:15, 2:17, 5:19, 10:18, 20:20, 50:22, 100:21, 200:24 }[c]) * 2;
const stukHoogte = c => isBiljet(c) ? 52 + Math.log2(c / 500) * 2.4 : stukBreedte(c);
/* een hoopje geld: biljetten en munten in rijen, breedte maxB */
function geldFig(stukken, o = {}){
  const maxB = o.b || 360, gap = 8; let x = gap, y = gap, rijH = 0, inner = '';
  const lijst = stukken.slice().sort((a, b)=>b - a);
  let vorigBiljet = null;
  lijst.forEach(c=>{
    const w = stukBreedte(c), h = stukHoogte(c), bi = isBiljet(c);
    if(vorigBiljet !== null && vorigBiljet !== bi && x > gap){ x = gap; y += rijH + gap; rijH = 0; }
    if(x + w > maxB - gap){ x = gap; y += rijH + gap; rijH = 0; }
    inner += bi ? geldStuk(c, x, y) : geldStuk(c, x + w / 2, y + h / 2);
    x += w + gap; rijH = Math.max(rijH, h); vorigBiljet = bi;
  });
  return svg(maxB, y + rijH + gap, inner, { label:o.label || 'geld', cls:'geldfig', b:o.bw });
}
const geldSvg = c => { const w = stukBreedte(c) + 4, h = stukHoogte(c) + 4; return svg(w, h, isBiljet(c) ? geldStuk(c, 2, 2) : geldStuk(c, w / 2, h / 2), { label:geldNaam(c), cls:'stuk' }); };
/* zo weinig mogelijk munten en biljetten (in cent) */
function gepast(cent, soorten = GELD){ const uit = []; let r = Math.round(cent); soorten.forEach(c=>{ while(r >= c){ uit.push(c); r -= c; } }); return uit; }

/* ---------- getallenas (thermometer die plat ligt) ---------- */
function getallenas(a, b, o = {}){
  const n = b - a, w = o.b || 560, m = 22, st = (w - 2 * m) / n, y = 34;
  let s = lijn(m - 8, y, w - m + 8, y, { w:2 }) + pad(`M${w - m + 8} ${y - 5} L${w - m + 16} ${y} L${w - m + 8} ${y + 5}`, { w:2 });
  for(let i = 0; i <= n; i++){ const x = m + i * st, v = a + i; s += lijn(x, y - 6, x, y + 6, { w:v === 0 ? 2.5 : 1.5 }) + tekst(x, y + 18, minN(v), { s:13, wt:v === 0 ? 800 : 600 }); }
  if(o.van != null && o.naar != null){
    const x1 = m + (o.van - a) * st, x2 = m + (o.naar - a) * st, k = o.naar >= o.van ? 'var(--ok)' : 'var(--accent-dark)';
    s += pad(`M${x1} ${y - 8} Q${(x1 + x2) / 2} ${y - 34} ${x2} ${y - 8}`, { k, w:2.5 }) + cirkel(x1, y, 5, { f:'var(--orange)', k:'var(--orange)' });
    s += tekst((x1 + x2) / 2, y - 30, (o.naar >= o.van ? '+' : '–') + Math.abs(o.naar - o.van), { s:13, f:k });
  }
  return svg(w, y + 32, s, { label:'getallenas' });
}

/* ---------- rooster met letters (horizontaal, groen) en cijfers (verticaal, rood) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOP';
/* vak = { k:'C', r:4 }; o.inhoud(k, r) geeft extra SVG voor een vak, o.vul(k, r) een vulkleur */
function letterRooster(kol, rijen, o = {}){
  const c = o.cel || 34, m = 28, W = m + kol * c + 6, H = rijen * c + m + 6;
  let s = '';
  for(let i = 0; i < kol; i++) for(let j = 0; j < rijen; j++){
    const k = LETTERS[i], r = rijen - j, x = m + i * c, y = 6 + j * c;
    const f = o.vul ? o.vul(k, r) : null;
    s += `<rect x="${x}" y="${y}" width="${c}" height="${c}" fill="${f || 'var(--card)'}" stroke="var(--border)" stroke-width="1.2" data-vak="${k}${r}" class="vak"/>`;
    if(o.inhoud) s += o.inhoud(k, r, x, y, c) || '';
  }
  s += rh(m, 6, kol * c, rijen * c, { w:1.8, k:'var(--ink-soft)' });
  for(let i = 0; i < kol; i++) s += tekst(m + i * c + c / 2, 6 + rijen * c + 13, LETTERS[i], { s:14, f:'var(--as-x)', wt:800 });
  for(let j = 0; j < rijen; j++) s += tekst(m - 13, 6 + j * c + c / 2, rijen - j, { s:14, f:'var(--as-y)', wt:800 });
  return svg(W, H, s, { label:'rooster', cls:'rooster' + (o.cls ? ' ' + o.cls : ''), b:o.b });
}

/* ---------- assenstelsel: x-as groen, y-as rood ----------
   o = { min, max, cel, punten:[{n, x, y}], lijnen:[[x1,y1,x2,y2]], veelhoek:[[x,y],...] } */
function assenstelsel(o = {}){
  const mn = o.min == null ? -5 : o.min, mx = o.max == null ? 5 : o.max, c = o.cel || 30, n = mx - mn, m = 24;
  const W = n * c + 2 * m + 18, H = n * c + 2 * m + 12;
  const X0 = m + (0 - mn) * c, Y0 = m + 12 + (mx - 0) * c;
  const px = x => m + (x - mn) * c, py = y => m + 12 + (mx - y) * c;
  let s = '';
  for(let i = 0; i <= n; i++){ s += lijn(px(mn + i), py(mx), px(mn + i), py(mn), { k:'var(--border)', w:1 }) + lijn(px(mn), py(mn + i), px(mx), py(mn + i), { k:'var(--border)', w:1 }); }
  /* x-as groen, y-as rood, met pijl en naam */
  s += lijn(px(mn) - 6, Y0, px(mx) + 12, Y0, { k:'var(--as-x)', w:2.4 }) + pad(`M${px(mx) + 6} ${Y0 - 5} L${px(mx) + 14} ${Y0} L${px(mx) + 6} ${Y0 + 5}`, { k:'var(--as-x)', w:2.4 });
  s += lijn(X0, py(mn) + 6, X0, py(mx) - 14, { k:'var(--as-y)', w:2.4 }) + pad(`M${X0 - 5} ${py(mx) - 8} L${X0} ${py(mx) - 16} L${X0 + 5} ${py(mx) - 8}`, { k:'var(--as-y)', w:2.4 });
  s += tekst(px(mx) + 14, Y0 + 15, 'x', { s:15, f:'var(--as-x)', wt:800, st:'font-style:italic' }) + tekst(X0 - 13, py(mx) - 14, 'y', { s:15, f:'var(--as-y)', wt:800, st:'font-style:italic' });
  for(let v = mn; v <= mx; v++){ if(v === 0) continue;
    s += tekst(px(v), Y0 + 13, minN(v), { s:11.5, f:'var(--as-x)', wt:700 });
    s += tekst(X0 - 9, py(v), minN(v), { s:11.5, f:'var(--as-y)', wt:700, a:'end' }); }
  s += tekst(X0 - 8, Y0 + 12, '0', { s:11.5, wt:700, a:'end' });
  (o.veelhoeken || []).forEach(v=>{ s += veelhoek(v.p.map(([x, y])=>[px(x), py(y)]), { k:v.k || 'var(--accent-dark)', f:v.f || 'none', w:2.2 }); });
  (o.lijnen || []).forEach(([x1, y1, x2, y2, k])=>{ s += lijn(px(x1), py(y1), px(x2), py(y2), { k:k || 'var(--accent-dark)', w:2.2 }); });
  (o.punten || []).forEach(p=>{ s += cirkel(px(p.x), py(p.y), 4.5, { f:p.k || 'var(--ink)', k:p.k || 'var(--ink)' }) + (p.n ? tekst(px(p.x) + 9, py(p.y) - 10, p.n, { s:14, a:'start', f:p.k || 'var(--ink)' }) : ''); });
  return { html:svg(W, H, s + (o.extra ? o.extra(px, py) : ''), { label:'assenstelsel', cls:'assen', b:o.b }), px, py, W, H, c, mn, mx };
}
const coord = (n, x, y) => `${n}(${minN(x)},${minN(y)})`;

/* ============================================================
   MOTOR: kaarten met nieuwe opgave, controle, hints, oplossing, toon mij hoe
   ============================================================
   Een kaart: K({ id, titel, niv:1|2|3, maak(R) }) met niv 1 = basis, 2 = oefenen, 3 = verdieping.
   maak(R) geeft { tekst, fig, vragen:[...], sol, toon:[stappen], q2, figRechts }.
   Een vraag: { t, a, soort:'getal'|'tekst'|'keuze'|'multi'|'eigen', voor, na, w, keuzes, geld, hint:[{t, a, voor, na, meer}], uitleg }.
   Staat in de tekst of figuur een <span data-v="i"></span>, dan komt het invulvak van vraag i daar.
   Het aantal vragen van een kaart ligt vast (het dashboard telt ze). */
const KAARTEN = {};
const K = def => { KAARTEN[def.id] = def; return def; };
const NIV = { 1:['basis', 'l1'], 2:['oefenen', 'l2'], 3:['verdieping', 'l3'] };
const maakKaart = (kid, seed) => { const inst = KAARTEN[kid].maak(RNG(seed)); inst.vragen = inst.vragen || []; return inst; };

/* ---------- één invulvak, keuze of eigen vraag ---------- */
function vraagInvoer(v, val, zet, o = {}){
  const box = el('span', 'vin');
  if(v.soort === 'keuze' || v.soort === 'multi'){
    const ch = el('span', 'choices kz' + (v.kol ? ' kol' : ''));
    const opts = v.keuzes.map((k, i)=>{
      const b = knop('opt', k, ()=>{ if(box.dataset.dicht) return;
        if(v.soort === 'keuze'){ zet(i); opts.forEach((x, j)=>x.classList.toggle('chosen', j === i)); }
        else { const cur = new Set(Array.isArray(box._val) ? box._val : []); cur.has(i) ? cur.delete(i) : cur.add(i); const arr = [...cur].sort((a, b)=>a - b); box._val = arr; zet(arr); b.classList.toggle('chosen', cur.has(i)); b.setAttribute('aria-pressed', String(cur.has(i))); }
      });
      if(v.soort === 'keuze' ? val === i : Array.isArray(val) && val.includes(i)) b.classList.add('chosen');
      ch.append(b); return b;
    });
    box._val = val; box.append(ch); box._opts = opts;
    box._markeer = (ok, juistTonen)=>{ opts.forEach((b, j)=>{ const juist = v.soort === 'keuze' ? j === v.a : v.a.includes(j); const gek = b.classList.contains('chosen');
      b.classList.toggle('good', gek && juist); b.classList.toggle('wrong', gek && !juist);
      if(juistTonen && juist && !gek){ b.classList.add('chosen', 'good', 'gemist'); } }); };
    box._wis = ()=>opts.forEach(b=>b.classList.remove('good', 'wrong'));
    return box;
  }
  if(v.soort === 'eigen'){ v.eigen.maak(box, val, zet); box._markeer = ok=>{ box.classList.toggle('e-ok', ok); box.classList.toggle('e-bad', !ok); }; box._wis = ()=>box.classList.remove('e-ok', 'e-bad'); return box; }
  if(v.voor) box.append(el('span', 'unit voor', v.voor));
  const inp = el('input', 'inp ' + (v.w || (v.soort === 'tekst' ? 'md' : 'xs'))); inp.autocomplete = 'off'; inp.spellcheck = false;
  if(v.soort !== 'tekst') inp.inputMode = 'decimal';
  inp.setAttribute('aria-label', v.label || String(v.t || 'antwoord').replace(/<[^>]+>/g, '').slice(0, 80) || 'antwoord');
  if(val != null) inp.value = val;
  inp.addEventListener('input', ()=>{ zet(inp.value); inp.classList.remove('ok', 'bad'); });
  if(o.enter) inp.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); o.enter(); } });
  box.append(inp); if(v.na) box.append(el('span', 'unit na', v.na));
  box._inp = inp;
  box._markeer = ok=>{ inp.classList.toggle('ok', ok); inp.classList.toggle('bad', !ok); };
  box._wis = ()=>inp.classList.remove('ok', 'bad');
  return box;
}
const leeg = (v, val) => val == null || val === '' || (Array.isArray(val) && !val.length && v.soort !== 'multi');
function vraagJuist(v, val){
  if(v.soort === 'keuze') return val === v.a;
  if(v.soort === 'multi') return Array.isArray(val) && val.length === v.a.length && v.a.every(x=>val.includes(x));
  if(v.soort === 'eigen') return !!v.eigen.check(val);
  return zelfde(val, v.a);
}
const antwTekst = v => {
  if(v.toonA) return v.toonA;
  if(v.soort === 'keuze') return v.keuzes[v.a].replace(/<[^>]+>/g, '');
  if(v.soort === 'multi') return v.a.map(i=>v.keuzes[i].replace(/<[^>]+>/g, '')).join(', ');
  if(v.soort === 'eigen') return v.eigen.tekst || '';
  const a = Array.isArray(v.a) ? v.a[0] : v.a;
  return (v.voor ? v.voor + ' ' : '') + (typeof a === 'number' ? (v.geld ? nf(a, 2) : nf(a)) : a) + (v.na ? ' ' + v.na : '');
};
/* bedrag met twee cijfers na de komma? */
const tweeDec = s => !/[.,]/.test(String(s).trim()) || /[.,]\d\d\s*$/.test(String(s).trim());

/* een juist antwoord voor een vraag (enkel voor de testscripts) */
function voorbeeldAntw(v){
  if(v.soort === 'keuze' || v.soort === 'multi') return v.a;
  if(v.soort === 'eigen' || v.voorbeeld != null) return v.voorbeeld;
  let a = Array.isArray(v.a) ? v.a[0] : v.a; if(a && typeof a === 'object' && a.min != null) a = Math.round((a.min + a.max) / 2);
  return typeof a === 'number' ? String(a).replace('.', ',') : a;
}

/* ---------- invulbare hint: tussenstappen met eigen vakjes ---------- */
function hintBlok(stappen, titel){
  const box = el('div', 'hint'); box.hidden = true;
  box.append(el('p', 'hint-kop', titel || '💡 <b>Hint</b>: reken stap voor stap. Je kan elke stap apart controleren.'));
  stappen.forEach((s, i)=>{
    const r = el('div', 'hstap'); r.append(el('span', 'hnr', String(i + 1)));
    const inh = el('div', 'hinh'); inh.append(el('div', 'hv', s.t));
    if(s.a != null){
      const rijE = el('div', 'hrij'); const vv = { a:s.a, voor:s.voor, na:s.na, w:s.w || (typeof s.a === 'string' || (Array.isArray(s.a) && typeof s.a[0] === 'string') ? 'md' : 'xs'), soort:typeof s.a === 'string' ? 'tekst' : 'getal', label:'hint stap ' + (i + 1) };
      let val = ''; const fb = el('span', 'fb');
      const ctl = ()=>{ const ok = zelfde(val, s.a); inv._markeer(ok); fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.textContent = ok ? 'Juist!' : 'Nog niet juist.'; };
      const inv = vraagInvoer(vv, '', x=>{ val = x; fb.textContent = ''; }, { enter:ctl });
      rijE.append(inv, knop('btn ghost klein', 'Controleer', ctl), fb); inh.append(rijE);
    }
    if(s.meer){ const m = el('div', 'meer', s.meer); m.hidden = true; inh.append(knop('linkbtn', '🔍 Meer uitleg', ()=>{ m.hidden = !m.hidden; }), m); }
    r.append(inh); box.append(r);
  });
  return box;
}

/* ---------- toon mij hoe: stappen met vorige en volgende (speelt niet vanzelf af) ---------- */
function toonBlok(stappen){
  const box = el('div', 'toon'); box.hidden = true; let i = 0;
  const kop = el('div', 'toon-kop'), inh = el('div', 'toon-inh');
  const vor = knop('btn ghost klein', '◀ Vorige', ()=>{ if(i > 0){ i--; teken(); } }), vol = knop('btn klein', 'Volgende ▶', ()=>{ if(i < stappen.length - 1){ i++; teken(); } });
  const nr = el('span', 'toon-nr');
  kop.append(el('b', '', 'Zo doe je het'), nr, vor, vol);
  box.append(kop, inh);
  function teken(){ inh.innerHTML = stappen[i]; nr.textContent = `stap ${i + 1} van ${stappen.length}`; vor.disabled = i === 0; vol.disabled = i === stappen.length - 1; }
  box._open = ()=>{ i = 0; teken(); };
  return box;
}

/* ---------- één kaart ----------
   o.sec = onderdeel-id, o.nr = kaartnummer (voor de titel), o.telt = vragen tellen voor het dashboard */
function kaartEl(sec, kid, o = {}){
  const def = KAARTEN[kid]; const key = 'k_' + kid, telt = o.telt !== false;
  const card = el('div', 'card kaart'); card.dataset.kaart = kid;
  let st = lees(key);
  if(!st || !st.seed){ st = { seed:nieuwZaad(), v:{}, ok:{} }; bewaar(key, st); }
  const save = ()=>bewaar(key, st);
  function teken(){
    card.innerHTML = '';
    const inst = maakKaart(kid, st.seed), vr = inst.vragen, fbV = [];
    const [nivT, nivC] = NIV[def.niv || 2];
    const head = el('div', 'card-head', `<h3>${def.titel}<span class="lvl-badge ${nivC}">${nivT}</span></h3>`);
    const rb = knop('refresh-btn', '↻ Nieuwe opgave', ()=>{ st = { seed:nieuwZaad(), v:{}, ok:{} }; save(); teken(); });
    rb.title = 'Dezelfde oefening met nieuwe getallen'; head.append(rb); card.append(head);
    const body = el('div', 'kbody' + (inst.fig && !inst.boven ? ' met-fig' : '') + (inst.figRechts ? ' fig-rechts' : '') + (inst.breed ? ' breed' : ''));
    if(inst.fig){ const f = el('div', 'kfig', inst.fig); body.append(f); }
    const main = el('div', 'kmain'); body.append(main);
    if(inst.tekst) main.append(el('div', 'ktekst', inst.tekst));
    const lijst = el('div', 'vragen' + (inst.q2 ? ' q2' : '') + (inst.q3 ? ' q3' : ''));
    main.append(lijst); card.append(body);
    const invs = [];
    vr.forEach((v, i)=>{
      if(telt) CLvraag(`${sec}_${kid}_${i}`);
      const inv = vraagInvoer(v, st.v[i], x=>{ st.v[i] = x; delete st.ok[i]; save(); fbV[i] && (fbV[i].textContent = ''); }, { enter:()=>controle() });
      invs.push(inv);
      const slot = card.querySelector(`[data-v="${i}"]`);
      if(slot){ slot.append(inv); slot.classList.add('slot'); return; }
      const q = el('div', 'q');
      if(v.t != null && v.t !== ''){ const qt = el('div', 'q-text' + (v.soort === 'keuze' || v.soort === 'multi' || v.soort === 'eigen' || v.blok ? ' block' : ''), `<span class="qt">${v.t}</span>`); if(v.soort === 'keuze' || v.soort === 'multi' || v.soort === 'eigen' || v.blok){ q.append(qt); q.append(inv); } else { qt.append(inv); q.append(qt); } }
      else q.append(inv);
      if(v.hint){ const hb = hintBlok(v.hint); q.append(knop('linkbtn hintlink', '💡 Hint', ()=>{ hb.hidden = !hb.hidden; }), hb); }
      const f = el('div', 'fb vfb'); fbV[i] = f; q.append(f);
      lijst.append(q);
    });
    const act = el('div', 'q-act'), fb = el('div', 'fb kfb');
    act.append(knop('btn', 'Controleer', ()=>controle()));
    const ib = knop('btn ghost ibn-btn', '🤔 Ik begrijp het niet', ()=>ikBegrijpHetNiet(kid, st.seed, ib)); ib.title = 'Uitleg en een opgelost voorbeeld met andere getallen'; act.append(ib);
    let hb = null, tb = null;
    if(inst.hint && def.niv !== 3){ hb = hintBlok(inst.hint); act.append(knop('btn ghost', '💡 Hint', ()=>{ hb.hidden = !hb.hidden; })); }
    if(inst.toon){ tb = toonBlok(inst.toon); act.append(knop('btn ghost demo-btn', '▶ Toon mij hoe', ()=>{ tb.hidden = !tb.hidden; if(!tb.hidden) tb._open(); })); }
    const sol = el('div', 'sol', inst.sol || vr.map((v, i)=>`${vr.length > 1 ? (i + 1) + '. ' : ''}${antwTekst(v)}`).join('<br>')); sol.hidden = true;
    const sl = knop('linkbtn', 'Toon oplossing', ()=>{ sol.hidden = !sol.hidden; sl.textContent = sol.hidden ? 'Toon oplossing' : 'Verberg oplossing'; });
    sl.hidden = !st.n; act.append(sl);
    main.append(act, fb); if(hb) main.append(hb); main.append(sol); if(tb) card.append(tb);
    function controle(){
      let nJ = 0, nL = 0, geldTip = false;
      vr.forEach((v, i)=>{
        const val = st.v[i]; invs[i]._wis();
        if(leeg(v, val)){ nL++; return; }
        const ok = vraagJuist(v, val); st.ok[i] = ok ? 1 : 0; invs[i]._markeer(ok);
        if(ok) nJ++; else if(v.uitleg && fbV[i]){ fbV[i].className = 'fb vfb bad'; fbV[i].innerHTML = v.uitleg; }
        if(ok && v.geld && !tweeDec(val)) geldTip = true;
        if(telt) CLres(`${sec}_${kid}_${i}`, ok);
      });
      st.n = (st.n || 0) + 1; save(); sl.hidden = false;
      const n = vr.length;
      if(nL === n){ fb.className = 'fb kfb bad'; fb.textContent = 'Vul eerst je antwoord' + (n > 1 ? 'en' : '') + ' in.'; return; }
      if(nJ === n){ fb.className = 'fb kfb ok'; fb.innerHTML = 'Juist!' + (n > 2 ? ' Alles klopt.' : '') + (geldTip ? ' <span class="tipje">Tip: bij een bedrag in euro schrijf je twee cijfers na de komma, bv. 12,50.</span>' : ''); }
      else { fb.className = 'fb kfb bad'; fb.innerHTML = 'Nog niet juist.' + (n > 1 ? ` ${nJ} van de ${n} antwoorden ${nJ === 1 ? 'is' : 'zijn'} juist.` : '') + (nL ? ` Nog ${nL} leeg.` : '') + ((hb || vr.some(v=>v.hint)) && nJ < n ? ' Probeer opnieuw of klik op <b>💡 Hint</b>.' : ' Probeer opnieuw.') + (geldTip ? ' <span class="tipje">Tip: bij een bedrag in euro schrijf je twee cijfers na de komma.</span>' : ''); }
    }
    /* bewaarde controle opnieuw tonen */
    vr.forEach((v, i)=>{ if(st.ok[i] != null && !leeg(v, st.v[i])) invs[i]._markeer(!!st.ok[i]); });
    if(inst.mount) inst.mount(card);
    if(o.na) o.na(card, inst);
  }
  card._vulJuist = ()=>{ const inst = maakKaart(kid, st.seed); st.v = {}; inst.vragen.forEach((v, i)=>{ st.v[i] = voorbeeldAntw(v); }); save(); teken(); };
  teken();
  return card;
}

/* ---------- Ik begrijp het niet: uitleg en een opgelost voorbeeld met andere getallen ----------
   De uitleg per kaart staat in m<n>/60_uitleg.js: UITLEG({ kaartid:'html', ... }).
   Het voorbeeld is dezelfde kaart met een ander zaadgetal: nooit de opgave die de leerling voor zich heeft.
   Er wordt niets bewaard en niets doorgegeven aan het dashboard. */
const UITLEG = o => Object.entries(o).forEach(([k, u])=>{ if(KAARTEN[k]) KAARTEN[k].uitleg = u; });
const vingerafdruk = inst => JSON.stringify([inst.tekst, inst.fig, inst.vragen.map(v=>[v.t, String(v.a), v.voorbeeld, v.keuzes])]);
function voorbeeldZaad(kid, seed, ook){
  const weg = new Set([vingerafdruk(maakKaart(kid, seed))].concat(ook || []));
  let z = null; for(let p = 0; p < 30; p++){ z = nieuwZaad(); if(!weg.has(vingerafdruk(maakKaart(kid, z)))) return z; }
  return z;
}
/* een kaart in leesstand: alle antwoorden ingevuld en groen, met de uitgewerkte oplossing */
function voorbeeldBlok(kid, z){
  const inst = maakKaart(kid, z), vr = inst.vragen;
  const box = el('div', 'kaart vb-kaart');
  const body = el('div', 'kbody' + (inst.fig && !inst.boven ? ' met-fig' : '') + (inst.figRechts ? ' fig-rechts' : '') + (inst.breed ? ' breed' : ''));
  if(inst.fig) body.append(el('div', 'kfig', inst.fig));
  const main = el('div', 'kmain'); body.append(main);
  if(inst.tekst) main.append(el('div', 'ktekst', inst.tekst));
  const lijst = el('div', 'vragen' + (inst.q2 ? ' q2' : '') + (inst.q3 ? ' q3' : '')); main.append(lijst); box.append(body);
  vr.forEach((v, i)=>{
    const inv = vraagInvoer(v, voorbeeldAntw(v), ()=>{}); inv.dataset.dicht = '1'; if(inv._inp){ inv._inp.readOnly = true; inv._inp.tabIndex = -1; }
    inv._markeer(true); inv.classList.add('vb-vin');
    const slot = box.querySelector(`[data-v="${i}"]`);
    if(slot){ slot.append(inv); slot.classList.add('slot'); return; }
    const q = el('div', 'q'), blok = v.soort === 'keuze' || v.soort === 'multi' || v.soort === 'eigen' || v.blok;
    if(v.t != null && v.t !== ''){ const qt = el('div', 'q-text' + (blok ? ' block' : ''), `<span class="qt">${v.t}</span>`); if(blok) q.append(qt, inv); else { qt.append(inv); q.append(qt); } }
    else q.append(inv);
    if(v.soort === 'eigen' && v.eigen.tekst) q.append(el('div', 'vb-antw', 'Antwoord: <b>' + v.eigen.tekst + '</b>'));
    lijst.append(q);
  });
  main.append(el('div', 'sol vb-sol', '<b>Zo los je het op</b><br>' + (inst.sol || vr.map((v, i)=>`${vr.length > 1 ? (i + 1) + '. ' : ''}${antwTekst(v)}`).join('<br>'))));
  if(inst.mount){ try{ inst.mount(box); }catch(e){} }
  return box;
}
function ikBegrijpHetNiet(kid, seed, terug){
  const def = KAARTEN[kid], gezien = [];
  const ov = el('div', 'ibn-over'), v = el('div', 'ibn-venster');
  v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Uitleg bij ' + def.titel); v.tabIndex = -1;
  const kop = el('div', 'ibn-kop', `<h2>🤔 Uitleg bij: ${def.titel}</h2>`);
  const sluit = ()=>{ ov.remove(); document.body.classList.remove('ibn-open'); document.removeEventListener('keydown', esc); try{ terug && terug.focus(); }catch(e){} };
  const esc = e=>{ if(e.key === 'Escape') sluit(); };
  kop.append(knop('ibn-x', '✕', sluit));
  const uit = el('div', 'ibn-uitleg', '<h3>Zo werkt het</h3>' + (def.uitleg || '<p>Lees de opgave rustig. Zoek welke gegevens je nodig hebt en kijk naar het voorbeeld hieronder.</p>'));
  const vbKop = el('div', 'ibn-vbkop', '<h3>Een voorbeeld</h3><p>Dit is een <b>andere opgave</b> van dezelfde soort, al opgelost. Je eigen oefening los je daarna zelf op.</p>');
  const vbVak = el('div', 'ibn-vb');
  const nog = knop('btn ghost', '↻ Nog een voorbeeld', ()=>toonVb());
  const terugKnop = knop('btn', 'Terug naar mijn oefening', sluit);
  const voet = el('div', 'ibn-voet'); voet.append(nog, terugKnop);
  function toonVb(){ const z = voorbeeldZaad(kid, seed, gezien); gezien.push(vingerafdruk(maakKaart(kid, z))); vbVak.innerHTML = ''; vbVak.append(voorbeeldBlok(kid, z)); vbVak.scrollTop = 0; }
  v.append(kop, uit, vbKop, vbVak, voet); ov.append(v);
  ov.addEventListener('click', e=>{ if(e.target === ov) sluit(); });
  document.addEventListener('keydown', esc);
  document.body.append(ov); document.body.classList.add('ibn-open'); toonVb(); v.focus();
  return v;
}

/* ---------- eenvoudige rekenmachine (zwevend venster) ---------- */
let RM = null;
function rekenmachine(){
  if(RM){ RM.hidden = !RM.hidden; return; }
  const p = el('div', 'rm-venster'); p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'rekenmachine');
  const balk = el('div', 'rm-balk', '<span>Rekenmachine</span>'); balk.append(knop('rm-x', '✕', ()=>{ p.hidden = true; }));
  const sch = el('div', 'rm-scherm'), som = el('div', 'rm-som'), uit = el('div', 'rm-uit', '0'); sch.append(som, uit);
  const keys = el('div', 'rm-keys');
  let expr = '', klaar = false;
  const toon = ()=>{ som.textContent = expr.replace(/\*/g, ' x ').replace(/\//g, ' : ').replace(/\+/g, ' + ').replace(/-/g, ' − ').replace(/\./g, ','); };
  const reken = e=>{ if(!/^[\d.+\-*/() ]+$/.test(e)) return NaN; try{ const r = Function('"use strict";return (' + e + ')')(); return isFinite(r) ? r : NaN; }catch(x){ return NaN; } };
  const druk = k=>{
    if(k === 'C'){ expr = ''; uit.textContent = '0'; klaar = false; toon(); return; }
    if(k === '⌫'){ expr = expr.slice(0, -1); toon(); return; }
    if(k === '='){ const r = reken(expr); uit.textContent = isNaN(r) ? 'Fout' : nf(rnd(r, 8)); klaar = !isNaN(r); if(klaar) RM._ans = rnd(r, 8); return; }
    const op = '+-*/'.includes(k);
    if(klaar){ expr = op ? String(RM._ans) : ''; klaar = false; }
    if(k === ',') k = '.';
    expr += k; toon();
  };
  [['7','7'],['8','8'],['9','9'],[':','/'],['4','4'],['5','5'],['6','6'],['x','*'],['1','1'],['2','2'],['3','3'],['−','-'],['0','0'],[',',','],['=','='],['+','+'],['C','C'],['⌫','⌫'],['(','('],[')',')']].forEach(([t, k])=>{
    keys.append(knop('rm-k' + ('/*-+'.includes(k) ? ' op' : '') + (k === '=' ? ' is' : ''), t, ()=>druk(k))); });
  p.append(balk, sch, keys); document.body.append(p); RM = p;
  p.addEventListener('keydown', e=>{ const m = { Enter:'=', Backspace:'⌫', Escape:'C', '*':'*', '/':'/', x:'*' }; let k = m[e.key] || e.key; if('0123456789+-*/.,()=⌫C'.includes(k) && k.length === 1 || k === '⌫'){ e.preventDefault(); druk(k); } });
  p.tabIndex = -1;
  /* verslepen aan de balk */
  let sx, sy, ox, oy;
  balk.addEventListener('pointerdown', e=>{ if(e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; const r = p.getBoundingClientRect(); ox = r.left; oy = r.top; balk.setPointerCapture(e.pointerId); });
  balk.addEventListener('pointermove', e=>{ if(sx == null) return; p.style.left = Math.max(0, Math.min(innerWidth - 60, ox + e.clientX - sx)) + 'px'; p.style.top = Math.max(0, Math.min(innerHeight - 40, oy + e.clientY - sy)) + 'px'; p.style.right = 'auto'; p.style.bottom = 'auto'; });
  balk.addEventListener('pointerup', ()=>{ sx = null; });
  p.focus();
}

/* ---------- eigen vraag: betalen met munten en biljetten (klikken) ----------
   doel in cent; o.min: zo weinig mogelijk stukken vereist; o.soorten: welke munten en biljetten aanklikbaar zijn */
function geldKlik(doel, o = {}){
  const soorten = o.soorten || GELD.filter(c=>c <= Math.max(doel * 2, 500) && c >= (o.kleinste || 1));
  const minimaal = gepast(doel).length;
  return { soort:'eigen', blok:true, t:o.t || '', voorbeeld:(o.oplossing || gepast(doel)).slice(),
    toonA:(o.oplossing || gepast(doel)).map(geldNaam).join(' + '),
    eigen:{
      tekst:(o.oplossing || gepast(doel)).map(geldNaam).join(' + '),
      maak(box, val, zet){
        let lijst = Array.isArray(val) ? val.slice() : [];
        const bak = el('div', 'gk-bak'), tot = el('div', 'gk-tot'), kies = el('div', 'gk-kies');
        soorten.forEach(c=>{ const b = knop('gk-stuk', geldSvg(c), ()=>{ if(box.dataset.dicht) return; lijst.push(c); lijst.sort((a, b)=>b - a); zet(lijst.slice()); teken(); }); b.title = geldNaam(c) + ' toevoegen'; b.setAttribute('aria-label', geldNaam(c) + ' toevoegen'); kies.append(b); });
        function teken(){
          bak.innerHTML = ''; box.classList.remove('e-ok', 'e-bad');
          if(!lijst.length) bak.append(el('span', 'gk-leeg', 'Klik hieronder op munten en biljetten.'));
          lijst.forEach((c, i)=>{ const b = knop('gk-stuk in', geldSvg(c), ()=>{ lijst.splice(i, 1); zet(lijst.slice()); teken(); }); b.title = 'Klik om terug te leggen'; b.setAttribute('aria-label', geldNaam(c) + ' terugleggen'); bak.append(b); });
          tot.innerHTML = `Samen: <b>${eur(som(lijst) / 100)}</b> · ${lijst.length} ${lijst.length === 1 ? 'stuk' : 'stukken'}`;
        }
        box.append(el('div', 'gk-lbl', 'Jouw geld:'), bak, tot, el('div', 'gk-lbl', 'Kies:'), kies); teken();
      },
      check(val){ return Array.isArray(val) && som(val) === doel && (o.aantal ? val.length === o.aantal : (o.min === false || val.length === minimaal)); }
    },
    uitleg:o.aantal ? `Kijk na: is het samen ${eur(doel / 100)}? Gebruik je precies ${o.aantal} munten?` : o.min === false ? 'Het bedrag klopt nog niet.' : 'Kijk na: klopt het bedrag? Gebruik je zo weinig mogelijk munten en biljetten? Begin met het grootste biljet dat past.'
  };
}

/* ============================================================
   KLIKVRAGEN: vakken in een rooster, punten in een assenstelsel (module 3 en 4)
   ============================================================ */
const vakA = (k, r) => [`${k}${r}`, `${k.toLowerCase()}${r}`, `${k} ${r}`, `${k.toLowerCase()} ${r}`];
const vakT = (k, r) => `<span class="vk"><span class="cx">${k}</span><span class="cy">${r}</span></span>`;
/* ---------- eigen vraag: vakken aanklikken in een letterrooster ---------- */
function klikVakken(kol, rijen, juist, o = {}){
  const J = new Set(juist);
  return { soort:'eigen', blok:true, t:o.t || '', voorbeeld:juist.slice(), toonA:juist.join(', '),
    eigen:{ tekst:juist.join(', '),
      maak(box, val, zet){
        let sel = new Set(Array.isArray(val) ? val : []); const wrap = el('div', 'e-rand'); const lijst = el('div', 'gk-tot');
        function teken(){ wrap.innerHTML = letterRooster(kol, rijen, { cel:o.cel || 30, cls:'klikfig', vul:(k, r)=>sel.has(k + r) ? 'var(--orange)' : (o.vul ? o.vul(k, r) : null), inhoud:o.inhoud });
          lijst.innerHTML = sel.size ? 'Aangeklikt: <b>' + [...sel].sort().join(', ') + '</b>' : 'Klik op de vakken.'; }
        wrap.addEventListener('click', e=>{ const r = e.target.closest('[data-vak]'); if(!r || box.dataset.dicht) return; const v = r.dataset.vak; sel.has(v) ? sel.delete(v) : sel.add(v); zet([...sel]); box.classList.remove('e-ok', 'e-bad'); teken(); });
        teken(); box.append(wrap, lijst);
      },
      check(val){ return Array.isArray(val) && val.length === J.size && val.every(v=>J.has(v)); } },
    uitleg:o.uitleg || 'Kijk nog eens: klik juist de vakken aan die gevraagd worden, niet meer en niet minder.' };
}

/* ---------- eigen vraag: punten plaatsen in een assenstelsel ----------
   doel = [{ n:'A', x, y }, ...]; de leerling kiest een letter en klikt op een roosterpunt */
function puntenZetten(doel, o = {}){
  const mn = o.min == null ? -5 : o.min, mx = o.max == null ? 5 : o.max;
  return { soort:'eigen', blok:true, t:o.t || '', voorbeeld:Object.fromEntries(doel.map(p=>[p.n, [p.x, p.y]])), toonA:doel.map(p=>coord(p.n, p.x, p.y)).join(' '),
    eigen:{ tekst:doel.map(p=>coord(p.n, p.x, p.y)).join(' '),
      maak(box, val, zet){
        let pos = Object.assign({}, val || {}); let cur = doel.find(p=>!pos[p.n]) || doel[0];
        const knoppen = el('div', 'pz-knoppen'), wrap = el('div', 'e-rand pz-fig');
        function teken(){
          knoppen.innerHTML = '';
          knoppen.append(el('span', 'gk-lbl', 'Kies een punt en klik in het assenstelsel:'));
          doel.forEach(p=>{ const b = knop('opt pz-k' + (p === cur ? ' chosen' : ''), p.n + (pos[p.n] ? ` <small>(${minN(pos[p.n][0])},${minN(pos[p.n][1])})</small>` : ''), ()=>{ cur = p; teken(); }); knoppen.append(b); });
          knoppen.append(knop('linkbtn', 'Wis alles', ()=>{ pos = {}; zet({}); cur = doel[0]; box.classList.remove('e-ok', 'e-bad'); teken(); }));
          const A = assenstelsel({ min:mn, max:mx, cel:o.cel || 28, punten:Object.entries(pos).map(([n, [x, y]])=>({ n, x, y, k:'var(--orange)' })), lijnen:o.lijnen ? o.lijnen(pos) : [] });
          wrap.innerHTML = A.html; wrap._A = A;
        }
        wrap.addEventListener('click', e=>{
          if(box.dataset.dicht) return; const s = wrap.querySelector('svg'); if(!s) return; const A = wrap._A;
          const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(s.getScreenCTM().inverse());
          const x = Math.round((q.x - A.px(0)) / A.c), y = Math.round((A.py(0) - q.y) / A.c);
          if(x < mn || x > mx || y < mn || y > mx) return;
          pos[cur.n] = [x, y]; zet(Object.assign({}, pos)); box.classList.remove('e-ok', 'e-bad');
          const volgende = doel.find(p=>!pos[p.n]); if(volgende) cur = volgende; teken();
        });
        wrap.classList.add('klikfig'); teken(); box.append(knoppen, wrap);
      },
      check(val){ return !!val && doel.every(p=>val[p.n] && val[p.n][0] === p.x && val[p.n][1] === p.y); } },
    uitleg:'Kijk na: eerst de x-coördinaat (groen, horizontaal), dan de y-coördinaat (rood, verticaal).' };
}


const PUNT_N = 'ABCDEFGH';
function willekeurigePunten(R, n, mn, mx, o = {}){ const uit = []; let p = 0; while(uit.length < n && p < 500){ p++; const x = R.int(mn, mx), y = R.int(mn, mx); if(o.nietNul && (x === 0 || y === 0)) continue; if(uit.some(q=>q.x === x && q.y === y)) continue; uit.push({ n:PUNT_N[uit.length], x, y }); } return uit; }
const coordA = p => { const v = [`${p.n}(${p.x},${p.y})`, `(${p.x},${p.y})`, `${p.x},${p.y}`, `${p.n}(${p.x};${p.y})`, `(${p.x};${p.y})`, `${p.x};${p.y}`]; return v.concat(v.map(s=>s.replace(/,/g, ', ').replace(/;/g, '; '))).concat(v.map(s=>s.toLowerCase())); };
const leesCoord = s => String(s || '').replace(/[−–]/g, '-').replace(/\s/g, '').replace(/^[a-z]/i, '').toLowerCase();
function coordVraag(p, o = {}){ return { t:o.t || `${p.n}(`, a:new RegExp('^(' + p.n.toLowerCase() + ')?\\(?' + p.x + '[,;]' + p.y + '\\)?$'), voorbeeld:`${p.x},${p.y}`, soort:'tekst', w:'xs', na:o.t ? '' : ')', label:'coördinaten van ' + p.n, toonA:coord(p.n, p.x, p.y), coordV:true, uitleg:'Eerst x (groen, horizontaal), dan y (rood, verticaal). Schrijf bv. 3,-2.' }; }

const FIG = [
  ['rechthoek', R=>{ const x = R.int(-4, 0), y = R.int(-4, 0), w = R.int(3, 5), h = R.int(2, 4); return [[x, y + h], [x + w, y + h], [x + w, y], [x, y]]; }],
  ['vierkant', R=>{ const x = R.int(-4, 0), y = R.int(-4, 0), w = R.int(2, 4); return [[x, y + w], [x + w, y + w], [x + w, y], [x, y]]; }],
  ['parallellogram', R=>{ const x = R.int(-4, -1), y = R.int(-3, 0), w = R.int(3, 4), h = R.int(2, 3), s = R.int(1, 2); return [[x + s, y + h], [x + s + w, y + h], [x + w, y], [x, y]]; }],
  ['ruit', R=>{ const x = R.int(-2, 1), y = R.int(-1, 1), a = R.int(2, 3), b = R.int(1, 2); return [[x, y + b], [x + a, y], [x, y - b], [x - a, y]]; }],
  ['trapezium', R=>{ const x = R.int(-4, -2), y = R.int(-3, 0), w = R.int(5, 6), h = R.int(2, 3); return [[x + 1, y + h], [x + w - 2, y + h], [x + w, y], [x, y]]; }]
];

/* ============================================================
   PROEFTOETS (telt via CLtoets) en SNELLE QUIZ (telt niet mee)
   ============================================================ */
const niveauVan = r => r >= .9 ? 'prima' : r >= .7 ? 'goed' : r >= .5 ? 'voldoende' : 'nog niet voldoende';

/* TOETS = { titel, intro, kaarten:[kid, ...], kan:{ kid:'Ik-kan-zin' } }: elke kaart wordt een vraag; elk invulvak is één punt.
   Na het verbeteren: Dit kan je al / Dit oefen je nog best, met de Ik-kan-zinnen van het werkboek en een knop Oefen dit. */
function toetsPaneel(TOETS){
  const key = 'toets', pane = el('div', 'proeftoets');
  function teken(){
    pane.innerHTML = '';
    let st = lees(key);
    if(!st || !st.seeds || TOETS.kaarten.some(k=>!st.seeds[k])){ st = { seeds:{}, v:{}, klaar:false }; TOETS.kaarten.forEach(k=>st.seeds[k] = nieuwZaad()); bewaar(key, st); }
    const save = ()=>bewaar(key, st);
    const items = TOETS.kaarten.map(k=>({ k, inst:maakKaart(k, st.seeds[k]) }));
    const n = som(items.map(it=>it.inst.vragen.length));
    pane.append(el('div', 'tip', `<div><b>${TOETS.titel}</b> · ${n} punten. ${TOETS.intro || ''} Je ziet pas of je antwoorden juist zijn na <b>Verbeter mijn proeftoets</b>. Opnieuw maken mag: je krijgt dan nieuwe getallen en je laatste poging telt.</div>`));
    let score = 0;
    const blokken = items.map((it, nr)=>{
      const v0 = st.v[it.k] = st.v[it.k] || {};
      const card = el('div', 'card kaart tkaart');
      const def = KAARTEN[it.k];
      card.append(el('div', 'card-head', `<h3>Vraag ${nr + 1} · ${def.titel}</h3>`));
      const body = el('div', 'kbody' + (it.inst.fig && !it.inst.boven ? ' met-fig' : '') + (it.inst.figRechts ? ' fig-rechts' : '') + (it.inst.breed ? ' breed' : ''));
      if(it.inst.fig) body.append(el('div', 'kfig', it.inst.fig));
      const main = el('div', 'kmain'); body.append(main);
      if(it.inst.tekst) main.append(el('div', 'ktekst', it.inst.tekst));
      const lijst = el('div', 'vragen' + (it.inst.q2 ? ' q2' : '') + (it.inst.q3 ? ' q3' : '')); main.append(lijst); card.append(body);
      let goed = 0;
      it.inst.vragen.forEach((v, i)=>{
        const inv = vraagInvoer(v, v0[i], x=>{ v0[i] = x; save(); });
        if(st.klaar){ inv.dataset.dicht = '1'; if(inv._inp) inv._inp.readOnly = true; }
        const slot = card.querySelector(`[data-v="${i}"]`);
        let q;
        if(slot){ slot.append(inv); slot.classList.add('slot'); }
        else { q = el('div', 'q'); if(v.t){ const qt = el('div', 'q-text' + (v.soort === 'keuze' || v.soort === 'multi' || v.soort === 'eigen' || v.blok ? ' block' : ''), `<span class="qt">${v.t}</span>`); if(v.soort === 'keuze' || v.soort === 'multi' || v.soort === 'eigen' || v.blok){ q.append(qt, inv); } else { qt.append(inv); q.append(qt); } } else q.append(inv); lijst.append(q); }
        if(st.klaar){
          const ok = !leeg(v, v0[i]) && vraagJuist(v, v0[i]); if(ok) goed++;
          inv._markeer(ok, true);
          if(!ok){ const f = el('div', 'fb bad', `${it.inst.vragen.length > 1 ? (i + 1) + '. ' : ''}Juist was: <b>${antwTekst(v)}</b>`); (q || lijst).append(f); }
        }
      });
      it.goed = goed;
      if(st.klaar){ score += goed; const hd = card.querySelector('.card-head'); hd.append(el('span', 'k-mark ' + (goed === it.inst.vragen.length ? 'ok' : 'bad'), `${goed}/${it.inst.vragen.length}`));
        if(it.inst.sol){ const s = el('div', 'sol', it.inst.sol); s.hidden = true; const l = knop('linkbtn', 'Toon oplossing', ()=>{ s.hidden = !s.hidden; l.textContent = s.hidden ? 'Toon oplossing' : 'Verberg oplossing'; }); const a = el('div', 'q-act'); a.append(l); main.append(a, s); } }
      pane.append(card); if(it.inst.mount) it.inst.mount(card);
      return it;
    });
    const act = el('div', 'pt-actions'), fb = el('div', 'fb');
    if(!st.klaar){
      act.append(knop('btn big', 'Verbeter mijn proeftoets', ()=>{
        const leegN = blokken.reduce((t, it)=>t + it.inst.vragen.filter((v, i)=>leeg(v, st.v[it.k][i])).length, 0);
        if(leegN && !act.dataset.zeker){ act.dataset.zeker = '1'; fb.className = 'fb bad'; fb.textContent = `Je hebt nog ${leegN === 1 ? 'één vak' : leegN + ' vakken'} niet ingevuld. Klik nog eens om toch te verbeteren.`; return; }
        let sc = 0; blokken.forEach(it=>it.inst.vragen.forEach((v, i)=>{ if(!leeg(v, st.v[it.k][i]) && vraagJuist(v, st.v[it.k][i])) sc++; }));
        st.klaar = true; st.score = sc; save(); CLtoets('toets_1', sc, n); teken(); pane.scrollIntoView({ block:'start', behavior:'smooth' });
      }), fb);
    } else {
      const r = score / n;
      const scoreEl = el('div', 'score', `<div class="big">${score}/${n}</div><div>Niveau: <span class="lvl">${niveauVan(r)}</span></div><div>${r < 1 ? 'Bij elke fout staat het juiste antwoord. Hieronder zie je wat je nog best oefent.' : 'Knap gedaan!'}</div>`);
      pane.prepend(scoreEl); scoreEl.after(toetsFeedback(TOETS, blokken));
      act.append(knop('btn big', 'Maak een nieuwe proeftoets', ()=>{ wis(key); teken(); pane.scrollIntoView({ block:'start' }); }));
    }
    pane.append(act);
  }
  pane._vulJuist = ()=>{ const st = lees(key); TOETS.kaarten.forEach(k=>{ const inst = maakKaart(k, st.seeds[k]); st.v[k] = {}; inst.vragen.forEach((v, i)=>{ st.v[k][i] = voorbeeldAntw(v); }); }); bewaar(key, st); teken(); };
  teken();
  return pane;
}

/* feedback na de proeftoets: per Ik-kan-zin alles juist (Dit kan je al) of niet (Dit oefen je nog best) */
function toetsFeedback(TOETS, blokken){
  const kan = TOETS.kan || {}, groep = new Map();
  blokken.forEach(it=>{ let zin = kan[it.k] || KAARTEN[it.k].titel.toLowerCase(); zin = zin.charAt(0).toUpperCase() + zin.slice(1); const g = groep.get(zin) || { ok:true, kid:null, fout:0 }; const af = it.goed < it.inst.vragen.length; if(af){ g.ok = false; g.fout += it.inst.vragen.length - it.goed; if(!g.kid) g.kid = it.k; } groep.set(zin, g); });
  const box = el('div', 'tfeedback'), al = el('div', 'tf-al'), nog = el('div', 'tf-nog');
  const ulA = el('ul'), ulN = el('ul');
  groep.forEach((g, zin)=>{
    if(g.ok){ ulA.append(el('li', '', '✓ ' + zin)); return; }
    const li = el('li', '', `<span>${zin}</span>`);
    if(typeof gaNaarKaart === 'function' && kaartSectie(g.kid)) li.append(knop('btn klein tf-oefen', 'Oefen dit →', ()=>gaNaarKaart(g.kid)));
    ulN.append(li);
  });
  al.append(el('h3', '', 'Dit kan je al'), ulA.children.length ? ulA : el('p', 'tf-leeg', 'Nog niets helemaal juist. Begin bij het eerste werkpunt.'));
  nog.append(el('h3', '', 'Dit oefen je nog best'), ulN.children.length ? ulN : el('p', 'tf-leeg', 'Niets! Je hebt alles juist.'));
  box.append(nog, al);
  return box;
}

/* QUIZ = [ R => ({ t, a, voor, na, geld }) ]: 10 vragen in 3 minuten, één per keer */
function quizPaneel(QUIZ){
  const pane = el('div', 'quiz'); const DUUR = 180;
  let best = lees('quiz_best');
  function start(){
    pane.innerHTML = '';
    best = lees('quiz_best');
    const box = el('div', 'card kaart quiz-start');
    box.append(el('div', 'card-head', '<h3>Snelle quiz</h3>'));
    box.append(el('p', '', `<b>10 vragen in 3 minuten.</b> Typ je antwoord en druk op Enter. Je krijgt elke keer nieuwe vragen. De quiz telt niet mee voor je resultaten.${best != null ? ` Jouw beste score: <b>${best}/10</b>.` : ''}`));
    box.append(knop('btn big', 'Start de quiz', speel));
    pane.append(box);
  }
  function speel(){
    const R = RNG(nieuwZaad());
    const vragen = rij(10, i=>QUIZ[i % QUIZ.length](R)); const volg = R.shuffle(vragen);
    const ant = []; let i = 0, t0 = Date.now(), timer = null;
    pane.innerHTML = '';
    const card = el('div', 'card kaart quiz-kaart');
    const kop = el('div', 'card-head'); const tel = el('h3', ''); const klok = el('span', 'quiz-klok'); kop.append(tel, klok);
    const balk = el('div', 'quiz-balk'), vul = el('div', 'quiz-vul'); balk.append(vul);
    const inh = el('div', 'quiz-inh');
    card.append(kop, balk, inh); pane.append(card);
    function vraag(){
      if(i >= volg.length) return einde();
      const v = volg[i]; inh.innerHTML = ''; tel.textContent = `Vraag ${i + 1} van ${volg.length}`;
      const q = el('div', 'q-text quiz-v', v.t);
      const inv = vraagInvoer(Object.assign({ w:'md' }, v), '', x=>{ ant[i] = x; }, { enter:()=>{ i++; vraag(); } });
      q.append(inv); inh.append(q, knop('btn', 'Volgende →', ()=>{ i++; vraag(); }));
      setTimeout(()=>inv._inp && inv._inp.focus(), 30);
    }
    function tik(){ const over = DUUR - Math.floor((Date.now() - t0) / 1000); klok.textContent = `⏱ ${Math.floor(Math.max(0, over) / 60)}:${String(Math.max(0, over) % 60).padStart(2, '0')}`; vul.style.width = Math.max(0, over / DUUR * 100) + '%'; if(over <= 0) einde(true); }
    function einde(tijd){
      clearInterval(timer); if(pane.dataset.klaar) return; pane.dataset.klaar = '1';
      const sc = volg.filter((v, j)=>ant[j] != null && ant[j] !== '' && zelfde(ant[j], v.a)).length;
      if(best == null || sc > best){ best = sc; bewaar('quiz_best', sc); }
      pane.innerHTML = '';
      const res = el('div', 'card kaart');
      res.append(el('div', 'score', `<div class="big">${sc}/10</div><div>${tijd ? 'De tijd is om. ' : ''}Beste score: <b>${best}/10</b></div>`));
      const tb = el('table', 'dtable quiz-tabel'); tb.innerHTML = '<tr><th>vraag</th><th>jouw antwoord</th><th>juist</th></tr>' + volg.map((v, j)=>{ const ok = ant[j] != null && ant[j] !== '' && zelfde(ant[j], v.a); return `<tr class="${ok ? 'r-ok' : 'r-bad'}"><td style="text-align:left">${v.t}</td><td>${ant[j] == null || ant[j] === '' ? '–' : ant[j]}</td><td>${ok ? '✓' : antwTekst(v)}</td></tr>`; }).join('');
      const tw = el('div', 'table-wrap'); tw.append(tb); res.append(tw, knop('btn big', 'Nog een keer', ()=>{ delete pane.dataset.klaar; start(); }));
      pane.append(res);
    }
    delete pane.dataset.klaar; timer = setInterval(tik, 500); tik(); vraag();
  }
  start();
  return pane;
}

/* ============================================================
   MODULE 5 · VIERHOEK (2B)
   Gebaseerd op taak 5.1 en toets 5.1. Vierhoeken herkennen, hoeken meten en tekenen met een
   geodriehoek op het scherm, vierhoeken tekenen op een rooster, omtrek en oppervlakte, vraagstukken.
   Rechte hoeken altijd met een losse L (rhoekL).
   ============================================================ */
const tab = (koppen, rijen, o = {}) => `<div class="ttab"><table class="dtable${o.cls ? ' ' + o.cls : ''}">${koppen ? '<tr>' + koppen.map(k=>`<th${o.l ? ' class="l"' : ''}>${k}</th>`).join('') + '</tr>' : ''}${rijen.map(r=>'<tr>' + r.map(c=>`<td>${c}</td>`).join('') + '</tr>').join('')}</table></div>`;
const slot = i => `<span data-v="${i}"></span>`;
const KL = 'var(--accent-dark)', VUL = 'var(--tq-soft, #dff5f6)';
const draai = (pts, cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y])=>[rnd(cx + (x - cx) * c - (y - cy) * s, 2), rnd(cy + (x - cx) * s + (y - cy) * c, 2)]); };
const midden = pts => [som(pts.map(p=>p[0])) / pts.length, som(pts.map(p=>p[1])) / pts.length];
const cm = x => nf(x) + ' cm';
const OO = ['omtrek', 'oppervlakte'];

/* ---------- vierhoeken ---------- */
const VIERH = ['vierhoek', 'trapezium', 'parallellogram', 'ruit', 'rechthoek', 'vierkant'];
function vierPunten(R, soort){
  const s = R.int(48, 58);
  switch(soort){
    case 'vierkant': return [[0, 0], [s, 0], [s, -s], [0, -s]];
    case 'rechthoek': { const h = s * R.pick([.5, .6, .7]); return [[0, 0], [s * 1.35, 0], [s * 1.35, -h], [0, -h]]; }
    case 'ruit': { const a = s * .78, b = s * R.pick([.42, .5]); return [[0, 0], [a, -b], [0, -2 * b], [-a, -b]]; }
    case 'parallellogram': { const sh = s * R.pick([.35, .5]); return [[0, 0], [s * 1.2, 0], [s * 1.2 + sh, -s * .7], [sh, -s * .7]]; }
    case 'trapezium': { const b = s * 1.45, t = s * R.pick([.6, .75]), off = R.int(6, Math.round(b - t - 6)); return [[0, 0], [b, 0], [off + t, -s * .7], [off, -s * .7]]; }
    default: return [[0, 0], [s * 1.25, R.int(6, 16)], [s * 1.0, -s * .85], [R.int(10, 20), -s * .5]];
  }
}
const rechtHoekig = soort => soort === 'vierkant' || soort === 'rechthoek';
function vierFig(R, soort, o = {}){
  const W = o.b || 170, H = o.h || 130;
  let p = vierPunten(R, soort).map(([x, y])=>[x * 1.35, y * 1.35]); const [mx, my] = midden(p); p = p.map(([x, y])=>[x - mx + W / 2, y - my + H / 2]);
  const hoek = o.rechtop ? 0 : R.pick([0, 0, 15, -15, 30, -30, 90]) * Math.PI / 180; p = draai(p, W / 2, H / 2, hoek);
  const xs = p.map(q=>q[0]), ys = p.map(q=>q[1]), bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys), f = Math.min(1, (W - 30) / bw, (H - 26) / bh);
  p = p.map(([x, y])=>[rnd(W / 2 + (x - W / 2) * f, 2), rnd(H / 2 + 6 + (y - H / 2) * f, 2)]);
  let s = veelhoek(p, { f:VUL, k:KL, w:2.2 });
  if(rechtHoekig(soort)) p.forEach((q, i)=>{ s += rhoekL(q, p[(i + 1) % 4], p[(i + 3) % 4], { s:8, g:3, k:KL }); });
  if(o.nr) s += tekst(12, 12, o.nr, { s:13 });
  return svg(W, H, s, { label:'figuur ' + (o.nr || '') });
}
K({ id:'q_naam', titel:'Geef de best passende naam', niv:1, maak(R){
  const soorten = R.kies(VIERH, 4);
  return { tekst:'<p>Kies de <b>best passende</b> naam: de naam die het meest zegt over de figuur. De L in een hoek betekent: een rechte hoek.</p>', q2:true,
    vragen:soorten.map((s, i)=>({ t:vierFig(R, s, { nr:i + 1 }), soort:'keuze', keuzes:VIERH, a:VIERH.indexOf(s) })),
    sol:soorten.map((s, i)=>`figuur ${i + 1}: <b>${s}</b>`).join('<br>') };
} });
/* [soort, is ook, waar] */
const IS_OOK = [['vierkant', 'rechthoek', 1], ['rechthoek', 'vierkant', 0], ['vierkant', 'ruit', 1], ['ruit', 'vierkant', 0], ['ruit', 'parallellogram', 1], ['parallellogram', 'ruit', 0], ['rechthoek', 'parallellogram', 1],
  ['trapezium', 'parallellogram', 0], ['parallellogram', 'trapezium', 1], ['vierkant', 'trapezium', 1], ['rechthoek', 'trapezium', 1], ['ruit', 'trapezium', 1], ['parallellogram', 'rechthoek', 0], ['trapezium', 'vierhoek', 1], ['vierhoek', 'trapezium', 0]];
const KENMERK = [
  ['heeft 4 rechte hoeken.', { vierkant:1, rechthoek:1 }], ['heeft 4 gelijke zijden.', { vierkant:1, ruit:1 }], ['heeft 2 paar evenwijdige zijden.', { vierkant:1, rechthoek:1, ruit:1, parallellogram:1 }],
  ['heeft minstens 1 paar evenwijdige zijden.', { vierkant:1, rechthoek:1, ruit:1, parallellogram:1, trapezium:1 }], ['heeft diagonalen die loodrecht op elkaar staan.', { vierkant:1, ruit:1 }], ['heeft 4 hoeken.', { vierkant:1, rechthoek:1, ruit:1, parallellogram:1, trapezium:1, vierhoek:1 }]
];
K({ id:'q_waar', titel:'Wist je dat …? Waar of niet waar', niv:2, maak(R){
  const uit = R.kies(IS_OOK, 3).map(([a, b, w])=>[`Een ${a} is ook een ${b}.`, w]);
  const s = R.pick(VIERH.slice(1)); const k = R.pick(KENMERK); uit.push([`Een ${s} ${k[0]}`, k[1][s] ? 1 : 0]);
  const s2 = R.pick(VIERH.slice(1).filter(x=>x !== s)); const k2 = R.pick(KENMERK.filter(x=>x !== k)); uit.push([`Een ${s2} ${k2[0]}`, k2[1][s2] ? 1 : 0]);
  const lijst = R.shuffle(uit);
  return { tekst:'<p>Lees elke uitspraak. Is ze waar of niet waar?</p>', vragen:lijst.map(([z, w])=>({ t:z, soort:'keuze', keuzes:['waar', 'niet waar'], a:w ? 0 : 1 })),
    sol:lijst.map(([z, w])=>`${z} <b>${w ? 'waar' : 'niet waar'}</b>`).join('<br>') };
} });
K({ id:'q_raad', titel:'Wie ben ik?', niv:2, maak(R){
  const RAAD = [
    ['Ik heb 4 rechte hoeken en 4 gelijke zijden.', 'vierkant'], ['Ik heb 4 rechte hoeken. Mijn lange zijden en korte zijden zijn niet even lang.', 'rechthoek'],
    ['Ik heb 4 gelijke zijden, maar geen rechte hoeken.', 'ruit'], ['Ik heb 2 paar evenwijdige zijden. Ik heb geen rechte hoeken en mijn zijden zijn niet allemaal even lang.', 'parallellogram'],
    ['Ik heb maar 1 paar evenwijdige zijden.', 'trapezium'], ['Ik heb 4 hoeken, maar geen enkele zijde is evenwijdig met een andere.', 'vierhoek'],
    ['Mijn diagonalen staan loodrecht op elkaar en zijn niet even lang.', 'ruit'], ['Mijn diagonalen zijn even lang en staan loodrecht op elkaar.', 'vierkant']
  ];
  const lijst = R.kies(RAAD, 4).filter((x, i, a)=>a.findIndex(y=>y[1] === x[1]) === i); while(lijst.length < 4){ const x = R.pick(RAAD); if(!lijst.some(y=>y[1] === x[1])) lijst.push(x); }
  return { tekst:'<p>Welke vierhoek ben ik? Kies de best passende naam.</p>', vragen:lijst.map(([z, n])=>({ t:z, soort:'keuze', keuzes:VIERH, a:VIERH.indexOf(n) })),
    sol:lijst.map(([z, n])=>`${z} → <b>${n}</b>`).join('<br>') };
} });

/* ============================================================
   HOEKEN: een geodriehoek op het scherm die je kan verslepen en draaien
   ============================================================
   Hoeken in graden, gemeten zoals in de wiskunde: 0° naar rechts, tegen de wijzers van de klok in.
   Op het scherm ligt y naar beneden, dus een punt op hoek φ ligt op (cos φ, -sin φ). */
const GEO_H = 180, GEO_R = 126, BEEN = 235;
const rad = g => g * Math.PI / 180;
const opHoek = (P, g, r) => [rnd(P[0] + r * Math.cos(rad(g)), 2), rnd(P[1] - r * Math.sin(rad(g)), 2)];
function geoInhoud(){
  let s = `<polygon class="geo-lijf" points="${-GEO_H},0 ${GEO_H},0 0,${-GEO_H}" fill="rgba(150,210,228,.30)" stroke="#2c6f86" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += `<line x1="0" y1="0" x2="0" y2="${-GEO_H + 8}" stroke="#2c6f86" stroke-width=".8"/>`;
  s += `<path d="M${GEO_R} 0 A${GEO_R} ${GEO_R} 0 0 0 ${-GEO_R} 0" fill="none" stroke="#1f4f60" stroke-width=".9"/>`;
  for(let t = 0; t <= 180; t++){
    const l = t % 10 === 0 ? 15 : t % 5 === 0 ? 10 : 5, c = Math.cos(rad(t)), si = Math.sin(rad(t));
    s += `<line x1="${rnd(GEO_R * c, 2)}" y1="${rnd(-GEO_R * si, 2)}" x2="${rnd((GEO_R - l) * c, 2)}" y2="${rnd(-(GEO_R - l) * si, 2)}" stroke="#1f4f60" stroke-width="${t % 10 ? .6 : 1.1}"/>`;
    if(t % 10 === 0){
      const r1 = GEO_R - 25, r2 = GEO_R - 40, dy = t === 0 || t === 180 ? -6 : 0;
      s += `<text x="${rnd(r1 * c, 2)}" y="${rnd(-r1 * si + dy, 2)}" font-size="10" font-weight="700" fill="#173f4c" text-anchor="middle" dominant-baseline="central">${t}</text>`;
      s += `<text x="${rnd(r2 * c, 2)}" y="${rnd(-r2 * si + dy, 2)}" font-size="8" font-weight="600" fill="#5b8593" text-anchor="middle" dominant-baseline="central">${180 - t}</text>`;
    }
  }
  s += `<circle cx="0" cy="0" r="3.2" fill="#d0342c"/><text x="0" y="-11" font-size="9" font-weight="800" fill="#d0342c" text-anchor="middle">0</text>`;
  s += `<g class="geo-draai"><circle cx="0" cy="${-GEO_H + 26}" r="11" fill="var(--orange)" stroke="#8a5a00" stroke-width="1.2"/><text x="0" y="${-GEO_H + 27}" font-size="13" font-weight="800" fill="#2b1b00" text-anchor="middle" dominant-baseline="central">↻</text></g>`;
  return s;
}
const geoG = g => `<g class="geo" transform="translate(${g.x},${g.y}) rotate(${g.r})" data-x="${g.x}" data-y="${g.y}" data-r="${g.r}">${geoInhoud()}</g>`;
/* boogje tussen twee benen (van hoek f1 naar f2, tegen de wijzers in) */
const boogje = (P, f1, f2, r = 26, k = KL) => { const a = opHoek(P, f1, r), b = opHoek(P, f2, r); const groot = ((f2 - f1 + 360) % 360) > 180 ? 1 : 0; return `<path d="M${a[0]} ${a[1]} A${r} ${r} 0 ${groot} 0 ${b[0]} ${b[1]}" fill="none" stroke="${k}" stroke-width="1.8"/>`; };
/* plaats en draaiing waarbij de geodriehoek juist op de hoek ligt (0 op het hoekpunt, lange zijde langs been f1) */
const geoJuist = (P, f1) => ({ x:P[0], y:P[1], r:rnd(-f1, 2) });

/* een hoek als figuur. o = { W, H, P, f1, a, naam, geo:{x,y,r}, boog, extra } */
function hoekSvg(o){
  const P = o.P, f2 = o.f1 + o.a, A = opHoek(P, o.f1, BEEN), B = opHoek(P, f2, BEEN);
  let s = lijn(...P, ...A, { k:'var(--ink)', w:2.4 }) + lijn(...P, ...B, { k:'var(--ink)', w:2.4 });
  if(o.a === 90) s += rhoekL(P, A, B, { s:14, g:5, k:'var(--ink)' }); else if(o.boog !== false) s += boogje(P, o.f1, f2);
  if(o.extra) s += o.extra;
  const nl = opHoek(P, o.f1 + o.a / 2 + 180, 18); if(o.naam) s += tekst(nl[0], nl[1], o.naam, { s:17 });
  s += cirkel(P[0], P[1], 3, { f:'var(--ink)', k:'var(--ink)' });
  if(o.geo) s += geoG(o.geo);
  return svg(o.W, o.H, s, { label:'hoek', cls:'hoekfig', b:o.W });
}
/* een hoek die past in W x H: kies het hoekpunt zodat beide benen erin passen */
function plaatsHoek(R, f1, a, W, H){
  const f2 = f1 + a, pts = [[0, 0], opHoek([0, 0], f1, BEEN), opHoek([0, 0], f2, BEEN)];
  const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1]);
  const bx = Math.max(...xs) - Math.min(...xs), by = Math.max(...ys) - Math.min(...ys);
  return [rnd((W - bx) / 2 - Math.min(...xs), 1), rnd((H - by) / 2 - Math.min(...ys), 1)];
}
/* verslepen en draaien van de geodriehoek(en) in een element; in een voorbeeld ligt hij meteen juist */
function mountGeo(root){
  root.querySelectorAll('.hoekwrap').forEach(w=>{
    if(w._geo) return; w._geo = true;
    const s = w.querySelector('svg'), g = w.querySelector('.geo'); if(!s || !g) return;
    const P = JSON.parse(w.dataset.p || '[0,0]'), PUNTEN = w.dataset.punten ? JSON.parse(w.dataset.punten) : [P], benen = JSON.parse(w.dataset.benen || '[]');
    let x = +g.dataset.x, y = +g.dataset.y, r = +g.dataset.r; const x0 = x, y0 = y, r0 = r;
    const zet = ()=>g.setAttribute('transform', `translate(${rnd(x, 2)},${rnd(y, 2)}) rotate(${rnd(r, 2)})`);
    const juist = ()=>{ const f = benen[0] != null ? benen[0] : 0; const j = geoJuist(P, f); x = j.x; y = j.y; r = j.r; zet(); };
    setTimeout(()=>{ if(w.closest('.vb-kaart')) juist(); }, 0);
    const pt = e=>{ const q = s.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; return q.matrixTransform(s.getScreenCTM().inverse()); };
    const vangen = ()=>{ PUNTEN.forEach(Q=>{ if(Math.hypot(x - Q[0], y - Q[1]) < 9){ x = Q[0]; y = Q[1]; } });
      const kand = []; (w._benen ? w._benen() : benen).forEach(f=>{ kand.push(-f, -f + 180); });
      kand.forEach(k=>{ const d = ((r - k) % 360 + 540) % 360 - 180; if(Math.abs(d) < 1.6) r = r - d; }); };
    let modus = null, start = null;
    g.addEventListener('pointerdown', e=>{ if(w.closest('.vb-kaart') || w.dataset.dicht) return; e.preventDefault(); const q = pt(e);
      modus = e.target.closest('.geo-draai') ? 'draai' : 'schuif'; start = { qx:q.x, qy:q.y, x, y }; g.setPointerCapture(e.pointerId); g.classList.add('bezig'); });
    g.addEventListener('pointermove', e=>{ if(!modus) return; const q = pt(e);
      if(modus === 'schuif'){ x = start.x + q.x - start.qx; y = start.y + q.y - start.qy; }
      else { r = Math.atan2(q.y - y, q.x - x) * 180 / Math.PI + 90; }
      vangen(); zet(); });
    const los = ()=>{ modus = null; g.classList.remove('bezig'); };
    g.addEventListener('pointerup', los); g.addEventListener('pointercancel', los);
    const kn = w.querySelector('.geo-knoppen');
    if(kn && !kn.children.length){
      kn.append(el('span', 'gk-lbl', 'Geodriehoek: sleep hem, draai aan het oranje bolletje of met'));
      kn.append(knop('btn ghost klein', '↺ 1°', ()=>{ r -= 1; zet(); }), knop('btn ghost klein', '↻ 1°', ()=>{ r += 1; zet(); }), knop('btn ghost klein', '↺ 15°', ()=>{ r -= 15; zet(); }), knop('btn ghost klein', '↻ 15°', ()=>{ r += 15; zet(); }), knop('linkbtn', 'Leg hem terug', ()=>{ x = x0; y = y0; r = r0; zet(); }));
    }
  });
}
const hoekWrap = (svgHtml, P, benen) => `<div class="hoekwrap" data-p="${JSON.stringify(P)}" data-benen="${JSON.stringify(benen)}">${svgHtml}<div class="geo-knoppen"></div></div>`;
const soortHoek = a => a === 90 ? 'rechte hoek' : a === 180 ? 'gestrekte hoek' : a === 360 ? 'volle hoek' : a < 90 ? 'scherpe hoek' : 'stompe hoek';
const HOEKSOORT = ['scherpe hoek', 'rechte hoek', 'stompe hoek', 'gestrekte hoek'];

K({ id:'h_soort', titel:'Soorten hoeken', niv:1, maak(R){
  const maten = R.shuffle([R.int(20, 75), 90, R.int(105, 165), R.pick([R.int(25, 80), R.int(100, 160), 90, 180])]);
  const fig = a=>{ const W = 150, H = 110, f1 = R.pick([0, 0, 10, -10, 20]); const L = 60, P = a === 180 ? [75, 70] : [rnd(W / 2 - L / 2 * Math.cos(rad(f1 + a / 2)), 1), rnd(H / 2 + 20 * Math.sin(rad(f1 + a / 2)) + 10, 1)];
    const A = opHoek(P, f1, L), B = opHoek(P, f1 + a, L);
    let s = lijn(...P, ...A, { w:2.2 }) + lijn(...P, ...B, { w:2.2 }) + (a === 90 ? rhoekL(P, A, B, { s:10, g:4 }) : boogje(P, f1, f1 + a, 16));
    return svg(W, H, s, { label:'hoek', b:150 }); };
  return { tekst:'<p>Welke soort hoek is het? Een rechte hoek duiden we aan met een kleine L.</p>', q2:true,
    vragen:maten.map(a=>({ t:fig(a), soort:'keuze', keuzes:HOEKSOORT, a:HOEKSOORT.indexOf(soortHoek(a)) })),
    sol:maten.map((a, i)=>`hoek ${i + 1}: <b>${soortHoek(a)}</b> (${a}°)`).join('<br>') + '<br>scherp: kleiner dan 90° · recht: 90° · stomp: tussen 90° en 180° · gestrekt: 180°' };
} });

function meetToon(P, f1, a, W, H, naam){
  const geo0 = { x:P[0] + 90, y:P[1] + 60, r:-35 + -f1 }, j = geoJuist(P, f1);
  const st = [], fig = o=>hoekSvg(Object.assign({ W, H, P, f1, a, naam }, o));
  st.push(`<p><b>Stap 1.</b> Kijk eerst of de hoek scherp of stomp is. Deze hoek is <b>${a < 90 ? 'scherp: kleiner dan 90°' : 'stomp: groter dan 90°'}</b>.</p>` + fig({}));
  st.push('<p><b>Stap 2.</b> Leg de <b>0</b> van de geodriehoek op het <b>hoekpunt</b>.</p>' + fig({ geo:{ x:P[0], y:P[1], r:j.r - 25 } }));
  st.push('<p><b>Stap 3.</b> Draai tot de <b>lange zijde</b> van de geodriehoek langs één been ligt. De hoek ligt onder de geodriehoek.</p>' + fig({ geo:j }));
  const B = opHoek(P, f1 + a, GEO_R + 4);
  const markeer = boogje(P, f1, f1 + a, GEO_R - 2, 'var(--orange)').replace('stroke-width="1.8"', 'stroke-width="5" stroke-opacity=".75"') + cirkel(B[0], B[1], 6, { k:'var(--orange)', w:2.5 });
  st.push(`<p><b>Stap 4.</b> Begin bij het been onder de lange zijde en tel 0°, 10°, 20°, … tot bij het andere been. Lees af: <b>${a}°</b>.</p>` + hoekSvg({ W, H, P, f1, a, naam, geo:j, extra:'' }).replace('</svg>', markeer + '</svg>'));
  st.push(`<p><b>Stap 5.</b> Controle: de hoek is ${a < 90 ? 'scherp, dus kleiner dan 90°' : 'stomp, dus groter dan 90°'}. ${a}° klopt. Gebruik de grote getallen buiten als je vanaf rechts telt, de kleine getallen binnen als je vanaf links telt.</p>`);
  void geo0; return st;
}
K({ id:'h_meten', titel:'Meet de hoek', niv:1, maak(R){
  const W = 560, H = 330; let a; do{ a = R.int(18, 162); } while(Math.abs(a - 90) < 6);
  const f1 = R.pick([0, 180 - a, 0, 10, 180 - a - 10]); const P = plaatsHoek(R, f1, a, W, H - 20), naam = R.pick(['A', 'B', 'C', 'D', 'E']);
  const geo = { x:W - 110, y:H - 14, r:0 };
  const fig = hoekWrap(hoekSvg({ W, H, P, f1, a, naam, geo }), P, [f1, f1 + a]);
  return { fig, tekst:`<p>Meet de hoek met de geodriehoek. Sleep de geodriehoek op de hoek en draai hem.</p>`, vragen:[
    { t:`Is ${naam}̂ een scherpe of een stompe hoek?`, soort:'keuze', keuzes:['scherpe hoek', 'stompe hoek'], a:a < 90 ? 0 : 1 },
    { t:`${naam}̂ =`, na:'°', a:{ min:a - 2, max:a + 2 }, toonA:a + '°', voorbeeld:String(a), uitleg:'Ligt de 0 juist op het hoekpunt en de lange zijde langs een been? Tel vanaf 0 bij dat been.' }
  ], toon:meetToon(P, f1, a, W, H, naam), mount:mountGeo, sol:`${naam}̂ is een ${a < 90 ? 'scherpe' : 'stompe'} hoek van <b>${a}°</b> (1° of 2° verschil is goed).` };
} });
/* twee hoeken van een vierhoek meten (zoals op de toets) */
K({ id:'h_meten2', titel:'Meet de hoeken van de vierhoek', niv:2, maak(R){
  const W = 600, H = 360; let p, aA, aB;
  for(let k = 0; k < 200; k++){
    aA = R.int(35, 80); aB = R.int(95, 145); if(R.kans(.5)) [aA, aB] = [aB, aA];
    const L = R.int(300, 360), A = [0, 0], B = [L, 0], hA = R.int(170, 200), hB = R.int(170, 200);
    const D = opHoek(A, aA, hA), C = opHoek(B, 180 - aB, hB);
    p = [A, B, C, D]; const xs = p.map(q=>q[0]), ys = p.map(q=>q[1]);
    if(Math.max(...xs) - Math.min(...xs) < W - 60 && Math.max(...ys) - Math.min(...ys) < H - 70 && Math.hypot(C[0] - D[0], C[1] - D[1]) > 80) break;
  }
  const xs = p.map(q=>q[0]), ys = p.map(q=>q[1]); const dx = (W - (Math.max(...xs) - Math.min(...xs))) / 2 - Math.min(...xs), dy = H - 50 - Math.max(...ys);
  p = p.map(([x, y])=>[rnd(x + dx, 1), rnd(y + dy, 1)]); const [A, B, C, D] = p;
  let s = veelhoek(p, { f:VUL, k:'var(--ink)', w:2.4 }) + boogje(A, 0, aA, 24) + boogje(B, 180 - aB, 180, 24);
  [['A', A, [-12, 12]], ['B', B, [12, 12]], ['C', C, [10, -10]], ['D', D, [-10, -10]]].forEach(([n, q, o])=>{ s += tekst(q[0] + o[0], q[1] + o[1], n, { s:16 }); });
  const geo = { x:W / 2, y:H - 6, r:0 };
  const fig = `<div class="hoekwrap" data-p="${JSON.stringify(A)}" data-punten="${JSON.stringify([A, B])}" data-benen="[0,${aA}]">${svg(W, H, s + geoG(geo), { label:'vierhoek ABCD', cls:'hoekfig', b:W })}<div class="geo-knoppen"></div></div>`;
  return { fig, tekst:'<p>Meet de hoeken bij A en bij B met de geodriehoek.</p>', vragen:[
    { t:'Â =', na:'°', a:{ min:aA - 2, max:aA + 2 }, toonA:aA + '°', voorbeeld:String(aA), uitleg:'Leg de 0 op A en de lange zijde langs [AB].' },
    { t:'B̂ =', na:'°', a:{ min:aB - 2, max:aB + 2 }, toonA:aB + '°', voorbeeld:String(aB), uitleg:'Leg de 0 op B en de lange zijde langs [AB]. Tel vanaf 0 bij [AB].' }
  ], mount:card=>{ mountGeo(card); const w = card.querySelector('.hoekwrap'); if(w){ w._benen = ()=>[0, aA, 180, 180 - aB]; } },
    sol:`Â = <b>${aA}°</b> (${aA < 90 ? 'scherp' : 'stomp'}) en B̂ = <b>${aB}°</b> (${aB < 90 ? 'scherp' : 'stomp'}). 1° of 2° verschil is goed.` };
} });
/* eigen vraag: een hoek tekenen door het tweede been te verslepen */
function hoekTekenen(P, f1, doel, W, H, naam){
  return { soort:'eigen', blok:true, t:'', voorbeeld:doel, toonA:doel + '°',
    eigen:{ tekst:`een hoek van ${doel}°`,
      maak(box, val, zet){
        let g2 = val != null && val !== '' ? f1 + Number(val) : f1 + (doel < 90 ? 140 : 40);
        const wrap = el('div', 'hoekwrap'); wrap.dataset.p = JSON.stringify(P); wrap.dataset.benen = JSON.stringify([f1]);
        const A = opHoek(P, f1, BEEN);
        const vast = lijn(...P, ...A, { k:'var(--ink)', w:2.4 }) + cirkel(P[0], P[1], 3, { f:'var(--ink)', k:'var(--ink)' });
        wrap.innerHTML = svg(W, H, vast + '<g class="dyn"></g>' + geoG({ x:W - 110, y:H - 14, r:0 }), { label:'hoek tekenen', cls:'hoekfig', b:W }) + '<div class="geo-knoppen"></div>';
        const dyn = wrap.querySelector('.dyn'), sv = wrap.querySelector('svg');
        function teken(){
          const Q = opHoek(P, g2, GEO_R + 20), a = ((g2 - f1) % 360 + 360) % 360;
          let s = lijn(...P, ...opHoek(P, g2, BEEN), { k:'var(--orange)', w:2.4 }) + (a <= 180 ? boogje(P, f1, g2) : boogje(P, g2, f1));
          s += tekst(...opHoek(P, (a <= 180 ? f1 + a / 2 : g2 + (360 - a) / 2) + 180, 18), naam, { s:17 });
          s += `<g class="sleeppunt"><circle cx="${Q[0]}" cy="${Q[1]}" r="14" fill="var(--orange)" fill-opacity=".25" stroke="var(--orange)" stroke-width="2"/><circle cx="${Q[0]}" cy="${Q[1]}" r="4" fill="var(--orange)"/></g>`;
          dyn.innerHTML = s;
        }
        teken();
        box.append(el('div', 'gk-lbl', 'Sleep het oranje punt tot de hoek juist is. Meet met de geodriehoek.'), wrap);
        let sleep = false;
        const pt = e=>{ const q = sv.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; return q.matrixTransform(sv.getScreenCTM().inverse()); };
        dyn.addEventListener('pointerdown', e=>{ if(box.dataset.dicht || !e.target.closest('.sleeppunt')) return; e.preventDefault(); sleep = true; dyn.setPointerCapture(e.pointerId); });
        dyn.addEventListener('pointermove', e=>{ if(!sleep) return; const q = pt(e); g2 = Math.atan2(-(q.y - P[1]), q.x - P[0]) * 180 / Math.PI;
          const a = Math.round(((g2 - f1) % 360 + 360) % 360); teken(); zet(a > 180 ? 360 - a : a); box.classList.remove('e-ok', 'e-bad'); });
        const los = ()=>{ sleep = false; }; dyn.addEventListener('pointerup', los); dyn.addEventListener('pointercancel', los);
        wrap._benen = ()=>[f1, g2];
        setTimeout(()=>mountGeo(box), 0);
      },
      check(val){ return val != null && val !== '' && Math.abs(Number(val) - doel) <= 2; } },
    uitleg:'Leg de 0 van de geodriehoek op het hoekpunt en de lange zijde langs het zwarte been. Tel vanaf 0 bij dat been tot het juiste aantal graden.' };
}
K({ id:'h_tekenen', titel:'Teken de hoek', niv:2, maak(R){
  const W = 560, H = 330; let doel; do{ doel = R.stap(20, 160, 5); } while(doel === 90);
  const f1 = R.pick([0, 0, 180 - doel]); const P = plaatsHoek(R, f1, doel, W, H - 20), naam = R.pick(['A', 'B', 'P', 'Q']);
  const ctx = R.pick([`Een ladder staat tegen een muur onder een hoek van ${doel}°.`, `De ideale hoek voor zonnepanelen is ongeveer ${doel}°.`, `Een helling maakt een hoek van ${doel}°.`, '']);
  return { tekst:`<p>${ctx} Teken een hoek ${naam}̂ van <b>${doel}°</b>. Het zwarte been ligt al vast.</p>`, vragen:[hoekTekenen(P, f1, doel, W, H, naam)],
    sol:`${naam}̂ = <b>${doel}°</b>: leg de 0 op het hoekpunt, de lange zijde langs het zwarte been, tel vanaf 0 tot ${doel}° en sleep het been daarheen.` };
} });

/* ============================================================
   VIERHOEKEN TEKENEN op een rooster met hokjes van 1 cm
   De leerling klikt hoekpunten aan. De controle kijkt naar de vorm en de maten, niet naar de plaats.
   ============================================================ */
const RC = 26, RNX = 16, RNY = 10, RMG = 12;   /* celgrootte, aantal hokjes, marge */
const vk = (a, b) => [b[0] - a[0], b[1] - a[1]];
const kr = (a, b) => a[0] * b[1] - a[1] * b[0], dt = (a, b) => a[0] * b[0] + a[1] * b[1], l2 = a => dt(a, a);
/* punten rond hun middelpunt ordenen (zodat de klikvolgorde niet uitmaakt) */
function ordenen(P){ const [mx, my] = midden(P); return P.slice().sort((a, b)=>Math.atan2(a[1] - my, a[0] - mx) - Math.atan2(b[1] - my, b[0] - mx)); }
function vierInfo(P){
  const v = [0, 1, 2, 3].map(i=>vk(P[i], P[(i + 1) % 4]));
  const c = v.map((a, i)=>kr(a, v[(i + 1) % 4]));
  const convex = c.every(x=>x > 0) || c.every(x=>x < 0);
  const opp = Math.abs(som(P.map((p, i)=>kr(p, P[(i + 1) % 4])))) / 2;
  return { v, convex, par02:kr(v[0], v[2]) === 0, par13:kr(v[1], v[3]) === 0, recht:v.every((a, i)=>dt(a, v[(i + 1) % 4]) === 0), L:v.map(l2), opp, d:[l2(vk(P[0], P[2])), l2(vk(P[1], P[3]))] };
}
const zelfdeSet = (a, b) => a.length === b.length && a.slice().sort((x, y)=>x - y).every((x, i)=>x === b.slice().sort((x, y)=>x - y)[i]);
/* soorten opdrachten: test(info) → true als de getekende vierhoek klopt */
const TEKEN = {
  rechthoek:(a, b)=>i=>i.convex && i.recht && zelfdeSet(i.L, [a * a, a * a, b * b, b * b]),
  vierkant:z=>i=>i.convex && i.recht && i.L.every(x=>x === z * z),
  ruit:(p, q)=>i=>i.convex && i.L.every(x=>x === i.L[0]) && zelfdeSet(i.d, [p * p, q * q]),
  parallellogram:(a, h)=>i=>i.convex && i.par02 && i.par13 && !i.recht && (i.L[0] === a * a || i.L[1] === a * a) && i.opp === a * h,
  trapezium:(p, q, h)=>i=>i.convex && (i.par02 !== i.par13) && zelfdeSet(i.par02 ? [i.L[0], i.L[2]] : [i.L[1], i.L[3]], [p * p, q * q]) && i.opp === (p + q) * h / 2,
  rechthoekOpp:o=>i=>i.convex && i.recht && i.opp === o,
  rechthoekOmtrek:o=>i=>i.convex && i.recht && i.L.every(x=>Number.isInteger(Math.sqrt(x))) && som(i.L.map(Math.sqrt)) === o
};
/* rooster als SVG; vast = { punten:[[x,y,'A']], lijnen:[[a,b]], vlak:[[x,y]...] }, keuze = aangeklikte punten */
function roosterSvg(vast, keuze, o = {}){
  const W = RMG * 2 + RNX * RC, H = RMG * 2 + RNY * RC, X = x=>RMG + x * RC, Y = y=>RMG + y * RC;
  let s = `<rect x="${RMG}" y="${RMG}" width="${RNX * RC}" height="${RNY * RC}" fill="var(--card)"/>`;
  for(let i = 0; i <= RNX; i++) s += lijn(X(i), Y(0), X(i), Y(RNY), { k:'var(--border)', w:1 });
  for(let j = 0; j <= RNY; j++) s += lijn(X(0), Y(j), X(RNX), Y(j), { k:'var(--border)', w:1 });
  if(vast.vlak) s += veelhoek(vast.vlak.map(([x, y])=>[X(x), Y(y)]), { f:VUL, k:KL, w:2.4 });
  (vast.lijnen || []).forEach(([a, b])=>{ s += lijn(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]), { k:'var(--ink)', w:2.6 }); });
  if(o.volgorde){ if(keuze.length){ const v = vast.punten, a = v[v.length - 1], b = v[0], d = keuze[0]; s += veelhoek(v.map(([x, y])=>[X(x), Y(y)]).concat([[X(d[0]), Y(d[1])]]), { f:'rgba(252,175,23,.18)', k:'none' }) + lijn(X(a[0]), Y(a[1]), X(d[0]), Y(d[1]), { k:'var(--orange)', w:2.6 }) + lijn(X(d[0]), Y(d[1]), X(b[0]), Y(b[1]), { k:'var(--orange)', w:2.6 }); } }
  else if(keuze.length >= 2){ const pts = (keuze.length === 4 ? ordenen(keuze) : keuze).map(([x, y])=>[X(x), Y(y)]);
    s += keuze.length === (o.n || 4) ? veelhoek(pts, { f:'rgba(252,175,23,.18)', k:'var(--orange)', w:2.6 }) : `<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--orange)" stroke-width="2.6"/>`; }
  (vast.punten || []).forEach(([x, y, n])=>{ s += cirkel(X(x), Y(y), 3.5, { f:'var(--ink)', k:'var(--ink)' }) + (n ? tekst(X(x) + (n === 'A' || n === 'D' ? -10 : 10), Y(y) + (n === 'A' || n === 'B' ? 11 : -10), n, { s:14 }) : ''); });
  keuze.forEach(([x, y])=>{ s += cirkel(X(x), Y(y), 5, { f:'var(--orange)', k:'#8a5a00', w:1.2 }); });
  return svg(W, H, s, { label:'rooster met hokjes van 1 cm', cls:'tekenrooster', b:W });
}
/* eigen vraag: hoekpunten aanklikken. o = { n:aantal punten, vast, test(punten), voorbeeld, tekst, volgorde } */
function roosterTekenen(o){
  const n = o.n || 4;
  return { soort:'eigen', blok:true, t:o.t || '', voorbeeld:o.voorbeeld, toonA:o.tekst,
    eigen:{ tekst:o.tekst,
      maak(box, val, zet){
        let pts = Array.isArray(val) ? val.map(p=>p.slice()) : [];
        const wrap = el('div', 'e-rand klikfig teken-fig'), info = el('div', 'gk-tot');
        const alle = ()=>(o.vast && o.vast.punten && o.volgorde ? o.vast.punten.map(p=>[p[0], p[1]]) : []).concat(pts);
        function teken(){ wrap.innerHTML = roosterSvg(o.vast || {}, pts, { n, volgorde:o.volgorde });
          info.innerHTML = pts.length < n ? `Klik nog <b>${n - pts.length}</b> ${n - pts.length === 1 ? 'hoekpunt' : 'hoekpunten'} aan. Klik nog eens op een punt om het weg te halen.` : 'Klaar? Klik op <b>Controleer</b>.'; }
        wrap.addEventListener('click', e=>{
          if(box.dataset.dicht) return; const s = wrap.querySelector('svg'); const q = s.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; const p = q.matrixTransform(s.getScreenCTM().inverse());
          const x = Math.round((p.x - RMG) / RC), y = Math.round((p.y - RMG) / RC); if(x < 0 || y < 0 || x > RNX || y > RNY) return;
          if(Math.hypot(p.x - (RMG + x * RC), p.y - (RMG + y * RC)) > 11) return;
          const i = pts.findIndex(q=>q[0] === x && q[1] === y);
          if(i >= 0) pts.splice(i, 1); else if(pts.length < n && !(o.vast && (o.vast.punten || []).some(q=>q[0] === x && q[1] === y))) pts.push([x, y]); else return;
          zet(pts.map(p=>p.slice())); box.classList.remove('e-ok', 'e-bad'); teken();
        });
        teken(); box.append(wrap, info, knop('linkbtn', 'Wis alles', ()=>{ if(box.dataset.dicht) return; pts = []; zet([]); box.classList.remove('e-ok', 'e-bad'); teken(); }));
      },
      check(val){ if(!Array.isArray(val) || val.length !== n) return false; const P = o.volgorde ? o.vast.punten.map(p=>[p[0], p[1]]).concat(val) : ordenen(val); return !!o.test(vierInfo(P)); } },
    uitleg:o.uitleg || 'Tel de hokjes nog eens: elk hokje is 1 cm. Kijk of de hoeken en de zijden kloppen.' };
}
/* een voorbeeld-oplossing op het rooster, links boven op (2, 2) */
const opRooster = (pts, dx = 2, dy = 2) => pts.map(([x, y])=>[x + dx, y + dy]);
function tekenOpdracht(R, soort){
  switch(soort){
    case 'rechthoek': { const a = R.int(5, 9), b = R.int(2, a - 1); return { z:`een rechthoek met een lengte van ${cm(a)} en een breedte van ${cm(b)}`, test:TEKEN.rechthoek(a, b), vb:opRooster([[0, 0], [a, 0], [a, b], [0, b]]), sol:`Een rechthoek van ${a} hokjes op ${b} hokjes, met 4 rechte hoeken.` }; }
    case 'rechthoek_mm': { const a = R.int(6, 10), k = R.int(2, a - 2), b = a - k; return { z:`een rechthoek met een lengte van <b>${a * 10} mm</b>. De breedte is ${k} cm korter dan de lengte`, test:TEKEN.rechthoek(a, b), vb:opRooster([[0, 0], [a, 0], [a, b], [0, b]]), sol:`${a * 10} mm = ${a} cm. De breedte is ${a} cm – ${k} cm = ${b} cm. Teken ${a} hokjes op ${b} hokjes.` }; }
    case 'vierkant': { const z = R.int(3, 7); return { z:`een vierkant met een zijde van ${R.kans(.5) ? cm(z) : (z * 10) + ' mm'}`, test:TEKEN.vierkant(z), vb:opRooster([[0, 0], [z, 0], [z, z], [0, z]]), sol:`Een vierkant van ${z} hokjes op ${z} hokjes (${z * 10} mm = ${z} cm).` }; }
    case 'ruit': { const p = R.pick([6, 8, 10]), q = R.pick([2, 4, 6].filter(x=>x < p)); return { z:`een ruit waarvan de diagonalen ${cm(p)} en ${cm(q)} zijn`, test:TEKEN.ruit(p, q), vb:opRooster([[0, q / 2], [p / 2, 0], [p, q / 2], [p / 2, q]]), sol:`Teken een diagonaal van ${p} cm. Duid het midden aan. Teken door het midden loodrecht de tweede diagonaal van ${q} cm (${q / 2} cm naar boven en ${q / 2} cm naar beneden). Verbind de uiteinden.` }; }
    case 'parallellogram': { const a = R.int(5, 8), h = R.int(2, 4), sh = R.int(1, 3); return { z:`een parallellogram met twee evenwijdige zijden van ${cm(a)} en een hoogte van ${cm(h)}. Het mag geen rechthoek zijn`, test:TEKEN.parallellogram(a, h), vb:opRooster([[sh, 0], [sh + a, 0], [a, h], [0, h]]), sol:`Teken een zijde van ${a} cm. Teken ${h} hokjes hoger, een beetje verschoven, nog een zijde van ${a} cm. Verbind de uiteinden: de schuine zijden zijn evenwijdig.` }; }
    case 'trapezium': { const p = R.int(6, 9), q = R.int(2, p - 2), h = R.int(2, 4), off = R.int(1, p - q - 1); return { z:`een trapezium met evenwijdige zijden van ${cm(p)} en ${cm(q)} en een hoogte van ${cm(h)}. Het mag geen rechthoek of parallellogram zijn`, test:TEKEN.trapezium(p, q, h), vb:opRooster([[off, 0], [off + q, 0], [p, h], [0, h]]), sol:`Teken een zijde van ${p} cm. Teken ${h} hokjes hoger een evenwijdige zijde van ${q} cm. Verbind de uiteinden.` }; }
  }
}
K({ id:'t_af', titel:'Maak de figuur af', niv:1, maak(R){
  const soort = R.pick(['parallellogram', 'rechthoek', 'vierkant', 'ruit']);
  let A, B, C, D;
  if(soort === 'rechthoek'){ const a = R.int(5, 9), b = R.int(2, 5); A = [3, 7]; B = [3 + a, 7]; C = [3 + a, 7 - b]; D = [3, 7 - b]; }
  else if(soort === 'vierkant'){ const z = R.int(3, 6); A = [4, 8]; B = [4 + z, 8]; C = [4 + z, 8 - z]; D = [4, 8 - z]; }
  else if(soort === 'parallellogram'){ const a = R.int(5, 8), h = R.int(3, 5), sh = R.int(1, 3) * R.pick([1, -1]); A = [4, 8]; B = [4 + a, 8]; C = [4 + a + sh, 8 - h]; D = [4 + sh, 8 - h]; }
  else { const p = R.pick([3, 4]), q = R.pick([2, 3]); A = [7, 9]; B = [7 + p, 9 - q]; C = [7, 9 - 2 * q]; D = [7 - p, 9 - q]; }
  const kanteel = R.kans(.5); /* soms ontbreekt C, soms D */
  const vast = kanteel ? { punten:[[...A, 'A'], [...B, 'B'], [...C, 'C']], lijnen:[[A, B], [B, C]] } : { punten:[[...D, 'D'], [...A, 'A'], [...B, 'B']], lijnen:[[D, A], [A, B]] };
  const ontbreekt = kanteel ? D : C, naam = kanteel ? 'D' : 'C';
  const vraag = roosterTekenen({ n:1, vast, volgorde:true, test:()=>true, voorbeeld:[ontbreekt.slice()], tekst:`het vierde hoekpunt ${naam}` });
  vraag.eigen.check = val=>Array.isArray(val) && val.length === 1 && val[0][0] === ontbreekt[0] && val[0][1] === ontbreekt[1];
  vraag.uitleg = soort === 'ruit' ? 'Bij een ruit zijn alle zijden even lang.' : 'De overstaande zijden zijn even lang en evenwijdig. Tel de hokjes naar rechts en naar boven.';
  return { tekst:`<p>Maak de figuur af tot een <b>${soort}</b>. Klik het ontbrekende hoekpunt ${naam} aan. Elk hokje is 1 cm.</p>`, vragen:[vraag],
    hint:[{ t:soort === 'ruit' ? 'Bij een ruit zijn alle 4 de zijden even lang. Tel hoeveel hokjes je naar rechts en naar boven gaat langs een zijde.' : 'De ontbrekende zijde is even lang als de overstaande zijde en loopt evenwijdig. Doe vanaf het laatste punt dezelfde stappen als langs de overstaande zijde.' }],
    sol:`${naam} ligt op het punt waarbij de overstaande zijden even lang en evenwijdig zijn. Zo krijg je een ${soort}.` };
} });
K({ id:'t_teken', titel:'Teken de vierhoek', niv:1, maak(R){
  const op = tekenOpdracht(R, R.pick(['rechthoek', 'vierkant', 'ruit']));
  return { tekst:`<p>Elk hokje is 1 cm. Teken <b>${op.z}</b>. Klik de 4 hoekpunten aan.</p>`, vragen:[roosterTekenen({ test:op.test, voorbeeld:op.vb, tekst:op.z })], sol:op.sol,
    hint:[{ t:'Teken eerst één zijde (of één diagonaal) met de juiste lengte: tel de hokjes.' }, { t:'Rechte hoeken teken je langs de lijnen van het rooster.' }] };
} });
K({ id:'t_teken2', titel:'Teken de vierhoek met de juiste maten', niv:2, maak(R){
  const op = tekenOpdracht(R, R.pick(['parallellogram', 'trapezium', 'rechthoek_mm', 'ruit']));
  return { tekst:`<p>Om een werkstuk te maken zaagt ${R.naam()} verschillende figuren. Elk hokje is 1 cm.</p><p>Teken <b>${op.z}</b>.</p>`, vragen:[roosterTekenen({ test:op.test, voorbeeld:op.vb, tekst:op.z })], sol:op.sol,
    hint:[{ t:'Zet eerst alles in cm: 10 mm = 1 cm.' }, { t:'Evenwijdige zijden teken je op dezelfde manier schuin of recht. De hoogte tel je recht naar boven.' }] };
} });
K({ id:'t_tegel', titel:'Teken met een gegeven oppervlakte of omtrek', niv:2, maak(R){
  const v = R.pick(['tegel', 'zelfde', 'omtrek', 'opp']);
  if(v === 'tegel'){ const z = R.pick([2, 3, 4, 5]); return { tekst:`<p>${R.naam()} legt vierkante tegels in de badkamer. Een tegel heeft een oppervlakte van <b>${z * z} cm²</b>. Teken een tegel. Elk hokje is 1 cm.</p>`,
    vragen:[roosterTekenen({ test:TEKEN.vierkant(z), voorbeeld:opRooster([[0, 0], [z, 0], [z, z], [0, z]]), tekst:`een vierkant van ${z} cm op ${z} cm` })],
    hint:[{ t:`Oppervlakte vierkant = zijde x zijde. Welk getal x zichzelf geeft ${z * z}?`, a:z, na:'cm' }], sol:`${z} cm x ${z} cm = ${z * z} cm². Teken een vierkant met een zijde van <b>${z} cm</b>.` }; }
  if(v === 'zelfde'){ const z = R.pick([3, 4]), [a, b] = R.pick(z === 4 ? [[8, 2]] : [[9, 1]]); const vlak = [[1, 1], [1 + a, 1], [1 + a, 1 + b], [1, 1 + b]];
    return { tekst:`<p>De blauwe rechthoek is ${a} cm lang en ${b} cm breed. Teken een <b>vierkant</b> met dezelfde oppervlakte. Elk hokje is 1 cm.</p>`,
      vragen:[roosterTekenen({ vast:{ vlak }, test:TEKEN.vierkant(z), voorbeeld:opRooster([[0, 0], [z, 0], [z, z], [0, z]], 3, 4), tekst:`een vierkant van ${z} cm op ${z} cm` })],
      hint:[{ t:'Hoe groot is de oppervlakte van de rechthoek?', a:a * b, na:'cm²' }, { t:'Welk getal x zichzelf geeft die oppervlakte? Dat is de zijde van het vierkant.', a:z, na:'cm' }],
      sol:`Rechthoek: ${a} cm x ${b} cm = ${a * b} cm². Vierkant: ${z} cm x ${z} cm = ${z * z} cm². Teken een vierkant met een zijde van <b>${z} cm</b>.` }; }
  if(v === 'omtrek'){ const o = R.pick([10, 12, 14, 16]); const a = o / 2 - 2, b = 2;
    return { tekst:`<p>Teken een <b>rechthoek met een omtrek van ${o} cm</b>. Elk hokje is 1 cm. Er zijn meerdere oplossingen.</p>`,
      vragen:[roosterTekenen({ test:TEKEN.rechthoekOmtrek(o), voorbeeld:opRooster([[0, 0], [a, 0], [a, b], [0, b]]), tekst:`bv. een rechthoek van ${a} cm op ${b} cm` })],
      hint:[{ t:`Lengte + breedte = de helft van de omtrek = ${o / 2} cm. Kies twee getallen die samen ${o / 2} zijn.`, a:o / 2, na:'cm' }],
      sol:`Lengte + breedte = ${o} : 2 = ${o / 2} cm. Bv. ${o / 2 - 1} cm en 1 cm, ${a} cm en ${b} cm of ${o / 2 - 3} cm en 3 cm.` }; }
  const o = R.pick([8, 12, 16, 18]); const [a, b] = o === 8 ? [4, 2] : o === 12 ? [4, 3] : o === 16 ? [8, 2] : [6, 3];
  return { tekst:`<p>Teken een <b>rechthoek met een oppervlakte van ${o} cm²</b>. Het mag geen vierkant zijn. Elk hokje is 1 cm. Er zijn meerdere oplossingen.</p>`,
    vragen:[roosterTekenen({ test:i=>TEKEN.rechthoekOpp(o)(i) && !i.L.every(x=>x === i.L[0]), voorbeeld:opRooster([[0, 0], [a, 0], [a, b], [0, b]]), tekst:`bv. een rechthoek van ${a} cm op ${b} cm` })],
    hint:[{ t:`Lengte x breedte = ${o}. Zoek twee getallen die vermenigvuldigd ${o} geven.` }], sol:`Lengte x breedte = ${o} cm². Bv. ${a} cm x ${b} cm${o === 8 ? ' of 8 cm x 1 cm' : o === 12 ? ', 6 cm x 2 cm of 12 cm x 1 cm' : o === 16 ? ' of 16 cm x 1 cm' : ', 9 cm x 2 cm of 18 cm x 1 cm'}.` };
} });

/* ============================================================
   OMTREK EN OPPERVLAKTE, VERDIEPING (parallellogram, ruit, trapezium), VRAAGSTUKKEN, PUZZELS
   ============================================================ */
/* ligt punt q binnen de veelhoek? (straal naar rechts) */
const binnen = (q, P) => { let ok = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, yi] = P[i], [xj, yj] = P[j]; if((yi > q[1]) !== (yj > q[1]) && q[0] < (xj - xi) * (q[1] - yi) / (yj - yi) + xi) ok = !ok; } return ok; };
/* figuur met maten bij de zijden. pts in px, maten = tekst per zijde (i → i+1) of '' */
function matenFig(pts, maten, o = {}){
  const W = o.b || 250, H = o.h || 165; if(!o.vast){ const xs = pts.map(p=>p[0]), dx = W / 2 - (Math.min(...xs) + Math.max(...xs)) / 2; pts = pts.map(([x, y])=>[rnd(x + dx, 1), y]); } const [mx, my] = midden(pts);
  let s = veelhoek(pts, { f:VUL, k:KL, w:2.2 });
  if(o.recht) pts.forEach((q, i)=>{ s += rhoekL(q, pts[(i + 1) % pts.length], pts[(i + pts.length - 1) % pts.length], { s:8, g:3, k:KL }); });
  pts.forEach((p, i)=>{ const q = pts[(i + 1) % pts.length]; if(!maten[i]) return; const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; let nx = q[1] - p[1], ny = -(q[0] - p[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if(binnen([m[0] + nx * 4, m[1] + ny * 4], pts)){ nx = -nx; ny = -ny; } s += tekst(rnd(m[0] + nx * (8 + 22 * Math.abs(nx)), 1), rnd(m[1] + ny * 13, 1), maten[i], { s:13, f:'var(--ink)' }); });
  if(o.extra) s += o.extra;
  if(o.nr) s += tekst(12, 12, o.nr, { s:13 });
  return svg(W, H, s, { label:o.label || 'figuur', b:o.bw || W });
}
/* een vierhoek met maten: geeft { naam, maten (getallen per zijde), pts } */
function vierMetMaten(R, soort, eenheid = 'cm'){
  const d = () => R.pick([2, 2.5, 3, 3.5, 4, 4.5, 5]), s = 24;
  if(soort === 'vierkant'){ const z = d(); return { z:[z, z, z, z], pts:[[70, 140], [70 + z * s, 140], [70 + z * s, 140 - z * s], [70, 140 - z * s]], recht:true }; }
  if(soort === 'rechthoek'){ let a = d(), b = d(); while(b >= a){ a = d(); b = d(); } return { z:[a, b, a, b], pts:[[30, 130], [30 + a * s * 1.1, 130], [30 + a * s * 1.1, 130 - b * s], [30, 130 - b * s]], recht:true }; }
  if(soort === 'ruit'){ const z = d(); return { z:[z, z, z, z], pts:[[40, 80], [115, 40], [190, 80], [115, 120]] }; }
  if(soort === 'parallellogram'){ let a = d(), b = d(); while(b >= a){ a = d(); b = d(); } return { z:[a, b, a, b], pts:[[25, 125], [25 + a * s * 1.1, 125], [55 + a * s * 1.1, 125 - b * s * .9], [55, 125 - b * s * .9]] }; }
  const g = R.pick([4, 4.5, 5, 6]), k = R.pick([2, 2.5, 3]), l1 = R.pick([2, 2.5, 3]), l2 = R.pick([2.5, 3, 3.5]);
  return { z:[g, l2, k, l1], pts:[[20, 125], [205, 125], [150, 55], [70, 55]] };
}
const SOORTEN5 = ['vierkant', 'rechthoek', 'ruit', 'parallellogram', 'trapezium'];
K({ id:'o_omtrek', titel:'Naam en omtrek', niv:1, maak(R){
  const soorten = R.kies(SOORTEN5, 2); const f = soorten.map(s=>Object.assign({ s }, vierMetMaten(R, s)));
  const fig = `<div class="figraster">${f.map((x, i)=>matenFig(x.pts, x.z.map(cm), { nr:i + 1, recht:x.recht })).join('')}</div>`;
  const vr = []; f.forEach((x, i)=>{ vr.push({ t:`Figuur ${i + 1} is een`, soort:'keuze', keuzes:SOORTEN5, a:SOORTEN5.indexOf(x.s) }); vr.push({ t:`Omtrek van figuur ${i + 1} =`, na:'cm', a:rnd(som(x.z)), hint:[{ t:'Tel de lengtes van alle 4 zijden op: ' + x.z.map(cm).join(' + '), a:rnd(som(x.z)), na:'cm' }] }); });
  return { fig, tekst:'<p>Noteer de naam van de figuur. Bereken de omtrek: tel de lengtes van al de zijden op.</p>', vragen:vr,
    sol:f.map((x, i)=>`figuur ${i + 1}: ${x.s}, omtrek = ${x.z.map(cm).join(' + ')} = <b>${cm(rnd(som(x.z)))}</b>`).join('<br>') };
} });
K({ id:'o_rh', titel:'De oppervlakte van een rechthoek en een vierkant', niv:1, maak(R){
  const e = R.pick(['cm', 'm', 'mm']);
  const rijen = [
    (()=>{ const a = R.int(6, 15), b = R.int(2, Math.min(9, a - 1)); return [`rechthoek`, `${a} ${e}`, `${b} ${e}`, a * b, e + '²', `${a} ${e} x ${b} ${e}`]; })(),
    (()=>{ const a = R.pick([6.5, 7.5, 8.5, 4.5, 5.5]), b = R.int(2, 4); return ['rechthoek', `${nf(a)} m`, `${b} m`, rnd(a * b), 'm²', `${nf(a)} m x ${b} m`]; })(),
    (()=>{ const z = R.int(5, 12); return ['vierkant', `${z} ${e}`, `${z} ${e}`, z * z, e + '²', `${z} ${e} x ${z} ${e}`]; })(),
    (()=>{ const a = R.int(3, 6), b = R.pick([20, 30, 40, 50]); return ['rechthoek', `${a} m`, `${b} cm`, a * 100 * b, 'cm²', `${a * 100} cm x ${b} cm`]; })()
  ];
  return { tekst:'<p>Oppervlakte rechthoek = <b>lange zijde x korte zijde</b>. Oppervlakte vierkant = <b>zijde x zijde</b>.</p><p>Zijn de eenheden verschillend? Zet ze eerst om.</p>',
    fig:tab(['figuur', 'lengte', 'breedte', 'oppervlakte'], rijen.map((r, i)=>[r[0], r[1], r[2], slot(i)])), boven:true,
    vragen:rijen.map(r=>({ a:r[3], na:r[4], w:'sm', label:'oppervlakte', uitleg:r[1].split(' ')[1] !== r[2].split(' ')[1] ? 'Zet eerst beide maten in cm: 1 m = 100 cm.' : undefined })),
    hint:[{ t:'Schrijf de bewerking: lengte x breedte. Zijn de eenheden niet gelijk? 1 m = 100 cm.' }],
    sol:rijen.map(r=>`${r[5]} = <b>${nf(r[3])} ${r[4]}</b>`).join('<br>') };
} });
K({ id:'o_samen', titel:'Omtrek en oppervlakte van een samengestelde figuur', niv:2, maak(R){
  const B = R.int(7, 11), Hh = R.int(5, 8), T = R.int(3, B - 3), d1 = R.int(2, Hh - 2), e = R.pick(['m', 'cm']);
  const sc = Math.min(26, 300 / B, 190 / Hh), x0 = 56, y0 = 22 + Hh * sc;
  const P = [[0, 0], [B, 0], [B, Hh - d1], [T, Hh - d1], [T, Hh], [0, Hh]].map(([x, y])=>[rnd(x0 + x * sc, 1), rnd(y0 - y * sc, 1)]);
  const m = [`${B} ${e}`, `${Hh - d1} ${e}`, '?', `${d1} ${e}`, `${T} ${e}`, `${Hh} ${e}`];
  const fig = matenFig(P, m, { vast:true, b:x0 + B * sc + 56, h:y0 + 30, label:'samengestelde figuur' });
  const om = 2 * (B + Hh), opp = T * d1 + B * (Hh - d1);
  return { fig, tekst:`<p>Alle hoeken zijn rechte hoeken.</p>`, vragen:[
    { t:'De zijde met het vraagteken is', na:e, a:B - T, hint:[{ t:'Kijk naar de onderkant: de hele breedte is ' + B + ' ' + e + '. Trek de breedte van het smalle deel af.', a:B - T, na:e }] },
    { t:'De omtrek van de figuur is', na:e, a:om, hint:[{ t:'Tel de lengtes van alle 6 zijden op.', a:om, na:e }] },
    { t:'De oppervlakte van de figuur is', na:e + '²', a:opp, hint:[{ t:`Verdeel de figuur in twee rechthoeken. Onderaan: ${B} ${e} x ${Hh - d1} ${e} =`, a:B * (Hh - d1), na:e + '²' }, { t:`Bovenaan: ${T} ${e} x ${d1} ${e} =`, a:T * d1, na:e + '²' }] }
  ], sol:`? = ${B} ${e} – ${T} ${e} = ${B - T} ${e}<br>omtrek = ${B} + ${Hh - d1} + ${B - T} + ${d1} + ${T} + ${Hh} = <b>${om} ${e}</b><br>oppervlakte = ${B} x ${Hh - d1} + ${T} x ${d1} = ${B * (Hh - d1)} + ${T * d1} = <b>${opp} ${e}²</b> (je kan de figuur ook anders verdelen)` };
} });
K({ id:'o_zijde', titel:'Van oppervlakte of omtrek naar de zijde', niv:2, maak(R){
  const z = R.int(3, 9), o = R.int(4, 9) * 4, a = R.int(5, 9), om = 2 * (a + R.int(2, a - 1)), b = om / 2 - a;
  return { tekst:'<p>Denk na: wat weet je al en wat moet je zoeken?</p>', vragen:[
    { t:`Een vierkante tegel heeft een oppervlakte van <b>${z * z} cm²</b>. Hoe lang is een zijde?`, na:'cm', a:z, uitleg:`Welk getal x zichzelf geeft ${z * z}?` },
    { t:`Een vierkant heeft een omtrek van <b>${o} cm</b>. Hoe lang is een zijde?`, na:'cm', a:o / 4, uitleg:'Een vierkant heeft 4 gelijke zijden: omtrek : 4.' },
    { t:`Een rechthoekig stuk grond is <b>${a} m</b> lang. De omtrek is <b>${om} m</b>. Hoe breed is het?`, na:'m', a:b, uitleg:'Lengte + breedte = de helft van de omtrek.' }
  ], hint:[{ t:'Vierkant: oppervlakte = zijde x zijde en omtrek = 4 x zijde.' }, { t:`Rechthoek: lengte + breedte = omtrek : 2 = ${om / 2} m.` }],
    sol:`${z} cm x ${z} cm = ${z * z} cm², dus <b>${z} cm</b><br>${o} cm : 4 = <b>${o / 4} cm</b><br>${om} m : 2 = ${om / 2} m; ${om / 2} m – ${a} m = <b>${b} m</b>` };
} });

/* ---------- verdieping: parallellogram, ruit, trapezium ---------- */
/* parallellogram op een rooster; de linkse driehoek kan je naar rechts schuiven zodat je een rechthoek krijgt */
K({ id:'v_para', titel:'De oppervlakte van een parallellogram', niv:3, maak(R){
  const b = R.int(5, 8), h = R.int(2, 4), sh = R.int(1, 3), c = 30, x0 = 20, y0 = 20 + h * c;
  const X = x=>x0 + x * c, Y = y=>y0 - y * c, NX = b + sh + 2;
  let s = ''; for(let i = 0; i <= NX; i++) s += lijn(X(i), Y(0) + 8, X(i), Y(h) - 8, { k:'var(--border)', w:1 }); for(let j = 0; j <= h; j++) s += lijn(X(0), Y(j), X(NX), Y(j), { k:'var(--border)', w:1 });
  s += veelhoek([[X(0), Y(0)], [X(b), Y(0)], [X(b + sh), Y(h)], [X(sh), Y(h)]], { f:VUL, k:KL, w:2.4 });
  s += lijn(X(sh), Y(h), X(sh), Y(0), { k:'var(--orange)', w:2, d:'5 4' }) + rhoekL([X(sh), Y(0)], [X(sh), Y(h)], [X(b), Y(0)], { s:8, g:3, k:'var(--orange)' });
  s += tekst(X(sh) + 14, (Y(0) + Y(h)) / 2, 'hoogte', { s:11, a:'start', f:'var(--orange)' }) + tekst((X(0) + X(b)) / 2, Y(0) + 16, 'basis', { s:12 });
  s += `<g class="schuif" style="cursor:grab"><polygon points="${X(0)},${Y(0)} ${X(sh)},${Y(0)} ${X(sh)},${Y(h)}" fill="rgba(252,175,23,.45)" stroke="var(--orange)" stroke-width="2"/></g>`;
  const W = X(NX) + 20, H = Y(0) + 30;
  const fig = `<div class="schuifwrap">${svg(W, H, s, { label:'parallellogram op een rooster', b:W })}<div class="gk-lbl">Sleep de oranje driehoek naar rechts. Wat krijg je?</div></div>`;
  return { fig, tekst:'<p>Elk hokje is 1 cm op 1 cm. Oppervlakte parallellogram = <b>basis x hoogte</b>. De hoogte staat loodrecht op de basis.</p>', vragen:[
    { t:'basis =', na:'cm', a:b }, { t:'hoogte =', na:'cm', a:h }, { t:'oppervlakte =', na:'cm²', a:b * h }
  ], mount:card=>{ const w = card.querySelector('.schuifwrap'); if(!w || w._ok) return; w._ok = true; const g = w.querySelector('.schuif'), sv = w.querySelector('svg'); let dx = 0, sx = null, d0 = 0;
      const pt = e=>{ const q = sv.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; return q.matrixTransform(sv.getScreenCTM().inverse()); };
      if(card.classList.contains('vb-kaart')){ g.setAttribute('transform', `translate(${b * c},0)`); return; }
      g.addEventListener('pointerdown', e=>{ e.preventDefault(); sx = pt(e).x; d0 = dx; g.setPointerCapture(e.pointerId); });
      g.addEventListener('pointermove', e=>{ if(sx == null) return; dx = Math.max(0, Math.min(b * c, d0 + pt(e).x - sx)); g.setAttribute('transform', `translate(${dx},0)`); });
      g.addEventListener('pointerup', ()=>{ sx = null; dx = dx > b * c / 2 ? b * c : 0; g.setAttribute('transform', `translate(${dx},0)`); }); },
    sol:`Schuif je de driehoek naar rechts, dan krijg je een rechthoek van ${b} cm op ${h} cm.<br>oppervlakte = basis x hoogte = ${b} cm x ${h} cm = <b>${b * h} cm²</b>` };
} });
function ruitFig(d1, d2, e, o = {}){
  const sc = Math.min(30, 220 / d1), W = d1 * sc + 60, H = d2 * sc + 50, cx = W / 2, cy = H / 2, a = d1 * sc / 2, b = d2 * sc / 2;
  let s = o.kader ? rh(cx - a, cy - b, 2 * a, 2 * b, { k:'var(--ink-soft)', w:1.4, d:'5 4' }) : '';
  s += veelhoek([[cx - a, cy], [cx, cy - b], [cx + a, cy], [cx, cy + b]], { f:VUL, k:KL, w:2.4 }) + lijn(cx - a, cy, cx + a, cy, { k:'var(--orange)', w:1.8 }) + lijn(cx, cy - b, cx, cy + b, { k:'var(--orange)', w:1.8 });
  s += tekst(cx + a / 2, cy + 12, `${nf(d1)} ${e}`, { s:13 }) + tekst(cx + 8, cy - b / 2, `${nf(d2)} ${e}`, { s:13, a:'start' });
  return svg(W, H, s, { label:'ruit met diagonalen', b:o.bw || W });
}
function trapFig(g, k, h, e, o = {}){
  const sc = Math.min(26, 230 / g), W = g * sc + 50, H = h * sc + 50, x0 = 25, y0 = H - 22, off = (g - k) * sc * .35;
  const p = [[x0, y0], [x0 + g * sc, y0], [x0 + off + k * sc, y0 - h * sc], [x0 + off, y0 - h * sc]];
  let s = veelhoek(p, { f:VUL, k:KL, w:2.4 }) + lijn(x0 + off, y0 - h * sc, x0 + off, y0, { k:'var(--orange)', w:1.8, d:'5 4' }) + rhoekL([x0 + off, y0], [x0 + off, y0 - h * sc], [x0 + g * sc, y0], { s:8, g:3, k:'var(--orange)' });
  s += tekst((p[0][0] + p[1][0]) / 2, y0 + 13, `${nf(g)} ${e}`, { s:13 }) + tekst((p[2][0] + p[3][0]) / 2, y0 - h * sc - 11, `${nf(k)} ${e}`, { s:13 }) + tekst(x0 + off + 6, y0 - h * sc / 2, `${nf(h)} ${e}`, { s:13, a:'start', f:'var(--orange)' });
  return svg(W, H, s, { label:'trapezium met hoogte', b:o.bw || W });
}
function paraFig(b, h, e, o = {}){
  const sc = Math.min(28, 210 / b), sh = 1.6 * sc, W = b * sc + sh + 50, H = h * sc + 46, x0 = 22, y0 = H - 22;
  const p = [[x0, y0], [x0 + b * sc, y0], [x0 + b * sc + sh, y0 - h * sc], [x0 + sh, y0 - h * sc]];
  let s = veelhoek(p, { f:VUL, k:KL, w:2.4 }) + lijn(x0 + sh, y0 - h * sc, x0 + sh, y0, { k:'var(--orange)', w:1.8, d:'5 4' }) + rhoekL([x0 + sh, y0], [x0 + sh, y0 - h * sc], [x0 + b * sc, y0], { s:8, g:3, k:'var(--orange)' });
  s += tekst((p[0][0] + p[1][0]) / 2 + 10, y0 + 13, `${nf(b)} ${e}`, { s:13 }) + tekst(x0 + sh + 6, y0 - h * sc / 2, `${nf(h)} ${e}`, { s:13, a:'start', f:'var(--orange)' });
  return svg(W, H, s, { label:'parallellogram met hoogte', b:o.bw || W });
}
K({ id:'v_ruit', titel:'De oppervlakte van een ruit', niv:3, maak(R){
  const d1 = R.pick([6, 7, 8, 9, 10]), d2 = R.pick([3, 4, 5, 6].filter(x=>x < d1)), e = 'cm';
  return { fig:ruitFig(d1, d2, e, { kader:true }), tekst:'<p>Rond de ruit staat een rechthoek (stippellijn). De ruit is de helft van die rechthoek.</p><p>Oppervlakte ruit = <b>grote diagonaal x kleine diagonaal : 2</b></p>', vragen:[
    { t:'Oppervlakte van de rechthoek =', na:'cm²', a:d1 * d2 }, { t:'Oppervlakte van de ruit =', na:'cm²', a:d1 * d2 / 2 }
  ], sol:`rechthoek: ${d1} cm x ${d2} cm = ${d1 * d2} cm²<br>ruit: ${d1} cm x ${d2} cm : 2 = <b>${nf(d1 * d2 / 2)} cm²</b>` };
} });
K({ id:'v_trap', titel:'De oppervlakte van een trapezium', niv:3, maak(R){
  const g = R.int(6, 11), k = R.int(2, g - 2), h = R.int(2, 5);
  return { fig:trapFig(g, k, h, 'cm'), tekst:'<p>Oppervlakte trapezium = <b>(grote basis + kleine basis) x hoogte : 2</b></p>', vragen:[
    { t:'grote basis + kleine basis =', na:'cm', a:g + k }, { t:'Oppervlakte van het trapezium =', na:'cm²', a:(g + k) * h / 2 }
  ], sol:`(${g} cm + ${k} cm) x ${h} cm : 2 = ${g + k} x ${h} : 2 = ${(g + k) * h} : 2 = <b>${nf((g + k) * h / 2)} cm²</b>` };
} });
K({ id:'v_mix', titel:'Welke figuur? Bereken de oppervlakte', niv:3, maak(R){
  const g = R.pick([8, 9, 10, 11]) + R.pick([0, .5, 0]), k = R.pick([4, 5, 6]) + R.pick([0, .8, 0]), h = R.int(3, 5), b = R.int(5, 8), hp = R.int(2, 4), d1 = R.int(5, 8), d2 = R.int(3, d1 - 1);
  const f = R.shuffle([['trapezium', trapFig(g, k, h, 'cm', { bw:210 }), rnd((g + k) * h / 2), `(${nf(g)} cm + ${nf(k)} cm) x ${h} cm : 2`], ['parallellogram', paraFig(b, hp, 'cm', { bw:200 }), b * hp, `${b} cm x ${hp} cm`], ['ruit', ruitFig(d1, d2, 'cm', { bw:190 }), d1 * d2 / 2, `${d1} cm x ${d2} cm : 2`]]);
  const namen = ['parallellogram', 'ruit', 'trapezium'];
  return { fig:`<div class="figraster">${f.map((x, i)=>`<div class="nrfig"><b>${i + 1}</b>${x[1]}</div>`).join('')}</div>`, boven:true, q3:true, tekst:'<p>Kies de juiste figuur en bereken de oppervlakte met de formule.</p>',
    vragen:f.map((x, i)=>({ t:`Figuur ${i + 1} is een`, soort:'keuze', keuzes:namen, a:namen.indexOf(x[0]) })).concat(f.map((x, i)=>({ t:`Oppervlakte ${i + 1} =`, na:'cm²', a:x[2] }))),
    sol:f.map((x, i)=>`${i + 1}. ${x[0]}: ${x[3]} = <b>${nf(x[2])} cm²</b>`).join('<br>') };
} });

/* ---------- vraagstukken ---------- */
const SIT = [
  ['een omheining rond een weide zetten', 0], ['graszaad zaaien op een gazon', 1], ['een muur schilderen', 1], ['rondjes lopen rond een sportveld', 0], ['tegels leggen in de keuken', 1],
  ['een plint langs de muren van een kamer leggen', 0], ['een lint rond een cadeaudoos spannen', 0], ['een tapijt kopen voor de woonkamer', 1], ['een draad rond een kippenren spannen', 0], ['meststof strooien op een akker', 1]
];
K({ id:'p_wat', titel:'Omtrek of oppervlakte?', niv:1, maak(R){
  const l = R.kies(SIT, 5);
  return { tekst:'<p><b>Omtrek</b> = de lengte van de rand (in m, cm …). <b>Oppervlakte</b> = hoeveel plaats iets inneemt (in m², cm² …).</p><p>Wat moet je berekenen?</p>',
    vragen:l.map(([z, a])=>({ t:`Je wil ${z}.`, soort:'keuze', keuzes:OO, a })), sol:l.map(([z, a])=>`${z}: <b>${OO[a]}</b>`).join('<br>') };
} });
K({ id:'p_weide', titel:'Rond de weide', niv:1, maak(R){
  const z = [R.stap(150, 320, 5), R.stap(100, 200, 5), R.stap(150, 300, 5), R.stap(100, 200, 5)], n = R.naam();
  const pts = [[30, 130], [250, 140], [215, 40], [60, 55]];
  const a = R.int(8, 30), b = R.int(a + 4, 48), nm = R.naam();
  return { fig:matenFig(pts, z.map(x=>x + ' m'), { b:290, h:175, label:'weide' }), tekst:`<p>${n} loopt één keer rond de weide.</p>`, vragen:[
    { t:'Moet je de omtrek of de oppervlakte berekenen?', soort:'keuze', keuzes:OO, a:0 },
    { t:`Hoeveel meter heeft ${n} afgelegd?`, na:'m', a:som(z) },
    { t:`Een bouwgrond heeft de vorm van een parallellogram met een zijde van ${a} m en een zijde van ${b} m. ${nm} spant een draad rond de bouwgrond. Hoeveel meter draad heeft ${nm} nodig?`, na:'m', a:2 * (a + b), hint:[{ t:'Een parallellogram heeft 2 paar even lange zijden: ' + a + ' m + ' + b + ' m + ' + a + ' m + ' + b + ' m.', a:2 * (a + b), na:'m' }] }
  ], sol:`${z.join(' m + ')} m = <b>${nf(som(z))} m</b><br>${a} m + ${b} m + ${a} m + ${b} m = <b>${2 * (a + b)} m</b>` };
} });
K({ id:'p_rond', titel:'Rondjes rond een terrein', niv:2, maak(R){
  const L = R.stap(60, 250, 10), B = R.stap(40, L - 20, 10), n = R.int(3, 12), wie = R.pick(['een bewaker', 'een loper', 'de trainer']), om = 2 * (L + B), tot = n * om;
  return { tekst:`<p>Een sportterrein heeft de vorm van een rechthoek. Het is <b>${L} m</b> lang en <b>${B} m</b> breed.</p><p>Elke dag loopt ${wie} <b>${n} keer</b> rond het terrein.</p>`, vragen:[
    { t:'Hoeveel meter is één keer rond het terrein?', na:'m', a:om, hint:[{ t:'Dat is de omtrek: lengte + breedte + lengte + breedte.', a:om, na:'m' }] },
    { t:`Hoeveel meter is dat op één dag (${n} keer)?`, na:'m', a:tot, hint:[{ t:`${n} x ${om} m =`, a:tot, na:'m' }] },
    { t:'Rond af. Dat is ongeveer', na:'km', a:afrondingenKm(tot), toonA:'ongeveer ' + nf(Math.round(tot / 1000)) + ' km', voorbeeld:String(Math.max(1, Math.round(tot / 1000))), uitleg:'1 km = 1 000 m. Rond af op een heel aantal km.' }
  ], sol:`omtrek = ${L} m + ${B} m + ${L} m + ${B} m = ${om} m<br>${n} x ${om} m = <b>${nf(tot)} m</b><br>Dat is ongeveer <b>${Math.max(1, Math.round(tot / 1000))} km</b>.` };
} });
const afrondingenKm = m => { const s = new Set([Math.round(m / 1000), Math.max(1, Math.round(m / 1000)), rnd(Math.round(m / 100) / 10, 1)]); return [...s]; };
K({ id:'p_zaad', titel:'Graszaad, verf en tegels', niv:2, maak(R){
  const v = R.int(0, 2);
  if(v === 0){ const L = R.stap(60, 150, 10), B = R.stap(30, 80, 10), k = R.pick([2, 2.5, 3, 1.5]), opp = L * B;
    return { tekst:`<p>Een boer zaait gras in een rechthoekige wei. De wei is <b>${L} m</b> lang en <b>${B} m</b> breed.</p><p>Voor elke <b>100 m²</b> heb je <b>${nf(k)} kg</b> graszaad nodig.</p>`, vragen:[
      { t:'Moet je de omtrek of de oppervlakte berekenen?', soort:'keuze', keuzes:OO, a:1 },
      { t:'Hoe groot is de wei?', na:'m²', a:opp, hint:[{ t:`${L} m x ${B} m =`, a:opp, na:'m²' }] },
      { t:'Hoeveel kg graszaad moet de boer kopen?', na:'kg', a:rnd(opp / 100 * k), hint:[{ t:`Hoeveel keer 100 m²? ${nf(opp)} : 100 =`, a:opp / 100 }, { t:`${opp / 100} x ${nf(k)} kg =`, a:rnd(opp / 100 * k), na:'kg' }] }
    ], sol:`oppervlakte: ${L} m x ${B} m = ${nf(opp)} m²<br>${nf(opp)} : 100 = ${opp / 100} en ${opp / 100} x ${nf(k)} kg = <b>${nf(rnd(opp / 100 * k))} kg</b>` }; }
  if(v === 1){ const a = R.int(4, 9), c = R.int(3, 7), h = R.pick([2, 3]), pot = R.pick([10, 12, 15]), opp = 2 * a * h + c * h, n = Math.ceil(opp / pot);
    return { tekst:`<p>Je schildert <b>2 muren van ${a} m op ${h} m</b> en <b>1 muur van ${c} m op ${h} m</b>.</p><p>Met 1 pot verf kan je <b>${pot} m²</b> schilderen.</p>`, vragen:[
      { t:'Moet je de omtrek of de oppervlakte berekenen?', soort:'keuze', keuzes:OO, a:1 },
      { t:'Hoeveel m² moet je schilderen?', na:'m²', a:opp, hint:[{ t:`2 muren: 2 x ${a} m x ${h} m =`, a:2 * a * h, na:'m²' }, { t:`1 muur: ${c} m x ${h} m =`, a:c * h, na:'m²' }] },
      { t:'Hoeveel potten verf moet je kopen?', na:'potten', a:n, uitleg:'Je kan geen halve pot kopen: rond naar boven af.' }
    ], sol:`2 x ${a} x ${h} = ${2 * a * h} m² en ${c} x ${h} = ${c * h} m²; samen <b>${opp} m²</b><br>${opp} : ${pot} = ${nf(rnd(opp / pot, 2))} → <b>${n} potten</b> (naar boven afronden)` }; }
  const a = R.pick([3.5, 4, 4.5, 5, 6]), b = R.pick([2, 3]), p = R.int(25, 40), q = R.int(20, 40), opp = rnd(a * b), tot = rnd(opp * (p + q));
  return { tekst:`<p>${R.naam()} laat de gang van <b>${nf(a)} m bij ${b} m</b> vloeren. De tegels kosten <b>€ ${p} per m²</b>. De vloerder vraagt <b>€ ${q} per m²</b>.</p>`, vragen:[
    { t:'Hoe groot is de gang?', na:'m²', a:opp },
    { t:'Hoeveel kosten de tegels?', voor:'€', a:rnd(opp * p), geld:true },
    { t:'Hoeveel kost het in totaal?', voor:'€', a:tot, geld:true, hint:[{ t:'Prijs voor het vloeren: ' + nf(opp) + ' x € ' + q + ' =', voor:'€', a:rnd(opp * q) }, { t:'Tel de prijs van de tegels en van het vloeren samen.', voor:'€', a:tot }] }
  ], sol:`${nf(a)} m x ${b} m = ${nf(opp)} m²<br>tegels: € ${p} x ${nf(opp)} = ${eur(rnd(opp * p))} · vloeren: € ${q} x ${nf(opp)} = ${eur(rnd(opp * q))}<br>totaal: <b>${eur(tot)}</b>` };
} });

/* ---------- puzzels: somvierkant met de cijfers 1 tot 9 ---------- */
function permutaties(a){ if(a.length <= 1) return [a]; return a.flatMap((x, i)=>permutaties(a.slice(0, i).concat(a.slice(i + 1))).map(p=>[x].concat(p))); }
function somPuzzel(R, nLeeg){
  for(let p = 0; p < 400; p++){
    const g = R.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]); const rs = [0, 1, 2].map(r=>g[r * 3] + g[r * 3 + 1] + g[r * 3 + 2]), ks = [0, 1, 2].map(c=>g[c] + g[3 + c] + g[6 + c]);
    const leeg = R.kies(rij(9, i=>i), nLeeg).sort((a, b)=>a - b); const ont = leeg.map(i=>g[i]);
    let tel = 0; for(const perm of permutaties(ont)){ const h = g.slice(); leeg.forEach((i, j)=>{ h[i] = perm[j]; }); if([0, 1, 2].every(r=>h[r * 3] + h[r * 3 + 1] + h[r * 3 + 2] === rs[r]) && [0, 1, 2].every(c=>h[c] + h[3 + c] + h[6 + c] === ks[c])) tel++; if(tel > 1) break; }
    if(tel === 1) return { g, rs, ks, leeg };
  }
}
function somKaart(R, nLeeg){
  const { g, rs, ks, leeg } = somPuzzel(R, nLeeg); const map = {}; leeg.forEach((i, j)=>{ map[i] = j; });
  const cel = i=>map[i] != null ? slot(map[i]) : `<b>${g[i]}</b>`;
  return { tekst:`<p>In het vierkant moeten de cijfers van <b>1 tot en met 9</b> staan. De som van elke rij en kolom staat ernaast of eronder.</p><p>Nog invullen: <b>${leeg.map(i=>g[i]).sort((a, b)=>a - b).join(' – ')}</b></p>`,
    fig:`<div class="ttab"><table class="dtable somv">${[0, 1, 2].map(r=>`<tr>${[0, 1, 2].map(c=>`<td>${cel(r * 3 + c)}</td>`).join('')}<th>${rs[r]}</th></tr>`).join('')}<tr>${ks.map(k=>`<th>${k}</th>`).join('')}<td></td></tr></table></div>`,
    vragen:leeg.map(i=>({ a:g[i], label:'ontbrekend cijfer' })), sol:[0, 1, 2].map(r=>g.slice(r * 3, r * 3 + 3).join(' + ') + ' = ' + rs[r]).join('<br>') };
}
K({ id:'pz_som', titel:'Somvierkant: raad slim en probeer', niv:1, maak(R){ return somKaart(R, 5); } });
K({ id:'pz_som2', titel:'Moeilijker somvierkant', niv:2, maak(R){ return somKaart(R, 6); } });

/* ---------- MODULE 5: uitleg bij Ik begrijp het niet (per kaart) ---------- */
const BOOM = '<ul><li><b>vierkant</b>: 4 gelijke zijden en 4 rechte hoeken</li><li><b>rechthoek</b>: 4 rechte hoeken</li><li><b>ruit</b>: 4 gelijke zijden</li><li><b>parallellogram</b>: 2 paar evenwijdige zijden</li><li><b>trapezium</b>: minstens 1 paar evenwijdige zijden</li><li><b>vierhoek</b>: 4 hoeken</li></ul>';
const GEO = '<ol><li>Kijk of de hoek <b>scherp</b> (kleiner dan 90°) of <b>stomp</b> (groter dan 90°) is.</li><li>Leg de <b>0</b> van de geodriehoek op het <b>hoekpunt</b>.</li><li>Draai tot de <b>lange zijde</b> langs één been ligt. De hoek ligt onder de geodriehoek.</li><li>Tel vanaf dat been: 0°, 10°, 20° … (niet vanaf 180°). Lees af bij het andere been.</li><li>Controle: klopt het met scherp of stomp?</li></ol><p>Op het scherm: sleep de geodriehoek, draai aan het oranje bolletje of met de knoppen.</p>';
UITLEG({
  q_naam:BOOM + '<p>De <b>best passende</b> naam is de naam die het meest zegt: een vierkant is ook een rechthoek, maar "vierkant" past het best.</p>',
  q_waar:'<p>Wist je dat …</p><ul><li>een parallellogram ook een trapezium is?</li><li>een rechthoek ook een parallellogram en een trapezium is?</li><li>een ruit ook een parallellogram en een trapezium is?</li><li>een vierkant ook een rechthoek, een ruit, een parallellogram en een trapezium is?</li></ul><p>Omgekeerd klopt het niet altijd: een rechthoek is niet altijd een vierkant.</p>',
  q_raad:BOOM + '<p>Lees elk kenmerk. Zoek de figuur die <b>alle</b> kenmerken heeft en kies de best passende naam.</p>',
  h_soort:'<ul><li><b>scherpe hoek</b>: kleiner dan 90°</li><li><b>rechte hoek</b>: 90°, aangeduid met een kleine L</li><li><b>stompe hoek</b>: groter dan 90° en kleiner dan 180°</li><li><b>gestrekte hoek</b>: 180°, een rechte lijn</li><li><b>volle hoek</b>: 360°</li></ul><p>Tip: vergelijk met de hoek van een blad papier (90°).</p>',
  h_meten:GEO,
  h_meten2:GEO + '<p>Meet je de hoek bij A, leg dan de 0 op A en de lange zijde langs [AB]. Bij B leg je de 0 op B.</p>',
  h_tekenen:'<ol><li>Leg de <b>0</b> van de geodriehoek op het hoekpunt.</li><li>Leg de <b>lange zijde</b> langs het been dat al getekend is.</li><li>Tel vanaf dat been de graden: 0°, 10°, 20° … tot het juiste aantal graden.</li><li>Sleep het oranje punt (het tweede been) tot daar.</li></ol><p>Elke hoek heeft een hoekpunt met een hoofdletter, twee benen en een boogje.</p>',
  t_af:'<ul><li><b>Parallellogram, rechthoek, vierkant</b>: de overstaande zijden zijn even lang en evenwijdig. Doe vanaf het laatste punt dezelfde stappen (naar rechts en naar boven) als langs de overstaande zijde.</li><li><b>Ruit</b>: alle 4 de zijden zijn even lang.</li></ul>',
  t_teken:'<ul><li><b>Rechthoek of vierkant</b>: teken een zijde, dan een zijde loodrecht erop (langs de lijnen van het rooster), en zo verder.</li><li><b>Ruit</b>: teken eerst één diagonaal. Duid het midden aan. Teken door het midden loodrecht de tweede diagonaal, de helft naar elke kant. Verbind de uiteinden.</li></ul><p>Elk hokje is 1 cm: tel de hokjes.</p>',
  t_teken2:'<ul><li>Zet eerst alle maten in cm: 10 mm = 1 cm.</li><li><b>Parallellogram</b>: teken een zijde. Teken hoger (de hoogte) een even lange, evenwijdige zijde, een beetje verschoven. Verbind de uiteinden.</li><li><b>Trapezium</b>: teken de grote basis. Teken hoger een kortere evenwijdige zijde. Verbind de uiteinden.</li><li><b>Ruit</b>: twee diagonalen die elkaar loodrecht in het midden snijden.</li></ul>',
  t_tegel:'<ul><li>Oppervlakte vierkant = zijde x zijde. 16 cm² → 4 cm x 4 cm.</li><li>Oppervlakte rechthoek = lengte x breedte. 12 cm² → 4 cm x 3 cm of 6 cm x 2 cm.</li><li>Omtrek rechthoek: lengte + breedte = de helft van de omtrek.</li></ul>',
  o_omtrek:'<p>De <b>omtrek</b> is de lengte van de rand. <span class="fbox">Tel de lengtes van al de zijden op.</span></p><p>Rechthoek van 4 cm op 3 cm: 4 cm + 3 cm + 4 cm + 3 cm = 14 cm. Vergeet de eenheid niet.</p>',
  o_rh:'<p><span class="fbox">oppervlakte rechthoek = lange zijde x korte zijde</span> <span class="fbox">oppervlakte vierkant = zijde x zijde</span></p><p>De oppervlakte schrijf je in cm², m², mm² … (met het tweetje).</p><p>Zijn de eenheden verschillend? Zet eerst om: 5 m en 40 cm → 500 cm x 40 cm = 20 000 cm².</p>',
  o_samen:'<ol><li>Zoek de ontbrekende zijden: de hele lengte min het stuk dat je kent.</li><li><b>Omtrek</b>: tel alle zijden op.</li><li><b>Oppervlakte</b>: verdeel de figuur in twee rechthoeken. Bereken elke oppervlakte en tel ze samen.</li></ol>',
  o_zijde:'<ul><li>Vierkant: oppervlakte = zijde x zijde. Zoek het getal dat x zichzelf de oppervlakte geeft (49 cm² → 7 cm).</li><li>Vierkant: omtrek = 4 x zijde, dus zijde = omtrek : 4.</li><li>Rechthoek: lengte + breedte = omtrek : 2.</li></ul>',
  v_para:'<p><span class="fbox">oppervlakte parallellogram = basis x hoogte</span></p><p>De <b>hoogte</b> staat loodrecht op de basis. Schuif je de driehoek van links naar rechts, dan krijg je een rechthoek met dezelfde oppervlakte.</p>',
  v_ruit:'<p><span class="fbox">oppervlakte ruit = grote diagonaal x kleine diagonaal : 2</span></p><p>Teken een rechthoek rond de ruit: de ruit is juist de helft van die rechthoek.</p>',
  v_trap:'<p><span class="fbox">oppervlakte trapezium = (grote basis + kleine basis) x hoogte : 2</span></p><p>De grote en de kleine basis zijn de evenwijdige zijden. De hoogte staat loodrecht op de basis. Reken eerst wat tussen haakjes staat.</p>',
  v_mix:'<ul><li><b>parallellogram</b>: basis x hoogte</li><li><b>ruit</b>: grote diagonaal x kleine diagonaal : 2</li><li><b>trapezium</b>: (grote basis + kleine basis) x hoogte : 2</li></ul><p>Schrijf de formule, vul de getallen in en reken uit. Vergeet cm² niet.</p>',
  p_wat:'<ul><li><b>Omtrek</b>: iets <b>rond</b> een figuur: een omheining, een draad, een plint, rondjes lopen. In m of cm.</li><li><b>Oppervlakte</b>: iets <b>op</b> een figuur: verf, tegels, gras, tapijt. In m² of cm².</li></ul>',
  p_weide:'<p>Eén keer rond de weide = de <b>omtrek</b>. Tel de lengtes van alle zijden op.</p><p>Een parallellogram heeft 2 paar even lange zijden: zijde + zijde + zijde + zijde.</p>',
  p_rond:'<ol><li>Eén keer rond = de <b>omtrek</b>: lengte + breedte + lengte + breedte.</li><li>Meerdere keren: aantal x omtrek.</li><li>Afronden op km: 1 km = 1 000 m. 3 072 m ≈ 3 km.</li></ol>',
  p_zaad:'<ol><li>Moet je iets <b>op</b> de figuur leggen of zaaien? Dan bereken je de <b>oppervlakte</b>.</li><li>Bereken de oppervlakte: lengte x breedte.</li><li>Per 100 m²: oppervlakte : 100, en dan x wat je per 100 m² nodig hebt.</li><li>Potten verf: oppervlakte : m² per pot, en rond naar boven af.</li></ol>',
  pz_som:'<ol><li>Kijk welke cijfers je nog moet invullen.</li><li>Zoek een rij of kolom met maar één leeg vak: dat cijfer = de som – de cijfers die er al staan.</li><li>Raad slim: is de som laag, dan zijn de cijfers meestal laag. Is de som hoog, dan zijn ze hoog. Controleer elke rij en kolom.</li></ol>',
  pz_som2:'<ol><li>Begin met een rij of kolom met maar één leeg vak.</li><li>Zijn er twee lege vakken? Welke twee cijfers uit de lijst geven samen het ontbrekende stuk?</li><li>Probeer en controleer ook de kolommen.</li></ol>'
});

/* ---------- MODULE 5: onderdelen, proeftoets en snelle quiz ----------
   Nieuwe kaarten altijd achteraan een onderdeel toevoegen; kaart-id's nooit hernoemen (opslagsleutel en vraag-id). */
const SECS = [
  { id:'vierh', nav:'Vierhoeken', title:'Vierhoeken herkennen', ic:'vlak', tip:'Een vierhoek heeft 4 hoeken. Kies altijd de <b>best passende</b> naam. Een rechte hoek duiden we aan met een kleine L.', kaarten:['q_naam', 'q_waar', 'q_raad'] },
  { id:'hoeken', nav:'Hoeken', title:'Hoeken meten en tekenen', ic:'hoek', tip:'Hoeken meet en teken je met de <b>geodriehoek</b>. Op het scherm kan je hem verslepen en draaien.', kaarten:['h_soort', 'h_meten', 'h_meten2', 'h_tekenen'] },
  { id:'tekenen', nav:'Tekenen', title:'Vierhoeken tekenen', ic:'teken', tip:'Elk hokje van het rooster is 1 cm. Klik de hoekpunten aan.', kaarten:['t_af', 't_teken', 't_teken2', 't_tegel'] },
  { id:'opp', nav:'Omtrek en oppervlakte', title:'Omtrek en oppervlakte', ic:'opp', tip:'<b>Omtrek</b>: tel alle zijden op (m, cm). <b>Oppervlakte</b> rechthoek: lengte x breedte (m², cm²).', kaarten:['o_omtrek', 'o_rh', 'o_samen', 'o_zijde'], verd:['v_para', 'v_ruit', 'v_trap', 'v_mix'] },
  { id:'vraag', nav:'Vraagstukken', title:'Vraagstukken over vierhoeken', ic:'vraag', tip:'Vraag je altijd eerst af: moet ik de <b>omtrek</b> of de <b>oppervlakte</b> berekenen? Schrijf de eenheid achter het getal.', kaarten:['p_wat', 'p_weide', 'p_rond', 'p_zaad'] },
  { id:'puzzels', nav:'Puzzels', title:'Puzzels: raad slim en probeer', ic:'puzzel', telt:false, tip:'Puzzels om je hersenen te trainen. Ze tellen niet mee voor je resultaten.', kaarten:['pz_som', 'pz_som2'] },
  { id:'quiz', nav:'Snelle quiz', title:'Snelle quiz', ic:'quiz', soort:'quiz', telt:false },
  { id:'toets', nav:'Proeftoets', title:'Proeftoets vierhoek', ic:'toets', soort:'toets', sepBefore:true, tip:'Opgebouwd zoals de toets. De laatste vraag is verdieping.' }
];
const TOETS = { titel:'Proeftoets vierhoek', kaarten:['h_meten2', 't_teken2', 't_tegel', 'p_weide', 'p_zaad', 'p_rond', 'o_samen', 'pz_som', 'v_mix'],
  kan:{ h_meten2:'hoeken meten', t_teken2:'een trapezium, parallellogram, ruit, rechthoek en vierkant tekenen', t_tegel:'een vierkant of rechthoek tekenen met een gegeven oppervlakte of omtrek', p_weide:'de omtrek van vierhoeken berekenen',
    p_zaad:'vraagstukken over oppervlakte oplossen', p_rond:'vraagstukken over omtrek oplossen', o_samen:'de omtrek en de oppervlakte van een samengestelde figuur berekenen', pz_som:'slim raden en proberen (somvierkant)', v_mix:'de oppervlakte van een parallellogram, ruit en trapezium berekenen' } };
const QUIZ = [
  R=>{ const a = R.pick([R.int(20, 80), R.int(100, 170)]); return { t:`Een hoek van ${a}° is een … hoek (scherpe of stompe)`, a:a < 90 ? ['scherpe', 'scherp', 'scherpe hoek'] : ['stompe', 'stomp', 'stompe hoek'], soort:'tekst' }; },
  ()=>({ t:'Hoeveel graden is een rechte hoek?', a:90, na:'°' }),
  ()=>({ t:'Hoeveel graden is een gestrekte hoek?', a:180, na:'°' }),
  R=>{ const z = R.int(3, 12); return { t:`Een vierkant heeft een zijde van ${z} cm. De omtrek is …`, a:4 * z, na:'cm' }; },
  R=>{ const z = R.int(3, 10); return { t:`Een vierkant heeft een zijde van ${z} cm. De oppervlakte is …`, a:z * z, na:'cm²' }; },
  R=>{ const a = R.int(4, 12), b = R.int(2, 9); return { t:`Een rechthoek is ${a} m lang en ${b} m breed. De oppervlakte is …`, a:a * b, na:'m²' }; },
  R=>{ const a = R.int(4, 12), b = R.int(2, 9); return { t:`Een rechthoek is ${a} m lang en ${b} m breed. De omtrek is …`, a:2 * (a + b), na:'m' }; },
  ()=>({ t:'Een vierhoek met 4 gelijke zijden zonder rechte hoeken is een …', a:['ruit', 'een ruit'], soort:'tekst' }),
  ()=>({ t:'Een vierhoek met maar 1 paar evenwijdige zijden is een …', a:['trapezium', 'een trapezium'], soort:'tekst' }),
  R=>{ const d1 = R.pick([4, 6, 8, 10]), d2 = R.pick([2, 4, 6]); return { t:`Een ruit heeft diagonalen van ${d1} cm en ${d2} cm. De oppervlakte is …`, a:d1 * d2 / 2, na:'cm²' }; },
  R=>{ const z = R.int(2, 9); return { t:`Een vierkant heeft een oppervlakte van ${z * z} cm². Een zijde is …`, a:z, na:'cm' }; }
];

/* ============================================================
   OPBOUW: zijbalk, onderdelen en tabbladen
   SECS komt uit het modulebestand: { id, nav, title, ic, tip, kaarten:[], verd:[], rm, telt, soort:'toets'|'quiz', sepBefore }
   ============================================================ */
const ICONS = {
  geld:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v.01M18 15v.01"/>',
  reken:'<path d="M5 12h14M12 5v14"/>',
  schat:'<path d="M3 12c3-6 6-6 9 0s6 6 9 0"/>',
  gem:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  rm:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
  min:'<path d="M5 12h14"/><circle cx="12" cy="12" r="9"/>',
  lengte:'<path d="M3 17l14-14 4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  massa:'<path d="M6 8h12l2 12H4z"/><circle cx="12" cy="5" r="2"/>',
  inhoud:'<path d="M7 3h10l-1 18H8z"/><path d="M7.5 10h9"/>',
  opp:'<rect x="4" y="4" width="16" height="16"/><path d="M4 12h16M12 4v16"/>',
  rooster:'<path d="M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
  kaart:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  assen:'<path d="M12 3v18M3 12h18"/><circle cx="16" cy="8" r="1.6"/>',
  vlak:'<path d="M4 18l4-12h12l-4 12z"/>',
  ruimte:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  blok:'<path d="M3 10l6-3 6 3-6 3z"/><path d="M3 10v6l6 3v-6M15 10v6l-6 3"/><path d="M15 10l6-3v6l-6 3"/>',
  hoek:'<path d="M4 20h16M4 20 17 6"/><path d="M11 20a7 7 0 0 0-2-5"/>',
  teken:'<path d="M4 20h16M4 20V4"/><path d="M8 16l3-8 6 2-2 6z"/>',
  vraag:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.01"/>',
  puzzel:'<path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3z"/>',
  quiz:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  toets:'<path d="M9 4h6v3H9z"/><path d="M15 5h3v16H6V5h3"/><path d="m9 13 2 2 4-4"/>'
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

if(window.CL_VERBORGEN){ for(let i = SECS.length - 1; i >= 0; i--) if(window.CL_VERBORGEN.has(SECS[i].id)) SECS.splice(i, 1); }
const SECTIONS = SECS;
const app = document.getElementById('app'), nav = document.getElementById('nav'), pager = document.getElementById('pager');
const secEls = {}, navLinks = {}, bouwers = {};

function tabs(sec, s, lijst){
  const bar = el('div', 'tabs'); bar.setAttribute('role', 'tablist');
  const panes = {}, knoppen = {};
  const zet = k=>{ Object.keys(panes).forEach(x=>{ panes[x].hidden = x !== k; knoppen[x].setAttribute('aria-selected', String(x === k)); }); bewaar('stab_' + sec.id, k); };
  lijst.forEach(([k, naam, bouw])=>{ const b = knop('tab', naam, ()=>zet(k)); b.setAttribute('role', 'tab'); bar.append(b); knoppen[k] = b; const p = el('div', 'tabpane'); bouw(p); panes[k] = p; });
  s.append(bar, ...Object.values(panes));
  let k0 = lees('stab_' + sec.id); if(!panes[k0]) k0 = lijst[0][0];
  zet(k0);
}
SECS.forEach((sec, si)=>{
  const num = si + 1;
  if(sec.sepBefore) nav.append(el('li', 'sep'));
  const li = el('li'), a = knop('', `${icon(sec.ic)}<span class="n">${num}</span><span class="lbl">${sec.nav}</span>`, ()=>show(sec.id, true));
  li.append(a); nav.append(li); navLinks[sec.id] = a;
  const s = el('section', 'group'); s.id = sec.id; s.hidden = true;
  s.append(el('div', 'sec-head', `<span class="sec-ic">${icon(sec.ic)}</span><h2><span class="num">${num}.</span>${sec.title}</h2>`));
  if(sec.tip || sec.rm){
    const t = el('div', 'tip', icon(sec.ic) + `<div>${sec.tip || ''}${sec.rm ? ' <b>Je mag een rekenmachine gebruiken.</b>' : ''}</div>`);
    if(sec.rm) t.append(knop('btn ghost rm-knop', icon('rm') + ' Rekenmachine', rekenmachine));
    s.append(t);
  }
  const telt = sec.telt !== false;
  const lijstVan = (p, ids)=>ids.forEach(kid=>p.append(kaartEl(sec.id, kid, { telt })));
  bouwers[sec.id] = ()=>{
    if(s.dataset.gebouwd) return; s.dataset.gebouwd = '1';
    if(sec.soort === 'toets') s.append(toetsPaneel(TOETS));
    else if(sec.soort === 'quiz') s.append(quizPaneel(QUIZ));
    else if(sec.verd && sec.verd.length) tabs(sec, s, [['oef', 'Basis en oefenen', p=>lijstVan(p, sec.kaarten)], ['verd', 'Verdieping', p=>{ p.append(el('p', 'verd-intro', 'Verdieping is moeilijker en heeft geen hints.')); lijstVan(p, sec.verd); }]]);
    else { const p = el('div', 'kaarten'); lijstVan(p, sec.kaarten); s.append(p); }
  };
  app.append(s); secEls[sec.id] = s;
});

function show(id, scroll){
  const idx = SECS.findIndex(s=>s.id === id); if(idx < 0) return;
  SECS.forEach(s=>{ secEls[s.id].hidden = s.id !== id; navLinks[s.id].removeAttribute('aria-current'); });
  navLinks[id].setAttribute('aria-current', 'page');
  bouwers[id]();
  try{ const a = navLinks[id]; if(nav.scrollWidth > nav.clientWidth) nav.scrollLeft = a.offsetLeft - 16; }catch(e){}
  if(pager){ pager.innerHTML = '';
    if(idx > 0){ const p = SECS[idx - 1]; pager.append(knop('prev', `<small>← Vorige</small>${idx}. ${p.nav}`, ()=>show(p.id, true))); }
    if(idx < SECS.length - 1){ const n = SECS[idx + 1]; pager.append(knop('next', `<small>Volgende →</small>${idx + 2}. ${n.nav}`, ()=>show(n.id, true))); } }
  try{ localStorage.setItem(PREFIX + 'tab', id); }catch(e){}
  if(scroll) window.scrollTo({ top:0, behavior:'smooth' });
}
/* naar de oefenkaart springen (feedback na de proeftoets) */
function kaartSectie(kid){ return SECS.find(s=>(s.kaarten || []).includes(kid) || (s.verd || []).includes(kid)); }
function gaNaarKaart(kid){
  const sec = kaartSectie(kid); if(!sec) return; const inVerd = (sec.verd || []).includes(kid);
  bewaar('stab_' + sec.id, inVerd ? 'verd' : 'oef'); show(sec.id, false);
  const s = secEls[sec.id], t = s.querySelectorAll('.tabs .tab'); if(t.length) t[inVerd ? 1 : 0].click();
  const c = s.querySelector(`.card[data-kaart="${kid}"]`);
  if(c){ c.scrollIntoView({ block:'start', behavior:'smooth' }); c.classList.add('flits'); setTimeout(()=>c.classList.remove('flits'), 2200); } else window.scrollTo({ top:0, behavior:'smooth' });
}
/* testhaak (enkel voor de testscripts) */
window.__m2b = { KAARTEN, maakKaart, vraagJuist, SECS, TOETS, ikBegrijpHetNiet, gaNaarKaart };
if(SECS.length){
  let startId = SECS[0].id;
  try{ const h = location.hash.slice(1), t = localStorage.getItem(PREFIX + 'tab'); if(secEls[h]) startId = h; else if(t && secEls[t]) startId = t; }catch(e){}
  show(startId, false);
}

window.SECTIONS = SECTIONS; window.show = show;
})();
