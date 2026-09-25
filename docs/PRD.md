# PRD: Website Katalog Frame Raket Grand Frame

- **Versi:** 1.0 (25 September 2026)
- **Status:** Siap diimplementasikan
- **Catatan:** `Grand Frame` adalah placeholder nama brand. Ganti setelah nama final dipilih (lihat bagian 17).

---

## 1. Ringkasan

Grand Frame menjual frame pajangan untuk raket tennis dan padel dengan sistem pre-order (PO) per batch. Website ini adalah katalog satu halaman. Pengunjung memilih desain, memasukkan ke keranjang, lalu checkout dengan membuka WhatsApp penjual yang sudah berisi pesan pesanan terformat.

Website tidak menangani pembayaran, akun, atau database. Konfirmasi, ongkir, dan pembayaran semuanya dilakukan di WhatsApp.

## 2. Tujuan

- Menampilkan semua desain frame dengan jelas dan cepat, terutama di HP.
- Mengubah minat menjadi chat WhatsApp dengan langkah sesedikit mungkin.
- Pesan yang masuk ke WA sudah lengkap: desain, kategori, ukuran, jumlah, total, nama, kota, batch, dan kode PO. Penjual tidak perlu bertanya ulang.
- Katalog dan batch dikelola cukup dengan mengedit satu file config lalu deploy.

### Metrik keberhasilan

- Jumlah klik tombol "Pesan via WhatsApp" per batch (kalau analytics dipasang).
- LCP di HP dengan koneksi 4G di bawah 2 detik.

## 3. Di luar scope (v1)

- Payment gateway atau pembayaran online
- Akun pengguna dan login
- Database, backend, atau admin panel
- Manajemen stok atau kuota otomatis
- Kalkulator ongkir
- Multi-bahasa
- Custom desain atau upload gambar dari customer

## 4. Konteks bisnis

- **Model:** pre-order per batch. Tidak ada stok; semua produk dibuat berdasarkan pesanan di batch yang sedang dibuka.
- **Harga:** seragam, Rp250.000 untuk semua produk.
- **Pembeda produk:** hanya desain tampak depan. Satu foto per produk.
- **Kategori dan ukuran** (tetap per kategori):

| Kategori | Ukuran | Rasio foto |
|---|---|---|
| Padel | 40 x 60 x 2,5 cm | 2:3 |
| Tennis | 50 x 80 x 3 cm | 5:8 |

## 5. Alur pengguna

### Saat batch dibuka

1. Pengunjung datang, umumnya lewat HP dari link bio Instagram atau link yang dibagikan di WA.
2. Pengunjung melihat status batch di strip paling atas.
3. Pengunjung menjelajah katalog dan bisa memfilter Padel atau Tennis.
4. Pengunjung menambah satu atau lebih desain ke keranjang dan mengatur jumlahnya.
5. Pengunjung membuka keranjang, lalu mengisi nama dan kota.
6. Pengunjung menekan "Pesan via WhatsApp", dan WhatsApp terbuka dengan pesan yang sudah terisi.
7. Pengunjung mengirim pesan. Penjual melanjutkan konfirmasi, ongkir, dan pembayaran di chat.

### Saat batch ditutup

Katalog tetap bisa dilihat, tapi tombol tambah dinonaktifkan. Tombol "Kabari saya batch berikutnya" membuka WA dengan pesan waitlist.

## 6. Struktur halaman

Satu halaman dengan urutan section berikut:

1. Strip batch
2. Header
3. Hero
4. Katalog
5. Cara pesan
6. FAQ (opsional)
7. Footer

### 6.1 Strip batch

Strip teks tipis di paling atas halaman. Isinya mengikuti status batch (lihat bagian 8):

| Status | Teks |
|---|---|
| `upcoming` | PO {batch.name} dibuka {opensAt}. |
| `open` | PO {batch.name} dibuka sampai {closesAt}. Estimasi dikirim {estimatedShip}. |
| `closed` | PO {batch.name} sudah ditutup. Batch berikutnya segera dibuka. |

Tanggal ditampilkan dalam format panjang bahasa Indonesia, misalnya "10 Oktober 2026".

### 6.2 Header

- Header sticky, berisi wordmark brand, link anchor ke Katalog dan Cara pesan, dan tombol keranjang.
- Tombol keranjang menampilkan badge total jumlah item.
- `aria-label` tombol keranjang dinamis, misalnya "Buka keranjang, 2 item".

### 6.3 Hero

- Headline (usulan copy): "Raketmu layak dipajang."
- Subteks (usulan, sesuaikan): "Frame untuk raket tennis dan padel. Dibuat per batch, dipesan lewat WhatsApp."
- CTA: "Lihat katalog", berupa anchor ke section katalog.
- Visual: satu foto frame berisi raket yang terpasang di dinding.

### 6.4 Katalog

- **Filter:** tombol Semua, Padel, dan Tennis, dengan default Semua. Gunakan `aria-pressed` pada tiap tombol.
- **Sinkron URL:** filter mengikuti query `?kategori=padel` atau `?kategori=tennis`, supaya link per kategori bisa dibagikan dari Instagram.
- **Info bar di atas grid:**
  - Filter Padel: "Semua desain Rp250.000. Ukuran 40 x 60 x 2,5 cm."
  - Filter Tennis: sama, dengan ukuran tennis.
  - Filter Semua: menampilkan harga dan kedua ukuran.
- **Kartu produk** berisi:
  - foto dengan rasio sesuai kategori,
  - nama desain,
  - label kategori,
  - tombol "Tambah".
- **Kartu yang sudah di keranjang:** tombol "Tambah" berganti menjadi stepper jumlah (− 1 +) langsung di kartu. Menurunkan jumlah ke 0 berarti item dihapus dari keranjang.
- **Produk yang tampil:** hanya produk dengan `visible: true`, dengan urutan sesuai urutan array di config.
- **Empty state:** kalau satu kategori tidak punya produk yang tampil, tulis "Belum ada desain padel di batch ini." (atau tennis).
- **Batch tidak `open`:** tombol dinonaktifkan dengan label "PO ditutup" atau "Segera dibuka".

### 6.5 Keranjang (drawer)

**Tampilan**

- Di desktop berupa panel samping kanan. Di HP berupa panel selebar layar.
- Tiap item menampilkan thumbnail, nama desain, kategori dan ukuran, stepper jumlah (1–10), tombol hapus, dan subtotal item.
- Di bawah daftar item ada total, disertai catatan: "Belum termasuk ongkir. Ongkir dan pembayaran dikonfirmasi via WhatsApp."

**Form dan tombol**

- Form berisi Nama (wajib) dan Kota (wajib). Nilainya disimpan supaya pengunjung tidak perlu mengetik ulang.
- Tombol "Pesan via WhatsApp" nonaktif kalau keranjang kosong atau status batch bukan `open`.
- Error validasi tampil di bawah field yang bermasalah, misalnya "Isi nama untuk melanjutkan."

**Empty state**

- Teks "Keranjang masih kosong." dan tombol "Lihat katalog" yang menutup drawer lalu scroll ke katalog.

**Interaksi**

- Drawer bisa ditutup lewat tombol X, tombol Esc, atau klik overlay.
- Fokus terkunci di dalam drawer selama terbuka, lalu kembali ke tombol pemicu saat drawer ditutup.

**Setelah tombol "Pesan via WhatsApp" ditekan**

- Drawer berganti ke state konfirmasi: "WhatsApp sudah dibuka. Sudah kirim pesannya?"
- Ada dua tombol: "Sudah, kosongkan keranjang" dan "Buka WhatsApp lagi".
- Keranjang **tidak** dikosongkan otomatis, karena pengunjung mungkin belum benar-benar mengirim pesan.

### 6.6 Cara pesan

Langkah berurutan (penomoran wajar di sini karena memang urutan proses):

1. Pilih desain
2. Kirim pesanan via WhatsApp
3. Bayar (teks dari `config.paymentNote`)
4. Produksi sesuai batch
5. Dikirim (estimasi dari `batch.estimatedShip`)

### 6.7 FAQ (opsional)

Gunakan elemen `<details>`. Jawaban diisi oleh pemilik. Usulan pertanyaan:

- Bahan frame-nya apa?
- Bagaimana raket dipasang di dalam frame?
- Apakah bisa dikirim ke luar kota?
- Bisakah pesan setelah batch ditutup?

### 6.8 Footer

Berisi wordmark, link WhatsApp, link Instagram, dan © tahun berjalan.

## 7. Konfigurasi (`config.js`)

Ini satu-satunya file yang diedit secara rutin.

```js
export const config = {
  brand: "Grand Frame",
  whatsapp: "62812xxxxxxxx",      // format internasional, tanpa + dan tanpa 0 di depan
  instagram: "https://instagram.com/xxx",
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
};

export const products = [
  { id: "midnight",   name: "Midnight",   category: "padel",  image: "img/products/midnight.webp",   visible: true },
  { id: "court-line", name: "Court Line", category: "tennis", image: "img/products/court-line.webp", visible: true },
];
```

### Aturan data produk

- `id` harus unik dan ditulis kebab-case. Nilai ini dipakai sebagai key keranjang dan nama file foto.
- Urutan tampil di katalog mengikuti urutan array.
- `width` pada kategori dipakai untuk proporsi lebar kartu (lihat bagian 11).

### Validasi saat load

Tampilkan `console.warn`, jangan crash, untuk kasus berikut:

- kategori tidak dikenal,
- `id` duplikat,
- field wajib kosong.

## 8. Logika status batch

Semua waktu dihitung dalam WIB (UTC+7).

```
if (forceClosed)                                      → "closed"
else if (opensAt && now < opensAt T00:00:00+07:00)    → "upcoming"
else if (now > closesAt T23:59:59+07:00)              → "closed"
else                                                  → "open"
```

- Implementasi dengan `new Date(`${closesAt}T23:59:59+07:00`)`, supaya hasilnya benar di zona waktu mana pun.
- Status dihitung saat halaman dimuat, lalu **dihitung ulang tepat sebelum checkout**. Ini untuk kasus halaman dibiarkan terbuka melewati jam tutup.
- PO tertutup otomatis setelah `closesAt` tanpa perlu deploy ulang.

## 9. Keranjang dan penyimpanan

Keranjang disimpan di localStorage dengan key `frame-cart-v1`.

```json
{
  "batch": "B3",
  "items": [{ "id": "midnight", "qty": 2 }],
  "customer": { "name": "Andi", "city": "Bandung" },
  "poCode": null
}
```

Aturan saat memuat data:

- Kalau `batch` tersimpan berbeda dengan `config.batch.code`, `items` dan `poCode` direset. Data `customer` dipertahankan.
- Item yang `id`-nya sudah tidak ada atau `visible: false` dibuang tanpa pemberitahuan.
- `qty` dibatasi 1–10 per item.
- Semua akses localStorage dibungkus `try/catch`. Kalau localStorage gagal, keranjang tetap berjalan di memori.

## 10. Checkout WhatsApp

### Kode PO

- Format: `PO-{batch.code}-{4 digit acak}`, misalnya `PO-B3-4821`.
- Dibuat saat "Pesan via WhatsApp" pertama kali ditekan, lalu disimpan di `poCode`.
- "Buka WhatsApp lagi" memakai kode yang sama. Kode baru hanya dibuat setelah keranjang dikosongkan.

### Template pesanan

```
Halo Grand Frame, saya mau pre-order frame:

1. Padel – Midnight (40 x 60 x 2,5 cm) x2 – Rp500.000
2. Tennis – Court Line (50 x 80 x 3 cm) x1 – Rp250.000

Total: Rp750.000 (belum termasuk ongkir)
Nama: Andi
Kota: Bandung
Batch: Batch 3
Kode: PO-B3-4821
```

### Template waitlist

```
Halo Grand Frame, saya mau dikabari kalau PO batch berikutnya dibuka.
```

### Teknis

- **Link:** `https://wa.me/{config.whatsapp}?text={encodeURIComponent(pesan)}`.
- **Cara membuka:** `window.open(url, "_blank", "noopener")`. Di HP link ini membuka aplikasi WhatsApp, di desktop membuka WhatsApp Web atau Desktop.
- **Format rupiah:** `Rp250.000`, tanpa spasi. Kalau memakai `Intl.NumberFormat("id-ID", …)`, normalisasi spasi (termasuk non-breaking space) setelah "Rp".
- **Urutan item:** mengikuti urutan penambahan ke keranjang.

## 11. Arah visual (proposal)

### Konsep: dinding galeri

Produk tampil seperti frame yang digantung berjajar di dinding galeri. Beberapa aturan yang membentuk konsep ini:

- **Rasio asli:** rasio foto mengikuti ukuran fisik frame (padel 2:3, tennis 5:8).
- **Lebar proporsional:** di tampilan "Semua", lebar kartu proporsional terhadap lebar fisik frame (padel 40, tennis 50). Frame tennis terlihat sedikit lebih besar, sama seperti aslinya.
- **Rata atas:** kartu dalam satu baris sejajar di bagian atas, seperti frame yang tergantung pada satu rel.
- **Satu elemen berani:** konsep dinding galeri ini satu-satunya elemen yang mencolok. Semua elemen lain dibuat tenang.

### Palet

| Nama | Hex | Fungsi |
|---|---|---|
| Dinding | `#EEF0EE` | background halaman |
| Kertas | `#FFFFFF` | drawer, permukaan |
| Tinta | `#1D2528` | teks utama |
| Garis | `#C9CFCC` | border, divider |
| Lapangan | `#1E4D6B` | aksen: tombol utama, link, ring fokus |

### Tipografi

- **Display:** Bodoni Moda (Google Fonts), untuk wordmark dan heading. Font ini memberi kesan fancy dan cocok dengan suasana galeri.
- **Body:** Work Sans (Google Fonts).
- Sediakan fallback stack untuk keduanya.

### Prinsip

- Foto produk selalu jadi pusat perhatian. Warna UI tidak boleh bersaing dengan desain frame.
- Section dipisahkan dengan garis tipis ala garis lapangan, bukan kartu berbayang.
- Tidak ada animasi masuk per section. Motion hanya dipakai sebagai respons aksi, misalnya drawer terbuka, item ditambahkan, atau badge berubah.
- Hindari label all-caps di atas heading dan ikon panah di setiap tombol.

## 12. Kebutuhan non-fungsional

**Performa**

- Tanpa framework dan tanpa build step. Total JS di bawah 30 KB.
- Foto produk dalam format WebP, lebar 800 px, dengan varian 1600 px lewat `srcset`.
- Semua foto memakai `loading="lazy"`, kecuali foto hero.
- Target Lighthouse mobile ≥ 90 untuk semua kategori.

**Responsif**

- Mobile-first, mulai dari lebar 360 px.
- Katalog 2 kolom di HP, 3–4 kolom di desktop.

**Aksesibilitas**

- Fokus keyboard selalu terlihat.
- Drawer memakai focus trap dan bisa ditutup dengan Esc.
- Alt text foto: "Frame {kategori} desain {nama}".
- Kontras warna memenuhi WCAG AA.
- `prefers-reduced-motion` dihormati.

**SEO dan preview link**

- `lang="id"`, `<title>`, dan meta description.
- Open Graph lengkap dengan `og:image` 1200×630, untuk preview saat link dibagikan di WA/IG.
- Favicon.

**Analytics (opsional)**

- Event klik checkout dan waitlist.

**Browser**

- Versi terbaru Chrome Android, Safari iOS, serta Chrome, Safari, dan Firefox desktop.

## 13. Struktur file dan stack

```
/
├─ index.html
├─ config.js            ← diedit rutin
├─ css/
│  └─ style.css
├─ js/
│  ├─ app.js            ← init, render katalog, filter
│  ├─ batch.js          ← status batch
│  ├─ cart.js           ← state keranjang + localStorage
│  └─ whatsapp.js       ← template pesan, kode PO, link
├─ img/
│  ├─ products/         ← {id}.webp
│  ├─ hero.webp
│  └─ og-image.jpg
└─ docs/
   └─ PRD.md
```

- **Stack:** vanilla HTML, CSS, dan JavaScript (ES modules).
- **Dev lokal:** `npx serve .`, karena ES modules tidak jalan lewat `file://`.
- **Hosting:** Cloudflare Pages, Netlify, atau Vercel yang tersambung ke repo, dengan auto deploy setiap push.

## 14. Aset dari pemilik

- Foto tiap desain: tampak depan, latar polos, rasio sesuai kategori, nama file sama dengan `id`.
- Wordmark atau logo. Kalau belum ada, wordmark teks dari font display sudah cukup.
- Foto untuk hero dan `og:image`.
- Nomor WhatsApp Business dan link Instagram.
- Teks ketentuan pembayaran dan jawaban FAQ.

## 15. Milestone implementasi

1. **Kerangka:** struktur file, `config.js` dengan data dummy, token CSS, dan layout semua section.
2. **Katalog:** render dari config, filter dengan query param, info bar, dan kartu dengan proporsi dinding galeri.
3. **Keranjang:** state, localStorage, drawer, stepper di kartu dan drawer, serta form dengan validasi.
4. **Batch:** logika status, strip batch, dan state tombol untuk `upcoming` / `closed`.
5. **Checkout WA:** template pesan, kode PO, state konfirmasi, dan waitlist.
6. **Polish:** aksesibilitas, SEO/OG, optimasi gambar, dan tes di perangkat asli.

## 16. Kriteria penerimaan

**Config**

- [ ] Mengubah `price`, `batch`, atau `products` di `config.js` langsung mengubah tampilan setelah reload, tanpa mengedit file lain.
- [ ] Produk dengan `visible: false` tidak tampil dan ikut dibuang dari keranjang yang tersimpan.

**Katalog**

- [ ] Filter Padel hanya menampilkan produk padel, dan info bar menampilkan ukuran padel.
- [ ] Membuka `?kategori=padel` langsung mengaktifkan filter Padel.

**Batch**

- [ ] Setelah `closesAt` lewat (WIB), tombol tambah nonaktif dan CTA waitlist tampil, tanpa deploy ulang.
- [ ] `forceClosed: true` langsung menutup PO.

**Keranjang**

- [ ] Keranjang tetap ada setelah refresh, dan otomatis direset kalau `batch.code` berubah.
- [ ] Checkout tanpa nama atau kota menampilkan error di field yang bersangkutan.

**Checkout WA**

- [ ] Pesan WA berisi semua item, ukuran, subtotal per item, total, nama, kota, batch, dan kode PO sesuai template.
- [ ] "Buka WhatsApp lagi" memakai kode PO yang sama.
- [ ] Link WA membuka aplikasi WhatsApp di Android dan iOS, serta WhatsApp Web di desktop.

**Kualitas**

- [ ] Drawer bisa dioperasikan sepenuhnya dengan keyboard.
- [ ] Skor Lighthouse mobile ≥ 90.

## 17. Keputusan terbuka

- **Nama brand.** Kandidat: Hall of Frame, Deuce Frame, Grand Frame, Frameset, Atelier Frame. Cek ketersediaan domain dan handle Instagram sebelum memutuskan.
- **Estimasi produksi dan ketentuan pembayaran** (DP atau lunas di depan), untuk mengisi `paymentNote` dan section Cara pesan.
- **Arti "tebal" pada ukuran.** Apakah 2,5 cm dan 3 cm itu kedalaman frame atau lebar list bingkai? Raket padel standar tebalnya sekitar 38 mm, jadi ini perlu dipastikan sebelum menulis klaim "muat untuk raket standar" di website.
- **Jawaban FAQ.**
- **Domain dan handle Instagram.**
- **Analytics** yang akan dipakai (misalnya Plausible atau GA4), atau tidak memakai analytics sama sekali.