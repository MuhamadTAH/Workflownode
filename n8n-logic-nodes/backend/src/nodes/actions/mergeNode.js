/*
=================================================================
FILE: src/nodes/actions/mergeNode.js (UPDATED)
=================================================================
This file has been updated to correctly merge data from multiple
input sources provided by the frontend.
*/
const { resolveExpression } = require('../../utils/expressionResolver');

const mergeNode = {
    description: {
        displayName: 'Merge',
        name: 'merge',
        icon: 'fa:share-alt',
        group: 'actions',
        version: 1,
        description: 'Merges data from multiple streams.',
        defaults: {
            name: 'Merge',
            mode: 'append',
        },
    },

    async execute(config, inputData) {
        console.log('Executing Merge Node with config:', config);
        console.log('Received input data:', inputData);
        
        // Handle case where inputData is a single array (direct input)
        if (Array.isArray(inputData)) {
            return inputData;
        }

        // Handle multiple inputs from different outputs
        let mergedData = [];
        
        // If inputData is an object with multiple sources, format as requested
        if (typeof inputData === 'object' && inputData !== null) {
            // Sort the entries to ensure consistent ordering
            const entries = Object.entries(inputData).sort(([a], [b]) => a.localeCompare(b));
            
            for (const [outputName, data] of entries) {
                // Skip if this is an error message
                if (outputName === 'message') {
                    continue;
                }
                
                // Add only the actual data, no output labels
                if (Array.isArray(data)) {
                    mergedData = mergedData.concat(data);
                } else {
                    mergedData.push(data);
                }
            }
        }
        
        // If no valid data was found, return the original input
        if (mergedData.length === 0 && inputData.message) {
            return [{ error: inputData.message }];
        }
        
        console.log('Merged data:', mergedData);
        return mergedData;
    },
};

module.exports = mergeNode;
