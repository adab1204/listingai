// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPaymentSignature,
  webhook,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validatePaymentOrder, validatePaymentVerify } = require('../validators/authValidators');

// Webhook must use raw body — mounted separately in server.js
router.post('/webhook', webhook);

// Protected payment routes
router.use(protect);
router.post('/create-order', validatePaymentOrder, createPaymentOrder);
router.post('/verify',       validatePaymentVerify, verifyPaymentSignature);
router.get('/history',       getPaymentHistory);

module.exports = router;
