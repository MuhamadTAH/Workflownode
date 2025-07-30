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
const aiRoutes = require('./src/api/routes/ai'); // <-- Import new routes

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

app.get('/', (req, res) => {
    res.send('Workflow Automation Backend is running!');
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/ai', aiRoutes); // <-- Register new routes

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
