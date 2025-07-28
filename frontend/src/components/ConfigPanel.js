import React, { useState, useEffect } from 'react';

const ConfigPanel = ({ node, onClose }) => {
  const [formData, setFormData] = useState({
      label: node.data.label || '',
      description: node.data.description || '',
      token: node.data.token || ''
  });
  
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputData, setInputData] = useState(null);
  const [outputData, setOutputData] = useState(null); // State for output data

  const fetchInputData = async () => {
      try {
          const response = await fetch('http://localhost:3012/api/workflows/123/data');
          
          // Check if the response is ok (status in the range 200-299)
          if (response.ok) {
              const data = await response.json();
              setInputData(data);
          } else {
              // If not ok, try to parse error message if it's JSON, otherwise use status text
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.indexOf("application/json") !== -1) {
                  const errorData = await response.json();
                  setInputData({ error: errorData.message || 'An error occurred.' });
              } else {
                  setInputData({ error: `Server error: ${response.status} ${response.statusText}` });
              }
          }
      } catch (error) {
          console.error("Failed to fetch input data:", error);
          setInputData({ error: 'Failed to connect to the server.' });
      }
  };

  // Fetch input data when the panel opens for a trigger node
  useEffect(() => {
      if (node.data.type === 'trigger') {
          fetchInputData();
      }
  }, [node.data.type]);


  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'token') {
          setVerificationStatus(null);
      }
  };

  const handleClose = () => {
      onClose(formData);
  };

  const handleCheckToken = async () => {
      if (!formData.token) {
          setVerificationStatus({ ok: false, message: 'Please enter a token first.' });
          return;
      }
      setIsLoading(true);
      setVerificationStatus(null);
      try {
          const response = await fetch('http://localhost:3012/api/telegram/verify-token', {
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

  const handlePostOutput = () => {
      // In a real app, this would send the input data to the next node for processing
      setOutputData(inputData);
  };

  return (
    <div className="config-panel-overlay" onClick={handleClose}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3><i className={`${node.data.icon} mr-2`}></i>{formData.label}</h3>
          <button onClick={handleClose} className="close-button">&times;</button>
        </div>
        <div className="panel-content">
          {/* Left Part: Input */}
          <div className="panel-section">
            <div className="section-header">
              <span>INPUT</span>
              <button onClick={fetchInputData} className="action-button">
                <i className="fa-solid fa-sync-alt mr-1"></i> Get
              </button>
            </div>
            <div className="section-content">
              {inputData ? (
                  <pre className="text-xs bg-gray-100 p-2 rounded-md overflow-auto">
                      {JSON.stringify(inputData, null, 2)}
                  </pre>
              ) : (
                <p className="text-gray-400 text-sm">Waiting for data from the trigger...</p>
              )}
            </div>
          </div>
          
          {/* Middle Part: Parameters */}
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
              
              {node.data.label === 'Telegram Trigger' && (
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

          {/* Right Part: Output */}
          <div className="panel-section">
            <div className="section-header">
              <span>OUTPUT</span>
              <button onClick={handlePostOutput} className="action-button">
                <i className="fa-solid fa-paper-plane mr-1"></i> Post
              </button>
            </div>
            <div className="section-content">
              {outputData ? (
                  <pre className="text-xs bg-gray-100 p-2 rounded-md overflow-auto">
                      {JSON.stringify(outputData, null, 2)}
                  </pre>
              ) : (
                <p className="text-gray-400 text-sm">Click 'Post' to see the output data.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
