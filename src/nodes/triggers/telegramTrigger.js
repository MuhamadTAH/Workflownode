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
        console.log('🎤 Telegram Trigger: Processing webhook update...');
        const update = request.body;
        
        // Process the update to enhance voice message data
        const processedUpdate = await this.processUpdate(update);
        
        const returnData = [{
            json: processedUpdate,
        }];
        return {
            workflowData: returnData,
        };
    },

    // Process Telegram update to enhance voice message data
    async processUpdate(update) {
        try {
            console.log('📝 Processing Telegram update:', JSON.stringify(update, null, 2));
            
            // Check if this update contains a message
            if (!update.message) {
                console.log('📝 No message in update, returning as-is');
                return update;
            }

            const message = update.message;
            const processedUpdate = { ...update };

            // Check if the message contains a voice message
            if (message.voice) {
                console.log('🎤 Voice message detected!');
                console.log('🎤 Voice data:', JSON.stringify(message.voice, null, 2));
                
                // Get bot token from the message (we need to extract it from webhook URL or pass it differently)
                // For now, we'll enhance the voice data with what we have and add file URL later
                const voiceData = {
                    ...message.voice,
                    // Add enhanced voice metadata
                    message_type: 'voice',
                    duration_formatted: this.formatDuration(message.voice.duration || 0),
                    file_size_formatted: this.formatFileSize(message.voice.file_size || 0),
                };

                // Try to get the file URL if we can determine the bot token
                const botToken = this.extractBotTokenFromContext(update);
                if (botToken) {
                    try {
                        const fileUrl = await this.getVoiceFileUrl(botToken, message.voice.file_id);
                        voiceData.file_url = fileUrl;
                        voiceData.download_url = fileUrl;
                        console.log('🎤 Voice file URL retrieved:', fileUrl);
                    } catch (error) {
                        console.log('⚠️ Could not get voice file URL:', error.message);
                        voiceData.file_url_error = error.message;
                    }
                } else {
                    // Fallback: Generate manual file URL template that can be used with template variables
                    console.log('🔧 Generating fallback file URL template...');
                    voiceData.file_url_template = `https://api.telegram.org/bot{{bot_token}}/getFile?file_id=${message.voice.file_id}`;
                    voiceData.download_url_template = `https://api.telegram.org/file/bot{{bot_token}}/voice_${message.voice.file_unique_id}`;
                    voiceData.manual_url_info = {
                        message: "Use bot token to complete URLs",
                        getFile_url: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getFile?file_id=${message.voice.file_id}`,
                        note: "Call getFile API first to get file_path, then use: https://api.telegram.org/file/bot{YOUR_BOT_TOKEN}/{file_path}"
                    };
                    console.log('🔧 Fallback URLs generated with templates');
                }

                // Enhanced message with voice data
                processedUpdate.message = {
                    ...message,
                    voice: voiceData,
                    // Add convenience flags
                    has_voice: true,
                    message_type: 'voice',
                };

                console.log('🎤 Enhanced voice message data:', JSON.stringify(voiceData, null, 2));
            } else {
                // Add convenience flag for non-voice messages
                processedUpdate.message = {
                    ...message,
                    has_voice: false,
                    message_type: message.text ? 'text' : 'other',
                };
            }

            return processedUpdate;
        } catch (error) {
            console.error('❌ Error processing Telegram update:', error);
            // Return original update if processing fails
            return update;
        }
    },

    // Get voice file URL from Telegram API
    async getVoiceFileUrl(botToken, fileId) {
        try {
            console.log('🎤 Getting voice file URL for file_id:', fileId);
            
            const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile`;
            const response = await axios.post(getFileUrl, {
                file_id: fileId
            });

            if (response.data.ok) {
                const filePath = response.data.result.file_path;
                const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
                console.log('🎤 Voice file URL generated:', fileUrl);
                return fileUrl;
            } else {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }
        } catch (error) {
            console.error('❌ Failed to get voice file URL:', error.message);
            throw error;
        }
    },

    // Extract bot token from webhook context (this might need adjustment based on how webhooks are configured)
    extractBotTokenFromContext(update) {
        console.log('🔍 Attempting to extract bot token from context...');
        console.log('🔍 DEBUG: Update keys:', Object.keys(update));
        console.log('🔍 DEBUG: Looking for _botToken in update...');
        
        // Check if token is stored in update metadata (if we add it)
        if (update._botToken) {
            console.log('✅ Bot token found in update context!');
            console.log('✅ Bot token (first 10 chars):', update._botToken.substring(0, 10) + '...');
            return update._botToken;
        }
        
        // Could also be extracted from the webhook URL pattern if available
        // For now, return null and handle gracefully
        console.log('❌ Bot token not available in current context');
        console.log('❌ Available update fields:', Object.keys(update));
        return null;
    },

    // Format duration in human-readable format
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        }
    },

    // Format file size in human-readable format
    formatFileSize(bytes) {
        if (bytes < 1024) {
            return `${bytes} bytes`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    },
};

module.exports = telegramTriggerNode;
