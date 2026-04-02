// src/routes/contentRoutes.js
const express = require('express');
const router = express.Router();
const { generate, getHistory, getById } = require('../controllers/contentController');
const { protect } = require('../middleware/auth');
const { requireCredits } = require('../middleware/subscription');
const { generateLimiter } = require('../middleware/rateLimiter');
const { validateGenerate } = require('../validators/authValidators');

// All content routes require authentication
router.use(protect);

router.post(
  '/generate-content',
  generateLimiter,
  validateGenerate,
  requireCredits,
  generate
);

router.get('/content/history', getHistory);
router.get('/content/:id',     getById);

module.exports = router;
