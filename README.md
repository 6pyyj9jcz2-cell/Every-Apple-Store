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
- "Reset all progress" button if you want to start a fresh run

## Add it to your phone's home screen
For the actual day of the crawl, add the site to your home screen so it
opens full-screen, like an app, with no browser bar:

- **iPhone (Safari):** open the site → tap the Share icon → **Add to Home Screen**.
- **Android (Chrome):** open the site → tap the ⋮ menu → **Add to Home screen** (or **Install app**).

Everything still works the same way — your visited/rating/notes data stays
saved in the browser even when launched from the home screen icon.

Progress, ratings, and notes are stored in `localStorage`, so they stick
around between visits on the same device/browser, but won't sync across
devices and will clear if you clear your browser data.

## Running it locally
No build step — it's plain HTML/CSS/JS. Just open `index.html` in a
browser, or serve the folder:

```bash
python3 -m http.server
```

## Deploying to GitHub Pages
1. Push this folder to a GitHub repo.
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose the branch (usually `main`) and root folder.
4. Save — your site will be live at `https://<username>.github.io/<repo>/`.

## Editing the route
All store data (name, address, neighborhood, and the leg connecting it
to the previous stop) lives in the `STORES` array at the top of
`script.js`. Add, remove, or reorder stops there.
