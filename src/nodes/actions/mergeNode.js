/*
=================================================================
FILE: src/nodes/actions/mergeNode.js - INTEGRATED FROM N8N-LOGIC-NODES
=================================================================
Merge node for combining data from multiple input sources.
Handles both single arrays and multiple input objects.
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
        properties: [
            {
                displayName: 'Mode',
                name: 'mode',
                type: 'options',
                default: 'append',
                options: [
                    { name: 'Append', value: 'append', description: 'Add all items to a single list' },
                    { name: 'Merge by Key', value: 'merge_by_key', description: 'Combine items with same key' },
                ],
            },
            {
                displayName: 'Key Field',
                name: 'keyField',
                type: 'string',
                default: '',
                placeholder: 'id',
                displayOptions: {
                    show: {
                        mode: ['merge_by_key'],
                    },
                },
                description: 'Field to use as merge key',
            },
        ],
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