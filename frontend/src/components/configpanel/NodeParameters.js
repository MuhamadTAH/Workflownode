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

// Description Field Component for Settings Tab
const DescriptionField = ({ value, onChange }) => {
  return (
    <div className="form-group">
      <label>Description</label>
      <textarea
        name="description"
        value={value || ''}
        onChange={onChange}
        placeholder="Enter a description for this node..."
        className="condition-input"
        rows="3"
        style={{ resize: 'vertical', minHeight: '60px' }}
      />
      <div className="text-xs text-gray-500 mt-1">
        📝 Optional description to help document what this node does in your workflow.
      </div>
    </div>
  );
};

// Note Field Component for Settings Tab
const NoteField = ({ value, onChange }) => {
  return (
    <div className="form-group">
      <label>Notes</label>
      <textarea
        name="note"
        value={value || ''}
        onChange={onChange}
        placeholder="Add any notes, reminders, or additional information..."
        className="condition-input"
        rows="4"
        style={{ resize: 'vertical', minHeight: '80px' }}
      />
      <div className="text-xs text-gray-500 mt-1">
        📋 Personal notes and reminders about this node's configuration or purpose.
      </div>
    </div>
  );
};

// Universal Settings Tab Component for All Node Types
const UniversalSettingsTab = ({ formData, handleFormFieldChange, nodeType }) => {
  return (
    <>
      <DescriptionField value={formData.description} onChange={handleFormFieldChange} />
      <NoteField value={formData.note} onChange={handleFormFieldChange} />
      
      {/* AI-specific settings only for AI nodes */}
      {(nodeType === 'aiAgent' || nodeType === 'modelNode') && (
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
};

export const renderNodeParameters = (node, formData, handleFormFieldChange, handleInputChange, handleFormChange, addCondition, removeCondition, inputData, handleTelegramTokenCheck, activeTab, handleClaudeApiCheck, claudeApiStatus, availableModels) => {
  // Universal Settings Tab for ALL Node Types (PRIORITY - must be first)
  if (activeTab === 'settings') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <UniversalSettingsTab 
          formData={formData} 
          handleFormFieldChange={handleFormFieldChange} 
          nodeType={node.data.type} 
        />
      </>
    );
  }

  // ===== COMPREHENSIVE LOGIC NODES PARAMETER FORMS =====
  
  // IF NODE - Conditional routing with multiple conditions
  if (node.data.type === 'if') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="form-group">
          <label>Conditions</label>
          {(formData.conditions || [{ value1: '', operator: 'is_equal_to', value2: '' }]).map((condition, index) => (
            <div key={index} className="condition-row" style={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '4px', 
              padding: '12px', 
              marginBottom: '8px' 
            }}>
              <div className="condition-field">
                <label className="field-label">Field to Check</label>
                <DroppableTextInput
                  type="text"
                  placeholder="{{fieldName}} or field name"
                  value={condition.value1 || ''}
                  onChange={(e) => {
                    const newConditions = [...(formData.conditions || [])];
                    newConditions[index] = { ...newConditions[index], value1: e.target.value };
                    handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <div className="condition-field">
                <label className="field-label">Operator</label>
                <select 
                  value={condition.operator || 'is_equal_to'}
                  onChange={(e) => {
                    const newConditions = [...(formData.conditions || [])];
                    newConditions[index] = { ...newConditions[index], operator: e.target.value };
                    handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
                  }}
                  className="condition-input"
                >
                  <option value="is_equal_to">Is Equal To</option>
                  <option value="is_not_equal_to">Is Not Equal To</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                </select>
              </div>
              <div className="condition-field">
                <label className="field-label">Compare Value</label>
                <DroppableTextInput
                  type="text"
                  placeholder="Comparison value"
                  value={condition.value2 || ''}
                  onChange={(e) => {
                    const newConditions = [...(formData.conditions || [])];
                    newConditions[index] = { ...newConditions[index], value2: e.target.value };
                    handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <button 
                onClick={() => {
                  const newConditions = formData.conditions.filter((_, i) => i !== index);
                  handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
                }} 
                className="remove-condition-btn-subtle"
                title="Remove condition"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            </div>
          ))}
          <button 
            onClick={() => {
              const newConditions = [...(formData.conditions || []), { value1: '', operator: 'is_equal_to', value2: '' }];
              handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
            }} 
            className="add-condition-btn full-width"
          >
            + Add Condition
          </button>
        </div>
        
        <div className="form-group">
          <label>Condition Logic</label>
          <select 
            value={formData.combinator || 'AND'}
            onChange={(e) => handleFormFieldChange({ target: { name: 'combinator', value: e.target.value } })}
            className="condition-input"
          >
            <option value="AND">ALL conditions must match (AND)</option>
            <option value="OR">ANY condition can match (OR)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="flex items-center toggle-label">
            <input 
              type="checkbox" 
              className="toggle-switch"
              checked={formData.ignoreCase || false}
              onChange={(e) => handleFormFieldChange({ target: { name: 'ignoreCase', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
            />
            <span className="ml-2">Ignore text case when comparing</span>
          </label>
        </div>
      </>
    );
  }

  // FILTER NODE - Remove items based on conditions
  if (node.data.type === 'filter') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="info-box" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Filter Logic:</strong> Items that match ALL conditions will be kept. Items that don't match will be removed.
        </div>
        
        <div className="form-group">
          <label>Filter Conditions</label>
          {(formData.conditions || [{ value1: '', operator: 'is_equal_to', value2: '' }]).map((condition, index) => (
            <div key={index} className="condition-row" style={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '4px', 
              padding: '12px', 
              marginBottom: '8px' 
            }}>
              <div className="condition-field">
                <label className="field-label">Field to Filter</label>
                <DroppableTextInput
                  type="text"
                  placeholder="{{fieldName}} or field name"
                  value={condition.value1 || ''}
                  onChange={(e) => {
                    const newConditions = [...(formData.conditions || [])];
                    newConditions[index] = { ...newConditions[index], value1: e.target.value };
                    handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <div className="condition-field">
                <label className="field-label">Operator</label>
                <select 
                  value={condition.operator || 'is_equal_to'}
                  onChange={(e) => {
                    const newConditions = [...(formData.conditions || [])];
                    newConditions[index] = { ...newConditions[index], operator: e.target.value };
                    handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
                  }}
                  className="condition-input"
                >
                  <option value="is_equal_to">Keep if Equal To</option>
                  <option value="is_not_equal_to">Keep if Not Equal To</option>
                  <option value="contains">Keep if Contains</option>
                  <option value="greater_than">Keep if Greater Than</option>
                  <option value="less_than">Keep if Less Than</option>
                </select>
              </div>
              <div className="condition-field">
                <label className="field-label">Filter Value</label>
                <DroppableTextInput
                  type="text"
                  placeholder="Value to filter by"
                  value={condition.value2 || ''}
                  onChange={(e) => {
                    const newConditions = [...(formData.conditions || [])];
                    newConditions[index] = { ...newConditions[index], value2: e.target.value };
                    handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <button 
                onClick={() => {
                  const newConditions = formData.conditions.filter((_, i) => i !== index);
                  handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
                }} 
                className="remove-condition-btn-subtle"
                title="Remove condition"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            </div>
          ))}
          <button 
            onClick={() => {
              const newConditions = [...(formData.conditions || []), { value1: '', operator: 'is_equal_to', value2: '' }];
              handleFormFieldChange({ target: { name: 'conditions', value: newConditions } });
            }} 
            className="add-condition-btn full-width"
          >
            + Add Filter Condition
          </button>
        </div>
      </>
    );
  }

  // MERGE NODE - Combine data from multiple sources
  if (node.data.type === 'merge') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="info-box" style={{ backgroundColor: '#e8f4fd', border: '1px solid #bee5eb', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Merge Logic:</strong> Combines data from all connected inputs into a single output array.
        </div>
        
        <div className="form-group">
          <label>Merge Mode</label>
          <select 
            value={formData.mode || 'append'}
            onChange={(e) => handleFormFieldChange({ target: { name: 'mode', value: e.target.value } })}
            className="condition-input"
          >
            <option value="append">Append - Add all items to single list</option>
            <option value="merge_by_key">Merge by Key - Combine items with same key</option>
          </select>
        </div>
        
        {formData.mode === 'merge_by_key' && (
          <div className="form-group">
            <label>Key Field</label>
            <DroppableTextInput
              type="text"
              placeholder="id, name, etc."
              value={formData.keyField || ''}
              onChange={(e) => handleFormFieldChange({ target: { name: 'keyField', value: e.target.value } })}
              className="condition-input"
              inputData={inputData}
            />
            <p className="field-description">Field to use as merge key</p>
          </div>
        )}
      </>
    );
  }

  // SET DATA NODE - Create custom key-value pairs
  if (node.data.type === 'setData') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="info-box" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Set Data:</strong> Create custom objects with key-value pairs. Supports template variables from previous nodes.
        </div>
        
        <div className="form-group">
          <label>Data Fields</label>
          {(formData.fields || [{ key: '', value: '' }]).map((field, index) => (
            <div key={index} className="condition-row" style={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '4px', 
              padding: '12px', 
              marginBottom: '8px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: '8px',
              alignItems: 'end'
            }}>
              <div className="condition-field">
                <label className="field-label">Key</label>
                <DroppableTextInput
                  type="text"
                  placeholder="Field name"
                  value={field.key || ''}
                  onChange={(e) => {
                    const newFields = [...(formData.fields || [])];
                    newFields[index] = { ...newFields[index], key: e.target.value };
                    handleFormFieldChange({ target: { name: 'fields', value: newFields } });
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <div className="condition-field">
                <label className="field-label">Value</label>
                <DroppableTextInput
                  type="text"
                  placeholder="Field value or {{expression}}"
                  value={field.value || ''}
                  onChange={(e) => {
                    const newFields = [...(formData.fields || [])];
                    newFields[index] = { ...newFields[index], value: e.target.value };
                    handleFormFieldChange({ target: { name: 'fields', value: newFields } });
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <button 
                onClick={() => {
                  const newFields = formData.fields.filter((_, i) => i !== index);
                  handleFormFieldChange({ target: { name: 'fields', value: newFields } });
                }} 
                className="remove-condition-btn-subtle"
                title="Remove field"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            </div>
          ))}
          <button 
            onClick={() => {
              const newFields = [...(formData.fields || []), { key: '', value: '' }];
              handleFormFieldChange({ target: { name: 'fields', value: newFields } });
            }} 
            className="add-condition-btn full-width"
          >
            + Add Field
          </button>
        </div>
      </>
    );
  }

  // SWITCH NODE - Multi-path routing based on rules
  if (node.data.type === 'switch') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="info-box" style={{ backgroundColor: '#fdf2f8', border: '1px solid #f9a8d4', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Switch Logic:</strong> Routes items to different outputs based on rules. First matching rule wins.
        </div>
        
        <div className="form-group">
          <label>Switch Rules</label>
          {(formData.switchRules || [{ value1: '', operator: 'is_equal_to', value2: '' }]).map((rule, index) => (
            <div key={index} className="condition-row" style={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '4px', 
              padding: '12px', 
              marginBottom: '8px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', color: '#6366f1', fontWeight: '600' }}>
                <span style={{ fontSize: '14px', marginRight: '8px' }}>📍</span>
                Output {index + 1}
              </div>
              
              <div className="condition-field">
                <label className="field-label">Field to Check</label>
                <DroppableTextInput
                  type="text"
                  placeholder="{{fieldName}} or field name"
                  value={rule.value1 || ''}
                  onChange={(e) => {
                    const newRules = [...(formData.switchRules || [])];
                    newRules[index] = { ...newRules[index], value1: e.target.value };
                    handleFormFieldChange({ target: { name: 'switchRules', value: newRules } });
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <div className="condition-field">
                <label className="field-label">Operator</label>
                <select 
                  value={rule.operator || 'is_equal_to'}
                  onChange={(e) => {
                    const newRules = [...(formData.switchRules || [])];
                    newRules[index] = { ...newRules[index], operator: e.target.value };
                    handleFormFieldChange({ target: { name: 'switchRules', value: newRules } });
                  }}
                  className="condition-input"
                >
                  <option value="is_equal_to">Is Equal To</option>
                  <option value="is_not_equal_to">Is Not Equal To</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                </select>
              </div>
              <div className="condition-field">
                <label className="field-label">Compare Value</label>
                <DroppableTextInput
                  type="text"
                  placeholder="Comparison value"
                  value={rule.value2 || ''}
                  onChange={(e) => {
                    const newRules = [...(formData.switchRules || [])];
                    newRules[index] = { ...newRules[index], value2: e.target.value };
                    handleFormFieldChange({ target: { name: 'switchRules', value: newRules } });
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <button 
                onClick={() => {
                  const newRules = formData.switchRules.filter((_, i) => i !== index);
                  handleFormFieldChange({ target: { name: 'switchRules', value: newRules } });
                }} 
                className="remove-condition-btn-subtle"
                title="Remove rule"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            </div>
          ))}
          <button 
            onClick={() => {
              const newRules = [...(formData.switchRules || []), { value1: '', operator: 'is_equal_to', value2: '' }];
              // Create a synthetic event object for handleFormFieldChange
              const syntheticEvent = {
                target: {
                  name: 'switchRules',
                  value: newRules,
                  type: 'button'
                }
              };
              handleFormFieldChange(syntheticEvent);
            }} 
            className="add-condition-btn full-width"
          >
            + Add Switch Rule
          </button>
        </div>
        
        <div className="form-group">
          <label>Options</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="flex items-center toggle-label">
              <input 
                type="checkbox" 
                className="toggle-switch"
                checked={(formData.switchOptions || []).includes('ignoreCase')}
                onChange={(e) => {
                  const currentOptions = formData.switchOptions || [];
                  const newOptions = e.target.checked 
                    ? [...currentOptions, 'ignoreCase']
                    : currentOptions.filter(opt => opt !== 'ignoreCase');
                  handleFormFieldChange({ target: { name: 'switchOptions', value: newOptions } });
                }}
              />
              <span className="ml-2">Ignore text case when comparing</span>
            </label>
            <label className="flex items-center toggle-label">
              <input 
                type="checkbox" 
                className="toggle-switch"
                checked={(formData.switchOptions || []).includes('fallbackOutput')}
                onChange={(e) => {
                  const currentOptions = formData.switchOptions || [];
                  const newOptions = e.target.checked 
                    ? [...currentOptions, 'fallbackOutput']
                    : currentOptions.filter(opt => opt !== 'fallbackOutput');
                  handleFormFieldChange({ target: { name: 'switchOptions', value: newOptions } });
                }}
              />
              <span className="ml-2">Add fallback output for unmatched items</span>
            </label>
          </div>
        </div>
      </>
    );
  }

  // WAIT NODE - Pause workflow execution
  if (node.data.type === 'wait') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="info-box" style={{ backgroundColor: '#fffbeb', border: '1px solid #fed7aa', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Wait Logic:</strong> Pauses workflow execution for a specified time before continuing.
        </div>
        
        <div className="form-group">
          <label>Resume Condition</label>
          <select 
            value={formData.resumeCondition || 'afterTimeInterval'}
            onChange={(e) => handleFormFieldChange({ target: { name: 'resumeCondition', value: e.target.value } })}
            className="condition-input"
          >
            <option value="afterTimeInterval">After Time Interval</option>
            <option value="atSpecificTime">At Specific Time</option>
            <option value="onWebhookCall">On Webhook Call</option>
          </select>
        </div>
        
        {formData.resumeCondition === 'afterTimeInterval' && (
          <>
            <div className="form-group">
              <label>Wait Duration</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="5"
                  value={formData.waitAmount || ''}
                  onChange={(e) => handleFormFieldChange({ target: { name: 'waitAmount', value: e.target.value } })}
                  className="condition-input"
                  min="0"
                  step="0.1"
                />
                <select 
                  value={formData.waitUnit || 'seconds'}
                  onChange={(e) => handleFormFieldChange({ target: { name: 'waitUnit', value: e.target.value } })}
                  className="condition-input"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <p className="field-description">How long to wait before continuing</p>
            </div>
          </>
        )}
        
        {formData.resumeCondition === 'atSpecificTime' && (
          <div className="form-group">
            <label>Specific Time</label>
            <input
              type="datetime-local"
              value={formData.specificTime || ''}
              onChange={(e) => handleFormFieldChange({ target: { name: 'specificTime', value: e.target.value } })}
              className="condition-input"
            />
            <p className="field-description">Wait until this specific date and time</p>
          </div>
        )}
      </>
    );
  }

  // STOP AND ERROR NODE - Terminate workflow with error
  if (node.data.type === 'stopAndError') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="info-box" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Stop and Error:</strong> Immediately terminates workflow execution with a custom error message.
        </div>
        
        <div className="form-group">
          <label>Error Type</label>
          <select 
            value={formData.errorType || 'errorMessage'}
            onChange={(e) => handleFormFieldChange({ target: { name: 'errorType', value: e.target.value } })}
            className="condition-input"
          >
            <option value="errorMessage">Error Message</option>
            <option value="errorObject">Error Object</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Error Message</label>
          <DroppableTextInput
            type="text"
            placeholder="Workflow execution stopped due to an error."
            value={formData.errorMessage || ''}
            onChange={(e) => handleFormFieldChange({ target: { name: 'errorMessage', value: e.target.value } })}
            className="condition-input"
            inputData={inputData}
          />
          <p className="field-description">The error message to display when workflow stops</p>
        </div>
      </>
    );
  }

  // LOOP NODE - Iterate over data batches  
  if (node.data.type === 'loop') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="info-box" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Loop Logic:</strong> Splits input data into batches and processes each batch separately.
        </div>
        
        <div className="form-group">
          <label>Batch Size</label>
          <input
            type="number"
            placeholder="1"
            value={formData.batchSize || ''}
            onChange={(e) => handleFormFieldChange({ target: { name: 'batchSize', value: parseInt(e.target.value) || 1 } })}
            className="condition-input"
            min="1"
          />
          <p className="field-description">Number of items to process in each batch</p>
        </div>
        
        <div className="form-group">
          <label>Loop Mode</label>
          <select 
            value={formData.loopMode || 'each_item'}
            onChange={(e) => handleFormFieldChange({ target: { name: 'loopMode', value: e.target.value } })}
            className="condition-input"
          >
            <option value="each_item">Process Each Item</option>
            <option value="batch">Process in Batches</option>
          </select>
        </div>
      </>
    );
  }

  // COMPARE DATASETS NODE - Compare two datasets for differences
  if (node.data.type === 'compareDatasets') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="info-box" style={{ backgroundColor: '#f3e8ff', border: '1px solid #c084fc', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Compare Logic:</strong> Compares two datasets and identifies differences, matches, and unique items.
        </div>
        
        <div className="form-group">
          <label>Comparison Key</label>
          <DroppableTextInput
            type="text"
            placeholder="id, name, etc."
            value={formData.keyField || ''}
            onChange={(e) => handleFormFieldChange({ target: { name: 'keyField', value: e.target.value } })}
            className="condition-input"
            inputData={inputData}
          />
          <p className="field-description">Field to use for comparing items (must exist in both datasets)</p>
        </div>
        
        <div className="form-group">
          <label>Comparison Mode</label>
          <select 
            value={formData.compareMode || 'full'}
            onChange={(e) => handleFormFieldChange({ target: { name: 'compareMode', value: e.target.value } })}
            className="condition-input"
          >
            <option value="full">Full Comparison - Show all differences</option>
            <option value="added_only">Added Only - Show items in dataset 2 but not 1</option>
            <option value="removed_only">Removed Only - Show items in dataset 1 but not 2</option>
            <option value="changed_only">Changed Only - Show modified items</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Options</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="flex items-center toggle-label">
              <input 
                type="checkbox" 
                className="toggle-switch"
                checked={formData.includeEqual || false}
                onChange={(e) => handleFormFieldChange({ target: { name: 'includeEqual', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
              />
              <span className="ml-2">Include unchanged items in output</span>
            </label>
            <label className="flex items-center toggle-label">
              <input 
                type="checkbox" 
                className="toggle-switch"
                checked={formData.fuzzyCompare || false}
                onChange={(e) => handleFormFieldChange({ target: { name: 'fuzzyCompare', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
              />
              <span className="ml-2">Use fuzzy comparison for text fields</span>
            </label>
          </div>
        </div>
      </>
    );
  }

  // EXECUTE SUB WORKFLOW NODE - Run nested workflows
  if (node.data.type === 'executeSubWorkflow') {
    return (
      <>
        <NodeDescription nodeType={node.data.type} />
        <div className="info-box" style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Sub Workflow:</strong> Executes a nested workflow with the current data as input. Useful for reusable workflow components.
        </div>
        
        <div className="form-group">
          <label>Workflow to Execute</label>
          <select 
            value={formData.subWorkflowId || ''}
            onChange={(e) => handleFormFieldChange({ target: { name: 'subWorkflowId', value: e.target.value } })}
            className="condition-input"
          >
            <option value="">Select a workflow...</option>
            <option value="workflow1">Data Processing Workflow</option>
            <option value="workflow2">Email Notification Workflow</option>
            <option value="workflow3">File Processing Workflow</option>
          </select>
          <p className="field-description">Choose which workflow to execute as a sub-process</p>
        </div>
        
        <div className="form-group">
          <label>Input Mapping</label>
          <DroppableTextInput
            type="text"
            placeholder="{{inputData}} or custom mapping"
            value={formData.inputMapping || ''}
            onChange={(e) => handleFormFieldChange({ target: { name: 'inputMapping', value: e.target.value } })}
            className="condition-input"
            inputData={inputData}
          />
          <p className="field-description">How to map current data to sub-workflow input</p>
        </div>
        
        <div className="form-group">
          <label>Execution Settings</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="flex items-center toggle-label">
              <input 
                type="checkbox" 
                className="toggle-switch"
                checked={formData.waitForCompletion || true}
                onChange={(e) => handleFormFieldChange({ target: { name: 'waitForCompletion', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
              />
              <span className="ml-2">Wait for sub-workflow to complete</span>
            </label>
            <label className="flex items-center toggle-label">
              <input 
                type="checkbox" 
                className="toggle-switch"
                checked={formData.passThrough || false}
                onChange={(e) => handleFormFieldChange({ target: { name: 'passThrough', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
              />
              <span className="ml-2">Pass original data through unchanged</span>
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label>Timeout (seconds)</label>
          <input
            type="number"
            placeholder="30"
            value={formData.timeout || ''}
            onChange={(e) => handleFormFieldChange({ target: { name: 'timeout', value: parseInt(e.target.value) || 30 } })}
            className="condition-input"
            min="1"
            max="300"
          />
          <p className="field-description">Maximum time to wait for sub-workflow completion</p>
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
          <label>Message Type</label>
          <select 
            name="messageType" 
            value={formData.messageType || 'text'} 
            onChange={handleFormFieldChange} 
            className="condition-input"
          >
            <option value="text">📝 Text Message</option>
            <option value="photo">🖼️ Photo/Image</option>
            <option value="video">🎥 Video</option>
            <option value="audio">🎵 Audio</option>
            <option value="voice">🎤 Voice Note</option>
            <option value="document">📄 Document</option>
            <option value="animation">🎬 Animation/GIF</option>
            <option value="sticker">😊 Sticker</option>
            <option value="location">📍 Location</option>
            <option value="contact">👤 Contact</option>
            <option value="poll">📊 Poll/Quiz</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            💡 Choose what type of content to send via Telegram
          </div>
        </div>

        {/* Text Message Fields */}
        {(formData.messageType || 'text') === 'text' && (
          <div className="form-group">
            <label>Message</label>
            <DroppableTextInput
              type="textarea"
              name="messageText"
              value={formData.messageText || ''}
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
        )}

        {/* Photo Message Fields */}
        {formData.messageType === 'photo' && (
          <>
            <div className="form-group">
              <label>Photo URL</label>
              <DroppableTextInput
                type="text"
                name="photoUrl"
                value={formData.photoUrl || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="https://example.com/image.jpg or use template variables like {{storage.image_url}}"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                🖼️ Direct link to image file (JPG, PNG, GIF). Must be publicly accessible.
              </div>
            </div>
            
            <div className="form-group">
              <label>Caption (Optional)</label>
              <DroppableTextInput
                type="textarea"
                name="photoCaption"
                value={formData.photoCaption || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="Add a caption for your photo... You can use template variables"
                inputData={inputData}
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 Optional text that will appear with the photo
              </div>
            </div>
          </>
        )}

        {/* Video Message Fields */}
        {formData.messageType === 'video' && (
          <>
            <div className="form-group">
              <label>Video URL</label>
              <DroppableTextInput
                type="text"
                name="videoUrl"
                value={formData.videoUrl || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="https://example.com/video.mp4 or use template variables like {{storage.video_url}}"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                🎥 Direct link to video file (MP4, AVI, MOV). Must be publicly accessible.
              </div>
            </div>
            
            <div className="form-group">
              <label>Caption (Optional)</label>
              <DroppableTextInput
                type="textarea"
                name="videoCaption"
                value={formData.videoCaption || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="Add a caption for your video... You can use template variables"
                inputData={inputData}
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 Optional text that will appear with the video
              </div>
            </div>
            
            <div className="form-group">
              <label>Duration (seconds, optional)</label>
              <input
                type="number"
                name="videoDuration"
                value={formData.videoDuration || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="0"
                min="0"
              />
              <div className="text-xs text-gray-500 mt-1">
                ⏱️ Video duration in seconds (optional)
              </div>
            </div>
          </>
        )}

        {/* Audio Message Fields */}
        {formData.messageType === 'audio' && (
          <>
            <div className="form-group">
              <label>Audio URL</label>
              <DroppableTextInput
                type="text"
                name="audioUrl"
                value={formData.audioUrl || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="https://example.com/audio.mp3 or use template variables"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                🎵 Direct link to audio file (MP3, WAV, FLAC). Must be publicly accessible.
              </div>
            </div>
            
            <div className="form-group">
              <label>Title (Optional)</label>
              <DroppableTextInput
                type="text"
                name="audioTitle"
                value={formData.audioTitle || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="Song title or audio name"
                inputData={inputData}
              />
            </div>
            
            <div className="form-group">
              <label>Performer (Optional)</label>
              <DroppableTextInput
                type="text"
                name="audioPerformer"
                value={formData.audioPerformer || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="Artist or performer name"
                inputData={inputData}
              />
            </div>
            
            <div className="form-group">
              <label>Duration (seconds, optional)</label>
              <input
                type="number"
                name="audioDuration"
                value={formData.audioDuration || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="0"
                min="0"
              />
            </div>
          </>
        )}

        {/* Voice Note Fields */}
        {formData.messageType === 'voice' && (
          <>
            <div className="form-group">
              <label>Voice Note URL</label>
              <DroppableTextInput
                type="text"
                name="voiceUrl"
                value={formData.voiceUrl || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="https://example.com/voice.ogg or use template variables"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                🎤 Direct link to voice note file (.ogg format). Must be publicly accessible.
              </div>
            </div>
            
            <div className="form-group">
              <label>Duration (seconds, optional)</label>
              <input
                type="number"
                name="voiceDuration"
                value={formData.voiceDuration || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="0"
                min="0"
              />
              <div className="text-xs text-gray-500 mt-1">
                ⏱️ Voice note duration in seconds (optional)
              </div>
            </div>
          </>
        )}

        {/* Document Fields */}
        {formData.messageType === 'document' && (
          <>
            <div className="form-group">
              <label>Document URL</label>
              <DroppableTextInput
                type="text"
                name="documentUrl"
                value={formData.documentUrl || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="https://example.com/document.pdf or use template variables"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                📄 Direct link to document (PDF, DOC, TXT, etc.). Must be publicly accessible.
              </div>
            </div>
            
            <div className="form-group">
              <label>Caption (Optional)</label>
              <DroppableTextInput
                type="textarea"
                name="documentCaption"
                value={formData.documentCaption || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="Add a caption for your document... You can use template variables"
                inputData={inputData}
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 Optional text that will appear with the document
              </div>
            </div>
          </>
        )}

        {/* Animation/GIF Fields */}
        {formData.messageType === 'animation' && (
          <>
            <div className="form-group">
              <label>Animation URL</label>
              <DroppableTextInput
                type="text"
                name="animationUrl"
                value={formData.animationUrl || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="https://example.com/animation.gif or use template variables"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                🎬 Direct link to GIF or animation file. Must be publicly accessible.
              </div>
            </div>
            
            <div className="form-group">
              <label>Caption (Optional)</label>
              <DroppableTextInput
                type="textarea"
                name="animationCaption"
                value={formData.animationCaption || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="Add a caption for your animation... You can use template variables"
                inputData={inputData}
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 Optional text that will appear with the animation
              </div>
            </div>
          </>
        )}

        {/* Sticker Fields */}
        {formData.messageType === 'sticker' && (
          <>
            <div className="form-group">
              <label>Sticker File ID</label>
              <DroppableTextInput
                type="text"
                name="stickerFileId"
                value={formData.stickerFileId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="CAADAgADQAADyIsGAAE7MpzFPFQX5QI or use template variables"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                😊 Telegram sticker file ID. Get this from forwarding a sticker to @userinfobot.
              </div>
            </div>
          </>
        )}

        {/* Location Fields */}
        {formData.messageType === 'location' && (
          <>
            <div className="form-group">
              <label>Latitude</label>
              <DroppableTextInput
                type="text"
                name="latitude"
                value={formData.latitude || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="51.5074 or use template variables like {{telegram.message.location.latitude}}"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                📍 Location latitude (decimal degrees)
              </div>
            </div>
            
            <div className="form-group">
              <label>Longitude</label>
              <DroppableTextInput
                type="text"
                name="longitude"
                value={formData.longitude || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="-0.1278 or use template variables like {{telegram.message.location.longitude}}"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                📍 Location longitude (decimal degrees)
              </div>
            </div>
            
            <div className="form-group">
              <label>Live Location Period (Optional)</label>
              <input
                type="number"
                name="livePeriod"
                value={formData.livePeriod || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="0"
                min="60"
                max="86400"
              />
              <div className="text-xs text-gray-500 mt-1">
                ⏱️ Period in seconds for live location updates (60-86400). Leave 0 for static location.
              </div>
            </div>
          </>
        )}

        {/* Contact Fields */}
        {formData.messageType === 'contact' && (
          <>
            <div className="form-group">
              <label>Phone Number</label>
              <DroppableTextInput
                type="text"
                name="contactPhone"
                value={formData.contactPhone || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="+1234567890 or use template variables like {{telegram.message.contact.phone_number}}"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                📞 Contact phone number (include country code)
              </div>
            </div>
            
            <div className="form-group">
              <label>First Name</label>
              <DroppableTextInput
                type="text"
                name="contactFirstName"
                value={formData.contactFirstName || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="John or use template variables like {{telegram.message.contact.first_name}}"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                👤 Contact first name
              </div>
            </div>
            
            <div className="form-group">
              <label>Last Name (Optional)</label>
              <DroppableTextInput
                type="text"
                name="contactLastName"
                value={formData.contactLastName || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="Doe or use template variables like {{telegram.message.contact.last_name}}"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                👤 Contact last name (optional)
              </div>
            </div>
            
            <div className="form-group">
              <label>Telegram User ID (Optional)</label>
              <input
                type="number"
                name="contactUserId"
                value={formData.contactUserId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="123456789"
                min="0"
              />
              <div className="text-xs text-gray-500 mt-1">
                🆔 Telegram user ID if this contact is a Telegram user (optional)
              </div>
            </div>
          </>
        )}

        {/* Poll/Quiz Fields */}
        {formData.messageType === 'poll' && (
          <>
            <div className="form-group">
              <label>Poll Question</label>
              <DroppableTextInput
                type="text"
                name="pollQuestion"
                value={formData.pollQuestion || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="What is your favorite color? (use template variables if needed)"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                ❓ The main poll question
              </div>
            </div>
            
            <div className="form-group">
              <label>Poll Options</label>
              <DroppableTextInput
                type="textarea"
                name="pollOptions"
                value={formData.pollOptions || 'Red\nBlue\nGreen\nYellow'}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="Red\nBlue\nGreen\nYellow\n(One option per line)"
                inputData={inputData}
                rows={4}
              />
              <div className="text-xs text-gray-500 mt-1">
                📝 Poll options, one per line (2-10 options)
              </div>
            </div>
            
            <div className="form-group">
              <label>Poll Type</label>
              <select 
                name="pollType" 
                value={formData.pollType || 'regular'} 
                onChange={handleFormFieldChange} 
                className="condition-input"
              >
                <option value="regular">📊 Regular Poll</option>
                <option value="quiz">🧠 Quiz</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                💡 Quiz type shows correct answers, regular poll doesn't
              </div>
            </div>
            
            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="pollAnonymous"
                  checked={formData.pollAnonymous !== false}
                  onChange={handleFormFieldChange}
                  className="mr-2"
                />
                Anonymous Poll
              </label>
              <div className="text-xs text-gray-500 mt-1">
                🕶️ Hide who voted for what option
              </div>
            </div>
            
            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="pollMultipleAnswers"
                  checked={formData.pollMultipleAnswers === true}
                  onChange={handleFormFieldChange}
                  className="mr-2"
                />
                Allow Multiple Answers
              </label>
              <div className="text-xs text-gray-500 mt-1">
                ✅ Users can select multiple options
              </div>
            </div>
            
            {formData.pollType === 'quiz' && (
              <div className="form-group">
                <label>Correct Answer Index (Quiz only)</label>
                <input
                  type="number"
                  name="quizCorrectOption"
                  value={formData.quizCorrectOption || 0}
                  onChange={handleFormFieldChange}
                  className="condition-input"
                  placeholder="0"
                  min="0"
                />
                <div className="text-xs text-gray-500 mt-1">
                  🎯 Index of correct answer (0 = first option, 1 = second, etc.)
                </div>
              </div>
            )}
          </>
        )}

        {/* Text Message Fields - Add Parse Mode for media captions */}
        {((formData.messageType || 'text') === 'text' || 
          formData.messageType === 'photo' || 
          formData.messageType === 'video' || 
          formData.messageType === 'document' || 
          formData.messageType === 'animation') && (
          <div className="form-group">
            <label>Parse Mode (Optional)</label>
            <select 
              name="parseMode" 
              value={formData.parseMode || ''} 
              onChange={handleFormFieldChange} 
              className="condition-input"
            >
              <option value="">None</option>
              <option value="Markdown">Markdown</option>
              <option value="MarkdownV2">MarkdownV2</option>
              <option value="HTML">HTML</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">
              ✨ Enable text formatting: **bold**, *italic*, [links](url), etc.
            </div>
          </div>
        )}

        {/* Common options for all message types */}
        <div className="form-group">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="disableNotification"
              checked={formData.disableNotification === true}
              onChange={handleFormFieldChange}
              className="mr-2"
            />
            Send Silently
          </label>
          <div className="text-xs text-gray-500 mt-1">
            🔇 Users will receive notification without sound
          </div>
        </div>

        <div className="form-group">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="protectContent"
              checked={formData.protectContent === true}
              onChange={handleFormFieldChange}
              className="mr-2"
            />
            Protect Content
          </label>
          <div className="text-xs text-gray-500 mt-1">
            🛡️ Prevents forwarding and saving of the message
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-2">
          📤 This node will send the message to the specified chat using your bot
        </div>
      </>
    );
  }

  if (node.data.type === 'linkedin') {
    return (
      <>
        <NodeDescription nodeType="linkedin" />
        
        {/* LinkedIn Authentication Section */}
        <div className="form-group" style={{ 
          backgroundColor: '#0077B5', 
          color: 'white', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '16px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <i className="fa-brands fa-linkedin" style={{ fontSize: '16px' }}></i>
            <strong>LinkedIn Authentication</strong>
          </div>
          <div style={{ fontSize: '13px', opacity: '0.9' }}>
            Connect your LinkedIn account to post content, get profile data, and send messages.
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              type="button"
              onClick={() => {
                // Open LinkedIn OAuth popup
                const authUrl = '/api/linkedin/auth-url';
                fetch(authUrl, { method: 'POST' })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      const popup = window.open(data.authUrl, 'linkedin-auth', 'width=500,height=600');
                      // Handle OAuth callback (simplified for MVP)
                      const checkClosed = setInterval(() => {
                        if (popup.closed) {
                          clearInterval(checkClosed);
                          // In production, handle token exchange here
                          console.log('LinkedIn auth completed');
                        }
                      }, 1000);
                    }
                  });
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔗 Connect LinkedIn
            </button>
            <span style={{ fontSize: '12px', opacity: '0.8' }}>
              {formData.tokenData ? '✅ Connected' : '❌ Not connected'}
            </span>
          </div>
        </div>

        {/* Operation Selection */}
        <div className="form-group">
          <label>Operation</label>
          <select 
            name="operation" 
            value={formData.operation || 'getProfile'} 
            onChange={handleFormFieldChange}
            className="condition-input"
          >
            <option value="getProfile">Get Profile</option>
            <option value="getCompanies">Get Companies</option>
            <option value="postShare">Post Share</option>
            <option value="scheduleShare">Schedule Share</option>
            <option value="sendMessage">Send Message</option>
            <option value="getMessages">Get Messages</option>
            <option value="getAnalytics">Get Analytics</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Choose the LinkedIn operation to perform
          </div>
        </div>

        {/* Post Share Parameters */}
        {(formData.operation === 'postShare' || formData.operation === 'scheduleShare') && (
          <>
            <div className="form-group">
              <label>Author Type</label>
              <select 
                name="authorType" 
                value={formData.authorType || 'user'} 
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="user">Post as User</option>
                <option value="organization">Post as Organization</option>
              </select>
            </div>

            <div className="form-group">
              <label>Author URN</label>
              <DroppableTextInput
                type="text"
                name="authorURN"
                placeholder="urn:li:person:123456 or urn:li:organization:123456"
                value={formData.authorURN || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                LinkedIn URN for the author (user or organization)
              </div>
            </div>

            <div className="form-group">
              <label>Content Type</label>
              <select 
                name="contentType" 
                value={formData.contentType || 'text'} 
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="text">Text Only</option>
                <option value="link">Link</option>
                <option value="image">Image</option>
              </select>
            </div>

            <div className="form-group">
              <label>Post Text</label>
              <DroppableTextInput
                type="textarea"
                name="text"
                placeholder="What's on your mind? Use {{variables}} for dynamic content..."
                value={formData.text || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="4"
              />
            </div>

            {(formData.contentType === 'link' || formData.contentType === 'image') && (
              <>
                <div className="form-group">
                  <label>Media URL</label>
                  <DroppableTextInput
                    type="text"
                    name="mediaURL"
                    placeholder="https://example.com/image.jpg or https://example.com/article"
                    value={formData.mediaURL || ''}
                    onChange={handleFormFieldChange}
                    className="condition-input"
                    inputData={inputData}
                  />
                </div>

                <div className="form-group">
                  <label>Title</label>
                  <DroppableTextInput
                    type="text"
                    name="title"
                    placeholder="Title for the shared content"
                    value={formData.title || ''}
                    onChange={handleFormFieldChange}
                    className="condition-input"
                    inputData={inputData}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <DroppableTextInput
                    type="textarea"
                    name="description"
                    placeholder="Description for the shared content"
                    value={formData.description || ''}
                    onChange={handleFormFieldChange}
                    className="condition-input"
                    inputData={inputData}
                    rows="3"
                  />
                </div>
              </>
            )}

            {formData.operation === 'scheduleShare' && (
              <div className="form-group">
                <label>Schedule Time</label>
                <input
                  type="datetime-local"
                  name="scheduleTime"
                  value={formData.scheduleTime || ''}
                  onChange={handleFormFieldChange}
                  className="condition-input"
                />
                <div className="text-xs text-gray-500 mt-1">
                  When to publish this post
                </div>
              </div>
            )}
          </>
        )}

        {/* Send Message Parameters */}
        {formData.operation === 'sendMessage' && (
          <>
            <div className="form-group">
              <label>Recipient URN</label>
              <DroppableTextInput
                type="text"
                name="recipientURN"
                placeholder="urn:li:person:123456"
                value={formData.recipientURN || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                LinkedIn URN of the person to message
              </div>
            </div>

            <div className="form-group">
              <label>Subject (Optional)</label>
              <DroppableTextInput
                type="text"
                name="messageSubject"
                placeholder="Message subject"
                value={formData.messageSubject || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
            </div>

            <div className="form-group">
              <label>Message Body</label>
              <DroppableTextInput
                type="textarea"
                name="messageBody"
                placeholder="Your message content..."
                value={formData.messageBody || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="4"
              />
            </div>
          </>
        )}

        <div className="text-xs text-gray-500 mb-2">
          🔗 LinkedIn integration for professional social media automation
        </div>
      </>
    );
  }

  if (node.data.type === 'whatsapp') {
    return (
      <>
        <NodeDescription nodeType="whatsapp" />
        
        {/* WhatsApp API Configuration Section */}
        <div className="form-group" style={{ 
          backgroundColor: '#25D366', 
          color: 'white', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '16px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <i className="fa-brands fa-whatsapp" style={{ fontSize: '16px' }}></i>
            <strong>WhatsApp Business API</strong>
          </div>
          <div style={{ fontSize: '13px', opacity: '0.9' }}>
            Send messages, media, templates, and manage WhatsApp Business interactions using Meta Graph API.
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              type="button"
              onClick={async () => {
                try {
                  const response = await fetch('/api/whatsapp/verify-setup', { method: 'POST' });
                  const data = await response.json();
                  if (data.success) {
                    alert('✅ WhatsApp Business API verified successfully!');
                  } else {
                    alert('❌ Setup verification failed: ' + data.error);
                  }
                } catch (error) {
                  alert('❌ Verification failed: ' + error.message);
                }
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔍 Verify Setup
            </button>
            <span style={{ fontSize: '12px', opacity: '0.8' }}>
              Check API credentials and connectivity
            </span>
          </div>
        </div>

        {/* Operation Selection */}
        <div className="form-group">
          <label>Operation</label>
          <select 
            name="operation" 
            value={formData.operation || 'sendText'} 
            onChange={handleFormFieldChange}
            className="condition-input"
          >
            <optgroup label="Basic Messaging">
              <option value="sendText">Send Text Message</option>
              <option value="sendImage">Send Image</option>
              <option value="sendVideo">Send Video</option>
              <option value="sendDocument">Send Document</option>
              <option value="sendAudio">Send Audio</option>
            </optgroup>
            <optgroup label="Interactive Messages">
              <option value="sendButtons">Send Button Message</option>
              <option value="sendList">Send List Message</option>
              <option value="sendTemplate">Send Template Message</option>
            </optgroup>
            <optgroup label="Location & Contacts">
              <option value="sendLocation">Send Location</option>
              <option value="sendContact">Send Contact</option>
              <option value="getContact">Get Contact Info</option>
            </optgroup>
            <optgroup label="Business Management">
              <option value="getBusinessProfile">Get Business Profile</option>
              <option value="updateBusinessProfile">Update Business Profile</option>
              <option value="getTemplates">Get Message Templates</option>
            </optgroup>
            <optgroup label="Media & Status">
              <option value="uploadMedia">Upload Media</option>
              <option value="downloadMedia">Download Media</option>
              <option value="markRead">Mark Message as Read</option>
            </optgroup>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Choose the WhatsApp operation to perform
          </div>
        </div>

        {/* Phone Number Field (for most operations) */}
        {!['getBusinessProfile', 'updateBusinessProfile', 'getTemplates', 'uploadMedia'].includes(formData.operation) && (
          <div className="form-group">
            <label>Phone Number</label>
            <DroppableTextInput
              type="text"
              name="to"
              placeholder="1234567890 or +1234567890"
              value={formData.to || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              Recipient's phone number (with or without country code)
            </div>
          </div>
        )}

        {/* Text Message Parameters */}
        {formData.operation === 'sendText' && (
          <>
            <div className="form-group">
              <label>Message Text</label>
              <DroppableTextInput
                type="textarea"
                name="text"
                placeholder="Your message text... Use {{variables}} for dynamic content"
                value={formData.text || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="4"
              />
            </div>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  name="previewUrl"
                  checked={formData.previewUrl || false}
                  onChange={(e) => handleFormFieldChange({
                    target: { name: 'previewUrl', value: e.target.checked }
                  })}
                />
                Preview URLs in message
              </label>
              <div className="text-xs text-gray-500 mt-1">
                Show URL previews for links in the message
              </div>
            </div>
          </>
        )}

        {/* Media Message Parameters */}
        {['sendImage', 'sendVideo', 'sendDocument', 'sendAudio'].includes(formData.operation) && (
          <>
            <div className="form-group">
              <label>Media Source</label>
              <select 
                name="mediaSource" 
                value={formData.mediaSource || 'url'} 
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="url">Media URL</option>
                <option value="id">Media ID (uploaded)</option>
              </select>
            </div>

            {formData.mediaSource === 'url' ? (
              <div className="form-group">
                <label>Media URL</label>
                <DroppableTextInput
                  type="text"
                  name="mediaUrl"
                  placeholder={`https://example.com/${formData.operation?.replace('send', '').toLowerCase()}.${
                    formData.operation === 'sendImage' ? 'jpg' :
                    formData.operation === 'sendVideo' ? 'mp4' :
                    formData.operation === 'sendAudio' ? 'mp3' : 'pdf'
                  }`}
                  value={formData.mediaUrl || ''}
                  onChange={handleFormFieldChange}
                  className="condition-input"
                  inputData={inputData}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Direct URL to the media file
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>Media ID</label>
                <DroppableTextInput
                  type="text"
                  name="mediaId"
                  placeholder="Media ID from WhatsApp upload"
                  value={formData.mediaId || ''}
                  onChange={handleFormFieldChange}
                  className="condition-input"
                  inputData={inputData}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Media ID obtained from WhatsApp media upload
                </div>
              </div>
            )}

            {formData.operation === 'sendDocument' && (
              <div className="form-group">
                <label>Filename (Optional)</label>
                <DroppableTextInput
                  type="text"
                  name="filename"
                  placeholder="document.pdf"
                  value={formData.filename || ''}
                  onChange={handleFormFieldChange}
                  className="condition-input"
                  inputData={inputData}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Display name for the document
                </div>
              </div>
            )}

            {['sendImage', 'sendVideo', 'sendDocument'].includes(formData.operation) && (
              <div className="form-group">
                <label>Caption (Optional)</label>
                <DroppableTextInput
                  type="textarea"
                  name="caption"
                  placeholder="Caption for the media..."
                  value={formData.caption || ''}
                  onChange={handleFormFieldChange}
                  className="condition-input"
                  inputData={inputData}
                  rows="3"
                />
              </div>
            )}
          </>
        )}

        {/* Template Message Parameters */}
        {formData.operation === 'sendTemplate' && (
          <>
            <div className="form-group">
              <label>Template Name</label>
              <DroppableTextInput
                type="text"
                name="templateName"
                placeholder="hello_world"
                value={formData.templateName || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                Name of the approved template message
              </div>
            </div>

            <div className="form-group">
              <label>Language Code</label>
              <select 
                name="languageCode" 
                value={formData.languageCode || 'en'} 
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
                <option value="pt">Portuguese (pt)</option>
                <option value="ar">Arabic (ar)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Template Components (JSON)</label>
              <DroppableTextInput
                type="textarea"
                name="components"
                placeholder='[{"type": "body", "parameters": [{"type": "text", "text": "John"}]}]'
                value={formData.components || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="4"
              />
              <div className="text-xs text-gray-500 mt-1">
                Template parameter components in JSON format
              </div>
            </div>
          </>
        )}

        {/* Button Message Parameters */}
        {formData.operation === 'sendButtons' && (
          <>
            <div className="form-group">
              <label>Header Text (Optional)</label>
              <DroppableTextInput
                type="text"
                name="headerText"
                placeholder="Header text"
                value={formData.headerText || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
            </div>

            <div className="form-group">
              <label>Body Text</label>
              <DroppableTextInput
                type="textarea"
                name="bodyText"
                placeholder="Main message body text..."
                value={formData.bodyText || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Footer Text (Optional)</label>
              <DroppableTextInput
                type="text"
                name="footerText"
                placeholder="Footer text"
                value={formData.footerText || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
            </div>

            <div className="form-group">
              <label>Buttons (JSON Array)</label>
              <DroppableTextInput
                type="textarea"
                name="buttons"
                placeholder='[{"id": "btn1", "title": "Option 1"}, {"id": "btn2", "title": "Option 2"}]'
                value={formData.buttons || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="4"
              />
              <div className="text-xs text-gray-500 mt-1">
                Array of button objects (max 3 buttons)
              </div>
            </div>
          </>
        )}

        {/* List Message Parameters */}
        {formData.operation === 'sendList' && (
          <>
            <div className="form-group">
              <label>Header Text (Optional)</label>
              <DroppableTextInput
                type="text"
                name="headerText"
                placeholder="Header text"
                value={formData.headerText || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
            </div>

            <div className="form-group">
              <label>Body Text</label>
              <DroppableTextInput
                type="textarea"
                name="bodyText"
                placeholder="Main message body text..."
                value={formData.bodyText || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Button Text</label>
              <DroppableTextInput
                type="text"
                name="buttonText"
                placeholder="View Options"
                value={formData.buttonText || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
            </div>

            <div className="form-group">
              <label>Footer Text (Optional)</label>
              <DroppableTextInput
                type="text"
                name="footerText"
                placeholder="Footer text"
                value={formData.footerText || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
            </div>

            <div className="form-group">
              <label>Sections (JSON Array)</label>
              <DroppableTextInput
                type="textarea"
                name="sections"
                placeholder='[{"title": "Section 1", "rows": [{"id": "row1", "title": "Row 1", "description": "Description 1"}]}]'
                value={formData.sections || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="6"
              />
              <div className="text-xs text-gray-500 mt-1">
                Array of section objects with rows
              </div>
            </div>
          </>
        )}

        {/* Location Message Parameters */}
        {formData.operation === 'sendLocation' && (
          <>
            <div className="form-group">
              <label>Latitude</label>
              <DroppableTextInput
                type="number"
                name="latitude"
                placeholder="37.7749"
                value={formData.latitude || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                step="any"
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <DroppableTextInput
                type="number"
                name="longitude"
                placeholder="-122.4194"
                value={formData.longitude || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                step="any"
              />
            </div>

            <div className="form-group">
              <label>Location Name (Optional)</label>
              <DroppableTextInput
                type="text"
                name="locationName"
                placeholder="San Francisco"
                value={formData.locationName || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
            </div>

            <div className="form-group">
              <label>Address (Optional)</label>
              <DroppableTextInput
                type="text"
                name="locationAddress"
                placeholder="123 Main St, San Francisco, CA"
                value={formData.locationAddress || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
            </div>
          </>
        )}

        {/* Contact Message Parameters */}
        {formData.operation === 'sendContact' && (
          <div className="form-group">
            <label>Contacts (JSON Array)</label>
            <DroppableTextInput
              type="textarea"
              name="contacts"
              placeholder='[{"name": {"formatted_name": "John Doe", "first_name": "John"}, "phones": [{"phone": "+1234567890", "type": "MOBILE"}]}]'
              value={formData.contacts || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
              rows="6"
            />
            <div className="text-xs text-gray-500 mt-1">
              Array of contact objects with name and phone information
            </div>
          </div>
        )}

        {/* Get Contact Parameters */}
        {formData.operation === 'getContact' && (
          <div className="form-group">
            <label>Phone Number</label>
            <DroppableTextInput
              type="text"
              name="phoneNumber"
              placeholder="1234567890"
              value={formData.phoneNumber || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              Phone number to get contact information for
            </div>
          </div>
        )}

        {/* Business Profile Parameters */}
        {formData.operation === 'updateBusinessProfile' && (
          <div className="form-group">
            <label>Profile Data (JSON)</label>
            <DroppableTextInput
              type="textarea"
              name="profileData"
              placeholder='{"about": "We are a business", "description": "Business description", "email": "contact@business.com"}'
              value={formData.profileData || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
              rows="4"
            />
            <div className="text-xs text-gray-500 mt-1">
              Business profile data in JSON format
            </div>
          </div>
        )}

        {/* Mark Read Parameters */}
        {formData.operation === 'markRead' && (
          <div className="form-group">
            <label>Message ID</label>
            <DroppableTextInput
              type="text"
              name="messageId"
              placeholder="wamid.XXX"
              value={formData.messageId || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              WhatsApp message ID to mark as read
            </div>
          </div>
        )}

        {/* Download Media Parameters */}
        {formData.operation === 'downloadMedia' && (
          <div className="form-group">
            <label>Media ID</label>
            <DroppableTextInput
              type="text"
              name="mediaId"
              placeholder="Media ID from WhatsApp"
              value={formData.mediaId || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              Media ID to download from WhatsApp servers
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mb-2">
          📱 WhatsApp Business API integration for comprehensive messaging automation
        </div>
      </>
    );
  }

  if (node.data.type === 'instagram') {
    return (
      <>
        <NodeDescription nodeType="instagram" />
        
        {/* Instagram API Configuration Section */}
        <div className="form-group" style={{ 
          background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
          color: 'white', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '16px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <i className="fa-brands fa-instagram" style={{ fontSize: '16px' }}></i>
            <strong>Instagram Business API</strong>
          </div>
          <div style={{ fontSize: '13px', opacity: '0.9' }}>
            Publish content, manage interactions, stories, and analyze Instagram performance using Meta Graph API.
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              type="button"
              onClick={async () => {
                try {
                  const response = await fetch('/api/instagram/verify-setup', { method: 'POST' });
                  const data = await response.json();
                  if (data.success) {
                    alert('✅ Instagram Business API verified successfully!');
                  } else {
                    alert('❌ Setup verification failed: ' + data.error);
                  }
                } catch (error) {
                  alert('❌ Verification failed: ' + error.message);
                }
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔍 Verify Setup
            </button>
            <span style={{ fontSize: '12px', opacity: '0.8' }}>
              Check API credentials and connectivity
            </span>
          </div>
        </div>

        {/* Operation Selection */}
        <div className="form-group">
          <label>Operation</label>
          <select 
            name="operation" 
            value={formData.operation || 'publishPhoto'} 
            onChange={handleFormFieldChange}
            className="condition-input"
          >
            <optgroup label="Content Publishing">
              <option value="publishPhoto">Publish Photo</option>
              <option value="publishVideo">Publish Video/Reel</option>
              <option value="publishCarousel">Publish Carousel</option>
              <option value="createStory">Create Story</option>
            </optgroup>
            <optgroup label="Account Management">
              <option value="getAccountInfo">Get Account Info</option>
              <option value="getMedia">Get Account Media</option>
              <option value="getMediaDetails">Get Media Details</option>
              <option value="updateCaption">Update Media Caption</option>
              <option value="deleteMedia">Delete Media</option>
            </optgroup>
            <optgroup label="Comments & Interactions">
              <option value="getMediaComments">Get Media Comments</option>
              <option value="replyToComment">Reply to Comment</option>
              <option value="deleteComment">Delete Comment</option>
              <option value="hideComment">Hide/Unhide Comment</option>
              <option value="getMentions">Get Mentions</option>
              <option value="getTaggedMedia">Get Tagged Media</option>
            </optgroup>
            <optgroup label="Analytics & Insights">
              <option value="getAccountInsights">Get Account Insights</option>
              <option value="getMediaInsights">Get Media Insights</option>
            </optgroup>
            <optgroup label="Hashtag Research">
              <option value="searchHashtags">Search Hashtags</option>
              <option value="getHashtagMedia">Get Hashtag Media</option>
            </optgroup>
            <optgroup label="Direct Messaging">
              <option value="sendDirectMessage">Send Direct Message</option>
              <option value="getDirectMessages">Get Direct Messages</option>
            </optgroup>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Choose the Instagram operation to perform
          </div>
        </div>

        {/* Photo Publishing Parameters */}
        {formData.operation === 'publishPhoto' && (
          <>
            <div className="form-group">
              <label>Photo URL</label>
              <DroppableTextInput
                type="text"
                name="mediaUrl"
                placeholder="https://example.com/photo.jpg"
                value={formData.mediaUrl || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                Direct URL to the image file (JPEG, PNG, WebP)
              </div>
            </div>

            <div className="form-group">
              <label>Caption (Optional)</label>
              <DroppableTextInput
                type="textarea"
                name="caption"
                placeholder="Your photo caption... Use hashtags and mentions! #instagram"
                value={formData.caption || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="4"
              />
              <div className="text-xs text-gray-500 mt-1">
                Caption text with hashtags and mentions
              </div>
            </div>

            <div className="form-group">
              <label>Location ID (Optional)</label>
              <DroppableTextInput
                type="text"
                name="locationId"
                placeholder="Location ID from Instagram"
                value={formData.locationId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                Instagram location ID for geo-tagging
              </div>
            </div>
          </>
        )}

        {/* Video Publishing Parameters */}
        {formData.operation === 'publishVideo' && (
          <>
            <div className="form-group">
              <label>Video URL</label>
              <DroppableTextInput
                type="text"
                name="mediaUrl"
                placeholder="https://example.com/video.mp4"
                value={formData.mediaUrl || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                Direct URL to the video file (MP4, MOV)
              </div>
            </div>

            <div className="form-group">
              <label>Video Type</label>
              <select 
                name="mediaType" 
                value={formData.mediaType || 'VIDEO'} 
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="VIDEO">Regular Video</option>
                <option value="REELS">Instagram Reel</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Choose between regular video post or Reel
              </div>
            </div>

            <div className="form-group">
              <label>Caption (Optional)</label>
              <DroppableTextInput
                type="textarea"
                name="caption"
                placeholder="Your video caption... Use hashtags and mentions! #reels #video"
                value={formData.caption || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Location ID (Optional)</label>
              <DroppableTextInput
                type="text"
                name="locationId"
                placeholder="Location ID from Instagram"
                value={formData.locationId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
            </div>
          </>
        )}

        {/* Carousel Publishing Parameters */}
        {formData.operation === 'publishCarousel' && (
          <>
            <div className="form-group">
              <label>Media Items (JSON Array)</label>
              <DroppableTextInput
                type="textarea"
                name="mediaItems"
                placeholder='[{"mediaUrl": "https://example.com/photo1.jpg", "mediaType": "IMAGE"}, {"mediaUrl": "https://example.com/photo2.jpg", "mediaType": "IMAGE"}]'
                value={formData.mediaItems || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="6"
              />
              <div className="text-xs text-gray-500 mt-1">
                Array of media objects (2-10 items). Each with mediaUrl and mediaType (IMAGE/VIDEO)
              </div>
            </div>

            <div className="form-group">
              <label>Caption (Optional)</label>
              <DroppableTextInput
                type="textarea"
                name="caption"
                placeholder="Your carousel caption... Swipe to see more! ➡️"
                value={formData.caption || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="4"
              />
            </div>
          </>
        )}

        {/* Story Creation Parameters */}
        {formData.operation === 'createStory' && (
          <>
            <div className="form-group">
              <label>Media URL</label>
              <DroppableTextInput
                type="text"
                name="mediaUrl"
                placeholder="https://example.com/story.jpg"
                value={formData.mediaUrl || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                Direct URL to the story media file
              </div>
            </div>

            <div className="form-group">
              <label>Media Type</label>
              <select 
                name="mediaType" 
                value={formData.mediaType || 'IMAGE'} 
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="IMAGE">Photo Story</option>
                <option value="VIDEO">Video Story</option>
              </select>
            </div>
          </>
        )}

        {/* Media Details Parameters */}
        {['getMediaDetails', 'getMediaComments', 'updateCaption', 'deleteMedia', 'getMediaInsights'].includes(formData.operation) && (
          <div className="form-group">
            <label>Media ID</label>
            <DroppableTextInput
              type="text"
              name="mediaId"
              placeholder="Instagram media ID"
              value={formData.mediaId || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              Instagram media ID from previous operations or API calls
            </div>
          </div>
        )}

        {/* Update Caption Parameters */}
        {formData.operation === 'updateCaption' && (
          <div className="form-group">
            <label>New Caption</label>
            <DroppableTextInput
              type="textarea"
              name="newCaption"
              placeholder="Updated caption text..."
              value={formData.newCaption || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
              rows="4"
            />
            <div className="text-xs text-gray-500 mt-1">
              New caption text to replace the existing one
            </div>
          </div>
        )}

        {/* Comment Management Parameters */}
        {['replyToComment', 'deleteComment', 'hideComment'].includes(formData.operation) && (
          <div className="form-group">
            <label>Comment ID</label>
            <DroppableTextInput
              type="text"
              name="commentId"
              placeholder="Instagram comment ID"
              value={formData.commentId || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              Instagram comment ID from webhook or API response
            </div>
          </div>
        )}

        {/* Reply to Comment Parameters */}
        {formData.operation === 'replyToComment' && (
          <div className="form-group">
            <label>Reply Message</label>
            <DroppableTextInput
              type="textarea"
              name="message"
              placeholder="Your reply message..."
              value={formData.message || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
              rows="3"
            />
          </div>
        )}

        {/* Hide Comment Parameters */}
        {formData.operation === 'hideComment' && (
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="hide"
                checked={formData.hide !== false}
                onChange={(e) => handleFormFieldChange({
                  target: { name: 'hide', value: e.target.checked }
                })}
              />
              Hide comment (uncheck to unhide)
            </label>
            <div className="text-xs text-gray-500 mt-1">
              Hide or unhide the comment from public view
            </div>
          </div>
        )}

        {/* Account Insights Parameters */}
        {formData.operation === 'getAccountInsights' && (
          <>
            <div className="form-group">
              <label>Metrics</label>
              <DroppableTextInput
                type="text"
                name="metrics"
                placeholder="impressions,reach,profile_views,follower_count"
                value={formData.metrics || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                Comma-separated list of metrics to retrieve
              </div>
            </div>

            <div className="form-group">
              <label>Period</label>
              <select 
                name="period" 
                value={formData.period || 'day'} 
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="days_28">28 Days</option>
              </select>
            </div>

            <div className="form-group">
              <label>Since Date (Optional)</label>
              <input
                type="date"
                name="since"
                value={formData.since || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
              />
            </div>

            <div className="form-group">
              <label>Until Date (Optional)</label>
              <input
                type="date"
                name="until"
                value={formData.until || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
              />
            </div>
          </>
        )}

        {/* Media Insights Parameters */}
        {formData.operation === 'getMediaInsights' && (
          <div className="form-group">
            <label>Metrics</label>
            <DroppableTextInput
              type="text"
              name="metrics"
              placeholder="impressions,reach,engagement,likes,comments,saves"
              value={formData.metrics || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              Comma-separated list of media metrics to retrieve
            </div>
          </div>
        )}

        {/* Hashtag Search Parameters */}
        {formData.operation === 'searchHashtags' && (
          <div className="form-group">
            <label>Hashtag Query</label>
            <DroppableTextInput
              type="text"
              name="hashtag"
              placeholder="travel"
              value={formData.hashtag || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              Hashtag to search for (without #)
            </div>
          </div>
        )}

        {/* Hashtag Media Parameters */}
        {formData.operation === 'getHashtagMedia' && (
          <>
            <div className="form-group">
              <label>Hashtag ID</label>
              <DroppableTextInput
                type="text"
                name="hashtagId"
                placeholder="Hashtag ID from search results"
                value={formData.hashtagId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                Hashtag ID obtained from hashtag search
              </div>
            </div>

            <div className="form-group">
              <label>Media Type</label>
              <select 
                name="mediaType" 
                value={formData.mediaType || 'recent'} 
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="recent">Recent Media</option>
                <option value="top">Top Media</option>
              </select>
            </div>

            <div className="form-group">
              <label>Limit</label>
              <input
                type="number"
                name="limit"
                min="1"
                max="50"
                value={formData.limit || 25}
                onChange={handleFormFieldChange}
                className="condition-input"
              />
              <div className="text-xs text-gray-500 mt-1">
                Number of media items to retrieve (1-50)
              </div>
            </div>
          </>
        )}

        {/* Direct Message Parameters */}
        {formData.operation === 'sendDirectMessage' && (
          <>
            <div className="form-group">
              <label>Recipient ID</label>
              <DroppableTextInput
                type="text"
                name="recipientId"
                placeholder="Instagram user ID"
                value={formData.recipientId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                Instagram user ID of the message recipient
              </div>
            </div>

            <div className="form-group">
              <label>Message Text</label>
              <DroppableTextInput
                type="textarea"
                name="messageText"
                placeholder="Your direct message..."
                value={formData.messageText || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Media ID (Optional)</label>
              <DroppableTextInput
                type="text"
                name="mediaId"
                placeholder="Media ID to send as attachment"
                value={formData.mediaId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                Optional: Send media as attachment instead of text
              </div>
            </div>
          </>
        )}

        {/* Get Media Parameters */}
        {formData.operation === 'getMedia' && (
          <div className="form-group">
            <label>Limit</label>
            <input
              type="number"
              name="limit"
              min="1"
              max="100"
              value={formData.limit || 25}
              onChange={handleFormFieldChange}
              className="condition-input"
            />
            <div className="text-xs text-gray-500 mt-1">
              Number of media items to retrieve (1-100)
            </div>
          </div>
        )}

        {/* Get Tagged Media Parameters */}
        {formData.operation === 'getTaggedMedia' && (
          <div className="form-group">
            <label>Limit</label>
            <input
              type="number"
              name="limit"
              min="1"
              max="100"
              value={formData.limit || 25}
              onChange={handleFormFieldChange}
              className="condition-input"
            />
            <div className="text-xs text-gray-500 mt-1">
              Number of tagged media items to retrieve (1-100)
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mb-2">
          📸 Instagram Business API integration for comprehensive social media automation
        </div>
      </>
    );
  }

  if (node.data.type === 'fileConverter') {
    return (
      <>
        <NodeDescription nodeType="file_converter" />
        
        <div className="form-group">
          <label>Input Type</label>
          <select 
            name="inputType" 
            value={formData.inputType || 'google_drive'} 
            onChange={handleFormFieldChange} 
            className="condition-input"
          >
            <option value="telegram_file_id">🤖 Telegram file_id</option>
            <option value="google_drive">📁 Google Drive URL</option>
            <option value="base64">🔢 Base64 Data</option>
            <option value="direct_url">🌐 Direct URL (needs proxy)</option>
            <option value="onedrive">☁️ OneDrive/SharePoint URL</option>
            <option value="dropbox">📦 Dropbox URL</option>
            <option value="local_file">💾 Local File Path</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            💡 Choose your file source type
          </div>
        </div>

        {/* Telegram file_id Fields */}
        {(formData.inputType || 'google_drive') === 'telegram_file_id' && (
          <>
            <div className="form-group">
              <label>Telegram Bot Token</label>
              <DroppableTextInput
                type="password"
                name="telegramBotToken"
                value={formData.telegramBotToken || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                🤖 Bot token for accessing Telegram files
              </div>
            </div>
            
            <div className="form-group">
              <label>Telegram file_id</label>
              <DroppableTextInput
                type="text"
                name="telegramFileId"
                value={formData.telegramFileId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="BAADBAADBgADBREAAR4BAAFXvv0lAg"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                📁 file_id from received Telegram media (photos, videos, documents, etc.)
              </div>
            </div>
          </>
        )}

        {/* Google Drive Fields */}
        {(formData.inputType || 'google_drive') === 'google_drive' && (
          <div className="form-group">
            <label>Google Drive URL or File ID</label>
            <DroppableTextInput
              type="text"
              name="googleDriveUrl"
              value={formData.googleDriveUrl || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              placeholder="https://drive.google.com/file/d/1ABC123.../view or 1ABC123..."
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              📁 Google Drive sharing URL or just the file ID
            </div>
          </div>
        )}

        {/* Base64 Fields */}
        {formData.inputType === 'base64' && (
          <>
            <div className="form-group">
              <label>Base64 Data</label>
              <DroppableTextInput
                type="textarea"
                name="base64Data"
                value={formData.base64Data || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ... or just the base64 string"
                inputData={inputData}
                rows={4}
              />
              <div className="text-xs text-gray-500 mt-1">
                🔢 Base64 encoded file data (with or without data URL prefix)
              </div>
            </div>
            
            <div className="form-group">
              <label>File Extension</label>
              <DroppableTextInput
                type="text"
                name="fileExtension"
                value={formData.fileExtension || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="jpg, png, mp4, pdf, etc."
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                📄 File extension to determine file type
              </div>
            </div>
          </>
        )}

        {/* URL Fields */}
        {(formData.inputType === 'direct_url' || 
          formData.inputType === 'onedrive' || 
          formData.inputType === 'dropbox') && (
          <div className="form-group">
            <label>File URL</label>
            <DroppableTextInput
              type="text"
              name="fileUrl"
              value={formData.fileUrl || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              placeholder="https://example.com/file.jpg or https://1drv.ms/..."
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              🌐 Direct URL to the file that needs proxying
            </div>
          </div>
        )}

        {/* Local File Fields */}
        {formData.inputType === 'local_file' && (
          <div className="form-group">
            <label>Local File Path</label>
            <DroppableTextInput
              type="text"
              name="localFilePath"
              value={formData.localFilePath || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              placeholder="/tmp/uploads/image.jpg"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              💾 Path to file on the server
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Output Format</label>
          <select 
            name="outputFormat" 
            value={formData.outputFormat || 'original'} 
            onChange={handleFormFieldChange} 
            className="condition-input"
          >
            <option value="original">📋 Keep Original</option>
            <option value="jpg">🖼️ Convert to JPG</option>
            <option value="png">🖼️ Convert to PNG</option>
            <option value="webp">🖼️ Convert to WebP</option>
            <option value="mp4">🎥 Convert to MP4</option>
            <option value="pdf">📄 Convert to PDF</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            🔄 File format conversion (requires conversion service)
          </div>
        </div>

        <div className="form-group">
          <label>Hosting Service</label>
          <select 
            name="hostingService" 
            value={formData.hostingService || 'temp_server'} 
            onChange={handleFormFieldChange} 
            className="condition-input"
          >
            <option value="temp_server">⏱️ Temporary File Server</option>
            <option value="imgbb">🖼️ ImgBB (Images only)</option>
            <option value="imgur">🖼️ Imgur (Images only)</option>
            <option value="fileio">📁 File.io (Temporary)</option>
            <option value="telegraph">📸 Telegraph (Images only)</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            ☁️ Service to host the converted file
          </div>
        </div>

        {/* API Key Fields */}
        {formData.hostingService === 'imgbb' && (
          <div className="form-group">
            <label>ImgBB API Key</label>
            <input
              type="password"
              name="imgbbApiKey"
              value={formData.imgbbApiKey || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              placeholder="Get from https://api.imgbb.com/"
            />
            <div className="text-xs text-gray-500 mt-1">
              🔑 Free API key from ImgBB (sign up required)
            </div>
          </div>
        )}

        {formData.hostingService === 'imgur' && (
          <div className="form-group">
            <label>Imgur Client ID</label>
            <input
              type="password"
              name="imgurClientId"
              value={formData.imgurClientId || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              placeholder="Get from https://api.imgur.com/"
            />
            <div className="text-xs text-gray-500 mt-1">
              🔑 Free Client ID from Imgur (app registration required)
            </div>
          </div>
        )}

        {/* Advanced Options */}
        {formData.outputFormat === 'jpg' && (
          <div className="form-group">
            <label>Image Quality (1-100)</label>
            <input
              type="number"
              name="imageQuality"
              value={formData.imageQuality || 85}
              onChange={handleFormFieldChange}
              className="condition-input"
              min="1"
              max="100"
            />
            <div className="text-xs text-gray-500 mt-1">
              📊 JPEG compression quality (higher = better quality, larger file)
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Max File Size (MB)</label>
          <input
            type="number"
            name="maxFileSizeMB"
            value={formData.maxFileSizeMB || 50}
            onChange={handleFormFieldChange}
            className="condition-input"
            min="1"
            max="50"
          />
          <div className="text-xs text-gray-500 mt-1">
            📏 Maximum file size (Telegram limit: 50MB for bots)
          </div>
        </div>

        <div className="form-group">
          <label>Cache Duration (hours)</label>
          <input
            type="number"
            name="cacheDurationHours"
            value={formData.cacheDurationHours || 24}
            onChange={handleFormFieldChange}
            className="condition-input"
            min="1"
            max="168"
          />
          <div className="text-xs text-gray-500 mt-1">
            ⏰ How long to keep the file accessible (1-168 hours)
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-2">
          🔄 This node converts files from various sources to Telegram-compatible URLs
        </div>
      </>
    );
  }

  // TIKTOK NODE - Comprehensive TikTok Business API Integration
  if (node.data.type === 'tiktok') {
    return (
      <>
        <NodeDescription nodeType="tiktok" />
        {/* TikTok API Configuration Section */}
        <div className="info-box" style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #333333 100%)', 
          border: '1px solid #666666', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '16px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <i className="fa-brands fa-tiktok" style={{ fontSize: '16px', marginRight: '8px' }}></i>
            <strong>TikTok Business API</strong>
          </div>
          Upload videos, publish content, get analytics, and manage TikTok business account using official TikTok API.
          <div style={{ marginTop: '8px', fontSize: '12px', opacity: '0.9' }}>
            <button 
              type="button"
              onClick={async () => {
                try {
                  const response = await fetch('/api/tiktok/verify-setup', { method: 'POST' });
                  if (response.ok) {
                    alert('✅ TikTok Business API verified successfully!');
                  } else {
                    const error = await response.json();
                    alert('❌ TikTok API Error: ' + error.error);
                  }
                } catch (error) {
                  alert('❌ Connection Error: ' + error.message);
                }
              }}
              style={{ 
                background: '#ffffff', 
                color: '#000000', 
                border: 'none', 
                padding: '4px 8px', 
                borderRadius: '3px', 
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              🔧 Test Connection
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label>TikTok Operation</label>
          <select
            name="operation"
            value={formData.operation || 'publishVideo'}
            onChange={handleFormFieldChange}
            className="condition-input"
          >
            <optgroup label="📹 Video Operations">
              <option value="publishVideo">Publish Video</option>
              <option value="publishPhotoPost">Publish Photo Post</option>
              <option value="getPostStatus">Get Post Status</option>
              <option value="getUserVideos">Get User Videos</option>
            </optgroup>
            <optgroup label="👤 User & Creator">
              <option value="getUserInfo">Get User Info</option>
              <option value="getCreatorInfo">Get Creator Info</option>
              <option value="getBusinessAccountInfo">Get Business Account Info</option>
            </optgroup>
            <optgroup label="📊 Analytics">
              <option value="getVideoAnalytics">Get Video Analytics</option>
              <option value="getUserAnalytics">Get User Analytics</option>
            </optgroup>
            <optgroup label="🔍 Search & Discovery">
              <option value="getHashtagSuggestions">Get Hashtag Suggestions</option>
              <option value="searchVideosByHashtag">Search Videos by Hashtag</option>
            </optgroup>
            <optgroup label="💬 Comments">
              <option value="getVideoComments">Get Video Comments</option>
              <option value="replyToComment">Reply to Comment</option>
            </optgroup>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Choose the TikTok operation to perform
          </div>
        </div>

        {/* Video Publishing Fields */}
        {formData.operation === 'publishVideo' && (
          <>
            <div className="form-group">
              <label>Video Title</label>
              <DroppableTextInput
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="My awesome TikTok video! 🎵"
                inputData={inputData}
              />
            </div>
            
            <div className="form-group">
              <label>Video Description</label>
              <DroppableTextInput
                as="textarea"
                name="description"
                value={formData.description || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                rows="3"
                placeholder="Check out this amazing content! #fyp #viral #trending"
                inputData={inputData}
              />
            </div>
            
            <div className="form-group">
              <label>Upload Method</label>
              <select
                name="uploadMethod"
                value={formData.uploadMethod || 'url'}
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="url">Video URL (Direct Post)</option>
                <option value="file">File Upload (Initialize Upload)</option>
              </select>
            </div>
            
            {formData.uploadMethod === 'url' && (
              <div className="form-group">
                <label>Video URL</label>
                <DroppableTextInput
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl || ''}
                  onChange={handleFormFieldChange}
                  className="condition-input"
                  placeholder="https://example.com/video.mp4"
                  inputData={inputData}
                />
                <div className="text-xs text-gray-500 mt-1">
                  🔗 HTTPS URL to video file (must be publicly accessible)
                </div>
              </div>
            )}
            
            {formData.uploadMethod === 'file' && (
              <>
                <div className="form-group">
                  <label>Video Size (bytes)</label>
                  <DroppableTextInput
                    type="number"
                    name="videoSize"
                    value={formData.videoSize || ''}
                    onChange={handleFormFieldChange}
                    className="condition-input"
                    placeholder="52428800"
                    inputData={inputData}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    📏 Size of video file in bytes (max 274MB for TikTok)
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Chunk Size (bytes)</label>
                  <input
                    type="number"
                    name="chunkSize"
                    value={formData.chunkSize || 10485760}
                    onChange={handleFormFieldChange}
                    className="condition-input"
                    min="5242880"
                    max="67108864"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    🔧 Upload chunk size (5MB-64MB, default: 10MB)
                  </div>
                </div>
              </>
            )}
            
            <div className="form-group">
              <label>Privacy Level</label>
              <select
                name="privacyLevel"
                value={formData.privacyLevel || 'PUBLIC_TO_EVERYONE'}
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="PUBLIC_TO_EVERYONE">Public to Everyone</option>
                <option value="MUTUAL_FOLLOW_FRIENDS">Friends Only</option>
                <option value="FOLLOWER_OF_CREATOR">Followers Only</option>
                <option value="SELF_ONLY">Private (Only Me)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Video Options</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="flex items-center toggle-label">
                  <input 
                    type="checkbox" 
                    className="toggle-switch"
                    checked={formData.disableDuet || false}
                    onChange={(e) => handleFormFieldChange({ target: { name: 'disableDuet', value: e.target.checked } })}
                  />
                  <span className="ml-2">Disable Duet</span>
                </label>
                <label className="flex items-center toggle-label">
                  <input 
                    type="checkbox" 
                    className="toggle-switch"
                    checked={formData.disableComment || false}
                    onChange={(e) => handleFormFieldChange({ target: { name: 'disableComment', value: e.target.checked } })}
                  />
                  <span className="ml-2">Disable Comments</span>
                </label>
                <label className="flex items-center toggle-label">
                  <input 
                    type="checkbox" 
                    className="toggle-switch"
                    checked={formData.disableStitch || false}
                    onChange={(e) => handleFormFieldChange({ target: { name: 'disableStitch', value: e.target.checked } })}
                  />
                  <span className="ml-2">Disable Stitch</span>
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Cover Timestamp (ms)</label>
              <input
                type="number"
                name="coverTimestamp"
                value={formData.coverTimestamp || 1000}
                onChange={handleFormFieldChange}
                className="condition-input"
                min="0"
              />
              <div className="text-xs text-gray-500 mt-1">
                🎬 Timestamp for video cover image (milliseconds from start)
              </div>
            </div>
          </>
        )}

        {/* Photo Post Fields */}
        {formData.operation === 'publishPhotoPost' && (
          <>
            <div className="form-group">
              <label>Post Title</label>
              <DroppableTextInput
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="My photo carousel! 📸"
                inputData={inputData}
              />
            </div>
            
            <div className="form-group">
              <label>Post Description</label>
              <DroppableTextInput
                as="textarea"
                name="description"
                value={formData.description || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                rows="3"
                placeholder="Check out these amazing photos! #photography #photocarousel"
                inputData={inputData}
              />
            </div>
            
            <div className="form-group">
              <label>Photo URLs (comma-separated)</label>
              <DroppableTextInput
                as="textarea"
                name="photoUrls"
                value={formData.photoUrls || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                rows="3"
                placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                📸 Up to 35 photo URLs separated by commas (max 50MB each)
              </div>
            </div>
            
            <div className="form-group">
              <label>Cover Photo Index</label>
              <input
                type="number"
                name="coverIndex"
                value={formData.coverIndex || 0}
                onChange={handleFormFieldChange}
                className="condition-input"
                min="0"
                max="34"
              />
              <div className="text-xs text-gray-500 mt-1">
                🖼️ Index of photo to use as cover (0-based)
              </div>
            </div>
            
            <div className="form-group">
              <label>Privacy Level</label>
              <select
                name="privacyLevel"
                value={formData.privacyLevel || 'PUBLIC_TO_EVERYONE'}
                onChange={handleFormFieldChange}
                className="condition-input"
              >
                <option value="PUBLIC_TO_EVERYONE">Public to Everyone</option>
                <option value="MUTUAL_FOLLOW_FRIENDS">Friends Only</option>
                <option value="FOLLOWER_OF_CREATOR">Followers Only</option>
                <option value="SELF_ONLY">Private (Only Me)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="flex items-center toggle-label">
                <input 
                  type="checkbox" 
                  className="toggle-switch"
                  checked={formData.disableComment || false}
                  onChange={(e) => handleFormFieldChange({ target: { name: 'disableComment', value: e.target.checked } })}
                />
                <span className="ml-2">Disable Comments</span>
              </label>
            </div>
          </>
        )}

        {/* Post Status Fields */}
        {formData.operation === 'getPostStatus' && (
          <div className="form-group">
            <label>Publish ID</label>
            <DroppableTextInput
              type="text"
              name="publishId"
              value={formData.publishId || ''}
              onChange={handleFormFieldChange}
              className="condition-input"
              placeholder="v_pub_12345678"
              inputData={inputData}
            />
            <div className="text-xs text-gray-500 mt-1">
              🆔 Publish ID returned from video upload initialization
            </div>
          </div>
        )}

        {/* User Videos Fields */}
        {formData.operation === 'getUserVideos' && (
          <>
            <div className="form-group">
              <label>Max Count</label>
              <input
                type="number"
                name="maxCount"
                value={formData.maxCount || 10}
                onChange={handleFormFieldChange}
                className="condition-input"
                min="1"
                max="20"
              />
              <div className="text-xs text-gray-500 mt-1">
                📊 Maximum number of videos to retrieve (1-20)
              </div>
            </div>
            
            <div className="form-group">
              <label>Cursor (Optional)</label>
              <DroppableTextInput
                type="text"
                name="cursor"
                value={formData.cursor || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="cursor_value_for_pagination"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                ➡️ Pagination cursor for getting more results
              </div>
            </div>
          </>
        )}

        {/* Video Analytics Fields */}
        {formData.operation === 'getVideoAnalytics' && (
          <>
            <div className="form-group">
              <label>Video IDs (comma-separated)</label>
              <DroppableTextInput
                type="text"
                name="videoIds"
                value={formData.videoIds || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="7123456789012345678, 7234567890123456789"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                🎥 TikTok video IDs separated by commas
              </div>
            </div>
            
            <div className="form-group">
              <label>Analytics Fields (comma-separated)</label>
              <input
                type="text"
                name="fields"
                value={formData.fields || 'like_count,comment_count,share_count,view_count'}
                onChange={handleFormFieldChange}
                className="condition-input"
              />
              <div className="text-xs text-gray-500 mt-1">
                📈 Fields: like_count, comment_count, share_count, view_count, duration
              </div>
            </div>
          </>
        )}

        {/* User Analytics Fields */}
        {formData.operation === 'getUserAnalytics' && (
          <div className="form-group">
            <label>Analytics Fields (comma-separated)</label>
            <input
              type="text"
              name="fields"
              value={formData.fields || 'follower_count,following_count,likes_count,video_count'}
              onChange={handleFormFieldChange}
              className="condition-input"
            />
            <div className="text-xs text-gray-500 mt-1">
              📊 Fields: follower_count, following_count, likes_count, video_count
            </div>
          </div>
        )}

        {/* Hashtag Suggestions Fields */}
        {formData.operation === 'getHashtagSuggestions' && (
          <>
            <div className="form-group">
              <label>Keywords</label>
              <DroppableTextInput
                type="text"
                name="keywords"
                value={formData.keywords || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="dance, music, trending"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                🏷️ Keywords to get hashtag suggestions for
              </div>
            </div>
            
            <div className="form-group">
              <label>Count</label>
              <input
                type="number"
                name="count"
                value={formData.count || 10}
                onChange={handleFormFieldChange}
                className="condition-input"
                min="1"
                max="50"
              />
              <div className="text-xs text-gray-500 mt-1">
                🔢 Number of hashtag suggestions to return
              </div>
            </div>
          </>
        )}

        {/* Search Videos by Hashtag Fields */}
        {formData.operation === 'searchVideosByHashtag' && (
          <>
            <div className="form-group">
              <label>Hashtag</label>
              <DroppableTextInput
                type="text"
                name="hashtag"
                value={formData.hashtag || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="fyp (without #)"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                #️⃣ Hashtag name (without the # symbol)
              </div>
            </div>
            
            <div className="form-group">
              <label>Count</label>
              <input
                type="number"
                name="count"
                value={formData.count || 10}
                onChange={handleFormFieldChange}
                className="condition-input"
                min="1"
                max="100"
              />
            </div>
            
            <div className="form-group">
              <label>Cursor (Optional)</label>
              <DroppableTextInput
                type="text"
                name="cursor"
                value={formData.cursor || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="cursor_value_for_pagination"
                inputData={inputData}
              />
            </div>
          </>
        )}

        {/* Video Comments Fields */}
        {formData.operation === 'getVideoComments' && (
          <>
            <div className="form-group">
              <label>Video ID</label>
              <DroppableTextInput
                type="text"
                name="videoId"
                value={formData.videoId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="7123456789012345678"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                🎥 TikTok video ID
              </div>
            </div>
            
            <div className="form-group">
              <label>Count</label>
              <input
                type="number"
                name="count"
                value={formData.count || 10}
                onChange={handleFormFieldChange}
                className="condition-input"
                min="1"
                max="50"
              />
            </div>
            
            <div className="form-group">
              <label>Cursor (Optional)</label>
              <DroppableTextInput
                type="text"
                name="cursor"
                value={formData.cursor || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="cursor_value_for_pagination"
                inputData={inputData}
              />
            </div>
          </>
        )}

        {/* Reply to Comment Fields */}
        {formData.operation === 'replyToComment' && (
          <>
            <div className="form-group">
              <label>Video ID</label>
              <DroppableTextInput
                type="text"
                name="videoId"
                value={formData.videoId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="7123456789012345678"
                inputData={inputData}
              />
            </div>
            
            <div className="form-group">
              <label>Comment ID</label>
              <DroppableTextInput
                type="text"
                name="commentId"
                value={formData.commentId || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                placeholder="comment_12345"
                inputData={inputData}
              />
              <div className="text-xs text-gray-500 mt-1">
                💬 TikTok comment ID to reply to
              </div>
            </div>
            
            <div className="form-group">
              <label>Reply Text</label>
              <DroppableTextInput
                as="textarea"
                name="replyText"
                value={formData.replyText || ''}
                onChange={handleFormFieldChange}
                className="condition-input"
                rows="3"
                placeholder="Thanks for watching! 🎵"
                inputData={inputData}
              />
            </div>
          </>
        )}

        <div className="text-xs text-gray-500 mb-2">
          🎵 TikTok Business API integration for comprehensive content automation
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