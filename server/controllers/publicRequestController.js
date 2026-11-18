const SheinRequest = require('../models/SheinRequest');
const Counter = require('../models/Counter');
const { normalizePhone } = require('../utils/phone');

const MAX_ITEMS = 10;
const MAX_IMAGES = 10;

const clean = (value, max) => String(value || '').trim().slice(0, max);

// shein.com, fr.shein.com, shein.co.uk, shein.top ...
const SHEIN_HOST = /(^|\.)shein\.[a-z]{2,}(\.[a-z]{2})?$/i;

// Accepts a bare link or the text Shein's "share" button produces (a sentence
// containing the link) and returns the clean Shein URL, or null.
const extractSheinLink = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return null;
  let candidate = (raw.match(/https?:\/\/[^\s<>"']+/i) || [])[0];
  if (!candidate) {
    const word = raw.split(/\s+/).find((w) => /shein\.[a-z]/i.test(w));
    if (word) candidate = `https://${word}`;
  }
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol) || !SHEIN_HOST.test(url.hostname)) return null;
    return url.href.slice(0, 600);
  } catch {
    return null;
  }
};

const nextReference = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'sheinRequest' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `SH-${String(counter.seq).padStart(4, '0')}`;
};

// @desc    Send a Shein request (public, no login)
// @route   POST /api/public/requests  { name, phone, items: [{link, details}], images: [url], note, contactPref }
exports.createRequest = async (req, res) => {
  try {
    const body = req.body || {};

    // Hidden "website" field: humans leave it empty, bots fill it. Pretend it worked.
    if (body.website) return res.status(201).json({ reference: 'SH-0000' });

    const name = clean(body.name, 80);
    if (name.length < 2) return res.status(400).json({ message: 'Veuillez entrer votre nom.' });

    const phone = normalizePhone(body.phone);
    if (!phone) return res.status(400).json({ message: 'Numéro de téléphone invalide.' });

    const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
    const items = [];
    for (const raw of rawItems) {
      const rawLink = clean(raw && raw.link, 1000);
      const details = clean(raw && raw.details, 200);
      let link = '';
      if (rawLink) {
        link = extractSheinLink(rawLink);
        if (!link) return res.status(400).json({ message: "Un des liens n'est pas un lien Shein valide." });
      }
      if (link || details) items.push({ link, details });
    }

    // Only pictures that went through our own upload are accepted
    const base = String(process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    const rawImages = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : [];
    const images = rawImages.filter((u) => typeof u === 'string' && base && u.startsWith(`${base}/`));
    if (images.length !== rawImages.length) return res.status(400).json({ message: 'Photo invalide.' });

    if (!images.length && !items.some((i) => i.link)) {
      return res.status(400).json({ message: 'Ajoutez au moins une photo ou un lien Shein.' });
    }

    const request = await SheinRequest.create({
      reference: await nextReference(),
      name,
      phone,
      items,
      images,
      note: clean(body.note, 1000),
      contactPref: body.contactPref === 'call' ? 'call' : 'whatsapp',
    });
    res.status(201).json({ reference: request.reference });
  } catch (error) {
    console.error('[public request] failed:', error);
    res.status(500).json({ message: 'Une erreur est survenue, réessayez.' });
  }
};
exports.extractSheinLink = extractSheinLink;
