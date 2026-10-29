# Vrij antwoordvak met tussenstappen (standaard voor alle modules)

Stand van 29 oktober 2026 · uitgewerkt in 2A Module 4 Machten (branch claude/project-thread-pj1nlv, PR 48) · afspraken van de beheerder

Dit document beschrijft het vrije antwoordvak waarin een leerling zelf het antwoord opbouwt, met tussenstappen zoals op papier. Het geldt als standaard voor alle volgende oefeningen waarin de leerling meer dan één denkstap moet zetten. Wijkt de code af, dan wint de code en pas je dit document aan.

## 1. Waarom

- **Niets voorkauwen.** De leerling zet zelf elke denkstap: het teken, of er een breuk nodig is, welke exponent in de noemer komt, waar de haakjes staan. Vroegere oefeningen gaven de breuk, de haakjes of de stambreuk al cadeau; dat is te makkelijk (de beheerder, 29 oktober 2026).
- **Werken zoals op papier.** Een leerling mag zoveel tussenstappen schrijven als hij wil, elk op een nieuwe regel die begint met =.
- **Lichte, gerichte feedback.** Een juiste tussenstap is geen fout: dan zegt het platform *bijna juist, reken nog verder uit*. Een foute regel krijgt een klein rood kruisje; wie erop klikt, krijgt uitleg en waar mogelijk een knop die de stap verbetert.

Voorbeeld van de werkwijze die moet werken (negatieve exponent bij een breuk):

1. Schrijf met een positieve exponent, met haakjes rond de omgekeerde breuk: = (b/2a)³
2. Teller en noemer krijgen elk de exponent, met haakjes rond een negatief getal of een product: = b³ / (2a)³
3. Reken uit: = b³ / 8a³
4. Vereenvoudig indien nodig.

## 2. Wanneer gebruiken

| Gebruik het vrije antwoordvak | Houd de vaste vakjes |
|---|---|
| Oefenen en Verdieping met meer dan één denkstap | Basiskaarten (eerste kaart), die bewust stap voor stap begeleiden |
| Proeftoetsen (vragen met letters) | Zuiver numerieke uitkomsten ({{u:k}}): één getal of breuk |
| Elke vraag waarbij het antwoord een eentermvorm is (getal · letters met exponenten, eventueel als breuk) | Exponenten met letters (a^(n+2)): de motor rekent enkel met gehele exponenten |
| | Keuzevragen, sorteren, zoek de fout |

## 3. Wat de leerling ziet

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

## 4. Controle

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

## 5. Knoppen per oefening (voor volgende hoofdstukken)

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

## 6. Technisch (voor Claude)

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
- De vierstappenwerkwijze uit paragraaf 1 (vrij2.js), kruisje en verbeterknop (kruis.js), proeftoets zonder kruisjes vóór verbeteren (toetsx.js), lege regels weg (trim.js), ongedaan maken (undo.js).
- Daarna `node test/catalogus.js` en schermafbeeldingen nakijken.

## 7. Toepassing in Module 4 (29 oktober 2026)

- **Vrij vak** in de kaarten met letters: vermenigvuldigen (letters), delen (letters, gemengd), macht van een macht (positief), deling met een eenterm, product tot een macht (uitwerken, negatief), quotiënt tot een macht (letters, gemengd, negatief), en de proeftoetsvragen met letters.
- **Machtvak {{m}}** (grondtal + exponent) in vermenigvuldigen met breuken, rekenen en delen rekenen.
- **Ongewijzigd:** basiskaarten, numerieke uitkomsten en exponenten met letters.
- Schermafbeeldingen: /mnt/project-files/2A-module-4/schermen/ (vrij_antwoordvak_werkuit.png, kruisje_uitleg.png, verbeter_knop.png, knoppen_tooltip.png, knoppen_spiekbriefje.png, schikkingen_knoppen.png).

## 8. Tekst om in de projectinstructies te plakken

```
Vrij antwoordvak (standaard sinds 29 oktober 2026, zie projectkennis/Vrij_antwoordvak_standaard.md):
- Oefeningen met meer dan één denkstap (Oefenen, Verdieping, proeftoetsen) gebruiken het vrije antwoordvak: de leerling bouwt het antwoord zelf op, met tussenstappen op nieuwe regels die met = beginnen. Niets voorkauwen: geen breuk, haakjes of stambreuk cadeau geven. Basiskaarten mogen stap voor stap begeleiden.
- Mini-rekenmachientje naast de oefening (op gsm eronder). Knoppen enkel met icoon, woord als tooltip na 1 s, nooit + voor een extra factor (wel ·). Altijd ongedaan maken en = (regel weg vanaf twee regels), en een ?-knop rechtsboven met een spiekbriefje.
- Elke oefening krijgt enkel de knoppen die ze nodig heeft ({{x:a,mh}}); een nieuwe knop krijgt icoon, tooltip, aria-label, sneltoets en een rij in het spiekbriefje.
- Controle: lege regels achteraan verdwijnen, de laatst ingevulde regel is het antwoord. Juist / bijna juist (juiste tussenstap, reken verder) / fout. Foute regel: klein rood kruisje met uitleg en waar mogelijk een knop "Verbeter deze stap" (verbetering in het rood). In proeftoetsen geen kruisjes vóór "Verbeter mijn proeftoets"; bijna juist telt daar als fout.
- Test: elke vraag moet haar eigen canonieke antwoord aanvaarden, plus de werkwijze met tussenstappen.
```
