/*
=================================================================
FILE: src/nodes/actions/switchNode.js - INTEGRATED FROM N8N-LOGIC-NODES
=================================================================
Switch node for routing items based on multiple conditions.
Supports multiple output paths based on rule evaluation.
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
        properties: [
            {
                displayName: 'Rules',
                name: 'switchRules',
                type: 'collection',
                placeholder: 'Add Rule',
                default: [{ value1: '', operator: 'is_equal_to', value2: '' }],
                options: [
                    {
                        displayName: 'Field',
                        name: 'value1',
                        type: 'string',
                        default: '',
                        placeholder: '{{fieldName}} or field name',
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
                        placeholder: 'Comparison value',
                    },
                ],
            },
            {
                displayName: 'Options',
                name: 'switchOptions',
                type: 'multiSelectOptions',
                default: [],
                options: [
                    { name: 'Ignore Case', value: 'ignoreCase' },
                    { name: 'Fallback Output', value: 'fallbackOutput' },
                ],
            },
        ],
    },

    outputs: ['0', '1', '2', 'fallback'], // Dynamic outputs based on rules

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
                case 'greater_than':
                    isMatch = parseFloat(val1) > parseFloat(val2);
                    break;
                case 'less_than':
                    isMatch = parseFloat(val1) < parseFloat(val2);
                    break;
            }

            if (isMatch) {
                return { path: i.toString(), data: inputData };
            }
        }

        if (switchOptions && switchOptions.includes('fallbackOutput')) {
            return { path: 'fallback', data: inputData };
        }

        return { path: null, data: inputData };
    },
};

module.exports = switchNode;