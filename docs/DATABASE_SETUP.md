# Menyiapkan database lokal dan hosting

Backend memerlukan Node.js yang berjalan sebagai layanan dan PostgreSQL. Frontend
dapat disajikan sebagai file statis hasil build. Hosting statis saja tidak
menjalankan backend Express. Kamera dan lokasi pada HP memerlukan HTTPS.

## Database baru atau lama

Dari apps/backend, jalankan npm install. Isi DATABASE_URL di .env lokal atau
environment hosting dengan database tujuan yang benar. Jangan commit .env.
Perintah database tidak membutuhkan koneksi MinIO atau R2.

| Kondisi | Perintah |
| --- | --- |
| Database PostgreSQL sudah dibuat dan masih kosong | npm run db:init |
| Database aplikasi sudah ada dan perlu diperbarui | npm run db:migrate |

db:init membuat schema empat tabel aplikasi dan menjalankan migrasi tersedia.
Role database harus memiliki izin membuat tabel, indeks, dan extension pgcrypto
yang digunakan schema. Jika hosting membatasi extension, minta administrator
database menyediakan extension yang diperlukan sebelum menjalankan inisialisasi.
Perintah menolak database yang memiliki tabel pada schema public. Tidak ada akun
demo yang dibuat. Gunakan database khusus DailyCheck.

db:migrate memastikan empat tabel utama sudah ada, lalu menerapkan migrasi indeks
slot foto dan session_version. Migrasi bisa dijalankan ulang. Advisory lock mencegah
dua persiapan database berjalan bersamaan. Tidak ada penghapusan data atau perubahan
password dalam migrasi. Database sebagian atau struktur yang tidak sesuai perlu
diperiksa. Indeks unik bisa gagal jika data lama mengandung slot foto ganda;
perintah menampilkan kegagalan, bukan menghapus data tersebut.

## Database lama sebelum hosting

1. Cadangkan database melalui fasilitas hosting atau pg_dump dan pastikan salinan
   dapat dipulihkan.
2. Jadwalkan pembaruan saat aplikasi tidak menerima perubahan data.
3. Periksa tujuan DATABASE_URL. Jalankan npm run db:migrate dengan kredensial yang
   memiliki izin ALTER TABLE dan CREATE INDEX.
4. Jalankan backend dan frontend versi yang sama. Pengguna dari versi sebelum
   session_version perlu login ulang.
5. Periksa /api/health, login, ganti password, daftar kendaraan, dan riwayat.

Restart atau rebuild container tidak memigrasikan database lama. Inisialisasi
PostgreSQL Docker hanya berjalan saat direktori data kosong. db:init memakai
deploy/staging/postgres/001-schema.sql sebagai schema dasar. File db/schema.sql
adalah dump referensi dengan ownership lokal, bukan panduan instalasi hosting.

## Akun admin pertama

Jika database lama dipindahkan, pertahankan akun yang ada. Pada database baru,
administrator database membuat admin pertama. Jangan memakai seed-passwords.js
untuk hosting karena script tersebut berisi kredensial demo lokal.

Buat hash bcrypt dari password sementara pilihan administrator di lingkungan
privat. Masukkan password melalui environment sementara INITIAL_ADMIN_PASSWORD,
lalu jalankan dari apps/backend:

```sh
node -e "require('bcrypt').hash(process.env.INITIAL_ADMIN_PASSWORD,12).then(console.log)"
```

Hapus environment sementara setelah selesai. Pada console database privat, isi
query berikut dengan nama, email, dan hash yang baru dibuat:

```sql
INSERT INTO users (name, email, password_hash, role, must_change_password)
VALUES ('NAMA_ADMIN', 'EMAIL_ADMIN', 'HASH_BCRYPT', 'admin', TRUE);
```

Jangan gunakan placeholder secara literal. Login pertama mewajibkan penggantian
password. Akun driver selanjutnya dibuat melalui Manajemen User. Jangan menyimpan
password atau hash asli di repository atau log publik.

## Environment hosting

Konfigurasikan DATABASE_URL, JWT_SECRET, PORT, dan storage sesuai layanan tujuan.
Untuk PostgreSQL yang mensyaratkan TLS, ikuti konfigurasi penyedia dan gunakan
sertifikat valid; jangan menonaktifkan verifikasi sertifikat. Tanggal pemeriksaan
aplikasi memakai Asia/Jakarta.

TRUST_PROXY kosong untuk akses langsung. Untuk reverse proxy, isi IP/CIDR proxy
tepercaya sesuai jaringan deployment, bukan true tanpa pembatasan. Storage foto
disiapkan terpisah. Migrasi berhasil belum berarti upload foto aktif.

## Verifikasi lokal

Tes integrasi memakai database kosong terpisah dailycheck_session_test melalui
TEST_DATABASE_URL. Tes memeriksa inisialisasi kosong, migrasi berulang yang
mempertahankan akun, dan penolakan inisialisasi pada database berisi tabel.
Jangan menjalankan tes integrasi pada database aplikasi.
