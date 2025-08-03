/*
=================================================================
FILE: frontend/src/components/configpanel/JSONViewer.js
=================================================================
JSON Tree Viewer Component for ConfigPanel
- NodeOrganizedJSONViewer: Displays JSON data in n8n-style organization
- Node type detection and visual indicators
- Collapsible tree structure with drag-and-drop support
*/

import React, { useState } from 'react';
import { DraggableJSONField, detectDataType } from './DragDropSystem';

// JSON Tree Viewer Component
export const NodeOrganizedJSONViewer = ({ data, onFieldDrag }) => {
  const [expandedNodes, setExpandedNodes] = useState({});
  // FIX: Added state to control the main section's visibility
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);

  if (!data || typeof data !== 'object') {
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        No JSON data to display
      </div>
    );
  }

  // FIX: Function to toggle the main section's visibility
  const toggleSection = () => {
    setIsSectionExpanded(prev => !prev);
  };

  const toggleNode = (nodeName) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeName]: !prev[nodeName]
    }));
  };

  const renderJSONField = (key, value, path = '', nodePrefix = '', dataType = 'generic', stepName = '') => {
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
                renderJSONField(subKey, subValue, fullPath, nodePrefix, dataType, stepName)
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
            stepName={stepName}
          />
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {Array.isArray(value) ? `[${value.length} items]` :
            typeof value === 'string' ? `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"` :
            String(value)}
        </span>
      </div>
    );
  };

  // Check if this is workflow chain data
  const isWorkflowChain = Object.keys(data).some(key => key.startsWith('step_'));
  
  // Organize data by detected type
  const dataType = isWorkflowChain ? 'workflow_chain' : detectDataType(data);
  const getNodeIcon = (type) => {
    switch(type) {
      case 'telegram': return '📱';
      case 'ai_response': return '🤖';
      case 'google_docs': return '📄';
      case 'data_storage': return '💾';
      case 'workflow_chain': return '🔗';
      default: return '📊';
    }
  };

  const getNodeTitle = (type) => {
    switch(type) {
      case 'telegram': return 'Telegram Message';
      case 'workflow_chain': return 'Workflow Chain Data';
      case 'ai_response': return 'AI Response';
      case 'google_docs': return 'Google Docs';
      case 'data_storage': return 'Data Storage';
      default: return 'JSON Data';
    }
  };

  return (
    <div className="json-tree-container p-3">
      <div className="json-node-section">
        {/* FIX: Made the entire header clickable to toggle the section */}
        <div 
          className={`json-node-header ${dataType}`} 
          onClick={toggleSection}
          style={{ cursor: 'pointer' }}
        >
          <span className="node-type-icon">{getNodeIcon(dataType)}</span>
          <span className="json-node-title">
            {getNodeTitle(dataType)}
          </span>
          {/* FIX: The arrow now rotates based on the section's state */}
          <span 
            className="json-node-toggle"
            style={{ 
              transform: isSectionExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            ▶
          </span>
        </div>
        {/* FIX: The content is now shown or hidden based on the section's state */}
        {isSectionExpanded && (
          <div className="json-node-content">
            {isWorkflowChain ? (
              // Render workflow chain data with step names
              Object.entries(data).map(([stepKey, stepValue]) => {
                // Extract step name from stepKey (e.g., "step_1_Telegram_Trigger" -> "Telegram_Trigger")
                const stepName = stepKey.replace(/^step_\d+_/, '');
                // Create display name by converting underscores back to spaces for readability
                const displayName = stepName.replace(/_/g, ' ');
                
                return (
                  <div key={stepKey} className="workflow-step mb-4 p-3 bg-gray-50 rounded border">
                    <div className="step-header mb-2">
                      <span className="font-semibold text-blue-700">{displayName}</span>
                      <span className="text-xs text-gray-400 ml-2">({stepKey})</span>
                    </div>
                    <div className="step-content">
                      {typeof stepValue === 'object' && stepValue !== null ? (
                        Object.entries(stepValue).map(([fieldKey, fieldValue]) =>
                          renderJSONField(fieldKey, fieldValue, '', '', dataType, stepName)
                        )
                      ) : (
                        <div className="text-sm text-gray-600">{String(stepValue)}</div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              // Render regular JSON data
              Object.entries(data).map(([key, value]) =>
                renderJSONField(key, value, '', '', dataType)
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};