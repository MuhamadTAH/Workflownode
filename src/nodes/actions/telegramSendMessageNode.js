/*
=================================================================
BACKEND FILE: src/nodes/actions/telegramSendMessageNode.js (NEW FILE)
=================================================================
This file defines the Telegram Send Message action node for sending messages to Telegram chats.
*/

const axios = require('axios');

const telegramSendMessageNode = {
    description: {
        displayName: 'Telegram Send Message',
        name: 'telegramSendMessage',
        icon: 'fa:paper-plane',
        group: 'actions',
        version: 1,
        description: 'Sends a message to a Telegram chat using the Telegram Bot API.',
        defaults: {
            name: 'Telegram Send Message',
        },
        properties: [
            {
                displayName: 'Bot Token',
                name: 'token',
                type: 'string',
                required: true,
                default: '',
                placeholder: 'Your Telegram Bot API Token',
                description: 'The bot token from @BotFather',
            },
            {
                displayName: 'Chat ID',
                name: 'chatId',
                type: 'string',
                required: true,
                default: '{{message.chat.id}}',
                placeholder: 'Chat ID or template like {{message.chat.id}}',
                description: 'The chat ID to send the message to. Use templates like {{message.chat.id}} to get from previous node.',
            },
            {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                required: true,
                default: 'Hello! You sent: {{message.text}}',
                placeholder: 'Your message text with optional templates',
                description: 'The message to send. Use templates like {{message.text}} to include data from previous nodes.',
            },
            {
                displayName: 'Parse Mode',
                name: 'parseMode',
                type: 'options',
                options: [
                    { name: 'None', value: '' },
                    { name: 'Markdown', value: 'Markdown' },
                    { name: 'HTML', value: 'HTML' },
                ],
                default: 'Markdown',
                description: 'How to parse the message text',
            },
            {
                displayName: 'Disable Notification',
                name: 'disableNotification',
                type: 'boolean',
                default: false,
                description: 'Send the message silently without notification',
            },
        ],
    },

    // Enhanced template replacement function (supports node-prefixed templates)
    replaceTemplate(template, data) {
        if (!template || typeof template !== 'string') return template;
        if (!data || typeof data !== 'object') return template;

        let result = template;
        
        try {
            // Replace templates like {{message.text}}, {{telegram.message.chat.id}}, etc.
            result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
                const pathParts = path.trim().split('.');
                
                // Handle node-prefixed templates (e.g., telegram.message.chat.id)
                if (pathParts.length > 1) {
                    const nodePrefix = pathParts[0];
                    
                    // Skip the node prefix and use the rest of the path
                    if (['telegram', 'aiAgent', 'model', 'storage', 'sendMessage'].includes(nodePrefix)) {
                        const actualPath = pathParts.slice(1).join('.');
                        let value;
                        
                        // For telegram prefix, look in _telegram or _originalTrigger
                        if (nodePrefix === 'telegram') {
                            value = telegramSendMessageNode.getNestedValue(data._telegram, actualPath) || 
                                   telegramSendMessageNode.getNestedValue(data._originalTrigger, actualPath);
                        } else {
                            // For other prefixes, look in main data
                            value = telegramSendMessageNode.getNestedValue(data, actualPath);
                        }
                        
                        if (value !== undefined && value !== null) {
                            if (typeof value === 'object') {
                                return JSON.stringify(value);
                            }
                            return String(value);
                        }
                    }
                }
                
                // Handle regular templates (without node prefix)
                const value = telegramSendMessageNode.getNestedValue(data, path.trim());
                if (value !== undefined && value !== null) {
                    if (typeof value === 'object') {
                        return JSON.stringify(value);
                    }
                    return String(value);
                }
                
                return match; // Keep original if not found
            });
        } catch (error) {
            console.error('Error in template replacement:', error);
            return template;
        }

        return result;
    },

    // Helper function to get nested object values
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    },

    async execute(nodeConfig, inputData) {
        console.log('=== Executing Telegram Send Message node ===');
        console.log('Node config received:', JSON.stringify(nodeConfig, null, 2));
        console.log('Input data received:', JSON.stringify(inputData, null, 2));
        
        const { token, chatId, messageText, parseMode, disableNotification } = nodeConfig;
        
        console.log('Extracted values:', {
            token: token ? '***' + token.slice(-4) : 'MISSING',
            chatId: chatId || 'MISSING',
            messageText: messageText || 'MISSING',
            parseMode: parseMode || 'none',
            disableNotification: disableNotification || false
        });

        // Validate required fields
        if (!token) {
            throw new Error('Bot Token is required');
        }
        if (!messageText) {
            throw new Error('Message Text is required');
        }

        // Process templates with input data
        console.log('Processing templates...');
        console.log('Original chatId template:', chatId);
        console.log('Original messageText template:', messageText);
        
        const processedChatId = telegramSendMessageNode.replaceTemplate(chatId, inputData);
        const processedMessage = telegramSendMessageNode.replaceTemplate(messageText, inputData);
        
        console.log('Processed chatId:', processedChatId);
        console.log('Processed messageText:', processedMessage);

        if (!processedChatId) {
            throw new Error('Chat ID is required (processed value is empty). Original template: ' + chatId);
        }

        try {
            // Prepare Telegram API request
            const telegramApiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
            
            const requestBody = {
                chat_id: processedChatId,
                text: processedMessage,
                disable_notification: disableNotification || false,
            };

            // Add parse_mode if specified
            if (parseMode && parseMode !== '') {
                requestBody.parse_mode = parseMode;
            }

            console.log('Sending message to Telegram:', {
                chat_id: processedChatId,
                text: processedMessage.substring(0, 100) + '...', // Log first 100 chars
                parse_mode: parseMode
            });

            // Make the API call to Telegram
            const response = await axios.post(telegramApiUrl, requestBody);

            if (response.data.ok) {
                console.log('Message sent successfully to Telegram');
                return {
                    success: true,
                    messageId: response.data.result.message_id,
                    chatId: processedChatId,
                    sentText: processedMessage,
                    telegramResponse: response.data.result,
                    timestamp: new Date().toISOString(),
                };
            } else {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }

        } catch (error) {
            console.error('Error sending Telegram message:', error.message);
            
            // Handle different types of errors
            let errorMessage = 'Failed to send message';
            
            if (error.response) {
                // Telegram API returned an error
                const telegramError = error.response.data;
                errorMessage = telegramError.description || `HTTP ${error.response.status}: ${error.response.statusText}`;
            } else if (error.request) {
                // Network error
                errorMessage = 'Network error: Could not reach Telegram API';
            } else {
                // Other error
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    },
};

module.exports = telegramSendMessageNode;