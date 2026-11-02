# MoneyMe 💛

Aplikasi pencatatan keuangan pribadi yang ringan, mudah dipakai, dan **100% offline**.
Tampilan dibuat untuk HP (mobile-first). Semua data tersimpan **hanya di perangkat/browser kamu**: tanpa akun, tanpa server, dan tanpa internet.

## Fitur
- Catat **pemasukan**, **pengeluaran**, dan **transfer** antar dompet
- **Multi dompet** (Tunai, Bank, E-wallet, dll.) dengan saldo masing-masing
- **Budget bulanan** per kategori dengan indikator hijau, kuning, dan merah
- **Laporan**: ringkasan bulanan, grafik per kategori, dan tren 6 bulan
- **Kunci PIN** 4 angka
- **Tema terang/gelap** (mengikuti sistem secara otomatis)
- **Backup & Pulihkan** ke file `.json`

## Cara Menjalankan

Butuh **Python 3**, yang sudah terpasang di macOS dan sebagian besar Linux.

```bash
cd money-me
python3 serve.py
```

Browser akan terbuka di `http://localhost:8080`.
Di macOS, kamu juga bisa **klik dua kali `start.command`**.

Alternatif lain: `npx serve .` atau server statis apa pun. Aplikasi ini hanya terdiri dari file HTML, CSS, dan JS, tanpa proses build.

> Membuka `index.html` langsung (double-click) juga bisa untuk mencoba, tetapi mode offline/install hanya aktif bila dibuka lewat `localhost` atau HTTPS.

## Memakai di HP

**Opsi A: satu WiFi dengan laptop (paling cepat untuk mencoba)**
1. Jalankan `python3 serve.py` di laptop.
2. Di HP, buka alamat `http://192.168.x.x:8080` yang tercetak di terminal.
3. Aplikasi langsung bisa dipakai. Catatan: lewat alamat IP (bukan HTTPS), browser tidak mengizinkan mode offline/install, jadi laptop harus tetap menyala.

**Opsi B: install ke HP dan pakai offline sepenuhnya (disarankan)**
Upload folder ini ke hosting statis gratis berbasis HTTPS (misal GitHub Pages, Netlify, Cloudflare Pages), buka di HP, lalu:
- **Android (Chrome):** menu ⋮ → *Tambahkan ke layar utama / Install app*
- **iPhone (Safari):** tombol Bagikan → *Tambah ke Layar Utama*

Setelah dibuka sekali, aplikasi berjalan tanpa internet. Datanya tetap hanya ada di HP, karena hosting hanya menyimpan file aplikasinya.

## Penting: Data & Backup
- Data tersimpan di **IndexedDB** browser. Jika data situs/browser dihapus, atau kamu ganti HP, data ikut hilang.
- Pakai **Lainnya → Backup & Pulihkan → Simpan File Backup** secara rutin, lalu simpan file-nya di tempat aman (Drive, WhatsApp ke diri sendiri, dll.).
- Data di `localhost` dan di alamat lain (misal IP WiFi atau hosting) **terpisah**. Pindahkan data dengan backup lalu pulihkan.
- Kunci PIN hanya mengunci tampilan. Jika lupa PIN, satu-satunya cara adalah menghapus semua data (lalu pulihkan dari backup).

## Struktur
```
money-me/
├── index.html            # shell aplikasi
├── manifest.webmanifest  # konfigurasi PWA
├── sw.js                 # service worker (cache offline)
├── css/style.css         # tema putih + gold, mode gelap
├── js/core.js            # util, IndexedDB, state, perhitungan, PIN, backup
├── js/ui.js              # ikon, bottom sheet, dialog, toast, grafik, PIN pad
├── js/views.js           # halaman & aksi
├── js/app.js             # inisialisasi & event global
├── icons/                # ikon aplikasi
├── serve.py / start.command
└── docs/PRD.md
```

Saat mengubah file aplikasi, naikkan versi `CACHE` di `sw.js` (misal `moneyme-v2`) agar HP pengguna mendapat versi terbaru.
