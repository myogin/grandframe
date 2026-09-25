import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRupiah, makePoCode, orderMessage, waitlistMessage, waLink } from "../js/whatsapp.js";

test("formatRupiah tanpa spasi", () => {
  assert.equal(formatRupiah(250000), "Rp250.000");
  assert.equal(formatRupiah(750000), "Rp750.000");
  assert.equal(formatRupiah(2500000), "Rp2.500.000");
  assert.equal(formatRupiah(0), "Rp0");
});

test("kode PO: PO-{code}-{4 digit}", () => {
  assert.equal(makePoCode("B3", () => 0.4821), "PO-B3-4821");
  assert.equal(makePoCode("B3", () => 0.0007), "PO-B3-0007");
  assert.match(makePoCode("B3"), /^PO-B3-\d{4}$/);
});

test("pesan pesanan sama persis dengan template PRD 10", () => {
  const text = orderMessage({
    brand: "Grand Frame",
    lines: [
      { category: "Padel", name: "Midnight", size: "40 x 60 x 2,5 cm", qty: 2, subtotal: 500000 },
      { category: "Tennis", name: "Court Line", size: "50 x 80 x 3 cm", qty: 1, subtotal: 250000 },
    ],
    total: 750000,
    name: "  Andi ",
    city: "Bandung\n",
    batchName: "Batch 3",
    poCode: "PO-B3-4821",
  });
  assert.equal(text, `Halo Grand Frame, saya mau pre-order frame:

1. Padel – Midnight (40 x 60 x 2,5 cm) x2 – Rp500.000
2. Tennis – Court Line (50 x 80 x 3 cm) x1 – Rp250.000

Total: Rp750.000 (belum termasuk ongkir)
Nama: Andi
Kota: Bandung
Batch: Batch 3
Kode: PO-B3-4821`);
});

test("pesan waitlist", () => {
  assert.equal(waitlistMessage("Grand Frame"), "Halo Grand Frame, saya mau dikabari kalau PO batch berikutnya dibuka.");
});

test("link wa.me ter-encode", () => {
  assert.equal(waLink("6281234567890", "Halo & x2"), "https://wa.me/6281234567890?text=Halo%20%26%20x2");
  assert.equal(waLink("6281234567890"), "https://wa.me/6281234567890");
});
