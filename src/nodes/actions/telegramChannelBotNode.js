/*
=================================================================
BACKEND FILE: src/nodes/actions/telegramChannelBotNode.js
=================================================================
Telegram Channel Management Bot for WorkflowNode
Handles channel posting, scheduling, subscriber notifications, and analytics.
*/

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const channelBotDb = require('../../services/channelBotDatabase');
const channelBotScheduler = require('../../services/channelBotScheduler');

const telegramChannelBotNode = {
    description: {
        displayName: 'Telegram Channel Bot',
        name: 'telegramChannelBot',
        icon: 'fa:broadcast-tower',
        group: 'actions',
        version: 1,
        description: 'Complete Telegram channel management bot with posting, scheduling, notifications, and analytics.',
        defaults: {
            name: 'Telegram Channel Bot',
        },
        properties: [
            // Bot Configuration
            {
                displayName: 'Bot Token',
                name: 'botToken',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Telegram Bot API token from @BotFather. Supports template variables.',
                placeholder: '1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ',
            },
            {
                displayName: 'Channel ID/Username',
                name: 'channelId',
                type: 'string',
                default: '',
                required: true,
                description: 'Channel ID (with @) or numeric ID. Bot must be admin of the channel.',
                placeholder: '@your_channel or -1001234567890',
            },
            
            // Command Type
            {
                displayName: 'Bot Command',
                name: 'command',
                type: 'options',
                options: [
                    { name: 'Post to Channel', value: 'post' },
                    { name: 'Schedule Post', value: 'schedule' },
                    { name: 'Edit Post', value: 'edit' },
                    { name: 'Delete Post', value: 'delete' },
                    { name: 'Get Channel Stats', value: 'stats' },
                    { name: 'Notify Subscribers', value: 'notify' },
                    { name: 'Manage Subscribers', value: 'subscribers' },
                    { name: 'Process Scheduled Posts', value: 'process_queue' },
                ],
                default: 'post',
                required: true,
                description: 'The bot command to execute.',
            },

            // Post Content (for post/schedule commands)
            {
                displayName: 'Message Type',
                name: 'messageType',
                type: 'options',
                options: [
                    { name: 'Text Message', value: 'text' },
                    { name: 'Photo', value: 'photo' },
                    { name: 'Video', value: 'video' },
                    { name: 'Document', value: 'document' },
                    { name: 'Poll', value: 'poll' },
                    { name: 'Media Group', value: 'media_group' },
                ],
                default: 'text',
                required: false,
                description: 'Type of message to send to the channel.',
                displayOptions: {
                    show: {
                        command: ['post', 'schedule']
                    }
                }
            },
            {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: '',
                required: false,
                description: 'Text content of the message. Supports Markdown and template variables.',
                placeholder: 'Your channel message here...',
                displayOptions: {
                    show: {
                        command: ['post', 'schedule', 'notify']
                    }
                }
            },
            {
                displayName: 'Media URL/File ID',
                name: 'mediaUrl',
                type: 'string',
                default: '',
                required: false,
                description: 'URL or Telegram file_id for media content. Supports template variables.',
                placeholder: 'https://example.com/image.jpg or BAADBAADBgADBREAAR4BAAFXvv0lAg',
                displayOptions: {
                    show: {
                        messageType: ['photo', 'video', 'document'],
                        command: ['post', 'schedule']
                    }
                }
            },

            // Scheduling Options
            {
                displayName: 'Schedule DateTime',
                name: 'scheduleTime',
                type: 'string',
                default: '',
                required: false,
                description: 'When to send the message (ISO format: 2024-12-31T15:30:00Z). Supports template variables.',
                placeholder: '2024-12-31T15:30:00Z',
                displayOptions: {
                    show: {
                        command: ['schedule']
                    }
                }
            },
            {
                displayName: 'Time Zone',
                name: 'timeZone',
                type: 'string',
                default: 'UTC',
                required: false,
                description: 'Time zone for scheduling (e.g., America/New_York, Europe/London)',
                displayOptions: {
                    show: {
                        command: ['schedule']
                    }
                }
            },

            // Edit/Delete Options
            {
                displayName: 'Message ID',
                name: 'messageId',
                type: 'string',
                default: '',
                required: false,
                description: 'ID of the message to edit or delete. Supports template variables.',
                placeholder: '123',
                displayOptions: {
                    show: {
                        command: ['edit', 'delete']
                    }
                }
            },

            // Poll Options
            {
                displayName: 'Poll Question',
                name: 'pollQuestion',
                type: 'string',
                default: '',
                required: false,
                description: 'The poll question. Supports template variables.',
                placeholder: 'What is your favorite feature?',
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
                    rows: 3,
                },
                default: '',
                required: false,
                description: 'Poll options, one per line. Supports template variables.',
                placeholder: 'Option 1\nOption 2\nOption 3',
                displayOptions: {
                    show: {
                        messageType: ['poll']
                    }
                }
            },
            {
                displayName: 'Anonymous Poll',
                name: 'anonymousPoll',
                type: 'boolean',
                default: true,
                required: false,
                description: 'Whether the poll should be anonymous.',
                displayOptions: {
                    show: {
                        messageType: ['poll']
                    }
                }
            },

            // Notification Options
            {
                displayName: 'Notification Message',
                name: 'notificationText',
                type: 'string',
                typeOptions: {
                    rows: 3,
                },
                default: '',
                required: false,
                description: 'Custom notification message to send to subscribers. Supports template variables.',
                placeholder: 'New post in our channel! Check it out: {channel_link}',
                displayOptions: {
                    show: {
                        command: ['notify']
                    }
                }
            },
            {
                displayName: 'Include Channel Link',
                name: 'includeChannelLink',
                type: 'boolean',
                default: true,
                required: false,
                description: 'Include a link to the channel in notifications.',
                displayOptions: {
                    show: {
                        command: ['notify']
                    }
                }
            },

            // Advanced Options
            {
                displayName: 'Parse Mode',
                name: 'parseMode',
                type: 'options',
                options: [
                    { name: 'None', value: '' },
                    { name: 'Markdown', value: 'Markdown' },
                    { name: 'HTML', value: 'HTML' },
                ],
                default: 'Markdown',
                required: false,
                description: 'Text formatting mode for messages.',
            },
            {
                displayName: 'Silent Message',
                name: 'silentMessage',
                type: 'boolean',
                default: false,
                required: false,
                description: 'Send message without notification sound.',
                displayOptions: {
                    show: {
                        command: ['post', 'schedule']
                    }
                }
            },
            {
                displayName: 'Pin Message',
                name: 'pinMessage',
                type: 'boolean',
                default: false,
                required: false,
                description: 'Pin the message in the channel after sending.',
                displayOptions: {
                    show: {
                        command: ['post']
                    }
                }
            },

            // Storage Options
            {
                displayName: 'Store Message Data',
                name: 'storeMessageData',
                type: 'boolean',
                default: true,
                required: false,
                description: 'Store message data for analytics and future operations.',
            },
            {
                displayName: 'Analytics Tracking',
                name: 'enableAnalytics',
                type: 'boolean',
                default: true,
                required: false,
                description: 'Enable analytics tracking for channel posts.',
            },
        ],
    },

    // Execute the Telegram Channel Bot node
    async execute(nodeConfig, inputData, connectedNodes = []) {
        console.log('=== TELEGRAM CHANNEL BOT DEBUG ===');
        console.log('Command:', nodeConfig.command);
        console.log('Channel ID:', nodeConfig.channelId);
        console.log('Message Type:', nodeConfig.messageType);
        
        // Universal Template Parser
        const parseUniversalTemplate = (inputStr, json) => {
            if (!inputStr || typeof inputStr !== 'string') return inputStr || '';
            
            let result = inputStr;
            
            // Handle {{$json.path}} format
            result = result.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
                try {
                    if (!json) return match;
                    
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

        // Process template variables in configuration
        const processedConfig = {};
        for (const [key, value] of Object.entries(nodeConfig)) {
            if (typeof value === 'string') {
                processedConfig[key] = parseUniversalTemplate(value, inputData);
            } else {
                processedConfig[key] = value;
            }
        }

        const {
            command,
            botToken,
            channelId,
            messageType = 'text',
            messageText,
            mediaUrl,
            scheduleTime,
            timeZone = 'UTC',
            messageId,
            pollQuestion,
            pollOptions,
            anonymousPoll = true,
            notificationText,
            includeChannelLink = true,
            parseMode = 'Markdown',
            silentMessage = false,
            pinMessage = false,
            storeMessageData = true,
            enableAnalytics = true
        } = processedConfig;

        try {
            let result = {};

            switch (command) {
                case 'post':
                    result = await this.postToChannel(botToken, channelId, {
                        messageType,
                        messageText,
                        mediaUrl,
                        parseMode,
                        silentMessage,
                        pinMessage,
                        pollQuestion,
                        pollOptions,
                        anonymousPoll
                    });
                    break;

                case 'schedule':
                    result = await this.schedulePost(botToken, channelId, {
                        messageType,
                        messageText,
                        mediaUrl,
                        scheduleTime,
                        timeZone,
                        parseMode,
                        silentMessage,
                        pollQuestion,
                        pollOptions,
                        anonymousPoll
                    });
                    break;

                case 'edit':
                    result = await this.editPost(botToken, channelId, messageId, {
                        messageText,
                        parseMode
                    });
                    break;

                case 'delete':
                    result = await this.deletePost(botToken, channelId, messageId);
                    break;

                case 'stats':
                    result = await this.getChannelStats(botToken, channelId);
                    break;

                case 'notify':
                    result = await this.notifySubscribers(botToken, channelId, {
                        notificationText,
                        includeChannelLink
                    });
                    break;

                case 'subscribers':
                    result = await this.manageSubscribers(botToken, channelId, inputData);
                    break;

                case 'process_queue':
                    result = await this.processScheduledPosts(botToken);
                    break;

                default:
                    throw new Error(`Unknown command: ${command}`);
            }

            // Store message data for analytics if enabled
            if (storeMessageData && (command === 'post' || command === 'schedule')) {
                await this.storeMessageData(channelId, result, processedConfig);
            }

            // Add analytics data if enabled
            if (enableAnalytics) {
                result.analytics = await this.getMessageAnalytics(channelId, result.message_id);
            }

            console.log(`✅ ${command} command completed successfully`);
            
            return {
                success: true,
                command: command,
                channelId: channelId,
                ...result,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('=== TELEGRAM CHANNEL BOT ERROR ===');
            console.error('Command:', command);
            console.error('Error:', error.message);
            
            throw new Error(`Telegram Channel Bot ${command} failed: ${error.message}`);
        }
    },

    // Post message to channel
    async postToChannel(botToken, channelId, options) {
        const { messageType, messageText, mediaUrl, parseMode, silentMessage, pinMessage, pollQuestion, pollOptions, anonymousPoll } = options;
        
        console.log(`Posting ${messageType} to channel ${channelId}`);

        try {
            let response;
            const baseParams = {
                chat_id: channelId,
                disable_notification: silentMessage,
            };

            if (parseMode) {
                baseParams.parse_mode = parseMode;
            }

            switch (messageType) {
                case 'text':
                    response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        ...baseParams,
                        text: messageText
                    });
                    break;

                case 'photo':
                    response = await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                        ...baseParams,
                        photo: mediaUrl,
                        caption: messageText
                    });
                    break;

                case 'video':
                    response = await axios.post(`https://api.telegram.org/bot${botToken}/sendVideo`, {
                        ...baseParams,
                        video: mediaUrl,
                        caption: messageText
                    });
                    break;

                case 'document':
                    response = await axios.post(`https://api.telegram.org/bot${botToken}/sendDocument`, {
                        ...baseParams,
                        document: mediaUrl,
                        caption: messageText
                    });
                    break;

                case 'poll':
                    const pollOptionsArray = pollOptions.split('\n').filter(opt => opt.trim());
                    response = await axios.post(`https://api.telegram.org/bot${botToken}/sendPoll`, {
                        ...baseParams,
                        question: pollQuestion,
                        options: JSON.stringify(pollOptionsArray),
                        is_anonymous: anonymousPoll
                    });
                    break;

                default:
                    throw new Error(`Unsupported message type: ${messageType}`);
            }

            if (!response.data.ok) {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }

            const messageData = response.data.result;

            // Pin message if requested
            if (pinMessage) {
                try {
                    await axios.post(`https://api.telegram.org/bot${botToken}/pinChatMessage`, {
                        chat_id: channelId,
                        message_id: messageData.message_id,
                        disable_notification: true
                    });
                    console.log(`Message ${messageData.message_id} pinned successfully`);
                } catch (pinError) {
                    console.warn(`Failed to pin message: ${pinError.message}`);
                }
            }

            return {
                message_id: messageData.message_id,
                date: messageData.date,
                type: messageType,
                text: messageText,
                media_url: mediaUrl,
                pinned: pinMessage
            };

        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const description = error.response.data?.description || 'Unknown error';
                
                if (status === 400) {
                    throw new Error(`Bad request: ${description}`);
                } else if (status === 401) {
                    throw new Error('Invalid bot token');
                } else if (status === 403) {
                    throw new Error('Bot is not admin of the channel or channel not found');
                } else {
                    throw new Error(`Telegram API error (${status}): ${description}`);
                }
            }
            throw new Error(`Failed to post to channel: ${error.message}`);
        }
    },

    // Schedule a post for future delivery
    async schedulePost(botToken, channelId, options) {
        const { scheduleTime, timeZone, ...postOptions } = options;
        
        console.log(`Scheduling post for ${scheduleTime} (${timeZone})`);

        try {
            // Parse schedule time
            const scheduledDate = new Date(scheduleTime);
            if (isNaN(scheduledDate.getTime())) {
                throw new Error('Invalid schedule time format. Use ISO format: 2024-12-31T15:30:00Z');
            }

            // Check if time is in the future
            if (scheduledDate.getTime() <= Date.now()) {
                throw new Error('Schedule time must be in the future');
            }

            // Store scheduled post (in a real implementation, you'd use a database)
            const scheduleId = crypto.randomBytes(16).toString('hex');
            const scheduledPost = {
                id: scheduleId,
                botToken,
                channelId,
                scheduledDate: scheduledDate.toISOString(),
                options: postOptions,
                status: 'scheduled',
                createdAt: new Date().toISOString()
            };

            // In a real implementation, store this in a database
            await this.saveScheduledPost(scheduledPost);

            return {
                schedule_id: scheduleId,
                scheduled_date: scheduledDate.toISOString(),
                status: 'scheduled',
                message_type: postOptions.messageType,
                text_preview: postOptions.messageText?.substring(0, 100) + (postOptions.messageText?.length > 100 ? '...' : '')
            };

        } catch (error) {
            throw new Error(`Failed to schedule post: ${error.message}`);
        }
    },

    // Edit existing channel post
    async editPost(botToken, channelId, messageId, options) {
        const { messageText, parseMode } = options;
        
        console.log(`Editing message ${messageId} in channel ${channelId}`);

        try {
            const response = await axios.post(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                chat_id: channelId,
                message_id: parseInt(messageId),
                text: messageText,
                parse_mode: parseMode
            });

            if (!response.data.ok) {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }

            return {
                message_id: parseInt(messageId),
                edited: true,
                new_text: messageText,
                edit_date: new Date().toISOString()
            };

        } catch (error) {
            if (error.response?.status === 400) {
                throw new Error('Message not found or cannot be edited');
            }
            throw new Error(`Failed to edit post: ${error.message}`);
        }
    },

    // Delete channel post
    async deletePost(botToken, channelId, messageId) {
        console.log(`Deleting message ${messageId} from channel ${channelId}`);

        try {
            const response = await axios.post(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
                chat_id: channelId,
                message_id: parseInt(messageId)
            });

            if (!response.data.ok) {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }

            return {
                message_id: parseInt(messageId),
                deleted: true,
                delete_date: new Date().toISOString()
            };

        } catch (error) {
            if (error.response?.status === 400) {
                throw new Error('Message not found or cannot be deleted');
            }
            throw new Error(`Failed to delete post: ${error.message}`);
        }
    },

    // Get channel statistics
    async getChannelStats(botToken, channelId) {
        console.log(`Getting stats for channel ${channelId}`);

        try {
            // Get basic channel info
            const chatResponse = await axios.post(`https://api.telegram.org/bot${botToken}/getChat`, {
                chat_id: channelId
            });

            if (!chatResponse.data.ok) {
                throw new Error(`Telegram API error: ${chatResponse.data.description}`);
            }

            const chatInfo = chatResponse.data.result;

            // Get member count
            const memberResponse = await axios.post(`https://api.telegram.org/bot${botToken}/getChatMemberCount`, {
                chat_id: channelId
            });

            const memberCount = memberResponse.data.ok ? memberResponse.data.result : 0;

            return {
                channel_id: channelId,
                title: chatInfo.title,
                username: chatInfo.username,
                description: chatInfo.description,
                member_count: memberCount,
                type: chatInfo.type,
                invite_link: chatInfo.invite_link,
                stats_date: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Failed to get channel stats: ${error.message}`);
        }
    },

    // Notify subscribers about new post
    async notifySubscribers(botToken, channelId, options) {
        const { notificationText, includeChannelLink } = options;
        
        console.log(`Notifying subscribers about new post in ${channelId}`);

        try {
            // Get channel info for link
            let channelLink = '';
            if (includeChannelLink) {
                const chatResponse = await axios.post(`https://api.telegram.org/bot${botToken}/getChat`, {
                    chat_id: channelId
                });
                
                if (chatResponse.data.ok) {
                    const chatInfo = chatResponse.data.result;
                    channelLink = chatInfo.username ? `https://t.me/${chatInfo.username}` : 
                                 chatInfo.invite_link || `Channel: ${chatInfo.title}`;
                }
            }

            // Replace template variables in notification
            let finalNotificationText = notificationText;
            if (includeChannelLink && channelLink) {
                finalNotificationText = finalNotificationText.replace('{channel_link}', channelLink);
            }

            // Get subscriber list (placeholder - would come from database in real implementation)
            const subscribers = await this.getSubscriberList(channelId);
            
            let successCount = 0;
            let failureCount = 0;

            // Send notifications to subscribers
            for (const subscriberId of subscribers) {
                try {
                    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        chat_id: subscriberId,
                        text: finalNotificationText,
                        parse_mode: 'Markdown',
                        disable_web_page_preview: false
                    });
                    successCount++;
                } catch (notifyError) {
                    console.warn(`Failed to notify subscriber ${subscriberId}: ${notifyError.message}`);
                    failureCount++;
                }

                // Rate limiting - small delay between notifications
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            return {
                notification_sent: true,
                total_subscribers: subscribers.length,
                successful_notifications: successCount,
                failed_notifications: failureCount,
                channel_link: channelLink,
                notification_text: finalNotificationText
            };

        } catch (error) {
            throw new Error(`Failed to notify subscribers: ${error.message}`);
        }
    },

    // Process scheduled posts (would be called by a cron job)
    async processScheduledPosts(botToken) {
        console.log('Processing scheduled posts...');

        try {
            // Get all scheduled posts that are due (placeholder implementation)
            const duePosts = await this.getDueScheduledPosts();
            
            let processedCount = 0;
            let errorCount = 0;

            for (const scheduledPost of duePosts) {
                try {
                    // Post the scheduled message
                    const result = await this.postToChannel(
                        scheduledPost.botToken,
                        scheduledPost.channelId,
                        scheduledPost.options
                    );

                    // Update scheduled post status
                    await this.updateScheduledPostStatus(scheduledPost.id, 'completed', result);
                    processedCount++;

                    console.log(`✅ Scheduled post ${scheduledPost.id} sent successfully`);

                } catch (error) {
                    console.error(`❌ Failed to send scheduled post ${scheduledPost.id}: ${error.message}`);
                    await this.updateScheduledPostStatus(scheduledPost.id, 'failed', { error: error.message });
                    errorCount++;
                }
            }

            return {
                processed: processedCount,
                errors: errorCount,
                total_due: duePosts.length,
                process_date: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Failed to process scheduled posts: ${error.message}`);
        }
    },

    // Helper functions (database implementations)
    async saveScheduledPost(scheduledPost) {
        return await channelBotDb.saveScheduledPost(scheduledPost);
    },

    async getDueScheduledPosts() {
        return await channelBotDb.getDueScheduledPosts();
    },

    async updateScheduledPostStatus(scheduleId, status, result = {}) {
        return await channelBotDb.updateScheduledPostStatus(scheduleId, status, result);
    },

    async getSubscriberList(channelId) {
        const subscribers = await channelBotDb.getSubscriberList(channelId);
        return subscribers.map(sub => sub.userId); // Return array of user IDs
    },

    async storeMessageData(channelId, messageData, config) {
        return await channelBotDb.storeMessageData(channelId, messageData, config);
    },

    async getMessageAnalytics(channelId, messageId) {
        return await channelBotDb.getMessageAnalytics(channelId, messageId);
    },

    async manageSubscribers(botToken, channelId, inputData) {
        // Placeholder for subscriber management
        return {
            action: 'manage_subscribers',
            channel_id: channelId,
            subscribers_count: 0
        };
    }
};

module.exports = telegramChannelBotNode;