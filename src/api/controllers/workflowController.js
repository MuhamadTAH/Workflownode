const telegramTrigger = require('../../nodes/triggers/telegramTrigger');
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
        const { triggerNode } = req.body; 

        if (!triggerNode || triggerNode.data.type !== 'trigger') {
            return res.status(400).send({ message: 'A valid trigger node is required to activate.' });
        }
        
        if(triggerNode.data.token) {
            credentialsStore.telegram_bot_token = triggerNode.data.token;
        }

        const credentials = getCredentials('telegramTrigger');
        
        if (!credentials.botToken) {
             return res.status(400).send({ message: 'Telegram Bot API Token is missing.' });
        }

        const webhookUrl = `${process.env.BASE_URL}/api/webhooks/telegram/${workflowId}`;

        await telegramTrigger.description.webhookMethods.create(credentials, webhookUrl);

        res.status(200).send({ message: `Workflow ${workflowId} activated successfully. Webhook is live.` });

    } catch (error) {
        console.error('Error activating workflow:', error.message);
        res.status(500).send({ message: 'Failed to activate workflow.', error: error.message });
    }
};

// NEW FUNCTION: To get the latest execution data for a workflow
const getExecutionData = (req, res) => {
    const { workflowId } = req.params;
    const data = executionDataStore[workflowId];

    if (data) {
        res.status(200).json(data);
    } else {
        res.status(404).json({ message: 'No execution data found for this workflow yet.' });
    }
};

module.exports = {
    activateWorkflow,
    getExecutionData, // <-- Export the new function
};
