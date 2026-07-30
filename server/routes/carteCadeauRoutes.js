const express = require('express');
const router = express.Router();
const {
  getCarteCadeaux,
  createCarteCadeau,
  updateCarteCadeau,
  deleteCarteCadeau,
} = require('../controllers/carteCadeauController');

router.route('/')
  .get(getCarteCadeaux)
  .post(createCarteCadeau);

router.route('/:id')
  .put(updateCarteCadeau)
  .delete(deleteCarteCadeau);

module.exports = router;
