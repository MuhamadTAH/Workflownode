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

// Memory management routes
router.get('/memory/stats', nodeController.getMemoryStats);
router.post('/memory/clear', nodeController.clearMemory);
router.get('/memory/export', nodeController.exportMemory);
router.post('/memory/import', nodeController.importMemory);

module.exports = router;
