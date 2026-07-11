/* ============ TERRAR U — checkout: summary, shipping, payment validation ============ */
const FREE_SHIP_OVER = 200;
const SHIP = { standard: 12, express: 24 };
let shipMethod = "standard";
let payMethod = "card";

const layout = document.getElementById("coLayout");
const emptyEl = document.getElementById("coEmpty");
const successEl = document.getElementById("coSuccess");

/* ---------- totals ---------- */
function shippingCost() {
  if (shipMethod === "standard" && Cart.subtotal() >= FREE_SHIP_OVER) return 0;
  return SHIP[shipMethod];
}
function grandTotal() { return Cart.subtotal() + shippingCost(); }

function renderSummary() {
  if (!Cart.items.length) {
    layout.hidden = true;
    emptyEl.hidden = false;
    return;
  }
  layout.hidden = false;
  emptyEl.hidden = true;

  document.getElementById("sumItems").innerHTML = Cart.items.map((it) => {
    const bits = [];
    if (it.plant) bits.push(`Plant: ${it.plant.name}`);
    if (it.figs && it.figs.length) bits.push(`Figurines: ${it.figs.map((f) => f.name).join(", ")}`);
    return `
    <article class="sumitem">
      <div class="sumitem__img">${it.img ? `<img src="${it.img}" alt="" />` : ""}<span class="sumitem__qty">${it.qty}</span></div>
      <div class="sumitem__info">
        <h3>${it.name}</h3>
        ${bits.length ? `<p>${bits.join(" · ")}</p>` : ""}
      </div>
      <span class="sumitem__price">${money(Cart.unitPrice(it) * it.qty)}</span>
    </article>`;
  }).join("");

  const free = shipMethod === "standard" && Cart.subtotal() >= FREE_SHIP_OVER;
  document.getElementById("stdPrice").textContent = Cart.subtotal() >= FREE_SHIP_OVER ? "Free" : money(SHIP.standard);
  document.getElementById("sumSubtotal").textContent = money(Cart.subtotal());
  document.getElementById("sumShipping").textContent = free || shippingCost() === 0 ? "Free" : money(shippingCost());
  const totalEl = document.getElementById("sumTotal");
  totalEl.textContent = money(grandTotal());
  document.getElementById("placeTotal").textContent = money(grandTotal());
  if (window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.fromTo(totalEl, { scale: 1.1 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
  }
}

/* ---------- delivery method ---------- */
document.getElementById("shipOpts").addEventListener("change", (e) => {
  shipMethod = e.target.value;
  document.querySelectorAll(".ship-opt").forEach((o) =>
    o.classList.toggle("is-checked", o.querySelector("input").checked));
  renderSummary();
});

/* ---------- payment tabs ---------- */
document.querySelectorAll(".pay-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    payMethod = tab.dataset.pay;
    document.querySelectorAll(".pay-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
    document.getElementById("payCard").hidden = payMethod !== "card";
    document.getElementById("payPaypal").hidden = payMethod !== "paypal";
  })
);
document.getElementById("paypalBtn").addEventListener("click", () =>
  showToast("Demo build — PayPal redirect is disabled here")
);

/* ---------- input formatting ---------- */
const ccNum = document.getElementById("ccNum");
const ccExp = document.getElementById("ccExp");
const ccCvc = document.getElementById("ccCvc");

ccNum.addEventListener("input", () => {
  ccNum.value = ccNum.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
});
ccExp.addEventListener("input", () => {
  let v = ccExp.value.replace(/\D/g, "").slice(0, 4);
  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
  ccExp.value = v;
});
ccCvc.addEventListener("input", () => {
  ccCvc.value = ccCvc.value.replace(/\D/g, "").slice(0, 4);
});

/* ---------- validation ---------- */
function markInvalid(el, bad) {
  el.closest(".field").classList.toggle("field--error", bad);
  return !bad;
}
function validate() {
  let ok = true;
  ok = markInvalid(document.getElementById("coEmail"), !document.getElementById("coEmail").checkValidity()) && ok;
  ["coFirst", "coLast", "coAddress", "coCity", "coZip"].forEach((id) => {
    ok = markInvalid(document.getElementById(id), !document.getElementById(id).value.trim()) && ok;
  });
  if (payMethod === "card") {
    ok = markInvalid(ccNum, ccNum.value.replace(/\s/g, "").length !== 16) && ok;
    ok = markInvalid(document.getElementById("ccName"), !document.getElementById("ccName").value.trim()) && ok;
    const m = ccExp.value.match(/^(\d{2})\/(\d{2})$/);
    const expOk = m && Number(m[1]) >= 1 && Number(m[1]) <= 12 && (Number(m[2]) > 26 || (Number(m[2]) === 26 && Number(m[1]) >= 7));
    ok = markInvalid(ccExp, !expOk) && ok;
    ok = markInvalid(ccCvc, ccCvc.value.length < 3) && ok;
  }
  return ok;
}

/* ---------- place order ---------- */
document.getElementById("coForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!Cart.items.length) return;
  if (!validate()) {
    showToast("Please check the highlighted fields");
    const firstErr = document.querySelector(".field--error input");
    if (firstErr) firstErr.focus();
    return;
  }
  const orderNum = "TU-" + String(Math.floor(1000 + (Date.now() % 9000)));
  document.getElementById("orderNum").textContent = orderNum;
  Cart.clear();
  /* success state switches immediately; the animation is decoration, not a gate */
  document.querySelector(".page-banner").style.display = "none";
  layout.hidden = true;
  successEl.hidden = false;
  if (window.gsap) gsap.fromTo(successEl, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" });
  window.scrollTo({ top: 0, behavior: "smooth" });
});

renderSummary();
