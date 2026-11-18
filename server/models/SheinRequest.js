const mongoose = require('mongoose');

// An article the client wants us to order from Shein: a link and/or free text
// ("taille M, noir, x2"), usually backed by the pictures on the request.
const itemSchema = new mongoose.Schema({
  link: { type: String, trim: true, default: '' },
  details: { type: String, trim: true, default: '' },
}, { _id: false });

// A request sent from the public form by someone who isn't logged in.
// Statuses: new -> contacted -> accepted (a Client + ClientPanier get created) or rejected.
const sheinRequestSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  items: [itemSchema],
  images: [{ type: String }],
  note: {
    type: String,
    trim: true,
    default: '',
  },
  contactPref: {
    type: String,
    enum: ['whatsapp', 'call'],
    default: 'whatsapp',
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'accepted', 'rejected'],
    default: 'new',
  },
  rejectionReason: { type: String, trim: true, default: '' },
  adminNote: { type: String, trim: true, default: '' },
  estimatedAmountEur: { type: Number, min: 0, default: null },
  estimatedAmountTnd: { type: Number, min: 0, default: null },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  clientPanier: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientPanier' },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SheinRequest', sheinRequestSchema);
