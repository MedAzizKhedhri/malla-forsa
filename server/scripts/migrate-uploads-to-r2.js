// One-off migration: push every file in server/uploads/ to Cloudflare R2 and
// rewrite any DB field that stored a local "/uploads/<file>" path to the new
// public R2 URL. Run once against the DB you're migrating (local first, then
// re-run against Atlas after the data dump/restore — see PROGRESS.md).
// Usage: node server/scripts/migrate-uploads-to-r2.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const r2 = require('../config/r2');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function uploadFileToR2(filename) {
  const filePath = path.join(UPLOADS_DIR, filename);
  const body = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'application/octet-stream';

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: body,
    ContentType: contentType,
  }));

  return `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${filename}`;
}

function remapArray(arr, urlMap) {
  if (!Array.isArray(arr)) return { changed: false, arr };
  let changed = false;
  const next = arr.map((url) => {
    const filename = typeof url === 'string' && url.startsWith('/uploads/') ? url.slice('/uploads/'.length) : null;
    if (filename && urlMap[filename]) {
      changed = true;
      return urlMap[filename];
    }
    return url;
  });
  return { changed, arr: next };
}

async function run() {
  if (!process.env.R2_PUBLIC_URL) {
    throw new Error('R2_PUBLIC_URL is not set — enable public access on the R2 bucket first.');
  }

  const files = fs.existsSync(UPLOADS_DIR)
    ? fs.readdirSync(UPLOADS_DIR).filter((f) => f !== '.gitkeep')
    : [];
  console.log(`Found ${files.length} file(s) in server/uploads/ to migrate.`);

  const urlMap = {};
  for (const filename of files) {
    const publicUrl = await uploadFileToR2(filename);
    urlMap[filename] = publicUrl;
    console.log(`  -> uploaded ${filename} -> ${publicUrl}`);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const targets = [
    { collection: 'products', field: 'images' },
    { collection: 'ordersessions', field: 'screenshots' },
    { collection: 'clientpaniers', field: 'screenshots' },
  ];

  for (const { collection, field } of targets) {
    const docs = await db.collection(collection).find({ [field]: { $exists: true, $ne: [] } }).toArray();
    for (const doc of docs) {
      const { changed, arr } = remapArray(doc[field], urlMap);
      if (changed) {
        await db.collection(collection).updateOne({ _id: doc._id }, { $set: { [field]: arr } });
        console.log(`  -> updated ${collection}/${doc._id}.${field}`);
      }
    }
  }

  console.log('Migration complete.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
