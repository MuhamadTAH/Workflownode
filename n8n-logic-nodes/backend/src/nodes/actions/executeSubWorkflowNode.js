/*
=================================================================
FILE: backend/src/nodes/actions/executeSubWorkflowNode.js (UPDATED)
=================================================================
This node's logic has been updated to handle the new configuration
options from the frontend, such as source, workflow ID, and mode.
*/
const executeSubWorkflowNode = {
    description: {
        displayName: 'Execute Workflow',
        name: 'executeSubWorkflow',
        icon: 'fa:arrow-right',
        group: 'actions',
        version: 1,
        description: 'Calls another workflow and passes data to it.',
        defaults: {
            name: 'Execute Workflow',
            // NEW: Updated default configuration
            source: 'database',
            workflow: 'fromList',
            workflowId: '',
            mode: 'runOnce',
        },
    },

    async execute(config, inputData) {
        console.log('Executing Execute Workflow Node with config:', config);
        
        const { workflowId, mode } = config;

        if (!workflowId) {
            throw new Error('Workflow ID is required to execute a sub-workflow.');
        }

        // In a real engine, this would trigger a new workflow execution
        // with the inputData and wait for its result. The 'mode' would
        // determine if it runs once or for each item in inputData.
        console.log(`Simulating execution of sub-workflow ID: ${workflowId} with mode: ${mode}`);
        
        // Return a mock output that represents the result from the sub-workflow.
        return {
            subWorkflowOutput: `Data from sub-workflow ${workflowId}`,
            originalData: inputData
        };
    },
};

module.exports = executeSubWorkflowNode;
