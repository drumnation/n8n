# Binary Data Module

## Overview

The Binary Data module manages file storage and streaming in n8n workflows. It provides efficient handling of large files, binary content, and media assets with support for multiple storage backends including filesystem and S3-compatible object storage.

**Module Path**: `packages/core/src/binary-data/`

## Core Components

### 1. Binary Data Service (`binary-data.service.ts`)
- **Purpose**: Central service for binary data operations
- **Key Features**:
  - Storage backend abstraction
  - File streaming and buffering
  - Metadata management
  - Cleanup and lifecycle management

### 2. File System Manager (`file-system.manager.ts`)
- **Purpose**: Local filesystem storage implementation
- **Key Features**:
  - File read/write operations
  - Directory structure management
  - Temporary file handling
  - Disk space management

### 3. Object Store Manager (`object-store.manager.ts`)
- **Purpose**: S3-compatible object storage
- **Key Features**:
  - S3 API integration
  - Multi-part upload support
  - Pre-signed URL generation
  - Bucket lifecycle policies

## Architecture

```mermaid
graph TB
    subgraph "Workflow Engine"
        NODE[Node Execution]
        WF[Workflow Runner]
    end

    subgraph "Binary Data Core"
        BDS[Binary Data Service]
        SM[Storage Manager]
        META[Metadata Store]
        STREAM[Stream Handler]
    end

    subgraph "Storage Backends"
        FS[File System]
        S3[S3 Storage]
        TEMP[Temp Storage]
    end

    subgraph "Consumers"
        API[REST API]
        UI[Editor UI]
        EXPORT[Data Export]
    end

    NODE --> BDS
    WF --> BDS
    BDS --> SM
    BDS --> META
    BDS --> STREAM

    SM --> FS
    SM --> S3
    SM --> TEMP

    API --> BDS
    UI --> BDS
    EXPORT --> BDS
```

## Storage Backends

### File System Storage
```typescript
interface FileSystemConfig {
  mode: 'filesystem';
  localStoragePath: string;
  temporaryDirectory: string;
  ttl: number; // Time to live in minutes
  maxSizeMB: number;
}

// Example configuration
{
  binaryDataStorage: {
    mode: 'filesystem',
    localStoragePath: '/data/n8n/binary',
    temporaryDirectory: '/tmp/n8n',
    ttl: 60,
    maxSizeMB: 200
  }
}
```

### S3 Storage
```typescript
interface S3Config {
  mode: 's3';
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // For S3-compatible services
}

// Example configuration
{
  binaryDataStorage: {
    mode: 's3',
    bucketName: 'n8n-binary-data',
    region: 'us-east-1',
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  }
}
```

## Data Structure

### Binary Data Reference
```typescript
interface IBinaryData {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileExtension?: string;
  directory?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  lastAccessed?: Date;
}
```

### Binary Data Storage
```typescript
interface BinaryDataBuffer {
  data: Buffer | Readable;
  mimeType: string;
  fileName?: string;
  encoding?: string;
}
```

## API Operations

### Store Binary Data
```typescript
// Store from buffer
const binaryId = await binaryDataService.store({
  data: Buffer.from('file content'),
  mimeType: 'text/plain',
  fileName: 'document.txt'
});

// Store from stream
const stream = fs.createReadStream('large-file.zip');
const binaryId = await binaryDataService.store({
  data: stream,
  mimeType: 'application/zip',
  fileName: 'large-file.zip'
});
```

### Retrieve Binary Data
```typescript
// Get as buffer
const buffer = await binaryDataService.getAsBuffer(binaryId);

// Get as stream
const stream = await binaryDataService.getAsStream(binaryId);

// Get download URL
const url = await binaryDataService.getDownloadUrl(binaryId, {
  expires: 3600 // URL expires in 1 hour
});
```

### Delete Binary Data
```typescript
// Delete single file
await binaryDataService.delete(binaryId);

// Batch delete
await binaryDataService.deleteMany([id1, id2, id3]);

// Delete by execution
await binaryDataService.deleteByExecutionId(executionId);
```

## Streaming Support

### Large File Handling
```typescript
// Stream processing for large files
async function processLargeFile(binaryId: string) {
  const stream = await binaryDataService.getAsStream(binaryId);

  return new Promise((resolve, reject) => {
    const transformer = new Transform({
      transform(chunk, encoding, callback) {
        // Process chunk
        const processed = processChunk(chunk);
        callback(null, processed);
      }
    });

    stream
      .pipe(transformer)
      .pipe(outputStream)
      .on('finish', resolve)
      .on('error', reject);
  });
}
```

### Multi-part Upload
```typescript
// Upload large file in parts
async function multipartUpload(filePath: string) {
  const uploader = binaryDataService.createMultipartUpload({
    fileName: 'large-video.mp4',
    mimeType: 'video/mp4'
  });

  const stream = fs.createReadStream(filePath, {
    highWaterMark: 5 * 1024 * 1024 // 5MB chunks
  });

  for await (const chunk of stream) {
    await uploader.uploadPart(chunk);
  }

  return await uploader.complete();
}
```

## Lifecycle Management

### Automatic Cleanup
```typescript
// TTL-based cleanup
interface CleanupConfig {
  enabled: boolean;
  ttlMinutes: number;
  runIntervalMinutes: number;
  batchSize: number;
}

// Cleanup job
async function cleanupExpiredBinaryData() {
  const expired = await binaryDataService.findExpired({
    olderThan: new Date(Date.now() - ttl)
  });

  for (const batch of chunk(expired, batchSize)) {
    await binaryDataService.deleteMany(batch.map(b => b.id));
  }
}
```

### Execution-based Cleanup
```typescript
// Clean up after workflow execution
eventBus.on('workflow.execution.finished', async (event) => {
  if (event.config.deleteBinaryData) {
    await binaryDataService.deleteByExecutionId(
      event.executionId,
      { delay: event.config.retentionMinutes }
    );
  }
});
```

## Performance Optimization

### Caching Strategy
```typescript
interface CacheConfig {
  enabled: boolean;
  maxSizeMB: number;
  ttlSeconds: number;
  strategy: 'lru' | 'lfu';
}

// In-memory cache for frequently accessed files
class BinaryDataCache {
  private cache = new LRUCache<string, Buffer>({
    max: 100, // Maximum items
    maxSize: 50 * 1024 * 1024, // 50MB
    sizeCalculation: (buffer) => buffer.length,
    ttl: 1000 * 60 * 5 // 5 minutes
  });

  async get(id: string): Promise<Buffer | undefined> {
    return this.cache.get(id);
  }

  async set(id: string, data: Buffer): Promise<void> {
    this.cache.set(id, data);
  }
}
```

### Compression
```typescript
// Automatic compression for text files
async function storeWithCompression(data: Buffer, mimeType: string) {
  const shouldCompress = mimeType.startsWith('text/') ||
    mimeType === 'application/json';

  if (shouldCompress) {
    const compressed = await gzip(data);
    return binaryDataService.store({
      data: compressed,
      mimeType,
      metadata: { compressed: true }
    });
  }

  return binaryDataService.store({ data, mimeType });
}
```

## Security

### Access Control
```typescript
// Validate binary data access
async function validateAccess(
  binaryId: string,
  userId: string
): Promise<boolean> {
  const metadata = await binaryDataService.getMetadata(binaryId);

  // Check ownership
  if (metadata.ownerId !== userId) {
    // Check permissions
    const hasPermission = await checkPermission(
      userId,
      'binary:read',
      metadata.workflowId
    );
    return hasPermission;
  }

  return true;
}
```

### URL Signing
```typescript
// Generate signed URL with expiration
async function generateSignedUrl(
  binaryId: string,
  userId: string
): Promise<string> {
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${binaryId}:${userId}:${expires}`)
    .digest('hex');

  return `${baseUrl}/binary/${binaryId}?` +
    `signature=${signature}&expires=${expires}&user=${userId}`;
}
```

## Error Handling

### Common Errors
```typescript
class BinaryDataNotFoundError extends Error {
  constructor(id: string) {
    super(`Binary data ${id} not found`);
  }
}

class StorageQuotaExceededError extends Error {
  constructor(size: number, limit: number) {
    super(`Storage quota exceeded: ${size}MB / ${limit}MB`);
  }
}

class InvalidMimeTypeError extends Error {
  constructor(mimeType: string) {
    super(`Invalid MIME type: ${mimeType}`);
  }
}
```

## Configuration

### Environment Variables
```bash
# Storage Configuration
N8N_BINARY_DATA_MODE=filesystem # or 's3'
N8N_BINARY_DATA_PATH=/data/n8n/binary
N8N_BINARY_DATA_TTL=60 # minutes

# S3 Configuration
N8N_BINARY_DATA_S3_BUCKET=n8n-binary
N8N_BINARY_DATA_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Limits
N8N_BINARY_DATA_MAX_SIZE=200 # MB
N8N_BINARY_DATA_CLEANUP_INTERVAL=15 # minutes
```

## Monitoring

### Metrics
```typescript
{
  'binary_data.storage_used': gauge, // bytes
  'binary_data.files_count': gauge,
  'binary_data.uploads': counter,
  'binary_data.downloads': counter,
  'binary_data.deletions': counter,
  'binary_data.cache_hits': counter,
  'binary_data.cache_misses': counter
}
```

## Testing

### Unit Tests
```typescript
describe('BinaryDataService', () => {
  test('should store and retrieve binary data', async () => {
    const data = Buffer.from('test content');
    const id = await service.store({
      data,
      mimeType: 'text/plain',
      fileName: 'test.txt'
    });

    const retrieved = await service.getAsBuffer(id);
    expect(retrieved).toEqual(data);
  });
});
```

## Migration Guide

### Migrating from Filesystem to S3
```bash
# Export existing data
pnpm binary:export --source=filesystem --output=/backup

# Configure S3
export N8N_BINARY_DATA_MODE=s3
export N8N_BINARY_DATA_S3_BUCKET=n8n-binary

# Import to S3
pnpm binary:import --source=/backup --target=s3
```

## Best Practices

1. **Use streaming for large files** (>10MB)
2. **Set appropriate TTL** to prevent storage bloat
3. **Implement compression** for text-based content
4. **Use pre-signed URLs** for direct downloads
5. **Monitor storage usage** and set alerts
6. **Regular cleanup** of orphaned files
7. **Validate MIME types** for security