const express = require('express');
const router = express.Router();
const {
  getPromoCodes,
  getNotifications,
  markSeen,
  checkNow,
  getStatus,
} = require('../controllers/promoCodeController');

router.get('/', getPromoCodes);
router.get('/notifications', getNotifications);
router.get('/status', getStatus);
router.put('/seen', markSeen);
router.post('/check', checkNow);

module.exports = router;
