# MCP (Model Context Protocol) Module

## Overview

The MCP module implements the Model Context Protocol server in n8n, enabling AI agents and language models to interact with n8n workflows programmatically. It provides a standardized interface for AI systems to discover, execute, and manage workflows through a well-defined protocol.

**Module Path**: `packages/cli/src/modules/mcp/`

## Core Components

### 1. MCP Service (`mcp.service.ts`)
- **Purpose**: Main MCP server implementation
- **Key Features**:
  - Protocol message handling
  - Tool registration and discovery
  - Session management
  - Error handling and validation

### 2. MCP OAuth Services
- **OAuth Token Service** (`mcp-oauth-token.service.ts`): Token generation and validation
- **OAuth Authorization Code Service** (`mcp-oauth-authorization-code.service.ts`): Authorization flow
- **OAuth Consent Service** (`mcp-oauth-consent.service.ts`): User consent management
- **OAuth Session Service** (`oauth-session.service.ts`): Session state management

### 3. MCP API Key Service (`mcp-api-key.service.ts`)
- **Purpose**: API key authentication for MCP clients
- **Key Features**:
  - Key generation and rotation
  - Rate limiting per key
  - Usage tracking
  - Scope management

### 4. MCP Settings Service (`mcp.settings.service.ts`)
- **Purpose**: Configuration management
- **Key Features**:
  - Server settings
  - Client registration
  - Security policies
  - Feature toggles

### 5. MCP Middleware Service (`mcp-server-middleware.service.ts`)
- **Purpose**: Request/response processing
- **Key Features**:
  - Authentication validation
  - Request logging
  - Rate limiting
  - CORS handling

## Architecture

```mermaid
graph TB
    subgraph "AI Clients"
        LLM[Language Models]
        AGENT[AI Agents]
        IDE[IDE Extensions]
    end

    subgraph "MCP Server"
        PROTO[Protocol Handler]
        AUTH[Auth Layer]
        TOOLS[Tool Registry]
        EXEC[Execution Engine]
    end

    subgraph "n8n Core"
        WF[Workflow Engine]
        CRED[Credentials]
        API[REST API]
        DB[(Database)]
    end

    subgraph "Tools"
        GET[get_workflow_details]
        SEARCH[search_workflows]
        EXEC_WF[execute_workflow]
        CREATE[create_workflow]
    end

    LLM --> PROTO
    AGENT --> PROTO
    IDE --> PROTO

    PROTO --> AUTH
    AUTH --> TOOLS
    TOOLS --> EXEC

    EXEC --> WF
    EXEC --> CRED
    EXEC --> API
    EXEC --> DB

    TOOLS --> GET
    TOOLS --> SEARCH
    TOOLS --> EXEC_WF
    TOOLS --> CREATE
```

## Protocol Implementation

### MCP Messages
```typescript
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: MCPError;
}

interface MCPError {
  code: number;
  message: string;
  data?: any;
}
```

### Available Tools

#### 1. Get Workflow Details
```typescript
{
  name: 'get_workflow_details',
  description: 'Get detailed information about a workflow',
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'The workflow ID'
      }
    },
    required: ['workflowId']
  }
}
```

#### 2. Search Workflows
```typescript
{
  name: 'search_workflows',
  description: 'Search for workflows by name or tags',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags'
      },
      active: {
        type: 'boolean',
        description: 'Filter by active status'
      }
    }
  }
}
```

#### 3. Execute Workflow
```typescript
{
  name: 'execute_workflow',
  description: 'Execute a workflow with input data',
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'The workflow ID to execute'
      },
      inputData: {
        type: 'object',
        description: 'Input data for the workflow'
      },
      waitForCompletion: {
        type: 'boolean',
        description: 'Wait for execution to complete',
        default: true
      }
    },
    required: ['workflowId']
  }
}
```

#### 4. Create Workflow
```typescript
{
  name: 'create_workflow',
  description: 'Create a new workflow from JSON',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Workflow name'
      },
      nodes: {
        type: 'array',
        description: 'Workflow nodes'
      },
      connections: {
        type: 'object',
        description: 'Node connections'
      },
      active: {
        type: 'boolean',
        description: 'Activate workflow after creation',
        default: false
      }
    },
    required: ['name', 'nodes', 'connections']
  }
}
```

## Authentication

### OAuth 2.0 Flow
```typescript
// Authorization endpoint
GET /oauth/authorize?
  client_id=CLIENT_ID&
  redirect_uri=REDIRECT_URI&
  response_type=code&
  scope=workflows:read,workflows:execute&
  state=RANDOM_STATE

// Token exchange
POST /oauth/token
{
  grant_type: 'authorization_code',
  code: 'AUTH_CODE',
  client_id: 'CLIENT_ID',
  client_secret: 'CLIENT_SECRET',
  redirect_uri: 'REDIRECT_URI'
}

// Response
{
  access_token: 'ACCESS_TOKEN',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'REFRESH_TOKEN',
  scope: 'workflows:read workflows:execute'
}
```

### API Key Authentication
```typescript
// Using API key in headers
{
  'Authorization': 'Bearer mcp_key_xxxxxxxxxxxxx',
  'X-MCP-Client-Id': 'client-123'
}

// API key structure
interface MCPApiKey {
  id: string;
  key: string;
  clientId: string;
  name: string;
  scopes: string[];
  rateLimit: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}
```

## Client Integration

### JavaScript/TypeScript Client
```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient({
  server: 'http://localhost:5678/mcp',
  apiKey: 'mcp_key_xxxxxxxxxxxxx'
});

// List available tools
const tools = await client.listTools();

// Execute a tool
const result = await client.executeTool({
  name: 'search_workflows',
  arguments: {
    query: 'email automation',
    active: true
  }
});

// Execute workflow
const execution = await client.executeTool({
  name: 'execute_workflow',
  arguments: {
    workflowId: 'workflow_123',
    inputData: {
      email: 'user@example.com',
      subject: 'Test Email'
    }
  }
});
```

### Python Client
```python
from mcp import MCPClient

client = MCPClient(
    server="http://localhost:5678/mcp",
    api_key="mcp_key_xxxxxxxxxxxxx"
)

# Search workflows
workflows = client.execute_tool(
    "search_workflows",
    {"query": "data processing", "active": True}
)

# Execute workflow
result = client.execute_tool(
    "execute_workflow",
    {
        "workflowId": "workflow_456",
        "inputData": {"file": "data.csv"}
    }
)
```

## Security

### Scopes and Permissions
```typescript
enum MCPScope {
  WORKFLOWS_READ = 'workflows:read',
  WORKFLOWS_WRITE = 'workflows:write',
  WORKFLOWS_EXECUTE = 'workflows:execute',
  CREDENTIALS_READ = 'credentials:read',
  CREDENTIALS_WRITE = 'credentials:write',
  ADMIN = 'admin'
}

// Scope validation
function validateScope(
  requiredScope: MCPScope,
  userScopes: MCPScope[]
): boolean {
  return userScopes.includes(requiredScope) ||
    userScopes.includes(MCPScope.ADMIN);
}
```

### Rate Limiting
```typescript
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyGenerator: (req: Request) => string;
}

const rateLimits = {
  default: { windowMs: 60000, maxRequests: 100 },
  execute: { windowMs: 60000, maxRequests: 10 },
  create: { windowMs: 60000, maxRequests: 20 }
};
```

## Configuration

### Environment Variables
```bash
# MCP Server Configuration
N8N_MCP_ENABLED=true
N8N_MCP_PORT=5678
N8N_MCP_PATH=/mcp

# Authentication
N8N_MCP_AUTH_REQUIRED=true
N8N_MCP_OAUTH_ENABLED=true
N8N_MCP_API_KEYS_ENABLED=true

# Rate Limiting
N8N_MCP_RATE_LIMIT_WINDOW_MS=60000
N8N_MCP_RATE_LIMIT_MAX_REQUESTS=100

# Security
N8N_MCP_ALLOWED_ORIGINS=http://localhost:*,https://*.example.com
N8N_MCP_MAX_PAYLOAD_SIZE=10mb
```

## Monitoring

### Metrics
```typescript
{
  'mcp.requests': counter,
  'mcp.tool_executions': counter,
  'mcp.auth_failures': counter,
  'mcp.rate_limit_hits': counter,
  'mcp.response_time': histogram,
  'mcp.active_sessions': gauge,
  'mcp.workflow_executions': counter
}
```

### Audit Logging
```typescript
interface MCPAuditLog {
  timestamp: Date;
  clientId: string;
  method: string;
  tool?: string;
  parameters?: any;
  result?: 'success' | 'failure';
  error?: string;
  duration: number;
  ip: string;
}
```

## Error Handling

### MCP Error Codes
```typescript
enum MCPErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // Custom errors
  UNAUTHORIZED = -32000,
  FORBIDDEN = -32001,
  RESOURCE_NOT_FOUND = -32002,
  RATE_LIMIT_EXCEEDED = -32003,
  WORKFLOW_EXECUTION_FAILED = -32004
}
```

## Testing

### Integration Tests
```typescript
describe('MCP Server', () => {
  test('should list available tools', async () => {
    const response = await mcpClient.request({
      method: 'tools/list',
      params: {}
    });

    expect(response.result).toContainEqual(
      expect.objectContaining({
        name: 'execute_workflow'
      })
    );
  });

  test('should execute workflow', async () => {
    const response = await mcpClient.request({
      method: 'tools/call',
      params: {
        name: 'execute_workflow',
        arguments: {
          workflowId: 'test_workflow',
          inputData: { test: true }
        }
      }
    });

    expect(response.result.executionId).toBeDefined();
  });
});
```

## IDE Integration

### VS Code Extension
```json
{
  "mcp.servers": {
    "n8n": {
      "command": "n8n",
      "args": ["mcp", "start"],
      "env": {
        "N8N_MCP_PORT": "5678"
      }
    }
  }
}
```

### Cursor/Claude Integration
The MCP server allows AI assistants to:
- Search and discover workflows
- Execute workflows with parameters
- Create and modify workflows
- Monitor execution status

## Best Practices

1. **Use appropriate scopes** - Grant minimal required permissions
2. **Implement retry logic** - Handle transient failures gracefully
3. **Cache tool listings** - Tools don't change frequently
4. **Monitor usage** - Track API key usage and patterns
5. **Validate inputs** - Sanitize all tool arguments
6. **Log all operations** - Maintain audit trail
7. **Use webhooks** - For long-running workflow notifications

## Future Enhancements

### Planned Features
1. **Streaming responses** - Real-time execution updates
2. **Batch operations** - Execute multiple workflows
3. **Tool composition** - Chain multiple tools
4. **Custom tools** - User-defined MCP tools
5. **WebSocket support** - Persistent connections

### Roadmap
- Q1 2025: Streaming and WebSocket support
- Q2 2025: Batch operations
- Q3 2025: Tool composition
- Q4 2025: Custom tool framework