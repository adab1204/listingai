// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const handler = (req, res) => {
  logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again shortly.',
    retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
  });
};

// General API limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  handler,
});

// AI generation limiter — prevent expensive abuse
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  handler,
});

module.exports = { apiLimiter, authLimiter, generateLimiter };
