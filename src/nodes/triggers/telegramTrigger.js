const axios = require('axios');

const telegramTriggerNode = {
    description: {
        displayName: 'Telegram Trigger',
        name: 'telegramTrigger',
        icon: 'fa:telegram',
        group: 'trigger',
        version: 1,
        description: 'Starts a workflow when a message is sent to a Telegram bot.',
        defaults: {
            name: 'Telegram Trigger',
        },
        properties: [
            {
                displayName: 'Bot API Token',
                name: 'botToken',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'The API token for your Telegram bot.',
                placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
            },
        ],
        webhookMethods: {
            create: async function(credentials, webhookUrl) {
                const botToken = credentials.botToken;
                if (!botToken) {
                    throw new Error('Telegram Bot API Token is missing!');
                }
                const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
                try {
                    await axios.post(telegramApiUrl, {
                        url: webhookUrl,
                        allowed_updates: ['message', 'edited_message'],
                    });
                    console.log(`Webhook successfully registered for Telegram bot at: ${webhookUrl}`);
                    return true;
                } catch (error) {
                    console.error('Failed to register Telegram webhook:', error.response ? error.response.data : error.message);
                    throw new Error(`Failed to register webhook: ${error.message}`);
                }
            },
            delete: async function(credentials) {
                const botToken = credentials.botToken;
                if (!botToken) {
                    return true;
                }
                const telegramApiUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
                try {
                    await axios.post(telegramApiUrl);
                    console.log('Webhook successfully deleted for Telegram bot.');
                    return true;
                } catch (error) {
                    console.error('Failed to delete Telegram webhook:', error.response ? error.response.data : error.message);
                    return false;
                }
            },
        },
    },
    async trigger(request) {
        const update = request.body;
        const returnData = [{
            json: update,
        }];
        return {
            workflowData: returnData,
        };
    },
};

module.exports = telegramTriggerNode;
