/* ============ TERRAR U — product page: customization + dynamic price ============ */
const product = findProduct(new URLSearchParams(location.search).get("id"));

const PLANTS = [
  { id: "moss", name: "Moss Mix", price: 0, tone: "linear-gradient(135deg,#3d5a33,#77a05e)" },
  { id: "fern", name: "Forest Fern", price: 6, tone: "linear-gradient(135deg,#2f6b3a,#9dc978)" },
  { id: "fittonia", name: "Fittonia Pink", price: 8, tone: "linear-gradient(135deg,#4a6b3f,#d98ba7)" },
];

const FIGS = [
  { id: "totoro", name: "Miniature Totoro", price: 3.0 },
  { id: "hikers", name: "Tiny Hikers", price: 4.0 },
  { id: "deer", name: "Forest Deer", price: 3.5 },
  { id: "fairy", name: "Fairy House", price: 5.0 },
];

const sel = { plant: PLANTS[0], figs: new Set() };

/* fill static info */
document.title = `${product.name} — Terrar U`;
document.getElementById("crumbName").textContent = product.name;
document.getElementById("pImg").src = product.img;
document.getElementById("pImg").alt = `${product.name} — glass terrarium`;
document.getElementById("pKind").textContent = product.kind;
document.getElementById("pName").textContent = product.name;
document.getElementById("pDesc").textContent = product.desc;
document.getElementById("pReviews").textContent = `${product.rating} · ${product.reviews} reviews`;
document.getElementById("pCustomTag").hidden = !product.customizable;

/* stars */
const starsEl = document.getElementById("pStars");
starsEl.setAttribute("aria-label", `Rated ${product.rating} out of 5`);
starsEl.innerHTML = Array.from({ length: 5 }, (_, i) => {
  const fill = Math.max(0, Math.min(1, product.rating - i));
  return `<span class="star"><span class="star__fill" style="width:${fill * 100}%">★</span>★</span>`;
}).join("");

/* customization UI (hidden entirely for non-customizable pieces) */
const plantOpt = document.getElementById("plantOpt");
const figOpt = document.getElementById("figOpt");

if (product.customizable) {
  document.getElementById("plantSwatches").innerHTML = PLANTS.map(
    (pl, i) => `
    <label class="swatch">
      <input type="radio" name="plant" value="${pl.id}" ${i === 0 ? "checked" : ""} />
      <span class="swatch__dot" style="background:${pl.tone}"></span>
      <span class="swatch__name">${pl.name}</span>
      <span class="swatch__price">${pl.price ? "+$" + pl.price.toFixed(2) : "included"}</span>
    </label>`
  ).join("");

  document.getElementById("figGrid").innerHTML = FIGS.map(
    (f) => `
    <label class="fig">
      <input type="checkbox" value="${f.id}" />
      <span class="fig__name">${f.name}</span>
      <span class="fig__price">+$${f.price.toFixed(2)}</span>
    </label>`
  ).join("");

  plantOpt.addEventListener("change", (e) => {
    sel.plant = PLANTS.find((p) => p.id === e.target.value) || PLANTS[0];
    updateTotal();
  });
  figOpt.addEventListener("change", (e) => {
    const f = FIGS.find((x) => x.id === e.target.value);
    if (!f) return;
    e.target.checked ? sel.figs.add(f) : sel.figs.delete(f);
    e.target.closest(".fig").classList.toggle("is-checked", e.target.checked);
    updateTotal();
  });
} else {
  plantOpt.remove();
  figOpt.remove();
}

/* dynamic total */
const totalEl = document.getElementById("pTotal");
function currentTotal() {
  let t = product.price;
  if (product.customizable) {
    t += sel.plant.price;
    sel.figs.forEach((f) => (t += f.price));
  }
  return t;
}
function updateTotal() {
  const t = currentTotal();
  totalEl.textContent = "$" + (Number.isInteger(t) ? t : t.toFixed(2));
  if (!prefersReduced) gsap.fromTo(totalEl, { scale: 1.12 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)" });
}
totalEl.textContent = "$" + product.price;

/* add to cart */
document.getElementById("addBtn").addEventListener("click", () => {
  const extras = product.customizable
    ? [sel.plant.name, ...[...sel.figs].map((f) => f.name)].join(", ")
    : "";
  cartAdd(`${product.name}${extras ? " · " + extras : ""} — $${currentTotal().toFixed(2)}`);
});

/* cross-sells */
document.querySelectorAll("[data-cross]").forEach((btn) =>
  btn.addEventListener("click", () => cartAdd(`${btn.dataset.cross} added to cart`))
);

/* entrance */
if (!prefersReduced) {
  gsap.fromTo(".product__media", { opacity: 0, x: -36 }, { opacity: 1, x: 0, duration: 1, ease: "power3.out", delay: 0.15 });
  gsap.fromTo(".product__info > *", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.25 });
}
