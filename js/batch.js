// Status batch PO. Semua waktu dihitung dalam WIB (UTC+7), jadi hasilnya
// sama di zona waktu mana pun pengunjung berada.

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const opensAtDate = (batch) => new Date(`${batch.opensAt}T00:00:00+07:00`);
export const closesAtDate = (batch) => new Date(`${batch.closesAt}T23:59:59+07:00`);

/** @returns {"upcoming" | "open" | "closed"} */
export function batchStatus(batch, now = new Date()) {
  if (batch.forceClosed) return "closed";
  if (batch.opensAt && now < opensAtDate(batch)) return "upcoming";
  if (now > closesAtDate(batch)) return "closed";
  return "open";
}

/** Milidetik sampai status berikutnya berubah, atau null kalau tidak akan berubah lagi. */
export function msUntilNextChange(batch, now = new Date()) {
  const status = batchStatus(batch, now);
  if (status === "upcoming") return opensAtDate(batch) - now;
  if (status === "open" && !batch.forceClosed) return closesAtDate(batch) - now + 1000;
  return null;
}

/** "2026-10-10" → "10 Oktober 2026" */
export function formatDate(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
  if (!m || !MONTHS[m[2] - 1]) return ymd || "";
  return `${Number(m[3])} ${MONTHS[m[2] - 1]} ${m[1]}`;
}

export function batchStripText(batch, status) {
  if (status === "upcoming") return `PO ${batch.name} dibuka ${formatDate(batch.opensAt)}.`;
  if (status === "open") {
    const ship = batch.estimatedShip ? ` Estimasi dikirim ${batch.estimatedShip}.` : "";
    return `PO ${batch.name} dibuka sampai ${formatDate(batch.closesAt)}.${ship}`;
  }
  return `PO ${batch.name} sudah ditutup. Batch berikutnya segera dibuka.`;
}
