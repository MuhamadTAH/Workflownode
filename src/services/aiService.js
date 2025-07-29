/*
=================================================================
BACKEND FILE: src/services/aiService.js (NEW FILE)
=================================================================
This service handles all communications with external AI APIs.
*/
const axios = require('axios');

const callClaudeApi = async (apiKey, userMessage) => {
    try {
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [{ role: 'user', content: userMessage }],
                system: 'You are a helpful AI assistant.'
            },
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
            return response.data.content[0].text;
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
