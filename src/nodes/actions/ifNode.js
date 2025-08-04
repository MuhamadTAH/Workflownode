/*
=================================================================
FILE: src/nodes/actions/ifNode.js - INTEGRATED FROM N8N-LOGIC-NODES
=================================================================
Conditional routing node with template expression support.
Route items to different branches (true/false) based on conditions.
*/
const { resolveExpression } = require('../../utils/expressionResolver');

const ifNode = {
    description: {
        displayName: 'If',
        name: 'if',
        icon: 'fa:sitemap',
        group: 'actions',
        version: 1,
        description: 'Route items to different branches (true/false).',
        defaults: {
            name: 'If',
            conditions: [{ value1: '', operator: 'is_equal_to', value2: '' }],
            combinator: 'AND',
            ignoreCase: false,
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
                        displayName: 'Value 1',
                        name: 'value1',
                        type: 'string',
                        default: '',
                        placeholder: '{{fieldName}} or direct value',
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
                        displayName: 'Value 2',
                        name: 'value2',
                        type: 'string',
                        default: '',
                        placeholder: 'Comparison value',
                    },
                ],
            },
            {
                displayName: 'Combinator',
                name: 'combinator',
                type: 'options',
                default: 'AND',
                options: [
                    { name: 'AND', value: 'AND' },
                    { name: 'OR', value: 'OR' },
                ],
            },
            {
                displayName: 'Ignore Case',
                name: 'ignoreCase',
                type: 'boolean',
                default: false,
            },
        ],
    },

    outputs: ['true', 'false'],

    async execute(config, inputData) {
        console.log('Executing If Node with config:', config);
        console.log('Received input data:', inputData);

        const { conditions, combinator, ignoreCase } = config;
        const itemToEvaluate = Array.isArray(inputData) ? inputData[0] : inputData;

        if (!itemToEvaluate) {
            return { path: 'false', data: inputData };
        }

        const evaluateCondition = (condition) => {
            // Value1 can be a template like {{key}} or a direct key name.
            // Value2 is treated as the value to compare against (and can be an expression).
            let key = condition.value1;
            
            // If value1 is a template like {{name}}, extract the key name
            if (key.startsWith('{{') && key.endsWith('}}')) {
                key = key.slice(2, -2).trim();
            }
            
            const itemValue = itemToEvaluate[key];

            console.log('Evaluating condition:', condition);
            console.log('Key to look up:', key);
            console.log('Item to evaluate:', itemToEvaluate);
            console.log('Item value found:', itemValue);

            if (itemValue === undefined) {
                console.log('Item value is undefined, returning false');
                return false;
            }

            let val1 = String(itemValue);
            let val2 = resolveExpression(condition.value2, itemToEvaluate);
            
            console.log('val1 (converted):', val1);
            console.log('val2 (resolved):', val2);

            if (ignoreCase) {
                val1 = val1.toLowerCase();
                val2 = String(val2).toLowerCase();
            }

            let result;
            switch (condition.operator) {
                case 'is_equal_to':
                    result = String(val1) === String(val2);
                    break;
                case 'is_not_equal_to':
                    result = String(val1) !== String(val2);
                    break;
                case 'contains':
                    result = String(val1).includes(String(val2));
                    break;
                case 'greater_than':
                    result = parseFloat(val1) > parseFloat(val2);
                    break;
                case 'less_than':
                    result = parseFloat(val1) < parseFloat(val2);
                    break;
                default:
                    result = false;
            }
            
            console.log(`Comparison result: "${val1}" ${condition.operator} "${val2}" = ${result}`);
            return result;
        };

        let isMatch;
        if (combinator === 'AND') {
            isMatch = conditions.every(evaluateCondition);
        } else {
            isMatch = conditions.some(evaluateCondition);
        }

        return {
            path: isMatch ? 'true' : 'false',
            data: inputData 
        };
    },
};

module.exports = ifNode;