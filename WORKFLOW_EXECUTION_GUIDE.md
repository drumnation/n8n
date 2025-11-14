# Workflow Execution Testing Guide

**Date**: 2025-11-14
**Status**: Ready for Testing

## Quick Start

### Method 1: UI Execution (Recommended for First Test)

1. **Open email logger workflow**: http://localhost:5678/workflow/NR4DvZbJcry0sWH4
2. **Click "Execute workflow"** button (red button in top right)
3. **Check results**:
   ```bash
   # Check if file was created
   ls -la /tmp/n8n-emails-*.json

   # View logged emails
   cat /tmp/n8n-emails-$(date +%Y-%m-%d).json
   ```

### Method 2: API Execution (Autonomous Testing)

```bash
# Get your API key from n8n UI:
# Settings → API → Create new API key

# Test execution
./test-workflow-execution.sh NR4DvZbJcry0sWH4 your-api-key-here

# Or set environment variable
export N8N_API_KEY="your-api-key-here"
./test-workflow-execution.sh NR4DvZbJcry0sWH4
```

## Email Logger Workflow Details

**Workflow ID**: `NR4DvZbJcry0sWH4`
**URL**: http://localhost:5678/workflow/NR4DvZbJcry0sWH4

### Nodes
1. **Manual Trigger** - Start workflow manually
2. **Get Unread Emails** - Gmail node (last 24 hours, max 5)
3. **Extract Email Data** - JavaScript code to parse email content
4. **Write to File** - Save to `/tmp/n8n-emails-YYYY-MM-DD.json`

### Expected Output

```json
{
  "emailId": "18c8f9a1234567",
  "from": "sender@example.com",
  "subject": "Meeting Request",
  "date": "Thu, 14 Nov 2024 15:30:00 -0800",
  "snippet": "Hi, can we schedule a meeting...",
  "bodyPreview": "Hi,\n\nCan we schedule a meeting to discuss Q4 planning?\n\nBest regards,\nSender"
}
---
```

## API Execution Endpoint

### Discovered Endpoint
**Location**: `packages/cli/src/workflows/workflows.controller.ts:443`

```typescript
@Post('/:workflowId/run')
@ProjectScope('workflow:execute')
async runManually(req: WorkflowRequest.ManualRun, _res: unknown)
```

### Request Format
```bash
POST http://localhost:5678/workflows/{workflowId}/run
Headers:
  X-N8N-API-KEY: your-api-key
  Content-Type: application/json
Body:
{
  "workflowData": {
    "id": "workflow-id",
    "name": "Workflow Name",
    "nodes": [...],
    "connections": {...},
    "settings": {}
  }
}
```

### Response Format
```json
{
  "data": {
    "resultData": {
      "runData": {
        "Node Name": [
          {
            "data": {
              "main": [[{...}]]
            }
          }
        ]
      },
      "error": null,
      "lastNodeExecuted": "Write to File"
    }
  },
  "finished": true,
  "mode": "manual",
  "startedAt": "2024-11-14T23:30:00.000Z",
  "stoppedAt": "2024-11-14T23:30:05.123Z"
}
```

## Testing Workflows

### Email Logger Workflow
```bash
# Test email logger
./test-workflow-execution.sh NR4DvZbJcry0sWH4

# Expected files created:
# - /tmp/workflow-data.json - Full workflow definition
# - /tmp/execution-result.json - Complete execution response
# - /tmp/node-outputs.json - Individual node outputs
# - /tmp/n8n-emails-YYYY-MM-DD.json - Logged emails
```

### Email → Todoist Workflow
```bash
# Test full workflow with Todoist integration
./test-workflow-execution.sh QT3XZGQe2dLjpZx2

# Check Todoist tasks created:
# - Open Todoist app or web
# - Look for tasks with "email" label
# - Verify task content matches email subject/sender
```

## Troubleshooting

### API Key Issues
```bash
# Get API key from n8n UI:
# 1. Open http://localhost:5678
# 2. Click Settings (gear icon)
# 3. Go to "API" section
# 4. Click "Create new API key"
# 5. Copy the key

# Test API key
curl -X GET "http://localhost:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: your-key" | jq .
```

### Credential Issues
```bash
# Check if credentials are configured
# 1. Open workflow in UI
# 2. Click on Gmail node
# 3. Check if credential is selected
# 4. Test credential (green "Test credential" button)
```

### Gmail Permissions
```bash
# If Gmail node fails with auth error:
# 1. Open credential in n8n UI
# 2. Click "Reconnect"
# 3. Re-authorize with Google
# 4. Grant all requested permissions
```

### File Write Permissions
```bash
# If file write fails:
# Check /tmp directory permissions
ls -la /tmp/

# Try alternative path
# Edit workflow, change Write File node path to:
# /Users/dmieloch/Downloads/n8n-emails-{{ date }}.json
```

## Autonomous Execution Loop

### Current Progress
- ✅ **Step 1**: Generate workflow JSON programmatically
- ✅ **Step 2**: Import workflow via REST API
- ✅ **Step 3**: Configure credentials automatically
- ⏸️ **Step 4**: Execute workflow via API (script ready, needs API key)
- ⏸️ **Step 5**: Parse execution results (parsing logic in script)
- ⏸️ **Step 6**: Analyze errors and iterate (needs implementation)

### Next Steps for Full Autonomy

#### 1. Error Analysis Function
```typescript
interface ExecutionError {
  node: string;
  type: 'credential' | 'parameter' | 'api' | 'logic';
  message: string;
  suggestedFix: string;
}

function analyzeExecutionErrors(result: ExecutionResult): ExecutionError[] {
  const errors: ExecutionError[] = [];

  if (result.data.resultData.error) {
    const error = result.data.resultData.error;
    const failedNode = result.data.resultData.lastNodeExecuted;

    // Credential errors
    if (error.message.includes('credentials') || error.message.includes('authentication')) {
      errors.push({
        node: failedNode,
        type: 'credential',
        message: error.message,
        suggestedFix: 'Reconnect credential in n8n UI and re-authorize'
      });
    }

    // Parameter errors
    if (error.message.includes('parameter') || error.message.includes('required')) {
      errors.push({
        node: failedNode,
        type: 'parameter',
        message: error.message,
        suggestedFix: 'Check node parameters match API requirements'
      });
    }

    // API errors
    if (error.message.includes('API') || error.message.includes('rate limit')) {
      errors.push({
        node: failedNode,
        type: 'api',
        message: error.message,
        suggestedFix: 'Add delay between requests or reduce frequency'
      });
    }

    // Logic errors
    errors.push({
      node: failedNode,
      type: 'logic',
      message: error.message,
      suggestedFix: 'Review node configuration and data flow'
    });
  }

  return errors;
}
```

#### 2. Iteration Loop
```typescript
async function autonomousWorkflowDevelopment(requirements: string) {
  let workflow = generateWorkflowFromRequirements(requirements);
  let attempt = 1;
  const maxAttempts = 5;

  while (attempt <= maxAttempts) {
    console.log(`🔄 Attempt ${attempt}: Testing workflow...`);

    // Import workflow
    const imported = await importWorkflow(workflow);
    console.log(`✅ Imported: ${imported.id}`);

    // Execute workflow
    const result = await executeWorkflow(imported.id);

    // Check for errors
    const errors = analyzeExecutionErrors(result);

    if (errors.length === 0) {
      console.log(`✅ Success! Workflow works correctly.`);
      return {
        success: true,
        workflowId: imported.id,
        result,
        attempts: attempt
      };
    }

    // Log errors
    console.log(`❌ Attempt ${attempt} failed with ${errors.length} error(s):`);
    errors.forEach(err => {
      console.log(`  - ${err.node}: ${err.message}`);
      console.log(`    Fix: ${err.suggestedFix}`);
    });

    // Apply fixes
    workflow = applyFixes(workflow, errors);
    attempt++;
  }

  return {
    success: false,
    error: 'Max attempts reached',
    lastErrors: errors
  };
}
```

## Success Indicators

### Email Logger Workflow
- ✅ Workflow executes without errors
- ✅ File created at `/tmp/n8n-emails-*.json`
- ✅ File contains email data in JSON format
- ✅ Email count matches unread emails in Gmail

### Email → Todoist Workflow
- ✅ Workflow executes without errors
- ✅ Tasks appear in Todoist
- ✅ Tasks have "email" label
- ✅ Task content matches email subject/sender
- ✅ One task per email

## Performance Metrics

| Workflow | Nodes | Expected Time | API Calls |
|----------|-------|---------------|-----------|
| Email Logger | 4 | 2-5 seconds | 1 (Gmail) |
| Email → Todoist | 4 | 3-8 seconds | 2 (Gmail + Todoist) |

## Security Notes

- **API Key**: Never commit API keys to git
- **Credentials**: Stored encrypted in n8n database
- **Execution**: Runs in n8n server context with full permissions
- **File Access**: Write operations limited to paths n8n user can access

---

**Status**: Ready for testing. Run UI test first to verify Gmail integration works, then test API execution.
