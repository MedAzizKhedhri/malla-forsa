const express = require('express');
const router = express.Router();
const {
  getLostItems,
  createLostItems,
  setLostItemsGroup,
  renameLostGroup,
  deleteLostItems,
} = require('../controllers/lostItemController');

router.route('/')
  .get(getLostItems)
  .post(createLostItems);

router.put('/group', setLostItemsGroup);
router.put('/group/rename', renameLostGroup);
router.post('/delete', deleteLostItems);

module.exports = router;
