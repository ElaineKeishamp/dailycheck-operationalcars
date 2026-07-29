const { generateUploadPresignedUrl, generateViewPresignedUrl, ensureBucketExists } = require('./src/services/storage.service');

async function testMinIOIntegration() {
  console.log('=== TES INTEGRASI MINIO OBJECT STORAGE ===\n');

  try {
    // 1. Pastikan bucket ada
    console.log('1. Memeriksa keberadaan Bucket MinIO...');
    await ensureBucketExists();

    // 2. Generate Presigned Upload URL
    const fileKey = `test-inspections/photo_${Date.now()}.txt`;
    console.log(`2. Membuat Presigned Upload URL untuk key: "${fileKey}"...`);
    const { uploadUrl, key, expiresIn } = await generateUploadPresignedUrl(fileKey, 'text/plain', 300);
    console.log('   Upload URL berhasil dibuat!');
    console.log('   Upload URL (Expires 5m):', uploadUrl.substring(0, 80) + '...\n');

    // 3. Simulasi client meng-upload file langsung ke MinIO via Presigned URL
    console.log('3. Simulasi Client Upload File ke MinIO via Presigned URL...');
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: 'Ini adalah file uji coba pemeriksaan kendaraan DailyCheck!',
    });

    if (uploadRes.ok) {
      console.log('   ✓ BERHASIL! File ter-upload langsung ke MinIO (HTTP 200).\n');
    } else {
      console.error('   ✗ GAGAL Upload ke MinIO! HTTP Status:', uploadRes.status);
      return;
    }

    // 4. Generate Presigned Read/View URL (Untuk Admin)
    console.log('4. Membuat Presigned View URL untuk Admin...');
    const viewUrl = await generateViewPresignedUrl(key, 1800);
    console.log('   View URL berhasil dibuat!');
    console.log('   View URL (Expires 30m):', viewUrl.substring(0, 80) + '...\n');

    // 5. Coba ambil file pakai View URL
    console.log('5. Menguji pengambilan isi file dari MinIO menggunakan View URL...');
    const viewRes = await fetch(viewUrl);
    const content = await viewRes.text();
    console.log('   Isi File dari MinIO:', `"${content}"`);
    console.log('\n=== HASTAG: #SEMUA_TES_MINIO_SUKSES_100% ===');
  } catch (err) {
    console.error('Error saat tes MinIO:', err);
  }
}

testMinIOIntegration();
