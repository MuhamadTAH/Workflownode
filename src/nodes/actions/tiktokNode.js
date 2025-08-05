/**
 * TikTok Node - Comprehensive Business Social Media Integration
 * Supports: Video Publishing, Analytics, Creator Info, Comments, Hashtag Research
 */

const tiktokService = require('../../services/tiktokService');
const { parseUniversalTemplate } = require('../../utils/expressionResolver');

const executeTikTokNode = async (inputData, config) => {
    try {
        console.log('🎵 TikTok Node: Starting execution', { operation: config.operation });

        const { operation } = config;
        
        // Validate TikTok API credentials
        if (!tiktokService.accessToken || !tiktokService.clientKey) {
            throw new Error('TikTok API credentials are required. Please configure TIKTOK_ACCESS_TOKEN and TIKTOK_CLIENT_KEY in environment variables.');
        }

        // Process templates in config with input data
        const processedConfig = processTemplates(config, inputData);

        let result;
        switch (operation) {
            case 'publishVideo':
                result = await publishVideo(processedConfig);
                break;
            case 'publishPhotoPost':
                result = await publishPhotoPost(processedConfig);
                break;
            case 'getUserInfo':
                result = await getUserInfo(processedConfig);
                break;
            case 'getCreatorInfo':
                result = await getCreatorInfo(processedConfig);
                break;
            case 'getUserVideos':
                result = await getUserVideos(processedConfig);
                break;
            case 'getVideoAnalytics':
                result = await getVideoAnalytics(processedConfig);
                break;
            case 'getUserAnalytics':
                result = await getUserAnalytics(processedConfig);
                break;
            case 'getHashtagSuggestions':
                result = await getHashtagSuggestions(processedConfig);
                break;
            case 'searchVideosByHashtag':
                result = await searchVideosByHashtag(processedConfig);
                break;
            case 'getVideoComments':
                result = await getVideoComments(processedConfig);
                break;
            case 'replyToComment':
                result = await replyToComment(processedConfig);
                break;
            case 'getPostStatus':
                result = await getPostStatus(processedConfig);
                break;
            case 'getBusinessAccountInfo':
                result = await getBusinessAccountInfo(processedConfig);
                break;
            default:
                throw new Error(`Unsupported TikTok operation: ${operation}`);
        }

        console.log('✅ TikTok Node: Operation completed successfully');
        return {
            success: true,
            operation: operation,
            data: result,
            timestamp: new Date().toISOString(),
            processedConfig: processedConfig
        };

    } catch (error) {
        console.error('❌ TikTok Node Error:', error.message);
        return {
            success: false,
            error: error.message,
            operation: config.operation,
            timestamp: new Date().toISOString()
        };
    }
};

// ===== VIDEO OPERATIONS =====

async function publishVideo(config) {
    console.log('🎬 Publishing TikTok video...');
    
    if (config.uploadMethod === 'url') {
        // Direct post from URL
        const videoData = {
            title: config.title,
            description: config.description,
            videoUrl: config.videoUrl,
            privacyLevel: config.privacyLevel || 'PUBLIC_TO_EVERYONE',
            disableDuet: config.disableDuet || false,
            disableComment: config.disableComment || false,
            disableStitch: config.disableStitch || false,
            coverTimestamp: config.coverTimestamp || 1000
        };
        
        return await tiktokService.directPostVideo(videoData);
    } else {
        // File upload (initialize upload process)
        const videoData = {
            title: config.title,
            description: config.description,
            videoSize: config.videoSize,
            chunkSize: config.chunkSize,
            privacyLevel: config.privacyLevel || 'PUBLIC_TO_EVERYONE',
            disableDuet: config.disableDuet || false,
            disableComment: config.disableComment || false,
            disableStitch: config.disableStitch || false,
            coverTimestamp: config.coverTimestamp || 1000
        };
        
        return await tiktokService.initializeVideoUpload(videoData);
    }
}

async function publishPhotoPost(config) {
    console.log('📸 Publishing TikTok photo post...');
    
    const photoData = {
        title: config.title,
        description: config.description,
        photoUrls: config.photoUrls ? config.photoUrls.split(',').map(url => url.trim()) : [],
        coverIndex: config.coverIndex || 0,
        privacyLevel: config.privacyLevel || 'PUBLIC_TO_EVERYONE',
        disableComment: config.disableComment || false
    };
    
    return await tiktokService.initializePhotoUpload(photoData);
}

async function getPostStatus(config) {
    console.log('📊 Getting TikTok post status...');
    return await tiktokService.getPostStatus(config.publishId);
}

// ===== USER & CREATOR INFO =====

async function getUserInfo(config) {
    console.log('👤 Getting TikTok user info...');
    return await tiktokService.getUserInfo();
}

async function getCreatorInfo(config) {
    console.log('🎭 Getting TikTok creator info...');
    return await tiktokService.getCreatorInfo();
}

async function getUserVideos(config) {
    console.log('🎥 Getting user videos...');
    return await tiktokService.getUserVideos(
        config.maxCount || 10,
        config.cursor || null
    );
}

// ===== ANALYTICS =====

async function getVideoAnalytics(config) {
    console.log('📈 Getting TikTok video analytics...');
    
    const videoIds = config.videoIds ? config.videoIds.split(',').map(id => id.trim()) : [];
    const fields = config.fields ? config.fields.split(',').map(field => field.trim()) : 
                   ['like_count', 'comment_count', 'share_count', 'view_count'];
    
    return await tiktokService.getVideoAnalytics(videoIds, fields);
}

async function getUserAnalytics(config) {
    console.log('📊 Getting TikTok user analytics...');
    
    const fields = config.fields ? config.fields.split(',').map(field => field.trim()) : 
                   ['follower_count', 'following_count', 'likes_count', 'video_count'];
    
    return await tiktokService.getUserAnalytics(fields);
}

// ===== HASHTAG & SEARCH =====

async function getHashtagSuggestions(config) {
    console.log('🏷️ Getting hashtag suggestions...');
    return await tiktokService.getHashtagSuggestions(
        config.keywords,
        config.count || 10
    );
}

async function searchVideosByHashtag(config) {
    console.log('🔍 Searching videos by hashtag...');
    return await tiktokService.searchVideosByHashtag(
        config.hashtag,
        config.count || 10,
        config.cursor || null
    );
}

// ===== COMMENTS =====

async function getVideoComments(config) {
    console.log('💬 Getting video comments...');
    return await tiktokService.getVideoComments(
        config.videoId,
        config.count || 10,
        config.cursor || null
    );
}

async function replyToComment(config) {
    console.log('💭 Replying to comment...');
    return await tiktokService.replyToComment(
        config.videoId,
        config.commentId,
        config.replyText
    );
}

// ===== BUSINESS FEATURES =====

async function getBusinessAccountInfo(config) {
    console.log('🏢 Getting business account info...');
    return await tiktokService.getBusinessAccountInfo();
}

// ===== TEMPLATE PROCESSING =====

function processTemplates(config, inputData) {
    const processedConfig = { ...config };
    
    // Process all string fields that might contain templates
    const templateFields = [
        'title', 'description', 'videoUrl', 'photoUrls', 'keywords', 
        'hashtag', 'videoId', 'commentId', 'replyText', 'videoIds', 'fields'
    ];
    
    templateFields.forEach(field => {
        if (processedConfig[field] && typeof processedConfig[field] === 'string') {
            processedConfig[field] = parseUniversalTemplate(processedConfig[field], inputData);
        }
    });
    
    // Process numeric fields
    const numericFields = ['maxCount', 'count', 'coverIndex', 'coverTimestamp', 'videoSize', 'chunkSize'];
    numericFields.forEach(field => {
        if (processedConfig[field] && typeof processedConfig[field] === 'string') {
            const processed = parseUniversalTemplate(processedConfig[field], inputData);
            const numValue = parseInt(processed);
            if (!isNaN(numValue)) {
                processedConfig[field] = numValue;
            }
        }
    });
    
    return processedConfig;
}

module.exports = {
    executeTikTokNode
};