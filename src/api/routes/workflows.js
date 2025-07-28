const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

// Route to activate a workflow
router.post('/:workflowId/activate', workflowController.activateWorkflow);

// NEW ROUTE: To fetch the latest execution data
router.get('/:workflowId/data', workflowController.getExecutionData);

module.exports = router;
