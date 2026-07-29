// One-off migration: split OrderSession.client (+ its payment fields) into
// standalone ClientPanier records, since a global Panier is no longer
// restricted to a single client. Run once: `node server/scripts/migrate-client-panier.js`
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mallaforsa');

  const db = mongoose.connection.db;
  const sessions = await db.collection('ordersessions').find({ client: { $exists: true, $ne: null } }).toArray();

  console.log(`Found ${sessions.length} OrderSession(s) with a legacy client field.`);

  for (const s of sessions) {
    const clientPanier = {
      client: s.client,
      panier: s._id,
      name: s.name,
      nombreArticles: s.nombreArticles || 0,
      estimatedAmountEur: s.estimatedAmountEur || 0,
      estimatedAmountTnd: s.estimatedAmountTnd || 0,
      insuranceFee: s.insuranceFee || 0,
      paymentStatus: s.paymentStatus || 'Pending',
      paymentHistory: s.paymentHistory || [],
      status: s.status || 'Open',
      createdAt: s.createdAt || new Date(),
      updatedAt: s.updatedAt || new Date(),
    };
    const inserted = await db.collection('clientpaniers').insertOne(clientPanier);
    console.log(`  -> migrated OrderSession ${s._id} to ClientPanier ${inserted.insertedId}`);

    await db.collection('ordersessions').updateOne(
      { _id: s._id },
      {
        $unset: {
          client: '', estimatedAmountEur: '', estimatedAmountTnd: '', insuranceFee: '',
          paymentStatus: '', paymentHistory: '', nombreClients: '',
        },
      }
    );
  }

  console.log('Migration complete.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
