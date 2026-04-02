// src/controllers/contentController.js
const { generateContent } = require('../services/aiService');
const { deductCredit } = require('../middleware/subscription');
const GeneratedContent = require('../models/GeneratedContent');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ─── POST /generate-content ───────────────
const generate = catchAsync(async (req, res) => {
  const { contentType, listing } = req.body;

  const result = await generateContent({ contentType, listing });

  // Deduct credit
  await deductCredit(req);

  // Persist to DB
  const saved = await GeneratedContent.create({
    userId: req.user._id,
    contentType,
    input: listing,
    output: result.output,
    tokensUsed: result.tokensUsed,
    model: result.model,
    generationTimeMs: result.generationTimeMs,
  });

  logger.info('Content generated', {
    userId: req.user._id,
    contentType,
    docId: saved._id,
  });

  res.status(201).json({
    success: true,
    data: {
      id: saved._id,
      contentType,
      output: result.output,
      tokensUsed: result.tokensUsed,
      generationTimeMs: result.generationTimeMs,
    },
  });
});

// ─── GET /content/history ─────────────────
const getHistory = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    GeneratedContent.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    GeneratedContent.countDocuments({ userId: req.user._id }),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ─── GET /content/:id ─────────────────────
const getById = catchAsync(async (req, res) => {
  const item = await GeneratedContent.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Content not found.' });
  }

  res.json({ success: true, data: item });
});

module.exports = { generate, getHistory, getById };
