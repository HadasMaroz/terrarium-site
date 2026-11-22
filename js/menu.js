/* ============ TERRAR U — mobile hamburger menu ============
   Pure class toggle: the dropdown itself is animated by CSS transitions,
   so it can never get stuck if a JS animation ticker stalls. */
(function () {
  const header = document.getElementById("header");
  const btn = document.getElementById("menuBtn");
  const nav = document.getElementById("mainNav");
  if (!header || !btn || !nav) return;

  const he = document.documentElement.lang === "he";
  const label = (open) => (open ? (he ? "סגירת תפריט" : "Close menu") : (he ? "תפריט" : "Menu"));

  function setOpen(open) {
    header.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", label(open));
  }
  const isOpen = () => header.classList.contains("menu-open");

  btn.addEventListener("click", () => setOpen(!isOpen()));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  document.addEventListener("click", (e) => { if (isOpen() && !header.contains(e.target)) setOpen(false); });

  /* the cart drawer takes over the screen — fold the menu away first */
  const cartBtn = document.getElementById("cartBtn");
  if (cartBtn) cartBtn.addEventListener("click", () => setOpen(false));

  /* leaving the phone breakpoint (rotate / resize) resets the state */
  window.matchMedia("(min-width: 621px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
})();
