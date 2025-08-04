/*
=================================================================
FILE: backend/src/nodes/actions/setDataNode.js (UPDATED)
=================================================================
This file has been updated to use the new expression resolver,
allowing it to handle dynamic values from previous nodes.
*/
const { resolveExpression } = require('../../utils/expressionResolver');

const setDataNode = {
    description: {
        displayName: 'Set Data',
        name: 'setData',
        icon: 'fa:database',
        group: 'actions',
        version: 1,
        description: 'Create custom key-value pairs to use in your workflow.',
        defaults: {
            name: 'Set Data',
            fields: [{ key: '', value: '' }],
        },
    },

    async execute(config, inputData) {
        console.log('Executing Set Data Node with config:', config);
        
        const { fields } = config;
        const outputData = {};
        const inputItem = Array.isArray(inputData) ? inputData[0] : inputData;

        if (Array.isArray(fields)) {
            fields.forEach(field => {
                if (field.key) {
                    const resolvedKey = resolveExpression(field.key, inputItem);
                    const resolvedValue = resolveExpression(field.value, inputItem);
                    outputData[resolvedKey] = resolvedValue;
                }
            });
        }

        console.log('Outputting data:', outputData);
        return [outputData];
    },
};

module.exports = setDataNode;
