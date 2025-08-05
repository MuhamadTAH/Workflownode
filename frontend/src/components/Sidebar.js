/*
=================================================================
FRONTEND FILE: src/components/Sidebar.js (UPDATED)
=================================================================
*/
import React from 'react';

const DraggableNode = ({ nodeInfo }) => {
  const onDragStart = (event, nodeInfo) => {
    const nodeDataString = JSON.stringify(nodeInfo);
    event.dataTransfer.setData('application/reactflow', nodeDataString);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex items-center bg-gray-50 p-3 border-2 border-gray-300 rounded-lg cursor-grab shadow-sm hover:shadow-md transition-shadow mb-4"
      onDragStart={(event) => onDragStart(event, nodeInfo)}
      draggable
    >
      <i className={`${nodeInfo.icon} mr-3 text-lg text-gray-600`}></i>
      <span className="font-bold text-gray-800">{nodeInfo.label}</span>
    </div>
  );
};

const Sidebar = ({ onSave, onRestore, onActivate, onDeactivate }) => {
  return (
    <aside className="border-r-2 border-gray-200 p-4 text-sm bg-gray-50 w-72 h-screen shadow-lg z-10 flex flex-col">
      <div>
        <div className="mb-4 font-bold text-lg text-gray-700">Nodes</div>
        <div className="text-gray-500 mb-6">Drag nodes to the canvas to build your workflow.</div>

        {/* NEW: Added the Model Node to the sidebar */}
        <DraggableNode 
          nodeInfo={{ 
              label: 'Model Node', 
              icon: 'fa-solid fa-comments', 
              description: 'Chat with an AI model',
              type: 'modelNode' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'AI Agent', 
              icon: 'fa-solid fa-robot', 
              description: 'Process input using an LLM',
              type: 'aiAgent'
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Google Docs', 
              icon: 'fa-solid fa-file-text', 
              description: 'Read, write, or create Google Docs',
              type: 'googleDocs'
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Data Storage', 
              icon: 'fa-solid fa-database', 
              description: 'Store and retrieve personal data',
              type: 'dataStorage'
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'File Converter', 
              icon: 'fa-solid fa-file-arrow-up', 
              description: 'Convert files to Telegram-compatible URLs',
              type: 'fileConverter'
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Telegram Send Message', 
              icon: 'fa-brands fa-telegram', 
              description: 'Send messages to Telegram bot chats',
              type: 'telegramSendMessage'
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Telegram Trigger', 
              icon: 'fa-brands fa-telegram', 
              description: 'Starts workflow on a new message',
              type: 'trigger' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'LinkedIn', 
              icon: 'fa-brands fa-linkedin', 
              description: 'Post content, get profile data, send messages on LinkedIn',
              type: 'linkedin' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'WhatsApp Business', 
              icon: 'fa-brands fa-whatsapp', 
              description: 'Send messages, media, templates, and interactive content via WhatsApp',
              type: 'whatsapp' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Instagram Business', 
              icon: 'fa-brands fa-instagram', 
              description: 'Publish content, manage interactions, stories, and analyze Instagram performance',
              type: 'instagram' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'TikTok Business', 
              icon: 'fa-brands fa-tiktok', 
              description: 'Upload videos, publish content, get analytics, and manage TikTok business account',
              type: 'tiktok' 
          }} 
        />

        {/* Logic Nodes from N8N Integration */}
        <div className="mt-6 mb-4 font-bold text-lg text-gray-700">Logic Nodes</div>
        <DraggableNode 
          nodeInfo={{ 
              label: 'If', 
              icon: 'fa-solid fa-sitemap', 
              description: 'Route items to different branches (true/false)',
              type: 'if' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Switch', 
              icon: 'fa-solid fa-random', 
              description: 'Route items based on multiple conditions',
              type: 'switch' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Filter', 
              icon: 'fa-solid fa-filter', 
              description: 'Remove items matching conditions',
              type: 'filter' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Merge', 
              icon: 'fa-solid fa-share-alt', 
              description: 'Combine data from multiple sources',
              type: 'merge' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Set Data', 
              icon: 'fa-solid fa-database', 
              description: 'Create custom key-value pairs',
              type: 'setData' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Loop', 
              icon: 'fa-solid fa-sync-alt', 
              description: 'Split data into batches and iterate',
              type: 'loop' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Wait', 
              icon: 'fa-solid fa-clock', 
              description: 'Pause workflow execution for specified time',
              type: 'wait' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Stop and Error', 
              icon: 'fa-solid fa-exclamation-triangle', 
              description: 'Terminate workflow with custom error',
              type: 'stopAndError' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Compare Datasets', 
              icon: 'fa-solid fa-balance-scale', 
              description: 'Compare two datasets for differences',
              type: 'compareDatasets' 
          }} 
        />
        <DraggableNode 
          nodeInfo={{ 
              label: 'Execute Sub Workflow', 
              icon: 'fa-solid fa-play-circle', 
              description: 'Run nested workflows',
              type: 'executeSubWorkflow' 
          }} 
        />
      </div>
      <div className="mt-auto">
        <div className="mb-4 font-bold text-lg text-gray-700">Actions</div>
        <button onClick={onActivate} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors mb-2">
          🚀 Activate Flow
        </button>
        <button onClick={onDeactivate} className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors mb-2">
          ⏹️ Deactivate Flow
        </button>
        <button onClick={onSave} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors mb-2">
          💾 Save Flow
        </button>
        <button onClick={onRestore} className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors mb-2">
          📁 Load Flow
        </button>
        <div className="text-xs text-gray-400 mt-4">
          <p><b>🚀 Activate:</b> Enable auto-execution when Telegram messages arrive</p>
          <p><b>⏹️ Deactivate:</b> Stop auto-execution (manual mode)</p>
          <p><b>Multi-Select:</b> Hold Shift + Click nodes</p>
          <p><b>Copy:</b> Ctrl/Cmd + C | <b>Paste:</b> Ctrl/Cmd + V</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
