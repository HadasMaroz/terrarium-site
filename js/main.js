/* ============ TERRAR U — main.js ============ */
gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Smooth scroll (Lenis) ---------- */
if (!prefersReduced) {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Scroll-bound image sequence player ---------- */
const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700 && window.innerWidth < 820;

function makeSeqPlayer(canvas, dir, frameCount, fit = "cover") {
  const ctx = canvas.getContext("2d");
  const images = new Array(frameCount).fill(null);
  const state = { frame: 0, blend: 0 }; /* blend: 0 = bottom-anchored, 1 = fullscreen cover */
  let loadedCount = 0;

  const frameSrc = (i) => `${dir}/f_${String(i + 1).padStart(4, "0")}.webp`;

  function loadFrame(i) {
    return new Promise((resolve) => {
      if (images[i]) return resolve();
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => {
        images[i] = img;
        loadedCount++;
        if (i === Math.round(state.frame)) render();
        resolve();
      };
      img.src = frameSrc(i);
    });
  }

  async function loadRange(from, to, batchSize = 12) {
    for (let b = from; b < to; b += batchSize) {
      await Promise.all(
        Array.from({ length: Math.min(batchSize, to - b) }, (_, k) => loadFrame(b + k))
      );
    }
  }

  function nearestLoaded(target) {
    for (let i = target; i >= 0; i--) if (images[i]) return images[i];
    for (let i = target + 1; i < frameCount; i++) if (images[i]) return images[i];
    return null;
  }

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    render();
  }

  function render() {
    const img = nearestLoaded(Math.round(state.frame));
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    ctx.clearRect(0, 0, cw, ch);
    const coverScale = Math.max(cw / iw, ch / ih);
    if (fit === "bottom") {
      /* mobile hero: bottom-anchored at rest, expands to fullscreen as blend → 1 */
      const bScale = (cw / iw) * 1.4;
      const t = Math.min(1, Math.max(0, state.blend));
      const scale = bScale + (coverScale - bScale) * t;
      const dw = iw * scale, dh = ih * scale;
      const x = (cw - dw) / 2;
      const yBottom = ch - dh, yCover = (ch - dh) / 2;
      ctx.drawImage(img, x, yBottom + (yCover - yBottom) * t, dw, dh);
    } else {
      const dw = iw * coverScale, dh = ih * coverScale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }
  }

  window.addEventListener("resize", sizeCanvas);
  sizeCanvas();

  return { state, frameCount, render, loadFrame, loadRange, getLoaded: () => loadedCount };
}

/* ---------- Hero sequence ---------- */
const HERO_FRAMES = 121;
const hero = makeSeqPlayer(
  document.getElementById("seqCanvas"),
  isSmall ? "assets/seq3-sm" : "assets/seq3-lg",
  HERO_FRAMES,
  isSmall ? "bottom" : "cover"
);

const loaderEl = document.getElementById("loader");
const loaderFill = document.getElementById("loaderFill");
const loaderPct = document.getElementById("loaderPct");
const GATE_COUNT = Math.min(40, HERO_FRAMES);

(async () => {
  let shown = 0;
  const tick = setInterval(() => {
    const pct = Math.min(100, Math.round((hero.getLoaded() / GATE_COUNT) * 100));
    if (pct !== shown) {
      shown = pct;
      loaderFill.style.width = pct + "%";
      loaderPct.textContent = pct + "%";
    }
    if (pct >= 100) clearInterval(tick);
  }, 80);
  await hero.loadRange(0, GATE_COUNT);
  loaderEl.classList.add("is-done");
  introReveal();
  await hero.loadRange(GATE_COUNT, HERO_FRAMES);
})();

/* ---------- Hero scroll timeline ---------- */
if (!prefersReduced) {
  gsap.to(hero.state, {
    frame: HERO_FRAMES - 1,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
    },
    onUpdate: hero.render,
  });

  /* text stages: one master timeline (duration 1) mapped onto the hero scroll distance */
  const stages = [
    /* mobile: the intro copy clears out immediately so the terrarium can take the screen */
    { el: ".hero__stage--1", enter: 0.00, exit: isSmall ? 0.09 : 0.24, holdIn: true },
    { el: ".hero__stage--2", enter: 0.34, exit: 0.62 },
    { el: ".hero__stage--3", enter: 0.72, exit: 1.00, holdOut: true },
  ];

  const stageTl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.3,
    },
  });
  stageTl.set({}, {}, 1); // pin timeline duration to exactly 1

  stages.forEach(({ el, enter, exit, holdIn, holdOut }) => {
    const node = document.querySelector(el);
    gsap.set(node, { autoAlpha: holdIn ? 1 : 0 });
    const fade = (exit - enter) * 0.35;
    if (!holdIn) {
      stageTl.fromTo(node, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: fade }, enter);
    }
    if (!holdOut) {
      stageTl.to(node, { autoAlpha: 0, y: holdIn ? -60 : -40, duration: fade }, exit - fade);
    }
  });

  /* mobile: as the copy clears, the terrarium grows from bottom-anchored to fullscreen */
  if (isSmall) {
    stageTl.fromTo(hero.state, { blend: 0 },
      { blend: 1, duration: 0.10, ease: "power1.inOut", onUpdate: hero.render }, 0.03);
  }

  /* scroll hint: fade out immediately */
  gsap.to("#scrollHint", {
    autoAlpha: 0,
    scrollTrigger: { trigger: ".hero", start: "top top", end: "8% top", scrub: true },
  });

  /* collection head emerges from the same mist the hero dissolved into */
  gsap.fromTo(".collection__head > *",
    { autoAlpha: 0, y: 46, filter: "blur(6px)" },
    {
      autoAlpha: 1, y: 0, filter: "blur(0px)",
      stagger: 0.18, ease: "power2.out",
      scrollTrigger: { trigger: ".collection", start: "top 99%", end: "top 62%", scrub: 0.4 },
    });
}

/* intro reveal once the loader gate opens */
function introReveal() {
  if (prefersReduced) return;
  gsap.fromTo(
    ".hero__stage--1 .reveal-line",
    { yPercent: 60, autoAlpha: 0 },
    { yPercent: 0, autoAlpha: 1, duration: 1.2, stagger: 0.12, ease: "power3.out", delay: 0.25 }
  );
  gsap.fromTo("#header", { y: -30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, delay: 0.6, ease: "power2.out" });
}

/* ---------- Header state ---------- */
const header = document.getElementById("header");
ScrollTrigger.create({
  start: 60,
  onUpdate: (self) => header.classList.toggle("is-scrolled", self.scroll() > 60),
});

/* ---------- Bloom bridge: flowers grow with the scroll, out of black and back into it ---------- */
const BLOOM_FRAMES = 300;
const BLOOM_START_FRAME = 45; /* the first ~1.5s of the timelapse is near-empty black */
const bloom = makeSeqPlayer(
  document.getElementById("bloomCanvas"),
  isSmall ? "assets/seq4-sm" : "assets/seq4-lg",
  BLOOM_FRAMES
);
bloom.state.frame = BLOOM_START_FRAME;

ScrollTrigger.create({
  trigger: ".bloom",
  start: "top 220%",
  once: true,
  onEnter: () => bloom.loadRange(BLOOM_START_FRAME, BLOOM_FRAMES),
});

/* quote halves: split into characters for a typewriter reveal */
document.querySelectorAll(".bloom__quote").forEach((q) => {
  q.innerHTML = q.textContent
    .trim()
    .split("")
    .map((c) => (/\s/.test(c) ? c : `<span class="tch">${c}</span>`))
    .join("");
});

if (!prefersReduced) {
  gsap.fromTo(bloom.state,
    { frame: BLOOM_START_FRAME },
    {
      frame: BLOOM_FRAMES - 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".bloom",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
      },
      onUpdate: bloom.render,
    });

  const bloomTl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".bloom",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.3,
    },
  });
  bloomTl.set({}, {}, 1);
  /* no entry fade — the buds are already on screen as the section arrives */
  gsap.set(".bloom__fade", { opacity: 0 });
  bloomTl.to(".bloom__fade", { opacity: 1, duration: 0.06 }, 0.94); /* soft exit fade */

  /* typewriter: characters land one by one, tied to the scroll */
  const typeQuote = (sel, from, to) => {
    const chars = document.querySelectorAll(sel + " .tch");
    bloomTl.fromTo(chars,
      { opacity: 0 },
      { opacity: 1, duration: 0.002, stagger: (to - from) / chars.length },
      from);
  };
  typeQuote(".bloom__quote--left", 0.07, 0.44);  /* types while the buds rise */
  typeQuote(".bloom__quote--right", 0.52, 0.90); /* types while the flowers open */
}

/* ---------- Craft: hexagon sequence + mist text reveal ---------- */
const CRAFT_FRAMES = 268;
const craft = makeSeqPlayer(
  document.getElementById("craftCanvas"),
  isSmall ? "assets/seq2-sm" : "assets/seq2-lg",
  CRAFT_FRAMES
);

/* start loading only when the section approaches the viewport */
ScrollTrigger.create({
  trigger: ".craft",
  start: "top 250%",
  once: true,
  onEnter: () => craft.loadRange(0, CRAFT_FRAMES),
});

/* split craft text: title → chars, description → words */
document.querySelectorAll(".craft__stage").forEach((stage) => {
  const title = stage.querySelector(".craft__title");
  const desc = stage.querySelector(".craft__desc");
  if (!title || !desc) return; /* the about stage animates as blocks */
  title.innerHTML = title.textContent
    .split("")
    .map((c) => (c === " " ? " " : `<span class="ch">${c}</span>`))
    .join("");
  desc.innerHTML = desc.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="wd">${w}</span>`)
    .join(" ");
});

if (!prefersReduced) {
  gsap.to(craft.state, {
    frame: CRAFT_FRAMES - 1,
    ease: "none",
    scrollTrigger: {
      trigger: ".craft",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
    },
    onUpdate: craft.render,
  });

  /* three stages emerge from mist inside the hexagon */
  const craftTl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".craft",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.35,
    },
  });
  craftTl.set({}, {}, 1); // pin timeline duration to exactly 1

  const windows = [
    { enter: 0.05, exit: 0.26 },
    { enter: 0.31, exit: 0.52 },
    { enter: 0.57, exit: 0.76 },
    { enter: 0.82, exit: 1.00, holdOut: true }, /* the maker, revealed at journey's end */
  ];

  document.querySelectorAll(".craft__stage").forEach((stage, i) => {
    const { enter, exit, holdOut } = windows[i];
    const inDur = (exit - enter) * 0.42;
    const outDur = (exit - enter) * 0.3;

    craftTl.set(stage, { visibility: "visible" }, enter);

    if (stage.classList.contains("craft__stage--about")) {
      /* about: text and portrait drift in from opposite sides of the mist */
      craftTl.fromTo(stage.querySelector(".about__text"),
        { autoAlpha: 0, x: -56, filter: "blur(9px)" },
        { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: inDur, ease: "power2.out" }, enter);
      craftTl.fromTo(stage.querySelector(".about__media"),
        { autoAlpha: 0, x: 56, scale: 0.92, filter: "blur(9px)" },
        { autoAlpha: 1, x: 0, scale: 1, filter: "blur(0px)", duration: inDur, ease: "power2.out" }, enter + inDur * 0.25);
    } else {
      const chars = stage.querySelectorAll(".ch");
      const words = stage.querySelectorAll(".wd");
      const num = stage.querySelector(".craft__num");

      /* number: slow fade with letter-spacing settle */
      craftTl.fromTo(num,
        { opacity: 0, letterSpacing: "1.1em" },
        { opacity: 1, letterSpacing: "0.5em", duration: inDur }, enter);

      /* title: letters condense out of blur, one by one */
      craftTl.fromTo(chars,
        { opacity: 0, filter: "blur(16px)", y: 22, scale: 1.12 },
        { opacity: 1, filter: "blur(0px)", y: 0, scale: 1, duration: inDur * 0.8, stagger: inDur * 0.035 }, enter);

      /* description: words surface gradually with a soft haze */
      craftTl.fromTo(words,
        { opacity: 0, filter: "blur(7px)" },
        { opacity: 1, filter: "blur(0px)", duration: inDur * 0.55, stagger: inDur * 0.018 }, enter + inDur * 0.45);
    }

    if (!holdOut) {
      craftTl.to(stage, { opacity: 0, filter: "blur(12px)", y: -26, duration: outDur }, exit - outDur);
      craftTl.set(stage, { visibility: "hidden" }, exit);
    }
  });
} else {
  craft.loadFrame(0);
}

/* ---------- Products ---------- */
const PRODUCTS = [
  { id: 1, name: "The Bottled Grove", kind: "Corked bottle ecosystem", price: 259, img: "assets/products/p1.webp", badge: "Limited" },
  { id: 2, name: "Bloom Orb", kind: "Wildflower meadow sphere", price: 289, img: "assets/products/p2.webp", badge: "Bestseller" },
  { id: 3, name: "Terra Cube", kind: "Square glass forest", price: 229, img: "assets/products/p3.webp", badge: "New" },
];

const grid = document.getElementById("productGrid");
grid.innerHTML = PRODUCTS.map(
  (p) => `
  <article class="card" data-id="${p.id}">
    <div class="card__media">
      <img src="${p.img}" alt="${p.name} — glass terrarium" />
      <span class="card__shine" aria-hidden="true"></span>
      ${p.badge ? `<span class="card__badge">${p.badge}</span>` : ""}
      <button class="card__cart" type="button" data-add="${p.id}" aria-label="Add ${p.name} to cart">
        <svg class="card__cart-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22"><path d="M12 5v14M5 12h14"/></svg>
        <svg class="card__cart-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
      </button>
    </div>
    <div class="card__body">
      <div>
        <h3 class="card__name">${p.name}</h3>
        <p class="card__kind">${p.kind}</p>
      </div>
      <span class="card__price">$${p.price}</span>
    </div>
  </article>`
).join("");

/* cards: curtain clip-path reveal + counter-zoom + glass shine sweep */
function revealCards(batch) {
  batch.forEach((card, i) => {
    const img = card.querySelector("img");
    const shine = card.querySelector(".card__shine");
    const body = card.querySelector(".card__body");
    const tl = gsap.timeline({
      delay: i * 0.18,
      onComplete: () => {
        gsap.set(card, { clearProps: "transform,clipPath" });
        gsap.set(img, { clearProps: "transform,filter" });
      },
    });
    tl.set(card, { opacity: 1 }, 0)
      .fromTo(card,
        { clipPath: "inset(100% 0% 0% 0%)", y: 90, rotateY: -9, transformOrigin: "50% 100%" },
        { clipPath: "inset(0% 0% 0% 0%)", y: 0, rotateY: 0, duration: 1.15, ease: "power4.out" }, 0)
      .fromTo(img,
        { scale: 1.45, filter: "saturate(0.35) brightness(0.65)" },
        { scale: 1, filter: "saturate(1) brightness(1)", duration: 1.4, ease: "power3.out" }, 0)
      .fromTo(shine, { xPercent: -170 }, { xPercent: 170, duration: 0.9, ease: "power2.inOut" }, 0.4)
      .fromTo(body, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.5);
  });
}

if (!prefersReduced) {
  ScrollTrigger.batch(".card", {
    start: "top 85%",
    once: true,
    onEnter: revealCards,
  });
} else {
  gsap.set(".card", { opacity: 1, y: 0 });
}

/* ---------- Cart ---------- */
let cartTotal = 0;
const cartCount = document.getElementById("cartCount");
const toast = document.getElementById("toast");
let toastTimer;

grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  const product = PRODUCTS.find((p) => p.id === Number(btn.dataset.add));
  btn.classList.add("is-added");
  setTimeout(() => btn.classList.remove("is-added"), 1400);
  cartTotal++;
  cartCount.textContent = cartTotal;
  cartCount.classList.add("is-visible");
  gsap.fromTo(cartCount, { scale: 1.5 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });

  toast.textContent = `${product.name} added to cart`;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
});
