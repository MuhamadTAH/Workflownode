/**
 * Instagram Graph API Routes
 * Handles Meta Graph API integration, webhooks, and Instagram operations
 */

const express = require('express');
const router = express.Router();
const instagramService = require('../../services/instagramService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for videos
    },
    fileFilter: (req, file, cb) => {
        // Allow images and videos
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/x-msvideo'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
    }
});

/**
 * GET /api/instagram/webhook
 * Webhook verification for Instagram
 */
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('📸 Instagram: Webhook verification request', { mode, token });

    if (mode === 'subscribe' && instagramService.verifyWebhookToken(token)) {
        console.log('✅ Instagram: Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Instagram: Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

/**
 * POST /api/instagram/webhook
 * Receive Instagram webhooks (comments, mentions, messages)
 */
router.post('/webhook', (req, res) => {
    try {
        console.log('📸 Instagram: Received webhook data');
        const processedData = instagramService.processWebhookData(req.body);
        
        if (processedData) {
            console.log('✅ Instagram: Processed webhook data:', processedData.type);
            
            // Here you could trigger workflow execution based on Instagram events
            // Example: triggerWorkflow(processedData);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Instagram: Webhook processing error:', error);
        res.status(200).send('OK'); // Still acknowledge to prevent retries
    }
});

/**
 * GET /api/instagram/account-info
 * Get Instagram Business Account information
 */
router.get('/account-info', async (req, res) => {
    try {
        const result = await instagramService.getAccountInfo();
        
        console.log('✅ Instagram: Account info retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Account info retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Get account info error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get account info'
        });
    }
});

/**
 * POST /api/instagram/publish-media
 * Publish single photo/video to Instagram
 */
router.post('/publish-media', async (req, res) => {
    try {
        const { mediaUrl, caption, mediaType = 'IMAGE', locationId } = req.body;
        
        if (!mediaUrl) {
            return res.status(400).json({
                success: false,
                error: 'Media URL is required'
            });
        }

        const result = await instagramService.publishSingleMedia(mediaUrl, caption, mediaType, locationId);
        
        console.log('✅ Instagram: Media published successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Media published successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Publish media error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to publish media'
        });
    }
});

/**
 * POST /api/instagram/publish-carousel
 * Publish carousel post to Instagram
 */
router.post('/publish-carousel', async (req, res) => {
    try {
        const { mediaItems, caption } = req.body;
        
        if (!mediaItems || !Array.isArray(mediaItems) || mediaItems.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 media items are required for carousel'
            });
        }

        const result = await instagramService.publishCarousel(mediaItems, caption);
        
        console.log('✅ Instagram: Carousel published successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Carousel published successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Publish carousel error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to publish carousel'
        });
    }
});

/**
 * POST /api/instagram/create-story
 * Create Instagram Story
 */
router.post('/create-story', async (req, res) => {
    try {
        const { mediaUrl, mediaType = 'IMAGE' } = req.body;
        
        if (!mediaUrl) {
            return res.status(400).json({
                success: false,
                error: 'Media URL is required'
            });
        }

        const result = await instagramService.createStory(mediaUrl, mediaType);
        
        console.log('✅ Instagram: Story created successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Story created successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Create story error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to create story'
        });
    }
});

/**
 * GET /api/instagram/media/:mediaId
 * Get media details
 */
router.get('/media/:mediaId', async (req, res) => {
    try {
        const { mediaId } = req.params;
        const result = await instagramService.getMediaDetails(mediaId);
        
        console.log('✅ Instagram: Media details retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Media details retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Get media details error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get media details'
        });
    }
});

/**
 * GET /api/instagram/media
 * Get account media
 */
router.get('/media', async (req, res) => {
    try {
        const { limit = 25 } = req.query;
        const result = await instagramService.getAccountMedia(parseInt(limit));
        
        console.log('✅ Instagram: Account media retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Account media retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Get account media error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get account media'
        });
    }
});

/**
 * GET /api/instagram/media/:mediaId/comments
 * Get media comments
 */
router.get('/media/:mediaId/comments', async (req, res) => {
    try {
        const { mediaId } = req.params;
        const result = await instagramService.getMediaComments(mediaId);
        
        console.log('✅ Instagram: Media comments retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Media comments retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Get media comments error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get media comments'
        });
    }
});

/**
 * POST /api/instagram/comments/:commentId/reply
 * Reply to comment
 */
router.post('/comments/:commentId/reply', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Reply message is required'
            });
        }

        const result = await instagramService.replyToComment(commentId, message);
        
        console.log('✅ Instagram: Comment reply sent successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Comment reply sent successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Reply to comment error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to reply to comment'
        });
    }
});

/**
 * DELETE /api/instagram/comments/:commentId
 * Delete comment
 */
router.delete('/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const result = await instagramService.deleteComment(commentId);
        
        console.log('✅ Instagram: Comment deleted successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Delete comment error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to delete comment'
        });
    }
});

/**
 * POST /api/instagram/comments/:commentId/hide
 * Hide/unhide comment
 */
router.post('/comments/:commentId/hide', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { hide = true } = req.body;
        
        const result = await instagramService.hideComment(commentId, hide);
        
        console.log(`✅ Instagram: Comment ${hide ? 'hidden' : 'unhidden'} successfully`);
        res.json({
            success: true,
            data: result.data,
            message: `Comment ${hide ? 'hidden' : 'unhidden'} successfully`
        });
    } catch (error) {
        console.error('❌ Instagram: Hide comment error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to hide/unhide comment'
        });
    }
});

/**
 * GET /api/instagram/insights/account
 * Get account insights
 */
router.get('/insights/account', async (req, res) => {
    try {
        const { metrics, period = 'day', since, until } = req.query;
        
        if (!metrics) {
            return res.status(400).json({
                success: false,
                error: 'Metrics parameter is required'
            });
        }

        const result = await instagramService.getAccountInsights(metrics, period, since, until);
        
        console.log('✅ Instagram: Account insights retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Account insights retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Get account insights error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get account insights'
        });
    }
});

/**
 * GET /api/instagram/insights/media/:mediaId
 * Get media insights
 */
router.get('/insights/media/:mediaId', async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { metrics } = req.query;
        
        if (!metrics) {
            return res.status(400).json({
                success: false,
                error: 'Metrics parameter is required'
            });
        }

        const result = await instagramService.getMediaInsights(mediaId, metrics);
        
        console.log('✅ Instagram: Media insights retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Media insights retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Get media insights error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get media insights'
        });
    }
});

/**
 * GET /api/instagram/hashtags/search
 * Search hashtags
 */
router.get('/hashtags/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Hashtag query is required'
            });
        }

        const result = await instagramService.searchHashtags(q);
        
        console.log('✅ Instagram: Hashtag search completed successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Hashtag search completed successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Hashtag search error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to search hashtags'
        });
    }
});

/**
 * POST /api/instagram/upload-media
 * Upload media to Instagram
 */
router.post('/upload-media', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Media file is required'
            });
        }

        const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
        const result = await instagramService.uploadMedia(req.file, mediaType);
        
        console.log('✅ Instagram: Media uploaded successfully');
        res.json({
            success: true,
            data: result,
            message: 'Media uploaded successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Media upload error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to upload media'
        });
    }
});

/**
 * POST /api/instagram/send-message
 * Send Instagram Direct message
 */
router.post('/send-message', async (req, res) => {
    try {
        const { recipientId, messageText, mediaId } = req.body;
        
        if (!recipientId || (!messageText && !mediaId)) {
            return res.status(400).json({
                success: false,
                error: 'Recipient ID and message text or media ID are required'
            });
        }

        const result = await instagramService.sendDirectMessage(recipientId, messageText, mediaId);
        
        console.log('✅ Instagram: Direct message sent successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Direct message sent successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Send direct message error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to send direct message'
        });
    }
});

/**
 * GET /api/instagram/messages
 * Get Instagram Direct messages
 */
router.get('/messages', async (req, res) => {
    try {
        const result = await instagramService.getDirectMessages();
        
        console.log('✅ Instagram: Direct messages retrieved successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Direct messages retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Get direct messages error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to get direct messages'
        });
    }
});

/**
 * POST /api/instagram/verify-setup
 * Verify Instagram API setup
 */
router.post('/verify-setup', async (req, res) => {
    try {
        // Test API connectivity by getting account info
        const result = await instagramService.getAccountInfo();
        
        console.log('✅ Instagram: Setup verification successful');
        res.json({
            success: true,
            data: {
                verified: true,
                accountInfo: result.data
            },
            message: 'Instagram API setup verified successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Setup verification failed:', error);
        res.status(400).json({
            success: false,
            verified: false,
            error: error.message,
            message: 'Instagram API setup verification failed'
        });
    }
});

/**
 * PUT /api/instagram/media/:mediaId/caption
 * Update media caption
 */
router.put('/media/:mediaId/caption', async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { caption } = req.body;
        
        if (!caption) {
            return res.status(400).json({
                success: false,
                error: 'New caption is required'
            });
        }

        const result = await instagramService.updateMediaCaption(mediaId, caption);
        
        console.log('✅ Instagram: Media caption updated successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Media caption updated successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Update media caption error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to update media caption'
        });
    }
});

/**
 * DELETE /api/instagram/media/:mediaId
 * Delete media
 */
router.delete('/media/:mediaId', async (req, res) => {
    try {
        const { mediaId } = req.params;
        const result = await instagramService.deleteMedia(mediaId);
        
        console.log('✅ Instagram: Media deleted successfully');
        res.json({
            success: true,
            data: result.data,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        console.error('❌ Instagram: Delete media error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to delete media'
        });
    }
});

module.exports = router;