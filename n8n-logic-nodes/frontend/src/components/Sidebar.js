/*
=================================================================
FILE: frontend/src/components/Sidebar.js
=================================================================
This component renders the sidebar with a complete list of all
available draggable nodes for the workflow.
*/
import React from 'react';

const DraggableNode = ({ nodeInfo }) => {
  const onDragStart = (event, nodeInfo) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeInfo));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex items-center p-3 mb-3 bg-white border-2 rounded-lg cursor-grab shadow-sm hover:shadow-md transition-shadow"
      onDragStart={(event) => onDragStart(event, nodeInfo)}
      draggable
    >
      <i className={`fa-solid ${nodeInfo.icon} mr-3 text-lg ${nodeInfo.color}`}></i>
      <div>
        <div className="font-bold">{nodeInfo.label}</div>
        <div className="text-xs text-gray-500">{nodeInfo.description}</div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  return (
    <aside className="w-72 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto">
      
      {/* TRIGGER NODES */}
      <div className="mb-4 font-bold text-lg text-blue-600">Trigger Nodes</div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'Telegram Trigger', 
            icon: 'fa-telegram', 
            color: 'text-blue-500',
            description: 'Start workflow from Telegram messages',
            type: 'telegramTrigger' 
        }} 
      />
      
      {/* AI NODES */}
      <div className="mb-4 mt-6 font-bold text-lg text-purple-600">AI Nodes</div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'AI Agent', 
            icon: 'fa-robot', 
            color: 'text-purple-500',
            description: 'AI processing with templates',
            type: 'aiAgent' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Model Node', 
            icon: 'fa-brain', 
            color: 'text-indigo-500',
            description: 'AI chat interface',
            type: 'modelNode' 
        }} 
      />
      
      {/* SOCIAL MEDIA NODES */}
      <div className="mb-4 mt-6 font-bold text-lg text-green-600">Social Media</div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'Telegram Send', 
            icon: 'fa-telegram', 
            color: 'text-blue-500',
            description: 'Send Telegram messages',
            type: 'telegramSendMessage' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'WhatsApp', 
            icon: 'fa-whatsapp', 
            color: 'text-green-500',
            description: 'WhatsApp integration',
            type: 'whatsapp' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Instagram', 
            icon: 'fa-instagram', 
            color: 'text-pink-500',
            description: 'Instagram integration',
            type: 'instagram' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'LinkedIn', 
            icon: 'fa-linkedin', 
            color: 'text-blue-700',
            description: 'LinkedIn integration',
            type: 'linkedin' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'TikTok', 
            icon: 'fa-tiktok', 
            color: 'text-black',
            description: 'TikTok integration',
            type: 'tiktok' 
        }} 
      />
      
      {/* UTILITY NODES */}
      <div className="mb-4 mt-6 font-bold text-lg text-gray-600">Utility Nodes</div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'Google Docs', 
            icon: 'fa-file-text', 
            color: 'text-blue-600',
            description: 'Google Docs operations',
            type: 'googleDocs' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Data Storage', 
            icon: 'fa-database', 
            color: 'text-gray-600',
            description: 'Store data for workflows',
            type: 'dataStorage' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'File Converter', 
            icon: 'fa-file-export', 
            color: 'text-orange-500',
            description: 'Convert file formats',
            type: 'fileConverter' 
        }} 
      />

      {/* LOGIC NODES */}
      <div className="mb-4 mt-6 font-bold text-lg text-red-600">Logic Nodes</div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'If', 
            icon: 'fa-sitemap', 
            color: 'text-green-500',
            description: 'Route items true/false',
            type: 'if' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Switch', 
            icon: 'fa-random', 
            color: 'text-indigo-500',
            description: 'Route by rules',
            type: 'switch',
            switchRules: [{ value1: '', operator: 'is_equal_to', value2: '' }],
            switchOptions: []
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Filter', 
            icon: 'fa-filter', 
            color: 'text-blue-500',
            description: 'Remove items by condition',
            type: 'filter' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Merge', 
            icon: 'fa-share-alt', 
            color: 'text-orange-500',
            description: 'Merge data from streams',
            type: 'merge' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Set Data', 
            icon: 'fa-edit', 
            color: 'text-teal-500',
            description: 'Create custom data fields',
            type: 'setData' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Loop Over Items', 
            icon: 'fa-sync-alt', 
            color: 'text-purple-500',
            description: 'Iterate over each item',
            type: 'loop' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Wait', 
            icon: 'fa-clock', 
            color: 'text-pink-500',
            description: 'Pause the workflow',
            type: 'wait' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Stop and Error', 
            icon: 'fa-exclamation-triangle', 
            color: 'text-yellow-500',
            description: 'Throw a workflow error',
            type: 'stopAndError' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Compare Datasets', 
            icon: 'fa-plus-square', 
            color: 'text-red-500',
            description: 'Compare two inputs',
            type: 'compare' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Execute Workflow', 
            icon: 'fa-arrow-right', 
            color: 'text-gray-500',
            description: 'Call another workflow',
            type: 'executeSubWorkflow' 
        }} 
      />
    </aside>
  );
};

export default Sidebar;
