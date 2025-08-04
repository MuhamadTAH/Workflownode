/*
=================================================================
FILE: backend/src/nodes/actions/filterNode.js (UPDATED)
=================================================================
This file has been updated with corrected logic to properly
evaluate conditions against the incoming data.
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
