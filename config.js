// Satu-satunya file yang diedit rutin. Simpan, reload, selesai.
// Detail aturan: docs/PRD.md bagian 7.

export const config = {
  brand: "Grand Frame",
  whatsapp: "62895342574617",      // TODO: format internasional, tanpa + dan tanpa 0 di depan
  instagram: "https://instagram.com/madeyoginugraha", // TODO
  price: 250000,                  // harga seragam semua produk, dalam rupiah
  paymentNote: "",                // TODO: ketentuan pembayaran untuk section Cara pesan

  batch: {
    name: "Batch 3",
    code: "B3",                   // dipakai di kode PO dan kunci keranjang
    opensAt: "2026-09-25",        // opsional, YYYY-MM-DD, buka 00:00 WIB
    closesAt: "2026-10-10",       // YYYY-MM-DD, tutup 23:59:59 WIB
    estimatedShip: "akhir November 2026",
    forceClosed: false,           // true = tutup lebih awal, misalnya kuota penuh
  },

  categories: {
    padel:  { label: "Padel",  size: "40 x 60 x 2,5 cm", ratio: "2 / 3", width: 40 },
    tennis: { label: "Tennis", size: "50 x 80 x 3 cm",   ratio: "5 / 8", width: 50 },
  },

  // Pertanyaan dengan jawaban kosong tidak ditampilkan.
  // Kalau semua kosong, section FAQ disembunyikan.
  faq: [
    { q: "Bahan frame-nya apa?", a: "" },
    { q: "Bagaimana raket dipasang di dalam frame?", a: "" },
    // TODO: pemilik cek dua jawaban di bawah ini.
    { q: "Apakah bisa dikirim ke luar kota?", a: "Bisa. Ongkir dihitung sesuai kota tujuan dan dikonfirmasi via WhatsApp." },
    { q: "Bisakah pesan setelah batch ditutup?", a: "Pesanan hanya diterima selama PO dibuka. Kalau batch sudah ditutup, tekan \"Kabari saya batch berikutnya\" supaya kamu dikabari saat PO berikutnya dibuka." },
  ],
};

// Urutan di katalog mengikuti urutan array ini.
// id: unik, kebab-case, sama dengan nama file foto.
export const products = [
  { id: "midnight",    name: "Midnight",    category: "padel",  image: "img/products/midnight.webp",    visible: true },
  { id: "court-line",  name: "Court Line",  category: "tennis", image: "img/products/court-line.webp",  visible: true },
  { id: "bandeja",     name: "Bandeja",     category: "padel",  image: "img/products/bandeja.webp",     visible: true },
  { id: "clay-season", name: "Clay Season", category: "tennis", image: "img/products/clay-season.webp", visible: true },
  { id: "glasswall",   name: "Glasswall",   category: "padel",  image: "img/products/glasswall.webp",   visible: true },
  { id: "lawn",        name: "Lawn",        category: "tennis", image: "img/products/lawn.webp",        visible: true },
  { id: "vibora",      name: "Víbora",      category: "padel",  image: "img/products/vibora.webp",      visible: true },
  { id: "ace",         name: "Ace",         category: "tennis", image: "img/products/ace.webp",         visible: true },
  { id: "deuce",       name: "Deuce",       category: "tennis", image: "img/products/deuce.webp",       visible: false },
];
