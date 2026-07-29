const express = require('express');
const router = express.Router();
const {
  getColis,
  getColisById,
  createColis,
  updateColis,
  deleteColis,
} = require('../controllers/colisController');

router.route('/')
  .get(getColis)
  .post(createColis);

router.route('/:id')
  .get(getColisById)
  .put(updateColis)
  .delete(deleteColis);

module.exports = router;
