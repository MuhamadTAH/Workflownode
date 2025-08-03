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
            console.log('🔍 DEBUG: Update has message?', !!update.message);
            if (update.message) {
                console.log('🔍 DEBUG: Message has location?', !!update.message.location);
                console.log('🔍 DEBUG: Message has contact?', !!update.message.contact);
                console.log('🔍 DEBUG: Message has voice?', !!update.message.voice);
                console.log('🔍 DEBUG: Message has text?', !!update.message.text);
                console.log('🔍 DEBUG: Message keys:', Object.keys(update.message));
            }
            
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
            } else if (message.location) {
                // Handle location messages
                console.log('📍 Location message detected!');
                console.log('📍 Raw location data:', JSON.stringify(message.location, null, 2));
                
                const locationData = await this.processLocationMessage(message.location);
                console.log('📍 Processed location data:', JSON.stringify(locationData, null, 2));
                
                processedUpdate.message = {
                    ...message,
                    location: locationData,
                    has_location: true,
                    has_voice: false,
                    message_type: 'location',
                };
                
                console.log('📍 Final enhanced message:', JSON.stringify(processedUpdate.message, null, 2));
            } else if (message.contact) {
                // Handle contact messages
                console.log('👤 Contact message detected!');
                console.log('👤 Contact data:', JSON.stringify(message.contact, null, 2));
                
                const contactData = this.processContactMessage(message.contact);
                
                processedUpdate.message = {
                    ...message,
                    contact: contactData,
                    has_contact: true,
                    has_voice: false,
                    has_location: false,
                    message_type: 'contact',
                };
                
                console.log('👤 Enhanced contact message data:', JSON.stringify(contactData, null, 2));
            } else {
                // Handle text and other message types
                processedUpdate.message = {
                    ...message,
                    has_voice: false,
                    has_location: false,
                    has_contact: false,
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

    // Process location message and generate map URLs
    async processLocationMessage(location) {
        try {
            console.log('🔧 processLocationMessage called with:', JSON.stringify(location, null, 2));
            const lat = location.latitude;
            const lng = location.longitude;
            
            console.log(`📍 Processing location: ${lat}, ${lng}`);
            console.log('📍 Latitude type:', typeof lat, 'Longitude type:', typeof lng);
            
            const locationData = {
                ...location,
                // Add convenience fields
                coordinates: `${lat}, ${lng}`,
                coordinates_formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                
                // Generate URLs for multiple map services
                google_maps_url: `https://maps.google.com/maps?q=${lat},${lng}`,
                apple_maps_url: `https://maps.apple.com/?q=${lat},${lng}`,
                waze_url: `https://waze.com/ul?ll=${lat},${lng}`,
                openstreetmap_url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`,
                
                // Additional map service URLs
                bing_maps_url: `https://www.bing.com/maps?q=${lat},${lng}`,
                here_maps_url: `https://wego.here.com/?map=${lat},${lng},15`,
                
                // Generate sharing URLs
                google_maps_share: `https://maps.google.com/?q=${lat},${lng}&t=m`,
                
                // Add metadata
                message_type: 'location',
                is_live_location: !!location.live_period,
                live_period_formatted: location.live_period ? this.formatDuration(location.live_period) : null,
                accuracy_formatted: location.horizontal_accuracy ? `${location.horizontal_accuracy}m` : null,
            };
            
            console.log('🔗 Generated URLs:');
            console.log('🔗 Google Maps:', locationData.google_maps_url);
            console.log('🔗 Apple Maps:', locationData.apple_maps_url);
            console.log('🔗 Waze:', locationData.waze_url);
            
            // Add additional processing for live locations
            if (location.live_period) {
                locationData.live_location_info = {
                    duration: location.live_period,
                    duration_formatted: this.formatDuration(location.live_period),
                    expires_at: new Date(Date.now() + (location.live_period * 1000)).toISOString(),
                };
            }
            
            return locationData;
        } catch (error) {
            console.error('❌ Error processing location message:', error);
            return {
                ...location,
                processing_error: error.message
            };
        }
    },

    // Process contact message and format data
    processContactMessage(contact) {
        try {
            console.log('👤 Processing contact message');
            
            const contactData = {
                ...contact,
                // Add convenience fields
                full_name: [contact.first_name, contact.last_name].filter(Boolean).join(' '),
                display_name: contact.first_name || 'Unknown Contact',
                
                // Format phone number
                phone_formatted: this.formatPhoneNumber(contact.phone_number),
                
                // Check if this is a Telegram user
                is_telegram_user: !!contact.user_id,
                
                // Parse vCard if available
                vcard_info: contact.vcard ? this.parseVCard(contact.vcard) : null,
                
                // Add metadata
                message_type: 'contact',
                contact_type: contact.user_id ? 'telegram_user' : 'external_contact',
            };
            
            return contactData;
        } catch (error) {
            console.error('❌ Error processing contact message:', error);
            return {
                ...contact,
                processing_error: error.message
            };
        }
    },

    // Format phone number (basic formatting)
    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '';
        
        // Remove all non-digit characters except +
        const cleaned = phoneNumber.replace(/[^\d+]/g, '');
        
        // Basic international format
        if (cleaned.startsWith('+')) {
            return cleaned;
        } else if (cleaned.length >= 10) {
            return `+${cleaned}`;
        }
        
        return phoneNumber; // Return original if can't format
    },

    // Basic vCard parsing (can be enhanced)
    parseVCard(vcard) {
        try {
            const lines = vcard.split('\n');
            const parsed = {};
            
            lines.forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join(':').trim();
                    
                    switch (key.toUpperCase()) {
                        case 'FN':
                            parsed.formatted_name = value;
                            break;
                        case 'TEL':
                            parsed.telephone = value;
                            break;
                        case 'EMAIL':
                            parsed.email = value;
                            break;
                        case 'ORG':
                            parsed.organization = value;
                            break;
                        case 'TITLE':
                            parsed.title = value;
                            break;
                    }
                }
            });
            
            return Object.keys(parsed).length > 0 ? parsed : null;
        } catch (error) {
            console.log('⚠️ vCard parsing error:', error.message);
            return null;
        }
    },
};

module.exports = telegramTriggerNode;
