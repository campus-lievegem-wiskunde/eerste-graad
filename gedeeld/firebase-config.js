/* Koppeling met het Firebase-project. Deze gegevens zijn niet geheim:
   de beveiliging zit in de toegangsregels (firestore.rules). */
export const firebaseConfig = {
  apiKey: "AIzaSyDh_sQSN9KCUrW76fISc2DCrc4R09FS1nM",
  authDomain: "campus-lievegem-wiskunde.firebaseapp.com",
  projectId: "campus-lievegem-wiskunde",
  storageBucket: "campus-lievegem-wiskunde.firebasestorage.app",
  messagingSenderId: "848131645100",
  appId: "1:848131645100:web:52814cd088e42dae040909"
};
export const DOMEIN = 'svsl.be';          /* enkel schoolaccounts */
export const SCHOOLJAAR = '2026-2027';    /* elk jaar aanpassen (of via het dashboard) */
/* Google Classroom (dashboard, tabblad Rekenvaardigheden): webclient van het Firebase-project in de Google Cloud-console.
   Niet geheim. Toegelaten JavaScript-bron: https://campus-lievegem-wiskunde.github.io */
export const CLASSROOM_CLIENT_ID = '848131645100-dg8fs8qnfckn6bovockmht1hmdghmh0h.apps.googleusercontent.com';
