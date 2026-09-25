// Init, render katalog, filter, drawer keranjang, dan checkout.

import { config, products } from "../config.js";
import { batchStatus, batchStripText, formatDate, msUntilNextChange } from "./batch.js";
import { createCart, MAX_QTY } from "./cart.js";
import { formatRupiah, makePoCode, openWhatsApp, orderMessage, waitlistMessage, waLink } from "./whatsapp.js";

const { batch, categories } = config;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

const catalog = validateConfig();
const byId = new Map(catalog.map((p) => [p.id, p]));
const cart = createCart({ batchCode: batch.code, isValidId: (id) => byId.has(id) });

let status = batchStatus(batch);
let filter = readFilter();
let view = "cart";

const wall = $("#wall");
const drawer = $("#drawer");
const fName = $("#f-name");
const fCity = $("#f-city");

// ---------- Validasi config ----------

function validateConfig() {
  const warn = (msg) => console.warn(`[config.js] ${msg}`);
  const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

  if (!/^[1-9]\d{7,14}$/.test(config.whatsapp || "")) {
    warn(`whatsapp "${config.whatsapp}" belum valid. Pakai format internasional tanpa + dan tanpa 0 di depan, misalnya 6281234567890.`);
  }
  if (!(config.price > 0)) warn("price wajib diisi dengan angka rupiah.");
  for (const key of ["name", "code", "closesAt"]) {
    if (!batch[key]) warn(`batch.${key} wajib diisi.`);
  }
  for (const key of ["opensAt", "closesAt"]) {
    if (batch[key] && !isDate(batch[key])) warn(`batch.${key} harus berformat YYYY-MM-DD.`);
  }
  for (const [key, c] of Object.entries(categories)) {
    for (const field of ["label", "size", "ratio", "width"]) {
      if (!c?.[field]) warn(`categories.${key}.${field} wajib diisi.`);
    }
  }

  const seen = new Set();
  return products.filter((p, i) => {
    const where = `products[${i}]${p?.id ? ` "${p.id}"` : ""}`;
    const missing = ["id", "name", "category", "image"].filter((key) => !p?.[key]);
    if (missing.length) {
      warn(`${where}: field wajib kosong (${missing.join(", ")}). Produk dilewati.`);
      return false;
    }
    if (!Object.hasOwn(categories, p.category)) {
      warn(`${where}: kategori "${p.category}" tidak dikenal. Pilihan: ${Object.keys(categories).join(", ")}. Produk dilewati.`);
      return false;
    }
    if (seen.has(p.id)) {
      warn(`${where}: id duplikat. Produk dilewati.`);
      return false;
    }
    seen.add(p.id);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id)) warn(`${where}: id sebaiknya kebab-case, misalnya "court-line".`);
    if (typeof p.visible !== "boolean") warn(`${where}: visible belum diisi, jadi produk tidak ditampilkan.`);
    return p.visible === true;
  });
}

// ---------- Utilitas ----------

const categoryOf = (p) => categories[p.category];
const widthOf = (p) => Number(categoryOf(p).width) || 1;

function ratioOf(p) {
  const [w, h] = String(categoryOf(p).ratio).split("/").map(Number);
  return w > 0 && h > 0 ? [w, h] : [2, 3];
}

function announce(msg) {
  const el = drawer.open ? $("#drawer-announcer") : $("#announcer");
  el.textContent = "";
  setTimeout(() => (el.textContent = msg), 50);
}

function track(event) {
  try {
    window.plausible?.(event);
    window.gtag?.("event", event);
  } catch {
    // Analytics tidak boleh mengganggu checkout.
  }
}

// Kalau varian srcset (misalnya 1600 px) belum diunggah, jatuh ke src biasa.
function dropSrcsetOnError(img) {
  img.addEventListener("error", () => img.removeAttribute("srcset"), { once: true });
}

// ---------- Motion ----------

// Elemen memudar masuk saat pertama kali terlihat. Dengan reduced motion semuanya langsung tampil.
const revealer = reducedMotion.matches
  ? null
  : new IntersectionObserver(onReveal, { rootMargin: "0px 0px -10% 0px" });

function onReveal(entries) {
  let i = 0;
  // Urut dari atas ke bawah; kartu dalam satu baris tetap kiri ke kanan (sort stabil).
  entries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
  for (const { target, isIntersecting, boundingClientRect } of entries) {
    if (!isIntersecting && boundingClientRect.top > 0) continue;
    // Yang terlihat bersamaan (misalnya satu baris kartu) muncul bergiliran.
    target.style.setProperty("--delay", `${Math.min(i++, 5) * 80}ms`);
    target.classList.add("is-in");
    revealer.unobserve(target);
  }
}

// Konten statis yang sudah di layar mungkin sudah tergambar, jadi tidak dianimasikan supaya tidak berkedip.
function initReveal() {
  if (!revealer) return;
  for (const el of $$(".reveal")) {
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-in");
    else revealer.observe(el);
  }
  document.documentElement.classList.add("motion");
}

// ---------- Status batch ----------

function refreshStatus() {
  const next = batchStatus(batch);
  if (next !== status) {
    status = next;
    renderStatus();
  }
  return status;
}

function scheduleStatusCheck() {
  const ms = msUntilNextChange(batch);
  // setTimeout maksimal ~24,8 hari; di luar itu cukup dicek saat tab aktif lagi.
  if (ms > 0 && ms < 2 ** 31 - 1) {
    setTimeout(() => {
      refreshStatus();
      scheduleStatusCheck();
    }, ms);
  }
}

function renderStatus() {
  $("#batch-strip").textContent = batchStripText(batch, status);
  $$("[data-waitlist]").forEach((a) => (a.hidden = status !== "closed"));
  $$(".card", wall).forEach(updateCard);
  renderDrawer();
}

// ---------- Konten statis dari config ----------

function renderStatic() {
  document.title = `${config.brand} — Frame pajangan raket tennis dan padel`;
  $$("[data-brand]").forEach((el) => (el.textContent = config.brand));
  $("#year").textContent = new Date().getFullYear();
  $("#footer-wa").href = waLink(config.whatsapp);
  $("#footer-ig").href = config.instagram;

  const waitlistUrl = waLink(config.whatsapp, waitlistMessage(config.brand));
  $$("[data-waitlist]").forEach((a) => {
    a.href = waitlistUrl;
    a.addEventListener("click", () => track("waitlist_whatsapp"));
  });

  if (config.paymentNote) $("#step-payment").textContent = config.paymentNote;
  $("#step-production").textContent = `Frame dibuat bersama pesanan lain di ${batch.name}.`;
  if (batch.estimatedShip) $("#step-ship").textContent = `Estimasi dikirim ${batch.estimatedShip}.`;

  const faqs = (config.faq || []).filter((f) => f?.q && f?.a);
  $("#faq").hidden = !faqs.length;
  $("#faq-list").replaceChildren(...faqs.map((f) => {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const answer = document.createElement("p");
    summary.textContent = f.q;
    answer.textContent = f.a;
    details.append(summary, answer);
    return details;
  }));

  // Foto hero ada di HTML, jadi bisa saja sudah gagal dimuat sebelum modul ini jalan.
  const hero = $(".hero-media img");
  if (hero.complete && !hero.naturalWidth) hero.removeAttribute("srcset");
  else dropSrcsetOnError(hero);
}

// ---------- Filter & katalog ----------

function readFilter() {
  const key = new URLSearchParams(location.search).get("kategori")?.toLowerCase();
  return key && Object.hasOwn(categories, key) ? key : "semua";
}

function writeFilter() {
  const url = new URL(location.href);
  if (filter === "semua") url.searchParams.delete("kategori");
  else url.searchParams.set("kategori", filter);
  history.replaceState(history.state, "", url);
}

function renderFilters() {
  const options = [["semua", "Semua"], ...Object.entries(categories).map(([key, c]) => [key, c.label])];
  $("#filters").replaceChildren(...options.map(([key, label]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter";
    btn.dataset.filter = key;
    btn.textContent = label;
    return btn;
  }));
  markFilter();
}

function markFilter() {
  $$("#filters [data-filter]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter));
  });
}

function infoText() {
  const price = `Semua desain ${formatRupiah(config.price)}.`;
  if (filter !== "semua") return `${price} Ukuran ${categories[filter].size}.`;
  const sizes = Object.values(categories).map((c) => `${c.label.toLowerCase()} ${c.size}`);
  return `${price} Ukuran ${sizes.join(", ")}.`;
}

function renderCatalog() {
  const list = filter === "semua" ? catalog : catalog.filter((p) => p.category === filter);
  const cards = list.map(buildCard);
  $$(".card", wall).forEach((li) => revealer?.unobserve(li));
  wall.style.setProperty("--wmax", Math.max(1, ...list.map(widthOf)));
  wall.replaceChildren(...cards);
  cards.forEach((li) => revealer?.observe(li));

  const empty = $("#wall-empty");
  empty.hidden = list.length > 0;
  empty.textContent = filter === "semua"
    ? "Belum ada desain di batch ini."
    : `Belum ada desain ${categories[filter].label.toLowerCase()} di batch ini.`;
  $("#info-text").textContent = infoText();
}

function buildCard(p) {
  const c = categoryOf(p);
  const [rw, rh] = ratioOf(p);
  const li = $("#tpl-card").content.firstElementChild.cloneNode(true);
  const img = $("img", li);

  li.dataset.id = p.id;
  li.style.setProperty("--w", widthOf(p));
  li.style.setProperty("--ratio", `${rw} / ${rh}`);

  img.width = 800;
  img.height = Math.round((800 * rh) / rw);
  img.alt = `Frame ${c.label} desain ${p.name}`;
  if (revealer) {
    const loaded = () => img.classList.add("is-loaded");
    img.addEventListener("load", loaded, { once: true });
    img.addEventListener("error", loaded, { once: true });
  }
  if (/\.webp$/i.test(p.image)) {
    img.srcset = `${p.image} 800w, ${p.image.replace(/\.webp$/i, "-1600.webp")} 1600w`;
    dropSrcsetOnError(img);
  }
  img.src = p.image;

  $(".card-name", li).textContent = p.name;
  $(".card-cat", li).textContent = c.label;
  $(".stepper", li).setAttribute("aria-label", `Jumlah ${p.name}`);
  updateCard(li);
  return li;
}

function updateStepper(stepper, p, qty, { removeAtOne }) {
  const dec = $("[data-act=dec]", stepper);
  const inc = $("[data-act=inc]", stepper);
  $(".stepper-qty", stepper).textContent = qty;
  dec.setAttribute("aria-label", removeAtOne && qty <= 1 ? `Hapus ${p.name} dari keranjang` : `Kurangi jumlah ${p.name}`);
  dec.setAttribute("aria-disabled", String(!removeAtOne && qty <= 1));
  inc.setAttribute("aria-label", `Tambah jumlah ${p.name}`);
  inc.setAttribute("aria-disabled", String(qty >= MAX_QTY || status !== "open"));
}

function updateCard(li) {
  const p = byId.get(li.dataset.id);
  const qty = cart.qty(p.id);
  const add = $("[data-act=add]", li);
  const stepper = $(".stepper", li);
  const open = status === "open";

  add.hidden = open && qty > 0;
  stepper.hidden = !add.hidden;
  add.disabled = !open;
  add.textContent = open ? "Tambah" : status === "upcoming" ? "Segera dibuka" : "PO ditutup";
  if (open) add.setAttribute("aria-label", `Tambah ${p.name} ke keranjang`);
  else add.removeAttribute("aria-label");
  updateStepper(stepper, p, qty, { removeAtOne: true });
}

function increment(p) {
  const qty = cart.qty(p.id);
  if (qty >= MAX_QTY) return announce(`Maksimal ${MAX_QTY} per desain.`);
  cart.setQty(p.id, qty + 1);
  announce(`Jumlah ${p.name}: ${qty + 1}.`);
}

function onWallClick(e) {
  const btn = e.target.closest("button[data-act]");
  const li = btn?.closest(".card");
  if (!li || btn.disabled || refreshStatus() !== "open") return;

  const p = byId.get(li.dataset.id);
  const qty = cart.qty(p.id);
  switch (btn.dataset.act) {
    case "add":
      cart.add(p.id);
      $("[data-act=inc]", li).focus();
      announce(`${p.name} ditambahkan ke keranjang.`);
      break;
    case "inc":
      increment(p);
      break;
    case "dec":
      if (qty <= 1) {
        cart.remove(p.id);
        $("[data-act=add]", li).focus();
        announce(`${p.name} dihapus dari keranjang.`);
      } else {
        cart.setQty(p.id, qty - 1);
        announce(`Jumlah ${p.name}: ${qty - 1}.`);
      }
      break;
  }
}

// ---------- Badge keranjang ----------

function renderBadge(animate) {
  const n = cart.count();
  const badge = $("#cart-badge");
  const changed = badge.textContent !== String(n);
  badge.textContent = n;
  badge.hidden = n === 0;
  $("#cart-open").setAttribute("aria-label", `Buka keranjang, ${n} item`);
  if (animate && changed && n > 0 && !reducedMotion.matches) {
    badge.animate?.(
      [{ transform: "scale(1)" }, { transform: "scale(1.3)" }, { transform: "scale(1)" }],
      { duration: 260, easing: "ease-out" },
    );
  }
}

// ---------- Drawer ----------

function buildRow(p) {
  const c = categoryOf(p);
  const [rw, rh] = ratioOf(p);
  const row = $("#tpl-row").content.firstElementChild.cloneNode(true);
  const img = $("img", row);

  row.dataset.id = p.id;
  img.src = p.image;
  img.height = Math.round((56 * rh) / rw);
  img.style.aspectRatio = `${rw} / ${rh}`;
  $(".row-name", row).textContent = p.name;
  $(".row-meta", row).textContent = `${c.label} · ${c.size}`;
  $(".stepper", row).setAttribute("aria-label", `Jumlah ${p.name}`);
  $("[data-act=remove]", row).setAttribute("aria-label", `Hapus ${p.name} dari keranjang`);
  return row;
}

// Update baris di tempat (bukan render ulang) supaya fokus keyboard tidak hilang.
function renderRows(items) {
  const list = $("#rows");
  const existing = new Map($$(".row", list).map((row) => [row.dataset.id, row]));

  items.forEach(({ id, qty }, i) => {
    const p = byId.get(id);
    const row = existing.get(id) ?? buildRow(p);
    existing.delete(id);
    updateStepper($(".stepper", row), p, qty, { removeAtOne: false });
    $(".row-subtotal", row).textContent = formatRupiah(qty * config.price);
    if (list.children[i] !== row) list.insertBefore(row, list.children[i] ?? null);
  });
  existing.forEach((row) => row.remove());
}

function renderDrawer() {
  const items = cart.items;
  const hasItems = items.length > 0;
  const open = status === "open";

  renderRows(items);
  $("#rows").hidden = !hasItems;
  $("#drawer-empty").hidden = hasItems;
  $("#checkout").hidden = !hasItems;
  $("#total").textContent = formatRupiah(cart.count() * config.price);
  $("#checkout-btn").disabled = !hasItems || !open;

  $("#closed-note").hidden = open;
  $("#closed-text").textContent = status === "upcoming"
    ? `PO ${batch.name} dibuka ${formatDate(batch.opensAt)}. Pesanan bisa dikirim setelah PO dibuka.`
    : `PO ${batch.name} sudah ditutup, jadi pesanan belum bisa dikirim.`;

  $("#po-note").hidden = !cart.poCode;
  $("#po-note").textContent = `Kode pesanan: ${cart.poCode}`;

  if (!hasItems && view === "confirm") showView("cart");
}

function syncCustomerInputs() {
  const { name, city } = cart.customer;
  if (document.activeElement !== fName) fName.value = name;
  if (document.activeElement !== fCity) fCity.value = city;
}

function showView(name, { focus = false } = {}) {
  view = name;
  $$("[data-view]", drawer).forEach((el) => (el.hidden = el.dataset.view !== name));
  if (name === "confirm") $("#confirm-code").textContent = cart.poCode;
  if (focus) $(`[data-view="${name}"] h3`, drawer)?.focus();
}

let opener = null;
let returnTo = null;

function openDrawer() {
  if (drawer.open) return;
  opener = document.activeElement;
  refreshStatus();
  showView("cart");
  renderDrawer();
  syncCustomerInputs();
  drawer.showModal();
  $("[data-close]", drawer).focus();
}

function closeDrawer(target = null) {
  if (!drawer.open || drawer.classList.contains("is-closing")) return;
  returnTo = target;
  if (reducedMotion.matches) return drawer.close();
  drawer.classList.add("is-closing");
  setTimeout(() => drawer.close(), 200);
}

function onDrawerClosed() {
  drawer.classList.remove("is-closing");
  showView("cart");
  const target = returnTo ?? opener;
  const scroll = Boolean(returnTo);
  returnTo = opener = null;
  target?.focus?.({ preventScroll: scroll });
  if (scroll) {
    target.closest("section")?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
  }
}

function onRowsClick(e) {
  const btn = e.target.closest("button[data-act]");
  const row = btn?.closest(".row");
  if (!row) return;

  const p = byId.get(row.dataset.id);
  const qty = cart.qty(p.id);
  switch (btn.dataset.act) {
    case "remove": {
      const next = row.nextElementSibling ?? row.previousElementSibling;
      cart.remove(p.id);
      announce(`${p.name} dihapus dari keranjang.`);
      (next ? $("[data-act=remove]", next) : $("[data-to-catalog]")).focus();
      break;
    }
    case "inc":
      if (refreshStatus() === "open") increment(p);
      break;
    case "dec":
      if (qty > 1) {
        cart.setQty(p.id, qty - 1);
        announce(`Jumlah ${p.name}: ${qty - 1}.`);
      }
      break;
  }
}

function setError(input, msg) {
  $(`#${input.id}-err`).textContent = msg;
  if (msg) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

function sendOrder() {
  const { name, city } = cart.customer;
  const lines = cart.items.map(({ id, qty }) => {
    const p = byId.get(id);
    const c = categoryOf(p);
    return { category: c.label, name: p.name, size: c.size, qty, subtotal: qty * config.price };
  });
  const total = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const text = orderMessage({
    brand: config.brand, lines, total, name, city, batchName: batch.name, poCode: cart.poCode,
  });
  openWhatsApp(waLink(config.whatsapp, text));
}

function onCheckout(e) {
  e.preventDefault();
  if (!cart.items.length) return;
  if (refreshStatus() !== "open") return announce($("#closed-text").textContent);

  const name = fName.value.trim();
  const city = fCity.value.trim();
  setError(fName, name ? "" : "Isi nama untuk melanjutkan.");
  setError(fCity, city ? "" : "Isi kota untuk melanjutkan.");
  if (!name || !city) return (name ? fCity : fName).focus();

  cart.setCustomer({ name, city });
  cart.ensurePoCode(() => makePoCode(batch.code));
  sendOrder();
  track("checkout_whatsapp");
  renderDrawer();
  showView("confirm", { focus: true });
}

function onConfirmClick(e) {
  const action = e.target.closest("[data-confirm]")?.dataset.confirm;
  if (action === "done") {
    cart.clear();
    showView("done", { focus: true });
  } else if (action === "reopen") {
    sendOrder();
  }
}

// ---------- Init ----------

renderStatic();
renderFilters();
renderCatalog();
renderStatus();
renderBadge(false);
initReveal();
scheduleStatusCheck();

cart.subscribe(() => {
  $$(".card", wall).forEach(updateCard);
  renderDrawer();
  renderBadge(true);
  syncCustomerInputs();
});

// Ganti filter: kartu lama memudar dulu, baru kartu kategori baru muncul.
let swapTimer = 0;
$("#filters").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn || btn.dataset.filter === filter) return;
  filter = btn.dataset.filter;
  writeFilter();
  markFilter();
  clearTimeout(swapTimer);
  if (!revealer || !wall.children.length) return renderCatalog();
  wall.classList.add("is-leaving");
  swapTimer = setTimeout(() => {
    wall.classList.remove("is-leaving");
    renderCatalog();
  }, 180);
});

wall.addEventListener("click", onWallClick);
$("#cart-open").addEventListener("click", openDrawer);
$("#rows").addEventListener("click", onRowsClick);
$("#checkout").addEventListener("submit", onCheckout);
$('[data-view="confirm"]').addEventListener("click", onConfirmClick);
$("[data-to-catalog]").addEventListener("click", () => closeDrawer($("#katalog-title")));
$$("[data-close]", drawer).forEach((btn) => btn.addEventListener("click", () => closeDrawer()));

for (const [input, key] of [[fName, "name"], [fCity, "city"]]) {
  input.addEventListener("input", () => {
    cart.setCustomer({ [key]: input.value });
    if (input.value.trim() && input.hasAttribute("aria-invalid")) setError(input, "");
  });
}

// Esc: tutup dengan animasi. Klik overlay: pointer harus mulai dan berakhir di overlay.
drawer.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeDrawer();
});
drawer.addEventListener("close", onDrawerClosed);
let pressedBackdrop = false;
drawer.addEventListener("pointerdown", (e) => (pressedBackdrop = e.target === drawer));
drawer.addEventListener("click", (e) => {
  if (pressedBackdrop && e.target === drawer) closeDrawer();
  pressedBackdrop = false;
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshStatus();
});
