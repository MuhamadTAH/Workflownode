/*
=================================================================
FILE: frontend/src/components/configpanel/DragDropSystem.js
=================================================================
Drag & Drop System Components for ConfigPanel
- DraggableJSONField: Makes JSON fields draggable as template variables
- DroppableTextInput: Text inputs that accept dropped template variables
- Template processing utilities
*/
import React, { useState } from 'react';

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
export const DraggableJSONField = ({ path, value, level = 0, nodePrefix = '', dataType = 'generic', nodeName = '' }) => {
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
export const DroppableTextInput = ({ 
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
export const processTemplate = (template, data) => {
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
export const detectDataType = (data) => {
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