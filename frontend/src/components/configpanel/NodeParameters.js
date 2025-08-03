/*
=================================================================
FILE: frontend/src/components/configpanel/NodeParameters.js
=================================================================
Node-Specific Parameter Forms for ConfigPanel
- All node type parameter rendering logic
- Form components for different node types (AI Agent, Model, Telegram, etc.)
- Node-specific configuration handling
*/
import React from 'react';
import { DroppableTextInput } from './DragDropSystem';
import { getNodeMetadata } from '../../config/nodeMetadata';

// Node Description Component
const NodeDescription = ({ nodeType }) => {
  const metadata = getNodeMetadata(nodeType);
  return (
    <div className="node-description" style={{ 
      backgroundColor: metadata.bgColor, 
      border: `1px solid ${metadata.color}20`,
      borderRadius: '4px',
      padding: '12px',
      marginBottom: '16px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '8px',
        color: metadata.color,
        fontWeight: '600',
        fontSize: '14px'
      }}>
        <span style={{ fontSize: '16px', marginRight: '8px' }}>{metadata.icon}</span>
        {metadata.title}
      </div>
      <p style={{ 
        margin: 0, 
        fontSize: '13px', 
        color: '#4a5568',
        lineHeight: '1.4'
      }}>
        {metadata.description}
      </p>
    </div>
  );
};

export const renderNodeParameters = (node, formData, handleFormFieldChange, handleInputChange, handleFormChange, addCondition, removeCondition, inputData, handleTelegramTokenCheck, activeTab, handleClaudeApiCheck, claudeApiStatus, availableModels) => {
  // Existing simple node types (preserved)
  if (node.data.type === 'if' || node.data.type === 'filter') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
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
        <NodeDescription nodeType={node.data.type} />
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

  // Advanced AI Agent Node with Tab Support
  if (node.data.type === 'aiAgent') {
    return (
      <>
        <NodeDescription nodeType="ai_agent" />
        
        {/* Parameters Tab */}
        {activeTab === 'parameters' && (
          <>
            {/* System Prompt */}
            <DroppableTextInput 
              label="System Prompt" 
              name="systemPrompt" 
              value={formData.systemPrompt || ''} 
              onChange={handleFormFieldChange}
              rows={4}
              placeholder="You are a helpful AI assistant. Tell the AI how it should behave and work."
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mb-4">
              💡 This tells Claude how to behave and what role it should take.
            </div>
            
            {/* User Prompt */}
            <DroppableTextInput 
              label="User Prompt" 
              name="userPrompt" 
              value={formData.userPrompt || ''} 
              onChange={handleFormFieldChange}
              rows={3}
              placeholder="{{message.text}} - Tell the AI what specific task to perform"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mb-4">
              💡 This is the specific task or question you want the AI to work on. Use template variables like {'{{message.text}}'}.
            </div>

            {/* Claude API Key */}
            <div className="form-group">
              <label>Claude API Key</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="password" 
                  name="claudeApiKey" 
                  value={formData.claudeApiKey || ''} 
                  onChange={handleFormFieldChange} 
                  className="condition-input" 
                  placeholder="sk-ant-..."
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => handleClaudeApiCheck && handleClaudeApiCheck(formData.claudeApiKey)}
                  className="action-button"
                  disabled={!formData.claudeApiKey || claudeApiStatus?.status === 'checking'}
                  style={{ 
                    minWidth: '60px',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                >
                  {claudeApiStatus?.status === 'checking' ? '...' : 'Check'}
                </button>
              </div>
              
              {/* API Key Status */}
              {claudeApiStatus && (
                <div className={`mt-2 p-2 rounded text-xs ${
                  claudeApiStatus.status === 'valid' ? 'bg-green-50 text-green-700 border border-green-200' :
                  claudeApiStatus.status === 'invalid' || claudeApiStatus.status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  <strong>
                    {claudeApiStatus.status === 'valid' ? '✅ Valid' :
                     claudeApiStatus.status === 'invalid' ? '❌ Invalid' :
                     claudeApiStatus.status === 'error' ? '⚠️ Error' :
                     '🔄 Checking...'}
                  </strong>: {claudeApiStatus.message}
                </div>
              )}
            </div>

            {/* Claude Model Selection */}
            <div className="form-group">
              <label>Claude Model</label>
              <select 
                name="claudeModel" 
                value={formData.claudeModel || 'claude-3-5-sonnet-20241022'} 
                onChange={handleFormFieldChange} 
                className="condition-input"
                disabled={claudeApiStatus?.status !== 'valid'}
              >
                {availableModels && availableModels.length > 0 ? (
                  availableModels.map(model => (
                    <option key={model} value={model}>
                      {model === 'claude-3-5-sonnet-20241022' ? 'Claude 3.5 Sonnet (Latest)' :
                       model === 'claude-3-opus-20240229' ? 'Claude 3 Opus (Most Capable)' :
                       model === 'claude-3-sonnet-20240229' ? 'Claude 3 Sonnet (Balanced)' :
                       model === 'claude-3-haiku-20240307' ? 'Claude 3 Haiku (Fastest)' :
                       model}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus (Most Capable)</option>
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (Balanced)</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fastest)</option>
                  </>
                )}
              </select>
              {claudeApiStatus?.status !== 'valid' && (
                <div className="text-xs text-gray-500 mt-1">
                  💡 Verify your API key first to see available models
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <>
            <div className="form-group">
              <label>User ID (for conversation memory)</label>
              <input 
                type="text" 
                name="userId" 
                value={formData.userId || 'default'} 
                onChange={handleFormFieldChange} 
                className="condition-input" 
                placeholder="default"
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 Used to separate conversations. Each User ID gets its own memory.
              </div>
            </div>
            
            <div className="form-group">
              <label>Max Tokens</label>
              <input 
                type="number" 
                name="maxTokens" 
                value={formData.maxTokens || 1000} 
                onChange={handleFormFieldChange} 
                className="condition-input" 
                min="1"
                max="4000"
                placeholder="1000"
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 Maximum number of tokens for the AI response (1-4000)
              </div>
            </div>
            
            <div className="form-group">
              <label>Temperature</label>
              <input 
                type="number" 
                name="temperature" 
                value={formData.temperature || 0.7} 
                onChange={handleFormFieldChange} 
                className="condition-input" 
                min="0"
                max="1"
                step="0.1"
                placeholder="0.7"
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 Controls randomness: 0 = focused, 1 = creative (0.0-1.0)
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  if (node.data.type === 'modelNode') {
    return (
      <>
        <NodeDescription nodeType="model" />
        <div className="form-group">
          <label>Claude API Key (Optional)</label>
          <input 
            type="password" 
            name="apiKey" 
            value={formData.apiKey} 
            onChange={handleFormFieldChange} 
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
          onChange={handleFormFieldChange}
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
            onChange={handleFormFieldChange} 
            className="condition-input" 
            placeholder="default"
          />
        </div>
        
        <div className="form-group">
          <label>Display Format</label>
          <select name="displayFormat" value={formData.displayFormat} onChange={handleFormFieldChange} className="condition-input">
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

  if (node.data.type === 'trigger') {
    return (
      <>
        <NodeDescription nodeType="telegram_trigger" />
        <div className="form-group">
          <label>Bot Token</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="password" 
              name="botToken" 
              value={formData.botToken} 
              onChange={handleFormFieldChange} 
              className="condition-input" 
              placeholder="Enter your Telegram bot token"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => handleTelegramTokenCheck(formData.botToken)}
              disabled={!formData.botToken || formData.botToken.length < 10}
              className="action-button"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                minWidth: '80px',
                backgroundColor: formData.tokenStatus === 'valid' ? '#10b981' : 
                                formData.tokenStatus === 'invalid' ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: formData.botToken ? 'pointer' : 'not-allowed',
                opacity: formData.botToken ? 1 : 0.5
              }}
            >
              {formData.tokenChecking ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '4px' }}></i>
                  Checking...
                </>
              ) : formData.tokenStatus === 'valid' ? (
                <>
                  <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i>
                  Valid
                </>
              ) : formData.tokenStatus === 'invalid' ? (
                <>
                  <i className="fa-solid fa-times" style={{ marginRight: '4px' }}></i>
                  Invalid
                </>
              ) : (
                <>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px' }}></i>
                  Check
                </>
              )}
            </button>
          </div>
          
          {/* Token validation status message */}
          {formData.tokenStatus === 'valid' && formData.botInfo && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#ecfdf5', 
              border: '1px solid #10b981', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#065f46'
            }}>
              <i className="fa-solid fa-check-circle" style={{ marginRight: '6px', color: '#10b981' }}></i>
              <strong>Bot Connected:</strong> @{formData.botInfo.username} ({formData.botInfo.first_name})
            </div>
          )}
          
          {formData.tokenStatus === 'invalid' && formData.tokenError && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #ef4444', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#991b1b'
            }}>
              <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '6px', color: '#ef4444' }}></i>
              <strong>Error:</strong> {formData.tokenError}
            </div>
          )}
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
        <NodeDescription nodeType="google_docs" />
        <div className="form-group">
          <label>Action</label>
          <select name="action" value={formData.action} onChange={handleFormFieldChange} className="condition-input">
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
            onChange={handleFormFieldChange}
            placeholder="https://docs.google.com/document/d/..."
            inputData={inputData}
          />
        )}
        
        {formData.action === 'createDocument' && (
          <DroppableTextInput 
            label="Document Title" 
            name="title" 
            value={formData.title} 
            onChange={handleFormFieldChange}
            placeholder="New Document Title"
            inputData={inputData}
          />
        )}
        
        {(formData.action === 'updateDocument' || formData.action === 'createDocument') && (
          <DroppableTextInput 
            label="Content" 
            name="content" 
            value={formData.content} 
            onChange={handleFormFieldChange}
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
        <NodeDescription nodeType="data_storage" />
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
                  handleFormFieldChange({
                    target: { name: 'dataStorage', value: newStorage }
                  });
                }}
                className="condition-input flex-1"
              />
              <input 
                type="text" 
                placeholder="Value" 
                value={value}
                onChange={(e) => {
                  handleFormFieldChange({
                    target: { 
                      name: 'dataStorage', 
                      value: {...formData.dataStorage, [key]: e.target.value}
                    }
                  });
                }}
                className="condition-input flex-1"
              />
              <button 
                onClick={() => {
                  const newStorage = {...formData.dataStorage};
                  delete newStorage[key];
                  handleFormFieldChange({
                    target: { name: 'dataStorage', value: newStorage }
                  });
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
              handleFormFieldChange({
                target: { 
                  name: 'dataStorage', 
                  value: {...formData.dataStorage, [newKey]: ''}
                }
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

  if (node.data.type === 'telegramSendMessage') {
    return (
      <>
        <NodeDescription nodeType="telegram_send_message" />
        
        <div className="form-group">
          <label>Bot Token</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="password" 
              name="botToken" 
              value={formData.botToken} 
              onChange={handleFormFieldChange} 
              className="condition-input" 
              placeholder="Enter your Telegram bot token"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => handleTelegramTokenCheck(formData.botToken)}
              disabled={!formData.botToken || formData.botToken.length < 10}
              className="action-button"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                minWidth: '80px',
                backgroundColor: formData.tokenStatus === 'valid' ? '#10b981' : 
                                formData.tokenStatus === 'invalid' ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: formData.botToken ? 'pointer' : 'not-allowed',
                opacity: formData.botToken ? 1 : 0.5
              }}
            >
              {formData.tokenChecking ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '4px' }}></i>
                  Checking...
                </>
              ) : formData.tokenStatus === 'valid' ? (
                <>
                  <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i>
                  Valid
                </>
              ) : formData.tokenStatus === 'invalid' ? (
                <>
                  <i className="fa-solid fa-times" style={{ marginRight: '4px' }}></i>
                  Invalid
                </>
              ) : (
                <>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px' }}></i>
                  Check
                </>
              )}
            </button>
          </div>
          
          {/* Token validation status message */}
          {formData.tokenStatus === 'valid' && formData.botInfo && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#ecfdf5', 
              border: '1px solid #10b981', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#065f46'
            }}>
              <i className="fa-solid fa-check-circle" style={{ marginRight: '6px', color: '#10b981' }}></i>
              <strong>Bot Connected:</strong> @{formData.botInfo.username} ({formData.botInfo.first_name})
            </div>
          )}
          
          {formData.tokenStatus === 'invalid' && formData.tokenError && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #ef4444', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#991b1b'
            }}>
              <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '6px', color: '#ef4444' }}></i>
              <strong>Error:</strong> {formData.tokenError}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Chat ID</label>
          <DroppableTextInput
            type="text"
            name="chatId"
            value={formData.chatId || ''}
            onChange={handleFormFieldChange}
            className="condition-input"
            placeholder="Enter chat ID (e.g., -1001234567890 for groups, 123456789 for users)"
            inputData={inputData}
          />
          <div className="text-xs text-gray-500 mt-1">
            💡 Use negative numbers for group chats (e.g., -1001234567890) or positive for direct messages
          </div>
        </div>

        <div className="form-group">
          <label>Message</label>
          <DroppableTextInput
            type="textarea"
            name="message"
            value={formData.message || ''}
            onChange={handleFormFieldChange}
            className="condition-input"
            placeholder="Enter your message here... You can use template variables like {{message.text}} or {{telegram.message.from.username}}"
            inputData={inputData}
            rows={4}
          />
          <div className="text-xs text-gray-500 mt-1">
            💡 Drag fields from Input panel to create dynamic messages with template variables
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-2">
          📤 This node will send the message to the specified chat using your bot
        </div>
      </>
    );
  }

  // Fallback for unknown node types
  return (
    <>
      <NodeDescription nodeType={node.data.type} />
      <p>Parameters for this node type are not implemented yet.</p>
    </>
  );
};