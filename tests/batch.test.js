import { test } from "node:test";
import assert from "node:assert/strict";
import { batchStatus, batchStripText, formatDate, msUntilNextChange } from "../js/batch.js";

const batch = {
  name: "Batch 3",
  code: "B3",
  opensAt: "2026-09-25",
  closesAt: "2026-10-10",
  estimatedShip: "akhir November 2026",
  forceClosed: false,
};
const at = (iso) => new Date(iso);

test("status mengikuti batas WIB, bukan zona waktu lokal", () => {
  assert.equal(batchStatus(batch, at("2026-09-24T16:59:59Z")), "upcoming"); // 24 Sep 23:59:59 WIB
  assert.equal(batchStatus(batch, at("2026-09-24T17:00:00Z")), "open");     // 25 Sep 00:00 WIB
  assert.equal(batchStatus(batch, at("2026-10-10T16:59:59Z")), "open");     // 10 Okt 23:59:59 WIB
  assert.equal(batchStatus(batch, at("2026-10-10T17:00:00Z")), "closed");   // 11 Okt 00:00 WIB
});

test("forceClosed menang atas tanggal", () => {
  assert.equal(batchStatus({ ...batch, forceClosed: true }, at("2026-10-01T00:00:00Z")), "closed");
  assert.equal(batchStatus({ ...batch, forceClosed: true }, at("2026-09-01T00:00:00Z")), "closed");
});

test("opensAt opsional", () => {
  const { opensAt, ...noOpen } = batch;
  assert.equal(batchStatus(noOpen, at("2020-01-01T00:00:00Z")), "open");
});

test("formatDate bahasa Indonesia", () => {
  assert.equal(formatDate("2026-10-10"), "10 Oktober 2026");
  assert.equal(formatDate("2026-01-05"), "5 Januari 2026");
  assert.equal(formatDate("bukan tanggal"), "bukan tanggal");
});

test("teks strip batch sesuai PRD 6.1", () => {
  assert.equal(batchStripText(batch, "upcoming"), "PO Batch 3 dibuka 25 September 2026.");
  assert.equal(
    batchStripText(batch, "open"),
    "PO Batch 3 dibuka sampai 10 Oktober 2026. Estimasi dikirim akhir November 2026.",
  );
  assert.equal(batchStripText(batch, "closed"), "PO Batch 3 sudah ditutup. Batch berikutnya segera dibuka.");
});

test("msUntilNextChange menunjuk ke batas berikutnya", () => {
  assert.equal(msUntilNextChange(batch, at("2026-09-24T16:59:00Z")), 60_000);
  assert.equal(msUntilNextChange(batch, at("2026-10-10T16:59:00Z")), 60_000);
  assert.equal(msUntilNextChange(batch, at("2026-10-11T00:00:00Z")), null);
});
