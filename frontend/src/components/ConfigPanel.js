/*
=================================================================
FRONTEND FILE: src/components/ConfigPanel.js (CORRECTED)
=================================================================
*/
import React, { useState, useEffect, useRef } from 'react';

// Add CSS styles for drag and drop
const dragDropStyles = `
  .drag-field:hover {
    background-color: #dbeafe !important;
    transform: scale(1.02);
    cursor: grab;
  }
  
  .drag-field:active {
    cursor: grabbing;
  }
  
  .drop-zone {
    transition: all 0.2s ease;
  }
  
  .drop-zone:hover {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
  
  .drop-zone.drag-over {
    border-color: #10b981 !important;
    background-color: #f0fdf4 !important;
    box-shadow: 0 0 0 2px #10b981 !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = dragDropStyles;
  document.head.appendChild(style);
}

// Draggable JSON Field Component
const DraggableJSONField = ({ path, value, level = 0 }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', `{{${path}}}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const indent = '  '.repeat(level);
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isPrimitive = !isObject && !isArray;

  if (isPrimitive) {
    return (
      <div className="flex items-center hover:bg-blue-50 rounded px-1">
        <span className="text-gray-600">{indent}</span>
        <span 
          className="text-blue-600 font-mono text-sm cursor-grab hover:bg-blue-100 px-1 rounded drag-field"
          draggable="true"
          onDragStart={handleDragStart}
          title={`Drag to insert {{${path}}}`}
        >
          {path.split('.').pop()}
        </span>
        <span className="text-gray-500">: </span>
        <span className="text-green-600 font-mono text-sm">
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="text-gray-600 font-mono text-sm">
        {indent}{path.split('.').pop()}: {isArray ? '[' : '{'}
      </div>
      {Object.entries(value).map(([key, val]) => (
        <DraggableJSONField 
          key={key} 
          path={path ? `${path}.${key}` : key} 
          value={val} 
          level={level + 1} 
        />
      ))}
      <div className="text-gray-600 font-mono text-sm">
        {indent}{isArray ? ']' : '}'}
      </div>
    </div>
  );
};

// Enhanced JSON Viewer with draggable fields
const DraggableJSONViewer = ({ data }) => {
  if (!data || typeof data !== 'object') {
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        No JSON data to display
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-64 overflow-y-auto">
      <div className="text-xs text-blue-600 mb-2 font-sans">
        💡 Drag fields below into text inputs to create {"{{template}}"} variables
      </div>
      {Object.entries(data).map(([key, value]) => (
        <DraggableJSONField key={key} path={key} value={value} />
      ))}
    </div>
  );
};

// Universal Live Preview Component - Shows preview for all text inputs
const UniversalLivePreview = ({ text, data, isFocused }) => {
  if (!text) return null;

  // Function to replace template variables with actual data
  const processTemplate = (template, data) => {
    if (!template || !data) return template || '';
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
      try {
        // Navigate through nested object using dot notation
        const pathParts = variablePath.trim().split('.');
        let value = data;
        
        for (const part of pathParts) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part];
          } else {
            return match; // Keep original if path not found
          }
        }
        
        // Convert value to string, handling different types
        if (typeof value === 'string') {
          return value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        } else if (typeof value === 'object') {
          return JSON.stringify(value, null, 2);
        } else {
          return match; // Keep original if unable to convert
        }
      } catch (error) {
        return match; // Keep original on error
      }
    });
  };

  const processedText = processTemplate(text, data);
  const hasTemplateVars = /\{\{[^}]+\}\}/.test(text);
  const textChanged = processedText !== text;

  // Always show preview when focused or when there's content
  return (
    <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-400 rounded-r-md">
      <div className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
        {isFocused ? '✨' : '👁️'} {isFocused ? 'Live Preview:' : 'Current Content:'}
        {hasTemplateVars && <span className="text-blue-600">(with template processing)</span>}
      </div>
      <div className="text-sm text-gray-800 whitespace-pre-wrap break-words bg-white p-2 rounded-md border border-gray-200">
        {processedText || <span className="text-gray-400 italic">Empty</span>}
      </div>
      {hasTemplateVars && textChanged && (
        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
          ✅ Template variables processed with current input data
        </div>
      )}
      {hasTemplateVars && !textChanged && data && (
        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          ⚠️ Some template variables couldn't be resolved with current input data
        </div>
      )}
      {!hasTemplateVars && (
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          💡 Add {"{{variables}}"} to use dynamic content from input data
        </div>
      )}
    </div>
  );
};

// Keep the old TemplatePreview for backward compatibility
const TemplatePreview = ({ template, data }) => {
  return <UniversalLivePreview text={template} data={data} isFocused={true} />;
};

// Enhanced Text Input with live preview (for regular inputs)
const EnhancedTextInput = ({ label, name, value, onChange, placeholder, rows, className = "", inputData, type = "text" }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
  };

  const InputComponent = rows ? 'textarea' : 'input';
  
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <InputComponent
        type={rows ? undefined : type}
        name={name}
        id={name}
        rows={rows}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full p-2 border rounded-md ${isFocused ? 'ring-2 ring-blue-200' : ''} ${className}`}
      />
      {(isFocused || value) && (
        <UniversalLivePreview text={value} data={inputData} isFocused={isFocused} />
      )}
    </div>
  );
};

// Enhanced Text Input with drop support and live preview
const DroppableTextInput = ({ label, name, value, onChange, placeholder, rows, className = "", inputData }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedText = e.dataTransfer.getData('text/plain');
    
    // Insert at cursor position or append
    const input = e.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentValue = value || '';
    const newValue = currentValue.slice(0, start) + droppedText + currentValue.slice(end);
    
    // Create synthetic event for onChange
    const syntheticEvent = {
      target: {
        name: name,
        value: newValue,
        type: rows ? 'textarea' : 'text'
      }
    };
    onChange(syntheticEvent);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
  };

  const InputComponent = rows ? 'textarea' : 'input';
  
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <InputComponent
        type={rows ? undefined : "text"}
        name={name}
        id={name}
        rows={rows}
        value={value}
        onChange={onChange}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full p-2 border rounded-md drop-zone ${isDragOver ? 'drag-over' : ''} ${isFocused ? 'ring-2 ring-blue-200' : ''} ${className}`}
        title="Drop template variables here"
      />
      {isDragOver && (
        <div className="text-xs text-green-600 mt-1">
          📥 Drop here to insert template variable
        </div>
      )}
      {(isFocused || value) && (
        <UniversalLivePreview text={value} data={inputData} isFocused={isFocused} />
      )}
    </div>
  );
};

// Chatbot UI is now part of the ConfigPanel
const ChatbotInterface = ({ nodeConfig }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/nodes/run-node', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    node: {
                        type: 'modelNode',
                        config: nodeConfig,
                    },
                    inputData: { message: inputValue }
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to get response.');
            }
            
            const botMessage = { sender: 'bot', text: result.reply };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            const errorMessage = { sender: 'bot', text: `Error: ${error.message}`, isError: true };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsLoading(false);
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender} ${msg.isError ? 'error' : ''}`}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div className="message bot typing"><span></span><span></span><span></span></div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="chatbot-input-form">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading || !nodeConfig.apiKey}
                />
                <button type="submit" disabled={isLoading || !nodeConfig.apiKey}>
                    <i className="fa-solid fa-paper-plane"></i>
                </button>
            </form>
            {!nodeConfig.apiKey && <div className="api-key-warning">Please set an API Key to use the chat.</div>}
        </div>
    );
};

const ConfigPanel = ({ node, onClose, nodes, edges }) => {
  const [formData, setFormData] = useState({
      label: node.data.label || '',
      description: node.data.description || '',
      model: node.data.model || 'claude-3-5-sonnet-20241022',
      apiKey: node.data.apiKey || '',
      systemPrompt: node.data.systemPrompt || 'You are a helpful AI assistant.',
      userPrompt: node.data.userPrompt || '{{message}}',
      displayFormat: node.data.displayFormat || 'chat',
      promptTemplate: node.data.promptTemplate || 'You are a helpful assistant. User message: {{message.text}}',
      temperature: node.data.temperature || 0.7,
      maxTokens: node.data.maxTokens || 400,
      token: node.data.token || '',
      // Google Docs specific fields
      action: node.data.action || 'get',
      documentUrl: node.data.documentUrl || '',
      documentTitle: node.data.documentTitle || 'New Document',
      content: node.data.content || '{{message}}'
  });
  
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [apiKeyVerificationStatus, setApiKeyVerificationStatus] = useState(null);
  const [googleAuthStatus, setGoogleAuthStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputData, setInputData] = useState(null);
  const [outputData, setOutputData] = useState(null);

  // Load persisted execution data when component mounts
  useEffect(() => {
    const nodeExecutionKey = `node-execution-${node.id}`;
    const persistedData = localStorage.getItem(nodeExecutionKey);
    
    if (persistedData) {
      const executionData = JSON.parse(persistedData);
      if (executionData.inputData) {
        setInputData(executionData.inputData);
      }
      if (executionData.outputData) {
        setOutputData(executionData.outputData);
      }
    }
  }, [node.id]);

  // Check Google authentication status for Google Docs nodes
  useEffect(() => {
    if (node.data.type === 'googleDocs') {
      checkGoogleAuthStatus();
    }
  }, [node.data.type]);

  const handleInputChange = (e) => {
      const { name, value, type } = e.target;
      const finalValue = type === 'number' ? parseFloat(value) : value;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
      if (name === 'apiKey') {
          setApiKeyVerificationStatus(null);
      }
      if (name === 'token') {
          setVerificationStatus(null);
      }
  };

  const handleClose = () => {
    // Save node execution data to localStorage before closing
    if (inputData || outputData) {
      const nodeExecutionKey = `node-execution-${node.id}`;
      const executionData = {
        nodeId: node.id,
        nodeType: node.data.type,
        inputData: inputData,
        outputData: outputData,
        timestamp: new Date().toISOString(),
        config: formData
      };
      localStorage.setItem(nodeExecutionKey, JSON.stringify(executionData));
      
      // Also update a global registry of executed nodes
      const executedNodesKey = 'executed-nodes-registry';
      const existingRegistry = JSON.parse(localStorage.getItem(executedNodesKey) || '{}');
      existingRegistry[node.id] = {
        nodeType: node.data.type,
        hasData: !!(inputData || outputData),
        lastExecuted: new Date().toISOString()
      };
      localStorage.setItem(executedNodesKey, JSON.stringify(existingRegistry));
    }
    
    onClose(formData);
  };

  const handleVerifyApiKey = async () => {
      if (!formData.apiKey) {
          setApiKeyVerificationStatus({ ok: false, message: 'Please enter an API Key.' });
          return;
      }
      setIsLoading(true);
      setApiKeyVerificationStatus(null);
      try {
          const response = await fetch('http://localhost:3001/api/ai/verify-claude', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: formData.apiKey })
          });
          const result = await response.json();
          setApiKeyVerificationStatus(result);
      } catch (error) {
          setApiKeyVerificationStatus({ ok: false, message: 'Network error or server issue.' });
      }
      setIsLoading(false);
  };

  const handleCheckToken = async () => {
      if (!formData.token) {
          setVerificationStatus({ ok: false, message: 'Please enter a token first.' });
          return;
      }
      setIsLoading(true);
      setVerificationStatus(null);
      try {
          const response = await fetch('http://localhost:3001/api/telegram/verify-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: formData.token })
          });
          const result = await response.json();
          setVerificationStatus(result);
      } catch (error) {
          setVerificationStatus({ ok: false, message: 'Network error. Is the backend running?' });
      }
      setIsLoading(false);
  };

  const checkGoogleAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/status');
      const result = await response.json();
      setGoogleAuthStatus(result);
    } catch (error) {
      setGoogleAuthStatus({ isAuthenticated: false, error: 'Failed to check authentication status' });
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/google');
      const result = await response.json();
      
      // Debug: Log the auth URL to console
      console.log('Google Auth URL:', result.url);
      
      // Open Google OAuth in a new window
      const authWindow = window.open(result.url, 'google-auth', 'width=500,height=600');
      
      // Alternative approach: Check auth status periodically instead of window.closed
      const pollTimer = setInterval(async () => {
        try {
          // Try to check if window is closed (will show warning but still works)
          if (authWindow.closed) {
            clearInterval(pollTimer);
            // Check auth status after window closes
            setTimeout(() => {
              checkGoogleAuthStatus();
            }, 1000);
            return;
          }
        } catch (e) {
          // Window.closed check failed due to CORS, just check auth status
          const authCheck = await fetch('http://localhost:3001/auth/status');
          const authResult = await authCheck.json();
          if (authResult.isAuthenticated) {
            clearInterval(pollTimer);
            setGoogleAuthStatus(authResult);
          }
        }
      }, 2000); // Check every 2 seconds
      
      // Fallback: Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollTimer);
      }, 300000);
      
    } catch (error) {
      setGoogleAuthStatus({ isAuthenticated: false, error: 'Failed to initiate Google authentication' });
    }
  };

  const handleGoogleDisconnect = () => {
    // For now, just reset the auth status
    // In a production app, you'd call a logout endpoint
    setGoogleAuthStatus({ isAuthenticated: false });
  };

  const handleGetData = async () => {
    setIsLoading(true);
    
    try {
      if (node.data.type === 'trigger') {
        // For Telegram trigger, get recent messages using bot token
        if (!formData.token) {
          throw new Error('Please configure Bot API Token first');
        }
        
        let response = await fetch('http://localhost:3001/api/telegram/get-updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: formData.token })
        });
        
        let result = await response.json();
        
        // If webhook conflict, automatically delete webhook and retry
        if (!response.ok && result.error && result.error.description && result.error.description.includes('webhook is active')) {
          console.log('Webhook conflict detected, attempting to delete webhook...');
          
          try {
            // Delete webhook first
            const deleteResponse = await fetch('http://localhost:3001/api/telegram/delete-webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: formData.token })
            });
            
            if (!deleteResponse.ok) {
              // If delete-webhook endpoint not found, use manual Telegram API call
              if (deleteResponse.status === 404) {
                console.log('Using direct Telegram API to delete webhook...');
                const directDeleteResponse = await fetch(`https://api.telegram.org/bot${formData.token}/deleteWebhook`, {
                  method: 'POST'
                });
                const directResult = await directDeleteResponse.json();
                
                if (directResult.ok) {
                  console.log('Webhook deleted via direct API, retrying getUpdates...');
                } else {
                  throw new Error(`Failed to delete webhook: ${directResult.description}`);
                }
              } else {
                throw new Error(`Delete webhook failed with status: ${deleteResponse.status}`);
              }
            } else {
              const deleteResult = await deleteResponse.json();
              console.log('Webhook deleted successfully, retrying getUpdates...');
            }
            
            // Retry getUpdates after webhook deletion
            response = await fetch('http://localhost:3001/api/telegram/get-updates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: formData.token })
            });
            
            result = await response.json();
            
          } catch (deleteError) {
            console.error('Error during webhook deletion:', deleteError);
            throw new Error(`Webhook conflict: ${result.message}. Manual fix needed: Send POST to https://api.telegram.org/bot${formData.token}/deleteWebhook`);
          }
        }
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to get Telegram updates');
        }
        
        // Get the most recent message
        if (result.updates && result.updates.length > 0) {
          const latestUpdate = result.updates[result.updates.length - 1];
          setInputData(latestUpdate);
          // For trigger nodes, automatically set output data same as input (they pass-through)
          setOutputData(latestUpdate);
        } else {
          const noDataMessage = { message: "No recent messages found. Send a message to your bot first." };
          setInputData(noDataMessage);
          setOutputData(noDataMessage);
        }
        
      } else {
        // For action nodes, get output from connected previous node
        const previousNodeOutput = await getPreviousNodeOutput();
        if (previousNodeOutput) {
          setInputData(previousNodeOutput);
        } else {
          setInputData({ 
            error: "No connected input node found. Connect this node to a previous node in the workflow.",
            hint: "Drag a connection from another node to this node to provide input data.",
            debug: {
              currentNodeId: node.id,
              currentNodeType: node.data.type,
              totalNodes: nodes?.length || 0,
              totalEdges: edges?.length || 0,
              incomingEdges: edges?.filter(edge => edge.target === node.id).length || 0
            }
          });
        }
      }
      
    } catch (error) {
      setInputData({ error: error.message });
    }
    
    setIsLoading(false);
  };

  const getPreviousNodeOutput = async () => {
    try {
      // Use the current workflow data passed from parent component
      if (!nodes || !edges) {
        throw new Error('No workflow data available. Please create some nodes and connections.');
      }
      
      const allNodes = nodes;
      const workflowEdges = edges;
      
      // Find edges that connect TO this node (incoming connections)
      const incomingEdges = workflowEdges.filter(edge => edge.target === node.id);
      
      console.log('Debug - Looking for previous node:', {
        currentNodeId: node.id,
        incomingEdges: incomingEdges,
        allEdges: workflowEdges
      });
      
      if (incomingEdges.length === 0) {
        return null; // No previous node connected
      }
      
      // Get the first connected previous node
      const previousNodeId = incomingEdges[0].source;
      const previousNode = allNodes.find(n => n.id === previousNodeId);
      
      if (!previousNode) {
        throw new Error('Connected previous node not found');
      }

      // First, check if we have persisted output data for the previous node
      const nodeExecutionKey = `node-execution-${previousNodeId}`;
      const persistedData = localStorage.getItem(nodeExecutionKey);
      
      if (persistedData) {
        const executionData = JSON.parse(persistedData);
        
        // For trigger nodes, use inputData as the output (since they don't process data)
        // For action nodes, use outputData (result of processing)
        let dataToReturn = null;
        
        if (executionData.nodeType === 'trigger' && executionData.inputData) {
          dataToReturn = executionData.inputData;
        } else if (executionData.outputData) {
          dataToReturn = executionData.outputData;
        }
        
        if (dataToReturn) {
          return {
            ...dataToReturn,
            _metadata: {
              sourceNode: executionData.config?.label || previousNode.data.label,
              nodeType: executionData.nodeType,
              lastExecuted: executionData.timestamp,
              fromCache: true
            }
          };
        }
      }
      
      // Execute the previous node to get its output
      if (previousNode.data.type === 'trigger') {
        // For trigger nodes, simulate getting telegram data
        if (!previousNode.data.token) {
          throw new Error('Previous Telegram trigger node needs to be configured with a bot token');
        }
        
        const response = await fetch('http://localhost:3001/api/telegram/get-updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: previousNode.data.token })
        });
        
        const result = await response.json();
        if (result.ok && result.updates && result.updates.length > 0) {
          return result.updates[result.updates.length - 1];
        }
        
        return { message: "No messages from previous Telegram trigger" };
        
      } else {
        // For other action nodes, execute them to get real output
        // First get THEIR input (recursive node chaining)
        let previousNodeInput = null;
        
        // Find what's connected to the previous node
        const previousNodeIncomingEdges = workflowEdges.filter(edge => edge.target === previousNodeId);
        if (previousNodeIncomingEdges.length > 0) {
          const sourcePreviousId = previousNodeIncomingEdges[0].source;
          const sourcePreviousNode = allNodes.find(n => n.id === sourcePreviousId);
          
          if (sourcePreviousNode && sourcePreviousNode.data.type === 'trigger') {
            // Get data from the trigger node
            const response = await fetch('http://localhost:3001/api/telegram/get-updates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: sourcePreviousNode.data.token })
            });
            
            const result = await response.json();
            if (result.ok && result.updates && result.updates.length > 0) {
              previousNodeInput = result.updates[result.updates.length - 1];
            }
          }
        }
        
        // Now execute the previous node with its input
        if (previousNodeInput) {
          const response = await fetch('http://localhost:3001/api/nodes/run-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              node: {
                type: previousNode.data.type,
                config: previousNode.data,
              },
              inputData: previousNodeInput
            })
          });
          
          const result = await response.json();
          if (response.ok) {
            return result;
          } else {
            throw new Error(`Failed to execute previous node: ${result.message}`);
          }
        } else {
          return {
            error: "Previous node has no input data",
            sourceNode: previousNode.data.label || previousNode.data.type,
            nodeType: previousNode.data.type
          };
        }
      }
      
    } catch (error) {
      console.error('Error getting previous node output:', error);
      throw error;
    }
  };

  const handlePostData = async () => {
    if (!inputData) return;
    
    setIsLoading(true);
    setOutputData(null);
    
    try {
      if (node.data.type === 'modelNode' || node.data.type === 'aiAgent' || node.data.type === 'googleDocs') {
        // Process through the node
        const response = await fetch('http://localhost:3001/api/nodes/run-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            node: {
              type: node.data.type,
              config: formData,
            },
            inputData: inputData
          })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to process data.');
        }
        
        setOutputData(result);
      } else {
        // For trigger nodes, just pass through the data
        setOutputData(inputData);
      }
    } catch (error) {
      setOutputData({ error: error.message });
    }
    setIsLoading(false);
  };

  return (
    <div className="config-panel-overlay" onClick={handleClose}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3><i className={`${node.data.icon} mr-2`}></i>{formData.label}</h3>
          <button onClick={handleClose} className="close-button">&times;</button>
        </div>
        <div className="panel-content flex gap-4">
          {/* LEFT SECTION - INPUT */}
          <div className="panel-section flex-1">
            <div className="section-header flex justify-between items-center">
              <span>INPUT</span>
              <button onClick={handleGetData} disabled={isLoading} className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600 disabled:bg-green-300">
                {isLoading ? '...' : 'GET'}
              </button>
            </div>
            <div className="section-content">
              {inputData ? (
                <div>
                  {inputData._metadata?.fromCache && (
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
                      📁 Cached data from {inputData._metadata.sourceNode} ({new Date(inputData._metadata.lastExecuted).toLocaleTimeString()})
                    </div>
                  )}
                  <DraggableJSONViewer data={inputData} />
                </div>
              ) : (
                <div className="text-gray-400 text-sm text-center py-8">
                  Click GET to fetch input data
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE SECTION - PARAMETERS */}
          <div className="panel-section flex-1">
            <div className="section-header">PARAMETERS</div>
            <div className="section-content">
              <EnhancedTextInput 
                label="Label" 
                name="label" 
                value={formData.label} 
                onChange={handleInputChange}
                placeholder="Node label"
                inputData={inputData}
              />
              <EnhancedTextInput 
                label="Description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                rows={3}
                placeholder="Node description"
                inputData={inputData}
              />
              
              {/* Fields for Model Node */}
              {node.data.type === 'modelNode' && (
                <>
                  <div className="form-group">
                    <label htmlFor="displayFormat">Display Format</label>
                    <select name="displayFormat" id="displayFormat" value={formData.displayFormat} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white">
                      <option value="chat">Chat Interface</option>
                      <option value="raw">Raw Response</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    💡 Model Node displays AI responses. Connect an AI Agent node to process prompts.
                  </div>
                </>
              )}

              {/* Fields for AI Agent Node */}
              {node.data.type === 'aiAgent' && (
                <>
                  <div className="form-group">
                    <label htmlFor="model">Model</label>
                    <select name="model" id="model" value={formData.model} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white">
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="gpt-4">GPT-4</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="apiKey">API Key</label>
                    <div className="flex items-center gap-2">
                      <input type="password" name="apiKey" id="apiKey" className="flex-grow" value={formData.apiKey} onChange={handleInputChange} placeholder="Enter your Claude API Key"/>
                      <button onClick={handleVerifyApiKey} disabled={isLoading} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300">
                        {isLoading ? '...' : 'Check'}
                      </button>
                    </div>
                    {apiKeyVerificationStatus && (
                      <div className={`mt-2 text-sm p-2 rounded-md ${apiKeyVerificationStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {apiKeyVerificationStatus.message}
                      </div>
                    )}
                  </div>
                  <DroppableTextInput 
                    label="System Prompt" 
                    name="systemPrompt" 
                    value={formData.systemPrompt} 
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="You are a helpful AI assistant."
                    inputData={inputData}
                  />
                  <DroppableTextInput 
                    label="User Prompt" 
                    name="userPrompt" 
                    value={formData.userPrompt} 
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="{{message}}"
                    inputData={inputData}
                  />
                  <div className="text-xs text-gray-500 mb-2">
                    💡 System Prompt defines AI personality. User Prompt processes input with {"{{variables}}"}.
                  </div>
                </>
              )}

              {/* RESTORED: Fields for Telegram Trigger */}
              {node.data.type === 'trigger' && (
                <div className="form-group">
                  <label htmlFor="token">Bot API Token</label>
                  <div className="flex items-center gap-2">
                    <input type="password" name="token" id="token" className="flex-grow" value={formData.token} onChange={handleInputChange} placeholder="Enter your Telegram Bot Token"/>
                    <button onClick={handleCheckToken} disabled={isLoading} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300">
                      {isLoading ? '...' : 'Check'}
                    </button>
                  </div>
                  {verificationStatus && (
                    <div className={`mt-2 text-sm p-2 rounded-md ${verificationStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {verificationStatus.ok 
                        ? `Success! Bot Name: ${verificationStatus.bot.first_name}, ID: ${verificationStatus.bot.id}`
                        : `Error: ${verificationStatus.message}`
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Fields for Google Docs Node */}
              {node.data.type === 'googleDocs' && (
                <>
                  {/* Google Authentication Status */}
                  <div className="form-group">
                    <label>Google Account</label>
                    <div className="flex items-center gap-2">
                      {googleAuthStatus === null ? (
                        <>
                          <div className="flex-grow bg-gray-100 text-gray-600 px-3 py-2 rounded-md text-sm">
                            Checking Google connection...
                          </div>
                        </>
                      ) : googleAuthStatus?.isAuthenticated ? (
                        <>
                          <div className="flex-grow bg-green-100 text-green-800 px-3 py-2 rounded-md text-sm">
                            Connected: {googleAuthStatus.email}
                          </div>
                          <button 
                            onClick={handleGoogleDisconnect}
                            className="bg-red-500 text-white px-3 py-2 text-sm rounded hover:bg-red-600"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-grow bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md text-sm">
                            Not connected to Google
                          </div>
                          <button 
                            onClick={handleGoogleConnect}
                            className="bg-blue-500 text-white px-3 py-2 text-sm rounded hover:bg-blue-600"
                          >
                            Connect
                          </button>
                        </>
                      )}
                    </div>
                    {googleAuthStatus?.error && (
                      <div className="mt-2 text-sm p-2 rounded-md bg-red-100 text-red-800">
                        {googleAuthStatus.error}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="action">Action</label>
                    <select name="action" id="action" value={formData.action} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white">
                      <option value="get">Get Document</option>
                      <option value="update">Update Document</option>
                      <option value="create">Create Document</option>
                    </select>
                  </div>

                  {/* Document URL for Get and Update actions */}
                  {(formData.action === 'get' || formData.action === 'update') && (
                    <DroppableTextInput 
                      label="Document URL" 
                      name="documentUrl" 
                      value={formData.documentUrl} 
                      onChange={handleInputChange}
                      placeholder="https://docs.google.com/document/d/your-doc-id/edit"
                      inputData={inputData}
                    />
                  )}

                  {/* Document Title for Create action */}
                  {formData.action === 'create' && (
                    <DroppableTextInput 
                      label="Document Title" 
                      name="documentTitle" 
                      value={formData.documentTitle} 
                      onChange={handleInputChange}
                      placeholder="New Document"
                      inputData={inputData}
                    />
                  )}

                  {/* Content for Update and Create actions */}
                  {(formData.action === 'update' || formData.action === 'create') && (
                    <DroppableTextInput 
                      label="Content" 
                      name="content" 
                      value={formData.content} 
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="{{message}} or your content here"
                      inputData={inputData}
                    />
                  )}

                  <div className="text-xs text-gray-500 mb-2">
                    Google Docs: Get reads document, Update appends content, Create makes new document. Use {"{{variables}}"} for dynamic content.
                    {!googleAuthStatus?.isAuthenticated && (
                      <><br />Connect your Google account above to use Google Docs actions.</>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT SECTION - OUTPUT */}
          <div className="panel-section flex-1">
            <div className="section-header flex justify-between items-center">
              <span>OUTPUT</span>
              <button onClick={handlePostData} disabled={isLoading || !inputData} className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 disabled:bg-blue-300">
                {isLoading ? '...' : 'POST'}
              </button>
            </div>
            <div className="section-content">
              {outputData ? (
                <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-64 overflow-y-auto">
                  <pre>{JSON.stringify(outputData, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-gray-400 text-sm text-center py-8">
                  Click POST to process data
                </div>
              )}
              {node.data.type === 'modelNode' && (
                <div className="mt-4 border-t pt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">💬 Interactive Chat</div>
                  <ChatbotInterface nodeConfig={formData} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
