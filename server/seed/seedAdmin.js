require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const EMAIL = 'admin@mallaforsa.tn';
const PASSWORD = 'Malla@2025!';

(async () => {
  await connectDB();

  const existing = await Admin.findOne({ email: EMAIL });
  if (existing) {
    console.log(`Admin already exists: ${EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  await Admin.create({ email: EMAIL, password: PASSWORD });
  console.log('✓ Admin created successfully');
  console.log(`  Email    : ${EMAIL}`);
  console.log(`  Password : ${PASSWORD}`);

  await mongoose.disconnect();
})();
