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
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};
