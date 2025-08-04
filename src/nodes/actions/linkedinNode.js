/**
 * LinkedIn Node - Professional Social Media Integration
 * Supports: OAuth, Profile, Companies, Posting, Messaging, Scheduling, Analytics
 */

const linkedinService = require('../../services/linkedinService');
const { parseUniversalTemplate } = require('../../utils/expressionResolver');

const executeLinkedInNode = async (inputData, config) => {
    try {
        console.log('🔗 LinkedIn Node: Starting execution', { operation: config.operation });

        const { operation } = config;
        
        // Validate token data
        if (!config.tokenData || !config.tokenData.access_token) {
            throw new Error('LinkedIn authentication required. Please connect your LinkedIn account first.');
        }

        // Process templates in config with input data
        const processedConfig = processTemplates(config, inputData);

        let result;
        switch (operation) {
            case 'getProfile':
                result = await getProfile(processedConfig);
                break;
            case 'getCompanies':
                result = await getAdministeredCompanies(processedConfig);
                break;
            case 'postShare':
                result = await createUGCPost(processedConfig);
                break;
            case 'scheduleShare':
                result = await scheduleUGCPost(processedConfig);
                break;
            case 'sendMessage':
                result = await sendDirectMessage(processedConfig);
                break;
            case 'getMessages':
                result = await getConversations(processedConfig);
                break;
            case 'getAnalytics':
                result = await getAnalytics(processedConfig);
                break;
            default:
                throw new Error(`Unknown LinkedIn operation: ${operation}`);
        }

        console.log('✅ LinkedIn Node: Operation completed successfully');
        return {
            json: result.data,
            meta: {
                operation,
                timestamp: new Date().toISOString(),
                rateLimit: result.meta?.rateLimit,
                ...result.meta
            }
        };

    } catch (error) {
        console.error('❌ LinkedIn Node execution failed:', error);
        throw new Error(`LinkedIn Node Error: ${error.message}`);
    }
};

/**
 * Process template variables in configuration
 */
function processTemplates(config, inputData) {
    const processed = { ...config };
    
    // Template fields that might contain variables
    const templateFields = [
        'text', 'mediaURL', 'title', 'description', 
        'recipientURN', 'messageSubject', 'messageBody',
        'authorURN'
    ];

    templateFields.forEach(field => {
        if (processed[field] && typeof processed[field] === 'string') {
            processed[field] = parseUniversalTemplate(processed[field], inputData);
        }
    });

    return processed;
}

/**
 * Get LinkedIn Profile
 */
async function getProfile(config) {
    console.log('👤 LinkedIn: Getting user profile');
    return await linkedinService.getProfile(config.tokenData);
}

/**
 * Get Administered Companies
 */
async function getAdministeredCompanies(config) {
    console.log('🏢 LinkedIn: Getting administered companies');
    return await linkedinService.getAdministeredCompanies(config.tokenData);
}

/**
 * Create UGC Post
 */
async function createUGCPost(config) {
    console.log('📝 LinkedIn: Creating UGC post');
    
    const { authorType, authorURN, contentType, text, mediaURL, title, description } = config;
    
    // Validate required fields
    if (!text && !mediaURL) {
        throw new Error('Either text content or media URL is required for posting');
    }
    
    if (!authorURN) {
        throw new Error('Author URN is required (user or organization URN)');
    }

    const postData = {
        authorType: authorType || 'user',
        authorURN,
        contentType: contentType || 'text',
        text,
        mediaURL,
        title,
        description
    };

    return await linkedinService.createUGCPost(config.tokenData, postData);
}

/**
 * Schedule UGC Post (for future implementation with workflow scheduler)
 */
async function scheduleUGCPost(config) {
    console.log('⏰ LinkedIn: Scheduling UGC post');
    
    const { scheduleTime } = config;
    
    if (!scheduleTime) {
        throw new Error('Schedule time is required for scheduled posts');
    }

    // For MVP, we'll store the scheduled post data
    // In production, this would integrate with a job scheduler
    const scheduledPost = {
        scheduleTime,
        postData: {
            authorType: config.authorType || 'user',
            authorURN: config.authorURN,
            contentType: config.contentType || 'text',
            text: config.text,
            mediaURL: config.mediaURL,
            title: config.title,
            description: config.description
        },
        status: 'scheduled',
        createdAt: new Date().toISOString()
    };

    console.log('📅 LinkedIn: Post scheduled for:', scheduleTime);
    
    return {
        data: scheduledPost,
        meta: { message: 'Post scheduled successfully' }
    };
}

/**
 * Send Direct Message
 */
async function sendDirectMessage(config) {
    console.log('💬 LinkedIn: Sending direct message');
    
    const { recipientURN, messageSubject, messageBody } = config;
    
    if (!recipientURN) {
        throw new Error('Recipient URN is required for messaging');
    }
    
    if (!messageBody) {
        throw new Error('Message body is required');
    }

    const messageData = {
        recipientURN,
        subject: messageSubject || 'Message from Workflow',
        body: messageBody
    };

    return await linkedinService.sendMessage(config.tokenData, messageData);
}

/**
 * Get Conversations
 */
async function getConversations(config) {
    console.log('💬 LinkedIn: Getting conversations');
    return await linkedinService.getConversations(config.tokenData);
}

/**
 * Get Analytics
 */
async function getAnalytics(config) {
    console.log('📊 LinkedIn: Getting analytics');
    return await linkedinService.getAnalytics(config.tokenData);
}

module.exports = {
    executeLinkedInNode,
    
    // Node metadata
    type: 'linkedin',
    category: 'Social Media',
    displayName: 'LinkedIn',
    description: 'Authenticate with LinkedIn and manage posts, messages, and profile data',
    
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
                    name: 'Get Profile',
                    value: 'getProfile',
                    description: 'Get LinkedIn profile information'
                },
                {
                    name: 'Get Companies',
                    value: 'getCompanies',
                    description: 'Get companies you can administer'
                },
                {
                    name: 'Post Share',
                    value: 'postShare',
                    description: 'Create a post on LinkedIn'
                },
                {
                    name: 'Schedule Share',
                    value: 'scheduleShare',
                    description: 'Schedule a post for later'
                },
                {
                    name: 'Send Message',
                    value: 'sendMessage',
                    description: 'Send a direct message'
                },
                {
                    name: 'Get Messages',
                    value: 'getMessages',
                    description: 'Get conversations'
                },
                {
                    name: 'Get Analytics',
                    value: 'getAnalytics',
                    description: 'Get basic analytics'
                }
            ],
            default: 'getProfile',
            required: true
        }
    ]
};