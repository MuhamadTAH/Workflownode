/*
=================================================================
FILE: frontend/src/components/CustomLogicNode.js (REVERTED)
=================================================================
This component has been reverted to its previous state. The logic
for dynamically adding a 'multi-handle' class has been removed to
keep the node appearance consistent.
*/
import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomLogicNode = ({ data = {} }) => {
  // Determine the type of node to render specific handles.
  const isIfNode = data.type === 'if';
  const isLoopNode = data.type === 'loop';
  const isCompareNode = data.type === 'compare';
  const isSwitchNode = data.type === 'switch';
  const hasNoOutputs = data.type === 'stopAndError';

  // Helper function to dynamically position handles for the switch node.
  const getHandlePosition = (index, total) => {
    return `${100 * (index + 1) / (total + 1)}%`;
  };

  return (
    <div className="custom-node-ai">
      {/* Render input handles */}
      {isCompareNode ? (
        <>
          <Handle type="target" position={Position.Left} id="input1" className="handle-left" style={{ top: '30%' }} />
          <div className="handle-label handle-label-left" style={{ top: 'calc(30% - 7px)'}}>INPUT 1</div>
          <Handle type="target" position={Position.Left} id="input2" className="handle-left" style={{ top: '70%' }} />
          <div className="handle-label handle-label-left" style={{ top: 'calc(70% - 7px)'}}>INPUT 2</div>
        </>
      ) : (
        <Handle type="target" position={Position.Left} className="handle-left" />
      )}
      
      {/* Node's main content */}
      <div className="node-content">
        <div className="node-header">
          <i className={`fa-solid ${data.icon} node-icon ${data.color}`}></i>
          <div className="node-label">{data.label}</div>
        </div>
        <div className="node-description">{data.description}</div>
      </div>
      
      {/* Render output handles conditionally */}
      {!hasNoOutputs && (
        <>
          {isIfNode ? (
            <>
              <Handle type="source" position={Position.Right} id="true" className="handle-right handle-true" style={{ top: '30%' }} />
              <div className="handle-label handle-label-right handle-label-true" style={{ top: 'calc(30% - 7px)'}}>TRUE</div>
              <Handle type="source" position={Position.Right} id="false" className="handle-right handle-false" style={{ top: '70%' }} />
              <div className="handle-label handle-label-right handle-label-false" style={{ top: 'calc(70% - 7px)'}}>FALSE</div>
            </>
          ) : isLoopNode ? (
            <>
              <Handle type="source" position={Position.Right} id="loop" className="handle-right handle-loop" style={{ top: '30%' }} />
              <div className="handle-label handle-label-right handle-label-loop" style={{ top: 'calc(30% - 7px)'}}>LOOP</div>
              <Handle type="source" position={Position.Right} id="done" className="handle-right handle-done" style={{ top: '70%' }} />
              <div className="handle-label handle-label-right handle-label-done" style={{ top: 'calc(70% - 7px)'}}>DONE</div>
            </>
          ) : isCompareNode ? (
            <>
              <Handle type="source" position={Position.Right} id="added" className="handle-right" style={{ top: '25%' }} />
              <div className="handle-label handle-label-right" style={{ top: 'calc(25% - 7px)'}}>ADDED</div>
              <Handle type="source" position={Position.Right} id="updated" className="handle-right" style={{ top: '50%' }} />
              <div className="handle-label handle-label-right" style={{ top: 'calc(50% - 7px)'}}>UPDATED</div>
              <Handle type="source" position={Position.Right} id="removed" className="handle-right" style={{ top: '75%' }} />
              <div className="handle-label handle-label-right" style={{ top: 'calc(75% - 7px)'}}>REMOVED</div>
            </>
          ) : isSwitchNode ? (
            <>
              {/* Dynamically create handles based on rules in node data */}
              {data.rules?.map((rule, index) => (
                <React.Fragment key={index}>
                  <Handle type="source" position={Position.Right} id={`${index}`} className="handle-right" style={{ top: getHandlePosition(index, data.rules.length + (data.fallbackOutput ? 1 : 0)) }} />
                  <div className="handle-label handle-label-right" style={{ top: `calc(${getHandlePosition(index, data.rules.length + (data.fallbackOutput ? 1 : 0))}) - 7px`}}>PATH {index + 1}</div>
                </React.Fragment>
              ))}
              {/* Add a fallback output if specified */}
              {data.fallbackOutput && (
                <>
                  <Handle type="source" position={Position.Right} id="fallback" className="handle-right handle-done" style={{ top: getHandlePosition(data.rules.length, data.rules.length + 1) }} />
                  <div className="handle-label handle-label-right" style={{ top: `calc(${getHandlePosition(data.rules.length, data.rules.length + 1)}) - 7px`}}>FALLBACK</div>
                </>
              )}
            </>
          ) : (
            // Default single output handle
            <Handle type="source" position={Position.Right} className="handle-right" />
          )}
        </>
      )}
    </div>
  );
};

export default CustomLogicNode;
