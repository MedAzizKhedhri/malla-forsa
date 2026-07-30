const WinningProduct = require('../models/WinningProduct');

const sanitizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => String(t).trim()).filter(Boolean);
};

// @desc    Get winning products (non-deleted), optionally filtered by tags
// @route   GET /api/winning-products?tags=tag1,tag2
exports.getWinningProducts = async (req, res) => {
  try {
    const match = { isDeleted: false };
    if (req.query.tags) {
      const tags = req.query.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tags.length) match.tags = { $in: tags };
    }
    const items = await WinningProduct.find(match).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a winning product
// @route   POST /api/winning-products
exports.createWinningProduct = async (req, res) => {
  try {
    const { screenshot, description, tags } = req.body;
    const item = new WinningProduct({
      screenshot,
      description,
      tags: sanitizeTags(tags),
    });
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a winning product
// @route   PUT /api/winning-products/:id
exports.updateWinningProduct = async (req, res) => {
  try {
    const { screenshot, description, tags } = req.body;
    const update = { screenshot, description };
    if (tags !== undefined) update.tags = sanitizeTags(tags);
    const item = await WinningProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      update,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Soft-delete a winning product
// @route   DELETE /api/winning-products/:id
exports.deleteWinningProduct = async (req, res) => {
  try {
    const item = await WinningProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Produit introuvable' });
    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
