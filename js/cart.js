/* ============ TERRAR U — cart store + slide-out mini cart ============
   Global state lives in localStorage; every page gets the same drawer.
   Item shape: { key, productId, name, img, base, plant:{id,name,price}|null,
                 figs:[{id,name,price}], qty }                              */
const Cart = (() => {
  const KEY = "terraru-cart-v2";
  localStorage.removeItem("terraru-cart-count"); /* retire the old counter */

  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { items = []; }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- math ---------- */
  const unitPrice = (it) =>
    it.base + (it.plant ? it.plant.price : 0) + (it.figs || []).reduce((s, f) => s + f.price, 0);
  const count = () => items.reduce((s, i) => s + i.qty, 0);
  const subtotal = () => items.reduce((s, i) => s + unitPrice(i) * i.qty, 0);
  const keyOf = (it) =>
    [it.productId, it.plant ? it.plant.id : "", (it.figs || []).map((f) => f.id).sort().join("+")].join("|");

  /* ---------- drawer DOM (injected once per page) ---------- */
  const root = document.createElement("div");
  root.innerHTML = `
    <div class="drawer-veil" id="drawerVeil"></div>
    <aside class="drawer" id="cartDrawer" aria-label="Shopping cart" aria-hidden="true">
      <header class="drawer__head">
        <h2>Your cart <span class="drawer__count" id="drawerCount"></span></h2>
        <button class="drawer__close" id="drawerClose" aria-label="Close cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="22" height="22"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </header>
      <div class="drawer__items" id="drawerItems"></div>
      <footer class="drawer__foot" id="drawerFoot">
        <div class="drawer__subtotal"><span>Subtotal</span><span id="drawerSubtotal"></span></div>
        <p class="drawer__note">Shipping calculated at checkout · Free over $200</p>
        <a class="btn btn--buy drawer__checkout" href="checkout.html">Checkout</a>
      </footer>
    </aside>`;
  document.body.appendChild(root);

  const drawer = document.getElementById("cartDrawer");
  const veil = document.getElementById("drawerVeil");
  const itemsEl = document.getElementById("drawerItems");
  const badge = document.getElementById("cartCount");

  /* ---------- rendering ---------- */
  function configLine(it) {
    const bits = [];
    if (it.plant) bits.push(`Plant: ${it.plant.name}`);
    if (it.figs && it.figs.length) bits.push(`Figurines: ${it.figs.map((f) => f.name).join(", ")}`);
    return bits.join(" · ");
  }

  function render() {
    document.getElementById("drawerCount").textContent = count() ? `(${count()})` : "";
    document.getElementById("drawerSubtotal").textContent = money(subtotal());
    document.getElementById("drawerFoot").style.display = items.length ? "" : "none";

    if (!items.length) {
      itemsEl.innerHTML = `
        <div class="drawer__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="44" height="44"><path d="M6 7h12l-1.2 12.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3L6 7Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>
          <p>Your cart is empty.</p>
          <a class="btn btn--primary" href="shop.html">Explore the collection</a>
        </div>`;
      return;
    }

    itemsEl.innerHTML = items.map((it) => `
      <article class="citem" data-key="${it.key}">
        <div class="citem__img">${it.img ? `<img src="${it.img}" alt="" />` : `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="26" height="26"><path d="M7 21h10M9 21V11a3 3 0 0 1 6 0v10"/></svg>`}
        </div>
        <div class="citem__info">
          <h3 class="citem__name">${it.name}</h3>
          ${configLine(it) ? `<p class="citem__config">${configLine(it)}</p>` : ""}
          <div class="citem__row">
            <div class="stepper">
              <button data-step="-1" aria-label="Decrease quantity">&minus;</button>
              <span>${it.qty}</span>
              <button data-step="1" aria-label="Increase quantity">+</button>
            </div>
            <span class="citem__price">${money(unitPrice(it) * it.qty)}</span>
          </div>
        </div>
        <button class="citem__remove" data-remove aria-label="Remove ${it.name}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </article>`).join("");
  }

  function updateBadge(bump) {
    if (!badge) return;
    badge.textContent = count();
    badge.classList.toggle("is-visible", count() > 0);
    if (bump && !reduced && window.gsap) gsap.fromTo(badge, { scale: 1.5 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
  }

  function save(bump) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadge(bump);
    render();
  }

  /* ---------- open / close ---------- */
  let isOpen = false;
  function open() {
    if (isOpen) return;
    isOpen = true;
    drawer.setAttribute("aria-hidden", "false");
    veil.classList.add("is-on");
    if (!reduced && window.gsap) {
      gsap.fromTo(drawer, { xPercent: 105 }, { xPercent: 0, duration: 0.55, ease: "power3.out" });
      gsap.fromTo(".citem", { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, delay: 0.15, ease: "power2.out" });
    } else {
      drawer.style.transform = "translateX(0)";
    }
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    drawer.setAttribute("aria-hidden", "true");
    veil.classList.remove("is-on");
    if (!reduced && window.gsap) {
      gsap.to(drawer, { xPercent: 105, duration: 0.45, ease: "power3.in" });
    } else {
      drawer.style.transform = "translateX(105%)";
    }
  }

  veil.addEventListener("click", close);
  document.getElementById("drawerClose").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  const cartBtn = document.getElementById("cartBtn");
  if (cartBtn) cartBtn.addEventListener("click", open);

  /* ---------- item events (delegated) ---------- */
  itemsEl.addEventListener("click", (e) => {
    const row = e.target.closest(".citem");
    if (!row) return;
    const key = row.dataset.key;
    const stepBtn = e.target.closest("[data-step]");
    if (stepBtn) { setQty(key, Number(stepBtn.dataset.step)); return; }
    if (e.target.closest("[data-remove]")) {
      if (!reduced && window.gsap) {
        gsap.to(row, { opacity: 0, x: 40, height: 0, marginBottom: 0, duration: 0.3, ease: "power2.in", onComplete: () => removeItem(key) });
      } else removeItem(key);
    }
  });

  /* ---------- public API ---------- */
  function add(raw) {
    const key = keyOf(raw);
    const existing = items.find((i) => i.key === key);
    if (existing) existing.qty += raw.qty || 1;
    else items.push({ ...raw, key, qty: raw.qty || 1, figs: raw.figs || [], plant: raw.plant || null });
    save(true);
    open();
  }
  function setQty(key, delta) {
    const it = items.find((i) => i.key === key);
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) items = items.filter((i) => i.key !== key);
    save(false);
  }
  function removeItem(key) {
    items = items.filter((i) => i.key !== key);
    save(false);
  }
  function clear() { items = []; save(false); }

  updateBadge(false);
  render();

  return { add, setQty, remove: removeItem, clear, open, close,
    get items() { return items.map((i) => ({ ...i })); },
    count, subtotal, unitPrice };
})();
