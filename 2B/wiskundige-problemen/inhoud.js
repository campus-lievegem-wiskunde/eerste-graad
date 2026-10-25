/* Wiskundige problemen 2B: inhoud.js (gemaakt met build.sh, niet met de hand wijzigen) */
(function(){
'use strict';
// Kern van de vragendatabank: vraagtypes, invulvelden en het nakijken van getallen.
// Wordt gebruikt door de site en door het controlescript.
const VRAGEN = [];

// v(id, domein, niveauA, niveauB, vraag, antwoorden, uitleg, extra)
// Meerkeuze (t:'mc'): antwoorden = [juist, fout, fout, fout]
// Invulvraag (t:'num'): extra.velden, of het id staat in OMZET (dan wordt het veld afgeleid uit het juiste antwoord)
// Klikvraag (t:'klik'): extra.rooster en extra.w = {x, y}
// Sleepvraag naar vakken (t:'vak'): extra.kaartjes, extra.vakken, extra.w = [vak per kaartje]
// Rangschikvraag (t:'volg'): extra.kaartjes in de juiste volgorde
function v(id, d, a, b, q, o, u, x) {
  x = x || {};
  // bij problemen oplossen staat de rekenmachine altijd ter beschikking, zoals op de echte toets
  const r = {id:id, d:d, lv:[a, b], q:q, o:o, u:u, tip:x.tip, calc:rekenSoort(d, x.calc), fig:x.fig, t:'mc'};
  if (x.mk) { r.t = 'mk'; r.mk = x.mk; }
  if (x.velden) { r.t = 'num'; r.velden = x.velden; }
  else if (typeof OMZET !== 'undefined' && OMZET[id]) { r.t = 'num'; r.velden = OMZET[id] === 1 ? afleid(o[0]) : OMZET[id]; }
  if (x.rooster) { r.t = 'klik'; r.rooster = x.rooster; r.w = x.w; }
  if (x.kaartjes) { r.t = x.vakken ? 'vak' : 'volg'; r.kaartjes = x.kaartjes; r.vakken = x.vakken; r.w = x.w; }
  r.c = x.c;
  VRAGEN.push(r);
}

// "€ 19,50" -> [{voor:'€', w:'19.50', na:''}] ; "{{11|12}}" -> breuk ; "x = −8" -> voor 'x ='
function afleid(s) {
  const m = s.match(/^(.*?)(−?\{\{\d+\|\d+\}\}|−?\d[\d ]*(?:,\d+)?)(.*)$/);
  if (!m) throw new Error('Kan geen invulveld afleiden uit "' + s + '"');
  let w = m[2], vorm = null;
  if (w.indexOf('{{') >= 0) { const f = w.match(/(−?)\{\{(\d+)\|(\d+)\}\}/); w = (f[1] ? '-' : '') + f[2] + '/' + f[3]; vorm = 'breuk'; }
  else w = w.replace(/ /g, '').replace(',', '.').replace('−', '-');
  return [{voor:m[1].trim(), w:w, na:m[3].trim(), vorm:vorm}];
}

// Leest wat een leerling typt: 2,5 / −3 / 3/4 / 2^5 ; geeft NaN als het geen getal is
function leesGetal(s) {
  s = String(s == null ? '' : s).trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(',', '.');
  if (!s) return NaN;
  let m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  m = s.match(/^(-?\d*\.?\d+)\^(-?\d+)$/);
  if (m) return Math.pow(Number(m[1]), Number(m[2]));
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}
function ggd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
const isGeheel = s => /^-?\d+$/.test(String(s).trim().replace(/[−–]/g, '-'));

// Waarde van een ingevuld veld {vorm, a, t, n, g, e}
function invoerWaarde(iv) {
  if (iv.vorm === 'breuk') return leesGetal(iv.t) / leesGetal(iv.n);
  if (iv.vorm === 'gemengd') { const a = leesGetal(iv.a), f = leesGetal(iv.t) / leesGetal(iv.n); return (String(iv.a).trim().match(/^[−-]/) ? -1 : 1) * (Math.abs(a) + f); }
  if (iv.vorm === 'macht') return Math.pow(leesGetal(iv.g), leesGetal(iv.e));
  return leesGetal(iv.a);
}
function invoerLeeg(iv) {
  const leeg = s => !String(s == null ? '' : s).trim();
  if (iv.vorm === 'breuk') return leeg(iv.t) || leeg(iv.n);
  if (iv.vorm === 'gemengd') return leeg(iv.a) || leeg(iv.t) || leeg(iv.n);
  if (iv.vorm === 'macht') return leeg(iv.g) || leeg(iv.e);
  return leeg(iv.a);
}
// Beoordeel één veld. Geeft {juist, vormFout}
function keurVeld(veld, iv) {
  const norm = s => String(s).trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(',', '.');
  if (veld.vorm === 'macht') {
    const [g, e] = String(veld.w).split('^');
    let ig, ie;
    if (iv.vorm === 'macht') { ig = iv.g; ie = iv.e; }
    else if (iv.vorm === 'getal' && /\^/.test(iv.a)) { [ig, ie] = String(iv.a).split('^'); }
    else {
      const gelijk = isFinite(leesGetal(g)) && Math.abs(invoerWaarde(iv) - Math.pow(leesGetal(g), leesGetal(e))) < 1e-9;
      return {juist:false, vormFout:gelijk};
    }
    return {juist:norm(ig) === norm(g) && norm(ie) === norm(e), vormFout:false};
  }
  const w = leesGetal(veld.w), val = invoerWaarde(iv);
  const gelijk = isFinite(val) && Math.abs(val - w) <= 1e-9 * Math.max(1, Math.abs(w));
  if (!gelijk) return {juist:false, vormFout:false};
  if (veld.vorm === 'breuk') {
    let t, n;
    if (iv.vorm === 'breuk' || iv.vorm === 'gemengd') { t = iv.t; n = iv.n; }
    else { const m = norm(iv.a).match(/^-?(\d+)\/(\d+)$/); if (!m) return {juist:false, vormFout:true}; t = m[1]; n = m[2]; }
    if (!isGeheel(t) || !isGeheel(n) || ggd(Number(t), Number(n)) !== 1 || Math.abs(Number(n)) === 1) return {juist:false, vormFout:true};
  }
  return {juist:true, vormFout:false};
}

// Rekenmachine: 'w' = wetenschappelijk, 'e' = eenvoudig (+ − × ÷ %). Bij problemen oplossen is er altijd een rekenmachine.
function rekenSoort(d, c) {
  if (c === 'e' || c === 'w') return c;
  if (c) return 'w';
  return d === 'pro' || d === 'wpo' ? 'e' : undefined;
}

/* ---------- sjablonen: vragen met wisselende getallen ---------- */
// g(id, domein, niveauA, niveauB, maak, extra) ; maak(R) geeft {q, u, velden | o | mk | rooster+w | kaartjes, tip, calc, fig}
function g(id, d, a, b, maak, x) {
  x = x || {};
  VRAGEN.push({id:id, d:d, lv:[a, b], gen:maak, t:'gen', tip:x.tip, calc:x.calc});
}
const NAMEN = ['Lotte','Yusuf','Noor','Mats','Amira','Lucas','Elif','Wout','Hanne','Rayan','Fien','Ilias','Jana','Milan','Sara','Kobe','Ines','Ayoub','Lore','Senne','Zoë','Mohamed','Febe','Jonas','Nora','Arne','Yara','Emir','Lina','Bram'];
function maakR() {
  const R = {
    int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    stap: (a, b, s) => a + s * Math.floor(Math.random() * (Math.round((b - a) / s) + 1)),
    kies: arr => arr[Math.floor(Math.random() * arr.length)],
    naam: () => R.kies(NAMEN),
    namen: n => { const k = NAMEN.slice(); const r = []; while (r.length < n) r.push(k.splice(Math.floor(Math.random() * k.length), 1)[0]); return r; },
    schud: arr => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  };
  return R;
}
// getal in Vlaamse schrijfwijze: komma, spatie per duizendtal, minteken
function f(n, d) {
  if (d == null) d = 2;
  const m = Math.pow(10, d);
  let s = (Math.round(n * m) / m).toFixed(d);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  let [i, fr] = s.split('.'); const neg = i[0] === '-'; if (neg) i = i.slice(1);
  if (i === '0' && !fr) return '0';
  if (i.length >= 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '−' : '') + i + (fr ? ',' + fr : '');
}
function eur(n) {
  const c = Math.round(n * 100);
  if (c % 100 === 0) return '€ ' + f(c / 100, 0);
  return '€ ' + f(Math.floor(Math.abs(c) / 100) * Math.sign(c), 0) + ',' + String(Math.abs(c) % 100).padStart(2, '0');
}
const wv = n => String(+(+n).toFixed(6));
const mv = (n, een, meer) => f(n) + ' ' + (Math.abs(n) === 1 ? een : meer);
function breuk(t, n) { const k = ggd(t, n); t /= k; n /= k; return n === 1 ? String(t) : '{{' + t + '|' + n + '}}'; }
function maakVraag(sj) {
  const R = maakR(); let o = null;
  for (let i = 0; i < 200 && !o; i++) o = sj.gen(R);
  if (!o) throw new Error('Sjabloon ' + sj.id + ' gaf geen vraag');
  const q = Object.assign({id:sj.id, d:sj.d, lv:sj.lv, tip:sj.tip, calc:rekenSoort(sj.d, o.calc != null ? o.calc : sj.calc), gemaakt:true, codes:sj.codes, form:sj.form}, o);
  q.t = o.velden ? 'num' : o.mk ? 'mk' : o.jf ? 'jf' : o.sym ? 'sym' : o.venn ? 'venn' : o.cel ? 'cel' : o.rooster ? 'klik' : o.kaartjes ? (o.vakken ? 'vak' : 'volg') : 'mc';
  if (q.velden) q.velden = q.velden.map(vd => Object.assign({}, vd, {w:typeof vd.w === 'number' ? wv(vd.w) : vd.w}));
  if (!q.o) q.o = [];
  if (STROOM === 'B' && CALC_B[sj.id] !== undefined) q.calc = CALC_B[sj.id];
  if (STROOM === 'B' && FK_B[sj.id] && !q.fk) q.fk = FK_B[sj.id];
  if (STROOM === 'B' && q.calc === 'w') q.calc = 'e';
  return q;
}

// Figuren bij de vragen. De site tekent ze op basis van deze beschrijving.
const FIGS = {
  rapport: {t:'tab', titel:'Rapport wiskunde van Tibo', kop:['Onderdeel','Punten','Totaal','Behaald'],
    rijen:[['Meetkunde',18,20,'90 %'],['Getallenleer',12,16,'75 %'],['Algebra',21,'#vlek','70 %']]},
  vierkantAB: {t:'rooster2', alt:'Assenstelsel met de punten A(−3, 1) en B(2, 1).', r:{xmin:-4, xmax:4, ymin:-5, ymax:3, assen:'xy', getallen:'een', punten:[{x:-3, y:1, l:'A'}, {x:2, y:1, l:'B'}]}},
  rechthoekABC: {t:'rooster2', alt:'Assenstelsel met de punten A(1, 1), B(6, 1) en C(6, 4).', r:{xmin:0, xmax:7, ymin:0, ymax:5, assen:'xy', getallen:'alle', punten:[{x:1, y:1, l:'A'}, {x:6, y:1, l:'B'}, {x:6, y:4, l:'C'}]}},
  prijslijst: {t:'tab', titel:'Prijslijst schoolcafetaria', kop:['Product','Prijs'],
    rijen:[['Frisdrank','€ 2,00'],['Broodje','€ 3,50'],['Soep','€ 2,50'],['Stuk fruit','€ 1,00']]},
  bus: {t:'tab', titel:'Bus Lievegem – Gent', kop:['Vertrek in Lievegem','Aankomst in Gent'],
    rijen:[['7.12 uur','7.40 uur'],['7.42 uur','8.10 uur'],['8.12 uur','8.40 uur'],['8.42 uur','9.10 uur']]},
  sport: {t:'tab', titel:'Lievelingssport in klas 2A', kop:['Sport','Aantal leerlingen'],
    rijen:[['Voetbal',9],['Dans',6],['Zwemmen',5],['Tennis',3],['Andere',2]]},
  broers: {t:'tab', titel:'Broers en zussen in een klas', kop:['Aantal broers en zussen','Aantal leerlingen'],
    rijen:[[0,4],[1,10],[2,6],[3,3],[4,2]]},
  klassen: {t:'tab', titel:'Leerlingen per klas', kop:['Klas','Jongens','Meisjes'],
    rijen:[['2A',12,10],['2B',9,14],['2C',11,11]]},
  boeken: {t:'staaf', titel:'Aantal gelezen boeken', x:['Anna','Ben','Cem','Dries','Elif'], y:[4,7,2,5,7],
    min:0, max:8, stap:1, ylab:'aantal boeken'},
  temp: {t:'lijn', titel:'Temperatuur om 12 uur', x:['ma','di','wo','do','vr','za','zo'], y:[14,16,13,18,19,17,15],
    min:12, max:20, stap:1, ylab:'temperatuur in °C'},
  vervoer: {t:'taart', titel:'Hoe komen de leerlingen naar school?',
    delen:[['Fiets',45],['Bus',25],['Auto',20],['Te voet',10]]},
  venn1: {t:'venn', a:['1','2'], ab:['3'], b:['4','5'], uit:[]},
  venn2: {t:'venn', a:['a','b'], ab:['c','d'], b:['e'], uit:['f']},
  rooster: {t:'rooster', max:5, punten:[{x:3, y:2, l:'P'}]},
  lvorm: {t:'svg', vb:'0 0 320 224', alt:'Een L-vormige figuur. Gegeven zijden: onderaan 8 cm, links 6 cm, bovenaan 4 cm en rechts 3 cm.', html:
    '<polygon class="fvul" points="50,190 258,190 258,112 154,112 154,34 50,34"/>' +
    /* rechte hoeken: losse L met even lange benen, een beetje naar binnen */
    '<polyline class="frh" points="54,175 54,186 65,186"/><polyline class="frh" points="254,175 254,186 243,186"/><polyline class="frh" points="54,49 54,38 65,38"/><polyline class="frh" points="150,49 150,38 139,38"/><polyline class="frh" points="254,127 254,116 243,116"/>' +
    '<text class="ftxt" x="154" y="212" text-anchor="middle">8 cm</text>' +
    '<text class="ftxt" x="40" y="117" text-anchor="end">6 cm</text>' +
    '<text class="ftxt" x="102" y="24" text-anchor="middle">4 cm</text>' +
    '<text class="ftxt" x="268" y="156" text-anchor="start">3 cm</text>'},
  pad: {t:'svg', vb:'0 0 330 222', alt:'Een rechthoekig grasveld van 20 m op 12 m met rondom een pad van 1 m breed.', html:
    '<rect class="fpad" x="22" y="10" width="286" height="182"/>' +
    '<rect class="fvul" x="35" y="23" width="260" height="156"/>' +
    '<text class="ftxt" x="165" y="98" text-anchor="middle">grasveld</text>' +
    '<text class="ftxt" x="165" y="170" text-anchor="middle">20 m</text>' +
    '<text class="ftxt" x="286" y="106" text-anchor="end">12 m</text>' +
    '<text class="ftxt" x="165" y="212" text-anchor="middle">pad van 1 m breed rond het grasveld</text>'},
  hoek: {t:'svg', vb:'-26 0 356 204', alt:'Een rechthoek van 10 cm op 6 cm waarvan linksboven een driehoek is afgeknipt met zijden van 4 cm en 3 cm.', html:
    '<polygon class="fvul" points="126,30 270,30 270,174 30,174 30,102"/>' +
    '<path class="fstreep" d="M126,30 L30,30 L30,102"/>' +
    '<polyline class="frh" points="266,45 266,34 255,34"/><polyline class="frh" points="266,159 266,170 255,170"/><polyline class="frh" points="34,159 34,170 45,170"/><polyline class="frh" points="34,45 34,34 45,34"/>' +
    '<text class="ftxt" x="150" y="194" text-anchor="middle">10 cm</text>' +
    '<text class="ftxt" x="280" y="107" text-anchor="start">6 cm</text>' +
    '<text class="ftxt" x="78" y="22" text-anchor="middle">4 cm</text>' +
    '<text class="ftxt" x="22" y="71" text-anchor="end">3 cm</text>'},
  evenwijdig: {t:'svg', vb:'0 0 320 210', alt:'Twee evenwijdige rechten a en b, gesneden door een derde rechte. Hoek 1 ligt bij rechte a, hoek 2 ligt op dezelfde plaats bij rechte b.', html:
    '<line class="flijn" x1="30" y1="60" x2="286" y2="60"/>' +
    '<line class="flijn" x1="30" y1="150" x2="286" y2="150"/>' +
    '<line class="flijn" x1="99" y1="195" x2="183" y2="15"/>' +
    '<path class="fboog" d="M186,60 A24,24 0 0 0 172.1,38.2"/>' +
    '<path class="fboog" d="M144,150 A24,24 0 0 0 130.1,128.2"/>' +
    '<text class="ftxt" x="194" y="46" text-anchor="start">1</text>' +
    '<text class="ftxt" x="152" y="136" text-anchor="start">2</text>' +
    '<text class="ftxt" x="296" y="65" text-anchor="start">a</text>' +
    '<text class="ftxt" x="296" y="155" text-anchor="start">b</text>'}
};

// Woordenboek: moeilijke woorden uit de vragen, in eenvoudige taal uitgelegd.
const WOORDEN = [
  ['aangestoken', 'De kaars brandt vanaf dat moment.'],
  ['abonnement', 'Je betaalt een vast bedrag per maand of per jaar om iets te mogen gebruiken.'],
  ['actie', 'Een tijdelijke aanbieding in een winkel, bijvoorbeeld 3 voor de prijs van 2.'],
  ['afgerond', 'Een getal korter gemaakt tot op een bepaalde plaats, bijvoorbeeld 28,26 afgerond op een geheel getal is 28.'],
  ['afleiden', 'Iets te weten komen door na te denken over wat je al weet.'],
  ['assenstelsel', 'Een x-as en een y-as die loodrecht op elkaar staan. Daarmee geef je de plaats van een punt aan met coördinaten.'],
  ['baantje', 'Eén keer de lengte van het zwembad zwemmen.'],
  ['beeld', 'Het punt of de figuur die je krijgt na een spiegeling, verschuiving of draaiing.'],
  ['besparen', 'Minder geld uitgeven dan normaal.'],
  ['bestelwagen', 'Een kleine vrachtwagen om spullen te vervoeren.'],
  ['btw', 'Belasting die bij de prijs van een product komt. In België is dat meestal 21 %.'],
  ['bundel', 'Een vast aantal minuten of gigabytes dat in je abonnement zit.'],
  ['centrum', 'Het middelpunt. Bij een puntspiegeling is dat het punt waarrond je spiegelt.'],
  ['coördinaten', 'Twee getallen die de plaats van een punt aangeven: eerst x (links of rechts), dan y (boven of onder).'],
  ['daalt', 'Wordt lager of minder.'],
  ['deler', 'Een getal waardoor een ander getal deelbaar is. 3 is een deler van 12.'],
  ['diagonaal', 'Een lijnstuk tussen twee hoekpunten die niet naast elkaar liggen.'],
  ['diameter', 'De lengte van een rechte lijn door het middelpunt van een cirkel, van rand tot rand. Twee keer de straal.'],
  ['diepvries', 'Een toestel waarin het heel koud is, onder 0 °C.'],
  ['doorsnede', 'De elementen die in de twee verzamelingen tegelijk zitten.'],
  ['element', 'Iets wat in een verzameling zit.'],
  ['evenredig', 'Als de ene grootheid verdubbelt, verdubbelt de andere ook.'],
  ['evenwijdig', 'Twee rechten die elkaar nooit snijden.'],
  ['exponent', 'Het kleine getal rechtsboven bij een macht. Het zegt hoe vaak je het grondtal met zichzelf vermenigvuldigt.'],
  ['formule', 'Een regel met letters en getallen om iets uit te rekenen.'],
  ['frequentie', 'Hoe vaak een waarde voorkomt.'],
  ['gelijkvloers', 'De verdieping op de hoogte van de straat: verdieping 0.'],
  ['gemiddeld', 'Alle waarden opgeteld en gedeeld door het aantal waarden.'],
  ['grondtal', 'Het grote getal bij een macht. Bij 2⁵ is 2 het grondtal.'],
  ['halverwege', 'In het midden tussen het begin en het einde.'],
  ['hoogstens', 'Niet meer dan.'],
  ['inkom', 'De prijs om binnen te mogen, bijvoorbeeld in het zwembad.'],
  ['inkoopprijs', 'De prijs die de winkel zelf betaalt om iets te kopen.'],
  ['kengetal', 'Een getal dat iets vertelt over een reeks gegevens, zoals het gemiddelde, de mediaan of de modus.'],
  ['korting', 'Het bedrag dat van de prijs afgaat.'],
  ['kweker', 'Iemand die planten, bloemen of fruit laat groeien om te verkopen.'],
  ['laag', 'Een keer verf over de hele muur. Twee lagen betekent dat je de muur twee keer schildert.'],
  ['loodrecht', 'Twee rechten die een rechte hoek (90°) vormen.'],
  ['mediaan', 'De middelste waarde als je alle waarden van klein naar groot zet.'],
  ['middelloodlijn', 'De rechte die door het midden van een lijnstuk gaat en er loodrecht op staat.'],
  ['minstens', 'Niet minder dan. Het kleinste aantal dat genoeg is.'],
  ['modus', 'De waarde die het vaakst voorkomt.'],
  ['noemer', 'Het getal onder de breukstreep.'],
  ['omtrek', 'De lengte rond een figuur.'],
  ['oorsprong', 'Het punt (0, 0), waar de x-as en de y-as elkaar snijden.'],
  ['oorspronkelijk', 'Zoals het eerst was, voor er iets veranderde.'],
  ['opeenvolgend', 'Na elkaar, zonder iets over te slaan, zoals 5, 6, 7.'],
  ['oppervlakte', 'Hoe groot een vlak is. Je meet het in m², cm², …'],
  ['overbodig', 'Niet nodig.'],
  ['percentage', 'Een deel van 100. 25 % is 25 van de 100.'],
  ['piste', 'Een looppiste: een baan om rond te lopen.'],
  ['puntspiegeling', 'Een spiegeling om een punt. Het beeld ligt recht tegenover het punt, even ver van het centrum.'],
  ['rangschikken', 'In de juiste volgorde zetten.'],
  ['rechthoekszijde', 'Een van de twee zijden die de rechte hoek van een driehoek vormen.'],
  ['relatieve frequentie', 'Welk deel van alle waarnemingen een waarde is, vaak als percentage.'],
  ['rit', 'Eén keer heen rijden van de ene plaats naar de andere.'],
  ['schaal', 'Hoeveel keer kleiner iets op een kaart of plan getekend is. 1 : 200 betekent: 1 cm op het plan is 200 cm in het echt.'],
  ['sector', 'Een stuk van een cirkel, zoals een stuk taart.'],
  ['snelheid', 'Hoeveel afstand je aflegt in een bepaalde tijd, bijvoorbeeld 90 km per uur.'],
  ['solden', 'De periode waarin winkels hun producten goedkoper verkopen.'],
  ['spiegelbeeld', 'Het beeld na een spiegeling.'],
  ['startgeld', 'Een vast bedrag dat je altijd betaalt, ook voor een korte rit.'],
  ['stijgt', 'Wordt hoger of meer.'],
  ['straal', 'De afstand van het middelpunt van een cirkel tot de rand.'],
  ['teller', 'Het getal boven de breukstreep.'],
  ['totaal', 'Alles samen.'],
  ['trimester', 'Een periode van ongeveer drie maanden in het schooljaar.'],
  ['unie', 'Alle elementen die in minstens een van de twee verzamelingen zitten.'],
  ['variatiebreedte', 'Het verschil tussen de grootste en de kleinste waarde.'],
  ['vat', 'Een groot vat of ton om vloeistof in te bewaren.'],
  ['verbruikt', 'Gebruikt, zodat het op is. Een auto verbruikt benzine.'],
  ['verdieping', 'Een laag van een gebouw. Op het gelijkvloers ben je op verdieping 0.'],
  ['vereenvoudigen', 'Een breuk korter schrijven door teller en noemer door hetzelfde getal te delen.'],
  ['verhouding', 'Hoe twee hoeveelheden zich tot elkaar verhouden, bijvoorbeeld 1 op 3.'],
  ['vermeerderd', 'Er komt iets bij.'],
  ['verminderd', 'Er gaat iets af.'],
  ['verschoven', 'Op een andere plaats gezet, zonder te draaien of te spiegelen.'],
  ['veelvoud', 'Een getal uit de tafel van een ander getal. 12 is een veelvoud van 4.'],
  ['volume', 'Hoeveel ruimte iets inneemt, of hoeveel erin past. Ook inhoud genoemd.'],
  ['voorraad', 'Wat er nog is om te gebruiken of te verkopen.'],
  ['winst', 'Het geld dat je meer krijgt dan je zelf betaald hebt.']
];

// Rekenvragen die als invulvraag getoond worden (zoals op de echte toets).
// 1 = het invulveld wordt afgeleid uit het juiste antwoord (eenheid ervoor/erna blijft staan).
// Een lijst = zelf opgegeven velden.
const OMZET = {
  // problemen oplossen
  p01:1, p03:1, p04:1, p05:1, p06:1, p07:1, p08:1, p09:1, p10:1, p11:1, p12:1, p49:1,
  p13:1, p14:1, p15:1, p16:1, p18:1, p19:1, p20:1, p48:1,
  p21:1, p22:1, p23:1, p24:1, p25:1, p26:1, p28:1, p36:1,
  p29:1, p30:1, p31:1, p32:1, p33:1, p34:1, p35:1, p52:1,
  p38:1, p39:1, p40:1, p41:1, p42:1, p47:1, p51:1,
  p43:[{w:'16', na:'uur'}, {w:'40', na:'minuten'}],
  // getallenleer
  g02:1, g03:1, g05:1, g06:1, g07:1, g08:1, g09:1, g11:1, g12:1, g13:1, g14:1, g15:1, g17:1, g18:1, g19:1,
  g20:1, g21:1, g22:1, g24:1, g25:1, g26:1, g27:1, g28:1, g34:1, g35:1,
  g29:1, g30:1, g33:1, g39:1, g43:1, g36:1, g37:1, g40:1, g41:1,
  // algebra
  a01:1, a04:1, a08:1, a10:1, a12:1, a13:1, a16:1, a18:1, a19:1, a23:1, a24:1, a26:1, a29:1, a31:1, a33:1, a34:1,
  // meetkunde
  m02:1, m03:1, m05:1, m06:1, m10:1, m12:1, m13:1, m14:1, m15:1, m16:1, m17:1, m20:1, m22:1, m23:1, m25:1,
  m26:1, m27:1, m35:1, m28:1, m31:1, m32:1, m33:1, m36:1, m40:1, m41:1,
  m08:[{voor:'(', w:'3'}, {voor:',', w:'2', na:')'}],
  m19:[{voor:'(', w:'2'}, {voor:',', w:'-5', na:')'}],
  m29:[{voor:'(', w:'2'}, {voor:',', w:'-2', na:')'}],
  m30:[{voor:'(', w:'-3'}, {voor:',', w:'2', na:')'}],
  // statistiek
  s02:1, s03:1, s04:1, s05:1, s06:1, s07:1, s10:1, s11:1, s13:1, s14:1, s15:1, s16:1, s17:1, s18:1, s19:1,
  s20:1, s21:1, s22:1, s23:1, s25:1, s26:1, s27:1, s28:1, s29:1, s30:1, s31:1, s33:1, s34:1, s36:1, s38:1, s39:1,
  // verzamelingen
  v02:1, v17:1, v18:1, v19:1, v22:1, v25:1, v26:1
};

// Vragendatabank - WISKUNDIGE PROBLEMEN OPLOSSEN
// v(id, domein, niveauA, niveauB, vraag, [juist, fout, fout, fout], uitleg, extra)
// niveau: 1 = E, 2 = D, 3 = C, 4 = B, 5 = A, 0 = komt niet voor in die stroom
// Het eerste antwoord is altijd het juiste; de site schudt de volgorde.
// {{a|b}} wordt een breuk met breukstreep. extra: tip, calc, fig, c (controleberekening)

v('p01','pro',0,1,
`Lotte koopt 3 schriften. Eén schrift kost € 2.
Hoeveel betaalt Lotte in totaal?`,
[`€ 6`,`€ 5`,`€ 1`,`€ 8`],
`Lotte betaalt 3 keer € 2.
3 × 2 = 6. Ze betaalt € 6.`,
{tip:`Ze koopt drie keer hetzelfde. Welke bewerking past daarbij?`, c:'3*2'});

v('p02','pro',0,1,
`Een film begint om 14.00 uur. De film duurt 2 uur.
Hoe laat is de film gedaan?`,
[`16.00 uur`,`12.00 uur`,`15.00 uur`,`14.20 uur`],
`Tel 2 uur bij het beginuur: 14.00 uur + 2 uur = 16.00 uur.`,
{tip:`Het einde komt na het begin. Tel de duur erbij.`});

v('p03','pro',0,1,
`In een doos zitten 24 koekjes. Sam eet er 6 op.
Hoeveel koekjes blijven er over?`,
[`18`,`30`,`4`,`16`],
`Er gaan koekjes weg, dus je trekt af: 24 − 6 = 18.`,
{tip:`Worden het er meer of minder?`, c:'24-6'});

v('p04','pro',0,1,
`Een bus heeft 50 zitplaatsen. Er zitten al 35 mensen op de bus.
Hoeveel zitplaatsen zijn er nog vrij?`,
[`15`,`85`,`25`,`5`],
`Vrije plaatsen = alle plaatsen − bezette plaatsen.
50 − 35 = 15.`,
{tip:`Je zoekt het verschil tussen alle plaatsen en de bezette plaatsen.`, c:'50-35'});

v('p05','pro',0,1,
`Een pak melk kost € 1,20. Mila koopt 2 pakken.
Hoeveel betaalt Mila?`,
[`€ 2,40`,`€ 3,20`,`€ 2,20`,`€ 0,60`],
`2 × € 1,20 = € 2,40.`,
{tip:`Twee keer dezelfde prijs.`, c:'2*1.2'});

v('p06','pro',1,2,
`Het zwembad vraagt € 4 inkom per persoon. Een gezin van 5 personen gaat zwemmen.
Hoeveel betaalt het gezin samen?`,
[`€ 20`,`€ 9`,`€ 25`,`€ 16`],
`Elke persoon betaalt € 4. Er zijn 5 personen.
5 × 4 = 20. Het gezin betaalt € 20.`,
{tip:`Elke persoon betaalt hetzelfde bedrag.`, c:'5*4'});

v('p07','pro',1,2,
`Jonas fietst elke schooldag 6 km naar school en 6 km terug naar huis.
Hoeveel kilometer fietst hij in een schoolweek van 5 dagen?`,
[`60 km`,`30 km`,`12 km`,`17 km`],
`Stap 1: per dag fietst hij 6 + 6 = 12 km.
Stap 2: in 5 dagen is dat 5 × 12 = 60 km.`,
{tip:`Reken eerst uit hoeveel hij op één dag fietst (heen en terug).`, c:'(6+6)*5'});

v('p08','pro',1,2,
`Een trein vertrekt om 8.45 uur en komt aan om 9.20 uur.
Hoelang duurt de rit?`,
[`35 minuten`,`25 minuten`,`75 minuten`,`45 minuten`],
`Van 8.45 uur tot 9.00 uur is 15 minuten.
Van 9.00 uur tot 9.20 uur is 20 minuten.
Samen: 15 + 20 = 35 minuten.`,
{tip:`Reken eerst tot het volgende volle uur en tel dan de rest erbij.`});

v('p09','pro',1,2,
`Een klas van 24 leerlingen wordt verdeeld in groepjes van 4.
Hoeveel groepjes zijn er?`,
[`6`,`20`,`28`,`8`],
`Verdelen in gelijke groepjes is delen: 24 : 4 = 6 groepjes.`,
{tip:`Verdelen in gelijke groepjes: welke bewerking is dat?`, c:'24/4'});

v('p10','pro',1,2,
`Noor spaart € 5 per week. Ze wil een spel van € 45 kopen.
Hoeveel weken moet ze sparen?`,
[`9 weken`,`40 weken`,`50 weken`,`8 weken`],
`Hoeveel keer gaat € 5 in € 45? 45 : 5 = 9.
Noor moet 9 weken sparen.`,
{tip:`Hoeveel keer past € 5 in € 45?`, c:'45/5'});

v('p11','pro',1,2,
`In één fles zit 1,5 liter water.
Hoeveel liter water zit er in 6 flessen?`,
[`9 liter`,`7,5 liter`,`6,5 liter`,`90 liter`],
`6 × 1,5 = 9. In 6 flessen zit 9 liter water.`,
{tip:`Zes keer dezelfde hoeveelheid.`, c:'6*1.5'});

v('p12','pro',1,2,
`Amira koopt in de schoolcafetaria een broodje en een soep.
Hoeveel betaalt Amira?`,
[`€ 6,00`,`€ 5,50`,`€ 4,50`,`€ 8,00`],
`Zoek de twee prijzen in de prijslijst: broodje € 3,50 en soep € 2,50.
3,50 + 2,50 = 6,00. Amira betaalt € 6,00.`,
{fig:'prijslijst', tip:`Zoek in de prijslijst alleen wat Amira koopt.`, c:'3.5+2.5'});

v('p49','pro',1,2,
`Een pizza is verdeeld in 8 gelijke stukken. Tim eet 3 stukken en Eva eet 2 stukken.
Hoeveel stukken blijven er over?`,
[`3`,`5`,`13`,`6`],
`Samen eten ze 3 + 2 = 5 stukken.
Er blijven 8 − 5 = 3 stukken over.`,
{tip:`Hoeveel stukken eten ze samen op?`, c:'8-3-2'});

v('p13','pro',2,3,
`Een bioscoopticket kost € 9 voor een volwassene en € 6 voor een kind.
Hoeveel betalen 2 volwassenen en 3 kinderen samen?`,
[`€ 36`,`€ 15`,`€ 30`,`€ 45`],
`Stap 1: volwassenen: 2 × 9 = 18.
Stap 2: kinderen: 3 × 6 = 18.
Stap 3: samen: 18 + 18 = 36. Ze betalen € 36.`,
{tip:`Reken apart uit wat de volwassenen betalen en wat de kinderen betalen.`, c:'2*9+3*6'});

v('p14','pro',2,3,
`Emma heeft € 50. Ze koopt een T-shirt van € 18 en een boek van € 12,50.
Hoeveel geld houdt Emma over?`,
[`€ 19,50`,`€ 30,50`,`€ 20,50`,`€ 32,00`],
`Stap 1: ze geeft uit: 18 + 12,50 = 30,50.
Stap 2: ze houdt over: 50 − 30,50 = 19,50.
€ 30,50 is wat ze uitgeeft, niet wat ze overhoudt.`,
{tip:`Hoeveel geeft ze in totaal uit? De vraag gaat over wat er daarna overblijft.`, c:'50-18-12.5'});

v('p15','pro',2,3,
`Een bakker bakt 240 broodjes. Hij verpakt ze in zakjes van 6 broodjes. Elk zakje verkoopt hij voor € 3.
Hoeveel verdient hij als hij alle zakjes verkoopt?`,
[`€ 120`,`€ 40`,`€ 720`,`€ 80`],
`Stap 1: aantal zakjes: 240 : 6 = 40.
Stap 2: 40 zakjes × € 3 = € 120.
Let op: € 3 is de prijs per zakje, niet per broodje.`,
{tip:`De prijs geldt per zakje. Hoeveel zakjes zijn er?`, c:'240/6*3'});

v('p16','pro',2,3,
`Een parking kost € 2 voor het eerste uur en € 1,50 voor elk volgend uur.
Hoeveel betaal je voor 4 uur parkeren?`,
[`€ 6,50`,`€ 8,00`,`€ 6,00`,`€ 7,50`],
`Stap 1: het eerste uur kost € 2.
Stap 2: er blijven 3 uren over: 3 × 1,50 = 4,50.
Stap 3: samen: 2 + 4,50 = € 6,50.`,
{tip:`Na het eerste uur blijven er nog 3 uren over, aan een andere prijs.`, c:'2+3*1.5'});

v('p17','pro',2,3,
`De voetbaltraining van Bram begint om 17.30 uur en duurt anderhalf uur. Daarna heeft hij 20 minuten nodig om naar huis te fietsen.
Hoe laat is Bram thuis?`,
[`19.20 uur`,`19.00 uur`,`18.50 uur`,`19.50 uur`],
`Anderhalf uur = 1 uur 30 minuten.
Stap 1: einde training: 17.30 uur + 1 uur 30 minuten = 19.00 uur.
Stap 2: thuis: 19.00 uur + 20 minuten = 19.20 uur.`,
{tip:`Anderhalf uur is 1 uur en 30 minuten. Vergeet de fietstijd niet.`});

v('p18','pro',2,3,
`Voor 4 personen heb je 300 g rijst nodig.
Hoeveel rijst heb je nodig voor 12 personen?`,
[`900 g`,`600 g`,`1200 g`,`3600 g`],
`12 personen is 3 keer zoveel als 4 personen.
Je hebt dus ook 3 keer zoveel rijst nodig: 3 × 300 = 900 g.`,
{tip:`Hoeveel keer meer personen zijn er? Dan heb je ook zoveel keer meer rijst nodig.`, c:'300*12/4'});

v('p19','pro',2,3,
`Een rechthoekige tuin is 8 m lang en 5 m breed. Rond de hele tuin komt een draad.
Hoeveel meter draad is er nodig?`,
[`26 m`,`13 m`,`40 m`,`21 m`],
`De draad loopt rond de tuin, dus je zoekt de omtrek.
Omtrek = 2 × (8 + 5) = 2 × 13 = 26 m.
40 is de oppervlakte (in m²), 13 is maar de helft van de omtrek.`,
{tip:`Rond de tuin: zoek je de omtrek of de oppervlakte? Maak een schets.`, c:'2*(8+5)'});

v('p20','pro',2,3,
`In een klas zitten 25 leerlingen. 40 % van hen komt met de fiets naar school.
Hoeveel leerlingen komen met de fiets?`,
[`10`,`15`,`40`,`6`],
`10 % van 25 is 2,5. 40 % is 4 keer zoveel: 4 × 2,5 = 10.
Er komen 10 leerlingen met de fiets.`,
{tip:`Bereken eerst 10 % van 25.`, c:'0.4*25'});

v('p48','pro',2,3,
`Een fles shampoo van 250 ml kost € 3.
Hoeveel kost 1 liter van deze shampoo?`,
[`€ 12,00`,`€ 7,50`,`€ 0,75`,`€ 9,00`],
`1 liter = 1000 ml. Dat is 4 keer 250 ml.
4 × € 3 = € 12.`,
{tip:`Hoeveel milliliter is 1 liter? Hoeveel flessen van 250 ml zijn dat?`, c:'1000/250*3'});

v('p21','pro',3,4,
`Lars is 14 jaar en weegt 52 kg. Op elke training loopt hij 8 rondjes rond een piste van 400 m. Hij traint 3 keer per week.
Hoeveel kilometer loopt Lars per week?`,
[`9,6 km`,`3,2 km`,`96 km`,`1,2 km`],
`Zijn leeftijd en gewicht heb je niet nodig.
Stap 1: per training: 8 × 400 m = 3200 m.
Stap 2: per week: 3 × 3200 m = 9600 m.
Stap 3: omzetten: 9600 m = 9,6 km.`,
{tip:`Niet alle gegevens zijn nodig. Let ook op de eenheid die gevraagd wordt.`, c:'8*400*3/1000'});

v('p22','pro',3,4,
`Een schoolreis kost € 420 voor de bus en € 7 inkom per leerling. Er gaan 30 leerlingen mee. De kosten van de bus worden gelijk verdeeld over de leerlingen.
Hoeveel betaalt elke leerling?`,
[`€ 21`,`€ 14`,`€ 28`,`€ 17`],
`Stap 1: bus per leerling: 420 : 30 = 14.
Stap 2: daar komt de inkom bij: 14 + 7 = 21.
Elke leerling betaalt € 21.`,
{tip:`Elke leerling betaalt twee dingen: een deel van de bus en de inkom.`, c:'420/30+7'});

v('p23','pro',3,4,
`Een gsm-abonnement kost € 12 per maand. Elke minuut bellen buiten de bundel kost € 0,10 extra. In maart betaalt Yara € 15,50.
Hoeveel minuten belde Yara buiten de bundel?`,
[`35 minuten`,`155 minuten`,`350 minuten`,`27 minuten`],
`Stap 1: extra kosten: 15,50 − 12 = 3,50.
Stap 2: aantal minuten: 3,50 : 0,10 = 35.
Yara belde 35 minuten buiten de bundel.`,
{tip:`Hoeveel betaalde Yara meer dan de vaste prijs van het abonnement?`, c:'(15.5-12)/0.1'});

v('p24','pro',3,4,
`Een winkel verkoopt appelsap in flessen van 1 liter. Eén losse fles kost € 1,80. Een pak van 6 flessen kost € 9,60.
Hoeveel bespaar je per fles als je een pak van 6 koopt?`,
[`€ 0,20`,`€ 1,20`,`€ 1,60`,`€ 0,30`],
`Stap 1: prijs per fles in het pak: 9,60 : 6 = 1,60.
Stap 2: verschil met een losse fles: 1,80 − 1,60 = 0,20.
Je bespaart € 0,20 per fles. (€ 1,20 is de besparing op het hele pak.)`,
{tip:`Wat kost één fles als je ze per pak koopt? De vraag gaat over de besparing per fles.`, c:'1.8-9.6/6'});

v('p25','pro',3,4,
`Een zwembad is 25 m lang. Ines zwemt 30 baantjes in 20 minuten.
Hoeveel meter zwemt Ines gemiddeld per minuut?`,
[`37,5 m`,`1,5 m`,`750 m`,`50 m`],
`Stap 1: totale afstand: 30 × 25 m = 750 m.
Stap 2: per minuut: 750 : 20 = 37,5 m.`,
{tip:`Reken eerst uit hoeveel meter ze in totaal zwemt.`, c:'30*25/20'});

v('p26','pro',3,4,
`Drie vrienden gaan samen eten. Ze bestellen 3 pizza's van € 11 en 3 drankjes van € 2,50. Ze krijgen € 4,50 korting op de totale rekening. Ze verdelen de rekening gelijk.
Hoeveel betaalt elke vriend?`,
[`€ 12,00`,`€ 13,50`,`€ 9,00`,`€ 10,50`],
`Stap 1: pizza's: 3 × 11 = 33. Drankjes: 3 × 2,50 = 7,50.
Stap 2: totaal: 33 + 7,50 = 40,50.
Stap 3: met korting: 40,50 − 4,50 = 36.
Stap 4: per vriend: 36 : 3 = 12.`,
{tip:`Bereken eerst de hele rekening, trek dan de korting af en verdeel pas daarna.`, c:'(3*11+3*2.5-4.5)/3'});

v('p27','pro',3,4,
`Sara neemt de bus van Lievegem naar Gent. Ze moet om 8.30 uur op school zijn. Van de bushalte in Gent wandelt ze 12 minuten naar school.
Welke bus moet Sara ten laatste nemen?`,
[`de bus van 7.42 uur`,`de bus van 7.12 uur`,`de bus van 8.12 uur`,`de bus van 8.42 uur`],
`Sara moet ten laatste om 8.30 uur − 12 minuten = 8.18 uur in Gent aankomen.
De bus van 7.42 uur komt aan om 8.10 uur: dat is op tijd.
De bus van 8.12 uur komt pas aan om 8.40 uur: te laat.
De bus van 7.12 uur is ook op tijd, maar de vraag is welke bus ze ten laatste kan nemen.`,
{fig:'bus', tip:`Hoe laat moet Sara ten laatste aan de bushalte in Gent zijn? Kijk daarna naar de aankomsttijden.`});

v('p28','pro',3,4,
`Een rechthoekige kamer is 5 m lang en 4 m breed. De vloer wordt betegeld met vierkante tegels van 50 cm op 50 cm. De tegels worden verkocht per doos van 10.
Hoeveel dozen heb je minstens nodig?`,
[`8 dozen`,`80 dozen`,`4 dozen`,`20 dozen`],
`Stap 1: in de lengte passen 5 m : 0,5 m = 10 tegels, in de breedte 4 m : 0,5 m = 8 tegels.
Stap 2: samen: 10 × 8 = 80 tegels.
Stap 3: 80 tegels : 10 per doos = 8 dozen.`,
{tip:`Maak een schets. Hoeveel tegels passen er naast elkaar in de lengte? En in de breedte?`, c:'(5/0.5)*(4/0.5)/10'});

v('p36','pro',3,4,
`Een auto verbruikt gemiddeld 6 liter benzine per 100 km. Benzine kost € 1,70 per liter.
Hoeveel kost de benzine voor een rit van 250 km?`,
[`€ 25,50`,`€ 10,20`,`€ 42,50`,`€ 255,00`],
`Stap 1: 250 km is 2,5 keer 100 km. Verbruik: 2,5 × 6 = 15 liter.
Stap 2: prijs: 15 × 1,70 = 25,50.
De benzine kost € 25,50.`,
{calc:1, tip:`Hoeveel liter verbruikt de auto voor 250 km? Reken daarna de prijs uit.`, c:'250/100*6*1.7'});

v('p45','pro',3,4,
`Ali, Bo, Cas en Dina lopen een wedstrijd. Bo komt vóór Cas aan, maar na Dina. Ali komt als laatste aan.
Wie wordt tweede?`,
[`Bo`,`Dina`,`Cas`,`Ali`],
`Zet de lopers op een rij.
Bo komt na Dina en vóór Cas: Dina – Bo – Cas.
Ali is laatste: Dina – Bo – Cas – Ali.
Bo wordt tweede.`,
{tip:`Teken een lijn van eerste naar laatste en zet de namen erop, zin per zin.`});

v('p29','pro',4,5,
`Op een kaart met schaal 1 : 50 000 liggen twee dorpen 6 cm van elkaar. Finn wandelt aan 4 km per uur.
Hoelang doet Finn over de wandeling tussen de twee dorpen?`,
[`45 minuten`,`75 minuten`,`3 uur`,`30 minuten`],
`Stap 1: werkelijke afstand: 6 cm × 50 000 = 300 000 cm = 3 km.
Stap 2: aan 4 km per uur doet hij over 3 km: 3 : 4 = 0,75 uur.
Stap 3: 0,75 uur = 0,75 × 60 minuten = 45 minuten.
Let op: 0,75 uur is niet 75 minuten.`,
{tip:`Zoek eerst de afstand in werkelijkheid. Hoeveel kilometer is dat?`, c:'6*50000/100000/4*60'});

v('p30','pro',4,5,
`Een fitnesscentrum heeft twee formules.
Formule 1: je betaalt € 8 per beurt.
Formule 2: je betaalt € 30 per maand en daarbovenop € 3 per beurt.
Vanaf hoeveel beurten per maand is formule 2 goedkoper dan formule 1?`,
[`vanaf 7 beurten`,`vanaf 6 beurten`,`vanaf 5 beurten`,`vanaf 10 beurten`],
`Vergelijk de twee formules in een tabel.
5 beurten: formule 1 = € 40, formule 2 = 30 + 15 = € 45.
6 beurten: formule 1 = € 48, formule 2 = 30 + 18 = € 48 (even duur).
7 beurten: formule 1 = € 56, formule 2 = 30 + 21 = € 51.
Vanaf 7 beurten is formule 2 goedkoper.`,
{tip:`Maak een tabel: reken voor 5, 6, 7 … beurten uit wat elke formule kost.`});

v('p31','pro',4,5,
`Een rechthoekig grasveld is 20 m lang en 12 m breed. Rond het grasveld ligt een pad van 1 m breed.
Wat is de oppervlakte van het pad?`,
[`68 m²`,`64 m²`,`32 m²`,`308 m²`],
`Stap 1: grasveld en pad samen zijn 20 + 2 = 22 m lang en 12 + 2 = 14 m breed. Het pad ligt aan beide kanten.
Stap 2: oppervlakte samen: 22 × 14 = 308 m².
Stap 3: oppervlakte grasveld: 20 × 12 = 240 m².
Stap 4: pad: 308 − 240 = 68 m².`,
{fig:'pad', tip:`Het pad is het verschil tussen de grote rechthoek (gras + pad) en het grasveld. Hoe lang en breed is de grote rechthoek?`, c:'22*14-20*12'});

v('p32','pro',4,5,
`In een klas zitten 28 leerlingen. Er zijn 4 meisjes meer dan jongens.
Hoeveel jongens zitten er in de klas?`,
[`12`,`16`,`14`,`24`],
`Haal de 4 extra meisjes even weg: 28 − 4 = 24.
Nu zijn er evenveel jongens als meisjes: 24 : 2 = 12.
Er zijn 12 jongens (en 12 + 4 = 16 meisjes). Controle: 12 + 16 = 28.`,
{tip:`Als je de 4 extra meisjes even wegdenkt, zijn er evenveel jongens als meisjes.`, c:'(28-4)/2'});

v('p33','pro',4,5,
`Een jas kost € 80. In week 1 gaat de prijs 25 % omlaag. In week 2 gaat de nieuwe prijs nog eens 10 % omlaag.
Hoeveel kost de jas in week 2?`,
[`€ 54`,`€ 52`,`€ 45`,`€ 56`],
`Stap 1: 25 % van 80 = 20. Prijs in week 1: 80 − 20 = 60.
Stap 2: 10 % van 60 = 6. Prijs in week 2: 60 − 6 = 54.
De tweede korting reken je op de nieuwe prijs. Je mag 25 % en 10 % niet optellen tot 35 %.`,
{calc:1, tip:`De tweede korting wordt berekend op de prijs van week 1, niet op € 80.`, c:'80*0.75*0.9'});

v('p34','pro',4,5,
`Twee kranen vullen samen een vat van 600 liter. Kraan A geeft 12 liter per minuut, kraan B geeft 8 liter per minuut. Het vat is al voor een derde gevuld.
Hoelang duurt het om het vat helemaal te vullen als beide kranen open staan?`,
[`20 minuten`,`30 minuten`,`50 minuten`,`10 minuten`],
`Stap 1: al gevuld: een derde van 600 = 200 liter. Er moet nog 400 liter bij.
Stap 2: de twee kranen samen: 12 + 8 = 20 liter per minuut.
Stap 3: 400 : 20 = 20 minuten.`,
{tip:`Hoeveel liter moet er nog bij? En hoeveel liter geven de twee kranen samen per minuut?`, c:'(600-600/3)/(12+8)'});

v('p35','pro',4,5,
`Kaat, Lien en Mo verdelen samen € 120. Lien krijgt dubbel zoveel als Kaat. Mo krijgt € 20 meer dan Kaat.
Hoeveel krijgt Lien?`,
[`€ 50`,`€ 25`,`€ 45`,`€ 60`],
`Noem het bedrag van Kaat één deel.
Lien krijgt 2 delen, Mo krijgt 1 deel + € 20.
Samen: 4 delen + 20 = 120, dus 4 delen = 100 en 1 deel = 25.
Kaat krijgt € 25, Lien 2 × 25 = € 50, Mo € 45. Controle: 25 + 50 + 45 = 120.`,
{tip:`Stel het bedrag van Kaat voor met een blokje. Hoeveel blokjes krijgt Lien? En Mo?`, c:'2*(120-20)/4'});

v('p37','pro',4,5,
`Een trein vertrekt om 9.50 uur. Hij legt 210 km af aan een gemiddelde snelheid van 90 km per uur.
Hoe laat komt de trein aan?`,
[`12.10 uur`,`12.23 uur`,`11.50 uur`,`12.33 uur`],
`Stap 1: tijd = afstand : snelheid = 210 : 90 = 2,333… uur.
Stap 2: 2,333… uur = 2 uur en een derde van een uur = 2 uur 20 minuten.
Stap 3: 9.50 uur + 2 uur 20 minuten = 12.10 uur.
Let op: 0,33 uur is niet 33 minuten.`,
{calc:1, tip:`Bereken eerst hoelang de rit duurt. Zet het deel na de komma om naar minuten.`});

v('p46','pro',4,5,
`Een school wil 130 leerlingen vervoeren. Een grote bus heeft 50 plaatsen en kost € 320. Een kleine bus heeft 20 plaatsen en kost € 140.
Wat is de goedkoopste oplossing om alle leerlingen te vervoeren?`,
[`1 grote bus en 4 kleine bussen`,`3 grote bussen`,`2 grote bussen en 2 kleine bussen`,`7 kleine bussen`],
`Werk elke mogelijkheid uit.
3 grote: 150 plaatsen, 3 × 320 = € 960.
2 grote + 2 kleine: 140 plaatsen, 640 + 280 = € 920.
1 grote + 4 kleine: 130 plaatsen, 320 + 560 = € 880.
7 kleine: 140 plaatsen, 7 × 140 = € 980.
De goedkoopste oplossing is 1 grote bus en 4 kleine bussen.`,
{calc:1, tip:`Reken voor elke mogelijkheid twee dingen na: zijn er genoeg plaatsen, en wat kost het?`});

v('p52','pro',4,5,
`Voor 6 pannenkoeken heb je 150 g bloem, 2 eieren en 300 ml melk nodig. Jij hebt 500 g bloem, 5 eieren en 1 liter melk.
Hoeveel pannenkoeken kan je hoogstens bakken?`,
[`15`,`20`,`18`,`12`],
`Kijk per ingrediënt hoeveel pannenkoeken mogelijk zijn.
Bloem: 500 : 150 = 3,33… keer het recept, dus 20 pannenkoeken.
Eieren: 5 : 2 = 2,5 keer het recept, dus 15 pannenkoeken.
Melk: 1000 : 300 = 3,33… keer het recept, dus 20 pannenkoeken.
De eieren zijn het eerst op. Je kan hoogstens 15 pannenkoeken bakken.`,
{calc:1, tip:`Welk ingrediënt is het eerst op? Reken voor elk ingrediënt apart.`, c:'5/2*6'});

v('p38','pro',5,0,
`Een fruitkweker verkoopt appels op de markt. Op maandag verkoopt hij de helft van zijn voorraad. Op dinsdag verkoopt hij een derde van wat er nog overblijft. Daarna heeft hij nog 60 kg.
Hoeveel kilogram appels had hij maandagochtend?`,
[`180 kg`,`360 kg`,`120 kg`,`240 kg`],
`Werk van achter naar voor.
Na dinsdag blijft twee derde van de rest over. Die twee derde is 60 kg, dus één derde is 30 kg en de rest na maandag was 90 kg.
Die 90 kg is de helft van de voorraad. De voorraad was 2 × 90 = 180 kg.
Controle: 180 → 90 → 90 − 30 = 60.`,
{tip:`Werk terug vanaf het einde. Welk deel van de voorraad van dinsdagochtend is 60 kg?`, c:'60/(2/3)*2'});

v('p39','pro',5,0,
`Een winkelier koopt een fiets in voor € 400. Hij wil 20 % winst maken op de inkoopprijs, ook als hij de klant 20 % korting geeft op de prijs die op het prijskaartje staat.
Welke prijs moet er op het prijskaartje staan?`,
[`€ 600`,`€ 480`,`€ 560`,`€ 576`],
`Stap 1: hij wil ontvangen: 400 + 20 % van 400 = 400 + 80 = € 480.
Stap 2: na 20 % korting betaalt de klant 80 % van het prijskaartje. Die 80 % moet € 480 zijn.
Stap 3: 480 : 0,80 = 600.
Controle: 20 % korting op € 600 is € 120, en 600 − 120 = 480.`,
{calc:1, tip:`Hoeveel wil de winkelier ontvangen? Dat bedrag is 80 % van de prijs op het kaartje.`, c:'400*1.2/0.8'});

v('p40','pro',5,0,
`Een rechthoek heeft een omtrek van 48 cm. De lengte is 3 keer zo groot als de breedte.
Wat is de oppervlakte van de rechthoek?`,
[`108 cm²`,`144 cm²`,`432 cm²`,`96 cm²`],
`Noem de breedte b. Dan is de lengte 3b.
Omtrek: 2 · (3b + b) = 8b = 48, dus b = 6 cm en de lengte is 18 cm.
Oppervlakte: 18 × 6 = 108 cm².`,
{tip:`Noem de breedte b. Hoe schrijf je dan de lengte? En de omtrek?`, c:'(48/8)*(3*48/8)'});

v('p41','pro',5,0,
`Sofie fietst naar haar oma aan 15 km per uur. Ze doet er 40 minuten over. Op de terugweg heeft ze wind mee en fietst ze 20 km per uur.
Hoeveel minuten is ze op de terugweg sneller?`,
[`10 minuten`,`5 minuten`,`13 minuten`,`30 minuten`],
`Stap 1: 40 minuten is twee derde van een uur. Afstand: twee derde van 15 km = 10 km.
Stap 2: terug: 10 km aan 20 km per uur = een half uur = 30 minuten.
Stap 3: verschil: 40 − 30 = 10 minuten.`,
{tip:`Je kent de afstand niet, maar je kan ze berekenen met de heenweg.`, c:'40-(15*40/60)/20*60'});

v('p42','pro',5,0,
`Aan één vierkante tafel kunnen 4 personen zitten. Schuif je 2 tafels tegen elkaar, dan kunnen er 6 personen zitten. Bij 3 tafels op een rij zijn dat 8 personen, en zo verder.
Hoeveel tafels op een rij heb je nodig voor 30 personen?`,
[`14 tafels`,`15 tafels`,`8 tafels`,`13 tafels`],
`Bij elke extra tafel komen er 2 plaatsen bij.
Aantal plaatsen bij n tafels: 2n + 2.
2n + 2 = 30, dus 2n = 28 en n = 14.
Controle: 14 tafels geven 2 × 14 + 2 = 30 plaatsen.`,
{tip:`Hoeveel plaatsen komen erbij per extra tafel? Zoek de regel en maak een schets.`, c:'(30-2)/2'});

v('p43','pro',5,0,
`Een zwembad is 25 m lang, 10 m breed en overal 2 m diep. Een pomp levert 500 liter water per minuut. (1 m³ = 1000 liter)
Hoelang duurt het om het lege zwembad helemaal te vullen?`,
[`16 uur 40 minuten`,`10 uur`,`8 uur 20 minuten`,`1000 uur`],
`Stap 1: volume: 25 × 10 × 2 = 500 m³ = 500 000 liter.
Stap 2: tijd: 500 000 : 500 = 1000 minuten.
Stap 3: 1000 minuten = 16 × 60 + 40 minuten = 16 uur 40 minuten.`,
{calc:1, tip:`Bereken eerst het volume in m³ en zet om naar liter. Het antwoord wordt in uren en minuten gevraagd.`});

v('p44','pro',5,0,
`De prijs van een abonnement stijgt eerst met 10 %. Een jaar later daalt de nieuwe prijs met 10 %.
Wat weet je over de eindprijs?`,
[`De eindprijs is 1 % lager dan de oorspronkelijke prijs.`,`De eindprijs is gelijk aan de oorspronkelijke prijs.`,`De eindprijs is 1 % hoger dan de oorspronkelijke prijs.`,`De eindprijs is 10 % lager dan de oorspronkelijke prijs.`],
`Neem een voorbeeld: de prijs is € 100.
Na de stijging: 100 + 10 = € 110.
Na de daling: 10 % van 110 is 11, dus 110 − 11 = € 99.
De eindprijs is € 1 op € 100 lager: 1 % lager. De daling wordt op een groter bedrag berekend dan de stijging.`,
{tip:`Kies zelf een makkelijke beginprijs, bijvoorbeeld € 100, en reken stap voor stap.`});

v('p47','pro',5,0,
`Een vader is nu 3 keer zo oud als zijn dochter. Over 12 jaar is hij 2 keer zo oud als zijn dochter.
Hoe oud is de dochter nu?`,
[`12 jaar`,`8 jaar`,`18 jaar`,`24 jaar`],
`Noem de leeftijd van de dochter d. De vader is 3d.
Over 12 jaar: 3d + 12 = 2 · (d + 12).
3d + 12 = 2d + 24, dus d = 12.
Controle: nu 12 en 36 jaar. Over 12 jaar 24 en 48 jaar, en 48 is het dubbel van 24.`,
{tip:`Noem de leeftijd van de dochter d. Schrijf de leeftijden nu en over 12 jaar op.`});

v('p51','pro',5,0,
`Een kaars van 24 cm wordt elk uur 3 cm korter. Een tweede kaars van 18 cm wordt elk uur 1,5 cm korter. Ze worden op hetzelfde moment aangestoken.
Na hoeveel uur zijn de twee kaarsen even lang?`,
[`na 4 uur`,`na 2 uur`,`na 6 uur`,`na 8 uur`],
`Maak een tabel of gebruik een vergelijking.
Na t uur: kaars 1 is 24 − 3t, kaars 2 is 18 − 1,5t.
24 − 3t = 18 − 1,5t geeft 6 = 1,5t, dus t = 4.
Controle: na 4 uur zijn ze 24 − 12 = 12 cm en 18 − 6 = 12 cm.`,
{tip:`Maak een tabel met de lengte van elke kaars na 1, 2, 3 … uur.`, c:'(24-18)/(3-1.5)'});

// Vragendatabank - GETALLENLEER (met procenten, verhoudingen en herleidingen)

v('g01','get',0,1,
`Welk getal is het grootst?`,
[`3,5`,`3,45`,`3,09`,`3,405`],
`Vul aan met nullen zodat elk getal drie cijfers na de komma heeft: 3,500 – 3,450 – 3,090 – 3,405.
3,500 is het grootst.`);

v('g02','get',0,1,
`Reken uit: 48 + 37`,
[`85`,`75`,`715`,`84`],
`48 + 37 = 48 + 30 + 7 = 78 + 7 = 85.`,{c:'48+37'});

v('g03','get',0,1,
`Hoeveel is de helft van 70?`,
[`35`,`140`,`30`,`37`],
`De helft nemen is delen door 2: 70 : 2 = 35.`,{c:'70/2'});

v('g04','get',0,1,
`Welke breuk betekent 'één vierde'?`,
[`{{1|4}}`,`{{4|1}}`,`{{1|2}}`,`{{1|3}}`],
`Eén vierde betekent 1 van de 4 gelijke delen. De 1 staat boven de breukstreep (teller), de 4 eronder (noemer).`);

v('g05','get',0,1,
`Rond 367 af op het tiental.`,
[`370`,`360`,`400`,`300`],
`367 ligt tussen 360 en 370. Het cijfer van de eenheden is 7. Vanaf 5 rond je naar boven af: 370.`);

v('g06','get',1,2,
`Reken uit: 6 × 7 − 12`,
[`30`,`54`,`28`,`−30`],
`Eerst vermenigvuldigen: 6 × 7 = 42.
Daarna aftrekken: 42 − 12 = 30.`,{c:'6*7-12'});

v('g07','get',1,2,
`Welk kommagetal is gelijk aan {{1|2}}?`,
[`0,5`,`0,2`,`1,2`,`0,12`],
`{{1|2}} betekent 1 gedeeld door 2. 1 : 2 = 0,5.`);

v('g08','get',1,2,
`Overdag is het 3 °C. 's Nachts daalt de temperatuur met 8 graden.
Hoe koud is het 's nachts?`,
[`−5 °C`,`5 °C`,`−11 °C`,`11 °C`],
`3 − 8 = −5. Van 3 naar 0 is 3 graden, daarna nog 5 graden onder nul: −5 °C.`,{c:'3-8'});

v('g09','get',1,2,
`Hoeveel is 10 % van 250?`,
[`25`,`2,5`,`240`,`10`],
`10 % is één tiende. 250 : 10 = 25.`,{c:'0.1*250'});

v('g10','get',1,2,
`Welk getal is een veelvoud van 6?`,
[`42`,`26`,`34`,`56`],
`Een veelvoud van 6 vind je in de tafel van 6.
6 × 7 = 42. De andere getallen staan niet in de tafel van 6.`);

v('g11','get',1,2,
`Zet om: 2,5 km = … m`,
[`2500 m`,`250 m`,`25 m`,`25 000 m`],
`1 km = 1000 m. 2,5 × 1000 = 2500 m.`,{c:'2.5*1000'});

v('g12','get',2,3,
`Reken uit: 12 + 8 : 4 × 3`,
[`18`,`15`,`6`,`14`],
`Delen en vermenigvuldigen gaan vóór optellen, van links naar rechts.
8 : 4 = 2, dan 2 × 3 = 6.
12 + 6 = 18.`,{c:'12+8/4*3'});

v('g13','get',2,4,
`Reken uit: −7 + 12 − (−3)`,
[`8`,`2`,`−22`,`22`],
`Een negatief getal aftrekken is hetzelfde als het tegengestelde optellen: − (−3) = + 3.
−7 + 12 + 3 = 5 + 3 = 8.`,{c:'-7+12-(-3)'});

v('g14','get',2,3,
`Schrijf {{3|4}} als een percentage.`,
[`75 %`,`34 %`,`0,75 %`,`43 %`],
`3 : 4 = 0,75 en 0,75 = 75 honderdsten = 75 %.`);

v('g15','get',2,3,
`Hoeveel is {{2|5}} van 60?`,
[`24`,`12`,`150`,`30`],
`Eerst één vijfde: 60 : 5 = 12.
Dan twee vijfden: 2 × 12 = 24.`,{c:'2/5*60'});

v('g16','get',2,3,
`Welke breuk is gelijk aan {{6|8}}?`,
[`{{3|4}}`,`{{2|3}}`,`{{4|6}}`,`{{8|6}}`],
`Deel teller en noemer door hetzelfde getal: 6 : 2 = 3 en 8 : 2 = 4.
{{6|8}} = {{3|4}}.`);

v('g17','get',2,3,
`Een trui van € 40 wordt 25 % goedkoper.
Hoeveel kost de trui nu?`,
[`€ 30`,`€ 10`,`€ 15`,`€ 35`],
`25 % is één vierde. 40 : 4 = 10, dat is de korting.
Nieuwe prijs: 40 − 10 = € 30.`,{c:'40*0.75'});

v('g18','get',2,0,
`Wat is de grootste gemeenschappelijke deler van 18 en 24?`,
[`6`,`2`,`3`,`72`],
`Delers van 18: 1, 2, 3, 6, 9, 18.
Delers van 24: 1, 2, 3, 4, 6, 8, 12, 24.
De grootste deler die in beide rijen voorkomt, is 6. (72 is het kleinste gemeenschappelijke veelvoud.)`);

v('g19','get',2,3,
`Reken uit: 2,4 × 0,5`,
[`1,2`,`12`,`0,12`,`2,9`],
`Vermenigvuldigen met 0,5 is de helft nemen. De helft van 2,4 is 1,2.`,{c:'2.4*0.5'});

v('g20','get',3,5,
`Reken uit: {{2|3}} + {{1|4}}`,
[`{{11|12}}`,`{{3|7}}`,`{{3|12}}`,`{{1|6}}`],
`Maak de noemers gelijk. Het kleinste gemeenschappelijke veelvoud van 3 en 4 is 12.
{{2|3}} = {{8|12}} en {{1|4}} = {{3|12}}.
{{8|12}} + {{3|12}} = {{11|12}}. Tellers en noemers apart optellen mag niet.`,{c:'2/3+1/4'});

v('g21','get',3,0,
`Reken uit: (−3)² − 2 · (−4)`,
[`17`,`1`,`−17`,`−1`],
`Eerst de macht: (−3)² = (−3) · (−3) = 9.
Dan het product: 2 · (−4) = −8.
9 − (−8) = 9 + 8 = 17.`,{c:'(-3)**2-2*(-4)'});

v('g22','get',3,4,
`Een fiets kost € 480. Je krijgt 15 % korting.
Hoeveel betaal je?`,
[`€ 408`,`€ 72`,`€ 465`,`€ 400`],
`15 % van 480 = 0,15 × 480 = 72. Dat is de korting.
Je betaalt 480 − 72 = € 408.`,{calc:1,c:'480*0.85'});

v('g23','get',3,4,
`Welke rangschikking van klein naar groot is juist?`,
[`0,58 &lt; {{3|5}} &lt; 62 %`,`{{3|5}} &lt; 0,58 &lt; 62 %`,`0,58 &lt; 62 % &lt; {{3|5}}`,`62 % &lt; {{3|5}} &lt; 0,58`],
`Schrijf alles als kommagetal: {{3|5}} = 0,60 en 62 % = 0,62.
0,58 &lt; 0,60 &lt; 0,62.`);

v('g24','get',3,4,
`Op een plan met schaal 1 : 200 is een kamer 3 cm lang.
Hoe lang is de kamer in werkelijkheid?`,
[`6 m`,`60 m`,`600 m`,`1,5 m`],
`Schaal 1 : 200 betekent: 1 cm op het plan is 200 cm in werkelijkheid.
3 cm × 200 = 600 cm = 6 m.`,{c:'3*200/100'});

v('g25','get',3,0,
`Wat is het kleinste gemeenschappelijke veelvoud van 12 en 18?`,
[`36`,`6`,`216`,`72`],
`Veelvouden van 12: 12, 24, 36, 48, …
Veelvouden van 18: 18, 36, 54, …
Het kleinste getal dat in beide rijen staat, is 36. (6 is de grootste gemeenschappelijke deler.)`);

v('g26','get',3,0,
`Reken uit: {{3|4}} · {{2|9}}`,
[`{{1|6}}`,`{{5|13}}`,`{{27|8}}`,`{{6|13}}`],
`Vermenigvuldig teller met teller en noemer met noemer: {{3 · 2|4 · 9}} = {{6|36}}.
Vereenvoudig door te delen door 6: {{1|6}}.`,{c:'3/4*2/9'});

v('g27','get',3,4,
`In een klas van 25 leerlingen dragen 8 leerlingen een bril.
Hoeveel procent van de klas draagt een bril?`,
[`32 %`,`8 %`,`33 %`,`20 %`],
`{{8|25}} = {{32|100}} (teller en noemer maal 4). Dat is 32 %.`,{c:'8/25*100'});

v('g28','get',3,4,
`Zet om: 3,2 m² = … dm²`,
[`320 dm²`,`32 dm²`,`3200 dm²`,`0,32 dm²`],
`1 m² = 100 dm² (bij oppervlakte gaat het in stappen van 100).
3,2 × 100 = 320 dm².`,{c:'3.2*100'});

v('g34','get',3,4,
`Een broek kost € 60 zonder btw. De btw bedraagt 21 %.
Hoeveel kost de broek met btw?`,
[`€ 72,60`,`€ 81,00`,`€ 61,26`,`€ 12,60`],
`21 % van 60 = 0,21 × 60 = 12,60. Dat is de btw.
Prijs met btw: 60 + 12,60 = € 72,60.`,{calc:1,c:'60*1.21'});

v('g35','get',3,0,
`Reken uit: √144 − 5²`,
[`−13`,`13`,`2`,`−37`],
`√144 = 12, want 12 · 12 = 144.
5² = 25.
12 − 25 = −13.`,{c:'Math.sqrt(144)-25'});

v('g29','get',4,0,
`Reken uit: {{5|6}} − {{1|2}} : {{3|4}}`,
[`{{1|6}}`,`{{4|9}}`,`{{1|2}}`,`{{11|24}}`],
`Eerst de deling. Delen door een breuk is vermenigvuldigen met het omgekeerde:
{{1|2}} : {{3|4}} = {{1|2}} · {{4|3}} = {{4|6}}.
Dan de aftrekking: {{5|6}} − {{4|6}} = {{1|6}}.`,{c:'5/6-(1/2)/(3/4)'});

v('g30','get',4,5,
`Na een prijsstijging van 20 % kost een abonnement € 60.
Hoeveel kostte het abonnement vóór de stijging?`,
[`€ 50`,`€ 48`,`€ 40`,`€ 72`],
`Na de stijging betaal je 120 % van de oude prijs. Die 120 % is € 60.
1 % is dan 60 : 120 = 0,50 en 100 % is € 50.
Controle: 20 % van 50 is 10, en 50 + 10 = 60. Je mag niet 20 % van € 60 aftrekken.`,{calc:1,c:'60/1.2'});

v('g31','get',4,0,
`Schrijf 0,000 45 in de wetenschappelijke schrijfwijze.`,
[`4,5 · 10<sup>−4</sup>`,`4,5 · 10<sup>−3</sup>`,`45 · 10<sup>−5</sup>`,`4,5 · 10<sup>4</sup>`],
`In de wetenschappelijke schrijfwijze staat er precies één cijfer (niet 0) vóór de komma.
Je verschuift de komma 4 plaatsen naar rechts: 0,000 45 = 4,5 · 10<sup>−4</sup>.`);

v('g32','get',4,0,
`Welke uitspraak is juist?`,
[`Elk veelvoud van 6 is ook een veelvoud van 3.`,`Elk veelvoud van 3 is ook een veelvoud van 6.`,`Elk priemgetal is oneven.`,`De som van twee priemgetallen is altijd een priemgetal.`],
`6 = 2 · 3, dus elk veelvoud van 6 is ook deelbaar door 3.
Tegenvoorbeelden voor de andere uitspraken: 9 is een veelvoud van 3 maar niet van 6; 2 is een even priemgetal; 3 + 5 = 8 is geen priemgetal.`);

v('g33','get',4,0,
`Reken uit: 2³ · 2⁴ : 2⁵`,
[`4`,`2`,`8`,`128`],
`Bij machten met hetzelfde grondtal tel je de exponenten op bij vermenigvuldigen en trek je ze af bij delen.
2<sup>3 + 4 − 5</sup> = 2² = 4.`,{c:'2**3*2**4/2**5'});

v('g39','get',4,5,
`Hoeveel is {{3|8}} van 40 % van 200?`,
[`30`,`15`,`75`,`24`],
`Stap 1: 40 % van 200 = 80.
Stap 2: {{3|8}} van 80: 80 : 8 = 10 en 3 × 10 = 30.`,{c:'3/8*0.4*200'});

v('g43','get',4,5,
`Een tablet kost € 250. In de solden gaat er 30 % af. Met je klantenkaart krijg je daarna nog € 15 korting.
Hoeveel betaal je?`,
[`€ 160,00`,`€ 175,00`,`€ 205,00`,`€ 164,50`],
`Stap 1: 30 % van 250 = 75. Prijs in de solden: 250 − 75 = 175.
Stap 2: klantenkaart: 175 − 15 = € 160.`,{calc:1,c:'250*0.7-15'});

v('g36','get',5,0,
`Reken uit: (−{{2|3}})² · {{9|8}} − {{1|2}}`,
[`0`,`1`,`−1`,`{{1|2}}`],
`Eerst de macht: (−{{2|3}})² = {{4|9}} (min maal min is plus).
Dan het product: {{4|9}} · {{9|8}} = {{36|72}} = {{1|2}}.
Dan de aftrekking: {{1|2}} − {{1|2}} = 0.`,{c:'(-2/3)**2*9/8-1/2'});

v('g37','get',5,0,
`In het getal 4a7 stelt a een cijfer voor. Het getal is deelbaar door 9.
Welk cijfer is a?`,
[`7`,`2`,`5`,`9`],
`Een getal is deelbaar door 9 als de som van de cijfers deelbaar is door 9.
4 + a + 7 = 11 + a. Het eerstvolgende veelvoud van 9 is 18, dus a = 7.
Controle: 477 : 9 = 53.`,{c:'18-11'});

v('g38','get',5,0,
`Een prijs daalt eerst met 20 %. Daarna stijgt de nieuwe prijs met 25 %.
Wat weet je over de eindprijs?`,
[`De eindprijs is gelijk aan de oorspronkelijke prijs.`,`De eindprijs is 5 % hoger dan de oorspronkelijke prijs.`,`De eindprijs is 5 % lager dan de oorspronkelijke prijs.`,`De eindprijs is 45 % hoger dan de oorspronkelijke prijs.`],
`Neem als voorbeeld een prijs van € 100.
Na de daling: 100 − 20 = € 80.
Na de stijging: 25 % van 80 is 20, dus 80 + 20 = € 100.
De eindprijs is opnieuw de oorspronkelijke prijs.`);

v('g40','get',5,0,
`Eén stofdeeltje heeft een massa van 2,5 · 10<sup>−6</sup> g.
Hoeveel wegen een miljoen van zulke stofdeeltjes samen?`,
[`2,5 g`,`25 g`,`0,25 g`,`2,5 · 10<sup>−12</sup> g`],
`Een miljoen = 10<sup>6</sup>.
2,5 · 10<sup>−6</sup> · 10<sup>6</sup> = 2,5 · 10<sup>0</sup> = 2,5 g.`,{c:'2.5e-6*1e6'});

v('g41','get',5,0,
`Welk getal ligt precies in het midden tussen {{1|3}} en {{1|2}}?`,
[`{{5|12}}`,`{{2|5}}`,`{{5|6}}`,`{{3|8}}`],
`Het midden is het gemiddelde van de twee getallen.
{{1|3}} + {{1|2}} = {{2|6}} + {{3|6}} = {{5|6}}.
De helft daarvan: {{5|6}} : 2 = {{5|12}}.`,{c:'(1/3+1/2)/2'});

// Vragendatabank - ALGEBRA (alleen A-stroom)

v('a01','alg',1,0,
`Bereken de getalwaarde van 3x + 2 voor x = 4.`,
[`14`,`9`,`36`,`18`],
`Vervang x door 4: 3 · 4 + 2 = 12 + 2 = 14.
3x betekent 3 maal x, niet 34.`,{c:'3*4+2'});

v('a02','alg',1,0,
`Schrijf korter: a + a + a`,
[`3a`,`a³`,`3 + a`,`3a³`],
`Drie keer dezelfde term optellen is 3 maal die term: a + a + a = 3a.
a³ zou a · a · a zijn.`);

v('a03','alg',1,0,
`Welke uitdrukking past bij 'het dubbel van een getal n, vermeerderd met 5'?`,
[`2n + 5`,`2(n + 5)`,`n² + 5`,`5n + 2`],
`Het dubbel van n is 2n. Vermeerderd met 5 betekent: daarna 5 erbij.
Dus 2n + 5. Bij 2(n + 5) tel je eerst 5 op en neem je daarna het dubbel.`);

v('a04','alg',1,0,
`Los op: x + 7 = 12`,
[`x = 5`,`x = 19`,`x = −5`,`x = 84`],
`Trek van beide leden 7 af: x = 12 − 7 = 5.
Controle: 5 + 7 = 12.`,{c:'12-7'});

v('a05','alg',1,0,
`Schrijf korter: 4x + 3x`,
[`7x`,`7x²`,`12x`,`7`],
`Gelijksoortige termen tel je op door de coëfficiënten op te tellen: 4 + 3 = 7. Het lettergedeelte blijft x.`);

v('a06','alg',2,0,
`Een taxi rekent € 3 startgeld en € 2 per kilometer.
Welke formule geeft de prijs p (in euro) voor een rit van k kilometer?`,
[`p = 3 + 2k`,`p = 3k + 2`,`p = 5k`,`p = 2 + 3 + k`],
`Het startgeld betaal je één keer: 3.
Per kilometer komt er 2 bij: 2 · k.
Samen: p = 3 + 2k.`);

v('a07','alg',2,0,
`Werk de haakjes uit: 3(x + 4)`,
[`3x + 12`,`3x + 4`,`x + 12`,`7x`],
`Vermenigvuldig 3 met elke term tussen de haakjes: 3 · x + 3 · 4 = 3x + 12.`);

v('a08','alg',2,0,
`Los op: 3x = 21`,
[`x = 7`,`x = 18`,`x = 24`,`x = 63`],
`Deel beide leden door 3: x = 21 : 3 = 7.
Controle: 3 · 7 = 21.`,{c:'21/3'});

v('a09','alg',2,0,
`Schrijf zo kort mogelijk: 5a − 2b + 3a + b`,
[`8a − b`,`8a − 3b`,`7ab`,`8a + b`],
`Neem gelijksoortige termen samen.
Termen met a: 5a + 3a = 8a.
Termen met b: −2b + b = −b.
Resultaat: 8a − b.`);

v('a10','alg',2,0,
`Bereken de getalwaarde van 2a − b voor a = 3 en b = −1.`,
[`7`,`5`,`4`,`−5`],
`Vervang de letters: 2 · 3 − (−1) = 6 + 1 = 7.
Een negatief getal aftrekken wordt optellen.`,{c:'2*3-(-1)'});

v('a11','alg',2,0,
`Reken uit: 2x · 3x`,
[`6x²`,`6x`,`5x`,`5x²`],
`Vermenigvuldig de getallen: 2 · 3 = 6.
Vermenigvuldig de letters: x · x = x².
Resultaat: 6x².`);

v('a12','alg',2,0,
`Los op: 2x + 5 = 17`,
[`x = 6`,`x = 11`,`x = 4`,`x = 12`],
`Trek van beide leden 5 af: 2x = 12.
Deel beide leden door 2: x = 6.
Controle: 2 · 6 + 5 = 17.`,{c:'(17-5)/2'});

v('a13','alg',3,0,
`Los de vergelijking op: 3x − 7 = 5x + 9`,
[`x = −8`,`x = 8`,`x = 1`,`x = −1`],
`Breng de termen met x naar één lid en de getallen naar het andere lid.
3x − 5x = 9 + 7
−2x = 16
x = 16 : (−2) = −8.
Controle: 3 · (−8) − 7 = −31 en 5 · (−8) + 9 = −31.`,{c:'(9+7)/(3-5)'});

v('a14','alg',3,0,
`Werk de haakjes uit: −2(3x − 5)`,
[`−6x + 10`,`−6x − 10`,`−6x − 5`,`6x + 10`],
`Vermenigvuldig −2 met elke term.
−2 · 3x = −6x
−2 · (−5) = +10
Resultaat: −6x + 10.`);

v('a15','alg',3,0,
`Werk uit en schrijf zo kort mogelijk: 4(x + 2) − 3(x − 1)`,
[`x + 11`,`x + 5`,`x + 7`,`7x + 11`],
`Haakjes uitwerken: 4x + 8 − 3x + 3. Let op: −3 · (−1) = +3.
Samennemen: 4x − 3x = x en 8 + 3 = 11.
Resultaat: x + 11.`);

v('a16','alg',3,0,
`Bepaal x in de evenredigheid: {{x|3}} = {{8|12}}`,
[`x = 2`,`x = 4`,`x = 32`,`x = 0,5`],
`{{8|12}} kan je vereenvoudigen tot {{2|3}}. Dus x = 2.
Of met de hoofdeigenschap: 12 · x = 3 · 8 = 24, dus x = 2.`,{c:'3*8/12'});

v('a17','alg',3,0,
`Reken uit: (−3a²) · (2a³)`,
[`−6a⁵`,`−6a⁶`,`−a⁵`,`6a⁵`],
`Getallen: −3 · 2 = −6.
Letters: a² · a³ = a<sup>2 + 3</sup> = a⁵. Je telt de exponenten op.
Resultaat: −6a⁵.`);

v('a18','alg',3,0,
`Het n-de getal van een rij vind je met de formule 4n − 1.
Wat is het 10de getal van de rij?`,
[`39`,`41`,`30`,`13`],
`Vervang n door 10: 4 · 10 − 1 = 40 − 1 = 39.`,{c:'4*10-1'});

v('a19','alg',3,0,
`De omtrek van een rechthoek bereken je met P = 2(l + b).
Hoe groot is b als P = 30 en l = 9?`,
[`b = 6`,`b = 12`,`b = 21`,`b = 3`],
`Vul in: 30 = 2(9 + b).
Deel beide leden door 2: 15 = 9 + b.
Dus b = 15 − 9 = 6.`,{c:'30/2-9'});

v('a20','alg',3,0,
`Tim is x jaar. Zijn zus is 4 jaar ouder. Samen zijn ze 30 jaar.
Welke vergelijking past bij deze situatie?`,
[`x + (x + 4) = 30`,`x + 4 = 30`,`4x = 30`,`x + 4x = 30`],
`Tim: x. Zijn zus: x + 4.
Samen: x + (x + 4) = 30.
'4 jaar ouder' is + 4, niet maal 4.`);

v('a21','alg',4,0,
`Werk uit: (x + 3)²`,
[`x² + 6x + 9`,`x² + 9`,`x² + 3x + 9`,`2x + 6`],
`Gebruik het merkwaardig product (a + b)² = a² + 2ab + b².
x² + 2 · x · 3 + 3² = x² + 6x + 9.
Het dubbel product 6x mag je niet vergeten.`);

v('a22','alg',4,0,
`Werk uit: (2a − 5)(2a + 5)`,
[`4a² − 25`,`4a² + 25`,`2a² − 25`,`4a² − 20a − 25`],
`Gebruik het merkwaardig product (a − b)(a + b) = a² − b².
(2a)² − 5² = 4a² − 25.`);

v('a23','alg',4,0,
`Los op: 2(x − 3) = 5x + 9`,
[`x = −5`,`x = 5`,`x = −1`,`x = 1`],
`Haakjes uitwerken: 2x − 6 = 5x + 9.
Termen met x naar links, getallen naar rechts: 2x − 5x = 9 + 6.
−3x = 15, dus x = −5.
Controle: 2 · (−8) = −16 en 5 · (−5) + 9 = −16.`,{c:'(9+6)/(2-5)'});

v('a24','alg',4,0,
`Los op: {{x|2}} + 3 = 7`,
[`x = 8`,`x = 2`,`x = 20`,`x = 5`],
`Trek van beide leden 3 af: {{x|2}} = 4.
Vermenigvuldig beide leden met 2: x = 8.
Controle: 8 : 2 + 3 = 7.`,{c:'(7-3)*2'});

v('a25','alg',4,0,
`Welke rij getallen hoort bij de formule 3n + 2 (met n = 1, 2, 3, 4)?`,
[`5, 8, 11, 14`,`3, 6, 9, 12`,`2, 5, 8, 11`,`5, 7, 9, 11`],
`Vul n in: 3 · 1 + 2 = 5, 3 · 2 + 2 = 8, 3 · 3 + 2 = 11, 3 · 4 + 2 = 14.
De rij begint bij n = 1, niet bij n = 0.`);

v('a26','alg',4,0,
`Zes machines maken een bestelling klaar in 8 uur. Alle machines werken even snel.
Hoelang duurt dezelfde bestelling met 4 machines?`,
[`12 uur`,`5 uur 20 minuten`,`10 uur`,`6 uur`],
`Minder machines betekent meer tijd: de grootheden zijn omgekeerd evenredig.
Het totale werk is 6 · 8 = 48 machine-uren.
Met 4 machines: 48 : 4 = 12 uur.`,{c:'6*8/4'});

v('a27','alg',4,0,
`Werk uit: (x + 2)(x − 5)`,
[`x² − 3x − 10`,`x² − 10`,`x² + 3x − 10`,`x² − 7x − 10`],
`Vermenigvuldig elke term van de eerste factor met elke term van de tweede.
x · x = x², x · (−5) = −5x, 2 · x = 2x, 2 · (−5) = −10.
Samennemen: x² − 5x + 2x − 10 = x² − 3x − 10.`);

v('a28','alg',4,0,
`Een rij begint met 7, 11, 15, 19, …
Welke formule geeft het n-de getal van de rij?`,
[`4n + 3`,`7n + 4`,`n + 4`,`4n + 7`],
`Er komt telkens 4 bij, dus de formule begint met 4n.
Voor n = 1 moet je 7 krijgen: 4 · 1 + 3 = 7.
Controle voor n = 2: 4 · 2 + 3 = 11.`);

v('a29','alg',5,0,
`Los op: {{2x − 1|3}} = {{x + 4|2}}`,
[`x = 14`,`x = 10`,`x = 2`,`x = −14`],
`Vermenigvuldig kruiselings (of beide leden met 6): 2(2x − 1) = 3(x + 4).
4x − 2 = 3x + 12
4x − 3x = 12 + 2
x = 14.
Controle: {{27|3}} = 9 en {{18|2}} = 9.`,{c:'12+2'});

v('a30','alg',5,0,
`Werk uit en schrijf zo kort mogelijk: (x + 4)² − (x − 4)(x + 4)`,
[`8x + 32`,`8x`,`2x² + 8x`,`32`],
`(x + 4)² = x² + 8x + 16.
(x − 4)(x + 4) = x² − 16.
Aftrekken: x² + 8x + 16 − (x² − 16) = x² + 8x + 16 − x² + 16 = 8x + 32.
Het minteken vóór de haakjes verandert beide tekens.`);

v('a31','alg',5,0,
`De som van drie opeenvolgende natuurlijke getallen is 81.
Wat is het grootste van de drie getallen?`,
[`28`,`27`,`26`,`29`],
`Noem het kleinste getal x. De getallen zijn x, x + 1 en x + 2.
x + x + 1 + x + 2 = 81, dus 3x + 3 = 81 en x = 26.
De getallen zijn 26, 27 en 28. Het grootste is 28.`,{c:'(81-3)/3+2'});

v('a32','alg',5,0,
`De oppervlakte van een driehoek is A = {{b · h|2}}.
Welke formule geeft de hoogte h?`,
[`h = {{2A|b}}`,`h = {{A|2b}}`,`h = {{A · b|2}}`,`h = 2A − b`],
`Vermenigvuldig beide leden met 2: 2A = b · h.
Deel beide leden door b: h = {{2A|b}}.`);

v('a33','alg',5,0,
`Los op: 5 − 2(x + 1) = 3(x − 4)`,
[`x = 3`,`x = −3`,`x = 15`,`x = {{19|5}}`],
`Haakjes uitwerken: 5 − 2x − 2 = 3x − 12.
Samennemen: 3 − 2x = 3x − 12.
−2x − 3x = −12 − 3, dus −5x = −15 en x = 3.
Controle: 5 − 2 · 4 = −3 en 3 · (−1) = −3.`,{c:'(-12-3)/(-5)'});

v('a34','alg',5,0,
`De vergelijking 3x + a = 11 heeft als oplossing x = 2.
Welke waarde heeft a?`,
[`a = 5`,`a = 9`,`a = 17`,`a = 3`],
`Vul de oplossing in: 3 · 2 + a = 11.
6 + a = 11, dus a = 5.`,{c:'11-3*2'});

// Vragendatabank - MEETKUNDE (eigenschappen, objecten en relaties, omtrek/oppervlakte/inhoud, transformaties)

v('m01','mee',0,1,
`Welke figuur heeft 4 even lange zijden en 4 rechte hoeken?`,
[`een vierkant`,`een rechthoek`,`een ruit`,`een trapezium`],
`Een vierkant heeft 4 even lange zijden en 4 rechte hoeken.
Een rechthoek heeft wel 4 rechte hoeken, maar niet altijd 4 even lange zijden. Een ruit heeft 4 even lange zijden, maar niet altijd rechte hoeken.`);

v('m02','mee',0,1,
`Hoeveel graden meet een rechte hoek?`,
[`90°`,`45°`,`180°`,`360°`],
`Een rechte hoek meet 90°. Je ziet hem in de hoek van een blad papier.
180° is een gestrekte hoek, 360° is een volle hoek.`);

v('m03','mee',0,1,
`Een vierkant heeft een zijde van 5 cm.
Wat is de omtrek van het vierkant?`,
[`20 cm`,`25 cm`,`10 cm`,`15 cm`],
`De omtrek is de som van alle zijden. Een vierkant heeft 4 gelijke zijden.
4 × 5 = 20 cm. (25 is de oppervlakte in cm².)`,{c:'4*5'});

v('m04','mee',0,1,
`Welke ruimtefiguur heeft de vorm van een dobbelsteen?`,
[`een kubus`,`een cilinder`,`een bol`,`een piramide`],
`Een dobbelsteen heeft 6 gelijke vierkante zijvlakken. Dat is een kubus.`);

v('m05','mee',0,1,
`Hoeveel centimeter is 1 meter?`,
[`100 cm`,`10 cm`,`1000 cm`,`60 cm`],
`1 meter = 10 dm = 100 cm.`);

v('m06','mee',1,2,
`Een rechthoek is 6 cm lang en 4 cm breed.
Wat is de oppervlakte?`,
[`24 cm²`,`20 cm²`,`10 cm²`,`48 cm²`],
`Oppervlakte rechthoek = lengte × breedte = 6 × 4 = 24 cm².
(20 cm is de omtrek.)`,{c:'6*4'});

v('m07','mee',1,2,
`Hoe noem je een hoek van 130°?`,
[`een stompe hoek`,`een scherpe hoek`,`een rechte hoek`,`een gestrekte hoek`],
`Een scherpe hoek is kleiner dan 90°. Een rechte hoek is 90°.
Een stompe hoek ligt tussen 90° en 180°. 130° is dus een stompe hoek.`);

v('m08','mee',1,2,
`Wat zijn de coördinaten van punt P?`,
[`(3, 2)`,`(2, 3)`,`(3, 3)`,`(2, 2)`],
`Lees eerst af op de horizontale as (x): 3. Daarna op de verticale as (y): 2.
De coördinaten zijn (3, 2). De volgorde is belangrijk: eerst x, dan y.`,{fig:'rooster'});

v('m09','mee',1,2,
`Hoe noem je een driehoek met drie even lange zijden?`,
[`een gelijkzijdige driehoek`,`een gelijkbenige driehoek`,`een rechthoekige driehoek`,`een ongelijkbenige driehoek`],
`Drie even lange zijden: gelijkzijdig.
Een gelijkbenige driehoek heeft (minstens) twee even lange zijden.`);

v('m11','mee',1,2,
`Twee rechten in een vlak snijden elkaar nooit, hoe ver je ze ook verlengt.
Hoe noem je die rechten?`,
[`evenwijdige rechten`,`loodrechte rechten`,`snijdende rechten`,`gelijke rechten`],
`Rechten die elkaar nooit snijden, liggen overal even ver van elkaar. Het zijn evenwijdige rechten.
Loodrechte rechten snijden elkaar onder een hoek van 90°.`);

v('m10','mee',2,3,
`Een kubus heeft een ribbe van 3 cm.
Wat is het volume (de inhoud) van de kubus?`,
[`27 cm³`,`9 cm³`,`18 cm³`,`54 cm³`],
`Volume kubus = ribbe × ribbe × ribbe = 3 × 3 × 3 = 27 cm³.
(54 cm² is de totale oppervlakte van de zes zijvlakken.)`,{c:'3**3'});

v('m12','mee',2,3,
`Hoeveel symmetrieassen heeft een vierkant?`,
[`4`,`2`,`1`,`8`],
`Een vierkant heeft 4 symmetrieassen: de 2 diagonalen en de 2 rechten door de middens van de overstaande zijden.`);

v('m13','mee',2,3,
`Twee hoeken van een driehoek meten 50° en 60°.
Hoe groot is de derde hoek?`,
[`70°`,`110°`,`250°`,`80°`],
`De som van de hoeken van een driehoek is 180°.
50° + 60° = 110°. De derde hoek is 180° − 110° = 70°.`,{c:'180-50-60'});

v('m14','mee',2,3,
`Een driehoek heeft een basis van 8 cm en een bijhorende hoogte van 5 cm.
Wat is de oppervlakte?`,
[`20 cm²`,`40 cm²`,`13 cm²`,`26 cm²`],
`Oppervlakte driehoek = {{basis × hoogte|2}} = {{8 × 5|2}} = {{40|2}} = 20 cm².
Vergeet niet te delen door 2.`,{c:'8*5/2'});

v('m15','mee',2,3,
`Een balk is 5 cm lang, 4 cm breed en 3 cm hoog.
Wat is het volume van de balk?`,
[`60 cm³`,`12 cm³`,`47 cm³`,`94 cm³`],
`Volume balk = lengte × breedte × hoogte = 5 × 4 × 3 = 60 cm³.`,{c:'5*4*3'});

v('m18','mee',2,3,
`Welke vierhoek heeft precies één paar evenwijdige zijden?`,
[`een trapezium`,`een parallellogram`,`een ruit`,`een rechthoek`],
`Een trapezium heeft één paar evenwijdige zijden.
Een parallellogram, een ruit en een rechthoek hebben twee paar evenwijdige zijden.`);

v('m16','mee',3,4,
`De figuur heeft alleen rechte hoeken.
Wat is de omtrek van de figuur?`,
[`28 cm`,`21 cm`,`24 cm`,`48 cm`],
`Twee zijden zijn niet gegeven. Je kan ze afleiden.
De korte horizontale zijde: 8 − 4 = 4 cm. De korte verticale zijde: 6 − 3 = 3 cm.
Omtrek: 8 + 3 + 4 + 3 + 4 + 6 = 28 cm.
(De omtrek is even groot als die van een rechthoek van 8 cm op 6 cm.)`,{fig:'lvorm', c:'8+3+4+3+4+6'});

v('m17','mee',3,4,
`Zet om: 4500 cm³ = … liter`,
[`4,5 liter`,`45 liter`,`0,45 liter`,`450 liter`],
`1 liter = 1 dm³ = 1000 cm³.
4500 : 1000 = 4,5 liter.`,{c:'4500/1000'});

v('m19','mee',3,0,
`Punt A(2, 5) wordt gespiegeld om de x-as.
Wat zijn de coördinaten van het spiegelbeeld?`,
[`(2, −5)`,`(−2, 5)`,`(−2, −5)`,`(5, 2)`],
`Bij een spiegeling om de x-as blijft de x-coördinaat gelijk en krijgt de y-coördinaat het tegengestelde teken.
(2, 5) wordt (2, −5).`);

v('m20','mee',3,4,
`Een cirkel heeft een straal van 5 cm. Gebruik π ≈ 3,14.
Wat is de omtrek van de cirkel?`,
[`31,4 cm`,`15,7 cm`,`78,5 cm`,`10 cm`],
`Omtrek cirkel = 2 × π × straal = 2 × 3,14 × 5 = 31,4 cm.
(78,5 cm² is de oppervlakte, 15,7 is π × straal.)`,{calc:1,c:'2*3.14*5'});

v('m21','mee',3,0,
`De rechten a en b zijn evenwijdig. Hoek 1 meet 65°.
Hoe groot is hoek 2?`,
[`65°`,`115°`,`25°`,`130°`],
`Hoek 1 en hoek 2 liggen op dezelfde plaats ten opzichte van de snijlijn en de evenwijdige rechten: het zijn overeenkomstige hoeken.
Overeenkomstige hoeken bij evenwijdige rechten zijn even groot. Hoek 2 = 65°.`,{fig:'evenwijdig'});

v('m22','mee',3,5,
`In een gelijkbenige driehoek meet de tophoek 40°.
Hoe groot is elke basishoek?`,
[`70°`,`140°`,`40°`,`100°`],
`De hoekensom is 180°. Voor de twee basishoeken blijft 180° − 40° = 140° over.
De basishoeken zijn even groot: 140° : 2 = 70°.`,{c:'(180-40)/2'});

v('m23','mee',3,4,
`Een parallellogram heeft een basis van 9 cm en een bijhorende hoogte van 4 cm.
Wat is de oppervlakte?`,
[`36 cm²`,`18 cm²`,`26 cm²`,`13 cm²`],
`Oppervlakte parallellogram = basis × hoogte = 9 × 4 = 36 cm².
Hier deel je niet door 2 (dat doe je bij een driehoek).`,{c:'9*4'});

v('m24','mee',3,0,
`Met welke drie lengtes kan je een driehoek tekenen?`,
[`4 cm, 5 cm en 8 cm`,`2 cm, 3 cm en 6 cm`,`1 cm, 2 cm en 3 cm`,`3 cm, 4 cm en 9 cm`],
`In een driehoek is elke zijde korter dan de som van de twee andere zijden (driehoeksongelijkheid).
4 + 5 = 9 en 9 is groter dan 8: dat kan.
2 + 3 = 5 is kleiner dan 6, 1 + 2 = 3 is niet groter dan 3, 3 + 4 = 7 is kleiner dan 9: die kunnen niet.`);

v('m25','mee',3,4,
`Een aquarium is 60 cm lang, 30 cm breed en 40 cm hoog.
Hoeveel liter water kan er hoogstens in?`,
[`72 liter`,`720 liter`,`7200 liter`,`130 liter`],
`Volume = 60 × 30 × 40 = 72 000 cm³.
1 liter = 1000 cm³, dus 72 000 : 1000 = 72 liter.`,{calc:1,c:'60*30*40/1000'});

v('m39','mee',3,0,
`Wat is de middelloodlijn van een lijnstuk [AB]?`,
[`de rechte die loodrecht op [AB] staat en door het midden van [AB] gaat`,`de rechte door A die loodrecht op [AB] staat`,`de rechte die een hoek in twee gelijke hoeken verdeelt`,`de rechte door het midden van [AB] die evenwijdig is met [AB]`],
`Het woord zegt het zelf: middel (door het midden) en lood (loodrecht).
De rechte die een hoek in twee gelijke hoeken verdeelt, is de bissectrice.`);

v('m26','mee',4,5,
`Een cirkelvormig terras heeft een diameter van 6 m. Gebruik π ≈ 3,14.
Wat is de oppervlakte van het terras, afgerond op 1 m²?`,
[`28 m²`,`113 m²`,`19 m²`,`9 m²`],
`De straal is de helft van de diameter: 3 m.
Oppervlakte cirkel = π × straal² = 3,14 × 3 × 3 = 28,26 m², afgerond 28 m².
(113 krijg je als je met de diameter rekent in plaats van met de straal, 19 is de omtrek.)`,{calc:1,c:'Math.round(3.14*3*3)'});

v('m27','mee',4,5,
`Van een rechthoek van 10 cm op 6 cm wordt een hoek afgeknipt. Het afgeknipte stuk is een rechthoekige driehoek met rechthoekszijden van 4 cm en 3 cm.
Wat is de oppervlakte van de figuur die overblijft?`,
[`54 cm²`,`48 cm²`,`66 cm²`,`53 cm²`],
`Oppervlakte rechthoek: 10 × 6 = 60 cm².
Oppervlakte afgeknipte driehoek: {{4 × 3|2}} = 6 cm².
Wat overblijft: 60 − 6 = 54 cm².`,{fig:'hoek', c:'10*6-4*3/2'});

v('m35','mee',4,5,
`De omtrek van een vierkant is 36 cm.
Wat is de oppervlakte van dat vierkant?`,
[`81 cm²`,`144 cm²`,`324 cm²`,`72 cm²`],
`Een vierkant heeft 4 gelijke zijden. Zijde = 36 : 4 = 9 cm.
Oppervlakte = 9 × 9 = 81 cm².`,{c:'(36/4)**2'});

v('m28','mee',4,0,
`Een trapezium heeft evenwijdige zijden van 12 cm en 8 cm. De hoogte is 5 cm.
Wat is de oppervlakte?`,
[`50 cm²`,`100 cm²`,`480 cm²`,`25 cm²`],
`Oppervlakte trapezium = {{(grote basis + kleine basis) × hoogte|2}} = {{(12 + 8) × 5|2}} = {{100|2}} = 50 cm².`,{c:'(12+8)*5/2'});

v('m29','mee',4,0,
`Punt P(−3, 4) wordt verschoven: 5 eenheden naar rechts en 6 eenheden naar beneden.
Wat zijn de coördinaten van het beeld van P?`,
[`(2, −2)`,`(−8, 10)`,`(2, 10)`,`(−8, −2)`],
`Naar rechts: de x-coördinaat wordt groter: −3 + 5 = 2.
Naar beneden: de y-coördinaat wordt kleiner: 4 − 6 = −2.
Het beeld is (2, −2).`);

v('m30','mee',4,0,
`Punt A(3, −2) wordt gespiegeld om de oorsprong (een puntspiegeling).
Wat zijn de coördinaten van het beeld?`,
[`(−3, 2)`,`(3, 2)`,`(−3, −2)`,`(−2, 3)`],
`Bij een puntspiegeling om de oorsprong krijgen beide coördinaten het tegengestelde teken.
(3, −2) wordt (−3, 2).`);

v('m31','mee',4,0,
`Een ruit heeft diagonalen van 10 cm en 6 cm.
Wat is de oppervlakte van de ruit?`,
[`30 cm²`,`60 cm²`,`16 cm²`,`32 cm²`],
`Oppervlakte ruit = {{grote diagonaal × kleine diagonaal|2}} = {{10 × 6|2}} = 30 cm².`,{c:'10*6/2'});

v('m32','mee',4,0,
`In driehoek ABC meet hoek A 35° en hoek B 75°.
Hoe groot is de buitenhoek bij hoekpunt C?`,
[`110°`,`70°`,`145°`,`105°`],
`Hoek C = 180° − 35° − 75° = 70°.
De buitenhoek is het supplement van hoek C: 180° − 70° = 110°.
Sneller: een buitenhoek is gelijk aan de som van de twee niet-aanliggende binnenhoeken: 35° + 75° = 110°.`,{c:'35+75'});

v('m33','mee',4,0,
`Een cilinder heeft een straal van 4 cm en een hoogte van 10 cm. Gebruik π ≈ 3,14.
Wat is het volume, afgerond op 1 cm³?`,
[`502 cm³`,`126 cm³`,`251 cm³`,`160 cm³`],
`Volume cilinder = oppervlakte grondvlak × hoogte = π × straal² × hoogte.
3,14 × 4 × 4 × 10 = 502,4 cm³, afgerond 502 cm³.`,{calc:1,c:'Math.round(3.14*16*10)'});

v('m34','mee',4,0,
`Welke uitspraak over de diagonalen van een rechthoek is altijd juist?`,
[`Ze zijn even lang en delen elkaar middendoor.`,`Ze staan loodrecht op elkaar.`,`Ze zijn symmetrieassen van de rechthoek.`,`Ze verdelen de hoeken van de rechthoek in twee gelijke hoeken.`],
`In elke rechthoek zijn de diagonalen even lang en snijden ze elkaar in hun midden.
Loodrecht op elkaar staan ze alleen bij een vierkant (en bij een ruit). Ook de andere uitspraken gelden alleen voor een vierkant.`);

v('m36','mee',5,0,
`De totale oppervlakte van een kubus is 150 cm².
Wat is het volume van de kubus?`,
[`125 cm³`,`25 cm³`,`750 cm³`,`900 cm³`],
`Een kubus heeft 6 gelijke zijvlakken. Eén zijvlak: 150 : 6 = 25 cm².
De ribbe is dan 5 cm, want 5 × 5 = 25.
Volume: 5 × 5 × 5 = 125 cm³.`,{c:'Math.sqrt(150/6)**3'});

v('m37','mee',5,0,
`Van een rechthoek worden de lengte en de breedte allebei verdubbeld.
Wat gebeurt er met de oppervlakte?`,
[`De oppervlakte wordt 4 keer zo groot.`,`De oppervlakte wordt 2 keer zo groot.`,`De oppervlakte wordt 8 keer zo groot.`,`De oppervlakte blijft gelijk.`],
`Nieuwe oppervlakte = (2 · l) · (2 · b) = 4 · l · b.
Voorbeeld: 3 cm op 2 cm geeft 6 cm². 6 cm op 4 cm geeft 24 cm². Dat is 4 keer zoveel.`);

v('m38','mee',5,0,
`Twee driehoeken hebben elk een zijde van 5 cm, een zijde van 7 cm en een hoek van 40° tussen die twee zijden.
Wat weet je zeker over deze twee driehoeken?`,
[`Ze zijn congruent volgens het kenmerk ZHZ.`,`Ze zijn congruent volgens het kenmerk ZZZ.`,`Ze zijn congruent volgens het kenmerk HZH.`,`Ze zijn niet noodzakelijk congruent.`],
`Je kent twee zijden en de hoek die door die twee zijden wordt ingesloten: zijde – hoek – zijde.
Dat is het congruentiekenmerk ZHZ, dus de driehoeken zijn congruent.`);

v('m40','mee',5,0,
`Een rechthoekige tuin is 12 m lang en 8 m breed. In de tuin ligt een cirkelvormige vijver met een diameter van 4 m. De rest van de tuin is gras. Gebruik π ≈ 3,14.
Hoeveel m² gras is er, afgerond op 1 m²?`,
[`83 m²`,`46 m²`,`71 m²`,`109 m²`],
`Oppervlakte tuin: 12 × 8 = 96 m².
Straal vijver: 4 : 2 = 2 m. Oppervlakte vijver: 3,14 × 2 × 2 = 12,56 m².
Gras: 96 − 12,56 = 83,44 m², afgerond 83 m².`,{calc:1,c:'Math.round(12*8-3.14*2*2)'});

v('m41','mee',5,0,
`In een parallellogram ABCD is hoek A drie keer zo groot als hoek B.
Hoe groot is hoek A?`,
[`135°`,`45°`,`120°`,`270°`],
`In een parallellogram zijn twee opeenvolgende hoeken samen 180°.
Hoek A = 3 · hoek B, dus 3 · B + B = 180° en B = 45°.
Hoek A = 3 · 45° = 135°.`,{c:'180/4*3'});

v('m42','mee',5,0,
`Een figuur wordt over 180° gedraaid om punt O.
Met welke transformatie krijg je altijd hetzelfde beeld?`,
[`een puntspiegeling om O`,`een spiegeling om een rechte door O`,`een verschuiving`,`een draaiing over 90° om O`],
`Bij een draaiing over 180° komt elk punt recht tegenover zijn oorspronkelijke plaats te liggen, even ver van O.
Dat is precies wat een puntspiegeling om O doet.`);

// Vragendatabank - STATISTIEK, TABELLEN EN DIAGRAMMEN

v('s01','sta',0,1,
`Het staafdiagram toont hoeveel boeken vijf leerlingen dit trimester lazen.
Wie las het minste boeken?`,
[`Cem`,`Anna`,`Dries`,`Ben`],
`Zoek de laagste staaf. Dat is de staaf van Cem: 2 boeken.`,{fig:'boeken'});

v('s34','sta',0,1,
`Het staafdiagram toont hoeveel boeken vijf leerlingen dit trimester lazen.
Hoeveel boeken las Ben?`,
[`7`,`5`,`4`,`2`],
`Zoek de staaf van Ben en lees de hoogte af op de verticale as: 7 boeken.`,{fig:'boeken'});

v('s04','sta',0,1,
`De tabel toont de lievelingssport van de leerlingen van klas 2A.
Hoeveel leerlingen kozen zwemmen?`,
[`5`,`6`,`3`,`9`],
`Zoek de rij 'Zwemmen' in de tabel en lees het aantal af: 5.`,{fig:'sport'});

v('s30','sta',0,1,
`De tabel toont het aantal jongens en meisjes in drie klassen.
Hoeveel meisjes zitten er in klas 2B?`,
[`14`,`9`,`10`,`23`],
`Zoek de rij van klas 2B en de kolom 'Meisjes'. Waar ze elkaar kruisen, staat 14.`,{fig:'klassen'});

v('s35','sta',0,1,
`Het cirkeldiagram toont hoe de leerlingen van een school naar school komen.
Welk vervoermiddel wordt het minst gebruikt?`,
[`te voet`,`de auto`,`de bus`,`de fiets`],
`Zoek het kleinste stuk van de cirkel: 'te voet' met 10 %.`,{fig:'vervoer'});

v('s02','sta',1,2,
`Het staafdiagram toont hoeveel boeken vijf leerlingen dit trimester lazen.
Hoeveel boeken lazen Anna en Dries samen?`,
[`9`,`4`,`5`,`11`],
`Anna las 4 boeken en Dries 5 boeken.
4 + 5 = 9.`,{fig:'boeken',c:'4+5'});

v('s05','sta',1,2,
`De tabel toont de lievelingssport van de leerlingen van klas 2A. Elke leerling koos één sport.
Hoeveel leerlingen zitten er in klas 2A?`,
[`25`,`5`,`9`,`23`],
`Tel alle aantallen op: 9 + 6 + 5 + 3 + 2 = 25.`,{fig:'sport',c:'9+6+5+3+2'});

v('s06','sta',1,2,
`De tabel toont de lievelingssport van de leerlingen van klas 2A. Elke leerling koos één sport.
Hoeveel leerlingen kozen een andere sport dan voetbal?`,
[`16`,`9`,`2`,`25`],
`Tel alle aantallen op behalve dat van voetbal: 6 + 5 + 3 + 2 = 16.
'Andere' (2) is maar één van de rijen.`,{fig:'sport',c:'6+5+3+2'});

v('s08','sta',1,2,
`Het lijndiagram toont de temperatuur om 12 uur 's middags gedurende één week.
Op welke dag was het het warmst?`,
[`vrijdag`,`donderdag`,`zaterdag`,`woensdag`],
`Zoek het hoogste punt van de lijn. Dat ligt bij vrijdag: 19 °C.`,{fig:'temp'});

v('s12','sta',1,2,
`Het cirkeldiagram toont hoe de leerlingen van een school naar school komen.
Welk vervoermiddel wordt het meest gebruikt?`,
[`de fiets`,`de bus`,`de auto`,`te voet`],
`Zoek het grootste stuk van de cirkel: de fiets met 45 %.`,{fig:'vervoer'});

v('s03','sta',2,3,
`Het staafdiagram toont hoeveel boeken vijf leerlingen dit trimester lazen.
Hoeveel boeken lazen de vijf leerlingen gemiddeld?`,
[`5`,`7`,`4`,`25`],
`Gemiddelde = som van alle waarden gedeeld door het aantal waarden.
Som: 4 + 7 + 2 + 5 + 7 = 25. Aantal leerlingen: 5.
25 : 5 = 5 boeken.`,{fig:'boeken',c:'(4+7+2+5+7)/5'});

v('s09','sta',2,3,
`Het lijndiagram toont de temperatuur om 12 uur 's middags gedurende één week.
Tussen welke twee opeenvolgende dagen steeg de temperatuur het meest?`,
[`tussen woensdag en donderdag`,`tussen maandag en dinsdag`,`tussen donderdag en vrijdag`,`tussen dinsdag en woensdag`],
`Zoek het steilste stijgende stuk van de lijn.
Van woensdag (13 °C) naar donderdag (18 °C): 5 graden erbij.
Maandag naar dinsdag: 2 graden erbij. Donderdag naar vrijdag: 1 graad erbij. Van dinsdag naar woensdag daalt de temperatuur.`,{fig:'temp'});

v('s13','sta',2,3,
`Het cirkeldiagram toont hoe de 200 leerlingen van een school naar school komen.
Hoeveel leerlingen komen met de bus?`,
[`50`,`25`,`75`,`100`],
`25 % van de leerlingen komt met de bus. 25 % is één vierde.
200 : 4 = 50 leerlingen. (25 is het percentage, niet het aantal.)`,{fig:'vervoer',c:'0.25*200'});

v('s16','sta',2,3,
`Vijf leerlingen halen deze scores op 10: 6, 8, 5, 9 en 7.
Wat is de gemiddelde score?`,
[`7`,`35`,`5`,`8`],
`Som: 6 + 8 + 5 + 9 + 7 = 35.
Gemiddelde: 35 : 5 = 7.`,{c:'(6+8+5+9+7)/5'});

v('s17','sta',2,0,
`Gegeven de getallen: 3, 5, 5, 6, 8, 8, 8, 9.
Wat is de modus?`,
[`8`,`5`,`7`,`6,5`],
`De modus is de waarde die het vaakst voorkomt.
8 komt drie keer voor, 5 twee keer, de andere één keer. De modus is 8.`);

v('s25','sta',2,3,
`De tabel toont hoeveel broers en zussen de leerlingen van een klas hebben.
Hoeveel leerlingen hebben meer dan 1 broer of zus?`,
[`11`,`21`,`6`,`10`],
`Meer dan 1 betekent 2, 3 of 4 broers en zussen.
6 + 3 + 2 = 11 leerlingen. De 10 leerlingen met precies 1 broer of zus tellen niet mee.`,{fig:'broers',c:'6+3+2'});

v('s29','sta',2,3,
`Aan 50 leerlingen werd gevraagd of ze een huisdier hebben. 20 leerlingen antwoordden 'ja'.
Hoeveel procent van de leerlingen antwoordde 'ja'?`,
[`40 %`,`20 %`,`30 %`,`70 %`],
`{{20|50}} = {{40|100}} (teller en noemer maal 2). Dat is 40 %.`,{c:'20/50*100'});

v('s31','sta',2,3,
`De tabel toont het aantal jongens en meisjes in drie klassen.
Hoeveel leerlingen zitten er in de drie klassen samen?`,
[`67`,`32`,`35`,`66`],
`Tel alle getallen op: 12 + 10 + 9 + 14 + 11 + 11 = 67.
(32 is alleen het aantal jongens, 35 alleen het aantal meisjes.)`,{fig:'klassen',c:'12+10+9+14+11+11'});

v('s32','sta',2,3,
`De tabel toont het aantal jongens en meisjes in drie klassen.
In welke klas is het verschil tussen het aantal jongens en het aantal meisjes het grootst?`,
[`in klas 2B`,`in klas 2A`,`in klas 2C`,`het verschil is overal even groot`],
`2A: 12 − 10 = 2. 2B: 14 − 9 = 5. 2C: 11 − 11 = 0.
Het verschil is het grootst in klas 2B.`,{fig:'klassen'});

v('s07','sta',3,4,
`De tabel toont de lievelingssport van de 25 leerlingen van klas 2A.
Hoeveel procent van de klas koos dans?`,
[`24 %`,`6 %`,`25 %`,`30 %`],
`6 van de 25 leerlingen kozen dans.
{{6|25}} = {{24|100}} (teller en noemer maal 4). Dat is 24 %.`,{fig:'sport',c:'6/25*100'});

v('s10','sta',3,4,
`Het lijndiagram toont de temperatuur om 12 uur 's middags gedurende één week.
Wat is het verschil tussen de hoogste en de laagste temperatuur van de week?`,
[`6 °C`,`5 °C`,`1 °C`,`32 °C`],
`Hoogste temperatuur: 19 °C (vrijdag). Laagste temperatuur: 13 °C (woensdag).
19 − 13 = 6 °C. Dit verschil noemen we de variatiebreedte.`,{fig:'temp',c:'19-13'});

v('s14','sta',3,4,
`Het cirkeldiagram toont hoe de 200 leerlingen van een school naar school komen.
Hoeveel leerlingen komen niet met de fiets?`,
[`110`,`55`,`90`,`45`],
`45 % komt met de fiets, dus 100 % − 45 % = 55 % komt niet met de fiets.
55 % van 200 = 110 leerlingen. (90 leerlingen komen wel met de fiets.)`,{fig:'vervoer',c:'0.55*200'});

v('s39','sta',3,4,
`Het cirkeldiagram toont hoe de 200 leerlingen van een school naar school komen.
Hoeveel leerlingen komen met de bus of te voet?`,
[`70`,`35`,`60`,`50`],
`Bus: 25 %. Te voet: 10 %. Samen 35 %.
35 % van 200 = 70 leerlingen.`,{fig:'vervoer',c:'0.35*200'});

v('s18','sta',3,0,
`Vijf leerlingen halen de volgende scores op 20: 12, 15, 15, 17 en 19.
Wat is de mediaan van deze scores?`,
[`15`,`15,6`,`16`,`17`],
`De getallen staan al in stijgende volgorde. De mediaan is het middelste getal.
Bij 5 getallen is dat het 3de getal: 15.
(15,6 is het gemiddelde, niet de mediaan.)`);

v('s28','sta',3,0,
`De tabel toont hoeveel broers en zussen de leerlingen van een klas hebben.
Wat is de modus?`,
[`1`,`10`,`4`,`2`],
`De modus is de waarde met de grootste frequentie.
'1 broer of zus' komt het vaakst voor (10 leerlingen). De modus is dus 1, niet 10: 10 is de frequentie.`,{fig:'broers'});

v('s11','sta',4,5,
`Het lijndiagram toont de temperatuur om 12 uur 's middags gedurende één week.
Wat is de gemiddelde temperatuur van deze week?`,
[`16 °C`,`15 °C`,`17 °C`,`16,5 °C`],
`Lees de zeven temperaturen af: 14, 16, 13, 18, 19, 17 en 15.
Som: 112. Gemiddelde: 112 : 7 = 16 °C.`,{fig:'temp',calc:1,c:'(14+16+13+18+19+17+15)/7'});

v('s20','sta',4,5,
`Lena haalde op drie toetsen 12, 15 en 14 op 20.
Hoeveel moet ze op de vierde toets halen om een gemiddelde van 15 op 20 te hebben?`,
[`19`,`15`,`16`,`17`],
`Voor een gemiddelde van 15 op vier toetsen heeft ze samen 4 × 15 = 60 punten nodig.
Ze heeft er al 12 + 15 + 14 = 41.
Ze moet dus nog 60 − 41 = 19 halen.`,{c:'4*15-(12+15+14)'});

v('s33','sta',4,5,
`De tabel toont het aantal jongens en meisjes in drie klassen.
Hoeveel procent van alle leerlingen zit in klas 2B? Rond af op 1 %.`,
[`34 %`,`23 %`,`14 %`,`43 %`],
`In 2B zitten 9 + 14 = 23 leerlingen. In totaal zijn er 67 leerlingen.
23 : 67 = 0,343…, afgerond 34 %.`,{fig:'klassen',calc:1,c:'Math.round((9+14)/67*100)'});

v('s36','sta',4,5,
`Het lijndiagram toont de temperatuur om 12 uur 's middags gedurende één week. De gemiddelde temperatuur van die week is 16 °C.
Op hoeveel dagen was het warmer dan het gemiddelde?`,
[`op 3 dagen`,`op 4 dagen`,`op 2 dagen`,`op 5 dagen`],
`Zoek de punten die boven 16 °C liggen: donderdag (18 °C), vrijdag (19 °C) en zaterdag (17 °C).
Dinsdag is het precies 16 °C: dat is niet warmer dan het gemiddelde. Het zijn dus 3 dagen.`,{fig:'temp'});

v('s15','sta',4,0,
`Het cirkeldiagram toont hoe de leerlingen van een school naar school komen.
Hoe groot is de middelpuntshoek van de sector 'Auto'?`,
[`72°`,`20°`,`36°`,`90°`],
`Een volledige cirkel is 360°. De sector 'Auto' is 20 % van de cirkel.
20 % van 360° = 72°.`,{fig:'vervoer',c:'0.2*360'});

v('s19','sta',4,0,
`Gegeven de getallen: 4, 9, 2, 7, 5, 10.
Wat is de mediaan?`,
[`6`,`4,5`,`5`,`7`],
`Rangschik eerst van klein naar groot: 2, 4, 5, 7, 9, 10.
Bij een even aantal getallen is de mediaan het gemiddelde van de twee middelste: {{5 + 7|2}} = 6.`,{c:'(5+7)/2'});

v('s22','sta',4,0,
`Het gemiddelde van vijf getallen is 12. Vier van de getallen zijn 8, 10, 13 en 15.
Wat is het vijfde getal?`,
[`14`,`12`,`11,5`,`16`],
`De som van de vijf getallen is 5 × 12 = 60.
De vier bekende getallen samen: 8 + 10 + 13 + 15 = 46.
Het vijfde getal is 60 − 46 = 14.`,{c:'5*12-(8+10+13+15)'});

v('s26','sta',4,0,
`De tabel toont hoeveel broers en zussen de 25 leerlingen van een klas hebben.
Hoeveel broers en zussen hebben de leerlingen gemiddeld?`,
[`1,56`,`2`,`5`,`1`],
`Vermenigvuldig elke waarde met haar frequentie en tel op:
0 · 4 + 1 · 10 + 2 · 6 + 3 · 3 + 4 · 2 = 0 + 10 + 12 + 9 + 8 = 39.
Deel door het aantal leerlingen: 39 : 25 = 1,56.`,{fig:'broers',calc:1,c:'(0*4+1*10+2*6+3*3+4*2)/25'});

v('s37','sta',4,0,
`Winkel A verkocht 95 fietsen en winkel B verkocht 100 fietsen. In een staafdiagram hierover begint de verticale as bij 90 in plaats van bij 0.
Wat is het gevolg?`,
[`Het verschil tussen A en B lijkt veel groter dan het in werkelijkheid is.`,`Het verschil tussen A en B lijkt kleiner dan het in werkelijkheid is.`,`De twee staven worden even hoog.`,`De aantallen die je afleest, zijn niet meer juist.`],
`De staaf van A is 5 eenheden hoog (van 90 tot 95), die van B 10 eenheden (van 90 tot 100).
B lijkt dus dubbel zoveel te verkopen als A, terwijl het verschil maar 5 fietsen op 100 is. Een as die niet bij 0 begint, kan misleiden.`);

v('s21','sta',5,0,
`Een voetbalploeg van 11 spelers heeft een gemiddelde leeftijd van 24 jaar. Een speler van 35 jaar wordt vervangen door een speler van 13 jaar.
Wat is de nieuwe gemiddelde leeftijd van de ploeg?`,
[`22 jaar`,`24 jaar`,`23 jaar`,`13 jaar`],
`Som van de leeftijden: 11 × 24 = 264 jaar.
Na de wissel: 264 − 35 + 13 = 242 jaar.
Nieuw gemiddelde: 242 : 11 = 22 jaar.`,{calc:1,c:'(11*24-35+13)/11'});

v('s23','sta',5,0,
`In klas A (20 leerlingen) is de gemiddelde score op een toets 14. In klas B (30 leerlingen) is de gemiddelde score 12.
Wat is de gemiddelde score van alle leerlingen samen?`,
[`12,8`,`13`,`12,5`,`26`],
`Je mag de twee gemiddelden niet zomaar middelen, want de klassen zijn niet even groot.
Punten klas A: 20 × 14 = 280. Punten klas B: 30 × 12 = 360.
Samen: 640 punten voor 50 leerlingen. 640 : 50 = 12,8.`,{calc:1,c:'(20*14+30*12)/50'});

v('s24','sta',5,0,
`Bij de gegevens 3, 5, 6, 8, 8 komt een zesde waarneming: 30.
Welk kengetal verandert daardoor het meest?`,
[`het gemiddelde`,`de mediaan`,`de modus`,`ze veranderen alle drie even veel`],
`Vóór: gemiddelde {{30|5}} = 6, mediaan 6, modus 8.
Na: gemiddelde {{60|6}} = 10, mediaan {{6 + 8|2}} = 7, modus 8.
Het gemiddelde stijgt met 4, de mediaan met 1 en de modus blijft gelijk. Een uitschieter beïnvloedt vooral het gemiddelde.`);

v('s27','sta',5,0,
`De tabel toont hoeveel broers en zussen de 25 leerlingen van een klas hebben.
Wat is de mediaan?`,
[`1`,`2`,`3`,`6`],
`Bij 25 waarnemingen is de mediaan de 13de waarneming als je ze rangschikt.
De eerste 4 leerlingen hebben 0 broers of zussen, leerling 5 tot en met 14 hebben er 1.
De 13de waarneming is dus 1.`,{fig:'broers'});

v('s38','sta',5,0,
`Na vijf toetsen heeft Milan een gemiddelde van 13 op 20. Na de zesde toets is zijn gemiddelde 14 op 20.
Hoeveel haalde Milan op de zesde toets?`,
[`19`,`14`,`15`,`20`],
`Na vijf toetsen heeft hij 5 × 13 = 65 punten.
Na zes toetsen heeft hij 6 × 14 = 84 punten.
Op de zesde toets haalde hij 84 − 65 = 19.`,{c:'6*14-5*13'});


// Vragendatabank - VERZAMELINGENLEER (alleen A-stroom)

v('v01','ver',1,0,
`Gegeven: A = {2, 4, 6, 8}.
Welke uitspraak is juist?`,
[`6 ∈ A`,`5 ∈ A`,`8 ∉ A`,`2 ∉ A`],
`Het symbool ∈ betekent 'is een element van', ∉ betekent 'is geen element van'.
6 staat in de opsomming van A, dus 6 ∈ A.`);

v('v02','ver',1,0,
`Hoeveel elementen heeft de verzameling B = {a, b, c, d, e}?`,
[`5`,`4`,`6`,`1`],
`Tel de elementen tussen de accolades: a, b, c, d en e. Dat zijn er 5.`);

v('v04','ver',1,0,
`Bekijk het venndiagram.
Welk element behoort tot A en ook tot B?`,
[`3`,`1`,`4`,`5`],
`Een element dat tot beide verzamelingen behoort, staat in het gebied waar de twee cirkels elkaar overlappen. Daar staat 3.`,{fig:'venn1'});

v('v05','ver',1,0,
`Bekijk het venndiagram.
Welke elementen behoren tot A?`,
[`1, 2 en 3`,`1 en 2`,`alleen 3`,`1, 2, 3, 4 en 5`],
`Alles wat binnen de cirkel van A staat, behoort tot A. Ook 3 in het overlappende deel hoort erbij.
A = {1, 2, 3}.`,{fig:'venn1'});

v('v06','ver',1,0,
`Welk symbool betekent 'is een element van'?`,
[`∈`,`⊂`,`∩`,`∪`],
`∈ betekent 'is een element van'.
⊂ betekent 'is een deelverzameling van', ∩ is de doorsnede en ∪ is de unie.`);

v('v30','ver',1,0,
`Hoe noem je een verzameling die geen enkel element bevat?`,
[`de lege verzameling`,`de unie`,`de doorsnede`,`een deelverzameling`],
`Een verzameling zonder elementen is de lege verzameling. Het symbool is ∅ of { }.`);

v('v03','ver',2,0,
`Welke verzameling bevat alle even natuurlijke getallen die kleiner zijn dan 10?`,
[`{0, 2, 4, 6, 8}`,`{2, 4, 6, 8, 10}`,`{1, 3, 5, 7, 9}`,`{0, 2, 4, 6, 8, 10}`],
`De even natuurlijke getallen zijn 0, 2, 4, 6, 8, 10, …
Kleiner dan 10 betekent dat 10 zelf niet meetelt. 0 is ook een even natuurlijk getal.`);

v('v07','ver',2,0,
`Gegeven: A = {1, 2, 3, 4} en B = {3, 4, 5}.
Bepaal A ∩ B.`,
[`{3, 4}`,`{1, 2, 3, 4, 5}`,`{1, 2}`,`{5}`],
`A ∩ B is de doorsnede: de elementen die tot A en ook tot B behoren.
3 en 4 zitten in beide verzamelingen. A ∩ B = {3, 4}.`);

v('v08','ver',2,0,
`Gegeven: A = {1, 2, 3, 4} en B = {3, 4, 5}.
Bepaal A ∪ B.`,
[`{1, 2, 3, 4, 5}`,`{3, 4}`,`{1, 2, 5}`,`{1, 2, 3, 4, 3, 4, 5}`],
`A ∪ B is de unie: alle elementen die tot A of tot B (of tot beide) behoren.
Elk element schrijf je maar één keer: {1, 2, 3, 4, 5}.`);

v('v09','ver',2,0,
`Welke verzameling is een deelverzameling van {1, 2, 3, 4, 5}?`,
[`{2, 5}`,`{0, 1}`,`{5, 6}`,`{1, 2, 3, 4, 5, 6}`],
`Een deelverzameling bevat alleen elementen die ook in de grote verzameling zitten.
2 en 5 zitten allebei in {1, 2, 3, 4, 5}. In de andere antwoorden zit 0 of 6, en die horen er niet bij.`);

v('v10','ver',2,0,
`D is de verzameling van de delers van 12.
Welke opsomming is juist?`,
[`{1, 2, 3, 4, 6, 12}`,`{2, 3, 4, 6}`,`{12, 24, 36, …}`,`{1, 2, 3, 4, 5, 6, 12}`],
`De delers van 12 zijn de getallen waardoor 12 deelbaar is: 1, 2, 3, 4, 6 en 12.
1 en 12 zelf horen er ook bij. 5 is geen deler van 12. De getallen 12, 24, 36, … zijn veelvouden van 12.`);

v('v11','ver',2,0,
`Bekijk het venndiagram.
Welke elementen behoren tot A ∪ B?`,
[`a, b, c, d en e`,`c en d`,`a, b en e`,`a, b, c, d, e en f`],
`A ∪ B bevat alles wat in minstens één van de twee cirkels staat: a, b, c, d en e.
f staat buiten de twee cirkels en hoort er niet bij.`,{fig:'venn2'});

v('v12','ver',3,0,
`Gegeven: A = {1, 2, 3, 4, 5} en B = {4, 5, 6}.
Bepaal A \\ B.`,
[`{1, 2, 3}`,`{6}`,`{4, 5}`,`{1, 2, 3, 6}`],
`A \\ B is het verschil: de elementen van A die niet tot B behoren.
4 en 5 zitten ook in B en vallen weg. A \\ B = {1, 2, 3}.`);

v('v13','ver',3,0,
`Gegeven: A = {x | x is een natuurlijk getal en x &lt; 5}.
Welke opsomming van A is juist?`,
[`{0, 1, 2, 3, 4}`,`{1, 2, 3, 4}`,`{1, 2, 3, 4, 5}`,`{0, 1, 2, 3, 4, 5}`],
`De natuurlijke getallen beginnen bij 0. Kleiner dan 5 betekent dat 5 zelf niet meetelt.
A = {0, 1, 2, 3, 4}.`);

v('v14','ver',3,0,
`Gegeven: A = {1, 2, 3}.
Welke uitspraak is juist?`,
[`{1, 2} ⊂ A`,`1 ⊂ A`,`{1} ∈ A`,`A ⊂ {1, 2}`],
`⊂ gebruik je tussen twee verzamelingen, ∈ tussen een element en een verzameling.
{1, 2} is een verzameling waarvan alle elementen in A zitten, dus {1, 2} ⊂ A.
Juist zou ook zijn: 1 ∈ A.`);

v('v15','ver',3,0,
`Bekijk het venndiagram.
Welke elementen behoren tot B \\ A?`,
[`alleen e`,`c en d`,`a en b`,`e en f`],
`B \\ A bevat de elementen van B die niet tot A behoren.
In B zitten c, d en e. Daarvan zitten c en d ook in A. Alleen e blijft over.`,{fig:'venn2'});

v('v16','ver',3,0,
`Gegeven: V = {3, 6, 9, 12, 15, 18} en E = {2, 4, 6, 8, 10, 12, 14, 16, 18}.
Bepaal V ∩ E.`,
[`{6, 12, 18}`,`{3, 9, 15}`,`{6, 12}`,`{2, 3, 4, 6, 8, 9, 10, 12, 14, 15, 16, 18}`],
`De doorsnede bevat de elementen die in beide verzamelingen zitten: 6, 12 en 18.
Dat zijn de veelvouden van 3 die ook even zijn.`);

v('v17','ver',3,0,
`In een klas spelen 12 leerlingen voetbal en 9 leerlingen basketbal. 4 leerlingen doen de twee sporten.
Hoeveel leerlingen doen minstens één van de twee sporten?`,
[`17`,`21`,`25`,`13`],
`Als je 12 + 9 = 21 rekent, tel je de 4 leerlingen die beide sporten doen twee keer.
Trek ze één keer af: 21 − 4 = 17.
Met een venndiagram: 8 alleen voetbal, 4 beide, 5 alleen basketbal. 8 + 4 + 5 = 17.`,{c:'12+9-4'});

v('v18','ver',4,0,
`In een klas van 30 leerlingen hebben 18 leerlingen een hond en 12 leerlingen een kat. 5 leerlingen hebben een hond en een kat.
Hoeveel leerlingen hebben geen hond en geen kat?`,
[`5`,`0`,`10`,`25`],
`Leerlingen met minstens één van de twee dieren: 18 + 12 − 5 = 25.
Leerlingen zonder hond en zonder kat: 30 − 25 = 5.
Teken een venndiagram: 13 alleen hond, 5 beide, 7 alleen kat, 5 erbuiten.`,{c:'30-(18+12-5)'});

v('v20','ver',4,0,
`A is een deelverzameling van B (A ⊂ B).
Waaraan is A ∩ B dan gelijk?`,
[`A`,`B`,`∅`,`A ∪ B`],
`Alle elementen van A zitten ook in B. De elementen die in A en in B zitten, zijn dus precies de elementen van A.
A ∩ B = A. (En A ∪ B = B.)`);

v('v21','ver',4,0,
`Gegeven: A = {1, 2, 3, 4}, B = {3, 4, 5, 6} en C = {4, 6, 8}.
Bepaal (A ∩ B) ∪ C.`,
[`{3, 4, 6, 8}`,`{4}`,`{3, 4}`,`{1, 2, 3, 4, 5, 6, 8}`],
`Eerst wat tussen de haakjes staat: A ∩ B = {3, 4}.
Daarna de unie met C: {3, 4} ∪ {4, 6, 8} = {3, 4, 6, 8}.`);

v('v22','ver',4,0,
`Verzameling A heeft 7 elementen en verzameling B heeft 5 elementen. De doorsnede A ∩ B heeft 2 elementen.
Hoeveel elementen heeft A ∪ B?`,
[`10`,`12`,`14`,`9`],
`Tel de elementen van A en B op en trek de elementen die je dubbel telde één keer af.
7 + 5 − 2 = 10.`,{c:'7+5-2'});

v('v23','ver',4,0,
`Welke uitspraak is juist voor alle verzamelingen A en B?`,
[`(A ∩ B) ⊂ A`,`A ⊂ (A ∩ B)`,`(A ∪ B) ⊂ A`,`A \\ B = B \\ A`],
`Elk element van de doorsnede zit in A en in B, dus zeker in A. De doorsnede is altijd een deelverzameling van A.
Tegenvoorbeeld voor de andere: A = {1, 2} en B = {2, 3}. Dan is A ∩ B = {2}, A ∪ B = {1, 2, 3}, A \\ B = {1} en B \\ A = {3}.`);

v('v24','ver',4,0,
`Bekijk het venndiagram.
Welke bewerking geeft de verzameling {a, b, e}?`,
[`(A ∪ B) \\ (A ∩ B)`,`A ∩ B`,`A ∪ B`,`A \\ B`],
`a, b en e zijn de elementen die in precies één van de twee verzamelingen zitten.
A ∪ B = {a, b, c, d, e} en A ∩ B = {c, d}.
Haal je de doorsnede uit de unie, dan blijft {a, b, e} over.`,{fig:'venn2'});

v('v27','ver',4,0,
`Van twee verzamelingen A en B weet je: A \\ B = {1, 2}, B \\ A = {5} en A ∩ B = {3, 4}.
Wat is A?`,
[`{1, 2, 3, 4}`,`{1, 2}`,`{1, 2, 5}`,`{1, 2, 3, 4, 5}`],
`A bestaat uit de elementen die alleen in A zitten (A \\ B) en de elementen die A en B gemeenschappelijk hebben (A ∩ B).
A = {1, 2} ∪ {3, 4} = {1, 2, 3, 4}.`);

v('v19','ver',5,0,
`Gegeven: A = {1, 2, 3}.
Hoeveel deelverzamelingen heeft A in totaal?`,
[`8`,`3`,`6`,`7`],
`Som ze op: ∅, {1}, {2}, {3}, {1, 2}, {1, 3}, {2, 3} en {1, 2, 3}.
Dat zijn er 8. De lege verzameling en A zelf tellen ook mee.`);

v('v25','ver',5,0,
`In een groep van 40 jongeren spreken 25 jongeren Frans en 20 jongeren Engels. 8 jongeren spreken geen van de twee talen.
Hoeveel jongeren spreken Frans en ook Engels?`,
[`13`,`5`,`8`,`45`],
`Jongeren die minstens één van de talen spreken: 40 − 8 = 32.
25 + 20 = 45. Dat is 13 meer dan 32, omdat wie beide talen spreekt twee keer geteld is.
13 jongeren spreken Frans en Engels.`,{c:'25+20-(40-8)'});

v('v26','ver',5,0,
`A is de verzameling van de veelvouden van 4. B is de verzameling van de veelvouden van 6.
A ∩ B is de verzameling van de veelvouden van …`,
[`12`,`24`,`2`,`10`],
`In A ∩ B zitten de getallen die een veelvoud zijn van 4 en ook van 6: 0, 12, 24, 36, …
Dat zijn de veelvouden van het kleinste gemeenschappelijke veelvoud van 4 en 6, en dat is 12.`);

v('v28','ver',5,0,
`Voor twee verzamelingen A en B geldt: A ∪ B = A.
Wat weet je dan zeker?`,
[`B ⊂ A`,`A ⊂ B`,`A ∩ B = ∅`,`A = ∅`],
`Als je de elementen van B bij A voegt en er komt niets nieuws bij, dan zaten alle elementen van B al in A.
B is dus een deelverzameling van A.`);

v('v29','ver',5,0,
`Welke uitspraak is juist?`,
[`∅ ⊂ {1, 2}`,`∅ ∈ {1, 2}`,`{0} = ∅`,`0 ∈ ∅`],
`De lege verzameling is een deelverzameling van elke verzameling.
∅ is geen element van {1, 2}: de elementen zijn 1 en 2. De verzameling {0} bevat één element (het getal 0) en is dus niet leeg. ∅ bevat geen enkel element, ook 0 niet.`);

// Nieuwe vragen in de vorm van de echte toets: invulvragen, klikvragen, sleepvragen en rangschikvragen.
// Eigen opgaven: andere situaties en getallen dan de toetsvragen op de foto's.

/* ---------- problemen oplossen: invulvragen ---------- */
v('n01','pro',2,3,
`Langs een wandelroute staan genummerde paaltjes. Jens start bij paaltje 4 en wandelt naar het eindpunt van de route. Precies halverwege staat hij bij paaltje 11.
Bij welk paaltje eindigt de route?`,
[],
`Van paaltje 4 tot paaltje 11 is 11 − 4 = 7 paaltjes. Dat is de helft van de route.
De hele route is dus 2 × 7 = 14 paaltjes lang.
De route eindigt bij paaltje 4 + 14 = 18.`,
{velden:[{voor:'bij paaltje', w:'18'}], tip:`Hoeveel paaltjes legt Jens af tot halverwege? Hoeveel is dat voor de hele route?`, c:'4+2*(11-4)'});

v('n14','pro',4,5,
`Een parkeergarage heeft verdiepingen onder de grond: −1, −2, −3, … Mo parkeert zijn auto op verdieping −3. Daarna neemt hij de trap naar zijn kantoor. Precies halverwege is hij op verdieping 2.
Op welke verdieping is zijn kantoor?`,
[],
`Van verdieping −3 naar verdieping 2 gaat Mo 5 verdiepingen omhoog. Dat is de helft van de weg.
De hele weg is 2 × 5 = 10 verdiepingen.
Zijn kantoor is op verdieping −3 + 10 = 7.`,
{velden:[{voor:'op verdieping', w:'7'}], tip:`Teken een verticale getallenlijn met de verdiepingen. Hoeveel verdiepingen stijgt Mo tot halverwege?`, c:'-3+2*(2-(-3))'});

v('n03','pro',2,3,
`Om 6 uur 's ochtends was het −6,5 °C. Tegen de middag was de temperatuur 11 graden gestegen.
Hoe warm was het 's middags?`,
[],
`Stijgen is optellen: −6,5 + 11 = 4,5.
Het was 's middags 4,5 °C.`,
{velden:[{w:'4.5', na:'°C'}], tip:`Teken een thermometer of een getallenlijn. Vertrek bij −6,5 en ga 11 omhoog.`, c:'-6.5+11'});

v('n04','pro',3,4,
`In een diepvries is het −18 °C. De stroom valt uit. Daardoor stijgt de temperatuur in de diepvries met 2,5 °C per uur.
Hoe koud is het in de diepvries na 4 uur?`,
[],
`In 4 uur stijgt de temperatuur 4 × 2,5 = 10 graden.
−18 + 10 = −8. Na 4 uur is het −8 °C.`,
{velden:[{w:'-8', na:'°C'}], tip:`Hoeveel graden stijgt de temperatuur in 4 uur samen?`, c:'-18+4*2.5'});

v('n05','pro',3,4,
`Fien noteert hoeveel minuten ze elke dag leest. Maandag las ze 25 minuten. Dinsdag las ze 10 minuten langer dan maandag. Donderdag las ze 20 minuten en vrijdag 30 minuten. Woensdag vergat ze het te noteren.
Van maandag tot en met vrijdag las Fien gemiddeld 28 minuten per dag.
Hoeveel minuten las Fien op woensdag?`,
[],
`Stap 1: dinsdag las ze 25 + 10 = 35 minuten.
Stap 2: gemiddeld 28 minuten op 5 dagen betekent samen 5 × 28 = 140 minuten.
Stap 3: de vier bekende dagen samen: 25 + 35 + 20 + 30 = 110 minuten.
Stap 4: woensdag: 140 − 110 = 30 minuten.`,
{velden:[{w:'30', na:'minuten'}], tip:`Als je het gemiddelde kent, kan je uitrekenen hoeveel minuten ze in totaal las.`, c:'5*28-(25+35+20+30)'});

v('n06','pro',3,4,
`Jasper koopt een doos met 12 pakjes appelsap voor € 7,20 en een zak met 8 broodjes voor € 4,00. Zijn zus neemt 3 pakjes appelsap en 2 broodjes van hem over. Ze betaalt Jasper precies terug wat die kosten.
Hoeveel betaalt zijn zus aan Jasper?`,
[],
`Stap 1: één pakje appelsap kost 7,20 : 12 = € 0,60.
Stap 2: één broodje kost 4,00 : 8 = € 0,50.
Stap 3: 3 × 0,60 + 2 × 0,50 = 1,80 + 1,00 = € 2,80.`,
{velden:[{voor:'€', w:'2.80'}], calc:1, tip:`Reken eerst uit wat één pakje en wat één broodje kost.`, c:'3*7.2/12+2*4/8'});

v('n07','pro',3,4,
`De hond van Tibo kauwde op zijn rapport. Eén getal is niet meer te lezen.
Op hoeveel punten stond het onderdeel algebra?`,
[],
`Tibo behaalde 70 % voor algebra. Zijn 21 punten zijn dus 70 % van het totaal.
1 % is 21 : 70 = 0,3 punten. 100 % is 0,3 × 100 = 30 punten.
Controle: {{21|30}} = 0,70 = 70 %.`,
{velden:[{voor:'op', w:'30', na:'punten'}], fig:'rapport', calc:1, tip:`21 punten is 70 % van het totaal. Hoeveel punten is dan 10 %?`, c:'21/0.7'});

v('n08','pro',2,3,
`Een skateboard kost € 80. In de solden betaal je er € 68 voor.
Hoeveel procent korting krijg je?`,
[],
`De korting is 80 − 68 = € 12.
{{12|80}} = 0,15 = 15 %.`,
{velden:[{w:'15', na:'%'}], tip:`Hoeveel euro korting krijg je? Welk deel van de oorspronkelijke prijs is dat?`, c:'(80-68)/80*100'});

v('n09','pro',4,5,
`Lore schildert een muur van 6 m lang en 2,5 m hoog. Ze geeft de muur twee lagen verf. Met 1 liter verf kan ze 8 m² schilderen. De verf wordt verkocht in potten van 2,5 liter.
Hoeveel potten verf moet Lore minstens kopen?`,
[],
`Stap 1: oppervlakte van de muur: 6 × 2,5 = 15 m².
Stap 2: twee lagen: 2 × 15 = 30 m².
Stap 3: verf nodig: 30 : 8 = 3,75 liter.
Stap 4: 3,75 : 2,5 = 1,5 potten. Een halve pot kan je niet kopen, dus ze moet 2 potten kopen.`,
{velden:[{w:'2', na:'potten'}], calc:1, tip:`Vergeet de tweede laag niet. Kan je een halve pot kopen?`, c:'Math.ceil(6*2.5*2/8/2.5)'});

v('n10','pro',3,4,
`Voor het schoolfeest moeten er 230 stoelen naar de sporthal. Een bestelwagen kan per rit 48 stoelen vervoeren.
Hoeveel ritten zijn er minstens nodig?`,
[],
`230 : 48 = 4,79…
Met 4 ritten breng je maar 4 × 48 = 192 stoelen. Er is dus nog een vijfde rit nodig voor de laatste 38 stoelen.
Er zijn minstens 5 ritten nodig.`,
{velden:[{w:'5', na:'ritten'}], calc:1, tip:`Een deel van een rit bestaat niet. Wat doe je met de rest?`, c:'Math.ceil(230/48)'});

v('n12','pro',5,0,
`Een winkel heeft een actie: 3 pakken koekjes voor de prijs van 2. Eén pak kost € 2,40. Lena heeft € 15.
Hoeveel pakken koekjes kan Lena hoogstens kopen?`,
[],
`Stap 1: 3 pakken kosten de prijs van 2: 2 × 2,40 = € 4,80.
Stap 2: met € 15 kan ze 3 keer de actie nemen: 3 × 4,80 = € 14,40. Dat zijn 9 pakken.
Stap 3: ze houdt 15 − 14,40 = € 0,60 over. Dat is te weinig voor nog een pak.
Lena kan hoogstens 9 pakken kopen.`,
{velden:[{w:'9', na:'pakken'}], calc:1, tip:`Wat kosten 3 pakken met de actie? Hoeveel keer kan Lena dat betalen? Kijk ook wat er overblijft.`, c:'3*Math.floor(15/4.8)'});

v('f06','pro',3,4,
`Een pizza is in gelijke stukken verdeeld. Lisa eet {{1|4}} van de pizza en Tom eet {{3|8}} van de pizza.
Welk deel van de pizza blijft over? Schrijf je antwoord als een vereenvoudigde breuk.`,
[],
`Maak de noemers gelijk: {{1|4}} = {{2|8}}.
Samen eten ze {{2|8}} + {{3|8}} = {{5|8}}.
Er blijft {{8|8}} − {{5|8}} = {{3|8}} over.`,
{velden:[{w:'3/8', vorm:'breuk'}], tip:`De hele pizza is {{8|8}}. Schrijf eerst alles met noemer 8.`, c:'1-1/4-3/8'});

/* ---------- meetkunde: invulvragen met een assenstelsel ---------- */
v('n11','mee',3,0,
`De punten A(−3, 1) en B(2, 1) zijn twee hoekpunten van het vierkant ABCD. De hoekpunten C en D liggen onder de x-as.
Wat is de oppervlakte van het vierkant ABCD?`,
[],
`De zijde [AB] loopt van x = −3 tot x = 2. De lengte is 2 − (−3) = 5.
Een vierkant heeft vier even lange zijden. De oppervlakte is 5 × 5 = 25.`,
{velden:[{w:'25'}], fig:'vierkantAB', c:'(2-(-3))**2'});

v('n15','mee',4,0,
`De punten A(−3, 1) en B(2, 1) zijn twee hoekpunten van het vierkant ABCD. De hoekpunten C en D liggen onder de x-as. C ligt recht onder B.
Wat zijn de coördinaten van het punt C?`,
[],
`De zijde van het vierkant is 2 − (−3) = 5.
C ligt 5 eenheden recht onder B(2, 1). De x-coördinaat blijft 2, de y-coördinaat wordt 1 − 5 = −4.
C = (2, −4).`,
{velden:[{voor:'(', w:'2'}, {voor:',', w:'-4', na:')'}], fig:'vierkantAB'});

v('n16','mee',2,3,
`De punten A(1, 1), B(6, 1) en C(6, 4) zijn drie hoekpunten van de rechthoek ABCD.
Wat is de oppervlakte van de rechthoek ABCD?`,
[],
`De lengte [AB]: van x = 1 tot x = 6 is 5.
De breedte [BC]: van y = 1 tot y = 4 is 3.
Oppervlakte: 5 × 3 = 15.`,
{velden:[{w:'15'}], fig:'rechthoekABC', c:'(6-1)*(4-1)'});

/* ---------- breuken en machten zelf noteren ---------- */
v('f01','get',2,3,
`Vereenvoudig de breuk {{12|18}} zo ver mogelijk.`,
[],
`De grootste gemeenschappelijke deler van 12 en 18 is 6.
12 : 6 = 2 en 18 : 6 = 3. Dus {{12|18}} = {{2|3}}.`,
{velden:[{w:'2/3', vorm:'breuk'}], c:'12/18'});

v('f10','get',1,2,
`Schrijf als een breuk: drie vijfde.`,
[],
`Drie vijfde betekent 3 van de 5 gelijke delen.
De teller (boven de breukstreep) is 3, de noemer (onder de breukstreep) is 5: {{3|5}}.`,
{velden:[{w:'3/5', vorm:'breuk'}], c:'3/5'});

v('f03','get',3,4,
`Schrijf 0,25 als een vereenvoudigde breuk.`,
[],
`0,25 = 25 honderdsten = {{25|100}}.
Vereenvoudig door teller en noemer te delen door 25: {{1|4}}.`,
{velden:[{w:'1/4', vorm:'breuk'}], c:'0.25'});

v('f02','get',3,0,
`Schrijf als één macht: 3⁴ · 3²`,
[],
`Bij een product van machten met hetzelfde grondtal tel je de exponenten op.
3⁴ · 3² = 3<sup>4 + 2</sup> = 3⁶.`,
{velden:[{w:'3^6', vorm:'macht'}]});

v('f05','get',2,0,
`Schrijf als één macht: 5 · 5 · 5 · 5`,
[],
`Je vermenigvuldigt 4 keer de factor 5. Het grondtal is 5 en de exponent is 4: 5⁴.`,
{velden:[{w:'5^4', vorm:'macht'}]});

v('f04','get',4,0,
`Reken uit: {{3|5}} : {{9|10}}
Schrijf je antwoord als een vereenvoudigde breuk.`,
[],
`Delen door een breuk is vermenigvuldigen met het omgekeerde: {{3|5}} · {{10|9}} = {{30|45}}.
Vereenvoudig door te delen door 15: {{2|3}}.`,
{velden:[{w:'2/3', vorm:'breuk'}], c:'(3/5)/(9/10)'});

v('f09','get',4,0,
`Reken uit: {{5|6}} − {{3|4}}
Schrijf je antwoord als een vereenvoudigde breuk.`,
[],
`Maak de noemers gelijk met noemer 12: {{5|6}} = {{10|12}} en {{3|4}} = {{9|12}}.
{{10|12}} − {{9|12}} = {{1|12}}.`,
{velden:[{w:'1/12', vorm:'breuk'}], c:'5/6-3/4'});

v('f08','get',5,0,
`Reken uit: (−2)³ + {{3|4}} · 2⁴`,
[],
`Eerst de machten: (−2)³ = −8 en 2⁴ = 16.
Dan het product: {{3|4}} · 16 = 12.
Dan de som: −8 + 12 = 4.`,
{velden:[{w:'4'}], c:'(-2)**3+3/4*2**4'});

v('f07','alg',4,0,
`Schrijf als één macht: (a³)²`,
[],
`Een macht van een macht: je vermenigvuldigt de exponenten.
(a³)² = a³ · a³ = a<sup>3 · 2</sup> = a⁶.`,
{velden:[{w:'a^6', vorm:'macht'}]});

v('f11','alg',3,0,
`Schrijf als één macht: x² · x⁵`,
[],
`Hetzelfde grondtal: tel de exponenten op. x² · x⁵ = x<sup>2 + 5</sup> = x⁷.`,
{velden:[{w:'x^7', vorm:'macht'}]});

/* ---------- klikvragen op een rooster ---------- */
v('k1','mee',3,0,
`Het rooster bestaat uit gelijke vierkanten. Het punt P wordt gespiegeld door de puntspiegeling met centrum C.
Klik op het beeld van P.`,
[],
`Bij een puntspiegeling ligt het beeld recht tegenover P, even ver van C.
Van P naar C ga je 3 hokjes naar rechts en 2 hokjes naar beneden. Doe dat nog een keer vanuit C: je komt 3 hokjes rechts en 2 hokjes onder C uit.`,
{rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:1, y:5, l:'P'}, {x:4, y:3, l:'C'}]}, w:{x:7, y:1}});

v('k2','mee',4,0,
`Het rooster bestaat uit gelijke vierkanten. Bij een puntspiegeling met centrum M is het punt B het beeld van het punt A.
Klik op de plaats van het centrum M.`,
[],
`Bij een puntspiegeling ligt het centrum precies in het midden tussen een punt en zijn beeld.
Van A naar B is 6 hokjes naar rechts en 4 hokjes naar boven. Het midden ligt 3 hokjes naar rechts en 2 hokjes naar boven vanuit A.`,
{rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:1, y:1, l:'A'}, {x:7, y:5, l:'B'}]}, w:{x:4, y:3}});

v('k3','mee',1,0,
`Klik op het punt met coördinaten (−3, 2).`,
[],
`De eerste coördinaat is x: vanuit de oorsprong ga je 3 eenheden naar links.
De tweede coördinaat is y: daarna ga je 2 eenheden naar boven.`,
{rooster:{xmin:-5, xmax:5, ymin:-4, ymax:4, assen:'xy', getallen:'alle', punten:[]}, w:{x:-3, y:2}});

v('k9','mee',0,3,
`Klik op het punt met coördinaten (4, 1).`,
[],
`De eerste coördinaat is x: vanuit de oorsprong ga je 4 eenheden naar rechts.
De tweede coördinaat is y: daarna ga je 1 eenheid naar boven.
Let op: (1, 4) is een ander punt.`,
{rooster:{xmin:0, xmax:6, ymin:0, ymax:5, assen:'xy', getallen:'alle', punten:[]}, w:{x:4, y:1}});

v('k4','mee',4,0,
`Mats tekende op een ruitjesblad een x-as, een y-as en de punten P(2, 3) en Q(−3, −2). Daarna gomde hij de x-as uit.
Klik op het punt met coördinaten (−1, 4).`,
[],
`Gebruik het punt P(2, 3). Het hokje van P ligt 3 eenheden boven de x-as, dus de x-as ligt 3 hokjes onder P.
Het punt (−1, 4) ligt 1 eenheid links van de y-as en 1 eenheid hoger dan P.
Controleer met Q(−3, −2): Q ligt 2 hokjes onder de uitgegomde x-as.`,
{rooster:{xmin:-5, xmax:5, ymin:-4, ymax:5, assen:'y', punten:[{x:2, y:3, l:'P(2, 3)'}, {x:-3, y:-2, l:'Q(−3, −2)'}]}, w:{x:-1, y:4}});

v('k5','mee',2,3,
`Het rooster bestaat uit gelijke vierkanten. Het punt R wordt verschoven: 3 hokjes naar rechts en 2 hokjes naar boven.
Klik op het beeld van R.`,
[],
`Vertrek bij R. Tel 3 hokjes naar rechts en daarna 2 hokjes naar boven.`,
{rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:2, y:2, l:'R'}]}, w:{x:5, y:4}});

v('k6','mee',2,3,
`Het rooster bestaat uit gelijke vierkanten. Het punt S wordt gespiegeld om de rechte m.
Klik op het beeld van S.`,
[],
`S ligt 3 hokjes links van de rechte m. Het spiegelbeeld ligt op dezelfde hoogte, 3 hokjes rechts van m.`,
{rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:1, y:3, l:'S'}], lijnen:[{x1:4, y1:0, x2:4, y2:6, l:'m'}]}, w:{x:7, y:3}});

v('k7','mee',1,2,
`Het rooster bestaat uit gelijke vierkanten. ABCD is een rechthoek.
Klik op de plaats van het hoekpunt D.`,
[],
`In een rechthoek liggen de overstaande zijden evenwijdig en zijn ze even lang.
D ligt recht boven A en op dezelfde hoogte als C.`,
{rooster:{xmin:0, xmax:7, ymin:0, ymax:5, assen:'', punten:[{x:1, y:1, l:'A'}, {x:6, y:1, l:'B'}, {x:6, y:4, l:'C'}], lijnen:[{x1:1, y1:1, x2:6, y2:1, vol:1}, {x1:6, y1:1, x2:6, y2:4, vol:1}]}, w:{x:1, y:4}});

v('k8','pro',3,4,
`Op dit plan stelt de zijde van één hokje 10 m voor. Boven is het noorden en rechts is het oosten. De school ligt bij S.
Het station ligt 40 m ten oosten en 30 m ten noorden van de school.
Klik op de plaats van het station.`,
[],
`40 m is 4 hokjes, 30 m is 3 hokjes.
Vertrek bij S: 4 hokjes naar rechts (oosten) en 3 hokjes naar boven (noorden).`,
{rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:2, y:1, l:'S'}]}, w:{x:6, y:4}, tip:`Hoeveel hokjes is 40 m? En 30 m?`});

/* ---------- sleepvragen ---------- */
v('vk1','ver',2,0,
`Gegeven: A = {1, 2, 3, 4, 6} en B = {2, 4, 6, 8}.
Sleep elk getal naar het juiste gebied.`,
[],
`Alleen in A: 1 en 3. In A en in B: 2, 4 en 6. Alleen in B: 8.
9 zit in A noch in B.`,
{kaartjes:['1','2','3','4','6','8','9'], vakken:['alleen in A', 'in A en in B', 'alleen in B', 'niet in A en niet in B'], w:[0, 1, 0, 1, 1, 2, 3]});

v('vk2','ver',3,0,
`A is de verzameling van de delers van 12. B is de verzameling van de even getallen kleiner dan 10.
Sleep elk getal naar het juiste gebied.`,
[],
`Delers van 12: 1, 2, 3, 4, 6, 12. Even getallen kleiner dan 10: 0, 2, 4, 6, 8.
Alleen in A: 1, 3 en 12. In A en in B: 2, 4 en 6. Alleen in B: 8. In geen van beide: 5.`,
{kaartjes:['1','2','3','4','5','6','8','12'], vakken:['alleen in A', 'in A en in B', 'alleen in B', 'niet in A en niet in B'], w:[0, 1, 0, 1, 3, 1, 2, 0]});

v('vk3','mee',1,2,
`Sleep elke hoek naar de juiste soort.`,
[],
`Een scherpe hoek is kleiner dan 90°. Een rechte hoek is precies 90°.
Een stompe hoek ligt tussen 90° en 180°. Een gestrekte hoek is precies 180°.
Let op: 89° is nog net scherp.`,
{kaartjes:['35°','90°','120°','89°','180°','160°'], vakken:['scherpe hoek', 'rechte hoek', 'stompe hoek', 'gestrekte hoek'], w:[0, 1, 2, 0, 3, 2]});

v('vk4','get',2,3,
`Vergelijk elke breuk met {{1|2}}. Sleep elke breuk naar het juiste vak.`,
[],
`Een breuk is gelijk aan {{1|2}} als de teller de helft van de noemer is: {{3|6}} en {{5|10}}.
Is de teller kleiner dan de helft van de noemer, dan is de breuk kleiner dan {{1|2}}: {{2|5}} en {{3|8}}.
Is de teller groter dan de helft, dan is de breuk groter: {{4|7}} en {{2|3}}.`,
{kaartjes:['{{2|5}}','{{3|6}}','{{4|7}}','{{5|10}}','{{3|8}}','{{2|3}}'], vakken:['kleiner dan {{1|2}}', 'gelijk aan {{1|2}}', 'groter dan {{1|2}}'], w:[0, 1, 2, 1, 0, 2]});

v('vk5','get',3,0,
`Sleep elk getal naar de kleinste getallenverzameling waartoe het behoort.`,
[],
`ℕ bevat 0, 1, 2, 3, … : 7, 0 en 12.
ℤ bevat ook de negatieve gehele getallen: −3.
ℚ bevat ook breuken en kommagetallen: 2,5 en −{{1|2}}.`,
{kaartjes:['7','−3','0','2,5','−{{1|2}}','12'], vakken:['ℕ', 'ℤ maar niet ℕ', 'ℚ maar niet ℤ'], w:[0, 1, 0, 2, 2, 0]});

v('vk6','sta',2,0,
`Sleep elke omschrijving naar het juiste kengetal.`,
[],
`Het gemiddelde: alle waarden optellen en delen door het aantal.
De mediaan: de middelste waarde als je de waarden rangschikt.
De modus: de waarde die het vaakst voorkomt.`,
{kaartjes:['de som van alle waarden gedeeld door het aantal waarden', 'de middelste waarde na het rangschikken', 'de waarde die het vaakst voorkomt'], vakken:['gemiddelde', 'mediaan', 'modus'], w:[0, 1, 2]});

v('vk7','alg',2,0,
`Sleep elke term naar de groep met gelijksoortige termen.`,
[],
`Gelijksoortige termen hebben hetzelfde lettergedeelte.
Met x: 3x en x. Met x²: −5x² en 4x². Zonder letter: 7 en −2.`,
{kaartjes:['3x','−5x²','7','x','4x²','−2'], vakken:['termen met x', 'termen met x²', 'getallen zonder letter'], w:[0, 1, 2, 0, 1, 2]});

/* ---------- rangschikvragen ---------- */
v('vo1','get',2,3,
`Zet de getallen in de juiste volgorde, van klein naar groot.`,
[],
`Bij negatieve getallen is het getal dat verder van 0 ligt het kleinst: −3 &lt; −2,5 &lt; −{{1|2}}.
Daarna komen de positieve getallen: 0,7 &lt; {{3|4}} = 0,75.`,
{kaartjes:['−3','−2,5','−{{1|2}}','0,7','{{3|4}}']});

v('vo2','get',3,4,
`Zet de getallen in de juiste volgorde, van klein naar groot.`,
[],
`Schrijf alles als kommagetal: 30 % = 0,30, {{1|3}} = 0,333…, 0,35 en {{3|8}} = 0,375.`,
{kaartjes:['30 %','{{1|3}}','0,35','{{3|8}}']});

v('vo3','mee',2,3,
`Zet de lengtematen in de juiste volgorde, van groot naar klein.`,
[],
`km is de grootste: 1 km = 1000 m. Daarna m, dm (een tiende meter), cm en mm.`,
{kaartjes:['km','m','dm','cm','mm']});

v('vo5','sta',4,0,
`Gegeven de getallen: 3, 3, 4, 8, 12.
Zet het gemiddelde, de mediaan en de modus in de juiste volgorde, van klein naar groot.`,
[],
`Modus: 3 komt het vaakst voor.
Mediaan: het middelste getal is 4.
Gemiddelde: (3 + 3 + 4 + 8 + 12) : 5 = 30 : 5 = 6.
Dus modus (3) &lt; mediaan (4) &lt; gemiddelde (6).`,
{kaartjes:['modus','mediaan','gemiddelde']});

/* ---------- meerdere juiste antwoorden (selectievakjes) ---------- */
v('mk1','mee',2,3,
`Welke vierhoeken hebben altijd vier even lange zijden?`,
[`een ruit`,`een vierkant`,`een rechthoek`,`een parallellogram`,`geen van bovenstaande`],
`Een ruit heeft vier even lange zijden. Een vierkant is een bijzondere ruit (met rechte hoeken), dus ook.
Bij een rechthoek en een parallellogram zijn alleen de overstaande zijden even lang.`,
{mk:[0, 1]});

v('mk2','mee',3,4,
`Welke figuren hebben precies twee symmetrieassen?`,
[`een rechthoek die geen vierkant is`,`een ruit die geen vierkant is`,`een vierkant`,`een gelijkzijdige driehoek`,`geen van bovenstaande`],
`Een rechthoek (geen vierkant) heeft 2 symmetrieassen: door de middens van de overstaande zijden.
Een ruit (geen vierkant) heeft 2 symmetrieassen: de diagonalen.
Een vierkant heeft er 4, een gelijkzijdige driehoek 3.`,
{mk:[0, 1]});

v('mk3','get',2,3,
`Welke getallen zijn deelbaar door 3?`,
[`117`,`222`,`405`,`301`,`1001`],
`Een getal is deelbaar door 3 als de som van de cijfers deelbaar is door 3.
117: 1 + 1 + 7 = 9, ja. 222: 2 + 2 + 2 = 6, ja. 405: 4 + 0 + 5 = 9, ja.
301: 3 + 0 + 1 = 4, nee. 1001: 1 + 0 + 0 + 1 = 2, nee.`,
{mk:[0, 1, 2]});

v('mk4','get',3,4,
`Welke breuken zijn gelijk aan 0,75?`,
[`{{3|4}}`,`{{6|8}}`,`{{15|20}}`,`{{7|10}}`,`{{4|3}}`],
`0,75 = {{75|100}} = {{3|4}}.
{{6|8}} en {{15|20}} kan je vereenvoudigen tot {{3|4}}.
{{7|10}} = 0,7 en {{4|3}} is groter dan 1.`,
{mk:[0, 1, 2]});

v('mk5','ver',3,0,
`Gegeven: A = {1, 2, 3, 4} en B = {3, 4, 5}.
Welke uitspraken zijn juist?`,
[`3 ∈ A ∩ B`,`{1, 2} ⊂ A`,`A ∪ B heeft 5 elementen`,`5 ∈ A`,`4 ∈ B \\ A`],
`A ∩ B = {3, 4}, dus 3 ∈ A ∩ B klopt.
1 en 2 zitten allebei in A, dus {1, 2} ⊂ A klopt.
A ∪ B = {1, 2, 3, 4, 5} heeft 5 elementen.
5 zit niet in A. B \\ A = {5}, dus 4 zit er niet in.`,
{mk:[0, 1, 2]});

v('mk6','mee',4,0,
`Bij welke transformaties is het beeld van een rechte altijd evenwijdig met die rechte of valt het ermee samen?`,
[`een verschuiving`,`een puntspiegeling`,`een spiegeling om een rechte`,`een draaiing over 90°`,`geen van bovenstaande`],
`Een verschuiving en een puntspiegeling (een draaiing over 180°) behouden de richting van een rechte.
Bij een spiegeling of een draaiing over 90° kan de richting veranderen.`,
{mk:[0, 1]});

v('mk7','sta',3,0,
`Gegeven de getallen: 2, 4, 4, 5, 10.
Welke uitspraken zijn juist?`,
[`De mediaan is 4.`,`De modus is 4.`,`Het gemiddelde is 5.`,`De variatiebreedte is 10.`,`geen van bovenstaande`],
`Mediaan: het middelste getal van 2, 4, 4, 5, 10 is 4.
Modus: 4 komt het vaakst voor.
Gemiddelde: (2 + 4 + 4 + 5 + 10) : 5 = 25 : 5 = 5.
Variatiebreedte: 10 − 2 = 8, niet 10.`,
{mk:[0, 1, 2]});

v('mk8','alg',3,0,
`Welke uitdrukkingen zijn gelijk aan 2(x + 3)?`,
[`2x + 6`,`x + x + 6`,`6 + 2x`,`2x + 3`,`2x · 3`],
`2(x + 3) = 2 · x + 2 · 3 = 2x + 6.
x + x + 6 = 2x + 6 en 6 + 2x = 2x + 6 (de volgorde van optellen mag je wisselen).
2x + 3 vergeet 2 · 3, en 2x · 3 = 6x.`,
{mk:[0, 1, 2]});

v('mk9','pro',3,4,
`Een school bestelt bussen voor een uitstap. Er gaan 230 leerlingen en 18 leerkrachten mee. Een bus heeft 50 plaatsen en kost € 340. De uitstap duurt 6 uur.
Welke gegevens heb je nodig om te berekenen hoeveel bussen de school moet bestellen?`,
[`230 leerlingen`,`18 leerkrachten`,`50 plaatsen per bus`,`€ 340 per bus`,`6 uur`],
`Voor het aantal bussen heb je het aantal personen (230 + 18) en het aantal plaatsen per bus (50) nodig.
De prijs en de duur heb je daarvoor niet nodig. (248 : 50 = 4,96, dus 5 bussen.)`,
{mk:[0, 1, 2], tip:`Welke getallen gaan over het aantal personen en het aantal plaatsen?`});

// Sjablonen PROBLEMEN OPLOSSEN: elke keer andere getallen, het antwoord en de uitleg worden mee berekend.
// Gebaseerd op de vaardigheden die op de echte toets gevraagd worden (eigen situaties, geen kopie van toetsvragen).

g('t_wissel','pro',0,1, R => {
  const n = R.naam(), a = R.stap(1.5, 6, 0.5), b = R.stap(1, 4.5, 0.5), biljet = a + b < 10 ? 10 : 20;
  const ding = R.kies([['een broodje', 'een drankje'], ['een schrift', 'een pen'], ['een ijsje', 'een flesje water'], ['een tijdschrift', 'een snoepreep']]);
  return {
    q:`${n} koopt ${ding[0]} van ${eur(a)} en ${ding[1]} van ${eur(b)}. ${n} betaalt met een biljet van ${eur(biljet)}.\nHoeveel geld krijgt ${n} terug?`,
    velden:[{voor:'€', w:biljet - a - b}],
    u:`Stap 1: samen kost het ${eur(a)} + ${eur(b)} = ${eur(a + b)}.\nStap 2: terug krijgen: ${eur(biljet)} − ${eur(a + b)} = ${eur(biljet - a - b)}.`,
    tip:`Reken eerst uit hoeveel alles samen kost.`};
});

g('t_perstuk','pro',0,1, R => {
  const n = R.naam(), k = R.int(3, 9), p = R.kies([2, 3, 4, 5, 1.5, 2.5]);
  const ding = R.kies(['kaartjes voor de film', 'pakjes stickers', 'schriften', 'flesjes water', 'tickets voor de bus']);
  return {q:`${n} koopt ${k} ${ding}. Eén stuk kost ${eur(p)}.\nHoeveel betaalt ${n} in totaal?`,
    velden:[{voor:'€', w:k * p}], u:`${n} betaalt ${k} keer ${eur(p)}.\n${k} × ${eur(p)} = ${eur(k * p)}.`,
    tip:`Hetzelfde bedrag komt ${k} keer terug. Welke bewerking hoort daarbij?`};
});

g('t_tijd','pro',1,2, R => {
  let u, m, d; do { u = R.int(8, 15); m = R.kies([10, 15, 20, 25, 35, 40, 45, 50]); d = R.kies([35, 40, 45, 50, 55, 65, 70, 75, 85, 95]); } while (m + d <= 60);
  const eindMin = u * 60 + m + d, eu = Math.floor(eindMin / 60), em = eindMin % 60;
  const wat = R.kies(['De trein vertrekt', 'De les begint', 'De voorstelling begint', 'De wedstrijd begint']);
  const tot = {'De trein vertrekt':'De trein komt aan', 'De les begint':'De les is gedaan', 'De voorstelling begint':'De voorstelling is gedaan', 'De wedstrijd begint':'De wedstrijd is gedaan'}[wat];
  const tt = (h, mm) => h + '.' + String(mm).padStart(2, '0') + ' uur';
  const totVol = (u + 1) * 60 - (u * 60 + m);
  return {q:`${wat} om ${tt(u, m)}. ${tot} om ${tt(eu, em)}.\nHoeveel minuten duurt het?`,
    velden:[{w:d, na:'minuten'}],
    u:`Van ${tt(u, m)} tot ${tt(u + 1, 0)} is ${totVol} minuten.\nVan ${tt(u + 1, 0)} tot ${tt(eu, em)} is ${eindMin - (u + 1) * 60} minuten${eu > u + 1 ? ' (een volledig uur is 60 minuten)' : ''}.\nSamen: ${totVol} + ${eindMin - (u + 1) * 60} = ${d} minuten.`,
    tip:`Reken eerst tot het volgende volle uur.`};
});

g('t_zakken','pro',1,2, R => {
  const n = R.naam(), z = R.int(6, 15), gm = R.int(4, 9), gev = R.int(5, z * gm - 5);
  const wat = R.kies([['dozen', 'knikkers', 'doos'], ['zakjes', 'snoepjes', 'zakje'], ['bakjes', 'aardbeien', 'bakje']]);
  return {q:`Er zijn ${z} ${wat[0]} met ${wat[1]} omgevallen. Alle ${wat[1]} liggen op de grond. Gemiddeld zaten er ${gm} ${wat[1]} in één ${wat[2]}. ${n} heeft er al ${gev} opgeraapt.\nHoeveel ${wat[1]} moet ${n} nog oprapen?`,
    velden:[{w:z * gm - gev, na:wat[1]}],
    u:`Stap 1: in totaal waren er ${z} × ${gm} = ${z * gm} ${wat[1]}.\nStap 2: er zijn er al ${gev} opgeraapt: ${z * gm} − ${gev} = ${z * gm - gev}.`,
    tip:`Hoeveel ${wat[1]} waren er in totaal?`};
});

g('t_halfweg','pro',2,3, R => {
  const soort = R.kies(['verdieping', 'paaltje', 'bladzijde']), n = R.naam();
  let s, k, q, eenh;
  if (soort === 'verdieping') {
    s = R.int(0, 6); k = R.int(2, 7); eenh = 'op verdieping';
    const wie = R.kies(['oma', 'tante', 'beste vriendin', 'neef']);
    q = `${n} woont op verdieping ${s} van een flatgebouw. De ${wie} van ${n} woont hoger in hetzelfde gebouw. ${n} neemt de trap naar boven. Precies halverwege is ${n} op verdieping ${s + k}.\nOp welke verdieping woont de ${wie} van ${n}?`;
  } else if (soort === 'paaltje') {
    s = R.int(2, 12); k = R.int(5, 14); eenh = 'bij paaltje';
    q = `Langs een fietsroute staan genummerde paaltjes. ${n} start bij paaltje ${s} en fietst tot het einde van de route. Precies halverwege staat ${n} bij paaltje ${s + k}.\nBij welk paaltje eindigt de route?`;
  } else {
    s = R.int(12, 60); k = R.int(6, 18); eenh = 'op bladzijde';
    q = `${n} leest een hoofdstuk dat begint op bladzijde ${s}. Precies halverwege het hoofdstuk is ${n} op bladzijde ${s + k}.\nOp welke bladzijde eindigt het hoofdstuk?`;
  }
  return {q, velden:[{voor:eenh, w:s + 2 * k}],
    u:`Van ${s} tot ${s + k} is ${k}. Dat is de helft van de hele afstand.\nDe hele afstand is 2 × ${k} = ${2 * k}.\nHet einde ligt op ${s} + ${2 * k} = ${s + 2 * k}.`,
    tip:`Tot halverwege is de helft. Hoe groot is dan het geheel?`};
});

g('t_terug','pro',2,3, R => {
  const n = R.naam(), soort = R.kies(['stickers', 'pannenkoeken', 'batterij', 'bus']);
  let x, b, c, r, q, eenh, u;
  if (soort === 'stickers') {
    x = R.int(15, 60); b = R.int(5, 25); c = R.int(5, x + b - 3); r = x + b - c; eenh = 'stickers';
    q = `${n} heeft een aantal stickers. ${n} krijgt er ${b} bij van een vriend en geeft er daarna ${c} weg aan een zus. Nu heeft ${n} er nog ${r}.\nHoeveel stickers had ${n} in het begin?`;
  } else if (soort === 'pannenkoeken') {
    x = R.int(10, 30); b = R.int(8, 24); c = R.int(10, x + b - 2); r = x + b - c; eenh = 'pannenkoeken';
    q = `Voor een feestje bakt ${n} 's ochtends een aantal wafels. Tijdens het feest bakt ${n} er nog ${b}. Er worden ${c} wafels opgegeten. Op het einde blijven er ${r} over.\nHoeveel wafels bakte ${n} 's ochtends?`; eenh = 'wafels';
  } else if (soort === 'batterij') {
    x = R.int(10, 40); b = R.int(15, 35); c = R.int(20, x + b - 2); r = x + b - c; eenh = 'kWh';
    q = `${n} rijdt met een elektrische auto naar de zee. Onderweg laadt de auto ${b} kWh bij. Voor de hele rit verbruikt de auto ${c} kWh. Bij aankomst zit er nog ${r} kWh in de batterij.\nMet hoeveel kWh vertrok ${n}?`;
  } else {
    x = R.int(12, 40); b = R.int(4, 15); c = R.int(3, x + b - 2); r = x + b - c; eenh = 'reizigers';
    q = `Aan een bushalte stappen ${b} reizigers in en ${c} reizigers uit. Daarna zitten er ${r} reizigers op de bus.\nHoeveel reizigers zaten er op de bus vóór de halte?`;
  }
  return {q, velden:[{w:x, na:eenh}],
    u:`Werk terug vanaf het einde.\nOp het einde: ${r}. Wat eraf ging (${c}) tel je er weer bij: ${r} + ${c} = ${r + c}.\nWat erbij kwam (${b}) trek je er weer af: ${r + c} − ${b} = ${x}.\nControle: ${x} + ${b} − ${c} = ${r}.`,
    tip:`Begin bij het einde en doe alles in omgekeerde volgorde.`};
});

g('t_temp','pro',2,3, R => {
  const r = R.stap(6, 15, 0.5), M = R.stap(1.5, 9, 0.5), m = M - r, terug = R.int(0, 1);
  if (terug) return {q:`Op een winterdag was het 's ochtends het koudst. Tegen de namiddag was de temperatuur ${f(r)} graden gestegen tot ${f(M)} °C.\nHoe koud was het 's ochtends?`,
    velden:[{w:m, na:'°C'}], u:`De temperatuur steeg ${f(r)} graden. Terugrekenen: ${f(M)} − ${f(r)} = ${f(m)}.\nHet was 's ochtends ${f(m)} °C.`,
    tip:`Teken een thermometer. Vertrek bij ${f(M)} en ga ${f(r)} naar beneden.`};
  return {q:`'s Nachts was het ${f(m)} °C. Overdag steeg de temperatuur ${f(r)} graden.\nWat was de hoogste temperatuur overdag?`,
    velden:[{w:M, na:'°C'}], u:`Stijgen is optellen: ${f(m)} + ${f(r)} = ${f(M)}.\nDe hoogste temperatuur was ${f(M)} °C.`,
    tip:`Teken een thermometer. Vertrek bij ${f(m)} en ga ${f(r)} omhoog.`};
});

g('t_korting','pro',2,3, R => {
  let O, pc, N;
  do { O = R.kies([40, 50, 60, 80, 120, 125, 150, 160, 200, 250]); pc = R.kies([10, 15, 20, 25, 30, 40]); N = O * (100 - pc) / 100; } while (Math.round(N * 100) % 1);
  const ding = R.kies(['een fiets', 'een skateboard', 'een jas', 'een step', 'een paar sportschoenen', 'een gitaar']), n = R.naam();
  return {q:`${n} koopt ${ding} van ${eur(O)}. ${n} krijgt korting en betaalt maar ${eur(N)}.\nHoeveel procent korting kreeg ${n}?`,
    velden:[{w:pc, na:'%'}], u:`Stap 1: de korting is ${eur(O)} − ${eur(N)} = ${eur(O - N)}.\nStap 2: welk deel van de oude prijs is dat? ${f(O - N)} : ${f(O)} = ${f((O - N) / O, 4)}.\nStap 3: ${f((O - N) / O, 4)} = ${pc} %.`,
    tip:`Hoeveel euro korting is het? Vergelijk dat met de oorspronkelijke prijs.`};
});

g('t_procentdeel','pro',2,3, R => {
  let n, pc; do { n = R.kies([20, 24, 25, 28, 30, 32, 40, 50]); pc = R.kies([10, 20, 25, 30, 40, 50, 60, 75]); } while ((n * pc) % 100);
  const wat = R.kies(['komt met de fiets naar school', 'speelt een muziekinstrument', 'doet aan een sport in een club', 'heeft een huisdier']);
  return {q:`In een jeugdbeweging zitten ${n} kinderen. ${pc} % van hen ${wat}.\nHoeveel kinderen zijn dat?`,
    velden:[{w:n * pc / 100, na:'kinderen'}], u:`${pc} % betekent ${pc} van de 100. 10 % van ${n} is ${f(n / 10)}.\n${pc} % is ${pc / 10} keer zoveel: ${pc / 10} × ${f(n / 10)} = ${f(n * pc / 100)}.`,
    tip:`Bereken eerst 10 % van ${n}.`};
});

g('t_draad','pro',2,3, R => {
  const l = R.int(12, 40), b = R.int(6, l - 2), h = R.int(2, 4), n = R.naam();
  const ctx = R.kies([['prikkeldraad rond een weide', 'weide'], ['een lint rond een speelplein', 'speelplein'], ['een touw rond een moestuin', 'moestuin']]);
  return {q:`${n} spant ${ctx[0]}, op ${h} verschillende hoogtes. De ${ctx[1]} is rechthoekig: ${l} m lang en ${b} m breed.\nHoeveel meter heeft ${n} in totaal nodig?`,
    velden:[{w:2 * (l + b) * h, na:'m'}],
    u:`Stap 1: één keer rond = de omtrek: 2 × (${l} + ${b}) = ${2 * (l + b)} m.\nStap 2: dat ${h} keer, op ${h} hoogtes: ${h} × ${2 * (l + b)} = ${2 * (l + b) * h} m.`,
    tip:`Hoeveel meter is één keer rond? Hoeveel keer moet ${n} rond?`};
});

g('t_recept','pro',2,3, R => {
  const p = R.kies([2, 3, 4, 5, 6]), k = R.kies([2, 3, 4]), q = p * k, gr = R.stap(50, 400, 25);
  const ing = R.kies([['bloem', 'g'], ['pasta', 'g'], ['melk', 'ml'], ['rijst', 'g']]);
  return {q:`Voor ${p} personen heb je ${gr} ${ing[1]} ${ing[0]} nodig.\nHoeveel ${ing[0]} heb je nodig voor ${q} personen?`,
    velden:[{w:gr * k, na:ing[1]}], u:`${q} personen is ${k} keer zoveel als ${p} personen.\nJe hebt ook ${k} keer zoveel nodig: ${k} × ${gr} = ${gr * k} ${ing[1]}.`,
    tip:`Hoeveel keer meer personen zijn er?`};
});

g('t_kubuszij','pro',2,3, R => {
  const r = R.int(2, 9), eenh = R.kies(['cm²', 'dm²', 'm²']);
  return {q:`De oppervlakte van één zijvlak van een kubus is ${r * r} ${eenh}.\nHoe groot is de totale oppervlakte van de kubus?`,
    velden:[{w:6 * r * r, na:eenh}], u:`Een kubus heeft 6 gelijke vierkante zijvlakken.\nTotale oppervlakte: 6 × ${r * r} = ${6 * r * r} ${eenh}.`,
    tip:`Hoeveel zijvlakken heeft een kubus? Zijn ze even groot?`};
});

g('t_gem','pro',3,4, R => {
  const ctx = R.kies([['minuten', 'leest', 'minuten'], ['kilometer', 'fietst', 'km'], ['minuten', 'traint', 'minuten']]);
  const n = R.naam(), dagen = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'];
  let v, M; do { v = dagen.map(() => R.int(10, 40)); M = v.reduce((a, b) => a + b, 0) / 5; } while (M % 1);
  const mis = R.int(1, 3);
  const bek = v.map((x, i) => i === mis ? null : dagen[i] + ' ' + x).filter(x => x).join(', ');
  const som = v.reduce((a, b) => a + b, 0) - v[mis];
  return {q:`${n} noteert elke schooldag hoeveel ${ctx[0]} ${n} ${ctx[1]}: ${bek} ${ctx[2]}. Op ${dagen[mis]} vergat ${n} het op te schrijven.\nVan maandag tot en met vrijdag was het gemiddelde ${M} ${ctx[2]} per dag.\nHoeveel ${ctx[0]} ${ctx[1]} ${n} op ${dagen[mis]}?`,
    velden:[{w:v[mis], na:ctx[2]}],
    u:`Stap 1: een gemiddelde van ${M} op 5 dagen betekent samen 5 × ${M} = ${5 * M}.\nStap 2: de vier bekende dagen samen: ${som}.\nStap 3: ${dagen[mis]}: ${5 * M} − ${som} = ${v[mis]}.`,
    tip:`Als je het gemiddelde kent, kan je het totaal uitrekenen.`};
});

g('t_prijs','pro',3,4, R => {
  const a = R.kies([6, 8, 10, 12]), ua = R.stap(0.4, 0.9, 0.05), b = R.kies([4, 5, 6, 8]), ub = R.stap(0.25, 0.6, 0.05);
  const ka = R.int(2, a - 2), kb = R.int(1, b - 2), [n1, n2] = R.namen(2);
  const it = R.kies([['flesjes appelsap', 'koeken', 'flesje', 'koek'], ['pakjes chocomelk', 'wafels', 'pakje', 'wafel'], ['blikjes frisdrank', 'repen', 'blikje', 'reep']]);
  const tot = ka * ua + kb * ub;
  return {q:`${n1} koopt een verpakking van ${a} ${it[0]} voor ${eur(a * ua)} en een pak met ${b} ${it[1]} voor ${eur(b * ub)}. ${n2} neemt ${ka} ${it[0]} en ${kb} ${it[1]} van ${n1} over en betaalt precies wat ze kosten.\nHoeveel betaalt ${n2} aan ${n1}?`,
    velden:[{voor:'€', w:tot}], calc:'w',
    u:`Stap 1: één ${it[2]} kost ${eur(a * ua)} : ${a} = ${eur(ua)}.\nStap 2: één ${it[3]} kost ${eur(b * ub)} : ${b} = ${eur(ub)}.\nStap 3: ${ka} × ${eur(ua)} + ${kb} × ${eur(ub)} = ${eur(ka * ua)} + ${eur(kb * ub)} = ${eur(tot)}.`,
    tip:`Reken eerst de prijs van één stuk uit.`};
});

g('t_rapport','pro',3,4, R => {
  let T, pc, p; do { T = R.kies([10, 12, 15, 16, 20, 25, 30, 40]); pc = R.kies([55, 60, 65, 70, 75, 80, 85, 90]); p = T * pc / 100; } while ((p * 2) % 1);
  const n = R.naam(), vak = R.kies(['wiskunde', 'Frans', 'Nederlands', 'Engels']);
  const onder = R.kies([['meetkunde', 'getallenleer', 'algebra'], ['lezen', 'spreken', 'luisteren'], ['woordenschat', 'grammatica', 'spelling']]);
  const andere = [[8, 10], [12, 15], [17, 20]].map(x => [x[0], x[1], f(x[0] / x[1] * 100, 1) + ' %']);
  const rijen = [[onder[0], f(andere[0][0]), f(andere[0][1]), andere[0][2]], [onder[1], f(andere[2][0]), f(andere[2][1]), andere[2][2]], [onder[2], f(p), '#vlek', pc + ' %']];
  return {q:`Er viel een vlek op het rapport van ${n}. Eén getal is niet meer te lezen.\nOp hoeveel punten stond het onderdeel ${onder[2]}?`,
    velden:[{voor:'op', w:T, na:'punten'}], calc:'e',
    fig:{t:'tab', titel:`Rapport ${vak} van ${n}`, kop:['Onderdeel', 'Punten', 'Totaal', 'Behaald'], rijen},
    u:`${n} behaalde ${pc} % voor ${onder[2]}. De ${f(p)} punten zijn dus ${pc} % van het totaal.\n1 % is ${f(p)} : ${pc} = ${f(p / pc, 4)} punten.\n100 % is ${f(p / pc, 4)} × 100 = ${T} punten.\nControle: ${f(p)} : ${T} = ${f(pc / 100)} = ${pc} %.`,
    tip:`${f(p)} punten is ${pc} % van het totaal. Hoeveel punten is 1 %?`};
});

g('t_boven','pro',3,4, R => {
  const soort = R.kies(['bus', 'bokaal', 'doos', 'rit']);
  let q, ant, u, eenh;
  if (soort === 'bus') {
    let L, T, P; do { L = R.int(180, 420); T = R.int(12, 35); P = R.kies([48, 50, 51, 55, 60]); } while ((L + T) % P === 0);
    ant = Math.ceil((L + T) / P); eenh = 'bussen';
    q = `Een school gaat op uitstap. Er gaan ${L} leerlingen en ${T} leerkrachten mee. In elke bus zijn ${P} zitplaatsen.\nHoeveel bussen moet de school minstens bestellen?`;
    u = `Stap 1: in totaal gaan er ${L} + ${T} = ${L + T} personen mee.\nStap 2: ${L + T} : ${P} = ${f((L + T) / P, 2)}.\nStap 3: met ${ant - 1} bussen is er geen plaats voor iedereen. Je rondt naar boven af: ${ant} bussen.`;
  } else if (soort === 'bokaal') {
    let k, gr; do { k = R.kies([4, 5, 6]); gr = R.stap(1050, 2950, 50); } while ((gr * k) % 1000 === 0);
    ant = Math.ceil(gr * k / 1000); eenh = 'bokalen';
    q = `Oma maakt confituur. Met 1 kg aardbeien vult ze ${k} even grote bokalen. Ze heeft ${f(gr)} g aardbeien.\nHoeveel van die bokalen heeft ze minstens nodig?`;
    u = `Stap 1: ${f(gr)} g = ${f(gr / 1000, 3)} kg.\nStap 2: ${f(gr / 1000, 3)} × ${k} = ${f(gr * k / 1000, 3)} bokalen.\nStap 3: een deel van een bokaal moet ook ergens in. Je rondt naar boven af: ${ant} bokalen.`;
  } else if (soort === 'doos') {
    let e, d; do { e = R.int(40, 140); d = R.kies([6, 10, 12]); } while (e % d === 0);
    ant = Math.ceil(e / d); eenh = 'dozen';
    q = `Een kippenboer raapt ${e} eieren. Hij verpakt ze in dozen van ${d} eieren.\nHoeveel dozen heeft hij minstens nodig om alle eieren te verpakken?`;
    u = `${e} : ${d} = ${f(e / d, 2)}.\nIn ${ant - 1} dozen passen maar ${(ant - 1) * d} eieren. Voor de overige ${e - (ant - 1) * d} eieren is nog een doos nodig: ${ant} dozen.`;
  } else {
    let s, p; do { s = R.int(150, 380); p = R.kies([36, 40, 45, 48]); } while (s % p === 0);
    ant = Math.ceil(s / p); eenh = 'ritten';
    q = `Voor een concert moeten er ${s} stoelen naar de sporthal. Een bestelwagen kan per rit ${p} stoelen meenemen.\nHoeveel ritten zijn er minstens nodig?`;
    u = `${s} : ${p} = ${f(s / p, 2)}.\nMet ${ant - 1} ritten breng je maar ${(ant - 1) * p} stoelen. Voor de laatste ${s - (ant - 1) * p} stoelen is nog een rit nodig: ${ant} ritten.`;
  }
  return {q, velden:[{w:ant, na:eenh}], u, tip:`Kan je een deel van een ${soort === 'bokaal' ? 'bokaal' : soort === 'bus' ? 'bus' : soort === 'doos' ? 'doos' : 'rit'} gebruiken? Moet je naar boven of naar beneden afronden?`};
});

g('t_water','pro',3,4, R => {
  let a, p, b, q2, n, tot; do { a = R.int(3, 8); p = R.kies([1.5, 2, 1]); b = R.int(2, 6); q2 = R.kies([0.5, 0.75, 0.25, 0.33]); n = a + b; tot = a * p + b * q2; } while (q2 === 0.33 || Math.round(tot / n * 1000) % 10 || p === q2);
  const naam = R.naam();
  return {q:`${naam} heeft ${a} flessen water van ${f(p)} liter en ${b} flessen water van ${f(q2)} liter. ${naam} verdeelt al dat water over de ${n} flessen, zodat er in elke fles evenveel water zit.\nHoeveel water zit er dan in elke fles? Geef het antwoord exact.`,
    velden:[{w:tot / n, na:'liter'}],
    u:`Stap 1: water in totaal: ${a} × ${f(p)} + ${b} × ${f(q2)} = ${f(a * p)} + ${f(b * q2)} = ${f(tot)} liter.\nStap 2: verdeeld over ${n} flessen: ${f(tot)} : ${n} = ${f(tot / n, 3)} liter.`,
    tip:`Hoeveel water is er in totaal? Over hoeveel flessen wordt het verdeeld?`};
});

g('t_omtrekopp','pro',3,4, R => {
  const l = R.stap(4, 12, 0.5), b = R.stap(1.5, l - 0.5, 0.5), eenh = R.kies(['m', 'dam', 'cm']), P = 2 * (l + b);
  return {q:`De omtrek van een rechthoek is ${f(P)} ${eenh}. De lengte van de rechthoek is ${f(l)} ${eenh}.\nHoe groot is de oppervlakte van de rechthoek?`,
    velden:[{w:l * b, na:eenh + '²'}],
    u:`Stap 1: de omtrek is 2 lengtes en 2 breedtes. Eén lengte + één breedte = ${f(P)} : 2 = ${f(P / 2)} ${eenh}.\nStap 2: de breedte is ${f(P / 2)} − ${f(l)} = ${f(b)} ${eenh}.\nStap 3: oppervlakte = lengte × breedte = ${f(l)} × ${f(b)} = ${f(l * b)} ${eenh}².\nLet op: de omtrek is geen zijde. Vermenigvuldig dus niet met ${f(P)}.`,
    tip:`Zoek eerst de breedte. De omtrek is lengte + breedte + lengte + breedte.`};
});

g('t_vierkantplaat','pro',3,4, R => {
  const a = R.stap(40, 150, 5), b = a + R.stap(20, 140, 5), n = R.naam();
  return {q:`${n} heeft een houten plank van ${a} cm op ${b} cm. ${n} zaagt daaruit een zo groot mogelijk vierkant tafelblad.\nHoe groot is de oppervlakte van dat tafelblad?`,
    velden:[{w:a * a, na:'cm²'}], calc:'e',
    u:`Een vierkant heeft 4 even lange zijden. De zijde kan niet langer zijn dan de kortste kant van de plank: ${a} cm.\nOppervlakte: ${a} × ${a} = ${f(a * a)} cm².`,
    tip:`Hoe lang kan de zijde van het vierkant hoogstens zijn?`};
});

g('t_schaal','pro',3,4, R => {
  const S = R.kies([20000, 25000, 50000, 100000]), c = R.stap(2, 14, 0.5);
  return {q:`Op een wandelkaart met schaal 1 : ${f(S)} is de afstand tussen twee kerken ${f(c)} cm.\nHoeveel kilometer liggen de kerken in werkelijkheid van elkaar?`,
    velden:[{w:c * S / 100000, na:'km'}],
    u:`Schaal 1 : ${f(S)} betekent: 1 cm op de kaart is ${f(S)} cm in werkelijkheid.\n${f(c)} × ${f(S)} = ${f(c * S)} cm.\n${f(c * S)} cm = ${f(c * S / 100)} m = ${f(c * S / 100000, 3)} km.`,
    tip:`Reken eerst om naar cm in werkelijkheid. Hoeveel cm is 1 km?`};
});

g('t_snelheid','pro',3,4, R => {
  const v = R.kies([12, 15, 18, 20, 24, 30, 60, 90]), t = R.kies([10, 15, 20, 30, 40, 45, 50]), d = v * t / 60;
  if (d % 0.5) return null;
  const n = R.naam(), hoe = v <= 30 ? 'fietst' : 'rijdt met de auto';
  return {q:`${n} ${hoe} met een gemiddelde snelheid van ${v} km per uur. De afstand is ${f(d)} km.\nHoeveel minuten duurt de rit?`,
    velden:[{w:t, na:'minuten'}],
    u:`In 1 uur (60 minuten) legt ${n} ${v} km af. In 1 minuut is dat ${v} : 60 = ${f(v / 60, 3)} km.\n${f(d)} km duurt ${f(d)} : ${f(v / 60, 3)} = ${t} minuten.\nOf: ${f(d)} : ${v} = ${f(d / v, 4)} uur = ${f(d / v, 4)} × 60 = ${t} minuten.`,
    tip:`Hoeveel kilometer legt ${n} af in 1 minuut?`};
});

g('t_kubusnet','pro',4,5, R => {
  const r = R.int(2, 9), nets = [
    [[1,0],[0,1],[1,1],[2,1],[3,1],[1,2]], [[0,0],[0,1],[1,1],[2,1],[3,1],[3,2]], [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]], [[1,0],[1,1],[0,1],[2,1],[2,2],[3,2]]];
  const vraagVol = R.int(0, 1);
  return {q:`Een kubus wordt opengevouwen zoals in de figuur. De oppervlakte van de ontvouwing is ${6 * r * r} cm².\n${vraagVol ? 'Hoe groot is het volume van de kubus?' : 'Hoe lang is een ribbe van de kubus?'}`,
    velden:[vraagVol ? {w:r * r * r, na:'cm³'} : {w:r, na:'cm'}], calc:'e',
    fig:{t:'net', cellen:R.kies(nets), alt:'Ontvouwing van een kubus: zes even grote vierkanten.'},
    u:`Stap 1: de ontvouwing bestaat uit 6 even grote vierkanten. Eén vierkant: ${6 * r * r} : 6 = ${r * r} cm².\nStap 2: ${r} × ${r} = ${r * r}, dus een ribbe is ${r} cm.` + (vraagVol ? `\nStap 3: volume = ribbe × ribbe × ribbe = ${r} × ${r} × ${r} = ${r * r * r} cm³.` : ''),
    tip:`Uit hoeveel vierkanten bestaat de ontvouwing?`};
});

g('t_weken','pro',4,5, R => {
  let u, h, d, D; do { u = R.int(9, 14); h = R.int(5, 8); d = R.int(3, 5); D = R.stap(800, 2400, 100); } while (D % (u * h * d) === 0 || D / (u * h * d) > 9);
  const w = u * h * d, ant = Math.ceil(D / w), n = R.naam();
  return {q:`${n} doet een vakantiejob en verdient ${eur(u)} per uur. ${n} werkt ${h} uur per dag en ${d} dagen per week. ${n} wil ${eur(D)} sparen voor een reis.\nHoeveel volledige weken moet ${n} daarvoor minstens werken?`,
    velden:[{w:ant, na:'weken'}],
    u:`Stap 1: per week: ${eur(u)} × ${h} × ${d} = ${eur(w)}.\nStap 2: ${f(D)} : ${f(w)} = ${f(D / w, 2)} weken.\nStap 3: na ${ant - 1} weken heeft ${n} maar ${eur((ant - 1) * w)}. Je rondt naar boven af: ${ant} weken.`,
    tip:`Hoeveel verdient ${n} in één week?`};
});

g('t_verdeel','pro',4,5, R => {
  const B = R.int(8, 40), k1 = R.int(2, 3), k2 = R.int(3, 5), totaal = B * (1 + k1 + k2);
  if (k1 === k2) return null;
  const ctx = R.kies([['Een groothandel heeft', 'paletten', 'winkels'], ['Een vereniging verdeelt', 'euro', 'afdelingen'], ['Een boer verdeelt', 'kilogram aardappelen', 'kopers']]);
  return {q:`${ctx[0]} ${totaal} ${ctx[1]} over drie ${ctx[2]}: A, B en C. A krijgt ${k1 === 2 ? 'dubbel zoveel' : 'drie keer zoveel'} als B. C krijgt ${k2} keer zoveel als B.\nHoeveel ${ctx[1]} krijgt A?`,
    velden:[{w:k1 * B, na:ctx[1]}],
    u:`Noem het deel van B één blokje.\nA krijgt ${k1} blokjes, C krijgt ${k2} blokjes. Samen: 1 + ${k1} + ${k2} = ${1 + k1 + k2} blokjes.\nEén blokje: ${totaal} : ${1 + k1 + k2} = ${B}.\nA krijgt ${k1} × ${B} = ${k1 * B}. Controle: ${B} + ${k1 * B} + ${k2 * B} = ${totaal}.`,
    tip:`Stel het deel van B voor met één blokje. Hoeveel blokjes zijn er samen?`};
});

g('t_breukeet','pro',4,5, R => {
  const fr = R.kies([[2, 3], [3, 4], [1, 2], [3, 5]]), dier = R.kies(['honden', 'katten', 'geiten']), jong = {honden:'puppy', katten:'kitten', geiten:'jonge geit'}[dier];
  const a = R.int(4, 14) * fr[1] * 5, n = R.naam(), j = a * fr[0] / fr[1];
  return {q:`${n} heeft 2 volwassen ${dier}. Ze eten elk evenveel. Samen eten ze ${2 * a} g voer per dag. Er komt een ${jong} bij. De ${jong} eet ${fr[0] === 1 && fr[1] === 2 ? 'de helft' : '{{' + fr[0] + '|' + fr[1] + '}}'} van wat een volwassen dier eet.\nHoeveel voer heeft ${n} nu per dag nodig voor de 3 dieren?`,
    velden:[{w:2 * a + j, na:'g'}],
    u:`Stap 1: één volwassen dier eet ${2 * a} : 2 = ${a} g.\nStap 2: de ${jong} eet {{${fr[0]}|${fr[1]}}} van ${a} g: ${a} : ${fr[1]} = ${a / fr[1]} en ${fr[0]} × ${a / fr[1]} = ${j} g.\nStap 3: samen: ${2 * a} + ${j} = ${2 * a + j} g.`,
    tip:`Hoeveel eet één volwassen dier?`};
});

g('t_drinkbak','pro',4,5, R => {
  const l = R.stap(100, 220, 10), b = R.stap(30, 60, 0.5), d = R.int(5, 15), vol = l * b * d;
  return {q:`Op een boerderij staat een drinkbak in de vorm van een balk. Hij is ${l} cm lang, ${f(b)} cm breed en 50 cm hoog. 's Ochtends is hij helemaal vol. 's Middags staat het water ${d} cm onder de rand.\nHoeveel liter water hebben de dieren gedronken? Geef het antwoord tot op 0,1 nauwkeurig.`,
    velden:[{w:Math.round(vol / 100) / 10, na:'liter'}], calc:'w',
    u:`Het water dat weg is, vormt een balk van ${l} cm lang, ${f(b)} cm breed en ${d} cm hoog. De hoogte van de bak (50 cm) heb je niet nodig.\nVolume: ${l} × ${f(b)} × ${d} = ${f(vol)} cm³.\n1 liter = 1 000 cm³, dus ${f(vol)} cm³ = ${f(vol / 1000, 3)} liter, afgerond ${f(Math.round(vol / 100) / 10, 1)} liter.`,
    tip:`Welk deel van de bak is leeg? Hoeveel cm³ is 1 liter?`};
});

g('t_overbodig','pro',4,5, R => {
  let L, v, per; do { L = R.stap(150, 600, 10); v = R.stap(600, 1500, 100); per = R.kies([20000, 25000, 40000, 50000]); } while ((L * v) % per === 0);
  const ant = Math.ceil(L * v / per);
  return {q:`Een school heeft ${L} leerlingen. Elke leerling gebruikt per jaar ${f(v)} vellen papier van 80 g/m². Uit één boom van 12 m hoog kan men ${f(per)} van die vellen maken.\nHoeveel bomen zijn er per jaar minstens nodig voor het papier van de school?`,
    velden:[{w:ant, na:'bomen'}], calc:'w',
    u:`De hoogte van de boom en de 80 g/m² heb je niet nodig.\nStap 1: vellen per jaar: ${L} × ${f(v)} = ${f(L * v)}.\nStap 2: ${f(L * v)} : ${f(per)} = ${f(L * v / per, 2)} bomen.\nStap 3: met ${ant - 1} bomen heb je te weinig papier. Je rondt naar boven af: ${ant} bomen.`,
    tip:`Markeer de gegevens die je echt nodig hebt. Er staan er twee te veel in de opgave.`};
});

g('t_regen','pro',4,5, R => {
  const fr = R.kies([[4, 5], [3, 4], [2, 3], [3, 5], [5, 4], [3, 2]]), gem = R.stap(30, 90, fr[0] === 3 && fr[1] === 2 ? 2 : 1);
  const x = gem * fr[0] / fr[1];
  if (Math.round(x * 100) % 1) return null;
  const maand = R.kies(['april', 'mei', 'oktober', 'november']);
  return {q:`In ${maand} viel er in Ukkel ${f(x)} ℓ regen per m². Dat is {{${fr[0]}|${fr[1]}}} van de gemiddelde hoeveelheid regen in ${maand}.\nHoeveel regen valt er gemiddeld in ${maand}? Geef het antwoord exact.`,
    velden:[{w:gem, na:'ℓ per m²'}], calc:'w',
    u:`{{${fr[0]}|${fr[1]}}} van het gemiddelde is ${f(x)} ℓ.\n{{1|${fr[1]}}} van het gemiddelde is ${f(x)} : ${fr[0]} = ${f(x / fr[0], 4)} ℓ.\nHet gemiddelde ({{${fr[1]}|${fr[1]}}}) is ${fr[1]} × ${f(x / fr[0], 4)} = ${f(gem)} ℓ per m².`,
    tip:`Als je weet hoeveel {{${fr[0]}|${fr[1]}}} is, hoeveel is dan {{1|${fr[1]}}}?`};
});

g('t_abo','pro',4,5, R => {
  const a = R.int(6, 12), b = R.int(2, a - 2), V = R.int(15, 45);
  if (V % (a - b) === 0) return null;
  const ant = Math.floor(V / (a - b)) + 1, n = R.naam(), wat = R.kies(['het zwembad', 'de klimzaal', 'de fitness']);
  return {q:`Voor ${wat} zijn er twee formules.\nFormule 1: je betaalt ${eur(a)} per beurt.\nFormule 2: je betaalt ${eur(V)} per maand en daarbovenop ${eur(b)} per beurt.\nVanaf hoeveel beurten per maand is formule 2 goedkoper dan formule 1?`,
    velden:[{voor:'vanaf', w:ant, na:'beurten'}],
    u:`Per beurt is formule 2 ${eur(a - b)} goedkoper, maar je betaalt eerst ${eur(V)} extra.\n${f(V)} : ${f(a - b)} = ${f(V / (a - b), 2)}. Na ${ant - 1} beurten is formule 2 nog niet goedkoper.\nControle bij ${ant} beurten: formule 1: ${ant} × ${eur(a)} = ${eur(ant * a)}; formule 2: ${eur(V)} + ${ant} × ${eur(b)} = ${eur(V + ant * b)}. Formule 2 is goedkoper vanaf ${ant} beurten.`,
    tip:`Maak een tabel met de prijs van beide formules voor 1, 2, 3, … beurten.`};
});

g('t_opeen','pro',4,0, R => {
  const n = R.kies([3, 5]), m = R.int(-6, 6), groot = R.int(0, 1), k = (n - 1) / 2;
  return {q:`De som van ${n === 3 ? 'drie' : 'vijf'} opeenvolgende gehele getallen is ${f(n * m)}.\nWat is het ${groot ? 'grootste' : 'kleinste'} van die getallen?`,
    velden:[{w:groot ? m + k : m - k}],
    u:`Bij opeenvolgende getallen ligt het middelste getal precies in het midden. Het middelste getal is ${f(n * m)} : ${n} = ${f(m)}.\nDe getallen zijn ${Array.from({length:n}, (x, i) => f(m - k + i)).join(', ')}.\nHet ${groot ? 'grootste' : 'kleinste'} getal is ${f(groot ? m + k : m - k)}. Controle: de som is ${f(n * m)}.`,
    tip:`Wat is het middelste getal?`};
});

g('t_symkleur','pro',4,5, R => {
  // rooster 8 x 8 met symmetrieassen in het midden; gekleurde vakjes moeten symmetrisch worden
  const N = 8, baan = (x, y) => [[x, y], [N - 1 - x, y], [x, N - 1 - y], [N - 1 - x, N - 1 - y]];
  let gekleurd, totaal;
  do {
    const set = new Set();
    const k = R.int(4, 7);
    while (set.size < k) { const x = R.int(0, N - 1), y = R.int(0, N - 1); set.add(x + ',' + y); }
    gekleurd = [...set].map(s => s.split(',').map(Number));
    const all = new Set(); gekleurd.forEach(([x, y]) => baan(x, y).forEach(p => all.add(p.join(','))));
    totaal = all.size;
  } while (totaal - gekleurd.length < 4 || totaal - gekleurd.length > 16);
  const n = R.naam();
  return {q:`Het rooster bestaat uit gelijke vierkanten. ${n} kleurde al ${gekleurd.length} vierkanten. ${n} wil een figuur waarvan s en t symmetrieassen zijn.\nHoeveel vierkanten moet ${n} minstens nog kleuren?`,
    velden:[{w:totaal - gekleurd.length, na:'vierkanten'}], calc:null,
    fig:{t:'kleur', n:N, cellen:gekleurd, alt:'Rooster van 8 op 8 met twee symmetrieassen s en t en enkele gekleurde vierkanten.'},
    u:`Spiegel elk gekleurd vierkant om s, om t en om beide assen. Zo hoort bij elk vierkant een groepje van 4 vierkanten (minder als het al gespiegeld is).\nIn totaal moeten er ${totaal} vierkanten gekleurd zijn. Er zijn er al ${gekleurd.length}.\n${totaal} − ${gekleurd.length} = ${totaal - gekleurd.length}.`,
    tip:`Spiegel elk gekleurd vierkant eerst om s en daarna alles om t. Teken op kladpapier mee.`};
});

g('t_taart','pro',2,3, R => {
  const sets = [['Haarzorg', 'Sport', 'Techniek', 'Zorg'], ['Voetbal', 'Dans', 'Muziek', 'Tekenen'], ['Fiets', 'Bus', 'Te voet', 'Auto']];
  const cat = R.kies(sets);
  let p; do { p = [R.stap(10, 45, 0.1), R.stap(10, 35, 0.1), R.stap(5, 30, 0.1)].map(x => Math.round(x * 10) / 10); } while (100 - p[0] - p[1] - p[2] < 5);
  const mis = Math.round((100 - p[0] - p[1] - p[2]) * 10) / 10;
  return {q:`Het cirkeldiagram toont hoe de leerlingen van een school verdeeld zijn over ${cat[0] === 'Fiets' ? 'de manier waarop ze naar school komen' : cat[0] === 'Voetbal' ? 'hun favoriete hobby' : 'de studierichtingen'}.\nHoeveel procent van de leerlingen hoort bij '${cat[3]}'? Geef het antwoord tot op 0,1 % nauwkeurig.`,
    velden:[{w:mis, na:'%'}], calc:'e',
    fig:{t:'taart', titel:'Verdeling van de leerlingen', delen:[[cat[0], p[0]], [cat[1], p[1]], [cat[2], p[2]], [cat[3], mis, '?']]},
    u:`Een cirkeldiagram is samen altijd 100 %.\nDe bekende delen samen: ${f(p[0], 1)} + ${f(p[1], 1)} + ${f(p[2], 1)} = ${f(p[0] + p[1] + p[2], 1)} %.\n'${cat[3]}': 100 − ${f(p[0] + p[1] + p[2], 1)} = ${f(mis, 1)} %.`,
    tip:`Hoeveel procent is een volledige cirkel samen?`};
});

g('t_plan','pro',3,4, R => {
  const sx = R.int(0, 3), sy = R.int(0, 2), dx = R.int(2, 5), dy = R.int(2, 4), sch = R.kies([10, 20, 50]), n = R.naam();
  const wat = R.kies(['het station', 'de bakker', 'het park', 'de sporthal']);
  return {q:`Op dit plan stelt de zijde van één hokje ${sch} m voor. Boven is het noorden en rechts is het oosten. ${n} woont bij W.\n${wat[0].toUpperCase() + wat.slice(1)} ligt ${dx * sch} m ten oosten en ${dy * sch} m ten noorden van het huis van ${n}.\nKlik op de plaats van ${wat}.`,
    rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:sx, y:sy, l:'W'}]}, w:{x:sx + dx, y:sy + dy},
    u:`${dx * sch} m is ${dx * sch} : ${sch} = ${dx} hokjes. ${dy * sch} m is ${dy} hokjes.\nVertrek bij W: ${dx} hokjes naar rechts (oosten) en ${dy} hokjes naar boven (noorden).`,
    tip:`Hoeveel hokjes is ${dx * sch} m?`};
});

g('t_coordrecht','pro',3,0, R => {
  const x1 = R.int(-4, -1), x2 = R.int(1, 4), y1 = R.int(1, 3), y2 = R.int(-4, -1);
  return {q:`De punten D(${f(x1)}, ${f(y1)}) en E(${f(x1)}, ${f(y2)}) zijn hoekpunten van de rechthoek DEFG. De hoekpunten F en G staan in het assenstelsel.\nWat is de oppervlakte van de rechthoek DEFG?`,
    velden:[{w:(x2 - x1) * (y1 - y2)}],
    fig:{t:'rooster2', alt:'Assenstelsel met de punten F en G en het lijnstuk [FG].', r:{xmin:-5, xmax:5, ymin:-5, ymax:4, assen:'xy', getallen:'een', punten:[{x:x2, y:y1, l:'G'}, {x:x2, y:y2, l:'F'}], lijnen:[{x1:x2, y1:y1, x2:x2, y2:y2, vol:1}]}},
    u:`[DE] loopt van y = ${f(y1)} tot y = ${f(y2)}: de lengte is ${f(y1)} − (${f(y2)}) = ${y1 - y2}.\nF en G liggen op x = ${f(x2)}. De afstand van x = ${f(x1)} tot x = ${f(x2)} is ${x2 - x1}.\nOppervlakte: ${y1 - y2} × ${x2 - x1} = ${(y1 - y2) * (x2 - x1)}.`,
    tip:`Lees de coördinaten van F en G af. Hoe lang zijn de zijden?`};
});

g('t_plaatsen','pro',0,1, R => {
  const P = R.kies([30, 40, 45, 50, 60]), b = R.int(8, P - 3);
  const ctx = R.kies([['Een bus heeft', 'zitplaatsen', 'Er zitten al', 'reizigers op de bus'], ['Een zaal heeft', 'stoelen', 'Er zitten al', 'mensen'], ['Een parking heeft', 'plaatsen', 'Er staan al', 'auto\'s']]);
  return {q:`${ctx[0]} ${P} ${ctx[1]}. ${ctx[2]} ${b} ${ctx[3]}.\nHoeveel ${ctx[1]} zijn er nog vrij?`, velden:[{w:P - b, na:ctx[1]}],
    u:`Vrij = alle ${ctx[1]} − de bezette.\n${P} − ${b} = ${P - b}.`, tip:`Zoek het verschil tussen alle plaatsen en de bezette plaatsen.`};
});

g('t_groepjes','pro',1,2, R => {
  const k = R.int(3, 6), n = k * R.int(4, 9);
  const wat = R.kies(['leerlingen worden verdeeld in groepjes', 'spelers worden verdeeld in ploegen', 'kinderen worden verdeeld over tafels']);
  const eenh = {'leerlingen worden verdeeld in groepjes':'groepjes', 'spelers worden verdeeld in ploegen':'ploegen', 'kinderen worden verdeeld over tafels':'tafels'}[wat];
  return {q:`${n} ${wat} van ${k}.\nHoeveel ${eenh} zijn er?`, velden:[{w:n / k, na:eenh}],
    u:`Verdelen in gelijke groepen is delen: ${n} : ${k} = ${n / k}.\nControle: ${n / k} × ${k} = ${n}.`, tip:`Verdelen in gelijke groepen: welke bewerking past daarbij?`};
});

g('t_sparen','pro',1,2, R => {
  const s = R.kies([4, 5, 6, 8, 10, 12, 15]), w = R.int(5, 12), n = R.naam();
  const ding = R.kies(['een spel', 'een paar schoenen', 'een koptelefoon', 'een step']);
  return {q:`${n} spaart elke week ${eur(s)}. ${n} wil ${ding} kopen van ${eur(s * w)}.\nHoeveel weken moet ${n} sparen?`, velden:[{w:w, na:'weken'}],
    u:`Hoeveel keer past ${eur(s)} in ${eur(s * w)}? ${s * w} : ${s} = ${w}.\n${n} moet ${w} weken sparen.`, tip:`Hoeveel keer moet ${n} ${eur(s)} opzij leggen?`};
});

g('t_samen','pro',0,1, R => {
  const n = R.naam(), a = R.int(12, 48), b = R.int(8, 39);
  const wat = R.kies([['knikkers', 'krijgt er nog'], ['kaartjes', 'wint er nog'], ['punten', 'scoort er nog']]);
  return {q:`${n} heeft ${a} ${wat[0]}. ${n} ${wat[1]} ${b} bij.\nHoeveel ${wat[0]} heeft ${n} nu?`, velden:[{w:a + b, na:wat[0]}],
    u:`Er komen ${wat[0]} bij, dus je telt op: ${a} + ${b} = ${a + b}.`, tip:`Worden het er meer of minder?`};
});

// Sjablonen GETALLENLEER, ALGEBRA, MEETKUNDE, STATISTIEK en VERZAMELINGEN
const haak = n => n < 0 ? '(' + f(n) + ')' : f(n);

/* ---------- getallenleer ---------- */
g('t_volgorde','get',1,2, R => {
  const soort = R.int(0, 2);
  if (soort === 0) { const a = R.int(5, 30), b = R.int(2, 9), c = R.int(2, 9);
    return {q:`Reken uit: ${a} + ${b} × ${c}`, velden:[{w:a + b * c}], u:`Vermenigvuldigen gaat vóór optellen.\n${b} × ${c} = ${b * c}.\n${a} + ${b * c} = ${a + b * c}.\nFout is: eerst ${a} + ${b} = ${a + b} en dan × ${c}.`}; }
  if (soort === 1) { const a = R.int(3, 9), b = R.int(3, 9), c = R.int(2, a * b - 1);
    return {q:`Reken uit: ${a} × ${b} − ${c}`, velden:[{w:a * b - c}], u:`Eerst vermenigvuldigen: ${a} × ${b} = ${a * b}.\nDan aftrekken: ${a * b} − ${c} = ${a * b - c}.`}; }
  const c = R.int(2, 9), q = R.int(2, 9), b = c * q, a = R.int(q + 1, 40);
  return {q:`Reken uit: ${a} − ${b} : ${c}`, velden:[{w:a - q}], u:`Delen gaat vóór aftrekken.\n${b} : ${c} = ${q}.\n${a} − ${q} = ${a - q}.`};
});

g('t_negatief','get',1,3, R => {
  let a, b, c; do { a = R.int(-12, 12); b = R.int(-12, 12); c = R.int(-12, 12); } while (!a || !b || !c || (a > 0 && b > 0 && c > 0));
  const r = a + b - c;
  return {q:`Reken uit: ${f(a)} + ${haak(b)} − ${haak(c)}`, velden:[{w:r}],
    u:`Optellen met een negatief getal is aftrekken. Een negatief getal aftrekken is het tegengestelde optellen.\n${f(a)} + ${haak(b)} = ${f(a + b)}.\n${f(a + b)} − ${haak(c)} = ${f(a + b)} ${c < 0 ? '+ ' + f(-c) : '− ' + f(c)} = ${f(r)}.`};
});

g('t_breukvan','get',2,3, R => {
  const q = R.kies([3, 4, 5, 6, 8, 10]), p = R.int(1, q - 1), N = q * R.int(3, 15);
  if (ggd(p, q) !== 1) return null;
  return {q:`Hoeveel is {{${p}|${q}}} van ${N}?`, velden:[{w:N * p / q}],
    u:`Eerst {{1|${q}}} van ${N}: ${N} : ${q} = ${N / q}.\nDan {{${p}|${q}}}: ${p} × ${N / q} = ${N * p / q}.`};
});

g('t_procentvan','get',1,2, R => {
  const pc = R.kies([5, 10, 15, 20, 25, 30, 50, 75]), N = R.kies([20, 40, 60, 80, 120, 160, 200, 240, 300, 400]);
  if ((N * pc) % 100) return null;
  return {q:`Hoeveel is ${pc} % van ${N}?`, velden:[{w:N * pc / 100}],
    u:`10 % van ${N} is ${f(N / 10)}.\n${pc} % is ${f(pc / 10)} keer zoveel: ${f(pc / 10)} × ${f(N / 10)} = ${f(N * pc / 100)}.`};
});

g('t_breukplus','get',3,5, R => {
  const nm = [2, 3, 4, 5, 6, 8, 10, 12];
  const b = R.kies(nm), d = R.kies(nm), a = R.int(1, b - 1), c = R.int(1, d - 1), plus = R.int(0, 1);
  if (b === d || ggd(a, b) !== 1 || ggd(c, d) !== 1) return null;
  const k = b * d / ggd(b, d), t = plus ? a * (k / b) + c * (k / d) : a * (k / b) - c * (k / d);
  if (t <= 0 || t % k === 0) return null;
  const tt = t / ggd(t, k), kk = k / ggd(t, k);
  return {q:`Reken uit: {{${a}|${b}}} ${plus ? '+' : '−'} {{${c}|${d}}}\nSchrijf je antwoord als een vereenvoudigde breuk.`,
    velden:[{w:tt + '/' + kk, vorm:'breuk'}],
    u:`Maak de noemers gelijk. Het kleinste gemeenschappelijke veelvoud van ${b} en ${d} is ${k}.\n{{${a}|${b}}} = {{${a * k / b}|${k}}} en {{${c}|${d}}} = {{${c * k / d}|${k}}}.\n{{${a * k / b}|${k}}} ${plus ? '+' : '−'} {{${c * k / d}|${k}}} = {{${t}|${k}}}` + (kk !== k ? ` = {{${tt}|${kk}}} (vereenvoudigd).` : '.') + `\nTellers en noemers gewoon optellen mag niet.`};
});

g('t_breukmaal','get',4,0, R => {
  const nm = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const a = R.int(1, 9), b = R.kies(nm), c = R.int(1, 9), d = R.kies(nm), maal = R.int(0, 1);
  if (ggd(a, b) !== 1 || ggd(c, d) !== 1 || a >= b * 2) return null;
  const t = maal ? a * c : a * d, n = maal ? b * d : b * c;
  if (t % n === 0) return null;
  const tt = t / ggd(t, n), nn = n / ggd(t, n);
  return {q:`Reken uit: {{${a}|${b}}} ${maal ? '·' : ':'} {{${c}|${d}}}\nSchrijf je antwoord als een vereenvoudigde breuk.`,
    velden:[{w:tt + '/' + nn, vorm:'breuk'}],
    u:(maal ? `Vermenigvuldig teller met teller en noemer met noemer: {{${a} · ${c}|${b} · ${d}}} = {{${t}|${n}}}.` :
      `Delen door een breuk is vermenigvuldigen met het omgekeerde: {{${a}|${b}}} · {{${d}|${c}}} = {{${t}|${n}}}.`) +
      (nn !== n ? `\nVereenvoudig door teller en noemer te delen door ${ggd(t, n)}: {{${tt}|${nn}}}.` : '')};
});

g('t_vereenv','get',2,3, R => {
  const b = R.int(3, 12), a = R.int(1, b - 1), k = R.int(2, 9);
  if (ggd(a, b) !== 1) return null;
  return {q:`Vereenvoudig de breuk {{${a * k}|${b * k}}} zo ver mogelijk.`, velden:[{w:a + '/' + b, vorm:'breuk'}],
    u:`De grootste gemeenschappelijke deler van ${a * k} en ${b * k} is ${k}.\n${a * k} : ${k} = ${a} en ${b * k} : ${k} = ${b}.\nDus {{${a * k}|${b * k}}} = {{${a}|${b}}}.`};
});

g('t_machtprod','get',3,0, R => {
  const gr = R.kies(['2', '3', '5', '7', 'a', 'x']), e1 = R.int(2, 7), e2 = R.int(2, 6), maal = R.int(0, 1);
  if (!maal && e1 <= e2) return null;
  const e = maal ? e1 + e2 : e1 - e2;
  const sup = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
  return {q:`Schrijf als één macht: ${gr}${sup(e1)} ${maal ? '·' : ':'} ${gr}${sup(e2)}`, velden:[{w:gr + '^' + e, vorm:'macht'}],
    u:`Hetzelfde grondtal ${gr}: bij ${maal ? 'vermenigvuldigen tel je de exponenten op' : 'delen trek je de exponenten af'}.\n${gr}<sup>${e1} ${maal ? '+' : '−'} ${e2}</sup> = ${gr}<sup>${e}</sup>.`};
});

g('t_ggd','get',2,0, R => {
  const k = R.kies([2, 3, 4, 5, 6, 7, 8, 9, 12]), p = R.int(2, 9), q = R.int(2, 9);
  if (ggd(p, q) !== 1 || p === q) return null;
  const a = k * p, b = k * q;
  return {q:`Wat is de grootste gemeenschappelijke deler van ${a} en ${b}?`, velden:[{w:k}],
    u:`Zoek het grootste getal waardoor ${a} en ${b} allebei deelbaar zijn.\n${a} = ${k} · ${p} en ${b} = ${k} · ${q}. ${p} en ${q} hebben geen gemeenschappelijke deler meer.\nggd(${a}, ${b}) = ${k}.`};
});

g('t_kgv','get',3,0, R => {
  const a = R.kies([4, 6, 8, 9, 10, 12, 14, 15, 18]), b = R.kies([4, 6, 8, 9, 10, 12, 15, 16, 20]);
  if (a === b || a % b === 0 || b % a === 0) return null;
  const k = a * b / ggd(a, b);
  const vv = n => Array.from({length:Math.min(6, k / n + 1)}, (x, i) => n * (i + 1)).join(', ');
  return {q:`Wat is het kleinste gemeenschappelijke veelvoud van ${a} en ${b}?`, velden:[{w:k}],
    u:`Veelvouden van ${a}: ${vv(a)}, …\nVeelvouden van ${b}: ${vv(b)}, …\nHet kleinste getal dat in beide rijen staat, is ${k}.`};
});

g('t_omzet','get',1,2, R => {
  const reeks = R.kies([[['km', 1000], ['m', 1], ['dm', 0.1], ['cm', 0.01], ['mm', 0.001]], [['kg', 1000], ['g', 1]], [['l', 1000], ['dl', 100], ['cl', 10], ['ml', 1]]]);
  const i = R.int(0, reeks.length - 1); let j; do { j = R.int(0, reeks.length - 1); } while (j === i);
  const v = R.kies([2.5, 0.75, 1.2, 3.05, 4, 15, 0.3, 250, 12.5, 7]), uit = v * reeks[i][1] / reeks[j][1];
  if (Math.abs(uit - Math.round(uit * 1000) / 1000) > 1e-9 || uit > 1e6 || uit < 0.001) return null;
  const fac = reeks[i][1] / reeks[j][1];
  return {q:`Zet om: ${f(v, 3)} ${reeks[i][0]} = … ${reeks[j][0]}`, velden:[{w:uit, na:reeks[j][0]}],
    u:`1 ${reeks[i][0]} = ${f(fac, 4)} ${reeks[j][0]}.\n${f(v, 3)} ${fac >= 1 ? '×' : ':'} ${f(fac >= 1 ? fac : 1 / fac, 4)} = ${f(uit, 4)} ${reeks[j][0]}.`};
});

g('t_omzetopp','get',3,4, R => {
  const p = R.kies([['m²', 'dm²', 100], ['dm²', 'cm²', 100], ['cm²', 'dm²', 0.01], ['m³', 'dm³', 1000], ['dm³', 'cm³', 1000], ['cm³', 'liter', 0.001]]);
  const v = R.kies([2.5, 0.4, 3.2, 12, 1.75, 450, 0.08, 6]), uit = v * p[2];
  if (Math.abs(uit - Math.round(uit * 10000) / 10000) > 1e-9) return null;
  return {q:`Zet om: ${f(v, 3)} ${p[0]} = … ${p[1]}`, velden:[{w:uit, na:p[1]}],
    u:`Bij oppervlakte gaat elke stap in de tabel × 100, bij volume × 1 000.\n1 ${p[0]} = ${f(p[2], 4)} ${p[1]}.\n${f(v, 3)} × ${f(p[2], 4)} = ${f(uit, 4)} ${p[1]}.`};
});

g('t_komma','get',2,3, R => {
  const a = R.stap(0.2, 9.8, 0.1), b = R.kies([2, 3, 4, 5, 0.5, 0.2, 10]);
  const r = Math.round(a * b * 1000) / 1000;
  return {q:`Reken uit: ${f(a, 1)} × ${f(b)}`, velden:[{w:r}],
    u:b < 1 ? `Vermenigvuldigen met ${f(b)} is hetzelfde als delen door ${f(1 / b)}: ${f(a, 1)} : ${f(1 / b)} = ${f(r, 3)}.` : `${f(a, 1)} × ${f(b)} = ${f(r, 3)}. Tel eerst zonder komma: ${Math.round(a * 10)} × ${f(b)} = ${f(Math.round(a * 10) * b)}, en zet dan de komma één plaats terug.`};
});

g('t_btw','get',3,4, R => {
  const P = R.stap(20, 400, 5), b = R.kies([21, 6]);
  return {q:`Een ${b === 21 ? 'koptelefoon' : 'boek'} kost ${eur(P)} zonder btw. De btw is ${b} %.\nHoeveel kost het met btw?`, velden:[{voor:'€', w:Math.round(P * (100 + b)) / 100}], calc:'e',
    u:`Stap 1: ${b} % van ${eur(P)} = ${f(b / 100)} × ${f(P)} = ${eur(P * b / 100)}.\nStap 2: ${eur(P)} + ${eur(P * b / 100)} = ${eur(P * (100 + b) / 100)}.\nOf in één keer: ${f(P)} × ${f(1 + b / 100)} = ${eur(P * (100 + b) / 100)}.`};
});

g('t_machtwaarde','get',3,0, R => {
  const a = R.int(1, 5), n = R.int(2, 3), b = R.int(-10, 10);
  const r = Math.pow(-a, n) + b;
  return {q:`Reken uit: (−${a})${n === 2 ? '²' : '³'} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, velden:[{w:r}],
    u:`(−${a})${n === 2 ? '²' : '³'} = ${Array(n).fill('(−' + a + ')').join(' · ')} = ${f(Math.pow(-a, n))}. ${n === 2 ? 'Een even aantal mintekens geeft plus.' : 'Een oneven aantal mintekens geeft min.'}\n${f(Math.pow(-a, n))} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${f(r)}.`};
});

g('t_wortel','get',2,0, R => {
  const k = R.int(2, 15), m = R.int(1, 6);
  return {q:`Reken uit: √${k * k} − ${m}²`, velden:[{w:k - m * m}],
    u:`√${k * k} = ${k}, want ${k} · ${k} = ${k * k}.\n${m}² = ${m * m}.\n${k} − ${m * m} = ${f(k - m * m)}.`};
});

/* ---------- algebra ---------- */
g('t_getalw','alg',1,0, R => {
  const a = R.int(2, 9), b = R.int(-9, 9), x = R.int(-5, 6);
  if (!b) return null;
  const r = a * x + b;
  return {q:`Bereken de getalwaarde van ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} voor x = ${f(x)}.`, velden:[{w:r}],
    u:`Vervang x door ${f(x)}: ${a} · ${haak(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${f(a * x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${f(r)}.\n${a}x betekent ${a} maal x.`};
});

g('t_verg1','alg',2,0, R => {
  const a = R.int(2, 9), x = R.int(-8, 10), b = R.int(-15, 15);
  if (!b || !x) return null;
  const c = a * x + b;
  return {q:`Los op: ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${f(c)}`, velden:[{voor:'x =', w:x}],
    u:`${b < 0 ? 'Tel bij beide leden ' + Math.abs(b) + ' op' : 'Trek van beide leden ' + b + ' af'}: ${a}x = ${f(c)} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${f(c - b)}.\nDeel beide leden door ${a}: x = ${f(c - b)} : ${a} = ${f(x)}.\nControle: ${a} · ${haak(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${f(c)}.`};
});

g('t_verg2','alg',3,0, R => {
  const x = R.int(-8, 8), a = R.int(2, 9), c = R.int(1, 9), b = R.int(-12, 12);
  if (a === c || !x) return null;
  const d = a * x + b - c * x;
  const t = (k, v) => k + 'x ' + (v < 0 ? '− ' + Math.abs(v) : '+ ' + v);
  return {q:`Los op: ${t(a, b)} = ${t(c, d)}`, velden:[{voor:'x =', w:x}],
    u:`Breng de termen met x naar het linkerlid en de getallen naar het rechterlid.\n${a}x − ${c}x = ${f(d)} − ${haak(b)}\n${a - c}x = ${f(d - b)}\nx = ${f(d - b)} : ${haak(a - c)} = ${f(x)}.\nControle: ${f(a * x + b)} = ${f(c * x + d)}.`};
});

g('t_verg3','alg',4,0, R => {
  const x = R.int(-6, 8), a = R.int(2, 5), b = R.int(-6, 6), c = R.int(1, 9);
  if (!b || a === c) return null;
  const d = a * (x + b) - c * x;
  return {q:`Los op: ${a}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)}) = ${c}x ${d < 0 ? '−' : '+'} ${Math.abs(d)}`, velden:[{voor:'x =', w:x}],
    u:`Werk de haakjes uit: ${a}x ${a * b < 0 ? '−' : '+'} ${Math.abs(a * b)} = ${c}x ${d < 0 ? '−' : '+'} ${Math.abs(d)}.\n${a}x − ${c}x = ${f(d)} − ${haak(a * b)}\n${a - c}x = ${f(d - a * b)}\nx = ${f(x)}.\nControle: ${a} · ${haak(x + b)} = ${f(a * (x + b))} en ${c} · ${haak(x)} ${d < 0 ? '−' : '+'} ${Math.abs(d)} = ${f(c * x + d)}.`};
});

g('t_vergbreuk','alg',4,0, R => {
  const a = R.int(2, 6), k = R.int(-5, 8), b = R.int(1, 9), x = a * k;
  return {q:`Los op: {{x|${a}}} + ${b} = ${f(k + b)}`, velden:[{voor:'x =', w:x}],
    u:`Trek van beide leden ${b} af: {{x|${a}}} = ${f(k)}.\nVermenigvuldig beide leden met ${a}: x = ${f(x)}.`};
});

g('t_rij','alg',3,0, R => {
  const a = R.int(2, 7), b = R.int(-5, 9), k = R.int(8, 25);
  const term = n => a * n + b, rij = [1, 2, 3, 4].map(term).map(f).join(', ');
  return {q:`Een rij begint zo: ${rij}, …\nHet n-de getal is ${a}n ${b < 0 ? '−' : '+'} ${Math.abs(b)}.\nWat is het ${k}ste getal van de rij?`, velden:[{w:term(k)}],
    u:`Vul n = ${k} in: ${a} · ${k} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * k} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${f(term(k))}.`};
});

g('t_evenr','alg',3,0, R => {
  const c = R.int(2, 12), b = R.int(1, 30), a = R.kies([2, 3, 4, 5, 6, 8]);
  if ((a * b) % c) return null;
  return {q:`Bepaal x in de evenredigheid: {{x|${a}}} = {{${b}|${c}}}`, velden:[{voor:'x =', w:a * b / c}],
    u:`Hoofdeigenschap: het product van de uitersten is gelijk aan het product van de middelsten.\nx · ${c} = ${a} · ${b} = ${a * b}.\nx = ${a * b} : ${c} = ${f(a * b / c)}.`};
});

g('t_omgekeerd','alg',4,0, R => {
  const m1 = R.int(2, 8), t1 = R.int(3, 12), m2 = R.int(2, 10), tot = m1 * t1;
  if (m1 === m2 || tot % m2) return null;
  const wat = R.kies([['schilders', 'een huis te schilderen', 'dagen'], ['machines', 'een bestelling te maken', 'uur'], ['pompen', 'een vijver leeg te pompen', 'uur']]);
  return {q:`${m1} ${wat[0]} hebben ${t1} ${wat[2]} nodig om ${wat[1]}. Ze werken allemaal even snel.\nHoeveel ${wat[2]} hebben ${m2} ${wat[0]} nodig?`, velden:[{w:tot / m2, na:wat[2]}],
    u:`Meer ${wat[0]} betekent minder tijd: de grootheden zijn omgekeerd evenredig.\nHet totale werk: ${m1} × ${t1} = ${tot}.\nMet ${m2} ${wat[0]}: ${tot} : ${m2} = ${f(tot / m2)} ${wat[2]}.`};
});

g('t_formule','alg',3,0, R => {
  const l = R.int(3, 20), b = R.int(2, 18);
  return {q:`De omtrek van een rechthoek bereken je met P = 2(l + b).\nHoe groot is b als P = ${2 * (l + b)} en l = ${l}?`, velden:[{voor:'b =', w:b}],
    u:`Vul in: ${2 * (l + b)} = 2(${l} + b).\nDeel beide leden door 2: ${l + b} = ${l} + b.\nb = ${l + b} − ${l} = ${b}.`};
});

g('t_leeftijd','alg',5,0, R => {
  const k = R.int(3, 5), j = R.int(2, k - 1), d = R.int(4, 15);
  const n = (k - j) * d / (j - 1);
  if (n % 1 || n < 2 || n > 30) return null;
  const naam = R.naam();
  return {q:`Een moeder is nu ${k} keer zo oud als haar kind ${naam}. Over ${n} jaar is ze ${j === 2 ? 'twee' : 'drie'} keer zo oud als ${naam}.\nHoe oud is ${naam} nu?`, velden:[{w:d, na:'jaar'}],
    u:`Noem de leeftijd van ${naam} x. De moeder is nu ${k}x.\nOver ${n} jaar: ${k}x + ${n} = ${j}(x + ${n}).\n${k}x + ${n} = ${j}x + ${j * n}, dus ${k - j}x = ${j * n - n} en x = ${d}.\nControle: nu ${d} en ${k * d} jaar; over ${n} jaar ${d + n} en ${k * d + n}, en ${k * d + n} = ${j} × ${d + n}.`};
});

/* ---------- meetkunde ---------- */
g('t_rechthoek','mee',1,2, R => {
  const l = R.int(3, 15), b = R.int(2, l - 1), opp = R.int(0, 1);
  return {q:`Een rechthoek is ${l} cm lang en ${b} cm breed.\nWat is ${opp ? 'de oppervlakte' : 'de omtrek'} van de rechthoek?`,
    velden:[{w:opp ? l * b : 2 * (l + b), na:opp ? 'cm²' : 'cm'}],
    u:opp ? `Oppervlakte = lengte × breedte = ${l} × ${b} = ${l * b} cm².\n(De omtrek, ${2 * (l + b)} cm, is de lengte rondom.)` : `Omtrek = de lengte rondom = 2 × (${l} + ${b}) = ${2 * (l + b)} cm.\n(De oppervlakte, ${l * b} cm², is iets anders.)`};
});

g('t_driehoekopp','mee',2,3, R => {
  const b = R.int(3, 16), h = R.int(2, 14);
  return {q:`Een driehoek heeft een basis van ${b} cm en een bijhorende hoogte van ${h} cm.\nWat is de oppervlakte van de driehoek?`, velden:[{w:b * h / 2, na:'cm²'}],
    u:`Oppervlakte driehoek = {{basis × hoogte|2}} = {{${b} × ${h}|2}} = {{${b * h}|2}} = ${f(b * h / 2)} cm².\nVergeet niet te delen door 2.`};
});

g('t_hoekdrie','mee',2,3, R => {
  const a = R.int(25, 95), b = R.int(20, 155 - a);
  return {q:`Twee hoeken van een driehoek meten ${a}° en ${b}°.\nHoe groot is de derde hoek?`, velden:[{w:180 - a - b, na:'°'}],
    u:`De som van de hoeken van een driehoek is 180°.\n${a}° + ${b}° = ${a + b}°.\n180° − ${a + b}° = ${180 - a - b}°.`};
});

g('t_balk','mee',2,3, R => {
  const l = R.int(3, 25), b = R.int(2, 15), h = R.int(2, 12), liter = R.int(0, 1) && l * b * h >= 1000;
  return {q:liter ? `Een aquarium in de vorm van een balk is ${l * 10} cm lang, ${b * 10} cm breed en ${h * 10} cm hoog.\nHoeveel liter water kan er hoogstens in?` : `Een balk is ${l} cm lang, ${b} cm breed en ${h} cm hoog.\nWat is het volume van de balk?`,
    velden:[liter ? {w:l * b * h, na:'liter'} : {w:l * b * h, na:'cm³'}], calc:liter ? 'e' : null,
    u:liter ? `Volume = ${l * 10} × ${b * 10} × ${h * 10} = ${f(l * b * h * 1000)} cm³.\n1 liter = 1 000 cm³, dus ${f(l * b * h * 1000)} cm³ = ${f(l * b * h)} liter.` : `Volume balk = lengte × breedte × hoogte = ${l} × ${b} × ${h} = ${l * b * h} cm³.`};
});

g('t_cirkel','mee',3,4, R => {
  const r = R.int(2, 15), diam = R.int(0, 1), opp = R.int(0, 1);
  const w = opp ? 3.14 * r * r : 2 * 3.14 * r;
  return {q:`Een cirkel heeft ${diam ? 'een diameter van ' + 2 * r : 'een straal van ' + r} cm. Gebruik π ≈ 3,14.\nWat is ${opp ? 'de oppervlakte' : 'de omtrek'} van de cirkel? Rond af op 0,1.`,
    velden:[{w:Math.round(w * 10) / 10, na:opp ? 'cm²' : 'cm'}], calc:'w',
    u:(diam ? `De straal is de helft van de diameter: ${2 * r} : 2 = ${r} cm.\n` : '') + (opp ? `Oppervlakte = π × straal × straal = 3,14 × ${r} × ${r} = ${f(w, 2)} cm², afgerond ${f(Math.round(w * 10) / 10, 1)} cm².` : `Omtrek = 2 × π × straal = 2 × 3,14 × ${r} = ${f(w, 2)} cm, afgerond ${f(Math.round(w * 10) / 10, 1)} cm.`)};
});

g('t_trapezium','mee',4,0, R => {
  const B = R.int(6, 20), b = R.int(2, B - 1), h = R.int(2, 12);
  return {q:`Een trapezium heeft evenwijdige zijden van ${B} cm en ${b} cm. De hoogte is ${h} cm.\nWat is de oppervlakte van het trapezium?`, velden:[{w:(B + b) * h / 2, na:'cm²'}],
    u:`Oppervlakte trapezium = {{(grote basis + kleine basis) × hoogte|2}}.\n{{(${B} + ${b}) × ${h}|2}} = {{${(B + b) * h}|2}} = ${f((B + b) * h / 2)} cm².`};
});

g('t_gelijkbenig','mee',3,5, R => {
  const t = R.stap(20, 140, 2);
  return {q:`In een gelijkbenige driehoek meet de tophoek ${t}°.\nHoe groot is één basishoek?`, velden:[{w:(180 - t) / 2, na:'°'}],
    u:`De hoekensom is 180°. Voor de twee basishoeken blijft 180° − ${t}° = ${180 - t}° over.\nDe basishoeken zijn even groot: ${180 - t}° : 2 = ${(180 - t) / 2}°.`};
});

g('t_buitenhoek','mee',4,0, R => {
  const a = R.int(25, 80), b = R.int(25, 150 - a);
  return {q:`In driehoek ABC meet hoek A ${a}° en hoek B ${b}°.\nHoe groot is de buitenhoek bij hoekpunt C?`, velden:[{w:a + b, na:'°'}],
    u:`Hoek C = 180° − ${a}° − ${b}° = ${180 - a - b}°.\nDe buitenhoek is het supplement: 180° − ${180 - a - b}° = ${a + b}°.\nSneller: een buitenhoek = de som van de twee niet-aanliggende binnenhoeken: ${a}° + ${b}° = ${a + b}°.`};
});

g('t_gradenboog','mee',2,3, R => {
  const a1 = R.int(0, 1) ? 0 : R.stap(10, 60, 5), hoek = R.stap(25, 150, 5), a2 = a1 + hoek;
  if (a2 > 175) return null;
  return {q:`Hoe groot is de rode hoek? Lees af op de gradenboog.`, velden:[{w:hoek, na:'°'}],
    fig:{t:'boog', a1, a2, alt:'Gradenboog met een rode hoek tussen twee rode benen.'},
    u:a1 === 0 ? `Eén been ligt op de 0-lijn. Gebruik de schaal die bij dat been met 0 begint (de buitenste schaal).\nHet andere been wijst naar ${hoek}°.` : `Het ene been wijst naar ${a1}°, het andere naar ${a2}° op dezelfde schaal.\nDe hoek is het verschil: ${a2}° − ${a1}° = ${hoek}°.\nLet op: lees beide benen op dezelfde schaal af.`,
    tip:`Op welke schaal begint één van de benen bij 0? Of: lees beide benen af en neem het verschil.`};
});

g('t_klikcoord','mee',1,0, R => {
  const x = R.int(-5, 5), y = R.int(-4, 4);
  if (!x || !y) return null;
  return {q:`Klik op het punt met coördinaten (${f(x)}, ${f(y)}).`, rooster:{xmin:-5, xmax:5, ymin:-4, ymax:4, assen:'xy', getallen:'alle', punten:[]}, w:{x, y},
    u:`De eerste coördinaat is x: vanuit de oorsprong ${Math.abs(x)} ${Math.abs(x) === 1 ? 'eenheid' : 'eenheden'} naar ${x < 0 ? 'links' : 'rechts'}.\nDe tweede coördinaat is y: daarna ${Math.abs(y)} naar ${y < 0 ? 'beneden' : 'boven'}.`};
});

g('t_klikcoordB','mee',0,3, R => {
  const x = R.int(1, 6), y = R.int(1, 5);
  if (x === y) return null;
  return {q:`Klik op het punt met coördinaten (${x}, ${y}).`, rooster:{xmin:0, xmax:6, ymin:0, ymax:5, assen:'xy', getallen:'alle', punten:[]}, w:{x, y},
    u:`Eerst x: ${x} naar rechts. Dan y: ${y} naar boven.\nLet op: (${y}, ${x}) is een ander punt.`};
});

g('t_klikspieg','mee',3,0, R => {
  const cx = R.int(2, 6), cy = R.int(2, 4), px = R.int(0, 8), py = R.int(0, 6), bx = 2 * cx - px, by = 2 * cy - py;
  if (bx < 0 || bx > 8 || by < 0 || by > 6 || (px === cx && py === cy)) return null;
  return {q:`Het rooster bestaat uit gelijke vierkanten. Het punt P wordt gespiegeld door de puntspiegeling met centrum C.\nKlik op het beeld van P.`,
    rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:px, y:py, l:'P'}, {x:cx, y:cy, l:'C'}]}, w:{x:bx, y:by},
    u:`Van P naar C ga je ${mv(Math.abs(cx - px), 'hokje', 'hokjes')} naar ${cx >= px ? 'rechts' : 'links'} en ${mv(Math.abs(cy - py), 'hokje', 'hokjes')} naar ${cy >= py ? 'boven' : 'beneden'}.\nDoe dat nog een keer vanuit C. Zo kom je bij het beeld: even ver van C, recht tegenover P.`};
});

g('t_klikcentrum','mee',4,0, R => {
  const ax = R.int(0, 8), ay = R.int(0, 6), bx = R.int(0, 8), by = R.int(0, 6);
  if ((ax - bx) % 2 || (ay - by) % 2 || (Math.abs(ax - bx) + Math.abs(ay - by) < 4)) return null;
  return {q:`Het rooster bestaat uit gelijke vierkanten. Bij een puntspiegeling met centrum M is het punt B het beeld van het punt A.\nKlik op de plaats van M.`,
    rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:ax, y:ay, l:'A'}, {x:bx, y:by, l:'B'}]}, w:{x:(ax + bx) / 2, y:(ay + by) / 2},
    u:`Het centrum ligt precies in het midden van [AB].\nVan A naar B: ${Math.abs(bx - ax)} hokjes ${bx >= ax ? 'naar rechts' : 'naar links'} en ${Math.abs(by - ay)} ${by >= ay ? 'naar boven' : 'naar beneden'}. De helft daarvan: ${Math.abs(bx - ax) / 2} en ${Math.abs(by - ay) / 2}.`};
});

g('t_klikversch','mee',2,3, R => {
  const px = R.int(0, 8), py = R.int(0, 6), dx = R.int(-4, 4), dy = R.int(-3, 3);
  if (!dx || !dy || px + dx < 0 || px + dx > 8 || py + dy < 0 || py + dy > 6) return null;
  return {q:`Het rooster bestaat uit gelijke vierkanten. Het punt R wordt verschoven: ${Math.abs(dx)} hokjes naar ${dx > 0 ? 'rechts' : 'links'} en ${Math.abs(dy)} hokjes naar ${dy > 0 ? 'boven' : 'beneden'}.\nKlik op het beeld van R.`,
    rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:px, y:py, l:'R'}]}, w:{x:px + dx, y:py + dy},
    u:`Vertrek bij R. Tel ${Math.abs(dx)} hokjes naar ${dx > 0 ? 'rechts' : 'links'} en daarna ${Math.abs(dy)} hokjes naar ${dy > 0 ? 'boven' : 'beneden'}.`};
});

g('t_klikspiegrecht','mee',2,3, R => {
  const c = R.int(2, 6), px = R.int(0, 8), py = R.int(0, 6), bx = 2 * c - px;
  if (px === c || bx < 0 || bx > 8) return null;
  return {q:`Het rooster bestaat uit gelijke vierkanten. Het punt S wordt gespiegeld om de rechte m.\nKlik op het beeld van S.`,
    rooster:{xmin:0, xmax:8, ymin:0, ymax:6, assen:'', punten:[{x:px, y:py, l:'S'}], lijnen:[{x1:c, y1:0, x2:c, y2:6, l:'m'}]}, w:{x:bx, y:py},
    u:`S ligt ${mv(Math.abs(c - px), 'hokje', 'hokjes')} ${px < c ? 'links' : 'rechts'} van m. Het spiegelbeeld ligt op dezelfde hoogte, ${mv(Math.abs(c - px), 'hokje', 'hokjes')} ${px < c ? 'rechts' : 'links'} van m.`};
});

/* ---------- statistiek ---------- */
g('t_gemiddelde','sta',2,3, R => {
  let v; do { v = Array.from({length:5}, () => R.int(3, 20)); } while (v.reduce((a, b) => a + b, 0) % 5);
  const s = v.reduce((a, b) => a + b, 0);
  return {q:`Vijf leerlingen halen deze scores op 20: ${v.join(', ')}.\nWat is de gemiddelde score?`, velden:[{w:s / 5}],
    u:`Tel alle scores op: ${v.join(' + ')} = ${s}.\nDeel door het aantal scores: ${s} : 5 = ${s / 5}.`};
});

g('t_mediaan','sta',3,0, R => {
  const n = R.kies([5, 6, 7]), v = Array.from({length:n}, () => R.int(1, 30)), s = v.slice().sort((a, b) => a - b);
  const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  return {q:`Gegeven de getallen: ${v.join(', ')}.\nWat is de mediaan?`, velden:[{w:med}],
    u:`Rangschik eerst van klein naar groot: ${s.join(', ')}.\n` + (n % 2 ? `Bij ${n} getallen is de mediaan het middelste (het ${(n + 1) / 2}de) getal: ${med}.` : `Bij ${n} getallen is de mediaan het gemiddelde van de twee middelste: {{${s[n / 2 - 1]} + ${s[n / 2]}|2}} = ${f(med)}.`)};
}, {});

g('t_modus','sta',2,0, R => {
  const m = R.int(2, 15); let v; do { v = [m, m, m, R.int(1, 20), R.int(1, 20), R.int(1, 20), R.int(1, 20)]; } while (v.filter(x => x !== m).some((x, i, a) => a.filter(y => y === x).length >= 2));
  v = R.schud(v);
  return {q:`Gegeven de getallen: ${v.join(', ')}.\nWat is de modus?`, velden:[{w:m}],
    u:`De modus is de waarde die het vaakst voorkomt. ${m} komt 3 keer voor, de andere getallen minder vaak.\nDe modus is ${m}.`};
});

g('t_variatie','sta',2,3, R => {
  const v = Array.from({length:6}, () => R.int(-5, 25));
  const mx = Math.max(...v), mn = Math.min(...v);
  return {q:`Op zes dagen werden deze temperaturen gemeten (in °C): ${v.map(f).join(' ; ')}.\nWat is de variatiebreedte?`, velden:[{w:mx - mn, na:'°C'}],
    u:`Variatiebreedte = grootste waarde − kleinste waarde.\n${f(mx)} − ${haak(mn)} = ${f(mx - mn)} °C.`};
});

g('t_staaf','sta',1,2, R => {
  const nm = R.namen(5), y = nm.map(() => R.int(1, 9)), i = R.int(0, 4); let j; do { j = R.int(0, 4); } while (j === i);
  const soort = R.int(0, 1);
  if (!soort && y[i] <= y[j]) return null;
  return {q:`Het staafdiagram toont hoeveel boeken vijf leerlingen dit trimester lazen.\n${soort ? `Hoeveel boeken lazen ${nm[i]} en ${nm[j]} samen?` : `Hoeveel boeken las ${nm[i]} meer dan ${nm[j]}?`}`,
    velden:[{w:soort ? y[i] + y[j] : y[i] - y[j], na:'boeken'}],
    fig:{t:'staaf', titel:'Aantal gelezen boeken', x:nm, y, min:0, max:10, stap:1, ylab:'aantal boeken'},
    u:`Lees de hoogte van de staven af: ${nm[i]} ${y[i]} en ${nm[j]} ${y[j]}.\n${soort ? `${y[i]} + ${y[j]} = ${y[i] + y[j]}.` : `${y[i]} − ${y[j]} = ${f(y[i] - y[j])}.` + (y[i] < y[j] ? ` Het antwoord is negatief: ${nm[i]} las minder.` : '')}`};
});

g('t_staafgem','sta',2,3, R => {
  const nm = R.namen(5); let y; do { y = nm.map(() => R.int(1, 9)); } while (y.reduce((a, b) => a + b, 0) % 5);
  const s = y.reduce((a, b) => a + b, 0);
  return {q:`Het staafdiagram toont hoeveel boeken vijf leerlingen dit trimester lazen.\nHoeveel boeken lazen de vijf leerlingen gemiddeld?`, velden:[{w:s / 5, na:'boeken'}],
    fig:{t:'staaf', titel:'Aantal gelezen boeken', x:nm, y, min:0, max:10, stap:1, ylab:'aantal boeken'},
    u:`Lees alle waarden af: ${y.join(', ')}.\nSom: ${s}. Gemiddelde: ${s} : 5 = ${s / 5}.`};
});

g('t_relfreq','sta',3,4, R => {
  let n, k; do { n = R.kies([20, 25, 40, 50]); k = R.int(1, n - 1); } while ((k * 100) % n);
  const wat = R.kies(['een bril dragen', 'linkshandig zijn', 'een broer hebben', 'met de bus komen']);
  return {q:`In een groep van ${n} leerlingen zijn er ${k} die ${wat}.\nHoeveel procent van de groep is dat?`, velden:[{w:k * 100 / n, na:'%'}],
    u:`{{${k}|${n}}} = {{${k * 100 / n}|100}} (teller en noemer maal ${100 / n}). Dat is ${k * 100 / n} %.`};
});

g('t_gemcomb','sta',5,0, R => {
  const n1 = R.kies([10, 15, 20, 25]), n2 = R.kies([10, 15, 20, 30]), m1 = R.int(10, 16), m2 = R.int(10, 16);
  if (m1 === m2 || ((n1 * m1 + n2 * m2) * 10) % (n1 + n2)) return null;
  const tot = (n1 * m1 + n2 * m2) / (n1 + n2);
  return {q:`In klas A (${n1} leerlingen) is de gemiddelde score ${m1}. In klas B (${n2} leerlingen) is de gemiddelde score ${m2}.\nWat is de gemiddelde score van alle leerlingen samen?`, velden:[{w:tot}], calc:'e',
    u:`Je mag de twee gemiddelden niet zomaar middelen als de klassen niet even groot zijn.\nPunten klas A: ${n1} × ${m1} = ${n1 * m1}. Punten klas B: ${n2} × ${m2} = ${n2 * m2}.\nSamen: ${n1 * m1 + n2 * m2} punten voor ${n1 + n2} leerlingen: ${n1 * m1 + n2 * m2} : ${n1 + n2} = ${f(tot)}.`};
});

/* ---------- verzamelingen ---------- */
g('t_venn','ver',2,0, R => {
  const U = R.schud([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 7).sort((a, b) => a - b);
  const A = U.filter(() => R.int(0, 1)), B = U.filter(() => R.int(0, 1));
  const zone = x => A.includes(x) ? (B.includes(x) ? 1 : 0) : (B.includes(x) ? 2 : 3);
  const w = U.map(zone);
  if (new Set(w).size < 4 || !A.length || !B.length) return null;
  return {q:`Gegeven: A = {${A.join(', ')}} en B = {${B.join(', ')}}.\nSleep elk getal naar het juiste gebied.`,
    kaartjes:U.map(String), vakken:['alleen in A', 'in A en in B', 'alleen in B', 'niet in A en niet in B'], w,
    u:`Alleen in A: ${U.filter(x => zone(x) === 0).join(', ')}.\nIn A en in B (de doorsnede): ${U.filter(x => zone(x) === 1).join(', ')}.\nAlleen in B: ${U.filter(x => zone(x) === 2).join(', ')}.\nIn geen van beide: ${U.filter(x => zone(x) === 3).join(', ')}.`};
});

g('t_aantal','ver',4,0, R => {
  const a = R.int(5, 15), b = R.int(4, 12), c = R.int(2, Math.min(a, b) - 1);
  return {q:`Verzameling A heeft ${a} elementen en verzameling B heeft ${b} elementen. De doorsnede A ∩ B heeft ${c} elementen.\nHoeveel elementen heeft A ∪ B?`, velden:[{w:a + b - c, na:'elementen'}],
    u:`Als je ${a} + ${b} rekent, tel je de ${c} elementen van de doorsnede twee keer.\nTrek ze één keer af: ${a} + ${b} − ${c} = ${a + b - c}.`};
});

g('t_geen','ver',4,0, R => {
  const T = R.int(25, 40), a = R.int(8, 20), b = R.int(6, 16), c = R.int(2, Math.min(a, b) - 1);
  if (a + b - c > T) return null;
  const wat = R.kies([['een hond', 'een kat', 'hebben'], ['voetbal', 'basketbal', 'spelen'], ['Frans', 'Engels', 'spreken']]);
  return {q:`In een groep van ${T} jongeren ${wat[2]} er ${a} ${wat[0]} en ${b} ${wat[1]}. ${c} jongeren ${wat[2]} ${wat[0]} en ook ${wat[1]}.\nHoeveel jongeren ${wat[2]} geen van beide?`,
    velden:[{w:T - (a + b - c), na:'jongeren'}],
    u:`Stap 1: minstens één van de twee: ${a} + ${b} − ${c} = ${a + b - c} (de ${c} die beide hebben, tel je maar één keer).\nStap 2: geen van beide: ${T} − ${a + b - c} = ${T - (a + b - c)}.\nTeken een venndiagram: ${a - c} alleen het eerste, ${c} beide, ${b - c} alleen het tweede, ${T - (a + b - c)} erbuiten.`};
});

g('t_kgvveelv','ver',4,0, R => {
  const a = R.kies([4, 6, 8, 9, 10, 12, 15]), b = R.kies([6, 8, 9, 10, 12, 14, 15, 20]);
  if (a === b || a % b === 0 || b % a === 0) return null;
  const k = a * b / ggd(a, b);
  return {q:`A is de verzameling van de veelvouden van ${a}. B is de verzameling van de veelvouden van ${b}.\nWat is het kleinste element van A ∩ B dat groter is dan 0?`, velden:[{w:k}],
    u:`In A ∩ B zitten de getallen die een veelvoud zijn van ${a} én van ${b}: de gemeenschappelijke veelvouden.\nHet kleinste daarvan (groter dan 0) is het kgv van ${a} en ${b}: ${k}.`};
});

g('t_oneindig','ver',5,0, R => {
  const soort = R.int(0, 2), priem = [2, 3, 5, 7, 11, 13];
  if (soort === 0) { const p = R.kies(priem);
    return {q:`P is de verzameling van de priemgetallen. V is de verzameling van de veelvouden van ${p}.\nHoeveel elementen bevat P ∩ V?`, o:['1 element', 'geen elementen', '2 elementen', 'oneindig veel elementen'],
      u:`De veelvouden van ${p} zijn 0, ${p}, ${2 * p}, ${3 * p}, …\n${p} is zelf een priemgetal. Alle andere veelvouden (behalve 0) zijn deelbaar door ${p} en door een ander getal, dus geen priemgetal. 0 is geen priemgetal.\nP ∩ V = {${p}}: 1 element.`}; }
  if (soort === 1) { const m = R.kies([15, 21, 33, 35, 39, 49, 77]);
    return {q:`P is de verzameling van de priemgetallen. V is de verzameling van de veelvouden van ${m}.\nHoeveel elementen bevat P ∩ V?`, o:['geen elementen', '1 element', '2 elementen', 'oneindig veel elementen'],
      u:`${m} is geen priemgetal. Elk veelvoud van ${m} (behalve 0) is deelbaar door de delers van ${m} en is dus geen priemgetal. 0 is ook geen priemgetal.\nP ∩ V is leeg: geen elementen.`}; }
  const a = R.kies([4, 6, 9, 10, 12]), b = R.kies([6, 8, 15, 14, 18]);
  if (a === b) return null;
  return {q:`N is de verzameling van de veelvouden van ${a}. V is de verzameling van de veelvouden van ${b}.\nHoeveel elementen bevat N ∩ V?`, o:['oneindig veel elementen', 'geen elementen', '1 element', '2 elementen'],
    u:`N ∩ V bevat alle gemeenschappelijke veelvouden van ${a} en ${b}: de veelvouden van ${a * b / ggd(a, b)}: 0, ${a * b / ggd(a, b)}, ${2 * a * b / ggd(a, b)}, …\nDie rij stopt nooit: oneindig veel elementen.`};
});

// Extra sjablonen om elk domein op elk niveau genoeg afwisseling te geven.

/* ---------- problemen oplossen, niveau A ---------- */
g('t_p5_kweker','pro',5,0, R => {
  const f1 = R.kies([[1, 2], [1, 3], [1, 4]]), f2 = R.kies([[1, 3], [1, 4], [2, 5], [1, 2]]), rest = R.stap(20, 90, 10);
  const na1 = (f1[1] - f1[0]) / f1[1], na2 = (f2[1] - f2[0]) / f2[1], x = rest / (na1 * na2);
  if (x % 1) return null;
  const n = R.naam(), br = fr => fr[0] === 1 && fr[1] === 2 ? 'de helft' : '{{' + fr[0] + '|' + fr[1] + '}}';
  return {q:`${n} verkoopt appels op de markt. Op zaterdag verkoopt ${n} ${br(f1)} van de voorraad. Op zondag verkoopt ${n} ${br(f2)} van wat er dan nog over is. Daarna is er nog ${rest} kg over.\nHoeveel kilogram appels had ${n} zaterdagochtend?`,
    velden:[{w:x, na:'kg'}], u:`Werk terug vanaf het einde.\nNa zondag blijft {{${f2[1] - f2[0]}|${f2[1]}}} over van wat er zondagochtend was. Dat is ${rest} kg, dus zondagochtend was er ${rest} : ${f2[1] - f2[0]} × ${f2[1]} = ${f(rest / na2)} kg.\nNa zaterdag bleef {{${f1[1] - f1[0]}|${f1[1]}}} over. ${f(rest / na2)} kg is dus {{${f1[1] - f1[0]}|${f1[1]}}} van de voorraad: ${f(rest / na2)} : ${f1[1] - f1[0]} × ${f1[1]} = ${f(x)} kg.`,
    tip:`Begin bij de ${rest} kg op het einde en werk terug.`};
});

g('t_p5_winst','pro',5,0, R => {
  const ink = R.stap(100, 600, 20), w = R.kies([10, 20, 25, 50]), k = R.kies([10, 20, 25]);
  const ontv = ink * (100 + w) / 100, kaart = ontv / ((100 - k) / 100);
  if (Math.round(kaart * 100) % 100) return null;
  const ding = R.kies(['fiets', 'tablet', 'gitaar', 'kast']);
  return {q:`Een winkel koopt een ${ding} in voor ${eur(ink)}. De winkel wil ${w} % winst maken op de inkoopprijs, ook als de klant ${k} % korting krijgt op de prijs op het prijskaartje.\nWelke prijs moet er op het prijskaartje staan?`,
    velden:[{voor:'€', w:kaart}], calc:'w',
    u:`Stap 1: de winkel wil ontvangen: ${eur(ink)} + ${w} % = ${eur(ontv)}.\nStap 2: na ${k} % korting betaalt de klant ${100 - k} % van het prijskaartje. Die ${100 - k} % moet ${eur(ontv)} zijn.\nStap 3: ${f(ontv)} : ${f((100 - k) / 100)} = ${eur(kaart)}.\nControle: ${k} % korting op ${eur(kaart)} geeft ${eur(kaart * (100 - k) / 100)}.`,
    tip:`Hoeveel wil de winkel ontvangen? Welk percentage van het prijskaartje is dat?`};
});

g('t_p5_kaars','pro',5,0, R => {
  const t = R.int(2, 8), a = R.kies([2, 2.5, 3, 4]), b = R.kies([0.5, 1, 1.5]);
  if (a <= b) return null;
  const L2 = R.int(8, 20), L1 = L2 + (a - b) * t;
  if (L2 - b * t <= 0) return null;
  return {q:`Een kaars van ${f(L1)} cm wordt elk uur ${f(a)} cm korter. Een tweede kaars van ${f(L2)} cm wordt elk uur ${f(b)} cm korter. Ze worden tegelijk aangestoken.\nNa hoeveel uur zijn de twee kaarsen even lang?`,
    velden:[{voor:'na', w:t, na:'uur'}],
    u:`De eerste kaars is ${f(L1 - L2)} cm langer. Elk uur wordt het verschil ${f(a)} − ${f(b)} = ${f(a - b)} cm kleiner.\nHet verschil is weg na ${f(L1 - L2)} : ${f(a - b)} = ${t} uur.\nControle: na ${t} uur is de eerste kaars ${f(L1 - a * t)} cm en de tweede ${f(L2 - b * t)} cm.`,
    tip:`Hoeveel langer is de eerste kaars? Hoeveel kleiner wordt dat verschil per uur?`};
});

g('t_p5_rechthoekverh','pro',5,0, R => {
  const k = R.int(2, 5), b = R.int(2, 12), l = k * b, P = 2 * (l + b);
  return {q:`Een rechthoek heeft een omtrek van ${P} cm. De lengte is ${k} keer zo groot als de breedte.\nWat is de oppervlakte van de rechthoek?`,
    velden:[{w:l * b, na:'cm²'}],
    u:`Noem de breedte b. De lengte is ${k}b.\nOmtrek: 2 · (${k}b + b) = ${2 * (k + 1)}b = ${P}, dus b = ${b} cm en de lengte is ${l} cm.\nOppervlakte: ${l} × ${b} = ${l * b} cm².`,
    tip:`Noem de breedte b. Schrijf de lengte en de omtrek met b.`};
});

/* ---------- getallenleer ---------- */
g('t_gb1_geld','get',1,1, R => {
  const a = R.stap(1.2, 9.9, 0.1), b = R.stap(0.5, 6, 0.05);
  return {q:`Reken uit: ${eur(a)} + ${eur(b)}`, velden:[{voor:'€', w:Math.round((a + b) * 100) / 100}],
    u:`Tel eerst de euro's, dan de centen.\n${eur(a)} + ${eur(b)} = ${eur(a + b)}.`};
});

g('t_gb1_afronden','get',1,1, R => {
  const n = R.int(1012, 9989), op = R.kies([10, 100, 1000]);
  if (n % op === 0) return null;
  const r = Math.round(n / op) * op, naam = {10:'tiental', 100:'honderdtal', 1000:'duizendtal'}[op];
  return {q:`Rond ${f(n)} af op het ${naam}.`, velden:[{w:r}],
    u:`${f(n)} ligt tussen ${f(Math.floor(n / op) * op)} en ${f(Math.ceil(n / op) * op)}.\nKijk naar het cijfer rechts van het ${naam}: is het 5 of meer, dan rond je naar boven af.\nUitkomst: ${f(r)}.`};
});

g('t_gb1_tafel','get',0,1, R => {
  const a = R.int(3, 12), b = R.int(3, 12), soort = R.int(0, 1);
  return soort ? {q:`Reken uit: ${a * b} : ${a}`, velden:[{w:b}], u:`Welk getal maal ${a} geeft ${a * b}? ${a} × ${b} = ${a * b}, dus ${a * b} : ${a} = ${b}.`}
    : {q:`Reken uit: ${a} × ${b}`, velden:[{w:a * b}], u:`${a} × ${b} = ${a * b}.\nTip: ${a} × ${b} = ${a} × ${b - 1} + ${a} = ${a * (b - 1)} + ${a}.`};
});

g('t_g4_procentterug','get',4,5, R => {
  const oud = R.stap(20, 300, 10), p = R.kies([10, 20, 25, 50]), nieuw = oud * (100 + p) / 100;
  if (Math.round(nieuw * 100) % 1) return null;
  return {q:`Na een prijsstijging van ${p} % kost een abonnement ${eur(nieuw)}.\nHoeveel kostte het abonnement vóór de stijging?`, velden:[{voor:'€', w:oud}], calc:'e',
    u:`Na de stijging betaal je ${100 + p} % van de oude prijs. Die ${100 + p} % is ${eur(nieuw)}.\n1 % is ${f(nieuw)} : ${100 + p} = ${f(nieuw / (100 + p), 4)}. 100 % is ${eur(oud)}.\nLet op: ${p} % van ${eur(nieuw)} aftrekken geeft een verkeerde uitkomst.`};
});

g('t_g4_deelbaar','get',4,0, R => {
  const d = R.kies([3, 9]), x = R.int(1, 9), y = R.int(0, 9);
  const opl = [...Array(10).keys()].filter(a => (x + a + y) % d === 0);
  if (opl.length !== 1) return null;
  return {q:`In het getal ${x}a${y} stelt a een cijfer voor. Het getal is deelbaar door ${d}.\nWelk cijfer is a?`, velden:[{voor:'a =', w:opl[0]}],
    u:`Een getal is deelbaar door ${d} als de som van de cijfers deelbaar is door ${d}.\n${x} + a + ${y} = ${x + y} + a. Het enige cijfer dat een veelvoud van ${d} geeft, is a = ${opl[0]} (som ${x + y + opl[0]}).\nControle: ${x}${opl[0]}${y} : ${d} = ${(x * 100 + opl[0] * 10 + y) / d}.`};
});

g('t_g4_wetensch','get',4,0, R => {
  const m = R.stap(1.1, 9.9, 0.1), e = R.kies([-6, -5, -4, -3, 3, 4, 5, 6]);
  const getal = m * Math.pow(10, e);
  const txt = e < 0 ? '0,' + '0'.repeat(-e - 1) + f(m, 1).replace(',', '') : f(getal, 0);
  const sup = n => String(n).replace('-', '⁻').split('').map(c => c === '⁻' ? c : '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
  const opt = [`${f(m, 1)} · 10${sup(e)}`, `${f(m, 1)} · 10${sup(e < 0 ? e + 1 : e - 1)}`, `${f(m, 1)} · 10${sup(-e)}`, `${f(m * 10, 0)} · 10${sup(e - 1)}`];
  return {q:`Schrijf ${txt} in de wetenschappelijke schrijfwijze.`, o:opt,
    u:`In de wetenschappelijke schrijfwijze staat er precies één cijfer (niet 0) vóór de komma: ${f(m, 1)}.\nDe komma schuift ${Math.abs(e)} plaatsen naar ${e < 0 ? 'rechts, dus de exponent is negatief' : 'links, dus de exponent is positief'}: ${f(m, 1)} · 10${sup(e)}.`};
});

g('t_g5_procentketen','get',5,0, R => {
  const [a, b] = R.kies([[20, 25], [10, 10], [50, 50], [20, 20], [25, 20], [10, 20]]), eerstOmlaag = R.int(0, 1);
  const fac = eerstOmlaag ? (1 - a / 100) * (1 + b / 100) : (1 + a / 100) * (1 - b / 100);
  const pc = Math.round(fac * 10000) / 100;
  return {q:`Een prijs ${eerstOmlaag ? 'daalt' : 'stijgt'} eerst met ${a} %. Daarna ${eerstOmlaag ? 'stijgt' : 'daalt'} de nieuwe prijs met ${b} %.\nHoeveel procent van de oorspronkelijke prijs is de eindprijs?`, velden:[{w:pc, na:'%'}],
    u:`Neem een voorbeeldprijs van € 100.\nNa de eerste stap: ${eur(eerstOmlaag ? 100 - a : 100 + a)}.\n${b} % daarvan is ${eur((eerstOmlaag ? 100 - a : 100 + a) * b / 100)}, dus na de tweede stap: ${eur(100 * fac)}.\nDe eindprijs is ${f(pc)} % van de oorspronkelijke prijs. Procenten na elkaar mag je niet zomaar optellen of aftrekken.`};
});

g('t_g5_midden','get',5,0, R => {
  const b = R.int(2, 6), d = R.int(2, 7), a = R.int(1, b - 1), c = R.int(1, d - 1);
  if (b === d || ggd(a, b) !== 1 || ggd(c, d) !== 1 || a / b === c / d) return null;
  const t = a * d + c * b, n = 2 * b * d, k = ggd(t, n);
  return {q:`Welk getal ligt precies in het midden tussen {{${a}|${b}}} en {{${c}|${d}}}?\nSchrijf je antwoord als een vereenvoudigde breuk.`, velden:[{w:(t / k) + '/' + (n / k), vorm:'breuk'}],
    u:`Het midden is het gemiddelde: ({{${a}|${b}}} + {{${c}|${d}}}) : 2.\n{{${a}|${b}}} + {{${c}|${d}}} = {{${a * d}|${b * d}}} + {{${c * b}|${b * d}}} = {{${t}|${b * d}}}.\nDelen door 2: {{${t}|${n}}}` + (k > 1 ? ` = {{${t / k}|${n / k}}}.` : '.')};
});

g('t_g5_machtmix','get',5,0, R => {
  const a = R.int(2, 3), n = R.int(2, 3), t = R.int(1, 3), nn = R.kies([2, 4, 8]), e = R.int(1, 4);
  const val = Math.pow(-a, n) + t / nn * Math.pow(2, e + 2);
  if (val % 1) return null;
  return {q:`Reken uit: (−${a})${n === 2 ? '²' : '³'} + {{${t}|${nn}}} · 2${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e + 2]}`, velden:[{w:val}],
    u:`Eerst de machten: (−${a})${n === 2 ? '²' : '³'} = ${f(Math.pow(-a, n))} en 2${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e + 2]} = ${Math.pow(2, e + 2)}.\nDan het product: {{${t}|${nn}}} · ${Math.pow(2, e + 2)} = ${f(t / nn * Math.pow(2, e + 2))}.\nDan de som: ${f(Math.pow(-a, n))} + ${f(t / nn * Math.pow(2, e + 2))} = ${f(val)}.`};
});

/* ---------- algebra ---------- */
g('t_a1_verg','alg',1,0, R => {
  const x = R.int(-9, 15), a = R.int(2, 20), plus = R.int(0, 1);
  return plus ? {q:`Los op: x + ${a} = ${f(x + a)}`, velden:[{voor:'x =', w:x}], u:`Trek van beide leden ${a} af: x = ${f(x + a)} − ${a} = ${f(x)}.\nControle: ${f(x)} + ${a} = ${f(x + a)}.`}
    : {q:`Los op: x − ${a} = ${f(x - a)}`, velden:[{voor:'x =', w:x}], u:`Tel bij beide leden ${a} op: x = ${f(x - a)} + ${a} = ${f(x)}.\nControle: ${f(x)} − ${a} = ${f(x - a)}.`};
});

g('t_a1_getalw2','alg',1,0, R => {
  const p = R.int(2, 6), q = R.int(2, 6), a = R.int(-4, 6), b = R.int(-4, 6);
  if (!a || !b) return null;
  return {q:`Bereken de getalwaarde van ${p}a − ${q}b voor a = ${f(a)} en b = ${f(b)}.`, velden:[{w:p * a - q * b}],
    u:`Vervang de letters: ${p} · ${haak(a)} − ${q} · ${haak(b)} = ${f(p * a)} − ${haak(q * b)} = ${f(p * a - q * b)}.`};
});

g('t_a1_vertaal','alg',1,0, R => {
  const k = R.int(2, 9), soort = R.int(0, 2);
  const zinnen = [`het dubbel van een getal n, vermeerderd met ${k}`, `${k} keer een getal n, verminderd met 1`, `het drievoud van de som van een getal n en ${k}`];
  const juist = ['2n + ' + k, k + 'n − 1', '3(n + ' + k + ')'][soort];
  const fout = [['2(n + ' + k + ')', 'n² + ' + k, 'n + ' + 2 * k], [k + '(n − 1)', 'n − ' + k, k + ' + n − 1'], ['3n + ' + k, 'n + 3 · ' + k, '3 + n + ' + k]][soort];
  return {q:`Welke uitdrukking past bij: ${zinnen[soort]}?`, o:[juist].concat(fout),
    u:[`Het dubbel van n is 2n. Vermeerderd met ${k}: daarna ${k} erbij. Dus 2n + ${k}.`, `${k} keer n is ${k}n. Verminderd met 1: daarna 1 eraf. Dus ${k}n − 1.`, `Eerst de som: n + ${k}. Het drievoud daarvan: 3(n + ${k}). De haakjes zijn nodig.`][soort]};
});

g('t_a2_taxi','alg',2,0, R => {
  const s = R.stap(2, 5, 0.5), p = R.stap(1.5, 3, 0.5), km = R.int(3, 25);
  return {q:`Een taxi rekent ${eur(s)} startgeld en ${eur(p)} per kilometer. De prijs is dus: P = ${f(s)} + ${f(p)} · k (met k het aantal kilometer).\nHoeveel kost een rit van ${km} km?`, velden:[{voor:'€', w:s + p * km}],
    u:`Vul k = ${km} in: P = ${f(s)} + ${f(p)} · ${km} = ${f(s)} + ${f(p * km)} = ${eur(s + p * km)}.\nEerst vermenigvuldigen, dan optellen.`};
});

g('t_a2_maal','alg',2,0, R => {
  const a = R.int(2, 12), x = R.int(-9, 12);
  if (!x) return null;
  return {q:`Los op: ${a}x = ${f(a * x)}`, velden:[{voor:'x =', w:x}], u:`Deel beide leden door ${a}: x = ${f(a * x)} : ${a} = ${f(x)}.\nControle: ${a} · ${haak(x)} = ${f(a * x)}.`};
});

g('t_a2_haakjes','alg',2,0, R => {
  const a = R.int(2, 9), b = R.int(1, 9), min = R.int(0, 1);
  const juist = `${a}x ${min ? '−' : '+'} ${a * b}`;
  return {q:`Werk de haakjes uit: ${a}(x ${min ? '−' : '+'} ${b})`, o:[juist, `${a}x ${min ? '−' : '+'} ${b}`, `x ${min ? '−' : '+'} ${a * b}`, `${a + b}x`],
    u:`Vermenigvuldig ${a} met elke term tussen de haakjes: ${a} · x ${min ? '−' : '+'} ${a} · ${b} = ${juist}.`};
});

g('t_a5_breukverg','alg',5,0, R => {
  const x = R.int(-6, 15), c = R.kies([2, 3, 4, 5]), f2 = R.kies([2, 3, 4, 6]), a = R.int(1, 4), d = R.int(1, 4);
  if (c === f2) return null;
  const b = R.int(-5, 9), lt = a * x + b; if (lt % c) return null;
  const val = lt / c, e = val * f2 - d * x;
  const term = (k, v) => (k === 1 ? '' : k) + 'x ' + (v < 0 ? '− ' + Math.abs(v) : '+ ' + v);
  return {q:`Los op: {{${term(a, b)}|${c}}} = {{${term(d, e)}|${f2}}}`, velden:[{voor:'x =', w:x}],
    u:`Vermenigvuldig beide leden met ${c * f2 / ggd(c, f2)} (of kruiselings): ${f2}(${term(a, b)}) = ${c}(${term(d, e)}).\n${term(a * f2, b * f2)} = ${term(c * d, c * e)}.\n${a * f2 - c * d}x = ${f(c * e - b * f2)}, dus x = ${f(x)}.\nControle: beide leden worden ${f(val)}.`};
});

g('t_a5_even','alg',5,0, R => {
  const m = 2 * R.int(3, 30), groot = R.int(0, 1);
  return {q:`De som van drie opeenvolgende even getallen is ${3 * m}.\nWat is het ${groot ? 'grootste' : 'kleinste'} getal?`, velden:[{w:groot ? m + 2 : m - 2}],
    u:`Noem het middelste getal x. De getallen zijn x − 2, x en x + 2. Hun som is 3x = ${3 * m}, dus x = ${m}.\nDe getallen zijn ${m - 2}, ${m} en ${m + 2}. Het ${groot ? 'grootste' : 'kleinste'} is ${groot ? m + 2 : m - 2}.`};
});

g('t_a5_formom','alg',5,0, R => {
  const b = R.int(3, 16), h = R.int(2, 14);
  return {q:`De oppervlakte van een driehoek is A = {{b · h|2}}.\nHoe groot is de hoogte h als A = ${f(b * h / 2)} cm² en b = ${b} cm?`, velden:[{voor:'h =', w:h, na:'cm'}],
    u:`Vorm de formule om: 2A = b · h, dus h = {{2A|b}}.\nh = {{2 · ${f(b * h / 2)}|${b}}} = {{${b * h}|${b}}} = ${h} cm.`};
});

/* ---------- meetkunde ---------- */
g('t_m1_hoeksoort','mee',1,1, R => {
  const soort = R.int(0, 3), a = [R.int(5, 89), 90, R.int(91, 179), 180][soort];
  return {q:`Hoe noem je een hoek van ${a}°?`, o:[['een scherpe hoek', 'een rechte hoek', 'een stompe hoek', 'een gestrekte hoek'][soort]].concat(['een scherpe hoek', 'een rechte hoek', 'een stompe hoek', 'een gestrekte hoek'].filter((x, i) => i !== soort)),
    u:`Scherp: kleiner dan 90°. Recht: precies 90°. Stomp: tussen 90° en 180°. Gestrekt: precies 180°.\n${a}° is dus ${['scherp', 'recht', 'stomp', 'gestrekt'][soort]}.`};
});

g('t_m1_vierkant','mee',1,2, R => {
  const z = R.int(2, 15), opp = R.int(0, 1);
  return {q:`Een vierkant heeft een zijde van ${z} cm.\nWat is ${opp ? 'de oppervlakte' : 'de omtrek'} van het vierkant?`, velden:[{w:opp ? z * z : 4 * z, na:opp ? 'cm²' : 'cm'}],
    u:opp ? `Oppervlakte vierkant = zijde × zijde = ${z} × ${z} = ${z * z} cm².` : `Een vierkant heeft 4 gelijke zijden. Omtrek = 4 × ${z} = ${4 * z} cm.`};
});

g('t_mb_kubusvol','mee',2,2, R => {
  const r = R.int(2, 10);
  return {q:`Een kubus heeft een ribbe van ${r} cm.\nWat is het volume van de kubus?`, velden:[{w:r * r * r, na:'cm³'}],
    u:`Volume kubus = ribbe × ribbe × ribbe = ${r} × ${r} × ${r} = ${r * r * r} cm³.`};
});

g('t_mb_samengesteld','mee',4,4, R => {
  const L = R.int(8, 14), B = R.int(5, 9), a = 2 * R.int(1, Math.floor((L - 2) / 2)), b = R.int(2, B - 2);
  return {q:`Van een rechthoek van ${L} cm op ${B} cm wordt in een hoek een rechthoekige driehoek afgeknipt. De rechthoekszijden van die driehoek zijn ${a} cm en ${b} cm.\nWat is de oppervlakte van de figuur die overblijft?`, velden:[{w:L * B - a * b / 2, na:'cm²'}],
    u:`Oppervlakte rechthoek: ${L} × ${B} = ${L * B} cm².\nOppervlakte afgeknipte driehoek: {{${a} × ${b}|2}} = ${f(a * b / 2)} cm².\nWat overblijft: ${L * B} − ${f(a * b / 2)} = ${f(L * B - a * b / 2)} cm².`};
});

g('t_m5_tuinvijver','mee',5,5, R => {
  const l = R.int(8, 20), b = R.int(6, 14), d = R.kies([2, 4, 6]);
  if (d >= b) return null;
  const gras = l * b - 3.14 * (d / 2) * (d / 2);
  return {q:`Een rechthoekige tuin is ${l} m lang en ${b} m breed. In de tuin ligt een cirkelvormige vijver met een diameter van ${d} m. De rest is gras. Gebruik π ≈ 3,14.\nHoeveel m² gras is er? Rond af op 1 m².`, velden:[{w:Math.round(gras), na:'m²'}], calc:'w',
    u:`Oppervlakte tuin: ${l} × ${b} = ${l * b} m².\nStraal vijver: ${d} : 2 = ${d / 2} m. Oppervlakte vijver: 3,14 × ${d / 2} × ${d / 2} = ${f(3.14 * d * d / 4)} m².\nGras: ${l * b} − ${f(3.14 * d * d / 4)} = ${f(gras)} m², afgerond ${Math.round(gras)} m².`};
});

g('t_m5_parallellogram','mee',5,0, R => {
  const k = R.kies([2, 3, 4, 5, 8]), B = 180 / (k + 1);
  if (B % 1) return null;
  return {q:`In een parallellogram ABCD is hoek A ${k} keer zo groot als hoek B.\nHoe groot is hoek A?`, velden:[{w:k * B, na:'°'}],
    u:`In een parallellogram zijn twee opeenvolgende hoeken samen 180°.\n${k} · B + B = ${k + 1} · B = 180°, dus B = ${B}°.\nHoek A = ${k} · ${B}° = ${k * B}°.`};
});

g('t_m5_cilinder','mee',5,0, R => {
  const r = R.int(2, 10), h = R.int(3, 20), v = 3.14 * r * r * h;
  return {q:`Een cilindervormige pot heeft een straal van ${r} cm en een hoogte van ${h} cm. Gebruik π ≈ 3,14.\nWat is het volume? Rond af op 1 cm³.`, velden:[{w:Math.round(v), na:'cm³'}], calc:'w',
    u:`Volume cilinder = oppervlakte grondvlak × hoogte = π × straal × straal × hoogte.\n3,14 × ${r} × ${r} × ${h} = ${f(v, 2)} cm³, afgerond ${Math.round(v)} cm³.`};
});

g('t_mb_aquarium','mee',3,4, R => {
  const l = R.stap(30, 120, 10), b = R.stap(20, 50, 5), h = R.stap(20, 60, 5);
  return {q:`Een aquarium is ${l} cm lang, ${b} cm breed en ${h} cm hoog.\nHoeveel liter water kan er hoogstens in?`, velden:[{w:l * b * h / 1000, na:'liter'}], calc:'e',
    u:`Volume: ${l} × ${b} × ${h} = ${f(l * b * h)} cm³.\n1 liter = 1 000 cm³, dus ${f(l * b * h)} cm³ = ${f(l * b * h / 1000, 3)} liter.`};
});

/* ---------- statistiek ---------- */
g('t_s1_tabel','sta',1,1, R => {
  const sporten = R.schud(['Voetbal', 'Dans', 'Zwemmen', 'Tennis', 'Hockey', 'Judo']).slice(0, 4), aant = sporten.map(() => R.int(2, 12)), i = R.int(0, 3);
  return {q:`De tabel toont de lievelingssport van de leerlingen van een klas.\nHoeveel leerlingen kozen ${sporten[i].toLowerCase()}?`, velden:[{w:aant[i], na:'leerlingen'}],
    fig:{t:'tab', titel:'Lievelingssport', kop:['Sport', 'Aantal leerlingen'], rijen:sporten.map((s, k) => [s, aant[k]])},
    u:`Zoek de rij '${sporten[i]}' in de tabel en lees het aantal af: ${aant[i]}.`};
});

g('t_sb2_totaal','sta',2,2, R => {
  const sporten = R.schud(['Voetbal', 'Dans', 'Zwemmen', 'Tennis', 'Hockey', 'Judo']).slice(0, 4), aant = sporten.map(() => R.int(2, 12));
  const tot = aant.reduce((a, b) => a + b, 0);
  return {q:`De tabel toont de lievelingssport van de leerlingen van een klas. Elke leerling koos één sport.\nHoeveel leerlingen zitten er in de klas?`, velden:[{w:tot, na:'leerlingen'}],
    fig:{t:'tab', titel:'Lievelingssport', kop:['Sport', 'Aantal leerlingen'], rijen:sporten.map((s, k) => [s, aant[k]])},
    u:`Tel alle aantallen op: ${aant.join(' + ')} = ${tot}.`};
});

g('t_s1_staaflees','sta',1,1, R => {
  const nm = R.namen(5), y = nm.map(() => R.int(1, 9)), i = R.int(0, 4);
  return {q:`Het staafdiagram toont hoeveel boeken vijf leerlingen lazen.\nHoeveel boeken las ${nm[i]}?`, velden:[{w:y[i], na:'boek(en)'}],
    fig:{t:'staaf', titel:'Aantal gelezen boeken', x:nm, y, min:0, max:10, stap:1, ylab:'aantal boeken'},
    u:`Zoek de staaf van ${nm[i]} en lees de hoogte af op de verticale as: ${y[i]}.`};
});

g('t_s3_taartaantal','sta',3,4, R => {
  const N = R.kies([200, 300, 400, 500, 600]), p = [R.kies([30, 35, 40, 45]), R.kies([20, 25]), R.kies([10, 15, 20])];
  p.push(100 - p[0] - p[1] - p[2]); if (p[3] <= 0) return null;
  const cat = ['Fiets', 'Bus', 'Auto', 'Te voet'], i = R.int(0, 3);
  return {q:`Het cirkeldiagram toont hoe de ${N} leerlingen van een school naar school komen.\nHoeveel leerlingen komen ${['met de fiets', 'met de bus', 'met de auto', 'te voet'][i]}?`, velden:[{w:N * p[i] / 100, na:'leerlingen'}], calc:'e',
    fig:{t:'taart', titel:'Hoe komen de leerlingen naar school?', delen:cat.map((c, k) => [c, p[k]])},
    u:`${p[i]} % van de leerlingen komt ${['met de fiets', 'met de bus', 'met de auto', 'te voet'][i]}.\n${p[i]} % van ${N} = ${f(p[i] / 100)} × ${N} = ${N * p[i] / 100}.`};
});

g('t_s3_relfreqtab','sta',3,0, R => {
  let aant; do { aant = [R.int(1, 12), R.int(1, 12), R.int(1, 12), R.int(1, 12)]; } while ([20, 25, 40, 50].indexOf(aant.reduce((a, b) => a + b, 0)) < 0);
  const tot = aant.reduce((a, b) => a + b, 0), i = R.int(0, 3), wv2 = ['0', '1', '2', '3'];
  return {q:`De tabel toont hoeveel huisdieren de leerlingen van een groep hebben.\nWat is de relatieve frequentie van '${wv2[i]} ${i === 1 ? 'huisdier' : 'huisdieren'}', in procent?`, velden:[{w:aant[i] * 100 / tot, na:'%'}],
    fig:{t:'tab', titel:'Aantal huisdieren', kop:['Aantal huisdieren', 'Aantal leerlingen'], rijen:wv2.map((w, k) => [Number(w), aant[k]])},
    u:`In totaal zijn er ${aant.join(' + ')} = ${tot} leerlingen.\nRelatieve frequentie: {{${aant[i]}|${tot}}} = ${f(aant[i] / tot, 4)} = ${f(aant[i] * 100 / tot)} %.`};
});

g('t_s4_ontbrekend','sta',4,4, R => {
  const n = R.int(3, 4), doel = R.int(12, 16); let v; do { v = Array.from({length:n}, () => R.int(9, 18)); } while ((n + 1) * doel - v.reduce((a, b) => a + b, 0) > 20 || (n + 1) * doel - v.reduce((a, b) => a + b, 0) < 8);
  const x = (n + 1) * doel - v.reduce((a, b) => a + b, 0), naam = R.naam();
  return {q:`${naam} haalde op ${n} toetsen ${v.join(', ')} op 20.\nHoeveel moet ${naam} op de volgende toets halen om gemiddeld ${doel} op 20 te hebben?`, velden:[{w:x, na:'op 20'}],
    u:`Voor een gemiddelde van ${doel} op ${n + 1} toetsen zijn samen ${n + 1} × ${doel} = ${(n + 1) * doel} punten nodig.\n${naam} heeft er al ${v.join(' + ')} = ${v.reduce((a, b) => a + b, 0)}.\nNodig: ${(n + 1) * doel} − ${v.reduce((a, b) => a + b, 0)} = ${x}.`};
});

g('t_s4_freqgem','sta',4,5, R => {
  let aant; do { aant = [R.int(1, 8), R.int(2, 10), R.int(1, 8), R.int(0, 5)]; } while ((aant[1] + 2 * aant[2] + 3 * aant[3]) % 1 || [10, 20, 25, 40].indexOf(aant.reduce((a, b) => a + b, 0)) < 0);
  const tot = aant.reduce((a, b) => a + b, 0), som = aant[1] + 2 * aant[2] + 3 * aant[3];
  return {q:`De tabel toont hoeveel broers en zussen de leerlingen van een groep hebben.\nHoeveel broers en zussen hebben de leerlingen gemiddeld?`, velden:[{w:som / tot}], calc:'e',
    fig:{t:'tab', titel:'Broers en zussen', kop:['Aantal broers en zussen', 'Aantal leerlingen'], rijen:[0, 1, 2, 3].map((w, k) => [w, aant[k]])},
    u:`Vermenigvuldig elke waarde met haar frequentie en tel op: 0 · ${aant[0]} + 1 · ${aant[1]} + 2 · ${aant[2]} + 3 · ${aant[3]} = ${som}.\nDeel door het aantal leerlingen (${tot}): ${som} : ${tot} = ${f(som / tot, 3)}.`};
});

g('t_s4_mediaaneven','sta',4,0, R => {
  const v = Array.from({length:R.kies([6, 8])}, () => R.int(1, 40)), s = v.slice().sort((a, b) => a - b), n = v.length;
  const med = (s[n / 2 - 1] + s[n / 2]) / 2;
  return {q:`Gegeven de getallen: ${v.join(', ')}.\nWat is de mediaan?`, velden:[{w:med}],
    u:`Rangschik eerst: ${s.join(', ')}.\nBij ${n} getallen is de mediaan het gemiddelde van de twee middelste: {{${s[n / 2 - 1]} + ${s[n / 2]}|2}} = ${f(med)}.`};
});

g('t_s5_wissel','sta',5,5, R => {
  const n = R.kies([10, 11, 12, 15]), m = R.int(14, 30), uit = R.int(m + 3, m + 20), inn = R.int(10, m - 2);
  const nieuw = (n * m - uit + inn) / n;
  if ((nieuw * 100) % 1) return null;
  return {q:`Een ploeg van ${n} spelers heeft een gemiddelde leeftijd van ${m} jaar. Een speler van ${uit} jaar wordt vervangen door een speler van ${inn} jaar.\nWat is de nieuwe gemiddelde leeftijd?`, velden:[{w:nieuw, na:'jaar'}], calc:'e',
    u:`Som van de leeftijden: ${n} × ${m} = ${n * m}.\nNa de wissel: ${n * m} − ${uit} + ${inn} = ${n * m - uit + inn}.\nNieuw gemiddelde: ${n * m - uit + inn} : ${n} = ${f(nieuw)} jaar.`};
});

g('t_s5_gemna','sta',5,5, R => {
  const n = R.int(4, 6), m1 = R.int(10, 14), m2 = m1 + 1, x = (n + 1) * m2 - n * m1;
  if (x > 20) return null;
  const naam = R.naam();
  return {q:`Na ${n} toetsen heeft ${naam} een gemiddelde van ${m1} op 20. Na de volgende toets is het gemiddelde ${m2} op 20.\nHoeveel haalde ${naam} op die toets?`, velden:[{w:x, na:'op 20'}],
    u:`Na ${n} toetsen: ${n} × ${m1} = ${n * m1} punten.\nNa ${n + 1} toetsen: ${n + 1} × ${m2} = ${(n + 1) * m2} punten.\nOp de laatste toets: ${(n + 1) * m2} − ${n * m1} = ${x}.`};
});

/* ---------- verzamelingen ---------- */
g('t_v1_element','ver',1,0, R => {
  const A = R.schud([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 4).sort((a, b) => a - b), in1 = R.kies(A); let uit; do { uit = R.int(1, 10); } while (A.includes(uit));
  return {q:`Gegeven: A = {${A.join(', ')}}.\nWelke uitspraak is juist?`, o:[`${in1} ∈ A`, `${uit} ∈ A`, `${in1} ∉ A`, `{${in1}} ∈ A`],
    u:`∈ betekent 'is een element van'. ${in1} staat in de opsomming van A, dus ${in1} ∈ A.\n${uit} staat er niet in. {${in1}} is een verzameling, geen element van A.`};
});

g('t_v1_tel','ver',1,0, R => {
  const n = R.int(3, 9), A = R.schud('abcdefghijklmnop'.split('')).slice(0, n).sort();
  return {q:`Hoeveel elementen heeft de verzameling B = {${A.join(', ')}}?`, velden:[{w:n, na:'elementen'}], u:`Tel de elementen tussen de accolades: ${A.join(', ')}. Dat zijn er ${n}.`};
});

g('t_v1_venn','ver',1,0, R => {
  const pool = R.schud([1, 2, 3, 4, 5, 6, 7, 8, 9]), a = pool.slice(0, R.int(1, 3)), ab = pool.slice(3, 3 + R.int(1, 3)), b = pool.slice(6, 6 + R.int(1, 3));
  const vraag = R.int(0, 1);
  return {q:`Bekijk het venndiagram.\n${vraag ? 'Hoeveel elementen heeft A?' : 'Hoeveel elementen zitten in A en ook in B?'}`, velden:[{w:vraag ? a.length + ab.length : ab.length, na:'element(en)'}],
    fig:{t:'venn', a:a.map(String), ab:ab.map(String), b:b.map(String), uit:[]},
    u:vraag ? `Alles binnen de cirkel van A hoort bij A, ook het deel dat overlapt met B: ${a.concat(ab).join(', ')}. Dat zijn ${mv(a.length + ab.length, 'element', 'elementen')}.` : `De elementen die in A en in B zitten, staan in het overlappende deel: ${ab.join(', ')}. Dat ${ab.length === 1 ? 'is' : 'zijn'} ${mv(ab.length, 'element', 'elementen')}.`};
});

g('t_v2_delers','ver',2,0, R => {
  const n = R.kies([6, 8, 10, 12, 15, 16, 18, 20, 24, 28, 30, 36]), d = [...Array(n).keys()].map(i => i + 1).filter(i => n % i === 0);
  return {q:`D is de verzameling van de delers van ${n}.\nHoeveel elementen heeft D?`, velden:[{w:d.length, na:'elementen'}],
    u:`De delers van ${n} zijn: ${d.join(', ')}. Vergeet 1 en ${n} zelf niet.\nD heeft ${d.length} elementen.`};
});

g('t_v2_unie','ver',2,0, R => {
  const A = R.schud([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 4).sort((a, b) => a - b), B = R.schud([3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 4).sort((a, b) => a - b);
  const U = [...new Set(A.concat(B))].sort((a, b) => a - b), D = A.filter(x => B.includes(x)), welke = R.int(0, 1);
  if (!D.length) return null;
  return {q:`Gegeven: A = {${A.join(', ')}} en B = {${B.join(', ')}}.\nHoeveel elementen heeft ${welke ? 'A ∪ B' : 'A ∩ B'}?`, velden:[{w:welke ? U.length : D.length, na:'element(en)'}],
    u:welke ? `A ∪ B bevat alle elementen van A of B, elk één keer: {${U.join(', ')}}. Dat zijn ${mv(U.length, 'element', 'elementen')}.` : `A ∩ B bevat de elementen die in A en ook in B zitten: {${D.join(', ')}}. Dat ${D.length === 1 ? 'is' : 'zijn'} ${mv(D.length, 'element', 'elementen')}.`};
});

g('t_v3_verschil','ver',3,0, R => {
  const A = R.schud([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5).sort((a, b) => a - b), B = R.schud([2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 4).sort((a, b) => a - b);
  const V = A.filter(x => !B.includes(x));
  if (V.length === A.length || !V.length) return null;
  return {q:`Gegeven: A = {${A.join(', ')}} en B = {${B.join(', ')}}.\nHoeveel elementen heeft A \\ B?`, velden:[{w:V.length, na:'element(en)'}],
    u:`A \\ B bevat de elementen van A die niet in B zitten: {${V.join(', ')}}.\nDat ${V.length === 1 ? 'is' : 'zijn'} ${mv(V.length, 'element', 'elementen')}.`};
});

g('t_v3_veelvoud','ver',3,0, R => {
  const a = R.kies([2, 3, 4, 5]), b = R.kies([3, 4, 6]), grens = R.kies([20, 25, 30, 40]);
  if (a === b) return null;
  const V = [...Array(grens).keys()].map(i => i + 1).filter(i => i % a === 0 && i % b === 0);
  return {q:`A is de verzameling van de veelvouden van ${a} tussen 0 en ${grens}. B is de verzameling van de veelvouden van ${b} tussen 0 en ${grens}.\nHoeveel elementen heeft A ∩ B?`, velden:[{w:V.length, na:'element(en)'}],
    u:`In A ∩ B zitten de getallen tussen 0 en ${grens} die een veelvoud zijn van ${a} én van ${b}: ${V.length ? V.join(', ') : 'geen enkel getal'}.\nDat zijn de veelvouden van ${a * b / ggd(a, b)}. A ∩ B heeft ${mv(V.length, 'element', 'elementen')}.`};
});

g('t_v5_deelverz','ver',5,0, R => {
  const n = R.int(2, 5), A = 'abcde'.slice(0, n).split('');
  return {q:`Gegeven: A = {${A.join(', ')}}.\nHoeveel deelverzamelingen heeft A in totaal?`, velden:[{w:Math.pow(2, n), na:'deelverzamelingen'}],
    u:`Elk element zit wel of niet in een deelverzameling: 2 mogelijkheden per element.\nBij ${n} elementen: 2${'⁰¹²³⁴⁵'[n]} = ${Math.pow(2, n)} deelverzamelingen. De lege verzameling en A zelf tellen mee.`};
});

g('t_v5_beide','ver',5,0, R => {
  const T = R.int(30, 50), geen = R.int(2, 8), beide = R.int(3, 12), a = R.int(beide + 2, T - geen - 3);
  const b = T - geen - a + beide;
  if (b <= beide || b > T) return null;
  return {q:`In een groep van ${T} jongeren spreken ${a} jongeren Frans en ${b} jongeren Engels. ${geen} jongeren spreken geen van beide talen.\nHoeveel jongeren spreken Frans en ook Engels?`, velden:[{w:beide, na:'jongeren'}],
    u:`Jongeren die minstens één van de talen spreken: ${T} − ${geen} = ${T - geen}.\n${a} + ${b} = ${a + b}. Dat is ${a + b - (T - geen)} meer dan ${T - geen}, omdat wie beide talen spreekt twee keer geteld is.\nEr spreken ${beide} jongeren Frans en Engels.`};
});

g('t_mb_figuur','mee',0,1, R => {
  const fig = R.kies([['een driehoek', 3], ['een vierhoek', 4], ['een vijfhoek', 5], ['een zeshoek', 6], ['een achthoek', 8]]), wat = R.kies(['zijden', 'hoekpunten']);
  return {q:`Hoeveel ${wat} heeft ${fig[0]}?`, velden:[{w:fig[1], na:wat}],
    u:`Het woord zegt het: ${fig[0]} heeft ${fig[1]} hoeken. Een veelhoek heeft evenveel zijden als hoekpunten: ${fig[1]}.`};
});

g('t_v3_beschrijving','ver',3,0, R => {
  const n = R.int(4, 12), strikt = R.int(0, 1), vanaf1 = R.int(0, 1);
  const el = [...Array(n + (strikt ? 0 : 1)).keys()].filter(x => !vanaf1 || x > 0);
  return {q:`Gegeven: A = {x | x is een natuurlijk getal${vanaf1 ? ' verschillend van 0' : ''} en x ${strikt ? '&lt;' : '≤'} ${n}}.\nHoeveel elementen heeft A?`, velden:[{w:el.length, na:'elementen'}],
    u:`Som de elementen op: A = {${el.join(', ')}}.${vanaf1 ? '' : ' Let op: 0 is ook een natuurlijk getal.'}${strikt ? ' ' + n + ' zelf telt niet mee (kleiner dan).' : ' ' + n + ' telt mee (kleiner dan of gelijk aan).'}\nA heeft ${el.length} elementen.`};
});

// Extra sjablonen zodat leerlingen die een domein meermaals oefenen, nieuwe opgaven krijgen.
const tot1 = n => [...Array(n).keys()].map(i => i + 1);
const telw = a => a.reduce((s, x) => s + x, 0);

/* ---------- verzamelingenleer (A-stroom) ---------- */
g('t_vm_letters','ver',1,0, R => {
  const w = R.kies(['WISKUNDE', 'KLASGENOOT', 'SPEELPLAATS', 'BOEKENTAS', 'TURNZAAL', 'LEERKRACHT', 'PASSER', 'GEODRIEHOEK', 'REKENMACHINE', 'BANANEN', 'AARDAPPEL', 'TOMATEN', 'VERZAMELING', 'SCHOOLBUS', 'KANAAL', 'BIBLIOTHEEK', 'MAANDAG', 'VAKANTIE']);
  const L = [...new Set(w.split(''))];
  return {q:`L is de verzameling van de letters van het woord ${w}.\nHoeveel elementen heeft L?`, velden:[{w:L.length, na:'elementen'}],
    u:`In een verzameling schrijf je elk element maar één keer.\nL = {${L.join(', ')}}.\nDat zijn ${L.length} elementen (het woord telt ${w.length} letters, maar sommige letters komen meer dan één keer voor).`};
});

g('t_vm_veelvoud','ver',1,0, R => {
  const k = R.int(3, 9), m = R.int(3, 9) * k;
  const fout = []; while (fout.length < 3) { const x = R.int(k + 1, 10 * k); if (x % k && !fout.includes(x)) fout.push(x); }
  return {q:`V${k} is de verzameling van de veelvouden van ${k}.\nWelk getal is een element van V${k}?`, o:[String(m), ...fout.map(String)],
    u:`Een veelvoud van ${k} krijg je door ${k} met een natuurlijk getal te vermenigvuldigen.\n${m} = ${m / k} · ${k}, dus ${m} ∈ V${k}.\n` + fout.map(x => `${x} : ${k} gaat niet op`).join(', ') + '.'};
});

g('t_vm_interval','ver',2,0, R => {
  const a = R.int(0, 30), b = a + R.int(4, 15), sa = R.int(0, 1), sb = R.int(0, 1);
  const el = []; for (let x = a; x <= b; x++) if ((sa ? x > a : x >= a) && (sb ? x < b : x <= b)) el.push(x);
  return {q:`A = {x ∈ ℕ | ${a} ${sa ? '<' : '≤'} x ${sb ? '<' : '≤'} ${b}}\nHoeveel elementen heeft A?`, velden:[{w:el.length, na:'elementen'}],
    u:`${sa ? `Het teken < betekent: ${a} hoort er niet bij.` : `Het teken ≤ betekent: ${a} hoort er wel bij.`} ${sb ? `${b} hoort er niet bij.` : `${b} hoort er wel bij.`}\nA = {${el.length > 8 ? el.slice(0, 3).join(', ') + ', …, ' + el[el.length - 1] : el.join(', ')}}.\nA heeft ${el.length} elementen.`};
});

g('t_vm_venngebied','ver',2,0, R => {
  const p = R.schud(tot1(15)), a = p.slice(0, R.int(1, 3)), ab = p.slice(3, 3 + R.int(1, 3)), b = p.slice(6, 6 + R.int(1, 3)), uit = p.slice(9, 9 + R.int(1, 3));
  const w = R.int(0, 3);
  const opt = [['A ∪ B', a.concat(ab, b), 'A ∪ B bevat alles wat in A of in B zit (de twee cirkels samen)'],
               ['B \\ A', b, 'B \\ A bevat de elementen van B die niet in A zitten'],
               ['A \\ B', a, 'A \\ B bevat de elementen van A die niet in B zitten'],
               ['B', ab.concat(b), 'B bevat alles binnen de cirkel van B, ook het overlappende deel']][w];
  return {q:`Bekijk het venndiagram.\nHoeveel elementen heeft ${opt[0]}?`, velden:[{w:opt[1].length, na:'element(en)'}],
    fig:{t:'venn', a:a.map(String), ab:ab.map(String), b:b.map(String), uit:uit.map(String)},
    u:`${opt[2]}: ${opt[1].sort((x, y) => x - y).join(', ')}.\nDat ${opt[1].length === 1 ? 'is' : 'zijn'} ${mv(opt[1].length, 'element', 'elementen')}. De getallen buiten de cirkels tellen niet mee.`};
});

g('t_vm_deel','ver',3,0, R => {
  const A = R.schud(tot1(12)).slice(0, 5).sort((x, y) => x - y), niet = R.schud(tot1(12).filter(x => !A.includes(x)));
  const d = R.schud(A).slice(0, R.int(2, 3)).sort((x, y) => x - y);
  const f = [0, 1, 2].map(i => { const s = R.schud(A).slice(0, R.int(1, 2)); s.push(niet[i]); return s.sort((x, y) => x - y); });
  const t = s => `{${s.join(', ')}}`;
  if (new Set([d, ...f].map(t)).size < 4) return null;
  return {q:`Gegeven: A = ${t(A)}.\nWelke verzameling is een deelverzameling van A?`, o:[t(d) + ' ⊂ A', ...f.map(s => t(s) + ' ⊂ A')],
    u:`B ⊂ A betekent: elk element van B is ook een element van A.\nAlle elementen van ${t(d)} staan in A.\nDe andere verzamelingen bevatten een getal dat niet in A zit: ${f.map(s => s.find(x => !A.includes(x))).join(', ')}.`};
});

g('t_vm_vennsleep','ver',3,0, R => {
  const n = R.kies([12, 18, 20, 24, 30]), k = R.kies([2, 3, 5]);
  const U = R.schud(tot1(n)).slice(0, 7).sort((x, y) => x - y);
  const inA = x => n % x === 0, inB = x => x % k === 0;
  const zone = x => inA(x) ? (inB(x) ? 1 : 0) : (inB(x) ? 2 : 3), w = U.map(zone);
  if (new Set(w).size < 4) return null;
  return {q:`A is de verzameling van de delers van ${n}. B is de verzameling van de veelvouden van ${k}.\nSleep elk getal naar het juiste gebied.`,
    kaartjes:U.map(String), vakken:['alleen in A', 'in A en in B', 'alleen in B', 'niet in A en niet in B'], w,
    u:`Controleer bij elk getal twee dingen: is het een deler van ${n}? Is het een veelvoud van ${k}?\n` + ['Alleen in A', 'In A en in B', 'Alleen in B', 'In geen van beide'].map((z, i) => `${z}: ${U.filter(x => zone(x) === i).join(', ')}`).join('.\n') + '.'};
});

g('t_vm_samen','ver',4,0, R => {
  const A = R.schud(tot1(15)).slice(0, R.int(4, 6)).sort((x, y) => x - y), B = R.schud(tot1(15)).slice(0, R.int(4, 6)).sort((x, y) => x - y), C = R.schud(tot1(15)).slice(0, 3).sort((x, y) => x - y);
  const D = A.filter(x => B.includes(x)), W = [...new Set(D.concat(C))].sort((x, y) => x - y);
  if (!D.length || W.length === D.length + C.length && R.int(0, 1)) return null;
  return {q:`Gegeven: A = {${A.join(', ')}}, B = {${B.join(', ')}} en C = {${C.join(', ')}}.\nHoeveel elementen heeft (A ∩ B) ∪ C?`, velden:[{w:W.length, na:'element(en)'}],
    u:`Werk eerst tussen de haakjes: A ∩ B = {${D.join(', ')}}.\nVoeg daarna C toe, elk getal één keer: (A ∩ B) ∪ C = {${W.join(', ')}}.\nDat ${W.length === 1 ? 'is' : 'zijn'} ${mv(W.length, 'element', 'elementen')}.`};
});

g('t_vm_formule','ver',5,0, R => {
  const nA = R.int(8, 20), nB = R.int(6, 18), nD = R.int(2, Math.min(nA, nB) - 2), nU = nA + nB - nD, vraag = R.int(0, 1);
  return vraag
    ? {q:`A heeft ${nA} elementen en B heeft ${nB} elementen. A ∪ B heeft ${nU} elementen.\nHoeveel elementen heeft A ∩ B?`, velden:[{w:nD, na:'elementen'}],
       u:`Als je ${nA} + ${nB} = ${nA + nB} neemt, tel je de elementen van A ∩ B twee keer.\nA ∪ B heeft er maar ${nU}, dus A ∩ B heeft ${nA + nB} − ${nU} = ${nD} elementen.`}
    : {q:`A heeft ${nA} elementen en B heeft ${nB} elementen. A ∩ B heeft ${nD} elementen.\nHoeveel elementen heeft A \\ B?`, velden:[{w:nA - nD, na:'elementen'}],
       u:`A \\ B bevat de elementen van A die niet in B zitten.\nVan de ${nA} elementen van A zitten er ${nD} ook in B.\n${nA} − ${nD} = ${nA - nD} elementen.`};
});

g('t_vm_tellen','ver',5,0, R => {
  const N = R.kies([50, 60, 80, 100]), k1 = R.kies([2, 3, 4]), k2 = R.kies([3, 5, 6, 7]);
  if (k1 === k2 || k2 % k1 === 0) return null;
  const kg = k1 * k2 / ggd(k1, k2), a = Math.floor(N / k1), b = Math.floor(N / k2), c = Math.floor(N / kg);
  return {q:`Hoeveel getallen van 1 tot en met ${N} zijn een veelvoud van ${k1} of een veelvoud van ${k2} (of van allebei)?`, velden:[{w:a + b - c, na:'getallen'}], calc:'e',
    u:`Veelvouden van ${k1}: ${N} : ${k1} → ${a}.\nVeelvouden van ${k2}: ${N} : ${k2} → ${b}.\nGetallen die in beide zitten, zijn veelvouden van kgv(${k1}, ${k2}) = ${kg}: ${c}. Die heb je twee keer geteld.\n${a} + ${b} − ${c} = ${a + b - c}.`};
});

/* ---------- statistiek ---------- */
const DAGEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'], DAGNAAM = {ma:'maandag', di:'dinsdag', wo:'woensdag', do:'donderdag', vr:'vrijdag', za:'zaterdag', zo:'zondag'};

g('t_sm_lijnlees','sta',1,1, R => {
  const b = R.int(8, 16), y = DAGEN.map(() => b + R.int(0, 8)), i = R.int(0, 6);
  return {q:`Het lijndiagram toont de temperatuur om 12 uur, een week lang.\nHoe warm was het op ${DAGNAAM[DAGEN[i]]}?`, velden:[{w:y[i], na:'°C'}],
    fig:{t:'lijn', titel:'Temperatuur om 12 uur', x:DAGEN, y, min:b - 1, max:b + 9, stap:1, ylab:'temperatuur in °C'},
    u:`Zoek ${DAGNAAM[DAGEN[i]]} (${DAGEN[i]}) op de horizontale as, ga recht omhoog tot het punt en lees links af: ${y[i]} °C.`};
});

g('t_sm_meeste','sta',1,1, R => {
  const nm = R.namen(4); let y; do { y = nm.map(() => R.int(2, 12)); } while (new Set(y).size < 4);
  const meest = R.int(0, 1), i = y.indexOf(meest ? Math.max(...y) : Math.min(...y));
  return {q:`Het staafdiagram toont hoeveel kilometer vier vrienden deze week fietsten.\nWie fietste de ${meest ? 'meeste' : 'minste'} kilometers?`, o:[nm[i], ...nm.filter((_, k) => k !== i)],
    fig:{t:'staaf', titel:'Gefietste kilometers', x:nm, y, min:0, max:14, stap:2, ylab:'km'},
    u:`Zoek de ${meest ? 'hoogste' : 'laagste'} staaf: die van ${nm[i]} (${y[i]} km).`};
});

g('t_sm_turven','sta',2,2, R => {
  const kies = R.kies([[['rood', 'blauw', 'groen', 'geel'], 'lievelingskleur', 'kozen'], [['appel', 'banaan', 'peer', 'kiwi'], 'lievelingsfruit', 'kozen'], [['bus', 'fiets', 'auto', 'te voet'], 'vervoermiddel', 'antwoordden']]);
  const n = R.int(14, 20), lijst = []; for (let k = 0; k < n; k++) lijst.push(R.kies(kies[0]));
  const doel = R.kies(kies[0]), w = lijst.filter(x => x === doel).length;
  if (!w) return null;
  return {q:`${n} leerlingen gaven hun ${kies[1]} door:\n${lijst.join(', ')}\nHoeveel leerlingen ${kies[2]} '${doel}'?`, velden:[{w, na:'leerlingen'}],
    u:`Tel hoe vaak '${doel}' in de lijst voorkomt. Zet bij elk woord een streepje (turven) zodat je niets dubbel telt.\n'${doel}' komt ${w} keer voor.`};
});

g('t_sm_meer','sta',2,2, R => {
  const kl = ['2A', '2B', '2C', '2D'], j = kl.map(() => R.int(6, 15)), m = kl.map(() => R.int(6, 15)), i = R.int(0, 3);
  if (j[i] === m[i]) return null;
  const meer = j[i] > m[i];
  return {q:`De tabel toont het aantal jongens en meisjes per klas.\nHoeveel ${meer ? 'jongens' : 'meisjes'} meer dan ${meer ? 'meisjes' : 'jongens'} zitten er in ${kl[i]}?`, velden:[{w:Math.abs(j[i] - m[i]), na:meer ? 'jongens' : 'meisjes'}],
    fig:{t:'tab', titel:'Leerlingen per klas', kop:['Klas', 'Jongens', 'Meisjes'], rijen:kl.map((k, x) => [k, j[x], m[x]])},
    u:`Lees in de rij ${kl[i]}: ${j[i]} jongens en ${m[i]} meisjes.\n${Math.max(j[i], m[i])} − ${Math.min(j[i], m[i])} = ${Math.abs(j[i] - m[i])}.`};
});

g('t_sm_stijging','sta',3,3, R => {
  const b = R.int(5, 12); let y, d, i;
  do { y = DAGEN.map(() => b + R.int(0, 9)); d = y.slice(1).map((v, k) => v - y[k]); i = d.indexOf(Math.max(...d)); } while (d.filter(x => x === d[i]).length > 1 || d[i] < 2);
  const opt = d.map((_, k) => k).filter(k => k !== i), fout = R.schud(opt).slice(0, 3);
  const t = k => `van ${DAGNAAM[DAGEN[k]]} naar ${DAGNAAM[DAGEN[k + 1]]}`;
  return {q:`Het lijndiagram toont de temperatuur om 12 uur, een week lang.\nTussen welke twee dagen steeg de temperatuur het meest?`, o:[t(i), ...fout.map(t)],
    fig:{t:'lijn', titel:'Temperatuur om 12 uur', x:DAGEN, y, min:b - 1, max:b + 10, stap:1, ylab:'temperatuur in °C'},
    u:`De grootste stijging zie je aan het steilste stuk dat omhoog gaat.\n${t(i)[0].toUpperCase() + t(i).slice(1)}: van ${y[i]} °C naar ${y[i + 1]} °C, dat is ${d[i]} graden erbij. Geen enkele andere stijging is zo groot.`};
});

g('t_sm_procent','sta',4,4, R => {
  const N = R.kies([20, 25, 50]), sp = R.schud(['Voetbal', 'Dans', 'Zwemmen', 'Tennis', 'Hockey']).slice(0, 4);
  const a = [R.int(2, N / 2), R.int(1, N / 4), R.int(1, N / 4)]; a.push(N - telw(a)); if (a[3] < 1) return null;
  const i = R.int(0, 3), p = a[i] / N * 100;
  return {q:`De tabel toont de lievelingssport van de ${N} leerlingen van een groep.\nWelk percentage van de leerlingen koos ${sp[i].toLowerCase()}?`, velden:[{w:p, na:'%'}], calc:'e',
    fig:{t:'tab', titel:'Lievelingssport', kop:['Sport', 'Aantal leerlingen'], rijen:sp.map((s, k) => [s, a[k]])},
    u:`${a[i]} van de ${N} leerlingen kozen ${sp[i].toLowerCase()}.\n${a[i]} : ${N} = ${f(a[i] / N)} = ${f(p)} %.`};
});

g('t_sm_taarthoek','sta',4,5, R => {
  const p = [R.kies([40, 45, 50]), R.kies([20, 25, 30]), R.kies([5, 10, 15])]; p.push(100 - telw(p)); if (p[3] <= 0) return null;
  const cat = ['Fiets', 'Bus', 'Auto', 'Te voet'], i = R.int(0, 3);
  return {q:`In een cirkeldiagram over hoe leerlingen naar school komen, is het deel '${cat[i]}' ${p[i]} %.\nHoe groot is de middelpuntshoek van dat deel?`, velden:[{w:p[i] * 3.6, na:'°'}], calc:'e',
    fig:{t:'taart', titel:'Hoe komen de leerlingen naar school?', delen:cat.map((c, k) => [c, p[k]])},
    u:`De hele cirkel is 360° en dat is 100 %.\n1 % komt overeen met 360° : 100 = 3,6°.\n${p[i]} % → ${p[i]} × 3,6° = ${f(p[i] * 3.6)}°.`};
});

g('t_sm_mediaantab','sta',5,5, R => {
  const sc = [5, 6, 7, 8, 9, 10], a = sc.map(() => R.int(0, 5)), N = telw(a);
  if (N < 9 || N % 2 === 0) return null;
  const lijst = []; sc.forEach((s, k) => { for (let z = 0; z < a[k]; z++) lijst.push(s); });
  const med = lijst[(N - 1) / 2];
  return {q:`De tabel toont de scores (op 10) van een groep leerlingen op een toets.\nWat is de mediaan van de scores?`, velden:[{w:med}],
    fig:{t:'tab', titel:'Scores op de toets', kop:['Score', 'Aantal leerlingen'], rijen:sc.map((s, k) => [s, a[k]])},
    u:`Er zijn ${N} leerlingen (tel de tweede kolom op). Bij een oneven aantal is de mediaan de middelste waarde: de ${(N + 1) / 2}e score als je ze van klein naar groot zet.\nTel van boven af: ` + sc.map((s, k) => `t/m ${s}: ${telw(a.slice(0, k + 1))}`).join(', ') + `.\nDe ${(N + 1) / 2}e score is ${med}.`};
});

g('t_sm_gemextra','sta',5,4, R => {
  const n = R.int(4, 7), g1 = R.int(30, 60), x = R.int(10, 90), g2 = (n * g1 + x) / (n + 1);
  if (g2 % 1) return null;
  const naam = R.naam();
  return {q:`${naam} speelde ${n} keer een spel en haalde gemiddeld ${g1} punten. Na nog één spel is het gemiddelde ${g2} punten.\nHoeveel punten haalde ${naam} in dat laatste spel?`, velden:[{w:x, na:'punten'}], calc:'e',
    u:`Totaal na ${n} spellen: ${n} × ${g1} = ${n * g1}.\nTotaal na ${n + 1} spellen: ${n + 1} × ${g2} = ${(n + 1) * g2}.\nHet laatste spel: ${(n + 1) * g2} − ${n * g1} = ${x} punten.`};
});

/* ---------- getallenleer, hogere niveaus ---------- */
g('t_gm_rest','get',4,4, R => {
  const N = R.kies([24, 30, 36, 40, 48, 60, 72, 90, 120]), b1 = R.kies([2, 3, 4, 5, 6]), b2 = R.kies([2, 3, 4, 5]);
  if (N % b1 || (N - N / b1) % b2) return null;
  const r1 = N - N / b1, r2 = r1 - r1 / b2, wat = R.kies([['snoepjes', 'zijn broer', 'zijn zus'], ['knikkers', 'zijn vriend', 'zijn nicht'], ['stickers', 'zijn buurman', 'zijn neef']]);
  const naam = R.kies(['Kobe', 'Milan', 'Senne', 'Rayan', 'Wout']);
  return {q:`${naam} heeft ${N} ${wat[0]}. Hij geeft {{1|${b1}}} ervan aan ${wat[1]}. Van wat overblijft, geeft hij {{1|${b2}}} aan ${wat[2]}.\nHoeveel ${wat[0]} houdt ${naam} zelf?`, velden:[{w:r2, na:wat[0]}],
    u:`Stap 1: {{1|${b1}}} van ${N} = ${N / b1}. Er blijven ${N} − ${N / b1} = ${r1} over.\nStap 2: {{1|${b2}}} van ${r1} (niet van ${N}!) = ${r1 / b2}. Er blijven ${r1} − ${r1 / b2} = ${r2} over.`};
});

g('t_gm_breukmix','get',5,0, R => {
  const nm = [2, 3, 4, 5, 6], a = R.int(1, 5), b = R.kies(nm), c = R.int(1, 5), d = R.kies(nm), e = R.int(2, 5);
  if (ggd(a, b) !== 1 || ggd(c, d) !== 1 || a >= b || c >= d || (c * e) % d === 0) return null;
  // a/b + c/d · e
  const t = a * d + c * e * b, n = b * d, g_ = ggd(t, n), tt = t / g_, nn = n / g_;
  if (nn === 1) return null;
  return {q:`Reken uit: {{${a}|${b}}} + {{${c}|${d}}} · ${e}\nSchrijf je antwoord als een vereenvoudigde breuk.`, velden:[{w:tt + '/' + nn, vorm:'breuk'}],
    u:`Eerst vermenigvuldigen, dan optellen.\n{{${c}|${d}}} · ${e} = {{${c * e}|${d}}}.\n{{${a}|${b}}} + {{${c * e}|${d}}} = {{${a * d}|${n}}} + {{${c * e * b}|${n}}} = {{${t}|${n}}}` + (g_ > 1 ? ` = {{${tt}|${nn}}}.` : '.')};
});

g('t_gm_negmacht','get',5,0, R => {
  const a = R.int(2, 4), n = R.int(2, 4), b = R.int(2, 5), haak = R.int(0, 1);
  const v1 = haak ? Math.pow(-a, n) : -Math.pow(a, n), w = v1 + b * b;
  return {q:`Reken uit: ${haak ? `(−${a})` : `−${a}`}${'⁰¹²³⁴'[n]} + ${b}²`, velden:[{w}],
    u:(haak ? `(−${a})${'⁰¹²³⁴'[n]}: het grondtal is −${a}. ${n % 2 ? 'Oneven exponent, dus het resultaat is negatief' : 'Even exponent, dus het resultaat is positief'}: ${f(v1)}.`
            : `−${a}${'⁰¹²³⁴'[n]}: zonder haakjes geldt de exponent alleen voor ${a}. Dus −(${a}${'⁰¹²³⁴'[n]}) = ${f(v1)}.`) + `\n${b}² = ${b * b}.\n${f(v1)} + ${b * b} = ${f(w)}.`};
});

/* ---------- problemen oplossen, lage niveaus ---------- */
g('t_pm_munten','pro',1,1, R => {
  const n = R.naam(), a = R.int(1, 5), b = R.int(1, 6), c = R.int(2, 8);
  const w = a * 2 + b * 0.5 + c * 0.2;
  return {q:`${n} leegt de spaarpot.
In de spaarpot zitten: ${mv(a, 'munt', 'munten')} van € 2, ${mv(b, 'munt', 'munten')} van € 0,50 en ${c} munten van € 0,20.\nHoeveel geld zit er in de spaarpot?`, velden:[{voor:'€', w}],
    u:`${a} × € 2 = ${eur(a * 2)}.\n${b} × € 0,50 = ${eur(b * 0.5)}.\n${c} × € 0,20 = ${eur(c * 0.2)}.\nSamen: ${eur(w)}.`,
    tip:`Reken per soort munt hoeveel geld het is en tel daarna op.`};
});

g('t_pm_tafels','pro',1,1, R => {
  const t = R.int(4, 12), p = R.kies([4, 6, 8]), extra = R.int(2, 4);
  return {q:`Voor een feest worden ${t} tafels klaargezet. Aan elke tafel staan ${p} stoelen. Er komen ${extra} stoelen bij voor de muzikanten.\nHoeveel stoelen zijn er in totaal?`, velden:[{w:t * p + extra, na:'stoelen'}],
    u:`Stoelen aan de tafels: ${t} × ${p} = ${t * p}.\nMet de stoelen voor de muzikanten: ${t * p} + ${extra} = ${t * p + extra}.`,
    tip:`Bereken eerst hoeveel stoelen er aan alle tafels samen staan.`};
});

g('t_pm_plank','pro',2,2, R => {
  const L = R.kies([150, 200, 240, 250, 300]), s = R.kies([35, 40, 45, 55, 60, 65, 70]), n = Math.floor(L / s), r = L - n * s;
  if (!r) return null;
  return {q:`Een plank is ${f(L / 100)} m lang. Je zaagt er zoveel mogelijk stukken van ${s} cm uit.\nHoeveel stukken krijg je en hoeveel cm blijft er over?`, velden:[{w:n, na:'stukken'}, {w:r, na:'cm over'}], calc:'e',
    u:`Zet eerst alles in dezelfde eenheid: ${f(L / 100)} m = ${L} cm.\n${L} : ${s} = ${f(L / s, 2)}…, dus ${n} volle stukken.\n${n} × ${s} = ${n * s} cm. Over: ${L} − ${n * s} = ${r} cm.`,
    tip:`Zet meter en centimeter eerst om naar dezelfde eenheid.`};
});

g('t_pm_kassa','pro',2,2, R => {
  const it = R.schud([['brood', 2.4], ['pak melk', 1.1], ['zak appels', 2.9], ['doos eieren', 3.2], ['pot choco', 4.5], ['fles sap', 2.2]]).slice(0, 2);
  const a = R.int(2, 4), b = R.int(2, 3), tot = a * it[0][1] + b * it[1][1], biljet = tot < 20 ? 20 : 50;
  return {q:`Je koopt ${a} × ${it[0][0]} van ${eur(it[0][1])} en ${b} × ${it[1][0]} van ${eur(it[1][1])}. Je betaalt met een biljet van ${eur(biljet)}.\nHoeveel krijg je terug?`, velden:[{voor:'€', w:biljet - tot}], calc:'e',
    u:`${a} × ${eur(it[0][1])} = ${eur(a * it[0][1])}.\n${b} × ${eur(it[1][1])} = ${eur(b * it[1][1])}.\nSamen: ${eur(tot)}.\nTerug: ${eur(biljet)} − ${eur(tot)} = ${eur(biljet - tot)}.`,
    tip:`Bereken eerst wat alles samen kost.`};
});

/* Doelen per thema en letter uit de leeswijzer bij de vaardigheidsniveaus (gemaakt met maak_doelen.py, niet met de hand wijzigen).
   Code: stroom-thema-letter+nummer, bv. A-OOI-C3. */
const DOELEN = {
"B-GET-D1": "Een maateenheid associëren met een maatgetal voor tijd, lengte, oppervlakte, inhoud/volume of massa",
"B-GET-D2": "Een maateenheid associëren met de grootheid tijd, lengte, oppervlakte, inhoud of massa",
"B-GET-D3": "De grootteorde bepalen van een lengte en een inhoud",
"B-GET-D4": "Zinvol afronden tot op een kwartier, een halfuur en een uur",
"B-GET-D5": "Digitale, analoge en woordelijke tijdsweergaven met elkaar associëren",
"B-GET-D6": "De som of het verschil berekenen van twee digitaal weergegeven tijdstippen waarbij het uur niet overschreden wordt",
"B-GET-D7": "Een eenvoudige breuk omzetten in een procent, zonder ICT",
"B-GET-D8": "Een breuk van een getal nemen en een bewerking (optellen, aftrekken, vermenigvuldigen, delen) uitvoeren met twee gehele getallen of bedragen",
"B-GET-D9": "Strategieën geven om getallen op te tellen of te vermenigvuldigen met 5",
"B-GET-D10": "Natuurlijke en negatieve getallen, procenten en breuken herkennen",
"B-GET-D11": "Natuurlijke getallen ordenen",
"B-GET-C1": "Een procent en een breuk omzetten in een decimaal getal, zonder ICT",
"B-GET-C2": "Een decimaal getal afronden tot op de eenheid",
"B-GET-C3": "Het verschil berekenen van een digitaal en een analoog weergegeven tijdstip",
"B-GET-C4": "Een bewerking uitvoeren met natuurlijke en decimale getallen",
"B-GET-C5": "Gelijkwaardige breuken herkennen, zonder ICT",
"B-GET-C6": "Strategieën geven om te rekenen met eenvoudige procenten",
"B-GET-C7": "Decimale en negatieve getallen ordenen",
"B-GET-C8": "De uitkomst schatten van bewerkingen met natuurlijke of decimale getallen kleiner dan een miljoen",
"B-GET-C9": "Courante eenheden voor tijd herleiden",
"B-GET-B1": "Een maateenheid associëren met de grootheid volume of met een omtrek",
"B-GET-B2": "Grootteordes van getallen vergelijken",
"B-GET-B3": "De grootteorde bepalen van een massa",
"B-GET-B4": "Een verhouding omzetten in een procent",
"B-GET-B5": "Een getal afronden tot op een tiental, een honderdtal enz",
"B-GET-B6": "Het resultaat van een bewerking zinvol afronden",
"B-GET-B7": "Een aantal uren en minuten bij een tijdstip optellen waarbij het uur overschreden wordt",
"B-GET-B8": "Meerdere bewerkingen uitvoeren met gehele en decimale getallen",
"B-GET-B9": "Een getal vermeerderen of verminderen met een eenvoudig procent",
"B-GET-B10": "Strategieën geven om te vermenigvuldigen met 10, 100, 1000 enz",
"B-GET-B11": "Breuken ordenen",
"B-GET-B12": "De uitkomst schatten van een procent van een natuurlijk getal en van bewerkingen met getallen groter dan een miljoen",
"B-GET-B13": "Courante eenheden voor lengte, inhoud en massa herleiden",
"B-GET-A1": "Meerdere maateenheden geven bij een grootheid",
"B-GET-A2": "Het resultaat van een bewerking afronden tot op een eenheid, een tiental, een honderdtal enz",
"B-GET-A3": "Het resultaat van een bewerking met bedragen afronden tot op 5 eurocent",
"B-GET-A4": "Het verschil van twee analoog weergegeven tijdstippen berekenen",
"B-GET-A5": "Een analoog weergegeven tijdstip omzetten in een digitale weergave",
"B-GET-A6": "Een deel van een geheel weergeven met een breuk",
"B-GET-A7": "Een procent van een getal berekenen en een getal vermeerderen met een procent",
"B-GET-A8": "Strategieën geven om te vermenigvuldigen met 9, 99, 999 enz. en om te delen door 0,1; 0,01; 0,001 enz",
"B-GET-A9": "De uitkomst schatten van een breuk van een getal",
"B-GET-A10": "Het verband geven tussen verandering in een courante eenheid en verandering in een maatgetal bij herleidingen",
"B-GET-A11": "Courante eenheden voor oppervlakte en volume herleiden en voor volume en inhoud herleiden naar elkaar",
"B-MOR-D1": "Een bol herkennen",
"B-MOR-D2": "Nauwkeurig de lengte van een lijnstuk bepalen ook zonder context",
"B-MOR-D3": "Een plaats op een rooster bepalen met een letter-cijfer-coördinatensysteem",
"B-MOR-C1": "Een scherpe, stompe, rechte en gestrekte hoek, een vierkant, een driehoek, een stomphoekige driehoek, een scherphoekige driehoek, een rechthoekige driehoek, een gelijkzijdige driehoek, een gelijkbenige driehoek, een rechthoek, een trapezium, een parallellogram, een ruit, een veelhoek, een cirkel, een balk, een kubus, een cilinder, een kegel en een piramide onderscheiden",
"B-MOR-C2": "Een 2D-voorstelling van een ruimtefiguur herkennen",
"B-MOR-C3": "De grafische voorstelling van een omschrijving van een vlakke figuur herkennen",
"B-MOR-B1": "Vlakke figuren en ruimtefiguren onderscheiden",
"B-MOR-B2": "In een vlak rechte hoeken, loodrechte, snijdende en evenwijdige rechten herkennen",
"B-MOR-B3": "De grootte van een scherpe hoek meten",
"B-MOR-B4": "Nauwkeurig de lengte van een lijnstuk meten waarbij 0 niet op het begin van het lijnstuk ligt",
"B-MOR-B5": "Een rechthoek en een driehoek in de ruimte herkennen aan de hand van een 3D-voorstelling",
"B-MOR-B6": "Een grafische voorstelling van een vlakke figuur met gegeven eigenschappen herkennen of vervolledigen",
"B-MOR-B7": "Meerdere plaatsen op een rooster bepalen met een letter-cijfer-coördinatensysteem",
"B-MOR-A1": "De grootte van een stompe hoek meten",
"B-MOR-A2": "Een hoek tekenen en herkennen of de hoek scherp, recht, stomp of gestrekt is",
"B-MOR-A3": "Evenwijdige, snijdende en kruisende rechten onderscheiden in een ruimtefiguur",
"B-MOR-A4": "Punten in het vlak bepalen door middel van coördinaten en coördinaten van punten bepalen",
"B-OOI-D1": "De formule voor de inhoud van een balk herkennen",
"B-OOI-C1": "De omtrek en de oppervlakte van een driehoek, een rechthoek, een vierkant en een cirkel onderscheiden",
"B-OOI-C2": "De formule voor de omtrek van een rechthoek herkennen",
"B-OOI-C3": "De omtrek van een driehoek berekenen met gegeven figuur ook zonder context",
"B-OOI-C4": "De lengte van de zijde van een driehoek berekenen als de omtrek en 2 zijden gegeven zijn ook zonder context",
"B-OOI-C5": "De oppervlakte van een rechthoek berekenen",
"B-OOI-C6": "De inhoud van een balk berekenen als de lengtes van de ribben gegeven zijn met eenheden ook zonder context",
"B-OOI-B1": "Het onderscheid maken tussen omtrek, oppervlakte en inhoud",
"B-OOI-B2": "De omtrek berekenen van een rechthoek, een driehoek, een vierkant, een cirkel en een figuur bestaande uit meerdere vierkanten",
"B-OOI-B3": "De oppervlakte van een rechthoek berekenen, al dan niet met herleiding van eenheden om te gebruiken in een context",
"B-OOI-B4": "De oppervlakte van een driehoek, een vierkant en een cirkel berekenen met gegeven figuur",
"B-OOI-B5": "De zijde van een vierhoek, een vierkant en een rechthoek berekenen als de omtrek of oppervlakte en de nodige lengtes van zijden gegeven zijn",
"B-OOI-B6": "De inhoud van een balk berekenen als de lengtes van de ribben gegeven zijn zonder eenheden",
"B-OOI-B7": "De lengte van een ribbe van een balk berekenen als de inhoud en de lengtes van 2 ribben gegeven zijn",
"B-OOI-A1": "De oppervlakte van een driehoek, een vierkant en een cirkel berekenen zonder gegeven figuur",
"B-OOI-A2": "De omtrek en de oppervlakte van een samengestelde figuur met rechthoeken of driehoeken berekenen, al dan niet met herleiding van eenheden",
"B-OOI-A3": "De omtrek en de oppervlakte van vlakke figuren berekenen met te veel gegevens, al dan niet met herleiding van eenheden",
"B-OOI-A4": "De zijde van een rechthoek berekenen als de omtrek en een zijde gegeven zijn, met herleiding van eenheden",
"B-OOI-A5": "De hoogte of de omtrek van een driehoek berekenen als de oppervlakte en de nodige zijden gegeven zijn",
"B-OOI-A6": "De straal van een cirkel berekenen uit de omtrek",
"B-OOI-A7": "De inhoud van een balk en een samengestelde ruimtefiguur berekenen, al dan niet met herleiding van eenheden",
"B-STA-D1": "Waarden aflezen uit een frequentietabel, een staafdiagram, een cirkeldiagram en een lijndiagram",
"B-STA-D2": "Uit een frequentietabel het totale aantal gegevens berekenen",
"B-STA-D3": "Een frequentietabel aanvullen uit ruwe data of met gegevens uit een diagram",
"B-STA-D4": "Een staafdiagram of een cirkeldiagram associëren met een gegeven frequentietabel",
"B-STA-C1": "Absolute frequenties uit een staafdiagram of een cirkeldiagram ordenen",
"B-STA-C2": "De hoogte van de staven van een staafdiagram bepalen bij ruwe data",
"B-STA-C3": "Een lijndiagram associëren met een gegeven frequentietabel",
"B-STA-C4": "Een waarde bepalen in een diagram aan de hand van de frequentietabel",
"B-STA-C5": "De werkwijze geven om de mediaan en het rekenkundig gemiddelde te bepalen",
"B-STA-C6": "De mediaan van geordende getallen bepalen",
"B-STA-C7": "Stappen in het uitvoeren van een beschrijvend statistisch onderzoek onderscheiden",
"B-STA-B1": "Absolute frequenties uit een lijndiagram ordenen",
"B-STA-B2": "Een waarde bepalen in een diagram zonder labels op de verticale as aan de hand van de gegevenslabels van andere waarden",
"B-STA-B3": "De hoogte van de staven van een staafdiagram bepalen bij de frequentietabel",
"B-STA-B4": "Uit een diagram het totale aantal gegevens berekenen",
"B-STA-B5": "Waarden interpreteren uit een frequentietabel en er een berekening mee maken",
"B-STA-B6": "Op basis van de verhouding van de cirkelsegmenten in een cirkeldiagram de absolute frequenties bepalen",
"B-STA-B7": "Het rekenkundig gemiddelde bepalen van ruwe data",
"B-STA-B8": "Aangeven welke data minimaal nodig zijn om de mediaan en het rekenkundig gemiddelde te bepalen",
"B-STA-A1": "Waarden interpreteren uit een diagram en er een berekening mee doen",
"B-STA-A2": "Het percentage bepalen dat met een absolute frequentie overeenkomt",
"B-STA-A3": "De mediaan bepalen van niet-geordende getallen of gegevens uit een frequentietabel of uit een diagram",
"B-STA-A4": "Het rekenkundig gemiddelde bepalen van gegevens uit een frequentietabel of uit een diagram",
"B-STA-A5": "Een ontbrekend gegeven bepalen als de mediaan of het rekenkundig gemiddelde gegeven is",
"B-STA-A6": "Een vraagstuk oplossen met elementen van een beschrijvend statistisch onderzoek",
"B-TAD-D1": "Waarden aflezen in een tabel",
"B-TAD-D2": "Waarden aflezen in een staafdiagram",
"B-TAD-D3": "Waarden aflezen in en gegevens interpreteren in een cirkeldiagram met natuurlijke getallen als gegevens",
"B-TAD-D4": "Staafdiagrammen en lijndiagrammen van dezelfde gegevens met elkaar vergelijken",
"B-TAD-C1": "Cirkeldiagrammen en lijndiagrammen van dezelfde dataset met elkaar vergelijken",
"B-TAD-C2": "Waarden aflezen van een diagram met procenten als gegevens",
"B-TAD-C3": "Natuurlijke getallen als gegevens in een tabel aflezen",
"B-TAD-B1": "Staaf-, cirkel- en lijndiagrammen van dezelfde dataset met elkaar vergelijken, al dan niet met te veel gegevens",
"B-TAD-B2": "Een tabel aanvullen",
"B-TAD-B3": "Gegevens in een tabel interpreteren en gebruiken",
"B-TAD-B4": "Gehele getallen als gegevens interpreteren in staafdiagrammen",
"B-TAD-B5": "Gegevens in een lijndiagram interpreteren",
"B-TAD-B6": "Gegevens in een infografiek of organigram gebruiken en analyseren",
"B-TAD-A1": "Voorstellingen van gegevens in lijndiagrammen en tabellen met elkaar vergelijken",
"B-TAD-A2": "Verschillende berekeningen maken met gegevens in een tabel",
"B-TAD-A3": "Gegevens in een lijndiagram analyseren en verwerken",
"B-TAD-A4": "Procenten en decimale getallen als gegevens in een cirkeldiagram en een (dubbel) staafdiagram analyseren en verwerken",
"B-VER-D1": "Rekenen met wiskundige verhoudingen met een eenvoudig natuurlijk getal als factor",
"B-VER-D2": "Een breuk met noemer 100, een procent en een decimaal getal naar elkaar omzetten ook zonder context",
"B-VER-C1": "Rekenen met wiskundige verhoudingen met een natuurlijk getal als factor, al dan niet met een gegeven verhoudingstabel waarbij de gegevens decimale getallen kunnen zijn",
"B-VER-C2": "Een verhouding als een breuk weergeven",
"B-VER-B1": "Rekenen met wiskundige verhoudingen met een rationaal getal als factor, al dan niet met → een gegeven (lege) verhoudingstabel, → te veel gegevens, → herleiding van courante eenheden",
"B-VER-B2": "Gelijkwaardige wiskundige verhoudingen herkennen",
"B-VER-B3": "Een breuk in een procent omzetten en omgekeerd",
"B-VER-B4": "Een procent als een verhouding gebruiken",
"B-VER-A1": "Rekenen met wiskundige verhoudingen met een rationaal getal als factor en met herleiden van minder courante eenheden of met extra berekeningen",
"B-VER-A2": "Een verhouding als procent uitdrukken",
"B-WPO-D1": "Een eenvoudig probleem oplossen met één berekening of constructie, als de gegevens er meteen staan",
"B-WPO-C1": "Een redelijk eenvoudig probleem oplossen met berekeningen, als de gegevens er meteen staan",
"B-WPO-C2": "Overbodige informatie negeren",
"B-WPO-B1": "Een probleem oplossen waarbij je informatie eerst moet afleiden uit de gegevens",
"B-WPO-B2": "Overbodige informatie negeren in een probleem met meerdere stappen",
"B-WPO-A1": "Een complex probleem oplossen waarbij je het verband tussen de gegevens moet gebruiken",
"B-WPO-A2": "Verschillende mogelijkheden uitwerken",
"B-WPO-A3": "Zelf een voorstelling van de situatie maken (schets, tabel of schema)",
"B-WPO-A4": "Overbodige informatie negeren in een complex probleem",
"A-ALG-D1": "De rekenregels (aᵖ)^q = a^(p·q) en (a/b)ᵖ = aᵖ/bᵖ toepassen waarbij de grondtallen één letter zijn",
"A-ALG-D2": "De getalwaarde bepalen van een- en tweetermen in één variabele met natuurlijke getallen als coëfficiënten en als getalwaarde voor de variabelen",
"A-ALG-D3": "De som bepalen van gelijksoortige eentermen",
"A-ALG-D4": "Het toestandsteken bepalen van een product en van een quotiënt van eentermen",
"A-ALG-C1": "De rekenregels aᵖ · a^q = a^(p+q) en 1/aᵖ = a^(−p) toepassen waarbij het grondtal één letter is",
"A-ALG-C2": "De getalwaarde bepalen van een product van twee variabelen",
"A-ALG-C3": "Het verschil van eentermen en het product van een veelterm met een getal bepalen",
"A-ALG-C4": "De regelmaat bepalen in een rij figuren",
"A-ALG-C5": "Een formule herkennen als veralgemening van uitdrukkingen met getallen",
"A-ALG-C6": "Een letter als onbekende of als variabele gebruiken",
"A-ALG-C7": "In lettervormen het neutraal element voor de optelling, de aftrekking, de vermenigvuldiging en de deling, het tegengesteld element voor de optelling en de commutativiteit van de optelling en de vermenigvuldiging geven",
"A-ALG-B1": "De rekenregels aᵖ/a^q = a^(p−q) en (a·b)ᵖ = aᵖ·bᵖ toepassen op lettervormen",
"A-ALG-B2": "De rekenregel aᵖ · a^q = a^(p+q) toepassen waarbij het grondtal een eenterm is",
"A-ALG-B3": "De getalwaarde bepalen van een quotiënt van twee variabelen",
"A-ALG-B4": "Het product van veeltermen herkennen",
"A-ALG-B5": "De som en het verschil van meer dan twee eentermen met één of twee variabelen bepalen",
"A-ALG-B6": "Een formule associëren met een verband tussen twee grootheden",
"A-ALG-B7": "Een formule opstellen als veralgemening van uitdrukkingen met getallen",
"A-ALG-B8": "Het toestandsteken bepalen van de som en van het verschil van eentermen",
"A-ALG-B9": "Een omschrijving noteren als lettervorm",
"A-ALG-B10": "In lettervormen het symmetrisch element en het opslorpend element van de vermenigvuldiging geven",
"A-ALG-A1": "De rekenregels van machten combineren met rekenen met lettervormen",
"A-ALG-A2": "De getalwaarde bepalen van algebraïsche uitdrukkingen in één of twee variabelen met breuken of decimale getallen als coëfficiënten of als getalwaarde voor de variabelen",
"A-ALG-A3": "Het product van eentermen, de som en het verschil van veeltermen met maximaal drie variabelen, het quotiënt van eentermen, het quotiënt van een veelterm en een natuurlijk getal, de macht van een eenterm en wortels van eentermen bepalen en hierbij de volgorde van bewerkingen toepassen",
"A-ALG-A4": "Een formule opstellen bij een patroon omschreven in woorden of gegeven door een verband tussen twee grootheden",
"A-ALG-A5": "Een formule opstellen bij een patroon gegeven door een rij figuren of door lettervormen en er een berekening mee doen",
"A-ALG-A6": "Een omschrijving noteren als lettervorm en er een bewerking mee uitvoeren",
"A-ALG-A7": "De tekenregel voor het tegengestelde van een tweeterm en associativiteit van bewerkingen in lettervormen gebruiken",
"A-ALG-A8": "De absolute waarde van een lettervorm bepalen",
"A-ALG-A9": "De merkwaardige producten (a + b)(a − b) en (a + b)² uitwerken tot een som",
"A-ALG-A10": "De betekenis van een onbekende geven als een vergelijking gegeven is",
"A-GET-D1": "Een maateenheid associëren met de grootheid tijd, lengte, oppervlakte, inhoud of massa",
"A-GET-D2": "Een maateenheid associëren met een maatgetal voor tijd, lengte, oppervlakte, inhoud/volume of massa",
"A-GET-D3": "De grootteorde bepalen van een lengte en een inhoud",
"A-GET-D4": "Zinvol afronden tot op een kwartier, een halfuur en een uur",
"A-GET-D5": "Een bewerking uitvoeren met uren en minuten",
"A-GET-D6": "Een eenvoudige breuk omzetten in een procent en in een decimaal getal, zonder ICT",
"A-GET-D7": "Een breuk van een getal nemen en een bewerking (optellen, aftrekken, vermenigvuldigen, delen) uitvoeren met twee gehele getallen of bedragen, ook zonder ICT",
"A-GET-D8": "Evalueren of van een gegeven getal een vierkantswortel genomen kan worden",
"A-GET-D9": "Strategieën geven om getallen op te tellen of te vermenigvuldigen met 5",
"A-GET-D10": "Het verband geven tussen optellen en aftrekken en tussen vermenigvuldigen en delen",
"A-GET-D11": "Natuurlijke en negatieve getallen, procenten en breuken herkennen",
"A-GET-D12": "De begrippen quotiënt, rest, macht, grondtal, exponent en tegengestelde associëren met hun betekenis",
"A-GET-D13": "Natuurlijke getallen ordenen, een geheel getal op een getallenas plaatsen en de symbolen <, > en = associëren met hun betekenis",
"A-GET-D14": "Strategieën geven om het resultaat van een bewerking te schatten",
"A-GET-C1": "Een procent omzetten in een decimaal getal met maximaal twee cijfers na de komma en omgekeerd, zonder ICT",
"A-GET-C2": "Een decimaal getal afronden tot op de eenheid of tot op een aantal decimalen nauwkeurig",
"A-GET-C3": "De regel geven om af te ronden op de eenheid",
"A-GET-C4": "Een bewerking uitvoeren met gehele en decimale getallen",
"A-GET-C5": "Een natuurlijk getal tot een macht verheffen, zonder ICT",
"A-GET-C6": "Het geheel getal bepalen dat hoort bij een plaats op een getallenas",
"A-GET-C7": "Strategieën geven om te rekenen met procenten",
"A-GET-C8": "De begrippen som, verschil, product, term, factor, deeltal, deler, optelling, aftrekking, vermenigvuldiging en deling associëren met hun betekenis",
"A-GET-C9": "Decimale en negatieve getallen ordenen",
"A-GET-C10": "De symbolen ≤ en ≥ associëren met hun betekenis",
"A-GET-C11": "De uitkomst schatten van bewerkingen met natuurlijke of decimale getallen",
"A-GET-C12": "Courante eenheden voor tijd herleiden",
"A-GET-B1": "Een maateenheid associëren met de grootheid volume of met een omtrek",
"A-GET-B2": "Grootteordes van getallen vergelijken",
"A-GET-B3": "De grootteorde bepalen van een massa",
"A-GET-B4": "Een breuk omzetten in een procent en in een decimaal getal, ook zonder ICT",
"A-GET-B5": "Een getal afronden tot op een tiental, een honderdtal enz",
"A-GET-B6": "Het resultaat van een bewerking zinvol afronden",
"A-GET-B7": "Een combinatie van bewerkingen uitvoeren met uren en minuten",
"A-GET-B8": "Meerdere bewerkingen uitvoeren met gehele en decimale getallen",
"A-GET-B9": "Meerdere bewerkingen met gehele getallen uitvoeren waarin ook vierkantswortels voorkomen, zonder ICT",
"A-GET-B10": "Een breuk delen door een breuk",
"A-GET-B11": "Een getal vermeerderen of verminderen met een eenvoudig procent",
"A-GET-B12": "Bepalen of een getal tot ℕ, ℤ of ℚ behoort",
"A-GET-B13": "Een rationaal getal op een getallenas plaatsen",
"A-GET-B14": "Strategieën geven om te vermenigvuldigen met een macht van 10 of met 9, 99, 999 enz. en om te delen door 0,1; 0,01; 0,001 enz",
"A-GET-B15": "De definitie van een priemgetal geven",
"A-GET-B16": "Breuken ordenen",
"A-GET-B17": "De uitkomst schatten van een procent van een natuurlijk getal en van bewerkingen met getallen groter dan een miljoen",
"A-GET-B18": "Courante eenheden voor lengte, inhoud en massa herleiden",
"A-GET-A1": "Meerdere maateenheden geven bij een grootheid",
"A-GET-A2": "Het resultaat van een bewerking afronden tot op een tiental, een honderdtal enz",
"A-GET-A3": "Het resultaat van een bewerking met bedragen afronden tot op 5 eurocent",
"A-GET-A4": "De regel geven om af te ronden op een aantal cijfers na de komma",
"A-GET-A5": "Een deel van een geheel weergeven met een breuk",
"A-GET-A6": "Een breuk waarbij de teller groter is dan de noemer omzetten in een decimaal getal, zonder ICT",
"A-GET-A7": "Een procent omzetten in een decimaal getal met meer dan twee cijfers na de komma, zonder ICT",
"A-GET-A8": "Een decimaal getal met een repeterend decimaal deel omzetten in een onvereenvoudigbare breuk, zonder ICT",
"A-GET-A9": "Twee breuken optellen, aftrekken en vermenigvuldigen, zonder ICT",
"A-GET-A10": "De eigenschappen en de volgorde van bewerkingen toepassen op rationale getallen waarbij ook machten, vierkantswortels en de absolute waarde voorkomen, zonder ICT",
"A-GET-A11": "Het kleinste gemene veelvoud en de grootste gemene deler van twee getallen berekenen, ook zonder ICT",
"A-GET-A12": "Een procent van een getal berekenen en een getal vermeerderen met een procent",
"A-GET-A13": "De definitie van de absolute waarde geven",
"A-GET-A14": "De teken- en rekenregels van bewerkingen geven",
"A-GET-A15": "Het rationaal getal bepalen dat hoort bij een plaats op een getallenas",
"A-GET-A16": "Priemgetallen herkennen",
"A-GET-A17": "Het begrip omgekeerde koppelen aan de notatie met een macht",
"A-GET-A18": "Getallen ordenen na een berekening",
"A-GET-A19": "De uitkomst schatten van een breuk van een getal",
"A-GET-A20": "Courante eenheden voor oppervlakte en volume herleiden en voor volume en inhoud herleiden naar elkaar",
"A-GET-A21": "Courante eenheden herleiden en combineren met een berekening",
"A-MEI-D1": "Overstaande hoeken herkennen",
"A-MEI-D2": "Een trapezium, een parallellogram, een ruit, een rechthoek en een vierkant door analyse onderscheiden",
"A-MEI-D3": "Het hoekpunt associëren met de notatie BÂC",
"A-MEI-D4": "De grootte van een overeenkomstige hoek bepalen bij twee evenwijdige rechten en een snijlijn",
"A-MEI-D5": "Het symmetriemiddelpunt van een parallellogram, een ruit, een rechthoek en een vierkant bepalen",
"A-MEI-D6": "Het aantal rechten bepalen dat door een of twee punten gaat",
"A-MEI-C1": "De benen van een hoek, aanliggende hoeken, evenwijdige en loodrechte lijnstukken, de straal en het middelpunt van een cirkel herkennen door analyse van een figuur",
"A-MEI-C2": "De definitie geven van een rechte, een halfrechte, een lijnstuk, een driehoek, een gelijkzijdige driehoek, een gelijkbenige driehoek, een vierhoek, een trapezium, een parallellogram, een ruit, een rechthoek, een vierkant, een veelhoek, een cirkel en een nevenhoek",
"A-MEI-C3": "De notatie gebruiken voor een punt, een rechte, een halfrechte, een lijnstuk en de lengte van een lijnstuk",
"A-MEI-C4": "De grootte van een overstaande hoek en van een nevenhoek bepalen",
"A-MEI-C5": "Figuren selecteren die een symmetrieas of een symmetriemiddelpunt hebben",
"A-MEI-C6": "Het aantal gemeenschappelijke punten van rechten bepalen",
"A-MEI-C7": "De hoekensom in een driehoek en in een vierhoek toepassen",
"A-MEI-C8": "Eigenschappen over de hoeken van gelijkzijdige, gelijkbenige, scherphoekige, rechthoekige en stomphoekige driehoeken gebruiken",
"A-MEI-C9": "Bepalen in welke vierhoeken de eigenschappen ‘alle hoeken zijn even groot’ of ‘de diagonalen staan loodrecht op elkaar’ gelden",
"A-MEI-C10": "Congruente driehoeken en de congruentiekenmerken ZZZ, ZHZ, HHZ en ZZ90° herkennen in een figuur of in een omschrijving",
"A-MEI-C11": "Uit een figuur bepalen of een punt, een halfrechte of een lijnstuk een element of een deelverzameling is van een rechte, een halfrechte of een lijnstuk",
"A-MEI-B1": "De definitie geven van een diagonaal, de bissectrice van een hoek en de middelloodlijn van een lijnstuk",
"A-MEI-B2": "Het aantal symmetrieassen van een driehoek en een vierkant bepalen",
"A-MEI-B3": "Bepalen of bijzondere lijnen van driehoeken en vierhoeken symmetrieassen zijn",
"A-MEI-B4": "De onderlinge ligging van twee rechten bepalen als de situatie omschreven is in woorden",
"A-MEI-B5": "Driehoeken en vierhoeken classificeren aan de hand van eigenschappen van hoeken",
"A-MEI-B6": "Verbanden tussen soorten driehoeken en tussen soorten vierhoeken nagaan",
"A-MEI-B7": "De hoekensom in een driehoek combineren met de definitie van nevenhoeken, met eigenschappen van driehoeken of met het oplossen van een eerstegraadsvergelijking",
"A-MEI-B8": "Bepalen in welke vierhoeken deze eigenschappen gelden: ‘elk paar overstaande hoeken is even groot’, ‘elk paar overstaande zijden is even lang’ en ‘de diagonalen snijden elkaar middendoor’ en die eigenschappen toepassen",
"A-MEI-B9": "Een bewijs van congruentie aanvullen met overeenkomstige zijden en overeenkomstige hoeken",
"A-MEI-A1": "De definitie geven van een bissectrice, een hoogtelijn, een middelloodlijn en een zwaartelijn in een driehoek, een symmetrieas en een symmetriemiddelpunt",
"A-MEI-A2": "In een (samengestelde) figuur de grootte van een hoek en de lengte van een lijnstuk bepalen door de hoekensom en door de eigenschappen van drie- en vierhoeken, van bijzondere lijnen en van hoeken bij twee evenwijdige rechten en een snijlijn te gebruiken",
"A-MEI-A3": "Het aantal symmetrieassen van een trapezium, een parallellogram, een ruit, een rechthoek en een cirkel bepalen",
"A-MEI-A4": "Bepalen of het snijpunt van bijzondere lijnen in drie- en vierhoeken een symmetriemiddelpunt is",
"A-MEI-A5": "De onderlinge ligging van twee rechten bepalen als de situatie omschreven is met symbolen",
"A-MEI-A6": "Het snijpunt van twee rechten associëren met de doorsnede van die rechten",
"A-MEI-A7": "Driehoeken en vierhoeken classificeren aan de hand van eigenschappen van zijden en diagonalen, waarbij al dan niet symbolen gebruikt worden (de symbolen zijn in de leeswijzer niet leesbaar, vermoedelijk ∥, ⊥ en ≅)",
"A-MEI-A8": "Bepalen in welke vierhoeken deze eigenschappen gelden: ‘de som van twee opeenvolgende hoeken is 180°’, ‘overstaande zijden zijn evenwijdig’ en ‘de diagonalen zijn even lang’ en die eigenschappen toepassen",
"A-MEI-A9": "Bepalen of een driehoek en zijn beeld door een transformatie congruent zijn",
"A-MEI-A10": "In een (samengestelde) figuur de grootte van een hoek en de lengte van een lijnstuk bepalen aan de hand van een bewijs van congruentie",
"A-MEI-A11": "Een fout in een redenering aanduiden gebruik makend van eigenschappen in drie- en vierhoeken en van congruentie",
"A-MOR-D1": "Een driehoek, een vierhoek, een veelhoek en een bol onderscheiden",
"A-MOR-D2": "Nauwkeurig de lengte van een lijnstuk bepalen",
"A-MOR-D3": "Een plaats op een rooster bepalen met een letter-cijfer-coördinatensysteem",
"A-MOR-C1": "Een stomphoekige driehoek, een scherphoekige driehoek, een rechthoekige driehoek, een gelijkzijdige driehoek, een gelijkbenige driehoek, een vierkant, een cirkel, een balk, een kubus, een cilinder, een piramide en een kegel onderscheiden",
"A-MOR-C2": "Evenwijdige rechten herkennen in een ruimtefiguur",
"A-MOR-C3": "Een 2D-voorstelling van een ruimtefiguur herkennen",
"A-MOR-B1": "Vlakke figuren en ruimtefiguren onderscheiden",
"A-MOR-B2": "In een vlak rechte hoeken, loodrechte en evenwijdige rechten, een halfrechte, een lijnstuk, een straal, een bissectrice, een middelloodlijn, overstaande hoeken en aanliggende hoeken herkennen",
"A-MOR-B3": "De grootte van een scherpe hoek meten",
"A-MOR-B4": "Een rechthoek en een driehoek in de ruimte herkennen aan de hand van een 3D-voorstelling",
"A-MOR-B5": "Het voor-, boven- en zijaanzicht onderscheiden bij een driedimensionale figuur in perspectief en omgekeerd",
"A-MOR-B6": "Een grafische voorstelling van een vlakke figuur met gegeven eigenschappen herkennen, maken of vervolledigen",
"A-MOR-B7": "Meerdere plaatsen op een rooster bepalen met een letter-cijfer-coördinatensysteem",
"A-MOR-A1": "De grootte van een stompe hoek meten",
"A-MOR-A2": "Symmetrie herkennen",
"A-MOR-A3": "Snijdende en kruisende rechten onderscheiden in een ruimtefiguur",
"A-MOR-A4": "Het verband leggen tussen de onderlinge ligging van 2 rechten in de ruimte en hun aantal gemeenschappelijke punten",
"A-MOR-A5": "Zich een voorstelling maken van een aanzicht van een ruimtefiguur",
"A-MOR-A6": "Een zwaartelijn en een hoogtelijn in een driehoek en nevenhoeken herkennen",
"A-MOR-A7": "Scherpe, rechte en stompe hoeken, een vierhoek met gegeven eigenschappen en zijn diagonalen grafisch voorstellen in het vlak",
"A-MOR-A8": "Punten in het vlak bepalen door middel van coördinaten en coördinaten van punten bepalen waarbij de verdeling op de assen al dan niet de eenheid is",
"A-MOR-A9": "Een assenstelsel bepalen aan de hand van de coördinaten van een punt",
"A-OOI-D1": "De straal, het grondvlak, de hoogte, de zijde en de basis onderscheiden bij vlakke figuren en ruimtefiguren",
"A-OOI-D2": "De formule voor de inhoud van een balk herkennen",
"A-OOI-C1": "De omtrek en de oppervlakte van een driehoek, een trapezium, een parallellogram, een ruit, een rechthoek, een vierkant en een cirkel onderscheiden",
"A-OOI-C2": "De formule voor de omtrek van een rechthoek herkennen",
"A-OOI-C3": "De omtrek van een driehoek berekenen met gegeven figuur",
"A-OOI-C4": "De lengte van de zijde van een driehoek berekenen als de omtrek en 2 zijden gegeven zijn",
"A-OOI-C5": "De oppervlakte van een rechthoek berekenen",
"A-OOI-C6": "De inhoud van een balk berekenen als de lengtes van de ribben gegeven zijn met eenheden",
"A-OOI-B1": "Het onderscheid maken tussen omtrek, oppervlakte en inhoud",
"A-OOI-B2": "De omtrek berekenen van een rechthoek, een driehoek, een vierkant, een trapezium, een cirkel en een figuur bestaande uit meerdere vierkanten",
"A-OOI-B3": "De oppervlakte van een rechthoek berekenen, al dan niet met herleiding van eenheden om te gebruiken in een context",
"A-OOI-B4": "De oppervlakte van een driehoek, een vierkant en een cirkel berekenen met gegeven figuur",
"A-OOI-B5": "De zijde van een vierhoek, een vierkant en een rechthoek berekenen als de omtrek of oppervlakte en de nodige lengtes van zijden gegeven zijn",
"A-OOI-B6": "De inhoud van een balk berekenen als de lengtes van de ribben gegeven zijn zonder eenheden",
"A-OOI-B7": "De lengte van een ribbe van een balk berekenen als de inhoud en de lengtes van 2 ribben gegeven zijn",
"A-OOI-B8": "De inhoud van een kubus berekenen",
"A-OOI-B9": "De inhoud van een cilinder berekenen als de oppervlakte van het grondvlak en de hoogte gegeven zijn",
"A-OOI-A1": "De oppervlakte van een driehoek, een vierkant en een cirkel berekenen zonder gegeven figuur",
"A-OOI-A2": "De omtrek en de oppervlakte van een ruit, een parallellogram en een samengestelde figuur met rechthoeken, driehoeken, vierkanten of cirkels berekenen, al dan niet met herleiding van eenheden",
"A-OOI-A3": "De omtrek en de oppervlakte van vlakke figuren berekenen met te veel gegevens, al dan niet met herleiding van eenheden",
"A-OOI-A4": "De zijde van een rechthoek berekenen als de omtrek en een zijde gegeven zijn, met herleiding van eenheden",
"A-OOI-A5": "De hoogte, een zijde en de omtrek van een driehoek berekenen als de oppervlakte en de nodige zijden gegeven zijn",
"A-OOI-A6": "De straal van een cirkel berekenen uit de omtrek of de oppervlakte",
"A-OOI-A7": "De inhoud van een balk, een cilinder en een samengestelde ruimtefiguur berekenen, al dan niet met herleiding van eenheden",
"A-OOI-A8": "De hoogte van een cilinder berekenen uit de inhoud",
"A-OOI-A9": "De oppervlakte van een kubus, een balk en een zijvlak van een balk berekenen",
"A-OOI-A10": "De lengte van een ribbe berekenen als de inhoud en de oppervlakte van een zijvlak van een balk gegeven zijn",
"A-OOI-A11": "De lengte van de ribbe van een kubus berekenen uit de oppervlakte of de inhoud, al dan niet met herleiding van eenheden",
"A-STA-D1": "Een staafdiagram, een cirkeldiagram en een lijndiagram associëren met hun voorstelling",
"A-STA-D2": "Waarden aflezen uit een frequentietabel, een staafdiagram, een cirkeldiagram en een lijndiagram",
"A-STA-D3": "Uit een frequentietabel het totale aantal gegevens berekenen",
"A-STA-D4": "Een frequentietabel aanvullen uit ruwe data of met gegevens uit een diagram",
"A-STA-D5": "Een staafdiagram of een cirkeldiagram associëren met een gegeven frequentietabel",
"A-STA-C1": "Absolute frequenties uit een staafdiagram of een cirkeldiagram ordenen",
"A-STA-C2": "De hoogte van de staven van een staafdiagram bepalen bij ruwe data",
"A-STA-C3": "Een lijndiagram associëren met een gegeven frequentietabel",
"A-STA-C4": "Een waarde bepalen in een diagram aan de hand van de frequentietabel",
"A-STA-C5": "De werkwijze geven om de mediaan en het rekenkundig gemiddelde te bepalen",
"A-STA-C6": "De mediaan van geordende getallen bepalen",
"A-STA-C7": "Stappen in het uitvoeren van een beschrijvend statistisch onderzoek onderscheiden",
"A-STA-C8": "De modus bepalen van gegevens uit een cirkeldiagram",
"A-STA-B1": "Absolute frequenties uit een lijndiagram ordenen",
"A-STA-B2": "Een waarde bepalen in een diagram zonder labels op de verticale as aan de hand van de gegevenslabels van andere waarden",
"A-STA-B3": "De hoogte van de staven van een staafdiagram bepalen bij de frequentietabel",
"A-STA-B4": "Uit een diagram het totale aantal gegevens berekenen",
"A-STA-B5": "Waarden interpreteren uit een frequentietabel en er een berekening mee maken",
"A-STA-B6": "Op basis van de verhouding van de cirkelsegmenten in een cirkeldiagram de absolute frequenties bepalen",
"A-STA-B7": "Het rekenkundig gemiddelde bepalen van ruwe data",
"A-STA-B8": "Aangeven welke data minimaal nodig zijn om de mediaan en het rekenkundig gemiddelde te bepalen",
"A-STA-B9": "De werkwijze geven om de modus en de variatiebreedte te bepalen",
"A-STA-B10": "De modus bepalen van ruwe data en van gegevens uit een frequentietabel",
"A-STA-A1": "Waarden interpreteren uit een diagram en er een berekening mee doen",
"A-STA-A2": "De hoek van een cirkelsegment in een cirkeldiagram bepalen",
"A-STA-A3": "Het percentage bepalen dat met een absolute frequentie overeenkomt",
"A-STA-A4": "De mediaan bepalen van niet-geordende getallen of gegevens uit een frequentietabel of uit een diagram",
"A-STA-A5": "Het rekenkundig gemiddelde bepalen van gegevens uit een frequentietabel of uit een diagram",
"A-STA-A6": "Het rekenkundig gemiddelde bepalen van lettervormen",
"A-STA-A7": "De modus bepalen van gegevens uit een diagram",
"A-STA-A8": "De variatiebreedte bepalen van ruwe data en van gegevens uit een diagram",
"A-STA-A9": "Een ontbrekend gegeven bepalen als de mediaan, het rekenkundig gemiddelde, de variatiebreedte of de modus gegeven is",
"A-STA-A10": "Een vraagstuk oplossen met elementen van een beschrijvend statistisch onderzoek",
"A-TAD-D1": "Waarden aflezen in een tabel",
"A-TAD-D2": "Waarden aflezen in een staafdiagram",
"A-TAD-D3": "Waarden aflezen in en gegevens interpreteren in een cirkeldiagram met natuurlijke getallen als gegevens",
"A-TAD-D4": "Staafdiagrammen en lijndiagrammen van dezelfde gegevens met elkaar vergelijken",
"A-TAD-C1": "Cirkeldiagrammen en lijndiagrammen van dezelfde dataset met elkaar vergelijken",
"A-TAD-C2": "Waarden aflezen van een diagram met procenten als gegevens",
"A-TAD-C3": "Natuurlijke getallen als gegevens in een tabel aflezen",
"A-TAD-B1": "Staaf-, cirkel- en lijndiagrammen van dezelfde dataset met elkaar vergelijken, al dan niet met te veel gegevens",
"A-TAD-B2": "Een tabel aanvullen",
"A-TAD-B3": "Gegevens in een tabel interpreteren en gebruiken",
"A-TAD-B4": "Gehele getallen als gegevens interpreteren in staafdiagrammen",
"A-TAD-B5": "Gegevens in een lijndiagram interpreteren",
"A-TAD-B6": "Gegevens in een infografiek of organigram gebruiken en analyseren",
"A-TAD-A1": "Voorstellingen van gegevens in lijn- en cirkeldiagrammen en tabellen met elkaar vergelijken",
"A-TAD-A2": "Verschillende berekeningen maken met gegevens in een tabel",
"A-TAD-A3": "Gegevens in een lijndiagram analyseren en verwerken",
"A-TAD-A4": "Procenten en decimale getallen als gegevens in een cirkeldiagram en een (dubbel) staafdiagram analyseren en verwerken",
"A-TRA-D1": "Het beeld bepalen van een vlakke figuur door een puntspiegeling, een spiegeling of een verschuiving",
"A-TRA-D2": "In eenvoudige situaties herkennen of een vlakke figuur het beeld is van een andere vlakke figuur door een puntspiegeling, een rotatie, een spiegeling of een verschuiving",
"A-TRA-D3": "Het aantal symmetrieassen van een vlakke figuur bepalen",
"A-TRA-D4": "Het symmetriemiddelpunt en de symmetrieassen van een vlakke figuur bepalen",
"A-TRA-C1": "Eigenschappen van een puntspiegeling, een rotatie, een spiegeling en een verschuiving met betrekking tot het bewaren van evenwijdigheid, hoekgrootte, lengte, collineariteit en loodrechte stand kennen en aanduiden",
"A-TRA-C2": "Eigenschappen van een puntspiegeling, een rotatie, een spiegeling en een verschuiving met betrekking tot symmetrie en congruentie toepassen",
"A-TRA-C3": "Het verband tussen een rotatie, een verschuiving en een puntspiegeling aanduiden",
"A-TRA-C4": "De vector van een verschuiving bepalen bij een vlakke figuur en haar beeld",
"A-TRA-C5": "De omschrijving van een puntspiegeling, een spiegeling en een verschuiving concretiseren",
"A-TRA-B1": "Het beeld creëren van een punt en een vlakke figuur door een puntspiegeling, een spiegeling of een verschuiving op een rooster bestaande uit vierkanten",
"A-TRA-B2": "Het beeld bepalen en creëren van een punt en van een vlakke figuur door een rotatie",
"A-TRA-B3": "De hoek van de rotatie bepalen bij een vlakke figuur en haar beeld",
"A-TRA-B4": "Eigenschappen van een puntspiegeling, een rotatie, een spiegeling en een verschuiving met betrekking tot het bewaren van evenwijdigheid, hoekgrootte, lengte, collineariteit en loodrechte stand gebruiken",
"A-TRA-B5": "De coördinaten bepalen van het beeld van een punt door een puntspiegeling, een spiegeling of een verschuiving",
"A-TRA-B6": "De omschrijving van een rotatie concretiseren",
"A-TRA-A1": "Het beeld creëren van een punt en een vlakke figuur door een puntspiegeling, een rotatie, een spiegeling of een verschuiving op een rooster bestaande uit andere vormen dan vierkanten",
"A-TRA-A2": "In complexe situaties bepalen of een vlakke figuur het beeld is van een andere vlakke figuur door een puntspiegeling, een rotatie, een spiegeling of een verschuiving",
"A-TRA-A3": "De coördinaten van een punt en zijn beeld door een puntspiegeling, een rotatie, een spiegeling of een verschuiving, de coördinaten van het centrum van een puntspiegeling en de coördinaten van het begin- of eindpunt van een vector bij een verschuiving bepalen",
"A-TRA-A4": "Bepalen of een figuur op zichzelf afgebeeld wordt door een puntspiegeling",
"A-VVG-D1": "Rekenen met wiskundige verhoudingen met een eenvoudig natuurlijk getal als factor",
"A-VVG-D2": "De schaal als een verhouding noteren",
"A-VVG-D3": "Een breuk met noemer 100, een procent en een decimaal getal naar elkaar omzetten",
"A-VVG-D4": "Een vergelijking van de vorm x+a=b oplossen met a,b∈N",
"A-VVG-C1": "Rekenen met wiskundige verhoudingen met een natuurlijk getal als factor, al dan niet met een gegeven verhoudingstabel waarbij de gegevens decimale getallen kunnen zijn",
"A-VVG-C2": "De grafiek van een recht evenredig verband herkennen",
"A-VVG-C3": "Een verhouding als een breuk weergeven",
"A-VVG-C4": "Een vergelijking van de vorm a=x+b oplossen met a,b∈N",
"A-VVG-B1": "Rekenen met wiskundige verhoudingen met een rationaal getal als factor, al dan niet met → een gegeven (lege) verhoudingstabel, → te veel gegevens, → herleiding van courante eenheden",
"A-VVG-B2": "Een tabel van een recht of omgekeerd evenredig verband herkennen en vervolledigen",
"A-VVG-B3": "Een formule noteren van een recht evenredig verband met een gegeven evenredigheidsfactor",
"A-VVG-B4": "Een schaal als verhouding gebruiken",
"A-VVG-B5": "Gelijkwaardige wiskundige verhoudingen herkennen",
"A-VVG-B6": "Een breuk in een procent omzetten en omgekeerd",
"A-VVG-B7": "Een procent van een getal berekenen al dan niet met een gegeven teveel",
"A-VVG-B8": "Een vergelijking van de vorm ax=b en ax+b=cx+d met gehele getallen of gelijknamige breuken oplossen of een volgende stap in een oplossingsproces aanduiden",
"A-VVG-B9": "Betekenis geven aan de onbekende in een gegeven eerstegraadsvergelijking",
"A-VVG-B10": "Een eerstegraadsvergelijking in één onbekende koppelen aan een omschrijving",
"A-VVG-A1": "Rekenen met wiskundige verhoudingen met een rationaal getal als factor en met herleiden van minder courante eenheden of met extra berekeningen",
"A-VVG-A2": "Een verhouding als procent uitdrukken",
"A-VVG-A3": "De verschillende representaties (tabel, grafiek en formule) van recht en omgekeerd evenredige verbanden aan elkaar koppelen",
"A-VVG-A4": "Aan een formule herkennen of het al dan niet een recht of omgekeerd evenredig verband is",
"A-VVG-A5": "De constante bepalen van een recht of omgekeerd evenredig verband uit een tabel en uit een grafiek",
"A-VVG-A6": "De formule van een recht of omgekeerd evenredig verband opstellen",
"A-VVG-A7": "Een eerstegraadsvergelijking in één onbekende die haakjes of niet-gelijknamige breuken bevat oplossen en de oplossingsmethode controleren",
"A-VVG-A8": "Een eerstegraadsvergelijking in één onbekende opstellen",
"A-VZM-D1": "Bepalen of een element tot een verzameling behoort als de verzameling gegeven wordt door opsomming of door een venndiagram waarbij elementen buiten de verzameling kunnen voorkomen",
"A-VZM-D2": "In woorden de betekenis van de plaats van een element in een venndiagram omschrijven",
"A-VZM-D3": "De symbolen ∈, ∉, ⊂ en ⊄ associëren met de relaties ‘element van’ en ‘deelverzameling van’ en gebruiken",
"A-VZM-D4": "Bepalen of een verzameling een deelverzameling is van een andere verzameling",
"A-VZM-D5": "De opsomming van een verzameling bepalen als de verzameling omschreven is in woorden",
"A-VZM-C1": "Bepalen of een element tot een verzameling behoort als de verzameling gegeven wordt door een (half)rechte of een lijnstuk",
"A-VZM-C2": "Bepalen of een element tot het verschil van twee verzamelingen behoort als de verzamelingen gegeven worden in woorden of in symbolen",
"A-VZM-C3": "Bepalen of een element tot een deelverzameling van een verzameling behoort",
"A-VZM-C4": "De doorsnede van twee verzamelingen geven door opsomming",
"A-VZM-C5": "De unie van twee verzamelingen geven door opsomming waarbij de doorsnede leeg is",
"A-VZM-C6": "Het verschil van twee verzamelingen in woorden omschrijven als de verzamelingen in woorden gegeven zijn",
"A-VZM-C7": "Aanduiden in welk deel van het venndiagram een element zich bevindt dat behoort tot de doorsnede of het verschil van twee verzamelingen of tot een deelverzameling",
"A-VZM-C8": "Een venndiagram koppelen aan gegeven verzamelingen omschreven in woorden",
"A-VZM-C9": "De symbolen ∩, ∪ en \\ associëren met de operaties doorsnede, unie en verschil en koppelen aan een gegeven venndiagram",
"A-VZM-C10": "Het symbool ⊂ associëren met een deelverzameling van een venndiagram",
"A-VZM-C11": "Het aantal elementen bepalen van de doorsnede van twee verzamelingen gegeven door punten in het vlak",
"A-VZM-B1": "Bepalen of een element tot de doorsnede van twee verzamelingen behoort",
"A-VZM-B2": "Bepalen of een element tot het verschil van twee verzamelingen behoort als de verzamelingen gegeven worden door een venndiagram, door opsomming, door (half)rechten of door lijnstukken",
"A-VZM-B3": "De doorsnede van twee verzamelingen in woorden omschrijven als de verzamelingen in woorden gegeven zijn",
"A-VZM-B4": "De unie of het verschil van twee verzamelingen geven door opsomming waarbij de doorsnede niet leeg is",
"A-VZM-B5": "Een venndiagram koppelen aan een gegeven uitdrukking met de symbolen ∪ en \\",
"A-VZM-B6": "Het symbool ∩ associëren met een venndiagram waarbij de ene verzameling in de andere zit",
"A-VZM-B7": "Een combinatie van de symbolen ∩, ∪ en \\ associëren met een venndiagram met twee of drie verzamelingen",
"A-VZM-B8": "Het aantal elementen bepalen van de doorsnede van twee verzamelingen gegeven door opsomming en van het verschil van twee verzamelingen gegeven door punten in het vlak",
"A-VZM-B9": "Bepalen of een verzameling een deelverzameling is van de doorsnede of het verschil van twee verzamelingen",
"A-VZM-B10": "De symbolen = en ⊂ gebruiken bij gelijke verzamelingen",
"A-VZM-A1": "Bepalen of een element tot de unie van twee verzamelingen behoort",
"A-VZM-A2": "De unie van twee verzamelingen in woorden omschrijven als de verzamelingen in woorden gegeven zijn",
"A-VZM-A3": "De unie of het verschil van twee verzamelingen geven door opsomming waarbij de doorsnede niet leeg is, ook in een wiskundige context",
"A-VZM-A4": "De uitkomst bepalen van operaties op twee verzamelingen gegeven door oppervlaktes",
"A-VZM-A5": "Lege gebieden selecteren in een venndiagram als de relatie tussen de verzamelingen gegeven is",
"A-VZM-A6": "Het aantal elementen bepalen van de doorsnede of het verschil van twee verzamelingen, ook in een wiskundige context",
"A-VZM-A7": "Het aantal elementen bepalen van de unie van twee verzamelingen gegeven door opsomming of door punten in het vlak en van het verschil van twee verzamelingen gegeven door opsomming",
"A-VZM-A8": "Bepalen of een verzameling een deelverzameling is van een andere verzameling, ook in een wiskundige context",
"A-VZM-A9": "Een logische redenering maken met de doorsnede, de unie, het verschil en een deelverzameling van twee verzamelingen en daarbij al dan niet de symbolen ⇒ of ⇔ gebruiken",
"A-VZM-A10": "Een verzameling bepalen als de uitkomst van operaties op die verzameling met een andere verzameling gegeven is",
"A-VZM-A11": "Een vraagstuk oplossen door verzamelingen te gebruiken",
"A-WPO-D1": "Een eenvoudig probleem oplossen met één berekening, constructie of transformatie, als de gegevens er meteen staan",
"A-WPO-C1": "Een redelijk eenvoudig probleem oplossen door bewerkingen te combineren, als de gegevens er meteen staan",
"A-WPO-C2": "Een redenering controleren",
"A-WPO-C3": "Overbodige informatie negeren",
"A-WPO-B1": "Een probleem oplossen waarbij je informatie eerst moet afleiden uit de gegevens",
"A-WPO-B2": "Een besluit (conclusie) van een redenering formuleren",
"A-WPO-B3": "Overbodige informatie negeren in een probleem met meerdere stappen",
"A-WPO-A1": "Een complex probleem oplossen waarbij je het verband tussen de gegevens moet gebruiken",
"A-WPO-A2": "Verschillende mogelijkheden uitwerken en nagaan of ze aan de voorwaarden voldoen",
"A-WPO-A3": "Zelf een voorstelling van de situatie maken (schets, tabel of schema)",
"A-WPO-A4": "Een redenering vervolledigen",
"A-WPO-A5": "Overbodige informatie negeren in een complex probleem"
};
const DOELKOP = {
"B-GET-D": "Een leerling kan meestal met ICT en in een functionele context:",
"B-GET-C": "Een leerling kan meestal ook met ICT en in een functionele context:",
"B-GET-B": "Een leerling kan meestal ook met ICT en in een functionele context:",
"B-GET-A": "Een leerling kan meestal ook met ICT en in een functionele context:",
"B-MOR-D": "Een leerling kan meestal in een context:",
"B-MOR-C": "Een leerling kan meestal ook zowel met als zonder een context:",
"B-MOR-B": "Een leerling kan meestal ook zowel met als zonder een context:",
"B-MOR-A": "Een leerling kan meestal ook zowel met als zonder een context:",
"B-OOI-D": "Een leerling kan meestal met gegeven formularium in een context:",
"B-OOI-C": "Een leerling kan meestal ook met gegeven formularium in een context:",
"B-OOI-B": "Een leerling kan meestal ook met gegeven formularium zowel met als zonder een context:",
"B-OOI-A": "Een leerling kan meestal ook met gegeven formularium zowel met als zonder een context:",
"B-STA-D": "Een leerling kan meestal in een functionele context:",
"B-STA-C": "Een leerling kan meestal ook in een functionele context:",
"B-STA-B": "Een leerling kan meestal ook in een functionele context:",
"B-STA-A": "Een leerling kan meestal ook in een functionele context:",
"B-TAD-D": "Een leerling kan meestal in een context:",
"B-TAD-C": "Een leerling kan meestal ook in een context:",
"B-TAD-B": "Een leerling kan meestal ook in een context:",
"B-TAD-A": "Een leerling kan meestal ook in een context:",
"B-VER-D": "Een leerling kan meestal in een context:",
"B-VER-C": "Een leerling kan meestal ook in een context:",
"B-VER-B": "Een leerling kan meestal ook in een context:",
"B-VER-A": "Een leerling kan meestal ook in een context:",
"B-WPO-D": "Een leerling kan meestal een eenvoudig probleem oplossen door:",
"B-WPO-C": "Een leerling kan meestal ook een redelijk eenvoudig probleem oplossen door:",
"B-WPO-B": "Een leerling kan meestal ook een probleem met beperkte complexiteit oplossen door:",
"B-WPO-A": "Een leerling kan meestal ook een complex probleem oplossen door:",
"A-ALG-D": "Een leerling kan meestal zowel met als zonder context:",
"A-ALG-C": "Een leerling kan meestal ook zowel met als zonder context:",
"A-ALG-B": "Een leerling kan meestal ook zowel met als zonder context:",
"A-ALG-A": "Een leerling kan meestal ook zowel met als zonder context:",
"A-GET-D": "Een leerling kan meestal met ICT en zowel met als zonder context:",
"A-GET-C": "Een leerling kan meestal ook met ICT en zowel met als zonder context:",
"A-GET-B": "Een leerling kan meestal ook met ICT en zowel met als zonder context:",
"A-GET-A": "Een leerling kan meestal ook met ICT en zowel met als zonder context:",
"A-MEI-D": "Een leerling kan meestal in het vlak:",
"A-MEI-C": "Een leerling kan meestal ook in het vlak:",
"A-MEI-B": "Een leerling kan meestal ook in het vlak:",
"A-MEI-A": "Een leerling kan meestal ook in het vlak:",
"A-MOR-D": "Een leerling kan meestal zowel met als zonder een context",
"A-MOR-C": "Een leerling kan meestal ook zowel met als zonder een context",
"A-MOR-B": "Een leerling kan meestal ook zowel met als zonder een context",
"A-MOR-A": "Een leerling kan meestal ook zowel met als zonder een context",
"A-OOI-D": "Een leerling kan meestal zowel met als zonder een context",
"A-OOI-C": "Een leerling kan meestal ook zowel met als zonder een context",
"A-OOI-B": "Een leerling kan meestal ook zowel met als zonder een context",
"A-OOI-A": "Een leerling kan meestal ook zowel met als zonder een context",
"A-STA-D": "Een leerling kan meestal zowel met als zonder context:",
"A-STA-C": "Een leerling kan meestal ook zowel met als zonder context:",
"A-STA-B": "Een leerling kan meestal ook zowel met als zonder context:",
"A-STA-A": "Een leerling kan meestal ook zowel met als zonder context:",
"A-TAD-D": "Een leerling kan meestal in een context",
"A-TAD-C": "Een leerling kan meestal ook in een context",
"A-TAD-B": "Een leerling kan meestal ook in een context",
"A-TAD-A": "Een leerling kan meestal ook in een context",
"A-TRA-D": "Een leerling kan meestal zowel met als zonder context",
"A-TRA-C": "Een leerling kan meestal ook zowel met als zonder context",
"A-TRA-B": "Een leerling kan meestal ook zowel met als zonder context",
"A-TRA-A": "Een leerling kan meestal ook zowel met als zonder context",
"A-VVG-D": "Een leerling kan meestal zowel met als zonder een context",
"A-VVG-C": "Een leerling kan meestal ook zowel met als zonder een context",
"A-VVG-B": "Een leerling kan meestal ook zowel met als zonder een context",
"A-VVG-A": "Een leerling kan meestal ook zowel met als zonder een context",
"A-VZM-D": "Een leerling kan meestal zowel met als zonder context:",
"A-VZM-C": "Een leerling kan meestal ook zowel met als zonder context:",
"A-VZM-B": "Een leerling kan meestal ook zowel met als zonder context:",
"A-VZM-A": "Een leerling kan meestal ook zowel met als zonder context:",
"A-WPO-D": "Een leerling kan meestal een eenvoudig probleem oplossen door",
"A-WPO-C": "Een leerling kan meestal ook een redelijk eenvoudig probleem oplossen door",
"A-WPO-B": "Een leerling kan meestal ook een probleem met beperkte complexiteit oplossen door",
"A-WPO-A": "Een leerling kan meestal ook een complex probleem oplossen door"
};
const CODE_THEMA = {"GET": "get", "MOR": "mor", "OOI": "ooi", "STA": "sta", "TAD": "tad", "VER": "ver", "WPO": "wpo", "ALG": "alg", "MEI": "mei", "TRA": "tra", "VVG": "vvg", "VZM": "vzm"};
/* algemene omschrijvingen van Wiskundige problemen oplossen (gelden voor elke vraag): B-WPO-D2, B-WPO-D3, B-WPO-C3, B-WPO-C4, B-WPO-B3, B-WPO-B4, B-WPO-A5, B-WPO-A6, A-WPO-D2, A-WPO-D3, A-WPO-C4, A-WPO-C5, A-WPO-B4, A-WPO-B5, A-WPO-A6, A-WPO-A7 */
/* ---------- hulp om vragen per doel te schrijven ----------
   T(code, id, maak, extra): sjabloon voor één doel. code 'A-OOI-C3' of {A:'A-OOI-C3', B:'B-OOI-B2'} als dezelfde vraag in beide stromen past.
   maak(R) geeft {q, u, velden | o | mk | jf | sym | venn | cel | rooster+w(+ok) | kaartjes(+vakken)+w, fig, tip, calc, vast}.
   extra: calc ('w' wetenschappelijk, 'e' eenvoudig, false geen), form (formularium tonen), tip.
   Ladders (stap voor stap): LAD(id, thema, naam, maak, stromen) met maak(R) = [{code, q, u, …}, …] van makkelijk naar moeilijk. */
const LADDERS = [];
function T(code, id, maak, x) {
  x = x || {};
  const codes = typeof code === 'string' ? {[code[0]]:code} : code;
  /* rekenmachine volgens de leeswijzer: 'zonder ICT' in het doel = geen rekenmachine, anders de wetenschappelijke */
  /* (2B: 'meestal met ICT' = de eenvoudige rekenmachine; de keuze gebeurt in koppelAf, als de stroom gekend is) */
  VRAGEN.push({id, d:null, lv:[0, 0], gen:maak, t:'gen', tip:x.tip, calc:x.calc, calcAuto:x.calc === undefined, form:x.form, codes});
}
function LAD(id, d, naam, maak, s) { LADDERS.push({id, d, naam, maak, s:s || 'A'}); }

/* meerkeuze: het juiste antwoord eerst, dan de afleiders (dubbels en het juiste antwoord worden eruit gehaald) */
function keuzes(juist, fouten, n) {
  n = n || 4; const uit = [juist];
  fouten.forEach(f => { if (uit.length < n && uit.indexOf(f) < 0) uit.push(f); });
  return uit;
}
/* keuze tussen letters (figuur A, B, …): juiste antwoord eerst in o, maar getoond in alfabetische volgorde */
function letterKeuze(n, i, pre) {
  const L = 'ABCDEF'.slice(0, n).split(''), o = [pre + L[i]].concat(L.filter((x, j) => j !== i).map(x => pre + x));
  return {o, volgorde:L.map(x => o.indexOf(pre + x))};
}
/* vaste volgorde voor gewone keuzes: juiste antwoord eerst in o, getoond in de volgorde van 'lijst' */
function vasteKeuze(juist, lijst) { const o = [juist].concat(lijst.filter(x => x !== juist)); return {o, volgorde:lijst.map(x => o.indexOf(x))}; }
/* invulveld met eenheid */
const veld = (w, na, voor, vorm) => ({w:typeof w === 'number' ? wv(w) : w, na:na || '', voor:voor || '', vorm:vorm || null});
const geld = w => veld(w, '', '€');
/* getal in tekst met komma en spaties */
const g2 = (n, d) => f(n, d == null ? 2 : d);
const minT = n => n < 0 ? '−' + f(-n) : f(n);
const haakN = n => n < 0 ? '(' + minT(n) + ')' : f(n);
/* tijd */
const pad2 = n => String(n).padStart(2, '0');
const tijdT = (u, m) => u + '.' + pad2(m) + ' uur';
const digiT = (u, m) => pad2(u) + ':' + pad2(m);
const duurT = mi => { const u = Math.floor(mi / 60), m = mi % 60; return (u ? u + ' uur' : '') + (u && m ? ' en ' : '') + (m || !u ? m + ' minuten' : ''); };

/* ---------- figuren (SVG) ---------- */
const pt2 = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
const veelhoek = (pts, cls) => '<polygon class="' + (cls || 'fvul') + '" points="' + pts.map(pt2).join(' ') + '"/>';
const lijn = (a, b, cls) => '<line class="' + (cls || 'flijn') + '" x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '"/>';
const tekst = (p, t, anker, extra) => '<text class="ftxt" x="' + p[0].toFixed(1) + '" y="' + p[1].toFixed(1) + '" text-anchor="' + (anker || 'middle') + '"' + (extra || '') + '>' + t + '</text>';
const stip = (p, l, dx, dy) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="var(--inkt)"/>' + (l ? tekst([p[0] + (dx == null ? 8 : dx), p[1] + (dy == null ? -7 : dy)], l, 'middle', ' font-style="italic"') : '');
/* rechte hoek als losse L met even lange benen, een beetje naar binnen (Belgische notatie) */
function rhoek(v, a, b, g, q) {
  g = g || 3; q = q || 10;
  const e = (p) => { const dx = p[0] - v[0], dy = p[1] - v[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const e1 = e(a), e2 = e(b);
  const c = [v[0] + g * (e1[0] + e2[0]), v[1] + g * (e1[1] + e2[1])];
  const p1 = [c[0] + q * e2[0], c[1] + q * e2[1]], p2 = [c[0] + q * e1[0], c[1] + q * e1[1]];
  return '<polyline points="' + [p1, c, p2].map(pt2).join(' ') + '" fill="none" stroke="var(--inkt)" stroke-width="1.6"/>';
}
/* boogje voor een hoek in hoekpunt v van richting a naar richting b (kleinste hoek) */
function boogje(v, a, b, r, kl) {
  r = r || 22;
  const h = p => Math.atan2(p[1] - v[1], p[0] - v[0]);
  let h1 = h(a), h2 = h(b), d = h2 - h1;
  while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const p1 = [v[0] + r * Math.cos(h1), v[1] + r * Math.sin(h1)], p2 = [v[0] + r * Math.cos(h1 + d), v[1] + r * Math.sin(h1 + d)];
  return '<path d="M' + pt2(p1) + ' A' + r + ',' + r + ' 0 0 ' + (d > 0 ? 1 : 0) + ' ' + pt2(p2) + '" fill="none" stroke="' + (kl || '#1fa6ab') + '" stroke-width="2.2"/>';
}
/* plaats voor een label bij een hoek: op de bissectrice */
function hoekLabel(v, a, b, r) {
  const e = p => { const dx = p[0] - v[0], dy = p[1] - v[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const e1 = e(a), e2 = e(b); let m = [e1[0] + e2[0], e1[1] + e2[1]]; const l = Math.hypot(m[0], m[1]) || 1;
  m = [m[0] / l, m[1] / l]; return [v[0] + (r || 36) * m[0], v[1] + (r || 36) * m[1] + 5];
}
/* maat bij een zijde, iets naar buiten geschoven (zijde a-b, buiten = links van a→b als links true) */
function maat(a, b, t, afstand, kant) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), n = [dy / l, -dx / l], s = (kant || 1) * (afstand || 14);
  const m = [(a[0] + b[0]) / 2 + n[0] * s, (a[1] + b[1]) / 2 + n[1] * s + 5];
  return tekst(m, t);
}
const fig = (vb, html, alt, titel) => ({t:'svg', vb, html, alt, titel});
/* een gradenboog op een hoek: hoekpunt (200, 200), benen onder a1 en a2 graden (0 = rechts, tegenwijzerzin) */
const gradenboog = (a1, a2, alt) => ({t:'boog', a1, a2, alt:alt || 'Gradenboog met een rode hoek tussen twee rode benen.'});

/* ---------- lettervormen ---------- */
/* exponent als superscript: SUP(12) = '¹²', SUP(-3) = '⁻³' */
const SUP = n => String(n).split('').map(c => c === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)]).join('');
/* letter met exponent: lt('x', 1) = 'x', lt('x', 3) = 'x³' */
const lt = (l, e) => e === 0 ? '' : e === 1 ? l : l + SUP(e);
/* eenterm: coëfficiënt c met letterdeel l; eerste = true laat een plusteken weg */
function mon(c, l, eerste) {
  if (c === 0) return eerste ? '0' : '';
  const a = Math.abs(c), cs = (a === 1 && l) ? '' : f(a);
  const t = cs + l;
  if (eerste) return (c < 0 ? '−' : '') + t;
  return (c < 0 ? ' − ' : ' + ') + t;
}
/* veelterm uit [[c, l], …] */
const veelt = ts => { let s = '', e = true; ts.forEach(t => { if (t[0] === 0) return; s += mon(t[0], t[1], e); e = false; }); return s || '0'; };

/* ---------- patronen met lucifers (houtjes) ---------- */
/* soort: 'vierkant' (3n + 1), 'driehoek' (2n + 1), 'huis' (5n + 1) ; geeft de lijnstukken van figuur n */
const HOUT = {vierkant:[3, 1], driehoek:[2, 1], huis:[5, 1]};
function houtjes(soort, n, u) {
  u = u || 22; const L = [];
  if (soort === 'vierkant' || soort === 'huis') {
    const y0 = soort === 'huis' ? u * 0.8 : 0;
    for (let i = 0; i < n; i++) { L.push([i * u, y0, (i + 1) * u, y0], [i * u, y0 + u, (i + 1) * u, y0 + u]); if (soort === 'huis') L.push([i * u, y0, (i + .5) * u, 0], [(i + .5) * u, 0, (i + 1) * u, y0]); }
    for (let i = 0; i <= n; i++) L.push([i * u, y0, i * u, y0 + u]);
    return {L, w:n * u, h:y0 + u};
  }
  const h = u * TRI0, v = i => i % 2 ? [(i / 2) * u, 0] : [(i / 2) * u, h];
  for (let i = 0; i <= n; i++) L.push(v(i).concat(v(i + 1)));
  for (let k = 0; k < n; k++) L.push(v(k).concat(v(k + 2)));
  return {L, w:(n + 1) / 2 * u, h};
}
const TRI0 = Math.sqrt(3) / 2;
/* figuren 1 t.e.m. k naast elkaar met een label eronder */
function patroonFig(soort, k) {
  let x = 10, s = ''; const hs = [];
  for (let n = 1; n <= k; n++) {
    const H = houtjes(soort, n); hs.push(H.h);
    H.L.forEach(l => { s += '<line x1="' + (x + l[0]).toFixed(1) + '" y1="' + (12 + l[1]).toFixed(1) + '" x2="' + (x + l[2]).toFixed(1) + '" y2="' + (12 + l[3]).toFixed(1) + '" stroke="#C8372D" stroke-width="3.2" stroke-linecap="round"/>'; });
    s += tekst([x + H.w / 2, 12 + Math.max.apply(null, hs.concat(H.h)) + 24], 'figuur ' + n);
    x += H.w + 34;
  }
  return fig('0 0 ' + Math.round(x - 14) + ' ' + Math.round(12 + Math.max.apply(null, hs) + 34), s, 'Figuur 1 tot en met ' + k + ' van een patroon met lucifers.');
}
/* ---------- koppeling: elke vraag hoort bij één doel per stroom ----------
   Vragen uit de oorspronkelijke databank (11-13) die bij een doel passen, krijgen hier hun code.
   Vragen zonder code voor de stroom van deze site vallen uit de pool. Na het koppelen:
   q.d = thema (onderdeel-id), q.lv = [letter A-stroom, letter B-stroom] (2 = D … 5 = A). */
const KOPPEL = {A:{}, B:{}};
/* rekenmachine voor een gedeeld sjabloon op de 2B-site (bv. 'e' waar 2A geen rekenmachine geeft maar 2B 'met ICT' werkt) */
const CALC_B = {};
/* formulekader voor een gedeeld sjabloon op de 2B-site ('met gegeven formularium') */
const FK_B = {};
function fkB(id, lijst) { FK_B[id] = lijst; }
function calcB(ids, c) { ids.trim().split(/\s+/).forEach(id => { CALC_B[id] = c; }); }
function koppel(stroom, lijst) {
  lijst.trim().split(/\s+/).forEach(x => { const [id, code] = x.split('='); KOPPEL[stroom][id] = code; });
}
function koppelAf() {
  for (let i = VRAGEN.length - 1; i >= 0; i--) {
    const q = VRAGEN[i];
    q.codes = Object.assign({}, q.codes || {});
    ['A', 'B'].forEach(st => { if (KOPPEL[st][q.id]) q.codes[st] = KOPPEL[st][q.id]; });
    const c = q.codes[STROOM];
    if (!c) { VRAGEN.splice(i, 1); continue; }
    const deel = c.split('-');
    q.d = CODE_THEMA[deel[1]];
    q.lv = [0, 0];
    ['A', 'B'].forEach((st, j) => { if (q.codes[st]) q.lv[j] = LIDX[q.codes[st].split('-')[2][0]]; });
    if (q.calcAuto) q.calc = /WPO/.test(c) ? 'e' : /zonder ICT/.test(DOELEN[c] || '') ? false : STROOM === 'B' ? 'e' : 'w';
    if (STROOM === 'B' && q.calc === 'w') q.calc = 'e';
  }
}
/* ---------- Wiskundige problemen oplossen (breedtethema, A-stroom) ----------
   D: één bewerking, gegevens staan er meteen · C: bewerkingen combineren, overbodige informatie, een redenering controleren
   B: informatie afleiden, een besluit formuleren · A: verband tussen gegevens, mogelijkheden uitwerken, eigen voorstelling, redenering vervolledigen */
koppel('A', `
p06=A-WPO-D1 p08=A-WPO-D1 p09=A-WPO-D1 p10=A-WPO-D1 p11=A-WPO-D1 p12=A-WPO-D1 t_groepjes=A-WPO-D1 t_sparen=A-WPO-D1
p18=A-WPO-D1 p20=A-WPO-D1 p48=A-WPO-D1 t_procentdeel=A-WPO-D1 t_recept=A-WPO-D1
p07=A-WPO-C1 p49=A-WPO-C1 t_pm_tafels=A-WPO-C1 t_pm_munten=A-WPO-C1 t_zakken=A-WPO-C1 p13=A-WPO-C1 p14=A-WPO-C1 p15=A-WPO-C1
p16=A-WPO-C1 p19=A-WPO-C1 t_draad=A-WPO-C1 t_pm_kassa=A-WPO-C1 t_pm_plank=A-WPO-C1 p17=A-WPO-C1 n03=A-WPO-C1 t_temp=A-WPO-C1
n04=A-WPO-C1 p26=A-WPO-C1 p36=A-WPO-C1 t_prijs=A-WPO-C1 n06=A-WPO-C1 t_water=A-WPO-C1
p21=A-WPO-C3 mk9=A-WPO-C3
p22=A-WPO-B1 p23=A-WPO-B1 p24=A-WPO-B1 p25=A-WPO-B1 p27=A-WPO-B1 p28=A-WPO-B1 n10=A-WPO-B1 t_boven=A-WPO-B1 n09=A-WPO-B1
t_weken=A-WPO-B1 t_halfweg=A-WPO-B1 n01=A-WPO-B1 n14=A-WPO-B1 t_terug=A-WPO-B1 t_gem=A-WPO-B1 n05=A-WPO-B1 t_rapport=A-WPO-B1
n07=A-WPO-B1 t_korting=A-WPO-B1 n08=A-WPO-B1 p29=A-WPO-B1 p37=A-WPO-B1 t_snelheid=A-WPO-B1 t_schaal=A-WPO-B1 t_kubuszij=A-WPO-B1
t_omtrekopp=A-WPO-B1 t_vierkantplaat=A-WPO-B1 t_breukeet=A-WPO-B1 t_regen=A-WPO-B1 t_drinkbak=A-WPO-B1 p33=A-WPO-B1 p31=A-WPO-B1
t_coordrecht=A-WPO-B1 k8=A-WPO-B1 t_plan=A-WPO-B1 t_taart=A-WPO-B1
p45=A-WPO-B2 p44=A-WPO-B2 t_overbodig=A-WPO-B3
p32=A-WPO-A1 p35=A-WPO-A1 t_verdeel=A-WPO-A1 p38=A-WPO-A1 t_p5_kweker=A-WPO-A1 p39=A-WPO-A1 t_p5_winst=A-WPO-A1 p40=A-WPO-A1
t_p5_rechthoekverh=A-WPO-A1 p41=A-WPO-A1 p43=A-WPO-A1 p47=A-WPO-A1 p51=A-WPO-A1 t_p5_kaars=A-WPO-A1 t_opeen=A-WPO-A1 t_kubusnet=A-WPO-A1 p34=A-WPO-A1
p30=A-WPO-A2 t_abo=A-WPO-A2 p46=A-WPO-A2 p52=A-WPO-A2 n12=A-WPO-A2
p42=A-WPO-A3 t_symkleur=A-WPO-A3
`);

/* C: overbodige informatie negeren (redelijk eenvoudig, gegevens staan er meteen) */
T('A-WPO-C3', 'wpo_c3_bakker', R => {
  const n = R.kies([4, 5, 6]), pr = R.kies([1.2, 1.4, 1.5, 1.8]), stuks = R.int(3, 6) * n, wie = R.naam();
  return {q:`${wie} is 13 jaar en woont 2,5 km van de bakker. ${wie} koopt ${stuks} pistolets voor een verjaardagsfeest van ${R.int(10, 16)} personen. De pistolets worden verkocht per zak van ${n} stuks. Een zak kost ${eur(pr * n)}.\nHoeveel betaalt ${wie}?`,
    velden:[geld(pr * stuks)], calc:'e',
    u:`Overbodig: de leeftijd, de afstand tot de bakker en het aantal personen.\n${stuks} : ${n} = ${stuks / n} zakken.\n${stuks / n} × ${eur(pr * n)} = ${eur(pr * stuks)}.`};
});
T('A-WPO-C3', 'wpo_c3_trein', R => {
  const u = R.int(7, 9), m = R.kies([5, 12, 20, 35]), duur = R.kies([45, 55, 65, 75, 85]), wie = R.naam();
  const tot = u * 60 + m + duur;
  return {q:`${wie} neemt de trein van ${tijdT(u, m)} naar Brugge. Het treinticket kost € 9,40 en de trein heeft 8 rijtuigen. De rit duurt ${duur} minuten.\nHoe laat komt ${wie} aan in Brugge?`,
    velden:[veld(Math.floor(tot / 60) + (tot % 60) / 100, 'uur')], calc:'e',
    u:`Overbodig: de prijs van het ticket en het aantal rijtuigen.\n${tijdT(u, m)} + ${duur} minuten = ${tijdT(Math.floor(tot / 60), tot % 60)}.\nTyp het tijdstip als ${Math.floor(tot / 60)},${pad2(tot % 60)}.`};
});
T('A-WPO-C3', 'wpo_c3_tuin', R => {
  const l = R.int(8, 15), b = R.int(4, 7), p = R.kies([12, 15, 18]);
  return {q:`Een rechthoekige moestuin is ${l} m lang en ${b} m breed. De tuin ligt 30 m van het huis en er staan ${R.int(12, 30)} tomatenplanten in. Rond de tuin komt een houten boordje. Een meter boordje kost € ${p}.\nHoeveel kost het boordje voor de hele tuin?`,
    velden:[geld(2 * (l + b) * p)], calc:'e',
    u:`Overbodig: de afstand tot het huis en het aantal planten.\nOmtrek: 2 · (${l} + ${b}) = ${2 * (l + b)} m.\n${2 * (l + b)} × € ${p} = ${eur(2 * (l + b) * p)}.`};
});

/* C: een redenering controleren */
T('A-WPO-C2', 'wpo_c2_korting', R => {
  const p = R.kies([40, 60, 80, 120, 150]), pc = R.kies([10, 20, 25]), k = p * pc / 100, wie = R.naam(), goed = R.int(0, 1);
  const red = goed ? `${pc} % van ${eur(p)} is ${eur(k)}. ${eur(p)} − ${eur(k)} = ${eur(p - k)}. De jas kost nu ${eur(p - k)}.` : `${pc} % van ${eur(p)} is ${eur(k)}. De jas kost nu dus ${eur(k)}.`;
  return {q:`Een jas kost ${eur(p)}. In de solden krijg je ${pc} % korting.\n${wie} redeneert zo: "${red}"\nKlopt de redenering van ${wie}?`,
    o:goed ? ['Ja, de redenering klopt.', `Nee, de jas kost ${eur(k)}.`, `Nee, de jas kost ${eur(p + k)}.`, `Nee, de korting is ${eur(pc)}.`]
      : [`Nee, ${eur(k)} is de korting. De jas kost ${eur(p - k)}.`, 'Ja, de redenering klopt.', `Nee, de jas kost ${eur(p + k)}.`, `Nee, de korting is ${eur(pc)}.`],
    u:`${pc} % van ${eur(p)} = ${eur(k)}. Dat is de korting.\nDe nieuwe prijs is ${eur(p)} − ${eur(k)} = ${eur(p - k)}.\n${goed ? 'De redenering klopt dus.' : 'De redenering klopt niet: ' + eur(k) + ' is de korting, niet de prijs.'}`};
});
T('A-WPO-C2', 'wpo_c2_gemiddelde', R => {
  const sc = [R.int(9, 18), R.int(9, 18), R.int(9, 18), R.int(9, 18)], som = sc.reduce((a, b) => a + b, 0), wie = R.naam();
  return {q:`${wie} haalde op vier toetsen: ${sc.join(', ')} op 20.\n${wie} berekent zijn gemiddelde zo:\nstap 1: ${sc.join(' + ')} = ${som}\nstap 2: ${som} : 3 = ${f(som / 3, 1)}\nZijn deze stappen juist?`,
    jf:[{t:'stap 1', w:true}, {t:'stap 2', w:false}],
    u:`Stap 1 is juist: de som is ${som}.\nStap 2 is fout: er zijn 4 toetsen, dus je deelt door 4.\n${som} : 4 = ${f(som / 4, 2)}.`};
});
T('A-WPO-C2', 'wpo_c2_omtrek', R => {
  const l = R.int(6, 14), b = R.int(3, 5), wie = R.naam();
  const fout = R.int(0, 1);
  return {q:`Een rechthoekige speelplaats is ${l} m lang en ${b} m breed. Rond de speelplaats komt een lijn van tape.\n${wie} redeneert: "Ik heb ${fout ? l * b : 2 * (l + b)} m tape nodig, want ${fout ? l + ' × ' + b + ' = ' + l * b : '2 · (' + l + ' + ' + b + ') = ' + 2 * (l + b)}."\nKlopt de redenering?`,
    o:fout ? [`Nee, ${l * b} is de oppervlakte. Je hebt ${2 * (l + b)} m tape nodig.`, 'Ja, de redenering klopt.', `Nee, je hebt ${l + b} m tape nodig.`, `Nee, je hebt ${2 * l * b} m tape nodig.`]
      : ['Ja, de redenering klopt.', `Nee, je hebt ${l * b} m tape nodig.`, `Nee, je hebt ${l + b} m tape nodig.`, `Nee, je hebt ${2 * l * b} m tape nodig.`],
    u:`Rond de speelplaats: dat is de omtrek.\nOmtrek = 2 · (${l} + ${b}) = ${2 * (l + b)} m.\n${fout ? l + ' × ' + b + ' = ' + l * b + ' m² is de oppervlakte, dat is niet wat je zoekt.' : 'De redenering klopt.'}`};
});
T('A-WPO-C2', 'wpo_c2_verhouding', R => {
  const p1 = R.kies([4, 6]), p2 = p1 * R.kies([2, 3]) + R.kies([0, p1 / 2]), g = R.kies([150, 200, 300]), juist = g / p1 * p2, wie = R.naam();
  const fout = R.int(0, 1), fw = g + (p2 - p1) * 50;
  return {q:`Voor ${p1} personen heb je ${g} g pasta nodig. ${wie} kookt voor ${p2} personen.\n${wie} redeneert: "${fout ? 'Er komen ' + (p2 - p1) + ' personen bij, dus ik neem ' + (p2 - p1) + ' × 50 g extra: ' + fw + ' g.' : 'Voor 1 persoon is dat ' + f(g / p1) + ' g. Voor ' + p2 + ' personen is dat ' + f(juist) + ' g.'}"\nKlopt de redenering?`,
    o:fout ? [`Nee, voor ${p2} personen heb je ${f(juist)} g nodig.`, 'Ja, de redenering klopt.', `Nee, voor ${p2} personen heb je ${g * p2} g nodig.`, `Nee, voor ${p2} personen heb je ${g + p2} g nodig.`]
      : ['Ja, de redenering klopt.', `Nee, voor ${p2} personen heb je ${fw === juist ? juist + 50 : fw} g nodig.`, `Nee, voor ${p2} personen heb je ${g * p2} g nodig.`, `Nee, voor ${p2} personen heb je ${g + p2} g nodig.`],
    u:`${g} g : ${p1} = ${f(g / p1)} g per persoon.\n${f(g / p1)} g × ${p2} = ${f(juist)} g.\n${fout ? 'De redenering klopt niet: per persoon is het ' + f(g / p1) + ' g, niet 50 g.' : 'De redenering klopt.'}`};
});

/* B: een besluit (conclusie) van een redenering formuleren */
T('A-WPO-B2', 'wpo_b2_snelst', R => {
  const km = R.kies([4, 5, 6, 8]), v = R.kies([12, 15, 16, 20]), fiets = km / v * 60, bus = R.int(10, 20), wacht = R.int(4, 12), wie = R.naam();
  const busT = bus + wacht, besl = Math.abs(fiets - busT) < 1 ? 'gelijk' : fiets < busT ? 'fiets' : 'bus';
  if (besl === 'gelijk' || fiets % 1) return null;
  return {q:`${wie} woont ${km} km van school. Met de fiets rijdt ${wie} gemiddeld ${v} km per uur. Met de bus moet ${wie} ${wacht} minuten wachten en duurt de rit ${bus} minuten.\nWelk besluit is juist?`,
    o:besl === 'fiets' ? keuzes(`Met de fiets is ${wie} ${f(busT - fiets)} minuten sneller op school.`, [`Met de bus is ${wie} ${f(busT - fiets)} minuten sneller op school.`, `Met de bus is ${wie} ${f(Math.abs(bus - fiets))} minuten sneller op school.`, `Met de fiets is ${wie} ${f(Math.abs(bus - fiets))} minuten sneller op school.`, 'Fiets en bus duren even lang.'])
      : keuzes(`Met de bus is ${wie} ${f(fiets - busT)} minuten sneller op school.`, [`Met de fiets is ${wie} ${f(fiets - busT)} minuten sneller op school.`, `Met de fiets is ${wie} ${f(Math.abs(bus - fiets))} minuten sneller op school.`, `Met de bus is ${wie} ${f(Math.abs(bus - fiets))} minuten sneller op school.`, 'Fiets en bus duren even lang.']),
    calc:'e', u:`Fiets: ${km} km aan ${v} km per uur duurt ${km} : ${v} uur = ${f(fiets)} minuten.\nBus: ${wacht} + ${bus} = ${busT} minuten.\nBesluit: ${besl === 'fiets' ? 'de fiets is ' + f(busT - fiets) : 'de bus is ' + f(fiets - busT)} minuten sneller.`};
});
T('A-WPO-B2', 'wpo_b2_gsm', R => {
  const a = R.kies([10, 12, 15]), b = R.kies([0.15, 0.2, 0.25]), c = a + R.kies([5, 8]), min = R.kies([20, 30, 40, 50, 60]), A = a + b * min;
  if (Math.abs(A - c) < 0.01) return null;
  const g = A < c ? 'A' : 'B';
  return {q:`Twee gsm-abonnementen:\nAbonnement A: ${eur(a)} per maand en ${eur(b)} per minuut bellen.\nAbonnement B: ${eur(c)} per maand, bellen inbegrepen.\nLina belt ${min} minuten per maand.\nWelk besluit is juist?`,
    o:[`Voor Lina is abonnement ${g} goedkoper.`, `Voor Lina is abonnement ${g === 'A' ? 'B' : 'A'} goedkoper.`, 'Voor Lina kosten beide abonnementen evenveel.', 'Je kan het niet weten zonder het aantal berichtjes.'],
    calc:'e', u:`Abonnement A: ${eur(a)} + ${min} × ${eur(b)} = ${eur(A)}.\nAbonnement B: ${eur(c)}.\nBesluit: abonnement ${g} is goedkoper.`};
});
T('A-WPO-B2', 'wpo_b2_deelbaar', R => {
  const n = R.kies([12, 18, 24, 30]), v = R.kies([6, 9, 15]);
  const st = [{t:`Elk veelvoud van ${n} is deelbaar door ${n / 2 === Math.floor(n / 2) ? n / 2 : 2}.`, w:true},
    {t:`Elk getal dat deelbaar is door ${n / 2} is ook deelbaar door ${n}.`, w:false}];
  return {q:`Ilias onderzoekt veelvouden. Hij schrijft de veelvouden van ${n} op: ${n}, ${2 * n}, ${3 * n}, ${4 * n}, …\nHij ziet dat ze allemaal even zijn.\nWelke besluiten zijn juist?`,
    jf:st.concat([{t:`Elk veelvoud van ${n} is even.`, w:true}, {t:`Elk even getal is een veelvoud van ${n}.`, w:false}]),
    u:`${n} = 2 · ${n / 2}, dus elk veelvoud van ${n} is ook een veelvoud van ${n / 2} en van 2: het is even.\nOmgekeerd klopt niet: ${n / 2} is deelbaar door ${n / 2} maar niet door ${n}, en 4 is even maar geen veelvoud van ${n}.`};
});

/* B: overbodige informatie in een probleem met meerdere stappen */
T('A-WPO-B3', 'wpo_b3_verf', R => {
  const l = R.kies([4, 5, 6]), h = R.kies([2.5, 3]), lagen = 2, dek = R.kies([8, 10]), pot = R.kies([2.5, 5]);
  const opp = l * h * lagen, liter = opp / dek, potten = Math.ceil(liter / pot - 1e-9);
  return {q:`Een muur is ${f(l)} m lang en ${f(h)} m hoog. De muur krijgt ${lagen} lagen verf. Met 1 liter verf schilder je ${dek} m². De verf is wit, de pot weegt 3 kg en kost € 34,95. De verf zit in potten van ${f(pot)} liter.\nHoeveel potten verf heb je minstens nodig?`,
    velden:[veld(potten, 'potten')], calc:'e',
    u:`Overbodig: de kleur, het gewicht en de prijs van een pot.\nOppervlakte: ${f(l)} × ${f(h)} = ${f(l * h)} m², twee lagen: ${f(opp)} m².\n${f(opp)} : ${dek} = ${f(liter)} liter.\n${f(liter)} : ${f(pot)} = ${f(liter / pot)}, dus minstens ${potten} potten.`};
});

/* A: verschillende mogelijkheden uitwerken en nagaan of ze aan de voorwaarden voldoen (zoals: ggd van een onbekend getal) */
T('A-WPO-A2', 'wpo_a2_ggd', R => {
  const S = R.kies([
    {m:48, g:6, rij:[['4 kan een deler zijn van r.', false], ['9 kan een deler zijn van r.', true], ['r kan oneven zijn.', false], ['r kan 30 zijn.', true]],
      u:'48 = 2 · 2 · 2 · 2 · 3 en ggd(r, 48) = 6 = 2 · 3.\nDus r is deelbaar door 2 en door 3, maar niet door 4 (anders was de ggd minstens 12).\n9 kan wel: ggd(18, 48) = 6. Oneven kan niet. 30 kan: ggd(30, 48) = 6.'},
    {m:36, g:4, rij:[['8 kan een deler zijn van r.', true], ['3 kan een deler zijn van r.', false], ['r kan 20 zijn.', true], ['r kan 12 zijn.', false]],
      u:'36 = 2 · 2 · 3 · 3 en ggd(r, 36) = 4 = 2 · 2.\nr is deelbaar door 4, maar niet door 3 (anders was de ggd minstens 12).\n8 kan: ggd(8, 36) = 4. 20 kan: ggd(20, 36) = 4. 12 kan niet: ggd(12, 36) = 12.'},
    {m:50, g:10, rij:[['25 kan een deler zijn van r.', false], ['4 kan een deler zijn van r.', true], ['r kan 70 zijn.', true], ['r kan 5 zijn.', false]],
      u:'50 = 2 · 5 · 5 en ggd(r, 50) = 10 = 2 · 5.\nr is deelbaar door 10, maar niet door 25 (anders was de ggd 50).\n4 kan: ggd(20, 50) = 10. 70 kan: ggd(70, 50) = 10. 5 kan niet: ggd(5, 50) = 5.'},
    {m:60, g:12, rij:[['5 kan een deler zijn van r.', false], ['8 kan een deler zijn van r.', true], ['r kan 36 zijn.', true], ['r kan 6 zijn.', false]],
      u:'60 = 2 · 2 · 3 · 5 en ggd(r, 60) = 12 = 2 · 2 · 3.\nr is deelbaar door 12, maar niet door 5 (anders was de ggd 60).\n8 kan: ggd(24, 60) = 12. 36 kan: ggd(36, 60) = 12. 6 kan niet: ggd(6, 60) = 6.'}]);
  return {q:`r is een natuurlijk getal met ggd(r, ${S.m}) = ${S.g}.\nZijn de beweringen juist of fout?`, jf:R.schud(S.rij).map(x => ({t:x[0], w:x[1]})), u:S.u};
});
T('A-WPO-A2', 'wpo_a2_munten', R => {
  const bedrag = R.kies([0.6, 0.7, 0.8, 0.9]), c = Math.round(bedrag * 100);
  /* aantal manieren met munten van 10, 20 en 50 cent */
  let n = 0; for (let a = 0; a * 50 <= c; a++) for (let b = 0; a * 50 + b * 20 <= c; b++) if ((c - a * 50 - b * 20) % 10 === 0) n++;
  return {q:`In een automaat kan je enkel betalen met munten van 10 cent, 20 cent en 50 cent. Een drankje kost ${eur(bedrag)}. Je betaalt gepast.\nOp hoeveel verschillende manieren kan je betalen? (De volgorde van de munten speelt geen rol.)`,
    velden:[veld(n, 'manieren')], calc:false,
    u:`Werk systematisch, bijvoorbeeld met een tabel: kies eerst het aantal munten van 50 cent, dan het aantal van 20 cent; de rest vul je aan met munten van 10 cent.\n` +
      [...Array(Math.floor(c / 50) + 1).keys()].map(a => `${a} × 50 cent: ${Math.floor((c - a * 50) / 20) + 1} manieren`).join('\n') + `\nSamen: ${n} manieren.`};
});
T('A-WPO-A2', 'wpo_a2_tickets', R => {
  const k = R.kies([6, 7, 8]), v = R.kies([10, 11, 12]), tot = R.kies([60, 70, 80]);
  const opl = []; for (let a = 0; a * v <= tot; a++) if ((tot - a * v) % k === 0) opl.push([a, (tot - a * v) / k]);
  const nul = opl.filter(o => o[0] > 0 && o[1] > 0);
  if (nul.length !== 1) return null;
  const [a, b] = nul[0];
  return {q:`Een ticket voor de film kost € ${v} voor een volwassene en € ${k} voor een kind. Een groep met volwassenen en kinderen betaalt samen € ${tot}. Er zijn minstens één volwassene en minstens één kind.\nHoeveel kinderen zijn er?`,
    velden:[veld(b, 'kinderen')], calc:'e',
    u:`Probeer het aantal volwassenen één voor één:\n` + [...Array(Math.floor(tot / v) + 1).keys()].slice(1).map(x => `${x} volwassene(n): € ${tot} − € ${x * v} = € ${tot - x * v}` + ((tot - x * v) % k === 0 && tot - x * v > 0 ? ` = ${(tot - x * v) / k} × € ${k} ✓` : ' (geen veelvoud van ' + k + ')')).join('\n') + `\nDus ${a} volwassene(n) en ${b} kinderen.`};
});

/* A: zelf een voorstelling maken (schets, tabel of schema) */
T('A-WPO-A3', 'wpo_a3_kubussen', R => {
  const n = R.kies([2, 3, 4]), a = R.kies([1, 2, 3]), klein = 6 * a * a;
  return {q:`Mahdi heeft ${n * n * n} kleine kubussen. De totale oppervlakte van één kleine kubus is ${klein} cm². Met alle kubussen bouwt hij één grote kubus.\nHoe groot is de totale oppervlakte van de grote kubus?`,
    o:[`${n * n * klein} cm²`, `${n * n * n * klein} cm²`, `${n * klein} cm²`, `${klein * 6} cm²`],
    u:`Maak een schets. ${n * n * n} kubussen = ${n} × ${n} × ${n}: de grote kubus heeft ribben van ${n} kleine kubussen.\nEén zijvlak van een kleine kubus: ${klein} : 6 = ${a * a} cm², dus de ribbe is ${a} cm.\nDe grote kubus heeft een ribbe van ${n * a} cm. Oppervlakte: 6 × ${n * a} × ${n * a} = ${n * n * klein} cm².`};
});
T('A-WPO-A3', 'wpo_a3_handjes', R => {
  const n = R.int(5, 9);
  return {q:`Op een feestje geeft iedereen elke andere persoon precies één keer een hand. Er zijn ${n} personen.\nHoeveel handdrukken worden er gegeven?`,
    velden:[veld(n * (n - 1) / 2, 'handdrukken')], calc:'e',
    u:`Maak een schema of een tabel. De eerste persoon geeft ${n - 1} handen, de tweede nog ${n - 2} nieuwe, enzovoort.\n${[...Array(n - 1).keys()].map(i => n - 1 - i).join(' + ')} = ${n * (n - 1) / 2}.`};
});
T('A-WPO-A3', 'wpo_a3_slak', R => {
  const op = R.kies([3, 4, 5]), af = op - R.kies([1, 2]), put = R.int(9, 16);
  if (af <= 0 || put <= op) return null;
  /* na d dagen: overdag (d-1)·(op-af) + op ≥ put */
  let d = 1; while ((d - 1) * (op - af) + op < put) d++;
  return {q:`Een slak zit onderaan een put van ${put} m diep. Overdag kruipt ze ${op} m omhoog. 's Nachts glijdt ze ${af} m naar beneden.\nOp welke dag komt de slak boven?`,
    velden:[veld(d, '', 'op dag')], calc:false,
    u:`Maak een tabel per dag: na elke dag en nacht komt de slak ${op - af} m hoger.\nMaar op de laatste dag komt ze boven voor ze terugglijdt.\nNa ${d - 1} dagen en nachten zit ze op ${(d - 1) * (op - af)} m. Op dag ${d} kruipt ze tot ${(d - 1) * (op - af) + op} m: ze is boven.`};
});

/* A: een redenering vervolledigen */
T('A-WPO-A4', 'wpo_a4_rechthoek', R => {
  const b = R.int(3, 9), k = R.kies([2, 3, 4]), l = k * b, om = 2 * (l + b);
  return {q:`De omtrek van een rechthoek is ${om} cm. De lengte is ${k} keer zo groot als de breedte.\nLien redeneert:\nstap 1: lengte + breedte = ${om} : 2 = ${om / 2} cm\nstap 2: …\nstap 3: de breedte is ${b} cm en de lengte is ${l} cm.\nWelke stap 2 maakt de redenering volledig?`,
    o:[`lengte + breedte = ${k + 1} keer de breedte, dus de breedte is ${om / 2} : ${k + 1} = ${b} cm`, `de breedte is ${om / 2} : ${k} = ${f(om / 2 / k)} cm`, `de breedte is ${om} : ${2 * k} = ${f(om / 2 / k)} cm`, `de lengte is ${om / 2} − ${k} = ${om / 2 - k} cm`],
    u:`Lengte = ${k} × breedte, dus lengte + breedte = ${k} × breedte + 1 × breedte = ${k + 1} × breedte.\n${k + 1} × breedte = ${om / 2}, dus breedte = ${b} cm en lengte = ${l} cm.`};
});
T('A-WPO-A4', 'wpo_a4_leeftijd', R => {
  const k = R.int(8, 14), mul = 3, j = R.kies([4, 6, 8]);
  const m = mul * k;
  if ((m + j) !== 2 * (k + j) && (m + j) % (k + j)) return null;
  const f2 = (m + j) / (k + j);
  if (f2 % 1) return null;
  return {q:`Een moeder is nu ${mul} keer zo oud als haar zoon. Binnen ${j} jaar is ze ${f2} keer zo oud.\nNoah redeneert:\nstap 1: noem de leeftijd van de zoon x. De moeder is dan ${mul}x.\nstap 2: …\nstap 3: x = ${k}, dus de zoon is ${k} jaar.\nWelke stap 2 maakt de redenering volledig?`,
    o:[`${mul}x + ${j} = ${f2}(x + ${j})`, `${mul}x + ${j} = ${f2}x + ${j}`, `${mul}x = ${f2}(x + ${j})`, `${mul}(x + ${j}) = ${f2}x`],
    u:`Binnen ${j} jaar: de moeder is ${mul}x + ${j}, de zoon x + ${j}.\n${mul}x + ${j} = ${f2}(x + ${j})\n${mul}x + ${j} = ${f2}x + ${f2 * j}\n${mul - f2}x = ${f2 * j - j}, dus x = ${k}.`};
});

/* A: overbodige informatie in een complex probleem */
T('A-WPO-A5', 'wpo_a5_sportdag', R => {
  const lln = R.kies([126, 144, 168, 180]), gr = R.kies([12, 14, 15, 16, 18]).valueOf();
  if (lln % gr) return null;
  const groepen = lln / gr, act = R.kies([4, 6]), rondes = Math.ceil(groepen / act);
  return {q:`Op de sportdag doen ${lln} leerlingen mee uit ${R.int(6, 9)} klassen. De bus kost € ${R.int(300, 500)}. De leerlingen worden verdeeld in groepen van ${gr}. Er zijn ${act} sporten, en per sport kan telkens één groep tegelijk. Elke ronde duurt 40 minuten, ook de lunch duurt 40 minuten.\nHoeveel rondes zijn er minstens nodig opdat elke groep één keer kan sporten?`,
    velden:[veld(rondes, 'rondes')], calc:'e',
    u:`Overbodig: het aantal klassen, de prijs van de bus, de duur van een ronde en van de lunch.\n${lln} : ${gr} = ${groepen} groepen.\nPer ronde kunnen ${act} groepen sporten: ${groepen} : ${act} = ${f(groepen / act)}, dus minstens ${rondes} rondes.`};
});
T('A-WPO-A5', 'wpo_a5_tegels', R => {
  const l = R.kies([4, 5, 6]), b = R.kies([3, 4]), t = R.kies([20, 25, 50]), doos = R.kies([10, 12, 16]);
  const per = (l * 100 / t) * (b * 100 / t), dozen = Math.ceil(per / doos);
  if ((l * 100) % t || (b * 100) % t) return null;
  return {q:`Een rechthoekige badkamer is ${l} m lang, ${b} m breed en 2,6 m hoog. De vloer krijgt vierkante tegels van ${t} cm op ${t} cm. De tegels zitten per ${doos} in een doos. De deur is 90 cm breed.\nHoeveel dozen tegels moet je minstens kopen voor de vloer?`,
    velden:[veld(dozen, 'dozen')], calc:'e',
    u:`Overbodig: de hoogte van de badkamer en de breedte van de deur.\nIn de lengte: ${l * 100} : ${t} = ${l * 100 / t} tegels. In de breedte: ${b * 100} : ${t} = ${b * 100 / t} tegels.\nSamen ${per} tegels. ${per} : ${doos} = ${f(per / doos)}, dus minstens ${dozen} dozen.`};
});
/* ---------- Getallenleer (dieptethema, A-stroom) ----------
   D: grootheden en eenheden, eenvoudige breuken, uren en minuten, begrippen
   C: procent en decimaal getal, afronden, bewerkingen met gehele en decimale getallen, machten, getallenas
   B: breuken omzetten, meerdere bewerkingen, wortels, ℕ ℤ ℚ, priemgetal, eenheden herleiden
   A: repeterende decimalen, breuken zonder ICT, volgorde van bewerkingen, ggd en kgv, procenten, oppervlakte en volume herleiden */
koppel('A', `
g07=A-GET-D6 g14=A-GET-D6 g15=A-GET-D7 t_breukvan=A-GET-D7
g08=A-GET-C4 g13=A-GET-C4 g19=A-GET-C4 t_komma=A-GET-C4 t_negatief=A-GET-C4 t_volgorde=A-GET-C4 t_gb1_geld=A-GET-C4
g11=A-GET-B18 t_omzet=A-GET-B18 t_gb1_afronden=A-GET-B5 g12=A-GET-B8 g35=A-GET-B9 t_wortel=A-GET-B9 f04=A-GET-B10
g20=A-GET-A9 g26=A-GET-A9 f09=A-GET-A9 t_breukplus=A-GET-A9 t_breukmaal=A-GET-A9 g41=A-GET-A9 t_g5_midden=A-GET-A9
g21=A-GET-A10 g29=A-GET-A10 g36=A-GET-A10 f08=A-GET-A10 t_g5_machtmix=A-GET-A10 t_gm_negmacht=A-GET-A10
g18=A-GET-A11 g25=A-GET-A11 t_ggd=A-GET-A11 t_kgv=A-GET-A11 g28=A-GET-A20 t_omzetopp=A-GET-A20 g23=A-GET-A18
`);

/* getallenas: van min tot max, een streepje per stap, een getal per lab; pijlen [{x, l}] boven de as */
function getAs(min, max, stap, lab, pijlen, alt) {
  const L = 24, W = 400, X = v => L + (v - min) / (max - min) * (W - 2 * L), y = 52;
  let s = '<line class="flijn" x1="' + (L - 12) + '" y1="' + y + '" x2="' + (W - L + 14) + '" y2="' + y + '" marker-end="url(#asp)"/>';
  s += '<defs><marker id="asp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--inkt)"/></marker></defs>';
  const n = Math.round((max - min) / stap);
  for (let i = 0; i <= n; i++) {
    const v = +(min + i * stap).toFixed(6), lang = Math.abs(v / lab - Math.round(v / lab)) < 1e-6;
    s += '<line x1="' + X(v).toFixed(1) + '" y1="' + (y - (lang ? 8 : 5)) + '" x2="' + X(v).toFixed(1) + '" y2="' + (y + (lang ? 8 : 5)) + '" stroke="var(--inkt)" stroke-width="' + (lang ? 1.8 : 1) + '"/>';
    if (lang) s += tekst([X(v), y + 26], minT(v));
  }
  (pijlen || []).forEach(p => {
    const x = X(p.x);
    s += '<path d="M' + x.toFixed(1) + ',' + (y - 10) + ' l-6,-10 h12 z" fill="#C8372D"/>' + tekst([x, y - 26], '<tspan font-weight="700">' + p.l + '</tspan>');
  });
  return fig('0 0 400 90', s, alt || 'Getallenas');
}
const MACHT = {2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶'};

/* ===== D ===== */
T('A-GET-D1', 'get_d1_grootheid', R => {
  const p = R.kies([['km²', 'oppervlakte'], ['dl', 'inhoud'], ['mg', 'massa'], ['dm', 'lengte'], ['s', 'tijd'], ['cm²', 'oppervlakte'], ['hl', 'inhoud'], ['t', 'massa'], ['mm', 'lengte'], ['min', 'tijd'], ['ha', 'oppervlakte'], ['cl', 'inhoud']]);
  const alle = ['tijd', 'lengte', 'oppervlakte', 'inhoud', 'massa'];
  return {q:`Je meet iets in ${p[0]}.\nWelke grootheid meet je dan?`, o:keuzes(p[1], R.schud(alle)),
    u:`${p[0]} is een eenheid van ${p[1]}.`};
});
T('A-GET-D2', 'get_d2_eenheid', R => {
  const p = R.kies([['Een volle badkuip bevat ongeveer 150', 'l', ['ml', 'cl', 'm³']], ['Een nieuw potlood is ongeveer 18', 'cm', ['m', 'mm', 'dm']],
    ['Een leerling van het tweede jaar weegt ongeveer 50', 'kg', ['g', 't', 'mg']], ['Een voetbalveld heeft een oppervlakte van ongeveer 7 000', 'm²', ['cm²', 'km²', 'dm²']],
    ['Een lesuur duurt 50', 'min', ['s', 'u', 'dagen']], ['Een blikje frisdrank bevat 33', 'cl', ['l', 'hl', 'ml']],
    ['Een vrachtwagen weegt ongeveer 12', 't', ['kg', 'g', 'mg']], ['De afstand van Gent naar Brussel is ongeveer 55', 'km', ['m', 'hm', 'dm']],
    ['Een theelepel bevat ongeveer 5', 'ml', ['l', 'cl', 'dl']], ['Een A4-blad heeft een oppervlakte van ongeveer 6', 'dm²', ['m²', 'cm²', 'mm²']]]);
  return {q:`${p[0]} …\nWelke eenheid past op de puntjes?`, o:keuzes(p[1], p[2]), u:`${p[0]} ${p[1]}. De andere eenheden geven een veel te groot of veel te klein resultaat.`};
});
T('A-GET-D3', 'get_d3_grootteorde', R => {
  const p = R.kies([['de lengte van een klaslokaal', '8 m', ['80 m', '8 dm', '0,8 km']], ['de hoogte van een deur', '2 m', ['20 m', '2 dm', '20 cm']],
    ['de lengte van een gsm', '15 cm', ['15 mm', '15 dm', '1,5 m']], ['de inhoud van een emmer', '10 l', ['10 ml', '10 cl', '100 l']],
    ['de inhoud van een kopje koffie', '15 cl', ['15 l', '15 ml', '1,5 l']], ['de lengte van een fiets', '1,7 m', ['17 m', '17 cm', '0,17 km']],
    ['de inhoud van een zwembad', '500 m³', ['500 l', '500 dm³', '5 l']], ['de dikte van een euromuntstuk', '2 mm', ['2 cm', '2 dm', '0,2 mm']]]);
  return {q:`Wat is ongeveer ${p[0]}?`, o:keuzes(p[1], p[2]), u:`${p[0][0].toUpperCase() + p[0].slice(1)} is ongeveer ${p[1]}.`};
});
T('A-GET-D4', 'get_d4_afronden', R => {
  const soort = R.kies(['kwartier', 'halfuur', 'uur']), st = {kwartier:15, halfuur:30, uur:60}[soort];
  let mi; do mi = R.int(70, 230); while (mi % st === 0 || Math.abs(mi % st - st / 2) < 2);
  const r = Math.round(mi / st) * st, wat = R.kies(['De film duurt', 'De wandeling duurt', 'De busrit duurt', 'De training duurt']);
  return {q:`${wat} ${duurT(mi)}.\nRond die tijd af op ${soort === 'uur' ? 'het uur' : soort === 'halfuur' ? 'het halfuur' : 'het kwartier'}.`,
    o:keuzes(duurT(r), [duurT(r + st), duurT(r - st), duurT(Math.floor(mi / 10) * 10), duurT(r + 10)]),
    u:`${duurT(mi)} ligt het dichtst bij ${duurT(r)}.`};
});
T('A-GET-D5', 'get_d5_tijd', R => {
  const u = R.int(8, 19), m = R.kies([10, 25, 35, 40, 45, 50]), d = R.int(40, 140), wie = R.naam(), t = u * 60 + m + d;
  const wat = R.kies(['vertrekt met de bus', 'begint aan een wandeling', 'start een film', 'begint te trainen']);
  return {q:`${wie} ${wat} om ${tijdT(u, m)}. Dat duurt ${duurT(d)}.\nHoe laat is ${wie} klaar?`,
    velden:[veld(Math.floor(t / 60), 'uur'), veld(t % 60, 'min')], calc:false,
    u:`${tijdT(u, m)} + ${duurT(d)} = ${tijdT(Math.floor(t / 60), t % 60)}.`};
});
T('A-GET-D6', 'get_d6_breuk', R => {
  const p = R.kies([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 10], [7, 10], [3, 20], [9, 25], [1, 20], [4, 5]]);
  const pc = p[0] / p[1] * 100;
  return {q:`Schrijf {{${p[0]}|${p[1]}}} als een procent en als een decimaal getal.`,
    velden:[veld(pc, '%', `{{${p[0]}|${p[1]}}} =`), veld(pc / 100, '', '=')],
    u:`Maak de noemer 100: {{${p[0]}|${p[1]}}} = {{${f(pc)}|100}} = ${f(pc)} % = ${f(pc / 100, 3)}.`};
});
T('A-GET-D7', 'get_d7_breukvan', R => {
  const n = R.kies([4, 5, 6, 8]), t = R.int(1, n - 1); if (ggd(t, n) > 1) return null;
  const tot = n * R.int(3, 8), dl = tot / n * t, wie = R.naam(), wat = R.kies([['leerlingen in een klas', 'komt met de fiets naar school', 'komen niet met de fiets'], ['bezoekers op een kamp', 'is jonger dan 14 jaar', 'zijn 14 jaar of ouder'], ['spelers in een sportclub', 'speelt al langer dan 3 jaar', 'spelen 3 jaar of korter']]);
  return {q:`Er zijn ${tot} ${wat[0]}. {{${t}|${n}}} ervan ${wat[1]}.\nHoeveel ${wat[0].split(' ')[0]} ${wat[2]}?`,
    velden:[veld(tot - dl)],
    u:`{{${t}|${n}}} van ${tot} = ${tot} : ${n} × ${t} = ${dl}.\n${tot} − ${dl} = ${tot - dl}.`};
});
T('A-GET-D8', 'get_d8_wortel', R => {
  const r = R.schud([{t:'√' + R.kies([16, 25, 36, 49]), w:true}, {t:'√(−' + R.kies([4, 9, 16]) + ')', w:false}, {t:'√0', w:true}, {t:'√' + R.kies([2, 7, 10]), w:true}, {t:'√(−' + R.kies([1, 25, 36]) + ')', w:false}]).slice(0, 4);
  return {q:'Kan je de vierkantswortel nemen van het getal? Kies telkens <b>kan</b> of <b>kan niet</b>.',
    jf:r, kol:['kan', 'kan niet'],
    u:'Van een negatief getal kan je geen vierkantswortel nemen: geen enkel getal in het kwadraat is negatief.\nVan 0 en van elk positief getal kan het wel, ook als het resultaat geen geheel getal is.'};
});
T('A-GET-D9', 'get_d9_maal5', R => {
  const a = R.int(14, 98) * 2;
  return {q:`${R.naam()} wil ${a} × 5 uit het hoofd berekenen.\nWelke werkwijze is juist?`,
    o:keuzes(`${a} × 10 = ${a * 10} en dan : 2`, [`${a} : 10 = ${f(a / 10)} en dan × 2`, `${a} × 10 = ${a * 10} en dan − 5`, `${a} : 2 = ${a / 2} en dan × 5`]),
    u:`× 5 is hetzelfde als × 10 : 2.\n${a} × 10 = ${a * 10} en ${a * 10} : 2 = ${a * 5}.`};
});
T('A-GET-D10', 'get_d10_verband', R => {
  if (R.int(0, 1)) {
    const a = R.int(120, 680), b = R.int(110, 390), s = a + b;
    return {q:`Je weet: ${a} + ${b} = ${s}.\nWelke bewerking is dan ook juist?`,
      o:keuzes(`${s} − ${b} = ${a}`, [`${s} + ${b} = ${a}`, `${a} − ${b} = ${s}`, `${b} − ${s} = ${a}`]), u:`Aftrekken is het omgekeerde van optellen: ${s} − ${b} = ${a}.`};
  }
  const a = R.int(12, 48), b = R.int(6, 19), p = a * b;
  return {q:`Je weet: ${a} × ${b} = ${p}.\nWelke bewerking is dan ook juist?`,
    o:keuzes(`${p} : ${b} = ${a}`, [`${p} × ${b} = ${a}`, `${a} : ${b} = ${p}`, `${b} : ${p} = ${a}`]), u:`Delen is het omgekeerde van vermenigvuldigen: ${p} : ${b} = ${a}.`};
});
T('A-GET-D11', 'get_d11_soorten', R => {
  const soort = R.kies([['negatieve getallen', () => '−' + R.int(2, 40)], ['procenten', () => R.int(2, 95) + ' %'], ['breuken', () => `{{${R.int(1, 5)}|${R.int(6, 9)}}}`]]);
  const pool = {'negatieve getallen':[], procenten:[], breuken:[]};
  const goed = [soort[1](), soort[1]()]; if (goed[0] === goed[1]) return null;
  const fout = R.schud([String(R.int(3, 90)), '−' + R.int(2, 40), R.int(2, 95) + ' %', `{{${R.int(1, 5)}|${R.int(6, 9)}}}`, f(R.int(11, 99) / 10)].filter(x =>
    soort[0] === 'negatieve getallen' ? x[0] !== '−' : soort[0] === 'procenten' ? x.indexOf('%') < 0 : x.indexOf('{{') < 0)).slice(0, 3);
  const o = goed.concat(fout); if (new Set(o).size < 5) return null;
  return {q:`Duid alle ${soort[0]} aan.`, o, mk:[0, 1], u:`De ${soort[0]} zijn ${goed[0]} en ${goed[1]}.`};
});
T('A-GET-D12', 'get_d12_begrippen', R => {
  const g = R.int(2, 9), e = R.int(2, 5), d1 = R.int(30, 90), d2 = R.int(4, 9), qq = Math.floor(d1 / d2), r = d1 % d2; if (!r) return null;
  const p = R.kies([[`In ${g}${MACHT[e]} noem je ${g} het …`, 'grondtal', ['exponent', 'macht', 'product']], [`In ${g}${MACHT[e]} noem je ${e} de …`, 'exponent', ['grondtal', 'macht', 'factor']],
    [`${g}${MACHT[e]} noem je een …`, 'macht', ['exponent', 'grondtal', 'product']], [`${d1} : ${d2} = ${qq} met rest ${r}. Het getal ${qq} noem je het …`, 'quotiënt', ['rest', 'deeltal', 'product']],
    [`${d1} : ${d2} = ${qq} met rest ${r}. Het getal ${r} noem je de …`, 'rest', ['quotiënt', 'deler', 'verschil']], [`Het getal −${g * 3} noem je het … van ${g * 3}.`, 'tegengestelde', ['omgekeerde', 'quotiënt', 'grondtal']]]);
  return {q:p[0] + '\nKies het juiste woord.', o:keuzes(p[1], p[2]), u:`${p[0].replace('…', p[1])}`};
});
T('A-GET-D13', 'get_d13_ordenen', R => {
  let a = R.int(-15, 15), b = R.int(-15, 15); if (a === b && R.int(0, 2)) return null;
  const t = a < b ? '&lt;' : a > b ? '&gt;' : '=';
  return {q:`Welk teken past op de puntjes?\n${minT(a)} … ${minT(b)}`, o:keuzes(t, ['&lt;', '&gt;', '=']), vast:false,
    u:`Op de getallenas ligt ${minT(Math.min(a, b))} links van ${minT(Math.max(a, b))}${a === b ? '. Hier zijn de getallen gelijk' : ''}. Dus ${minT(a)} ${t} ${minT(b)}.`};
});
T('A-GET-D13', 'get_d13_as', R => {
  const x = R.int(-6, 6); if (!x) return null;
  return {q:'Welk getal hoort bij de pijl?', fig:getAs(-8, 8, 1, 2, [{x, l:'P'}], 'Getallenas van −8 tot 8 met een pijl P.'), velden:[veld(x)],
    u:`Tel de streepjes vanaf 0: de pijl staat bij ${minT(x)}.`};
});
T('A-GET-D14', 'get_d14_schatten', R => {
  const a = R.kies([198, 302, 397, 499, 601, 789]), b = R.kies([21, 19, 31, 49, 52]), ra = Math.round(a / 100) * 100, rb = Math.round(b / 10) * 10;
  return {q:`Je wilt ${a} × ${b} schatten.\nWelke schatting is het best?`,
    o:keuzes(`${f(ra)} × ${rb} = ${f(ra * rb)}`, [`${f(ra)} × ${rb * 10} = ${f(ra * rb * 10)}`, `${f(ra / 10)} × ${rb} = ${f(ra * rb / 10)}`, `${f(ra)} + ${rb} = ${f(ra + rb)}`]),
    u:`Rond elk getal af op een makkelijk getal: ${a} ≈ ${f(ra)} en ${b} ≈ ${rb}.\n${f(ra)} × ${rb} = ${f(ra * rb)}.`};
});

/* ===== C ===== */
T('A-GET-C1', 'get_c1_procent', R => {
  const p = R.kies([7, 12, 35, 48, 3, 85, 4.5, 60, 99, 120]);
  if (R.int(0, 1)) return {q:`Schrijf ${f(p)} % als een decimaal getal.`, velden:[veld(p / 100, '', `${f(p)} % =`)], u:`${f(p)} % = ${f(p)} : 100 = ${f(p / 100, 4)}.`};
  return {q:`Schrijf ${f(p / 100, 4)} als een procent.`, velden:[veld(p, '%', `${f(p / 100, 4)} =`)], u:`${f(p / 100, 4)} × 100 = ${f(p)}, dus ${f(p)} %.`};
});
T('A-GET-C2', 'get_c2_afronden', R => {
  const x = R.int(10000, 999999) / 10000, d = R.kies([0, 1, 2]), r = Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
  const wat = d === 0 ? 'de eenheid' : d === 1 ? 'één cijfer na de komma' : 'twee cijfers na de komma';
  return {q:`Rond ${f(x, 4)} af op ${wat}.`, velden:[veld(r)], u:`Kijk naar het cijfer dat volgt. Is het 5 of meer, dan rond je naar boven af.\n${f(x, 4)} ≈ ${f(r, d)}.`};
});
T('A-GET-C3', 'get_c3_regel', R => {
  const x = R.int(10, 99) + R.kies([1, 2, 3, 4, 5, 6, 7, 8, 9]) / 10;
  return {q:`Je rondt ${f(x)} af op de eenheid.\nWelke regel gebruik je?`,
    o:keuzes('Is het eerste cijfer na de komma 5 of meer, dan rond je naar boven af. Anders rond je naar beneden af.',
      ['Is het laatste cijfer van het getal 5 of meer, dan rond je naar boven af.', 'Je laat de cijfers na de komma gewoon weg.', 'Is het eerste cijfer na de komma groter dan 5, dan rond je naar boven af. Bij 5 rond je naar beneden af.']),
    u:`Je kijkt naar het eerste cijfer na de komma. ${f(x)} wordt ${Math.round(x)}.`};
});
T('A-GET-C4', 'get_c4_bewerking', R => {
  const a = R.int(-90, 90) / 10, b = R.int(-60, 60) / 10, op = R.kies(['+', '−', '×']); if (!a || !b) return null;
  const w = op === '+' ? a + b : op === '−' ? a - b : a * b;
  return {q:`Reken uit: ${minT(a)} ${op} ${haakN(b)}`, velden:[veld(w)], calc:false,
    u:`${minT(a)} ${op} ${haakN(b)} = ${minT(+w.toFixed(4))}.` + (op === '×' ? '\nLet op het teken: ' + (a * b > 0 ? 'twee gelijke tekens geven plus.' : 'twee verschillende tekens geven min.') : '')};
});
T('A-GET-C4', 'get_c4_temp', R => {
  const a = R.int(-12, 6), b = R.int(3, 14), wie = R.kies(['In Oslo', 'Op de Mont Blanc', 'In Moskou', 'In Montréal']);
  return {q:`${wie} is het 's morgens ${minT(a)} °C. Tegen de middag stijgt de temperatuur met ${b} °C.\nHoeveel graden is het 's middags?`, velden:[veld(a + b, '°C')],
    u:`${minT(a)} + ${b} = ${minT(a + b)}. Het is ${minT(a + b)} °C.`};
});
T('A-GET-C5', 'get_c5_macht', R => {
  const g = R.int(2, 9), e = g < 4 ? R.int(3, 5) : R.int(2, 3), w = Math.pow(g, e);
  return {q:`Reken uit zonder rekenmachine: ${g}${MACHT[e]}`, velden:[veld(w)],
    u:`${g}${MACHT[e]} = ${Array(e).fill(g).join(' · ')} = ${f(w)}.`};
});
T('A-GET-C6', 'get_c6_as', R => {
  const st = R.kies([1, 2, 5]), x = st * R.int(-7, 7); if (!x || x % (4 * st) === 0) return null;
  return {q:'Welk geheel getal hoort bij de pijl?', fig:getAs(-8 * st, 8 * st, st, 4 * st, [{x, l:'P'}], 'Getallenas met een pijl P.'), velden:[veld(x)],
    u:`Zoek eerst hoeveel één streepje waard is: ${st}. Tel dan vanaf het dichtste getal.\nDe pijl staat bij ${minT(x)}.`};
});
T('A-GET-C7', 'get_c7_strategie', R => {
  const p = R.kies([[15, '10 % berekenen en daar de helft van 10 % bij tellen'], [5, '10 % berekenen en dat delen door 2'], [25, 'het getal delen door 4'], [20, '10 % berekenen en dat verdubbelen'], [50, 'het getal delen door 2'], [1, 'het getal delen door 100']]);
  const n = R.kies([60, 80, 120, 240, 360, 400]);
  return {q:`Je wilt ${p[0]} % van ${n} uit het hoofd berekenen.\nWelke werkwijze is juist?`,
    o:keuzes(p[1], R.schud(['10 % berekenen en dat verdubbelen', 'het getal delen door 4', '10 % berekenen en daar de helft van 10 % bij tellen', 'het getal delen door 2', '10 % berekenen en dat delen door 2', 'het getal delen door 100', 'het getal delen door ' + p[0]])),
    u:`${p[0]} % van ${n}: ${p[1]}. Dat geeft ${f(n * p[0] / 100)}.`};
});
T('A-GET-C8', 'get_c8_begrippen', R => {
  const a = R.int(12, 60), b = R.int(3, 9);
  const p = R.kies([[`${a * b} : ${b} = ${a}. Het getal ${b} noem je de …`, 'deler', ['deeltal', 'quotiënt', 'factor']], [`${a * b} : ${b} = ${a}. Het getal ${a * b} noem je het …`, 'deeltal', ['deler', 'product', 'quotiënt']],
    [`${a} · ${b} = ${a * b}. De getallen ${a} en ${b} noem je …`, 'factoren', ['termen', 'delers', 'producten']], [`${a} + ${b} = ${a + b}. De getallen ${a} en ${b} noem je …`, 'termen', ['factoren', 'sommen', 'delers']],
    [`${a} − ${b} = ${a - b}. Het getal ${a - b} noem je het …`, 'verschil', ['product', 'quotiënt', 'som']], [`${a} · ${b} = ${a * b}. Het getal ${a * b} noem je het …`, 'product', ['som', 'quotiënt', 'factor']],
    [`Bij een … zoek je hoeveel keer een getal in een ander getal past.`, 'deling', ['vermenigvuldiging', 'aftrekking', 'optelling']]]);
  return {q:p[0] + '\nKies het juiste woord.', o:keuzes(p[1], p[2]), u:p[0].replace('…', p[1])};
});
T('A-GET-C9', 'get_c9_ordenen', R => {
  const g = R.schud([R.int(-40, -5) / 10, R.int(-9, -1) / 100 * 10, R.int(1, 40) / 10, R.int(-4, 4), R.int(5, 60) / 100]);
  if (new Set(g).size < 5) return null;
  const s = g.slice().sort((a, b) => a - b);
  return {q:'Zet de getallen in de juiste volgorde, van klein naar groot.', kaartjes:s.map(x => minT(x)),
    u:`Negatieve getallen zijn kleiner dan 0. Hoe verder van 0, hoe kleiner het negatieve getal.\n${s.map(x => minT(x)).join(' &lt; ')}`};
});
T('A-GET-C10', 'get_c10_teken', R => {
  const a = R.int(-6, 6), t = R.kies(['≤', '≥']);
  const kand = R.schud([a - 2, a - 1, a, a + 1, a + 2]).slice(0, 4).sort((x, y) => x - y);
  const goed = kand.map((x, i) => (t === '≤' ? x <= a : x >= a) ? i : -1).filter(i => i >= 0); if (!goed.length || goed.length === 4) return null;
  return {q:`Welke getallen voldoen aan x ${t} ${minT(a)}? Duid alle juiste getallen aan.`, o:kand.map(minT), mk:goed, vast:true,
    u:`${t} betekent "${t === '≤' ? 'kleiner dan of gelijk aan' : 'groter dan of gelijk aan'}". Ook ${minT(a)} zelf voldoet.`};
});
T('A-GET-C11', 'get_c11_schatten', R => {
  const a = R.kies([4.9, 5.1, 9.8, 10.2, 19.7, 20.3, 49.6]), b = R.kies([19.8, 20.1, 30.2, 39.9, 51]), w = Math.round(a) * Math.round(b / 10) * 10;
  const rb = Math.round(b / 10) * 10, ra = Math.round(a);
  return {q:`Ongeveer hoeveel is ${f(a)} × ${f(b)}?`, o:keuzes(f(ra * rb), [f(ra * rb * 10), f(ra * rb / 10), f(ra + rb)]),
    u:`${f(a)} ≈ ${ra} en ${f(b)} ≈ ${rb}. ${ra} × ${rb} = ${f(ra * rb)}.`};
});
T('A-GET-C12', 'get_c12_tijd', R => {
  const p = R.kies([[R.kies([1.5, 2.5, 3.25, 0.75]), 'uur', 'minuten', 60], [R.kies([3, 5, 2.5]), 'dagen', 'uur', 24], [R.kies([240, 450, 90, 330]), 'seconden', 'minuten', 1 / 60], [R.kies([150, 75, 210]), 'minuten', 'uur', 1 / 60], [R.kies([2, 3, 4]), 'weken', 'dagen', 7]]);
  const w = p[0] * p[3];
  return {q:`Zet om: ${f(p[0])} ${p[1]} = … ${p[2]}`, velden:[veld(w, p[2], `${f(p[0])} ${p[1]} =`)],
    u:`${p[3] < 1 ? `${f(p[0])} : ${Math.round(1 / p[3])}` : `${f(p[0])} × ${p[3]}`} = ${f(w)} ${p[2]}.`};
});

/* ===== B ===== */
T('A-GET-B1', 'get_b1_eenheid', R => {
  const p = R.kies([['het volume van een kartonnen doos', 'cm³', ['cm²', 'cm', 'kg']], ['de omtrek van een voetbalveld', 'm', ['m²', 'm³', 'ha']],
    ['het volume van een zwembad', 'm³', ['m²', 'm', 'kg']], ['de omtrek van een fotokader', 'cm', ['cm²', 'cm³', 'l']], ['het volume van een dobbelsteen', 'mm³', ['mm²', 'mm', 'g']]]);
  return {q:`Welke eenheid kan je gebruiken voor ${p[0]}?`, o:keuzes(p[1], p[2]), u:`${p[0].startsWith('het volume') ? 'Een volume meet je in kubieke eenheden zoals ' : 'Een omtrek is een lengte, dus een lengte-eenheid zoals '}${p[1]}.`};
});
T('A-GET-B2', 'get_b2_grootteorde', R => {
  const a = R.int(2, 9), e1 = R.int(2, 4), e2 = e1 + R.int(2, 3), x = a * Math.pow(10, e1), y = a * Math.pow(10, e2), k = Math.pow(10, e2 - e1);
  const ctx = R.kies([['Een dorp telt', 'inwoners. Een stad telt', 'inwoners'], ['Een jeugdclub krijgt een subsidie van', 'euro. Een sportcentrum krijgt', 'euro'], ['Een klein festival lokt', 'bezoekers. Een groot festival lokt', 'bezoekers']]);
  return {q:`${ctx[0]} ${f(x)} ${ctx[1]} ${f(y)} ${ctx[2]}.\nHoeveel keer groter is het tweede getal?`, o:keuzes(f(k), [f(k / 10), f(k * 10), f(e2 - e1)]),
    u:`${f(y)} : ${f(x)} = ${f(k)}.`};
});
T('A-GET-B3', 'get_b3_massa', R => {
  const p = R.kies([['een appel', '150 g', ['15 g', '1,5 kg', '15 kg']], ['een volle schooltas', '6 kg', ['60 kg', '600 g', '60 g']], ['een auto', '1 200 kg', ['120 kg', '12 t', '12 kg']],
    ['een A4-blad papier', '5 g', ['50 g', '500 g', '0,5 kg']], ['een pak suiker', '1 kg', ['10 kg', '100 g', '10 g']], ['een olifant', '5 t', ['500 kg', '50 t', '50 kg']]]);
  return {q:`Hoeveel weegt ${p[0]} ongeveer?`, o:keuzes(p[1], p[2]), u:`${p[0][0].toUpperCase() + p[0].slice(1)} weegt ongeveer ${p[1]}.`};
});
T('A-GET-B4', 'get_b4_breuk', R => {
  const p = R.kies([[3, 8], [5, 8], [1, 8], [7, 8], [7, 20], [11, 25], [13, 50], [3, 40], [9, 40], [7, 4], [6, 5], [1, 16]]);
  const d = p[0] / p[1];
  return {q:`Schrijf {{${p[0]}|${p[1]}}} als een decimaal getal en als een procent.`, velden:[veld(d, '', `{{${p[0]}|${p[1]}}} =`), veld(d * 100, '%', '=')],
    u:`{{${p[0]}|${p[1]}}} = ${p[0]} : ${p[1]} = ${f(d, 4)}.\n${f(d, 4)} = ${f(d * 100, 2)} %.`};
});
T('A-GET-B5', 'get_b5_afronden', R => {
  const x = R.int(10000, 999999), p = R.kies([[10, 'het tiental'], [100, 'het honderdtal'], [1000, 'het duizendtal'], [10000, 'het tienduizendtal']]);
  const r = Math.round(x / p[0]) * p[0];
  return {q:`Rond ${f(x)} af op ${p[1]}.`, velden:[veld(r)], u:`Kijk naar het eerste cijfer rechts van de plaats waarop je afrondt. Is het 5 of meer, dan rond je naar boven af.\n${f(x)} ≈ ${f(r)}.`};
});
T('A-GET-B6', 'get_b6_zinvol', R => {
  if (R.int(0, 1)) {
    const n = R.int(41, 97), pl = R.kies([8, 9, 12, 15]); if (n % pl === 0) return null;
    return {q:`${n} leerlingen gaan op uitstap. In elk busje zijn ${pl} plaatsen.\nHoeveel busjes zijn er minstens nodig?`, velden:[veld(Math.ceil(n / pl), 'busjes')],
      u:`${n} : ${pl} = ${f(n / pl, 2)}. Je kan geen deel van een busje nemen. Er moeten ook plaatsen zijn voor de laatste leerlingen, dus rond je naar boven af: ${Math.ceil(n / pl)} busjes.`};
  }
  const b = R.kies([50, 75, 100, 120]), p = R.kies([7, 8.5, 9, 11, 13]), wie = R.naam(); if (Number.isInteger(b / p)) return null;
  return {q:`Een ticket voor het zwembad kost ${eur(p)}. ${wie} heeft ${eur(b)}.\nHoeveel tickets kan ${wie} hoogstens kopen?`, velden:[veld(Math.floor(b / p), 'tickets')],
    u:`${f(b)} : ${f(p)} = ${f(b / p, 2)}. Voor het volgende ticket is er niet genoeg geld, dus je rondt naar beneden af: ${Math.floor(b / p)} tickets.`};
});
T('A-GET-B7', 'get_b7_tijd', R => {
  const u = R.int(8, 9), m = R.kies([15, 20, 25, 30]), n = R.int(3, 4), les = 50, p = R.kies([10, 15, 20]), eind = u * 60 + m + n * les + p;
  return {q:`De lessen beginnen om ${tijdT(u, m)}. Er zijn ${n} lesuren van ${les} minuten na elkaar. Tussen het tweede en het derde lesuur is er een pauze van ${p} minuten.\nHoe laat is het ${n === 3 ? 'derde' : 'vierde'} lesuur gedaan?`,
    velden:[veld(Math.floor(eind / 60), 'uur'), veld(eind % 60, 'min')], calc:false,
    u:`${n} × ${les} = ${n * les} minuten les en ${p} minuten pauze: samen ${n * les + p} minuten = ${duurT(n * les + p)}.\n${tijdT(u, m)} + ${duurT(n * les + p)} = ${tijdT(Math.floor(eind / 60), eind % 60)}.`};
});
T('A-GET-B8', 'get_b8_bewerkingen', R => {
  const a = R.int(2, 9) / 2, b = R.int(-6, -2), c = R.int(2, 9), d = R.kies([0.5, 0.2, 0.4, 0.25]), e = c * d * R.int(1, 4);
  const w = a * b + e / d;
  return {q:`Reken uit: ${f(a)} · (${minT(b)}) + ${f(e)} : ${f(d)}`, velden:[veld(w)], calc:false,
    u:`Eerst vermenigvuldigen en delen, dan optellen.\n${f(a)} · (${minT(b)}) = ${minT(a * b)} en ${f(e)} : ${f(d)} = ${f(e / d)}.\n${minT(a * b)} + ${f(e / d)} = ${minT(w)}.`};
});
T('A-GET-B9', 'get_b9_wortel', R => {
  const a = R.int(2, 12), b = R.int(2, 10), c = R.int(2, 5), d = R.int(1, 9);
  const w = a - c * b + d;
  return {q:`Reken uit zonder rekenmachine: √${a * a} − ${c} · √${b * b} + ${d}`, velden:[veld(w)],
    u:`√${a * a} = ${a} en √${b * b} = ${b}.\n${a} − ${c} · ${b} + ${d} = ${a} − ${c * b} + ${d} = ${minT(w)}.`};
});
T('A-GET-B10', 'get_b10_deling', R => {
  const a = R.int(1, 7), b = R.int(2, 9), c = R.int(1, 7), d = R.int(2, 9); if (a >= b || c >= d || ggd(a, b) > 1 || ggd(c, d) > 1) return null;
  const t = a * d, n = b * c, k = ggd(t, n);
  return {q:`Reken uit: {{${a}|${b}}} : {{${c}|${d}}}\nSchrijf je antwoord als een vereenvoudigde breuk of als een geheel getal.`, velden:[n / k === 1 ? veld(t / k) : veld((t / k) + '/' + (n / k), '', '', 'breuk')],
    u:`Delen door een breuk is vermenigvuldigen met het omgekeerde: {{${a}|${b}}} · {{${d}|${c}}} = {{${t}|${n}}}${k > 1 ? ' = ' + breuk(t, n) : ''}.`};
});
T('A-GET-B11', 'get_b11_procent', R => {
  const p = R.kies([40, 60, 80, 120, 150, 250, 300]), pc = R.kies([10, 20, 25, 50, 5]), op = R.int(0, 1);
  const w = op ? p * (1 + pc / 100) : p * (1 - pc / 100);
  return {q:op ? `Een abonnement kost ${eur(p)}. Volgend jaar stijgt de prijs met ${pc} %.\nWat is de nieuwe prijs?` : `Een paar schoenen kost ${eur(p)}. In de solden gaat de prijs ${pc} % omlaag.\nWat is de nieuwe prijs?`,
    velden:[geld(w)], u:`${pc} % van ${eur(p)} = ${eur(p * pc / 100)}.\n${eur(p)} ${op ? '+' : '−'} ${eur(p * pc / 100)} = ${eur(w)}.`};
});
T('A-GET-B12', 'get_b12_verz', R => {
  const br = () => R.kies(['1|5', '2|7', '3|8', '4|9', '1|6', '3|5']), kand = R.schud([[String(R.int(2, 40)), 'ℕ'], ['−' + R.int(2, 40), 'ℤ'], [`{{${br()}}}`, 'ℚ'], [f(R.int(11, 99) / 10), 'ℚ'], [`−{{${br()}}}`, 'ℚ'], ['0', 'ℕ']]).slice(0, 4);
  const v = R.kies(['ℕ', 'ℤ']);
  const rang = {ℕ:0, ℤ:1, ℚ:2};
  return {q:`Behoort het getal tot ${v}? Kies telkens <b>ja</b> of <b>nee</b>.`, jf:kand.map(k => ({t:k[0], w:rang[k[1]] <= rang[v]})), kol:['ja', 'nee'],
    u:`ℕ: de natuurlijke getallen 0, 1, 2, 3, …\nℤ: de gehele getallen, ook de negatieve.\nℚ: alle getallen die je als breuk kan schrijven, ook kommagetallen.\n` + kand.map(k => `${k[0]}: kleinste verzameling ${k[1]}`).join('\n')};
});
T('A-GET-B13', 'get_b13_as', R => {
  const kand = R.schud([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5, -2, 1, 2]).slice(0, 4).sort((a, b) => a - b), L = ['A', 'B', 'C', 'D'];
  const i = R.int(0, 3), x = kand[i], txt = Number.isInteger(x) ? minT(x) : R.int(0, 1) ? minT(x) : (x < 0 ? '−' : '') + `{{${Math.abs(x * 2)}|2}}`;
  return {q:`Welk punt hoort bij het getal ${txt}?`, fig:getAs(-3, 3, 0.5, 1, kand.map((v, j) => ({x:v, l:L[j]})), 'Getallenas van −3 tot 3 met de punten A, B, C en D.'),
    ...letterKeuze(4, i, 'punt '), u:(Number.isInteger(x) ? '' : `${txt} = ${minT(x)}. `) + `Dat getal ligt bij punt ${L[i]}.`};
});
T('A-GET-B14', 'get_b14_strategie', R => {
  const a = R.int(13, 87), p = R.kies([[99, `${a} × 100 − ${a}`, [`${a} × 100 − 1`, `${a} × 100 + ${a}`, `${a} × 10 − ${a}`]], [9, `${a} × 10 − ${a}`, [`${a} × 10 − 1`, `${a} × 10 + ${a}`, `${a} × 100 − ${a}`]],
    [999, `${a} × 1 000 − ${a}`, [`${a} × 1 000 − 1`, `${a} × 100 − ${a}`, `${a} × 1 000 + ${a}`]], ['0,1', `${a} × 10`, [`${a} : 10`, `${a} × 0,1`, `${a} × 100`], ':'], ['0,01', `${a} × 100`, [`${a} : 100`, `${a} × 10`, `${a} × 0,01`], ':']]);
  return {q:`Hoe bereken je ${a} ${p[3] || '×'} ${p[0]} handig?`, o:keuzes(p[1], p[2]),
    u:p[3] ? `Delen door ${p[0]} is hetzelfde als vermenigvuldigen met ${p[0] === '0,1' ? 10 : 100}: ${p[1]} = ${f(a * (p[0] === '0,1' ? 10 : 100))}.` : `${p[0]} = ${p[0] + 1} − 1, dus ${a} × ${p[0]} = ${p[1]} = ${f(a * p[0])}.`};
});
T('A-GET-B15', 'get_b15_priem', R => ({q:'Wat is een priemgetal?', o:keuzes('Een natuurlijk getal dat precies twee delers heeft: 1 en zichzelf.',
  ['Een getal dat alleen deelbaar is door zichzelf.', 'Een oneven getal dat niet deelbaar is door 3.', 'Een natuurlijk getal dat geen delers heeft.']),
  u:'Een priemgetal heeft precies twee delers: 1 en het getal zelf. Daarom is 1 geen priemgetal (maar één deler) en 2 wel.'}));
T('A-GET-B16', 'get_b16_breuken', R => {
  const kand = []; while (kand.length < 4) { const n = R.int(3, 12), t = R.int(1, n - 1), w = t / n; if (ggd(t, n) === 1 && !kand.some(k => Math.abs(k[2] - w) < 0.02)) kand.push([t, n, w]); }
  const s = kand.slice().sort((a, b) => a[2] - b[2]);
  return {q:'Zet de breuken in de juiste volgorde, van klein naar groot.', kaartjes:s.map(k => `{{${k[0]}|${k[1]}}}`),
    u:'Maak de breuken gelijknamig of reken ze om naar een decimaal getal.\n' + s.map(k => `{{${k[0]}|${k[1]}}} ≈ ${f(k[2], 3)}`).join(' &lt; ')};
});
T('A-GET-B17', 'get_b17_schatten', R => {
  if (R.int(0, 1)) {
    const pc = R.kies([19, 21, 24, 49, 11, 9]), n = R.kies([3980, 4012, 6020, 7995, 1990]), rp = Math.round(pc / 5) * 5, rn = Math.round(n / 1000) * 1000;
    return {q:`Ongeveer hoeveel is ${pc} % van ${f(n)}?`, o:keuzes(f(rp * rn / 100), [f(rp * rn / 10), f(rp * rn / 1000), f(rn - rp)]),
      u:`${pc} % ≈ ${rp} % en ${f(n)} ≈ ${f(rn)}. ${rp} % van ${f(rn)} = ${f(rp * rn / 100)}.`, calc:false};
  }
  const a = R.int(21, 89) * 100000 + R.int(1000, 99999), b = R.int(2, 9), ra = Math.round(a / 1e6) * 1e6;
  return {q:`Ongeveer hoeveel is ${f(a)} × ${b}?`, o:keuzes(f(ra * b), [f(ra * b * 10), f(ra * b / 10), f(ra + b)]), u:`${f(a)} ≈ ${f(ra)}. ${f(ra)} × ${b} = ${f(ra * b)}.`, calc:false};
});
T('A-GET-B18', 'get_b18_herleiden', R => {
  const p = R.kies([[R.kies([3.4, 0.75, 12.5]), 'km', 'm', 1000], [R.kies([250, 75, 1250]), 'ml', 'l', 0.001], [R.kies([1.2, 0.35, 2.05]), 't', 'kg', 1000],
    [R.kies([45, 8, 130]), 'mm', 'dm', 0.01], [R.kies([3.5, 0.6, 12]), 'hl', 'l', 100], [R.kies([850, 75, 3200]), 'g', 'kg', 0.001], [R.kies([2.3, 0.45]), 'dl', 'cl', 10]]);
  const w = +(p[0] * p[3]).toFixed(6);
  return {q:`Zet om: ${f(p[0])} ${p[1]} = … ${p[2]}`, velden:[veld(w, p[2], `${f(p[0])} ${p[1]} =`)], calc:false,
    u:`${p[3] >= 1 ? `1 ${p[1]} = ${f(p[3])} ${p[2]}, dus × ${f(p[3])}` : `1 ${p[2]} = ${f(1 / p[3])} ${p[1]}, dus : ${f(1 / p[3])}`}.\n${f(p[0])} ${p[1]} = ${f(w, 4)} ${p[2]}.`};
});

/* ===== A ===== */
T('A-GET-A1', 'get_a1_eenheden', R => {
  const p = R.kies([['inhoud', ['l', 'dm³', 'cl', 'ml'], ['m²', 'kg', 'cm']], ['massa', ['kg', 'g', 't', 'mg'], ['l', 'm³', 'cm']], ['oppervlakte', ['m²', 'ha', 'cm²', 'km²'], ['m³', 'm', 'l']], ['tijd', ['s', 'min', 'u', 'dag'], ['m', 'mg', 'ml']]]);
  const goed = R.schud(p[1]).slice(0, R.int(2, 3)), fout = R.schud(p[2]).slice(0, 5 - goed.length), o = R.schud(goed.concat(fout));
  return {q:`Welke eenheden kan je gebruiken voor ${p[0]}? Duid alle juiste eenheden aan.`, o, mk:goed.map(g => o.indexOf(g)), vast:true,
    u:`Eenheden voor ${p[0]}: ${p[1].join(', ')}.`};
});
T('A-GET-A2', 'get_a2_afronden', R => {
  const a = R.int(23, 89), b = R.int(23, 89), p = R.kies([[10, 'het tiental'], [100, 'het honderdtal']]), w = a * b, r = Math.round(w / p[0]) * p[0]; if (w % p[0] === 0) return null;
  return {q:`Bereken ${a} × ${b} en rond het resultaat af op ${p[1]}.`, velden:[veld(r)],
    u:`${a} × ${b} = ${f(w)}. Afgerond op ${p[1]}: ${f(r)}.\nRond pas af na de berekening, niet de getallen vooraf.`};
});
T('A-GET-A3', 'get_a3_5cent', R => {
  const pr = [R.int(100, 900), R.int(100, 900), R.int(50, 400)], s = pr.reduce((a, b) => a + b, 0), l = s % 10; if (l === 0 || l === 5) return null;
  const r = l <= 2 ? s - l : l <= 7 ? s - l + 5 : s - l + 10;
  return {q:`Aan de kassa betaal je cash voor: ${pr.map(p => eur(p / 100)).join(', ')}.\nHet totaal wordt afgerond op 5 eurocent. Hoeveel betaal je?`, velden:[geld(r / 100)],
    u:`Totaal: ${eur(s / 100)}.\nAfronden op 5 cent: eindigt het bedrag op 1 of 2 cent, dan naar 0; op 3, 4, 6 of 7 cent naar 5; op 8 of 9 cent naar de volgende 10.\n${eur(s / 100)} wordt ${eur(r / 100)}.`};
});
T('A-GET-A4', 'get_a4_regel', R => {
  const x = R.int(1000, 9999) / 1000, d = R.int(1, 2);
  return {q:`Je rondt ${f(x, 3)} af op ${d === 1 ? 'één cijfer' : 'twee cijfers'} na de komma.\nWelke regel gebruik je?`,
    o:keuzes(`Kijk naar het ${d === 1 ? 'tweede' : 'derde'} cijfer na de komma. Is het 5 of meer, dan verhoog je het ${d === 1 ? 'eerste' : 'tweede'} cijfer na de komma met 1.`,
      [`Kijk naar het ${d === 1 ? 'eerste' : 'tweede'} cijfer na de komma. Is het 5 of meer, dan verhoog je het met 1.`, `Kijk naar het laatste cijfer. Is het 5 of meer, dan verhoog je het ${d === 1 ? 'eerste' : 'tweede'} cijfer na de komma met 1.`, 'Je schrapt de cijfers die te veel zijn. Je verandert niets aan de andere cijfers.']),
    u:`Je kijkt naar het eerste cijfer dat wegvalt. ${f(x, 3)} ≈ ${f(Math.round(x * Math.pow(10, d)) / Math.pow(10, d), d)}.`};
});
T('A-GET-A5', 'get_a5_deel', R => {
  const k = R.int(3, 6), r = R.int(2, 4), n = k * r, g = R.int(1, n - 1), dl = ggd(g, n); if (dl === 1 && R.int(0, 2)) return null;
  const cel = R.schud([...Array(n).keys()]).slice(0, g);
  let s = ''; for (let i = 0; i < n; i++) { const x = 10 + (i % k) * 40, y = 10 + Math.floor(i / k) * 40; s += `<rect x="${x}" y="${y}" width="40" height="40" fill="${cel.indexOf(i) >= 0 ? 'var(--k2)' : 'var(--wit)'}" stroke="var(--inkt)" stroke-width="1.5"/>`; }
  return {q:'Welk deel van de rechthoek is gekleurd?\nSchrijf je antwoord als een vereenvoudigde breuk.', fig:fig(`0 0 ${20 + k * 40} ${20 + r * 40}`, s, `Rechthoek van ${n} gelijke vakjes, waarvan ${g} gekleurd.`),
    velden:[veld(breuk(g, n).replace(/\{\{(\d+)\|(\d+)\}\}/, '$1/$2'), '', '', 'breuk')],
    u:`${g} van de ${n} vakjes zijn gekleurd: {{${g}|${n}}}${dl > 1 ? ' = ' + breuk(g, n) : ''}.`};
});
T('A-GET-A6', 'get_a6_breuk', R => {
  const n = R.kies([4, 5, 8, 20, 25]), t = R.int(n + 1, 4 * n); if (ggd(t, n) > 1) return null;
  return {q:`Schrijf {{${t}|${n}}} als een decimaal getal, zonder rekenmachine.`, velden:[veld(t / n, '', `{{${t}|${n}}} =`)],
    u:`{{${t}|${n}}} = ${Math.floor(t / n)} + {{${t % n}|${n}}}.\n{{${t % n}|${n}}} = ${f((t % n) / n, 4)}, dus {{${t}|${n}}} = ${f(t / n, 4)}.`};
});
T('A-GET-A7', 'get_a7_procent', R => {
  const p = R.kies([12.5, 0.4, 7.25, 0.05, 33.3, 2.75, 105.5, 0.8]);
  return {q:`Schrijf ${f(p, 2)} % als een decimaal getal, zonder rekenmachine.`, velden:[veld(+(p / 100).toFixed(6), '', `${f(p, 2)} % =`)],
    u:`Delen door 100: schuif de komma twee plaatsen naar links.\n${f(p, 2)} % = ${f(p / 100, 6)}.`};
});
T('A-GET-A8', 'get_a8_repeterend', R => {
  const p = R.kies([[1, 3, '0,333…'], [2, 3, '0,666…'], [1, 9, '0,111…'], [5, 9, '0,555…'], [5, 11, '0,454545…'], [4, 33, '0,121212…'], [5, 3, '1,666…'], [7, 9, '0,777…'], [2, 11, '0,181818…'], [4, 3, '1,333…']]);
  return {q:`Schrijf ${p[2]} als een onvereenvoudigbare breuk, zonder rekenmachine.\nDe puntjes betekenen dat de cijfers zich blijven herhalen.`, velden:[veld(p[0] + '/' + p[1], '', '', 'breuk')],
    u:`${p[2]} = {{${p[0]}|${p[1]}}}. Controle: ${p[0]} : ${p[1]} = ${p[2]}.\nTip: 0,111… = {{1|9}} en 0,0101… = {{1|99}}.`};
});
T('A-GET-A9', 'get_a9_breuken', R => {
  const a = R.int(1, 7), b = R.int(2, 9), c = R.int(1, 7), d = R.int(2, 9); if (ggd(a, b) > 1 || ggd(c, d) > 1 || b === d) return null;
  const op = R.kies(['+', '−', '·']);
  let t = op === '+' ? a * d + c * b : op === '−' ? a * d - c * b : a * c, n = op === '·' ? b * d : b * d; if (t <= 0) return null;
  const k = ggd(t, n), tt = t / k, nn = n / k; if (nn === 1) return null;
  return {q:`Reken uit zonder rekenmachine: {{${a}|${b}}} ${op} {{${c}|${d}}}\nSchrijf je antwoord als een vereenvoudigde breuk.`, velden:[veld(tt + '/' + nn, '', '', 'breuk')],
    u:op === '·' ? `Teller maal teller en noemer maal noemer: {{${a * c}|${b * d}}}${k > 1 ? ' = {{' + tt + '|' + nn + '}}' : ''}.` : `Maak de breuken gelijknamig: {{${a * d}|${b * d}}} ${op} {{${c * b}|${b * d}}} = {{${t}|${n}}}${k > 1 ? ' = {{' + tt + '|' + nn + '}}' : ''}.`};
});
T('A-GET-A10', 'get_a10_volgorde', R => {
  const a = R.int(2, 9), b = R.int(2, 4), c = R.int(2, 5), d = R.kies([4, 9, 16, 25, 36, 49]);
  const w = Math.abs(-a) - c * Math.pow(-b, 2) + Math.sqrt(d);
  return {q:`Reken uit zonder rekenmachine: |−${a}| − ${c} · (−${b})² + √${d}`, velden:[veld(w)],
    u:`Volgorde: eerst machten, wortels en absolute waarde, dan vermenigvuldigen, dan optellen en aftrekken.\n|−${a}| = ${a}, (−${b})² = ${b * b}, √${d} = ${Math.sqrt(d)}.\n${a} − ${c} · ${b * b} + ${Math.sqrt(d)} = ${a} − ${c * b * b} + ${Math.sqrt(d)} = ${minT(w)}.`};
});
T('A-GET-A11', 'get_a11_kgv', R => {
  const a = R.kies([12, 15, 18, 20, 24]), b = R.kies([8, 10, 16, 30, 36]); if (a === b) return null;
  const k = a * b / ggd(a, b), u = R.int(9, 10);
  return {q:`Op een kermis knippert een rode lamp om de ${a} seconden en een groene lamp om de ${b} seconden. Om ${u}.00 uur knipperen ze samen.\nNa hoeveel seconden knipperen ze voor het eerst opnieuw samen?`, velden:[veld(k, 's')],
    u:`Je zoekt het kleinste gemeenschappelijke veelvoud van ${a} en ${b}.\nkgv(${a}, ${b}) = ${k}. Na ${k} seconden knipperen ze opnieuw samen.`};
});
T('A-GET-A11', 'get_a11_ggd', R => {
  const g = R.kies([6, 8, 12, 15]), a = g * R.int(2, 7), b = g * R.int(2, 7), wie = R.naam(); if (a === b || ggd(a, b) !== g) return null;
  return {q:`${wie} maakt snoepzakjes met ${a} zuurtjes en ${b} chocolaatjes. Elk zakje moet precies hetzelfde bevatten en er mag niets overblijven.\nHoeveel zakjes kan ${wie} zo maximaal maken?`, velden:[veld(g, 'zakjes')],
    u:`Je zoekt de grootste gemeenschappelijke deler van ${a} en ${b}.\nggd(${a}, ${b}) = ${g}. Elk zakje bevat dan ${a / g} zuurtjes en ${b / g} chocolaatjes.`};
});
T('A-GET-A12', 'get_a12_btw', R => {
  const w = R.kies([['een fietshelm', 21, 30, 90], ['een boek', 6, 12, 35], ['een gsm', 21, 150, 450], ['een paar sportschoenen', 21, 60, 140], ['een strip', 6, 8, 18]]);
  const p = R.int(w[2], w[3]), pc = w[1];
  return {q:`${w[0][0].toUpperCase() + w[0].slice(1)} kost ${eur(p)} zonder btw. Daar komt ${pc} % btw bij.\nHoeveel kost het met btw?`, velden:[geld(Math.round(p * (100 + pc)) / 100)],
    u:`${pc} % van ${eur(p)} = ${eur(p * pc / 100)}.\n${eur(p)} + ${eur(p * pc / 100)} = ${eur(p * (100 + pc) / 100)}.\nOf sneller: ${eur(p)} × ${f(1 + pc / 100)} = ${eur(p * (100 + pc) / 100)}.`};
});
T('A-GET-A13', 'get_a13_absoluut', R => ({q:'Wat is de absolute waarde van een getal?', o:keuzes('De afstand van dat getal tot 0 op de getallenas.',
  ['Het tegengestelde van dat getal.', 'Het getal zonder de cijfers na de komma.', 'Het omgekeerde van dat getal.']),
  u:`De absolute waarde is de afstand tot 0. Daarom is ze nooit negatief: |−${R.int(2, 9)}| en |${R.int(2, 9)}| zijn allebei positief.`}));
T('A-GET-A14', 'get_a14_regels', R => {
  const r = R.schud([{t:'Het product van twee negatieve getallen is positief.', w:true}, {t:'De som van twee negatieve getallen is positief.', w:false},
    {t:'Het quotiënt van een positief en een negatief getal is negatief.', w:true}, {t:'Een negatief getal tot een even macht is negatief.', w:false},
    {t:'Aftrekken is optellen met het tegengestelde.', w:true}, {t:'Een negatief getal tot een oneven macht is negatief.', w:true}, {t:'Het product van drie negatieve getallen is positief.', w:false}]).slice(0, 4);
  return {q:'Zijn de rekenregels juist of fout?', jf:r, u:'Twee gelijke tekens geven plus bij vermenigvuldigen en delen. Een oneven aantal mintekens geeft min.\nTwee negatieve getallen optellen geeft een negatief getal.'};
});
T('A-GET-A15', 'get_a15_as', R => {
  const st = R.kies([0.25, 0.2, 0.5]), a = R.int(-3, 1), n = Math.round(1 / st), x = +(a + st * R.int(1, 2 * n - 1)).toFixed(4); if (Number.isInteger(x)) return null;
  return {q:'Welk getal hoort bij de pijl? Schrijf het als een decimaal getal.', fig:getAs(a, a + 2, st, 1, [{x, l:'P'}], 'Getallenas met een pijl P.'), velden:[veld(x)],
    u:`Tussen twee gehele getallen staan ${n} stukjes, dus één stukje is ${f(st)}.\nDe pijl staat bij ${minT(x)}.`};
});
T('A-GET-A16', 'get_a16_priem', R => {
  const p = R.schud([13, 17, 19, 23, 29, 31, 37, 41, 43, 47]).slice(0, R.int(2, 3)), nep = R.schud([51, 57, 91, 39, 49, 87, 21, 27, 33, 1]).slice(0, 6 - p.length);
  const o = R.schud(p.concat(nep)).map(String);
  return {q:'Welke getallen zijn priemgetallen? Duid alle juiste getallen aan.', o, mk:p.map(x => o.indexOf(String(x))), vast:true,
    u:'Priemgetallen hebben precies twee delers. ' + nep.map(x => x === 1 ? '1 heeft maar één deler' : `${x} = ${[3, 7, 13].find(d => x % d === 0)} · ${x / [3, 7, 13].find(d => x % d === 0)}`).join('; ') + '.'};
});
T('A-GET-A17', 'get_a17_omgekeerde', R => {
  const g = R.int(2, 9);
  return {q:`Hoe schrijf je het omgekeerde van ${g} met een macht?`, o:keuzes(`${g}<sup>−1</sup>`, [`−${g}`, `${g}<sup>1</sup>`, `(−${g})<sup>−1</sup>`]),
    u:`Het omgekeerde van ${g} is {{1|${g}}} = ${g}<sup>−1</sup>. Het tegengestelde van ${g} is −${g}.`};
});
T('A-GET-A18', 'get_a18_ordenen', R => {
  const e = [[`{{3|4}} van 20`, 15], [`20 % van 80`, 16], [`√196`, 14], [`2<sup>4</sup>`, 16], [`(−4)²`, 16], [`0,6 × 25`, 15], [`{{2|3}} van 21`, 14], [`3,5 · 4`, 14], [`|−17|`, 17], [`√289`, 17], [`12 % van 150`, 18], [`5² − 8`, 17]];
  const k = R.schud(e); const s = []; k.forEach(x => { if (s.length < 4 && !s.some(y => y[1] === x[1])) s.push(x); }); if (s.length < 4) return null;
  const o = s.slice().sort((a, b) => a[1] - b[1]);
  return {q:'Welke uitkomst is het grootst?', o:keuzes(o[3][0], o.slice(0, 3).map(x => x[0])), u:'Reken eerst alles uit:\n' + s.map(x => `${x[0]} = ${x[1]}`).join('\n')};
});
T('A-GET-A19', 'get_a19_schatten', R => {
  const t = R.int(1, 4), n = R.kies([3, 5, 7, 9]); if (t >= n) return null;
  const g = R.int(15, 60) * n * 10 + R.int(-8, 8), rg = Math.round(g / (n * 10)) * n * 10;
  return {q:`Ongeveer hoeveel is {{${t}|${n}}} van ${f(g)}?`, o:keuzes(f(rg / n * t), [f(rg / n), f(rg * t), f(rg / t)]), calc:false,
    u:`${f(g)} ≈ ${f(rg)}, dat is makkelijk te delen door ${n}.\n${f(rg)} : ${n} × ${t} = ${f(rg / n * t)}.`};
});
T('A-GET-A20', 'get_a20_herleiden', R => {
  const p = R.kies([[R.kies([2.5, 0.75, 12]), 'dm³', 'cl', 100], [R.kies([0.35, 1.2, 3]), 'm²', 'cm²', 10000], [R.kies([4500, 750, 12000]), 'cm³', 'l', 0.001],
    [R.kies([2, 0.4, 1.5]), 'm³', 'l', 1000], [R.kies([350, 80, 2500]), 'mm²', 'cm²', 0.01], [R.kies([3, 0.6]), 'ha', 'm²', 10000], [R.kies([250, 33]), 'cl', 'dm³', 0.01]]);
  const w = +(p[0] * p[3]).toFixed(6);
  return {q:`Zet om: ${f(p[0])} ${p[1]} = … ${p[2]}`, velden:[veld(w, p[2], `${f(p[0])} ${p[1]} =`)], calc:false,
    u:`${p[3] >= 1 ? `1 ${p[1]} = ${f(p[3])} ${p[2]}` : `1 ${p[2]} = ${f(1 / p[3])} ${p[1]}`}.\n${f(p[0])} ${p[1]} = ${f(w, 4)} ${p[2]}.\nOnthoud: 1 dm³ = 1 l en bij oppervlakte zet je per stap × 100, bij volume × 1 000.`};
});
T('A-GET-A21', 'get_a21_kraan', R => {
  const ml = R.kies([10, 12, 15, 20, 25]), u = R.kies([1, 24]);
  const w = ml * 60 * u / 1000;
  return {q:`Een lekkende kraan verliest ${ml} ml water per minuut.\nHoeveel liter water gaat er verloren in ${u === 1 ? 'één uur' : 'één dag'}?`, velden:[veld(w, 'l')],
    u:`In ${u === 1 ? 'een uur' : 'een dag'} zijn er ${60 * u} minuten. ${ml} × ${60 * u} = ${f(ml * 60 * u)} ml.\n${f(ml * 60 * u)} ml = ${f(w)} l.`};
});
T('A-GET-A21', 'get_a21_tegels', R => {
  const l = R.kies([3, 4, 5, 6]), b = R.kies([2.4, 3, 3.6]), t = R.kies([20, 30, 40]);
  const n = l * 100 / t * Math.round(b * 100) / t; if (!Number.isInteger(n)) return null;
  return {q:`Een vloer is ${f(l)} m lang en ${f(b)} m breed. Je legt er vierkante tegels op met een zijde van ${t} cm.\nHoeveel tegels heb je nodig?`, velden:[veld(n, 'tegels')],
    u:`Werk in dezelfde eenheid: ${f(l)} m = ${l * 100} cm en ${f(b)} m = ${f(b * 100)} cm.\nIn de lengte: ${l * 100} : ${t} = ${l * 100 / t} tegels. In de breedte: ${f(b * 100)} : ${t} = ${f(b * 100 / t)} tegels.\n${l * 100 / t} × ${f(b * 100 / t)} = ${n} tegels.`};
});
/* ---------- Algebra (dieptethema, A-stroom) ----------
   D: machten van één letter, getalwaarde met natuurlijke getallen, gelijksoortige eentermen optellen, toestandsteken van een product
   C: product van machten, getalwaarde van een product, haakjes uitwerken met een getal, regelmaat in figuren, formule herkennen
   B: quotiënt en macht van een product, getalwaarde van een quotiënt, meerdere eentermen, formule opstellen, omschrijving als lettervorm
   A: rekenregels combineren, getalwaarde met breuken, bewerkingen met veeltermen, formule bij patroon, merkwaardige producten */
koppel('A', `
a01=A-ALG-D2 t_getalw=A-ALG-D2 a02=A-ALG-D3 a05=A-ALG-D3 vk7=A-ALG-D3 f07=A-ALG-D1
f11=A-ALG-C1 a07=A-ALG-C3 t_a2_haakjes=A-ALG-C3 a14=A-ALG-C3 mk8=A-ALG-C3 a25=A-ALG-C5
a03=A-ALG-B9 t_a1_vertaal=A-ALG-B9 a06=A-ALG-B6 a09=A-ALG-B5 a28=A-ALG-B7
a11=A-ALG-A3 a17=A-ALG-A3 a15=A-ALG-A3 a21=A-ALG-A9 a22=A-ALG-A9 a30=A-ALG-A9 t_a2_taxi=A-ALG-A2
`);
const LET = ['a', 'b', 'x', 'y', 'p', 'q', 'm', 'n'];

/* ===== D ===== */
T('A-ALG-D1', 'alg_d1_machtmacht', R => {
  const l = R.kies(LET), p = R.int(2, 5), q = R.int(2, 4);
  return {q:`Schrijf als één macht: (${lt(l, p)})${SUP(q)}`, o:keuzes(lt(l, p * q), [lt(l, p + q), lt(l, Math.pow(p, q)), q + lt(l, p)]),
    u:`Bij een macht van een macht vermenigvuldig je de exponenten: (${lt(l, p)})${SUP(q)} = ${lt(l, p * q)}.`};
});
T('A-ALG-D1', 'alg_d1_breukmacht', R => {
  const [a, b] = R.schud(['a', 'b', 'x', 'y']).slice(0, 2), p = R.int(2, 5);
  return {q:`Werk uit: ({{${a}|${b}}})${SUP(p)}`, o:keuzes(`{{${lt(a, p)}|${lt(b, p)}}}`, [`{{${lt(a, p)}|${b}}}`, `{{${p}${a}|${p}${b}}}`, `{{${a}|${lt(b, p)}}}`]),
    u:`Bij een macht van een breuk verhef je de teller en de noemer tot die macht: ({{${a}|${b}}})${SUP(p)} = {{${lt(a, p)}|${lt(b, p)}}}.`};
});
T('A-ALG-D2', 'alg_d2_getalwaarde', R => {
  const l = R.kies(['x', 'a', 'n']), a = R.int(2, 9), b = R.int(1, 15), w = R.int(2, 6), sq = R.int(0, 1);
  const v = sq ? a * w * w + b : a * w + b;
  return {q:`Bereken de getalwaarde van ${a}${sq ? lt(l, 2) : l} + ${b} voor ${l} = ${w}.`, velden:[veld(v)], calc:false,
    u:`Vervang ${l} door ${w}: ${a} · ${w}${sq ? '²' : ''} + ${b} = ${sq ? `${a} · ${w * w} + ${b} = ` : ''}${a * (sq ? w * w : w)} + ${b} = ${v}.` + (sq ? '\nEerst de macht, dan vermenigvuldigen.' : '')};
});
T('A-ALG-D2', 'alg_d2_formule', R => {
  const z = R.int(3, 15);
  return {q:`De omtrek van een vierkant met zijde z bereken je met de formule P = 4z.\nHoe groot is de omtrek als z = ${z} cm?`, velden:[veld(4 * z, 'cm')], calc:false,
    u:`P = 4 · ${z} = ${4 * z}. De omtrek is ${4 * z} cm.`};
});
T('A-ALG-D3', 'alg_d3_som', R => {
  const l = R.kies(['x', 'a', 'y', 'x²', 'ab']), a = R.int(2, 9), b = R.int(2, 9);
  return {q:`Schrijf korter: ${a}${l} + ${b}${l}`, o:keuzes(`${a + b}${l}`, [`${a * b}${l}`, `${a + b}${l}²`.replace('²²', '⁴'), `${a + b}`, `${a}${b}${l}`]),
    u:`Gelijksoortige eentermen tel je op door de coëfficiënten op te tellen. Het letterdeel blijft: ${a}${l} + ${b}${l} = ${a + b}${l}.`};
});
T('A-ALG-D3', 'alg_d3_drie', R => {
  const l = R.kies(['x', 'a', 'p']), a = R.int(2, 9), b = R.int(2, 9), c = R.int(1, 5);
  return {q:`Schrijf korter: ${a}${l} + ${b}${l} + ${c === 1 ? '' : c}${l}`, velden:[veld(a + b + c, l)], calc:false,
    u:`${a} + ${b} + ${c} = ${a + b + c}, dus ${a + b + c}${l}.`};
});
T('A-ALG-D4', 'alg_d4_teken', R => {
  const rij = []; const ls = R.schud(['a', 'b', 'x', 'y']);
  for (let i = 0; i < 3; i++) {
    const p = R.int(2, 6) * (R.int(0, 1) ? -1 : 1), q = R.int(2, 6) * (R.int(0, 1) ? -1 : 1), deel = i === 2 && R.int(0, 1);
    if (deel) { const t = p * q; rij.push({voor:`(${minT(t)}${ls[0]}${ls[1]}) : (${minT(q)}${ls[1]}) =`, na:`${Math.abs(p)}${ls[0]}`, w:p > 0 ? '+' : '−'}); }
    else rij.push({voor:`(${minT(p)}${ls[i % 2]}) · (${minT(q)}${ls[(i + 1) % 2 + 2]}) =`, na:`${Math.abs(p * q)}${[ls[i % 2], ls[(i + 1) % 2 + 2]].sort().join('')}`, w:p * q > 0 ? '+' : '−'});
  }
  return {q:'Welk toestandsteken hoort bij het resultaat? Kies telkens + of −.', sym:{palet:['+', '−'], rijen:rij},
    u:'Twee gelijke tekens geven +, twee verschillende tekens geven −. Dat geldt bij vermenigvuldigen en bij delen.'};
});
T('A-ALG-D4', 'alg_d4_product', R => {
  const a = R.int(2, 6), b = R.int(2, 6), c = R.int(2, 4), n = R.int(1, 3), tek = Math.pow(-1, n);
  const fs = [n >= 1 ? `(−${a}x)` : `(${a}x)`, n >= 2 ? `(−${b}y)` : `(${b}y)`, n >= 3 ? `(−${c})` : `${c}`];
  const p = a * b * c;
  return {q:`Reken uit: ${fs.join(' · ')}`, o:keuzes(`${tek < 0 ? '−' : ''}${p}xy`, [`${tek < 0 ? '' : '−'}${p}xy`, `${tek < 0 ? '−' : ''}${a + b + c}xy`, `${tek < 0 ? '' : '−'}${a + b + c}xy`]),
    u:`Er ${n === 1 ? 'is 1 minteken' : 'zijn ' + n + ' mintekens'}: ${n % 2 ? 'oneven, dus het resultaat is negatief' : 'even, dus het resultaat is positief'}.\n${a} · ${b} · ${c} = ${p}.`};
});

/* ===== C ===== */
T('A-ALG-C1', 'alg_c1_product', R => {
  const l = R.kies(LET), p = R.int(2, 6), q = R.int(2, 6);
  return {q:`Schrijf als één macht: ${lt(l, p)} · ${lt(l, q)}`, o:keuzes(lt(l, p + q), [lt(l, p * q), (2) + lt(l, p + q), lt(l, Math.abs(p - q) || 1)]),
    u:`Bij een product van machten met hetzelfde grondtal tel je de exponenten op: ${lt(l, p)} · ${lt(l, q)} = ${lt(l, p + q)}.`};
});
T('A-ALG-C1', 'alg_c1_negatief', R => {
  const l = R.kies(LET), p = R.int(2, 7);
  if (R.int(0, 1)) return {q:`Schrijf als een macht met een negatieve exponent: {{1|${lt(l, p)}}}`, o:keuzes(lt(l, -p), ['−' + lt(l, p), '−' + lt(l, -p), lt(l, 1 - p)]),
    u:`{{1|${lt(l, p)}}} = ${lt(l, -p)}. Een negatieve exponent betekent het omgekeerde, niet het tegengestelde.`};
  return {q:`Welke breuk is gelijk aan ${lt(l, -p)}?`, o:keuzes(`{{1|${lt(l, p)}}}`, [`−${lt(l, p)}`, `{{−1|${lt(l, -p)}}}`, `{{${l}|${p}}}`]),
    u:`${lt(l, -p)} = {{1|${lt(l, p)}}}.`};
});
T('A-ALG-C2', 'alg_c2_product', R => {
  const c = R.int(2, 6), a = R.int(-6, 6), b = R.int(-6, 6); if (!a || !b) return null;
  return {q:`Bereken de getalwaarde van ${c}ab voor a = ${minT(a)} en b = ${minT(b)}.`, velden:[veld(c * a * b)], calc:false,
    u:`${c} · ${haakN(a)} · ${haakN(b)} = ${minT(c * a * b)}.`};
});
T('A-ALG-C2', 'alg_c2_opp', R => {
  const l = R.int(4, 15), b = R.int(2, 9);
  return {q:`De oppervlakte van een rechthoek is A = l · b.\nBereken A als l = ${l} m en b = ${b} m.`, velden:[veld(l * b, 'm²')], calc:false, u:`A = ${l} · ${b} = ${l * b} m².`};
});
T('A-ALG-C3', 'alg_c3_verschil', R => {
  const l = R.kies(['x', 'a', 'y', 'ab', 'x²']), a = R.int(2, 9), b = R.int(2, 12); if (a === b) return null;
  return {q:`Schrijf korter: ${a}${l} − ${b}${l}`, o:keuzes(mon(a - b, l, true), [mon(b - a, l, true), mon(a + b, l, true), mon(a - b, '', true)]),
    u:`${a} − ${b} = ${minT(a - b)}, dus ${mon(a - b, l, true)}.`};
});
T('A-ALG-C3', 'alg_c3_haakjes', R => {
  const k = R.int(2, 7) * (R.int(0, 3) ? 1 : -1), a = R.int(2, 6), b = R.int(1, 9) * (R.int(0, 1) ? 1 : -1);
  return {q:`Werk de haakjes uit: ${minT(k)}(${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)})`, o:keuzes(veelt([[k * a, 'x'], [k * b, '']]), [veelt([[k * a, 'x'], [b, '']]), veelt([[k * a, 'x'], [-k * b, '']]), veelt([[k + a, 'x'], [k * b, '']])]),
    u:`Vermenigvuldig ${minT(k)} met elke term: ${minT(k)} · ${a}x = ${mon(k * a, 'x', true)} en ${minT(k)} · ${haakN(b)} = ${minT(k * b)}.`};
});
T('A-ALG-C4', 'alg_c4_regelmaat', R => {
  const s = R.kies(['vierkant', 'driehoek', 'huis']), h = HOUT[s], n = R.int(4, 6);
  return {q:`Je legt figuren met lucifers.\nHoeveel lucifers heb je nodig voor figuur ${n}?`, fig:patroonFig(s, 3), velden:[veld(h[0] * n + h[1], 'lucifers')], calc:false,
    u:`Tel: figuur 1 heeft ${h[0] + h[1]}, figuur 2 heeft ${2 * h[0] + h[1]}, figuur 3 heeft ${3 * h[0] + h[1]} lucifers. Er komen telkens ${h[0]} lucifers bij.\nFiguur ${n}: ${3 * h[0] + h[1]}${Array(n - 3).fill(' + ' + h[0]).join('')} = ${h[0] * n + h[1]}.`};
});
T('A-ALG-C4', 'alg_c4_rij', R => {
  const a = R.int(2, 9), d = R.int(3, 8), rij = [0, 1, 2, 3].map(i => a + i * d);
  return {q:`Een rij begint zo: ${rij.join(', ')}, …\nWelk getal komt er na ${rij[3]}?`, velden:[veld(a + 4 * d)], calc:false, u:`Er komt telkens ${d} bij: ${rij[3]} + ${d} = ${a + 4 * d}.`};
});
T('A-ALG-C5', 'alg_c5_herkennen', R => {
  const a = R.int(2, 6), b = R.int(1, 9), r = [1, 2, 3].map(n => `${a} · ${n} + ${b} = ${a * n + b}`);
  return {q:`Bekijk de berekeningen:\n${r.join('\n')}\nWelke formule hoort hierbij voor elk getal n?`, o:keuzes(`${a}n + ${b}`, [`n + ${b}`, `${a + b}n`, `${a}n + ${b}n`]),
    u:`Het getal dat verandert (1, 2, 3) vervang je door n. Wat gelijk blijft, staat ook in de formule: ${a}n + ${b}.`};
});
T('A-ALG-C6', 'alg_c6_letter', R => {
  const p = R.kies([[`In de vergelijking 3x + 4 = 19 is x …`, 'een onbekende: er is één bepaalde waarde die je zoekt.'], [`In de formule P = 4z voor de omtrek van een vierkant is z …`, 'een variabele: z kan veel waarden aannemen.'],
    [`In de formule A = l · b is l …`, 'een variabele: l kan veel waarden aannemen.'], [`In de vergelijking 2a − 5 = 11 is a …`, 'een onbekende: er is één bepaalde waarde die je zoekt.'],
    [`In de formule prijs = 2,50 · n (n = aantal tickets) is n …`, 'een variabele: n kan veel waarden aannemen.']]);
  const o = ['een onbekende: er is één bepaalde waarde die je zoekt.', 'een variabele: z kan veel waarden aannemen.'.replace('z', p[0].match(/ is (\w) …/)[1]), 'een getal dat je niet mag invullen.', 'altijd gelijk aan 1.'];
  return {q:p[0], o:keuzes(p[1], o), u:`${p[0].replace('…', p[1])}\nIn een vergelijking zoek je de onbekende. In een formule kan de variabele verschillende waarden krijgen.`};
});
T('A-ALG-C7', 'alg_c7_eigenschap', R => {
  const p = R.kies([['a + 0 = a', '0 is het neutraal element voor de optelling.'], ['a · 1 = a', '1 is het neutraal element voor de vermenigvuldiging.'], ['a + (−a) = 0', '−a is het tegengesteld element van a voor de optelling.'],
    ['a + b = b + a', 'De optelling is commutatief.'], ['a · b = b · a', 'De vermenigvuldiging is commutatief.'], ['a − 0 = a', '0 is het neutraal element voor de aftrekking.'], ['a : 1 = a', '1 is het neutraal element voor de deling.']]);
  const alle = ['0 is het neutraal element voor de optelling.', '1 is het neutraal element voor de vermenigvuldiging.', '−a is het tegengesteld element van a voor de optelling.', 'De optelling is commutatief.', 'De vermenigvuldiging is commutatief.', '0 is het neutraal element voor de vermenigvuldiging.', '1 is het tegengesteld element van a.'];
  return {q:`Welke eigenschap zie je in ${p[0]}?`, o:keuzes(p[1], R.schud(alle)), u:`${p[0]}: ${p[1]}`};
});

/* ===== B ===== */
T('A-ALG-B1', 'alg_b1_quotient', R => {
  const l = R.kies(LET), p = R.int(5, 9), q = R.int(2, p - 1);
  return {q:`Schrijf als één macht: ${lt(l, p)} : ${lt(l, q)}`, o:keuzes(lt(l, p - q), [lt(l, p + q), lt(l, p / q === Math.floor(p / q) ? p / q : p * q), lt(l, q - p)]),
    u:`Bij een quotiënt van machten met hetzelfde grondtal trek je de exponenten af: ${lt(l, p)} : ${lt(l, q)} = ${lt(l, p - q)}.`};
});
T('A-ALG-B1', 'alg_b1_productmacht', R => {
  const c = R.int(2, 5), l = R.kies(['a', 'x', 'y']), p = R.int(2, 3), m = R.int(1, 3);
  const t = `(${c}${lt(l, m)})${SUP(p)}`;
  return {q:`Werk uit: ${t}`, o:keuzes(`${Math.pow(c, p)}${lt(l, m * p)}`, [`${c}${lt(l, m * p)}`, `${c * p}${lt(l, m * p)}`, `${Math.pow(c, p)}${lt(l, m + p)}`]),
    u:`Bij een macht van een product verhef je elke factor tot die macht: ${c}${SUP(p)} = ${Math.pow(c, p)} en (${lt(l, m)})${SUP(p)} = ${lt(l, m * p)}.`};
});
T('A-ALG-B2', 'alg_b2_eenterm', R => {
  const c = R.int(2, 5), l = R.kies(['a', 'x', 'y']), p = R.int(2, 4), q = R.int(2, 5);
  return {q:`Schrijf als één macht: (${c}${l})${SUP(p)} · (${c}${l})${SUP(q)}`, o:keuzes(`(${c}${l})${SUP(p + q)}`, [`(${c}${l})${SUP(p * q)}`, `${c}${lt(l, p + q)}`, `(${2 * c}${l})${SUP(p + q)}`]),
    u:`Het grondtal is de eenterm ${c}${l}. Je telt de exponenten op: (${c}${l})${SUP(p + q)}.`};
});
T('A-ALG-B3', 'alg_b3_quotient', R => {
  const b = R.int(2, 6) * (R.int(0, 1) ? 1 : -1), a = b * R.int(-6, 6), c = R.kies([1, 2, 3]); if (!a) return null;
  const w = c * a / b; if (!Number.isInteger(w * 2)) return null;
  return {q:`Bereken de getalwaarde van {{${c === 1 ? '' : c}a|b}} voor a = ${minT(a)} en b = ${minT(b)}.`, velden:[veld(w)], calc:false,
    u:`{{${c === 1 ? '' : c + ' · '}${haakN(a)}|${haakN(b)}}} = ${minT(w)}.`};
});
T('A-ALG-B4', 'alg_b4_herkennen', R => {
  const a = R.int(1, 6), b = R.int(1, 6);
  return {q:'Welke uitdrukking is een product van twee veeltermen?', o:keuzes(`(x + ${a})(x − ${b})`, [`x + ${a} · x − ${b}`, `${a}x · ${b}x`, `(x + ${a}) + (x − ${b})`]),
    u:`Bij (x + ${a})(x − ${b}) worden twee tweetermen met elkaar vermenigvuldigd.\n${a}x · ${b}x is een product van eentermen. In de andere uitdrukkingen is de laatste bewerking een optelling of aftrekking.`};
});
T('A-ALG-B5', 'alg_b5_som', R => {
  const c = [R.int(2, 9), -R.int(2, 9), R.int(1, 6), R.int(2, 9), -R.int(1, 5)];
  const ts = [[c[0], 'x'], [c[1], 'y'], [c[2], 'x'], [c[3], 'y'], [c[4], 'x']], x = c[0] + c[2] + c[4], y = c[1] + c[3];
  if (!x || !y) return null;
  return {q:`Schrijf zo kort mogelijk: ${veelt(R.schud(ts))}`, o:keuzes(veelt([[x, 'x'], [y, 'y']]), [veelt([[x, 'x'], [-y, 'y']]), veelt([[c[0] + c[2] - c[4], 'x'], [y, 'y']]), mon(x + y, 'xy', true)]),
    u:`Tel de gelijksoortige termen samen.\nx-termen: ${[c[0], c[2], c[4]].map(minT).join(', ')} geeft ${mon(x, 'x', true)}.\ny-termen: ${minT(c[1])} en ${minT(c[3])} geeft ${mon(y, 'y', true)}.`};
});
T('A-ALG-B6', 'alg_b6_verband', R => {
  const p = R.kies([[R.int(3, 6), R.kies([1.5, 2, 2.5]), 'Een taxi rekent € {a} instapprijs en € {b} per kilometer.', 'p', 'k', 'de prijs p in euro voor k kilometer'],
    [R.kies([150, 200, 250]), R.kies([12, 15, 18]), 'Een zaal huren kost € {a} en € {b} per gast.', 'p', 'g', 'de prijs p in euro voor g gasten'],
    [R.kies([20, 30, 40]), R.kies([5, 8, 10]), 'Een spaarpot bevat € {a}. Elke week komt er € {b} bij.', 's', 'w', 'het bedrag s in euro na w weken']]);
  const a = p[0], b = p[1], t = p[2].replace('€ {a}', eur(a)).replace('€ {b}', eur(b));
  return {q:`${t}\nWelke formule geeft ${p[5]}?`, o:keuzes(`${p[3]} = ${f(a)} + ${f(b)}${p[4]}`, [`${p[3]} = ${f(b)} + ${f(a)}${p[4]}`, `${p[3]} = (${f(a)} + ${f(b)})${p[4]}`, `${p[3]} = ${f(a)}${p[4]} · ${f(b)}`]),
    u:`Het vaste bedrag is ${f(a)}. Per ${p[4]} komt er ${f(b)} bij, dus ${f(b)}${p[4]}.\n${p[3]} = ${f(a)} + ${f(b)}${p[4]}.`};
});
T('A-ALG-B7', 'alg_b7_opstellen', R => {
  const k = R.int(3, 7), r = [R.int(4, 9), R.int(10, 15), R.int(16, 25)];
  const v = R.kies([[n => `${k} · ${n} − ${k} = ${k} · ${n - 1}`, `${k}a − ${k} = ${k}(a − 1)`, [`${k}a − ${k} = ${k}a − 1`, `${k}a − 1 = ${k}(a − 1)`, `a − ${k} = ${k}(a − 1)`]],
    [n => `${n} + ${n} + ${n} + ${n} = 4 · ${n}`, 'a + a + a + a = 4a', ['a + a + a + a = a⁴', 'a + a + a + a = 4 + a', '4 + a = 4a']],
    [n => `${n} · ${n} · ${n} = ${n}³`, 'a · a · a = a³', ['a · a · a = 3a', 'a + a + a = a³', '3 · a = a³']]]);
  return {q:`Bekijk de berekeningen:\n${r.map(v[0]).join('\n')}\nWelke formule is de veralgemening voor elk getal a?`, o:keuzes(v[1], v[2]),
    u:`Vervang het getal dat verandert door a: ${v[1]}.`};
});
T('A-ALG-B8', 'alg_b8_teken', R => {
  const l = R.kies(['x', 'a', 'y']), rij = [];
  for (let i = 0; i < 3; i++) { const a = R.int(-9, 9), b = R.int(-9, 9); if (!a || !b || a + b === 0) return null; rij.push({voor:`${mon(a, l, true)}${mon(b, l)} =`, na:`${Math.abs(a + b) === 1 ? '' : Math.abs(a + b)}${l}`, w:a + b > 0 ? '+' : '−'}); }
  return {q:'Welk toestandsteken hoort bij het resultaat? Kies telkens + of −.', sym:{palet:['+', '−'], rijen:rij},
    u:'Bij een som van eentermen kijk je naar de coëfficiënten: tel ze op met hun teken. Het teken van het resultaat is het teken van die som.'};
});
T('A-ALG-B9', 'alg_b9_omschrijving', R => {
  const a = R.int(2, 9), p = R.kies([[`het drievoud van x, verminderd met ${a}`, `3x − ${a}`, [`3(x − ${a})`, `x³ − ${a}`, `${a} − 3x`]], [`de helft van y, vermeerderd met ${a}`, `{{y|2}} + ${a}`, [`{{y + ${a}|2}}`, `2y + ${a}`, `y² + ${a}`]],
    [`het kwadraat van de som van a en ${a}`, `(a + ${a})²`, [`a² + ${a}`, `a² + ${a * a}`, `2(a + ${a})`]], [`de som van het kwadraat van a en ${a}`, `a² + ${a}`, [`(a + ${a})²`, `2a + ${a}`, `2(a + ${a})`]],
    [`het verschil van ${a} en het dubbel van n`, `${a} − 2n`, [`2n − ${a}`, `2(${a} − n)`, `${a} − n²`]]]);
  return {q:`Welke lettervorm past bij: ${p[0]}?`, o:keuzes(p[1], p[2]), u:`${p[0][0].toUpperCase() + p[0].slice(1)}: ${p[1]}.`};
});
T('A-ALG-B10', 'alg_b10_element', R => {
  const p = R.kies([['a · {{1|a}} = 1 (a ≠ 0)', '{{1|a}} is het symmetrisch element van a voor de vermenigvuldiging.'], ['a · 0 = 0', '0 is het opslorpend element voor de vermenigvuldiging.'],
    ['{{x|y}} · {{y|x}} = 1 (x, y ≠ 0)', '{{y|x}} is het symmetrisch element van {{x|y}} voor de vermenigvuldiging.'], ['0 · b = 0', '0 is het opslorpend element voor de vermenigvuldiging.']]);
  const o = ['0 is het opslorpend element voor de vermenigvuldiging.', '{{1|a}} is het symmetrisch element van a voor de vermenigvuldiging.', '1 is het neutraal element voor de vermenigvuldiging.', '0 is het neutraal element voor de optelling.', '−a is het tegengesteld element van a.'];
  return {q:`Welke eigenschap zie je in ${p[0]}?`, o:keuzes(p[1], R.schud(o)), u:`${p[0]}: ${p[1]}\nHet symmetrisch element voor de vermenigvuldiging is het omgekeerde. Vermenigvuldig je met 0, dan is het resultaat altijd 0.`};
});

/* ===== A ===== */
T('A-ALG-A1', 'alg_a1_combineren', R => {
  const c = R.int(2, 3), l = R.kies(['a', 'x', 'y']), m = R.int(2, 3), p = R.int(2, 3), q = R.int(1, 4), d = R.int(2, 5);
  const co = Math.pow(c, p) * d, e = m * p + q;
  return {q:`Werk uit: (${c}${lt(l, m)})${SUP(p)} · ${d}${lt(l, q)}`, o:keuzes(`${co}${lt(l, e)}`, [`${c * p * d}${lt(l, e)}`, `${co}${lt(l, m + q)}`, `${Math.pow(c, p) + d}${lt(l, e)}`]),
    u:`Eerst de macht: (${c}${lt(l, m)})${SUP(p)} = ${Math.pow(c, p)}${lt(l, m * p)}.\nDan het product: ${Math.pow(c, p)} · ${d} = ${co} en ${lt(l, m * p)} · ${lt(l, q)} = ${lt(l, e)}.`};
});
T('A-ALG-A2', 'alg_a2_breuk', R => {
  const x = R.kies([[-1, 2], [1, 2], [-3, 2], [1, 4], [-1, 4]]), y = R.kies([0.2, 0.4, 0.5, 1.5, -0.6]), a = R.int(2, 8), b = R.int(2, 5);
  const xv = x[0] / x[1], w = a * xv * xv - b * y;
  return {q:`Bereken de getalwaarde van ${a}x² − ${b}y voor x = ${x[0] < 0 ? '−' : ''}{{${Math.abs(x[0])}|${x[1]}}} en y = ${minT(y)}.\nSchrijf je antwoord als een decimaal getal.`, velden:[veld(w)], calc:false,
    u:`x² = (${x[0] < 0 ? '−' : ''}{{${Math.abs(x[0])}|${x[1]}}})² = {{${x[0] * x[0]}|${x[1] * x[1]}}} = ${f(xv * xv, 4)}.\n${a} · ${f(xv * xv, 4)} − ${b} · ${haakN(y)} = ${f(a * xv * xv, 4)} ${b * y < 0 ? '+' : '−'} ${f(Math.abs(b * y), 4)} = ${f(w, 4)}.`};
});
T('A-ALG-A3', 'alg_a3_product', R => {
  const a = R.int(2, 5) * (R.int(0, 1) ? 1 : -1), b = R.int(2, 5) * (R.int(0, 1) ? 1 : -1), p = R.int(1, 3), q = R.int(1, 3), r = R.int(1, 3), s = R.int(1, 3);
  const L = (e1, e2) => lt('a', e1) + lt('b', e2);
  return {q:`Werk uit: (${minT(a)}${L(p, q)}) · (${minT(b)}${L(r, s)})`, o:keuzes(mon(a * b, L(p + r, q + s), true), [mon(-a * b, L(p + r, q + s), true), mon(a * b, L(p * r, q * s), true), mon(a + b, L(p + r, q + s), true)]),
    u:`Coëfficiënten vermenigvuldigen: ${minT(a)} · ${haakN(b)} = ${minT(a * b)}.\nLetters: exponenten optellen: ${L(p + r, q + s)}.`};
});
T('A-ALG-A3', 'alg_a3_quotient', R => {
  const k = R.int(2, 6) * (R.int(0, 1) ? 1 : -1), c = R.int(2, 5), p = R.int(2, 4), m = R.int(5, 8), n = R.int(1, m - 1);
  if (R.int(0, 1)) return {q:`Werk uit: (${minT(k * c)}${lt('x', m)}) : (${c}${lt('x', n)})`, o:keuzes(mon(k, lt('x', m - n), true), [mon(-k, lt('x', m - n), true), mon(k, lt('x', m / n === Math.round(m / n) ? m * n : m + n), true), mon(k * c * c, lt('x', m - n), true)]),
    u:`${minT(k * c)} : ${c} = ${minT(k)} en ${lt('x', m)} : ${lt('x', n)} = ${lt('x', m - n)}.`};
  const a = R.int(2, 6), b = R.int(2, 9), d = R.kies([2, 3, 4]);
  return {q:`Werk uit: (${a * d}x² − ${b * d}x) : ${d}`, o:keuzes(`${a}x² − ${b}x`, [`${a}x² − ${b * d}x`, `${a}x − ${b}`, `${a * d * d}x² − ${b * d * d}x`]),
    u:`Deel elke term door ${d}: ${a * d}x² : ${d} = ${a}x² en ${b * d}x : ${d} = ${b}x.`};
});
T('A-ALG-A3', 'alg_a3_wortel', R => {
  const c = R.kies([4, 9, 16, 25, 36, 49]), e = R.kies([2, 4, 6, 8]);
  return {q:`Werk uit: √(${c}${lt('a', e)})  (a is positief)`, o:keuzes(`${Math.sqrt(c)}${lt('a', e / 2)}`, [`${c}${lt('a', e / 2)}`, `${Math.sqrt(c)}${lt('a', e * 2)}`, `${Math.sqrt(c)}${lt('a', e)}`]),
    u:`√${c} = ${Math.sqrt(c)} en √${lt('a', e)} = ${lt('a', e / 2)}, want (${lt('a', e / 2)})² = ${lt('a', e)}.`};
});
T('A-ALG-A3', 'alg_a3_som', R => {
  const a = [R.int(1, 6), -R.int(1, 6), R.int(1, 9)], b = [R.int(-5, 5), R.int(1, 6), -R.int(1, 9)]; if (!b[0]) return null;
  const s = [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; if (s.some(x => !x)) return null;
  const P = c => veelt([[c[0], 'x²'], [c[1], 'xy'], [c[2], 'y']]);
  return {q:`Werk uit: (${P(a)}) − (${P(b)})`, o:keuzes(P(s), [P([a[0] - b[0], a[1] + b[1], a[2] + b[2]]), P([a[0] + b[0], a[1] + b[1], a[2] + b[2]]), P([a[0] - b[0], a[1] - b[1], a[2] + b[2]])]),
    u:`Een minteken voor de haakjes verandert het teken van elke term: −(${P(b)}) = ${P(b.map(x => -x))}.\nTel daarna de gelijksoortige termen samen: ${P(s)}.`};
});
T('A-ALG-A4', 'alg_a4_woorden', R => {
  const p = R.kies([[R.kies([30, 25, 20]), R.kies([2.5, 1.5, 2]), 'Een kaars is {a} cm lang. Elk uur brandt er {b} cm op.', 'l', 't', 'de lengte l in cm na t uur', '−'],
    [R.kies([60, 80, 45]), R.kies([4, 5, 7]), 'Een gsm-batterij staat op {a} %. Elk uur gamen kost {b} % batterij.', 'B', 'u', 'de batterij B in % na u uur gamen', '−'],
    [R.kies([12, 15, 20]), R.kies([3, 4, 6]), 'Een plant is {a} cm hoog en groeit {b} cm per week.', 'h', 'w', 'de hoogte h in cm na w weken', '+']]);
  const a = p[0], b = p[1], o = p[6];
  return {q:`${p[2].replace('{a}', f(a)).replace('{b}', f(b))}\nWelke formule geeft ${p[5]}?`, o:keuzes(`${p[3]} = ${f(a)} ${o} ${f(b)}${p[4]}`, [`${p[3]} = ${f(b)} ${o} ${f(a)}${p[4]}`, `${p[3]} = ${f(a)}${p[4]} ${o} ${f(b)}`, `${p[3]} = ${f(a)} ${o === '+' ? '−' : '+'} ${f(b)}${p[4]}`]),
    u:`Start: ${f(a)}. Per ${p[4] === 't' || p[4] === 'u' ? 'uur' : 'week'} ${o === '+' ? 'komt er' : 'gaat er'} ${f(b)} ${o === '+' ? 'bij' : 'af'}: ${p[3]} = ${f(a)} ${o} ${f(b)}${p[4]}.`};
});
T('A-ALG-A5', 'alg_a5_patroon', R => {
  const s = R.kies(['vierkant', 'driehoek', 'huis']), h = HOUT[s];
  if (R.int(0, 1)) { const n = R.kies([20, 25, 40, 50, 100]); return {q:`Je legt figuren met lucifers.\nHoeveel lucifers heb je nodig voor figuur ${n}?`, fig:patroonFig(s, 3), velden:[veld(h[0] * n + h[1], 'lucifers')],
    u:`Er komen telkens ${h[0]} lucifers bij en er is er ${h[1]} extra: de formule is L = ${h[0]}n + ${h[1]}.\nFiguur ${n}: ${h[0]} · ${n} + ${h[1]} = ${h[0] * n + h[1]}.`}; }
  const n = R.int(15, 60), L = h[0] * n + h[1];
  return {q:`Je legt figuren met lucifers.\nWelke figuur bestaat uit ${L} lucifers?`, fig:patroonFig(s, 3), velden:[veld(n, '', 'figuur')],
    u:`Formule: L = ${h[0]}n + ${h[1]}.\n${h[0]}n + ${h[1]} = ${L}, dus ${h[0]}n = ${L - h[1]} en n = ${n}.`};
});
T('A-ALG-A6', 'alg_a6_omschrijving', R => {
  const a = R.int(2, 6);
  if (R.int(0, 1)) return {q:`Een rechthoek is x cm breed. De lengte is ${a} cm meer dan de breedte.\nWelke lettervorm geeft de omtrek van de rechthoek?`, o:keuzes(`4x + ${2 * a}`, [`2x + ${a}`, `4x + ${a}`, `x(x + ${a})`]),
    u:`Lengte: x + ${a}. Omtrek: 2 · (x + x + ${a}) = 2 · (2x + ${a}) = 4x + ${2 * a}.`};
  return {q:`Neem een getal n. Tel er ${a} bij op. Vermenigvuldig het resultaat met 2. Trek daarna het dubbel van n af.\nWelk resultaat krijg je altijd?`, velden:[veld(2 * a)], calc:false,
    u:`2(n + ${a}) − 2n = 2n + ${2 * a} − 2n = ${2 * a}. Het resultaat hangt niet af van n.`};
});
T('A-ALG-A7', 'alg_a7_tegengestelde', R => {
  const a = R.int(2, 9), b = R.int(1, 9), c = R.int(a + 1, 12), l = R.kies(['a', 'x', 'y']);
  if (R.int(0, 1)) return {q:`Werk uit: −(${a}${l} − ${b})`, o:keuzes(`−${a}${l} + ${b}`, [`−${a}${l} − ${b}`, `${a}${l} + ${b}`, `${a}${l} − ${b}`]), u:`Het tegengestelde van een tweeterm: verander het teken van elke term. −(${a}${l} − ${b}) = −${a}${l} + ${b}.`};
  return {q:`Werk uit: ${c}${l} − (${a}${l} − ${b})`, o:keuzes(`${c - a}${l} + ${b}`, [`${c - a}${l} − ${b}`, `${c + a}${l} − ${b}`, `${c - a + b}${l}`]),
    u:`${c}${l} − (${a}${l} − ${b}) = ${c}${l} − ${a}${l} + ${b} = ${c - a}${l} + ${b}.`};
});
T('A-ALG-A8', 'alg_a8_absoluut', R => {
  if (R.int(0, 1)) return {q:'a is een negatief getal.\nWaaraan is |a| gelijk?', o:keuzes('−a', ['a', '{{1|a}}', '0']), u:'De absolute waarde is nooit negatief. Is a negatief, dan is −a positief. Dus |a| = −a.\nVoorbeeld: a = −5 geeft |−5| = 5 = −(−5).'};
  const a = R.int(2, 5), b = R.int(5, 20), x = R.int(-3, 2);
  return {q:`Bereken |${a}x − ${b}| voor x = ${minT(x)}.`, velden:[veld(Math.abs(a * x - b))], calc:false, u:`${a} · ${haakN(x)} − ${b} = ${minT(a * x - b)} en |${minT(a * x - b)}| = ${Math.abs(a * x - b)}.`};
});
T('A-ALG-A9', 'alg_a9_merkwaardig', R => {
  const a = R.int(1, 9), l = R.kies(['x', 'a', 'y']), c = R.int(1, 3), C = c === 1 ? '' : c;
  if (R.int(0, 1)) return {q:`Werk uit: (${C}${l} + ${a})²`, o:keuzes(`${c * c === 1 ? '' : c * c}${l}² + ${2 * a * c}${l} + ${a * a}`, [`${c * c === 1 ? '' : c * c}${l}² + ${a * a}`, `${c * c === 1 ? '' : c * c}${l}² + ${a * c}${l} + ${a * a}`, `${C}${l}² + ${2 * a * c}${l} + ${2 * a}`]),
    u:`(A + B)² = A² + 2AB + B².\n(${C}${l})² = ${c * c === 1 ? '' : c * c}${l}², 2 · ${C}${l} · ${a} = ${2 * a * c}${l} en ${a}² = ${a * a}.`};
  return {q:`Werk uit: (${C}${l} + ${a})(${C}${l} − ${a})`, o:keuzes(`${c * c === 1 ? '' : c * c}${l}² − ${a * a}`, [`${c * c === 1 ? '' : c * c}${l}² + ${a * a}`, `${c * c === 1 ? '' : c * c}${l}² − ${2 * a * c}${l} − ${a * a}`, `${C}${l}² − ${a}`]),
    u:`(A + B)(A − B) = A² − B².\n(${C}${l})² − ${a}² = ${c * c === 1 ? '' : c * c}${l}² − ${a * a}.`};
});
T('A-ALG-A10', 'alg_a10_onbekende', R => {
  const p = R.kies([[`${'{n}'} koopt 3 schriften en een pen van € 2. In totaal betaalt {n} € 9,50.`, '3x + 2 = 9,5', 'de prijs van één schrift in euro', ['het aantal schriften', 'de prijs van de pen in euro', 'het totale bedrag in euro']],
    [`{n} is x jaar. De zus van {n} is 4 jaar ouder. Samen zijn ze 30 jaar.`, 'x + (x + 4) = 30', 'de leeftijd van {n} in jaar', ['de leeftijd van de zus in jaar', 'het leeftijdsverschil in jaar', 'de som van de leeftijden in jaar']],
    [`Een rechthoek is 3 cm langer dan breed. De omtrek is 26 cm.`, '2x + 2(x + 3) = 26', 'de breedte van de rechthoek in cm', ['de lengte van de rechthoek in cm', 'de omtrek in cm', 'de oppervlakte in cm²']],
    [`In een klas zitten 4 meisjes meer dan jongens. Er zijn 24 leerlingen.`, 'x + (x + 4) = 24', 'het aantal jongens', ['het aantal meisjes', 'het aantal leerlingen', 'het verschil tussen meisjes en jongens']]]);
  const n = R.naam(), z = s => s.replace(/\{n\}/g, n);
  return {q:`${z(p[0])}\nDaarbij hoort de vergelijking ${p[1]}.\nWat stelt x voor?`, o:keuzes(z(p[2]), p[3].map(z)), u:`In ${p[1]} staat x voor ${z(p[2])}.`};
});
/* ---------- Verhoudingen en vergelijkingen (dieptethema, A-stroom) ----------
   D: verhouding met een eenvoudige factor, schaal noteren, noemer 100, x + a = b
   C: verhoudingstabel met decimale getallen, grafiek van een recht evenredig verband, verhouding als breuk, a = x + b
   B: rationale factor en eenheden, tabellen recht en omgekeerd evenredig, schaal gebruiken, procenten, ax + b = cx + d
   A: extra berekeningen en minder courante eenheden, representaties koppelen, constante en formule, vergelijkingen met haakjes en breuken opstellen en oplossen */
koppel('A', `
a04=A-VVG-D4 t_a1_verg=A-VVG-D4
a16=A-VVG-B5 t_evenr=A-VVG-B5 a26=A-VVG-B2 t_omgekeerd=A-VVG-B2 g24=A-VVG-B4
g09=A-VVG-B7 t_procentvan=A-VVG-B7 g17=A-VVG-B7 g22=A-VVG-B7 g34=A-VVG-B7 t_btw=A-VVG-B7 g39=A-VVG-B7
a08=A-VVG-B8 t_a2_maal=A-VVG-B8 a12=A-VVG-B8 t_verg1=A-VVG-B8 a13=A-VVG-B8 t_verg2=A-VVG-B8 a24=A-VVG-B8 t_vergbreuk=A-VVG-B8 a20=A-VVG-B10
g27=A-VVG-A2 g30=A-VVG-A1 t_g4_procentterug=A-VVG-A1 g43=A-VVG-A1
a23=A-VVG-A7 t_verg3=A-VVG-A7 a29=A-VVG-A7 t_a5_breukverg=A-VVG-A7 a33=A-VVG-A7 a31=A-VVG-A8 t_a5_even=A-VVG-A8 t_leeftijd=A-VVG-A8
`);
/* tabel als figuur: kop = eerste kolom, rijen = [[naam, w1, w2, …], …] (horizontale verhoudingstabel) */
const vtab = (titel, rijen) => ({t:'tab', titel, kop:[rijen[0][0]].concat(rijen[0].slice(1).map(x => typeof x === 'number' ? f(x) : x)), rijen:rijen.slice(1).map(r => [r[0]].concat(r.slice(1).map(x => typeof x === 'number' ? f(x) : x)))});
/* kleine grafiek in een vak (100 x 80) met assen; pts in eenheden 0..10 */
function miniGraf(x0, pts, l) {
  const X = x => x0 + 14 + x * 8, Y = y => 92 - y * 7;
  return '<line class="fas" x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(10.5) + '" y2="' + Y(0) + '"/><line class="fas" x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(0) + '" y2="' + Y(11) + '"/>' +
    '<polyline fill="none" stroke="var(--k1)" stroke-width="3" points="' + pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ') + '"/>' + tekst([X(5), 118], '<tspan font-weight="700">' + l + '</tspan>');
}

/* ===== D ===== */
T('A-VVG-D1', 'vvg_d1_recept', R => {
  const p = R.kies([[4, 'personen', 200, 'g pasta'], [2, 'pannenkoeken', 1, 'ei'], [6, 'muffins', 150, 'g bloem'], [3, 'personen', 450, 'g gehakt']]), k = R.int(2, 5);
  return {q:`Voor ${p[0]} ${p[1]} heb je ${p[2]} ${p[3]} nodig.\nHoeveel heb je nodig voor ${p[0] * k} ${p[1]}?`, velden:[veld(p[2] * k, p[3].split(' ')[0] === 'ei' ? 'eieren' : p[3].split(' ')[0])], calc:false,
    u:`${p[0] * k} is ${k} keer ${p[0]}. Dus ook ${k} × ${p[2]} = ${p[2] * k}.`};
});
T('A-VVG-D1', 'vvg_d1_verhouding', R => {
  const a = R.int(1, 4), b = R.int(2, 5), k = R.int(2, 6); if (a === b) return null;
  return {q:`Voor limonade meng je siroop en water in de verhouding ${a} : ${b}.\nHoeveel dl water heb je nodig bij ${a * k} dl siroop?`, velden:[veld(b * k, 'dl')], calc:false,
    u:`${a * k} dl siroop is ${k} keer ${a}. Dan heb je ook ${k} × ${b} = ${b * k} dl water nodig.`};
});
T('A-VVG-D2', 'vvg_d2_schaal', R => {
  const p = R.kies([[1, 'cm', 500, 'm', 50000], [1, 'cm', 2, 'km', 200000], [1, 'cm', 10, 'm', 1000], [1, 'cm', 250, 'm', 25000], [1, 'cm', 1, 'km', 100000]]);
  return {q:`Op een kaart stelt ${p[0]} ${p[1]} in werkelijkheid ${f(p[2])} ${p[3]} voor.\nWelke schaal heeft de kaart?`, o:keuzes(`1 : ${f(p[4])}`, [`1 : ${f(p[2])}`, `1 : ${f(p[4] / 10)}`, `${f(p[4])} : 1`]),
    u:`${f(p[2])} ${p[3]} = ${f(p[4])} cm. De schaal is 1 : ${f(p[4])}.`};
});
T('A-VVG-D3', 'vvg_d3_honderd', R => {
  const p = R.int(1, 99), soort = R.int(0, 2);
  if (soort === 0) return {q:`Schrijf {{${p}|100}} als een procent en als een decimaal getal.`, velden:[veld(p, '%', `{{${p}|100}} =`), veld(p / 100, '', '=')], calc:false, u:`{{${p}|100}} = ${p} % = ${f(p / 100)}.`};
  if (soort === 1) return {q:`Welke breuk is gelijk aan ${p} %?`, o:keuzes(`{{${p}|100}}`, [`{{${p}|10}}`, `{{100|${p}}}`, `{{${p}|1000}}`]), calc:false, u:`Procent betekent "per honderd": ${p} % = {{${p}|100}} = ${f(p / 100)}.`};
  return {q:`Schrijf ${f(p / 100)} als een procent.`, velden:[veld(p, '%', `${f(p / 100)} =`)], calc:false, u:`${f(p / 100)} = {{${p}|100}} = ${p} %.`};
});
T('A-VVG-D4', 'vvg_d4_vgl', R => {
  const x = R.int(2, 40), a = R.int(2, 30), l = R.kies(['x', 'y', 'a']);
  return {q:`Los op: ${l} + ${a} = ${x + a}`, velden:[veld(x, '', `${l} =`)], calc:false, u:`Trek in beide leden ${a} af: ${l} = ${x + a} − ${a} = ${x}.`};
});
T('A-VVG-D4', 'vvg_d4_context', R => {
  const x = R.int(5, 40), a = R.int(8, 30), wie = R.naam();
  return {q:`${wie} heeft x euro. Na een verjaardag krijgt ${wie} er ${a} euro bij. Nu heeft ${wie} ${x + a} euro.\nLos op: x + ${a} = ${x + a}`, velden:[veld(x, '', 'x =')], calc:false, u:`x = ${x + a} − ${a} = ${x}. ${wie} had eerst ${x} euro.`};
});

/* ===== C ===== */
T('A-VVG-C1', 'vvg_c1_tabel', R => {
  const kg = R.kies([0.5, 1.5, 2.5]), pr = R.kies([1.2, 2.4, 3.1, 4.8]), k = R.int(2, 6), w = R.kies([['appelen', 'kg'], ['kaas', 'kg'], ['tomaten', 'kg']]);
  return {q:`Vul de verhoudingstabel aan.\nHoeveel kost ${f(kg * k)} kg ${w[0]}?`, fig:vtab(`Prijs van ${w[0]}`, [['massa (kg)', kg, kg * k], ['prijs (€)', pr, '…']]), velden:[geld(pr * k)],
    u:`${f(kg * k)} kg is ${k} keer ${f(kg)} kg. De prijs is dus ook ${k} keer zo groot: ${k} × ${eur(pr)} = ${eur(pr * k)}.`};
});
T('A-VVG-C1', 'vvg_c1_benzine', R => {
  const l = R.kies([1.5, 2.5, 4.5]), km = R.kies([20, 30, 40]), k = R.int(3, 8);
  return {q:`Een scooter verbruikt ${f(l)} liter benzine voor ${km} km.\nHoeveel liter verbruikt de scooter voor ${km * k} km?`, velden:[veld(l * k, 'liter')], u:`${km * k} km is ${k} keer ${km} km: ${k} × ${f(l)} = ${f(l * k)} liter.`};
});
T('A-VVG-C2', 'vvg_c2_grafiek', R => {
  const k = R.kies([0.6, 0.8, 1]), soorten = R.schud([['recht', [[0, 0], [10, 10 * k]]], ['niet0', [[0, 3], [10, 3 + 7 * k]]], ['kromme', [[1, 10], [2, 5], [3, 3.3], [4, 2.5], [5, 2], [7, 1.4], [10, 1]]], ['knik', [[0, 0], [4, 6], [10, 7]]]]);
  const L = ['A', 'B', 'C', 'D'], i = soorten.findIndex(s => s[0] === 'recht');
  return {q:'Welke grafiek hoort bij een recht evenredig verband?', fig:fig('0 0 440 126', soorten.map((s, j) => miniGraf(j * 110, s[1], 'grafiek ' + L[j])).join(''), 'Vier grafieken A, B, C en D.'),
    ...letterKeuze(L.length, i, 'grafiek '), u:`Een recht evenredig verband geeft een rechte door de oorsprong: grafiek ${L[i]}.\nEen rechte die niet door de oorsprong gaat, is niet recht evenredig.`};
});
T('A-VVG-C3', 'vvg_c3_breuk', R => {
  const j = R.int(8, 16), m = R.int(8, 16), g = ggd(j, m); if (j === m || g === 1) return null;
  return {q:`In een jeugdbeweging zijn er ${j} jongens en ${m} meisjes.\nWelke breuk geeft de verhouding van het aantal jongens tot het aantal meisjes?`, o:keuzes(`{{${j / g}|${m / g}}}`, [`{{${m / g}|${j / g}}}`, `{{${j}|${j + m}}}`, `{{${m}|${j + m}}}`]),
    u:`jongens : meisjes = ${j} : ${m} = {{${j}|${m}}} = {{${j / g}|${m / g}}}.\n{{${j}|${j + m}}} is het deel jongens van de hele groep, dat is iets anders.`};
});
T('A-VVG-C4', 'vvg_c4_vgl', R => {
  const x = R.int(2, 40), b = R.int(2, 30), l = R.kies(['x', 'y', 'a']);
  return {q:`Los op: ${x + b} = ${l} + ${b}`, velden:[veld(x, '', `${l} =`)], calc:false, u:`Trek in beide leden ${b} af: ${x + b} − ${b} = ${l}, dus ${l} = ${x}.`};
});
T('A-VVG-C4', 'vvg_c4_context', R => {
  const x = R.int(12, 45), b = R.int(3, 15);
  return {q:`Een plant groeide deze maand ${b} cm en is nu ${x + b} cm hoog. Noem h de hoogte aan het begin van de maand.\nLos op: ${x + b} = h + ${b}`, velden:[veld(x, 'cm', 'h =')], calc:false, u:`h = ${x + b} − ${b} = ${x} cm.`};
});

/* ===== B ===== */
T('A-VVG-B1', 'vvg_b1_eenheid', R => {
  const kg = R.kies([2, 3, 4, 5]), pr = R.kies([4.2, 5.4, 6, 7.2]), g = R.kies([250, 500, 750, 1250]);
  return {q:`${kg} kg appelen kost ${eur(pr)}.\nHoeveel kost ${g} g appelen?`, velden:[geld(Math.round(pr / kg * g / 1000 * 100) / 100)],
    u:`1 kg kost ${eur(pr)} : ${kg} = ${eur(pr / kg)}.\n${g} g = ${f(g / 1000)} kg, dus ${f(g / 1000)} × ${eur(pr / kg)} = ${eur(pr / kg * g / 1000)}.`};
});
T('A-VVG-B1', 'vvg_b1_teveel', R => {
  const pers = R.kies([4, 6, 8]), bl = R.kies([300, 360, 480]), ei = R.int(2, 4), n = R.kies([3, 5, 10]); if (bl / pers * n !== Math.round(bl / pers * n)) return null;
  return {q:`Een recept voor ${pers} personen vraagt ${bl} g bloem, ${ei} eieren en een halve liter melk. De bereiding duurt 45 minuten.\nHoeveel gram bloem heb je nodig voor ${n} personen?`, velden:[veld(bl / pers * n, 'g')],
    u:`De eieren, de melk en de bereidingstijd heb je niet nodig.\nVoor 1 persoon: ${bl} : ${pers} = ${f(bl / pers)} g. Voor ${n} personen: ${n} × ${f(bl / pers)} = ${f(bl / pers * n)} g.`};
});
T('A-VVG-B2', 'vvg_b2_herkennen', R => {
  const soort = R.kies(['recht', 'omgekeerd', 'geen']), x = [1, 2, 3, 4, 6], c = R.kies([12, 24, 36]);
  const y = soort === 'recht' ? x.map(v => v * c / 6) : soort === 'omgekeerd' ? x.map(v => c / v) : x.map(v => v + c / 6);
  return {q:'Bekijk de tabel. Welk verband is dit?', fig:vtab('Tabel', [['x'].concat(x), ['y'].concat(y)]),
    o:keuzes(soort === 'recht' ? 'recht evenredig' : soort === 'omgekeerd' ? 'omgekeerd evenredig' : 'geen van beide', R.schud(['recht evenredig', 'omgekeerd evenredig', 'geen van beide'])),
    u:soort === 'recht' ? `Het quotiënt y : x is altijd ${f(c / 6)}. Het verband is recht evenredig.` : soort === 'omgekeerd' ? `Het product x · y is altijd ${c}. Het verband is omgekeerd evenredig.` : 'Het quotiënt y : x en het product x · y zijn niet constant. Het verband is geen van beide.'};
});
T('A-VVG-B2', 'vvg_b2_vervolledig', R => {
  const om = R.int(0, 1), c = R.kies([24, 36, 48, 60]), x = R.schud([2, 3, 4, 6]).slice(0, 4).sort((a, b) => a - b), mis = R.int(1, 3);
  const y = x.map(v => om ? c / v : v * c / 12);
  const rij = y.map((v, i) => i === mis ? '…' : v);
  return {q:`De tabel hoort bij een ${om ? 'omgekeerd' : 'recht'} evenredig verband.\nWelk getal moet er op de puntjes?`, fig:vtab('Tabel', [['x'].concat(x), ['y'].concat(rij)]), velden:[veld(y[mis])], calc:false,
    u:om ? `Bij een omgekeerd evenredig verband is x · y constant: ${x[0]} · ${y[0]} = ${c}.\n${c} : ${x[mis]} = ${f(y[mis])}.` : `Bij een recht evenredig verband is y : x constant: ${f(y[0])} : ${x[0]} = ${f(c / 12)}.\n${x[mis]} · ${f(c / 12)} = ${f(y[mis])}.`};
});
T('A-VVG-B3', 'vvg_b3_formule', R => {
  const k = R.kies([1.5, 2.5, 3, 0.8, 4]), p = R.kies([['Een kilogram kost € {k}.', 'p', 'm', 'de prijs p in euro voor m kg'], ['Per liter betaal je € {k}.', 'p', 'v', 'de prijs p in euro voor v liter']]);
  return {q:`De prijs is recht evenredig met de hoeveelheid. ${p[0].replace('€ {k}', eur(k))}\nWelke formule geeft ${p[3]}?`, o:keuzes(`${p[1]} = ${f(k)}${p[2]}`, [`${p[1]} = ${f(k)} + ${p[2]}`, `${p[1]} = {{${f(k)}|${p[2]}}}`, `${p[2]} = ${f(k)}${p[1]}`]),
    u:`Bij een recht evenredig verband vermenigvuldig je met de evenredigheidsfactor: ${p[1]} = ${f(k)} · ${p[2]}.`};
});
T('A-VVG-B4', 'vvg_b4_schaal', R => {
  const s = R.kies([25000, 50000, 20000, 100000]), cm = R.kies([3, 4.5, 6, 7.2, 8]), w = cm * s / 100000;
  return {q:`Op een fietskaart met schaal 1 : ${f(s)} is een route ${f(cm)} cm lang.\nHoe lang is de route in werkelijkheid?`, velden:[veld(w, 'km')],
    u:`${f(cm)} cm × ${f(s)} = ${f(cm * s)} cm.\n${f(cm * s)} cm = ${f(w, 3)} km.`};
});
T('A-VVG-B5', 'vvg_b5_gelijk', R => {
  const a = R.int(2, 7), b = R.int(2, 9), k = R.int(2, 5); if (a === b || ggd(a, b) > 1) return null;
  return {q:`Welke verhouding is gelijk aan ${a * 2} : ${b * 2}?`, o:keuzes(`${a * k} : ${b * k}`, [`${a * 2 + k} : ${b * 2 + k}`, `${b * k} : ${a * k}`, `${a * k} : ${b * k + 1}`]),
    u:`${a * 2} : ${b * 2} = ${a} : ${b}. Vermenigvuldig beide getallen met ${k}: ${a * k} : ${b * k}.\nBij beide getallen hetzelfde getal optellen geeft geen gelijke verhouding.`};
});
T('A-VVG-B6', 'vvg_b6_procent', R => {
  if (R.int(0, 1)) { const p = R.kies([[7, 20], [3, 25], [11, 50], [17, 20], [1, 8], [3, 8]]); return {q:`Schrijf {{${p[0]}|${p[1]}}} als een procent.`, velden:[veld(p[0] / p[1] * 100, '%', `{{${p[0]}|${p[1]}}} =`)],
    u:`{{${p[0]}|${p[1]}}} = ${p[0]} : ${p[1]} = ${f(p[0] / p[1], 4)} = ${f(p[0] / p[1] * 100)} %.`}; }
  const p = R.kies([45, 35, 64, 15, 72, 8, 12.5]), g = ggd(p * 10, 1000);
  return {q:`Schrijf ${f(p)} % als een vereenvoudigde breuk.`, velden:[veld(p * 10 / g + '/' + 1000 / g, '', `${f(p)} % =`, 'breuk')],
    u:`${f(p)} % = {{${f(p)}|100}} = {{${p * 10 / g}|${1000 / g}}}.`};
});
T('A-VVG-B7', 'vvg_b7_teveel', R => {
  const n = R.kies([480, 640, 720, 800]), m = R.int(200, 400), pc = R.kies([15, 25, 35, 40]);
  return {q:`Een school telt ${n} leerlingen. Daarvan zijn er ${m} meisjes. ${pc} % van alle leerlingen komt met de fiets naar school.\nHoeveel leerlingen komen met de fiets?`, velden:[veld(n * pc / 100, 'leerlingen')],
    u:`Het aantal meisjes heb je niet nodig.\n${pc} % van ${n} = ${n} × ${f(pc / 100)} = ${f(n * pc / 100)}.`};
});
T('A-VVG-B8', 'vvg_b8_vgl', R => {
  const x = R.int(-9, 9), a = R.int(2, 9), c = R.int(1, 8), b = R.int(-15, 15), d = (a - c) * x + b; if (a === c || !x || !b || !d) return null;
  return {q:`Los op: ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${c === 1 ? '' : c}x ${d < 0 ? '−' : '+'} ${Math.abs(d)}`, velden:[veld(x, '', 'x =')], calc:false,
    u:`Breng de termen met x naar het linkerlid en de getallen naar het rechterlid:\n${a}x − ${c === 1 ? '' : c}x = ${minT(d)} ${b < 0 ? '+' : '−'} ${Math.abs(b)}\n${minT(a - c)}x = ${minT(d - b)}\nx = ${minT(d - b)} : ${haakN(a - c)} = ${minT(x)}.`};
});
T('A-VVG-B8', 'vvg_b8_stap', R => {
  const a = R.int(2, 9), b = R.int(2, 20), x = R.int(2, 9), c = a * x + b;
  return {q:`${R.naam()} lost de vergelijking ${a}x + ${b} = ${c} op.\nWat is een juiste volgende stap?`, o:keuzes(`${a}x = ${c} − ${b}`, [`${a}x = ${c} + ${b}`, `x + ${b} = ${c} : ${a}`, `${a}x = ${c} : ${b}`]),
    u:`Trek in beide leden ${b} af: ${a}x = ${c} − ${b} = ${c - b}. Daarna deel je door ${a}: x = ${x}.`};
});
T('A-VVG-B8', 'vvg_b8_breuk', R => {
  const n = R.kies([3, 4, 5]), a = R.int(1, 4), b = R.int(1, 7), x = n * R.int(-4, 6), c = a * x / n + b; if (!x || a >= n) return null;
  return {q:`Los op: {{${a === 1 ? '' : a}x|${n}}} + ${b} = ${minT(c)}`, velden:[veld(x, '', 'x =')], calc:false,
    u:`{{${a === 1 ? '' : a}x|${n}}} = ${minT(c)} − ${b} = ${minT(c - b)}.\n${a === 1 ? '' : a}x = ${minT(c - b)} · ${n} = ${minT((c - b) * n)}${a > 1 ? `\nx = ${minT(x)}` : ''}.`};
});
T('A-VVG-B9', 'vvg_b9_betekenis', R => {
  const p = R.kies([['Een volwassene betaalt € 12 voor het pretpark, een kind betaalt x euro. Een gezin met 2 volwassenen en 3 kinderen betaalt € 48.', '2 · 12 + 3x = 48', 'de prijs voor één kind in euro', ['het aantal kinderen', 'de prijs voor het hele gezin in euro', 'de prijs voor één volwassene in euro']],
    ['Een loodgieter rekent € 40 verplaatsingskosten en x euro per uur. Voor 3 uur werk betaal je € 145.', '40 + 3x = 145', 'de prijs per uur in euro', ['het aantal uren', 'de verplaatsingskosten in euro', 'de totale prijs in euro']],
    ['Een zwembad wordt gevuld. Er zit al 20 m³ water in en er komt elk uur 5 m³ bij. Na x uur zit er 65 m³ in.', '20 + 5x = 65', 'het aantal uren', ['het aantal m³ water per uur', 'het volume van het zwembad', 'het water dat er al in zat in m³']]]);
  return {q:`${p[0]}\nDaarbij hoort de vergelijking ${p[1]}.\nWat stelt x voor?`, o:keuzes(p[2], p[3]), u:`In ${p[1]} staat x voor ${p[2]}.`};
});
T('A-VVG-B10', 'vvg_b10_omschrijving', R => {
  const a = R.int(2, 9), b = R.int(3, 15), x = R.int(2, 12), p = R.kies([[`Het drievoud van een getal, vermeerderd met ${b}, is ${3 * x + b}.`, `3x + ${b} = ${3 * x + b}`, [`3(x + ${b}) = ${3 * x + b}`, `x + 3 + ${b} = ${3 * x + b}`, `3x = ${3 * x + b} + ${b}`]],
    [`Als je ${b} aftrekt van het dubbel van een getal, krijg je ${2 * x - b}.`, `2x − ${b} = ${2 * x - b}`, [`${b} − 2x = ${2 * x - b}`, `2(x − ${b}) = ${2 * x - b}`, `x − ${b} = 2 · ${2 * x - b}`]],
    [`De helft van een getal is ${a} meer dan ${x}.`, `{{x|2}} = ${x} + ${a}`, [`{{x|2}} + ${a} = ${x}`, `2x = ${x} + ${a}`, `{{x + ${a}|2}} = ${x}`]]]);
  return {q:`Welke vergelijking past bij deze omschrijving?\n${p[0]}`, o:keuzes(p[1], p[2]), u:`Noem het getal x. Dan geeft de omschrijving: ${p[1]}.`};
});

/* ===== A ===== */
T('A-VVG-A1', 'vvg_a1_pomp', R => {
  const hl = R.kies([7.2, 9, 12, 14.4, 18]), l = R.kies([12, 15, 20, 24]), mi = hl * 100 / l; if (!Number.isInteger(mi) || mi < 60 || mi % 60 === 0) return null;
  return {q:`Een regenput bevat ${f(hl)} hl water. Een pomp haalt er ${l} liter per minuut uit.\nHoelang duurt het om de put leeg te pompen?`, velden:[veld(Math.floor(mi / 60), 'uur'), veld(mi % 60, 'min')],
    u:`${f(hl)} hl = ${f(hl * 100)} liter.\n${f(hl * 100)} : ${l} = ${mi} minuten = ${duurT(mi)}.`};
});
T('A-VVG-A1', 'vvg_a1_verbruik', R => {
  const v = R.kies([5.2, 5.6, 6.4, 7]), km = R.kies([250, 350, 450]), pr = R.kies([1.75, 1.85, 1.9]);
  const w = v * km / 100 * pr;
  return {q:`Een auto verbruikt ${f(v)} liter benzine per 100 km. Benzine kost ${eur(pr)} per liter.\nHoeveel kost de benzine voor een rit van ${km} km? Rond af op 1 cent.`, velden:[geld(Math.round(w * 100) / 100)],
    u:`Verbruik: ${f(v)} × ${f(km / 100)} = ${f(v * km / 100)} liter.\nPrijs: ${f(v * km / 100)} × ${f(pr)} = ${f(w, 4)} ≈ ${eur(w)}.`};
});
T('A-VVG-A2', 'vvg_a2_procent', R => {
  const n = R.kies([20, 25, 40, 50, 80]), t = R.int(3, n - 3), w = t / n * 100; if (!Number.isInteger(w * 2)) return null;
  const ctx = R.kies([['leerlingen', 'komen te voet naar school'], ['spelers', 'scoorden al eens een doelpunt'], ['bezoekers', 'kwamen met de trein']]);
  return {q:`${t} van de ${n} ${ctx[0]} ${ctx[1]}.\nHoeveel procent van de ${ctx[0]} is dat?`, velden:[veld(w, '%')],
    u:`{{${t}|${n}}} = ${t} : ${n} = ${f(t / n, 4)} = ${f(w)} %.`};
});
T('A-VVG-A3', 'vvg_a3_koppelen', R => {
  const k = R.int(2, 6), om = R.int(0, 1), c = R.kies([12, 24, 36]);
  const tab = xs => 'x: ' + xs.join(', ') + ' → y: ';
  const xs = [1, 2, 3, 4];
  const juist = om ? tab(xs) + xs.map(x => f(c / x)).join(', ') : tab(xs) + xs.map(x => k * x).join(', ');
  const f1 = tab(xs) + xs.map(x => k + x).join(', '), f2 = om ? tab(xs) + xs.map(x => c * x).join(', ') : tab(xs) + xs.map(x => f(k * 6 / x)).join(', '), f3 = om ? tab(xs) + xs.map(x => c - x).join(', ') : tab(xs) + xs.map(x => k * x + 1).join(', ');
  return {q:`Welke tabel hoort bij de formule ${om ? `y = {{${c}|x}}` : `y = ${k}x`}?`, o:keuzes(juist, [f1, f2, f3]),
    u:om ? `Vul x in: y = ${c} : x geeft ${xs.map(x => f(c / x)).join(', ')}.` : `Vul x in: y = ${k} · x geeft ${xs.map(x => k * x).join(', ')}.`};
});
T('A-VVG-A4', 'vvg_a4_formule', R => {
  const pool = R.schud([[`y = 7x`, 'recht'], [`y = {{x|4}}`, 'recht'], [`y = {{20|x}}`, 'omgekeerd'], [`x · y = 15`, 'omgekeerd'], [`y = x + 3`, 'geen'], [`y = x²`, 'geen'], [`y = 2x − 1`, 'geen'], [`y = 0,5x`, 'recht'], [`y = {{8|x}}`, 'omgekeerd']]).slice(0, 4);
  return {q:'Welk verband hoort bij de formule? Kies telkens recht evenredig, omgekeerd evenredig of geen van beide.', sym:{palet:['recht', 'omgekeerd', 'geen'], rijen:pool.map(p => ({voor:p[0] + ':', na:'', w:p[1]}))},
    u:'Recht evenredig: y = k · x (ook y = {{x|4}} = 0,25x).\nOmgekeerd evenredig: y = {{k|x}} of x · y = k.\nEr komt een getal bij, of x staat in het kwadraat: geen van beide.'};
});
T('A-VVG-A5', 'vvg_a5_constante', R => {
  const om = R.int(0, 1);
  if (om) { const c = R.kies([18, 24, 30, 36, 60]), xs = [2, 3, 6].map(v => v * (c % 4 === 0 ? 1 : 1)); return {q:'De tabel hoort bij een omgekeerd evenredig verband.\nWat is de constante?', fig:vtab('Tabel', [['x'].concat(xs), ['y'].concat(xs.map(x => c / x))]), velden:[veld(c)], calc:false,
    u:`Bij een omgekeerd evenredig verband is x · y constant: ${xs[0]} · ${f(c / xs[0])} = ${c}.`}; }
  const k = R.kies([1.5, 2.5, 3.5, 0.4, 1.2]), xs = [2, 5, 8];
  return {q:'De tabel hoort bij een recht evenredig verband.\nWat is de evenredigheidsfactor?', fig:vtab('Tabel', [['x'].concat(xs), ['y'].concat(xs.map(x => +(k * x).toFixed(4)))]), velden:[veld(k)],
    u:`Bij een recht evenredig verband is y : x constant: ${f(k * 2)} : 2 = ${f(k)}.`};
});
T('A-VVG-A6', 'vvg_a6_opstellen', R => {
  const p = R.kies([[R.kies([24, 36, 48]), 'Een rechthoek heeft een oppervlakte van {c} cm². De lengte is l cm en de breedte is b cm.', 'l', 'b', 'de lengte l in functie van de breedte b', 'om'],
    [R.kies([120, 180, 240]), 'Een groep van x leerlingen huurt een bus voor € {c}. Elke leerling betaalt hetzelfde bedrag p.', 'p', 'x', 'het bedrag p in euro per leerling', 'om'],
    [R.kies([1.25, 2.4, 3.5]), 'Bij de bakker kost een koffiekoek € {c}. Je koopt n koffiekoeken en betaalt p euro.', 'p', 'n', 'de prijs p in euro', 'recht']]);
  const c = p[0], tk = p[1].replace('{c}', f(c));
  return {q:`${tk}\nWelke formule geeft ${p[4]}?`, o:keuzes(p[5] === 'om' ? `${p[2]} = {{${f(c)}|${p[3]}}}` : `${p[2]} = ${f(c)}${p[3]}`, p[5] === 'om' ? [`${p[2]} = ${f(c)}${p[3]}`, `${p[2]} = ${f(c)} − ${p[3]}`, `${p[2]} = {{${p[3]}|${f(c)}}}`] : [`${p[2]} = {{${f(c)}|${p[3]}}}`, `${p[2]} = ${f(c)} + ${p[3]}`, `${p[3]} = ${f(c)}${p[2]}`]),
    u:p[5] === 'om' ? `${p[2]} · ${p[3]} = ${f(c)} is constant: omgekeerd evenredig. Dus ${p[2]} = {{${f(c)}|${p[3]}}}.` : `De prijs is recht evenredig met het aantal: ${p[2]} = ${f(c)}${p[3]}.`};
});
T('A-VVG-A7', 'vvg_a7_haakjes', R => {
  const x = R.int(-6, 8), a = R.int(2, 5), b = R.int(1, 6), c = R.int(2, 7), e = R.int(1, 4); if (a === c / e || !x) return null;
  const d = a * (x - b) - c * x; /* a(x − b) = cx + d */
  if (a === c) return null;
  return {q:`Los op: ${a}(x − ${b}) = ${c}x ${d < 0 ? '−' : '+'} ${Math.abs(d)}`, velden:[veld(x, '', 'x =')], calc:false,
    u:`Haakjes uitwerken: ${a}x − ${a * b} = ${c}x ${d < 0 ? '−' : '+'} ${Math.abs(d)}.\n${a}x − ${c}x = ${minT(d)} + ${a * b}\n${mon(a - c, 'x', true)} = ${minT(d + a * b)}\nx = ${minT(x)}.\nControle: ${a}(${minT(x)} − ${b}) = ${minT(a * (x - b))} en ${c} · ${haakN(x)} ${d < 0 ? '−' : '+'} ${Math.abs(d)} = ${minT(c * x + d)}.`};
});
T('A-VVG-A7', 'vvg_a7_breuken', R => {
  const p = R.kies([[2, 3], [3, 4], [2, 5], [4, 3]]), x = p[0] * p[1] * R.int(-2, 4); if (!x) return null;
  const r = x / p[0] + x / p[1];
  return {q:`Los op: {{x|${p[0]}}} + {{x|${p[1]}}} = ${minT(r)}`, velden:[veld(x, '', 'x =')], calc:false,
    u:`Vermenigvuldig beide leden met ${p[0] * p[1]}: ${p[1]}x + ${p[0]}x = ${minT(r * p[0] * p[1])}.\n${p[0] + p[1]}x = ${minT(r * p[0] * p[1])}, dus x = ${minT(x)}.`};
});
T('A-VVG-A7', 'vvg_a7_controle', R => {
  const a = R.int(2, 5), b = R.int(2, 6), c = R.int(1, 9), x = R.int(2, 8), rhs = a * (x + b) + c;
  return {q:`${R.naam()} lost ${a}(x + ${b}) + ${c} = ${rhs} op:\nstap 1: ${a}x + ${b} + ${c} = ${rhs}\nstap 2: ${a}x = ${rhs - b - c}\nstap 3: x = ${f((rhs - b - c) / a, 2)}\nIn welke stap zit de eerste fout?`, ...vasteKeuze('stap 1', ['stap 1', 'stap 2', 'stap 3', 'Er zit geen fout in.']),
    u:`In stap 1 moet ${a} met beide termen tussen de haakjes vermenigvuldigd worden: ${a}x + ${a * b}.\nJuist: ${a}x + ${a * b} + ${c} = ${rhs}, ${a}x = ${a * x}, x = ${x}.`};
});
T('A-VVG-A8', 'vvg_a8_opstellen', R => {
  const k = R.int(6, 14), v = R.int(2, 6), nv = R.int(2, 3), nk = R.int(2, 4), tot = nv * (k + v) + nk * k;
  return {q:`Een ticket voor een volwassene kost € ${v} meer dan een ticket voor een kind. Een gezin met ${nv} ${nv === 1 ? 'volwassene' : 'volwassenen'} en ${nk} kinderen betaalt € ${tot}. Noem x de prijs voor een kind.\nWelke vergelijking past?`,
    o:keuzes(`${nv === 1 ? '' : nv}(x + ${v}) + ${nk}x = ${tot}`.replace(/^\((.*?)\)/, '$1'), [`${nv}x + ${v} + ${nk}x = ${tot}`.replace(/^1x/, 'x'), `${nv === 1 ? '' : nv}(x − ${v}) + ${nk}x = ${tot}`.replace(/^\((.*?)\)/, '$1'), `${nv + nk}x = ${tot}`]),
    u:`Een volwassene betaalt x + ${v}. ${nv} ${nv === 1 ? 'volwassene' : 'volwassenen'}: ${nv === 1 ? '' : nv}(x + ${v}). ${nk} kinderen: ${nk}x.\nSamen: ${nv === 1 ? 'x + ' + v : nv + '(x + ' + v + ')'} + ${nk}x = ${tot}. Oplossing: x = ${k}.`};
});
T('A-VVG-A8', 'vvg_a8_oplossen', R => {
  const n = R.int(10, 40), soort = R.kies([['opeenvolgende natuurlijke getallen', 1], ['opeenvolgende even getallen', 2]]);
  const a = soort[1] === 2 ? 2 * n : n, s = 3 * a + 3 * soort[1];
  return {q:`De som van drie ${soort[0]} is ${s}.\nWat is het grootste getal?`, velden:[veld(a + 2 * soort[1])],
    u:`Noem het kleinste getal x: x + (x + ${soort[1]}) + (x + ${2 * soort[1]}) = ${s}.\n3x + ${3 * soort[1]} = ${s}, dus 3x = ${s - 3 * soort[1]} en x = ${a}.\nHet grootste getal is ${a + 2 * soort[1]}.`};
});
/* ---------- Meetkundige objecten en relaties (dieptethema, A-stroom) ----------
   D: driehoek, vierhoek, veelhoek, bol; een lijnstuk meten; een vak op een rooster (letter-cijfer)
   C: soorten driehoeken, vierhoeken en ruimtefiguren; evenwijdige ribben; een ontvouwing herkennen
   B: vlak of ruimte; begrippen in een figuur; een scherpe hoek meten; aanzichten onderscheiden; een figuur vervolledigen
   A: een stompe hoek meten; symmetrie; snijdende en kruisende rechten; een aanzicht bedenken; bijzondere lijnen; coördinaten */
koppel('A', `
m09=A-MOR-C1 m11=A-MOR-B2 k7=A-MOR-B6 k3=A-MOR-A8 t_klikcoord=A-MOR-A8 m08=A-MOR-A8 k4=A-MOR-A9
`);

/* ===== bibliotheek met vlakke figuren en ruimtefiguren (in een vak van 110 op 105) ===== */
const VORM2 = {
  'gelijkzijdige driehoek':[[15, 90], [95, 90], [55, 20.7]], 'gelijkbenige driehoek':[[28, 92], [82, 92], [55, 8]], 'rechthoekige driehoek':[[20, 92], [98, 92], [20, 22]],
  'stomphoekige driehoek':[[6, 92], [62, 92], [104, 40]], 'scherphoekige driehoek':[[12, 92], [96, 92], [64, 18]],
  vierkant:[[20, 22], [90, 22], [90, 92], [20, 92]], rechthoek:[[4, 38], [106, 38], [106, 88], [4, 88]], ruit:[[55, 6], [92, 52], [55, 98], [18, 52]],
  parallellogram:[[4, 86], [76, 86], [106, 30], [34, 30]], trapezium:[[4, 88], [106, 88], [76, 32], [22, 32]], vlieger:[[55, 8], [88, 38], [55, 100], [22, 38]],
  vijfhoek:[0, 1, 2, 3, 4].map(i => [55 + 46 * Math.sin(i * 2 * Math.PI / 5), 56 - 46 * Math.cos(i * 2 * Math.PI / 5)]),
  zeshoek:[0, 1, 2, 3, 4, 5].map(i => [55 + 46 * Math.sin(i * Math.PI / 3), 54 - 46 * Math.cos(i * Math.PI / 3)]),
  'onregelmatige vijfhoek':[[10, 80], [50, 96], [100, 70], [80, 18], [26, 30]]
};
const RECHT2 = {'rechthoekige driehoek':0, vierkant:0, rechthoek:0};
const stippel = 'stroke-dasharray="5 4"';
const lijnS = (a, b, d) => '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="var(--inkt)" stroke-width="2.2" stroke-linecap="round"' + (d ? ' ' + stippel : '') + '/>';
function vorm(naam, x, y) {
  const T0 = p => [p[0] + x, p[1] + y];
  if (VORM2[naam]) {
    const pts = VORM2[naam].map(T0);
    let s = '<polygon points="' + pts.map(pt2).join(' ') + '" fill="var(--k1)" fill-opacity=".18" stroke="var(--inkt)" stroke-width="2.2" stroke-linejoin="round"/>';
    if (naam === 'rechthoekige driehoek') s += rhoek(pts[0], pts[1], pts[2]);
    if (naam === 'vierkant' || naam === 'rechthoek') s += rhoek(pts[3], pts[2], pts[0]);
    return s;
  }
  const P = (a, b) => [a + x, b + y];
  if (naam === 'cirkel') return '<circle cx="' + (x + 55) + '" cy="' + (y + 54) + '" r="44" fill="var(--k1)" fill-opacity=".18" stroke="var(--inkt)" stroke-width="2.2"/>';
  if (naam === 'bol') return '<circle cx="' + (x + 55) + '" cy="' + (y + 54) + '" r="44" fill="var(--k1)" fill-opacity=".18" stroke="var(--inkt)" stroke-width="2.2"/><path d="M' + (x + 11) + ',' + (y + 54) + ' A44,13 0 0 0 ' + (x + 99) + ',' + (y + 54) + '" fill="none" stroke="var(--inkt)" stroke-width="1.6"/><path d="M' + (x + 11) + ',' + (y + 54) + ' A44,13 0 0 1 ' + (x + 99) + ',' + (y + 54) + '" fill="none" stroke="var(--inkt)" stroke-width="1.4" ' + stippel + '/>';
  if (naam === 'kubus' || naam === 'balk') {
    const w = naam === 'kubus' ? 60 : 78, h = naam === 'kubus' ? 60 : 40, d = naam === 'kubus' ? [28, -24] : [24, -20], o = [8, 98];
    const A = P(o[0], o[1]), B = P(o[0] + w, o[1]), C = [B[0] + d[0], B[1] + d[1]], D = [A[0] + d[0], A[1] + d[1]];
    const E = [A[0], A[1] - h], F = [B[0], B[1] - h], G = [C[0], C[1] - h], H = [D[0], D[1] - h];
    return '<polygon points="' + [A, B, C, G, H, E].map(pt2).join(' ') + '" fill="var(--k1)" fill-opacity=".18"/>' + [[A, B], [B, C], [E, F], [F, G], [G, H], [H, E], [A, E], [B, F], [C, G]].map(l => lijnS(l[0], l[1])).join('') + [[A, D], [D, C], [D, H]].map(l => lijnS(l[0], l[1], 1)).join('');
  }
  if (naam === 'cilinder') return '<path d="M' + (x + 20) + ',' + (y + 22) + ' V' + (y + 86) + ' A35,11 0 0 0 ' + (x + 90) + ',' + (y + 86) + ' V' + (y + 22) + '" fill="var(--k1)" fill-opacity=".18" stroke="var(--inkt)" stroke-width="2.2"/><ellipse cx="' + (x + 55) + '" cy="' + (y + 22) + '" rx="35" ry="11" fill="var(--k1)" fill-opacity=".1" stroke="var(--inkt)" stroke-width="2.2"/><path d="M' + (x + 20) + ',' + (y + 86) + ' A35,11 0 0 1 ' + (x + 90) + ',' + (y + 86) + '" fill="none" stroke="var(--inkt)" stroke-width="1.6" ' + stippel + '/>';
  if (naam === 'kegel') return '<path d="M' + (x + 20) + ',' + (y + 86) + ' L' + (x + 55) + ',' + (y + 8) + ' L' + (x + 90) + ',' + (y + 86) + ' A35,11 0 0 1 ' + (x + 20) + ',' + (y + 86) + '" fill="var(--k1)" fill-opacity=".18" stroke="var(--inkt)" stroke-width="2.2" stroke-linejoin="round"/><path d="M' + (x + 20) + ',' + (y + 86) + ' A35,11 0 0 1 ' + (x + 90) + ',' + (y + 86) + '" fill="none" stroke="var(--inkt)" stroke-width="1.6" ' + stippel + '/>';
  if (naam === 'piramide') {
    const A = P(8, 94), B = P(74, 94), C = P(102, 70), D = P(36, 70), T1 = P(56, 8);
    return '<polygon points="' + [A, B, C, T1].map(pt2).join(' ') + '" fill="var(--k1)" fill-opacity=".18"/>' + [[A, B], [B, C], [A, T1], [B, T1], [C, T1]].map(l => lijnS(l[0], l[1])).join('') + [[A, D], [D, C], [D, T1]].map(l => lijnS(l[0], l[1], 1)).join('');
  }
  if (naam === 'prisma') {
    const A = P(10, 94), B = P(70, 94), C = P(44, 72), d = [30, -52];
    const D = [A[0] + d[0], A[1] + d[1]], E = [B[0] + d[0], B[1] + d[1]], F = [C[0] + d[0], C[1] + d[1]];
    return '<polygon points="' + [A, B, E, F, D].map(pt2).join(' ') + '" fill="var(--k1)" fill-opacity=".18"/>' + [[A, B], [B, E], [A, D], [D, E], [E, F], [F, D]].map(l => lijnS(l[0], l[1])).join('') + [[A, C], [C, B], [C, F]].map(l => lijnS(l[0], l[1], 1)).join('');
  }
  return '';
}
/* rij figuren met een letter eronder */
function vormenRij(namen, alt) {
  /* hoogstens 3 figuren per rij, zodat ze groot genoeg blijven */
  const L = 'ABCDEF', per = namen.length === 4 ? 2 : Math.min(3, namen.length), rijen = Math.ceil(namen.length / per);
  return fig('0 0 ' + (per * 124 + 6) + ' ' + rijen * 132, namen.map((n, i) => { const x = (i % per) * 124, y = Math.floor(i / per) * 132; return vorm(n, 8 + x, 4 + y) + (namen.length > 1 ? tekst([63 + x, 126 + y], '<tspan font-weight="700">' + L[i] + '</tspan>') : ''); }).join(''), alt || 'Figuren ' + L.slice(0, namen.length).split('').join(', ') + '.');
}
/* meerkeuze met figuren: de juiste naam is de letter van die figuur */
function kiesVorm(R, juist, pool, n) {
  const fout = R.schud(pool.filter(p => p !== juist)).slice(0, (n || 4) - 1), namen = R.schud([juist].concat(fout)), L = 'ABCDEF', i = namen.indexOf(juist);
  return Object.assign({namen, letter:L[i], fig:vormenRij(namen)}, letterKeuze(namen.length, i, 'figuur '));
}
const VLAK = ['gelijkzijdige driehoek', 'gelijkbenige driehoek', 'rechthoekige driehoek', 'stomphoekige driehoek', 'scherphoekige driehoek', 'vierkant', 'rechthoek', 'ruit', 'parallellogram', 'trapezium', 'vlieger', 'vijfhoek', 'zeshoek', 'cirkel', 'onregelmatige vijfhoek'];
const RUIMTE = ['kubus', 'balk', 'cilinder', 'kegel', 'piramide', 'bol', 'prisma'];

/* balk ABCD-EFGH met letters; extra: gekleurde veelhoek (letters) of dikke lijnen */
const BALKP = {A:[40, 172], B:[210, 172], C:[270, 122], D:[100, 122], E:[40, 72], F:[210, 72], G:[270, 22], H:[100, 22]};
function balkFig(vlak, dik) {
  const P = BALKP, verborgen = ['AD', 'DC', 'DH'];
  let s = '';
  if (vlak) s += '<polygon points="' + vlak.split('').map(l => pt2(P[l])).join(' ') + '" fill="var(--k2)" fill-opacity=".45" stroke="none"/>';
  ['AB', 'BC', 'CD', 'DA', 'EF', 'FG', 'GH', 'HE', 'AE', 'BF', 'CG', 'DH'].forEach(r => { s += lijnS(P[r[0]], P[r[1]], verborgen.indexOf(r) >= 0 || verborgen.indexOf(r[1] + r[0]) >= 0); });
  (dik || []).forEach(r => { s += '<line x1="' + P[r[0]][0] + '" y1="' + P[r[0]][1] + '" x2="' + P[r[1]][0] + '" y2="' + P[r[1]][1] + '" stroke="#C8372D" stroke-width="4.5" stroke-linecap="round"/>'; });
  const off = {A:[-14, 16], B:[8, 16], C:[10, 10], D:[-16, 4], E:[-16, -4], F:[-4, -10], G:[10, -4], H:[-16, -6]};
  Object.keys(P).forEach(l => { s += tekst([P[l][0] + off[l][0], P[l][1] + off[l][1]], '<tspan font-weight="700">' + l + '</tspan>'); });
  return fig('0 0 300 200', s, 'Balk ABCDEFGH in perspectief. ABCD is het grondvlak, EFGH het bovenvlak.' + (vlak ? ' Het vlak ' + vlak + ' is gekleurd.' : ''));
}
const RIBBEN = ['AB', 'BC', 'CD', 'AD', 'EF', 'FG', 'GH', 'EH', 'AE', 'BF', 'CG', 'DH'];
const RICHTING = r => ({AB:0, DC:0, CD:0, EF:0, HG:0, GH:0, BC:1, AD:1, FG:1, EH:1, AE:2, BF:2, CG:2, DH:2})[r];
const vlakVan = (a, b) => { const fs = ['ABCD', 'EFGH', 'ABFE', 'DCGH', 'ADHE', 'BCGF']; return fs.some(v => a.split('').concat(b.split('')).every(l => v.indexOf(l) >= 0)); };
const ligging = (a, b) => RICHTING(a) === RICHTING(b) ? 'evenwijdig' : a.split('').some(l => b.indexOf(l) >= 0) ? 'snijdend' : vlakVan(a, b) ? 'evenwijdig' : 'kruisend';

/* liniaal met een lijnstuk erboven (van a tot b cm) */
function liniaal(a, b) {
  const X = c => 20 + c * 36; let s = '<rect x="10" y="60" width="' + (X(10) + 10) + '" height="46" rx="4" fill="#f3e9c6" stroke="var(--inkt2)" stroke-width="1.2"/>';
  for (let m = 0; m <= 100; m++) { const l = m % 10 ? (m % 5 ? 8 : 13) : 18; s += '<line x1="' + X(m / 10).toFixed(1) + '" y1="60" x2="' + X(m / 10).toFixed(1) + '" y2="' + (60 + l) + '" stroke="var(--inkt)" stroke-width="' + (m % 10 ? .8 : 1.4) + '"/>'; if (!(m % 10)) s += tekst([X(m / 10), 98], String(m / 10)); }
  s += '<line x1="' + X(a) + '" y1="40" x2="' + X(b) + '" y2="40" stroke="#C8372D" stroke-width="3"/>' + stip([X(a), 40], 'A', -2, -10) + stip([X(b), 40], 'B', 2, -10);
  s += '<line x1="' + X(a) + '" y1="40" x2="' + X(a) + '" y2="60" stroke="var(--inkt2)" stroke-dasharray="3 3"/><line x1="' + X(b) + '" y1="40" x2="' + X(b) + '" y2="60" stroke="var(--inkt2)" stroke-dasharray="3 3"/>';
  return fig('0 0 ' + (X(10) + 30) + ' 112', s, 'Liniaal in cm met mm-streepjes en het lijnstuk AB erboven.');
}

/* blokkenbouwsels: h[r][c] = hoogte (r = 0 vooraan) */
function bouwFig(h) {
  const s0 = 34, dx = 17, dy = -14, R0 = h.length, C0 = h[0].length; let s = '';
  const ox = 20, oy = 40 + (Math.max.apply(null, h.map(r => Math.max.apply(null, r)))) * s0 + R0 * -dy;
  for (let r = R0 - 1; r >= 0; r--) for (let c = 0; c < C0; c++) for (let k = 0; k < h[r][c]; k++) {
    const x = ox + c * s0 + r * dx, y = oy - k * s0 + r * dy;
    s += '<polygon points="' + [[x, y], [x + s0, y], [x + s0, y - s0], [x, y - s0]].map(pt2).join(' ') + '" fill="#9fdcde" stroke="var(--inkt)" stroke-width="1.5"/>';
    s += '<polygon points="' + [[x, y - s0], [x + s0, y - s0], [x + s0 + dx, y - s0 + dy], [x + dx, y - s0 + dy]].map(pt2).join(' ') + '" fill="#e6f6f6" stroke="var(--inkt)" stroke-width="1.5"/>';
    s += '<polygon points="' + [[x + s0, y], [x + s0 + dx, y + dy], [x + s0 + dx, y - s0 + dy], [x + s0, y - s0]].map(pt2).join(' ') + '" fill="#5fb9bc" stroke="var(--inkt)" stroke-width="1.5"/>';
  }
  s += tekst([ox + C0 * s0 / 2, oy + 26], 'vooraan');
  return fig('0 0 ' + (ox + C0 * s0 + R0 * dx + 24) + ' ' + (oy + 34), s, 'Bouwsel van kubusjes in perspectief.');
}
const aanzicht = (h, soort) => soort === 'voor' ? h[0].map((x, c) => Math.max.apply(null, h.map(r => r[c]))) : soort === 'zij' ? h.map(r => Math.max.apply(null, r)) : null;
/* tekening van een aanzicht: kolomhoogtes (voor/zij) of een bovenaanzicht (rijen) */
function aanzichtSvg(x0, a, top, l) {
  const s0 = 18; let s = '';
  if (top) top.forEach((rij, r) => rij.forEach((v, c) => { if (v) s += '<rect x="' + (x0 + c * s0) + '" y="' + (100 - (r + 1) * s0) + '" width="' + s0 + '" height="' + s0 + '" fill="#9fdcde" stroke="var(--inkt)" stroke-width="1.4"/>'; }));
  else a.forEach((v, c) => { for (let k = 0; k < v; k++) s += '<rect x="' + (x0 + c * s0) + '" y="' + (100 - (k + 1) * s0) + '" width="' + s0 + '" height="' + s0 + '" fill="#9fdcde" stroke="var(--inkt)" stroke-width="1.4"/>'; });
  return s + tekst([x0 + 30, 122], '<tspan font-weight="700">' + l + '</tspan>');
}
function maakBouw(R) {
  const rij = R.int(2, 3), kol = R.int(2, 3), h = [];
  for (let r = 0; r < rij; r++) { h.push([]); for (let c = 0; c < kol; c++) h[r].push(R.int(r === 0 && c === 0 ? 1 : 0, 3)); }
  if (h.some(r => r.every(x => !x)) || h[0].every(x => !x)) return null;
  return h;
}

/* ===== D ===== */
T('A-MOR-D1', 'mor_d1_soort', R => {
  const p = R.kies([['driehoek', VLAK.filter(v => /driehoek/.test(v)), ['vierkant', 'rechthoek', 'ruit', 'parallellogram', 'trapezium', 'vijfhoek', 'cirkel']], ['vierhoek', ['vierkant', 'rechthoek', 'ruit', 'parallellogram', 'trapezium', 'vlieger'], ['gelijkbenige driehoek', 'vijfhoek', 'zeshoek', 'cirkel', 'rechthoekige driehoek']],
    ['bol', ['bol'], ['cirkel', 'cilinder', 'kegel', 'kubus']], ['veelhoek met vijf zijden', ['vijfhoek', 'onregelmatige vijfhoek'], ['zeshoek', 'vierkant', 'cirkel', 'trapezium', 'gelijkzijdige driehoek']]]);
  const juist = R.kies(p[1]), k = kiesVorm(R, juist, p[2].concat([juist]));
  return {q:`Welke figuur is een ${p[0]}?`, fig:k.fig, o:k.o, volgorde:k.volgorde, u:`Figuur ${k.letter} is een ${juist}${juist === p[0] ? '' : ', dat is een ' + p[0]}.`};
});
T('A-MOR-D2', 'mor_d2_meten', R => {
  const a = R.int(0, 30) / 10, b = +(a + R.int(25, 65) / 10).toFixed(1); if (b > 9.8) return null;
  return {q:'Hoe lang is het lijnstuk [AB]? Lees nauwkeurig af tot op 1 mm.', fig:liniaal(a, b), velden:[veld(+(b - a).toFixed(1), 'cm')], calc:false,
    u:a === 0 ? `A staat bij 0. B staat bij ${f(b)} cm.` : `A staat bij ${f(a)} cm, niet bij 0. B staat bij ${f(b)} cm.\nDe lengte is ${f(b)} − ${f(a)} = ${f(b - a)} cm.`};
});
T('A-MOR-D3', 'mor_d3_vak', R => {
  const kol = 'ABCDEF', c = R.kies(kol.split('')), r = R.int(1, 5);
  return {q:`Klik op het vak ${c}${r}.`, cel:{kol, rij:5, w:[c + r]}, u:`Zoek eerst de kolom ${c} (de letter bovenaan) en dan de rij ${r} (het cijfer links).`};
});
T('A-MOR-D3', 'mor_d3_plan', R => {
  const kol = 'ABCDE', dingen = R.schud(['🌳', '⛲', '🏠', '⚽', '🚲']).slice(0, 3), cellen = R.schud(['A1', 'B3', 'C2', 'D4', 'E1', 'A4', 'C4', 'E3', 'B1', 'D2']).slice(0, 3);
  const nm = {'🌳':'de boom', '⛲':'de fontein', '🏠':'het huis', '⚽':'de bal', '🚲':'de fiets'}, i = R.int(0, 2);
  return {q:`In welk vak staat ${nm[dingen[i]]}?`, fig:{t:'tab', titel:'Plan', kop:[''].concat(kol.split('')), rijen:[1, 2, 3, 4].map(r => [String(r)].concat(kol.split('').map(k => { const j = cellen.indexOf(k + r); return j >= 0 ? dingen[j] : ''; })))},
    o:keuzes(cellen[i], [cellen[(i + 1) % 3], cellen[(i + 2) % 3], R.kies(['A2', 'B2', 'C3', 'D1', 'E4', 'E2'].filter(x => cellen.indexOf(x) < 0))]),
    u:`${nm[dingen[i]][0].toUpperCase() + nm[dingen[i]].slice(1)} staat in kolom ${cellen[i][0]} en rij ${cellen[i][1]}: vak ${cellen[i]}. Eerst de letter, dan het cijfer.`};
});

/* ===== C ===== */
T('A-MOR-C1', 'mor_c1_soort', R => {
  const juist = R.kies(VLAK.slice(0, 11).concat(RUIMTE.slice(0, 5)).concat(['cirkel'])), pool = RUIMTE.indexOf(juist) >= 0 ? RUIMTE : VLAK.slice(0, 11).concat(['cirkel']);
  const naast = /driehoek/.test(juist) ? VLAK.filter(v => /driehoek/.test(v)) : /^(vierkant|rechthoek|ruit|parallellogram|trapezium|vlieger)$/.test(juist) ? ['vierkant', 'rechthoek', 'ruit', 'parallellogram', 'trapezium', 'vlieger'] : pool;
  const k = kiesVorm(R, juist, naast);
  return {q:`Welke figuur is een ${juist}?`, fig:k.fig, o:k.o, volgorde:k.volgorde, u:`Figuur ${k.letter} is een ${juist}.` + (/driehoek/.test(juist) ? '\nKijk naar de hoeken (scherp, recht of stomp) en naar de zijden (even lang of niet).' : '')};
});
T('A-MOR-C2', 'mor_c2_evenwijdig', R => {
  const r = R.kies(RIBBEN), juist = R.kies(RIBBEN.filter(x => x !== r && RICHTING(x) === RICHTING(r))), fout = R.schud(RIBBEN.filter(x => RICHTING(x) !== RICHTING(r))).slice(0, 3);
  return {q:`Bekijk de balk. Welke ribbe is evenwijdig met [${r}]?`, fig:balkFig(null, [r]), o:keuzes(`[${juist}]`, fout.map(x => `[${x}]`)),
    u:`[${r}] heeft dezelfde richting als ${RIBBEN.filter(x => x !== r && RICHTING(x) === RICHTING(r)).map(x => '[' + x + ']').join(', ')}. Die ribben zijn evenwijdig met [${r}].`};
});
T('A-MOR-C3', 'mor_c3_net', R => {
  const nets = {kubus:{c:[[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]]}, balk:null, cilinder:null, piramide:null};
  const soort = R.kies(['kubus', 'cilinder', 'piramide', 'prisma']); let s = '';
  if (soort === 'kubus') { const vs = R.kies([[[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]], [[1, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2]].map(p => p)]); vs.forEach(p => { s += '<rect x="' + (20 + p[0] * 40) + '" y="' + (10 + p[1] * 40) + '" width="40" height="40" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/>'; }); }
  if (soort === 'cilinder') s = '<rect x="40" y="40" width="160" height="60" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/><circle cx="90" cy="20" r="19" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/><circle cx="150" cy="120" r="19" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/>';
  if (soort === 'piramide') s = '<polygon points="90,50 140,50 140,100 90,100" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/>' + [[[90, 50], [140, 50], [115, 8]], [[140, 50], [140, 100], [182, 75]], [[90, 100], [140, 100], [115, 142]], [[90, 50], [90, 100], [48, 75]]].map(t => '<polygon points="' + t.map(pt2).join(' ') + '" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/>').join('');
  if (soort === 'prisma') s = '<rect x="40" y="50" width="150" height="40" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/><rect x="40" y="90" width="150" height="40" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/><rect x="40" y="10" width="150" height="40" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/><polygon points="40,50 40,90 5,70" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/><polygon points="190,50 190,90 225,70" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/>';
  return {q:'Je plooit deze ontvouwing dicht.\nWelke ruimtefiguur krijg je?', fig:fig('0 0 240 150', s, 'Ontvouwing van een ruimtefiguur.'), o:keuzes(soort, R.schud(['kubus', 'cilinder', 'piramide', 'prisma', 'kegel'].filter(x => x !== soort))),
    u:{kubus:'Zes even grote vierkanten: een kubus.', cilinder:'Een rechthoek met twee cirkels: een cilinder.', piramide:'Een vierkant grondvlak met vier driehoeken die samenkomen in de top: een piramide.', prisma:'Twee driehoeken (grondvlak en bovenvlak) en drie rechthoeken: een driezijdig prisma.'}[soort]};
});

/* ===== B ===== */
T('A-MOR-B1', 'mor_b1_ruimte', R => {
  const r = R.schud(RUIMTE).slice(0, R.int(2, 3)), v = R.schud(['cirkel', 'vierkant', 'rechthoek', 'zeshoek', 'gelijkzijdige driehoek', 'ruit']).slice(0, 5 - r.length);
  const namen = R.schud(r.concat(v)), L = 'ABCDEF';
  return {q:'Welke figuren zijn ruimtefiguren? Duid alle juiste figuren aan.', fig:vormenRij(namen), o:namen.map((x, i) => 'figuur ' + L[i]), mk:namen.map((x, i) => r.indexOf(x) >= 0 ? i : -1).filter(i => i >= 0), vast:true,
    u:'Ruimtefiguren hebben een lengte, een breedte en een hoogte: ' + namen.map((x, i) => r.indexOf(x) >= 0 ? L[i] + ' (' + x + ')' : '').filter(Boolean).join(', ') + '.\nDe andere figuren liggen in een vlak.'};
});
T('A-MOR-B2', 'mor_b2_begrip', R => {
  const soort = R.kies(['lijnstuk', 'halfrechte', 'middelloodlijn', 'bissectrice', 'overstaande hoeken', 'aanliggende hoeken', 'loodrechte rechten', 'straal']);
  let s = '';
  if (soort === 'lijnstuk') s = lijnS([30, 80], [210, 40]) + stip([30, 80], 'A', -10, 18) + stip([210, 40], 'B', 10, -6);
  if (soort === 'halfrechte') s = lijnS([30, 80], [250, 31]) + stip([30, 80], 'A', -10, 18) + stip([140, 55.5], 'B', 4, -10);
  if (soort === 'middelloodlijn') s = lijnS([40, 70], [200, 70]) + stip([40, 70], 'A', -10, 18) + stip([200, 70], 'B', 10, 18) + '<line x1="120" y1="8" x2="120" y2="128" stroke="#C8372D" stroke-width="2.4"/>' + rhoek([120, 70], [200, 70], [120, 8]) + '<path d="M78,64 v12 M82,64 v12 M158,64 v12 M162,64 v12" stroke="var(--inkt)" stroke-width="1.6"/>';
  if (soort === 'bissectrice') s = lijnS([40, 120], [240, 120]) + lijnS([40, 120], [190, 20]) + '<line x1="40" y1="120" x2="240" y2="64" stroke="#C8372D" stroke-width="2.4"/>' + boogje([40, 120], [240, 120], [240, 64], 50) + boogje([40, 120], [240, 64], [190, 20], 60, '#1fa6ab');
  if (soort === 'overstaande hoeken' || soort === 'aanliggende hoeken') { s = lijnS([30, 120], [230, 20]) + lijnS([30, 30], [230, 110]); const M = [130, 70]; s += soort === 'overstaande hoeken' ? boogje(M, [230, 20], [230, 110], 26) + boogje(M, [30, 120], [30, 30], 26) : boogje(M, [230, 20], [230, 110], 26) + boogje(M, [230, 110], [30, 120], 34, '#E8A10C'); }
  if (soort === 'loodrechte rechten') s = lijnS([40, 110], [220, 30]) + lijnS([86, 20], [150, 164]) + rhoek([129.7, 70.1], [220, 30], [150, 164]);
  if (soort === 'straal') s = '<circle cx="120" cy="70" r="58" fill="none" stroke="var(--inkt)" stroke-width="2.2"/>' + '<line x1="120" y1="70" x2="170" y2="41" stroke="#C8372D" stroke-width="2.6"/>' + stip([120, 70], 'M', -12, 6);
  const alle = ['lijnstuk', 'halfrechte', 'middelloodlijn', 'bissectrice', 'overstaande hoeken', 'aanliggende hoeken', 'loodrechte rechten', 'straal', 'rechte'];
  return {q:soort === 'middelloodlijn' || soort === 'bissectrice' || soort === 'straal' ? 'Wat stelt de rode lijn voor?' : soort.indexOf('hoeken') > 0 ? 'Hoe noem je de twee aangeduide hoeken?' : 'Wat is getekend?', fig:fig('0 0 260 170', s, 'Figuur met lijnen en hoeken.'), o:keuzes(soort, R.schud(alle.filter(x => x !== soort))),
    u:{lijnstuk:'Een lijnstuk heeft twee eindpunten: [AB].', halfrechte:'Een halfrechte heeft één beginpunt A en loopt aan de andere kant oneindig ver door: [AB.', middelloodlijn:'De rode rechte staat loodrecht op [AB] en gaat door het midden (zie de streepjes): de middelloodlijn.', bissectrice:'De rode halfrechte verdeelt de hoek in twee gelijke hoeken: de bissectrice.',
      'overstaande hoeken':'Twee hoeken met hetzelfde hoekpunt, tegenover elkaar, waarvan de benen in elkaars verlengde liggen: overstaande hoeken.', 'aanliggende hoeken':'Twee hoeken met hetzelfde hoekpunt en een gemeenschappelijk been, die naast elkaar liggen: aanliggende hoeken.', 'loodrechte rechten':'De rechten snijden elkaar onder een rechte hoek (het L-teken): ze staan loodrecht op elkaar.', straal:'De rode lijn verbindt het middelpunt M met een punt van de cirkel: een straal.'}[soort]};
});
T('A-MOR-B3', 'mor_b3_scherp', R => {
  const a1 = R.int(0, 1) ? 0 : R.stap(10, 50, 5), h = R.stap(20, 85, 1), a2 = a1 + h;
  return {q:'Hoe groot is de rode hoek? Lees af op de gradenboog.', fig:gradenboog(a1, a2), velden:[veld(h, '°')], calc:false,
    u:a1 === 0 ? `Eén been ligt op 0. Lees het andere been af op dezelfde schaal: ${h}°.` : `De benen wijzen naar ${a1}° en ${a2}° op dezelfde schaal. ${a2}° − ${a1}° = ${h}°.\nControle: de hoek is scherp, dus kleiner dan 90°.`};
});
T('A-MOR-B4', 'mor_b4_vlak', R => {
  const p = R.kies([['ACGE', 'rechthoek'], ['ABGH', 'rechthoek'], ['BCHE', 'rechthoek'], ['ABG', 'rechthoekige driehoek'], ['EFC', 'rechthoekige driehoek'], ['ADG', 'rechthoekige driehoek']]);
  return {q:`Bekijk de balk. Het vlak ${p[0]} is gekleurd.\nWelke vorm heeft dat vlak in werkelijkheid?`, fig:balkFig(p[0]), o:keuzes(p[1], ['parallellogram', 'trapezium', 'scherphoekige driehoek', 'ruit', 'gelijkzijdige driehoek'].filter(x => x !== p[1]).slice(0, 3)),
    u:p[1] === 'rechthoek' ? `De zijden van ${p[0]} zijn twee aan twee evenwijdig en de hoeken zijn recht. In perspectief lijkt het een parallellogram, maar in werkelijkheid is het een rechthoek.` : `Eén zijde van ${p[0]} is een ribbe die loodrecht staat op het vlak waarin de andere zijde ligt. Er is dus een rechte hoek: een rechthoekige driehoek.`};
});
T('A-MOR-B5', 'mor_b5_welk', R => {
  const h = maakBouw(R); if (!h) return null;
  const soort = R.kies(['voor', 'zij', 'boven']), naam = {voor:'het vooraanzicht', zij:'het zijaanzicht (van rechts)', boven:'het bovenaanzicht'};
  const tek = soort === 'boven' ? aanzichtSvg(10, null, h.map(r => r.map(x => x > 0)), '') : aanzichtSvg(10, aanzicht(h, soort), null, '');
  if (soort !== 'boven' && JSON.stringify(aanzicht(h, 'voor')) === JSON.stringify(aanzicht(h, 'zij'))) return null;
  return {q:'Hiernaast zie je een bouwsel en een tekening van een aanzicht.\nWelk aanzicht is getekend?', fig:{t:'svg', vb:'0 0 340 230', html:'<g>' + bouwFig(h).html + '</g><g transform="translate(240 50)">' + tek + '</g>', alt:'Bouwsel en een tekening van een aanzicht.'},
    o:keuzes(naam[soort], Object.keys(naam).filter(k => k !== soort).map(k => naam[k])), u:`Het vooraanzicht toont de hoogste toren per kolom van voren gezien, het zijaanzicht de hoogste toren per rij van opzij gezien, het bovenaanzicht welke vakjes bezet zijn.\nDeze tekening is ${naam[soort]}.`};
});
T('A-MOR-B6', 'mor_b6_vervolledig', R => {
  const soort = R.kies(['parallellogram', 'rechthoek', 'vierkant']), x0 = R.int(1, 3), y0 = R.int(1, 2), a = R.int(3, 5), b = soort === 'vierkant' ? a : R.int(2, 3), sh = soort === 'parallellogram' ? R.int(1, 2) : 0;
  const A = {x:x0, y:y0}, B = {x:x0 + a, y:y0}, C = {x:x0 + a + sh, y:y0 + b}, D = {x:x0 + sh, y:y0 + b};
  if (C.x > 9 || C.y > 6) return null;
  return {q:`ABCD is een ${soort}. De punten A, B en C staan al op het rooster.\nKlik op de plaats van punt D.`, rooster:{xmin:0, xmax:9, ymin:0, ymax:6, punten:[{x:A.x, y:A.y, l:'A'}, {x:B.x, y:B.y, l:'B'}, {x:C.x, y:C.y, l:'C'}], figuren:[{pts:[A, B, C], open:true, kl:1}]}, w:D,
    u:`In een ${soort} is [AD] evenwijdig met en even lang als [BC]. Vanuit A ga je dus evenveel hokjes opzij en naar boven als van B naar C. Daar ligt D.`};
});
T('A-MOR-B7', 'mor_b7_vakken', R => {
  const kol = 'ABCDEF', w = R.schud(['A2', 'B4', 'C1', 'D3', 'E5', 'F2', 'B1', 'C5', 'E3', 'A5', 'D1', 'F4']).slice(0, R.int(3, 4));
  return {q:`Kleur de vakken ${w.slice(0, -1).join(', ')} en ${w[w.length - 1]}. Klik ze allemaal aan.`, cel:{kol, rij:5, w, meer:true}, u:'Telkens eerst de kolom (letter), dan de rij (cijfer): ' + w.join(', ') + '.'};
});

/* ===== A ===== */
T('A-MOR-A1', 'mor_a1_stomp', R => {
  const a1 = R.int(0, 1) ? 0 : R.stap(5, 30, 5), h = R.stap(95, 170, 1), a2 = a1 + h; if (a2 > 178) return null;
  return {q:'Hoe groot is de rode hoek? Lees af op de gradenboog.', fig:gradenboog(a1, a2), velden:[veld(h, '°')], calc:false,
    u:(a1 === 0 ? `Eén been ligt op 0. Lees het andere been af op dezelfde schaal: ${h}°.` : `De benen wijzen naar ${a1}° en ${a2}° op dezelfde schaal. ${a2}° − ${a1}° = ${h}°.`) + '\nControle: de hoek is stomp, dus groter dan 90°. Lees je een getal kleiner dan 90 af, dan gebruik je de verkeerde schaal.'};
});
T('A-MOR-A2', 'mor_a2_symmetrie', R => {
  const sym = ['gelijkbenige driehoek', 'vlieger', 'trapezium', 'rechthoek', 'ruit', 'zeshoek', 'gelijkzijdige driehoek'], niet = ['parallellogram', 'scherphoekige driehoek', 'onregelmatige vijfhoek', 'stomphoekige driehoek'];
  const j = R.schud(sym).slice(0, R.int(2, 3)), n = R.schud(niet).slice(0, 5 - j.length), namen = R.schud(j.concat(n)), L = 'ABCDEF';
  return {q:'Welke figuren hebben minstens één symmetrieas? Duid alle juiste figuren aan.', fig:vormenRij(namen), o:namen.map((x, i) => 'figuur ' + L[i]), mk:namen.map((x, i) => j.indexOf(x) >= 0 ? i : -1).filter(i => i >= 0), vast:true,
    u:'Een symmetrieas verdeelt de figuur in twee helften die elkaars spiegelbeeld zijn.\n' + namen.map((x, i) => L[i] + ': ' + x + (j.indexOf(x) >= 0 ? ' (wel)' : ' (niet)')).join(', ') + '.\nEen parallellogram heeft geen symmetrieas, wel een symmetriemiddelpunt.'};
});
T('A-MOR-A3', 'mor_a3_ligging', R => {
  const a = R.kies(RIBBEN), b = R.kies(RIBBEN.filter(x => x !== a)), l = ligging(a, b);
  return {q:`Bekijk de balk. Hoe liggen de rechten ${a} en ${b} ten opzichte van elkaar?`, fig:balkFig(null, [a, b]), o:keuzes(l, ['snijdend', 'kruisend', 'evenwijdig', 'samenvallend'].filter(x => x !== l)),
    u:l === 'snijdend' ? `${a} en ${b} hebben een gemeenschappelijk punt: ze snijden elkaar.` : l === 'evenwijdig' ? `${a} en ${b} hebben dezelfde richting: ze zijn evenwijdig.` : `${a} en ${b} liggen niet in één vlak: ze hebben geen gemeenschappelijk punt en zijn niet evenwijdig. Ze kruisen elkaar.`};
});
T('A-MOR-A4', 'mor_a4_punten', R => {
  const r = R.schud([{t:'Twee snijdende rechten hebben precies één gemeenschappelijk punt.', w:true}, {t:'Twee kruisende rechten hebben geen gemeenschappelijk punt.', w:true},
    {t:'Twee rechten zonder gemeenschappelijk punt zijn altijd evenwijdig.', w:false}, {t:'Twee samenvallende rechten hebben oneindig veel gemeenschappelijke punten.', w:true},
    {t:'Twee kruisende rechten liggen in eenzelfde vlak.', w:false}, {t:'Twee strikt evenwijdige rechten hebben één gemeenschappelijk punt.', w:false}]).slice(0, 4);
  return {q:'Zijn de uitspraken over twee rechten in de ruimte juist of fout?', jf:r,
    u:'Snijdend: 1 gemeenschappelijk punt. Samenvallend: oneindig veel. Strikt evenwijdig en kruisend: geen.\nStrikt evenwijdige rechten liggen in één vlak, kruisende rechten niet.'};
});
T('A-MOR-A5', 'mor_a5_aanzicht', R => {
  const h = maakBouw(R); if (!h) return null;
  const soort = R.kies(['voor', 'zij']), juist = aanzicht(h, soort), ander = aanzicht(h, soort === 'voor' ? 'zij' : 'voor');
  const kand = [juist, juist.slice().reverse(), ander, juist.map((v, i) => i === 0 ? v + 1 : v), ander.slice().reverse(), juist.map((v, i) => i === juist.length - 1 ? Math.max(1, v - 1) : v)];
  const uniek = []; kand.forEach(k => { if (!uniek.some(u => JSON.stringify(u) === JSON.stringify(k))) uniek.push(k); });
  if (uniek.length < 4) return null;
  const opties = R.schud(uniek.slice(0, 4)), L = 'ABCD', i = opties.findIndex(o => JSON.stringify(o) === JSON.stringify(juist));
  return {q:`Welke tekening is ${soort === 'voor' ? 'het vooraanzicht' : 'het zijaanzicht van rechts'} van het bouwsel?`, fig:{t:'svg', vb:'0 0 390 260', html:'<g>' + bouwFig(h).html + '</g>' + opties.map((o, j) => '<g transform="translate(' + (215 + (j % 2) * 88) + ' ' + Math.floor(j / 2) * 130 + ')">' + aanzichtSvg(0, o, null, L[j]) + '</g>').join(''), alt:'Bouwsel en vier tekeningen A, B, C en D.'},
    ...letterKeuze(L.length, i, 'tekening '),
    u:soort === 'voor' ? `Van voren zie je per kolom de hoogste toren: ${juist.join(', ')} blokjes hoog.` : `Van rechts zie je per rij (van voor naar achter, van links naar rechts) de hoogste toren: ${juist.join(', ')} blokjes hoog.`};
});
T('A-MOR-A6', 'mor_a6_lijn', R => {
  const soort = R.kies(['zwaartelijn', 'hoogtelijn', 'bissectrice', 'middelloodlijn']), A = [20, 150], B = [250, 150], C = [R.int(80, 170), 20];
  let s = '<polygon points="' + [A, B, C].map(pt2).join(' ') + '" fill="var(--k1)" fill-opacity=".14" stroke="var(--inkt)" stroke-width="2.2"/>' + stip(A, 'A', -10, 16) + stip(B, 'B', 10, 16) + stip(C, 'C', 0, -8);
  const M = [(A[0] + B[0]) / 2, 150];
  if (soort === 'zwaartelijn') s += '<line x1="' + C[0] + '" y1="20" x2="' + M[0] + '" y2="150" stroke="#C8372D" stroke-width="2.6"/><path d="M' + (M[0] / 2 + 8) + ',144 v12 M' + (M[0] / 2 + 12) + ',144 v12 M' + (M[0] * 1.5 - 12) + ',144 v12 M' + (M[0] * 1.5 - 8) + ',144 v12" stroke="var(--inkt)" stroke-width="1.6"/>';
  if (soort === 'hoogtelijn') s += '<line x1="' + C[0] + '" y1="20" x2="' + C[0] + '" y2="150" stroke="#C8372D" stroke-width="2.6"/>' + rhoek([C[0], 150], B, C);
  if (soort === 'middelloodlijn') s += '<line x1="' + M[0] + '" y1="160" x2="' + M[0] + '" y2="10" stroke="#C8372D" stroke-width="2.6"/>' + rhoek(M, B, [M[0], 10]) + '<path d="M' + (M[0] / 2 + 8) + ',144 v12 M' + (M[0] / 2 + 12) + ',144 v12 M' + (M[0] * 1.5 - 12) + ',144 v12 M' + (M[0] * 1.5 - 8) + ',144 v12" stroke="var(--inkt)" stroke-width="1.6"/>';
  if (soort === 'bissectrice') { const AB = Math.hypot(B[0] - A[0], B[1] - A[1]), AC = Math.hypot(C[0] - A[0], C[1] - A[1]), P = [(AC * B[0] + AB * C[0]) / (AB + AC), (AC * B[1] + AB * C[1]) / (AB + AC)];
    s += '<line x1="' + A[0] + '" y1="' + A[1] + '" x2="' + P[0].toFixed(1) + '" y2="' + P[1].toFixed(1) + '" stroke="#C8372D" stroke-width="2.6"/>' + boogje(A, B, P, 46) + boogje(A, P, C, 56, '#1fa6ab'); }
  return {q:'Hoe noem je de rode lijn in driehoek ABC?', fig:fig('0 0 270 175', s, 'Driehoek ABC met een rode lijn.'), o:keuzes(soort, R.schud(['zwaartelijn', 'hoogtelijn', 'bissectrice', 'middelloodlijn', 'symmetrieas'].filter(x => x !== soort))),
    u:{zwaartelijn:'De rode lijn verbindt een hoekpunt met het midden van de overstaande zijde: een zwaartelijn.', hoogtelijn:'De rode lijn gaat door een hoekpunt en staat loodrecht op de overstaande zijde: een hoogtelijn.', bissectrice:'De rode lijn verdeelt een hoek in twee gelijke hoeken: een bissectrice.', middelloodlijn:'De rode lijn staat loodrecht op een zijde en gaat door het midden van die zijde, maar niet noodzakelijk door een hoekpunt: een middelloodlijn.'}[soort]};
});
T('A-MOR-A6', 'mor_a6_nevenhoek', R => {
  const a = R.int(25, 75);
  return {q:`Twee hoeken zijn nevenhoeken. De ene hoek meet ${a}°.\nHoe groot is de andere hoek?`, velden:[veld(180 - a, '°')], calc:false, u:`Nevenhoeken liggen naast elkaar op een rechte: samen 180°. 180° − ${a}° = ${180 - a}°.`};
});
T('A-MOR-A7', 'mor_a7_hoek', R => {
  const soort = R.kies(['scherpe', 'rechte', 'stompe']), V = {x:R.int(3, 5), y:R.int(1, 2)}, A0 = {x:9, y:V.y};
  return {q:`Er is al een been van een hoek getekend vanuit hoekpunt O.\nKlik op een punt zodat je een <b>${soort} hoek</b> krijgt (het tweede been gaat door dat punt).`, rooster:{xmin:0, xmax:10, ymin:0, ymax:6, been:{v:V, a:A0, l:'O'}},
    w:soort === 'rechte' ? {x:V.x, y:V.y + 3} : soort === 'scherpe' ? {x:V.x + 2, y:V.y + 3} : {x:V.x - 2, y:V.y + 3},
    ok:p => { if (p.x === V.x && p.y === V.y) return false; const dx = p.x - V.x, dy = p.y - V.y; if (dy <= 0) return false; const h = Math.atan2(dy, dx) * 180 / Math.PI; return soort === 'rechte' ? Math.abs(h - 90) < .01 : soort === 'scherpe' ? h < 89.99 : h > 90.01; },
    u:soort === 'rechte' ? 'Een rechte hoek is 90°: het tweede been gaat recht naar boven.' : soort === 'scherpe' ? 'Een scherpe hoek is kleiner dan 90°: het tweede been helt naar rechts.' : 'Een stompe hoek ligt tussen 90° en 180°: het tweede been helt naar links.'};
});
T('A-MOR-A7', 'mor_a7_ruit', R => {
  const x0 = R.int(1, 3), y0 = R.int(2, 3), d1 = R.kies([2, 3]), d2 = R.kies([1, 2]);
  const A = {x:x0, y:y0}, B = {x:x0 + d1, y:y0 - d2}, C = {x:x0 + 2 * d1, y:y0}, D = {x:x0 + d1, y:y0 + d2};
  if (d1 === d2) return null;
  return {q:'ABCD is een ruit. A, B en C staan al op het rooster.\nKlik op de plaats van D. De diagonalen van een ruit staan loodrecht op elkaar en delen elkaar middendoor.', rooster:{xmin:0, xmax:9, ymin:0, ymax:6, punten:[{x:A.x, y:A.y, l:'A'}, {x:B.x, y:B.y, l:'B'}, {x:C.x, y:C.y, l:'C'}], figuren:[{pts:[A, B, C], open:true, kl:1}]}, w:D,
    u:`De diagonaal [AC] ligt horizontaal. De andere diagonaal [BD] staat er loodrecht op en wordt door het midden van [AC] middendoor gedeeld: D ligt ${d2} hokje${d2 > 1 ? 's' : ''} boven het midden.`};
});
T('A-MOR-A8', 'mor_a8_schaal', R => {
  const ijk = R.kies([2, 5, 0.5, 10]), x = R.int(-4, 4), y = R.int(-3, 3); if (!x || !y) return null;
  return {q:`Op de assen staat niet elke eenheid. Kijk goed hoeveel één hokje waard is.\nKlik op het punt met coördinaten (${minT(x * ijk)}, ${minT(y * ijk)}).`, rooster:{xmin:-5, xmax:5, ymin:-4, ymax:4, assen:'xy', getallen:'alle', ijk}, w:{x, y},
    u:`Eén hokje is ${f(ijk)} waard. x = ${minT(x * ijk)} is ${Math.abs(x)} hokje${Math.abs(x) > 1 ? 's' : ''} naar ${x < 0 ? 'links' : 'rechts'}, y = ${minT(y * ijk)} is ${Math.abs(y)} hokje${Math.abs(y) > 1 ? 's' : ''} naar ${y < 0 ? 'beneden' : 'boven'}.`};
});
T('A-MOR-A8', 'mor_a8_aflezen', R => {
  const ijk = R.kies([2, 5, 10]), x = R.int(-4, 4), y = R.int(-3, 3); if (!x || !y) return null;
  return {q:'Wat zijn de coördinaten van punt P?', fig:{t:'rooster2', alt:'Assenstelsel met punt P.', r:{xmin:-5, xmax:5, ymin:-4, ymax:4, assen:'xy', getallen:'alle', ijk, punten:[{x, y, l:'P'}]}},
    velden:[veld(x * ijk, '', 'x ='), veld(y * ijk, '', 'y =')], calc:false, u:`Eén hokje is ${ijk} waard. P ligt ${Math.abs(x)} hokjes ${x < 0 ? 'links' : 'rechts'} en ${Math.abs(y)} hokjes ${y < 0 ? 'onder' : 'boven'} de oorsprong: P(${minT(x * ijk)}, ${minT(y * ijk)}).`};
});
T('A-MOR-A9', 'mor_a9_oorsprong', R => {
  const ox = R.int(2, 6), oy = R.int(1, 4), px = R.int(-2, 3), py = R.int(-1, 2); if (!px || !py || ox + px < 0 || ox + px > 8 || oy + py < 0 || oy + py > 6) return null;
  return {q:`Op dit ruitjespapier stond een assenstelsel, maar de assen zijn uitgegomd. Eén hokje is één eenheid. Het punt P heeft coördinaten (${minT(px)}, ${minT(py)}).\nKlik op de oorsprong.`, rooster:{xmin:0, xmax:8, ymin:0, ymax:6, punten:[{x:ox + px, y:oy + py, l:'P'}]}, w:{x:ox, y:oy},
    u:`Vanuit P ga je ${Math.abs(px)} hokje${Math.abs(px) > 1 ? 's' : ''} naar ${px > 0 ? 'links' : 'rechts'} en ${Math.abs(py)} hokje${Math.abs(py) > 1 ? 's' : ''} naar ${py > 0 ? 'beneden' : 'boven'}. Daar ligt de oorsprong.`};
});
/* ---------- Meetkundige eigenschappen (dieptethema, A-stroom) ----------
   D: overstaande en overeenkomstige hoeken herkennen, vierhoeken onderscheiden, notatie BÂC, symmetriemiddelpunt, rechten door punten
   C: elementen herkennen, definities, notaties, hoekensom, eigenschappen van driehoeken, congruentiekenmerken
   B: definities van diagonaal, bissectrice en middelloodlijn, symmetrieassen, ligging in woorden, classificeren, bewijs aanvullen
   A: bijzondere lijnen definiëren, samengestelde figuren, symbolen, congruentie toepassen, een fout in een redenering vinden */
koppel('A', `
m21=A-MEI-D4 m18=A-MEI-D2 m13=A-MEI-C7 t_hoekdrie=A-MEI-C7 m22=A-MEI-C8 t_gelijkbenig=A-MEI-C8 m38=A-MEI-C10
m12=A-MEI-B2 m39=A-MEI-B1 m32=A-MEI-B7 t_buitenhoek=A-MEI-B7
mk1=A-MEI-A7 mk2=A-MEI-A3 m34=A-MEI-A8 m41=A-MEI-A8 t_m5_parallellogram=A-MEI-A8
`);
const hk = (a, b, c) => a + b + '̂' + c; /* hoek ABC met een dakje op het hoekpunt */
const hk1 = a => a + '̂';
/* twee snijdende rechten met hoeken 1 t.e.m. 4 (1 rechtsboven, tegenwijzerzin) en eventueel een maat bij één hoek */
function kruisFig(maat, bij) {
  /* hoek 1 ligt tussen de richtingen van 20° en 20° + h1 (tegenwijzerzin), de figuur is op schaal */
  const h1 = maat ? (bij % 2 ? maat : 180 - maat) : 68, M = [140, 80], rad = g => g * Math.PI / 180;
  const Q = g => [M[0] + 120 * Math.cos(rad(g)), M[1] - 120 * Math.sin(rad(g))];
  const g1 = 20, g2 = 20 + h1, dirs = [Q(g1), Q(g2), Q(g1 + 180), Q(g2 + 180)];
  let s = lijnS(dirs[0], dirs[2]) + lijnS(dirs[1], dirs[3]);
  [1, 2, 3, 4].forEach(k => { const p = hoekLabel(M, dirs[k - 1], dirs[k % 4], 30); s += tekst(p, '<tspan font-weight="700">' + k + '</tspan>'); });
  if (maat) { const a = dirs[bij - 1], b = dirs[bij % 4]; s += boogje(M, a, b, 18); const p = hoekLabel(M, a, b, 58); s += tekst(p, maat + '°'); }
  return {t:'svg', vb:'0 -45 280 250', html:s, alt:'Twee snijdende rechten met de hoeken 1, 2, 3 en 4' + (maat ? '; hoek ' + bij + ' meet ' + maat + '°' : '') + '.'};
}
/* twee evenwijdige rechten a en b met een snijlijn onder een hoek van 'maat' graden; hoeken 1-4 bij a en 5-8 bij b (zelfde volgorde) */
function evenwFig(maat) {
  const g = (maat || 65) * Math.PI / 180, u = [Math.cos(g), -Math.sin(g)], A = [150, 50], B = [A[0] - u[0] * 80 / Math.sin(g), 130];
  let s = '<line class="flijn" x1="10" y1="50" x2="290" y2="50"/><line class="flijn" x1="10" y1="130" x2="290" y2="130"/>' + lijnS([A[0] + u[0] * 45, A[1] + u[1] * 45], [B[0] - u[0] * 45, B[1] - u[1] * 45]);
  s += tekst([280, 42], '<tspan font-style="italic">a</tspan>') + tekst([280, 122], '<tspan font-style="italic">b</tspan>');
  const hoeken = (M, n0) => { const dirs = [[M[0] + 100, M[1]], [M[0] + u[0] * 60, M[1] + u[1] * 60], [M[0] - 100, M[1]], [M[0] - u[0] * 60, M[1] - u[1] * 60]]; let t = ''; [0, 1, 2, 3].forEach(k => { const p = hoekLabel(M, dirs[k], dirs[(k + 1) % 4], 24); t += tekst(p, '<tspan font-weight="700">' + (n0 + k) + '</tspan>'); }); return t; };
  s += hoeken(A, 1) + hoeken(B, 5);
  if (maat) s += boogje(A, [A[0] + 100, A[1]], [A[0] + u[0] * 60, A[1] + u[1] * 60], 15) + tekst(hoekLabel(A, [A[0] + 100, A[1]], [A[0] + u[0] * 60, A[1] + u[1] * 60], 50), maat + '°');
  return {t:'svg', vb:'0 -10 300 200', html:s, alt:'Twee evenwijdige rechten a en b met een snijlijn. Bij a de hoeken 1 tot 4, bij b de hoeken 5 tot 8, in dezelfde volgorde.' + (maat ? ' Hoek 1 meet ' + maat + '°.' : '')};
}
const VIERH = {
  ruit:[{x:2, y:3}, {x:4, y:0}, {x:6, y:3}, {x:4, y:6}], parallellogram:[{x:0, y:0}, {x:4, y:0}, {x:6, y:3}, {x:2, y:3}], trapezium:[{x:0, y:0}, {x:6, y:0}, {x:4, y:3}, {x:1, y:3}],
  rechthoek:[{x:0, y:0}, {x:5, y:0}, {x:5, y:3}, {x:0, y:3}], vierkant:[{x:0, y:0}, {x:4, y:0}, {x:4, y:4}, {x:0, y:4}], vlieger:[{x:3, y:0}, {x:5, y:4}, {x:3, y:6}, {x:1, y:4}]
};
function vierhRooster(namen) {
  /* twee rijen van twee vierhoeken, zodat de hokjes groot genoeg blijven */
  const figs = namen.map((n, i) => { const x0 = (i % 2) * 8, y0 = (1 - Math.floor(i / 2)) * 8; return {pts:VIERH[n].map(p => ({x:p.x + x0, y:p.y + y0})), kl:(i % 4) + 1, l:'ABCD'[i]}; });
  return {t:'rooster2', alt:'Rooster met vier vierhoeken A, B, C en D.', r:{xmin:-1, xmax:15, ymin:-1, ymax:15, figuren:figs}};
}

/* ===== D ===== */
T('A-MEI-D1', 'mei_d1_overstaand', R => {
  const k = R.int(1, 4), o = (k + 1) % 4 + 1;
  return {q:`Welke hoek is de overstaande hoek van hoek ${k}?`, fig:kruisFig(), o:keuzes('hoek ' + o, [1, 2, 3, 4].filter(x => x !== o && x !== k).map(x => 'hoek ' + x).concat(['hoek ' + k])),
    u:`Overstaande hoeken liggen tegenover elkaar, met hetzelfde hoekpunt. De overstaande hoek van hoek ${k} is hoek ${o}.`};
});
T('A-MEI-D2', 'mei_d2_vierhoek', R => {
  const namen = R.schud(['ruit', 'parallellogram', 'trapezium', 'rechthoek', 'vlieger']).slice(0, 4), i = R.int(0, 3), L = 'ABCD';
  return {q:`Welke vierhoek is een ${namen[i]}? Kijk goed naar het rooster.`, fig:vierhRooster(namen), ...letterKeuze(L.length, i, 'vierhoek '),
    u:{ruit:'Een ruit heeft vier even lange zijden.', parallellogram:'Een parallellogram heeft twee paar evenwijdige zijden.', trapezium:'Een trapezium heeft (minstens) één paar evenwijdige zijden. Hier zijn de andere zijden niet evenwijdig.', rechthoek:'Een rechthoek heeft vier rechte hoeken.', vlieger:'Een vlieger heeft twee paar even lange aanliggende zijden.'}[namen[i]] + ` Dat is vierhoek ${L[i]}.`};
});
T('A-MEI-D3', 'mei_d3_notatie', R => {
  const l = R.schud('ABCDEFKLMPQR'.split('')).slice(0, 3);
  return {q:`Wat is het hoekpunt van de hoek ${hk(l[0], l[1], l[2])}?`, o:keuzes(l[1], [l[0], l[2], l[0] + l[2]]), u:`De letter met het dakje (in het midden) is het hoekpunt: ${l[1]}.`};
});
T('A-MEI-D4', 'mei_d4_overeenkomstig', R => {
  const a = R.int(35, 80), k = R.int(1, 4), t = k + 4, w = k % 2 ? a : 180 - a;
  return {q:`De rechten a en b zijn evenwijdig. Hoek 1 meet ${a}°.\nHoe groot is hoek ${t}?`, fig:evenwFig(a), velden:[veld(w, '°')], calc:false,
    u:`Hoek ${t} is de overeenkomstige hoek van hoek ${k}: ze liggen op dezelfde plaats bij a en bij b. Overeenkomstige hoeken zijn even groot.` + (k === 1 ? '' : `\nHoek ${k} = ${w}°, want ${k % 2 ? 'hoek ' + k + ' is overstaand met hoek 1' : 'hoek ' + k + ' is een nevenhoek van hoek 1: 180° − ' + a + '°'}.`) + `\nDus hoek ${t} = ${w}°.`};
});
T('A-MEI-D5', 'mei_d5_middelpunt', R => {
  const n = R.kies(['parallellogram', 'ruit', 'rechthoek', 'vierkant']), dx = R.int(0, 2), dy = R.int(0, 1);
  const P = {parallellogram:[{x:0, y:0}, {x:4, y:0}, {x:6, y:2}, {x:2, y:2}], ruit:[{x:0, y:2}, {x:2, y:0}, {x:4, y:2}, {x:2, y:4}], rechthoek:[{x:0, y:0}, {x:6, y:0}, {x:6, y:4}, {x:0, y:4}], vierkant:[{x:0, y:0}, {x:4, y:0}, {x:4, y:4}, {x:0, y:4}]}[n].map(p => ({x:p.x + 1 + dx, y:p.y + 1 + dy}));
  const M = {x:(P[0].x + P[2].x) / 2, y:(P[0].y + P[2].y) / 2};
  return {q:`Klik op het symmetriemiddelpunt van ${n === 'ruit' || n === 'rechthoek' ? 'de' : 'het'} ${n}.`, rooster:{xmin:0, xmax:10, ymin:0, ymax:7, figuren:[{pts:P, kl:1}]}, w:M,
    u:`Het symmetriemiddelpunt is het snijpunt van de diagonalen. Verbind de overstaande hoekpunten: ze snijden elkaar in het midden.`};
});
T('A-MEI-D6', 'mei_d6_rechten', R => {
  if (R.int(0, 1)) return {q:'Hoeveel rechten gaan door twee verschillende punten A en B?', o:keuzes('precies één', ['geen', 'precies twee', 'oneindig veel']), u:'Door twee verschillende punten gaat precies één rechte: AB.'};
  return {q:'Hoeveel rechten gaan door één punt A?', o:keuzes('oneindig veel', ['geen', 'precies één', 'precies twee']), u:'Door één punt kan je in alle richtingen een rechte tekenen: oneindig veel rechten.'};
});

/* ===== C ===== */
T('A-MEI-C1', 'mei_c1_loodrecht', R => {
  const h = R.int(2, 4), b1 = R.int(5, 7), b2 = R.int(2, b1 - 2), x0 = 1, y0 = 1;
  const A = {x:x0, y:y0}, B = {x:x0 + b1, y:y0}, C = {x:x0 + b2, y:y0 + h}, D = {x:x0, y:y0 + h};
  const v = R.int(0, 1);
  return {q:v ? 'ABCD is getekend op een rooster. Welk lijnstuk staat loodrecht op [AB]?' : 'ABCD is getekend op een rooster. Welk lijnstuk is evenwijdig met [AB]?', 
    fig:{t:'rooster2', alt:'Vierhoek ABCD op een rooster.', r:{xmin:0, xmax:9, ymin:0, ymax:6, figuren:[{pts:[A, B, C, D], kl:1}], punten:[{x:A.x, y:A.y, l:'A'}, {x:B.x, y:B.y, l:'B'}, {x:C.x, y:C.y, l:'C'}, {x:D.x, y:D.y, l:'D'}]}},
    o:keuzes(v ? '[AD]' : '[CD]', v ? ['[CD]', '[BC]', '[AC]'] : ['[AD]', '[BC]', '[BD]']),
    u:v ? '[AB] ligt horizontaal en [AD] verticaal op het rooster: ze vormen een rechte hoek.' : '[AB] en [CD] liggen allebei horizontaal op het rooster: ze zijn evenwijdig.'};
});
T('A-MEI-C2', 'mei_c2_definitie', R => {
  const D = [['een parallellogram', 'een vierhoek met twee paar evenwijdige zijden'], ['een ruit', 'een vierhoek met vier even lange zijden'], ['een rechthoek', 'een vierhoek met vier rechte hoeken'],
    ['een gelijkbenige driehoek', 'een driehoek met (minstens) twee even lange zijden'], ['een gelijkzijdige driehoek', 'een driehoek met drie even lange zijden'], ['een trapezium', 'een vierhoek met (minstens) één paar evenwijdige zijden'],
    ['een lijnstuk', 'het deel van een rechte tussen twee punten, met die punten erbij'], ['een cirkel', 'de verzameling van de punten die even ver liggen van een gegeven punt'], ['een vierkant', 'een vierhoek met vier even lange zijden en vier rechte hoeken'], ['nevenhoeken', 'twee aanliggende hoeken waarvan de niet-gemeenschappelijke benen in elkaars verlengde liggen']];
  const k = R.schud(D), p = k[0];
  return {q:`Wat is ${p[0]}?`, o:keuzes(p[1][0].toUpperCase() + p[1].slice(1) + '.', k.slice(1, 4).map(x => x[1][0].toUpperCase() + x[1].slice(1) + '.')), u:`${p[0][0].toUpperCase() + p[0].slice(1)} is ${p[1]}.`};
});
T('A-MEI-C3', 'mei_c3_notatie', R => {
  const p = R.kies([['de lengte van het lijnstuk met eindpunten A en B', '|AB|'], ['het lijnstuk met eindpunten A en B', '[AB]'], ['de halfrechte met beginpunt A door B', '[AB'], ['de rechte door A en B', 'AB']]);
  return {q:`Hoe noteer je ${p[0]}?`, o:keuzes(p[1], ['|AB|', '[AB]', '[AB', 'AB'].filter(x => x !== p[1])), u:'Rechte: AB. Halfrechte: [AB (beginpunt A). Lijnstuk: [AB]. Lengte van het lijnstuk: |AB|.'};
});
T('A-MEI-C4', 'mei_c4_hoeken', R => {
  const a = R.int(28, 80), bij = R.int(1, 4), vraag = R.kies([1, 2, 3, 4].filter(k => k !== bij)), over = (bij + 1) % 4 + 1 === vraag, w = over ? a : 180 - a;
  return {q:`Hoek ${bij} meet ${a}°.\nHoe groot is hoek ${vraag}?`, fig:kruisFig(a, bij), velden:[veld(w, '°')], calc:false,
    u:over ? `Hoek ${vraag} is de overstaande hoek van hoek ${bij}: even groot, ${a}°.` : `Hoek ${vraag} is een nevenhoek van hoek ${bij}: samen 180°. 180° − ${a}° = ${180 - a}°.`};
});
T('A-MEI-C5', 'mei_c5_middelpunt', R => {
  const met = ['parallellogram', 'ruit', 'rechthoek', 'vierkant', 'zeshoek', 'cirkel'], zonder = ['gelijkbenige driehoek', 'gelijkzijdige driehoek', 'trapezium', 'vlieger', 'vijfhoek'];
  const j = R.schud(met).slice(0, R.int(2, 3)), n = R.schud(zonder).slice(0, 5 - j.length), namen = R.schud(j.concat(n)), L = 'ABCDEF';
  return {q:'Welke figuren hebben een symmetriemiddelpunt? Duid alle juiste figuren aan.', fig:vormenRij(namen), o:namen.map((x, i) => 'figuur ' + L[i]), mk:namen.map((x, i) => j.indexOf(x) >= 0 ? i : -1).filter(i => i >= 0), vast:true,
    u:'Een figuur heeft een symmetriemiddelpunt als ze na een halve draai (180°) om dat punt op zichzelf valt.\n' + namen.map((x, i) => L[i] + ': ' + x + (j.indexOf(x) >= 0 ? ' (wel)' : ' (niet)')).join(', ') + '.\nDriehoeken, vliegers en een vijfhoek hebben geen symmetriemiddelpunt.'};
});
T('A-MEI-C6', 'mei_c6_punten', R => {
  const p = R.kies([['Twee rechten in een vlak snijden elkaar.', 'precies één'], ['Twee rechten in een vlak zijn strikt evenwijdig.', 'geen'], ['Twee rechten vallen samen.', 'oneindig veel'], ['Twee rechten staan loodrecht op elkaar.', 'precies één']]);
  return {q:`${p[0]}\nHoeveel gemeenschappelijke punten hebben ze?`, o:keuzes(p[1], ['geen', 'precies één', 'precies twee', 'oneindig veel'].filter(x => x !== p[1])),
    u:'Snijdende (ook loodrechte) rechten: één punt. Strikt evenwijdige rechten: geen. Samenvallende rechten: alle punten, dus oneindig veel.'};
});
T('A-MEI-C7', 'mei_c7_som', R => {
  if (R.int(0, 1)) { const a = R.int(30, 100), b = R.int(25, 150 - a); return {q:`In driehoek ABC is ${hk1('A')} = ${a}° en ${hk1('B')} = ${b}°.\nHoe groot is ${hk1('C')}?`, velden:[veld(180 - a - b, '°')], calc:false, u:`De som van de hoeken van een driehoek is 180°. 180° − ${a}° − ${b}° = ${180 - a - b}°.`}; }
  const a = R.int(60, 120), b = R.int(60, 120), c = R.int(50, 110), d = 360 - a - b - c; if (d < 30 || d > 170) return null;
  return {q:`In vierhoek ABCD is ${hk1('A')} = ${a}°, ${hk1('B')} = ${b}° en ${hk1('C')} = ${c}°.\nHoe groot is ${hk1('D')}?`, velden:[veld(d, '°')], calc:false, u:`De som van de hoeken van een vierhoek is 360°. 360° − ${a}° − ${b}° − ${c}° = ${d}°.`};
});
T('A-MEI-C8', 'mei_c8_eigenschap', R => {
  const v = R.int(0, 2);
  if (v === 0) { const t = R.stap(20, 140, 2); return {q:`In een gelijkbenige driehoek meet de tophoek ${t}°.\nHoe groot is één basishoek?`, velden:[veld((180 - t) / 2, '°')], calc:false, u:`De basishoeken zijn even groot. (180° − ${t}°) : 2 = ${(180 - t) / 2}°.`}; }
  if (v === 1) { const a = R.int(20, 70); return {q:`Een rechthoekige driehoek heeft een scherpe hoek van ${a}°.\nHoe groot is de andere scherpe hoek?`, velden:[veld(90 - a, '°')], calc:false, u:`Er is een rechte hoek van 90°. Samen zijn de twee scherpe hoeken dus 90°: 90° − ${a}° = ${90 - a}°.`}; }
  const b = R.int(25, 75); return {q:`In een gelijkbenige driehoek meet een basishoek ${b}°.\nHoe groot is de tophoek?`, velden:[veld(180 - 2 * b, '°')], calc:false, u:`Beide basishoeken meten ${b}°. 180° − 2 · ${b}° = ${180 - 2 * b}°.`};
});
T('A-MEI-C9', 'mei_c9_vierhoeken', R => {
  const e = R.kies([['Alle hoeken zijn even groot.', ['rechthoek', 'vierkant']], ['De diagonalen staan loodrecht op elkaar.', ['ruit', 'vierkant', 'vlieger']]]), alle = ['vierkant', 'rechthoek', 'ruit', 'parallellogram', 'vlieger', 'trapezium'];
  const o = R.schud(alle).slice(0, 5); if (!o.some(x => e[1].indexOf(x) >= 0)) return null;
  return {q:`In welke vierhoeken geldt altijd: "${e[0]}"? Duid alle juiste vierhoeken aan.`, o, mk:o.map((x, i) => e[1].indexOf(x) >= 0 ? i : -1).filter(i => i >= 0), vast:true,
    u:`"${e[0]}" geldt altijd in: ${e[1].join(', ')}.`};
});
T('A-MEI-C10', 'mei_c10_kenmerk', R => {
  const p = R.kies([['Van twee driehoeken zijn de drie zijden twee aan twee even lang.', 'ZZZ'], ['Van twee driehoeken zijn twee zijden en de ingesloten hoek twee aan twee even groot.', 'ZHZ'],
    ['Van twee driehoeken zijn twee hoeken en een zijde twee aan twee even groot.', 'HHZ'], ['Twee rechthoekige driehoeken hebben een even lange schuine zijde en nog een even lange zijde.', 'ZZ90°']]);
  return {q:`${p[0]}\nVolgens welk congruentiekenmerk zijn ze congruent?`, o:keuzes(p[1], ['ZZZ', 'ZHZ', 'HHZ', 'ZZ90°'].filter(x => x !== p[1])), u:'ZZZ: drie zijden. ZHZ: twee zijden en de ingesloten hoek. HHZ: twee hoeken en een zijde. ZZ90°: rechthoekige driehoeken met de schuine zijde en een rechthoekszijde.'};
});
T('A-MEI-C11', 'mei_c11_element', R => {
  const L = R.schud(['A', 'B', 'C', 'D']), xs = [40, 110, 170, 240];
  let s = '<line class="flijn" x1="10" y1="40" x2="280" y2="40"/>'; L.forEach((l, i) => { s += stip([xs[i], 40], l, 0, -10); });
  const pos = l => L.indexOf(l), tussen = (p, a, b) => pos(p) >= Math.min(pos(a), pos(b)) && pos(p) <= Math.max(pos(a), pos(b));
  const [a, b] = R.schud(L).slice(0, 2), p = L.find(x => x !== a && x !== b), q2 = L.filter(x => x !== a && x !== b)[1];
  const rij = R.schud([{t:`${p} ∈ [${a}${b}]`, w:tussen(p, a, b)}, {t:`${p} ∈ [${a}${b}`, w:(pos(b) - pos(a)) * (pos(p) - pos(a)) >= 0}, {t:`${q2} ∈ ${a}${b}`, w:true}, {t:`[${a}${b}] ⊂ [${a}${q2}`, w:(pos(b) - pos(a)) * (pos(q2) - pos(a)) > 0}]);
  return {q:'Alle punten liggen op dezelfde rechte. Zijn de uitspraken juist of fout?', fig:fig('0 0 290 60', s, 'Rechte met de punten ' + L.join(', ') + ' in die volgorde.'), jf:rij,
    u:`[${a}${b}] is het lijnstuk tussen ${a} en ${b}. [${a}${b} is de halfrechte die in ${a} begint en door ${b} loopt. ${a}${b} is de hele rechte: elk punt van de figuur ligt erop.`};
});

/* ===== B ===== */
T('A-MEI-B1', 'mei_b1_definitie', R => {
  const D = [['een diagonaal van een veelhoek', 'een lijnstuk dat twee niet-opeenvolgende hoekpunten verbindt'], ['de bissectrice van een hoek', 'de halfrechte die de hoek in twee gelijke hoeken verdeelt'], ['de middelloodlijn van een lijnstuk', 'de rechte die loodrecht op het lijnstuk staat en door het midden ervan gaat']];
  const fout = ['een lijnstuk dat twee opeenvolgende hoekpunten verbindt', 'de rechte door het midden van het lijnstuk', 'de rechte die loodrecht op een zijde staat en door het overstaande hoekpunt gaat', 'een halfrechte die een hoek in twee stukken verdeelt'];
  const p = R.kies(D);
  return {q:`Wat is ${p[0]}?`, o:keuzes(p[1], R.schud(D.filter(x => x !== p).map(x => x[1]).concat(fout))), u:`${p[0][0].toUpperCase() + p[0].slice(1)} is ${p[1]}.`};
});
T('A-MEI-B2', 'mei_b2_assen', R => {
  const p = R.kies([['gelijkzijdige driehoek', 3], ['gelijkbenige driehoek', 1], ['vierkant', 4], ['scherphoekige driehoek', 0]]);
  return {q:`Hoeveel symmetrieassen heeft ${p[0] === 'vierkant' ? 'een' : 'deze'} ${p[0]}?`, fig:vormenRij([p[0]], p[0]), velden:[veld(p[1])], calc:false,
    u:{3:'Een gelijkzijdige driehoek heeft 3 symmetrieassen: de hoogtelijnen.', 1:'Een gelijkbenige driehoek (die niet gelijkzijdig is) heeft 1 symmetrieas: de hoogtelijn uit de top.', 4:'Een vierkant heeft 4 symmetrieassen: de twee diagonalen en de twee middelloodlijnen van de zijden.', 0:'Een driehoek met drie verschillende zijden heeft geen symmetrieas.'}[p[1]]};
});
T('A-MEI-B3', 'mei_b3_assen', R => {
  const r = R.schud([{t:'In een gelijkbenige driehoek is de hoogtelijn uit de top een symmetrieas.', w:true}, {t:'In een rechthoek (geen vierkant) is een diagonaal een symmetrieas.', w:false},
    {t:'In een ruit zijn de diagonalen symmetrieassen.', w:true}, {t:'In een gelijkzijdige driehoek is elke zwaartelijn een symmetrieas.', w:true}, {t:'In een parallellogram is een diagonaal een symmetrieas.', w:false},
    {t:'In een rechthoek is de middelloodlijn van een zijde een symmetrieas.', w:true}, {t:'In een rechthoekige driehoek is de hoogtelijn op de schuine zijde een symmetrieas.', w:false}]).slice(0, 4);
  return {q:'Zijn de uitspraken juist of fout?', jf:r, u:'Een lijn is een symmetrieas als de twee helften elkaars spiegelbeeld zijn. Teken de figuur en plooi in gedachten langs de lijn.'};
});
T('A-MEI-B4', 'mei_b4_ligging', R => {
  const p = R.kies([['De rechten a en b hebben precies één punt gemeen en vormen een rechte hoek.', 'a en b staan loodrecht op elkaar'], ['De rechten a en b liggen in hetzelfde vlak en hebben geen enkel punt gemeen.', 'a en b zijn strikt evenwijdig'],
    ['Alle punten van a liggen ook op b.', 'a en b vallen samen'], ['De rechten a en b hebben precies één punt gemeen en vormen een hoek van 60°.', 'a en b snijden elkaar, maar niet loodrecht']]);
  return {q:`${p[0]}\nWat weet je over de rechten a en b?`, o:keuzes(p[1], ['a en b staan loodrecht op elkaar', 'a en b zijn strikt evenwijdig', 'a en b vallen samen', 'a en b snijden elkaar, maar niet loodrecht'].filter(x => x !== p[1])), u:`${p[0]} Dus ${p[1]}.`};
});
T('A-MEI-B5', 'mei_b5_classificeren', R => {
  const a = R.int(15, 80), b = R.int(15, 80), c = 180 - a - b; if (c <= 5 || a === b || b === c || a === c) return null;
  const s = Math.max(a, b, c) > 90 ? 'stomphoekige driehoek' : Math.max(a, b, c) === 90 ? 'rechthoekige driehoek' : 'scherphoekige driehoek';
  return {q:`Een driehoek heeft een hoek van ${a}° en een hoek van ${b}°.\nWat voor driehoek is het?`, o:keuzes(s, ['stomphoekige driehoek', 'rechthoekige driehoek', 'scherphoekige driehoek', 'gelijkbenige driehoek'].filter(x => x !== s)),
    u:`De derde hoek is 180° − ${a}° − ${b}° = ${c}°.\n${s === 'stomphoekige driehoek' ? 'Er is een hoek groter dan 90°' : s === 'rechthoekige driehoek' ? 'Er is een hoek van 90°' : 'Alle hoeken zijn kleiner dan 90°'}: een ${s}.`};
});
T('A-MEI-B6', 'mei_b6_verband', R => {
  const r = R.schud([{t:'Elk vierkant is een ruit.', w:true}, {t:'Elke ruit is een vierkant.', w:false}, {t:'Elk vierkant is een rechthoek.', w:true}, {t:'Elke rechthoek is een parallellogram.', w:true},
    {t:'Elk parallellogram is een rechthoek.', w:false}, {t:'Elke gelijkzijdige driehoek is gelijkbenig.', w:true}, {t:'Elke gelijkbenige driehoek is gelijkzijdig.', w:false}, {t:'Elke ruit is een parallellogram.', w:true}]).slice(0, 4);
  return {q:'Zijn de uitspraken juist of fout?', jf:r, u:'Een vierkant heeft alle eigenschappen van een ruit en van een rechthoek. Een ruit en een rechthoek zijn bijzondere parallellogrammen.\nEen gelijkzijdige driehoek heeft zeker twee even lange zijden, dus is hij ook gelijkbenig.'};
});
T('A-MEI-B7', 'mei_b7_vergelijking', R => {
  const k = R.kies([[1, 2, 3], [2, 3, 4], [1, 3, 5], [2, 2, 5], [1, 1, 4]]), x = 180 / (k[0] + k[1] + k[2]); if (!Number.isInteger(x)) return null;
  const v = R.int(0, 2), t = m => m === 1 ? 'x' : m + 'x';
  return {q:`In driehoek ABC is ${hk1('A')} = ${t(k[0])}, ${hk1('B')} = ${t(k[1])} en ${hk1('C')} = ${t(k[2])}.\nHoe groot is ${hk1('ABC'[v])}?`, velden:[veld(k[v] * x, '°')], calc:false,
    u:`${t(k[0])} + ${t(k[1])} + ${t(k[2])} = 180°, dus ${k[0] + k[1] + k[2]}x = 180° en x = ${x}°.\n${hk1('ABC'[v])} = ${k[v] === 1 ? 'x' : k[v] + ' · ' + x + '°'} = ${k[v] * x}°.`};
});
T('A-MEI-B7', 'mei_b7_buiten', R => {
  const a = R.int(30, 80), b = R.int(30, 80);
  return {q:`In driehoek ABC is ${hk1('A')} = ${a}° en ${hk1('B')} = ${b}°.\nHoe groot is de nevenhoek van ${hk1('C')}?`, velden:[veld(a + b, '°')], calc:false,
    u:`${hk1('C')} = 180° − ${a}° − ${b}° = ${180 - a - b}°.\nDe nevenhoek is 180° − ${180 - a - b}° = ${a + b}°.`};
});
T('A-MEI-B8', 'mei_b8_toepassen', R => {
  const v = R.int(0, 2), a = R.int(4, 9), b = R.int(2, 6), h = R.int(55, 80), d = R.int(4, 12);
  if (v === 0) return {q:`In parallellogram ABCD is |AB| = ${a} cm en |BC| = ${b} cm.\nHoe groot is de omtrek?`, velden:[veld(2 * (a + b), 'cm')], calc:false, u:`Overstaande zijden zijn even lang: |CD| = ${a} cm en |DA| = ${b} cm. Omtrek: 2 · (${a} + ${b}) = ${2 * (a + b)} cm.`};
  if (v === 1) return {q:`In parallellogram ABCD is ${hk1('A')} = ${h}°.\nHoe groot is ${hk1('C')}?`, velden:[veld(h, '°')], calc:false, u:`In een parallellogram zijn overstaande hoeken even groot: ${hk1('C')} = ${hk1('A')} = ${h}°.`};
  return {q:`In parallellogram ABCD snijden de diagonalen elkaar in M. |AC| = ${2 * d} cm.\nHoe lang is [AM]?`, velden:[veld(d, 'cm')], calc:false, u:`De diagonalen van een parallellogram delen elkaar middendoor: |AM| = ${2 * d} : 2 = ${d} cm.`};
});
T('A-MEI-B9', 'mei_b9_bewijs', R => {
  const k = R.kies(['ZHZ', 'ZZZ', 'HZH']);
  const g = {ZHZ:[`|AB| = |DE|`, `${hk1('A')} = ${hk1('D')}`], ZZZ:[`|AB| = |DE|`, `|BC| = |EF|`], HZH:[`${hk1('A')} = ${hk1('D')}`, `|AB| = |DE|`]}[k];
  const juist = {ZHZ:'|AC| = |DF|', ZZZ:'|AC| = |DF|', HZH:`${hk1('B')} = ${hk1('E')}`}[k];
  const fout = {ZHZ:['|BC| = |EF|', `${hk1('B')} = ${hk1('E')}`, `${hk1('C')} = ${hk1('F')}`], ZZZ:[`${hk1('A')} = ${hk1('D')}`, '|AB| = |EF|', `${hk1('C')} = ${hk1('F')}`], HZH:[`${hk1('C')} = ${hk1('F')}`, '|BC| = |EF|', '|AC| = |DF|']}[k];
  return {q:`Je wilt bewijzen dat △ABC ≅ △DEF met het kenmerk ${k === 'HZH' ? 'HHZ (twee hoeken en de zijde ertussen)' : k}.\nJe weet al: ${g.join(' en ')}.\nWat heb je nog nodig?`, o:keuzes(juist, fout),
    u:k === 'ZHZ' ? `ZHZ: twee zijden en de hoek ertussen. ${hk1('A')} ligt tussen [AB] en [AC], dus je hebt nog |AC| = |DF| nodig.` : k === 'ZZZ' ? 'ZZZ: alle drie de zijden. Je mist nog |AC| = |DF|.' : `Twee hoeken en de zijde ertussen: [AB] ligt tussen ${hk1('A')} en ${hk1('B')}, dus je hebt nog ${hk1('B')} = ${hk1('E')} nodig.`};
});

/* ===== A ===== */
T('A-MEI-A1', 'mei_a1_definitie', R => {
  const D = [['een zwaartelijn van een driehoek', 'het lijnstuk van een hoekpunt naar het midden van de overstaande zijde'], ['een hoogtelijn van een driehoek', 'het lijnstuk door een hoekpunt dat loodrecht staat op de (drager van de) overstaande zijde'],
    ['een symmetriemiddelpunt van een figuur', 'een punt waarbij de figuur door een puntspiegeling om dat punt op zichzelf afgebeeld wordt'], ['een symmetrieas van een figuur', 'een rechte waarbij de figuur door een spiegeling om die rechte op zichzelf afgebeeld wordt'],
    ['een middelloodlijn van een driehoek', 'de rechte die loodrecht staat op een zijde en door het midden van die zijde gaat'], ['een bissectrice van een driehoek', 'de halfrechte die een hoek van de driehoek in twee gelijke hoeken verdeelt']];
  const k = R.schud(D), p = k[0];
  return {q:`Wat is ${p[0]}?`, o:keuzes(p[1][0].toUpperCase() + p[1].slice(1) + '.', k.slice(1, 4).map(x => x[1][0].toUpperCase() + x[1].slice(1) + '.')), u:`${p[0][0].toUpperCase() + p[0].slice(1)} is ${p[1]}.`};
});
T('A-MEI-A2', 'mei_a2_samengesteld', R => {
  const v = R.int(0, 2);
  if (v === 0) { const a = R.int(25, 65); return {q:`ABCD is een rechthoek. De diagonalen snijden elkaar in M. De diagonaal [AC] maakt met [AB] een hoek van ${a}°.\nHoe groot is ${hk('A', 'M', 'B')}?`, velden:[veld(180 - 2 * a, '°')], calc:false,
    u:`De diagonalen van een rechthoek zijn even lang en delen elkaar middendoor, dus |MA| = |MB|. △ABM is gelijkbenig: ${hk('M', 'B', 'A')} = ${hk('M', 'A', 'B')} = ${a}°.\n${hk('A', 'M', 'B')} = 180° − 2 · ${a}° = ${180 - 2 * a}°.`}; }
  if (v === 1) { const a = R.int(35, 75); return {q:`De rechten a en b zijn evenwijdig. Een gelijkbenige driehoek ABC heeft zijn basis [AB] op a en zijn top C op b. De basishoek bij A meet ${a}°. De rechte AC maakt met b een scherpe hoek.\nHoe groot is die hoek?`, velden:[veld(a, '°')], calc:false,
    u:`De hoek tussen AC en a bij A is ${a}°. Bij twee evenwijdige rechten en een snijlijn zijn de verwisselende binnenhoeken even groot: ook ${a}°.`}; }
  const t = R.stap(30, 100, 2), b = (180 - t) / 2;
  return {q:`In de gelijkbenige driehoek ABC is |CA| = |CB| en ${hk1('C')} = ${t}°. [AD] is de bissectrice van ${hk1('A')} (D ligt op [BC]).\nHoe groot is ${hk('D', 'A', 'B')}?`, velden:[veld(b / 2, '°')], calc:false,
    u:`De basishoeken zijn (180° − ${t}°) : 2 = ${b}°.\nDe bissectrice halveert ${hk1('A')}: ${b}° : 2 = ${f(b / 2)}°.`};
});
T('A-MEI-A3', 'mei_a3_assen', R => {
  const p = R.kies([['een parallellogram (geen ruit of rechthoek)', '0'], ['een ruit (geen vierkant)', '2'], ['een rechthoek (geen vierkant)', '2'], ['een gelijkbenig trapezium', '1'], ['een cirkel', 'oneindig veel'], ['een trapezium met vier verschillende zijden', '0']]);
  return {q:`Hoeveel symmetrieassen heeft ${p[0]}?`, o:keuzes(p[1], ['0', '1', '2', '4', 'oneindig veel'].filter(x => x !== p[1])),
    u:'Parallellogram: 0. Ruit: 2 (de diagonalen). Rechthoek: 2 (de middelloodlijnen van de zijden). Gelijkbenig trapezium: 1. Cirkel: oneindig veel (elke rechte door het middelpunt).'};
});
T('A-MEI-A4', 'mei_a4_middelpunt', R => {
  const r = R.schud([{t:'Het snijpunt van de diagonalen van een parallellogram is een symmetriemiddelpunt.', w:true}, {t:'Het snijpunt van de zwaartelijnen van een gelijkzijdige driehoek is een symmetriemiddelpunt.', w:false},
    {t:'Het snijpunt van de diagonalen van een vlieger is een symmetriemiddelpunt.', w:false}, {t:'Het snijpunt van de diagonalen van een rechthoek is een symmetriemiddelpunt.', w:true},
    {t:'Het snijpunt van de diagonalen van een gelijkbenig trapezium is een symmetriemiddelpunt.', w:false}, {t:'Het snijpunt van de diagonalen van een ruit is een symmetriemiddelpunt.', w:true}]).slice(0, 4);
  return {q:'Zijn de uitspraken juist of fout?', jf:r, u:'Alleen parallellogrammen (dus ook ruiten, rechthoeken en vierkanten) hebben een symmetriemiddelpunt: het snijpunt van de diagonalen.\nEen driehoek heeft nooit een symmetriemiddelpunt: na een halve draai staat hij op zijn kop.'};
});
T('A-MEI-A5', 'mei_a5_symbolen', R => {
  const p = R.kies([['a ∥ b en b ⊥ c', 'a ⊥ c'], ['a ⊥ b en b ⊥ c', 'a ∥ c'], ['a ∥ b en b ∥ c', 'a ∥ c'], ['a ⊥ b en a ∥ c', 'c ⊥ b']]);
  return {q:`De rechten a, b en c liggen in hetzelfde vlak. Je weet: ${p[0]}.\nWat geldt zeker?`, o:keuzes(p[1], ['a ⊥ c', 'a ∥ c', 'c ⊥ b', 'a = b'].filter(x => x !== p[1])), u:`${p[0]}, dus ${p[1]}.\n∥ betekent evenwijdig, ⊥ betekent loodrecht.`};
});
T('A-MEI-A6', 'mei_a6_doorsnede', R => {
  if (R.int(0, 1)) return {q:'Voor de rechten a en b geldt: a ∩ b = {S}.\nWat betekent dat?', o:keuzes('a en b snijden elkaar in het punt S.', ['a en b zijn evenwijdig.', 'S ligt op a, maar niet op b.', 'a en b vallen samen.']), u:'De doorsnede bevat alle gemeenschappelijke punten. Alleen S ligt op beide rechten: het snijpunt.'};
  return {q:'De rechten a en b liggen in hetzelfde vlak en a ∩ b = ∅.\nWat betekent dat?', o:keuzes('a en b zijn strikt evenwijdig.', ['a en b snijden elkaar.', 'a en b vallen samen.', 'a en b staan loodrecht op elkaar.']), u:'De doorsnede is leeg: geen gemeenschappelijk punt. In een vlak zijn ze dan strikt evenwijdig.'};
});
T('A-MEI-A7', 'mei_a7_classificeren', R => {
  const p = R.kies([['AB ∥ CD, AD ∥ BC en |AC| = |BD|', 'rechthoek'], ['AC ⊥ BD en de diagonalen delen elkaar middendoor', 'ruit'], ['|AB| = |BC| = |CD| = |DA| en |AC| = |BD|', 'vierkant'], ['AB ∥ CD en AD ∦ BC', 'trapezium'], ['de diagonalen delen elkaar middendoor', 'parallellogram']]);
  return {q:`Voor vierhoek ABCD geldt: ${p[0]}.\nWat is ABCD zeker?`, o:keuzes(p[1], ['rechthoek', 'ruit', 'vierkant', 'trapezium', 'parallellogram', 'vlieger'].filter(x => x !== p[1]).slice(0, 3)),
    u:{rechthoek:'Twee paar evenwijdige zijden: parallellogram. Met even lange diagonalen: rechthoek.', ruit:'Diagonalen die elkaar middendoor delen: parallellogram. Staan ze ook loodrecht: ruit.', vierkant:'Vier even lange zijden: ruit. Met even lange diagonalen: vierkant.', trapezium:'Precies één paar evenwijdige zijden (∦ betekent niet evenwijdig): trapezium.', parallellogram:'Diagonalen die elkaar middendoor delen: parallellogram. Meer weet je niet zeker.'}[p[1]]};
});
T('A-MEI-A8', 'mei_a8_toepassen', R => {
  const k = R.kies([2, 3, 4, 5]), b = 180 / (k + 1);
  if (R.int(0, 1)) return {q:`In parallellogram ABCD is ${hk1('A')} ${k} keer zo groot als ${hk1('B')}.\nHoe groot is ${hk1('A')}?`, velden:[veld(k * b, '°')], calc:false,
    u:`Twee opeenvolgende hoeken van een parallellogram zijn samen 180°: ${k}x + x = 180°, dus x = ${f(b)}°.\n${hk1('A')} = ${k} · ${f(b)}° = ${f(k * b)}°.`};
  const o = R.schud(['rechthoek', 'vierkant', 'gelijkbenig trapezium', 'ruit', 'parallellogram', 'vlieger']).slice(0, 5); if (!o.some(x => /rechthoek|vierkant|gelijkbenig/.test(x))) return null;
  return {q:'In welke vierhoeken zijn de diagonalen altijd even lang? Duid alle juiste vierhoeken aan.', o, mk:o.map((x, i) => /rechthoek|vierkant|gelijkbenig/.test(x) ? i : -1).filter(i => i >= 0), vast:true,
    u:'Even lange diagonalen: rechthoek, vierkant en gelijkbenig trapezium.'};
});
T('A-MEI-A9', 'mei_a9_beeld', R => {
  const r = R.schud([{t:'Een driehoek en zijn beeld door een verschuiving zijn congruent.', w:true}, {t:'Een driehoek en zijn beeld door een spiegeling zijn congruent.', w:true},
    {t:'Een driehoek en zijn beeld door een draaiing zijn congruent.', w:true}, {t:'Een driehoek en zijn vergroting met factor 2 zijn congruent.', w:false}, {t:'Een driehoek en zijn beeld door een puntspiegeling zijn congruent.', w:true}]).slice(0, 4);
  return {q:'Zijn de uitspraken juist of fout?', jf:r, u:'Verschuivingen, spiegelingen, draaiingen en puntspiegelingen behouden lengtes en hoeken: beeld en origineel zijn congruent.\nBij een vergroting worden de zijden langer: niet congruent.'};
});
T('A-MEI-A10', 'mei_a10_congruent', R => {
  const z = {AB:R.int(4, 9), BC:R.int(4, 9), AC:R.int(4, 9)}, h = {A:R.int(40, 80), B:R.int(40, 80)}; h.C = 180 - h.A - h.B;
  const v = R.kies([['|EF|', z.BC, 'cm', '|BC|'], ['|DF|', z.AC, 'cm', '|AC|'], [hk1('E'), h.B, '°', hk1('B')], [hk1('F'), h.C, '°', hk1('C')]]);
  return {q:`Je hebt bewezen dat △ABC ≅ △DEF.\nIn △ABC is |AB| = ${z.AB} cm, |BC| = ${z.BC} cm, |AC| = ${z.AC} cm, ${hk1('A')} = ${h.A}° en ${hk1('B')} = ${h.B}°.\nHoe groot is ${v[0]}?`, velden:[veld(v[1], v[2])], calc:false,
    u:`△ABC ≅ △DEF: A hoort bij D, B bij E en C bij F. ${v[0]} is dus even groot als ${v[3]}` + (v[3] === hk1('C') ? `, en ${hk1('C')} = 180° − ${h.A}° − ${h.B}° = ${h.C}°.` : `: ${v[1]} ${v[2]}.`)};
});
T('A-MEI-A11', 'mei_a11_fout', R => {
  const p = R.kies([[['ABCD is een ruit.', 'In een ruit zijn de diagonalen even lang.', 'Dus |AC| = |BD|.'], 2, 'De diagonalen van een ruit staan loodrecht op elkaar, maar zijn niet altijd even lang.'],
    [['△ABC is gelijkbenig met top C.', 'Dus is ' + hk1('A') + ' = ' + hk1('C') + '.', 'Als ' + hk1('C') + ' = 40°, dan is ' + hk1('A') + ' = 40°.'], 2, 'In een gelijkbenige driehoek zijn de basishoeken ' + hk1('A') + ' en ' + hk1('B') + ' even groot, niet ' + hk1('A') + ' en ' + hk1('C') + '.'],
    [['ABCD is een parallellogram.', 'Overstaande hoeken zijn even groot, dus ' + hk1('A') + ' = ' + hk1('C') + '.', 'Opeenvolgende hoeken zijn ook even groot, dus ' + hk1('A') + ' = ' + hk1('B') + '.'], 3, 'Opeenvolgende hoeken van een parallellogram zijn samen 180°, niet altijd even groot.'],
    [['|AB| = |DE|, |BC| = |EF| en ' + hk1('A') + ' = ' + hk1('D') + '.', 'Dat zijn twee zijden en een hoek.', 'Dus △ABC ≅ △DEF volgens ZHZ.'], 3, 'Bij ZHZ moet de hoek tussen de twee zijden liggen. ' + hk1('A') + ' ligt niet tussen [AB] en [BC]; dat zou ' + hk1('B') + ' moeten zijn.']]);
  return {q:`Bekijk de redenering:\nstap 1: ${p[0][0]}\nstap 2: ${p[0][1]}\nstap 3: ${p[0][2]}\nIn welke stap zit de fout?`, ...vasteKeuze('stap ' + p[1], ['stap 1', 'stap 2', 'stap 3', 'Er zit geen fout in.']), u:p[2]};
});
/* ---------- Omtrek, oppervlakte en inhoud (dieptethema, A-stroom) ----------
   D: straal, hoogte, basis, grondvlak onderscheiden; formule voor de inhoud van een balk herkennen
   C: omtrek en oppervlakte onderscheiden, omtrek van een driehoek, oppervlakte van een rechthoek, inhoud van een balk
   B: omtrek, oppervlakte of inhoud kiezen; omtrek en oppervlakte van gewone figuren; een zijde of ribbe terugrekenen; kubus en cilinder
   A: zonder figuur, samengestelde figuren, te veel gegevens, herleidingen, straal en hoogte terugrekenen, oppervlakte van een balk */
koppel('A', `
m06=A-OOI-C5 t_rechthoek=A-OOI-C5 n16=A-OOI-C5 m15=A-OOI-C6 t_balk=A-OOI-C6
m10=A-OOI-B8 t_mb_kubusvol=A-OOI-B8 m16=A-OOI-B2 m20=A-OOI-B2 t_m1_vierkant=A-OOI-B2 m35=A-OOI-B5
m14=A-OOI-A1 t_driehoekopp=A-OOI-A1 m26=A-OOI-A1 t_cirkel=A-OOI-A1 m23=A-OOI-A2 m27=A-OOI-A2 t_mb_samengesteld=A-OOI-A2 m28=A-OOI-A2 t_trapezium=A-OOI-A2
m31=A-OOI-A2 m40=A-OOI-A2 t_m5_tuinvijver=A-OOI-A2 m25=A-OOI-A7 t_mb_aquarium=A-OOI-A7 m33=A-OOI-A7 t_m5_cilinder=A-OOI-A7 m36=A-OOI-A11
`);
const vul = 'fill="var(--k1)" fill-opacity=".18" stroke="var(--inkt)" stroke-width="2.2" stroke-linejoin="round"';
const cm = (x, e) => f(x) + ' ' + (e || 'cm');
/* rechthoek met maten */
function rechthoekFig(l, b, e, titel) {
  const W = 220, H = Math.max(50, Math.min(140, W * b / l));
  return fig('0 0 270 ' + (H + 50), '<rect x="25" y="15" width="' + W + '" height="' + H.toFixed(1) + '" ' + vul + '/>' + rhoek([25, 15 + H], [245, 15 + H], [25, 15]) + tekst([135, H + 40], cm(l, e)) + tekst([252, 20 + H / 2], cm(b, e), 'start'), titel || 'Rechthoek van ' + cm(l, e) + ' op ' + cm(b, e) + '.');
}
/* driehoek met basis b, hoogte h (gestreept, met loodrecht-teken) en eventueel zijden */
function driehoekFig(b, h, zijden, e) {
  const A = [20, 150], B = [250, 150], C = [95, 150 - Math.min(125, 230 * h / b)], H0 = [C[0], 150];
  let s = '<polygon points="' + [A, B, C].map(pt2).join(' ') + '" ' + vul + '/>';
  if (h) s += '<line x1="' + C[0] + '" y1="' + C[1] + '" x2="' + H0[0] + '" y2="150" stroke="var(--inkt)" stroke-width="1.6" stroke-dasharray="5 4"/>' + rhoek(H0, B, C) + tekst([C[0] + 6, (C[1] + 150) / 2 + 4], cm(h, e), 'start');
  s += tekst([135, 172], cm(b, e));
  if (zijden) s += tekst([(A[0] + C[0]) / 2 - 10, (A[1] + C[1]) / 2], cm(zijden[0], e), 'end') + tekst([(B[0] + C[0]) / 2 + 10, (B[1] + C[1]) / 2], cm(zijden[1], e), 'start');
  return fig('0 0 290 180', s, 'Driehoek met basis ' + cm(b, e) + (h ? ' en hoogte ' + cm(h, e) : '') + (zijden ? ', de andere zijden zijn ' + cm(zijden[0], e) + ' en ' + cm(zijden[1], e) : '') + '.');
}
function cirkelFig(r, diam, e) {
  let s = '<circle cx="110" cy="85" r="75" ' + vul + '/>' + stip([110, 85], 'M', -12, 4);
  s += diam ? '<line x1="35" y1="85" x2="185" y2="85" stroke="#C8372D" stroke-width="2.4"/>' + tekst([150, 78], cm(2 * r, e)) : '<line x1="110" y1="85" x2="163" y2="32" stroke="#C8372D" stroke-width="2.4"/>' + tekst([150, 70], cm(r, e), 'start');
  return fig('0 0 230 170', s, 'Cirkel met middelpunt M en ' + (diam ? 'diameter ' + cm(2 * r, e) : 'straal ' + cm(r, e)) + '.');
}
function balkMaat(l, b, h, e) {
  const o = [30, 150], W = 150, H = Math.min(100, 150 * h / l + 20), d = [50, -35];
  const A = o, B = [o[0] + W, o[1]], C = [B[0] + d[0], B[1] + d[1]], D = [A[0] + d[0], A[1] + d[1]], E = [A[0], A[1] - H], F = [B[0], B[1] - H], G = [C[0], C[1] - H], Hh = [D[0], D[1] - H];
  let s = '<polygon points="' + [A, B, C, G, Hh, E].map(pt2).join(' ') + '" fill="var(--k1)" fill-opacity=".18"/>' + [[A, B], [B, C], [E, F], [F, G], [G, Hh], [Hh, E], [A, E], [B, F], [C, G]].map(x => lijnS(x[0], x[1])).join('') + [[A, D], [D, C], [D, Hh]].map(x => lijnS(x[0], x[1], 1)).join('');
  s += tekst([(A[0] + B[0]) / 2, 170], cm(l, e)) + tekst([(B[0] + C[0]) / 2 + 12, (B[1] + C[1]) / 2 + 12], cm(b, e), 'start') + tekst([A[0] - 6, A[1] - H / 2], cm(h, e), 'end');
  return fig('0 0 280 180', s, 'Balk met lengte ' + cm(l, e) + ', breedte ' + cm(b, e) + ' en hoogte ' + cm(h, e) + '.');
}
function cilinderFig(r, h, e) {
  const s = '<path d="M60,30 V140 A50,14 0 0 0 160,140 V30" ' + vul + '/><ellipse cx="110" cy="30" rx="50" ry="14" fill="var(--k1)" fill-opacity=".1" stroke="var(--inkt)" stroke-width="2.2"/><path d="M60,140 A50,14 0 0 1 160,140" fill="none" stroke="var(--inkt)" stroke-width="1.4" stroke-dasharray="5 4"/>' +
    '<line x1="110" y1="30" x2="160" y2="30" stroke="#C8372D" stroke-width="2.2"/>' + tekst([135, 24], cm(r, e)) + tekst([168, 90], cm(h, e), 'start');
  return fig('0 0 240 170', s, 'Cilinder met straal ' + cm(r, e) + ' en hoogte ' + cm(h, e) + '.');
}
/* figuur van n vierkantjes die aan elkaar hangen; geeft cellen en omtrek in zijden */
function polyomino(R, n) {
  const c = [[0, 0]]; let pogingen = 0;
  while (c.length < n && pogingen++ < 200) { const b = R.kies(c), d = R.kies([[1, 0], [-1, 0], [0, 1], [0, -1]]), p = [b[0] + d[0], b[1] + d[1]]; if (!c.some(q => q[0] === p[0] && q[1] === p[1]) && Math.abs(p[0]) < 4 && Math.abs(p[1]) < 3) c.push(p); }
  let paren = 0; c.forEach(a => c.forEach(b => { if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1) paren++; }));
  return {c, omtrek:4 * c.length - paren};
}

/* ===== D ===== */
T('A-OOI-D1', 'ooi_d1_begrip', R => {
  const p = R.kies([['straal', 'cirkel'], ['hoogte', 'driehoek'], ['basis', 'driehoek'], ['zijde', 'vierkant'], ['grondvlak', 'cilinder']]);
  let s = '';
  if (p[1] === 'cirkel') s = '<circle cx="110" cy="80" r="62" ' + vul + '/><line x1="110" y1="80" x2="160" y2="44" stroke="#C8372D" stroke-width="3"/>' + stip([110, 80], '', 0, 0);
  if (p[1] === 'driehoek') { s = '<polygon points="20,150 220,150 80,30" ' + vul + '/>'; s += p[0] === 'hoogte' ? '<line x1="80" y1="30" x2="80" y2="150" stroke="#C8372D" stroke-width="3"/>' + rhoek([80, 150], [220, 150], [80, 30]) : '<line x1="20" y1="150" x2="220" y2="150" stroke="#C8372D" stroke-width="4"/>'; }
  if (p[1] === 'vierkant') s = '<rect x="50" y="30" width="120" height="120" ' + vul + '/><line x1="170" y1="30" x2="170" y2="150" stroke="#C8372D" stroke-width="4"/>';
  if (p[1] === 'cilinder') s = '<path d="M60,30 V130 A50,14 0 0 0 160,130 V30" ' + vul + '/><ellipse cx="110" cy="30" rx="50" ry="14" fill="none" stroke="var(--inkt)" stroke-width="2.2"/><ellipse cx="110" cy="130" rx="50" ry="14" fill="#C8372D" fill-opacity=".45" stroke="#C8372D" stroke-width="2"/>';
  return {q:`Wat is het rode deel van ${p[1] === 'vierkant' ? 'het' : 'de'} ${p[1]}?`, fig:fig('0 0 230 165', s, 'Een ' + p[1] + ' met een rood deel.'), o:keuzes(p[0], R.schud(['straal', 'hoogte', 'basis', 'zijde', 'grondvlak', 'diameter', 'omtrek'].filter(x => x !== p[0]))),
    u:{straal:'Het lijnstuk van het middelpunt naar de cirkel is de straal.', hoogte:'Het lijnstuk vanuit de top dat loodrecht op de basis staat, is de hoogte.', basis:'De zijde waarop de driehoek "staat" en waarop de hoogte loodrecht staat, is de basis.', zijde:'Een lijnstuk van de rand van het vierkant is een zijde.', grondvlak:'Het vlak waarop de cilinder staat, is het grondvlak.'}[p[0]]};
});
T('A-OOI-D2', 'ooi_d2_formule', R => ({q:'Welke formule geeft de inhoud (het volume) van een balk met lengte l, breedte b en hoogte h?', o:keuzes('V = l · b · h', ['V = 2 · (l + b + h)', 'V = l · b', 'V = 2 · (l · b + l · h + b · h)']),
  u:'Inhoud van een balk: lengte maal breedte maal hoogte. V = l · b · h.\nl · b is de oppervlakte van het grondvlak. 2 · (lb + lh + bh) is de totale oppervlakte.'}));
T('A-OOI-D2', 'ooi_d2_kiezen', R => {
  const l = R.int(4, 9), b = R.int(2, 5), h = R.int(2, 6);
  return {q:`Een doos is ${l} cm lang, ${b} cm breed en ${h} cm hoog.\nMet welke berekening vind je de inhoud?`, o:keuzes(`${l} · ${b} · ${h}`, [`${l} + ${b} + ${h}`, `2 · (${l} + ${b})`, `${l} · ${b}`]), u:`Inhoud van een balk = l · b · h = ${l} · ${b} · ${h} = ${l * b * h} cm³.`};
});

/* ===== C ===== */
T('A-OOI-C1', 'ooi_c1_formules', R => {
  const r = R.schud([['rechthoek: 2 · (l + b)', 'omtrek'], ['cirkel: π · r²', 'oppervlakte'], ['ruit: {{D · d|2}}', 'oppervlakte'], ['cirkel: 2 · π · r', 'omtrek'], ['driehoek: {{b · h|2}}', 'oppervlakte'], ['vierkant: 4 · z', 'omtrek'], ['trapezium: {{(B + b) · h|2}}', 'oppervlakte'], ['parallellogram: b · h', 'oppervlakte'], ['vierkant: z²', 'oppervlakte']]).slice(0, 4);
  if (!r.some(x => x[1] === 'omtrek') || r.every(x => x[1] === 'omtrek')) return null;
  return {q:'Berekent de formule de omtrek of de oppervlakte? Kies telkens.', sym:{palet:['omtrek', 'oppervlakte'], rijen:r.map(x => ({voor:x[0] + ' →', na:'', w:x[1]}))},
    u:'Bij een oppervlakte vermenigvuldig je twee lengtes (cm · cm = cm²). Bij een omtrek tel je lengtes op of neem je een veelvoud van één lengte.'};
});
T('A-OOI-C2', 'ooi_c2_omtrek', R => ({q:'Welke formule geeft de omtrek van een rechthoek met lengte l en breedte b?', o:keuzes('2 · (l + b)', ['l · b', 'l + b', '2 · l · b']), u:'De omtrek is de som van de vier zijden: l + b + l + b = 2 · (l + b).'}));
T('A-OOI-C3', 'ooi_c3_driehoek', R => {
  const b = R.int(6, 14), z1 = R.int(4, 10), z2 = R.int(5, 12), h = Math.min(z1, z2) - R.int(1, 2); if (z1 + z2 <= b || b + z1 <= z2 || h < 2) return null;
  return {q:'Bereken de omtrek van de driehoek.', fig:driehoekFig(b, h, [z1, z2]), velden:[veld(b + z1 + z2, 'cm')], calc:false,
    u:`Omtrek = som van de drie zijden: ${b} + ${z1} + ${z2} = ${b + z1 + z2} cm.\nDe hoogte (${h} cm) heb je voor de omtrek niet nodig.`};
});
T('A-OOI-C4', 'ooi_c4_zijde', R => {
  const a = R.int(5, 12), b = R.int(5, 12), c = R.int(4, 12); if (a + b <= c || a + c <= b || b + c <= a) return null;
  return {q:`De omtrek van een driehoek is ${a + b + c} cm. Twee zijden zijn ${a} cm en ${b} cm.\nHoe lang is de derde zijde?`, velden:[veld(c, 'cm')], calc:false, u:`${a + b + c} − ${a} − ${b} = ${c} cm.`};
});
T('A-OOI-C5', 'ooi_c5_rechthoek', R => {
  const l = R.int(6, 15), b = R.int(3, 9); if (l === b) return null;
  return {q:'Bereken de oppervlakte van de rechthoek.', fig:rechthoekFig(l, b), velden:[veld(l * b, 'cm²')], calc:false, u:`Oppervlakte = lengte · breedte = ${l} · ${b} = ${l * b} cm².`};
});
T('A-OOI-C6', 'ooi_c6_balk', R => {
  const l = R.int(5, 20), b = R.int(3, 10), h = R.int(2, 12), e = R.kies(['cm', 'dm', 'm']);
  return {q:'Bereken de inhoud van de balk.', fig:balkMaat(l, b, h, e), velden:[veld(l * b * h, e + '³')], u:`V = l · b · h = ${l} · ${b} · ${h} = ${l * b * h} ${e}³.`};
});

/* ===== B ===== */
T('A-OOI-B1', 'ooi_b1_kiezen', R => {
  const r = R.schud([['de hoeveelheid water in een aquarium', 'inhoud'], ['de lengte van een hek rond een tuin', 'omtrek'], ['hoeveel verf je nodig hebt voor een muur', 'oppervlakte'], ['de lengte van een sierboord rond een tafel', 'omtrek'],
    ['de hoeveelheid potgrond in een bloembak', 'inhoud'], ['hoeveel tapijt je nodig hebt voor een kamer', 'oppervlakte'], ['de lengte van een looppiste rond een voetbalveld', 'omtrek'], ['hoeveel papier je nodig hebt om een doos in te pakken', 'oppervlakte'], ['hoeveel zand er in een zandbak past', 'inhoud']]).slice(0, 4);
  return {q:'Moet je de omtrek, de oppervlakte of de inhoud berekenen? Kies telkens.', sym:{palet:['omtrek', 'oppervlakte', 'inhoud'], rijen:r.map(x => ({voor:x[0] + ' →', na:'', w:x[1]}))},
    u:'Omtrek: de lengte van de rand (m). Oppervlakte: hoeveel een vlak bedekt (m²). Inhoud: hoeveel er in een ruimtefiguur past (m³ of liter).'};
});
T('A-OOI-B2', 'ooi_b2_vierkantjes', R => {
  const P = polyomino(R, R.int(5, 8)); if (P.c.length < 5) return null;
  const xs = P.c.map(p => p[0]), ys = P.c.map(p => p[1]), x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
  let s = ''; P.c.forEach(p => { s += '<rect x="' + (10 + (p[0] - x0) * 36) + '" y="' + (10 + (p[1] - y0) * 36) + '" width="36" height="36" fill="#9fdcde" stroke="var(--inkt)" stroke-width="2"/>'; });
  const z = R.kies([1, 2, 3]);
  return {q:`De figuur bestaat uit vierkanten met een zijde van ${z} cm.\nBereken de omtrek van de figuur.`, fig:fig('0 0 ' + (20 + (Math.max.apply(null, xs) - x0 + 1) * 36) + ' ' + (20 + (Math.max.apply(null, ys) - y0 + 1) * 36), s, 'Figuur van ' + P.c.length + ' vierkanten.'), velden:[veld(P.omtrek * z, 'cm')], calc:false,
    u:`Tel de zijden aan de buitenkant: ${P.omtrek} zijden van ${z} cm.\n${P.omtrek} · ${z} = ${P.omtrek * z} cm.`};
});
T('A-OOI-B2', 'ooi_b2_cirkel', R => {
  const r = R.int(3, 15), d = R.int(0, 1);
  return {q:`Bereken de omtrek van de cirkel. Gebruik π ≈ 3,14 en rond af op 0,1 cm.`, fig:cirkelFig(r, d), velden:[veld(Math.round(2 * 3.14 * r * 10) / 10, 'cm')],
    u:`${d ? `De diameter is ${2 * r} cm, dus de straal is ${r} cm.\n` : ''}Omtrek = 2 · π · r = 2 · 3,14 · ${r} = ${f(2 * 3.14 * r)} cm.`};
});
T('A-OOI-B2', 'ooi_b2_trapezium', R => {
  const B = R.int(9, 15), b = R.int(4, 8), c = R.int(4, 7), d = R.int(4, 7);
  return {q:`Een trapezium heeft evenwijdige zijden van ${B} cm en ${b} cm. De opstaande zijden zijn ${c} cm en ${d} cm. De hoogte is ${Math.min(c, d) - 1} cm.\nBereken de omtrek.`, velden:[veld(B + b + c + d, 'cm')], calc:false,
    u:`Omtrek = ${B} + ${b} + ${c} + ${d} = ${B + b + c + d} cm. De hoogte heb je niet nodig.`};
});
T('A-OOI-B3', 'ooi_b3_context', R => {
  const l = R.kies([3.5, 4, 4.5, 5.2]), bcm = R.kies([280, 320, 350, 400]);
  return {q:`Een kamer is ${f(l)} m lang en ${bcm} cm breed. Je legt er laminaat.\nHoeveel m² laminaat heb je nodig?`, velden:[veld(l * bcm / 100, 'm²')],
    u:`Zet eerst alles in meter: ${bcm} cm = ${f(bcm / 100)} m.\n${f(l)} · ${f(bcm / 100)} = ${f(l * bcm / 100)} m².`};
});
T('A-OOI-B4', 'ooi_b4_figuur', R => {
  const v = R.int(0, 2);
  if (v === 0) { const b = R.int(6, 16), h = R.int(3, 10); return {q:'Bereken de oppervlakte van de driehoek.', fig:driehoekFig(b, h), velden:[veld(b * h / 2, 'cm²')], u:`A = {{b · h|2}} = {{${b} · ${h}|2}} = ${f(b * h / 2)} cm².`}; }
  if (v === 1) { const r = R.int(2, 12); return {q:'Bereken de oppervlakte van de cirkel. Gebruik π ≈ 3,14 en rond af op 0,1 cm².', fig:cirkelFig(r, 0), velden:[veld(Math.round(3.14 * r * r * 10) / 10, 'cm²')], u:`A = π · r² = 3,14 · ${r}² = 3,14 · ${r * r} = ${f(3.14 * r * r)} cm².`}; }
  const z = R.int(3, 14); return {q:'Bereken de oppervlakte van het vierkant.', fig:rechthoekFig(z, z, 'cm', 'Vierkant met zijde ' + z + ' cm.'), velden:[veld(z * z, 'cm²')], calc:false, u:`A = z² = ${z}² = ${z * z} cm².`};
});
T('A-OOI-B5', 'ooi_b5_zijde', R => {
  const v = R.int(0, 3), z = R.int(3, 15), l = R.int(6, 15), b = R.int(2, 9);
  if (v === 0) return {q:`De omtrek van een vierkant is ${4 * z} cm.\nHoe lang is een zijde?`, velden:[veld(z, 'cm')], calc:false, u:`${4 * z} : 4 = ${z} cm.`};
  if (v === 1) return {q:`De oppervlakte van een vierkant is ${z * z} cm².\nHoe lang is een zijde?`, velden:[veld(z, 'cm')], calc:false, u:`Zoek het getal dat in het kwadraat ${z * z} geeft: √${z * z} = ${z} cm.`};
  if (v === 2) return {q:`Een rechthoek heeft een oppervlakte van ${l * b} cm². De lengte is ${l} cm.\nHoe breed is de rechthoek?`, velden:[veld(b, 'cm')], calc:false, u:`${l * b} : ${l} = ${b} cm.`};
  return {q:`Een rechthoek heeft een omtrek van ${2 * (l + b)} cm. De lengte is ${l} cm.\nHoe breed is de rechthoek?`, velden:[veld(b, 'cm')], calc:false, u:`Lengte + breedte = ${2 * (l + b)} : 2 = ${l + b} cm.\nBreedte = ${l + b} − ${l} = ${b} cm.`};
});
T('A-OOI-B6', 'ooi_b6_balk', R => {
  const l = R.kies([2.5, 4, 6, 7.5]), b = R.int(2, 6), h = R.kies([1.5, 2, 3, 4]);
  return {q:`Een balk heeft ribben met lengte ${f(l)}, ${b} en ${f(h)}.\nBereken de inhoud van de balk.`, velden:[veld(l * b * h)], u:`V = ${f(l)} · ${b} · ${f(h)} = ${f(l * b * h)}.`};
});
T('A-OOI-B7', 'ooi_b7_ribbe', R => {
  const l = R.int(4, 12), b = R.int(2, 8), h = R.int(2, 10);
  return {q:`Een balk heeft een inhoud van ${l * b * h} cm³. De lengte is ${l} cm en de breedte is ${b} cm.\nHoe hoog is de balk?`, velden:[veld(h, 'cm')], u:`Grondvlak: ${l} · ${b} = ${l * b} cm².\nHoogte: ${l * b * h} : ${l * b} = ${h} cm.`};
});
T('A-OOI-B8', 'ooi_b8_kubus', R => {
  const z = R.kies([2, 3, 4, 5, 6, 7, 8, 10, 1.5, 2.5]);
  return {q:`Een kubus heeft een ribbe van ${f(z)} cm.\nBereken de inhoud.`, velden:[veld(z * z * z, 'cm³')], u:`V = z³ = ${f(z)} · ${f(z)} · ${f(z)} = ${f(z * z * z, 3)} cm³.`};
});
T('A-OOI-B9', 'ooi_b9_cilinder', R => {
  const g = R.kies([12.56, 28.26, 50.24, 78.5, 20, 35]), h = R.int(4, 15);
  return {q:`Een cilinder heeft een grondvlak met een oppervlakte van ${f(g)} cm². De hoogte is ${h} cm.\nBereken de inhoud.`, velden:[veld(+(g * h).toFixed(4), 'cm³')], u:`V = oppervlakte grondvlak · hoogte = ${f(g)} · ${h} = ${f(g * h)} cm³.`};
});

/* ===== A ===== */
T('A-OOI-A1', 'ooi_a1_zonder', R => {
  const v = R.int(0, 2);
  if (v === 0) { const b = R.int(5, 18), h = R.int(3, 12); return {q:`Een driehoek heeft een basis van ${b} cm en een bijhorende hoogte van ${h} cm.\nBereken de oppervlakte.`, velden:[veld(b * h / 2, 'cm²')], u:`A = {{b · h|2}} = {{${b} · ${h}|2}} = ${f(b * h / 2)} cm².`}; }
  if (v === 1) { const d = R.int(4, 20) * 2; return {q:`Een cirkel heeft een diameter van ${d} cm.\nBereken de oppervlakte. Gebruik π ≈ 3,14 en rond af op 0,1 cm².`, velden:[veld(Math.round(3.14 * d * d / 4 * 10) / 10, 'cm²')], u:`Let op: de diameter is gegeven. r = ${d} : 2 = ${d / 2} cm.\nA = π · r² = 3,14 · ${d * d / 4} = ${f(3.14 * d * d / 4)} cm².`}; }
  const z = R.kies([2.5, 3.5, 6, 7.5, 12]); return {q:`Een vierkant heeft een zijde van ${f(z)} m.\nBereken de oppervlakte.`, velden:[veld(z * z, 'm²')], u:`A = z² = ${f(z)} · ${f(z)} = ${f(z * z)} m².`};
});
T('A-OOI-A2', 'ooi_a2_samengesteld', R => {
  const v = R.int(0, 2);
  if (v === 0) { const l = R.int(6, 12), b = R.kies([4, 6, 8]), r = b / 2; return {q:`De figuur bestaat uit een rechthoek van ${l} m op ${b} m met aan de rechterkant een halve cirkel.\nBereken de oppervlakte van de hele figuur. Gebruik π ≈ 3,14 en rond af op 0,01 m².`,
    fig:fig('-34 0 334 150', `<path d="M20,25 H190 A55,55 0 0 1 190,135 H20 Z" ${vul}/>` + rhoek([20, 135], [190, 135], [20, 25]) + tekst([105, 18], l + ' m') + tekst([12, 85], b + ' m', 'end') + '<line x1="190" y1="25" x2="190" y2="135" stroke="var(--inkt)" stroke-width="1.4" stroke-dasharray="5 4"/>', 'Rechthoek met een halve cirkel aan de rechterkant.'),
    velden:[veld(Math.round((l * b + 3.14 * r * r / 2) * 100) / 100, 'm²')], u:`Rechthoek: ${l} · ${b} = ${l * b} m².\nHalve cirkel met straal ${r} m: 3,14 · ${r}² : 2 = ${f(3.14 * r * r / 2)} m².\nSamen: ${f(l * b + 3.14 * r * r / 2)} m².`}; }
  if (v === 1) { const D = R.int(6, 16), d = R.int(4, 12); return {q:`Een ruit heeft diagonalen van ${D} cm en ${d} cm.\nBereken de oppervlakte.`, velden:[veld(D * d / 2, 'cm²')], u:`A = {{D · d|2}} = {{${D} · ${d}|2}} = ${f(D * d / 2)} cm².`}; }
  const L = R.int(8, 12), B = R.int(6, 9), a = R.int(3, L - 3), b = R.int(2, B - 3);
  return {q:`Een L-vormige kamer: een rechthoek van ${L} m op ${B} m waarvan een hoek van ${a} m op ${b} m is weggenomen.\nBereken de oppervlakte van de kamer in m².`, velden:[veld(L * B - a * b, 'm²')], calc:false,
    fig:fig('-34 0 300 190', `<polygon points="20,20 ${20 + (L - a) * 18},20 ${20 + (L - a) * 18},${20 + b * 18} ${20 + L * 18},${20 + b * 18} ${20 + L * 18},${20 + B * 18} 20,${20 + B * 18}" ${vul}/>` + tekst([20 + L * 9, 36 + B * 18], L + ' m') + tekst([14, 24 + B * 9], B + ' m', 'end') + tekst([20 + (L - a / 2) * 18, 14 + b * 18 - 4], a + ' m') + tekst([26 + (L - a) * 18, 24 + b * 9], b + ' m', 'start'), 'L-vormige kamer.'),
    u:`Grote rechthoek: ${L} · ${B} = ${L * B} m². Weggenomen stuk: ${a} · ${b} = ${a * b} m².\n${L * B} − ${a * b} = ${L * B - a * b} m².`};
});
T('A-OOI-A3', 'ooi_a3_teveel', R => {
  const b = R.int(6, 14), h = R.int(3, 8), z = h + R.int(1, 3), dg = b + R.int(1, 4);
  if (R.int(0, 1)) return {q:`Een parallellogram heeft een basis van ${b} cm, een schuine zijde van ${z} cm, een hoogte van ${h} cm en een lange diagonaal van ${dg} cm.\nBereken de oppervlakte.`, velden:[veld(b * h, 'cm²')], calc:false,
    u:`A = basis · hoogte = ${b} · ${h} = ${b * h} cm². De schuine zijde en de diagonaal heb je niet nodig.`};
  const l = R.kies([1.2, 1.5, 2.4]), w = R.kies([60, 75, 80]);
  return {q:`Een tafelblad is ${f(l)} m lang, ${w} cm breed en 3 cm dik. De tafel is 75 cm hoog.\nBereken de omtrek van het tafelblad in cm.`, velden:[veld(2 * (l * 100 + w), 'cm')], calc:false,
    u:`${f(l)} m = ${f(l * 100)} cm. Omtrek = 2 · (${f(l * 100)} + ${w}) = ${f(2 * (l * 100 + w))} cm.\nDe dikte en de hoogte heb je niet nodig.`};
});
T('A-OOI-A4', 'ooi_a4_zijde', R => {
  const om = R.kies([2.4, 3.2, 3.6, 4.2]), l = R.kies([75, 95, 110, 120]), b = om * 50 - l; if (b <= 10) return null;
  return {q:`De omtrek van een rechthoekig fotokader is ${f(om)} m. Het kader is ${l} cm lang.\nHoe breed is het kader in cm?`, velden:[veld(b, 'cm')], calc:false,
    u:`${f(om)} m = ${f(om * 100)} cm. Lengte + breedte = ${f(om * 100)} : 2 = ${f(om * 50)} cm.\nBreedte = ${f(om * 50)} − ${l} = ${f(b)} cm.`};
});
T('A-OOI-A5', 'ooi_a5_hoogte', R => {
  const b = R.int(4, 16), h = R.int(3, 12), A = b * h / 2;
  if (R.int(0, 1)) return {q:`Een driehoek heeft een oppervlakte van ${f(A)} cm². De basis is ${b} cm.\nHoe groot is de bijhorende hoogte?`, velden:[veld(h, 'cm')], u:`A = {{b · h|2}}, dus h = {{2 · A|b}} = {{2 · ${f(A)}|${b}}} = ${h} cm.`};
  return {q:`Een driehoek heeft een oppervlakte van ${f(A)} cm². De hoogte is ${h} cm.\nHoe lang is de bijhorende basis?`, velden:[veld(b, 'cm')], u:`b = {{2 · A|h}} = {{2 · ${f(A)}|${h}}} = ${b} cm.`};
});
T('A-OOI-A6', 'ooi_a6_straal', R => {
  const r = R.int(2, 15);
  if (R.int(0, 1)) return {q:`Een cirkel heeft een omtrek van ${f(2 * 3.14 * r)} cm. Gebruik π ≈ 3,14.\nHoe groot is de straal?`, velden:[veld(r, 'cm')], u:`Omtrek = 2 · π · r, dus r = ${f(2 * 3.14 * r)} : (2 · 3,14) = ${f(2 * 3.14 * r)} : 6,28 = ${r} cm.`};
  return {q:`Een cirkel heeft een oppervlakte van ${f(3.14 * r * r)} cm². Gebruik π ≈ 3,14.\nHoe groot is de straal?`, velden:[veld(r, 'cm')], u:`A = π · r², dus r² = ${f(3.14 * r * r)} : 3,14 = ${r * r} en r = √${r * r} = ${r} cm.`};
});
T('A-OOI-A7', 'ooi_a7_inhoud', R => {
  const v = R.int(0, 2);
  if (v === 0) { const r = R.kies([5, 10, 15]), h = R.kies([20, 30, 40]); return {q:`Een cilindervormige pot heeft een straal van ${r} cm en een hoogte van ${h} cm.\nHoeveel liter past erin? Gebruik π ≈ 3,14 en rond af op 0,01 liter.`, fig:cilinderFig(r, h),
    velden:[veld(Math.round(3.14 * r * r * h / 10) / 100, 'liter')], u:`V = π · r² · h = 3,14 · ${r * r} · ${h} = ${f(3.14 * r * r * h)} cm³.\n1 liter = 1 dm³ = 1 000 cm³, dus ${f(3.14 * r * r * h / 1000, 3)} liter ≈ ${f(Math.round(3.14 * r * r * h / 10) / 100)} liter.`}; }
  if (v === 1) { const l = R.kies([80, 100, 120]), b = R.kies([30, 40, 50]), h = R.kies([40, 50, 60]); return {q:`Een aquarium is ${l} cm lang, ${b} cm breed en ${f(h / 100)} m hoog.\nHoeveel liter water kan er hoogstens in?`, velden:[veld(l * b * h / 1000, 'liter')],
    u:`Alles in cm: ${f(h / 100)} m = ${h} cm.\nV = ${l} · ${b} · ${h} = ${f(l * b * h)} cm³ = ${f(l * b * h / 1000)} dm³ = ${f(l * b * h / 1000)} liter.`}; }
  const a = R.int(3, 6), b = R.int(2, 4), c = R.int(2, 5), d = R.int(1, 3);
  return {q:`Een trapje bestaat uit twee balken op elkaar. De onderste balk is ${a + 2} dm lang, ${b} dm breed en ${c} dm hoog. De bovenste balk is ${a} dm lang, ${b} dm breed en ${d} dm hoog.\nBereken de totale inhoud in dm³.`, velden:[veld((a + 2) * b * c + a * b * d, 'dm³')],
    u:`Onderste balk: ${a + 2} · ${b} · ${c} = ${(a + 2) * b * c} dm³. Bovenste balk: ${a} · ${b} · ${d} = ${a * b * d} dm³.\nSamen: ${(a + 2) * b * c + a * b * d} dm³.`};
});
T('A-OOI-A8', 'ooi_a8_hoogte', R => {
  const r = R.int(2, 10), h = R.int(4, 25), V = 3.14 * r * r * h;
  return {q:`Een cilinder heeft een inhoud van ${f(V)} cm³ en een straal van ${r} cm. Gebruik π ≈ 3,14.\nHoe hoog is de cilinder?`, velden:[veld(h, 'cm')],
    u:`Grondvlak: 3,14 · ${r}² = ${f(3.14 * r * r)} cm².\nh = V : grondvlak = ${f(V)} : ${f(3.14 * r * r)} = ${h} cm.`};
});
T('A-OOI-A9', 'ooi_a9_oppervlakte', R => {
  const v = R.int(0, 2), l = R.int(4, 12), b = R.int(2, 8), h = R.int(2, 9);
  if (v === 0) return {q:`Een kubus heeft een ribbe van ${b} cm.\nBereken de totale oppervlakte van de kubus.`, velden:[veld(6 * b * b, 'cm²')], u:`Een kubus heeft 6 even grote vierkante zijvlakken: 6 · ${b}² = 6 · ${b * b} = ${6 * b * b} cm².`};
  if (v === 1) return {q:'Bereken de totale oppervlakte van de balk.', fig:balkMaat(l, b, h), velden:[veld(2 * (l * b + l * h + b * h), 'cm²')],
    u:`Drie paar zijvlakken: 2 · (${l} · ${b} + ${l} · ${h} + ${b} · ${h}) = 2 · (${l * b} + ${l * h} + ${b * h}) = ${2 * (l * b + l * h + b * h)} cm².`};
  return {q:'Bereken de oppervlakte van het voorste zijvlak van de balk (lengte maal hoogte).', fig:balkMaat(l, b, h), velden:[veld(l * h, 'cm²')], u:`Het voorste zijvlak is een rechthoek van ${l} cm op ${h} cm: ${l * h} cm².`};
});
T('A-OOI-A10', 'ooi_a10_ribbe', R => {
  const l = R.int(4, 12), b = R.int(2, 8), h = R.int(2, 10);
  return {q:`Een balk heeft een inhoud van ${l * b * h} cm³. Het grondvlak heeft een oppervlakte van ${l * b} cm².\nHoe hoog is de balk?`, velden:[veld(h, 'cm')], calc:false, u:`V = oppervlakte grondvlak · hoogte, dus h = ${l * b * h} : ${l * b} = ${h} cm.`};
});
T('A-OOI-A11', 'ooi_a11_kubus', R => {
  const z = R.int(2, 9), v = R.int(0, 2);
  if (v === 0) return {q:`Een kubus heeft een totale oppervlakte van ${6 * z * z} cm².\nHoe lang is een ribbe?`, velden:[veld(z, 'cm')], u:`Eén zijvlak: ${6 * z * z} : 6 = ${z * z} cm². Ribbe: √${z * z} = ${z} cm.`};
  if (v === 1) return {q:`Een kubus heeft een inhoud van ${z * z * z} cm³.\nHoe lang is een ribbe?`, velden:[veld(z, 'cm')], u:`Zoek het getal dat tot de derde macht ${z * z * z} geeft: ${z} · ${z} · ${z} = ${z * z * z}. De ribbe is ${z} cm.`};
  return {q:`Een kubusvormige doos heeft een inhoud van ${f(z * z * z / 1000, 3)} dm³.\nHoe lang is een ribbe in cm?`, velden:[veld(z, 'cm')], u:`${f(z * z * z / 1000, 3)} dm³ = ${z * z * z} cm³. ${z} · ${z} · ${z} = ${z * z * z}, dus de ribbe is ${z} cm.`};
});
/* ---------- Transformaties (dieptethema, A-stroom) ----------
   D: beeld kiezen en transformatie herkennen in eenvoudige situaties, symmetrieassen tellen, symmetriemiddelpunt
   C: eigenschappen kennen, symmetrie en congruentie, verband tussen transformaties, vector, omschrijvingen
   B: beeld tekenen op een vierkantenrooster, rotaties, hoek van een rotatie, coördinaten van een beeld
   A: driehoeksrooster, complexe situaties, coördinaten van centrum of vector, figuren die op zichzelf afgebeeld worden */
koppel('A', `
k1=A-TRA-B1 t_klikspieg=A-TRA-B1 k5=A-TRA-B1 t_klikversch=A-TRA-B1 k6=A-TRA-B1 t_klikspiegrecht=A-TRA-B1
k2=A-TRA-A3 t_klikcentrum=A-TRA-A3 m19=A-TRA-B5 m29=A-TRA-B5 m30=A-TRA-B5 m42=A-TRA-C3 mk6=A-TRA-C1
`);
/* asymmetrische figuren in een vak van 2 op 2 (roosterpunten) */
const VLAGGEN = [[{x:0, y:0}, {x:2, y:0}, {x:2, y:1}, {x:1, y:1}, {x:1, y:2}, {x:0, y:2}], [{x:0, y:0}, {x:1, y:0}, {x:1, y:1}, {x:2, y:2}, {x:0, y:2}], [{x:0, y:0}, {x:2, y:0}, {x:1, y:1}, {x:1, y:2}, {x:0, y:2}], [{x:0, y:0}, {x:2, y:1}, {x:1, y:2}, {x:0, y:2}]];
const verplaats = (pts, dx, dy) => pts.map(p => ({x:p.x + dx, y:p.y + dy}));
const sleutel = pts => pts.map(p => p.x + ',' + p.y).sort().join(';');
const vormSleutel = pts => { const mx = Math.min.apply(null, pts.map(p => p.x)), my = Math.min.apply(null, pts.map(p => p.y)); return sleutel(verplaats(pts, -mx, -my)); };
const TF = {
  spiegelV:c => p => ({x:2 * c - p.x, y:p.y}), spiegelH:c => p => ({x:p.x, y:2 * c - p.y}), punt:(cx, cy) => p => ({x:2 * cx - p.x, y:2 * cy - p.y}),
  schuif:(dx, dy) => p => ({x:p.x + dx, y:p.y + dy}), rot90:(cx, cy) => p => ({x:cx - (p.y - cy), y:cy + (p.x - cx)}), rot270:(cx, cy) => p => ({x:cx + (p.y - cy), y:cy - (p.x - cx)})
};
const hokjes = (n, r1, r2) => n === 0 ? '' : Math.abs(n) + (Math.abs(n) === 1 ? ' hokje' : ' hokjes') + ' naar ' + (n > 0 ? r1 : r2);
const vectorTekst = (dx, dy) => [hokjes(dx, 'rechts', 'links'), hokjes(dy, 'boven', 'beneden')].filter(Boolean).join(' en ');

/* ===== D ===== */
T('A-TRA-D1', 'tra_d1_beeld', R => {
  const F = verplaats(R.kies(VLAGGEN), 1, 5), sp = F.map(TF.spiegelV(4)), pu = F.map(TF.punt(4, 4)), sc = F.map(TF.schuif(8, 0)), r0 = F.map(TF.rot90(0, 0)), gl = verplaats(r0, 9 - Math.min.apply(null, r0.map(p => p.x)), 1 - Math.min.apply(null, r0.map(p => p.y)));
  if (new Set([sp, pu, sc, gl].map(vormSleutel)).size < 4) return null;
  const sl = R.schud([['spiegeling', sp], ['puntspiegeling', pu], ['verschuiving', sc], ['andere', gl]]), L = 'ABCD';
  const vraag = R.kies(['spiegeling', 'puntspiegeling', 'verschuiving']), i = sl.findIndex(x => x[0] === vraag);
  const tekstV = {spiegeling:'de spiegeling om de rechte m', puntspiegeling:'de puntspiegeling om O', verschuiving:'de verschuiving met de pijl'}[vraag];
  return {q:`Welke figuur is het beeld van F door ${tekstV}?`, fig:{t:'rooster2', alt:'Rooster met figuur F, de rechte m, het punt O, een pijl en de figuren A, B, C en D.', r:{xmin:0, xmax:12, ymin:0, ymax:8,
    figuren:[{pts:F, kl:2, l:'F'}].concat(sl.map((x, j) => ({pts:x[1], kl:1, l:L[j]}))), lijnen:[{x1:4, y1:0, x2:4, y2:8, vol:1, l:'m'}, {x1:1, y1:0.5, x2:9, y2:0.5, vol:1, pijl:1}], punten:[{x:4, y:4, l:'O'}]}},
    ...letterKeuze(L.length, i, 'figuur '),
    u:{spiegeling:'Bij een spiegeling om m ligt het beeld aan de andere kant van m, even ver, en is de figuur omgeklapt.', puntspiegeling:'Bij een puntspiegeling om O ligt elk beeldpunt recht tegenover het punt, even ver van O. De figuur staat op zijn kop (halve draai).', verschuiving:'Bij een verschuiving schuift de figuur zonder te draaien of om te klappen, zoals de pijl aangeeft.'}[vraag] + ` Dat is figuur ${L[i]}.`};
});
T('A-TRA-D2', 'tra_d2_herkennen', R => {
  const F = verplaats(R.kies(VLAGGEN), 2, 2), soort = R.kies(['spiegeling', 'puntspiegeling', 'verschuiving', 'rotatie']);
  const G = soort === 'spiegeling' ? F.map(TF.spiegelV(5)) : soort === 'puntspiegeling' ? F.map(TF.punt(5, 3)) : soort === 'verschuiving' ? F.map(TF.schuif(5, R.int(-1, 2))) : F.map(TF.rot270(5, 2));
  if (G.some(p => p.x < 0 || p.x > 10 || p.y < 0 || p.y > 7)) return null;
  /* eenduidig: de vorm van het beeld mag niet ook bij een ander soort transformatie horen */
  const sk = {verschuiving:[F], spiegeling:[F.map(TF.spiegelV(0))], puntspiegeling:[F.map(TF.punt(0, 0))], rotatie:[F.map(TF.rot90(0, 0)), F.map(TF.rot270(0, 0))]};
  if (Object.keys(sk).some(k => k !== soort && sk[k].some(v => vormSleutel(v) === vormSleutel(G)))) return null;
  return {q:`Figuur F' is het beeld van figuur F.\nDoor welke transformatie?`, fig:{t:'rooster2', alt:'Rooster met de figuren F en F\'.', r:{xmin:0, xmax:10, ymin:0, ymax:7, figuren:[{pts:F, kl:2, l:'F'}, {pts:G, kl:1, l:'F\''}]}},
    o:(j => keuzes(j, ['een spiegeling', 'een puntspiegeling', 'een verschuiving', 'een rotatie over 90°'].filter(x => x !== j)))(soort === 'rotatie' ? 'een rotatie over 90°' : 'een ' + soort),
    u:{spiegeling:'F\' is omgeklapt ten opzichte van F: een spiegeling.', puntspiegeling:'F\' staat op zijn kop (een halve draai): een puntspiegeling.', verschuiving:'F\' heeft dezelfde stand als F, alleen op een andere plaats: een verschuiving.', rotatie:'F\' is een kwartslag gedraaid: een rotatie over 90°.'}[soort]};
});
T('A-TRA-D3', 'tra_d3_assen', R => {
  const p = R.kies([['gelijkzijdige driehoek', 3], ['vierkant', 4], ['rechthoek', 2], ['ruit', 2], ['zeshoek', 6], ['vijfhoek', 5], ['trapezium', 1], ['parallellogram', 0], ['vlieger', 1]]);
  return {q:'Hoeveel symmetrieassen heeft deze figuur?', fig:vormenRij([p[0]], p[0]), velden:[veld(p[1])], calc:false,
    u:`Deze figuur (een ${p[0] === 'trapezium' ? 'gelijkbenig trapezium' : p[0] === 'zeshoek' ? 'regelmatige zeshoek' : p[0] === 'vijfhoek' ? 'regelmatige vijfhoek' : p[0]}) heeft ${p[1]} symmetrieas${p[1] === 1 ? '' : 'sen'}.` + (p[0] === 'parallellogram' ? '\nPlooi je een parallellogram langs een diagonaal, dan vallen de helften niet op elkaar.' : '')};
});
T('A-TRA-D4', 'tra_d4_middelpunt', R => {
  const vormen = [[[0, 0], [4, 0], [4, 2], [6, 2], [6, 4], [2, 4], [2, 2], [0, 2]], [[0, 0], [4, 0], [6, 2], [2, 2]], [[0, 2], [2, 0], [4, 0], [6, 2], [4, 4], [2, 4]]];
  const v = R.kies(vormen), dx = R.int(1, 3), dy = R.int(0, 2), pts = v.map(p => ({x:p[0] + dx, y:p[1] + dy}));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), M = {x:(Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, y:(Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2};
  return {q:'Klik op het symmetriemiddelpunt van de figuur.', rooster:{xmin:0, xmax:10, ymin:0, ymax:7, figuren:[{pts, kl:1}]}, w:M,
    u:'Het symmetriemiddelpunt is het punt waarrond je de figuur een halve draai kan geven zodat ze op zichzelf valt. Het ligt in het midden tussen twee overstaande hoekpunten.'};
});

/* ===== C ===== */
T('A-TRA-C1', 'tra_c1_eigenschappen', R => {
  const tr = R.kies(['spiegeling', 'puntspiegeling', 'verschuiving', 'rotatie']);
  const r = R.schud([{t:`Een ${tr} bewaart de lengte van een lijnstuk.`, w:true}, {t:`Een ${tr} verandert de grootte van een hoek.`, w:false}, {t:`Bij een ${tr} blijven evenwijdige rechten evenwijdig.`, w:true},
    {t:`Punten op één rechte liggen na een ${tr} niet meer op één rechte.`, w:false}, {t:`Bij een ${tr} blijven loodrechte rechten loodrecht.`, w:true}, {t:`Een ${tr} maakt een figuur groter.`, w:false}]).slice(0, 4);
  return {q:'Zijn de uitspraken juist of fout?', jf:r, u:`Een ${tr} is een isometrie: lengtes, hoeken, evenwijdigheid, loodrechte stand en punten op één rechte (collineariteit) blijven behouden.`};
});
T('A-TRA-C2', 'tra_c2_toepassen', R => {
  const p = R.kies([['Je spiegelt een gelijkbenige driehoek ABC met |CA| = |CB| om de basis [AB].', 'een ruit', ['een rechthoek', 'een trapezium', 'een vlieger die geen ruit is']],
    ['Je spiegelt een rechthoekige driehoek om een rechthoekszijde.', 'een gelijkbenige driehoek', ['een rechthoek', 'een ruit', 'een gelijkzijdige driehoek']],
    ['Je spiegelt een driehoek ABC met |CA| ≠ |CB| om de zijde [AB].', 'een vlieger', ['een ruit', 'een rechthoek', 'een parallellogram']],
    ['Je past een puntspiegeling toe op een driehoek ABC, met als centrum het midden van [AB].', 'een parallellogram', ['een vlieger', 'een trapezium', 'een gelijkbenige driehoek']]]);
  return {q:`${p[0]}\nWelke figuur vormen de driehoek en zijn beeld samen?`, o:keuzes(p[1], p[2]), u:`Beeld en origineel zijn congruent, dus overeenkomstige zijden zijn even lang. Zo krijg je ${p[1]}.`};
});
T('A-TRA-C3', 'tra_c3_verband', R => {
  const p = R.kies([['Een puntspiegeling om O is hetzelfde als een rotatie om O over …', '180°', ['90°', '360°', '45°']], ['Een rotatie om O over 360° beeldt elk punt af op …', 'zichzelf', ['O', 'het spiegelbeeld', 'een punt 360 hokjes verder']],
    ['Twee puntspiegelingen na elkaar om hetzelfde centrum O geven …', 'elk punt terug op zichzelf', ['een rotatie over 90°', 'een spiegeling', 'een verschuiving over 2 hokjes']],
    ['Een rotatie om O over 180° is hetzelfde als …', 'een puntspiegeling om O', ['een spiegeling om een rechte door O', 'een verschuiving', 'een rotatie over 90°']]]);
  return {q:p[0], o:keuzes(p[1], p[2]), u:'Een puntspiegeling is een halve draai: een rotatie over 180°. Twee halve draaien na elkaar geven een volledige draai (360°): alles komt terug op zijn plaats.'};
});
T('A-TRA-C4', 'tra_c4_vector', R => {
  const F = verplaats(R.kies(VLAGGEN), R.int(0, 2), R.int(0, 4)), dx = R.int(-2, 6), dy = R.int(-3, 3); if (!dx && !dy) return null;
  const G = F.map(TF.schuif(dx, dy)); if (G.some(p => p.x < 0 || p.x > 10 || p.y < 0 || p.y > 7)) return null;
  return {q:`Figuur F' is het beeld van F door een verschuiving.\nHoe is F verschoven?`, fig:{t:'rooster2', alt:'Rooster met F en F\'.', r:{xmin:0, xmax:10, ymin:0, ymax:7, figuren:[{pts:F, kl:2, l:'F'}, {pts:G, kl:1, l:'F\''}]}},
    o:keuzes(vectorTekst(dx, dy), [vectorTekst(-dx, -dy), vectorTekst(dy || 1, dx), vectorTekst(dx + (dx > 0 ? 1 : -1), dy)].filter(x => x)),
    u:`Kies een hoekpunt van F en zoek het overeenkomstige hoekpunt van F'. Tel de hokjes: ${vectorTekst(dx, dy)}.`};
});
T('A-TRA-C5', 'tra_c5_omschrijving', R => {
  const D = [['een puntspiegeling om O', "O is het midden van elk lijnstuk [PP']."], ['een spiegeling om de rechte m', "m is de middelloodlijn van elk lijnstuk [PP'] (als P niet op m ligt)."], ['een verschuiving', "Alle lijnstukken [PP'] zijn even lang, evenwijdig en in dezelfde zin."]];
  const p = R.kies(D);
  return {q:`P' is telkens het beeld van P. Welke omschrijving hoort bij ${p[0]}?`, o:keuzes(p[1], D.filter(x => x !== p).map(x => x[1]).concat(["P' ligt altijd op dezelfde plaats als P."])),
    u:`Bij ${p[0]}: ${p[1]}`};
});

/* ===== B ===== */
T('A-TRA-B1', 'tra_b1_diagonaal', R => {
  const c = R.int(-1, 1), px = R.int(0, 7), py = R.int(0, 6); if (py === px + c) return null;
  const bx = py - c, by = px + c; if (bx < 0 || bx > 7 || by < 0 || by > 6) return null;
  return {q:'Het rooster bestaat uit gelijke vierkanten. Het punt P wordt gespiegeld om de schuine rechte m.\nKlik op het beeld van P.', rooster:{xmin:0, xmax:7, ymin:0, ymax:6, lijnen:[{x1:Math.max(0, -c), y1:Math.max(0, c), x2:Math.min(7, 6 - c), y2:Math.min(6, 7 + c), vol:1, l:'m'}], punten:[{x:px, y:py, l:'P'}]}, w:{x:bx, y:by},
    u:'Het beeld ligt aan de andere kant van m, op dezelfde loodlijn en even ver. De rechte m loopt schuin over de hokjes: verbind P met zijn beeld door schuin over de hokjes te gaan, loodrecht op m.'};
});
T('A-TRA-B1', 'tra_b1_figuur', R => {
  const F = verplaats(R.kies(VLAGGEN), R.int(1, 3), R.int(1, 3)), cx = R.int(4, 5), i = R.int(0, F.length - 1);
  const G = F.map(TF.spiegelV(cx)); if (G.some(p => p.x > 9)) return null;
  const L = 'ABCDEF';
  return {q:`Je spiegelt de figuur om de rechte m. Klik op het beeld van hoekpunt ${L[i]}.`, rooster:{xmin:0, xmax:9, ymin:0, ymax:6, figuren:[{pts:F, kl:2}], lijnen:[{x1:cx, y1:0, x2:cx, y2:6, vol:1, l:'m'}], punten:F.map((p, j) => ({x:p.x, y:p.y, l:L[j]}))}, w:G[i],
    u:`${L[i]} ligt ${cx - F[i].x} hokje${cx - F[i].x === 1 ? '' : 's'} links van m. Het beeld ligt even ver rechts van m, op dezelfde hoogte.`};
});
T('A-TRA-B2', 'tra_b2_rotatie', R => {
  const cx = R.int(3, 5), cy = R.int(2, 4), px = R.int(0, 8), py = R.int(0, 6), zin = R.kies(['tegenwijzerzin', 'wijzerzin']); if (px === cx && py === cy) return null;
  const b = (zin === 'tegenwijzerzin' ? TF.rot90 : TF.rot270)(cx, cy)({x:px, y:py}); if (b.x < 0 || b.x > 8 || b.y < 0 || b.y > 6) return null;
  return {q:`Het punt P wordt gedraaid om O over 90° in ${zin}.\nKlik op het beeld van P.`, rooster:{xmin:0, xmax:8, ymin:0, ymax:6, punten:[{x:px, y:py, l:'P'}, {x:cx, y:cy, l:'O'}]}, w:b,
    u:`Van O naar P: ${vectorTekst(px - cx, py - cy)}. Draai die beweging een kwartslag in ${zin}: van O ${vectorTekst(b.x - cx, b.y - cy)}. Daar ligt het beeld.\n|OP| = |OP'| en de hoek POP' is 90°.`};
});
T('A-TRA-B3', 'tra_b3_hoek', R => {
  const F = verplaats(R.kies(VLAGGEN), 6, 4), k = R.kies([1, 2, 3]), O = {x:5, y:3};
  let G = F; for (let i = 0; i < k; i++) G = G.map(TF.rot90(O.x, O.y));
  if (G.concat(F).some(p => p.x < 0 || p.x > 10 || p.y < 0 || p.y > 7)) return null;
  return {q:`Figuur F' is het beeld van F door een rotatie om O.\nOver hoeveel graden is F gedraaid (in tegenwijzerzin)?`, fig:{t:'rooster2', alt:'Rooster met F, F\' en het centrum O.', r:{xmin:0, xmax:10, ymin:0, ymax:7, figuren:[{pts:F, kl:2, l:'F'}, {pts:G, kl:1, l:'F\''}], punten:[O].map(p => ({x:p.x, y:p.y, l:'O'}))}},
    o:keuzes(90 * k + '°', ['90°', '180°', '270°', '45°'].filter(x => x !== 90 * k + '°')),
    u:`Verbind O met een hoekpunt van F en met het overeenkomstige hoekpunt van F'. De hoek daartussen is ${90 * k}° in tegenwijzerzin` + (k === 3 ? ' (dat is ook 90° in wijzerzin).' : k === 2 ? ' (een halve draai, dus een puntspiegeling).' : '.')};
});
T('A-TRA-B4', 'tra_b4_gebruiken', R => {
  const tr = R.kies(['een spiegeling', 'een rotatie', 'een verschuiving', 'een puntspiegeling']), z = R.int(3, 9), h = R.int(25, 80), v = R.int(0, 1);
  return {q:`△A'B'C' is het beeld van △ABC door ${tr}. |AB| = ${z} cm en ${hk1('B')} = ${h}°.\nHoe groot is ${v ? `${hk1("B'")}` : "|A'B'|"}?`.replace("B'̂", "B̂'"), velden:[veld(v ? h : z, v ? '°' : 'cm')], calc:false,
    u:`${tr[0].toUpperCase() + tr.slice(1)} bewaart lengtes en hoekgroottes. Dus ${v ? `${hk1('B')}' = ${h}°` : `|A'B'| = |AB| = ${z} cm`}.`};
});
T('A-TRA-B5', 'tra_b5_coord', R => {
  const x = R.int(-6, 6), y = R.int(-6, 6); if (!x || !y) return null;
  const p = R.kies([['de spiegeling om de x-as', x, -y], ['de spiegeling om de y-as', -x, y], ['de puntspiegeling om de oorsprong', -x, -y], ['de verschuiving 3 eenheden naar links en 2 naar boven', x - 3, y + 2]]);
  return {q:`Wat zijn de coördinaten van het beeld van P(${minT(x)}, ${minT(y)}) door ${p[0]}?`, velden:[veld(p[1], '', 'x ='), veld(p[2], '', 'y =')], calc:false,
    u:(p[0].indexOf('x-as') > 0 ? 'Bij een spiegeling om de x-as blijft x gelijk en wordt y het tegengestelde.' : p[0].indexOf('y-as') > 0 ? 'Bij een spiegeling om de y-as wordt x het tegengestelde en blijft y gelijk.' : p[0].indexOf('oorsprong') > 0 ? 'Bij een puntspiegeling om de oorsprong worden beide coördinaten het tegengestelde.' : 'Naar links: x − 3. Naar boven: y + 2.') + `\nHet beeld is (${minT(p[1])}, ${minT(p[2])}).`};
});
T('A-TRA-B6', 'tra_b6_rotatie', R => {
  const a = R.kies([60, 90, 120]);
  return {q:`P' is het beeld van P door een rotatie om O over ${a}°.\nWat weet je zeker?`, o:keuzes(`|OP| = |OP'| en de hoek POP' is ${a}°.`, [`|PP'| = |OP| en de hoek POP' is ${180 - a}°.`, `O is het midden van [PP'].`, `|OP'| = 2 · |OP|.`]),
    u:`Bij een rotatie blijft de afstand tot het centrum gelijk (|OP| = |OP'|) en is de hoek POP' gelijk aan de draaihoek: ${a}°.`};
});

/* ===== A ===== */
T('A-TRA-A1', 'tra_a1_driehoek', R => {
  const soort = R.kies(['punt', 'rot60', 'spiegel']), C = {x:R.int(2, 3), y:R.int(2, 3)}, P = {x:R.int(0, 5), y:R.int(0, 5)};
  if (P.x === C.x && P.y === C.y) return null;
  const b = soort === 'punt' ? {x:2 * C.x - P.x, y:2 * C.y - P.y} : soort === 'rot60' ? {x:C.x - (P.y - C.y), y:C.y + (P.x - C.x) + (P.y - C.y)} : {x:P.x + P.y - C.y, y:2 * C.y - P.y};
  const r = {xmin:-1, xmax:7, ymin:0, ymax:6, tri:1};
  const binnen = q => q.y >= r.ymin && q.y <= r.ymax && q.x + q.y / 2 >= r.xmin - 1e-9 && q.x + q.y / 2 <= r.xmax + 1e-9;
  if (!binnen(P) || !binnen(b) || (soort === 'spiegel' && P.y === C.y)) return null;
  const pts = soort === 'spiegel' ? [{x:P.x, y:P.y, l:'P'}] : [{x:P.x, y:P.y, l:'P'}, {x:C.x, y:C.y, l:'O'}];
  return {q:`Het rooster bestaat uit gelijkzijdige driehoeken. ${soort === 'punt' ? 'P wordt gespiegeld door de puntspiegeling om O.' : soort === 'rot60' ? 'P wordt gedraaid om O over 60° in tegenwijzerzin.' : 'P wordt gespiegeld om de horizontale rechte m.'}\nKlik op het beeld van P.`,
    rooster:Object.assign(r, {punten:pts, lijnen:soort === 'spiegel' ? [{x1:-1 - C.y / 2, y1:C.y, x2:7 - C.y / 2, y2:C.y, vol:1, l:'m'}] : []}), w:b,
    u:soort === 'punt' ? 'Ga van P naar O en dan nog eens even ver in dezelfde richting.' : soort === 'rot60' ? 'Bij een draaiing over 60° blijft de afstand tot O gelijk. Op een driehoeksrooster is 60° precies de hoek tussen twee roosterlijnen.' : 'Het beeld ligt aan de andere kant van m, even ver, recht tegenover P.'};
});
T('A-TRA-A2', 'tra_a2_complex', R => {
  const F = verplaats(R.kies(VLAGGEN), 2, 4), O = {x:5, y:4}, G = F.map(TF.punt(O.x, O.y));
  const r = R.schud([{t:"F' is het beeld van F door een puntspiegeling om O.", w:true}, {t:"F' is het beeld van F door een rotatie om O over 180°.", w:true}, {t:"F' is het beeld van F door een verschuiving.", w:false}, {t:"F' is het beeld van F door een spiegeling om de rechte m.", w:false}, {t:"F' is het beeld van F door een rotatie om O over 90°.", w:false}]).slice(0, 4);
  return {q:'Zijn de uitspraken juist of fout?', fig:{t:'rooster2', alt:'Rooster met F, F\', het punt O en de rechte m.', r:{xmin:0, xmax:10, ymin:0, ymax:8, figuren:[{pts:F, kl:2, l:'F'}, {pts:G, kl:1, l:'F\''}], lijnen:[{x1:5, y1:0, x2:5, y2:8, vol:1, l:'m'}], punten:[{x:O.x, y:O.y, l:'O'}]}},
    jf:r, u:"F' staat op zijn kop ten opzichte van F, met O in het midden: een puntspiegeling om O. Dat is hetzelfde als een rotatie om O over 180°.\nEen spiegeling om m zou de figuur alleen omklappen, niet op zijn kop zetten."};
});
T('A-TRA-A3', 'tra_a3_coord', R => {
  const v = R.int(0, 2), x = R.int(-6, 6), y = R.int(-6, 6), a = R.int(-4, 4), b = R.int(-4, 4);
  if (v === 0) { if ((x + a) % 2 || (y + b) % 2) return null; return {q:`P(${minT(x)}, ${minT(y)}) wordt door een puntspiegeling afgebeeld op P'(${minT(a)}, ${minT(b)}).\nWat zijn de coördinaten van het centrum?`, velden:[veld((x + a) / 2, '', 'x ='), veld((y + b) / 2, '', 'y =')], calc:false,
    u:`Het centrum is het midden van [PP']: ((${minT(x)} + ${haakN(a)}) : 2, (${minT(y)} + ${haakN(b)}) : 2) = (${minT((x + a) / 2)}, ${minT((y + b) / 2)}).`}; }
  if (v === 1) return {q:`Bij een verschuiving is het eindpunt van de vector (${minT(a)}, ${minT(b)}). Elk punt gaat ${vectorTekst(x, y).replace(/hokjes?/g, m => m === 'hokje' ? 'eenheid' : 'eenheden')}.\nWat zijn de coördinaten van het beginpunt?`, velden:[veld(a - x, '', 'x ='), veld(b - y, '', 'y =')], calc:false,
    u:`Terugrekenen: x = ${minT(a)} − ${haakN(x)} = ${minT(a - x)} en y = ${minT(b)} − ${haakN(y)} = ${minT(b - y)}.`};
  if (!x || !y) return null;
  return {q:`P(${minT(x)}, ${minT(y)}) wordt gedraaid om de oorsprong over 90° in tegenwijzerzin.\nWat zijn de coördinaten van het beeld?`, velden:[veld(-y, '', 'x ='), veld(x, '', 'y =')], calc:false,
    u:`Bij een draaiing om de oorsprong over 90° in tegenwijzerzin wordt (x, y) het punt (−y, x).\nHet beeld is (${minT(-y)}, ${minT(x)}).`};
});
T('A-TRA-A4', 'tra_a4_zichzelf', R => {
  const met = ['parallellogram', 'rechthoek', 'ruit', 'zeshoek', 'vierkant', 'cirkel'], zonder = ['gelijkzijdige driehoek', 'trapezium', 'vlieger', 'vijfhoek', 'gelijkbenige driehoek'];
  const j = R.schud(met).slice(0, R.int(2, 3)), n = R.schud(zonder).slice(0, 5 - j.length), namen = R.schud(j.concat(n)), L = 'ABCDEF';
  return {q:'Welke figuren worden door een puntspiegeling om een punt op zichzelf afgebeeld? Duid alle juiste figuren aan.', fig:vormenRij(namen), o:namen.map((x, i) => 'figuur ' + L[i]), mk:namen.map((x, i) => j.indexOf(x) >= 0 ? i : -1).filter(i => i >= 0), vast:true,
    u:'Een figuur wordt op zichzelf afgebeeld door een puntspiegeling als ze na een halve draai dezelfde is. Let op: een gelijkzijdige driehoek en een regelmatige vijfhoek hebben wel symmetrieassen, maar geen symmetriemiddelpunt.'};
});
/* ---------- Statistiek (dieptethema, A-stroom) ----------
   D: diagrammen herkennen, waarden aflezen, totaal uit een frequentietabel, tabel aanvullen uit ruwe data
   C: frequenties ordenen, staafhoogte bij ruwe data, mediaan van geordende getallen, stappen van een onderzoek, modus uit een cirkeldiagram
   B: lijndiagram ordenen, waarde zonder labels, totaal uit een diagram, cirkelsegmenten, gemiddelde, modus, nodige data
   A: berekeningen met diagrammen, hoek van een segment, percentages, mediaan en gemiddelde uit tabel of diagram, ontbrekend gegeven */
koppel('A', `
s02=A-STA-D2 s08=A-STA-D2 t_staaf=A-STA-D2 t_s1_staaflees=A-STA-D2 t_sm_lijnlees=A-STA-D2 t_s1_tabel=A-STA-D2 s05=A-STA-D3 t_sb2_totaal=A-STA-D3 t_sm_turven=A-STA-D4
s12=A-STA-C8 s18=A-STA-C6 vk6=A-STA-C5 t_sm_meeste=A-STA-C1
s13=A-STA-B6 s14=A-STA-B6 s39=A-STA-B6 t_s3_taartaantal=A-STA-B6 s16=A-STA-B7 t_gemiddelde=A-STA-B7 s17=A-STA-B10 t_modus=A-STA-B10 s28=A-STA-B10 s25=A-STA-B5 s06=A-STA-B5 s31=A-STA-B5 t_sm_meer=A-STA-B5
s29=A-STA-A3 t_relfreq=A-STA-A3 s07=A-STA-A3 s33=A-STA-A3 t_sm_procent=A-STA-A3 t_s3_relfreqtab=A-STA-A3 s15=A-STA-A2 t_sm_taarthoek=A-STA-A2
s19=A-STA-A4 t_mediaan=A-STA-A4 t_s4_mediaaneven=A-STA-A4 s27=A-STA-A4 t_sm_mediaantab=A-STA-A4 s03=A-STA-A5 t_staafgem=A-STA-A5 s11=A-STA-A5 s26=A-STA-A5 t_s4_freqgem=A-STA-A5
s10=A-STA-A8 t_variatie=A-STA-A8 s20=A-STA-A9 t_s4_ontbrekend=A-STA-A9 s22=A-STA-A9 s36=A-STA-A9
s21=A-STA-A10 t_s5_wissel=A-STA-A10 s23=A-STA-A10 t_gemcomb=A-STA-A10 s24=A-STA-A10 s38=A-STA-A10 t_s5_gemna=A-STA-A10 t_sm_gemextra=A-STA-A10
`);
/* contexten met categorieën */
const STAT = [['Lievelingssport', ['voetbal', 'dans', 'zwemmen', 'tennis', 'basket'], 'aantal leerlingen'], ['Vervoer naar school', ['fiets', 'bus', 'te voet', 'auto', 'trein'], 'aantal leerlingen'],
  ['Lievelingsfruit', ['appel', 'banaan', 'peer', 'kiwi', 'aardbei'], 'aantal leerlingen'], ['Huisdieren', ['hond', 'kat', 'konijn', 'vis', 'geen'], 'aantal leerlingen'], ['Lievelingsijs', ['vanille', 'chocolade', 'aardbei', 'mokka', 'citroen'], 'aantal leerlingen']];
function statData(R, n, min, max, uniek) {
  const c = R.kies(STAT), cats = R.schud(c[1]).slice(0, n || 4); let vals;
  for (let t = 0; t < 50; t++) { vals = cats.map(() => R.int(min || 2, max || 12)); if (!uniek || new Set(vals).size === vals.length) break; }
  if (uniek && new Set(vals).size < vals.length) return null;
  return {titel:c[0], cats, vals, ylab:c[2], tot:vals.reduce((a, b) => a + b, 0)};
}
const staafF = (d, x) => Object.assign({t:'staaf', titel:d.titel, x:d.cats, y:d.vals, min:0, max:Math.ceil(Math.max.apply(null, d.vals) / 2) * 2 + 2, stap:2, ylab:d.ylab}, x || {});
const tabF = (d, kop2) => ({t:'tab', titel:d.titel, kop:['', kop2 || 'aantal'], rijen:d.cats.map((c, i) => [c, d.vals[i]])});
/* cirkeldiagram met percenten die mooi uitkomen (veelvouden van 5) */
function taartData(R, n) {
  const c = R.kies(STAT), cats = R.schud(c[1]).slice(0, n || 4); let p;
  for (let t = 0; t < 100; t++) { p = cats.slice(0, -1).map(() => R.int(2, 8) * 5); const rest = 100 - p.reduce((a, b) => a + b, 0); if (rest >= 10 && rest <= 45) { p.push(rest); break; } p = null; }
  if (!p) return null;
  return {titel:c[0], cats, pct:p};
}
const taartF = (d, x) => Object.assign({t:'taart', titel:d.titel, delen:d.cats.map((c, i) => [c, d.pct[i]])}, x || {});
/* kleine staaf- of lijndiagrammen naast elkaar (voor kiesvragen) */
function miniDiagram(x0, vals, max, soort, l) {
  let s = '<line class="fas" x1="' + x0 + '" y1="100" x2="' + (x0 + 80) + '" y2="100"/><line class="fas" x1="' + x0 + '" y1="100" x2="' + x0 + '" y2="10"/>';
  const bw = 80 / vals.length, Y = v => 100 - v / max * 85;
  if (soort === 'staaf') vals.forEach((v, i) => { s += '<rect x="' + (x0 + i * bw + 3) + '" y="' + Y(v).toFixed(1) + '" width="' + (bw - 6) + '" height="' + (100 - Y(v)).toFixed(1) + '" fill="var(--k1)"/>'; });
  else s += '<polyline fill="none" stroke="var(--k1)" stroke-width="2.5" points="' + vals.map((v, i) => (x0 + i * bw + bw / 2).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ') + '"/>' + vals.map((v, i) => '<circle cx="' + (x0 + i * bw + bw / 2).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="3.5" fill="var(--k1)"/>').join('');
  return s + tekst([x0 + 40, 122], '<tspan font-weight="700">' + l + '</tspan>');
}
const somV = a => a.reduce((x, y) => x + y, 0);
const mediaan = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

/* ===== D ===== */
T('A-STA-D1', 'sta_d1_soort', R => {
  const soort = R.kies(['staafdiagram', 'cirkeldiagram', 'lijndiagram']); let fg;
  if (soort === 'staafdiagram') { const d = statData(R); fg = staafF(d); }
  if (soort === 'cirkeldiagram') { const d = taartData(R); if (!d) return null; fg = taartF(d); }
  if (soort === 'lijndiagram') fg = {t:'lijn', titel:'Temperatuur om 12 uur', x:DAGEN, y:DAGEN.map(() => R.int(8, 22)), min:0, max:24, stap:4, ylab:'°C'};
  return {q:'Welk soort diagram is dit?', fig:fg, o:keuzes(soort, ['staafdiagram', 'cirkeldiagram', 'lijndiagram', 'frequentietabel'].filter(x => x !== soort)),
    u:{staafdiagram:'Elke waarde is een staaf: een staafdiagram.', cirkeldiagram:'Een cirkel verdeeld in stukken (sectoren): een cirkeldiagram.', lijndiagram:'Punten verbonden door een lijn, vaak om een verloop in de tijd te tonen: een lijndiagram.'}[soort]};
});
T('A-STA-D2', 'sta_d2_aflezen', R => {
  const v = R.int(0, 1);
  if (v === 0) { const d = statData(R), i = R.int(0, 3); return {q:`Hoeveel leerlingen kozen ${d.cats[i]}?`, fig:staafF(d), velden:[veld(d.vals[i], 'leerlingen')], calc:false, u:`Lees de hoogte van de staaf "${d.cats[i]}" af op de verticale as: ${d.vals[i]}.`}; }
  const d = taartData(R); if (!d) return null; const i = R.int(0, d.cats.length - 1);
  return {q:`Hoeveel procent van de leerlingen koos ${d.cats[i]}?`, fig:taartF(d), velden:[veld(d.pct[i], '%')], calc:false, u:`Bij de sector "${d.cats[i]}" staat ${d.pct[i]} %.`};
});
T('A-STA-D3', 'sta_d3_totaal', R => {
  const d = statData(R, 5, 1, 14);
  return {q:'Hoeveel leerlingen werden er in totaal bevraagd?', fig:tabF(d, 'aantal leerlingen'), velden:[veld(d.tot, 'leerlingen')], calc:false, u:`Tel alle frequenties op: ${d.vals.join(' + ')} = ${d.tot}.`};
});
T('A-STA-D4', 'sta_d4_aanvullen', R => {
  const c = R.kies(STAT), cats = R.schud(c[1]).slice(0, 4), data = []; for (let i = 0; i < R.int(14, 20); i++) data.push(R.kies(cats));
  const i = R.int(0, 3), n = data.filter(x => x === cats[i]).length; if (!n) return null;
  return {q:`${data.length} leerlingen gaven hun antwoord (${c[0].toLowerCase()}):\n${data.join(', ')}\nJe maakt een frequentietabel. Welk getal komt bij "${cats[i]}"?`, velden:[veld(n)], calc:false, u:`Tel hoe vaak "${cats[i]}" voorkomt: ${n} keer. Tip: zet een streepje per antwoord (turven).`};
});
T('A-STA-D5', 'sta_d5_associeer', R => {
  const d = statData(R, 4, 1, 10, true); if (!d) return null;
  const varianten = [d.vals, d.vals.slice().reverse(), d.vals.map((v, i) => i === 1 ? v + 3 : v), d.vals.slice(1).concat(d.vals[0])];
  if (new Set(varianten.map(v => v.join())).size < 4) return null;
  const opt = R.schud(varianten), L = 'ABCD', i = opt.indexOf(varianten[0]);
  return {q:`Welk staafdiagram hoort bij de tabel? (De staven staan in dezelfde volgorde als de tabel.)\n${d.cats.map((c, j) => c + ': ' + d.vals[j]).join(' · ')}`, fig:fig('0 0 420 130', opt.map((v, j) => miniDiagram(10 + j * 104, v, 13, 'staaf', L[j])).join(''), 'Vier kleine staafdiagrammen A, B, C en D.'),
    ...letterKeuze(L.length, i, 'diagram '), u:`Vergelijk de hoogtes met de tabel: ${d.vals.join(', ')}. Dat is diagram ${L[i]}.`};
});

/* ===== C ===== */
T('A-STA-C1', 'sta_c1_ordenen', R => {
  if (R.int(0, 1)) { const d = statData(R, 4, 2, 12, true); if (!d) return null; const s = d.cats.map((c, i) => [c, d.vals[i]]).sort((a, b) => a[1] - b[1]);
    return {q:'Zet de categorieën in de juiste volgorde, van klein naar groot aantal.', fig:staafF(d), kaartjes:s.map(x => x[0]), u:'Van de laagste naar de hoogste staaf: ' + s.map(x => x[0] + ' (' + x[1] + ')').join(', ') + '.'}; }
  const d = taartData(R); if (!d || new Set(d.pct).size < d.pct.length) return null; const s = d.cats.map((c, i) => [c, d.pct[i]]).sort((a, b) => a[1] - b[1]);
  return {q:'Zet de categorieën in de juiste volgorde, van klein naar groot aantal.', fig:taartF(d), kaartjes:s.map(x => x[0]), u:'Van de kleinste naar de grootste sector: ' + s.map(x => x[0] + ' (' + x[1] + ' %)').join(', ') + '.'};
});
T('A-STA-C2', 'sta_c2_staaf', R => {
  const sc = []; for (let i = 0; i < R.int(14, 20); i++) sc.push(R.int(5, 10));
  const w = R.int(5, 10), n = sc.filter(x => x === w).length; if (!n) return null;
  return {q:`De scores op 10 van een klas: ${sc.join(', ')}.\nJe tekent een staafdiagram met een staaf per score. Hoe hoog wordt de staaf voor de score ${w}?`, velden:[veld(n)], calc:false, u:`De score ${w} komt ${n} keer voor, dus de staaf is ${n} hoog.`};
});
T('A-STA-C3', 'sta_c3_lijn', R => {
  const vals = [0, 1, 2, 3, 4].map(() => R.int(2, 12)); if (new Set(vals).size < 4) return null;
  const varianten = [vals, vals.slice().reverse(), vals.map((v, i) => i === 2 ? Math.max(0, v - 4) : v), vals.map((v, i) => i === 0 ? v + 3 : i === 4 ? Math.max(0, v - 3) : v)];
  if (new Set(varianten.map(v => v.join())).size < 4) return null;
  const opt = R.schud(varianten), L = 'ABCD', i = opt.indexOf(varianten[0]);
  return {q:`Het aantal verkochte ijsjes per dag: ${DAGEN.slice(0, 5).map((d, j) => d + ' ' + vals[j]).join(', ')}.\nWelk lijndiagram hoort bij deze gegevens?`, fig:fig('0 0 420 130', opt.map((v, j) => miniDiagram(10 + j * 104, v, 15, 'lijn', L[j])).join(''), 'Vier kleine lijndiagrammen A, B, C en D.'),
    ...letterKeuze(L.length, i, 'diagram '), u:`Volg het verloop: ${vals.join(', ')}. Dat is diagram ${L[i]}.`};
});
T('A-STA-C4', 'sta_c4_waarde', R => {
  const d = statData(R, 4, 2, 12, true); if (!d) return null;
  const L = ['A', 'B', 'C', 'D'], i = R.int(0, 3), pm = R.schud([0, 1, 2, 3]);
  return {q:`De frequentietabel: ${d.cats.map((c, j) => c + ' ' + d.vals[j]).join(' · ')}.\nIn het staafdiagram zijn de namen vervangen door letters. Welke staaf hoort bij ${d.cats[i]}?`, fig:staafF({titel:d.titel, cats:L, vals:pm.map(k => d.vals[k]), ylab:d.ylab}),
    ...letterKeuze(L.length, pm.indexOf(i), 'staaf '),
    u:`${d.cats[i]} heeft ${d.vals[i]} leerlingen. De staaf die ${d.vals[i]} hoog is, is staaf ${L[pm.indexOf(i)]}.`};
});
T('A-STA-C5', 'sta_c5_werkwijze', R => {
  if (R.int(0, 1)) return {q:'Hoe bepaal je de mediaan van een reeks getallen?', o:keuzes('Rangschik de getallen van klein naar groot en neem het middelste getal (of het gemiddelde van de twee middelste).', ['Tel alle getallen op en deel door het aantal getallen.', 'Neem het getal dat het meest voorkomt.', 'Trek het kleinste getal af van het grootste.']),
    u:'Mediaan: eerst rangschikken, dan het midden nemen. Bij een even aantal: het gemiddelde van de twee middelste.'};
  return {q:'Hoe bereken je het rekenkundig gemiddelde van een reeks getallen?', o:keuzes('Tel alle getallen op en deel door het aantal getallen.', ['Rangschik de getallen en neem het middelste getal.', 'Neem het getal dat het meest voorkomt.', 'Tel het grootste en het kleinste getal op en deel door 2.']), u:'Gemiddelde = som van de getallen : aantal getallen.'};
});
T('A-STA-C6', 'sta_c6_mediaan', R => {
  const n = R.kies([5, 7, 9]), a = []; for (let i = 0; i < n; i++) a.push(R.int(3, 20)); a.sort((x, y) => x - y);
  return {q:`Bepaal de mediaan van deze geordende getallen:\n${a.join(', ')}`, velden:[veld(mediaan(a))], calc:false, u:`Er zijn ${n} getallen. Het middelste is het ${(n + 1) / 2}de getal: ${mediaan(a)}.`};
});
T('A-STA-C7', 'sta_c7_stappen', R => ({q:'Zet de stappen van een statistisch onderzoek in de juiste volgorde.', kaartjes:['een onderzoeksvraag stellen', 'gegevens verzamelen', 'gegevens ordenen en voorstellen in een tabel of diagram', 'de gegevens analyseren en een besluit formuleren'],
  u:'Eerst de vraag, dan verzamelen, dan ordenen en voorstellen, en tot slot analyseren en besluiten.'}));
T('A-STA-C8', 'sta_c8_modus', R => {
  const d = taartData(R); if (!d) return null; const mx = Math.max.apply(null, d.pct); if (d.pct.filter(p => p === mx).length > 1) return null; const i = d.pct.indexOf(mx);
  return {q:'Wat is de modus van deze gegevens?', fig:taartF(d), o:keuzes(d.cats[i], d.cats.filter((c, j) => j !== i)), u:`De modus is de waarde die het vaakst voorkomt: de grootste sector, ${d.cats[i]} (${mx} %).`};
});

/* ===== B ===== */
T('A-STA-B1', 'sta_b1_lijn', R => {
  const y = DAGEN.map(() => R.int(4, 24)), keuze = R.schud([0, 1, 2, 3, 4, 5, 6]).slice(0, 4); if (new Set(keuze.map(k => y[k])).size < 4) return null;
  const s = keuze.slice().sort((a, b) => y[a] - y[b]);
  return {q:'Het lijndiagram toont hoeveel mm regen er per dag viel. Zet de dagen in de juiste volgorde, van weinig naar veel regen.', fig:{t:'lijn', titel:'Neerslag per dag', x:DAGEN, y, min:0, max:26, stap:2, ylab:'mm'}, kaartjes:s.map(k => DAGEN[k]),
    u:'Hoe hoger het punt, hoe meer regen: ' + s.map(k => DAGEN[k] + ' (' + y[k] + ' mm)').join(', ') + '.'};
});
T('A-STA-B2', 'sta_b2_zonderas', R => {
  const st = R.kies([5, 10, 25]), d = statData(R, 4, 1, 8, true); if (!d) return null; const vals = d.vals.map(v => v * st), i = R.int(0, 3);
  const lab = vals.map((v, j) => j === i ? null : v);
  return {q:`Op de verticale as staan geen getallen, maar wel bij de andere staven.\nHoeveel stemmen kreeg ${d.cats[i]}?`, fig:{t:'staaf', titel:d.titel + ' (stemmen)', x:d.cats, y:vals, min:0, max:Math.ceil(Math.max.apply(null, vals) / st + 1) * st, stap:st, ylab:'stemmen', zonderAs:1, waarden:lab}, velden:[veld(vals[i])], calc:false,
    u:`Eén hokje van het rooster is ${st} waard (vergelijk de staven met een getal). De staaf ${d.cats[i]} is ${mv(vals[i] / st, 'hokje', 'hokjes')} hoog: ${vals[i] / st} · ${st} = ${vals[i]}.`};
});
T('A-STA-B3', 'sta_b3_hoogte', R => {
  const N = R.kies([20, 25, 40, 50]), d = taartData(R); if (!d) return null; const i = R.int(0, d.cats.length - 1), n = N * d.pct[i] / 100; if (!Number.isInteger(n)) return null;
  return {q:`In een klas van ${N} leerlingen gaf ${d.pct[i]} % "${d.cats[i]}" als antwoord.\nJe tekent een staafdiagram met het aantal leerlingen. Hoe hoog wordt de staaf "${d.cats[i]}"?`, velden:[veld(n, 'leerlingen')], u:`${d.pct[i]} % van ${N} = ${N} · ${f(d.pct[i] / 100)} = ${n}.`};
});
T('A-STA-B4', 'sta_b4_totaal', R => {
  const d = statData(R, 5, 1, 12);
  return {q:'Hoeveel leerlingen werden er in totaal bevraagd?', fig:staafF(d), velden:[veld(d.tot, 'leerlingen')], calc:false, u:`Tel de hoogtes van alle staven op: ${d.vals.join(' + ')} = ${d.tot}.`};
});
T('A-STA-B5', 'sta_b5_interpreteren', R => {
  const vals = [R.int(2, 6), R.int(5, 10), R.int(3, 8), R.int(1, 5), R.int(0, 3)], k = R.int(1, 3);
  return {q:`Hoeveel leerlingen hebben meer dan ${k} broer${k === 1 ? '' : 's'} of zus${k === 1 ? '' : 'sen'}?`, fig:{t:'tab', titel:'Broers en zussen', kop:['aantal broers en zussen', 'aantal leerlingen'], rijen:vals.map((v, i) => [i, v])},
    velden:[veld(somV(vals.slice(k + 1)), 'leerlingen')], calc:false, u:`Meer dan ${k} broers of zussen: dat zijn de rijen ${vals.map((v, i) => i > k ? i : null).filter(x => x != null).join(' en ')}.\nTel de aantallen leerlingen van die rijen op: ${vals.slice(k + 1).length > 1 ? vals.slice(k + 1).join(' + ') + ' = ' : ''}${somV(vals.slice(k + 1))}.`};
});
T('A-STA-B6', 'sta_b6_taart', R => {
  const N = R.kies([200, 300, 400, 600, 800]), d = taartData(R); if (!d) return null; const i = R.int(0, d.cats.length - 1);
  return {q:`Het cirkeldiagram geldt voor ${N} leerlingen.\nHoeveel leerlingen kozen ${d.cats[i]}?`, fig:taartF(d), velden:[veld(N * d.pct[i] / 100, 'leerlingen')], u:`${d.pct[i]} % van ${N} = ${N} · ${f(d.pct[i] / 100)} = ${N * d.pct[i] / 100}.`};
});
T('A-STA-B7', 'sta_b7_gemiddelde', R => {
  const n = R.int(5, 7), a = []; for (let i = 0; i < n; i++) a.push(R.int(8, 19)); const g = somV(a) / n; if (!Number.isInteger(g * 10)) return null;
  return {q:`${R.naam()} haalde deze scores op 20: ${a.join(', ')}.\nWat is het gemiddelde?`, velden:[veld(g)], u:`Som: ${a.join(' + ')} = ${somV(a)}. Aantal: ${n}.\n${somV(a)} : ${n} = ${f(g)}.`};
});
T('A-STA-B8', 'sta_b8_nodig', R => {
  if (R.int(0, 1)) return {q:'Wat heb je minimaal nodig om het rekenkundig gemiddelde te berekenen?', o:keuzes('de som van alle gegevens en het aantal gegevens', ['alleen het grootste en het kleinste gegeven', 'alleen het middelste gegeven', 'alleen het gegeven dat het meest voorkomt']), u:'Gemiddelde = som : aantal. Je hebt dus de som en het aantal nodig, niet elk gegeven apart.'};
  return {q:'Wat heb je minimaal nodig om de mediaan te bepalen?', o:keuzes('alle gegevens, gerangschikt van klein naar groot', ['de som van alle gegevens', 'het grootste en het kleinste gegeven', 'het gegeven dat het meest voorkomt']), u:'Voor de mediaan moet je de gegevens rangschikken en het middelste zoeken.'};
});
T('A-STA-B9', 'sta_b9_werkwijze', R => {
  if (R.int(0, 1)) return {q:'Hoe bepaal je de variatiebreedte?', o:keuzes('Trek het kleinste gegeven af van het grootste gegeven.', ['Neem het gegeven dat het meest voorkomt.', 'Neem het middelste gegeven.', 'Tel het grootste en het kleinste gegeven op.']), u:'Variatiebreedte = grootste − kleinste.'};
  return {q:'Hoe bepaal je de modus?', o:keuzes('Neem het gegeven dat het vaakst voorkomt.', ['Neem het middelste gegeven na rangschikken.', 'Trek het kleinste gegeven af van het grootste.', 'Deel de som door het aantal gegevens.']), u:'De modus is het gegeven met de grootste frequentie.'};
});
T('A-STA-B10', 'sta_b10_modus', R => {
  const a = []; for (let i = 0; i < 9; i++) a.push(R.int(3, 10)); const fr = {}; a.forEach(x => fr[x] = (fr[x] || 0) + 1);
  const mx = Math.max.apply(null, Object.values(fr)), m = Object.keys(fr).filter(k => fr[k] === mx); if (m.length > 1) return null;
  if (R.int(0, 1)) return {q:`Bepaal de modus: ${a.join(', ')}`, velden:[veld(+m[0])], calc:false, u:`${m[0]} komt het vaakst voor (${mx} keer).`};
  const ks = Object.keys(fr).sort((x, y) => x - y);
  return {q:'De tabel toont de scores op 10 van een groep. Wat is de modus?', fig:{t:'tab', titel:'Scores', kop:['score', 'aantal leerlingen'], rijen:ks.map(k => [+k, fr[k]])}, velden:[veld(+m[0])], calc:false,
    u:`De score met de grootste frequentie (${mx}) is ${m[0]}. Let op: de modus is de score, niet de frequentie.`};
});

/* ===== A ===== */
T('A-STA-A1', 'sta_a1_dubbel', R => {
  const kl = ['2A', '2B', '2C', '2D'], j = kl.map(() => R.int(6, 14)), m = kl.map(() => R.int(6, 14)), i = R.int(0, 3);
  const T0 = somV(j) + somV(m), p = (j[i] + m[i]) / T0 * 100;
  return {q:`Het dubbel staafdiagram toont het aantal jongens en meisjes per klas.\nHoeveel procent van alle leerlingen zit in ${kl[i]}? Rond af op 1 %.`, fig:{t:'staaf', titel:'Leerlingen per klas', x:kl, y:j, y2:m, leg:['jongens', 'meisjes'], min:0, max:16, stap:2, ylab:'aantal'}, velden:[veld(Math.round(p), '%')],
    u:`Totaal: ${somV(j)} jongens + ${somV(m)} meisjes = ${T0}. In ${kl[i]}: ${j[i]} + ${m[i]} = ${j[i] + m[i]}.\n${j[i] + m[i]} : ${T0} = ${f(p / 100, 4)} ≈ ${Math.round(p)} %.`};
});
T('A-STA-A2', 'sta_a2_hoek', R => {
  if (R.int(0, 1)) { const p = R.kies([10, 15, 20, 25, 30, 35, 40, 45]); return {q:`In een cirkeldiagram is de sector "fiets" ${p} %.\nHoe groot is de middelpuntshoek van die sector?`, velden:[veld(p * 3.6, '°')], u:`De hele cirkel is 360° = 100 %. 1 % is 3,6°. ${p} · 3,6° = ${f(p * 3.6)}°.`}; }
  const N = R.kies([24, 30, 36, 40, 60]), n = R.int(2, N / 2), h = n / N * 360; if (!Number.isInteger(h)) return null;
  return {q:`Van de ${N} leerlingen kozen er ${n} voor tennis. Je tekent een cirkeldiagram.\nHoe groot is de middelpuntshoek van de sector "tennis"?`, velden:[veld(h, '°')], u:`{{${n}|${N}}} van 360° = ${n} : ${N} · 360° = ${h}°.`};
});
T('A-STA-A3', 'sta_a3_procent', R => {
  const d = statData(R, 4, 2, 15), i = R.int(0, 3), p = d.vals[i] / d.tot * 100;
  return {q:`Hoeveel procent van de leerlingen koos ${d.cats[i]}? Rond af op 0,1 %.`, fig:tabF(d, 'aantal leerlingen'), velden:[veld(Math.round(p * 10) / 10, '%')],
    u:`Totaal: ${d.tot} leerlingen. ${d.vals[i]} : ${d.tot} = ${f(d.vals[i] / d.tot, 4)} ≈ ${f(Math.round(p * 10) / 10)} %.`};
});
T('A-STA-A4', 'sta_a4_mediaan', R => {
  if (R.int(0, 1)) { const n = R.kies([6, 8]), a = []; for (let i = 0; i < n; i++) a.push(R.int(2, 30)); return {q:`Bepaal de mediaan van deze getallen:\n${a.join(', ')}`, velden:[veld(mediaan(a))], calc:false,
    u:`Rangschik eerst: ${a.slice().sort((x, y) => x - y).join(', ')}.\nEr zijn ${n} getallen, dus neem het gemiddelde van het ${n / 2}de en het ${n / 2 + 1}de getal: ${f(mediaan(a))}.`}; }
  const fr = [R.int(1, 4), R.int(2, 6), R.int(3, 8), R.int(2, 6), R.int(1, 4)], sc = [6, 7, 8, 9, 10], all = []; fr.forEach((n, i) => { for (let k = 0; k < n; k++) all.push(sc[i]); });
  return {q:'De tabel toont de scores op 10 van een groep leerlingen. Wat is de mediaan?', fig:{t:'tab', titel:'Scores', kop:['score', 'aantal leerlingen'], rijen:sc.map((s, i) => [s, fr[i]])}, velden:[veld(mediaan(all))], calc:false,
    u:`Er zijn ${all.length} leerlingen. ${all.length % 2 ? `De mediaan is de score van de ${(all.length + 1) / 2}de leerling` : `De mediaan is het gemiddelde van de scores van de ${all.length / 2}de en de ${all.length / 2 + 1}de leerling`} (tel de frequenties op van boven naar beneden): ${f(mediaan(all))}.`};
});
T('A-STA-A5', 'sta_a5_gemiddelde', R => {
  const fr = [R.int(1, 5), R.int(2, 8), R.int(2, 6), R.int(1, 4), R.int(0, 3)], n = somV(fr), s = somV(fr.map((x, i) => x * i)), g = s / n;
  return {q:'De tabel toont hoeveel huisdieren de leerlingen van een klas hebben.\nHoeveel huisdieren hebben ze gemiddeld? Rond af op 0,01.', fig:{t:'tab', titel:'Huisdieren', kop:['aantal huisdieren', 'aantal leerlingen'], rijen:fr.map((x, i) => [i, x])}, velden:[veld(Math.round(g * 100) / 100)],
    u:`Totaal aantal huisdieren: ${fr.map((x, i) => i + ' · ' + x).join(' + ')} = ${s}. Aantal leerlingen: ${n}.\n${s} : ${n} ≈ ${f(Math.round(g * 100) / 100)}.`};
});
T('A-STA-A6', 'sta_a6_letters', R => {
  const d = R.kies([1, 2, 3, 4]), n = R.kies([3, 4, 5]), t = [...Array(n).keys()].map(i => i * d), som = somV(t), g = som / n;
  const gT = g === 0 ? 'x' : 'x + ' + f(g);
  return {q:`Wat is het gemiddelde van ${t.map(k => k ? 'x + ' + k : 'x').join(', ')}?`, o:keuzes(gT, ['x + ' + f(som), n + 'x + ' + f(som), 'x + ' + f(t[t.length - 1])].filter(x => x !== gT)),
    u:`Som: ${n}x + ${som}. Delen door ${n}: x + ${f(g)}.`};
});
T('A-STA-A7', 'sta_a7_modus', R => {
  const y = [R.int(1, 6), R.int(2, 8), R.int(2, 9), R.int(1, 7), R.int(0, 4), R.int(0, 2)], mx = Math.max.apply(null, y); if (y.filter(v => v === mx).length > 1) return null;
  return {q:'Het staafdiagram toont hoeveel doelpunten een ploeg per match scoorde.\nWat is de modus van het aantal doelpunten?', fig:{t:'staaf', titel:'Doelpunten per match', x:['0', '1', '2', '3', '4', '5'], y, min:0, max:10, stap:2, ylab:'aantal matchen'}, velden:[veld(y.indexOf(mx), 'doelpunten')], calc:false,
    u:`De hoogste staaf (${mx} matchen) staat bij ${y.indexOf(mx)} doelpunten. De modus is ${y.indexOf(mx)}, niet ${mx}.`};
});
T('A-STA-A8', 'sta_a8_variatie', R => {
  const y = DAGEN.map(() => R.int(-6, 12));
  return {q:'Het lijndiagram toont de minimumtemperatuur per dag in een winterweek.\nWat is de variatiebreedte?', fig:{t:'lijn', titel:'Minimumtemperatuur', x:DAGEN, y, min:-8, max:14, stap:2, ylab:'°C'}, velden:[veld(Math.max.apply(null, y) - Math.min.apply(null, y), '°C')], calc:false,
    u:`Hoogste: ${minT(Math.max.apply(null, y))} °C, laagste: ${minT(Math.min.apply(null, y))} °C.\n${minT(Math.max.apply(null, y))} − ${haakN(Math.min.apply(null, y))} = ${Math.max.apply(null, y) - Math.min.apply(null, y)} °C.`};
});
T('A-STA-A9', 'sta_a9_ontbrekend', R => {
  const v = R.int(0, 1), a = [R.int(4, 9), R.int(10, 14), R.int(15, 19), R.int(20, 25)];
  if (v === 0) { const vb = R.int(22, 30); return {q:`Van vijf getallen zijn er vier gekend: ${a.join(', ')}. Het vijfde getal is groter dan alle andere. De variatiebreedte is ${vb}.\nWat is het vijfde getal?`, velden:[veld(a[0] + vb)], calc:false,
    u:`Variatiebreedte = grootste − kleinste. Het kleinste getal is ${a[0]}, dus het grootste is ${a[0]} + ${vb} = ${a[0] + vb}.`}; }
  const n = 5, g = R.int(12, 18), x = n * g - somV(a); if (x < 0 || x > 40) return null;
  return {q:`Het gemiddelde van vijf getallen is ${g}. Vier getallen zijn ${a.join(', ')}.\nWat is het vijfde getal?`, velden:[veld(x)], calc:false, u:`Som van de vijf getallen: 5 · ${g} = ${5 * g}. Som van de vier: ${somV(a)}.\nHet vijfde getal: ${5 * g} − ${somV(a)} = ${x}.`};
});
T('A-STA-A10', 'sta_a10_vraagstuk', R => {
  const n1 = R.kies([10, 20, 24]), n2 = R.kies([15, 16, 30]), g1 = R.int(10, 15), g2 = R.int(11, 16), g = (n1 * g1 + n2 * g2) / (n1 + n2);
  return {q:`Klas A (${n1} leerlingen) haalde gemiddeld ${g1} op 20. Klas B (${n2} leerlingen) haalde gemiddeld ${g2} op 20.\nWat is het gemiddelde van alle leerlingen samen? Rond af op 0,1.`, velden:[veld(Math.round(g * 10) / 10)],
    u:`Totaal punten: ${n1} · ${g1} + ${n2} · ${g2} = ${n1 * g1 + n2 * g2}. Aantal leerlingen: ${n1 + n2}.\n${n1 * g1 + n2 * g2} : ${n1 + n2} ≈ ${f(Math.round(g * 10) / 10)}.\nLet op: het gemiddelde van ${g1} en ${g2} is niet juist, want de klassen zijn niet even groot.`};
});
/* ---------- Tabellen en diagrammen (dieptethema, A-stroom) ----------
   D: aflezen in een tabel, een staafdiagram en een cirkeldiagram met aantallen; staaf- en lijndiagram vergelijken
   C: cirkel- en lijndiagram vergelijken, procenten aflezen, grote getallen in een tabel
   B: diagrammen vergelijken met te veel gegevens, tabel aanvullen en gebruiken, negatieve getallen, lijndiagram, organigram
   A: voorstellingen vergelijken, meerdere berekeningen, een lijndiagram verwerken, procenten en kommagetallen in diagrammen */
koppel('A', `
s09=A-TAD-B5 t_sm_stijging=A-TAD-B5 s32=A-TAD-B3 s37=A-TAD-A1
`);
const BUSTAB = R => { const st = R.int(6, 7) * 60 + R.kies([5, 12, 20]), duur = R.kies([22, 28, 35]), om = R.kies([20, 30]); return {st, duur, om, rijen:[0, 1, 2, 3, 4].map(k => [tijdT(Math.floor((st + k * om) / 60), (st + k * om) % 60), tijdT(Math.floor((st + k * om + duur) / 60), (st + k * om + duur) % 60)])}; };
/* verzonnen gemeenten: echte namen met verzonnen aantallen zouden leerlingen iets verkeerds leren */
const GEMEENTEN = ['Groendijk', 'Molenbeke', 'Zandhove', 'Lindegem', 'Beekstede', 'Hoeveland'];
const MAANDEN = ['jan', 'feb', 'maa', 'apr', 'mei', 'jun'];

/* ===== D ===== */
T('A-TAD-D1', 'tad_d1_bus', R => {
  const b = BUSTAB(R), i = R.int(1, 3);
  return {q:`Je neemt de bus die om ${b.rijen[i][0]} vertrekt.\nHoe laat kom je aan?`, fig:{t:'tab', titel:'Bus Lievegem – Gent', kop:['vertrek Lievegem', 'aankomst Gent'], rijen:b.rijen}, o:keuzes(b.rijen[i][1], [b.rijen[i + 1][1], b.rijen[i - 1][1], b.rijen[i + 1][0]]),
    u:`Zoek de rij met vertrek ${b.rijen[i][0]}. In dezelfde rij staat de aankomst: ${b.rijen[i][1]}.`};
});
T('A-TAD-D1', 'tad_d1_prijs', R => {
  const pr = [['frisdrank', R.kies([1.8, 2, 2.2])], ['broodje', R.kies([3.2, 3.5, 3.8])], ['soep', R.kies([2.4, 2.5])], ['fruit', R.kies([0.8, 1])], ['wafel', R.kies([1.5, 1.6])]], i = R.int(0, 4);
  return {q:`Hoeveel kost ${pr[i][0] === 'fruit' ? 'een stuk fruit' : pr[i][0] === 'soep' ? 'een kom soep' : 'een ' + pr[i][0]}?`, fig:{t:'tab', titel:'Prijslijst schoolcafetaria', kop:['product', 'prijs'], rijen:pr.map(p => [p[0], eur(p[1])])}, velden:[geld(pr[i][1])], calc:false, u:`Lees af in de rij "${pr[i][0]}": ${eur(pr[i][1])}.`};
});
T('A-TAD-D2', 'tad_d2_staaf', R => {
  const d = statData(R, 5, 2, 12), i = R.int(0, 4), j = (i + R.int(1, 4)) % 5;
  if (R.int(0, 1)) return {q:`Hoeveel leerlingen meer kozen ${d.cats[i]} dan ${d.cats[j]}?`.replace('meer kozen', d.vals[i] >= d.vals[j] ? 'meer kozen' : 'minder kozen'), fig:staafF(d), velden:[veld(Math.abs(d.vals[i] - d.vals[j]), 'leerlingen')], calc:false,
    u:`${d.cats[i]}: ${d.vals[i]}, ${d.cats[j]}: ${d.vals[j]}. Het verschil is ${Math.abs(d.vals[i] - d.vals[j])}.`};
  return {q:`Hoeveel leerlingen kozen ${d.cats[i]}?`, fig:staafF(d), velden:[veld(d.vals[i], 'leerlingen')], calc:false, u:`De staaf "${d.cats[i]}" reikt tot ${d.vals[i]}.`};
});
T('A-TAD-D3', 'tad_d3_taart', R => {
  const d = statData(R, 4, 3, 20, true); if (!d) return null; const i = R.int(0, 3);
  const fg = {t:'taart', titel:d.titel + ' (aantal leerlingen)', delen:d.cats.map((c, j) => [c, d.vals[j] / d.tot * 100, String(d.vals[j])]), suffix:''};
  if (R.int(0, 1)) return {q:`Hoeveel leerlingen werden er in totaal bevraagd?`, fig:fg, velden:[veld(d.tot, 'leerlingen')], calc:false, u:`Tel de aantallen bij alle sectoren op: ${d.vals.join(' + ')} = ${d.tot}.`};
  const mx = Math.max.apply(null, d.vals);
  return {q:'Welke keuze was het populairst?', fig:fg, o:keuzes(d.cats[d.vals.indexOf(mx)], d.cats.filter((c, j) => d.vals[j] !== mx)), u:`De grootste sector hoort bij het grootste aantal: ${d.cats[d.vals.indexOf(mx)]} (${mx}).`};
});
T('A-TAD-D4', 'tad_d4_vergelijk', R => {
  const y = DAGEN.slice(0, 5).map(() => R.int(4, 20)), k = R.int(0, 4), y2 = y.slice(); y2[k] = y[k] + R.kies([-4, -3, 3, 4]); if (y2[k] < 1) return null;
  return {q:'Het staafdiagram en het lijndiagram zouden dezelfde gegevens moeten tonen: het aantal verkochte ijsjes per dag.\nBij welke dag tonen ze niet hetzelfde?', fig:{t:'twee', a:{t:'staaf', titel:'Staafdiagram', x:DAGEN.slice(0, 5), y, min:0, max:24, stap:4, ylab:'ijsjes'}, b:{t:'lijn', titel:'Lijndiagram', x:DAGEN.slice(0, 5), y:y2, min:0, max:24, stap:4, ylab:'ijsjes'}},
    o:keuzes(DAGNAAM[DAGEN[k]], DAGEN.slice(0, 5).filter((d, j) => j !== k).map(d => DAGNAAM[d])), u:`Vergelijk dag per dag de hoogte van de staaf met de hoogte van het punt. Op ${DAGNAAM[DAGEN[k]]}: staaf ${y[k]}, punt ${y2[k]}.`};
});

/* ===== C ===== */
T('A-TAD-C1', 'tad_c1_vergelijk', R => {
  const d = taartData(R, 4); if (!d) return null; const k = R.int(0, 3), p2 = d.pct.slice(); p2[k] = d.pct[k] + R.kies([-5, 5]);
  return {q:`Het cirkeldiagram en het lijndiagram zouden dezelfde percenten moeten tonen (${d.titel.toLowerCase()}).\nBij welke categorie tonen ze iets anders?`, fig:{t:'twee', a:taartF(d), b:{t:'lijn', titel:'Lijndiagram', x:d.cats, y:p2, min:0, max:60, stap:10, ylab:'%'}},
    o:keuzes(d.cats[k], d.cats.filter((c, j) => j !== k)), u:`Het cirkeldiagram geeft ${d.pct[k]} % voor ${d.cats[k]}, het lijndiagram ${p2[k]} %.`};
});
T('A-TAD-C2', 'tad_c2_procent', R => {
  /* percenten die samen 100 % zijn */
  const d = statData(R, 5, 2, 9); const y = d.vals.slice(0, 4).map(v => v * 5), i = R.int(0, 4); y.push(100 - somV(y)); if (y[4] < 5 || y[4] > 45) return null;
  return {q:`Welk percentage van de leerlingen koos ${d.cats[i]}?`, fig:{t:'staaf', titel:d.titel + ' (in %)', x:d.cats, y, min:0, max:50, stap:5, ylab:'%'}, velden:[veld(y[i], '%')], calc:false, u:`Lees de staaf af op de as met procenten: ${y[i]} %.`};
});
T('A-TAD-C2', 'tad_c2_taart', R => {
  const d = taartData(R); if (!d) return null; const i = R.int(0, d.cats.length - 1), j = (i + 1) % d.cats.length;
  return {q:`Hoeveel procent van de leerlingen koos ${d.cats[i]} of ${d.cats[j]}?`, fig:taartF(d), velden:[veld(d.pct[i] + d.pct[j], '%')], calc:false, u:`${d.pct[i]} % + ${d.pct[j]} % = ${d.pct[i] + d.pct[j]} %.`};
});
T('A-TAD-C3', 'tad_c3_groot', R => {
  const g = R.schud(GEMEENTEN).slice(0, 4), inw = g.map(() => R.int(12000, 46000)), i = R.int(0, 3);
  if (R.int(0, 1)) return {q:`Hoeveel inwoners heeft ${g[i]}?`, fig:{t:'tab', titel:'Inwoners per gemeente', kop:['gemeente', 'inwoners'], rijen:g.map((x, j) => [x, f(inw[j])])}, velden:[veld(inw[i], 'inwoners')], calc:false, u:`In de rij ${g[i]}: ${f(inw[i])}.`};
  const mx = Math.max.apply(null, inw);
  return {q:'Welke gemeente heeft de meeste inwoners?', fig:{t:'tab', titel:'Inwoners per gemeente', kop:['gemeente', 'inwoners'], rijen:g.map((x, j) => [x, f(inw[j])])}, o:keuzes(g[inw.indexOf(mx)], g.filter((x, j) => inw[j] !== mx)), u:`Vergelijk eerst de duizendtallen: ${g[inw.indexOf(mx)]} heeft er ${f(mx)}.`};
});
T('A-TAD-C3', 'tad_c3_som', R => {
  const kl = ['1A', '1B', '2A', '2B'], j = kl.map(() => R.int(9, 15)), m = kl.map(() => R.int(9, 15)), i = R.int(0, 3);
  return {q:`Hoeveel leerlingen zitten er in ${kl[i]}?`, fig:{t:'tab', titel:'Leerlingen per klas', kop:['klas', 'jongens', 'meisjes'], rijen:kl.map((k, x) => [k, j[x], m[x]])}, velden:[veld(j[i] + m[i], 'leerlingen')], calc:false, u:`${j[i]} jongens + ${m[i]} meisjes = ${j[i] + m[i]}.`};
});

/* ===== B ===== */
T('A-TAD-B1', 'tad_b1_teveel', R => {
  const d = taartData(R); if (!d) return null; const N = R.kies([200, 400, 500]);
  const r = R.schud([{t:`${d.cats[0]} werd door ${N * d.pct[0] / 100} leerlingen gekozen.`, w:true}, {t:`${d.cats[1]} werd door ${N * d.pct[1] / 100 + 10} leerlingen gekozen.`, w:false},
    {t:`Samen kozen ${N * (d.pct[0] + d.pct[1]) / 100} leerlingen ${d.cats[0]} of ${d.cats[1]}.`, w:true}, {t:`${d.cats[2]} werd door ${d.pct[2]} leerlingen gekozen.`, w:N === 100}]);
  return {q:`Op de school zijn er ${N} leerlingen, waarvan 52 % meisjes. Iedereen koos één antwoord.\nZijn de uitspraken juist of fout?`, fig:taartF(d), jf:r,
    u:`Het aantal meisjes heb je niet nodig. Reken telkens: percent · ${N} : 100.\n${d.cats.map((c, i) => c + ': ' + d.pct[i] + ' % = ' + N * d.pct[i] / 100).join(', ')}.`};
});
T('A-TAD-B2', 'tad_b2_aanvullen', R => {
  const kl = ['2A', '2B', '2C'], j = kl.map(() => R.int(8, 14)), m = kl.map(() => R.int(8, 14)), i = R.int(0, 2), wat = R.int(0, 1);
  const rijen = kl.map((k, x) => [k, j[x], m[x], j[x] + m[x]]); rijen[i][wat ? 2 : 1] = '…';
  return {q:'Welk getal ontbreekt in de tabel?', fig:{t:'tab', titel:'Leerlingen per klas', kop:['klas', 'jongens', 'meisjes', 'totaal'], rijen}, velden:[veld(wat ? m[i] : j[i])], calc:false,
    u:`In ${kl[i]}: totaal ${j[i] + m[i]} − ${wat ? j[i] + ' jongens' : m[i] + ' meisjes'} = ${wat ? m[i] : j[i]}.`};
});
T('A-TAD-B3', 'tad_b3_bus', R => {
  const b = BUSTAB(R), i = R.int(1, 3), doel = b.st + i * b.om + b.duur + R.int(3, b.om - 3);
  return {q:`Je moet ten laatste om ${tijdT(Math.floor(doel / 60), doel % 60)} in Gent zijn.\nWat is de laatste bus die je in Lievegem kan nemen?`, fig:{t:'tab', titel:'Bus Lievegem – Gent', kop:['vertrek Lievegem', 'aankomst Gent'], rijen:b.rijen},
    o:keuzes(b.rijen[i][0], [b.rijen[i + 1][0], b.rijen[i - 1][0], b.rijen[i][1]]), u:`Kijk naar de aankomsttijden. De bus van ${b.rijen[i][0]} komt aan om ${b.rijen[i][1]}: op tijd. De volgende bus komt pas om ${b.rijen[i + 1][1]} aan: te laat.`};
});
T('A-TAD-B4', 'tad_b4_negatief', R => {
  const y = MAANDEN.map(() => R.int(-6, 9)), a = R.int(0, 5), b = (a + R.int(1, 5)) % 6; if (y[a] === y[b]) return null;
  return {q:`Het staafdiagram toont de gemiddelde temperatuur per maand in een stad in Noorwegen.\nHoeveel graden is het verschil tussen ${MAANDEN[a]} en ${MAANDEN[b]}?`, fig:{t:'staaf', titel:'Gemiddelde temperatuur', x:MAANDEN, y, min:-8, max:10, stap:2, ylab:'°C', waarden:1}, velden:[veld(Math.abs(y[a] - y[b]), '°C')], calc:false,
    u:`${MAANDEN[a]}: ${minT(y[a])} °C, ${MAANDEN[b]}: ${minT(y[b])} °C. Het verschil is ${minT(Math.max(y[a], y[b]))} − ${haakN(Math.min(y[a], y[b]))} = ${Math.abs(y[a] - y[b])} °C.`};
});
T('A-TAD-B5', 'tad_b5_lijn', R => {
  const y = DAGEN.map(() => R.int(6, 24)), d = y.slice(1).map((v, i) => v - y[i]), mx = Math.max.apply(null, d); if (mx <= 0 || d.filter(x => x === mx).length > 1) return null; const k = d.indexOf(mx);
  return {q:'Het lijndiagram toont de temperatuur om 12 uur.\nTussen welke twee opeenvolgende dagen steeg de temperatuur het meest?', fig:{t:'lijn', titel:'Temperatuur om 12 uur', x:DAGEN, y, min:0, max:26, stap:2, ylab:'°C'},
    o:keuzes(DAGNAAM[DAGEN[k]] + ' en ' + DAGNAAM[DAGEN[k + 1]], d.map((x, i) => i).filter(i => i !== k).slice(0, 6).map(i => DAGNAAM[DAGEN[i]] + ' en ' + DAGNAAM[DAGEN[i + 1]]).slice(0, 3)),
    u:`Waar het lijnstuk het steilst stijgt: van ${y[k]} °C naar ${y[k + 1]} °C, een stijging van ${mx} °C.`};
});
T('A-TAD-B6', 'tad_b6_organigram', R => {
  const n = R.schud(['An', 'Bert', 'Charlotte', 'Driss', 'Eva', 'Frank', 'Gül', 'Hugo']);
  const box = (x, y, t, s) => '<rect x="' + (x - 62) + '" y="' + y + '" width="124" height="44" rx="8" fill="var(--wit)" stroke="var(--inkt)" stroke-width="1.8"/><text class="ftxt" x="' + x + '" y="' + (y + 19) + '" text-anchor="middle" font-weight="700">' + t + '</text><text class="fklein" x="' + x + '" y="' + (y + 36) + '" text-anchor="middle">' + s + '</text>';
  const l = (x1, y1, x2, y2) => '<path d="M' + x1 + ',' + y1 + ' V' + ((y1 + y2) / 2) + ' H' + x2 + ' V' + y2 + '" fill="none" stroke="var(--inkt2)" stroke-width="1.6"/>';
  let s = box(300, 6, n[0], 'directeur') + l(300, 50, 150, 80) + l(300, 50, 450, 80) + box(150, 80, n[1], 'adjunct 1e graad') + box(450, 80, n[2], 'adjunct 2e graad');
  s += l(150, 124, 80, 154) + l(150, 124, 220, 154) + l(450, 124, 380, 154) + l(450, 124, 520, 154) + box(80, 154, n[3], 'coördinator 1A') + box(220, 154, n[4], 'coördinator 1B') + box(380, 154, n[5], 'coördinator 3A') + box(520, 154, n[6], 'coördinator 3B');
  const w = R.int(3, 6), baas = w <= 4 ? n[1] : n[2];
  return {q:`Het organigram toont de leiding van een school.\nBij wie moet ${n[w]} een probleem eerst melden?`, fig:fig('0 0 600 204', s, 'Organigram: directeur ' + n[0] + ', adjuncten ' + n[1] + ' en ' + n[2] + ', coördinatoren ' + n.slice(3, 7).join(', ') + '.'),
    o:keuzes(baas, [n[0], baas === n[1] ? n[2] : n[1], n[w === 3 ? 4 : 3]]), u:`Volg de lijn naar boven: ${n[w]} staat onder ${baas}.`};
});

/* ===== A ===== */
T('A-TAD-A1', 'tad_a1_jaar', R => {
  const jr = [2023, 2024, 2025], tab = jr.map(() => [R.int(2, 8) * 10, R.int(2, 8) * 10, R.int(2, 8) * 10]), k = R.int(0, 2), tot = tab[k].reduce((a, b) => a + b, 0), pct = tab[k].map(v => v / tot * 100);
  if (pct.some(p => !Number.isInteger(p * 2))) return null; if (new Set(tab.map(r => r.map(v => v / r.reduce((a, b) => a + b, 0)).join())).size < 3) return null;
  return {q:'De tabel toont hoe de leerlingen naar school kwamen. Het cirkeldiagram toont één van de jaren.\nWelk jaar?', fig:{t:'twee', a:{t:'tab', titel:'Vervoer naar school (aantal leerlingen)', kop:['jaar', 'fiets', 'bus', 'te voet'], rijen:jr.map((j, i) => [String(j)].concat(tab[i]))}, b:taartF({titel:'Eén jaar', cats:['fiets', 'bus', 'te voet'], pct})},
    o:keuzes(String(jr[k]), jr.filter((j, i) => i !== k).map(String).concat(['geen van deze jaren'])),
    u:`Reken voor elk jaar de percenten uit. In ${jr[k]}: ${tab[k].join(' + ')} = ${tot}, dus ${pct.map(p => f(p, 1) + ' %').join(', ')}: dat past bij het cirkeldiagram.`};
});
T('A-TAD-A2', 'tad_a2_berekenen', R => {
  const pr = [['frisdrank', 2], ['broodje', 3.5], ['soep', 2.5], ['fruit', 1]], n = pr.map(() => R.int(0, 6)); if (n.filter(x => x).length < 2) return null; const k = R.kies([10, 20]);
  const tot = n.reduce((s, x, i) => s + x * pr[i][1], 0), w = tot * (1 - k / 100);
  return {q:`Een groep bestelt: ${pr.map((p, i) => n[i] ? n[i] + ' × ' + p[0] : '').filter(Boolean).join(', ')}. Een groep krijgt ${k} % korting op het totaal.\nHoeveel betaalt de groep?`, fig:{t:'tab', titel:'Prijslijst schoolcafetaria', kop:['product', 'prijs'], rijen:pr.map(p => [p[0], eur(p[1])])}, velden:[geld(Math.round(w * 100) / 100)],
    u:`Totaal: ${pr.map((p, i) => n[i] ? n[i] + ' · ' + eur(p[1]) : '').filter(Boolean).join(' + ')} = ${eur(tot)}.\nKorting: ${k} % van ${eur(tot)} = ${eur(tot * k / 100)}. Te betalen: ${eur(w)}.`};
});
T('A-TAD-A3', 'tad_a3_lijn', R => {
  const u = [8, 9, 10, 11, 12, 13], st = R.int(80, 200) * 10, sn = R.kies([30, 40, 50, 60]), y = u.map((x, i) => st + i * sn + R.int(-1, 1) * 10 * (i > 0 && i < 5 ? 1 : 0));
  const g = (y[5] - y[0]) / 5;
  return {q:'Het lijndiagram toont het aantal bezoekers in een pretpark (opgeteld vanaf de opening).\nHoeveel bezoekers kwamen er gemiddeld per uur bij tussen 8 uur en 13 uur?', fig:{t:'lijn', titel:'Aantal bezoekers', x:u.map(x => x + 'u'), y, min:Math.floor(st / 500) * 500, max:Math.ceil(y[5] / 500) * 500 + 0, stap:100, ylab:'bezoekers', waarden:1},
    velden:[veld(g, 'bezoekers')], u:`Om 8 uur: ${f(y[0])}, om 13 uur: ${f(y[5])}. Er kwamen ${f(y[5] - y[0])} bezoekers bij in 5 uur.\n${f(y[5] - y[0])} : 5 = ${f(g)} per uur.`};
});
T('A-TAD-A4', 'tad_a4_dubbel', R => {
  const y1 = MAANDEN.map(() => R.int(20, 95) / 10), y2 = MAANDEN.map(() => R.int(20, 95) / 10), a = R.int(0, 5);
  if (R.int(0, 1)) return {q:`Het dubbel staafdiagram toont de neerslag (in cm) per maand in twee jaren.\nHoeveel cm meer of minder regen viel er in ${MAANDEN[a]} 2025 dan in ${MAANDEN[a]} 2024? Geef het verschil.`, fig:{t:'staaf', titel:'Neerslag per maand', x:MAANDEN, y:y1, y2, leg:['2024', '2025'], min:0, max:10, stap:1, ylab:'cm', waarden:1, waarden2:1},
    velden:[veld(+Math.abs(y2[a] - y1[a]).toFixed(1), 'cm')], calc:false, u:`${MAANDEN[a]} 2024: ${f(y1[a])} cm, 2025: ${f(y2[a])} cm. Verschil: ${f(Math.abs(y2[a] - y1[a]), 1)} cm.`};
  const d = taartData(R); if (!d) return null; const pc = d.pct.map(p => p + R.kies([0.5, -0.5])); pc[pc.length - 1] = 100 - pc.slice(0, -1).reduce((x, y) => x + y, 0); const N = R.kies([1200, 2400, 3000]), i = R.int(0, d.cats.length - 1);
  return {q:`Het cirkeldiagram geldt voor ${f(N)} jongeren.\nHoeveel jongeren kozen ${d.cats[i]}?`, fig:taartF({titel:d.titel, cats:d.cats, pct:pc}, {delen:d.cats.map((c, j) => [c, pc[j], f(pc[j], 1)])}), velden:[veld(N * pc[i] / 100, 'jongeren')],
    u:`${f(pc[i], 1)} % van ${f(N)} = ${f(N)} · ${f(pc[i] / 100, 3)} = ${f(N * pc[i] / 100)}.`};
});
/* ---------- Verzamelingen (dieptethema, A-stroom) ----------
   D: element van, plaats in een venndiagram, symbolen ∈ ∉ ⊂ ⊄, deelverzameling, opsomming
   C: (half)rechten en lijnstukken, verschil, doorsnede, unie met lege doorsnede, venndiagram koppelen, symbolen ∩ ∪ \
   B: doorsnede en verschil, in woorden, unie en verschil met niet-lege doorsnede, venndiagrammen met drie verzamelingen, gelijke verzamelingen
   A: unie, wiskundige context, oppervlaktes, lege gebieden, aantallen, redeneringen met ⇒ en ⇔, vraagstukken */
koppel('A', `
v01=A-VZM-D1 t_v1_element=A-VZM-D1 v04=A-VZM-D1 v05=A-VZM-D1 t_v1_venn=A-VZM-D1 t_vm_veelvoud=A-VZM-D1 v06=A-VZM-D3 v14=A-VZM-D3
v09=A-VZM-D4 t_vm_deel=A-VZM-D4 v03=A-VZM-D5 v10=A-VZM-D5 t_v2_delers=A-VZM-D5 v13=A-VZM-D5 t_v3_beschrijving=A-VZM-D5 t_vm_interval=A-VZM-D5
v07=A-VZM-C4 v16=A-VZM-C4 vk1=A-VZM-C7 t_venn=A-VZM-C7 vk2=A-VZM-C7 t_vm_vennsleep=A-VZM-C7 v24=A-VZM-C9
mk5=A-VZM-B1 v15=A-VZM-B2 v08=A-VZM-B4 v12=A-VZM-B4 v20=A-VZM-B6 v21=A-VZM-B7 t_vm_samen=A-VZM-B7 t_vm_venngebied=A-VZM-B8
v11=A-VZM-A1 v26=A-VZM-A6 t_kgvveelv=A-VZM-A6 t_oneindig=A-VZM-A6 t_v3_veelvoud=A-VZM-A6 t_v2_unie=A-VZM-A7 t_v3_verschil=A-VZM-A7 v22=A-VZM-A7 t_aantal=A-VZM-A7 t_vm_formule=A-VZM-A7
v29=A-VZM-A8 v23=A-VZM-A9 v28=A-VZM-A9 v27=A-VZM-A10 v17=A-VZM-A11 v18=A-VZM-A11 t_geen=A-VZM-A11 v25=A-VZM-A11 t_v5_beide=A-VZM-A11 t_vm_tellen=A-VZM-A11
`);
const opsom = a => '{' + a.slice().sort((x, y) => (typeof x === 'number' ? x - y : String(x).localeCompare(String(y)))).join(', ') + '}';
const DOORS = (a, b) => a.filter(x => b.indexOf(x) >= 0), UNIE = (a, b) => a.concat(b.filter(x => a.indexOf(x) < 0)), VERSCH = (a, b) => a.filter(x => b.indexOf(x) < 0);
const deler = n => [...Array(n).keys()].map(i => i + 1).filter(d => n % d === 0);
const veelv = (k, max) => [...Array(Math.floor(max / k)).keys()].map(i => (i + 1) * k);
const PREDS = [['even getallen', x => x % 2 === 0], ['veelvouden van 3', x => x % 3 === 0], ['veelvouden van 4', x => x % 4 === 0], ['veelvouden van 5', x => x % 5 === 0], ['delers van 24', x => 24 % x === 0], ['delers van 36', x => 36 % x === 0], ['oneven getallen', x => x % 2 === 1]];
/* venndiagram als figuur met gekleurde gebieden (bitmasker: bit i = binnen verzameling i) */
const VENNG = {2:{c:[[125, 115], [195, 115]], r:72, w:320, h:225}, 3:{c:[[128, 98], [192, 98], [160, 154]], r:64, w:320, h:240}};
let vennFigNr = 0;
function vennFig(n, gebieden, labels, extra) {
  const V = VENNG[n], L = labels || ['A', 'B', 'C'], id = 'vf' + (++vennFigNr);
  let defs = '', vl = '';
  V.c.forEach((c, i) => { defs += '<clipPath id="' + id + 'c' + i + '"><circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + V.r + '"/></clipPath>'; });
  (gebieden || []).forEach(g => {
    defs += '<mask id="' + id + 'm' + g + '"><rect x="0" y="0" width="' + V.w + '" height="' + V.h + '" fill="#fff"/>' + V.c.map((c, i) => (g >> i) & 1 ? '' : '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + V.r + '" fill="#000"/>').join('') + '</mask>';
    let vorm = '<rect x="8" y="8" width="' + (V.w - 16) + '" height="' + (V.h - 16) + '" fill="var(--k2)" fill-opacity=".55"/>';
    V.c.forEach((c, i) => { if ((g >> i) & 1) vorm = '<g clip-path="url(#' + id + 'c' + i + ')">' + vorm + '</g>'; });
    vl += '<g mask="url(#' + id + 'm' + g + ')">' + vorm + '</g>';
  });
  let s = '<defs>' + defs + '</defs><rect x="8" y="8" width="' + (V.w - 16) + '" height="' + (V.h - 16) + '" rx="10" fill="var(--wit)" stroke="var(--inkt2)" stroke-width="1.5"/>' + vl;
  V.c.forEach(c => { s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + V.r + '" fill="none" stroke="var(--inkt)" stroke-width="2"/>'; });
  const lp = n === 2 ? [[52, 40], [268, 40]] : [[52, 36], [268, 36], [252, 214]];
  lp.forEach((p, i) => { s += tekst(p, '<tspan font-weight="700" font-style="italic">' + L[i] + '</tspan>'); });
  return fig('0 0 ' + V.w + ' ' + V.h, s + (extra || ''), 'Venndiagram met ' + n + ' verzamelingen' + (gebieden && gebieden.length ? ', een deel is gekleurd' : '') + '.');
}
/* klein venndiagram voor kiesvragen: soort 'snijdend', 'AinB', 'BinA', 'disjunct' */
function miniVenn(x0, soort, l) {
  const c = {snijdend:[[x0 + 30, 50, 26], [x0 + 62, 50, 26]], AinB:[[x0 + 46, 56, 16], [x0 + 46, 50, 34]], BinA:[[x0 + 46, 50, 34], [x0 + 46, 56, 16]], disjunct:[[x0 + 22, 50, 18], [x0 + 72, 50, 18]]}[soort];
  return '<rect x="' + x0 + '" y="10" width="92" height="84" rx="6" fill="var(--wit)" stroke="var(--inkt2)"/>' + c.map((k, i) => '<circle cx="' + k[0] + '" cy="' + k[1] + '" r="' + k[2] + '" fill="none" stroke="var(--inkt)" stroke-width="1.8"/>' + tekst([k[0] + (i ? 1 : -1) * (k[2] * .55), k[1] - k[2] + 14], '<tspan font-style="italic" font-weight="700">' + 'AB'[i] + '</tspan>')).join('') + tekst([x0 + 46, 116], '<tspan font-weight="700">' + l + '</tspan>');
}

/* ===== D ===== */
T('A-VZM-D1', 'vzm_d1_element', R => {
  const A = R.schud([...Array(15).keys()].map(i => i + 1)).slice(0, 5), uit = R.schud([...Array(15).keys()].map(i => i + 1).filter(x => A.indexOf(x) < 0)).slice(0, 2);
  if (R.int(0, 1)) return {q:`A = ${opsom(A)}. Zijn de uitspraken juist of fout?`, jf:R.schud([{t:A[0] + ' ∈ A', w:true}, {t:A[1] + ' ∈ A', w:true}, {t:uit[0] + ' ∈ A', w:false}, {t:uit[1] + ' ∈ A', w:false}]), u:`Een getal behoort tot A als het in de opsomming staat: ${opsom(A)}.`};
  const bAlleen = R.int(16, 19);
  return {q:'Bekijk het venndiagram. Zijn de uitspraken juist of fout?', fig:{t:'venn', a:A.slice(0, 3), ab:A.slice(3), b:[bAlleen], uit},
    jf:R.schud([{t:A[0] + ' ∈ A', w:true}, {t:A[3] + ' ∈ A', w:true}, {t:bAlleen + ' ∈ A', w:false}, {t:uit[0] + ' ∈ A', w:false}]), u:'Alles binnen de cirkel A (ook in het deel dat A met B gemeen heeft) behoort tot A. Elementen buiten de cirkel A behoren niet tot A.'};
});
T('A-VZM-D2', 'vzm_d2_plaats', R => {
  const n = R.namen(4), c = R.kies([{A:'de leerlingen die voetballen', B:'de leerlingen die zwemmen', a:'voetbalt, maar zwemt niet', ab:'voetbalt en zwemt', b:'zwemt, maar voetbalt niet', uit:'voetbalt niet en zwemt niet'},
    {A:'de leerlingen die gitaar spelen', B:'de leerlingen die piano spelen', a:'speelt gitaar, maar geen piano', ab:'speelt gitaar en piano', b:'speelt piano, maar geen gitaar', uit:'speelt geen gitaar en geen piano'},
    {A:'de leerlingen met een hond', B:'de leerlingen met een kat', a:'heeft een hond, maar geen kat', ab:'heeft een hond en een kat', b:'heeft een kat, maar geen hond', uit:'heeft geen hond en geen kat'}]);
  const pos = ['a', 'ab', 'b', 'uit'], w = R.int(0, 3), p = pos[w], x = n[w];
  return {q:`A: ${c.A}. B: ${c.B}.\nWat weet je over ${x}?`, fig:{t:'venn', a:[n[0]], ab:[n[1]], b:[n[2]], uit:[n[3]]}, o:keuzes(`${x} ${c[p]}.`, pos.filter(q => q !== p).map(q => `${x} ${c[q]}.`)),
    u:`${x} staat ${p === 'ab' ? 'in het gemeenschappelijke deel van A en B' : p === 'uit' ? 'buiten beide cirkels' : 'alleen in ' + p.toUpperCase()}: ${x} ${c[p]}.`};
});
T('A-VZM-D3', 'vzm_d3_symbolen', R => {
  const A = R.schud([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5).sort((x, y) => x - y), niet = [1, 10, 11, 12].filter(x => A.indexOf(x) < 0);
  const rijen = R.schud([{voor:R.kies(A) + '', na:'A', w:'∈'}, {voor:R.kies(niet) + '', na:'A', w:'∉'}, {voor:opsom(A.slice(0, 2)), na:'A', w:'⊂'}, {voor:opsom([A[0], R.kies(niet)]), na:'A', w:'⊄'}]);
  return {q:`A = ${opsom(A)}. Vul telkens het juiste symbool in: ∈, ∉, ⊂ of ⊄.`, sym:{palet:['∈', '∉', '⊂', '⊄'], rijen},
    u:'∈ en ∉ gebruik je voor een element (een getal). ⊂ en ⊄ gebruik je voor een verzameling (met accolades).'};
});
T('A-VZM-D4', 'vzm_d4_deel', R => {
  const A = R.schud([...Array(12).keys()].map(i => i + 1)).slice(0, 6).sort((x, y) => x - y), j = R.schud(A).slice(0, 3), b = A.filter(x => j.indexOf(x) < 0)[0];
  return {q:`A = ${opsom(A)}. Welke verzameling is een deelverzameling van A?`, o:keuzes(opsom(j), [opsom(j.slice(0, 2).concat([13])), opsom([0, b]), opsom([A[0], 14, A[5]])]), u:`Elk element van ${opsom(j)} is ook een element van A.`};
});
T('A-VZM-D5', 'vzm_d5_opsomming', R => {
  const p = R.kies([['de delers van 18', deler(18)], ['de delers van 20', deler(20)], ['de even natuurlijke getallen kleiner dan 10', [0, 2, 4, 6, 8]], ['de veelvouden van 4 tussen 1 en 30', veelv(4, 29)], ['de klinkers in het woord REKENEN', ['E']], ['de priemgetallen kleiner dan 20', [2, 3, 5, 7, 11, 13, 17, 19]]]);
  const fout = p[1].length > 2 ? [opsom(p[1].slice(0, -1)), opsom(p[1].concat([typeof p[1][0] === 'number' ? (p[0].indexOf('priem') >= 0 ? 1 : p[1][p[1].length - 1] + 1) : 'I'])), opsom(p[1].slice(1))] : [opsom(['E', 'E', 'E']), opsom(['E', 'I']), opsom(['R', 'K', 'N'])];
  return {q:`Welke opsomming hoort bij: ${p[0]}?`, o:keuzes(opsom(p[1]), fout), u:`${p[0][0].toUpperCase() + p[0].slice(1)}: ${opsom(p[1])}.` + (p[0].indexOf('REKENEN') > 0 ? '\nIn een opsomming schrijf je elk element maar één keer.' : '')};
});

/* ===== C ===== */
T('A-VZM-C1', 'vzm_c1_lijn', R => {
  const a = R.int(-4, 0), b = a + R.int(4, 7), soort = R.kies(['lijnstuk', 'halfrechte']);
  const kand = R.schud([a - 2, a - 1, a, a + 1, b, b + 1, b + 3, Math.floor((a + b) / 2)]).filter((x, i, s) => s.indexOf(x) === i).slice(0, 5);
  const isIn = x => soort === 'lijnstuk' ? x >= a && x <= b : x >= a;
  let s = getAs(-6, 10, 1, 2, [], '').html; const X = v => 24 + (v + 6) / 16 * 352;
  s += '<line x1="' + X(a) + '" y1="52" x2="' + (soort === 'lijnstuk' ? X(b) : 390) + '" y2="52" stroke="#C8372D" stroke-width="5" stroke-linecap="round"/><circle cx="' + X(a) + '" cy="52" r="5" fill="#C8372D"/>' + (soort === 'lijnstuk' ? '<circle cx="' + X(b) + '" cy="52" r="5" fill="#C8372D"/>' : '');
  return {q:`De rode ${soort} op de getallenas stelt de verzameling A voor (de eindpunten horen erbij).\nWelke getallen behoren tot A? Duid alle juiste getallen aan.`, fig:fig('0 0 400 90', s, 'Getallenas met een rode ' + soort + ' vanaf ' + a + (soort === 'lijnstuk' ? ' tot ' + b : '') + '.'),
    o:kand.map(minT), mk:kand.map((x, i) => isIn(x) ? i : -1).filter(i => i >= 0), vast:true, u:`A bevat alle getallen ${soort === 'lijnstuk' ? 'van ' + minT(a) + ' tot en met ' + minT(b) : 'vanaf ' + minT(a)}.`};
});
T('A-VZM-C2', 'vzm_c2_verschil', R => {
  const [p, q] = R.schud(PREDS.slice(0, 4)).slice(0, 2), kand = R.schud([...Array(30).keys()].map(i => i + 1)).slice(0, 4);
  return {q:`A: de ${p[0]}. B: de ${q[0]}.\nBehoort het getal tot A \\ B? Kies telkens ja of nee.`, jf:kand.map(x => ({t:String(x), w:p[1](x) && !q[1](x)})), kol:['ja', 'nee'],
    u:`A \\ B bevat de getallen die tot A behoren, maar niet tot B: ${p[0]} die geen ${q[0]} zijn.\n` + kand.map(x => `${x}: ${p[1](x) ? 'wel in A' : 'niet in A'}, ${q[1](x) ? 'wel in B' : 'niet in B'}`).join('\n')};
});
T('A-VZM-C3', 'vzm_c3_deel', R => {
  const A = veelv(R.kies([2, 3]), 30), k = R.kies([6, 12]), B = veelv(k, 30);
  return {q:`A = de veelvouden van ${A[0]} tot 30 en B = de veelvouden van ${k} tot 30. Er geldt: B ⊂ A.\nZijn de uitspraken juist of fout?`, jf:R.schud([{t:`${B[0]} ∈ B, dus ${B[0]} ∈ A`, w:true}, {t:`${A[1] % k ? A[1] : A[0]} ∈ A, dus ${A[1] % k ? A[1] : A[0]} ∈ B`, w:false}, {t:'Elk element van B is ook een element van A.', w:true}, {t:'Elk element van A is ook een element van B.', w:false}]),
    u:'B ⊂ A: elk element van B zit ook in A. Omgekeerd hoeft dat niet.'};
});
T('A-VZM-C4', 'vzm_c4_doorsnede', R => {
  const A = R.schud([...Array(12).keys()].map(i => i + 1)).slice(0, 6), B = R.schud([...Array(12).keys()].map(i => i + 1)).slice(0, 5), D = DOORS(A, B); if (D.length < 2) return null;
  return {q:`A = ${opsom(A)} en B = ${opsom(B)}.\nBepaal A ∩ B.`, o:keuzes(opsom(D), [opsom(UNIE(A, B)), opsom(VERSCH(A, B)), opsom(D.slice(1))]), u:`A ∩ B bevat de elementen die in A én in B zitten: ${opsom(D)}.`};
});
T('A-VZM-C5', 'vzm_c5_unie', R => {
  const al = R.schud([...Array(14).keys()].map(i => i + 1)), A = al.slice(0, 3), B = al.slice(3, 6);
  return {q:`A = ${opsom(A)} en B = ${opsom(B)}.\nBepaal A ∪ B.`, o:keuzes(opsom(A.concat(B)), ['∅', opsom(A), opsom(A.concat(B.slice(1)))]), u:`A ∪ B bevat alle elementen van A en van B samen: ${opsom(A.concat(B))}. A en B hebben geen gemeenschappelijke elementen.`};
});
T('A-VZM-C6', 'vzm_c6_woorden', R => {
  const p = R.kies([['met een fiets', 'met een bril'], ['die voetballen', 'die zwemmen'], ['met een broer', 'met een zus']]);
  return {q:`A: de leerlingen ${p[0]}. B: de leerlingen ${p[1]}.\nWat is A \\ B?`, o:keuzes(`de leerlingen ${p[0]}, maar niet ${p[1].replace('met een', 'met een').replace('die ', '')}`.replace('niet met een', 'zonder'),
    [`de leerlingen ${p[1]}, maar niet ${p[0].replace('die ', '')}`.replace('niet met een', 'zonder'), `de leerlingen ${p[0]} en ${p[1].replace('die ', '')}`, `de leerlingen ${p[0]} of ${p[1].replace('die ', '')}`]),
    u:`A \\ B: de elementen van A die niet in B zitten.`};
});
T('A-VZM-C7', 'vzm_c7_gebied', R => {
  const p = R.kies([['A ∩ B', [3]], ['A \\ B', [1]], ['B \\ A', [2]]]);
  return {q:`Een element x behoort tot ${p[0]}.\nKlik op het gebied van het venndiagram waar x ligt.`, venn:{n:2, w:p[1]}, u:{3:'A ∩ B: in A én in B, dus in het gemeenschappelijke deel.', 1:'A \\ B: in A, maar niet in B.', 2:'B \\ A: in B, maar niet in A.'}[p[1][0]]};
});
T('A-VZM-C8', 'vzm_c8_koppel', R => {
  const p = R.kies([['de veelvouden van 4', 'de even getallen', 'AinB'], ['de even getallen', 'de veelvouden van 6', 'BinA'], ['de even getallen', 'de oneven getallen', 'disjunct'], ['de veelvouden van 2', 'de veelvouden van 3', 'snijdend'], ['de delers van 12', 'de delers van 6', 'BinA']]);
  const L = 'ABCD', soorten = R.schud(['snijdend', 'AinB', 'BinA', 'disjunct']), i = soorten.indexOf(p[2]);
  return {q:`A: ${p[0]}. B: ${p[1]}.\nWelk venndiagram past?`, fig:fig('0 0 420 126', soorten.map((s, j) => miniVenn(8 + j * 104, s, L[j])).join(''), 'Vier venndiagrammen.'), ...letterKeuze(L.length, i, 'diagram '),
    u:{AinB:'Elk element van A zit ook in B: A ligt binnen B.', BinA:'Elk element van B zit ook in A: B ligt binnen A.', disjunct:'A en B hebben geen gemeenschappelijke elementen: de cirkels raken elkaar niet.', snijdend:'A en B hebben enkele gemeenschappelijke elementen (bv. 6), maar geen van beide ligt helemaal in de andere.'}[p[2]]};
});
T('A-VZM-C9', 'vzm_c9_symbool', R => {
  const p = R.kies([['A ∩ B', [3]], ['A ∪ B', [1, 2, 3]], ['A \\ B', [1]], ['B \\ A', [2]]]);
  return {q:'Welke uitdrukking hoort bij het gekleurde deel?', fig:vennFig(2, p[1]), o:keuzes(p[0], ['A ∩ B', 'A ∪ B', 'A \\ B', 'B \\ A'].filter(x => x !== p[0])), u:'∩ doorsnede (in beide), ∪ unie (in minstens één), \\ verschil (in de eerste, niet in de tweede).'};
});
T('A-VZM-C10', 'vzm_c10_deel', R => {
  const p = R.kies([['AinB', 'A ⊂ B'], ['BinA', 'B ⊂ A']]);
  return {q:'Welke uitspraak past bij het venndiagram?', fig:fig('0 0 120 126', miniVenn(14, p[0], ''), 'Venndiagram waarin de ene verzameling in de andere ligt.'), o:keuzes(p[1], [p[1] === 'A ⊂ B' ? 'B ⊂ A' : 'A ⊂ B', 'A ∩ B = ∅', 'A = B']), u:`De kleine cirkel ligt helemaal in de grote: ${p[1]}.`};
});
T('A-VZM-C11', 'vzm_c11_punten', R => {
  const a = {x1:R.int(0, 2), y1:R.int(0, 2)}; a.x2 = a.x1 + R.int(3, 4); a.y2 = a.y1 + R.int(2, 3);
  const b = {x1:a.x1 + R.int(1, 3), y1:a.y1 + R.int(1, 2)}; b.x2 = b.x1 + R.int(3, 4); b.y2 = b.y1 + R.int(2, 3); if (b.x2 > 9 || b.y2 > 6) return null;
  const n = (Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) + 1) * (Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) + 1);
  const rh = r => [{x:r.x1, y:r.y1}, {x:r.x2, y:r.y1}, {x:r.x2, y:r.y2}, {x:r.x1, y:r.y2}];
  return {q:'A is de verzameling van de roosterpunten in of op de blauwe rechthoek. B is de verzameling van de roosterpunten in of op de oranje rechthoek.\nHoeveel elementen heeft A ∩ B?', fig:{t:'rooster2', alt:'Rooster met twee rechthoeken die elkaar overlappen.', r:{xmin:0, xmax:9, ymin:0, ymax:6, figuren:[{pts:rh(a), kl:1, l:'A'}, {pts:rh(b), kl:2, l:'B'}]}},
    velden:[veld(n, 'punten')], calc:false, u:`Tel de roosterpunten die in of op beide rechthoeken liggen, ook die op de randen: ${n}.`};
});

/* ===== B ===== */
T('A-VZM-B1', 'vzm_b1_doorsnede', R => {
  const [p, q] = R.schud(PREDS).slice(0, 2), kand = R.schud([...Array(36).keys()].map(i => i + 1)).slice(0, 4);
  return {q:`A: de ${p[0]}. B: de ${q[0]}.\nBehoort het getal tot A ∩ B? Kies telkens ja of nee.`, jf:kand.map(x => ({t:String(x), w:p[1](x) && q[1](x)})), kol:['ja', 'nee'],
    u:'Een element van A ∩ B moet tot A én tot B behoren.\n' + kand.map(x => `${x}: ${p[1](x) ? 'wel' : 'niet'} in A, ${q[1](x) ? 'wel' : 'niet'} in B`).join('\n')};
});
T('A-VZM-B2', 'vzm_b2_intervallen', R => {
  const a1 = R.int(-5, -1), a2 = a1 + R.int(5, 8), b1 = R.int(a1 + 2, a2 - 1), b2 = b1 + R.int(3, 6); if (b2 > 9) return null;
  const X = v => 24 + (v + 6) / 16 * 352; let s = getAs(-6, 10, 1, 2, [], '').html;
  s += '<line x1="' + X(a1) + '" y1="30" x2="' + X(a2) + '" y2="30" stroke="var(--k1)" stroke-width="5"/>' + tekst([X(a1) - 10, 34], 'A', 'end') + '<line x1="' + X(b1) + '" y1="40" x2="' + X(b2) + '" y2="40" stroke="#E8A10C" stroke-width="5"/>' + tekst([X(b2) + 10, 44], 'B', 'start');
  const kand = R.schud([a1, b1 - 1, b1, a2, a2 + 1, Math.floor((a1 + b1) / 2)]).filter((x, i, z) => z.indexOf(x) === i).slice(0, 4);
  return {q:'A en B zijn de lijnstukken op de getallenas (eindpunten inbegrepen).\nBehoort het getal tot A \\ B? Kies telkens ja of nee.', fig:fig('0 0 400 90', s, `Getallenas met A van ${a1} tot ${a2} en B van ${b1} tot ${b2}.`), jf:kand.map(x => ({t:minT(x), w:x >= a1 && x <= a2 && !(x >= b1 && x <= b2)})), kol:['ja', 'nee'],
    u:`A \\ B: de getallen van A die niet in B liggen, dus van ${minT(a1)} tot (maar zonder) ${minT(b1)}.`};
});
T('A-VZM-B3', 'vzm_b3_woorden', R => {
  const p = R.kies([['die gitaar spelen', 'die piano spelen', 'gitaar én piano spelen'], ['met een hond', 'met een kat', 'een hond én een kat hebben'], ['die Frans spreken', 'die Engels spreken', 'Frans én Engels spreken']]);
  return {q:`A: de leerlingen ${p[0]}. B: de leerlingen ${p[1]}.\nWat is A ∩ B?`, o:keuzes(`de leerlingen die ${p[2]}`, [`de leerlingen die ${p[2].replace(' én ', ' of ')}`, `de leerlingen ${p[0]}, maar niet ${p[1].replace(/^die |^met een /, '')}`, 'de leerlingen die geen van beide doen']), u:'De doorsnede bevat de elementen die tot beide verzamelingen behoren: "én".'};
});
T('A-VZM-B4', 'vzm_b4_opsom', R => {
  const A = R.schud([...Array(12).keys()].map(i => i + 1)).slice(0, 5), B = R.schud([...Array(12).keys()].map(i => i + 1)).slice(0, 5); if (DOORS(A, B).length < 1 || DOORS(A, B).length > 3) return null;
  if (R.int(0, 1)) return {q:`A = ${opsom(A)} en B = ${opsom(B)}.\nBepaal A ∪ B.`, o:keuzes(opsom(UNIE(A, B)), [opsom(DOORS(A, B)), opsom(VERSCH(A, B)), opsom(B)]),
    u:`Alle elementen van A en van B, elk maar één keer: ${opsom(UNIE(A, B))}.`};
  return {q:`A = ${opsom(A)} en B = ${opsom(B)}.\nBepaal A \\ B.`, o:keuzes(opsom(VERSCH(A, B)), [opsom(VERSCH(B, A)), opsom(DOORS(A, B)), opsom(UNIE(A, B))]), u:`De elementen van A die niet in B zitten: ${opsom(VERSCH(A, B))}.`};
});
T('A-VZM-B5', 'vzm_b5_kleur', R => {
  const p = R.kies([['(A ∪ B) \\ C', [1, 2, 3]], ['A \\ (B ∪ C)', [1]], ['(A \\ B) ∪ C', [1, 4, 5, 6, 7]], ['C \\ (A ∪ B)', [4]], ['(A ∪ C) \\ B', [1, 4, 5]]]);
  return {q:`Kleur ${p[0]}. Klik op alle gebieden die erbij horen.`, venn:{n:3, w:p[1]}, u:'Werk eerst de haakjes uit. ∪ voegt gebieden samen, \\ haalt gebieden weg.'};
});
T('A-VZM-B6', 'vzm_b6_in', R => ({q:'De verzameling A ligt helemaal in B (A ⊂ B).\nWaaraan is A ∩ B gelijk?', fig:fig('0 0 120 126', miniVenn(14, 'AinB', ''), 'Venndiagram met A binnen B.'), o:keuzes('A', ['B', '∅', 'B \\ A']), u:'Alle elementen van A zitten ook in B. Wat A en B gemeen hebben, is dus A zelf.'}));
T('A-VZM-B7', 'vzm_b7_combinatie', R => {
  const p = R.kies([['(A ∩ B) ∪ C', [3, 7, 4, 5, 6]], ['(A ∪ B) ∩ C', [5, 6, 7]], ['A ∩ B ∩ C', [7]], ['(A ∩ C) \\ B', [5]], ['(A ∪ B) \\ (A ∩ B)', [1, 2, 5, 6]]]);
  return {q:'Welke uitdrukking hoort bij het gekleurde deel?', fig:vennFig(3, p[1]), o:keuzes(p[0], ['(A ∩ B) ∪ C', '(A ∪ B) ∩ C', 'A ∩ B ∩ C', '(A ∩ C) \\ B', '(A ∪ B) \\ (A ∩ B)'].filter(x => x !== p[0]).slice(0, 3)),
    u:`Controleer de uitdrukking gebied per gebied. Het gekleurde deel is ${p[0]}.`};
});
T('A-VZM-B8', 'vzm_b8_aantal', R => {
  const A = R.schud([...Array(20).keys()].map(i => i + 1)).slice(0, 7), B = R.schud([...Array(20).keys()].map(i => i + 1)).slice(0, 6);
  return {q:`A = ${opsom(A)} en B = ${opsom(B)}.\nHoeveel elementen heeft A ∩ B?`, velden:[veld(DOORS(A, B).length, 'elementen')], calc:false, u:`A ∩ B = ${DOORS(A, B).length ? opsom(DOORS(A, B)) : '∅'}: ${DOORS(A, B).length} element${DOORS(A, B).length === 1 ? '' : 'en'}.`};
});
T('A-VZM-B8', 'vzm_b8_punten', R => {
  const a = {x1:R.int(0, 2), y1:R.int(0, 1)}; a.x2 = a.x1 + R.int(3, 4); a.y2 = a.y1 + R.int(2, 3);
  const b = {x1:a.x1 + R.int(1, 3), y1:a.y1 + R.int(1, 2)}; b.x2 = b.x1 + R.int(2, 4); b.y2 = b.y1 + R.int(2, 3); if (b.x2 > 9 || b.y2 > 6) return null;
  const nA = (a.x2 - a.x1 + 1) * (a.y2 - a.y1 + 1), nD = (Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) + 1) * (Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) + 1);
  const rh = r => [{x:r.x1, y:r.y1}, {x:r.x2, y:r.y1}, {x:r.x2, y:r.y2}, {x:r.x1, y:r.y2}];
  return {q:'A en B zijn de verzamelingen van de roosterpunten in of op de blauwe en de oranje rechthoek.\nHoeveel elementen heeft A \\ B?', fig:{t:'rooster2', alt:'Rooster met twee overlappende rechthoeken A en B.', r:{xmin:0, xmax:9, ymin:0, ymax:6, figuren:[{pts:rh(a), kl:1, l:'A'}, {pts:rh(b), kl:2, l:'B'}]}},
    velden:[veld(nA - nD, 'punten')], calc:false, u:`A heeft ${nA} roosterpunten. Daarvan liggen er ${nD} ook in of op B. ${nA} − ${nD} = ${nA - nD}.`};
});
T('A-VZM-B9', 'vzm_b9_deel', R => {
  const A = [2, 4, 6, 8, 10, 12], B = [3, 6, 9, 12], r = R.schud([{t:'{6, 12} ⊂ A ∩ B', w:true}, {t:'{4, 6} ⊂ A ∩ B', w:false}, {t:'{2, 4} ⊂ A \\ B', w:true}, {t:'{6, 8} ⊂ A \\ B', w:false}, {t:'{3, 9} ⊂ B \\ A', w:true}]).slice(0, 4);
  return {q:`A = ${opsom(A)} en B = ${opsom(B)}.\nZijn de uitspraken juist of fout?`, jf:r, u:`A ∩ B = ${opsom(DOORS(A, B))}, A \\ B = ${opsom(VERSCH(A, B))}, B \\ A = ${opsom(VERSCH(B, A))}.\nEen deelverzameling mag alleen elementen bevatten die erin zitten.`};
});
T('A-VZM-B10', 'vzm_b10_gelijk', R => {
  const A = R.schud([1, 2, 3, 4, 5, 6, 7]).slice(0, 3), B = R.schud(A);
  return {q:`A = {${A.join(', ')}} en B = {${B.join(', ')}}.\nWelke uitspraken zijn juist? Duid alle juiste uitspraken aan.`, o:['A = B', 'A ⊂ B', 'B ⊂ A', 'A ⊄ B'], mk:[0, 1, 2], vast:true,
    u:'De volgorde in een opsomming speelt geen rol: A en B hebben dezelfde elementen, dus A = B. Elke verzameling is ook een deelverzameling van zichzelf: A ⊂ B en B ⊂ A.'};
});

/* ===== A ===== */
T('A-VZM-A1', 'vzm_a1_unie', R => {
  const [p, q] = R.schud(PREDS.slice(1, 6)).slice(0, 2), kand = R.schud([...Array(30).keys()].map(i => i + 1)).slice(0, 4);
  return {q:`A: de ${p[0]}. B: de ${q[0]}.\nBehoort het getal tot A ∪ B? Kies telkens ja of nee.`, jf:kand.map(x => ({t:String(x), w:p[1](x) || q[1](x)})), kol:['ja', 'nee'],
    u:'Een element van A ∪ B behoort tot A of tot B (of tot beide).\n' + kand.map(x => `${x}: ${p[1](x) ? 'wel' : 'niet'} in A, ${q[1](x) ? 'wel' : 'niet'} in B`).join('\n')};
});
T('A-VZM-A2', 'vzm_a2_woorden', R => {
  const p = R.kies([['met een hond', 'met een kat', 'een hond of een kat (of allebei) hebben'], ['die Frans spreken', 'die Engels spreken', 'Frans of Engels (of allebei) spreken'], ['die voetballen', 'die zwemmen', 'voetballen of zwemmen (of allebei)']]);
  return {q:`A: de leerlingen ${p[0]}. B: de leerlingen ${p[1]}.\nWat is A ∪ B?`, o:keuzes(`de leerlingen die ${p[2]}`, [`de leerlingen die ${p[2].replace(' of ', ' én ').replace(' (of allebei)', '')}`, `de leerlingen ${p[0]}, maar niet ${p[1].replace(/^die |^met een /, '')}`, 'alle leerlingen van de school']),
    u:'De unie bevat de elementen die tot minstens één van de twee verzamelingen behoren: "of" (ook allebei mag).'};
});
T('A-VZM-A3', 'vzm_a3_context', R => {
  const a = R.kies([12, 18, 20, 24, 30]), b = R.kies([8, 12, 16, 15, 18]); if (a === b) return null; const A = deler(a), B = deler(b);
  if (R.int(0, 1)) return {q:`A = de delers van ${a}, B = de delers van ${b}.\nBepaal A \\ B.`, o:keuzes(opsom(VERSCH(A, B)), [opsom(VERSCH(B, A)), opsom(DOORS(A, B)), opsom(UNIE(A, B))]), u:`A = ${opsom(A)}, B = ${opsom(B)}.\nA \\ B: delers van ${a} die geen deler zijn van ${b}: ${opsom(VERSCH(A, B))}.`};
  return {q:`A = de delers van ${a}, B = de delers van ${b}.\nBepaal A ∪ B.`, o:keuzes(opsom(UNIE(A, B)), [opsom(DOORS(A, B)), opsom(VERSCH(A, B)), opsom(VERSCH(B, A))]), u:`A = ${opsom(A)}, B = ${opsom(B)}.\nA ∪ B: ${opsom(UNIE(A, B))} (elk getal maar één keer).`};
});
T('A-VZM-A4', 'vzm_a4_oppervlak', R => {
  const a = {x1:0, y1:R.int(0, 1)}; a.x2 = a.x1 + R.int(4, 5); a.y2 = a.y1 + R.int(3, 4);
  const b = {x1:R.int(2, 3), y1:a.y1 + R.int(1, 2)}; b.x2 = b.x1 + R.int(3, 5); b.y2 = b.y1 + R.int(2, 4); if (b.x2 > 9 || b.y2 > 6 || b.x1 >= a.x2) return null;
  const A = (a.x2 - a.x1) * (a.y2 - a.y1), B = (b.x2 - b.x1) * (b.y2 - b.y1), D = (Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * (Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const v = R.kies([['A ∪ B', A + B - D], ['A \\ B', A - D], ['A ∩ B', D]]);
  const rh = r => [{x:r.x1, y:r.y1}, {x:r.x2, y:r.y1}, {x:r.x2, y:r.y2}, {x:r.x1, y:r.y2}];
  return {q:`A en B zijn de rechthoekige gebieden. Eén hokje is 1 cm².\nHoe groot is de oppervlakte van ${v[0]}?`, fig:{t:'rooster2', alt:'Rooster met twee overlappende rechthoekige gebieden A en B.', r:{xmin:0, xmax:9, ymin:0, ymax:6, figuren:[{pts:rh(a), kl:1, l:'A'}, {pts:rh(b), kl:2, l:'B'}]}},
    velden:[veld(v[1], 'cm²')], calc:false, u:`A: ${A} hokjes, B: ${B} hokjes, het overlappende deel: ${D} hokjes.\n${v[0]}: ${v[0] === 'A ∪ B' ? `${A} + ${B} − ${D}` : v[0] === 'A \\ B' ? `${A} − ${D}` : D} = ${v[1]} cm².`};
});
T('A-VZM-A5', 'vzm_a5_leeg', R => {
  const p = R.kies([['A ⊂ B', 2, [1]], ['A ∩ B = ∅', 2, [3]], ['A ∩ C = ∅', 3, [5, 7]], ['A ⊂ B en B ∩ C = ∅', 3, [1, 5, 6, 7]], ['B ⊂ A', 2, [2]]]);
  return {q:`Er geldt: ${p[0]}.\nKlik op alle gebieden van het venndiagram die zeker leeg zijn.`, venn:{n:p[1], w:p[2]}, u:p[0] === 'A ⊂ B' ? 'Elk element van A zit ook in B: het deel van A buiten B is leeg.' : p[0] === 'B ⊂ A' ? 'Elk element van B zit ook in A: het deel van B buiten A is leeg.' : 'Ga na welke gebieden in strijd zijn met het gegeven: daar kan geen element liggen.'};
});
T('A-VZM-A6', 'vzm_a6_aantal', R => {
  const a = R.kies([4, 6, 8, 10]), b = R.kies([6, 9, 12, 15]), m = R.kies([60, 100, 120]); if (a === b) return null;
  const A = veelv(a, m - 1), B = veelv(b, m - 1), v = R.int(0, 1);
  if (v) return {q:`A: de veelvouden van ${a} kleiner dan ${m} (zonder 0). B: de veelvouden van ${b} kleiner dan ${m} (zonder 0).\nHoeveel elementen heeft A ∩ B?`, velden:[veld(DOORS(A, B).length, 'elementen')], u:`A ∩ B: de gemeenschappelijke veelvouden, dat zijn de veelvouden van ${a * b / ggd(a, b)} (het kgv): ${opsom(DOORS(A, B))}. Dat zijn er ${DOORS(A, B).length}.`};
  return {q:`A: de veelvouden van ${a} kleiner dan ${m} (zonder 0). B: de veelvouden van ${b} kleiner dan ${m} (zonder 0).\nHoeveel elementen heeft A \\ B?`, velden:[veld(VERSCH(A, B).length, 'elementen')], u:`A heeft ${A.length} elementen. Daarvan zijn er ${DOORS(A, B).length} ook veelvoud van ${b} (veelvouden van ${a * b / ggd(a, b)}). ${A.length} − ${DOORS(A, B).length} = ${VERSCH(A, B).length}.`};
});
T('A-VZM-A7', 'vzm_a7_unie', R => {
  const A = R.schud([...Array(25).keys()].map(i => i + 1)).slice(0, R.int(6, 9)), B = R.schud([...Array(25).keys()].map(i => i + 1)).slice(0, R.int(5, 8));
  if (R.int(0, 1)) return {q:`A = ${opsom(A)} en B = ${opsom(B)}.\nHoeveel elementen heeft A ∪ B?`, velden:[veld(UNIE(A, B).length, 'elementen')], calc:false, u:`#A + #B − #(A ∩ B) = ${A.length} + ${B.length} − ${DOORS(A, B).length} = ${UNIE(A, B).length}.`};
  return {q:`A = ${opsom(A)} en B = ${opsom(B)}.\nHoeveel elementen heeft B \\ A?`, velden:[veld(VERSCH(B, A).length, 'elementen')], calc:false, u:`B \\ A = ${VERSCH(B, A).length ? opsom(VERSCH(B, A)) : '∅'}: ${VERSCH(B, A).length} elementen.`};
});
T('A-VZM-A8', 'vzm_a8_deel', R => {
  const r = R.schud([{t:'de veelvouden van 6 ⊂ de veelvouden van 3', w:true}, {t:'de veelvouden van 3 ⊂ de veelvouden van 6', w:false}, {t:'de delers van 6 ⊂ de delers van 18', w:true}, {t:'de delers van 18 ⊂ de delers van 6', w:false},
    {t:'de vierkanten ⊂ de ruiten', w:true}, {t:'de ruiten ⊂ de rechthoeken', w:false}, {t:'ℕ ⊂ ℤ', w:true}, {t:'ℚ ⊂ ℤ', w:false}]).slice(0, 4);
  return {q:'Zijn de uitspraken juist of fout?', jf:r, u:'A ⊂ B is juist als elk element van A ook tot B behoort. Zoek bij een foute uitspraak een tegenvoorbeeld: bv. 3 is een veelvoud van 3, maar niet van 6.'};
});
T('A-VZM-A9', 'vzm_a9_redenering', R => {
  const r = R.schud([{t:'x ∈ A ∩ B ⇒ x ∈ A', w:true}, {t:'x ∈ A ⇒ x ∈ A ∩ B', w:false}, {t:'x ∈ A ⇒ x ∈ A ∪ B', w:true}, {t:'x ∈ A \\ B ⇒ x ∉ B', w:true}, {t:'x ∈ A ∪ B ⇒ x ∈ A', w:false}, {t:'A ⊂ B ⇔ A ∩ B = A', w:true}, {t:'A ⊂ B ⇔ A ∪ B = A', w:false}]).slice(0, 4);
  return {q:'Zijn de redeneringen juist voor alle verzamelingen A en B?', jf:r, u:'⇒ betekent "als …, dan …". ⇔ betekent dat het in beide richtingen klopt.\nEen element van de doorsnede zit zeker in elke verzameling; een element van de unie zit in minstens één.'};
});
T('A-VZM-A10', 'vzm_a10_bepalen', R => {
  const A = [1, 2, 3, 4].slice(0, R.int(2, 4)), d = R.kies(A), extra = R.schud([5, 6, 7, 8]).slice(0, 2), B = [d].concat(extra);
  return {q:`Voor de verzamelingen A en B geldt: A = ${opsom(A)}, A ∩ B = {${d}} en A ∪ B = ${opsom(UNIE(A, B))}.\nWat is B?`, o:keuzes(opsom(B), [opsom(extra), opsom(UNIE(A, B)), opsom(A.filter(x => x !== d).concat(extra))]),
    u:`B bevat het gemeenschappelijke element ${d} en de elementen van A ∪ B die niet in A zitten: ${extra.join(' en ')}. Dus B = ${opsom(B)}.`};
});
T('A-VZM-A11', 'vzm_a11_vraagstuk', R => {
  const n = R.int(25, 40), a = R.int(10, 20), b = R.int(8, 18), ab = R.int(3, Math.min(a, b) - 2), geen = n - (a + b - ab); if (geen < 0) return null;
  const c = R.kies([['voetballen', 'zwemmen', 'doen allebei', 'doen geen van beide'], ['een hond hebben', 'een kat hebben', 'hebben een hond en een kat', 'hebben geen van beide'], ['Frans spreken', 'Engels spreken', 'spreken allebei', 'spreken geen van beide']]);
  return {q:`In een groep van ${n} jongeren zijn er ${a} die ${c[0]} en ${b} die ${c[1]}. ${ab} jongeren ${c[2]}.\nHoeveel jongeren ${c[3]}?`,
    velden:[veld(geen, 'jongeren')], calc:false, u:`Minstens één van beide: ${a} + ${b} − ${ab} = ${a + b - ab} (wie allebei doet, tel je anders dubbel).\nGeen van beide: ${n} − ${a + b - ab} = ${geen}.`};
});
/* ---------- Stap voor stap: één situatie, vier vragen van D naar A ----------
   De leerling ziet geen letters; de leerkracht ziet bij elke stap het doel. */
LAD('lad_wpo_reis', 'wpo', 'Schoolreis', R => {
  const n = R.int(42, 58), bus = R.kies([480, 520, 560]), ink = R.kies([12, 14, 15]), korting = R.kies([10, 20]), gr = R.kies([8, 10]);
  const perLl = bus / n, tot = bus + n * ink;
  return [
    {code:'A-WPO-D1', q:`${n} leerlingen gaan op schoolreis naar een pretpark. De inkom kost ${eur(ink)} per leerling.\nHoeveel kost de inkom voor alle leerlingen samen?`, velden:[geld(n * ink)], calc:'e', u:`${n} × ${eur(ink)} = ${eur(n * ink)}.`},
    {code:'A-WPO-C1', q:`De bus kost ${eur(bus)} voor de hele groep van ${n} leerlingen. De inkom kost ${eur(ink)} per leerling.\nHoeveel kost de schoolreis in totaal?`, velden:[geld(tot)], calc:'e', u:`Inkom: ${n} × ${eur(ink)} = ${eur(n * ink)}. Met de bus erbij: ${eur(n * ink)} + ${eur(bus)} = ${eur(tot)}.`},
    {code:'A-WPO-B1', q:`Per ${gr} leerlingen moet er één begeleider mee. Begeleiders betalen geen inkom.\nHoeveel begeleiders moeten er minstens mee met de ${n} leerlingen?`, velden:[veld(Math.ceil(n / gr), 'begeleiders')], calc:'e', u:`${n} : ${gr} = ${f(n / gr, 2)}. Er moet ook een begeleider zijn voor de laatste groep: ${Math.ceil(n / gr)}.`},
    {code:'A-WPO-A1', q:`Het pretpark doet een aanbod: bij een groep van meer dan 50 leerlingen krijg je ${korting} % korting op de inkom. Nu gaan er ${n} leerlingen mee.\nHoeveel kost de schoolreis (bus en inkom) per leerling? Rond af op 1 cent.`, velden:[geld(Math.round((bus + n * ink * (n > 50 ? 1 - korting / 100 : 1)) / n * 100) / 100)], calc:'e',
      u:`${n > 50 ? `Er gaan meer dan 50 leerlingen mee, dus ${korting} % korting: inkom ${eur(ink * (1 - korting / 100))} per leerling.` : 'Er gaan niet meer dan 50 leerlingen mee: geen korting.'}\nTotaal: ${eur(bus)} + ${n} × ${eur(ink * (n > 50 ? 1 - korting / 100 : 1))} = ${eur(bus + n * ink * (n > 50 ? 1 - korting / 100 : 1))}.\nPer leerling: ${eur((bus + n * ink * (n > 50 ? 1 - korting / 100 : 1)) / n)}.`}
  ];
});
LAD('lad_get_kamp', 'get', 'Op kamp', R => {
  const n = R.kies([24, 32, 40]), br = R.kies([[3, 4], [5, 8], [3, 8]]), u = R.int(9, 10), m = R.kies([15, 40]), duur = R.kies([95, 135, 160]);
  const t = u * 60 + m + duur;
  return [
    {code:'A-GET-D7', q:`${n} jongeren gaan op kamp. {{${br[0]}|${br[1]}}} van hen slaapt in een tent.\nHoeveel jongeren slapen in een tent?`, velden:[veld(n / br[1] * br[0])], calc:false, u:`${n} : ${br[1]} × ${br[0]} = ${n / br[1] * br[0]}.`},
    {code:'A-GET-C12', q:`De busrit naar het kamp duurt ${duur} minuten.\nHoeveel uur en minuten is dat?`, velden:[veld(Math.floor(duur / 60), 'uur'), veld(duur % 60, 'min')], calc:false, u:`${duur} = ${Math.floor(duur / 60)} · 60 + ${duur % 60}: ${duurT(duur)}.`},
    {code:'A-GET-B7', q:`De bus vertrekt om ${tijdT(u, m)}. De rit duurt ${duurT(duur)} en onderweg is er een pauze van 25 minuten.\nHoe laat komt de bus aan?`, velden:[veld(Math.floor((t + 25) / 60), 'uur'), veld((t + 25) % 60, 'min')], calc:false, u:`${tijdT(u, m)} + ${duurT(duur)} + 25 minuten = ${tijdT(Math.floor((t + 25) / 60), (t + 25) % 60)}.`},
    {code:'A-GET-A11', q:`Voor de kampvuuravond zijn er ${n} jongeren en ${n / 2 + 4} worstjes. Elke groep moet evenveel jongeren en evenveel worstjes krijgen, zonder dat er iets overblijft.\nHoeveel groepen kan je zo maximaal maken?`, velden:[veld(ggd(n, n / 2 + 4), 'groepen')], calc:false, u:`Zoek de ggd van ${n} en ${n / 2 + 4}: ${ggd(n, n / 2 + 4)}.`}
  ];
});
LAD('lad_alg_tegels', 'alg', 'Een tegelpad', R => {
  const s = R.kies(['vierkant', 'huis']), h = HOUT[s], n = R.int(4, 6), N = R.kies([30, 50, 100]);
  return [
    {code:'A-ALG-C4', q:'Je legt figuren met lucifers.\nHoeveel lucifers heb je nodig voor figuur 4?', fig:patroonFig(s, 3), velden:[veld(4 * h[0] + h[1], 'lucifers')], calc:false, u:`Er komen telkens ${h[0]} lucifers bij: ${3 * h[0] + h[1]} + ${h[0]} = ${4 * h[0] + h[1]}.`},
    {code:'A-ALG-B7', q:'Welke formule geeft het aantal lucifers L voor figuur n?', fig:patroonFig(s, 3), o:keuzes(`L = ${h[0]}n + ${h[1]}`, [`L = ${h[0] + h[1]}n`, `L = n + ${h[0]}`, `L = ${h[1]}n + ${h[0]}`]), u:`Per figuur ${h[0]} lucifers erbij, en er is er ${h[1]} extra: L = ${h[0]}n + ${h[1]}.`},
    {code:'A-ALG-A5', q:`Hoeveel lucifers heb je nodig voor figuur ${N}?`, fig:patroonFig(s, 3), velden:[veld(h[0] * N + h[1], 'lucifers')], calc:false, u:`L = ${h[0]} · ${N} + ${h[1]} = ${h[0] * N + h[1]}.`},
    {code:'A-ALG-A5', q:`Je hebt een doos met ${h[0] * N + h[1] + n} lucifers. Je maakt de grootst mogelijke figuur.\nWelke figuur is dat, en hoeveel lucifers blijven er over? Typ eerst het nummer van de figuur.`, fig:patroonFig(s, 3), velden:[veld(N + Math.floor(n / h[0]), '', 'figuur'), veld(n % h[0], 'over')], calc:false,
      u:`${h[0]}n + ${h[1]} ≤ ${h[0] * N + h[1] + n}, dus ${h[0]}n ≤ ${h[0] * N + n} en n ≤ ${f((h[0] * N + n) / h[0], 2)}. Figuur ${N + Math.floor(n / h[0])}, er blijven ${n % h[0]} lucifers over.`}
  ];
});
LAD('lad_vvg_limonade', 'vvg', 'Limonade maken', R => {
  const s = R.kies([1, 2]), w = R.kies([5, 6, 7]), k = R.int(3, 6), pr = R.kies([2.4, 3, 3.6]);
  return [
    {code:'A-VVG-D1', q:`Je mengt siroop en water in de verhouding ${s} : ${w}.\nHoeveel dl water heb je nodig voor ${s * k} dl siroop?`, velden:[veld(w * k, 'dl')], calc:false, u:`${s * k} is ${k} keer ${s}: ${k} × ${w} = ${w * k} dl.`},
    {code:'A-VVG-C3', q:`De verhouding siroop : water is ${s} : ${w}.\nWelk deel van de limonade is siroop?`, o:keuzes(`{{${s}|${s + w}}}`, [`{{${s}|${w}}}`, `{{${w}|${s + w}}}`, `{{${s + w}|${s}}}`]), u:`In ${s + w} delen limonade zit ${s} deel siroop: {{${s}|${s + w}}}.`},
    {code:'A-VVG-B1', q:`Een fles siroop van 0,75 l kost ${eur(pr)}. De verhouding siroop : water is ${s} : ${w}.\nHoeveel liter limonade kan je met één fles maken?`, velden:[veld(0.75 * (s + w) / s, 'liter')], u:`Per ${s} deel siroop heb je ${s + w} delen limonade. 0,75 · {{${s + w}|${s}}} = ${f(0.75 * (s + w) / s)} l.`},
    {code:'A-VVG-A8', q:`Je wilt ${3 * (s + w)} l limonade maken. Noem x het aantal liter siroop.\nWelke vergelijking past?`, o:keuzes(`x + {{${w}|${s}}}x = ${3 * (s + w)}`.replace('{{' + w + '|1}}', String(w)), [`x + ${w} = ${3 * (s + w)}`, `{{${w}|${s}}}x = ${3 * (s + w)}`.replace('{{' + w + '|1}}', String(w)), `${s}x + ${w} = ${3 * (s + w)}`]),
      u:`Per liter siroop heb je {{${w}|${s}}} liter water. Siroop + water = ${3 * (s + w)}: x + {{${w}|${s}}}x = ${3 * (s + w)}. Oplossing: x = ${3 * s}.`.replace('{{' + w + '|1}}', String(w)).replace('{{' + w + '|1}}', String(w))}
  ];
});
LAD('lad_mor_balk', 'mor', 'Een doos', R => {
  const r = R.kies(RIBBEN), par = RIBBEN.filter(x => x !== r && RICHTING(x) === RICHTING(r)), kr = RIBBEN.filter(x => ligging(r, x) === 'kruisend');
  return [
    {code:'A-MOR-D1', q:'Hoe noem je de zijvlakken van deze doos?', fig:balkFig(), o:keuzes('rechthoeken', ['driehoeken', 'cirkels', 'vijfhoeken']), u:'Een balk heeft zes rechthoekige zijvlakken.'},
    {code:'A-MOR-C2', q:`Welke ribbe is evenwijdig met [${r}]?`, fig:balkFig(null, [r]), o:keuzes(`[${par[0]}]`, R.schud(RIBBEN.filter(x => RICHTING(x) !== RICHTING(r))).slice(0, 3).map(x => `[${x}]`)), u:`[${r}] en [${par[0]}] hebben dezelfde richting.`},
    {code:'A-MOR-B4', q:'Welke vorm heeft het gekleurde vlak ACGE in werkelijkheid?', fig:balkFig('ACGE'), o:keuzes('rechthoek', ['parallellogram', 'trapezium', 'ruit']), u:'[AE] en [CG] staan loodrecht op het grondvlak. ACGE heeft vier rechte hoeken: een rechthoek.'},
    {code:'A-MOR-A3', q:`Hoe liggen ${r} en ${kr[0]} ten opzichte van elkaar?`, fig:balkFig(null, [r, kr[0]]), o:keuzes('kruisend', ['snijdend', 'evenwijdig', 'samenvallend']), u:`${r} en ${kr[0]} liggen niet in één vlak en snijden elkaar niet: kruisend.`}
  ];
});
LAD('lad_mei_driehoek', 'mei', 'Een gelijkbenige driehoek', R => {
  const t = R.stap(30, 100, 2), b = (180 - t) / 2;
  return [
    {code:'A-MEI-D3', q:`In driehoek ABC is |CA| = |CB|. Wat is het hoekpunt van ${hk('A', 'C', 'B')}?`, o:keuzes('C', ['A', 'B', 'AB']), u:'De letter met het dakje is het hoekpunt: C.'},
    {code:'A-MEI-C8', q:`In driehoek ABC is |CA| = |CB| en ${hk1('C')} = ${t}°.\nHoe groot is ${hk1('A')}?`, velden:[veld(b, '°')], calc:false, u:`De basishoeken zijn even groot: (180° − ${t}°) : 2 = ${b}°.`},
    {code:'A-MEI-B7', q:`De nevenhoek van ${hk1('B')} wordt getekend.\nHoe groot is die nevenhoek?`, velden:[veld(180 - b, '°')], calc:false, u:`${hk1('B')} = ${b}°. Nevenhoek: 180° − ${b}° = ${180 - b}°.`},
    {code:'A-MEI-A2', q:`[AD] is de bissectrice van ${hk1('A')}, met D op [BC].\nHoe groot is ${hk('A', 'D', 'B')}?`, velden:[veld(180 - b / 2 - b, '°')], calc:false, u:`${hk('D', 'A', 'B')} = ${b}° : 2 = ${f(b / 2)}°. In △ABD: 180° − ${f(b / 2)}° − ${b}° = ${f(180 - b / 2 - b)}°.`}
  ];
});
LAD('lad_ooi_tuin', 'ooi', 'Een tuin', R => {
  const l = R.int(10, 16), b = R.int(6, 9), r = R.kies([1, 1.5, 2]), h = R.kies([40, 50, 60]);
  return [
    {code:'A-OOI-D1', q:`Een tuin is een rechthoek van ${l} m op ${b} m. In de tuin komt een ronde vijver.\nHoe noem je het lijnstuk van het middelpunt van de vijver naar de rand?`, o:keuzes('de straal', ['de diameter', 'de omtrek', 'de hoogte']), u:'Van het middelpunt naar de cirkel: de straal.'},
    {code:'A-OOI-C5', q:`Bereken de oppervlakte van de tuin (${l} m op ${b} m).`, fig:rechthoekFig(l, b, 'm'), velden:[veld(l * b, 'm²')], calc:false, u:`${l} · ${b} = ${l * b} m².`},
    {code:'A-OOI-B2', q:`Rond de tuin komt een haag. Hoeveel meter haag heb je nodig?`, fig:rechthoekFig(l, b, 'm'), velden:[veld(2 * (l + b), 'm')], calc:false, u:`Omtrek: 2 · (${l} + ${b}) = ${2 * (l + b)} m.`},
    {code:'A-OOI-A2', q:`De vijver heeft een straal van ${f(r)} m. De rest van de tuin is gras.\nHoeveel m² gras is er? Gebruik π ≈ 3,14 en rond af op 0,01 m².`, velden:[veld(Math.round((l * b - 3.14 * r * r) * 100) / 100, 'm²')], calc:'w', u:`Vijver: 3,14 · ${f(r)}² = ${f(3.14 * r * r)} m². Gras: ${l * b} − ${f(3.14 * r * r)} = ${f(l * b - 3.14 * r * r)} m².`}
  ];
});
LAD('lad_tra_rooster', 'tra', 'Een vlag op een rooster', R => {
  const F = verplaats(VLAGGEN[1], 1, 2), P = F[3], G = F.map(TF.spiegelV(4)), H = F.map(TF.punt(5, 3));
  const fg = (extra) => ({t:'rooster2', alt:'Rooster met een figuur F.', r:Object.assign({xmin:0, xmax:9, ymin:0, ymax:6, figuren:[{pts:F, kl:2, l:'F'}]}, extra || {})});
  return [
    {code:'A-TRA-D3', q:'Hoeveel symmetrieassen heeft figuur F?', fig:fg(), velden:[veld(0)], calc:false, u:'Hoe je F ook plooit, de helften vallen niet op elkaar: 0 symmetrieassen.'},
    {code:'A-TRA-C4', q:"F' is het beeld van F door een verschuiving. Hoe is F verschoven?", fig:{t:'rooster2', alt:'Rooster met F en F\'.', r:{xmin:0, xmax:9, ymin:0, ymax:6, figuren:[{pts:F, kl:2, l:'F'}, {pts:verplaats(F, 5, -1), kl:1, l:"F'"}]}}, o:keuzes(vectorTekst(5, -1), [vectorTekst(-5, 1), vectorTekst(1, -5), vectorTekst(5, 1)]), u:`Tel de hokjes: ${vectorTekst(5, -1)}.`},
    {code:'A-TRA-B1', q:'F wordt gespiegeld om de rechte m. Klik op het beeld van het punt P.', rooster:{xmin:0, xmax:9, ymin:0, ymax:6, figuren:[{pts:F, kl:2}], lijnen:[{x1:4, y1:0, x2:4, y2:6, vol:1, l:'m'}], punten:[{x:P.x, y:P.y, l:'P'}]}, w:G[3], u:`P ligt ${4 - P.x} hokjes links van m. Het beeld ligt even ver rechts van m.`},
    {code:'A-TRA-A2', q:"Figuur F' is het beeld van F. Zijn de uitspraken juist of fout?", fig:{t:'rooster2', alt:'Rooster met F, F\' en het punt O.', r:{xmin:0, xmax:9, ymin:0, ymax:6, figuren:[{pts:F, kl:2, l:'F'}, {pts:H, kl:1, l:"F'"}], punten:[{x:5, y:3, l:'O'}]}},
      jf:[{t:"F' is het beeld van F door een rotatie om O over 180°.", w:true}, {t:"F' is het beeld van F door een verschuiving.", w:false}, {t:"F' is het beeld van F door een puntspiegeling om O.", w:true}], u:"F' staat op zijn kop met O in het midden: puntspiegeling om O = rotatie over 180°."}
  ];
});
LAD('lad_sta_toetsen', 'sta', 'Toetsresultaten', R => {
  const a = []; for (let i = 0; i < 7; i++) a.push(R.int(8, 16)); const g = somV(a) / 7;
  const doel = Math.ceil(g) + R.int(0, 1), x = 8 * doel - somV(a); if (x > 20 || x <= g) return null;
  return [
    {code:'A-STA-D4', q:`${R.naam()} haalde op 7 toetsen: ${a.join(', ')} (op 20).\nHoeveel keer haalde de leerling 12 of meer?`, velden:[veld(a.filter(x => x >= 12).length, 'keer')], calc:false, u:`Tel de scores van 12 of meer: ${a.filter(x => x >= 12).join(', ') || 'geen'}. Dat is ${a.filter(x => x >= 12).length} keer.`},
    {code:'A-STA-C6', q:`Scores: ${a.join(', ')}.\nWat is de mediaan?`, velden:[veld(mediaan(a))], calc:false, u:`Rangschik: ${a.slice().sort((x, y) => x - y).join(', ')}. Het middelste (4de) getal is ${mediaan(a)}.`},
    {code:'A-STA-B7', q:`Scores: ${a.join(', ')}.\nWat is het gemiddelde? Rond af op 0,1.`, velden:[veld(Math.round(g * 10) / 10)], calc:'w', u:`${somV(a)} : 7 ≈ ${f(Math.round(g * 10) / 10)}.`},
    {code:'A-STA-A9', q:`Er komt nog een achtste toets. Hoeveel moet de leerling halen om gemiddeld ${doel} op 20 te hebben?`, velden:[veld(x)], calc:'w', u:`Nodig: 8 · ${doel} = ${8 * doel} punten. Al behaald: ${somV(a)}. ${8 * doel} − ${somV(a)} = ${x}.`}
  ];
});
LAD('lad_tad_cafetaria', 'tad', 'In de cafetaria', R => {
  const pr = [['frisdrank', 2], ['broodje', 3.5], ['soep', 2.5], ['fruit', 1]], n = [R.int(10, 30), R.int(20, 45), R.int(5, 20), R.int(8, 25)];
  const fg = {t:'tab', titel:'Verkoop op maandag', kop:['product', 'prijs', 'aantal verkocht'], rijen:pr.map((p, i) => [p[0], eur(p[1]), n[i]])};
  const mx = Math.max.apply(null, n), omz = n.map((x, i) => x * pr[i][1]);
  return [
    {code:'A-TAD-D1', q:'Hoeveel broodjes werden er verkocht?', fig:fg, velden:[veld(n[1], 'broodjes')], calc:false, u:`Lees af in de rij "broodje": ${n[1]}.`},
    {code:'A-TAD-C3', q:'Welk product werd het meest verkocht?', fig:fg, o:keuzes(pr[n.indexOf(mx)][0], pr.filter((p, i) => n[i] !== mx).map(p => p[0])), u:`Het grootste aantal is ${mx}: ${pr[n.indexOf(mx)][0]}.`},
    {code:'A-TAD-B3', q:'Hoeveel euro bracht de verkoop van soep op?', fig:fg, velden:[geld(omz[2])], calc:'w', u:`${n[2]} × ${eur(2.5)} = ${eur(omz[2])}.`},
    {code:'A-TAD-A2', q:'Hoeveel procent van de totale opbrengst kwam van de broodjes? Rond af op 1 %.', fig:fg, velden:[veld(Math.round(omz[1] / somV(omz) * 100), '%')], calc:'w', u:`Opbrengst: ${omz.map(eur).join(' + ')} = ${eur(somV(omz))}. Broodjes: ${eur(omz[1])}.\n${f(omz[1])} : ${f(somV(omz))} ≈ ${Math.round(omz[1] / somV(omz) * 100)} %.`}
  ];
});
LAD('lad_vzm_sport', 'vzm', 'Sport in de klas', R => {
  const n = R.int(26, 30), v = R.int(10, 15), z = R.int(8, 13), b = R.int(3, 6), geen = n - (v + z - b);
  return [
    {code:'A-VZM-D2', q:'V: de leerlingen die voetballen. Z: de leerlingen die zwemmen.\nWat weet je over Noor, die in het gemeenschappelijke deel van V en Z staat?', fig:{t:'venn', a:['Jonas'], ab:['Noor'], b:['Elif'], uit:['Bram']}, o:keuzes('Noor voetbalt en zwemt.', ['Noor voetbalt, maar zwemt niet.', 'Noor zwemt, maar voetbalt niet.', 'Noor voetbalt niet en zwemt niet.']), u:'Het gemeenschappelijke deel hoort bij V én bij Z.'},
    {code:'A-VZM-C7', q:'Klik op het gebied van de leerlingen die voetballen, maar niet zwemmen (V \\ Z).', venn:{n:2, w:[1], labels:['V', 'Z']}, u:'V \\ Z: in V, maar niet in Z.'},
    {code:'A-VZM-B8', q:`${v} leerlingen voetballen, ${b} van hen zwemmen ook.\nHoeveel leerlingen voetballen, maar zwemmen niet?`, velden:[veld(v - b, 'leerlingen')], calc:false, u:`${v} − ${b} = ${v - b}.`},
    {code:'A-VZM-A11', q:`In de klas zitten ${n} leerlingen. ${v} voetballen, ${z} zwemmen en ${b} doen allebei.\nHoeveel leerlingen doen geen van beide?`, velden:[veld(geen, 'leerlingen')], calc:false, u:`Minstens één: ${v} + ${z} − ${b} = ${v + z - b}. Geen van beide: ${n} − ${v + z - b} = ${geen}.`}
  ];
});
/* ---------- Wiskundige problemen oplossen (breedtethema, B-stroom, 2B) ----------
   Korte zinnen, één gegeven per zin, de vraag op de laatste regel. Contexten uit het dagelijks leven.
   D: één berekening, gegevens staan er meteen · C: berekeningen combineren, overbodige informatie negeren
   B: informatie eerst afleiden, overbodige informatie in meerdere stappen · A: verband gebruiken, mogelijkheden uitwerken, eigen schets of tabel */

/* ===== D ===== */
T('B-WPO-D1', 'bwpo_d1_verpakken', R => {
  const p = R.kies([['Een bakker', 'koekjes', 'zakje', 'zakjes'], ['Een kweker', 'plantjes', 'bak', 'bakken'], ['Een juf', 'stiften', 'pot', 'potten'],
    ['Een winkel', 'eieren', 'doos', 'dozen'], ['Een boer', 'appels', 'kist', 'kisten']]);
  const per = R.int(6, 15), tot = R.int(8, 20) * per + R.int(1, per - 1), n = Math.ceil(tot / per);
  return {q:`${p[0]} heeft ${tot} ${p[1]}.\nIn één ${p[2]} passen ${per} ${p[1]}.\nHoeveel ${p[3]} zijn er minstens nodig voor alle ${p[1]}?`,
    velden:[veld(n, p[3])], tip:'Deel en kijk dan goed: blijft er iets over?',
    u:`${tot} : ${per} = ${f(tot / per, 2)}.\nMet ${n - 1} ${p[3]} heb je plaats voor ${(n - 1) * per} ${p[1]}. Dat is te weinig.\nJe hebt dus ${n} ${p[3]} nodig.`};
});
T('B-WPO-D1', 'bwpo_d1_klok', R => {
  const voor = R.kies([true, false]), d = R.int(4, 12);
  let u = R.int(7, 21), m = R.int(0, 59);
  const echt = u * 60 + m + (voor ? -d : d);
  if (Math.floor(echt / 60) === u) { if (R.int(0, 1)) return null; }
  const eu = Math.floor(echt / 60), em = echt % 60;
  const fout = [voor ? u * 60 + m + d : u * 60 + m - d, echt + 60, echt - 60 * 12 > 0 ? echt - 60 * 12 : echt + 120];
  const T2 = x => digiT(Math.floor(x / 60) % 24, x % 60);
  return {q:`De klok loopt ${d} minuten ${voor ? 'voor' : 'achter'}.\nHoe laat is het echt?`, fig:{t:'digi', tijd:digiT(u, m)},
    o:keuzes(T2(echt), fout.map(T2).concat([digiT((u + 1) % 24, m)])),
    u:`De klok loopt ${voor ? 'voor' : 'achter'}: de echte tijd is ${voor ? 'vroeger' : 'later'}.\n${digiT(u, m)} ${voor ? '−' : '+'} ${d} minuten = ${digiT(eu, em)}.`};
});
T('B-WPO-D1', 'bwpo_d1_tickets', R => {
  const p = R.kies([['Een ticket voor de film', 'tickets'], ['Een zwembeurt', 'zwembeurten'], ['Een busticket', 'bustickets'], ['Een ijsje', 'ijsjes']]);
  const pr = R.stap(2.5, 12, 0.5), n = R.int(3, 7);
  return {q:`${p[0]} kost ${eur(pr)}.\nJe koopt ${n} ${p[1]}.\nHoeveel betaal je?`, velden:[geld(pr * n)], u:`${n} × ${eur(pr)} = ${eur(pr * n)}.`};
});

/* ===== C ===== */
T('B-WPO-C1', 'bwpo_c1_teruggeld', R => {
  const p = R.kies([['pizza', "pizza's"], ['boek', 'boeken'], ['T-shirt', 'T-shirts'], ['bloempot', 'bloempotten']]);
  const pr = R.stap(4, 18, 0.5), n = R.int(2, 4), betaal = Math.ceil(pr * n / 10) * 10 + R.kies([0, 10]);
  if (betaal - pr * n < 1) return null;
  return {q:`Je koopt ${n} ${p[1]}.\nEén ${p[0]} kost ${eur(pr)}.\nJe betaalt met ${eur(betaal)}.\nHoeveel geld krijg je terug?`, velden:[geld(betaal - pr * n)],
    u:`Eerst de prijs: ${n} × ${eur(pr)} = ${eur(pr * n)}.\nDan het wisselgeld: ${eur(betaal)} − ${eur(pr * n)} = ${eur(betaal - pr * n)}.`};
});
T('B-WPO-C1', 'bwpo_c1_huur', R => {
  const p = R.kies([['een fiets', 'per uur', 'uur'], ['een kano', 'per uur', 'uur'], ['een step', 'per uur', 'uur']]);
  const pu = R.stap(3, 9, 0.5), vast = R.kies([5, 10, 15]), u = R.int(2, 6);
  return {q:`Je huurt ${p[0]}.\nJe betaalt ${eur(vast)} vaste prijs en ${eur(pu)} ${p[1]}.\nJe huurt ${p[0]} ${u} uur.\nHoeveel betaal je in totaal?`, velden:[geld(vast + pu * u)],
    u:`${u} × ${eur(pu)} = ${eur(pu * u)}.\n${eur(vast)} + ${eur(pu * u)} = ${eur(vast + pu * u)}.`};
});
T('B-WPO-C2', 'bwpo_c2_job', R => {
  const wie = R.naam(), lft = R.int(15, 17), uur = R.int(3, 5), loon = R.stap(7, 11, 0.5), weken = R.int(3, 6), open = R.int(6, 8);
  return {q:`${wie} is ${lft} jaar.\n${wie} werkt elke zaterdag ${uur} uur in een bakkerij.\nDe bakkerij gaat open om ${open} uur.\n${wie} verdient ${eur(loon)} per uur.\nHoeveel verdient ${wie} in ${weken} zaterdagen?`,
    velden:[geld(uur * loon * weken)], tip:'Niet alle getallen heb je nodig. Welke wel?',
    u:`De leeftijd en het uur van openen heb je niet nodig.\nPer zaterdag: ${uur} × ${eur(loon)} = ${eur(uur * loon)}.\nIn ${weken} zaterdagen: ${weken} × ${eur(uur * loon)} = ${eur(uur * loon * weken)}.`};
});
T('B-WPO-C2', 'bwpo_c2_reis', R => {
  const km = R.int(120, 380), vertrek = R.int(7, 10), pers = R.int(3, 5), l = R.stap(5, 7.5, 0.5), prijs = R.stap(1.6, 1.9, 0.05);
  const liter = km / 100 * l;
  if (Math.abs(liter * 10 - Math.round(liter * 10)) > 1e-9) return null;
  return {q:`Een familie van ${pers} personen rijdt ${km} km naar zee.\nZe vertrekken om ${vertrek} uur.\nDe auto verbruikt ${f(l)} liter per 100 km.\nHoeveel liter brandstof verbruikt de auto voor die rit?`,
    velden:[veld(liter, 'liter')], tip:'Hoeveel keer 100 km rijden ze?',
    u:`Het aantal personen en het uur van vertrek heb je niet nodig.\n${km} km is ${f(km / 100)} keer 100 km.\n${f(km / 100)} × ${f(l)} = ${f(liter)} liter.`};
});
T('B-WPO-C2', 'bwpo_c2_tuin', R => {
  const l = R.int(6, 14), b = R.int(3, l - 1), plant = R.int(12, 30), pr = R.stap(1.5, 4, 0.5);
  return {q:`Een tuin is ${l} m lang en ${b} m breed.\nIn de tuin staan ${plant} plantjes.\nRond de tuin komt een hek.\nEen meter hek kost ${eur(pr)}.\nHoeveel kost het hek rond de hele tuin?`,
    velden:[geld(2 * (l + b) * pr)], tip:'Het hek gaat rond de tuin: dat is de omtrek.',
    u:`Het aantal plantjes heb je niet nodig.\nOmtrek: ${l} + ${b} + ${l} + ${b} = ${2 * (l + b)} m.\n${2 * (l + b)} × ${eur(pr)} = ${eur(2 * (l + b) * pr)}.`};
});

/* ===== B ===== */
T('B-WPO-B1', 'bwpo_b1_beurtenkaart', R => {
  const p = R.kies([['zwembad', 'zwembeurt', 'beurt'], ['fitness', 'beurt', 'beurt'], ['schaatsbaan', 'beurt', 'beurt']]);
  const los = R.stap(3.5, 6, 0.5), n = R.kies([10, 10, 12, 20]), kaart = Math.round(n * los * R.kies([0.8, 0.75, 0.85, 0.9]) * 2) / 2;
  const bes = los - kaart / n;
  if (Math.abs(bes * 100 - Math.round(bes * 100)) > 1e-6 || bes <= 0) return null;
  return {q:`Eén ${p[1]} in het ${p[0]} kost ${eur(los)}.\nEen kaart voor ${n} beurten kost ${eur(kaart)}.\nHoeveel bespaar je per beurt met de kaart?`, velden:[geld(bes)],
    tip:'Wat kost één beurt met de kaart?',
    u:`Met de kaart kost één beurt ${eur(kaart)} : ${n} = ${eur(kaart / n)}.\nJe bespaart ${eur(los)} − ${eur(kaart / n)} = ${eur(bes)} per beurt.`};
});
T('B-WPO-B1', 'bwpo_b1_bus', R => {
  const om = R.kies([10, 12, 15, 20]), eu = R.int(6, 8), em = R.int(0, om - 1), aank = R.int(8, 10) * 60 + R.int(0, 59);
  const eerste = eu * 60 + em;
  if (aank <= eerste) return null;
  const n = Math.ceil((aank - eerste) / om), vol = eerste + n * om;
  if (vol === aank) return null;
  return {q:`De eerste bus vertrekt om ${digiT(eu, em)}.\nDaarna rijdt er elke ${om} minuten een bus.\nJe komt aan de bushalte om ${digiT(Math.floor(aank / 60), aank % 60)}.\nHoe laat vertrekt de volgende bus?`,
    velden:[veld(Math.floor(vol / 60), 'uur'), veld(vol % 60, 'min')], calc:false, tip:'Tel telkens ' + om + ' minuten bij. Of reken eerst hele uren.',
    u:`De bussen vertrekken om ${[0, 1, 2].map(i => digiT(Math.floor((eerste + i * om) / 60), (eerste + i * om) % 60)).join(', ')}, …\nVan ${digiT(eu, em)} tot ${digiT(Math.floor(aank / 60), aank % 60)} is ${aank - eerste} minuten.\n${aank - eerste} : ${om} = ${f((aank - eerste) / om, 2)}. De volgende bus is dus de ${n}de na de eerste.\n${digiT(eu, em)} + ${n} × ${om} minuten = ${digiT(Math.floor(vol / 60), vol % 60)}.`};
});
T('B-WPO-B2', 'bwpo_b2_feest', R => {
  const gasten = R.int(18, 40), per = R.kies([2, 3]), pak = R.kies([6, 8, 10]), pr = R.stap(2, 5, 0.5), zaal = R.int(18, 23);
  const nodig = gasten * per, pakken = Math.ceil(nodig / pak);
  return {q:`Op een feest komen ${gasten} gasten.\nHet feest begint om ${zaal} uur.\nElke gast krijgt ${per} drankjes.\nDe drankjes zitten per ${pak} in een pak.\nEen pak kost ${eur(pr)}.\nHoeveel kosten de drankjes in totaal?`,
    velden:[geld(pakken * pr)], tip:'Hoeveel drankjes heb je nodig? Hoeveel pakken zijn dat?',
    u:`Het uur heb je niet nodig.\nDrankjes: ${gasten} × ${per} = ${nodig}.\nPakken: ${nodig} : ${pak} = ${f(nodig / pak, 2)}, dus ${pakken} pakken.\nPrijs: ${pakken} × ${eur(pr)} = ${eur(pakken * pr)}.`};
});

/* ===== A ===== */
T('B-WPO-A1', 'bwpo_a1_abonnement', R => {
  const a = R.stap(8, 15, 1), pa = R.stap(0.1, 0.3, 0.05), b = R.stap(18, 30, 1);
  const grens = (b - a) / pa;
  if (Math.abs(grens - Math.round(grens)) > 1e-6 || grens < 20 || grens > 150) return null;
  return {q:`Gsm-abonnement A kost ${eur(a)} per maand en ${eur(pa)} per minuut bellen.\nAbonnement B kost ${eur(b)} per maand. Bellen is gratis.\nVanaf hoeveel minuten bellen per maand zijn beide abonnementen even duur?`,
    velden:[veld(Math.round(grens), 'minuten')], tip:'Hoeveel duurder is B? Hoeveel minuten bellen met A kost dat?',
    u:`B kost ${eur(b)} − ${eur(a)} = ${eur(b - a)} meer per maand.\nMet A betaal je ${eur(pa)} per minuut.\n${eur(b - a)} : ${eur(pa)} = ${Math.round(grens)} minuten.\nBij ${Math.round(grens)} minuten zijn beide even duur.`};
});
T('B-WPO-A2', 'bwpo_a2_munten', R => {
  const tot = R.kies([3, 4, 5, 6]);
  /* manieren met munten van € 2, € 1 en € 0,50 */
  let n = 0; const lijst = [];
  for (let t = 0; t * 2 <= tot; t++) for (let e = 0; t * 2 + e <= tot; e++) { const h = (tot - t * 2 - e) * 2; n++; lijst.push((t ? t + ' × € 2' : '') + (t && (e || h) ? ' + ' : '') + (e ? e + ' × € 1' : '') + (e && h ? ' + ' : '') + (h ? h + ' × € 0,50' : '')); }
  return {q:`In een automaat betaal je ${eur(tot)}.\nJe hebt genoeg munten van € 2, € 1 en € 0,50.\nOp hoeveel verschillende manieren kan je juist ${eur(tot)} betalen?`,
    velden:[veld(n, 'manieren')], tip:'Werk ordelijk: begin met zoveel mogelijk munten van € 2, dan één minder, …',
    u:`Schrijf alle manieren ordelijk op:\n${lijst.join('\n')}\nDat zijn ${n} manieren.`};
});
T('B-WPO-A2', 'bwpo_a2_tafels', R => {
  const g = R.kies([[4, 6], [6, 8]]), pers = R.int(5, 9) * 2 + R.kies([0, 2, 4]);
  /* tafels voor 4 of 6 personen; zo weinig mogelijk tafels, alle plaatsen bezet */
  let best = null; const opl = [];
  for (let a = 0; a * g[0] <= pers; a++) { const r = pers - a * g[0]; if (r % g[1] === 0) opl.push([a, r / g[1]]); }
  if (opl.length < 2) return null;
  opl.forEach(o => { if (!best || o[0] + o[1] < best[0] + best[1]) best = o; });
  return {q:`Een restaurant heeft tafels voor ${g[0]} personen en tafels voor ${g[1]} personen.\nEr komt een groep van ${pers} personen.\nAlle plaatsen aan de gebruikte tafels moeten bezet zijn.\nHoeveel tafels gebruik je minstens?`,
    velden:[veld(best[0] + best[1], 'tafels')], tip:'Probeer verschillende mogelijkheden in een tabel.',
    u:`Mogelijkheden:\n${opl.map(o => mv(o[0], 'tafel', 'tafels') + ' van ' + g[0] + ' en ' + mv(o[1], 'tafel', 'tafels') + ' van ' + g[1] + ': samen ' + (o[0] + o[1]) + ' tafels').join('\n')}\nHet minst: ${best[0] + best[1]} tafels.`};
});
T('B-WPO-A3', 'bwpo_a3_tafelrij', R => {
  const n = R.int(6, 15), pers = 2 * n + 2;
  return {q:`Aan één vierkante tafel zitten 4 personen: aan elke kant één.\nJe zet tafels tegen elkaar in een lange rij.\nAan de kanten die tegen elkaar staan, kan niemand zitten.\nEr komen ${pers} personen.\nHoeveel tafels zet je in de rij?`,
    velden:[veld(n, 'tafels')], tip:'Maak een schets met 1, 2 en 3 tafels. Tel telkens de plaatsen.',
    u:`Maak een tabel:\n1 tafel: 4 plaatsen. 2 tafels: 6 plaatsen. 3 tafels: 8 plaatsen.\nElke tafel erbij geeft 2 plaatsen meer: plaatsen = 2 × tafels + 2.\n${pers} − 2 = ${pers - 2} en ${pers - 2} : 2 = ${n} tafels.`};
});
T('B-WPO-A4', 'bwpo_a4_verhuis', R => {
  const doos = R.int(28, 60), kg = R.int(8, 15), max = R.kies([400, 450, 500, 600]), chauf = R.naam(), km = R.int(12, 45);
  const rit = Math.ceil(doos * kg / max);
  if (rit < 2) return null;
  return {q:`${chauf} verhuist ${km} km verder.\nEr zijn ${doos} dozen. Elke doos weegt ongeveer ${kg} kg.\nDe bestelwagen mag ${max} kg per rit vervoeren.\nEen rit heen en terug duurt 1 uur en 20 minuten.\nHoeveel ritten zijn er minstens nodig voor alle dozen?`,
    velden:[veld(rit, 'ritten')], tip:'Welke gegevens heb je echt nodig?',
    u:`De afstand en de duur van een rit heb je niet nodig.\nAlle dozen samen: ${doos} × ${kg} = ${doos * kg} kg.\n${doos * kg} : ${max} = ${f(doos * kg / max, 2)}, dus ${rit} ritten.`};
});
/* ---------- Getallenleer (dieptethema, B-stroom, 2B) ----------
   Leeswijzer: "Een leerling kan meestal met ICT en in een functionele context: …".
   Sjablonen van 2A die precies bij een B-doel passen en al eenvoudig geschreven zijn, krijgen hier ook een B-code (koppel).
   Daarnaast eigen 2B-vragen: tijd (analoog, digitaal, in woorden), winkel en keuken, korte zinnen. */
koppel('B', `
get_d2_eenheid=B-GET-D1 get_d1_grootheid=B-GET-D2 get_d3_grootteorde=B-GET-D3 get_d4_afronden=B-GET-D4 get_d7_breukvan=B-GET-D8
get_d9_maal5=B-GET-D9 get_d11_soorten=B-GET-D10 get_c7_strategie=B-GET-C6 get_c9_ordenen=B-GET-C7 get_c11_schatten=B-GET-C8 get_c12_tijd=B-GET-C9
get_b1_eenheid=B-GET-B1 get_b2_grootteorde=B-GET-B2 get_b3_massa=B-GET-B3 get_b5_afronden=B-GET-B5 get_b6_zinvol=B-GET-B6 get_d5_tijd=B-GET-B7
get_b11_procent=B-GET-B9 get_b16_breuken=B-GET-B11 get_b17_schatten=B-GET-B12 get_b18_herleiden=B-GET-B13
get_a1_eenheden=B-GET-A1 get_a2_afronden=B-GET-A2 get_a3_5cent=B-GET-A3 get_a5_deel=B-GET-A6 get_a12_btw=B-GET-A7 get_a19_schatten=B-GET-A9 get_a20_herleiden=B-GET-A11
`);
/* 2B werkt 'meestal met ICT': bij herleiden mag de eenvoudige rekenmachine */
calcB('get_b18_herleiden get_a20_herleiden', 'e');

const UURWOORD = ['twaalf', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf'];
/* tijd in woorden zoals je ze zegt: kwart over drie, half vijf, tien voor half acht, … */
function tijdWoord(u, m) {
  const h = u % 12, v = (u + 1) % 12;
  const W = {0:UURWOORD[h] + ' uur', 15:'kwart over ' + UURWOORD[h], 30:'half ' + UURWOORD[v], 45:'kwart voor ' + UURWOORD[v],
    5:'vijf over ' + UURWOORD[h], 10:'tien over ' + UURWOORD[h], 20:'tien voor half ' + UURWOORD[v], 25:'vijf voor half ' + UURWOORD[v],
    35:'vijf over half ' + UURWOORD[v], 40:'tien over half ' + UURWOORD[v], 50:'tien voor ' + UURWOORD[v], 55:'vijf voor ' + UURWOORD[v]};
  return W[m];
}
const dagdeel = u => u < 12 ? "'s morgens" : u < 18 ? "'s middags" : "'s avonds";
const minTijd = x => digiT(Math.floor(x / 60) % 24, ((x % 60) + 60) % 60);

/* ===== D ===== */
T('B-GET-D1', 'bget_d1_verpakking', R => {
  const p = R.kies([['Op een fles water staat: 1,5', 'l', ['kg', 'm', 'ml']], ['Op een pak bloem staat: 1', 'kg', ['l', 'm', 'g']], ['Op een blikje cola staat: 33', 'cl', ['kg', 'cm', 'l']],
    ['Op een tube tandpasta staat: 75', 'ml', ['l', 'kg', 'mm']], ['Op een zak chips staat: 200', 'g', ['kg', 'l', 'cm']], ['Op een rol keukenpapier staat: 12', 'm', ['kg', 'l', 'mm']],
    ['Op een pot choco staat: 400', 'g', ['l', 'kg', 'cm']], ['Op een fles olie staat: 75', 'cl', ['kg', 'l', 'dm']]]);
  return {q:`${p[0]} …\nWelke eenheid past op de puntjes?`, o:keuzes(p[1], p[2]), u:`${p[0]} ${p[1]}.`};
});
T('B-GET-D2', 'bget_d2_meten', R => {
  const p = R.kies([['de massa van een zak aardappelen', 'kg', ['l', 'm', 'min']], ['de inhoud van een emmer', 'l', ['kg', 'm', 'm²']], ['de lengte van een tafel', 'm', ['l', 'kg', 'm²']],
    ['de oppervlakte van een kamer', 'm²', ['m', 'l', 'kg']], ['de duur van een voetbalmatch', 'min', ['m', 'kg', 'l']], ['de massa van een brief', 'g', ['cm', 'ml', 's']],
    ['de inhoud van een glas', 'cl', ['cm', 'g', 'cm²']], ['de afstand tussen twee steden', 'km', ['kg', 'l', 'km²']]]);
  return {q:`Welke eenheid gebruik je voor ${p[0]}?`, o:keuzes(p[1], p[2]), u:`Voor ${p[0]} gebruik je ${p[1]}.`};
});
T('B-GET-D3', 'bget_d3_hoeveel', R => {
  const p = R.kies([['Hoe lang is een bus ongeveer?', '12 m', ['1,2 m', '120 m', '12 cm']], ['Hoe hoog is een tafel ongeveer?', '75 cm', ['75 mm', '7,5 m', '75 m']],
    ['Hoeveel past er ongeveer in een gieter?', '10 l', ['10 ml', '1 000 l', '10 cl']], ['Hoeveel past er ongeveer in een soeplepel?', '2 cl', ['2 l', '20 l', '2 hl']],
    ['Hoe lang is een potlood ongeveer?', '17 cm', ['17 mm', '17 m', '1,7 m']], ['Hoeveel past er ongeveer in een bad?', '150 l', ['15 l', '1,5 l', '150 ml']],
    ['Hoe breed is een deur ongeveer?', '90 cm', ['9 cm', '9 m', '90 m']]]);
  return {q:p[0], o:keuzes(p[1], p[2]), u:`${p[1]} is het enige antwoord dat past. De andere zijn veel te groot of veel te klein.`};
});
T('B-GET-D4', 'bget_d4_klok', R => {
  const soort = R.kies(['kwartier', 'halfuur', 'uur']), st = {kwartier:15, halfuur:30, uur:60}[soort];
  const u = R.int(8, 20); let m; do m = R.int(1, 59); while (m % st === 0 || Math.abs(m % st - st / 2) < 2);
  const t = u * 60 + m, r = Math.round(t / st) * st;
  return {q:`Het is ${digiT(u, m)}.\nRond af op ${soort === 'uur' ? 'het uur' : 'het ' + soort}.`,
    o:keuzes(minTijd(r), [minTijd(r + st), minTijd(r - st), minTijd(r + 5), minTijd(r - 5)]),
    u:`${digiT(u, m)} ligt tussen ${minTijd(Math.floor(t / st) * st)} en ${minTijd(Math.ceil(t / st) * st)}.\nHet dichtst bij ${minTijd(r)}.`};
});
T('B-GET-D5', 'bget_d5_analoog', R => {
  const u = R.int(13, 21), m = R.kies([5, 10, 15, 20, 25, 35, 40, 45, 50, 55]);
  return {q:`Het is ${dagdeel(u)}.\nHoe laat is het op de klok?`, fig:{t:'klok', u, m},
    o:keuzes(digiT(u, m), [digiT(u - 12, m), digiT(u + 1, m), digiT(u, (60 - m) % 60 || 30), digiT(u - 1, m)]),
    u:`De kleine wijzer staat bij ${u - 12}${m >= 30 ? ' (bijna ' + (u - 11) + ')' : ''}. De grote wijzer staat bij ${m / 5}: dat is ${m} minuten.\n${dagdeel(u)} is dat ${digiT(u, m)}.`};
});
T('B-GET-D5', 'bget_d5_woorden', R => {
  const u = R.int(7, 21), m = R.kies([15, 30, 45, 20, 40, 10, 50]);
  const fout = [digiT(u, (m + 30) % 60), digiT((u + 1) % 24, m), digiT(u - 1, m), digiT(u >= 12 ? u - 12 : u + 12, m)];
  return {q:`Je spreekt af om ${tijdWoord(u, m)} ${dagdeel(u)}.\nWelke digitale tijd is dat?`, o:keuzes(digiT(u, m), fout),
    u:`${tijdWoord(u, m)[0].toUpperCase() + tijdWoord(u, m).slice(1)} is ${m} minuten na ${u % 12 || 12} uur.\n${dagdeel(u)} is dat ${digiT(u, m)}.`};
});
T('B-GET-D5', 'bget_d5_digi', R => {
  const u = R.int(8, 22), m = R.kies([15, 30, 45, 10, 50, 20, 40]);
  const goed = tijdWoord(u, m), fout = [tijdWoord(u, (m + 30) % 60), tijdWoord((u + 1) % 24, m), tijdWoord(u - 1, m)];
  return {q:`De digitale klok wijst ${digiT(u, m)}.\nHoe zeg je die tijd?`, fig:{t:'digi', tijd:digiT(u, m)}, o:keuzes(goed, fout),
    u:`${digiT(u, m)} is ${m} minuten na ${u % 12 || 12} uur: ${goed}.`};
});
T('B-GET-D6', 'bget_d6_som', R => {
  const u = R.int(7, 20), m = R.int(0, 30), d = R.int(10, 59 - m);
  const p = R.kies([['De film begint om', 'De reclame duurt', 'Hoe laat begint de film echt?'], ['De bus vertrekt om', 'De rit duurt', 'Hoe laat komt de bus aan?'],
    ['De taart gaat in de oven om', 'Ze moet bakken', 'Hoe laat is de taart klaar?'], ['De training start om', 'De opwarming duurt', 'Hoe laat is de opwarming gedaan?']]);
  return {q:`${p[0]} ${digiT(u, m)}.\n${p[1]} ${d} minuten.\n${p[2]}`, velden:[veld(u, 'uur'), veld(m + d, 'min')], calc:false,
    u:`${digiT(u, m)} + ${d} minuten = ${digiT(u, m + d)}.`};
});
T('B-GET-D6', 'bget_d6_verschil', R => {
  const u = R.int(7, 20), m1 = R.int(0, 40), m2 = R.int(m1 + 5, 59);
  const p = R.kies([['De les begint om', 'en eindigt om', 'Hoeveel minuten duurt de les?'], ['Je vertrekt thuis om', 'en komt op school aan om', 'Hoeveel minuten ben je onderweg?'],
    ['De wasmachine start om', 'en stopt om', 'Hoeveel minuten duurt het wassen?']]);
  return {q:`${p[0]} ${digiT(u, m1)} ${p[1]} ${digiT(u, m2)}.\n${p[2]}`, velden:[veld(m2 - m1, 'minuten')], calc:false,
    u:`Van ${digiT(u, m1)} tot ${digiT(u, m2)}: ${m2} − ${m1} = ${m2 - m1} minuten.`};
});
T('B-GET-D7', 'bget_d7_procent', R => {
  const p = R.kies([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [1, 25], [1, 50]]);
  const pc = p[0] / p[1] * 100;
  return {q:`Schrijf als een procent.`, velden:[veld(pc, '%', `{{${p[0]}|${p[1]}}} =`)],
    u:`Maak de noemer 100: {{${p[0]}|${p[1]}}} = {{${f(pc)}|100}} = ${f(pc)} %.`};
});
T('B-GET-D7', 'bget_d7_klas', R => {
  const p = R.kies([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 10], [3, 10]]);
  const pc = p[0] / p[1] * 100, wat = R.kies(['van de leerlingen komt met de bus', 'van de klas eet warm op school', 'van de spelers is linksvoetig', 'van de bezoekers komt met de fiets']);
  return {q:`{{${p[0]}|${p[1]}}} ${wat}.\nHoeveel procent is dat?`, o:keuzes(f(pc) + ' %', [f(p[0] * 10) + ' %', f(p[1] * 10) + ' %', f(p[0] / p[1] * 10, 1) + ' %', f(100 - pc) + ' %', p[0] + p[1] + ' %']),
    u:`{{${p[0]}|${p[1]}}} = {{${f(pc)}|100}} = ${f(pc)} %.`};
});
T('B-GET-D8', 'bget_d8_geld', R => {
  const n = R.kies([2, 3, 4, 5]), t = n === 2 ? 1 : R.int(1, n - 1); if (ggd(t, n) > 1) return null;
  const tot = n * R.int(4, 15), uit = tot / n * t, wie = R.naam(), wat = R.kies(['een spel', 'kleren', 'een cadeau', 'een concertticket']);
  return {q:`${wie} heeft ${eur(tot)} gespaard.\n${wie} geeft {{${t}|${n}}} daarvan uit aan ${wat}.\nHoeveel geld heeft ${wie} nog?`, velden:[geld(tot - uit)],
    u:`{{${t}|${n}}} van ${eur(tot)} = ${eur(tot)} : ${n} × ${t} = ${eur(uit)}.\n${eur(tot)} − ${eur(uit)} = ${eur(tot - uit)}.`};
});
T('B-GET-D9', 'bget_d9_plus5', R => {
  const a = R.int(3, 9) * 10 + R.int(6, 9);
  const goed = `${a} + ${10 - a % 10} + ${5 - (10 - a % 10)}`;
  return {q:`Je rekent ${a} + 5 uit het hoofd.\nWelke werkwijze is juist?`,
    o:keuzes(goed, [`${a} + 10 − 4`, `${a} + 2 + 2`, `${a} − 5 + 10 + 1`]),
    u:`Maak eerst een tiental: ${a} + ${10 - a % 10} = ${a + 10 - a % 10}.\nDan de rest erbij: ${a + 10 - a % 10} + ${5 - (10 - a % 10)} = ${a + 5}.`};
});
T('B-GET-D10', 'bget_d10_weer', R => {
  const vals = R.schud([[`−${R.int(1, 9)} °C`, 'een negatief getal'], [`${R.int(2, 9)}0 %`, 'een procent'], [`{{${R.int(1, 3)}|${R.int(4, 9)}}}`, 'een breuk'], [String(R.int(12, 99)), 'een natuurlijk getal']]);
  const vr = R.kies(vals);
  const vk = vasteKeuze(vr[0], vals.map(v => v[0]));
  return {q:`Welk getal is ${vr[1]}?`, o:vk.o, volgorde:vk.volgorde,
    u:`${vr[0]} is ${vr[1]}.`};
});
T('B-GET-D11', 'bget_d11_steden', R => {
  const st = ['januari', 'februari', 'maart', 'april'], b = R.int(8, 60) * 100;
  const g = R.schud([b + R.int(10, 99), b * 10 + R.int(0, 99), b + R.int(100, 900), b - R.int(10, 99) * 10]);
  if (new Set(g).size < 4) return null;
  const s = st.map((n, i) => [n, g[i]]).sort((a, b) => a[1] - b[1]);
  return {q:`Het aantal bezoekers van het zwembad per maand.\nZet de maanden van weinig naar veel bezoekers.`, fig:{t:'tab', kop:['Maand', 'Bezoekers'], rijen:st.map((n, i) => [n, f(g[i])])},
    kaartjes:s.map(x => x[0]), u:`${s.map(x => x[0] + ' (' + f(x[1]) + ')').join(' &lt; ')}.\nVergelijk eerst het aantal cijfers, dan cijfer per cijfer van links.`};
});
T('B-GET-D11', 'bget_d11_grootste', R => {
  const b = R.int(1, 8) * 1000;
  const g = R.schud([b + R.int(100, 999), b * 10 + R.int(0, 99), b + R.int(10, 99) * 10, b * 10 - R.int(1, 99)]);
  if (new Set(g).size < 4) return null;
  const max = Math.max(...g);
  return {q:'Welk getal is het grootste?', o:keuzes(f(max), g.filter(x => x !== max).map(x => f(x))),
    u:`Het getal met de meeste cijfers is het grootst. Hebben ze evenveel cijfers, vergelijk dan van links naar rechts.\n${f(max)} is het grootste.`};
});

/* ===== C ===== */
T('B-GET-C1', 'bget_c1_procent', R => {
  const pc = R.kies([5, 8, 12, 25, 40, 65, 75, 3, 90, 15, 150, 120]);
  return {q:'Schrijf als een decimaal getal.', velden:[veld(pc / 100, '', `${pc} % =`)],
    u:`${pc} % = {{${pc}|100}} = ${pc} : 100 = ${f(pc / 100, 2)}.`};
});
T('B-GET-C1', 'bget_c1_breuk', R => {
  const p = R.kies([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [4, 5], [3, 10], [7, 10], [1, 20], [3, 25], [7, 50], [3, 2], [5, 4]]);
  return {q:`Een recept vraagt {{${p[0]}|${p[1]}}} liter melk.\nDe maatbeker toont een decimaal getal.\nHoeveel liter is dat als decimaal getal?`, velden:[veld(p[0] / p[1], 'liter')],
    u:`{{${p[0]}|${p[1]}}} = ${p[0]} : ${p[1]} = ${f(p[0] / p[1], 3)}.`};
});
T('B-GET-C2', 'bget_c2_afronden', R => {
  let x; do x = R.int(10, 999) / 10 + R.int(0, 9) / 100; while (Math.abs(x % 1 - 0.5) < 0.02);
  return {q:`Rond ${f(x)} af op de eenheid.`, velden:[veld(Math.round(x))],
    u:`Kijk naar het eerste cijfer na de komma. Is het 5 of meer, dan rond je naar boven af.\n${f(x)} ≈ ${Math.round(x)}.`};
});
T('B-GET-C2', 'bget_c2_rekening', R => {
  let x; do x = R.int(800, 9900) / 100; while (Math.abs(x % 1 - 0.5) < 0.03);
  const wat = R.kies(['De rekening in het restaurant is', 'De boodschappen kosten', 'Je tankt voor', 'De nieuwe jas kost']);
  return {q:`${wat} ${eur(x)}.\nRond af op de euro.`, velden:[geld(Math.round(x))], calc:false,
    u:`Kijk naar de cent: ${eur(x)} ligt dichter bij ${eur(Math.round(x))}.`};
});
T('B-GET-C3', 'bget_c3_wachten', R => {
  const u = R.int(8, 16), m = R.int(0, 11) * 5, d = R.int(8, 55), t = u * 60 + m + d;
  const p = R.kies([['De bus vertrekt om', 'Hoeveel minuten moet je nog wachten?'], ['De les eindigt om', 'Hoeveel minuten duurt de les nog?'], ['De winkel sluit om', 'Hoeveel minuten is de winkel nog open?']]);
  return {q:`De klok toont hoe laat het nu is. Het is overdag.\n${p[0]} ${minTijd(t)}.\n${p[1]}`, fig:{t:'klok', u, m}, velden:[veld(d, 'minuten')], calc:false,
    u:`Op de klok is het ${digiT(u, m)}.\nVan ${digiT(u, m)} tot ${minTijd(t)} is ${d} minuten.`};
});
T('B-GET-C3', 'bget_c3_bezig', R => {
  const u = R.int(9, 17), ms = R.int(0, 40), d = R.int(10, 50), t = u * 60 + ms + d, eu = Math.floor(t / 60), em = t % 60;
  if (em % 5) return null;
  const p = R.kies(['De match begon om', 'De film begon om', 'Het examen begon om']);
  return {q:`${p} ${digiT(u, ms)}.\nNu toont de klok deze tijd. Het is overdag.\nHoeveel minuten is het al bezig?`, fig:{t:'klok', u:eu, m:em}, velden:[veld(d, 'minuten')], calc:false,
    u:`Op de klok is het ${digiT(eu, em)}.\nVan ${digiT(u, ms)} tot ${digiT(eu, em)} is ${d} minuten.`};
});
T('B-GET-C4', 'bget_c4_winkel', R => {
  const p = R.kies([['brood', 'broden'], ['fles melk', 'flessen melk'], ['pak koekjes', 'pakken koekjes'], ['schrift', 'schriften']]);
  const pr = R.int(85, 395) / 100, n = R.int(3, 8);
  return {q:`Eén ${p[0]} kost ${eur(pr)}.\nJe koopt ${n} ${p[1]}.\nHoeveel betaal je?`, velden:[geld(pr * n)], u:`${n} × ${eur(pr)} = ${eur(pr * n)}.`};
});
T('B-GET-C4', 'bget_c4_lengte', R => {
  const a = R.int(55, 180) / 100, b = R.int(30, 120) / 100;
  const L = R.int(4, 9);
  if (a + b >= L) return null;
  return {q:`Een plank is ${L} m lang.\nJe zaagt er een stuk van ${f(a)} m af en een stuk van ${f(b)} m.\nHoe lang is de plank die overblijft?`, velden:[veld(L - a - b, 'm')],
    u:`${f(a)} + ${f(b)} = ${f(a + b)} m.\n${L} − ${f(a + b)} = ${f(L - a - b)} m.`};
});
T('B-GET-C5', 'bget_c5_welke', R => {
  const p = R.kies([[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [1, 3], [4, 5], [5, 6]]), k = R.int(2, 5);
  const goed = `{{${p[0] * k}|${p[1] * k}}}`;
  return {q:`Welke breuk is gelijk aan {{${p[0]}|${p[1]}}}?`, o:keuzes(goed, [`{{${p[0] * k}|${p[1] + k}}}`, `{{${p[0] + k}|${p[1] + k}}}`, `{{${p[1] * k}|${p[0] * k}}}`, `{{${p[0] * k}|${p[1] * k + 1}}}`]),
    u:`Vermenigvuldig teller en noemer met hetzelfde getal: {{${p[0]}|${p[1]}}} = {{${p[0]} × ${k}|${p[1]} × ${k}}} = ${goed}.`};
});
T('B-GET-C5', 'bget_c5_aanvullen', R => {
  const p = R.kies([[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [1, 4], [5, 6], [3, 8]]), k = R.int(2, 6);
  return {q:`Vul aan zodat de breuken gelijk zijn.\n{{${p[0]}|${p[1]}}} = {{…|${p[1] * k}}}`, velden:[veld(p[0] * k, '', 'teller =')],
    u:`De noemer ${p[1]} wordt ${p[1] * k}: dat is × ${k}.\nDe teller ook × ${k}: ${p[0]} × ${k} = ${p[0] * k}.`};
});
T('B-GET-C6', 'bget_c6_kwart', R => {
  const p = R.kies([[50, ': 2', ['× 2', ': 50', ': 5']], [25, ': 4', ['× 4', ': 25', ': 2']], [10, ': 10', ['× 10', ': 100', ': 1']], [20, ': 5', ['× 5', ': 20', ': 2']]]);
  const g = p[0] === 25 ? R.int(3, 25) * 4 : p[0] === 20 ? R.int(3, 30) * 5 : R.int(4, 40) * 10;
  return {q:`Je rekent ${p[0]} % van ${eur(g)} uit het hoofd.\nWat doe je?`, o:keuzes(`${f(g)} ${p[1]}`, p[2].map(x => `${f(g)} ${x}`)),
    u:`${p[0]} % = {{${p[0]}|100}} = {{1|${100 / p[0]}}}. Dus ${f(g)} ${p[1]} = ${f(g * p[0] / 100)}.`};
});
T('B-GET-C7', 'bget_c7_temperatuur', R => {
  const st = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'];
  const t = st.map(() => R.int(-60, 90) / 10);
  if (new Set(t).size < 5 || t.filter(x => x < 0).length < 2) return null;
  const s = st.map((n, i) => [n, t[i]]).sort((a, b) => a[1] - b[1]);
  return {q:`De temperatuur om 8 uur 's morgens, in een week in maart.\nZet de dagen van koud naar warm.`, fig:{t:'tab', kop:['Dag', 'Temperatuur'], rijen:st.map((n, i) => [n, minT(t[i]) + ' °C'])},
    kaartjes:s.map(x => x[0]), u:`Hoe verder onder 0, hoe kouder.\n${s.map(x => x[0] + ' (' + minT(x[1]) + ' °C)').join(' &lt; ')}.`};
});
T('B-GET-C8', 'bget_c8_kassa', R => {
  const p = [R.int(2, 9) + 0.95, R.int(10, 29) + 0.99, R.int(1, 6) + R.kies([0.05, 0.10, 0.15])].map(x => +x.toFixed(2));
  const sch = p.map(x => Math.round(x)), tot = sch.reduce((a, b) => a + b, 0);
  return {q:`In je winkelmand zit: ${p.map(eur).join(', ')}.\nOngeveer hoeveel moet je betalen?`, calc:false,
    o:keuzes(eur(tot), [eur(tot + 10), eur(tot - 10), eur(tot * 2), eur(Math.round(tot / 10))]),
    u:`Rond elk bedrag af op de euro: ${sch.map(eur).join(' + ')} = ${eur(tot)}.`};
});
T('B-GET-C9', 'bget_c9_minuten', R => {
  const u = R.int(1, 4), m = R.kies([10, 15, 20, 30, 40, 45, 50]), naar = R.kies([true, false]);
  if (naar) return {q:`Hoeveel minuten zijn ${u} uur en ${m} minuten?`, velden:[veld(u * 60 + m, 'minuten')], calc:false, u:`${u} × 60 = ${u * 60}. ${u * 60} + ${m} = ${u * 60 + m} minuten.`};
  return {q:`Een film duurt ${u * 60 + m} minuten.\nHoeveel uur en minuten is dat?`, velden:[veld(u, 'uur'), veld(m, 'min')], calc:false,
    u:`${u * 60 + m} = ${u} × 60 + ${m}. Dat is ${u} uur en ${m} minuten.`};
});

/* ===== B ===== */
T('B-GET-B4', 'bget_b4_verhouding', R => {
  const tot = R.kies([20, 25, 50, 200, 40]), deel = R.int(1, tot - 1), pc = deel / tot * 100;
  if (Math.abs(pc - Math.round(pc)) > 1e-9) return null;
  const wat = R.kies([['vragen van de toets', 'had je juist'], ['leerlingen', 'sporten in een club'], ['zitjes in de bus', 'zijn bezet']]);
  return {q:`${deel} op ${tot} ${wat[0]} ${wat[1]}.\nHoeveel procent is dat?`, velden:[veld(pc, '%')],
    u:`${deel} op ${tot} = {{${deel}|${tot}}} = ${deel} : ${tot} = ${f(deel / tot, 2)} = ${f(pc)} %.`};
});
T('B-GET-B8', 'bget_b8_boodschappen', R => {
  const a = R.int(2, 4), pa = R.int(110, 390) / 100, b = R.int(2, 6), pb = R.int(45, 180) / 100, korting = R.kies([0, 1, 2, 5]);
  const tot = a * pa + b * pb - korting;
  return {q:`Je koopt ${a} pakken sap van ${eur(pa)} en ${b} bananen van ${eur(pb)}.\n${korting ? `Je hebt een bon van ${eur(korting)} korting.\n` : ''}Hoeveel betaal je?`, velden:[geld(tot)],
    u:`${a} × ${eur(pa)} = ${eur(a * pa)}.\n${b} × ${eur(pb)} = ${eur(b * pb)}.\n${eur(a * pa)} + ${eur(b * pb)}${korting ? ' − ' + eur(korting) : ''} = ${eur(tot)}.`};
});
T('B-GET-B8', 'bget_b8_temperatuur', R => {
  const t0 = R.int(-8, 4), op = R.int(3, 12), af = R.int(2, 9), t1 = t0 + op - af;
  return {q:`Om 6 uur is het ${minT(t0)} °C.\nTot de middag stijgt de temperatuur ${op} °C.\nTegen de avond daalt ze ${af} °C.\nHoeveel graden is het 's avonds?`, velden:[veld(t1, '°C')],
    u:`${minT(t0)} + ${op} = ${minT(t0 + op)}.\n${minT(t0 + op)} − ${af} = ${minT(t1)} °C.`};
});
T('B-GET-B10', 'bget_b10_maal100', R => {
  const m = R.kies([10, 100, 1000]), x = R.int(11, 999) / R.kies([10, 100]);
  const n = String(m).length - 1, goed = `De komma ${n} ${n === 1 ? 'plaats' : 'plaatsen'} naar rechts`;
  return {q:`Je rekent ${f(x)} × ${f(m)} uit het hoofd.\nWat doe je?`,
    o:keuzes(goed, [`De komma ${n} ${n === 1 ? 'plaats' : 'plaatsen'} naar links`, `${n} keer een 0 achteraan schrijven: ${f(x)}${'0'.repeat(n)}`, `De komma ${n + 1} plaatsen naar rechts`]),
    u:`Bij × ${f(m)} wordt het getal ${f(m)} keer groter: de komma gaat ${n} ${n === 1 ? 'plaats' : 'plaatsen'} naar rechts.\n${f(x)} × ${f(m)} = ${f(x * m)}.`};
});

/* ===== A ===== */
T('B-GET-A4', 'bget_a4_tweeklokken', R => {
  const u1 = R.int(1, 9), m1 = R.int(0, 11) * 5, d = R.int(25, 170), t = u1 * 60 + m1 + d, u2 = Math.floor(t / 60), m2 = t % 60;
  if (u2 > 11) return null;
  const wat = R.kies(['Een wandeling', 'Een fietstocht', 'Een bezoek aan het museum']);
  return {q:`${wat} begint en eindigt op de tijden van de klokken.\nHoe lang duurt het?`, fig:{t:'klok', klokken:[{u:u1, m:m1, l:'begin'}, {u:u2, m:m2, l:'einde'}]},
    velden:[veld(Math.floor(d / 60), 'uur'), veld(d % 60, 'min')], calc:false,
    u:`Begin: ${u1}.${pad2(m1)} uur. Einde: ${u2}.${pad2(m2)} uur.\nVan ${u1}.${pad2(m1)} tot ${u2}.${pad2(m2)} is ${duurT(d)}.`};
});
T('B-GET-A5', 'bget_a5_avond', R => {
  const u = R.int(13, 23), m = R.int(1, 11) * 5 - R.kies([0, 0, 2, 3]);
  const wat = u < 18 ? "Het is 's middags." : "Het is 's avonds.";
  return {q:`${wat}\nSchrijf de tijd van de klok digitaal.`, fig:{t:'klok', u, m}, velden:[veld(u, 'uur'), veld(m, 'min')], calc:false,
    u:`De kleine wijzer staat ${m >= 30 ? 'tussen ' + (u - 12) + ' en ' + (u - 11) : 'net na ' + (u - 12)}: ${u - 12} uur. De grote wijzer staat op ${m} minuten.\n${wat.replace('Het is ', '').replace('.', '')} komt er 12 uur bij: ${digiT(u, m)}.`};
});
T('B-GET-A8', 'bget_a8_maal9', R => {
  const k = R.kies([[9, 10, 1], [99, 100, 1], [999, 1000, 1]]), x = R.int(12, 86);
  if (R.int(0, 1)) {
    return {q:`Je rekent ${x} × ${k[0]} uit het hoofd.\nWelke werkwijze is juist?`,
      o:keuzes(`${x} × ${f(k[1])} − ${x}`, [`${x} × ${f(k[1])} − ${k[0]}`, `${x} × ${f(k[1])} − 1`, `${x} × ${f(k[1])} + ${x}`]),
      u:`${k[0]} = ${f(k[1])} − 1. Dus ${x} × ${k[0]} = ${x} × ${f(k[1])} − ${x} × 1 = ${f(x * k[1])} − ${x} = ${f(x * k[0])}.`};
  }
  const d = R.kies([[0.1, 10], [0.01, 100], [0.001, 1000]]);
  return {q:`Je rekent ${x} : ${f(d[0], 3)} uit het hoofd.\nWelke werkwijze is juist?`,
    o:keuzes(`${x} × ${f(d[1])}`, [`${x} : ${f(d[1])}`, `${x} × ${f(d[0], 3)}`, `${x} × ${f(d[1] * 10)}`]),
    u:`Delen door ${f(d[0], 3)} is hetzelfde als vermenigvuldigen met ${f(d[1])}.\n${x} × ${f(d[1])} = ${f(x * d[1])}.`};
});
T('B-GET-A10', 'bget_a10_verband', R => {
  const p = R.kies([['m', 'cm', 100, 'groter'], ['kg', 'g', 1000, 'groter'], ['l', 'cl', 100, 'groter'], ['cm', 'm', 100, 'kleiner'], ['g', 'kg', 1000, 'kleiner'], ['ml', 'l', 1000, 'kleiner'], ['km', 'm', 1000, 'groter']]);
  const x = R.int(12, 95) / 10, y = p[3] === 'groter' ? x * p[2] : x / p[2];
  return {q:`Je zet ${f(x)} ${p[0]} om naar ${p[1]}.\nWat gebeurt er met het getal?`,
    o:keuzes(`Het getal wordt ${f(p[2])} keer ${p[3]}.`, [`Het getal wordt ${f(p[2])} keer ${p[3] === 'groter' ? 'kleiner' : 'groter'}.`, `Het getal blijft hetzelfde.`, `Het getal wordt ${f(p[2] / 10)} keer ${p[3]}.`]),
    u:`${p[1]} is een ${p[3] === 'groter' ? 'kleinere' : 'grotere'} eenheid dan ${p[0]}. Je hebt er dus ${p[3] === 'groter' ? 'meer' : 'minder'} van nodig.\n${f(x)} ${p[0]} = ${f(y, 4)} ${p[1]}: het getal wordt ${f(p[2])} keer ${p[3]}.`};
});

WOORDEN.push(['maatbeker', 'Een beker met streepjes om af te meten hoeveel je erin doet.'],
  ['winkelmand', 'Een mand waarin je de dingen legt die je in de winkel koopt.'], ['opwarming', 'Rustige oefeningen voor de training, om je spieren klaar te maken.'],
  ['linksvoetig', 'Iemand die het liefst met de linkervoet tegen de bal trapt.'], ['bespaar', 'Je geeft minder geld uit.'],
  ['beurt', 'Eén keer dat je mag gaan, bijvoorbeeld één keer zwemmen.'], ['vaste prijs', 'Een bedrag dat je altijd betaalt, hoe lang je ook huurt.'],
  ['ritten', 'Keren dat je met de auto of wagen ergens naartoe rijdt.']);
/* ---------- Meetkundige objecten en relaties (dieptethema, B-stroom, 2B) ----------
   Leeswijzer: D "meestal in een context", C tot A "zowel met als zonder een context".
   Gedeeld met 2A (koppel): vakken op een rooster, figuren benoemen, hoeken meten met de gradenboog, ligging van ribben in een balk. */
koppel('B', `
mor_d3_vak=B-MOR-D3 mor_d3_plan=B-MOR-D3 mor_c1_soort=B-MOR-C1 mor_c3_net=B-MOR-C2 mor_b1_ruimte=B-MOR-B1 mor_b3_scherp=B-MOR-B3
mor_d2_meten=B-MOR-B4 mor_b4_vlak=B-MOR-B5 mor_b6_vervolledig=B-MOR-B6 mor_b7_vakken=B-MOR-B7
mor_a1_stomp=B-MOR-A1 mor_a7_hoek=B-MOR-A2 mor_a3_ligging=B-MOR-A3 mor_c2_evenwijdig=B-MOR-A3 t_klikcoord=B-MOR-A4
`);

/* hoek met hoekpunt v en grootte a (graden), eerste been naar rechts; rechte hoek met een losse L */
function hoekSvg(a, draai) {
  const v = [150, 150], r = 120, d = (draai || 0) * Math.PI / 180;
  const p1 = [v[0] + r * Math.cos(-d), v[1] + r * Math.sin(-d)], p2 = [v[0] + r * Math.cos(-d - a * Math.PI / 180), v[1] + r * Math.sin(-d - a * Math.PI / 180)];
  let s = lijnS(v, p1) + lijnS(v, p2) + '<circle cx="' + v[0] + '" cy="' + v[1] + '" r="3.5" fill="var(--inkt)"/>';
  s += a === 90 ? rhoek(v, p1, p2, 4, 14) : boogje(v, p1, p2, 30);
  return fig('0 0 300 200', s, 'Een hoek.');
}

/* ===== D ===== */
T('B-MOR-D1', 'bmor_d1_bol', R => {
  const k = kiesVorm(R, 'bol', ['cirkel', 'cilinder', 'kegel', 'kubus', 'piramide']);
  return {q:'Welke figuur is een bol?', fig:k.fig, o:k.o, volgorde:k.volgorde, u:`Figuur ${k.letter} is een bol: rond in alle richtingen, zoals een bal. Een cirkel is plat.`};
});
T('B-MOR-D1', 'bmor_d1_voorwerp', R => {
  const p = R.kies([['een voetbal', ['een blikje frisdrank', 'een dobbelsteen', 'een ijshoorntje']], ['een knikker', ['een pak melk', 'een rol koekjes', 'een feesthoedje']],
    ['een sinaasappel', ['een schoenendoos', 'een kaars', 'een tent']], ['een tennisbal', ['een suikerklontje', 'een buis', 'een verkeerskegel']]]);
  return {q:'Welk voorwerp heeft de vorm van een bol?', o:keuzes(p[0], p[1]), u:`${p[0][0].toUpperCase() + p[0].slice(1)} is rond in alle richtingen: een bol.`};
});
T('B-MOR-D2', 'bmor_d2_lat', R => {
  const b = R.int(21, 95) / 10;
  return {q:'Het lijnstuk [AB] ligt langs een lat. A staat bij 0.\nHoe lang is [AB]?', fig:liniaal(0, b), velden:[veld(b, 'cm')], calc:false,
    u:`A staat bij 0. B staat bij ${f(b)} cm.\n[AB] is ${f(b)} cm lang.`};
});
T('B-MOR-D2', 'bmor_d2_mm', R => {
  const b = R.int(15, 92) / 10;
  return {q:'Hoe lang is het lijnstuk [AB] in mm?', fig:liniaal(0, b), velden:[veld(Math.round(b * 10), 'mm')], calc:false,
    u:`B staat bij ${f(b)} cm. 1 cm = 10 mm.\n${f(b)} cm = ${Math.round(b * 10)} mm.`};
});

/* ===== C ===== */
T('B-MOR-C1', 'bmor_c1_hoek', R => {
  const p = R.kies([['scherpe hoek', R.int(25, 75)], ['rechte hoek', 90], ['stompe hoek', R.int(105, 165)], ['gestrekte hoek', 180]]);
  return {q:'Wat voor hoek is dit?', fig:hoekSvg(p[1], p[1] === 180 ? 0 : R.int(0, 3) * 10), o:vasteKeuze(p[0], ['scherpe hoek', 'rechte hoek', 'stompe hoek', 'gestrekte hoek']).o,
    volgorde:vasteKeuze(p[0], ['scherpe hoek', 'rechte hoek', 'stompe hoek', 'gestrekte hoek']).volgorde,
    u:'Scherp: kleiner dan 90°. Recht: 90° (met het teken L). Stomp: tussen 90° en 180°. Gestrekt: 180°, de benen liggen op één rechte.\nDit is een ' + p[0] + '.'};
});
T('B-MOR-C1', 'bmor_c1_vierhoek', R => {
  const juist = R.kies(['trapezium', 'parallellogram', 'ruit', 'rechthoek', 'vierkant']);
  const k = kiesVorm(R, juist, ['trapezium', 'parallellogram', 'ruit', 'rechthoek', 'vierkant', 'vlieger']);
  return {q:`Welke figuur is een ${juist}?`, fig:k.fig, o:k.o, volgorde:k.volgorde, u:`Figuur ${k.letter} is een ${juist}.`};
});
T('B-MOR-C2', 'bmor_c2_voorwerp', R => {
  const p = R.kies([['Een blikje frisdrank', 'cilinder'], ['Een dobbelsteen', 'kubus'], ['Een schoenendoos', 'balk'], ['Een ijshoorntje', 'kegel'], ['Een tent met vier zijwanden', 'piramide'], ['Een basketbal', 'bol']]);
  const k = kiesVorm(R, p[1], RUIMTE);
  return {q:`${p[0]} heeft de vorm van een ruimtefiguur.\nWelke tekening past?`, fig:k.fig, o:k.o, volgorde:k.volgorde, u:`${p[0]} heeft de vorm van een ${p[1]}: figuur ${k.letter}.`};
});
T('B-MOR-C3', 'bmor_c3_vierhoek', R => {
  const p = R.kies([['vierkant', 'Een vierhoek met vier rechte hoeken en vier even lange zijden.'], ['rechthoek', 'Een vierhoek met vier rechte hoeken. Twee zijden zijn langer dan de andere twee.'],
    ['ruit', 'Een vierhoek met vier even lange zijden, maar zonder rechte hoeken.'], ['trapezium', 'Een vierhoek met maar één paar evenwijdige zijden.'],
    ['parallellogram', 'Een vierhoek met twee paar evenwijdige zijden, zonder rechte hoeken. De zijden zijn niet allemaal even lang.']]);
  const k = kiesVorm(R, p[0], ['vierkant', 'rechthoek', 'ruit', 'trapezium', 'parallellogram', 'vlieger']);
  return {q:`${p[1]}\nWelke figuur past bij deze omschrijving?`, fig:k.fig, o:k.o, volgorde:k.volgorde, u:`${p[1]}\nDat is een ${p[0]}: figuur ${k.letter}.`};
});
T('B-MOR-C3', 'bmor_c3_driehoek', R => {
  const p = R.kies([['rechthoekige driehoek', 'Een driehoek met een rechte hoek.'], ['gelijkzijdige driehoek', 'Een driehoek met drie even lange zijden.'],
    ['gelijkbenige driehoek', 'Een driehoek met twee even lange zijden. De derde zijde is korter.'], ['stomphoekige driehoek', 'Een driehoek met een stompe hoek.']]);
  const k = kiesVorm(R, p[0], ['rechthoekige driehoek', 'gelijkzijdige driehoek', 'gelijkbenige driehoek', 'stomphoekige driehoek', 'scherphoekige driehoek']);
  return {q:`${p[1]}\nWelke figuur past bij deze omschrijving?`, fig:k.fig, o:k.o, volgorde:k.volgorde, u:`${p[1]}\nDat is een ${p[0]}: figuur ${k.letter}.`};
});

/* ===== B ===== */
T('B-MOR-B2', 'bmor_b2_rechten', R => {
  const soort = R.kies(['evenwijdig', 'loodrecht', 'snijdend, maar niet loodrecht']);
  const h = R.int(-25, 25) * Math.PI / 180, c = [150, 100], L = 130;
  const ra = [Math.cos(h), Math.sin(h)];
  let s = '', a1, a2, b1, b2;
  if (soort === 'evenwijdig') {
    const n = [-ra[1] * 40, ra[0] * 40];
    a1 = [c[0] - L * ra[0] - n[0], c[1] - L * ra[1] - n[1]]; a2 = [c[0] + L * ra[0] - n[0], c[1] + L * ra[1] - n[1]];
    b1 = [c[0] - L * ra[0] + n[0], c[1] - L * ra[1] + n[1]]; b2 = [c[0] + L * ra[0] + n[0], c[1] + L * ra[1] + n[1]];
    s = lijnS(a1, a2) + lijnS(b1, b2);
  } else {
    const g = soort === 'loodrecht' ? 90 : R.kies([50, 60, 120, 130]), hb = h + g * Math.PI / 180, rb = [Math.cos(hb), Math.sin(hb)];
    a1 = [c[0] - L * ra[0], c[1] - L * ra[1]]; a2 = [c[0] + L * ra[0], c[1] + L * ra[1]];
    b1 = [c[0] - 85 * rb[0], c[1] - 85 * rb[1]]; b2 = [c[0] + 85 * rb[0], c[1] + 85 * rb[1]];
    s = lijnS(a1, a2) + lijnS(b1, b2) + (soort === 'loodrecht' ? rhoek(c, a2, b2, 4, 14) : '');
  }
  s += tekst([a2[0] - 4, a2[1] - 8], '<tspan font-style="italic" font-weight="700">a</tspan>') + tekst([b2[0] + 10, b2[1] + 4], '<tspan font-style="italic" font-weight="700">b</tspan>');
  const lijst = ['evenwijdig', 'loodrecht', 'snijdend, maar niet loodrecht'], vk = vasteKeuze(soort, lijst);
  return {q:'Hoe liggen de rechten a en b ten opzichte van elkaar?', fig:fig('-10 -10 320 220', s, 'Twee rechten a en b.'), o:vk.o, volgorde:vk.volgorde,
    u:'Evenwijdig: ze snijden elkaar nooit. Loodrecht: ze snijden elkaar onder een rechte hoek (teken L). Anders zijn ze snijdend.\nHier: ' + soort + '.'};
});

/* ===== A ===== */
T('B-MOR-A4', 'bmor_a4_aflezen', R => {
  const x = R.int(1, 5), y = R.int(1, 5), l = R.kies(['P', 'Q', 'R', 'K']);
  return {q:`Wat zijn de coördinaten van punt ${l}?`, fig:{t:'rooster', max:6, punten:[{x, y, l}]}, velden:[veld(x, '', 'x ='), veld(y, '', 'y =')], calc:false,
    u:`Vanuit de oorsprong ga je ${x} naar rechts: x = ${x}. Dan ${y} naar boven: y = ${y}.\n${l}(${x}, ${y}). Eerst x, dan y.`};
});
/* ---------- Omtrek, oppervlakte en inhoud (dieptethema, B-stroom, 2B) ----------
   Leeswijzer: "met gegeven formularium". Zoals op de toets staat naast de vraag een kader met enkel de formules die nodig zijn (fk).
   Bij vragen over het herkennen van een formule (D1, C2) staat er geen kader: dat zou het antwoord verklappen. */
const FK = {
  omtrekR:'omtrek rechthoek = 2 × (lengte + breedte)', oppR:'oppervlakte rechthoek = lengte × breedte',
  omtrekV:'omtrek vierkant = 4 × zijde', oppV:'oppervlakte vierkant = zijde × zijde',
  omtrekVh:'omtrek vierhoek = som van de lengtes van de zijden', omtrekD:'omtrek driehoek = som van de lengtes van de zijden',
  oppD:'oppervlakte driehoek = {{basis × hoogte|2}}', omtrekC:'omtrek cirkel = 2 × π × straal', oppC:'oppervlakte cirkel = π × straal × straal', pi:'π ≈ 3,14',
  inhB:'inhoud balk = lengte × breedte × hoogte', inhK:'inhoud kubus = ribbe × ribbe × ribbe'
};
koppel('B', `
ooi_d2_formule=B-OOI-D1 ooi_d2_kiezen=B-OOI-D1 ooi_c2_omtrek=B-OOI-C2 ooi_c3_driehoek=B-OOI-C3 ooi_c4_zijde=B-OOI-C4 ooi_c5_rechthoek=B-OOI-C5 ooi_c6_balk=B-OOI-C6
ooi_b1_kiezen=B-OOI-B1 ooi_b2_vierkantjes=B-OOI-B2 ooi_b2_cirkel=B-OOI-B2 ooi_b3_context=B-OOI-B3 ooi_b4_figuur=B-OOI-B4 ooi_b5_zijde=B-OOI-B5 ooi_b6_balk=B-OOI-B6 ooi_b7_ribbe=B-OOI-B7
ooi_a1_zonder=B-OOI-A1 ooi_a4_zijde=B-OOI-A4 ooi_a5_hoogte=B-OOI-A5 ooi_a7_inhoud=B-OOI-A7
`);
calcB('ooi_c3_driehoek ooi_c4_zijde ooi_c5_rechthoek ooi_b2_vierkantjes ooi_b4_figuur ooi_b5_zijde ooi_a4_zijde', 'e');
fkB('ooi_c3_driehoek', [FK.omtrekD]); fkB('ooi_c4_zijde', [FK.omtrekD]); fkB('ooi_c5_rechthoek', [FK.oppR]); fkB('ooi_c6_balk', [FK.inhB]);
fkB('ooi_b2_vierkantjes', [FK.omtrekVh]); fkB('ooi_b2_cirkel', [FK.omtrekC, FK.pi]); fkB('ooi_b3_context', [FK.oppR]);
fkB('ooi_b4_figuur', [FK.oppD, FK.oppV, FK.oppC, FK.pi]); fkB('ooi_b5_zijde', [FK.omtrekR, FK.oppR, FK.omtrekV, FK.oppV]); fkB('ooi_b6_balk', [FK.inhB]); fkB('ooi_b7_ribbe', [FK.inhB]);
fkB('ooi_a1_zonder', [FK.oppD, FK.oppV, FK.oppC, FK.pi]); fkB('ooi_a4_zijde', [FK.omtrekR]); fkB('ooi_a5_hoogte', [FK.oppD, FK.omtrekD]); fkB('ooi_a7_inhoud', [FK.inhB, FK.inhK]);

/* ===== D ===== */
T('B-OOI-D1', 'booi_d1_doos', R => {
  const p = R.kies([['een schoenendoos', 'lengte', 'breedte', 'hoogte'], ['een aquarium', 'lengte', 'breedte', 'hoogte'], ['een zandbak', 'lengte', 'breedte', 'diepte']]);
  return {q:`Je wilt weten hoeveel er in ${p[0]} past.\nWelke formule gebruik je?`,
    o:keuzes(`${p[1]} × ${p[2]} × ${p[3]}`, [`${p[1]} + ${p[2]} + ${p[3]}`, `${p[1]} × ${p[2]}`, `2 × (${p[1]} + ${p[2]})`]),
    u:`Hoeveel er in een balk past, is de inhoud.\ninhoud balk = ${p[1]} × ${p[2]} × ${p[3]}.`};
});

/* ===== C ===== */
T('B-OOI-C1', 'booi_c1_formule', R => {
  const r = R.schud([['rechthoek: 2 × (lengte + breedte)', 'omtrek'], ['rechthoek: lengte × breedte', 'oppervlakte'], ['vierkant: 4 × zijde', 'omtrek'], ['vierkant: zijde × zijde', 'oppervlakte'],
    ['driehoek: {{basis × hoogte|2}}', 'oppervlakte'], ['driehoek: som van de zijden', 'omtrek'], ['cirkel: 2 × π × straal', 'omtrek'], ['cirkel: π × straal × straal', 'oppervlakte']]).slice(0, 4);
  if (new Set(r.map(x => x[1])).size < 2) return null;
  return {q:'Berekent de formule de omtrek of de oppervlakte?\nKies telkens.', sym:{palet:['omtrek', 'oppervlakte'], rijen:r.map(x => ({voor:x[0] + ' →', na:'', w:x[1]}))},
    u:'Omtrek: je telt lengtes op (de rand). Oppervlakte: je vermenigvuldigt twee lengtes (cm × cm = cm²).'};
});
T('B-OOI-C1', 'booi_c1_wat', R => {
  const p = R.kies([['een kader rond een foto', 'omtrek'], ['een lint rond een taart', 'omtrek'], ['een hek rond een weide', 'omtrek'], ['een tafelkleed voor een tafel', 'oppervlakte'],
    ['tegels voor een terras', 'oppervlakte'], ['gras voor een rond grasperk', 'oppervlakte'], ['een rand rond een rond zwembad', 'omtrek'], ['behangpapier voor een muur', 'oppervlakte']]);
  const vk = vasteKeuze(p[1], ['omtrek', 'oppervlakte']);
  return {q:`Je koopt ${p[0]}.\nMoet je de omtrek of de oppervlakte kennen?`, o:vk.o, volgorde:vk.volgorde,
    u:p[1] === 'omtrek' ? 'Het gaat om de rand: de omtrek.' : 'Het gaat om het hele vlak dat je bedekt: de oppervlakte.'};
});
T('B-OOI-C2', 'booi_c2_kader', R => {
  const l = R.int(20, 60), b = R.int(10, l - 5);
  return {q:`Een fotokader is ${l} cm lang en ${b} cm breed.\nMet welke berekening vind je de omtrek?`, fig:rechthoekFig(l, b),
    o:keuzes(`2 × (${l} + ${b})`, [`${l} × ${b}`, `${l} + ${b}`, `4 × ${l}`, `2 × ${l} × ${b}`]),
    u:`omtrek rechthoek = 2 × (lengte + breedte) = 2 × (${l} + ${b}) = ${2 * (l + b)} cm.`};
});
T('B-OOI-C3', 'booi_c3_tuin', R => {
  const a = R.int(4, 12), b = R.int(4, 12), c = R.int(4, 12); if (a + b <= c || a + c <= b || b + c <= a) return null;
  return {q:`Een tuin heeft de vorm van een driehoek.\nDe zijden zijn ${a} m, ${b} m en ${c} m.\nHoeveel meter hek heb je nodig rond de tuin?`, fk:[FK.omtrekD], velden:[veld(a + b + c, 'm')],
    u:`omtrek driehoek = ${a} + ${b} + ${c} = ${a + b + c} m.`};
});
T('B-OOI-C4', 'booi_c4_lint', R => {
  const a = R.int(15, 40), b = R.int(15, 40), c = R.int(10, 40); if (a + b <= c || a + c <= b || b + c <= a) return null;
  return {q:`Een driehoekige vlag heeft een boord van ${a + b + c} cm lint.\nTwee zijden zijn ${a} cm en ${b} cm.\nHoe lang is de derde zijde?`, fk:[FK.omtrekD], velden:[veld(c, 'cm')],
    u:`De boord is de omtrek: ${a + b + c} cm.\n${a + b + c} − ${a} − ${b} = ${c} cm.`};
});
T('B-OOI-C5', 'booi_c5_kamer', R => {
  const l = R.int(30, 70) / 10, b = R.int(25, 50) / 10;
  if (l <= b) return null;
  return {q:`Een kamer is ${f(l)} m lang en ${f(b)} m breed.\nHoeveel m² vloer moet je leggen?`, fk:[FK.oppR], velden:[veld(l * b, 'm²')], fig:rechthoekFig(l, b, 'm'),
    u:`oppervlakte rechthoek = lengte × breedte = ${f(l)} × ${f(b)} = ${f(l * b)} m².`};
});
T('B-OOI-C6', 'booi_c6_doos', R => {
  const p = R.kies([['Een doos', 'cm'], ['Een koelbox', 'cm'], ['Een container', 'm']]), l = R.int(4, 30), b = R.int(3, 20), h = R.int(2, 15);
  return {q:`${p[0]} heeft de vorm van een balk.\nDe ribben zijn ${l} ${p[1]}, ${b} ${p[1]} en ${h} ${p[1]}.\nHoe groot is de inhoud?`, fk:[FK.inhB], velden:[veld(l * b * h, p[1] + '³')],
    u:`inhoud balk = ${l} × ${b} × ${h} = ${f(l * b * h)} ${p[1]}³.`};
});

/* ===== A ===== */
T('B-OOI-A2', 'booi_a2_lvorm', R => {
  const a = R.int(6, 12), b = R.int(5, 10), c = R.int(2, a - 2), d = R.int(2, b - 2);
  /* L-vorm: rechthoek a op b met een rechthoek c op d weggesneden in de hoek rechtsboven */
  const s0 = 18, W = a * s0, H = b * s0, x0 = 30, y0 = 20;
  const P = [[x0, y0 + H], [x0 + W, y0 + H], [x0 + W, y0 + d * s0], [x0 + W - c * s0, y0 + d * s0], [x0 + W - c * s0, y0], [x0, y0]];
  let s = veelhoek(P) + tekst([x0 + W / 2, y0 + H + 18], a + ' m') + tekst([x0 - 6, y0 + H / 2], b + ' m', 'end') + tekst([x0 + W - c * s0 / 2, y0 + d * s0 - 6], c + ' m') + tekst([x0 + W - c * s0 + 6, y0 + d * s0 / 2 + 4], d + ' m', 'start');
  s += rhoek(P[0], P[1], P[5]) + rhoek(P[1], P[2], P[0]);
  const opp = a * b - c * d, wat = R.kies(['opp', 'omtrek']);
  return {q:`Een terras heeft deze vorm.\n${wat === 'opp' ? 'Hoeveel m² tegels heb je nodig?' : 'Hoeveel meter boordsteen leg je rond het terras?'}`,
    fig:fig('0 0 ' + (W + x0 + 50) + ' ' + (H + y0 + 30), s, 'L-vormig terras.'), fk:wat === 'opp' ? [FK.oppR] : [FK.omtrekVh],
    velden:[veld(wat === 'opp' ? opp : 2 * (a + b), wat === 'opp' ? 'm²' : 'm')],
    u:wat === 'opp' ? `Grote rechthoek: ${a} × ${b} = ${a * b} m².\nHet stuk dat ontbreekt: ${c} × ${d} = ${c * d} m².\n${a * b} − ${c * d} = ${opp} m².`
      : `Tel alle zijden. De ontbrekende zijden: ${b} − ${d} = ${b - d} m en ${a} − ${c} = ${a - c} m.\n${a} + ${d} + ${c} + ${b - d} + ${a - c} + ${b} = ${2 * (a + b)} m.`};
});
T('B-OOI-A3', 'booi_a3_teveel', R => {
  const l = R.int(8, 20), b = R.int(4, l - 2), diag = Math.round(Math.hypot(l, b) * 10) / 10, prijs = R.stap(8, 25, 1), hoog = R.int(2, 3);
  return {q:`Een speelplein is een rechthoek van ${l} m op ${b} m.\nDe diagonaal is ${f(diag)} m.\nDe omheining is ${hoog} m hoog en kost ${eur(prijs)} per meter.\nBereken de oppervlakte van het speelplein.`,
    fk:[FK.oppR, FK.omtrekR], velden:[veld(l * b, 'm²')], tip:'Welke gegevens heb je nodig voor de oppervlakte?',
    u:`oppervlakte = lengte × breedte = ${l} × ${b} = ${l * b} m².\nDe diagonaal, de hoogte en de prijs heb je niet nodig.`};
});
T('B-OOI-A6', 'booi_a6_straal', R => {
  const r = R.int(2, 30), om = 2 * 3.14 * r;
  const wat = R.kies(['Een rond zwembad', 'Een ronde tafel', 'Een rond bloemperk']);
  return {q:`${wat} heeft een omtrek van ${f(om)} m.\nHoe groot is de straal?`, fk:[FK.omtrekC, FK.pi], velden:[veld(r, 'm')],
    u:`omtrek = 2 × π × straal, dus straal = omtrek : (2 × π).\n${f(om)} : (2 × 3,14) = ${f(om)} : 6,28 = ${r} m.`};
});
T('B-OOI-A7', 'booi_a7_bloembak', R => {
  const r = R.int(4, 9) * 10;
  return {q:`Een bloembak heeft de vorm van een kubus.\nDe ribbe is ${r} cm.\nHoeveel liter aarde past er in de bloembak?`, fk:[FK.inhK, '1 liter = 1 dm³ = 1 000 cm³'], velden:[veld(r * r * r / 1000, 'liter')],
    u:`inhoud = ${r} × ${r} × ${r} = ${f(r * r * r)} cm³.\n${f(r * r * r)} cm³ = ${f(r * r * r / 1000)} dm³ = ${f(r * r * r / 1000)} liter.`};
});
/* ---------- Statistiek (dieptethema, B-stroom, 2B) ----------
   Leeswijzer: "meestal in een functionele context". De doelen van 2B zijn bijna dezelfde als in 2A, zonder modus en variatiebreedte.
   Gedeeld met 2A (koppel); eigen 2B-vragen met contexten uit het dagelijks leven. */
koppel('B', `
sta_d2_aflezen=B-STA-D1 t_s1_staaflees=B-STA-D1 t_sm_lijnlees=B-STA-D1 sta_d3_totaal=B-STA-D2 t_sb2_totaal=B-STA-D2 sta_d4_aanvullen=B-STA-D3 t_sm_turven=B-STA-D3
sta_d5_associeer=B-STA-D4 sta_c1_ordenen=B-STA-C1 t_sm_meeste=B-STA-C1 sta_c2_staaf=B-STA-C2 sta_c3_lijn=B-STA-C3 sta_c4_waarde=B-STA-C4 sta_c5_werkwijze=B-STA-C5
sta_c6_mediaan=B-STA-C6 sta_c7_stappen=B-STA-C7 sta_b1_lijn=B-STA-B1 sta_b2_zonderas=B-STA-B2 sta_b3_hoogte=B-STA-B3 sta_b4_totaal=B-STA-B4 sta_b5_interpreteren=B-STA-B5
sta_b6_taart=B-STA-B6 sta_b7_gemiddelde=B-STA-B7 t_gemiddelde=B-STA-B7 sta_b8_nodig=B-STA-B8 sta_a1_dubbel=B-STA-A1 sta_a3_procent=B-STA-A2 sta_a4_mediaan=B-STA-A3
sta_a5_gemiddelde=B-STA-A4 sta_a10_vraagstuk=B-STA-A6
`);
calcB('sta_d2_aflezen sta_d3_totaal sta_d4_aanvullen sta_c2_staaf sta_b2_zonderas sta_b4_totaal sta_b5_interpreteren sta_a4_mediaan', 'e');

/* ===== D ===== */
T('B-STA-D4', 'bsta_d4_taart', R => {
  const p = R.kies([['Ontbijt van 20 leerlingen', ['boterham', 'granen', 'niets'], 20], ['Vervoer van 40 leerlingen', ['fiets', 'bus', 'te voet'], 40], ['Huisdieren van 20 gezinnen', ['hond', 'kat', 'geen'], 20]]);
  let a; do a = [R.int(2, 6), R.int(2, 6)].map(x => x * p[2] / 20); while (a[0] === a[1] || a[0] + a[1] >= p[2] - p[2] / 10);
  const vals = [a[0], a[1], p[2] - a[0] - a[1]];
  if (new Set(vals).size < 3) return null;
  const pct = vals.map(v => v / p[2] * 100);
  const varianten = [pct, [pct[1], pct[0], pct[2]], [pct[2], pct[1], pct[0]], [pct[0], pct[2], pct[1]]];
  if (new Set(varianten.map(v => v.join())).size < 4) return null;
  const opt = R.schud(varianten), L = 'ABCD', i = opt.indexOf(varianten[0]);
  const fig2 = (v, x0, l) => {
    const cx = x0 + 52, cy = 55, r = 44, kl = ['var(--k1)', 'var(--k2)', 'var(--k3)']; let a0 = 0, s = '';
    v.forEach((x, k) => { const a1 = a0 + x / 100 * 2 * Math.PI, P = a => [cx + r * Math.sin(a), cy - r * Math.cos(a)], p0 = P(a0), p1 = P(a1);
      s += '<path fill="' + kl[k] + '" stroke="var(--wit)" stroke-width="2" d="M' + cx + ',' + cy + ' L' + pt2(p0) + ' A' + r + ',' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + pt2(p1) + ' Z"/>'; a0 = a1; });
    return s + tekst([cx, 122], '<tspan font-weight="700">' + l + '</tspan>');
  };
  const leg = p[1].map((c, k) => '<rect x="' + (10 + k * 120) + '" y="134" width="12" height="12" fill="' + ['var(--k1)', 'var(--k2)', 'var(--k3)'][k] + '"/>' + tekst([28 + k * 120, 145], c, 'start')).join('');
  return {q:`${p[0]}:\n${p[1].map((c, k) => c + ' ' + vals[k]).join(', ')}.\nWelk cirkeldiagram past bij deze tabel?`, fig:fig('0 0 430 152', opt.map((v, j) => fig2(v, 4 + j * 106, L[j])).join('') + leg, 'Vier cirkeldiagrammen A, B, C en D.'),
    ...letterKeuze(4, i, 'diagram '), u:`${p[1].map((c, k) => c + ': ' + vals[k] + ' van de ' + p[2] + ' = ' + f(pct[k]) + ' %').join('\n')}\nDe stukken moeten even groot zijn als die delen: diagram ${L[i]}.`};
});

/* ===== C ===== */
T('B-STA-C2', 'bsta_c2_ruw', R => {
  const p = R.kies([['Het aantal doelpunten per match', [0, 1, 2, 3, 4]], ['Het aantal kinderen per gezin', [1, 2, 3, 4]], ['Het aantal fouten in een dictee', [0, 1, 2, 3, 4, 5]]]);
  const n = R.int(12, 18), data = []; for (let i = 0; i < n; i++) data.push(R.kies(p[1]));
  const w = R.kies(p[1]), h = data.filter(x => x === w).length; if (h < 2) return null;
  return {q:`${p[0]}: ${data.join(', ')}.\nJe tekent een staafdiagram.\nHoe hoog wordt de staaf bij ${w}?`, velden:[veld(h)], calc:false,
    u:`Tel hoe vaak ${w} voorkomt. Zet een streepje bij elke ${w}.\n${w} komt ${h} keer voor: de staaf is ${h} hoog.`};
});
T('B-STA-C3', 'bsta_c3_temp', R => {
  const vals = [0, 1, 2, 3, 4].map(() => R.int(4, 20)); if (new Set(vals).size < 4) return null;
  const varianten = [vals, vals.slice().reverse(), vals.map((v, i) => i === 1 ? v + 5 : v), vals.map((v, i) => i === 3 ? Math.max(1, v - 5) : v)];
  if (new Set(varianten.map(v => v.join())).size < 4) return null;
  const opt = R.schud(varianten), L = 'ABCD', i = opt.indexOf(varianten[0]);
  return {q:`De temperatuur om 14 uur, van maandag tot vrijdag (in °C).\nWelk lijndiagram hoort bij de tabel?`, fig:{t:'twee', a:{t:'tab', kop:['ma', 'di', 'wo', 'do', 'vr'], rijen:[vals]},
    b:fig('0 0 420 130', opt.map((v, j) => miniDiagram(10 + j * 104, v, 26, 'lijn', L[j])).join(''), 'Vier kleine lijndiagrammen A, B, C en D.')},
    ...letterKeuze(4, i, 'diagram '), u:`Volg de temperatuur van dag tot dag: ${vals.join(', ')}.\nHet punt van maandag tot vrijdag gaat ${vals.slice(1).map((v, k) => v > vals[k] ? 'omhoog' : v < vals[k] ? 'omlaag' : 'gelijk').join(', ')}: diagram ${L[i]}.`};
});
T('B-STA-C4', 'bsta_c4_zonderlabel', R => {
  const d = statData(R, 4, 2, 12, true); if (!d) return null;
  const i = R.int(0, 3);
  return {q:`De tabel en het staafdiagram tonen dezelfde gegevens.\nBij één staaf staat geen naam.\nWelke naam hoort bij de staaf met het vraagteken?`,
    fig:{t:'twee', a:tabF(d), b:staafF({titel:d.titel, cats:d.cats.map((c, j) => j === i ? '?' : c), vals:d.vals, ylab:d.ylab})},
    o:keuzes(d.cats[i], d.cats.filter((c, j) => j !== i)), u:`De staaf met het vraagteken is ${d.vals[i]} hoog.\nIn de tabel hoort ${d.vals[i]} bij ${d.cats[i]}.`};
});
T('B-STA-C5', 'bsta_c5_wat', R => {
  const g = [R.int(4, 9), R.int(10, 14), R.int(15, 20), R.int(21, 26), R.int(27, 33)];
  const soort = R.kies(['mediaan', 'gemiddelde']);
  const vk = vasteKeuze(soort === 'mediaan' ? 'het middelste getal nemen als ze van klein naar groot staan' : 'alle getallen optellen en delen door 5',
    ['alle getallen optellen en delen door 5', 'het middelste getal nemen als ze van klein naar groot staan', 'het grootste min het kleinste getal', 'het getal dat het meest voorkomt']);
  return {q:`De zakgeldbedragen van vijf vrienden: € ${g.join(', € ')}.\nHoe vind je ${soort === 'mediaan' ? 'de mediaan' : 'het gemiddelde'}?`, o:vk.o, volgorde:vk.volgorde,
    u:soort === 'mediaan' ? `Mediaan: rangschik van klein naar groot en neem het middelste getal: € ${g[2]}.` : `Gemiddelde: som : aantal = ${somV(g)} : 5 = € ${f(somV(g) / 5)}.`};
});
T('B-STA-C6', 'bsta_c6_tijden', R => {
  const n = R.kies([5, 7, 9]), a = []; let x = R.int(40, 55); for (let i = 0; i < n; i++) { x += R.int(0, 6); a.push(x); }
  return {q:`${n} lopers liepen de 400 meter. Hun tijden in seconden, van snel naar traag:\n${a.join(', ')}.\nWat is de mediaan?`, velden:[veld(a[(n - 1) / 2], 's')], calc:false,
    u:`Er zijn ${n} tijden. De middelste is de ${(n + 1) / 2}de: ${a[(n - 1) / 2]} s.`};
});
T('B-STA-C7', 'bsta_c7_welke', R => {
  const p = R.kies([['Ze maakt een vragenlijst over sport en deelt die uit in de klas.', 'gegevens verzamelen'], ['Ze vraagt zich af: hoe komen de leerlingen naar school?', 'een onderzoeksvraag stellen'],
    ['Ze telt de antwoorden en maakt een staafdiagram.', 'gegevens ordenen en voorstellen'], ['Ze besluit: de meeste leerlingen komen met de fiets.', 'een besluit formuleren']]);
  const lijst = ['een onderzoeksvraag stellen', 'gegevens verzamelen', 'gegevens ordenen en voorstellen', 'een besluit formuleren'], vk = vasteKeuze(p[1], lijst);
  return {q:`Lina doet een klein onderzoek.\n${p[0]}\nBij welke stap van het onderzoek hoort dit?`, o:vk.o, volgorde:vk.volgorde,
    u:'De stappen: een onderzoeksvraag stellen, gegevens verzamelen, gegevens ordenen en voorstellen, een besluit formuleren.\nDit hoort bij: ' + p[1] + '.'};
});

/* ===== A ===== */
T('B-STA-A5', 'bsta_a5_ontbrekend', R => {
  const soort = R.kies(['gemiddelde', 'mediaan']), wie = R.naam();
  if (soort === 'gemiddelde') {
    const g = R.int(12, 16), a = [R.int(9, 17), R.int(9, 17), R.int(9, 17)], x = 4 * g - somV(a);
    if (x < 5 || x > 20) return null;
    return {q:`${wie} had vier toetsen op 20.\nDe eerste drie: ${a.join(', ')}.\nHet gemiddelde van de vier toetsen is ${g}.\nWat haalde ${wie} op de vierde toets?`, velden:[veld(x)],
      u:`Vier toetsen met gemiddelde ${g}: samen 4 × ${g} = ${4 * g}.\nDe eerste drie samen: ${somV(a)}.\nVierde toets: ${4 * g} − ${somV(a)} = ${x}.`};
  }
  const a = [R.int(2, 5), R.int(6, 9), R.int(13, 16), R.int(17, 20)], med = R.int(10, 12);
  return {q:`Vijf vrienden tellen hun stripboeken: ${a.join(', ')} en één getal ontbreekt.\nDe mediaan is ${med}.\nHoeveel stripboeken heeft de vijfde vriend?`, velden:[veld(med)], calc:false,
    u:`Rangschik: ${a[0]}, ${a[1]}, …, ${a[2]}, ${a[3]}.\nDe mediaan is het middelste (3de) getal. Twee getallen zijn kleiner dan ${med} en twee groter.\nHet ontbrekende getal is dus ${med}.`};
});
/* ---------- Tabellen en diagrammen (dieptethema, B-stroom, 2B) ----------
   Leeswijzer: "in een context". De doelen van 2B zijn bijna dezelfde als in 2A (gedeeld via koppel); eigen 2B-vragen met korte zinnen. */
koppel('B', `
tad_d1_bus=B-TAD-D1 tad_d1_prijs=B-TAD-D1 tad_d2_staaf=B-TAD-D2 tad_d3_taart=B-TAD-D3 tad_d4_vergelijk=B-TAD-D4 tad_c1_vergelijk=B-TAD-C1
tad_c2_procent=B-TAD-C2 tad_c2_taart=B-TAD-C2 tad_c3_groot=B-TAD-C3 tad_c3_som=B-TAD-C3 tad_b1_teveel=B-TAD-B1 tad_b2_aanvullen=B-TAD-B2 tad_b3_bus=B-TAD-B3
tad_b4_negatief=B-TAD-B4 tad_b5_lijn=B-TAD-B5 tad_b6_organigram=B-TAD-B6 tad_a2_berekenen=B-TAD-A2 tad_a3_lijn=B-TAD-A3 tad_a4_dubbel=B-TAD-A4
`);
calcB('tad_d1_prijs tad_d2_staaf tad_c2_procent tad_c2_taart tad_c3_som tad_b2_aanvullen tad_b4_negatief', 'e');

/* ===== D ===== */
T('B-TAD-D2', 'btad_d2_broodjes', R => {
  const x = ['ma', 'di', 'wo', 'do', 'vr'], y = x.map(() => R.int(3, 14) * 5); if (new Set(y).size < 5) return null;
  const i = R.int(0, 4), mx = Math.max(...y);
  const vr = R.int(0, 1);
  return {q:vr ? `Het staafdiagram toont hoeveel broodjes de schoolwinkel verkocht.\nOp welke dag verkocht de winkel de meeste broodjes?` : `Het staafdiagram toont hoeveel broodjes de schoolwinkel verkocht.\nHoeveel broodjes waren het op ${DAGNAAM[x[i]]}?`,
    fig:{t:'staaf', titel:'Verkochte broodjes', x, y, min:0, max:Math.ceil(mx / 10) * 10 + 10, stap:10, ylab:'aantal broodjes'},
    ...(vr ? {o:keuzes(DAGNAAM[x[y.indexOf(mx)]], x.filter((d, j) => y[j] !== mx).map(d => DAGNAAM[d]))} : {velden:[veld(y[i], 'broodjes')], calc:false}),
    u:vr ? `De hoogste staaf is die van ${DAGNAAM[x[y.indexOf(mx)]]}: ${mx} broodjes.` : `De staaf van ${DAGNAAM[x[i]]} reikt tot ${y[i]}. Kijk goed: elke lijn is 10, halverwege is 5.`};
});
T('B-TAD-D3', 'btad_d3_feest', R => {
  const cats = R.schud(['pizza', 'frietjes', 'pasta', 'wraps']), v = cats.map(() => R.int(3, 15)); if (new Set(v).size < 4) return null;
  const tot = somV(v), i = R.int(0, 3), j = (i + R.int(1, 3)) % 4;
  return {q:`Op het klasfeest kiest elke leerling één gerecht.\nHoeveel leerlingen kozen ${cats[i]} of ${cats[j]}?`,
    fig:{t:'taart', titel:'Gekozen gerecht (aantal leerlingen)', delen:cats.map((c, k) => [c, v[k] / tot * 100, String(v[k])]), suffix:''},
    velden:[veld(v[i] + v[j], 'leerlingen')], u:`${cats[i]}: ${v[i]}. ${cats[j]}: ${v[j]}.\n${v[i]} + ${v[j]} = ${v[i] + v[j]} leerlingen.`};
});
T('B-TAD-D4', 'btad_d4_zwembad', R => {
  const sl = ['9-11 u', '11-13 u', '13-15 u', '15-17 u'], y = sl.map(() => R.int(2, 9) * 20); if (new Set(y).size < 4) return null;
  const varianten = [y, y.slice().reverse(), [y[1], y[0], y[2], y[3]], y.map((v, k) => k === 2 ? v + 40 : v)];
  if (new Set(varianten.map(v => v.join())).size < 4) return null;
  const opt = R.schud(varianten), L = 'ABCD', i = opt.indexOf(varianten[0]);
  return {q:`Het zwembad telt de bezoekers per tijdslot.\nWelk lijndiagram toont dezelfde gegevens?`,
    fig:{t:'twee', a:{t:'staaf', titel:'Bezoekers zwembad', x:sl, y, min:0, max:220, stap:20, ylab:'aantal bezoekers'},
      b:fig('0 0 420 130', opt.map((v, j) => miniDiagram(10 + j * 104, v, 230, 'lijn', L[j])).join(''), 'Vier kleine lijndiagrammen A, B, C en D.')},
    ...letterKeuze(4, i, 'diagram '), u:`Volg de staven van links naar rechts: ${y.join(', ')}.\nHet lijndiagram moet op dezelfde manier stijgen en dalen: diagram ${L[i]}.`};
});

/* ===== C ===== */
T('B-TAD-C1', 'btad_c1_cirkel', R => {
  const d = taartData(R, 4); if (!d) return null;
  const varianten = [d.pct, d.pct.slice().reverse(), [d.pct[1], d.pct[0], d.pct[2], d.pct[3]], [d.pct[0], d.pct[1], d.pct[3], d.pct[2]]];
  if (new Set(varianten.map(v => v.join())).size < 4) return null;
  const opt = R.schud(varianten), L = 'ABCD', i = opt.indexOf(varianten[0]);
  return {q:`De punten van de lijndiagrammen staan in deze volgorde: ${d.cats.join(', ')}.\nWelk lijndiagram toont dezelfde gegevens als het cirkeldiagram?`,
    fig:{t:'twee', a:taartF(d), b:fig('0 0 420 130', opt.map((v, j) => miniDiagram(10 + j * 104, v, 55, 'lijn', L[j])).join(''), 'Vier kleine lijndiagrammen A, B, C en D.')},
    ...letterKeuze(4, i, 'diagram '), u:`In volgorde: ${d.cats.map((c, k) => c + ' ' + d.pct[k] + ' %').join(', ')}.\nDiagram ${L[i]} stijgt en daalt op dezelfde manier.`};
});

/* ===== A ===== */
T('B-TAD-A1', 'btad_a1_jaren', R => {
  const m = ['jan', 'feb', 'maa', 'apr', 'mei'], j1 = R.int(2023, 2024), jaren = [j1, j1 + 1, j1 + 2];
  const rijen = jaren.map(() => m.map(() => R.int(4, 30) * 10));
  if (rijen.some(r => new Set(r).size < 4)) return null;
  const k = R.int(0, 2);
  return {q:`De tabel toont het aantal bezoekers van een museum per maand.\nHet lijndiagram toont één van de jaren.\nWelk jaar?`,
    fig:{t:'twee', a:{t:'tab', kop:['jaar'].concat(m), rijen:jaren.map((j, x) => [String(j)].concat(rijen[x]))}, b:{t:'lijn', titel:'Bezoekers', x:m, y:rijen[k], min:0, max:320, stap:40, ylab:'aantal bezoekers'}},
    o:vasteKeuze(String(jaren[k]), jaren.map(String)).o, volgorde:vasteKeuze(String(jaren[k]), jaren.map(String)).volgorde,
    u:`Lees de punten af: ${rijen[k].join(', ')}.\nDat zijn de getallen van ${jaren[k]}.`};
});
/* ---------- Verhoudingen (dieptethema, B-stroom, 2B) ----------
   Leeswijzer: "meestal (ook) in een context", met verhoudingstabellen. Gedeeld met 2A Verhoudingen en vergelijkingen (koppel), zonder vergelijkingen. */
koppel('B', `
vvg_d1_recept=B-VER-D1 vvg_d1_verhouding=B-VER-D1 vvg_d3_honderd=B-VER-D2 vvg_c1_tabel=B-VER-C1 vvg_c1_benzine=B-VER-C1 vvg_c3_breuk=B-VER-C2
vvg_b1_eenheid=B-VER-B1 vvg_b1_teveel=B-VER-B1 vvg_b5_gelijk=B-VER-B2 vvg_b6_procent=B-VER-B3 vvg_b7_teveel=B-VER-B4
vvg_a1_pomp=B-VER-A1 vvg_a1_verbruik=B-VER-A1 vvg_a2_procent=B-VER-A2
`);
calcB('vvg_d1_recept vvg_d1_verhouding', 'e');

/* ===== D ===== */
T('B-VER-D2', 'bver_d2_breuk', R => {
  const p = R.kies([['van het aardoppervlak is bedekt met water', 71], ['van de leerlingen sport in een club', 43], ['van de klas heeft een huisdier', 57], ['van de bezoekers kwam met de trein', 29], ['van de gsm-batterij is nog vol', 83], ['van de appels is rood', 61]]);
  const pc = p[1] + R.kies([0, 0, -2, 2]);
  if (pc % 2 === 0 || pc % 5 === 0) return null;
  return {q:`${pc} % ${p[0]}.\nNoteer dit percentage als een breuk.`, velden:[veld(pc + '/100', '', '', 'breuk')], calc:false,
    u:`Procent betekent "per honderd": ${pc} % = {{${pc}|100}}.`};
});

/* ===== C ===== */
T('B-VER-C1', 'bver_c1_eenheid', R => {
  const p = R.kies([['mijl', 'km', 1.61, 'Een fietsroute in Engeland is', 'mijl lang.'], ['inch', 'cm', 2.54, 'Een tablet heeft een scherm van', 'inch.'], ['voet', 'cm', 30.48, 'Een boot is', 'voet lang.']]);
  const n = R.int(4, 15);
  return {q:`${p[3]} ${n} ${p[4]}\n1 ${p[0]} is ongeveer ${f(p[2])} ${p[1]}.\nHoeveel ${p[1]} is dat? Geef je antwoord tot op 0,01 nauwkeurig.`, fig:{t:'tab', titel:'Verhoudingstabel', kop:[p[0], p[1]], rijen:[['1', f(p[2])], [String(n), '…']]},
    velden:[veld(Math.round(n * p[2] * 100) / 100, p[1])], u:`${n} ${p[0]} is ${n} keer 1 ${p[0]}.\n${n} × ${f(p[2])} = ${f(n * p[2])} ${p[1]}.`};
});
T('B-VER-C2', 'bver_c2_ballen', R => {
  const k = R.int(2, 4), a = R.int(1, 4) * k, b = R.int(2, 5) * k; if (a === b || a % b === 0) return null;
  const p = R.kies([['rode', 'gele', 'ballen'], ['zwarte', 'witte', 'knikkers'], ['blauwe', 'groene', 'stiften']]);
  const g = ggd(a, b), juist = breuk(a, b);
  return {q:`In een doos zitten ${a} ${p[0]} en ${b} ${p[1]} ${p[2]}.\nWelke breuk geeft de verhouding van het aantal ${p[0]} tot het aantal ${p[1]} ${p[2]}?`,
    o:keuzes(juist, [breuk(b, a), breuk(a, a + b), breuk(b, a + b)]),
    u:`${p[0]} : ${p[1]} = ${a} : ${b} = {{${a}|${b}}}${g > 1 ? ' = ' + juist : ''}.\n{{${a}|${a + b}}} is het deel van alle ${p[2]}: dat is iets anders.`};
});

/* ===== B ===== */
T('B-VER-B4', 'bver_b4_tabel', R => {
  const pc = R.kies([20, 25, 40, 60, 75, 30]), tot = R.kies([20, 40, 60, 80, 120, 200]), n = pc * tot / 100;
  if (!Number.isInteger(n)) return null;
  const wat = R.kies(['van de leerlingen eet warm op school', 'van de leden van de club is jonger dan 15', 'van de tickets is al verkocht']);
  const wie = wat.indexOf('tickets') >= 0 ? 'tickets' : wat.indexOf('club') >= 0 ? 'leden' : 'leerlingen';
  return {q:`${pc} % ${wat}.\nEr zijn ${tot} ${wie}.\nHoeveel ${wie} zijn dat?`,
    fig:{t:'tab', titel:'Verhoudingstabel', kop:['deel', 'geheel'], rijen:[[String(pc), '100'], ['…', String(tot)]]}, velden:[veld(n)],
    u:`${pc} % betekent ${pc} op 100.\n100 → ${tot}: dat is × ${f(tot / 100)}.\n${pc} × ${f(tot / 100)} = ${n}.`};
});
/* ---------- Stap voor stap (2B): één situatie per thema, vier vragen van D naar A ----------
   De leerling ziet geen letters; de leerkracht ziet bij elke stap het doel. Korte zinnen, contexten uit het dagelijks leven. */
LAD('blad_wpo_frietkot', 'wpo', 'Aan het frietkot', R => {
  const pf = R.stap(2.8, 3.6, 0.2), ps = R.stap(1, 1.4, 0.2), n = R.int(4, 7), betaal = 50, korting = R.kies([10, 20]);
  const tot = n * (pf + ps), kort = tot * (1 - korting / 100);
  return [
    {code:'B-WPO-D1', q:`Een pakje friet kost ${eur(pf)}.\nJe koopt ${n} pakjes.\nHoeveel betaal je?`, velden:[geld(n * pf)], calc:'e', u:`${n} × ${eur(pf)} = ${eur(n * pf)}.`},
    {code:'B-WPO-C1', q:`Een pakje friet kost ${eur(pf)}. Een potje saus kost ${eur(ps)}.\nIedereen neemt friet met saus. Jullie zijn met ${n}.\nJe betaalt met ${eur(betaal)}. Hoeveel krijg je terug?`, velden:[geld(betaal - tot)], calc:'e',
      u:`Eén persoon: ${eur(pf)} + ${eur(ps)} = ${eur(pf + ps)}.\n${n} personen: ${n} × ${eur(pf + ps)} = ${eur(tot)}.\nTerug: ${eur(betaal)} − ${eur(tot)} = ${eur(betaal - tot)}.`},
    {code:'B-WPO-B2', q:`Het frietkot is open van 17 tot 22 uur.\nVan ${n} personen nemen er ${n - 1} friet met saus.\nEén persoon neemt alleen friet.\nEen pakje friet kost ${eur(pf)}, een potje saus ${eur(ps)}.\nHoeveel betalen jullie samen?`, velden:[geld(n * pf + (n - 1) * ps)], calc:'e',
      u:`De openingsuren heb je niet nodig.\nFriet: ${n} × ${eur(pf)} = ${eur(n * pf)}.\nSaus: ${n - 1} × ${eur(ps)} = ${eur((n - 1) * ps)}.\nSamen: ${eur(n * pf + (n - 1) * ps)}.`},
    {code:'B-WPO-A1', q:`Met een klantenkaart krijg je ${korting} % korting.\nEen kaart kost € 5 en geldt voor één keer.\nJullie zijn met ${n} en iedereen neemt friet met saus.\nHoeveel bespaar je met de kaart? Typ 0 als je niets bespaart.`,
      velden:[geld(Math.max(0, Math.round((tot - kort - 5) * 100) / 100))], calc:'e',
      u:`Zonder kaart: ${eur(tot)}.\nMet kaart: ${eur(tot)} − ${korting} % = ${eur(kort)}, plus € 5 voor de kaart = ${eur(kort + 5)}.\n${tot - kort - 5 > 0 ? 'Je bespaart ' + eur(tot - kort - 5) + '.' : 'Je bespaart niets: met de kaart betaal je evenveel of meer.'}`}
  ];
}, 'B');
LAD('blad_get_trein', 'get', 'Met de trein', R => {
  const u = R.int(8, 10), m = R.kies([10, 20, 25, 40]), d = R.kies([35, 45, 50]), d2 = R.int(70, 110), pr = R.stap(8, 14, 0.1);
  const aan = u * 60 + m + d;
  return [
    {code:'B-GET-D5', q:`De trein vertrekt om ${tijdWoord(u, m)} 's morgens.\nWelke digitale tijd is dat?`, o:keuzes(digiT(u, m), [digiT(u, (m + 30) % 60), digiT(u + 1, m), digiT(u - 1, m)]), u:`${tijdWoord(u, m)} 's morgens = ${digiT(u, m)}.`},
    {code:'B-GET-C9', q:`De terugreis duurt ${d2} minuten.\nHoeveel uur en minuten is dat?`, velden:[veld(Math.floor(d2 / 60), 'uur'), veld(d2 % 60, 'min')], calc:false, u:`${d2} = 60 + ${d2 - 60}: ${duurT(d2)}.`},
    {code:'B-GET-B7', q:`De trein vertrekt om ${digiT(u, m)}. De rit duurt ${d} minuten.\nHoe laat kom je aan?`, velden:[veld(Math.floor(aan / 60), 'uur'), veld(aan % 60, 'min')], calc:false,
      u:`${digiT(u, m)} + ${d} minuten = ${digiT(Math.floor(aan / 60), aan % 60)}.`},
    {code:'B-GET-A3', q:`Een ticket kost ${eur(pr)}. Je koopt er 3.\nJe betaalt cash. Het bedrag wordt afgerond op 5 eurocent.\nHoeveel betaal je?`, velden:[geld(Math.round(pr * 3 * 20) / 20)],
      u:`3 × ${eur(pr)} = ${eur(pr * 3)}.\nAfgerond op 5 cent: ${eur(Math.round(pr * 3 * 20) / 20)}.`}
  ];
}, 'B');
LAD('blad_mor_speelplein', 'mor', 'Een plan van het speelplein', R => {
  const kol = 'ABCDEF', c = R.kies('BCDE'.split('')), r = R.int(2, 4), x = R.int(1, 5), y = R.int(1, 5);
  return [
    {code:'B-MOR-D3', q:`Op het plan staat de schommel in vak ${c}${r}.\nKlik op dat vak.`, cel:{kol, rij:5, w:[c + r]}, u:`Eerst de kolom ${c} (letter bovenaan), dan de rij ${r} (cijfer links).`},
    {code:'B-MOR-C1', q:'De zandbak heeft vier rechte hoeken en vier even lange zijden.\nWelke vorm heeft de zandbak?', o:keuzes('vierkant', ['rechthoek', 'ruit', 'trapezium']), u:'Vier rechte hoeken en vier even lange zijden: een vierkant.'},
    {code:'B-MOR-B2', q:'Twee paden snijden elkaar onder een rechte hoek.\nHoe noem je die paden?', o:keuzes('loodrecht', ['evenwijdig', 'kruisend', 'gestrekt']), u:'Rechten die elkaar onder een rechte hoek snijden, staan loodrecht op elkaar.'},
    {code:'B-MOR-A4', q:`De glijbaan staat in punt G.\nWat zijn de coördinaten van G?`, fig:{t:'rooster', max:6, punten:[{x, y, l:'G'}]}, velden:[veld(x, '', 'x ='), veld(y, '', 'y =')], calc:false, u:`${x} naar rechts, ${y} naar boven: G(${x}, ${y}).`}
  ];
}, 'B');
LAD('blad_ooi_tuin', 'ooi', 'Een nieuwe tuin', R => {
  const l = R.int(8, 14), b = R.int(5, l - 2), pr = R.stap(2, 5, 0.5), h = R.kies([20, 30, 40]);
  return [
    {code:'B-OOI-C1', q:'Je wilt gras zaaien op de hele tuin.\nMoet je de omtrek of de oppervlakte kennen?', o:vasteKeuze('oppervlakte', ['omtrek', 'oppervlakte']).o, volgorde:vasteKeuze('oppervlakte', ['omtrek', 'oppervlakte']).volgorde, u:'Gras bedekt het hele vlak: de oppervlakte.'},
    {code:'B-OOI-C5', q:`De tuin is een rechthoek van ${l} m op ${b} m.\nHoe groot is de oppervlakte?`, fk:[FK.oppR], velden:[veld(l * b, 'm²')], calc:'e', u:`${l} × ${b} = ${l * b} m².`},
    {code:'B-OOI-B2', q:`Rond de tuin komt een haag.\nHoeveel meter haag plant je?`, fk:[FK.omtrekR], fig:rechthoekFig(l, b, 'm'), velden:[veld(2 * (l + b), 'm')], calc:'e', u:`2 × (${l} + ${b}) = ${2 * (l + b)} m.`},
    {code:'B-OOI-A7', q:`In de tuin komt een zandbak van 2 m op 1,5 m.\nHet zand ligt ${h} cm hoog.\nHoeveel m³ zand heb je nodig?`, fk:[FK.inhB], velden:[veld(2 * 1.5 * h / 100, 'm³')], calc:'e',
      u:`${h} cm = ${f(h / 100)} m.\n2 × 1,5 × ${f(h / 100)} = ${f(2 * 1.5 * h / 100)} m³.`}
  ];
}, 'B');
LAD('blad_sta_sprint', 'sta', 'De sportdag', R => {
  const t = [R.int(14, 16), R.int(15, 17), R.int(16, 18), R.int(17, 19), R.int(18, 21)].map((x, i) => x + i * 0).sort((a, b) => a - b);
  const namen = R.namen(5), som = somV(t);
  if (som % 5) return null;
  return [
    {code:'B-STA-D1', q:`De tijden op de 100 meter (in seconden).\nHoeveel seconden liep ${namen[2]}?`, fig:{t:'tab', kop:['naam', 'tijd (s)'], rijen:namen.map((n, i) => [n, t[i]])}, velden:[veld(t[2], 's')], calc:false, u:`In de rij van ${namen[2]}: ${t[2]} s.`},
    {code:'B-STA-C6', q:'De tijden staan van snel naar traag.\nWat is de mediaan?', fig:{t:'tab', kop:['naam', 'tijd (s)'], rijen:namen.map((n, i) => [n, t[i]])}, velden:[veld(t[2], 's')], calc:false, u:`Vijf tijden: de middelste (3de) is ${t[2]} s.`},
    {code:'B-STA-B7', q:'Wat is de gemiddelde tijd?', fig:{t:'tab', kop:['naam', 'tijd (s)'], rijen:namen.map((n, i) => [n, t[i]])}, velden:[veld(som / 5, 's')], calc:'e', u:`${t.join(' + ')} = ${som}. ${som} : 5 = ${som / 5} s.`},
    {code:'B-STA-A2', q:`Wie sneller liep dan 17 s, krijgt een medaille.\nHoeveel procent van de lopers krijgt een medaille?`, fig:{t:'tab', kop:['naam', 'tijd (s)'], rijen:namen.map((n, i) => [n, t[i]])}, velden:[veld(t.filter(x => x < 17).length * 20, '%')], calc:'e',
      u:`Sneller dan 17 s: ${t.filter(x => x < 17).length} van de 5 lopers.\n${t.filter(x => x < 17).length} : 5 = ${f(t.filter(x => x < 17).length / 5)} = ${t.filter(x => x < 17).length * 20} %.`}
  ];
}, 'B');
LAD('blad_tad_bib', 'tad', 'In de bibliotheek', R => {
  const m = ['jan', 'feb', 'maa', 'apr', 'mei'], y = m.map(() => R.int(6, 24) * 10); if (new Set(y).size < 5) return null;
  const i = R.int(0, 4), mx = Math.max(...y), mn = Math.min(...y);
  const fg = {t:'lijn', titel:'Uitgeleende boeken', x:m, y, min:0, max:260, stap:20, ylab:'aantal boeken'};
  return [
    {code:'B-TAD-D1', q:`De tabel toont hoeveel boeken de bib uitleende.\nHoeveel boeken waren het in ${m[i]}?`, fig:{t:'tab', kop:['maand'].concat(m), rijen:[['boeken'].concat(y)]}, velden:[veld(y[i], 'boeken')], calc:false, u:`In de kolom ${m[i]}: ${y[i]}.`},
    {code:'B-TAD-B5', q:'In welke maand leende de bib de meeste boeken uit?', fig:fg, o:keuzes(m[y.indexOf(mx)], m.filter((x, j) => y[j] !== mx)), u:`Het hoogste punt: ${m[y.indexOf(mx)]} (${mx}).`},
    {code:'B-TAD-B3', q:'Hoeveel boeken leende de bib in totaal uit in die vijf maanden?', fig:{t:'tab', kop:['maand'].concat(m), rijen:[['boeken'].concat(y)]}, velden:[veld(somV(y), 'boeken')], calc:'e', u:`${y.join(' + ')} = ${somV(y)}.`},
    {code:'B-TAD-A3', q:'Hoeveel boeken scheelt de beste maand met de slechtste maand?', fig:fg, velden:[veld(mx - mn, 'boeken')], calc:'e', u:`Beste: ${mx}. Slechtste: ${mn}. ${mx} − ${mn} = ${mx - mn}.`}
  ];
}, 'B');
LAD('blad_ver_pannenkoeken', 'ver', 'Pannenkoeken bakken', R => {
  const p = R.kies([4, 6]), meel = p === 4 ? 125 : 200, melk = p === 4 ? 2.5 : 4, k = R.int(2, 4), q = p * k + p / 2;
  return [
    {code:'B-VER-D1', q:`Voor ${p} personen heb je ${meel} g bloem nodig.\nHoeveel gram bloem heb je nodig voor ${p * k} personen?`, velden:[veld(meel * k, 'g')], calc:'e', u:`${p * k} is ${k} keer ${p}: ${k} × ${meel} = ${meel * k} g.`},
    {code:'B-VER-C1', q:`Voor ${p} personen heb je ${f(melk)} dl melk nodig.\nHoeveel dl melk voor ${p * k} personen?`, fig:{t:'tab', titel:'Verhoudingstabel', kop:['personen', 'melk (dl)'], rijen:[[String(p), f(melk)], [String(p * k), '…']]}, velden:[veld(melk * k, 'dl')], calc:'e', u:`× ${k}: ${k} × ${f(melk)} = ${f(melk * k)} dl.`},
    {code:'B-VER-B1', q:`Voor ${p} personen heb je ${f(melk)} dl melk nodig.\nHoeveel liter melk heb je nodig voor ${q} personen?`, velden:[veld(melk / p * q / 10, 'liter')], calc:'e',
      u:`Voor 1 persoon: ${f(melk)} : ${p} = ${f(melk / p, 3)} dl.\nVoor ${q} personen: ${q} × ${f(melk / p, 3)} = ${f(melk / p * q, 3)} dl = ${f(melk / p * q / 10, 3)} liter.`},
    {code:'B-VER-A2', q:`Van de ${p * k} gasten eten er ${p * k / 2 + 1} meer dan twee pannenkoeken.\nHoeveel procent van de gasten is dat? Rond af op 1 %.`, velden:[veld(Math.round((p * k / 2 + 1) / (p * k) * 100), '%')], calc:'e',
      u:`${p * k / 2 + 1} : ${p * k} = ${f((p * k / 2 + 1) / (p * k), 4)} ≈ ${Math.round((p * k / 2 + 1) / (p * k) * 100)} %.`}
  ];
}, 'B');
/* ---------- motor van de site wiskundige problemen (platform: GitHub Pages + Firebase) ----------
   Opbouw zoals de toets: het breedtethema Wiskundige problemen oplossen en de dieptethema's van de stroom.
   Elke vraag hoort bij een doel uit de leeswijzer bij de vaardigheidsniveaus (code zoals A-OOI-C3: stroom, thema, letter, nummer).
   Leerlingen zien geen letters, wel wat ze al kunnen en waaraan ze nog werken. Leerkrachten zien de letters en de doelen.
   Opslag in localStorage met de prefix van de site; aanmelden.js spiegelt die naar Firestore.
   Sleutels: staat (alles van de leerling), niv (letter per thema, voor het dashboard), doelen (laatste resultaten per doel),
   _res en _toets (via de haken CLres en CLtoets). */
const app = document.getElementById('app');
const PREFIX = document.body.dataset.prefix || '2a_wp_v1_';
const STROOM = document.body.dataset.stroom || 'A';
const CLres   = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const VERB = window.CL_VERBORGEN instanceof Set ? window.CL_VERBORGEN : new Set(window.CL_VERBORGEN || []);
const verborgen = id => VERB.has(id);
const leerkracht = () => /^(leerkracht|beheerder)$/.test(document.body.dataset.rol || '');
const NIV = ['', 'E', 'D', 'C', 'B', 'A'];
const LETTERS = ['D', 'C', 'B', 'A'];
const LIDX = {D:2, C:3, B:4, A:5};

/* thema's in de volgorde van de toets: eerst het breedtethema, dan de domeinen (onderdeel-id's liggen vast) */
const THEMAS_ALLE = {
  A: [
    {k:'wpo', naam:'Wiskundige problemen oplossen', kort:'Problemen oplossen', code:'WPO', breed:true,
      oms:'Problemen in een context en zonder context: goed lezen, een plan maken, rekenen en controleren.'},
    {k:'get', naam:'Getallenleer', code:'GET', oms:'Rekenen met getallen, breuken en procenten, afronden, schatten, tijd en eenheden.'},
    {k:'alg', naam:'Algebra', code:'ALG', oms:'Lettervormen, machten, getalwaarde, formules en patronen.'},
    {k:'vvg', naam:'Verhoudingen en vergelijkingen', kort:'Verhoudingen', code:'VVG', oms:'Verhoudingen, schaal, procenten, evenredige verbanden en vergelijkingen.'},
    {k:'mor', naam:'Meetkundige objecten en relaties', kort:'Objecten en relaties', code:'MOR', oms:'Vlakke figuren en ruimtefiguren herkennen, hoeken meten, aanzichten en coördinaten.'},
    {k:'mei', naam:'Meetkundige eigenschappen', kort:'Eigenschappen', code:'MEI', oms:'Hoeken, driehoeken en vierhoeken, bijzondere lijnen, symmetrie en congruentie.'},
    {k:'ooi', naam:'Omtrek, oppervlakte en inhoud', kort:'Omtrek en oppervlakte', code:'OOI', oms:'Omtrek, oppervlakte en inhoud van figuren en ruimtefiguren.'},
    {k:'tra', naam:'Transformaties', code:'TRA', oms:'Spiegeling, puntspiegeling, verschuiving en rotatie.'},
    {k:'sta', naam:'Statistiek', code:'STA', oms:'Frequentietabellen, diagrammen, gemiddelde, mediaan, modus en variatiebreedte.'},
    {k:'tad', naam:'Tabellen en diagrammen', code:'TAD', oms:'Gegevens aflezen, vergelijken en verwerken uit tabellen, diagrammen en infografieken.'},
    {k:'vzm', naam:'Verzamelingen', code:'VZM', oms:'Elementen, deelverzamelingen, doorsnede, unie, verschil en venndiagrammen.'}],
  /* 2B: volgorde van de leeswijzer (keuze van Tom, 24 oktober 2026) */
  B: [
    {k:'wpo', naam:'Wiskundige problemen oplossen', kort:'Problemen oplossen', code:'WPO', breed:true,
      oms:'Problemen uit het dagelijks leven: goed lezen, een plan maken, rekenen en controleren.'},
    {k:'get', naam:'Getallenleer', code:'GET', oms:'Rekenen met getallen, breuken en procenten, afronden, schatten, tijd en eenheden.'},
    {k:'mor', naam:'Meetkundige objecten en relaties', kort:'Objecten en relaties', code:'MOR', oms:'Figuren herkennen, hoeken en lengtes meten, roosters en coördinaten.'},
    {k:'ooi', naam:'Omtrek, oppervlakte en inhoud', kort:'Omtrek en oppervlakte', code:'OOI', oms:'Omtrek, oppervlakte en inhoud berekenen met het formularium.'},
    {k:'sta', naam:'Statistiek', code:'STA', oms:'Frequentietabellen, diagrammen, gemiddelde en mediaan.'},
    {k:'tad', naam:'Tabellen en diagrammen', code:'TAD', oms:'Gegevens aflezen en gebruiken uit tabellen, diagrammen en infografieken.'},
    {k:'ver', naam:'Verhoudingen', code:'VER', oms:'Rekenen met verhoudingen, verhoudingstabellen en procenten.'}]
};
const THEMAS = THEMAS_ALLE[STROOM];
const themaVan = k => THEMAS.find(t => t.k === k);
/* proeftoetsen zoals de toets: Wiskundige problemen oplossen en twee dieptethema's (per proeftoets andere) */
const TOETSEN_ALLE = {
  A: [{k:'toets1', naam:'Proeftoets 1', delen:['wpo', 'get', 'ooi']}, {k:'toets2', naam:'Proeftoets 2', delen:['wpo', 'alg', 'sta']},
      {k:'toets3', naam:'Proeftoets 3', delen:['wpo', 'vvg', 'mei']},
      /* extra proeftoetsen (keuze van Tom, 24 oktober 2026): ook de andere dieptethema's komen aan bod */
      {k:'toets4', naam:'Proeftoets 4', delen:['wpo', 'mor', 'tra']}, {k:'toets5', naam:'Proeftoets 5', delen:['wpo', 'tad', 'vzm']}],
  B: [{k:'toets1', naam:'Proeftoets 1', delen:['wpo', 'get', 'ooi']}, {k:'toets2', naam:'Proeftoets 2', delen:['wpo', 'ver', 'sta']},
      {k:'toets3', naam:'Proeftoets 3', delen:['wpo', 'mor', 'tad']}]
};
const TOETSEN = TOETSEN_ALLE[STROOM];
const DEEL_N = 15;
/* onderdelen voor de zijbalk, het dashboard en het openzetten */
const SECTIONS = THEMAS.map(t => ({id:t.k, nav:t.kort || t.naam})).concat(TOETSEN.map(t => ({id:t.k, nav:t.naam})));
const isToets = k => /^toets/.test(k);
const domNaam = k => k === 'fout' ? 'Mijn fouten opnieuw' : isToets(k) ? TOETSEN.find(t => t.k === k).naam : themaVan(k).naam;
const nrVan = k => SECTIONS.filter(x => !verborgen(x.id)).findIndex(x => x.id === k) + 1;
const zichtbareThemas = () => THEMAS.filter(t => !verborgen(t.k));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const rand = n => Math.floor(Math.random() * n);
function schud(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* tekst met breuken: {{teller|noemer}} wordt een breuk met breukstreep */
/* vierkantswortel als één doorlopend teken: de V raakt de schrijflijn en gaat over in de streep boven het getal */
const WRTV = '<svg class="wrt-v" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0.5 60 L3 52 L6 100 L10 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
function wis(s) {
  /* √(…) met haakjes: het streepje loopt over de hele inhoud, de haakjes vallen weg */
  return String(s).replace(/√\(([^()]+)\)|√(\d+(?:,\d+)?|[a-z](?:[²³⁴⁵⁶]|<sup>\d+<\/sup>)?)/g, (m, h, g0) => { const g = h || g0; return '<span class="wrt" role="math" aria-label="vierkantswortel van ' + g.replace(/<[^>]+>/g, '') + '">' + WRTV + '<span class="wrt-in">' + g + '</span></span>'; }).replace(/\{\{([^|{}]+)\|([^|{}]+)\}\}/g, (m, t, n) =>
    '<span class="br" role="math" aria-label="' + esc(t) + ' gedeeld door ' + esc(n) + '"><span class="bt">' + t + '</span><span class="bn">' + n + '</span></span>');
}
function alineas(s, kern) {
  const p = s.split('\n');
  return p.map((x, i) => '<p' + (kern && i === p.length - 1 ? ' class="kern"' : '') + '>' + wis(x) + '</p>').join('');
}
const platte = s => s.replace(/\{\{([^|{}]+)\|([^|{}]+)\}\}/g, '$1/$2').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<');

/* ---------- opslag ----------
   S.q[vraag-id]   = [aantal keer gezien, laatste keer juist (1/0)]
   S.h[thema][L]   = laatste antwoorden op letter L als tekst '1101…' (hoogstens 9)
   S.dg[code]      = laatste antwoorden per doel (hoogstens 3)
   S.th[thema]     = schatting voor de reeks die zich aanpast (2 = D … 5 = A)
   S.proef[toetsN] = laatste poging {d, j, t, delen:{thema:{n, j, t}}} */
let S = {v:4, stroom:STROOM, q:{}, h:{}, dg:{}, th:{}, proef:{}, voorafGezien:false, t:0};
const lok = (k, w) => { try { if (w === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(w)); } catch (e) { return null; } };
function bewaar() {
  S.t = Date.now(); lok(PREFIX + 'staat', S);
  lok(PREFIX + 'doelen', S.dg);
  const niv = {};
  THEMAS.forEach(t => { const l = letterVan(t.k); if (l.t) niv[t.k] = l; }); /* n leeg = nog te weinig gegevens */
  TOETSEN.forEach(t => { const p = S.proef[t.k]; if (p) niv[t.k] = {n:p.delen && p.delen.wpo ? p.delen.wpo.n : '', j:p.j, t:p.t, d:p.d, delen:p.delen}; });
  lok(PREFIX + 'niv', niv);
}

/* ---------- letters en doelen ----------
   Een letter is het hoogste niveau waarvan de leerling de vragen meestal juist heeft (minstens 2 op 3, minstens 3 antwoorden),
   zonder dat een lager niveau duidelijk nog niet lukt. Wie D met minstens 3 antwoorden meestal fout heeft, krijgt E.
   Is er nog voor geen enkele letter genoeg (minder dan 3 antwoorden per letter), dan blijft de letter leeg: nog te weinig gegevens. */
const telJ = s => (s.match(/1/g) || []).length;
function letterStand(k, L) {
  const h = ((S.h[k] || {})[L]) || '';
  if (h.length < 3) return h.length ? 'weinig' : 'leeg';
  return telJ(h) / h.length >= 2 / 3 ? 'ok' : 'niet';
}
function letterVan(k) {
  const st = LETTERS.map(L => letterStand(k, L));
  if (st.every(x => x === 'leeg')) return {n:''};
  let n = '';
  for (let i = 0; i < 4; i++) {
    if (st[i] === 'ok' && st.slice(0, i).every(x => x !== 'niet')) n = LETTERS[i];
  }
  /* E enkel als D met genoeg antwoorden (minstens 3) meestal fout is; anders: nog te weinig gegevens (n leeg) */
  if (!n && st[0] === 'niet') n = 'E';
  const h = S.h[k] || {}; let j = 0, tt = 0;
  LETTERS.forEach(L => { const s = h[L] || ''; j += telJ(s); tt += s.length; });
  return {n, j, t:tt, d:new Date().toISOString().slice(0, 10)};
}
/* doel: behaald = minstens 2 van de laatste 3 antwoorden juist */
/* stand van een doel (laatste 3 pogingen): ok = minstens 2 juist, nog = minstens 2 fout, bezig = nog te weinig pogingen om te beslissen */
function doelStand(code) {
  const s = S.dg[code] || '';
  if (!s) return 'leeg';
  const j = telJ(s), f = s.length - j;
  return j >= 2 ? 'ok' : f >= 2 ? 'nog' : 'bezig';
}
function registreer(q, juist) {
  const k = q.d, L = NIV[q.lv[si()]], c = q.codes && q.codes[STROOM];
  S.h[k] = S.h[k] || {};
  S.h[k][L] = ((S.h[k][L] || '') + (juist ? '1' : '0')).slice(-9);
  if (c && DOELEN[c]) S.dg[c] = ((S.dg[c] || '') + (juist ? '1' : '0')).slice(-3);
}
/* alle doelen van een thema (in de volgorde van de leeswijzer) */
const doelenVan = k => Object.keys(DOELEN).filter(c => c.indexOf(STROOM + '-' + themaVan(k).code + '-') === 0);
const doelTekst = c => DOELEN[c] || '';
/* elke vraag krijgt nu haar thema en letter voor deze stroom (17_koppel.js) */
koppelAf();
/* ---------- figuren ---------- */
function svg(vb, inhoud, alt) {
  return '<svg viewBox="' + vb + '" role="img" aria-label="' + esc(alt || 'figuur') + '" xmlns="http://www.w3.org/2000/svg">' + inhoud + '</svg>';
}
function assenstelsel(f, W, H, L, R, T, B) {
  const y = v => T + (H - T - B) * (1 - (v - f.min) / (f.max - f.min));
  let s = '';
  for (let v = f.min; v <= f.max + 1e-9; v += f.stap) {
    s += '<line class="fras" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>';
    if (!f.zonderAs) s += '<text class="fklein" x="' + (L - 7) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + String(+v.toFixed(4)).replace('.', ',').replace('-', '−') + '</text>';
  }
  s += '<line class="fas" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (H - B) + '"/>';
  s += '<line class="fas" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
  s += '<text class="fklein" transform="translate(13 ' + ((T + H - B) / 2) + ') rotate(-90)" text-anchor="middle">' + f.ylab + '</text>';
  return {s, y};
}
function figuur(k) {
  const F = typeof k === 'string' ? FIGS[k] : k; if (!F) return '';
  /* twee figuren naast elkaar (bv. een tabel en een diagram, of twee diagrammen om te vergelijken) */
  if (F.t === 'twee') return '<div class="wfig2">' + figuur(F.a) + figuur(F.b) + '</div>';
  let h = '';
  if (F.t === 'tab') {
    h = '<table class="ftab"><thead><tr>' + F.kop.map(c => '<th scope="col">' + c + '</th>').join('') + '</tr></thead><tbody>' +
      F.rijen.map(r => '<tr>' + r.map(c => c === '#vlek' ? '<td class="vlek"><svg viewBox="0 0 60 30" aria-label="onleesbaar"><path d="M8,15 C6,4 22,9 27,3 C33,9 46,2 50,10 C58,12 55,22 47,24 C42,30 30,24 24,28 C15,30 6,26 8,15 Z" fill="#5a3a22"/><circle cx="54" cy="5" r="3" fill="#5a3a22"/><circle cx="5" cy="27" r="2" fill="#5a3a22"/></svg></td>' : '<td' + (typeof c === 'number' ? ' class="num"' : '') + '>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  } else if (F.t === 'staaf' || F.t === 'lijn') {
    const W = 380, H = 236, L = 52, R = 12, T = F.y2 ? 22 : 12, B = 30;
    const as = assenstelsel(F, W, H, L, R, T, B);
    const band = (W - L - R) / F.x.length;
    let s = as.s;
    F.x.forEach((n, i) => { s += '<text class="fnaam" x="' + (L + band * (i + .5)) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + n + '</text>'; });
    if (F.t === 'staaf') {
      /* staven vanaf 0 (ook negatieve waarden); een tweede reeks (F.y2) geeft een dubbel staafdiagram met legende */
      const twee = !!F.y2, bw = band * (twee ? .34 : .54), y0 = as.y(clamp(0, F.min, F.max));
      const staaf = (x, v, kl) => { const y = as.y(v); s += '<rect fill="' + kl + '" x="' + x.toFixed(1) + '" y="' + Math.min(y, y0).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.abs(y0 - y).toFixed(1) + '" rx="2"/>'; };
      F.y.forEach((v, i) => staaf(L + band * (i + .5) - (twee ? bw : bw / 2), v, 'var(--k1)'));
      if (twee) F.y2.forEach((v, i) => staaf(L + band * (i + .5), v, 'var(--k2)'));
      if (F.min < 0) s += '<line class="fas" x1="' + L + '" x2="' + (W - R) + '" y1="' + y0 + '" y2="' + y0 + '"/>';
      if (twee && F.leg) s += '<rect x="' + (W - R - 150) + '" y="2" width="10" height="10" fill="var(--k1)"/><text class="fklein" x="' + (W - R - 136) + '" y="11">' + F.leg[0] + '</text><rect x="' + (W - R - 70) + '" y="2" width="10" height="10" fill="var(--k2)"/><text class="fklein" x="' + (W - R - 56) + '" y="11">' + F.leg[1] + '</text>';
      /* F.waarden: true = alle waarden boven de staven, of een lijst met per staaf een label (null = geen label) */
      if (F.waarden) F.y.forEach((v, i) => { const lab = Array.isArray(F.waarden) ? F.waarden[i] : v; if (lab == null) return; s += '<text class="fklein" x="' + (L + band * (i + .5) - (F.y2 ? bw / 2 : 0)) + '" y="' + (as.y(Math.max(v, 0)) - 5) + '" text-anchor="middle">' + String(lab).replace('.', ',').replace('-', '−') + '</text>'; });
      if (F.waarden2) F.y2.forEach((v, i) => { s += '<text class="fklein" x="' + (L + band * (i + .5) + bw / 2) + '" y="' + (as.y(Math.max(v, 0)) - 5) + '" text-anchor="middle">' + String(v).replace('.', ',').replace('-', '−') + '</text>'; });
    } else {
      const pt = F.y.map((v, i) => [L + band * (i + .5), as.y(v)]);
      s += '<polyline fill="none" stroke="var(--k1)" stroke-width="2.4" stroke-linejoin="round" points="' + pt.map(p => p.join(',')).join(' ') + '"/>';
      pt.forEach(p => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="var(--k1)" stroke="var(--wit)" stroke-width="2"/>'; });
      if (F.waarden) pt.forEach((p, i) => { s += '<text class="fklein" x="' + p[0] + '" y="' + (p[1] - 10) + '" text-anchor="middle">' + f(F.y[i]) + '</text>'; });
    }
    h = svg('0 0 ' + W + ' ' + H, s, F.titel + ' (' + (F.t === 'staaf' ? 'staafdiagram' : 'lijndiagram') + ')');
  } else if (F.t === 'taart') {
    const cx = 180, cy = 122, r = 84, kl = ['var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', '#8a6fd1', '#e0607e'];
    let a0 = 0, s = '';
    const P = (a, rr) => [cx + rr * Math.sin(a), cy - rr * Math.cos(a)];
    F.delen.forEach((d, i) => {
      const a1 = a0 + d[1] / 100 * 2 * Math.PI, p0 = P(a0, r), p1 = P(a1, r), gr = (a1 - a0) > Math.PI ? 1 : 0;
      s += '<path fill="' + kl[i] + '" stroke="var(--wit)" stroke-width="2" d="M' + cx + ',' + cy + ' L' + p0[0].toFixed(1) + ',' + p0[1].toFixed(1) + ' A' + r + ',' + r + ' 0 ' + gr + ' 1 ' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1) + ' Z"/>';
      const m = (a0 + a1) / 2, pl = P(m, r + 14), sn = Math.sin(m);
      s += '<text class="fnaam" x="' + pl[0].toFixed(1) + '" y="' + (pl[1] + 5).toFixed(1) + '" text-anchor="' + (sn > .25 ? 'start' : sn < -.25 ? 'end' : 'middle') + '">' + d[0] + (F.zonderLabels ? '' : ': ' + (d[2] || f(d[1], 1)) + (F.suffix != null ? F.suffix : ' %')) + '</text>';
      a0 = a1;
    });
    h = svg('-30 0 420 240', s, F.titel + ' (cirkeldiagram)' + (F.zonderLabels ? '' : ': ' + F.delen.map(d => d[0] + ' ' + (d[2] || f(d[1], 1)) + (F.suffix != null ? F.suffix : ' %')).join(', ')));
  } else if (F.t === 'venn') {
    const kol = (arr, x) => arr.map((e, i) => '<text class="ftxt" x="' + x + '" y="' + (113 + (i - (arr.length - 1) / 2) * 28) + '" text-anchor="middle">' + e + '</text>').join('');
    let s = '<rect x="8" y="8" width="324" height="194" rx="10" fill="var(--wit)" stroke="var(--inkt2)" stroke-width="1.5"/>' +
      '<circle cx="132" cy="108" r="74" fill="var(--k1)" fill-opacity=".16" stroke="var(--inkt)" stroke-width="2"/>' +
      '<circle cx="208" cy="108" r="74" fill="var(--k2)" fill-opacity=".18" stroke="var(--inkt)" stroke-width="2"/>' +
      '<text class="ftxt" x="66" y="40" text-anchor="middle" font-weight="700">A</text><text class="ftxt" x="274" y="40" text-anchor="middle" font-weight="700">B</text>' +
      kol(F.a, 96) + kol(F.ab, 170) + kol(F.b, 244) + F.uit.map((e, i) => '<text class="ftxt" x="' + (306 - i * 20) + '" y="186" text-anchor="middle">' + e + '</text>').join('');
    h = svg('0 0 340 210', s, 'Venndiagram. Alleen in A: ' + F.a.join(', ') + '. In A en B: ' + F.ab.join(', ') + '. Alleen in B: ' + F.b.join(', ') + (F.uit.length ? '. Buiten A en B: ' + F.uit.join(', ') : '') + '.');
  } else if (F.t === 'rooster') {
    const u = 36, ox = 38, oy = 214, n = F.max; let s = '';
    for (let i = 0; i <= n; i++) {
      s += '<line class="fras" x1="' + (ox + i * u) + '" x2="' + (ox + i * u) + '" y1="' + oy + '" y2="' + (oy - n * u) + '"/><line class="fras" x1="' + ox + '" x2="' + (ox + n * u) + '" y1="' + (oy - i * u) + '" y2="' + (oy - i * u) + '"/>';
      s += '<text class="fklein" x="' + (ox + i * u) + '" y="' + (oy + 16) + '" text-anchor="middle">' + i + '</text>';
      if (i) s += '<text class="fklein" x="' + (ox - 8) + '" y="' + (oy - i * u + 4) + '" text-anchor="end">' + i + '</text>';
    }
    s += '<path class="fas" d="M' + ox + ',' + oy + ' H' + (ox + n * u + 18) + ' m-7,-4 l7,4 l-7,4 M' + ox + ',' + oy + ' V' + (oy - n * u - 18) + ' m-4,7 l4,-7 l4,7"/>';
    s += '<text class="fnaam" x="' + (ox + n * u + 22) + '" y="' + (oy + 16) + '">x</text><text class="fnaam" x="' + (ox - 14) + '" y="' + (oy - n * u - 12) + '">y</text>';
    F.punten.forEach(p => { s += '<circle cx="' + (ox + p.x * u) + '" cy="' + (oy - p.y * u) + '" r="5" fill="var(--k4)" stroke="var(--wit)" stroke-width="2"/><text class="ftxt" x="' + (ox + p.x * u + 9) + '" y="' + (oy - p.y * u - 8) + '" font-weight="700">' + p.l + '</text>'; });
    h = svg('0 0 250 236', s, 'Assenstelsel met punt ' + F.punten.map(p => p.l).join(', '));
  } else if (F.t === 'rooster2') {
    h = roosterSvg(F.r, {alt:F.alt});
  } else if (F.t === 'kleur') {
    const c = 26, n = F.n, o = 22; let s = '';
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
      const kl = F.cellen.some(p => p[0] === x && p[1] === y);
      s += '<rect x="' + (o + x * c) + '" y="' + (o + y * c) + '" width="' + c + '" height="' + c + '" fill="' + (kl ? 'var(--k2)' : 'var(--wit)') + '" stroke="var(--lijn)" stroke-width="1"/>';
    }
    const m = o + n * c / 2;
    s += '<line class="flijn" x1="' + m + '" y1="' + (o - 14) + '" x2="' + m + '" y2="' + (o + n * c + 14) + '"/><text class="ftxt" x="' + (m + 6) + '" y="' + (o + n * c + 16) + '" font-style="italic">s</text>';
    s += '<line class="flijn" x1="' + (o - 14) + '" y1="' + m + '" x2="' + (o + n * c + 14) + '" y2="' + m + '"/><text class="ftxt" x="' + (o + n * c + 8) + '" y="' + (m - 6) + '" font-style="italic">t</text>';
    h = svg('0 0 ' + (2 * o + n * c + 10) + ' ' + (2 * o + n * c + 10), s, F.alt);
  } else if (F.t === 'net') {
    const c = 40; let s = '';
    F.cellen.forEach(p => { s += '<rect x="' + (10 + p[0] * c) + '" y="' + (10 + p[1] * c) + '" width="' + c + '" height="' + c + '" fill="var(--teal-l)" stroke="var(--inkt)" stroke-width="2"/>'; });
    h = svg('0 0 ' + (20 + 4 * c) + ' ' + (20 + 3 * c), s, F.alt);
  } else if (F.t === 'boog') {
    const cx = 200, cy = 200, R0 = 150; let s = '<path d="M' + (cx - R0 - 10) + ',' + cy + ' A' + (R0 + 10) + ',' + (R0 + 10) + ' 0 0 1 ' + (cx + R0 + 10) + ',' + cy + ' Z" fill="var(--teal-l)" stroke="var(--inkt2)" stroke-width="1.5"/>';
    const P = (a, r) => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
    for (let a = 0; a <= 180; a += 5) {
      const lang = a % 10 === 0, p1 = P(a, R0 + 10), p2 = P(a, R0 + 10 - (lang ? 14 : 7));
      s += '<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '" stroke="var(--inkt)" stroke-width="' + (lang ? 1.4 : .8) + '"/>';
      if (lang && a % 20 === 0) {
        const q1 = P(a, R0 - 14), q2 = P(a, R0 - 34);
        s += '<text class="fklein" x="' + q1[0].toFixed(1) + '" y="' + (q1[1] + 4).toFixed(1) + '" text-anchor="middle">' + a + '</text>';
        s += '<text class="fklein" x="' + q2[0].toFixed(1) + '" y="' + (q2[1] + 4).toFixed(1) + '" text-anchor="middle" fill="var(--inkt2)" font-size="10">' + (180 - a) + '</text>';
      }
    }
    const b1 = P(F.a1, R0 + 40), b2 = P(F.a2, R0 + 40), m1 = P(F.a1, 34), m2 = P(F.a2, 34);
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + b1[0].toFixed(1) + '" y2="' + b1[1].toFixed(1) + '" stroke="#C8372D" stroke-width="2.5"/>';
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + b2[0].toFixed(1) + '" y2="' + b2[1].toFixed(1) + '" stroke="#C8372D" stroke-width="2.5"/>';
    s += '<path d="M' + m1[0].toFixed(1) + ',' + m1[1].toFixed(1) + ' A34,34 0 0 0 ' + m2[0].toFixed(1) + ',' + m2[1].toFixed(1) + '" fill="none" stroke="#C8372D" stroke-width="2"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="var(--inkt)"/>';
    h = svg('0 0 400 215', s, F.alt);
  } else if (F.t === 'klok') {
    /* analoge klok: F.u (0-23 of 1-12) en F.m; F.klokken = [{u, m, l}] voor meerdere klokken naast elkaar */
    const lijst = F.klokken || [{u:F.u, m:F.m, l:F.l}], r = 70, bw = 170;
    let s2 = '';
    lijst.forEach((k, n) => {
      const cx = 85 + n * bw, cy = 85; s2 += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--wit)" stroke="var(--inkt)" stroke-width="3"/>';
      for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, l = i % 5 ? 5 : 10; s2 += '<line x1="' + (cx + (r - 3) * Math.sin(a)).toFixed(1) + '" y1="' + (cy - (r - 3) * Math.cos(a)).toFixed(1) + '" x2="' + (cx + (r - 3 - l) * Math.sin(a)).toFixed(1) + '" y2="' + (cy - (r - 3 - l) * Math.cos(a)).toFixed(1) + '" stroke="var(--inkt)" stroke-width="' + (i % 5 ? 1 : 2) + '"/>'; }
      for (let h = 1; h <= 12; h++) { const a = h * 30 * Math.PI / 180; s2 += '<text class="fklein" x="' + (cx + (r - 22) * Math.sin(a)).toFixed(1) + '" y="' + (cy - (r - 22) * Math.cos(a) + 5).toFixed(1) + '" text-anchor="middle" font-weight="700">' + h + '</text>'; }
      const au = ((k.u % 12) + k.m / 60) * 30 * Math.PI / 180, am = k.m * 6 * Math.PI / 180;
      s2 += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + 36 * Math.sin(au)).toFixed(1) + '" y2="' + (cy - 36 * Math.cos(au)).toFixed(1) + '" stroke="var(--inkt)" stroke-width="5" stroke-linecap="round"/>';
      s2 += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + 55 * Math.sin(am)).toFixed(1) + '" y2="' + (cy - 55 * Math.cos(am)).toFixed(1) + '" stroke="var(--inkt)" stroke-width="3" stroke-linecap="round"/><circle cx="' + cx + '" cy="' + cy + '" r="4" fill="var(--inkt)"/>';
      if (k.l) s2 += '<text class="fnaam" x="' + cx + '" y="' + (cy + r + 20) + '" text-anchor="middle">' + k.l + '</text>';
    });
    h = svg('0 0 ' + (lijst.length * bw) + ' ' + (lijst.some(k => k.l) ? 185 : 170), s2, F.alt || 'Analoge klok');
  } else if (F.t === 'digi') {
    const lijst = F.klokken || [{t:F.tijd, l:F.l}]; let s2 = '';
    lijst.forEach((k, n) => { const x = 10 + n * 190; s2 += '<rect x="' + x + '" y="10" width="170" height="70" rx="12" fill="var(--wit)" stroke="var(--inkt)" stroke-width="3"/><text x="' + (x + 85) + '" y="62" text-anchor="middle" font-family="ui-monospace,Consolas,monospace" font-size="40" font-weight="700" fill="var(--inkt)">' + k.t + '</text>' + (k.l ? '<text class="fnaam" x="' + (x + 85) + '" y="102" text-anchor="middle">' + k.l + '</text>' : ''); });
    h = svg('0 0 ' + (lijst.length * 190 + 10) + ' ' + (lijst.some(k => k.l) ? 110 : 90), s2, F.alt || 'Digitale klok');
  } else if (F.t === 'svg') {
    h = svg(F.vb, F.html, F.alt);
  }
  return '<figure class="wfig">' + (F.titel ? '<figcaption>' + F.titel + '</figcaption>' : '') + h + '</figure>';
}

/* ---------- rooster voor klikvragen en figuren ---------- */
const RC = 34, RP = 30, TRI = Math.sqrt(3) / 2;
let roosterNr = 0;
/* rooster voor klikvragen en figuren
   r.xmin..r.xmax, r.ymin..r.ymax ; r.tri = driehoeksrooster (punt (x, y): x langs de horizontale, y langs de schuine richting van 60°)
   r.lijnen [{x1,y1,x2,y2,vol,l}], r.punten [{x,y,l}], r.figuren [{pts:[{x,y}], kl:1|2|3|4, l, open}], r.been {v:{x,y}, a:{x,y}} (vast been van een hoek) */
function roosterGeo(r) {
  if (!r.tri) return {W:(r.xmax - r.xmin) * RC + 2 * RP, H:(r.ymax - r.ymin) * RC + 2 * RP,
    P:(x, y) => [RP + (x - r.xmin) * RC, RP + (r.ymax - y) * RC]};
  return {W:(r.xmax - r.xmin) * RC + 2 * RP, H:(r.ymax - r.ymin) * RC * TRI + 2 * RP,
    P:(x, y) => [RP + (x + y / 2 - r.xmin) * RC, RP + (r.ymax - y) * RC * TRI]};
}
function roosterPunten(r) {
  const uit = [];
  for (let y = r.ymin; y <= r.ymax; y++) {
    const x0 = r.tri ? Math.ceil(r.xmin - y / 2 - 1e-9) : r.xmin, x1 = r.tri ? Math.floor(r.xmax - y / 2 + 1e-9) : r.xmax;
    for (let x = x0; x <= x1; x++) uit.push({x, y});
  }
  return uit;
}
function roosterSvg(r, opt) {
  opt = opt || {};
  const G = roosterGeo(r), P = G.P, W = G.W, H = G.H;
  const X = x => P(x, 0)[0], Y = y => P(0, y)[1];
  let s = '<rect x="' + RP + '" y="' + RP + '" width="' + (W - 2 * RP) + '" height="' + (H - 2 * RP) + '" fill="var(--wit)"/>';
  if (r.tri) {
    const pts = roosterPunten(r), heeft = (x, y) => pts.some(p => p.x === x && p.y === y);
    const lijn = (a, b) => { const p = P(a.x, a.y), q = P(b.x, b.y); return '<line class="fras" x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '"/>'; };
    pts.forEach(p => {
      if (heeft(p.x + 1, p.y)) s += lijn(p, {x:p.x + 1, y:p.y});
      if (heeft(p.x, p.y + 1)) s += lijn(p, {x:p.x, y:p.y + 1});
      if (heeft(p.x - 1, p.y + 1)) s += lijn(p, {x:p.x - 1, y:p.y + 1});
    });
  } else {
    for (let x = r.xmin; x <= r.xmax; x++) s += '<line class="fras" x1="' + X(x) + '" x2="' + X(x) + '" y1="' + Y(r.ymin) + '" y2="' + Y(r.ymax) + '"/>';
    for (let y = r.ymin; y <= r.ymax; y++) s += '<line class="fras" x1="' + X(r.xmin) + '" x2="' + X(r.xmax) + '" y1="' + Y(y) + '" y2="' + Y(y) + '"/>';
  }
  const as = r.assen || '';
  if (as.indexOf('x') >= 0 && r.ymin <= 0 && r.ymax >= 0) {
    s += '<path class="fas" d="M' + X(r.xmin) + ',' + Y(0) + ' H' + (X(r.xmax) + 16) + ' m-7,-4 l7,4 l-7,4"/><text class="fnaam" x="' + (X(r.xmax) + 12) + '" y="' + (Y(0) + 18) + '" font-style="italic">x</text>';
  }
  if (as.indexOf('y') >= 0 && r.xmin <= 0 && r.xmax >= 0) {
    s += '<path class="fas" d="M' + X(0) + ',' + Y(r.ymin) + ' V' + (Y(r.ymax) - 16) + ' m-4,7 l4,-7 l4,7"/><text class="fnaam" x="' + (X(0) + 9) + '" y="' + (Y(r.ymax) - 8) + '" font-style="italic">y</text>';
  }
  if (r.getallen && as.indexOf('x') >= 0 && as.indexOf('y') >= 0) {
    const ijk = r.ijk || 1, xs = [], ys = [];
    for (let x = r.xmin; x <= r.xmax; x++) if (x && (r.getallen === 'alle' || x === 1)) xs.push(x);
    for (let y = r.ymin; y <= r.ymax; y++) if (y && (r.getallen === 'alle' || y === 1)) ys.push(y);
    const tg = v => String(+(v * ijk).toFixed(4)).replace('-', '−').replace('.', ',');
    xs.forEach(x => { s += '<text class="fklein" x="' + X(x) + '" y="' + (Y(0) + 15) + '" text-anchor="middle">' + tg(x) + '</text>'; });
    ys.forEach(y => { s += '<text class="fklein" x="' + (X(0) - 6) + '" y="' + (Y(y) + 4) + '" text-anchor="end">' + tg(y) + '</text>'; });
    if (r.xmin <= 0 && r.ymin <= 0) s += '<text class="fklein" x="' + (X(0) - 6) + '" y="' + (Y(0) + 15) + '" text-anchor="end">0</text>';
  }
  (r.figuren || []).forEach(f => {
    const pp = f.pts.map(p => P(p.x, p.y).map(v => v.toFixed(1)).join(',')).join(' ');
    s += f.open ? '<polyline points="' + pp + '" fill="none" stroke="var(--k' + (f.kl || 1) + ')" stroke-width="3"/>'
      : '<polygon points="' + pp + '" fill="var(--k' + (f.kl || 1) + ')" fill-opacity=".28" stroke="var(--k' + (f.kl || 1) + ')" stroke-width="2.5"/>';
    if (f.l) { const c = f.pts.reduce((a, p) => [a[0] + p.x / f.pts.length, a[1] + p.y / f.pts.length], [0, 0]), q = P(c[0], c[1]); s += '<text class="ftxt" x="' + q[0].toFixed(1) + '" y="' + (q[1] + 5).toFixed(1) + '" text-anchor="middle" font-weight="700">' + f.l + '</text>'; }
  });
  (r.lijnen || []).forEach(l => {
    const a = P(l.x1, l.y1), b = P(l.x2, l.y2);
    s += '<line class="' + (l.vol ? 'flijn' : 'fstreep fdik') + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"' + (l.pijl ? ' marker-end="url(#pijlkop)"' : '') + '/>';
    if (l.l) s += '<text class="ftxt" x="' + (b[0] + 7) + '" y="' + (b[1] + 14) + '" font-style="italic">' + l.l + '</text>';
  });
  if (r.been) {
    /* hoek tekenen: een vast been vanuit het hoekpunt; het tweede been gaat door het aangeklikte punt */
    const v = P(r.been.v.x, r.been.v.y), a = P(r.been.a.x, r.been.a.y), ver = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * 1000, p[1] + dy / l * 1000]; };
    const e1 = ver(v, a);
    const cid = 'rclip' + (++roosterNr);
    s += '<clipPath id="' + cid + '"><rect x="' + RP + '" y="' + RP + '" width="' + (W - 2 * RP) + '" height="' + (H - 2 * RP) + '"/></clipPath><g clip-path="url(#' + cid + ')"><line class="flijn" x1="' + v[0] + '" y1="' + v[1] + '" x2="' + e1[0] + '" y2="' + e1[1] + '"/>';
    const m = opt.jouw || opt.juist;
    if (m && !(m.x === r.been.v.x && m.y === r.been.v.y)) { const q = P(m.x, m.y), e2 = ver(v, q); s += '<line x1="' + v[0] + '" y1="' + v[1] + '" x2="' + e2[0] + '" y2="' + e2[1] + '" stroke="var(--k2)" stroke-width="2.5"/>'; }
    s += '</g><circle cx="' + v[0] + '" cy="' + v[1] + '" r="4.5" fill="var(--inkt)"/>' + (r.been.l ? '<text class="ftxt" x="' + (v[0] - 14) + '" y="' + (v[1] + 18) + '" font-style="italic">' + r.been.l + '</text>' : '');
  }
  (r.punten || []).forEach(p => {
    const q = P(p.x, p.y);
    s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="4.5" fill="var(--inkt)"/><text class="ftxt" x="' + (q[0] + 7) + '" y="' + (q[1] - 7) + '">' + p.l + '</text>';
  });
  const merk = (m, cls) => { if (!m) return ''; const q = P(m.x, m.y); return '<g class="' + cls + '"><circle cx="' + q[0] + '" cy="' + q[1] + '" r="9"/><circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.5" class="kern"/></g>'; };
  if (opt.juist) s += merk(opt.juist, 'kjuist');
  if (opt.jouw) s += merk(opt.jouw, opt.fout || (opt.juist && (opt.jouw.x !== opt.juist.x || opt.jouw.y !== opt.juist.y)) ? 'kmis' : 'kjouw');
  const defs = '<defs><marker id="pijlkop" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--inkt)"/></marker></defs>';
  const label = opt.klik ? 'Rooster. Klik op een plaats om een punt te zetten. Met de pijltjestoetsen kan je het punt verplaatsen.' : (opt.alt || 'Rooster');
  return '<svg class="rooster' + (opt.klik ? ' klikbaar' : '') + '" viewBox="0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1) + '" style="max-width:' + Math.round(W) + 'px"' + (opt.klik ? ' tabindex="0" role="application" data-fk="rooster"' : ' role="img"') + ' aria-label="' + esc(label) + '" xmlns="http://www.w3.org/2000/svg">' + defs + s + '</svg>';
}
function roosterPunt(svgEl, r, e) {
  const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svgEl.getScreenCTM().inverse());
  if (r.tri) {
    let best = null, bd = 1e9; const G = roosterGeo(r);
    roosterPunten(r).forEach(q => { const s = G.P(q.x, q.y), d = Math.hypot(s[0] - p.x, s[1] - p.y); if (d < bd) { bd = d; best = q; } });
    return {x:best.x, y:best.y};
  }
  return {x:clamp(Math.round((p.x - RP) / RC + r.xmin), r.xmin, r.xmax), y:clamp(Math.round(r.ymax - (p.y - RP) / RC), r.ymin, r.ymax)};
}
/* ---------- rekenmachine (wetenschappelijk, zonder eval) ---------- */
const calc = {uit:'', net:false, ans:0, breuk:false, laatste:null};
function rekenUit(s) {
  const t = s.match(/\d+(?:,\d+)?|ANS|π|⁻¹|[+−×÷()√²^%]/g) || []; let i = 0;
  const kijk = () => t[i], neem = () => t[i++];
  function expr() { let v = term(); while (kijk() === '+' || kijk() === '−') { const o = neem(), w = term(); v = o === '+' ? v + w : v - w; } return v; }
  function term() { let v = unair(); while (kijk() === '×' || kijk() === '÷') { const o = neem(), w = unair(); v = o === '×' ? v * w : v / w; } return v; }
  function unair() { if (kijk() === '−') { neem(); return -unair(); } return macht(); }
  function macht() { const b = post(); if (kijk() === '^') { neem(); return Math.pow(b, unair()); } return b; }
  function post() { let v = prim(); while (kijk() === '²' || kijk() === '⁻¹' || kijk() === '%') { const o = neem(); v = o === '²' ? v * v : o === '%' ? v / 100 : 1 / v; } return v; }
  function prim() {
    const k = neem();
    if (k === '(') { const v = expr(); if (kijk() === ')') neem(); return v; }
    if (k === '√') return Math.sqrt(post());
    if (k === 'π') return Math.PI;
    if (k === 'ANS') return calc.ans;
    if (k === undefined || !/^\d/.test(k)) throw 0;
    return parseFloat(k.replace(',', '.'));
  }
  const v = expr(); if (i < t.length || !isFinite(v)) throw 0; return v;
}
function naarBreuk(x) {
  // kettingbreuk met noemer tot 10000; null als het geen nette breuk is
  const teken = x < 0 ? -1 : 1; x = Math.abs(x);
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
  for (let i = 0; i < 30; i++) {
    const a = Math.floor(b), h2 = a * h1 + h0, k2 = a * k1 + k0;
    if (k2 > 10000) break;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    if (Math.abs(x - h1 / k1) < 1e-10) return k1 === 1 ? null : [teken * h1, k1];
    b = 1 / (b - a); if (!isFinite(b)) break;
  }
  return null;
}
const getalTekst = v => String(parseFloat(v.toPrecision(10))).replace('.', ',').replace('-', '−').replace(/e\+?/, ' · 10^');
function calcScherm() {
  const o = wortel().querySelector('.rm output'); if (!o) return;
  if (calc.net && calc.breuk && calc.laatste != null) {
    const b = naarBreuk(calc.laatste);
    o.innerHTML = b ? (b[0] < 0 ? '−' : '') + wis('{{' + Math.abs(b[0]) + '|' + b[1] + '}}') : esc(getalTekst(calc.laatste));
  } else o.textContent = calc.uit || '0';
  o.scrollLeft = o.scrollWidth;
}
function calcToets(k) {
  if (k === 'AC') { calc.uit = ''; calc.net = false; calc.breuk = false; }
  else if (k === 'DEL') { calc.uit = calc.net ? '' : calc.uit.replace(/(ANS|⁻¹|.)$/, ''); calc.net = false; calc.breuk = false; }
  else if (k === 'F↔D') { if (calc.net && calc.laatste != null) calc.breuk = !calc.breuk; }
  else if (k === '=') {
    if (!calc.uit || calc.net) return;
    try { const v = rekenUit(calc.uit); calc.ans = v; calc.laatste = v; calc.uit = getalTekst(v); }
    catch (e) { calc.uit = 'Fout'; calc.laatste = null; }
    calc.net = true; calc.breuk = false;
  } else {
    if (calc.net) {
      if (calc.uit === 'Fout' || /^[\d,(√π]$/.test(k) || k === 'ANS') calc.uit = '';
      else calc.uit = 'ANS';
      calc.net = false; calc.breuk = false;
    }
    if (calc.uit.length < 48) calc.uit += k;
  }
  calcScherm();
}
function calcHtml(soort) {
  if (soort === 'e') return calcEenvoudig();
  const kn = [['AC','op rood'],['DEL','op'],['(','op'],[')','op'],['÷','op'],
    ['7'],['8'],['9'],['×','op'],['√','op'],
    ['4'],['5'],['6'],['−','op'],['²','op'],
    ['1'],['2'],['3'],['+','op'],['^','op'],
    ['0'],[','],['π','op'],['ANS','op'],['⁻¹','op'],
    ['F↔D','op breed'],['=','is']];
  const toon = {'²':'x²', '^':'xʸ', '⁻¹':'x⁻¹', '√':'√'};
  const naam = {'AC':'alles wissen','DEL':'laatste teken wissen','÷':'gedeeld door','×':'maal','−':'min','+':'plus',',':'komma','√':'vierkantswortel','²':'kwadraat','^':'macht','⁻¹':'omgekeerde','π':'pi','ANS':'vorige uitkomst','F↔D':'wissel tussen breuk en kommagetal','=':'is gelijk aan'};
  return '<div class="rm paneel" id="calc" role="group" aria-label="Rekenmachine"><div class="paneelkop"><b>Rekenmachine</b><button type="button" class="sluit" data-a="calc" aria-label="Sluit de rekenmachine">×</button></div><output aria-live="polite"></output><div class="toetsen">' +
    kn.map(k => '<button type="button" data-a="ct" data-k="' + k[0] + '" class="' + (k[1] || '') + '"' + (naam[k[0]] ? ' aria-label="' + naam[k[0]] + '"' : '') + '>' + (toon[k[0]] || k[0]) + '</button>').join('') + '</div></div>';
}

function calcEenvoudig() {
  const kn = [['AC','op rood breed'],['%','op'],['÷','op'],['7'],['8'],['9'],['×','op'],['4'],['5'],['6'],['−','op'],['1'],['2'],['3'],['+','op'],['0'],[','],['=','is2']];
  const naam = {'AC':'alles wissen','%':'procent','÷':'gedeeld door','×':'maal','−':'min','+':'plus',',':'komma','=':'is gelijk aan'};
  return '<div class="rm paneel eenvoudig" id="calc" role="group" aria-label="Rekenmachine"><div class="paneelkop"><b>Rekenmachine</b><button type="button" class="sluit" data-a="calc" aria-label="Sluit de rekenmachine">×</button></div><output aria-live="polite"></output><div class="toetsen">' +
    kn.map(k => '<button type="button" data-a="ct" data-k="' + k[0] + '" class="' + (k[1] || '') + '"' + (naam[k[0]] ? ' aria-label="' + naam[k[0]] + '"' : '') + '>' + k[0] + '</button>').join('') + '</div></div>';
}

/* ---------- woordenboek ---------- */
function wbLijst(q, zoek) {
  zoek = (zoek || '').trim().toLowerCase();
  const tekst = (q ? q.q : '').toLowerCase();
  let rij;
  if (zoek) rij = WOORDEN.filter(w => w[0].indexOf(zoek) >= 0 || zoek.indexOf(w[0]) >= 0);
  else rij = WOORDEN.filter(w => tekst.indexOf(w[0]) >= 0);
  const kop = zoek ? (rij.length ? '' : '<p class="klein">Dit woord staat niet in het woordenboek. Vraag het aan je leerkracht.</p>') : (rij.length ? '<p class="klein">Woorden uit deze vraag:</p>' : '<p class="klein">Typ een woord om het op te zoeken.</p>');
  return kop + '<dl>' + rij.map(w => '<dt>' + esc(w[0]) + '</dt><dd>' + wis(esc(w[1])) + '</dd>').join('') + '</dl>';
}
function wbHtml(q) {
  return '<div class="wb paneel" id="wb" role="group" aria-label="Woordenboek"><div class="paneelkop"><b>Woordenboek</b><button type="button" class="sluit" data-a="wb" aria-label="Sluit het woordenboek">×</button></div>' +
    '<input type="search" id="wbz" placeholder="Zoek een woord" autocomplete="off" aria-label="Zoek een woord"><div id="wbl">' + wbLijst(q, '') + '</div></div>';
}


/* ---------- formularium (omtrek, oppervlakte en inhoud) ---------- */
const FORMULES = [
  ['Rechthoek', 'omtrek = 2 · (l + b)', 'oppervlakte = l · b'],
  ['Vierkant', 'omtrek = 4 · z', 'oppervlakte = z · z'],
  ['Driehoek', 'omtrek = som van de zijden', 'oppervlakte = {{b · h|2}}'],
  ['Cirkel', 'omtrek = 2 · π · r', 'oppervlakte = π · r · r'],
  ['Parallellogram', '', 'oppervlakte = b · h'],
  ['Trapezium', '', 'oppervlakte = {{(B + b) · h|2}}'],
  ['Ruit', '', 'oppervlakte = {{D · d|2}}'],
  ['Balk', '', 'inhoud = l · b · h'],
  ['Kubus', '', 'inhoud = r · r · r'],
  ['Cilinder', '', 'inhoud = π · r · r · h']];
function formHtml() {
  const lijst = STROOM === 'B' ? FORMULES.filter(f => ['Parallellogram', 'Trapezium', 'Ruit', 'Cilinder'].indexOf(f[0]) < 0) : FORMULES;
  return '<div class="wb paneel formpaneel" id="form" role="group" aria-label="Formularium"><div class="paneelkop"><b>Formularium</b><button type="button" class="sluit" data-a="form" aria-label="Sluit het formularium">×</button></div>' +
    '<dl class="formlijst">' + lijst.map(f => '<dt>' + f[0] + '</dt><dd>' + [f[1], f[2]].filter(x => x).map(wis).join('<br>') + '</dd>').join('') + '</dl><p class="klein">π ≈ 3,14</p></div>';
}
/* ---------- invulvakken: getal, breuk, gemengd getal, macht ---------- */
const VORMEN = [['getal', 'Getal', '12'], ['breuk', 'Breuk', '<span class="br mini"><span class="bt">a</span><span class="bn">b</span></span>'],
  ['gemengd', 'Gemengd getal', '1<span class="br mini"><span class="bt">a</span><span class="bn">b</span></span>'], ['macht', 'Macht', 'x<sup>n</sup>']];
const getalTxt = s => String(s).replace(/-/g, '−').replace(/\./g, ',');
function fmtW(w) {
  w = String(w);
  if (w.indexOf('^') >= 0) { const [g, e] = w.split('^'); return getalTxt(g) + '<sup>' + getalTxt(e) + '</sup>'; }
  if (w.indexOf('/') >= 0) { const [t, n] = w.split('/'); return (t[0] === '-' ? '−' : '') + wis('{{' + t.replace('-', '') + '|' + n + '}}'); }
  return getalTxt(w);
}
function fmtInvoer(iv) {
  const e = s => esc(getalTxt(String(s).trim()));
  if (iv.vorm === 'breuk') return wis('{{' + e(iv.t) + '|' + e(iv.n) + '}}');
  if (iv.vorm === 'gemengd') return e(iv.a) + wis('{{' + e(iv.t) + '|' + e(iv.n) + '}}');
  if (iv.vorm === 'macht') return e(iv.g) + '<sup>' + e(iv.e) + '</sup>';
  const a = String(iv.a).trim();
  if (/^[^/^]+\/[^/^]+$/.test(a)) { const [t, n] = a.split('/'); return wis('{{' + e(t) + '|' + e(n) + '}}'); }
  if (/^[^/^]+\^[^/^]+$/.test(a)) { const [g, x] = a.split('^'); return e(g) + '<sup>' + e(x) + '</sup>'; }
  return e(a);
}
const metEenheid = (veld, kern) => (veld.voor ? esc(veld.voor) + ' ' : '') + kern + (veld.na ? ' ' + esc(veld.na) : '');
function juistTekst(q) {
  if (q.t === 'mc') return wis(q.o[0]);
  if (q.t === 'mk') return q.mk.map(i => wis(q.o[i])).join('; ');
  if (q.t === 'num') return q.velden.map(vd => metEenheid(vd, fmtW(vd.w))).join(' ');
  if (q.t === 'klik') return 'het punt dat groen gemarkeerd is';
  if (q.t === 'vak') return q.kaartjes.map((k, j) => wis(k) + ' → ' + wis(q.vakken[q.w[j]])).join('; ');
  if (q.t === 'volg') return q.kaartjes.map(wis).join(' &nbsp;·&nbsp; ');
  if (q.t === 'jf') return q.jf.map(r => wis(r.t) + ': ' + jfKol(q)[r.w ? 0 : 1]).join('; ');
  if (q.t === 'sym') return q.sym.rijen.map(r => wis((r.voor || '') + ' ' + r.w + ' ' + (r.na || ''))).join('; ');
  if (q.t === 'venn') return 'de gebieden die groen gekleurd zijn';
  if (q.t === 'cel') return q.cel.w.join(', ');
  return '';
}
const jfKol = q => q.kol || ['juist', 'fout'];
function jouwTekst(it) {
  const q = it.q;
  if (it.weetNiet) return 'ik weet het niet';
  if (q.t === 'mc') return wis(q.o[it.keuze]);
  if (q.t === 'mk') return it.mkSel.length ? it.mkSel.map(i => wis(q.o[i])).join('; ') : 'niets aangeklikt';
  if (q.t === 'num') return q.velden.map((vd, i) => metEenheid(vd, fmtInvoer(it.inv[i]))).join(' ');
  if (q.t === 'klik') return it.klik ? 'het punt dat ' + (it.juist ? 'groen' : 'rood') + ' gemarkeerd is' : 'geen punt';
  if (q.t === 'vak') return q.kaartjes.map((k, j) => wis(k) + ' → ' + (it.vak[j] >= 0 ? wis(q.vakken[it.vak[j]]) : 'niet geplaatst')).join('; ');
  if (q.t === 'volg') return it.volg.map(j => wis(q.kaartjes[j])).join(' &nbsp;·&nbsp; ');
  if (q.t === 'jf') return q.jf.map((r, i) => wis(r.t) + ': ' + (it.jf[i] >= 0 ? jfKol(q)[it.jf[i]] : '–')).join('; ');
  if (q.t === 'sym') return q.sym.rijen.map((r, i) => wis((r.voor || '') + ' ' + (it.sym[i] || '…') + ' ' + (r.na || ''))).join('; ');
  if (q.t === 'venn') return it.venn.length ? 'de gebieden die je kleurde' : 'niets gekleurd';
  if (q.t === 'cel') return it.cel.length ? it.cel.join(', ') : 'geen vak';
  return '';
}
function nieuwItem(q, lv) {
  const it = {q, lv, klaar:false, tip:false, plan:false, keuze:null, weetNiet:false};
  /* q.volgorde: vaste toonvolgorde (bv. figuur A, B, C, D), terwijl q.o[0] het juiste antwoord blijft */
  if (q.t === 'mc') it.volg = q.volgorde ? q.volgorde.slice() : q.vast ? q.o.map((x, i) => i) : schud(q.o.map((x, i) => i));
  if (q.t === 'jf') it.jf = q.jf.map(() => -1);
  if (q.t === 'sym') { it.sym = q.sym.rijen.map(() => ''); it.symSel = 0; }
  if (q.t === 'venn') it.venn = [];
  if (q.t === 'cel') it.cel = [];
  if (q.t === 'mk') {
    const idx = q.o.map((x, i) => i), laatste = idx.filter(i => /^geen van bovenstaande/i.test(q.o[i]));
    it.volg = q.vast ? idx : schud(idx.filter(i => laatste.indexOf(i) < 0)).concat(laatste); it.mkSel = [];
  }
  if (q.t === 'num') { it.inv = q.velden.map(() => ({vorm:'getal', a:'', t:'', n:'', g:'', e:''})); it.actief = 0; }
  if (q.t === 'klik') it.klik = null;
  if (q.t === 'vak') { it.vak = q.kaartjes.map(() => -1); it.selKaart = null; }
  if (q.t === 'volg') {
    const idx = q.kaartjes.map((k, i) => i); let s;
    do { s = schud(idx); } while (s.every((x, i) => x === i));
    it.volg = s; it.selKaart = null;
  }
  return it;
}
function kanBevestigen(it) {
  const q = it.q;
  if (q.t === 'mc') return ses.sel != null;
  if (q.t === 'mk') return it.mkSel.length > 0;
  if (q.t === 'num') return it.inv.every(iv => !invoerLeeg(iv));
  if (q.t === 'klik') return !!it.klik;
  if (q.t === 'vak') return it.vak.every(x => x >= 0);
  if (q.t === 'jf') return it.jf.every(x => x >= 0);
  if (q.t === 'sym') return it.sym.every(x => x);
  if (q.t === 'venn') return it.venn.length > 0;
  if (q.t === 'cel') return it.cel.length > 0;
  return true;
}
function beoordeel(it) {
  const q = it.q;
  if (q.t === 'mc') return {juist:it.keuze === 0};
  if (q.t === 'mk') return {juist:it.mkSel.length === q.mk.length && q.mk.every(i => it.mkSel.indexOf(i) >= 0)};
  if (q.t === 'num') {
    const r = q.velden.map((vd, i) => keurVeld(vd, it.inv[i]));
    return {juist:r.every(x => x.juist), vormFout:r.some(x => x.vormFout) && r.every(x => x.juist || x.vormFout)};
  }
  if (q.t === 'klik') return {juist:!!it.klik && (q.ok ? !!q.ok(it.klik) : it.klik.x === q.w.x && it.klik.y === q.w.y)};
  if (q.t === 'jf') return {juist:q.jf.every((r, i) => it.jf[i] === (r.w ? 0 : 1))};
  if (q.t === 'sym') return {juist:q.sym.rijen.every((r, i) => it.sym[i] === r.w)};
  if (q.t === 'venn') { const a = it.venn.slice().sort().join(), b = q.venn.w.slice().sort().join(); return {juist:a === b}; }
  if (q.t === 'cel') { const a = it.cel.slice().sort().join(), b = q.cel.w.slice().sort().join(); return {juist:a === b}; }
  if (q.t === 'vak') return {juist:it.vak.every((x, j) => x === q.w[j])};
  if (q.t === 'volg') return {juist:it.volg.every((x, i) => x === i)};
  return {juist:false};
}
const INSTRUCTIE = {
  mc:'Klik het enige juiste antwoord aan.',
  mk:'Klik alle juiste antwoorden aan. Door nog eens te klikken, maak je je keuze ongedaan.',
  num:'Typ het antwoord in het invulvak.',
  klik:'Klik op de juiste plaats. Wil je je antwoord verwijderen, klik dan nog eens op dezelfde plaats.',
  vak:'Sleep elk kaartje naar het juiste vak. Je kan ook eerst op een kaartje en daarna op een vak klikken.',
  volg:'Sleep de kaartjes in de juiste volgorde. Je kan ook op twee kaartjes na elkaar klikken om ze van plaats te wisselen.',
  jf:'Klik in elke rij één bolletje aan.',
  sym:'Klik op een leeg vakje en daarna op het passende symbool in de grijze balk.',
  venn:'Klik op de gebieden die je wil kleuren. Klik nog eens om een kleur weg te halen.',
  cel:'Klik op het juiste vak. Klik nog eens om je keuze weg te halen.'
};
/* juist/fout-tabel: in elke rij één bolletje */
function jfHtml(it) {
  const q = it.q, kol = jfKol(q);
  return '<table class="jftab"><thead><tr><th scope="col"><span class="vh">Bewering</span></th>' + kol.map(k => '<th scope="col">' + esc(k) + '</th>').join('') + '</tr></thead><tbody>' +
    q.jf.map((r, i) => '<tr' + (it.klaar ? ' class="' + (it.jf[i] === (r.w ? 0 : 1) ? 'goed' : 'fout') + '"' : '') + '><th scope="row">' + wis(r.t) + '</th>' + kol.map((k, c) => {
      const aan = it.jf[i] === c, juist = it.klaar && (r.w ? 0 : 1) === c;
      return '<td><button type="button" class="jfb' + (aan ? ' aan' : '') + (juist ? ' juistk' : '') + '" role="radio" aria-checked="' + aan + '" aria-label="' + esc(platte(r.t)) + ': ' + esc(k) + '" data-a="jf" data-r="' + i + '" data-c="' + c + '" data-fk="jf' + i + c + '"' + (it.klaar ? ' disabled' : '') + '></button></td>';
    }).join('') + '</tr>').join('') + '</tbody></table>';
}
/* symbolen invullen: klik op een vakje en daarna op een symbool uit de balk */
function symHtml(it) {
  const q = it.q;
  const balk = it.klaar ? '' : '<div class="symbalk" role="group" aria-label="Symbolen">' + q.sym.palet.map(p => '<button type="button" class="symk" data-a="symk" data-s="' + esc(p) + '" data-fk="sk' + esc(p) + '">' + wis(p) + '</button>').join('') + '</div>';
  return '<div class="symvak">' + balk + q.sym.rijen.map((r, i) => {
    let cls = 'symb' + (!it.klaar && it.symSel === i ? ' gekozen' : '');
    if (it.klaar) cls += it.sym[i] === r.w ? ' goed' : ' fout';
    return '<div class="symrij"><span>' + wis(r.voor || '') + '</span><button type="button" class="' + cls + '" data-a="symvak" data-i="' + i + '" data-fk="sv' + i + '" aria-label="Vakje ' + (i + 1) + '"' + (it.klaar ? ' disabled' : '') + '>' + (it.sym[i] ? wis(it.sym[i]) : '&nbsp;') + '</button><span>' + wis(r.na || '') + '</span>' +
      (it.klaar && it.sym[i] !== r.w ? '<span class="klein">juist: ' + wis(r.w) + '</span>' : '') + '</div>';
  }).join('') + '</div>';
}
/* venndiagram met 2 of 3 verzamelingen: gebieden aanklikken (gebied = som van 1 voor A, 2 voor B, 4 voor C; 0 = buiten) */
const VENN = {2:{c:[[125, 115], [195, 115]], r:72, w:320, h:225}, 3:{c:[[128, 98], [192, 98], [160, 154]], r:64, w:320, h:240}};
function vennGebied(n, x, y) {
  const V = VENN[n]; let g = 0;
  V.c.forEach((c, i) => { if ((x - c[0]) ** 2 + (y - c[1]) ** 2 <= V.r * V.r) g += 1 << i; });
  if (x < 8 || y < 8 || x > V.w - 8 || y > V.h - 8) return -1;
  return g;
}
let vennNr = 0;
function vennSvg(q, sel, juist, klik) {
  const n = q.venn.n, V = VENN[n], L = q.venn.labels || ['A', 'B', 'C'], id = 'vn' + (++vennNr);
  /* kleur per gebied: gekozen (blauw), na verbeteren juist (groen), vergeten (groen gestreept) of fout (rood) */
  const kleur = {};
  (sel || []).forEach(g => kleur[g] = 'sel');
  if (juist) { (sel || []).forEach(g => kleur[g] = juist.indexOf(g) >= 0 ? 'ok' : 'fout'); juist.forEach(g => { if (!kleur[g]) kleur[g] = 'mis'; }); }
  let defs = '';
  V.c.forEach((c, i) => { defs += '<clipPath id="' + id + 'c' + i + '"><circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + V.r + '"/></clipPath>'; });
  let vlakken = '';
  Object.keys(kleur).forEach(gs => {
    const g = Number(gs);
    defs += '<mask id="' + id + 'm' + g + '"><rect x="0" y="0" width="' + V.w + '" height="' + V.h + '" fill="#fff"/>' + V.c.map((c, i) => (g >> i) & 1 ? '' : '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + V.r + '" fill="#000"/>').join('') + '</mask>';
    let vorm = '<rect x="8" y="8" width="' + (V.w - 16) + '" height="' + (V.h - 16) + '" class="vg-' + kleur[g] + '"/>';
    V.c.forEach((c, i) => { if ((g >> i) & 1) vorm = '<g clip-path="url(#' + id + 'c' + i + ')">' + vorm + '</g>'; });
    vlakken += '<g mask="url(#' + id + 'm' + g + ')">' + vorm + '</g>';
  });
  let s = '<defs>' + defs + '</defs><rect x="8" y="8" width="' + (V.w - 16) + '" height="' + (V.h - 16) + '" rx="10" fill="var(--wit)" stroke="var(--inkt2)" stroke-width="1.5"/>' + vlakken;
  V.c.forEach(c => { s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + V.r + '" fill="none" stroke="var(--inkt)" stroke-width="2"/>'; });
  const lp = n === 2 ? [[52, 40], [268, 40]] : [[52, 36], [268, 36], [252, 214]];
  lp.forEach((p, i) => { s += '<text class="ftxt" x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle" font-weight="700" font-style="italic">' + L[i] + '</text>'; });
  if (q.venn.punten) q.venn.punten.forEach(p => { s += '<text class="ftxt" x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle">' + p[2] + '</text>'; });
  return '<svg class="vennk' + (klik ? ' klikbaar' : '') + '" viewBox="0 0 ' + V.w + ' ' + V.h + '" style="max-width:' + V.w + 'px"' + (klik ? ' data-fk="venn" tabindex="0" role="application"' : ' role="img"') + ' aria-label="Venndiagram met ' + n + ' verzamelingen' + (klik ? '. Klik op een gebied om het te kleuren.' : '') + '" xmlns="http://www.w3.org/2000/svg">' + s + '</svg>';
}
function vennHtml(it) { return '<div class="roostervak">' + vennSvg(it.q, it.venn, it.klaar ? it.q.venn.w : null, !it.klaar) + '</div>'; }
function vennPunt(svgEl, e) {
  const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
}
/* rooster met letters en cijfers (bv. een plattegrond): een vak aanklikken */
function celHtml(it) {
  const q = it.q, c = q.cel, C = 40, P = 26;
  const W = c.kol.length * C + P, H = c.rij * C + P;
  let s = '';
  for (let i = 0; i < c.kol.length; i++) s += '<text class="fklein" x="' + (P + i * C + C / 2) + '" y="18" text-anchor="middle" font-weight="700">' + c.kol[i] + '</text>';
  for (let j = 0; j < c.rij; j++) s += '<text class="fklein" x="12" y="' + (P + j * C + C / 2 + 5) + '" text-anchor="middle" font-weight="700">' + (j + 1) + '</text>';
  for (let i = 0; i < c.kol.length; i++) for (let j = 0; j < c.rij; j++) {
    const naam = c.kol[i] + (j + 1), aan = it.cel.indexOf(naam) >= 0, juist = it.klaar && c.w.indexOf(naam) >= 0;
    const cls = it.klaar ? (aan && juist ? 'cel-ok' : aan ? 'cel-fout' : juist ? 'cel-mis' : '') : aan ? 'cel-aan' : '';
    s += '<rect class="celr ' + cls + '" data-cel="' + naam + '" x="' + (P + i * C) + '" y="' + (P + j * C) + '" width="' + C + '" height="' + C + '"/>';
  }
  (c.dingen || []).forEach(d => { const i = c.kol.indexOf(d[0][0]), j = Number(d[0].slice(1)) - 1; s += '<text class="ftxt celtxt" x="' + (P + i * C + C / 2) + '" y="' + (P + j * C + C / 2 + 6) + '" text-anchor="middle">' + d[1] + '</text>'; });
  return '<div class="roostervak"><svg class="celrooster' + (it.klaar ? '' : ' klikbaar') + '" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px" role="application" aria-label="Rooster met kolommen ' + c.kol.split('').join(', ') + ' en rijen 1 tot ' + c.rij + '" xmlns="http://www.w3.org/2000/svg">' + s + '</svg></div>';
}
function invulHtml(it) {
  const q = it.q, dicht = it.klaar ? ' disabled' : '';
  const inp = (i, k, cls, lab) => '<input class="iv ' + (cls || '') + '" data-i="' + i + '" data-k="' + k + '" data-fk="iv' + i + k + '" value="' + esc(it.inv[i][k]) + '" autocomplete="off" spellcheck="false" aria-label="' + lab + '"' + dicht + '>';
  const velden = q.velden.map((vd, i) => {
    const iv = it.inv[i], nr = q.velden.length > 1 ? ' ' + (i + 1) : '';
    let vak;
    if (iv.vorm === 'breuk') vak = '<span class="ivbr">' + inp(i, 't', 'kort', 'Teller' + nr) + '<span class="ivlijn"></span>' + inp(i, 'n', 'kort', 'Noemer' + nr) + '</span>';
    else if (iv.vorm === 'gemengd') vak = inp(i, 'a', 'kort', 'Geheel getal' + nr) + '<span class="ivbr">' + inp(i, 't', 'kort', 'Teller' + nr) + '<span class="ivlijn"></span>' + inp(i, 'n', 'kort', 'Noemer' + nr) + '</span>';
    else if (iv.vorm === 'macht') vak = '<span class="ivmacht">' + inp(i, 'g', 'kort', 'Grondtal' + nr) + inp(i, 'e', 'exp', 'Exponent' + nr) + '</span>';
    else vak = inp(i, 'a', '', 'Antwoord' + nr);
    return (vd.voor ? '<span class="eenh">' + wis(esc(vd.voor)) + '</span>' : '') + '<span class="ivvak' + (it.actief === i && !it.klaar ? ' actief' : '') + '">' + vak + '</span>' + (vd.na ? '<span class="eenh">' + wis(esc(vd.na)) + '</span>' : '');
  }).join('');
  const act = it.inv[it.actief || 0];
  const balk = it.klaar ? '' : '<div class="schrijf" role="group" aria-label="Schrijfwijze van het invulvak"><span class="klein">Schrijfwijze:</span>' +
    VORMEN.map(f => '<button type="button" class="vormknop" data-a="vorm" data-v="' + f[0] + '" aria-pressed="' + (act.vorm === f[0]) + '" title="' + f[1] + '"><span class="ic">' + f[2] + '</span>' + f[1] + '</button>').join('') + '</div>';
  return '<div class="invul">' + velden + '</div>' + balk;
}
function vakHtml(it) {
  const q = it.q;
  const kaart = j => {
    let cls = 'kaartje' + (it.selKaart === j ? ' gekozen' : '');
    if (it.klaar && it.vak[j] >= 0) cls += it.vak[j] === q.w[j] ? ' goed' : ' fout';
    return '<button type="button" class="' + cls + '" data-a="kaart" data-kaart="' + j + '" data-fk="k' + j + '" draggable="' + !it.klaar + '" aria-pressed="' + (it.selKaart === j) + '"' + (it.klaar ? ' disabled' : '') + '>' + wis(q.kaartjes[j]) + '</button>';
  };
  const inZone = z => q.kaartjes.map((k, j) => j).filter(j => it.vak[j] === z).map(kaart).join('');
  const los = inZone(-1);
  return (it.klaar && !los ? '' : '<div class="stapel" data-a="zone" data-zone="-1" aria-label="Kaartjes die nog niet geplaatst zijn">' + (los || '<span class="klein">Alle kaartjes zijn geplaatst.</span>') + '</div>') +
    '<div class="vakken">' + q.vakken.map((vk, z) => '<div class="vak" data-a="zone" data-zone="' + z + '" data-fk="z' + z + '"><div class="vaknaam">' + wis(vk) + '</div><div class="vakin">' + inZone(z) + '</div></div>').join('') + '</div>';
}
function volgHtml(it) {
  const q = it.q;
  return '<ol class="volgrij">' + it.volg.map((j, pos) => {
    let cls = 'kaartje' + (it.selKaart === pos ? ' gekozen' : '');
    if (it.klaar) cls += j === pos ? ' goed' : ' fout';
    return '<li><button type="button" class="' + cls + '" data-a="kaart" data-pos="' + pos + '" data-fk="p' + pos + '" draggable="' + !it.klaar + '" aria-pressed="' + (it.selKaart === pos) + '"' + (it.klaar ? ' disabled' : '') + '>' + wis(q.kaartjes[j]) + '</button></li>';
  }).join('') + '</ol>' + (it.klaar && !it.juist ? '<p class="klein">Juiste volgorde: ' + juistTekst(q) + '</p>' : '');
}

/* ---------- reeksen ----------
   soort: 'oefen' (met uitleg, past zich aan), 'toets' (oefentoets, past zich aan), 'doel' (werk aan je doelen),
          'ladder' (stap voor stap: dezelfde situatie steeds moeilijker), 'fout' (mijn fouten), 'proef' (proeftoets in drie delen) */
let ses = null;
const si = () => STROOM === 'B' ? 1 : 0;
const gezien = id => (S.q[id] || [0, -1])[0];
/* vragen van de pool: met een doel voor deze stroom, thema niet verborgen */
const inPool = q => q.lv[si()] > 0 && !verborgen(q.d);
const foutenLijst = () => VRAGEN.filter(q => inPool(q) && (S.q[q.id] || [0, -1])[1] === 0);
function nieuweTheta(th, b, r, i, gok) {
  // kans op een juist antwoord (gokkans 25 % bij meerkeuze, bijna 0 bij invullen); stapgrootte wordt kleiner naarmate de reeks vordert
  gok = gok == null ? 0.25 : gok;
  const p = gok + (1 - gok) / (1 + Math.exp(-1.3 * (th - b)));
  const K = Math.max(0.5, 1.6 / (1 + 0.35 * i));
  return clamp(th + K * (r - p), 0.6, 5.4);
}
const gokKans = q => q.t === 'mc' ? 1 / Math.max(2, (q.o || []).length) : q.t === 'jf' ? 0.25 : 0.05;
function maakUit(q) { return q.gen ? maakVraag(q) : q; }
/* kies uit kandidaten: eerst wat de leerling het minst zag, en liefst een ander doel dan eerder in deze reeks */
function kiesUit(c) {
  const codes = ses.items.map(it => it.q.codes && it.q.codes[STROOM]);
  const vorige = ses.items.length ? ses.items[ses.items.length - 1].q.id : null;
  c = c.filter(q => q.id !== vorige && (q.gen ? (ses.gebruikt[q.id] || 0) < 2 : !ses.gebruikt[q.id]));
  if (!c.length) return null;
  const score = q => (q.gen ? gezien(q.id) / 3 : gezien(q.id)) + (codes.indexOf(q.codes[STROOM]) >= 0 ? 1.5 : 0) + 0.6 * (ses.gebruikt[q.id] || 0);
  const min = Math.min.apply(null, c.map(score));
  c = c.filter(q => score(q) <= min + 0.01);
  return c[rand(c.length)];
}
function kiesVraag() {
  const s = ses.si;
  if (ses.soort === 'fout') { const id = ses.lijst[ses.items.length]; const q = VRAGEN.find(x => x.id === id); return q ? {q:maakUit(q), lv:q.lv[s]} : null; }
  if (ses.soort === 'ladder') { const q = ses.ladder[ses.items.length]; return q ? {q, lv:q.lv[s]} : null; }
  if (ses.soort === 'doel') {
    for (let k = 0; k < ses.doelen.length; k++) {
      const code = ses.doelen[(ses.items.length + k) % ses.doelen.length];
      const q = kiesUit(VRAGEN.filter(x => inPool(x) && x.codes[STROOM] === code));
      if (q) return {q:maakUit(q), lv:q.lv[s]};
    }
    return null;
  }
  const d = ses.thema, L = clamp(Math.round(ses.th), 2, 5);
  const pool = l => VRAGEN.filter(q => q.d === d && q.lv[s] === l);
  for (const stap of [0, -1, 1, -2, 2, -3, 3]) {
    const l = L + stap; if (l < 2 || l > 5) continue;
    const q = kiesUit(pool(l)); if (q) return {q:maakUit(q), lv:l};
  }
  return null;
}
function start(thema, soort, n, extra) {
  ses = {thema, soort, si:si(), modus:soort === 'toets' || soort === 'proef' ? 't' : 'o', n, th:3, items:[], gebruikt:{}, begin:Date.now(), tips:0, klaar:false};
  Object.assign(ses, extra || {});
  if (soort === 'fout') { ses.lijst = schud(foutenLijst().map(q => q.id)).slice(0, 10); ses.n = ses.lijst.length; }
  else if (soort === 'oefen' || soort === 'toets') ses.th = S.th[thema] || 3;
  else if (soort === 'proef') ses.th = 3;
  navActief = soort === 'proef' ? ses.proef.k : soort === 'fout' ? 'fout' : thema;
  tekenNav();
  volgende();
}
function volgende() {
  if (ses.items.length >= ses.n) return einde(false);
  const k = kiesVraag(); if (!k) return einde(false);
  ses.gebruikt[k.q.id] = (ses.gebruikt[k.q.id] || 0) + 1;
  ses.items.push(nieuwItem(k.q, k.lv));
  ses.sel = null; ses.stop = false; ses.paneel = null; calc.uit = ''; calc.net = false; calc.breuk = false;
  toonVraag();
}
const huidig = () => ses.items[ses.items.length - 1];
function antwoord(weetNiet) {
  const it = huidig(); if (it.klaar) return;
  if (it.q.t === 'mc') it.keuze = weetNiet ? -1 : ses.sel;
  it.weetNiet = !!weetNiet;
  const r = weetNiet ? {juist:false} : beoordeel(it);
  it.juist = r.juist; it.vormFout = !it.juist && !!r.vormFout; it.klaar = true; it.selKaart = null;
  if (ses.soort === 'oefen' || ses.soort === 'toets' || ses.soort === 'proef') ses.th = nieuweTheta(ses.th, it.lv, it.juist ? 1 : 0, ses.items.length - 1, gokKans(it.q));
  S.q[it.q.id] = [gezien(it.q.id) + 1, it.juist ? 1 : 0];
  registreer(it.q, it.juist);
  bewaar();
  /* dashboard: juist of fout per vraag (vraag-id = thema_vraag); de proeftoets telt apart via CLtoets */
  if (ses.soort !== 'proef') CLres(it.q.d + '_' + it.q.id, it.juist);
  if (ses.modus === 't') volgende(); else toonVraag();
}
function einde(hoe) {
  ses.klaar = true; ses.gestopt = hoe === true;
  const af = ses.items.filter(i => i.klaar); ses.items = af;
  ses.juist = af.filter(i => i.juist).length;
  if (ses.soort === 'oefen' || ses.soort === 'toets') { if (af.length >= 5) S.th[ses.thema] = ses.th; }
  if (ses.soort === 'proef') {
    /* een deel van de proeftoets: niet gemaakte vragen tellen als fout; de letter komt uit de schatting, zoals bij de toets */
    const P = ses.proef;
    P.res.push({k:ses.thema, j:ses.juist, t:ses.n, n:NIV[clamp(Math.round(ses.th), 1, 5)], items:af});
    if (P.deel + 1 < P.delen.length) { P.deel++; bewaar(); return toonTussen(); }
    const dag = new Date().toISOString().slice(0, 10), delen = {};
    let j = 0, t = 0;
    P.res.forEach(r => { delen[r.k] = {n:r.n, j:r.j, t:r.t}; j += r.j; t += r.t; });
    S.proef[P.k] = {d:dag, j, t, delen};
    bewaar();
    CLtoets(P.k + '_1', j, t);
    return toonProefResultaat();
  }
  bewaar();
  toonResultaat();
}
/* stap voor stap: een ladder maakt vier vragen met dezelfde situatie, van makkelijk naar moeilijk */
function startLadder(thema) {
  const lijst = LADDERS.filter(l => l.d === thema && l.s.indexOf(STROOM) >= 0);
  if (!lijst.length) return;
  const min = Math.min.apply(null, lijst.map(l => S.q['ladder_' + l.id] ? S.q['ladder_' + l.id][0] : 0));
  const kand = lijst.filter(l => (S.q['ladder_' + l.id] ? S.q['ladder_' + l.id][0] : 0) === min), L = kand[rand(kand.length)];
  S.q['ladder_' + L.id] = [((S.q['ladder_' + L.id] || [0])[0]) + 1, 1];
  const R = maakR(); let qs = null;
  for (let i = 0; i < 200 && !qs; i++) qs = L.maak(R);
  const vr = qs.map((o, i) => {
    const code = o.code, q = Object.assign({id:L.id + '_' + (i + 1), d:thema, codes:{[STROOM]:code}, lv:[0, 0], gemaakt:true}, o);
    q.lv[si()] = LIDX[code.split('-')[2][0]];
    q.calc = rekenSoort(thema, o.calc);
    if (STROOM === 'B' && q.calc === 'w') q.calc = 'e';
    q.t = o.velden ? 'num' : o.mk ? 'mk' : o.jf ? 'jf' : o.sym ? 'sym' : o.venn ? 'venn' : o.cel ? 'cel' : o.rooster ? 'klik' : o.kaartjes ? (o.vakken ? 'vak' : 'volg') : 'mc';
    if (q.velden) q.velden = q.velden.map(vd => Object.assign({}, vd, {w:typeof vd.w === 'number' ? wv(vd.w) : vd.w}));
    if (!q.o) q.o = [];
    return q;
  });
  start(thema, 'ladder', vr.length, {ladder:vr, ladderNaam:L.naam});
}
/* ---------- kop, zijbalk en schermen ---------- */
let scherm = '', navActief = 'thuis';
function setKop(titel, tag) {
  const t = document.getElementById('kopTitel'), g = document.getElementById('kopTag');
  if (t) t.innerHTML = titel; if (g) { g.innerHTML = tag || ''; g.hidden = !tag; }
}
const ICO = {
  thuis:'<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h5v-5.5h3V20h5V9.5"/>',
  wpo:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  get:'<path d="M7 3.5v7M3.5 7h7M14 7h6.5M4.5 14.5l5 5M9.5 14.5l-5 5M14 15.5h6.5M14 19h6.5"/>',
  alg:'<path d="M4 6.5c2.5 0 3.2 1.2 4.4 5.5S10.6 17.5 13 17.5M12.5 6.5c-2.2 0-3.6 3.3-4.1 5.5S6.6 17.5 4 17.5"/><path d="M15.5 9.5h5M18 7v5"/>',
  vvg:'<path d="M5 19 19 5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  ver:'<path d="M5 19 19 5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  mor:'<path d="M4 20 12 4l8 16z"/><path d="M8.5 20a3.5 3.5 0 0 0-1.6-2.9"/>',
  mei:'<path d="M3 17h18M6 7l12 0M8 20 16 4"/>',
  ooi:'<rect x="4" y="7" width="16" height="12" rx="1"/><path d="M4 7l4-3h12l-4 3M20 4v12l-4 3"/>',
  tra:'<path d="M12 3v18" stroke-dasharray="2 2"/><path d="M9 7 4 16h5zM15 7l5 9h-5z"/>',
  sta:'<path d="M3 20h18M6 20v-8M10.5 20V6M15 20v-5M19.5 20V9"/>',
  tad:'<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15"/>',
  vzm:'<circle cx="9" cy="12" r="5.6"/><circle cx="15" cy="12" r="5.6"/>',
  fout:'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  proef:'<rect x="5.5" y="4.5" width="13" height="16" rx="2"/><path d="M9 4.5V3h6v1.5M9 12.5l2 2 4-4"/>',
  doel:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  trap:'<path d="M4 19h4v-4h4v-4h4V7h4"/>'
};
const ico = k => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[ICO[k] ? k : isToets(k) ? 'proef' : 'thuis'] + '</svg>';
const navIco = k => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICO[ICO[k] ? k : isToets(k) ? 'proef' : 'thuis'] + '</svg>';
/* zijbalk in de stijl van het platform: Overzicht, de thema's met hun nummer, Mijn fouten, en na een lijn de proeftoetsen */
function tekenNav() {
  const nav = document.getElementById('nav'); if (!nav) return;
  const fouten = foutenLijst().length;
  const item = (k, nr, lbl) => '<li><button type="button" data-a="nav" data-d="' + k + '"' + (navActief === k ? ' aria-current="page"' : '') + '>' + navIco(k) + '<span class="n">' + (nr || '') + '</span><span class="lbl">' + esc(lbl) + '</span></button></li>';
  let h = item('thuis', '', 'Overzicht');
  let sep = false;
  SECTIONS.forEach(s => {
    if (verborgen(s.id)) return;
    if (isToets(s.id) && !sep) { sep = true; h += (fouten ? item('fout', '', 'Mijn fouten') : '') + '<li class="sep" aria-hidden="true"></li>'; }
    h += item(s.id, nrVan(s.id), s.nav);
  });
  if (!sep && fouten) h += item('fout', '', 'Mijn fouten');
  nav.innerHTML = h;
}
/* de hulpmiddelen werken ook als de vraag in de bordmodus of op volledig scherm staat (bord.js verplaatst de kaart) */
const wortel = () => document.querySelector('.px-board .wpkaart') || app;
const inSite = el => !!(el && el.closest && (app.contains(el) || el.closest('.px-board')));
function sluitBord() { const b = document.querySelector('.px-board'); if (b) { const k = b.querySelector('.px-bar button:last-of-type'); if (k) k.click(); } }
let vorigeSleutel = '';
function toon(naam, html) {
  const sleutel = naam + (naam === 'vraag' && ses ? ses.items.length : '');
  if (naam !== 'vraag') sluitBord();
  scherm = naam; document.body.classList.toggle('vraagmodus', naam === 'vraag');
  /* het onderdeel dat openstaat: id van de sectie (werktijd in aanmelden.js) en sleutel tab (Fout melden) */
  const ond = navActief || 'thuis';
  try { if (ond === 'thuis' || ond === 'fout') localStorage.removeItem(PREFIX + 'tab'); else localStorage.setItem(PREFIX + 'tab', ond); } catch (e) {}
  app.innerHTML = '<section class="group" id="' + esc(ond) + '">' + html + '</section>';
  const f = app.querySelector('[data-focus]'); if (f) f.focus({preventScroll:true});
  if (sleutel !== vorigeSleutel) window.scrollTo(0, 0);
  vorigeSleutel = sleutel;
}
const secHead = (titel, ic, nr) => '<div class="sec-head"><span class="sec-ic">' + ico(ic || 'thuis') + '</span><h2>' + (nr ? '<span class="num">' + nr + '.</span> ' : '') + titel + '</h2></div>';

/* ---------- letters (enkel voor leerkrachten) ---------- */
const LETTERUITLEG = {E:'E: D nog niet beheerst', '':'nog te weinig antwoorden'};
function letterRond(k, klein) {
  const l = letterVan(k), n = l.n;
  return '<div class="niv' + (n ? ' heeft' : '') + (klein ? ' klein' : '') + '" title="Leerkracht: ' + (n ? (LETTERUITLEG[n] || 'niveau ' + n) : LETTERUITLEG['']) + '"><div><b>' + (n || '–') + '</b><span>niveau</span></div></div>';
}
/* doelen van een thema: tellen per stand */
function doelTelling(k) {
  const c = doelenVan(k), st = c.map(doelStand);
  return {alle:c.length, ok:st.filter(x => x === 'ok').length, nog:st.filter(x => x === 'nog' || x === 'bezig').length};
}
function doelBalk(k) {
  const t = doelTelling(k), p = t.alle ? Math.round(t.ok / t.alle * 100) : 0;
  return '<div class="doelbalk" role="img" aria-label="' + t.ok + ' van ' + t.alle + ' doelen behaald"><span style="width:' + p + '%"></span></div><span class="reeks">' + t.ok + ' van ' + t.alle + ' doelen behaald' + (t.nog ? ' · ' + t.nog + ' nog oefenen' : '') + '</span>';
}
/* de doelen waaraan een leerling nog werkt: niet behaald maar wel geoefend, laagste letter eerst (de letter wordt niet getoond) */
const nogDoelen = k => doelenVan(k).filter(c => doelStand(c) === 'nog' || doelStand(c) === 'bezig');
const nieuweDoelen = k => doelenVan(k).filter(c => doelStand(c) === 'leeg' && VRAGEN.some(q => q.codes && q.codes[STROOM] === c));

function voorafLijst() {
  return '<ul class="vink vooraf">' +
    '<li>Kies links of hieronder een <span class="acc">thema</span>. Bij elk thema kan je <span class="acc">oefenen</span>, <span class="acc">werken aan je doelen</span> of een situatie <span class="acc">stap voor stap</span> uitwerken.</li>' +
    '<li>Er zijn <span class="acc">verschillende soorten vragen</span>: aanklikken, een antwoord typen, juist of fout aanduiden, klikken op een rooster of figuur, kaartjes slepen. Lees telkens de uitleg boven je antwoord.</li>' +
    '<li>Bij <span class="acc">Oefenen met uitleg</span> zie je na elke vraag meteen of je juist was, met de oplossingsmethode. Veel opgaven krijgen telkens <span class="acc">nieuwe getallen</span>.</li>' +
    '<li>Antwoord je juist, dan wordt de volgende vraag <span class="acc">moeilijker</span>. Antwoord je fout, dan wordt ze makkelijker.</li>' +
    '<li>Weet je het antwoord niet? Klik op <span class="acc">Ik weet het niet</span>. Gok niet: dan krijg je vragen die bij jou passen.</li>' +
    '<li>Bij elk thema zie je welke <span class="acc">doelen</span> je al bereikt hebt en waaraan je nog werkt. Een doel is bereikt als je de laatste keren meestal juist antwoordde.</li>' +
    (STROOM === 'B' ? '<li>Boven de vraag vind je de <span class="acc">Markeerstift</span>, het <span class="acc">Woordenboek</span> en soms de <span class="acc">Rekenmachine</span>. Staat de rekenmachine er niet, dan reken je zonder. De <span class="acc">formules</span> die je nodig hebt, staan in een kader bij de vraag.</li>'
      : '<li>Boven de vraag vind je de <span class="acc">Markeerstift</span>, het <span class="acc">Woordenboek</span> en soms de <span class="acc">Rekenmachine</span> of het <span class="acc">Formularium</span>. Staat de rekenmachine er niet, dan reken je zonder.</li>') +
    '<li>Wil je een stuk tekst laten <span class="acc">voorlezen</span>? Zet links Voorlezen aan en selecteer de tekst.</li></ul>';
}

const KOP = 'Oefen <em>wiskundige problemen</em>';
function toonThuis() {
  navActief = 'thuis'; tekenNav();
  setKop(KOP, 'Kies een thema. Tover met talent: elke reeks maakt je sterker.');
  const lk = leerkracht();
  const kaart = t => '<article class="kaart dom' + (t.breed ? ' breed' : '') + '"><div class="card-head"><h3><span><span class="dnr">' + nrVan(t.k) + '.</span> ' + t.naam + '</span></h3></div>' + (lk ? letterRond(t.k) : '') +
    '<p class="oms">' + t.oms + '</p><div class="voet"><div class="voortg">' + doelBalk(t.k) + '</div><button class="knop" data-a="kies" data-d="' + t.k + '">Oefenen</button></div></article>';
  const fouten = foutenLijst().length, th = zichtbareThemas(), toetsen = TOETSEN.filter(t => !verborgen(t.k));
  toon('thuis',
    '<details class="kaart uitklap"' + (S.voorafGezien ? '' : ' open') + '><summary>Vooraf: zo werkt het</summary>' + voorafLijst() + '</details>' +
    (lk ? '<div class="lkinfo">Leerkracht: het bolletje toont de letter van je eigen oefenwerk (E = D nog niet beheerst). Leerlingen zien geen letters; hun letters en doelen staan in het dashboard.</div>' : '') +
    secHead('Kies een thema', 'thuis') +
    '<div class="domeinen">' + th.map(kaart).join('') +
    (fouten ? '<article class="kaart dom"><div class="card-head"><h3>Mijn fouten opnieuw</h3></div><p class="oms">Maak de vragen opnieuw die je de vorige keer fout had. Je krijgt uitleg na elke vraag.</p><div class="voet"><span class="reeks">' + fouten + (fouten === 1 ? ' vraag' : ' vragen') + ', hoogstens 10 per keer</span><button class="knop licht" data-a="fouten">Opnieuw proberen</button></div></article>' : '') +
    '</div>' +
    (toetsen.length ? secHead('Proeftoetsen', 'proef') + '<ul class="proeflijst">' + toetsen.map(proefRij).join('') + '</ul>' : ''));
  if (!S.voorafGezien) { S.voorafGezien = true; bewaar(); }
}
function proefRij(t) {
  const v = S.proef[t.k], delen = t.delen.filter(k => !verborgen(k));
  return '<li class="proefrij"><span class="ic">' + ico('proef') + '</span><span class="pn">' + t.naam + '<span class="klein"> · ' + delen.map(k => themaVan(k).kort || themaVan(k).naam).join(', ') + '</span></span>' +
    (v ? '<span class="tag gd">Laatste poging: <b>' + v.j + '/' + v.t + '</b>' + (leerkracht() ? ' · ' + Object.keys(v.delen).map(k => '<span title="' + esc(themaVan(k).naam) + '">' + v.delen[k].n + '</span>').join(' ') : '') + '</span>' : '<span class="tag">nog niet gemaakt</span>') +
    '<button class="knop' + (v ? ' licht' : '') + '" data-a="nav" data-d="' + t.k + '">' + (v ? 'Opnieuw' : 'Bekijk') + '</button></li>';
}

/* ---------- een thema: oefenen, werken aan doelen, stap voor stap ---------- */
function toonKeuze(d) {
  navActief = d; tekenNav();
  const t = themaVan(d), nog = nogDoelen(d), nieuw = nieuweDoelen(d), tel = doelTelling(d);
  const heeftLadder = LADDERS.some(l => l.d === d && l.s.indexOf(STROOM) >= 0);
  setKop('<em>' + t.naam + '</em>', 'Kies hoe je wil oefenen.');
  const lijst = (codes, max) => '<ul class="doellijst">' + codes.slice(0, max).map(c => '<li>' + esc(doelTekst(c)) + '</li>').join('') + '</ul>' + (codes.length > max ? '<p class="klein">en nog ' + (codes.length - max) + ' andere</p>' : '');
  toon('keuze', secHead(t.naam, d, nrVan(d)) +
    '<div class="keuzerij">' +
    '<form class="kaart" data-f="keuze" data-d="' + d + '" style="display:grid;gap:14px">' +
    '<div class="card-head"><h3>Oefenen</h3></div>' +
    '<fieldset class="veld"><legend>Hoe wil je oefenen?</legend><div class="keuze">' +
    '<label><input type="radio" name="modus" id="modusO" value="oefen" checked><span><b>Met uitleg</b>Na elke vraag zie je of je antwoord juist is, met de oplossingsmethode.</span></label>' +
    '<label><input type="radio" name="modus" id="modusT" value="toets"><span><b>Als oefentoets</b>Geen tips en geen uitleg tussendoor. Je ziet alles op het einde.</span></label></div></fieldset>' +
    '<fieldset class="veld"><legend>Hoeveel vragen?</legend><div class="keuze">' +
    '<label><input type="radio" name="n" id="n10" value="10" checked><span><b>10 vragen</b>ongeveer 15 minuten</span></label>' +
    '<label><input type="radio" name="n" id="n20" value="20"><span><b>20 vragen</b>ongeveer 30 minuten</span></label></div></fieldset>' +
    '<div class="rij"><button class="knop" type="submit" data-focus>Start</button><button class="knop stil" type="button" data-a="thuis">Terug</button></div></form>' +
    '<div class="kolom">' +
    '<section class="kaart"><div class="card-head"><h3>Werk aan je doelen</h3></div>' + doelBalk(d) +
    (nog.length ? '<p class="klein" style="margin-top:8px">Hier werk je nog aan:</p>' + lijst(nog, 4) : tel.ok ? '<p class="klein" style="margin-top:8px">Je hebt nu geen doelen waar je fouten op maakte.' + (nieuw.length ? ' Probeer ook nieuwe doelen.' : '') + '</p>' : '<p class="klein" style="margin-top:8px">Begin met oefenen. Daarna zie je hier waaraan je nog moet werken.</p>') +
    '<div class="rij" style="margin-top:8px"><button class="knop licht" data-a="doel" data-d="' + d + '"' + (nog.length || nieuw.length ? '' : ' disabled') + '>' + ico('doel') + 'Werk aan je doelen</button></div></section>' +
    (heeftLadder ? '<section class="kaart"><div class="card-head"><h3>Stap voor stap</h3></div><p class="klein">Eén situatie, vier vragen die telkens wat moeilijker worden.</p><div class="rij" style="margin-top:8px"><button class="knop licht" data-a="ladder" data-d="' + d + '">' + ico('trap') + 'Start</button></div></section>' : '') +
    '</div></div>' + (leerkracht() ? lkDoelen(d) : ''));
}
/* leerkracht: alle doelen van het thema per letter, met de stand van het eigen oefenwerk */
function lkDoelen(d) {
  const codes = doelenVan(d), st = {ok:'✓', nog:'✗', bezig:'…', leeg:'·'};
  const aantal = c => VRAGEN.filter(q => q.codes && q.codes[STROOM] === c).length;
  return '<details class="kaart uitklap lkdoelen"><summary>Leerkracht: doelen per letter ' + letterRond(d, true) + '</summary>' +
    LETTERS.slice().reverse().map(L => '<div class="lkl"><b class="niv-l">' + L + '</b><ul>' + codes.filter(c => c.split('-')[2][0] === L).map(c =>
      '<li class="st-' + doelStand(c) + '"><span class="stt" aria-hidden="true">' + st[doelStand(c)] + '</span><span class="code">' + c + '</span> ' + esc(doelTekst(c)) + ' <span class="klein">(' + aantal(c) + ' vragen)</span></li>').join('') + '</ul></div>').join('') +
    '<p class="klein">' + esc(DOELKOP[STROOM + '-' + themaVan(d).code + '-D'] || '') + '</p></details>';
}

/* ---------- proeftoets: Wiskundige problemen oplossen en twee dieptethema's ---------- */
function toonProef(k) {
  navActief = k; tekenNav();
  const t = TOETSEN.find(x => x.k === k), v = S.proef[k], delen = t.delen.filter(x => !verborgen(x));
  setKop('<em>' + t.naam + '</em>', 'Werk rustig en alleen, zoals op een echte toets.');
  toon('proef', secHead(t.naam, 'proef', nrVan(k)) +
    '<section class="kaart"><div class="card-head"><h3>Zo werkt de proeftoets</h3></div><ul class="vink">' +
    '<li>De proeftoets heeft <span class="acc">' + delen.length + ' delen</span>: ' + delen.map(x => '<b>' + themaVan(x).naam + '</b>').join(', ') + '.</li>' +
    '<li>Elk deel telt <span class="acc">' + DEEL_N + ' vragen</span>. De vragen passen zich aan: na een juist antwoord wordt het moeilijker.</li>' +
    '<li>Je krijgt <span class="acc">geen tips en geen uitleg</span> tussendoor. Je kan niet terug naar een vorige vraag.</li>' +
    '<li>Na het laatste deel zie je je score per deel en alle vragen met de oplossingsmethode.</li>' +
    '<li>Je mag de proeftoets <span class="acc">opnieuw maken</span>. Je leerkracht ziet het resultaat van je laatste poging.</li></ul></section>' +
    (v ? '<div class="wmeld">Je laatste poging (' + new Date(v.d).toLocaleDateString('nl-BE') + '): <b>' + v.j + ' van de ' + v.t + '</b> juist' + Object.keys(v.delen).map(x => ' · ' + esc(themaVan(x).kort || themaVan(x).naam) + ' ' + v.delen[x].j + '/' + v.delen[x].t + (leerkracht() ? ' (' + v.delen[x].n + ')' : '')).join('') + '.</div>' : '') +
    '<div class="rij"><button class="knop" data-a="proefstart" data-d="' + k + '" data-focus>' + (v ? 'Maak de proeftoets opnieuw' : 'Start de proeftoets') + '</button><button class="knop stil" type="button" data-a="thuis">Terug</button></div>');
}
function startProef(k) {
  const t = TOETSEN.find(x => x.k === k), delen = t.delen.filter(x => !verborgen(x));
  if (!delen.length) return toonThuis();
  const proef = {k, naam:t.naam, delen, deel:0, res:[]};
  start(delen[0], 'proef', DEEL_N, {proef});
}
function toonTussen() {
  const P = ses.proef, vorig = P.res[P.res.length - 1], volg = P.delen[P.deel];
  setKop('<em>' + P.naam + '</em>', '');
  toon('tussen', '<section class="kaart"><div class="card-head"><h3>Deel ' + P.deel + ' van ' + P.delen.length + ' is klaar</h3></div>' +
    '<p>Je maakte het deel <b>' + themaVan(vorig.k).naam + '</b>. Neem even een korte pauze als je wil.</p>' +
    '<p>Volgend deel: <b>' + themaVan(volg).naam + '</b> (' + DEEL_N + ' vragen).</p>' +
    '<div class="rij"><button class="knop" data-a="proefverder" data-focus>Start deel ' + (P.deel + 1) + '</button></div></section>');
}
function toonProefResultaat() {
  const P = ses.proef, v = S.proef[P.k], lk = leerkracht();
  setKop('<em>' + P.naam + '</em> ingediend', '');
  const fout = [];
  P.res.forEach(r => r.items.forEach(it => { if (!it.juist && it.q.codes) fout.push(it.q.codes[STROOM]); }));
  const nog = [...new Set(fout)].filter(c => DOELEN[c]).slice(0, 6);
  toon('res', '<section class="kaart"><div class="card-head"><h3>Je had ' + v.j + ' van de ' + v.t + ' vragen juist</h3></div>' +
    '<table class="ftab deeltab"><thead><tr><th>Deel</th><th>Juist</th>' + (lk ? '<th>Niveau (leerkracht)</th>' : '') + '</tr></thead><tbody>' +
    P.res.map(r => '<tr><td>' + themaVan(r.k).naam + '</td><td class="num">' + r.j + ' van ' + r.t + '</td>' + (lk ? '<td><b class="niv-l">' + r.n + '</b></td>' : '') + '</tr>').join('') + '</tbody></table>' +
    (nog.length ? '<p class="klein" style="margin-top:10px">Hier werk je best nog aan:</p><ul class="doellijst">' + nog.map(c => '<li>' + esc(doelTekst(c)) + '</li>').join('') + '</ul>' : '') + '</section>' +
    '<div class="rij"><button class="knop" data-a="thuis" data-focus>Terug naar het overzicht</button><button class="knop licht" data-a="nav" data-d="' + P.k + '">Maak de proeftoets opnieuw</button></div>' +
    P.res.map((r, i) => '<details class="kaart uitklap"><summary>Deel ' + (i + 1) + ': ' + themaVan(r.k).naam + ' · alle vragen met uitleg</summary><div class="nakijk">' + nakijkLijst(r.items) + '</div></details>').join(''));
}

const PLAN = '<div class="hulp"><b>Stappenplan</b><ol><li>Lees de opgave twee keer. Wat wordt er precies gevraagd?</li><li>Welke gegevens heb je nodig? Welke niet? Markeer ze.</li><li>Maak een schets, tabel of schema.</li><li>Reken stap voor stap en schrijf elke stap op.</li><li>Controleer: klopt je antwoord met de vraag en met de eenheid?</li></ol></div>';
const CALCICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="5.5" width="8" height="3.5"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01" stroke-width="2.6" stroke-linecap="round"/></svg>';
const PENICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 4l5 5L10 19H5v-5z"/><path d="M4 22h9" stroke="var(--orange)" stroke-width="3"/></svg>';
const BOEKICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.3a2.8 2.8 0 1 1 3.6 2.7c-.6.3-.9.8-.9 1.4V14" stroke-linecap="round"/><path d="M12 17.2h.01" stroke-width="2.8" stroke-linecap="round"/></svg>';
const FORMICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>';
const mmss = t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
const tijd = () => mmss(Math.floor((Date.now() - ses.begin) / 1000));
const metForm = q => q.form;
/* formulekader naast de opgave (2B, 'met gegeven formularium'): enkel de formules die de vraag nodig heeft */
const formKader = q => q.fk ? '<div class="formkader" role="note" aria-label="Formules">' + q.fk.map(x => '<p>' + wis(x) + '</p>').join('') + '</div>' : '';
/* leerkracht: bij welk doel en welke letter een vraag hoort */
function lkCode(q) {
  const c = q.codes && q.codes[STROOM]; if (!c || !leerkracht()) return '';
  return '<p class="lkcode"><b class="niv-l">' + c.split('-')[2][0] + '</b> <span class="code">' + c + '</span> ' + esc(doelTekst(c) || DOELKOP[c.replace(/\d+$/, '')] || '') + '</p>';
}

function antwSectie() {
  const nr = ses.items.length, it = huidig(), q = it.q, oef = ses.modus === 'o', L = 'ABCDEFGH';
  let invoer = '';
  if (q.t === 'mc') {
    invoer = '<div class="opties' + (q.o.length > 4 || q.o.every(o => platte(String(o)).length < 11) ? ' opties2' : '') + '" role="radiogroup" aria-label="Kies één antwoord">' + it.volg.map((oi, p) => {
      let cls = '', merk = '';
      if (it.klaar) { if (oi === 0) { cls = ' juist'; merk = 'Juist antwoord'; } else if (oi === it.keuze) { cls = ' mis'; merk = 'Jouw antwoord'; } }
      return '<button type="button" class="optie' + cls + '" role="radio" aria-checked="' + (!it.klaar && ses.sel === oi) + '" data-a="sel" data-o="' + oi + '" data-fk="o' + oi + '"' + (it.klaar ? ' disabled' : '') + '><span class="let">' + L[p] + '</span><span class="txt">' + wis(q.o[oi]) + '</span>' + (merk ? '<span class="merk">' + merk + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  } else if (q.t === 'mk') {
    invoer = '<div class="opties" role="group" aria-label="Kies alle juiste antwoorden">' + it.volg.map(oi => {
      const aan = it.mkSel.indexOf(oi) >= 0, goed = q.mk.indexOf(oi) >= 0;
      let cls = ' vink', merk = '';
      if (it.klaar) { if (goed) { cls += ' juist'; merk = aan ? 'Juist' : 'Juist, niet aangeklikt'; } else if (aan) { cls += ' mis'; merk = 'Niet juist'; } }
      return '<button type="button" class="optie' + cls + '" role="checkbox" aria-checked="' + aan + '" data-a="mkx" data-o="' + oi + '" data-fk="o' + oi + '"' + (it.klaar ? ' disabled' : '') + '><span class="vakje" aria-hidden="true">' + (aan ? '✓' : '') + '</span><span class="txt">' + wis(q.o[oi]) + '</span>' + (merk ? '<span class="merk">' + merk + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  } else if (q.t === 'num') invoer = invulHtml(it);
  else if (q.t === 'klik') invoer = '<div class="roostervak">' + roosterSvg(q.rooster, {klik:!it.klaar, jouw:it.klik, juist:it.klaar && !q.ok ? q.w : it.klaar && !it.juist ? q.w : null, fout:it.klaar && !it.juist}) + '</div>';
  else if (q.t === 'vak') invoer = vakHtml(it);
  else if (q.t === 'volg') invoer = volgHtml(it);
  else if (q.t === 'jf') invoer = jfHtml(it);
  else if (q.t === 'sym') invoer = symHtml(it);
  else if (q.t === 'venn') invoer = vennHtml(it);
  else if (q.t === 'cel') invoer = celHtml(it);

  let onder;
  if (it.klaar) {
    const kopTxt = it.juist ? 'Juist!' : it.weetNiet ? 'Zo los je dit op.' : it.vormFout ? 'Bijna.' : 'Niet juist.';
    let extra = '';
    if (it.vormFout) extra += '<p class="juistreg">Je antwoord heeft de juiste waarde, maar het staat niet in de gevraagde schrijfwijze.</p>';
    if (!it.juist) {
      if (!it.weetNiet && ['mc', 'klik', 'volg', 'venn', 'cel', 'jf', 'sym'].indexOf(q.t) < 0) extra += '<p class="juistreg">Jouw antwoord: <b>' + jouwTekst(it) + '</b></p>';
      if (q.t === 'num' || q.t === 'vak' || q.t === 'mk') extra += '<p class="juistreg">Juist antwoord: <b>' + juistTekst(q) + '</b></p>';
      if (q.t === 'klik') extra += '<p class="juistreg">' + (q.ok ? 'Een juist punt is groen gemarkeerd' : 'Het juiste punt is groen gemarkeerd') + (it.klik ? ', jouw punt rood' : '') + '.</p>';
      if (q.t === 'venn') extra += '<p class="juistreg">Groen: juist gekleurd of had je moeten kleuren. Rood: had je niet moeten kleuren.</p>';
      if (q.t === 'cel') extra += '<p class="juistreg">Juist: <b>' + juistTekst(q) + '</b></p>';
    }
    onder = '<div class="terug ' + (it.juist ? 'goed' : 'fout') + '" role="status"><h3>' + kopTxt + '</h3>' + extra + '<p class="methode">Oplossingsmethode</p><div class="uitleg">' + alineas(q.u) + '</div>' + lkCode(q) + '</div>' +
      '<div class="rij eind"><button class="knop" data-a="verder" data-focus data-fk="verder">' + (nr >= ses.n ? 'Bekijk je resultaat' : 'Volgende vraag') + '</button></div>';
  } else if (ses.stop) {
    onder = ses.soort === 'proef' ? '<div class="wmeld">Wil je dit deel nu indienen? Vragen die je nog niet maakte, tellen als fout.</div><div class="rij eind"><button class="knop licht" data-a="stopnee">Nee, ga verder</button><button class="knop" data-a="stopja">Ja, dien in</button></div>'
      : '<div class="wmeld">Wil je stoppen? Je resultaat tot nu toe wordt bewaard.</div><div class="rij eind"><button class="knop licht" data-a="stopnee">Nee, ga verder</button><button class="knop" data-a="stopja">Ja, stop</button></div>';
  } else {
    onder = (oef && it.tip && q.tip ? '<div class="hulp"><b>Tip</b><br>' + wis(q.tip) + '</div>' : '') + (oef && it.plan ? PLAN : '') +
      '<div class="rij eind">' + (oef && q.tip && !it.tip ? '<button class="knop stil" data-a="tip">Geef een tip</button>' : '') + (oef && q.d === 'wpo' && !it.plan ? '<button class="knop stil" data-a="plan">Stappenplan</button>' : '') +
      '<button class="knop licht" data-a="weetniet">Ik weet het niet</button><button class="knop" data-a="bevestig" data-fk="bevestig"' + (kanBevestigen(it) ? '' : ' disabled') + '>' + (oef ? 'Bevestig' : 'Volgende →') + '</button></div>';
  }
  return '<p class="instr">' + INSTRUCTIE[q.t] + (q.t === 'num' && !it.klaar ? ' Een breuk of een macht nodig? Kies hieronder de schrijfwijze.' : '') + '</p>' + invoer + onder;
}
function tekenAntw() {
  const el = wortel().querySelector('.antw'); if (!el) return;
  const a = document.activeElement, fk = a && a.dataset ? a.dataset.fk : null;
  el.innerHTML = antwSectie();
  if (fk) { const f = el.querySelector('[data-fk="' + fk + '"]'); if (f) f.focus({preventScroll:true}); }
}
/* de vraag staat in één kaart (.card.wpkaart) met een kaartkop: zo krijgt ze van bord.js de knop Bord (leerkracht)
   of Volledig scherm (leerling). Staat de kaart op het bord, dan wordt ze ter plaatse bijgewerkt. */
function toonVraag() {
  const nr = ses.items.length, it = huidig(), q = it.q, oef = ses.modus === 'o';
  let balkjes = ''; for (let i = 1; i <= ses.n; i++) balkjes += '<i class="' + (i < nr ? 'af' : i === nr ? 'nu' : '') + '"></i>';
  const tools = '<div class="tools" role="toolbar" aria-label="Hulpmiddelen">' +
    '<button type="button" class="toolknop" data-a="marker" aria-pressed="' + !!ses.marker + '">' + PENICOON + 'Markeerstift</button>' +
    (q.calc ? '<button type="button" class="toolknop" data-a="calc" aria-expanded="' + (ses.paneel === 'calc') + '" aria-controls="calc">' + CALCICOON + 'Rekenmachine</button>' : '<span class="geencalc">Zonder rekenmachine</span>') +
    (metForm(q) ? '<button type="button" class="toolknop" data-a="form" aria-expanded="' + (ses.paneel === 'form') + '" aria-controls="form">' + FORMICOON + 'Formularium</button>' : '') +
    '<button type="button" class="toolknop" data-a="wb" aria-expanded="' + (ses.paneel === 'wb') + '" aria-controls="wb">' + BOEKICOON + 'Woordenboek</button></div>';
  const wat = ses.soort === 'proef' ? ses.proef.naam + ' · ' + themaVan(ses.thema).naam : ses.soort === 'fout' ? 'Mijn fouten opnieuw' : themaVan(ses.thema).naam;
  setKop('<em>' + esc(wat) + '</em>', '');
  /* bordmodus voor de leerkracht: de oplossingsmethode zin per zin als stappen (.sol) */
  const sols = leerkracht() && oef && !it.klaar ? q.u.split('\n').map(x => '<div class="sol" hidden>' + wis(x) + '</div>').join('') : '';
  const kop = (ses.soort === 'ladder' ? 'Stap ' : 'Vraag ') + nr + ' van ' + ses.n + (ses.soort === 'proef' ? ' · deel ' + (ses.proef.deel + 1) + ' van ' + ses.proef.delen.length : '');
  const doelRegel = ses.soort === 'doel' && q.codes ? '<p class="doelnu">' + ico('doel') + '<span>Je oefent: <b>' + esc(doelTekst(q.codes[STROOM])) + '</b></span></p>' : '';
  const lkTag = leerkracht() && q.codes ? '<span class="tag" title="' + esc(q.codes[STROOM] + ': ' + doelTekst(q.codes[STROOM])) + '">Leerkracht: niveau <b>' + NIV[it.lv] + '</b></span>' : '';
  const binnen =
    '<div class="vbalk"><div class="voortgang" role="img" aria-label="' + kop + '">' + balkjes + '</div>' +
    (oef ? lkTag : '<span class="tag" id="klok" aria-label="Verstreken tijd">⏱ ' + tijd() + '</span>' + lkTag) + tools +
    '<button class="knop stil" data-a="stop">' + (ses.soort === 'proef' ? 'Indienen' : 'Stoppen') + '</button></div>' + doelRegel +
    '<div class="vraag' + (q.breed ? ' breed' : '') + '"><section class="kaart opgave' + (ses.marker ? ' markeren' : '') + '" aria-label="Opgave">' +
    (ses.paneel === 'calc' && q.calc ? calcHtml(q.calc) : '') + (ses.paneel === 'wb' ? wbHtml(q) : '') + (ses.paneel === 'form' ? formHtml() : '') +
    (ses.marker ? '<p class="klein markuitleg">Markeerstift aan: selecteer woorden om ze te markeren. Klik op een markering om ze weg te halen.</p>' : '') +
    '<div class="tekst">' + (it.mark || alineas(q.q, true)) + '</div>' + formKader(q) + (q.fig ? figuur(q.fig) : '') + (sols ? '<div class="sols">' + sols + '</div>' : '') + '</section>' +
    '<section class="antw" aria-label="Antwoord">' + antwSectie() + '</section></div>';
  const opBord = document.querySelector('.px-board .wpkaart');
  if (opBord) {
    opBord.querySelector('.wpkop').textContent = kop; opBord.querySelector('.wpin').innerHTML = binnen;
    const f = opBord.querySelector('[data-focus]'); if (f) f.focus({preventScroll:true});
  } else {
    toon('vraag', '<div class="card wpkaart"><div class="card-head"><h3 class="wpkop">' + kop + '</h3></div><div class="wpin">' + binnen + '</div></div>');
  }
  if (ses.paneel === 'calc') calcScherm();
}
setInterval(() => {
  if (!ses || ses.klaar) return;
  const k = wortel().querySelector('#klok'); if (k) k.textContent = '⏱ ' + tijd();
}, 1000);

function nakijkLijst(af) {
  return af.map((it, i) => {
    const q = it.q, kern = platte(q.q.split('\n').pop());
    return '<details' + (!it.juist && af.filter(x => !x.juist).length <= 3 ? ' open' : '') + '><summary><span class="st ' + (it.juist ? 'j' : 'f') + '" aria-hidden="true">' + (it.juist ? '✓' : '✗') + '</span><span class="kort">Vraag ' + (i + 1) + ': ' + esc(kern) + '</span><span class="tag">' + (it.juist ? 'juist' : 'fout') + (leerkracht() ? ' · niveau ' + NIV[it.lv] : '') + '</span></summary><div class="in"><div class="tekst">' + alineas(q.q, true) + '</div>' + (q.fig ? figuur(q.fig) : '') +
      '<div class="jouw">' + (it.juist ? '' : '<div>Jouw antwoord: <b>' + jouwTekst(it) + '</b></div>') +
      (q.t === 'klik' ? '<div class="roostervak">' + roosterSvg(q.rooster, {jouw:it.klik, juist:q.w, alt:'Rooster met een juist punt in het groen'}) + '</div>' :
        q.t === 'venn' ? '<div class="roostervak">' + vennSvg(q, it.venn, q.venn.w, false) + '</div>' : '<div>Juist antwoord: <b>' + juistTekst(q) + '</b></div>') +
      (it.vormFout ? '<div class="klein">Je antwoord had de juiste waarde, maar niet de gevraagde schrijfwijze.</div>' : '') + '</div><p class="methode">Oplossingsmethode</p><div class="uitleg">' + alineas(q.u) + '</div>' + lkCode(q) + '</div></details>';
  }).join('');
}
function toonResultaat() {
  const af = ses.items, n = af.length, lk = leerkracht();
  tekenNav();
  setKop('Je <em>resultaat</em>', ses.soort === 'fout' ? 'Mijn fouten opnieuw' : themaVan(ses.thema).naam);
  const terug = ses.soort === 'fout' ? '<button class="knop" data-a="thuis" data-focus>Terug naar het overzicht</button>' : '<button class="knop" data-a="kies" data-d="' + ses.thema + '" data-focus>Terug naar ' + esc(themaVan(ses.thema).kort || themaVan(ses.thema).naam) + '</button>';
  const opnieuw = ses.soort === 'ladder' ? '<button class="knop licht" data-a="ladder" data-d="' + ses.thema + '">Nog een situatie</button>' : ses.soort === 'doel' ? '<button class="knop licht" data-a="doel" data-d="' + ses.thema + '">Verder werken aan je doelen</button>' : ses.soort !== 'fout' ? '<button class="knop licht" data-a="kies" data-d="' + ses.thema + '">Nog een reeks</button>' : '';
  /* wat ging goed en waaraan werk je nog: per doel uit deze reeks (zonder letters) */
  const codes = [...new Set(af.map(it => it.q.codes && it.q.codes[STROOM]).filter(c => c && DOELEN[c]))];
  const nog = codes.filter(c => doelStand(c) === 'nog' || doelStand(c) === 'bezig'), goed = codes.filter(c => doelStand(c) === 'ok');
  const kop2 = !n ? '<section class="kaart"><h2>Je hebt geen vragen beantwoord.</h2></section>' :
    '<section class="kaart uitslag"><div class="groot"><div><b>' + ses.juist + '</b><span>van ' + n + ' juist</span></div></div>' +
    '<div><h2>' + (ses.soort === 'fout' ? 'Je had ' + ses.juist + ' van de ' + n + ' vragen nu wel juist.' : 'Je had ' + ses.juist + ' van de ' + n + ' vragen juist.') + '</h2>' +
    (ses.soort === 'fout' ? '<p>Vragen die je nu juist had, verdwijnen uit je lijst met fouten.</p>' : '') +
    (nog.length ? '<p class="klein">Hier werk je nog aan:</p><ul class="doellijst">' + nog.slice(0, 5).map(c => '<li>' + esc(doelTekst(c)) + '</li>').join('') + '</ul>' : '') +
    (goed.length ? '<p class="klein">Dit kan je al:</p><ul class="doellijst ok">' + goed.slice(0, 4).map(c => '<li>' + esc(doelTekst(c)) + '</li>').join('') + '</ul>' : '') +
    (lk && ses.soort !== 'fout' ? '<p class="lkinfo">Leerkracht: niveau van je eigen oefenwerk in dit thema: ' + letterRond(ses.thema, true) + '</p>' : '') +
    '</div></section>';
  toon('res', kop2 + '<div class="rij">' + terug + opnieuw + '</div>' +
    (n ? secHead('Alle vragen met uitleg', 'fout') + '<div class="nakijk">' + nakijkLijst(af) + '</div>' : ''));
}
/* ---------- acties ---------- */
const ACT = {
  thuis() { ses = null; toonThuis(); },
  nav(el) {
    const d = el.dataset.d;
    if (ses && !ses.klaar && scherm === 'vraag') { ses.stop = true; toonVraag(); return; }
    ses = null; ga(d);
  },
  kies(el) { toonKeuze(el.dataset.d); },
  fouten() { start(null, 'fout', 10); },
  doel(el) {
    /* werk aan je doelen: eerst de doelen met fouten, dan nieuwe doelen; telkens van makkelijk naar moeilijk */
    const d = el.dataset.d, rang = c => LIDX[c.split('-')[2][0]] * 100 + Number(c.split('-')[2].slice(1));
    const nog = nogDoelen(d).sort((a, b) => rang(a) - rang(b)), nieuw = nieuweDoelen(d).sort((a, b) => rang(a) - rang(b));
    const doelen = nog.slice(0, 4).concat(nieuw).slice(0, Math.max(4, Math.min(5, nog.length + 2)));
    if (!doelen.length) return;
    start(d, 'doel', 10, {doelen});
  },
  ladder(el) { startLadder(el.dataset.d); },
  proefstart(el) { startProef(el.dataset.d); },
  proefverder() { const P = ses.proef; start(P.delen[P.deel], 'proef', DEEL_N, {proef:P}); },
  jf(el) { const it = huidig(); if (it.klaar) return; it.jf[Number(el.dataset.r)] = Number(el.dataset.c); tekenAntw(); },
  symvak(el) { const it = huidig(); if (it.klaar) return; it.symSel = Number(el.dataset.i); tekenAntw(); },
  symk(el) {
    const it = huidig(); if (it.klaar) return;
    it.sym[it.symSel] = el.dataset.s;
    const vrij = it.sym.findIndex(x => !x); if (vrij >= 0) it.symSel = vrij;
    tekenAntw();
  },
  form() { ses.paneel = ses.paneel === 'form' ? null : 'form'; toonVraag(); },
  sel(el) { ses.sel = Number(el.dataset.o); wortel().querySelectorAll('.optie').forEach(b => b.setAttribute('aria-checked', b === el)); const b = wortel().querySelector('[data-a=bevestig]'); if (b) b.disabled = false; },
  bevestig() { if (kanBevestigen(huidig())) antwoord(false); },
  weetniet() { antwoord(true); },
  vorm(el) {
    const it = huidig(), iv = it.inv[it.actief || 0]; iv.vorm = el.dataset.v; tekenAntw();
    const f = wortel().querySelector('.ivvak.actief input'); if (f) f.focus();
  },
  kaart(el) {
    const it = huidig(); if (it.klaar) return;
    if (it.q.t === 'vak') { const j = Number(el.dataset.kaart); it.selKaart = it.selKaart === j ? null : j; }
    else {
      const pos = Number(el.dataset.pos);
      if (it.selKaart == null) it.selKaart = pos;
      else if (it.selKaart === pos) it.selKaart = null;
      else { const a = it.volg[it.selKaart]; it.volg[it.selKaart] = it.volg[pos]; it.volg[pos] = a; it.selKaart = null; }
    }
    tekenAntw();
  },
  mkx(el) { const it = huidig(); if (it.klaar) return; const o = Number(el.dataset.o), i = it.mkSel.indexOf(o); if (i >= 0) it.mkSel.splice(i, 1); else it.mkSel.push(o); tekenAntw(); },
  zone(el) { const it = huidig(); if (it.klaar || it.selKaart == null) return; it.vak[it.selKaart] = Number(el.dataset.zone); it.selKaart = null; tekenAntw(); },
  marker() { ses.marker = !ses.marker; toonVraag(); },
  wb() { ses.paneel = ses.paneel === 'wb' ? null : 'wb'; toonVraag(); const z = wortel().querySelector('#wbz'); if (z) z.focus(); },
  verder() { volgende(); },
  tip() { const it = ses.items[ses.items.length - 1]; it.tip = true; ses.tips++; toonVraag(); },
  plan() { ses.items[ses.items.length - 1].plan = true; toonVraag(); },
  stop() { ses.stop = true; toonVraag(); },
  stopnee() { ses.stop = false; toonVraag(); },
  stopja() { einde(true); },
  calc() { ses.paneel = ses.paneel === 'calc' ? null : 'calc'; toonVraag(); calcScherm(); },
  ct(el) { calcToets(el.dataset.k); }
};
const FORM = {
  keuze(f) { start(f.dataset.d, f.modus.value, Number(f.n.value)); }
};
/* naar een scherm: thuis, fout, een domein, mix of een proeftoets */
function ga(d) {
  if (d === 'fout') { if (foutenLijst().length) return start(null, 'fout', 10); d = 'thuis'; }
  if (d !== 'thuis' && (verborgen(d) || !SECTIONS.some(s => s.id === d))) d = 'thuis';
  if (d === 'thuis') toonThuis();
  else if (isToets(d)) toonProef(d);
  else toonKeuze(d);
}
document.addEventListener('click', e => {
  if (!inSite(e.target) && !(e.target.closest && e.target.closest('nav.side'))) return;
  // venndiagram: gebied kleuren of weer wit maken
  const vs = e.target.closest('svg.vennk.klikbaar');
  if (vs && scherm === 'vraag' && ses) {
    const it = huidig(); if (it.klaar || it.q.t !== 'venn') return;
    const p = vennPunt(vs, e), g = vennGebied(it.q.venn.n, p.x, p.y); if (g < 0) return;
    const i = it.venn.indexOf(g); if (i >= 0) it.venn.splice(i, 1); else it.venn.push(g);
    tekenAntw(); return;
  }
  // rooster met letters en cijfers: vak aanklikken (bij één juist vak vervangt een nieuwe klik de vorige)
  const cr = e.target.closest('rect[data-cel]');
  if (cr && scherm === 'vraag' && ses) {
    const it = huidig(); if (it.klaar || it.q.t !== 'cel') return;
    const c = cr.dataset.cel, i = it.cel.indexOf(c);
    if (i >= 0) it.cel.splice(i, 1); else if (it.q.cel.meer) it.cel.push(c); else it.cel = [c];
    tekenAntw(); return;
  }
  // klikken op het rooster
  const rs = e.target.closest('svg.rooster.klikbaar');
  if (rs && scherm === 'vraag' && ses) {
    const it = huidig(); if (it.klaar || it.q.t !== 'klik') return;
    const p = roosterPunt(rs, it.q.rooster, e);
    it.klik = it.klik && it.klik.x === p.x && it.klik.y === p.y ? null : p;
    tekenAntw(); const r = wortel().querySelector('svg.klikbaar'); if (r) r.focus({preventScroll:true});
    return;
  }
  // markering weghalen
  const mk = ses && ses.marker && scherm === 'vraag' ? e.target.closest('.opgave .tekst mark') : null;
  if (mk) {
    const ouder = mk.parentNode; while (mk.firstChild) ouder.insertBefore(mk.firstChild, mk); ouder.removeChild(mk); ouder.normalize();
    huidig().mark = wortel().querySelector('.opgave .tekst').innerHTML; return;
  }
  const el = e.target.closest('[data-a]'); if (el && !el.disabled && ACT[el.dataset.a]) ACT[el.dataset.a](el);
});
app.addEventListener('submit', e => { const f = e.target.closest('[data-f]'); if (f) { e.preventDefault(); FORM[f.dataset.f](f); } });

// markeerstift: geselecteerde tekst in de opgave markeren
function markeer() {
  if (!ses || !ses.marker || scherm !== 'vraag') return;
  const tekst = wortel().querySelector('.opgave .tekst'), sel = window.getSelection();
  if (!tekst || !sel.rangeCount || sel.isCollapsed) return;
  const rg = sel.getRangeAt(0);
  if (!tekst.contains(rg.commonAncestorContainer)) return;
  const m = document.createElement('mark');
  try { rg.surroundContents(m); } catch (err) { m.appendChild(rg.extractContents()); rg.insertNode(m); }
  sel.removeAllRanges();
  huidig().mark = tekst.innerHTML;
}
document.addEventListener('mouseup', e => { if (inSite(e.target)) markeer(); });
document.addEventListener('touchend', e => { if (inSite(e.target)) setTimeout(markeer, 30); });

// invulvakken en woordenboek
document.addEventListener('input', e => {
  const t = e.target; if (!inSite(t)) return;
  if (t.id === 'wbz') { const l = wortel().querySelector('#wbl'); if (l) l.innerHTML = wbLijst(huidig().q, t.value); return; }
  if (t.classList.contains('iv') && ses) {
    const it = huidig(); it.inv[Number(t.dataset.i)][t.dataset.k] = t.value;
    const b = wortel().querySelector('[data-a=bevestig]'); if (b) b.disabled = !kanBevestigen(it);
  }
});
document.addEventListener('focusin', e => {
  const t = e.target;
  if (!inSite(t) || !t.classList || !t.classList.contains('iv') || !ses) return;
  const it = huidig(), i = Number(t.dataset.i); if (it.actief === i) return;
  it.actief = i;
  wortel().querySelectorAll('.ivvak').forEach((v, k) => v.classList.toggle('actief', k === i));
  wortel().querySelectorAll('.vormknop').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === it.inv[i].vorm));
});

// slepen (muis); op een aanraakscherm werkt eerst tikken op een kaartje en dan op een vak
let sleep = null;
document.addEventListener('dragstart', e => {
  if (!inSite(e.target)) return;
  const k = e.target.closest && e.target.closest('.kaartje[draggable=true]'); if (!k) return;
  sleep = k.dataset.kaart != null ? {kaart:Number(k.dataset.kaart)} : {pos:Number(k.dataset.pos)};
  e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'kaartje'); } catch (err) {}
});
document.addEventListener('dragover', e => { if (sleep && e.target.closest && e.target.closest('[data-zone], .volgrij .kaartje')) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } });
document.addEventListener('drop', e => {
  if (!sleep) return; e.preventDefault();
  const it = huidig();
  if (sleep.kaart != null) { const z = e.target.closest('[data-zone]'); if (z) { it.vak[sleep.kaart] = Number(z.dataset.zone); it.selKaart = null; } }
  else { const k = e.target.closest('.volgrij .kaartje'); if (k) { const naar = Number(k.dataset.pos), x = it.volg.splice(sleep.pos, 1)[0]; it.volg.splice(naar, 0, x); it.selKaart = null; } }
  sleep = null; tekenAntw();
});
document.addEventListener('dragend', () => { sleep = null; });

document.addEventListener('keydown', e => {
  if (scherm !== 'vraag' || !ses || ses.klaar || e.ctrlKey || e.metaKey || e.altKey) return;
  const it = huidig(), t = e.target;
  if (ses.paneel === 'calc' && !it.klaar && (t === document.body || (t.closest && t.closest('#calc, [data-a=calc]')))) {
    const m = {'*':'×', '/':'÷', '-':'−', '.':',', 'Enter':'=', 'Backspace':'DEL', 'Escape':'AC'}, k = m[e.key] || e.key;
    if (/^([\d,+−×÷()=^%]|DEL|AC)$/.test(k) && !(k === 'DEL' && huidig().q.calc === 'e')) { e.preventDefault(); calcToets(k); }
    return;
  }
  if (it.klaar || ses.stop) return;
  if (t.classList && t.classList.contains('iv')) { if (e.key === 'Enter' && kanBevestigen(it)) { e.preventDefault(); antwoord(false); } return; }
  if (t.matches && t.matches('svg.klikbaar')) {
    const r = it.q.rooster, d = {ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, 1], ArrowDown:[0, -1]}[e.key];
    if (d) {
      e.preventDefault();
      const p = it.klik || {x:Math.round((r.xmin + r.xmax) / 2), y:Math.round((r.ymin + r.ymax) / 2)};
      it.klik = it.klik ? {x:clamp(p.x + d[0], r.xmin, r.xmax), y:clamp(p.y + d[1], r.ymin, r.ymax)} : p;
      tekenAntw();
    } else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); it.klik = null; tekenAntw(); }
    return;
  }
  if (it.q.t !== 'mc' || (t.tagName === 'INPUT')) return;
  const p = 'abcd'.indexOf(e.key.toLowerCase());
  if (p >= 0) { const b = wortel().querySelectorAll('.optie')[p]; if (b) { b.focus(); ACT.sel(b); } }
});
window.addEventListener('beforeunload', e => { if (ses && ses.proef && !ses.klaar) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- start ---------- */
(function init() {
  const oud = lok(PREFIX + 'staat');
  if (oud && oud.v >= 4) { ['q', 'h', 'dg', 'th', 'proef'].forEach(k => { if (oud[k]) S[k] = oud[k]; }); S.voorafGezien = !!oud.voorafGezien; S.t = oud.t || 0; }
  else if (oud) { S.q = oud.q || {}; S.voorafGezien = !!oud.voorafGezien; }
  /* het dashboard telt per thema de vragen van de pool */
  VRAGEN.forEach(q => { if (q.lv[si()] > 0) CLvraag(q.d + '_' + q.id); });
  const h = decodeURIComponent(location.hash.slice(1));
  ga(SECTIONS.some(s => s.id === h) ? h : 'thuis');
})();
/* voor test/catalogus.js en de testscripts */
window.SECTIONS = SECTIONS;
window.show = id => { ses = null; ga(id); };
window.__oefensite = {ids:() => VRAGEN.filter(q => q.lv[si()] > 0).map(q => q.id), vragen:() => VRAGEN.filter(q => q.lv[si()] > 0).map(q => ({id:q.id, d:q.d, code:q.codes[STROOM], lv:q.lv[si()]})),
  ladders:() => LADDERS.filter(l => l.s.indexOf(STROOM) >= 0).map(l => ({id:l.id, d:l.d})), letterVan, doelStand, S:() => S,
  rekenUit, nieuweTheta, figuur, roosterSvg, naarBreuk, start:(d, m, n, x) => start(d, m, n, x), ses:() => ses,
  /* testhulp: alle vragen van een thema na elkaar tonen (één exemplaar per sjabloon) */
  alle:(d, filter) => { const qs = VRAGEN.filter(q => q.d === d && q.lv[si()] > 0 && (!filter || q.id.indexOf(filter) >= 0)).map(q => q.gen ? maakVraag(q) : Object.assign({}, q)); start(d, 'ladder', qs.length, {ladder:qs, ladderNaam:'test'}); return qs.map(q => q.id); },
  vulJuist:() => { const it = huidig(), q = it.q;
    if (q.t === 'mc') ses.sel = 0;
    if (q.t === 'mk') it.mkSel = q.mk.slice();
    if (q.t === 'num') q.velden.forEach((vd, i) => { const w = String(vd.w), leeg = {a:'', t:'', n:'', g:'', e:''};
      if (vd.vorm === 'macht') { const [g, e] = w.split('^'); it.inv[i] = Object.assign(leeg, {vorm:'macht', g, e}); }
      else if (w.indexOf('/') >= 0) { const [t, n] = w.split('/'); it.inv[i] = Object.assign(leeg, {vorm:'breuk', t, n}); }
      else it.inv[i] = Object.assign(leeg, {vorm:'getal', a:w.replace('.', ',')}); });
    if (q.t === 'klik') it.klik = {x:q.w.x, y:q.w.y};
    if (q.t === 'vak') it.vak = q.w.slice();
    if (q.t === 'volg') it.volg = q.kaartjes.map((k, i) => i);
    if (q.t === 'jf') it.jf = q.jf.map(r => r.w ? 0 : 1);
    if (q.t === 'sym') it.sym = q.sym.rijen.map(r => r.w);
    if (q.t === 'venn') it.venn = q.venn.w.slice();
    if (q.t === 'cel') it.cel = q.cel.w.slice();
    tekenAntw(); },
  toonId:(id, modus) => { let q = VRAGEN.find(x => x.id === id); if (q.gen) q = maakVraag(q); navActief = q.d; ses = {thema:q.d, soort:modus === 't' ? 'toets' : 'oefen', si:si(), modus:modus || 'o', n:1, th:3, items:[nieuwItem(q, q.lv[si()])], gebruikt:{}, begin:Date.now(), tips:0, klaar:false, sel:null}; toonVraag(); }};
})();
