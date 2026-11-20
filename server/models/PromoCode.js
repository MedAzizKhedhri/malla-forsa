const mongoose = require('mongoose');

// A Shein/Zalando promo code found on a coupon website by the promo watcher
// (services/promoWatcher.js). One document per offer per source: `sourceId` is
// the offer's id on that website, so the same offer is never stored twice.
// `code` is empty when the website hides it behind a "Voir le code" click; the
// admin then opens `sourceUrl` to reveal it.
const promoCodeSchema = new mongoose.Schema({
  store: {
    type: String,
    enum: ['shein', 'zalando'],
    required: true,
  },
  // 'it' / 'fr' for country sites, 'all' when the source doesn't say
  country: {
    type: String,
    enum: ['it', 'fr', 'all'],
    required: true,
  },
  source: { type: String, required: true },   // website name, e.g. "Scontify"
  sourceId: { type: String, required: true }, // offer id on that website
  sourceUrl: { type: String, default: '' },
  code: { type: String, default: '', trim: true },
  title: { type: String, default: '', trim: true },
  expiresAt: { type: Date, default: null },
  // false until the admin has seen it: drives the bell's unread count
  seen: { type: Boolean, default: false },
  // last time the watcher still found it on the website
  lastSeenAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

promoCodeSchema.index({ source: 1, sourceId: 1 }, { unique: true });
promoCodeSchema.index({ seen: 1 });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
