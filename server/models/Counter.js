const mongoose = require('mongoose');

// Named auto-increment counters (e.g. Shein request references)
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
