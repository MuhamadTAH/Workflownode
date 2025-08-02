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

// Input Panel Component
export const InputPanel = ({ inputData, setInputData, node, formData, onClose }) => {
  const handleGetData = async () => {
    try {
      if (node.data.type === 'trigger' && formData.botToken) {
        // Fetch from Telegram API for Telegram Trigger
        const response = await fetch('https://workflownode.onrender.com/api/telegram/get-updates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ botToken: formData.botToken }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.updates && result.updates.length > 0) {
            // Get the most recent message
            const latestMessage = result.updates[result.updates.length - 1];
            setInputData(JSON.stringify(latestMessage, null, 2));
          } else {
            // No new messages
            setInputData(JSON.stringify({ message: "No new messages found" }, null, 2));
          }
        } else {
          throw new Error('Failed to fetch Telegram updates');
        }
      } else {
        // Default mock data for other node types or when no bot token
        const mockData = {
          message: {
            text: "Hello from Telegram",
            chat: { id: 12345 },
            from: { username: "testuser" }
          }
        };
        setInputData(JSON.stringify(mockData, null, 2));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setInputData(JSON.stringify({ error: error.message }, null, 2));
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
    setOutputData({
      success: true,
      processed: "Sample output data for testing",
      timestamp: new Date().toISOString(),
      nodeType: node.data.type
    });
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

      // Call backend to execute the node
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
    } catch (error) {
      console.error('Error processing data:', error);
      setOutputData({ error: error.message });
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
        <button onClick={handleClose} className="close-button">&times;</button>
      </div>
    </div>
  );
};