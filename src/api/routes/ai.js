/*
=================================================================
BACKEND FILE: src/api/routes/ai.js (NEW FILE)
=================================================================
*/
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route to verify a Claude API key
router.post('/verify-claude', aiController.verifyClaudeApiKey);

module.exports = router;
