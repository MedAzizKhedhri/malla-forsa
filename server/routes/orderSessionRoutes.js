const express = require('express');
const router = express.Router();
const { getOrderSessions, getOrderSessionById, createOrderSession, updateOrderSession, deleteOrderSession } = require('../controllers/orderSessionController');

router.route('/')
  .get(getOrderSessions)
  .post(createOrderSession);

router.route('/:id')
  .get(getOrderSessionById)
  .put(updateOrderSession)
  .delete(deleteOrderSession);

module.exports = router;
