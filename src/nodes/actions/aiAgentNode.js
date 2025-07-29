/*
=================================================================
BACKEND FILE: src/nodes/actions/aiAgentNode.js (NEW FILE)
=================================================================
This file defines the structure and properties of the AI Agent node.
*/

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
                    { name: 'GPT-4', value: 'gpt-4' },
                    { name: 'Claude 3', value: 'claude-3' },
                ],
                default: 'gpt-4',
                required: true,
            },
            {
                displayName: 'Prompt Template',
                name: 'promptTemplate',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: 'You are a helpful assistant. Respond to: {{userMessage}}',
                required: true,
                description: 'The template for the prompt. Use {{variable}} for inputs.',
            },
            // We will add more properties like temperature, max tokens, etc., in the next steps.
        ],
    },

    // This is the placeholder execution logic for now.
    async execute(nodeConfig, inputData) {
        console.log('Executing AI Agent Node with config:', nodeConfig);
        console.log('Received input data:', inputData);

        // In the future, this will call the actual LLM API.
        // For now, it returns a mock response.
        const mockResponse = {
            reply: `This is a test response using the model "${nodeConfig.model}".`,
        };

        return mockResponse;
    },
};

module.exports = aiAgentNode;
