/*
=================================================================
BACKEND FILE: src/api/controllers/aiController.js (ENHANCED WITH CLAUDE SDK)
=================================================================
This controller handles AI-related actions using the official Anthropic Claude SDK.
*/
const { verifyClaudeApiKey, getClaudeUsage, callClaudeApiStream } = require('../../services/aiService');

// Enhanced Claude API key verification using SDK
const verifyClaudeKey = async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ ok: false, message: 'API Key is required.' });
    }

    try {
        const verification = await verifyClaudeApiKey(apiKey);
        
        if (verification.valid) {
            res.status(200).json({ 
                ok: true, 
                message: 'Claude API Key is valid.',
                model: verification.model,
                usage: verification.usage 
            });
        } else {
            res.status(200).json({ 
                ok: false, 
                message: verification.error || 'Invalid Claude API Key.',
                status: verification.status 
            });
        }

    } catch (error) {
        console.error('❌ Claude API key verification failed:', error.message);
        res.status(200).json({ 
            ok: false, 
            message: `Failed to verify key: ${error.message}` 
        });
    }
};

// New: Get Claude API usage statistics
const getUsageStats = async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required.' });
    }

    try {
        const usage = await getClaudeUsage(apiKey);
        res.status(200).json(usage);
    } catch (error) {
        console.error('❌ Failed to get usage stats:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// New: Streaming Claude API endpoint
const streamClaude = async (req, res) => {
    const { apiKey, message, systemPrompt, conversationHistory } = req.body;

    if (!apiKey || !message) {
        return res.status(400).json({ error: 'API Key and message are required.' });
    }

    try {
        // Set headers for Server-Sent Events (SSE)
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        const stream = await callClaudeApiStream(apiKey, message, systemPrompt, conversationHistory);
        
        let fullResponse = '';
        
        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
                const text = chunk.delta?.text || '';
                fullResponse += text;
                
                // Send chunk to client
                res.write(`data: ${JSON.stringify({ 
                    type: 'chunk', 
                    text: text,
                    fullText: fullResponse 
                })}\n\n`);
            } else if (chunk.type === 'message_stop') {
                // Send completion signal
                res.write(`data: ${JSON.stringify({ 
                    type: 'complete', 
                    fullText: fullResponse 
                })}\n\n`);
                break;
            }
        }
        
        res.end();
        
    } catch (error) {
        console.error('❌ Claude streaming error:', error.message);
        res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            error: error.message 
        })}\n\n`);
        res.end();
    }
};

// New: Test Claude SDK connection
const testConnection = async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required.' });
    }

    try {
        const verification = await verifyClaudeApiKey(apiKey);
        
        res.status(200).json({
            connected: verification.valid,
            model: verification.model,
            usage: verification.usage,
            sdk: 'Official Anthropic SDK',
            features: ['Streaming', 'Enhanced Error Handling', 'Usage Tracking'],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    verifyClaudeKey,
    getUsageStats,
    streamClaude,
    testConnection,
    // Maintain backward compatibility
    verifyClaudeApiKey: verifyClaudeKey
};