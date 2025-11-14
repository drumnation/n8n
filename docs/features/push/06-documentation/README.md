# Push Notifications Module

## Overview

The Push module enables real-time communication between n8n backend and frontend through WebSocket connections and Server-Sent Events (SSE). It provides instant updates for workflow executions, system events, and collaborative features.

**Module Path**: `packages/cli/src/push/`

## Core Components

### Push Service
- WebSocket server management
- SSE connection handling
- Message broadcasting
- Connection pooling

### Message Types
```typescript
enum PushMessageType {
  EXECUTION_STARTED = 'executionStarted',
  EXECUTION_FINISHED = 'executionFinished',
  WORKFLOW_UPDATED = 'workflowUpdated',
  WORKFLOW_ACTIVATED = 'workflowActivated',
  NODE_EXECUTION_STARTED = 'nodeExecutionStarted',
  NODE_EXECUTION_FINISHED = 'nodeExecutionFinished',
  TEST_WEBHOOK_RECEIVED = 'testWebhookReceived',
  RELOAD_UI = 'reloadUI'
}
```

## WebSocket Implementation
```typescript
// Client connection
const ws = new WebSocket('ws://localhost:5678/push');

// Listen for messages
ws.on('message', (data) => {
  const message = JSON.parse(data);
  handlePushMessage(message);
});

// Server broadcasting
pushService.broadcast({
  type: 'executionFinished',
  data: {
    executionId: '123',
    status: 'success'
  }
});
```

## Configuration
```bash
N8N_PUSH_ENABLED=true
N8N_PUSH_BACKEND=websocket # or 'sse'
N8N_PUSH_MAX_CONNECTIONS=1000
N8N_PUSH_HEARTBEAT_INTERVAL=30000
```

## Best Practices
1. Implement reconnection logic
2. Handle connection limits
3. Use message queuing for reliability
4. Monitor connection health
5. Implement proper authentication