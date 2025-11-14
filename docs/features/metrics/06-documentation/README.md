# Metrics Module

## Overview

The Metrics module provides comprehensive performance monitoring and observability for n8n. It collects, aggregates, and exports metrics in Prometheus format for monitoring dashboards and alerting systems.

**Module Path**: `packages/cli/src/metrics/`

## Core Components

### Metrics Service
- Metric collection and aggregation
- Prometheus exposition endpoint
- Custom metric registration
- Label management

### Metric Types
- **Counters**: Cumulative metrics (requests, errors)
- **Gauges**: Point-in-time values (memory, connections)
- **Histograms**: Distribution of values (latencies)
- **Summaries**: Statistical aggregations

## Architecture

```mermaid
graph TB
    subgraph "n8n Components"
        WF[Workflow Engine]
        API[API Server]
        DB[Database]
        QUEUE[Queue]
    end

    subgraph "Metrics System"
        COLLECT[Collectors]
        REGISTRY[Registry]
        EXPOSE[/metrics Endpoint]
    end

    subgraph "Monitoring Stack"
        PROM[Prometheus]
        GRAFANA[Grafana]
        ALERT[Alertmanager]
    end

    WF --> COLLECT
    API --> COLLECT
    DB --> COLLECT
    QUEUE --> COLLECT

    COLLECT --> REGISTRY
    REGISTRY --> EXPOSE

    PROM --> EXPOSE
    PROM --> GRAFANA
    PROM --> ALERT
```

## Available Metrics

### System Metrics
```typescript
// CPU and Memory
n8n_system_cpu_usage_percent
n8n_system_memory_usage_bytes
n8n_system_memory_total_bytes

// Process metrics
n8n_process_uptime_seconds
n8n_process_heap_used_bytes
n8n_process_event_loop_lag_milliseconds
```

### Workflow Metrics
```typescript
// Execution metrics
n8n_workflow_executions_total{status="success|error|crashed"}
n8n_workflow_execution_duration_seconds
n8n_workflow_nodes_executed_total

// Queue metrics
n8n_queue_jobs_waiting
n8n_queue_jobs_active
n8n_queue_jobs_completed_total
n8n_queue_jobs_failed_total
```

### API Metrics
```typescript
// HTTP metrics
n8n_http_requests_total{method="GET|POST|PUT|DELETE", path="/api/v1/workflows"}
n8n_http_request_duration_seconds{quantile="0.5|0.9|0.99"}
n8n_http_response_size_bytes
```

### Database Metrics
```typescript
// Connection pool
n8n_database_connections_active
n8n_database_connections_idle
n8n_database_connection_errors_total

// Query performance
n8n_database_query_duration_seconds{query_type="select|insert|update|delete"}
```

## Custom Metrics

### Creating Custom Metrics
```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Counter for events
const customEventCounter = new Counter({
  name: 'n8n_custom_events_total',
  help: 'Total custom events processed',
  labelNames: ['event_type', 'source']
});

// Histogram for durations
const operationDuration = new Histogram({
  name: 'n8n_operation_duration_seconds',
  help: 'Operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Gauge for current values
const activeConnections = new Gauge({
  name: 'n8n_active_connections',
  help: 'Number of active connections',
  labelNames: ['type']
});
```

## Configuration

### Environment Variables
```bash
# Metrics Configuration
N8N_METRICS_ENABLED=true
N8N_METRICS_PORT=9090
N8N_METRICS_PREFIX=n8n_

# Include/Exclude Metrics
N8N_METRICS_INCLUDE_DEFAULT=true
N8N_METRICS_INCLUDE_WORKFLOW=true
N8N_METRICS_INCLUDE_DATABASE=true
N8N_METRICS_INCLUDE_CACHE=true
```

## Prometheus Configuration

### Scrape Configuration
```yaml
scrape_configs:
  - job_name: 'n8n'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 15s
    scrape_timeout: 10s
```

## Grafana Dashboards

### Key Panels
1. **System Overview**: CPU, memory, uptime
2. **Workflow Performance**: Execution rates, durations, success rates
3. **API Performance**: Request rates, latencies, error rates
4. **Queue Health**: Job processing, backlogs, failures
5. **Database Performance**: Query times, connection pool

## Alerting Rules

### Example Prometheus Alerts
```yaml
groups:
  - name: n8n_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(n8n_workflow_executions_total{status="error"}[5m]) > 0.1
        annotations:
          summary: "High workflow error rate"

      - alert: QueueBacklog
        expr: n8n_queue_jobs_waiting > 1000
        annotations:
          summary: "Queue backlog exceeds 1000 jobs"

      - alert: DatabaseConnectionExhaustion
        expr: n8n_database_connections_active / n8n_database_connections_max > 0.9
        annotations:
          summary: "Database connection pool near exhaustion"
```

## Best Practices

1. **Use appropriate metric types** (counter vs gauge vs histogram)
2. **Keep cardinality low** - avoid high-cardinality labels
3. **Set reasonable scrape intervals** (15-30s typically)
4. **Export only necessary metrics** to reduce overhead
5. **Use labels wisely** for filtering and aggregation
6. **Document custom metrics** with clear descriptions