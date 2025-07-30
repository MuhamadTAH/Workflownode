/*
=================================================================
BACKEND FILE: src/nodes/actions/modelNode.js (NEW FILE)
=================================================================
This file defines the structure and execution logic for the Model Node.
*/
const { callClaudeApi } = require('../../services/aiService');

// Simple memory storage (in production, use database)
const conversationMemory = {};

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
        const { displayFormat = 'chat', userId = 'default' } = nodeConfig;

        if (!inputData) {
            throw new Error('No input data received. Connect this node to an AI Agent node.');
        }

        // Initialize memory for user if not exists
        if (!conversationMemory[userId]) {
            conversationMemory[userId] = [];
        }

        // If input comes from AI Agent, it should have a 'reply' field
        if (inputData.reply) {
            // Store the conversation in memory
            conversationMemory[userId].push({
                timestamp: new Date().toISOString(),
                user: inputData.processedUserPrompt || inputData.userMessage,
                ai: inputData.reply
            });

            // Keep only last 20 messages to manage memory
            if (conversationMemory[userId].length > 20) {
                conversationMemory[userId] = conversationMemory[userId].slice(-20);
            }

            return {
                reply: inputData.reply,
                displayFormat: displayFormat,
                source: 'aiAgent',
                conversationHistory: conversationMemory[userId],
                memoryStats: {
                    messagesInMemory: conversationMemory[userId].length,
                    userId: userId
                },
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
                source: 'direct',
                conversationHistory: conversationMemory[userId] || []
            };
        }
    },

    // Helper function to get conversation history
    getConversationHistory(userId = 'default') {
        return conversationMemory[userId] || [];
    },

    // Helper function to clear memory
    clearMemory(userId = 'default') {
        if (userId === 'all') {
            // Clear all conversations
            Object.keys(conversationMemory).forEach(key => {
                delete conversationMemory[key];
            });
            return true;
        } else {
            // Clear specific user
            delete conversationMemory[userId];
            return true;
        }
    },
};

module.exports = modelNode;
