const OrderSession = require('../models/OrderSession');
const ClientPanier = require('../models/ClientPanier');
const Client = require('../models/Client');

function buildMatch({ month, arrivage }) {
  const match = {};
  if (month) {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    match.createdAt = { $gte: start, $lt: end };
  }
  if (arrivage) {
    match.arrivage = arrivage;
  }
  return match;
}

// @desc    Somme EUR / Somme USD / nombre de clients / nombre d'articles,
//          optionally filtered by month and/or arrivage (combinable).
// @route   GET /api/stats/summary?month=YYYY-MM&arrivage=...
exports.getStatsSummary = async (req, res) => {
  try {
    const { month, arrivage } = req.query;
    const match = buildMatch({ month, arrivage });
    const hasFilter = Boolean(month || arrivage);

    const [facet] = await OrderSession.aggregate([
      { $match: match },
      {
        $facet: {
          byDevise: [{ $group: { _id: '$devise', total: { $sum: '$totalPrice' } } }],
          totals: [{ $group: { _id: null, nbreArticles: { $sum: '$nombreArticles' }, panierIds: { $push: '$_id' } } }],
        },
      },
    ]);

    const sommeEUR = facet.byDevise.find(d => d._id === 'EUR')?.total || 0;
    const sommeUSD = facet.byDevise.find(d => d._id === 'USD')?.total || 0;
    const nbreArticles = facet.totals[0]?.nbreArticles || 0;
    const panierIds = facet.totals[0]?.panierIds || [];

    // TND figures come from clients' own commandes (ClientPanier), not the panier
    // in its buying currency — a commande's due amount is estimatedAmountTnd +
    // insuranceFee, already paid down by paymentHistory (same math as the Clients page).
    const clientPanierMatch = hasFilter ? { panier: { $in: panierIds } } : {};
    const [cpFacet] = await ClientPanier.aggregate([
      { $match: clientPanierMatch },
      {
        $addFields: {
          dueAmount: { $add: ['$estimatedAmountTnd', '$insuranceFee'] },
          paidAmount: { $sum: '$paymentHistory.amount' },
        },
      },
      {
        $group: {
          _id: null,
          sommeTND: { $sum: '$dueAmount' },
          payeTND: { $sum: '$paidAmount' },
          clientIds: { $addToSet: '$client' },
        },
      },
    ]);

    const sommeTND = cpFacet?.sommeTND || 0;
    const payeTND = cpFacet?.payeTND || 0;
    const detteTND = sommeTND - payeTND;

    const nbreClients = hasFilter
      ? (cpFacet?.clientIds || []).length
      : await Client.countDocuments();

    res.json({ sommeEUR, sommeUSD, nbreClients, nbreArticles, sommeTND, payeTND, detteTND });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Available months (with at least one panier) and distinct arrivage
//          tags, to populate the two Statistiques filters.
// @route   GET /api/stats/filter-options
exports.getFilterOptions = async (req, res) => {
  try {
    const [months, arrivages] = await Promise.all([
      OrderSession.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } } },
        { $sort: { _id: -1 } },
      ]),
      OrderSession.distinct('arrivage', { arrivage: { $nin: [null, ''] } }),
    ]);

    res.json({
      months: months.map(m => m._id),
      arrivages: arrivages.sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
