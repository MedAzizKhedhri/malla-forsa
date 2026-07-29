const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const BuyerAccount = require('./models/BuyerAccount');
const Client = require('./models/Client');

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mallaforssa';

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Seed Admin
    const adminExists = await Admin.findOne({ email: 'broker@malla.tn' });
    if (!adminExists) {
      console.log('Seeding default Admin...');
      await Admin.create({
        email: 'broker@malla.tn',
        password: 'broker123'
      });
      console.log('Admin seeded: broker@malla.tn / broker123');
    } else {
      console.log('Admin already exists.');
    }

    // 2. Seed Buyer Accounts
    const accountsCount = await BuyerAccount.countDocuments();
    if (accountsCount === 0) {
      console.log('Seeding default Buyer Accounts...');
      await BuyerAccount.create([
        { email: 'shein.fr.broker1@gmail.com', label: 'Compte 1 - Shein FR' },
        { email: 'zara.es.broker2@gmail.com', label: 'Compte 2 - Zara ES' }
      ]);
      console.log('Buyer Accounts seeded.');
    } else {
      console.log('Buyer Accounts already exist.');
    }

    // 3. Seed Clients
    const clientsCount = await Client.countDocuments();
    if (clientsCount === 0) {
      console.log('Seeding default Clients...');
      await Client.create([
        { name: 'Sami Laribi', phone: '+216 98 123 456', contactInfo: 'Avenue Habib Bourguiba, Tunis' },
        { name: 'Amira Ben Ali', phone: '+216 55 789 012', contactInfo: 'Kantaoui, Sousse' }
      ]);
      console.log('Clients seeded.');
    } else {
      console.log('Clients already exist.');
    }

    console.log('Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error.message);
    process.exit(1);
  }
};

seed();
