/*
=================================================================
FILE: backend/src/nodes/actions/waitNode.js
=================================================================
This node's logic handles pausing the workflow execution. It has been
updated to support a more detailed configuration from the frontend,
calculating the delay based on a specified amount and unit of time.
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
            // Default configuration for the node
            resumeCondition: 'afterTimeInterval',
            waitAmount: 5,
            waitUnit: 'seconds',
        },
    },

    // This node simply passes data through after a delay.
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
