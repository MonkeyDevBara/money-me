# PRD — MoneyMe

**Versi:** 1.0 · **Tanggal:** 2026-11-02 · **Status:** MVP selesai dikembangkan

## 1. Ringkasan
MoneyMe adalah aplikasi pencatatan keuangan pribadi berbasis web dengan tampilan mobile-first. Berjalan sebagai PWA (Progressive Web App) yang 100% offline; semua data tersimpan di perangkat pengguna. Ditujukan untuk orang awam: buka, catat, lihat ringkasan, selesai.

## 2. Tujuan & Non-Tujuan
**Tujuan**
- Mencatat pemasukan/pengeluaran dalam ≤ 3 ketukan dan ≤ 10 detik.
- Berjalan offline sepenuhnya, tanpa akun, tanpa server, tanpa internet.
- Sangat ringan: tanpa framework besar, ukuran total aplikasi target < 300 KB (tanpa gambar), load < 1 detik.
- Mudah dipahami tanpa tutorial.

**Non-Tujuan (di luar cakupan)**
- Sinkronisasi cloud / multi-device, kolaborasi, atau berbagi akun.
- Integrasi bank/e-wallet, scan struk, investasi, utang-piutang.
- Aplikasi native (iOS/Android store).

## 3. Target Pengguna
Pengguna HP (Android/iOS) yang ingin mencatat keuangan pribadi harian, tidak teknis, tidak mau registrasi/login. Bahasa: Indonesia. Mata uang: Rupiah (IDR).

## 4. Keputusan Produk
| Topik | Keputusan |
|---|---|
| Arsitektur | PWA statis (HTML/CSS/JS), tanpa backend |
| Penyimpanan | IndexedDB di browser perangkat |
| Offline | Service Worker meng-cache seluruh aset |
| Tema visual | Putih dengan aksen/lis gold (`#C9A227`), mode gelap opsional |
| Bahasa/Mata uang | Bahasa Indonesia, Rupiah (format `Rp 1.250.000`, tanpa desimal) |
| Stack | Vanilla JS (script klasik, tanpa build step) + CSS |
| Menjalankan lokal | Server statis satu perintah (mis. `npx serve` / `python3 -m http.server`) lalu buka di browser; opsional "Add to Home Screen" |

## 5. Fitur MVP

### F1. Catat Transaksi
- Tipe: **Pemasukan**, **Pengeluaran**, **Transfer** antar dompet.
- Field: nominal (keypad angka besar), kategori, dompet, tanggal (default hari ini), catatan (opsional).
- Edit & hapus transaksi (dengan konfirmasi hapus).
- Riwayat: daftar dikelompokkan per tanggal, filter per bulan, dompet, kategori; pencarian catatan.
- Tombol tambah (FAB) selalu terlihat di layar utama.

### F2. Multi Dompet/Akun
- Dompet bawaan: **Tunai**; pengguna bisa menambah (Bank, E-wallet, dll.), ubah nama/ikon/saldo awal, arsipkan.
- Saldo awal per dompet; saldo berjalan dihitung dari transaksi.
- Transfer antar dompet tidak dihitung sebagai pemasukan/pengeluaran di laporan.
- Total saldo semua dompet ditampilkan di beranda.

### F3. Kategori
- Kategori bawaan (Makan, Transport, Belanja, Tagihan, Hiburan, Kesehatan, Pendidikan, Lainnya; Gaji, Bonus, Hadiah, dll.).
- Tambah/ubah/arsipkan kategori kustom (nama + ikon emoji).

### F4. Budget Bulanan per Kategori
- Set batas bulanan per kategori pengeluaran.
- Progress bar: hijau (<80%), kuning (80–100%), merah (>100%); tampil sisa/terlampaui.
- Budget berlaku tiap bulan sampai diubah (tidak perlu diisi ulang).

### F5. Laporan & Grafik
- Pilih bulan (prev/next).
- Ringkasan: total pemasukan, pengeluaran, selisih (net).
- Grafik donat/bar pengeluaran per kategori.
- Tren 6 bulan terakhir (pemasukan vs pengeluaran).
- Grafik digambar dengan SVG/Canvas buatan sendiri (tanpa library berat).

### F6. Kunci PIN
- PIN 4 digit opsional (dikunci 30 detik setelah 5x salah), diaktifkan di Pengaturan.
- Diminta saat aplikasi dibuka / kembali dari background > 1 menit.
- PIN disimpan sebagai hash (PBKDF2/SHA-256 via Web Crypto + salt), bukan teks asli.
- Lupa PIN: satu-satunya jalan adalah reset aplikasi (menghapus semua data) — ditampilkan jelas saat mengaktifkan PIN.
- Catatan: ini kunci tampilan, bukan enkripsi data di penyimpanan.

### F7. Tema Gelap/Terang
- Opsi: Ikuti sistem (default) / Terang / Gelap. Disimpan di pengaturan.

### F8. Backup & Pulihkan
- Export semua data ke file `.json` dan pulihkan dari file (validasi isi + konfirmasi sebelum menimpa).
- Pengingat backup di Beranda bila belum backup > 30 hari (setelah ≥ 10 transaksi).
- Pemulihan juga tersedia di layar sambutan.

## 6. Navigasi & Layar
Bottom navigation 4 tab: **Beranda · Riwayat · Laporan · Lainnya**.
- **Beranda:** total saldo, ringkasan bulan ini, daftar dompet, budget teratas, 5 transaksi terakhir, FAB (+).
- **Riwayat:** daftar transaksi + filter/cari.
- **Laporan:** grafik & ringkasan (F5).
- **Lainnya:** Dompet, Kategori, Budget, Tema, PIN, Tentang, Reset data.
- **Form Transaksi:** bottom sheet dengan keypad.

## 7. Alur Utama
1. **Pertama buka:** layar sambutan singkat → buat dompet "Tunai" (saldo awal opsional) → Beranda. Tanpa login.
2. **Catat pengeluaran:** Beranda → (+) → nominal → kategori → Simpan.
3. **Cek budget:** Beranda/Lainnya → Budget → lihat progress.
4. **Lihat laporan:** tab Laporan → pilih bulan.

## 8. Model Data (IndexedDB)
- `wallets`: id, name, icon, color, initialBalance, archived, createdAt
- `categories`: id, name, icon, color, type (`income`|`expense`), archived
- `transactions`: id, type (`income`|`expense`|`transfer`), amount (integer rupiah), walletId, toWalletId?, categoryId?, date (ISO), note, createdAt, updatedAt
  - Index: `date`, `walletId`, `categoryId`
- `budgets`: id, categoryId, amount
- `settings`: key/value (theme, pinHash, pinSalt, onboarded, schemaVersion)

Aturan: nominal disimpan sebagai integer (tanpa floating point); saldo dompet dihitung dari `initialBalance + Σ transaksi` (tidak disimpan terpisah, supaya konsisten).

## 9. Persyaratan Non-Fungsional
- **Performa:** first load < 1 dtk di HP kelas menengah; interaksi terasa instan; daftar riwayat dirender bertahap (virtual/paginated) agar tetap ringan dengan ribuan transaksi.
- **Offline:** setelah kunjungan pertama, seluruh fitur jalan tanpa internet. Service Worker versioned agar update aset aman.
- **Ukuran:** tanpa dependensi runtime; semua aset lokal (tanpa CDN/font eksternal).
- **Kompatibilitas:** Chrome/Android & Safari/iOS versi 2 tahun terakhir; layout 360–430 px, tetap rapi di desktop (dibatasi lebar ~480 px, dipusatkan).
- **Aksesibilitas:** target sentuh ≥ 44 px, kontras memadai di kedua tema, label jelas.
- **Privasi:** tidak ada pelacakan, analitik, atau request jaringan keluar.
- **Persistensi:** meminta `navigator.storage.persist()` agar browser tidak menghapus data otomatis.

## 10. Risiko & Catatan Penting
| Risiko | Mitigasi |
|---|---|
| **Data hanya di browser — hilang jika data situs dihapus / ganti HP** | Fitur **Backup & Pulihkan (F8)** dimasukkan ke MVP + pengingat backup |
| iOS Safari bisa menghapus data situs yang lama tidak dibuka | Anjurkan "Add to Home Screen" + `storage.persist()` + backup berkala |
| PIN hanya kunci UI | Dijelaskan di UI; enkripsi data ditunda ke fase berikutnya |
| Service Worker butuh HTTPS atau `localhost` | Dijalankan via `localhost`; akses dari HP di WiFi yang sama perlu HTTPS/instruksi khusus — dibahas di README |

## 11. Di Luar MVP (Fase Berikutnya)
Transaksi berulang, target tabungan, multi-mata uang, enkripsi data, kategori sub-level, lampiran foto struk.

## 12. Kriteria Keberhasilan
- Catat transaksi dalam ≤ 10 detik oleh pengguna baru tanpa panduan.
- Aplikasi berfungsi penuh dalam mode pesawat setelah kunjungan pertama.
- Skor Lighthouse (Performance, PWA, Accessibility) ≥ 90.
- Ukuran transfer first load < 300 KB.
- 1.000+ transaksi tanpa lag terasa.

## 13. Rencana Tahapan
1. **Fondasi:** struktur proyek, shell PWA, service worker, layer IndexedDB, tema.
2. **Inti:** dompet, kategori, form transaksi, riwayat.
3. **Insight:** budget, laporan & grafik.
4. **Keamanan & polish:** PIN, onboarding, empty state, aksesibilitas.
5. **QA & dokumentasi:** uji offline, uji di HP nyata, README cara menjalankan.

## 14. Keputusan (sebelumnya pertanyaan terbuka)
1. Export/Import JSON → **masuk MVP** (F8).
2. Kategori & dompet bawaan → memakai daftar di F2/F3; bisa diubah pengguna.
3. Periode bulan → **tanggal 1 s/d akhir bulan**. "Tanggal gajian" kustom masuk fase berikutnya.
