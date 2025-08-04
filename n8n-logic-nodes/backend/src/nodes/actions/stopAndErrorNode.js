/*
=================================================================
FILE: backend/src/nodes/actions/stopAndErrorNode.js
=================================================================
This node's logic has been updated to handle the new configuration
options from the frontend, such as different error types.
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
            // Updated default configuration
            errorType: 'errorMessage',
            errorMessage: 'Workflow execution stopped due to an error.',
        },
    },

    // This node has no outputs as it stops the execution.

    async execute(config, inputData) {
        console.log('Executing Stop and Error Node with config:', config);
        
        const { errorType, errorMessage } = config;

        if (errorType === 'errorMessage') {
            // Throw an error with the custom message from the configuration.
            throw new Error(errorMessage || 'Workflow stopped by Stop and Error node.');
        } else if (errorType === 'errorObject') {
            // Placeholder for future logic to handle error objects
            console.warn("Error type 'errorObject' is not yet implemented. Throwing a default error.");
            throw new Error('Workflow stopped by Stop and Error node (Error Object).');
        } else {
            throw new Error(`Unknown error type: ${errorType}`);
        }
    },
};

module.exports = stopAndErrorNode;
