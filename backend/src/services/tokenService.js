// src/services/tokenService.js
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateAccessToken = (payload) => {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    algorithm: 'HS256',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, jti: uuidv4() }, // jti = unique token ID for rotation
    getRefreshSecret(),
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      algorithm: 'HS256',
    }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};

const generateTokenPair = (user) => {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
};
