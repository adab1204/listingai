// src/controllers/authController.js
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { generateTokenPair, verifyRefreshToken } = require('../services/tokenService');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ─── POST /auth/signup ────────────────────
const signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await User.create({ name, email, password });

  // Create free subscription for new user
  await Subscription.create({ userId: user._id });

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Store hashed refresh token on user
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: refreshToken },
    lastLoginAt: new Date(),
  });

  logger.info('New user registered', { userId: user._id, email: user.email });

  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(201)
    .json({
      success: true,
      message: 'Account created successfully.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
      },
    });
});

// ─── POST /auth/login ─────────────────────
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Keep max 5 refresh tokens per user (cleanup old ones)
  const tokens = [...(user.refreshTokens || []), refreshToken].slice(-5);
  user.refreshTokens = tokens;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info('User logged in', { userId: user._id });

  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
      },
    });
});

// ─── POST /auth/refresh ───────────────────
const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError('Refresh token not provided.', 401);

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user || !user.refreshTokens?.includes(token)) {
    // Possible token reuse — invalidate all tokens
    if (user) {
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
    }
    throw new AppError('Refresh token reuse detected. Please log in again.', 401);
  }

  // Rotate: remove old, issue new
  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  user.refreshTokens.push(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  res
    .cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({ success: true, accessToken });
});

// ─── POST /auth/logout ────────────────────
const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: token },
    });
  }

  res
    .clearCookie('refreshToken')
    .json({ success: true, message: 'Logged out successfully.' });
});

module.exports = { signup, login, refresh, logout };
