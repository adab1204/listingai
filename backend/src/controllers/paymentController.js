// src/controllers/paymentController.js
const { createOrder, verifyPayment, handleWebhook } = require('../services/paymentService');
const PaymentHistory = require('../models/PaymentHistory');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ─── POST /payments/create-order ─────────
const createPaymentOrder = catchAsync(async (req, res) => {
  const { plan } = req.body;

  const order = await createOrder({ userId: req.user._id, plan });

  res.status(201).json({
    success: true,
    data: {
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    },
  });
});

// ─── POST /payments/verify ────────────────
const verifyPaymentSignature = catchAsync(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const payment = await verifyPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    userId: req.user._id,
  });

  res.json({
    success: true,
    message: 'Payment verified. Subscription activated.',
    data: {
      paymentId: payment.razorpayPaymentId,
      plan:      payment.plan,
      status:    payment.status,
    },
  });
});

// ─── POST /payments/webhook ───────────────
// Raw body required — configured in server.js
const webhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) throw new AppError('Missing webhook signature.', 400);

  await handleWebhook(req.body, signature);

  // Razorpay expects 200 quickly
  res.status(200).json({ received: true });
});

// ─── GET /payments/history ────────────────
const getPaymentHistory = catchAsync(async (req, res) => {
  const payments = await PaymentHistory.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('-webhookData -razorpaySignature -__v');

  res.json({ success: true, data: payments });
});

module.exports = { createPaymentOrder, verifyPaymentSignature, webhook, getPaymentHistory };
