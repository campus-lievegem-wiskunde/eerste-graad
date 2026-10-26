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
   MODULE 3 · COÖRDINATEN (2B)
   Gebaseerd op taak 3.1, taak 3.2 en toets 3.1. Roosters: letters (horizontaal) groen, cijfers (verticaal) rood.
   Assenstelsel: x-as groen, y-as rood. De kaarten uit het boek zijn vervangen door eigen getekende kaarten.
   ============================================================ */
const tab = (koppen, rijen, o = {}) => `<div class="ttab"><table class="dtable${o.cls ? ' ' + o.cls : ''}">${koppen ? '<tr>' + koppen.map(k=>`<th${o.l ? ' class="l"' : ''}>${k}</th>`).join('') + '</tr>' : ''}${rijen.map(r=>'<tr>' + r.map((c, i)=>`<td${o.l && i === 0 ? ' class="l"' : ''}>${c}</td>`).join('') + '</tr>').join('')}</table></div>`;

/* ---------- 1 · Rooster ---------- */
const ICOON = ['🍎','⭐','🚕','🔑','🎈','🌻','🐞','👑','🎵','✂️','⏰','🍒','🦆','🎺','📎','🐌','🕶️','🌈','🎁','⚽','🐟','🍦','🚲','🏠','🌙'];
const ICNAAM = { '🍎':'appel', '⭐':'ster', '🚕':'taxi', '🔑':'sleutel', '🎈':'ballon', '🌻':'zonnebloem', '🐞':'lieveheersbeestje', '👑':'kroon', '🎵':'muzieknoot', '✂️':'schaar', '⏰':'wekker', '🍒':'kersen', '🦆':'eend', '🎺':'trompet', '📎':'paperclip', '🐌':'slak', '🕶️':'zonnebril', '🌈':'regenboog', '🎁':'cadeau', '⚽':'voetbal', '🐟':'vis', '🍦':'ijsje', '🚲':'fiets', '🏠':'huis', '🌙':'maan' };
K({ id:'r_plaats', titel:'Waar staat de figuur?', niv:1, maak(R){
  const kol = 5, rijen = 5; const ic = R.kies(ICOON, 25); const op = (k, r)=>ic[LETTERS.indexOf(k) * rijen + (r - 1)];
  const vakken = R.kies(rij(25, i=>[LETTERS[Math.floor(i / 5)], i % 5 + 1]), 6);
  const fig = letterRooster(kol, rijen, { cel:46, inhoud:(k, r, x, y, c)=>`<text x="${x + c / 2}" y="${y + c / 2 + 1}" font-size="26" text-anchor="middle" dominant-baseline="central">${op(k, r)}</text>` });
  const vr = vakken.slice(0, 4).map(([k, r])=>({ t:`Waar staat ${['cadeau', 'ijsje', 'huis', 'lieveheersbeestje'].includes(ICNAAM[op(k, r)]) ? 'het' : 'de'} <b>${ICNAAM[op(k, r)]}</b> ${op(k, r)}?`, a:vakA(k, r), soort:'tekst', w:'xs', toonA:k + r, uitleg:'Lees eerst de letter onderaan (horizontaal), dan het cijfer links (verticaal). Bv. C4.' }))
    .concat(vakken.slice(4).map(([k, r])=>{ const ks = R.shuffle([op(k, r)].concat(R.kies(ic.filter(x=>x !== op(k, r)), 3))); return { t:`Wat staat er in vak ${vakT(k, r)}?`, soort:'keuze', keuzes:ks.map(x=>`<span style="font-size:1.4rem">${x}</span>`), a:ks.indexOf(op(k, r)) }; }));
  return { fig, tekst:'<p>Je leest <b>eerst de horizontale as</b> (de letter) en <b>daarna de verticale as</b> (het cijfer).</p>', q2:true, vragen:vr,
    sol:vakken.map(([k, r])=>`${ICNAAM[op(k, r)]}: ${k}${r}`).join('<br>') };
} });
/* schepen op een rooster zonder dat ze elkaar raken */
function vloot(R, kol, rijen, lengtes){
  for(let p = 0; p < 500; p++){
    const bezet = new Set(), schepen = []; let ok = true;
    for(const L of lengtes){
      let gelukt = false;
      for(let q = 0; q < 200 && !gelukt; q++){
        const hor = R.kans(.5); const x0 = R.int(0, kol - (hor ? L : 1)), y0 = R.int(1, rijen - (hor ? 0 : L - 1));
        const cel = rij(L, i=>[x0 + (hor ? i : 0), y0 + (hor ? 0 : i)]);
        const rond = c=>{ for(let dx = -1; dx <= 1; dx++) for(let dy = -1; dy <= 1; dy++) if(bezet.has(`${c[0] + dx},${c[1] + dy}`)) return true; return false; };
        if(cel.some(rond)) continue;
        cel.forEach(c=>bezet.add(c.join(','))); schepen.push(cel.map(([x, y])=>LETTERS[x] + y)); gelukt = true;
      }
      if(!gelukt){ ok = false; break; }
    }
    if(ok) return schepen;
  }
  return [];
}
K({ id:'r_zeeslag', titel:'Zeeslag: raak of niet raak?', niv:1, maak(R){
  const schepen = vloot(R, 10, 10, [4, 3, 2, 1, 1, 1]); const raak = new Set(schepen.flat());
  const schoten = []; const alle = rij(100, i=>LETTERS[i % 10] + (Math.floor(i / 10) + 1));
  const raakL = R.kies([...raak], 3), mis = R.kies(alle.filter(v=>!raak.has(v)), 3); R.shuffle(raakL.concat(mis)).forEach(v=>schoten.push(v));
  const fig = letterRooster(10, 10, { cel:27, vul:(k, r)=>raak.has(k + r) ? '#8a9aa3' : null });
  return { fig, tekst:'<p>In de grijze vakken liggen de boten. Is het schot raak of niet raak?</p>', q2:true,
    vragen:schoten.map(v=>({ t:`Schot <b>${v}</b>`, soort:'keuze', keuzes:['raak', 'niet raak'], a:raak.has(v) ? 0 : 1 })),
    sol:schoten.map(v=>`${v}: ${raak.has(v) ? 'raak' : 'niet raak'}`).join('<br>') };
} });
K({ id:'r_schiet', titel:'Waar moet je schieten?', niv:2, maak(R){
  const schepen = vloot(R, 8, 8, [4, 3, 2]); const doel = R.pick([0, 1, 2]); const naam = ['het grootste schip', 'het schip van 3 vakken', 'het kleinste schip'][doel];
  const fig = letterRooster(8, 8, { cel:30, vul:(k, r)=>schepen.flat().includes(k + r) ? '#8a9aa3' : null });
  return { fig, tekst:`<p>In de grijze vakken liggen de schepen.</p><p>Op welke plaatsen moet je schieten om <b>${naam}</b> helemaal te raken? Klik de vakken aan in het tweede rooster.</p>`,
    vragen:[klikVakken(8, 8, schepen[doel], { cel:30 })], sol:`${naam}: ${schepen[doel].join(', ')}` };
} });

/* ---------- 2 · Kaarten met een rooster ---------- */
const STRATEN = ['Kerkstraat', 'Molenstraat', 'Schoolstraat', 'Stationsstraat', 'Dorpsstraat', 'Beekstraat', 'Lindelaan', 'Kastanjelaan', 'Veldstraat', 'Bosstraat', 'Nieuwstraat', 'Marktstraat', 'Sportlaan', 'Tuinstraat'];
const PLEKKEN = [['station', '🚉'], ['zwembad', '🏊'], ['kerk', '⛪'], ['park', '🌳'], ['school', '🏫'], ['bibliotheek', '📚'], ['ziekenhuis', '🏥'], ['bakker', '🥖'], ['sporthal', '🏀'], ['postkantoor', '📮']];
function stadsplan(R){
  const K_ = 5, Rr = 4, c = 80; const W = 30 + K_ * c, H = Rr * c + 30;
  const namen = R.kies(STRATEN, 5);
  /* straten lopen door het midden van een rij of kolom vakken */
  const hor = R.kies([1, 2, 3, 4], 2).sort().map((r, i)=>({ n:namen[i], r })), ver = R.kies([0, 1, 2, 3, 4], 3).sort().map((k, i)=>({ n:namen[2 + i], k:LETTERS[k], ki:k }));
  const X = i=>30 + i * c, Ymid = r=>(Rr - r) * c + c / 2, Xmid = i=>30 + i * c + c / 2;
  let s = `<rect x="30" y="0" width="${K_ * c}" height="${Rr * c}" fill="#e9f1e4"/>`;
  const weg = (x1, y1, x2, y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9aa7ad" stroke-width="17"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="14"/>`;
  hor.forEach(h=>{ s += weg(30, Ymid(h.r), X(K_), Ymid(h.r)); });
  ver.forEach(v=>{ s += weg(Xmid(v.ki), 0, Xmid(v.ki), Rr * c); });
  /* plekken: in een hoek van een vak, niet op een straat */
  const vakken = R.kies(rij(K_ * Rr, i=>[i % K_, Math.floor(i / K_) + 1]), 5); const pl = R.kies(PLEKKEN, 5).map((p, i)=>({ n:p[0], ic:p[1], k:LETTERS[vakken[i][0]], r:vakken[i][1] }));
  pl.forEach(p=>{ const cx = 30 + LETTERS.indexOf(p.k) * c + c * .74, cy = (Rr - p.r) * c + c * .7; s += `<text x="${cx}" y="${cy}" font-size="20" text-anchor="middle" dominant-baseline="central">${p.ic}</text><text x="${cx + 2}" y="${cy + 17}" font-size="9.5" text-anchor="middle" fill="#37474f" font-weight="800" paint-order="stroke" stroke="#e9f1e4" stroke-width="3">${p.n}</text>`; });
  hor.forEach((h, i)=>{ const x0 = X(i % 2 ? 2 : 0) + 10; s += `<text x="${x0}" y="${Ymid(h.r) + .5}" font-size="10" fill="#37474f" font-weight="800" dominant-baseline="central">${h.n}</text>`; });
  ver.forEach((v, i)=>{ const yy = (i % 2 ? Rr * c - 12 : 12); s += `<text x="${Xmid(v.ki)}" y="${yy}" font-size="10" fill="#37474f" font-weight="800" text-anchor="${i % 2 ? 'start' : 'end'}" dominant-baseline="central" transform="rotate(-90 ${Xmid(v.ki)} ${yy})">${v.n}</text>`; });
  /* raster en labels */
  for(let i = 0; i <= K_; i++) s += `<line x1="${X(i)}" y1="0" x2="${X(i)}" y2="${Rr * c}" stroke="#37474f" stroke-opacity=".7" stroke-width="1.3"/>`;
  for(let j = 0; j <= Rr; j++) s += `<line x1="30" y1="${j * c}" x2="${X(K_)}" y2="${j * c}" stroke="#37474f" stroke-opacity=".7" stroke-width="1.3"/>`;
  for(let i = 0; i < K_; i++) s += tekst(30 + i * c + c / 2, Rr * c + 15, LETTERS[i], { s:15, f:'var(--as-x)', wt:800 });
  for(let j = 1; j <= Rr; j++) s += tekst(14, (Rr - j) * c + c / 2, j, { s:15, f:'var(--as-y)', wt:800 });
  s += `<g transform="translate(${X(K_) - 20},${Rr * c - 24})"><circle r="15" fill="#fff" stroke="#555"/><path d="M0 -12 L4 0 L0 12 L-4 0Z" fill="#555"/><path d="M0 -12 L4 0 L-4 0Z" fill="#c62828"/><text y="-20" font-size="10" text-anchor="middle" font-weight="800" fill="#333">N</text></g>`;
  return { svg:svg(W, H, s, { label:'stadsplan met rooster', cls:'kaartfig' }), hor, ver, pl, K_, Rr };
}
K({ id:'k_stad', titel:'Een stadsplan met een rooster', niv:1, maak(R){
  const P = stadsplan(R); const a = R.pick(P.pl); const c = R.pick(P.pl.filter(p=>p !== a));
  const parEv = R.kans(.5); const s1 = R.pick(P.ver), s2 = parEv ? R.pick(P.ver.filter(v=>v !== s1)) : R.pick(P.hor);
  const keuzeVak = P.pl.map(p=>p.n);
  /* door welke vakken loopt een straat? */
  const st = R.kans(.5) ? R.pick(P.hor) : R.pick(P.ver);
  const vakkenVan = x=>x.r ? rij(P.K_, i=>LETTERS[i] + x.r) : rij(P.Rr, j=>x.k + (j + 1));
  const lijst = v=>v.slice(0, -1).join(', ') + ' en ' + v[v.length - 1];
  const juist = lijst(vakkenVan(st));
  const fout = st.r ? [lijst(rij(P.K_, i=>LETTERS[i] + (st.r % P.Rr + 1))), lijst(rij(P.Rr, j=>LETTERS[st.r - 1] + (j + 1)))] : [lijst(rij(P.Rr, j=>LETTERS[(P.ver.indexOf(st) ? st.ki - 1 : st.ki + 1)] + (j + 1))), lijst(rij(P.K_, i=>LETTERS[i] + (st.ki % P.Rr + 1)))];
  const ks = R.shuffle([juist].concat([...new Set(fout)].filter(f=>f !== juist)));
  return { fig:P.svg, breed:true, tekst:'<p>Een plattegrond van een gemeente met een rooster.</p>', vragen:[
    { t:`In welk vak ligt ${a.n === 'park' || a.n === 'ziekenhuis' || a.n === 'zwembad' || a.n === 'station' || a.n === 'postkantoor' ? 'het' : 'de'} ${a.n}?`, a:vakA(a.k, a.r), soort:'tekst', w:'xs', toonA:a.k + a.r },
    { t:`Wat ligt er in vak ${vakT(c.k, c.r)}?`, soort:'keuze', keuzes:keuzeVak, a:keuzeVak.indexOf(c.n) },
    { t:`De ${s1.n} en de ${s2.n} …`, soort:'keuze', keuzes:['lopen evenwijdig.', 'staan loodrecht op elkaar.'], a:parEv ? 0 : 1 },
    { t:`Door welke vakken loopt de ${st.n}?`, soort:'keuze', kol:true, keuzes:ks, a:ks.indexOf(juist) }
  ], sol:`${a.n}: ${a.k}${a.r}. In ${c.k}${c.r} ligt: ${c.n}. De ${s1.n} en de ${s2.n} ${parEv ? 'lopen evenwijdig' : 'staan loodrecht op elkaar'}. De ${st.n} loopt door ${juist}.` };
} });
const STREKEN = ['Noordland', 'Zuidhoek', 'Oostmeers', 'Westkust', 'Heidedal', 'Bosrand', 'Merenland', 'Vlakland'];
const STEDEN = ['Arendonk', 'Beverbeek', 'Dalhem', 'Eikveld', 'Groenhove', 'Heuvelrode', 'Kastelmolen', 'Lindebroek', 'Meerdonk', 'Oudenhout', 'Rozenberg', 'Zandvoorde'];
const STREEKKLEUR = ['#f6d58e', '#a8d8b9', '#f3b7a8', '#b9cdf0', '#e0c3ea', '#cfe6a3'];
function landkaart(R){
  const K_ = 6, Rr = 5, n = 5; const reg = rij(Rr, ()=>rij(K_, ()=>-1));
  const zaden = R.kies(rij(K_ * Rr, i=>[i % K_, Math.floor(i / K_)]), n); zaden.forEach(([x, y], i)=>{ reg[y][x] = i; });
  let leeg = K_ * Rr - n, p = 0;
  while(leeg > 0 && p < 5000){ p++; const x = R.int(0, K_ - 1), y = R.int(0, Rr - 1); if(reg[y][x] < 0) continue; const [dx, dy] = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); const nx = x + dx, ny = y + dy; if(nx >= 0 && ny >= 0 && nx < K_ && ny < Rr && reg[ny][nx] < 0){ reg[ny][nx] = reg[y][x]; leeg--; } }
  const namen = R.kies(STREKEN, n); const c = 58, W = 30 + K_ * c, H = Rr * c + 30;
  /* rij 0 bovenaan = cijfer Rr */
  let s = '';
  for(let y = 0; y < Rr; y++) for(let x = 0; x < K_; x++) s += `<rect x="${30 + x * c}" y="${y * c}" width="${c}" height="${c}" fill="${STREEKKLEUR[reg[y][x]]}"/>`;
  for(let y = 0; y < Rr; y++) for(let x = 0; x < K_; x++){ const X = 30 + x * c, Y = y * c;
    if(x + 1 < K_ && reg[y][x + 1] !== reg[y][x]) s += lijn(X + c, Y, X + c, Y + c, { k:'#6d4c41', w:2.4, d:'6 3' });
    if(y + 1 < Rr && reg[y + 1][x] !== reg[y][x]) s += lijn(X, Y + c, X + c, Y + c, { k:'#6d4c41', w:2.4, d:'6 3' }); }
  /* naam van elke streek in een vak van die streek */
  const naamVak = namen.map((_, i)=>{ const v = []; for(let y = 0; y < Rr; y++) for(let x = 0; x < K_; x++) if(reg[y][x] === i) v.push([x, y]); return v; });
  const steden = R.kies(STEDEN, 6).map(nm=>{ const x = R.int(0, K_ - 1), y = R.int(0, Rr - 1); return { n:nm, x, y, k:LETTERS[x], r:Rr - y, reg:reg[y][x] }; })
    .filter((st, i, a)=>a.findIndex(o=>o.x === st.x && o.y === st.y) === i);
  naamVak.forEach((v, i)=>{ const vrij = v.filter(([x, y])=>!steden.some(st=>st.x === x && st.y === y)); const [x, y] = (vrij.length ? vrij : v)[0]; s += `<text x="${30 + x * c + c / 2}" y="${y * c + c / 2}" font-size="9.5" font-style="italic" font-weight="800" fill="#4e342e" text-anchor="middle" dominant-baseline="central">${namen[i].toUpperCase()}</text>`; });
  steden.forEach(st=>{ const cx = 30 + st.x * c + c / 2, cy = st.y * c + c / 2 - 6; s += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#c62828" stroke="#fff" stroke-width="1.5"/><text x="${cx}" y="${cy + 14}" font-size="10" text-anchor="middle" font-weight="700" fill="#263238">${st.n}</text>`; });
  for(let i = 0; i <= K_; i++) s += `<line x1="${30 + i * c}" y1="0" x2="${30 + i * c}" y2="${Rr * c}" stroke="#555" stroke-width="1"/>`;
  for(let j = 0; j <= Rr; j++) s += `<line x1="30" y1="${j * c}" x2="${30 + K_ * c}" y2="${j * c}" stroke="#555" stroke-width="1"/>`;
  for(let i = 0; i < K_; i++) s += tekst(30 + i * c + c / 2, Rr * c + 15, LETTERS[i], { s:15, f:'var(--as-x)', wt:800 });
  for(let j = 0; j < Rr; j++) s += tekst(14, j * c + c / 2, Rr - j, { s:15, f:'var(--as-y)', wt:800 });
  const buren = (a, b)=>{ for(let y = 0; y < Rr; y++) for(let x = 0; x < K_; x++){ if(reg[y][x] !== a) continue; for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = x + dx, ny = y + dy; if(nx >= 0 && ny >= 0 && nx < K_ && ny < Rr && reg[ny][nx] === b) return true; } } return false; };
  return { svg:svg(W, H, s, { label:'kaart met streken en een rooster', cls:'kaartfig' }), reg, namen, steden, buren, naamVak, K_, Rr };
}
K({ id:'k_land', titel:'Een kaart met streken', niv:2, maak(R){
  const L = landkaart(R); const st = R.pick(L.steden); const r1 = R.int(0, L.namen.length - 1);
  const ander = R.pick(rij(L.namen.length, i=>i).filter(i=>i !== r1)); const grenst = L.buren(r1, ander);
  const inR = L.steden.filter(s=>s.reg === r1).map(s=>s.n);
  const st2 = R.pick(L.steden.filter(s=>s !== st));
  const keuzeSt = L.steden.map(s=>s.n);
  return { fig:L.svg, tekst:'<p>Een kaart van een verzonnen land. De stippellijnen zijn de grenzen tussen de streken.</p>', vragen:[
    { t:`In welke streek ligt ${st.n} (${st.k}${st.r})?`, soort:'keuze', keuzes:L.namen, a:st.reg },
    { t:`In welk vak ligt ${st2.n}?`, a:vakA(st2.k, st2.r), soort:'tekst', w:'xs', toonA:st2.k + st2.r },
    { t:`Grenst ${L.namen[r1]} aan ${L.namen[ander]}?`, soort:'keuze', keuzes:['ja', 'nee'], a:grenst ? 0 : 1 },
    { t:`Welke steden liggen in ${L.namen[r1]}? Kies ze allemaal. ${inR.length ? '' : '(Geen enkele? Kies dan niets en klik op Controleer.)'}`, soort:'multi', keuzes:keuzeSt, a:L.steden.map((s, i)=>s.reg === r1 ? i : -1).filter(i=>i >= 0) }
  ], sol:`${st.n} ligt in ${L.namen[st.reg]}. ${st2.n} ligt in ${st2.k}${st2.r}. ${L.namen[r1]} grenst ${grenst ? '' : 'niet '}aan ${L.namen[ander]}. Steden in ${L.namen[r1]}: ${inR.join(', ') || 'geen'}.` };
} });

/* ---------- 3 · Assenstelsel ---------- */
K({ id:'a_assen', titel:'Het assenstelsel', niv:1, maak(R){
  const pts = willekeurigePunten(R, 4, 1, 5); const A = assenstelsel({ min:0, max:6, cel:36, punten:pts });
  return { fig:A.html, tekst:'<p>De <b style="color:var(--as-x)">x-as</b> is horizontaal. De <b style="color:var(--as-y)">y-as</b> is verticaal.</p><p>Schrijf de coördinaten zo: eerst x, dan y, bv. <b>3,2</b>.</p>', vragen:[
    { t:'De horizontale as heet de …', soort:'keuze', keuzes:['x-as', 'y-as'], a:0 }
  ].concat(pts.slice(0, 3).map(p=>coordVraag(p))), hint:[{ t:`Kijk naar punt ${pts[0].n}. Ga recht naar beneden naar de groene x-as. Welk getal lees je?`, a:pts[0].x }, { t:`Ga nu van ${pts[0].n} horizontaal naar de rode y-as. Welk getal lees je?`, a:pts[0].y }],
    sol:pts.slice(0, 3).map(p=>coord(p.n, p.x, p.y)).join('<br>') };
} });
K({ id:'a_zet1', titel:'Zet de punten in het assenstelsel', niv:1, maak(R){
  const pts = willekeurigePunten(R, 3, 0, 6);
  return { tekst:`<p>Zet de punten in het assenstelsel: <b>${pts.map(p=>coord(p.n, p.x, p.y)).join('  ')}</b>.</p><p>Ga eerst naar rechts (x), dan naar boven (y).</p>`, vragen:[puntenZetten(pts, { min:0, max:6, cel:38 })],
    sol:pts.map(p=>`${coord(p.n, p.x, p.y)}: ${p.x} naar rechts, ${p.y} naar boven`).join('<br>') };
} });
K({ id:'a_aflezen', titel:'Lees de coördinaten af', niv:3, maak(R){
  const pts = willekeurigePunten(R, 6, -5, 5); pts[R.int(0, 5)].y = 0; pts.forEach((p, i)=>{ if(pts.findIndex(q=>q.x === p.x && q.y === p.y) !== i) p.x = -p.x || 1; });
  const ok = pts.every((p, i)=>pts.findIndex(q=>q.x === p.x && q.y === p.y) === i) ? pts : willekeurigePunten(R, 6, -5, 5);
  const A = assenstelsel({ min:-5, max:5, cel:30, punten:ok });
  return { fig:A.html, tekst:'<p>Schrijf de coördinaten van elk punt. Een negatief getal schrijf je met een minteken, bv. <b>-3,2</b>.</p>', q2:true, vragen:ok.map(p=>coordVraag(p)), sol:ok.map(p=>coord(p.n, p.x, p.y)).join('<br>') };
} });
K({ id:'a_figuur', titel:'Teken en benoem de figuur', niv:3, maak(R){
  const [naam, f] = R.pick(FIG); const hk = f(R); const pts = hk.map(([x, y], i)=>({ n:PUNT_N[i], x, y }));
  const namen = ['rechthoek', 'vierkant', 'parallellogram', 'ruit', 'trapezium'];
  return { tekst:`<p>Zet de punten ${pts.map(p=>coord(p.n, p.x, p.y)).join(', ')} in het assenstelsel. Ze worden in alfabetische volgorde verbonden, en ${pts[3].n} met ${pts[0].n}.</p>`,
    vragen:[puntenZetten(pts, { lijnen:pos=>{ const l = []; for(let i = 0; i < 4; i++){ const a = pts[i].n, b = pts[(i + 1) % 4].n; if(pos[a] && pos[b]) l.push([pos[a][0], pos[a][1], pos[b][0], pos[b][1], 'var(--orange)']); } return l; } }), { t:'Welke figuur krijg je?', soort:'keuze', keuzes:namen, a:namen.indexOf(naam) }],
    sol:`De punten vormen een <b>${naam}</b>.` };
} });
/* drie punten op één rechte lijn? */
const opLijn = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x) === 0;
K({ id:'a_lijn', titel:'Liggen de punten op één rechte lijn?', niv:3, maak(R){
  const pts = willekeurigePunten(R, 6, -4, 4); const drietal = [];
  /* minstens één drietal op een lijn: maak er een */
  const [a, b] = [pts[0], pts[1]]; const dx = b.x - a.x, dy = b.y - a.y; const g = Math.abs(ggdM(dx, dy)) || 1; let c = { x:a.x - dx / g, y:a.y - dy / g };
  if(Math.abs(c.x) <= 4 && Math.abs(c.y) <= 4 && !pts.some(p=>p.x === c.x && p.y === c.y)){ pts[2].x = c.x; pts[2].y = c.y; }
  const combis = R.shuffle([[0, 1, 2], [0, 3, 4], [1, 3, 5], [2, 4, 5], [0, 2, 5], [1, 2, 4]]).slice(0, 4);
  const A = assenstelsel({ min:-5, max:5, cel:28, punten:pts });
  return { fig:A.html, tekst:'<p>Liggen de punten op één rechte lijn? Leg in gedachten een lat langs de punten.</p>', q2:true,
    vragen:combis.map(([i, j, k])=>({ t:`${pts[i].n}, ${pts[j].n} en ${pts[k].n}`, soort:'keuze', keuzes:['ja', 'nee'], a:opLijn(pts[i], pts[j], pts[k]) ? 0 : 1 })),
    sol:combis.map(([i, j, k])=>`${pts[i].n}, ${pts[j].n}, ${pts[k].n}: ${opLijn(pts[i], pts[j], pts[k]) ? 'ja' : 'nee'}`).join('<br>') };
} });
const ggdM = (a, b) => { a = Math.abs(a); b = Math.abs(b); while(b){ [a, b] = [b, a % b]; } return a; };
/* geheim bericht ontcijferen (taak 3.2) */
K({ id:'a_code', titel:'Ontcijfer het woord', niv:3, maak(R){
  const woorden = ['ZEESLAG', 'KAART', 'ROOSTER', 'PUNTEN', 'GROEN', 'SCHAT', 'ASSEN', 'PIRAAT', 'KOMPAS', 'EILAND'];
  const w = R.pick(woorden); const letters = [...new Set(w.split(''))].concat(R.kies('BDFHJMQUVWXY'.split('').filter(l=>!w.includes(l)), 4));
  const plek = {}; const vrij = R.shuffle(rij(121, i=>[i % 11 - 5, Math.floor(i / 11) - 5]).filter(([x, y])=>x !== 0 && y !== 0));
  letters.forEach((l, i)=>{ plek[l] = vrij[i]; });
  const A = assenstelsel({ min:-5, max:5, cel:28, extra:(px, py)=>letters.map(l=>`${cirkel(px(plek[l][0]), py(plek[l][1]), 3.5, { f:'var(--ink)', k:'var(--ink)' })}<text x="${px(plek[l][0]) + 7}" y="${py(plek[l][1]) - 8}" font-size="14" font-weight="800" fill="var(--accent-dark)">${l}</text>`).join('') });
  const code = w.split('').map(l=>`(${minN(plek[l][0])},${minN(plek[l][1])})`).join(' ');
  return { fig:A.html, tekst:`<p>Welke letter staat bij elk punt? Ontcijfer het woord.</p><p class="code">${code}</p>`, vragen:[{ t:'Het woord is:', a:w, soort:'tekst', w:'md' }], sol:w.split('').map(l=>`(${plek[l][0]},${plek[l][1]}) = ${l}`).join(' · ') + ` → <b>${w}</b>` };
} });

/* ---------- Puzzels: latijns vierkant en sudoku ---------- */
function latijn(R, n, bh, bw){
  /* geldige sudoku: basispatroon, dan rijen/kolommen binnen blokken en cijfers schudden */
  const g = rij(n, r=>rij(n, c=>((r % bh) * bw + Math.floor(r / bh) + c) % n));
  const perm = R.shuffle(rij(n, i=>i + 1));
  const rijB = R.shuffle(rij(n / bh, i=>i)).flatMap(b=>R.shuffle(rij(bh, i=>b * bh + i)));
  const kolB = R.shuffle(rij(n / bw, i=>i)).flatMap(b=>R.shuffle(rij(bw, i=>b * bw + i)));
  return rijB.map(r=>kolB.map(c=>perm[g[r][c]]));
}
const sudokuOk = (g, n, bh, bw) => { for(let i = 0; i < n; i++){ if(new Set(g[i]).size !== n || new Set(g.map(r=>r[i])).size !== n) return false; } if(bh){ for(let a = 0; a < n; a += bh) for(let b = 0; b < n; b += bw){ const s = new Set(); for(let r = a; r < a + bh; r++) for(let c = b; c < b + bw; c++) s.add(g[r][c]); if(s.size !== n) return false; } } return true; };
/* aantal oplossingen (stopt bij 2) */
function oplossingen(g, n, bh, bw){ const G = g.map(r=>r.slice()); let tel = 0;
  const kan = (r, c, v)=>{ for(let i = 0; i < n; i++){ if(G[r][i] === v || G[i][c] === v) return false; } if(bh){ const a = r - r % bh, b = c - c % bw; for(let i = a; i < a + bh; i++) for(let j = b; j < b + bw; j++) if(G[i][j] === v) return false; } return true; };
  const zoek = ()=>{ for(let r = 0; r < n; r++) for(let c = 0; c < n; c++) if(!G[r][c]){ for(let v = 1; v <= n; v++) if(kan(r, c, v)){ G[r][c] = v; zoek(); G[r][c] = 0; if(tel > 1) return; } return; } tel++; };
  zoek(); return tel; }
function sudokuVraag(R, n, bh, bw, weg){
  const opl = latijn(R, n, bh || 1, bw || n); let g; let p = 0;
  do{ g = opl.map(r=>r.slice()); R.kies(rij(n * n, i=>i), weg).forEach(i=>{ g[Math.floor(i / n)][i % n] = 0; }); p++; } while(oplossingen(g, n, bh, bw) !== 1 && p < 60);
  return { opl, g };
}
function sudokuEigen(S, n, bh, bw){
  return { soort:'eigen', blok:true, voorbeeld:S.opl.map(r=>r.slice()), toonA:'zie oplossing', eigen:{ tekst:'',
    maak(box, val, zet){
      const cur = Array.isArray(val) ? val.map(r=>r.slice()) : S.g.map(r=>r.map(x=>x || ''));
      const t = el('table', 'sudoku e-rand s' + n);
      for(let r = 0; r < n; r++){ const tr = el('tr');
        for(let c = 0; c < n; c++){ const td = el('td'); if(bh){ if(c % bw === bw - 1 && c < n - 1) td.classList.add('br'); if(r % bh === bh - 1 && r < n - 1) td.classList.add('bb'); }
          if(S.g[r][c]) td.innerHTML = `<b>${S.g[r][c]}</b>`;
          else { const i = el('input', 'sud-in'); i.inputMode = 'numeric'; i.maxLength = 1; i.value = cur[r][c] || ''; i.setAttribute('aria-label', `rij ${r + 1} kolom ${c + 1}`);
            i.addEventListener('input', ()=>{ i.value = i.value.replace(/[^1-9]/g, '').slice(0, 1); cur[r][c] = i.value ? +i.value : ''; zet(cur.map(x=>x.slice())); box.classList.remove('e-ok', 'e-bad'); }); td.append(i); }
          tr.append(td); }
        t.append(tr); }
      box.append(t);
    },
    check(val){ if(!Array.isArray(val)) return false; const g = val.map(r=>r.map(Number)); return g.every(r=>r.every(x=>x >= 1 && x <= n)) && sudokuOk(g, n, bh, bw) && S.g.every((r, i)=>r.every((x, j)=>!x || x === g[i][j])); } },
    uitleg:'Kijk na: komt elk cijfer in elke rij, elke kolom' + (bh ? ' en elk vetgedrukt vak' : '') + ' juist één keer voor?' };
}
K({ id:'pz_latijn', titel:'Eenvoudige puzzel', niv:1, maak(R){ const S = sudokuVraag(R, 5, 0, 0, 10); return { tekst:'<p>In elke <b>rij</b> en in elke <b>kolom</b> moeten de cijfers van 1 tot en met 5 staan.</p>', vragen:[sudokuEigen(S, 5, 0, 0)], sol:S.opl.map(r=>r.join(' ')).join('<br>') }; } });
K({ id:'pz_sud4', titel:'Sudoku 4 x 4', niv:1, maak(R){ const S = sudokuVraag(R, 4, 2, 2, 9); return { tekst:'<p>In elk <b>vetgedrukt vierkant</b>, elke <b>rij</b> en elke <b>kolom</b> staan de cijfers 1 tot en met 4 juist één keer.</p>', vragen:[sudokuEigen(S, 4, 2, 2)], sol:S.opl.map(r=>r.join(' ')).join('<br>') }; } });
K({ id:'pz_sud6', titel:'Sudoku 6 x 6', niv:2, maak(R){ const S = sudokuVraag(R, 6, 2, 3, 18); return { tekst:'<p>In elke <b>vetgedrukte rechthoek</b>, elke <b>rij</b> en elke <b>kolom</b> staan de cijfers 1 tot en met 6 juist één keer.</p><p class="klein">Tip: vul eerst één cijfer overal in.</p>', vragen:[sudokuEigen(S, 6, 2, 3)], sol:S.opl.map(r=>r.join(' ')).join('<br>') }; } });

/* ---------- MODULE 3: onderdelen, proeftoets en snelle quiz ----------
   Nieuwe kaarten altijd achteraan een onderdeel toevoegen; kaart-id's nooit hernoemen (opslagsleutel en vraag-id). */
const SECS = [
  { id:'rooster', nav:'Rooster en zeeslag', title:'Een plaats bepalen in een rooster', ic:'rooster', tip:'Je leest <b>eerst de horizontale as</b> (de letter, <b style="color:var(--as-x)">groen</b>) en <b>daarna de verticale as</b> (het cijfer, <b style="color:var(--as-y)">rood</b>). Bijvoorbeeld <b>C4</b>.', kaarten:['r_plaats', 'r_zeeslag', 'r_schiet'] },
  { id:'kaart', nav:'Kaarten', title:'Kaarten met een rooster', ic:'kaart', tip:'Op een kaart met een rooster vind je snel een plaats terug. Het noorden ligt bovenaan.', kaarten:['k_stad', 'k_land'] },
  { id:'assen', nav:'Assenstelsel', title:'Coördinaten in een assenstelsel', ic:'assen', tip:'De <b style="color:var(--as-x)">x-as</b> is horizontaal, de <b style="color:var(--as-y)">y-as</b> is verticaal. Een punt schrijf je zo: <b>A(2,4)</b>: eerst x, dan y. Denk aan een hoogspringer: eerst de aanloop, dan de sprong.', kaarten:['a_assen', 'a_zet1'], verd:['a_aflezen', 'a_figuur', 'a_lijn', 'a_code'] },
  { id:'puzzels', nav:'Puzzels', title:'Puzzels en sudoku', ic:'puzzel', telt:false, tip:'Puzzels om je hersenen te trainen. Ze tellen niet mee voor je resultaten.', kaarten:['pz_latijn', 'pz_sud4', 'pz_sud6'] },
  { id:'quiz', nav:'Snelle quiz', title:'Snelle quiz', ic:'quiz', soort:'quiz', telt:false },
  { id:'toets', nav:'Proeftoets', title:'Proeftoets coördinaten', ic:'toets', soort:'toets', sepBefore:true, tip:'Vraag 5 en 6 zijn verdieping.' }
];
const TOETS = { titel:'Proeftoets coördinaten', kaarten:['r_zeeslag', 'r_plaats', 'k_stad', 'k_land', 'a_aflezen', 'a_lijn'] };
const QUIZ = [
  R=>{ const x = R.int(-5, 5), y = R.int(-5, 5); return { t:`Wat is de x-coördinaat van P(${minN(x)},${minN(y)})?`, a:x }; },
  R=>{ const x = R.int(-5, 5), y = R.int(-5, 5); return { t:`Wat is de y-coördinaat van Q(${minN(x)},${minN(y)})?`, a:y }; },
  ()=>({ t:'Een punt op de x-as heeft als y-coördinaat …', a:0 }),
  ()=>({ t:'Een punt op de y-as heeft als x-coördinaat …', a:0 }),
  R=>{ const x = R.int(1, 5); return { t:`Je start in de oorsprong. Je gaat ${x} stappen naar links. Wat is de x-coördinaat?`, a:-x }; },
  R=>{ const y = R.int(1, 5); return { t:`Je start in de oorsprong. Je gaat ${y} stappen naar beneden. Wat is de y-coördinaat?`, a:-y }; },
  R=>{ const k = R.pick(['B', 'C', 'D', 'E']), r = R.int(2, 8); return { t:`Je staat in vak ${k}${r}. Je gaat één vak naar boven. In welk vak sta je?`, a:[k + (r + 1), k.toLowerCase() + (r + 1)], soort:'tekst' }; },
  R=>{ const k = R.pick(['B', 'C', 'D']), r = R.int(2, 8); const n = LETTERS[LETTERS.indexOf(k) + 1]; return { t:`Je staat in vak ${k}${r}. Je gaat één vak naar rechts. In welk vak sta je?`, a:[n + r, n.toLowerCase() + r], soort:'tekst' }; },
  R=>{ const x = R.int(1, 5), y = R.int(1, 5); return { t:`A(${x},${y}) ligt ${x} naar rechts en … naar boven.`, a:y }; },
  ()=>({ t:'Hoe heet het punt (0,0)? De …', a:['oorsprong', 'de oorsprong'], soort:'tekst' })
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
