/*
=================================================================
BACKEND FILE: src/api/controllers/aiController.js (ENHANCED WITH CLAUDE SDK)
=================================================================
This controller handles AI-related actions using the official Anthropic Claude SDK.
*/
const { verifyClaudeApiKey, getClaudeUsage, callClaudeApiStream, callClaudeApi } = require('../../services/aiService');

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
                valid: true,
                ok: true, 
                message: verification.message || 'Claude API Key is valid.',
                availableModels: verification.availableModels || [],
                status: verification.status 
            });
        } else {
            res.status(200).json({ 
                valid: false,
                ok: false, 
                message: verification.error || 'Invalid Claude API Key.',
                status: verification.status 
            });
        }

    } catch (error) {
        console.error('❌ Claude API key verification failed:', error.message);
        res.status(200).json({ 
            valid: false,
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

// Chatbot response for conversational workflow building
const chatbotResponse = async (req, res) => {
    const { apiKey, userMessage, systemPrompt, conversationHistory } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: 'User message is required.' });
    }

    try {
        console.log('🤖 Chatbot request received:', userMessage);
        
        // Use a demo response if no API key provided (for demo purposes)
        if (!apiKey || apiKey === 'demo-key') {
            const demoResponse = generateDemoResponse(userMessage);
            return res.status(200).json({
                text: demoResponse,
                usage: { input_tokens: 50, output_tokens: 100 },
                model: 'demo-mode'
            });
        }

        // Call Claude API for real responses
        const response = await callClaudeApi(
            apiKey, 
            userMessage, 
            systemPrompt || 'You are a helpful workflow building assistant.',
            conversationHistory || []
        );
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('❌ Chatbot error:', error.message);
        
        // Fallback to demo response on error
        const fallbackResponse = generateDemoResponse(userMessage);
        res.status(200).json({
            text: fallbackResponse,
            usage: { input_tokens: 0, output_tokens: 0 },
            model: 'fallback-mode',
            note: 'Using fallback response due to API error'
        });
    }
};

// Generate demo responses for common chatbot requests
const generateDemoResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('add') && lowerMsg.includes('telegram')) {
        return `I'll add a Telegram trigger node for you! This will start your workflow when messages are received.

{"action": "addNode", "nodeType": "trigger", "label": "Telegram Trigger", "position": {"x": 100, "y": 100}}`;
    }
    
    if (lowerMsg.includes('add') && lowerMsg.includes('ai')) {
        return `Great! I'll add an AI Agent node that can process data and generate intelligent responses.

{"action": "addNode", "nodeType": "aiAgent", "label": "AI Agent", "position": {"x": 350, "y": 100}}`;
    }
    
    if (lowerMsg.includes('connect')) {
        return `I'll connect your nodes to create a workflow path. This allows data to flow from one node to the next.

{"action": "connectNodes", "sourceId": "dndnode_0", "targetId": "dndnode_1"}`;
    }
    
    if (lowerMsg.includes('filter')) {
        return `I'll add a filter node to help you process and filter your data based on conditions.

{"action": "addNode", "nodeType": "filter", "label": "Filter", "position": {"x": 200, "y": 200}}`;
    }
    
    if (lowerMsg.includes('what') || lowerMsg.includes('show') || lowerMsg.includes('help')) {
        return `I can help you build workflows by understanding commands like:

• "Add a Telegram trigger" - Adds a trigger node
• "Add an AI agent" - Adds an AI processing node  
• "Connect them" - Connects the last two nodes
• "Add a filter node" - Adds data filtering
• "Show me what I have" - Lists your current nodes

Just tell me what you want to add or change in your workflow!`;
    }
    
    return `I understand you want to work with your workflow. I can help you add nodes, connect them, and build automation workflows. Try asking me to "add a telegram trigger" or "add an AI agent" to get started!`;
};

module.exports = {
    verifyClaudeKey,
    getUsageStats,
    streamClaude,
    testConnection,
    chatbotResponse,
    // Maintain backward compatibility
    verifyClaudeApiKey: verifyClaudeKey
};