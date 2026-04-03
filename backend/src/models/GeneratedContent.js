// src/models/GeneratedContent.js
const mongoose = require('mongoose');

const generatedContentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['instagram', 'facebook', 'email', 'youtube', 'blog', 'stories'],
      required: true,
    },
    input: {
      address:  { type: String, required: true, maxlength: 500 },
      beds:     String,
      baths:    String,
      price:    String,
      notes:    { type: String, maxlength: 2000 },
    },
    output: {
      type: String,
      required: true,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    model: {
      type: String,
      default: 'llama3-70b-8192',
    },
    generationTimeMs: Number,
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────
generatedContentSchema.index({ userId: 1, createdAt: -1 });
generatedContentSchema.index({ userId: 1, contentType: 1 });
generatedContentSchema.index({ createdAt: -1 }); // For admin analytics

module.exports = mongoose.model('GeneratedContent', generatedContentSchema);
