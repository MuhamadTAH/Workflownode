/*
=================================================================
FILE: frontend/src/components/WorkflowChatbot.js
=================================================================
Conversational chatbot for building workflows through natural language.
Users can talk to the bot to add nodes, connect them, and build complete workflows.
*/
import React, { useState, useRef, useEffect } from 'react';
import { callClaudeApi } from '../services/api';

const WorkflowChatbot = ({ onAddNode, onConnectNodes, nodes, edges, onUpdateWorkflow }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your workflow assistant. I can help you build workflows by talking to me naturally. Try saying things like:\n\n• 'Add a Telegram trigger'\n• 'Connect it to an AI agent'\n• 'Add a filter node after that'\n• 'Show me what nodes I have'\n\nWhat would you like to build today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // System prompt for the workflow building chatbot
  const getSystemPrompt = () => {
    const currentWorkflow = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        position: { x: node.position.x, y: node.position.y }
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target
      }))
    };

    return `You are a helpful workflow building assistant. You help users create and modify workflows by interpreting their natural language requests and generating specific workflow commands.

Current Workflow State:
${JSON.stringify(currentWorkflow, null, 2)}

Available Node Types:
- Triggers: trigger (Telegram Trigger)
- Actions: modelNode, aiAgent, googleDocs, dataStorage, telegramSendMessage, fileConverter  
- Logic: if, filter, merge, setData, switch, wait, stopAndError, loop, compareDatasets, executeSubWorkflow

When the user wants to:
1. ADD A NODE: Respond with JSON: {"action": "addNode", "nodeType": "nodeType", "label": "Custom Label", "position": {"x": 100, "y": 100}}
2. CONNECT NODES: Respond with JSON: {"action": "connectNodes", "sourceId": "nodeId1", "targetId": "nodeId2"}
3. GET INFO: Provide helpful information about their current workflow
4. SUGGESTIONS: Suggest next logical steps in workflow building

Always be conversational and helpful. If adding nodes, suggest good positions that don't overlap existing nodes.
If connecting nodes, explain why the connection makes sense.

Example responses:
- For "add telegram trigger": {"action": "addNode", "nodeType": "trigger", "label": "Telegram Trigger", "position": {"x": 100, "y": 100}}
- For "connect them": {"action": "connectNodes", "sourceId": "node-1", "targetId": "node-2"}

Respond conversationally first, then include the JSON command if needed.`;
  };

  // Process user message and determine workflow actions
  const processMessage = async (userMessage) => {
    setIsProcessing(true);

    try {
      // Add user message to chat
      const userMsg = {
        id: Date.now(),
        type: 'user',
        content: userMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);

      // Get bot response using Claude API
      const response = await callClaudeApi(
        '', // We'll need to get this from config or make it optional
        userMessage,
        getSystemPrompt()
      );

      let botResponse = response.text || response;
      let workflowAction = null;

      // Try to extract JSON command from response
      const jsonMatch = botResponse.match(/\{[\s\S]*"action"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          workflowAction = JSON.parse(jsonMatch[0]);
          // Remove JSON from display text
          botResponse = botResponse.replace(jsonMatch[0], '').trim();
        } catch (e) {
          console.log('Could not parse workflow action JSON');
        }
      }

      // Add bot response to chat
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse || "I understand you want to modify your workflow. Let me help you with that!",
        timestamp: new Date(),
        action: workflowAction
      };
      setMessages(prev => [...prev, botMsg]);

      // Execute workflow actions
      if (workflowAction) {
        await executeWorkflowAction(workflowAction);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Fallback to simple command processing
      const fallbackAction = parseSimpleCommands(userMessage);
      
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: fallbackAction ? 
          `I'll help you ${fallbackAction.description}!` : 
          "I'm having trouble with the AI service right now, but I can still help with basic commands like 'add telegram trigger' or 'add ai agent'.",
        timestamp: new Date(),
        action: fallbackAction
      };
      setMessages(prev => [...prev, botMsg]);

      if (fallbackAction) {
        await executeWorkflowAction(fallbackAction);
      }
    }

    setIsProcessing(false);
  };

  // Simple command parsing as fallback - ENHANCED WITH ALL NODE TYPES
  const parseSimpleCommands = (message) => {
    const lowerMsg = message.toLowerCase();
    
    // Node addition commands
    if (lowerMsg.includes('add') || lowerMsg.includes('create')) {
      // TRIGGER NODES
      if (lowerMsg.includes('telegram trigger') || lowerMsg.includes('telegram bot') || lowerMsg.includes('trigger')) {
        return {
          action: 'addNode',
          nodeType: 'trigger',
          label: 'Telegram Trigger',
          position: getNextNodePosition(),
          description: 'add a Telegram trigger'
        };
      }
      
      // ACTION NODES
      if (lowerMsg.includes('ai agent') || lowerMsg.includes('ai node')) {
        return {
          action: 'addNode',
          nodeType: 'aiAgent',
          label: 'AI Agent',
          position: getNextNodePosition(),
          description: 'add an AI agent'
        };
      }
      if (lowerMsg.includes('model node') || lowerMsg.includes('chat node') || lowerMsg.includes('model')) {
        return {
          action: 'addNode',
          nodeType: 'modelNode',
          label: 'Model Node',
          position: getNextNodePosition(),
          description: 'add a model node'
        };
      }
      if (lowerMsg.includes('google docs') || lowerMsg.includes('google doc') || lowerMsg.includes('docs')) {
        return {
          action: 'addNode',
          nodeType: 'googleDocs',
          label: 'Google Docs',
          position: getNextNodePosition(),
          description: 'add a Google Docs node'
        };
      }
      if (lowerMsg.includes('data storage') || lowerMsg.includes('storage') || lowerMsg.includes('database')) {
        return {
          action: 'addNode',
          nodeType: 'dataStorage',
          label: 'Data Storage',
          position: getNextNodePosition(),
          description: 'add a data storage node'
        };
      }
      if (lowerMsg.includes('telegram send') || lowerMsg.includes('send message') || lowerMsg.includes('send telegram')) {
        return {
          action: 'addNode',
          nodeType: 'telegramSendMessage',
          label: 'Telegram Send Message',
          position: getNextNodePosition(),
          description: 'add a Telegram send message node'
        };
      }
      if (lowerMsg.includes('file converter') || lowerMsg.includes('converter') || lowerMsg.includes('file convert')) {
        return {
          action: 'addNode',
          nodeType: 'fileConverter',
          label: 'File Converter',
          position: getNextNodePosition(),
          description: 'add a file converter node'
        };
      }
      
      // LOGIC NODES (All 10 logic nodes from n8n integration)
      if (lowerMsg.includes('if node') || lowerMsg.includes('if condition') || (lowerMsg.includes('if') && lowerMsg.includes('node'))) {
        return {
          action: 'addNode',
          nodeType: 'if',
          label: 'If',
          position: getNextNodePosition(),
          description: 'add an If node for conditional routing'
        };
      }
      if (lowerMsg.includes('filter') || lowerMsg.includes('filter node')) {
        return {
          action: 'addNode',
          nodeType: 'filter',
          label: 'Filter',
          position: getNextNodePosition(),
          description: 'add a Filter node'
        };
      }
      if (lowerMsg.includes('merge') || lowerMsg.includes('merge node')) {
        return {
          action: 'addNode',
          nodeType: 'merge',
          label: 'Merge',
          position: getNextNodePosition(),
          description: 'add a Merge node'
        };
      }
      if (lowerMsg.includes('set data') || lowerMsg.includes('set data node') || lowerMsg.includes('setdata')) {
        return {
          action: 'addNode',
          nodeType: 'setData',
          label: 'Set Data',
          position: getNextNodePosition(),
          description: 'add a Set Data node'
        };
      }
      if (lowerMsg.includes('switch') || lowerMsg.includes('switch node')) {
        return {
          action: 'addNode',
          nodeType: 'switch',
          label: 'Switch',
          position: getNextNodePosition(),
          description: 'add a Switch node for multi-path routing'
        };
      }
      if (lowerMsg.includes('wait') || lowerMsg.includes('wait node') || lowerMsg.includes('delay')) {
        return {
          action: 'addNode',
          nodeType: 'wait',
          label: 'Wait',
          position: getNextNodePosition(),
          description: 'add a Wait node'
        };
      }
      if (lowerMsg.includes('stop') || lowerMsg.includes('error') || lowerMsg.includes('stop and error')) {
        return {
          action: 'addNode',
          nodeType: 'stopAndError',
          label: 'Stop and Error',
          position: getNextNodePosition(),
          description: 'add a Stop and Error node'
        };
      }
      if (lowerMsg.includes('loop') || lowerMsg.includes('loop node')) {
        return {
          action: 'addNode',
          nodeType: 'loop',
          label: 'Loop',
          position: getNextNodePosition(),
          description: 'add a Loop node'
        };
      }
      if (lowerMsg.includes('compare') || lowerMsg.includes('compare datasets') || lowerMsg.includes('compare data')) {
        return {
          action: 'addNode',
          nodeType: 'compareDatasets',
          label: 'Compare Datasets',
          position: getNextNodePosition(),
          description: 'add a Compare Datasets node'
        };
      }
      if (lowerMsg.includes('sub workflow') || lowerMsg.includes('subworkflow') || lowerMsg.includes('execute workflow')) {
        return {
          action: 'addNode',
          nodeType: 'executeSubWorkflow',
          label: 'Execute Sub Workflow',
          position: getNextNodePosition(),
          description: 'add an Execute Sub Workflow node'
        };
      }
    }

    // Connection commands
    if (lowerMsg.includes('connect') && nodes.length >= 2) {
      const lastTwoNodes = nodes.slice(-2);
      return {
        action: 'connectNodes',
        sourceId: lastTwoNodes[0].id,
        targetId: lastTwoNodes[1].id,
        description: 'connect the last two nodes'
      };
    }

    return null;
  };

  // Calculate position for next node to avoid overlaps
  const getNextNodePosition = () => {
    if (nodes.length === 0) {
      return { x: 100, y: 100 };
    }
    
    // Find the rightmost node and place new node to its right
    const rightmostNode = nodes.reduce((max, node) => 
      node.position.x > max.position.x ? node : max
    );
    
    return {
      x: rightmostNode.position.x + 250,
      y: rightmostNode.position.y + (Math.random() - 0.5) * 100 // Add some vertical variation
    };
  };

  // Execute workflow actions (add nodes, connect nodes, etc.)
  const executeWorkflowAction = async (action) => {
    try {
      switch (action.action) {
        case 'addNode':
          if (onAddNode) {
            const nodeData = {
              type: action.nodeType,
              label: action.label,
              position: action.position || getNextNodePosition()
            };
            onAddNode(nodeData);
          }
          break;

        case 'connectNodes':
          if (onConnectNodes && action.sourceId && action.targetId) {
            onConnectNodes(action.sourceId, action.targetId);
          }
          break;

        default:
          console.log('Unknown workflow action:', action.action);
      }
    } catch (error) {
      console.error('Error executing workflow action:', error);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isProcessing) {
      processMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  return (
    <div className="workflow-chatbot" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      height: '500px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#4f46e5',
        color: 'white',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', marginRight: '8px' }}>🤖</span>
          Workflow Assistant
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
          Talk to me to build your workflow
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: message.type === 'user' ? '#4f46e5' : '#f3f4f6',
              color: message.type === 'user' ? 'white' : '#374151',
              fontSize: '14px',
              lineHeight: '1.4',
              whiteSpace: 'pre-line'
            }}>
              {message.content}
              {message.action && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  Action: {message.action.action}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              <span>🤔 Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tell me what you want to add..."
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isProcessing}
            style={{
              padding: '12px 16px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: inputMessage.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              opacity: inputMessage.trim() && !isProcessing ? 1 : 0.5,
              fontSize: '14px'
            }}
          >
            Send
          </button>
        </div>
        
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          Try: "Add a Telegram trigger and connect it to an AI agent"
        </div>
      </form>
    </div>
  );
};

export default WorkflowChatbot;