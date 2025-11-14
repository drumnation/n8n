# Workflows Feature Documentation

## Overview

The Workflows feature is the core engine of n8n, providing the foundation for creating, managing, and executing automated workflows. This feature enables users to design complex automation sequences through a visual node-based interface, making automation accessible to both technical and non-technical users.

## Quick Start

### Creating a Workflow

```typescript
// Using the REST API
const workflow = await fetch('/api/v1/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My First Workflow',
    nodes: [...],
    connections: {...},
    settings: {}
  })
});
```

### Basic Workflow Structure

```json
{
  "id": "workflow_123",
  "name": "Example Workflow",
  "active": false,
  "nodes": [
    {
      "id": "node_1",
      "name": "Start",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 300],
      "parameters": {}
    }
  ],
  "connections": {
    "Start": {
      "main": [[{"node": "Next Node", "type": "main", "index": 0}]]
    }
  }
}
```

## Architecture

The Workflows feature follows a layered architecture:

- **Controller Layer**: REST API endpoints for workflow operations
- **Service Layer**: Business logic and workflow management
- **Repository Layer**: Database operations and persistence
- **Execution Layer**: Workflow execution engine

For detailed architecture information, see [Architecture Documentation](./02-architecture/architecture.md).

## Core Features

### 1. Workflow Management
- Create, read, update, and delete workflows
- Duplicate existing workflows
- Import/export workflow JSON
- Workflow templates and examples

### 2. Workflow Execution
- Manual execution via UI or API
- Scheduled execution (cron)
- Webhook-triggered execution
- Event-based triggers
- Workflow chaining

### 3. Collaboration
- Project-based organization
- Role-based access control
- Workflow sharing
- Ownership management

### 4. Version Control (Enterprise)
- Complete change history
- Version comparison
- Rollback capabilities
- Audit logging

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workflows` | Create new workflow |
| GET | `/workflows` | List all workflows |
| GET | `/workflows/:id` | Get specific workflow |
| PATCH | `/workflows/:id` | Update workflow |
| DELETE | `/workflows/:id` | Delete workflow |
| POST | `/workflows/:id/activate` | Activate workflow |
| POST | `/workflows/:id/deactivate` | Deactivate workflow |
| POST | `/workflows/:id/execute` | Execute workflow |

### TypeScript Interfaces

```typescript
interface IWorkflowData {
  id: string;
  name: string;
  active: boolean;
  nodes: INode[];
  connections: IConnections;
  settings: IWorkflowSettings;
  staticData?: IDataObject;
  tags?: string[];
  pinData?: IPinData;
  versionId?: string;
  meta?: WorkflowMetadata;
}

interface INode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: INodeParameters;
  typeVersion: number;
  credentials?: INodeCredentials;
}
```

## Configuration

### Environment Variables

```bash
# Workflow execution mode
EXECUTIONS_MODE=regular|queue

# Workflow timeout settings
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_TIMEOUT_MAX=7200

# Workflow concurrency
EXECUTIONS_CONCURRENCY=10

# Enable workflow templates
N8N_TEMPLATES_ENABLED=true
```

### Workflow Settings

```json
{
  "settings": {
    "executionOrder": "v1",
    "saveDataErrorExecution": "all",
    "saveDataSuccessExecution": "all",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner",
    "errorWorkflow": "workflow_error_handler_id"
  }
}
```

## Development Guide

### Local Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test:unit packages/cli/src/workflows

# Build for production
pnpm build
```

### Creating Custom Triggers

```typescript
import { ITriggerFunctions, INodeType } from 'n8n-workflow';

export class CustomTrigger implements INodeType {
  description = {
    displayName: 'Custom Trigger',
    name: 'customTrigger',
    group: ['trigger'],
    version: 1,
    description: 'Custom workflow trigger',
    defaults: { name: 'Custom Trigger' },
    inputs: [],
    outputs: ['main']
  };

  async trigger(this: ITriggerFunctions) {
    // Trigger implementation
  }
}
```

### Testing Workflows

```typescript
import { WorkflowTestHelper } from '@test/workflow-test-helper';

describe('Workflow Tests', () => {
  it('should execute workflow successfully', async () => {
    const workflow = WorkflowTestHelper.createWorkflow({
      nodes: [...],
      connections: {...}
    });

    const result = await WorkflowTestHelper.execute(workflow);
    expect(result.finished).toBe(true);
  });
});
```

## Best Practices

### Workflow Design
1. **Keep workflows focused**: Single responsibility principle
2. **Use meaningful names**: Clear node and workflow naming
3. **Add descriptions**: Document complex logic
4. **Error handling**: Always include error workflows
5. **Testing**: Use pin data for development

### Performance Optimization
1. **Limit node count**: Keep under 100 nodes per workflow
2. **Batch operations**: Process data in batches
3. **Async processing**: Use queue mode for heavy workloads
4. **Caching**: Leverage static data for expensive operations
5. **Resource limits**: Set appropriate timeouts

### Security
1. **Credential management**: Never hardcode credentials
2. **Input validation**: Validate all external inputs
3. **Access control**: Use appropriate permissions
4. **Audit logging**: Enable for compliance
5. **Webhook security**: Use webhook signatures

## Troubleshooting

### Common Issues

#### Workflow Won't Activate
```bash
# Check logs
tail -f ~/.n8n/logs/main.log

# Verify webhook URL
curl -X POST https://your-instance/webhook/workflow-id
```

#### Execution Failures
```javascript
// Enable debug mode
process.env.NODE_ENV = 'development';
process.env.N8N_LOG_LEVEL = 'debug';
```

#### Performance Issues
```sql
-- Check slow workflows
SELECT id, name, nodes_count
FROM workflow_entity
WHERE nodes_count > 100;
```

### Debug Tools

1. **Execution Preview**: Test with sample data
2. **Pin Data**: Save test data for development
3. **Debug Console**: Built-in Node.js debugging
4. **Logs**: Comprehensive logging system
5. **Metrics**: Performance monitoring

## Migration Guide

### From File-Based to Database

```bash
# Export existing workflows
n8n export:workflow --all --output=./backup

# Import to new instance
n8n import:workflow --input=./backup
```

### Version Upgrades

```javascript
// Workflow format migration
const migrateWorkflow = (oldWorkflow) => {
  return {
    ...oldWorkflow,
    settings: {
      ...oldWorkflow.settings,
      executionOrder: 'v1' // New execution order
    }
  };
};
```

## Enterprise Features

### Advanced Permissions
- Granular role-based access
- Custom permission sets
- Workflow approval process
- Execution limits

### Audit & Compliance
- Complete audit trail
- Change tracking
- Compliance reporting
- Data retention policies

### High Availability
- Multi-instance deployment
- Load balancing
- Automatic failover
- Disaster recovery

## Related Documentation

- [Product Requirements Document](./01-planning/PRD.md)
- [Architecture Documentation](./02-architecture/architecture.md)
- [API Reference](https://docs.n8n.io/api/)
- [User Guide](https://docs.n8n.io/workflows/)

## Support

### Community Support
- [Community Forum](https://community.n8n.io)
- [Discord Server](https://discord.gg/n8n)
- [GitHub Issues](https://github.com/n8n-io/n8n/issues)

### Enterprise Support
- Email: enterprise@n8n.io
- Support Portal: support.n8n.io
- SLA: 24/7 for critical issues

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines on contributing to the Workflows feature.

## License

This feature is part of n8n and follows the project's licensing terms. Enterprise features require a valid license.

---

**Last Updated**: 2025-11-10
**Version**: 1.0.0
**Status**: Production
**BMAD Compliance**: ✅ Complete