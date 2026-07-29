const express = require('express');
const router = express.Router();
const { getTransporteurs, createTransporteur, updateTransporteur, deleteTransporteur } = require('../controllers/transporteurController');

router.route('/')
  .get(getTransporteurs)
  .post(createTransporteur);

router.route('/:id')
  .put(updateTransporteur)
  .delete(deleteTransporteur);

module.exports = router;
