# DailyCheck - Setup singkat

Panduan singkat untuk menjalankan project lokal (backend + frontend) agar tim frontend bisa mengerjakan fitur Users/Admin.

## Persyaratan
- Node.js (18+ direkomendasikan)
- PostgreSQL (jika ingin terhubung ke DB lokal)

## Struktur penting
- `apps/backend` — server Express + koneksi DB
- `apps/frontend` — aplikasi Vite + React

## Siapkan environment
- Salin berkas `.env` pada `apps/backend` (jangan commit `.env`):

```
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/dailycheck_dev
JWT_SECRET=rahasia_tes

# MinIO Object Storage
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=dailycheck-photos
```

## MinIO Object Storage (Lokal & Testing)
1. **Jalankan MinIO Server**:
   ```bash
   minio.exe server C:\minio-data --console-address ":9001"
   ```
   * S3 API: `http://localhost:9000`
   * Web Dashboard: `http://localhost:9001` (Credentials: `minioadmin` / `minioadmin`)

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
