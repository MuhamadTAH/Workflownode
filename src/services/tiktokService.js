/**
 * TikTok Business API Service
 * Handles TikTok API integration for comprehensive content automation
 * Supports video publishing, analytics, creator info, and business features
 */

class TikTokService {
    constructor() {
        this.baseURL = 'https://open.tiktokapis.com/v2';
        this.authURL = 'https://www.tiktok.com/v2/auth/authorize';
        this.accessToken = process.env.TIKTOK_ACCESS_TOKEN;
        this.clientKey = process.env.TIKTOK_CLIENT_KEY;
        this.clientSecret = process.env.TIKTOK_CLIENT_SECRET;
        this.redirectUri = process.env.TIKTOK_REDIRECT_URI;
        this.webhookVerifyToken = process.env.TIKTOK_WEBHOOK_VERIFY_TOKEN || 'tiktok_verify_token_2025';
    }

    /**
     * Make authenticated API request to TikTok API
     */
    async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const requestOptions = {
            method,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            requestOptions.body = JSON.stringify(data);
        }

        try {
            console.log(`🎵 TikTok API Request: ${method} ${url}`);
            const response = await fetch(url, requestOptions);
            const result = await response.json();

            if (!response.ok) {
                console.error('TikTok API Error:', result);
                throw new Error(`TikTok API Error: ${result.error?.message || result.message || 'Unknown error'}`);
            }

            return result;
        } catch (error) {
            console.error('TikTok Service Error:', error.message);
            throw error;
        }
    }

    // ===== OAUTH2 AUTHENTICATION =====

    /**
     * Generate OAuth2 authorization URL
     */
    generateAuthUrl(scopes = ['user.info.basic', 'video.upload', 'video.publish']) {
        const state = Math.random().toString(36).substring(2, 15);
        const params = new URLSearchParams({
            client_key: this.clientKey,
            scope: scopes.join(','),
            response_type: 'code',
            redirect_uri: this.redirectUri,
            state: state
        });

        return {
            authUrl: `${this.authURL}?${params.toString()}`,
            state: state
        };
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code) {
        const tokenUrl = `${this.baseURL}/oauth/token/`;
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(`TikTok Token Exchange Error: ${result.error_description || result.message}`);
        }

        return result;
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        const tokenUrl = `${this.baseURL}/oauth/token/`;
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        return await response.json();
    }

    // ===== USER & CREATOR INFO =====

    /**
     * Get user info
     */
    async getUserInfo() {
        return await this.makeRequest('/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count');
    }

    /**
     * Query creator info (required before posting)
     */
    async getCreatorInfo() {
        return await this.makeRequest('/post/publish/creator_info/query/');
    }

    // ===== VIDEO OPERATIONS =====

    /**
     * Initialize video upload
     */
    async initializeVideoUpload(videoData) {
        const endpoint = '/post/publish/inbox/video/init/';
        
        const payload = {
            post_info: {
                title: videoData.title || '',
                description: videoData.description || '',
                privacy_level: videoData.privacyLevel || 'MUTUAL_FOLLOW_FRIENDS',
                disable_duet: videoData.disableDuet || false,
                disable_comment: videoData.disableComment || false,
                disable_stitch: videoData.disableStitch || false,
                video_cover_timestamp_ms: videoData.coverTimestamp || 1000
            },
            source_info: {
                source: videoData.source || 'FILE_UPLOAD',
                video_size: videoData.videoSize,
                chunk_size: videoData.chunkSize || 10485760, // 10MB default
                total_chunk_count: Math.ceil(videoData.videoSize / (videoData.chunkSize || 10485760))
            }
        };

        return await this.makeRequest(endpoint, 'POST', payload);
    }

    /**
     * Upload video chunk
     */
    async uploadVideoChunk(publishId, chunkData, chunkNumber) {
        const endpoint = `/post/publish/inbox/video/upload/?publish_id=${publishId}`;
        
        // For chunk upload, we need to send binary data
        const formData = new FormData();
        formData.append('chunk_number', chunkNumber.toString());
        formData.append('chunk_data', chunkData);

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: formData
        });

        return await response.json();
    }

    /**
     * Direct post video (URL-based upload)
     */
    async directPostVideo(videoData) {
        const endpoint = '/post/publish/video/init/';
        
        const payload = {
            post_info: {
                title: videoData.title || '',
                description: videoData.description || '',
                privacy_level: videoData.privacyLevel || 'PUBLIC_TO_EVERYONE',
                disable_duet: videoData.disableDuet || false,
                disable_comment: videoData.disableComment || false,
                disable_stitch: videoData.disableStitch || false,
                video_cover_timestamp_ms: videoData.coverTimestamp || 1000
            },
            source_info: {
                source: 'PULL_FROM_URL',
                video_url: videoData.videoUrl
            }
        };

        return await this.makeRequest(endpoint, 'POST', payload);
    }

    /**
     * Get post status
     */
    async getPostStatus(publishId) {
        const endpoint = `/post/publish/status/fetch/?publish_id=${publishId}`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Query user videos
     */
    async getUserVideos(maxCount = 10, cursor = null) {
        let endpoint = `/video/query/?fields=id,title,video_description,like_count,comment_count,share_count,view_count,create_time,cover_image_url,embed_html,embed_link,duration&max_count=${maxCount}`;
        
        if (cursor) {
            endpoint += `&cursor=${cursor}`;
        }

        return await this.makeRequest(endpoint);
    }

    // ===== PHOTO OPERATIONS =====

    /**
     * Initialize photo upload
     */
    async initializePhotoUpload(photoData) {
        const endpoint = '/post/publish/content/init/';
        
        const payload = {
            post_info: {
                title: photoData.title || '',
                description: photoData.description || '',
                privacy_level: photoData.privacyLevel || 'PUBLIC_TO_EVERYONE',
                disable_comment: photoData.disableComment || false
            },
            source_info: {
                source: photoData.source || 'PULL_FROM_URL',
                photo_images: photoData.photoUrls || [],
                photo_cover_index: photoData.coverIndex || 0
            }
        };

        return await this.makeRequest(endpoint, 'POST', payload);
    }

    // ===== ANALYTICS & INSIGHTS =====

    /**
     * Get video analytics
     */
    async getVideoAnalytics(videoIds, fields = ['like_count', 'comment_count', 'share_count', 'view_count']) {
        const endpoint = `/research/video/query/?video_ids=${videoIds.join(',')}&fields=${fields.join(',')}`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Get user analytics
     */
    async getUserAnalytics(fields = ['follower_count', 'following_count', 'likes_count', 'video_count']) {
        const endpoint = `/research/user/info/?fields=${fields.join(',')}`;
        return await this.makeRequest(endpoint);
    }

    // ===== HASHTAG & SEARCH =====

    /**
     * Get hashtag suggestions
     */
    async getHashtagSuggestions(keywords, count = 10) {
        const endpoint = `/research/hashtag/suggest/?keywords=${encodeURIComponent(keywords)}&count=${count}`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Search videos by hashtag
     */
    async searchVideosByHashtag(hashtag, count = 10, cursor = null) {
        let endpoint = `/research/video/hashtag/query/?hashtag_name=${encodeURIComponent(hashtag)}&count=${count}`;
        
        if (cursor) {
            endpoint += `&cursor=${cursor}`;
        }

        return await this.makeRequest(endpoint);
    }

    // ===== COMMENTS =====

    /**
     * Get video comments
     */
    async getVideoComments(videoId, count = 10, cursor = null) {
        let endpoint = `/video/comment/list/?video_id=${videoId}&count=${count}`;
        
        if (cursor) {
            endpoint += `&cursor=${cursor}`;
        }

        return await this.makeRequest(endpoint);
    }

    /**
     * Reply to comment
     */
    async replyToComment(videoId, commentId, text) {
        const endpoint = '/video/comment/reply/';
        
        const payload = {
            video_id: videoId,
            comment_id: commentId,
            text: text
        };

        return await this.makeRequest(endpoint, 'POST', payload);
    }

    // ===== WEBHOOK VERIFICATION =====

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(body, signature, timestamp) {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', this.clientSecret);
        hmac.update(timestamp + body);
        const expectedSignature = hmac.digest('hex');
        
        return signature === expectedSignature;
    }

    /**
     * Handle webhook challenge
     */
    handleWebhookChallenge(challenge, verifyToken) {
        if (verifyToken === this.webhookVerifyToken) {
            return challenge;
        }
        throw new Error('Invalid webhook verification token');
    }

    // ===== BUSINESS FEATURES =====

    /**
     * Get business account info
     */
    async getBusinessAccountInfo() {
        return await this.makeRequest('/business/account/info/');
    }

    /**
     * Get available privacy levels
     */
    getPrivacyLevels() {
        return [
            { value: 'PUBLIC_TO_EVERYONE', label: 'Public to Everyone' },
            { value: 'MUTUAL_FOLLOW_FRIENDS', label: 'Friends Only' },
            { value: 'FOLLOWER_OF_CREATOR', label: 'Followers Only' },
            { value: 'SELF_ONLY', label: 'Private (Only Me)' }
        ];
    }

    /**
     * Get supported video formats
     */
    getSupportedFormats() {
        return {
            video: ['mp4', 'mov', 'webm'],
            photo: ['jpg', 'jpeg', 'png', 'webp'],
            maxVideoSize: 287457280, // 274MB
            maxPhotoSize: 52428800,  // 50MB
            minDuration: 3000,       // 3 seconds
            maxDuration: 600000,     // 10 minutes
            aspectRatios: ['9:16', '1:1', '16:9']
        };
    }
}

module.exports = new TikTokService();