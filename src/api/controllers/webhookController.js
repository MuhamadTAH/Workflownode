const telegramTrigger = require('../../nodes/triggers/telegramTrigger');

// Simple in-memory store for the latest execution data, keyed by workflowId
const executionDataStore = {};

const handleTelegramWebhook = async (req, res) => {
    try {
        const workflowId = req.params.workflowId;
        console.log(`Webhook received for workflowId: ${workflowId}`);

        const result = await telegramTrigger.trigger(req);

        // Store the result in our in-memory store
        executionDataStore[workflowId] = result.workflowData;

        console.log('--- Trigger function successfully processed the request ---');
        console.log('Data to be sent to the workflow:');
        console.log(JSON.stringify(result.workflowData, null, 2));
        
        res.status(200).send('OK');

    } catch (error) {
        console.error('Error processing Telegram webhook:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    handleTelegramWebhook,
    executionDataStore, // Export the store so other modules can access it
};
