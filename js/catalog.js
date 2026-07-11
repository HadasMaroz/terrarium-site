/* ============ TERRAR U — product catalog (admin-editable, localStorage-backed) ============ */

/* master plant list — products reference these by id */
const PLANTS = [
  { id: "moss", name: "Moss Mix", price: 0, tone: "linear-gradient(135deg,#3d5a33,#77a05e)" },
  { id: "fern", name: "Forest Fern", price: 6, tone: "linear-gradient(135deg,#2f6b3a,#9dc978)" },
  { id: "fittonia", name: "Fittonia Pink", price: 8, tone: "linear-gradient(135deg,#4a6b3f,#d98ba7)" },
];

const DEFAULT_FIGS = [
  { id: "totoro", name: "Miniature Totoro", price: 3.0 },
  { id: "hikers", name: "Tiny Hikers", price: 4.0 },
  { id: "deer", name: "Forest Deer", price: 3.5 },
  { id: "fairy", name: "Fairy House", price: 5.0 },
];

const DEFAULT_CATALOG = [
  {
    id: "bottled-grove",
    name: "The Bottled Grove",
    kind: "Corked bottle ecosystem",
    price: 259,
    stock: 6,
    img: "assets/products/p1.webp",
    badge: "Limited",
    size: "Medium",
    shape: "Cylinder",
    customizable: true,
    plants: ["moss", "fern", "fittonia"],
    figs: DEFAULT_FIGS,
    rating: 4.8,
    reviews: 24,
    desc: "A whole grove folded into a vintage corked bottle. Twisted driftwood climbs past maidenhair ferns and wild mycena mushrooms, rooted in layered stone and living soil. Sealed once, alive for decades.",
  },
  {
    id: "bloom-orb",
    name: "Bloom Orb",
    kind: "Wildflower meadow sphere",
    price: 289,
    stock: 9,
    img: "assets/products/p2.webp",
    badge: "Bestseller",
    size: "Medium",
    shape: "Globe",
    customizable: true,
    plants: ["moss", "fern", "fittonia"],
    figs: DEFAULT_FIGS,
    rating: 4.9,
    reviews: 41,
    desc: "A hand-blown glass sphere holding a miniature alpine meadow — daisies, forget-me-nots and mountain bells around a sculptural branch. Our most loved piece, and the brightest world we make.",
  },
  {
    id: "terra-cube",
    name: "Terra Cube",
    kind: "Square glass forest",
    price: 229,
    stock: 12,
    img: "assets/products/p3.webp",
    badge: "New",
    size: "Small",
    shape: "Geometric",
    customizable: true,
    plants: ["moss", "fern", "fittonia"],
    figs: DEFAULT_FIGS,
    rating: 4.7,
    reviews: 12,
    desc: "Clean lines, wild interior. A precision glass cube with a cork canopy, planted with ferns, cushion moss and a bonsai-grade driftwood spine. Made for desks, shelves and quiet corners.",
  },
  {
    id: "fern-column",
    name: "The Fern Column",
    kind: "Tall sealed jar · Cork lid",
    price: 219,
    stock: 4,
    img: "assets/products/p4.webp",
    badge: null,
    size: "Large",
    shape: "Jar",
    customizable: true,
    plants: ["moss", "fern"],
    figs: DEFAULT_FIGS.slice(0, 2),
    rating: 4.6,
    reviews: 18,
    desc: "A tall corked column where bird's-nest ferns and creeping fig climb a driftwood trunk. Vertical, sculptural, and fully self-sustaining — a statement piece for floors and consoles.",
  },
  {
    id: "arid-glass",
    name: "Arid Glass",
    kind: "Open succulent terrarium",
    price: 139,
    stock: 15,
    img: "assets/products/p5.webp",
    badge: null,
    size: "Small",
    shape: "Cylinder",
    customizable: false,
    plants: [],
    figs: [],
    rating: 4.5,
    reviews: 9,
    desc: "An open desert in a clear cylinder — haworthia, echeveria and stone-crop over mineral gravel. The easiest world to keep: bright light, a sip of water a month, nothing more.",
  },
];

/* catalog persistence: admin edits live in localStorage, defaults ship in code */
const CATALOG_KEY = "terraru-catalog-v1";

function loadCatalog() {
  try {
    const stored = JSON.parse(localStorage.getItem(CATALOG_KEY));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (e) { /* corrupted — fall back to defaults */ }
  return JSON.parse(JSON.stringify(DEFAULT_CATALOG));
}

let CATALOG = loadCatalog();

function saveCatalog(list) {
  CATALOG = list;
  localStorage.setItem(CATALOG_KEY, JSON.stringify(list));
}

function resetCatalog() {
  localStorage.removeItem(CATALOG_KEY);
  CATALOG = JSON.parse(JSON.stringify(DEFAULT_CATALOG));
}

function findProduct(id) {
  return CATALOG.find((p) => p.id === id) || CATALOG[0];
}

function money(n) {
  return "$" + (Number.isInteger(n) ? n : n.toFixed(2));
}
