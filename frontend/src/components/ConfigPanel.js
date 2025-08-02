/*
=================================================================
FILE: frontend/src/components/ConfigPanel.js (MODULAR)
=================================================================
Main ConfigPanel Component - Orchestrates modular components
- Uses separated components for different functionalities
- Maintains all existing functionality with cleaner structure
- Enhanced with auto-save, drag-and-drop, and advanced node support
*/
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Import modular components
import { InputPanel, OutputPanel, MainPanelHeader } from './configpanel/PanelSections';
import { renderNodeParameters } from './configpanel/NodeParameters';
import { 
  useAutoSave, 
  useFormFieldChangeHandler, 
  createFormChangeHandler,
  createInputChangeHandler,
  createAddConditionHandler,
  createRemoveConditionHandler,
  createTestNodeHandler,
  initializeFormData
} from './configpanel/utils';

const ConfigPanel = ({ node, onClose }) => {
  // Enhanced state management - keeping existing simple state + adding advanced features
  const [formData, setFormData] = useState(() => initializeFormData(node));
  
  // Existing simple state (preserved)
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Advanced state management added back
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [apiKeyVerificationStatus, setApiKeyVerificationStatus] = useState(null);
  const [googleAuthStatus, setGoogleAuthStatus] = useState(null);
  const [memoryActionResult, setMemoryActionResult] = useState(null);
  const [memoryQuickStats, setMemoryQuickStats] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [selectedNodeId, setSelectedNodeId] = useState(''); // Selected node ID
  const [availableNodes, setAvailableNodes] = useState([]); // List of connected nodes
  const [selectedDataSource, setSelectedDataSource] = useState('auto'); // 'auto' or specific node ID

  // Auto-save functionality
  const autoSave = useAutoSave(formData, node.id, setAutoSaveStatus);

  // Create handlers using utility functions
  const handleFormFieldChange = useFormFieldChangeHandler(setFormData, autoSave);
  const handleFormChange = createFormChangeHandler(formData, setFormData);
  const handleInputChange = createInputChangeHandler(formData, setFormData);
  const addCondition = createAddConditionHandler(formData, setFormData);
  const removeCondition = createRemoveConditionHandler(formData, setFormData);
  const handleTestNode = createTestNodeHandler(node, formData, inputData, setIsLoading, setOutputData);

  const handleClose = () => {
    onClose({ ...node.data, ...formData });
  };

  // Enhanced Execute button - runs GET then POST automatically
  const handleExecuteStep = async () => {
    setIsLoading(true);
    try {
      // Step 1: GET - Fetch input data
      let fetchedInputData = null;
      
      if (node.data.type === 'trigger' && formData.botToken) {
        // Fetch from Telegram API for Telegram Trigger
        const response = await fetch('https://workflownode.onrender.com/api/telegram/get-updates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: formData.botToken }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.updates && result.updates.length > 0) {
            const latestMessage = result.updates[result.updates.length - 1];
            fetchedInputData = latestMessage;
          } else {
            fetchedInputData = { message: "No new messages found" };
          }
        } else {
          throw new Error('Failed to fetch Telegram updates');
        }
      } else {
        // Default mock data for other node types
        fetchedInputData = {
          message: {
            text: "Hello from Telegram",
            chat: { id: 12345 },
            from: { username: "testuser" }
          }
        };
      }

      // Update input data display
      setInputData(JSON.stringify(fetchedInputData, null, 2));

      // Step 2: POST - Process the data
      const executeResponse = await fetch('https://workflownode.onrender.com/api/nodes/run-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node: {
            type: node.data.type,
            config: formData,
          },
          inputData: fetchedInputData,
        }),
      });

      const executeResult = await executeResponse.json();
      if (!executeResponse.ok) {
        throw new Error(executeResult.message || 'Failed to execute node');
      }
      
      setOutputData(executeResult);
    } catch (error) {
      console.error('Error in execute step:', error);
      setOutputData({ error: error.message });
    }
    setIsLoading(false);
  };

  // Telegram token validation handler
  const handleTelegramTokenCheck = async (token) => {
    if (!token || token.length < 10) {
      return;
    }

    // Set checking state
    setFormData(prev => ({
      ...prev,
      tokenChecking: true,
      tokenStatus: null,
      tokenError: null,
      botInfo: null
    }));

    try {
      // Call backend API to verify token
      const response = await fetch('https://workflownode.onrender.com/api/telegram/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        // Token is valid
        setFormData(prev => ({
          ...prev,
          tokenChecking: false,
          tokenStatus: 'valid',
          botInfo: result.bot,
          tokenError: null
        }));
      } else {
        // Token is invalid
        setFormData(prev => ({
          ...prev,
          tokenChecking: false,
          tokenStatus: 'invalid',
          tokenError: result.message || 'Invalid bot token',
          botInfo: null
        }));
      }
    } catch (error) {
      console.error('Error verifying Telegram token:', error);
      setFormData(prev => ({
        ...prev,
        tokenChecking: false,
        tokenStatus: 'invalid',
        tokenError: 'Failed to connect to verification service',
        botInfo: null
      }));
    }
  };

  return (
    <div className="config-panel-overlay" onClick={handleClose}>
      {/* Enhanced INPUT Panel */}
      <InputPanel 
        inputData={inputData}
        setInputData={setInputData}
        node={node}
        formData={formData}
        onClose={handleClose}
      />

      {/* Enhanced MAIN Panel */}
      <div className="main-panel" onClick={(e) => e.stopPropagation()}>
        <MainPanelHeader 
          node={node}
          autoSaveStatus={autoSaveStatus}
          isLoading={isLoading}
          handleTestNode={handleExecuteStep}
          handleClose={handleClose}
        />
        <div className="panel-content">
          <div className="tabs">
            <button className="tab active">Parameters</button>
            <button className="tab">Settings</button>
          </div>
          <div className="parameters-content">
            {renderNodeParameters(
              node,
              formData,
              handleFormFieldChange,
              handleInputChange,
              handleFormChange,
              addCondition,
              removeCondition,
              inputData,
              handleTelegramTokenCheck
            )}
          </div>
        </div>
      </div>

      {/* Enhanced OUTPUT Panel */}
      <OutputPanel 
        outputData={outputData}
        setOutputData={setOutputData}
        isLoading={isLoading}
        node={node}
        formData={formData}
        inputData={inputData}
        autoSaveStatus={autoSaveStatus}
      />
    </div>
  );
};

export default ConfigPanel;