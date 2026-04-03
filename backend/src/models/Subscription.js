const mongoose = require('mongoose');

const PLANS = {
  free: { creditsTotal: 5 },
  starter: { creditsTotal: 50 },
  agent_pro: { creditsTotal: 200 },
  brokerage: { creditsTotal: 9999 },
};

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: Object.keys(PLANS),
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active',
    },
    creditsTotal: {
      type: Number,
      default: PLANS.free.creditsTotal,
      min: 0,
    },
    creditsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

subscriptionSchema.virtual('creditsRemaining').get(function creditsRemaining() {
  return Math.max(0, (this.creditsTotal || 0) - (this.creditsUsed || 0));
});

subscriptionSchema.virtual('isActive').get(function isActive() {
  const isStatusActive = this.status === 'active';
  const hasNotExpired = !this.currentPeriodEnd || this.currentPeriodEnd > new Date();
  return isStatusActive && hasNotExpired;
});

subscriptionSchema.pre('validate', function applyPlanDefaults(next) {
  const planConfig = PLANS[this.plan] || PLANS.free;
  if (!this.creditsTotal && planConfig.creditsTotal) {
    this.creditsTotal = planConfig.creditsTotal;
  }
  next();
});

subscriptionSchema.statics.PLANS = PLANS;

subscriptionSchema.statics.getForUser = function getForUser(userId) {
  return this.findOne({ userId });
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
