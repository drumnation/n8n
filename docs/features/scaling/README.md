# Scaling Feature

## Overview

The Scaling feature enables n8n to operate in distributed mode using worker processes and queue-based execution. This allows horizontal scaling, improved reliability, and better resource utilization for high-volume workflow automation scenarios.

## Quick Start

### Basic Queue Mode Setup

1. **Install Redis**:
```bash
# Using Docker
docker run -d \
  --name n8n-redis \
  -p 6379:6379 \
  redis:7-alpine

# Or install locally
brew install redis  # macOS
apt-get install redis-server  # Ubuntu
```

2. **Configure Main Instance**:
```bash
# Queue mode configuration
export EXECUTIONS_MODE=queue
export QUEUE_BULL_REDIS_HOST=localhost
export QUEUE_BULL_REDIS_PORT=6379
export QUEUE_HEALTH_CHECK_ACTIVE=true
```

3. **Start Main Instance**:
```bash
pnpm build
pnpm start
```

4. **Start Worker(s)**:
```bash
# In separate terminal(s)
export EXECUTIONS_MODE=queue
export QUEUE_BULL_REDIS_HOST=localhost
pnpm start worker
```

## Architecture

### System Components

```mermaid
graph TD
    LB[Load Balancer] --> MI1[Main Instance 1]
    LB --> MI2[Main Instance 2]
    LB --> MI3[Main Instance 3]

    MI1 --> Redis[(Redis Queue)]
    MI2 --> Redis
    MI3 --> Redis

    Redis --> W1[Worker 1]
    Redis --> W2[Worker 2]
    Redis --> W3[Worker 3]
    Redis --> W4[Worker 4]

    W1 --> DB[(PostgreSQL)]
    W2 --> DB
    W3 --> DB
    W4 --> DB

    MI1 --> DB
    MI2 --> DB
    MI3 --> DB
```

### Queue Architecture

```mermaid
graph LR
    subgraph "Main Process"
        WH[Webhook Handler]
        API[REST API]
        UI[Editor UI]
        QP[Queue Producer]
    end

    subgraph "Queue System"
        RQ[(Redis Queue)]
        DQ[Default Queue]
        HQ[High Priority]
        LQ[Low Priority]
    end

    subgraph "Worker Pool"
        W1[Worker 1]
        W2[Worker 2]
        W3[Worker N]
    end

    WH --> QP
    API --> QP
    QP --> RQ
    RQ --> DQ
    RQ --> HQ
    RQ --> LQ

    DQ --> W1
    HQ --> W2
    LQ --> W3
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EXECUTIONS_MODE` | Execution mode (regular/queue) | `regular` | Yes |
| `QUEUE_BULL_REDIS_HOST` | Redis host | `localhost` | Yes (queue) |
| `QUEUE_BULL_REDIS_PORT` | Redis port | `6379` | No |
| `QUEUE_BULL_REDIS_PASSWORD` | Redis password | - | No |
| `QUEUE_BULL_REDIS_DB` | Redis database | `0` | No |
| `QUEUE_WORKER_CONCURRENCY` | Concurrent jobs per worker | `10` | No |
| `QUEUE_HEALTH_CHECK_ACTIVE` | Enable health checks | `false` | No |
| `QUEUE_HEALTH_CHECK_PORT` | Health check port | `5678` | No |
| `N8N_WORKER_TIMEOUT` | Worker timeout (seconds) | `3600` | No |

### Redis Configuration

```bash
# Redis connection string
export QUEUE_BULL_REDIS_URL=redis://username:password@localhost:6379/0

# Redis cluster
export QUEUE_BULL_REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379

# Redis Sentinel
export QUEUE_BULL_REDIS_SENTINEL_HOSTS=sentinel-1:26379,sentinel-2:26379
export QUEUE_BULL_REDIS_SENTINEL_MASTER=mymaster
```

### Queue Priority Configuration

```typescript
interface QueueConfig {
  default: {
    concurrency: number;
    rateLimit?: {
      max: number;
      duration: number;
    };
  };
  priorities: {
    high: number;    // 1 (highest)
    normal: number;  // 5
    low: number;     // 10 (lowest)
  };
  retry: {
    attempts: number;
    backoff: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
  };
}
```

## API Reference

### Scaling Management API

#### Get Scaling Status
```http
GET /api/scaling/status
Authorization: Bearer <token>
```

Response:
```json
{
  "mode": "queue",
  "main": {
    "instances": 3,
    "health": "healthy"
  },
  "workers": {
    "total": 4,
    "active": 4,
    "idle": 0
  },
  "queue": {
    "waiting": 10,
    "active": 25,
    "completed": 1000,
    "failed": 5
  }
}
```

#### Scale Workers
```http
POST /api/scaling/workers
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "action": "scale",
  "count": 2
}
```

#### Get Worker Details
```http
GET /api/scaling/workers
Authorization: Bearer <token>
```

### TypeScript Interfaces

```typescript
interface IScalingService {
  getMode(): ExecutionMode;
  getStatus(): Promise<ScalingStatus>;
  getWorkers(): Promise<WorkerInfo[]>;
  scaleWorkers(count: number): Promise<void>;
  pauseWorker(workerId: string): Promise<void>;
  resumeWorker(workerId: string): Promise<void>;
}

interface WorkerInfo {
  id: string;
  hostname: string;
  pid: number;
  status: 'active' | 'idle' | 'paused';
  startTime: Date;
  jobsProcessed: number;
  currentJob?: {
    id: string;
    workflowId: string;
    startTime: Date;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
  };
}

interface QueueJob {
  id: string;
  workflowId: string;
  executionId: string;
  priority: number;
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedReason?: string;
}
```

## Deployment Modes

### Single Worker Mode
- One main instance, one worker
- Suitable for small deployments
- Simple configuration
- Minimal infrastructure

### Multi-Worker Mode
- One main instance, multiple workers
- Horizontal scaling
- Load distribution
- Fault tolerance

### High Availability Mode
- Multiple main instances
- Multiple workers
- Load balancer required
- Redis Sentinel/Cluster
- Zero downtime deployments

### Auto-Scaling Mode
- Dynamic worker scaling
- Kubernetes HPA
- AWS Auto Scaling Groups
- Metric-based scaling

## Key Files

### Core Implementation
- `/packages/cli/src/scaling/queue.service.ts` - Queue management
- `/packages/cli/src/scaling/worker.ts` - Worker implementation
- `/packages/cli/src/commands/worker.ts` - Worker CLI command
- `/packages/cli/src/scaling/bull.processor.ts` - Bull queue processor

### Configuration
- `/packages/cli/src/config/index.ts` - Scaling configuration
- `/packages/@n8n/config/src/configs/queue.config.ts` - Queue config schema

### Health Checks
- `/packages/cli/src/scaling/health.service.ts` - Health monitoring
- `/packages/cli/src/scaling/metrics.service.ts` - Metrics collection

## Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:14
    restart: always
    environment:
      POSTGRES_DB: n8n
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: n8n
    volumes:
      - postgres-data:/var/lib/postgresql/data

  n8n-main:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
    depends_on:
      - redis
      - postgres

  n8n-worker:
    image: n8nio/n8n
    restart: always
    command: worker
    environment:
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
    depends_on:
      - redis
      - postgres
    deploy:
      replicas: 3

volumes:
  redis-data:
  postgres-data:
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: n8n-worker
  template:
    metadata:
      labels:
        app: n8n-worker
    spec:
      containers:
      - name: n8n-worker
        image: n8nio/n8n:latest
        command: ["n8n", "worker"]
        env:
        - name: EXECUTIONS_MODE
          value: "queue"
        - name: QUEUE_BULL_REDIS_HOST
          value: "redis-service"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: n8n-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: n8n-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Performance Tuning

### Redis Optimization
```bash
# Redis configuration for high throughput
maxmemory 4gb
maxmemory-policy allkeys-lru
save ""  # Disable persistence for performance
tcp-backlog 511
tcp-keepalive 60
```

### Worker Tuning
```bash
# Optimize worker performance
export QUEUE_WORKER_CONCURRENCY=20  # Increase for I/O-bound workflows
export N8N_WORKER_TIMEOUT=7200      # Increase for long-running workflows
export NODE_OPTIONS="--max-old-space-size=4096"  # Increase memory
```

### Database Connection Pooling
```bash
# PostgreSQL connection pool
export DB_POSTGRESDB_POOL_MIN=2
export DB_POSTGRESDB_POOL_MAX=10
```

## Monitoring

### Metrics to Track
- Queue length (waiting jobs)
- Processing rate (jobs/minute)
- Worker utilization
- Job failure rate
- Average execution time
- Redis memory usage
- Database connections

### Health Checks

```bash
# Check main instance health
curl http://localhost:5678/healthz

# Check worker health
curl http://worker:5679/healthz

# Check queue status
redis-cli LLEN bull:execution:wait
```

### Monitoring Stack

```yaml
# Prometheus metrics
- job_name: 'n8n'
  static_configs:
    - targets: ['n8n-main:5678', 'n8n-worker-1:5679']
  metrics_path: '/metrics'
```

## Troubleshooting

### Common Issues

#### Jobs Stuck in Queue
```bash
# Check Redis connection
redis-cli ping

# List queued jobs
redis-cli LRANGE bull:execution:wait 0 10

# Check worker logs
docker logs n8n-worker

# Clear stuck jobs (careful!)
redis-cli DEL bull:execution:stalled
```

#### Worker Not Processing Jobs
- Check worker is running: `ps aux | grep worker`
- Verify Redis connection
- Check execution mode matches
- Review worker logs for errors

#### High Memory Usage
- Reduce worker concurrency
- Implement job batching
- Clear completed jobs regularly
- Monitor Redis memory

## Best Practices

### Queue Management
- Set appropriate concurrency limits
- Implement job priorities
- Configure retry strategies
- Monitor queue depth
- Clear old jobs regularly

### Worker Management
- Use container orchestration
- Implement auto-scaling
- Monitor worker health
- Graceful shutdown handling
- Resource limits

### High Availability
- Use Redis Sentinel/Cluster
- Multiple main instances
- Database replication
- Load balancer health checks
- Backup strategies

## Scaling Strategies

### Vertical Scaling
- Increase worker resources
- Optimize worker concurrency
- Database performance tuning
- Redis memory increase

### Horizontal Scaling
- Add more workers
- Distribute by workflow type
- Geographic distribution
- Queue partitioning

### Auto-Scaling Rules
```javascript
// Example auto-scaling logic
const scaleWorkers = async () => {
  const queueLength = await queue.getWaitingCount();
  const activeWorkers = await getActiveWorkerCount();

  if (queueLength > activeWorkers * 10) {
    await scaleUp();
  } else if (queueLength < activeWorkers * 2) {
    await scaleDown();
  }
};
```

## Migration Guide

### From Regular to Queue Mode

1. **Preparation**
   - Set up Redis
   - Test in staging
   - Plan downtime window

2. **Migration Steps**
   ```bash
   # Stop n8n
   pnpm stop

   # Update configuration
   export EXECUTIONS_MODE=queue
   export QUEUE_BULL_REDIS_HOST=localhost

   # Start main instance
   pnpm start

   # Start workers
   pnpm start worker
   ```

3. **Validation**
   - Test workflow execution
   - Monitor queue processing
   - Check error rates

## Future Enhancements

### Planned Features
- Native Kubernetes operator
- Advanced queue routing
- Priority-based auto-scaling
- Workflow affinity
- Distributed caching

### Experimental Features
- WebAssembly workers
- Edge computing support
- Serverless workers
- GPU-accelerated processing

## Related Documentation

- [Executions](../executions/README.md)
- [Webhooks](../webhooks/README.md)
- [Monitoring](../monitoring/README.md)
- [Performance](../performance/README.md)

## Support

### Resources
- Scaling guide: [docs.n8n.io/scaling](https://docs.n8n.io/scaling)
- Community forum: [community.n8n.io](https://community.n8n.io)
- GitHub issues: [github.com/n8n-io/n8n](https://github.com/n8n-io/n8n)