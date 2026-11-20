const PromoCode = require('../models/PromoCode');
const watcher = require('../services/promoWatcher');

// @route   GET /api/promo-codes?store=shein|zalando&country=it|fr|all
// Codes still listed by their website (seen by the watcher in the last 7 days),
// newest first. Expired ones are left out.
exports.getPromoCodes = async (req, res) => {
  try {
    const filter = {
      lastSeenAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    };
    if (['shein', 'zalando'].includes(req.query.store)) filter.store = req.query.store;
    if (['it', 'fr', 'all'].includes(req.query.country)) filter.country = req.query.country;
    const codes = await PromoCode.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(codes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/promo-codes/notifications
// What the bell shows: unread count + the latest unread codes.
exports.getNotifications = async (req, res) => {
  try {
    const filter = { seen: false, $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }] };
    const [count, latest] = await Promise.all([
      PromoCode.countDocuments(filter),
      PromoCode.find(filter).sort({ createdAt: -1 }).limit(8),
    ]);
    res.json({ count, latest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/promo-codes/seen   body: { ids?: [...] } (no ids = all)
exports.markSeen = async (req, res) => {
  try {
    const filter = { seen: false };
    if (Array.isArray(req.body?.ids)) filter._id = { $in: req.body.ids };
    const result = await PromoCode.updateMany(filter, { seen: true });
    res.json({ updated: result.modifiedCount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   POST /api/promo-codes/check
// Runs the watcher now and waits for it (takes a few seconds).
exports.checkNow = async (req, res) => {
  try {
    res.json(await watcher.runCheck());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/promo-codes/status
exports.getStatus = (req, res) => {
  res.json({ running: watcher.isRunning(), lastRun: watcher.getLastRun() });
};
