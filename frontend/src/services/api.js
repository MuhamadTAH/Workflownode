/*
=================================================================
FILE: frontend/src/services/api.js
=================================================================
Frontend API service for communicating with the backend.
Includes Claude API calls for the conversational chatbot.
*/

const API_BASE_URL = 'https://workflownode.onrender.com';

// Call Claude API for chatbot responses
export const callClaudeApi = async (apiKey, userMessage, systemPrompt = 'You are a helpful assistant.') => {
  try {
    console.log('🤖 Calling Claude API for chatbot response');
    
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: apiKey || 'demo-key', // Use demo key for chatbot
        userMessage,
        systemPrompt,
        conversationHistory: []
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
};

// Generic API call helper
export const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

export default {
  callClaudeApi,
  apiCall,
};