/*
=================================================================
FILE: src/nodes/actions/waitNode.js - INTEGRATED FROM N8N-LOGIC-NODES
=================================================================
Wait node for pausing workflow execution for a specified time.
Supports various time units (seconds, minutes, hours, days).
*/

const waitNode = {
    description: {
        displayName: 'Wait',
        name: 'wait',
        icon: 'fa:clock',
        group: 'actions',
        version: 1,
        description: 'Wait before continue with execution.',
        defaults: {
            name: 'Wait',
            resumeCondition: 'afterTimeInterval',
            waitAmount: 5,
            waitUnit: 'seconds',
        },
        properties: [
            {
                displayName: 'Resume Condition',
                name: 'resumeCondition',
                type: 'options',
                default: 'afterTimeInterval',
                options: [
                    { name: 'After Time Interval', value: 'afterTimeInterval' },
                    { name: 'At Specific Time', value: 'atSpecificTime' },
                    { name: 'On Webhook Call', value: 'onWebhookCall' },
                ],
            },
            {
                displayName: 'Wait Amount',
                name: 'waitAmount',
                type: 'number',
                default: 5,
                displayOptions: {
                    show: {
                        resumeCondition: ['afterTimeInterval'],
                    },
                },
                description: 'How long to wait',
            },
            {
                displayName: 'Wait Unit',
                name: 'waitUnit',
                type: 'options',
                default: 'seconds',
                options: [
                    { name: 'Seconds', value: 'seconds' },
                    { name: 'Minutes', value: 'minutes' },
                    { name: 'Hours', value: 'hours' },
                    { name: 'Days', value: 'days' },
                ],
                displayOptions: {
                    show: {
                        resumeCondition: ['afterTimeInterval'],
                    },
                },
            },
        ],
    },

    async execute(config, inputData) {
        console.log('Executing Wait Node with config:', config);
        
        const { resumeCondition, waitAmount, waitUnit } = config;

        // For now, we only implement the 'afterTimeInterval' logic.
        // Other conditions like waiting for a webhook would be added here.
        if (resumeCondition === 'afterTimeInterval') {
            const amount = parseFloat(waitAmount) || 0;
            let delayInMs = 0;

            // Calculate the total delay in milliseconds based on the unit.
            switch (waitUnit) {
                case 'seconds':
                    delayInMs = amount * 1000;
                    break;
                case 'minutes':
                    delayInMs = amount * 60 * 1000;
                    break;
                case 'hours':
                    delayInMs = amount * 60 * 60 * 1000;
                    break;
                case 'days':
                    delayInMs = amount * 24 * 60 * 60 * 1000;
                    break;
                default:
                    throw new Error(`Unknown wait unit: ${waitUnit}`);
            }

            console.log(`Waiting for ${amount} ${waitUnit} (${delayInMs}ms)...`);
            
            // Pause the execution for the calculated duration.
            await new Promise(resolve => setTimeout(resolve, delayInMs));

            console.log('Wait finished. Passing data through.');
        } else {
            // Placeholder for future logic for other resume conditions.
            console.log(`Wait condition '${resumeCondition}' is not yet implemented. Passing data through immediately.`);
        }
        
        // Return the original data, unmodified.
        return inputData;
    },
};

module.exports = waitNode;