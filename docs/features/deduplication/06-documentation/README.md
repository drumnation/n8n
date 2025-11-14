# Deduplication Module

## Overview

The Deduplication module prevents duplicate workflow executions and data processing in n8n. It implements idempotency keys, execution fingerprinting, and duplicate detection mechanisms to ensure data consistency.

**Module Path**: `packages/cli/src/deduplication/`

## Core Components

### Deduplication Service
- Execution fingerprinting
- Duplicate detection
- Idempotency key management
- Cache-based tracking

## Deduplication Strategies

### Content-Based
```typescript
// Generate fingerprint from input data
const fingerprint = generateFingerprint({
  workflowId,
  inputData,
  timestamp: Math.floor(Date.now() / 60000) // 1-minute window
});

// Check for duplicate
if (await deduplicationService.exists(fingerprint)) {
  return existingResult;
}
```

### Idempotency Keys
```typescript
// Use explicit idempotency key
const result = await executeWorkflow({
  workflowId: '123',
  data: payload,
  idempotencyKey: 'order-12345'
});
```

## Configuration
```bash
N8N_DEDUPLICATION_ENABLED=true
N8N_DEDUPLICATION_TTL=3600
N8N_DEDUPLICATION_METHOD=content # or 'idempotency'
```

## Best Practices
1. Use idempotency keys for critical operations
2. Set appropriate TTL for deduplication cache
3. Monitor duplicate detection rates
4. Handle edge cases gracefully
5. Document deduplication behavior