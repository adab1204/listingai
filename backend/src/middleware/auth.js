// src/middleware/auth.js
const { verifyAccessToken } = require('../services/tokenService');
const User = require('../models/User');
const logger = require('../utils/logger');

// ─── Protect routes — requires valid JWT ─
const protect = async (req, res, next) => {
  try {
    let token;

    // Accept token from Authorization header or httpOnly cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub).select('+passwordChangedAt');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    logger.warn('Auth middleware error', { error: error.message });
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ─── Restrict to specific roles ──────────
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action.',
    });
  }
  next();
};

module.exports = { protect, restrictTo };
