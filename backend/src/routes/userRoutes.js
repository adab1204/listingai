// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getProfile, getSubscription, getUsage } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile',      getProfile);
router.get('/subscription', getSubscription);
router.get('/usage',        getUsage);

module.exports = router;
