# Grand Frame

Katalog satu halaman untuk frame raket tennis dan padel, dengan checkout lewat WhatsApp.
Spesifikasi lengkap ada di [docs/PRD.md](docs/PRD.md).

Tanpa framework, tanpa build step, tanpa backend. HTML, CSS, dan JavaScript (ES modules) biasa.

## Menjalankan di komputer

```sh
npx serve .
```

Buka alamat yang muncul (biasanya http://localhost:3000). ES modules tidak jalan kalau
`index.html` dibuka langsung lewat `file://`.

Tes logika (status batch, keranjang, format pesan WA), memakai Node 20 ke atas:

```sh
npm test
```

## Pekerjaan rutin: edit `config.js`

Semua yang berubah per batch ada di [config.js](config.js). Simpan, deploy, lalu reload.

**Buka batch baru**

```js
batch: {
  name: "Batch 4",
  code: "B4",               // ganti kode → keranjang lama pengunjung otomatis direset
  opensAt: "2026-12-01",    // opsional; sebelum tanggal ini status "Segera dibuka"
  closesAt: "2026-12-15",   // tutup otomatis 23:59:59 WIB, tidak perlu deploy ulang
  estimatedShip: "akhir Januari 2027",
  forceClosed: false,       // true = tutup lebih awal (misalnya kuota penuh)
},
```

**Tambah desain**

1. Siapkan foto tampak depan dengan latar polos, rasio padel 2:3 atau tennis 5:8.
2. Simpan dua ukuran WebP di `img/products/`: `{id}.webp` (lebar 800 px) dan
   `{id}-1600.webp` (lebar 1600 px). Kalau versi 1600 belum ada, situs otomatis memakai
   versi 800.
3. Tambahkan satu baris di `products`. Urutan di array sama dengan urutan di katalog.

```js
{ id: "sunset-rally", name: "Sunset Rally", category: "padel", image: "img/products/sunset-rally.webp", visible: true },
```

`id` wajib unik dan kebab-case. Untuk menyembunyikan desain tanpa menghapusnya, pakai
`visible: false`; desain itu juga ikut dibuang dari keranjang pengunjung.

Kalau config salah isi (kategori tidak dikenal, id dobel, field kosong), situs tetap jalan
dan produk yang bermasalah dilewati. Detailnya muncul di Console browser (F12).

Contoh konversi foto dengan `cwebp`:

```sh
cwebp -q 82 -resize 800 0 foto.jpg -o img/products/sunset-rally.webp
cwebp -q 78 -resize 1600 0 foto.jpg -o img/products/sunset-rally-1600.webp
```

**FAQ**: isi `faq` di config. Pertanyaan yang jawabannya kosong tidak ditampilkan.

## Sebelum go-live

Semua gambar di `img/` masih placeholder buatan komputer. Nilai berikut juga masih dummy:

- [ ] `config.whatsapp`: nomor WA Business (misalnya `6281234567890`). Selama masih
      placeholder, Console menampilkan peringatan.
- [ ] `config.instagram`
- [ ] `config.paymentNote`: ketentuan pembayaran (DP atau lunas)
- [ ] Jawaban FAQ, terutama dua draf yang sudah terisi (pengiriman luar kota dan
      pemesanan setelah batch ditutup)
- [ ] Foto produk asli, `img/hero.webp` (1600×1200) + `img/hero-800.webp` (800×600),
      dan `img/og-image.jpg` (1200×630)
- [ ] Setelah domain final: ganti `og:image` di `index.html` ke URL absolut dan tambahkan
      `og:url`. Preview link di WhatsApp/IG butuh URL absolut.
- [ ] Kalau nama brand berubah: `config.brand`, `<title>`/meta di `index.html`,
      og-image, dan favicon

## Struktur

```
index.html        markup + template kartu/baris keranjang
config.js         ← diedit rutin
css/style.css     token warna, layout "dinding galeri"
js/app.js         init, render katalog, filter, drawer, checkout
js/batch.js       status batch (WIB)
js/cart.js        state keranjang + localStorage (frame-cart-v1)
js/whatsapp.js    template pesan, kode PO, link wa.me
tests/            unit test (node --test)
```

## Deploy

Sambungkan repo ke Cloudflare Pages, Netlify, atau Vercel sebagai situs statis:
tanpa build command, output directory `/`. Setiap push langsung ter-deploy.

**Docker / Easypanel**: [Dockerfile](Dockerfile) menyajikan situs lewat nginx di port 80
(konfigurasinya di [nginx.conf](nginx.conf)). Di Easypanel: buat App, source dari repo
GitHub, build type Dockerfile, lalu di Domains arahkan domain ke port 80. HTML/JS/CSS
(termasuk `config.js`) dikirim dengan `no-cache`, jadi edit config langsung terlihat
setelah redeploy. Gambar di-cache 1 hari; kalau foto diganti dengan nama file yang sama,
pengunjung lama baru melihat versi baru paling lambat sehari kemudian.

```sh
docker build -t grand-frame . && docker run --rm -p 8080:80 grand-frame
```

## Analytics (opsional)

Kalau Plausible atau GA4 dipasang di `index.html`, klik checkout dan waitlist otomatis
terkirim sebagai event `checkout_whatsapp` dan `waitlist_whatsapp`.
