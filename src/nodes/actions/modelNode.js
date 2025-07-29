/*
=================================================================
BACKEND FILE: src/nodes/actions/modelNode.js (NEW FILE)
=================================================================
This file defines the structure and execution logic for the Model Node.
*/
const { callClaudeApi } = require('../../services/aiService');

const modelNode = {
    description: {
        displayName: 'Model Node',
        name: 'modelNode',
        icon: 'fa:comments',
        group: 'actions',
        version: 1,
        description: 'Provides a chatbot interface to an AI model.',
        defaults: {
            name: 'Model Node',
        },
        properties: [
            {
                displayName: 'Model',
                name: 'model',
                type: 'options',
                options: [
                    { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
                    { name: 'GPT-4', value: 'gpt-4' },
                ],
                default: 'claude-3-sonnet-20240229',
                required: true,
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'API Key for the selected model provider (e.g., Anthropic).',
            },
        ],
    },

    // This function will be called by the node controller to get a chat response.
    async execute(nodeConfig, inputData) {
        const { apiKey, model } = nodeConfig;
        const { userMessage } = inputData;

        if (!apiKey || !userMessage) {
            throw new Error('API Key and user message are required.');
        }

        // For now, we only support Claude. We can add more models later.
        if (model.startsWith('claude')) {
            const response = await callClaudeApi(apiKey, userMessage);
            return { reply: response };
        } else {
            // Placeholder for other models
            return { reply: `Response from ${model} is not implemented yet.` };
        }
    },
};

module.exports = modelNode;
