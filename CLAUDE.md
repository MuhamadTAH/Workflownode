# Workflow Node Project - Claude AI Documentation

## Project Overview
This is a **workflow automation tool** with a React frontend and Express backend, similar to Zapier or n8n. It provides a visual workflow builder for creating automation workflows with drag-and-drop nodes.

### Architecture
- **Frontend**: React app with ReactFlow for visual workflow editing
- **Backend**: Express.js API with modular route structure  
- **Database**: Node-based execution engine with credentials management
- **Deployment**: Frontend runs locally, Backend deployed on Render at `https://workflownode.onrender.com`

## Key Features
- **Visual workflow builder** with drag-and-drop interface
- **Node-based automation** system (triggers → actions)
- **AI integration** with Claude API for intelligent responses
- **Telegram bot integration** for messaging workflows
- **Real-time chatbot interface** within model nodes
- **Webhook handling** for external integrations
- **🆕 Google Docs integration** with OAuth2 authentication
- **🆕 Drag-and-drop template variables** for dynamic prompts
- **🆕 Live template preview** with real JSON data
- **🆕 Advanced node chaining** with persistent data flow

## Node Types

### 1. Trigger Nodes
- **Telegram Trigger** (`src/nodes/triggers/telegramTrigger.js`)
  - Starts workflows when Telegram messages are received
  - Webhook-based integration with Telegram Bot API
  - **Auto-deletes webhooks** to prevent conflicts with getUpdates
  - Output: Message data from Telegram webhook
  - **Real-time data fetching** from Telegram API

### 2. Action Nodes  
- **Model Node** (`src/nodes/actions/modelNode.js`)
  - AI chatbot interface using Claude API
  - Real-time chat within configuration panel
  - Input: User messages | Output: AI responses
  - **3-column ConfigPanel**: Input | Parameters | Output

- **AI Agent Node** (`src/nodes/actions/aiAgentNode.js`) 
  - LLM processing with configurable prompts
  - **Advanced template system** with nested JSON support
  - **Template variable replacement** (e.g., `{{message.text}}` → actual text)
  - Real Claude API integration instead of mock responses

- **Google Docs Node** (`src/nodes/actions/googleDocsNode.js`)
  - **Complete Google Drive integration** with OAuth2 authentication
  - **Three actions**: Get Document, Update Document, Create Document
  - **Template variable support** for dynamic content creation
  - **Real-time authentication status** with connect/disconnect UI
  - **Document URL parsing** and automatic ID extraction
  - **Secure credential management** via environment variables

## Major Features Added

### 🔥 3-Column ConfigPanel Layout
**Problem**: Users needed better visibility of data flow
**Solution**: Redesigned ConfigPanel with three sections:
- **LEFT**: INPUT section with GET button to fetch data
- **MIDDLE**: PARAMETERS configuration
- **RIGHT**: OUTPUT section with POST button to process data

### 🔥 Drag-and-Drop Template Variables
**Problem**: Users needed easy way to create dynamic prompts
**Solution**: Implemented drag-and-drop functionality (`ConfigPanel.js:43-114`):
- **Draggable JSON fields** with visual feedback
- **Droppable text inputs** with hover effects
- **Template variable creation** by dragging fields like `message.text`
- **Smart CSS styling** for drag/drop interactions

### 🔥 Live Template Preview
**Problem**: Users couldn't see how templates would look with real data
**Solution**: Added live preview system (`ConfigPanel.js:117-175`):
- **Real-time preview** under text inputs when focused
- **Template processing** with actual JSON data
- **Visual feedback** with gradient styling
- **Error handling** for unresolved variables

### 🔥 Real Node Chaining
**Problem**: Nodes couldn't access output from previous connected nodes
**Solution**: Implemented complete node chaining system:
- **Data persistence** in localStorage between ConfigPanel sessions
- **Connection analysis** using React Flow edges
- **Real execution** of previous nodes to get output
- **Cache system** with metadata for performance

### 🔥 Telegram API Integration
**Problem**: Webhook conflicts prevented message fetching
**Solution**: Smart webhook management:
- **Auto-detects webhook conflicts** when using getUpdates
- **Automatically deletes webhooks** and retries
- **Fallback to direct API** if backend endpoint unavailable
- **Better error messages** with specific guidance

### 🔥 Google Docs Integration
**Problem**: Users needed document automation capabilities
**Solution**: Complete Google Docs integration system:
- **OAuth2 authentication** with popup window flow
- **Three document operations**: Read existing docs, append content, create new docs
- **Real-time auth status** with visual indicators (connected/disconnected)
- **Template variable support** with drag-and-drop functionality
- **Secure credential management** using environment variables
- **Production-ready** with Render deployment support

## Recent Major Updates

### Advanced Template Replacement Engine
**Location**: `src/nodes/actions/aiAgentNode.js:74-107`
**Features**:
- **Nested JSON path support** (e.g., `{{message.from.username}}`)
- **Type-aware conversion** (strings, numbers, objects)
- **Error handling** with fallback to original template
- **Complex object serialization** for nested data

### Smart Data Flow Management
**Features**:
- **Automatic output creation** for trigger nodes on GET
- **Persistent node execution data** across panel sessions
- **Visual cache indicators** showing data source and age
- **Real-time workflow state** without requiring saves

### Enhanced User Experience
**Visual Improvements**:
- **Hover animations** and scale effects for draggable elements  
- **Focus rings** and drag-over states for inputs
- **Live preview boxes** with gradient backgrounds
- **Status indicators** for cached vs fresh data

## API Endpoints

### Backend Routes (`server.js`)
- `/api/webhooks` - Webhook handling
- `/api/workflows` - Workflow management
- `/api/telegram` - Telegram bot operations  
- `/api/nodes` - Node execution
- `/api/ai` - AI service integration
- `/auth/google` - Google OAuth2 authentication endpoints
- `/api/get-doc` - Google Docs document retrieval
- `/api/update-doc` - Google Docs document updates
- `/api/create-doc` - Google Docs document creation

### Key API Calls
- `POST /api/nodes/run-node` - Execute any node type (including Google Docs)
- `POST /api/ai/verify-claude` - Verify Claude API key
- `POST /api/telegram/verify-token` - Verify Telegram bot token
- `POST /api/telegram/get-updates` - Fetch recent Telegram messages
- `POST /api/telegram/delete-webhook` - Remove active webhooks
- `POST /api/workflows/{id}/activate` - Activate workflow
- `GET /auth/google` - Initiate Google OAuth2 flow
- `GET /auth/status` - Check Google authentication status
- `GET /oauth2callback` - Handle Google OAuth2 callback
- `POST /api/get-doc` - Retrieve Google Docs content
- `POST /api/update-doc` - Append content to Google Docs
- `POST /api/create-doc` - Create new Google Docs document

## Advanced Data Flow
```
Telegram API → Trigger Node → [Persistent Storage] → AI Agent → [Template Processing] → Google Docs → Output
```

### Alternative Workflows:
```
Telegram API → AI Agent → Google Docs (Create Document)
Telegram API → AI Agent → Google Docs (Update Existing)  
Google Docs (Get) → AI Agent → Model Node (Chat Response)
```

### Node Execution Chain:
1. **Trigger Node**: Fetches real Telegram data via API
2. **Data Persistence**: Saves input/output to localStorage
3. **AI Agent**: Gets cached trigger output, processes with templates
4. **Template Engine**: Replaces `{{variables}}` with real JSON values
5. **Google Docs Node**: Authenticates with OAuth2 and performs document operations
6. **Model Node**: Receives processed output for final response or chat interaction

### Data Persistence Strategy:
- **Node execution data**: `node-execution-{nodeId}` in localStorage
- **Global registry**: `executed-nodes-registry` tracks which nodes have data
- **Metadata tracking**: Source node, execution time, data freshness
- **Automatic cleanup**: Old data replaced with new executions

## Development Setup
- **Frontend**: `cd frontend && npm start` (runs on localhost:3005)
- **Backend**: Deployed on Render at `https://workflownode.onrender.com`
- **Git**: Main branch auto-deploys to Render on push
- **Google OAuth**: Requires environment variables in Render dashboard
- **Testing**: Use browser dev tools to inspect data flow

### Environment Variables Required:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret  
REDIRECT_URI=https://workflownode.onrender.com/oauth2callback
PORT=10000
BASE_URL=https://workflownode.onrender.com
```

## File Structure
```
/
├── frontend/src/
│   ├── components/
│   │   ├── ConfigPanel.js (3-column layout + drag/drop + live preview)
│   │   ├── CustomNode.js (Visual node component)
│   │   ├── FlowEditor.js (Workflow canvas)
│   │   └── Sidebar.js (Node palette)
│   └── App.js (Main application with workflow state)
├── src/
│   ├── api/routes/ (Express routes)
│   ├── api/controllers/ (Route handlers with webhook management)
│   ├── nodes/
│   │   ├── actions/
│   │   │   ├── aiAgentNode.js (AI processing with templates)
│   │   │   ├── googleDocsNode.js (Google Docs integration)
│   │   │   ├── modelNode.js (AI chat interface)
│   │   │   └── llmNode.js (Legacy LLM node)
│   │   └── triggers/
│   │       └── telegramTrigger.js (Telegram webhook trigger)
│   ├── services/ (External API integrations)
│   └── config/ (Configuration management)
└── server.js (Express server with Google OAuth2 endpoints)
```

## Current Capabilities
✅ **Real Telegram message fetching** with automatic webhook handling  
✅ **Visual workflow builder** with node connections  
✅ **Drag-and-drop template creation** from JSON data  
✅ **Live preview** of template processing with real data  
✅ **Advanced node chaining** with persistent data flow  
✅ **AI integration** with Claude API for intelligent responses  
✅ **Google Docs integration** with OAuth2 authentication
✅ **Document automation** (read, write, create) with template variables
✅ **3-column ConfigPanel** for better UX  
✅ **Smart error handling** and user guidance  
✅ **Production deployment** on Render with secure credential management

## Testing Workflow

### Basic Workflow:
1. **Create workflow**: Telegram Trigger → AI Agent → Model Node
2. **Configure Telegram**: Set bot token, system auto-handles webhooks
3. **Get data**: Click GET to fetch real messages, data persists
4. **Configure AI Agent**: Drag JSON fields to create templates
5. **See live preview**: Watch templates process with real data
6. **Chain execution**: Each node receives output from previous node
7. **Test end-to-end**: Full workflow from Telegram to AI response

### Google Docs Integration Workflow:
1. **Create workflow**: Telegram Trigger → AI Agent → Google Docs
2. **Connect Google**: Click "Connect" button in Google Docs ConfigPanel
3. **Authenticate**: Complete OAuth2 flow in popup window
4. **Configure action**: Choose Get/Update/Create document operation
5. **Set parameters**: Add document URL or title, configure content with templates
6. **Test execution**: Click GET → POST to see document operations in action
7. **Verify results**: Check Google Drive for created/updated documents

## Known Issues & Solutions
- **Webhook conflicts**: Auto-resolved with smart deletion
- **Template syntax**: JSX requires `{"{{variable}}"}` format in strings
- **Data persistence**: Handled automatically, no manual saves needed
- **API rate limits**: Cached data reduces API calls
- **Google OAuth redirect**: Must add `https://workflownode.onrender.com/oauth2callback` to Google Cloud Console
- **Environment variables**: Google credentials must be set in Render dashboard
- **Cross-origin warnings**: Normal browser security warnings in OAuth popup, doesn't affect functionality

## Security Best Practices
- ✅ **Credentials isolation**: `.env` files excluded from Git repository
- ✅ **Environment variables**: Secrets stored securely in Render dashboard
- ✅ **OAuth2 flow**: Secure authentication with Google's official API
- ✅ **HTTPS endpoints**: All production APIs use secure connections
- ✅ **Token management**: Authentication tokens handled server-side only

---

*Last updated: 2025-07-30*  
*Major features: Google Docs integration, OAuth2 authentication, Document automation*  
*Claude AI assisted with complete workflow automation implementation including Google Drive integration*