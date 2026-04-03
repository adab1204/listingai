// src/middleware/subscription.js
const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');

// ─── Check user has active subscription and credits ─
const requireCredits = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const subscription = await Subscription.getForUser(req.user._id);

    // Free tier: use credits on User model directly
    if (!subscription || subscription.plan === 'free') {
      if (req.user.credits <= 0) {
        return res.status(402).json({
          success: false,
          message: 'You have used all your free credits. Please upgrade your plan.',
          code: 'NO_CREDITS',
          upgradeUrl: '/pricing',
        });
      }
      req.subscription = null;
      return next();
    }

    // Paid plan
    if (!subscription.isActive) {
      return res.status(402).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue.',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    if (subscription.creditsRemaining <= 0) {
      return res.status(402).json({
        success: false,
        message: 'Monthly generation limit reached. Upgrade your plan for more.',
        code: 'PLAN_LIMIT_REACHED',
        plan: subscription.plan,
      });
    }

    req.subscription = subscription;
    return next();
  } catch (error) {
    logger.error('Subscription middleware error', { error: error.message });
    return next(error);
  }
};

// ─── Deduct credit after successful generation ─
const deductCredit = async (req) => {
  if (req.subscription) {
    req.subscription.creditsUsed += 1;
    await req.subscription.save({ validateBeforeSave: false });
  } else {
    // Free tier
    await req.user.deductCredit();
  }
};

module.exports = { requireCredits, deductCredit };
