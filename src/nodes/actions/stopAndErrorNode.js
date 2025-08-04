/*
=================================================================
FILE: src/nodes/actions/stopAndErrorNode.js - INTEGRATED FROM N8N-LOGIC-NODES
=================================================================
Stop and Error node for terminating workflow execution with custom errors.
Supports different error types and custom error messages.
*/

const stopAndErrorNode = {
    description: {
        displayName: 'Stop and Error',
        name: 'stopAndError',
        icon: 'fa:exclamation-triangle',
        group: 'actions',
        version: 1,
        description: 'Throw an error in the workflow.',
        defaults: {
            name: 'Stop and Error',
            errorType: 'errorMessage',
            errorMessage: 'Workflow execution stopped due to an error.',
        },
        properties: [
            {
                displayName: 'Error Type',
                name: 'errorType',
                type: 'options',
                default: 'errorMessage',
                options: [
                    { name: 'Error Message', value: 'errorMessage' },
                    { name: 'Error Object', value: 'errorObject' },
                ],
            },
            {
                displayName: 'Error Message',
                name: 'errorMessage',
                type: 'string',
                default: 'Workflow execution stopped due to an error.',
                placeholder: 'Enter custom error message',
                displayOptions: {
                    show: {
                        errorType: ['errorMessage', 'errorObject'],
                    },
                },
                description: 'The error message to display when workflow stops',
            },
        ],
    },

    // This node has no outputs as it stops the execution.
    outputs: [],

    async execute(config, inputData) {
        console.log('Executing Stop and Error Node with config:', config);
        
        const { errorType, errorMessage } = config;

        if (errorType === 'errorMessage') {
            // Throw an error with the custom message from the configuration.
            throw new Error(errorMessage || 'Workflow stopped by Stop and Error node.');
        } else if (errorType === 'errorObject') {
            // Create a structured error object
            const errorObj = new Error(errorMessage || 'Workflow stopped by Stop and Error node.');
            errorObj.type = 'WorkflowError';
            errorObj.data = inputData;
            errorObj.timestamp = new Date().toISOString();
            throw errorObj;
        } else {
            throw new Error(`Unknown error type: ${errorType}`);
        }
    },
};

module.exports = stopAndErrorNode;