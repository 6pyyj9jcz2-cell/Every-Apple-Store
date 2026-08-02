# All 11 — Apple Stores NYC, No Car

A single-page site that walks you through every Apple Store in New York
City using only walking, the subway, and the Staten Island Ferry.

Live route: Upper East Side → Fifth Avenue → Grand Central → SoHo →
West 14th Street → World Trade Center → Staten Island → Downtown
Brooklyn → Williamsburg → Queens Center → Bay Plaza.

## Features
- Fixed route order with the transit leg (mode + time) shown between each stop
- Tap **Visited** to check off a store — saved in your browser
- Rate each store out of 10 and leave notes — also saved in your browser
- One-tap links to Apple Maps and Google Maps for turn-by-turn directions
- A **"Next →"** button pinned to the bottom of the screen that jumps you straight to your next unvisited store
- A live progress bar and a "transit left" clock that shrinks as you check off stores
- A single **"Open full route in Google Maps"** button that loads all 11 stops as one multi-stop trip
- A dark mode toggle (moon/sun icon, top right of the header) — your choice is remembered
- A **trip code** that gates the page and syncs your progress across every device that uses the same code (see setup below)
- "Reset all progress" button if you want to start a fresh run

## Add it to your phone's home screen
For the actual day of the crawl, add the site to your home screen so it
opens full-screen, like an app, with no browser bar:

- **iPhone (Safari):** open the site → tap the Share icon → **Add to Home Screen**.
- **Android (Chrome):** open the site → tap the ⋮ menu → **Add to Home screen** (or **Install app**).

Everything still works the same way — your visited/rating/notes data stays
saved even when launched from the home screen icon.

## How your data is stored
Progress, ratings, and notes are always cached in your browser's
`localStorage` first, so the site works instantly and even offline. If you
set up cloud sync (below), the same data is also saved to a Firestore
document keyed by your trip code, and every device that enters that code
reads and writes the same document — that's what makes it sync.

**Without cloud sync set up:** the site still works great, you'll just see
a one-time code prompt (any code works) and your data stays local to that
device only, exactly like before.

## Setting up cloud sync (optional)
This makes your trip code actually sync data between devices, using a free
Firebase project.

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and create a project (free — no credit card required for this usage level).
2. In the project, go to **Build → Firestore Database → Create database**.
   Choose **Start in test mode** and any region.
3. Click the ⚙️ gear icon → **Project settings**. Under **Your apps**, click
   the `</>` (web) icon to register a new web app — nickname doesn't matter,
   you don't need Firebase Hosting.
4. Firebase will show you a `firebaseConfig` object. Copy those values into
   `firebase-config.js` in this repo, replacing every `"REPLACE_ME"`.
5. Back in Firestore, go to the **Rules** tab and replace the default rule
   with this, then click **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /trips/{tripId} {
         allow read, write: if true;
       }
     }
   }
   ```
   This keeps the free "test mode" behavior (open access) but makes it
   explicit and won't expire after 30 days the way Firebase's default test
   rules do. It is **not real authentication** — anyone who has your trip
   code can read or write that trip's data. Fine for a shared personal
   checklist; don't use it for anything sensitive.
6. Commit and push `firebase-config.js` with your real values, redeploy to
   GitHub Pages, and enter the same trip code on each device you want synced.

If you skip this setup entirely, `firebase-config.js` stays full of
`"REPLACE_ME"` placeholders and the site just runs in local-only mode —
nothing breaks.

## Running it locally
No build step — it's plain HTML/CSS/JS. Just open `index.html` in a
browser, or serve the folder:

```bash
python3 -m http.server
```

## Deploying to GitHub Pages
1. Push this folder to a GitHub repo — make sure `firebase-config.js`,
   `manifest.json`, and the icon PNGs (`apple-touch-icon.png`,
   `favicon-16.png`, `favicon-32.png`, `icon-192.png`, `icon-512.png`) are
   included alongside `index.html`, `style.css`, and `script.js`.
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose the branch (usually `main`) and root folder.
4. Save — your site will be live at `https://<username>.github.io/<repo>/`.

## Editing the route
All store data (name, address, neighborhood, and the leg connecting it
to the previous stop) lives in the `STORES` array at the top of
`script.js`. Add, remove, or reorder stops there.
