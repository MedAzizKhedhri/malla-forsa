const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded images


const { protect } = require('./middleware/auth');

// Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// New Broker MVP routes (Protected)
app.use('/api/clients', protect, require('./routes/clientRoutes'));
app.use('/api/colis', protect, require('./routes/colisRoutes'));
app.use('/api/order-sessions', protect, require('./routes/orderSessionRoutes'));
app.use('/api/client-paniers', protect, require('./routes/clientPanierRoutes'));
app.use('/api/emails', protect, require('./routes/emailRoutes'));
app.use('/api/locations', protect, require('./routes/locationRoutes'));
app.use('/api/transporteurs', protect, require('./routes/transporteurRoutes'));
app.use('/api/carte-cadeaux', protect, require('./routes/carteCadeauRoutes'));
app.use('/api/winning-products', protect, require('./routes/winningProductRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('Malla Forssa API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
