/*
=================================================================
FRONTEND FILE: src/components/CustomNode.js (UPDATED)
=================================================================
*/
import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
  const nodeClasses = `custom-node-ai`;

  return (
    <div className={nodeClasses}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Left} className="handle-left" />
      
      {/* Main Content */}
      <div className="node-content">
        <div className="node-header">
          <i className={`${data.icon} node-icon`}></i>
          <div className="node-label">{data.label}</div>
        </div>
        <div className="node-description">{data.description}</div>
      </div>
      
      {/* Output Handle */}
      <Handle type="source" position={Position.Right} className="handle-right" />

      {/* UPDATED: Added back the bottom handles for the AI Agent node */}
      {data.type === 'aiAgent' && (
        <div className="bottom-handles">
            <div className="handle-group">
                <Handle type="target" id="model" position={Position.Bottom} className="handle-bottom" />
                <div className="handle-label">MODEL</div>
            </div>
            <div className="handle-group">
                <Handle type="target" id="memory" position={Position.Bottom} className="handle-bottom" />
                <div className="handle-label">MEMORY</div>
            </div>
            <div className="handle-group">
                <Handle type="target" id="tools" position={Position.Bottom} className="handle-bottom" />
                <div className="handle-label">TOOLS</div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomNode;
