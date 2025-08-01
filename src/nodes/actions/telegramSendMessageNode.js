/*
=================================================================
BACKEND FILE: src/nodes/actions/telegramSendMessageNode.js (RECREATED)
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

    async execute(nodeConfig, inputData) {
        console.log('🚀 TELEGRAM SEND MESSAGE - NEW NODE');
        console.log('📨 Node config:', JSON.stringify(nodeConfig, null, 2));
        console.log('📥 Input data:', JSON.stringify(inputData, null, 2));
        
        const { token, chatId, messageText, parseMode, disableNotification } = nodeConfig;

        // Validate required fields
        if (!token) {
            throw new Error('Bot Token is required');
        }
        if (!chatId) {
            throw new Error('Chat ID is required');
        }
        if (!messageText) {
            throw new Error('Message Text is required');
        }

        // UNIVERSAL Template Parser - handles BOTH {{$json.xxx}} AND {{nodePrefix.xxx}} formats
        const parseUniversalTemplate = (inputStr, json) => {
            if (!inputStr) return inputStr || '';
            
            console.log('🔄 Processing template:', inputStr);
            console.log('📋 Available data keys:', Object.keys(json || {}));
            console.log('📋 Full available data:', JSON.stringify(json, null, 2));
            
            let result = inputStr;
            
            // 1. Handle {{$json.path.to.value}} format (new system)
            result = result.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
                try {
                    if (!json) return match;
                    
                    const keys = path.split('.');
                    let value = json;
                    
                    for (const key of keys) {
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                        } else {
                            console.log('❌ $json path not found:', path, 'in', Object.keys(json));
                            return match;
                        }
                    }
                    
                    const processedValue = typeof value === 'string' ? value : 
                                         typeof value === 'number' || typeof value === 'boolean' ? String(value) :
                                         typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) :
                                         String(value || '');
                    
                    console.log('✅ $json template replaced:', match, '->', processedValue);
                    return processedValue;
                } catch (error) {
                    console.error('💥 $json template error:', error);
                    return match;
                }
            });
            
            // 2. Handle {{nodePrefix.path.to.value}} format (frontend system)
            result = result.replace(/\{\{\s*([a-zA-Z]+)\.(.*?)\s*\}\}/g, (match, nodePrefix, path) => {
                try {
                    console.log('🎯 Processing node-prefixed template:', match, 'prefix:', nodePrefix, 'path:', path);
                    
                    if (!json) return match;
                    
                    // Map frontend node prefixes to data locations
                    let dataSource = null;
                    
                    if (nodePrefix === 'telegram' && json._telegram) {
                        dataSource = json._telegram;
                    } else if (nodePrefix === 'telegram' && json._originalTrigger) {
                        dataSource = json._originalTrigger;
                    } else if (nodePrefix === 'aiAgent' && json.reply) {
                        // For AI Agent responses, map common paths
                        if (path === 'reply') return json.reply;
                        if (path === 'response') return json.reply;
                    } else if (nodePrefix === 'aiAgent' && json.userMessage) {
                        if (path === 'userMessage') return json.userMessage;
                    } else if (json[nodePrefix]) {
                        dataSource = json[nodePrefix];
                    } else {
                        // Try to find the data in the main object
                        dataSource = json;
                    }
                    
                    if (!dataSource) {
                        console.log('❌ Node prefix not found:', nodePrefix, 'in data keys:', Object.keys(json));
                        return match;
                    }
                    
                    // Navigate the path in the data source
                    const keys = path.split('.');
                    let value = dataSource;
                    
                    for (const key of keys) {
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                        } else {
                            console.log('❌ Node-prefixed path not found:', path, 'in', Object.keys(dataSource));
                            return match;
                        }
                    }
                    
                    const processedValue = typeof value === 'string' ? value : 
                                         typeof value === 'number' || typeof value === 'boolean' ? String(value) :
                                         typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) :
                                         String(value || '');
                    
                    console.log('✅ Node-prefixed template replaced:', match, '->', processedValue);
                    return processedValue;
                } catch (error) {
                    console.error('💥 Node-prefixed template error:', error);
                    return match;
                }
            });
            
            console.log('🎉 Final template result:', result);
            return result;
        };

        // Process templates using universal parser
        const processedChatId = parseUniversalTemplate(chatId, inputData);
        const processedMessage = parseUniversalTemplate(messageText, inputData);
        
        console.log('🎯 Final processed values:');
        console.log('  Chat ID:', processedChatId);
        console.log('  Message:', processedMessage);

        if (!processedChatId || processedChatId === chatId) {
            throw new Error(`Chat ID template not resolved. Template: ${chatId}, Data keys: ${Object.keys(inputData)}`);
        }

        try {
            // Send message to Telegram
            const telegramApiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
            
            const requestBody = {
                chat_id: processedChatId,
                text: processedMessage,
                disable_notification: disableNotification || false,
            };

            if (parseMode && parseMode !== '') {
                requestBody.parse_mode = parseMode;
            }

            console.log('📤 Sending to Telegram API:', {
                chat_id: processedChatId,
                text: processedMessage.substring(0, 100) + '...',
                parse_mode: parseMode
            });

            const response = await axios.post(telegramApiUrl, requestBody);

            if (response.data.ok) {
                console.log('🎉 Message sent successfully!');
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
            console.error('💥 Error sending Telegram message:', error.message);
            
            let errorMessage = 'Failed to send message';
            
            if (error.response) {
                const telegramError = error.response.data;
                errorMessage = telegramError.description || `HTTP ${error.response.status}: ${error.response.statusText}`;
            } else if (error.request) {
                errorMessage = 'Network error: Could not reach Telegram API';
            } else {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    },
};

module.exports = telegramSendMessageNode;