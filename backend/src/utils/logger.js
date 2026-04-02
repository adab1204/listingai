// src/utils/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const logDir = process.env.LOG_DIR || 'logs';

const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];

// Scrub sensitive data before logging
const scrubSecrets = winston.format((info) => {
  const scrub = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = sensitiveFields.some(f => key.toLowerCase().includes(f))
        ? '[REDACTED]'
        : scrub(obj[key]);
      return acc;
    }, Array.isArray(obj) ? [] : {});
  };
  if (info.meta) info.meta = scrub(info.meta);
  return info;
});

const format = winston.format.combine(
  scrubSecrets(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d',
    zippedArchive: true,
  }),
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    zippedArchive: true,
  }),
];

if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format,
  transports,
  exitOnError: false,
});

module.exports = logger;
