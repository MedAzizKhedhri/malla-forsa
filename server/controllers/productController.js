const Product = require('../models/Product');
const slugify = require('slugify');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    // Basic filtering and sorting can be added here
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product by slug or id
// @route   GET /api/products/:idOrSlug
// @access  Public
const getProduct = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product;
    
    // Check if it's a valid ObjectId
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug);
    } else {
      product = await Product.findOne({ slug: idOrSlug });
    }

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, price, discount, category, stock_quantity } = req.body;
    let slug = slugify(name, { lower: true, strict: true });
    
    // ensure unique slug
    let exists = await Product.findOne({ slug });
    if (exists) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = new Product({
      name,
      slug,
      description,
      price,
      discount,
      category,
      stock_quantity
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price !== undefined ? req.body.price : product.price;
      product.discount = req.body.discount !== undefined ? req.body.discount : product.discount;
      product.category = req.body.category || product.category;
      product.stock_quantity = req.body.stock_quantity !== undefined ? req.body.stock_quantity : product.stock_quantity;
      product.images = req.body.images || product.images;

      if (req.body.name && req.body.name !== product.name) {
         product.slug = slugify(req.body.name, { lower: true, strict: true });
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
