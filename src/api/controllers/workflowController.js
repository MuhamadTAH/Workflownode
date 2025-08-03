const telegramTrigger = require('../../nodes/triggers/telegramTrigger');
const workflowExecutor = require('../../services/workflowExecutor');
// Import the shared data store
const { executionDataStore } = require('../controllers/webhookController');

const credentialsStore = {
    'telegram_bot_token': ''
};

const getCredentials = (nodeType) => {
    if (nodeType === 'telegramTrigger') {
        return { botToken: credentialsStore.telegram_bot_token };
    }
    return {};
};

const activateWorkflow = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { triggerNode, workflow } = req.body; 

        if (!triggerNode || triggerNode.data.type !== 'trigger') {
            return res.status(400).send({ message: 'A valid trigger node is required to activate.' });
        }

        if (!workflow || !workflow.nodes || !workflow.edges) {
            return res.status(400).send({ message: 'Complete workflow data (nodes and edges) is required for auto-execution.' });
        }
        
        if(triggerNode.data.token) {
            credentialsStore.telegram_bot_token = triggerNode.data.token;
        }

        const credentials = getCredentials('telegramTrigger');
        
        if (!credentials.botToken) {
             return res.status(400).send({ message: 'Telegram Bot API Token is missing.' });
        }

        console.log(`🔄 Activating workflow ${workflowId}...`);

        // 1. Set up Telegram webhook
        const webhookUrl = `${process.env.BASE_URL}/api/webhooks/telegram/${workflowId}`;
        await telegramTrigger.description.webhookMethods.create(credentials, webhookUrl);
        console.log(`✅ Webhook created: ${webhookUrl}`);

        // 2. Register workflow for automatic execution with credentials
        try {
            workflowExecutor.registerWorkflow(workflowId, workflow, credentials);
            console.log(`✅ Workflow ${workflowId} registered for auto-execution`);
        } catch (registrationError) {
            console.error('Error registering workflow:', registrationError.message);
            return res.status(400).send({ 
                message: 'Failed to register workflow for auto-execution.', 
                error: registrationError.message 
            });
        }

        console.log(`🚀 Workflow ${workflowId} fully activated!`);
        
        res.status(200).send({ 
            message: `Workflow ${workflowId} activated successfully. Auto-execution enabled.`,
            webhookUrl,
            autoExecution: true,
            workflowNodes: workflow.nodes.length,
            workflowEdges: workflow.edges.length
        });

    } catch (error) {
        console.error('Error activating workflow:', error.message);
        res.status(500).send({ message: 'Failed to activate workflow.', error: error.message });
    }
};

// Deactivate a workflow
const deactivateWorkflow = async (req, res) => {
    try {
        const { workflowId } = req.params;
        
        console.log(`🔄 Deactivating workflow ${workflowId}...`);
        
        // 1. Remove webhook (delete webhook on Telegram)
        const credentials = getCredentials('telegramTrigger');
        if (credentials.botToken) {
            try {
                await telegramTrigger.description.webhookMethods.remove(credentials);
                console.log(`✅ Webhook removed for workflow ${workflowId}`);
            } catch (webhookError) {
                console.warn('Warning: Could not remove webhook:', webhookError.message);
            }
        }
        
        // 2. Deactivate workflow in executor
        const deactivated = workflowExecutor.deactivateWorkflow(workflowId);
        
        if (deactivated) {
            console.log(`✅ Workflow ${workflowId} deactivated successfully`);
            res.status(200).send({ 
                message: `Workflow ${workflowId} deactivated successfully.`,
                autoExecution: false 
            });
        } else {
            res.status(404).send({ 
                message: `Workflow ${workflowId} was not found or already inactive.` 
            });
        }
        
    } catch (error) {
        console.error('Error deactivating workflow:', error.message);
        res.status(500).send({ message: 'Failed to deactivate workflow.', error: error.message });
    }
};

// Get workflow status and execution history
const getWorkflowStatus = (req, res) => {
    const { workflowId } = req.params;
    
    try {
        const status = workflowExecutor.getWorkflowStatus(workflowId);
        const executionHistory = workflowExecutor.getExecutionHistory(workflowId, 5);
        
        res.status(200).json({
            workflowId,
            ...status,
            recentExecutions: executionHistory
        });
        
    } catch (error) {
        console.error('Error getting workflow status:', error.message);
        res.status(500).send({ message: 'Failed to get workflow status.', error: error.message });
    }
};

// Get the latest execution data for a workflow (backward compatibility)
const getExecutionData = (req, res) => {
    const { workflowId } = req.params;
    
    // Check for complete execution data first
    const executionData = executionDataStore[workflowId + '_execution'];
    if (executionData) {
        return res.status(200).json({
            type: 'execution_result',
            data: executionData
        });
    }
    
    // Fall back to trigger data only
    const triggerData = executionDataStore[workflowId];
    if (triggerData) {
        return res.status(200).json({
            type: 'trigger_data',
            data: triggerData
        });
    }
    
    res.status(404).json({ message: 'No execution data found for this workflow yet.' });
};

module.exports = {
    activateWorkflow,
    deactivateWorkflow,
    getWorkflowStatus,
    getExecutionData,
};
