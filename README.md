# DailyCheck - Setup singkat

Panduan singkat untuk menjalankan project lokal (backend + frontend) agar tim frontend bisa mengerjakan fitur Users/Admin.

## Persyaratan
- Node.js (18+ direkomendasikan)
- PostgreSQL (jika ingin terhubung ke DB lokal)

## Struktur penting
- `apps/backend` — server Express + koneksi DB
- `apps/frontend` — aplikasi Vite + React

## Siapkan environment
- Salin `apps/backend/.env.example` menjadi `apps/backend/.env` (jangan commit `.env`).
- Ganti semua placeholder dengan nilai lokal atau rahasia development milik Anda.

```
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE
JWT_SECRET=replace-with-a-random-secret

# MinIO Object Storage
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=replace-me
S3_SECRET_KEY=replace-me
S3_BUCKET_NAME=dailycheck-photos
```

## MinIO Object Storage (Lokal & Testing)
1. **Jalankan MinIO Server**:
   ```bash
   minio.exe server C:\minio-data --console-address ":9001"
   ```
   * S3 API: `http://localhost:9000`
   * Web Dashboard: `http://localhost:9001`
   * Gunakan access key dan secret key yang Anda set untuk server MinIO lokal.

2. **Uji Coba Otomatis MinIO (Upload & Presigned View URL)**:
   ```bash
   cd apps/backend
   node test-minio.js
   ```

## Menjalankan backend (dev)

```bash
cd apps/backend
npm install
npm run dev
```

Server berjalan di `http://localhost:3000` (base API `http://localhost:3000/api`).

## Menjalankan frontend (dev)

```bash
cd apps/frontend
npm install
npm run dev
```

Frontend akan memanggil API pada `VITE_API_URL` atau fallback ke `http://localhost:3000/api`.

## PWA installability

Frontend dapat dibangun sebagai Progressive Web App yang installable. Implementasi saat ini online-first:

- App shell dan asset statis build dapat di-cache oleh service worker.
- Login, data kendaraan, daily check, upload foto MinIO, dan submit laporan tetap membutuhkan koneksi internet.
- Tidak ada offline upload queue, IndexedDB, background sync, push notification, atau cache response API.

Build dan uji preview production:

```bash
cd apps/frontend
npm run build
npm run preview
```

Gunakan preview production untuk memeriksa manifest, service worker, install prompt, dan update prompt. Pada localhost, service worker dapat diuji langsung di Chrome. Untuk perangkat nyata atau deployment, gunakan HTTPS supaya kamera, geolocation, dan PWA installability bekerja sesuai kebijakan browser.

Jika service worker lama mengganggu pengujian, buka Chrome DevTools -> Application -> Service Workers, pilih Unregister, lalu buka Cache Storage dan hapus cache aplikasi terkait sebelum reload.

## Branch & cara kerja tim
- Kode fitur validation ada di branch `feature/validation`. Minta rekan frontend untuk checkout branch itu:

```bash
git fetch origin
git checkout -b feature/validation origin/feature/validation
```

Setelah checkout, jalankan `npm install` di `apps/backend` lalu `npm run dev`.

## Endpoint penting untuk frontend Users/Admin
- `POST /api/auth/login` — login
- `POST /api/auth/change-password` — ganti password (butuh Authorization)
- `GET /api/admin/users` — daftar users
- `POST /api/admin/users` — buat user
- `PATCH /api/admin/users/:id` — update user
- `PATCH /api/admin/users/:id/reset-password` — reset password
- `GET /api/admin/vehicles` — daftar kendaraan
- `POST /api/admin/vehicles` — buat kendaraan

Lihat `API.md` untuk detail tambahan.

## Testing manual cepat (curl)

Login contoh:
```
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

## Postman
Koleksi Postman minimal disertakan di `docs/postman_collection.json`.
