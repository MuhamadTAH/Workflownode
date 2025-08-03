
/*
=================================================================
FILE: frontend/src/components/configpanel/PanelSections.js
=================================================================
Panel Section Components for ConfigPanel
- InputPanel: Left panel showing input data with JSON viewer
- OutputPanel: Right panel showing output data and execution results
- EmptyState: Components for when no data is available
*/

import React from 'react';
import { NodeOrganizedJSONViewer } from './JSONViewer';
import { getNodeMetadata } from '../../config/nodeMetadata';

// Helper function for in-memory storage (clears on page refresh)
const saveToMemoryStorage = (key, data) => {
  try {
    if (!window.panelDataStorage) {
      window.panelDataStorage = {};
    }
    window.panelDataStorage[key] = data;
  } catch (error) {
    console.warn('Failed to save to memory storage:', error);
  }
};

// Helper function to find nodes connected to the current node as inputs
const findConnectedPreviousNodes = (currentNodeId, edges, nodes) => {
  if (!edges || !nodes) return [];
 
  // Find edges where the current node is the target
  const incomingEdges = edges.filter(edge => edge.target === currentNodeId);
 
  // Get the source nodes for these edges
  const sourceNodeIds = incomingEdges.map(edge => edge.source);
 
  // Find the actual node objects
  const connectedNodes = nodes.filter(node => sourceNodeIds.includes(node.id));
 
  return connectedNodes;
};

// NEW: Helper function to trace the entire workflow chain from beginning to current node
const traceWorkflowChain = (currentNodeId, edges, nodes) => {
  if (!edges || !nodes) return [];
  
  const workflowChain = [];
  const visited = new Set();
  
  // Recursive function to build the chain
  const buildChain = (nodeId) => {
    if (visited.has(nodeId)) return; // Prevent infinite loops
    visited.add(nodeId);
    
    // Find edges where this node is the target (incoming connections)
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    
    if (incomingEdges.length === 0) {
      // This is a start node (no incoming connections)
      const startNode = nodes.find(n => n.id === nodeId);
      if (startNode) {
        workflowChain.unshift({
          id: startNode.id,
          type: startNode.data.type,
          label: startNode.data.label,
          position: 'start',
          node: startNode
        });
      }
    } else {
      // This node has previous nodes, trace them first
      for (const edge of incomingEdges) {
        buildChain(edge.source); // Recursive call to build previous nodes
      }
      
      // Add current node to chain
      const currentNode = nodes.find(n => n.id === nodeId);
      if (currentNode) {
        workflowChain.push({
          id: currentNode.id,
          type: currentNode.data.type,
          label: currentNode.data.label,
          position: workflowChain.length === 0 ? 'start' : 'middle',
          node: currentNode
        });
      }
    }
  };
  
  // Build the chain for current node
  buildChain(currentNodeId);
  
  // Remove the current node from the chain (we only want previous nodes)
  const filteredChain = workflowChain.filter(item => item.id !== currentNodeId);
  
  // REVERSE the chain to show immediate previous nodes first
  // This changes: [Telegram, AI Agent] → [AI Agent, Telegram]
  return filteredChain.reverse();
};

// Helper function to get stored output data from connected nodes
const getConnectedNodesData = async (connectedNodes) => {
  try {
    // Look for stored execution data in sessionStorage (temporary, clears on refresh)
    const nodeExecutionData = {};
    let hasAnyData = false;
    
    for (const connectedNode of connectedNodes) {
      const storageKey = `temp-node-execution-${connectedNode.id}`;
      const storedData = sessionStorage.getItem(storageKey);
      
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          nodeExecutionData[connectedNode.data.type || connectedNode.id] = parsedData.outputData || parsedData;
          hasAnyData = true;
        } catch (e) {
          console.warn(`Failed to parse stored data for node ${connectedNode.id}:`, e);
        }
      }
    }
    
    if (hasAnyData) {
      // Return combined data from all connected nodes
      if (connectedNodes.length === 1) {
        // Single connected node - return its data directly
        const singleNodeData = Object.values(nodeExecutionData)[0];
        return singleNodeData;
      } else {
        // Multiple connected nodes - return organized data
        return {
          _connectedNodesData: nodeExecutionData,
          _metadata: {
            connectedNodes: connectedNodes.length,
            nodeTypes: connectedNodes.map(n => n.data.type),
            timestamp: new Date().toISOString()
          }
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting connected nodes data:', error);
    return null;
  }
};

// NEW: Function to get data from entire workflow chain
const getWorkflowChainData = async (workflowChain) => {
  try {
    const chainData = {};
    let hasAnyData = false;
    
    // Process nodes in workflow order (from beginning to current position)
    for (let i = 0; i < workflowChain.length; i++) {
      const chainNode = workflowChain[i];
      const storageKey = `temp-node-execution-${chainNode.id}`;
      const storedData = sessionStorage.getItem(storageKey);
      
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          
          // Get only output data from previous nodes
          if (parsedData.outputData) {
            // Create a readable node name (replace spaces with underscores for consistent key format)
            const nodeDisplayName = (chainNode.label || `${chainNode.type}_${chainNode.id.slice(-4)}`).replace(/ /g, '_');
            
            // Store only the pure output data, no metadata
            chainData[`step_${i + 1}_${nodeDisplayName}`] = parsedData.outputData;
            hasAnyData = true;
          }
          
        } catch (parseError) {
          console.warn(`Failed to parse stored data for chain node ${chainNode.id}:`, parseError);
        }
      } else {
        // Node has no stored data, show simple message (replace spaces with underscores for consistent key format)
        const nodeDisplayName = (chainNode.label || `${chainNode.type}_${chainNode.id.slice(-4)}`).replace(/ /g, '_');
        chainData[`step_${i + 1}_${nodeDisplayName}`] = 'No execution data available for this node';
      }
    }
    
    if (hasAnyData || Object.keys(chainData).length > 0) {
      return chainData;  // Return only the clean node data, no metadata
    }
    
    return null;
  } catch (error) {
    console.error('Error getting workflow chain data:', error);
    return null;
  }
};

// Input Panel Component
export const InputPanel = ({ inputData, setInputData, node, formData, onClose, edges, nodes }) => {
  const handleGetData = async () => {
    try {
      // NEW: Trace the entire workflow chain from beginning to current node
      const workflowChain = traceWorkflowChain(node.id, edges, nodes);
      
      if (workflowChain.length > 0) {
        console.log(`🔗 Found workflow chain with ${workflowChain.length} nodes:`, workflowChain.map(n => n.type));
        
        // Get data from the entire workflow chain (from beginning to current)
        const chainData = await getWorkflowChainData(workflowChain);
        
        if (chainData) {
          const jsonData = JSON.stringify(chainData, null, 2);
          setInputData(jsonData);
          // Also save to in-memory storage (clears on refresh)
          saveToMemoryStorage(`input-${node.id}`, jsonData);
          return;
        }
        
        // Fallback: If no chain data, try immediate previous nodes
        const connectedPreviousNodes = findConnectedPreviousNodes(node.id, edges, nodes);
        if (connectedPreviousNodes.length > 0) {
          const connectedData = await getConnectedNodesData(connectedPreviousNodes);
          if (connectedData) {
            const jsonData = JSON.stringify({
              _immediateConnections: connectedData,
              _note: "Showing immediate connections only - workflow chain data not available"
            }, null, 2);
            setInputData(jsonData);
            // Also save to in-memory storage (clears on refresh)
            saveToMemoryStorage(`input-${node.id}`, jsonData);
            return;
          }
        }
      }

      // Fallback to original logic if no connected nodes or no stored data
      const botToken = formData.botToken || node.data.botToken || formData.token || node.data.token;
      
      if (node.data.type === 'trigger' && botToken) {
        // First, try to delete any existing webhook to avoid conflicts
        try {
          await fetch('https://workflownode.onrender.com/api/telegram/delete-webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: botToken }),
          });
        } catch (webhookError) {
          console.warn('Webhook deletion failed, continuing anyway:', webhookError);
        }
        
        // Now fetch from Telegram API for Telegram Trigger
        const response = await fetch('https://workflownode.onrender.com/api/telegram/get-updates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: botToken }),
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.updates && result.updates.length > 0) {
            // Get the most recent message
            const latestMessage = result.updates[result.updates.length - 1];
            const jsonData = JSON.stringify(latestMessage, null, 2);
            setInputData(jsonData);
            // Also save to in-memory storage (clears on refresh)
            saveToMemoryStorage(`input-${node.id}`, jsonData);
          } else {
            // No new messages
            const jsonData = JSON.stringify({ message: "No new messages found" }, null, 2);
            setInputData(jsonData);
            // Also save to in-memory storage (clears on refresh)
            saveToMemoryStorage(`input-${node.id}`, jsonData);
          }
        } else {
          const errorResult = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Telegram API error response:', errorResult);
          throw new Error(errorResult.message || 'Failed to fetch Telegram updates');
        }
      } else {
        // Default mock data for other node types or when no bot token
        if (node.data.type === 'trigger') {
          const jsonData = JSON.stringify({ error: "Bot token not found. Please configure the Telegram Trigger node first." }, null, 2);
          setInputData(jsonData);
          // Also save to in-memory storage (clears on refresh)
          saveToMemoryStorage(`input-${node.id}`, jsonData);
        } else {
          const mockData = {
            message: {
              text: "Hello from Telegram",
              chat: { id: 12345 },
              from: { username: "testuser" }
            }
          };
          const jsonData = JSON.stringify(mockData, null, 2);
          setInputData(jsonData);
          // Also save to in-memory storage (clears on refresh)
          saveToMemoryStorage(`input-${node.id}`, jsonData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      const jsonData = JSON.stringify({ error: error.message }, null, 2);
      setInputData(jsonData);
      // Also save to in-memory storage (clears on refresh)
      saveToMemoryStorage(`input-${node.id}`, jsonData);
    }
  };

  return (
    <div className="side-panel input-panel" onClick={(e) => e.stopPropagation()}>
      <div className="panel-header">
        <h3>INPUT</h3>
        <button onClick={handleGetData} className="action-button">
          GET
        </button>
      </div>
      <div className="panel-content">
        {inputData ? (
          <>
            <NodeOrganizedJSONViewer
              data={JSON.parse(inputData)}
              onFieldDrag={(path, value) => console.log('Drag:', path, value)}
            />
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <strong>Drag fields above</strong> into the Parameters section to create template variables.
            </div>
          </>
        ) : (
          <EmptyInputState />
        )}
      </div>
    </div>
  );
};

// Output Panel Component
export const OutputPanel = ({ outputData, setOutputData, isLoading, node, formData, inputData, autoSaveStatus }) => {
  const handleMockOutput = () => {
    // Set mock output data
    const mockOutput = {
      success: true,
      processed: "Sample output data for testing",
      timestamp: new Date().toISOString(),
      nodeType: node.data.type
    };
    setOutputData(mockOutput);
    // Also save to in-memory storage (clears on refresh)
    saveToMemoryStorage(`output-${node.id}`, mockOutput);
  };

  const handlePostData = async () => {
    try {
      // Parse input data
      let parsedInput;
      try {
        parsedInput = inputData ? JSON.parse(inputData) : {};
      } catch (e) {
        throw new Error("Invalid JSON in Input data");
      }

      // Handle trigger nodes differently - they don't execute, they just pass through data
      if (node.data.type === 'trigger') {
        // For trigger nodes, POST just formats the input data as output
        const triggerOutput = {
          success: true,
          trigger: "telegram",
          message: "Trigger node activated - data passed through",
          data: parsedInput,
          timestamp: new Date().toISOString(),
          nodeId: node.id,
          nodeType: node.data.type
        };
        setOutputData(triggerOutput);
        // Also save to in-memory storage (clears on refresh)
        saveToMemoryStorage(`output-${node.id}`, triggerOutput);
        return;
      }

      // Handle Telegram Send Message nodes - use the backend node executor
      if (node.data.type === 'telegramSendMessage') {
        // Let the backend handle all template processing and validation
        const response = await fetch('https://workflownode.onrender.com/api/nodes/run-node', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            node: {
              type: node.data.type,
              config: formData,
            },
            inputData: parsedInput,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to send Telegram message');
        }
        
        setOutputData(result);
        // Also save to in-memory storage (clears on refresh)
        saveToMemoryStorage(`output-${node.id}`, result);
        return;
      }

      // For other node types, call backend to execute the node
      const response = await fetch('https://workflownode.onrender.com/api/nodes/run-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node: {
            type: node.data.type,
            config: formData,
          },
          inputData: parsedInput,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to execute node');
      }
      
      setOutputData(result);
      // Also save to in-memory storage (clears on refresh)
      saveToMemoryStorage(`output-${node.id}`, result);
    } catch (error) {
      console.error('Error processing data:', error);
      const errorOutput = { error: error.message };
      setOutputData(errorOutput);
      // Also save to in-memory storage (clears on refresh)
      saveToMemoryStorage(`output-${node.id}`, errorOutput);
    }
  };

  return (
    <div className="side-panel output-panel" onClick={(e) => e.stopPropagation()}>
      <div className="panel-header">
        <h3>OUTPUT</h3>
        <button
          onClick={handlePostData}
          disabled={isLoading}
          className="action-button"
        >
          POST
        </button>
      </div>
      <div className="panel-content">
        {outputData ? (
          <>
            {outputData.error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <strong>Error:</strong> {outputData.error}
              </div>
            ) : (
              <NodeOrganizedJSONViewer
                data={outputData}
                onFieldDrag={(path, value) => console.log('Output drag:', path, value)}
              />
            )}
            
            {/* Auto-save status */}
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <div className="flex justify-between items-center">
                <span>Configuration auto-saved</span>
                <span className={`font-mono ${
                  autoSaveStatus === 'saved' ? 'text-green-600' :
                  autoSaveStatus === 'saving' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {autoSaveStatus}
                </span>
              </div>
            </div>
          </>
        ) : (
          <EmptyOutputState onMockData={handleMockOutput} />
        )}
      </div>
    </div>
  );
};

// Empty State Components
export const EmptyInputState = () => (
  <div className="empty-state">
    <i className="fa-solid fa-hand-pointer text-4xl text-gray-300 mb-4"></i>
    <h4 className="font-bold text-gray-500">Wire me up</h4>
    <p className="text-xs text-gray-400">
      This node can receive input data from connected nodes or use the GET button to fetch test data.
    </p>
  </div>
);

export const EmptyOutputState = ({ onMockData }) => (
  <div className="empty-state">
    <i className="fa-solid fa-play-circle text-4xl text-gray-300 mb-4"></i>
    <p className="text-gray-500 font-semibold">Execute this node to view data</p>
    <button onClick={onMockData} className="mock-data-btn">
      or set mock data
    </button>
  </div>
);

// Main Panel Header Component
export const MainPanelHeader = ({ node, autoSaveStatus, isLoading, handleTestNode, handleClose }) => {
  const metadata = getNodeMetadata(node.data.type);
 
  return (
    <div className="panel-header">
      <h3 style={{ color: metadata.color }}>
        <span className="node-icon" style={{ fontSize: '18px', marginRight: '8px' }}>
          {metadata.icon}
        </span>
        {metadata.title}
      </h3>
      <div className="flex items-center gap-2">
        {autoSaveStatus === 'saving' && (
          <span className="text-xs text-yellow-600">
            <i className="fa-solid fa-spinner fa-spin mr-1"></i>Saving...
          </span>
        )}
        {autoSaveStatus === 'saved' && (
          <span className="text-xs text-green-600">
            <i className="fa-solid fa-check mr-1"></i>Saved
          </span>
        )}
        <button onClick={handleTestNode} disabled={isLoading} className="execute-step-btn">
          <i className="fa-solid fa-play mr-2"></i>
          {isLoading ? 'Executing...' : 'Execute Step'}
        </button>
        <button onClick={handleClose} className="close-button">×</button>
      </div>
    </div>
  );
};
    