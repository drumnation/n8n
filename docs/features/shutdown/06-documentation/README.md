# Shutdown Module

## Overview

The Shutdown module manages graceful application termination in n8n, ensuring running workflows complete, connections close properly, and data persists before the process exits.

**Module Path**: `packages/cli/src/shutdown/`

## Core Components

### Shutdown Service
- Signal handling (SIGTERM, SIGINT)
- Graceful workflow completion
- Connection cleanup
- State persistence

## Shutdown Sequence
```typescript
1. Receive shutdown signal
2. Stop accepting new executions
3. Wait for active executions (with timeout)
4. Close database connections
5. Flush caches and queues
6. Save application state
7. Exit process
```

## Configuration
```bash
N8N_GRACEFUL_SHUTDOWN_TIMEOUT=30
N8N_FORCE_SHUTDOWN_TIMEOUT=60
```

## Best Practices
1. Always use graceful shutdown
2. Set reasonable timeouts
3. Monitor shutdown duration
4. Log shutdown events
5. Test shutdown scenarios