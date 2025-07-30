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

const Sidebar = ({ onSave, onRestore, onActivate }) => {
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
              label: 'Telegram Trigger', 
              icon: 'fa-brands fa-telegram', 
              description: 'Starts workflow on a new message',
              type: 'trigger' 
          }} 
        />
      </div>
      <div className="mt-auto">
        <div className="mb-4 font-bold text-lg text-gray-700">Actions</div>
        <button onClick={onActivate} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors mb-2">
          Activate Flow
        </button>
        <button onClick={onSave} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors mb-2">
          Save Flow
        </button>
        <button onClick={onRestore} className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
          Load Flow
        </button>
        <div className="text-xs text-gray-400 mt-4">
          <p><b>Multi-Select:</b> Hold Shift + Click nodes.</p>
          <p><b>Copy:</b> Ctrl/Cmd + C</p>
          <p><b>Paste:</b> Ctrl/Cmd + V</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
