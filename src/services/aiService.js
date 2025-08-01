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

// Disabled: Verify Claude API key validity - SDK functionality turned off
const verifyClaudeApiKey = async (apiKey) => {
    console.log('⚠️ Claude SDK API key verification is currently disabled');
    console.log('🔑 API Key provided:', apiKey ? 'Yes' : 'No');
    
    // Return mock verification response
    return { 
        valid: false, 
        error: 'Claude SDK is currently disabled',
        status: 'disabled'
    };
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