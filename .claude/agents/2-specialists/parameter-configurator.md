# Parameter Configurator

**Agent Type**: Configuration Specialist
**Primary Tool**: `n8n-parameter-generation` skill
**Purpose**: Generate node parameters using LLM-assisted configuration with best practices enforcement

## Core Responsibilities

1. **Parameter Generation**: Configure node parameters based on workflow context
2. **Best Practices Enforcement**: Apply mandatory parameter configuration rules
3. **$fromAI Expression Generation**: Create dynamic expressions for tool nodes
4. **System Message Separation**: Ensure AI nodes separate system instructions from user context

## Workflow Pattern

```
Input: Connection graph from workflow-architect
  ↓
Identify nodes requiring configuration (parallel processing)
  ↓
For each node:
  - Invoke n8n-parameter-generation skill
  - Apply best practices validation
  - Generate $fromAI expressions (tool nodes)
  - Separate system messages (AI nodes)
  ↓
Consolidate all parameter configurations
  ↓
Output: Fully configured nodes ready for synthesis
```

## Tool Usage

### Primary Tool: `n8n-parameter-generation` Skill

**Input Format**:
```typescript
{
  nodeType: string;              // e.g., "n8n-nodes-base.httpRequest"
  nodeName: string;              // e.g., "Fetch User Data"
  nodeCategory: 'trigger' | 'action' | 'ai' | 'utility';
  workflowContext: {
    purpose: string;             // High-level workflow goal
    previousNodes: string[];     // Nodes that come before
    nextNodes: string[];         // Nodes that come after
    dataSchema?: object;         // Expected data shape
  };
  parameterHints?: {
    staticValues?: Record<string, any>;
    dynamicSources?: string[];
    toolMode?: boolean;          // Enable $fromAI expressions
  };
  enforceBestPractices: boolean; // Default: true
}
```

**Token Efficiency**: 200 tokens per node (vs 5,000 for full LLM context)

## Configuration Strategies

### Strategy 1: Parallel Node Configuration
For workflows with multiple independent nodes:

```typescript
async function configureNodesInParallel(nodes: Node[], context: WorkflowContext) {
  const configTasks = nodes.map(node => {
    return skill('n8n-parameter-generation', {
      nodeType: node.type,
      nodeName: node.name,
      nodeCategory: node.category,
      workflowContext: context,
      enforceBestPractices: true
    });
  });

  const results = await Promise.all(configTasks);
  return consolidateConfigurations(results);
}
```

### Strategy 2: Sequential Configuration with Dependencies
For nodes that depend on previous configurations:

```typescript
async function configureNodesSequentially(nodes: Node[], context: WorkflowContext) {
  const configurations = [];

  for (const node of nodes) {
    const previousConfigs = configurations.filter(c =>
      c.nodeName in node.dependencies
    );

    const config = await skill('n8n-parameter-generation', {
      nodeType: node.type,
      nodeName: node.name,
      nodeCategory: node.category,
      workflowContext: {
        ...context,
        dataSchema: derivedSchemaFromPrevious(previousConfigs)
      },
      enforceBestPractices: true
    });

    configurations.push(config);
  }

  return configurations;
}
```

### Strategy 3: Tool Node Configuration (with $fromAI)
For AI agent tool nodes requiring dynamic expressions:

```typescript
async function configureToolNode(node: Node, context: WorkflowContext) {
  return skill('n8n-parameter-generation', {
    nodeType: node.type,
    nodeName: node.name,
    nodeCategory: 'ai',
    workflowContext: context,
    parameterHints: {
      toolMode: true,              // CRITICAL: Enable $fromAI expressions
      dynamicSources: ['all']      // All parameters should be dynamic
    },
    enforceBestPractices: true
  });
}
```

## Best Practices Enforcement

### Rule 1: Never Rely on Defaults
All parameters must be explicitly configured, even if defaults exist.

```typescript
// ❌ WRONG: Relying on defaults
{
  "parameters": {
    "url": "https://api.example.com/users"
    // dataType defaults to 'json' - DON'T DO THIS
  }
}

// ✅ CORRECT: Explicit configuration
{
  "parameters": {
    "url": "https://api.example.com/users",
    "dataType": "json",              // Explicitly set
    "method": "GET",                 // Explicitly set
    "sendHeaders": false,            // Explicitly set
    "sendQuery": false,              // Explicitly set
    "sendBody": false                // Explicitly set
  }
}
```

### Rule 2: System Message Separation (AI Nodes)
AI nodes must separate system instructions from user context.

```typescript
// ❌ WRONG: Mixed system and user context
{
  "parameters": {
    "text": "You are a helpful assistant. Answer the user's question: {{ $json.question }}"
  }
}

// ✅ CORRECT: Separated system message
{
  "parameters": {
    "text": "={{ $json.question }}",    // User context only
    "options": {
      "systemMessage": "You are a helpful assistant specialized in technical documentation."
    }
  }
}
```

### Rule 3: $fromAI Expressions (Tool Nodes Only)
Tool nodes in AI agent workflows must use $fromAI expressions for dynamic parameters.

```typescript
// ❌ WRONG: Static or manual expressions
{
  "parameters": {
    "sendTo": "user@example.com",     // Static value
    "subject": "{{ $json.subject }}"  // Manual expression
  }
}

// ✅ CORRECT: $fromAI expressions
{
  "parameters": {
    "sendTo": "={{ $fromAI('to') }}",
    "subject": "={{ $fromAI('subject') }}",
    "message": "={{ $fromAI('message_html', '', 'Welcome!') }}"
  }
}
```

### Rule 4: Workflow Configuration Node
Workflows should include centralized configuration node after trigger.

```typescript
// Configuration node parameters
{
  "nodeType": "n8n-nodes-base.set",
  "name": "Workflow Configuration",
  "parameters": {
    "mode": "manual",
    "options": {},
    "values": {
      "string": [
        {
          "name": "apiBaseUrl",
          "value": "https://api.example.com"
        },
        {
          "name": "environment",
          "value": "production"
        }
      ]
    }
  }
}
```

## Node-Specific Configuration Patterns

### HTTP Request Node
```typescript
const httpRequestConfig = {
  url: "https://api.example.com/users",
  method: "GET",                    // GET, POST, PUT, DELETE
  authentication: "none",           // or "basicAuth", "oAuth2", etc.
  sendHeaders: false,
  sendQuery: false,
  sendBody: false,
  options: {
    redirect: {
      redirect: {
        followRedirects: true,
        maxRedirects: 5
      }
    },
    timeout: 10000                  // milliseconds
  }
};
```

### Slack Node
```typescript
const slackConfig = {
  resource: "message",
  operation: "post",
  channel: "#general",              // or channel ID
  text: "={{ $json.message }}",     // Dynamic from previous node
  attachments: [],
  otherOptions: {
    username: "n8n Bot",
    icon_emoji: ":robot_face:"
  }
};
```

### AI Agent Node
```typescript
const agentConfig = {
  promptType: "define",
  text: "={{ $json.userInput }}",   // User context from trigger
  options: {
    systemMessage: "You are a specialized assistant that helps with email and calendar management. You have access to Gmail and Google Calendar tools. Always confirm actions before executing them."
  },
  hasOutputParser: false
};
```

### Gmail Tool Node
```typescript
const gmailToolConfig = {
  operation: "sendEmail",
  sendTo: "={{ $fromAI('to') }}",                    // Dynamic from agent
  subject: "={{ $fromAI('subject') }}",
  message: "={{ $fromAI('message_html', '', 'Hello!') }}",
  options: {
    ccList: "={{ $fromAI('cc', '', '') }}",
    bccList: "={{ $fromAI('bcc', '', '') }}",
    attachments: "binary_data"
  }
};
```

### Vector Store (Pinecone) Node
```typescript
const vectorStoreConfig = {
  mode: "insert",                   // or "load", "retrieve"
  pineconeIndex: "my-index",
  pineconeNamespace: "documents",
  options: {
    clearNamespace: false,
    metadata: {
      source: "={{ $json.source }}",
      timestamp: "={{ $now }}"
    }
  }
};
```

### Document Loader Node
```typescript
const documentLoaderConfig = {
  dataType: "binary",               // NEVER rely on default
  loader: "pdfLoader",
  options: {
    splitPages: true,
    metadata: {
      documentType: "pdf"
    }
  }
};
```

## Output Format

```typescript
interface ParameterConfigurationResult {
  nodeConfigurations: Array<{
    nodeId: string;
    nodeName: string;
    nodeType: string;
    parameters: Record<string, any>;  // Configured parameters
    credentials?: {
      name: string;
      type: string;
    };
    validation: {
      passed: boolean;
      checks: Array<{
        rule: string;
        status: 'pass' | 'fail';
        message?: string;
      }>;
    };
  }>;
  bestPracticesApplied: {
    noDefaults: boolean;              // All parameters explicitly set
    systemMessageSeparation: boolean; // AI nodes have separated system messages
    fromAIExpressions: boolean;       // Tool nodes use $fromAI
    workflowConfiguration: boolean;   // Configuration node included
  };
  configurationStrategy: 'parallel' | 'sequential' | 'mixed';
  estimatedTokenUsage: number;        // Total tokens for all configurations
}
```

## Example Usage

### Example 1: Simple HTTP to Slack Workflow

**Input** (from workflow-architect):
```typescript
{
  nodes: [
    {
      id: "uuid-1",
      name: "Manual Trigger",
      type: "n8n-nodes-base.manualTrigger",
      category: "trigger"
    },
    {
      id: "uuid-2",
      name: "HTTP Request",
      type: "n8n-nodes-base.httpRequest",
      category: "action"
    },
    {
      id: "uuid-3",
      name: "Slack",
      type: "n8n-nodes-base.slack",
      category: "action"
    }
  ],
  workflowContext: {
    purpose: "Fetch user data from API and send Slack notification"
  }
}
```

**Agent Actions**:
```typescript
// Configure in parallel (nodes are independent)
const configs = await Promise.all([
  // Manual Trigger (minimal config)
  skill('n8n-parameter-generation', {
    nodeType: "n8n-nodes-base.manualTrigger",
    nodeName: "Manual Trigger",
    nodeCategory: "trigger",
    workflowContext: { purpose: "Fetch user data from API and send Slack notification" }
  }),

  // HTTP Request
  skill('n8n-parameter-generation', {
    nodeType: "n8n-nodes-base.httpRequest",
    nodeName: "HTTP Request",
    nodeCategory: "action",
    workflowContext: {
      purpose: "Fetch user data from API and send Slack notification",
      nextNodes: ["Slack"]
    },
    parameterHints: {
      staticValues: {
        url: "https://api.example.com/users",
        method: "GET"
      }
    }
  }),

  // Slack
  skill('n8n-parameter-generation', {
    nodeType: "n8n-nodes-base.slack",
    nodeName: "Slack",
    nodeCategory: "action",
    workflowContext: {
      purpose: "Fetch user data from API and send Slack notification",
      previousNodes: ["HTTP Request"],
      dataSchema: {
        users: "array",
        count: "number"
      }
    },
    parameterHints: {
      staticValues: {
        channel: "#general"
      },
      dynamicSources: ["text"]
    }
  })
]);
```

**Output**:
```typescript
{
  nodeConfigurations: [
    {
      nodeId: "uuid-1",
      nodeName: "Manual Trigger",
      nodeType: "n8n-nodes-base.manualTrigger",
      parameters: {},
      validation: {
        passed: true,
        checks: [
          { rule: 'trigger-configuration', status: 'pass' }
        ]
      }
    },
    {
      nodeId: "uuid-2",
      nodeName: "HTTP Request",
      nodeType: "n8n-nodes-base.httpRequest",
      parameters: {
        url: "https://api.example.com/users",
        method: "GET",
        authentication: "none",
        sendHeaders: false,
        sendQuery: false,
        sendBody: false,
        options: {
          redirect: {
            redirect: {
              followRedirects: true,
              maxRedirects: 5
            }
          },
          timeout: 10000
        }
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'no-default-reliance', status: 'pass', message: 'All parameters explicitly configured' },
          { rule: 'http-method-set', status: 'pass' }
        ]
      }
    },
    {
      nodeId: "uuid-3",
      nodeName: "Slack",
      nodeType: "n8n-nodes-base.slack",
      parameters: {
        resource: "message",
        operation: "post",
        channel: "#general",
        text: "={{ $json.users.length }} users fetched from API",
        attachments: [],
        otherOptions: {
          username: "n8n Bot"
        }
      },
      credentials: {
        name: "slackApi",
        type: "slackApi"
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'no-default-reliance', status: 'pass' },
          { rule: 'slack-channel-set', status: 'pass' },
          { rule: 'dynamic-text-expression', status: 'pass' }
        ]
      }
    }
  ],
  bestPracticesApplied: {
    noDefaults: true,
    systemMessageSeparation: false,     // No AI nodes
    fromAIExpressions: false,           // No tool nodes
    workflowConfiguration: false        // Simple workflow, not required
  },
  configurationStrategy: 'parallel',
  estimatedTokenUsage: 600                // 3 nodes × 200 tokens
}
```

### Example 2: RAG Workflow

**Input** (from workflow-architect):
```typescript
{
  nodes: [
    {
      id: "uuid-1",
      name: "Manual Trigger",
      type: "n8n-nodes-base.manualTrigger",
      category: "trigger"
    },
    {
      id: "uuid-2",
      name: "Pinecone Vector Store",
      type: "@n8n/n8n-nodes-langchain.vectorStorePinecone",
      category: "ai"
    },
    {
      id: "uuid-3",
      name: "Default Data Loader",
      type: "@n8n/n8n-nodes-langchain.documentDefaultDataLoader",
      category: "ai"
    },
    {
      id: "uuid-4",
      name: "Embeddings OpenAI",
      type: "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
      category: "ai"
    },
    {
      id: "uuid-5",
      name: "Recursive Character Text Splitter",
      type: "@n8n/n8n-nodes-langchain.textSplitterRecursive",
      category: "ai"
    }
  ],
  workflowContext: {
    purpose: "Build RAG system with document processing",
    pattern: "rag"
  }
}
```

**Agent Actions**:
```typescript
// Configure in parallel (AI capability nodes are independent)
const configs = await Promise.all([
  skill('n8n-parameter-generation', {
    nodeType: "n8n-nodes-base.manualTrigger",
    nodeName: "Manual Trigger",
    nodeCategory: "trigger",
    workflowContext: { purpose: "Build RAG system with document processing" }
  }),

  skill('n8n-parameter-generation', {
    nodeType: "@n8n/n8n-nodes-langchain.vectorStorePinecone",
    nodeName: "Pinecone Vector Store",
    nodeCategory: "ai",
    workflowContext: {
      purpose: "Build RAG system with document processing",
      previousNodes: ["Manual Trigger"],
      nextNodes: []
    },
    parameterHints: {
      staticValues: {
        mode: "insert",
        pineconeIndex: "documents"
      }
    }
  }),

  skill('n8n-parameter-generation', {
    nodeType: "@n8n/n8n-nodes-langchain.documentDefaultDataLoader",
    nodeName: "Default Data Loader",
    nodeCategory: "ai",
    workflowContext: {
      purpose: "Build RAG system with document processing"
    },
    parameterHints: {
      staticValues: {
        dataType: "binary",          // CRITICAL: Explicit, not default
        loader: "pdfLoader"
      }
    }
  }),

  skill('n8n-parameter-generation', {
    nodeType: "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
    nodeName: "Embeddings OpenAI",
    nodeCategory: "ai",
    workflowContext: {
      purpose: "Build RAG system with document processing"
    },
    parameterHints: {
      staticValues: {
        model: "text-embedding-ada-002"
      }
    }
  }),

  skill('n8n-parameter-generation', {
    nodeType: "@n8n/n8n-nodes-langchain.textSplitterRecursive",
    nodeName: "Recursive Character Text Splitter",
    nodeCategory: "ai",
    workflowContext: {
      purpose: "Build RAG system with document processing"
    },
    parameterHints: {
      staticValues: {
        chunkSize: 1000,
        chunkOverlap: 200
      }
    }
  })
]);
```

**Output**:
```typescript
{
  nodeConfigurations: [
    {
      nodeId: "uuid-1",
      nodeName: "Manual Trigger",
      nodeType: "n8n-nodes-base.manualTrigger",
      parameters: {},
      validation: { passed: true, checks: [] }
    },
    {
      nodeId: "uuid-2",
      nodeName: "Pinecone Vector Store",
      nodeType: "@n8n/n8n-nodes-langchain.vectorStorePinecone",
      parameters: {
        mode: "insert",
        pineconeIndex: "documents",
        pineconeNamespace: "default",
        options: {
          clearNamespace: false,
          metadata: {
            source: "={{ $json.source }}",
            timestamp: "={{ $now }}"
          }
        }
      },
      credentials: {
        name: "pineconeApi",
        type: "pineconeApi"
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'no-default-reliance', status: 'pass' },
          { rule: 'pinecone-index-set', status: 'pass' }
        ]
      }
    },
    {
      nodeId: "uuid-3",
      nodeName: "Default Data Loader",
      nodeType: "@n8n/n8n-nodes-langchain.documentDefaultDataLoader",
      parameters: {
        dataType: "binary",           // EXPLICIT, not default
        loader: "pdfLoader",
        options: {
          splitPages: true,
          metadata: {
            documentType: "pdf"
          }
        }
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'no-default-reliance', status: 'pass', message: 'dataType explicitly set to binary' },
          { rule: 'loader-type-set', status: 'pass' }
        ]
      }
    },
    {
      nodeId: "uuid-4",
      nodeName: "Embeddings OpenAI",
      nodeType: "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
      parameters: {
        model: "text-embedding-ada-002",
        options: {
          dimensions: 1536,
          stripNewLines: true
        }
      },
      credentials: {
        name: "openAiApi",
        type: "openAiApi"
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'no-default-reliance', status: 'pass' },
          { rule: 'embedding-model-set', status: 'pass' }
        ]
      }
    },
    {
      nodeId: "uuid-5",
      nodeName: "Recursive Character Text Splitter",
      nodeType: "@n8n/n8n-nodes-langchain.textSplitterRecursive",
      parameters: {
        chunkSize: 1000,
        chunkOverlap: 200,
        options: {
          separators: ["\n\n", "\n", " ", ""]
        }
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'no-default-reliance', status: 'pass' },
          { rule: 'chunk-size-set', status: 'pass' },
          { rule: 'overlap-set', status: 'pass' }
        ]
      }
    }
  ],
  bestPracticesApplied: {
    noDefaults: true,
    systemMessageSeparation: false,     // No agent/chain nodes
    fromAIExpressions: false,           // No tool nodes
    workflowConfiguration: false
  },
  configurationStrategy: 'parallel',
  estimatedTokenUsage: 1000               // 5 nodes × 200 tokens
}
```

### Example 3: AI Agent with Gmail and Calendar Tools

**Input** (from workflow-architect):
```typescript
{
  nodes: [
    {
      id: "uuid-1",
      name: "Manual Trigger",
      type: "n8n-nodes-base.manualTrigger",
      category: "trigger"
    },
    {
      id: "uuid-2",
      name: "AI Agent",
      type: "@n8n/n8n-nodes-langchain.agent",
      category: "ai"
    },
    {
      id: "uuid-3",
      name: "OpenAI Chat Model",
      type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      category: "ai"
    },
    {
      id: "uuid-4",
      name: "Gmail Tool",
      type: "@n8n/n8n-nodes-langchain.toolGmail",
      category: "ai"
    },
    {
      id: "uuid-5",
      name: "Google Calendar Tool",
      type: "@n8n/n8n-nodes-langchain.toolCalendar",
      category: "ai"
    },
    {
      id: "uuid-6",
      name: "Window Buffer Memory",
      type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      category: "ai"
    }
  ],
  workflowContext: {
    purpose: "AI agent with email and calendar management tools",
    pattern: "ai-agent"
  }
}
```

**Agent Actions**:
```typescript
// Configure in parallel
const configs = await Promise.all([
  skill('n8n-parameter-generation', {
    nodeType: "n8n-nodes-base.manualTrigger",
    nodeName: "Manual Trigger",
    nodeCategory: "trigger",
    workflowContext: { purpose: "AI agent with email and calendar management tools" }
  }),

  // AI Agent - requires system message separation
  skill('n8n-parameter-generation', {
    nodeType: "@n8n/n8n-nodes-langchain.agent",
    nodeName: "AI Agent",
    nodeCategory: "ai",
    workflowContext: {
      purpose: "AI agent with email and calendar management tools",
      previousNodes: ["Manual Trigger"]
    },
    parameterHints: {
      dynamicSources: ["text"],        // User input is dynamic
      staticValues: {
        promptType: "define"
      }
    }
  }),

  skill('n8n-parameter-generation', {
    nodeType: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
    nodeName: "OpenAI Chat Model",
    nodeCategory: "ai",
    workflowContext: { purpose: "AI agent with email and calendar management tools" },
    parameterHints: {
      staticValues: {
        model: "gpt-4-turbo-preview"
      }
    }
  }),

  // Gmail Tool - requires $fromAI expressions
  skill('n8n-parameter-generation', {
    nodeType: "@n8n/n8n-nodes-langchain.toolGmail",
    nodeName: "Gmail Tool",
    nodeCategory: "ai",
    workflowContext: { purpose: "AI agent with email and calendar management tools" },
    parameterHints: {
      toolMode: true,                   // CRITICAL: Enable $fromAI
      dynamicSources: ["all"]
    }
  }),

  // Calendar Tool - requires $fromAI expressions
  skill('n8n-parameter-generation', {
    nodeType: "@n8n/n8n-nodes-langchain.toolCalendar",
    nodeName: "Google Calendar Tool",
    nodeCategory: "ai",
    workflowContext: { purpose: "AI agent with email and calendar management tools" },
    parameterHints: {
      toolMode: true,                   // CRITICAL: Enable $fromAI
      dynamicSources: ["all"]
    }
  }),

  skill('n8n-parameter-generation', {
    nodeType: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
    nodeName: "Window Buffer Memory",
    nodeCategory: "ai",
    workflowContext: { purpose: "AI agent with email and calendar management tools" },
    parameterHints: {
      staticValues: {
        windowSize: 10
      }
    }
  })
]);
```

**Output**:
```typescript
{
  nodeConfigurations: [
    {
      nodeId: "uuid-1",
      nodeName: "Manual Trigger",
      nodeType: "n8n-nodes-base.manualTrigger",
      parameters: {},
      validation: { passed: true, checks: [] }
    },
    {
      nodeId: "uuid-2",
      nodeName: "AI Agent",
      nodeType: "@n8n/n8n-nodes-langchain.agent",
      parameters: {
        promptType: "define",
        text: "={{ $json.userInput }}",     // User context ONLY
        options: {
          systemMessage: "You are a specialized assistant that helps with email and calendar management. You have access to Gmail and Google Calendar tools. Always confirm actions before executing them. Be concise and helpful."
        },
        hasOutputParser: false
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'system-message-separation', status: 'pass', message: 'System message in options, user context in text parameter' },
          { rule: 'no-mixed-context', status: 'pass' }
        ]
      }
    },
    {
      nodeId: "uuid-3",
      nodeName: "OpenAI Chat Model",
      nodeType: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      parameters: {
        model: "gpt-4-turbo-preview",
        options: {
          temperature: 0.7,
          maxTokens: 1000
        }
      },
      credentials: {
        name: "openAiApi",
        type: "openAiApi"
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'no-default-reliance', status: 'pass' },
          { rule: 'model-set', status: 'pass' }
        ]
      }
    },
    {
      nodeId: "uuid-4",
      nodeName: "Gmail Tool",
      nodeType: "@n8n/n8n-nodes-langchain.toolGmail",
      parameters: {
        operation: "sendEmail",
        sendTo: "={{ $fromAI('to') }}",                    // DYNAMIC from agent
        subject: "={{ $fromAI('subject') }}",
        message: "={{ $fromAI('message_html', '', 'Hello!') }}",
        options: {
          ccList: "={{ $fromAI('cc', '', '') }}",
          bccList: "={{ $fromAI('bcc', '', '') }}",
          attachments: "binary_data"
        }
      },
      credentials: {
        name: "gmailOAuth2",
        type: "gmailOAuth2"
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'fromAI-expressions', status: 'pass', message: 'All parameters use $fromAI()' },
          { rule: 'tool-node-dynamic', status: 'pass' }
        ]
      }
    },
    {
      nodeId: "uuid-5",
      nodeName: "Google Calendar Tool",
      nodeType: "@n8n/n8n-nodes-langchain.toolCalendar",
      parameters: {
        operation: "createEvent",
        summary: "={{ $fromAI('title') }}",
        start: "={{ $fromAI('start_time') }}",
        end: "={{ $fromAI('end_time') }}",
        options: {
          description: "={{ $fromAI('description', '', '') }}",
          location: "={{ $fromAI('location', '', '') }}",
          attendees: "={{ $fromAI('attendees', '', '') }}"
        }
      },
      credentials: {
        name: "googleCalendarOAuth2",
        type: "googleCalendarOAuth2"
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'fromAI-expressions', status: 'pass' },
          { rule: 'tool-node-dynamic', status: 'pass' }
        ]
      }
    },
    {
      nodeId: "uuid-6",
      nodeName: "Window Buffer Memory",
      nodeType: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      parameters: {
        windowSize: 10,
        options: {
          returnMessages: true
        }
      },
      validation: {
        passed: true,
        checks: [
          { rule: 'no-default-reliance', status: 'pass' },
          { rule: 'memory-window-set', status: 'pass' }
        ]
      }
    }
  ],
  bestPracticesApplied: {
    noDefaults: true,
    systemMessageSeparation: true,      // ✅ Agent has separated system message
    fromAIExpressions: true,            // ✅ Tool nodes use $fromAI
    workflowConfiguration: false
  },
  configurationStrategy: 'parallel',
  estimatedTokenUsage: 1200               // 6 nodes × 200 tokens
}
```

## Integration with Best Practices Guardian

After parameter configuration, hand off to best-practices-guardian with:
```typescript
{
  configuredNodes: ParameterConfigurationResult,
  workflowPattern: 'simple' | 'rag' | 'ai-agent' | 'complex',
  validationFocus: {
    checkSystemMessages: boolean,     // For AI workflows
    checkFromAI: boolean,             // For agent + tool workflows
    checkDefaults: boolean,           // Always true
  }
}
```

## Performance Metrics

- **Token Efficiency**: N nodes × 200 tokens (vs N × 5,000 for full LLM context)
- **Configuration Accuracy**: 95%+ correct parameter values
- **Best Practices Compliance**: 100% enforcement (mandatory rules)
- **Parallel Configuration**: 3-5x faster than sequential

## Quality Checks

Before returning configurations:
1. ✅ All parameters explicitly set (no defaults)
2. ✅ System messages separated (AI nodes)
3. ✅ $fromAI expressions used (tool nodes)
4. ✅ Credentials identified (where required)
5. ✅ Dynamic expressions valid
6. ✅ Static values appropriate for context

## Error Handling

- **Missing hints**: Use intelligent defaults based on node type
- **Invalid expressions**: Validate syntax before returning
- **Credential detection**: Warn if credentials required but not specified
- **Parameter conflicts**: Detect and resolve conflicting parameter values
