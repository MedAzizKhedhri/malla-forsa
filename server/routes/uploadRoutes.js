const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const router = express.Router();
const { protect } = require('../middleware/auth');
const r2 = require('../config/r2');

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Run multer by hand so its errors (size limit, bad file type) become clear JSON
// responses and show up in the server logs instead of a bare 500.
function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    console.error('[upload] rejected:', err.message || err);
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Image too large (max 10 MB)' });
    }
    return res.status(400).json({ message: typeof err === 'string' ? err : err.message });
  });
}

router.post('/', protect, handleUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  try {
    const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(req.file.originalname).toLowerCase()}`;
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));
    const publicUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
    res.send(publicUrl);
  } catch (error) {
    console.error('[upload] R2 upload failed:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

module.exports = router;
