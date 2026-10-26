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
   MODULE 4 · FIGUREN (2B)
   Gebaseerd op toets 4.1. Vlakke figuren, ruimtefiguren, aanzichten (draaibare bouwsels), bouwplaten, puzzels.
   Rechte hoeken altijd met een losse L (rhoekL).
   ============================================================ */
const tab = (koppen, rijen, o = {}) => `<div class="ttab"><table class="dtable${o.cls ? ' ' + o.cls : ''}">${koppen ? '<tr>' + koppen.map(k=>`<th>${k}</th>`).join('') + '</tr>' : ''}${rijen.map(r=>'<tr>' + r.map(c=>`<td>${c}</td>`).join('') + '</tr>').join('')}</table></div>`;
const KL = 'var(--accent-dark)', VUL = 'var(--tq-soft, #dff5f6)';
const draai = (pts, cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y])=>[rnd(cx + (x - cx) * c - (y - cy) * s, 2), rnd(cy + (x - cx) * s + (y - cy) * c, 2)]); };
const midden = pts => [som(pts.map(p=>p[0])) / pts.length, som(pts.map(p=>p[1])) / pts.length];

/* ---------- vlakke figuren ---------- */
const VLAK = ['driehoek', 'vierkant', 'rechthoek', 'ruit', 'parallellogram', 'trapezium', 'vierhoek', 'vijfhoek', 'zeshoek', 'cirkel'];
function vlakPunten(R, soort){
  const s = R.int(46, 60);
  switch(soort){
    case 'driehoek': return [[0, 0], [s * 1.2, R.int(-8, 8)], [R.int(5, 40), -s]];
    case 'vierkant': return [[0, 0], [s, 0], [s, -s], [0, -s]];
    case 'rechthoek': { const h = s * R.pick([.5, .6, .7]); return [[0, 0], [s * 1.3, 0], [s * 1.3, -h], [0, -h]]; }
    case 'ruit': { const a = s * .75, b = s * .45; return [[0, 0], [a, -b], [0, -2 * b], [-a, -b]]; }
    case 'parallellogram': { const sh = s * .45; return [[0, 0], [s * 1.2, 0], [s * 1.2 + sh, -s * .65], [sh, -s * .65]]; }
    case 'trapezium': { const b = s * 1.4, t = s * R.pick([.6, .7, .8]), off = R.int(5, Math.round(b - t - 5)); return [[0, 0], [b, 0], [off + t, -s * .65], [off, -s * .65]]; }
    case 'vierhoek': return [[0, 0], [s * 1.25, R.int(6, 14)], [s * 1.0, -s * .8], [R.int(8, 18), -s * .55]];
    case 'vijfhoek': return rij(5, i=>[rnd(s * .62 * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / 5), 2), rnd(s * .62 * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / 5), 2)]);
    case 'zeshoek': return rij(6, i=>[rnd(s * .6 * Math.cos(i * Math.PI / 3), 2), rnd(s * .6 * Math.sin(i * Math.PI / 3), 2)]);
  }
}
const rechtHoekig = soort => soort === 'vierkant' || soort === 'rechthoek';
function vlakFig(R, soort, o = {}){
  const W = o.b || 160, H = o.h || 130;
  if(soort === 'cirkel'){ const r = R.int(36, 48); return svg(W, H, cirkel(W / 2, H / 2, r, { f:VUL, k:KL, w:2.2 }) + (o.nr ? tekst(12, 12, o.nr, { s:13 }) : ''), { label:'figuur ' + (o.nr || '') }); }
  let p = vlakPunten(R, soort).map(([x, y])=>[x * (o.schaal || 1.3), y * (o.schaal || 1.3)]); const [mx, my] = midden(p); p = p.map(([x, y])=>[x - mx + W / 2, y - my + H / 2]);
  const hoek = o.rechtop ? 0 : R.pick([0, 0, 15, -15, 30, -30, 45, 90]) * Math.PI / 180; p = draai(p, W / 2, H / 2, hoek);
  /* passend maken in het vak */
  const xs = p.map(q=>q[0]), ys = p.map(q=>q[1]), bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys), f = Math.min(1, (W - 30) / bw, (H - 26) / bh);
  p = p.map(([x, y])=>[rnd(W / 2 + (x - W / 2) * f, 2), rnd(H / 2 + 6 + (y - H / 2) * f, 2)]);
  let s = veelhoek(p, { f:VUL, k:KL, w:2.2 });
  if(rechtHoekig(soort)) p.forEach((q, i)=>{ s += rhoekL(q, p[(i + 1) % 4], p[(i + 3) % 4], { s:8, g:3, k:KL }); });
  if(o.nr) s += tekst(12, 12, o.nr, { s:13 });
  return svg(W, H, s, { label:'figuur ' + (o.nr || '') });
}
K({ id:'v_naam', titel:'Hoe heet de figuur?', niv:1, maak(R){
  const soorten = R.kies(VLAK, 4); const keuzes = ['driehoek', 'vierkant', 'rechthoek', 'ruit', 'parallellogram', 'trapezium', 'vierhoek', 'vijfhoek', 'zeshoek', 'cirkel'];
  return { tekst:'<p>Kies de <b>best passende</b> naam. De L in een hoek betekent: een rechte hoek.</p>', q2:true,
    vragen:soorten.map((s, i)=>{ const ks = R.shuffle([s].concat(R.kies(keuzes.filter(k=>k !== s), 3))); return { t:vlakFig(R, s, { nr:i + 1, b:170, h:130 }), soort:'keuze', keuzes:ks, a:ks.indexOf(s) }; }),
    sol:soorten.map((s, i)=>`figuur ${i + 1}: ${s}`).join('<br>') };
} });
K({ id:'v_veelhoek', titel:'Veelhoek of niet?', niv:1, maak(R){
  const soorten = R.shuffle(R.kies(VLAK.filter(s=>s !== 'cirkel'), 4).concat(['cirkel', 'halve cirkel']));
  const fig = soorten.map((s, i)=>{ if(s === 'halve cirkel'){ const W = 150, H = 120; return svg(W, H, pad(`M35 80 A40 40 0 0 1 115 80 Z`, { f:VUL, k:KL, w:2.2 }) + tekst(12, 12, i + 1, { s:13 }), { label:'figuur ' + (i + 1) }); } return vlakFig(R, s, { nr:i + 1 }); });
  const veel = soorten.map((s, i)=>s !== 'cirkel' && s !== 'halve cirkel' ? i : -1).filter(i=>i >= 0);
  return { fig:`<div class="figraster">${fig.join('')}</div>`, breed:true, tekst:'<p>Een <b>veelhoek</b> is een vlakke figuur die begrensd is door lijnstukken (rechte lijnen).</p>', vragen:[
    { t:'Welke figuren zijn veelhoeken? Kies ze allemaal.', soort:'multi', keuzes:soorten.map((s, i)=>'figuur ' + (i + 1)), a:veel }
  ], sol:`Veelhoeken: ${veel.map(i=>'figuur ' + (i + 1)).join(', ')}. De andere figuren hebben een gebogen rand.` };
} });
const VIERH = ['vierkant', 'rechthoek', 'parallellogram', 'ruit', 'trapezium'];
const KENMERK = [
  ['heeft 4 rechte hoeken.', [1, 1, 0, 0, 0]], ['heeft 4 even lange zijden.', [1, 0, 0, 1, 0]], ['heeft overstaande zijden die even lang zijn.', [1, 1, 1, 1, 0]],
  ['heeft 2 paar evenwijdige zijden.', [1, 1, 1, 1, 0]], ['heeft minstens 1 paar evenwijdige zijden.', [1, 1, 1, 1, 1]], ['heeft diagonalen die even lang zijn.', [1, 1, 0, 0, 0]],
  ['heeft diagonalen die loodrecht op elkaar staan.', [1, 0, 0, 1, 0]], ['heeft diagonalen die elkaar middendoor snijden.', [1, 1, 1, 1, 0]]
];
const IS_OOK = [['vierkant', 'rechthoek', 1], ['rechthoek', 'vierkant', 0], ['vierkant', 'ruit', 1], ['ruit', 'vierkant', 0], ['ruit', 'parallellogram', 1], ['parallellogram', 'ruit', 0], ['rechthoek', 'parallellogram', 1], ['trapezium', 'parallellogram', 0], ['parallellogram', 'trapezium', 1], ['vierkant', 'trapezium', 1]];
K({ id:'v_waar', titel:'Waar of niet waar?', niv:2, maak(R){
  const a = R.kies(IS_OOK, 2).map(([x, y, w])=>[`Een ${x} is ook een ${y}.`, w]);
  const b = R.kies(KENMERK, 3).map(([z, l])=>{ const i = R.int(0, 4); return [`Een ${VIERH[i]} ${z}`, l[i]]; });
  const lijst = R.shuffle(a.concat(b));
  return { tekst:'<p>Lees elke uitspraak over vierhoeken. Is ze waar of niet waar?</p>', fig:svg(250, 246, vierhoekPiramide(), { label:'overzicht van de vierhoeken' }),
    vragen:lijst.map(([t, w])=>({ t, soort:'keuze', keuzes:['waar', 'niet waar'], a:w ? 0 : 1 })), sol:lijst.map(([t, w])=>`${t} <b>${w ? 'waar' : 'niet waar'}</b>`).join('<br>') };
} });
/* overzicht: welke vierhoek is ook een andere vierhoek */
function vierhoekPiramide(){
  const rij_ = [['vierkant'], ['rechthoek', 'ruit'], ['parallellogram'], ['trapezium'], ['vierhoek']]; let s = '';
  rij_.forEach((r, i)=>{ const y = 8 + i * 44, w = 70 + i * 40, x = 125 - w / 2; s += rh(x, y, w, 36, { f:'var(--card)', k:'var(--accent)', w:1.5, rx:4 });
    r.forEach((n, j)=>{ s += tekst(x + w * (j + .5) / r.length, y + 18, n, { s:11.5, wt:700 }); }); if(r.length === 2) s += lijn(125, y + 4, 125, y + 32, { k:'var(--accent)', w:1.2 }); });
  return s + tekst(125, 238, 'wat boven staat, is ook alles eronder', { s:10.5, f:'var(--ink-soft)', wt:600 });
}
K({ id:'v_kenmerk', titel:'Kenmerken van een vierhoek', niv:2, maak(R){
  const i = R.int(0, 4), soort = VIERH[i]; const k = R.kies(KENMERK, 4);
  /* diagonalen tekenen */
  const W = 230, H = 170; let p = vlakPunten(R, soort).map(([x, y])=>[x * 1.7, y * 1.7]); const [mx, my] = midden(p); p = p.map(([x, y])=>[x - mx + W / 2, y - my + H / 2]);
  let s = veelhoek(p, { f:VUL, k:KL, w:2.2 }) + lijn(p[0][0], p[0][1], p[2][0], p[2][1], { k:'var(--orange)', w:1.6, d:'5 4' }) + lijn(p[1][0], p[1][1], p[3][0], p[3][1], { k:'var(--orange)', w:1.6, d:'5 4' });
  if(rechtHoekig(soort)) p.forEach((q, j)=>{ s += rhoekL(q, p[(j + 1) % 4], p[(j + 3) % 4], { s:8, g:3, k:KL }); });
  return { fig:svg(W, H, s, { label:soort }), tekst:`<p>Dit is een <b>${soort}</b> met zijn diagonalen (oranje). Klopt de uitspraak?</p>`,
    vragen:k.map(([z, l])=>({ t:`Een ${soort} ${z}`, soort:'keuze', keuzes:['ja', 'nee'], a:l[i] ? 0 : 1 })), sol:k.map(([z, l])=>`Een ${soort} ${z} <b>${l[i] ? 'ja' : 'nee'}</b>`).join('<br>') };
} });

/* ---------- ruimtefiguren ---------- */
const RUIMTE = ['kubus', 'balk', 'cilinder', 'kegel', 'bol', 'piramide'];
const GRONDVLAK = { kubus:'vierkant', balk:'rechthoek', cilinder:'cirkel', kegel:'cirkel', piramide:'vierkant', piramide5:'vijfhoek', piramide6:'zeshoek', prisma:'driehoek' };
/* schuin aanzicht (cabinet): diepte schuin naar rechtsboven; verborgen ribben in stippellijn; grondvlak gekleurd */
function ruimteFig(soort, o = {}){
  const W = o.b || 140, H = o.h || 130, k = KL, gv = o.grond ? 'var(--orange)' : VUL; const st = { k, w:2 }, ver = { k, w:1.5, d:'4 3' };
  let s = '';
  if(soort === 'kubus' || soort === 'balk'){
    const w = soort === 'kubus' ? 62 : 84, h = soort === 'kubus' ? 62 : 46, d = soort === 'kubus' ? 30 : 26, x = (W - w - d) / 2, y = (H + h - d) / 2 + d / 2 + 4;
    const A = [x, y], B = [x + w, y], C = [x + w, y - h], D = [x, y - h], dx = d, dy = -d * .75;
    const sh = q=>[q[0] + dx, q[1] + dy];
    s += veelhoek([A, B, sh(B), sh(A)], { f:gv, k:'none' });
    s += veelhoek([A, B, C, D], { f:'none', k }) + veelhoek([B, sh(B), sh(C), C], { f:'none', k }) + veelhoek([D, C, sh(C), sh(D)], { f:'none', k });
    s += lijn(...A, ...sh(A), ver) + lijn(...sh(A), ...sh(B), ver) + lijn(...sh(A), ...sh(D), ver);
  } else if(soort === 'cilinder'){
    const cx = W / 2, rx = 36, ry = 11, top = 24, bot = H - 22;
    s += `<ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="${gv}" stroke="none"/>`;
    s += pad(`M${cx - rx} ${bot} A${rx} ${ry} 0 0 0 ${cx + rx} ${bot}`, st) + pad(`M${cx - rx} ${bot} A${rx} ${ry} 0 0 1 ${cx + rx} ${bot}`, ver);
    s += `<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="none" stroke="${k}" stroke-width="2"/>` + lijn(cx - rx, top, cx - rx, bot, st) + lijn(cx + rx, top, cx + rx, bot, st);
  } else if(soort === 'kegel'){
    const cx = W / 2, rx = 42, ry = 12, bot = H - 22, top = 14;
    s += `<ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="${gv}" stroke="none"/>`;
    s += pad(`M${cx - rx} ${bot} A${rx} ${ry} 0 0 0 ${cx + rx} ${bot}`, st) + pad(`M${cx - rx} ${bot} A${rx} ${ry} 0 0 1 ${cx + rx} ${bot}`, ver) + lijn(cx - rx, bot, cx, top, st) + lijn(cx + rx, bot, cx, top, st);
  } else if(soort === 'bol'){
    const cx = W / 2, cy = H / 2, r = 46; s += cirkel(cx, cy, r, { f:VUL, k, w:2 }) + pad(`M${cx - r} ${cy} A${r} ${r * .3} 0 0 0 ${cx + r} ${cy}`, { k, w:1.5 }) + pad(`M${cx - r} ${cy} A${r} ${r * .3} 0 0 1 ${cx + r} ${cy}`, ver);
  } else if(soort.startsWith('piramide')){
    const n = soort === 'piramide5' ? 5 : soort === 'piramide6' ? 6 : 4; const cx = W / 2, cy = H - 34, rx = 44, ry = 14;
    const basis = rij(n, i=>{ const a = Math.PI / 2 + (i + (n === 4 ? .5 : 0)) * 2 * Math.PI / n; return [rnd(cx + rx * Math.cos(a), 2), rnd(cy + ry * Math.sin(a), 2)]; });
    const top = [cx, 12];
    s += veelhoek(basis, { f:gv, k:'none' });
    basis.forEach((p, i)=>{ const q = basis[(i + 1) % n]; const achter = (p[1] + q[1]) / 2 < cy - 1; s += lijn(...p, ...q, achter ? ver : st); });
    basis.forEach(p=>{ const achter = p[1] < cy - ry * .6 && Math.abs(p[0] - cx) < rx * .7; s += lijn(...p, ...top, achter ? ver : st); });
  }
  if(o.nr) s += tekst(10, 12, o.nr, { s:13 });
  return svg(W, H, s, { label:o.label || 'ruimtefiguur' });
}
K({ id:'r_naam', titel:'Welke ruimtefiguur is het?', niv:1, maak(R){
  const s = R.kies(RUIMTE, 4);
  return { tekst:'<p>Ruimtefiguren zijn niet plat: ze zijn 3D. Stippellijnen zijn ribben die je niet ziet.</p>', q2:true,
    vragen:s.map((x, i)=>({ t:ruimteFig(x, { nr:i + 1, b:130, h:120 }), soort:'keuze', keuzes:RUIMTE, a:RUIMTE.indexOf(x) })), sol:s.map((x, i)=>`${i + 1}: ${x}`).join('<br>') };
} });
K({ id:'r_grondvlak', titel:'Grondvlak en naam', niv:2, maak(R){
  const s = R.kies(['kubus', 'balk', 'cilinder', 'kegel', 'piramide', 'piramide5', 'piramide6'], 3);
  const naam = x=>x.startsWith('piramide') ? 'piramide' : x;
  const vorm = ['vierkant', 'rechthoek', 'cirkel', 'driehoek', 'vijfhoek', 'zeshoek'];
  return { tekst:'<p>Het <b>grondvlak</b> is het vlak aan de onderkant (oranje). Noteer de naam van de ruimtefiguur en de vorm van het grondvlak.</p>',
    fig:`<div class="figraster">${s.map((x, i)=>ruimteFig(x, { nr:i + 1, grond:true, b:120, h:115 })).join('')}</div>`, breed:true, q2:true,
    vragen:s.flatMap((x, i)=>[{ t:`Figuur ${i + 1}: naam`, soort:'keuze', keuzes:RUIMTE.filter(r=>r !== 'bol'), a:RUIMTE.filter(r=>r !== 'bol').indexOf(naam(x)) }, { t:`Figuur ${i + 1}: vorm grondvlak`, soort:'keuze', keuzes:vorm, a:vorm.indexOf(GRONDVLAK[x]) }]),
    sol:s.map((x, i)=>`${i + 1}: ${naam(x)}, grondvlak ${GRONDVLAK[x]}`).join('<br>') };
} });
/* bouwplaten (ontwikkelingen) */
function bouwplaat(soort, R){
  const c = 22, k = KL; let s = '', W = 160, H = 130;
  const vk = (x, y, w = c, h = c)=>rh(x, y, w, h, { f:VUL, k, w:1.6 });
  if(soort === 'kubus'){ const net = R.pick([[[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]], [[2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]]]); net.forEach(([x, y])=>{ s += vk(14 + x * c, 22 + y * c); }); }
  else if(soort === 'balk'){ const a = 30, b = 16; /* kruis met rechthoeken */ s += vk(14 + b, 10, a, b) + vk(14, 10 + b, b, c * 1.6) + vk(14 + b, 10 + b, a, c * 1.6) + vk(14 + b + a, 10 + b, b, c * 1.6) + vk(14 + 2 * b + a, 10 + b, a, c * 1.6) + vk(14 + b, 10 + b + c * 1.6, a, b); }
  else if(soort === 'cilinder'){ s += vk(30, 38, 80, 46) + cirkel(55, 25, 13, { f:VUL, k, w:1.6 }) + cirkel(80, 97, 13, { f:VUL, k, w:1.6 }); }
  else if(soort === 'kegel'){ /* cirkelsector met middelpunt in de top; het grondvlak raakt de boog juist */
    const top = [80, 8], Rs = 72, a = 34 * Math.PI / 180, rc = 13, p1 = [rnd(top[0] - Rs * Math.sin(a), 2), rnd(top[1] + Rs * Math.cos(a), 2)], p2 = [rnd(top[0] + Rs * Math.sin(a), 2), p1[1]];
    s += pad(`M${top[0]} ${top[1]} L${p1[0]} ${p1[1]} A${Rs} ${Rs} 0 0 0 ${p2[0]} ${p2[1]} Z`, { f:VUL, k, w:1.6 }) + cirkel(top[0], top[1] + Rs + rc, rc, { f:VUL, k, w:1.6 }); H = top[1] + Rs + 2 * rc + 6; }
  else if(soort === 'piramide'){ const x = 60, y = 45, w = 34; s += vk(x, y, w, w) + veelhoek([[x, y], [x + w, y], [x + w / 2, y - 30]], { f:VUL, k, w:1.6 }) + veelhoek([[x, y + w], [x + w, y + w], [x + w / 2, y + w + 30]], { f:VUL, k, w:1.6 }) + veelhoek([[x, y], [x, y + w], [x - 30, y + w / 2]], { f:VUL, k, w:1.6 }) + veelhoek([[x + w, y], [x + w, y + w], [x + w + 30, y + w / 2]], { f:VUL, k, w:1.6 }); }
  return svg(W, H, s, { label:'bouwplaat' });
}
K({ id:'r_bouwplaat', titel:'Van welke figuur is de bouwplaat?', niv:2, maak(R){
  const s = R.kies(['kubus', 'balk', 'cilinder', 'kegel', 'piramide'], 3); const k = ['kubus', 'balk', 'cilinder', 'kegel', 'piramide'];
  return { tekst:'<p>Als je de bouwplaat uitknipt en plooit, krijg je een ruimtefiguur. Een bouwplaat heet ook de <b>ontwikkeling</b> van de figuur.</p>', q3:true,
    vragen:s.map(x=>({ t:bouwplaat(x, R), soort:'keuze', kol:true, keuzes:k, a:k.indexOf(x) })), sol:s.join(', ') };
} });
/* bovenaanzicht van een ruimtefiguur */
const BOVEN = { cilinder:'cirkel', bol:'cirkel', kegel:'cirkel met punt', piramide:'vierkant met diagonalen', kubus:'vierkant', balk:'rechthoek' };
function bovenTekening(n){
  const k = KL; let s = '';
  if(n === 'cirkel') s = cirkel(35, 35, 24, { f:VUL, k, w:2 });
  else if(n === 'cirkel met punt') s = cirkel(35, 35, 24, { f:VUL, k, w:2 }) + cirkel(35, 35, 2.5, { f:k, k });
  else if(n === 'vierkant met diagonalen') s = rh(12, 12, 46, 46, { f:VUL, k, w:2 }) + lijn(12, 12, 58, 58, { k, w:1.6 }) + lijn(58, 12, 12, 58, { k, w:1.6 });
  else if(n === 'vierkant') s = rh(12, 12, 46, 46, { f:VUL, k, w:2 });
  else if(n === 'rechthoek') s = rh(6, 20, 58, 30, { f:VUL, k, w:2 });
  else if(n === 'driehoek') s = veelhoek([[35, 10], [60, 58], [10, 58]], { f:VUL, k, w:2 });
  return svg(70, 70, s, { label:n, b:56 });
}
K({ id:'r_boven', titel:'Wat zie je van bovenaf?', niv:2, maak(R){
  const s = R.shuffle(R.pick([['cilinder', 'kegel', 'piramide'], ['kegel', 'balk', 'piramide'], ['cilinder', 'piramide', 'balk'], ['kegel', 'kubus', 'balk']]));
  const opties = R.shuffle(['cirkel', 'cirkel met punt', 'vierkant met diagonalen', 'rechthoek', 'driehoek'].concat(s.includes('kubus') ? ['vierkant'] : []));
  return { tekst:'<p>Je kijkt recht van boven op de figuur. Welk <b>bovenaanzicht</b> zie je?</p>', q3:true,
    vragen:s.map((x, i)=>({ t:ruimteFig(x, { nr:i + 1, b:120, h:110 }), soort:'keuze', keuzes:opties.map(bovenTekening), a:opties.indexOf(BOVEN[x]) })),
    sol:s.map((x, i)=>`${i + 1}: ${x} → ${BOVEN[x]}`).join('<br>') };
} });

/* ---------- aanzichten van bouwsels (draaibaar) ---------- */
/* h[z][x] = aantal blokjes op plaats (x, z); z = 0 is vooraan */
function bouwsel(R, n, min, max){
  for(let p = 0; p < 500; p++){
    const cel = polyominoM(R, R.int(3, Math.min(5, max - 1)), n, n);
    const h = rij(n, ()=>rij(n, ()=>0)); cel.forEach(([x, z])=>{ h[z][x] = 1; });
    let tot = cel.length; while(tot < min){ const [x, z] = R.pick(cel); if(h[z][x] < 3){ h[z][x]++; tot++; } }
    while(tot < max && R.kans(.4)){ const [x, z] = R.pick(cel); if(h[z][x] < 3){ h[z][x]++; tot++; } }
    const v = aanzichten(h); if(new Set([v.V, v.B, v.R].map(cellenKey)).size === 3) return h;
  }
  return [[1, 1, 0], [1, 0, 0], [0, 0, 0]];
}
function polyominoM(R, k, kol, rijen){ const S = new Set([`${R.int(0, kol - 1)},0`]); let p = 0; while(S.size < k && p < 1000){ p++; const [x, y] = R.pick([...S]).split(',').map(Number); const [dx, dy] = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); const nx = x + dx, ny = y + dy; if(nx >= 0 && ny >= 0 && nx < kol && ny < rijen) S.add(`${nx},${ny}`); } return [...S].map(s=>s.split(',').map(Number)); }
const cellenKey = c => c.map(p=>p.join(',')).sort().join(';');
/* aanzicht als lijst van [kolom, rij] (rij 0 = onderaan / vooraan) */
function aanzichten(h){
  const n = h.length, V = [], B = [], Rr = [];
  for(let x = 0; x < n; x++){ const m = Math.max(...h.map(r=>r[x])); for(let y = 0; y < m; y++) V.push([x, y]); }
  for(let z = 0; z < n; z++) for(let x = 0; x < n; x++) if(h[z][x]) B.push([x, z]);
  /* van rechts: vooraan (z = 0) staat links */
  for(let z = 0; z < n; z++){ const m = Math.max(...h[z]); for(let y = 0; y < m; y++) Rr.push([z, y]); }
  const norm_ = c=>{ if(!c.length) return c; const mx = Math.min(...c.map(p=>p[0])), my = Math.min(...c.map(p=>p[1])); return c.map(([a, b])=>[a - mx, b - my]); };
  return { V:norm_(V), B:norm_(B), R:norm_(Rr) };
}
function aanzichtFig(c, o = {}){
  const s = o.cel || 18, W = Math.max(...c.map(p=>p[0])) + 1, H = Math.max(...c.map(p=>p[1])) + 1;
  const inner = c.map(([x, y])=>rh(4 + x * s, 4 + (H - 1 - y) * s, s, s, { f:'var(--or-soft, #fff4dc)', k:KL, w:1.6 })).join('');
  return svg(W * s + 8, H * s + 8, inner, { label:'aanzicht', b:W * s + 8 });
}
const spiegel = c => { const m = Math.max(...c.map(p=>p[0])); return c.map(([x, y])=>[m - x, y]); };
const kantel = c => { const m = Math.max(...c.map(p=>p[1])); return c.map(([x, y])=>[x, m - y]); };
const transp = c => c.map(([x, y])=>[y, x]);
/* bouwsel tekenen in schuin aanzicht, gedraaid over r x 90° */
function draaiH(h, r){ let g = h.map(rw=>rw.slice()); const n = g.length; for(let i = 0; i < r; i++){ const ng = rij(n, ()=>rij(n, ()=>0)); for(let z = 0; z < n; z++) for(let x = 0; x < n; x++) ng[x][n - 1 - z] = g[z][x]; g = ng; } return g; }
function bouwselSvg(h, r){
  const g = draaiH(h, r), n = g.length, a = 38, dx = a * .55, dy = a * .42;
  const W = n * a + n * dx + 30, Hh = 3 * a + n * dy + 46;
  const ox = 14, oy = Hh - 28;
  const P = (x, y, z)=>[rnd(ox + x * a + z * dx, 2), rnd(oy - y * a - z * dy, 2)];
  let s = '';
  for(let z = n - 1; z >= 0; z--) for(let y = 0; y < 3; y++) for(let x = 0; x < n; x++){
    if(g[z][x] <= y) continue;
    const f = [P(x, y, z), P(x + 1, y, z), P(x + 1, y + 1, z), P(x, y + 1, z)];
    const t = [P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)];
    const rr = [P(x + 1, y, z), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z)];
    s += veelhoek(rr, { f:'#4fb3d9', k:'#21516a', w:1.3 }) + veelhoek(t, { f:'#e2574c', k:'#6e211b', w:1.3 }) + veelhoek(f, { f:'#f6c945', k:'#7a5d0c', w:1.3 });
  }
  /* waar is de oorspronkelijke voorkant? */
  const kant = [[n / 2, -.15], [n + .15, n / 2], [n / 2, n + .15], [-.15, n / 2]][r % 4];
  const [qx, qy] = P(kant[0], 0, kant[1]); const pijl = r % 4 === 0 ? 'vooraan' : 'vooraan';
  s += `<circle cx="${qx}" cy="${qy + 2}" r="9" fill="var(--orange)"/><text x="${qx}" y="${qy + 2.5}" font-size="10" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#2b1b00">V</text>`;
  return svg(W, Hh, s, { label:'bouwsel van blokjes', b:Math.min(W, 320) });
}
function bouwselBlok(h){
  const id = 'bs' + Math.floor(Math.random() * 1e9);
  return { html:`<div class="bouwsel" id="${id}"><div class="bs-fig">${bouwselSvg(h, 0)}</div><div class="bs-knop"><button type="button" class="btn ghost klein" data-d="-1">↺ draai</button><button type="button" class="btn ghost klein" data-d="1">draai ↻</button></div><p class="klein">Het oranje bolletje <b>V</b> staat aan de voorkant.</p></div>`,
    mount(card){ const b = card.querySelector('.bouwsel'); if(!b) return; let r = 0; b.querySelectorAll('[data-d]').forEach(k=>k.addEventListener('click', ()=>{ r = (r + (+k.dataset.d) + 4) % 4; b.querySelector('.bs-fig').innerHTML = bouwselSvg(h, r); })); } };
}
function aanzichtKaart(R, min, max){
  const h = bouwsel(R, 3, min, max); const v = aanzichten(h); const tot = som(h.flat());
  /* vijf verschillende aanzichten: V, B, R en twee lokfiguren */
  const kand = [v.V, v.B, v.R, spiegel(v.V), spiegel(v.R), kantel(v.B), transp(v.B), spiegel(v.B)]; const lijst = [];
  kand.forEach(c=>{ if(lijst.length < 5 && !lijst.some(x=>cellenKey(x) === cellenKey(c))) lijst.push(c); });
  const extra = [[[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [0, 1], [1, 0], [2, 0]]];
  extra.forEach(c=>{ if(lijst.length < 5 && !lijst.some(x=>cellenKey(x) === cellenKey(c))) lijst.push(c); });
  const volg = R.shuffle(rij(lijst.length, i=>i)); const fig = volg.map(i=>lijst[i]);
  const keuzes = fig.map((c, i)=>String(i + 1));
  const figs = `<div class="az-rij">${fig.map((c, i)=>`<span class="az">${aanzichtFig(c, { cel:20 })}<b>${i + 1}</b></span>`).join('')}</div>`;
  const nr = c=>fig.findIndex(x=>cellenKey(x) === cellenKey(c));
  const B = bouwselBlok(h);
  return { fig:B.html, mount:B.mount, tekst:'<p>Draai het bouwsel met de knoppen. Zo zie je ook de blokjes achteraan.</p>' + figs, vragen:[
    { t:'Hoeveel blokjes liggen er?', a:tot, na:'blokjes', hint:[{ t:'Tel per stapel hoeveel blokjes erop liggen. Hoeveel stapels zijn er?', a:h.flat().filter(x=>x).length }] },
    { t:'Welke figuur is het <b>vooraanzicht</b>?', soort:'keuze', keuzes, a:nr(v.V) },
    { t:'Welke figuur is het <b>bovenaanzicht</b>?', soort:'keuze', keuzes, a:nr(v.B) },
    { t:'Welke figuur is het <b>rechterzijaanzicht</b>?', soort:'keuze', keuzes, a:nr(v.R) }
  ], sol:`Er liggen <b>${tot}</b> blokjes. Vooraanzicht: figuur ${nr(v.V) + 1}. Bovenaanzicht: figuur ${nr(v.B) + 1}. Rechterzijaanzicht: figuur ${nr(v.R) + 1}.` };
}
K({ id:'z_bouw1', titel:'Aanzichten van een bouwsel', niv:1, maak(R){ return aanzichtKaart(R, 4, 6); } });
K({ id:'z_bouw2', titel:'Aanzichten van een groter bouwsel', niv:2, maak(R){ return aanzichtKaart(R, 6, 9); } });

/* ---------- verdieping: figuren in een assenstelsel ---------- */
K({ id:'v_parallel', titel:'Het vierde punt van een parallellogram', niv:3, maak(R){
  let A, B, D, C; for(let p = 0; p < 300; p++){ A = { n:'A', x:R.int(-4, 0), y:R.int(0, 4) }; B = { n:'B', x:A.x + R.int(3, 6), y:A.y }; D = { n:'D', x:A.x + R.int(-2, 3), y:A.y - R.int(3, 5) }; C = { n:'C', x:B.x + D.x - A.x, y:D.y };
    if([A, B, C, D].every(q=>Math.abs(q.x) <= 5 && Math.abs(q.y) <= 5) && (A.x + C.x) % 2 === 0 && (A.y + C.y) % 2 === 0) break; }
  const S = { n:'S', x:(A.x + C.x) / 2, y:(A.y + C.y) / 2 };
  const Fig = assenstelsel({ min:-5, max:5, cel:28, punten:[A, B, D] });
  return { fig:Fig.html, tekst:`<p>ABCD is een <b>parallellogram</b>. Je kent ${coord('A', A.x, A.y)}, ${coord('B', B.x, B.y)} en ${coord('D', D.x, D.y)}.</p>`, vragen:[
    coordVraag(C, { t:'Wat zijn de coördinaten van C? C(' }), Object.assign(coordVraag(S, { t:'De diagonalen snijden elkaar in het punt (' }), { na:')' })
  ].map(v=>Object.assign(v, { na:')' })), sol:`C ligt even ver van D als B van A: <b>${coord('C', C.x, C.y)}</b>. De diagonalen AC en BD snijden elkaar in het midden: <b>(${minN(S.x)},${minN(S.y)})</b>.` };
} });
K({ id:'v_teken', titel:'Teken en benoem de vierhoek', niv:3, maak(R){
  const [naam, f] = R.pick(FIG); const hk = f(R); const pts = hk.map(([x, y], i)=>({ n:PUNT_N[i], x, y }));
  const namen = ['rechthoek', 'vierkant', 'parallellogram', 'ruit', 'trapezium'];
  return { tekst:`<p>Zet de punten ${pts.map(p=>coord(p.n, p.x, p.y)).join(', ')} in het assenstelsel. Ze worden in alfabetische volgorde verbonden, en ${pts[3].n} met ${pts[0].n}.</p>`,
    vragen:[puntenZetten(pts, { lijnen:pos=>{ const l = []; for(let i = 0; i < 4; i++){ const a = pts[i].n, b = pts[(i + 1) % 4].n; if(pos[a] && pos[b]) l.push([pos[a][0], pos[a][1], pos[b][0], pos[b][1], 'var(--orange)']); } return l; } }), { t:'Welke figuur heb je getekend?', soort:'keuze', keuzes:namen, a:namen.indexOf(naam) }],
    sol:`De punten vormen een <b>${naam}</b>.` };
} });

/* ---------- puzzels: evenwicht en sudoku met figuren ---------- */
const VORMEN = {
  bol:(x, y, k)=>cirkel(x, y, 11, { f:k, k:'none' }), ster:(x, y, k)=>veelhoek(rij(10, i=>{ const r = i % 2 ? 5 : 12, a = -Math.PI / 2 + i * Math.PI / 5; return [rnd(x + r * Math.cos(a), 2), rnd(y + r * Math.sin(a), 2)]; }), { f:k, k:'none' }),
  drie:(x, y, k)=>veelhoek([[x, y - 12], [x + 12, y + 10], [x - 12, y + 10]], { f:k, k:'none' }), vk:(x, y, k)=>rh(x - 10, y - 10, 20, 20, { f:k, k:'none' }),
  ruit:(x, y, k)=>veelhoek([[x, y - 12], [x + 9, y], [x, y + 12], [x - 9, y]], { f:k, k:'none' }), zes:(x, y, k)=>veelhoek(rij(6, i=>[rnd(x + 11 * Math.cos(i * Math.PI / 3), 2), rnd(y + 11 * Math.sin(i * Math.PI / 3), 2)]), { f:k, k:'none' })
};
const VKLEUR = { bol:'#5bc0eb', ster:'#c04c9a', drie:'#8bc34a', vk:'#3f6fd1', ruit:'#e05a9b', zes:'#fcaf17' };
const VNAAM = { bol:'bol', ster:'ster', drie:'driehoek', vk:'vierkant', ruit:'ruit', zes:'zeshoek' };
function mobileSvg(T, links, rechts){
  const W = 200, H = 60 + 30 * Math.max(links.length, rechts.length); let s = rh(80, 4, 40, 26, { f:'var(--card)', k:KL, w:1.6 }) + tekst(100, 17, T, { s:14 });
  s += lijn(100, 30, 100, 42, { k:'var(--ink)', w:1.4 }) + lijn(50, 42, 150, 42, { k:'var(--ink)', w:2 }) + lijn(50, 42, 50, 54, { k:'var(--ink)', w:1.4 }) + lijn(150, 42, 150, 54, { k:'var(--ink)', w:1.4 });
  links.forEach((v, i)=>{ s += VORMEN[v](50, 66 + i * 30, VKLEUR[v]); }); rechts.forEach((v, i)=>{ s += VORMEN[v](150, 66 + i * 30, VKLEUR[v]); });
  return svg(W, H, s, { label:'evenwicht', b:190 });
}
const vormIc = v => svg(26, 26, VORMEN[v](13, 13, VKLEUR[v]), { b:22, label:VNAAM[v] });
K({ id:'pz_evenwicht', titel:'Evenwicht', niv:2, maak(R){
  const [a, b, c] = R.kies(Object.keys(VORMEN), 3); const sjabloon = R.int(0, 2); let T, L, Rr, gegeven = null; const w = {};
  if(sjabloon === 0){ w[a] = R.int(2, 9); w[b] = 2 * w[a]; L = [a, a]; Rr = [b]; }
  else if(sjabloon === 1){ w[a] = R.int(2, 6); w[b] = R.int(2, 9); w[c] = 2 * w[a] + w[b]; L = [a, a, b, b]; Rr = [c, b]; gegeven = b; }
  else { w[b] = R.int(2, 5); w[c] = w[b] + R.int(1, 4); w[a] = 4 * w[c] - 3 * w[b]; L = [a, b, b, b]; Rr = [c, c, c, c]; gegeven = a; }
  T = som(L.map(v=>w[v])) * 2;
  const vr = [...new Set(L.concat(Rr))].filter(v=>v !== gegeven);
  return { fig:mobileSvg(T, L, Rr), tekst:`<p>Het hangt in evenwicht: links weegt even veel als rechts. Samen wegen ze <b>${T}</b>.${gegeven ? ` Je weet: ${vormIc(gegeven)} = ${w[gegeven]}.` : ''}</p><p>Wat is de waarde van de figuren?</p>`,
    vragen:[0, 1].map(i=>vr[i] ? { t:`${vormIc(vr[i])} ${VNAAM[vr[i]]} =`, a:w[vr[i]] } : { t:'Hoeveel weegt elke kant?', a:T / 2 }),
    sol:`Elke kant weegt ${T} : 2 = ${T / 2}. ` + vr.map(v=>`${VNAAM[v]} = ${w[v]}`).join(', ') };
} });
function sudokuFig(R){
  const vormen = R.kies(['bol', 'ster', 'drie', 'vk', 'ruit', 'zes'], 4);
  /* geldige 4x4 met blokken van 2x2 */
  const basis = [[0, 1, 2, 3], [2, 3, 0, 1], [1, 0, 3, 2], [3, 2, 1, 0]];
  const pr = R.shuffle([0, 1]).flatMap(b=>R.shuffle([0, 1]).map(i=>b * 2 + i)), pc = R.shuffle([0, 1]).flatMap(b=>R.shuffle([0, 1]).map(i=>b * 2 + i)), pv = R.shuffle([0, 1, 2, 3]);
  const opl = pr.map(r=>pc.map(c=>pv[basis[r][c]]));
  let g; do{ g = opl.map(r=>r.slice()); R.kies(rij(16, i=>i), 9).forEach(i=>{ g[Math.floor(i / 4)][i % 4] = -1; }); } while(!uniek4(g));
  return { opl, g, vormen };
}
function uniek4(g){ let tel = 0; const G = g.map(r=>r.slice());
  const kan = (r, c, v)=>{ for(let i = 0; i < 4; i++) if(G[r][i] === v || G[i][c] === v) return false; const a = r - r % 2, b = c - c % 2; for(let i = a; i < a + 2; i++) for(let j = b; j < b + 2; j++) if(G[i][j] === v) return false; return true; };
  const z = ()=>{ for(let r = 0; r < 4; r++) for(let c = 0; c < 4; c++) if(G[r][c] < 0){ for(let v = 0; v < 4; v++) if(kan(r, c, v)){ G[r][c] = v; z(); G[r][c] = -1; if(tel > 1) return; } return; } tel++; };
  z(); return tel === 1; }
K({ id:'pz_sudfig', titel:'Sudoku met figuren', niv:1, maak(R){
  const S = sudokuFig(R);
  return { tekst:'<p>In elk <b>vetgedrukt vierkant</b>, elke <b>rij</b> en elke <b>kolom</b> staan de 4 figuren juist één keer. Klik op een leeg vakje om een figuur te kiezen (nog eens klikken = volgende figuur).</p>',
    vragen:[{ soort:'eigen', blok:true, voorbeeld:S.opl.map(r=>r.slice()), toonA:'zie oplossing', eigen:{ tekst:'',
      maak(box, val, zet){
        const cur = Array.isArray(val) ? val.map(r=>r.slice()) : S.g.map(r=>r.slice());
        const t = el('table', 'sudoku s4 sfig e-rand');
        for(let r = 0; r < 4; r++){ const tr = el('tr'); for(let c = 0; c < 4; c++){ const td = el('td'); if(c === 1) td.classList.add('br'); if(r === 1) td.classList.add('bb');
          const teken = ()=>{ td.innerHTML = cur[r][c] >= 0 ? svg(30, 30, VORMEN[S.vormen[cur[r][c]]](15, 15, VKLEUR[S.vormen[cur[r][c]]]), { b:28, label:VNAAM[S.vormen[cur[r][c]]] }) : ''; };
          if(S.g[r][c] >= 0){ td.classList.add('vast'); teken(); }
          else { td.classList.add('klik'); td.tabIndex = 0; td.setAttribute('role', 'button'); td.setAttribute('aria-label', `rij ${r + 1} kolom ${c + 1}`); teken();
            const volg = ()=>{ if(box.dataset.dicht) return; cur[r][c] = cur[r][c] >= 3 ? -1 : cur[r][c] + 1; zet(cur.map(x=>x.slice())); box.classList.remove('e-ok', 'e-bad'); teken(); };
            td.addEventListener('click', volg); td.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); volg(); } }); }
          tr.append(td); } t.append(tr); }
        box.append(t);
      },
      check(val){ if(!Array.isArray(val)) return false; const g = val.map(r=>r.map(x=>x + 1)); return g.every(r=>r.every(x=>x >= 1)) && sudokuOk4(g) && S.g.every((r, i)=>r.every((x, j)=>x < 0 || x === val[i][j])); } },
      uitleg:'Kijk na: staat elke figuur juist één keer in elke rij, kolom en elk vetgedrukt vierkant?' }],
    sol:'<table class="sudoku s4">' + S.opl.map(r=>'<tr>' + r.map(v=>`<td>${svg(30, 30, VORMEN[S.vormen[v]](15, 15, VKLEUR[S.vormen[v]]), { b:24 })}</td>`).join('') + '</tr>').join('') + '</table>' };
} });
const sudokuOk4 = g => { for(let i = 0; i < 4; i++){ if(new Set(g[i]).size !== 4 || new Set(g.map(r=>r[i])).size !== 4) return false; } for(const a of [0, 2]) for(const b of [0, 2]){ const s = new Set([g[a][b], g[a][b + 1], g[a + 1][b], g[a + 1][b + 1]]); if(s.size !== 4) return false; } return true; };

/* ---------- MODULE 4: onderdelen, proeftoets en snelle quiz ----------
   Nieuwe kaarten altijd achteraan een onderdeel toevoegen; kaart-id's nooit hernoemen (opslagsleutel en vraag-id). */
const SECS = [
  { id:'vlak', nav:'Vlakke figuren', title:'Vlakke figuren', ic:'vlak', tip:'Vlakke figuren zijn plat (2D). Een <b>veelhoek</b> is begrensd door lijnstukken. Een rechte hoek duiden we aan met een kleine L.', kaarten:['v_naam', 'v_veelhoek', 'v_waar', 'v_kenmerk'], verd:['v_parallel', 'v_teken'] },
  { id:'ruimte', nav:'Ruimtefiguren', title:'Ruimtefiguren', ic:'ruimte', tip:'Ruimtefiguren zijn niet plat (3D): kubus, balk, cilinder, kegel, bol en piramide.', kaarten:['r_naam', 'r_grondvlak', 'r_bouwplaat', 'r_boven'] },
  { id:'aanzicht', nav:'Aanzichten', title:'Ruimtelijk inzicht: aanzichten', ic:'blok', tip:'Het <b>vooraanzicht</b> zie je van voren, het <b>bovenaanzicht</b> van boven en het <b>rechterzijaanzicht</b> van rechts. Draai het bouwsel om alle blokjes te zien.', kaarten:['z_bouw1', 'z_bouw2'] },
  { id:'puzzels', nav:'Puzzels', title:'Puzzels', ic:'puzzel', telt:false, tip:'Puzzels om je hersenen te trainen. Ze tellen niet mee voor je resultaten.', kaarten:['pz_evenwicht', 'pz_sudfig'] },
  { id:'quiz', nav:'Snelle quiz', title:'Snelle quiz', ic:'quiz', soort:'quiz', telt:false },
  { id:'toets', nav:'Proeftoets', title:'Proeftoets figuren', ic:'toets', soort:'toets', sepBefore:true, tip:'De laatste vraag is verdieping.' }
];
const TOETS = { titel:'Proeftoets figuren', kaarten:['v_naam', 'r_bouwplaat', 'z_bouw1', 'r_grondvlak', 'r_boven', 'v_waar', 'v_parallel'] };
const QUIZ = [
  ()=>({ t:'Hoeveel zijden heeft een zeshoek?', a:6 }),
  ()=>({ t:'Hoeveel rechte hoeken heeft een rechthoek?', a:4 }),
  R=>{ const f = R.pick([['kubus', 6], ['balk', 6], ['piramide met een vierkant grondvlak', 5]]); return { t:`Hoeveel vlakken heeft een ${f[0]}?`, a:f[1] }; },
  ()=>({ t:'Welke vorm heeft het grondvlak van een cilinder?', a:['cirkel', 'een cirkel'], soort:'tekst' }),
  ()=>({ t:'Een vierhoek met 4 gelijke zijden en 4 rechte hoeken is een …', a:['vierkant', 'een vierkant'], soort:'tekst' }),
  ()=>({ t:'Een vierhoek met 4 gelijke zijden zonder rechte hoeken is een …', a:['ruit', 'een ruit'], soort:'tekst' }),
  ()=>({ t:'Hoeveel paar evenwijdige zijden heeft een parallellogram?', a:2 }),
  ()=>({ t:'Hoeveel ribben heeft een kubus?', a:12 }),
  ()=>({ t:'Hoeveel hoekpunten heeft een kubus?', a:8 }),
  ()=>({ t:'Welke ruimtefiguur heeft geen enkel plat vlak?', a:['bol', 'een bol', 'de bol'], soort:'tekst' }),
  ()=>({ t:'Hoeveel zijden heeft een vijfhoek?', a:5 })
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
