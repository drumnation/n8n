# Public API Feature Documentation

## Overview

The Public API feature provides a RESTful API interface for programmatic access to n8n resources. It enables external applications to manage workflows, executions, credentials, and other n8n entities through a standardized API with OpenAPI specification support.

## Core Concepts

### API Version
- Current version: v1
- Base path: `/api/v1`
- Versioned for backward compatibility
- OpenAPI 3.0 specification

### Authentication
- API key-based authentication
- Bearer token format
- Scoped permissions per key
- Rate limiting per key

## Architecture

### Component Structure
```
public-api/
├── v1/
│   ├── handlers/
│   │   ├── workflows/
│   │   ├── executions/
│   │   ├── credentials/
│   │   └── users/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── openapi/
│   │   └── spec.json
│   └── public-api.controller.ts
└── api-key.service.ts
```

### API Architecture

```mermaid
graph TB
    Client[API Client] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Middleware]
    Auth --> RateLimit[Rate Limiter]
    RateLimit --> Router[API Router]

    Router --> WF[Workflows Handler]
    Router --> EX[Executions Handler]
    Router --> CR[Credentials Handler]
    Router --> US[Users Handler]

    WF --> WFS[Workflow Service]
    EX --> EXS[Execution Service]
    CR --> CRS[Credential Service]
    US --> USS[User Service]
```

## API Reference

### Base Endpoints

| Resource | Endpoint | Operations |
|----------|----------|------------|
| Workflows | `/api/v1/workflows` | GET, POST, PUT, DELETE |
| Executions | `/api/v1/executions` | GET, POST, DELETE |
| Credentials | `/api/v1/credentials` | GET, POST, PUT, DELETE |
| Users | `/api/v1/users` | GET, POST, PUT, DELETE |

### Workflows API

```bash
# List workflows
GET /api/v1/workflows
Query params: active, tags, limit, cursor

# Get workflow
GET /api/v1/workflows/:id

# Create workflow
POST /api/v1/workflows
Body: { name, nodes, connections, settings }

# Update workflow
PUT /api/v1/workflows/:id
Body: { name, nodes, connections, active }

# Delete workflow
DELETE /api/v1/workflows/:id

# Activate workflow
POST /api/v1/workflows/:id/activate

# Deactivate workflow
POST /api/v1/workflows/:id/deactivate

# Execute workflow
POST /api/v1/workflows/:id/execute
Body: { data }
```

### Executions API

```bash
# List executions
GET /api/v1/executions
Query params: workflowId, status, limit, cursor

# Get execution
GET /api/v1/executions/:id

# Delete execution
DELETE /api/v1/executions/:id

# Stop execution
POST /api/v1/executions/:id/stop

# Retry execution
POST /api/v1/executions/:id/retry
```

### Credentials API

```bash
# List credentials
GET /api/v1/credentials
Query params: type, limit, cursor

# Get credential
GET /api/v1/credentials/:id

# Create credential
POST /api/v1/credentials
Body: { name, type, data }

# Update credential
PUT /api/v1/credentials/:id
Body: { name, data }

# Delete credential
DELETE /api/v1/credentials/:id

# Test credential
POST /api/v1/credentials/:id/test
```

## Authentication

### API Key Management

```typescript
// Create API key
POST /api/v1/api-keys
{
  "name": "Production API Key",
  "scopes": ["workflow:read", "workflow:execute"],
  "expiresAt": "2025-12-31"
}

// Response
{
  "id": "api_key_123",
  "apiKey": "n8n_api_1234567890abcdef",
  "name": "Production API Key",
  "scopes": ["workflow:read", "workflow:execute"],
  "createdAt": "2025-01-01",
  "expiresAt": "2025-12-31"
}
```

### Using API Keys

```bash
# Header authentication
curl -H "X-N8N-API-KEY: n8n_api_1234567890abcdef" \
  https://your-instance/api/v1/workflows

# Bearer token
curl -H "Authorization: Bearer n8n_api_1234567890abcdef" \
  https://your-instance/api/v1/workflows
```

## Configuration

### Environment Variables

```bash
# Enable public API
N8N_PUBLIC_API_ENABLED=true

# API settings
N8N_PUBLIC_API_ENDPOINT=api
N8N_PUBLIC_API_VERSION=1

# Rate limiting
N8N_PUBLIC_API_RATE_LIMIT_ENABLED=true
N8N_PUBLIC_API_RATE_LIMIT_MAX_REQUESTS=100
N8N_PUBLIC_API_RATE_LIMIT_WINDOW_MS=60000

# API key settings
N8N_API_KEY_MIN_LENGTH=32
N8N_API_KEY_MAX_ACTIVE=10
```

## OpenAPI Specification

### Accessing OpenAPI Spec

```bash
# Get OpenAPI specification
GET /api/v1/docs/openapi.json

# Swagger UI (if enabled)
GET /api/v1/docs
```

### Example OpenAPI Definition

```yaml
openapi: 3.0.0
info:
  title: n8n Public API
  version: 1.0.0
paths:
  /workflows:
    get:
      summary: List workflows
      parameters:
        - name: active
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: List of workflows
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Workflow'
```

## Rate Limiting

### Configuration

```typescript
// Rate limit configuration
const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
};
```

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
Retry-After: 60
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "name": "ValidationError",
    "message": "Invalid workflow structure",
    "details": {
      "field": "nodes",
      "reason": "Node 'Start' has invalid type"
    }
  }
}
```

### HTTP Status Codes

| Code | Description | Example |
|------|-------------|---------|
| 200 | Success | GET request successful |
| 201 | Created | Resource created |
| 204 | No Content | Delete successful |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Invalid API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

## SDK Examples

### JavaScript/TypeScript

```typescript
import { N8nApi } from '@n8n/client-sdk';

const client = new N8nApi({
  baseUrl: 'https://your-instance',
  apiKey: 'n8n_api_1234567890abcdef'
});

// List workflows
const workflows = await client.workflows.getAll({
  active: true,
  limit: 10
});

// Execute workflow
const execution = await client.workflows.execute('workflow_123', {
  data: { key: 'value' }
});
```

### Python

```python
import requests

class N8nClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {'X-N8N-API-KEY': api_key}

    def get_workflows(self):
        response = requests.get(
            f'{self.base_url}/api/v1/workflows',
            headers=self.headers
        )
        return response.json()

    def execute_workflow(self, workflow_id, data):
        response = requests.post(
            f'{self.base_url}/api/v1/workflows/{workflow_id}/execute',
            headers=self.headers,
            json={'data': data}
        )
        return response.json()
```

## Best Practices

### Security
1. **Use HTTPS**: Always use HTTPS in production
2. **Rotate keys**: Regular API key rotation
3. **Minimal scopes**: Grant only necessary permissions
4. **IP allowlisting**: Restrict API access by IP
5. **Audit logging**: Log all API activity

### Performance
1. **Pagination**: Use cursor-based pagination
2. **Field filtering**: Request only needed fields
3. **Batch operations**: Group multiple operations
4. **Caching**: Implement client-side caching
5. **Compression**: Enable gzip compression

### Error Handling
1. **Retry logic**: Implement exponential backoff
2. **Error parsing**: Handle all error types
3. **Timeout handling**: Set appropriate timeouts
4. **Circuit breaker**: Prevent cascading failures
5. **Logging**: Log errors for debugging

## Troubleshooting

### Common Issues

#### Authentication Failed
```bash
# Check API key is valid
curl -I -H "X-N8N-API-KEY: your_key" \
  https://your-instance/api/v1/workflows

# Verify API is enabled
echo $N8N_PUBLIC_API_ENABLED
```

#### Rate Limit Exceeded
```javascript
// Implement retry with backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000;
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}
```

---

**Last Updated**: 2025-11-10
**Version**: 1.0.0
**BMAD Compliance**: ✅ Complete