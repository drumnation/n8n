# n8n API Integration Findings

**Date**: 2025-11-14
**Workflow ID**: `8YHBA4Dt1dDMz3Q9`
**Workflow Name**: Email Intelligence Test

## Successfully Implemented

### ✅ Workflow Import via REST API
Successfully imported a basic 2-node workflow using POST `/api/v1/workflows`:

```bash
curl -X POST "http://localhost:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: [JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

**Required JSON Structure**:
```json
{
  "name": "Workflow Name",
  "nodes": [...],
  "connections": {...},
  "settings": {}  // Required field (even if empty)
}
```

**Important**: Do NOT include `"active": true/false` field - it's read-only and will cause 400 error.

### ✅ Workflow Retrieval
Can GET workflow details to inspect current structure:

```bash
curl -X GET "http://localhost:5678/api/v1/workflows/8YHBA4Dt1dDMz3Q9" \
  -H "X-N8N-API-KEY: [JWT_TOKEN]"
```

Returns complete workflow JSON including nodes, connections, settings, project info, and version metadata.

## API Limitations Discovered

### ❌ Credentials Endpoint (Security Restriction)
```bash
GET /api/v1/credentials  # Returns: "GET method not allowed"
```

**Reason**: Security by design - credentials should not be exposed via public API.

**Workaround**: Credentials must be configured via n8n web UI at `http://localhost:5678`.

### ❌ Workflow Execution (Endpoint Not Found)
Attempted multiple execution endpoints:
```bash
POST /api/v1/workflows/{id}/run     # "not found"
POST /api/v1/executions              # "POST method not allowed"
```

**Status**: Need to investigate correct execution endpoint or use manual trigger in UI.

### ❌ Workflow Activation (Method Not Supported)
```bash
PATCH /api/v1/workflows/{id}  # "PATCH method not allowed"
```

**Reason**: Activation must be done via web UI.

## Current Workflow State

**Imported Workflow**:
- **ID**: `8YHBA4Dt1dDMz3Q9`
- **Nodes**:
  1. Manual Trigger (n8n-nodes-base.manualTrigger)
  2. Get Unread Emails (n8n-nodes-base.gmail) - **NO CREDENTIALS CONFIGURED**
- **Active**: `false`
- **Owner**: David Mieloch <davidmieloch@gmail.com>
- **Project**: Personal workspace (ID: lkHjBtaok4XF2e0v)

**Blocker**: Gmail node has no credentials attached. Cannot execute workflow until credentials configured.

## Next Steps Required

### Step 1: Configure Gmail OAuth2 Credentials (Manual via UI)

1. **Open n8n UI**: Navigate to `http://localhost:5678`
2. **Go to Credentials**: Click hamburger menu → Settings → Credentials
3. **Find or Create Gmail OAuth2**:
   - If credential exists: Note the credential ID from URL
   - If creating new:
     - Click "Add Credential"
     - Select "Gmail OAuth2"
     - Enter Google OAuth Client ID and Secret
     - Complete OAuth flow
     - Save credential and note the ID from URL

4. **Configure Workflow**:
   - Open workflow "Email Intelligence Test" (ID: 8YHBA4Dt1dDMz3Q9)
   - Click on "Get Unread Emails" node
   - Under "Credential to connect with", select the Gmail OAuth2 credential
   - Save workflow

### Step 2: Test Execution (Manual Trigger)

1. **Open Workflow**: `http://localhost:5678/workflow/8YHBA4Dt1dDMz3Q9`
2. **Click "Test workflow"** button (top right)
3. **Execute Manually**: Click "Execute node" on Manual Trigger
4. **Verify Results**:
   - Check if Gmail node successfully fetches emails
   - Verify no errors in execution log
   - Confirm data output shows email list

### Step 3: Investigate Execution API

Once manual execution works, investigate:
- Correct API endpoint for programmatic execution
- Whether workflow must be "active" for API execution
- How to trigger manual workflows via API

## Lessons Learned

### What Works via API
- ✅ Workflow import (POST with JSON)
- ✅ Workflow retrieval (GET by ID)
- ✅ Workflow listing (GET /workflows)

### What Requires Web UI
- ❌ Credential configuration (security restriction)
- ❌ Workflow activation (UI-only operation)
- ❌ Manual workflow execution (endpoint not found)

### Security Design
n8n's public API is intentionally restricted:
- Credentials are never exposed via API
- Sensitive operations require UI authentication
- This aligns with security best practices

## Autonomous Feedback Loop Status

**Goal**: Enable agents to generate → import → execute → debug workflows autonomously.

**Progress**:
- ✅ **Generate**: Can create workflow JSON programmatically
- ✅ **Import**: Successfully imported via REST API
- ⚠️ **Execute**: Blocked by credential configuration requirement
- ⏸️ **Debug**: Cannot proceed until execution works

**Blocker**: The "user entering credentials" step is indeed the hardest part - confirmed by API limitations.

**Recommendation**:
1. User configures credentials once in UI (one-time setup)
2. Note credential IDs for future use
3. Agents include credential references in workflow JSON
4. Continue investigating execution API for autonomous testing

## Code References

### Successful Import Command
```bash
curl -X POST "http://localhost:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email Intelligence Test",
    "nodes": [
      {
        "id": "manual-trigger",
        "name": "Manual Trigger",
        "type": "n8n-nodes-base.manualTrigger",
        "position": [250, 300],
        "parameters": {},
        "typeVersion": 1
      },
      {
        "id": "gmail-get-unread",
        "name": "Get Unread Emails",
        "type": "n8n-nodes-base.gmail",
        "position": [450, 300],
        "parameters": {
          "resource": "message",
          "operation": "getAll",
          "filters": {"q": "is:unread newer_than:1d"},
          "returnAll": false,
          "limit": 5
        },
        "typeVersion": 2.1
      }
    ],
    "connections": {
      "Manual Trigger": {
        "main": [[{"node": "Get Unread Emails", "type": "main", "index": 0}]]
      }
    },
    "settings": {}
  }'
```

### Response
```json
{
  "id": "8YHBA4Dt1dDMz3Q9",
  "name": "Email Intelligence Test",
  "active": false,
  "versionId": "3fc7184e-a2b4-471f-894e-3cc156b1df77",
  "createdAt": "2025-11-14T23:11:10.719Z"
}
```

## URLs for Manual Configuration

- **n8n UI**: http://localhost:5678
- **Workflow Editor**: http://localhost:5678/workflow/8YHBA4Dt1dDMz3Q9
- **Credentials**: http://localhost:5678/home/credentials
- **API Documentation**: http://localhost:5678/api/v1/docs (if available)

## Future Enhancements

Once credential configuration is resolved:

1. **Full Email→Task Workflow**: Import the complete 8-node workflow from `workflows/email-to-task-workflow.json`
2. **Execution Automation**: Find correct API endpoint for programmatic execution
3. **Error Parsing**: Capture and parse real execution errors for debugging
4. **Autonomous Iteration**: Close the feedback loop (generate → test → fix → repeat)

---

**Status**: Partially automated - import works, execution requires manual credential setup.
