const express = require('express');
const router = express.Router();
const { getArrivageStats, getOverviewStats } = require('../controllers/statsController');

router.get('/arrivages', getArrivageStats);
router.get('/overview', getOverviewStats);

module.exports = router;
