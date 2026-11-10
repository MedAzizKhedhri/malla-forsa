const LostItem = require('../models/LostItem');

const CAUSES = ['shein', 'transporteur'];

const cleanIds = (ids) => (Array.isArray(ids) ? ids.filter(Boolean) : []);

// Photos added before causes existed have no `cause` field and count as Shein
const causeMatch = (cause) => (cause === 'shein' ? { cause: { $in: ['shein', null] } } : { cause });

// Validated { cause, transporteur } from a request body
const readCause = (body) => {
  const cause = CAUSES.includes(body.cause) ? body.cause : null;
  const transporteur = cause === 'transporteur' ? String(body.transporteur || '').trim() : '';
  return { cause, transporteur };
};

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

// @desc    Add one or more photos for a cause, optionally straight into a group
// @route   POST /api/lost  { images: [url], cause, transporteur?, group? }
exports.createLostItems = async (req, res) => {
  try {
    const images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [];
    if (!images.length) return res.status(400).json({ message: 'Aucune photo fournie' });
    const { cause, transporteur } = readCause(req.body);
    if (!cause) return res.status(400).json({ message: 'Cause invalide' });
    const group = String(req.body.group || '').trim();
    const items = await LostItem.insertMany(images.map((image) => ({ image, cause, transporteur, group })));
    res.status(201).json(items);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Change who lost the selected photos
// @route   PUT /api/lost/cause  { ids: [id], cause, transporteur? }
exports.setLostItemsCause = async (req, res) => {
  try {
    const ids = cleanIds(req.body.ids);
    if (!ids.length) return res.status(400).json({ message: 'Aucune photo sélectionnée' });
    const { cause, transporteur } = readCause(req.body);
    if (!cause) return res.status(400).json({ message: 'Cause invalide' });
    await LostItem.updateMany({ _id: { $in: ids }, isDeleted: false }, { cause, transporteur });
    res.json({ message: 'Cause mise à jour' });
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

// @desc    Rename a group within a cause, or dissolve it when the new name is empty
// @route   PUT /api/lost/group/rename  { cause, from, to }
exports.renameLostGroup = async (req, res) => {
  try {
    const from = String(req.body.from || '').trim();
    const to = String(req.body.to || '').trim();
    const { cause } = readCause(req.body);
    if (!from || !cause) return res.status(400).json({ message: 'Groupe introuvable' });
    await LostItem.updateMany({ group: from, isDeleted: false, ...causeMatch(cause) }, { group: to });
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
