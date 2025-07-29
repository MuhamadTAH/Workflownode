/*
=================================================================
FRONTEND FILE: src/components/ConfigPanel.js (UPDATED)
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
      model: node.data.model || 'claude-3-sonnet-20240229',
      apiKey: node.data.apiKey || '',
      systemPrompt: node.data.systemPrompt || 'You are a helpful assistant.',
      promptTemplate: node.data.promptTemplate || 'Respond to: {{message.text}}',
      temperature: node.data.temperature || 0.7,
      maxTokens: node.data.maxTokens || 400,
      token: node.data.token || ''
  });
  
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [apiKeyVerificationStatus, setApiKeyVerificationStatus] = useState(null); // New state for AI API key
  const [isLoading, setIsLoading] = useState(false);
  const [inputData, setInputData] = useState(null);

  const handleInputChange = (e) => {
      const { name, value, type } = e.target;
      const finalValue = type === 'number' ? parseFloat(value) : value;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
      if (name === 'apiKey') {
          setApiKeyVerificationStatus(null);
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

  // ... (other handlers like handleCheckToken remain the same)

  return (
    <div className="config-panel-overlay" onClick={handleClose}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3><i className={`${node.data.icon} mr-2`}></i>{formData.label}</h3>
          <button onClick={handleClose} className="close-button">&times;</button>
        </div>
        <div className="panel-content">
          {/* Main Parameters Section (always visible) */}
          <div className="panel-section main-section">
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
                      <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
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

              {/* Fields for Telegram Trigger */}
              {node.data.type === 'trigger' && (
                <div className="form-group">
                  {/* ... (Telegram token form) */}
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Chatbot for Model Node, Output for others */}
          <div className="panel-section">
            {node.data.type === 'modelNode' ? (
              <ChatbotInterface nodeConfig={formData} />
            ) : (
              <>
                <div className="section-header">
                  <span>OUTPUT</span>
                  {/* ... (Post button logic) */}
                </div>
                <div className="section-content">
                  {/* ... (Output display logic) */}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
