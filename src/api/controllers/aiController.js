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

// Generate demo responses for common chatbot requests - ENHANCED WITH ALL NODE TYPES
const generateDemoResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    
    // TRIGGER NODES
    if (lowerMsg.includes('add') && (lowerMsg.includes('telegram') || lowerMsg.includes('trigger'))) {
        return `I'll add a Telegram trigger node for you! This will start your workflow when messages are received.

{"action": "addNode", "nodeType": "trigger", "label": "Telegram Trigger", "position": {"x": 100, "y": 100}}`;
    }
    
    // ACTION NODES
    if (lowerMsg.includes('add') && lowerMsg.includes('ai agent')) {
        return `Great! I'll add an AI Agent node that can process data and generate intelligent responses.

{"action": "addNode", "nodeType": "aiAgent", "label": "AI Agent", "position": {"x": 350, "y": 100}}`;
    }
    
    if (lowerMsg.includes('add') && (lowerMsg.includes('model') || lowerMsg.includes('chat'))) {
        return `I'll add a Model Node for you! This provides real-time chat functionality with AI.

{"action": "addNode", "nodeType": "modelNode", "label": "Model Node", "position": {"x": 350, "y": 150}}`;
    }
    
    if (lowerMsg.includes('add') && (lowerMsg.includes('google') || lowerMsg.includes('docs'))) {
        return `I'll add a Google Docs node! This can read, write, and create Google Documents.

{"action": "addNode", "nodeType": "googleDocs", "label": "Google Docs", "position": {"x": 350, "y": 200}}`;
    }
    
    if (lowerMsg.includes('add') && (lowerMsg.includes('storage') || lowerMsg.includes('database'))) {
        return `I'll add a Data Storage node to store and retrieve information in your workflow.

{"action": "addNode", "nodeType": "dataStorage", "label": "Data Storage", "position": {"x": 350, "y": 250}}`;
    }
    
    if (lowerMsg.includes('add') && lowerMsg.includes('send')) {
        return `I'll add a Telegram Send Message node to send responses back to users.

{"action": "addNode", "nodeType": "telegramSendMessage", "label": "Telegram Send Message", "position": {"x": 600, "y": 100}}`;
    }
    
    if (lowerMsg.includes('add') && (lowerMsg.includes('file') || lowerMsg.includes('convert'))) {
        return `I'll add a File Converter node to handle file processing and conversion.

{"action": "addNode", "nodeType": "fileConverter", "label": "File Converter", "position": {"x": 350, "y": 300}}`;
    }
    
    // LOGIC NODES
    if (lowerMsg.includes('add') && lowerMsg.includes('if')) {
        return `I'll add an If node for conditional routing - perfect for creating branching logic in your workflow.

{"action": "addNode", "nodeType": "if", "label": "If", "position": {"x": 200, "y": 100}}`;
    }
    
    if (lowerMsg.includes('add') && lowerMsg.includes('filter')) {
        return `I'll add a Filter node to help you process and filter your data based on conditions.

{"action": "addNode", "nodeType": "filter", "label": "Filter", "position": {"x": 200, "y": 150}}`;
    }
    
    if (lowerMsg.includes('add') && lowerMsg.includes('merge')) {
        return `I'll add a Merge node to combine data from multiple sources into one stream.

{"action": "addNode", "nodeType": "merge", "label": "Merge", "position": {"x": 200, "y": 200}}`;
    }
    
    if (lowerMsg.includes('add') && lowerMsg.includes('set data')) {
        return `I'll add a Set Data node to create custom key-value pairs for your workflow.

{"action": "addNode", "nodeType": "setData", "label": "Set Data", "position": {"x": 200, "y": 250}}`;
    }
    
    if (lowerMsg.includes('add') && lowerMsg.includes('switch')) {
        return `I'll add a Switch node for multi-path routing based on different conditions.

{"action": "addNode", "nodeType": "switch", "label": "Switch", "position": {"x": 200, "y": 300}}`;
    }
    
    if (lowerMsg.includes('add') && (lowerMsg.includes('wait') || lowerMsg.includes('delay'))) {
        return `I'll add a Wait node to pause your workflow execution for a specified time.

{"action": "addNode", "nodeType": "wait", "label": "Wait", "position": {"x": 200, "y": 350}}`;
    }
    
    if (lowerMsg.includes('add') && (lowerMsg.includes('stop') || lowerMsg.includes('error'))) {
        return `I'll add a Stop and Error node to terminate workflow execution with custom error messages.

{"action": "addNode", "nodeType": "stopAndError", "label": "Stop and Error", "position": {"x": 200, "y": 400}}`;
    }
    
    if (lowerMsg.includes('add') && lowerMsg.includes('loop')) {
        return `I'll add a Loop node to iterate over data in batches - perfect for processing lists of items.

{"action": "addNode", "nodeType": "loop", "label": "Loop", "position": {"x": 200, "y": 450}}`;
    }
    
    if (lowerMsg.includes('add') && lowerMsg.includes('compare')) {
        return `I'll add a Compare Datasets node to identify differences between two sets of data.

{"action": "addNode", "nodeType": "compareDatasets", "label": "Compare Datasets", "position": {"x": 200, "y": 500}}`;
    }
    
    if (lowerMsg.includes('add') && (lowerMsg.includes('sub') || lowerMsg.includes('workflow'))) {
        return `I'll add an Execute Sub Workflow node to run nested workflows within your main workflow.

{"action": "addNode", "nodeType": "executeSubWorkflow", "label": "Execute Sub Workflow", "position": {"x": 200, "y": 550}}`;
    }
    
    // CONNECTION COMMANDS
    if (lowerMsg.includes('connect')) {
        return `I'll connect your nodes to create a workflow path. This allows data to flow from one node to the next.

{"action": "connectNodes", "sourceId": "dndnode_0", "targetId": "dndnode_1"}`;
    }
    
    // HELP AND INFO
    if (lowerMsg.includes('what') || lowerMsg.includes('show') || lowerMsg.includes('help') || lowerMsg.includes('list')) {
        return `I can help you build workflows with ALL available node types:

🎯 **Trigger Nodes:**
• "Add a Telegram trigger" - Starts workflows from messages

🔧 **Action Nodes:**
• "Add an AI agent" - AI processing and responses
• "Add a model node" - Real-time AI chat
• "Add Google Docs" - Document automation  
• "Add data storage" - Store and retrieve data
• "Add Telegram send message" - Send responses
• "Add file converter" - File processing

🧠 **Logic Nodes:**
• "Add an if node" - Conditional routing
• "Add a filter node" - Data filtering
• "Add a merge node" - Combine data streams
• "Add set data" - Create custom data
• "Add a switch node" - Multi-path routing
• "Add a wait node" - Delay execution
• "Add a loop node" - Iterate over data
• "Add compare datasets" - Find differences
• "Add sub workflow" - Nested workflows

💡 **Commands:**
• "Connect them" - Links the last two nodes
• "Show me what I have" - Lists current nodes

Just tell me what you want to add!`;
    }
    
    return `I understand you want to work with your workflow. I can help you add ANY type of node and connect them! 

Try commands like:
• "Add a Telegram trigger"
• "Add an AI agent" 
• "Add a filter node"
• "Add a wait node"
• "Connect them"

What would you like to add to your workflow?`;
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