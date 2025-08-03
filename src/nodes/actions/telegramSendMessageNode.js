/*
=================================================================
BACKEND FILE: src/nodes/actions/telegramSendMessageNode.js
=================================================================
This file defines the Telegram Send Message node for sending messages to Telegram bot chats.
*/

const axios = require('axios');

const telegramSendMessageNode = {
    description: {
        displayName: 'Telegram Send Message',
        name: 'telegramSendMessage',
        icon: 'fa:telegram',
        group: 'actions',
        version: 1,
        description: 'Sends a message to a Telegram bot chat.',
        defaults: {
            name: 'Telegram Send Message',
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
            {
                displayName: 'Chat ID',
                name: 'chatId',
                type: 'string',
                default: '{{$json.message.chat.id}}',
                required: true,
                description: 'Chat ID where to send the message. Use template variables like {{$json.message.chat.id}} or {{telegram.message.chat.id}}',
                placeholder: '123456789 or {{$json.message.chat.id}}',
            },
            {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: 'Hello! This is a message from your bot.',
                required: true,
                description: 'The message text to send. Supports template variables like {{$json.response}} or {{aiAgent.reply}}',
            },
            {
                displayName: 'Parse Mode',
                name: 'parseMode',
                type: 'options',
                options: [
                    { name: 'None', value: '' },
                    { name: 'Markdown', value: 'Markdown' },
                    { name: 'MarkdownV2', value: 'MarkdownV2' },
                    { name: 'HTML', value: 'HTML' },
                ],
                default: '',
                required: false,
                description: 'Message formatting mode.',
            },
            {
                displayName: 'Disable Web Page Preview',
                name: 'disableWebPagePreview',
                type: 'boolean',
                default: false,
                required: false,
                description: 'Disables link previews for links in this message.',
            },
            {
                displayName: 'Disable Notification',
                name: 'disableNotification',
                type: 'boolean',
                default: false,
                required: false,
                description: 'Sends the message silently. Users will receive a notification with no sound.',
            },
        ],
    },

    // Execute the Telegram Send Message node
    async execute(nodeConfig, inputData, connectedNodes = []) {
        console.log('=== TELEGRAM SEND MESSAGE DEBUG ===');
        console.log('nodeConfig:', JSON.stringify(nodeConfig, null, 2));
        console.log('inputData:', JSON.stringify(inputData, null, 2));
        console.log('connectedNodes:', connectedNodes?.length || 0);
        
        // Universal Template Parser - supports both {{$json.xxx}} and {{nodePrefix.xxx}} formats
        const parseUniversalTemplate = (inputStr, json) => {
            console.log('Template parsing - input:', inputStr);
            console.log('Template parsing - json keys:', json ? Object.keys(json) : 'null');
            
            if (!inputStr || typeof inputStr !== 'string') return inputStr || '';
            
            let result = inputStr;
            
            // 1. Handle {{$json.path.to.value}} format (backend system) with workflow chain support
            result = result.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
                try {
                    if (!json) return match;
                    
                    // For workflow chain data, look inside the steps
                    if (Object.keys(json).some(key => key.startsWith('step_'))) {
                        console.log('🔗 Telegram: Detected workflow chain data, searching in steps...');
                        
                        // Try to find the path in any step
                        for (const [stepKey, stepValue] of Object.entries(json)) {
                            if (stepKey.startsWith('step_') && typeof stepValue === 'object') {
                                console.log(`🔍 Telegram: Checking step: ${stepKey}`);
                                
                                const keys = path.split('.');
                                let value = stepValue;
                                let found = true;
                                
                                for (const key of keys) {
                                    if (value && typeof value === 'object' && key in value) {
                                        value = value[key];
                                    } else {
                                        found = false;
                                        break;
                                    }
                                }
                                
                                if (found) {
                                    const result = String(value || '');
                                    console.log('✅ Telegram: Found value in workflow chain:', result);
                                    return result;
                                }
                            }
                        }
                        
                        console.log('❌ Telegram: Path not found in any workflow step');
                        return match;
                    } else {
                        // Regular data processing for non-workflow data
                        const keys = path.split('.');
                        let value = json;
                        for (const key of keys) {
                            if (value && typeof value === 'object' && key in value) {
                                value = value[key];
                            } else {
                                return match; // Keep original if not found
                            }
                        }
                        const finalValue = String(value || '');
                        return finalValue;
                    }
                } catch (error) {
                    console.error('Error parsing $json template:', error);
                    return match;
                }
            });
            
            // 2. Handle {{nodePrefix.path.to.value}} format (frontend system) with step support
            result = result.replace(/\{\{\s*([a-zA-Z_]+)\.(.+?)\s*\}\}/g, (match, nodePrefix, path) => {
                try {
                    let dataSource = null;
                    
                    // For workflow chain data, look for step keys that contain the node prefix
                    if (Object.keys(json).some(key => key.startsWith('step_'))) {
                        console.log(`🔗 Telegram: Looking for nodePrefix '${nodePrefix}' in workflow chain...`);
                        
                        // Look for steps that match the node prefix
                        for (const [stepKey, stepValue] of Object.entries(json)) {
                            if (stepKey.startsWith('step_') && typeof stepValue === 'object') {
                                // Check if this step matches the node prefix (case insensitive, handle underscores)
                                const stepName = stepKey.replace(/^step_\d+_/, '').toLowerCase().replace(/_/g, '');
                                const prefixName = nodePrefix.toLowerCase().replace(/_/g, '');
                                
                                if (stepName.includes(prefixName) || prefixName.includes(stepName)) {
                                    console.log(`🎯 Telegram: Found matching step '${stepKey}' for prefix '${nodePrefix}'`);
                                    dataSource = stepValue;
                                    break;
                                }
                            }
                        }
                        
                        if (!dataSource) {
                            console.log(`❌ Telegram: No step found for nodePrefix '${nodePrefix}'`);
                            return match;
                        }
                    } else {
                        // Fallback to regular node prefix mapping for non-workflow data
                        if (nodePrefix === 'telegram' && json._telegram) {
                            dataSource = json._telegram;
                        } else if (nodePrefix === 'telegram' && json._originalTrigger) {
                            dataSource = json._originalTrigger;
                        } else if (nodePrefix === 'aiAgent' && json.reply) {
                            if (path === 'reply' || path === 'response') return json.reply;
                            dataSource = json;
                        } else if (json[nodePrefix]) {
                            dataSource = json[nodePrefix];
                        } else {
                            dataSource = json;
                        }
                    }
                    
                    if (!dataSource) {
                        console.log(`❌ Telegram: No data source found for nodePrefix '${nodePrefix}'`);
                        return match;
                    }
                    
                    // Navigate the path in data source
                    const keys = path.split('.');
                    let value = dataSource;
                    
                    // Handle legacy templates with 'data' prefix (e.g., {{Telegram_Trigger.data.message.from.id}})
                    // Only if the first key is 'data' and it doesn't exist in the data source
                    if (keys[0] === 'data' && keys.length > 1 && !(keys[0] in value)) {
                        console.log('🔧 Telegram: Detected legacy "data" prefix in template, removing it');
                        keys.shift(); // Remove the 'data' prefix
                    }
                    
                    for (const key of keys) {
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                        } else {
                            console.log(`❌ Telegram: Key '${key}' not found in path '${path}'`);
                            console.log(`Available keys in current level:`, value && typeof value === 'object' ? Object.keys(value) : 'not an object');
                            return match;
                        }
                    }
                    
                    const result = String(value || '');
                    console.log(`✅ Telegram: Successfully processed ${match} → ${result}`);
                    return result;
                } catch (error) {
                    console.error('Error parsing nodePrefix template:', error);
                    return match;
                }
            });
            
            // 3. Handle n8n-style syntax: {{ $('NodeName').item.json.field }}
            result = result.replace(/\{\{\s*\$\('([^']+)'\)\.item\.json\.(.*?)\s*\}\}/g, (match, nodeName, path) => {
                console.log('n8n template found - nodeName:', nodeName, 'path:', path);
                try {
                    if (!json) {
                        console.log('No json data available for n8n template');
                        return match;
                    }
                    
                    // Look for data from the specified node
                    let nodeData = null;
                    
                    // Check if we have node-organized data
                    if (json[nodeName]) {
                        nodeData = json[nodeName];
                        console.log('Found node data for', nodeName, ':', typeof nodeData === 'object' ? Object.keys(nodeData) : nodeData);
                    } else if (json._nodes && json._nodes[nodeName]) {
                        nodeData = json._nodes[nodeName];
                        console.log('Found node data in _nodes for', nodeName);
                    } else {
                        // Fallback: if this is the trigger node, use the main data
                        if (nodeName.toLowerCase().includes('trigger') && (json.message || json.update_id)) {
                            nodeData = json;
                            console.log('Using main data as trigger node data');
                        } else {
                            console.log('Node data not found for:', nodeName);
                            return match;
                        }
                    }
                    
                    // Navigate the path in the node data
                    const keys = path.split('.');
                    console.log('n8n path keys:', keys);
                    let value = nodeData;
                    
                    for (const key of keys) {
                        console.log('Looking for n8n key:', key, 'in:', typeof value === 'object' ? Object.keys(value) : value);
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                            console.log('Found n8n value:', value);
                        } else {
                            console.log('n8n key not found, returning original match');
                            return match;
                        }
                    }
                    
                    const finalValue = String(value || '');
                    console.log('Final n8n replacement value:', finalValue);
                    return finalValue;
                } catch (error) {
                    console.error('Error parsing n8n template:', error);
                    return match;
                }
            });
            
            return result;
        };

        const { 
            botToken, 
            chatId, 
            messageText, 
            messageType = 'text',
            photoUrl,
            photoCaption,
            videoUrl,
            videoCaption,
            parseMode = '', 
            disableWebPagePreview = false, 
            disableNotification = false 
        } = nodeConfig;
        
        if (!botToken) {
            throw new Error('Bot API Token is required for Telegram Send Message node.');
        }

        if (!chatId) {
            throw new Error('Chat ID is required for Telegram Send Message node.');
        }

        // Validate content based on message type
        if (messageType === 'text' && !messageText) {
            throw new Error('Message Text is required for text messages.');
        }
        if (messageType === 'photo' && !photoUrl) {
            throw new Error('Photo URL is required for photo messages.');
        }
        if (messageType === 'video' && !videoUrl) {
            throw new Error('Video URL is required for video messages.');
        }

        // Process template variables in chatId and content
        console.log('Original chatId:', chatId);
        console.log('Message type:', messageType);
        
        const processedChatId = parseUniversalTemplate(chatId, inputData);
        
        let processedContent = {};
        if (messageType === 'text') {
            console.log('Original messageText:', messageText);
            processedContent.text = parseUniversalTemplate(messageText, inputData);
        } else if (messageType === 'photo') {
            console.log('Original photoUrl:', photoUrl);
            console.log('Original photoCaption:', photoCaption);
            processedContent.photo = parseUniversalTemplate(photoUrl, inputData);
            processedContent.caption = (photoCaption && photoCaption.trim()) ? parseUniversalTemplate(photoCaption, inputData) : '';
        } else if (messageType === 'video') {
            console.log('Original videoUrl:', videoUrl);
            console.log('Original videoCaption:', videoCaption);
            processedContent.video = parseUniversalTemplate(videoUrl, inputData);
            processedContent.caption = (videoCaption && videoCaption.trim()) ? parseUniversalTemplate(videoCaption, inputData) : '';
        }
        
        console.log('Processed chatId:', processedChatId);
        console.log('Processed content:', processedContent);

        if (!processedChatId.trim()) {
            throw new Error('Processed Chat ID cannot be empty. Check your template variables.');
        }

        // Validate processed content based on message type
        if (messageType === 'text' && !processedContent.text.trim()) {
            throw new Error('Processed Message Text cannot be empty. Check your template variables.');
        }
        if (messageType === 'photo' && !processedContent.photo.trim()) {
            throw new Error('Processed Photo URL cannot be empty. Check your template variables.');
        }
        if (messageType === 'video' && !processedContent.video.trim()) {
            throw new Error('Processed Video URL cannot be empty. Check your template variables.');
        }

        // Validate chat ID is numeric (Telegram chat IDs are numbers)
        const numericChatId = processedChatId.trim();
        if (!numericChatId.match(/^-?\d+$/)) {
            throw new Error(`Invalid Chat ID format: "${numericChatId}". Chat ID must be a number.`);
        }

        // Prepare the API request based on message type
        let telegramApiUrl, requestData;

        if (messageType === 'text') {
            telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
            requestData = {
                chat_id: numericChatId,
                text: processedContent.text,
                disable_web_page_preview: disableWebPagePreview,
                disable_notification: disableNotification,
            };
            // Add parse mode if specified
            if (parseMode && parseMode.trim()) {
                requestData.parse_mode = parseMode;
            }
        } else if (messageType === 'photo') {
            telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
            requestData = {
                chat_id: numericChatId,
                photo: processedContent.photo,
                disable_notification: disableNotification,
            };
            if (processedContent.caption && processedContent.caption.trim()) {
                requestData.caption = processedContent.caption;
                // Add parse mode for caption if specified
                if (parseMode && parseMode.trim()) {
                    requestData.parse_mode = parseMode;
                }
            }
        } else if (messageType === 'video') {
            console.log('🎥 Processing video request...');
            console.log('Video URL length:', processedContent.video.length);
            console.log('Video URL type:', typeof processedContent.video);
            console.log('Video URL starts with:', processedContent.video.substring(0, 50));
            
            telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendVideo`;
            requestData = {
                chat_id: numericChatId,
                video: processedContent.video,
                disable_notification: disableNotification,
            };
            if (processedContent.caption && processedContent.caption.trim()) {
                requestData.caption = processedContent.caption;
                // Add parse mode for caption if specified
                if (parseMode && parseMode.trim()) {
                    requestData.parse_mode = parseMode;
                }
            }
            
            console.log('🎥 Video request data prepared:', JSON.stringify(requestData, null, 2));
        }

        try {
            console.log('Sending Telegram', messageType, 'to chat:', numericChatId);
            if (messageType === 'text') {
                console.log('Message text:', processedContent.text.substring(0, 100) + (processedContent.text.length > 100 ? '...' : ''));
            } else if (messageType === 'photo') {
                console.log('Photo URL:', processedContent.photo);
                console.log('Photo caption:', processedContent.caption || 'No caption');
            } else if (messageType === 'video') {
                console.log('Video URL:', processedContent.video);
                console.log('Video caption:', processedContent.caption || 'No caption');
            }
            
            const response = await axios.post(telegramApiUrl, requestData);
            
            const messageData = response.data;
            
            if (messageData.ok) {
                console.log('Message sent successfully:', messageData.result.message_id);
                
                const responseData = {
                    success: true,
                    messageId: messageData.result.message_id,
                    chatId: numericChatId,
                    messageType: messageType,
                    timestamp: new Date().toISOString(),
                    botToken: botToken.substring(0, 10) + '...', // Partial token for logging
                    parseMode: parseMode,
                    telegramResponse: messageData.result,
                    originalChatId: chatId,
                };

                // Add type-specific content information
                if (messageType === 'text') {
                    responseData.sentText = processedContent.text;
                    responseData.originalMessageText = messageText;
                } else if (messageType === 'photo') {
                    responseData.sentPhotoUrl = processedContent.photo;
                    responseData.sentCaption = processedContent.caption;
                    responseData.originalPhotoUrl = photoUrl;
                    responseData.originalPhotoCaption = photoCaption;
                } else if (messageType === 'video') {
                    responseData.sentVideoUrl = processedContent.video;
                    responseData.sentCaption = processedContent.caption;
                    responseData.originalVideoUrl = videoUrl;
                    responseData.originalVideoCaption = videoCaption;
                }

                return responseData;
            } else {
                throw new Error(`Telegram API error: ${messageData.description || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('=== TELEGRAM ERROR DEBUG ===');
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            console.error('Error response:', error.response ? error.response.data : 'No response data');
            console.error('Request URL:', telegramApiUrl);
            console.error('Request data:', JSON.stringify(requestData, null, 2));
            console.error('Message type:', messageType);
            console.error('Processed content:', JSON.stringify(processedContent, null, 2));
            console.error('=== END DEBUG ===');
            
            // Provide helpful error messages
            let errorMessage = 'Failed to send Telegram message';
            if (error.response && error.response.data) {
                const telegramError = error.response.data;
                if (telegramError.description) {
                    errorMessage += `: ${telegramError.description}`;
                    
                    // Provide specific guidance for common errors
                    if (telegramError.description.includes('chat not found')) {
                        errorMessage += ' (Check if the chat ID is correct and the bot has access to this chat)';
                    } else if (telegramError.description.includes('Unauthorized')) {
                        errorMessage += ' (Check if the bot token is correct)';
                    } else if (telegramError.description.includes('blocked')) {
                        errorMessage += ' (The bot has been blocked by the user)';
                    } else if (telegramError.description.includes('failed to get HTTP URL content')) {
                        errorMessage += ' (Media URL is not accessible. Check if the URL is correct and publicly available)';
                    } else if (telegramError.description.includes('photo_invalid_dimensions')) {
                        errorMessage += ' (Photo dimensions are invalid. Check if the image file is valid)';
                    } else if (telegramError.description.includes('video_file_invalid')) {
                        errorMessage += ' (Video file is invalid. Check if the video URL is correct and the file format is supported)';
                    } else if (telegramError.description.includes('wrong file identifier')) {
                        errorMessage += ' (Invalid media URL format. Make sure the URL points directly to a media file)';
                    }
                }
            } else {
                errorMessage += `: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    },
};

module.exports = telegramSendMessageNode;