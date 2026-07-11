/* ============ TERRAR U — admin: product management (localStorage-backed) ============ */
const rowsEl = document.getElementById("adminRows");
const editor = document.getElementById("editor");
const form = document.getElementById("editorForm");
let editingId = null; /* null = closed, "" = new product, otherwise product id */

/* ---------- list ---------- */
function renderTable() {
  rowsEl.innerHTML = CATALOG.map((p) => `
    <tr data-id="${p.id}">
      <td><img class="admin__thumb" src="${p.img}" alt="" /></td>
      <td>
        <strong>${p.name}</strong>
        <span class="admin__kind">${p.kind || ""}</span>
      </td>
      <td>${money(p.price)}</td>
      <td>${p.stock ?? "—"}</td>
      <td>${p.size} / ${p.shape}</td>
      <td>${p.customizable ? `<span class="admin__yes">Yes · ${(p.figs || []).length} figs</span>` : "No"}</td>
      <td class="admin__actions">
        <button class="chip" data-edit>Edit</button>
        <button class="chip chip--danger" data-del>Delete</button>
      </td>
    </tr>`).join("");
}

rowsEl.addEventListener("click", (e) => {
  const tr = e.target.closest("tr");
  if (!tr) return;
  const id = tr.dataset.id;
  if (e.target.closest("[data-edit]")) openEditor(id);
  if (e.target.closest("[data-del]")) {
    const p = findProduct(id);
    if (!confirm(`Delete "${p.name}" from the catalog?`)) return;
    saveCatalog(CATALOG.filter((x) => x.id !== id));
    renderTable();
    showToast(`${p.name} deleted`);
  }
});

/* ---------- editor ---------- */
const F = (id) => document.getElementById(id);
const customPanel = document.getElementById("customPanel");

function plantChecks(selected) {
  F("fPlants").innerHTML = PLANTS.map((pl) => `
    <label class="fig ${selected.includes(pl.id) ? "is-checked" : ""}">
      <input type="checkbox" value="${pl.id}" ${selected.includes(pl.id) ? "checked" : ""} />
      <span class="fig__name">${pl.name}</span>
      <span class="fig__price">${pl.price ? "+" + money(pl.price) : "included"}</span>
    </label>`).join("");
}

function figRow(f = { name: "", price: "" }) {
  const row = document.createElement("div");
  row.className = "editor__figrow";
  row.innerHTML = `
    <input type="text" placeholder="Figurine name" value="${f.name}" data-fig-name />
    <input type="number" placeholder="+$" min="0" step="0.5" value="${f.price}" data-fig-price />
    <button type="button" class="citem__remove" data-fig-del aria-label="Remove figurine">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M6 6l12 12M18 6 6 18"/></svg>
    </button>`;
  return row;
}

document.getElementById("addFigBtn").addEventListener("click", () => F("fFigs").appendChild(figRow()));
F("fFigs").addEventListener("click", (e) => {
  if (e.target.closest("[data-fig-del]")) e.target.closest(".editor__figrow").remove();
});
F("fPlants").addEventListener("change", (e) => {
  const label = e.target.closest(".fig");
  if (label) label.classList.toggle("is-checked", e.target.checked);
});
F("fCustomizable").addEventListener("change", () => {
  customPanel.style.display = F("fCustomizable").checked ? "" : "none";
});

function openEditor(id) {
  editingId = id;
  const p = id ? findProduct(id) : null;
  document.getElementById("editorTitle").textContent = p ? `Edit — ${p.name}` : "New product";
  F("fName").value = p ? p.name : "";
  F("fKind").value = p ? p.kind || "" : "";
  F("fPrice").value = p ? p.price : "";
  F("fStock").value = p ? p.stock ?? 10 : 10;
  F("fSize").value = p ? p.size : "Medium";
  F("fShape").value = p ? p.shape : "Jar";
  F("fImg").value = p ? p.img : "assets/products/p1.webp";
  F("fBadge").value = p ? p.badge || "" : "";
  F("fDesc").value = p ? p.desc || "" : "";
  F("fCustomizable").checked = p ? !!p.customizable : true;
  customPanel.style.display = F("fCustomizable").checked ? "" : "none";
  plantChecks(p ? p.plants || [] : ["moss", "fern", "fittonia"]);
  F("fFigs").innerHTML = "";
  (p ? p.figs || [] : DEFAULT_FIGS).forEach((f) => F("fFigs").appendChild(figRow(f)));
  editor.hidden = false;
  if (window.gsap) gsap.fromTo(editor, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeEditor() {
  editingId = null;
  editor.hidden = true;
}

document.getElementById("newBtn").addEventListener("click", () => openEditor(""));
document.getElementById("cancelBtn").addEventListener("click", closeEditor);

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset the catalog to the built-in defaults? Your edits will be lost.")) return;
  resetCatalog();
  renderTable();
  closeEditor();
  showToast("Catalog reset to defaults");
});

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = F("fName").value.trim();
  const price = parseFloat(F("fPrice").value);
  if (!name || isNaN(price) || price < 0) {
    showToast("Name and a valid base price are required");
    return;
  }
  const figs = [...F("fFigs").querySelectorAll(".editor__figrow")]
    .map((row) => ({
      name: row.querySelector("[data-fig-name]").value.trim(),
      price: parseFloat(row.querySelector("[data-fig-price]").value) || 0,
    }))
    .filter((f) => f.name)
    .map((f) => ({ ...f, id: slugify(f.name) }));

  const data = {
    name,
    kind: F("fKind").value.trim(),
    price,
    stock: parseInt(F("fStock").value, 10) || 0,
    size: F("fSize").value,
    shape: F("fShape").value,
    img: F("fImg").value,
    badge: F("fBadge").value.trim() || null,
    desc: F("fDesc").value.trim(),
    customizable: F("fCustomizable").checked,
    plants: F("fCustomizable").checked
      ? [...F("fPlants").querySelectorAll("input:checked")].map((i) => i.value)
      : [],
    figs: F("fCustomizable").checked ? figs : [],
  };

  const list = [...CATALOG];
  if (editingId) {
    const idx = list.findIndex((p) => p.id === editingId);
    list[idx] = { ...list[idx], ...data };
  } else {
    let id = slugify(name);
    while (list.some((p) => p.id === id)) id += "-2";
    list.push({ id, rating: 5.0, reviews: 0, ...data });
  }
  saveCatalog(list);
  renderTable();
  closeEditor();
  showToast(`${name} saved`);
});

renderTable();
