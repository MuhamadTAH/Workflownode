/*
=================================================================
FILE: backend/src/api/controllers/nodeController.js (UPDATED)
=================================================================
This controller acts as a dispatcher. It has been updated to
recognize and handle the new 'switch' node type.
*/
const filterNode = require('../../nodes/actions/filterNode');
const ifNode = require('../../nodes/actions/ifNode');
const loopNode = require('../../nodes/actions/loopNode');
const mergeNode = require('../../nodes/actions/mergeNode');
const compareDatasetsNode = require('../../nodes/actions/compareDatasetsNode');
const switchNode = require('../../nodes/actions/switchNode'); // <-- Import the new node
const stopAndErrorNode = require('../../nodes/actions/stopAndErrorNode');
const waitNode = require('../../nodes/actions/waitNode');
const executeSubWorkflowNode = require('../../nodes/actions/executeSubWorkflowNode');

/**
 * Executes a single node's logic based on its type.
 * @param {object} req - The Express request object, containing the node and its input data.
 * @param {object} res - The Express response object.
 */
const runNode = async (req, res) => {
    try {
        const { node, inputData } = req.body;

        if (!node || !node.type) {
            return res.status(400).json({ message: 'A valid node object is required.' });
        }

        let result;

        // Use a switch statement to delegate to the correct node's execute function.
        switch (node.type) {
            case 'filter':
                result = await filterNode.execute(node.config, inputData);
                break;
            case 'if':
                result = await ifNode.execute(node.config, inputData);
                break;
            case 'loop':
                result = await loopNode.execute(node.config, inputData);
                break;
            case 'merge':
                result = await mergeNode.execute(node.config, inputData);
                break;
            case 'compare':
                result = await compareDatasetsNode.execute(node.config, inputData);
                break;
            case 'switch': // <-- Add the case for the switch node
                result = await switchNode.execute(node.config, inputData);
                break;
            case 'stopAndError':
                result = await stopAndErrorNode.execute(node.config, inputData);
                break;
            case 'wait':
                result = await waitNode.execute(node.config, inputData);
                break;
            case 'executeSubWorkflow':
                result = await executeSubWorkflowNode.execute(node.config, inputData);
                break;
            default:
                return res.status(400).json({ message: `Node type "${node.type}" is not supported.` });
        }

        res.status(200).json(result);

    } catch (error) {
        console.error('Error running node:', error.message);
        // Return the specific error message from the node (e.g., from Stop and Error node).
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    runNode,
};
