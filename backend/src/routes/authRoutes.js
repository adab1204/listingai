// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signup, login, refresh, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateSignup, validateLogin } = require('../validators/authValidators');

router.post('/signup',  authLimiter, validateSignup, signup);
router.post('/login',   authLimiter, validateLogin,  login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout',  protect,     logout);

module.exports = router;
