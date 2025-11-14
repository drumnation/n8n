# n8n Cloud vs Self-Hosted: Complete Comparison Map

**Generated**: 2025-01-06  
**Repository Version**: n8n master branch

## Executive Summary

n8n offers both cloud-hosted (SaaS) and self-hosted (on-premises) deployment options. This document maps all differences in features, configuration, data storage, and extensibility between the two deployment modes.

---

## 1. Feature Availability Matrix

### 1.1 Core Features (Available in Both)

| Feature | Cloud | Self-Hosted | Notes |
|---------|-------|-------------|-------|
| Workflow Editor | ✅ | ✅ | Identical UI/UX |
| Built-in Nodes | ✅ | ✅ | Same node library |
| Workflow Execution | ✅ | ✅ | Regular mode |
| Database Storage | ✅ | ✅ | Postgres/MySQL/SQLite |
| REST API | ✅ | ✅ | Public API endpoints |
| Webhooks | ✅ | ✅ | Custom webhook URLs |
| Credentials Management | ✅ | ✅ | Encrypted storage |
| Execution History | ✅ | ✅ | Configurable retention |
| Version Control | ✅ (Premium) | ✅ (Licensed) | Enterprise feature |

### 1.2 Cloud-Only Features

| Feature | Cloud | Self-Hosted | Configuration |
|---------|-------|-------------|---------------|
| **AI Assistant** | ✅ | ❌ (Cloud API) | Requires `N8N_AI_ASSISTANT_BASE_URL` |
| **AI Builder** | ✅ | ⚠️ (Partial) | Can use own Anthropic key locally |
| **AI Credits** | ✅ | ❌ | Cloud-managed quota system |
| **Template Gallery (Full)** | ✅ | ⚠️ (Limited) | `N8N_TEMPLATES_HOST` points to cloud |
| **Community Node Search** | ✅ | ✅ | NPM registry access |
| **Verified Package System** | ✅ | ⚠️ | `N8N_VERIFIED_PACKAGES_ENABLED` |
| **Session Recording** | ✅ | ❌ | PostHog disabled for self-hosted |
| **Cloud Plan Management** | ✅ | ❌ | Billing/subscription UI |
| **Managed Infrastructure** | ✅ | ❌ | No server maintenance |

### 1.3 Self-Hosted Exclusive Capabilities

| Feature | Cloud | Self-Hosted | Notes |
|---------|-------|-------------|-------|
| **Custom Node Development** | ❌ | ✅ | Full access to codebase |
| **Database Choice** | ❌ (Managed) | ✅ | SQLite/Postgres/MySQL/MariaDB |
| **Scaling Mode (Queue)** | ❌ | ✅ | Redis + Bull queue workers |
| **Custom Deployment** | ❌ | ✅ | Docker/K8s/bare metal |
| **Air-gapped Networks** | ❌ | ✅ | No internet required |
| **Custom SSL Certificates** | ❌ | ✅ | Full control |
| **Environment Variables** | Limited | ✅ | All config options |
| **Source Code Access** | ❌ | ✅ | Open source (Apache 2.0 + Proprietary EE) |
| **Offline Operation** | ❌ | ✅ | No cloud dependencies |

---

## 2. Licensing and Enterprise Features

### 2.1 License Tiers

| Tier | Features | Cloud | Self-Hosted |
|------|----------|-------|-------------|
| **Community** | Unlimited workflows, basic features | ✅ | ✅ |
| **Starter/Pro** | LDAP, SAML, Variables | ✅ | ✅ (License key) |
| **Enterprise** | Advanced permissions, audit logs, multi-main | ✅ | ✅ (License key) |

### 2.2 Enterprise Features (Licensed)

```typescript
// From: packages/frontend/editor-ui/src/app/constants/enterprise.ts
EnterpriseEditionFeature = {
  AdvancedExecutionFilters: 'advancedExecutionFilters',
  Sharing: 'sharing',
  Ldap: 'ldap',
  LogStreaming: 'logStreaming',
  Variables: 'variables',
  Saml: 'saml',
  Oidc: 'oidc',
  EnforceMFA: 'mfaEnforcement',
  SourceControl: 'sourceControl',
  ExternalSecrets: 'externalSecrets',
  AuditLogs: 'auditLogs',
  DebugInEditor: 'debugInEditor',
  WorkflowHistory: 'workflowHistory',
  WorkerView: 'workerView',
  AdvancedPermissions: 'advancedPermissions',
  ApiKeyScopes: 'apiKeyScopes',
  Provisioning: 'provisioning',
}
```

**License Configuration**:
- **Cloud**: Automatic via subscription
- **Self-Hosted**: Requires activation key

```bash
# Self-hosted license setup
export N8N_LICENSE_ACTIVATION_KEY="your-key-here"
export N8N_LICENSE_SERVER_URL="https://license.n8n.io/v1"
```

---

## 3. Configuration Differences

### 3.1 Deployment Type Detection

**Key Environment Variable**: `N8N_DEPLOYMENT_TYPE`

```typescript
// From: packages/@n8n/config/src/configs/deployment.config.ts
@Config
export class DeploymentConfig {
  @Env('N8N_DEPLOYMENT_TYPE')
  type: string = 'default'; // Options: 'default', 'cloud'
}
```

**Frontend Detection**:
```typescript
// From: packages/frontend/editor-ui/src/app/stores/settings.store.ts
isCloudDeployment = computed(() => settings.value.deployment?.type === 'cloud')
```

### 3.2 AI Features Configuration

#### Cloud AI Assistant (Cloud-Only)

```bash
# From: packages/@n8n/config/src/configs/ai-assistant.config.ts
export N8N_AI_ASSISTANT_BASE_URL="https://ai-assistant.n8n.io"
```

**Requirements**:
- Active n8n cloud subscription
- License certificate validation
- Consumer ID verification

**Service Architecture**:
```typescript
// From: packages/cli/src/services/ai-workflow-builder.service.ts
const client = new AiAssistantClient({
  licenseCert,          // From license server
  consumerId,           // Cloud account ID
  baseUrl,              // Cloud AI service
  n8nVersion: N8N_VERSION,
});
```

#### AI Builder (Local Alternative)

```bash
# From: packages/@n8n/config/src/configs/ai-builder.config.ts
export N8N_AI_ANTHROPIC_KEY="sk-ant-api03-..."
```

**Self-Hosted Capability**:
- Use your own Anthropic API key
- Full workflow builder locally
- No cloud dependencies
- Pay Anthropic directly

### 3.3 Community Packages

```bash
# From: packages/cli/src/modules/community-packages/community-packages.config.ts
export N8N_COMMUNITY_PACKAGES_ENABLED=true          # Enable/disable system
export N8N_COMMUNITY_PACKAGES_REGISTRY="https://registry.npmjs.org"
export N8N_UNVERIFIED_PACKAGES_ENABLED=true         # Allow unverified
export N8N_VERIFIED_PACKAGES_ENABLED=true           # Show verified badge
export N8N_COMMUNITY_PACKAGES_PREVENT_LOADING=false # Security lockdown
```

**Verified Packages**:
- **Cloud**: Curated list from n8n
- **Self-Hosted**: Same list, but can be disabled
- **NPM Search API**: `https://api.npms.io/v2/`

### 3.4 PostHog Feature Flags & Analytics

```typescript
// From: packages/@n8n/config/src/configs/diagnostics.config.ts
@Config
export class DiagnosticsConfig {
  @Env('N8N_DIAGNOSTICS_ENABLED')
  enabled: boolean = true;

  @Env('N8N_DIAGNOSTICS_POSTHOG_API_KEY')
  apiKey: string = 'phc_4URIAm1uYfJO7j8kWSe0J8lc8IqnstRLS7Jx8NcakHo';

  @Env('N8N_DIAGNOSTICS_POSTHOG_API_HOST')
  apiHost: string = 'https://us.i.posthog.com';
}
```

**Feature Flags**:
- **Cloud**: Server-side evaluation via PostHog
- **Self-Hosted**: Client-side evaluation (can be disabled)

**Session Recording**:
```typescript
// From: packages/cli/src/services/frontend.service.ts
posthog: {
  enabled: this.globalConfig.diagnostics.enabled,
  disableSessionRecording: this.globalConfig.deployment.type !== 'cloud',
  // ⚠️ Self-hosted: Recording DISABLED by default
}
```

**Override for Testing**:
```javascript
// Browser console
window.featureFlags.override('feature-name', true);
```

### 3.5 Templates System

```bash
# From: packages/@n8n/config/src/configs/templates.config.ts
export N8N_TEMPLATES_ENABLED=true
export N8N_TEMPLATES_HOST="https://api.n8n.io/api/"
```

**Cloud vs Self-Hosted**:
- **Cloud**: Full template gallery with personalization
- **Self-Hosted**: Can connect to cloud API or disable
- **Offline Mode**: Set `N8N_TEMPLATES_ENABLED=false`

---

## 4. Data Storage & Security

### 4.1 Database Options

```typescript
// From: packages/@n8n/config/src/configs/database.config.ts
@Env('DB_TYPE')
type: 'sqlite' | 'mariadb' | 'mysqldb' | 'postgresdb' = 'sqlite';
```

| Database | Cloud | Self-Hosted | Production Use |
|----------|-------|-------------|----------------|
| SQLite | ❌ | ✅ | Small instances only |
| PostgreSQL | ✅ (Managed) | ✅ | Recommended |
| MySQL/MariaDB | ❌ | ✅ | Supported |

**PostgreSQL Configuration (Self-Hosted)**:
```bash
export DB_TYPE=postgresdb
export DB_POSTGRESDB_HOST=localhost
export DB_POSTGRESDB_PORT=5432
export DB_POSTGRESDB_DATABASE=n8n
export DB_POSTGRESDB_USER=n8n
export DB_POSTGRESDB_PASSWORD=secure-password
export DB_POSTGRESDB_SCHEMA=public
export DB_POSTGRESDB_POOL_SIZE=2
```

### 4.2 Encryption

**Both Cloud and Self-Hosted**:
```bash
export N8N_ENCRYPTION_KEY="your-secure-encryption-key"
```

⚠️ **Critical**:
- Required for credential encryption
- Must be backed up (cannot decrypt without it)
- Cloud: Managed by n8n
- Self-Hosted: User responsibility

### 4.3 Data Storage Locations

**Cloud**:
- Database: Managed PostgreSQL
- Files: n8n cloud storage (S3-compatible)
- Credentials: Encrypted in database
- Binary Data: Cloud object storage

**Self-Hosted**:
```bash
# Default storage locations
~/.n8n/                    # User data folder
  ├── database.sqlite      # SQLite database (if used)
  ├── nodes/               # Custom nodes
  ├── .keys/               # SSH keys for source control
  └── .cache/              # Temporary files

# Custom paths
export N8N_USER_FOLDER="/path/to/data"
```

### 4.4 Execution Data Retention

```typescript
// From: packages/@n8n/config/src/configs/executions.config.ts
@Env('EXECUTIONS_DATA_PRUNE')
pruneData: boolean = true;

@Env('EXECUTIONS_DATA_MAX_AGE')
pruneDataMaxAge: number = 336; // 14 days in hours

@Env('EXECUTIONS_DATA_PRUNE_MAX_COUNT')
pruneDataMaxCount: number = 10_000;
```

**Cloud**: Managed pruning based on plan
**Self-Hosted**: Full control over retention

---

## 5. Scaling and Deployment Modes

### 5.1 Execution Modes

```typescript
// From: packages/@n8n/config/src/configs/executions.config.ts
@Env('EXECUTIONS_MODE')
mode: 'regular' | 'queue' = 'regular';
```

#### Regular Mode (In-Process)

**Cloud**: ✅ (Default)
**Self-Hosted**: ✅ (Default)

- Single process handles everything
- Simpler setup
- Limited scalability
- Good for small/medium workloads

#### Queue Mode (Scaling/Workers)

**Cloud**: ❌ (Not configurable)
**Self-Hosted**: ✅ (Full control)

**Requirements**:
```bash
export EXECUTIONS_MODE=queue
export QUEUE_BULL_REDIS_HOST=localhost
export QUEUE_BULL_REDIS_PORT=6379
export QUEUE_BULL_REDIS_DB=0
export QUEUE_BULL_PREFIX=bull
```

**Architecture**:
```
Main Process (API + Webhook) → Redis Queue → Worker Processes
```

**Start Workers**:
```bash
./packages/cli/bin/n8n worker --concurrency=10
```

**Scaling Configuration**:
```typescript
// From: packages/@n8n/config/src/configs/scaling-mode.config.ts
@Config
class RedisConfig {
  @Env('QUEUE_BULL_REDIS_HOST')
  host: string = 'localhost';
  
  @Env('QUEUE_BULL_REDIS_CLUSTER_NODES')
  clusterNodes: string = ''; // Redis Cluster support
}

@Config
class SettingsConfig {
  @Env('QUEUE_WORKER_LOCK_DURATION')
  lockDuration: number = 60_000;
  
  @Env('QUEUE_WORKER_STALLED_INTERVAL')
  stalledInterval: number = 30_000;
}
```

### 5.2 Multi-Main Setup (Enterprise)

**Cloud**: ✅ (Automatic)
**Self-Hosted**: ✅ (Requires enterprise license)

```bash
# From: packages/@n8n/config/src/configs/multi-main-setup.config.ts
export N8N_MULTI_MAIN_SETUP_ENABLED=true
export N8N_MULTI_MAIN_SETUP_INSTANCE_TYPE=main
export N8N_MULTI_MAIN_SETUP_LICENSE_SHARING_KEY=shared-key
```

**Use Case**: High availability with multiple main instances

### 5.3 Concurrency Control

```bash
# From: packages/@n8n/config/src/configs/executions.config.ts
export N8N_CONCURRENCY_PRODUCTION_LIMIT=-1  # Unlimited
export N8N_CONCURRENCY_EVALUATION_LIMIT=-1
```

**Cloud**: Managed per plan tier
**Self-Hosted**: Unlimited by default

---

## 6. Node Filtering and Customization

### 6.1 Node Include/Exclude Lists

```bash
# From: packages/@n8n/config/src/configs/nodes.config.ts
export NODES_INCLUDE='["n8n-nodes-base.httpRequest", "n8n-nodes-base.slack"]'
export NODES_EXCLUDE='["n8n-nodes-base.executeCommand"]'
```

**Use Cases**:
- Security: Disable dangerous nodes (Execute Command, Code)
- Compliance: Restrict to approved integrations
- Performance: Reduce node loading time

**Cloud**: ❌ Cannot customize node list
**Self-Hosted**: ✅ Full control

### 6.2 Python Code Node

```bash
# From: packages/@n8n/config/src/configs/nodes.config.ts
export N8N_PYTHON_ENABLED=true
```

**Cloud**: ✅ (Sandboxed)
**Self-Hosted**: ✅ (Full control)

### 6.3 Custom Node Development

**Cloud**: ❌ No access to codebase
**Self-Hosted**: ✅ Full node development

**Development Path**:
```bash
# Create custom node package
npx @n8n/create-node

# Install to n8n
cd ~/.n8n/nodes
npm install /path/to/your-custom-node

# n8n automatically loads on restart
```

---

## 7. Development Workflows

### 7.1 Feature Development (Cloud vs Local)

| Task | Cloud | Self-Hosted | Approach |
|------|-------|-------------|----------|
| **Add Custom Node** | ❌ | ✅ | Build with n8n CLI |
| **Modify Core Logic** | ❌ | ✅ | Edit source in `packages/` |
| **Test Changes** | ❌ | ✅ | `pnpm dev` for hot reload |
| **Debug Issues** | Limited | ✅ | Full stack traces + logging |
| **Custom Integrations** | Via HTTP node | ✅ | Native node implementation |
| **Apply Security Patches** | Automatic | Manual | Pull latest from Git |

### 7.2 Local Development Setup

```bash
# Clone repository
git clone https://github.com/n8n-io/n8n.git
cd n8n

# Install dependencies
pnpm install

# Start development server
pnpm dev  # Full stack with hot reload

# Or start components separately
pnpm dev:be  # Backend only
pnpm dev:fe  # Frontend only
```

**Environment for Development**:
```bash
# AI Builder with local Anthropic key
export N8N_AI_ANTHROPIC_KEY="sk-ant-..."

# Disable cloud services
export N8N_DEPLOYMENT_TYPE=default
export N8N_AI_ASSISTANT_BASE_URL=""
export N8N_TEMPLATES_ENABLED=false

# Development database
export DB_TYPE=sqlite
export DB_SQLITE_DATABASE=./dev-database.sqlite
```

---

## 8. Cloud Service Dependencies

### 8.1 Cloud-Dependent Services

**n8n Cloud**: These services require cloud connectivity even for self-hosted:

| Service | URL | Purpose | Can Disable? |
|---------|-----|---------|--------------|
| **AI Assistant** | `https://ai-assistant.n8n.io` | Chat-based workflow builder | ✅ |
| **Templates API** | `https://api.n8n.io/api/` | Workflow templates | ✅ |
| **License Server** | `https://license.n8n.io/v1` | License validation | ⚠️ (Required for enterprise) |
| **Community Trial** | `https://enterprise.n8n.io` | Trial registration | ✅ |
| **PostHog Analytics** | `https://us.i.posthog.com` | Telemetry/feature flags | ✅ |
| **NPM Registry** | `https://registry.npmjs.org` | Community nodes | ⚠️ (Can use mirror) |
| **NPMS Search** | `https://api.npms.io/v2/` | Package search | ✅ |

### 8.2 Offline/Air-gapped Deployment

**Self-Hosted Only**: Full offline capability

**Requirements**:
1. Disable external services
2. Use SQLite or local database
3. Pre-install community nodes
4. Disable telemetry

```bash
# Minimal offline configuration
export N8N_DIAGNOSTICS_ENABLED=false
export N8N_TEMPLATES_ENABLED=false
export N8N_AI_ASSISTANT_BASE_URL=""
export N8N_COMMUNITY_PACKAGES_ENABLED=false
export N8N_VERSION_NOTIFICATIONS_ENABLED=false

# Local database only
export DB_TYPE=sqlite
export DB_SQLITE_DATABASE=/data/n8n.sqlite

# No external API calls
export N8N_LICENSE_AUTO_RENEW_ENABLED=false
```

---

## 9. Cost and Resource Comparison

### 9.1 Cloud Costs

| Plan | Price | Users | Workflows | Executions |
|------|-------|-------|-----------|------------|
| Starter | $20/mo | 2 | Unlimited | 2,500/mo |
| Pro | $50/mo | 5 | Unlimited | 10,000/mo |
| Enterprise | Custom | Unlimited | Unlimited | Custom |

**Includes**:
- Managed infrastructure
- Automatic backups
- SSL certificates
- High availability (Enterprise)

### 9.2 Self-Hosted Costs

**Infrastructure**:
- VPS/Server: $5-100+/month (varies by provider)
- Database: Included or separate hosting
- Redis (for scaling): Optional
- SSL Certificate: Free (Let's Encrypt) or paid
- Backup Storage: Additional cost

**Operational**:
- System administration time
- Security updates
- Monitoring/alerting setup
- Disaster recovery planning

**Total Cost Comparison**:
```
Small Deployment (< 5 users):
- Cloud: $20-50/mo
- Self-Hosted: $10-30/mo (infrastructure) + admin time

Medium Deployment (5-20 users):
- Cloud: $50-200/mo
- Self-Hosted: $50-200/mo + admin time

Large Deployment (20+ users):
- Cloud: $200-1000+/mo
- Self-Hosted: $100-500/mo + dedicated admin
```

---

## 10. Migration Paths

### 10.1 Cloud → Self-Hosted

**Steps**:
1. **Export Workflows**: Use REST API or UI export
2. **Export Credentials**: Encrypted JSON export
3. **Setup Self-Hosted**: Install n8n
4. **Import Data**: Use CLI import commands
5. **Reconfigure**: Update webhook URLs, credentials

**CLI Commands**:
```bash
# Export from cloud (via API)
curl -H "X-N8N-API-KEY: your-key" \
  https://your-instance.app.n8n.cloud/api/v1/workflows \
  > workflows.json

# Import to self-hosted
./packages/cli/bin/n8n import:workflow --input=workflows.json
./packages/cli/bin/n8n import:credentials --input=credentials.json
```

**Considerations**:
- Webhook URLs will change
- AI Assistant requires separate Anthropic key
- License needed for enterprise features
- Manual setup of scaling infrastructure

### 10.2 Self-Hosted → Cloud

**Steps**:
1. **Export Workflows & Credentials**
2. **Sign up for n8n Cloud**
3. **Import via UI**: Drag-and-drop JSON files
4. **Update External URLs**: If using webhooks
5. **Test Executions**: Verify functionality

**Benefits**:
- No infrastructure management
- Automatic updates
- Cloud-exclusive AI features
- Built-in scaling

---

## 11. Security Considerations

### 11.1 Security Features Comparison

| Feature | Cloud | Self-Hosted |
|---------|-------|-------------|
| **Credential Encryption** | ✅ | ✅ (User-managed key) |
| **SSL/TLS** | ✅ (Automatic) | ⚠️ (User-configured) |
| **OAuth Redirects** | ✅ (Managed) | ⚠️ (Custom setup) |
| **Firewall Rules** | ✅ (Managed) | ⚠️ (User-configured) |
| **DDoS Protection** | ✅ | ❌ (DIY) |
| **Audit Logs** | ✅ (Enterprise) | ✅ (Enterprise + License) |
| **SAML/LDAP** | ✅ (Pro+) | ✅ (Licensed) |
| **VPC/Private Network** | ✅ (Enterprise) | ✅ (Full control) |
| **Compliance Certifications** | ✅ (SOC 2, etc.) | ⚠️ (Your responsibility) |

### 11.2 Security Hardening (Self-Hosted)

```bash
# Block file access to n8n internals
export N8N_BLOCK_FILE_ACCESS_TO_N8N_FILES=true

# Disable risky nodes
export NODES_EXCLUDE='["n8n-nodes-base.executeCommand", "n8n-nodes-base.readBinaryFile"]'

# Secure cookies
export N8N_SECURE_COOKIE=true

# Enforce MFA (requires license)
export N8N_MFA_ENABLED=true

# Restrict Python execution
export N8N_PYTHON_ENABLED=false
```

---

## 12. Monitoring and Observability

### 12.1 Built-in Monitoring

**Cloud**:
- Dashboard with execution metrics
- Email alerts (Pro+)
- Performance insights
- Automatic error tracking

**Self-Hosted**:
```bash
# Prometheus metrics endpoint
export N8N_METRICS=true
export N8N_METRICS_PREFIX=n8n_

# Access at: http://localhost:5678/metrics
```

### 12.2 Log Streaming (Enterprise)

```bash
# From: packages/@n8n/config/src/configs/event-bus.config.ts
export N8N_EVENTBUS_CHECKUNSENTINTERVAL=5000
export N8N_EVENTBUS_LOGWRITER_KEEPLOGCOUNT=3
export N8N_EVENTBUS_LOGWRITER_MAXFILESIZEINKB=10240
```

**Destinations**:
- Splunk
- Datadog
- Elasticsearch
- Webhook endpoints

**Cloud**: UI-based configuration
**Self-Hosted**: Environment variables + license

---

## 13. Quick Decision Matrix

### Choose Cloud If:
- ✅ You want zero infrastructure management
- ✅ You need AI Assistant with no setup
- ✅ You prefer automatic updates and backups
- ✅ You're okay with standardized deployment
- ✅ You value managed security and compliance
- ✅ Your team is small to medium (< 50 users)

### Choose Self-Hosted If:
- ✅ You need full control over infrastructure
- ✅ You have specific compliance requirements (data residency)
- ✅ You want to develop custom nodes
- ✅ You need air-gapped/offline deployment
- ✅ You require horizontal scaling (queue mode)
- ✅ You want to minimize long-term costs at scale
- ✅ You have DevOps expertise in-house
- ✅ You need to modify core n8n code

---

## 14. Environment Variables Reference Card

### Essential Configuration

```bash
# === DEPLOYMENT ===
N8N_DEPLOYMENT_TYPE=default              # 'default' or 'cloud'
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://your-domain.com

# === DATABASE ===
DB_TYPE=postgresdb                       # sqlite, mysqldb, mariadb, postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=secure-password

# === SECURITY ===
N8N_ENCRYPTION_KEY=your-encryption-key   # CRITICAL: Backup this!
N8N_USER_MANAGEMENT_JWT_SECRET=jwt-secret

# === SCALING ===
EXECUTIONS_MODE=regular                  # 'regular' or 'queue'
QUEUE_BULL_REDIS_HOST=localhost          # Required for queue mode
QUEUE_BULL_REDIS_PORT=6379

# === AI FEATURES ===
N8N_AI_ASSISTANT_BASE_URL=               # Cloud AI service (leave empty for self-hosted)
N8N_AI_ANTHROPIC_KEY=sk-ant-...          # Local AI Builder (optional)

# === LICENSING ===
N8N_LICENSE_ACTIVATION_KEY=your-key      # Enterprise features
N8N_LICENSE_SERVER_URL=https://license.n8n.io/v1

# === COMMUNITY PACKAGES ===
N8N_COMMUNITY_PACKAGES_ENABLED=true
N8N_UNVERIFIED_PACKAGES_ENABLED=true

# === TEMPLATES ===
N8N_TEMPLATES_ENABLED=true
N8N_TEMPLATES_HOST=https://api.n8n.io/api/

# === TELEMETRY ===
N8N_DIAGNOSTICS_ENABLED=true             # Set to false for privacy
```

---

## 15. Key Files Reference

### Configuration Files
```
packages/@n8n/config/src/configs/
├── ai-assistant.config.ts       # Cloud AI service
├── ai-builder.config.ts         # Local AI builder
├── community-packages.config.ts # Community nodes
├── database.config.ts           # Database options
├── deployment.config.ts         # Cloud vs self-hosted
├── diagnostics.config.ts        # PostHog & telemetry
├── executions.config.ts         # Execution settings
├── license.config.ts            # License server
├── nodes.config.ts              # Node filtering
├── scaling-mode.config.ts       # Queue/workers
└── templates.config.ts          # Template gallery
```

### Service Files
```
packages/cli/src/services/
├── frontend.service.ts                 # Settings provider
├── ai-workflow-builder.service.ts      # AI Builder wrapper
└── license/license.service.ts          # License management

packages/frontend/editor-ui/src/app/stores/
├── settings.store.ts                   # Frontend settings
├── posthog.store.ts                    # Feature flags
└── cloudPlan.store.ts                  # Cloud subscription
```

---

## 16. Testing Cloud vs Self-Hosted Locally

### Simulate Cloud Deployment

```bash
# Start n8n as "cloud" deployment
export N8N_DEPLOYMENT_TYPE=cloud
export N8N_AI_ASSISTANT_BASE_URL=https://ai-assistant.n8n.io
export N8N_TEMPLATES_HOST=https://api.n8n.io/api/

pnpm dev
```

**What Changes**:
- Session recording enabled in PostHog
- Cloud-specific UI elements appear
- AI Assistant uses cloud service
- Template gallery shows full catalog

### Simulate Self-Hosted

```bash
# Start as default self-hosted
export N8N_DEPLOYMENT_TYPE=default
export N8N_AI_ASSISTANT_BASE_URL=""
export N8N_AI_ANTHROPIC_KEY="sk-ant-..."  # Optional: Local AI
export N8N_TEMPLATES_ENABLED=false        # Offline mode

pnpm dev
```

**What Changes**:
- No session recording
- Cloud-only features hidden
- Uses local AI (if key provided)
- Templates disabled

---

## Conclusion

**TL;DR**:
- **Cloud**: Fully managed, automatic updates, cloud-exclusive AI, best for small-medium teams
- **Self-Hosted**: Full control, custom nodes, scaling, offline capability, best for large enterprises or specific compliance needs

**Both Are Production-Ready**: Choose based on your operational preferences, not technical capability.

**Hybrid Approach**: Some organizations run self-hosted for production workflows while using cloud for rapid prototyping with AI Assistant.

---

## Additional Resources

- **Official Docs**: https://docs.n8n.io
- **Self-Hosted Installation**: https://docs.n8n.io/hosting/
- **Community Forum**: https://community.n8n.io
- **Source Code**: https://github.com/n8n-io/n8n
- **License Comparison**: https://n8n.io/pricing/

**Last Updated**: 2025-01-06 (n8n master branch)
