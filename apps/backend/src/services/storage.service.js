const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

const endpoint = requireEnv('S3_ENDPOINT');
const region = requireEnv('S3_REGION');
const accessKeyId = requireEnv('S3_ACCESS_KEY');
const secretAccessKey = requireEnv('S3_SECRET_KEY');
const bucketName = requireEnv('S3_BUCKET_NAME');

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
      throw err;
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

async function objectExists(key) {
  if (!key) return false;

  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

async function getObjectMetadata(key) {
  if (!isSafeObjectKey(key)) {
    throw new Error('Object key tidak valid');
  }

  try {
    const result = await s3Client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));

    return {
      exists: true,
      contentType: result.ContentType || null,
      contentLength: result.ContentLength ?? null,
      lastModified: result.LastModified || null,
    };
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    throw err;
  }
}

function isSafeObjectKey(key) {
  return typeof key === 'string'
    && key.length > 0
    && key.length <= 1024
    && key.startsWith('inspections/')
    && !key.startsWith('/')
    && !key.includes('..')
    && !/[\\\0\r\n]/.test(key);
}

async function deleteObject(key) {
  if (!isSafeObjectKey(key)) {
    throw new Error('Object key tidak valid');
  }

  await s3Client.send(new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  }));

  return true;
}

async function listInspectionObjects({ olderThanDate } = {}) {
  const objects = [];
  let continuationToken;

  do {
    const result = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'inspections/',
      ContinuationToken: continuationToken,
    }));

    (result.Contents || []).forEach((object) => {
      if (!isSafeObjectKey(object.Key)) return;
      if (olderThanDate && object.LastModified && object.LastModified >= olderThanDate) return;
      objects.push({
        key: object.Key,
        lastModified: object.LastModified || null,
        size: object.Size ?? null,
      });
    });

    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);

  return objects;
}

module.exports = {
  s3Client,
  bucketName,
  ensureBucketExists,
  generateUploadPresignedUrl,
  generateViewPresignedUrl,
  objectExists,
  getObjectMetadata,
  isSafeObjectKey,
  deleteObject,
  listInspectionObjects,
};
