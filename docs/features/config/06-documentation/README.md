# Configuration Module

## Overview

The Configuration module (@n8n/config) provides centralized configuration management for n8n, handling environment variables, config files, defaults, and validation across all n8n packages.

**Module Path**: `packages/@n8n/config/`

## Core Components

### Config Schema
- Type-safe configuration
- Environment variable mapping
- Default values
- Validation rules

## Configuration Sources
1. Environment variables (highest priority)
2. Config files (n8n.json)
3. Default values (lowest priority)

## Key Configurations
```typescript
interface Config {
  database: DatabaseConfig;
  executions: ExecutionsConfig;
  workflows: WorkflowsConfig;
  credentials: CredentialsConfig;
  nodes: NodesConfig;
  userManagement: UserManagementConfig;
  endpoints: EndpointsConfig;
  security: SecurityConfig;
}
```

## Environment Variables
```bash
# Database
DB_TYPE=sqlite
DB_SQLITE_DATABASE=database.sqlite

# Executions
EXECUTIONS_MODE=regular
EXECUTIONS_TIMEOUT=3600

# Security
N8N_ENCRYPTION_KEY=xxx
```

## Best Practices
1. Use environment variables for secrets
2. Validate configuration on startup
3. Document all config options
4. Provide sensible defaults
5. Use type-safe config objects