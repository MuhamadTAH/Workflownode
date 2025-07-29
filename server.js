/*
=================================================================
BACKEND FILE: server.js (UPDATED)
=================================================================
*/
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { google } = require('googleapis');

dotenv.config();

// Initialize Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Store tokens in memory (in production, use a database)
let tokens = null;

const webhookRoutes = require('./src/api/routes/webhooks');
const workflowRoutes = require('./src/api/routes/workflows');
const telegramRoutes = require('./src/api/routes/telegram');
const nodeRoutes = require('./src/api/routes/nodes');
const aiRoutes = require('./src/api/routes/ai'); // <-- Import new routes

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
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
app.get('/auth/google', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/documents'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.json({ url });
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Store tokens globally
    global.tokens = tokens;
    res.send('<script>window.close();</script>');
  } catch (error) {
    console.error('Error getting OAuth2 tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/auth/status', async (req, res) => {
  if (!global.tokens) {
    return res.json({ isAuthenticated: false });
  }
  
  try {
    oauth2Client.setCredentials(global.tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    res.json({ 
      isAuthenticated: true, 
      email: userInfo.data.email 
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.json({ isAuthenticated: false });
  }
});

// Google Docs API Routes
app.post('/api/get-doc', async (req, res) => {
  const { docUrl } = req.body;
  
  if (!global.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }
  
  try {
    // Extract document ID from URL
    const match = docUrl.match(/\/d\/(.*?)\//);
    if (!match) {
      return res.status(400).json({ error: 'Invalid Google Docs URL' });
    }
    const documentId = match[1];
    
    oauth2Client.setCredentials(global.tokens);
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
  
  if (!global.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }
  
  try {
    // Extract document ID from URL
    const match = docUrl.match(/\/d\/(.*?)\//);
    if (!match) {
      return res.status(400).json({ error: 'Invalid Google Docs URL' });
    }
    const documentId = match[1];
    
    oauth2Client.setCredentials(global.tokens);
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
  
  if (!global.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }
  
  try {
    oauth2Client.setCredentials(global.tokens);
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
