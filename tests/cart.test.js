import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCart, normalize, STORAGE_KEY } from "../js/cart.js";

// localStorage tiruan untuk Node.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const valid = new Set(["midnight", "court-line", "bandeja"]);
const isValidId = (id) => valid.has(id);
const saved = () => JSON.parse(store.get(STORAGE_KEY));
const seed = (data) => store.set(STORAGE_KEY, JSON.stringify(data));

beforeEach(() => store.clear());

test("batch berbeda: items dan poCode direset, customer dipertahankan", () => {
  seed({ batch: "B2", items: [{ id: "midnight", qty: 2 }], customer: { name: "Andi", city: "Bandung" }, poCode: "PO-B2-1111" });
  const cart = createCart({ batchCode: "B3", isValidId });
  assert.deepEqual(cart.items, []);
  assert.equal(cart.poCode, null);
  assert.deepEqual(cart.customer, { name: "Andi", city: "Bandung" });
  assert.equal(saved().batch, "B3");
});

test("id tidak dikenal dibuang, qty dibatasi 1–10, duplikat dibuang", () => {
  const data = normalize({
    batch: "B3",
    items: [
      { id: "midnight", qty: 25 },
      { id: "hilang", qty: 1 },
      { id: "court-line", qty: 0 },
      { id: "midnight", qty: 3 },
      { id: "bandeja", qty: "abc" },
    ],
  }, "B3", isValidId);
  assert.deepEqual(data.items, [{ id: "midnight", qty: 10 }, { id: "court-line", qty: 1 }]);
});

test("data rusak tidak membuat crash", () => {
  store.set(STORAGE_KEY, "{bukan json");
  const cart = createCart({ batchCode: "B3", isValidId });
  assert.deepEqual(cart.items, []);
  assert.deepEqual(cart.customer, { name: "", city: "" });
});

test("tambah, ubah jumlah, hapus; urutan mengikuti penambahan", () => {
  const cart = createCart({ batchCode: "B3", isValidId });
  cart.add("court-line");
  cart.add("midnight");
  cart.add("court-line");
  assert.deepEqual(cart.items, [{ id: "court-line", qty: 2 }, { id: "midnight", qty: 1 }]);
  assert.equal(cart.count(), 3);

  cart.setQty("midnight", 99);
  assert.equal(cart.qty("midnight"), 10);
  cart.setQty("court-line", 0);
  assert.deepEqual(cart.items, [{ id: "midnight", qty: 10 }]);
  assert.deepEqual(saved().items, [{ id: "midnight", qty: 10 }]);

  cart.add("tidak-ada");
  assert.equal(cart.count(), 10);
});

test("kode PO dipakai ulang sampai keranjang dikosongkan", () => {
  const cart = createCart({ batchCode: "B3", isValidId });
  cart.add("midnight");
  let n = 0;
  const make = () => `PO-B3-000${++n}`;
  assert.equal(cart.ensurePoCode(make), "PO-B3-0001");
  cart.add("bandeja");
  assert.equal(cart.ensurePoCode(make), "PO-B3-0001");
  assert.equal(saved().poCode, "PO-B3-0001");

  cart.clear();
  assert.equal(cart.poCode, null);
  cart.add("midnight");
  assert.equal(cart.ensurePoCode(make), "PO-B3-0002");
});

test("keranjang tetap ada setelah reload", () => {
  const a = createCart({ batchCode: "B3", isValidId });
  a.add("bandeja");
  a.setCustomer({ name: "Sari", city: "Surabaya" });
  const b = createCart({ batchCode: "B3", isValidId });
  assert.deepEqual(b.items, [{ id: "bandeja", qty: 1 }]);
  assert.deepEqual(b.customer, { name: "Sari", city: "Surabaya" });
});

test("localStorage gagal: keranjang tetap jalan di memori", () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem() { throw new Error("SecurityError"); },
    setItem() { throw new Error("QuotaExceededError"); },
  };
  try {
    const cart = createCart({ batchCode: "B3", isValidId });
    cart.add("midnight");
    cart.add("midnight");
    assert.equal(cart.qty("midnight"), 2);
  } finally {
    globalThis.localStorage = original;
  }
});

test("subscriber dipanggil saat isi keranjang berubah, bukan saat mengetik nama", () => {
  const cart = createCart({ batchCode: "B3", isValidId });
  let calls = 0;
  cart.subscribe(() => calls++);
  cart.add("midnight");
  cart.setQty("midnight", 1); // tidak berubah
  cart.setCustomer({ name: "A" });
  assert.equal(calls, 1);
});
