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

## POST /daily-checks
Driver mulai sesi checking harian.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "vehicle_id": "uuid-mobil",
  "actual_driver_name": "Nama Asli (wajib jika akun Driver Pengganti)"
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

## POST /daily-checks/:dailyCheckId/photos
Upload foto per bagian mobil. Dipanggil berkali-kali (1 kali per foto).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "part_type": "odo | body_kiri | body_kanan | kap | depan | belakang | interior | ban | lainnya",
  "note": "opsional"
}
```

**Catatan buat frontend:** untuk `ban`, panggil endpoint ini 4 kali (1 per foto ban). Untuk `body_kiri`/`body_kanan`, boleh dipanggil lebih dari 1 kali kalau mau lebih dari 1 foto.

**Response Sukses (201):**
```json
{ "photo": { "check_photos_id": "...", "part_type": "odo", ... } }
```

*(Catatan: saat ini foto belum benar-benar diupload ke storage — masih pakai path dummy sementara integrasi MinIO belum selesai)*

---

## POST /daily-checks/:dailyCheckId/submit
Submit laporan setelah semua foto wajib terupload.

**Headers:** `Authorization: Bearer <token>`

**Response Sukses (200):**
```json
{ "message": "Laporan berhasil disubmit", "daily_check": { "status": "submitted", ... } }
```

**Response Gagal (400) — belum lengkap:**
```json
{
  "error": "Laporan belum lengkap",
  "missing_parts": ["kap", "ban (baru 0/4 foto)"]
}
```

**Catatan buat frontend:** tampilkan `missing_parts` ke user biar tau bagian mana yang belum difoto.


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