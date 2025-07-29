/*
=================================================================
FRONTEND FILE: src/components/ConfigPanel.js (CORRECTED)
=================================================================
*/
import React, { useState, useEffect, useRef } from 'react';

// Chatbot UI is now part of the ConfigPanel
const ChatbotInterface = ({ nodeConfig }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('https://workflownode.onrender.com/api/nodes/run-node', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    node: {
                        type: 'modelNode',
                        config: nodeConfig,
                    },
                    inputData: { userMessage: inputValue }
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to get response.');
            }
            
            const botMessage = { sender: 'bot', text: result.reply };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            const errorMessage = { sender: 'bot', text: `Error: ${error.message}`, isError: true };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsLoading(false);
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender} ${msg.isError ? 'error' : ''}`}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div className="message bot typing"><span></span><span></span><span></span></div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="chatbot-input-form">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading || !nodeConfig.apiKey}
                />
                <button type="submit" disabled={isLoading || !nodeConfig.apiKey}>
                    <i className="fa-solid fa-paper-plane"></i>
                </button>
            </form>
            {!nodeConfig.apiKey && <div className="api-key-warning">Please set an API Key to use the chat.</div>}
        </div>
    );
};

const ConfigPanel = ({ node, onClose }) => {
  const [formData, setFormData] = useState({
      label: node.data.label || '',
      description: node.data.description || '',
      model: node.data.model || 'claude-3-5-sonnet-20241022',
      apiKey: node.data.apiKey || '',
      systemPrompt: node.data.systemPrompt || 'You are a helpful assistant.',
      promptTemplate: node.data.promptTemplate || 'You are a helpful assistant. User message: {{message.text}}',
      temperature: node.data.temperature || 0.7,
      maxTokens: node.data.maxTokens || 400,
      token: node.data.token || ''
  });
  
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [apiKeyVerificationStatus, setApiKeyVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputData, setInputData] = useState(null);
  const [outputData, setOutputData] = useState(null);

  const handleInputChange = (e) => {
      const { name, value, type } = e.target;
      const finalValue = type === 'number' ? parseFloat(value) : value;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
      if (name === 'apiKey') {
          setApiKeyVerificationStatus(null);
      }
      if (name === 'token') {
          setVerificationStatus(null);
      }
  };

  const handleClose = () => onClose(formData);

  const handleVerifyApiKey = async () => {
      if (!formData.apiKey) {
          setApiKeyVerificationStatus({ ok: false, message: 'Please enter an API Key.' });
          return;
      }
      setIsLoading(true);
      setApiKeyVerificationStatus(null);
      try {
          const response = await fetch('https://workflownode.onrender.com/api/ai/verify-claude', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: formData.apiKey })
          });
          const result = await response.json();
          setApiKeyVerificationStatus(result);
      } catch (error) {
          setApiKeyVerificationStatus({ ok: false, message: 'Network error or server issue.' });
      }
      setIsLoading(false);
  };

  const handleCheckToken = async () => {
      if (!formData.token) {
          setVerificationStatus({ ok: false, message: 'Please enter a token first.' });
          return;
      }
      setIsLoading(true);
      setVerificationStatus(null);
      try {
          const response = await fetch('https://workflownode.onrender.com/api/telegram/verify-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: formData.token })
          });
          const result = await response.json();
          setVerificationStatus(result);
      } catch (error) {
          setVerificationStatus({ ok: false, message: 'Network error. Is the backend running?' });
      }
      setIsLoading(false);
  };

  const handleGetData = async () => {
    setIsLoading(true);
    
    try {
      if (node.data.type === 'trigger') {
        // For Telegram trigger, get recent messages using bot token
        if (!formData.token) {
          throw new Error('Please configure Bot API Token first');
        }
        
        const response = await fetch('https://workflownode.onrender.com/api/telegram/get-updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: formData.token })
        });
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to get Telegram updates');
        }
        
        // Get the most recent message
        if (result.updates && result.updates.length > 0) {
          const latestUpdate = result.updates[result.updates.length - 1];
          setInputData(latestUpdate);
        } else {
          setInputData({ message: "No recent messages found. Send a message to your bot first." });
        }
        
      } else {
        // For action nodes, use mock data representing input from previous nodes
        const mockData = {
          aiAgent: {
            message: {
              text: "Process this text with AI",
              from: { username: "testuser" },
              chat: { id: 123456 }
            },
            previousData: {
              source: "telegram",
              timestamp: new Date().toISOString()
            }
          },
          modelNode: {
            userMessage: "Test message for the model",
            context: "User interaction"
          }
        };
        
        setInputData(mockData[node.data.type] || mockData.modelNode);
      }
      
    } catch (error) {
      setInputData({ error: error.message });
    }
    
    setIsLoading(false);
  };

  const handlePostData = async () => {
    if (!inputData) return;
    
    setIsLoading(true);
    setOutputData(null);
    
    try {
      if (node.data.type === 'modelNode' || node.data.type === 'aiAgent') {
        // Process through the node
        const response = await fetch('https://workflownode.onrender.com/api/nodes/run-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            node: {
              type: node.data.type,
              config: formData,
            },
            inputData: inputData
          })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to process data.');
        }
        
        setOutputData(result);
      } else {
        // For trigger nodes, just pass through the data
        setOutputData(inputData);
      }
    } catch (error) {
      setOutputData({ error: error.message });
    }
    setIsLoading(false);
  };

  return (
    <div className="config-panel-overlay" onClick={handleClose}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3><i className={`${node.data.icon} mr-2`}></i>{formData.label}</h3>
          <button onClick={handleClose} className="close-button">&times;</button>
        </div>
        <div className="panel-content flex gap-4">
          {/* LEFT SECTION - INPUT */}
          <div className="panel-section flex-1">
            <div className="section-header flex justify-between items-center">
              <span>INPUT</span>
              <button onClick={handleGetData} disabled={isLoading} className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600 disabled:bg-green-300">
                {isLoading ? '...' : 'GET'}
              </button>
            </div>
            <div className="section-content">
              {inputData ? (
                <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-64 overflow-y-auto">
                  <pre>{JSON.stringify(inputData, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-gray-400 text-sm text-center py-8">
                  Click GET to fetch input data
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE SECTION - PARAMETERS */}
          <div className="panel-section flex-1">
            <div className="section-header">PARAMETERS</div>
            <div className="section-content">
              <div className="form-group">
                  <label htmlFor="label">Label</label>
                  <input type="text" name="label" id="label" value={formData.label} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea name="description" id="description" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
              </div>
              
              {/* Fields for Model Node */}
              {node.data.type === 'modelNode' && (
                <>
                  <div className="form-group">
                    <label htmlFor="model">Model</label>
                    <select name="model" id="model" value={formData.model} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white">
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="gpt-4">GPT-4</option>
                    </select>
                  </div>
                   <div className="form-group">
                    <label htmlFor="apiKey">API Key</label>
                    <div className="flex items-center gap-2">
                      <input type="password" name="apiKey" id="apiKey" className="flex-grow" value={formData.apiKey} onChange={handleInputChange} placeholder="Enter your Claude API Key"/>
                      <button onClick={handleVerifyApiKey} disabled={isLoading} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300">
                        {isLoading ? '...' : 'Check'}
                      </button>
                    </div>
                    {apiKeyVerificationStatus && (
                      <div className={`mt-2 text-sm p-2 rounded-md ${apiKeyVerificationStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {apiKeyVerificationStatus.message}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Fields for AI Agent Node */}
              {node.data.type === 'aiAgent' && (
                <>
                  <div className="form-group">
                    <label htmlFor="model">Model</label>
                    <select name="model" id="model" value={formData.model} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white">
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="gpt-4">GPT-4</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="apiKey">API Key</label>
                    <div className="flex items-center gap-2">
                      <input type="password" name="apiKey" id="apiKey" className="flex-grow" value={formData.apiKey} onChange={handleInputChange} placeholder="Enter your Claude API Key"/>
                      <button onClick={handleVerifyApiKey} disabled={isLoading} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300">
                        {isLoading ? '...' : 'Check'}
                      </button>
                    </div>
                    {apiKeyVerificationStatus && (
                      <div className={`mt-2 text-sm p-2 rounded-md ${apiKeyVerificationStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {apiKeyVerificationStatus.message}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="promptTemplate">Prompt Template</label>
                    <textarea name="promptTemplate" id="promptTemplate" rows="4" value={formData.promptTemplate} onChange={handleInputChange} placeholder="You are a helpful assistant. User message: {{message.text}}" className="w-full p-2 border rounded-md"></textarea>
                    <p className="text-sm text-gray-500 mt-1">Use {"{{message.text}}"} for Telegram message content, {"{{userMessage}}"} for direct input</p>
                  </div>
                </>
              )}

              {/* RESTORED: Fields for Telegram Trigger */}
              {node.data.type === 'trigger' && (
                <div className="form-group">
                  <label htmlFor="token">Bot API Token</label>
                  <div className="flex items-center gap-2">
                    <input type="password" name="token" id="token" className="flex-grow" value={formData.token} onChange={handleInputChange} placeholder="Enter your Telegram Bot Token"/>
                    <button onClick={handleCheckToken} disabled={isLoading} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300">
                      {isLoading ? '...' : 'Check'}
                    </button>
                  </div>
                  {verificationStatus && (
                    <div className={`mt-2 text-sm p-2 rounded-md ${verificationStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {verificationStatus.ok 
                        ? `Success! Bot Name: ${verificationStatus.bot.first_name}, ID: ${verificationStatus.bot.id}`
                        : `Error: ${verificationStatus.message}`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SECTION - OUTPUT */}
          <div className="panel-section flex-1">
            <div className="section-header flex justify-between items-center">
              <span>OUTPUT</span>
              <button onClick={handlePostData} disabled={isLoading || !inputData} className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 disabled:bg-blue-300">
                {isLoading ? '...' : 'POST'}
              </button>
            </div>
            <div className="section-content">
              {node.data.type === 'modelNode' ? (
                <ChatbotInterface nodeConfig={formData} />
              ) : outputData ? (
                <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-64 overflow-y-auto">
                  <pre>{JSON.stringify(outputData, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-gray-400 text-sm text-center py-8">
                  Click POST to process data
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
