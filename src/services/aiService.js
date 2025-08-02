/*
=================================================================
BACKEND FILE: src/services/aiService.js (SDK DISABLED)
=================================================================
This service has Claude SDK functionality disabled - returns mock responses only.
The @anthropic-ai/sdk package is installed but API calls are not made.
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

// Disabled Claude API call - SDK functionality turned off
const callClaudeApi = async (apiKey, userMessage, systemPrompt = 'You are a helpful AI assistant.', conversationHistory = []) => {
    console.log('⚠️ Claude SDK API calls are currently disabled');
    console.log('📝 System Prompt:', systemPrompt);
    console.log('💬 User Message:', userMessage);
    console.log('🧠 Conversation History:', conversationHistory ? conversationHistory.length : 0, 'messages');
    
    // Return mock response to maintain compatibility
    return {
        text: `Claude API is currently disabled. This is a mock response for: "${userMessage}"`,
        processingTime: 100,
        usage: { input_tokens: 0, output_tokens: 0 },
        model: 'claude-3-5-sonnet-20241022',
        id: 'mock-message-id'
    };
};

// Disabled: Streaming Claude API call - SDK functionality turned off
const callClaudeApiStream = async (apiKey, userMessage, systemPrompt = 'You are a helpful AI assistant.', conversationHistory = []) => {
    console.log('⚠️ Claude SDK streaming is currently disabled');
    console.log('📝 System Prompt:', systemPrompt);
    console.log('💬 User Message:', userMessage);
    
    // Return mock stream-like response
    throw new Error('Claude SDK streaming is currently disabled');
};

// ENABLED: Verify Claude API key validity - Real API verification for ConfigPanel only
const verifyClaudeApiKey = async (apiKey) => {
    console.log('🔑 Claude SDK API key verification is ENABLED for ConfigPanel');
    console.log('🔑 API Key provided:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');
    
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
        return { 
            valid: false, 
            error: 'Invalid API key format',
            status: 'invalid'
        };
    }

    try {
        // Create Claude client for verification
        const client = new Anthropic({
            apiKey: apiKey,
        });

        // Make a minimal API call to verify the key works
        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307', // Use cheapest model for verification
            max_tokens: 5, // Minimal tokens to reduce cost
            messages: [{ role: 'user', content: 'Hi' }]
        });

        console.log('✅ Claude API key verification successful');
        
        // Return success with available models
        return { 
            valid: true, 
            message: 'API key is valid and working',
            availableModels: [
                'claude-3-5-sonnet-20241022',
                'claude-3-opus-20240229', 
                'claude-3-sonnet-20240229',
                'claude-3-haiku-20240307'
            ],
            status: 'valid'
        };

    } catch (error) {
        console.error('❌ Claude API key verification failed:', error.message);
        
        let errorMessage = 'Invalid API key';
        if (error.status === 401) {
            errorMessage = 'Invalid API key - Check your Claude API key';
        } else if (error.status === 429) {
            errorMessage = 'Rate limited - Try again later';
        } else if (error.status === 400) {
            errorMessage = 'Bad request - Check API key format';
        }
        
        return { 
            valid: false, 
            error: errorMessage,
            status: 'invalid'
        };
    }
};

// Disabled: Get Claude API usage statistics - SDK functionality turned off
const getClaudeUsage = async (apiKey) => {
    console.log('⚠️ Claude SDK usage statistics are currently disabled');
    
    return {
        tokensUsed: 0,
        requestsCount: 0,
        note: 'Claude SDK is currently disabled'
    };
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