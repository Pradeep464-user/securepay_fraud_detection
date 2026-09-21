const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderEmail: {
      type: String,
      required: true
    },
    receiverEmail: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0']
    },
    type: {
      type: String,
      default: 'transfer'
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'MONITORED', 'UNDER_REVIEW', 'FRAUD', 'REJECTED'],
      default: 'COMPLETED'
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true
    },
    breakdown: {
      amountScore: { type: Number, default: 0 },
      frequencyScore: { type: Number, default: 0 },
      timingScore: { type: Number, default: 0 },
      reasons: [{ type: String }],
      historicalAverage: { type: Number, default: 0 },
      recentCount: { type: Number, default: 0 },
      timingHour: { type: Number, default: 0 }
    },
    adminDecision: {
      decision: {
        type: String,
        enum: ['APPROVED', 'FLAGGED_FRAUD', 'UNDER_REVIEW', 'NONE'],
        default: 'NONE'
      },
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      decidedAt: {
        type: Date
      },
      notes: {
        type: String,
        default: ''
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
