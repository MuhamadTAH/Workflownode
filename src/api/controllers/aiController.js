/*
=================================================================
BACKEND FILE: src/api/controllers/aiController.js (NEW FILE)
=================================================================
This controller will handle AI-related actions, like verifying API keys.
*/
const axios = require('axios');

const verifyClaudeApiKey = async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ ok: false, message: 'API Key is required.' });
    }

    try {
        // We make a simple, low-cost call to the Claude API to check for authentication.
        // A successful request (even if it has other errors) means the key is valid.
        // A 401 error means the key is invalid.
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hello' }]
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            }
        );

        // If the request above does not throw an error, the key is valid.
        res.status(200).json({ ok: true, message: 'Claude API Key is valid.' });

    } catch (error) {
        // The API will return a 401 Unauthorized error for an invalid key.
        if (error.response && error.response.status === 401) {
            return res.status(200).json({ ok: false, message: 'Invalid Claude API Key.' });
        }
        // Handle other potential errors (network, etc.)
        console.error('Claude API key verification failed:', error.message);
        res.status(200).json({ ok: false, message: `Failed to verify key: ${error.message}` });
    }
};

module.exports = {
    verifyClaudeApiKey,
};
