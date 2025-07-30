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

const webhookRoutes = require('./src/api/routes/webhooks');
const workflowRoutes = require('./src/api/routes/workflows');
const telegramRoutes = require('./src/api/routes/telegram');
const nodeRoutes = require('./src/api/routes/nodes');
const aiRoutes = require('./src/api/routes/ai');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: [
    'http://localhost:3005',
    'http://localhost:3000',
    'https://workflownode.onrender.com',
    'https://workflownode-1.onrender.com'
  ],
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-workflow-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.REDIRECT_URI // This is still good practice
}, async (accessToken, refreshToken, profile, done) => {
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
app.use('/api/ai', aiRoutes);

// --- UPDATED GOOGLE OAUTH ROUTE ---
// We now explicitly pass the callbackURL in the authenticate call to guarantee it's used.
app.get('/auth/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/documents'],
    accessType: 'offline',
    prompt: 'consent',
    callbackURL: process.env.REDIRECT_URI // Explicitly setting it here
  })(req, res, next);
});

app.get('/oauth2callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    session: true,
    callbackURL: process.env.REDIRECT_URI // Also good practice to have it here
  }),
  function (req, res) {
    console.log('=== OAuth callback successful ===');
    console.log('👤 User authenticated:', req.user.email);
    res.send(`
      <html>
        <body>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2>✅ Authentication Successful!</h2>
            <p>Welcome ${req.user.name}!</p>
            <p>You can close this window now.</p>
            <script>
              setTimeout(() => { window.close(); }, 2000);
            </script>
          </div>
        </body>
      </html>
    `);
  }
);

app.get('/auth/status', (req, res) => {
  console.log('=== Auth Status Check ===');
  console.log('👤 User authenticated:', !!req.user);
  if (!req.user) {
    return res.json({ isAuthenticated: false });
  }
  res.json({
    isAuthenticated: true,
    email: req.user.email,
    name: req.user.name
  });
});

// ... (rest of your Google Docs API routes)

app.listen(PORT, () => {
    console.log(`Backend server is listening on port ${PORT}`);
});
