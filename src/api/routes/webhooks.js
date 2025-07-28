const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Define a POST route to handle incoming webhooks from services like Telegram.
// The URL will look like: /api/webhooks/telegram/:workflowId
// The ':workflowId' is a dynamic parameter to identify which workflow to run.
router.post('/telegram/:workflowId', webhookController.handleTelegramWebhook);

module.exports = router;