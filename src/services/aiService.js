/*
=================================================================
BACKEND FILE: src/services/aiService.js (ENHANCED WITH CLAUDE SDK)
=================================================================
This service handles all communications with Claude API using the official Anthropic SDK.
*/
const Anthropic = require('@anthropic-ai/sdk');

// Cache SDK instances to avoid recreation
const clientCache = new Map();

// Get or create Claude client instance
const getClaudeClient = (apiKey) => {
    if (!clientCache.has(apiKey)) {
        const client = new Anthropic({
            apiKey: apiKey,
        });
        clientCache.set(apiKey, client);
    }
    return clientCache.get(apiKey);
};

// Enhanced Claude API call with SDK features
const callClaudeApi = async (apiKey, userMessage, systemPrompt = 'You are a helpful AI assistant.', conversationHistory = []) => {
    const startTime = Date.now();
    
    try {
        // Validate API key
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Invalid API key provided');
        }

        // Get Claude client
        const client = getClaudeClient(apiKey);
        
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
        
        // Debug logging
        console.log('🔍 Claude SDK API Call Debug:');
        console.log('📝 System Prompt:', finalSystemPrompt);
        console.log('💬 Current Message:', userMessage);
        console.log('🧠 Conversation History:', conversationHistory ? conversationHistory.length : 0, 'messages');
        
        // Make API call using official SDK
        const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: messages,
            system: finalSystemPrompt
        });

        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        // Extract text from response
        const responseText = response.content[0]?.text || '';
        
        console.log('✅ Claude SDK Response:', {
            textLength: responseText.length,
            processingTime: processingTime + 'ms',
            usage: response.usage
        });
        
        // Return enhanced response with SDK metadata
        return {
            text: responseText,
            processingTime: processingTime,
            usage: response.usage,
            model: response.model,
            id: response.id
        };
        
    } catch (error) {
        console.error('❌ Claude SDK Error:', {
            message: error.message,
            type: error.constructor.name,
            status: error.status,
            headers: error.headers
        });
        
        // Enhanced error handling with SDK error types
        if (error.status === 401) {
            throw new Error('Invalid Claude API key. Please check your credentials.');
        } else if (error.status === 429) {
            throw new Error('Claude API rate limit exceeded. Please try again later.');
        } else if (error.status === 400) {
            throw new Error('Invalid request to Claude API. Please check your input.');
        } else {
            throw new Error(`Claude API error: ${error.message}`);
        }
    }
};

// New: Streaming Claude API call for real-time responses
const callClaudeApiStream = async (apiKey, userMessage, systemPrompt = 'You are a helpful AI assistant.', conversationHistory = []) => {
    try {
        // Validate API key
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Invalid API key provided');
        }

        // Get Claude client
        const client = getClaudeClient(apiKey);
        
        // Ensure system prompt is not empty
        const finalSystemPrompt = systemPrompt && systemPrompt.trim() ? systemPrompt.trim() : 'You are a helpful AI assistant.';
        
        // Build messages array with conversation history
        const messages = [];
        
        // Add conversation history (last 10 messages)
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
        
        console.log('🌊 Claude SDK Streaming Call:', {
            systemPrompt: finalSystemPrompt.substring(0, 100) + '...',
            messageCount: messages.length
        });
        
        // Create streaming request
        const stream = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: messages,
            system: finalSystemPrompt,
            stream: true
        });
        
        return stream;
        
    } catch (error) {
        console.error('❌ Claude SDK Streaming Error:', error.message);
        throw new Error(`Claude streaming error: ${error.message}`);
    }
};

// New: Verify Claude API key validity
const verifyClaudeApiKey = async (apiKey) => {
    try {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, error: 'Invalid API key format' };
        }

        const client = getClaudeClient(apiKey);
        
        // Test with a minimal request
        const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
            system: 'Respond with just "Hello"'
        });
        
        return { 
            valid: true, 
            model: response.model,
            usage: response.usage 
        };
        
    } catch (error) {
        console.error('🔑 API Key Verification Failed:', error.message);
        return { 
            valid: false, 
            error: error.message,
            status: error.status 
        };
    }
};

// New: Get Claude API usage statistics
const getClaudeUsage = async (apiKey) => {
    try {
        // Note: Usage endpoint may not be available in all SDK versions
        // This is a placeholder for future SDK features
        return {
            tokensUsed: 0,
            requestsCount: 0,
            note: 'Usage tracking not yet available in SDK'
        };
    } catch (error) {
        console.error('📊 Usage Stats Error:', error.message);
        return { error: error.message };
    }
};

// Clear client cache (for memory management)
const clearClientCache = () => {
    clientCache.clear();
    console.log('🧹 Claude SDK client cache cleared');
};

module.exports = {
    callClaudeApi,
    callClaudeApiStream,
    verifyClaudeApiKey,
    getClaudeUsage,
    clearClientCache
};