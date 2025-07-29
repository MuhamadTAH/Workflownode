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
                displayName: 'Display Format',
                name: 'displayFormat',
                type: 'options',
                options: [
                    { name: 'Chat Interface', value: 'chat' },
                    { name: 'Raw Response', value: 'raw' },
                ],
                default: 'chat',
                required: true,
                description: 'How to display the AI response.',
            },
        ],
    },

    // This function receives processed responses from AI Agent
    async execute(nodeConfig, inputData) {
        const { displayFormat = 'chat' } = nodeConfig;

        if (!inputData) {
            throw new Error('No input data received. Connect this node to an AI Agent node.');
        }

        // If input comes from AI Agent, it should have a 'reply' field
        if (inputData.reply) {
            return {
                reply: inputData.reply,
                displayFormat: displayFormat,
                source: 'aiAgent',
                metadata: {
                    model: inputData.model,
                    systemPrompt: inputData.systemPrompt,
                    processedUserPrompt: inputData.processedUserPrompt
                }
            };
        } else {
            // For direct chat functionality (backward compatibility)
            return {
                reply: 'Model Node: Please connect an AI Agent node to process prompts.',
                displayFormat: displayFormat,
                source: 'direct'
            };
        }
    },
};

module.exports = modelNode;
