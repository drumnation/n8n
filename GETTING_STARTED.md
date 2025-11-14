# Getting Started with Your n8n Setup

## Why One Instance?

**You only need ONE instance running:**
- ✅ **Dev Server (http://localhost:5678)** - Best choice
  - Hot reload for instant changes
  - AI Builder enabled
  - Full debugging
  - Source code access

- ❌ Docker instances - Only use for production deployment
  - No hot reload
  - Harder to debug
  - Use when you deploy to a server

**Current status: Dev server running at http://localhost:5678** ✅

---

## Step 1: Create Your Admin Account (2 minutes)

### First-Time Setup

1. **Open n8n:**
   ```bash
   open http://localhost:5678
   ```

2. **You'll see the welcome screen:**
   - Click "Get Started"
   - Or if you see a login screen, click "Sign up"

3. **Create your account:**
   ```
   Email: your-email@example.com
   First Name: Your Name
   Last Name: Your Last Name
   Password: (strong password)
   ```

4. **Accept terms and create account**
   - This creates a LOCAL account (not n8n cloud)
   - Data stays on YOUR machine
   - Password stored securely with bcrypt

5. **You're in!**
   - You'll see the n8n editor
   - This account is now the admin
   - You can create more users later

### Checking Your Account

```bash
# View your account in database
sqlite3 ~/.n8n/database.sqlite "SELECT email, firstName, lastName, role FROM user;"

# Change password if needed (via UI: Settings > Personal > Change Password)
```

---

## Step 2: Understanding Credentials (5 minutes)

### What Are Credentials in n8n?

Credentials are HOW you authenticate with external services:
- GitHub API tokens
- Slack OAuth
- Database passwords
- API keys
- OAuth 2.0 apps

### How Credentials Work

**Cloud Version:**
- Stores encrypted credentials on n8n servers
- You trust their encryption

**Your Version:**
- Stores encrypted credentials in `~/.n8n/database.sqlite`
- Encrypted with YOUR encryption key
- Never leaves your machine
- You control everything

### Creating Your First Credential

#### Example 1: GitHub Personal Access Token

1. **Get GitHub Token:**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `read:user`
   - Generate and copy token

2. **Add to n8n:**
   - In n8n editor, click your profile (top right)
   - Go to "Credentials"
   - Click "+ Add Credential"
   - Search for "GitHub"
   - Select "GitHub API"
   - Paste your token
   - Give it a name: "My GitHub"
   - Click "Save"

3. **Test it:**
   - Create new workflow
   - Add "HTTP Request" node
   - URL: `https://api.github.com/user`
   - Authentication: Use "My GitHub" credential
   - Execute
   - See your GitHub profile data

#### Example 2: Generic API Key (Works for ANY API)

1. **In n8n:**
   - Credentials > Add Credential
   - Search "HTTP Header Auth"
   - Header Name: `Authorization`
   - Header Value: `Bearer your-api-key-here`
   - Save as "My API"

2. **Use in workflows:**
   - Any HTTP Request node
   - Select "My API" credential
   - Works with Anthropic, OpenAI, any API

#### Example 3: Database Connection

1. **PostgreSQL Example:**
   - Credentials > Add Credential
   - Search "Postgres"
   - Fill in:
     ```
     Host: localhost
     Database: mydb
     User: myuser
     Password: mypass
     Port: 5432
     ```
   - Test connection
   - Save

### Credential Security

Your credentials are encrypted with this key:
```bash
cat ~/.n8n/config
# Shows your encryption key

# This key encrypts ALL credentials
# Keep it safe - if you lose it, credentials are unrecoverable
# Back it up somewhere secure
```

### Viewing Encrypted Credentials

```bash
# Raw encrypted data (unreadable)
sqlite3 ~/.n8n/database.sqlite "SELECT name, type FROM credentials_entity;"

# n8n decrypts them when you use them in workflows
# Only n8n with the right key can decrypt
```

---

## Step 3: AI Workflow Builder (The Good Stuff)

### Is AI Builder Actually Working?

**YES.** Your Anthropic API key is configured:
```bash
echo $N8N_AI_ANTHROPIC_KEY
# Should show: sk-ant-api03-...
```

### How to Use AI Builder

1. **Create New Workflow:**
   - Click "+ New workflow" (top right)

2. **Find AI Assistant:**
   - Look for **sparkle icon (✨)** in the toolbar
   - Or check right sidebar for "AI" panel
   - Or press `Ctrl+K` (keyboard shortcut)

3. **Try These Prompts:**

   **Simple:**
   ```
   Create a workflow that gets GitHub stars for a repository
   ```

   **Medium:**
   ```
   Build a workflow that:
   1. Fetches new issues from GitHub every hour
   2. Sends them to Slack
   3. Stores them in a database
   ```

   **Advanced:**
   ```
   Create an automated backup system that:
   1. Runs daily at 2 AM
   2. Exports all workflows
   3. Commits to Git
   4. Sends success email
   ```

4. **What AI Builder Does:**
   - Generates complete workflows
   - Adds nodes with proper configuration
   - Connects them correctly
   - Adds error handling
   - Suggests improvements

### Testing AI Builder NOW

Let's create a real workflow with AI:

1. Open http://localhost:5678
2. Create new workflow
3. Open AI Assistant
4. Paste this prompt:
   ```
   Create a workflow that:
   1. Triggers manually
   2. Gets the current weather for San Francisco
   3. Formats the temperature and conditions
   4. Returns the result

   Use the OpenWeatherMap API (free tier)
   ```

5. Watch it build the workflow
6. Execute and see results

### AI Builder vs Cloud

| Feature | Cloud | Your Setup |
|---------|-------|------------|
| AI Model | Claude | Claude (same) |
| Prompt UI | ✓ | ✓ |
| Code Generation | ✓ | ✓ |
| Workflow Suggestions | ✓ | ✓ |
| Cost | Included | Your API usage |
| Rate Limits | n8n's limits | Your limits |
| Privacy | Prompts to n8n | Direct to Anthropic |

**Advantage**: You pay only for what you use. No markup.

---

## Step 4: Claude Code + n8n Integration

### What Can Claude Code Do With n8n?

#### 1. Create Workflows Programmatically

```bash
# Claude Code can write JSON workflows
cat > my-workflow.json << 'EOF'
{
  "name": "Generated by Claude",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [{"field": "hours", "hoursInterval": 1}]
        }
      },
      "typeVersion": 1.2
    }
  ],
  "connections": {}
}
EOF

# Import it
./packages/cli/bin/n8n import:workflow --input=my-workflow.json
```

#### 2. Read and Analyze Workflows

```bash
# Export all workflows
./packages/cli/bin/n8n export:workflow --all --output=./analysis/

# Claude Code can:
# - Read workflow JSON
# - Analyze logic
# - Suggest optimizations
# - Find patterns
# - Generate documentation
```

#### 3. Automated Testing

```bash
# Claude Code can create test workflows
cat > test-workflow.json << 'EOF'
{
  "name": "API Test",
  "nodes": [
    {
      "id": "test",
      "name": "Test Node",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.github.com/repos/n8n-io/n8n",
        "options": {
          "response": {
            "response": {
              "fullResponse": true
            }
          }
        }
      },
      "typeVersion": 4.2,
      "position": [250, 300]
    }
  ],
  "connections": {}
}
EOF

# Import and execute
./packages/cli/bin/n8n import:workflow --input=test-workflow.json
./packages/cli/bin/n8n execute --file=test-workflow.json

# Verify results automatically
```

#### 4. Build Custom Nodes

Claude Code can help you create custom nodes:

```typescript
// packages/nodes-base/nodes/MyCustom/MyCustomNode.node.ts
import { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class MyCustomNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Custom Node',
    name: 'myCustomNode',
    group: ['transform'],
    version: 1,
    description: 'Does custom thing',
    defaults: {
      name: 'My Custom Node',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Transform',
            value: 'transform',
          },
        ],
        default: 'transform',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Your custom logic
    const items = this.getInputData();
    return this.prepareOutputData(items);
  }
}
```

Then hot reload automatically picks it up!

#### 5. Workflow Generation from Requirements

**You:** "I need a workflow that monitors Hacker News for AI posts and sends them to Notion"

**Claude Code can:**
1. Generate the workflow JSON
2. Configure all nodes
3. Set up credentials structure
4. Import it to n8n
5. Test execution
6. Document it

---

## Step 5: Building Your Custom System

### Architecture Options

#### Option 1: n8n as Automation Hub
```
Your Apps → n8n Workflows → External Services
                ↓
         Claude Code manages workflows
```

**Use for:**
- Automated data pipelines
- Integration between services
- Scheduled tasks
- Event-driven automation

#### Option 2: n8n + Custom Backend
```
Custom API (Express/FastAPI)
    ↓
Triggers n8n workflows via webhook
    ↓
n8n processes and returns results
```

**Use for:**
- Your app needs automation
- Complex business logic
- User-triggered workflows
- Dynamic workflow creation

#### Option 3: n8n + Claude Code
```
Claude Code
    ↓
Generates/modifies workflows
    ↓
n8n executes them
    ↓
Results back to Claude Code
```

**Use for:**
- AI-powered automation
- Dynamic workflow generation
- Intelligent orchestration
- Self-improving systems

### Custom System Example: "Workflow as Code"

Create a system where you write workflows in YAML:

```yaml
# my-automation.yaml
name: Daily Backup
trigger:
  schedule: "0 2 * * *"
steps:
  - action: export_workflows
    params:
      format: json
      output: /backups/

  - action: git_commit
    params:
      message: "Automated backup"

  - action: send_email
    params:
      to: admin@company.com
      subject: "Backup completed"
```

Then use Claude Code to:
1. Parse YAML
2. Generate n8n workflow JSON
3. Import to n8n
4. Execute and monitor

### Integration Patterns

#### Pattern 1: Webhook Triggers
```bash
# n8n exposes webhooks
# Your system calls them

# In n8n: Create workflow with Webhook trigger
# Get webhook URL: https://localhost:5678/webhook/my-automation

# Call from anywhere:
curl -X POST https://localhost:5678/webhook/my-automation \
  -H "Content-Type: application/json" \
  -d '{"data": "value"}'
```

#### Pattern 2: CLI Integration
```bash
# Your system calls n8n CLI

# Bash script
#!/bin/bash
WORKFLOW_ID="abc123"
./packages/cli/bin/n8n execute --id=$WORKFLOW_ID
```

#### Pattern 3: Database Direct Access
```bash
# Advanced: Read n8n's SQLite database directly
sqlite3 ~/.n8n/database.sqlite "
SELECT id, name, active
FROM workflow_entity
WHERE active = 1;
"
```

### Custom System Ideas

1. **AI Workflow Generator**
   - User describes what they want
   - Claude Code generates workflow
   - Auto-imports to n8n
   - User just executes

2. **Workflow Marketplace**
   - Export workflows to JSON
   - Store in Git repo
   - Users browse and import
   - Version control included

3. **Monitoring Dashboard**
   - Read workflow executions from DB
   - Display in custom UI
   - Real-time updates
   - Analytics and insights

4. **GitOps for Workflows**
   - All workflows in Git
   - CI/CD pipeline
   - Auto-deploy on commit
   - Rollback capability

---

## Quick Reference

### Essential Commands
```bash
# Start n8n
./start-n8n-dev.sh

# Import workflow
./packages/cli/bin/n8n import:workflow --input=file.json

# Export workflows
./packages/cli/bin/n8n export:workflow --all --output=./backups/

# List workflows
./packages/cli/bin/n8n list:workflow

# Execute workflow
./packages/cli/bin/n8n execute --id=<id>

# Check if running
curl http://localhost:5678/healthz
```

### URLs
- **n8n Editor**: http://localhost:5678
- **API Docs**: http://localhost:5678/api/v1/docs (after enabling)
- **Webhooks**: http://localhost:5678/webhook/*

### Database Queries
```bash
# List workflows
sqlite3 ~/.n8n/database.sqlite "SELECT id, name, active FROM workflow_entity;"

# List credentials
sqlite3 ~/.n8n/database.sqlite "SELECT name, type FROM credentials_entity;"

# List executions
sqlite3 ~/.n8n/database.sqlite "SELECT workflowId, finished, mode FROM execution_entity LIMIT 10;"
```

---

## Next Steps

1. ✅ **Create your admin account** - Open http://localhost:5678
2. ✅ **Add first credential** - GitHub or API key
3. ✅ **Test AI Builder** - Create workflow with AI
4. ✅ **Try CLI automation** - Import/export workflows
5. ✅ **Plan your custom system** - Choose architecture
6. ✅ **Read the docs** - CLAUDE.md has all CLI commands

---

## Troubleshooting

### AI Builder not showing?
```bash
# Check API key
echo $N8N_AI_ANTHROPIC_KEY

# Should show your key
# If empty:
export N8N_AI_ANTHROPIC_KEY="sk-ant-api03-..."
```

### Can't create account?
```bash
# Check server is running
curl http://localhost:5678/healthz

# Check logs
tail -50 n8n-dev.log
```

### Credentials not working?
```bash
# Check encryption key
cat ~/.n8n/config

# Verify in database
sqlite3 ~/.n8n/database.sqlite "SELECT name, type FROM credentials_entity;"
```

---

**You're ready to build.** Open http://localhost:5678 and create your account!
