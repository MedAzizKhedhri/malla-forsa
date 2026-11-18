const SheinRequest = require('../models/SheinRequest');
const Client = require('../models/Client');
const ClientPanier = require('../models/ClientPanier');
const { samePhone } = require('../utils/phone');

const STATUSES = ['new', 'contacted', 'accepted', 'rejected'];

// Blank -> null, a non-negative number -> number, anything else -> NaN
const readAmount = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

// @desc    List requests (non-deleted), newest first
// @route   GET /api/shein-requests?status=new
exports.getRequests = async (req, res) => {
  try {
    const match = { isDeleted: false };
    if (STATUSES.includes(req.query.status)) match.status = req.query.status;
    const requests = await SheinRequest.find(match).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Number of requests nobody has looked at yet (for the sidebar badge)
// @route   GET /api/shein-requests/count
exports.getNewCount = async (req, res) => {
  try {
    const count = await SheinRequest.countDocuments({ isDeleted: false, status: 'new' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update status, notes and the price estimate
// @route   PUT /api/shein-requests/:id
exports.updateRequest = async (req, res) => {
  try {
    const { status, rejectionReason, adminNote, estimatedAmountEur, estimatedAmountTnd } = req.body;
    const update = {};

    if (status !== undefined) {
      if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Statut invalide' });
      update.status = status;
    }
    if (rejectionReason !== undefined) update.rejectionReason = String(rejectionReason).trim();
    if (adminNote !== undefined) update.adminNote = String(adminNote).trim();
    if (estimatedAmountEur !== undefined) update.estimatedAmountEur = readAmount(estimatedAmountEur);
    if (estimatedAmountTnd !== undefined) update.estimatedAmountTnd = readAmount(estimatedAmountTnd);
    if (Number.isNaN(update.estimatedAmountEur) || Number.isNaN(update.estimatedAmountTnd)) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    const request = await SheinRequest.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      update,
      { new: true, runValidators: true }
    );
    if (!request) return res.status(404).json({ message: 'Demande introuvable' });
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Accept a request: reuse the client with the same phone (or create one)
//          and open a ClientPanier carrying the pictures and the estimate
// @route   POST /api/shein-requests/:id/convert
exports.convertRequest = async (req, res) => {
  try {
    const request = await SheinRequest.findOne({ _id: req.params.id, isDeleted: false });
    if (!request) return res.status(404).json({ message: 'Demande introuvable' });
    if (request.clientPanier) return res.status(409).json({ message: 'Cette demande est déjà convertie.' });

    const clients = await Client.find({ phone: { $exists: true, $ne: '' } }).select('name phone');
    let client = clients.find((c) => samePhone(c.phone, request.phone));
    const existingClient = !!client;
    if (!client) client = await Client.create({ name: request.name, phone: request.phone });

    const clientPanier = await ClientPanier.create({
      client: client._id,
      name: `Shein ${request.reference}`,
      screenshots: request.images,
      nombreArticles: request.items.length,
      estimatedAmountEur: request.estimatedAmountEur || 0,
      estimatedAmountTnd: request.estimatedAmountTnd || 0,
    });

    request.client = client._id;
    request.clientPanier = clientPanier._id;
    request.status = 'accepted';
    await request.save();

    res.json({ request, clientName: client.name, existingClient });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Soft-delete a request
// @route   DELETE /api/shein-requests/:id
exports.deleteRequest = async (req, res) => {
  try {
    const request = await SheinRequest.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Demande introuvable' });
    res.json({ message: 'Demande supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
