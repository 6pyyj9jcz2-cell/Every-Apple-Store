// Paste the config object from your OWN Firebase project here.
//
// How to get it:
// 1. Go to https://console.firebase.google.com and create a free project.
// 2. In the project, click "Build > Firestore Database" > "Create database"
//    > start in TEST MODE (fine for this personal-use case) > pick any region.
// 3. Click the gear icon > "Project settings".
// 4. Under "Your apps", click the </> (web) icon to register a new web app
//    (any nickname is fine, no hosting needed).
// 5. Firebase will show you a firebaseConfig object — copy those values
//    into the object below, replacing every "REPLACE_ME".
//
// This config is NOT a secret — it's meant to be public in client-side code.
// What actually protects your data is your Firestore security rules
// (see README.md for the rule to paste in).

export const firebaseConfig = {
  apiKey: "AIzaSyAyVdaWqluebDlEYvQIkC6YmJIIzRDIh5k",
  authDomain: "every-apple-store.firebaseapp.com",
  projectId: "every-apple-store",
  storageBucket: "every-apple-store.firebasestorage.app",
  messagingSenderId: "255758177816",
  appId: "1:255758177816:web:d0067182f56b35eccf556d"
};
