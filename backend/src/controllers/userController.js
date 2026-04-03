// src/controllers/userController.js
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const GeneratedContent = require('../models/GeneratedContent');
const { catchAsync } = require('../middleware/errorHandler');

// ─── GET /user/profile ────────────────────
const getProfile = catchAsync(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// ─── GET /user/subscription ───────────────
const getSubscription = catchAsync(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const subscription = await Subscription.findOne({ userId: req.user._id });

  res.json({
    success: true,
    data: subscription || {
      plan: 'free',
      status: 'active',
      creditsTotal: 5,
      creditsUsed: 5 - req.user.credits,
      creditsRemaining: req.user.credits,
    },
  });
});

// ─── GET /user/usage ──────────────────────
const getUsage = catchAsync(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const [total, byType] = await Promise.all([
    GeneratedContent.countDocuments({ userId: req.user._id }),
    GeneratedContent.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalGenerations: total,
      byContentType: byType.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {}),
    },
  });
});

module.exports = { getProfile, getSubscription, getUsage };
