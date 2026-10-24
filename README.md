# Wiskunde eerste graad · Campus Lievegem

Oefensites voor wiskunde in de eerste graad, in de huisstijl van Campus Lievegem.

## Opbouw

| Map | Inhoud |
| --- | --- |
| `gedeeld/` | Huisstijl (`stijl.css`), logo-afbeeldingen (`img/`), kop, voettekst, zijbalk en voorlezen (`kop.js`). Pas je hier iets aan, dan verandert elke site mee. |
| `1A/`, `1B/`, `2A/`, `2B/` | Startpagina per jaar en stroom met de rubrieken `modules/`, `rekenvaardigheden/`, `basisgeletterdheid/`, `heuristieken/` en `wiskundige-problemen/` (een rubriek verschijnt pas als er inhoud is). |
| `…/modules/module-…/` | `index.html` (titel en ondertitel) en `inhoud.js` (de oefeningen). |
| `dashboard/` | Dashboard voor leerkrachten (mijn groepen, leerlingen, openzetten, voortgang) en beheer (import, leerkrachten, groepen). |
| `gedeeld/sites.js` | Lijst van alle sites en hun onderdelen; een nieuwe site voeg je hier toe. |
| `test/` | Lokaal testen met een nep-Firebase (`test/README.md`): rooktest en het opnieuw maken van `sites.js`. |
| `.github/` | Automatische controles bij elke pull request: `tests` (alle tests met de nep-Firebase) en `goedkeuring` (wie bestanden van een ander wijzigt, heeft diens goedkeuring nodig; eigenaars in `.github/goedkeuring.js`). |
| `firestore.rules` | Toegangsregels voor Firebase (plakken in Firestore → Rules). |

Elke module staat online op `https://campus-lievegem-wiskunde.github.io/eerste-graad/1A/modules/<map>/`.
