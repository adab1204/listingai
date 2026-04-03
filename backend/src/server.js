// src/server.js
'use strict';
require("dotenv").config({
  path: require("path").join(__dirname, "../.env")
});
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const requiredEnvVars = [
  { key: 'MONGO_URI', fallback: 'MONGODB_URI' },
  { key: 'JWT_SECRET', fallback: 'JWT_ACCESS_SECRET' },
  { key: 'FRONTEND_URL' },
  { key: 'AI_API_KEY', fallback: 'GROQ_API_KEY' },
];

const missingEnvVars = requiredEnvVars
  .filter(({ key, fallback }) => !process.env[key] && !(fallback && process.env[fallback]))
  .map(({ key, fallback }) => (fallback ? `${key} (or ${fallback})` : key));

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables', { missingEnvVars });
  process.exit(1);
}

// ─── Unhandled rejection / uncaught exception guards ─
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

// ─── Graceful shutdown ────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000); // Force exit after 10s
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// ─── Start server ─────────────────────────
let server;

(async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    logger.info(`ListingAI API running`, {
      port: PORT,
      env:  process.env.NODE_ENV,
      pid:  process.pid,
    });
  });
})();
