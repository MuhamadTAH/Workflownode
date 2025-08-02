const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramController');

// Route to verify a telegram token
router.post('/verify-token', telegramController.verifyToken);

// Route to get recent telegram messages
router.post('/get-updates', telegramController.getUpdates);

// Route to delete webhook (needed before using getUpdates)
router.post('/delete-webhook', telegramController.deleteWebhook);

// Route to send telegram message
router.post('/send-message', telegramController.sendMessage);

module.exports = router;
