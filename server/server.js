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

// Behind a reverse proxy (Render, Railway...) req.ip must be the visitor, not the proxy
app.set('trust proxy', 1);

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

// Public (no login): the Shein request form
app.use('/api/public', require('./routes/publicRoutes'));

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
app.use('/api/stats', protect, require('./routes/statsRoutes'));
app.use('/api/lost', protect, require('./routes/lostItemRoutes'));
app.use('/api/shein-requests', protect, require('./routes/sheinRequestRoutes'));
app.use('/api/promo-codes', protect, require('./routes/promoCodeRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('Malla Forssa API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Background check of coupon websites for new Shein/Zalando promo codes
  require('./services/promoWatcher').startPromoWatcher();
});
