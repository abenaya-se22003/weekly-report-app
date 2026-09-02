const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { processAssistantQuery } = require('../services/ai.service');

const router = express.Router();

/**
 * @route   POST /api/ai/chat
 * @desc    Manager-only AI Chat Assistant endpoint that queries recent reports and calls Anthropic Claude API
 * @access  Private (Manager only)
 */
router.post('/chat', requireAuth, requireRole('MANAGER'), async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'A message prompt is required' });
    }

    const result = await processAssistantQuery(message.trim(), history || []);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
