/*
=================================================================
BACKEND FILE: src/api/routes/nodes.js (NEW FILE)
=================================================================
*/
const express = require('express');
const router = express.Router();
const nodeController = require('../controllers/nodeController');

// Route to execute a node
router.post('/run-node', nodeController.runNode);

module.exports = router;
