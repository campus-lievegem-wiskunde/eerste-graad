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
   MODULE 2 · LENGTE, MASSA, INHOUD EN OPPERVLAKTE (2B)
   Gebaseerd op toets 2.1, toets 2.2 en taak 2.1. Herleiden met de trap (hint) en de tabel (meer uitleg).
   ============================================================ */
const tab = (koppen, rijen, o = {}) => `<div class="ttab"><table class="dtable${o.cls ? ' ' + o.cls : ''}">${koppen ? '<tr>' + koppen.map(k=>`<th${o.l ? ' class="l"' : ''}>${k}</th>`).join('') + '</tr>' : ''}${rijen.map(r=>'<tr>' + r.map((c, i)=>`<td${o.l && i === 0 ? ' class="l"' : ''}>${c}</td>`).join('') + '</tr>').join('')}</table></div>`;
const slot = i => `<span data-v="${i}"></span>`;

/* ---------- de trappen ---------- */
const TRAP = {
  lengte:{ e:['km', '100 m', '10 m', 'm', 'dm', 'cm', 'mm'], f:10, naam:'lengtematen' },
  massa:{ e:['ton', '100 kg', '10 kg', 'kg', '100 g', '10 g', 'g', 'dg', 'cg', 'mg'], f:10, naam:'massamaten' },
  inhoud:{ e:['100 l', '10 l', 'l', 'dl', 'cl', 'ml'], f:10, naam:'inhoudsmaten' },
  vlakte:{ e:['km²', 'ha', 'a', 'm²', 'dm²', 'cm²', 'mm²'], f:100, naam:'vlaktematen' }
};
const sup = e => e;   /* m² staat al met ² */
/* trap als SVG: van en naar worden oranje, de treden ertussen krijgen x 10 of : 10 */
function trapSvg(soort, van, naar){
  const T = TRAP[soort], n = T.e.length, w = 66, h = 30, W = n * w + 20, H = n * h + 34;
  const iv = T.e.indexOf(van), in_ = T.e.indexOf(naar), lo = Math.min(iv, in_), hi = Math.max(iv, in_);
  let s = '';
  T.e.forEach((e, i)=>{ const x = 10 + i * w, y = 10 + i * h; const actief = i === iv || i === in_;
    s += rh(x, y, w - 4, h - 4, { f:actief ? 'var(--orange)' : (i > lo && i < hi ? 'var(--or-soft, #fff4dc)' : 'var(--card)'), k:actief ? 'var(--orange)' : 'var(--accent)', w:1.8, rx:4 });
    s += tekst(x + (w - 4) / 2, y + (h - 4) / 2, e, { s:13, wt:800, f:actief ? '#2b1b00' : 'var(--ink)' });
    if(i < n - 1 && i >= lo && i < hi) s += tekst(x + w + 6, y + h + 2, iv < in_ ? '↘ x ' + T.f : '↖ : ' + T.f, { s:11.5, a:'start', f:'var(--accent-dark)' });
  });
  s += tekst(10, H - 10, `elke trede naar beneden: x ${T.f} · elke trede naar boven: : ${T.f}`, { s:12, a:'start', f:'var(--ink-soft)', wt:600 });
  return svg(W, H, s, { label:'trap van de ' + T.naam, b:Math.min(W, 480) });
}
/* herleiden: waarde in eenheid van naar eenheid naar */
function herleid(soort, x, van, naar){ const T = TRAP[soort]; const d = T.e.indexOf(naar) - T.e.indexOf(van); return rnd(x * Math.pow(T.f, d), 8); }
/* tabelmethode (meer uitleg): het cijfer van de eenheden in de kolom van de maat */
function tabelUitleg(soort, x, van, naar){
  const T = TRAP[soort]; const kol = T.e.slice(); const per = T.f === 100 ? 2 : 1;
  const r = herleid(soort, x, van, naar);
  return `<p>Met de tabel: het cijfer van de <b>eenheden</b> van ${nf(x)} komt in de kolom <b>${van}</b>${per === 2 ? ' (bij vlaktematen heeft elke maat <b>twee</b> kolommen: het cijfer van de eenheden staat in de rechtse)' : ''}. Vul de lege vakjes aan met nullen. Lees af in de kolom <b>${naar}</b>.</p><p>${nf(x)} ${van} = <b>${nf(r)} ${naar}</b></p>`;
}
const stappenTussen = (soort, van, naar) => Math.abs(TRAP[soort].e.indexOf(naar) - TRAP[soort].e.indexOf(van));
function herleidHint(soort, x, van, naar){
  const T = TRAP[soort], k = stappenTussen(soort, van, naar), neer = T.e.indexOf(naar) > T.e.indexOf(van), f = Math.pow(T.f, k);
  return [
    { t:`Hoeveel treden zitten er op de trap tussen ${van} en ${naar}?`, a:k, meer:trapSvg(soort, van, naar) },
    { t:`Je gaat naar ${neer ? 'beneden' : 'boven'}. Dus ${neer ? 'x' : ':'} ...`, a:f, voor:neer ? 'x' : ':' },
    { t:`${nf(x)} ${neer ? 'x' : ':'} ${nf(f)} =`, a:herleid(soort, x, van, naar), na:naar, meer:tabelUitleg(soort, x, van, naar) }
  ];
}
/* een mooi getal om te herleiden: het resultaat heeft hoogstens 3 decimalen en is niet te groot */
function herleidOpgave(R, soort, eenheden){
  for(let p = 0; p < 200; p++){
    const [van, naar] = R.kies(eenheden, 2); const k = stappenTussen(soort, van, naar); if(k > (TRAP[soort].f === 100 ? 2 : 3)) continue; const neer = TRAP[soort].e.indexOf(naar) > TRAP[soort].e.indexOf(van);
    const vorm = R.int(0, 3); let x;
    if(neer) x = [R.int(2, 95), R.int(11, 99) / 10, R.int(101, 999) / 100, R.int(2, 9) / 10][vorm];
    else x = [R.int(2, 95) * Math.pow(TRAP[soort].f, k), R.int(11, 999) * Math.pow(TRAP[soort].f, Math.max(0, k - 1)), R.int(15, 950), R.int(2, 9) * Math.pow(TRAP[soort].f, k - 1)][vorm];
    x = rnd(x, 6); const r = herleid(soort, x, van, naar);
    const dec = s => (String(s).split('.')[1] || '').length;
    if(dec(r) <= 3 && dec(x) <= 3 && r < 1e5 && x < 1e5 && r >= 0.001 && x !== r) return { x, van, naar, r };
  }
  return { x:5, van:eenheden[0], naar:eenheden[1], r:herleid(soort, 5, eenheden[0], eenheden[1]) };
}
function herleidKaart(R, soort, eenheden, n){
  const items = []; while(items.length < n){ const o = herleidOpgave(R, soort, eenheden); if(!items.some(i=>i.van === o.van && i.naar === o.naar && i.x === o.x)) items.push(o); }
  return { q2:true, tekst:`<p>Gebruik de trap: elke trede naar beneden x ${TRAP[soort].f}, elke trede naar boven : ${TRAP[soort].f}.</p>`,
    vragen:items.map(o=>({ t:`${nf(o.x)} ${o.van} =`, a:o.r, na:o.naar, w:'md', hint:herleidHint(soort, o.x, o.van, o.naar) })),
    sol:items.map(o=>`${nf(o.x)} ${o.van} = ${nf(o.r)} ${o.naar}`).join('<br>') };
}

/* ---------- 1 · Welke eenheid? ---------- */
const ZINNEN = [
  ['De deur van de klas is 2', 'm', 'lengte'], ['Je wandelt in een kwartier ongeveer 1', 'km', 'lengte'], ['Een nagel is ongeveer 1', 'cm', 'lengte'], ['Een muntstuk van 5 cent is ongeveer 2', 'mm', 'lengte'],
  ['Mijn pink is 6', 'cm', 'lengte'], ['De afstand van Gent naar Brugge is ongeveer 50', 'km', 'lengte'], ['De paardenstal is 4', 'm', 'lengte'], ['Een rekenmachine is 8', 'mm', 'lengte'],
  ['Een pak suiker weegt 1', 'kg', 'massa'], ['Een tomaat weegt 150', 'g', 'massa'], ['Een kat weegt 4', 'kg', 'massa'], ['Een auto weegt ongeveer 1', 'ton', 'massa'], ['Een zakje thee weegt 2', 'g', 'massa'], ['Een vrachtwagen weegt 12', 'ton', 'massa'],
  ['In een limonadeglas kan 25', 'cl', 'inhoud'], ['In een emmer kan 10', 'l', 'inhoud'], ['Een eetlepel bevat 15', 'ml', 'inhoud'], ['In mijn drinkbus kan 750', 'ml', 'inhoud'], ['Een koffiekopje bevat 1', 'dl', 'inhoud'],
  ['Mijn slaapkamer is 12', 'm²', 'opp'], ['Een blaadje wc-papier is ongeveer 1', 'dm²', 'opp'], ['De onderkant van een dobbelsteen is 1', 'cm²', 'opp'], ['Het terras is 20', 'm²', 'opp'], ['Een zonnepaneel is ongeveer 1,6', 'm²', 'opp'], ['De gemeente is 30', 'km²', 'opp'], ['Een postzegel is ongeveer 6', 'cm²', 'opp']
];
const KEUZE_E = { lengte:['mm', 'cm', 'dm', 'm', 'km'], massa:['mg', 'g', 'kg', 'ton'], inhoud:['ml', 'cl', 'dl', 'l'], opp:['mm²', 'cm²', 'dm²', 'm²', 'km²'] };
K({ id:'e_kies', titel:'Vul de juiste eenheid in', niv:1, maak(R){
  const g = R.shuffle(['lengte', 'massa', 'inhoud', 'opp']); const zinnen = g.map(s=>R.pick(ZINNEN.filter(z=>z[2] === s))).concat([R.pick(ZINNEN.filter(z=>z[2] === g[0]))]).slice(0, 4);
  return { tekst:'<p>Kies de eenheid die past.</p>', q2:true, vragen:zinnen.map(([t, e, s])=>{ const k = KEUZE_E[s]; return { t:t + ' …', soort:'keuze', keuzes:k, a:k.indexOf(e) }; }),
    sol:zinnen.map(([t, e])=>`${t} <b>${e}</b>.`).join('<br>') };
} });
const VOORWERP = [['een postzegel', 1], ['een zakdoek', 2], ['een tafelkleed', 3], ['een voetbalveld', 3], ['een vingernagel', 0], ['een A4-blad', 2], ['een speelkaart', 1], ['een deur', 3], ['een muntstuk', 0], ['een gsm-scherm', 1], ['een tennisveld', 3], ['een bierviltje', 1], ['een badhanddoek', 2], ['een lucifer (onderkant)', 0]];
K({ id:'e_schat', titel:'Schat de oppervlakte', niv:2, maak(R){
  const v = R.kies(VOORWERP, 4); const k = ['kleiner dan 1 cm²', 'kleiner dan 1 dm²', 'kleiner dan 1 m²', 'groter dan 1 m²'];
  return { tekst:'<p>Kies voor elk voorwerp wat het best past.</p><p class="klein">1 cm² = de onderkant van een dobbelsteen · 1 dm² = je handpalm · 1 m² = de vloer van een kleine douche</p>', vragen:v.map(([n, i])=>({ t:`<b>${n}</b>`, soort:'keuze', keuzes:k, a:i })),
    sol:v.map(([n, i])=>`${n}: ${k[i]}`).join('<br>') };
} });

/* ---------- 2 · Lengte en massa ---------- */
K({ id:'l_herleid', titel:'Herleid lengtematen', niv:1, maak(R){ return herleidKaart(R, 'lengte', ['km', 'm', 'dm', 'cm', 'mm'], 6); } });
K({ id:'m_herleid', titel:'Herleid massamaten', niv:1, maak(R){ return herleidKaart(R, 'massa', R.kans(.7) ? ['ton', 'kg', 'g'] : ['kg', 'g', 'dg', 'cg', 'mg'], 6); } });
const DIER = [
  R=>{ const x = R.int(3, 9); return [`Een wolf kan geluiden horen tot op ${x} km afstand.`, `Een wolf hoort geluiden tot op ... m.`, x * 1000, 'm']; },
  R=>{ const x = R.int(25, 45) / 10; return [`Een wolf eet ${nf(x)} kg vlees per dag.`, `Een wolf eet ... g vlees per dag.`, x * 1000, 'g']; },
  R=>{ const x = R.int(2, 6); return [`Een ree heeft een staartje van ongeveer ${x} cm.`, `Het staartje is ... mm lang.`, x * 10, 'mm']; },
  R=>{ const x = R.int(14, 19) / 10; return [`Een gorilla is ${nf(x)} m groot.`, `Een gorilla is ... cm groot.`, rnd(x * 100), 'cm']; },
  R=>{ const x = R.int(6, 9) * 100; return [`Een gorilla kan ${x} kg opheffen.`, `Dat is ... ton.`, x / 1000, 'ton']; },
  R=>{ const x = R.int(21, 38) / 100; return [`Een kameel kan ${nf(x)} ton dragen.`, `Een kameel draagt ... kg.`, rnd(x * 1000), 'kg']; },
  R=>{ const x = R.int(450, 790); return [`Het hoogste punt van een heuvelrug is ${x} m hoog.`, `Dat is ... km.`, x / 1000, 'km']; },
  R=>{ const x = R.int(41, 69) / 10; return [`Een hoornaar kan ${nf(x)} cm groot worden.`, `Een hoornaar is ... mm groot.`, rnd(x * 10), 'mm']; },
  R=>{ const x = R.int(35, 52) * 100; return [`Een mol drukt in een jaar ${nf(x)} kg aarde omhoog.`, `Dat is ... ton aarde.`, x / 1000, 'ton']; },
  R=>{ const x = R.int(45, 75); return [`Een steekmug ruikt ons tot op ${x} m afstand.`, `Dat is ... km.`, x / 1000, 'km']; },
  R=>{ const x = R.int(31, 69) / 10; return [`Een zeehond eet elke dag ${nf(x)} kg vis.`, `Een zeehond eet ... g vis per dag.`, rnd(x * 1000), 'g']; },
  R=>{ const x = R.int(25, 45) / 10; return [`Een haas springt tot ${nf(x)} m hoog.`, `Een haas springt ... cm hoog.`, rnd(x * 100), 'cm']; }
];
K({ id:'lm_dieren', titel:'Weetjes over dieren', niv:2, maak(R){
  const w = R.kies(DIER, 5).map(f=>f(R));
  return { tekst:'<p>Herleid naar de gevraagde maat.</p>', vragen:w.map(([zin, vraag, a, na])=>({ t:`${zin}<br>${vraag.split('...')[0].trim()}`, a, na, w:'md' })),
    sol:w.map(([zin, vraag, a, na])=>`${zin} → ${nf(a)} ${na}`).join('<br>') };
} });

/* ---------- 3 · Inhoud ---------- */
K({ id:'i_herleid', titel:'Herleid inhoudsmaten', niv:1, maak(R){ return herleidKaart(R, 'inhoud', ['l', 'dl', 'cl', 'ml'], 6); } });
K({ id:'i_recept', titel:'Een mocktail maken', niv:2, maak(R){
  const p = R.pick([4, 5, 6]); const a = R.int(6, 12) * p * 2 * 10 / 1000, b = R.int(3, 8) * p * 10 / 10, c = R.int(2, 5) * p * 10 / 100;   /* l, cl, dl */
  const ml = [rnd(a * 1000), rnd(b * 10), rnd(c * 100)], tot = som(ml), per = tot / p;
  const smaak = R.pick(['aardbei en limoen', 'mango en appel', 'framboos en munt', 'ananas en kokos']);
  return { tekst:`<p>Mocktail met ${smaak} voor <b>${p} personen</b>. Zet de ingrediënten in ml.</p>`,
    fig:tab(['ingrediënt', 'hoeveelheid', 'in ml'], [['limonade', nf(a) + ' l', slot(0) + ' ml'], ['bruisend water', nf(b) + ' cl', slot(1) + ' ml'], ['fruitsap', nf(c) + ' dl', slot(2) + ' ml'], ['<b>samen</b>', '', slot(3) + ' ml']]),
    vragen:ml.map(x=>({ a:x, label:'in ml' })).concat([{ a:tot, label:'samen in ml' }, { t:'Hoeveel ml mocktail is dat voor 1 persoon?', a:per, na:'ml' }]),
    hint:[{ t:`1 l = 1 000 ml. Hoeveel ml is ${nf(a)} l?`, a:ml[0], na:'ml' }, { t:`1 cl = 10 ml. Hoeveel ml is ${nf(b)} cl?`, a:ml[1], na:'ml' }, { t:`1 dl = 100 ml. Hoeveel ml is ${nf(c)} dl?`, a:ml[2], na:'ml' }],
    sol:`${nf(a)} l = ${nf(ml[0])} ml · ${nf(b)} cl = ${nf(ml[1])} ml · ${nf(c)} dl = ${nf(ml[2])} ml<br>Samen: ${nf(tot)} ml. Per persoon: ${nf(tot)} : ${p} = <b>${nf(per)} ml</b>` };
} });
K({ id:'i_soep', titel:'Soep en drank verdelen', niv:2, maak(R){
  const pp = R.pick([150, 200, 250, 300]), pot = R.pick([3, 4.5, 6, 7.5, 9]) ; const n = Math.floor(pot * 1000 / pp);
  const fles = R.pick([1, 1.5, 2]), gl = R.pick([4, 5, 8, 10]); const cl = rnd(fles * 100 / gl, 2);
  const dier = R.pick([['een kat', R.pick([0.2, 0.25, 0.3])], ['een hond', R.pick([0.5, 0.75, 1.2])]]);
  return { tekst:`<p>In een restaurant geeft men <b>${pp} ml</b> soep per persoon.</p>`, q2:true, vragen:[
    { t:`${pp} ml = … dl`, a:pp / 100, na:'dl' }, { t:`${pp} ml = … l`, a:pp / 1000, na:'l' },
    { t:`In de kookpot zit ${nf(pot)} liter soep. Voor hoeveel personen is er genoeg soep?`, a:n, na:'personen', blok:true, hint:[{ t:`${nf(pot)} l = … ml`, a:pot * 1000, na:'ml' }, { t:`${nf(pot * 1000)} ml : ${pp} ml =`, a:rnd(pot * 1000 / pp, 4), meer:'Blijft er een rest over, dan is er voor die laatste persoon niet genoeg soep.' }] },
    { t:`Je giet een fles van ${nf(fles)} liter leeg in ${gl} glazen. In elk glas zit evenveel. Hoeveel cl zit er in elk glas?`, a:cl, na:'cl', blok:true }
  ], sol:`${pp} ml = ${nf(pp / 100)} dl = ${nf(pp / 1000)} l<br>${nf(pot)} l = ${nf(pot * 1000)} ml; ${nf(pot * 1000)} : ${pp} = ${nf(rnd(pot * 1000 / pp, 2))} → <b>${n} personen</b><br>${nf(fles)} l = ${nf(fles * 100)} cl; ${nf(fles * 100)} : ${gl} = <b>${nf(cl)} cl</b>` };
} });

/* ---------- 4 · Oppervlakte ---------- */
K({ id:'o_herleid', titel:'Herleid vlaktematen', niv:1, maak(R){ const k = herleidKaart(R, 'vlakte', ['m²', 'dm²', 'cm²', 'mm²'], 6); k.tekst = '<p>Bij vlaktematen is elke trede <b>x 100</b> of <b>: 100</b>. 1 dm² = 100 cm².</p>'; return k; } });
K({ id:'o_land', titel:'Landmaten', niv:2, maak(R){
  const it = R.shuffle([
    ()=>{ const x = R.int(3, 9); return [`Een bouwgrond is ${x} a groot.`, 'Hoeveel m² is dat?', x * 100, 'm²', 'a']; },
    ()=>{ const x = R.int(15, 60) * 100; return [`Een natuurgebied is ${nf(x)} ha groot.`, 'Hoeveel km² is dat?', x / 100, 'km²', 'ha']; },
    ()=>{ const x = R.int(21, 95) / 10; return [`Een speeltuin is ${nf(x)} ha groot.`, 'Hoeveel a is dat?', rnd(x * 100), 'a', 'ha']; },
    ()=>{ const x = R.int(2, 9) * 1000; return [`Een brand verwoest ${nf(x)} m² bos.`, 'Hoeveel a is dat?', x / 100, 'a', 'm²']; },
    ()=>{ const x = R.int(3, 25); return [`Een meer is ${x} km² groot.`, 'Hoeveel m² is dat?', x * 1000000, 'm²', 'km²']; },
    ()=>{ const x = R.int(4, 9) * 10000; return [`Een weide is ${nf(x)} m² groot.`, 'Hoeveel ha is dat?', x / 10000, 'ha', 'm²']; }
  ]).slice(0, 4).map(f=>f());
  return { tekst:'<p>1 ca = 1 m² · 1 a = 100 m² (10 m op 10 m) · 1 ha = 10 000 m² (100 m op 100 m) · 1 km² = 100 ha</p>', q2:true,
    vragen:it.map(([z, v, a, na, van])=>({ t:`${z}<br>${v}`, a, na, blok:true, w:'md', hint:[{ t:`Gebruik de trap van de vlaktematen. Hoeveel treden zitten er tussen ${van} en ${na}?`, a:stappenTussen('vlakte', van, na), meer:trapSvg('vlakte', van, na) }, { t:`Elke trede is x 100 of : 100. Wat wordt het?`, a, na }] })),
    sol:it.map(([z, v, a, na])=>`${z} → <b>${nf(a)} ${na}</b>`).join('<br>') };
} });

/* figuur uit vierkantjes op een rooster (aaneengesloten), omtrek en oppervlakte */
function polyomino(R, n, kol, rij){
  const S = new Set([`${Math.floor(kol / 2)},${Math.floor(rij / 2)}`]); let p = 0;
  while(S.size < n && p < 2000){ p++; const [x, y] = R.pick([...S]).split(',').map(Number); const [dx, dy] = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); const nx = x + dx, ny = y + dy; if(nx >= 0 && ny >= 0 && nx < kol && ny < rij) S.add(`${nx},${ny}`); }
  return [...S].map(s=>s.split(',').map(Number));
}
const omtrekVan = cellen => { const S = new Set(cellen.map(c=>c.join(','))); let o = 0; cellen.forEach(([x, y])=>[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=>{ if(!S.has(`${x + dx},${y + dy}`)) o++; })); return o; };
function roosterFig(kol, rij, cellen, o = {}){
  const c = o.cel || 26; let s = '';
  for(let i = 0; i <= kol; i++) s += lijn(i * c + 2, 2, i * c + 2, rij * c + 2, { k:'var(--border)', w:1 });
  for(let j = 0; j <= rij; j++) s += lijn(2, j * c + 2, kol * c + 2, j * c + 2, { k:'var(--border)', w:1 });
  cellen.forEach(([x, y])=>{ s += rh(x * c + 2, y * c + 2, c, c, { f:o.f || 'var(--tq-soft, #dff5f6)', k:'none', w:0 }); });
  /* rand van de figuur */
  const S = new Set(cellen.map(q=>q.join(',')));
  cellen.forEach(([x, y])=>{ const X = x * c + 2, Y = y * c + 2;
    if(!S.has(`${x},${y - 1}`)) s += lijn(X, Y, X + c, Y, { k:'var(--accent-dark)', w:2.5 }); if(!S.has(`${x},${y + 1}`)) s += lijn(X, Y + c, X + c, Y + c, { k:'var(--accent-dark)', w:2.5 });
    if(!S.has(`${x - 1},${y}`)) s += lijn(X, Y, X, Y + c, { k:'var(--accent-dark)', w:2.5 }); if(!S.has(`${x + 1},${y}`)) s += lijn(X + c, Y, X + c, Y + c, { k:'var(--accent-dark)', w:2.5 }); });
  return svg(kol * c + 4, rij * c + 4, s, { label:'figuur op een rooster' });
}
/* eigen vraag: vakjes kleuren op een rooster; doel = aantal vakjes; vast = al gekleurde vakjes (niet aan te klikken) */
function kleurVakjes(kol, rij, doel, o = {}){
  const c = o.cel || 26, vast = new Set((o.vast || []).map(q=>q.join(',')));
  return { soort:'eigen', blok:true, t:o.t || '', voorbeeld:(()=>{ const v = []; for(let j = 0; j < rij && v.length < doel - vast.size; j++) for(let i = 0; i < kol && v.length < doel - vast.size; i++) if(!vast.has(`${i},${j}`)) v.push(`${i},${j}`); return v; })(),
    toonA:`samen ${doel} vakjes`, eigen:{ tekst:`samen ${doel} vakjes gekleurd`,
      maak(box, val, zet){
        let sel = new Set(Array.isArray(val) ? val : []);
        const wrap = el('div', 'e-rand kleurrooster'); const tel = el('div', 'gk-tot');
        function teken(){
          let s = '';
          for(let j = 0; j < rij; j++) for(let i = 0; i < kol; i++){ const k = `${i},${j}`; const f = vast.has(k) ? 'var(--accent)' : sel.has(k) ? 'var(--orange)' : 'var(--card)';
            s += `<rect x="${i * c + 2}" y="${j * c + 2}" width="${c}" height="${c}" fill="${f}" stroke="var(--border)" stroke-width="1" data-k="${k}" class="${vast.has(k) ? '' : 'vak'}"/>`; }
          wrap.innerHTML = svg(kol * c + 4, rij * c + 4, s, { label:'rooster om te kleuren', cls:'klikfig' });
          tel.innerHTML = `Gekleurd: <b>${sel.size + vast.size}</b> vakjes`;
        }
        wrap.addEventListener('click', e=>{ const r = e.target.closest('rect[data-k]'); if(!r || box.dataset.dicht) return; const k = r.dataset.k; if(vast.has(k)) return; sel.has(k) ? sel.delete(k) : sel.add(k); zet([...sel]); box.classList.remove('e-ok', 'e-bad'); teken(); });
        teken(); box.append(wrap, tel);
      },
      check(val){ return Array.isArray(val) && val.length + vast.size === doel; } },
    uitleg:`Tel nog eens: samen moeten er ${doel} vakjes gekleurd zijn.` };
}
K({ id:'o_rooster', titel:'Omtrek en oppervlakte op een rooster', niv:1, maak(R){
  const n = R.int(6, 11); const cel = polyomino(R, n, 7, 5); const o = omtrekVan(cel);
  return { fig:roosterFig(7, 5, cel), tekst:'<p>Elk hokje is <b>1 cm</b> op <b>1 cm</b>. Zo is elk hokje <b>1 cm²</b>.</p>', vragen:[
    { t:'De omtrek van de figuur is', a:o, na:'cm', hint:[{ t:'Tel de zijden van de hokjes op de rand. Elke zijde is 1 cm.', a:o, na:'cm' }], uitleg:'Omtrek = de lengte van de rand. Je antwoordt in cm.' },
    { t:'De oppervlakte van de figuur is', a:n, na:'cm²', uitleg:'Oppervlakte = het aantal hokjes. Je antwoordt in cm².' },
    { t:'Een figuur met een oppervlakte die <b>dubbel zo groot</b> is, heeft een oppervlakte van', a:2 * n, na:'cm²' }
  ], sol:`Omtrek: ${o} zijden van 1 cm = <b>${o} cm</b>. Oppervlakte: ${n} hokjes van 1 cm² = <b>${n} cm²</b>. Dubbel zo groot: <b>${2 * n} cm²</b>.` };
} });
K({ id:'o_kleur', titel:'Kleur dezelfde oppervlakte', niv:2, maak(R){
  const n = R.int(5, 10); const cel = polyomino(R, n, 6, 5);
  const vast = [[0, 0], [1, 0]].slice(0, R.int(1, 2));
  return { fig:roosterFig(6, 5, cel), tekst:`<p>Kleur in het tweede rooster vakjes bij, zodat beide figuren <b>dezelfde oppervlakte</b> hebben.</p>`,
    vragen:[kleurVakjes(8, 5, n, { vast })], hint:[{ t:'Hoeveel hokjes heeft de eerste figuur?', a:n }, { t:`Er zijn al ${vast.length} hokjes gekleurd. Hoeveel moet je er nog bij kleuren?`, a:n - vast.length }],
    sol:`De eerste figuur heeft ${n} hokjes. Er zijn er al ${vast.length} gekleurd, dus kleur je er nog <b>${n - vast.length}</b> bij.` };
} });
K({ id:'o_tegels', titel:'Tegels en planten', niv:2, maak(R){
  const t = R.pick([4, 5, 10, 20, 25]), m = R.pick([2, 3, 4, 5, 6, 8]); const n = m * 100 / t;
  const per = R.pick([2, 3, 4]), pl = R.int(5, 9), opp = per * R.int(3, 8);
  const groente = R.pick(['bloemkool', 'sla', 'prei', 'kolen']);
  return { tekst:'', vragen:[
    { t:`In de badkamer leg je tegels van <b>${t} dm²</b>. Hoeveel tegels heb je nodig voor <b>${m} m²</b>?`, a:n, na:'tegels', blok:true, hint:[{ t:`${m} m² = … dm²`, a:m * 100, na:'dm²' }, { t:`${m * 100} dm² : ${t} dm² =`, a:n }] },
    { t:`${R.naam()} plant ${groente} op <b>${opp} m²</b>. Per <b>${per} m²</b> zet je <b>${pl} planten</b>. Hoeveel planten zijn er nodig?`, a:opp / per * pl, na:'planten', blok:true, hint:[{ t:`Hoeveel keer ${per} m² is ${opp} m²?`, a:opp / per }, { t:`Dat aantal keer ${pl} planten =`, a:opp / per * pl }] }
  ], sol:`${m} m² = ${m * 100} dm²; ${m * 100} : ${t} = <b>${n} tegels</b><br>${opp} : ${per} = ${opp / per}; ${opp / per} x ${pl} = <b>${opp / per * pl} planten</b>` };
} });

/* ---------- 5 · Vraagstukken ---------- */
const SPRONG = [['sprinkhaan', [0.9, 1.2, 1.5], 'm'], ['konijn', [2, 2.5, 3], 'm'], ['vlo', [25, 30, 35], 'cm'], ['vos', [2.8, 3, 3.5], 'm'], ['boomkikker', [1.8, 2.4, 2.5], 'm'], ['eekhoorn', [3, 4, 5], 'm'], ['wolf', [4, 5, 6], 'm'], ['ree', [6, 7, 8], 'm'], ['kangoeroe', [8, 9, 10], 'm'], ['sneeuwluipaard', [12, 15, 16], 'm']];
K({ id:'pr_sprong', titel:'Hoe ver springen dieren?', niv:2, maak(R){
  const d = SPRONG.map(([n, v, e])=>({ n, v:R.pick(v), e })); const m = x=>x.e === 'cm' ? x.v / 100 : x.v;
  const vlo = d[2], kik = d[4], spr = d[0], kon = d[1], eek = d[5], sneeuw = d[9];
  const dubbel = d.find(x=>x !== kon && Math.abs(m(x) - 2 * m(kon)) < 1e-9);
  const vr = [
    { t:`Een vlo springt … m ver.`, a:vlo.v / 100, na:'m' },
    { t:`Een vlo springt … mm ver.`, a:vlo.v * 10, na:'mm' },
    { t:`Een boomkikker springt … cm ver.`, a:rnd(kik.v * 100), na:'cm' },
    { t:`Een sprinkhaan springt … cm verder dan een vlo.`, a:rnd(spr.v * 100 - vlo.v), na:'cm' },
    { t:`Een sneeuwluipaard springt … keer verder dan een eekhoorn.`, a:rnd(sneeuw.v / eek.v, 4), uitleg:'Deel de sprong van het sneeuwluipaard door die van de eekhoorn.' }
  ];
  return { fig:`<b>Hoe ver kunnen dieren springen?</b>${tab(null, rij(5, i=>[d[i].n, nf(d[i].v) + ' ' + d[i].e, d[i + 5].n, nf(d[i + 5].v) + ' ' + d[i + 5].e]), { l:true })}`, vragen:vr, q2:false,
    sol:vr.map(v=>v.t.replace('…', '<b>' + nf(v.a) + '</b>')).join('<br>') };
} });
K({ id:'pr_vraag', titel:'Kleine vraagstukken', niv:2, maak(R){
  const pl = R.int(20, 35) / 10, st = R.int(45, 90), ns = 2; const rest = rnd(pl * 100 - ns * st);
  const lw = R.pick([200, 250]), lin = R.pick([100, 125]);
  const giraf = R.int(55, 75), dagen = R.pick([[30, 'november'], [31, 'december'], [30, 'april']]); const tonnen = rnd(2 * giraf * dagen[0] / 1000, 3);
  return { vragen:[
    { t:`Een plank is <b>${nf(pl)} m</b> lang. Je zaagt er ${ns} stukken van <b>${st} cm</b> af. Hoeveel cm blijft er over?`, a:rest, na:'cm', blok:true, hint:[{ t:`${nf(pl)} m = … cm`, a:rnd(pl * 100), na:'cm' }, { t:`${ns} stukken van ${st} cm = … cm`, a:ns * st, na:'cm' }] },
    { t:`Een leeuw weegt <b>${lw} kg</b>. Hoeveel leeuwen wegen samen 1 ton?`, a:1000 / lw, na:'leeuwen', blok:true, hint:[{ t:'1 ton = … kg', a:1000, na:'kg' }] },
    { t:`Een giraf eet <b>${giraf} kg</b> bladeren per dag. Hoeveel ton bladeren eten 2 giraffen in ${dagen[1]}? Rond af op een heel getal.`, a:Math.round(tonnen), na:'ton', blok:true, hint:[{ t:`${dagen[1]} heeft … dagen.`, a:dagen[0] }, { t:`2 giraffen samen per dag: … kg`, a:2 * giraf, na:'kg' }, { t:`In ${dagen[1]}: … kg`, a:2 * giraf * dagen[0], na:'kg' }] }
  ], sol:`${nf(pl)} m = ${rnd(pl * 100)} cm; ${rnd(pl * 100)} – ${ns * st} = <b>${rest} cm</b><br>1 ton = 1 000 kg; 1 000 : ${lw} = <b>${1000 / lw}</b> leeuwen<br>2 x ${giraf} x ${dagen[0]} = ${2 * giraf * dagen[0]} kg = ${nf(tonnen)} ton ≈ <b>${Math.round(tonnen)} ton</b>` };
} });
K({ id:'pr_meloen', titel:'Prijs per kg', niv:2, maak(R){
  const prk = R.pick([1.5, 2, 2.4, 2.5, 3, 3.5, 4, 4.5]), g = R.pick([200, 300, 400, 600, 700, 800]); const pr = rnd(prk * g / 1000, 2);
  const f = R.pick(['meloen', 'ananas', 'pompoen', 'kool']);
  return { tekst:`<p>De prijs van ${f} is <b>${eur(prk)} per kg</b>. ${R.naam()} koopt een ${f} van <b>${g} g</b>. Vul de verhoudingstabel in.</p>`,
    fig:`<div class="ttab"><table class="dtable verh"><tr><th>massa</th><td>1 000 g</td><td>100 g</td><td>${g} g</td></tr><tr><th>prijs</th><td>${eur(prk)}</td><td>€ ${slot(0)}</td><td>€ ${slot(1)}</td></tr><tr><td></td><td class="pijl">: 10 →</td><td class="pijl">x ${g / 100} →</td><td></td></tr></table></div>`, boven:true,
    vragen:[{ a:rnd(prk / 10, 3), geld:true, label:'prijs voor 100 g' }, { a:pr, geld:true, label:`prijs voor ${g} g` }],
    sol:`1 000 g → 100 g: : 10 → ${eur(prk)} : 10 = € ${nf(rnd(prk / 10, 3))}<br>100 g → ${g} g: x ${g / 100} → <b>${eur(pr)}</b>` };
} });
K({ id:'pr_fiets', titel:'Hoelang is hij onderweg?', niv:3, maak(R){
  const v = R.pick([12, 15, 20]), d = R.pick(v === 12 ? [3, 6, 9, 18] : v === 15 ? [5, 10, 12, 20] : [5, 10, 15, 30]); const min = d * 60 / v; const naam = R.jongen();
  const vt = R.int(13, 17) * 60 + R.pick([0, 10, 20, 25, 40, 45, 50]); const aan = vt + min; const t = m=>`${Math.floor(m / 60)}.${String(m % 60).padStart(2, '0')}`;
  return { tekst:`<p>${naam} fietst met een snelheid van <b>${v} km per uur</b> naar een vriend die <b>${d} km</b> verder woont.</p>`,
    fig:`<div class="ttab"><table class="dtable verh"><tr><th>afstand</th><td>${v} km</td><td>1 km</td><td>${d} km</td></tr><tr><th>tijd</th><td>1 uur = 60 min.</td><td>${slot(0)} min.</td><td>${slot(1)} min.</td></tr></table></div>`, boven:true,
    vragen:[{ a:60 / v, label:'minuten voor 1 km' }, { a:min, label:'minuten onderweg' }, { t:`${naam} vertrekt om ${t(vt)} uur. Hoe laat komt hij aan?`, a:[t(aan), t(aan).replace('.', ':'), t(aan) + ' uur', rnd(aan / 60 | 0) + 'u' + String(aan % 60).padStart(2, '0')], soort:'tekst', na:'uur', w:'xs' }],
    sol:`60 min : ${v} = ${nf(60 / v)} min per km; x ${d} = <b>${min} minuten</b><br>${t(vt)} uur + ${min} min = <b>${t(aan)} uur</b>` };
} });
K({ id:'pr_overbodig', titel:'Welk gegeven heb je niet nodig?', niv:2, maak(R){
  const k = R.int(0, 2);
  const it = [
    ()=>{ const l = R.int(150, 240), w = R.int(120, 260), s = R.int(50, 80), j = R.int(10, 18); return { z:`Een leeuw weegt ${l} kg en is ${nf(R.int(17, 21) / 10)} m lang. Hij haalt ${s} km per uur. Een leeuwin weegt ${w - 100 > 90 ? w - 100 : 110} kg.`, v:`Hoeveel kg wegen een leeuw en een leeuwin samen?`, a:l + (w - 100 > 90 ? w - 100 : 110), na:'kg', g:['het gewicht van de leeuw', 'de lengte van de leeuw', 'het gewicht van de leeuwin'], nn:1 }; },
    ()=>{ const p = R.int(140, 190) * 1000, a = R.int(4, 9), afst = R.int(5, 15); return { z:`Een bouwgrond is ${a} are groot en kost € ${nf(p)}. Hij ligt ${afst} km van het centrum.`, v:'Hoeveel m² is de bouwgrond?', a:a * 100, na:'m²', g:['de oppervlakte in are', 'de prijs', 'de afstand tot het centrum'], nn:[1, 2] }; },
    ()=>{ const e = R.int(25, 40), m = R.int(550, 750), st = R.int(5000, 8000); return { z:`Een egel is ${e} cm lang en weegt ${m} g. Hij heeft ongeveer ${nf(st)} stekels.`, v:'Hoeveel kg weegt de egel?', a:m / 1000, na:'kg', g:['de lengte van de egel', 'het gewicht van de egel', 'het aantal stekels'], nn:[0, 2] }; }
  ][k]();
  return { tekst:`<p>${it.z}</p><p><b>${it.v}</b></p>`, vragen:[{ t:'Antwoord:', a:it.a, na:it.na, w:'md' }, { t:'Welk gegeven heb je <b>niet</b> nodig? Kies alles wat je niet nodig hebt.', soort:'multi', keuzes:it.g, a:Array.isArray(it.nn) ? it.nn : [it.nn] }],
    sol:`Antwoord: <b>${nf(it.a)} ${it.na}</b>. Niet nodig: ${(Array.isArray(it.nn) ? it.nn : [it.nn]).map(i=>it.g[i]).join(' en ')}.` };
} });

/* ---------- Puzzels: hoeveel wegen de figuren? ---------- */
const VORM = {
  drie:(x, y, k)=>veelhoek([[x, y - 13], [x + 13, y + 11], [x - 13, y + 11]], { f:k, k:'none' }),
  vier:(x, y, k)=>rh(x - 12, y - 12, 24, 24, { f:k, k:'none', rx:2 }),
  cirk:(x, y, k)=>cirkel(x, y, 13, { f:k, k:'none' }),
  ster:(x, y, k)=>veelhoek(rij(10, i=>{ const r = i % 2 ? 6 : 14, a = -Math.PI / 2 + i * Math.PI / 5; return [rnd(x + r * Math.cos(a), 2), rnd(y + r * Math.sin(a), 2)]; }), { f:k, k:'none' })
};
const KLEUR = { drie:'#8bc34a', vier:'#4fc3f7', cirk:'#e05a9b', ster:'#fcaf17' };
function vormRij(lijst, uitkomst){ let x = 18, s = ''; lijst.forEach((v, i)=>{ if(i) { s += tekst(x - 2, 20, '+', { s:16 }); x += 14; } s += VORM[v](x + 6, 20, KLEUR[v]); x += 32; }); s += tekst(x + 4, 20, '= ' + uitkomst, { s:16, a:'start' }); return svg(x + 60, 40, s, { label:'figuren' }); }
K({ id:'pz_wegen', titel:'Hoeveel wegen de figuren?', niv:2, maak(R){
  const [a, b, c] = R.shuffle(['drie', 'vier', 'cirk', 'ster']).slice(0, 3); const w = { [a]:R.int(2, 9), [b]:R.int(3, 12), [c]:R.int(2, 15) };
  const r1 = [a, a, a], r2 = [a, b], r3 = [b, c, c], vraag = R.pick([[a, b, c], [c, c, a], [b, b, c]]);
  const S = l=>som(l.map(v=>w[v]));
  const naam = { drie:'driehoek', vier:'vierkant', cirk:'cirkel', ster:'ster' };
  return { tekst:'<p>Elke figuur heeft een gewicht in kg. Zoek uit hoeveel elke figuur weegt.</p>',
    fig:`<div class="wegen">${vormRij(r1, S(r1) + ' kg')}${vormRij(r2, S(r2) + ' kg')}${vormRij(r3, S(r3) + ' kg')}${vormRij(vraag, '? kg')}</div>`,
    vragen:[{ t:`<span class="vorm-ic">${svg(30, 30, VORM[a](15, 15, KLEUR[a]))}</span> ${naam[a]} =`, a:w[a], na:'kg' }, { t:`<span class="vorm-ic">${svg(30, 30, VORM[b](15, 15, KLEUR[b]))}</span> ${naam[b]} =`, a:w[b], na:'kg' }, { t:`<span class="vorm-ic">${svg(30, 30, VORM[c](15, 15, KLEUR[c]))}</span> ${naam[c]} =`, a:w[c], na:'kg' }, { t:'? =', a:S(vraag), na:'kg' }],
    sol:`${naam[a]}: ${S(r1)} : 3 = ${w[a]} kg · ${naam[b]}: ${S(r2)} – ${w[a]} = ${w[b]} kg · ${naam[c]}: (${S(r3)} – ${w[b]}) : 2 = ${w[c]} kg · ? = ${S(vraag)} kg` };
} });

/* ---------- MODULE 2: onderdelen, proeftoets en snelle quiz ----------
   Nieuwe kaarten altijd achteraan een onderdeel toevoegen; kaart-id's nooit hernoemen (opslagsleutel en vraag-id). */
const SECS = [
  { id:'eenheid', nav:'Welke eenheid?', title:'Welke eenheid past?', ic:'lengte', tip:'<b>Lengte</b>: km, m, dm, cm, mm · <b>massa</b>: ton, kg, g · <b>inhoud</b>: l, dl, cl, ml · <b>oppervlakte</b>: km², m², dm², cm², mm²', kaarten:['e_kies', 'e_schat'] },
  { id:'lengte', nav:'Lengte en massa', title:'Lengtematen en massamaten herleiden', ic:'massa', tip:'Gebruik de <b>trap</b>: elke trede naar beneden x 10, elke trede naar boven : 10. Lukt het niet? Klik op 💡 Hint.', kaarten:['l_herleid', 'm_herleid', 'lm_dieren'] },
  { id:'inhoud', nav:'Inhoud', title:'Inhoudsmaten', ic:'inhoud', tip:'1 l = 10 dl = 100 cl = 1 000 ml', kaarten:['i_herleid', 'i_recept', 'i_soep'] },
  { id:'opp', nav:'Oppervlakte', title:'Oppervlakte', ic:'opp', tip:'De <b>omtrek</b> is de lengte van de rand (cm). De <b>oppervlakte</b> is hoe groot de binnenkant is (cm²). Bij vlaktematen is elke trede x 100.', kaarten:['o_rooster', 'o_kleur', 'o_herleid', 'o_land', 'o_tegels'] },
  { id:'vraag', nav:'Vraagstukken', title:'Vraagstukken', ic:'reken', rm:true, tip:'Lees goed wat er gevraagd wordt. Zet eerst alles in dezelfde maat.', kaarten:['pr_sprong', 'pr_vraag', 'pr_meloen', 'pr_overbodig'], verd:['pr_fiets'] },
  { id:'puzzels', nav:'Puzzels', title:'Puzzels', ic:'puzzel', telt:false, tip:'Puzzels om je hersenen te trainen. Ze tellen niet mee voor je resultaten.', kaarten:['pz_wegen'] },
  { id:'quiz', nav:'Snelle quiz', title:'Snelle quiz', ic:'quiz', soort:'quiz', telt:false },
  { id:'toets', nav:'Proeftoets', title:'Proeftoets lengte, massa, inhoud en oppervlakte', ic:'toets', soort:'toets', sepBefore:true }
];
const TOETS = { titel:'Proeftoets lengte, massa, inhoud en oppervlakte', kaarten:['o_rooster', 'e_kies', 'lm_dieren', 'i_recept', 'o_herleid', 'o_land', 'pr_vraag'] };
const QUIZ = [
  R=>{ const x = R.int(2, 9); return { t:`${x} km = … m`, a:x * 1000, na:'m' }; },
  R=>{ const x = R.int(11, 99) / 10; return { t:`${nf(x)} m = … cm`, a:rnd(x * 100), na:'cm' }; },
  R=>{ const x = R.int(2, 9) * 10; return { t:`${x} mm = … cm`, a:x / 10, na:'cm' }; },
  R=>{ const x = R.int(15, 45) / 10; return { t:`${nf(x)} kg = … g`, a:rnd(x * 1000), na:'g' }; },
  R=>{ const x = R.int(2, 9) * 1000; return { t:`${nf(x)} kg = … ton`, a:x / 1000, na:'ton' }; },
  R=>{ const x = R.pick([0.25, 0.5, 0.75, 1.5]); return { t:`${nf(x)} l = … ml`, a:x * 1000, na:'ml' }; },
  R=>{ const x = R.int(2, 9) * 10; return { t:`${x} cl = … dl`, a:x / 10, na:'dl' }; },
  R=>{ const x = R.int(2, 9); return { t:`${x} m² = … dm²`, a:x * 100, na:'dm²' }; },
  R=>{ const x = R.int(2, 9); return { t:`${x} ha = … a`, a:x * 100, na:'a' }; },
  R=>{ const x = R.int(3, 9) * 100; return { t:`${x} m² = … a`, a:x / 100, na:'a' }; },
  R=>{ const x = R.int(2, 9); return { t:`${x} dm² = … cm²`, a:x * 100, na:'cm²' }; }
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
