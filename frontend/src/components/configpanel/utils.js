/*
=================================================================
FILE: frontend/src/components/configpanel/utils.js
=================================================================
Utility Functions for ConfigPanel
- Auto-save functionality
- Form change handlers
- Template processing utilities
- Helper functions
*/
import { useCallback, useRef } from 'react';

// Auto-save hook
export const useAutoSave = (formData, nodeId, setAutoSaveStatus) => {
  const debounceTimerRef = useRef(null);

  const autoSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setAutoSaveStatus('saving');
    debounceTimerRef.current = setTimeout(() => {
      try {
        // Save to sessionStorage for session persistence
        const saveKey = `node-config-${nodeId}`;
        sessionStorage.setItem(saveKey, JSON.stringify(formData));
        setAutoSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('error');
      }
    }, 1000);
  }, [formData, nodeId, setAutoSaveStatus]);

  return autoSave;
};

// Enhanced form change handler with auto-save (custom hook)
export const useFormFieldChangeHandler = (setFormData, autoSave) => {
  return useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value);
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Trigger auto-save
    autoSave();
  }, [setFormData, autoSave]);
};

// Form change handler for simple nodes
export const createFormChangeHandler = (formData, setFormData) => {
  return (event) => {
    const { name, value, type, checked } = event.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value) });
  };
};

// Condition input change handler
export const createInputChangeHandler = (formData, setFormData) => {
  return (index, event) => {
    const newConditions = [...formData.conditions];
    newConditions[index][event.target.name] = event.target.value;
    setFormData({ ...formData, conditions: newConditions });
  };
};

// Add condition handler
export const createAddConditionHandler = (formData, setFormData) => {
  return () => {
    const newConditions = [...formData.conditions, { key: '', operator: 'equals', value: '' }];
    setFormData({ ...formData, conditions: newConditions });
  };
};

// Remove condition handler
export const createRemoveConditionHandler = (formData, setFormData) => {
  return (index) => {
    const newConditions = [...formData.conditions];
    newConditions.splice(index, 1);
    setFormData({ ...formData, conditions: newConditions });
  };
};

// Test node handler
export const createTestNodeHandler = (node, formData, inputData, setIsLoading, setOutputData) => {
  return async () => {
    setIsLoading(true);
    setOutputData(null);
    try {
      let parsedInput;
      try {
        parsedInput = inputData.trim() === '' ? [] : JSON.parse(inputData);
      } catch (e) {
        throw new Error("Invalid JSON in Input data.");
      }

      const response = await fetch('http://localhost:10001/api/run-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node: {
            type: node.data.type,
            config: formData,
          },
          inputData: parsedInput,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to test node.');
      }
      setOutputData(result);

    } catch (error) {
      setOutputData({ error: error.message });
    }
    setIsLoading(false);
  };
};

// Initialize form data
export const initializeFormData = (node) => {
  return {
    // Existing simple form data (preserved)
    label: node.data.label || '',
    conditions: node.data.conditions || [{ key: '', operator: 'equals', value: '' }],
    batchSize: node.data.batchSize || 1,
    mode: node.data.mode || 'append',
    numberOfInputs: node.data.numberOfInputs || 2,
    key1: node.data.key1 || '',
    key2: node.data.key2 || '',
    rules: node.data.rules || [{ output: 0, conditions: [{ key: '', operator: 'equals', value: '' }] }],
    fallbackOutput: node.data.fallbackOutput !== undefined ? node.data.fallbackOutput : true,
    errorMessage: node.data.errorMessage || 'Workflow execution stopped due to an error.',
    delay: node.data.delay || 1000,
    workflowId: node.data.workflowId || '',
    
    // Advanced features added back
    description: node.data.description || '',
    note: node.data.note || '',
    model: node.data.model || 'claude-3-5-sonnet-20241022',
    apiKey: node.data.apiKey || '',
    claudeApiKey: node.data.claudeApiKey || '', // Fix: Add claudeApiKey field for AI Agent nodes
    claudeModel: node.data.claudeModel || 'claude-3-5-sonnet-20241022', // Fix: Add claudeModel field
    maxTokens: node.data.maxTokens || 1000, // Fix: Add maxTokens field for AI Agent settings
    temperature: node.data.temperature || 0.7, // Fix: Add temperature field for AI Agent settings
    systemPrompt: node.data.systemPrompt || '',
    userPrompt: node.data.userPrompt || '{{message}}',
    displayFormat: node.data.displayFormat || 'chat',
    promptTemplate: node.data.promptTemplate || 'You are a helpful assistant. User message: {{message.text}}',
    userId: node.data.userId || 'default',
    botToken: node.data.botToken || '',
    tokenStatus: node.data.tokenStatus || null, // 'valid', 'invalid', null
    tokenChecking: false,
    tokenError: node.data.tokenError || null,
    botInfo: node.data.botInfo || null,
    chatId: node.data.chatId || '',
    message: node.data.message || '',
    messageText: node.data.messageText || '',
    messageType: node.data.messageType || 'text',
    parseMode: node.data.parseMode || '',
    disableWebPagePreview: node.data.disableWebPagePreview || false,
    disableNotification: node.data.disableNotification || false,
    protectContent: node.data.protectContent || false,
    
    // Photo fields
    photoUrl: node.data.photoUrl || '',
    photoCaption: node.data.photoCaption || '',
    
    // Video fields
    videoUrl: node.data.videoUrl || '',
    videoCaption: node.data.videoCaption || '',
    videoDuration: node.data.videoDuration || '',
    
    // Audio fields
    audioUrl: node.data.audioUrl || '',
    audioTitle: node.data.audioTitle || '',
    audioPerformer: node.data.audioPerformer || '',
    audioDuration: node.data.audioDuration || '',
    
    // Voice fields
    voiceUrl: node.data.voiceUrl || '',
    voiceDuration: node.data.voiceDuration || '',
    
    // Document fields
    documentCaption: node.data.documentCaption || '',
    
    // Animation fields
    animationUrl: node.data.animationUrl || '',
    animationCaption: node.data.animationCaption || '',
    
    // Sticker fields
    stickerFileId: node.data.stickerFileId || '',
    
    // Location fields
    latitude: node.data.latitude || '',
    longitude: node.data.longitude || '',
    livePeriod: node.data.livePeriod || '',
    
    // Contact fields
    contactPhone: node.data.contactPhone || '',
    contactFirstName: node.data.contactFirstName || '',
    contactLastName: node.data.contactLastName || '',
    contactUserId: node.data.contactUserId || '',
    
    // Poll fields
    pollQuestion: node.data.pollQuestion || '',
    pollOptions: node.data.pollOptions || 'Red\nBlue\nGreen\nYellow',
    pollType: node.data.pollType || 'regular',
    pollAnonymous: node.data.pollAnonymous !== false,
    pollMultipleAnswers: node.data.pollMultipleAnswers || false,
    quizCorrectOption: node.data.quizCorrectOption || 0,
    clientId: node.data.clientId || '',
    clientSecret: node.data.clientSecret || '',
    action: node.data.action || 'getDocument',
    documentUrl: node.data.documentUrl || '',
    content: node.data.content || '',
    title: node.data.title || '',
    dataStorage: node.data.dataStorage || {},
    
    // File Converter fields
    inputType: node.data.inputType || 'google_drive',
    googleDriveUrl: node.data.googleDriveUrl || '',
    base64Data: node.data.base64Data || '',
    fileExtension: node.data.fileExtension || '',
    fileUrl: node.data.fileUrl || '',
    localFilePath: node.data.localFilePath || '',
    outputFormat: node.data.outputFormat || 'original',
    hostingService: node.data.hostingService || 'temp_server',
    imgbbApiKey: node.data.imgbbApiKey || '',
    imgurClientId: node.data.imgurClientId || '',
    imageQuality: node.data.imageQuality || 85,
    maxFileSizeMB: node.data.maxFileSizeMB || 50,
    cacheDurationHours: node.data.cacheDurationHours || 24
  };
};