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
            typeof value === 'string' ? `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"` :
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

  const getNodeTitle = (type) => {
    switch(type) {
      case 'telegram': return 'Telegram Message';
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
            {Object.entries(data).map(([key, value]) =>
              renderJSONField(key, value, '', '', dataType)
            )}
          </div>
        )}
      </div>
    </div>
  );
};