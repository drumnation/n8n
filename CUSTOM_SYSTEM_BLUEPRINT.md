# Custom System Blueprint: n8n + Claude Code Integration

## Your Custom Automation Platform

This is how to build YOUR OWN system around n8n, using Claude Code as the brain.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR CUSTOM SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ Claude Code  │ ◄─────► │     n8n      │                  │
│  │  (Brain)     │         │  (Executor)  │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                         │                          │
│         │                         │                          │
│  ┌──────▼─────────────────────────▼───────┐                 │
│  │         Workflow Library                │                 │
│  │  - Git-versioned workflows              │                 │
│  │  - Template system                      │                 │
│  │  - Auto-generated from prompts          │                 │
│  └─────────────────────────────────────────┘                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                          │
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼───┐        ┌────▼────┐      ┌────▼────┐
    │GitHub │        │  APIs   │      │Database │
    │Slack  │        │Services │      │  Your   │
    │Email  │        │External │      │  Data   │
    └───────┘        └─────────┘      └─────────┘
```

---

## Example 1: "Workflow as Code" System

### Concept
Write workflows in simple YAML, Claude Code converts to n8n JSON.

### Implementation

#### 1. Create Workflow DSL (Domain Specific Language)

`workflows/daily-backup.yaml`:
```yaml
workflow:
  name: "Daily Backup"
  description: "Backs up all workflows to Git"

  trigger:
    type: schedule
    cron: "0 2 * * *"  # 2 AM daily

  steps:
    - id: export
      type: n8n-cli
      action: export_workflows
      params:
        output: "./backups/{{date}}"

    - id: git_add
      type: shell
      command: "git add backups/"

    - id: git_commit
      type: shell
      command: "git commit -m 'Backup {{date}}'"

    - id: git_push
      type: shell
      command: "git push origin main"

    - id: notify
      type: email
      to: "admin@company.com"
      subject: "Backup completed"
      body: "Successfully backed up {{count}} workflows"
```

#### 2. Parser Script (Claude Code Creates This)

`scripts/yaml-to-n8n.js`:
```javascript
const yaml = require('js-yaml');
const fs = require('fs');
const { execSync } = require('child_process');

// Load YAML workflow
const yamlContent = fs.readFileSync('workflows/daily-backup.yaml', 'utf8');
const workflow = yaml.load(yamlContent);

// Convert to n8n JSON structure
const n8nWorkflow = {
  name: workflow.workflow.name,
  nodes: [],
  connections: {}
};

// Add trigger node
if (workflow.workflow.trigger.type === 'schedule') {
  n8nWorkflow.nodes.push({
    id: 'trigger',
    name: 'Schedule Trigger',
    type: 'n8n-nodes-base.scheduleTrigger',
    parameters: {
      rule: { interval: [{ field: 'cronExpression', cronExpression: workflow.workflow.trigger.cron }] }
    },
    position: [250, 300],
    typeVersion: 1.2
  });
}

// Add step nodes
let xPos = 450;
workflow.workflow.steps.forEach((step, index) => {
  const nodeId = step.id;

  if (step.type === 'shell') {
    n8nWorkflow.nodes.push({
      id: nodeId,
      name: step.id,
      type: 'n8n-nodes-base.executeCommand',
      parameters: {
        command: step.command
      },
      position: [xPos, 300],
      typeVersion: 1
    });
  } else if (step.type === 'email') {
    n8nWorkflow.nodes.push({
      id: nodeId,
      name: 'Send Email',
      type: 'n8n-nodes-base.emailSend',
      parameters: {
        to: step.to,
        subject: step.subject,
        text: step.body
      },
      position: [xPos, 300],
      typeVersion: 2.1
    });
  }

  xPos += 200;
});

// Connect nodes
for (let i = 0; i < n8nWorkflow.nodes.length - 1; i++) {
  const sourceNode = n8nWorkflow.nodes[i].name;
  const targetNode = n8nWorkflow.nodes[i + 1].name;

  n8nWorkflow.connections[sourceNode] = {
    main: [[{ node: targetNode, type: 'main', index: 0 }]]
  };
}

// Save to file
fs.writeFileSync('generated-workflow.json', JSON.stringify(n8nWorkflow, null, 2));

// Import to n8n
execSync('./packages/cli/bin/n8n import:workflow --input=generated-workflow.json');

console.log('✅ Workflow deployed to n8n!');
```

#### 3. Usage

```bash
# 1. Write workflow in YAML
nano workflows/my-automation.yaml

# 2. Convert and deploy
node scripts/yaml-to-n8n.js

# 3. Workflow is live in n8n!
```

---

## Example 2: Claude Code Workflow Generator

### Concept
Tell Claude Code what you want, it generates the workflow.

### Implementation

#### The Workflow Generator Agent

`claude-workflow-agent.md` (Skill/prompt):
```markdown
# n8n Workflow Generator

When the user describes an automation, generate a complete n8n workflow JSON.

## Template Structure

{
  "name": "Workflow Name",
  "nodes": [
    {
      "id": "unique-id",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeType",
      "position": [x, y],
      "parameters": {},
      "typeVersion": 1
    }
  ],
  "connections": {
    "Source Node": {
      "main": [[{"node": "Target Node", "type": "main", "index": 0}]]
    }
  }
}

## Available Node Types

- scheduleTrigger - Scheduled tasks
- manualTrigger - Manual execution
- webhook - HTTP webhook
- httpRequest - API calls
- set - Transform data
- if - Conditional logic
- switch - Multiple branches
- executeCommand - Shell commands
- function - Custom JavaScript
- slack - Slack integration
- gmail - Gmail
- github - GitHub
- postgres - PostgreSQL

## Example Request

User: "Create a workflow that checks GitHub stars every hour and posts to Slack if it increased"

Response:
{workflow JSON here}

Then save to file and run:
./packages/cli/bin/n8n import:workflow --input=generated.json
```

#### Usage with Claude Code

**You:** "Create a workflow that monitors Hacker News for 'AI' posts and saves them to Notion"

**Claude Code:**
1. Generates complete workflow JSON
2. Saves to file
3. Imports to n8n
4. Provides execution command
5. You just run it

---

## Example 3: Intelligent Workflow Optimizer

### Concept
Claude Code analyzes your workflows and suggests optimizations.

### Implementation

```bash
# 1. Export all workflows
./packages/cli/bin/n8n export:workflow --all --output=./analysis/

# 2. Claude Code analyzes
# - Finds duplicate logic
# - Suggests reusable sub-workflows
# - Identifies performance bottlenecks
# - Recommends better node combinations

# 3. Generates optimization report
# 4. Creates improved workflow versions
# 5. You review and deploy
```

Example analysis output:
```markdown
## Workflow Analysis Report

### Workflow: "Daily Data Sync"
- **Issue**: HTTP Request node called 100 times in loop
- **Recommendation**: Use Batch node to combine requests
- **Impact**: 50x faster, 90% fewer API calls

### Workflow: "Email Notifications"
- **Issue**: Duplicate email sending logic in 5 workflows
- **Recommendation**: Create reusable sub-workflow
- **Impact**: Easier maintenance, consistent formatting

### Generated Optimizations
- Created: `optimized-data-sync.json`
- Created: `email-notification-template.json`

Import with:
./packages/cli/bin/n8n import:workflow --input=optimized-data-sync.json
```

---

## Example 4: GitOps Workflow Management

### Concept
All workflows in Git, auto-deploy on commit.

### Directory Structure
```
n8n-workflows/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── workflows/
│   ├── production/
│   │   ├── daily-backup.json
│   │   ├── data-sync.json
│   │   └── monitoring.json
│   ├── staging/
│   │   └── test-workflow.json
│   └── templates/
│       └── email-template.json
├── scripts/
│   ├── deploy.sh               # Deployment script
│   ├── validate.sh             # Workflow validation
│   └── test.sh                 # Integration tests
└── README.md
```

### CI/CD Pipeline

`.github/workflows/deploy.yml`:
```yaml
name: Deploy n8n Workflows

on:
  push:
    branches: [main]
    paths:
      - 'workflows/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Validate Workflows
        run: |
          for file in workflows/production/*.json; do
            # Validate JSON syntax
            jq empty "$file" || exit 1
          done

      - name: Deploy to n8n
        run: |
          for file in workflows/production/*.json; do
            ./packages/cli/bin/n8n import:workflow --input="$file"
          done

      - name: Run Tests
        run: |
          ./scripts/test.sh
```

### Usage
```bash
# 1. Make changes to workflow
nano workflows/production/my-workflow.json

# 2. Commit and push
git add workflows/
git commit -m "Update my-workflow"
git push

# 3. CI/CD automatically deploys to n8n
# 4. Slack notification on success/failure
```

---

## Example 5: Workflow Marketplace

### Concept
Create, share, and install workflows like npm packages.

### Implementation

#### Package Format

`workflows/packages/github-monitor/package.json`:
```json
{
  "name": "@my-org/github-monitor",
  "version": "1.0.0",
  "description": "Monitor GitHub repositories for changes",
  "workflow": "./workflow.json",
  "credentials": ["github"],
  "author": "Your Name",
  "keywords": ["github", "monitoring", "notifications"]
}
```

#### CLI Tool

```bash
# Install workflow package
./scripts/workflow-install.js @my-org/github-monitor

# Publishes workflow to local registry
# Auto-imports to n8n
# Sets up required credentials
```

#### Marketplace Features
- Search workflows by keyword
- Version management
- Dependency handling
- Auto-updates
- User ratings/reviews

---

## Example 6: Real-Time Workflow Builder UI

### Concept
Custom web UI that generates workflows, powered by Claude Code.

### Tech Stack
- Frontend: React/Vue
- Backend: Express
- AI: Claude API (via your key)
- Executor: n8n CLI

### Flow
```
User describes workflow in UI
    ↓
Frontend sends to backend
    ↓
Backend calls Claude API with prompt template
    ↓
Claude generates workflow JSON
    ↓
Backend validates JSON
    ↓
Backend imports to n8n via CLI
    ↓
Returns workflow ID to frontend
    ↓
Frontend opens workflow in n8n editor
```

### Backend API

```javascript
// server.js
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { execSync } = require('child_process');

const app = express();
const anthropic = new Anthropic({
  apiKey: process.env.N8N_AI_ANTHROPIC_KEY
});

app.post('/api/generate-workflow', async (req, res) => {
  const { description } = req.body;

  // Call Claude to generate workflow
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Generate an n8n workflow JSON for: ${description}

Return ONLY the JSON, no explanation.

Use these node types:
- n8n-nodes-base.scheduleTrigger
- n8n-nodes-base.httpRequest
- n8n-nodes-base.set
...

Workflow JSON:`
    }]
  });

  const workflowJson = message.content[0].text;

  // Save to temp file
  fs.writeFileSync('/tmp/workflow.json', workflowJson);

  // Import to n8n
  const output = execSync('./packages/cli/bin/n8n import:workflow --input=/tmp/workflow.json');

  res.json({
    success: true,
    workflow: JSON.parse(workflowJson),
    message: 'Workflow created!'
  });
});

app.listen(3000);
```

---

## Example 7: Monitoring & Analytics Dashboard

### Concept
Custom dashboard showing workflow performance, built with n8n data.

### Data Sources
```bash
# Workflow executions
sqlite3 ~/.n8n/database.sqlite "
SELECT
  w.name,
  COUNT(e.id) as executions,
  AVG(e.stoppedAt - e.startedAt) as avg_duration,
  SUM(CASE WHEN e.finished = 1 THEN 1 ELSE 0 END) as successful
FROM execution_entity e
JOIN workflow_entity w ON e.workflowId = w.id
GROUP BY w.id
"

# Failed executions
sqlite3 ~/.n8n/database.sqlite "
SELECT
  w.name,
  e.startedAt,
  e.stoppedAt,
  e.status
FROM execution_entity e
JOIN workflow_entity w ON e.workflowId = w.id
WHERE e.finished = 0
ORDER BY e.startedAt DESC
LIMIT 20
"
```

### Dashboard Features
- Real-time execution monitoring
- Performance metrics
- Error tracking
- Workflow dependencies visualization
- Cost analysis (API usage)

---

## Quick Start: Pick Your System

### 1. Workflow as Code (Simple)
**Best for**: Infrastructure teams, GitOps fans
**Setup time**: 2 hours
**Maintenance**: Low

Start here: Create `workflows/` directory, write YAML, use converter script

### 2. Claude-Powered Generator (Medium)
**Best for**: Power users, automation at scale
**Setup time**: 4 hours
**Maintenance**: Medium

Start here: Set up Claude Code prompts, create workflow templates

### 3. Full Platform (Advanced)
**Best for**: Product teams, SaaS builders
**Setup time**: 1-2 weeks
**Maintenance**: High

Start here: Build web UI, API backend, integrate Claude API

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Set up version control for workflows
- [ ] Create backup automation
- [ ] Document credential management
- [ ] Test CLI automation

### Phase 2: Automation (Week 2)
- [ ] Build YAML to JSON converter
- [ ] Set up CI/CD pipeline
- [ ] Create workflow templates
- [ ] Test deployment automation

### Phase 3: Intelligence (Week 3)
- [ ] Integrate Claude API
- [ ] Build workflow generator
- [ ] Create optimization analyzer
- [ ] Test AI-powered features

### Phase 4: Platform (Week 4)
- [ ] Build web UI (optional)
- [ ] Create API backend
- [ ] Set up monitoring
- [ ] Launch internally

---

## Tools & Resources

### Essential Scripts
```bash
# Backup script (add to cron)
./scripts/backup-workflows.sh

# Deployment script
./scripts/deploy-workflows.sh

# Testing script
./scripts/test-workflows.sh

# Validation script
./scripts/validate-workflows.sh
```

### Helpful Queries
```bash
# Find slow workflows
sqlite3 ~/.n8n/database.sqlite "
SELECT w.name, AVG(e.stoppedAt - e.startedAt) as avg_ms
FROM execution_entity e
JOIN workflow_entity w ON e.workflowId = w.id
GROUP BY w.id
ORDER BY avg_ms DESC
"

# Find error-prone workflows
sqlite3 ~/.n8n/database.sqlite "
SELECT w.name,
  COUNT(*) as total,
  SUM(CASE WHEN e.finished = 0 THEN 1 ELSE 0 END) as failed,
  ROUND(100.0 * SUM(CASE WHEN e.finished = 0 THEN 1 ELSE 0 END) / COUNT(*), 2) as error_rate
FROM execution_entity e
JOIN workflow_entity w ON e.workflowId = w.id
GROUP BY w.id
HAVING error_rate > 5
"
```

---

**Your n8n system is ready to be whatever you need it to be.**

Start small, iterate, automate everything. 🚀
