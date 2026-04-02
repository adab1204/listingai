// src/models/PaymentHistory.js
const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    razorpaySignature: String,
    plan: {
      type: String,
      required: true,
    },
    amount: {
      type: Number, // In paise (INR smallest unit)
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    verifiedAt: Date,
    failureReason: String,
    webhookData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      select: false, // Don't expose raw webhook data by default
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────
paymentHistorySchema.index({ userId: 1, createdAt: -1 });
paymentHistorySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
