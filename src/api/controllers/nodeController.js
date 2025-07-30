/*
=================================================================
BACKEND FILE: src/api/controllers/nodeController.js (NEW FILE)
=================================================================
This controller contains the logic to execute a specific node.
*/

const aiAgentNode = require('../../nodes/actions/aiAgentNode');
const modelNode = require('../../nodes/actions/modelNode');
const googleDocsNode = require('../../nodes/actions/googleDocsNode');
const DataStorageNode = require('../../nodes/actions/dataStorageNode');

const runNode = async (req, res) => {
    try {
        const { node, inputData, connectedNodes } = req.body;

        if (!node || !node.type) {
            return res.status(400).send({ message: 'A valid node object is required.' });
        }

        let result;

        console.log('=== Node Execution ===');
        console.log('Node type:', node.type);
        console.log('Connected nodes:', connectedNodes ? connectedNodes.length : 0);

        // We use a switch statement to handle different node types in the future.
        switch (node.type) {
            case 'aiAgent':
                result = await aiAgentNode.execute(node.config, inputData, connectedNodes);
                break;
            case 'modelNode':
                result = await modelNode.execute(node.config, inputData);
                break;
            case 'googleDocs':
                result = await googleDocsNode.execute(node.config, inputData);
                break;
            case 'dataStorage':
                const dataStorageInstance = new DataStorageNode(node.config);
                result = await dataStorageInstance.process(inputData);
                break;
            default:
                return res.status(400).send({ message: `Node type "${node.type}" is not supported.` });
        }

        res.status(200).json(result);

    } catch (error) {
        console.error('Error running node:', error.message);
        res.status(500).send({ message: 'Failed to run node.', error: error.message });
    }
};

module.exports = {
    runNode,
};
