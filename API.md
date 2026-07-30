# API Documentation - Daily Check App

Base URL (development): `http://localhost:3000/api`

Semua endpoint yang butuh login harus kirim header:

---

## POST /auth/login
Login untuk semua role (admin & driver, termasuk akun Driver Pengganti).

**Request Body:**
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

**Response Sukses (200):**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "name": "Admin Testing",
    "email": "admin@test.com",
    "role": "admin",
    "is_shared_account": false,
    "must_change_password": false
  }
}
```

**Response Gagal:**
- `400` — email/password kosong
- `401` — email tidak ditemukan / password salah
- `403` — akun dinonaktifkan (`status: inactive`)

**Catatan penting buat frontend:**
- Simpan `token`, kirim ulang di header `Authorization: Bearer <token>` di semua request yang butuh login
- Cek `role` → arahkan ke tampilan **admin** atau **driver**
- Cek `is_shared_account` → kalau `true`, tampilkan field tambahan "Nama Driver" (wajib diisi) di form daily check
- Cek `must_change_password` → kalau `true`, **paksa redirect** ke halaman "Ganti Password" dulu, jangan izinkan akses halaman lain sampai user ganti password

---

## Alur Lupa Password

1. User klik "Lupa Password?" di halaman login → tampilkan info statis: "Silakan hubungi admin untuk reset password" (tidak perlu panggil API apa pun di step ini)
2. User hubungi admin di luar sistem (WA/verbal)
3. Admin reset lewat `PATCH /admin/users/:id/reset-password`
4. Admin kasih tau password sementara ke user secara manual
5. User login pakai email + password sementara → `POST /auth/login`
6. Response login berisi `must_change_password: true`
7. Frontend WAJIB redirect paksa ke halaman Ganti Password (tidak boleh ke dashboard dulu)
8. User isi password baru + konfirmasi (konfirmasi dicek di frontend saja)
9. Submit ke `POST /auth/change-password`
10. Setelah sukses, baru redirect ke dashboard sesuai role

---

## POST /auth/change-password
User ganti password sendiri. WAJIB dipanggil kalau `must_change_password = true` dari hasil login.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "old_password": "passwordLamaAtauSementara",
  "new_password": "passwordBaruSayaSendiri123"
}
```

**Response Sukses (200):**
```json
{ "message": "Password berhasil diganti" }
```

**Response Gagal:**
- `400` — password baru kurang dari 6 karakter
- `401` — password lama salah

**Catatan buat frontend:**
- Setelah sukses, redirect ke dashboard/halaman utama sesuai role

---

## GET /vehicles
List mobil aktif untuk pilihan kendaraan driver. Endpoint ini bisa diakses oleh semua user yang sudah login, baik `driver` maupun `admin`.

**Headers:** `Authorization: Bearer <token>`

**Response Sukses (200):**
```json
{
  "vehicles": [
    {
      "vehicle_id": "uuid",
      "plate_number": "BK 1234 AB",
      "brand": "Toyota",
      "model": "Avanza",
      "status": "active"
    }
  ]
}
```

**Response jika tidak ada mobil aktif (200):**
```json
{
  "vehicles": []
}
```

**Catatan:**
- Hanya mengembalikan mobil dengan `status: active`
- Data diurutkan berdasarkan `plate_number` ascending
- Endpoint ini tidak bisa dipakai untuk tambah, edit, atau menonaktifkan mobil
- Untuk token kosong/tidak valid, gunakan response auth middleware yang sudah ada

---

## POST /daily-checks
Driver mulai sesi checking harian.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "vehicle_id": "uuid-mobil",
  "actual_driver_name": "Nama Asli (wajib jika akun Driver Pengganti)",
  "gps_lat": -6.200000,
  "gps_long": 106.816666,
  "gps_address": "opsional, alamat hasil reverse-geocode"
}
```

**Response Sukses (201):**
```json
{ "daily_check": { "daily_id": "...", "status": "incomplete", ... } }
```

**Response Gagal:**
- `400` — vehicle_id kosong / nama driver kosong padahal akun shared
- `404` — mobil tidak ditemukan/tidak aktif
- `409` — mobil ini sudah di-checking hari ini

---

## GET /daily-checks/active
Ambil sesi checking hari ini yang masih bisa dilanjutkan untuk kendaraan tertentu.

**Headers:** `Authorization: Bearer <token>`

**Query params:**
- `vehicle_id` - wajib.

**Response jika ada sesi aktif (200):**
```json
{
  "daily_check": {
    "daily_id": "uuid",
    "vehicle_id": "uuid",
    "status": "incomplete",
    "vehicle": {
      "plate_number": "BK 1234 AB",
      "brand": "Toyota",
      "model": "Avanza"
    }
  }
}
```

**Response jika tidak ada sesi aktif (200):**
```json
{ "daily_check": null }
```

Endpoint ini hanya mengembalikan sesi milik user yang sedang login dan hanya untuk status `incomplete`.

---

## Alur Upload Foto MinIO (Driver)

Upload foto driver memakai satu flow presigned MinIO:

1. Driver meminta URL upload ke backend.
2. Driver mengirim Blob/JPEG langsung ke MinIO dengan `PUT`.
3. Driver mengonfirmasi key ke backend.
4. Backend memverifikasi object ada di MinIO, lalu menyimpan row `check_photos`.

Frontend tidak mengirim `multipart/form-data` ke backend untuk upload foto.

---

## POST /daily-checks/:dailyCheckId/photo-url
Minta Presigned Upload URL ke MinIO Object Storage untuk mengunggah foto.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "part_type": "odo",
  "part_index": null,
  "content_type": "image/jpeg"
}
```

Untuk ban, gunakan `part_type: "ban"` dan `part_index` 1 sampai 4. Untuk part selain `ban`, `part_index` harus `null` atau tidak dikirim.

**Response Sukses (200):**
```json
{
  "upload_url": "http://localhost:9000/dailycheck-photos/inspections/2026/uuid/odo_12345.jpg?X-Amz-Algorithm=...",
  "key": "inspections/2026/uuid/odo_12345.jpg",
  "object_key": "inspections/2026/uuid/odo_12345.jpg",
  "upload_ticket": "signed-short-lived-ticket",
  "part_type": "odo",
  "part_index": null,
  "expires_in": 300,
  "expires_at": "2026-07-30T10:00:00.000Z"
}
```

**Validasi:**
- Daily check harus milik user yang sedang login.
- Status daily check harus `incomplete`.
- `content_type` harus `image/jpeg`, `image/png`, atau `image/webp`.
- Backend yang membuat object key; client tidak boleh mengirim key buatan sendiri pada tahap ini.
- Slot foto yang sudah ada akan ditolak dengan `409`.
- `upload_ticket` adalah bukti upload yang ditandatangani backend untuk user, daily check, slot, content type, dan object key yang sama. Ticket ini bukan token login dan tetap harus dipakai bersama `Authorization`.

---

## POST /daily-checks/:dailyCheckId/photos
Konfirmasi pendaftaran foto setelah berhasil di-upload ke MinIO.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "upload_ticket": "signed-short-lived-ticket",
  "note": "Kondisi baik, lecet halus"
}
```

Backend memverifikasi `upload_ticket`, mengambil slot dan object key dari ticket, memastikan object sudah ada di MinIO, lalu membuat atau mengembalikan row database. Client tidak boleh mengirim storage key untuk konfirmasi.

**Response Sukses (201):**
```json
{
  "photo": {
    "check_photos_id": "uuid",
    "daily_id": "uuid",
    "part_type": "odo",
    "part_index": null,
    "r2_key": "inspections/2026/uuid/odo_12345.jpg",
    "thumbnail_key": "thumb_inspections/2026/uuid/odo_12345.jpg",
    "note": "Kondisi baik, lecet halus",
    "url": "http://localhost:9000/dailycheck-photos/inspections/2026/uuid/odo_12345.jpg?X-Amz-..."
  }
}
```

Jika konfirmasi yang sama dikirim ulang setelah response pertama hilang, endpoint mengembalikan row yang sama dengan `200` dan `already_confirmed: true`.

**Rules `part_index`:**
- `ban` wajib memakai integer `1`, `2`, `3`, atau `4`.
- Part selain `ban` harus `null` atau tidak mengirim `part_index`.
- Legacy row ban lama dengan `part_index = null` dianggap ambigu.

**Duplicate slot:**
- Satu daily check hanya boleh punya satu row per logical slot.
- Contoh: satu `odo`, satu `kap`, satu `ban` dengan `part_index=1`.
- `lainnya` saat ini juga satu slot per daily check sesuai UI driver.

**Response gagal:**
- `400` - ticket/content/object metadata tidak valid atau ticket kedaluwarsa
- `404` - daily check tidak ditemukan atau object belum ada di MinIO
- `409` - daily check sudah submitted atau slot foto sudah dikonfirmasi dengan object lain
- `500` - kegagalan server/storage/database

Konfirmasi dan submit mengunci row `daily_checks` yang sama dengan PostgreSQL `FOR UPDATE`. Jika submit selesai lebih dulu, konfirmasi ditolak `409`. Jika konfirmasi selesai lebih dulu, submit melihat foto yang sudah terkonfirmasi.

---

## POST /daily-checks/:dailyCheckId/photo-uploads/cancel
Batalkan object yang sudah terupload ke MinIO tetapi belum terkonfirmasi sebagai row `check_photos`.

**Headers:** `Authorization: Bearer <token_driver>`

**Request Body:**
```json
{
  "upload_ticket": "signed-short-lived-ticket"
}
```

Backend memverifikasi ticket, mengunci daily check, memastikan object key belum tercatat di `check_photos`, lalu menghapus object MinIO. Object yang sudah hilang dianggap aman untuk dibersihkan.

**Response Sukses (200):**
```json
{
  "message": "Upload tertunda berhasil dibatalkan.",
  "data": {
    "daily_id": "uuid",
    "part_type": "odo",
    "part_index": null
  }
}
```

**Response gagal:**
- `400` - ticket tidak valid/kedaluwarsa
- `403` - user bukan driver
- `404` - daily check tidak ditemukan
- `409` - object sudah tercatat sebagai foto laporan
- `500` - kegagalan server/storage/database

---

## GET /daily-checks/:dailyCheckId/photos
Ambil daftar foto yang sudah terkonfirmasi untuk sesi driver.

**Headers:** `Authorization: Bearer <token>`

**Response Sukses (200):**
```json
{
  "photos": [
    {
      "check_photos_id": "uuid",
      "daily_id": "uuid",
      "part_type": "ban",
      "part_index": 1,
      "r2_key": "inspections/2026/uuid/ban_1_12345.jpg",
      "thumbnail_key": "thumb_inspections/2026/uuid/ban_1_12345.jpg",
      "note": null,
      "created_at": "2026-07-29T..."
    }
  ]
}
```

Jika belum ada foto:
```json
{ "photos": [] }
```

Endpoint ini hanya mengembalikan foto untuk daily check milik user yang sedang login.

---

## DELETE /daily-checks/:dailyCheckId/photos/:photoId
Driver menghapus foto yang sudah terupload sebelum laporan final dikirim.

**Headers:** `Authorization: Bearer <token_driver>`

Backend mengambil object key dari row `check_photos`, memverifikasi daily check masih milik driver login dan masih `incomplete`, menghapus object MinIO, lalu menghapus row database. Client tidak mengirim storage key pada endpoint ini.

Delete dan submit mengambil row lock PostgreSQL pada `daily_checks` yang sama. Jika submit menang lebih dulu, delete menunggu lalu ditolak `409`. Jika delete menang lebih dulu, submit menunggu lalu memvalidasi ulang foto wajib dan gagal `400` bila slot wajib berkurang.

**Response Sukses (200):**
```json
{
  "message": "Foto berhasil dihapus. Silakan ambil ulang foto.",
  "data": {
    "check_photos_id": "uuid",
    "daily_id": "uuid",
    "part_type": "odo",
    "part_index": null
  }
}
```

**Response gagal:**
- `400` - `dailyCheckId` atau `photoId` tidak valid
- `403` - user bukan driver
- `404` - daily check/foto tidak ditemukan atau bukan milik driver login
- `409` - laporan sudah disubmit, foto tidak dapat dihapus
- `500` - kegagalan server/storage/database

Setelah sukses, slot foto kembali kosong dan bisa memakai alur upload normal lagi. Mengirim DELETE kedua untuk `photoId` yang sama menghasilkan `404` karena row foto sudah tidak ada.

MinIO `DeleteObject` bersifat aman untuk object yang sudah tidak ada, sehingga retry tetap bisa membersihkan row database bila percobaan sebelumnya berhasil menghapus object tetapi gagal menghapus row. Sistem tidak memakai distributed transaction; jika MinIO sukses lalu PostgreSQL gagal, row bisa sementara menunjuk object yang sudah hilang sampai retry berikutnya berhasil.

---
## POST /daily-checks/:dailyCheckId/submit
Submit laporan setelah semua sebelas foto wajib punya record `check_photos` yang sudah tersimpan.

**Headers:** `Authorization: Bearer <token>`

**Required persisted logical slots:**
- `odo`
- `body_kiri`
- `body_kanan`
- `kap`
- `depan`
- `belakang`
- `interior`
- `ban` dengan `part_index = 1`
- `ban` dengan `part_index = 2`
- `ban` dengan `part_index = 3`
- `ban` dengan `part_index = 4`

Foto `lainnya` bersifat opsional dan tidak memblokir submit. Legacy row `ban` dengan `part_index = null` tidak memenuhi slot ban wajib.

**Response Sukses (200):**
```json
{
  "message": "Laporan berhasil disubmit",
  "daily_check": {
    "daily_id": "uuid",
    "status": "submitted"
  }
}
```

Final status yang digunakan backend saat ini adalah `submitted`.

**Response Gagal (400) - foto wajib belum lengkap:**
```json
{
  "error": "Foto wajib belum lengkap",
  "missing_parts": [
    {
      "part_type": "kap",
      "part_index": null,
      "checklist_id": "kap"
    },
    {
      "part_type": "ban",
      "part_index": 3,
      "checklist_id": "ban_3"
    }
  ]
}
```

**Response gagal lain:**
- `401` - token kosong/tidak valid mengikuti auth middleware
- `404` - daily check tidak ditemukan atau bukan milik user login
- `409` - laporan sudah pernah dikirim
- `500` - kegagalan server/database

---
## GET /admin/daily-checks
Lihat semua laporan daily check. Bisa difilter.

**Headers:** `Authorization: Bearer <token_admin>`

**Query params (opsional):**
- `date` — filter berdasarkan tanggal (format: YYYY-MM-DD)
- `driver_id` — filter berdasarkan users_id driver
- `vehicle_id` — filter berdasarkan vehicle_id

**Response Sukses (200):**
```json
{
  "reports": [
    {
      "daily_id": "...",
      "driver_name": "...",
      "plate_number": "...",
      "brand": "...",
      "model": "...",
      "status": "incomplete",
      ...
    }
  ]
}
```

---

## GET /admin/daily-checks/:id
Detail 1 laporan lengkap dengan semua foto yang sudah diupload.

**Headers:** `Authorization: Bearer <token_admin>`

**Response Sukses (200):**
```json
{
  "report": { "daily_id": "...", "driver_name": "...", ... },
  "photos": [
    { "check_photos_id": "...", "part_type": "odo", "note": "...", ... }
  ]
}
```

**Response Gagal (404):**
```json
{ "error": "Laporan tidak ditemukan" }
```

---

## GET /admin/dashboard/today
Ringkasan status checking hari ini — dipakai buat lihat siapa yang belum checking.

**Headers:** `Authorization: Bearer <token_admin>`

**Response Sukses (200):**
```json
{
  "total_driver": 4,
  "sudah_checking": 2,
  "belum_checking": [
    { "users_id": "...", "name": "...", "email": "..." }
  ]
}
```

**Catatan buat frontend:** tampilkan `belum_checking` sebagai list di dashboard admin.

---

## PATCH /admin/users/:id/reset-password
Khusus admin. Reset password user mana pun — sistem generate password sementara acak.

**Headers:** `Authorization: Bearer <token_admin>`

**Response Sukses (200):**
```json
{
  "message": "Password berhasil direset",
  "temporary_password": "a3f5e8d2"
}
```

**Response Gagal:**
- `403` — bukan admin
- `404` — user tidak ditemukan

**Catatan buat frontend:**
- Tombol "Reset Password" ada di halaman kelola user (khusus tampilan admin)
- Tampilkan `temporary_password` ke admin di layar, supaya admin bisa kasih tau ke user secara manual

---

## POST /admin/users
Admin bikin akun user baru (driver atau admin). Password dibuat otomatis (sementara), user wajib ganti saat login pertama.

**Headers:** `Authorization: Bearer <token_admin>`

**Request Body:**
```json
{
  "name": "Budi Driver",
  "email": "budi@test.com",
  "role": "driver",
  "is_shared_account": false
}
```

**Response Sukses (201):**
```json
{
  "user": {
    "users_id": "...",
    "name": "Budi Driver",
    "email": "budi@test.com",
    "role": "driver",
    "is_shared_account": false,
    "status": "active"
  },
  "temporary_password": "a3f5e8d2"
}
```

**Response Gagal:**
- `400` — field wajib kosong / role tidak valid
- `409` — email sudah terdaftar

**Catatan buat frontend:** tampilkan `temporary_password` ke admin setelah user berhasil dibuat, supaya admin bisa kasih tau ke user secara manual (WA/verbal) — sama seperti alur reset password. Gunakan `is_shared_account: true` untuk membuat akun Driver Pengganti.

---

## GET /admin/users
List semua user (admin & driver).

**Headers:** `Authorization: Bearer <token_admin>`

**Response Sukses (200):**
```json
{
  "users": [
    {
      "users_id": "...",
      "name": "...",
      "email": "...",
      "role": "driver",
      "is_shared_account": false,
      "status": "active",
      "must_change_password": false,
      "created_at": "..."
    }
  ]
}
```

---

## PATCH /admin/users/:id
Edit data user — nama, role, status (aktif/nonaktif), atau penanda akun shared.

**Headers:** `Authorization: Bearer <token_admin>`

**Request Body (semua field opsional, kirim yang mau diubah saja):**
```json
{
  "name": "Nama Baru",
  "role": "driver",
  "is_shared_account": false,
  "status": "inactive"
}
```

**Response Sukses (200):**
```json
{ "user": { "users_id": "...", "name": "...", "status": "inactive", ... } }
```

**Response Gagal:**
- `400` — role/status tidak valid
- `404` — user tidak ditemukan

**Catatan buat frontend:** dipakai untuk tombol "Nonaktifkan/Aktifkan Akun" di halaman kelola user (set `status`).

---

## POST /admin/vehicles
Tambah data mobil baru.

**Headers:** `Authorization: Bearer <token_admin>`

**Request Body:**
```json
{
  "plate_number": "B 5678 EF",
  "brand": "Daihatsu",
  "model": "Xenia"
}
```

**Response Sukses (201):**
```json
{ "vehicle": { "vehicle_id": "...", "plate_number": "B 5678 EF", "status": "active", ... } }
```

**Response Gagal:**
- `400` — field wajib kosong
- `409` — plat nomor sudah terdaftar

---

## GET /admin/vehicles
List semua mobil.

**Headers:** `Authorization: Bearer <token_admin>`

**Response Sukses (200):**
```json
{
  "vehicles": [
    { "vehicle_id": "...", "plate_number": "...", "brand": "...", "model": "...", "status": "active", ... }
  ]
}
```

---

## PATCH /admin/vehicles/:id
Edit data mobil — plat nomor, merk, model, atau status (aktif/nonaktif).

**Headers:** `Authorization: Bearer <token_admin>`

**Request Body (semua field opsional, kirim yang mau diubah saja):**
```json
{
  "plate_number": "B 5678 EF",
  "brand": "Daihatsu",
  "model": "Xenia 2024",
  "status": "inactive"
}
```

**Response Sukses (200):**
```json
{ "vehicle": { "vehicle_id": "...", "model": "Xenia 2024", ... } }
```

**Response Gagal:**
- `400` — status tidak valid
- `404` — mobil tidak ditemukan

**Catatan buat frontend:** dipakai untuk tombol "Nonaktifkan/Aktifkan Mobil" di halaman kelola mobil (set `status`).

