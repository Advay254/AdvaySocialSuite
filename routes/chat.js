const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Groq = require('groq-sdk');
const { getPool } = require('../db/init');

const chatLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: { error: 'Too many messages. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', chatLimit, async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  // Validate message content length
  for (const m of messages) {
    if (!m.content || typeof m.content !== 'string' || m.content.length > 600) {
      return res.status(400).json({ error: 'Message too long or invalid' });
    }
    if (!['user', 'assistant'].includes(m.role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
  }

  // Keep last 10 messages for context
  const trimmed = messages.slice(-10);

  try {
    // Get system prompt from DB
    const { rows } = await getPool().query(
      "SELECT value FROM site_settings WHERE key='chat_system_prompt'"
    );
    const systemPrompt = rows[0]?.value || 'You are a helpful assistant for AdvaySocialSuite.';

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...trimmed,
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not respond.';
    res.json({ reply });
  } catch (err) {
    console.error('[Chat]', err.message);
    res.status(500).json({ error: 'Chat service unavailable.' });
  }
});

module.exports = router;
