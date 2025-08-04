const telegramTrigger = require('../../nodes/triggers/telegramTrigger');
const workflowExecutor = require('../../services/workflowExecutor');

// Simple in-memory store for the latest execution data, keyed by workflowId
const executionDataStore = {};

const handleTelegramWebhook = async (req, res) => {
    try {
        const workflowId = req.params.workflowId;
        console.log(`\n🔔 Webhook received for workflowId: ${workflowId}`);
        
        // 🔍 DEBUG: Log complete raw incoming data from Telegram
        console.log('🔍 RAW WEBHOOK DATA - Complete request body:');
        console.log(JSON.stringify(req.body, null, 2));
        
        // 🔍 DEBUG: Check specifically for media types in the message
        if (req.body && req.body.message) {
            const message = req.body.message;
            console.log('🔍 MEDIA TYPE ANALYSIS:');
            console.log('  - Has photo?', !!message.photo, message.photo ? `(${message.photo.length} sizes)` : '');
            console.log('  - Has video?', !!message.video, message.video ? `(${message.video.duration}s, ${message.video.file_size} bytes)` : '');
            console.log('  - Has animation?', !!message.animation);
            console.log('  - Has document?', !!message.document);
            console.log('  - Has video_note?', !!message.video_note);
            console.log('  - Message keys:', Object.keys(message));
            
            // 🔍 DEBUG: If it's a video, show video details
            if (message.video) {
                console.log('🎬 VIDEO DETAILS FROM TELEGRAM:');
                console.log('  - File ID:', message.video.file_id);
                console.log('  - File unique ID:', message.video.file_unique_id);
                console.log('  - Duration:', message.video.duration, 'seconds');
                console.log('  - Width x Height:', message.video.width, 'x', message.video.height);
                console.log('  - File size:', message.video.file_size, 'bytes');
                console.log('  - MIME type:', message.video.mime_type);
                console.log('  - Has thumbnail?', !!message.video.thumb);
            }
            
            // 🔍 DEBUG: If it's a photo, show photo details
            if (message.photo) {
                console.log('📸 PHOTO DETAILS FROM TELEGRAM:');
                message.photo.forEach((photo, index) => {
                    console.log(`  - Photo ${index + 1}: ${photo.width}x${photo.height}, ${photo.file_size} bytes, ID: ${photo.file_id}`);
                });
            }
        }

        // Get workflow credentials (including bot token) for trigger processing
        const credentials = workflowExecutor.getWorkflowCredentials(workflowId);
        console.log('🔍 DEBUG: Retrieved credentials for workflowId:', workflowId);
        console.log('🔍 DEBUG: Credentials object:', credentials ? 'exists' : 'null');
        console.log('🔍 DEBUG: Bot token exists:', credentials && credentials.botToken ? 'YES' : 'NO');
        
        if (credentials && credentials.botToken) {
            // Add bot token to request body for trigger processing
            req.body._botToken = credentials.botToken;
            console.log('🔑 Bot token added to trigger context');
            console.log('🔑 Bot token (first 10 chars):', credentials.botToken.substring(0, 10) + '...');
        } else {
            console.log('❌ No bot token available in credentials');
            console.log('❌ Available credential keys:', credentials ? Object.keys(credentials) : 'none');
        }

        // Process the trigger data
        const result = await telegramTrigger.trigger(req);
        const triggerData = result.workflowData;

        // Store the result in our in-memory store (for backward compatibility)
        executionDataStore[workflowId] = triggerData;

        console.log('✅ Trigger data processed successfully');
        console.log('Trigger data:', JSON.stringify(triggerData, null, 2));

        // Check if this workflow is registered for automatic execution
        const workflowStatus = workflowExecutor.getWorkflowStatus(workflowId);
        
        console.log(`🔍 Checking workflow ${workflowId} status:`, {
            isRegistered: workflowStatus.isRegistered,
            isActive: workflowStatus.isActive,
            registeredAt: workflowStatus.registeredAt,
            totalExecutions: workflowStatus.totalExecutions
        });
        
        if (workflowStatus.isRegistered && workflowStatus.isActive) {
            console.log(`🚀 Auto-executing workflow ${workflowId}...`);
            
            try {
                // Execute the complete workflow automatically
                const executionResult = await workflowExecutor.executeWorkflow(workflowId, triggerData);
                
                console.log(`✅ Workflow ${workflowId} executed successfully`);
                console.log(`Steps completed: ${executionResult.steps.length}`);
                console.log(`Final output:`, JSON.stringify(executionResult.finalOutput, null, 2));
                
                // Store the complete execution result
                executionDataStore[workflowId + '_execution'] = executionResult;
                
            } catch (executionError) {
                console.error(`❌ Workflow ${workflowId} execution failed:`, executionError.message);
                
                // Store the execution error
                executionDataStore[workflowId + '_execution'] = {
                    error: executionError.message,
                    timestamp: new Date().toISOString()
                };
            }
        } else {
            console.log(`ℹ️ Workflow ${workflowId} is not registered for auto-execution (manual mode)`);
        }
        
        res.status(200).send('OK');

    } catch (error) {
        console.error('❌ Error processing Telegram webhook:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    handleTelegramWebhook,
    executionDataStore, // Export the store so other modules can access it
};
