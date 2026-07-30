const express = require('express');
const router = express.Router();
const {
  getWinningProducts,
  createWinningProduct,
  updateWinningProduct,
  deleteWinningProduct,
} = require('../controllers/winningProductController');

router.route('/')
  .get(getWinningProducts)
  .post(createWinningProduct);

router.route('/:id')
  .put(updateWinningProduct)
  .delete(deleteWinningProduct);

module.exports = router;
