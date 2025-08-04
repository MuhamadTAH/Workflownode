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
                    handleFormFieldChange('conditions', newConditions);
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
                    handleFormFieldChange('conditions', newConditions);
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
                    handleFormFieldChange('conditions', newConditions);
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <button 
                onClick={() => {
                  const newConditions = formData.conditions.filter((_, i) => i !== index);
                  handleFormFieldChange('conditions', newConditions);
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
              handleFormFieldChange('conditions', newConditions);
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
            onChange={(e) => handleFormFieldChange('combinator', e.target.value)}
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
              onChange={(e) => handleFormFieldChange('ignoreCase', e.target.checked)}
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
                    handleFormFieldChange('conditions', newConditions);
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
                    handleFormFieldChange('conditions', newConditions);
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
                    handleFormFieldChange('conditions', newConditions);
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <button 
                onClick={() => {
                  const newConditions = formData.conditions.filter((_, i) => i !== index);
                  handleFormFieldChange('conditions', newConditions);
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
              handleFormFieldChange('conditions', newConditions);
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
            onChange={(e) => handleFormFieldChange('mode', e.target.value)}
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
              onChange={(e) => handleFormFieldChange('keyField', e.target.value)}
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
                    handleFormFieldChange('fields', newFields);
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
                    handleFormFieldChange('fields', newFields);
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <button 
                onClick={() => {
                  const newFields = formData.fields.filter((_, i) => i !== index);
                  handleFormFieldChange('fields', newFields);
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
              handleFormFieldChange('fields', newFields);
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
                    handleFormFieldChange('switchRules', newRules);
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
                    handleFormFieldChange('switchRules', newRules);
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
                    handleFormFieldChange('switchRules', newRules);
                  }}
                  className="condition-input"
                  inputData={inputData}
                />
              </div>
              <button 
                onClick={() => {
                  const newRules = formData.switchRules.filter((_, i) => i !== index);
                  handleFormFieldChange('switchRules', newRules);
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
              handleFormFieldChange('switchRules', newRules);
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
                  handleFormFieldChange('switchOptions', newOptions);
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
                  handleFormFieldChange('switchOptions', newOptions);
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
            onChange={(e) => handleFormFieldChange('resumeCondition', e.target.value)}
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
                  onChange={(e) => handleFormFieldChange('waitAmount', e.target.value)}
                  className="condition-input"
                  min="0"
                  step="0.1"
                />
                <select 
                  value={formData.waitUnit || 'seconds'}
                  onChange={(e) => handleFormFieldChange('waitUnit', e.target.value)}
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
              onChange={(e) => handleFormFieldChange('specificTime', e.target.value)}
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
            onChange={(e) => handleFormFieldChange('errorType', e.target.value)}
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
            onChange={(e) => handleFormFieldChange('errorMessage', e.target.value)}
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
            onChange={(e) => handleFormFieldChange('batchSize', parseInt(e.target.value) || 1)}
            className="condition-input"
            min="1"
          />
          <p className="field-description">Number of items to process in each batch</p>
        </div>
        
        <div className="form-group">
          <label>Loop Mode</label>
          <select 
            value={formData.loopMode || 'each_item'}
            onChange={(e) => handleFormFieldChange('loopMode', e.target.value)}
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
            onChange={(e) => handleFormFieldChange('keyField', e.target.value)}
            className="condition-input"
            inputData={inputData}
          />
          <p className="field-description">Field to use for comparing items (must exist in both datasets)</p>
        </div>
        
        <div className="form-group">
          <label>Comparison Mode</label>
          <select 
            value={formData.compareMode || 'full'}
            onChange={(e) => handleFormFieldChange('compareMode', e.target.value)}
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
                onChange={(e) => handleFormFieldChange('includeEqual', e.target.checked)}
              />
              <span className="ml-2">Include unchanged items in output</span>
            </label>
            <label className="flex items-center toggle-label">
              <input 
                type="checkbox" 
                className="toggle-switch"
                checked={formData.fuzzyCompare || false}
                onChange={(e) => handleFormFieldChange('fuzzyCompare', e.target.checked)}
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
            onChange={(e) => handleFormFieldChange('subWorkflowId', e.target.value)}
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
            onChange={(e) => handleFormFieldChange('inputMapping', e.target.value)}
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
                onChange={(e) => handleFormFieldChange('waitForCompletion', e.target.checked)}
              />
              <span className="ml-2">Wait for sub-workflow to complete</span>
            </label>
            <label className="flex items-center toggle-label">
              <input 
                type="checkbox" 
                className="toggle-switch"
                checked={formData.passThrough || false}
                onChange={(e) => handleFormFieldChange('passThrough', e.target.checked)}
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
            onChange={(e) => handleFormFieldChange('timeout', parseInt(e.target.value) || 30)}
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

  // Fallback for unknown node types
  return (
    <>
      <NodeDescription nodeType={node.data.type} />
      <p>Parameters for this node type are not implemented yet.</p>
    </>
  );
};