# n8n Connection Patterns Reference

**Source**: `packages/workflow/src/interfaces.ts`
**Last Updated**: 2025-01-14

## Connection Type Definitions

```typescript
export const NodeConnectionTypes = {
  AiAgent: 'ai_agent',
  AiChain: 'ai_chain',
  AiDocument: 'ai_document',
  AiEmbedding: 'ai_embedding',
  AiLanguageModel: 'ai_languageModel',
  AiMemory: 'ai_memory',
  AiOutputParser: 'ai_outputParser',
  AiRetriever: 'ai_retriever',
  AiReranker: 'ai_reranker',
  AiTextSplitter: 'ai_textSplitter',
  AiTool: 'ai_tool',
  AiVectorStore: 'ai_vectorStore',
  Main: 'main',
} as const;
```

## Connection Type Usage Matrix

| Connection Type | Purpose | Source Nodes | Target Nodes | Example |
|----------------|---------|--------------|--------------|---------|
| **Main** | Standard data flow | Any action node | Any action node | HTTP Request → Code → Slack |
| **AiLanguageModel** | Attach LLM to agent/chain | Chat models (OpenAI, Claude, etc.) | Agent, Chain, AI Tool | Chat OpenAI → Agent Executor |
| **AiTool** | Provide tools to agent | Tool nodes (HTTP, Code, etc.) | Agent Executor | Tool: HTTP Request → Agent |
| **AiMemory** | Conversation history | Memory nodes (Buffer, Redis, etc.) | Agent, Chain | Memory: Buffer Window → Agent |
| **AiDocument** | Document loading | Document loaders | Vector Store, Retriever | Doc Loader → Vector Store |
| **AiEmbedding** | Embedding model | Embedding nodes (OpenAI, Cohere) | Vector Store, Reranker | Embeddings: OpenAI → Vector Store |
| **AiTextSplitter** | Text chunking | Text Splitter nodes | Document Loader | Text Splitter → Doc Loader |
| **AiVectorStore** | Vector database | Vector Store nodes | Retriever, Reranker | Vector Store → Retriever |
| **AiRetriever** | Document retrieval | Retriever nodes | Agent, Chain | Retriever → Chain |
| **AiReranker** | Re-rank results | Reranker nodes | Agent, Chain | Reranker → Chain |
| **AiOutputParser** | Parse LLM output | Output Parser nodes | Agent, Chain | Output Parser → Chain |
| **AiAgent** | Sub-agent delegation | Agent nodes | Parent Agent | Sub-Agent → Main Agent |
| **AiChain** | Chain composition | Chain nodes | Parent Chain | Sub-Chain → Main Chain |

## Common Workflow Patterns

### 1. Simple LLM Chat
```
Manual Trigger
  → Chat OpenAI [main]
  → Display Result

Connections: Main only
```

### 2. Agent with Tools
```
Manual Trigger [main]
  → Agent Executor

Workflow Configuration [ai_languageModel]
  → Agent Executor

Chat OpenAI [ai_languageModel]
  → Agent Executor

Tool: HTTP Request [ai_tool]
  → Agent Executor

Tool: Calculator [ai_tool]
  → Agent Executor

Memory: Buffer Window [ai_memory]
  → Agent Executor
```

### 3. RAG Workflow (CRITICAL PATTERN)
```
Manual Trigger [main]
  → Vector Store [main]
  → Chat OpenAI [main]
  → Display Result

Document Loader [ai_document]
  → Vector Store

Embeddings: OpenAI [ai_embedding]
  → Vector Store

Text Splitter [ai_textSplitter]
  → Document Loader

CRITICAL: Document Loader is NOT in main data flow!
Document Loader connects via ai_document, not main.
```

### 4. Conversational RAG with Memory
```
Manual Trigger [main]
  → Conversational Retrieval Chain [main]
  → Display Result

Chat OpenAI [ai_languageModel]
  → Conversational Retrieval Chain

Memory: Buffer Window [ai_memory]
  → Conversational Retrieval Chain

Vector Store: Pinecone [ai_vectorStore]
  → Conversational Retrieval Chain

Embeddings: OpenAI [ai_embedding]
  → Vector Store: Pinecone
```

### 5. Advanced Agent with Multiple Capabilities
```
Manual Trigger [main]
  → Agent Executor [main]
  → Post-process [main]

Workflow Configuration [ai_languageModel]
  → Agent Executor

Chat OpenAI [ai_languageModel]
  → Agent Executor

Tool: Workflow [ai_tool]
  → Agent Executor

Tool: Vector Store [ai_tool]
  → Agent Executor

Tool: HTTP Request [ai_tool]
  → Agent Executor

Tool: Code [ai_tool]
  → Agent Executor

Memory: Redis Chat [ai_memory]
  → Agent Executor

Output Parser: Structured [ai_outputParser]
  → Agent Executor
```

## Connection Rules

### 1. Input Validation Rules
```typescript
// Triggers: NO inputs allowed
{
  displayName: "Schedule Trigger",
  inputs: [], // Empty array for triggers
  outputs: [NodeConnectionTypes.Main]
}

// Action Nodes: Main input required
{
  displayName: "HTTP Request",
  inputs: [NodeConnectionTypes.Main],
  outputs: [NodeConnectionTypes.Main]
}

// AI Nodes: Multiple connection types
{
  displayName: "Agent Executor",
  inputs: [
    NodeConnectionTypes.Main, // Optional data input
    NodeConnectionTypes.AiLanguageModel, // Required
    NodeConnectionTypes.AiTool, // Multiple allowed
    NodeConnectionTypes.AiMemory, // Optional
  ],
  outputs: [NodeConnectionTypes.Main]
}
```

### 2. Output Connection Rules
```typescript
// Most nodes: Main output only
outputs: [NodeConnectionTypes.Main]

// AI capability nodes: Specific output type
outputs: [NodeConnectionTypes.AiLanguageModel] // Chat models
outputs: [NodeConnectionTypes.AiEmbedding]     // Embeddings
outputs: [NodeConnectionTypes.AiTool]          // Tools
outputs: [NodeConnectionTypes.AiMemory]        // Memory
```

### 3. Multiple Connection Rules
- **Single connection**: `AiLanguageModel`, `AiMemory`, `AiOutputParser` (only one allowed)
- **Multiple connections**: `AiTool`, `AiDocument` (many allowed)
- **Optional connections**: Most AI connections are optional except where required

## Connection Validation

### Valid Connections
```json
{
  "connections": {
    "Manual Trigger": {
      "main": [[{"node": "Agent Executor", "type": "main", "index": 0}]]
    },
    "Chat OpenAI": {
      "ai_languageModel": [[{"node": "Agent Executor", "type": "ai_languageModel", "index": 0}]]
    },
    "Tool: HTTP Request": {
      "ai_tool": [[{"node": "Agent Executor", "type": "ai_tool", "index": 0}]]
    }
  }
}
```

### Invalid Connections (Common Mistakes)

#### ❌ Document Loader in Main Flow
```json
// WRONG: Document Loader processing main data
{
  "connections": {
    "Manual Trigger": {
      "main": [[{"node": "Document Loader", "type": "main", "index": 0}]]
    },
    "Document Loader": {
      "main": [[{"node": "Vector Store", "type": "main", "index": 0}]]
    }
  }
}
```

#### ✅ Correct: Document Loader as AI Capability
```json
{
  "connections": {
    "Manual Trigger": {
      "main": [[{"node": "Vector Store", "type": "main", "index": 0}]]
    },
    "Document Loader": {
      "ai_document": [[{"node": "Vector Store", "type": "ai_document", "index": 0}]]
    }
  }
}
```

#### ❌ Missing Required Connections
```json
// WRONG: Agent without language model
{
  "connections": {
    "Manual Trigger": {
      "main": [[{"node": "Agent Executor", "type": "main", "index": 0}]]
    }
  }
}
// Result: Agent will fail - no LLM configured
```

#### ✅ Correct: Agent with Language Model
```json
{
  "connections": {
    "Manual Trigger": {
      "main": [[{"node": "Agent Executor", "type": "main", "index": 0}]]
    },
    "Chat OpenAI": {
      "ai_languageModel": [[{"node": "Agent Executor", "type": "ai_languageModel", "index": 0}]]
    }
  }
}
```

## Connection Discovery Algorithm

### For Agent-Building Agents
When creating workflows programmatically:

1. **Identify node category**:
   - Trigger? → No inputs
   - Action? → Main input/output
   - AI capability? → Check node type

2. **Determine required connections**:
   - Agent/Chain → Requires `ai_languageModel`
   - Vector Store → Requires `ai_embedding`
   - Document processing → May need `ai_textSplitter`

3. **Validate connection compatibility**:
   - Check source node's output types
   - Check target node's input types
   - Match connection type

4. **Build connection graph**:
   ```typescript
   function canConnect(source, target, connectionType) {
     return (
       source.outputs.includes(connectionType) &&
       target.inputs.includes(connectionType)
     );
   }
   ```

## Best Practices

### 1. System Message Separation
```
✅ ALWAYS use Workflow Configuration node
❌ NEVER put system message in Chat Model parameters

Reason: Reusability, maintainability, clarity
```

### 2. RAG Pattern Adherence
```
✅ Document Loader → Vector Store [ai_document]
❌ Data Source → Document Loader → Vector Store [main]

Reason: Document Loader is an AI capability, not a data processor
```

### 3. Tool Configuration
```
✅ Use $fromAI() expressions for dynamic parameters
❌ Hardcode parameters in tool nodes

Example:
{
  "url": "={{ $fromAI('url', 'https://default.com') }}",
  "method": "={{ $fromAI('method', 'GET') }}"
}
```

### 4. Memory Placement
```
✅ Connect memory to agent/chain via ai_memory
❌ Pass memory through main data flow

Reason: Memory is a capability, not data
```

## Implementation for Multi-Agent System

### Workflow Architect Agent Responsibilities
1. Parse workflow specification
2. Identify required nodes (via Node Discovery Specialist)
3. Determine connection graph based on rules above
4. Validate:
   - Triggers have no inputs
   - All nodes have compatible connections
   - Required connections present (e.g., Agent → LLM)
   - RAG pattern followed correctly
5. Generate connection JSON

### Connection Graph Generation Algorithm
```typescript
interface ConnectionGraph {
  nodes: Node[];
  connections: Record<string, Record<string, Connection[]>>;
}

function generateConnectionGraph(spec: WorkflowSpec): ConnectionGraph {
  // 1. Identify node types needed
  const nodes = await nodeDiscoverySpecialist.findNodes(spec);

  // 2. Determine connection requirements
  const requirements = analyzeConnectionRequirements(nodes);

  // 3. Build connection graph
  const connections = {};
  for (const req of requirements) {
    if (canConnect(req.source, req.target, req.type)) {
      connections[req.source.name] = connections[req.source.name] || {};
      connections[req.source.name][req.type] = [
        ...(connections[req.source.name][req.type] || []),
        {
          node: req.target.name,
          type: req.type,
          index: 0,
        },
      ];
    }
  }

  // 4. Validate graph
  validateConnectionGraph({ nodes, connections });

  return { nodes, connections };
}
```

### Validation Rules
```typescript
function validateConnectionGraph(graph: ConnectionGraph): ValidationResult {
  const errors = [];

  // Rule 1: Triggers have no inputs
  for (const node of graph.nodes) {
    if (node.category === 'trigger') {
      const incomingConnections = findIncomingConnections(graph, node.name);
      if (incomingConnections.length > 0) {
        errors.push(`Trigger ${node.name} cannot have input connections`);
      }
    }
  }

  // Rule 2: Agents must have language model
  for (const node of graph.nodes) {
    if (node.name.includes('Agent') || node.name.includes('Chain')) {
      const hasLLM = graph.connections[node.name]?.ai_languageModel;
      if (!hasLLM) {
        errors.push(`${node.name} requires ai_languageModel connection`);
      }
    }
  }

  // Rule 3: Vector Stores must have embeddings
  for (const node of graph.nodes) {
    if (node.name.includes('Vector Store')) {
      const hasEmbedding = findConnectionToNode(graph, node.name, 'ai_embedding');
      if (!hasEmbedding) {
        errors.push(`${node.name} requires ai_embedding connection`);
      }
    }
  }

  // Rule 4: Document Loaders not in main flow
  for (const node of graph.nodes) {
    if (node.name.includes('Document') && node.name.includes('Loader')) {
      const mainConnections = findConnectionsOfType(graph, node.name, 'main');
      if (mainConnections.length > 0) {
        errors.push(
          `${node.name} should connect via ai_document, not main. ` +
          `Document Loaders are AI capabilities, not data processors.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

**For Agent Implementation**: Use these patterns to:
1. Design connection graphs in Workflow Architect agent
2. Validate connections before parameter configuration
3. Ensure RAG workflows follow correct patterns
4. Generate correct JSON structure for n8n workflow import
