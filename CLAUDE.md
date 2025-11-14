# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in the n8n repository.

## Project Overview

n8n is a workflow automation platform written in TypeScript, using a monorepo
structure managed by pnpm workspaces. It consists of a Node.js backend, Vue.js
frontend, and extensible node-based workflow engine.

## General Guidelines

- Always use pnpm
- We use Linear as a ticket tracking system
- We use Posthog for feature flags
- When starting to work on a new ticket – create a new branch from fresh
  master with the name specified in Linear ticket
- When creating a new branch for a ticket in Linear - use the branch name
  suggested by linear
- Use mermaid diagrams in MD files when you need to visualise something

## Essential Commands

### Building
Use `pnpm build` to build all packages. ALWAYS redirect the output of the
build command to a file:

```bash
pnpm build > build.log 2>&1
```

You can inspect the last few lines of the build log file to check for errors:
```bash
tail -n 20 build.log
```

### Testing
- `pnpm test` - Run all tests
- `pnpm test:affected` - Runs tests based on what has changed since the last
  commit

Running a particular test file requires going to the directory of that test
and running: `pnpm test <test-file>`.

When changing directories, use `pushd` to navigate into the directory and
`popd` to return to the previous directory. When in doubt, use `pwd` to check
your current directory.

### Code Quality
- `pnpm lint` - Lint code
- `pnpm typecheck` - Run type checks

Always run lint and typecheck before committing code to ensure quality.
Execute these commands from within the specific package directory you're
working on (e.g., `cd packages/cli && pnpm lint`). Run the full repository
check only when preparing the final PR. When your changes affect type
definitions, interfaces in `@n8n/api-types`, or cross-package dependencies,
build the system before running lint and typecheck.

## Architecture Overview

**Monorepo Structure:** pnpm workspaces with Turbo build orchestration

### Package Structure

The monorepo is organized into these key packages:

- **`packages/@n8n/api-types`**: Shared TypeScript interfaces between frontend and backend
- **`packages/workflow`**: Core workflow interfaces and types
- **`packages/core`**: Workflow execution engine
- **`packages/cli`**: Express server, REST API, and CLI commands
- **`packages/editor-ui`**: Vue 3 frontend application
- **`packages/@n8n/i18n`**: Internationalization for UI text
- **`packages/nodes-base`**: Built-in nodes for integrations
- **`packages/@n8n/nodes-langchain`**: AI/LangChain nodes
- **`@n8n/design-system`**: Vue component library for UI consistency
- **`@n8n/config`**: Centralized configuration management

## Technology Stack

- **Frontend:** Vue 3 + TypeScript + Vite + Pinia + Storybook UI Library
- **Backend:** Node.js + TypeScript + Express + TypeORM
- **Testing:** Jest (unit) + Playwright (E2E)
- **Database:** TypeORM with SQLite/PostgreSQL/MySQL support
- **Code Quality:** Biome (for formatting) + ESLint + lefthook git hooks

### Key Architectural Patterns

1. **Dependency Injection**: Uses `@n8n/di` for IoC container
2. **Controller-Service-Repository**: Backend follows MVC-like pattern
3. **Event-Driven**: Internal event bus for decoupled communication
4. **Context-Based Execution**: Different contexts for different node types
5. **State Management**: Frontend uses Pinia stores
6. **Design System**: Reusable components and design tokens are centralized in
   `@n8n/design-system`, where all pure Vue components should be placed to
   ensure consistency and reusability

## Key Development Patterns

- Each package has isolated build configuration and can be developed independently
- Hot reload works across the full stack during development
- Node development uses dedicated `node-dev` CLI tool
- Workflow tests are JSON-based for integration testing
- AI features have dedicated development workflow (`pnpm dev:ai`)

### TypeScript Best Practices
- **NEVER use `any` type** - use proper types or `unknown`
- **Avoid type casting with `as`** - use type guards or type predicates instead
- **Define shared interfaces in `@n8n/api-types`** package for FE/BE communication

### Error Handling
- Don't use `ApplicationError` class in CLI and nodes for throwing errors,
  because it's deprecated. Use `UnexpectedError`, `OperationalError` or
  `UserError` instead.
- Import from appropriate error classes in each package

### Frontend Development
- **All UI text must use i18n** - add translations to `@n8n/i18n` package
- **Use CSS variables directly** - never hardcode spacing as px values
- **data-test-id must be a single value** (no spaces or multiple values)

When implementing CSS, refer to @packages/frontend/CLAUDE.md for guidelines on
CSS variables and styling conventions.

### Testing Guidelines
- **Always work from within the package directory** when running tests
- **Mock all external dependencies** in unit tests
- **Confirm test cases with user** before writing unit tests
- **Typecheck is critical before committing** - always run `pnpm typecheck`
- **When modifying pinia stores**, check for unused computed properties

What we use for testing and writing tests:
- For testing nodes and other backend components, we use Jest for unit tests. Examples can be found in `packages/nodes-base/nodes/**/*test*`.
- We use `nock` for server mocking
- For frontend we use `vitest`
- For E2E tests we use Playwright. Run with `pnpm --filter=n8n-playwright test:local`.
  See `packages/testing/playwright/README.md` for details.

### Common Development Tasks

When implementing features:
1. Define API types in `packages/@n8n/api-types`
2. Implement backend logic in `packages/cli` module, follow
   `@packages/cli/scripts/backend-module/backend-module.guide.md`
3. Add API endpoints via controllers
4. Update frontend in `packages/editor-ui` with i18n support
5. Write tests with proper mocks
6. Run `pnpm typecheck` to verify types

## Github Guidelines
- When creating a PR, use the conventions in
  `.github/pull_request_template.md` and
  `.github/pull_request_title_conventions.md`.
- Use `gh pr create --draft` to create draft PRs.
- Always reference the Linear ticket in the PR description,
  use `https://linear.app/n8n/issue/[TICKET-ID]`
- always link to the github issue if mentioned in the linear ticket.

---

## n8n CLI Reference & Automation Recipes

### Prerequisites

**Version Requirements:**
- Node.js: >=22.16 (check with `node --version`)
- pnpm: >=10.18.3 (check with `pnpm --version`)

**Upgrade if needed:**
```bash
# Update Node.js (via nvm recommended)
nvm install 22.16
nvm use 22.16

# Update pnpm
corepack enable
corepack prepare pnpm@10.18.3 --activate
```

### Starting n8n

#### Development Mode (Hot Reload)
```bash
# Full stack (frontend + backend)
pnpm dev

# Backend only (API + CLI)
pnpm dev:be

# Frontend only (UI editor)
pnpm dev:fe

# AI features only (LangChain nodes + core)
pnpm dev:ai
```

Access at: **http://localhost:5678**

#### Production Mode
```bash
# Build first
pnpm build > build.log 2>&1

# Start production server
pnpm start

# Or use the binary directly
./packages/cli/bin/n8n start

# Start with tunnel (for webhooks)
pnpm start:tunnel
```

### AI Builder Setup

n8n has TWO AI systems:

#### 1. AI Assistant (Cloud-based)
Requires connection to n8n's hosted AI service.

**Configuration:**
```bash
export N8N_AI_ASSISTANT_BASE_URL="https://ai-assistant.n8n.io"
```

**Files:**
- Config: `packages/@n8n/config/src/configs/ai-assistant.config.ts`
- Service: `packages/cli/src/services/ai-assistant.service.ts`

#### 2. AI Workflow Builder (Local or Cloud)
Can use your own Anthropic API key for local development.

**Configuration:**
```bash
export N8N_AI_ANTHROPIC_KEY="sk-ant-api03-..."
```

**Files:**
- Config: `packages/@n8n/config/src/configs/ai-builder.config.ts`
- Service: `packages/cli/src/services/ai-workflow-builder.service.ts`
- Wrapper: Uses `@n8n/ai-workflow-builder` package

**To Test AI Builder:**
1. Set environment variable: `export N8N_AI_ANTHROPIC_KEY="your-key"`
2. Start n8n: `pnpm dev`
3. Open browser: `http://localhost:5678`
4. Look for AI assistant panel in the workflow editor

### Complete CLI Command Reference

The n8n CLI is located at `packages/cli/bin/n8n` and supports these commands:

#### Workflow Management
```bash
# Export single workflow
./packages/cli/bin/n8n export:workflow --id=5 --output=workflow.json

# Export all workflows
./packages/cli/bin/n8n export:workflow --all --output=./backups/

# Import workflow from JSON
./packages/cli/bin/n8n import:workflow --input=workflow.json

# Import to specific user
./packages/cli/bin/n8n import:workflow --input=workflow.json --userId=user-uuid

# Import to specific project
./packages/cli/bin/n8n import:workflow --input=workflow.json --projectId=project-uuid

# Import directory (separate files)
./packages/cli/bin/n8n import:workflow --separate --input=./workflows/

# List all workflows
./packages/cli/bin/n8n list:workflow

# Update existing workflow
./packages/cli/bin/n8n update:workflow --id=5 --input=updated.json
```

#### Credentials Management
```bash
# Export credentials
./packages/cli/bin/n8n export:credentials --output=creds.json

# Export specific credential
./packages/cli/bin/n8n export:credentials --id=3 --output=cred.json

# Import credentials
./packages/cli/bin/n8n import:credentials --input=creds.json

# Import with decryption key
./packages/cli/bin/n8n import:credentials --input=creds.json --decryptionKey=key
```

#### Entity Management
```bash
# Export all entities (workflows + credentials + tags)
./packages/cli/bin/n8n export:entities --output=./backup/

# Import all entities
./packages/cli/bin/n8n import:entities --input=./backup/

# Export nodes
./packages/cli/bin/n8n export:nodes --output=nodes.json
```

#### Execution Commands
```bash
# Execute workflow by ID
./packages/cli/bin/n8n execute --id=5

# Execute workflow from file
./packages/cli/bin/n8n execute --file=workflow.json

# Batch execute workflows
./packages/cli/bin/n8n execute-batch --ids=1,2,3,4,5

# Execute as snapshot (for testing)
./packages/cli/bin/n8n execute --snapshot=snapshot.json
```

#### Worker & Webhook Mode
```bash
# Start as worker (queue mode)
./packages/cli/bin/n8n worker

# Start webhook listener
./packages/cli/bin/n8n webhook
```

#### Database Operations
```bash
# Revert last migration
./packages/cli/bin/n8n db:revert

# Revert to specific migration
./packages/cli/bin/n8n db:revert --to=migration-name
```

#### User & Security Management
```bash
# Reset user management
./packages/cli/bin/n8n user-management:reset

# Disable MFA for user
./packages/cli/bin/n8n mfa:disable --email=user@example.com

# Reset LDAP configuration
./packages/cli/bin/n8n ldap:reset
```

#### License Management
```bash
# Show license information
./packages/cli/bin/n8n license:info

# Clear license
./packages/cli/bin/n8n license:clear
```

#### Security & Diagnostics
```bash
# Run security audit
./packages/cli/bin/n8n audit

# Run with specific categories
./packages/cli/bin/n8n audit --categories=credentials,nodes

# Generate risk report
./packages/cli/bin/n8n audit --risk-report
```

#### Test-to-Workflow (TTWF)
```bash
# Generate workflow from test
./packages/cli/bin/n8n ttwf:generate --test=test-file.ts --output=workflow.json
```

### Automation Recipes

#### Recipe 1: Backup All Workflows Daily
```bash
#!/bin/bash
# backup-workflows.sh

BACKUP_DIR="$HOME/n8n-backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

cd /path/to/n8n/repo

# Export all workflows
./packages/cli/bin/n8n export:workflow --all --output="$BACKUP_DIR/workflows/"

# Export all credentials (encrypted)
./packages/cli/bin/n8n export:credentials --output="$BACKUP_DIR/credentials.json"

# Export all entities
./packages/cli/bin/n8n export:entities --output="$BACKUP_DIR/entities/"

echo "✅ Backup completed: $BACKUP_DIR"
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-workflows.sh
```

#### Recipe 2: Sync Workflows Between Environments
```bash
#!/bin/bash
# sync-workflows.sh

# Export from development
ssh dev-server "cd /path/to/n8n && ./packages/cli/bin/n8n export:workflow --all --output=/tmp/workflows/"
scp -r dev-server:/tmp/workflows/ ./staging-workflows/

# Import to staging
./packages/cli/bin/n8n import:workflow --separate --input=./staging-workflows/ --projectId=staging-project-id

echo "✅ Workflows synced from dev to staging"
```

#### Recipe 3: Generate Workflow from JSON Template
```bash
#!/bin/bash
# create-workflow.sh

# Create workflow JSON
cat > new-workflow.json << 'EOF'
{
  "name": "Auto-generated Workflow",
  "nodes": [
    {
      "id": "$(uuidgen)",
      "name": "Start",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 300],
      "parameters": {},
      "typeVersion": 1
    },
    {
      "id": "$(uuidgen)",
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300],
      "parameters": {
        "url": "https://api.example.com/data",
        "method": "GET"
      },
      "typeVersion": 4.2
    }
  ],
  "connections": {
    "Start": {
      "main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]
    }
  },
  "active": false
}
EOF

# Import workflow
./packages/cli/bin/n8n import:workflow --input=new-workflow.json

echo "✅ Workflow created and imported"
```

#### Recipe 4: Batch Execute Workflows for Testing
```bash
#!/bin/bash
# test-workflows.sh

# Get all workflow IDs
WORKFLOW_IDS=$(./packages/cli/bin/n8n list:workflow --output=json | jq -r '.[].id' | tr '\n' ',')

# Execute all workflows
./packages/cli/bin/n8n execute-batch --ids="$WORKFLOW_IDS" --concurrency=5

echo "✅ All workflows executed"
```

#### Recipe 5: Export Workflow with Specific Nodes
```bash
#!/bin/bash
# export-workflows-with-node.sh

NODE_TYPE="n8n-nodes-base.slack"
OUTPUT_DIR="./slack-workflows"

# This requires custom logic - export all and filter
./packages/cli/bin/n8n export:workflow --all --output=/tmp/all-workflows/

mkdir -p "$OUTPUT_DIR"

# Filter workflows containing Slack nodes
for file in /tmp/all-workflows/*.json; do
  if grep -q "$NODE_TYPE" "$file"; then
    cp "$file" "$OUTPUT_DIR/"
  fi
done

echo "✅ Slack workflows exported to $OUTPUT_DIR"
```

#### Recipe 6: Monitor Workflow Executions
```bash
#!/bin/bash
# monitor-executions.sh

# Start n8n in background and monitor logs
./packages/cli/bin/n8n start > n8n.log 2>&1 &
N8N_PID=$!

# Monitor for errors
tail -f n8n.log | grep -i "error\|failed\|exception"

# Cleanup on exit
trap "kill $N8N_PID" EXIT
```

### Working with Workflow JSON Structure

#### Minimal Workflow Template
```json
{
  "name": "My Workflow",
  "nodes": [
    {
      "id": "unique-uuid-here",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeType",
      "position": [x, y],
      "parameters": {},
      "typeVersion": 1
    }
  ],
  "connections": {
    "Source Node": {
      "main": [[
        {
          "node": "Target Node",
          "type": "main",
          "index": 0
        }
      ]]
    }
  },
  "active": false,
  "settings": {},
  "meta": {}
}
```

#### Key Workflow Properties
- **id**: Unique identifier (UUID)
- **name**: Workflow display name
- **active**: Boolean - is workflow running?
- **nodes**: Array of node objects
- **connections**: Graph of node connections
- **settings**: Workflow-level configuration
- **pinData**: Pinned test data (optional)
- **versionId**: Version tracking (optional)
- **meta**: Metadata like template ID (optional)

#### Node Structure
```json
{
  "id": "uuid",
  "name": "Unique node name",
  "type": "n8n-nodes-base.nodeType",
  "position": [x, y],
  "typeVersion": 1,
  "parameters": {
    // Node-specific configuration
  },
  "credentials": {
    // Node credentials (if required)
  }
}
```

### Environment Variables Reference

```bash
# Server Configuration
export N8N_PORT=5678
export N8N_HOST=localhost
export N8N_PROTOCOL=http
export N8N_PATH=/
export N8N_LISTEN_ADDRESS=::

# Editor Base URL (for webhooks/emails)
export N8N_EDITOR_BASE_URL=http://localhost:5678

# Database (SQLite default)
export DB_TYPE=sqlite
export DB_SQLITE_DATABASE=/path/to/database.sqlite

# PostgreSQL
export DB_TYPE=postgresdb
export DB_POSTGRESDB_HOST=localhost
export DB_POSTGRESDB_PORT=5432
export DB_POSTGRESDB_DATABASE=n8n
export DB_POSTGRESDB_USER=n8n
export DB_POSTGRESDB_PASSWORD=password

# AI Configuration
export N8N_AI_ASSISTANT_BASE_URL=https://ai-assistant.n8n.io
export N8N_AI_ANTHROPIC_KEY=sk-ant-api03-...

# Execution Mode
export EXECUTIONS_MODE=regular  # or 'queue'
export EXECUTIONS_TIMEOUT=3600
export EXECUTIONS_TIMEOUT_MAX=7200

# Security
export N8N_ENCRYPTION_KEY=your-encryption-key
export N8N_USER_MANAGEMENT_JWT_SECRET=your-jwt-secret

# Feature Flags (PostHog)
export N8N_DIAGNOSTICS_ENABLED=true
export N8N_PERSONALIZATION_ENABLED=true
```

### Docker Setup (No Docker Compose Needed for Local Dev)

For local development, you don't need Docker. However, for production deployment:

#### Quick Docker Start (Production)
```bash
# Create data volume
docker volume create n8n_data

# Run n8n container
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=http \
  -e N8N_HOST=localhost \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

#### Docker Compose (Production with PostgreSQL)
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: n8n
      POSTGRES_DB: n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data

  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8n
      - N8N_ENCRYPTION_KEY=your-encryption-key
      - N8N_AI_ANTHROPIC_KEY=${N8N_AI_ANTHROPIC_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres

volumes:
  postgres_data:
  n8n_data:
```

Run with:
```bash
docker-compose up -d
```

### Testing AI Builder

#### Prerequisites
1. Anthropic API key (get from https://console.anthropic.com)
2. n8n running in dev mode

#### Setup Steps
```bash
# 1. Set API key
export N8N_AI_ANTHROPIC_KEY="sk-ant-api03-YOUR-KEY-HERE"

# 2. Start n8n in dev mode
pnpm dev

# 3. Open browser
open http://localhost:5678

# 4. Create account or login

# 5. Look for AI assistant in:
#    - Workflow editor toolbar
#    - Right sidebar panel
#    - Chat interface
```

#### Testing the AI Builder
1. **Create new workflow**
2. **Open AI assistant panel** (usually in right sidebar)
3. **Try prompts like:**
   - "Create a workflow that fetches data from an API every hour"
   - "Build a Slack notification workflow"
   - "Set up email automation when form is submitted"

#### Troubleshooting AI Builder
```bash
# Check if AI service is configured
grep -r "aiAssistant\|aiBuilder" packages/@n8n/config/

# Check logs for AI errors
tail -f packages/cli/n8n.log | grep -i "ai\|anthropic"

# Verify API key is set
echo $N8N_AI_ANTHROPIC_KEY

# Check frontend settings
curl http://localhost:5678/rest/settings | jq '.aiAssistant'
```

### MCP Server Integration

n8n exposes workflows via Model Context Protocol (MCP) for AI agent integration.

**Available MCP Tools:**
- `get_workflow_details` - Get workflow information
- `search_workflows` - Search workflows by name/tags
- Workflow execution triggers

**Files:**
- `packages/cli/src/modules/mcp/tools/get-workflow-details.tool.ts`
- `packages/cli/src/modules/mcp/tools/search-workflows.tool.ts`

### Quick Reference Card

```bash
# Start n8n for development
pnpm dev                                    # Full stack
pnpm dev:ai                                 # AI features only

# Production
pnpm build > build.log 2>&1                # Build
pnpm start                                  # Run

# Workflows
./packages/cli/bin/n8n export:workflow --all --output=./backups/
./packages/cli/bin/n8n import:workflow --input=workflow.json
./packages/cli/bin/n8n list:workflow

# Execute
./packages/cli/bin/n8n execute --id=5
./packages/cli/bin/n8n execute --file=workflow.json

# Database
./packages/cli/bin/n8n db:revert

# Testing
pnpm test                                   # All tests
pnpm --filter=n8n-playwright test:local    # E2E tests

# AI Setup
export N8N_AI_ANTHROPIC_KEY="sk-ant-..."
```

### Additional Resources

- **Workflow Interface**: `packages/workflow/src/interfaces.ts:2577`
- **CLI Commands**: `packages/cli/src/commands/`
- **AI Builder Service**: `packages/cli/src/services/ai-workflow-builder.service.ts`
- **Import Service**: `packages/cli/src/services/import.service.ts`
- **REST API**: `packages/cli/src/workflows/workflows.controller.ts`
- **Sample Workflows**: `packages/frontend/editor-ui/src/features/workflows/templates/utils/samples/`

### Common Pitfalls

1. **Always export to file when building**: `pnpm build > build.log 2>&1`
2. **Run from package directory for tests**: `cd packages/cli && pnpm test`
3. **Set AI keys before starting**: Environment variables must be set before `pnpm dev`
4. **Check Node/pnpm versions**: Must meet minimum requirements
5. **Use correct project/user IDs**: When importing workflows with `--projectId` or `--userId`
