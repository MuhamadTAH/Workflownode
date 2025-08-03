const telegramTrigger = require('../../nodes/triggers/telegramTrigger');
const workflowExecutor = require('../../services/workflowExecutor');

// Simple in-memory store for the latest execution data, keyed by workflowId
const executionDataStore = {};

const handleTelegramWebhook = async (req, res) => {
    try {
        const workflowId = req.params.workflowId;
        console.log(`\n🔔 Webhook received for workflowId: ${workflowId}`);

        // Get workflow credentials (including bot token) for trigger processing
        const credentials = workflowExecutor.getWorkflowCredentials(workflowId);
        if (credentials && credentials.botToken) {
            // Add bot token to request body for trigger processing
            req.body._botToken = credentials.botToken;
            console.log('🔑 Bot token added to trigger context');
        }

        // Process the trigger data
        const result = await telegramTrigger.trigger(req);
        const triggerData = result.workflowData;

        // Store the result in our in-memory store (for backward compatibility)
        executionDataStore[workflowId] = triggerData;

        console.log('✅ Trigger data processed successfully');
        console.log('Trigger data:', JSON.stringify(triggerData, null, 2));

        // Check if this workflow is registered for automatic execution
        const workflowStatus = workflowExecutor.getWorkflowStatus(workflowId);
        
        console.log(`🔍 Checking workflow ${workflowId} status:`, {
            isRegistered: workflowStatus.isRegistered,
            isActive: workflowStatus.isActive,
            registeredAt: workflowStatus.registeredAt,
            totalExecutions: workflowStatus.totalExecutions
        });
        
        if (workflowStatus.isRegistered && workflowStatus.isActive) {
            console.log(`🚀 Auto-executing workflow ${workflowId}...`);
            
            try {
                // Execute the complete workflow automatically
                const executionResult = await workflowExecutor.executeWorkflow(workflowId, triggerData);
                
                console.log(`✅ Workflow ${workflowId} executed successfully`);
                console.log(`Steps completed: ${executionResult.steps.length}`);
                console.log(`Final output:`, JSON.stringify(executionResult.finalOutput, null, 2));
                
                // Store the complete execution result
                executionDataStore[workflowId + '_execution'] = executionResult;
                
            } catch (executionError) {
                console.error(`❌ Workflow ${workflowId} execution failed:`, executionError.message);
                
                // Store the execution error
                executionDataStore[workflowId + '_execution'] = {
                    error: executionError.message,
                    timestamp: new Date().toISOString()
                };
            }
        } else {
            console.log(`ℹ️ Workflow ${workflowId} is not registered for auto-execution (manual mode)`);
        }
        
        res.status(200).send('OK');

    } catch (error) {
        console.error('❌ Error processing Telegram webhook:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    handleTelegramWebhook,
    executionDataStore, // Export the store so other modules can access it
};
