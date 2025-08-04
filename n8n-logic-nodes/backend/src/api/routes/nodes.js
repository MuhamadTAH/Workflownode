/*
=================================================================
FILE: src/api/routes/nodes.js (NEW PROJECT)
=================================================================
Defines the API route for running a node.
*/
const express = require('express');
const router = express.Router();
const nodeController = require('../controllers/nodeController');

// A single endpoint to execute any given node
router.post('/run-node', nodeController.runNode);

module.exports = router;
