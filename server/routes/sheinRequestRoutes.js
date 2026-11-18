const express = require('express');
const router = express.Router();
const {
  getRequests,
  getNewCount,
  updateRequest,
  convertRequest,
  deleteRequest,
} = require('../controllers/sheinRequestController');

router.get('/', getRequests);
router.get('/count', getNewCount);
router.post('/:id/convert', convertRequest);

router.route('/:id')
  .put(updateRequest)
  .delete(deleteRequest);

module.exports = router;
