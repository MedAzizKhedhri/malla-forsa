const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const r2 = require('../config/r2');
const { createRateLimiter } = require('../middleware/rateLimit');
const { createRequest, getRequestStatus } = require('../controllers/publicRequestController');

// Everything here is open to visitors who aren't logged in, so it is limited per IP.
const router = express.Router();

const uploadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Trop de photos envoyées, réessayez dans quelques minutes.',
});
const requestLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Trop de demandes envoyées, réessayez plus tard.',
});
// Tight on purpose: this is the only place someone could try to guess references and phones
const statusLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: 'Trop de tentatives, réessayez dans quelques minutes.',
});

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const types = /jpg|jpeg|png|webp/;
    const ok = types.test(path.extname(file.originalname).toLowerCase()) && types.test(file.mimetype);
    cb(ok ? null : 'Images only!', ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    console.error('[public upload] rejected:', err.message || err);
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Photo trop lourde (max 5 Mo).' });
    }
    return res.status(400).json({ message: 'Seules les images JPG, PNG ou WEBP sont acceptées.' });
  });
}

router.post('/upload', uploadLimiter, handleUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucune photo reçue.' });
  try {
    const key = `requests/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(req.file.originalname).toLowerCase()}`;
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));
    res.json({ url: `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}` });
  } catch (error) {
    console.error('[public upload] R2 upload failed:', error);
    res.status(500).json({ message: "Échec de l'envoi de la photo." });
  }
});

router.post('/requests', requestLimiter, createRequest);
router.post('/requests/status', statusLimiter, getRequestStatus);

module.exports = router;
