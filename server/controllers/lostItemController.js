const LostItem = require('../models/LostItem');

const cleanIds = (ids) => (Array.isArray(ids) ? ids.filter(Boolean) : []);

// @desc    Get all lost-article photos (non-deleted)
// @route   GET /api/lost
exports.getLostItems = async (req, res) => {
  try {
    const items = await LostItem.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add one or more photos, optionally straight into a group
// @route   POST /api/lost  { images: [url], group? }
exports.createLostItems = async (req, res) => {
  try {
    const images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [];
    if (!images.length) return res.status(400).json({ message: 'Aucune photo fournie' });
    const group = String(req.body.group || '').trim();
    const items = await LostItem.insertMany(images.map((image) => ({ image, group })));
    res.status(201).json(items);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Put photos into a group (empty name removes them from their group)
// @route   PUT /api/lost/group  { ids: [id], group }
exports.setLostItemsGroup = async (req, res) => {
  try {
    const ids = cleanIds(req.body.ids);
    if (!ids.length) return res.status(400).json({ message: 'Aucune photo sélectionnée' });
    const group = String(req.body.group || '').trim();
    await LostItem.updateMany({ _id: { $in: ids }, isDeleted: false }, { group });
    res.json({ message: 'Groupe mis à jour' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Rename a group, or dissolve it when the new name is empty
// @route   PUT /api/lost/group/rename  { from, to }
exports.renameLostGroup = async (req, res) => {
  try {
    const from = String(req.body.from || '').trim();
    const to = String(req.body.to || '').trim();
    if (!from) return res.status(400).json({ message: 'Groupe introuvable' });
    await LostItem.updateMany({ group: from, isDeleted: false }, { group: to });
    res.json({ message: 'Groupe renommé' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Soft-delete one or more photos
// @route   POST /api/lost/delete  { ids: [id] }
exports.deleteLostItems = async (req, res) => {
  try {
    const ids = cleanIds(req.body.ids);
    if (!ids.length) return res.status(400).json({ message: 'Aucune photo sélectionnée' });
    await LostItem.updateMany({ _id: { $in: ids }, isDeleted: false }, { isDeleted: true });
    res.json({ message: 'Photos supprimées' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
