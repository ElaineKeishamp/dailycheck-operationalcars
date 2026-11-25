# Laporan lokal 25 November 2026: poin 3 dan 4

> Dokumen riwayat. Isinya mencatat pemeriksaan atau rancangan pada saat ditulis.
> Status dan persiapan deployment terbaru ada di [catatan serah terima](HANDOVER.md).

## Poin 3: pengelolaan akun, kendaraan, dan akses role

Formulir edit akun sudah mengirim name dan is_shared_account, tetapi backend
sebelumnya mengabaikan kedua field tersebut. Backend kini memvalidasi dan
menyimpannya, termasuk nilai false untuk akun bersama. PATCH hanya memperbarui
field yang dikirim. Mengubah nama saja mempertahankan sesi; perubahan pengaturan
akun bersama membatalkan sesi lama agar pengguna login ulang dengan pengaturan
yang benar. Perlindungan perubahan role/status yang sudah ada tetap diuji.

Pembuatan akun atau kendaraan secara bersamaan dapat lolos pemeriksaan duplikasi
awal. Pelanggaran constraint email/plat kini menghasilkan HTTP 409 dengan pesan
duplikasi yang sesuai. Pengujian memastikan hanya satu baris berhasil disimpan.

Pengujian HTTP/PostgreSQL mencakup larangan menonaktifkan akun sendiri, ID yang
tidak ditemukan, driver yang mencoba membaca/mengubah data admin, admin yang
mencoba menjalankan operasi driver, kendaraan nonaktif yang hilang dari pilihan
driver dan tidak bisa memulai pemeriksaan, serta pengaktifan kendaraan kembali.
Reset password tidak lagi melaporkan berhasil jika akun hilang sebelum pembaruan.

## Poin 4: pembatasan percobaan login

POST /api/auth/login dibatasi menggunakan express-rate-limit: 20 respons gagal
HTTP 4xx per alamat IP dalam jendela 15 menit. Percobaan berikutnya mendapat HTTP
429, pesan JSON dengan code LOGIN_RATE_LIMITED, dan header Retry-After. Frontend
login yang sudah ada menampilkan pesan error dari backend; tidak ada perubahan
desain atau formulir.

Login berhasil dan respons 5xx tidak memakai kuota kegagalan. Pembatasan berlaku
di endpoint login saja; sesi pengguna yang sudah login tetap dapat mengakses API.
Ini bukan penguncian permanen akun. Pengguna di jaringan/NAT yang sama berbagi
kuota IP. State pembatas saat ini disimpan di memori proses, sehingga reset saat
restart dan belum dibagi lintas instance. Untuk deployment multi-instance perlu
memilih store bersama atau pembatas di gateway sebelum rilis konfigurasi tersebut.

TRUST_PROXY kosong secara default untuk akses lokal/langsung. Bila hosting memakai
reverse proxy, isi dengan IP/CIDR proxy yang benar-benar dipercaya sesuai jaringan
deployment. Jangan memakai true tanpa pembatasan atau mempercayai header dari
Internet. Backend perlu tetap berada di belakang proxy yang ditetapkan. Pengujian
memastikan header X-Forwarded-For palsu tidak melewati pembatas koneksi langsung,
dan proxy tepercaya membedakan alamat klien.

## Verifikasi

- PASS: 43 tes backend, tanpa gagal atau dilewati, termasuk pembatas pada endpoint
  login asli dan akses sesi admin yang tetap berjalan ketika login dibatasi.

- Tes dilakukan melalui HTTP localhost dan PostgreSQL uji terpisah bernama
  dailycheck_session_test, dengan schema yang dibuat dan dibersihkan oleh test.
- Tes regresi mencakup poin 1 dan 2 serta perbaikan autentikasi sebelumnya.
- Pengujian UI manual akun/kendaraan pada browser belum dilakukan pada tahap ini;
  verifikasi pengelolaan data dilakukan pada endpoint yang dipakai formulir.
- Tidak ada deployment, migrasi database aplikasi, perubahan R2, atau perubahan
  desain. Poin 5 dan 6 belum dikerjakan pada tahap ini.

Jalankan npm install di apps/backend untuk dependency baru, lalu npm test.
Set TEST_DATABASE_URL hanya ke database uji kosong dailycheck_session_test untuk
mengikutsertakan tes integrasi, sesuai README.

Referensi library:
https://github.com/express-rate-limit/express-rate-limit
