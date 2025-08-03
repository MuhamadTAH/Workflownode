/*
=================================================================
BACKEND FILE: src/nodes/actions/telegramSendMessageNode.js
=================================================================
Comprehensive Telegram Send Message node supporting all message types:
- Text (with formatting)
- Photos, Videos, Audio, Voice Notes
- Documents, Animations/GIFs, Stickers
- Locations, Contacts, Polls/Quizzes
*/

const axios = require('axios');

const telegramSendMessageNode = {
    description: {
        displayName: 'Telegram Send Message',
        name: 'telegramSendMessage',
        icon: 'fa:telegram',
        group: 'actions',
        version: 2,
        description: 'Sends messages to Telegram bot chats - supports text, images, videos, audio, voice, documents, stickers, locations, contacts, and polls.',
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
                displayName: 'Message Type',
                name: 'messageType',
                type: 'options',
                options: [
                    { name: 'Text Message', value: 'text' },
                    { name: 'Photo/Image', value: 'photo' },
                    { name: 'Video', value: 'video' },
                    { name: 'Audio', value: 'audio' },
                    { name: 'Voice Note', value: 'voice' },
                    { name: 'Document', value: 'document' },
                    { name: 'Animation/GIF', value: 'animation' },
                    { name: 'Sticker', value: 'sticker' },
                    { name: 'Location', value: 'location' },
                    { name: 'Contact', value: 'contact' },
                    { name: 'Poll', value: 'poll' },
                ],
                default: 'text',
                required: true,
                description: 'Type of message to send.',
            },
            
            // TEXT MESSAGE FIELDS
            {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: 'Hello! This is a message from your bot.',
                required: true,
                description: 'The message text to send. Supports template variables and formatting.',
                displayOptions: {
                    show: {
                        messageType: ['text']
                    }
                }
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
                description: 'Message formatting mode (Bold, Italic, Links, etc.)',
                displayOptions: {
                    show: {
                        messageType: ['text']
                    }
                }
            },
            {
                displayName: 'Disable Web Page Preview',
                name: 'disableWebPagePreview',
                type: 'boolean',
                default: false,
                required: false,
                description: 'Disables link previews for links in this message.',
                displayOptions: {
                    show: {
                        messageType: ['text']
                    }
                }
            },
            
            // PHOTO FIELDS
            {
                displayName: 'Photo URL or File ID',
                name: 'photoUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'URL to photo or Telegram file_id. Supports template variables.',
                placeholder: 'https://example.com/image.jpg or BAADBAADrwADBREAAYdaXREkCg',
                displayOptions: {
                    show: {
                        messageType: ['photo']
                    }
                }
            },
            {
                displayName: 'Photo Caption',
                name: 'photoCaption',
                type: 'string',
                typeOptions: {
                    rows: 2,
                },
                default: '',
                required: false,
                description: 'Caption for the photo. Supports template variables and formatting.',
                displayOptions: {
                    show: {
                        messageType: ['photo']
                    }
                }
            },
            
            // VIDEO FIELDS
            {
                displayName: 'Video URL or File ID',
                name: 'videoUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'URL to video or Telegram file_id. Supports template variables.',
                placeholder: 'https://example.com/video.mp4 or BAADBAADrwADBREAAYdaXREkCg',
                displayOptions: {
                    show: {
                        messageType: ['video']
                    }
                }
            },
            {
                displayName: 'Video Caption',
                name: 'videoCaption',
                type: 'string',
                typeOptions: {
                    rows: 2,
                },
                default: '',
                required: false,
                description: 'Caption for the video. Supports template variables and formatting.',
                displayOptions: {
                    show: {
                        messageType: ['video']
                    }
                }
            },
            {
                displayName: 'Video Duration (seconds)',
                name: 'videoDuration',
                type: 'number',
                default: 0,
                required: false,
                description: 'Duration of the video in seconds (optional).',
                displayOptions: {
                    show: {
                        messageType: ['video']
                    }
                }
            },
            
            // AUDIO FIELDS
            {
                displayName: 'Audio URL or File ID',
                name: 'audioUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'URL to audio file or Telegram file_id. Supports template variables.',
                placeholder: 'https://example.com/audio.mp3 or BAADBAADrwADBREAAYdaXREkCg',
                displayOptions: {
                    show: {
                        messageType: ['audio']
                    }
                }
            },
            {
                displayName: 'Audio Title',
                name: 'audioTitle',
                type: 'string',
                default: '',
                required: false,
                description: 'Title of the audio track.',
                displayOptions: {
                    show: {
                        messageType: ['audio']
                    }
                }
            },
            {
                displayName: 'Audio Performer',
                name: 'audioPerformer',
                type: 'string',
                default: '',
                required: false,
                description: 'Performer/Artist of the audio track.',
                displayOptions: {
                    show: {
                        messageType: ['audio']
                    }
                }
            },
            {
                displayName: 'Audio Duration (seconds)',
                name: 'audioDuration',
                type: 'number',
                default: 0,
                required: false,
                description: 'Duration of the audio in seconds (optional).',
                displayOptions: {
                    show: {
                        messageType: ['audio']
                    }
                }
            },
            
            // VOICE FIELDS
            {
                displayName: 'Voice URL or File ID',
                name: 'voiceUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'URL to voice note (.ogg) or Telegram file_id. Supports template variables.',
                placeholder: 'https://example.com/voice.ogg or BAADBAADrwADBREAAYdaXREkCg',
                displayOptions: {
                    show: {
                        messageType: ['voice']
                    }
                }
            },
            {
                displayName: 'Voice Duration (seconds)',
                name: 'voiceDuration',
                type: 'number',
                default: 0,
                required: false,
                description: 'Duration of the voice note in seconds (optional).',
                displayOptions: {
                    show: {
                        messageType: ['voice']
                    }
                }
            },
            
            // DOCUMENT FIELDS
            {
                displayName: 'Document URL or File ID',
                name: 'documentUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'URL to document or Telegram file_id. Supports template variables.',
                placeholder: 'https://example.com/document.pdf or BAADBAADrwADBREAAYdaXREkCg',
                displayOptions: {
                    show: {
                        messageType: ['document']
                    }
                }
            },
            {
                displayName: 'Document Caption',
                name: 'documentCaption',
                type: 'string',
                typeOptions: {
                    rows: 2,
                },
                default: '',
                required: false,
                description: 'Caption for the document. Supports template variables and formatting.',
                displayOptions: {
                    show: {
                        messageType: ['document']
                    }
                }
            },
            
            // ANIMATION FIELDS
            {
                displayName: 'Animation URL or File ID',
                name: 'animationUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'URL to animation/GIF or Telegram file_id. Supports template variables.',
                placeholder: 'https://example.com/animation.gif or BAADBAADrwADBREAAYdaXREkCg',
                displayOptions: {
                    show: {
                        messageType: ['animation']
                    }
                }
            },
            {
                displayName: 'Animation Caption',
                name: 'animationCaption',
                type: 'string',
                typeOptions: {
                    rows: 2,
                },
                default: '',
                required: false,
                description: 'Caption for the animation. Supports template variables and formatting.',
                displayOptions: {
                    show: {
                        messageType: ['animation']
                    }
                }
            },
            
            // STICKER FIELDS
            {
                displayName: 'Sticker File ID',
                name: 'stickerFileId',
                type: 'string',
                default: '',
                required: true,
                description: 'Telegram file_id of the sticker. Supports template variables.',
                placeholder: 'CAADAgADQAADyIsGAAE7MpzFPFQX5QI',
                displayOptions: {
                    show: {
                        messageType: ['sticker']
                    }
                }
            },
            
            // LOCATION FIELDS
            {
                displayName: 'Latitude',
                name: 'latitude',
                type: 'number',
                default: 0,
                required: true,
                description: 'Latitude of the location. Supports template variables.',
                placeholder: '51.5074',
                displayOptions: {
                    show: {
                        messageType: ['location']
                    }
                }
            },
            {
                displayName: 'Longitude',
                name: 'longitude',
                type: 'number',
                default: 0,
                required: true,
                description: 'Longitude of the location. Supports template variables.',
                placeholder: '-0.1278',
                displayOptions: {
                    show: {
                        messageType: ['location']
                    }
                }
            },
            {
                displayName: 'Live Location Period (seconds)',
                name: 'livePeriod',
                type: 'number',
                default: 0,
                required: false,
                description: 'Period in seconds for which the location will be updated (60-86400). Leave 0 for static location.',
                displayOptions: {
                    show: {
                        messageType: ['location']
                    }
                }
            },
            
            // CONTACT FIELDS
            {
                displayName: 'Contact Phone Number',
                name: 'contactPhone',
                type: 'string',
                default: '',
                required: true,
                description: 'Contact phone number. Supports template variables.',
                placeholder: '+1234567890',
                displayOptions: {
                    show: {
                        messageType: ['contact']
                    }
                }
            },
            {
                displayName: 'Contact First Name',
                name: 'contactFirstName',
                type: 'string',
                default: '',
                required: true,
                description: 'Contact first name. Supports template variables.',
                placeholder: 'John',
                displayOptions: {
                    show: {
                        messageType: ['contact']
                    }
                }
            },
            {
                displayName: 'Contact Last Name',
                name: 'contactLastName',
                type: 'string',
                default: '',
                required: false,
                description: 'Contact last name. Supports template variables.',
                placeholder: 'Doe',
                displayOptions: {
                    show: {
                        messageType: ['contact']
                    }
                }
            },
            {
                displayName: 'Contact User ID',
                name: 'contactUserId',
                type: 'number',
                default: 0,
                required: false,
                description: 'Telegram user ID if this is a Telegram user.',
                displayOptions: {
                    show: {
                        messageType: ['contact']
                    }
                }
            },
            
            // POLL FIELDS
            {
                displayName: 'Poll Question',
                name: 'pollQuestion',
                type: 'string',
                default: '',
                required: true,
                description: 'Poll question. Supports template variables.',
                placeholder: 'What is your favorite color?',
                displayOptions: {
                    show: {
                        messageType: ['poll']
                    }
                }
            },
            {
                displayName: 'Poll Options',
                name: 'pollOptions',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: 'Red\nBlue\nGreen\nYellow',
                required: true,
                description: 'Poll options, one per line. Supports template variables.',
                displayOptions: {
                    show: {
                        messageType: ['poll']
                    }
                }
            },
            {
                displayName: 'Poll Type',
                name: 'pollType',
                type: 'options',
                options: [
                    { name: 'Regular Poll', value: 'regular' },
                    { name: 'Quiz', value: 'quiz' },
                ],
                default: 'regular',
                required: false,
                description: 'Type of poll to create.',
                displayOptions: {
                    show: {
                        messageType: ['poll']
                    }
                }
            },
            {
                displayName: 'Anonymous Poll',
                name: 'pollAnonymous',
                type: 'boolean',
                default: true,
                required: false,
                description: 'Whether the poll is anonymous.',
                displayOptions: {
                    show: {
                        messageType: ['poll']
                    }
                }
            },
            {
                displayName: 'Multiple Answers',
                name: 'pollMultipleAnswers',
                type: 'boolean',
                default: false,
                required: false,
                description: 'Whether multiple answers are allowed.',
                displayOptions: {
                    show: {
                        messageType: ['poll']
                    }
                }
            },
            {
                displayName: 'Quiz Correct Answer Index',
                name: 'quizCorrectOption',
                type: 'number',
                default: 0,
                required: false,
                description: 'Index of the correct answer for quiz (0-based). Only for quiz type.',
                displayOptions: {
                    show: {
                        messageType: ['poll'],
                        pollType: ['quiz']
                    }
                }
            },
            
            // COMMON FIELDS
            {
                displayName: 'Disable Notification',
                name: 'disableNotification',
                type: 'boolean',
                default: false,
                required: false,
                description: 'Sends the message silently. Users will receive a notification with no sound.',
            },
            {
                displayName: 'Protect Content',
                name: 'protectContent',
                type: 'boolean',
                default: false,
                required: false,
                description: 'Protects the contents of the sent message from forwarding and saving.',
            },
        ],
    },

    // Execute the Telegram Send Message node
    async execute(nodeConfig, inputData, connectedNodes = []) {
        console.log('=== TELEGRAM SEND MESSAGE (v2) DEBUG ===');
        console.log('Message Type:', nodeConfig.messageType);
        console.log('inputData keys:', inputData ? Object.keys(inputData) : 'null');
        
        // Universal Template Parser - supports multiple template formats
        const parseUniversalTemplate = (inputStr, json) => {
            if (!inputStr || typeof inputStr !== 'string') return inputStr || '';
            
            let result = inputStr;
            
            // Handle {{$json.path}} format
            result = result.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
                try {
                    if (!json) return match;
                    
                    // For workflow chain data, search in steps
                    if (Object.keys(json).some(key => key.startsWith('step_'))) {
                        for (const [stepKey, stepValue] of Object.entries(json)) {
                            if (stepKey.startsWith('step_') && typeof stepValue === 'object') {
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
                                    return String(value || '');
                                }
                            }
                        }
                        return match;
                    } else {
                        // Regular data processing
                        const keys = path.split('.');
                        let value = json;
                        for (const key of keys) {
                            if (value && typeof value === 'object' && key in value) {
                                value = value[key];
                            } else {
                                return match;
                            }
                        }
                        return String(value || '');
                    }
                } catch (error) {
                    console.error('Error parsing template:', error);
                    return match;
                }
            });
            
            // Handle {{nodePrefix.path}} format
            result = result.replace(/\{\{\s*([a-zA-Z_]+)\.(.+?)\s*\}\}/g, (match, nodePrefix, path) => {
                try {
                    let dataSource = null;
                    
                    if (Object.keys(json).some(key => key.startsWith('step_'))) {
                        for (const [stepKey, stepValue] of Object.entries(json)) {
                            if (stepKey.startsWith('step_') && typeof stepValue === 'object') {
                                const stepName = stepKey.replace(/^step_\d+_/, '').toLowerCase().replace(/_/g, '');
                                const prefixName = nodePrefix.toLowerCase().replace(/_/g, '');
                                
                                if (stepName.includes(prefixName) || prefixName.includes(stepName)) {
                                    dataSource = stepValue;
                                    break;
                                }
                            }
                        }
                    } else {
                        if (json[nodePrefix]) {
                            dataSource = json[nodePrefix];
                        } else {
                            dataSource = json;
                        }
                    }
                    
                    if (!dataSource) return match;
                    
                    const keys = path.split('.');
                    let value = dataSource;
                    
                    for (const key of keys) {
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                        } else {
                            return match;
                        }
                    }
                    
                    return String(value || '');
                } catch (error) {
                    console.error('Error parsing nodePrefix template:', error);
                    return match;
                }
            });
            
            return result;
        };

        const { 
            botToken, 
            chatId, 
            messageType = 'text',
            disableNotification = false,
            protectContent = false,
            
            // Text message fields
            messageText,
            parseMode = '',
            disableWebPagePreview = false,
            
            // Media fields  
            photoUrl,
            photoCaption,
            videoUrl,
            videoCaption,
            videoDuration,
            audioUrl,
            audioTitle,
            audioPerformer,
            audioDuration,
            voiceUrl,
            voiceDuration,
            documentUrl,
            documentCaption,
            animationUrl,
            animationCaption,
            stickerFileId,
            
            // Location fields
            latitude,
            longitude,
            livePeriod,
            
            // Contact fields
            contactPhone,
            contactFirstName,
            contactLastName,
            contactUserId,
            
            // Poll fields
            pollQuestion,
            pollOptions,
            pollType = 'regular',
            pollAnonymous = true,
            pollMultipleAnswers = false,
            quizCorrectOption = 0
        } = nodeConfig;
        
        // Validate required fields
        if (!botToken) {
            throw new Error('Bot API Token is required for Telegram Send Message node.');
        }

        if (!chatId) {
            throw new Error('Chat ID is required for Telegram Send Message node.');
        }

        // Process template variables in chatId
        const processedChatId = parseUniversalTemplate(chatId, inputData);
        
        if (!processedChatId.trim()) {
            throw new Error('Processed Chat ID cannot be empty. Check your template variables.');
        }

        // Validate chat ID is numeric
        const numericChatId = processedChatId.trim();
        if (!numericChatId.match(/^-?\d+$/)) {
            throw new Error(`Invalid Chat ID format: "${numericChatId}". Chat ID must be a number.`);
        }

        let telegramApiUrl, requestData;

        // Process different message types
        try {
            switch (messageType) {
                case 'text':
                    const processedText = parseUniversalTemplate(messageText, inputData);
                    if (!processedText.trim()) {
                        throw new Error('Message text cannot be empty.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
                    requestData = {
                        chat_id: numericChatId,
                        text: processedText,
                        disable_web_page_preview: disableWebPagePreview,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (parseMode && parseMode.trim()) {
                        requestData.parse_mode = parseMode;
                    }
                    break;

                case 'photo':
                    const processedPhotoUrl = parseUniversalTemplate(photoUrl, inputData);
                    if (!processedPhotoUrl.trim()) {
                        throw new Error('Photo URL cannot be empty.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
                    requestData = {
                        chat_id: numericChatId,
                        photo: processedPhotoUrl,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (photoCaption && photoCaption.trim()) {
                        requestData.caption = parseUniversalTemplate(photoCaption, inputData);
                        if (parseMode && parseMode.trim()) {
                            requestData.parse_mode = parseMode;
                        }
                    }
                    break;

                case 'video':
                    const processedVideoUrl = parseUniversalTemplate(videoUrl, inputData);
                    if (!processedVideoUrl.trim()) {
                        throw new Error('Video URL cannot be empty.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendVideo`;
                    requestData = {
                        chat_id: numericChatId,
                        video: processedVideoUrl,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (videoCaption && videoCaption.trim()) {
                        requestData.caption = parseUniversalTemplate(videoCaption, inputData);
                        if (parseMode && parseMode.trim()) {
                            requestData.parse_mode = parseMode;
                        }
                    }
                    if (videoDuration > 0) {
                        requestData.duration = videoDuration;
                    }
                    break;

                case 'audio':
                    const processedAudioUrl = parseUniversalTemplate(audioUrl, inputData);
                    if (!processedAudioUrl.trim()) {
                        throw new Error('Audio URL cannot be empty.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendAudio`;
                    requestData = {
                        chat_id: numericChatId,
                        audio: processedAudioUrl,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (audioTitle && audioTitle.trim()) {
                        requestData.title = parseUniversalTemplate(audioTitle, inputData);
                    }
                    if (audioPerformer && audioPerformer.trim()) {
                        requestData.performer = parseUniversalTemplate(audioPerformer, inputData);
                    }
                    if (audioDuration > 0) {
                        requestData.duration = audioDuration;
                    }
                    break;

                case 'voice':
                    const processedVoiceUrl = parseUniversalTemplate(voiceUrl, inputData);
                    if (!processedVoiceUrl.trim()) {
                        throw new Error('Voice URL cannot be empty.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendVoice`;
                    requestData = {
                        chat_id: numericChatId,
                        voice: processedVoiceUrl,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (voiceDuration > 0) {
                        requestData.duration = voiceDuration;
                    }
                    break;

                case 'document':
                    const processedDocumentUrl = parseUniversalTemplate(documentUrl, inputData);
                    if (!processedDocumentUrl.trim()) {
                        throw new Error('Document URL cannot be empty.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
                    requestData = {
                        chat_id: numericChatId,
                        document: processedDocumentUrl,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (documentCaption && documentCaption.trim()) {
                        requestData.caption = parseUniversalTemplate(documentCaption, inputData);
                        if (parseMode && parseMode.trim()) {
                            requestData.parse_mode = parseMode;
                        }
                    }
                    break;

                case 'animation':
                    const processedAnimationUrl = parseUniversalTemplate(animationUrl, inputData);
                    if (!processedAnimationUrl.trim()) {
                        throw new Error('Animation URL cannot be empty.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendAnimation`;
                    requestData = {
                        chat_id: numericChatId,
                        animation: processedAnimationUrl,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (animationCaption && animationCaption.trim()) {
                        requestData.caption = parseUniversalTemplate(animationCaption, inputData);
                        if (parseMode && parseMode.trim()) {
                            requestData.parse_mode = parseMode;
                        }
                    }
                    break;

                case 'sticker':
                    const processedStickerFileId = parseUniversalTemplate(stickerFileId, inputData);
                    if (!processedStickerFileId.trim()) {
                        throw new Error('Sticker File ID cannot be empty.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendSticker`;
                    requestData = {
                        chat_id: numericChatId,
                        sticker: processedStickerFileId,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    break;

                case 'location':
                    const processedLatitude = parseFloat(parseUniversalTemplate(String(latitude), inputData));
                    const processedLongitude = parseFloat(parseUniversalTemplate(String(longitude), inputData));
                    
                    if (isNaN(processedLatitude) || isNaN(processedLongitude)) {
                        throw new Error('Invalid latitude or longitude values.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendLocation`;
                    requestData = {
                        chat_id: numericChatId,
                        latitude: processedLatitude,
                        longitude: processedLongitude,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (livePeriod > 0) {
                        requestData.live_period = Math.max(60, Math.min(86400, livePeriod));
                    }
                    break;

                case 'contact':
                    const processedPhone = parseUniversalTemplate(contactPhone, inputData);
                    const processedFirstName = parseUniversalTemplate(contactFirstName, inputData);
                    
                    if (!processedPhone.trim() || !processedFirstName.trim()) {
                        throw new Error('Contact phone number and first name are required.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendContact`;
                    requestData = {
                        chat_id: numericChatId,
                        phone_number: processedPhone,
                        first_name: processedFirstName,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (contactLastName && contactLastName.trim()) {
                        requestData.last_name = parseUniversalTemplate(contactLastName, inputData);
                    }
                    if (contactUserId > 0) {
                        requestData.user_id = contactUserId;
                    }
                    break;

                case 'poll':
                    const processedQuestion = parseUniversalTemplate(pollQuestion, inputData);
                    const processedOptions = parseUniversalTemplate(pollOptions, inputData);
                    
                    if (!processedQuestion.trim() || !processedOptions.trim()) {
                        throw new Error('Poll question and options are required.');
                    }
                    
                    const optionsArray = processedOptions.split('\n').filter(opt => opt.trim()).map(opt => opt.trim());
                    if (optionsArray.length < 2) {
                        throw new Error('Poll must have at least 2 options.');
                    }
                    if (optionsArray.length > 10) {
                        throw new Error('Poll cannot have more than 10 options.');
                    }
                    
                    telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendPoll`;
                    requestData = {
                        chat_id: numericChatId,
                        question: processedQuestion,
                        options: JSON.stringify(optionsArray),
                        is_anonymous: pollAnonymous,
                        allows_multiple_answers: pollMultipleAnswers,
                        disable_notification: disableNotification,
                        protect_content: protectContent,
                    };
                    if (pollType === 'quiz') {
                        requestData.type = 'quiz';
                        requestData.correct_option_id = Math.max(0, Math.min(optionsArray.length - 1, quizCorrectOption));
                    }
                    break;

                default:
                    throw new Error(`Unsupported message type: ${messageType}`);
            }

            console.log(`Sending ${messageType} message to chat:`, numericChatId);
            console.log('API URL:', telegramApiUrl);
            console.log('Request data:', JSON.stringify(requestData, null, 2));

            const response = await axios.post(telegramApiUrl, requestData);
            
            if (response.data.ok) {
                console.log(`${messageType} message sent successfully:`, response.data.result.message_id);
                
                return {
                    success: true,
                    messageId: response.data.result.message_id,
                    chatId: numericChatId,
                    messageType: messageType,
                    timestamp: new Date().toISOString(),
                    telegramResponse: response.data.result,
                };
            } else {
                throw new Error(`Telegram API error: ${response.data.description || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error(`=== TELEGRAM ${messageType.toUpperCase()} ERROR ===`);
            console.error('Error:', error.message);
            console.error('Request data:', JSON.stringify(requestData, null, 2));
            
            let errorMessage = `Failed to send ${messageType} message`;
            if (error.response && error.response.data && error.response.data.description) {
                errorMessage += `: ${error.response.data.description}`;
                
                // Provide specific guidance for common errors
                const telegramError = error.response.data.description;
                if (telegramError.includes('chat not found')) {
                    errorMessage += ' (Check if the chat ID is correct and the bot has access)';
                } else if (telegramError.includes('Unauthorized')) {
                    errorMessage += ' (Check if the bot token is correct)';
                } else if (telegramError.includes('failed to get HTTP URL content')) {
                    errorMessage += ' (Media URL is not accessible or invalid)';
                } else if (telegramError.includes('file_id')) {
                    errorMessage += ' (Invalid file ID format)';
                }
            } else {
                errorMessage += `: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    },
};

module.exports = telegramSendMessageNode;