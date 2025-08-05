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
const telegramSendMessageNode = require('../../nodes/actions/telegramSendMessageNode');
const fileConverterNode = require('../../nodes/actions/fileConverterNode');

// N8N Logic Nodes Integration
const ifNode = require('../../nodes/actions/ifNode');
const filterNode = require('../../nodes/actions/filterNode');
const mergeNode = require('../../nodes/actions/mergeNode');
const setDataNode = require('../../nodes/actions/setDataNode');
const switchNode = require('../../nodes/actions/switchNode');
const waitNode = require('../../nodes/actions/waitNode');
const stopAndErrorNode = require('../../nodes/actions/stopAndErrorNode');
const loopNode = require('../../nodes/actions/loopNode');
const compareDatasetsNode = require('../../nodes/actions/compareDatasetsNode');
const executeSubWorkflowNode = require('../../nodes/actions/executeSubWorkflowNode');
const linkedinNode = require('../../nodes/actions/linkedinNode');
const whatsappNode = require('../../nodes/actions/whatsappNode');
const instagramNode = require('../../nodes/actions/instagramNode');
const tiktokNode = require('../../nodes/actions/tiktokNode');

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
            case 'telegramSendMessage':
                result = await telegramSendMessageNode.execute(node.config, inputData, connectedNodes);
                break;
            case 'fileConverter':
                result = await fileConverterNode.execute(node.config, inputData, connectedNodes);
                break;
                
            // N8N Logic Nodes
            case 'if':
                result = await ifNode.execute(node.config, inputData);
                break;
            case 'filter':
                result = await filterNode.execute(node.config, inputData);
                break;
            case 'merge':
                result = await mergeNode.execute(node.config, inputData);
                break;
            case 'setData':
                result = await setDataNode.execute(node.config, inputData);
                break;
            case 'switch':
                result = await switchNode.execute(node.config, inputData);
                break;
            case 'wait':
                result = await waitNode.execute(node.config, inputData);
                break;
            case 'stopAndError':
                result = await stopAndErrorNode.execute(node.config, inputData);
                break;
            case 'loop':
                result = await loopNode.execute(node.config, inputData);
                break;
            case 'compareDatasets':
                result = await compareDatasetsNode.execute(node.config, inputData);
                break;
            case 'executeSubWorkflow':
                result = await executeSubWorkflowNode.execute(node.config, inputData);
                break;
            case 'linkedin':
                result = await linkedinNode.executeLinkedInNode(inputData, node.config);
                break;
            case 'whatsapp':
                result = await whatsappNode.executeWhatsAppNode(inputData, node.config);
                break;
            case 'instagram':
                result = await instagramNode.executeInstagramNode(inputData, node.config);
                break;
            case 'tiktok':
                result = await tiktokNode.executeTikTokNode(inputData, node.config);
                break;
                
            default:
                return res.status(400).send({ message: `Node type "${node.type}" is not supported.` });
        }

        res.status(200).json(result);

    } catch (error) {
        console.error('Error running node:', error.message);
        console.error('Full error details:', error);
        res.status(500).send({ 
            message: 'Failed to run node.', 
            error: error.message,
            details: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace'
        });
    }
};

// Memory management endpoints
const getMemoryStats = async (req, res) => {
    try {
        const { userId = 'all' } = req.query;
        const stats = modelNode.getMemoryStats(userId);
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error getting memory stats:', error.message);
        res.status(500).send({ message: 'Failed to get memory stats.', error: error.message });
    }
};

const clearMemory = async (req, res) => {
    try {
        const { userId = 'default' } = req.body;
        const success = modelNode.clearMemory(userId);
        res.status(200).json({ success, message: `Memory cleared for ${userId === 'all' ? 'all users' : 'user: ' + userId}` });
    } catch (error) {
        console.error('Error clearing memory:', error.message);
        res.status(500).send({ message: 'Failed to clear memory.', error: error.message });
    }
};

const exportMemory = async (req, res) => {
    try {
        const { userId = 'all' } = req.query;
        const memoryData = modelNode.exportMemory(userId);
        res.status(200).json({ data: memoryData, userId });
    } catch (error) {
        console.error('Error exporting memory:', error.message);
        res.status(500).send({ message: 'Failed to export memory.', error: error.message });
    }
};

const importMemory = async (req, res) => {
    try {
        const { jsonData, userId = null } = req.body;
        if (!jsonData) {
            return res.status(400).send({ message: 'JSON data is required for import.' });
        }
        const success = modelNode.importMemory(jsonData, userId);
        res.status(200).json({ success, message: success ? 'Memory imported successfully' : 'Failed to import memory' });
    } catch (error) {
        console.error('Error importing memory:', error.message);
        res.status(500).send({ message: 'Failed to import memory.', error: error.message });
    }
};

module.exports = {
    runNode,
    getMemoryStats,
    clearMemory,
    exportMemory,
    importMemory,
};
