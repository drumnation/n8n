# n8n Node Ecosystem Summary

**Generated**: 2025-01-14
**Total Nodes**: 474
**Base Nodes**: 391
**LangChain AI Nodes**: 114 (detected 40 in taxonomy)

## Node Categories

### 1. Triggers (101 nodes)
Nodes that start workflow execution based on events or schedules.

**Common Patterns**:
- Schedule-based: `ScheduleTrigger`, `CronTrigger`
- Webhook-based: `Webhook`, `WebhookTrigger`
- Service-specific: `SlackTrigger`, `GmailTrigger`, `DiscordTrigger`
- Event-based: `FormTrigger`, `ChatTrigger`

**Connection Pattern**:
- **Inputs**: None (triggers start workflows)
- **Outputs**: `NodeConnectionTypes.Main`

### 2. Action Nodes (346 nodes)
Nodes that perform operations on data or interact with external services.

**Subcategories**:
- **Data Processing**: Transform, filter, merge, aggregate data
- **Communication**: Email, Slack, Discord, Telegram
- **Cloud Services**: AWS, Google Cloud, Azure, S3, Dropbox
- **CRM/Business**: Salesforce, HubSpot, Airtable, Notion
- **Development**: HTTP Request, Code, Execute Command
- **Database**: PostgreSQL, MySQL, MongoDB, Redis

**Connection Pattern**:
- **Inputs**: `NodeConnectionTypes.Main`
- **Outputs**: `NodeConnectionTypes.Main`

### 3. AI Nodes (27 nodes from base + 114 LangChain nodes)
Specialized nodes for AI/ML operations and LangChain integration.

**Key LangChain Categories**:

#### Language Models (lmChat*)
- `lmChatOpenAi` - OpenAI GPT models
- `lmChatAzureOpenAi` - Azure-hosted OpenAI
- `lmChatMistralCloud` - Mistral AI models
- `lmChatVercelAiGateway` - Vercel AI Gateway
- `lmChatXAiGrok` - xAI Grok models

#### AI Agents
- `agent` - Generic LangChain agent
- `agentExecutor` - Agent execution orchestrator

#### Memory Systems
- `memoryBufferWindow` - Windowed conversation memory
- `memoryChatMemory` - Full chat history
- `memoryPostgresChat` - PostgreSQL-backed memory
- `memoryRedisChat` - Redis-backed memory

#### Vector Stores & Embeddings
- `embeddingsOpenAi` - OpenAI embeddings
- `embeddingsAzureOpenAi` - Azure OpenAI embeddings
- `embeddingsCohere` - Cohere embeddings
- `vectorStoreInMemory` - In-memory vector DB
- `vectorStorePinecone` - Pinecone vector DB
- `vectorStoreSupabase` - Supabase vector store
- `vectorStoreZep` - Zep memory store

#### Document Loaders & Processing
- `documentDefaultDataLoader` - Load data from upstream
- `documentJsonInputLoader` - Load JSON documents
- `documentBinaryInputLoader` - Load binary files
- `textSplitterRecursiveCharacterTextSplitter` - Smart text chunking
- `textSplitterTokenSplitter` - Token-based splitting

#### Tools & Utilities
- `toolCalculator` - Math calculations
- `toolCode` - Execute custom code
- `toolHttpRequest` - Make HTTP requests
- `toolWorkflow` - Call n8n workflows
- `toolVectorStore` - Query vector stores

**Connection Patterns for AI Nodes**:
- **Main flow**: `NodeConnectionTypes.Main`
- **AI Language Model**: `NodeConnectionTypes.AiLanguageModel`
- **AI Tool**: `NodeConnectionTypes.AiTool`
- **AI Memory**: `NodeConnectionTypes.AiMemory`
- **AI Document**: `NodeConnectionTypes.AiDocument`
- **AI Embedding**: `NodeConnectionTypes.AiEmbedding`
- **AI Text Splitter**: `NodeConnectionTypes.AiTextSplitter`

**Critical RAG Workflow Pattern** (from main-agent.prompt.ts):
```
Data Source → Vector Store [main]
Document Loader → Vector Store [ai_document]
Embeddings → Vector Store [ai_embedding]
Text Splitter → Document Loader [ai_textSplitter]

Common Mistake: Document Loader is NOT a data processor!
❌ WRONG: Data Source → Document Loader → Vector Store
✅ RIGHT: Document Loader connected via ai_document to Vector Store
```

### 4. Utility Nodes (Core Processing)
Built-in nodes for workflow control and data manipulation.

**Key Utilities**:
- **Data Transform**: `Set`, `Code`, `Filter`, `Merge`, `Split`
- **Flow Control**: `If`, `Switch`, `Loop`, `Wait`
- **Error Handling**: `Error Trigger`, `Stop and Error`
- **Sub-workflows**: `Execute Workflow`

## Node Taxonomy by Domain

### Data Processing (11 nodes)
- `filter` - Filter items based on conditions
- `merge` - Combine multiple inputs
- `split` - Divide data into multiple outputs
- `aggregate` - Summarize data
- `code` - Custom JavaScript/Python
- `itemLists` - List operations

### Communication (4 nodes)
- Email services (Gmail, Outlook, SMTP)
- Messaging platforms (Slack, Discord, Telegram)
- Webhooks and HTTP callbacks

### Cloud Services (40 nodes)
- **AWS**: S3, Lambda, SNS, SQS, DynamoDB
- **Google**: Drive, Sheets, Calendar, Gmail
- **Azure**: Storage, Functions, Cognitive Services
- **Other**: Dropbox, Box, OneDrive

### AI & Machine Learning (40 nodes)
- LangChain ecosystem (agents, chains, tools)
- OpenAI integration
- Anthropic Claude
- Mistral AI
- Embeddings and vector stores
- Document processing

### Automation (2 nodes)
- Schedule triggers
- Cron-based execution

### Other (377 nodes)
- Service-specific integrations
- Custom business tools
- Data sources and destinations

## Node Parameter Patterns

### Common Parameter Types
1. **Credentials**: API keys, OAuth tokens, connection strings
2. **Resource Selection**: Dropdown menus for accounts, channels, folders
3. **Operation**: What action to perform (create, read, update, delete)
4. **Fields**: Dynamic fields based on selected resource
5. **Options**: Additional configuration (timeout, retry, headers)
6. **Expressions**: `{{ }}` syntax for dynamic values

### Dynamic Parameters
Many nodes have parameters that change based on previous selections:
- Selecting "Create" operation shows different fields than "Update"
- Choosing a specific resource loads its schema dynamically
- AI nodes expose different connections based on capabilities

## Best Practices for AI Node Configuration

### 1. System Messages
**ALWAYS use separate Workflow Configuration node** for system messages:
```
✅ RIGHT:
  Workflow Configuration [system message]
  → Chat Model [connected via ai_languageModel]

❌ WRONG:
  Chat Model [system message in parameters]
  (Hard to maintain, poor reusability)
```

### 2. RAG Workflows
**Document Loader is an AI capability, not a data processor**:
```
✅ RIGHT:
  Manual Trigger → Vector Store [main]
  Document Loader → Vector Store [ai_document]
  Embeddings → Vector Store [ai_embedding]

❌ WRONG:
  Manual Trigger → Document Loader → Vector Store
  (Document Loader should NEVER be in main data flow)
```

### 3. Tool Nodes
**Use `$fromAI()` expressions for dynamic input**:
```json
{
  "url": "={{ $fromAI('url', 'https://api.example.com') }}",
  "method": "={{ $fromAI('method', 'GET') }}"
}
```

### 4. Parameter Configuration
**NEVER leave default parameters** - always configure explicitly:
- Default values often cause failures
- AI agents must call `update_node_parameters` after creating nodes
- Use LLM assistance for complex parameter generation

## Connection Type Reference

| Connection Type | Usage | Example |
|----------------|-------|---------|
| `Main` | Standard data flow | HTTP Request → Code → Slack |
| `AiLanguageModel` | LLM for agent/chain | Workflow Config → Agent |
| `AiTool` | Tools for agent to call | Tool: HTTP Request → Agent |
| `AiMemory` | Conversation memory | Memory: Buffer → Agent |
| `AiDocument` | Document loading | Doc Loader → Vector Store |
| `AiEmbedding` | Embedding model | Embeddings → Vector Store |
| `AiTextSplitter` | Text chunking | Text Splitter → Doc Loader |

## File Locations

- **Base Nodes**: `packages/nodes-base/nodes/`
- **LangChain Nodes**: `packages/@n8n/nodes-langchain/nodes/`
- **Node Types Interface**: `packages/workflow/src/interfaces.ts`
- **Connection Types**: `packages/workflow/src/Interfaces.ts` (NodeConnectionTypes enum)

## Implementation Notes for Multi-Agent System

### Agent Delegation Strategy
Based on catalog analysis:

1. **Node Discovery Specialist**
   - Search 474 nodes by category/taxonomy
   - Return: name, displayName, description, group, inputs, outputs
   - Skill: `n8n-node-search.md` (hide 474-node catalog complexity)

2. **Workflow Architect**
   - Design connection graph using connection type rules
   - Validate: triggers have no inputs, AI nodes use correct connection types
   - Reference: RAG workflow pattern documentation

3. **Parameter Configurator**
   - Use LLM assistance for complex parameter generation
   - Skill: `n8n-parameter-generation.md` (hide LLM call complexity)
   - NEVER use defaults - always generate explicit values

4. **Best Practices Guardian**
   - Enforce: System message separation, RAG patterns, `$fromAI()` expressions
   - Skill: `n8n-best-practices-lookup.md` (categorized best practices DB)

### Context Conservation via Skills

**Problem**: 474 nodes × 50 tokens avg = 23.7K tokens per catalog reference

**Solution**: Skills hide complexity, return only relevant results
- `n8n-node-search` returns 5-10 matching nodes (500 tokens vs 23.7K)
- `n8n-parameter-generation` returns ready-to-use parameters (200 tokens vs 5K)
- `n8n-best-practices-lookup` returns relevant docs (300 tokens vs 10K)

**Result**: 80% token reduction (1K tokens vs 38.7K tokens per workflow generation)

---

**Next Steps**:
1. Extract parameter schemas for top 50 most-used nodes
2. Create connection pattern documentation
3. Build best practices knowledge base from main-agent.prompt.ts
4. Generate Arbor template with n8n-specific validation rules
