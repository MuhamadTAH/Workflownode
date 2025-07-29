/*
=================================================================
BACKEND FILE: src/nodes/actions/modelNode.js (NEW FILE)
=================================================================
This file defines the structure and execution logic for the Model Node.
*/
const { callClaudeApi } = require('../../services/aiService');

const modelNode = {
    description: {
        displayName: 'Model Node',
        name: 'modelNode',
        icon: 'fa:comments',
        group: 'actions',
        version: 1,
        description: 'Provides a chatbot interface to an AI model.',
        defaults: {
            name: 'Model Node',
        },
        properties: [
            {
                displayName: 'Model',
                name: 'model',
                type: 'options',
                options: [
                    { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
                    { name: 'GPT-4', value: 'gpt-4' },
                ],
                default: 'claude-3-sonnet-20240229',
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
                description: 'API Key for the selected model provider (e.g., Anthropic).',
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

    // This function will be called by the node controller to get a chat response.
    async execute(nodeConfig, inputData) {
        const { apiKey, model, systemPrompt = 'You are a helpful AI assistant.', userPrompt = '{{message}}' } = nodeConfig;

        if (!apiKey) {
            throw new Error('API Key is required.');
        }

        // Process user prompt template with input data
        let processedUserMessage = userPrompt;
        if (inputData) {
            // Replace template variables like {{message}}, {{message.text}}, etc.
            processedUserMessage = modelNode.replaceTemplateVariables(userPrompt, inputData);
        }

        if (!processedUserMessage.trim()) {
            throw new Error('Processed user message cannot be empty.');
        }

        // For now, we only support Claude. We can add more models later.
        if (model.startsWith('claude')) {
            const response = await callClaudeApi(apiKey, processedUserMessage, systemPrompt);
            return { reply: response };
        } else {
            // Placeholder for other models
            return { reply: `Response from ${model} is not implemented yet.` };
        }
    },

    // Helper function to replace template variables
    replaceTemplateVariables(template, data) {
        let result = template;
        
        // Find all template variables like {{variable.path}}
        const templateRegex = /\{\{([^}]+)\}\}/g;
        let match;
        
        while ((match = templateRegex.exec(template)) !== null) {
            const fullMatch = match[0]; // e.g., "{{message.text}}"
            const variablePath = match[1].trim(); // e.g., "message.text"
            
            try {
                // Navigate through the object path
                const value = modelNode.getNestedValue(data, variablePath);
                if (value !== undefined) {
                    // Convert to string appropriately
                    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    result = result.replace(fullMatch, stringValue);
                }
            } catch (error) {
                // Keep original template if path is invalid
                console.warn(`Template variable ${fullMatch} could not be resolved:`, error.message);
            }
        }
        
        return result;
    },

    // Helper function to get nested values from objects
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    },
};

module.exports = modelNode;
