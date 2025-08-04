/*
=================================================================
FILE: frontend/src/components/ConfigPanel.js (UPDATED & COMPLETE)
=================================================================
This is the complete and fully functional ConfigPanel component,
including all node variations and the expression system with
drag-and-drop functionality.
*/
import React, { useState, useEffect } from 'react';

// Helper function to resolve expressions like {{ a.b }}
const resolveExpression = (expression, data) => {
    if (!expression || typeof expression !== 'string' || !data) return expression;
    // This regex finds all instances of {{ path.to.key }}
    return expression.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        const keys = path.trim().split('.');
        let current = data;
        for (let i = 0; i < keys.length; i++) {
            if (current === null || typeof current !== 'object' || !(keys[i] in current)) {
                return match; // Return original {{...}} if path is invalid
            }
            current = current[keys[i]];
        }
        return current;
    });
};


// Reusable component for a single draggable JSON key
const JsonKey = ({ path, value }) => {
    const onDragStart = (e) => {
        // Use 'text/plain' for broader browser compatibility
        e.dataTransfer.setData('text/plain', `{{${path}}}`);
    };
    return (
        <div draggable onDragStart={onDragStart} className="draggable-key">
            <strong>{path.split('.').pop()}:</strong> {JSON.stringify(value)}
        </div>
    );
};

// Reusable component to display the JSON tree view
const JsonTreeView = ({ data, parentPath = '' }) => {
    if (data === null || typeof data !== 'object') {
        return null;
    }
    return (
        <div className="json-tree">
            {Object.entries(data).map(([key, value]) => {
                const currentPath = parentPath ? `${parentPath}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return (
                        <details key={currentPath} className="json-node" open>
                            <summary className="json-key">{key}</summary>
                            <div className="json-value">
                                <JsonTreeView data={value} parentPath={currentPath} />
                            </div>
                        </details>
                    );
                }
                return <JsonKey key={currentPath} path={currentPath} value={value} />;
            })}
        </div>
    );
};


// Enhanced input component with drag-drop and live preview
const ExpressionInput = ({ name, value, onChange, inputData, placeholder, isTextarea = false }) => {
    const [resolvedValue, setResolvedValue] = useState('');
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    useEffect(() => {
        if (inputData && value && typeof value === 'string' && value.includes('{{')) {
            const resolved = resolveExpression(value, inputData[0]); // Assuming inputData is an array
            setResolvedValue(resolved);
        } else {
            setResolvedValue('');
        }
    }, [value, inputData]);

    const handleDrop = (e) => {
        e.preventDefault();
        const path = e.dataTransfer.getData('text/plain');
        if (path) {
            const newValue = e.target.value ? `${e.target.value} ${path}` : path;
            onChange({ target: { name: name, value: newValue } });
        }
        setIsDraggingOver(false);
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const InputComponent = isTextarea ? 'textarea' : 'input';

    return (
        <div className="expression-input-wrapper">
            <InputComponent
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={isDraggingOver ? 'dragging-over' : ''}
                rows={isTextarea ? 4 : undefined}
            />
            {resolvedValue && <div className="live-preview">{resolvedValue}</div>}
        </div>
    );
};


const ConfigPanel = ({ node, nodes, edges, onClose }) => {
  const [formData, setFormData] = useState({
      label: node.data.label || '',
      description: node.data.description || '',
      fieldsToMatch: node.data.fieldsToMatch || [{ key1: '', key2: '' }],
      resumeCondition: node.data.resumeCondition || 'afterTimeInterval',
      waitAmount: node.data.waitAmount || 5,
      waitUnit: node.data.waitUnit || 'seconds',
      conditions: node.data.conditions || [{ value1: '', operator: 'is_equal_to', value2: '' }],
      combinator: node.data.combinator || 'AND',
      ignoreCase: node.data.ignoreCase || false,
      errorType: node.data.errorType || 'errorMessage',
      errorMessage: node.data.errorMessage || 'An error occurred!',
      switchRules: node.data.switchRules || [{ value1: '', operator: 'is_equal_to', value2: '' }],
      switchOptions: node.data.switchOptions || [],
      source: node.data.source || 'database',
      workflow: node.data.workflow || 'fromList',
      workflowId: node.data.workflowId || '',
      mode: node.data.mode || 'runOnce',
      mergeMode: node.data.mergeMode || 'append',
      batchSize: node.data.batchSize || 1,
      fields: node.data.fields || [{ key: '', value: '' }],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('parameters');
  const [inputData, setInputData] = useState(node.data.inputData || null);
  const [outputData, setOutputData] = useState(node.data.outputData || null);

  const handleInputChange = (e, index) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    if (['value1', 'operator', 'value2'].includes(name) && (node.data.type === 'if' || node.data.type === 'filter')) {
        const newConditions = formData.conditions.map((cond, i) => {
            if (i === index) { return { ...cond, [name]: val }; }
            return cond;
        });
        setFormData(prev => ({ ...prev, conditions: newConditions }));
    } else if (['value1', 'operator', 'value2'].includes(name) && node.data.type === 'switch') {
        const newRules = formData.switchRules.map((rule, i) => {
            if (i === index) { return { ...rule, [name]: val }; }
            return rule;
        });
        setFormData(prev => ({ ...prev, switchRules: newRules }));
    } else if (name === 'key1' || name === 'key2') {
        const newFields = formData.fieldsToMatch.map((field, i) => {
            if (i === index) { return { ...field, [name]: val }; }
            return field;
        });
        setFormData(prev => ({ ...prev, fieldsToMatch: newFields }));
    } else if (name === 'key' || name === 'value') {
        const newFields = formData.fields.map((field, i) => {
            if (i === index) { return { ...field, [name]: val }; }
            return field;
        });
        setFormData(prev => ({ ...prev, fields: newFields }));
    } else {
        setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleAddDataField = () => {
    setFormData(prev => ({ ...prev, fields: [...prev.fields, { key: '', value: '' }] }));
  };
  const handleRemoveDataField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, fields: newFields }));
  };
  const handleAddCondition = () => {
    setFormData(prev => ({ ...prev, conditions: [...prev.conditions, { value1: '', operator: 'is_equal_to', value2: '' }] }));
  };
  const handleRemoveCondition = (index) => {
    const newConditions = formData.conditions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, conditions: newConditions }));
  };
  const handleAddSwitchRule = () => {
    setFormData(prev => ({ ...prev, switchRules: [...prev.switchRules, { value1: '', operator: 'is_equal_to', value2: '' }] }));
  };
  const handleRemoveSwitchRule = (index) => {
    const newRules = formData.switchRules.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, switchRules: newRules }));
  };
  const handleInsertSwitchRule = (index) => {
    const newRules = [...formData.switchRules];
    newRules.splice(index + 1, 0, { value1: '', operator: 'is_equal_to', value2: '' });
    setFormData(prev => ({ ...prev, switchRules: newRules }));
  };
  const handleOptionToggle = (option) => {
    const currentIndex = formData.switchOptions.indexOf(option);
    const newOptions = [...formData.switchOptions];
    if (currentIndex === -1) { newOptions.push(option); } 
    else { newOptions.splice(currentIndex, 1); }
    setFormData(prev => ({ ...prev, switchOptions: newOptions }));
  };

  const handleClose = () => {
    const allUpdatedData = { ...formData, inputData, outputData };
    onClose(allUpdatedData);
  };
  
  const handleGetData = () => {
    // Special handling for merge node - collect data from all connected nodes
    if (node.data.type === 'merge') {
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        if (incomingEdges.length === 0) {
            setInputData({ message: "No nodes are connected to the input." });
            return;
        }

        const mergedInputData = {};
        let hasValidData = false;

        incomingEdges.forEach((edge, index) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (sourceNode && sourceNode.data.outputData) {
                // Use the source handle ID if available, otherwise use index
                const outputKey = edge.sourceHandle || `output${index + 1}`;
                mergedInputData[outputKey] = sourceNode.data.outputData;
                hasValidData = true;
                console.log(`Data fetched from '${sourceNode.data.label}' (${outputKey}):`, sourceNode.data.outputData);
            }
        });

        if (!hasValidData) {
            setInputData({ message: "Connected nodes have not been executed or have no output data." });
            return;
        }

        setInputData(mergedInputData);
        console.log('All merged input data:', mergedInputData);
    } else {
        // Original logic for non-merge nodes
        const incomingEdge = edges.find(edge => edge.target === node.id);
        if (!incomingEdge) {
            setInputData({ message: "No node is connected to the input." });
            return;
        }
        const sourceNode = nodes.find(n => n.id === incomingEdge.source);
        if (!sourceNode || !sourceNode.data.outputData) {
            setInputData({ message: `Previous node (${sourceNode?.data.label || 'Unknown'}) has not been executed or has no output data.` });
            return;
        }
        setInputData(sourceNode.data.outputData);
        console.log(`Data fetched from '${sourceNode.data.label}':`, sourceNode.data.outputData);
    }
  };

  const handlePostData = async () => {
    setIsLoading(true);
    setOutputData(null);

    if (node.data.type === 'setData') {
        const output = {};
        formData.fields.forEach(field => {
            if (field.key) {
                output[field.key] = field.value;
            }
        });
        setOutputData([output]);
        setIsLoading(false);
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/nodes/run-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                node: { type: node.data.type, config: formData },
                inputData: inputData
            })
        });
        const result = await response.json();
        if (!response.ok) { throw new Error(result.message || 'Execution failed.'); }
        setOutputData(result);
        console.log("Node execution successful. Output:", result);
    } catch (error) {
        console.error("Error executing node:", error);
        setOutputData({ error: error.message });
    }
    setIsLoading(false);
  };
  
  return (
    <div className="config-panel-overlay" onClick={handleClose}>
        <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
                <span>INPUT</span>
                <button className="side-panel-btn" onClick={handleGetData} disabled={node.data.type === 'setData'}>GET</button>
            </div>
            <div className="panel-content-area data-panel">
                {inputData ? (
                    node.data.type === 'merge' && typeof inputData === 'object' && !Array.isArray(inputData) ? (
                        <JsonTreeView data={inputData} />
                    ) : (
                        <JsonTreeView data={inputData[0]} />
                    )
                ) : (
                    <div className="empty-state">
                        <i className="fa-solid fa-hand-pointer text-4xl mb-4"></i>
                        <h4 className="font-bold">Wire me up</h4>
                        <p>This node can receive input data from connected nodes or use the GET button to fetch test data.</p>
                    </div>
                )}
            </div>
        </div>
        <div className="main-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
                <h3><i className={`${node.data.icon} mr-2`}></i>{formData.label}</h3>
                <div className="flex items-center">
                    <span className="saved-status"><i className="fa-solid fa-check mr-2"></i>Saved</span>
                    <button className="execute-step-btn" disabled={isLoading} onClick={handlePostData}>Execute Step</button>
                    <button onClick={handleClose} className="close-button">&times;</button>
                </div>
            </div>
            <div className="tabs">
                <button className={`tab ${activeTab === 'parameters' ? 'active' : ''}`} onClick={() => setActiveTab('parameters')}>Parameters</button>
                <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
            </div>
            <div className="panel-content-area">
                {activeTab === 'parameters' && (
                    <div className="parameters-content">
                        <div className="description-box">
                            <i className={`fa-solid ${node.data.icon} mr-3 text-lg ${node.data.color}`}></i>
                            <div>
                                <div className="font-bold text-gray-800">{node.data.label}</div>
                                <p className="text-sm text-gray-600">{node.data.description}</p>
                            </div>
                        </div>
                        
                        {node.data.type === 'compare' && (
                            <div className="form-group mt-6">
                                <label>Fields to Match</label>
                                <p className="text-sm text-gray-500 mb-4">Define pairs of keys to match items between Input 1 and Input 2.</p>
                                {formData.fieldsToMatch.map((field, index) => (
                                    <div key={index} className="key-value-row">
                                        <ExpressionInput name="key1" value={field.key1} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="Key from Input 1" />
                                        <ExpressionInput name="key2" value={field.key2} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="Key from Input 2" />
                                        <button onClick={() => handleRemoveDataField(index)} className="remove-field-btn">&times;</button>
                                    </div>
                                ))}
                                <button onClick={handleAddDataField} className="add-field-btn"><i className="fa-solid fa-plus mr-2"></i> Add fields to match</button>
                            </div>
                        )}

                        {node.data.type === 'wait' && (
                            <><div className="form-group"><label htmlFor="resumeCondition">Resume</label><div className="custom-select-wrapper"><select name="resumeCondition" id="resumeCondition" value={formData.resumeCondition} onChange={handleInputChange}><option value="afterTimeInterval">After Time Interval</option><option value="atSpecifiedTime">At Specified Time</option><option value="onWebhookCall">On Webhook Call</option><option value="onFormSubmitted">On Form Submitted</option></select></div></div>{formData.resumeCondition === 'afterTimeInterval' && (<><div className="form-group"><label htmlFor="waitAmount">Wait Amount</label><ExpressionInput name="waitAmount" value={formData.waitAmount} onChange={handleInputChange} inputData={inputData} /></div><div className="form-group"><label htmlFor="waitUnit">Wait Unit</label><div className="custom-select-wrapper"><select name="waitUnit" id="waitUnit" value={formData.waitUnit} onChange={handleInputChange}><option value="seconds">Seconds</option><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div></div></>)}</>
                        )}

                        {(node.data.type === 'if' || node.data.type === 'filter') && (
                            <div className="form-group mt-6">
                                <label>Conditions</label>
                                {formData.conditions.map((cond, index) => (<div key={index}>{node.data.type === 'if' && index > 0 && (<div className="combinator-row"><select name="combinator" value={formData.combinator} onChange={handleInputChange}><option value="AND">AND</option><option value="OR">OR</option></select></div>)}<div className="condition-row"><ExpressionInput name="value1" value={cond.value1} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="value1" /><div className="operator-select-wrapper"><select name="operator" value={cond.operator} onChange={(e) => handleInputChange(e, index)}><option value="is_equal_to">is equal to</option><option value="is_not_equal_to">is not equal to</option><option value="contains">contains</option><option value="greater_than">is greater than</option><option value="less_than">is less than</option></select></div><ExpressionInput name="value2" value={cond.value2} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="value2" /><button onClick={() => handleRemoveCondition(index)} className="remove-field-btn">&times;</button></div></div>))}
                                <button onClick={handleAddCondition} className="add-field-btn"><i className="fa-solid fa-plus mr-2"></i> Add condition</button>
                                {node.data.type === 'if' && <div className="form-group mt-6"><label>Options</label><div className="toggle-option"><label htmlFor="ignoreCase" className="toggle-label">Ignore Case</label><div className="toggle-switch"><input type="checkbox" name="ignoreCase" id="ignoreCase" checked={formData.ignoreCase} onChange={handleInputChange} /><span className="slider"></span></div></div></div>}
                            </div>
                        )}

                        {node.data.type === 'stopAndError' && (
                            <><div className="form-group"><label htmlFor="errorType">Error Type</label><div className="custom-select-wrapper"><select name="errorType" id="errorType" value={formData.errorType} onChange={handleInputChange}><option value="errorMessage">Error Message</option><option value="errorObject">Error Object</option></select></div></div>{formData.errorType === 'errorMessage' && (<div className="form-group"><label htmlFor="errorMessage">Error Message</label><ExpressionInput name="errorMessage" value={formData.errorMessage} onChange={handleInputChange} inputData={inputData} isTextarea={true} /></div>)}{formData.errorType === 'errorObject' && (<div className="empty-state"><p>Configuration for Error Object is not yet implemented.</p></div>)}</>
                        )}

                        {node.data.type === 'switch' && (
                            <div className="form-group mt-6">
                                <label>Routing Rules</label>
                                {formData.switchRules.map((rule, index) => (
                                    <div key={index} className="rule-box">
                                        <div className="rule-number">{index + 1}</div>
                                        <div className="rule-inputs">
                                            <ExpressionInput name="value1" value={rule.value1} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="value1" />
                                            <div className="operator-select-wrapper">
                                                <select name="operator" value={rule.operator} onChange={(e) => handleInputChange(e, index)}>
                                                    <option value="is_equal_to">is equal to</option>
                                                    <option value="is_not_equal_to">is not equal to</option>
                                                    <option value="contains">contains</option>
                                                    <option value="does_not_contain">does not contain</option>
                                                    <option value="starts_with">starts with</option>
                                                    <option value="ends_with">ends with</option>
                                                </select>
                                            </div>
                                            <ExpressionInput name="value2" value={rule.value2} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="value2" />
                                        </div>
                                        <div className="rule-actions">
                                            <button onClick={() => handleInsertSwitchRule(index)} className="rule-action-btn">+</button>
                                            <button onClick={() => handleRemoveSwitchRule(index)} className="remove-field-btn">&times;</button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleAddSwitchRule} className="add-field-btn"><i className="fa-solid fa-plus mr-2"></i> Add Routing Rule</button>
                                <div className="form-group mt-6"><label>Options</label><div className="toggle-option"><label htmlFor="fallbackOutput" className="toggle-label">Fallback Output</label><div className="toggle-switch"><input type="checkbox" id="fallbackOutput" checked={formData.switchOptions.includes('fallbackOutput')} onChange={() => handleOptionToggle('fallbackOutput')} /><span className="slider"></span></div></div><div className="toggle-option mt-2"><label htmlFor="ignoreCaseSwitch" className="toggle-label">Ignore Case</label><div className="toggle-switch"><input type="checkbox" id="ignoreCaseSwitch" checked={formData.switchOptions.includes('ignoreCase')} onChange={() => handleOptionToggle('ignoreCase')} /><span className="slider"></span></div></div></div>
                            </div>
                        )}

                        {node.data.type === 'executeSubWorkflow' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="source">Source</label>
                                    <div className="custom-select-wrapper">
                                        <select name="source" id="source" value={formData.source} onChange={handleInputChange}>
                                            <option value="database">Database</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="workflow">Workflow</label>
                                    <div className="flex gap-2">
                                        <div className="custom-select-wrapper flex-shrink-0">
                                            <select name="workflow" id="workflow" value={formData.workflow} onChange={handleInputChange}>
                                                <option value="fromList">From List</option>
                                            </select>
                                        </div>
                                        <div className="custom-select-wrapper flex-grow">
                                            <select name="workflowId" id="workflowId" value={formData.workflowId} onChange={handleInputChange}>
                                                <option value="">Choose...</option>
                                                <option value="wf_123">Customer Onboarding</option>
                                                <option value="wf_456">Daily Report Generation</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mode">Mode</label>
                                    <div className="custom-select-wrapper">
                                        <select name="mode" id="mode" value={formData.mode} onChange={handleInputChange}>
                                            <option value="runOnce">Run once with all items</option>
                                            <option value="runForEach">Run for each item</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {node.data.type === 'merge' && (
                            <div className="form-group">
                                <label htmlFor="mergeMode">Mode</label>
                                <div className="custom-select-wrapper">
                                    <select name="mergeMode" id="mergeMode" value={formData.mergeMode} onChange={handleInputChange}>
                                        <option value="append">Append</option>
                                        <option value="mergeByKey">Merge By Key</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {node.data.type === 'loop' && (
                            <div className="form-group">
                                <label htmlFor="batchSize">Batch Size</label>
                                <ExpressionInput name="batchSize" value={formData.batchSize} onChange={handleInputChange} inputData={inputData} />
                            </div>
                        )}

                        {node.data.type === 'setData' && (
                            <div className="form-group mt-6">
                                <label>Data Fields</label>
                                <p className="text-sm text-gray-500 mb-4">Define the key-value pairs for the data you want to create.</p>
                                {formData.fields.map((field, index) => (
                                    <div key={index} className="key-value-row">
                                        <ExpressionInput name="key" value={field.key} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="Key" />
                                        <ExpressionInput name="value" value={field.value} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="Value" />
                                        <button onClick={() => handleRemoveDataField(index)} className="remove-field-btn">&times;</button>
                                    </div>
                                ))}
                                <button onClick={handleAddDataField} className="add-field-btn"><i className="fa-solid fa-plus mr-2"></i> Add Field</button>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'settings' && (
                    <div className="parameters-content">
                      <div className="form-group"><label htmlFor="label">Label</label><input type="text" name="label" id="label" value={formData.label} onChange={handleInputChange} placeholder="Enter a custom node label"/></div>
                      <div className="form-group"><label htmlFor="description">Description</label><textarea name="description" id="description" rows="4" value={formData.description} onChange={handleInputChange} placeholder="Add custom notes or a description for this node..."></textarea></div>
                    </div>
                )}
            </div>
        </div>
        <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
                <span>OUTPUT</span>
                <button className="side-panel-btn" onClick={handlePostData}>POST</button>
            </div>
            <div className="panel-content-area data-panel">
                {isLoading ? (<div className="empty-state">Loading...</div>) : outputData ? (<pre><code className={outputData.error ? 'error-json' : ''}>{JSON.stringify(outputData, null, 2)}</code></pre>) : (<div className="empty-state"><i className="fa-solid fa-play text-4xl mb-4"></i><h4 className="font-bold">Execute this node to view data</h4><button className="mock-data-btn">or set mock data</button></div>)}
            </div>
        </div>
    </div>
  );
};

export default ConfigPanel;
