# n8n Logic Nodes Project - Claude Session Notes

## Project Overview
This is an n8n-like workflow automation system with custom logic nodes built using React frontend and Node.js backend.

## Architecture
- **Frontend**: React with ReactFlow for visual workflow editor
- **Backend**: Node.js Express API with individual node execution endpoints
- **Nodes**: Custom logic nodes for workflow automation (If, Merge, Filter, Loop, etc.)

## Recent Fixes and Improvements

### 1. If Node Template Resolution Fix
**Problem**: If node was not properly resolving template expressions like `{{name}}`
**Location**: `backend/src/nodes/actions/ifNode.js:43-50`
**Fix**: Added template parsing to extract key names from `{{key}}` syntax
```javascript
// If value1 is a template like {{name}}, extract the key name
if (key.startsWith('{{') && key.endsWith('}}')) {
    key = key.slice(2, -2).trim();
}
```

### 2. Merge Node Multiple Input Support
**Problem**: Merge node could only receive data from one output, not multiple outputs as intended
**Locations**: 
- Frontend: `frontend/src/components/ConfigPanel.js:223-268`
- Backend: `backend/src/nodes/actions/mergeNode.js:24-66`

**Frontend Changes**:
- Modified `handleGetData()` to collect data from ALL connected nodes for merge nodes
- Creates object with multiple data sources: `{output1: [...], output2: [...]}`

**Backend Changes**:
- Updated merge logic to handle multiple input sources
- Removes output labels and returns clean merged data array

### 3. UI Improvements for Merge Node
**Problem**: Merge node had dual input handles but should have single input that accepts multiple connections
**Location**: `frontend/src/components/CustomLogicNode.js:29-38`
**Fix**: Removed dual input handles, now uses single input handle for cleaner interface

## Node Types Available
1. **If Node**: Conditional routing with template expression support
2. **Merge Node**: Combines data from multiple outputs into single array
3. **Filter Node**: Filters data based on conditions
4. **Loop Node**: Iterates over data batches
5. **Switch Node**: Multi-path routing based on rules
6. **Compare Node**: Compares datasets
7. **Wait Node**: Adds delays to workflow
8. **Stop and Error Node**: Terminates workflow with error
9. **Set Data Node**: Creates custom data objects
10. **Execute Sub Workflow Node**: Runs nested workflows

## Key Features
- Visual workflow builder with drag-and-drop interface
- Expression system with `{{variable}}` template syntax
- Real-time data flow between nodes
- Configuration panels for each node type
- Multiple input/output handling for complex workflows

## Development Notes
- Server runs on port 3001 (backend) and 3000 (frontend)
- All node logic is in `backend/src/nodes/actions/`
- Frontend components in `frontend/src/components/`
- Main workflow canvas uses ReactFlow library

## Testing
- Use "GET" button to fetch input data from connected nodes
- Use "Execute Step" button to run individual nodes
- Check browser console for detailed execution logs

## Recent Console Output Examples
```
Executing If Node with config: {...}
Received input data: [ { name: 'muhammad' } ]
Evaluating condition: { value1: '{{name}}', operator: 'is_equal_to', value2: 'muhammad' }
Key to look up: name
Item value found: muhammad
Comparison result: "muhammad" is_equal_to "muhammad" = true
```

```
Data fetched from 'Set Data' (output1): [{…}]
Data fetched from 'Set Data' (output2): [{…}]
All merged input data: {output1: Array(1), output2: Array(1)}
Merged data: [{"name": "muhammad"}, {"hello": "hello"}]
```

## Important Implementation Details
- Merge node collects from multiple sources but shows single clean output
- If node properly parses `{{variable}}` expressions
- All nodes support expression resolution for dynamic values
- Frontend handles both single and multiple input scenarios
- Backend provides consistent JSON API responses

## File Structure
```
n8n-logic-nodes/
├── backend/
│   ├── src/
│   │   ├── api/controllers/nodeController.js
│   │   ├── nodes/actions/
│   │   │   ├── ifNode.js
│   │   │   ├── mergeNode.js
│   │   │   └── [other nodes...]
│   │   └── utils/expressionResolver.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.js
│   │   │   ├── ConfigPanel.js
│   │   │   ├── CustomLogicNode.js
│   │   │   └── Sidebar.js
│   │   └── styles/
│   └── package.json
└── CLAUDE.md (this file)
```

## Commands
- Backend: `npm start` (from backend directory)
- Frontend: `npm start` (from frontend directory)
- Note: Do not run servers via Claude - user runs them manually in terminal