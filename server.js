const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // <-- Import CORS

// Load environment variables from .env file
dotenv.config();

// Import routes
const webhookRoutes = require('./src/api/routes/webhooks');
const workflowRoutes = require('./src/api/routes/workflows');
const telegramRoutes = require('./src/api/routes/telegram'); // <-- Import new routes

const app = express();
const PORT = process.env.PORT || 3010; // Using 3010 for backend

// --- MIDDLEWARE ---
app.use(cors()); // <-- Enable CORS for all routes
app.use(express.json());

// --- ROUTES ---
app.get('/', (req, res) => {
    res.send('Workflow Automation Backend is running!');
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/telegram', telegramRoutes); // <-- Register new routes

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`Backend server is listening on port ${PORT}`);
});