const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const storage = require('./src/services/storage.service');

async function testMinIOIntegration() {
  const key = `inspections/storage-smoke-test/${randomUUID()}.png`;
  const contentType = 'image/png';
  const photo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=', 'base64');
  const origin = process.env.STORAGE_TEST_ORIGIN || 'http://localhost:5173';
  let uploaded = false;
  const request = (url, options = {}) => fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15000),
  });

  try {
    await storage.ensureBucketExists();
    console.log('PASS: backend can access the bucket.');
    const { uploadUrl } = await storage.generateUploadPresignedUrl(key, contentType);
    const preflight = await request(uploadUrl, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    assert.ok(preflight.ok, `CORS preflight failed: HTTP ${preflight.status}`);
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
    assert.match(preflight.headers.get('access-control-allow-methods') || '', /PUT/);
    console.log('PASS: browser upload origin is allowed by CORS.');

    const upload = await request(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType, Origin: origin },
      body: photo,
    });
    assert.ok(upload.ok, `Upload failed: HTTP ${upload.status}`);
    uploaded = true;
    const metadata = await storage.getObjectMetadata(key);
    assert.equal(metadata.contentType, contentType);
    assert.equal(Number(metadata.contentLength), photo.length);
    console.log('PASS: photo upload and metadata match.');

    const viewUrl = await storage.generateViewPresignedUrl(key, 60);
    const view = await request(viewUrl, { headers: { Origin: origin } });
    assert.ok(view.ok, `Read failed: HTTP ${view.status}`);
    assert.equal(view.headers.get('access-control-allow-origin'), origin);
    assert.deepEqual(Buffer.from(await view.arrayBuffer()), photo);
    console.log('PASS: signed photo read returns the original bytes.');

    const anonymousUrl = new URL(viewUrl);
    anonymousUrl.search = '';
    const anonymous = await request(anonymousUrl);
    assert.equal(anonymous.status, 403, 'Anonymous read must be denied.');
    console.log('PASS: anonymous photo access is denied.');
  } finally {
    if (uploaded) {
      await storage.deleteObject(key);
      assert.equal(await storage.objectExists(key), false);
      console.log('PASS: test photo deleted and absence verified.');
    }
  }
}

testMinIOIntegration().catch((error) => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
