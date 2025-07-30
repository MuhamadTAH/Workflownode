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
            // Store the conversation in memory with analytics
            const conversationEntry = {
                timestamp: new Date().toISOString(),
                user: inputData.processedUserPrompt || inputData.userMessage,
                ai: inputData.reply,
                // Analytics data
                userMessageLength: (inputData.processedUserPrompt || inputData.userMessage || '').length,
                aiResponseLength: (inputData.reply || '').length,
                model: inputData.model || 'unknown',
                processingTime: inputData.processingTime || null
            };
            conversationMemory[userId].push(conversationEntry);

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

    // Helper function to get memory statistics with analytics
    getMemoryStats(userId = 'default') {
        if (userId === 'all') {
            const allStats = Object.keys(conversationMemory).map(uid => {
                const history = conversationMemory[uid];
                return this.calculateUserAnalytics(uid, history);
            });
            
            return {
                totalUsers: Object.keys(conversationMemory).length,
                totalMessages: Object.values(conversationMemory).reduce((total, history) => total + history.length, 0),
                users: allStats,
                globalAnalytics: {
                    averageUserMessages: allStats.length > 0 ? (allStats.reduce((sum, user) => sum + user.messageCount, 0) / allStats.length).toFixed(1) : 0,
                    totalCharactersProcessed: allStats.reduce((sum, user) => sum + user.totalCharacters, 0),
                    mostActiveUser: allStats.length > 0 ? allStats.reduce((max, user) => user.messageCount > max.messageCount ? user : max) : null
                }
            };
        } else {
            const userHistory = conversationMemory[userId] || [];
            return this.calculateUserAnalytics(userId, userHistory);
        }
    },

    // Helper function to calculate detailed analytics for a user
    calculateUserAnalytics(userId, history) {
        if (history.length === 0) {
            return {
                userId: userId,
                messageCount: 0,
                lastActivity: null,
                analytics: null
            };
        }

        const totalUserChars = history.reduce((sum, entry) => sum + (entry.userMessageLength || 0), 0);
        const totalAiChars = history.reduce((sum, entry) => sum + (entry.aiResponseLength || 0), 0);
        const processingTimes = history.filter(entry => entry.processingTime).map(entry => entry.processingTime);
        const models = history.map(entry => entry.model).filter(model => model && model !== 'unknown');

        return {
            userId: userId,
            messageCount: history.length,
            lastActivity: history[history.length - 1].timestamp,
            firstActivity: history[0].timestamp,
            analytics: {
                averageUserMessageLength: history.length > 0 ? (totalUserChars / history.length).toFixed(1) : 0,
                averageAiResponseLength: history.length > 0 ? (totalAiChars / history.length).toFixed(1) : 0,
                totalCharacters: totalUserChars + totalAiChars,
                averageProcessingTime: processingTimes.length > 0 ? (processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length).toFixed(2) + 'ms' : 'N/A',
                modelsUsed: [...new Set(models)],
                conversationSpan: this.calculateConversationSpan(history[0].timestamp, history[history.length - 1].timestamp),
                messagesPerDay: this.calculateMessagesPerDay(history)
            },
            conversationHistory: history
        };
    },

    // Helper to calculate conversation time span
    calculateConversationSpan(firstTimestamp, lastTimestamp) {
        const first = new Date(firstTimestamp);
        const last = new Date(lastTimestamp);
        const diffMs = last - first;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (diffDays > 0) {
            return diffDays + ' day' + (diffDays > 1 ? 's' : '') + (diffHours > 0 ? ', ' + diffHours + ' hour' + (diffHours > 1 ? 's' : '') : '');
        } else if (diffHours > 0) {
            return diffHours + ' hour' + (diffHours > 1 ? 's' : '');
        } else {
            return 'Less than 1 hour';
        }
    },

    // Helper to calculate messages per day
    calculateMessagesPerDay(history) {
        if (history.length < 2) return 'N/A';
        
        const first = new Date(history[0].timestamp);
        const last = new Date(history[history.length - 1].timestamp);
        const diffDays = Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));
        
        return (history.length / diffDays).toFixed(1);
    },

    // Helper function to export conversation memory
    exportMemory(userId = 'all') {
        if (userId === 'all') {
            return JSON.stringify(conversationMemory, null, 2);
        } else {
            return JSON.stringify({ [userId]: conversationMemory[userId] || [] }, null, 2);
        }
    },

    // Helper function to import conversation memory
    importMemory(jsonData, userId = null) {
        try {
            const importedData = JSON.parse(jsonData);
            
            if (userId) {
                // Import for specific user
                conversationMemory[userId] = importedData[userId] || importedData.conversationHistory || [];
            } else {
                // Import all data (merge with existing)
                Object.keys(importedData).forEach(uid => {
                    conversationMemory[uid] = importedData[uid];
                });
            }
            return true;
        } catch (error) {
            console.error('Error importing memory:', error);
            return false;
        }
    },

    // Helper function to add conversation entry to memory (used by AI Agent)
    addToMemory(userId, conversationEntry) {
        // Initialize memory for user if it doesn't exist
        if (!conversationMemory[userId]) {
            conversationMemory[userId] = [];
        }

        // Add the conversation entry
        conversationMemory[userId].push(conversationEntry);

        // Keep only last 20 messages to manage memory
        if (conversationMemory[userId].length > 20) {
            conversationMemory[userId] = conversationMemory[userId].slice(-20);
        }

        console.log(`Added conversation entry for user ${userId}. Total messages: ${conversationMemory[userId].length}`);
        return true;
    },
};

module.exports = modelNode;
