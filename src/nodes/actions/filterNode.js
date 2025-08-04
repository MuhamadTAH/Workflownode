/*
=================================================================
FILE: src/nodes/actions/filterNode.js - INTEGRATED FROM N8N-LOGIC-NODES
=================================================================
Filter node for removing items matching specific conditions.
Works with template expressions and multiple filter criteria.
*/
const { resolveExpression } = require('../../utils/expressionResolver');

const filterNode = {
    description: {
        displayName: 'Filter',
        name: 'filter',
        icon: 'fa:filter',
        group: 'actions',
        version: 1,
        description: 'Remove items matching a condition.',
        defaults: {
            name: 'Filter',
            conditions: [{ value1: '', operator: 'is_equal_to', value2: '' }],
        },
        properties: [
            {
                displayName: 'Conditions',
                name: 'conditions',
                type: 'collection',
                placeholder: 'Add Condition',
                default: [{ value1: '', operator: 'is_equal_to', value2: '' }],
                options: [
                    {
                        displayName: 'Field',
                        name: 'value1',
                        type: 'string',
                        default: '',
                        placeholder: '{{fieldName}} or field name',
                        description: 'Field to check in each item',
                    },
                    {
                        displayName: 'Operator',
                        name: 'operator',
                        type: 'options',
                        default: 'is_equal_to',
                        options: [
                            { name: 'Equal', value: 'is_equal_to' },
                            { name: 'Not Equal', value: 'is_not_equal_to' },
                            { name: 'Contains', value: 'contains' },
                            { name: 'Greater Than', value: 'greater_than' },
                            { name: 'Less Than', value: 'less_than' },
                        ],
                    },
                    {
                        displayName: 'Value',
                        name: 'value2',
                        type: 'string',
                        default: '',
                        placeholder: 'Value to compare against',
                    },
                ],
            },
        ],
    },

    async execute(config, inputData) {
        console.log('Executing Filter Node with config:', config);
        console.log('Received input data:', inputData);

        const { conditions } = config;

        if (!Array.isArray(inputData)) {
            console.warn('Filter node expects an array as inputData. Returning original data.');
            return inputData;
        }

        const filteredData = inputData.filter(item => {
            return conditions.every(condition => {
                let key = condition.value1;
                if (key.startsWith('{{') && key.endsWith('}}')) {
                    key = key.slice(2, -2).trim();
                }
                const itemValue = item[key];

                if (itemValue === undefined) return false;

                const val1 = String(itemValue);
                const val2 = resolveExpression(condition.value2, item);

                switch (condition.operator) {
                    case 'is_equal_to':
                        return val1 === String(val2);
                    case 'is_not_equal_to':
                        return val1 !== String(val2);
                    case 'contains':
                        return val1.includes(String(val2));
                    case 'greater_than':
                        return parseFloat(val1) > parseFloat(val2);
                    case 'less_than':
                        return parseFloat(val1) < parseFloat(val2);
                    default:
                        return false;
                }
            });
        });

        console.log('Filtered data:', filteredData);
        return filteredData;
    },
};

module.exports = filterNode;