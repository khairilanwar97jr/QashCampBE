const { randomUUID } = require('node:crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

let client;
function getClient() {
  const required = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
  for (const name of required) {
    if (!process.env[name]?.trim()) throw new Error(`Missing ${name}`);
  }
  const endpoint = process.env.R2_ENDPOINT?.trim() ||
    (process.env.R2_ACCOUNT_ID?.trim() && `https://${process.env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`);
  if (!endpoint) throw new Error('Missing R2_ENDPOINT or R2_ACCOUNT_ID');
  if (!client) client = new S3Client({
    region: 'auto', endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
    },
  });
  return client;
}

function imageType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return ['jpg', 'image/jpeg'];
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ['png', 'image/png'];
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return ['webp', 'image/webp'];
  return null;
}

function validatePhoto(file) {
  const type = imageType(file?.buffer);
  if (!type || file.buffer.length > 2 * 1024 * 1024) {
    throw Object.assign(new Error('Photos must be JPEG, PNG, or WebP and at most 2 MB'), { status: 400 });
  }
  return type;
}

async function uploadPhoto(file) {
  const type = validatePhoto(file);
  const key = `reviews/${randomUUID()}.${type[0]}`;
  await getClient().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME.trim(), Key: key,
    Body: file.buffer, ContentType: type[1],
  }));
  return { key };
}

async function deletePhoto(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME.trim(), Key: key }));
}

function presentReview(review) {
  if (!review) return review;
  const base = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, '');
  return { ...review, photos: (review.photos || []).map(photo => {
    // Preserve previously stored Cloudinary URLs. New records store durable R2 keys.
    if (/^https?:\/\//i.test(photo.photo_url)) return { ...photo, object_key: null };
    const key = photo.photo_url;
    return { ...photo, object_key: key, photo_url: base ? `${base}/${key.split('/').map(encodeURIComponent).join('/')}` : null };
  }) };
}

module.exports = { uploadPhoto, deletePhoto, presentReview, validatePhoto };
