/*
=================================================================
FILE: frontend/src/components/App.js (UPDATED)
=================================================================
This component has been updated to pass the full list of nodes and
edges to the ConfigPanel, enabling it to trace connections and
fetch data from previous nodes.
*/
import React, { useState, useRef, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import CustomLogicNode from './CustomLogicNode';
import ConfigPanel from './ConfigPanel';
import '../styles/CustomLogicNode.css';
import '../styles/ConfigPanel.css';

// Register the custom node type so ReactFlow knows how to render it.
const nodeTypes = { custom: CustomLogicNode };

// Simple utility to generate unique IDs for new nodes.
let id = 0;
const getId = () => `dndnode_${id++}`;

const App = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Handles creating a new edge when connecting two nodes.
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Allows the canvas to be a valid drop target.
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handles dropping a new node from the sidebar onto the canvas.
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeDataString = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeDataString) return;
      
      const nodeData = JSON.parse(nodeDataString);

      // Project the screen coordinates to the ReactFlow pane coordinates.
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getId(),
        type: 'custom', // All nodes use the custom renderer
        position,
        data: nodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Sets the currently selected node when double-clicked.
  const onNodeDoubleClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Handles closing the config panel and updating the node's data.
  const onPanelClose = (updatedData) => {
    if (updatedData && selectedNode) {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    // Merge the updated data into the node's data object.
                    node.data = { ...node.data, ...updatedData };
                }
                return node;
            })
        );
    }
    setSelectedNode(null); // Close the panel
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      <Sidebar />
      <div className="flex-grow h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </div>
      {/* UPDATED: Pass nodes and edges to the ConfigPanel */}
      {selectedNode && (
        <ConfigPanel 
            node={selectedNode} 
            nodes={nodes}
            edges={edges}
            onClose={onPanelClose} 
        />
      )}
    </div>
  );
};

export default App;
