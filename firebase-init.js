/* Firebase setup for Grand Kizara Esports.
   1. Firebase console > Project settings > Your apps > Web app: copy the config object below.
   These values are public identifiers, not secrets. Security comes from firestore.rules. */
(function(){
  var firebaseConfig = {
    apiKey: "PASTE_API_KEY",
    authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
    projectId: "PASTE_PROJECT_ID",
    storageBucket: "PASTE_PROJECT_ID.appspot.com",
    messagingSenderId: "PASTE_SENDER_ID",
    appId: "PASTE_APP_ID"
  };
  if(!window.firebase || /PASTE_/.test(firebaseConfig.apiKey)) return; /* site still runs, shown as Offline */
  firebase.initializeApp(firebaseConfig);
  window.GK = { auth: firebase.auth(), db: firebase.firestore() };
})();
