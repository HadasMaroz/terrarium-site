/* ============ TERRAR U — shop page: filters, sort, grid ============ */
const state = { size: "All", shape: "All", sort: "featured" };

const TS = IS_HE
  ? { tag: "ניתן להתאמה אישית עם דמויות וצמחים", customize: "התאמה אישית ←", view: "לצפייה ←",
      world: "עולם אחד", worlds: "עולמות", empty: "אין עולמות שמתאימים לסינון — נסו להרחיב אותו.",
      addLabel: (n) => `הוספת ${n} לעגלה` }
  : { tag: "Customizable with figurines &amp; plants", customize: "Customize &rarr;", view: "View options &rarr;",
      world: "world", worlds: "worlds", empty: "No worlds match this filter — try widening it.",
      addLabel: (n) => `Add ${n} to cart` };

const grid = document.getElementById("shopGrid");
const countEl = document.getElementById("shopCount");
const emptyEl = document.getElementById("shopEmpty");

function cardHTML(p) {
  return `
  <article class="card card--link" data-id="${p.id}" tabindex="0" role="link" aria-label="${trName(p)}, $${p.price}">
    <div class="card__media">
      <img src="${p.img}" alt="${trName(p)}" />
      <span class="card__shine" aria-hidden="true"></span>
      ${p.badge ? `<span class="card__badge">${tbadge(p.badge)}</span>` : ""}
      ${p.customizable ? `<span class="card__tag">${TS.tag}</span>` : ""}
      <button class="card__cart" type="button" data-add="${p.id}" aria-label="${TS.addLabel(trName(p))}">
        <svg class="card__cart-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22"><path d="M12 5v14M5 12h14"/></svg>
        <svg class="card__cart-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
      </button>
    </div>
    <div class="card__body">
      <div>
        <h3 class="card__name">${trName(p)}</h3>
        <p class="card__kind">${pkind(p)}</p>
        <span class="card__cta">${p.customizable ? TS.customize : TS.view}</span>
      </div>
      <span class="card__price">$${p.price}</span>
    </div>
  </article>`;
}

function currentList() {
  let list = CATALOG.filter(
    (p) => (state.size === "All" || p.size === state.size) && (state.shape === "All" || p.shape === state.shape)
  );
  if (state.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  return list;
}

function renderGrid() {
  const list = currentList();
  grid.innerHTML = list.map(cardHTML).join("");
  countEl.textContent = list.length ? `${list.length} ${list.length === 1 ? TS.world : TS.worlds}` : "";
  emptyEl.textContent = TS.empty;
  emptyEl.hidden = list.length > 0;
  if (!prefersReduced) {
    gsap.fromTo(grid.children, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: "power2.out", overwrite: true });
  } else {
    gsap.set(grid.children, { opacity: 1 });
  }
}

/* filter chips */
document.querySelectorAll(".filterbar__group[data-filter]").forEach((group) => {
  group.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    group.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    state[group.dataset.filter] = chip.dataset.value;
    renderGrid();
  });
});

document.getElementById("sortSelect").addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderGrid();
});

/* card interactions: navigate, or quick-add via the round button */
grid.addEventListener("click", (e) => {
  const addBtn = e.target.closest("[data-add]");
  if (addBtn) {
    e.stopPropagation();
    const p = findProduct(addBtn.dataset.add);
    addBtn.classList.add("is-added");
    setTimeout(() => addBtn.classList.remove("is-added"), 1400);
    Cart.add({ productId: p.id, name: trName(p), img: p.img, base: p.price });
    return;
  }
  const card = e.target.closest(".card--link");
  if (card) window.location.href = `${PAGE_PREFIX}product.html?id=${card.dataset.id}`;
});
grid.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const card = e.target.closest(".card--link");
  if (card) window.location.href = `${PAGE_PREFIX}product.html?id=${card.dataset.id}`;
});

renderGrid();
