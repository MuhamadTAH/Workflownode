/*
=================================================================
BACKEND FILE: server.js (UPDATED)
=================================================================
*/
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

dotenv.config();

// Initialize Google OAuth2 Client
console.log('Initializing OAuth2 client with:');
console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('REDIRECT_URI:', process.env.REDIRECT_URI);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Tokens are now stored in user sessions

const webhookRoutes = require('./src/api/routes/webhooks');
const workflowRoutes = require('./src/api/routes/workflows');
const telegramRoutes = require('./src/api/routes/telegram');
const nodeRoutes = require('./src/api/routes/nodes');
const aiRoutes = require('./src/api/routes/ai');
const channelBotRoutes = require('./src/api/routes/channelBot');
const linkedinRoutes = require('./src/api/routes/linkedin');
const whatsappRoutes = require('./src/api/routes/whatsapp');
const instagramRoutes = require('./src/api/routes/instagram');

// Initialize workflow executor service
const workflowExecutor = require('./src/services/workflowExecutor');
console.log('✅ Workflow Executor service initialized');

// Initialize channel bot scheduler
const channelBotScheduler = require('./src/services/channelBotScheduler');
channelBotScheduler.start();
console.log('✅ Channel Bot Scheduler initialized and started');

const app = express();
const PORT = process.env.PORT || 10000;

// Configure CORS with credentials
app.use(cors({
  origin: [
    'http://localhost:3005', 
    'http://localhost:3000', 
    'https://workflownode.onrender.com',
    'https://workflownode-1.onrender.com' // Add frontend URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Configure session with secure cookies for Render
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-workflow-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false, // Changed to false for better security
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true on Render (HTTPS)
    httpOnly: true,
    sameSite: 'none', // Required for cross-origin cookies on Render
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.REDIRECT_URI
}, async (accessToken, refreshToken, profile, done) => {
  // Store both profile and tokens
  const user = {
    id: profile.id,
    name: profile.displayName,
    email: profile.emails[0].value,
    tokens: {
      access_token: accessToken,
      refresh_token: refreshToken
    }
  };
  return done(null, user);
}));

app.use(express.json());

// Handle preflight requests explicitly
app.options('*', cors());

app.get('/', (req, res) => {
    res.send('Workflow Automation Backend is running!');
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/ai', aiRoutes); // <-- Register new routes
app.use('/api/channel-bot', channelBotRoutes);
app.use('/api/linkedin', linkedinRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/instagram', instagramRoutes);

// Create temp-files directory if it doesn't exist
const tempFilesDir = path.join(__dirname, 'temp-files');
fs.mkdir(tempFilesDir, { recursive: true }).catch(() => {});

// Serve temporary files with video-optimized headers
app.use('/temp-files', express.static(tempFilesDir, {
  maxAge: '24h', // Cache for 24 hours
  etag: true,
  lastModified: true,
  setHeaders: (res, path, stat) => {
    // Add video-specific headers for better browser compatibility
    if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.avi')) {
      res.set({
        'Accept-Ranges': 'bytes', // Enable range requests for video seeking
        'Content-Type': path.endsWith('.mp4') ? 'video/mp4' : 
                       path.endsWith('.webm') ? 'video/webm' : 
                       path.endsWith('.avi') ? 'video/x-msvideo' : 'video/mp4',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=86400'
      });
    }
    // Add image-specific headers
    else if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.set({
        'Content-Type': path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' :
                       path.endsWith('.png') ? 'image/png' :
                       path.endsWith('.gif') ? 'image/gif' :
                       path.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=86400'
      });
    }
  }
}));

// API endpoint to delete temp files
app.delete('/temp-files/delete/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileDir = path.join(tempFilesDir, fileId);
    
    // Remove the entire directory for this file
    await fs.rmdir(fileDir, { recursive: true });
    
    console.log(`Temp file deleted: ${fileId}`);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting temp file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Google OAuth2 Authentication Routes
// Google OAuth routes using Passport
app.get('/auth/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/documents'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

app.get('/oauth2callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    session: true
  }),
  function (req, res) {
    console.log('=== OAuth callback successful ===');
    console.log('👤 User authenticated:', req.user.email);
    console.log('🔐 Session ID:', req.sessionID);
    console.log('🍪 Setting session cookie for user:', req.user.name);
    
    // Redirect back to frontend after successful authentication
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://workflownode-1.onrender.com' 
      : 'http://localhost:3005';
      
    res.send(`
      <html>
        <body>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2>✅ Authentication Successful!</h2>
            <p>Welcome ${req.user.name}!</p>
            <p>You can close this window now.</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 2000);
            </script>
          </div>
        </body>
      </html>
    `);
  }
);

app.get('/auth/status', (req, res) => {
  console.log('=== Auth Status Check ===');
  console.log('🧪 Cookies:', req.headers.cookie || 'No cookies');
  console.log('🔐 Session ID:', req.sessionID || 'No session ID');
  console.log('👤 User authenticated:', !!req.user);
  console.log('📧 Session passport user:', req.user ? req.user.email : 'None');
  
  if (!req.user) {
    console.log('❌ User not authenticated - returning false');
    return res.json({ isAuthenticated: false });
  }
  
  console.log('✅ User authenticated - returning user info');
  // Return user info from Passport session
  res.json({ 
    isAuthenticated: true, 
    email: req.user.email,
    name: req.user.name
  });
});

// Google Docs API Routes
app.post('/api/get-doc', async (req, res) => {
  const { docUrl } = req.body;
  
  if (!req.user || !req.user.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }
  
  try {
    // Extract document ID from URL
    const match = docUrl.match(/\/d\/(.*?)\//);
    if (!match) {
      return res.status(400).json({ error: 'Invalid Google Docs URL' });
    }
    const documentId = match[1];
    
    oauth2Client.setCredentials(req.user.tokens);
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    
    const doc = await docs.documents.get({ documentId });
    
    // Extract text from document
    let text = '';
    if (doc.data.body && doc.data.body.content) {
      for (const element of doc.data.body.content) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements) {
            if (textElement.textRun) {
              text += textElement.textRun.content;
            }
          }
        }
      }
    }
    
    res.json({
      title: doc.data.title,
      content: text,
      documentId: documentId
    });
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

app.post('/api/update-doc', async (req, res) => {
  const { docUrl, content } = req.body;
  
  if (!req.user || !req.user.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }
  
  try {
    // Extract document ID from URL
    const match = docUrl.match(/\/d\/(.*?)\//);
    if (!match) {
      return res.status(400).json({ error: 'Invalid Google Docs URL' });
    }
    const documentId = match[1];
    
    oauth2Client.setCredentials(req.user.tokens);
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    
    // First get the document to find the end index
    const doc = await docs.documents.get({ documentId });
    const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex - 1;
    
    // Append content to the end of the document
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [{
          insertText: {
            location: { index: endIndex },
            text: '\n' + content
          }
        }]
      }
    });
    
    res.json({ success: true, message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

app.post('/api/create-doc', async (req, res) => {
  const { title } = req.body;
  
  if (!req.user || !req.user.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }
  
  try {
    oauth2Client.setCredentials(req.user.tokens);
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    
    const doc = await docs.documents.create({
      requestBody: {
        title: title || 'Untitled Document'
      }
    });
    
    res.json({
      documentId: doc.data.documentId,
      title: doc.data.title,
      url: `https://docs.google.com/document/d/${doc.data.documentId}/edit`
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

app.listen(PORT, () => {
    console.log(`Backend server is listening on port ${PORT}`);
    console.log(`Production webhook URL should use: ${process.env.BASE_URL || 'https://workflownode.onrender.com'}`);
});
