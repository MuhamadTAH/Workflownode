
/*
=================================================================
FILE: frontend/src/components/ConfigPanel.js (ENHANCED)
=================================================================
*/
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

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
const DraggableJSONField = ({ path, value, level = 0, nodePrefix = '', dataType = 'generic', nodeName = '' }) => {
  const handleDragStart = (e) => {
    // Generate n8n-style template if nodeName is provided
    let templateVariable;
    if (nodeName) {
      templateVariable = `{{ $('${nodeName}').item.json.${path} }}`;
    } else {
      templateVariable = `{{$json.${path}}}`;
    }
    e.dataTransfer.setData('text/plain', templateVariable);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Get styling based on data type and field importance
  const getFieldStyling = () => {
    const fieldName = path.split('.').pop();
    
    // Important fields for different data types
    const importantFields = {
      telegram: ['text', 'username', 'first_name', 'id'],
      ai_response: ['response', 'content', 'message'],
      google_docs: ['title', 'documentId', 'content'],
      data_storage: Object.keys(value || {})
    };
    
    const isImportant = importantFields[dataType]?.includes(fieldName);
    
    if (isImportant) {
      const colors = {
        telegram: 'text-blue-700 bg-blue-50 border-blue-200',
        ai_response: 'text-green-700 bg-green-50 border-green-200',
        google_docs: 'text-yellow-700 bg-yellow-50 border-yellow-200',
        data_storage: 'text-purple-700 bg-purple-50 border-purple-200',
        generic: 'text-gray-700 bg-gray-50 border-gray-200'
      };
      return colors[dataType] || colors.generic;
    }
    
    return 'text-blue-600 hover:bg-blue-100';
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
          className={`${getFieldStyling()} font-mono text-sm cursor-grab px-1 rounded drag-field select-none border transition-colors`}
          draggable={true}
          onDragStart={handleDragStart}
          title={`Drag to insert {{$json.${path}}}`}
        >
          {path.split('.').pop()}
        </span>
        <span className="text-gray-400 ml-2 text-xs">
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  }

  return null; // Objects and arrays handled elsewhere
};

// Droppable Text Input Component
const DroppableTextInput = ({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  rows, 
  inputData, 
  nodeMapping,
  ...props 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedText = e.dataTransfer.getData('text/plain');
    
    // Insert at cursor position or append
    const input = e.target;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = value.substring(0, start) + droppedText + value.substring(end);
    
    // Trigger onChange event
    const syntheticEvent = {
      target: {
        name: name,
        value: newValue
      }
    };
    onChange(syntheticEvent);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const InputComponent = rows ? 'textarea' : 'input';

  return (
    <div className="form-group">
      <label>{label}</label>
      <InputComponent
        name={name}
        value={value}
        onChange={onChange}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        className={`condition-input drop-zone ${isDragOver ? 'drag-over' : ''} ${isFocused ? 'border-blue-500' : ''}`}
        {...props}
      />
      
      {/* Live Template Preview */}
      {isFocused && value && inputData && (
        <div className="mt-2 p-2 bg-gray-50 border rounded text-xs">
          <strong>Preview:</strong>
          <div className="font-mono text-green-600">
            {processTemplate(value, inputData)}
          </div>
        </div>
      )}
    </div>
  );
};

// Template processing helper
const processTemplate = (template, data) => {
  if (!template || !data) return template;
  
  return template.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
    const keys = path.split('.');
    let value = data;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return match;
      }
    }
    
    return typeof value === 'string' ? value : JSON.stringify(value);
  });
};

// Utility function for data type detection
const detectDataType = (data) => {
  if (!data || typeof data !== 'object') return 'unknown';
  
  // Telegram data detection
  if (data.message && data.update_id) {
    return 'telegram';
  }
  
  // AI response detection
  if (data.reply || data.response || data.content) {
    return 'ai_response';
  }
  
  // Google Docs detection
  if (data.documentId || data.title) {
    return 'google_docs';
  }
  
  // Data storage detection
  if (data.dataStorage || data.storage) {
    return 'data_storage';
  }
  
  return 'generic';
};

// JSON Tree Viewer Component
const NodeOrganizedJSONViewer = ({ data, onFieldDrag }) => {
  const [expandedNodes, setExpandedNodes] = useState({});

  if (!data || typeof data !== 'object') {
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        No JSON data to display
      </div>
    );
  }

  const toggleNode = (nodeName) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeName]: !prev[nodeName]
    }));
  };

  const renderJSONField = (key, value, path = '', nodePrefix = '', dataType = 'generic') => {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={fullPath} className="json-node">
          <details open={expandedNodes[fullPath] !== false}>
            <summary 
              className="json-key cursor-pointer hover:bg-gray-50 p-1 rounded"
              onClick={(e) => {
                e.preventDefault();
                toggleNode(fullPath);
              }}
            >
              <span className="font-semibold text-gray-700">📁 {key}</span>
              <span className="text-xs text-gray-400 ml-2">({Object.keys(value).length} fields)</span>
            </summary>
            <div className="json-value ml-4 border-l-2 border-gray-200 pl-3 mt-1">
              {Object.entries(value).map(([subKey, subValue]) => 
                renderJSONField(subKey, subValue, fullPath, nodePrefix, dataType)
              )}
            </div>
          </details>
        </div>
      );
    }

    return (
      <div key={fullPath} className="flex items-center justify-between py-1 hover:bg-gray-50 rounded px-1">
        <div className="flex items-center">
          <DraggableJSONField 
            path={fullPath}
            value={value}
            nodePrefix={nodePrefix}
            dataType={dataType}
          />
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {Array.isArray(value) ? `[${value.length} items]` : 
           typeof value === 'string' ? `"${value.substring(0, 30)}${value.length > 30 ? '...' : '}"` : 
           String(value)}
        </span>
      </div>
    );
  };

  // Organize data by detected type
  const dataType = detectDataType(data);
  const getNodeIcon = (type) => {
    switch(type) {
      case 'telegram': return '📱';
      case 'ai_response': return '🤖';
      case 'google_docs': return '📄';
      case 'data_storage': return '💾';
      default: return '📊';
    }
  };

  return (
    <div className="json-tree-container p-3">
      <div className="json-node-section">
        <div className={`json-node-header ${dataType}`}>
          <span className="node-type-icon">{getNodeIcon(dataType)}</span>
          <span className="json-node-title">
            {dataType === 'telegram' ? 'Telegram Message' :
             dataType === 'ai_response' ? 'AI Response' :
             dataType === 'google_docs' ? 'Google Docs' :
             dataType === 'data_storage' ? 'Data Storage' :
             'JSON Data'}
          </span>
          <span className="json-node-toggle">▶</span>
        </div>
        <div className="json-node-content">
          {Object.entries(data).map(([key, value]) => 
            renderJSONField(key, value, '', '', dataType)
          )}
        </div>
      </div>
    </div>
  );
};

const ConfigPanel = ({ node, onClose }) => {
  // Enhanced state management - keeping existing simple state + adding advanced features
  const [formData, setFormData] = useState(() => {
    return {
      // Existing simple form data (preserved)
      label: node.data.label || '',
      conditions: node.data.conditions || [{ key: '', operator: 'equals', value: '' }],
      batchSize: node.data.batchSize || 1,
      mode: node.data.mode || 'append',
      numberOfInputs: node.data.numberOfInputs || 2,
      key1: node.data.key1 || '',
      key2: node.data.key2 || '',
      rules: node.data.rules || [{ output: 0, conditions: [{ key: '', operator: 'equals', value: '' }] }],
      fallbackOutput: node.data.fallbackOutput !== undefined ? node.data.fallbackOutput : true,
      errorMessage: node.data.errorMessage || 'Workflow execution stopped due to an error.',
      delay: node.data.delay || 1000,
      workflowId: node.data.workflowId || '',
      
      // Advanced features added back
      description: node.data.description || '',
      model: node.data.model || 'claude-3-5-sonnet-20241022',
      apiKey: node.data.apiKey || '',
      systemPrompt: node.data.systemPrompt || 'You are a helpful AI assistant.',
      userPrompt: node.data.userPrompt || '{{message}}',
      displayFormat: node.data.displayFormat || 'chat',
      promptTemplate: node.data.promptTemplate || 'You are a helpful assistant. User message: {{message.text}}',
      userId: node.data.userId || 'default',
      botToken: node.data.botToken || '',
      clientId: node.data.clientId || '',
      clientSecret: node.data.clientSecret || '',
      action: node.data.action || 'getDocument',
      documentUrl: node.data.documentUrl || '',
      content: node.data.content || '',
      title: node.data.title || '',
      dataStorage: node.data.dataStorage || {}
    };
  });
  
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
  const debounceTimerRef = useRef(null); // For debouncing auto-save

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setAutoSaveStatus('saving');
    debounceTimerRef.current = setTimeout(() => {
      try {
        // Save to localStorage for persistence
        const saveKey = `node-config-${node.id}`;
        localStorage.setItem(saveKey, JSON.stringify(formData));
        setAutoSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('error');
      }
    }, 1000);
  }, [formData, node.id]);

  // Enhanced form change handler with auto-save
  const handleInputChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value);
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Trigger auto-save
    autoSave();
  }, [autoSave]);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value) });
  };

  const handleInputChange = (index, event) => {
    const newConditions = [...formData.conditions];
    newConditions[index][event.target.name] = event.target.value;
    setFormData({ ...formData, conditions: newConditions });
  };
  
  const addCondition = () => {
    const newConditions = [...formData.conditions, { key: '', operator: 'equals', value: '' }];
    setFormData({ ...formData, conditions: newConditions });
  };

  const removeCondition = (index) => {
    const newConditions = [...formData.conditions];
    newConditions.splice(index, 1);
    setFormData({ ...formData, conditions: newConditions });
  };

  const handleClose = () => {
    onClose({ ...node.data, ...formData });
  };

  const handleTestNode = async () => {
    setIsLoading(true);
    setOutputData(null);
    try {
      let parsedInput;
      try {
        parsedInput = inputData.trim() === '' ? [] : JSON.parse(inputData);
      } catch (e) {
        throw new Error("Invalid JSON in Input data.");
      }

      const response = await fetch('http://localhost:10001/api/run-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(result.message || 'Failed to test node.');
      }
      setOutputData(result);

    } catch (error) {
      setOutputData({ error: error.message });
    }
    setIsLoading(false);
  };

  const renderParameters = () => {
    // Existing simple node types (preserved)
    if (node.data.type === 'if' || node.data.type === 'filter') {
      return (
        <>
          <div className="form-group">
            <label>Conditions</label>
            {formData.conditions.map((condition, index) => (
              <div key={index} className="condition-row">
                <input type="text" name="key" placeholder="value1" value={condition.key} onChange={(e) => handleInputChange(index, e)} className="condition-input" />
                <span className="operator-display">is equal to</span>
                <input type="text" name="value" placeholder="value2" value={condition.value} onChange={(e) => handleInputChange(index, e)} className="condition-input" />
                <button onClick={() => removeCondition(index)} className="remove-condition-btn-subtle">
                    <i className="fa-solid fa-circle-xmark"></i>
                </button>
              </div>
            ))}
            <button onClick={addCondition} className="add-condition-btn full-width">+ Add Condition</button>
          </div>
          <div className="form-group">
            <label className="flex items-center toggle-label">
              <input type="checkbox" className="toggle-switch" />
              <span className="ml-2">Convert types where required</span>
            </label>
          </div>
          <div className="form-group">
            <label>Options</label>
            <input type="text" className="condition-input" placeholder="No properties" disabled />
            <button className="add-condition-btn full-width mt-2">+ Add option</button>
          </div>
        </>
      );
    }
    
    if (node.data.type === 'compare') {
      return (
        <>
          <div className="info-box">
            Items from different branches are paired together when the fields below match.
          </div>
          <div className="form-group">
            <label>Fields to Match</label>
            <input type="text" name="key1" value={formData.key1} onChange={handleFormChange} className="condition-input" placeholder="e.g. id" />
            <p className="field-description">Enter the field name as text</p>
            <input type="text" name="key2" value={formData.key2} onChange={handleFormChange} className="condition-input mt-2" placeholder="e.g. id" />
            <p className="field-description">Enter the field name as text</p>
            <button className="add-condition-btn full-width mt-2">+ Add Fields to Match</button>
          </div>
          <div className="form-group">
            <label>When There Are Differences</label>
            <select className="condition-input">
              <option>Include Both Versions</option>
            </select>
          </div>
          <div className="form-group">
            <label className="flex items-center toggle-label">
              <input type="checkbox" className="toggle-switch" />
              <span className="ml-2">Fuzzy Compare</span>
            </label>
          </div>
          <div className="form-group">
            <label>Options</label>
            <input type="text" className="condition-input" placeholder="No properties" disabled />
            <button className="add-condition-btn full-width mt-2">+ Add option</button>
          </div>
        </>
      );
    }

    // Advanced node types added back
    if (node.data.type === 'aiAgentNode') {
      return (
        <>
          <div className="form-group">
            <label>Model</label>
            <select name="model" value={formData.model} onChange={handleInputChange} className="condition-input">
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Official SDK)</option>
              <option value="gpt-4">GPT-4 (Coming Soon)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Claude API Key</label>
            <input 
              type="password" 
              name="apiKey" 
              value={formData.apiKey} 
              onChange={handleInputChange} 
              className="condition-input" 
              placeholder="sk-ant-..."
            />
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
          
          <div className="form-group">
            <label>User ID</label>
            <input 
              type="text" 
              name="userId" 
              value={formData.userId} 
              onChange={handleInputChange} 
              className="condition-input" 
              placeholder="default"
            />
          </div>
        </>
      );
    }

    if (node.data.type === 'modelNode') {
      return (
        <>
          <div className="form-group">
            <label>Claude API Key (Optional)</label>
            <input 
              type="password" 
              name="apiKey" 
              value={formData.apiKey} 
              onChange={handleInputChange} 
              className="condition-input" 
              placeholder="sk-ant-... (for direct chat functionality)"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Required only for direct chat. Leave empty if receiving input from AI Agent.
            </p>
          </div>
          
          <DroppableTextInput 
            label="System Prompt" 
            name="systemPrompt" 
            value={formData.systemPrompt} 
            onChange={handleInputChange}
            rows={3}
            placeholder="You are a helpful AI assistant."
            inputData={inputData}
          />
          
          <div className="form-group">
            <label>User ID (for memory)</label>
            <input 
              type="text" 
              name="userId" 
              value={formData.userId} 
              onChange={handleInputChange} 
              className="condition-input" 
              placeholder="default"
            />
          </div>
          
          <div className="form-group">
            <label>Display Format</label>
            <select name="displayFormat" value={formData.displayFormat} onChange={handleInputChange} className="condition-input">
              <option value="chat">Chat Interface</option>
              <option value="raw">Raw Response</option>
            </select>
          </div>
          
          <div className="text-xs text-gray-500 mb-2 p-2 bg-blue-50 rounded">
            🚀 <strong>Enhanced with Claude SDK:</strong><br/>
            • Direct chat with API key<br/>
            • Memory management per user<br/>
            • Usage tracking & analytics<br/>
            • Enhanced error handling
          </div>
        </>
      );
    }

    if (node.data.type === 'telegramTrigger') {
      return (
        <>
          <div className="form-group">
            <label>Bot Token</label>
            <input 
              type="password" 
              name="botToken" 
              value={formData.botToken} 
              onChange={handleInputChange} 
              className="condition-input" 
              placeholder="Enter your Telegram bot token"
            />
          </div>
          
          <div className="text-xs text-gray-500 mb-2">
            💡 Telegram Trigger automatically handles webhook setup and message fetching.
          </div>
        </>
      );
    }

    if (node.data.type === 'googleDocsNode') {
      return (
        <>
          <div className="form-group">
            <label>Action</label>
            <select name="action" value={formData.action} onChange={handleInputChange} className="condition-input">
              <option value="getDocument">Get Document</option>
              <option value="updateDocument">Update Document</option>
              <option value="createDocument">Create Document</option>
            </select>
          </div>
          
          {(formData.action === 'getDocument' || formData.action === 'updateDocument') && (
            <DroppableTextInput 
              label="Document URL" 
              name="documentUrl" 
              value={formData.documentUrl} 
              onChange={handleInputChange}
              placeholder="https://docs.google.com/document/d/..."
              inputData={inputData}
            />
          )}
          
          {formData.action === 'createDocument' && (
            <DroppableTextInput 
              label="Document Title" 
              name="title" 
              value={formData.title} 
              onChange={handleInputChange}
              placeholder="New Document Title"
              inputData={inputData}
            />
          )}
          
          {(formData.action === 'updateDocument' || formData.action === 'createDocument') && (
            <DroppableTextInput 
              label="Content" 
              name="content" 
              value={formData.content} 
              onChange={handleInputChange}
              rows={4}
              placeholder="Content to add/create"
              inputData={inputData}
            />
          )}
          
          <div className="text-xs text-gray-500 mb-2">
            🔗 Google Docs integration with OAuth2 authentication and template variables.
          </div>
        </>
      );
    }

    if (node.data.type === 'dataStorage') {
      return (
        <>
          <div className="form-group">
            <label>Data Storage</label>
            <p className="text-sm text-gray-600 mb-2">Store data that other nodes can access</p>
            
            {Object.entries(formData.dataStorage).map(([key, value], index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="Key" 
                  value={key}
                  onChange={(e) => {
                    const newStorage = {...formData.dataStorage};
                    delete newStorage[key];
                    newStorage[e.target.value] = value;
                    setFormData({...formData, dataStorage: newStorage});
                  }}
                  className="condition-input flex-1"
                />
                <input 
                  type="text" 
                  placeholder="Value" 
                  value={value}
                  onChange={(e) => {
                    setFormData({
                      ...formData, 
                      dataStorage: {...formData.dataStorage, [key]: e.target.value}
                    });
                  }}
                  className="condition-input flex-1"
                />
                <button 
                  onClick={() => {
                    const newStorage = {...formData.dataStorage};
                    delete newStorage[key];
                    setFormData({...formData, dataStorage: newStorage});
                  }}
                  className="remove-condition-btn-subtle"
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              </div>
            ))}
            
            <button 
              onClick={() => {
                const newKey = `field${Object.keys(formData.dataStorage).length + 1}`;
                setFormData({
                  ...formData, 
                  dataStorage: {...formData.dataStorage, [newKey]: ''}
                });
              }}
              className="add-condition-btn full-width"
            >
              + Add Data Field
            </button>
          </div>
        </>
      );
    }

    // Fallback for unknown node types
    return <p>Parameters for this node type are not implemented yet.</p>;
  };

  return (
    <div className="config-panel-overlay" onClick={handleClose}>
      {/* Enhanced INPUT Panel */}
      <div className="side-panel input-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>INPUT</h3>
          <button 
            onClick={() => {
              // Mock data for testing
              const mockData = {
                message: {
                  text: "Hello from Telegram",
                  chat: { id: 12345 },
                  from: { username: "testuser" }
                }
              };
              setInputData(JSON.stringify(mockData, null, 2));
            }}
            className="action-button"
          >
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
            <div className="empty-state">
              <i className="fa-solid fa-hand-pointer text-4xl text-gray-300 mb-4"></i>
              <h4 className="font-bold text-gray-500">Wire me up</h4>
              <p className="text-xs text-gray-400">
                This node can receive input data from connected nodes or use the GET button to fetch test data.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced MAIN Panel */}
      <div className="main-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>
            <i className={`fa-solid ${node.data.icon || 'fa-cog'} mr-2 ${node.data.color || 'text-gray-600'}`}></i>
            {node.data.label}
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
        <div className="panel-content">
          <div className="tabs">
            <button className="tab active">Parameters</button>
            <button className="tab">Settings</button>
          </div>
          <div className="parameters-content">
            {renderParameters()}
          </div>
        </div>
      </div>

      {/* Enhanced OUTPUT Panel */}
      <div className="side-panel output-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>OUTPUT</h3>
          <button 
            onClick={handleTestNode}
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
            <div className="empty-state">
              <i className="fa-solid fa-play-circle text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 font-semibold">Execute this node to view data</p>
              <button 
                onClick={() => {
                  // Set mock output data
                  setOutputData({
                    success: true,
                    processed: "Sample output data",
                    timestamp: new Date().toISOString()
                  });
                }}
                className="mock-data-btn"
              >
                or set mock data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
