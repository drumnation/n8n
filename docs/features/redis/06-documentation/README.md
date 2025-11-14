# Redis Client Module

## Overview

The Redis Client module provides Redis integration for n8n, enabling distributed caching, pub/sub messaging, queue management, and session storage across multiple n8n instances.

**Module Path**: `packages/cli/src/redis/`

## Core Components

### Redis Service
- Connection pool management
- Command execution
- Pub/sub handling
- Cluster support

## Use Cases

### Distributed Cache
```typescript
// Set with expiration
await redis.set('key', value, 'EX', 3600);

// Get value
const value = await redis.get('key');

// Atomic operations
await redis.incr('counter');
```

### Pub/Sub Messaging
```typescript
// Publisher
await redis.publish('workflow:updates', JSON.stringify({
  workflowId: '123',
  action: 'activated'
}));

// Subscriber
redis.subscribe('workflow:updates');
redis.on('message', (channel, message) => {
  handleUpdate(JSON.parse(message));
});
```

### Queue Management
```typescript
// Add to queue
await redis.lpush('job:queue', JSON.stringify(job));

// Process queue
const job = await redis.brpop('job:queue', 0);
```

## Configuration
```bash
N8N_REDIS_HOST=localhost
N8N_REDIS_PORT=6379
N8N_REDIS_PASSWORD=
N8N_REDIS_DB=0
N8N_REDIS_CONNECTION_TIMEOUT=10000
N8N_REDIS_POOL_SIZE=10
```

## Best Practices
1. Use connection pooling
2. Implement reconnection logic
3. Monitor memory usage
4. Set appropriate TTLs
5. Use Redis persistence for critical data