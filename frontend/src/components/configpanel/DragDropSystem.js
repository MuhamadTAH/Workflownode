
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
export const DraggableJSONField = ({ path, value, level = 0, nodePrefix = '', dataType = 'generic', nodeName = '', stepName = '' }) => {
  const handleDragStart = (e) => {
    // Generate template variable based on available context
    let templateVariable;
    
    if (stepName) {
      // Use step-based template for workflow chain data (stepName already has underscores)
      templateVariable = `{{${stepName}.${path}}}`;
    } else if (nodeName) {
      // Use n8n-style template if nodeName is provided
      templateVariable = `{{ $('${nodeName}').item.json.${path} }}`;
    } else {
      // Default to $json format
      templateVariable = `{{$json.${path}}}`;
    }
    
    e.dataTransfer.setData('text/plain', templateVariable);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Store additional data for debugging
    e.dataTransfer.setData('application/json', JSON.stringify({
      path,
      value,
      templateVariable,
      stepName,
      nodeName
    }));
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
          title={`Drag to insert template variable for: ${path}`}
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
      
      {/* Live Template Preview - Only show if there are template variables */}
      {isFocused && value && inputData && value.includes('{{') && value.includes('}}') && (
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

// Enhanced template processing helper - supports multiple formats
export const processTemplate = (template, data) => {
  if (!template || !data) {
    return template;
  }

  // Only process if template contains variables
  if (!template.includes('{{') || !template.includes('}}')) {
    return template;
  }

  // Parse data if it's a string
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse data string for template processing:', error);
      return template;
    }
  }

  let result = template;

  // 1. Handle {{$json.path}} format (traditional backend format)
  result = result.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
    try {
      // Reduced logging for performance
      
      // For workflow chain data, look inside the steps
      if (Object.keys(parsedData).some(key => key.startsWith('step_'))) {
        // Processing workflow chain data
        
        // Try to find the path in any step
        for (const [stepKey, stepValue] of Object.entries(parsedData)) {
          if (stepKey.startsWith('step_') && typeof stepValue === 'object') {
            // Checking step for data
            
            const keys = path.split('.');
            let value = stepValue;
            let found = true;
            
            for (const key of keys) {
              if (value && typeof value === 'object' && key in value) {
                value = value[key];
                // Found key in step
              } else {
                found = false;
                break;
              }
            }
            
            if (found) {
              const result = typeof value === 'string' ? value : JSON.stringify(value);
              // Found value in workflow chain
              return result;
            }
          }
        }
        
        // Path not found in any workflow step
        return match;
      } else {
        // Regular data processing
        const keys = path.split('.');
        let value = parsedData;
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
            // Processing key
          } else {
            // Key not found
            return match;
          }
        }
        
        const result = typeof value === 'string' ? value : JSON.stringify(value);
        // $json processing complete
        return result;
      }
    } catch (error) {
      console.error('Error in $json processing:', error);
      return match;
    }
  });

  // 2. Handle {{ $('NodeName').item.json.field }} format (n8n style)
  result = result.replace(/\{\{\s*\$\(['"]([^'"]+)['"]\)\.item\.json\.(.*?)\s*\}\}/g, (match, nodeName, path) => {
    try {
      // Look for data from the specific step
      const stepKey = Object.keys(parsedData).find(key => key.includes(nodeName) || key.toLowerCase().includes(nodeName.toLowerCase()));
      
      if (stepKey && parsedData[stepKey]) {
        const keys = path.split('.');
        let value = parsedData[stepKey];
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            return match;
          }
        }
        
        return typeof value === 'string' ? value : JSON.stringify(value);
      }
      
      return match;
    } catch (error) {
      return match;
    }
  });

  // 3. Handle {{stepName.field}} format (workflow chain format) - with spaces
  result = result.replace(/\{\{\s*([^}]+?)\.(.*?)\s*\}\}/g, (match, stepName, path) => {
    try {
      // Processing workflow chain template
      
      // Enhanced step key finding with better space handling
      const stepKey = Object.keys(parsedData).find(key => {
        // Direct match
        if (key.includes(stepName)) return true;
        
        // Case insensitive match
        if (key.toLowerCase().includes(stepName.toLowerCase())) return true;
        
        // Step prefix match with various formats
        if (key.startsWith('step_')) {
          // Extract the name part after step_N_
          const namePart = key.replace(/^step_\d+_/, '');
          
          // Try exact match
          if (namePart === stepName) return true;
          
          // Try case insensitive
          if (namePart.toLowerCase() === stepName.toLowerCase()) return true;
          
          // Try with spaces replaced by underscores
          if (namePart.replace(/_/g, ' ') === stepName) return true;
          if (stepName.replace(/ /g, '_') === namePart) return true;
          
          // Try partial matches
          if (namePart.includes(stepName) || stepName.includes(namePart)) return true;
        }
        
        return false;
      });
      
      // Found matching step
      
      if (stepKey && parsedData[stepKey]) {
        const keys = path.split('.');
        let value = parsedData[stepKey];
        
        // Processing path in step data
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
            // Processing key
          } else {
            // Key not found
            return match;
          }
        }
        
        const result = typeof value === 'string' ? value : JSON.stringify(value);
        // Template processing complete
        return result;
      }
      
      // No matching step found
      return match;
    } catch (error) {
      console.error('Error in template processing:', error);
      return match;
    }
  });

  // 4. Handle simple {{variable}} format
  result = result.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (match, variable) => {
    try {
      if (parsedData && parsedData[variable] !== undefined) {
        const value = parsedData[variable];
        return typeof value === 'string' ? value : JSON.stringify(value);
      }
      return match;
    } catch (error) {
      return match;
    }
  });

  return result;
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
    