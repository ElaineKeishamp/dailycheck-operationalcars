# DailyCheck

Aplikasi pemeriksaan harian kendaraan operasional Lintasarta. Driver mengambil
foto kendaraan dan mengirim laporan. Admin mengelola pengguna, kendaraan, serta
laporan pemeriksaan.

## Status aplikasi

Pengembangan dan pengujian menggunakan PostgreSQL serta object storage lokal.
Penyimpanan perusahaan dapat menggunakan Deka BOX Lintasarta melalui API S3.
Koneksi Deka BOX belum diuji karena akses perusahaan belum tersedia.

Baca [urutan pekerjaan pengembang berikutnya](docs/HANDOVER.md#urutan-pekerjaan-pengembang-berikutnya)
dan [catatan serah terima](docs/HANDOVER.md) sebelum deployment. Aturan akses
foto driver selama 7 hari dan retensi admin 30 hari masih perlu diselesaikan.
Jangan menganggap daftar riwayat 7 hari sebagai pembatasan akses foto yang lengkap.

## Kebutuhan

- Node.js 22.12 atau lebih baru. Gunakan versi yang sama saat pengembangan dan deployment.
- PostgreSQL dengan database khusus DailyCheck.
- Object storage privat dengan API S3 dan dukungan presigned PUT/GET.
- HTTPS untuk akses kamera dan lokasi dari HP. Localhost dapat dipakai untuk tes di laptop.

## Persiapan

1. Salin `apps/backend/.env.example` menjadi `apps/backend/.env`.
2. Isi koneksi database, kunci JWT, dan akses storage milik lingkungan tujuan.
   Jangan commit `.env` atau memasukkan secret ke frontend.
3. Dari `apps/backend`, jalankan `npm ci`.
4. Pada database baru yang masih kosong, jalankan `npm run db:init`.
   Untuk database lama, cadangkan dahulu, lalu jalankan `npm run db:migrate`.
5. Buat admin pertama mengikuti [panduan database](docs/DATABASE_SETUP.md).
   Instalasi tidak otomatis membuat akun demo.
6. Dari `apps/frontend`, jalankan `npm ci`.

Jangan menjalankan `seed-passwords.js` pada database perusahaan. Script itu
mengubah password akun demo lokal.

## Menjalankan aplikasi lokal

Jalankan storage terlebih dahulu, lalu backend dan frontend pada terminal terpisah.

```sh
cd apps/backend
npm run dev
```

```sh
cd apps/frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Buka http://127.0.0.1:5173. Frontend memakai `/api`, yang diteruskan Vite ke
backend pada port 3000. `VITE_API_URL` hanya perlu diisi jika alamat API berbeda.
Pemeriksaan database tersedia pada http://127.0.0.1:3000/api/health.

`npm run dev` dan `npm start` backend menjalankan scheduler penghapusan laporan
lama. Periksa bagian retensi pada catatan serah terima sebelum memakai data asli.
Untuk tes tanpa scheduler, jalankan dari `apps/backend`:

```sh
node -e "const app=require('./src/app'); app.listen(3000,'127.0.0.1',()=>console.log('API aktif pada port 3000'));"
```

## Penyimpanan foto

Foto dikirim langsung dari browser ke object storage. Backend memeriksa izin,
menerbitkan URL sementara, dan menyimpan metadata di PostgreSQL. Kamera di dalam
aplikasi tidak memerintahkan penyimpanan ke galeri. Browser tetap memakai memori
dan dapat menyimpan data sementara saat foto diproses atau ditampilkan.

| Lingkungan | Penyimpanan |
| --- | --- |
| Pengembangan dan demo laptop | Server lokal kompatibel S3, dengan binary dan kredensial masing-masing pengembang. Storage harus tetap berjalan selama pengujian. |
| Operasional Lintasarta | Deka BOX yang dikelola perusahaan, setelah konfigurasi dan uji integrasi. |
| Penyedia lain | Layanan kompatibel S3 yang lulus uji operasi yang dipakai aplikasi. |

Cloudflare R2 hanya pilihan tambahan. Aplikasi tidak membutuhkan langganan
Cloudflare. Petunjuknya tersedia jika kelak diperlukan.

- [Konfigurasi storage dan Deka BOX](docs/PHOTO_STORAGE.md)
- [Referensi R2](docs/R2_SETUP.md)

Untuk Deka BOX, minta tim IT menyediakan bucket privat, endpoint HTTPS, region
signing, Access Key ID, Secret Key, dan CORS origin aplikasi. Isi environment S3
backend, restart, lalu jalankan dari `apps/backend`:

```sh
npm run storage:test
```

Tes membuat file uji, memeriksa upload, baca, metadata, CORS, serta penolakan akses
anonim, lalu menghapus file uji. Tes ini tidak menggantikan pemeriksaan hak akses
antar-akun di aplikasi. Perubahan endpoint tidak memindahkan foto lama. Salin
objek beserta thumbnail dengan object key yang sama jika masih diperlukan.

## Pengujian

Dari `apps/backend`, jalankan `npm test`. Tes integrasi membutuhkan database
kosong terpisah bernama `dailycheck_session_test`, melalui `TEST_DATABASE_URL`.
Tanpa variabel itu, tes integrasi dilewati. Jangan gunakan database aplikasi.

Dari `apps/frontend`, jalankan:

```sh
npm test
npm run lint
npm run build
```

## Deployment dan akses

Frontend dapat disajikan sebagai file statis. Backend memerlukan layanan Node.js;
hosting statis saja tidak menjalankan API. Arahkan `/api` ke backend melalui reverse
proxy. Gunakan HTTPS dan konfigurasi storage yang dapat dijangkau HP driver.

Biarkan `TRUST_PROXY` kosong untuk akses langsung. Di belakang reverse proxy, isi
IP atau CIDR proxy yang dipercaya. Login dibatasi 20 kegagalan per IP dalam 15
menit pada satu proses backend. Pembatasnya kembali kosong ketika proses restart.

PWA menyimpan asset aplikasi, tetapi login, laporan, dan upload tetap memerlukan
koneksi internet. Tidak ada antrean upload foto offline. Isi kontak bantuan
perusahaan di `apps/frontend/src/config/support.js` sebelum build jika diperlukan.

## Dokumen

- [Serah terima dan pekerjaan tersisa](docs/HANDOVER.md)
- [Database dan akun admin pertama](docs/DATABASE_SETUP.md)
- [API](API.md)
- [Konfigurasi staging MinIO lama](docs/STAGING_DEPLOYMENT.md)

Dokumen QA dan laporan perbaikan bertanggal merupakan riwayat pemeriksaan pada
versi tersebut. Gunakan catatan serah terima untuk status aplikasi saat ini.
