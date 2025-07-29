const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramController');

// Route to verify a telegram token
router.post('/verify-token', telegramController.verifyToken);

// Route to get recent telegram messages
router.post('/get-updates', telegramController.getUpdates);

module.exports = router;
