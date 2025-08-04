/**
 * LinkedIn API Service
 * Handles OAuth2 authentication, token refresh, and API requests for LinkedIn integration
 */

class LinkedInService {
    constructor() {
        this.baseURL = 'https://api.linkedin.com';
        this.authURL = 'https://www.linkedin.com/oauth/v2';
        this.clientId = process.env.LINKEDIN_CLIENT_ID;
        this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        this.redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${process.env.BASE_URL}/auth/linkedin/callback`;
    }

    /**
     * Generate LinkedIn OAuth2 authorization URL
     */
    getAuthorizationUrl(state = null) {
        const scopes = [
            'r_liteprofile',        // Get profile
            'r_organization_social', // Get companies
            'w_organization_social', // Post as organization
            'w_member_social',       // Post as user
            'w_messages',           // Send messages
            'r_analytics'           // Get analytics
        ].join(' ');

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: scopes,
            ...(state && { state })
        });

        return `${this.authURL}/authorization?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code) {
        try {
            const response = await fetch(`${this.authURL}/accessToken`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    redirect_uri: this.redirectUri
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Token exchange failed: ${error}`);
            }

            const data = await response.json();
            
            return {
                access_token: data.access_token,
                expires_in: data.expires_in,
                refresh_token: data.refresh_token,
                scope: data.scope,
                expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
            };
        } catch (error) {
            console.error('❌ LinkedIn token exchange error:', error);
            throw error;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const response = await fetch(`${this.authURL}/accessToken`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Token refresh failed: ${error}`);
            }

            const data = await response.json();
            
            return {
                access_token: data.access_token,
                expires_in: data.expires_in,
                refresh_token: data.refresh_token || refreshToken, // LinkedIn might not return new refresh token
                scope: data.scope,
                expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
            };
        } catch (error) {
            console.error('❌ LinkedIn token refresh error:', error);
            throw error;
        }
    }

    /**
     * Check if token needs refresh
     */
    isTokenExpired(expiresAt) {
        if (!expiresAt) return true;
        const now = new Date();
        const expiry = new Date(expiresAt);
        // Refresh 5 minutes before expiry
        return now >= new Date(expiry.getTime() - 5 * 60 * 1000);
    }

    /**
     * Make authenticated API request with automatic token refresh
     */
    async makeAPIRequest(endpoint, options = {}, tokenData) {
        let { access_token, refresh_token, expires_at } = tokenData;

        // Refresh token if expired
        if (this.isTokenExpired(expires_at) && refresh_token) {
            console.log('🔄 LinkedIn: Refreshing expired token');
            const refreshedTokens = await this.refreshAccessToken(refresh_token);
            access_token = refreshedTokens.access_token;
            // Note: In production, you'd save the refreshed tokens back to storage
        }

        const url = `${this.baseURL}${endpoint}`;
        const requestOptions = {
            ...options,
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`LinkedIn API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            
            return {
                data,
                meta: {
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    rateLimit: {
                        remaining: response.headers.get('X-RateLimit-Remaining'),
                        reset: response.headers.get('X-RateLimit-Reset')
                    }
                }
            };
        } catch (error) {
            console.error(`❌ LinkedIn API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * Get user profile information
     */
    async getProfile(tokenData) {
        return await this.makeAPIRequest('/v2/me', { method: 'GET' }, tokenData);
    }

    /**
     * Get companies user can administer
     */
    async getAdministeredCompanies(tokenData) {
        const endpoint = '/v2/organizations?q=roleAssignee&role=ADMINISTRATOR';
        return await this.makeAPIRequest(endpoint, { method: 'GET' }, tokenData);
    }

    /**
     * Create UGC post (text, link, or image)
     */
    async createUGCPost(tokenData, postData) {
        const { authorType, authorURN, contentType, text, mediaURL, title, description } = postData;

        let shareContent = {
            author: authorURN,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: text || ''
                    }
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        };

        // Handle different content types
        if (contentType === 'link' && mediaURL) {
            shareContent.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
            shareContent.specificContent['com.linkedin.ugc.ShareContent'].media = [{
                status: 'READY',
                originalUrl: mediaURL,
                title: {
                    text: title || 'Shared Link'
                },
                description: {
                    text: description || ''
                }
            }];
        } else if (contentType === 'image' && mediaURL) {
            shareContent.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
            shareContent.specificContent['com.linkedin.ugc.ShareContent'].media = [{
                status: 'READY',
                originalUrl: mediaURL,
                title: {
                    text: title || 'Shared Image'
                }
            }];
        } else {
            shareContent.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'NONE';
        }

        return await this.makeAPIRequest('/v2/ugcPosts', {
            method: 'POST',
            body: JSON.stringify(shareContent)
        }, tokenData);
    }

    /**
     * Send direct message
     */
    async sendMessage(tokenData, messageData) {
        const { recipientURN, subject, body } = messageData;

        const messageContent = {
            recipients: [recipientURN],
            subject: subject || 'Message from Workflow',
            body: body
        };

        return await this.makeAPIRequest('/v2/messages', {
            method: 'POST',
            body: JSON.stringify(messageContent)
        }, tokenData);
    }

    /**
     * Get conversations
     */
    async getConversations(tokenData) {
        return await this.makeAPIRequest('/v2/conversations', { method: 'GET' }, tokenData);
    }

    /**
     * Get basic analytics for user
     */
    async getAnalytics(tokenData) {
        const endpoint = '/v2/me?projection=(id,urn,headline)';
        return await this.makeAPIRequest(endpoint, { method: 'GET' }, tokenData);
    }
}

module.exports = new LinkedInService();