/*
=================================================================
BACKEND FILE: src/api/routes/ai.js (ENHANCED WITH CLAUDE SDK)
=================================================================
*/
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Enhanced Claude API routes using official SDK

// Verify Claude API key (enhanced with SDK)
router.post('/verify-claude', aiController.verifyClaudeKey);

// Get Claude API usage statistics
router.post('/usage-stats', aiController.getUsageStats);

// Streaming Claude API endpoint
router.post('/stream', aiController.streamClaude);

// Test Claude SDK connection
router.post('/test-connection', aiController.testConnection);

// Backward compatibility
router.post('/verify-claude-key', aiController.verifyClaudeKey);

module.exports = router;