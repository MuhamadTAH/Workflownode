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
                default: '{{$json.message.chat.id}}',
                placeholder: 'Chat ID or template like {{$json.message.chat.id}}',
                description: 'The chat ID to send the message to. Use templates like {{$json.message.chat.id}} to get from input data.',
            },
            {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                required: true,
                default: '{{$json.response}}',
                placeholder: 'Your message text with optional templates',
                description: 'The message to send. Use templates like {{$json.response}} for AI responses or {{$json.message.text}} for original message.',
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

    // New JSON Template Parser - supports {{$json.path.to.value}} syntax
    parseJsonExpression(inputStr, json) {
        if (!inputStr) return inputStr || '';
        
        console.log('🔍 TEMPLATE PARSER DEBUG:');
        console.log('  Input string:', inputStr);
        console.log('  JSON data keys:', json ? Object.keys(json) : 'No JSON data');
        console.log('  JSON data structure:', JSON.stringify(json, null, 2));
        
        return inputStr.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
            try {
                console.log('  🎯 Processing template:', match, '-> path:', path);
                
                if (!json) {
                    console.log('  ❌ No JSON data available, keeping original:', match);
                    return match; // Keep original if no JSON data
                }
                
                const keys = path.split('.');
                let value = json;
                
                console.log('  📍 Traversing path:', keys);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    console.log(`    Step ${i + 1}: Looking for key "${key}" in:`, typeof value === 'object' ? Object.keys(value) : value);
                    
                    if (value && typeof value === 'object' && key in value) {
                        value = value[key];
                        console.log(`    ✅ Found "${key}":`, value);
                    } else {
                        console.log(`    ❌ Key "${key}" not found, keeping original:`, match);
                        return match; // Keep original if path not found
                    }
                }
                
                // Convert value to string
                let result;
                if (typeof value === 'string') {
                    result = value;
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    result = String(value);
                } else if (typeof value === 'object' && value !== null) {
                    result = JSON.stringify(value, null, 2);
                } else {
                    result = String(value || '');
                }
                
                console.log('  🎉 Template replacement successful:', match, '->', result);
                return result;
            } catch (error) {
                console.error('  💥 Error parsing JSON expression:', error);
                return match; // Keep original on error
            }
        });
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
        console.log('Available template data structure:');
        console.log('- Main data keys:', Object.keys(inputData));
        console.log('- _telegram keys:', inputData._telegram ? Object.keys(inputData._telegram) : 'Not available');
        console.log('- _originalTrigger keys:', inputData._originalTrigger ? Object.keys(inputData._originalTrigger) : 'Not available');
        
        // Show specific data for debugging
        if (inputData._telegram?.message?.chat) {
            console.log('- Telegram chat data:', inputData._telegram.message.chat);
        }
        if (inputData._originalTrigger?.message?.chat) {
            console.log('- Original trigger chat data:', inputData._originalTrigger.message.chat);
        }
        
        const processedChatId = telegramSendMessageNode.parseJsonExpression(chatId, inputData);
        const processedMessage = telegramSendMessageNode.parseJsonExpression(messageText, inputData);
        
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