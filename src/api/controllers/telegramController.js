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
                timeout: 1 // Short polling timeout
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
        console.error('Failed to get Telegram updates:', error.response ? error.response.data : error.message);
        
        // More specific error messages
        let errorMessage = 'Failed to get Telegram updates. Check your bot token.';
        let statusCode = 400;
        
        if (error.response) {
            // Telegram API returned an error
            if (error.response.status === 401) {
                errorMessage = 'Invalid bot token. Please check your Telegram Bot API token.';
                statusCode = 401;
            } else if (error.response.data && error.response.data.description) {
                errorMessage = `Telegram API Error: ${error.response.data.description}`;
            }
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage = 'Network error. Could not connect to Telegram API.';
            statusCode = 503;
        }
        
        res.status(statusCode).send({
            ok: false,
            message: errorMessage,
            error: error.response ? error.response.data : error.message
        });
    }
};

const deleteWebhook = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ message: 'Token is required.' });
    }

    try {
        const telegramApiUrl = `https://api.telegram.org/bot${token}/deleteWebhook`;
        const response = await axios.post(telegramApiUrl);

        if (response.data.ok) {
            res.status(200).send({
                ok: true,
                message: 'Webhook deleted successfully. You can now use getUpdates.',
                result: response.data.result
            });
        } else {
            throw new Error(response.data.description || 'Failed to delete webhook.');
        }
    } catch (error) {
        console.error('Failed to delete Telegram webhook:', error.response ? error.response.data : error.message);
        
        let errorMessage = 'Failed to delete webhook.';
        let statusCode = 400;
        
        if (error.response) {
            if (error.response.status === 401) {
                errorMessage = 'Invalid bot token.';
                statusCode = 401;
            } else if (error.response.data && error.response.data.description) {
                errorMessage = `Telegram API Error: ${error.response.data.description}`;
            }
        }
        
        res.status(statusCode).send({
            ok: false,
            message: errorMessage,
            error: error.response ? error.response.data : error.message
        });
    }
};

const sendMessage = async (req, res) => {
    const { token, chatId, message } = req.body;

    if (!token) {
        return res.status(400).send({ message: 'Bot token is required.' });
    }

    if (!chatId) {
        return res.status(400).send({ message: 'Chat ID is required.' });
    }

    if (!message) {
        return res.status(400).send({ message: 'Message is required.' });
    }

    try {
        const telegramApiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await axios.post(telegramApiUrl, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML' // Allow basic HTML formatting
        });

        if (response.data.ok) {
            res.status(200).send({
                ok: true,
                message: 'Message sent successfully',
                result: response.data.result,
                sentTo: chatId,
                messageText: message
            });
        } else {
            throw new Error(response.data.description || 'Failed to send message.');
        }
    } catch (error) {
        console.error('Failed to send Telegram message:', error.response ? error.response.data : error.message);
        
        let errorMessage = 'Failed to send message.';
        let statusCode = 400;
        
        if (error.response) {
            if (error.response.status === 401) {
                errorMessage = 'Invalid bot token.';
                statusCode = 401;
            } else if (error.response.status === 400) {
                if (error.response.data && error.response.data.description) {
                    if (error.response.data.description.includes('chat not found')) {
                        errorMessage = 'Chat ID not found. Make sure the chat ID is correct and the bot has access to that chat.';
                    } else if (error.response.data.description.includes('bot was blocked')) {
                        errorMessage = 'Bot was blocked by the user.';
                    } else {
                        errorMessage = `Telegram API Error: ${error.response.data.description}`;
                    }
                }
            }
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage = 'Network error. Could not connect to Telegram API.';
            statusCode = 503;
        }
        
        res.status(statusCode).send({
            ok: false,
            message: errorMessage,
            error: error.response ? error.response.data : error.message
        });
    }
};

module.exports = {
    verifyToken,
    getUpdates,
    deleteWebhook,
    sendMessage,
};