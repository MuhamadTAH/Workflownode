/**
 * Instagram Node - Comprehensive Business Social Media Integration
 * Supports: Media Publishing, Stories, Insights, Comments, Direct Messaging, Hashtag Research
 */

const instagramService = require('../../services/instagramService');
const { parseUniversalTemplate } = require('../../utils/expressionResolver');

const executeInstagramNode = async (inputData, config) => {
    try {
        console.log('📸 Instagram Node: Starting execution', { operation: config.operation });

        const { operation } = config;
        
        // Validate Instagram API credentials
        if (!instagramService.accessToken || !instagramService.instagramBusinessAccountId) {
            throw new Error('Instagram API credentials are required. Please configure INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in environment variables.');
        }

        // Process templates in config with input data
        const processedConfig = processTemplates(config, inputData);

        let result;
        switch (operation) {
            case 'publishPhoto':
                result = await publishPhoto(processedConfig);
                break;
            case 'publishVideo':
                result = await publishVideo(processedConfig);
                break;
            case 'publishCarousel':
                result = await publishCarousel(processedConfig);
                break;
            case 'createStory':
                result = await createStory(processedConfig);
                break;
            case 'getAccountInfo':
                result = await getAccountInfo(processedConfig);
                break;
            case 'getMedia':
                result = await getAccountMedia(processedConfig);
                break;
            case 'getMediaDetails':
                result = await getMediaDetails(processedConfig);
                break;
            case 'getMediaComments':
                result = await getMediaComments(processedConfig);
                break;
            case 'replyToComment':
                result = await replyToComment(processedConfig);
                break;
            case 'deleteComment':
                result = await deleteComment(processedConfig);
                break;
            case 'hideComment':
                result = await hideComment(processedConfig);
                break;
            case 'getAccountInsights':
                result = await getAccountInsights(processedConfig);
                break;
            case 'getMediaInsights':
                result = await getMediaInsights(processedConfig);
                break;
            case 'searchHashtags':
                result = await searchHashtags(processedConfig);
                break;
            case 'getHashtagMedia':
                result = await getHashtagMedia(processedConfig);
                break;
            case 'updateCaption':
                result = await updateMediaCaption(processedConfig);
                break;
            case 'deleteMedia':
                result = await deleteMedia(processedConfig);
                break;
            case 'getMentions':
                result = await getMentions(processedConfig);
                break;
            case 'getTaggedMedia':
                result = await getTaggedMedia(processedConfig);
                break;
            case 'sendDirectMessage':
                result = await sendDirectMessage(processedConfig);
                break;
            case 'getDirectMessages':
                result = await getDirectMessages(processedConfig);
                break;
            default:
                throw new Error(`Unknown Instagram operation: ${operation}`);
        }

        console.log('✅ Instagram Node: Operation completed successfully');
        return {
            json: result.data,
            meta: {
                operation,
                timestamp: new Date().toISOString(),
                accountId: instagramService.instagramBusinessAccountId,
                ...result.meta
            }
        };

    } catch (error) {
        console.error('❌ Instagram Node execution failed:', error);
        throw new Error(`Instagram Node Error: ${error.message}`);
    }
};

/**
 * Process template variables in configuration
 */
function processTemplates(config, inputData) {
    const processed = { ...config };
    
    // Template fields that might contain variables
    const templateFields = [
        'mediaUrl', 'caption', 'mediaId', 'commentId', 'message', 
        'recipientId', 'hashtag', 'newCaption', 'locationId',
        'metrics', 'since', 'until', 'limit'
    ];

    templateFields.forEach(field => {
        if (processed[field] && typeof processed[field] === 'string') {
            processed[field] = parseUniversalTemplate(processed[field], inputData);
        }
    });

    // Process complex objects with templates
    if (processed.mediaItems && Array.isArray(processed.mediaItems)) {
        processed.mediaItems = processed.mediaItems.map(item => ({
            ...item,
            mediaUrl: parseUniversalTemplate(item.mediaUrl || '', inputData),
            mediaType: parseUniversalTemplate(item.mediaType || 'IMAGE', inputData)
        }));
    }

    return processed;
}

/**
 * Publish photo to Instagram
 */
async function publishPhoto(config) {
    console.log('📸 Instagram: Publishing photo');
    
    const { mediaUrl, caption = '', locationId } = config;
    
    if (!mediaUrl) {
        throw new Error('Media URL is required for photo publishing');
    }

    return await instagramService.publishSingleMedia(mediaUrl, caption, 'IMAGE', locationId);
}

/**
 * Publish video to Instagram
 */
async function publishVideo(config) {
    console.log('📸 Instagram: Publishing video');
    
    const { mediaUrl, caption = '', mediaType = 'VIDEO', locationId } = config;
    
    if (!mediaUrl) {
        throw new Error('Media URL is required for video publishing');
    }

    return await instagramService.publishSingleMedia(mediaUrl, caption, mediaType, locationId);
}

/**
 * Publish carousel to Instagram
 */
async function publishCarousel(config) {
    console.log('📸 Instagram: Publishing carousel');
    
    const { mediaItems, caption = '' } = config;
    
    if (!mediaItems || !Array.isArray(mediaItems) || mediaItems.length < 2) {
        throw new Error('At least 2 media items are required for carousel');
    }
    
    if (mediaItems.length > 10) {
        throw new Error('Maximum 10 media items allowed in carousel');
    }

    return await instagramService.publishCarousel(mediaItems, caption);
}

/**
 * Create Instagram Story
 */
async function createStory(config) {
    console.log('📸 Instagram: Creating story');
    
    const { mediaUrl, mediaType = 'IMAGE' } = config;
    
    if (!mediaUrl) {
        throw new Error('Media URL is required for story creation');
    }

    return await instagramService.createStory(mediaUrl, mediaType);
}

/**
 * Get Instagram account information
 */
async function getAccountInfo(config) {
    console.log('📸 Instagram: Getting account info');
    return await instagramService.getAccountInfo();
}

/**
 * Get account media
 */
async function getAccountMedia(config) {
    console.log('📸 Instagram: Getting account media');
    
    const { limit = 25 } = config;
    return await instagramService.getAccountMedia(parseInt(limit));
}

/**
 * Get media details
 */
async function getMediaDetails(config) {
    console.log('📸 Instagram: Getting media details');
    
    const { mediaId } = config;
    
    if (!mediaId) {
        throw new Error('Media ID is required');
    }

    return await instagramService.getMediaDetails(mediaId);
}

/**
 * Get media comments
 */
async function getMediaComments(config) {
    console.log('📸 Instagram: Getting media comments');
    
    const { mediaId } = config;
    
    if (!mediaId) {
        throw new Error('Media ID is required');
    }

    return await instagramService.getMediaComments(mediaId);
}

/**
 * Reply to comment
 */
async function replyToComment(config) {
    console.log('📸 Instagram: Replying to comment');
    
    const { commentId, message } = config;
    
    if (!commentId || !message) {
        throw new Error('Comment ID and reply message are required');
    }

    return await instagramService.replyToComment(commentId, message);
}

/**
 * Delete comment
 */
async function deleteComment(config) {
    console.log('📸 Instagram: Deleting comment');
    
    const { commentId } = config;
    
    if (!commentId) {
        throw new Error('Comment ID is required');
    }

    return await instagramService.deleteComment(commentId);
}

/**
 * Hide comment
 */
async function hideComment(config) {
    console.log('📸 Instagram: Hiding/unhiding comment');
    
    const { commentId, hide = true } = config;
    
    if (!commentId) {
        throw new Error('Comment ID is required');
    }

    return await instagramService.hideComment(commentId, hide);
}

/**
 * Get account insights
 */
async function getAccountInsights(config) {
    console.log('📸 Instagram: Getting account insights');
    
    const { metrics, period = 'day', since, until } = config;
    
    if (!metrics) {
        throw new Error('Metrics parameter is required');
    }

    const metricsArray = typeof metrics === 'string' ? metrics.split(',') : metrics;
    return await instagramService.getAccountInsights(metricsArray, period, since, until);
}

/**
 * Get media insights
 */
async function getMediaInsights(config) {
    console.log('📸 Instagram: Getting media insights');
    
    const { mediaId, metrics } = config;
    
    if (!mediaId || !metrics) {
        throw new Error('Media ID and metrics are required');
    }

    const metricsArray = typeof metrics === 'string' ? metrics.split(',') : metrics;
    return await instagramService.getMediaInsights(mediaId, metricsArray);
}

/**
 * Search hashtags
 */
async function searchHashtags(config) {
    console.log('📸 Instagram: Searching hashtags');
    
    const { hashtag } = config;
    
    if (!hashtag) {
        throw new Error('Hashtag query is required');
    }

    return await instagramService.searchHashtags(hashtag);
}

/**
 * Get hashtag media
 */
async function getHashtagMedia(config) {
    console.log('📸 Instagram: Getting hashtag media');
    
    const { hashtagId, mediaType = 'recent', limit = 25 } = config;
    
    if (!hashtagId) {
        throw new Error('Hashtag ID is required');
    }

    if (mediaType === 'top') {
        return await instagramService.getHashtagTopMedia(hashtagId, parseInt(limit));
    } else {
        return await instagramService.getHashtagRecentMedia(hashtagId, parseInt(limit));
    }
}

/**
 * Update media caption
 */
async function updateMediaCaption(config) {
    console.log('📸 Instagram: Updating media caption');
    
    const { mediaId, newCaption } = config;
    
    if (!mediaId || !newCaption) {
        throw new Error('Media ID and new caption are required');
    }

    return await instagramService.updateMediaCaption(mediaId, newCaption);
}

/**
 * Delete media
 */
async function deleteMedia(config) {
    console.log('📸 Instagram: Deleting media');
    
    const { mediaId } = config;
    
    if (!mediaId) {
        throw new Error('Media ID is required');
    }

    return await instagramService.deleteMedia(mediaId);
}

/**
 * Get mentions
 */
async function getMentions(config) {
    console.log('📸 Instagram: Getting mentions');
    return await instagramService.getMentions();
}

/**
 * Get tagged media
 */
async function getTaggedMedia(config) {
    console.log('📸 Instagram: Getting tagged media');
    
    const { limit = 25 } = config;
    return await instagramService.getTaggedMedia(parseInt(limit));
}

/**
 * Send direct message
 */
async function sendDirectMessage(config) {
    console.log('📸 Instagram: Sending direct message');
    
    const { recipientId, messageText, mediaId } = config;
    
    if (!recipientId || (!messageText && !mediaId)) {
        throw new Error('Recipient ID and message text or media ID are required');
    }

    return await instagramService.sendDirectMessage(recipientId, messageText, mediaId);
}

/**
 * Get direct messages
 */
async function getDirectMessages(config) {
    console.log('📸 Instagram: Getting direct messages');
    return await instagramService.getDirectMessages();
}

module.exports = {
    executeInstagramNode,
    
    // Node metadata
    type: 'instagram',
    category: 'Social Media',
    displayName: 'Instagram Business',
    description: 'Publish content, manage interactions, and analyze performance on Instagram',
    
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
                    name: 'Publish Photo',
                    value: 'publishPhoto',
                    description: 'Publish a photo to Instagram feed'
                },
                {
                    name: 'Publish Video',
                    value: 'publishVideo',
                    description: 'Publish a video or Reel to Instagram'
                },
                {
                    name: 'Publish Carousel',
                    value: 'publishCarousel',
                    description: 'Publish multiple photos/videos as carousel'
                },
                {
                    name: 'Create Story',
                    value: 'createStory',
                    description: 'Create an Instagram Story'
                },
                {
                    name: 'Get Account Info',
                    value: 'getAccountInfo',
                    description: 'Get Instagram account information'
                },
                {
                    name: 'Get Media',
                    value: 'getMedia',
                    description: 'Get account media posts'
                },
                {
                    name: 'Get Media Details',
                    value: 'getMediaDetails',
                    description: 'Get details of specific media'
                },
                {
                    name: 'Get Media Comments',
                    value: 'getMediaComments',
                    description: 'Get comments on media'
                },
                {
                    name: 'Reply to Comment',
                    value: 'replyToComment',
                    description: 'Reply to a comment'
                },
                {
                    name: 'Delete Comment',
                    value: 'deleteComment',
                    description: 'Delete a comment'
                },
                {
                    name: 'Hide Comment',
                    value: 'hideComment',
                    description: 'Hide or unhide a comment'
                },
                {
                    name: 'Get Account Insights',
                    value: 'getAccountInsights',
                    description: 'Get account analytics and insights'
                },
                {
                    name: 'Get Media Insights',
                    value: 'getMediaInsights',
                    description: 'Get media analytics and insights'
                },
                {
                    name: 'Search Hashtags',
                    value: 'searchHashtags',
                    description: 'Search for hashtags'
                },
                {
                    name: 'Get Hashtag Media',
                    value: 'getHashtagMedia',
                    description: 'Get media from hashtag'
                },
                {
                    name: 'Update Caption',
                    value: 'updateCaption',
                    description: 'Update media caption'
                },
                {
                    name: 'Delete Media',
                    value: 'deleteMedia',
                    description: 'Delete media post'
                },
                {
                    name: 'Get Mentions',
                    value: 'getMentions',
                    description: 'Get mentions of account'
                },
                {
                    name: 'Get Tagged Media',
                    value: 'getTaggedMedia',
                    description: 'Get media where account is tagged'
                },
                {
                    name: 'Send Direct Message',
                    value: 'sendDirectMessage',
                    description: 'Send Instagram Direct message'
                },
                {
                    name: 'Get Direct Messages',
                    value: 'getDirectMessages',
                    description: 'Get Instagram Direct messages'
                }
            ],
            default: 'publishPhoto',
            required: true
        }
    ]
};