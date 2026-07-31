const BuyerAccount = require('../models/BuyerAccount');
const EmailLog = require('../models/EmailLog');

// Buyer Account Controllers
exports.getBuyerAccounts = async (req, res) => {
  try {
    const accounts = await BuyerAccount.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBuyerAccount = async (req, res) => {
  try {
    const account = new BuyerAccount(req.body);
    const savedAccount = await account.save();
    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateBuyerAccount = async (req, res) => {
  try {
    const account = await BuyerAccount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBuyerAccount = async (req, res) => {
  try {
    const account = await BuyerAccount.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    
    await EmailLog.deleteMany({ account: req.params.id });
    res.json({ message: 'Account and associated logs removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Email Log Controllers
exports.getEmailLogs = async (req, res) => {
  try {
    const filters = {};
    if (req.query.account) filters.account = req.query.account;
    if (req.query.status) filters.status = req.query.status;
    
    const logs = await EmailLog.find(filters)
      .populate('account', 'label email')
      .sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEmailLog = async (req, res) => {
  try {
    const log = new EmailLog(req.body);
    const savedLog = await log.save();
    res.status(201).json(savedLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateEmailLogStatus = async (req, res) => {
  try {
    const log = await EmailLog.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!log) return res.status(404).json({ message: 'EmailLog not found' });
    res.json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteEmailLog = async (req, res) => {
  try {
    const log = await EmailLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: 'EmailLog not found' });
    res.json({ message: 'EmailLog removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
