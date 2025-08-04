/*
=================================================================
BACKEND FILE: src/services/aiService.js (NEW FILE)
=================================================================
This service will handle all communications with external AI APIs.
*/
const axios = require('axios');

// Helper function to replace variables in a template
const replaceVariables = (template, data) => {
    if (!data) return template;
    // The input data is often nested, so we look for the actual message object.
    const jsonData = data[0]?.json || data;
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = key.split('.').reduce((o, k) => (o ? o[k] : undefined), jsonData);
        return value !== undefined ? value : match;
    });
};

const callOpenAiApi = async (config, inputData) => {
    const { apiKey, model, systemPrompt, promptTemplate, temperature, maxTokens } = config;

    if (!apiKey) {
        throw new Error('OpenAI API Key is missing.');
    }

    const finalPrompt = replaceVariables(promptTemplate, inputData);

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: model, // e.g., "gpt-4"
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: finalPrompt }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content;
        } else {
            throw new Error('Invalid response structure from OpenAI API.');
        }
    } catch (error) {
        console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
        const errorMessage = error.response?.data?.error?.message || 'Failed to get response from OpenAI API.';
        throw new Error(errorMessage);
    }
};

module.exports = {
    callOpenAiApi,
};
