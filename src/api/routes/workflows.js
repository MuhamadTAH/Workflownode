const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

// Route to activate a workflow
router.post('/:workflowId/activate', workflowController.activateWorkflow);

// Route to deactivate a workflow
router.post('/:workflowId/deactivate', workflowController.deactivateWorkflow);

// Route to get workflow status and execution history
router.get('/:workflowId/status', workflowController.getWorkflowStatus);

// Route to fetch the latest execution data (backward compatibility)
router.get('/:workflowId/data', workflowController.getExecutionData);

module.exports = router;
