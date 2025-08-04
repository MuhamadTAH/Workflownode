/*
=================================================================
FILE: backend/src/nodes/actions/switchNode.js (UPDATED)
=================================================================
This file has been updated with corrected logic to properly
evaluate conditions against the incoming data.
*/
const { resolveExpression } = require('../../utils/expressionResolver');

const switchNode = {
    description: {
        displayName: 'Switch',
        name: 'switch',
        icon: 'fa:random',
        group: 'actions',
        version: 1,
        description: 'Route items based on a set of rules.',
        defaults: {
            name: 'Switch',
            switchRules: [{ value1: '', operator: 'is_equal_to', value2: '' }],
            switchOptions: [],
        },
    },

    async execute(config, inputData) {
        console.log('Executing Switch Node with config:', config);
        const { switchRules, switchOptions } = config;
        const itemToEvaluate = Array.isArray(inputData) ? inputData[0] : inputData;

        if (!itemToEvaluate) {
            return { path: switchOptions.includes('fallbackOutput') ? 'fallback' : null, data: inputData };
        }

        const ignoreCase = switchOptions.includes('ignoreCase');

        for (let i = 0; i < switchRules.length; i++) {
            const rule = switchRules[i];
            
            let key = rule.value1;
            if (key.startsWith('{{') && key.endsWith('}}')) {
                key = key.slice(2, -2).trim();
            }
            const itemValue = itemToEvaluate[key];
            if (itemValue === undefined) continue;

            let val1 = String(itemValue);
            let val2 = resolveExpression(rule.value2, itemToEvaluate);
            
            if (ignoreCase) {
                val1 = val1.toLowerCase();
                val2 = String(val2).toLowerCase();
            }

            let isMatch = false;
            switch (rule.operator) {
                case 'is_equal_to':
                    isMatch = String(val1) === String(val2);
                    break;
                case 'is_not_equal_to':
                    isMatch = String(val1) !== String(val2);
                    break;
                case 'contains':
                    isMatch = String(val1).includes(String(val2));
                    break;
                // Add other operators here
            }

            if (isMatch) {
                return { path: i, data: inputData };
            }
        }

        if (switchOptions.includes('fallbackOutput')) {
            return { path: 'fallback', data: inputData };
        }

        return { path: null, data: inputData };
    },
};

module.exports = switchNode;
