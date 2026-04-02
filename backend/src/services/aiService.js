// src/services/aiService.js
require("dotenv").config();
const OpenAI = require('openai');
const logger = require('../utils/logger');

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODEL = 'llama3-70b-8192';
const MAX_TOKENS = 700;
console.log("GROQ KEY:", process.env.GROQ_API_KEY);
// ─── Helper: Compact Listing Formatter ───
const formatListing = (l) => {
  const details = [
    l.beds && `${l.beds} beds`,
    l.baths && `${l.baths} baths`,
    l.price && `${l.price}`
  ].filter(Boolean).join(', ');

  return `${l.address || ''}\n${details}\n${l.notes || ''}`.trim();
};

// ─── Optimized Prompt Templates (LLaMA Style) ───
const PROMPTS = {
  instagram: (l) => `Write a high-converting real estate Instagram post.

Listing:
${formatListing(l)}

Rules:
- Strong hook (no "Just Listed")
- 3 short sentences (sensory + benefits)
- Clear CTA
- 10 hashtags (new line)
- 2–3 emojis

Output only the post.`,

  facebook: (l) => `Write a Facebook real estate ad.

Listing:
${formatListing(l)}

Format:
HEADLINE (<40 chars)
PRIMARY TEXT (3 sentences, benefit first, urgency)
DESCRIPTION (1 line)
CTA (Learn More / Schedule Tour / Contact)

No fluff. Output only.`,

  email: (l) => `Write a 5-email real estate drip campaign.

Listing:
${formatListing(l)}

Format:
EMAIL [#] - Day [#] - Subject
Body (3 short paragraphs, human tone, signed Agent)

Days:
1 Announcement
4 Neighborhood
8 Features
14 Market
21 Final CTA`,

  youtube: (l) => `Write a real estate YouTube walkthrough script.

Listing:
${formatListing(l)}

Sections:
HOOK (0-15s)
EXTERIOR
LIVING
BEDROOMS
FEATURES
CTA

Include [B-ROLL].
Sound natural.`,

  blog: (l) => `Write a 600-800 word real estate blog.

Listing:
${formatListing(l)}

Include:
- SEO title
- Hook intro
- Neighborhood value
- Budget insights
- Lifestyle
- Market timing
- CTA
- Meta (<155 chars)

Tone: confident.`,

  stories: (l) => `Create 7 Instagram story slides.

Listing:
${formatListing(l)}

Each:
TITLE
VISUAL
TEXT
STICKER
TONE

Flow:
Tease → Reveal → Features → Area → Proof → CTA`,
};

// ─── Standard (non-streaming) generation ─
const generateContent = async ({ contentType, listing }) => {
  if (!PROMPTS[contentType]) {
    throw new Error(`Unknown content type: ${contentType}`);
  }

  const prompt = PROMPTS[contentType](listing);
  const startTime = Date.now();

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'system',
        content: 'You are a concise real estate marketing expert.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    stop: ["\n\n\n"]
  });

  const output = completion.choices[0]?.message?.content || '';
  const generationTimeMs = Date.now() - startTime;

  logger.info('AI content generated', {
    contentType,
    tokensUsed: completion.usage?.completion_tokens,
    generationTimeMs,
    model: MODEL,
  });

  return {
    output,
    tokensUsed:
      (completion.usage?.prompt_tokens || 0) +
      (completion.usage?.completion_tokens || 0),
    model: completion.model,
    generationTimeMs,
  };
};

// ─── Streaming version ─
const generateContentStream = async ({
  contentType,
  listing,
  onChunk,
  onComplete,
}) => {
  if (!PROMPTS[contentType]) {
    throw new Error(`Unknown content type: ${contentType}`);
  }

  const prompt = PROMPTS[contentType](listing);
  let fullText = '';
  let totalTokens = 0;

  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'system',
        content: 'You are a concise real estate marketing expert.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    stream: true,
    stop: ["\n\n\n"]
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';

    if (delta) {
      fullText += delta;
      onChunk(delta);
    }

    if (chunk.usage) {
      totalTokens =
        (chunk.usage.prompt_tokens || 0) +
        (chunk.usage.completion_tokens || 0);
    }
  }

  onComplete({
    output: fullText,
    tokensUsed: totalTokens
  });
};

module.exports = { generateContent, generateContentStream };