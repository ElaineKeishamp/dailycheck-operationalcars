# Laporan lokal: persiapan database dan tampilan

> Dokumen riwayat. Isinya mencatat pemeriksaan atau rancangan pada saat ditulis.
> Status dan persiapan deployment terbaru ada di [catatan serah terima](HANDOVER.md).

## Poin 5: database sebelum hosting

Tersedia dua perintah dari apps/backend:

- npm run db:init untuk database baru yang masih kosong.
- npm run db:migrate untuk database aplikasi yang sudah ada.

Inisialisasi menolak database berisi tabel. Migrasi session_version kini bisa
dijalankan ulang; perintah menjalankan dua migrasi yang tersedia dengan advisory
lock. Tidak ada penghapusan data, reset password, atau pembuatan akun demo.
Panduan [DATABASE_SETUP.md](DATABASE_SETUP.md) menjelaskan backup, tujuan koneksi,
admin pertama, kebutuhan hosting Node.js/PostgreSQL, dan konfigurasi proxy.

PASS: database kosong berhasil diinisialisasi, migrasi diulang tanpa mengubah
akun, dan inisialisasi pada database berisi data ditolak. Seluruh 44 tes backend
lulus melalui HTTP dan PostgreSQL lokal terpisah. Database aplikasi dan hosting
belum diperbarui oleh pekerjaan ini.

## Poin 6: tampilan yang konsisten dan sederhana

Warna utama tetap biru #1E40AF. Navy dipakai untuk identitas dan navigasi, latar
terang untuk area kerja, dan hijau/amber/merah untuk status. Font Plus Jakarta Sans
Variable disimpan dalam bundle aplikasi; ketergantungan runtime Google Fonts
dihapus. Font disertakan dalam precache PWA yang sudah ada.

Perubahan mencakup login, bantuan password, ganti password, header driver,
sidebar/header admin, ringkasan dashboard, tabel, input, tombol, badge, dan modal.
Jarak dan hierarki teks dirapikan. Label formulir dan filter dihubungkan dengan
input. Modal memiliki role dialog, focus trap, dukungan Escape, dan ukuran yang
dibatasi agar tetap masuk layar. Ukuran input HP 16 piksel untuk mengurangi zoom
otomatis browser. Tampilan menghormati prefers-reduced-motion.

Ikon kalender/notifikasi tanpa aksi dan tautan profil tanpa halaman dihapus dari
navigasi. Tidak ada menu atau fitur bisnis baru. Nomor WhatsApp contoh tidak lagi
ditampilkan sebagai kontak asli; administrator dapat mengisi kontak perusahaan
yang benar di apps/frontend/src/config/support.js sebelum build berikutnya.

## Verifikasi tampilan

- PASS: lint, build production, dan 8 tes frontend.
- PASS: browser dengan data sintetis lokal, desktop 1280x900 dan HP 390x844.
- PASS: login/logout admin dan driver, navigasi empat menu admin, tab dashboard,
  daftar/detail laporan, pembukaan formulir pengguna/kendaraan, tutup dengan
  Escape, dan fokus Tab berputar di dalam modal.
- PASS: dokumen driver pada viewport 390 mempunyai scrollWidth 390; modal HP
  mempunyai batas kiri 12 dan kanan 378 piksel, sehingga tidak keluar layar.

Tidak ada kontak WhatsApp, lokasi asli, kamera, atau storage foto yang digunakan
dalam fixture browser. Uji submit foto tetap menunggu penyimpanan disiapkan.

Pemeriksaan tampilan dilakukan pada desktop dan ukuran layar HP. Hasil tersebut
tidak menggantikan pengujian kamera, lokasi, dan upload pada perangkat driver.
