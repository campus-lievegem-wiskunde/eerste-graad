# Overdracht oefenplatform wiskunde Campus Lievegem

Stand van 17 oktober 2026 · de beheerder

Aangevuld op 23 oktober 2026 door de collega-bouwer: taakverdeling en 2A Wiskundige problemen. Aangevuld op 24 oktober 2026: automatische tests en goedkeuring op GitHub. Aangevuld op 29 oktober 2026: Vrij oefenen (1A en 2A) en vrij antwoordvak met tussenstappen, en bijgewerkt met alles wat op main staat tot PR 47 (ook het werk van de collega-bouwer: 1A heuristieken, 2B modules, kleuren van bouwsels).

> Openbare versie van het overdrachtsdocument (zonder namen en mailadressen). De volledige versie staat in de projectbestanden van het Claude-project (projectkennis/). Wijzig beide samen.

## Hoe dit document gebruiken

Dit document bevat alles wat nodig is om in een nieuw gesprek verder te bouwen aan het oefenplatform, zonder opnieuw uit te leggen. Voeg het toe als projectkennis of laad het op in een nieuw gesprek, samen met het startbericht hieronder.

De broncode zelf staat altijd in GitHub en is de enige waarheid. Dit document beschrijft de afspraken en de werking; wijkt de code af, dan wint de code en pas je dit document aan.

Twee vaardigheden horen erbij en laden automatisch: **huisstijl-campus-lievegem** (kleuren, lettertype, opmaak) en **oefenwebsite-uit-werkboek** (een oefensite bouwen uit de PDF van een werkboek). Het oorspronkelijke ontwerp staat in het document "Plan oefenplatform wiskunde Campus Lievegem".

### Startbericht voor een nieuw gesprek

Kopieer dit en vul de laatste zin aan:

```
Ik werk verder aan het oefenplatform wiskunde eerste graad van Campus Lievegem. Lees eerst het overdrachtsdocument (in bijlage of in de projectkennis). De code staat in de GitHub-repository campus-lievegem-wiskunde/eerste-graad: koppel die repository aan dit gesprek en clone ze. Gebruik de vaardigheden huisstijl-campus-lievegem en oefenwebsite-uit-werkboek. Werk in het Nederlands, test alles met de nep-Firebase voor je pusht, en zeg me wanneer ik de Firestore-regels opnieuw moet publiceren. Vandaag wil ik: …
```

## Doel en kernbeslissingen

Eén website voor alle wiskunde-oefeningen van de eerste graad, waar leerlingen aanmelden met hun schoolaccount en leerkrachten in een dashboard per groep openzetten en opvolgen. De proef loopt in schooljaar 2026-2027 op Chromebooks.

| Onderwerp | Beslissing |
| --- | --- |
| Hosting | GitHub Pages, één repository voor de hele eerste graad, één map per module |
| Aanmelden en gegevens | Firebase (Google-aanmelding en Firestore), regio europe-west1, gratis Spark-abonnement |
| Wie mag aanmelden | Enkel @svsl.be-accounts |
| Rollen | Beheerder (de beheerder, plus wie beheerrecht krijgt), leerkracht, leerling, toeschouwer (bv. de directeur: oefenomgeving met een fictieve school, zie Toeschouwer) |
| Indeling | Leerkrachten koppelen zich aan niveaugroepen; beheerder laadt jaarlijks de leerlingenlijst op (Excel uit Smartschool) |
| Openzetten | Per groep en per module, en binnen een module per onderdeel. Gesloten modules zijn voor leerlingen volledig verborgen |
| Voortgang | Antwoorden, juist of fout per vraag, scores van proeftoetsen en actieve werktijd per onderdeel |
| Wat de leerling ziet | Enkel zijn eigen werk (vinkjes). Bij gescoorde reeksen later ook "Mijn resultaten" met feedback per vraag |
| Proeftoetsen | Opnieuw maken mag; de laatste poging telt |
| Vinkje | Een onderdeel is af als alle kaarten van basis en oefenen juist zijn |
| Apps Script | Niet meer nodig: de brug naar Classroom zit sinds 28 oktober 2026 in het dashboard (zie Google Classroom) |
| Niet doen | Tabblad verlaten bijhouden, meldingen, berichten aan ouders, PDF van antwoorden (uitzondering sinds 24 oktober 2026: toetsen en taken, zie Toetsen en taken) |

### Opbouw van het platform

```
                              ┌─ pagina's laden ──────▶ GitHub Pages
                              │                         repository eerste-graad: modules, dashboard en gedeeld/
Browser (Chromebook) ─────────┼─ aanmelden ───────────▶ Firebase Authentication
leerling of leerkracht        │                         Google-aanmelding, enkel @svsl.be
kop.js en aanmelden.js        └─ lezen en schrijven ◀─▶ Cloud Firestore (europe-west1)
inhoud.js of dashboard.js                               beheerders, leerkrachten, leerlingen, groepen, voortgang
                                                        toegang via firestore.rules
                                                             ┆ later
                                                             ▼
                                                        Google Classroom (Classroom API, vanuit het dashboard)
```

De browser haalt de pagina's van GitHub Pages, meldt aan via Firebase en leest en schrijft alle gegevens rechtstreeks in Firestore; er is geen eigen server.

## Adressen, accounts en toegang

Alles staat op naam van het schoolaccount van de beheerder; Claude werkt via de GitHub-app in de repository en heeft geen toegang tot de Firebase-console.

| Wat | Waar |
| --- | --- |
| Website (leerlingen) | https://campus-lievegem-wiskunde.github.io/eerste-graad/ |
| Dashboard (leerkrachten) | https://campus-lievegem-wiskunde.github.io/eerste-graad/dashboard/ |
| GitHub-organisatie en repository | campus-lievegem-wiskunde / eerste-graad (branch main, Pages publiceert vanaf main) |
| Firebase-project | campus-lievegem-wiskunde, console.firebase.google.com |
| Firestore-regio | europe-west1 (België) |
| Aanmeldmethode | Google, beperkt tot het domein svsl.be |
| Geautoriseerde domeinen (Firebase Authentication) | campus-lievegem-wiskunde.github.io (en localhost) |
| Schooljaar in de code | gedeeld/firebase-config.js, constante SCHOOLJAAR = '2026-2027' |

De Firebase-sleutels in firebase-config.js zijn niet geheim; de beveiliging zit in de Firestore-regels.

### Mensen

E-mailadressen volgen meestal het patroon familienaam.voornaam@svsl.be, zonder spaties, accenten of apostrofs (Janssens Zoë wordt janssens.zoe@svsl.be). **Let op:** sommige echte adressen bevatten wel een koppelteken (dubbele familienaam). Het platform vergelijkt het aanmeldadres letterlijk met de leerlingenlijst en de groepen; wijkt het af, dan ziet de leerling geen modules (23 oktober 2026: een leerling met koppelteken stond zonder koppelteken in haar groep; opgelost door het adres in Beheer, Leerling opzoeken en wijzigen, te verbeteren).

| Wie | Rol |
| --- | --- |
| De beheerder (leerkracht wiskunde) | Beheerder (kan wisselen tussen Mijn groepen en Beheer) |
| Zeven collega's wiskunde | Leerkracht |

De koppeling leerkracht-groep staat in het dashboard (Beheer, Niveaugroepen) en kan daar altijd wijzigen.

**Taakverdeling bij het bouwen (24 oktober 2026, bevestigd door de beheerder):** De beheerder werkt in 1A en 2A aan de rubrieken modules en rekenvaardigheden. De collega-bouwer werkt in 1A en 2A aan basisgeletterdheid, heuristieken en wiskundige problemen, en in 2B aan alles. Toetsen en huistaken (in alle jaren) doen ze samen. 1B doet voorlopig niemand: de leerkracht van 1B gebruikt het platform (nog) niet; de tegel 1B en de structuur staan klaar voor als het ooit nodig is. De collega-bouwer werkt nooit rechtstreeks op main, maar op een eigen branch (tom/…) met een pull request die de beheerder nakijkt en samenvoegt. De beheerder is eigenaar van de GitHub-organisatie en het Firebase-project en kan dus overal alles bewerken, ook wat de collega-bouwer bouwde. Elk van beiden houdt een kopie van dit document in zijn eigen project; wissel na een wijziging de nieuwe versie uit.

## Mappenstructuur

De startpagina toont vier tegels: 1A, 2A, 1B en 2B. Onder elk staan dezelfde vijf rubrieken; een rubriekmap bestaat pas als er inhoud in zit. Op 23 oktober 2026 hebben 1A/modules, 2A/modules en 2A/wiskundige-problemen inhoud.

```
eerste-graad/
├── index.html                  startpagina: tegels 1A · 2A · 1B · 2B
├── 1A/
│   ├── index.html              "Wat wil je oefenen?" (tegels per rubriek)
│   └── modules/
│       ├── index.html          tegels van de modules
│       ├── module-1-getallen/  index.html + inhoud.js
│       ├── module-2-meetkunde/ index.html + inhoud.js
│       └── module-3-data/      index.html + inhoud.js
├── 2A/
│   ├── index.html
│   ├── modules/                module-1-transformaties, module-2-algebraische-uitdrukkingen,
│   │                           module-3-hoeken-evenwijdigen
│   └── wiskundige-problemen/   index.html + inhoud.js + module.css (site 2a-wp; op main: PR 21)
├── 1B/  index.html             idem
├── 2B/  index.html             idem
├── dashboard/                  index.html, dashboard.js, dashboard.css
├── gedeeld/                    stijl.css, kop.js, aanmelden.js,
│                               firebase-config.js, sites.js, img/
├── test/                       nep-Firebase, rooktest, catalogusscript, voorbeeld.xlsx
├── firestore.rules
└── README.md
```

### Naamafspraken

- **Jaar en stroom:** 1A en 2A (A-stroom), 1B en 2B (B-stroom).
- **Rubrieken:** modules, rekenvaardigheden, vrij-oefenen (sinds 29 oktober 2026), basisgeletterdheid, heuristieken, wiskundige-problemen (kleine letters, koppelteken). Gepland (24 oktober 2026): toetsen en huistaken.
- **Modulemap:** module-<nummer>-<kernwoord>, bv. module-3-transformaties. Het nummer volgt het werkboek.
- **Site-id** (in data-site en sites.js): kort en uniek over het hele platform: m1, m2 voor 1A; voor de andere jaren met voorvoegsel, bv. 2a-m1, 1b-m1, 2b-m3 (vastgelegd op 17 oktober 2026 bij 2A Module 1). Rubrieken buiten modules (23 oktober 2026): heur voor heuristieken, wp voor wiskundige problemen, bg voor basisgeletterdheid, bv. 1a-heur1, 1a-wp1, 1a-bg1, 2a-heur1.
- **Vraag-id's:** elk vraag-id begint met de kaartsleutel (onderdeel-id_kaartnummer_…). De motor zet dat er zelf voor via CURKEY en QID, zodat het dashboard per onderdeel telt. Sleep-, kleur- en tekenoefeningen tellen mee.
- **Prefix** (data-prefix): de sleutel voor localStorage en Firestore, bv. m1_herh_v2_. Nooit meer wijzigen zodra leerlingen werken, anders lijkt hun werk verdwenen.
- **Webadres van een module:** …/eerste-graad/<jaar>/<rubriek>/<modulemap>/

### Groepen

| Jaar | Groepen (vaste volgorde) |
| --- | --- |
| 1ste jaar | 1B (klas B-stroom), 1C, 1D (klasgroepen), 1ANg1, 1ANg2a, 1ANg2b, 1ANg2c, 1ANg2d, 1ANg2e, 1ANg3 (niveaugroepen) |
| 2de jaar | 2B, 2C, 2D, 2ANg1, 2ANg2a, 2ANg2b, 2ANg2c, 2ANg2d, 2ANg2e, 2ANg3 |

Klassen 1E tot 1J (en 2E tot 2J) worden voor wiskunde opgesplitst over de niveaugroepen; 1C en 1D krijgen wiskunde in hun klas. 1B is geen niveaugroep van de A-stroom maar gewoon klas 1B van de B-stroom.

## Gedeelde bestanden (gedeeld/)

Wat in gedeeld/ staat, gebruikt elke pagina; een wijziging daar verandert alle modules tegelijk.

| Bestand | Wat het doet |
| --- | --- |
| stijl.css | De volledige huisstijl: kleuren, Calibri/Carlito, kaders, tabbladen, zijbalk, knoppen, tegels, aanmeldscherm, gebruikerschip, meldingen. Komt uit module 2 met aanvullingen voor het platform. |
| kop.js | Bouwt bij elke pagina de kop (logo links, beeldmerk met sterren rechts), de voettekst met logo, de knoppen bovenaan de zijbalk (inklappen en voorlezen) en het voorleesvak. Onthoudt per site of de zijbalk ingeklapt is (sleutel <site>_navCollapsed). Voorlezen staat standaard uit en kiest een Nederlandstalige, bij voorkeur Belgische mannenstem. |
| bord.js | Bordmodus voor alle modules (20 oktober 2026): kop.js laadt het op elke oefenpagina. Na 'inhoud-geladen' krijgt elke kaartkop een knop **⛶ Bord**, behalve in de proeftoetsen (onderdeel-id begint met toets); ook kaarten van onderdelen die pas later opgebouwd worden (MutationObserver). Verborgen onder 700 px. Toont de kaart groot met Volgende/Vorige stap (pijltjestoetsen, Esc sluit): stappen zijn de uitgeschreven oplossingen (.sol), knoppen Toon mij hoe, Toon de werkwijze, Bekijk hoe het moet en ▶, en een losse Toon oplossing. Heeft een module zelf al een bordknop (.px-bord-btn in 1A module 3, .bord-btn in 2A module 2), dan doet bord.js niets. Een nieuwe module krijgt de knop dus vanzelf. **Enkel leerkrachten en beheerders** (body data-rol uit aanmelden.js) zien Bord, ook de eigen bordknop van 1A module 3 en 2A module 2 (verborgen met CSS). **Leerlingen** krijgen op dezelfde plaats **⛶ Volledig scherm** (.px-vs-btn, 20 oktober 2026): de kaart groot en op volledig scherm met enkel ✕ Sluiten, zonder oplossingsstappen; hun werk wordt gewoon bewaard. Verlaten ze het volledig scherm (Esc), dan sluit ook het venster. |
| aanmelden.js | Aanmeldscherm (Google, enkel @svsl.be), rol bepalen, groepen van de leerling ophalen, tegels en onderdelen verbergen die niet openstaan, voortgang ophalen en elke 30 seconden bewaren, actieve werktijd meten, gebruikerschip met Afmelden (en Dashboard voor leerkrachten). Laadt daarna pas inhoud.js. |
| firebase-config.js | De Firebase-gegevens, het domein svsl.be en het schooljaar. |
| sites.js | De catalogus: elke module met id, titel, jaar, rubriek, pad, prefix en de lijst onderdelen met het aantal controleerbare vragen. Het dashboard leest hieruit welke modules en onderdelen er zijn. |
| img/ | logo.png (Campus Lievegem met slogan), beeldmerk.png (figuurtje), ster.png. |

### Volgorde bij het openen van een oefenpagina

1. kop.js tekent kop, voettekst en zijbalkknoppen.
2. aanmelden.js toont het aanmeldscherm tot de gebruiker aangemeld is.
3. Het bepaalt de rol (beheerders, dan leerkrachten, anders leerling).
4. Voor een leerling: groepen ophalen. Geen groep: melding "Je bent nog niet ingedeeld in een groep." met het adres waarmee de leerling aanmeldde (ook op de tegelpagina), zodat de leerkracht het kan vergelijken met de leerlingenlijst (23 oktober 2026) Module dicht: melding "Deze module staat nog niet open." Anders worden de gesloten onderdelen in window.CL_VERBORGEN gezet.
5. De voortgang uit Firestore wordt in localStorage gezet (bij een andere gebruiker op hetzelfde toestel wordt eerst alles van die module gewist).
6. inhoud.js wordt geladen en bouwt de oefeningen; verborgen onderdelen worden weggelaten.
7. Elke wijziging in localStorage met de prefix wordt gemarkeerd en om de 30 seconden, en bij het verlaten van de pagina, naar Firestore gestuurd.

Leerkrachten zien in een module altijd alle onderdelen, met de melding "Je bekijkt deze module als leerkracht".

## Hoe een module technisch werkt

Een module bestaat uit twee bestanden: index.html met de titel en het geraamte, en inhoud.js met de oefeningen. Daarna komt ze in sites.js en krijgt ze een tegel.

### index.html

De body draagt drie attributen; de paden naar gedeeld/ gaan drie mappen omhoog.

```html
<body data-site="m1" data-prefix="m1_herh_v2_" data-inhoud="inhoud.js">
<header class="top">
  <p class="eyebrow">Wiskunde · herhalingsoefeningen</p>
  <h1>Module 1 · <em>inzicht in getallen</em></h1>
  <p class="tagline">Reken, ordenen en ontdekken: tover met talent!</p>
</header>
<div class="shell">
  <nav class="side" aria-label="Onderdelen"><ol id="nav"></ol></nav>
  <main id="main"> …info-box… <div id="app"></div><div class="pager" id="pager"></div></main>
</div>
<script src="../../../gedeeld/kop.js"></script>
<script type="module" src="../../../gedeeld/aanmelden.js"></script>
</body>
```

inhoud.js wordt niet rechtstreeks geladen: aanmelden.js laadt het pas na het aanmelden.

### inhoud.js

- Bevat de engine (navigatie, kaarten, controle, opnieuw beginnen, proeftoetsen) en de inhoud in een lijst SECTIONS, elk onderdeel met een id en een naam voor de zijbalk (nav).
- Bewaart alle antwoorden in localStorage onder sleutels die met de prefix beginnen. aanmelden.js spiegelt die automatisch naar Firestore; de engine hoeft niets van Firebase te weten.
- Voor het weglaten van gesloten onderdelen haalt de engine vóór het opbouwen de id's uit window.CL_VERBORGEN uit SECTIONS.
- Proeftoets-onderdelen hebben een id die met toets begint.

### Drie haken voor de voortgang

Bovenaan inhoud.js staan drie kleine functies die doorgeven aan window.CL (gemaakt door aanmelden.js). Ze doen niets als de pagina zonder aanmelden draait.

```js
const CLres   = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
```

- **CLvraag(id)**: roepen bij het tekenen van elke controleerbare vraag (telt het aantal vragen).
- **CLres(id, ok, info)**: roepen na elke controle; ok = juist of fout, info = true voor een melding die geen antwoord is (telt dan niet). Wordt bewaard in <prefix>_res als {vraag-id: 1 of 0}.
- **CLtoets(key, score, n)**: roepen als een proeftoets is ingediend. Wordt bewaard in <prefix>_toets als {key: {score, n, datum}}; een nieuwe poging overschrijft de vorige (laatste poging telt).

Vraag-id's beginnen met het id van hun onderdeel plus een underscore (bv. priem_3); zo telt het dashboard per onderdeel.

### sites.js bijwerken

sites.js wordt automatisch gemaakt door test/catalogus.js, dat elke module opent, alle onderdelen toont en de vraag-id's telt. Bij een nieuwe module voeg je in sites.js een element toe met onderdelen:[] en draai je het script opnieuw. Elk element ziet er zo uit:

```js
{ id:'m1', titel:'Module 1 · Inzicht in getallen', kort:'Module 1', jaar:'1A', rubriek:'modules',
  pad:'1A/modules/module-1-getallen/', prefix:'m1_herh_v2_',
  onderdelen:[ { id:'getallen', naam:'Getallen vormen', toets:false, vragen:40 }, … ] }
```

### Tegel

In de index.html van de rubriek komt een tegel met hetzelfde data-site. aanmelden.js verbergt voor leerlingen elke tegel waarvan de module niet openstaat voor hun groep.

```html
<a class="tegel" data-site="m1" href="module-1-getallen/"><span class="t-ic">1</span><span><b>Module 1</b><span class="sub">Inzicht in getallen</span></span><span class="pijl">→</span></a>
```

## Firebase: aanmelden, rollen en datamodel

Firebase wordt geladen als modulaire SDK versie 10.12.2 vanaf gstatic.com; er is geen bouwstap. De rol volgt uit het bestaan van een document: wie in beheerders staat is beheerder, wie in leerkrachten staat is leerkracht, ieder ander @svsl.be-account is leerling.

### Collecties in Firestore

| Collectie / document-id | Velden | Wie schrijft |
| --- | --- | --- |
| beheerders/{e-mail} | naam | Beheerder (schakelaar Beheer in het dashboard) |
| leerkrachten/{e-mail} | naam | Beheerder (import of dashboard) |
| leerlingen/{e-mail} | familienaam, voornaam, klas, jaar ('1' of '2'), stroom ('A' of 'B'), schooljaar | Beheerder (import of dashboard) |
| groepen/{groep-id} | naam, jaar, stroom, soort, leerkrachten [e-mails], leerlingen [e-mails], aan {site-id: {on: true/false, uit: [onderdeel-id's]}} | Beheerder maakt en verwijdert; leerkrachten wijzigen (eigen groepen kiezen, leerlingen verplaatsen, openzetten) |
| voortgang/{uid}_{site-id} | email, naam, site, schooljaar, bijgewerkt, data {sleutel: tekst}, tijd {onderdeel-id: seconden}, res {vraag-id: 1/0}, toets {sleutel: {score, n, datum}}, diag {tellers, toestel, laatste fouten} (tijdelijk, zie Diagnose witte vakjes) | De leerling zelf (automatisch); leerkrachten lezen en wissen |
| toeschouwers/{e-mail} | naam | Beheerder (Beheer, kaart Toeschouwers) |
| fouten/{datum_willekeurig} | melder (e-mail), naam, site (site-id of 'ander'), onderdeel, waar, fout, alternatief, status (nieuw, bezig, opgelost, niet), reactie, datum, bijgewerkt | Leerkracht maakt aan (Fout melden); beheerder wijzigt status en reactie |

Het groep-id is de naam met spaties en schuine strepen vervangen door een koppelteken (1ANg2a blijft 1ANg2a). In data staan de localStorage-sleutels van de module, met <prefix>_res en <prefix>_toets voor de resultaten.

### Werktijd

Alleen actieve tijd telt: elke 5 seconden komt er 5 seconden bij voor het zichtbare onderdeel, op voorwaarde dat de pagina zichtbaar is en er in de laatste 60 seconden geklikt, getypt of gescrold werd.

### Diagnose witte vakjes (tijdelijk, 23 oktober 2026, op main: PR 23, merge 0a287c3)

Aanleiding: in 2A Module 3 bleven alle cellen wit (wel werktijd, geen resultaten), terwijl het in de testomgeving en in de andere modules wel werkte. Zonder echte gegevens was de oorzaak niet te vinden, dus de beheerder koos voor een tijdelijke diagnose (geen nieuwe Firestore-regels nodig).
- aanmelden.js houdt per leerling en module een object diag bij en stuurt het mee bij elke bewaring (veld diag van voortgang/{uid}_{site-id}, niet in data, dus het komt niet in localStorage). Inhoud: sessies (keer geopend), controles (oproepen van CL.res), genegeerd (info = true), mislukt (resultaat niet in localStorage geschreven), bewaren (pogingen), bewaardFout, resNu (aantal resultaten op het toestel), resMee, toestel (bv. "Chrome op Chromebook"), ua, fout en foutOp (laatste fout bij ophalen, bewaren of resultaat), jsfout en jsfoutOp (laatste JavaScript-fout op de pagina), op (laatste verzending), versie diag1. De tellers lopen door over sessies.
- Dashboard, Voortgang, klik op een naam: onder het detail staat een regel "Diagnose" met die gegevens en het aantal resultaten dat in Firebase staat. Enkel zichtbaar voor beheerders (niet voor collega's of een toeschouwer), keuze van de beheerder.
- Weghalen zodra de oorzaak gevonden is: functies toestel, diagFout, diagStart en het gebruik van diag in aanmelden.js, en diagRegel in dashboard.js.

### Resultaten nooit overschrijven (23 oktober 2026, op main: PR 26, merge 9443cd6)

Oorzaak van de witte vakjes (gezien in 1A Module 3: resultaten van De Baets en Iterbeke van 22 oktober waren de dag erna weg, de werktijd niet): <prefix>_res werd als één tekst in data bewaard en bij elke bewaring volledig overschreven. Lukte het ophalen bij het openen niet (trage wifi als de hele klas start) en stond er niets op het toestel, of stond de module in een tweede tabblad open, dan overschreef een korte lijst alle oudere resultaten. Werktijd werd per onderdeel samengevoegd en bleef dus staan. In de testomgeving nagebootst met test/resultaten.js.
Herstel in aanmelden.js:
- CL.res en CL.toets bewaren elke nieuwe uitkomst ook in de velden res {vraag-id: 1/0} en toets {sleutel: {score, n, datum}} van het voortgangsdocument. Firestore voegt die samen (merge), dus een bewaring wist nooit oudere resultaten. data._res en data._toets blijven bestaan (lokale kopie en oudere gegevens).
- Bij het openen tot drie pogingen om de voortgang op te halen. Lukt het niet, dan bewaart de pagina niets tot het ophalen bij een volgende bewaring wel lukt; dan worden de gegevens samengevoegd (resultaten: unie, werktijd: opgeteld, wat lokaal al gewijzigd was blijft).
- Bij het ophalen worden _res en _toets samengevoegd met wat op het toestel staat, in plaats van overschreven.
Dashboard (verwerk): resultaten = data._res aangevuld met res, proeftoetsen = data._toets aangevuld met toets. Geen nieuwe Firestore-regels nodig.

### Openzetten

Voor een leerling staat een module open als minstens één van zijn groepen aan.<site>.on = true heeft. De verborgen onderdelen zijn de doorsnede van uit over zijn open groepen. Een leerling zonder groep ziet niets.

## Firestore-regels

De regels staan in firestore.rules in de repository, maar werken pas als ze in de Firebase-console gepubliceerd zijn: Firestore Database, tabblad Regels, alles vervangen door de inhoud van het bestand, Publiceren. Elke keer dat firestore.rules wijzigt, moet dat opnieuw; Claude meldt het telkens.

| Collectie | Lezen | Schrijven |
| --- | --- | --- |
| beheerders | Jezelf, of een beheerder | Beheerder |
| leerkrachten | Leerkracht, of jezelf | Beheerder |
| leerlingen | Leerkracht, of jezelf | Beheerder |
| groepen | Leerkracht, of een leerling die in de lijst leerlingen staat | Aanmaken en verwijderen: beheerder. Wijzigen: leerkracht |
| voortgang | Eigen documenten (id begint met je uid), en leerkrachten | Eigen documenten; leerkrachten mogen wissen |
| toeschouwers | Jezelf, of een beheerder | Beheerder |

| fouten | Beheerder alles; leerkracht enkel zijn eigen meldingen | Aanmaken: leerkracht op eigen naam met status nieuw. Wijzigen: beheerder. Verwijderen: beheerder, of de melder zolang de status nieuw is |
| zeeslag/{code} | Iedereen die aangemeld is | Aanmaken op eigen naam (a) met b leeg. Wijzigen: speler a of b, of meedoen zolang b leeg is. Verwijderen: leerkracht |
| zeeslag/{code}/geheim/{e-mail} | Enkel de speler zelf (zijn schepen) | Enkel de speler zelf; leerkracht mag wissen |
| klassessie/{code} | Iedereen die aangemeld is | Aanmaken: leerkracht op eigen naam (lk). Wijzigen en verwijderen: die leerkracht of een beheerder |
| klassessie/{code}/deelnemers/{e-mail} | Leerkracht, of de leerling zelf | De leerling zelf (zolang de sessie bestaat); verwijderen: leerkracht of de leerling zelf |

Een toeschouwer (functie toeschouwer()) mag daarnaast lezen in beheerders, leerkrachten, leerlingen, groepen, voortgang en fouten, maar nergens schrijven.

Aanmelden vereist een geverifieerd e-mailadres dat eindigt op @svsl.be (hoofdletterongevoelig). Een beheerder geldt ook als leerkracht.

Wijziging in PR 32 (24 oktober 2026, op main): collecties inzendingen, sleutels en resultaten voor toetsen en taken (volledig bestand: /mnt/project-files/toetsen-en-taken/firestore.rules.txt); gepubliceerd door de beheerder op 24 oktober 2026. Laatste wijziging aan de regels: 20 oktober 2026, collectie klassessie (Module 3, op main via PR 8; één volledig bestand met toeschouwers, zeeslag en klassessie). Daarvoor collectie toeschouwers en functie toeschouwer() (PR 7; het gepubliceerde bestand bevat ook zeeslag en klassessie). Daarvoor collectie zeeslag (Module 3). Daarvoor collectie fouten (Fout melden). Daarvoor fase 3 (dashboard). Latere aanpassingen tot en met 17 oktober 2026 (e-mail wijzigen, leerkrachten toewijzen, vervanging, beheerrecht) vroegen geen nieuwe regels. 2A Wiskundige problemen (PR 21, 23 oktober 2026, en PR 29, 24 oktober 2026) vraagt geen nieuwe regels.

## Dashboard

Het dashboard heeft drie tabbladen: Mijn groepen en Fout melden (iedere leerkracht) en Beheer (enkel beheerders; daarbinnen Beheren en Fouten). Alles staat in dashboard/dashboard.js; groepen verschijnen overal in de volgorde 1B, 1C, 1D, 1ANg1 … 1ANg3, 2B, 2C, 2D, 2ANg1 … 2ANg3.

### Mijn groepen

- **Mijn groepen kiezen:** de leerkracht vinkt per jaar zijn groepen aan of uit.
- **Vervanging collega:** eerst de namen van de collega's (met het aantal groepen), dan de groepen van de gekozen collega, dan klikken op een groep. Een oranje balk toont dat je in vervanging werkt; "Terug naar mijn groepen" sluit dat af.
- Per gekozen groep drie tabbladen, in de volgorde Openzetten, Voortgang, Leerlingen (sinds 23 oktober 2026 staat Openzetten links en opent het standaard bij het kiezen van een groep, op vraag van de beheerder):
  - **Voortgang** (sinds 23 oktober 2026, PR 24): eerst een **overzicht** leerlingen × open sites, gegroepeerd per rubriek, met per site het deel van alle vragen juist en de werktijd; klik op een sitenaam voor de tabel per onderdeel. De keuzelijst Site is geordend per rubriek en toont enkel open sites; het vinkje "ook gesloten sites" toont de rest met "(dicht)". Reden: straks ±25 sites per jaar (15 modules en een tiental andere oefeningen).
  - **Voortgang per site:** tabel leerlingen × onderdelen van de gekozen module. Elke cel toont juist/aantal vragen en de werktijd, met een kleur van weinig tot (bijna) alles juist; proeftoetsen tonen de score. Houdt een site een niveau bij (data.niv, zoals 2A Wiskundige problemen), dan staat de letter A-E in een bolletje vooraan in de cel en bij het onderdeel in het detail per leerling. Klik op een naam voor het detail per leerling. Knop Vernieuwen.
  - **Leerlingen:** leerlingen van de groep, verplaatsen naar een andere groep, uit de groep halen, en toevoegen uit de leerlingenlijst (filter op klas, zoeken, optie om uit hun huidige groep te verplaatsen).
  - **Openzetten:** per module een schakelaar aan of uit, en daaronder per onderdeel een vinkje. Wordt meteen bewaard. Sinds PR 24 (23 oktober 2026): de sites staan per rubriek in inklapbare blokken met "x van y open" (een rubriek zonder open sites is standaard dicht, behalve als er maar één rubriek is); een open site toont "x van y onderdelen ▸" en de vinkjes en de rekentoestelknop verschijnen pas na een klik. Een nieuwe site krijgt in sites.js altijd een rubriek (modules, rekenvaardigheden, basisgeletterdheid, heuristieken, wiskundige-problemen), anders komt ze onder Andere.

### Beheer

| Kaart | Wat je er doet |
| --- | --- |
| Leerlingenlijst opladen | Excel of CSV kiezen, voorbeeld bekijken, importeren. Opties: groepen opnieuw vullen volgens het bestand; leerlingen die niet in het bestand staan verwijderen |
| Leerkrachten met toegang | Naam en e-mailadres wijzigen (bij een nieuw adres verhuist de leerkracht mee in zijn groepen en zijn beheerrecht), schakelaar Beheer aan of uit (je eigen schakelaar staat vast), toegang intrekken, leerkracht toevoegen. Kolom Groepen toont zijn groepen |
| Niveaugroepen | Per groep leerkrachten toevoegen (+ leerkracht) of eraf halen (×), aantal leerlingen (klik op het aantal om de namen met klas open te klappen, ook bij groepen zonder leerkracht), groep verwijderen, groep toevoegen (naam en jaar/stroom) |
| Site openzetten voor alle groepen van een jaar | (23 oktober 2026, PR 25) Jaar en site kiezen, dan Aan of Uit voor alle groepen van dat jaar, na bevestiging. Toont hoeveel groepen de site al open hebben. Verborgen onderdelen en de rekentoestelknop blijven per groep bewaard; andere jaren veranderen niet. Test: node test/allesopen.js |
| Leerlingen zonder groep | Leerlingen uit de leerlingenlijst die in geen enkele groep zitten, met filter per jaar; per leerling meteen indelen in een groep van zijn jaar. Test: node test/groepsoverzicht.js (20 oktober 2026, op main: PR 9, merge 81d209e) |
| Leerling opzoeken en wijzigen | Zoeken op naam, klas of e-mail (kolom Groep toont in welke groep(en) de leerling zit, of geen); familienaam, voornaam, klas, jaar en e-mail wijzigen (bij een nieuw adres verhuist de leerling mee in zijn groepen); verwijderen; nieuwe leerling toevoegen |
| Opnieuw beginnen | Leerlingenlijst wissen en groepen leegmaken, eventueel ook alle groepen verwijderen en/of alle voortgang wissen. Bevestigen door WISSEN te typen. Leerkrachten en toegang blijven altijd bewaard |

### Fout melden en Fouten (20 oktober 2026, op main: PR 5, merge 0263396)

- **Fout melden** (tabblad voor elke leerkracht): module en onderdeel kiezen (keuzelijsten uit sites.js, of "Andere pagina"), "Welke kaart of vraag?" (vrij), "Wat is er fout?" en "Wat zou het moeten zijn?" (beide verplicht). Daaronder **Mijn meldingen** met status en reactie van de beheerder; intrekken kan zolang de status Nieuw is.
- **Snelkoppeling:** in elke module heeft een leerkracht in het gebruikerschip naast Dashboard ook **⚠ Fout melden** (driehoek met uitroepteken als lijnicoontje, .ic-fout in stijl.css, gekozen door de beheerder; ook op het tabblad in het dashboard); die opent dashboard/?melden=<site-id>&ond=<onderdeel-id> met module en onderdeel al ingevuld (onderdeel = laatst geopend tabblad, sleutel <prefix>tab).
- **Beheer, Fouten** (met teller van nieuwe meldingen): filter Nieuw en in behandeling (standaard), Alle, of per status; per melding datum, melder, plaats, de drie velden, knop Bekijk (opent de module bij het onderdeel), status kiezen (Nieuw, In behandeling, Opgelost, Niet aangepast), reactie voor de leerkracht, Bewaren, Verwijderen.
- Bewaard in Firestore, collectie fouten; geen e-mails (afspraak: geen meldingen vanuit het platform). Keuzes en vragen: /mnt/project-files/fout-melden/Vragen_fout_melden.md.

- **Uit groep en Verplaatsen naar** (28 oktober 2026, op main: PR 46, merge 6282700): werkten niet meer omdat updGroep de Firestore-waarde arrayRemove(...) in de lokale lijst zette. Hersteld; test test/uitgroep.js.

### Toeschouwer (20 oktober 2026, op main: PR 7, merge 243a10a)

Voor de directeur (toe te voegen door de beheerder in het dashboard; het adres staat niet in de code). Keuzes in /mnt/project-files/toeschouwer/Vragen_toeschouwer.md.

- **Toevoegen:** Beheer, kaart **Toeschouwers** (naam en @svsl.be-adres). Bewaard in de aparte collectie toeschouwers, dus niet bij de leerkrachten: collega's zien hem nergens (groepen, Vervanging collega, leerkrachtenlijst, voortgang, meldingen). Een adres dat al leerkracht is, kan geen toeschouwer worden.
- **Werking:** aanmelden.js bepaalt de rol (beheerder, leerkracht, toeschouwer, anders leerling). Bij een toeschouwer wisselen de live bindings F en db naar **gedeeld/zandbak.js**: een laag bovenop de echte database. Lezen gebeurt in de echte database (keuze van de beheerder: "de directeur ziet de echte leerlingen en collega's, hij kent de school"); elke wijziging komt enkel in localStorage van zijn browser (sleutel cl_zandbak_<e-mail>, per document de nieuwe versie of null voor verwijderd) en wordt daarna over de echte gegevens gelegd. In zijn laag is hij leerkracht én beheerder, dus hij ziet en test alles (Mijn groepen kiezen, Vervanging collega, Openzetten, Fout melden, Beheer met de echte meldingen, Excel opladen, Opnieuw beginnen, eigen voortgang in de modules). De kaart Toeschouwers ziet hij niet. Niets gaat naar de echte database; de Firestore-regels weigeren hem bovendien elke echte schrijfactie (functie toeschouwer() geeft enkel leesrecht).
- **Herkenbaar:** oranje balk bovenaan elke pagina "Toeschouwer · oefenomgeving" met de knop **Oefenomgeving opnieuw beginnen** (wist zijn laag; hij ziet weer de echte gegevens zoals ze zijn). In een module zegt de tip "Je bekijkt deze module als toeschouwer".
- Op een ander toestel of in een andere browser ziet hij de echte gegevens zonder zijn eerdere wijzigingen.
- Test: node test/toeschouwer.js.

### Bekijk als leerling (20 oktober 2026, op main: PR 7, merge 243a10a)

- In elke module heeft een leerkracht, beheerder of toeschouwer in de tip "Je bekijkt deze module als …" de keuzelijst **Bekijk als leerling van [groep]** (groepen van het jaar van de module, eigen groepen eerst, "module dicht" erbij als ze voor die groep niet openstaat).
- De keuze staat in sessionStorage cl_als_<site> (enkel dat tabblad). De module toont dan wat een leerling van die groep ziet: enkel de open onderdelen, de rekentoestelknop zoals ingesteld, Volledig scherm in plaats van Bord, en de melding "Deze module staat nog niet open" als ze dicht is. Oranje balk "Je bekijkt deze module als leerling van …" met **Terug naar de leerkrachtweergave**.
- Antwoorden in die weergave worden niet bewaard (geen voortgang naar Firestore; de lokale sleutels van de module worden bij in- en uitstappen gewist).
- Test: node test/alsleerling.js.

Een beheerder kan altijd wisselen tussen Mijn groepen en Beheer; de knop Dashboard in het gebruikerschip brengt een leerkracht vanuit elke pagina naar het dashboard.

## Excel-import

De beheerder laadt elk schooljaar één Excel-bestand (of CSV) op via Beheer, Leerlingenlijst opladen. Het voorbeeldbestand heet Voorbeeld_leerlingen_niveaugroepen.xlsx (72 fictieve leerlingen, 20 groepen, 8 leerkrachten; ook als test/voorbeeld.xlsx in de repository). Tabbladen worden herkend op het begin van hun naam, kolommen op hun kop, hoofdletters maken niet uit.

| Tabblad | Kolommen | Verplicht |
| --- | --- | --- |
| Leerlingen (of het eerste tabblad) | Jaar, Stroom, Klas, Familienaam, Voornaam, E-mail, Niveaugroep wiskunde | Ja; E-mail mag leeg (wordt dan familienaam.voornaam@svsl.be) |
| Leerkrachten | Familienaam, Voornaam, E-mail, Rol (leerkracht of beheerder), Niveaugroepen (komma ertussen) | Nee |
| Niveaugroepen | Jaar, Stroom, Niveaugroep, Soort (klas B-stroom, klasgroep, niveaugroep), Leerkracht(en) | Nee; groepen uit het tabblad Leerlingen worden anders automatisch aangemaakt |

Ook een tabblad Uitleg en Klassen mag erin staan; die worden genegeerd.

### Wat het opladen doet

- Leerlingen worden aangemaakt of bijgewerkt (met het huidige schooljaar).
- Leerkrachten worden aangemaakt; met Rol beheerder krijgen ze ook beheerrecht.
- Groepen worden aangemaakt of bijgewerkt. Leerkrachten uit het bestand worden toegevoegd, nooit weggehaald: koppelingen die in het dashboard gemaakt zijn, blijven bestaan.
- Optie "Groepen opnieuw vullen": de leerlingenlijst van elke groep wordt vervangen door die uit het bestand.
- Optie "Leerlingen die niet in dit bestand staan verwijderen": ruimt oude leerlingen op.
- Het openzetten van modules (aan) blijft altijd behouden.

### E-mail maken

familienaam + punt + voornaam + @svsl.be, in kleine letters, accenten weg, spaties, apostrofs en koppeltekens weg. Voorbeeld: Van den Berg, Noë wordt vandenberg.noe@svsl.be. Wijkt het echte adres af (bv. een koppelteken), dan vul je de kolom E-mail in of pas je het nadien aan in het dashboard. Ook bij Nieuwe leerling toevoegen kan je een eigen e-mailadres invullen (leeg: het gemaakte adres). Test: node test/koppelteken.js (op main: PR 22, merge fbab34f).

## Huisstijl en didactische afspraken

De volledige regels staan in de vaardigheden huisstijl-campus-lievegem en oefenwebsite-uit-werkboek; op het platform zitten ze al in gedeeld/stijl.css en gedeeld/kop.js. Dit is de samenvatting om op te letten bij elke nieuwe of overgezette module.

### Opmaak

| Onderwerp | Afspraak |
| --- | --- |
| Kleuren | Turkoois #3BC1C5 en oranje #FCAF17 op wit; donker turkoois #127A7F voor kleine turkooise tekst; tekst #173436. Geen bruin, geen muntgroen |
| Lettertype | Calibri, met Carlito als vervanger (Chromebooks) |
| Kaders | Kaarten, infovakken, tips, knoppen en invulvakken volledig turkoois; hover oranje met lichtoranje vulling |
| Tussenlijnen | Eén onzichtbare verticale lijn op de pagina: links turkoois, rechts oranje |
| Tabbladen | Actief tabblad volledig oranje omrand, witte vulling |
| Titels | Kernwoorden in de grote titel turkoois; nummering van hoofdstuktitels zwart |
| Kop en voettekst | Logo links (klapt mee in met de zijbalk), beeldmerk met fonkelende sterren rechts, logo in de voettekst |
| Zijbalk | Inklapbaar (keuze onthouden per site), knoppen "Verberg de onderdelen" en "Voorlezen" bovenaan; enkel een scheidingslijn tussen de oefeningen en de proeftoetsen |
| Voorlezen | Standaard uit; geselecteerde tekst wordt voorgelezen met een Nederlandstalige, bij voorkeur Belgische mannenstem; melding van 12 seconden bij aanzetten |
| Woordkeuze voor leerlingen | De turkooise kleur heet "blauw" |
| Juist en fout | Groen en rood, enkel na het verbeteren |
| Rechte hoek (loodrechte stand) | **Altijd** een kleine losse L met even lange benen, evenwijdig met de benen van de hoek. De hoek van de L ligt bij het hoekpunt, een beetje schuin naar binnen, zodat de L de benen van de hoek niet raakt. Nooit een gesloten vierkantje of een L die met de benen een vierkantje vormt (Belgische notatie, afspraak van de beheerder, 20 oktober 2026) |
| Vierkantswortel | Het wortelteken is één doorlopende lijn: de V raakt de schrijflijn en gaat zonder onderbreking over in de streep boven het getal. Bij de wortel uit een breuk loopt de V tot op de schrijflijn van de noemer (afspraak van de beheerder, 20 oktober 2026). In 2A module 2: mathHTML tekent `√16` en `√(9/16)` met een SVG-V (.wrt in 25_aq.css) |

### Inhoud van een module

- Indeling volgt de hoofdstukken van het werkboek; elk onderdeel in de zijbalk is één vaardigheid, daarna "Zoek de fout" en 3 proeftoetsen.
- Niveaus per kaart: basis (eerste kaart), oefenen (volgende kaarten), verdieping (gebaseerd op oefeningen met 3, 4 of 5 pepers in het differentiatietraject). Labels zonder symbolen, geen legende.
- Heeft een onderdeel verdieping, dan twee tabbladen: **Basis en oefenen** en **Verdieping**. Altijd het woord Verdieping, nooit Uitdaging of Uitbreiding.
- Weglaten: Scratch en programmeren, groepsopdrachten, open vragen die niet automatisch te verbeteren zijn, Maya-cijfers en hiërogliefen. Romeinse cijfers mogen bij verdieping.
- Altijd andere getallen dan in de cursus, alles zelf nagerekend (liefst door de code berekend). De oplossingen in magenta in de PDF worden niet gebruikt.
- Elke vraag heeft een uitgewerkte oplossing of uitleg; feedback "Juist!" of "Nog niet juist." met een concrete hint. Invoer is tolerant (komma of punt, verschillende maal- en deeltekens).
- Vlaamse notatie: ℕ₀, ℤ⁺ en ℤ⁻ bevatten 0, del 12, a ∣ b, ggd en kgv in kleine letters, decimale komma, duizendtallen met spatie.
- **Priemfactoren als herhaald product, zonder machten** (melding een collega, 28 oktober 2026, op main: PR 47): in oplossingen, voorbeelden en feedback van 1A noteren we 60 = 2 · 2 · 3 · 5, niet 2² · 3 · 5, omdat de leerlingen machten nog niet kennen (powerForm in 1A module 1). Een antwoord met machten wordt wel nog aanvaard.
- **"Kleinste natuurlijk getal"** (melding een collega, 28 oktober 2026): schrijf bij opgaven als "het kleinste getal van 4 verschillende cijfers" altijd *natuurlijk getal*, anders bestaat er geen kleinste (0,126 of negatieve getallen).
- Proeftoetsen: feedback pas na "Verbeter mijn proeftoets", dan score en niveau (prima vanaf 90 %, goed vanaf 70 %, voldoende vanaf 50 %), bij elke fout het juiste antwoord.
- **Geen apart onderdeel Signaaloefeningen** (afspraak 20 oktober 2026, ook voor alle volgende modules): instap- of signaaloefeningen worden als gewone kaarten in de passende onderdelen verwerkt.
- **Geen verwijzingen naar het werkboek** in kaarttitels of opdrachten (geen "zoals opdracht N op p. X").
- Leerlingen werken op een **Chromebook (liggend scherm)**: zet tabel en grafiek, of toestel en vragen, **naast elkaar** (figuur links, vragen rechts). Rekenbladoefeningen bootsen **Google Spreadsheets** na, niet Excel.
- **Hints** (afspraak 22 oktober 2026, voor alle modules): elke oefening in Basis en oefenen waarvoor de leerling **meer dan één stap** moet zetten, krijgt een knop **💡 Hint**. De hint toont de tussenstappen met **invulvakjes** (de leerling kan ze apart controleren) en waar nuttig een knop **🔍 Meer uitleg** (de hint in de hint). **Geen hints in Verdieping.** Hints tellen niet mee in het dashboard. In module 3: `hint:{stappen, ans, extra}` bij een vraag (12_hint.js), met kant-en-klare hints voor percentages, gemiddelde, mediaan en variatiebreedte. **Hints moeten heel duidelijk zijn** en krijgen **een figuur waar dat zinvol is** (de beheerder, 27 oktober 2026): bv. de hele hoek gekleurd, de klok met vakjes van 30°, de twee manieren getekend.
- **Vrij antwoordvak** (29 oktober 2026): oefeningen met meer dan één denkstap laten de leerling het antwoord zelf opbouwen met tussenstappen; niets voorkauwen (geen breuk, haakjes of stambreuk cadeau). Zie het deel Vrij antwoordvak met tussenstappen hieronder.
- **Getallen niet boven de staven** zetten als de leerling ze kan aflezen op de as.
- **Eén oefening op één scherm** (afspraak 22 oktober 2026, voor alle modules): schik een oefening waar mogelijk zo dat ze **in haar geheel zichtbaar** is op een computerscherm zonder te scrollen. Richtmaat: Chromebook 1366 × 768 met de browser open, ongeveer 650 pixels hoog. Zet daarvoor tabel en diagram naast elkaar, maak figuren kleiner of splits een lange kaart.
  - **Kern van de regel (de beheerder, 22 oktober 2026): een leerling moet nooit naar boven scrollen om de gegevens te vinden die bij de vraag horen die hij ziet.** Een vraag en de tabel, grafiek of figuur die je nodig hebt om ze op te lossen, staan dus samen in beeld. Een reeks vragen die elk op zichzelf staan (bv. een lijst losse keuzevragen of vier voorstellingen met elk hun eigen vraag eronder) mag wél langer zijn dan één scherm: naar beneden scrollen is dan geen probleem.
Werkwijze (goedgekeurd 22 oktober 2026, proefbeelden in 1A-module-3/screenshots/proef_A_tot_E/):
  - **A. Figuur links, vragen rechts**: tabel, diagram of toestel links; de vragen rechts, waar nodig in een compact 2×2-rooster.
  - **B. Vragen in twee kolommen**: veel korte vragen (keuzevragen, invulvakjes) in een rooster van twee kolommen.
  - **C. Eén item per keer**: lange reeksen (krantenkoppen, foute oplossingen, foutenjacht) tonen één item met Vorige en Volgende.
  - **D. Tabel horizontaal**: een lange frequentietabel wordt een tabel met twee rijen (waarde en frequentie), zodat de vragen ernaast passen. Een kaart splitsen in twee kaarten doen we liever niet.
  - **E. Meelopende figuur** (27 oktober 2026, module 2): als naast elkaar zetten niet volstaat omdat de vragen rechts samen hoger zijn dan het scherm (bv. elke vraag met zes redenknoppen), blijft de figuur links in beeld tijdens het scrollen (position: sticky; in module 2 de helper naast2(b, true) met CSS .naast2 en .mee). Op een gsm staat ze gewoon bovenaan.
  - Figuren kleiner maken om ze op één rij te krijgen (bv. vier grafieken naast elkaar) doen we niet: de figuren moeten groot en leesbaar blijven (de beheerder, 22 oktober 2026).
  - Spellen (zoals Zeeslag) en proeftoetsen vallen erbuiten. Op een gsm (smaller dan 760 px) staat alles weer onder elkaar.
  - Na een aanpassing alle kaarten opnieuw meten (test t/hoog.js) en schermafbeeldingen nakijken.
- In basis en oefenen heet het gewoon **frequentie**; de woorden absolute en relatieve frequentie horen bij verdieping.
- Nieuwe kaarten bij een bestaande module altijd achteraan een onderdeel toevoegen: de opslagsleutel is onderdeel-id plus kaartnummer, anders verschuiven bewaarde antwoorden.

### Vrij antwoordvak met tussenstappen (29 oktober 2026, standaard voor alle modules)

Afspraak van de beheerder, uitgewerkt in 2A Module 4 Machten (PR 48). Elke oefening waarin de leerling meer dan één denkstap moet zetten, gebruikt dit vak. Dezelfde tekst staat ook apart in Vrij_antwoordvak_standaard.md.

#### Waarom

- **Niets voorkauwen.** De leerling zet zelf elke denkstap: het teken, of er een breuk nodig is, welke exponent in de noemer komt, waar de haakjes staan. Vroegere oefeningen gaven de breuk, de haakjes of de stambreuk al cadeau; dat is te makkelijk (de beheerder, 29 oktober 2026).
- **Werken zoals op papier.** Een leerling mag zoveel tussenstappen schrijven als hij wil, elk op een nieuwe regel die begint met =.
- **Lichte, gerichte feedback.** Een juiste tussenstap is geen fout: dan zegt het platform *bijna juist, reken nog verder uit*. Een foute regel krijgt een klein rood kruisje; wie erop klikt, krijgt uitleg en waar mogelijk een knop die de stap verbetert.

Voorbeeld van de werkwijze die moet werken (negatieve exponent bij een breuk):

1. Schrijf met een positieve exponent, met haakjes rond de omgekeerde breuk: = (b/2a)³
2. Teller en noemer krijgen elk de exponent, met haakjes rond een negatief getal of een product: = b³ / (2a)³
3. Reken uit: = b³ / 8a³
4. Vereenvoudig indien nodig.

#### Wanneer gebruiken

| Gebruik het vrije antwoordvak | Houd de vaste vakjes |
|---|---|
| Oefenen en Verdieping met meer dan één denkstap | Basiskaarten (eerste kaart), die bewust stap voor stap begeleiden |
| Proeftoetsen (vragen met letters) | Zuiver numerieke uitkomsten ({{u:k}}): één getal of breuk |
| Elke vraag waarbij het antwoord een eentermvorm is (getal · letters met exponenten, eventueel als breuk) | Exponenten met letters (a^(n+2)): de motor rekent enkel met gehele exponenten |
| | Keuzevragen, sorteren, zoek de fout |

#### Wat de leerling ziet

**Schikking C (gekozen door de beheerder, 29 oktober 2026):**

- De opgave staat bovenaan, links. Daaronder de regels: elke regel begint met **=**.
- Het **mini-rekenmachientje** (een raster van drie kolommen) staat **naast de oefening**, niet helemaal rechts op het scherm, en blijft in beeld bij het scrollen. Op een smal scherm (< 640 px) staat het onder de regels.
- Onder de knoppen: een regeltje sneltoetsen (enkel de toetsen die bij deze oefening horen).

**Knoppen:**

- **Enkel een icoon, geen woorden.** Wie de muis 1 seconde boven een knop houdt, ziet het woord (tooltip). Schermlezers krijgen een volledige omschrijving (aria-label).
- Kleine knoppen, kleine vierkantjes in het breukicoon (overal hetzelfde breukicoon).
- Nooit een **+** om een factor toe te voegen: dat lijkt op een optelling. Een factor erbij is het **maalteken ·**.

| Knop | Icoon | Sneltoets | Wat het doet |
|---|---|---|---|
| maal | · | * of spatie, of typ 3a | nieuwe factor naast het actieve vakje |
| macht | xⁿ | ^ | exponentvakje bij het actieve vakje |
| haakjes | (□)ⁿ, de n hoog | ( en ) | haakjes rond het actieve vakje, de breuk of het product, met exponentvakje |
| breuk | breukicoon | / | maakt van de regel een breuk (teller en noemer onder elkaar), nog eens: weer gewoon |
| ongedaan maken | ↶ | | zet de laatste wijziging terug (Backspace in een leeg vakje haalt dat vakje weg) |
| regel weg | ✕ (enkel bij meer dan één regel) | | haalt de laatste regel weg |
| = | = (zonder woord; tooltip "volgende tussenstap") | | nieuwe lege regel |
| ? (rechtsboven op de kaart) | ? | | spiekbriefje: tabel met alle knoppen van deze kaart en wat ze doen |

- **Het oranje vakje** is het actieve vakje: daar werken de knoppen op.
- Pijltjes omhoog en omlaag gaan tussen teller en noemer.

#### Controle

Bij **Controleer antwoord** wordt eerst elke lege regel achteraan weggehaald (wie op = klikte maar niets meer moest schrijven, verliest niets). Daarna wordt **de laatst ingevulde regel** als antwoord beoordeeld, de vorige regels als tussenstappen.

| Uitslag | Wanneer |
|---|---|
| **Juist!** | elke regel heeft dezelfde waarde als de opgave en de laatste regel is volledig uitgewerkt |
| **Bijna juist, reken nog verder uit** | de laatste regel heeft de juiste waarde maar is nog niet uitgewerkt; de melding zegt wat er nog moet (zie hieronder) |
| **Nog niet juist** | een regel heeft een andere waarde; die regel krijgt een rood kruisje |

**Volledig uitgewerkt** betekent: geen negatieve exponent, geen haakjes meer, geen getal met een exponent (reken uit), geen exponent 0 of 1, geen kommagetal, één getal en dat vooraan, geen factor 1, geen minteken in de noemer, elke letter één keer, letters alfabetisch, geen noemer 1, geen letter in teller én noemer, breuk vereenvoudigd.

**Rood kruisje en uitleg.** Elke foute regel krijgt een klein ✕. Klik erop: een venstertje legt uit wat er misliep (bekende fouten per oefening, ontbrekende haakjes rond een negatief getal, teken, teller en noemer omgewisseld, getal fout, exponent fout). Waar de fout eenduidig te herstellen is (vandaag: ontbrekende haakjes), staat er een knop **Verbeter deze stap**; de verbeterde haakjes komen **in het rood** in de oefening.

**Haakjes rond een negatief getal met een exponent zijn altijd verplicht** (de beheerder, 29 oktober 2026): −2³ in plaats van (−2)³ krijgt een kruisje met uitleg en verbeterknop, ook als de uitkomst toevallig klopt omdat de exponent oneven is (VX.minHaak).

**Proeftoetsen.** Geen kruisjes of meldingen voor "Verbeter mijn proeftoets"; daarna verschijnen ze wel. *Bijna juist* telt in een toets als fout (niet volledig uitgewerkt).

#### Knoppen per oefening (voor volgende hoofdstukken)

Elke oefening krijgt **enkel de knoppen die ze nodig heeft**. Het spiekbriefje toont dan ook enkel die knoppen. In de opgave-html:

- `{{x:a}}` alle knoppen van de module (in module 4: `mehb` = maal, exponent, haakjes, breuk)
- `{{x:a,mh}}` enkel maal en haakjes, `{{x:a,me}}` maal en macht, enz.

Ongedaan maken en = zijn er altijd, regel weg vanaf twee regels.

Ideeën voor uitbreiding:

| Hoofdstuk | Nieuwe knop (letter) | Wat erbij moet |
|---|---|---|
| Vierkantswortels | w (√□) | een nieuwe knoop {k:'w', b:rij}, waarde (exact of benaderd), regels "volledig uitgewerkt" (wortel vereenvoudigd, geen wortel in de noemer) en eigen uitleg bij fouten |
| Merkwaardige producten, distributiviteit | + en − (termen) | een veeltermmotor (som van eentermen) in plaats van één eenterm; vergelijken na herleiden; "uitgewerkt" = herleid en geordend |
| Lettere exponenten (aⁿ⁺²) | geen nieuwe knop | exponenten als lineaire uitdrukking in n laten rekenen |
| Vergelijkingen | = als "volgende stap" blijft, maar elke regel is een vergelijking | controle op gelijke oplossingsverzameling |

Afspraak: een nieuwe knop krijgt een icoon (geen woord), een tooltip na 1 s, een aria-label, een sneltoets waar het kan en een rij in het spiekbriefje.

#### Technisch (voor Claude)

**Bestanden** (module 4, /mnt/project-files/2A-module-4/bron/, gebouwd met `bash build.sh` tot 2A/modules/module-4-machten/inhoud.js):

- `13_vrij.js`: alles van het vrije vak. VX (rekenen met eentermen {c:Q, v:{letter:exponent}}), lezen van regels, VX.waarom (waarom nog niet uitgewerkt), VX.uitleg (uitleg per foute regel), chkX, xm, foutM, emptyX, vrijVak (vak, knoppen, ongedaan maken, kruisjes, verbeterknop), VX_HULP en vxHulp (spiekbriefje), de CSS.
- `10_machten.js`: token `{{x:k,opties}}` in tokens(), mountW koppelt `vrijVak(sp, v, save, onCh, opties)`; mQ zet bij oefenen `X.check` zodat de kruisjes live meelopen en roept `X.trim()` aan voor de controle.
- `99_opbouw.js`: een kaart met een vrij vak krijgt de ?-knop (vxHulp).

**Datamodel van een antwoord:** `v = {r:[{b: rij | breuk}]}`; rij `{k:'row', f:[factor]}`; breuk `{k:'frac', t:rij, n:rij}`; factor `{k:'a', s, e}` (getal of letter) of `{k:'g', b:rij|breuk, e, rood?}` (haakjes). `e = null` betekent geen exponent. Een atoom "-3" met exponent betekent −(3ᵉ), zoals op papier.

**Een kaart bouwen:**

```js
mQ(g, st, save, 'w' + i, {
  nr,
  html: `${opgaveHTML} {{x:a}}`,               // of {{x:a,mh}} voor minder knoppen
  check: V => chkX(V.a, xm(Q(1, 8), {a:-3, b:3}),  // doel: 1/8 · a⁻³ · b³
                   foutM('a', [[3, 'Je vergat het minteken van de exponent.']])),
  hint: [...],                                  // zoals elders (enkel Basis en oefenen)
});
```

- `xm(getal, {letter:exponent})` maakt het doel; het getal mag een Q-breuk zijn.
- `chkX(v, doel, fout)` geeft `{ok:true}`, `{info, msg}` (bijna juist of uitleg) of `{ok:false, msg}`.
- `fout` is een lijst `[eenterm, melding]` van typische fouten; `foutM(letter, [[exponent, melding]], getal)` maakt die snel voor één letter.
- Opdrachtzin: "Schrijf elke tussenstap op een nieuwe regel met <b>=</b>."

**Nieuwe knop toevoegen:** letter kiezen, `mag(c)` in vrijVak gebruiken voor de knop en de sneltoets, een rij toevoegen in VX_HULP, en lezen/waarde/uitgewerkt-regels voor de nieuwe knoop in VX.

**Valkuilen:**

- Alle bronbestanden komen in één script: een `const` uit een later bestand bestaat nog niet bij het laden (TDZ). Gebruik zo'n waarde enkel binnen een functie.
- De balk moet vóór `.q-act` van de vraag staan; tests zoeken knoppen via `.q-act .btn`.

**Testen** (scripts in de scratchpad van de sessie, test/serve.sh op poort 8765):

- Elke vraag met {{x}} moet haar eigen canonieke antwoord aanvaarden (xall.js: het doel staat in `window.__VXDOEL` als `window.__M4TEST` bestaat). Laatste stand: 1440 vragen, 0 geweigerd.
- De vierstappenwerkwijze uit "Waarom" hierboven (vrij2.js), kruisje en verbeterknop (kruis.js), proeftoets zonder kruisjes vóór verbeteren (toetsx.js), lege regels weg (trim.js), ongedaan maken (undo.js).
- Daarna `node test/catalogus.js` en schermafbeeldingen nakijken.

#### Toepassing in Module 4 (29 oktober 2026)

- **Vrij vak** in de kaarten met letters: vermenigvuldigen (letters), delen (letters, gemengd), macht van een macht (positief), deling met een eenterm, product tot een macht (uitwerken, negatief), quotiënt tot een macht (letters, gemengd, negatief), en de proeftoetsvragen met letters.
- **Machtvak {{m}}** (grondtal + exponent) in vermenigvuldigen met breuken, rekenen en delen rekenen.
- **Ongewijzigd:** basiskaarten, numerieke uitkomsten en exponenten met letters.
- Schermafbeeldingen: /mnt/project-files/2A-module-4/schermen/ (vrij_antwoordvak_werkuit.png, kruisje_uitleg.png, verbeter_knop.png, knoppen_tooltip.png, knoppen_spiekbriefje.png, schikkingen_knoppen.png).

### Papieren werkbladen en taken: schoolhoofding

- De officiële hoofding staat in **projectkennis/hoofding/Taakvoorbeeld_2025_SV.docx** (de beheerder, 21 oktober 2026). Het is een tabel bovenaan de pagina:
  - links het logo van Campus Lievegem met "Middenschool SV, Lt. Dobbelaerestraat 16 - 9930 LIEVEGEM";
  - rechts Naam, Klas, Nr., Taak nr. en Datum;
  - daaronder Vak en Vakleerkracht, en Resultaat met "/10";
  - daarna een rij met de titel en een lege rij.
- Elk werkblad of elke taak voor op papier begint met deze hoofding. Gebruik dat bestand als sjabloon en schrijf de inhoud onder de tabel. Vul in:
  - Vak: wiskunde;
  - de titel;
  - het totaal bij Resultaat;
  - een korte instructie in de lege rij.
- Figuren in zwart-wit (voor de kopieermachine) en de rechte hoek als losse L. Achteraan staat een verbetersleutel voor de leerkracht, op een nieuwe pagina.
- Voorbeeld en bouwscripts: 2A-module-3/werkbladen/. bron/figs.py tekent de figuren als SVG, render.js zet ze om naar PNG en bouw.py zet het Word-bestand in elkaar op het sjabloon.

### 1A Module 3 · data en onzekerheid (17 oktober 2026, op main sinds 18 oktober)

- Site-id **m3**, prefix **m3_data_v1_**, map module-3-data, tegel achteraan in 1A/modules.
- De school gebruikt geen GeoGebra. Centrummaten met het rekentoestel: de module gebruikt het gedeelde rekentoestel **TI-30XB MultiView** (zie hieronder).
- Het lesuur Excel en het blanco Excel-bestand zijn vervangen door een **eigen rekenblad in de pagina** (onderdelen Rekenblad: formules en Rekenblad: grafieken): Nederlandse functienamen zoals Excel (SOM, GEMIDDELDE, MEDIAAN, MODUS, MAX, MIN, AANTAL, AANTAL.ALS ...), vulgreep, $-verwijzingen, grafiek invoegen met titel, astitels en begin van de as. Plus een proeftoets rekenblad zoals de KT.
- Hoofdstuk **Onderzoek** vervangt de papieren bundel van een collega en p. 17 nr. 11: onderzoekscyclus, goede vraag, steekproef, virtuele klas, geheugen- en reactietijdexperiment, kritisch lezen, en een **datalab** voor de eigen Google Formulier-gegevens (telt niet mee).
- Percentages in plaats van relatieve frequentie als breuk; coördinaten als P(3, −2), zonder co(...).
- Knop **↻ Nieuwe opgave** (generator): de oefening krijgt nieuwe getallen uit een zaadgetal (st.seed); zo kan een leerling onbeperkt oefenen. Eerst gebruikt bij coördinaten (welk punt, vierde punt van parallellogram, ruit, rechthoek, vierkant, verschuiven, spiegelen) en lijndiagrammen.
- Afleesvragen bij lijndiagrammen hebben een **hint-knop**: fijn rooster, meelopende stippellijnen naar beide assen en punten vastzetten.
- Het rekenblad **ziet eruit als Excel**: groene titelbalk, lint (Bestand, Start, Invoegen, Formules), fx-balk, statusbalk met Gemiddelde/Aantal/Som, opmaak (vet, opvulkleur, %), kolombreedte slepen, functievoorstellen tijdens het typen, ontbrekende haakjes worden aangevuld bij Enter, downloaden als .xlsx.
- Verbetervoorstellen die nog open staan: /mnt/project-files/1A-module-3/Verbetervoorstellen.md.
- Alle 14 verbetervoorstellen gebouwd (17 oktober). Coördinaten: geen lokpunten met omgewisselde x/y of fout teken; spiegelen tegenover een as en tekeningen zijn verdieping; flatgebouw en GO-bord vallen weg.
- Extra in module 3: knop **Toon mij hoe** (animatie met de getallen van de oefening: gemiddelde, mediaan, uit een frequentietabel, percentages), knop **⛶ Bord** op elke kaart (bordmodus met oplossing stap voor stap, verborgen onder 700 px), onderdeel **Snelle quiz** (10 vragen in 3 minuten, telt niet mee), en proeftoetsen 1-3 die per onderdeel uit een vragenpool trekken (bewaard in &lt;key&gt;_pick, knop Nieuwe toets).
- Bronbestanden staan in /mnt/project-files/1A-module-3/bron/; build.sh plakt 00, [1-8]*.js en 99 aan elkaar (volgorde = bestandsnaam; 89_sorteer.js zet de kaarten per onderdeel op basis, oefenen, verdieping).
- **Zeeslag** (20 oktober 2026, op main: PR 8, merge 856224a): eigen hoofdstuk vlak onder Coördinaten (id zeeslag, bron 24_zeeslag.js). Rooster −3 tot 3, schepen 5 (slagschip), 4 (kruiser) en 3 (torpedobootjager), mogen op een as liggen maar raken elkaar niet. Lay-out naar het papieren werkblad uit de klas: perkament, kompasroos, open bolletjes op de roosterpunten, vlootlijst. Didactisch: schieten = zelf (x, y) intikken (de zee van de ander is niet aanklikbaar); een binnenkomend schot moet je zelf aanklikken in je eigen zee, na twee foute kliks volgt een tip vanuit de oorsprong. Twee kaarten: tegen de computer (zoekt buren na een treffer) en tegen een klasgenoot online met een code van 4 tekens (Firestore zeeslag/{code}, schepen apart in geheim/{e-mail}; de verdediger beoordeelt het schot door het aan te klikken, zo ziet niemand de schepen van de ander). Firestore weigert een lijst in een lijst: elk schip wordt bewaard als { c:[{x,y}, ...] } (hersteld 21 oktober 2026, PR 12); de nep-Firestore in test/fake weigert geneste lijsten nu ook. Telt niet mee. De oude solo-zeeslag bij Coördinaten is weg; zijn kaartplaats blijft als lege plaatshouder (skip) zodat bewaarde antwoorden kloppen.
- **Herwerking 20 oktober 2026** (op main: PR 8, merge 856224a): soorten data met voorbeeldtabellen; percentages met hulp en tussenstappen (dubbele getallenlijn); Eén dataset, vijf voorstellingen toont twee voorstellingen naast elkaar; misleidende grafieken met het teken voor een onderbroken as (basis) en "wanneer mag de as niet bij 0 starten" (verdieping); uitlegkaarten stap voor stap (46_maten_uitleg.js) voor modus, variatiebreedte, gemiddelde uit een frequentietabel (hulpkolom) en mediaan in een dotplot en uit een frequentietabel (rangnummers), met begeleide oefeningen; uitschieter met tabel begin/nu en besluit; rekentoestel: toestel links en vragen rechts, foutenjacht, wat geeft het toestel niet, terugrekenen en groot getal zijn verdieping; rekenblad als Google Spreadsheets (Invoegen > Diagram, diagrameditor); ondervraag de klas met meisjes- en jongensnamen; signaaloefeningen verdeeld over de onderdelen (er is geen apart onderdeel Signaaloefeningen meer).
- **Hints en diagrammen, 22 oktober 2026 (op main: PR 19, merge 1f12d08):** invulbare hints bij 43 basisvragen (frequentietabel, diagrammen, misleidende grafieken, gemiddelde, mediaan, interpreteren, verschuiven, kritisch lezen). Bouw de dotplot is verdieping (meer gegevens, een waarde met frequentie 0, de leerling vult zelf de as in). Het cirkeldiagram (middelpuntshoek) is verdieping. Cirkel- en strookdiagram verdelen: basis met totaal 10, 20, 25 of 50, verdieping met 12, 15, 16, 24, 30 of 40; per deel aan de buitenkant het aantal stukjes en het gegeven (boogje of haakje); klik op een procent toont de breuk aantal/totaal = …/100 = … %. Welke voorstelling past? aanvaardt elke redelijke keuze, de uitleg zegt welke het best past. Krantenkop: 125/127/130 g (4 %). Nieuwe kaart: een as met ongelijke stappen. Geen getallen meer boven de staven bij misleidende grafieken.
- **Eén oefening op één scherm, 22 oktober 2026 (op main: PR 20, merge 601df57):** frequentietabel naast het cirkel- en strookdiagram (5 kaarten). 17 kaarten herschikt zodat gegevens en vragen samen in beeld staan: vragen in twee kolommen, lange frequentietabel liggend (rekentoestel), vragen onder het assenstelsel naar rechts. De instellingen per kaart staan in de bron in 87_schikking.js (onderdeel|titel → q2, htab, onderRechts, naarRechts). Bewust niet aangepast: Zeeslag, Hoe heet deze voorstelling?, Krantenkoppen, Foute oplossingen, Foutenjacht, Numeriek of categorisch? (elke vraag staat bij haar eigen gegevens). Een verborgen hint met een brede tabel blokkeert het naast-elkaar zetten van figuur en vragen niet meer.
- **Module 1: hints en venndiagram, 27 oktober 2026 (op main: PR 41, merge 387b603):** de hintmotor van module 3 staat ook in module 1 (hintBox in qBlock, met tussentitels HK('Manier 1'), uitleg HU(...) en sets = vakjes zonder vaste volgorde). Hints bij Ontbind (deelladder met invulvakjes, ladderHint), Zoek x (per vraag het kenmerk van deelbaarheid in stappen), ggd en kgv reeks A-C (ggdHint: delers van het kleinste getal; kgvHint: veelvouden van het grootste) en de Getallenraadsels (RH: telkens twee manieren met invulvakjes, een derde in Meer uitleg). De beheerder: hints moeten heel duidelijk zijn en bij raadsels verschillende manieren tonen. Venn Opgave A en B: gegevens en diagram links, vragen rechts (vennNaast). Evaluatie module 1 op scrollen: enkel de venndiagrammen moesten aangepast worden, de andere hoge kaarten zijn lijsten losse vragen.
- **Module 2: hints met figuren en één oefening op één scherm, 27 oktober 2026 (op main: PR 43, merge f368db4):** de hintmotor van module 1 staat ook in module 2 (antwoorden in graden via parseDeg; HF(...) zet figuren met onderschrift in een hint; een open hint in een smal figuurkaartje .fig-card krijgt de volle rijbreedte). Hints bij Hoeken op de klok (klokHint: vakjes van 30°, om half een half vakje), Teken een inspringende hoek (inspHint: twee manieren met voorbeeld 235°), Rechte en gestrekte hoeken, Volle hoeken en gelijke delen, Overstaande hoeken en nevenhoeken en Alles door elkaar (calcHint: calcFig geeft per figuursoort H mee; de hele hoek oranje gekleurd, overstaand oranje en nevenhoeken blauw, bissectrice, gelijke stukken tellen) en de vragen met twee stappen bij Vul aan (csHint). Geen hints bij kaarten met een bewerkingsvak of waar de tussenstappen al in de vraag staan. Evaluatie module 2 op scrollen: 67 hoge kaarten, bijna allemaal vragen met elk een eigen tekenblad of figuur; enkel Snijpunten en concurrente rechten (elke figuur links, vragen rechts) en Bereken alle hoeken en geef de reden (meelopende figuur, werkwijze E) aangepast. Vul in met ∈ … en Hoe noem je deze hoeken? bewust niet: de figuur blijft in beeld. Voorstel en schermafbeeldingen: /mnt/project-files/1A-module-2/.
- **Vaste kaartsleutels (module 3, 22 oktober 2026):** de sleutel van een kaart (bewaarde antwoorden én vraag-id's in het dashboard) was onderdeel_volgnummer na het sorteren op niveau, zodat een kaart naar een ander niveau verplaatsen de andere sleutels liet verschuiven. Nu ligt elke bestaande sleutel vast in 88_sleutels.js (onderdeel|titel|volgnummer → sleutel); nieuwe kaarten krijgen een eigen `key`, een kaart zonder sleutel krijgt onderdeel_n&lt;nr&gt;. **Een bestaande kaart niet hernoemen** zonder de sleutel mee te nemen. Doe hetzelfde in andere modules voor je er kaarten van niveau verandert.
- **Klassessie** (20 oktober 2026, 72_klassessie.js): bovenaan Experimenten ziet een leerkracht de knoppen om een klassessie te starten (geheugen- of reactietijdexperiment). Het bord toont een code; leerlingen doen mee met die code; de leerkracht start de ronde voor iedereen tegelijk (aftellen 3-2-1); het bord toont live de klastabel (voornaam + initiaal), de dotplot en de maten. Ronde afsluiten, nieuwe ronde, stoppen (wist de sessie). Firestore klassessie/{code} en klassessie/{code}/deelnemers/{e-mail}.
- Hoofdstukken in de zijbalk: coördinaten · zeeslag · data voorstellen · centrummaten · ICT · onderzoek · zoek de fout · proeftoetsen 1-3 en rekenblad.

### Gedeeld rekentoestel TI-30XB MultiView (18 oktober 2026)

- De leerlingen hebben de **TI-30XB MultiView**. Eén nagebootst toestel voor het hele platform: **gedeeld/ti30xb.js** (geen TI-logo, wel de tekst TI-30XB MultiView).
- Gebruik in een pagina: `<script src=".../gedeeld/ti30xb.js">` en `TI30XB.create(parent, {size:'11px', store:'sleutel'})`. Geeft `{el, btn, press(code), reset(), setLists(ls), screenText()}`. Met `store` onthoudt het toestel geheugen, lijsten, instellingen en geschiedenis in localStorage.
- **Per module aan of uit** (18 oktober): in het dashboard, Openzetten, staat bij elke open module het vinkje 'Knop met het rekentoestel tonen', bewaard als groepen/<id>.aan.<site>.rt. Leerlingen krijgen de knop alleen als een van hun groepen hem aanzette; leerkrachten zien hem altijd. aanmelden.js zet de knop (rekentoestelKnop), niet meer kop.js. Geen wijziging aan firestore.rules nodig.
- **Knop rechtsonder** op een oefenpagina: een mini-toestel in turkoois (ontwerp B, gekozen 18 oktober), zelfde verhoudingen als het toestel; klikken opent het grote toestel in een zwevend venster dat je versleept aan de turkooise balk of de rand (de pagina blijft bruikbaar; positie bewaard in localStorage ti30xb_pos). kop.js zet de knop en laadt ti30xb.js als dat nodig is. In code: TI30XB.icon(), TI30XB.open(), TI30XB.fab().
- Eigen pagina **rekentoestel/** (groot toestel, toetsenbord werkt), tegel Hulpmiddelen op de startpagina, zonder data-site dus altijd zichtbaar.
- Kan: MathPrint en Classic, breuken en gemengde getallen, √ en π exact, ◂▸, geschiedenis met plakken, Ans, geheugen x y z t a b c, sto/recall/clear var, prb (nPr, nCr, !, rand, randint), hoeken en DMS, log/ln, 10^ en e^, hyp, data-editor met formules, 1-Var en 2-Var stats met x′ en y′, table, K-constante, mode-scherm, foutmeldingen, reset.
- Bron: /mnt/project-files/rekentoestel/bron/src (1_getal tot 6_toestel); build.sh schrijft gedeeld/ti30xb.js; engtest.js test 63 voorbeelden uit de handleiding.
- Nagekeken op het echte toestel (18 oktober): een breuk als uitkomst eerst als kommagetal, ◂▸ wisselt naar de breuk; stat-resultaten na 9 heten A:Q3, B:maxX; foutscherm = melding met Error eronder; delete achteraan wist het laatste teken; typen overschrijft, 2nd delete voegt in; negatief minteken en * lager in het midden.
- Nog na te kijken: een breuk die je zelf met n/d intikt, blijft een breuk (3 n/d 4 ▶ + 1 n/d 6 enter); √ en π blijven exact (2nd x² 8 enter).

### 2A Module 1 · transformaties (18 oktober 2026, op main sinds 18 oktober: PR 1, merge f8cb09b)

- Site-id **2a-m1**, prefix **2a_m1_transfo_v1_**, map 2A/modules/module-1-transformaties. Verdere wijzigingen: nieuwe branch vanaf main.
- Onderdelen: herkennen · spiegelen om een as · translatie · rotatie · spiegelen om een punt · notatie · **roosters** · coördinaten · eigenschappen · symmetrie in het vlak · in de ruimte · foutenjager · proeftoetsen 1-3.
- Notatie: rechten en assen een kleine letter, punten een hoofdletter; vector altijd met pijl (nooit een getallenpaar); spiegelas en spiegelpunt in subscript; volgorde transformatienotatie = beeldnotatie, bv. s<sub>x</sub>(A) = A′(3, −2). Rooster van −6 tot 6.
- Rotaties, stappenplannen en de moeilijkste werkboekoefeningen staan in Verdieping. Eén transformatie per oefening. Theorie in het spiekbriefje rechtsboven.
- Animaties na het controleren en met afspeelknoppen, traag, en de uitlegtekst blijft staan. Puntspiegeling: eerst elk punt afzonderlijk, dan de hele figuur.
- Hints in **2 delen** zoals op de oude site: deel 1 toont hoe je vertrekt, deel 2 waar het beeld ligt.
- **Roosters**: gebaseerd op KT vraag 5, met **gelijkaardige oefeningen, nooit identiek** (andere afmetingen en letters); opbouw: eerst beelden aanklikken op het rooster, dan de notatie aanvullen, dan as/centrum/vector/hoek zoeken.
- Coördinaten: de opgave geeft de coördinaten van het punt en van de punten van de vector; bij de opgaven zonder tekening opent een hint een leeg assenstelsel waarin de leerling zelf punten en een vector zet.
- Eigenschappen: per eigenschap een animatiekaart; een tabel met tekeningen: bovenaan de 4 transformaties naast elkaar, links alle 8 eigenschappen als zin ("Vorm blijft gelijk", "… blijft behouden"); de leerling sleept ze op hun plaats (nieuwe opgave: andere volgorde); kaarten waar de leerling de eigenschap benoemt bij een tekening. De samenvattende tabel staat in het spiekbriefje.
- Leesbaarheid: tekst in figuren (getallen, hoeken, cm, cm²) is vet, donker en groter; figuren bij eigenschappen zijn ingezoomd op de tekening.
- Vectoren en punten liggen altijd volledig in het rooster (vecFrom kiest een beginpunt; toob.js in de bronmap meldt punten buiten het rooster).
- Puntspiegeling: na de hoekpunten krimpt de hele figuur langs de lijnen naar het centrum en groeit ze er aan de andere kant uit.
- Naar main: eerst de laatste main binnenhalen; gedeeld/stijl.css (actief invulvak oranje) en de rekentoestel-knop van de thread "Module 3 data voor 1A" moeten allebei behouden blijven.
- Onderdeel Assenstelsel (eigen kort onderdeel tussen Roosters en Coördinaten, gekozen door de beheerder): de kaart "Beeldpunten in een assenstelsel", vroeger bij Notatie.
- Notatie: laatste opbouwkaart "Noteer alles zelf": een notatievak met knoppen voor "lager" (… met een lager vierkantje, dus de index), vector, °, −, ′ en Δ; daarna notaties in woorden, nagekeken op kernwoorden (beeld, naam transformatie, as/punt/centrum, vector, hoekgrootte, draaizin).
- Ruimtefiguren: getekend in loodrechte projectie (licht gedraaid, van iets boven), zichtbare vlakken met lichte schaduw, cilinder en bol met echte ellipsen.
- Proeftoetsen: De beheerder vindt de huidige niet representatief; voorstel naar KT (/20) en HT1 staat in 2A-module-1/Voorstel_proeftoetsen.md (wacht op keuze).
- Proeftoetsen: De beheerder koos A en D uit zes voorstellen en wilde ze samen in één grotere toets, met een nieuwe figuur bij de oppervlaktevraag (de tegel was dezelfde als op de HT) en drie gelijkaardige toetsen met andere foto's, figuren en roosters. Nu: proeftoets 1-3 op /40 (14 vragen: deel 1 transformaties en notatie, deel 2 symmetrie en eigenschappen), gebouwd in c2_toets2.js (bigToets(i)). Per toets andere foto's, woorden, vlakke figuren, eigenschappen, ruimtefiguren, waar-of-niet-waar en oppervlaktevraag (windmolen = rotatie, parallellogram = puntspiegeling, parallellogram naar rechthoek = translatie). De zes oorspronkelijke voorstellen staan in bron/c2_toets2_voorstellen.js. Een vraag kan vaste punten krijgen (q.pts); de deelvragen worden herschaald.
- Foto's: enkel foto's die de beheerder koos (18 stuks in img/foto, naam begint met s_, t_, r_ of p_). Twee foto's per proeftoets; de getekende figuurtjes enkel in basis en oefenen.
- Proeftoetsen: eigen vragen op het niveau van de HT en de KT, met andere woorden, getallen, roosters en vraagvormen. **Nooit letterlijk overnemen.** Alle vraagvormen mogen.
- Sleep- en tekenoefeningen tellen mee voor de voortgang.
- Bronbestanden staan in /mnt/project-files/2A-module-1/bron/; build.sh plakt ze aan elkaar tot inhoud.js (REPO= pad naar de repository).
- Meldingen de collega-bouwer (28 oktober 2026, op main: PR 47): in Eigenschappen, kaart Tabel, schoven de geplaatste kaartjes van de eerste kolom over de meelopende woordenbank (.chip heeft z-index 6 in stijl.css, de bank had 5). Meelopende banken (.tb-pool en wordBank) hebben nu z-index 7. In Spiegelen om een punt, kaart Punten op een rooster, staan de punten 2 eenheden uit elkaar op lijnen zoals bij Alle transformaties door elkaar (mixFig), zodat de letters niet meer overlappen.

### 2A Module 2 · algebraïsche uitdrukkingen (18 oktober 2026, op main sinds 20 oktober: PR 3, merge 60dcbcb)

- Site-id **2a-m2**, prefix **2a_m2_algebra_v1_**, map 2A/modules/module-2-algebraische-uitdrukkingen. Staat op main na akkoord van de beheerder. Verdere wijzigingen: nieuwe branch vanaf main.
- De onderdelen volgen het handboek (14 onderdelen), daarna zoek de fout, snelle quiz en proeftoets 1-3 (/20, gemengd). "Na de toets" is op vraag van de beheerder weggelaten (20 oktober): leerlingen krijgen hun KT op papier terug. Er zijn minstens 6 kaarten per onderdeel, met de html-oefeningen als basis.
- **Dalende machten zijn verplicht**: een juiste uitkomst in een andere volgorde telt niet als juist. + is oranje, − turkoois (geen paars).
- De basketoefening is verdieping. Omtrek en oppervlakte als veelterm zijn basis. Het spiekbriefje van de omtrek bevat de vlakke figuren met hun formules voor omtrek en oppervlakte.
- Feedback 20 oktober: de knopjes voor exponent en breuk zijn groter, met oranje vakjes. Het stickervraagstuk staat bij Veeltermen en graad. Bij Gelijksoortige eentermen is de oude verdieping basis geworden, met een nieuwe verdieping (ng5). Bij Herleiden staat er een verdieping met machten en vierkantswortels die je eerst uitrekent (nh3). mathHTML toont √getal met een streep erboven. De rechte hoek wordt getekend met rhoekL in 20_motor.js.
- Extra's: ↻ nieuwe opgave (generatoren), toon mij hoe (stappen), ⛶ bordmodus (bewaart niets) en een snelle quiz (10 vragen in 3 minuten).
- De bronbestanden staan in /mnt/project-files/2A-module-2/bron/. build.sh maakt inhoud.js en module.css. De motor van de oude pagina's staat in 20_motor.js en is met de hand aangepast, dus draai hulp/transform.js niet opnieuw. Sleutels worden berekend met ALG en MAAK (31_alg.js), niet getypt. Alle keuzes staan in 2A-module-2/Keuzes.md.

### 2A Module 3 · hoeken, evenwijdigen en een snijlijn (20 oktober 2026, op main sinds 21 oktober 2026: PR 11)

- Site-id **2a-m3**, prefix **2a_m3_hoeken_v1_**, map 2A/modules/module-3-hoeken-evenwijdigen. Bron: Nando 2, hoofdstuk 3. Verdere wijzigingen: nieuwe branch vanaf main.
- Keuzes: de aanbevolen opties van 2A-module-3/vragen_vooraf.html (De beheerder vulde ze niet in): motor van 2A Module 1 (00_motor.js), per onderdeel een tab Verdieping, 3 proeftoetsen op 20, minstens 6 kaarten per onderdeel, enkel SVG-figuren. De instap is verweven in de oefeningen; geen apart onderdeel signaaloefeningen. De D-nummers tonen welke oefeningen er zeker in moeten, ze zijn geen leidraad.
- Onderdelen: complement en supplement, overstaande hoeken (link met puntspiegeling), aanliggende en nevenhoeken, de vijf hoeken (definities leren), namen bij evenwijdigen en een snijlijn (verkenner met kantelbare a, b en s), eigenschappen (verdieping: bewijs met translatie), omgekeerde eigenschappen (b draaien tot a // b), contexten, som van de hoeken van een driehoek, driehoeken en vierhoeken (verdieping veelhoek), foutenjager, snelle quiz, proeftoets 1-3.
- Het **bewijs van de som van de hoeken van een driehoek** (evenwijdige p door C, twee keer verwisselende binnenhoeken, gestrekte hoek) komt vaak terug: animatie, afdekken, ordenen, redenen slepen, invullen, volledig schrijven, uit het hoofd en op papier met een teller (doel 5 keer). Elke proeftoets bevat het bewijs (4 punten). Nummering: Ĉ1 naast A, Ĉ2 de driehoekshoek, Ĉ3 naast B.
- Nummering bij twee rechten en een snijlijn: hoek 1 ligt tussen de rechte (naar rechts) en de snijlijn (naar boven), daarna 2, 3, 4 in tegenwijzerzin; A is het bovenste snijpunt.
- Bron in /mnt/project-files/2A-module-3/bron/ (00_motor tot 99_opbouw); build.sh plakt alles tot inhoud.js. De bewijsschrijver (proofWriter in 10_hulp.js) aanvaardt dakjes en indices in elke schrijfwijze en controleert redenen op sleutelwoorden.
- Catalogus: 15 onderdelen, 221 controleerbare vragen. Geen wijziging aan firestore.rules.
- Feedback van de beheerder (21 oktober 2026):
  - Rekenen tot op 1 graad is basis. Minuten en seconden zijn verdieping.
  - Complementaire en supplementaire hoeken hoeven niet tegen elkaar te liggen. De uitleg-demo heeft daarvoor de knop "Leg los van elkaar".
  - "Het complement van het supplement" heeft één antwoordvak. De invulbare hints beginnen achteraan (stap 1) en gebruiken die uitkomst in stap 2.
  - Vergelijkingen met x: de leerling typt zelf de vergelijking (linParse controleert of ze gelijkwaardig is), dan x en de hoek. Elke hint is een stap met een eigen invulvak (stepHints in 20_compl.js).
  - In de basis is één hoek in graden gegeven. x in beide hoeken is verdieping.
  - De knop bij overstaande hoeken heet "Puntspiegeling om M = rotatie over 180°".
  - Stap-voor-stap-animaties (stepAnim) spelen niet vanzelf af: er zijn stapnummers en knoppen vorige/volgende.
  - Verkenner eigenschappen: knoppen "a // b vastzetten" en "a en b apart bewegen". Draaien aan a draait b evenwijdig mee.
  - De oefening "Hoeken in een ster" is weggelaten.
  - Na elke wijziging toon ik een voorbeeld-artifact in de thread.
  - **Afspraak van de vakgroep (21 oktober 2026, gecorrigeerd):** in de basis rekenen leerlingen met hoeken tot op **de minuut** nauwkeurig, bijvoorbeeld 23°47′ (eerst was 30′ afgesproken, dat is vervangen). Niet alle opgaven zo: de meeste blijven in hele graden. Seconden zijn verdieping. De controle aanvaardt geen antwoord dat 1′ afwijkt (tolerantie 0,005°).
  - Bij zo'n opgave is er een invulbare hint met aanvulstappen (aanvulSteps in 20_compl.js): eerst de minuten tot de volgende graad, dan tot 90° of 180°, dan samentellen.
  - Pro-tip als laatste hintstap bij "complement van het supplement" en omgekeerd: complement van supplement = hoek − 90°, supplement van complement = hoek + 90°, complement van complement en supplement van supplement = de hoek zelf. Dezelfde tip staat onder de kaart.
  - Op main: PR 13 (30′, merge ee16541) en PR 14 (minuten en pro-tip, merge c884146), allebei 21 oktober 2026.
  - Niet evenwijdig schrijven we met het teken **∦** (a ∦ b), niet "a en b snijden elkaar": op de website (PR 15, merge c77a398, 21 oktober 2026) en op de werkbladen. In keuzelijsten blijft de waarde 'niet //', alleen het label is ∦.
  - Onderdelen 5 tot 8 (PR 18, merge 2ce19e4, 22 oktober 2026):
    - De gekleurde binnenstrook is donkerder. Klik je in de voorstelling op een hoek, dan knippert de bijhorende hoek van het gekozen paar zacht mee.
    - Eigenschappen, hoeken met een letter: in de basis is één hoek een veelterm en de andere een getal ('Bereken x met de eigenschappen'), met invulbare tussenstappen zoals bij overstaande hoeken. x in beide hoeken is verdieping (nieuwe kaart achteraan). Hoeken uit som of verschil gebruiken veelvouden van 5.
    - Contexten: de ladder is vervangen door de fietsoversteek (straat met twee stoepranden), ook in de proeftoets. Nieuw: 'Wordt de straat breder of smaller?', de vakwerkbrug en 'Hangt de boekenplank recht?'. De proeftoets heeft een straatvraag (breder, smaller of even breed).
    - **Afspraak:** bij vragen "evenwijdig of niet" wordt de figuur altijd evenwijdig getekend; enkel de getallen wijken 1 of 2 graden af, zodat leerlingen moeten rekenen in plaats van kijken. Bij de vraag staat "De figuur is niet op schaal: reken!".
- Papieren werkbladen op de schoolhoofding (21 oktober 2026), in 2A-module-3/werkbladen/:
  - Werkblad_eigenschappen_evenwijdigen is een **leerwerkblad zonder punten** (de vraag van de beheerder: leerlingen moeten de eigenschappen leren door het werkblad te maken, het mag geen toets zijn). In de hoofding staat "Zelf verbeterd met de sleutel ☐" in plaats van een score. Opbouw: deel 1 de acht hoeken, binnen/buiten en dezelfde kant/verwisselend; deel 2 per hoekenpaar een figuur met grijze en gearceerde hoeken, waar ze liggen, aflezen op een figuur met alle hoekgroottes (65° en 115°) en de eigenschap aanvullen; deel 3 oefenen (paren benoemen, alle hoeken met reden met een voorbeeldrij, x stap voor stap); deel 4 omgekeerde eigenschappen (eigenschap tegenover omgekeerde, figuur ja/nee, aanvullen op ruime stippellijnen) en een aparte oefenpagina "Zijn a en b evenwijdig?" met zes figuren (a tot f) en stappen; daarna "Controleer jezelf". Op vraag van de beheerder: geen deel 5 samenvatting. **Regel voor invulplaatsen op werkbladen:** 1,5 keer de lengte van het antwoord in drukletters (bl() in bouw.py), niet meer; volle lijnen waren te veel.
  - Werkblad_bewijs_som_hoeken_driehoek is ook een **leerwerkblad zonder punten**: twee keer hetzelfde bewijs invullen (Δ ABC, hulplijn p // AB) en de stappen ordenen, met "Controleer jezelf" achteraan. Op vraag van de beheerder: geen toepassingsoefening, geen tabel met kolommen uitspraak en reden, en invulplaatsen van 1,5 keer de lengte van het antwoord in drukletters (tekst 12 pt).

### 2A Modules 1 tot 3 · één oefening op één scherm en invulbare hints (29 oktober 2026)

Evaluatie van de drie modules volgens de afspraken Eén oefening op één scherm (werkwijze A en E) en Hints. De voorstellen per module, met schermafbeeldingen voor en na, staan in de projectbestanden onder 2A-modules-evaluatie/module-1, module-2 en module-3 (voorstel_een_scherm_en_hints.md); de schermafbeeldingen na de aanpassing staan in 2A-modules-evaluatie/na/. Prefixen en opslagsleutels zijn niet veranderd.

- **Schikking in module 1 en 3:** een kleine helper schik(body, card) in inhoud.js, aangeroepen na card.build. Vlaggen op een kaart:
  - naast: n zet de eerste n kinderen links en de rest rechts (CSS .naast, werkwijze A).
  - mee: true laat de linkerkolom meelopen (CSS .mee, sticky; werkwijze E).
  - meeIn: 'selector' (module 1) maakt een bestaand element meelopend, bv. de figuur links in .cf-two.
  - plak: n (module 3) laat de eerste n kinderen bovenaan meelopen, met kaartachtergrond en schaduw, voor kaarten waar naast elkaar te smal wordt (Hoe noem je deze hoeken?).
  - Een MutationObserver zet kinderen die de kaart later toevoegt in de rechterkolom. Smaller dan 760 px staat alles onder elkaar en loopt niets mee.
- **Module 1:** naast elkaar of meelopend bij o.a. Waar ligt het beeld?, Spiegelen en rond de klok, Punten op een rooster, Notatie en assen, Vul de zinnen aan. Tabel en Benoem hadden al een meelopende woordenbank. Invulbare hints met figuur (hintBox, overgenomen uit 1A module 2) bij spiegelen in de assen (welke coördinaat blijft, welke wisselt van teken), verschuiven (dx en dy), draaien en puntspiegelen op de klok, punten op een rooster, notatie met assen en Alle transformaties door elkaar. Enkel bij basis en oefenen (lvl < 3).
- **Module 2:** de lijnstukkaarten in Toepassingen staan naast elkaar (isSide ook bij q.seg), en de figuur loopt mee op een breed scherm. Nieuwe invulbare hint met figuur bij de bonnetjes (HINTSTAP in inhoud.js, hintStappen; de oude uitleg wordt Meer uitleg) en een hint bij de omtrek van de ruit (no1).
- **Module 3:** zes kaarten herschikt (Hoe noem je deze hoeken? met plak, Twee evenwijdigen en twee snijlijnen, Vul het bewijs aan, Schrijf het volledige bewijs, Uit het hoofd, Bewijs met een translatie). stepHints met figuur bij Ook losse hoeken kunnen complementair zijn, Noteer de grootte van de andere hoeken, Bepaal de grootte van alle hoeken, Zijn a en b evenwijdig?, De fietsoversteek, De overweg, Bereken de derde hoek, Rekenen met een buitenhoek, Gelijkbenige en gelijkzijdige driehoeken en Bereken de vierde hoek.

### 2A Module 4 · machten (proefstuk gebouwd op 28 oktober 2026, branch claude/project-thread-pj1nlv, nog niet op main)

- Bron: Nando 2, module 04 Machten. Site-id **2a-m4**, prefix **2a_m4_machten_v1_**, map 2A/modules/module-4-machten (gekozen door de beheerder, 28 oktober 2026).
- Analyse, voorstel en keuzes: /mnt/project-files/2A-module-4/ (Analyse_en_voorstel.md, Keuzes.md, vragen_vooraf.html en vragen_ronde2.html). Toetsen als inspiratie: KT NG1, twee korte KT's NG3 en de HT (enkel vraag 1 tot 4; de rest hoort bij module 6).
- Kern: tekenvak (+ boven, − onder) en invoer zoals rekenvaardigheid 6; breuken altijd onder elkaar; "reken uit" = vereenvoudigde breuk; letters alfabetisch; eerst een proefstuk (onderdeel 2 en 5).
- Niveaus (de beheerder, 28 oktober 2026): basis op het niveau van de KT's van NG3, oefenen op het niveau van NG2 en de HT, Verdieping voor NG1 ("NG1 is de niveaugroep die ook verdiepingsoefeningen moet kunnen"). Drie proeftoetsen op HT-niveau (NG2), op /30.

- **Proefstuk (28 oktober 2026)**: twee onderdelen, `neg` (Negatieve exponent en exponent 0, 10 kaarten, 53 vragen) en `verm` (Machten vermenigvuldigen, 11 kaarten, 52 vragen). De overige onderdelen volgen na de feedback van de beheerder; nieuwe kaarten altijd achteraan zetten (sleutels = onderdeel_index).
- Bron in /mnt/project-files/2A-module-4/bron/: 00_motor.js (motor van 2A M3 zonder meetkunde), 05_hulp.js (esc, orderEx), 10_machten.js (exacte breuken Q, notatie mH/bH/qH, invoer en controle, stijl), 20_neg.js, 50_verm.js, 98_volgorde.js, 99_opbouw.js (kopie van M3); build.sh maakt 2A/modules/module-4-machten/inhoud.js.
- Invoer (10_machten.js): tokens in de opgave-html: {{u:k}} uitkomst = slim vak (met ,t ook een tekenvak ervoor, enkel bij oefeningen waar het teken iets is om over na te denken, zoals negatieve grondtallen; de beheerder 28 oktober; zonder tekenvak mag een minteken vooraan getypt worden) met ernaast één knopje **breuk** (De beheerder 28 oktober: leerlingen typen niet graag een schuine streep; de knop wordt 'geen breuk' om terug te gaan; / of : typen en pijltje omlaag werken ook; Backspace in een lege noemer maakt het weer één vak), {{m:k}} machtvak (sinds feedback de beheerder 28 oktober: geen knopjes meer; grondtalvak + klein oranje exponentvak; de leerling typt haakjes zelf zoals op papier, bv. (-2), met een duidelijke melding als ze ontbreken; ,i = typ je 1/ vooraan, dan komt de macht onder een breukstreep met 1 erboven, Backspace in een leeg grondtal haalt die weg; breuk als grondtal vraagt enkel de exponent), {{e:k}} exponent, {{b:k}} grondtal, {{g:k}} gewoon vak. Controle: chkU (enkel vereenvoudigde breuk, kommagetal = info), chkM (behoud het grondtal, haakjes verplicht bij negatief of breuk, pos = positieve exponent), chkE (ook lineaire exponenten met één letter: m-5, 2k+3), allOf. Vraagblok mQ met 💡 Hint (stappen met invulregels, 🔍 Meer uitleg), stapUitleg (Toon mij hoe) en stepFig (svg-animatie stap voor stap).
- Module 4 machten (28 oktober, avond): alle 13 onderdelen en 3 proeftoetsen gebouwd in bron/ (15_herh, 20_neg, 25_brk, 30_teken, 50_verm, 55_del, 60_mm, 65_prod, 70_quot, 75_door, 80_wet, 85_fout, 88_quiz, 90_toets; bouwstenen in 12_extra: chkUD, chkW, wH, wQ, qKomma, multiKeuze, sorteer, minnenWeg, scherm). Breukicoontje ook in het machtvak ({{m:k,i}}). errBlock kent fixMQ (verbeterstap met de m4-vakken). Volgorde in 98_volgorde.js.

- **Vrij antwoordvak met tussenstappen** (29 oktober 2026, standaard voor alle volgende modules): zie het deel **Vrij antwoordvak met tussenstappen** onder Huisstijl en didactische afspraken (ook apart in Vrij_antwoordvak_standaard.md) (werking, controle juist/bijna juist/fout, rode kruisjes met uitleg en verbeterknop, rekenmachientje naast de oefening, knoppen per oefening met {{x:a,mh}}, technische uitleg en tests).
- **Vraagstukken** (29 oktober 2026, kleine set gekozen door de beheerder): vijf kaarten achteraan een onderdeel, in 87_vraag.js (voegt ze toe met SEC.x.cards.push): bacteriën in een schaaltje met schuifknop (verm), medicijn halveert elke 4, 6 of 8 uur (neg), oppervlakte en volume met letters (prod, vrij antwoordvak), eenheden omzetten km² naar m² (mm), maquette op schaal (quot, vrij antwoordvak). Vraag met vrij vak en lange vraagzin: mQv zet de vraag erboven, zodat het rekenmachientje naast de korte antwoordregels blijft. Nog niet gekozen: vouwen, kettingbericht, stamboom, rijstkorrels, opslag, ruimte, vergelijken, Sierpiński, knock-outtoernooi, pincodes, microscoop.
- Animaties: machtentrap (÷ grondtal per trede), groeiende schimmel met schuifknop in de tijd, tegels die samenschuiven.
- Controle: alle opgaven en hint-invulregels worden met brute kracht opgelost en de gevonden antwoorden met sympy nagerekend (456 van 456 juist, 3 willekeurige reeksen). Testscripts in de scratchpad van de sessie, niet in de repository.

### 2A Wiskundige problemen (23 oktober 2026, de collega-bouwer, op main sinds 23 oktober: PR 21, samengevoegd na main-merge door Claude)

- Overgezet van de Apps Script-oefensite "Vlaamse toetsen" (Google Sheet met beheerpagina). De naam **Vlaamse toetsen** is overal vervangen door **wiskundige problemen**. De Sheet, de beheerpagina en Code.gs vallen weg: aanmelden, voortgang en openzetten gaan via het platform.
- Site-id **2a-wp**, prefix **2a_wp_v1_**, map **2A/wiskundige-problemen/** (rechtstreeks in de rubriek, zonder modulemap), tegel in 2A/index.html. Branch tom/wiskundige-problemen.
- Keuzes van de collega-bouwer (vragen in een aanvinkbare pagina, 23 oktober 2026):
  - Enkel de **A-stroom** (6 domeinen). De B-stroom komt later apart in 2B; de vragen voor B (niveauB in de databank) zitten er nog in.
  - Proeftoetsen zoals in de modules: **Proeftoets 1-3**, 20 vragen uit alle open domeinen door elkaar, geen tips of uitleg tot het indienen, opnieuw maken mag, de laatste poging telt (CLtoets, sleutel toetsN_1). Geen ronde, toegangscode, tijdslimiet of "opnieuw toelaten".
  - Venster verlaten wordt **niet** bijgehouden (afspraak van het platform).
  - Klas, niveaugroep en stroom komen uit de leerlingenlijst; geen keuzescherm bij het eerste bezoek.
  - Titel "Oefen *wiskundige problemen*", eyebrow "Wiskunde · wiskundige problemen 2de jaar". Domein 1 heet **Problemen oplossen** (vroeger "Wiskundige problemen oplossen").
  - Niveau **A tot E** blijft, met "Dit niveau is een schatting op basis van deze reeks."
  - Het dashboard toont het niveau per onderdeel (zie hieronder). Bestaande resultaten uit de Sheet gaan niet mee.
  - Bord, één oefening op één scherm en de notatie (rechte hoek, wortelteken) toegepast; **geen invulbare hints** (later, per domein).
- Werking: adaptief oefenen per domein (de volgende vraag wordt moeilijker of makkelijker, theta per domein), 432 vragen voor de A-stroom (102 problemen oplossen, 78 getallenleer, 57 algebra, 74 meetkunde, 64 statistiek, 57 verzamelingenleer), waarvan veel sjablonen met nieuwe getallen. Per reeks kiest de leerling Oefenen met uitleg of Oefentoets, en 10 of 20 vragen. Vraagtypes: meerkeuze, meer antwoorden, invullen (getal, breuk, gemengd getal, macht), klikken op een rooster, slepen naar vakken, rangschikken. Hulpmiddelen: markeerstift, eigen rekenmachine (enkel bij vragen die ze toelaten) en woordenboek.
- Onderdelen (sites.js): pro, get, alg, mee, sta, ver, mix (gemengde toets), toets1-3. **Mijn fouten** (hoogstens 10 vragen die de leerling de vorige keer fout had) staat in de zijbalk maar is geen onderdeel om open te zetten. Verborgen domeinen vallen ook weg uit de gemengde toets, de proeftoetsen en Mijn fouten. De nummering in de zijbalk telt enkel de zichtbare onderdelen, zoals in de modules.
- Opslag (localStorage met de prefix, gespiegeld naar Firestore): `staat` (theta en reeksen per domein, per vraag gezien/juist, laatste proeftoetsen), `_res` (vraag-id = domein_vraag, bv. get_g35, 1 of 0 bij de laatste keer; niet bij proeftoetsen), `_toets`, `niv` en `tab`.
- **Niveau in het dashboard** (gedeelde wijziging in dashboard.js en dashboard.css): `niv` = {onderdeel: {n, j, t, d}} met het niveau na de laatste reeks van minstens 5 vragen (en na elke proeftoets). Het dashboard toont dat als een bolletje met de letter in Voortgang en in het detail per leerling, voor elke site die `niv` bijhoudt.
- Bord: de vraag staat in één kaart (.card.wpkaart). bord.js geeft de leerkracht **⛶ Bord** (de oplossingsmethode zin per zin als stappen) en de leerling **⛶ Volledig scherm**; niet in de proeftoetsen. Op het bord blijft de vraag werken (antwoorden, volgende vraag); de motor zoekt daarom altijd in `wortel()` (de kaart op het bord, anders #app).
- Eén oefening op één scherm: markeerstift, rekenmachine en woordenboek staan in de balk boven de vraag, de opgave met figuur links en het antwoord rechts; in de vraagmodus is de kop compact en het infovak verborgen. Gemeten op 1366 × 650: 431 van de 432 vragen passen, één sleepvraag (vk6) steekt 1 px uit.
- Notatie: rechte hoeken als losse L in de figuren lvorm en hoek (klasse .frh); √getal in de tekst wordt één doorlopend wortelteken (.wrt, zoals in 2A Module 2).
- Gedeelde wijziging in aanmelden.js: de melding "Er staat hier nog niets open" verschijnt niet als er op de pagina een tegel zonder data-site (bv. Modules) zichtbaar blijft.
- Bron in /mnt/project-files/2A-wiskundige-problemen/bron/: 11_data1.js, 12_data2.js, 13_data3.js (vragendatabank uit Data1-3 van Apps Script, zonder het ongebruikte LOGO) en 20_app.js (motor uit App.html, aangepast aan het platform). build.sh plakt ze in één functie tot 2A/wiskundige-problemen/inhoud.js (REPO= pad naar de repository). module.css staat rechtstreeks in de repository (opmaak uit Stijl.html; klassen die botsten met stijl.css heten .rm, .wfig en .wmeld).
- Test: node test/wiskundigeproblemen.js (20 keer OK op 23 oktober 2026). Catalogus: 10 onderdelen, 432 vragen. Geen wijziging aan firestore.rules.
- **Herwerking volgens de leeswijzer (24 oktober 2026, de collega-bouwer, op main: PR 29, merge ee67650):** opbouw volgens de Leeswijzer bij de vaardigheidsniveaus tweede jaar: breedtethema Problemen oplossen plus de tien dieptethema's van de A-stroom. Nieuwe onderdeel-id's wpo, get, alg, vvg, mor, mei, ooi, tra, sta, tad, vzm en toets1 tot toets5 (prefix 2a_wp_v1_ en site-id ongewijzigd). Gevolg: resultaten onder de oude id's (pro_, mee_, ver_, mix_) tellen niet meer per onderdeel en verborgen onderdelen (uit) per groep moeten opnieuw ingesteld worden. 470 doelen met code (bv. A-OOI-C3) in 2A/wiskundige-problemen/doelen.json, 751 vragen. Letter per thema (A hoogste, D laagste, E = D nog niet beheerst), enkel zichtbaar voor leerkrachten; leerlingen zien wat ze al kunnen en waaraan ze nog werken. Doel behaald bij 2 van de laatste 3 pogingen juist (bewaard in data.doelen). Proeftoetsen in drie delen van 15 vragen met een letter per deel. Dashboard: letter per thema, letters per deel bij een proeftoets, en doelen per letter in de detailweergave. Geen wijziging aan firestore.rules. Gekend punt (de collega-bouwer lost het op in zijn bron): stopt een leerling een reeks vroeg (bv. na 5 juiste antwoorden), dan geeft letterVan E in plaats van nog geen letter, omdat er per niveau minder dan 3 antwoorden zijn. Opgelost in PR 35 (25 oktober 2026, merge f8423e6): E enkel als D met minstens 3 antwoorden meestal fout is, anders geen letter (dashboard: gestippeld ?).

### 2B Wiskundige problemen (24 oktober 2026, de collega-bouwer, op main sinds 25 oktober 2026: PR 35, merge f8423e6, goedgekeurd door de beheerder)

- Site-id **2b-wp**, prefix **2b_wp_v1_**, map **2B/wiskundige-problemen/**, body data-stroom="B", tegel op 2B/index.html. Zelfde motor als 2A Wiskundige problemen.
- Breedtethema en de zes dieptethema's van de B-stroom (Problemen oplossen, Getallenleer, Objecten en relaties, Omtrek en oppervlakte, Statistiek, Tabellen en diagrammen, Verhoudingen; id's in sites.js), 143 B-doelen in doelen.json, 219 sjablonen, 3 proeftoetsen in drie delen van 15 vragen.
- Eenvoudige rekenmachine bij "meestal met ICT", geen bij "zonder ICT"; formulekader (.formkader) naast de vraag bij omtrek, oppervlakte en inhoud.
- test/catalogus.js geeft de stroom mee; test: node test/wiskundigeproblemen2b.js. Geen wijziging aan firestore.rules.
- Na het samenvoegen: de site openzetten voor groep 2B in het dashboard.
node test/allesopen.js   # Beheer: site openzetten voor alle groepen van een jaar

### 1A Wiskundige problemen · heuristieken (26 oktober 2026, de collega-bouwer, op main sinds 27 oktober 2026: PR 38, merge 5ed1dba)

- Site-id **1a-wp**, prefix **1a_wp_heur_v1_**, map **1A/wiskundige-problemen/** (index.html, inhoud.js, module.css), tegel op 1A/index.html, rubriek wiskundige-problemen.
- Op basis van de module Problem Solving: de vier stappen en zes heuristieken (schets, vereenvoudigen, uitproberen, patroon, achterwaarts werken, systematisch tellen), elk met een uitgewerkt voorbeeld, adaptief oefenen, verdieping en een testje van 3 vragen. Daarna door elkaar (eerst een heuristiek kiezen) en een testje van 5 vragen. 93 sjablonen met nieuwe getallen per sessie.
- Dashboard: de score van een testje binnen een gewoon onderdeel wordt getoond. Test: node test/heuristieken1a.js. Firestore-regels: geen wijziging.

### 2B Modules 1 tot 4 (26 oktober 2026, de collega-bouwer, op main sinds 26 oktober 2026: PR 39, merge 89a4f28; kleuren PR 40, merge d71e6ee)

- Sites **2b-m1** Rekenen (2b_m1_rekenen_v1_), **2b-m2** Meten (2b_m2_meten_v1_), **2b-m3** Coördinaten (2b_m3_coord_v1_) en **2b-m4** Figuren (2b_m4_figuren_v1_), in 2B/modules/ met een gedeelde module2b.css en een overzichtspagina 2B/modules/index.html.
- Op basis van de taken en toetsen van Max wiskunde 2B. Elke oefening krijgt nieuwe getallen met Nieuwe opgave; hints met invulvakjes, Toon mij hoe, een eenvoudige rekenmachine, puzzels (tellen niet mee), een snelle quiz en een proeftoets per module.
- Afspraken: x-as groen, y-as rood; rechte hoek als losse L. **Bouwsels in vaste kleuren** (ook in 2A en 2B Wiskundige problemen, PR 40): voorkant geel, bovenkant rood, rechterzijkant blauw, achter- en linkerkant grijs; elke kant houdt zijn kleur bij het draaien en boven de figuur staat van waar je kijkt, met een knop terug naar voren. Bouwplaat van de kegel: het grondvlak raakt de boog.
- Test: node test/modules2b.js.

## Stappenplannen

### Een nieuwe module uit een werkboek

De beheerder levert de PDF van het werkboekhoofdstuk en zegt voor welk jaar (1A, 2A, 1B of 2B) en welk modulenummer.

1. PDF lezen volgens de vaardigheid oefenwebsite-uit-werkboek: hoofdstukken, pepers in het differentiatietraject, wat weg te laten.
2. Onderdelen plannen en de oefeningen schrijven met eigen getallen; alles narekenen.
3. De motor van module 1 of 2 als basis nemen (inhoud.js), met de drie haken CLres, CLvraag en CLtoets en het weglaten via window.CL_VERBORGEN.
4. Map maken: <jaar>/modules/module-<n>-<kernwoord>/ met index.html (data-site, data-prefix, data-inhoud, paden ../../../gedeeld/) en inhoud.js.
5. Nieuwe, unieke site-id en prefix kiezen (bv. m3 en m3_<kernwoord>_v1_).
6. Tegel toevoegen in <jaar>/modules/index.html. Bestaat de map modules voor dat jaar nog niet: index.html van modules maken en in <jaar>/index.html de tegel Modules zetten.
7. Catalogus bijwerken: de module met onderdelen:[] toevoegen aan gedeeld/sites.js en node test/catalogus.js draaien (aantal vragen per onderdeel).
8. node test/rooktest.js draaien, de nieuwe module als leerling openen met de nep-Firebase (zie Testen) en schermafbeeldingen bekijken op 1280 px, ingeklapt en 400 px.
9. Committen en pushen naar main; na een minuut staat ze online.
10. De beheerder (of de leerkracht) zet de module open in het dashboard bij Openzetten; zonder dat ziet geen enkele leerling ze.

### Een bestaande losse site overzetten

Voor de oudere één-bestand-sites (bv. transformaties, algebra) die al in de huisstijl staan.

1. De beheerder laadt het HTML-bestand op en zegt voor welk jaar en welke rubriek.
2. Kop, voettekst, zijbalkknoppen, voorlezen, logo's in base64 en de CSS eruit halen: die komen uit gedeeld/.
3. Het script wordt inhoud.js. De oude PREFIX van de site blijft dezelfde als leerlingen ze al gebruikten (anders wordt hun lokale werk niet meegenomen); anders een nieuwe prefix.
4. De drie haken toevoegen op de plaatsen waar de motor controleert en waar een proeftoets een score geeft; het weglaten van onderdelen via CL_VERBORGEN inbouwen.
5. Vergelijken met het origineel: de pagina moet er pixel voor pixel hetzelfde uitzien (zo gebeurde het bij module 1 en 2).
6. Verder vanaf stap 4 van de nieuwe module.

### Een nieuwe leerkracht

Beheer, Leerkrachten met toegang: naam en e-mailadres invullen, Toevoegen. Daarna bij Niveaugroepen de groepen toewijzen, of de leerkracht kiest ze zelf via Mijn groepen kiezen. Beheerrecht met de schakelaar Beheer.

Krijgt een leerkracht via een weblink in Smartschool "Je hebt geen toegang tot dit onderdeel" (en komt ze terug op svsl.smartschool.be/?module=Homepage), dan is dat een melding van Smartschool, niet van het platform. Oorzaak op 23 oktober 2026 (de collega-bouwer): een co-leerkracht was aan het Smartschool-account gekoppeld. Rechtstreeks in Chrome werkte het wel.

### Een nieuw schooljaar

De automatische overgang is nog niet gebouwd (zie Planning). Tot dan, met de hand:

1. Voortgang bewaren die je wil houden (export of archief: nog te bouwen).
2. SCHOOLJAAR in gedeeld/firebase-config.js aanpassen en pushen.
3. Beheer, Opnieuw beginnen: leerlingenlijst wissen en groepen leegmaken, vinkje voortgang wissen aan.
4. De nieuwe Excel opladen met "Groepen opnieuw vullen" aan.
5. Leerkrachten aan groepen koppelen en modules openzetten.

## Testen en controleren

Elke wijziging wordt eerst lokaal getest met een nep-Firebase in de map test/ van de repository, zodat er niets in de echte database komt. Pas daarna wordt er gepusht.

```bash
test/serve.sh            # lokale server op http://localhost:8765
node test/rooktest.js    # import, groepen, openzetten, leerling, voortgang
node test/catalogus.js   # gedeeld/sites.js opnieuw maken
node test/fouten.js      # Fout melden en Fouten
node test/toeschouwer.js # toeschouwer in de oefenomgeving
node test/alsleerling.js # Bekijk als leerling
```

| Bestand | Rol |
| --- | --- |
| test/fake/ | Nep-versies van firebase-app, -auth en -firestore; de database zit in localStorage onder __fakedb |
| test/helpers.js | Browser met de nep-Firebase, pagina met een startdatabase, aanmelden als een gekozen gebruiker |
| test/rooktest.js | Beheerder importeert de voorbeeldlijst, koppelt een leerkracht, zet module 1 open zonder het eerste onderdeel; leerling ziet enkel de open onderdelen, zijn antwoord wordt bewaard, een leerling zonder groep krijgt de melding |
| test/fouten.js | Leerkracht meldt een fout via de snelkoppeling in module 1, beheerder ziet ze bij Fouten, zet status en reactie, leerkracht ziet de reactie |
| test/toeschouwer.js | Beheerder voegt een toeschouwer toe; die ziet de echte gegevens (dashboard, Beheer, Fout melden, module), zijn wijzigingen blijven in cl_zandbak_…, de echte database verandert niet, opnieuw beginnen werkt, een collega ziet hem niet |
| test/alsleerling.js | Leerkracht bekijkt module 1 als leerling van een groep: enkel open onderdelen, niets bewaard, terug naar leerkrachtweergave, dichte module geeft de melding |
| test/catalogus.js | Opent elke module zonder aanmelden (met vaste toevalsgetallen, zodat de telling niet wisselt), telt de controleerbare vragen per onderdeel en schrijft sites.js |
| test/voorbeeld.xlsx | Fictieve leerlingenlijst (72 leerlingen, 20 groepen, 8 leerkrachten) |

Nodig: Node, Python 3, Playwright met Chromium en het npm-pakket xlsx (de cdnjs-versie is in de testomgeving vaak niet bereikbaar; anders XLSX_PAD zetten naar xlsx.full.min.js).

Alles in één keer: `test/alles.sh` (alle tests in test/, plus de controle dat gedeeld/sites.js bijgewerkt is). Een nieuwe test test/<naam>.js die eindigt met process.exit(ok ? 0 : 1) komt er vanzelf bij.

### Automatische tests en goedkeuring op GitHub (24 oktober 2026, PR 30)

Doel: De collega-bouwer kan zelf samenvoegen in zijn eigen deel, alles wordt eerst getest, en wijzigt de collega-bouwer iets buiten zijn deel, dan heeft hij goedkeuring van de beheerder nodig. **De beheerder is eigenaar van alles, de collega-bouwer van zijn delen** (24 oktober 2026, PR 37, merge 9a2eef2): een pull request van de beheerder heeft nooit goedkeuring van de collega-bouwer nodig, ook niet in delen van de collega-bouwer. CODEOWNERS vraagt de beheerder ook bij delen van de collega-bouwer.

| Onderdeel | Werking |
| --- | --- |
| Controle **tests** (.github/workflows/tests.yml) | Bij elke pull request en elke push op main: Playwright 1.63.0 en xlsx installeren, dan test/alles.sh. Duurt ongeveer 2,5 minuten. Faalt ook als sites.js niet bijgewerkt is of als catalogus.js JavaScript-fouten of een site zonder onderdelen ziet. |
| Controle **goedkeuring** (.github/goedkeuring.js, workflows goedkeuring.yml en goedkeuring-opnieuw.yml) | Elk gewijzigd bestand heeft een eigenaar. Wijzig je enkel eigen bestanden: in orde. Anders moet de andere eigenaar goedkeuren (Approve) op de laatste commit; na een nieuwe commit opnieuw. Draait via pull_request_target, dus altijd met de versie van main (een pull request kan de controle niet zelf aanpassen); na een goedkeuring draait ze vanzelf opnieuw. |
| Eigenaar collega-bouwer (zie CODEOWNERS) | <jaar>/basisgeletterdheid/, <jaar>/heuristieken/, <jaar>/wiskundige-problemen/, 2B/modules/, 2B/index.html (sinds PR 36, 24 oktober 2026), test/wiskundigeproblemen.js, test/wiskundigeproblemen2b.js |
| Eigenaar beheerder (zie CODEOWNERS) | (Sinds 27 oktober 2026 blokkeert enkel nog firestore.rules en .github/, zie hieronder.) Al de rest: modules 1A en 2A, gedeeld/, dashboard/, firestore.rules, test/ (behalve test van de collega-bouwer), .github/, jaarpagina's en startpagina |
| gedeeld/sites.js | Per site: het element van een site hoort bij de eigenaar van haar pad. Nieuwe sites toevoegen of laten bijwerken door catalogus.js kan dus zonder de ander; de volgorde van bestaande sites wijzigen is van de beheerder. |
| .github/CODEOWNERS | Vraagt automatisch de juiste persoon om na te kijken; hou het gelijk met de lijst in goedkeuring.js. |
| Ruleset "main beschermen" (Settings, Rules, Rulesets; in te stellen door de beheerder als beheerder) | Default branch; Restrict deletions en Block force pushes; Require a pull request (0 approvals, geen Code Owners-review); Require status checks: tests en goedkeuring; geen bypass, ook niet voor de beheerder (in nood de ruleset tijdelijk uitschakelen). |

Ruleset "main beschermen" actief sinds 24 oktober 2026 (ruleset-id 25774481; nagekeken via api.github.com/repos/campus-lievegem-wiskunde/eerste-graad/rules/branches/main: verwijderen en force push geblokkeerd, pull request met 0 goedkeuringen, verplichte controles tests en goedkeuring van GitHub Actions). PR 30 (merge 2b2699a) en PR 31 (README, merge 388b723) staan op main; PR 31 was de eerste echte proef van de controle goedkeuring.

**Versoepeld op 27 oktober 2026 (PR 42, keuze van de beheerder):** een bestand van de beheerder vraagt enkel nog zijn goedkeuring als het bewaakt is (lijst BEWAAKT in .github/goedkeuring.js: firestore.rules en .github/). Al de rest (modules, gedeeld/, dashboard/, test/, jaarpagina's, sites.js) mag de collega-bouwer samenvoegen zodra de tests slagen. CODEOWNERS vraagt de beheerder nog om na te kijken, maar dat blokkeert niets.

Keuzes van de beheerder (24 oktober 2026, alles aanbevolen): 2B/modules hoort bij de collega-bouwer; sites.js per site; test van de collega-bouwer bij de collega-bouwer; een goedkeuring vervalt na een nieuwe commit; geen bypass. De collega-bouwer heeft rol Write (niet Admin, anders kan hij de ruleset wijzigen). Gevolg voor Claude: nooit rechtstreeks op main pushen, altijd een pull request; samenvoegen kan pas als beide controles groen zijn.

Resultaat op 17 oktober 2026: de rooktest geeft 7 keer OK; de catalogus telt 23 onderdelen en 343 vragen voor module 1, 22 onderdelen en 154 vragen voor module 2.

### Na het pushen

- GitHub Pages heeft ongeveer een minuut nodig; daarna vernieuwen met Ctrl+F5.
- Bij een nieuwe of overgezette module: schermafbeeldingen bekijken op 1280 px, ingeklapt en 400 px breed, en vergelijken met het origineel.
- Live controleren met een echt leerlingaccount: de leerling ziet enkel wat openstaat, de voortgang verschijnt in het dashboard, een collega ziet enkel zijn eigen groepen.

## Privacy, bewaartermijn en andere afspraken

Er wordt zo weinig mogelijk bewaard: naam, schoolmail, klas en groep van de leerling, zijn antwoorden en zijn actieve werktijd per onderdeel. Privacy is goedgekeurd binnen deze afspraken.

| Afspraak | Inhoud |
| --- | --- |
| Waar | Firebase in de regio europe-west1 (België) |
| Bewaartermijn | Eén schooljaar; daarna archief naar de schooldrive, beheerd door het secretariaat |
| Wie ziet wat | Leerling: enkel zijn eigen werk. Leerkracht: leerlingen en voortgang (in de praktijk van zijn groepen; de regels laten alle leerkrachten lezen). Beheerder: alles. Toeschouwer (directeur): leest alles wat een beheerder leest, schrijft niets |
| Niet bijgehouden | Tabblad verlaten, klikgedrag buiten de oefeningen, tijd zonder activiteit |
| Ouders | Geen berichten aan ouders |
| Meldingen | Geen meldingen of e-mails vanuit het platform |
| Aanmelden | Enkel @svsl.be via Google; geen aparte wachtwoorden |
| Eigenaar | GitHub-organisatie en Firebase-project op het persoonlijke schoolaccount van de beheerder; de beheerder en de collega-bouwer (elk met Claude, via pull requests met automatische tests en goedkeuring over en weer) wijzigen de code |

### Werkafspraken met Claude

- Alles in het Nederlands; woordkeuze "modules", niet "oefenwebsites".
- Eerst testen met de nep-Firebase (test/alles.sh), dan via een pull request naar main (sinds PR 30 kan rechtstreeks pushen niet meer; de controles tests en goedkeuring moeten groen zijn); commits op naam van Claude met de vermelding van de sessie.
- Na een wijziging aan firestore.rules altijd melden dat de regels opnieuw gepubliceerd moeten worden.
- Vragen stellen als iets onduidelijk is, vooral bij keuzes die moeilijk terug te draaien zijn (prefixen, site-id's, wissen).
- Grote keuzes vastleggen in dit document.

## Stand van zaken en planning

Het platform werkt volledig met drie modules in 1A en drie in 2A; 2A Wiskundige problemen staat op main (PR 21, herwerkt in PR 29).

### Klaar

| Fase | Wat |
| --- | --- |
| 1 | Gedeelde huisstijl (stijl.css, kop.js, logo's); module 1 en 2 pixel voor pixel gelijk aan de originele sites |
| 2 | Aanmelden met schoolaccount, rollen, voortgang en werktijd naar Firestore; live getest |
| 3 | Dashboard: groepen kiezen, voortgangstabel en detail per leerling, leerlingen verplaatsen, openzetten per module en onderdeel, Excel-import, leerkrachten en groepen beheren, leerling en leerkracht wijzigen, opnieuw beginnen |
| 3 (aanvullingen) | Mappenstructuur 1A, 2A, 1B, 2B; groepsvolgorde; leerkrachten toewijzen per groep; e-mail van leerkracht wijzigen; vervanging collega; beheerrecht per leerkracht; testmap in de repository |

De echte leerlingenlijst is opgeladen en alle acht leerkrachten zijn aan hun groepen gekoppeld.

### Open, in volgorde

- [ ] Live test met een echt leerlingaccount en een collega
- [ ] Spoor 2: bestaande sites overzetten (transformaties en symmetrie, algebraïsche uitdrukkingen, som en verschil van veeltermen, …), met per site jaar en rubriek van de beheerder
- [ ] Vinkje in de zijbalk voor leerlingen (onderdeel af als alle kaarten van basis en oefenen juist zijn)
- [ ] Sleep- en tekenoefeningen meetellen in de voortgang (nu tellen ze niet mee)
- [ ] Spoor 1: nieuwe modules uit werkboek-PDF's, ook voor 2A, 1B en 2B
- [ ] Spoor 3 (werkt zoals huistaken, zie Toetsen en taken): rekenvaardigheden met punten: gescoorde reeksen, Mijn resultaten met feedback per vraag, open- en sluitdatum en -uur per groep (of altijd open, of enkel een start), laatste poging telt
- [ ] Brug naar Classroom: op main (PR 45, 28 oktober 2026); de beheerder test met een proefklas. Pdf per leerling naar Classroom of Drive volgt later
- [ ] Toetsen en taken: basis op main (PR 32); eerste proeftaak nog te kiezen door de beheerder, dan testen met zijn groepen; daarna echte toetsen en taken, Classroom en Drive (Apps Script)
- [ ] Archief naar de schooldrive en overgang naar een nieuw schooljaar
- [ ] Later: rubriek basisgeletterdheid (wiskundige problemen staat er voor 1A, 2A en 2B; heuristieken voor 1A in 1A/wiskundige-problemen)

### Toetsen en taken (keuzes 24 oktober 2026, nog niet gebouwd)

De beheerder wil naast proeftoetsen ook echte toetsen en huistaken op basis van de modules, in twee aparte rubrieken: toetsen (map toetsen) en huistaken (map huistaken), naast modules en rekenvaardigheden (keuze 24 oktober 2026). Alle keuzes per vraag: /mnt/project-files/toetsen-en-taken/Keuzes.md. Kort:

- Claude bouwt elke toets of taak op vraag van de beheerder; iedereen krijgt dezelfde vragen; per toets te kiezen of de volgorde wisselt.
- Toets één poging, huistaak opnieuw mag (laatste telt); open- en sluitmoment per groep, knoppen Nu openen/Nu sluiten, aparte opening per leerling.
- Verbetersleutel in Firestore, enkel leesbaar voor leerkrachten; het dashboard verbetert; open vragen verbetert de leerkracht met punten. Modules van hetzelfde onderwerp gaan dicht zolang de toets openstaat.
- Feedback per toets te kiezen, standaard ziet de leerling niets.
- Pdf: de volledige toets zoals op papier met de schoolhoofding en de ingevulde antwoorden, score en verbetering. Naar Classroom: punten als concept (Apps Script), pdf per leerling in een Drive-map, knop Pdf van de klas.
- Eerst uitgebreid testen op een branch; de beheerder test met zijn eigen groepen en maakt zelf proeftaken.
- De rubriek rekenvaardigheden werkt zoals de huistaken (keuze van de beheerder, 24 oktober 2026); dat geldt ook voor Spoor 3 waar de planning verschilt.

**Gebouwd (24 oktober 2026, op main: PR 32, merge cddf05e).** de beheerder heeft nog geen proeftaak; de catalogus is leeg. **Voorlopig enkel zichtbaar voor beheerders** (keuze van de beheerder, 24 oktober 2026, op main: PR 33, merge b2cec01): OPDR_ZICHTBAAR = 'beheerder' in gedeeld/opdrachten.js verbergt rubriektegels, rubriekpagina's, opdrachtpagina's, afdrukpagina en het tabblad in het dashboard voor collega's, toeschouwer en leerlingen. Op 'iedereen' zetten als de beheerder het vrijgeeft. Basis zonder echte inhoud:

| Bestand | Rol |
| --- | --- |
| gedeeld/opdrachten.js | Catalogus OPDRACHTEN (id, titel, kort, jaar, rubriek, pad; nieuwe achteraan, id nooit wijzigen) en hulpfuncties: staat (dicht, gepland, open, gesloten), toetsSluit, groepVoor, schud (vaste volgorde per leerling), verbeter en bereken (punten), versleutel en ontsleutel (PBKDF2 + AES-GCM) |
| gedeeld/opgave-weergave.js, opdracht.css | Een opgave tekenen: invullen, lezen met verbetering, blanco, sleutel. Vraagtypes getal, tekst, keuze, meer, open |
| gedeeld/opdracht.js | Pagina van een opdracht: leerling vult in (automatisch bewaard in inzendingen/<id>__<e-mail>), dient in; leerkracht ziet een voorbeeld en kan de sleutel tonen |
| gedeeld/rubriek.js | Rubriekpagina's <jaar>/toetsen, huistaken, rekenvaardigheden: tegels uit de catalogus |
| dashboard/opdrachten.js | Tabblad Toetsen en taken per groep: Nu openen/Nu sluiten, openings- en sluitmoment, pogingen, volgorde, wat de leerling ziet (standaard niets), modules dicht, eigen opening per leerling; Resultaten: sleutelcode, automatisch en met de hand verbeteren, Heropenen, Poging wissen, Vrijgeven, Kopieer de punten |
| dashboard/afdruk.html | Ingevulde toets per leerling met schoolhoofding (zoals Taakvoorbeeld_2025_SV), score en verbetering; ?soort=blanco en ?soort=sleutel. Pdf via Afdrukken, Opslaan als PDF |
| hulp/versleutel.mjs | node hulp/versleutel.mjs <sleutel.json> <map van de opdracht> [code]: schrijft sleutel.enc.json en toont de sleutelcode |
| firestore.rules | Collecties inzendingen (leerling enkel eigen document, na slot niets meer), sleutels (enkel leerkrachten), resultaten (leerling enkel eigen en pas als vrij) |
| test/opdrachten.js, test/opdracht/ | Test met een voorbeeldtoets (code TEST-CODE) en -taak (TAAK-CODE) |

Instellingen per groep: groepen/{groep}.opdr.{id} = { van, tot (ms), pogingen (1 of 0 = onbeperkt), volgorde, ziet (niets, score, verbetering), dicht [site-id's], extra { e-mail: { van, tot } } }.
Grenzen: geen "meteen na het indienen" (dan zou de sleutel bij de leerling staan); het tijdvenster wordt in de pagina gecontroleerd en het dashboard toont "te laat", Firestore zelf kijkt niet naar de tijd. Classroom: zie Google Classroom hieronder (zonder Apps Script). Drive volgt later.

**Een nieuwe toets of taak maken (Claude):** map <jaar>/<rubriek>/<map>/ met index.html (zoals test/opdracht/toets/index.html, paden ../../../gedeeld/), opgave.js (window.OPGAVE met hetzelfde id) en sleutel.enc.json. De leesbare sleutel.json komt NOOIT in de repository (die is openbaar) maar in /mnt/project-files/toetsen-en-taken/sleutels/; de sleutelcode krijgt de beheerder in de thread. Element achteraan OPDRACHTEN. Schermafbeeldingen van de test: /mnt/project-files/toetsen-en-taken/schermen/.

### Rekenvaardigheden 2A: interactieve taken met punten (24 oktober 2026, op main sinds 27 en 28 oktober 2026: PR 34, 41, 43 en 44)

De beheerder leverde zeven Oefening.html-bestanden met hun code.gs (Apps Script). Ze worden taken met punten in 2A/rekenvaardigheden/ (niet in huistaken), in deze volgorde: 1 coördinaten, 2 optellen en aftrekken gehele getallen, 3 vermenigvuldigen en delen gehele getallen, 4 optellen en aftrekken rationale getallen, 5 vermenigvuldigen en delen rationale getallen, 6 machten en vierkantswortels, 7 volgorde van bewerkingen. Geen extra oefeningen, volgorde en uitleg behouden. Alle keuzes en de sleutelcodes: /mnt/project-files/2A-rekenvaardigheden/Keuzes.md; leesbare sleutels in /mnt/project-files/2A-rekenvaardigheden/sleutels/; bronbestanden in bron/.

- Nieuw vraagtype `eigen` in het opdrachtformaat: opgave.js zet OPGAVE.invullen (interactief scherm via gedeeld/rv-kader.js en rv-kader.css: één oefening per scherm, bolletjes, Vorige/Volgende, Opnieuw beginnen), OPGAVE.volledig, OPGAVE.verbeter (deelpunten en foutcodes zoals code.gs), OPGAVE.toon (figuur en antwoord als tekst voor dashboard, pdf en resultaat), OPGAVE.codes (namen van de foutcodes) en OPGAVE.css. Een antwoord staat als JSON-tekst in inzendingen.
- Tekenvak overal: + boven, − onder, de leerling klikt aan. Plus en min zwart; enkel de legertjes rood en blauw.
- Punten op 5 (aanvulling van de beheerder: die komen op het rapport): `op:5` in de catalogus; kolom Op 5 in Resultaten, in Kopieer de punten, in de pdf-hoofding en bij de leerling; resultaten bewaart op en opPunten.
- Dashboard: stap 0,25 bij punten met de hand, foutcodes en rode kruisjes per cel (aanwijzen), tabel Typische fouten in deze groep. Oefenvragen (q.oefen) tellen niet mee.
- Test: test/rekenvaardigheden.js (zet een eigen testsleutel; met RV_CODE=<code> ook de echte). Firestore-regels: geen wijziging.
- Stand (28 oktober 2026): alle zeven taken staan op main in 2A/rekenvaardigheden/ (1-coordinaten, 2-gehele-optellen, 3-gehele-vermenigvuldigen, 4-rationale-optellen, 5-rationale-vermenigvuldigen, 6-machten-wortels, 7-volgorde-bewerkingen). Dubbele tekens klik je aan in de opgave en een + vooraan verdwijnt. Rode kruisjes zijn er enkel voor de leerling, niet in het dashboard, het detail of de pdf. De verbetersleutel bewaart een lijst in een lijst correct in Firestore (PR 44). CI installeert het lettertype Carlito.

### Vrij oefenen 1A en 2A (29 oktober 2026, branch claude/project-thread-pgp2c4)

Een eigen tegel **Vrij oefenen** op de jaarpagina (na Rekenvaardigheden), naast de modules en rekenvaardigheden: enkel bewerkingen, telkens nieuwe opgaven, automatisch verbeterd (enkel juist of fout), een score op 10, geen huistaak en geen koppeling met Classroom. Keuzes van de beheerder (vragenpagina in twee versies): /mnt/project-files/vrij-oefenen/Keuzes.md.

- **Sites:** 1a-vrij (prefix 1a_vrij_v1_, map 1A/vrij-oefenen/) en 2a-vrij (prefix 2a_vrij_v1_, map 2A/vrij-oefenen/), rubriek vrij-oefenen, in sites.js met `vrij:true`. Openzetten per groep zoals een module, met een vinkje per hoofdstuk. Geen rekentoestel, geen tijd.
- **Hoofdstukken (onderdelen):** 2A: Optellen en aftrekken (optel), Vermenigvuldigen en delen (maal), Machten en vierkantswortels (macht), Volgorde van bewerkingen (volg), Alles door elkaar (mix). 1A: Optellen en aftrekken, Vermenigvuldigen en delen, Volgorde van bewerkingen (zonder haakjes, met haakjes, met machten en wortels), Machten en vierkantswortels (macht en wortel, toegevoegd na de eerste versie en dus achteraan), Alles door elkaar. Id's van hoofdstukken, getallen en bewerkingen nooit wijzigen (ze zitten in de scores); nieuwe achteraan, Alles door elkaar blijft laatst.
- **Kiezen in een hoofdstuk:** welke getallen (2A: gehele getallen, breuken, kommagetallen, alles door elkaar; 1A: natuurlijke getallen, gehele getallen, kommagetallen, breuken, alles door elkaar) en welke bewerking (optellen, aftrekken, gedurige som; vermenigvuldigen, delen, meer factoren; macht, macht met minteken, vierkantswortel; zonder haakjes, met haakjes, met machten en wortels; telkens ook alles door elkaar). **Meerkeuze:** de leerling kiest één of meer soorten getallen en één of meer bewerkingen (bv. gehele getallen + breuken, optellen + aftrekken); staat alles aan, dan kiest één klik enkel die soort; Alles door elkaar zet alles aan. Een combinatie wordt bewaard als ids met + (bv. z+q, plus+min). Alles door elkaar bij de getallen mengt ook breuken en kommagetallen in één oefening. Het hoofdstuk Alles door elkaar neemt oefeningen uit alle hoofdstukken die voor de groep openstaan.
- **Reeks:** 10 oefeningen, één per scherm met bolletjes en Vorige/Volgende, één niveau. Antwoord in één vak; bij breuken een breukvak (teller boven noemer, knop minteken; een - intikken in de teller zet het minteken). Juist = zelfde waarde; een breuk moet vereenvoudigd zijn, een geheel getal schrijf je zonder noemer (noemer 1 is fout); bij een opgave met breuken én kommagetallen mag ook een kommagetal. Verbeter mijn reeks: lege oefeningen vragen eerst een bevestiging en tellen als fout. Daarna enkel ✓ of ✗ per oefening (geen juist antwoord, geen uitleg, geen hints) en de score, dan Nieuwe reeks. Een begonnen reeks blijft bewaard (per hoofdstuk), ook op een ander toestel.
- **Scores:** <prefix>scores = { "hoofdstuk|getallen|bewerking": { n, l (laatste), b (beste), d } }; de leerling ziet ze per keuze in een tabel onder de knoppen (klik op een vakje kiest die combinatie); combinaties van meer soorten staan eronder bij Andere combinaties. Daarnaast CL.toets met sleutel <hoofdstuk>_<getallen>-<bewerking> (laatste reeks, samengevoegd in Firestore).
- **Dashboard:** rubriek Vrij oefenen in Openzetten en Voortgang. Cel per hoofdstuk: laatste score op 10, beste score, aantal reeksen en werktijd; overzicht: gemiddelde van de laatste score per hoofdstuk; detail per leerling: scores per keuze.
- **Motor:** gedeeld/vrij-oefenen.js en vrij-oefenen.css (exact rekenen met breuken, sjablonen per hoofdstuk en bewerking, nagekeken tussenuitkomsten: gehele getallen blijven geheel, kommagetallen breken af, breuken met kleine noemers, 1A enkel negatief bij de gehele getallen). **1A-grenzen (beslist door de beheerder, 29 oktober 2026):** gehele getallen eenvoudig van −20 tot +20 (zMax), machten tot 20² en derdemachten tot 5³, vierkantswortels tot √400 (kwadraat), geen negatieve exponenten. **Kommagetallen bij vermenigvuldigen en delen:** enkel met 0,1 0,2 0,5 0,01 0,001 (1A) en in 2A ook 0,25 en 0,125 (instelling komma in inhoud.js); het andere getal is een natuurlijk/geheel getal of een kommagetal. Wortelteken zoals afgesproken (V op de schrijflijn, één lijn met de streep, rond de hele breuk). Een jaar toevoegen: <jaar>/vrij-oefenen/index.html en inhoud.js met VRIJ.start({ jaar, teken, geheel, zMax, kwadraat, komma, noemers, getallen, modes, hoofdstukken }), element in sites.js, tegel op de jaarpagina.
- **Test:** node test/vrijoefenen.js (motor 2A en 1A: elke keuze, meerkeuze, kommafactoren, 1A gehele getallen tot 20, eigen juist antwoord aanvaard, fout en niet vereenvoudigd geweigerd; reeks, breukvak, lege oefeningen, herladen, gsm, dashboard). Firestore-regels: geen wijziging.

### Google Classroom (28 oktober 2026, op main: PR 45, merge a8c1db6)

De beheerder wil dat toetsen en taken automatisch met Classroom verlopen. Voorstel en vragen: /mnt/project-files/classroom/vragen_vooraf.html (artifact "Vragen Classroom-koppeling"); de beheerder gaf zijn keuzes nog niet door, dus gebouwd met de aanbevolen keuzes.

- **Geen server, geen Apps Script.** Het dashboard roept de Classroom API rechtstreeks aan met het Google-account van de leerkracht (Google Identity Services, toegang van één uur, bewaard in sessionStorage cr_token). Volledig op de achtergrond (zonder dat iemand het dashboard opent) zou Cloud Functions met het Blaze-abonnement vragen; niet gedaan.
- **Grens van Classroom:** punten enkel op opdrachten die met dezelfde webclient aangemaakt zijn, dus het dashboard maakt de opdracht zelf. Opdrachten die met de hand in Classroom gemaakt zijn, kan het niet invullen.
- **Eenmalige instelling (gedaan door de beheerder op 28 oktober 2026)** in de Google Cloud-console, project campus-lievegem-wiskunde: Classroom API aan; Google Auth Platform: doelgroep Intern, scopes classroom.courses.readonly, classroom.coursework.students, classroom.rosters.readonly, classroom.profile.emails; webclient "Web client (auto created by Google Service)" met JavaScript-bron https://campus-lievegem-wiskunde.github.io. Client-ID in gedeeld/firebase-config.js (CLASSROOM_CLIENT_ID, niet geheim). Andere leerkrachten hoeven niets in te stellen: de eerste keer één klik op Toestaan, en ze moeten leerkracht zijn van de Classroom-klas.
- **Werking:** tabblad Toetsen en taken, kader Google Classroom: een groep eenmalig koppelen aan een klas (de klas met de groepsnaam in naam of sectie wordt voorgesteld). Opent een opdracht (Nu openen of openingsmoment), dan zet het dashboard ze in Classroom: titel, uitleg, link naar de opdracht, maximum = op (bv. 5) of het totaal; later openingsmoment = ingepland, sluitmoment = inleverdatum (enkel als het nog moet komen). Resultaten: conceptpunt (draftGrade) voor elke ingediende en volledig verbeterde opdracht, telkens Resultaten opent of Punten bewaren; bij Resultaten vrijgeven definitief (assignedGrade) en teruggegeven. Open vragen nog niet verbeterd: niets. Niet ingediend: niets (Classroom toont Ontbreekt). Het kader meldt wie in de groep zit maar niet in de klas, en omgekeerd.
- **Zonder geldige toegang** wacht alles en toont het kader de knop Verbind met Classroom (Google laat het aanmeldvenster enkel bij een klik open); één klik volstaat voor een uur.
- **Gegevens:** groepen/{groep}.classroom = { id, naam, link, door, op } en groepen/{groep}.cr.{opdracht-id} = { course, cw, link }. Geen wijziging aan firestore.rules (leerkrachten mogen groepen al bijwerken).
- **Bestanden:** dashboard/classroom.js (API), dashboard/opdrachten.js (kader en automatisch bijwerken), test/classroom.js met nep-Classroom test/fake/classroom.js.
- **Nog te doen:** de beheerder test met een proefklas; pdf per leerling naar Classroom of Drive (later).

### Open vragen

- Welke rekenvaardigheden dit schooljaar, en voor welke jaren?
- Bestaande losse sites: welke prefixen gebruikten leerlingen al, zodat hun werk behouden blijft? (Transformaties, 2A Module 1: oud werk hoeft niet bewaard te blijven, nieuwe prefix 2a_m1_transfo_v1_.)
- 2A Module 1 staat op main (PR 1, merge f8cb09b, 18 oktober 2026, na goedkeuring van de beheerder). Verdere wijzigingen: nieuwe branch vanaf main.
