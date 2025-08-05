/*
=================================================================
FILE: frontend/src/config/nodeMetadata.js
=================================================================
Node Metadata Configuration
- Centralized configuration for node titles, descriptions, icons, and visual properties
- Used for dynamic ConfigPanel headers and settings descriptions
- Easily extensible for new node types
*/

export const nodeMetadata = {
  // ===== TRIGGER NODES =====
  telegram_trigger: {
    title: "Telegram Bot Trigger",
    description: "Triggers workflow when messages are received from your Telegram bot. Configure bot token to start receiving messages automatically.",
    icon: "📱",
    category: "trigger",
    color: "#0088cc",
    bgColor: "#e3f2fd"
  },

  telegram_send_message: {
    title: "Telegram Send Message",
    description: "Send messages to Telegram chats using your bot. Configure bot token, chat ID, and message content with template variable support.",
    icon: "📤",
    category: "action",
    color: "#0088cc",
    bgColor: "#e3f2fd"
  },

  webhook_trigger: {
    title: "Webhook Trigger", 
    description: "Triggers workflow when HTTP requests are received at the webhook URL. Perfect for integrating with external services.",
    icon: "🔗",
    category: "trigger", 
    color: "#4caf50",
    bgColor: "#e8f5e8"
  },

  // ===== AI/ML NODES =====
  ai_agent: {
    title: "AI Agent Processor",
    description: "Process data using Claude AI with configurable prompts and template variables. Supports drag-and-drop template creation and advanced prompt engineering.",
    icon: "🤖",
    category: "action",
    color: "#7c3aed",
    bgColor: "#f3e8ff"
  },

  model: {
    title: "AI Chat Model",
    description: "Interactive AI chat interface with conversation memory. Configure system prompts and engage in real-time conversations with Claude AI.",
    icon: "💬", 
    category: "action",
    color: "#ec4899",
    bgColor: "#fdf2f8"
  },

  llm: {
    title: "Language Model",
    description: "Legacy LLM processing node for text generation and analysis. Use AI Agent node for enhanced features.",
    icon: "🧠",
    category: "action", 
    color: "#6366f1",
    bgColor: "#eef2ff"
  },

  // ===== INTEGRATION NODES =====
  google_docs: {
    title: "Google Docs Integration",
    description: "Read, create, and update Google Docs documents with OAuth2 authentication. Supports template variables for dynamic content generation.",
    icon: "📄",
    category: "action",
    color: "#4285f4", 
    bgColor: "#e8f0fe"
  },

  data_storage: {
    title: "Data Storage",
    description: "Store and manage key-value data that can be accessed by other nodes in your workflow. Perfect for storing user preferences, product catalogs, or configuration data.",
    icon: "💾",
    category: "utility",
    color: "#ff6b35",
    bgColor: "#fff4e6"
  },

  file_converter: {
    title: "File Converter/Proxy",
    description: "Convert files from various sources (Google Drive, Base64, URLs) to Telegram-compatible URLs. Perfect for making media files accessible to Telegram bots.",
    icon: "🔄",
    category: "utility",
    color: "#8b5cf6",
    bgColor: "#f5f3ff"
  },

  linkedin: {
    title: "LinkedIn Integration",
    description: "Professional social media automation with LinkedIn. Post content, get profile data, send messages, and manage your professional presence with template variable support.",
    icon: "🔗",
    category: "social",
    color: "#0077B5",
    bgColor: "#e7f3ff"
  },

  whatsapp: {
    title: "WhatsApp Business",
    description: "Comprehensive WhatsApp Business API integration. Send text, media, templates, interactive messages, manage contacts, and handle business communications with full Meta Graph API support.",
    icon: "📱",
    category: "social",
    color: "#25D366",
    bgColor: "#e8f5e9"
  },

  instagram: {
    title: "Instagram Business",
    description: "Complete Instagram Business automation with Meta Graph API. Publish photos, videos, carousels, stories, manage comments, get insights, hashtag research, and direct messaging with advanced analytics.",
    icon: "📸",
    category: "social",
    color: "#E4405F",
    bgColor: "#fce4ec"
  },

  tiktok: {
    title: "TikTok Business",
    description: "Comprehensive TikTok Business API integration. Upload videos, publish content, get analytics, manage comments, hashtag research, creator insights, and business account management with full content automation.",
    icon: "🎵",
    category: "social",
    color: "#000000",
    bgColor: "#f5f5f5"
  },

  // ===== LOGIC NODES =====
  if: {
    title: "Conditional Logic (If)",
    description: "Route workflow execution based on conditions. Define rules to determine which path the workflow should take based on input data.",
    icon: "🔀",
    category: "logic",
    color: "#f59e0b",
    bgColor: "#fffbeb"
  },

  compare: {
    title: "Data Comparison", 
    description: "Compare two data values using various operators (equals, greater than, contains, etc.). Essential for decision-making in workflows.",
    icon: "⚖️",
    category: "logic",
    color: "#10b981",
    bgColor: "#ecfdf5"
  },

  filter: {
    title: "Data Filter",
    description: "Filter and transform arrays of data based on specified conditions. Remove unwanted items or extract specific data from collections.",
    icon: "🔍",
    category: "utility", 
    color: "#8b5cf6",
    bgColor: "#f5f3ff"
  },

  // ===== UTILITY NODES =====
  set: {
    title: "Set Variables",
    description: "Set and manipulate workflow variables. Transform data, perform calculations, or prepare data for subsequent nodes.",
    icon: "📝",
    category: "utility",
    color: "#06b6d4",
    bgColor: "#cffafe"
  },

  delay: {
    title: "Delay Timer",
    description: "Add time delays to your workflow execution. Useful for rate limiting, waiting for external processes, or scheduling operations.",
    icon: "⏱️", 
    category: "utility",
    color: "#84cc16",
    bgColor: "#f7fee7"
  },

  merge: {
    title: "Data Merger",
    description: "Combine data from multiple sources into a single output. Configure how data should be merged, appended, or processed together.",
    icon: "🔗",
    category: "utility",
    color: "#f97316", 
    bgColor: "#fff7ed"
  },

  // ===== WORKFLOW CONTROL =====
  stop_error: {
    title: "Stop on Error",
    description: "Halt workflow execution when errors occur. Configure custom error messages and define how errors should be handled.",
    icon: "🛑",
    category: "control",
    color: "#ef4444",
    bgColor: "#fef2f2"
  },

  function: {
    title: "Function Node",
    description: "Execute custom JavaScript functions within your workflow. Advanced node for developers who need custom logic and data processing.",
    icon: "⚙️",
    category: "utility",
    color: "#64748b",
    bgColor: "#f8fafc"
  }
};

// Helper function to get node metadata
export const getNodeMetadata = (nodeType) => {
  return nodeMetadata[nodeType] || {
    title: nodeType.charAt(0).toUpperCase() + nodeType.slice(1).replace(/_/g, ' '),
    description: `Configure ${nodeType.replace(/_/g, ' ')} node settings and parameters.`,
    icon: "⚡",
    category: "unknown",
    color: "#6b7280",
    bgColor: "#f9fafb"
  };
};

// Get all nodes by category
export const getNodesByCategory = () => {
  const categories = {};
  Object.entries(nodeMetadata).forEach(([nodeType, metadata]) => {
    if (!categories[metadata.category]) {
      categories[metadata.category] = [];
    }
    categories[metadata.category].push({ nodeType, ...metadata });
  });
  return categories;
};

// Category display names and colors
export const categoryMetadata = {
  trigger: {
    name: "Triggers",
    description: "Start your workflows",
    color: "#0088cc",
    icon: "🚀"
  },
  action: {
    name: "Actions", 
    description: "Process and transform data",
    color: "#7c3aed",
    icon: "⚡"
  },
  logic: {
    name: "Logic",
    description: "Control workflow flow",
    color: "#f59e0b", 
    icon: "🧮"
  },
  utility: {
    name: "Utilities",
    description: "Helper and utility functions", 
    color: "#06b6d4",
    icon: "🛠️"
  },
  control: {
    name: "Control",
    description: "Workflow control and error handling",
    color: "#ef4444",
    icon: "🎛️"
  },
  social: {
    name: "Social Media",
    description: "Social media platforms integration",
    color: "#1DA1F2",
    icon: "📱"
  }
};

export default nodeMetadata;