/*
=================================================================
BACKEND FILE: src/services/channelBotScheduler.js
=================================================================
Scheduling service for Telegram Channel Bot
Handles automated posting of scheduled messages.
*/

const channelBotDb = require('./channelBotDatabase');
const telegramChannelBotNode = require('../nodes/actions/telegramChannelBotNode');

class ChannelBotScheduler {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.checkInterval = 60000; // Check every minute
        console.log('📅 Channel Bot Scheduler initialized');
    }

    // Start the scheduler
    start() {
        if (this.isRunning) {
            console.log('⚠️ Scheduler is already running');
            return;
        }

        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.processScheduledPosts();
        }, this.checkInterval);

        console.log(`✅ Channel Bot Scheduler started (checking every ${this.checkInterval / 1000}s)`);
    }

    // Stop the scheduler
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Scheduler is not running');
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        console.log('⏹️ Channel Bot Scheduler stopped');
    }

    // Process due scheduled posts
    async processScheduledPosts() {
        try {
            const duePosts = await channelBotDb.getDueScheduledPosts();
            
            if (duePosts.length === 0) {
                return; // No posts due
            }

            console.log(`📋 Processing ${duePosts.length} scheduled posts...`);
            
            let processedCount = 0;
            let errorCount = 0;

            for (const scheduledPost of duePosts) {
                try {
                    console.log(`📤 Sending scheduled post: ${scheduledPost.id}`);
                    
                    // Create a temporary node instance to use its methods
                    const tempNode = telegramChannelBotNode;
                    
                    // Post the scheduled message
                    const result = await tempNode.postToChannel(
                        scheduledPost.botToken,
                        scheduledPost.channelId,
                        scheduledPost.options
                    );

                    // Update scheduled post status
                    await channelBotDb.updateScheduledPostStatus(scheduledPost.id, 'completed', result);
                    
                    // Store message data for analytics
                    await channelBotDb.storeMessageData(scheduledPost.channelId, result, scheduledPost.options);
                    
                    processedCount++;
                    console.log(`✅ Scheduled post ${scheduledPost.id} sent successfully`);

                    // Add delay between posts to avoid rate limiting
                    await this.delay(1000);

                } catch (error) {
                    console.error(`❌ Failed to send scheduled post ${scheduledPost.id}:`, error.message);
                    
                    // Update status to failed
                    await channelBotDb.updateScheduledPostStatus(scheduledPost.id, 'failed', { 
                        error: error.message,
                        failedAt: new Date().toISOString()
                    });
                    
                    errorCount++;
                }
            }

            if (processedCount > 0 || errorCount > 0) {
                console.log(`📊 Processed ${processedCount} posts successfully, ${errorCount} failed`);
            }

            return {
                processed: processedCount,
                errors: errorCount,
                total: duePosts.length
            };

        } catch (error) {
            console.error('❌ Error processing scheduled posts:', error);
            return {
                processed: 0,
                errors: 1,
                total: 0,
                systemError: error.message
            };
        }
    }

    // Manual trigger for processing scheduled posts
    async processNow() {
        console.log('🔄 Manually triggering scheduled post processing...');
        return await this.processScheduledPosts();
    }

    // Get scheduler status
    getStatus() {
        return {
            running: this.isRunning,
            checkInterval: this.checkInterval,
            nextCheck: this.isRunning ? new Date(Date.now() + this.checkInterval).toISOString() : null
        };
    }

    // Set check interval (in milliseconds)
    setCheckInterval(intervalMs) {
        if (intervalMs < 10000) { // Minimum 10 seconds
            throw new Error('Check interval must be at least 10 seconds');
        }

        this.checkInterval = intervalMs;
        
        // Restart if running to apply new interval
        if (this.isRunning) {
            this.stop();
            this.start();
        }

        console.log(`⏱️ Check interval updated to ${intervalMs / 1000} seconds`);
    }

    // Get upcoming scheduled posts
    async getUpcomingPosts(limit = 10) {
        try {
            const allPosts = await channelBotDb.getScheduledPosts();
            const upcomingPosts = allPosts
                .filter(post => post.status === 'scheduled')
                .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
                .slice(0, limit);

            return upcomingPosts.map(post => ({
                id: post.id,
                channelId: post.channelId,
                scheduledDate: post.scheduledDate,
                messageType: post.options.messageType,
                textPreview: post.options.messageText?.substring(0, 100) + 
                           (post.options.messageText?.length > 100 ? '...' : ''),
                timeUntilPost: this.getTimeUntil(post.scheduledDate)
            }));
        } catch (error) {
            console.error('Error getting upcoming posts:', error);
            return [];
        }
    }

    // Get time until a scheduled date
    getTimeUntil(scheduledDate) {
        const now = Date.now();
        const scheduled = new Date(scheduledDate).getTime();
        const diff = scheduled - now;

        if (diff <= 0) {
            return 'Overdue';
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} day${days !== 1 ? 's' : ''}, ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }

    // Cancel a scheduled post
    async cancelScheduledPost(scheduleId) {
        try {
            const result = await channelBotDb.updateScheduledPostStatus(scheduleId, 'cancelled', {
                cancelledAt: new Date().toISOString()
            });

            if (result) {
                console.log(`🚫 Cancelled scheduled post: ${scheduleId}`);
            }

            return result;
        } catch (error) {
            console.error('Error cancelling scheduled post:', error);
            return false;
        }
    }

    // Reschedule a post
    async reschedulePost(scheduleId, newScheduleTime) {
        try {
            const allPosts = await channelBotDb.getScheduledPosts();
            const postIndex = allPosts.findIndex(post => post.id === scheduleId);

            if (postIndex === -1) {
                throw new Error('Scheduled post not found');
            }

            const post = allPosts[postIndex];
            
            if (post.status !== 'scheduled') {
                throw new Error('Can only reschedule posts with status "scheduled"');
            }

            // Validate new schedule time
            const newDate = new Date(newScheduleTime);
            if (isNaN(newDate.getTime())) {
                throw new Error('Invalid schedule time format');
            }

            if (newDate.getTime() <= Date.now()) {
                throw new Error('New schedule time must be in the future');
            }

            // Update the scheduled date
            allPosts[postIndex].scheduledDate = newDate.toISOString();
            allPosts[postIndex].rescheduledAt = new Date().toISOString();

            // Save updated posts
            const fs = require('fs').promises;
            const path = require('path');
            const scheduledPostsFile = path.join(process.cwd(), 'data', 'channel-bot', 'scheduled-posts.json');
            await fs.writeFile(scheduledPostsFile, JSON.stringify(allPosts, null, 2));

            console.log(`📅 Rescheduled post ${scheduleId} to ${newDate.toISOString()}`);
            return true;
        } catch (error) {
            console.error('Error rescheduling post:', error);
            return false;
        }
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get scheduler statistics
    async getSchedulerStats() {
        try {
            const allPosts = await channelBotDb.getScheduledPosts();
            
            const stats = {
                total: allPosts.length,
                scheduled: allPosts.filter(p => p.status === 'scheduled').length,
                completed: allPosts.filter(p => p.status === 'completed').length,
                failed: allPosts.filter(p => p.status === 'failed').length,
                cancelled: allPosts.filter(p => p.status === 'cancelled').length
            };

            // Get next scheduled post
            const nextPost = allPosts
                .filter(p => p.status === 'scheduled')
                .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0];

            stats.nextScheduledPost = nextPost ? {
                id: nextPost.id,
                scheduledDate: nextPost.scheduledDate,
                timeUntil: this.getTimeUntil(nextPost.scheduledDate)
            } : null;

            stats.schedulerStatus = this.getStatus();

            return stats;
        } catch (error) {
            console.error('Error getting scheduler stats:', error);
            return null;
        }
    }
}

// Create singleton instance
const channelBotScheduler = new ChannelBotScheduler();

module.exports = channelBotScheduler;