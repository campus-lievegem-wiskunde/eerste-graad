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
const lees = k => { try{ return JSON.parse(localStorage.getItem(PREFIX + k) || 'null'); }catch(e){ return null; } };
const bewaar = (k, v) => { try{ localStorage.setItem(PREFIX + k, JSON.stringify(v)); }catch(e){} };
const wis = k => { try{ localStorage.removeItem(PREFIX + k); }catch(e){} };
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
    let hb = null, tb = null;
    if(inst.hint && def.niv !== 3){ hb = hintBlok(inst.hint); act.append(knop('btn ghost', '💡 Hint', ()=>{ hb.hidden = !hb.hidden; })); }
    if(inst.toon){ tb = toonBlok(inst.toon); act.append(knop('btn ghost demo-btn', '▶ Toon mij hoe', ()=>{ tb.hidden = !tb.hidden; if(!tb.hidden) tb._open(); })); }
    const sol = el('div', 'sol', inst.sol || vr.map((v, i)=>`${vr.length > 1 ? (i + 1) + '. ' : ''}${antwTekst(v)}`).join('<br>')); sol.hidden = true;
    const sl = knop('linkbtn', 'Toon oplossing', ()=>{ sol.hidden = !sol.hidden; sl.textContent = sol.hidden ? 'Toon oplossing' : 'Verberg oplossing'; });
    sl.hidden = !st.n; act.append(sl);
    main.append(act, fb); if(hb) main.append(hb); if(tb) main.append(tb); main.append(sol);
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

/* TOETS = { titel, intro, kaarten:[kid, ...] }: elke kaart wordt een vraag; elk invulvak is één punt */
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
      pane.prepend(el('div', 'score', `<div class="big">${score}/${n}</div><div>Niveau: <span class="lvl">${niveauVan(r)}</span></div><div>${r < 1 ? 'Bij elke fout staat het juiste antwoord. Oefen die onderdelen nog eens.' : 'Knap gedaan!'}</div>`));
      act.append(knop('btn big', 'Maak een nieuwe proeftoets', ()=>{ wis(key); teken(); pane.scrollIntoView({ block:'start' }); }));
    }
    pane.append(act);
  }
  pane._vulJuist = ()=>{ const st = lees(key); TOETS.kaarten.forEach(k=>{ const inst = maakKaart(k, st.seeds[k]); st.v[k] = {}; inst.vragen.forEach((v, i)=>{ st.v[k][i] = voorbeeldAntw(v); }); }); bewaar(key, st); teken(); };
  teken();
  return pane;
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
   MODULE 1 · REKENEN (2B)
   Gebaseerd op toets 1.1 (zonder rekenmachine), 1.2 (schatten), 1.3 (met rekenmachine) en taak 1.1 (gemiddelde en mediaan).
   Altijd andere getallen dan in de toetsen; bedragen worden in cent berekend.
   ============================================================ */
const C = x => Math.round(x * 100);          /* euro -> cent */
const E = c => c / 100;                      /* cent -> euro */
const tab = (koppen, rijen, o = {}) => `<div class="ttab"><table class="dtable${o.cls ? ' ' + o.cls : ''}">${koppen ? '<tr>' + koppen.map(k=>`<th${o.l ? ' class="l"' : ''}>${k}</th>`).join('') + '</tr>' : ''}${rijen.map(r=>'<tr>' + r.map((c, i)=>`<td${o.l && i === 0 ? ' class="l"' : ''}>${c}</td>`).join('') + '</tr>').join('')}</table></div>`;
const slot = i => `<span data-v="${i}"></span>`;

/* ---------- 1 · Rekenen met geld (zonder rekenmachine) ---------- */
function willekeurigGeld(R, o = {}){
  const biljetten = R.kies([500, 1000, 2000, 5000], R.int(o.bmin == null ? 1 : o.bmin, o.bmax || 2));
  if(R.kans(.3)) biljetten.push(R.pick([500, 1000, 2000]));
  const munten = []; const n = R.int(o.mmin || 3, o.mmax || 6);
  for(let i = 0; i < n; i++) munten.push(R.pick([200, 200, 100, 100, 50, 20, 20, 10, 5, 50]));
  return biljetten.concat(munten);
}
K({ id:'geld_tel', titel:'Tel het geld', niv:1, maak(R){
  const st = willekeurigGeld(R), T = som(st);
  let P = T + R.pick([-1, 1]) * R.pick([5, 10, 45, 95, 150, 205, 310, 480]); if(P < 100) P = T + 255;
  const ding = R.pick(['een T-shirt', 'een pet', 'een boek', 'sportsokken', 'een gsm-hoesje', 'een rugzak', 'een cadeaubon']);
  const k = P < T ? 0 : P === T ? 1 : 2, verschil = Math.abs(T - P);
  const bilj = st.filter(isBiljet), munt = st.filter(c=>!isBiljet(c));
  return { fig:geldFig(st, { b:380 }), tekst:'', vragen:[
    { t:'Hoeveel geld ligt er?', voor:'€', a:E(T), geld:true, hint:[{ t:'Tel eerst de biljetten.', voor:'€', a:E(som(bilj)) }, { t:'Tel nu de munten. Begin met de grootste.', voor:'€', a:E(som(munt)) }, { t:'Tel beide samen.', voor:'€', a:E(T) }] },
    { t:`Je wil ${ding} kopen van <b>${eur(E(P))}</b>. Ligt er voldoende geld?`, soort:'keuze', keuzes:['Ja, er ligt te veel.', 'Ja, er ligt juist voldoende.', 'Nee, er ligt te weinig.'], a:k },
    { t:k === 1 ? 'Hoeveel geld blijft er over?' : k === 0 ? 'Hoeveel geld ligt er te veel?' : 'Hoeveel geld ligt er te weinig?', voor:'€', a:E(verschil), geld:true }
  ], sol:`Biljetten: ${eur(E(som(bilj)))}. Munten: ${eur(E(som(munt)))}. Samen: <b>${eur(E(T))}</b>.<br>${eur(E(T))} – ${eur(E(P))}: er ligt ${k === 0 ? `${eur(E(verschil))} te veel` : k === 1 ? 'juist voldoende' : `${eur(E(verschil))} te weinig`}.` };
} });
K({ id:'geld_komma', titel:'Schrijf het bedrag als een kommagetal', niv:1, maak(R){
  const items = rij(4, i=>{ const eu = R.int(1, i === 3 ? 250 : 60); const ct = i === 0 ? R.int(1, 9) : i === 1 ? R.pick([10, 20, 30, 40, 50, 60, 70, 80, 90]) : R.stap(5, 95, 5); return { eu, ct }; });
  return { tekst:'<p>Bij een bedrag in euro schrijf je altijd <b>twee cijfers na de komma</b>.</p>', q2:true, vragen:R.shuffle(items).map(({ eu, ct })=>({ t:`${eu} euro en ${ct} cent =`, voor:'€', a:eu + ct / 100, geld:true, w:'md', uitleg:ct < 10 ? `Let op: ${ct} cent is € 0,0${ct}.` : '' })),
    sol:items.map(({ eu, ct })=>`${eu} euro en ${ct} cent = ${eur(eu + ct / 100)}`).join('<br>') };
} });
K({ id:'geld_kassa', titel:'Hoeveel geld zit er in de kassa?', niv:2, maak(R){
  const soorten = R.shuffle([[20, R.pick([10, 20, 30])], [50, R.pick([5, 8, 12, 14])], [200, R.int(13, 48)], [500, R.int(11, 29)], [1000, R.int(12, 39)], [100, R.pick([100, 40, 60])]]).slice(0, 5).sort((a, b)=>a[0] - b[0]);
  const tot = som(soorten.map(([c, n])=>c * n));
  return { tekst:'<p>Reken uit hoeveel geld er van elke soort is. Reken daarna alles samen.</p>',
    fig:tab(['aantal', 'stuk of briefje', 'bedrag'], soorten.map(([c, n], i)=>[n, `${isBiljet(c) ? 'briefjes' : 'stukken'} van ${geldNaam(c)}`, '€ ' + slot(i)]).concat([['', '<b>samen</b>', '€ ' + slot(5)]])),
    vragen:soorten.map(([c, n])=>({ a:E(c * n), geld:true, label:`${n} van ${geldNaam(c)}` })).concat([{ a:E(tot), geld:true, label:'samen' }]),
    hint:[{ t:`Hoeveel is ${soorten[0][1]} x ${geldNaam(soorten[0][0])}? Tip: 10 stukken van 20 cent is 200 cent of € 2,00.`, voor:'€', a:E(soorten[0][0] * soorten[0][1]) },
      { t:`Hoeveel is ${soorten[3][1]} x ${geldNaam(soorten[3][0])}? Tip: x 5 = eerst x 10, dan : 2. x 10 = een nul erbij.`, voor:'€', a:E(soorten[3][0] * soorten[3][1]) }],
    sol:soorten.map(([c, n])=>`${n} x ${geldNaam(c)} = ${eur(E(c * n))}`).join('<br>') + `<br><b>Samen: ${eur(E(tot))}</b>`, figRechts:false, breed:true };
} });
K({ id:'geld_gepast', titel:'Betaal gepast', niv:2, maak(R){
  const doel = R.int(11, 98) * 100 + R.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90, 95]);
  const ding = R.pick(['een spelletje', 'een paar schoenen', 'een sweater', 'een cadeau', 'een voetbal', 'een koptelefoon']);
  return { tekst:`<p>Je koopt ${ding} van <b>${eur(E(doel))}</b>. Betaal het bedrag gepast.</p><p>Gebruik <b>zo weinig mogelijk</b> munten en biljetten.</p>`,
    vragen:[geldKlik(doel)], hint:[{ t:'Welk is het grootste biljet dat je kan gebruiken?', voor:'€', a:E(gepast(doel)[0]) }, { t:'Hoeveel stukken heb je in het totaal nodig?', a:gepast(doel).length }],
    sol:`${eur(E(doel))} = ${gepast(doel).map(geldNaam).join(' + ')}<br>Dat zijn ${gepast(doel).length} munten en biljetten.` };
} });
K({ id:'geld_terug', titel:'Hoeveel krijg je terug?', niv:2, maak(R){
  const prijs = R.int(3, 17) * 100 + R.stap(5, 95, 5); const B = prijs < 1000 ? R.pick([1000, 2000]) : 2000; const terug = B - prijs;
  const ding = R.pick(['een boek', 'een pizza', 'een bioscoopticket', 'bloemen', 'een spel kaarten', 'een fietsbel']);
  return { tekst:`<p>Je koopt ${ding} voor <b>${eur(E(prijs))}</b>. Je betaalt met een briefje van ${geldNaam(B)}.</p>`, vragen:[
    { t:'Hoeveel geld krijg je terug?', voor:'€', a:E(terug), geld:true, hint:[{ t:`Hoeveel moet je bijtellen bij ${eur(E(prijs))} om tot het volgende hele bedrag in euro te komen?`, voor:'€', a:E(Math.ceil(prijs / 100) * 100 - prijs) }, { t:`En hoeveel van ${eur(Math.ceil(prijs / 100))} tot ${geldNaam(B)}?`, voor:'€', a:E(B - Math.ceil(prijs / 100) * 100) }] },
    geldKlik(terug, { t:'Welke munten en biljetten krijg je terug? Zo weinig mogelijk.' })
  ], sol:`${geldNaam(B)} – ${eur(E(prijs))} = <b>${eur(E(terug))}</b><br>Terug: ${gepast(terug).map(geldNaam).join(' + ')}` };
} });

/* ---------- 2 · Handig rekenen (zonder rekenmachine) ---------- */
K({ id:'h_koppel', titel:'Koppels maken', niv:1, maak(R){
  const items = [];
  for(let i = 0; i < 3; i++){
    if(i < 2){ const a = R.int(11, 89); let b = (10 - a % 10) % 10 + 10 * R.int(1, 5); if(b === 0) b = 10; const c = R.int(6, 79); items.push({ g:R.shuffle([a, b, c]), koppel:[a, b], som:a + b + c, dec:false }); }
    else { const a = R.int(11, 59) / 10, b = Math.round((Math.ceil(a) - a) * 10) / 10 + R.int(1, 4), c = R.int(11, 89) / 10; items.push({ g:R.shuffle([a, b, c]), koppel:[a, b], som:rnd(a + b + c, 2), dec:true }); }
  }
  return { tekst:'<p>Zoek de twee getallen die samen een mooi rond getal vormen. Tel die eerst op.</p><p>Voorbeeld: € 17 + € 24 + € 43 = € 60 + € 24 = € 84</p>', vragen:items.map(it=>({
    t:it.g.map(x=>eur(x, true)).join(' + ') + ' =', voor:'€', a:it.som, geld:it.dec, w:'md',
    hint:[{ t:`Welke twee bedragen vormen samen een rond getal? Tel ze op.`, voor:'€', a:rnd(it.koppel[0] + it.koppel[1], 2) }, { t:'Tel nu het derde bedrag erbij.', voor:'€', a:it.som }]
  })), sol:items.map(it=>`${eur(it.koppel[0], true)} + ${eur(it.koppel[1], true)} = ${eur(rnd(it.koppel[0] + it.koppel[1], 2), true)}; + ${eur(rnd(it.som - it.koppel[0] - it.koppel[1], 2), true)} = <b>${eur(it.som, !it.dec)}</b>`).join('<br>') };
} });
K({ id:'h_dubbel', titel:'Het dubbel en de helft', niv:1, maak(R){
  const [n1, n2, n3] = R.namen(3);
  const a = R.int(21, 49) + R.pick([.2, .4, .6, .8, .5]); const b = R.int(56, 290) * 2; const c = R.int(13, 29) * 2; const d = R.int(12, 39); const e = R.int(31, 89) + R.pick([.2, .4, .6, .8]);
  const ctx = R.shuffle([
    { t:`${n1} koopt een T-shirt voor ${eur(a)}. ${n2} koopt een T-shirt dat dubbel zo duur is. Hoeveel kost het T-shirt van ${n2}?`, a:rnd(a * 2, 2), voor:'€', geld:true, s:`${eur(a)} x 2 = ${eur(rnd(a * 2, 2))}` },
    { t:`Een reis kost ${eur(b, true)}. ${n3} en een vriend betalen ieder de helft. Hoeveel betaalt ${n3}?`, a:b / 2, voor:'€', s:`${eur(b, true)} : 2 = ${eur(b / 2, true)}` },
    { t:`Je wast ${c} sokken. Hoeveel paar sokken heb je?`, a:c / 2, na:'paar', s:`${c} : 2 = ${c / 2}` },
    { t:`In een kast staan ${d} paar schoenen. Hoeveel schoenen zijn dat?`, a:d * 2, na:'schoenen', s:`${d} x 2 = ${d * 2}` },
    { t:`Een parfum kost ${eur(e)}. In de solden kost hij de helft. Wat is de soldenprijs?`, a:rnd(e / 2, 2), voor:'€', geld:true, s:`${eur(e)} : 2 = ${eur(rnd(e / 2, 2))}` }
  ]).slice(0, 4);
  return { tekst:'<p>Het dubbel = het getal x 2. De helft = het getal : 2.</p>', q2:true, vragen:ctx.map(x=>({ t:x.t, a:x.a, voor:x.voor, na:x.na, geld:x.geld, w:'md', blok:true })),
    hint:[{ t:`Het dubbel van ${nf(a)}: splits in ${Math.floor(a)} en ${nf(rnd(a - Math.floor(a), 2))}. Hoeveel is ${Math.floor(a)} x 2?`, a:Math.floor(a) * 2 }, { t:`En ${nf(rnd(a - Math.floor(a), 2))} x 2?`, a:rnd((a - Math.floor(a)) * 2, 2), meer:`Het dubbel van ${nf(a)} = ${Math.floor(a) * 2} + ${nf(rnd((a - Math.floor(a)) * 2, 2))} = ${nf(rnd(a * 2, 2))}` }],
    sol:ctx.map(x=>x.s).join('<br>') };
} });
K({ id:'h_x4x5', titel:'Keer 4, gedeeld door 4, keer 5 en gedeeld door 5', niv:2, maak(R){
  const a = R.int(14, 48), b = R.int(41, 99) * 4, c = R.int(12, 39), d = R.int(21, 79) * 5;
  const [n1, n2] = R.namen(2);
  const vr = [
    { t:`Een abonnement kost ${eur(a, true)}. ${n1} koopt er 4. Hoeveel betaalt ${n1}?`, a:a * 4, voor:'€', s:`${a} x 4 = ${a} x 2 x 2 = ${a * 2} x 2 = ${a * 4}`, h:[{ t:`${a} x 2 =`, a:a * 2 }, { t:`${a * 2} x 2 =`, a:a * 4 }] },
    { t:`Vier vrienden huren een vakantiehuis voor ${eur(b, true)}. Hoeveel betaalt ieder?`, a:b / 4, voor:'€', s:`${b} : 4 = ${b} : 2 : 2 = ${b / 2} : 2 = ${b / 4}`, h:[{ t:`${b} : 2 =`, a:b / 2 }, { t:`${b / 2} : 2 =`, a:b / 4 }] },
    { t:`Een ticket kost ${eur(c, true)}. ${n2} koopt er 5. Hoeveel kost dat?`, a:c * 5, voor:'€', s:`${c} x 5 = ${c * 10} : 2 = ${c * 5}`, h:[{ t:`${c} x 10 =`, a:c * 10 }, { t:`${c * 10} : 2 =`, a:c * 5 }] },
    { t:`Vijf vrienden gaan naar een pretpark. Samen betalen ze ${eur(d, true)}. Hoeveel betaalt ieder?`, a:d / 5, voor:'€', s:`${d} : 5 = ${d / 10} x 2 = ${d / 5}`, h:[{ t:`${d} : 10 =`, a:d / 10 }, { t:`${nf(d / 10)} x 2 =`, a:d / 5 }] }
  ];
  return { q2:true, tekst:'<p>x 4 = x 2 en nog eens x 2 · : 4 = : 2 en nog eens : 2<br>x 5 = eerst x 10, dan : 2 · : 5 = eerst : 10, dan x 2</p>', vragen:vr.map(x=>({ t:x.t, a:x.a, voor:x.voor, w:'md', blok:true, hint:x.h })), sol:vr.map(x=>x.s).join('<br>') };
} });
K({ id:'h_x10', titel:'Keer en gedeeld door 10, 100 en 1 000', niv:2, maak(R){
  const items = R.shuffle([
    ()=>{ const a = R.int(12, 95), m = R.pick([10, 100, 1000]); return [`${nf(a)} x ${nf(m)}`, a * m]; },
    ()=>{ const a = R.int(11, 99) * 100, m = R.pick([10, 100]); return [`${nf(a)} : ${nf(m)}`, a / m]; },
    ()=>{ const a = R.int(11, 99) / 10, m = R.pick([10, 100, 1000]); return [`${nf(a)} x ${nf(m)}`, rnd(a * m)]; },
    ()=>{ const a = R.int(101, 999) / 10, m = R.pick([10, 100]); return [`${nf(a)} : ${nf(m)}`, rnd(a / m)]; },
    ()=>{ const a = R.int(2, 9) / 100, m = R.pick([10, 100]); return [`${nf(a)} x ${nf(m)}`, rnd(a * m)]; },
    ()=>{ const a = R.int(2, 95), m = R.pick([10, 100]); return [`${nf(a)} : ${nf(m)}`, rnd(a / m)]; }
  ]).map(f=>f());
  return { tekst:'<p>Een natuurlijk getal: x 10, x 100, x 1 000 = één, twee of drie nullen erbij.<br>Een kommagetal: schuif de komma één, twee of drie plaatsen naar rechts (x) of naar links (:).</p>', q2:true,
    vragen:items.map(([t, a])=>({ t:t + ' =', a, w:'md' })), sol:items.map(([t, a])=>`${t} = ${nf(a)}`).join('<br>') };
} });
K({ id:'h_temp', titel:'Rekenen met temperaturen', niv:2, maak(R){
  const items = rij(4, i=>{ const t0 = i < 2 ? R.int(-9, -1) : R.int(-5, 6); const d = R.int(2, 9); const warmer = i === 1 || i === 3 ? true : (i === 0 ? false : R.kans(.5)); return { t0, d, warmer, t1:t0 + (warmer ? d : -d) }; });
  items.forEach(x=>{ if(x.t1 < -15){ x.warmer = true; x.t1 = x.t0 + x.d; } });
  const it = items[0];
  return { fig:getallenas(-15, 10, { b:760, van:it.t0, naar:it.t1 }), boven:true, q2:true,
    tekst:'<p>Warmer: je gaat op de getallenas naar <b>rechts</b>. Kouder: je gaat naar <b>links</b>.</p>',
    vragen:items.map((x, i)=>({ t:i === 0 ? `Vorige nacht vroor het tot ${minN(x.t0)} °C. Vannacht was het nog ${x.d} °C kouder. Hoeveel graden was het vannacht?` : `Het is ${minN(x.t0)} °C. Het wordt ${x.d} °C ${x.warmer ? 'warmer' : 'kouder'}. Welke temperatuur is het dan?`, a:x.t1, na:'°C', blok:true })),
    hint:[{ t:`Zet je vinger op ${minN(it.t0)} op de getallenas. Ga ${it.d} stappen naar ${it.warmer ? 'rechts' : 'links'}. Waar kom je uit?`, a:it.t1, na:'°C' }],
    sol:items.map(x=>`${minN(x.t0)} °C ${x.warmer ? '+' : '–'} ${x.d} °C = ${minN(x.t1)} °C`).join('<br>') };
} });
K({ id:'h_negplus', titel:'Optellen en aftrekken met negatieve getallen', niv:3, maak(R){
  const items = rij(6, i=>{ let a, b, op; if(i % 3 === 0){ a = -R.int(3, 30); b = R.int(3, 30); op = '+'; } else if(i % 3 === 1){ a = R.pick([-1, 1]) * R.int(3, 30); b = R.int(3, 30); op = '–'; } else { a = R.int(10, 45); b = a + R.int(3, 15); op = '–'; } return { a, b, op, u:op === '+' ? a + b : a - b }; });
  return { q3:true, tekst:'<p>Reken uit. Je mag de getallenas in gedachten gebruiken.</p>', vragen:R.shuffle(items).map(x=>({ t:`${minN(x.a)} ${x.op} ${x.b} =`, a:x.u })), sol:items.map(x=>`${minN(x.a)} ${x.op} ${x.b} = ${minN(x.u)}`).join('<br>') };
} });
K({ id:'h_negmaal', titel:'Vermenigvuldigen en delen met negatieve getallen', niv:3, maak(R){
  const items = rij(6, i=>{ const p = R.int(2, 9), q = R.int(2, 9); const tekens = [[-1, 1], [1, -1], [-1, -1]][i % 3]; const a = p * tekens[0], b = q * tekens[1];
    return i < 3 ? { t:`${minN(a)} x ${tussen(b)}`, u:a * b } : { t:`${minN(a * q)} : ${tussen(b)}`, u:a * q / b }; });
  return { q3:true, tekst:'<p>Tekenregels: + x + = + · – x + = – · + x – = – · – x – = + (bij delen net hetzelfde).</p>', vragen:R.shuffle(items).map(x=>({ t:x.t + ' =', a:x.u })), sol:items.map(x=>`${x.t} = ${minN(x.u)}`).join('<br>') };
} });

/* ---------- 3 · Schatten (zonder rekenmachine) ---------- */
const comb = (as, bs, f) => { const s = new Set(); as.forEach(a=>bs.forEach(b=>s.add(rnd(f(a, b), 4)))); return [...s]; };
K({ id:'s_afronden', titel:'Rond af en schat', niv:1, maak(R){
  const a1 = R.int(205, 895), b1 = R.int(42, 98); const plus = R.kans(.5);
  const a2 = R.int(21, 79) + R.pick([-2, -1, 1, 2]) * 0 + 0, n2 = R.int(3, 8);
  const n3 = R.pick([3, 4, 5]); const a3 = n3 * R.int(21, 39) * 10 + R.pick([-4, -3, 3, 4]);
  const r1a = afrondingen(a1), r1b = afrondingen(b1), r2 = afrondingen(a2), r3 = rij(12, i=>n3 * 10 * (Math.round(a3 / n3 / 10) - 5 + i)).filter(x=>x > 0 && Math.abs(x - a3) <= 30 * n3).concat(afrondingen(a3));
  const [d1, d2, d3] = [plus ? 'Je koopt een tv van € ' + a1 + ' en een soundbar van € ' + b1 + '.' : `Een gsm kost € ${a1}. Je krijgt € ${b1} korting.`, `Je koopt ${n2} drinkbussen van € ${a2}.`, `${n3} vrienden huren een appartement voor € ${nf(a3)}. Hoeveel betaalt ieder?`];
  const f1 = plus ? (x, y)=>x + y : (x, y)=>x - y;
  const vr = [
    { label:'eerste bedrag afgerond', a:r1a }, { label:'tweede bedrag afgerond', a:r1b }, { label:'schatting 1', a:comb(r1a, r1b, f1) },
    { label:'bedrag afgerond', a:r2 }, { label:'schatting 2', a:r2.map(x=>x * n2) },
    { label:'bedrag afgerond', a:r3 }, { label:'schatting 3', a:r3.map(x=>x / n3) }
  ];
  vr.forEach(v=>{ v.voor = '€'; v.w = 'xs'; v.toonA = '€ ' + nf(v.a[0]); });
  const k3 = n3 * 10 * Math.round(a3 / n3 / 10); vr[5].toonA = '€ ' + nf(k3); vr[6].toonA = '€ ' + nf(k3 / n3);
  const kort = x=>afrondingen(x)[afrondingen(x).length > 1 ? 1 : 0];
  return { tekst:'<p><b>Stap 1</b>: rond de getallen af. <b>Stap 2</b>: reken uit het hoofd met de afgeronde getallen.</p>',
    fig:`<div class="schat">
      <p>${d1}<br>€ ${a1} ≈ ${slot(0)} &nbsp; € ${b1} ≈ ${slot(1)}<br>€ ${a1} ${plus ? '+' : '–'} € ${b1} ≈ ${slot(2)}</p>
      <p>${d2}<br>€ ${a2} ≈ ${slot(3)}<br>€ ${a2} x ${n2} ≈ ${slot(4)}</p>
      <p>${d3}<br>€ ${nf(a3)} ≈ ${slot(5)}<br>€ ${nf(a3)} : ${n3} ≈ ${slot(6)}</p></div>`, vragen:vr,
    hint:[{ t:`Rond € ${a1} af op een honderdtal.`, voor:'€', a:afr(a1, 100) }, { t:`Rond € ${b1} af op een tiental.`, voor:'€', a:afr(b1, 10) }, { t:`Bij delen kies je een getal dat je makkelijk kan delen door ${n3}. Welk getal dicht bij ${a3} kan je makkelijk delen door ${n3}?`, voor:'€', a:r3, meer:`Bijvoorbeeld € ${n3 * 10 * Math.round(a3 / n3 / 10)} : ${n3} = € ${10 * Math.round(a3 / n3 / 10)}.` }],
    sol:`€ ${a1} ${plus ? '+' : '–'} € ${b1} ≈ € ${afr(a1, 100)} ${plus ? '+' : '–'} € ${afr(b1, 10)} = € ${f1(afr(a1, 100), afr(b1, 10))} (of € ${afr(a1, 10)} ${plus ? '+' : '–'} € ${afr(b1, 10)} = € ${f1(afr(a1, 10), afr(b1, 10))})<br>€ ${a2} x ${n2} ≈ € ${afr(a2, 10)} x ${n2} = € ${afr(a2, 10) * n2}<br>€ ${a3} : ${n3} ≈ € ${n3 * 10 * Math.round(a3 / n3 / 10)} : ${n3} = € ${10 * Math.round(a3 / n3 / 10)}<br><i>Andere goede afrondingen worden ook aanvaard.</i>`, breed:true };
} });
const SNACK = [['kebab gehakt', [9.5, 9.8, 9.9]], ['kebab kip', [10.8, 11.2, 11.5]], ['pizza margherita', [9.6, 10.2]], ['pizza calzone', [16.8, 17.9]], ['hamburger', [7.9, 8.4]], ['frietjes groot', [4.1, 4.4]], ['schotel van de chef', [24.9, 27.5, 28.6]], ['salade', [12.8, 13.9]], ['bakje olijven', [5.9, 6.2]], ['frisdrank', [2.1, 2.3, 2.4]], ['wrap kip', [8.8, 9.3]], ['soep', [4.8, 5.2]]];
K({ id:'s_menu', titel:'Schat wat ze moeten betalen', niv:2, maak(R){
  const menu = R.kies(SNACK, 8).map(([n, p])=>({ n, p:R.pick(p) }));
  if(!menu.some(m=>m.n === 'frisdrank')) menu[7] = { n:'frisdrank', p:R.pick([2.1, 2.3, 2.4]) };
  const fris = menu.find(m=>m.n === 'frisdrank'), anders = menu.filter(m=>m !== fris);
  const namen = R.namen(4);
  const bestel = rij(3, ()=>{ const k = R.kies(anders, 2); return [[R.int(1, 3), k[0]], [R.int(1, 2), k[1]], [R.int(1, 4), fris]]; });
  const totaal = b=>rnd(som(b.map(([n, m])=>n * m.p)), 2);
  const zin = b=>b.map(([n, m])=>`${n} ${m.n}`).join(', ').replace(/, ([^,]*)$/, ' en $1');
  const een = R.pick(anders.filter(m=>m.p > 10).concat(anders.slice(0, 1)));
  const nf2 = R.int(2, 4), budget = R.pick([20, 30]); const t0 = rnd(een.p + nf2 * fris.p, 2);
  const genoeg = t0 <= budget ? 0 : 1;
  const vr = [{ t:`${namen[0]} koopt 1 ${een.n} en ${nf2} frisdranken. ${namen[0]} heeft een briefje van € ${budget} bij. Is dat genoeg?`, soort:'keuze', keuzes:['ja', 'nee'], a:genoeg }]
    .concat(bestel.map((b, i)=>{ const t = totaal(b); return { t:`${namen[i + 1]} koopt ${zin(b)}. Hoeveel moet ${namen[i + 1]} ongeveer betalen?`, voor:'≈ €', a:{ min:Math.floor(t * .9), max:Math.ceil(t * 1.1) }, toonA:`ongeveer € ${Math.round(t)} (juist: ${eur(t)})`, blok:true }; }));
  return { fig:`<div class="menu"><b>Prijslijst</b>${tab(null, menu.map(m=>[m.n, eur(m.p)]), { l:true })}</div>`,
    tekst:'<p>Schat. Je hoeft niet juist uit te rekenen. Rond elke prijs af op een heel bedrag in euro.</p>', vragen:vr,
    hint:[{ t:`Rond € ${nf(bestel[0][0][1].p, 2)} af op een heel bedrag in euro.`, voor:'€', a:afrondingen(bestel[0][0][1].p).concat([Math.round(bestel[0][0][1].p)]) }, { t:`Rond de frisdrank (${eur(fris.p)}) af. Hoeveel kosten ${bestel[0][2][0]} frisdranken ongeveer?`, voor:'€', a:[bestel[0][2][0] * 2, Math.round(bestel[0][2][0] * fris.p)] }],
    sol:`${namen[0]}: ${eur(een.p)} + ${nf2} x ${eur(fris.p)} = ${eur(t0)}, dus ${genoeg ? 'niet genoeg' : 'genoeg'}.<br>` + bestel.map((b, i)=>`${namen[i + 1]}: ongeveer € ${b.map(([n, m])=>n + ' x ' + Math.round(m.p)).join(' + ')} = € ${som(b.map(([n, m])=>n * Math.round(m.p)))} (juist: ${eur(totaal(b))})`).join('<br>') + '<br><i>Een schatting die dicht genoeg bij het juiste bedrag ligt, is goed.</i>' };
} });

/* ---------- 4 · Gemiddelde en mediaan (met rekenmachine) ---------- */
const gemToon = (rijG, eenh = '') => { const S = rnd(som(rijG), 4), n = rijG.length, G = rnd(S / n, 4); const b = x=>`<span class="bol">${nf(x)}${eenh}</span>`;
  return [`<p>Dit zijn de getallen:</p><div class="rij">${rijG.map(b).join('')}</div>`,
    `<p><b>Stap 1</b>: tel alle getallen op.</p><div class="rij">${rijG.map(b).join(' + ')} = <span class="bol mid">${nf(S)}${eenh}</span></div>`,
    `<p><b>Stap 2</b>: tel hoeveel getallen er zijn.</p><div class="rij">${rijG.map((x, i)=>`<span class="bol">${i + 1}</span>`).join('')}</div><p>Er zijn <b>${n}</b> getallen.</p>`,
    `<p><b>Stap 3</b>: deel de som door het aantal.</p><div class="rij"><span class="bol">${nf(S)}</span> : <span class="bol">${n}</span> = <span class="bol mid">${nf(G)}${eenh}</span></div><p>Het gemiddelde is <b>${nf(G)}${eenh}</b>.</p>`]; };
const medToon = (rijG, eenh = '') => { const s = rijG.slice().sort((a, b)=>a - b), n = s.length, b = (x, c)=>`<span class="bol${c ? ' ' + c : ''}">${nf(x)}${eenh}</span>`;
  const st = [`<p>Dit zijn de getallen:</p><div class="rij">${rijG.map(x=>b(x)).join('')}</div>`, `<p><b>Stap 1</b>: rangschik van klein naar groot.</p><div class="rij">${s.map(x=>b(x)).join(' – ')}</div>`];
  const k = Math.floor((n - 1) / 2);
  st.push(`<p><b>Stap 2</b>: streep telkens het kleinste en het grootste getal weg.</p><div class="rij">${s.map((x, i)=>b(x, i < k || i > n - 1 - k ? 'weg' : '')).join(' – ')}</div>`);
  if(n % 2) st.push(`<p><b>Stap 3</b>: het middelste getal is de mediaan.</p><div class="rij">${s.map((x, i)=>b(x, i === k ? 'mid' : 'weg')).join(' – ')}</div><p>De mediaan is <b>${nf(s[k])}${eenh}</b>.</p>`);
  else { const m = rnd((s[k] + s[k + 1]) / 2, 4); st.push(`<p><b>Stap 3</b>: er zijn twee middelste getallen. Neem hun gemiddelde.</p><div class="rij">(${b(s[k], 'mid')} + ${b(s[k + 1], 'mid')}) : 2 = <span class="bol mid">${nf(m)}${eenh}</span></div><p>De mediaan is <b>${nf(m)}${eenh}</b>.</p>`); }
  return st; };
const mediaan = a => { const s = a.slice().sort((x, y)=>x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : rnd((s[n / 2 - 1] + s[n / 2]) / 2, 4); };
/* reeks met een mooi gemiddelde (geheel of op 0,5) */
function mooieReeks(R, n, lo, hi, stap = 1){ for(let p = 0; p < 200; p++){ const a = rij(n, ()=>R.int(lo, hi)); const g = som(a) / n; if(Math.abs(g * stap - Math.round(g * stap)) < 1e-9) return a; } return rij(n, ()=>lo); }
K({ id:'g_gem', titel:'Bereken het gemiddelde', niv:1, maak(R){
  const naam = R.naam(), vak = R.pick(['wiskunde', 'Frans', 'Engels', 'geschiedenis', 'Nederlands']); const n = R.int(4, 6); const a = mooieReeks(R, n, 4, 10, 10);
  const S = som(a), G = rnd(S / n, 4);
  return { tekst:`<p>${naam} haalt deze punten voor ${vak}: <b>${a.join(', ')}</b>.</p>`, vragen:[
    { t:'Tel alle punten op.', a:S }, { t:'Hoeveel punten zijn er?', a:n }, { t:'Bereken het gemiddelde.', a:G, uitleg:'Gemiddelde = de som : het aantal.' }
  ], toon:gemToon(a), sol:`${a.join(' + ')} = ${S}<br>${S} : ${n} = <b>${nf(G)}</b>` };
} });
K({ id:'g_med', titel:'Bepaal de mediaan', niv:1, maak(R){
  const n1 = R.pick([5, 7]), a = rij(n1, ()=>R.int(2, 20)), n2 = R.pick([4, 6]); let b = rij(n2, ()=>R.int(10, 40));
  const naam = R.naam();
  return { tekst:`<p><b>A</b>. ${naam} telt een week lang hoeveel berichtjes er elke dag binnenkomen: <b>${a.join(', ')}</b>.</p><p><b>B</b>. Een vriend telt een paar dagen mee: <b>${b.join(', ')}</b>.</p>`, vragen:[
    { t:'A. Rangschik van klein naar groot. Welk getal staat in het midden?', a:mediaan(a), uitleg:'Rangschik eerst van klein naar groot. Bij een oneven aantal is de mediaan het middelste getal.' },
    { t:'B. Bepaal de mediaan.', a:mediaan(b), uitleg:'Bij een even aantal zijn er twee middelste getallen. De mediaan is hun gemiddelde.' }
  ], toon:medToon(b), sol:`A. ${a.slice().sort((x, y)=>x - y).join(' – ')}: mediaan <b>${nf(mediaan(a))}</b><br>B. ${b.slice().sort((x, y)=>x - y).join(' – ')}: mediaan <b>${nf(mediaan(b))}</b>` };
} });
const DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
function hittegolf(t){ for(let i = 0; i + 5 <= t.length; i++){ const w = t.slice(i, i + 5); if(w.every(x=>x >= 25) && w.filter(x=>x > 30).length >= 3) return true; } return false; }
K({ id:'g_temp', titel:'Temperaturen op vakantie', niv:2, maak(R){
  const naam = R.naam(), stad = R.pick(['Oostende', 'De Panne', 'Knokke', 'Blankenberge', 'Nieuwpoort']), maand = R.pick(['juli', 'augustus']);
  const n = R.pick([6, 7]); let t; let p = 0;
  do{ t = rij(n, ()=>R.int(23, 34)); p++; } while(p < 300 && (Math.abs(som(t) / n * 10 - Math.round(som(t) / n * 10)) > 1e-9 || (p < 150 && hittegolf(t) !== (p % 2 === 0))));
  const G = rnd(som(t) / n, 4), boven = t.map((x, i)=>x > G ? i : -1).filter(i=>i >= 0);
  return { fig:tab(DAGEN.slice(0, n), [t.map(x=>x + ' °C')]), boven:true,
    tekst:`<p>${naam} is in ${maand} op vakantie in ${stad}. Dit zijn de temperaturen.</p>`, q2:true, vragen:[
    { t:'Bereken de gemiddelde temperatuur.', a:G, na:'°C', blok:true, hint:[{ t:'Tel alle temperaturen op.', a:som(t), na:'°C' }, { t:'Deel door het aantal dagen.', a:G, na:'°C' }] },
    { t:'Bepaal de mediaan.', a:mediaan(t), na:'°C', blok:true, hint:[{ t:'Rangschik van klein naar groot. Hoeveel getallen zijn er?', a:n }, { t:n % 2 ? 'Welk getal staat in het midden?' : 'Wat is het gemiddelde van de twee middelste getallen?', a:mediaan(t) }] },
    { t:'Op welke dagen is het warmer dan het gemiddelde?', soort:'multi', keuzes:DAGEN.slice(0, n), a:boven },
    { t:'Een <b>hittegolf</b>: 5 dagen na elkaar minstens 25 °C, waarvan 3 dagen boven 30 °C. Is er een hittegolf?', soort:'keuze', keuzes:['ja', 'nee'], a:hittegolf(t) ? 0 : 1 }
  ], toon:gemToon(t, ' °C'), sol:`Som: ${t.join(' + ')} = ${som(t)} °C. Gemiddelde: ${som(t)} : ${n} = <b>${nf(G)} °C</b><br>Rangschikken: ${t.slice().sort((a, b)=>a - b).join(' – ')}. Mediaan: <b>${nf(mediaan(t))} °C</b><br>Warmer dan ${nf(G)} °C: ${boven.map(i=>DAGEN[i]).join(', ')}.<br>Hittegolf: ${hittegolf(t) ? 'ja' : 'nee'}.` };
} });
K({ id:'g_loon', titel:'Gemiddeld per week', niv:2, maak(R){
  const naam = R.naam(); let w; do{ w = rij(4, ()=>R.int(45, 140)); } while(som(w) % 4 === 0);
  const G = som(w) / 4;
  return { fig:tab(['', `bedrag dat ${naam} verdient`], w.map((x, i)=>[`week ${i + 1}`, eur(x, true)])),
    tekst:`<p>In de zomer doet ${naam} klusjes om bij te verdienen.</p>`, vragen:[
    { t:`Hoeveel verdient ${naam} gemiddeld per week?`, voor:'€', a:G, geld:true, blok:true, hint:[{ t:'Tel de bedragen van de 4 weken op.', voor:'€', a:som(w) }, { t:'Deel door 4.', voor:'€', a:G }] },
    { t:'Rond af op een heel bedrag in euro.', voor:'€', a:Math.round(G), blok:true }
  ], sol:`${w.join(' + ')} = € ${som(w)}<br>€ ${som(w)} : 4 = <b>${eur(G)}</b><br>Afgerond: ongeveer € ${Math.round(G)}` };
} });
K({ id:'g_kersen', titel:'De prijs van kersen', niv:2, maak(R){
  const fruit = R.pick([['kersen', 'kg'], ['aardbeien', 'kg'], ['frambozen', 'kg']]); const mnd = ['mei', 'juni', 'juli', 'augustus'];
  let p; do{ p = rij(4, ()=>R.int(70, 160) / 10); } while(Math.round(som(p) * 100) % 4 !== 0);
  const G = rnd(som(p) / 4, 2), goedkoop = p.indexOf(Math.min(...p));
  return { fig:tab([''].concat(mnd), [['prijs per kg'].concat(p.map(x=>eur(x)))]), boven:true, q2:true,
    tekst:`<p>De prijs van ${fruit[0]} verandert elke maand.</p>`, vragen:[
    { t:`Bereken de gemiddelde prijs per kg.`, voor:'€', a:G, geld:true, blok:true },
    { t:`Een bakje van 500 g ${fruit[0]} kost in ${mnd[goedkoop]}:`, voor:'€', a:rnd(p[goedkoop] / 2, 2), geld:true, blok:true, uitleg:'500 g is de helft van 1 kg.' }
  ], toon:gemToon(p), sol:`(${p.map(x=>nf(x, 2)).join(' + ')}) : 4 = ${nf(som(p), 2)} : 4 = <b>${eur(G)}</b><br>500 g = de helft van 1 kg: ${eur(p[goedkoop])} : 2 = <b>${eur(rnd(p[goedkoop] / 2, 2))}</b>` };
} });

/* ---------- 5 · Rekenen met de rekenmachine ---------- */
const BAKKER = [['chocoladebroodje', [1.7, 1.9, 2.1]], ['donut', [1.6, 1.8, 2.0]], ['pistolet', [0.7, 0.8, 0.9]], ['sandwich', [0.85, 0.9, 0.95]], ['mini sandwich', [0.55, 0.6, 0.65]], ['stokbrood', [2.1, 2.2, 2.4]], ['croissant', [1.2, 1.3, 1.4]], ['rozijnenkoek', [2.3, 2.5]]];
K({ id:'r_bakker', titel:'Bij de bakker', niv:1, maak(R){
  const lijst = BAKKER.map(([n, p])=>({ n, p:R.pick(p) }));
  const pr = n=>lijst.find(x=>x.n === n).p;
  const koop = R.kies(lijst.filter(x=>!/sandwich/.test(x.n)), 3).map(x=>[R.int(1, 4), x]);
  const tot = rnd(som(koop.map(([n, x])=>n * x.p)), 2); const B = tot < 10 ? R.pick([10, 20]) : 20; const terug = rnd(B - tot, 2);
  const sDuur = Math.round((pr('sandwich') - pr('mini sandwich')) * 100), dGoed = rnd(pr('chocoladebroodje') - pr('donut'), 2);
  return { fig:`<b>Prijslijst van de bakker</b>${tab(null, lijst.map(x=>[x.n, eur(x.p)]), { l:true })}`,
    tekst:`<p>Je koopt ${koop.map(([n, x])=>`${n} ${n > 1 ? meervoud(x.n) : x.n}`).join(', ').replace(/, ([^,]*)$/, ' en $1')}.</p>`, vragen:[
    { t:'Ik schat:', voor:'≈ €', a:{ min:Math.floor(tot * .85), max:Math.ceil(tot * 1.15) }, toonA:`ongeveer € ${Math.round(tot)}` },
    { t:'Ik reken: hoeveel moet je betalen?', voor:'€', a:tot, geld:true },
    { t:`Je betaalt met een briefje van € ${B}. Hoeveel krijg je terug?`, voor:'€', a:terug, geld:true },
    { t:'Een sandwich is ... cent duurder dan een mini sandwich.', a:sDuur, na:'cent' },
    { t:`Een chocoladebroodje is ... euro ${dGoed >= 0 ? 'duurder' : 'goedkoper'} dan een donut.`, voor:'€', a:Math.abs(dGoed), geld:true }
  ], sol:`${koop.map(([n, x])=>`${n} x ${eur(x.p)}`).join(' + ')} = <b>${eur(tot)}</b><br>€ ${B} – ${eur(tot)} = <b>${eur(terug)}</b><br>${eur(pr('sandwich'))} – ${eur(pr('mini sandwich'))} = ${sDuur} cent<br>${eur(pr('chocoladebroodje'))} – ${eur(pr('donut'))} = ${eur(Math.abs(dGoed))}` };
} });
const meervoud = n => ({ 'chocoladebroodje':'chocoladebroodjes', 'donut':'donuts', 'pistolet':'pistolets', 'stokbrood':'stokbroden', 'croissant':'croissants', 'rozijnenkoek':'rozijnenkoeken', 'sandwich':'sandwiches', 'mini sandwich':'mini sandwiches' })[n] || n;
K({ id:'r_verh', titel:'Prijs per kg met een verhoudingstabel', niv:2, maak(R){
  const [ding, mmm, lw, ww] = R.pick([['druiven', [200, 300, 400, 600, 800], 'de', 'kosten'], ['kaas', [200, 300, 400, 600], 'de', 'kost'], ['tomaten', [300, 400, 600, 800], 'de', 'kosten'], ['gehakt', [300, 400, 600], 'het', 'kost'], ['nootjes', [200, 300, 400], 'de', 'kosten']]);
  const m = R.pick(mmm), per100 = R.int(25, 120) / 100, prijs = rnd(per100 * m / 100, 2), kg = rnd(per100 * 10, 2);
  return { tekst:`<p>Een verpakking ${ding} van <b>${m} g</b> kost <b>${eur(prijs)}</b>. Hoeveel ${ww} ${lw} ${ding} per kg?</p><p>Vul de verhoudingstabel in.</p>`,
    fig:`<div class="ttab"><table class="dtable verh"><tr><th>massa</th><td>${m} g</td><td>100 g</td><td>1 000 g</td></tr><tr><th>prijs</th><td>${eur(prijs)}</td><td>€ ${slot(0)}</td><td>€ ${slot(1)}</td></tr><tr><td></td><td colspan="2" class="pijl">: ${m / 100} &nbsp;→</td><td class="pijl">x 10 &nbsp;→</td></tr></table></div>`, figRechts:false, breed:true,
    vragen:[{ a:per100, geld:true, label:'prijs voor 100 g' }, { a:kg, geld:true, label:'prijs per kg' }],
    hint:[{ t:`Van ${m} g naar 100 g: je deelt door ${m / 100}. Hoeveel is ${eur(prijs)} : ${m / 100}?`, voor:'€', a:per100 }, { t:'Van 100 g naar 1 000 g: x 10.', voor:'€', a:kg }],
    sol:`${m} g → 100 g: : ${m / 100} → ${eur(prijs)} : ${m / 100} = ${eur(per100)}<br>100 g → 1 kg: x 10 → <b>${eur(kg)} per kg</b>` };
} });
K({ id:'r_liter', titel:'Welke verpakking is het goedkoopst?', niv:2, maak(R){
  const drank = R.pick(['water', 'appelsap', 'melk', 'limonade']);
  const vp = R.shuffle([[5, 'pak van 5 liter'], [0.5, 'fles van 0,5 liter'], [1, 'fles van 1 liter'], [2, 'fles van 2 liter'], [1.5, 'fles van 1,5 liter']]).slice(0, 3).sort((a, b)=>a[0] - b[0]);
  let ppl; do{ ppl = vp.map(()=>R.int(60, 130) / 100); } while(new Set(ppl).size < 3);
  const prijzen = vp.map(([l], i)=>rnd(ppl[i] * l, 2)); const per = prijzen.map((p, i)=>rnd(p / vp[i][0], 2));
  const best = per.indexOf(Math.min(...per));
  return { tekst:`<p>In de supermarkt koop je ${drank} in verschillende verpakkingen. Bereken de prijs per liter.</p>`,
    fig:`<div class="ttab"><table class="dtable"><tr><th class="l">verpakking</th><th>prijs</th><th>prijs per liter</th></tr>${vp.map(([l, n], i)=>`<tr><td class="l">1 ${n}</td><td>${eur(prijzen[i])}</td><td>€ ${slot(i)}</td></tr>`).join('')}</table></div>`, breed:true,
    vragen:per.map((p, i)=>({ a:[p, rnd(prijzen[i] / vp[i][0], 4)], geld:true, label:'prijs per liter ' + vp[i][1], toonA:eur(p) })).concat([{ t:'Welke verpakking is het goedkoopst per liter?', soort:'keuze', keuzes:vp.map(v=>v[1]), a:best }]),
    hint:[{ t:`Prijs per liter = prijs : aantal liter. Hoeveel is ${eur(prijzen[0])} : ${nf(vp[0][0])}?`, voor:'€', a:per[0] }],
    sol:vp.map(([l, n], i)=>`${n}: ${eur(prijzen[i])} : ${nf(l)} = ${eur(per[i])} per liter`).join('<br>') + `<br>Het goedkoopst: <b>${vp[best][1]}</b>.` };
} });
const SPORT = [['badmintonracket', [18.8, 19.5, 21.9]], ['pet', [14.95, 22.45, 17.5]], ['springtouw', [8.95, 11.95, 9.9]], ['sporttas', [29.7, 34.9, 27.95]], ['step', [117, 129, 98]], ['fietshelm', [49.9, 44.95, 39.9]], ['voetbal', [24.9, 19.95]], ['zwembril', [12.99, 16.5]]];
K({ id:'r_sport', titel:'Schat eerst, reken dan', niv:2, maak(R){
  const lijst = R.kies(SPORT, 6).map(([n, p])=>({ n, p:R.pick(p) }));
  const best = rij(3, i=>{ const k = R.kies(lijst, 2); return [[R.int(2, 4), k[0]], [R.int(1, 2), k[1]]]; });
  const tot = b=>rnd(som(b.map(([n, x])=>n * x.p)), 2);
  return { fig:`<b>Prijslijst</b>${tab(null, lijst.map(x=>[x.n, eur(x.p, true)]), { l:true })}`, tekst:'<p>Hoeveel moet je betalen? Schat eerst zonder rekenmachine. Reken daarna uit met de rekenmachine.</p>',
    vragen:best.flatMap((b, i)=>{ const t = tot(b); const z = b.map(([n, x])=>`${n} x ${x.n}`).join(' en ');
      return [{ t:`<b>${z}</b><br>Ik schat:`, voor:'≈ €', a:{ min:Math.floor(t * .88), max:Math.ceil(t * 1.12) }, toonA:`ongeveer € ${Math.round(t)}` }, { t:'Ik reken:', voor:'€', a:t, geld:true }]; }), q2:false,
    sol:best.map(b=>`${b.map(([n, x])=>`${n} x ${eur(x.p, true)}`).join(' + ')} = <b>${eur(tot(b))}</b>`).join('<br>') };
} });

/* ---------- Puzzels (tellen niet mee) ---------- */
K({ id:'p_som', titel:'Somvierkant', niv:2, maak(R){
  const g = rij(3, ()=>rij(3, ()=>R.int(2, 19))); const rs = g.map(r=>som(r)), ks = [0, 1, 2].map(j=>som(g.map(r=>r[j])));
  /* oplosbaar: telkens een rij of kolom met maar één onbekend vakje invullen */
  const oplosbaar = h=>{ const o = new Set(h); let ga = true; while(o.size && ga){ ga = false; for(let k = 0; k < 6; k++){ const cel = k < 3 ? [0, 1, 2].map(j=>k * 3 + j) : [0, 1, 2].map(j=>j * 3 + k - 3); const on = cel.filter(c=>o.has(c)); if(on.length === 1){ o.delete(on[0]); ga = true; } } } return !o.size; };
  let verborgen; do{ verborgen = R.kies(rij(9, i=>i), 4); } while(!oplosbaar(verborgen)); let vi = 0; const map = {};
  verborgen.sort((a, b)=>a - b).forEach(i=>{ map[i] = vi++; });
  /* elke rij en kolom mag hoogstens 2 verborgen vakjes hebben zodat het oplosbaar is */
  const cel = i=>map[i] != null ? slot(map[i]) : `<b>${g[Math.floor(i / 3)][i % 3]}</b>`;
  return { tekst:'<p>Vul de ontbrekende getallen in. Achteraan elke rij en onderaan elke kolom staat de som.</p>',
    fig:`<div class="ttab"><table class="dtable somv">${[0, 1, 2].map(r=>`<tr>${[0, 1, 2].map(c=>`<td>${cel(r * 3 + c)}</td>`).join('')}<th>${rs[r]}</th></tr>`).join('')}<tr>${ks.map(k=>`<th>${k}</th>`).join('')}<td></td></tr></table></div>`,
    vragen:verborgen.map(i=>({ a:g[Math.floor(i / 3)][i % 3], label:'ontbrekend getal' })), sol:g.map(r=>r.join(' + ')).join('<br>') };
} });
K({ id:'p_munten', titel:'Geldraadsel', niv:2, maak(R){
  const n = R.int(4, 6); const opl = rij(n, ()=>R.pick([200, 100, 50, 20, 10, 5])).sort((a, b)=>b - a); const doel = som(opl);
  return { tekst:`<p>${R.naam()} heeft <b>${n} munten</b> in de hand. Samen is dat <b>${eur(E(doel))}</b>.</p><p>Welke munten kunnen het zijn?</p>`,
    vragen:[geldKlik(doel, { aantal:n, oplossing:opl, soorten:[200, 100, 50, 20, 10, 5, 2, 1] })], sol:'Een mogelijke oplossing: ' + opl.map(geldNaam).join(' + ') + '. Andere oplossingen kunnen ook.' };
} });

/* ---------- MODULE 1: onderdelen, proeftoets en snelle quiz ----------
   Nieuwe kaarten altijd achteraan een onderdeel toevoegen; kaart-id's nooit hernoemen (opslagsleutel en vraag-id). */
const SECS = [
  { id:'geld', nav:'Rekenen met geld', title:'Rekenen met geld', ic:'geld', tip:'Je mag <b>geen</b> rekenmachine gebruiken. Bij een bedrag in euro schrijf je twee cijfers na de komma.', kaarten:['geld_tel', 'geld_komma', 'geld_kassa', 'geld_gepast', 'geld_terug'] },
  { id:'handig', nav:'Handig rekenen', title:'Handig rekenen', ic:'reken', tip:'Je mag <b>geen</b> rekenmachine gebruiken. Schrijf tussenstappen op een kladblad.', kaarten:['h_koppel', 'h_dubbel', 'h_x4x5', 'h_x10', 'h_temp'], verd:['h_negplus', 'h_negmaal'] },
  { id:'schatten', nav:'Schatten', title:'Schatten', ic:'schat', tip:'Je mag <b>geen</b> rekenmachine gebruiken. Rond eerst af, reken dan uit het hoofd.', kaarten:['s_afronden', 's_menu'] },
  { id:'gem', nav:'Gemiddelde en mediaan', title:'Gemiddelde en mediaan', ic:'gem', rm:true, tip:'<b>Gemiddelde</b>: tel alle getallen op en deel door het aantal. <b>Mediaan</b>: rangschik en neem het middelste getal.', kaarten:['g_gem', 'g_med', 'g_temp', 'g_loon', 'g_kersen'] },
  { id:'rekmach', nav:'Met de rekenmachine', title:'Rekenen met de rekenmachine', ic:'rm', rm:true, tip:'Schat eerst, reken dan uit. Zo zie je meteen of je uitkomst kan kloppen.', kaarten:['r_bakker', 'r_verh', 'r_liter', 'r_sport'] },
  { id:'puzzels', nav:'Puzzels', title:'Puzzels', ic:'puzzel', telt:false, tip:'Puzzels om je hersenen te trainen. Ze tellen niet mee voor je resultaten.', kaarten:['p_som', 'p_munten'] },
  { id:'quiz', nav:'Snelle quiz', title:'Snelle quiz', ic:'quiz', soort:'quiz', telt:false },
  { id:'toets', nav:'Proeftoets', title:'Proeftoets rekenen', ic:'toets', soort:'toets', sepBefore:true, rm:true, tip:'Vraag 1 tot 4: <b>zonder</b> rekenmachine. Vraag 5 tot 7: met rekenmachine.' }
];
const TOETS = { titel:'Proeftoets rekenen', kaarten:['geld_tel', 'h_dubbel', 'h_temp', 's_afronden', 'g_temp', 'r_verh', 'geld_gepast'] };
const QUIZ = [
  R=>{ const a = R.int(13, 49); return { t:`Het dubbel van ${a} =`, a:a * 2 }; },
  R=>{ const a = R.int(21, 99) * 2; return { t:`De helft van ${a} =`, a:a / 2 }; },
  R=>{ const a = R.int(11, 99) / 10, m = R.pick([10, 100]); return { t:`${nf(a)} x ${m} =`, a:rnd(a * m) }; },
  R=>{ const a = R.int(11, 99) * 10; return { t:`${nf(a)} : 10 =`, a:a / 10 }; },
  R=>{ const a = R.int(12, 48); return { t:`${a} x 5 =`, a:a * 5 }; },
  R=>{ const t0 = -R.int(1, 8), d = R.int(2, 9); return { t:`Het is ${minN(t0)} °C. Het wordt ${d} °C kouder. Hoeveel graden is het dan?`, a:t0 - d, na:'°C' }; },
  R=>{ const e = R.int(2, 30), c = R.int(1, 9); return { t:`${e} euro en ${c} cent =`, voor:'€', a:e + c / 100, geld:true }; },
  R=>{ const a = R.int(11, 69), b = (10 - a % 10) % 10 + 10, c = R.int(5, 40); return { t:`${a} + ${b} + ${c} =`, a:a + b + c }; },
  R=>{ const g = R.int(3, 9), a = [g - 2, g, g + 2]; return { t:`Het gemiddelde van ${R.shuffle(a).join(', ')} =`, a:g }; },
  R=>{ const a = R.kies([2, 3, 5, 6, 8, 9, 11, 12, 14], 5); return { t:`De mediaan van ${a.join(', ')} =`, a:mediaan(a) }; },
  R=>{ const p = R.int(3, 17) + R.pick([.5, .2, .4]); return { t:`Je betaalt ${eur(p)} met een briefje van € 20. Hoeveel krijg je terug?`, voor:'€', a:rnd(20 - p, 2), geld:true }; }
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
/* testhaak (enkel voor de testscripts) */
window.__m2b = { KAARTEN, maakKaart, vraagJuist, SECS };
if(SECS.length){
  let startId = SECS[0].id;
  try{ const h = location.hash.slice(1), t = localStorage.getItem(PREFIX + 'tab'); if(secEls[h]) startId = h; else if(t && secEls[t]) startId = t; }catch(e){}
  show(startId, false);
}

window.SECTIONS = SECTIONS; window.show = show;
})();
