/*
=================================================================
FILE: frontend/src/ConfigPanel.js
=================================================================
*/
import React, { useState, useEffect, useRef } from 'react';

// This is the new, improved JSON Tree View component
const JsonTreeView = ({ data, parentKey = '', sourceNodeLabel }) => {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const onDragStart = (event, key) => {
    const expression = `{{ $('${sourceNodeLabel}').item.json.${key} }}`;
    event.dataTransfer.setData('application/n8n-variable', expression);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const renderKeys = (obj, parentKey = '') => {
    return Object.keys(obj).map(key => {
      const currentKey = parentKey ? `${parentKey}.${key}` : key;
      const value = obj[key];
      const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);

      return (
        <div key={currentKey} className="json-node">
          <details open>
            <summary className="json-key">
              <span className="key-icon">{isObject ? '📦' : '#'}</span>
              {key}
            </summary>
            <div className="json-value">
              {isObject ? (
                renderKeys(value, currentKey)
              ) : (
                <div 
                    className="draggable-key"
                    onDragStart={(e) => onDragStart(e, currentKey)}
                    draggable
                >
                    <span className="value-text">{String(value)}</span>
                </div>
              )}
            </div>
          </details>
        </div>
      );
    });
  };

  const dataToRender = data[0]?.json || data;
  return <div className="json-tree">{renderKeys(dataToRender)}</div>;
};


const ConfigPanel = ({ node, onClose }) => {
  const [formData, setFormData] = useState({
      label: node.data.label || '',
      description: node.data.description || '',
      model: node.data.model || 'claude-3-sonnet-20240229',
      apiKey: node.data.apiKey || '',
      token: node.data.token || ''
  });
  
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [apiKeyVerificationStatus, setApiKeyVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputData, setInputData] = useState(null);

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
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

  const fetchInputData = async () => {
      try {
          const response = await fetch('https://workflownode.onrender.com/api/workflows/123/data');
          if (response.ok) {
              const data = await response.json();
              setInputData(data);
          } else {
              const errorData = await response.json();
              setInputData({ error: errorData.message || 'An error occurred.' });
          }
      } catch (error) {
          setInputData({ error: 'Failed to connect to the server.' });
      }
  };

  useEffect(() => {
      if (node.data.type === 'trigger') {
          fetchInputData();
      }
  }, [node.data.type]);

  return (
    <div className="config-panel-overlay" onClick={handleClose}>
      <div className="side-panel input-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">INPUT</div>
        <div className="panel-content">
            {inputData ? (
                <JsonTreeView data={inputData} sourceNodeLabel={node.data.label} />
            ) : (
                <div className="empty-state">
                    <i className="fa-solid fa-hand-pointer text-4xl text-gray-300 mb-4"></i>
                    <h4 className="font-bold text-gray-500">Wire me up</h4>
                    <p className="text-xs text-gray-400">This node can only receive input data if you connect it to another node.</p>
                </div>
            )}
        </div>
      </div>
      <div className="main-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3><i className={`${node.data.icon} mr-2`}></i>{formData.label}</h3>
          <button onClick={() => { /* Execute Step Logic */ }} disabled={isLoading} className="execute-step-btn">
            <i className="fa-solid fa-play mr-2"></i>
            {isLoading ? 'Executing...' : 'Execute Step'}
          </button>
          <button onClick={handleClose} className="close-button">&times;</button>
        </div>
        <div className="panel-content">
            <div className="tabs">
                <button className="tab active">Parameters</button>
                <button className="tab">Settings</button>
            </div>
            <div className="parameters-content">
              <div className="form-group">
                  <label htmlFor="label">Label</label>
                  <input type="text" name="label" id="label" value={formData.label} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea name="description" id="description" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
              </div>
              
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
      </div>
      <div className="side-panel output-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">OUTPUT</div>
        <div className="panel-content empty-state">
            <p>Execute this node to view data</p>
            <button className="mock-data-btn">or set mock data</button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
