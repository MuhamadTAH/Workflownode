/*
=================================================================
FRONTEND FILE: src/components/.js (CORRECTED)
=================================================================
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import config from '../config';

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
const DraggableJSONField = ({ path, value, level = 0, nodePrefix = '' }) => {
  const handleDragStart = (e) => {
    const templateVariable = nodePrefix ? `{{${nodePrefix}.${path}}}` : '{{' + path + '}}';
    console.log('🐢 Drag started:', templateVariable);
    e.dataTransfer.setData('text/plain', templateVariable);
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
          className="text-blue-600 font-mono text-sm cursor-grab hover:bg-blue-100 px-1 rounded drag-field select-none"
          draggable={true}
          onDragStart={handleDragStart}
          onDragEnd={(e) => console.log('🐢 Drag ended')}
          title={`Drag to insert ${nodePrefix ? `{{${nodePrefix}.${path}}}` : '{{' + path + '}}'}`}
          style={{ userSelect: 'none' }}
        >
          {path.split('.').pop()}
        </span>
        <span className="text-gray-500">: </span>
        <span className="text-green-600 font-mono text-sm">
          {typeof value === 'string' ? '"' + value + '"' : String(value)}
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
          path={path ? path + '.' + key : key} 
          value={val} 
          level={level + 1}
          nodePrefix={nodePrefix}
        />
      ))}
      <div className="text-gray-600 font-mono text-sm">
        {indent}{isArray ? ']' : '}'}
      </div>
    </div>
  );
};

// Memory Visualization Component
const MemoryVisualization = ({ data }) => {
  try {
    // Extract JSON data from the stats string
    const jsonStart = data.indexOf('\n') + 1;
    const jsonData = JSON.parse(data.substring(jsonStart));
    
    if (jsonData.analytics) {
      // Single user analytics
      return (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-blue-800">
            📊 User Analytics: {jsonData.userId}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-green-50 p-2 rounded">
              <div className="font-semibold text-green-700">Messages</div>
              <div className="text-lg font-bold text-green-800">{jsonData.messageCount}</div>
            </div>
            
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-semibold text-blue-700">Conversation Span</div>
              <div className="text-sm text-blue-800">{jsonData.analytics.conversationSpan}</div>
            </div>
            
            <div className="bg-purple-50 p-2 rounded">
              <div className="font-semibold text-purple-700">Avg Message Length</div>
              <div className="text-sm text-purple-800">{jsonData.analytics.averageUserMessageLength} chars</div>
            </div>
            
            <div className="bg-orange-50 p-2 rounded">
              <div className="font-semibold text-orange-700">Avg Response Time</div>
              <div className="text-sm text-orange-800">{jsonData.analytics.averageProcessingTime}</div>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Models Used:</strong> {jsonData.analytics.modelsUsed.join(', ') || 'None'}</div>
            <div><strong>Messages/Day:</strong> {jsonData.analytics.messagesPerDay}</div>
            <div><strong>Total Characters:</strong> {jsonData.analytics.totalCharacters}</div>
            <div><strong>Last Activity:</strong> {new Date(jsonData.lastActivity).toLocaleString()}</div>
          </div>
        </div>
      );
    } else if (jsonData.globalAnalytics) {
      // Global analytics for all users
      return (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-blue-800">
            🌐 Global Analytics ({jsonData.totalUsers} users)
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-green-50 p-2 rounded">
              <div className="font-semibold text-green-700">Total Messages</div>
              <div className="text-lg font-bold text-green-800">{jsonData.totalMessages}</div>
            </div>
            
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-semibold text-blue-700">Avg Messages/User</div>
              <div className="text-lg font-bold text-blue-800">{jsonData.globalAnalytics.averageUserMessages}</div>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Total Characters:</strong> {jsonData.globalAnalytics.totalCharactersProcessed}</div>
            {jsonData.globalAnalytics.mostActiveUser && (
              <div><strong>Most Active User:</strong> {jsonData.globalAnalytics.mostActiveUser.userId} ({jsonData.globalAnalytics.mostActiveUser.messageCount} messages)</div>
            )}
          </div>
          
          {jsonData.users.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">User Breakdown:</div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {jsonData.users.map((user, idx) => (
                  <div key={idx} className="flex justify-between text-xs bg-gray-50 p-1 rounded">
                    <span>{user.userId}</span>
                    <span>{user.messageCount} messages</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  } catch (error) {
    console.error('Error parsing memory stats:', error);
  }
  
  // Fallback to raw text display
  return <pre className="whitespace-pre-wrap text-xs">{data}</pre>;
};

// Enhanced JSON Viewer with draggable fields
const DraggableJSONViewer = ({ data, nodePrefix = '' }) => {
  console.log('🔍 DraggableJSONViewer received data:', { data, nodePrefix, type: typeof data });
  
  if (!data || typeof data !== 'object') {
    console.log('⚠️ DraggableJSONViewer: No valid data to display');
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        No JSON data to display
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-64 overflow-y-auto">
      <div className="text-xs text-blue-600 mb-2 font-sans">
        💡 Drag fields below into text inputs to create {nodePrefix ? `{{${nodePrefix}.field}}` : '{{template}}'} variables
        {nodePrefix && (
          <div className="text-xs text-purple-600 mt-1 font-semibold">
            🏷️ Source: {nodePrefix} node data
          </div>
        )}
      </div>
      {Object.entries(data).map(([key, value]) => (
        <DraggableJSONField key={key} path={key} value={value} nodePrefix={nodePrefix} />
      ))}
    </div>
  );
};

// Universal Live Preview Component - Shows preview for all text inputs
const UniversalLivePreview = ({ text, data, isFocused, nodeMapping = null }) => {
  if (!text) return null;

  // Function to replace template variables with actual data (enhanced for node-prefixed templates)
  const processTemplate = (template, fallbackData, nodeMapping) => {
    if (!template) return template || '';
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
      try {
        const pathParts = variablePath.trim().split('.');
        
        // Check if this is a node-prefixed template (e.g., telegram.message.text)
        if (pathParts.length > 1 && nodeMapping) {
          const nodeName = pathParts[0];
          const fieldPath = pathParts.slice(1).join('.');
          
          if (nodeMapping[nodeName]) {
            // Get data from the specific node
            const nodeId = nodeMapping[nodeName].id;
            const nodeExecutionKey = 'node-execution-' + nodeId;
            const executionData = localStorage.getItem(nodeExecutionKey);
            
            if (executionData) {
              try {
                const parsed = JSON.parse(executionData);
                const nodeData = parsed.outputData || parsed.inputData;
                
                if (nodeData) {
                  let value = nodeData;
                  const fieldParts = fieldPath.split('.');
                  
                  for (const part of fieldParts) {
                    if (value && typeof value === 'object' && part in value) {
                      value = value[part];
                    } else {
                      return match; // Keep original if path not found
                    }
                  }
                  
                  // Convert value to string
                  if (typeof value === 'string') {
                    return value;
                  } else if (typeof value === 'number' || typeof value === 'boolean') {
                    return String(value);
                  } else if (typeof value === 'object') {
                    return JSON.stringify(value, null, 2);
                  }
                }
              } catch (error) {
                console.error('Error parsing node data for preview:', error);
              }
            }
          }
        } else if (fallbackData) {
          // Regular template without node prefix - use fallback data
          let value = fallbackData;
          
          for (const part of pathParts) {
            if (value && typeof value === 'object' && part in value) {
              value = value[part];
            } else {
              return match; // Keep original if path not found
            }
          }
          
          // Convert value to string
          if (typeof value === 'string') {
            return value;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
          } else if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
          }
        }
        
        return match; // Keep original if unable to resolve
      } catch (error) {
        return match; // Keep original on error
      }
    });
  };

  const processedText = processTemplate(text, data, nodeMapping);
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

// Template preview functionality moved to UniversalLivePreview

// Enhanced Text Input with live preview (for regular inputs)
const EnhancedTextInput = ({ label, name, value, onChange, placeholder, rows, className = "", inputData, type = "text", nodeMapping = null }) => {
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
        className={'w-full p-2 border rounded-md ' + (isFocused ? 'ring-2 ring-blue-200' : '') + ' ' + className}
      />
      {(isFocused || value) && (
        <UniversalLivePreview text={value} data={inputData} isFocused={isFocused} nodeMapping={nodeMapping} />
      )}
    </div>
  );
};

// Enhanced Text Input with drop support and live preview
const DroppableTextInput = ({ label, name, value, onChange, placeholder, rows, className = "", inputData, nodeMapping = null }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedText = e.dataTransfer.getData('text/plain');
    console.log('🎯 Drop received:', droppedText);
    
    // Insert at cursor position or append
    const input = e.target;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = value || '';
    const newValue = currentValue.slice(0, start) + droppedText + currentValue.slice(end);
    
    console.log('🎯 New value after drop:', newValue);
    
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
    if (!isDragOver) {
      console.log('🎯 Drag over detected on', name);
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    console.log('🎯 Drag leave on', name);
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
        className={'w-full p-2 border rounded-md drop-zone ' + (isDragOver ? 'drag-over' : '') + ' ' + (isFocused ? 'ring-2 ring-blue-200' : '') + ' ' + className}
        title="Drop template variables here"
      />
      {isDragOver && (
        <div className="text-xs text-green-600 mt-1">
          📥 Drop here to insert template variable
        </div>
      )}
      {(isFocused || value) && (
        <UniversalLivePreview text={value} data={inputData} isFocused={isFocused} nodeMapping={nodeMapping} />
      )}
    </div>
  );
};

// Chatbot UI is now part of the 
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
            const response = await fetch(config.BACKEND_URL + '/api/nodes/run-node', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
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
            const errorMessage = { sender: 'bot', text: 'Error: ' + error.message, isError: true };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsLoading(false);
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={'message ' + msg.sender + ' ' + (msg.isError ? 'error' : '')}>
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
  // Debug: Track node data changes on every render
  console.log('🔧 ConfigPanel render for node:', {
    id: node.id,
    type: node.data.type,
    label: node.data.label,
    allNodeData: node.data,
    renderTime: new Date().toISOString()
  });
  const [formData, setFormData] = useState(() => {
    console.log('🔧 Initializing formData for node:', {
      nodeId: node.id,
      nodeType: node.data.type,
      nodeLabel: node.data.label,
      allNodeData: node.data
    });
    
    return {
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
      content: node.data.content || '{{message}}',
      // Data Storage specific fields
      storedData: node.data.storedData || {},
      // Memory fields
      userId: node.data.userId || 'default',
      // Telegram Send Message specific fields
      chatId: node.data.chatId || '{{message.chat.id}}',
      messageText: node.data.messageText || 'Hello! You sent: {{message.text}}',
      parseMode: node.data.parseMode || 'Markdown',
      disableNotification: node.data.disableNotification || false
    };
  });
  
  // Initialize storedData if it doesn't exist for dataStorage nodes
  useEffect(() => {
    if (node.data.type === 'dataStorage' && !formData.storedData) {
      setFormData(prev => ({ ...prev, storedData: {} }));
    }
  }, [node.data.type, formData.storedData]);
  
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [apiKeyVerificationStatus, setApiKeyVerificationStatus] = useState(null);
  const [googleAuthStatus, setGoogleAuthStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputData, setInputData] = useState(null);
  const [outputData, setOutputData] = useState(null);
  const [memoryActionResult, setMemoryActionResult] = useState(null);
  const [memoryQuickStats, setMemoryQuickStats] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [selectedNodeId, setSelectedNodeId] = useState(''); // Selected node ID
  const [availableNodes, setAvailableNodes] = useState([]); // List of connected nodes

  // Load persisted execution data when component mounts
  useEffect(() => {
    const nodeExecutionKey = 'node-execution-' + node.id;
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

  // Load quick memory stats for memory-enabled nodes
  useEffect(() => {
    if (node.data.type === 'modelNode' || node.data.type === 'aiAgent') {
      loadQuickMemoryStats();
    }
  }, [node.data.type]);

  // Load saved configuration when component mounts
  useEffect(() => {
    const configKey = `node-config-${node.id}`;
    const savedConfig = localStorage.getItem(configKey);
    
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setFormData(prev => ({ ...prev, ...parsedConfig }));
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
  }, [node.id]);

  // Find ALL connected previous nodes (for input selection dropdown) - MEMOIZED
  const findAllConnectedPreviousNodes = useCallback(() => {
    if (!edges || !nodes) {
      console.log('⚠️ findAllConnectedPreviousNodes: Missing edges or nodes');
      return [];
    }

    const connectedNodes = [];
    const visited = new Set();
    
    console.log('🔍 Starting findAllConnectedPreviousNodes for node:', node.id);
    console.log('All edges:', edges.map(e => `${e.source} → ${e.target}`));
    console.log('All nodes:', nodes.map(n => `${n.id} (${n.data.type}: ${n.data.label})`));
    
    // Recursive function to find all upstream nodes
    const findUpstreamNodes = (currentNodeId) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);
      
      const incomingEdges = edges.filter(edge => edge.target === currentNodeId);
      console.log(`Checking incoming edges for ${currentNodeId}:`, incomingEdges.map(e => `${e.source} → ${e.target}`));
      
      for (const edge of incomingEdges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (sourceNode) {
          console.log(`Found source node: ${sourceNode.id} (${sourceNode.data.type}: ${sourceNode.data.label})`);
          
          // Check if this node has execution data
          const nodeExecutionKey = 'node-execution-' + sourceNode.id;
          const executionData = localStorage.getItem(nodeExecutionKey);
          
          if (executionData) {
            try {
              const parsed = JSON.parse(executionData);
              if (parsed.outputData || parsed.inputData) {
                console.log(`✅ Adding node with data: ${sourceNode.id}`);
                connectedNodes.push({
                  id: sourceNode.id,
                  label: sourceNode.data.label || sourceNode.data.type,
                  type: sourceNode.data.type,
                  hasData: !!(parsed.outputData || parsed.inputData)
                });
              } else {
                console.log(`⚠️ Node ${sourceNode.id} has execution data but no input/output data`);
              }
            } catch (error) {
              console.error('Error parsing node execution data:', error);
            }
          }
          
          // Recursively find nodes connected to this one
          findUpstreamNodes(sourceNode.id);
        }
      }
    };
    
    findUpstreamNodes(node.id);
    
    // Sort by node type (triggers first, then actions)
    return connectedNodes.sort((a, b) => {
      if (a.type === 'trigger' && b.type !== 'trigger') return -1;
      if (a.type !== 'trigger' && b.type === 'trigger') return 1;
      return a.label.localeCompare(b.label);
    });
  }, [edges, nodes, node.id]);

  // Update available nodes when edges or nodes change
  useEffect(() => {
    const connectedNodes = findAllConnectedPreviousNodes();
    console.log('🔍 Updating available nodes:', {
      currentNodeId: node.id,
      currentNodeLabel: node.data.label,
      previouslySelected: selectedNodeId,
      newConnectedNodes: connectedNodes.map(n => ({ id: n.id, label: n.label, type: n.type }))
    });
    
    setAvailableNodes(connectedNodes);
  }, [edges, nodes, findAllConnectedPreviousNodes]);

  // Separate effect to handle node selection to avoid infinite loops
  useEffect(() => {
    // If no node is selected or the selected node is no longer available, select the first available node
    if (!selectedNodeId || !availableNodes.find(n => n.id === selectedNodeId)) {
      if (availableNodes.length > 0) {
        console.log('🎯 Auto-selecting first available node:', {
          selectedNode: availableNodes[0],
          reason: !selectedNodeId ? 'No node selected' : 'Previously selected node no longer available'
        });
        setSelectedNodeId(availableNodes[0].id);
      } else if (selectedNodeId) {
        // Clear selection if no nodes available
        setSelectedNodeId('');
      }
    }
  }, [availableNodes, selectedNodeId]);

  // Auto-save function
  const autoSaveConfig = async (newFormData) => {
    try {
      setAutoSaveStatus('saving');
      
      console.log('💾 Auto-saving config for node:', {
        nodeId: node.id,
        currentNodeType: node.data.type,
        currentNodeLabel: node.data.label,
        newFormData: newFormData,
        hasTypeInFormData: 'type' in newFormData
      });
      
      // Save to localStorage immediately
      const configKey = `node-config-${node.id}`;
      localStorage.setItem(configKey, JSON.stringify(newFormData));
      
      // Also update the node data in the workflow
      // This assumes there's a way to update the node in the parent component
      if (node.data) {
        const beforeUpdate = { ...node.data };
        Object.assign(node.data, newFormData);
        
        console.log('💾 Node data updated:', {
          before: beforeUpdate,
          after: { ...node.data },
          typeChanged: beforeUpdate.type !== node.data.type
        });
      }
      
      // Simulate brief delay to show saving status
      setTimeout(() => {
        setAutoSaveStatus('saved');
      }, 500);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      setTimeout(() => {
        setAutoSaveStatus('saved');
      }, 2000);
    }
  };

  const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      const finalValue = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value);
      
      console.log('📝 Input changed:', {
        nodeId: node.id,
        nodeType: node.data.type,
        fieldName: name,
        oldValue: formData[name],
        newValue: finalValue,
        isNodeTypeSpecific: (node.data.type === 'trigger' && ['chatId', 'messageText', 'parseMode'].includes(name)) ||
                           (node.data.type === 'telegramSendMessage' && ['token'].includes(name))
      });
      
      const newFormData = { ...formData, [name]: finalValue };
      setFormData(newFormData);
      
      // Trigger auto-save
      autoSaveConfig(newFormData);
      
      if (name === 'apiKey') {
          setApiKeyVerificationStatus(null);
      }
      if (name === 'token') {
          setVerificationStatus(null);
      }
      if (name === 'userId' && (node.data.type === 'modelNode' || node.data.type === 'aiAgent')) {
          // Reload memory stats when user ID changes
          setTimeout(() => loadQuickMemoryStats(), 100);
      }
  };

  const handleClose = () => {
    // Save node execution data to localStorage before closing
    if (inputData || outputData) {
      const nodeExecutionKey = 'node-execution-' + node.id;
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
          const response = await fetch(config.BACKEND_URL + '/api/ai/verify-claude', {
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
          const response = await fetch(config.BACKEND_URL + '/api/telegram/verify-token', {
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
      const response = await fetch(config.BACKEND_URL + '/auth/status', {
        credentials: 'include'
      });
      const result = await response.json();
      setGoogleAuthStatus(result);
    } catch (error) {
      setGoogleAuthStatus({ isAuthenticated: false, error: 'Failed to check authentication status' });
    }
  };

  const handleGoogleConnect = async () => {
    try {
      // Open Google OAuth directly (Passport handles the redirect)
      const authUrl = config.BACKEND_URL + '/auth/google';
      console.log('Opening Google Auth URL:', authUrl);
      
      const authWindow = window.open(authUrl, 'google-auth', 'width=500,height=600');
      
      // Check if popup was blocked
      if (!authWindow) {
        console.error('Popup was blocked by browser');
        return;
      }
      
      console.log('Google OAuth popup opened, waiting for user to complete login...');
      
      // Method 1: Try to detect popup closure (works in some browsers, fails with COOP)
      const checkClosed = setInterval(() => {
        try {
          if (authWindow.closed) {
            console.log('Popup window closed, checking authentication...');
            clearInterval(checkClosed);
            
            // Check auth status once after popup closes
            setTimeout(async () => {
              try {
                const authCheck = await fetch(config.BACKEND_URL + '/auth/status', {
                  credentials: 'include'
                });
                const authResult = await authCheck.json();
                console.log('Final auth check result:', authResult);
                setGoogleAuthStatus(authResult);
              } catch (e) {
                console.error('Error checking final auth status:', e);
                setGoogleAuthStatus({ isAuthenticated: false, error: 'Failed to verify authentication' });
              }
            }, 500); // Small delay to ensure session is saved
          }
        } catch (e) {
          // COOP (Cross-Origin-Opener-Policy) blocks window.closed - this is expected and harmless
          // The fallback polling method will handle authentication detection
        }
      }, 1000); // Check less frequently to reduce COOP console noise
      
      // Method 2: Fallback polling (starts after 3 seconds to allow login time)
      const fallbackTimer = setTimeout(() => {
        console.log('Starting fallback polling for authentication...');
        const pollTimer = setInterval(async () => {
          try {
            console.log('Polling auth status...');
            const authCheck = await fetch(config.BACKEND_URL + '/auth/status', {
              credentials: 'include'
            });
            const authResult = await authCheck.json();
            console.log('Auth check result:', authResult);
            
            if (authResult.isAuthenticated) {
              console.log('Authentication successful! Updating status...');
              clearInterval(pollTimer);
              clearInterval(checkClosed);
              try {
                authWindow.close();
              } catch (e) {
                console.log('Could not close auth window (this is normal):', e.message);
              }
              setGoogleAuthStatus(authResult);
            }
          } catch (e) {
            console.error('Error in auth polling:', e);
          }
        }, 2000); // Poll every 2 seconds
        
        // Clear polling after 60 seconds to prevent infinite polling
        setTimeout(() => {
          clearInterval(pollTimer);
          clearInterval(checkClosed);
          console.log('Auth polling timeout reached');
        }, 60000);
      }, 3000); // Wait 3 seconds before starting fallback polling
      
    } catch (error) {
      setGoogleAuthStatus({ isAuthenticated: false, error: 'Failed to initiate Google authentication' });
    }
  };

  const handleGoogleDisconnect = () => {
    // For now, just reset the auth status
    // In a production app, you'd call a logout endpoint
    setGoogleAuthStatus({ isAuthenticated: false });
  };

  const loadQuickMemoryStats = async () => {
    try {
      const userId = formData.userId || 'default';
      const response = await fetch(config.BACKEND_URL + '/api/nodes/memory/stats?userId=' + userId, {
        credentials: 'include'
      });
      
      // Check if response is HTML (404 error) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.warn('Memory stats endpoint not available yet (likely not deployed)');
        setMemoryQuickStats({ 
          messageCount: 0, 
          error: 'Memory stats not available - endpoint not deployed yet' 
        });
        return;
      }
      
      const result = await response.json();
      if (response.ok) {
        setMemoryQuickStats(result);
      }
    } catch (error) {
      console.error('Error loading quick memory stats:', error);
      setMemoryQuickStats({ 
        messageCount: 0, 
        error: 'Memory stats unavailable' 
      });
    }
  };

  // Function to load data from a specific node
  const loadDataFromNode = (nodeId) => {
    if (!nodeId) {
      return null; // No node selected
    }
    
    // Load data from the selected previous node
    const nodeExecutionKey = 'node-execution-' + nodeId;
    const executionData = localStorage.getItem(nodeExecutionKey);
    
    if (executionData) {
      try {
        const parsed = JSON.parse(executionData);
        return parsed.outputData || parsed.inputData || null;
      } catch (error) {
        console.error('Error loading data from node:', error);
        return null;
      }
    }
    
    return null;
  };

  // Handle node selection change
  const handleNodeSelectionChange = (e) => {
    const newNodeId = e.target.value;
    console.log('🔄 Node selection changed:', {
      previousNodeId: selectedNodeId,
      newNodeId: newNodeId,
      availableNodes: availableNodes.map(n => ({ id: n.id, label: n.label, type: n.type }))
    });
    
    setSelectedNodeId(newNodeId);
    
    // Load data from the selected node
    const nodeData = loadDataFromNode(newNodeId);
    console.log('📊 Loading data from selected node:', {
      nodeId: newNodeId,
      dataExists: !!nodeData,
      dataKeys: nodeData ? Object.keys(nodeData) : 'No data'
    });
    
    if (nodeData) {
      setInputData(nodeData);
    } else {
      // Clear input data if no data available
      setInputData(null);
    }
  };

  const handleGetData = async () => {
    setIsLoading(true);
    
    try {
      // If a specific previous node is selected, load its data
      if (selectedNodeId) {
        const nodeData = loadDataFromNode(selectedNodeId);
        console.log('🔍 Loading data from selected node:', { selectedNodeId, nodeData });
        if (nodeData) {
          setInputData(nodeData);
        } else {
          setInputData({ error: 'No data available from selected node' });
        }
        setIsLoading(false);
        return;
      }
      
      // Otherwise, execute normal GET behavior for current node
      if (node.data.type === 'trigger') {
        // For Telegram trigger, get recent messages using bot token
        if (!formData.token) {
          throw new Error('Please configure Bot API Token first');
        }
        
        let response = await fetch(config.BACKEND_URL + '/api/telegram/get-updates', {
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
            const deleteResponse = await fetch(config.BACKEND_URL + '/api/telegram/delete-webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: formData.token })
            });
            
            if (!deleteResponse.ok) {
              // If delete-webhook endpoint not found, use manual Telegram API call
              if (deleteResponse.status === 404) {
                console.log('Using direct Telegram API to delete webhook...');
                const directDeleteResponse = await fetch('https://api.telegram.org/bot' + formData.token + '/deleteWebhook', {
                  method: 'POST'
                });
                const directResult = await directDeleteResponse.json();
                
                if (directResult.ok) {
                  console.log('Webhook deleted via direct API, retrying getUpdates...');
                } else {
                  throw new Error('Failed to delete webhook: ' + directResult.description);
                }
              } else {
                throw new Error('Delete webhook failed with status: ' + deleteResponse.status);
              }
            } else {
              console.log('Webhook deleted successfully, retrying getUpdates...');
            }
            
            // Retry getUpdates after webhook deletion
            response = await fetch(config.BACKEND_URL + '/api/telegram/get-updates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: formData.token })
            });
            
            result = await response.json();
            
          } catch (deleteError) {
            console.error('Error during webhook deletion:', deleteError);
            throw new Error('Webhook conflict: ' + result.message + '. Manual fix needed: Send POST to https://api.telegram.org/bot' + formData.token + '/deleteWebhook');
          }
        }
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to get Telegram updates');
        }
        
        // Get the most recent message
        if (result.updates && result.updates.length > 0) {
          const latestUpdate = result.updates[result.updates.length - 1];
          console.log('🔍 Setting inputData for trigger:', latestUpdate);
          setInputData(latestUpdate);
          // For trigger nodes, automatically set output data same as input (they pass-through)
          setOutputData(latestUpdate);
        } else {
          const noDataMessage = { message: "No recent messages found. Send a message to your bot first." };
          console.log('🔍 No updates found, setting default message:', noDataMessage);
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
      const nodeExecutionKey = 'node-execution-' + previousNodeId;
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
        
        const response = await fetch(config.BACKEND_URL + '/api/telegram/get-updates', {
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
            const response = await fetch(config.BACKEND_URL + '/api/telegram/get-updates', {
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
          const response = await fetch(config.BACKEND_URL + '/api/nodes/run-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
            throw new Error('Failed to execute previous node: ' + result.message);
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

  // Helper function to find connected Data Storage nodes
  const findConnectedDataStorageNodes = () => {
    if (!edges || !nodes) return [];
    
    // Find edges that connect to this node
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    
    // Find the source nodes of these edges that are Data Storage nodes
    const connectedDataStorageNodes = [];
    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && sourceNode.data.type === 'dataStorage') {
        // Get the stored data from the source node
        const storedData = sourceNode.data.storedData || {};
        connectedDataStorageNodes.push({
          type: 'dataStorage',
          data: storedData,
          nodeId: sourceNode.id
        });
      }
    }
    
    return connectedDataStorageNodes;
  };

  // Create node name mapping for template prefixes
  const createNodeNameMapping = () => {
    if (!nodes) return {};
    
    const mapping = {};
    
    // Add current node
    mapping['current'] = {
      id: node.id,
      label: node.data.label || node.data.type,
      type: node.data.type
    };
    
    // Add all connected nodes with simplified names
    const connectedNodes = findAllConnectedPreviousNodes();
    connectedNodes.forEach(connectedNode => {
      const sourceNode = nodes.find(n => n.id === connectedNode.id);
      if (sourceNode) {
        // Create simple name from node type
        let simpleName = sourceNode.data.type;
        if (simpleName === 'trigger') simpleName = 'telegram'; // telegram trigger -> telegram
        if (simpleName === 'aiAgent') simpleName = 'aiAgent';
        if (simpleName === 'modelNode') simpleName = 'model';
        if (simpleName === 'dataStorage') simpleName = 'storage';
        if (simpleName === 'telegramSendMessage') simpleName = 'sendMessage';
        
        mapping[simpleName] = {
          id: sourceNode.id,
          label: sourceNode.data.label || sourceNode.data.type,
          type: sourceNode.data.type
        };
      }
    });
    
    return mapping;
  };

  // Get the node prefix for the currently selected input source
  const getCurrentNodePrefix = () => {
    const selectedNode = availableNodes.find(n => n.id === selectedNodeId);
    console.log('🏷️ Getting node prefix:', {
      selectedNodeId: selectedNodeId,
      selectedNode: selectedNode ? { id: selectedNode.id, label: selectedNode.label, type: selectedNode.type } : 'Not found',
      availableNodesCount: availableNodes.length
    });
    
    if (!selectedNode) return '';
    
    // Convert node type to prefix name
    let prefix = selectedNode.type;
    if (prefix === 'trigger') prefix = 'telegram';
    if (prefix === 'aiAgent') prefix = 'aiAgent';
    if (prefix === 'modelNode') prefix = 'model';
    if (prefix === 'dataStorage') prefix = 'storage';
    if (prefix === 'telegramSendMessage') prefix = 'sendMessage';
    
    console.log('🏷️ Node prefix result:', {
      originalType: selectedNode.type,
      convertedPrefix: prefix
    });
    
    return prefix;
  };

  // Enhanced template replacement with node prefixes
  const replaceNodePrefixedTemplate = (template, fallbackData = null) => {
    if (!template || typeof template !== 'string') return template;
    
    const nodeMapping = createNodeNameMapping();
    let result = template;
    
    try {
      // Replace node-prefixed templates like {{telegram.message.text}}
      result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const pathParts = path.trim().split('.');
        
        if (pathParts.length > 1) {
          // This is a node-prefixed template
          const nodeName = pathParts[0];
          const fieldPath = pathParts.slice(1).join('.');
          
          if (nodeMapping[nodeName]) {
            // Get data from the specific node
            const nodeId = nodeMapping[nodeName].id;
            const nodeExecutionKey = 'node-execution-' + nodeId;
            const executionData = localStorage.getItem(nodeExecutionKey);
            
            if (executionData) {
              try {
                const parsed = JSON.parse(executionData);
                const nodeData = parsed.outputData || parsed.inputData;
                
                if (nodeData) {
                  const value = getNestedValue(nodeData, fieldPath);
                  if (value !== undefined && value !== null) {
                    return typeof value === 'object' ? JSON.stringify(value) : String(value);
                  }
                }
              } catch (error) {
                console.error('Error parsing node data for template:', error);
              }
            }
          }
        } else {
          // This is a regular template, use fallback data if provided
          if (fallbackData) {
            const value = getNestedValue(fallbackData, path.trim());
            if (value !== undefined && value !== null) {
              return typeof value === 'object' ? JSON.stringify(value) : String(value);
            }
          }
        }
        
        return match; // Keep original if not found
      });
    } catch (error) {
      console.error('Error in node-prefixed template replacement:', error);
      return template;
    }
    
    return result;
  };

  // Helper function to get nested object values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  // Generate available template options for user guidance
  const getAvailableTemplateOptions = () => {
    const nodeMapping = createNodeNameMapping();
    const options = [];
    
    Object.keys(nodeMapping).forEach(nodeName => {
      const nodeInfo = nodeMapping[nodeName];
      
      // Get sample data structure from the node
      const nodeExecutionKey = 'node-execution-' + nodeInfo.id;
      const executionData = localStorage.getItem(nodeExecutionKey);
      
      if (executionData) {
        try {
          const parsed = JSON.parse(executionData);
          const nodeData = parsed.outputData || parsed.inputData;
          
          if (nodeData && typeof nodeData === 'object') {
            // Generate sample template paths
            const generatePaths = (obj, prefix = '', depth = 0) => {
              if (depth > 2) return; // Limit depth to avoid too many options
              
              Object.keys(obj).forEach(key => {
                const newPrefix = prefix ? `${prefix}.${key}` : key;
                const value = obj[key];
                
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  generatePaths(value, newPrefix, depth + 1);
                } else {
                  options.push({
                    template: `{{${nodeName}.${newPrefix}}}`,
                    description: `${nodeInfo.label}: ${newPrefix}`,
                    nodeType: nodeInfo.type,
                    sampleValue: Array.isArray(value) ? '[Array]' : String(value).substring(0, 50)
                  });
                }
              });
            };
            
            generatePaths(nodeData);
          }
        } catch (error) {
          console.error('Error generating template options:', error);
        }
      }
    });
    
    return options.slice(0, 20); // Limit to 20 most relevant options
  };

  const handlePostData = async () => {
    if (!inputData) return;
    
    setIsLoading(true);
    setOutputData(null);
    
    try {
      if (node.data.type === 'modelNode' || node.data.type === 'aiAgent' || node.data.type === 'googleDocs' || node.data.type === 'dataStorage' || node.data.type === 'telegramSendMessage') {
        // Find connected Data Storage nodes for AI Agent
        const connectedNodes = node.data.type === 'aiAgent' ? findConnectedDataStorageNodes() : [];
        
        console.log('Connected Data Storage nodes:', connectedNodes);
        
        // Process through the node
        const response = await fetch(config.BACKEND_URL + '/api/nodes/run-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            node: {
              type: node.data.type,
              config: formData,
            },
            inputData: inputData,
            connectedNodes: connectedNodes
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

  const handleMemoryAction = async (action) => {
    setIsLoading(true);
    setMemoryActionResult(null);
    
    try {
      const userId = formData.userId || 'default';
      
      switch (action) {
        case 'stats':
          const statsResponse = await fetch(config.BACKEND_URL + '/api/nodes/memory/stats?userId=' + userId, {
            credentials: 'include'
          });
          
          // Check if response is HTML (404 error) instead of JSON
          const contentType = statsResponse.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            setMemoryActionResult('Memory management endpoints are not yet deployed to Render.\n\nThe new memory features were just committed but need time to deploy.\n\nPlease wait a few minutes for the deployment to complete, then try again.');
            break;
          }
          
          const statsResult = await statsResponse.json();
          if (statsResponse.ok) {
            setMemoryActionResult('Memory Stats for ' + userId + ':\n' + JSON.stringify(statsResult, null, 2));
          } else {
            setMemoryActionResult('Error: ' + statsResult.message);
          }
          break;
          
        case 'clear':
          const confirmed = window.confirm('Are you sure you want to clear conversation memory for user "' + userId + '"?');
          if (confirmed) {
            const clearResponse = await fetch(config.BACKEND_URL + '/api/nodes/memory/clear', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ userId })
            });
            const clearResult = await clearResponse.json();
            setMemoryActionResult(clearResult.message || 'Memory cleared');
          } else {
            setMemoryActionResult('Memory clear cancelled');
          }
          break;
          
        case 'export':
          const exportResponse = await fetch(config.BACKEND_URL + '/api/nodes/memory/export?userId=' + userId, {
            credentials: 'include'
          });
          const exportResult = await exportResponse.json();
          if (exportResponse.ok) {
            setMemoryActionResult('Exported conversation data:\n' + exportResult.data);
            
            // Also offer to download as file
            const blob = new Blob([exportResult.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'conversation-memory-' + userId + '-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } else {
            setMemoryActionResult('Error: ' + exportResult.message);
          }
          break;
          
        case 'import':
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.json';
          fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              try {
                const jsonData = await file.text();
                const importResponse = await fetch(config.BACKEND_URL + '/api/nodes/memory/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ jsonData, userId })
                });
                const importResult = await importResponse.json();
                setMemoryActionResult(importResult.message || 'Memory imported');
              } catch (error) {
                setMemoryActionResult('Error importing file: ' + error.message);
              }
            }
          };
          fileInput.click();
          setMemoryActionResult('Select a JSON file to import...');
          break;
          
        default:
          setMemoryActionResult('Unknown action: ' + action);
      }
    } catch (error) {
      setMemoryActionResult('Error: ' + error.message);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="config-panel-overlay" onClick={handleClose}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3><i className={node.data.icon + ' mr-2'}></i>{formData.label}</h3>
          <div className="flex items-center gap-3">
            {/* Auto-save status indicator */}
            <div className={`text-xs px-2 py-1 rounded-md ${
              autoSaveStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' :
              autoSaveStatus === 'saved' ? 'bg-green-100 text-green-800' :
              autoSaveStatus === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {autoSaveStatus === 'saving' && '💾 Saving...'}
              {autoSaveStatus === 'saved' && '✅ Saved'}
              {autoSaveStatus === 'error' && '❌ Save Error'}
            </div>
            <button onClick={handleClose} className="close-button">&times;</button>
          </div>
        </div>
        <div className="panel-content flex gap-4">
          {/* LEFT SECTION - INPUT */}
          <div className="panel-section flex-1">
            <div className="section-header flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>INPUT</span>
                {availableNodes.length > 0 && (
                  <select 
                    value={selectedNodeId} 
                    onChange={handleNodeSelectionChange}
                    className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
                  >
                    {availableNodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.type === 'trigger' ? '🔌' : '⚙️'} {node.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <button onClick={handleGetData} disabled={isLoading} className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600 disabled:bg-green-300">
                {isLoading ? '...' : 'GET'}
              </button>
            </div>
            <div className="section-content">
              {inputData ? (
                <div>
                  {/* Show data source indicator */}
                  {selectedNodeId && (
                    <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mb-2">
                      📊 Viewing data from: {availableNodes.find(n => n.id === selectedNodeId)?.label || 'Selected Node'}
                    </div>
                  )}
                  {inputData._metadata?.fromCache && (
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
                      📁 Cached data from {inputData._metadata.sourceNode} ({new Date(inputData._metadata.lastExecuted).toLocaleTimeString()})
                    </div>
                  )}
                  <DraggableJSONViewer data={inputData} nodePrefix={getCurrentNodePrefix()} />
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
                nodeMapping={createNodeNameMapping()}
              />
              <EnhancedTextInput 
                label="Description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                rows={3}
                placeholder="Node description"
                inputData={inputData}
                nodeMapping={createNodeNameMapping()}
              />
              
              {/* Fields for Model Node */}
              {node.data.type === 'modelNode' && (
                <>
                  <div className="form-group">
                    <label htmlFor="userId">User ID (for memory)</label>
                    <input 
                      type="text" 
                      name="userId" 
                      id="userId" 
                      value={formData.userId} 
                      onChange={handleInputChange} 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="default" 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="displayFormat">Display Format</label>
                    <select name="displayFormat" id="displayFormat" value={formData.displayFormat} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white">
                      <option value="chat">Chat Interface</option>
                      <option value="raw">Raw Response</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    💡 Model Node displays AI responses with memory. Each User ID has separate conversation history.
                  </div>
                  
                  {/* Quick Memory Stats Dashboard */}
                  {memoryQuickStats && (
                    <div className="form-group bg-green-50 p-2 rounded-md mb-2">
                      <div className="text-xs font-semibold text-green-800 mb-1">💾 Memory Usage</div>
                      <div className="flex gap-3 text-xs">
                        <div><strong>{memoryQuickStats.messageCount || 0}</strong> messages</div>
                        {memoryQuickStats.analytics && (
                          <>
                            <div><strong>{memoryQuickStats.analytics.averageProcessingTime}</strong> avg response</div>
                            <div><strong>{memoryQuickStats.analytics.totalCharacters}</strong> chars</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Memory Management Controls */}
                  <div className="form-group bg-blue-50 p-3 rounded-md">
                    <label className="text-sm font-semibold text-blue-800 mb-2 block">🧠 Memory Management</label>
                    <div className="flex gap-2 mb-2">
                      <button 
                        onClick={() => handleMemoryAction('stats')} 
                        className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        📊 Stats
                      </button>
                      <button 
                        onClick={() => handleMemoryAction('clear')} 
                        className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600"
                        disabled={isLoading}
                      >
                        🗑️ Clear
                      </button>
                      <button 
                        onClick={() => handleMemoryAction('export')} 
                        className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                        disabled={isLoading}
                      >
                        💾 Export
                      </button>
                      <button 
                        onClick={() => handleMemoryAction('import')} 
                        className="bg-purple-500 text-white px-3 py-1 text-sm rounded hover:bg-purple-600"
                        disabled={isLoading}
                      >
                        📂 Import
                      </button>
                    </div>
                    {memoryActionResult && (
                      <div className="text-xs p-2 rounded bg-white border max-h-32 overflow-y-auto">
                        {memoryActionResult.startsWith('Memory Stats') ? (
                          <MemoryVisualization data={memoryActionResult} />
                        ) : (
                          <pre className="whitespace-pre-wrap">{memoryActionResult}</pre>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Fields for AI Agent Node */}
              {node.data.type === 'aiAgent' && (
                <>
                  <div className="form-group">
                    <label htmlFor="userId">User ID (for memory)</label>
                    <input 
                      type="text" 
                      name="userId" 
                      id="userId" 
                      value={formData.userId} 
                      onChange={handleInputChange} 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="default" 
                    />
                  </div>
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
                      <div className={'mt-2 text-sm p-2 rounded-md ' + (apiKeyVerificationStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
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
                    nodeMapping={createNodeNameMapping()}
                  />
                  <DroppableTextInput 
                    label="User Prompt" 
                    name="userPrompt" 
                    value={formData.userPrompt} 
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="{{message}}"
                    inputData={inputData}
                    nodeMapping={createNodeNameMapping()}
                  />
                  <div className="text-xs text-gray-500 mb-2">
                    💡 System Prompt defines AI personality. User Prompt processes input with {"{{variables}}"}.<br/>
                    🔗 <strong>Smart Data Integration:</strong> When connected to Data Storage nodes, the AI automatically accesses stored information to answer questions intelligently.
                  </div>
                  
                  {/* Quick Memory Stats Dashboard */}
                  {memoryQuickStats && (
                    <div className="form-group bg-green-50 p-2 rounded-md mb-2">
                      <div className="text-xs font-semibold text-green-800 mb-1">💾 Memory Usage</div>
                      <div className="flex gap-3 text-xs">
                        <div><strong>{memoryQuickStats.messageCount || 0}</strong> messages</div>
                        {memoryQuickStats.analytics && (
                          <>
                            <div><strong>{memoryQuickStats.analytics.averageProcessingTime}</strong> avg response</div>
                            <div><strong>{memoryQuickStats.analytics.totalCharacters}</strong> chars</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Memory Management Controls */}
                  <div className="form-group bg-blue-50 p-3 rounded-md">
                    <label className="text-sm font-semibold text-blue-800 mb-2 block">🧠 Memory Management</label>
                    <div className="flex gap-2 mb-2">
                      <button 
                        onClick={() => handleMemoryAction('stats')} 
                        className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        📊 Stats
                      </button>
                      <button 
                        onClick={() => handleMemoryAction('clear')} 
                        className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600"
                        disabled={isLoading}
                      >
                        🗑️ Clear
                      </button>
                      <button 
                        onClick={() => handleMemoryAction('export')} 
                        className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                        disabled={isLoading}
                      >
                        💾 Export
                      </button>
                      <button 
                        onClick={() => handleMemoryAction('import')} 
                        className="bg-purple-500 text-white px-3 py-1 text-sm rounded hover:bg-purple-600"
                        disabled={isLoading}
                      >
                        📂 Import
                      </button>
                    </div>
                    {memoryActionResult && (
                      <div className="text-xs p-2 rounded bg-white border max-h-32 overflow-y-auto">
                        {memoryActionResult.startsWith('Memory Stats') ? (
                          <MemoryVisualization data={memoryActionResult} />
                        ) : (
                          <pre className="whitespace-pre-wrap">{memoryActionResult}</pre>
                        )}
                      </div>
                    )}
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
                    <div className={'mt-2 text-sm p-2 rounded-md ' + (verificationStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                      {verificationStatus.ok 
                        ? 'Success! Bot Name: ' + verificationStatus.bot.first_name + ', ID: ' + verificationStatus.bot.id
                        : 'Error: ' + verificationStatus.message
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
                      nodeMapping={createNodeNameMapping()}
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
                      nodeMapping={createNodeNameMapping()}
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
                      nodeMapping={createNodeNameMapping()}
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

              {/* Fields for Data Storage Node */}
              {node.data.type === 'dataStorage' && (
                <>
                  <div className="form-group">
                    <label>Action</label>
                    <select
                      name="action"
                      value={formData.action}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                    >
                      <option value="retrieve">Retrieve Data</option>
                      <option value="store">Store Data</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Stored Data Fields</label>
                    <div className="text-xs text-gray-500 mb-2">
                      Add key-value pairs of data you want to store. Other nodes can access these fields.
                    </div>
                    
                    {/* Dynamic fields for stored data */}
                    <div className="space-y-2">
                      {formData.storedData && Object.entries(formData.storedData).map(([key, value], index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Field name (e.g., name, email)"
                            value={key}
                            onChange={(e) => {
                              const newStoredData = { ...formData.storedData };
                              delete newStoredData[key];
                              newStoredData[e.target.value] = value;
                              const newFormData = { ...formData, storedData: newStoredData };
                              setFormData(newFormData);
                              autoSaveConfig(newFormData);
                            }}
                            className="flex-1 p-2 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={value}
                            onChange={(e) => {
                              const newStoredData = { ...formData.storedData };
                              newStoredData[key] = e.target.value;
                              const newFormData = { ...formData, storedData: newStoredData };
                              setFormData(newFormData);
                              autoSaveConfig(newFormData);
                            }}
                            className="flex-1 p-2 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => {
                              const newStoredData = { ...formData.storedData };
                              delete newStoredData[key];
                              const newFormData = { ...formData, storedData: newStoredData };
                              setFormData(newFormData);
                              autoSaveConfig(newFormData);
                            }}
                            className="bg-red-500 text-white px-2 py-1 text-sm rounded hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => {
                          const newStoredData = { ...formData.storedData, ['newField']: '' };
                          const newFormData = { ...formData, storedData: newStoredData };
                          setFormData(newFormData);
                          autoSaveConfig(newFormData);
                        }}
                        className="bg-green-500 text-white px-3 py-2 text-sm rounded hover:bg-green-600"
                      >
                        + Add Field
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-2">
                    Data Storage: Store personal information, settings, or any data that other nodes can access. 
                    Use drag-and-drop from output to create templates like {"{{name}}"} or {"{{email}}"}.
                  </div>
                </>
              )}

              {/* Fields for Telegram Send Message Node */}
              {node.data.type === 'telegramSendMessage' && (
                <>
                  <div className="text-xs text-gray-500 mb-4">
                    💬 Send Message: Send messages to Telegram chats. Use templates like {"{{message.chat.id}}"} to get chat ID from previous nodes.
                  </div>

                  <div className="form-group">
                    <label>Bot Token *</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        name="token"
                        value={formData.token || ''}
                        onChange={handleInputChange}
                        placeholder="Your Telegram Bot API Token"
                        className="input-field flex-grow"
                        required
                      />
                      <button 
                        onClick={handleCheckToken} 
                        disabled={isLoading || !formData.token}
                        className="bg-blue-500 text-white px-3 py-2 text-sm rounded hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        {isLoading ? '...' : 'Check'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Get this from @BotFather on Telegram
                    </div>
                    {verificationStatus && (
                      <div className={'mt-2 text-sm p-2 rounded-md ' + (verificationStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                        {verificationStatus.ok 
                          ? `✅ Bot verified: @${verificationStatus.bot?.username || 'Unknown'} (${verificationStatus.bot?.first_name || 'No name'})`
                          : `❌ ${verificationStatus.message}`
                        }
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Chat ID *</label>
                    <input
                      type="text"
                      name="chatId"
                      value={formData.chatId || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. {{message.chat.id}} or 123456789"
                      className="input-field"
                      required
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      <div>💡 Use node-prefixed templates:</div>
                      <div>• {"{{telegram.message.chat.id}}"} - Telegram chat ID</div>
                      <div>• {"{{aiAgent.reply}}"} - AI response</div>
                      <div>• {"{{storage.fieldName}}"} - Data storage field</div>
                    </div>
                    {/* Live preview for node-prefixed templates */}
                    {formData.chatId && formData.chatId.includes('{{') && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="font-semibold text-blue-800 mb-1">🔍 Template Preview:</div>
                        <div className="font-mono text-blue-700 bg-white p-1 rounded">
                          {replaceNodePrefixedTemplate(formData.chatId)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Message Text *</label>
                    <textarea
                      name="messageText"
                      value={formData.messageText || ''}
                      onChange={handleInputChange}
                      placeholder="Hello! You sent: {{message.text}}"
                      className="input-field"
                      rows="4"
                      required
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      <div>💡 Use node-prefixed templates:</div>
                      <div>• {"{{telegram.message.text}}"} - Original Telegram message</div>
                      <div>• {"{{aiAgent.reply}}"} - AI Agent response</div>
                      <div>• {"{{storage.userName}}"} - Data from storage</div>
                    </div>
                    {/* Live preview for node-prefixed templates */}
                    {formData.messageText && formData.messageText.includes('{{') && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="font-semibold text-blue-800 mb-1">🔍 Template Preview:</div>
                        <div className="font-mono text-blue-700 bg-white p-1 rounded max-h-20 overflow-y-auto">
                          {replaceNodePrefixedTemplate(formData.messageText)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Parse Mode</label>
                    <select
                      name="parseMode"
                      value={formData.parseMode || 'Markdown'}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="">None</option>
                      <option value="Markdown">Markdown</option>
                      <option value="HTML">HTML</option>
                    </select>
                    <div className="text-xs text-gray-400 mt-1">
                      How to format the message text
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="disableNotification"
                        checked={formData.disableNotification || false}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span>Silent Message (No notification)</span>
                    </label>
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
