// src/middleware/errorHandler.js
const logger = require('../utils/logger');

// ─── Operational vs programmer errors ────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Handle specific Mongoose errors ─────
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFields = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists. Please use a different value.`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Token expired. Please log in again.', 401);

// ─── Send error response ──────────────────
const sendError = (err, req, res) => {
  // Operational errors: send message to client
  if (err.isOperational) {
    console.error('ERROR:', err);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Programming errors: don't leak details
  console.error('ERROR:', err);
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    message: err.message || 'An unexpected error occurred. Please try again later.',
  });
};

// ─── Global error handling middleware ────
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  let error = { ...err, message: err.message };

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateFields(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  sendError(error, req, res);
};

// ─── Async wrapper to avoid try/catch in controllers ─
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, errorHandler, catchAsync };
