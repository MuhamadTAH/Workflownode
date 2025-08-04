
/*
=================================================================
BACKEND FILE: src/api/controllers/aiController.js (NEW FILE)
=================================================================
*/
const axios = require('axios');

const verifyClaudeApiKey = async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).send({ message: 'API Key is required.' });
    }

    try {
        await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'test' }],
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
            }
        );
        res.status(200).send({ ok: true, message: 'Claude API Key is valid.' });
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return res.status(401).send({ ok: false, message: 'Invalid Claude API Key.' });
        }
        console.error('Claude API key verification failed:', error.message);
        res.status(500).send({ ok: false, message: 'Failed to verify key. See server logs for details.' });
    }
};

module.exports = {
    verifyClaudeApiKey,
};
