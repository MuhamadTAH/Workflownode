/*
=================================================================
BACKEND FILE: src/services/aiService.js (NEW FILE)
=================================================================
This service handles all communications with external AI APIs.
*/
const axios = require('axios');

const callClaudeApi = async (apiKey, userMessage, systemPrompt = 'You are a helpful AI assistant.', conversationHistory = []) => {
    const startTime = Date.now(); // Start timing
    
    try {
        // Ensure system prompt is not empty or undefined
        const finalSystemPrompt = systemPrompt && systemPrompt.trim() ? systemPrompt.trim() : 'You are a helpful AI assistant.';
        
        // Build messages array with conversation history
        const messages = [];
        
        // Add conversation history (last 10 messages to stay within limits)
        if (conversationHistory && conversationHistory.length > 0) {
            const recentHistory = conversationHistory.slice(-10);
            for (const exchange of recentHistory) {
                if (exchange.user) {
                    messages.push({ role: 'user', content: exchange.user });
                }
                if (exchange.ai) {
                    messages.push({ role: 'assistant', content: exchange.ai });
                }
            }
        }
        
        // Add current user message
        messages.push({ role: 'user', content: userMessage });
        
        // Debug logging to see what prompts are being sent
        console.log('🔍 Claude API Call Debug:');
        console.log('📝 System Prompt:', finalSystemPrompt);
        console.log('💬 Current Message:', userMessage);
        console.log('🧠 Conversation History:', conversationHistory ? conversationHistory.length : 0, 'messages');
        
        const requestBody = {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: messages,
            system: finalSystemPrompt
        };
        
        console.log('📡 Request Body:', JSON.stringify(requestBody, null, 2));
        
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            requestBody,
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
            }
        );

        // Extract the text content from Claude's response
        if (response.data && response.data.content && response.data.content.length > 0) {
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            
            // Return both the response and processing time
            return {
                text: response.data.content[0].text,
                processingTime: processingTime
            };
        } else {
            throw new Error('Invalid response structure from Claude API.');
        }
    } catch (error) {
        console.error('Error calling Claude API:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get response from Claude API.');
    }
};

module.exports = {
    callClaudeApi,
};
