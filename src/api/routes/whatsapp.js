/**
 * WhatsApp Business API Routes
 * Handles Meta Graph API integration, webhooks, and messaging operations
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../../services/whatsappService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    limits: {
        fileSize: 16 * 1024 * 1024 // 16MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images, videos, documents, and audio
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp',
            'video/mp4', 'video/3gpp',
            'audio/aac', 'audio/amr', 'audio/mpeg', 'audio/mp4', 'audio/ogg',
            'application/pdf', 'application/vnd.ms-powerpoint', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
    }
});

/**
 * GET /api/whatsapp/webhook
 * Webhook verification for WhatsApp Business API
 */
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('📱 WhatsApp: Webhook verification request', { mode, token });

    if (mode === 'subscribe' && whatsappService.verifyWebhookToken(token)) {
        console.log('✅ WhatsApp: Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.log('❌ WhatsApp: Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

/**
 * POST /api/whatsapp/webhook
 * Receive incoming messages and status updates
 */
router.post('/webhook', (req, res) => {
    try {
        console.log('📱 WhatsApp: Received webhook data');
        const processedData = whatsappService.processWebhookData(req.body);
        
        if (processedData) {
            console.log('✅ WhatsApp: Processed webhook data:', processedData.type);
            
            // Here you could trigger workflow execution based on incoming messages
            // For now, we'll just log and acknowledge
            
            // Store or forward the processed data as needed
            // Example: triggerWorkflow(processedData);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ WhatsApp: Webhook processing error:', error);
        res.status(200).send('OK'); // Still acknowledge to prevent retries
    }
});

/**
 * POST /api/whatsapp/send-text
 * Send text message
 */
router.post('/send-text', async (req, res) => {
    try {
        const { to, text, preview_url = false } = req.body;
        
        if (!to || !text) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and text are required'
            });
        }

        const result = await whatsappService.sendTextMessage(to, text, { preview_url });
        
        console.log('✅ WhatsApp: Text message sent successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Text message sent successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Send text message error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to send text message'
        });
    }
});

/**
 * POST /api/whatsapp/send-media
 * Send media message (image, video, document, audio)
 */
router.post('/send-media', async (req, res) => {
    try {
        const { to, mediaType, mediaUrl, mediaId, caption, filename } = req.body;
        
        if (!to || !mediaType) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and media type are required'
            });
        }

        let result;
        const mediaData = mediaId ? { id: mediaId } : { link: mediaUrl };
        
        if (mediaType === 'document' && filename) {
            mediaData.filename = filename;
        }

        result = await whatsappService.sendMediaMessage(to, mediaType, mediaData, { caption });
        
        console.log(`✅ WhatsApp: ${mediaType} message sent successfully`);
        res.json({
            success: true,
            data: result.data,
            message: `${mediaType} message sent successfully`
        });
    } catch (error) {
        console.error(`❌ WhatsApp: Send ${req.body.mediaType} message error:`, error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: `Failed to send ${req.body.mediaType} message`
        });
    }
});

/**
 * POST /api/whatsapp/send-template
 * Send template message
 */
router.post('/send-template', async (req, res) => {
    try {
        const { to, templateName, languageCode = 'en', components = [] } = req.body;
        
        if (!to || !templateName) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and template name are required'
            });
        }

        const result = await whatsappService.sendTemplateMessage(to, templateName, languageCode, components);
        
        console.log('✅ WhatsApp: Template message sent successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Template message sent successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Send template message error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to send template message'
        });
    }
});

/**
 * POST /api/whatsapp/send-interactive
 * Send interactive message (buttons or list)
 */
router.post('/send-interactive', async (req, res) => {
    try {
        const { to, type, bodyText, headerText, footerText, buttons, buttonText, sections } = req.body;
        
        if (!to || !type || !bodyText) {
            return res.status(400).json({
                success: false,
                error: 'Phone number, type, and body text are required'
            });
        }

        let result;
        if (type === 'button') {
            if (!buttons || !Array.isArray(buttons)) {
                return res.status(400).json({
                    success: false,
                    error: 'Buttons array is required for button messages'
                });
            }
            result = await whatsappService.sendButtonMessage(to, bodyText, buttons, headerText, footerText);
        } else if (type === 'list') {
            if (!sections || !Array.isArray(sections) || !buttonText) {
                return res.status(400).json({
                    success: false,
                    error: 'Sections array and button text are required for list messages'
                });
            }
            result = await whatsappService.sendListMessage(to, bodyText, buttonText, sections, headerText, footerText);
        } else {
            return res.status(400).json({
                success: false,
                error: 'Interactive type must be "button" or "list"'
            });
        }
        
        console.log(`✅ WhatsApp: Interactive ${type} message sent successfully`);
        res.json({
            success: true,
            data: result.data,
            message: `Interactive ${type} message sent successfully`
        });
    } catch (error) {
        console.error('❌ WhatsApp: Send interactive message error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to send interactive message'
        });
    }
});

/**
 * POST /api/whatsapp/send-location
 * Send location message
 */
router.post('/send-location', async (req, res) => {
    try {
        const { to, latitude, longitude, name = '', address = '' } = req.body;
        
        if (!to || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Phone number, latitude, and longitude are required'
            });
        }

        const result = await whatsappService.sendLocationMessage(to, latitude, longitude, name, address);
        
        console.log('✅ WhatsApp: Location message sent successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Location message sent successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Send location message error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to send location message'
        });
    }
});

/**
 * POST /api/whatsapp/send-contact
 * Send contact message
 */
router.post('/send-contact', async (req, res) => {
    try {
        const { to, contacts } = req.body;
        
        if (!to || !contacts || !Array.isArray(contacts)) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and contacts array are required'
            });
        }

        const result = await whatsappService.sendContactMessage(to, contacts);
        
        console.log('✅ WhatsApp: Contact message sent successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Contact message sent successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Send contact message error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to send contact message'
        });
    }
});

/**
 * POST /api/whatsapp/upload-media
 * Upload media to WhatsApp servers
 */
router.post('/upload-media', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Media file is required'
            });
        }

        const mediaType = req.body.type || req.file.mimetype.split('/')[0];
        const result = await whatsappService.uploadMedia(req.file, mediaType);
        
        console.log('✅ WhatsApp: Media uploaded successfully');
        res.json({
            success: true,
            data: result,
            message: 'Media uploaded successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Media upload error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to upload media'
        });
    }
});

/**
 * GET /api/whatsapp/download-media/:mediaId
 * Download media from WhatsApp servers
 */
router.get('/download-media/:mediaId', async (req, res) => {
    try {
        const { mediaId } = req.params;
        const result = await whatsappService.downloadMedia(mediaId);
        
        res.set('Content-Type', result.contentType);
        res.send(Buffer.from(result.data));
    } catch (error) {
        console.error('❌ WhatsApp: Media download error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to download media'
        });
    }
});

/**
 * POST /api/whatsapp/get-contact
 * Get contact information
 */
router.post('/get-contact', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        const result = await whatsappService.getContact(phoneNumber);
        
        console.log('✅ WhatsApp: Contact info retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Contact info retrieved successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Get contact error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get contact info'
        });
    }
});

/**
 * GET /api/whatsapp/business-profile
 * Get business profile
 */
router.get('/business-profile', async (req, res) => {
    try {
        const result = await whatsappService.getBusinessProfile();
        
        console.log('✅ WhatsApp: Business profile retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Business profile retrieved successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Get business profile error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get business profile'
        });
    }
});

/**
 * POST /api/whatsapp/update-business-profile
 * Update business profile
 */
router.post('/update-business-profile', async (req, res) => {
    try {
        const profileData = req.body;
        const result = await whatsappService.updateBusinessProfile(profileData);
        
        console.log('✅ WhatsApp: Business profile updated successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Business profile updated successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Update business profile error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to update business profile'
        });
    }
});

/**
 * POST /api/whatsapp/mark-read
 * Mark message as read
 */
router.post('/mark-read', async (req, res) => {
    try {
        const { messageId } = req.body;
        
        if (!messageId) {
            return res.status(400).json({
                success: false,
                error: 'Message ID is required'
            });
        }

        const result = await whatsappService.markMessageAsRead(messageId);
        
        console.log('✅ WhatsApp: Message marked as read successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Message marked as read successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Mark message as read error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to mark message as read'
        });
    }
});

/**
 * GET /api/whatsapp/templates
 * Get message templates
 */
router.get('/templates', async (req, res) => {
    try {
        const result = await whatsappService.getMessageTemplates();
        
        console.log('✅ WhatsApp: Message templates retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Message templates retrieved successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Get message templates error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get message templates'
        });
    }
});

/**
 * GET /api/whatsapp/phone-info
 * Get phone number information
 */
router.get('/phone-info', async (req, res) => {
    try {
        const result = await whatsappService.getPhoneNumberInfo();
        
        console.log('✅ WhatsApp: Phone number info retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Phone number info retrieved successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Get phone number info error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get phone number info'
        });
    }
});

/**
 * POST /api/whatsapp/verify-setup
 * Verify WhatsApp Business API setup
 */
router.post('/verify-setup', async (req, res) => {
    try {
        // Test API connectivity by getting phone number info
        const result = await whatsappService.getPhoneNumberInfo();
        
        console.log('✅ WhatsApp: Setup verification successful');
        res.json({
            success: true,
            data: {
                verified: true,
                phoneInfo: result.data
            },
            message: 'WhatsApp Business API setup verified successfully'
        });
    } catch (error) {
        console.error('❌ WhatsApp: Setup verification failed:', error);
        res.status(400).json({
            success: false,
            verified: false,
            error: error.message,
            message: 'WhatsApp Business API setup verification failed'
        });
    }
});

module.exports = router;