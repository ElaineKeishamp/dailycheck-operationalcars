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
## Alur Lupa Password

1. User klik "Lupa Password?" di halaman login → tampilkan info statis: 
   "Silakan hubungi admin untuk reset password" (tidak perlu panggil API apa pun di step ini)
2. User hubungi admin di luar sistem (WA/verbal)
3. Admin reset lewat PATCH /admin/users/:id/reset-password
4. Admin kasih tau password sementara ke user secara manual
5. User login pakai email + password sementara → POST /auth/login
6. Response login berisi must_change_password: true
7. Frontend WAJIB redirect paksa ke halaman Ganti Password (tidak boleh ke dashboard dulu)
8. User isi password baru + konfirmasi (konfirmasi dicek di frontend saja)
9. Submit ke POST /auth/change-password
10. Setelah sukses, baru redirect ke dashboard sesuai role

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

