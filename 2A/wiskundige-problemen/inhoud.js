/* Wiskundige problemen 2A: inhoud.js (gemaakt met bron/build.sh, niet met de hand wijzigen) */
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
  return d === 'pro' ? 'e' : undefined;
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
  const q = Object.assign({id:sj.id, d:sj.d, lv:sj.lv, tip:sj.tip, calc:rekenSoort(sj.d, o.calc != null ? o.calc : sj.calc), gemaakt:true}, o);
  q.t = o.velden ? 'num' : o.mk ? 'mk' : o.rooster ? 'klik' : o.kaartjes ? (o.vakken ? 'vak' : 'volg') : 'mc';
  if (q.velden) q.velden = q.velden.map(vd => Object.assign({}, vd, {w:typeof vd.w === 'number' ? wv(vd.w) : vd.w}));
  if (!q.o) q.o = [];
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

/* ---------- motor van de oefensite wiskundige problemen (platform: GitHub Pages + Firebase) ----------
   Overgezet van de Apps Script-versie (oktober 2026). Opslag in localStorage met de prefix van de site;
   aanmelden.js spiegelt die naar Firestore. Haken: CLvraag (alle vragen van de pool), CLres (na elke vraag),
   CLtoets (proeftoets ingediend). Niveau A-E per onderdeel staat in <prefix>niv voor het dashboard. */
const app = document.getElementById('app');
const PREFIX = document.body.dataset.prefix || '2a_wp_v1_';
const STROOM = 'A';
const CLres   = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const VERB = window.CL_VERBORGEN instanceof Set ? window.CL_VERBORGEN : new Set(window.CL_VERBORGEN || []);
const verborgen = id => VERB.has(id);
const leerkracht = () => /^(leerkracht|beheerder)$/.test(document.body.dataset.rol || '');
const NIV = ['', 'E', 'D', 'C', 'B', 'A'];
const DOM = [
  {k:'pro', naam:'Problemen oplossen', s:'AB', focus:1,
    oms:'Vraagstukken in een context: goed lezen, een plan maken, rekenen en controleren.'},
  {k:'get', naam:'Getallenleer', s:'AB',
    oms:{A:'Bewerkingen, breuken, procenten, machten, delers en veelvouden.', B:'Bewerkingen, breuken, procenten, verhoudingen en eenheden.'}},
  {k:'alg', naam:'Algebra', s:'A',
    oms:'Letterrekenen, vergelijkingen, formules en regelmaat.'},
  {k:'mee', naam:'Meetkunde', s:'AB',
    oms:{A:'Figuren en hun eigenschappen, hoeken, transformaties, omtrek, oppervlakte en volume.', B:'Figuren, hoeken, coördinaten, omtrek, oppervlakte en volume.'}},
  {k:'sta', naam:'Statistiek, tabellen en diagrammen', kort:'Statistiek', s:'AB',
    oms:{A:'Tabellen en diagrammen lezen, gemiddelde, mediaan en modus.', B:'Tabellen en diagrammen lezen, gemiddelde en procenten.'}},
  {k:'ver', naam:'Verzamelingenleer', s:'A',
    oms:'Elementen, deelverzamelingen, doorsnede, unie, verschil en venndiagrammen.'}
];
const TOETSEN = [{k:'toets1', naam:'Proeftoets 1'}, {k:'toets2', naam:'Proeftoets 2'}, {k:'toets3', naam:'Proeftoets 3'}];
const PROEF_N = 20;
/* onderdelen voor de zijbalk, het dashboard en het openzetten (de volgorde ligt vast: id's niet meer wijzigen) */
const SECTIONS = DOM.filter(d => d.s.indexOf(STROOM) >= 0).map(d => ({id:d.k, nav:d.kort || d.naam}))
  .concat([{id:'mix', nav:'Gemengde toets'}], TOETSEN.map(t => ({id:t.k, nav:t.naam})));
const isToets = k => /^toets/.test(k);
const domNaam = k => k === 'mix' ? 'Gemengde toets' : k === 'fout' ? 'Mijn fouten opnieuw' : isToets(k) ? TOETSEN.find(t => t.k === k).naam : DOM.find(d => d.k === k).naam;
const nrVan = k => SECTIONS.filter(x => !verborgen(x.id)).findIndex(x => x.id === k) + 1;
const zichtbareDom = () => DOM.filter(d => d.s.indexOf(STROOM) >= 0 && !verborgen(d.k));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const rand = n => Math.floor(Math.random() * n);
function schud(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* tekst met breuken: {{teller|noemer}} wordt een breuk met breukstreep */
/* vierkantswortel als één doorlopend teken: de V raakt de schrijflijn en gaat over in de streep boven het getal */
const WRTV = '<svg class="wrt-v" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0.5 60 L3 52 L6 100 L10 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
function wis(s) {
  return s.replace(/√(\d+(?:,\d+)?)/g, (m, g) => '<span class="wrt" role="math" aria-label="vierkantswortel van ' + g + '">' + WRTV + '<span class="wrt-in">' + g + '</span></span>').replace(/\{\{([^|{}]+)\|([^|{}]+)\}\}/g, (m, t, n) =>
    '<span class="br" role="math" aria-label="' + esc(t) + ' gedeeld door ' + esc(n) + '"><span class="bt">' + t + '</span><span class="bn">' + n + '</span></span>');
}
function alineas(s, kern) {
  const p = s.split('\n');
  return p.map((x, i) => '<p' + (kern && i === p.length - 1 ? ' class="kern"' : '') + '>' + wis(x) + '</p>').join('');
}
const platte = s => s.replace(/\{\{([^|{}]+)\|([^|{}]+)\}\}/g, '$1/$2').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<');


/* ---------- opslag: localStorage met de prefix van de site (aanmelden.js bewaart dat bij het schoolaccount) ----------
   <prefix>staat : niveau per domein (dom.A), wat de leerling per vraag zag (q), vorige proeftoetsen (proef)
   <prefix>niv   : laatste niveau per onderdeel, voor het dashboard {onderdeel: {n, j, t, d}} */
let S = {v:3, stroom:STROOM, dom:{A:{}}, q:{}, proef:{}, voorafGezien:false, t:0};
const lok = (k, w) => { try { if (w === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(w)); } catch (e) { return null; } };
function bewaar() { S.t = Date.now(); lok(PREFIX + 'staat', S); }
function bewaarNiveau(ond, niv, j, t) {
  const n = lok(PREFIX + 'niv') || {};
  n[ond] = {n:niv, j, t, d:new Date().toISOString().slice(0, 10)};
  lok(PREFIX + 'niv', n);
}

/* ---------- figuren ---------- */
function svg(vb, inhoud, alt) {
  return '<svg viewBox="' + vb + '" role="img" aria-label="' + esc(alt || 'figuur') + '" xmlns="http://www.w3.org/2000/svg">' + inhoud + '</svg>';
}
function assenstelsel(f, W, H, L, R, T, B) {
  const y = v => T + (H - T - B) * (1 - (v - f.min) / (f.max - f.min));
  let s = '';
  for (let v = f.min; v <= f.max + 1e-9; v += f.stap) {
    s += '<line class="fras" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>';
    s += '<text class="fklein" x="' + (L - 7) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>';
  }
  s += '<line class="fas" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (H - B) + '"/>';
  s += '<line class="fas" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
  s += '<text class="fklein" transform="translate(13 ' + ((T + H - B) / 2) + ') rotate(-90)" text-anchor="middle">' + f.ylab + '</text>';
  return {s, y};
}
function figuur(k) {
  const F = typeof k === 'string' ? FIGS[k] : k; if (!F) return '';
  let h = '';
  if (F.t === 'tab') {
    h = '<table class="ftab"><thead><tr>' + F.kop.map(c => '<th scope="col">' + c + '</th>').join('') + '</tr></thead><tbody>' +
      F.rijen.map(r => '<tr>' + r.map(c => c === '#vlek' ? '<td class="vlek"><svg viewBox="0 0 60 30" aria-label="onleesbaar"><path d="M8,15 C6,4 22,9 27,3 C33,9 46,2 50,10 C58,12 55,22 47,24 C42,30 30,24 24,28 C15,30 6,26 8,15 Z" fill="#5a3a22"/><circle cx="54" cy="5" r="3" fill="#5a3a22"/><circle cx="5" cy="27" r="2" fill="#5a3a22"/></svg></td>' : '<td' + (typeof c === 'number' ? ' class="num"' : '') + '>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  } else if (F.t === 'staaf' || F.t === 'lijn') {
    const W = 380, H = 236, L = 52, R = 12, T = 12, B = 30;
    const as = assenstelsel(F, W, H, L, R, T, B);
    const band = (W - L - R) / F.x.length;
    let s = as.s;
    F.x.forEach((n, i) => { s += '<text class="fnaam" x="' + (L + band * (i + .5)) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + n + '</text>'; });
    if (F.t === 'staaf') {
      const bw = band * .54, y0 = H - B;
      F.y.forEach((v, i) => {
        const x = L + band * (i + .5) - bw / 2, y = as.y(v), r = 4;
        s += '<path fill="var(--k1)" d="M' + x + ',' + y0 + ' V' + (y + r) + ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y + ' H' + (x + bw - r) + ' Q' + (x + bw) + ',' + y + ' ' + (x + bw) + ',' + (y + r) + ' V' + y0 + ' Z"/>';
      });
    } else {
      const pt = F.y.map((v, i) => [L + band * (i + .5), as.y(v)]);
      s += '<polyline fill="none" stroke="var(--k1)" stroke-width="2.4" stroke-linejoin="round" points="' + pt.map(p => p.join(',')).join(' ') + '"/>';
      pt.forEach(p => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="var(--k1)" stroke="var(--wit)" stroke-width="2"/>'; });
    }
    h = svg('0 0 ' + W + ' ' + H, s, F.titel + ' (' + (F.t === 'staaf' ? 'staafdiagram' : 'lijndiagram') + ')');
  } else if (F.t === 'taart') {
    const cx = 180, cy = 122, r = 84, kl = ['var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)'];
    let a0 = 0, s = '';
    const P = (a, rr) => [cx + rr * Math.sin(a), cy - rr * Math.cos(a)];
    F.delen.forEach((d, i) => {
      const a1 = a0 + d[1] / 100 * 2 * Math.PI, p0 = P(a0, r), p1 = P(a1, r), gr = (a1 - a0) > Math.PI ? 1 : 0;
      s += '<path fill="' + kl[i] + '" stroke="var(--wit)" stroke-width="2" d="M' + cx + ',' + cy + ' L' + p0[0].toFixed(1) + ',' + p0[1].toFixed(1) + ' A' + r + ',' + r + ' 0 ' + gr + ' 1 ' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1) + ' Z"/>';
      const m = (a0 + a1) / 2, pl = P(m, r + 14), sn = Math.sin(m);
      s += '<text class="fnaam" x="' + pl[0].toFixed(1) + '" y="' + (pl[1] + 5).toFixed(1) + '" text-anchor="' + (sn > .25 ? 'start' : sn < -.25 ? 'end' : 'middle') + '">' + d[0] + ': ' + (d[2] || f(d[1], 1)) + ' %</text>';
      a0 = a1;
    });
    h = svg('-30 0 420 240', s, F.titel + ' (cirkeldiagram): ' + F.delen.map(d => d[0] + ' ' + (d[2] || f(d[1], 1)) + ' %').join(', '));
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
  } else if (F.t === 'svg') {
    h = svg(F.vb, F.html, F.alt);
  }
  return '<figure class="wfig">' + (F.titel ? '<figcaption>' + F.titel + '</figcaption>' : '') + h + '</figure>';
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

/* ---------- rooster voor klikvragen en figuren ---------- */
const RC = 34, RP = 30;
function roosterSvg(r, opt) {
  opt = opt || {};
  const W = (r.xmax - r.xmin) * RC + 2 * RP, H = (r.ymax - r.ymin) * RC + 2 * RP;
  const X = x => RP + (x - r.xmin) * RC, Y = y => RP + (r.ymax - y) * RC;
  let s = '<rect x="' + X(r.xmin) + '" y="' + Y(r.ymax) + '" width="' + (W - 2 * RP) + '" height="' + (H - 2 * RP) + '" fill="var(--wit)"/>';
  for (let x = r.xmin; x <= r.xmax; x++) s += '<line class="fras" x1="' + X(x) + '" x2="' + X(x) + '" y1="' + Y(r.ymin) + '" y2="' + Y(r.ymax) + '"/>';
  for (let y = r.ymin; y <= r.ymax; y++) s += '<line class="fras" x1="' + X(r.xmin) + '" x2="' + X(r.xmax) + '" y1="' + Y(y) + '" y2="' + Y(y) + '"/>';
  const as = r.assen || '';
  if (as.indexOf('x') >= 0 && r.ymin <= 0 && r.ymax >= 0) {
    s += '<path class="fas" d="M' + X(r.xmin) + ',' + Y(0) + ' H' + (X(r.xmax) + 16) + ' m-7,-4 l7,4 l-7,4"/><text class="fnaam" x="' + (X(r.xmax) + 12) + '" y="' + (Y(0) + 18) + '" font-style="italic">x</text>';
  }
  if (as.indexOf('y') >= 0 && r.xmin <= 0 && r.xmax >= 0) {
    s += '<path class="fas" d="M' + X(0) + ',' + Y(r.ymin) + ' V' + (Y(r.ymax) - 16) + ' m-4,7 l4,-7 l4,7"/><text class="fnaam" x="' + (X(0) + 9) + '" y="' + (Y(r.ymax) - 8) + '" font-style="italic">y</text>';
  }
  if (r.getallen && as.indexOf('x') >= 0 && as.indexOf('y') >= 0) {
    const xs = [], ys = [];
    for (let x = r.xmin; x <= r.xmax; x++) if (x && (r.getallen === 'alle' || x === 1)) xs.push(x);
    for (let y = r.ymin; y <= r.ymax; y++) if (y && (r.getallen === 'alle' || y === 1)) ys.push(y);
    xs.forEach(x => { s += '<text class="fklein" x="' + X(x) + '" y="' + (Y(0) + 15) + '" text-anchor="middle">' + String(x).replace('-', '−') + '</text>'; });
    ys.forEach(y => { s += '<text class="fklein" x="' + (X(0) - 6) + '" y="' + (Y(y) + 4) + '" text-anchor="end">' + String(y).replace('-', '−') + '</text>'; });
    if (r.xmin <= 0 && r.ymin <= 0) s += '<text class="fklein" x="' + (X(0) - 6) + '" y="' + (Y(0) + 15) + '" text-anchor="end">0</text>';
  }
  (r.lijnen || []).forEach(l => {
    s += '<line class="' + (l.vol ? 'flijn' : 'fstreep fdik') + '" x1="' + X(l.x1) + '" y1="' + Y(l.y1) + '" x2="' + X(l.x2) + '" y2="' + Y(l.y2) + '"/>';
    if (l.l) s += '<text class="ftxt" x="' + (X(l.x2) + 7) + '" y="' + (Y(l.y2) + 14) + '" font-style="italic">' + l.l + '</text>';
  });
  (r.punten || []).forEach(p => {
    s += '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.5" fill="var(--inkt)"/><text class="ftxt" x="' + (X(p.x) + 7) + '" y="' + (Y(p.y) - 7) + '">' + p.l + '</text>';
  });
  const merk = (m, cls) => m ? '<g class="' + cls + '"><circle cx="' + X(m.x) + '" cy="' + Y(m.y) + '" r="9"/><circle cx="' + X(m.x) + '" cy="' + Y(m.y) + '" r="3.5" class="kern"/></g>' : '';
  if (opt.juist) s += merk(opt.juist, 'kjuist');
  if (opt.jouw) s += merk(opt.jouw, opt.juist && (opt.jouw.x !== opt.juist.x || opt.jouw.y !== opt.juist.y) ? 'kmis' : 'kjouw');
  const label = opt.klik ? 'Rooster. Klik op een plaats om een punt te zetten. Met de pijltjestoetsen kan je het punt verplaatsen.' : (opt.alt || 'Rooster');
  return '<svg class="rooster' + (opt.klik ? ' klikbaar' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px"' + (opt.klik ? ' tabindex="0" role="application" data-fk="rooster"' : ' role="img"') + ' aria-label="' + esc(label) + '" xmlns="http://www.w3.org/2000/svg">' + s + '</svg>';
}
function roosterPunt(svgEl, r, e) {
  const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svgEl.getScreenCTM().inverse());
  return {x:clamp(Math.round((p.x - RP) / RC + r.xmin), r.xmin, r.xmax), y:clamp(Math.round(r.ymax - (p.y - RP) / RC), r.ymin, r.ymax)};
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
  return '';
}
function jouwTekst(it) {
  const q = it.q;
  if (it.weetNiet) return 'ik weet het niet';
  if (q.t === 'mc') return wis(q.o[it.keuze]);
  if (q.t === 'mk') return it.mkSel.length ? it.mkSel.map(i => wis(q.o[i])).join('; ') : 'niets aangeklikt';
  if (q.t === 'num') return q.velden.map((vd, i) => metEenheid(vd, fmtInvoer(it.inv[i]))).join(' ');
  if (q.t === 'klik') return it.klik ? 'het punt dat ' + (it.juist ? 'groen' : 'rood') + ' gemarkeerd is' : 'geen punt';
  if (q.t === 'vak') return q.kaartjes.map((k, j) => wis(k) + ' → ' + (it.vak[j] >= 0 ? wis(q.vakken[it.vak[j]]) : 'niet geplaatst')).join('; ');
  if (q.t === 'volg') return it.volg.map(j => wis(q.kaartjes[j])).join(' &nbsp;·&nbsp; ');
  return '';
}
function nieuwItem(q, lv) {
  const it = {q, lv, klaar:false, tip:false, plan:false, keuze:null, weetNiet:false};
  if (q.t === 'mc') it.volg = schud([0, 1, 2, 3]);
  if (q.t === 'mk') {
    const idx = q.o.map((x, i) => i), laatste = idx.filter(i => /^geen van bovenstaande/i.test(q.o[i]));
    it.volg = schud(idx.filter(i => laatste.indexOf(i) < 0)).concat(laatste); it.mkSel = [];
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
  if (q.t === 'klik') return {juist:!!it.klik && it.klik.x === q.w.x && it.klik.y === q.w.y};
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
  volg:'Sleep de kaartjes in de juiste volgorde. Je kan ook op twee kaartjes na elkaar klikken om ze van plaats te wisselen.'
};
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
    return (vd.voor ? '<span class="eenh">' + esc(vd.voor) + '</span>' : '') + '<span class="ivvak' + (it.actief === i && !it.klaar ? ' actief' : '') + '">' + vak + '</span>' + (vd.na ? '<span class="eenh">' + esc(vd.na) + '</span>' : '');
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

/* ---------- adaptief oefenen ---------- */
let ses = null;
const si = () => STROOM === 'B' ? 1 : 0;
/* vragen die in de oefenpool zitten (stroom A, domein niet verborgen) */
const inPool = q => q.lv[si()] > 0 && !verborgen(q.d);
const foutenLijst = () => VRAGEN.filter(q => inPool(q) && (S.q[q.id] || [0, -1])[1] === 0);
const gezien = id => (S.q[id] || [0, -1])[0];
function nieuweTheta(th, b, r, i, gok) {
  // kans op een juist antwoord (gokkans 25 % bij meerkeuze, bijna 0 bij invullen); stapgrootte wordt kleiner naarmate de reeks vordert
  gok = gok == null ? 0.25 : gok;
  const p = gok + (1 - gok) / (1 + Math.exp(-1.3 * (th - b)));
  const K = Math.max(0.5, 1.6 / (1 + 0.35 * i));
  return clamp(th + K * (r - p), 0.6, 5.4);
}
function kiesVraag() {
  const s = ses.si;
  if (ses.dom === 'fout') { const id = ses.lijst[ses.items.length]; const q = VRAGEN.find(x => x.id === id); return q ? {q:q.gen ? maakVraag(q) : q, lv:q.lv[s]} : null; }
  const d = ses.mix ? ses.mix[ses.items.length % ses.mix.length] : ses.dom;
  const L = clamp(Math.round(ses.th), 1, 5);
  // score: een vaste vraag die al gezien is, telt zwaar; een sjabloon maakt telkens nieuwe getallen en mag vaker terugkomen
  // binnen één reeks mag een sjabloon (met nieuwe getallen) één keer terugkomen, maar nooit twee keer na elkaar
  const vorige = ses.items.length ? ses.items[ses.items.length - 1].q.id : null;
  const score = q => q.gen ? gezien(q.id) / 4 + 0.4 * (ses.gebruikt[q.id] || 0) : gezien(q.id);
  const pool = l => VRAGEN.filter(q => q.d === d && q.lv[s] === l && q.id !== vorige && (q.gen ? (ses.gebruikt[q.id] || 0) < 2 : !ses.gebruikt[q.id]));
  const kies = c => { const min = Math.min.apply(null, c.map(score)); c = c.filter(q => score(q) === min); const gek = c[rand(c.length)]; return {q:gek.gen ? maakVraag(gek) : gek, min}; };
  let reserve = null;
  for (const stap of [0, -1, 1]) {
    const l = L + stap; if (l < 1 || l > 5) continue;
    const c = pool(l); if (!c.length) continue;
    const k = kies(c);
    if (k.min < 1) return {q:k.q, lv:l};
    if (!reserve || k.min < reserve.min) reserve = {q:k.q, lv:l, min:k.min};
  }
  if (reserve) return {q:reserve.q, lv:reserve.lv};
  for (const stap of [-2, 2, -3, 3, -4, 4]) {
    const l = L + stap; if (l < 1 || l > 5) continue;
    const c = pool(l); if (c.length) return {q:kies(c).q, lv:l};
  }
  return null;
}
/* ---------- reeksen ---------- */
function start(dom, modus, n, proef) {
  const s = si(), st = STROOM;
  ses = {dom, si:s, modus, n, th:3, items:[], gebruikt:{}, begin:Date.now(), tips:0, klaar:false,
    soort:proef ? 'proeftoets' : dom === 'fout' ? 'fouten' : modus === 't' ? 'oefentoets' : 'oefenen'};
  /* proeftoets: vragen uit alle open domeinen door elkaar, geen tips en geen uitleg tot het indienen */
  if (proef) { ses.proef = true; ses.modus = 't'; }
  if (dom === 'fout') {
    ses.lijst = schud(foutenLijst().map(q => q.id)).slice(0, 10);
    ses.n = ses.lijst.length; ses.modus = 'o';
  } else if (dom === 'mix' || proef) {
    ses.mix = schud(zichtbareDom().map(d => d.k));
    const th = zichtbareDom().map(d => (S.dom[st][d.k] || {}).th).filter(x => x);
    if (th.length && !proef) ses.th = th.reduce((a, b) => a + b, 0) / th.length;
  } else if (S.dom[st][dom] && S.dom[st][dom].th) ses.th = S.dom[st][dom].th;
  ses.startNiv = NIV[clamp(Math.round(ses.th), 1, 5)];
  navActief = dom;
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
  if (ses.dom !== 'fout') ses.th = nieuweTheta(ses.th, it.lv, it.juist ? 1 : 0, ses.items.length - 1, it.q.t === 'mc' ? 0.25 : 0.05);
  S.q[it.q.id] = [gezien(it.q.id) + 1, it.juist ? 1 : 0]; bewaar();
  /* dashboard: juist of fout per vraag van de pool (vraag-id = domein_vraag); de proeftoets telt apart via CLtoets */
  if (!ses.proef) CLres(it.q.d + '_' + it.q.id, it.juist);
  if (ses.modus === 't') volgende(); else toonVraag();
}
function einde(hoe) {
  ses.klaar = true; ses.gestopt = hoe === true;
  const af = ses.items.filter(i => i.klaar); ses.items = af;
  const juist = af.filter(i => i.juist).length;
  ses.juist = juist; ses.niv = ses.dom === 'fout' ? '–' : NIV[clamp(Math.round(ses.th), 1, 5)];
  ses.min = Math.max(1, Math.round((Date.now() - ses.begin) / 60000));
  const st = STROOM, dag = new Date().toISOString().slice(0, 10);
  if (ses.proef) {
    /* niet gemaakte vragen tellen als fout; opnieuw maken mag, de laatste poging telt */
    S.proef[ses.dom] = {d:dag, n:ses.niv, j:juist, t:ses.n};
    bewaar();
    bewaarNiveau(ses.dom, ses.niv, juist, ses.n);
    CLtoets(ses.dom + '_1', juist, ses.n);
  } else if (af.length) {
    if (ses.dom !== 'fout' && af.length >= 5) {
      const d = S.dom[st][ses.dom] || (S.dom[st][ses.dom] = {ses:[]});
      d.th = ses.th; d.ses.push({d:dag, n:ses.niv, j:juist, t:af.length, m:ses.modus}); if (d.ses.length > 30) d.ses.shift();
      bewaarNiveau(ses.dom, ses.niv, juist, af.length);
    }
    bewaar();
  }
  toonResultaat();
}

/* ---------- kop, zijbalk en schermen ---------- */
let scherm = '', navActief = 'thuis';
function setKop(titel, tag) {
  const t = document.getElementById('kopTitel'), g = document.getElementById('kopTag');
  if (t) t.innerHTML = titel; if (g) { g.innerHTML = tag || ''; g.hidden = !tag; }
}
const ICO = {
  thuis:'<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h5v-5.5h3V20h5V9.5"/>',
  pro:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  get:'<path d="M7 3.5v7M3.5 7h7M14 7h6.5M4.5 14.5l5 5M9.5 14.5l-5 5M14 15.5h6.5M14 19h6.5"/>',
  alg:'<path d="M4 6.5c2.5 0 3.2 1.2 4.4 5.5S10.6 17.5 13 17.5M12.5 6.5c-2.2 0-3.6 3.3-4.1 5.5S6.6 17.5 4 17.5"/><path d="M15.5 9.5h5M18 7v5"/>',
  mee:'<path d="M4 20 12 4l8 16z"/><path d="M8.5 20a3.5 3.5 0 0 0-1.6-2.9"/>',
  sta:'<path d="M3 20h18M6 20v-8M10.5 20V6M15 20v-5M19.5 20V9"/>',
  ver:'<circle cx="9" cy="12" r="5.6"/><circle cx="15" cy="12" r="5.6"/>',
  mix:'<path d="M3 7h3.5l10 10H20M3 17h3.5l2.8-2.8M14.6 9.8 17 7h3"/><path d="m18 4.5 2.5 2.5L18 9.5M18 14.5l2.5 2.5-2.5 2.5"/>',
  fout:'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  proef:'<rect x="5.5" y="4.5" width="13" height="16" rx="2"/><path d="M9 4.5V3h6v1.5M9 12.5l2 2 4-4"/>',
  beheer:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'
};
const ico = k => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[k] + '</svg>';
const navIco = k => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICO[ICO[k] ? k : isToets(k) ? 'proef' : 'thuis'] + '</svg>';
/* zijbalk in de stijl van het platform: Overzicht, de onderdelen met hun nummer, Mijn fouten, en na een lijn de proeftoetsen */
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
const BLAD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12.5c2.6.4 5 2.6 6.6 6.5C12 10 15.4 5.6 21 3c-4.6 4-7.6 9.6-9.4 17.6-.5 1.4-2 1.5-2.7.1C7.7 18 5.6 14.6 3 12.5z"/></svg>';
const secHead = (titel, ic, nr) => '<div class="sec-head"><span class="sec-ic">' + ico(ic || 'thuis') + '</span><h2>' + (nr ? '<span class="num">' + nr + '.</span> ' : '') + titel + '</h2></div>';

function voorafLijst() {
  return '<ul class="vink vooraf">' +
    '<li>Kies links of hieronder een <span class="acc">domein</span> en kies hoe je wil oefenen: met uitleg na elke vraag, of als oefentoets.</li>' +
    '<li>Er zijn <span class="acc">verschillende soorten vragen</span>: één of meer antwoorden aanklikken, een antwoord typen, klikken op een rooster of kaartjes slepen. Lees telkens de uitleg boven je antwoord.</li>' +
    '<li>Kies je <span class="acc">Oefenen met uitleg</span>, dan zie je na elke vraag meteen of je juist was, met de oplossingsmethode. Veel opgaven krijgen telkens <span class="acc">nieuwe getallen</span>.</li>' +
    '<li>Moet je een <span class="acc">breuk</span> of een <span class="acc">macht</span> typen? Klik onder het invulvak op Breuk, Gemengd getal of Macht. Een kommagetal typ je met een komma.</li>' +
    '<li>Antwoord je juist, dan wordt de volgende vraag <span class="acc">moeilijker</span>. Antwoord je fout, dan wordt ze makkelijker.</li>' +
    '<li>Weet je het antwoord niet? Klik op <span class="acc">Ik weet het niet</span>. Gok niet: dan krijg je vragen die bij jou passen.</li>' +
    '<li>Bovenaan de opgave vind je de <span class="acc">Markeerstift</span>, de <span class="acc">Rekenmachine</span> en het <span class="acc">Woordenboek</span>. Staat de Rekenmachine er niet, dan reken je zonder.</li>' +
    '<li>Wil je een stuk tekst laten <span class="acc">voorlezen</span>? Zet links Voorlezen aan en selecteer de tekst.</li>' +
    '<li>Je niveau gaat van <span class="acc">E</span> (laagste) tot <span class="acc">A</span> (hoogste). Na elke reeks gaan je resultaten naar <span class="acc">je leerkracht</span>.</li></ul>';
}

function niveauRond(ls, label) {
  return '<div class="niv' + (ls ? ' heeft' : '') + '" title="' + (ls ? 'Je niveau na je laatste reeks' : 'Nog niet geoefend') + '"><div><b>' + (ls ? ls.n : '–') + '</b><span>' + (label || 'niveau') + '</span></div></div>';
}
const KOP = 'Oefen <em>wiskundige problemen</em>';
function toonThuis() {
  navActief = 'thuis'; tekenNav();
  setKop(KOP, 'Kies een domein. Tover met talent: elke reeks maakt je sterker.');
  const st = STROOM, s = si();
  const fouten = foutenLijst().length;
  const knop = (d, tekst, cls) => '<button class="knop' + (cls || '') + '" data-a="kies" data-d="' + d + '">' + tekst + '</button>';
  const nr = nrVan;
  const kaart = d => {
    const o = S.dom[st][d.k], ls = o && o.ses.length ? o.ses[o.ses.length - 1] : null;
    const aantal = VRAGEN.filter(q => q.d === d.k && q.lv[s] > 0 && gezien(q.id) > 0).length, tot = VRAGEN.filter(q => q.d === d.k && q.lv[s] > 0).length;
    return '<article class="kaart dom"><div class="card-head"><h3><span><span class="dnr">' + nr(d.k) + '.</span> ' + d.naam + (d.focus ? ' <span class="label">extra oefenen</span>' : '') + '</span></h3></div>' + niveauRond(ls) +
      '<p class="oms">' + (typeof d.oms === 'string' ? d.oms : d.oms[st]) + '</p>' +
      '<div class="voet"><span class="reeks">' + (ls ? 'Vorige reeksen: ' + o.ses.slice(-6).map(x => x.n).join(' → ') + ' · ' : '') + aantal + ' van ' + tot + ' opgaven geoefend</span>' + knop(d.k, 'Oefenen') + '</div></article>';
  };
  const mix = S.dom[st].mix, lm = mix && mix.ses.length ? mix.ses[mix.ses.length - 1] : null;
  const toetsen = TOETSEN.filter(t => !verborgen(t.k));
  toon('thuis',
    '<details class="kaart uitklap"' + (S.voorafGezien ? '' : ' open') + '><summary>Vooraf: zo werkt het</summary>' + voorafLijst() + '</details>' +
    secHead('Kies een domein', 'thuis') +
    '<div class="domeinen">' + zichtbareDom().map(kaart).join('') +
    (verborgen('mix') ? '' : '<article class="kaart dom"><div class="card-head"><h3><span><span class="dnr">' + nr('mix') + '.</span> Gemengde toets</span></h3></div>' + niveauRond(lm) + '<p class="oms">Vragen uit alle domeinen door elkaar.</p><div class="voet"><span class="reeks">' + (lm ? 'Vorige reeksen: ' + mix.ses.slice(-6).map(x => x.n).join(' → ') : '') + '</span>' + knop('mix', 'Oefenen') + '</div></article>') +
    (fouten ? '<article class="kaart dom"><div class="card-head"><h3>Mijn fouten opnieuw</h3></div><div class="niv"><div><b>' + fouten + '</b><span>' + (fouten === 1 ? 'vraag' : 'vragen') + '</span></div></div><p class="oms">Maak de vragen opnieuw die je de vorige keer fout had. Je krijgt uitleg na elke vraag.</p><div class="voet"><span class="reeks">Hoogstens 10 vragen per keer</span><button class="knop licht" data-a="fouten">Opnieuw proberen</button></div></article>' : '') +
    '</div>' +
    (toetsen.length ? secHead('Proeftoetsen', 'proef') + '<ul class="proeflijst">' + toetsen.map(proefRij).join('') + '</ul>' : ''));
  if (!S.voorafGezien) { S.voorafGezien = true; bewaar(); }
}
function proefRij(t) {
  const v = S.proef[t.k];
  return '<li class="proefrij"><span class="ic">' + ico('proef') + '</span><span class="pn">' + t.naam + '</span>' +
    (v ? '<span class="tag gd">Laatste poging: <b>' + v.j + '/' + v.t + '</b> · niveau <b>' + esc(v.n) + '</b></span>' : '<span class="tag">nog niet gemaakt</span>') +
    '<button class="knop' + (v ? ' licht' : '') + '" data-a="nav" data-d="' + t.k + '">' + (v ? 'Opnieuw' : 'Bekijk') + '</button></li>';
}

function toonKeuze(d) {
  navActief = d; tekenNav();
  setKop('<em>' + domNaam(d) + '</em>', 'Kies hoe je wil oefenen.');
  toon('keuze', secHead(domNaam(d), ICO[d] ? d : 'thuis', nrVan(d)) +
    '<form class="kaart" data-f="keuze" data-d="' + d + '" style="display:grid;gap:18px">' +
    '<fieldset class="veld"><legend>Hoe wil je oefenen?</legend><div class="keuze">' +
    '<label><input type="radio" name="modus" id="modusO" value="o" checked><span><b>Oefenen met uitleg</b>Na elke vraag zie je of je antwoord juist is, met de oplossingsmethode. Je kan ook een tip vragen.</span></label>' +
    '<label><input type="radio" name="modus" id="modusT" value="t"><span><b>Oefentoets</b>Zoals een toets: geen tips en geen uitleg tussendoor. Je ziet alles op het einde.</span></label></div></fieldset>' +
    '<fieldset class="veld"><legend>Hoeveel vragen?</legend><div class="keuze">' +
    '<label><input type="radio" name="n" id="n10" value="10" checked><span><b>10 vragen</b>ongeveer 15 minuten</span></label>' +
    '<label><input type="radio" name="n" id="n20" value="20"><span><b>20 vragen</b>ongeveer 30 minuten</span></label></div></fieldset>' +
    '<div class="rij"><button class="knop" type="submit" data-focus>Start</button><button class="knop stil" type="button" data-a="thuis">Terug</button></div></form>');
}

/* proeftoets: zoals een gewoon onderdeel van een module; opnieuw maken mag, de laatste poging telt */
function toonProef(k) {
  navActief = k; tekenNav();
  const t = TOETSEN.find(x => x.k === k), v = S.proef[k];
  setKop('<em>' + t.naam + '</em>', 'Werk rustig en alleen, zoals op een echte toets.');
  toon('proef', secHead(t.naam, 'proef', nrVan(k)) +
    '<section class="kaart"><div class="card-head"><h3>Zo werkt de proeftoets</h3></div><ul class="vink">' +
    '<li>De proeftoets telt <span class="acc">' + PROEF_N + ' vragen</span> uit alle domeinen door elkaar.</li>' +
    '<li>Je krijgt <span class="acc">geen tips en geen uitleg</span> tussendoor. Je kan niet terug naar een vorige vraag.</li>' +
    '<li>Na het indienen zie je je score, je niveau en alle vragen met de oplossingsmethode.</li>' +
    '<li>Je mag de proeftoets <span class="acc">opnieuw maken</span>. Je leerkracht ziet de score van je laatste poging.</li></ul></section>' +
    (v ? '<div class="wmeld">Je laatste poging (' + new Date(v.d).toLocaleDateString('nl-BE') + '): <b>' + v.j + ' van de ' + v.t + '</b> juist, niveau <b>' + esc(v.n) + '</b>.</div>' : '') +
    '<div class="rij"><button class="knop" data-a="proefstart" data-d="' + k + '" data-focus>' + (v ? 'Maak de proeftoets opnieuw' : 'Start de proeftoets') + '</button><button class="knop stil" type="button" data-a="thuis">Terug</button></div>');
}

const PLAN = '<div class="hulp"><b>Stappenplan</b><ol><li>Lees de opgave twee keer. Wat wordt er precies gevraagd?</li><li>Welke gegevens heb je nodig? Welke niet? Markeer ze.</li><li>Maak een schets, tabel of schema.</li><li>Reken stap voor stap en schrijf elke stap op.</li><li>Controleer: klopt je antwoord met de vraag en met de eenheid?</li></ol></div>';
const CALCICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="5.5" width="8" height="3.5"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01" stroke-width="2.6" stroke-linecap="round"/></svg>';
const PENICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 4l5 5L10 19H5v-5z"/><path d="M4 22h9" stroke="var(--orange)" stroke-width="3"/></svg>';
const BOEKICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.3a2.8 2.8 0 1 1 3.6 2.7c-.6.3-.9.8-.9 1.4V14" stroke-linecap="round"/><path d="M12 17.2h.01" stroke-width="2.8" stroke-linecap="round"/></svg>';
const mmss = t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
const tijd = () => mmss(Math.floor((Date.now() - ses.begin) / 1000));

function antwSectie() {
  const nr = ses.items.length, it = huidig(), q = it.q, oef = ses.modus === 'o', L = ['A', 'B', 'C', 'D'];
  let invoer = '';
  if (q.t === 'mc') {
    invoer = '<div class="opties" role="radiogroup" aria-label="Kies één antwoord">' + it.volg.map((oi, p) => {
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
  else if (q.t === 'klik') invoer = '<div class="roostervak">' + roosterSvg(q.rooster, {klik:!it.klaar, jouw:it.klik, juist:it.klaar ? q.w : null}) + '</div>';
  else if (q.t === 'vak') invoer = vakHtml(it);
  else if (q.t === 'volg') invoer = volgHtml(it);

  let onder;
  if (it.klaar) {
    const kopTxt = it.juist ? 'Juist!' : it.weetNiet ? 'Zo los je dit op.' : it.vormFout ? 'Bijna.' : 'Niet juist.';
    let extra = '';
    if (it.vormFout) extra += '<p class="juistreg">Je antwoord heeft de juiste waarde, maar het staat niet in de gevraagde schrijfwijze.</p>';
    if (!it.juist) {
      if (!it.weetNiet && q.t !== 'mc' && q.t !== 'klik' && q.t !== 'volg') extra += '<p class="juistreg">Jouw antwoord: <b>' + jouwTekst(it) + '</b></p>';
      if (q.t === 'num' || q.t === 'vak' || q.t === 'mk') extra += '<p class="juistreg">Juist antwoord: <b>' + juistTekst(q) + '</b></p>';
      if (q.t === 'klik') extra += '<p class="juistreg">Het juiste punt is groen gemarkeerd' + (it.klik ? ', jouw punt rood' : '') + '.</p>';
    }
    onder = '<div class="terug ' + (it.juist ? 'goed' : 'fout') + '" role="status"><h3>' + kopTxt + '</h3>' + extra + '<p class="methode">Oplossingsmethode</p><div class="uitleg">' + alineas(q.u) + '</div></div>' +
      '<div class="rij eind"><button class="knop" data-a="verder" data-focus data-fk="verder">' + (nr >= ses.n ? 'Bekijk je resultaat' : 'Volgende vraag') + '</button></div>';
  } else if (ses.stop) {
    onder = ses.proef ? '<div class="wmeld">Wil je de proeftoets nu indienen? Vragen die je nog niet maakte, tellen als fout.</div><div class="rij eind"><button class="knop licht" data-a="stopnee">Nee, ga verder</button><button class="knop" data-a="stopja">Ja, dien in</button></div>'
      : '<div class="wmeld">Wil je stoppen? Je resultaat tot nu toe wordt bewaard.</div><div class="rij eind"><button class="knop licht" data-a="stopnee">Nee, ga verder</button><button class="knop" data-a="stopja">Ja, stop</button></div>';
  } else {
    onder = (oef && it.tip && q.tip ? '<div class="hulp"><b>Tip</b><br>' + wis(q.tip) + '</div>' : '') + (oef && it.plan ? PLAN : '') +
      '<div class="rij eind">' + (oef && q.tip && !it.tip ? '<button class="knop stil" data-a="tip">Geef een tip</button>' : '') + (oef && q.d === 'pro' && !it.plan ? '<button class="knop stil" data-a="plan">Stappenplan</button>' : '') +
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
    '<button type="button" class="toolknop" data-a="wb" aria-expanded="' + (ses.paneel === 'wb') + '" aria-controls="wb">' + BOEKICOON + 'Woordenboek</button></div>';
  const wat = domNaam(ses.dom);
  setKop('<em>' + esc(wat) + '</em>' + (ses.mix || ses.dom === 'fout' ? ' · ' + domNaam(q.d).toLowerCase() : ''), '');
  /* bordmodus voor de leerkracht: de oplossingsmethode zin per zin als stappen (.sol) */
  const sols = leerkracht() && oef && !it.klaar ? q.u.split('\n').map(x => '<div class="sol" hidden>' + wis(x) + '</div>').join('') : '';
  const kop = 'Vraag ' + nr + ' van ' + ses.n;
  const binnen =
    '<div class="vbalk"><div class="voortgang" role="img" aria-label="' + kop + '">' + balkjes + '</div>' +
    (oef ? '<span class="tag">Niveau van deze vraag: <b>' + NIV[it.lv] + '</b></span>' : '<span class="tag" id="klok" aria-label="Verstreken tijd">⏱ ' + tijd() + '</span>') + tools +
    '<button class="knop stil" data-a="stop">' + (ses.proef ? 'Indienen' : 'Stoppen') + '</button></div>' +
    '<div class="vraag"><section class="kaart opgave' + (ses.marker ? ' markeren' : '') + '" aria-label="Opgave">' +
    (ses.paneel === 'calc' && q.calc ? calcHtml(q.calc) : '') + (ses.paneel === 'wb' ? wbHtml(q) : '') +
    (ses.marker ? '<p class="klein markuitleg">Markeerstift aan: selecteer woorden om ze te markeren. Klik op een markering om ze weg te halen.</p>' : '') +
    '<div class="tekst">' + (it.mark || alineas(q.q, true)) + '</div>' + (q.fig ? figuur(q.fig) : '') + (sols ? '<div class="sols">' + sols + '</div>' : '') + '</section>' +
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

const BOODSCHAP = {
  A:'Je zit op het hoogste niveau. Probeer nu ook een ander domein of de gemengde toets.',
  B:'Sterk gewerkt. Je lost ook moeilijkere vragen op. Blijf oefenen om niveau A te halen.',
  C:'Goed bezig. De basis zit erin. Bekijk de uitleg bij je fouten en probeer daarna opnieuw.',
  D:'Je bent op weg. Lees de uitleg bij elke fout rustig na en oefen dit domein nog een paar keer.',
  E:'Dit domein vraagt nog oefening. Kies Oefenen met uitleg, gebruik de tips en vraag hulp aan je leerkracht.'
};
function toonResultaat() {
  const af = ses.items, n = af.length;
  tekenNav();
  setKop(ses.proef ? '<em>' + domNaam(ses.dom) + '</em> ingediend' : 'Je <em>resultaat</em>', ses.proef ? '' : domNaam(ses.dom));
  const knoppen = '<div class="rij"><button class="knop" data-a="thuis" data-focus>Terug naar het overzicht</button>' +
    (ses.proef ? '<button class="knop licht" data-a="nav" data-d="' + ses.dom + '">Maak de proeftoets opnieuw</button>' : ses.dom !== 'fout' ? '<button class="knop licht" data-a="kies" data-d="' + ses.dom + '">Nog een reeks</button>' : '') + '</div>';
  const nT = ses.proef ? ses.n : n;
  const kop2 = !n && !ses.proef ? '<section class="kaart"><h2>Je hebt geen vragen beantwoord.</h2></section>' :
    '<section class="kaart uitslag">' + (ses.dom === 'fout' ? '<div class="groot"><div><b>' + ses.juist + '</b><span>van ' + n + ' juist</span></div></div>' : '<div class="groot"><div><b>' + ses.niv + '</b><span>niveau</span></div></div>') +
    '<div><h2>' + (ses.dom === 'fout' ? 'Je had ' + ses.juist + ' van de ' + n + ' vragen nu wel juist.' : 'Je had ' + ses.juist + ' van de ' + nT + ' vragen juist.') + '</h2>' +
    (ses.proef && n < ses.n ? '<p>Je diende in na ' + n + ' vragen. De vragen die je niet maakte, tellen als fout.</p>' : '') +
    (ses.dom === 'fout' ? '<p>Vragen die je nu juist had, verdwijnen uit je lijst met fouten.</p>' :
      '<p>' + (n < 5 ? 'Je maakte minder dan 5 vragen. Dat is te weinig om je niveau goed te schatten.' : BOODSCHAP[ses.niv]) + '</p>' +
      '<div class="schaal" role="img" aria-label="Niveau ' + ses.niv + ' op een schaal van E tot A">' + [1, 2, 3, 4, 5].map(l => '<div class="' + (NIV[l] === ses.niv ? 'nu' : '') + '">' + NIV[l] + '<small>' + (l === 1 ? 'laagste' : l === 5 ? 'hoogste' : '&nbsp;') + '</small></div>').join('') + '</div>' +
      '<p class="klein" style="margin-top:10px">Dit niveau is een schatting op basis van deze reeks.</p>') +
    '</div></section>';
  const lijst = af.map((it, i) => {
    const q = it.q, kern = platte(q.q.split('\n').pop());
    return '<details' + (!it.juist && af.filter(x => !x.juist).length <= 3 ? ' open' : '') + '><summary><span class="st ' + (it.juist ? 'j' : 'f') + '" aria-hidden="true">' + (it.juist ? '✓' : '✗') + '</span><span class="kort">Vraag ' + (i + 1) + ': ' + esc(kern) + '</span><span class="tag">' + (it.juist ? 'juist' : 'fout') + ' · niveau ' + NIV[it.lv] + '</span></summary><div class="in"><div class="tekst">' + alineas(q.q, true) + '</div>' + (q.fig ? figuur(q.fig) : '') +
      '<div class="jouw">' + (it.juist ? '' : '<div>Jouw antwoord: <b>' + jouwTekst(it) + '</b></div>') +
      (q.t === 'klik' ? '<div class="roostervak">' + roosterSvg(q.rooster, {jouw:it.klik, juist:q.w, alt:'Rooster met het juiste punt in het groen'}) + '</div>' : '<div>Juist antwoord: <b>' + juistTekst(q) + '</b></div>') +
      (it.vormFout ? '<div class="klein">Je antwoord had de juiste waarde, maar niet de gevraagde schrijfwijze.</div>' : '') + '</div><p class="methode">Oplossingsmethode</p><div class="uitleg">' + alineas(q.u) + '</div></div></details>';
  }).join('');
  toon('res', kop2 + knoppen +
    (n ? secHead('Alle vragen met uitleg', 'fout') + '<div class="nakijk">' + lijst + '</div>' : ''));
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
  fouten() { start('fout', 'o', 10); },
  proefstart(el) { start(el.dataset.d, 't', PROEF_N, true); },
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
  if (d === 'fout') { if (foutenLijst().length) return start('fout', 'o', 10); d = 'thuis'; }
  if (d !== 'thuis' && (verborgen(d) || !SECTIONS.some(s => s.id === d))) d = 'thuis';
  if (d === 'thuis') toonThuis();
  else if (isToets(d)) toonProef(d);
  else toonKeuze(d);
}
document.addEventListener('click', e => {
  if (!inSite(e.target) && !(e.target.closest && e.target.closest('nav.side'))) return;
  // klikken op het rooster
  const rs = e.target.closest('svg.klikbaar');
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
  if (oud) { S.dom = oud.dom || {A:{}}; S.q = oud.q || {}; S.proef = oud.proef || {}; S.voorafGezien = !!oud.voorafGezien; S.t = oud.t || 0; }
  if (!S.dom.A) S.dom.A = {};
  /* het dashboard telt per onderdeel de vragen van de pool */
  VRAGEN.forEach(q => { if (q.lv[si()] > 0) CLvraag(q.d + '_' + q.id); });
  const h = decodeURIComponent(location.hash.slice(1));
  ga(SECTIONS.some(s => s.id === h) ? h : 'thuis');
})();
/* voor test/catalogus.js en de testscripts */
window.SECTIONS = SECTIONS;
window.show = id => { ses = null; ga(id); };
window.__oefensite = {ids:() => VRAGEN.filter(q => q.lv[si()] > 0).map(q => q.id), rekenUit, nieuweTheta, figuur, roosterSvg, naarBreuk, start:(d, m, n, p) => start(d, m, n, p), ses:() => ses,
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
    tekenAntw(); },
  toonId:(id, modus) => { let q = VRAGEN.find(x => x.id === id); if (q.gen) q = maakVraag(q); navActief = q.d; ses = {dom:q.d, si:0, modus:modus || 'o', n:1, th:3, items:[nieuwItem(q, q.lv[0] || q.lv[1])], gebruikt:{}, begin:Date.now(), tips:0, klaar:false, sel:null, soort:'oefenen'}; toonVraag(); }};
})();
