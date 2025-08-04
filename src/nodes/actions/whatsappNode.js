/**
 * WhatsApp Node - Comprehensive Business Messaging Integration
 * Supports: Text, Media, Templates, Interactive Messages, Contacts, Location, Business Profile
 */

const whatsappService = require('../../services/whatsappService');
const { parseUniversalTemplate } = require('../../utils/expressionResolver');

const executeWhatsAppNode = async (inputData, config) => {
    try {
        console.log('📱 WhatsApp Node: Starting execution', { operation: config.operation });

        const { operation } = config;
        
        // Validate WhatsApp API credentials
        if (!whatsappService.accessToken || !whatsappService.phoneNumberId) {
            throw new Error('WhatsApp Business API credentials are required. Please configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables.');
        }

        // Process templates in config with input data
        const processedConfig = processTemplates(config, inputData);

        let result;
        switch (operation) {
            case 'sendText':
                result = await sendTextMessage(processedConfig);
                break;
            case 'sendImage':
                result = await sendImageMessage(processedConfig);
                break;
            case 'sendVideo':
                result = await sendVideoMessage(processedConfig);
                break;
            case 'sendDocument':
                result = await sendDocumentMessage(processedConfig);
                break;
            case 'sendAudio':
                result = await sendAudioMessage(processedConfig);
                break;
            case 'sendTemplate':
                result = await sendTemplateMessage(processedConfig);
                break;
            case 'sendButtons':
                result = await sendButtonMessage(processedConfig);
                break;
            case 'sendList':
                result = await sendListMessage(processedConfig);
                break;
            case 'sendLocation':
                result = await sendLocationMessage(processedConfig);
                break;
            case 'sendContact':
                result = await sendContactMessage(processedConfig);
                break;
            case 'getContact':
                result = await getContactInfo(processedConfig);
                break;
            case 'getBusinessProfile':
                result = await getBusinessProfile(processedConfig);
                break;
            case 'updateBusinessProfile':
                result = await updateBusinessProfile(processedConfig);
                break;
            case 'getTemplates':
                result = await getMessageTemplates(processedConfig);
                break;
            case 'markRead':
                result = await markMessageAsRead(processedConfig);
                break;
            case 'uploadMedia':
                result = await uploadMedia(processedConfig);
                break;
            case 'downloadMedia':
                result = await downloadMedia(processedConfig);
                break;
            default:
                throw new Error(`Unknown WhatsApp operation: ${operation}`);
        }

        console.log('✅ WhatsApp Node: Operation completed successfully');
        return {
            json: result.data,
            meta: {
                operation,
                timestamp: new Date().toISOString(),
                phoneNumberId: whatsappService.phoneNumberId,
                ...result.meta
            }
        };

    } catch (error) {
        console.error('❌ WhatsApp Node execution failed:', error);
        throw new Error(`WhatsApp Node Error: ${error.message}`);
    }
};

/**
 * Process template variables in configuration
 */
function processTemplates(config, inputData) {
    const processed = { ...config };
    
    // Template fields that might contain variables
    const templateFields = [
        'to', 'text', 'caption', 'mediaUrl', 'filename',
        'templateName', 'bodyText', 'headerText', 'footerText',
        'buttonText', 'latitude', 'longitude', 'locationName',
        'locationAddress', 'messageId', 'phoneNumber'
    ];

    templateFields.forEach(field => {
        if (processed[field] && typeof processed[field] === 'string') {
            processed[field] = parseUniversalTemplate(processed[field], inputData);
        }
    });

    // Process complex objects with templates
    if (processed.buttons && Array.isArray(processed.buttons)) {
        processed.buttons = processed.buttons.map(button => ({
            ...button,
            title: parseUniversalTemplate(button.title || '', inputData),
            id: parseUniversalTemplate(button.id || '', inputData)
        }));
    }

    if (processed.sections && Array.isArray(processed.sections)) {
        processed.sections = processed.sections.map(section => ({
            ...section,
            title: parseUniversalTemplate(section.title || '', inputData),
            rows: section.rows ? section.rows.map(row => ({
                ...row,
                title: parseUniversalTemplate(row.title || '', inputData),
                description: parseUniversalTemplate(row.description || '', inputData),
                id: parseUniversalTemplate(row.id || '', inputData)
            })) : []
        }));
    }

    return processed;
}

/**
 * Send text message
 */
async function sendTextMessage(config) {
    console.log('📱 WhatsApp: Sending text message');
    
    const { to, text, previewUrl = false } = config;
    
    if (!to || !text) {
        throw new Error('Phone number and text message are required');
    }

    return await whatsappService.sendTextMessage(to, text, { preview_url: previewUrl });
}

/**
 * Send image message
 */
async function sendImageMessage(config) {
    console.log('📱 WhatsApp: Sending image message');
    
    const { to, mediaUrl, mediaId, caption = '' } = config;
    
    if (!to) {
        throw new Error('Phone number is required');
    }
    
    if (!mediaUrl && !mediaId) {
        throw new Error('Either media URL or media ID is required');
    }

    const imageData = mediaId ? { id: mediaId } : { link: mediaUrl };
    return await whatsappService.sendMediaMessage(to, 'image', imageData, { caption });
}

/**
 * Send video message
 */
async function sendVideoMessage(config) {
    console.log('📱 WhatsApp: Sending video message');
    
    const { to, mediaUrl, mediaId, caption = '' } = config;
    
    if (!to) {
        throw new Error('Phone number is required');
    }
    
    if (!mediaUrl && !mediaId) {
        throw new Error('Either media URL or media ID is required');
    }

    const videoData = mediaId ? { id: mediaId } : { link: mediaUrl };
    return await whatsappService.sendMediaMessage(to, 'video', videoData, { caption });
}

/**
 * Send document message
 */
async function sendDocumentMessage(config) {
    console.log('📱 WhatsApp: Sending document message');
    
    const { to, mediaUrl, mediaId, filename, caption = '' } = config;
    
    if (!to) {
        throw new Error('Phone number is required');
    }
    
    if (!mediaUrl && !mediaId) {
        throw new Error('Either media URL or media ID is required');
    }

    const documentData = mediaId ? { id: mediaId } : { link: mediaUrl };
    if (filename) {
        documentData.filename = filename;
    }

    return await whatsappService.sendMediaMessage(to, 'document', documentData, { caption });
}

/**
 * Send audio message
 */
async function sendAudioMessage(config) {
    console.log('📱 WhatsApp: Sending audio message');
    
    const { to, mediaUrl, mediaId } = config;
    
    if (!to) {
        throw new Error('Phone number is required');
    }
    
    if (!mediaUrl && !mediaId) {
        throw new Error('Either media URL or media ID is required');
    }

    const audioData = mediaId ? { id: mediaId } : { link: mediaUrl };
    return await whatsappService.sendMediaMessage(to, 'audio', audioData);
}

/**
 * Send template message
 */
async function sendTemplateMessage(config) {
    console.log('📱 WhatsApp: Sending template message');
    
    const { to, templateName, languageCode = 'en', components = [] } = config;
    
    if (!to || !templateName) {
        throw new Error('Phone number and template name are required');
    }

    return await whatsappService.sendTemplateMessage(to, templateName, languageCode, components);
}

/**
 * Send button message
 */
async function sendButtonMessage(config) {
    console.log('📱 WhatsApp: Sending button message');
    
    const { to, bodyText, buttons = [], headerText = '', footerText = '' } = config;
    
    if (!to || !bodyText) {
        throw new Error('Phone number and body text are required');
    }
    
    if (!buttons.length) {
        throw new Error('At least one button is required');
    }
    
    if (buttons.length > 3) {
        throw new Error('Maximum 3 buttons allowed');
    }

    return await whatsappService.sendButtonMessage(to, bodyText, buttons, headerText, footerText);
}

/**
 * Send list message
 */
async function sendListMessage(config) {
    console.log('📱 WhatsApp: Sending list message');
    
    const { to, bodyText, buttonText, sections = [], headerText = '', footerText = '' } = config;
    
    if (!to || !bodyText || !buttonText) {
        throw new Error('Phone number, body text, and button text are required');
    }
    
    if (!sections.length) {
        throw new Error('At least one section is required');
    }

    return await whatsappService.sendListMessage(to, bodyText, buttonText, sections, headerText, footerText);
}

/**
 * Send location message
 */
async function sendLocationMessage(config) {
    console.log('📱 WhatsApp: Sending location message');
    
    const { to, latitude, longitude, locationName = '', locationAddress = '' } = config;
    
    if (!to || !latitude || !longitude) {
        throw new Error('Phone number, latitude, and longitude are required');
    }

    return await whatsappService.sendLocationMessage(to, latitude, longitude, locationName, locationAddress);
}

/**
 * Send contact message
 */
async function sendContactMessage(config) {
    console.log('📱 WhatsApp: Sending contact message');
    
    const { to, contacts = [] } = config;
    
    if (!to) {
        throw new Error('Phone number is required');
    }
    
    if (!contacts.length) {
        throw new Error('At least one contact is required');
    }

    return await whatsappService.sendContactMessage(to, contacts);
}

/**
 * Get contact information
 */
async function getContactInfo(config) {
    console.log('📱 WhatsApp: Getting contact info');
    
    const { phoneNumber } = config;
    
    if (!phoneNumber) {
        throw new Error('Phone number is required');
    }

    return await whatsappService.getContact(phoneNumber);
}

/**
 * Get business profile
 */
async function getBusinessProfile(config) {
    console.log('📱 WhatsApp: Getting business profile');
    return await whatsappService.getBusinessProfile();
}

/**
 * Update business profile
 */
async function updateBusinessProfile(config) {
    console.log('📱 WhatsApp: Updating business profile');
    
    const { profileData } = config;
    
    if (!profileData) {
        throw new Error('Profile data is required');
    }

    return await whatsappService.updateBusinessProfile(profileData);
}

/**
 * Get message templates
 */
async function getMessageTemplates(config) {
    console.log('📱 WhatsApp: Getting message templates');
    return await whatsappService.getMessageTemplates();
}

/**
 * Mark message as read
 */
async function markMessageAsRead(config) {
    console.log('📱 WhatsApp: Marking message as read');
    
    const { messageId } = config;
    
    if (!messageId) {
        throw new Error('Message ID is required');
    }

    return await whatsappService.markMessageAsRead(messageId);
}

/**
 * Upload media (placeholder - requires multipart handling)
 */
async function uploadMedia(config) {
    console.log('📱 WhatsApp: Upload media operation');
    
    return {
        data: {
            message: 'Media upload requires multipart form data. Use the API endpoint directly.',
            endpoint: '/api/whatsapp/upload-media'
        },
        meta: {}
    };
}

/**
 * Download media
 */
async function downloadMedia(config) {
    console.log('📱 WhatsApp: Downloading media');
    
    const { mediaId } = config;
    
    if (!mediaId) {
        throw new Error('Media ID is required');
    }

    return await whatsappService.downloadMedia(mediaId);
}

module.exports = {
    executeWhatsAppNode,
    
    // Node metadata
    type: 'whatsapp',
    category: 'Social Media',
    displayName: 'WhatsApp Business',
    description: 'Send messages, media, templates, and manage WhatsApp Business interactions',
    
    // Input/Output schema
    inputs: {
        main: {
            displayName: 'Main',
            type: 'main'
        }
    },
    
    outputs: {
        main: {
            displayName: 'Main',
            type: 'main'
        }
    },
    
    // Node properties/configuration
    properties: [
        {
            displayName: 'Operation',
            name: 'operation',
            type: 'options',
            options: [
                {
                    name: 'Send Text Message',
                    value: 'sendText',
                    description: 'Send a text message'
                },
                {
                    name: 'Send Image',
                    value: 'sendImage',
                    description: 'Send an image with optional caption'
                },
                {
                    name: 'Send Video',
                    value: 'sendVideo',
                    description: 'Send a video with optional caption'
                },
                {
                    name: 'Send Document',
                    value: 'sendDocument',
                    description: 'Send a document file'
                },
                {
                    name: 'Send Audio',
                    value: 'sendAudio',
                    description: 'Send an audio message'
                },
                {
                    name: 'Send Template',
                    value: 'sendTemplate',
                    description: 'Send a pre-approved template message'
                },
                {
                    name: 'Send Button Message',
                    value: 'sendButtons',
                    description: 'Send interactive message with buttons'
                },
                {
                    name: 'Send List Message',
                    value: 'sendList',
                    description: 'Send interactive list message'
                },
                {
                    name: 'Send Location',
                    value: 'sendLocation',
                    description: 'Send location coordinates'
                },
                {
                    name: 'Send Contact',
                    value: 'sendContact',
                    description: 'Send contact information'
                },
                {
                    name: 'Get Contact Info',
                    value: 'getContact',
                    description: 'Get contact information'
                },
                {
                    name: 'Get Business Profile',
                    value: 'getBusinessProfile',
                    description: 'Get business profile info'
                },
                {
                    name: 'Update Business Profile',
                    value: 'updateBusinessProfile',
                    description: 'Update business profile'
                },
                {
                    name: 'Get Templates',
                    value: 'getTemplates',
                    description: 'Get available message templates'
                },
                {
                    name: 'Mark as Read',
                    value: 'markRead',
                    description: 'Mark message as read'
                },
                {
                    name: 'Upload Media',
                    value: 'uploadMedia',
                    description: 'Upload media to WhatsApp servers'
                },
                {
                    name: 'Download Media',
                    value: 'downloadMedia',
                    description: 'Download media from WhatsApp servers'
                }
            ],
            default: 'sendText',
            required: true
        }
    ]
};