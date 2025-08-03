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
                console.log('🔍 DEBUG: Message has photo?', !!update.message.photo);
                console.log('🔍 DEBUG: Message has video?', !!update.message.video);
                console.log('🔍 DEBUG: Message has voice?', !!update.message.voice);
                console.log('🔍 DEBUG: Message has video_note?', !!update.message.video_note);
                console.log('🔍 DEBUG: Message has animation?', !!update.message.animation);
                console.log('🔍 DEBUG: Message has document?', !!update.message.document);
                console.log('🔍 DEBUG: Message has location?', !!update.message.location);
                console.log('🔍 DEBUG: Message has contact?', !!update.message.contact);
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

            // Check for different media types and process accordingly
            if (message.photo && message.photo.length > 0) {
                // Handle photo messages
                console.log('📸 Photo message detected!');
                console.log('📸 Photo data:', JSON.stringify(message.photo, null, 2));
                
                const photoData = await this.processPhotoMessage(message.photo, update);
                
                processedUpdate.message = {
                    ...message,
                    photo: photoData,
                    has_photo: true,
                    has_video: false,
                    has_voice: false,
                    has_location: false,
                    has_contact: false,
                    message_type: 'photo',
                };
                
                console.log('📸 Enhanced photo message data:', JSON.stringify(photoData, null, 2));
                
            } else if (message.video) {
                // Handle video messages
                console.log('🎬 Video message detected!');
                console.log('🎬 Video data:', JSON.stringify(message.video, null, 2));
                
                const videoData = await this.processVideoMessage(message.video, update);
                
                processedUpdate.message = {
                    ...message,
                    video: videoData,
                    has_video: true,
                    has_photo: false,
                    has_voice: false,
                    has_location: false,
                    has_contact: false,
                    message_type: 'video',
                };
                
                console.log('🎬 Enhanced video message data:', JSON.stringify(videoData, null, 2));
                
            } else if (message.voice) {
                // Handle voice messages
                console.log('🎤 Voice message detected!');
                console.log('🎤 Voice data:', JSON.stringify(message.voice, null, 2));
                
                const voiceData = await this.processVoiceMessage(message.voice, update);
                
                processedUpdate.message = {
                    ...message,
                    voice: voiceData,
                    has_voice: true,
                    has_photo: false,
                    has_video: false,
                    has_location: false,
                    has_contact: false,
                    message_type: 'voice',
                };

                console.log('🎤 Enhanced voice message data:', JSON.stringify(voiceData, null, 2));
                
            } else if (message.video_note) {
                // Handle video note (circular video) messages
                console.log('📹 Video note message detected!');
                console.log('📹 Video note data:', JSON.stringify(message.video_note, null, 2));
                
                const videoNoteData = await this.processVideoNoteMessage(message.video_note, update);
                
                processedUpdate.message = {
                    ...message,
                    video_note: videoNoteData,
                    has_video_note: true,
                    has_photo: false,
                    has_video: false,
                    has_voice: false,
                    has_location: false,
                    has_contact: false,
                    message_type: 'video_note',
                };
                
                console.log('📹 Enhanced video note message data:', JSON.stringify(videoNoteData, null, 2));
                
            } else if (message.animation) {
                // Handle GIF/animation messages
                console.log('🎞️ Animation/GIF message detected!');
                console.log('🎞️ Animation data:', JSON.stringify(message.animation, null, 2));
                
                const animationData = await this.processAnimationMessage(message.animation, update);
                
                processedUpdate.message = {
                    ...message,
                    animation: animationData,
                    has_animation: true,
                    has_photo: false,
                    has_video: false,
                    has_voice: false,
                    has_location: false,
                    has_contact: false,
                    message_type: 'animation',
                };
                
                console.log('🎞️ Enhanced animation message data:', JSON.stringify(animationData, null, 2));
                
            } else if (message.document) {
                // Handle document messages
                console.log('📄 Document message detected!');
                console.log('📄 Document data:', JSON.stringify(message.document, null, 2));
                
                const documentData = await this.processDocumentMessage(message.document, update);
                
                processedUpdate.message = {
                    ...message,
                    document: documentData,
                    has_document: true,
                    has_photo: false,
                    has_video: false,
                    has_voice: false,
                    has_location: false,
                    has_contact: false,
                    message_type: 'document',
                };
                
                console.log('📄 Enhanced document message data:', JSON.stringify(documentData, null, 2));
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
                    has_photo: false,
                    has_video: false,
                    has_voice: false,
                    has_contact: false,
                    has_document: false,
                    has_animation: false,
                    has_video_note: false,
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
                    has_photo: false,
                    has_video: false,
                    has_voice: false,
                    has_location: false,
                    has_document: false,
                    has_animation: false,
                    has_video_note: false,
                    message_type: 'contact',
                };
                
                console.log('👤 Enhanced contact message data:', JSON.stringify(contactData, null, 2));
            } else {
                // Handle text and other message types
                processedUpdate.message = {
                    ...message,
                    has_photo: false,
                    has_video: false,
                    has_voice: false,
                    has_location: false,
                    has_contact: false,
                    has_document: false,
                    has_animation: false,
                    has_video_note: false,
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

    // Process photo message and get file URLs
    async processPhotoMessage(photoArray, update) {
        try {
            console.log('📸 Processing photo message with', photoArray.length, 'photo sizes');
            
            // Telegram sends photos in multiple sizes, get the largest one
            const largestPhoto = photoArray.reduce((largest, current) => {
                return (current.file_size || 0) > (largest.file_size || 0) ? current : largest;
            });
            
            const botToken = this.extractBotTokenFromContext(update);
            
            const photoData = {
                sizes: photoArray,
                largest_photo: largestPhoto,
                total_sizes: photoArray.length,
                message_type: 'photo',
                
                // Add formatted metadata
                largest_size_formatted: this.formatFileSize(largestPhoto.file_size || 0),
                dimensions: `${largestPhoto.width}x${largestPhoto.height}`,
                aspect_ratio: largestPhoto.width && largestPhoto.height ? 
                    (largestPhoto.width / largestPhoto.height).toFixed(2) : null,
            };

            // Try to get file URLs for all photo sizes
            if (botToken) {
                try {
                    photoData.file_urls = {};
                    for (const photo of photoArray) {
                        const fileUrl = await this.getFileUrl(botToken, photo.file_id, 'photo');
                        photoData.file_urls[`${photo.width}x${photo.height}`] = fileUrl;
                    }
                    photoData.download_url = photoData.file_urls[`${largestPhoto.width}x${largestPhoto.height}`];
                    console.log('📸 Photo file URLs retrieved:', Object.keys(photoData.file_urls).length, 'sizes');
                } catch (error) {
                    console.log('⚠️ Could not get photo file URLs:', error.message);
                    photoData.file_url_error = error.message;
                }
            } else {
                // Generate fallback URLs
                photoData.file_url_templates = {};
                photoArray.forEach(photo => {
                    photoData.file_url_templates[`${photo.width}x${photo.height}`] = {
                        getFile_url: `https://api.telegram.org/bot{{bot_token}}/getFile?file_id=${photo.file_id}`,
                        file_id: photo.file_id,
                        file_unique_id: photo.file_unique_id
                    };
                });
                photoData.download_url_template = photoData.file_url_templates[`${largestPhoto.width}x${largestPhoto.height}`];
            }

            return photoData;
        } catch (error) {
            console.error('❌ Error processing photo message:', error);
            return {
                sizes: photoArray,
                processing_error: error.message
            };
        }
    },

    // Process video message and get file URL
    async processVideoMessage(video, update) {
        try {
            console.log('🎬 Processing video message');
            
            const botToken = this.extractBotTokenFromContext(update);
            
            const videoData = {
                ...video,
                message_type: 'video',
                duration_formatted: this.formatDuration(video.duration || 0),
                file_size_formatted: this.formatFileSize(video.file_size || 0),
                dimensions: video.width && video.height ? `${video.width}x${video.height}` : null,
                aspect_ratio: video.width && video.height ? 
                    (video.width / video.height).toFixed(2) : null,
                has_thumb: !!video.thumb,
            };

            // Try to get video file URL
            if (botToken) {
                try {
                    const fileUrl = await this.getFileUrl(botToken, video.file_id, 'video');
                    videoData.file_url = fileUrl;
                    videoData.download_url = fileUrl;
                    
                    // Also get thumbnail URL if available
                    if (video.thumb && video.thumb.file_id) {
                        const thumbUrl = await this.getFileUrl(botToken, video.thumb.file_id, 'thumb');
                        videoData.thumbnail_url = thumbUrl;
                    }
                    
                    console.log('🎬 Video file URL retrieved:', fileUrl);
                } catch (error) {
                    console.log('⚠️ Could not get video file URL:', error.message);
                    videoData.file_url_error = error.message;
                }
            } else {
                videoData.file_url_template = `https://api.telegram.org/bot{{bot_token}}/getFile?file_id=${video.file_id}`;
                videoData.manual_url_info = {
                    message: "Use bot token to complete URLs",
                    getFile_url: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getFile?file_id=${video.file_id}`,
                    note: "Call getFile API first to get file_path, then use: https://api.telegram.org/file/bot{YOUR_BOT_TOKEN}/{file_path}"
                };
            }

            return videoData;
        } catch (error) {
            console.error('❌ Error processing video message:', error);
            return {
                ...video,
                processing_error: error.message
            };
        }
    },

    // Process voice message
    async processVoiceMessage(voice, update) {
        try {
            console.log('🎤 Processing voice message');
            
            const botToken = this.extractBotTokenFromContext(update);
            
            const voiceData = {
                ...voice,
                message_type: 'voice',
                duration_formatted: this.formatDuration(voice.duration || 0),
                file_size_formatted: this.formatFileSize(voice.file_size || 0),
            };

            if (botToken) {
                try {
                    const fileUrl = await this.getFileUrl(botToken, voice.file_id, 'voice');
                    voiceData.file_url = fileUrl;
                    voiceData.download_url = fileUrl;
                    console.log('🎤 Voice file URL retrieved:', fileUrl);
                } catch (error) {
                    console.log('⚠️ Could not get voice file URL:', error.message);
                    voiceData.file_url_error = error.message;
                }
            } else {
                voiceData.file_url_template = `https://api.telegram.org/bot{{bot_token}}/getFile?file_id=${voice.file_id}`;
                voiceData.manual_url_info = {
                    message: "Use bot token to complete URLs",
                    getFile_url: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getFile?file_id=${voice.file_id}`,
                    note: "Call getFile API first to get file_path, then use: https://api.telegram.org/file/bot{YOUR_BOT_TOKEN}/{file_path}"
                };
            }

            return voiceData;
        } catch (error) {
            console.error('❌ Error processing voice message:', error);
            return {
                ...voice,
                processing_error: error.message
            };
        }
    },

    // Process video note (circular video) message
    async processVideoNoteMessage(videoNote, update) {
        try {
            console.log('📹 Processing video note message');
            
            const botToken = this.extractBotTokenFromContext(update);
            
            const videoNoteData = {
                ...videoNote,
                message_type: 'video_note',
                duration_formatted: this.formatDuration(videoNote.duration || 0),
                file_size_formatted: this.formatFileSize(videoNote.file_size || 0),
                is_circular: true,
                has_thumb: !!videoNote.thumb,
            };

            if (botToken) {
                try {
                    const fileUrl = await this.getFileUrl(botToken, videoNote.file_id, 'video_note');
                    videoNoteData.file_url = fileUrl;
                    videoNoteData.download_url = fileUrl;
                    
                    if (videoNote.thumb && videoNote.thumb.file_id) {
                        const thumbUrl = await this.getFileUrl(botToken, videoNote.thumb.file_id, 'thumb');
                        videoNoteData.thumbnail_url = thumbUrl;
                    }
                    
                    console.log('📹 Video note file URL retrieved:', fileUrl);
                } catch (error) {
                    console.log('⚠️ Could not get video note file URL:', error.message);
                    videoNoteData.file_url_error = error.message;
                }
            } else {
                videoNoteData.file_url_template = `https://api.telegram.org/bot{{bot_token}}/getFile?file_id=${videoNote.file_id}`;
                videoNoteData.manual_url_info = {
                    message: "Use bot token to complete URLs",
                    getFile_url: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getFile?file_id=${videoNote.file_id}`,
                    note: "Call getFile API first to get file_path, then use: https://api.telegram.org/file/bot{YOUR_BOT_TOKEN}/{file_path}"
                };
            }

            return videoNoteData;
        } catch (error) {
            console.error('❌ Error processing video note message:', error);
            return {
                ...videoNote,
                processing_error: error.message
            };
        }
    },

    // Process animation/GIF message
    async processAnimationMessage(animation, update) {
        try {
            console.log('🎞️ Processing animation message');
            
            const botToken = this.extractBotTokenFromContext(update);
            
            const animationData = {
                ...animation,
                message_type: 'animation',
                duration_formatted: animation.duration ? this.formatDuration(animation.duration) : 'N/A',
                file_size_formatted: this.formatFileSize(animation.file_size || 0),
                dimensions: animation.width && animation.height ? `${animation.width}x${animation.height}` : null,
                aspect_ratio: animation.width && animation.height ? 
                    (animation.width / animation.height).toFixed(2) : null,
                has_thumb: !!animation.thumb,
                is_gif: true,
            };

            if (botToken) {
                try {
                    const fileUrl = await this.getFileUrl(botToken, animation.file_id, 'animation');
                    animationData.file_url = fileUrl;
                    animationData.download_url = fileUrl;
                    
                    if (animation.thumb && animation.thumb.file_id) {
                        const thumbUrl = await this.getFileUrl(botToken, animation.thumb.file_id, 'thumb');
                        animationData.thumbnail_url = thumbUrl;
                    }
                    
                    console.log('🎞️ Animation file URL retrieved:', fileUrl);
                } catch (error) {
                    console.log('⚠️ Could not get animation file URL:', error.message);
                    animationData.file_url_error = error.message;
                }
            } else {
                animationData.file_url_template = `https://api.telegram.org/bot{{bot_token}}/getFile?file_id=${animation.file_id}`;
                animationData.manual_url_info = {
                    message: "Use bot token to complete URLs",
                    getFile_url: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getFile?file_id=${animation.file_id}`,
                    note: "Call getFile API first to get file_path, then use: https://api.telegram.org/file/bot{YOUR_BOT_TOKEN}/{file_path}"
                };
            }

            return animationData;
        } catch (error) {
            console.error('❌ Error processing animation message:', error);
            return {
                ...animation,
                processing_error: error.message
            };
        }
    },

    // Process document message
    async processDocumentMessage(document, update) {
        try {
            console.log('📄 Processing document message');
            
            const botToken = this.extractBotTokenFromContext(update);
            
            const documentData = {
                ...document,
                message_type: 'document',
                file_size_formatted: this.formatFileSize(document.file_size || 0),
                file_extension: document.file_name ? document.file_name.split('.').pop()?.toLowerCase() : null,
                has_thumb: !!document.thumb,
                mime_type_category: this.categorizeFileType(document.mime_type),
            };

            if (botToken) {
                try {
                    const fileUrl = await this.getFileUrl(botToken, document.file_id, 'document');
                    documentData.file_url = fileUrl;
                    documentData.download_url = fileUrl;
                    
                    if (document.thumb && document.thumb.file_id) {
                        const thumbUrl = await this.getFileUrl(botToken, document.thumb.file_id, 'thumb');
                        documentData.thumbnail_url = thumbUrl;
                    }
                    
                    console.log('📄 Document file URL retrieved:', fileUrl);
                } catch (error) {
                    console.log('⚠️ Could not get document file URL:', error.message);
                    documentData.file_url_error = error.message;
                }
            } else {
                documentData.file_url_template = `https://api.telegram.org/bot{{bot_token}}/getFile?file_id=${document.file_id}`;
                documentData.manual_url_info = {
                    message: "Use bot token to complete URLs",
                    getFile_url: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getFile?file_id=${document.file_id}`,
                    note: "Call getFile API first to get file_path, then use: https://api.telegram.org/file/bot{YOUR_BOT_TOKEN}/{file_path}"
                };
            }

            return documentData;
        } catch (error) {
            console.error('❌ Error processing document message:', error);
            return {
                ...document,
                processing_error: error.message
            };
        }
    },

    // Generic file URL getter (replaces the voice-specific one)
    async getFileUrl(botToken, fileId, fileType = 'file') {
        try {
            console.log(`🔗 Getting ${fileType} file URL for file_id:`, fileId);
            
            const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile`;
            const response = await axios.post(getFileUrl, {
                file_id: fileId
            });

            if (response.data.ok) {
                const filePath = response.data.result.file_path;
                const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
                console.log(`🔗 ${fileType} file URL generated:`, fileUrl);
                return fileUrl;
            } else {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }
        } catch (error) {
            console.error(`❌ Failed to get ${fileType} file URL:`, error.message);
            throw error;
        }
    },

    // Get voice file URL from Telegram API (kept for backward compatibility)
    async getVoiceFileUrl(botToken, fileId) {
        return this.getFileUrl(botToken, fileId, 'voice');
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

    // Categorize file type based on MIME type
    categorizeFileType(mimeType) {
        if (!mimeType) return 'unknown';
        
        const lowerMime = mimeType.toLowerCase();
        
        if (lowerMime.startsWith('image/')) {
            return 'image';
        } else if (lowerMime.startsWith('video/')) {
            return 'video';
        } else if (lowerMime.startsWith('audio/')) {
            return 'audio';
        } else if (lowerMime.includes('pdf')) {
            return 'pdf';
        } else if (lowerMime.includes('document') || lowerMime.includes('word') || lowerMime.includes('excel') || lowerMime.includes('powerpoint')) {
            return 'office_document';
        } else if (lowerMime.includes('text/')) {
            return 'text';
        } else if (lowerMime.includes('zip') || lowerMime.includes('rar') || lowerMime.includes('tar') || lowerMime.includes('archive')) {
            return 'archive';
        } else {
            return 'other';
        }
    },
};

module.exports = telegramTriggerNode;
