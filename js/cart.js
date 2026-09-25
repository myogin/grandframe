// State keranjang + localStorage. Kalau localStorage tidak bisa dipakai
// (mode privat, diblokir, penuh), keranjang tetap jalan di memori.

export const STORAGE_KEY = "frame-cart-v1";
export const MAX_QTY = 10;

const clampQty = (n) => Math.min(MAX_QTY, Math.max(1, n));
const str = (v) => (typeof v === "string" ? v : "");

function readStorage() {
  try {
    return JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStorage(state) {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Abaikan: state di memori tetap berlaku.
  }
}

/**
 * Bersihkan data tersimpan sesuai PRD bagian 9:
 * - batch berbeda → items dan poCode direset, customer dipertahankan
 * - id yang tidak dikenal (terhapus atau visible: false) dibuang
 * - qty dibatasi 1–10
 */
export function normalize(raw, batchCode, isValidId) {
  const data = raw && typeof raw === "object" ? raw : {};
  const sameBatch = data.batch === batchCode;
  const seen = new Set();
  const items = [];

  if (sameBatch && Array.isArray(data.items)) {
    for (const item of data.items) {
      const qty = Math.floor(Number(item?.qty));
      if (!isValidId(item?.id) || seen.has(item.id) || !Number.isFinite(qty)) continue;
      seen.add(item.id);
      items.push({ id: item.id, qty: clampQty(qty) });
    }
  }

  const customer = data.customer && typeof data.customer === "object" ? data.customer : {};
  return {
    batch: batchCode,
    items,
    customer: { name: str(customer.name), city: str(customer.city) },
    poCode: sameBatch && items.length && str(data.poCode) ? data.poCode : null,
  };
}

export function createCart({ batchCode, isValidId }) {
  let state = normalize(readStorage(), batchCode, isValidId);
  const listeners = new Set();

  function commit() {
    // Kode PO baru hanya dibuat setelah keranjang kosong.
    if (!state.items.length) state.poCode = null;
    writeStorage(state);
    listeners.forEach((fn) => fn());
  }

  // Tulis balik hasil normalisasi supaya data usang langsung bersih.
  writeStorage(state);

  // Sinkron antar-tab.
  globalThis.addEventListener?.("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = normalize(readStorage(), batchCode, isValidId);
    listeners.forEach((fn) => fn());
  });

  const find = (id) => state.items.find((it) => it.id === id);

  return {
    get items() {
      return state.items.map((it) => ({ ...it }));
    },
    get customer() {
      return { ...state.customer };
    },
    get poCode() {
      return state.poCode;
    },
    qty: (id) => find(id)?.qty ?? 0,
    count: () => state.items.reduce((sum, it) => sum + it.qty, 0),

    /** qty ≤ 0 menghapus item. Item baru ditaruh di akhir (urutan penambahan). */
    setQty(id, qty) {
      if (!isValidId(id)) return;
      const n = Math.floor(qty);
      const item = find(id);
      if (n <= 0) {
        if (!item) return;
        state.items = state.items.filter((it) => it.id !== id);
      } else if (item) {
        if (item.qty === clampQty(n)) return;
        item.qty = clampQty(n);
      } else {
        state.items.push({ id, qty: clampQty(n) });
      }
      commit();
    },
    add(id) {
      this.setQty(id, this.qty(id) + 1);
    },
    remove(id) {
      this.setQty(id, 0);
    },
    clear() {
      state.items = [];
      commit();
    },

    /** Simpan nama/kota tanpa memicu render ulang (dipanggil saat mengetik). */
    setCustomer(patch) {
      state.customer = { ...state.customer, ...patch };
      writeStorage(state);
    },

    /** Kode PO yang sama dipakai ulang sampai keranjang dikosongkan. */
    ensurePoCode(make) {
      if (!state.poCode) {
        state.poCode = make();
        writeStorage(state);
      }
      return state.poCode;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
