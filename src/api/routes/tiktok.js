/**
 * TikTok Business API Routes
 * Handles TikTok API integration, webhooks, and content operations
 */

const express = require('express');
const router = express.Router();
const tiktokService = require('../../services/tiktokService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    limits: {
        fileSize: 300 * 1024 * 1024 // 300MB limit for TikTok videos
    },
    fileFilter: (req, file, cb) => {
        // Allow videos and images for TikTok
        const allowedTypes = [
            'video/mp4', 'video/quicktime', 'video/webm',
            'image/jpeg', 'image/png', 'image/webp'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. TikTok supports MP4, MOV, WebM videos and JPEG, PNG, WebP images.'), false);
        }
    }
});

// ===== OAUTH2 AUTHENTICATION ROUTES =====

/**
 * Generate TikTok OAuth2 authorization URL
 */
router.get('/auth-url', (req, res) => {
    try {
        const { scopes } = req.query;
        const scopeArray = scopes ? scopes.split(',') : ['user.info.basic', 'video.upload', 'video.publish'];
        
        const authData = tiktokService.generateAuthUrl(scopeArray);
        
        res.json({
            success: true,
            authUrl: authData.authUrl,
            state: authData.state,
            scopes: scopeArray
        });
    } catch (error) {
        console.error('TikTok Auth URL Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Exchange authorization code for access token
 */
router.post('/exchange-token', async (req, res) => {
    try {
        const { code, state } = req.body;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code is required'
            });
        }
        
        const tokenData = await tiktokService.exchangeCodeForToken(code);
        
        res.json({
            success: true,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
            scope: tokenData.scope,
            openId: tokenData.open_id
        });
    } catch (error) {
        console.error('TikTok Token Exchange Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Refresh access token
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
        }
        
        const tokenData = await tiktokService.refreshToken(refreshToken);
        
        res.json({
            success: true,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in
        });
    } catch (error) {
        console.error('TikTok Token Refresh Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Verify TikTok API setup
 */
router.post('/verify-setup', async (req, res) => {
    try {
        // Test API connection with user info
        const userInfo = await tiktokService.getUserInfo();
        
        res.json({
            success: true,
            message: 'TikTok API connection verified successfully',
            userInfo: userInfo
        });
    } catch (error) {
        console.error('TikTok Setup Verification Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== VIDEO OPERATIONS =====

/**
 * Initialize video upload
 */
router.post('/video/init', upload.single('video'), async (req, res) => {
    try {
        const videoData = {
            title: req.body.title,
            description: req.body.description,
            privacyLevel: req.body.privacyLevel,
            disableDuet: req.body.disableDuet === 'true',
            disableComment: req.body.disableComment === 'true',
            disableStitch: req.body.disableStitch === 'true',
            coverTimestamp: parseInt(req.body.coverTimestamp) || 1000,
            videoSize: req.file ? req.file.size : parseInt(req.body.videoSize),
            chunkSize: parseInt(req.body.chunkSize) || 10485760
        };
        
        const result = await tiktokService.initializeVideoUpload(videoData);
        
        res.json({
            success: true,
            publishId: result.publish_id,
            uploadUrl: result.upload_url,
            data: result
        });
    } catch (error) {
        console.error('TikTok Video Init Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Direct post video from URL
 */
router.post('/video/post-url', async (req, res) => {
    try {
        const videoData = {
            title: req.body.title,
            description: req.body.description,
            videoUrl: req.body.videoUrl,
            privacyLevel: req.body.privacyLevel,
            disableDuet: req.body.disableDuet === 'true',
            disableComment: req.body.disableComment === 'true',
            disableStitch: req.body.disableStitch === 'true',
            coverTimestamp: parseInt(req.body.coverTimestamp) || 1000
        };
        
        const result = await tiktokService.directPostVideo(videoData);
        
        res.json({
            success: true,
            publishId: result.publish_id,
            data: result
        });
    } catch (error) {
        console.error('TikTok Video Post Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get post status
 */
router.get('/post/status/:publishId', async (req, res) => {
    try {
        const { publishId } = req.params;
        const result = await tiktokService.getPostStatus(publishId);
        
        res.json({
            success: true,
            status: result.status,
            data: result
        });
    } catch (error) {
        console.error('TikTok Post Status Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get user videos
 */
router.get('/videos', async (req, res) => {
    try {
        const { maxCount = 10, cursor } = req.query;
        const result = await tiktokService.getUserVideos(parseInt(maxCount), cursor);
        
        res.json({
            success: true,
            videos: result.data?.videos || [],
            hasMore: result.data?.has_more || false,
            cursor: result.data?.cursor,
            data: result
        });
    } catch (error) {
        console.error('TikTok Get Videos Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== PHOTO OPERATIONS =====

/**
 * Initialize photo post
 */
router.post('/photo/init', upload.array('photos', 35), async (req, res) => {
    try {
        const photoData = {
            title: req.body.title,
            description: req.body.description,
            photoUrls: req.body.photoUrls ? req.body.photoUrls.split(',') : [],
            coverIndex: parseInt(req.body.coverIndex) || 0,
            privacyLevel: req.body.privacyLevel,
            disableComment: req.body.disableComment === 'true'
        };
        
        const result = await tiktokService.initializePhotoUpload(photoData);
        
        res.json({
            success: true,
            publishId: result.publish_id,
            data: result
        });
    } catch (error) {
        console.error('TikTok Photo Init Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== USER & CREATOR INFO =====

/**
 * Get user info
 */
router.get('/user/info', async (req, res) => {
    try {
        const result = await tiktokService.getUserInfo();
        
        res.json({
            success: true,
            userInfo: result.data?.user || result,
            data: result
        });
    } catch (error) {
        console.error('TikTok User Info Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get creator info
 */
router.get('/creator/info', async (req, res) => {
    try {
        const result = await tiktokService.getCreatorInfo();
        
        res.json({
            success: true,
            creatorInfo: result.data?.creator_info || result,
            data: result
        });
    } catch (error) {
        console.error('TikTok Creator Info Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== ANALYTICS =====

/**
 * Get video analytics
 */
router.post('/analytics/videos', async (req, res) => {
    try {
        const { videoIds, fields } = req.body;
        const result = await tiktokService.getVideoAnalytics(videoIds, fields);
        
        res.json({
            success: true,
            analytics: result.data?.videos || result,
            data: result
        });
    } catch (error) {
        console.error('TikTok Video Analytics Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get user analytics
 */
router.post('/analytics/user', async (req, res) => {
    try {
        const { fields } = req.body;
        const result = await tiktokService.getUserAnalytics(fields);
        
        res.json({
            success: true,
            analytics: result.data?.user || result,
            data: result
        });
    } catch (error) {
        console.error('TikTok User Analytics Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== HASHTAG & SEARCH =====

/**
 * Get hashtag suggestions
 */
router.get('/hashtags/suggest', async (req, res) => {
    try {
        const { keywords, count = 10 } = req.query;
        const result = await tiktokService.getHashtagSuggestions(keywords, parseInt(count));
        
        res.json({
            success: true,
            hashtags: result.data?.hashtags || result,
            data: result
        });
    } catch (error) {
        console.error('TikTok Hashtag Suggestions Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Search videos by hashtag
 */
router.get('/search/hashtag/:hashtag', async (req, res) => {
    try {
        const { hashtag } = req.params;
        const { count = 10, cursor } = req.query;
        const result = await tiktokService.searchVideosByHashtag(hashtag, parseInt(count), cursor);
        
        res.json({
            success: true,
            videos: result.data?.videos || result,
            hasMore: result.data?.has_more || false,
            cursor: result.data?.cursor,
            data: result
        });
    } catch (error) {
        console.error('TikTok Hashtag Search Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== COMMENTS =====

/**
 * Get video comments
 */
router.get('/video/:videoId/comments', async (req, res) => {
    try {
        const { videoId } = req.params;
        const { count = 10, cursor } = req.query;
        const result = await tiktokService.getVideoComments(videoId, parseInt(count), cursor);
        
        res.json({
            success: true,
            comments: result.data?.comments || result,
            hasMore: result.data?.has_more || false,
            cursor: result.data?.cursor,
            data: result
        });
    } catch (error) {
        console.error('TikTok Comments Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Reply to comment
 */
router.post('/video/:videoId/comments/:commentId/reply', async (req, res) => {
    try {
        const { videoId, commentId } = req.params;
        const { text } = req.body;
        
        const result = await tiktokService.replyToComment(videoId, commentId, text);
        
        res.json({
            success: true,
            reply: result.data?.comment || result,
            data: result
        });
    } catch (error) {
        console.error('TikTok Comment Reply Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== BUSINESS FEATURES =====

/**
 * Get business account info
 */
router.get('/business/account', async (req, res) => {
    try {
        const result = await tiktokService.getBusinessAccountInfo();
        
        res.json({
            success: true,
            accountInfo: result.data?.account || result,
            data: result
        });
    } catch (error) {
        console.error('TikTok Business Account Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== WEBHOOK HANDLING =====

/**
 * Handle TikTok webhooks
 */
router.post('/webhook', (req, res) => {
    try {
        const signature = req.headers['x-tiktok-signature'];
        const timestamp = req.headers['x-timestamp'];
        const body = JSON.stringify(req.body);
        
        // Verify webhook signature
        if (!tiktokService.verifyWebhookSignature(body, signature, timestamp)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid webhook signature'
            });
        }
        
        console.log('📱 TikTok Webhook received:', req.body);
        
        // Process webhook data
        const webhookData = req.body;
        
        // Handle different webhook events
        if (webhookData.event === 'video.publish') {
            console.log('🎬 Video published:', webhookData.data);
        } else if (webhookData.event === 'comment.create') {
            console.log('💬 New comment:', webhookData.data);
        }
        
        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });
    } catch (error) {
        console.error('TikTok Webhook Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Verify webhook challenge
 */
router.get('/webhook', (req, res) => {
    try {
        const { challenge, verify_token } = req.query;
        
        const response = tiktokService.handleWebhookChallenge(challenge, verify_token);
        
        res.send(response);
    } catch (error) {
        console.error('TikTok Webhook Challenge Error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// ===== UTILITY ENDPOINTS =====

/**
 * Get supported formats and limits
 */
router.get('/formats', (req, res) => {
    try {
        const formats = tiktokService.getSupportedFormats();
        
        res.json({
            success: true,
            formats: formats
        });
    } catch (error) {
        console.error('TikTok Formats Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get privacy levels
 */
router.get('/privacy-levels', (req, res) => {
    try {
        const privacyLevels = tiktokService.getPrivacyLevels();
        
        res.json({
            success: true,
            privacyLevels: privacyLevels
        });
    } catch (error) {
        console.error('TikTok Privacy Levels Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;