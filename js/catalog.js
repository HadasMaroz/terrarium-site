/* ============ TERRAR U — product catalog (admin-editable, localStorage-backed) ============ */

/* language: Hebrew pages live under /he/ and declare lang="he" */
const IS_HE = document.documentElement.lang === "he";
const PAGE_PREFIX = IS_HE ? "he/" : ""; /* every he page has <base href="../"> */

/* master plant list — products reference these by id */
const PLANTS = [
  { id: "moss", name: "Moss Mix", nameHe: "תערובת טחב", price: 0, tone: "linear-gradient(135deg,#3d5a33,#77a05e)" },
  { id: "fern", name: "Forest Fern", nameHe: "שרך יער", price: 6, tone: "linear-gradient(135deg,#2f6b3a,#9dc978)" },
  { id: "fittonia", name: "Fittonia Pink", nameHe: "פיטוניה ורודה", price: 8, tone: "linear-gradient(135deg,#4a6b3f,#d98ba7)" },
];

const DEFAULT_FIGS = [
  { id: "totoro", name: "Miniature Totoro", nameHe: "טוטורו קטן", price: 3.0 },
  { id: "hikers", name: "Tiny Hikers", nameHe: "מטיילים קטנים", price: 4.0 },
  { id: "deer", name: "Forest Deer", nameHe: "אייל יער", price: 3.5 },
  { id: "fairy", name: "Fairy House", nameHe: "בית פיות", price: 5.0 },
];

/* per-language accessors — fall back to English when a translation is missing */
function trName(x) { return (IS_HE && x.nameHe) ? x.nameHe : x.name; }
function pkind(p) { return (IS_HE && p.kindHe) ? p.kindHe : p.kind; }
function pdesc(p) { return (IS_HE && p.descHe) ? p.descHe : p.desc; }

const DEFAULT_CATALOG = [
  {
    id: "bottled-grove",
    name: "The Bottled Grove",
    nameHe: "חורשת הבקבוק",
    kind: "Corked bottle ecosystem",
    kindHe: "עולם שלם בבקבוק עם פקק",
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
    descHe: "חורשה שלמה בתוך בקבוק וינטג' עם פקק. ענף מפותל מטפס בין שרכים ופטריות קטנות, על שכבות של אבן ואדמה חיה. סוגרים אותו פעם אחת, והוא ממשיך לחיות עשרות שנים.",
  },
  {
    id: "bloom-orb",
    name: "Bloom Orb",
    nameHe: "כדור הפריחה",
    kind: "Wildflower meadow sphere",
    kindHe: "אחו פרחים בכדור זכוכית",
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
    descHe: "כדור זכוכית שנפוח ביד, ובתוכו אחו קטן מהרים גבוהים: חינניות, זכריני ופעמוני הרים סביב ענף יפה. זה הטרריום הכי אהוב עלינו, והכי צבעוני שאנחנו מכינים.",
  },
  {
    id: "terra-cube",
    name: "Terra Cube",
    nameHe: "קוביית טרה",
    kind: "Square glass forest",
    kindHe: "יער קטן בקובייה מזכוכית",
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
    descHe: "קווים נקיים ופנים פראי. קובייה מזכוכית עם מכסה משעם, שתולה בשרכים, בכרי טחב ובענף שנראה כמו בונסאי. מתאימה לשולחן עבודה, למדף או לפינה שקטה.",
  },
  {
    id: "fern-column",
    name: "The Fern Column",
    nameHe: "עמוד השרכים",
    kind: "Tall sealed jar · Cork lid",
    kindHe: "צנצנת גבוהה עם פקק",
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
    descHe: "עמוד זכוכית גבוה עם פקק, שבו שרכים ופיקוס זוחל מטפסים על גזע עץ. הוא גבוה, יפה ומסתדר לגמרי לבד. מושלם לרצפה או לקונסולה.",
  },
  {
    id: "arid-glass",
    name: "Arid Glass",
    nameHe: "זכוכית המדבר",
    kind: "Open succulent terrarium",
    kindHe: "טרריום פתוח עם סוקולנטים",
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
    descHe: "מדבר פתוח בתוך גליל שקוף: הוורתיה, אצ'ווריה וצמחי אבן על חצץ. זה הכי קל לתחזוקה: הרבה אור, טיפה מים פעם בחודש, וזהו.",
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

/* product badges, translated for the Hebrew pages */
const BADGE_HE = { Limited: "מהדורה מוגבלת", Bestseller: "הכי נמכר", New: "חדש" };
function tbadge(b) { return (IS_HE && BADGE_HE[b]) ? BADGE_HE[b] : b; }
