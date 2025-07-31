/*
=================================================================
BACKEND FILE: src/services/workflowExecutor.js (NEW FILE)
=================================================================
This service handles automatic execution of complete workflows when triggered.
*/

const aiAgentNode = require('../nodes/actions/aiAgentNode');
const modelNode = require('../nodes/actions/modelNode');
const googleDocsNode = require('../nodes/actions/googleDocsNode');
const DataStorageNode = require('../nodes/actions/dataStorageNode');
const telegramSendMessageNode = require('../nodes/actions/telegramSendMessageNode');

class WorkflowExecutor {
    constructor() {
        this.activeWorkflows = new Map(); // Store active workflow configurations
        this.executionHistory = new Map(); // Store execution history for debugging
    }

    // Register a workflow for automatic execution
    registerWorkflow(workflowId, workflowConfig) {
        console.log(`Registering workflow ${workflowId} for automatic execution`);
        
        // Validate workflow structure
        if (!workflowConfig.nodes || !workflowConfig.edges) {
            throw new Error('Workflow must contain nodes and edges');
        }

        // Find trigger node
        const triggerNode = workflowConfig.nodes.find(node => node.data.type === 'trigger');
        if (!triggerNode) {
            throw new Error('Workflow must contain a trigger node');
        }

        // Store workflow configuration
        this.activeWorkflows.set(workflowId, {
            ...workflowConfig,
            triggerNodeId: triggerNode.id,
            isActive: true,
            registeredAt: new Date().toISOString()
        });

        console.log(`Workflow ${workflowId} registered successfully`);
        return true;
    }

    // Deactivate a workflow
    deactivateWorkflow(workflowId) {
        if (this.activeWorkflows.has(workflowId)) {
            const workflow = this.activeWorkflows.get(workflowId);
            workflow.isActive = false;
            workflow.deactivatedAt = new Date().toISOString();
            console.log(`Workflow ${workflowId} deactivated`);
            return true;
        }
        return false;
    }

    // Execute a complete workflow when triggered
    async executeWorkflow(workflowId, triggerData) {
        console.log(`\n=== EXECUTING WORKFLOW ${workflowId} ===`);
        console.log('Trigger data:', JSON.stringify(triggerData, null, 2));

        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow || !workflow.isActive) {
            throw new Error(`Workflow ${workflowId} is not active`);
        }

        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const executionLog = {
            workflowId,
            executionId,
            startTime: new Date().toISOString(),
            steps: [],
            triggerData
        };

        try {
            // Build execution order from workflow graph
            const executionOrder = this.buildExecutionOrder(workflow);
            console.log('Execution order:', executionOrder.map(step => `${step.node.data.label || step.node.data.type} (${step.node.id})`));

            let currentData = triggerData;

            // Execute each node in order
            for (let i = 0; i < executionOrder.length; i++) {
                const step = executionOrder[i];
                const node = step.node;
                
                console.log(`\n--- Step ${i + 1}: Executing ${node.data.label || node.data.type} ---`);
                
                const stepLog = {
                    step: i + 1,
                    nodeId: node.id,
                    nodeType: node.data.type,
                    nodeLabel: node.data.label || node.data.type,
                    startTime: new Date().toISOString(),
                    inputData: currentData
                };

                try {
                    // Skip trigger node (already executed)
                    if (node.data.type === 'trigger') {
                        stepLog.outputData = currentData;
                        stepLog.status = 'skipped';
                        stepLog.message = 'Trigger node - using trigger data';
                    } else {
                        // Execute the node
                        const result = await this.executeNode(node, currentData, workflow);
                        currentData = result; // Use output as input for next node
                        
                        stepLog.outputData = result;
                        stepLog.status = 'success';
                    }
                } catch (error) {
                    console.error(`Error executing node ${node.id}:`, error.message);
                    stepLog.status = 'error';
                    stepLog.error = error.message;
                    stepLog.outputData = { error: error.message };
                    
                    // Continue execution with error data (some nodes might handle errors)
                    currentData = { error: error.message, previousData: currentData };
                }

                stepLog.endTime = new Date().toISOString();
                stepLog.duration = new Date(stepLog.endTime) - new Date(stepLog.startTime) + 'ms';
                executionLog.steps.push(stepLog);

                console.log(`Step ${i + 1} completed:`, stepLog.status === 'success' ? '✅' : stepLog.status === 'error' ? '❌' : '⏭️');
            }

            executionLog.endTime = new Date().toISOString();
            executionLog.status = 'completed';
            executionLog.finalOutput = currentData;
            
            console.log(`\n=== WORKFLOW ${workflowId} COMPLETED ===`);
            console.log(`Total steps: ${executionLog.steps.length}`);
            console.log(`Duration: ${new Date(executionLog.endTime) - new Date(executionLog.startTime)}ms`);

            // Store execution history
            if (!this.executionHistory.has(workflowId)) {
                this.executionHistory.set(workflowId, []);
            }
            this.executionHistory.get(workflowId).push(executionLog);

            // Keep only last 10 executions per workflow
            const history = this.executionHistory.get(workflowId);
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }

            return executionLog;

        } catch (error) {
            console.error(`Workflow execution failed:`, error.message);
            executionLog.endTime = new Date().toISOString();
            executionLog.status = 'failed';
            executionLog.error = error.message;
            
            if (!this.executionHistory.has(workflowId)) {
                this.executionHistory.set(workflowId, []);
            }
            this.executionHistory.get(workflowId).push(executionLog);

            throw error;
        }
    }

    // Build execution order from workflow graph
    buildExecutionOrder(workflow) {
        const { nodes, edges } = workflow;
        const executionOrder = [];
        const visited = new Set();
        
        // Find trigger node (starting point)
        const triggerNode = nodes.find(node => node.data.type === 'trigger');
        if (!triggerNode) {
            throw new Error('No trigger node found in workflow');
        }

        // Recursive function to build execution order
        const addToOrder = (nodeId) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;

            executionOrder.push({
                node,
                inputEdges: edges.filter(edge => edge.target === nodeId)
            });

            // Find and add connected nodes
            const outgoingEdges = edges.filter(edge => edge.source === nodeId);
            for (const edge of outgoingEdges) {
                addToOrder(edge.target);
            }
        };

        addToOrder(triggerNode.id);
        return executionOrder;
    }

    // Execute a single node
    async executeNode(node, inputData, workflow) {
        const nodeConfig = node.data;

        // Find connected Data Storage nodes if this is an AI Agent
        let connectedNodes = [];
        if (nodeConfig.type === 'aiAgent') {
            const incomingEdges = workflow.edges.filter(edge => edge.target === node.id);
            for (const edge of incomingEdges) {
                const sourceNode = workflow.nodes.find(n => n.id === edge.source);
                if (sourceNode && sourceNode.data.type === 'dataStorage') {
                    connectedNodes.push({
                        type: 'dataStorage',
                        data: sourceNode.data.storedData || {},
                        nodeId: sourceNode.id
                    });
                }
            }
        }

        // Execute based on node type
        switch (nodeConfig.type) {
            case 'aiAgent':
                return await aiAgentNode.execute(nodeConfig, inputData, connectedNodes);
            
            case 'modelNode':
                return await modelNode.execute(nodeConfig, inputData);
            
            case 'googleDocs':
                return await googleDocsNode.execute(nodeConfig, inputData);
            
            case 'dataStorage':
                const dataStorageInstance = new DataStorageNode(nodeConfig);
                return await dataStorageInstance.process(inputData);
            
            case 'telegramSendMessage':
                return await telegramSendMessageNode.execute(nodeConfig, inputData);
            
            default:
                throw new Error(`Unsupported node type: ${nodeConfig.type}`);
        }
    }

    // Get workflow status
    getWorkflowStatus(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        const history = this.executionHistory.get(workflowId) || [];
        
        return {
            isRegistered: !!workflow,
            isActive: workflow?.isActive || false,
            registeredAt: workflow?.registeredAt,
            deactivatedAt: workflow?.deactivatedAt,
            totalExecutions: history.length,
            lastExecution: history[history.length - 1]?.startTime,
            lastExecutionStatus: history[history.length - 1]?.status
        };
    }

    // Get execution history
    getExecutionHistory(workflowId, limit = 5) {
        const history = this.executionHistory.get(workflowId) || [];
        return history.slice(-limit).reverse(); // Return most recent first
    }
}

// Create singleton instance
const workflowExecutor = new WorkflowExecutor();

module.exports = workflowExecutor;