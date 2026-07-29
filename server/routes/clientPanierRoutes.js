const express = require('express');
const router = express.Router();
const {
  getClientPaniers,
  getClientPanierById,
  createClientPanier,
  updateClientPanier,
  addPayment,
  deleteClientPanier,
} = require('../controllers/clientPanierController');

router.route('/')
  .get(getClientPaniers)
  .post(createClientPanier);

router.route('/:id')
  .get(getClientPanierById)
  .put(updateClientPanier)
  .delete(deleteClientPanier);

router.post('/:id/payment', addPayment);

module.exports = router;
