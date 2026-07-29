const express = require('express');
const router = express.Router();
const { 
  getBuyerAccounts, 
  createBuyerAccount, 
  deleteBuyerAccount,
  getEmailLogs,
  createEmailLog,
  updateEmailLogStatus,
  deleteEmailLog
} = require('../controllers/emailController');

// Account routes
router.route('/accounts')
  .get(getBuyerAccounts)
  .post(createBuyerAccount);

router.route('/accounts/:id')
  .delete(deleteBuyerAccount);

// Log routes
router.route('/logs')
  .get(getEmailLogs)
  .post(createEmailLog);

router.route('/logs/:id')
  .put(updateEmailLogStatus)
  .delete(deleteEmailLog);

module.exports = router;
