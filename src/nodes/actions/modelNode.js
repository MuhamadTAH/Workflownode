/*
=================================================================
BACKEND FILE: src/nodes/actions/modelNode.js (ENHANCED WITH CLAUDE SDK)
=================================================================
This file defines the structure and execution logic for the Model Node.
Enhanced with official Claude SDK for better performance and features.
*/
const { callClaudeApi, verifyClaudeApiKey } = require('../../services/aiService');

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
                displayName: 'Claude API Key',
                name: 'apiKey',
                type: 'string',
                default: '',
                required: false,
                description: 'Claude API Key for direct chat functionality. Leave empty if using AI Agent input.',
                placeholder: 'sk-ant-...'
            },
            {
                displayName: 'System Prompt',
                name: 'systemPrompt',
                type: 'textarea',
                default: 'You are a helpful AI assistant.',
                required: false,
                description: 'System prompt for the AI (used in direct chat mode).',
            },
            {
                displayName: 'User ID',
                name: 'userId',
                type: 'string',
                default: 'default',
                required: false,
                description: 'User ID for conversation memory isolation.',
            },
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

    // Enhanced execution function with SDK features
    async execute(nodeConfig, inputData) {
        const { 
            displayFormat = 'chat', 
            userId = 'default',
            apiKey,
            systemPrompt = 'You are a helpful AI assistant.'
        } = nodeConfig;

        // Initialize memory for user if not exists
        if (!conversationMemory[userId]) {
            conversationMemory[userId] = [];
        }

        // Handle direct chat functionality (when message input is provided)
        if (inputData && inputData.message && !inputData.reply) {
            console.log('🤖 Model Node: Direct chat mode with SDK');
            
            if (!apiKey) {
                throw new Error('Claude API Key is required for direct chat functionality.');
            }

            try {
                // Get conversation history for context (last 10 messages)
                const recentHistory = conversationMemory[userId].slice(-10);
                
                // Call Claude API with enhanced SDK features
                const response = await callClaudeApi(
                    apiKey,
                    inputData.message,
                    systemPrompt,
                    recentHistory
                );

                // Store the conversation in memory with enhanced analytics
                const conversationEntry = {
                    timestamp: new Date().toISOString(),
                    user: inputData.message,
                    ai: response.text,
                    // Enhanced analytics with SDK data
                    userMessageLength: inputData.message.length,
                    aiResponseLength: response.text.length,
                    model: response.model || 'claude-3-5-sonnet-20241022',
                    processingTime: response.processingTime,
                    usage: response.usage,
                    messageId: response.id,
                    sdkFeatures: {
                        officialSDK: true,
                        enhancedErrorHandling: true,
                        usageTracking: true
                    }
                };
                
                conversationMemory[userId].push(conversationEntry);

                // Keep only last 20 messages to manage memory
                if (conversationMemory[userId].length > 20) {
                    conversationMemory[userId] = conversationMemory[userId].slice(-20);
                }

                return {
                    reply: response.text,
                    displayFormat: displayFormat,
                    source: 'direct_sdk',
                    conversationHistory: conversationMemory[userId],
                    memoryStats: {
                        messagesInMemory: conversationMemory[userId].length,
                        userId: userId
                    },
                    sdkMetadata: {
                        model: response.model,
                        processingTime: response.processingTime,
                        usage: response.usage,
                        messageId: response.id,
                        features: ['Enhanced Error Handling', 'Usage Tracking', 'Official SDK']
                    }
                };

            } catch (error) {
                console.error('❌ Model Node SDK Error:', error.message);
                throw new Error(`Model Node SDK Error: ${error.message}`);
            }
        }

        // Handle input from AI Agent (existing functionality preserved)
        if (inputData && inputData.reply) {
            console.log('🔄 Model Node: Receiving from AI Agent');
            
            // Store the conversation in memory with analytics
            const conversationEntry = {
                timestamp: new Date().toISOString(),
                user: inputData.processedUserPrompt || inputData.userMessage,
                ai: inputData.reply,
                // Analytics data
                userMessageLength: (inputData.processedUserPrompt || inputData.userMessage || '').length,
                aiResponseLength: (inputData.reply || '').length,
                model: inputData.model || 'unknown',
                processingTime: inputData.processingTime || null,
                usage: inputData.usage,
                source: 'aiAgent'
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
                    processedUserPrompt: inputData.processedUserPrompt,
                    usage: inputData.usage
                }
            };
        }

        // No valid input provided
        if (!inputData) {
            return {
                reply: 'Model Node: Please provide input data or connect an AI Agent node.',
                displayFormat: displayFormat,
                source: 'error',
                conversationHistory: conversationMemory[userId] || [],
                sdkFeatures: {
                    available: ['Direct Chat', 'AI Agent Integration', 'Memory Management', 'Usage Tracking'],
                    requires: 'Claude API Key for direct chat functionality'
                }
            };
        }

        // Fallback for unexpected input format
        return {
            reply: 'Model Node: Invalid input format. Expected message or AI Agent output.',
            displayFormat: displayFormat,
            source: 'fallback',
            conversationHistory: conversationMemory[userId] || []
        };
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

    // New: Test Claude SDK connection for Model Node
    async testSDKConnection(apiKey) {
        try {
            if (!apiKey) {
                return {
                    connected: false,
                    error: 'API Key is required',
                    features: []
                };
            }

            const verification = await verifyClaudeApiKey(apiKey);
            
            return {
                connected: verification.valid,
                model: verification.model,
                usage: verification.usage,
                sdk: 'Official Anthropic SDK',
                features: [
                    'Direct Chat Interface',
                    'Memory Management',
                    'Conversation History',
                    'Usage Analytics',
                    'Enhanced Error Handling'
                ],
                nodeType: 'Model Node',
                timestamp: new Date().toISOString(),
                error: verification.error || null
            };
            
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                features: ['Memory Management', 'Conversation History'],
                nodeType: 'Model Node (Offline)',
                timestamp: new Date().toISOString()
            };
        }
    },

    // New: Get enhanced analytics with SDK data
    getEnhancedAnalytics(userId = 'default') {
        const userHistory = conversationMemory[userId] || [];
        
        if (userHistory.length === 0) {
            return {
                userId: userId,
                analytics: null,
                sdkMetrics: {
                    officialSDKMessages: 0,
                    totalMessages: 0,
                    averageProcessingTime: 'N/A',
                    modelsUsed: [],
                    usageData: null
                }
            };
        }

        // Separate SDK vs non-SDK messages
        const sdkMessages = userHistory.filter(entry => entry.sdkFeatures?.officialSDK);
        const totalUsage = userHistory
            .filter(entry => entry.usage)
            .reduce((acc, entry) => {
                if (entry.usage.input_tokens) acc.inputTokens += entry.usage.input_tokens;
                if (entry.usage.output_tokens) acc.outputTokens += entry.usage.output_tokens;
                return acc;
            }, { inputTokens: 0, outputTokens: 0 });

        const processingTimes = userHistory
            .filter(entry => entry.processingTime)
            .map(entry => entry.processingTime);

        const models = [...new Set(userHistory
            .map(entry => entry.model)
            .filter(model => model && model !== 'unknown'))];

        return {
            userId: userId,
            totalMessages: userHistory.length,
            lastActivity: userHistory[userHistory.length - 1].timestamp,
            analytics: this.calculateUserAnalytics(userId, userHistory).analytics,
            sdkMetrics: {
                officialSDKMessages: sdkMessages.length,
                sdkPercentage: ((sdkMessages.length / userHistory.length) * 100).toFixed(1) + '%',
                averageProcessingTime: processingTimes.length > 0 
                    ? (processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length).toFixed(2) + 'ms'
                    : 'N/A',
                modelsUsed: models,
                usageData: totalUsage.inputTokens > 0 || totalUsage.outputTokens > 0 ? {
                    totalInputTokens: totalUsage.inputTokens,
                    totalOutputTokens: totalUsage.outputTokens,
                    totalTokens: totalUsage.inputTokens + totalUsage.outputTokens,
                    estimatedCost: this.calculateEstimatedCost(totalUsage)
                } : null,
                features: {
                    memoryManagement: true,
                    conversationHistory: true,
                    usageTracking: totalUsage.inputTokens > 0,
                    enhancedErrorHandling: sdkMessages.length > 0,
                    officialSDK: sdkMessages.length > 0
                }
            }
        };
    },

    // New: Calculate estimated cost based on usage
    calculateEstimatedCost(usage) {
        // Claude 3.5 Sonnet pricing (approximate)
        const inputCostPer1K = 0.003;  // $0.003 per 1K input tokens
        const outputCostPer1K = 0.015; // $0.015 per 1K output tokens
        
        const inputCost = (usage.inputTokens / 1000) * inputCostPer1K;
        const outputCost = (usage.outputTokens / 1000) * outputCostPer1K;
        
        return {
            inputCost: inputCost.toFixed(6),
            outputCost: outputCost.toFixed(6),
            totalCost: (inputCost + outputCost).toFixed(6),
            currency: 'USD',
            note: 'Estimated cost based on Claude 3.5 Sonnet pricing'
        };
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
