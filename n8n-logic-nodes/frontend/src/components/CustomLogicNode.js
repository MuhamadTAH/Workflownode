/*
=================================================================
FILE: frontend/src/components/CustomLogicNode.js (UPDATED)
=================================================================
This component has been updated to give the 'Merge' node two
distinct input handles by default, allowing it to accept data
from multiple sources.
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
  const isMergeNode = data.type === 'merge'; // NEW: Check for Merge node

  // Calculate total number of output handles for dynamic sizing
  const getTotalOutputHandles = () => {
    if (isIfNode || isLoopNode) return 2;
    if (isCompareNode) return 3;
    if (isSwitchNode) {
      const rulesCount = data.switchRules?.length || 1;
      const fallbackCount = data.switchOptions?.includes('fallbackOutput') ? 1 : 0;
      return rulesCount + fallbackCount;
    }
    return 1;
  };

  // Calculate total number of input handles for dynamic sizing
  const getTotalInputHandles = () => {
    if (isCompareNode) return 2;
    return 1;
  };

  const totalOutputHandles = getTotalOutputHandles();
  const totalInputHandles = getTotalInputHandles();
  
  // Dynamic node height based on number of handles
  const getNodeHeight = () => {
    const baseHeight = 80;
    const handleHeight = 20;
    const maxHandles = Math.max(totalOutputHandles, totalInputHandles);
    return Math.max(baseHeight, maxHandles * handleHeight + 40);
  };

  // Dynamic output handle size based on number of output handles
  const getOutputHandleSize = () => {
    if (totalOutputHandles <= 2) return { width: '18px', height: '18px' };
    if (totalOutputHandles <= 4) return { width: '16px', height: '16px' };
    return { width: '14px', height: '14px' };
  };

  // Dynamic input handle size based on number of input handles
  const getInputHandleSize = () => {
    if (totalInputHandles <= 1) return { width: '10px', height: '30px' }; // Default single input size
    return { width: '8px', height: '24px' }; // Smaller size for multiple inputs
  };

  // Dynamic label positioning based on handle size
  const getLabelDistance = () => {
    if (totalOutputHandles <= 2) return '-58px'; // More distance for larger handles to avoid plus icon
    if (totalOutputHandles <= 4) return '-62px'; // Even more distance for medium handles
    return '-65px'; // Maximum distance for smaller handles
  };

  // Helper function to dynamically position handles for the switch node.
  const getHandlePosition = (index, total) => {
    return `${100 * (index + 1) / (total + 1)}%`;
  };

  return (
    <div 
      className="custom-node-ai" 
      style={{ 
        height: `${getNodeHeight()}px`,
        minHeight: '80px'
      }}
    >
      {/* Render input handles */}
      {isCompareNode ? (
        <>
          <Handle type="target" position={Position.Left} id="input1" className="handle-left" style={{ top: '30%', ...getInputHandleSize() }} />
          <div className="handle-label handle-label-left" style={{ top: 'calc(30% - 7px)'}}>INPUT 1</div>
          <Handle type="target" position={Position.Left} id="input2" className="handle-left" style={{ top: '70%', ...getInputHandleSize() }} />
          <div className="handle-label handle-label-left" style={{ top: 'calc(70% - 7px)'}}>INPUT 2</div>
        </>
      ) : (
        <Handle type="target" position={Position.Left} className="handle-left" style={getInputHandleSize()} />
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
              <Handle type="source" position={Position.Right} id="true" className="handle-right handle-true" style={{ top: '30%', ...getOutputHandleSize() }} />
              <div className="handle-label handle-label-right handle-label-true" style={{ top: 'calc(30% - 7px)', right: getLabelDistance() }}>TRUE</div>
              <Handle type="source" position={Position.Right} id="false" className="handle-right handle-false" style={{ top: '70%', ...getOutputHandleSize() }} />
              <div className="handle-label handle-label-right handle-label-false" style={{ top: 'calc(70% - 7px)', right: getLabelDistance() }}>FALSE</div>
            </>
          ) : isLoopNode ? (
            <>
              <Handle type="source" position={Position.Right} id="loop" className="handle-right handle-loop" style={{ top: '30%', ...getOutputHandleSize() }} />
              <div className="handle-label handle-label-right handle-label-loop" style={{ top: 'calc(30% - 7px)', right: getLabelDistance() }}>LOOP</div>
              <Handle type="source" position={Position.Right} id="done" className="handle-right handle-done" style={{ top: '70%', ...getOutputHandleSize() }} />
              <div className="handle-label handle-label-right handle-label-done" style={{ top: 'calc(70% - 7px)', right: getLabelDistance() }}>DONE</div>
            </>
          ) : isCompareNode ? (
            <>
              <Handle type="source" position={Position.Right} id="added" className="handle-right" style={{ top: '25%', ...getOutputHandleSize() }} />
              <div className="handle-label handle-label-right" style={{ top: 'calc(25% - 7px)', right: getLabelDistance() }}>ADDED</div>
              <Handle type="source" position={Position.Right} id="updated" className="handle-right" style={{ top: '50%', ...getOutputHandleSize() }} />
              <div className="handle-label handle-label-right" style={{ top: 'calc(50% - 7px)', right: getLabelDistance() }}>UPDATED</div>
              <Handle type="source" position={Position.Right} id="removed" className="handle-right" style={{ top: '75%', ...getOutputHandleSize() }} />
              <div className="handle-label handle-label-right" style={{ top: 'calc(75% - 7px)', right: getLabelDistance() }}>REMOVED</div>
            </>
          ) : isSwitchNode ? (
            <>
              {/* Dynamically create handles based on rules in node data */}
              {data.switchRules?.map((rule, index) => (
                <React.Fragment key={index}>
                  <Handle type="source" position={Position.Right} id={`${index}`} className="handle-right" style={{ top: getHandlePosition(index, data.switchRules.length + (data.switchOptions?.includes('fallbackOutput') ? 1 : 0)), ...getOutputHandleSize() }} />
                  <div className="handle-label handle-label-right" style={{ top: `calc(${getHandlePosition(index, data.switchRules.length + (data.switchOptions?.includes('fallbackOutput') ? 1 : 0))}) - 7px`, right: getLabelDistance() }}>PATH {index + 1}</div>
                </React.Fragment>
              ))}
              {/* Add a fallback output if specified */}
              {data.switchOptions?.includes('fallbackOutput') && (
                <>
                  <Handle type="source" position={Position.Right} id="fallback" className="handle-right handle-done" style={{ top: getHandlePosition(data.switchRules?.length || 0, (data.switchRules?.length || 0) + 1), ...getOutputHandleSize() }} />
                  <div className="handle-label handle-label-right" style={{ top: `calc(${getHandlePosition(data.switchRules?.length || 0, (data.switchRules?.length || 0) + 1)}) - 7px`, right: getLabelDistance() }}>FALLBACK</div>
                </>
              )}
            </>
          ) : (
            // Default single output handle
            <Handle type="source" position={Position.Right} className="handle-right" style={getOutputHandleSize()} />
          )}
        </>
      )}
    </div>
  );
};

export default CustomLogicNode;
