const Client = require('../models/Client');
const ClientPanier = require('../models/ClientPanier');

// Query params (all optional, combinable):
//   isPriority=true|false  - filter by the priority flag
//   dette=true|false       - true: client has >=1 ClientPanier with paymentStatus
//                             Pending or Partially Paid (i.e. owes money)
//   closed=true|false      - true: client has >=1 ClientPanier with status Closed
exports.getClients = async (req, res) => {
  try {
    const match = {};
    if (req.query.isPriority !== undefined) {
      match.isPriority = req.query.isPriority === 'true';
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: ClientPanier.collection.name,
          localField: '_id',
          foreignField: 'client',
          as: 'clientPaniers',
        },
      },
      {
        $addFields: {
          hasDette: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$clientPaniers',
                    cond: { $in: ['$$this.paymentStatus', ['Pending', 'Partially Paid']] },
                  },
                },
              },
              0,
            ],
          },
          hasClosed: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$clientPaniers',
                    cond: { $eq: ['$$this.status', 'Closed'] },
                  },
                },
              },
              0,
            ],
          },
        },
      },
    ];

    if (req.query.dette !== undefined) {
      pipeline.push({ $match: { hasDette: req.query.dette === 'true' } });
    }
    if (req.query.closed !== undefined) {
      pipeline.push({ $match: { hasClosed: req.query.closed === 'true' } });
    }

    // Priority clients float to the top; existing default order (newest first) as tiebreaker
    pipeline.push({ $sort: { isPriority: -1, createdAt: -1 } });

    const clients = await Client.aggregate(pipeline);
    await Client.populate(clients, { path: 'compteAcheteur', select: 'label' });

    const enriched = clients.map((client) => {
      const clientPaniers = client.clientPaniers || [];
      const totalDue = clientPaniers.reduce((sum, cp) => sum + cp.estimatedAmountTnd + cp.insuranceFee, 0);
      const totalPaid = clientPaniers.reduce(
        (sum, cp) => sum + (cp.paymentHistory || []).reduce((a, p) => a + p.amount, 0),
        0
      );
      const { clientPaniers: _clientPaniers, hasDette, hasClosed, ...rest } = client;
      return {
        ...rest,
        totalDue,
        totalPaid,
        totalReste: totalDue - totalPaid,
        panierCount: clientPaniers.length,
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('compteAcheteur', 'label');
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { name, phone, contactInfo, nombreArticles, compteAcheteur } = req.body;
    const client = new Client({ name, phone, contactInfo, nombreArticles, compteAcheteur: compteAcheteur || undefined });
    const savedClient = await client.save();
    res.status(201).json(savedClient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { name, phone, contactInfo, nombreArticles, compteAcheteur, isPriority } = req.body;
    const update = { name, phone, contactInfo, nombreArticles, compteAcheteur: compteAcheteur || undefined };
    if (isPriority !== undefined) update.isPriority = isPriority;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
