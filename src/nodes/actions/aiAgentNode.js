/*
=================================================================
BACKEND FILE: src/nodes/actions/aiAgentNode.js (NEW FILE)
=================================================================
This file defines the structure and properties of the AI Agent node.
*/

const { callClaudeApi } = require('../../services/aiService');

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
                    { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                    { name: 'GPT-4', value: 'gpt-4' },
                ],
                default: 'claude-3-5-sonnet-20241022',
                required: true,
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'API Key for the selected model provider.',
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
                description: 'System prompt that defines the AI\'s personality and behavior.',
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
                description: 'User prompt template. Use {{message}} or other variables from previous nodes.',
            },
        ],
    },

    // Execute the AI Agent with real API calls
    async execute(nodeConfig, inputData, connectedNodes = []) {
        const { apiKey, model, systemPrompt = 'You are a helpful AI assistant.', userPrompt = '{{message}}' } = nodeConfig;
        
        if (!apiKey) {
            throw new Error('API Key is required for AI Agent node.');
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

        // Advanced template replacement for nested JSON paths
        const replaceTemplate = (template, data) => {
            return template.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
                try {
                    // Navigate through nested object using dot notation
                    const pathParts = variablePath.trim().split('.');
                    let value = data;
                    
                    for (const part of pathParts) {
                        if (value && typeof value === 'object' && part in value) {
                            value = value[part];
                        } else {
                            return match; // Keep original if path not found
                        }
                    }
                    
                    // Convert value to string, handling different types
                    if (typeof value === 'string') {
                        return value;
                    } else if (typeof value === 'number' || typeof value === 'boolean') {
                        return String(value);
                    } else if (typeof value === 'object') {
                        return JSON.stringify(value);
                    } else {
                        return match; // Keep original if unable to convert
                    }
                } catch (error) {
                    console.warn(`Template replacement error for ${variablePath}:`, error);
                    return match; // Keep original on error
                }
            });
        };
        
        // Combine input data with available data storage data
        const combinedData = { ...inputData, ...availableData };
        
        // Process user prompt template with combined data
        const processedUserPrompt = replaceTemplate(userPrompt, combinedData);

        if (!processedUserPrompt.trim()) {
            throw new Error('Processed user message cannot be empty.');
        }

        // Enhanced system prompt with data storage information
        const enhancedSystemPrompt = systemPrompt + dataStorageInfo;

        // For now, we only support Claude. Can add more models later.
        if (model.startsWith('claude')) {
            const response = await callClaudeApi(apiKey, processedUserPrompt, enhancedSystemPrompt);
            return { 
                reply: response,
                model: model,
                systemPrompt: enhancedSystemPrompt,
                processedUserPrompt: processedUserPrompt,
                availableData: availableData,
                dataStorageConnected: Object.keys(availableData).length > 0
            };
        } else {
            // Placeholder for other models
            return { 
                reply: `Response from ${model} is not implemented yet.`,
                model: model,
                systemPrompt: systemPrompt,
                processedUserPrompt: processedUserPrompt
            };
        }
    },
};

module.exports = aiAgentNode;
