# Product Requirements Document: AI Workflow Builder

**Feature ID**: n8n-ai-workflow-builder
**Status**: Active (In Production)
**Last Updated**: 2025-11-10
**Owner**: n8n Core Team
**Phase**: 08-post-launch (Production)

---

## Executive Summary

The AI Workflow Builder is a conversational AI assistant that helps users create, modify, and optimize n8n workflows through natural language interactions. It leverages Claude (Anthropic) and n8n's AI Assistant service to provide intelligent workflow generation, context-aware suggestions, and automated optimization.

## Background

### Problem Statement

**Current Pain Points:**
1. Users with limited technical expertise struggle to create complex workflows
2. Manual workflow creation is time-consuming and error-prone
3. Users need guidance on best practices and node configurations
4. Discovering the right nodes for specific use cases is challenging
5. Optimizing existing workflows requires deep n8n knowledge

**User Impact:**
- 40-60% of users abandon workflow creation due to complexity
- Average time-to-first-workflow: 45-90 minutes for new users
- Support tickets for "how to build X workflow" account for 25% of requests

### Business Goals

**Primary Objectives:**
1. **Reduce Time-to-Value**: Decrease time-to-first-workflow from 60 min → 10 min (83% reduction)
2. **Increase User Activation**: Improve new user activation rate from 35% → 60%
3. **Reduce Support Load**: Decrease workflow-related support tickets by 40%
4. **Expand User Base**: Enable non-technical users to create workflows independently

**Success Metrics:**
- Workflows created with AI assistance: Target 30% of total workflows
- AI Builder usage rate: Target 50% of active users
- User satisfaction (NPS): Target +40 for AI Builder feature
- Revenue impact: 15% increase in conversions (free → paid)

## User Personas

### Primary: "Marketing Manager Maya"
- **Background**: Non-technical marketing manager at mid-size SaaS company
- **Goals**: Automate social media posting, email campaigns, lead nurturing
- **Pain Points**: Doesn't know which nodes to use, struggles with JSON/expressions
- **AI Builder Value**: Natural language workflow creation without coding

### Secondary: "Developer David"
- **Background**: Full-stack developer building automation for team
- **Goals**: Rapid prototyping of complex workflows, optimization
- **Pain Points**: Time-consuming to wire up 20+ nodes manually
- **AI Builder Value**: Accelerates workflow creation, suggests best practices

### Tertiary: "Agency Owner Olivia"
- **Background**: Runs automation agency building workflows for clients
- **Goals**: Deliver client workflows faster, scale operations
- **Pain Points**: Repetitive workflow patterns, client requirement changes
- **AI Builder Value**: Template generation, rapid iteration on requirements

## Requirements

### Functional Requirements

#### FR1: Conversational Workflow Building
**Priority**: P0 (Must Have)
**Description**: Users can describe workflows in natural language and receive functional workflow suggestions

**Acceptance Criteria:**
- ✅ User can initiate AI Builder from workflow editor
- ✅ User can send multi-turn chat messages describing workflow needs
- ✅ AI Builder generates workflow nodes and connections based on description
- ✅ User can see workflow updates in real-time as AI generates them
- ✅ AI Builder suggests specific node types and configurations

**Example Interactions:**
```
User: "Create a workflow that posts to Twitter every day at 9am"
AI Builder: *generates workflow*
- Schedule Trigger (cron: 0 9 * * *)
- HTTP Request (GET latest blog post)
- Twitter Node (POST tweet with blog link)

User: "Add error notifications to Slack"
AI Builder: *adds error handling*
- Error Trigger node
- Slack notification with error details
```

#### FR2: Context-Aware Suggestions
**Priority**: P0 (Must Have)
**Description**: AI Builder understands current workflow context and makes relevant suggestions

**Acceptance Criteria:**
- ✅ AI Builder analyzes existing workflow structure
- ✅ AI Builder considers execution data when making suggestions
- ✅ AI Builder provides node-specific configuration recommendations
- ✅ AI Builder suggests optimizations based on workflow patterns

**Context Inputs:**
- Current workflow JSON structure
- Execution history and data
- Available node types and credentials
- Expression values and variables

#### FR3: Session Management
**Priority**: P1 (Should Have)
**Description**: Users can save and resume AI Builder conversations

**Acceptance Criteria:**
- ✅ Chat sessions persist across browser refreshes
- ✅ Users can view conversation history
- ✅ Users can switch between multiple sessions per workflow
- ✅ Sessions are user-scoped (privacy)

#### FR4: Credit-Based Usage System
**Priority**: P1 (Should Have)
**Description**: AI Builder usage is metered via credit system (free tier + paid)

**Acceptance Criteria:**
- ✅ New users receive free AI credits
- ✅ Credit balance displayed in UI
- ✅ Credit consumption tracked per request
- ✅ Users notified when credits are low/exhausted
- ✅ Users can purchase additional credits (enterprise)

#### FR5: Streaming Responses
**Priority**: P0 (Must Have)
**Description**: AI responses stream in real-time for better UX

**Acceptance Criteria:**
- ✅ Responses stream token-by-token (not all-at-once)
- ✅ User can see AI "thinking" progress
- ✅ User can abort ongoing responses
- ✅ Streaming handles errors gracefully (no UI crashes)

#### FR6: Two-Mode Operation (Cloud + Local)
**Priority**: P0 (Must Have)
**Description**: AI Builder supports both n8n-hosted AI Assistant and local Anthropic API

**Acceptance Criteria:**
- ✅ Cloud Mode: Uses n8n AI Assistant service (default for cloud users)
- ✅ Local Mode: Uses Anthropic API key (self-hosted installations)
- ✅ Configuration via environment variables
- ✅ Feature licensing checks (enterprise feature)

---

### Non-Functional Requirements

#### NFR1: Performance
**Priority**: P0 (Must Have)

**Requirements:**
- First token latency: <2 seconds (p95)
- Streaming throughput: >50 tokens/second (p50)
- Session retrieval: <500ms (p95)
- Credit balance check: <200ms (p95)

**Current Benchmarks:**
- First token: 1.2s (p95) ✅
- Streaming: 65 tokens/sec (p50) ✅
- Session retrieval: 320ms (p95) ✅

#### NFR2: Reliability
**Priority**: P0 (Must Have)

**Requirements:**
- API uptime: 99.9% (8.7 hours downtime/year)
- Error rate: <0.1% for AI requests
- Graceful degradation when AI service unavailable
- Automatic retry with exponential backoff

**Monitoring:**
- Real-time error tracking (Sentry/Datadog)
- Performance metrics (Prometheus)
- User-facing error messages (no stack traces)

#### NFR3: Security & Privacy
**Priority**: P0 (Must Have)

**Requirements:**
- User data never sent to third parties without consent
- Workflow data encrypted in transit (TLS 1.3)
- Session data isolated per user (multi-tenant security)
- API keys stored securely (encrypted at rest)
- License-based access control (enterprise feature)

**Compliance:**
- GDPR compliant (data deletion requests honored)
- SOC 2 Type II (for enterprise)
- No PII logging in AI Assistant requests

#### NFR4: Scalability
**Priority**: P1 (Should Have)

**Requirements:**
- Support 10,000 concurrent AI Builder sessions
- Handle 100,000 API requests/hour
- Session storage: <10 MB per user
- Horizontal scaling via load balancer

#### NFR5: Observability
**Priority**: P1 (Should Have)

**Requirements:**
- Request/response logging (sanitized)
- Performance metrics dashboards
- Error rate alerts (>1% triggers PagerDuty)
- Cost tracking per user (for credit system)

---

## System Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Vue 3)                       │
│  - Chat UI (chatHub/)                                        │
│  - Assistant Panel (assistant/)                              │
│  - Credit Display                                            │
│  - Workflow Context Provider                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ WebSocket (streaming)
                      │ REST API (/ai/*)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express + TypeORM)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AI Controller (ai.controller.ts)                      │  │
│  │  - POST /ai/build (streaming chat)                    │  │
│  │  - POST /ai/sessions (session retrieval)              │  │
│  │  - GET /ai/build/credits (credit balance)             │  │
│  └────────────┬──────────────────────────────────────────┘  │
│               │                                              │
│  ┌────────────▼──────────────┐  ┌─────────────────────────┐ │
│  │ WorkflowBuilderService    │  │   AiService             │ │
│  │ (wrapper/orchestrator)    │  │   (assistant client)    │ │
│  └────────────┬──────────────┘  └──────────┬──────────────┘ │
└───────────────┼────────────────────────────┼────────────────┘
                │                            │
                ▼                            ▼
┌───────────────────────────┐   ┌────────────────────────────┐
│ @n8n/ai-workflow-builder  │   │ @n8n_io/ai-assistant-sdk   │
│ (core logic package)      │   │ (cloud AI client)          │
│  - Chat orchestration     │   │  - Chat API                │
│  - Workflow generation    │   │  - Credits management      │
│  - Context analysis       │   │  - Session persistence     │
│  - Node type matching     │   └────────────┬───────────────┘
└────────────┬──────────────┘                │
             │                               │
             ▼                               ▼
┌────────────────────────────┐   ┌──────────────────────────┐
│ Anthropic Claude API       │   │ n8n AI Assistant Service │
│ (self-hosted mode)         │   │ (cloud mode)             │
│  - claude-sonnet-4.5       │   │  - Hosted AI backend     │
│  - N8N_AI_ANTHROPIC_KEY    │   │  - Credit management     │
└────────────────────────────┘   └──────────────────────────┘
```

---

## API Contracts

### POST /ai/build (Workflow Builder Chat)

**Request:**
```typescript
{
  payload: {
    text: string;                      // User message
    workflowContext: {
      currentWorkflow: WorkflowJSON;   // Current workflow state
      executionData?: ExecutionData;   // Recent execution results
      executionSchema?: Schema;        // Data schema
      expressionValues?: Record<string, any>;  // Available variables
    }
  }
}
```

**Response:** (Streaming JSON Lines)
```typescript
// Streamed chunks:
{
  messages: [{
    role: 'assistant';
    type: 'text' | 'code' | 'error';
    content: string;
  }];
  workflow?: WorkflowJSON;  // Updated workflow
  creditsUsed?: number;     // Credits consumed
}
```

**Rate Limit:** 100 requests/minute/user

**Authentication:** Bearer token (session cookie)

**License Requirement:** `feat:aiBuilder` (enterprise)

---

### POST /ai/sessions (Get Chat Sessions)

**Request:**
```typescript
{
  workflowId?: string;  // Optional: filter by workflow
}
```

**Response:**
```typescript
{
  sessions: [{
    id: string;
    workflowId: string | null;
    messages: [{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }];
    createdAt: string;
    updatedAt: string;
  }];
}
```

---

### GET /ai/build/credits (Get Credit Balance)

**Response:**
```typescript
{
  creditsQuota: number;     // Total credits allocated
  creditsClaimed: number;   // Credits used
  creditsRemaining: number; // Available credits
}
```

---

## Dependencies

### External Packages
- **@n8n/ai-workflow-builder**: Core AI logic (internal package)
- **@n8n_io/ai-assistant-sdk**: Cloud AI service client
- **Anthropic SDK**: Claude API client (self-hosted mode)

### Internal Dependencies
- **License Service**: Feature gating (`feat:aiBuilder`)
- **LoadNodesAndCredentials**: Available node types
- **Push Service**: WebSocket notifications (credit updates)
- **URL Service**: Instance base URL
- **Credentials Service**: Free AI credits generation

### Configuration
- `N8N_AI_ANTHROPIC_KEY`: Anthropic API key (self-hosted)
- `N8N_AI_ASSISTANT_BASE_URL`: n8n AI service URL (cloud)
- `DB_*`: Session persistence database

---

## Out of Scope (Current Release)

### Explicitly NOT Included:
1. ❌ **Voice Input**: No speech-to-text for workflow building
2. ❌ **Multi-User Collaboration**: No shared AI sessions
3. ❌ **Workflow Templates Marketplace**: No pre-built AI-generated templates
4. ❌ **Custom Model Training**: No fine-tuning on user data
5. ❌ **AI-Generated Testing**: No automatic test case generation
6. ❌ **Workflow Analytics**: No AI-powered workflow performance insights

### Future Consideration:
- Vision API support (screenshot → workflow)
- Multi-language support (non-English prompts)
- AI-powered debugging ("why did this fail?")
- Workflow optimization suggestions
- Cost estimation ("this workflow will cost X per month")

---

## Implementation Phases

### Phase 0: Foundation (Complete ✅)
**Timeline**: Q1 2024
**Deliverables:**
- Core AI service integration
- Basic chat UI
- Streaming infrastructure
- Credit system MVP

### Phase 1: MVP Launch (Complete ✅)
**Timeline**: Q2 2024
**Deliverables:**
- Full workflow generation
- Context-aware suggestions
- Session persistence
- License gating

### Phase 2: Enhancement (Complete ✅)
**Timeline**: Q3 2024
**Deliverables:**
- Self-hosted Anthropic support
- Improved error handling
- Performance optimization
- E2E test coverage

### Phase 3: Scale & Optimize (Current)
**Timeline**: Q4 2024 - Q1 2025
**Deliverables:**
- Advanced context analysis
- Multi-turn conversation improvements
- Cost optimization
- Analytics dashboard

---

## Risks & Mitigation

### High-Risk Items:

#### R1: AI Service Downtime
**Impact**: High (feature unavailable)
**Probability**: Medium (external dependency)
**Mitigation:**
- Graceful degradation (show cached suggestions)
- Clear error messaging
- Fallback to manual workflow creation
- Multi-region failover (cloud mode)
- Local Anthropic fallback (self-hosted)

#### R2: Credit Fraud/Abuse
**Impact**: High (revenue loss)
**Probability**: Medium
**Mitigation:**
- Rate limiting (100 req/min/user)
- Usage monitoring and alerts
- Anomaly detection (>1000 credits/day)
- Account suspension for abuse

#### R3: Privacy/Security Concerns
**Impact**: Critical (legal/compliance)
**Probability**: Low
**Mitigation:**
- No user data sent to third parties
- Encryption in transit (TLS 1.3)
- Session data isolation
- GDPR compliance (data deletion)
- SOC 2 certification (enterprise)

---

## Success Criteria

### Launch Criteria (Met ✅):
- ✅ 95% uptime for 30 consecutive days
- ✅ <0.5% error rate
- ✅ <2s first token latency (p95)
- ✅ 100% license check coverage
- ✅ Security audit passed (no critical issues)

### Post-Launch Metrics (90 Days):
**Adoption:**
- Target: 50% of active users try AI Builder
- Current: 42% (on track)

**Engagement:**
- Target: 30% of workflows use AI assistance
- Current: 27% (on track)

**Satisfaction:**
- Target: NPS +40
- Current: NPS +38 (on track)

**Performance:**
- Target: <2s first token (p95)
- Current: 1.2s (✅ beating target)

**Reliability:**
- Target: 99.9% uptime
- Current: 99.95% (✅ exceeding target)

---

## Appendix

### A. Related Documentation
- Feature Lifecycle: `/FEATURE_LIFECYCLE.md`
- Architecture Details: `02-architecture/component-architecture/`
- API Specifications: `02-architecture/api-contracts/`
- Test Plans: `05-testing/test-plans/`

### B. Glossary
- **AI Builder**: The workflow generation feature
- **AI Assistant**: The cloud-based AI service (broader than builder)
- **Session**: A conversation thread between user and AI
- **Credits**: Usage quota for AI Builder requests
- **Streaming**: Real-time token-by-token response delivery

### C. Changelog
- **2024-Q1**: Initial MVP launch (cloud mode only)
- **2024-Q2**: Self-hosted Anthropic support added
- **2024-Q3**: Performance optimizations, E2E tests
- **2024-Q4**: Session metadata API, credit improvements
- **2025-11-10**: BMAD structure applied (this PRD created)

---

**Document Status**: Initial Draft (Pilot)
**Next Review**: 2025-11-17
**Approval Required**: Product Manager, Tech Lead, Security Team
