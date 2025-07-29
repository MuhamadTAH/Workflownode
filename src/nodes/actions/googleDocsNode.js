/*
=================================================================
BACKEND FILE: src/nodes/actions/googleDocsNode.js (NEW FILE)
=================================================================
This file defines the structure and properties of the Google Docs node.
*/

const axios = require('axios');

const googleDocsNode = {
    description: {
        displayName: 'Google Docs',
        name: 'googleDocs',
        icon: 'fa:file-text',
        group: 'actions',
        version: 1,
        description: 'Read from, write to, or create Google Docs documents.',
        defaults: {
            name: 'Google Docs',
        },
        // These are the configuration fields for the node
        properties: [
            {
                displayName: 'Action',
                name: 'action',
                type: 'options',
                options: [
                    { name: 'Get Document', value: 'get' },
                    { name: 'Update Document', value: 'update' },
                    { name: 'Create Document', value: 'create' },
                ],
                default: 'get',
                required: true,
                description: 'Choose what action to perform on Google Docs.',
            },
            {
                displayName: 'Document URL',
                name: 'documentUrl',
                type: 'string',
                default: '',
                required: false,
                description: 'Full URL of the Google Docs document. Required for Get and Update actions.',
                displayOptions: {
                    show: {
                        action: ['get', 'update']
                    }
                }
            },
            {
                displayName: 'Document Title',
                name: 'documentTitle',
                type: 'string',
                default: 'New Document',
                required: false,
                description: 'Title for the new document.',
                displayOptions: {
                    show: {
                        action: ['create']
                    }
                }
            },
            {
                displayName: 'Content',
                name: 'content',
                type: 'string',
                typeOptions: {
                    rows: 5,
                },
                default: '{{message}}',
                required: false,
                description: 'Content to add to the document. Use {{variables}} from previous nodes.',
                displayOptions: {
                    show: {
                        action: ['update', 'create']
                    }
                }
            },
        ],
    },

    // Execute the Google Docs action
    async execute(nodeConfig, inputData) {
        const { action, documentUrl, documentTitle, content } = nodeConfig;
        const backendUrl = process.env.BASE_URL || 'http://localhost:3013';
        
        // Template replacement function (same as AI Agent)
        const replaceTemplate = (template, data) => {
            if (!template) return template;
            return template.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
                try {
                    const pathParts = variablePath.trim().split('.');
                    let value = data;
                    
                    for (const part of pathParts) {
                        if (value && typeof value === 'object' && part in value) {
                            value = value[part];
                        } else {
                            return match;
                        }
                    }
                    
                    if (typeof value === 'string') {
                        return value;
                    } else if (typeof value === 'number' || typeof value === 'boolean') {
                        return String(value);
                    } else if (typeof value === 'object') {
                        return JSON.stringify(value, null, 2);
                    } else {
                        return match;
                    }
                } catch (error) {
                    console.warn(`Template replacement error for ${variablePath}:`, error);
                    return match;
                }
            });
        };

        try {
            switch (action) {
                case 'get':
                    if (!documentUrl) {
                        throw new Error('Document URL is required for Get action.');
                    }
                    
                    const getResponse = await axios.post(`${backendUrl}/api/get-doc`, {
                        docUrl: documentUrl
                    });
                    
                    return {
                        action: 'get',
                        title: getResponse.data.title,
                        content: getResponse.data.content,
                        documentId: getResponse.data.documentId,
                        url: documentUrl
                    };

                case 'update':
                    if (!documentUrl) {
                        throw new Error('Document URL is required for Update action.');
                    }
                    
                    const processedContent = replaceTemplate(content, inputData);
                    if (!processedContent || !processedContent.trim()) {
                        throw new Error('Content cannot be empty for Update action.');
                    }
                    
                    const updateResponse = await axios.post(`${backendUrl}/api/update-doc`, {
                        docUrl: documentUrl,
                        content: processedContent
                    });
                    
                    return {
                        action: 'update',
                        success: updateResponse.data.success,
                        message: updateResponse.data.message,
                        url: documentUrl,
                        addedContent: processedContent
                    };

                case 'create':
                    const processedTitle = replaceTemplate(documentTitle, inputData) || 'New Document';
                    
                    const createResponse = await axios.post(`${backendUrl}/api/create-doc`, {
                        title: processedTitle
                    });
                    
                    // If content is provided, add it to the new document
                    if (content && content.trim()) {
                        const processedCreateContent = replaceTemplate(content, inputData);
                        if (processedCreateContent && processedCreateContent.trim()) {
                            await axios.post(`${backendUrl}/api/update-doc`, {
                                docUrl: createResponse.data.url,
                                content: processedCreateContent
                            });
                        }
                    }
                    
                    return {
                        action: 'create',
                        title: createResponse.data.title,
                        documentId: createResponse.data.documentId,
                        url: createResponse.data.url,
                        initialContent: content ? replaceTemplate(content, inputData) : null
                    };

                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            // Handle specific error cases
            if (error.response) {
                const statusCode = error.response.status;
                const errorData = error.response.data;
                
                if (statusCode === 401) {
                    throw new Error('Google account not connected. Please authenticate with Google first.');
                } else if (statusCode === 400 && errorData.error?.includes('Invalid Google Docs URL')) {
                    throw new Error('Invalid Google Docs URL. Please provide a valid document URL.');
                } else {
                    throw new Error(`Google Docs API error: ${errorData.error || error.message}`);
                }
            } else {
                throw new Error(`Google Docs node error: ${error.message}`);
            }
        }
    },
};

module.exports = googleDocsNode;