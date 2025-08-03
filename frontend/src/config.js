/*
=================================================================
FRONTEND FILE: src/config.js (UPDATED)
=================================================================
*/

// Configuration for different environments
const config = {
  // Backend URL - can be overridden by environment variable
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'https://workflownode.onrender.com'
};

export default config;