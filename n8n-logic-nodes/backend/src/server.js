/*
=================================================================
BACKEND FILE: backend/src.js (UPDATED)
=================================================================
This file has been updated with a more robust CORS configuration
to resolve the "Failed to fetch" error. This is a more standard
and reliable way to handle cross-origin requests.
*/
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');

// Load environment variables from .env file
dotenv.config();

// Import route handlers
const nodeRoutes = require('./api/routes/nodes');
const aiRoutes = require('./api/routes/ai');

const app = express();
const PORT = process.env.PORT || 10000;

// === Middleware Setup ===

// NEW: More robust CORS configuration
const allowedOrigins = [
  'http://localhost:3005',
  'http://localhost:3000',
  'http://localhost:5005',
  'http://localhost:3002', // <-- ADDED: Backend's own origin
  'https://workflownode.onrender.com',
  'https://workflownode-1.onrender.com'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Session management for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-workflow-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    sameSite: 'none', // Required for cross-site cookies
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// === Passport (Google OAuth) Configuration ===

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI
  }, async (accessToken, refreshToken, profile, done) => {
    // User profile information from Google
    const user = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken // This is crucial for offline access
      }
    };
    return done(null, user);
}));

// Middleware to parse JSON bodies
app.use(express.json());

// === API Routes ===

app.get('/', (req, res) => {
    res.send('Workflow Automation Backend is running!');
});

// Register API routes
app.use('/api/nodes', nodeRoutes);
app.use('/api/ai', aiRoutes);

// === Authentication Routes ===

// 1. Initial request to Google for authentication
app.get('/auth/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/documents'], // Request access to Google Docs
    accessType: 'offline', // Request a refresh token
    prompt: 'consent', // Ensure user consents and gets a refresh token every time
    callbackURL: process.env.REDIRECT_URI
  })(req, res, next);
});

// 2. Google's callback URL after user grants permission
app.get('/oauth2callback',
  passport.authenticate('google', {
    failureRedirect: '/', // Redirect on failure
    session: true,
    callbackURL: process.env.REDIRECT_URI
  }),
  function (req, res) {
    // On success, show a confirmation message and close the window
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

// 3. Route for the frontend to check authentication status
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

// === Start Server ===
app.listen(PORT, () => {
    console.log(`Backend server is listening on port ${PORT}`);
});
