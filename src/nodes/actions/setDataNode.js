/*
=================================================================
FILE: src/nodes/actions/setDataNode.js - INTEGRATED FROM N8N-LOGIC-NODES
=================================================================
Set Data node for creating custom key-value pairs.
Uses expression resolver for dynamic values from previous nodes.
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
        properties: [
            {
                displayName: 'Fields',
                name: 'fields',
                type: 'collection',
                placeholder: 'Add Field',
                default: [{ key: '', value: '' }],
                options: [
                    {
                        displayName: 'Key',
                        name: 'key',
                        type: 'string',
                        default: '',
                        placeholder: 'Field name',
                        description: 'The key for this field',
                    },
                    {
                        displayName: 'Value',
                        name: 'value',
                        type: 'string',
                        default: '',
                        placeholder: 'Field value or {{expression}}',
                        description: 'The value for this field (supports expressions)',
                    },
                ],
            },
        ],
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