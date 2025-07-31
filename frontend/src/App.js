/*
=================================================================
FRONTEND FILE: src/App.js (UPDATED)
=================================================================
*/
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './components/Sidebar';
import CustomNode from './components/CustomNode';
import ConfigPanel from './components/ConfigPanel';
// REMOVED: ChatbotPanel is no longer needed here
import './styles/CustomNode.css';
import './styles/ConfigPanel.css';
import './styles/ChatbotPanel.css';

const nodeTypes = { custom: CustomNode };
const initialNodes = [];
let id = 0;
const getId = () => `dndnode_${id++}`;
const flowKey = 'workflow-flow';

const FlowEditorComponent = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  
  const { getNodes, setViewport, toObject, project } = useReactFlow();

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
      const position = project({
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
    [project, setNodes]
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
      if (!triggerNode.data.token) {
          alert('Please configure the Telegram Trigger node with your Bot API Token first.');
          return;
      }

      // Validate workflow has at least one action node
      const actionNodes = nodes.filter(n => n.data.type !== 'trigger');
      if (actionNodes.length === 0) {
          alert('Workflow must contain at least one action node (AI Agent, Model Node, etc.)');
          return;
      }

      // Check for node connections
      if (edges.length === 0) {
          alert('Please connect your nodes to create a workflow chain.');
          return;
      }
      
      try {
          const workflowData = {
              nodes: nodes,
              edges: edges
          };

          console.log('Activating workflow with data:', workflowData);
          
          const response = await fetch('https://workflownode.onrender.com/api/workflows/123/activate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  triggerNode,
                  workflow: workflowData
              })
          });
          
          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.message || 'Failed to activate workflow.');
          }
          
          alert(`✅ ${result.message}\n\n🚀 Auto-execution enabled!\n📊 Nodes: ${result.workflowNodes}\n🔗 Edges: ${result.workflowEdges}\n\nSend a message to your Telegram bot to test the automatic workflow!`);
      } catch (error) {
          console.error('Activation Error:', error);
          alert(`❌ Error: ${error.message}`);
      }
  };

  const onDeactivate = async () => {
      try {
          const response = await fetch('https://workflownode.onrender.com/api/workflows/123/deactivate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
          });
          
          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.message || 'Failed to deactivate workflow.');
          }
          
          alert(`✅ ${result.message}\n\n⏹️ Auto-execution disabled.`);
      } catch (error) {
          console.error('Deactivation Error:', error);
          alert(`❌ Error: ${error.message}`);
      }
  };
  
  const onSave = useCallback(() => {
    const flow = toObject();
    localStorage.setItem(flowKey, JSON.stringify(flow));
    alert('Flow saved successfully!');
  }, [toObject]);

  const onRestore = useCallback(() => {
    const flow = JSON.parse(localStorage.getItem(flowKey));
    if (flow) {
      const { x = 0, y = 0, zoom = 1 } = flow.viewport;
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      setViewport({ x, y, zoom });
    }
  }, [setNodes, setEdges, setViewport]);

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
      <Sidebar onSave={onSave} onRestore={onRestore} onActivate={onActivate} onDeactivate={onDeactivate} />
      <div className="flex-grow h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
      {/* This now correctly renders the ConfigPanel for all nodes */}
      {selectedNode && <ConfigPanel node={selectedNode} onClose={onPanelClose} nodes={nodes} edges={edges} />}
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <FlowEditorComponent />
  </ReactFlowProvider>
);

export default App;
