const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  discount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  stock_quantity: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    default: 0
  },
  images: {
    type: [String],
    default: []
  },
  availability_status: {
    type: String,
    enum: ['In Stock', 'Out of Stock'],
    default: 'In Stock'
  }
}, {
  timestamps: true
});

// Update availability status based on stock before saving
productSchema.pre('save', function(next) {
  if (this.stock_quantity <= 0) {
    this.availability_status = 'Out of Stock';
  } else {
    this.availability_status = 'In Stock';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
