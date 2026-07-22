# API Documentation - Daily Check App

Base URL (development): `http://localhost:3000/api`

Semua endpoint yang butuh login harus kirim header:

# Authorization: Bearer <token>

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