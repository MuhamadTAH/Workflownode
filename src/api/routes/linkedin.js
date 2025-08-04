/**
 * LinkedIn OAuth2 Routes
 * Handles LinkedIn authentication flow for workflow automation
 */

const express = require('express');
const router = express.Router();
const linkedinService = require('../../services/linkedinService');

/**
 * POST /api/linkedin/auth-url
 * Generate LinkedIn authorization URL for OAuth flow
 */
router.post('/auth-url', async (req, res) => {
    try {
        const { state } = req.body;
        const authUrl = linkedinService.getAuthorizationUrl(state);
        
        console.log('🔗 LinkedIn: Generated auth URL');
        res.json({ 
            success: true, 
            authUrl,
            message: 'LinkedIn authorization URL generated successfully'
        });
    } catch (error) {
        console.error('❌ LinkedIn auth URL generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to generate LinkedIn authorization URL'
        });
    }
});

/**
 * POST /api/linkedin/exchange-token
 * Exchange authorization code for access tokens
 */
router.post('/exchange-token', async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Authorization code is required',
                message: 'Missing authorization code from LinkedIn OAuth callback'
            });
        }

        const tokenData = await linkedinService.exchangeCodeForToken(code);
        
        console.log('✅ LinkedIn: Successfully exchanged code for tokens');
        res.json({ 
            success: true, 
            tokenData,
            message: 'LinkedIn tokens obtained successfully'
        });
    } catch (error) {
        console.error('❌ LinkedIn token exchange error:', error);
        res.status(400).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to exchange authorization code for tokens'
        });
    }
});

/**
 * POST /api/linkedin/refresh-token
 * Refresh LinkedIn access token
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ 
                success: false, 
                error: 'Refresh token is required',
                message: 'Missing refresh token for token renewal'
            });
        }

        const tokenData = await linkedinService.refreshAccessToken(refreshToken);
        
        console.log('✅ LinkedIn: Successfully refreshed access token');
        res.json({ 
            success: true, 
            tokenData,
            message: 'LinkedIn token refreshed successfully'
        });
    } catch (error) {
        console.error('❌ LinkedIn token refresh error:', error);
        res.status(400).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to refresh LinkedIn access token'
        });
    }
});

/**
 * POST /api/linkedin/verify-token
 * Verify LinkedIn token validity by making a test API call
 */
router.post('/verify-token', async (req, res) => {
    try {
        const { tokenData } = req.body;
        
        if (!tokenData || !tokenData.access_token) {
            return res.status(400).json({ 
                success: false, 
                error: 'Token data is required',
                message: 'Missing LinkedIn token data for verification'
            });
        }

        // Test token by getting user profile
        const profileResponse = await linkedinService.getProfile(tokenData);
        
        console.log('✅ LinkedIn: Token verification successful');
        res.json({ 
            success: true, 
            valid: true,
            profile: profileResponse.data,
            message: 'LinkedIn token is valid'
        });
    } catch (error) {
        console.error('❌ LinkedIn token verification error:', error);
        res.status(401).json({ 
            success: false, 
            valid: false,
            error: error.message,
            message: 'LinkedIn token verification failed'
        });
    }
});

module.exports = router;