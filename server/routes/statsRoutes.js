const express = require('express');
const router = express.Router();
const { getStatsSummary, getFilterOptions } = require('../controllers/statsController');

router.get('/summary', getStatsSummary);
router.get('/filter-options', getFilterOptions);

module.exports = router;
