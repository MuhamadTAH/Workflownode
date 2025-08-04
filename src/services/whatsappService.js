/**
 * WhatsApp Business API Service
 * Handles Meta Graph API integration for comprehensive WhatsApp automation
 * Supports messaging, media, templates, interactive messages, and webhooks
 */

class WhatsAppService {
    constructor() {
        this.baseURL = 'https://graph.facebook.com/v18.0';
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
        this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'whatsapp_verify_token_2025';
        this.webhookUrl = `${process.env.BASE_URL}/api/whatsapp/webhook`;
    }

    /**
     * Make authenticated API request to Meta Graph API
     */
    async makeAPIRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const requestOptions = {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`WhatsApp API error (${response.status}): ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return {
                data,
                meta: {
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries())
                }
            };
        } catch (error) {
            console.error(`❌ WhatsApp API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * Send text message with optional formatting
     */
    async sendTextMessage(to, text, options = {}) {
        console.log('📱 WhatsApp: Sending text message to', to);
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
                body: text,
                preview_url: options.preview_url || false
            }
        };

        return await this.makeAPIRequest(`/${this.phoneNumberId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    /**
     * Send media message (image, video, document, audio)
     */
    async sendMediaMessage(to, mediaType, mediaData, options = {}) {
        console.log(`📱 WhatsApp: Sending ${mediaType} message to`, to);
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: mediaType,
            [mediaType]: {
                ...mediaData,
                caption: options.caption || undefined
            }
        };

        return await this.makeAPIRequest(`/${this.phoneNumberId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    /**
     * Send image message
     */
    async sendImageMessage(to, imageUrl, caption = '') {
        return await this.sendMediaMessage(to, 'image', {
            link: imageUrl
        }, { caption });
    }

    /**
     * Send video message
     */
    async sendVideoMessage(to, videoUrl, caption = '') {
        return await this.sendMediaMessage(to, 'video', {
            link: videoUrl
        }, { caption });
    }

    /**
     * Send document message
     */
    async sendDocumentMessage(to, documentUrl, filename, caption = '') {
        return await this.sendMediaMessage(to, 'document', {
            link: documentUrl,
            filename: filename
        }, { caption });
    }

    /**
     * Send audio message
     */
    async sendAudioMessage(to, audioUrl) {
        return await this.sendMediaMessage(to, 'audio', {
            link: audioUrl
        });
    }

    /**
     * Send template message (pre-approved business templates)
     */
    async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
        console.log('📱 WhatsApp: Sending template message to', to);
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode
                },
                components: components
            }
        };

        return await this.makeAPIRequest(`/${this.phoneNumberId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    /**
     * Send interactive message with buttons
     */
    async sendButtonMessage(to, bodyText, buttons, headerText = '', footerText = '') {
        console.log('📱 WhatsApp: Sending button message to', to);
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'interactive',
            interactive: {
                type: 'button',
                header: headerText ? {
                    type: 'text',
                    text: headerText
                } : undefined,
                body: {
                    text: bodyText
                },
                footer: footerText ? {
                    text: footerText
                } : undefined,
                action: {
                    buttons: buttons.map((button, index) => ({
                        type: 'reply',
                        reply: {
                            id: button.id || `btn_${index}`,
                            title: button.title
                        }
                    }))
                }
            }
        };

        return await this.makeAPIRequest(`/${this.phoneNumberId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    /**
     * Send interactive list message
     */
    async sendListMessage(to, bodyText, buttonText, sections, headerText = '', footerText = '') {
        console.log('📱 WhatsApp: Sending list message to', to);
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'interactive',
            interactive: {
                type: 'list',
                header: headerText ? {
                    type: 'text',
                    text: headerText
                } : undefined,
                body: {
                    text: bodyText
                },
                footer: footerText ? {
                    text: footerText
                } : undefined,
                action: {
                    button: buttonText,
                    sections: sections
                }
            }
        };

        return await this.makeAPIRequest(`/${this.phoneNumberId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    /**
     * Send location message
     */
    async sendLocationMessage(to, latitude, longitude, name = '', address = '') {
        console.log('📱 WhatsApp: Sending location message to', to);
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'location',
            location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                name: name,
                address: address
            }
        };

        return await this.makeAPIRequest(`/${this.phoneNumberId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    /**
     * Send contact message
     */
    async sendContactMessage(to, contacts) {
        console.log('📱 WhatsApp: Sending contact message to', to);
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'contacts',
            contacts: contacts
        };

        return await this.makeAPIRequest(`/${this.phoneNumberId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    /**
     * Upload media to WhatsApp servers
     */
    async uploadMedia(mediaFile, mediaType) {
        console.log('📱 WhatsApp: Uploading media file');
        
        const formData = new FormData();
        formData.append('file', mediaFile);
        formData.append('type', mediaType);
        formData.append('messaging_product', 'whatsapp');

        const response = await fetch(`${this.baseURL}/${this.phoneNumberId}/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Media upload failed: ${JSON.stringify(errorData)}`);
        }

        return await response.json();
    }

    /**
     * Download media from WhatsApp servers
     */
    async downloadMedia(mediaId) {
        console.log('📱 WhatsApp: Downloading media', mediaId);
        
        // First get media URL
        const mediaResponse = await this.makeAPIRequest(`/${mediaId}`, {
            method: 'GET'
        });

        const mediaUrl = mediaResponse.data.url;
        
        // Download the actual media file
        const fileResponse = await fetch(mediaUrl, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!fileResponse.ok) {
            throw new Error(`Media download failed: ${fileResponse.status}`);
        }

        return {
            data: await fileResponse.arrayBuffer(),
            contentType: fileResponse.headers.get('content-type'),
            meta: mediaResponse.data
        };
    }

    /**
     * Get contact information
     */
    async getContact(phoneNumber) {
        console.log('📱 WhatsApp: Getting contact info for', phoneNumber);
        
        return await this.makeAPIRequest(`/${this.phoneNumberId}/contacts`, {
            method: 'POST',
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                contacts: [phoneNumber]
            })
        });
    }

    /**
     * Get business profile
     */
    async getBusinessProfile() {
        console.log('📱 WhatsApp: Getting business profile');
        
        return await this.makeAPIRequest(`/${this.phoneNumberId}`, {
            method: 'GET'
        });
    }

    /**
     * Update business profile
     */
    async updateBusinessProfile(profileData) {
        console.log('📱 WhatsApp: Updating business profile');
        
        return await this.makeAPIRequest(`/${this.phoneNumberId}`, {
            method: 'POST',
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                ...profileData
            })
        });
    }

    /**
     * Mark message as read
     */
    async markMessageAsRead(messageId) {
        console.log('📱 WhatsApp: Marking message as read', messageId);
        
        return await this.makeAPIRequest(`/${this.phoneNumberId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            })
        });
    }

    /**
     * Get message templates
     */
    async getMessageTemplates() {
        console.log('📱 WhatsApp: Getting message templates');
        
        return await this.makeAPIRequest(`/${this.businessAccountId}/message_templates`, {
            method: 'GET'
        });
    }

    /**
     * Create message template
     */
    async createMessageTemplate(templateData) {
        console.log('📱 WhatsApp: Creating message template');
        
        return await this.makeAPIRequest(`/${this.businessAccountId}/message_templates`, {
            method: 'POST',
            body: JSON.stringify(templateData)
        });
    }

    /**
     * Get phone number information
     */
    async getPhoneNumberInfo() {
        console.log('📱 WhatsApp: Getting phone number info');
        
        return await this.makeAPIRequest(`/${this.phoneNumberId}`, {
            method: 'GET'
        });
    }

    /**
     * Verify webhook token
     */
    verifyWebhookToken(token) {
        return token === this.verifyToken;
    }

    /**
     * Process incoming webhook data
     */
    processWebhookData(webhookData) {
        console.log('📱 WhatsApp: Processing webhook data');
        
        if (!webhookData.entry || !webhookData.entry[0]) {
            return null;
        }

        const entry = webhookData.entry[0];
        const changes = entry.changes;
        
        if (!changes || !changes[0]) {
            return null;
        }

        const change = changes[0];
        const value = change.value;
        
        // Process different types of webhooks
        if (value.messages) {
            return {
                type: 'message',
                data: this.processIncomingMessage(value.messages[0], value.contacts[0])
            };
        } else if (value.statuses) {
            return {
                type: 'status',
                data: this.processMessageStatus(value.statuses[0])
            };
        }

        return null;
    }

    /**
     * Process incoming message
     */
    processIncomingMessage(message, contact) {
        return {
            messageId: message.id,
            from: message.from,
            timestamp: message.timestamp,
            type: message.type,
            content: this.extractMessageContent(message),
            contact: {
                profile: contact?.profile || {},
                wa_id: contact?.wa_id
            }
        };
    }

    /**
     * Extract content from different message types
     */
    extractMessageContent(message) {
        switch (message.type) {
            case 'text':
                return { text: message.text.body };
            case 'image':
                return { 
                    mediaId: message.image.id,
                    caption: message.image.caption,
                    mimeType: message.image.mime_type
                };
            case 'video':
                return { 
                    mediaId: message.video.id,
                    caption: message.video.caption,
                    mimeType: message.video.mime_type
                };
            case 'audio':
                return { 
                    mediaId: message.audio.id,
                    mimeType: message.audio.mime_type
                };
            case 'document':
                return { 
                    mediaId: message.document.id,
                    filename: message.document.filename,
                    caption: message.document.caption,
                    mimeType: message.document.mime_type
                };
            case 'location':
                return {
                    latitude: message.location.latitude,
                    longitude: message.location.longitude,
                    name: message.location.name,
                    address: message.location.address
                };
            case 'contacts':
                return { contacts: message.contacts };
            case 'interactive':
                return this.extractInteractiveContent(message.interactive);
            default:
                return { raw: message };
        }
    }

    /**
     * Extract interactive message content (button/list responses)
     */
    extractInteractiveContent(interactive) {
        if (interactive.type === 'button_reply') {
            return {
                buttonId: interactive.button_reply.id,
                buttonTitle: interactive.button_reply.title
            };
        } else if (interactive.type === 'list_reply') {
            return {
                listId: interactive.list_reply.id,
                listTitle: interactive.list_reply.title,
                listDescription: interactive.list_reply.description
            };
        }
        return { interactive: interactive };
    }

    /**
     * Process message status updates
     */
    processMessageStatus(status) {
        return {
            messageId: status.id,
            status: status.status, // sent, delivered, read, failed
            timestamp: status.timestamp,
            recipientId: status.recipient_id,
            errors: status.errors || []
        };
    }
}

module.exports = new WhatsAppService();