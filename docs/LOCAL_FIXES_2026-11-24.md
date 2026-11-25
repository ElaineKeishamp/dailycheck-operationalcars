# Laporan lokal 24 November 2026: poin 1 dan 2

> Dokumen riwayat. Isinya mencatat pemeriksaan atau rancangan pada saat ditulis.
> Status dan persiapan deployment terbaru ada di [catatan serah terima](HANDOVER.md).

## Poin 1: kegagalan memuat riwayat

Permintaan riwayat dan laporan hari ini tidak lagi mengganti kegagalan jaringan
dengan data kosong. Keduanya ditangani terpisah, sehingga satu kegagalan tidak
menghilangkan hasil permintaan lain yang berhasil.

Riwayat gagal menampilkan pesan kesalahan dan tombol Muat Ulang Riwayat. Pesan
belum ada riwayat hanya tampil jika respons riwayat berhasil dan benar-benar
kosong. Respons yang tidak valid juga diperlakukan sebagai kesalahan.

Jika pemeriksaan laporan hari ini gagal, halaman menampilkan pesan tersendiri dan
memblokir tindakan mulai checking sampai status berhasil diperiksa lagi. Retry
menggunakan permintaan baru; permintaan lama dibatalkan, termasuk saat halaman
ditutup, agar hasil lama tidak menimpa hasil yang lebih baru.

## Poin 2: konsistensi tanggal dan WIB

Koneksi PostgreSQL aplikasi menetapkan TimeZone ke Asia/Jakarta. CURRENT_DATE dan
default waktu database mengikuti WIB walaupun proses backend/hosting memakai UTC.
Kolom DATE dikembalikan sebagai YYYY-MM-DD, sehingga tanggal pemeriksaan tidak
bergeser akibat konversi timezone.

Kolom timestamp without time zone yang sudah ada diperlakukan sebagai waktu lokal
WIB, sesuai label aplikasi. Nilainya dikirim sebagai instant dengan offset yang
jelas. Format tanggal/jam laporan driver dan admin, header, serta waktu watermark
ditetapkan ke Asia/Jakarta. Pembentukan folder tanggal foto juga memakai WIB;
tidak ada perubahan provider atau alur upload.

Tidak ada migrasi atau penulisan ulang data lama. Jika sumber data lama ternyata
menulis timestamp tanpa zona sebagai UTC atau zona lain, asal waktu tersebut perlu
diverifikasi sebelum pemakaian operasional; nilainya tidak bisa ditebak dari kolom
timestamp tanpa zona. Pengujian memakai database terpisah, bukan data perusahaan.

## Verifikasi

- PASS: 31 tes backend, termasuk HTTP API/PostgreSQL, pada proses dengan TZ=UTC.
- PASS: 8 tes frontend, juga dijalankan dengan TZ=America/Los_Angeles.
- PASS: frontend lint dan build production.
- PASS: uji browser terhadap build production dengan API fixture lokal sintetis:
  riwayat gagal, retry berhasil, laporan hari ini gagal, retry melalui keyboard,
  dan respons riwayat kosong yang berhasil.
- PASS: timestamp 2026-11-23T17:15:00Z tampil 24 Nov 2026, 00:15 WIB.
- PASS: warna pesan gagal memiliki kontras 5,91:1; teks tombol retry 6,70:1.

Skenario pengujian tidak memerlukan R2, kamera, atau lokasi asli. Tidak ada
deployment. Poin 3 sampai 6 belum dikerjakan pada tahap ini.

Perintah untuk mengulangi tes frontend dari apps/frontend: npm test,
npm run lint, dan npm run build. Tes backend dijalankan dari apps/backend dengan
npm test; untuk tes integrasi, set TEST_DATABASE_URL ke database kosong bernama
dailycheck_session_test sesuai README.
