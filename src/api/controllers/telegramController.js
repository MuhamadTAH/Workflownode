const axios = require('axios');

const verifyToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ message: 'Token is required.' });
    }

    try {
        const telegramApiUrl = `https://api.telegram.org/bot${token}/getMe`;
        const response = await axios.get(telegramApiUrl);

        if (response.data.ok) {
            // Token is valid, send back the bot info
            res.status(200).send({
                ok: true,
                message: 'Token is valid.',
                bot: response.data.result,
            });
        } else {
            // This case is unlikely as Telegram API would throw an error for invalid tokens
            throw new Error(response.data.description || 'Invalid token.');
        }
    } catch (error) {
        // This block catches errors from axios (e.g., 401 Unauthorized for a bad token)
        console.error('Telegram token verification failed:', error.message);
        res.status(401).send({
            ok: false,
            message: 'Invalid or incorrect Telegram Bot API Token.',
        });
    }
};

const getUpdates = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ message: 'Token is required.' });
    }

    try {
        const telegramApiUrl = `https://api.telegram.org/bot${token}/getUpdates`;
        const response = await axios.get(telegramApiUrl, {
            params: {
                limit: 10, // Get last 10 messages
                offset: -10 // Get most recent messages
            }
        });

        if (response.data.ok) {
            res.status(200).send({
                ok: true,
                updates: response.data.result,
                message: `Retrieved ${response.data.result.length} recent messages.`
            });
        } else {
            throw new Error(response.data.description || 'Failed to get updates.');
        }
    } catch (error) {
        console.error('Failed to get Telegram updates:', error.message);
        res.status(400).send({
            ok: false,
            message: 'Failed to get Telegram updates. Check your bot token.',
            error: error.message
        });
    }
};

module.exports = {
    verifyToken,
    getUpdates,
};