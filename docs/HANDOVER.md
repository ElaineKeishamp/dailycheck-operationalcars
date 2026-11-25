# Catatan serah terima DailyCheck

Diperbarui 25 November 2026.

## Penyimpanan perusahaan

Pengembangan memakai storage lokal kompatibel S3. Cloudflare R2 tidak diwajibkan.
Perusahaan dapat mengarahkan penyimpanan ke Deka BOX Lintasarta. Tim IT perlu
menyediakan bucket privat, endpoint HTTPS yang dapat dijangkau HP driver, region
signing, Access Key ID, Secret Key, dan CORS origin aplikasi.

Isi variabel S3 pada backend mengikuti [panduan storage](PHOTO_STORAGE.md), lalu
restart backend, jalankan `npm run storage:test`, dan uji alur foto menggunakan
akun driver serta admin. Akses Deka BOX belum tersedia dalam pengujian lokal,
sehingga integrasinya belum dinyatakan selesai. Foto lama tidak otomatis pindah
ketika endpoint diganti.

## Aturan foto yang perlu diselesaikan

| Kebutuhan | Status |
| --- | --- |
| Mengambil foto di aplikasi tanpa perintah simpan ke galeri | Sudah tersedia. Browser tetap memakai data sementara. |
| Upload langsung ke storage privat | Sudah tersedia dan diuji dengan storage lokal. |
| Pengelompokan objek berdasarkan tahun, bulan, tanggal, pelapor, dan kendaraan | Sudah tersedia. |
| Daftar riwayat driver 7 hari | Sudah tersedia. Batas harinya perlu disesuaikan dengan kebijakan yang disepakati. |
| Driver membuka foto riwayat dan kehilangan akses setelah 7 hari | Belum lengkap. Perlu tampilan foto dan pemeriksaan umur laporan pada backend. |
| Admin melihat foto seluruh driver | Sudah tersedia untuk laporan yang masih tersimpan. |
| Reset foto admin | Perlu keputusan perusahaan: umur 30 hari atau pergantian bulan kalender. Keduanya berbeda. |

Usulan yang dibahas adalah akses driver selama 7 hari dan penyimpanan foto selama
30 hari. Pastikan pembimbing menyetujui batas tersebut sebelum penerapan. Menghapus
semua foto setiap tanggal 1 dapat membuat foto akhir bulan hilang sebelum 7 hari.

Scheduler yang ada berjalan 10 detik setelah startup `server.js`, lalu setiap
24 jam. Scheduler menghapus foto serta laporan lama, bukan hanya menyembunyikannya.
Setelah perbaikan, kegagalan hapus foto atau thumbnail mempertahankan catatan
supaya dapat dicoba ulang. Laporan yang masih memiliki catatan foto tidak dihapus.

Jangan menyalakan lifecycle penghapusan terpisah di storage sebelum aturan aplikasi
dan sinkronisasi databasenya ditetapkan. Untuk tes tanpa scheduler, ikuti perintah
pada README. Jangan menggunakan data operasional pada demo laptop.

## Urutan pekerjaan pengembang berikutnya

| Urutan | Pekerjaan | Syarat selesai |
| --- | --- | --- |
| 1 | Sepakati retensi dengan pembimbing. | Ada keputusan tertulis tentang 7 hari akses driver, umur 30 hari atau bulan kalender untuk admin, zona waktu WIB, serta apakah catatan laporan ikut dihapus. |
| 2 | Lengkapi pembukaan foto riwayat driver. | Driver hanya dapat membuka foto laporannya sendiri selama masa akses. Backend memeriksa pemilik dan umur laporan setiap menerbitkan URL foto; menyembunyikan tombol saja tidak cukup. |
| 3 | Perbaiki batas tanggal riwayat. | Definisi tujuh hari diterapkan konsisten. Query saat ini memakai hari ini dikurangi tujuh hari secara inklusif, sehingga bisa mencakup delapan tanggal. Tambahkan tes pada batas tanggal dan pergantian hari WIB. |
| 4 | Sesuaikan scheduler penghapusan. | Foto asli, thumbnail, serta catatan database mengikuti kebijakan yang disepakati. Kegagalan storage dapat dicoba ulang tanpa kehilangan referensi. Jadwal berjalan pada hosting dan diuji dengan data sementara. |
| 5 | Integrasikan Deka BOX perusahaan. | Tim IT memberi endpoint, region, bucket privat, kredensial khusus aplikasi, dan CORS. Uji storage serta akses driver/admin lulus. Foto lama yang masih dibutuhkan disalin dengan object key yang sama. |
| 6 | Siapkan deployment. | Layanan Node.js, PostgreSQL, frontend, HTTPS, reverse proxy, migrasi, dan pemulihan cadangan diuji. Konfigurasi Compose lama tidak lagi mewajibkan MinIO jika memakai Deka BOX. |
| 7 | Uji pada HP operasional. | Kamera/lokasi, semua foto wajib, gangguan jaringan, konfirmasi ulang, refresh, submit, dan pembukaan laporan berhasil diuji. Instalasi serta pembaruan PWA diperiksa di perangkat yang digunakan perusahaan. |
| 8 | Tinjau dependency pengembangan. | Advisori moderate pada jalur nodemon/minimatch dan build PWA diperiksa. Pembaruan dipilih setelah meninjau kompatibilitas; tes, lint, dan build diulang. |
| 9 | Selesaikan konfigurasi perusahaan. | Admin operasional tersedia, akun tes tidak ikut dipakai di produksi, kontak bantuan benar, serta kunci JWT dan akses database/storage terpisah dari pengembangan. |

Jika backend dijalankan pada beberapa proses atau server, gunakan pembatas login
yang berbagi hitungan antarproses. Saat ini hitungan tersimpan dalam memori satu
proses dan hilang saat restart. Perubahan ini diperlukan untuk deployment dengan
beberapa instance; bukan syarat demo satu proses di laptop.

Pengembang tidak perlu menambah fitur bisnis baru untuk menyelesaikan daftar ini.

## Pemeriksaan sebelum pemasangan

1. Tetapkan kebijakan retensi bersama pembimbing dan selesaikan akses foto riwayat.
2. Siapkan Deka BOX atau storage perusahaan lain dan uji koneksinya.
3. Siapkan PostgreSQL, cadangan yang dapat dipulihkan, serta layanan backend Node.js.
4. Jalankan migrasi, buat admin pertama, dan gunakan kunci JWT serta kredensial khusus deployment.
5. Pasang HTTPS dan reverse proxy `/api`. Batasi `TRUST_PROXY` ke alamat proxy yang dipercaya.
6. Isi kontak bantuan perusahaan bila akan digunakan. Hapus akun tes dari lingkungan operasional.
7. Uji di HP driver: izin kamera/lokasi, ambil semua foto wajib, upload, submit,
   buka ulang laporan, dan pastikan akun lain tidak mendapat akses.
8. Periksa dependency dan jalankan tes sebelum build yang akan dipasang.

Konfigurasi Docker staging lama masih membawa MinIO. Konfigurasi itu perlu
disesuaikan jika storage dipindahkan ke Deka BOX; mengganti `.env` saja belum
menghapus ketergantungan service MinIO pada deployment tersebut.

## Pemeriksaan 25 November 2026

- Seluruh 49 tes backend lulus tanpa tes yang dilewati. Cakupannya autentikasi, perubahan role/status/password, validasi,
  migrasi PostgreSQL terisolasi, pembatas login, serta kegagalan penghapusan storage.
- Delapan tes frontend untuk tanggal WIB dan keadaan gagal riwayat lulus.
- Lint dan build frontend lulus setelah pembaruan dependency.
- Enam pemeriksaan storage lokal lulus: akses bucket, CORS, upload/metadata,
  pembacaan bertanda tangan, penolakan akses anonim, dan penghapusan file uji.
- Pemeriksaan browser lulus untuk login/logout admin dan driver, dashboard,
  navigasi laporan/pengguna/kendaraan, daftar kendaraan driver, serta riwayat.
  Pemeriksaan ini memakai data lokal dan tidak mengambil foto kamera fisik.
- Audit dependency runtime backend dan frontend melaporkan nol advisori.
- Masih ada advisori tingkat moderate pada dependency pengembangan: jalur
  nodemon/minimatch dan vite-plugin-pwa/workbox-build/glob/minimatch. Pembaruan
  otomatis yang meminta perubahan di luar rentang versi tidak diterapkan.
- Pengujian kamera fisik, izin lokasi di HP, instalasi/update PWA di perangkat nyata,
  dan koneksi Deka BOX belum dilakukan dalam pemeriksaan ini.

Hasil tes lokal tidak berarti aplikasi bebas seluruh kesalahan atau sudah mendapat
persetujuan penggunaan operasional. Dokumen QA lama disimpan sebagai riwayat;
status sebelum deployment mengikuti catatan ini.
