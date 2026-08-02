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

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mapsLinks(address) {
  const q = encodeURIComponent(address);
  return {
    apple: `https://maps.apple.com/?q=${q}`,
    google: `https://www.google.com/maps/search/?api=1&query=${q}`
  };
}

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

  updateProgress(state);
  attachHandlers();
}

function updateProgress(state) {
  const visitedCount = STORES.filter(s => state[s.id] && state[s.id].visited).length;
  document.getElementById("progress-value").textContent = `${visitedCount} / ${STORES.length} visited`;
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
    localStorage.removeItem(STORAGE_KEY);
    render();
  }
});

render();
