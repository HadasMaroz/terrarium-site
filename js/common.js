/* ============ TERRAR U — shared page runtime (header, cart, reveals) ============ */
gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* smooth scroll */
if (!prefersReduced && window.Lenis) {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* header state */
const header = document.getElementById("header");
ScrollTrigger.create({
  start: 40,
  onUpdate: (self) => header.classList.toggle("is-scrolled", self.scroll() > 40),
});
if (!prefersReduced) {
  gsap.fromTo("#header", { y: -24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out", delay: 0.1 });
}

/* cart — persisted across pages */
const CART_KEY = "terraru-cart-count";
const cartCountEl = document.getElementById("cartCount");

function cartGet() {
  return parseInt(localStorage.getItem(CART_KEY) || "0", 10) || 0;
}
function cartSet(n) {
  localStorage.setItem(CART_KEY, String(n));
  if (!cartCountEl) return;
  cartCountEl.textContent = n;
  cartCountEl.classList.toggle("is-visible", n > 0);
}
function cartAdd(label) {
  cartSet(cartGet() + 1);
  if (cartCountEl) gsap.fromTo(cartCountEl, { scale: 1.5 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
  showToast(label);
}
cartSet(cartGet());

/* toast */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

/* scroll reveals: any element with [data-reveal] */
function bindReveals(scope) {
  const els = (scope || document).querySelectorAll("[data-reveal]:not([data-revealed])");
  els.forEach((el) => el.setAttribute("data-revealed", ""));
  if (prefersReduced) {
    gsap.set(els, { opacity: 1, y: 0 });
    return;
  }
  ScrollTrigger.batch(els, {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      gsap.fromTo(batch, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out", overwrite: true }),
  });
  els.forEach((el) => gsap.set(el, { opacity: 0, y: 36 }));
}
window.addEventListener("DOMContentLoaded", () => bindReveals());
