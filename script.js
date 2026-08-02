// ---------- Firebase (cloud sync) ----------
// Loaded dynamically and wrapped in try/catch so that if the CDN is
// blocked, offline, or firebase-config.js hasn't been filled in yet,
// the rest of the app still works fine in local-only mode.
import { firebaseConfig } from "./firebase-config.js";

let db = null;
let fs = null; // holds { doc, getDoc, setDoc, onSnapshot } once loaded

async function initFirebase() {
  const configured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "REPLACE_ME";
  if (!configured) return false;
  try {
    const [{ initializeApp }, firestoreMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js")
    ]);
    const app = initializeApp(firebaseConfig);
    db = firestoreMod.getFirestore(app);
    fs = {
      doc: firestoreMod.doc,
      getDoc: firestoreMod.getDoc,
      setDoc: firestoreMod.setDoc,
      onSnapshot: firestoreMod.onSnapshot
    };
    return true;
  } catch (e) {
    console.error("Firebase failed to load — continuing in local-only mode", e);
    db = null;
    fs = null;
    return false;
  }
}

// ---------- Route data ----------
// leg = how you get from the PREVIOUS stop to this one (null for the first stop)
const STORES = [
  {
    id: "upper-east-side",
    name: "Apple Upper East Side",
    neighborhood: "Upper East Side, Manhattan",
    address: "940 Madison Ave, New York, NY 10021",
    leg: null
  },
  {
    id: "fifth-avenue",
    name: "Apple Fifth Avenue",
    neighborhood: "Midtown East, Manhattan",
    address: "767 Fifth Ave, New York, NY 10153",
    leg: { mode: "walk", chip: "WALK", duration: "15 min" }
  },
  {
    id: "grand-central",
    name: "Apple Grand Central",
    neighborhood: "Midtown East, Manhattan",
    address: "45 Grand Central Terminal, New York, NY 10017",
    leg: { mode: "walk", chip: "WALK", duration: "20 min" }
  },
  {
    id: "soho",
    name: "Apple SoHo",
    neighborhood: "SoHo, Manhattan",
    address: "103 Prince St, New York, NY 10012",
    leg: { mode: "ace", chip: "A C E", duration: "15 min" }
  },
  {
    id: "west-14th",
    name: "Apple West 14th Street",
    neighborhood: "Meatpacking District, Manhattan",
    address: "401 W 14th St, New York, NY 10014",
    leg: { mode: "walk", chip: "WALK", duration: "20 min" }
  },
  {
    id: "world-trade-center",
    name: "Apple World Trade Center",
    neighborhood: "Financial District, Manhattan",
    address: "185 Greenwich St, New York, NY 10007",
    leg: { mode: "1", chip: "1", duration: "15 min" }
  },
  {
    id: "staten-island",
    name: "Apple Staten Island",
    neighborhood: "Staten Island",
    address: "2655 Richmond Ave, Staten Island, NY 10314",
    leg: { mode: "ferry", chip: "FERRY", duration: "30 min" }
  },
  {
    id: "downtown-brooklyn",
    name: "Apple Downtown Brooklyn",
    neighborhood: "Downtown Brooklyn, Brooklyn",
    address: "123 Flatbush Ave Ext, Brooklyn, NY 11201",
    leg: { mode: "456", chip: "4 5", duration: "20 min" }
  },
  {
    id: "williamsburg",
    name: "Apple Williamsburg",
    neighborhood: "Williamsburg, Brooklyn",
    address: "247 Bedford Ave, Brooklyn, NY 11211",
    leg: { mode: "l", chip: "L", duration: "10 min" }
  },
  {
    id: "queens-center",
    name: "Apple Queens Center",
    neighborhood: "Elmhurst, Queens",
    address: "90-15 Queens Blvd, Elmhurst, NY 11373",
    leg: { mode: "mr", chip: "M R", duration: "25 min" }
  },
  {
    id: "bay-plaza",
    name: "Apple Bay Plaza",
    neighborhood: "Bay Plaza, The Bronx",
    address: "200 Baychester Ave, Bronx, NY 10475",
    leg: { mode: "456", chip: "6", duration: "25 min" }
  }
];

const STORAGE_KEY = "apple-nyc-route-progress";
const THEME_KEY = "apple-nyc-route-theme";
const CODE_KEY = "apple-nyc-route-code";

// ---------- Theme ----------
function applyStoredTheme() {
  const isDark = localStorage.getItem(THEME_KEY) === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = isDark ? "☼" : "☾";
}

document.getElementById("theme-toggle").addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  document.getElementById("theme-toggle").textContent = isDark ? "☼" : "☾";
});

applyStoredTheme();

// ---------- Local state ----------
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

let pushTimer = null;
let applyingRemoteUpdate = false;

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (!applyingRemoteUpdate) pushToCloud(state);
}

// ---------- Cloud sync ----------
function setSyncStatus(text) {
  const el = document.getElementById("sync-status");
  if (el) el.textContent = text;
}

function tripDocRef(code) {
  return fs.doc(db, "trips", code);
}

async function syncFromCloud(code) {
  if (!db) return;
  setSyncStatus("Syncing…");
  try {
    const snap = await fs.getDoc(tripDocRef(code));
    if (snap.exists()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap.data().state || {}));
    }
    setSyncStatus("Synced ✓");
  } catch (e) {
    console.error("Cloud fetch failed, using local copy", e);
    setSyncStatus("Offline — showing this device's copy");
  }
}

function pushToCloud(state) {
  if (!db || !getTripCode()) return;
  clearTimeout(pushTimer);
  setSyncStatus("Saving…");
  pushTimer = setTimeout(() => {
    fs.setDoc(tripDocRef(getTripCode()), { state, updatedAt: Date.now() })
      .then(() => setSyncStatus("Synced ✓"))
      .catch(e => {
        console.error("Cloud save failed", e);
        setSyncStatus("Couldn't save to cloud — saved on this device only");
      });
  }, 500);
}

let unsubscribeRemote = null;
function listenForRemoteChanges(code) {
  if (!db) return;
  if (unsubscribeRemote) unsubscribeRemote();
  unsubscribeRemote = fs.onSnapshot(tripDocRef(code), snap => {
    if (!snap.exists()) return;
    const remoteState = JSON.stringify(snap.data().state || {});
    if (remoteState !== localStorage.getItem(STORAGE_KEY)) {
      applyingRemoteUpdate = true;
      localStorage.setItem(STORAGE_KEY, remoteState);
      render();
      applyingRemoteUpdate = false;
    }
  });
}

// ---------- Gate (trip code) ----------
function getTripCode() {
  return localStorage.getItem(CODE_KEY);
}

function normalizeCode(raw) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function showGate() {
  document.getElementById("gate").classList.add("is-open");
  document.getElementById("gate-input").focus();
}

function hideGate() {
  document.getElementById("gate").classList.remove("is-open");
}

async function unlockWithCode(rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return;
  localStorage.setItem(CODE_KEY, code);
  hideGate();
  if (!db && !fs) await initFirebase();
  if (db) {
    await syncFromCloud(code);
    listenForRemoteChanges(code);
  } else {
    setSyncStatus("Cloud sync not configured yet — saving on this device only");
  }
  render();
}

document.getElementById("gate-form").addEventListener("submit", e => {
  e.preventDefault();
  unlockWithCode(document.getElementById("gate-input").value);
});

document.getElementById("switch-code-btn").addEventListener("click", () => {
  localStorage.removeItem(CODE_KEY);
  if (unsubscribeRemote) unsubscribeRemote();
  document.getElementById("gate-input").value = "";
  showGate();
});

// ---------- Maps links ----------
function buildFullRouteLink() {
  const origin = encodeURIComponent(STORES[0].address);
  const destination = encodeURIComponent(STORES[STORES.length - 1].address);
  const waypoints = STORES.slice(1, -1)
    .map(s => encodeURIComponent(s.address))
    .join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=transit`;
}

function mapsLinks(address) {
  const q = encodeURIComponent(address);
  return {
    apple: `https://maps.apple.com/?q=${q}`,
    google: `https://www.google.com/maps/search/?api=1&query=${q}`
  };
}

// ---------- Render ----------
function render() {
  const state = loadState();
  const list = document.getElementById("stops");
  list.innerHTML = "";

  STORES.forEach((store, i) => {
    const entry = state[store.id] || { visited: false, rating: "", notes: "" };
    const links = mapsLinks(store.address);
    const legMode = store.leg ? store.leg.mode : "";

    const li = document.createElement("li");
    li.className = "stop" + (entry.visited ? " is-visited" : "");
    li.dataset.id = store.id;

    li.innerHTML = `
      <div class="bullet">${i + 1}</div>
      <div class="spine ${store.leg ? "mode-" + legMode : ""}"></div>
      ${store.leg ? `
        <div class="leg">
          <span class="leg-chip mode-${legMode}">${store.leg.chip}</span>
          <span>${store.leg.duration} from stop ${i}</span>
        </div>
      ` : `<div class="leg"><span>Starting point</span></div>`}
      <div class="card">
        <div class="card-top">
          <div>
            <h2 class="card-name">${store.name}</h2>
            <p class="card-meta">${store.neighborhood}</p>
            <p class="card-address">${store.address}</p>
          </div>
          <label class="visited-toggle">
            <input type="checkbox" class="visited-input" ${entry.visited ? "checked" : ""} />
            Visited
          </label>
        </div>
        <div class="card-links">
          <a class="map-btn" href="${links.apple}" target="_blank" rel="noopener">Apple Maps</a>
          <a class="map-btn" href="${links.google}" target="_blank" rel="noopener">Google Maps</a>
        </div>
        <div class="card-controls">
          <div class="rating-block">
            <span class="rating-label">Rating /10</span>
            <input type="number" min="0" max="10" step="0.5" class="rating-input" placeholder="—" value="${entry.rating}" />
          </div>
          <div class="notes-block">
            <span class="notes-label">Notes</span>
            <textarea class="notes-input" placeholder="How was it?">${entry.notes}</textarea>
          </div>
        </div>
      </div>
    `;

    list.appendChild(li);
  });

  document.getElementById("full-route-link").href = buildFullRouteLink();

  updateProgress(state);
  attachHandlers();
}

function parseMinutes(durationStr) {
  const match = durationStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function formatMinutes(total) {
  if (total <= 0) return "0 min";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function updateProgress(state) {
  const visitedCount = STORES.filter(s => state[s.id] && state[s.id].visited).length;
  document.getElementById("progress-value").textContent = `${visitedCount} / ${STORES.length} visited`;

  const pct = Math.round((visitedCount / STORES.length) * 100);
  document.getElementById("progress-fill").style.width = `${pct}%`;

  const firstUnvisitedIndex = STORES.findIndex(s => !(state[s.id] && state[s.id].visited));

  // Time remaining: sum the transit legs from the first not-yet-visited stop onward.
  const remainingMinutes = firstUnvisitedIndex === -1
    ? 0
    : STORES.slice(firstUnvisitedIndex)
        .filter(s => s.leg)
        .reduce((sum, s) => sum + parseMinutes(s.leg.duration), 0);
  document.getElementById("time-remaining").textContent =
    firstUnvisitedIndex === -1 ? "All done 🎉" : `≈ ${formatMinutes(remainingMinutes)}`;

  const fab = document.getElementById("next-stop-btn");
  if (firstUnvisitedIndex === -1) {
    fab.textContent = "All 11 done 🎉";
    fab.classList.add("is-complete");
    fab.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    const nextStore = STORES[firstUnvisitedIndex];
    fab.textContent = `Next → ${nextStore.name}`;
    fab.classList.remove("is-complete");
    fab.onclick = () => {
      document.querySelector(`.stop[data-id="${nextStore.id}"]`)
        .scrollIntoView({ behavior: "smooth", block: "center" });
    };
  }
}

function attachHandlers() {
  document.querySelectorAll(".stop").forEach(li => {
    const id = li.dataset.id;
    const state = loadState();
    const entry = state[id] || { visited: false, rating: "", notes: "" };

    const visitedInput = li.querySelector(".visited-input");
    const ratingInput = li.querySelector(".rating-input");
    const notesInput = li.querySelector(".notes-input");

    visitedInput.addEventListener("change", () => {
      const s = loadState();
      s[id] = { ...(s[id] || entry), visited: visitedInput.checked };
      saveState(s);
      li.classList.toggle("is-visited", visitedInput.checked);
      updateProgress(s);
    });

    ratingInput.addEventListener("input", () => {
      const s = loadState();
      s[id] = { ...(s[id] || entry), rating: ratingInput.value };
      saveState(s);
    });

    notesInput.addEventListener("input", () => {
      const s = loadState();
      s[id] = { ...(s[id] || entry), notes: notesInput.value };
      saveState(s);
    });
  });
}

document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("Clear all visited stores, ratings, and notes? This can't be undone.")) {
    const emptyState = {};
    saveState(emptyState);
    render();
  }
});

// ---------- Boot ----------
(async function boot() {
  const code = getTripCode();
  if (!code) {
    render();
    showGate();
    return;
  }
  await initFirebase();
  if (db) {
    await syncFromCloud(code);
    listenForRemoteChanges(code);
  } else {
    setSyncStatus("Cloud sync not configured yet — saving on this device only");
  }
  render();
})();
