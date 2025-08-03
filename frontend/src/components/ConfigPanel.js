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

const ConfigPanel = ({ node, onClose, edges, nodes }) => {
  // Enhanced state management - keeping existing simple state + adding advanced features
  const [formData, setFormData] = useState(() => initializeFormData(node));
  
  // Enhanced state with sessionStorage persistence for INPUT/OUTPUT panel data (clears on refresh)
  const [inputData, setInputData] = useState(() => {
    try {
      const savedInputData = sessionStorage.getItem(`panel-input-${node.id}`);
      return savedInputData || '';
    } catch (error) {
      console.warn('Failed to load saved input data:', error);
      return '';
    }
  });
  
  const [outputData, setOutputData] = useState(() => {
    try {
      const savedOutputData = sessionStorage.getItem(`panel-output-${node.id}`);
      return savedOutputData ? JSON.parse(savedOutputData) : null;
    } catch (error) {
      console.warn('Failed to load saved output data:', error);
      return null;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced setters that store data in sessionStorage (persists during session, clears on refresh)
  const setInputDataWithTempStorage = (data) => {
    setInputData(data);
    
    // Store in sessionStorage for panel persistence during session only
    try {
      sessionStorage.setItem(`panel-input-${node.id}`, data);
    } catch (error) {
      console.warn('Failed to save input data to sessionStorage:', error);
    }
    
    // Store temporarily for connected nodes to access during this session only
    try {
      const storageKey = `temp-node-execution-${node.id}`;
      let parsedInputData = data;
      
      if (typeof data === 'string' && data.trim()) {
        try {
          parsedInputData = JSON.parse(data);
        } catch (e) {
          parsedInputData = data;
        }
      }
      
      const tempData = {
        nodeId: node.id,
        nodeType: node.data.type,
        inputData: parsedInputData,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem(storageKey, JSON.stringify(tempData));
    } catch (error) {
      console.warn('Failed to store temp input data:', error);
    }
  };

  const setOutputDataWithTempStorage = (data) => {
    setOutputData(data);
    
    // Store in sessionStorage for panel persistence during session only
    try {
      sessionStorage.setItem(`panel-output-${node.id}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save output data to sessionStorage:', error);
    }
    
    // Store temporarily for connected nodes to access during this session only
    try {
      const storageKey = `temp-node-execution-${node.id}`;
      const existingData = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      const tempData = {
        ...existingData,
        nodeId: node.id,
        nodeType: node.data.type,
        outputData: data,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem(storageKey, JSON.stringify(tempData));
    } catch (error) {
      console.warn('Failed to store temp output data:', error);
    }
  };

  // Advanced state management added back
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [apiKeyVerificationStatus, setApiKeyVerificationStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('parameters');
  const [claudeApiStatus, setClaudeApiStatus] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
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
          console.warn('Webhook deletion failed in Execute, continuing anyway:', webhookError);
        }
        
        // Fetch from Telegram API for Telegram Trigger
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
      setInputDataWithTempStorage(JSON.stringify(fetchedInputData, null, 2));

      // Step 2: POST - Process the data
      if (node.data.type === 'trigger') {
        // For trigger nodes, just format the input data as output
        const triggerOutput = {
          success: true,
          trigger: "telegram",
          message: "Trigger node activated - data passed through",
          data: fetchedInputData,
          timestamp: new Date().toISOString(),
          nodeId: node.id,
          nodeType: node.data.type
        };
        setOutputDataWithTempStorage(triggerOutput);
      } else if (node.data.type === 'telegramSendMessage') {
        // Handle Telegram Send Message nodes
        if (!formData.botToken) {
          throw new Error('Bot token is required');
        }
        if (!formData.chatId) {
          throw new Error('Chat ID is required');
        }
        if (!formData.message) {
          throw new Error('Message is required');
        }

        // Process template variables in the message
        let processedMessage = formData.message;
        
        // Simple template variable replacement
        if (fetchedInputData) {
          // Replace common template patterns
          processedMessage = processedMessage.replace(/\{\{message\.text\}\}/g, fetchedInputData.message?.text || '');
          processedMessage = processedMessage.replace(/\{\{message\.from\.username\}\}/g, fetchedInputData.message?.from?.username || '');
          processedMessage = processedMessage.replace(/\{\{message\.from\.first_name\}\}/g, fetchedInputData.message?.from?.first_name || '');
          processedMessage = processedMessage.replace(/\{\{message\.chat\.id\}\}/g, fetchedInputData.message?.chat?.id || '');
          
          // Replace any JSON path patterns
          processedMessage = processedMessage.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            try {
              const value = path.split('.').reduce((obj, key) => obj?.[key], fetchedInputData);
              return value !== undefined ? String(value) : match;
            } catch (e) {
              return match;
            }
          });
        }

        // Call backend to send the message
        const sendResponse = await fetch('https://workflownode.onrender.com/api/telegram/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: formData.botToken,
            chatId: formData.chatId,
            message: processedMessage,
          }),
        });

        const sendResult = await sendResponse.json();
        if (!sendResponse.ok) {
          throw new Error(sendResult.message || 'Failed to send message');
        }
        
        const telegramOutput = {
          ...sendResult,
          originalMessage: formData.message,
          processedMessage: processedMessage,
          inputData: fetchedInputData
        };
        setOutputDataWithTempStorage(telegramOutput);
      } else {
        // For other node types, call backend to execute the node
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
        
        setOutputDataWithTempStorage(executeResult);
      }
    } catch (error) {
      console.error('Error in execute step:', error);
      setOutputDataWithTempStorage({ error: error.message });
    }
    setIsLoading(false);
  };

  // Claude API key validation handler
  const handleClaudeApiCheck = async (apiKey) => {
    if (!apiKey || apiKey.length < 10) {
      setClaudeApiStatus({ status: 'invalid', message: 'API key is too short' });
      return;
    }

    setClaudeApiStatus({ status: 'checking', message: 'Verifying API key...' });

    try {
      const response = await fetch('https://workflownode.onrender.com/api/ai/verify-claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey }),
      });

      const result = await response.json();
      console.log('Claude API verification response:', result);

      if (response.ok && result.valid) {
        console.log('✅ Setting status to VALID');
        const statusData = { 
          status: 'valid', 
          message: result.message || 'API key is valid and working',
          models: result.availableModels || []
        };
        console.log('Status data being set:', statusData);
        setClaudeApiStatus(statusData);
        setAvailableModels(result.availableModels || [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ]);
      } else {
        console.log('❌ Setting status to INVALID - response.ok:', response.ok, 'result.valid:', result.valid);
        setClaudeApiStatus({ 
          status: 'invalid', 
          message: result.message || 'Invalid API key' 
        });
        setAvailableModels([]);
      }
    } catch (error) {
      console.error('Error verifying Claude API key:', error);
      setClaudeApiStatus({ 
        status: 'error', 
        message: 'Failed to verify API key' 
      });
      setAvailableModels([]);
    }
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
        setInputData={setInputDataWithTempStorage}
        node={node}
        formData={formData}
        onClose={handleClose}
        edges={edges}
        nodes={nodes}
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
            <button 
              className={`tab ${activeTab === 'parameters' ? 'active' : ''}`}
              onClick={() => setActiveTab('parameters')}
            >
              Parameters
            </button>
            <button 
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
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
              handleTelegramTokenCheck,
              activeTab,
              handleClaudeApiCheck,
              claudeApiStatus,
              availableModels
            )}
          </div>
        </div>
      </div>

      {/* Enhanced OUTPUT Panel */}
      <OutputPanel 
        outputData={outputData}
        setOutputData={setOutputDataWithTempStorage}
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