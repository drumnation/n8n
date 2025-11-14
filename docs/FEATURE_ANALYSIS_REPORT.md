# n8n Feature Analysis Report

Generated: 2025-11-10
Analysis Method: Codebase Structure Scan + Hybrid Prioritization

## Executive Summary

This report provides a comprehensive analysis of all features in the n8n codebase, categorized by domain, assessed for complexity and business value, and prioritized using a hybrid strategy (40% business value, 30% technical complexity, 30% dependencies).

## Feature Inventory

### 1. Core Workflow Engine (High Priority)
- **workflows**: Workflow management, CRUD operations, versioning
- **executions**: Execution lifecycle, monitoring, queueing
- **active-executions**: Real-time execution tracking
- **execution-lifecycle**: Complete execution flow management
- **task-runners**: Task execution infrastructure
- **scaling**: Worker mode, queue mode, scaling infrastructure

### 2. Authentication & Security (Critical Priority)
- **auth**: Core authentication system
- **mfa**: Multi-factor authentication
- **sso.ee**: Single sign-on (SAML, OIDC) - Enterprise
- **ldap.ee**: LDAP integration - Enterprise
- **user-management**: User administration
- **permissions.ee**: Role-based access control - Enterprise
- **security-audit**: Security scanning and auditing
- **password-reset**: Password recovery flows

### 3. AI Features (High Business Value)
- **ai-workflow-builder**: AI-powered workflow creation (✅ DONE - Pilot)
- **ai-assistant**: General AI assistance features
- **chat-hub**: Chat interface for AI features
- **evaluation.ee**: AI workflow evaluation - Enterprise
- **mcp**: Model Context Protocol integration

### 4. Data Management
- **credentials**: Credentials management system
- **credentials-tester**: Credential validation
- **binary-data**: Binary/file data handling
- **data-table**: Data table operations
- **external-secrets.ee**: External secret management - Enterprise

### 5. Collaboration Features
- **collaboration**: Real-time collaboration
- **project.ee**: Project organization - Enterprise
- **project-roles**: Role-based project access
- **chat**: In-app messaging
- **push**: Real-time notifications

### 6. Integration Layer
- **webhooks**: Webhook receiver system
- **webhook-processing**: Webhook handling pipeline
- **public-api**: Public REST API (v1)
- **nodes-base**: Built-in integration nodes
- **community-packages**: Community node management
- **dynamic-node-parameters**: Dynamic parameter loading

### 7. Enterprise Features
- **license**: License management
- **environments.ee**: Environment variables - Enterprise
- **source-control**: Git integration - Enterprise
- **workflow-history.ee**: Version history - Enterprise
- **provisioning.ee**: Auto-provisioning - Enterprise
- **annotation-tags.ee**: Enterprise tagging

### 8. Monitoring & Analytics
- **eventbus**: Internal event system
- **telemetry**: Usage analytics
- **metrics**: Performance metrics
- **posthog**: Feature flag management
- **insights**: Usage insights
- **workflow-statistics**: Workflow analytics

### 9. User Interface Features
- **editor-ui/workflows**: Workflow editor
- **editor-ui/credentials**: Credential UI
- **editor-ui/execution**: Execution viewer
- **editor-ui/ndv**: Node Details View
- **editor-ui/settings**: Settings management
- **editor-ui/integrations**: Integration browser

### 10. Infrastructure & Utilities
- **redis-client**: Redis integration
- **cache**: Caching layer
- **pruning**: Data cleanup
- **breaking-changes**: Migration system
- **workflow-index**: Search indexing
- **load-nodes-and-credentials**: Bootstrap system

## Priority Matrix

### Scoring Methodology
- **Business Value (40%)**: User-facing impact, revenue potential, feature usage
- **Technical Complexity (30%)**: Code complexity, dependencies, integration points
- **Dependencies (30%)**: Number of dependent features, core functionality

### Feature Scores (100-point scale)

| Feature | Business Value | Technical Complexity | Dependencies | Total Score | Priority |
|---------|---------------|---------------------|--------------|-------------|----------|
| **workflows** | 40/40 | 30/30 | 30/30 | **100** | Phase 1 |
| **executions** | 40/40 | 28/30 | 28/30 | **96** | Phase 1 |
| **credentials** | 38/40 | 25/30 | 28/30 | **91** | Phase 1 |
| **auth** | 35/40 | 26/30 | 30/30 | **91** | Phase 1 |
| **webhooks** | 36/40 | 24/30 | 25/30 | **85** | Phase 1 |
| **public-api** | 35/40 | 23/30 | 24/30 | **82** | Phase 1 |
| **user-management** | 32/40 | 24/30 | 26/30 | **82** | Phase 1 |
| **ai-assistant** | 38/40 | 26/30 | 18/30 | **82** | Phase 2 |
| **collaboration** | 34/40 | 25/30 | 20/30 | **79** | Phase 2 |
| **project.ee** | 32/40 | 24/30 | 22/30 | **78** | Phase 2 |
| **sso.ee** | 30/40 | 27/30 | 20/30 | **77** | Phase 2 |
| **scaling** | 28/40 | 28/30 | 20/30 | **76** | Phase 2 |
| **nodes-base** | 35/40 | 20/30 | 20/30 | **75** | Phase 2 |
| **permissions.ee** | 28/40 | 26/30 | 20/30 | **74** | Phase 2 |
| **telemetry** | 25/40 | 22/30 | 25/30 | **72** | Phase 2 |
| **mfa** | 28/40 | 22/30 | 20/30 | **70** | Phase 3 |
| **eventbus** | 20/40 | 24/30 | 25/30 | **69** | Phase 3 |
| **chat-hub** | 30/40 | 22/30 | 15/30 | **67** | Phase 3 |
| **ldap.ee** | 25/40 | 25/30 | 16/30 | **66** | Phase 3 |
| **workflow-statistics** | 26/40 | 20/30 | 18/30 | **64** | Phase 3 |
| **binary-data** | 22/40 | 22/30 | 20/30 | **64** | Phase 3 |
| **source-control** | 24/40 | 24/30 | 15/30 | **63** | Phase 3 |
| **mcp** | 28/40 | 20/30 | 12/30 | **60** | Phase 3 |
| **insights** | 24/40 | 18/30 | 18/30 | **60** | Phase 3 |
| **evaluation.ee** | 25/40 | 22/30 | 12/30 | **59** | Phase 3 |
| **community-packages** | 22/40 | 20/30 | 15/30 | **57** | Phase 4 |
| **external-secrets.ee** | 20/40 | 22/30 | 14/30 | **56** | Phase 4 |
| **workflow-history.ee** | 22/40 | 20/30 | 12/30 | **54** | Phase 4 |
| **dynamic-node-parameters** | 18/40 | 20/30 | 15/30 | **53** | Phase 4 |
| **posthog** | 20/40 | 16/30 | 16/30 | **52** | Phase 4 |
| **annotation-tags.ee** | 18/40 | 18/30 | 14/30 | **50** | Phase 4 |
| **provisioning.ee** | 16/40 | 20/30 | 12/30 | **48** | Phase 4 |
| **data-table** | 18/40 | 16/30 | 12/30 | **46** | Phase 4 |
| **metrics** | 15/40 | 18/30 | 12/30 | **45** | Phase 4 |
| **cache** | 12/40 | 16/30 | 16/30 | **44** | Phase 5 |
| **redis-client** | 10/40 | 18/30 | 15/30 | **43** | Phase 5 |
| **pruning** | 14/40 | 15/30 | 10/30 | **39** | Phase 5 |
| **breaking-changes** | 12/40 | 14/30 | 12/30 | **38** | Phase 5 |
| **workflow-index** | 14/40 | 12/30 | 10/30 | **36** | Phase 5 |

## Dependencies Graph

### Core Dependencies (Foundation Layer)
```
auth → user-management → permissions
         ↓
    workflows → executions → task-runners
         ↓           ↓
   credentials   scaling
         ↓
    webhooks → public-api
```

### Feature Dependencies (Application Layer)
```
ai-assistant → chat-hub → evaluation.ee
collaboration → project.ee → project-roles
sso.ee → ldap.ee
telemetry → insights → posthog
```

## Complexity Assessment

### High Complexity Features (26-30/30)
- workflows (30) - Core engine with extensive logic
- auth (26) - Security-critical with multiple providers
- executions (28) - Complex state management
- scaling (28) - Distributed system complexity
- sso.ee (27) - Multiple protocol support
- permissions.ee (26) - Complex RBAC system

### Medium Complexity Features (20-25/30)
- credentials (25)
- webhooks (24)
- collaboration (25)
- project.ee (24)
- eventbus (24)
- binary-data (22)

### Lower Complexity Features (<20/30)
- telemetry (22)
- workflow-statistics (20)
- cache (16)
- pruning (15)

## Risk Analysis

### High-Risk Features (Critical Path)
1. **workflows** - Core functionality, all features depend on this
2. **executions** - Runtime critical, affects all workflow operations
3. **auth** - Security critical, breach impacts entire system
4. **credentials** - Security sensitive, credential leaks are catastrophic

### Medium-Risk Features
- webhooks (external dependencies)
- scaling (performance critical)
- collaboration (real-time sync issues)
- public-api (external interface)

### Low-Risk Features
- telemetry (monitoring only)
- insights (analytics only)
- cache (performance optimization)
- pruning (maintenance task)

## Recommendations

### Immediate Actions
1. Begin with Phase 1 features (highest impact + dependencies)
2. Prioritize security features early (auth, credentials)
3. Core engine documentation before peripheral features
4. Enterprise features can be parallel track

### Documentation Strategy
- Use BMAD structure proven in pilot
- Target 85/100 minimum quality score
- Focus on API contracts and interfaces
- Include migration guides for breaking changes

### Resource Allocation
- Phase 1: 2-3 senior agents for core features
- Phase 2: 3-4 agents for parallel work
- Phase 3-5: Can be distributed across team

## Next Steps
1. Generate 5-phase transformation roadmap
2. Begin Phase 1 transformations
3. Create automation tooling
4. Establish quality gates