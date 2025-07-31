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

// Debug route to check all active workflows
router.get('/debug/active', (req, res) => {
    const workflowExecutor = require('../../services/workflowExecutor');
    const activeWorkflows = [];
    
    // Get all active workflows (this is a debug endpoint)
    for (const [workflowId] of workflowExecutor.activeWorkflows) {
        const status = workflowExecutor.getWorkflowStatus(workflowId);
        activeWorkflows.push({
            workflowId,
            ...status
        });
    }
    
    res.json({
        totalActive: activeWorkflows.length,
        workflows: activeWorkflows
    });
});

module.exports = router;
