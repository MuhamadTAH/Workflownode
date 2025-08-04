/*
=================================================================
BACKEND FILE: src/services/channelBotDatabase.js
=================================================================
Database service for Telegram Channel Bot
Handles scheduled posts, subscribers, and analytics storage.
*/

const fs = require('fs').promises;
const path = require('path');

class ChannelBotDatabase {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data', 'channel-bot');
        this.scheduledPostsFile = path.join(this.dataDir, 'scheduled-posts.json');
        this.subscribersFile = path.join(this.dataDir, 'subscribers.json');
        this.analyticsFile = path.join(this.dataDir, 'analytics.json');
        this.messagesFile = path.join(this.dataDir, 'messages.json');
        this.initialized = false;
        
        this.initializeDatabase();
    }

    // Initialize database files
    async initializeDatabase() {
        try {
            // Create data directory
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Initialize files if they don't exist
            await this.initializeFile(this.scheduledPostsFile, []);
            await this.initializeFile(this.subscribersFile, {});
            await this.initializeFile(this.analyticsFile, {});
            await this.initializeFile(this.messagesFile, []);
            
            this.initialized = true;
            console.log('📁 Channel Bot database initialized');
        } catch (error) {
            console.error('Failed to initialize Channel Bot database:', error);
        }
    }

    // Ensure database is initialized before operations
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initializeDatabase();
        }
    }

    async initializeFile(filePath, defaultData) {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
        }
    }

    // Scheduled Posts Management
    async saveScheduledPost(scheduledPost) {
        try {
            await this.ensureInitialized();
            const posts = await this.getScheduledPosts();
            posts.push(scheduledPost);
            await fs.writeFile(this.scheduledPostsFile, JSON.stringify(posts, null, 2));
            
            console.log(`📅 Scheduled post saved: ${scheduledPost.id}`);
            return true;
        } catch (error) {
            console.error('Failed to save scheduled post:', error);
            return false;
        }
    }

    async getScheduledPosts() {
        try {
            const data = await fs.readFile(this.scheduledPostsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to get scheduled posts:', error);
            return [];
        }
    }

    async getDueScheduledPosts() {
        try {
            const posts = await this.getScheduledPosts();
            const now = new Date();
            
            return posts.filter(post => {
                const scheduledDate = new Date(post.scheduledDate);
                return scheduledDate <= now && post.status === 'scheduled';
            });
        } catch (error) {
            console.error('Failed to get due scheduled posts:', error);
            return [];
        }
    }

    async updateScheduledPostStatus(scheduleId, status, result = {}) {
        try {
            const posts = await this.getScheduledPosts();
            const postIndex = posts.findIndex(post => post.id === scheduleId);
            
            if (postIndex !== -1) {
                posts[postIndex].status = status;
                posts[postIndex].result = result;
                posts[postIndex].completedAt = new Date().toISOString();
                
                await fs.writeFile(this.scheduledPostsFile, JSON.stringify(posts, null, 2));
                console.log(`📝 Updated scheduled post ${scheduleId} status to: ${status}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to update scheduled post status:', error);
            return false;
        }
    }

    async deleteScheduledPost(scheduleId) {
        try {
            const posts = await this.getScheduledPosts();
            const filteredPosts = posts.filter(post => post.id !== scheduleId);
            
            await fs.writeFile(this.scheduledPostsFile, JSON.stringify(filteredPosts, null, 2));
            console.log(`🗑️ Deleted scheduled post: ${scheduleId}`);
            return true;
        } catch (error) {
            console.error('Failed to delete scheduled post:', error);
            return false;
        }
    }

    // Subscriber Management
    async getSubscriberList(channelId) {
        try {
            const data = await fs.readFile(this.subscribersFile, 'utf8');
            const subscribers = JSON.parse(data);
            return subscribers[channelId] || [];
        } catch (error) {
            console.error('Failed to get subscriber list:', error);
            return [];
        }
    }

    async addSubscriber(channelId, userId, userInfo = {}) {
        try {
            const data = await fs.readFile(this.subscribersFile, 'utf8');
            const subscribers = JSON.parse(data);
            
            if (!subscribers[channelId]) {
                subscribers[channelId] = [];
            }
            
            // Check if user already subscribed
            const existingIndex = subscribers[channelId].findIndex(sub => sub.userId === userId);
            
            if (existingIndex === -1) {
                subscribers[channelId].push({
                    userId,
                    ...userInfo,
                    subscribedAt: new Date().toISOString()
                });
                
                await fs.writeFile(this.subscribersFile, JSON.stringify(subscribers, null, 2));
                console.log(`👤 Added subscriber ${userId} to channel ${channelId}`);
                return true;
            }
            
            return false; // Already subscribed
        } catch (error) {
            console.error('Failed to add subscriber:', error);
            return false;
        }
    }

    async removeSubscriber(channelId, userId) {
        try {
            const data = await fs.readFile(this.subscribersFile, 'utf8');
            const subscribers = JSON.parse(data);
            
            if (subscribers[channelId]) {
                subscribers[channelId] = subscribers[channelId].filter(sub => sub.userId !== userId);
                await fs.writeFile(this.subscribersFile, JSON.stringify(subscribers, null, 2));
                console.log(`👤 Removed subscriber ${userId} from channel ${channelId}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to remove subscriber:', error);
            return false;
        }
    }

    async getSubscriberCount(channelId) {
        try {
            const subscribers = await this.getSubscriberList(channelId);
            return subscribers.length;
        } catch (error) {
            console.error('Failed to get subscriber count:', error);
            return 0;
        }
    }

    // Message Storage and Analytics
    async storeMessageData(channelId, messageData, config) {
        try {
            const messages = await this.getMessages();
            
            const messageRecord = {
                id: `${channelId}_${messageData.message_id}`,
                channelId,
                messageId: messageData.message_id,
                type: messageData.type,
                text: messageData.text,
                mediaUrl: messageData.media_url,
                date: messageData.date,
                config,
                analytics: {
                    views: 0,
                    forwards: 0,
                    reactions: {}
                },
                createdAt: new Date().toISOString()
            };
            
            messages.push(messageRecord);
            await fs.writeFile(this.messagesFile, JSON.stringify(messages, null, 2));
            
            console.log(`📊 Stored message data: ${messageData.message_id}`);
            return true;
        } catch (error) {
            console.error('Failed to store message data:', error);
            return false;
        }
    }

    async getMessages() {
        try {
            const data = await fs.readFile(this.messagesFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to get messages:', error);
            return [];
        }
    }

    async getMessageAnalytics(channelId, messageId) {
        try {
            const messages = await this.getMessages();
            const message = messages.find(msg => 
                msg.channelId === channelId && msg.messageId === messageId
            );
            
            return message ? message.analytics : {
                views: 0,
                forwards: 0,
                reactions: {}
            };
        } catch (error) {
            console.error('Failed to get message analytics:', error);
            return { views: 0, forwards: 0, reactions: {} };
        }
    }

    async updateMessageAnalytics(channelId, messageId, analyticsData) {
        try {
            const messages = await this.getMessages();
            const messageIndex = messages.findIndex(msg => 
                msg.channelId === channelId && msg.messageId === messageId
            );
            
            if (messageIndex !== -1) {
                messages[messageIndex].analytics = {
                    ...messages[messageIndex].analytics,
                    ...analyticsData,
                    lastUpdated: new Date().toISOString()
                };
                
                await fs.writeFile(this.messagesFile, JSON.stringify(messages, null, 2));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to update message analytics:', error);
            return false;
        }
    }

    // Channel Analytics
    async getChannelAnalytics(channelId, dateRange = 30) {
        try {
            const messages = await this.getMessages();
            const subscribers = await this.getSubscriberList(channelId);
            const scheduledPosts = await this.getScheduledPosts();
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - dateRange);
            
            const recentMessages = messages.filter(msg => 
                msg.channelId === channelId && 
                new Date(msg.createdAt) >= cutoffDate
            );
            
            const totalViews = recentMessages.reduce((sum, msg) => sum + (msg.analytics.views || 0), 0);
            const totalForwards = recentMessages.reduce((sum, msg) => sum + (msg.analytics.forwards || 0), 0);
            
            const channelScheduledPosts = scheduledPosts.filter(post => 
                post.channelId === channelId
            );
            
            const completedPosts = channelScheduledPosts.filter(post => post.status === 'completed').length;
            const pendingPosts = channelScheduledPosts.filter(post => post.status === 'scheduled').length;
            
            return {
                channelId,
                dateRange,
                subscribers: subscribers.length,
                totalMessages: recentMessages.length,
                totalViews,
                totalForwards,
                averageViews: recentMessages.length > 0 ? Math.round(totalViews / recentMessages.length) : 0,
                scheduledPosts: {
                    completed: completedPosts,
                    pending: pendingPosts,
                    total: channelScheduledPosts.length
                },
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to get channel analytics:', error);
            return null;
        }
    }

    // Cleanup old data
    async cleanupOldData(daysToKeep = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            // Clean old completed scheduled posts
            const posts = await this.getScheduledPosts();
            const filteredPosts = posts.filter(post => {
                if (post.status === 'scheduled') return true; // Keep pending posts
                return new Date(post.completedAt || post.createdAt) >= cutoffDate;
            });
            
            await fs.writeFile(this.scheduledPostsFile, JSON.stringify(filteredPosts, null, 2));
            
            // Clean old messages (keep analytics for recent ones)
            const messages = await this.getMessages();
            const filteredMessages = messages.filter(msg => 
                new Date(msg.createdAt) >= cutoffDate
            );
            
            await fs.writeFile(this.messagesFile, JSON.stringify(filteredMessages, null, 2));
            
            console.log(`🧹 Cleaned up data older than ${daysToKeep} days`);
            return true;
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
            return false;
        }
    }

    // Export/Import data
    async exportData(channelId = null) {
        try {
            const data = {
                scheduledPosts: await this.getScheduledPosts(),
                subscribers: JSON.parse(await fs.readFile(this.subscribersFile, 'utf8')),
                messages: await this.getMessages(),
                exportedAt: new Date().toISOString()
            };
            
            if (channelId) {
                // Filter data for specific channel
                data.scheduledPosts = data.scheduledPosts.filter(post => post.channelId === channelId);
                data.subscribers = { [channelId]: data.subscribers[channelId] || [] };
                data.messages = data.messages.filter(msg => msg.channelId === channelId);
            }
            
            return data;
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }
}

// Create singleton instance
const channelBotDb = new ChannelBotDatabase();

module.exports = channelBotDb;