/* ============ TERRAR U — product page: customization + dynamic price ============ */
const product = findProduct(new URLSearchParams(location.search).get("id"));

/* per-product option lists come from the catalog (admin-editable) */
const plantOptions = (product.plants || []).map((id) => PLANTS.find((p) => p.id === id)).filter(Boolean);
const figOptions = product.figs || [];

const sel = { plant: plantOptions[0] || null, figs: new Set() };

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
const showPlants = product.customizable && plantOptions.length > 0;
const showFigs = product.customizable && figOptions.length > 0;

if (showPlants) {
  document.getElementById("plantSwatches").innerHTML = plantOptions.map(
    (pl, i) => `
    <label class="swatch">
      <input type="radio" name="plant" value="${pl.id}" ${i === 0 ? "checked" : ""} />
      <span class="swatch__dot" style="background:${pl.tone}"></span>
      <span class="swatch__name">${pl.name}</span>
      <span class="swatch__price">${pl.price ? "+" + money(pl.price) : "included"}</span>
    </label>`
  ).join("");
  plantOpt.addEventListener("change", (e) => {
    sel.plant = plantOptions.find((p) => p.id === e.target.value) || plantOptions[0];
    updateTotal();
  });
} else plantOpt.remove();

if (showFigs) {
  document.getElementById("figGrid").innerHTML = figOptions.map(
    (f) => `
    <label class="fig">
      <input type="checkbox" value="${f.id}" />
      <span class="fig__name">${f.name}</span>
      <span class="fig__price">+${money(f.price)}</span>
    </label>`
  ).join("");
  figOpt.addEventListener("change", (e) => {
    const f = figOptions.find((x) => x.id === e.target.value);
    if (!f) return;
    e.target.checked ? sel.figs.add(f) : sel.figs.delete(f);
    e.target.closest(".fig").classList.toggle("is-checked", e.target.checked);
    updateTotal();
  });
} else figOpt.remove();

/* dynamic total */
const totalEl = document.getElementById("pTotal");
function currentTotal() {
  let t = product.price;
  if (sel.plant && showPlants) t += sel.plant.price;
  sel.figs.forEach((f) => (t += f.price));
  return t;
}
function updateTotal() {
  totalEl.textContent = money(currentTotal());
  if (!prefersReduced) gsap.fromTo(totalEl, { scale: 1.12 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)" });
}
totalEl.textContent = money(product.price);

/* add to cart — carries the full configuration into the cart state */
document.getElementById("addBtn").addEventListener("click", () => {
  Cart.add({
    productId: product.id,
    name: product.name,
    img: product.img,
    base: product.price,
    plant: showPlants && sel.plant ? { id: sel.plant.id, name: sel.plant.name, price: sel.plant.price } : null,
    figs: [...sel.figs].map((f) => ({ id: f.id, name: f.name, price: f.price })),
  });
});

/* cross-sells */
document.querySelectorAll("[data-cross]").forEach((btn) =>
  btn.addEventListener("click", () => {
    Cart.add({
      productId: "extra-" + btn.dataset.cross.toLowerCase().replace(/\s+/g, "-"),
      name: btn.dataset.cross,
      img: null,
      base: Number(btn.dataset.price || 0),
    });
  })
);

/* entrance */
if (!prefersReduced) {
  gsap.fromTo(".product__media", { opacity: 0, x: -36 }, { opacity: 1, x: 0, duration: 1, ease: "power3.out", delay: 0.15 });
  gsap.fromTo(".product__info > *", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.25 });
}
