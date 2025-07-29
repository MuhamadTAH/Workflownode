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
                displayName: 'Prompt Template',
                name: 'promptTemplate',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: 'You are a helpful assistant. User message: {{message.text}}',
                required: true,
                description: 'The template for the prompt. Use {{variable}} for inputs.',
            },
        ],
    },

    // Execute the AI Agent with real API calls
    async execute(nodeConfig, inputData) {
        const { apiKey, model, promptTemplate } = nodeConfig;
        
        if (!apiKey) {
            throw new Error('API Key is required for AI Agent node.');
        }

        if (!inputData) {
            throw new Error('Input data is required for AI Agent node.');
        }

        // Process the prompt template with input data
        let processedPrompt = promptTemplate;
        
        // Advanced template replacement for nested JSON paths
        const replaceTemplate = (template, data, path = '') => {
            return template.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
                try {
                    // Navigate through nested object using dot notation
                    const pathParts = variablePath.split('.');
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
        
        processedPrompt = replaceTemplate(processedPrompt, inputData);

        // For now, we only support Claude. Can add more models later.
        if (model.startsWith('claude')) {
            const response = await callClaudeApi(apiKey, processedPrompt);
            return { 
                reply: response,
                model: model,
                processedPrompt: processedPrompt
            };
        } else {
            // Placeholder for other models
            return { 
                reply: `Response from ${model} is not implemented yet.`,
                model: model,
                processedPrompt: processedPrompt
            };
        }
    },
};

module.exports = aiAgentNode;
