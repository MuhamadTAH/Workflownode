/*
This file defines the structure and properties of the Loop Over Items node.
*/

const loopNode = {
    description: {
        displayName: 'Loop Over Items',
        name: 'loop',
        icon: 'fa:sync-alt', // Using a refresh/sync icon for looping
        group: 'actions',
        version: 1,
        description: 'Split data into batches and iterate over each batch.',
        defaults: {
            name: 'Loop Over Items',
            batchSize: 1, // Default to processing one item at a time
        },
    },

    // The loop node has a special "Loop" output that runs for each item/batch
    outputs: ['Loop', 'Done'],

    // UPDATED: This function now contains the real batching logic.
    async execute(config, inputData) {
        console.log('Executing Loop Node with config:', config);
        console.log('Received input data:', inputData);

        const batchSize = config.batchSize || 1;

        if (!Array.isArray(inputData)) {
            console.warn('Loop node expects an array as inputData. Treating it as a single item.');
            // If the input is not an array, we treat it as a single batch.
            return [[inputData]]; 
        }

        const batches = [];
        for (let i = 0; i < inputData.length; i += batchSize) {
            const batch = inputData.slice(i, i + batchSize);
            batches.push(batch);
        }

        console.log(`Split input into ${batches.length} batches of size ${batchSize}.`);
        
        // In a real workflow engine, this node would output each batch
        // sequentially to the "Loop" output. For testing via the API,
        // we will return all the generated batches at once.
        return batches;
    },
};

module.exports = loopNode;
