# Testen

Alles hier draait lokaal met een **nep-Firebase**: aanmelden en de database worden nagebootst in de browser (localStorage `__fakedb`), zodat er niets in de echte Firebase komt.

Benodigd: Node, Python 3, Playwright met Chromium, en (voor de Excel-import) het npm-pakket `xlsx`.

```bash
test/serve.sh                 # lokale server op http://localhost:8765 (repository als hoofdmap)
node test/rooktest.js         # import, groepen, openzetten, leerling, voortgang: alles OK?
node test/catalogus.js        # gedeeld/sites.js opnieuw maken (na een nieuwe of gewijzigde module)
node test/fouten.js           # Fout melden (leerkracht) en Fouten (beheer)
node test/toeschouwer.js      # toeschouwer (directeur): echte gegevens lezen, wijzigingen enkel lokaal
node test/alsleerling.js      # Bekijk als leerling in een module
node test/groepsoverzicht.js  # Beheer: namen per groep, leerlingen zonder groep, kolom Groep bij opzoeken
node test/wiskundigeproblemen.js  # 2A Wiskundige problemen: oefenen, niveau, proeftoets, Bord en niveau in het dashboard
node test/koppelteken.js      # e-mailadres met koppelteken: melding met het echte adres, nieuwe leerling met eigen adres
```

| Bestand | Rol |
| --- | --- |
| `fake/app.js`, `fake/auth.js`, `fake/fs.js` | Nep-versies van firebase-app, -auth en -firestore (zelfde functies als de echte SDK die het platform gebruikt) |
| `helpers.js` | Browsercontext met de nep-Firebase, nieuwe pagina met startdatabase, aanmelden als een gekozen gebruiker |
| `voorbeeld.xlsx` | Fictieve leerlingenlijst (72 leerlingen, 20 groepen, 8 leerkrachten) |

Aanmelden in een test: `window.__nextUser = { uid, email, displayName }` en dan op `#loginBtn` klikken (`helpers.aanmelden`).
