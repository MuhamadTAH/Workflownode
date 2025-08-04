/*
=================================================================
BACKEND FILE: src/api/routes/channelBot.js
=================================================================
API routes for Telegram Channel Bot management
*/

const express = require('express');
const router = express.Router();
const channelBotDb = require('../../services/channelBotDatabase');
const channelBotScheduler = require('../../services/channelBotScheduler');

// Get scheduled posts
router.get('/scheduled-posts', async (req, res) => {
    try {
        const { channelId, status, limit = 50 } = req.query;
        let posts = await channelBotDb.getScheduledPosts();
        
        // Filter by channel if specified
        if (channelId) {
            posts = posts.filter(post => post.channelId === channelId);
        }
        
        // Filter by status if specified
        if (status) {
            posts = posts.filter(post => post.status === status);
        }
        
        // Sort by scheduled date
        posts.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
        
        // Limit results
        posts = posts.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            posts,
            total: posts.length
        });
    } catch (error) {
        console.error('Error getting scheduled posts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get upcoming posts
router.get('/upcoming-posts', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const upcomingPosts = await channelBotScheduler.getUpcomingPosts(parseInt(limit));
        
        res.json({
            success: true,
            posts: upcomingPosts
        });
    } catch (error) {
        console.error('Error getting upcoming posts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cancel scheduled post
router.delete('/scheduled-posts/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const result = await channelBotScheduler.cancelScheduledPost(scheduleId);
        
        if (result) {
            res.json({
                success: true,
                message: 'Scheduled post cancelled successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Scheduled post not found'
            });
        }
    } catch (error) {
        console.error('Error cancelling scheduled post:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Reschedule post
router.put('/scheduled-posts/:scheduleId/reschedule', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { newScheduleTime } = req.body;
        
        if (!newScheduleTime) {
            return res.status(400).json({
                success: false,
                error: 'newScheduleTime is required'
            });
        }
        
        const result = await channelBotScheduler.reschedulePost(scheduleId, newScheduleTime);
        
        if (result) {
            res.json({
                success: true,
                message: 'Post rescheduled successfully',
                newScheduleTime
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Failed to reschedule post'
            });
        }
    } catch (error) {
        console.error('Error rescheduling post:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get scheduler status
router.get('/scheduler/status', (req, res) => {
    try {
        const status = channelBotScheduler.getStatus();
        res.json({
            success: true,
            scheduler: status
        });
    } catch (error) {
        console.error('Error getting scheduler status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start scheduler
router.post('/scheduler/start', (req, res) => {
    try {
        channelBotScheduler.start();
        res.json({
            success: true,
            message: 'Scheduler started successfully'
        });
    } catch (error) {
        console.error('Error starting scheduler:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stop scheduler
router.post('/scheduler/stop', (req, res) => {
    try {
        channelBotScheduler.stop();
        res.json({
            success: true,
            message: 'Scheduler stopped successfully'
        });
    } catch (error) {
        console.error('Error stopping scheduler:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Process scheduled posts manually
router.post('/scheduler/process-now', async (req, res) => {
    try {
        const result = await channelBotScheduler.processNow();
        res.json({
            success: true,
            message: 'Scheduled posts processed',
            result
        });
    } catch (error) {
        console.error('Error processing scheduled posts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get scheduler statistics
router.get('/scheduler/stats', async (req, res) => {
    try {
        const stats = await channelBotScheduler.getSchedulerStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting scheduler stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get channel analytics
router.get('/analytics/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { dateRange = 30 } = req.query;
        
        const analytics = await channelBotDb.getChannelAnalytics(channelId, parseInt(dateRange));
        
        if (analytics) {
            res.json({
                success: true,
                analytics
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Analytics not available for this channel'
            });
        }
    } catch (error) {
        console.error('Error getting channel analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get subscribers for a channel
router.get('/subscribers/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        const subscribers = await channelBotDb.getSubscriberList(channelId);
        const count = await channelBotDb.getSubscriberCount(channelId);
        
        res.json({
            success: true,
            channelId,
            subscribers,
            count
        });
    } catch (error) {
        console.error('Error getting subscribers:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add subscriber
router.post('/subscribers/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId, userInfo } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        
        const result = await channelBotDb.addSubscriber(channelId, userId, userInfo);
        
        if (result) {
            res.json({
                success: true,
                message: 'Subscriber added successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'User is already subscribed'
            });
        }
    } catch (error) {
        console.error('Error adding subscriber:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Remove subscriber
router.delete('/subscribers/:channelId/:userId', async (req, res) => {
    try {
        const { channelId, userId } = req.params;
        const result = await channelBotDb.removeSubscriber(channelId, userId);
        
        if (result) {
            res.json({
                success: true,
                message: 'Subscriber removed successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Subscriber not found'
            });
        }
    } catch (error) {
        console.error('Error removing subscriber:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get messages for a channel
router.get('/messages/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { limit = 50 } = req.query;
        
        const allMessages = await channelBotDb.getMessages();
        const channelMessages = allMessages
            .filter(msg => msg.channelId === channelId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, parseInt(limit));
        
        res.json({
            success: true,
            messages: channelMessages,
            total: channelMessages.length
        });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Export channel data
router.get('/export/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        const data = await channelBotDb.exportData(channelId);
        
        if (data) {
            res.json({
                success: true,
                data
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to export data'
            });
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cleanup old data
router.post('/cleanup', async (req, res) => {
    try {
        const { daysToKeep = 90 } = req.body;
        const result = await channelBotDb.cleanupOldData(parseInt(daysToKeep));
        
        if (result) {
            res.json({
                success: true,
                message: `Data older than ${daysToKeep} days cleaned up successfully`
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to cleanup data'
            });
        }
    } catch (error) {
        console.error('Error cleaning up data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;