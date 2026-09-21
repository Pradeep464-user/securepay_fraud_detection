const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');
const authenticateToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

// Apply both middlewares to all admin routes
router.use(authenticateToken, requireAdmin);

// GET /api/admin/metrics
router.get('/metrics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTransactions = await Transaction.countDocuments();
    
    const lowRiskCount = await Transaction.countDocuments({ riskLevel: 'LOW' });
    const mediumRiskCount = await Transaction.countDocuments({ riskLevel: 'MEDIUM' });
    const highRiskCount = await Transaction.countDocuments({ riskLevel: 'HIGH' });

    const completedCount = await Transaction.countDocuments({ status: 'COMPLETED' });
    const underReviewCount = await Transaction.countDocuments({ status: 'UNDER_REVIEW' });
    const fraudCount = await Transaction.countDocuments({ status: 'FRAUD' });
    const monitoredCount = await Transaction.countDocuments({ status: 'MONITORED' });

    const openAlerts = await FraudAlert.countDocuments({ status: { $in: ['OPEN', 'INVESTIGATING'] } });
    const resolvedAlerts = await FraudAlert.countDocuments({ status: 'RESOLVED' });

    const totalVolumeResult = await Transaction.aggregate([
      { $match: { status: { $in: ['COMPLETED', 'MONITORED'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalVolume = totalVolumeResult.length > 0 ? totalVolumeResult[0].total : 0;

    return res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        totalTransactions,
        totalVolume,
        riskBreakdown: {
          low: lowRiskCount,
          medium: mediumRiskCount,
          high: highRiskCount
        },
        statusBreakdown: {
          completed: completedCount,
          monitored: monitoredCount,
          underReview: underReviewCount,
          fraud: fraudCount
        },
        alerts: {
          open: openAlerts,
          resolved: resolvedAlerts,
          total: openAlerts + resolvedAlerts
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin metrics',
      error: error.message
    });
  }
});

// GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { status, riskLevel, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (riskLevel && riskLevel !== 'ALL') {
      query.riskLevel = riskLevel;
    }

    let transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('sender', 'name email accountNumber balance')
      .populate('receiver', 'name email accountNumber balance')
      .populate('adminDecision.decidedBy', 'name email');

    if (search) {
      const s = search.toLowerCase();
      transactions = transactions.filter(
        (tx) =>
          tx.transactionId.toLowerCase().includes(s) ||
          tx.senderEmail.toLowerCase().includes(s) ||
          tx.receiverEmail.toLowerCase().includes(s)
      );
    }

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error.message
    });
  }
});

// GET /api/admin/transactions/:id
router.get('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('sender', 'name email accountNumber balance createdAt')
      .populate('receiver', 'name email accountNumber balance')
      .populate('adminDecision.decidedBy', 'name email');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Retrieve corresponding fraud alert
    const alert = await FraudAlert.findOne({ transaction: transaction._id })
      .populate('resolvedBy', 'name email');

    // Sender behavioral statistics
    const senderHistory = await Transaction.find({ sender: transaction.sender._id })
      .sort({ createdAt: -1 });

    const totalSent = senderHistory.length;
    const totalVolume = senderHistory.reduce((sum, tx) => sum + tx.amount, 0);
    const avgAmount = totalSent > 0 ? Math.round((totalVolume / totalSent) * 100) / 100 : 0;
    const flaggedCount = senderHistory.filter((tx) => tx.riskLevel === 'HIGH' || tx.status === 'FRAUD').length;

    return res.status(200).json({
      success: true,
      transaction,
      alert,
      behavioralProfile: {
        totalTransactions: totalSent,
        totalVolume,
        averageAmount: avgAmount,
        flaggedTransactions: flaggedCount,
        accountAgeDays: Math.floor((Date.now() - new Date(transaction.sender.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load transaction investigation',
      error: error.message
    });
  }
});

// POST /api/admin/transactions/:id/decision
router.post('/transactions/:id/decision', async (req, res) => {
  try {
    const { decision, notes } = req.body;
    // Allowed decisions: 'APPROVE', 'FLAG_FRAUD', 'KEEP_UNDER_REVIEW'
    if (!['APPROVE', 'FLAG_FRAUD', 'KEEP_UNDER_REVIEW'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be APPROVE, FLAG_FRAUD, or KEEP_UNDER_REVIEW.'
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const sender = await User.findById(transaction.sender);
    const receiver = await User.findById(transaction.receiver);

    if (decision === 'APPROVE') {
      // If was under review, funds were deducted from sender but not yet given to receiver
      if (transaction.status === 'UNDER_REVIEW') {
        receiver.balance += transaction.amount;
        await receiver.save();
      }
      transaction.status = 'COMPLETED';
      transaction.adminDecision = {
        decision: 'APPROVED',
        decidedBy: req.user._id,
        decidedAt: new Date(),
        notes: notes || 'Approved by security administrator after manual verification.'
      };

      // Resolve fraud alert if exists
      await FraudAlert.findOneAndUpdate(
        { transaction: transaction._id },
        {
          status: 'RESOLVED',
          notes: notes ? `Approved: ${notes}` : 'Approved by administrator',
          resolvedBy: req.user._id,
          resolvedAt: new Date()
        }
      );
    } else if (decision === 'FLAG_FRAUD') {
      // Confirmed Fraud!
      // If was under review, refund sender's debited money
      if (transaction.status === 'UNDER_REVIEW') {
        sender.balance += transaction.amount;
        await sender.save();
      } else if (transaction.status === 'COMPLETED' || transaction.status === 'MONITORED') {
        // Was already transferred: claw back from receiver if possible
        if (receiver.balance >= transaction.amount) {
          receiver.balance -= transaction.amount;
          sender.balance += transaction.amount;
          await receiver.save();
          await sender.save();
        }
      }

      transaction.status = 'FRAUD';
      transaction.adminDecision = {
        decision: 'FLAGGED_FRAUD',
        decidedBy: req.user._id,
        decidedAt: new Date(),
        notes: notes || 'Flagged as confirmed fraud by security administrator.'
      };

      // Resolve fraud alert as confirmed fraud
      await FraudAlert.findOneAndUpdate(
        { transaction: transaction._id },
        {
          status: 'RESOLVED',
          notes: notes ? `Confirmed Fraud: ${notes}` : 'Confirmed Fraud by administrator',
          resolvedBy: req.user._id,
          resolvedAt: new Date()
        }
      );
    } else if (decision === 'KEEP_UNDER_REVIEW') {
      transaction.status = 'UNDER_REVIEW';
      transaction.adminDecision = {
        decision: 'UNDER_REVIEW',
        decidedBy: req.user._id,
        decidedAt: new Date(),
        notes: notes || 'Kept under investigation by security administrator.'
      };

      await FraudAlert.findOneAndUpdate(
        { transaction: transaction._id },
        {
          status: 'INVESTIGATING',
          notes: notes || 'Marked as under ongoing investigation'
        }
      );
    }

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: `Transaction successfully updated to ${transaction.status}`,
      transaction
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process admin decision',
      error: error.message
    });
  }
});

// GET /api/admin/alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await FraudAlert.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'transaction',
        populate: [
          { path: 'sender', select: 'name email accountNumber' },
          { path: 'receiver', select: 'name email accountNumber' }
        ]
      })
      .populate('sender', 'name email accountNumber')
      .populate('resolvedBy', 'name email');

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve fraud alerts',
      error: error.message
    });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
});

module.exports = router;
