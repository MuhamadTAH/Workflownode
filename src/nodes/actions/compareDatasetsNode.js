/*
=================================================================
FILE: backend/src/nodes/actions/compareDatasetsNode.js (UPDATED)
=================================================================
Defines the 'Compare Datasets' node. This node is intended to take
two arrays of data and identify which items have been added, updated,
or removed between them based on a flexible list of key pairs.
*/
const compareDatasetsNode = {
    description: {
        displayName: 'Compare Datasets',
        name: 'compare',
        icon: 'fa:plus-square',
        group: 'actions',
        version: 1,
        description: 'Compare two inputs for changes.',
        defaults: {
            name: 'Compare Datasets',
            // UPDATED: Use an array for multiple field matching
            fieldsToMatch: [{ key1: '', key2: '' }],
        },
    },

    // This node conceptually has two inputs and three outputs.
    inputs: ['input1', 'input2'],
    outputs: ['added', 'updated', 'removed'],

    // UPDATED: The execution logic now uses the fieldsToMatch array.
    async execute(config, inputData) {
        console.log('Executing Compare Datasets Node with config:', config);
        
        const { input1, input2 } = inputData;
        // Destructure the new fieldsToMatch array from the config
        const { fieldsToMatch } = config;

        if (!Array.isArray(input1) || !Array.isArray(input2)) {
            throw new Error('This node requires two array inputs (input1 and input2).');
        }

        if (!Array.isArray(fieldsToMatch) || fieldsToMatch.length === 0 || !fieldsToMatch[0].key1 || !fieldsToMatch[0].key2) {
            throw new Error('At least one pair of keys to match must be configured.');
        }

        // NOTE: The actual comparison logic is still a placeholder.
        // A real implementation would iterate through the arrays and compare items
        // using the key pairs defined in fieldsToMatch.
        console.log('Comparing datasets on the following key pairs:', fieldsToMatch);
        
        return {
            added: [],
            updated: [],
            removed: []
        };
    },
};

module.exports = compareDatasetsNode;
