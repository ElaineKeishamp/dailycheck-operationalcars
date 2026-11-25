# Penyimpanan foto dengan Cloudflare R2

R2 adalah salah satu pilihan. Jika perusahaan sudah memiliki Deka BOX Lintasarta
atau object storage lain, baca [panduan pemilihan storage](PHOTO_STORAGE.md)
sebelum membuat akun atau subscription tambahan.

## Akun untuk pengembangan dan operasional

Untuk mencoba aplikasi, pengembang dapat menggunakan akun Cloudflare pribadi dan
bucket khusus berisi foto uji. Pemilik akun bertanggung jawab atas penggunaan dan
tagihan. R2 memerlukan aktivasi subscription melalui checkout; kuota gratis bukan
jaminan seluruh penggunaan gratis. Periksa harga dan pemakaian di dashboard.

Gunakan data contoh untuk uji coba pribadi. Pemakaian foto operasional perusahaan
pada akun pribadi perlu persetujuan perusahaan. Untuk serah terima, gunakan akun,
bucket, dan penagihan yang dikelola perusahaan.

Setiap orang yang mencoba proyek menyiapkan bucket dan kredensialnya sendiri.
Jangan menaruh kredensial akun pengembang di README, Git, frontend, atau screenshot.
Akun driver tetap akun DailyCheck; driver tidak perlu akun Cloudflare.

## 1. Siapkan bucket privat

1. Masuk ke Cloudflare Dashboard menggunakan akun Anda.
2. Buka Storage & databases > R2 > Overview dan aktifkan subscription R2.
3. Buat bucket, misalnya `dailycheck-photos-dev`, dengan storage class Standard.
4. Biarkan public access nonaktif. Tidak perlu mengaktifkan r2.dev atau custom
   domain publik untuk alur presigned URL.
5. Kembali ke R2 Overview > API Tokens > Manage. Pilih Create Account API token
   atau Create User API token sesuai akses akun. Beri nama misalnya
   `dailycheck-dev`, pilih Object Read & Write, lalu Apply to specific buckets
   only dan pilih bucket DailyCheck. Buat token.
   Simpan Access Key ID dan Secret Access Key secara privat. Secret hanya
   ditampilkan saat pembuatan. Salin juga S3 API endpoint dari dashboard bucket.

Buat bucket melalui dashboard terlebih dahulu. Aplikasi memiliki fallback untuk
membuat bucket yang belum ada, tetapi token Object Read & Write tidak dimaksudkan
untuk administrasi bucket. Jika mendapat 403, periksa endpoint, bucket, dan scope
token; jangan langsung membuka bucket ke publik atau memberi akses administrator.

## 2. Konfigurasi backend

Salin `apps/backend/.env.example` ke `apps/backend/.env` jika belum ada. Pertahankan
konfigurasi database dan JWT yang sudah digunakan. Ganti SEMUA endpoint storage
berikut, termasuk kedua endpoint khusus yang mengalahkan nilai `S3_ENDPOINT`:

```dotenv
S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
S3_INTERNAL_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
S3_PUBLIC_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY=YOUR_R2_ACCESS_KEY_ID
S3_SECRET_KEY=YOUR_R2_SECRET_ACCESS_KEY
S3_BUCKET_NAME=dailycheck-photos-dev
```

Gunakan endpoint yang benar-benar ditampilkan dashboard. Bucket dengan pengaturan
jurisdiction tertentu memakai endpoint khusus. `S3_PUBLIC_ENDPOINT` di aplikasi
berarti alamat yang dapat dijangkau browser, bukan izin akses publik ke bucket.
Jangan tambahkan nama bucket ke endpoint. Jangan gunakan prefix `VITE_` untuk secret.
Restart backend setelah mengubah `.env`.

Tidak perlu memasang aplikasi Cloudflare, Wrangler, atau mengganti SDK backend.
Proyek sudah memakai AWS SDK untuk API S3. Access Key ID dan Secret Access Key
adalah kredensial S3; jangan menggantinya dengan Global API Key, password login
Cloudflare, atau nilai API token yang berbeda dari pasangan kredensial S3.

Jika dibantu memasang konfigurasi, masukkan secret langsung ke `.env` lokal.
Cukup beri tahu nama bucket dan bahwa konfigurasi sudah diisi; tidak perlu
mengirim password Cloudflare atau Secret Access Key melalui chat.

## 3. Izinkan browser melalui CORS

Pada Settings bucket > CORS Policy, masukkan:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "http://127.0.0.1:5173"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "x-amz-*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Tambahkan origin HTTPS aplikasi yang sebenarnya untuk deployment atau tunnel uji
HP. Origin mencakup protokol, hostname, dan port, tanpa path. Preview Vite di port
lain juga perlu origin tersendiri. CORS tidak menggantikan autentikasi.

## 4. Verifikasi koneksi dan alur aplikasi

Dari `apps/backend`, jalankan:

```sh
npm run storage:test
```

Nama script masih historis; pengujiannya menggunakan konfigurasi S3 di `.env`,
sehingga juga dapat dipakai untuk R2. Pengujian mengunggah PNG kecil ke prefix
`inspections/storage-smoke-test/`, memeriksa CORS, metadata, isi file, penolakan
akses anonim, lalu menghapus file uji. Jika penghapusan gagal, hapus objek uji
tersebut dari dashboard. Untuk origin selain localhost:5173, set variabel
`STORAGE_TEST_ORIGIN` sebelum menjalankan pengujian.

Alias `npm run storage:test` menjalankan `node test-minio.js`; keduanya setara.
Gunakan bucket khusus tes karena pengujian membuat dan menghapus objek uji.
Pengujian tidak menghapus foto laporan yang sudah ada.

Jika gagal, periksa:

| Gejala | Yang diperiksa |
| --- | --- |
| HTTP 403 | Bucket sudah dibuat, pasangan access/secret benar, scope token mencakup bucket, endpoint dan region benar. |
| Uji server berhasil tetapi upload browser gagal | CORS mencakup origin persis yang dibuka, termasuk protokol dan port. |
| URL masih menuju localhost:9000 | Semua endpoint S3 di `.env` sudah diganti dan backend sudah direstart. |
| Foto lama tidak muncul setelah pindah storage | Foto lama belum disalin dengan object key yang sama; perubahan `.env` tidak memigrasikan objek. |

Jangan menyalakan lifecycle hapus otomatis dulu. Aturan akses driver 7 hari dan
retensi admin 30 hari harus diterapkan serta diuji bersama sinkronisasi database.
Backend yang dijalankan melalui `server.js` saat ini memiliki scheduler lama
yang juga menghapus laporan; itu berbeda dari sekadar membatasi akses foto.

Jalankan backend dan frontend mengikuti README utama. Uji login driver, ambil
foto, konfirmasi upload, muat ulang riwayat, penghapusan, dan pembatasan akses
antar-akun. Test storage saja tidak membuktikan otorisasi API benar.

Foto dikirim langsung dari browser ke R2 menggunakan presigned URL. Backend
mengurus izin, tiket upload, metadata, dan konfirmasi. Jangan proxy lalu lintas
foto R2 melalui backend. URL sementara dapat dipakai siapa pun yang memilikinya
selama belum kedaluwarsa; jangan mempublikasikan URL tersebut.

Alur kamera tidak sengaja menyimpan salinan ke galeri dan aplikasi tidak memiliki
antrean foto offline. Browser tetap memproses data sementara; ini bukan jaminan
tidak ada jejak lokal atau pencegahan screenshot.

## 5. Serah terima ke perusahaan

1. Siapkan bucket privat, CORS, dan token baru pada akun yang dikelola perusahaan.
2. Jika foto lama perlu dipertahankan, salin objek ke bucket perusahaan dengan
   object key yang sama, termasuk thumbnail. Cadangkan data sebelum cutover.
3. Ganti endpoint, kredensial, dan nama bucket pada environment backend deployment.
   Database menyimpan object key; mengganti konfigurasi tidak memindahkan file.
4. Restart backend, ulangi uji storage dan alur aplikasi, termasuk foto lama.
5. Setelah verifikasi, cabut token lama khusus aplikasi. Tangani foto yang masih
   berada di akun pribadi mengikuti kesepakatan perusahaan.

Panduan ini tidak mengubah deployment staging MinIO yang sudah ada. Konfigurasi
Docker Compose dan reverse proxy staging perlu ditinjau sebelum deployment R2.

## Referensi resmi

- Mulai dan aktivasi: https://developers.cloudflare.com/r2/get-started/
- Harga: https://developers.cloudflare.com/r2/pricing/
- Kredensial: https://developers.cloudflare.com/r2/api/tokens/
- CORS: https://developers.cloudflare.com/r2/buckets/cors/
- Presigned URL: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
