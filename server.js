const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const webhookRoutes = require('./src/api/routes/webhooks');
const workflowRoutes = require('./src/api/routes/workflows');
const telegramRoutes = require('./src/api/routes/telegram');

const app = express();
const PORT = process.env.PORT || 3012;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Workflow Automation Backend is running!');
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/telegram', telegramRoutes);

app.listen(PORT, () => {
    console.log(`Backend server is listening on port ${PORT}`);
    // Important: For production, ensure your .env file's BASE_URL is set to your Render URL.
    console.log(`Production webhook URL should use: ${process.env.BASE_URL || 'https://workflownode.onrender.com'}`);
});