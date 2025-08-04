/**
 * Instagram Graph API Service
 * Handles Meta Graph API integration for comprehensive Instagram automation
 * Supports media publishing, stories, insights, messaging, and business features
 */

class InstagramService {
    constructor() {
        this.baseURL = 'https://graph.facebook.com/v18.0';
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        this.instagramBusinessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
        this.facebookPageId = process.env.FACEBOOK_PAGE_ID;
        this.appId = process.env.FACEBOOK_APP_ID;
        this.appSecret = process.env.FACEBOOK_APP_SECRET;
        this.webhookVerifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'instagram_verify_token_2025';
    }

    /**
     * Make authenticated API request to Meta Graph API
     */
    async makeAPIRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const requestOptions = {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Instagram API error (${response.status}): ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return {
                data,
                meta: {
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries())
                }
            };
        } catch (error) {
            console.error(`❌ Instagram API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * Get Instagram Business Account info
     */
    async getAccountInfo() {
        console.log('📸 Instagram: Getting account info');
        
        return await this.makeAPIRequest(`/${this.instagramBusinessAccountId}`, {
            method: 'GET',
            params: new URLSearchParams({
                fields: 'id,username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url'
            }).toString().replace('?', '?')
        });
    }

    /**
     * Create media container for single photo/video
     */
    async createMediaContainer(mediaUrl, caption = '', mediaType = 'IMAGE', locationId = null) {
        console.log('📸 Instagram: Creating media container');
        
        const params = {
            image_url: mediaType === 'IMAGE' ? mediaUrl : undefined,
            video_url: mediaType === 'VIDEO' || mediaType === 'REELS' ? mediaUrl : undefined,
            media_type: mediaType,
            caption: caption
        };

        if (locationId) {
            params.location_id = locationId;
        }

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        return await this.makeAPIRequest(`/${this.instagramBusinessAccountId}/media`, {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }

    /**
     * Create carousel media container
     */
    async createCarouselContainer(mediaItems, caption = '') {
        console.log('📸 Instagram: Creating carousel container');
        
        // First create individual media containers
        const childrenIds = [];
        for (const item of mediaItems) {
            const childContainer = await this.createMediaContainer(
                item.mediaUrl, 
                '', // No caption for individual items in carousel
                item.mediaType || 'IMAGE'
            );
            childrenIds.push(childContainer.data.id);
        }

        // Create carousel container
        return await this.makeAPIRequest(`/${this.instagramBusinessAccountId}/media`, {
            method: 'POST',
            body: JSON.stringify({
                media_type: 'CAROUSEL_ALBUM_ITEM',
                children: childrenIds.join(','),
                caption: caption
            })
        });
    }

    /**
     * Publish media container
     */
    async publishMedia(creationId) {
        console.log('📸 Instagram: Publishing media');
        
        return await this.makeAPIRequest(`/${this.instagramBusinessAccountId}/media_publish`, {
            method: 'POST',
            body: JSON.stringify({
                creation_id: creationId
            })
        });
    }

    /**
     * Create and publish single media (photo/video)
     */
    async publishSingleMedia(mediaUrl, caption = '', mediaType = 'IMAGE', locationId = null) {
        console.log('📸 Instagram: Publishing single media');
        
        // Create container
        const container = await this.createMediaContainer(mediaUrl, caption, mediaType, locationId);
        
        // Publish media
        const published = await this.publishMedia(container.data.id);
        
        return {
            data: {
                containerId: container.data.id,
                mediaId: published.data.id,
                mediaType: mediaType,
                caption: caption
            },
            meta: container.meta
        };
    }

    /**
     * Create and publish carousel
     */
    async publishCarousel(mediaItems, caption = '') {
        console.log('📸 Instagram: Publishing carousel');
        
        // Create carousel container
        const container = await this.createCarouselContainer(mediaItems, caption);
        
        // Publish carousel
        const published = await this.publishMedia(container.data.id);
        
        return {
            data: {
                containerId: container.data.id,
                mediaId: published.data.id,
                mediaType: 'CAROUSEL_ALBUM_ITEM',
                caption: caption,
                itemCount: mediaItems.length
            },
            meta: container.meta
        };
    }

    /**
     * Create story
     */
    async createStory(mediaUrl, mediaType = 'IMAGE') {
        console.log('📸 Instagram: Creating story');
        
        const params = {
            media_type: 'STORIES',
            image_url: mediaType === 'IMAGE' ? mediaUrl : undefined,
            video_url: mediaType === 'VIDEO' ? mediaUrl : undefined
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        // Create story container
        const container = await this.makeAPIRequest(`/${this.instagramBusinessAccountId}/media`, {
            method: 'POST',
            body: JSON.stringify(params)
        });

        // Publish story
        const published = await this.publishMedia(container.data.id);
        
        return {
            data: {
                containerId: container.data.id,
                storyId: published.data.id,
                mediaType: mediaType
            },
            meta: container.meta
        };
    }

    /**
     * Get media details
     */
    async getMediaDetails(mediaId) {
        console.log('📸 Instagram: Getting media details');
        
        const fields = 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement)';
        
        return await this.makeAPIRequest(`/${mediaId}?fields=${fields}`, {
            method: 'GET'
        });
    }

    /**
     * Get account media
     */
    async getAccountMedia(limit = 25) {
        console.log('📸 Instagram: Getting account media');
        
        const fields = 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count';
        
        return await this.makeAPIRequest(`/${this.instagramBusinessAccountId}/media`, {
            method: 'GET',
            body: JSON.stringify({
                fields: fields,
                limit: limit
            })
        });
    }

    /**
     * Get media comments
     */
    async getMediaComments(mediaId) {
        console.log('📸 Instagram: Getting media comments');
        
        return await this.makeAPIRequest(`/${mediaId}/comments`, {
            method: 'GET',
            body: JSON.stringify({
                fields: 'id,text,timestamp,username,like_count,replies'
            })
        });
    }

    /**
     * Reply to comment
     */
    async replyToComment(commentId, message) {
        console.log('📸 Instagram: Replying to comment');
        
        return await this.makeAPIRequest(`/${commentId}/replies`, {
            method: 'POST',
            body: JSON.stringify({
                message: message
            })
        });
    }

    /**
     * Delete comment
     */
    async deleteComment(commentId) {
        console.log('📸 Instagram: Deleting comment');
        
        return await this.makeAPIRequest(`/${commentId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Hide/unhide comment
     */
    async hideComment(commentId, hide = true) {
        console.log(`📸 Instagram: ${hide ? 'Hiding' : 'Unhiding'} comment`);
        
        return await this.makeAPIRequest(`/${commentId}`, {
            method: 'POST',
            body: JSON.stringify({
                hide: hide
            })
        });
    }

    /**
     * Get account insights
     */
    async getAccountInsights(metrics, period = 'day', since = null, until = null) {
        console.log('📸 Instagram: Getting account insights');
        
        const params = {
            metric: Array.isArray(metrics) ? metrics.join(',') : metrics,
            period: period
        };

        if (since) params.since = since;
        if (until) params.until = until;

        return await this.makeAPIRequest(`/${this.instagramBusinessAccountId}/insights`, {
            method: 'GET',
            body: JSON.stringify(params)
        });
    }

    /**
     * Get media insights
     */
    async getMediaInsights(mediaId, metrics) {
        console.log('📸 Instagram: Getting media insights');
        
        return await this.makeAPIRequest(`/${mediaId}/insights`, {
            method: 'GET',
            body: JSON.stringify({
                metric: Array.isArray(metrics) ? metrics.join(',') : metrics
            })
        });
    }

    /**
     * Search hashtags
     */
    async searchHashtags(hashtag) {
        console.log('📸 Instagram: Searching hashtags');
        
        return await this.makeAPIRequest('/ig_hashtag_search', {
            method: 'GET',
            body: JSON.stringify({
                user_id: this.instagramBusinessAccountId,
                q: hashtag
            })
        });
    }

    /**
     * Get hashtag info
     */
    async getHashtagInfo(hashtagId) {
        console.log('📸 Instagram: Getting hashtag info');
        
        return await this.makeAPIRequest(`/${hashtagId}`, {
            method: 'GET',
            body: JSON.stringify({
                fields: 'id,name,media_count'
            })
        });
    }

    /**
     * Get hashtag recent media
     */
    async getHashtagRecentMedia(hashtagId, limit = 25) {
        console.log('📸 Instagram: Getting hashtag recent media');
        
        return await this.makeAPIRequest(`/${hashtagId}/recent_media`, {
            method: 'GET',
            body: JSON.stringify({
                user_id: this.instagramBusinessAccountId,
                fields: 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count',
                limit: limit
            })
        });
    }

    /**
     * Get hashtag top media
     */
    async getHashtagTopMedia(hashtagId, limit = 25) {
        console.log('📸 Instagram: Getting hashtag top media');
        
        return await this.makeAPIRequest(`/${hashtagId}/top_media`, {
            method: 'GET',
            body: JSON.stringify({
                user_id: this.instagramBusinessAccountId,
                fields: 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count',
                limit: limit
            })
        });
    }

    /**
     * Update media caption
     */
    async updateMediaCaption(mediaId, newCaption) {
        console.log('📸 Instagram: Updating media caption');
        
        return await this.makeAPIRequest(`/${mediaId}`, {
            method: 'POST',
            body: JSON.stringify({
                caption: newCaption
            })
        });
    }

    /**
     * Delete media
     */
    async deleteMedia(mediaId) {
        console.log('📸 Instagram: Deleting media');
        
        return await this.makeAPIRequest(`/${mediaId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get mentions in media
     */
    async getMentions() {
        console.log('📸 Instagram: Getting mentions');
        
        return await this.makeAPIRequest(`/${this.instagramBusinessAccountId}`, {
            method: 'GET',
            body: JSON.stringify({
                fields: 'mentioned_media.limit(50){id,media_type,media_url,permalink,caption,timestamp,username}'
            })
        });
    }

    /**
     * Get tagged media
     */
    async getTaggedMedia(limit = 25) {
        console.log('📸 Instagram: Getting tagged media');
        
        return await this.makeAPIRequest(`/${this.instagramBusinessAccountId}/tags`, {
            method: 'GET',
            body: JSON.stringify({
                fields: 'id,media_type,media_url,permalink,caption,timestamp,username',
                limit: limit
            })
        });
    }

    /**
     * Send Instagram Direct message
     */
    async sendDirectMessage(recipientId, messageText, mediaId = null) {
        console.log('📸 Instagram: Sending direct message');
        
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: mediaId ? {
                attachment: {
                    type: 'image',
                    payload: {
                        attachment_id: mediaId
                    }
                }
            } : {
                text: messageText
            }
        };

        return await this.makeAPIRequest(`/${this.facebookPageId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    /**
     * Get Instagram Direct messages
     */
    async getDirectMessages() {
        console.log('📸 Instagram: Getting direct messages');
        
        return await this.makeAPIRequest(`/${this.facebookPageId}/conversations`, {
            method: 'GET',
            body: JSON.stringify({
                fields: 'id,updated_time,message_count,unread_count,participants,messages{id,created_time,from,message,attachments}'
            })
        });
    }

    /**
     * Upload media to Facebook for use in Instagram
     */
    async uploadMedia(mediaFile, mediaType) {
        console.log('📸 Instagram: Uploading media file');
        
        const formData = new FormData();
        formData.append('file', mediaFile);
        formData.append('type', mediaType);

        const response = await fetch(`${this.baseURL}/${this.instagramBusinessAccountId}/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Media upload failed: ${JSON.stringify(errorData)}`);
        }

        return await response.json();
    }

    /**
     * Verify webhook token
     */
    verifyWebhookToken(token) {
        return token === this.webhookVerifyToken;
    }

    /**
     * Process Instagram webhook data
     */
    processWebhookData(webhookData) {
        console.log('📸 Instagram: Processing webhook data');
        
        if (!webhookData.entry || !webhookData.entry[0]) {
            return null;
        }

        const entry = webhookData.entry[0];
        const changes = entry.changes;
        
        if (!changes || !changes[0]) {
            return null;
        }

        const change = changes[0];
        const field = change.field;
        const value = change.value;

        // Process different webhook types
        switch (field) {
            case 'comments':
                return {
                    type: 'comment',
                    data: this.processCommentWebhook(value)
                };
            case 'mentions':
                return {
                    type: 'mention',
                    data: this.processMentionWebhook(value)
                };
            case 'messages':
                return {
                    type: 'message',
                    data: this.processMessageWebhook(value)
                };
            default:
                return {
                    type: 'unknown',
                    data: value
                };
        }
    }

    /**
     * Process comment webhook
     */
    processCommentWebhook(value) {
        return {
            commentId: value.id,
            mediaId: value.media_id,
            text: value.text,
            timestamp: value.created_time,
            userId: value.from?.id,
            username: value.from?.username
        };
    }

    /**
     * Process mention webhook
     */
    processMentionWebhook(value) {
        return {
            mentionId: value.id,
            mediaId: value.media_id,
            timestamp: value.created_time,
            userId: value.from?.id,
            username: value.from?.username
        };
    }

    /**
     * Process message webhook
     */
    processMessageWebhook(value) {
        return {
            messageId: value.id,
            senderId: value.from?.id,
            recipientId: value.to?.id,
            timestamp: value.created_time,
            text: value.message?.text,
            attachments: value.message?.attachments || []
        };
    }
}

module.exports = new InstagramService();