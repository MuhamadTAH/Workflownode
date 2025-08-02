/*
=================================================================
BACKEND FILE: src/nodes/actions/aiAgentNode.js (ENHANCED WITH CLAUDE SDK)
=================================================================
This file defines the structure and properties of the AI Agent node.
Enhanced with official Claude SDK for better performance and features.
*/

const { callClaudeApi, verifyClaudeApiKey } = require('../../services/aiService');

const aiAgentNode = {
    description: {
        displayName: 'AI Agent',
        name: 'aiAgent',
        icon: 'fa:robot',
        group: 'actions',
        version: 1,
        description: 'Uses an LLM to process input and generate a response.',
        defaults: {
            name: 'AI Agent',
        },
        // These are the configuration fields for the node
        properties: [
            {
                displayName: 'Model',
                name: 'model',
                type: 'options',
                options: [
                    { name: 'Claude 3.5 Sonnet (Official SDK)', value: 'claude-3-5-sonnet-20241022' },
                    { name: 'GPT-4 (Coming Soon)', value: 'gpt-4' },
                ],
                default: 'claude-3-5-sonnet-20241022',
                required: true,
                description: 'AI model to use. Claude models use the official Anthropic SDK.',
            },
            {
                displayName: 'Claude API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Claude API Key (sk-ant-...) - Enhanced with official SDK features.',
                placeholder: 'sk-ant-...'
            },
            {
                displayName: 'System Prompt',
                name: 'systemPrompt',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: 'You are a helpful AI assistant.',
                required: false,
                description: 'System prompt that defines the AI\'s personality and behavior. Supports template variables.',
            },
            {
                displayName: 'User Prompt',
                name: 'userPrompt',
                type: 'string',
                typeOptions: {
                    rows: 3,
                },
                default: '{{message}}',
                required: true,
                description: 'User prompt template. Supports {{$json.field}} and {{nodePrefix.field}} syntax.',
            },
            {
                displayName: 'User ID',
                name: 'userId',
                type: 'string',
                default: 'default',
                required: false,
                description: 'User ID for conversation memory (integrates with Model Node).',
            },
        ],
    },

    // Execute the AI Agent with real API calls
    async execute(nodeConfig, inputData, connectedNodes = []) {
        const { apiKey, claudeApiKey, model, claudeModel, systemPrompt = 'You are a helpful AI assistant.', userPrompt = '{{message}}' } = nodeConfig;
        
        // Use claudeApiKey if available (from ConfigPanel), fallback to apiKey
        const actualApiKey = claudeApiKey || apiKey;
        const actualModel = claudeModel || model || 'claude-3-5-sonnet-20241022';
        
        if (!actualApiKey) {
            throw new Error('Claude API Key is required for AI Agent node.');
        }

        if (!inputData) {
            throw new Error('Input data is required for AI Agent node.');
        }

        // Check for connected Data Storage nodes and retrieve their data
        let dataStorageInfo = '';
        let availableData = {};
        
        if (connectedNodes && connectedNodes.length > 0) {
            for (const connectedNode of connectedNodes) {
                if (connectedNode.type === 'dataStorage' && connectedNode.data) {
                    // Merge data storage data into available data
                    Object.assign(availableData, connectedNode.data);
                    
                    // Create a description of available data for the AI
                    const dataFields = Object.keys(connectedNode.data);
                    if (dataFields.length > 0) {
                        dataStorageInfo += `\n\nAvailable Data Storage Information:\n`;
                        for (const [key, value] of Object.entries(connectedNode.data)) {
                            dataStorageInfo += `- ${key}: ${value}\n`;
                        }
                        dataStorageInfo += `\nYou can reference this information when answering questions. Use this data to provide accurate, personalized responses.`;
                    }
                }
            }
        }

        // Utility function to convert values to string
        const convertValueToString = (value) => {
            if (typeof value === 'string') {
                return value;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                return String(value);
            } else if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value, null, 2);
            } else {
                return String(value || '');
            }
        };

        // Enhanced Universal Template Parser - supports multiple template formats
        const parseUniversalTemplate = (inputStr, json) => {
            if (!inputStr) return inputStr || '';
            
            let result = inputStr;
            
            // 1. Handle {{$json.path.to.value}} format (backend system)
            result = result.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
                try {
                    if (!json) return match;
                    
                    const keys = path.split('.');
                    let value = json;
                    
                    for (const key of keys) {
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                        } else {
                            return match; // Keep original if path not found
                        }
                    }
                    
                    return convertValueToString(value);
                } catch (error) {
                    console.error('Error parsing $json template:', error);
                    return match;
                }
            });
            
            // 2. Handle {{nodePrefix.path.to.value}} format (frontend system)
            result = result.replace(/\{\{\s*([a-zA-Z]+)\.(.*?)\s*\}\}/g, (match, nodePrefix, path) => {
                try {
                    let dataSource = null;
                    
                    // Map node prefixes to data locations
                    if (nodePrefix === 'telegram' && json._telegram) {
                        dataSource = json._telegram;
                    } else if (nodePrefix === 'telegram' && json._originalTrigger) {
                        dataSource = json._originalTrigger;
                    } else if (nodePrefix === 'aiAgent' && json.reply) {
                        if (path === 'reply' || path === 'response') return json.reply;
                    } else if (nodePrefix === 'model' && json.reply) {
                        if (path === 'reply' || path === 'response') return json.reply;
                    } else if (json[nodePrefix]) {
                        dataSource = json[nodePrefix];
                    } else {
                        dataSource = json;
                    }
                    
                    if (!dataSource) return match;
                    
                    // Navigate the path in data source
                    const keys = path.split('.');
                    let value = dataSource;
                    for (const key of keys) {
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                        } else {
                            return match;
                        }
                    }
                    
                    return convertValueToString(value);
                } catch (error) {
                    console.error('Error parsing node prefix template:', error);
                    return match;
                }
            });
            
            // 3. Handle simple {{variable}} format for backward compatibility
            result = result.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (match, variable) => {
                if (json && json[variable] !== undefined) {
                    return convertValueToString(json[variable]);
                }
                return match;
            });
            
            return result;
        };
        
        // Combine input data with available data storage data
        const combinedData = { ...inputData, ...availableData };
        
        // Process user prompt template with enhanced universal parser
        const processedUserPrompt = parseUniversalTemplate(userPrompt, combinedData);

        if (!processedUserPrompt.trim()) {
            throw new Error('Processed user message cannot be empty.');
        }

        // Process system prompt template as well (new feature)
        const processedSystemPrompt = parseUniversalTemplate(systemPrompt, combinedData);
        
        // Enhanced system prompt with data storage information
        const enhancedSystemPrompt = processedSystemPrompt + dataStorageInfo;

        // Get conversation history from Model Node if available
        const modelNode = require('./modelNode');
        const userId = nodeConfig.userId || 'default';
        const conversationHistory = modelNode.getConversationHistory(userId);

        // Enhanced Claude API integration with official SDK
        if (actualModel.startsWith('claude')) {
            console.log('🚀 AI Agent: Using official Claude SDK');
            
            try {
                const response = await callClaudeApi(actualApiKey, processedUserPrompt, enhancedSystemPrompt, conversationHistory, {
                    model: actualModel,
                    maxTokens: nodeConfig.maxTokens || 1000,
                    temperature: nodeConfig.temperature || 0.7
                });
                
                // Extract enhanced response data from SDK
                const responseText = response.text || response;
                const processingTime = response.processingTime || null;
                const usage = response.usage || null;
                const modelUsed = response.model || actualModel;
                const messageId = response.id || null;
                
                // Store conversation in memory with enhanced SDK analytics
                const conversationEntry = {
                    timestamp: new Date().toISOString(),
                    user: processedUserPrompt,
                    ai: responseText,
                    userMessageLength: processedUserPrompt.length,
                    aiResponseLength: responseText.length,
                    model: modelUsed,
                    processingTime: processingTime,
                    usage: usage,
                    messageId: messageId,
                    sdkFeatures: {
                        officialSDK: true,
                        enhancedErrorHandling: true,
                        usageTracking: usage !== null,
                        universalTemplateParser: true
                    },
                    templateProcessing: {
                        originalUserPrompt: userPrompt,
                        processedUserPrompt: processedUserPrompt,
                        originalSystemPrompt: systemPrompt,
                        processedSystemPrompt: processedSystemPrompt,
                        dataStorageUsed: Object.keys(availableData).length > 0
                    }
                };
                modelNode.addToMemory(userId, conversationEntry);
                
                return { 
                    reply: responseText,
                    model: modelUsed,
                    systemPrompt: enhancedSystemPrompt,
                    processedUserPrompt: processedUserPrompt,
                    availableData: availableData,
                    dataStorageConnected: Object.keys(availableData).length > 0,
                    userId: userId,
                    userMessage: processedUserPrompt,
                    processingTime: processingTime,
                    usage: usage,
                    messageId: messageId,
                    // Enhanced SDK metadata
                    sdkMetadata: {
                        officialSDK: true,
                        features: [
                            'Universal Template Parser',
                            'Enhanced Error Handling',
                            'Usage Tracking',
                            'Memory Integration',
                            'Data Storage Integration'
                        ],
                        templateFormatsSupported: [
                            '{{$json.field}}',
                            '{{nodePrefix.field}}',
                            '{{variable}}'
                        ],
                        connectedNodes: connectedNodes.length,
                        dataStorageNodes: connectedNodes.filter(n => n.type === 'dataStorage').length
                    }
                };
                
            } catch (error) {
                console.error('❌ AI Agent SDK Error:', error.message);
                
                // Enhanced error handling with SDK information
                throw new Error(`AI Agent SDK Error: ${error.message}. Please check your Claude API key and try again.`);
            }
            
        } else {
            // Placeholder for other models - will be enhanced with future SDK support
            console.log('⚠️ AI Agent: Non-Claude models not yet supported with SDK');
            return { 
                reply: `${actualModel} support is coming soon. Currently only Claude models are supported with the official SDK.`,
                model: actualModel,
                systemPrompt: enhancedSystemPrompt,
                processedUserPrompt: processedUserPrompt,
                sdkSupported: false,
                availableModels: ['claude-3-5-sonnet-20241022']
            };
        }
    },

    // New: Test Claude SDK connection for AI Agent
    async testSDKConnection(apiKey) {
        try {
            if (!apiKey) {
                return {
                    connected: false,
                    error: 'API Key is required',
                    features: []
                };
            }

            const verification = await verifyClaudeApiKey(apiKey);
            
            return {
                connected: verification.valid,
                model: verification.model,
                usage: verification.usage,
                sdk: 'Official Anthropic SDK',
                features: [
                    'Universal Template Parser',
                    'Data Storage Integration',
                    'Memory Integration',
                    'Enhanced Error Handling',
                    'Usage Analytics',
                    'System Prompt Templates'
                ],
                nodeType: 'AI Agent',
                templateFormats: [
                    '{{$json.field}} - Backend JSON format',
                    '{{nodePrefix.field}} - Frontend node format',
                    '{{variable}} - Simple variable format'
                ],
                timestamp: new Date().toISOString(),
                error: verification.error || null
            };
            
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                features: ['Template Processing', 'Data Storage Integration'],
                nodeType: 'AI Agent (Offline)',
                timestamp: new Date().toISOString()
            };
        }
    },

    // New: Parse and validate template syntax
    validateTemplate(template, sampleData = {}) {
        try {
            // Create sample data for testing
            const testData = {
                message: 'Sample message',
                text: 'Sample text',
                chat: { id: 12345 },
                user: { name: 'Test User' },
                ...sampleData
            };

            // Utility function for testing
            const convertValueToString = (value) => {
                if (typeof value === 'string') {
                    return value;
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    return String(value);
                } else if (typeof value === 'object' && value !== null) {
                    return JSON.stringify(value, null, 2);
                } else {
                    return String(value || '');
                }
            };

            // Test template processing
            let result = template;
            const replacements = [];
            
            // Test {{$json.field}} format
            result = result.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
                const keys = path.split('.');
                let value = testData;
                
                for (const key of keys) {
                    if (value && typeof value === 'object' && key in value) {
                        value = value[key];
                    } else {
                        replacements.push({
                            original: match,
                            path: path,
                            status: 'not_found',
                            type: '$json'
                        });
                        return match;
                    }
                }
                
                const stringValue = convertValueToString(value);
                replacements.push({
                    original: match,
                    path: path,
                    value: stringValue,
                    status: 'replaced',
                    type: '$json'
                });
                return stringValue;
            });

            // Test {{nodePrefix.field}} format
            result = result.replace(/\{\{\s*([a-zA-Z]+)\.(.*?)\s*\}\}/g, (match, nodePrefix, path) => {
                replacements.push({
                    original: match,
                    nodePrefix: nodePrefix,
                    path: path,
                    status: 'node_prefix',
                    type: 'nodePrefix',
                    note: 'Requires actual node data at runtime'
                });
                return `[${nodePrefix}.${path}]`;
            });

            // Test {{variable}} format
            result = result.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (match, variable) => {
                if (testData[variable] !== undefined) {
                    const stringValue = convertValueToString(testData[variable]);
                    replacements.push({
                        original: match,
                        variable: variable,
                        value: stringValue,
                        status: 'replaced',
                        type: 'variable'
                    });
                    return stringValue;
                } else {
                    replacements.push({
                        original: match,
                        variable: variable,
                        status: 'not_found',
                        type: 'variable'
                    });
                    return match;
                }
            });

            return {
                valid: true,
                original: template,
                processed: result,
                replacements: replacements,
                summary: {
                    totalTemplates: replacements.length,
                    successful: replacements.filter(r => r.status === 'replaced').length,
                    notFound: replacements.filter(r => r.status === 'not_found').length,
                    nodePrefix: replacements.filter(r => r.type === 'nodePrefix').length
                }
            };

        } catch (error) {
            return {
                valid: false,
                error: error.message,
                original: template
            };
        }
    },

    // New: Get template format help
    getTemplateHelp() {
        return {
            supportedFormats: [
                {
                    format: '{{$json.field}}',
                    description: 'Access JSON data from previous nodes',
                    example: '{{$json.message.text}}',
                    use: 'Direct JSON path access'
                },
                {
                    format: '{{nodePrefix.field}}',
                    description: 'Access data using node prefix (frontend style)',
                    example: '{{telegram.message.text}}',
                    use: 'n8n-style node references'
                },
                {
                    format: '{{variable}}',
                    description: 'Simple variable replacement',
                    example: '{{message}}',
                    use: 'Basic template variables'
                }
            ],
            commonExamples: [
                '{{$json.message.chat.id}} - Get chat ID from Telegram message',
                '{{telegram.message.text}} - Get message text using node prefix',
                '{{storage.productName}} - Get product name from Data Storage',
                '{{aiAgent.reply}} - Get previous AI response'
            ],
            tips: [
                'System prompts also support templates',
                'Templates are processed at runtime with actual data',
                'Use nested JSON paths like message.user.first_name',
                'Data Storage nodes automatically provide data to AI Agent'
            ]
        };
    }
};

module.exports = aiAgentNode;
