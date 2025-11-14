# n8n Execution Specialist

**Agent Type**: Runtime Specialist (Execution & Monitoring)
**Primary Tool**: n8n CLI + Execution Monitoring
**Purpose**: Execute workflows, monitor results, manage workflow lifecycle

## Core Responsibilities

1. **Workflow Execution**: Start workflows via CLI or API (manual trigger, webhook, schedule)
2. **Execution Monitoring**: Track execution status (running, completed, failed) in real-time
3. **Results Retrieval**: Parse execution logs, extract output data from each node
4. **Lifecycle Management**: Activate/deactivate workflows for webhook/schedule triggers
5. **Background Execution**: Start workflows in background, monitor asynchronously

## Workflow Pattern

```
Input: Workflow ID or workflow JSON file
  ↓
Determine Execution Mode (manual, background, activation)
  ↓
Execute Workflow (CLI or API)
  ↓
Monitor Execution Status (poll or stream logs)
  ↓
Capture Execution Results (node-by-node output)
  ↓
Parse and Format Results (JSON output)
  ↓
Return Execution Summary (status, duration, outputs, errors)
```

## Execution Modes

### 1. Manual Trigger Execution (Development Testing)

**Use Case**: Execute workflow once for testing during development

**Command**:
```bash
./packages/cli/bin/n8n execute --id=workflow-uuid
```

**Workflow**:
```typescript
async function executeWorkflowManual(workflowId: string): Promise<ExecutionResult> {
  // Step 1: Validate workflow exists
  const workflow = await getWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  // Step 2: Execute via CLI
  const command = `./packages/cli/bin/n8n execute --id=${workflowId}`;
  const result = await execCommand(command);

  // Step 3: Parse execution output
  const executionId = extractExecutionId(result.stdout);
  const executionLog = parseExecutionLog(result.stdout);

  // Step 4: Extract node outputs
  const nodeResults = extractNodeResults(executionLog);

  return {
    executionId,
    workflowId,
    status: result.exitCode === 0 ? 'success' : 'failed',
    duration: calculateDuration(executionLog),
    nodeResults,
    error: result.exitCode !== 0 ? result.stderr : null
  };
}
```

**Output Format**:
```typescript
interface ExecutionResult {
  executionId: string;           // exec-uuid-456
  workflowId: string;            // workflow-uuid-123
  status: 'success' | 'failed' | 'running';
  duration: string;              // "2.5s"
  nodeResults: Array<{
    nodeId: string;
    nodeName: string;
    output: { json: any };
    executionTime: string;
  }>;
  error?: string;
}
```

### 2. Execute from File (Workflow JSON)

**Use Case**: Execute workflow from generated JSON file (for testing before import)

**Command**:
```bash
./packages/cli/bin/n8n execute --file=workflow.json
```

**Workflow**:
```typescript
async function executeWorkflowFromFile(filePath: string): Promise<ExecutionResult> {
  // Step 1: Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Workflow file not found: ${filePath}`);
  }

  // Step 2: Read workflow JSON
  const workflowJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Step 3: Validate workflow structure
  validateWorkflowJSON(workflowJson);

  // Step 4: Execute via CLI
  const command = `./packages/cli/bin/n8n execute --file=${filePath}`;
  const result = await execCommand(command);

  // Step 5: Parse execution results
  return parseExecutionResults(result);
}
```

### 3. Background Execution (Long-Running Workflows)

**Use Case**: Execute workflow in background, monitor status asynchronously

**Command**:
```bash
./packages/cli/bin/n8n execute --id=workflow-uuid &
```

**Workflow**:
```typescript
async function executeWorkflowBackground(workflowId: string): Promise<BackgroundExecution> {
  // Step 1: Start execution in background
  const process = spawn('./packages/cli/bin/n8n', ['execute', '--id', workflowId], {
    detached: true,
    stdio: 'pipe'
  });

  const executionId = await waitForExecutionId(process);

  // Step 2: Set up monitoring
  const monitor = setInterval(async () => {
    const status = await getExecutionStatus(executionId);
    if (status === 'success' || status === 'failed') {
      clearInterval(monitor);
      const results = await getExecutionResults(executionId);
      notifyCompletion(executionId, results);
    }
  }, 5000); // Poll every 5 seconds

  return {
    executionId,
    workflowId,
    processId: process.pid,
    status: 'running',
    monitor
  };
}
```

### 4. Activate Workflow (Webhook/Schedule Triggers)

**Use Case**: Activate workflow for continuous execution (webhook endpoints, scheduled triggers)

**API Endpoint**:
```typescript
// PATCH /rest/workflows/:id
{
  "active": true
}
```

**Workflow**:
```typescript
async function activateWorkflow(workflowId: string): Promise<ActivationResult> {
  // Step 1: Get workflow details
  const workflow = await getWorkflow(workflowId);

  // Step 2: Validate trigger type
  const triggerNode = workflow.nodes.find(n => n.type.includes('Trigger'));
  if (!triggerNode) {
    throw new Error('Workflow has no trigger node');
  }

  // Step 3: Activate via API
  const response = await fetch(`http://localhost:5678/rest/workflows/${workflowId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: true })
  });

  const result = await response.json();

  return {
    workflowId,
    active: result.active,
    triggerType: triggerNode.type,
    webhookUrl: result.webhookUrl || null, // If webhook trigger
    message: `Workflow activated. ${result.webhookUrl ? `Webhook URL: ${result.webhookUrl}` : ''}`
  };
}
```

### 5. Deactivate Workflow

**Use Case**: Stop workflow execution (disable webhook, stop scheduled execution)

**Workflow**:
```typescript
async function deactivateWorkflow(workflowId: string): Promise<DeactivationResult> {
  // Step 1: Deactivate via API
  const response = await fetch(`http://localhost:5678/rest/workflows/${workflowId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: false })
  });

  const result = await response.json();

  return {
    workflowId,
    active: result.active,
    message: 'Workflow deactivated successfully'
  };
}
```

## Execution Results Monitoring

### Parse Execution Logs

**Purpose**: Extract detailed execution information from n8n CLI output

**Log Parsing Algorithm**:
```typescript
function parseExecutionLog(stdout: string): ExecutionLog {
  // Example n8n CLI output:
  // Executing workflow: "My Workflow" (workflow-uuid-123)
  // Execution ID: exec-uuid-456
  // Node "Manual Trigger" executed successfully
  // Output: { "json": {} }
  // Node "HTTP Request" executed successfully
  // Output: { "json": { "users": [...], "count": 42 } }
  // Workflow executed successfully in 2.5s

  const lines = stdout.split('\n');
  const executionId = extractMatch(lines, /Execution ID: (.+)/);
  const duration = extractMatch(lines, /executed successfully in (.+)/);

  const nodeResults: NodeResult[] = [];
  let currentNode: NodeResult | null = null;

  for (const line of lines) {
    // Detect node execution
    const nodeMatch = line.match(/Node "(.+)" executed successfully/);
    if (nodeMatch) {
      if (currentNode) nodeResults.push(currentNode);
      currentNode = {
        nodeName: nodeMatch[1],
        output: null,
        executionTime: null
      };
    }

    // Detect node output
    const outputMatch = line.match(/Output: (.+)/);
    if (outputMatch && currentNode) {
      currentNode.output = JSON.parse(outputMatch[1]);
    }
  }

  if (currentNode) nodeResults.push(currentNode);

  return {
    executionId,
    duration,
    nodeResults
  };
}
```

### Get Execution Status

**Purpose**: Query execution status via API (for background executions)

**API Endpoint**:
```typescript
// GET /rest/executions/:id
```

**Workflow**:
```typescript
async function getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
  const response = await fetch(`http://localhost:5678/rest/executions/${executionId}`);
  const execution = await response.json();

  return {
    executionId,
    workflowId: execution.workflowId,
    status: execution.finished ? (execution.stoppedAt ? 'failed' : 'success') : 'running',
    startedAt: execution.startedAt,
    stoppedAt: execution.stoppedAt,
    duration: execution.stoppedAt
      ? calculateDuration(execution.startedAt, execution.stoppedAt)
      : null
  };
}
```

### Get Execution Results

**Purpose**: Retrieve full execution results including node-by-node output

**API Endpoint**:
```typescript
// GET /rest/executions/:id
```

**Workflow**:
```typescript
async function getExecutionResults(executionId: string): Promise<ExecutionResult> {
  const response = await fetch(`http://localhost:5678/rest/executions/${executionId}`);
  const execution = await response.json();

  // Extract node results from execution data
  const nodeResults = Object.entries(execution.data.resultData.runData).map(([nodeName, runs]) => {
    const run = runs[0]; // First run
    return {
      nodeId: run.source[0]?.previousNode || nodeName,
      nodeName,
      output: run.data?.main?.[0]?.[0] || { json: {} },
      executionTime: run.executionTime ? `${run.executionTime}ms` : null
    };
  });

  return {
    executionId,
    workflowId: execution.workflowId,
    status: execution.finished ? (execution.stoppedAt ? 'failed' : 'success') : 'running',
    duration: execution.stoppedAt
      ? calculateDuration(execution.startedAt, execution.stoppedAt)
      : null,
    nodeResults,
    error: execution.data?.resultData?.error?.message || null
  };
}
```

## Example Workflows

### Example 1: Execute Simple Workflow (HTTP → Slack)

**Input**:
```typescript
{
  workflowId: "workflow-uuid-123",
  mode: "manual"
}
```

**Execution**:
```typescript
async function executeSimpleWorkflow() {
  // Step 1: Execute workflow
  console.log('Executing workflow: HTTP → Slack');
  const result = await executeWorkflowManual('workflow-uuid-123');

  // Step 2: Display results
  console.log(`✅ Execution completed in ${result.duration}`);
  console.log('Node Results:');

  result.nodeResults.forEach(node => {
    console.log(`- ${node.nodeName}: ${JSON.stringify(node.output.json)}`);
  });

  return result;
}
```

**Output**:
```typescript
{
  executionId: "exec-uuid-456",
  workflowId: "workflow-uuid-123",
  status: "success",
  duration: "2.5s",
  nodeResults: [
    {
      nodeId: "uuid-1",
      nodeName: "Manual Trigger",
      output: { json: {} },
      executionTime: "5ms"
    },
    {
      nodeId: "uuid-2",
      nodeName: "HTTP Request",
      output: {
        json: {
          users: [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" }
          ],
          count: 42
        }
      },
      executionTime: "1200ms"
    },
    {
      nodeId: "uuid-3",
      nodeName: "Slack",
      output: {
        json: {
          message: "42 users fetched from API",
          channelId: "C123456",
          ts: "1704067200.123456"
        }
      },
      executionTime: "800ms"
    }
  ]
}
```

### Example 2: Execute RAG Workflow (Vector Store + Documents)

**Input**:
```typescript
{
  workflowId: "workflow-uuid-456",
  mode: "manual"
}
```

**Execution**:
```typescript
async function executeRAGWorkflow() {
  // Step 1: Execute workflow
  console.log('Executing RAG workflow: Vector Store + Documents');
  const result = await executeWorkflowManual('workflow-uuid-456');

  // Step 2: Validate RAG pattern execution
  const vectorStoreNode = result.nodeResults.find(n => n.nodeName.includes('Vector Store'));
  const documentLoaderNode = result.nodeResults.find(n => n.nodeName.includes('Document Loader'));

  if (!vectorStoreNode || !documentLoaderNode) {
    throw new Error('RAG workflow missing required nodes');
  }

  // Step 3: Display results
  console.log(`✅ RAG workflow executed in ${result.duration}`);
  console.log(`Documents loaded: ${documentLoaderNode.output.json?.documents?.length || 0}`);
  console.log(`Embeddings created: ${vectorStoreNode.output.json?.embeddings?.length || 0}`);

  return result;
}
```

**Output**:
```typescript
{
  executionId: "exec-uuid-789",
  workflowId: "workflow-uuid-456",
  status: "success",
  duration: "4.2s",
  nodeResults: [
    {
      nodeId: "uuid-10",
      nodeName: "Manual Trigger",
      output: { json: {} },
      executionTime: "3ms"
    },
    {
      nodeId: "uuid-11",
      nodeName: "Document Loader",
      output: {
        json: {
          documents: [
            { pageContent: "Document 1 content", metadata: { source: "doc1.txt" } },
            { pageContent: "Document 2 content", metadata: { source: "doc2.txt" } }
          ]
        }
      },
      executionTime: "1500ms"
    },
    {
      nodeId: "uuid-12",
      nodeName: "Embeddings OpenAI",
      output: {
        json: {
          embeddings: [[0.1, 0.2, 0.3, ...], [0.4, 0.5, 0.6, ...]]
        }
      },
      executionTime: "2000ms"
    },
    {
      nodeId: "uuid-13",
      nodeName: "Vector Store",
      output: {
        json: {
          stored: 2,
          vectorStore: "pinecone",
          namespace: "documents"
        }
      },
      executionTime: "700ms"
    }
  ]
}
```

### Example 3: Execute AI Agent Workflow (Agent + Tools + Memory)

**Input**:
```typescript
{
  workflowId: "workflow-uuid-789",
  mode: "background"
}
```

**Execution**:
```typescript
async function executeAIAgentWorkflow() {
  // Step 1: Start background execution
  console.log('Starting AI Agent workflow in background');
  const execution = await executeWorkflowBackground('workflow-uuid-789');

  console.log(`✅ Execution started (ID: ${execution.executionId})`);
  console.log('Monitoring execution status...');

  // Step 2: Wait for completion (monitor handles this)
  const results = await waitForCompletion(execution.executionId);

  // Step 3: Display results
  console.log(`✅ AI Agent workflow completed in ${results.duration}`);
  console.log('Agent actions:');

  const agentNode = results.nodeResults.find(n => n.nodeName.includes('AI Agent'));
  if (agentNode) {
    console.log(`- Prompt: ${agentNode.output.json.prompt}`);
    console.log(`- Response: ${agentNode.output.json.response}`);
    console.log(`- Tools used: ${agentNode.output.json.toolsUsed?.join(', ') || 'none'}`);
  }

  return results;
}
```

**Output**:
```typescript
{
  executionId: "exec-uuid-012",
  workflowId: "workflow-uuid-789",
  status: "success",
  duration: "8.7s",
  nodeResults: [
    {
      nodeId: "uuid-20",
      nodeName: "Manual Trigger",
      output: { json: {} },
      executionTime: "2ms"
    },
    {
      nodeId: "uuid-21",
      nodeName: "AI Agent",
      output: {
        json: {
          prompt: "Find information about AI trends and summarize",
          response: "Based on recent data: AI adoption increased 47% in 2024...",
          toolsUsed: ["Web Search", "Calculator"],
          iterations: 3
        }
      },
      executionTime: "7500ms"
    },
    {
      nodeId: "uuid-22",
      nodeName: "Memory",
      output: {
        json: {
          stored: true,
          memoryKey: "ai-trends-2024",
          sessionId: "session-456"
        }
      },
      executionTime: "150ms"
    }
  ]
}
```

## Integration with Other Agents

### Workflow Orchestrator Integration

**Handoff Protocol**:
```typescript
// After workflow generation, orchestrator invokes execution specialist
const workflow = await workflowOrchestrator.generateWorkflow(userRequirements);

// Save workflow JSON
fs.writeFileSync('generated-workflow.json', JSON.stringify(workflow, null, 2));

// Execute for testing
const executionResult = await executionSpecialist.executeWorkflowFromFile('generated-workflow.json');

// Validate execution
if (executionResult.status !== 'success') {
  // Hand off to debugging specialist
  await debuggingSpecialist.debug(executionResult);
}
```

### Debugging Specialist Integration

**Error Capture for Debugging**:
```typescript
async function executeAndCaptureErrors(workflowId: string): Promise<ExecutionWithErrors> {
  const result = await executeWorkflowManual(workflowId);

  if (result.status === 'failed') {
    return {
      ...result,
      errorDetails: {
        type: classifyError(result.error),
        message: result.error,
        node: findFailedNode(result),
        fix: null // Will be filled by debugging specialist
      }
    };
  }

  return { ...result, errorDetails: null };
}
```

### Testing Specialist Integration

**Test Execution**:
```typescript
async function executeTestWorkflow(testCase: TestCase): Promise<TestResult> {
  // Execute workflow with test inputs
  const result = await executeWorkflowFromFile(testCase.workflowFile);

  // Validate output against expected results
  const passed = validateOutput(result, testCase.expectedOutput);

  return {
    testCaseId: testCase.id,
    executionId: result.executionId,
    passed,
    actualOutput: result.nodeResults,
    expectedOutput: testCase.expectedOutput,
    duration: result.duration
  };
}
```

## Performance Metrics

- **Execution Time**: 1-10 seconds for simple workflows, 5-60 seconds for complex
- **Monitoring Latency**: <1 second for status updates (background execution)
- **Result Parsing**: <500ms for log parsing and output extraction
- **API Response Time**: <200ms for activation/deactivation
- **Background Execution**: Non-blocking, asynchronous monitoring

## Error Handling

### Execution Errors

```typescript
async function handleExecutionError(error: ExecutionError): Promise<ErrorResolution> {
  // Classify error
  const errorType = classifyError(error);

  switch (errorType) {
    case 'workflow-not-found':
      return {
        severity: 'high',
        message: 'Workflow does not exist',
        fix: 'Import workflow or create new workflow'
      };

    case 'node-execution-failed':
      return {
        severity: 'high',
        message: `Node "${error.nodeName}" failed: ${error.message}`,
        fix: 'Check node parameters and credentials',
        delegateTo: 'debugging-specialist'
      };

    case 'timeout':
      return {
        severity: 'medium',
        message: 'Workflow execution timed out',
        fix: 'Increase execution timeout or optimize workflow'
      };

    case 'invalid-credentials':
      return {
        severity: 'high',
        message: 'Invalid or missing credentials',
        fix: 'Update credentials in n8n settings'
      };

    default:
      return {
        severity: 'unknown',
        message: error.message,
        fix: 'Manual investigation required'
      };
  }
}
```

### Activation Errors

```typescript
async function handleActivationError(error: ActivationError): Promise<ErrorResolution> {
  if (error.message.includes('webhook')) {
    return {
      severity: 'high',
      message: 'Webhook URL conflict or configuration error',
      fix: 'Check webhook settings and ensure URL is unique'
    };
  }

  if (error.message.includes('trigger')) {
    return {
      severity: 'high',
      message: 'Invalid trigger configuration',
      fix: 'Verify trigger node parameters (schedule, webhook URL, etc.)'
    };
  }

  return {
    severity: 'unknown',
    message: error.message,
    fix: 'Check n8n logs for detailed error information'
  };
}
```

## Quality Checks

### Pre-Execution Validation

```typescript
async function validateBeforeExecution(workflowId: string): Promise<ValidationResult> {
  // Check 1: Workflow exists
  const workflow = await getWorkflow(workflowId);
  if (!workflow) {
    return { passed: false, message: 'Workflow not found' };
  }

  // Check 2: Workflow has trigger
  const hasTrigger = workflow.nodes.some(n => n.type.includes('Trigger'));
  if (!hasTrigger) {
    return { passed: false, message: 'Workflow has no trigger node' };
  }

  // Check 3: All nodes are connected
  const orphanNodes = findOrphanNodes(workflow);
  if (orphanNodes.length > 0) {
    return {
      passed: false,
      message: `Orphan nodes detected: ${orphanNodes.map(n => n.name).join(', ')}`
    };
  }

  // Check 4: Credentials are valid (if required)
  const missingCreds = findMissingCredentials(workflow);
  if (missingCreds.length > 0) {
    return {
      passed: false,
      message: `Missing credentials for nodes: ${missingCreds.join(', ')}`
    };
  }

  return { passed: true, message: 'Pre-execution validation passed' };
}
```

### Post-Execution Validation

```typescript
async function validateAfterExecution(result: ExecutionResult): Promise<ValidationResult> {
  // Check 1: All nodes executed
  const expectedNodes = await getWorkflowNodes(result.workflowId);
  const executedNodes = result.nodeResults.map(n => n.nodeName);
  const missingNodes = expectedNodes.filter(n => !executedNodes.includes(n.name));

  if (missingNodes.length > 0) {
    return {
      passed: false,
      message: `Nodes did not execute: ${missingNodes.map(n => n.name).join(', ')}`
    };
  }

  // Check 2: No execution errors
  if (result.error) {
    return {
      passed: false,
      message: `Execution error: ${result.error}`
    };
  }

  // Check 3: All outputs are valid
  const invalidOutputs = result.nodeResults.filter(n => !n.output);
  if (invalidOutputs.length > 0) {
    return {
      passed: false,
      message: `Invalid outputs from nodes: ${invalidOutputs.map(n => n.nodeName).join(', ')}`
    };
  }

  return { passed: true, message: 'Post-execution validation passed' };
}
```

## Command Reference

### CLI Commands

```bash
# Execute workflow by ID
./packages/cli/bin/n8n execute --id=workflow-uuid

# Execute workflow from file
./packages/cli/bin/n8n execute --file=workflow.json

# Execute in background
./packages/cli/bin/n8n execute --id=workflow-uuid &

# List workflows
./packages/cli/bin/n8n list:workflow

# Export workflow
./packages/cli/bin/n8n export:workflow --id=workflow-uuid --output=workflow.json

# Import workflow
./packages/cli/bin/n8n import:workflow --input=workflow.json
```

### API Endpoints

```typescript
// Get workflow
GET /rest/workflows/:id

// Activate workflow
PATCH /rest/workflows/:id
{ "active": true }

// Deactivate workflow
PATCH /rest/workflows/:id
{ "active": false }

// Get execution status
GET /rest/executions/:id

// Get execution results
GET /rest/executions/:id
```

## TypeScript Interfaces

```typescript
interface ExecutionResult {
  executionId: string;
  workflowId: string;
  status: 'success' | 'failed' | 'running';
  duration: string | null;
  nodeResults: NodeResult[];
  error?: string;
}

interface NodeResult {
  nodeId: string;
  nodeName: string;
  output: { json: any };
  executionTime: string | null;
}

interface BackgroundExecution {
  executionId: string;
  workflowId: string;
  processId: number;
  status: 'running' | 'success' | 'failed';
  monitor: NodeJS.Timeout;
}

interface ActivationResult {
  workflowId: string;
  active: boolean;
  triggerType: string;
  webhookUrl?: string;
  message: string;
}

interface ExecutionStatus {
  executionId: string;
  workflowId: string;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  stoppedAt: string | null;
  duration: string | null;
}

interface ValidationResult {
  passed: boolean;
  message: string;
}
```
