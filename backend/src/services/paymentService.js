// src/services/paymentService.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');
const Subscription = require('../models/Subscription');
const PaymentHistory = require('../models/PaymentHistory');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_AMOUNTS = {
  starter:   659900,  // ₹6,599 in paise
  agent_pro: 1659900, // ₹16,599 in paise
  brokerage: 4999900, // ₹49,999 in paise
};

// ─── Create Razorpay order ────────────────
const createOrder = async ({ userId, plan }) => {
  if (!PLAN_AMOUNTS[plan]) throw new Error(`Invalid plan: ${plan}`);

  const amount = PLAN_AMOUNTS[plan];
  const receiptId = `rcpt_${userId.toString().slice(-8)}_${Date.now()}`;

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: receiptId,
    notes: { userId: userId.toString(), plan },
  });

  // Record in DB as 'created'
  await PaymentHistory.create({
    userId,
    razorpayOrderId: order.id,
    plan,
    amount,
    currency: 'INR',
    status: 'created',
  });

  logger.info('Razorpay order created', { orderId: order.id, plan, userId });
  return order;
};

// ─── Verify payment signature ─────────────
const verifyPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature, userId }) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    logger.warn('Payment signature mismatch', { razorpayOrderId, userId });
    throw new Error('Payment verification failed — invalid signature');
  }

  // Update payment record
  const payment = await PaymentHistory.findOneAndUpdate(
    { razorpayOrderId, userId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: 'paid',
      verifiedAt: new Date(),
    },
    { new: true }
  );

  if (!payment) throw new Error('Payment record not found');

  // Activate / upgrade subscription
  await activateSubscription({ userId, plan: payment.plan });

  logger.info('Payment verified and subscription activated', {
    userId,
    plan: payment.plan,
    paymentId: razorpayPaymentId,
  });

  return payment;
};

// ─── Activate subscription ────────────────
const activateSubscription = async ({ userId, plan }) => {
  const planConfig = Subscription.schema.statics?.PLANS?.[plan] ||
    require('../models/Subscription').PLANS?.[plan];

  const credits = {
    starter:   50,
    agent_pro: 200,
    brokerage: 9999,
  }[plan] || 5;

  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await Subscription.findOneAndUpdate(
    { userId },
    {
      plan,
      status: 'active',
      creditsTotal: credits,
      creditsUsed: 0,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    },
    { upsert: true, new: true }
  );

  // Sync credits to user record for fast lookups
  await User.findByIdAndUpdate(userId, { credits });
};

// ─── Handle Razorpay webhook ──────────────
const handleWebhook = async (body, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Webhook signature verification failed');
  }

  const { event, payload } = body;
  logger.info('Razorpay webhook received', { event });

  switch (event) {
    case 'payment.captured': {
      const payment = payload.payment.entity;
      await PaymentHistory.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { razorpayPaymentId: payment.id, status: 'paid', verifiedAt: new Date() }
      );
      break;
    }
    case 'payment.failed': {
      const payment = payload.payment.entity;
      await PaymentHistory.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { status: 'failed', failureReason: payment.error_description }
      );
      break;
    }
    case 'refund.created': {
      const refund = payload.refund.entity;
      await PaymentHistory.findOneAndUpdate(
        { razorpayPaymentId: refund.payment_id },
        { status: 'refunded' }
      );
      break;
    }
    default:
      logger.info(`Unhandled webhook event: ${event}`);
  }
};

module.exports = { createOrder, verifyPayment, handleWebhook };
