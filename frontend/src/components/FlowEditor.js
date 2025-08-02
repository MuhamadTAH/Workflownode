import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Corrected import paths for a flat structure
import Sidebar from './Sidebar';
import CustomNode from './CustomNode';
import ConfigPanel from './ConfigPanel';
import './CustomNode.css';
import '../styles/configpanel/index.css';

const nodeTypes = { custom: CustomNode };
const initialNodes = [];
let id = 0;
const getId = () => `dndnode_${id++}`;
const flowKey = 'workflow-flow';

const FlowEditor = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const { getNodes } = useReactFlow();

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeDataString = event.dataTransfer.getData('application/reactflow');
      if (!nodeDataString) return;
      
      const nodeData = JSON.parse(nodeDataString);
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getId(),
        type: 'custom',
        position,
        data: nodeData,
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeDoubleClick = useCallback((event, node) => setSelectedNode(node), []);
  
  const onPanelClose = (formData) => {
      if (formData && selectedNode) {
          setNodes((nds) =>
              nds.map((node) => {
                  if (node.id === selectedNode.id) {
                      node.data = { ...node.data, ...formData };
                  }
                  return node;
              })
          );
      }
      setSelectedNode(null);
  };
  
  const onActivate = async () => {
      const triggerNode = nodes.find(n => n.data.type === 'trigger');
      if (!triggerNode) {
          alert('No trigger node found in the workflow.');
          return;
      }
      if (!triggerNode.data.botToken && !triggerNode.data.token) {
          alert('Please configure the Telegram Trigger node with your Bot API Token first.');
          return;
      }
      
      try {
          // Ensure the trigger node has the token in the format the backend expects
          const triggerNodeForBackend = {
            ...triggerNode,
            data: {
              ...triggerNode.data,
              token: triggerNode.data.botToken || triggerNode.data.token
            }
          };
          
          const response = await fetch('http://localhost:3010/api/workflows/123/activate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                triggerNode: triggerNodeForBackend,
                workflow: {
                  nodes: nodes,
                  edges: edges
                }
              })
          });
          
          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.message || 'Failed to activate workflow.');
          }
          
          alert(result.message);
      } catch (error) {
          console.error('Activation Error:', error);
          alert(`Error: ${error.message}`);
      }
  };
  
  // --- Save, Load, Copy, Paste Logic ---
  const onSave = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      localStorage.setItem(flowKey, JSON.stringify(flow));
      alert('Flow saved successfully!');
    }
  }, [reactFlowInstance]);

  const onRestore = useCallback(() => {
    const flow = JSON.parse(localStorage.getItem(flowKey));
    if (flow) {
      const { x = 0, y = 0, zoom = 1 } = flow.viewport;
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      reactFlowInstance.setViewport({ x, y, zoom });
    }
  }, [setNodes, setEdges, reactFlowInstance]);

  const onCopy = useCallback(() => {
    const selectedNodes = getNodes().filter(node => node.selected);
    if (selectedNodes.length > 0) {
      setClipboard(selectedNodes);
    }
  }, [getNodes]);

  const onPaste = useCallback(() => {
    if (!clipboard) return;
    const newNodes = clipboard.map((node) => ({
      ...node,
      id: getId(),
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      selected: false,
    }));
    setNodes((nds) => nds.concat(newNodes));
  }, [clipboard, setNodes]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'c') onCopy();
        if (event.key === 'v') onPaste();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCopy, onPaste]);

  return (
    <div className="flex h-screen w-screen bg-white" style={{ fontFamily: 'sans-serif' }}>
      <Sidebar onSave={onSave} onRestore={onRestore} onActivate={onActivate} />
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
          fitView
          nodeTypes={nodeTypes}
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
      {selectedNode && <ConfigPanel node={selectedNode} edges={edges} nodes={nodes} onClose={onPanelClose} />}
    </div>
  );
};

export default FlowEditor;
