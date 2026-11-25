# Memilih penyimpanan foto DailyCheck

DailyCheck membutuhkan object storage privat yang dapat menerima upload langsung
dari browser. HP memproses foto sementara; backend mengurus autentikasi, izin,
tiket upload, metadata, dan konfirmasi. File foto tidak perlu melewati backend.
Melihat foto kembali memerlukan koneksi ke storage. Tidak menyimpan salinan ke
galeri bukan jaminan tidak ada data sementara di browser atau pencegahan screenshot.

## Pilihan untuk pengguna aplikasi

Rencana proyek saat ini: gunakan storage lokal untuk pengembangan, lalu integrasi
ke Deka BOX yang dikelola perusahaan ketika akses tersedia. Cloudflare R2 tidak
diaktifkan dan bukan prasyarat untuk memakai aplikasi.

| Situasi | Saran |
| --- | --- |
| Perusahaan sudah memiliki Deka BOX Lintasarta | Evaluasi bucket Deka BOX khusus aplikasi terlebih dahulu; lakukan uji kompatibilitas di bawah sebelum memilihnya. |
| Pengembangan dan demo di laptop | Gunakan server object storage lokal kompatibel S3, seperti SeaweedFS yang dipakai pada tes laptop proyek ini. Tidak memerlukan subscription cloud; binary, data, dan kredensial lokal tidak disertakan dalam Git. |
| Secara opsional memilih akun Cloudflare pribadi | Ikuti [panduan R2](R2_SETUP.md). Ada aktivasi subscription dan potensi tagihan; pilihan ini tidak wajib. |
| Perusahaan memakai penyedia S3-compatible lain | Gunakan layanan tersebut jika lolos pengujian operasi yang diperlukan. |
| Pengujian lokal dengan MinIO yang sudah tersedia | Pastikan edisi, lisensi, dan pemeliharaannya sesuai. AIStor memerlukan lisensi aktivasi; Community memakai AGPL dan repositori resminya sudah diarsipkan. |

Setiap pihak yang mencoba aplikasi menyediakan akun atau akses storage sendiri.
Jangan membagikan kredensial pribadi lewat repository. Untuk operasional gunakan
akun dan penagihan yang dikelola perusahaan, serta tetapkan retensi dan backup.
Biaya kapasitas, operasi API, dan transfer mengikuti penyedia serta kontraknya.
Storage lokal memerlukan proses server dan laptop tetap menyala. Untuk pemakaian
perusahaan, gunakan layanan yang dapat dijangkau dari perangkat driver dan
operasionalnya dikelola perusahaan.

## Deka BOX Lintasarta

Secara arsitektur Deka BOX merupakan kandidat yang sesuai: dokumentasi resmi
menyebut kompatibilitas S3, Access Key ID/Secret Key, bucket, dan konfigurasi CORS.
Backend proyek sudah memakai AWS SDK S3. Ini dasar untuk integrasi, bukan bukti
bahwa tenant Deka BOX perusahaan telah diuji dengan aplikasi ini.

Catatan untuk tim IT perusahaan: DailyCheck tidak mewajibkan Cloudflare R2.
Penyimpanan foto dapat diarahkan ke Deka BOX Lintasarta melalui environment S3
backend. Alur kamera dan upload driver tetap sama. Siapkan akses berikut, lalu
jalankan uji storage dan alur aplikasi sebelum digunakan secara operasional.

Sebelum integrasi, minta administrator perusahaan menyiapkan:

1. Bucket khusus DailyCheck dengan akses anonim/public nonaktif.
2. Endpoint HTTPS S3 yang benar, signing region, dan ketentuan akses jaringan.
3. Access Key ID dan Secret Key khusus aplikasi dengan izin minimum untuk bucket.
4. CORS untuk origin aplikasi dan metode PUT, GET, HEAD, header Content-Type serta
   header x-amz-* yang dipakai SDK; ETag dapat diekspos bila diperlukan.
5. Konfirmasi dukungan presigned PUT/GET Signature V4, masa berlaku URL, batas
   file, kapasitas, retensi, backup, serta biaya sesuai layanan perusahaan.

Browser driver harus dapat menjangkau endpoint tersebut. Bila hanya bisa diakses
melalui VPN/jaringan privat, HP driver juga memerlukan akses jaringan yang sesuai.
Mengalihkan file lewat backend hanya untuk mengatasi keterjangkauan endpoint akan
mengubah rancangan upload langsung dan menambah bandwidth backend.

Isi konfigurasi berikut di `apps/backend/.env` menggunakan nilai dari administrator:

```dotenv
S3_ENDPOINT=https://S3_ENDPOINT_DARI_ADMIN
S3_INTERNAL_ENDPOINT=https://S3_ENDPOINT_DARI_ADMIN
S3_PUBLIC_ENDPOINT=https://S3_ENDPOINT_DARI_ADMIN
S3_REGION=SIGNING_REGION_DARI_ADMIN
S3_ACCESS_KEY=ACCESS_KEY_KHUSUS_APLIKASI
S3_SECRET_KEY=SECRET_KEY_KHUSUS_APLIKASI
S3_BUCKET_NAME=NAMA_BUCKET_DAILYCHECK
```

Placeholder bukan hostname atau kredensial nyata. Jangan menebak endpoint/region
dan jangan menyalin `auto` dari R2 kecuali penyedia menginstruksikannya.
`S3_PUBLIC_ENDPOINT` berarti endpoint yang dijangkau browser, bukan bucket publik.
Kedua endpoint khusus mengalahkan fallback `S3_ENDPOINT`, sehingga semuanya perlu
ditinjau saat mengganti penyedia. Signing region dan konfigurasi path-style harus
sesuai penyedia; kode saat ini memakai `forcePathStyle: true`.

## Uji sebelum digunakan

Buat bucket terlebih dahulu. Dari `apps/backend`, jalankan `node test-minio.js`.
Nama script historis; koneksi mengikuti konfigurasi S3, bukan khusus MinIO.
Pengujian memeriksa akses bucket, CORS, presigned upload, metadata file,
presigned read, penolakan akses anonim, dan penghapusan objek uji. Pastikan pula
list objek untuk cleanup berjalan dengan kredensial aplikasi. Jika akses ditolak,
periksa scope izin dan kompatibilitas API; jangan membuka bucket ke publik.

Setelah itu uji alur aplikasi: login driver, ambil foto, konfirmasi upload, lihat
riwayat, hapus foto, dan pastikan akun lain tidak dapat meminta foto tanpa izin.
Pengujian storage saja tidak membuktikan otorisasi antar-akun.

Dokumentasi ini belum menandakan koneksi Deka BOX atau R2 telah aktif. Kredensial
dan tenant nyata belum tersedia untuk pengujian. Deployment staging lama masih
menggunakan MinIO dan perlu penyesuaian tersendiri sebelum mengganti storage.

Jika berpindah penyedia, salin foto dan thumbnail yang diperlukan dengan object
key yang sama, ganti environment, lalu verifikasi foto lama dan baru. Mengganti
environment tidak otomatis memindahkan file.

## Sumber resmi

- [Deka BOX dan kompatibilitas S3](https://www.cloudeka.id/products/deka-box/)
- [Bucket dan CORS Deka BOX](https://docs.cloudeka.id/storage/deka-box/overview-deka-box)
- [Access key Deka BOX](https://docs.cloudeka.id/storage/deka-box/managing-deka-box-access-key)
- [R2](https://developers.cloudflare.com/r2/get-started/)
- [MinIO Community](https://github.com/minio/minio)
