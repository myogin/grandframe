// Template pesan, kode PO, dan link WhatsApp.

/** 250000 → "Rp250.000" (tanpa spasi setelah "Rp") */
export function formatRupiah(amount) {
  const digits = String(Math.round(Math.abs(amount) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${amount < 0 ? "-" : ""}Rp${digits}`;
}

/** "B3" → "PO-B3-4821" */
export function makePoCode(batchCode, random = Math.random) {
  const digits = String(Math.floor(random() * 10000)).padStart(4, "0");
  return `PO-${batchCode}-${digits}`;
}

// Nama dan kota diketik pengunjung; rapikan supaya tidak merusak format pesan.
const oneLine = (s) => String(s).replace(/\s+/g, " ").trim();

/**
 * @param {{ brand: string, lines: { category: string, name: string, size: string, qty: number, subtotal: number }[],
 *           total: number, name: string, city: string, batchName: string, poCode: string }} order
 */
export function orderMessage({ brand, lines, total, name, city, batchName, poCode }) {
  return [
    `Halo ${brand}, saya mau pre-order frame:`,
    "",
    ...lines.map((l, i) =>
      `${i + 1}. ${l.category} – ${l.name} (${l.size}) x${l.qty} – ${formatRupiah(l.subtotal)}`),
    "",
    `Total: ${formatRupiah(total)} (belum termasuk ongkir)`,
    `Nama: ${oneLine(name)}`,
    `Kota: ${oneLine(city)}`,
    `Batch: ${batchName}`,
    `Kode: ${poCode}`,
  ].join("\n");
}

export const waitlistMessage = (brand) =>
  `Halo ${brand}, saya mau dikabari kalau PO batch berikutnya dibuka.`;

export function waLink(number, text) {
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function openWhatsApp(url) {
  window.open(url, "_blank", "noopener");
}
