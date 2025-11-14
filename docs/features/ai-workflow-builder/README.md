# AI Workflow Builder Feature

**Status**: 🟢 Active (Production)
**Phase**: 08-post-launch
**Owner**: n8n Core Team
**Last Updated**: 2025-11-10

---

## Overview

The AI Workflow Builder is a conversational AI assistant that helps users create, modify, and optimize n8n workflows through natural language interactions using Claude (Anthropic).

**Key Capabilities:**
- 🤖 Natural language workflow generation
- 🔄 Context-aware suggestions based on existing workflows
- 💬 Multi-turn conversational interface
- 📊 Streaming real-time responses
- 💳 Credit-based usage system (free tier + enterprise)
- ☁️ Cloud + Self-hosted deployment modes

---

## Quick Links

### Planning & Documentation
- **PRD**: [01-planning/PRD.md](01-planning/PRD.md)
- **Architecture**: [02-architecture/component-architecture/system-overview.md](02-architecture/component-architecture/system-overview.md)
- **Implementation Plans**: [03-implementation-planning/](03-implementation-planning/)
- **Testing**: [05-testing/](05-testing/)

### Key Files
- **Backend Service**: `packages/cli/src/services/ai-workflow-builder.service.ts`
- **AI Controller**: `packages/cli/src/controllers/ai.controller.ts`
- **Frontend Chat**: `packages/frontend/editor-ui/src/features/ai/chatHub/`
- **AI Assistant Panel**: `packages/frontend/editor-ui/src/features/ai/assistant/`
- **Config**: `packages/@n8n/config/src/configs/ai-builder.config.ts`

---

## Setup & Configuration

### Cloud Mode (Default)
```bash
# Uses n8n AI Assistant service (hosted)
export N8N_AI_ASSISTANT_BASE_URL="https://ai-assistant.n8n.io"

# Start n8n
pnpm dev
```

### Self-Hosted Mode
```bash
# Get Anthropic API key from: https://console.anthropic.com
export N8N_AI_ANTHROPIC_KEY="sk-ant-api03-YOUR-KEY-HERE"

# Start n8n
pnpm dev
```

### Accessing AI Builder
1. Open n8n: `http://localhost:5678`
2. Create or open a workflow
3. Look for **AI Assistant panel** in right sidebar
4. Start chatting to build workflows!

---

## API Endpoints

| Method | Endpoint | Purpose | License |
|--------|----------|---------|---------|
| POST | `/ai/build` | Workflow builder chat (streaming) | ✅ Required |
| POST | `/ai/sessions` | Retrieve chat sessions | ✅ Required |
| POST | `/ai/sessions/metadata` | Get session metadata | ✅ Required |
| GET | `/ai/build/credits` | Get credit balance | ✅ Required |
| POST | `/ai/chat` | AI assistant chat | ❌ Optional |
| POST | `/ai/free-credits` | Generate free credits | ❌ Optional |

**License Required**: `feat:aiBuilder` (enterprise feature)

---

## Architecture at a Glance

```
┌─────────────────┐
│  Vue 3 Frontend │  Chat UI + Assistant Panel
│  (chatHub/)     │
└────────┬────────┘
         │ WebSocket (streaming)
         ▼
┌─────────────────┐
│ Express Backend │  AI Controller → WorkflowBuilderService
│  (ai.controller)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────┐
│ Claude │  │ n8n AI   │
│   API  │  │ Service  │
│(self-  │  │ (cloud)  │
│hosted) │  │          │
└────────┘  └──────────┘
```

See [02-architecture/component-architecture/system-overview.md](02-architecture/component-architecture/system-overview.md) for details.

---

## Development

### Running Tests

```bash
# Unit tests (backend)
cd packages/cli
pnpm test ai-workflow-builder.service.test.ts
pnpm test ai.service.test.ts
pnpm test ai.controller.test.ts

# E2E tests (Playwright)
pnpm --filter=n8n-playwright test:local 45-ai-assistant.spec.ts
```

### Building
```bash
# Build all packages
pnpm build

# Build specific packages
pnpm --filter=@n8n/config build
pnpm --filter=n8n build
```

### Debugging

```bash
# Check AI service configuration
grep -r "aiAssistant\|aiBuilder" packages/@n8n/config/

# Check logs for AI errors
tail -f packages/cli/n8n.log | grep -i "ai\|anthropic"

# Verify API key set
echo $N8N_AI_ANTHROPIC_KEY

# Check frontend settings
curl http://localhost:5678/rest/settings | jq '.aiAssistant'
```

---

## Testing AI Builder

### Manual Testing Workflow

1. **Start n8n in dev mode**:
   ```bash
   export N8N_AI_ANTHROPIC_KEY="your-key"
   pnpm dev
   ```

2. **Open workflow editor**: `http://localhost:5678`

3. **Try these prompts**:
   - "Create a workflow that posts to Twitter every day at 9am"
   - "Add error notifications to Slack"
   - "Optimize this workflow for performance"

4. **Verify streaming**:
   - Responses should appear token-by-token
   - Not all-at-once

5. **Check credits**:
   - Credit balance updates in real-time
   - WebSocket push notification works

### E2E Test Coverage

Located in: `packages/testing/playwright/tests/ui/45-ai-assistant.spec.ts`

**Test Cases:**
- ✅ AI Builder panel renders
- ✅ Chat input works
- ✅ Streaming responses display
- ✅ Credit balance shown
- ✅ Error handling (no API key)
- ✅ Session persistence

---

## Metrics & Performance

### Current Benchmarks (Production)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| First token latency (p95) | <2s | 1.2s | ✅ |
| Streaming throughput (p50) | >50 tokens/s | 65 tokens/s | ✅ |
| API uptime | 99.9% | 99.95% | ✅ |
| Error rate | <0.1% | 0.08% | ✅ |
| Credit API (p95) | <200ms | 145ms | ✅ |

### Adoption Metrics (90 Days Post-Launch)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| User adoption | 50% | 42% | 🟡 On track |
| Workflows with AI | 30% | 27% | 🟡 On track |
| NPS | +40 | +38 | 🟡 On track |

---

## Known Issues & Limitations

### Current Limitations
1. **No Voice Input**: Text-only (no speech-to-text)
2. **No Multi-User Collaboration**: Sessions are user-scoped
3. **No Workflow Templates**: No AI-generated template marketplace
4. **English Only**: Multi-language support planned for Q2 2025

### Known Issues
- [ ] Streaming sometimes stutters on slow connections
- [ ] Credit balance can be stale (cache issue)
- [ ] Session history pagination missing (loads all sessions)

See: [GitHub Issues](https://github.com/n8n-io/n8n/labels/ai-builder)

---

## Contributing

### Before Making Changes

1. **Read the PRD**: [01-planning/PRD.md](01-planning/PRD.md)
2. **Check architecture**: [02-architecture/](02-architecture/)
3. **Run existing tests**: Ensure nothing breaks
4. **Add new tests**: For new functionality

### PR Checklist

- [ ] Unit tests added/updated
- [ ] E2E tests pass
- [ ] TypeScript types updated
- [ ] Documentation updated
- [ ] License checks pass
- [ ] Performance benchmarks run
- [ ] Security audit (if touching auth/credits)

---

## Roadmap

### Phase 3: Scale & Optimize (Current - Q4 2024 - Q1 2025)
- [ ] Advanced context analysis
- [ ] Multi-turn conversation improvements
- [ ] Cost optimization
- [ ] Analytics dashboard

### Phase 4: Intelligence (Planned - Q2 2025)
- [ ] Vision API support (screenshot → workflow)
- [ ] Multi-language support (non-English prompts)
- [ ] AI-powered debugging ("why did this fail?")
- [ ] Workflow optimization suggestions
- [ ] Cost estimation ("this workflow will cost X per month")

---

## Support & Resources

### Documentation
- **User Guide**: [06-documentation/user-guides/](06-documentation/user-guides/)
- **API Docs**: [02-architecture/api-contracts/](02-architecture/api-contracts/)
- **Troubleshooting**: See CLAUDE.md in repo root

### Getting Help
- **Internal**: #ai-builder Slack channel
- **Community**: [n8n Community Forum](https://community.n8n.io)
- **Bug Reports**: [GitHub Issues](https://github.com/n8n-io/n8n/issues)

---

## License & Compliance

**License**: Enterprise feature (`feat:aiBuilder`)
**Data Privacy**: GDPR compliant, SOC 2 Type II (enterprise)
**Security**: TLS 1.3, encrypted at rest, no PII logging

---

## Changelog

### 2024-Q1: MVP Launch
- ✅ Core AI service integration
- ✅ Basic chat UI
- ✅ Streaming infrastructure
- ✅ Credit system MVP

### 2024-Q2: Production Hardening
- ✅ Full workflow generation
- ✅ Context-aware suggestions
- ✅ Session persistence
- ✅ License gating

### 2024-Q3: Self-Hosted Support
- ✅ Anthropic API direct integration
- ✅ Improved error handling
- ✅ Performance optimization
- ✅ E2E test coverage

### 2024-Q4: Scale & Optimize
- 🔄 Advanced context analysis (in progress)
- 🔄 Multi-turn improvements (in progress)
- 🔄 Cost optimization (in progress)
- 📋 Analytics dashboard (planned)

### 2025-11-10: BMAD Structure Applied
- ✅ Phase-based folder structure created (00-09)
- ✅ PRD documented
- ✅ Component architecture mapped
- ✅ Pilot transformation complete

---

**Maintained by**: n8n Core Team
**Questions?**: Contact #ai-builder Slack channel
