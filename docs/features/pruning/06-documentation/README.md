# Data Pruning Module

## Overview

The Pruning module automatically removes old execution data, logs, and temporary files to prevent database growth and maintain optimal performance in n8n.

**Module Path**: `packages/cli/src/pruning/`

## Core Components

### Pruning Service
- Scheduled cleanup jobs
- Retention policy enforcement
- Batch deletion
- Performance optimization

## Pruning Targets
```typescript
interface PruningTargets {
  executions: {
    maxAge: number;
    maxCount: number;
    keepSuccessful: boolean;
  };
  binaryData: {
    maxAge: number;
    orphanedOnly: boolean;
  };
  logs: {
    maxAge: number;
    logLevel: string;
  };
}
```

## Configuration
```bash
N8N_PRUNING_ENABLED=true
N8N_PRUNING_INTERVAL_TIME=60
N8N_PRUNING_MAX_EXECUTION_AGE=336
N8N_PRUNING_MAX_COUNT=10000
N8N_PRUNING_DELETE_SUCCESSFUL=true
```

## Best Practices
1. Set appropriate retention periods
2. Schedule during low-usage times
3. Monitor pruning performance
4. Archive before deletion if needed
5. Test pruning rules carefully