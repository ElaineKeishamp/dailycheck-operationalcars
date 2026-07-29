const { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
const region = process.env.S3_REGION || 'us-east-1';
const accessKeyId = process.env.S3_ACCESS_KEY || 'minioadmin';
const secretAccessKey = process.env.S3_SECRET_KEY || 'minioadmin';
const bucketName = process.env.S3_BUCKET_NAME || 'dailycheck-photos';

const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true, // Mandatory for MinIO / S3-compatible path-style URLs
});

/**
 * Ensure bucket exists in MinIO (auto-create if missing)
 */
async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket "${bucketName}" not found. Creating...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`Bucket "${bucketName}" created successfully!`);
    } else {
      console.error('Error checking bucket:', err.message);
    }
  }
}

/**
 * Generate a Presigned Upload URL (allows client to upload directly to MinIO)
 * @param {string} key - S3 object key (path/filename.webp)
 * @param {string} contentType - MIME type (e.g. image/webp, image/jpeg)
 * @param {number} expiresIn - Expiration in seconds (default 300 = 5 minutes)
 */
async function generateUploadPresignedUrl(key, contentType = 'image/webp', expiresIn = 300) {
  await ensureBucketExists();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return { uploadUrl, key, expiresIn };
}

/**
 * Generate a Presigned View/Read URL (allows admin to securely view private photo)
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration in seconds (default 1800 = 30 minutes)
 */
async function generateViewPresignedUrl(key, expiresIn = 1800) {
  if (!key) return null;
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = {
  s3Client,
  bucketName,
  ensureBucketExists,
  generateUploadPresignedUrl,
  generateViewPresignedUrl,
};
