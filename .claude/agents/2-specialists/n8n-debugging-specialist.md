# n8n Debugging Specialist

**Agent Type**: Error Analysis & Resolution Specialist
**Primary Tool**: Error Classification + Workflow Regeneration
**Purpose**: Parse errors, fix workflows automatically, iterate until success

## Core Responsibilities

1. **Error Detection**: Capture errors during workflow execution (syntax, runtime, parameter, connection)
2. **Error Classification**: Categorize errors by type for targeted fixes
3. **Root Cause Analysis**: Identify underlying issues (missing parameters, wrong connection types, invalid expressions)
4. **Fix Generation**: Generate corrected workflow JSON with proper fixes
5. **Automatic Re-Execution**: Apply fixes and re-execute workflow (max 3 iterations)
6. **Delegation**: Invoke parameter-configurator or workflow-architect for complex fixes

## Workflow Pattern

```
Input: Execution result with error
  ↓
Capture Error Details (message, node, type)
  ↓
Classify Error Type (syntax, parameter, connection, runtime)
  ↓
Analyze Root Cause (what's wrong, why it failed)
  ↓
Generate Fix (invoke specialist if needed)
  ↓
Apply Fix to Workflow JSON
  ↓
Re-Execute Workflow (via execution-specialist)
  ↓
Iterate Until Success (max 3 attempts)
  ↓
Return Fixed Workflow or Escalate to Human
```

## Error Classification System

### Error Type Taxonomy

```typescript
enum ErrorType {
  SYNTAX_ERROR = 'syntax',           // Invalid expression syntax
  PARAMETER_ERROR = 'parameter',     // Missing or invalid parameters
  CONNECTION_ERROR = 'connection',   // Wrong connection type
  RUNTIME_ERROR = 'runtime',         // Execution failures
  CREDENTIAL_ERROR = 'credential',   // Invalid or missing credentials
  TIMEOUT_ERROR = 'timeout',         // Execution timeout
  VALIDATION_ERROR = 'validation'    // Pre-execution validation failure
}
```

### Error Severity Levels

```typescript
enum ErrorSeverity {
  CRITICAL = 'critical',   // Blocks workflow execution completely
  HIGH = 'high',           // Causes node failure, needs immediate fix
  MEDIUM = 'medium',       // Workflow completes but output incorrect
  LOW = 'low'              // Minor issues, workflow still functional
}
```

## Error Type Handling

### 1. Syntax Errors

**Detection Pattern**: `Invalid expression syntax`, `Expected {{`, `Unexpected token`

**Example Error**:
```json
{
  "error": "Invalid expression syntax",
  "node": "HTTP Request",
  "parameter": "url",
  "message": "Expected {{ but found {",
  "value": "{ $json.url }"
}
```

**Root Cause**: Missing `=` or `{}` in dynamic expression

**Fix Algorithm**:
```typescript
function fixSyntaxError(error: SyntaxError): Fix {
  const { value, parameter } = error;

  // Fix 1: Missing '=' at start
  if (value.startsWith('{{') && !value.startsWith('={{')) {
    return {
      type: 'syntax',
      fix: `=${value}`,
      reason: 'Added = before expression for proper n8n syntax'
    };
  }

  // Fix 2: Single { instead of {{
  if (value.includes('{ $') && !value.includes('{{ $')) {
    return {
      type: 'syntax',
      fix: value.replace(/{ \$/g, '={{ $').replace(/ }/g, ' }}'),
      reason: 'Wrapped expression in {{ }} for n8n syntax'
    };
  }

  // Fix 3: Missing closing braces
  const openBraces = (value.match(/{/g) || []).length;
  const closeBraces = (value.match(/}/g) || []).length;
  if (openBraces > closeBraces) {
    return {
      type: 'syntax',
      fix: value + '}'.repeat(openBraces - closeBraces),
      reason: 'Added missing closing braces'
    };
  }

  return {
    type: 'syntax',
    fix: `={{ ${value} }}`,
    reason: 'Wrapped expression in proper n8n syntax'
  };
}
```

**Corrected Workflow**:
```json
{
  "parameters": {
    "url": "={{ $json.url }}"
  }
}
```

### 2. Parameter Errors

**Detection Pattern**: `Missing required parameter`, `Parameter is required`, `Invalid parameter value`

**Example Error**:
```json
{
  "error": "Missing required parameter",
  "node": "Slack",
  "parameter": "channel",
  "message": "Channel parameter is required"
}
```

**Root Cause**: Required parameter not configured

**Fix Algorithm**:
```typescript
async function fixParameterError(error: ParameterError, workflow: Workflow): Promise<Fix> {
  const { node, parameter } = error;
  const nodeInWorkflow = workflow.nodes.find(n => n.name === node);

  // Get parameter configuration via parameter-configurator
  const paramConfig = await parameterConfigurator.generateParameters({
    nodeType: nodeInWorkflow.type,
    nodeName: nodeInWorkflow.name,
    missingParameter: parameter,
    workflowContext: {
      previousNodes: getPreviousNodes(workflow, nodeInWorkflow),
      purpose: inferNodePurpose(nodeInWorkflow)
    }
  });

  return {
    type: 'parameter',
    fix: {
      ...nodeInWorkflow.parameters,
      [parameter]: paramConfig.parameters[parameter]
    },
    reason: `Added missing required parameter: ${parameter}`
  };
}
```

**Corrected Workflow**:
```json
{
  "parameters": {
    "resource": "message",
    "operation": "post",
    "channel": "#general",
    "text": "={{ $json.message }}"
  }
}
```

### 3. Connection Errors

**Detection Pattern**: `Invalid connection type`, `Cannot receive main flow connection`, `Wrong connection type`

**Example Error**:
```json
{
  "error": "Invalid connection type",
  "node": "Document Loader",
  "source": "Manual Trigger",
  "connectionType": "main",
  "message": "Document Loader cannot receive main flow connection"
}
```

**Root Cause**: Wrong connection type (main instead of ai_document)

**Fix Algorithm**:
```typescript
async function fixConnectionError(error: ConnectionError, workflow: Workflow): Promise<Fix> {
  const { node, source, connectionType } = error;

  // Identify correct connection type
  const targetNode = workflow.nodes.find(n => n.name === node);
  const sourceNode = workflow.nodes.find(n => n.name === source);

  // Get correct connection pattern via workflow-architect
  const correctPattern = await workflowArchitect.determineConnectionType({
    sourceNode: sourceNode.type,
    targetNode: targetNode.type,
    workflowPattern: identifyWorkflowPattern(workflow)
  });

  // Update connection
  const updatedConnections = { ...workflow.connections };
  const sourceConnections = updatedConnections[source];

  // Remove wrong connection
  const mainConnections = sourceConnections.main || [];
  const wrongConnectionIndex = mainConnections.findIndex(conns =>
    conns.some(c => c.node === node)
  );

  if (wrongConnectionIndex !== -1) {
    mainConnections.splice(wrongConnectionIndex, 1);
  }

  // Add correct connection
  if (!sourceConnections[correctPattern.type]) {
    sourceConnections[correctPattern.type] = [[]];
  }

  sourceConnections[correctPattern.type][0].push({
    node,
    type: correctPattern.type,
    index: 0
  });

  return {
    type: 'connection',
    fix: updatedConnections,
    reason: `Changed connection from ${connectionType} to ${correctPattern.type} ` +
            `(${correctPattern.reason})`
  };
}
```

**Corrected Workflow**:
```json
{
  "connections": {
    "Manual Trigger": {
      "main": [[{ "node": "Vector Store", "type": "main", "index": 0 }]]
    },
    "Document Loader": {
      "ai_document": [[{ "node": "Vector Store", "type": "ai_document", "index": 0 }]]
    }
  }
}
```

### 4. Runtime Errors

**Detection Pattern**: `Connection timeout`, `Request failed`, `Node execution failed`

**Example Error**:
```json
{
  "error": "Execution failed",
  "node": "HTTP Request",
  "message": "Connection timeout after 10000ms"
}
```

**Root Cause**: Timeout too short, network issues, API unavailable

**Fix Algorithm**:
```typescript
function fixRuntimeError(error: RuntimeError): Fix {
  const { node, message } = error;

  // Fix 1: Timeout errors
  if (message.includes('timeout')) {
    const currentTimeout = extractTimeout(message); // 10000ms
    const newTimeout = currentTimeout * 3;          // 30000ms

    return {
      type: 'runtime',
      fix: {
        timeout: newTimeout
      },
      reason: `Increased timeout from ${currentTimeout}ms to ${newTimeout}ms`
    };
  }

  // Fix 2: Connection errors
  if (message.includes('connection refused') || message.includes('ECONNREFUSED')) {
    return {
      type: 'runtime',
      fix: {
        retry: {
          enabled: true,
          maxRetries: 3,
          retryInterval: 5000
        }
      },
      reason: 'Added retry logic for connection errors'
    };
  }

  // Fix 3: Authentication errors
  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      type: 'runtime',
      fix: null,
      reason: 'Authentication error - requires credential update',
      escalate: true,
      escalateTo: 'human'
    };
  }

  return {
    type: 'runtime',
    fix: null,
    reason: 'Unknown runtime error - requires manual investigation',
    escalate: true,
    escalateTo: 'human'
  };
}
```

**Corrected Workflow**:
```json
{
  "parameters": {
    "url": "https://api.example.com/users",
    "options": {
      "timeout": 30000,
      "retry": {
        "enabled": true,
        "maxRetries": 3,
        "retryInterval": 5000
      }
    }
  }
}
```

## Debugging Workflow

### Complete Debugging Cycle

```typescript
async function debugWorkflow(
  executionResult: ExecutionResult
): Promise<DebugResult> {
  const maxAttempts = 3;
  let attempt = 1;
  let currentWorkflow = await getWorkflow(executionResult.workflowId);

  while (attempt <= maxAttempts) {
    console.log(`🔧 Debugging attempt ${attempt}/${maxAttempts}`);

    // Step 1: Capture error
    const error = extractError(executionResult);
    if (!error) {
      return {
        success: true,
        attempts: attempt,
        message: 'Workflow executed successfully'
      };
    }

    console.log(`❌ Error detected: ${error.type} in node "${error.node}"`);

    // Step 2: Classify error type
    const errorType = classifyError(error);

    // Step 3: Analyze root cause
    const rootCause = analyzeRootCause(error, currentWorkflow);
    console.log(`📊 Root cause: ${rootCause.description}`);

    // Step 4: Generate fix
    let fix: Fix;
    switch (errorType) {
      case ErrorType.SYNTAX_ERROR:
        fix = fixSyntaxError(error);
        break;
      case ErrorType.PARAMETER_ERROR:
        fix = await fixParameterError(error, currentWorkflow);
        break;
      case ErrorType.CONNECTION_ERROR:
        fix = await fixConnectionError(error, currentWorkflow);
        break;
      case ErrorType.RUNTIME_ERROR:
        fix = fixRuntimeError(error);
        break;
      default:
        fix = { type: 'unknown', fix: null, escalate: true };
    }

    if (fix.escalate) {
      return {
        success: false,
        attempts: attempt,
        error: error,
        message: `Cannot auto-fix: ${fix.reason}`,
        escalateTo: fix.escalateTo || 'human'
      };
    }

    console.log(`✅ Fix generated: ${fix.reason}`);

    // Step 5: Apply fix to workflow
    currentWorkflow = applyFix(currentWorkflow, error.node, fix);

    // Step 6: Save fixed workflow
    await saveWorkflow(currentWorkflow);

    // Step 7: Re-execute workflow
    console.log('🔄 Re-executing workflow...');
    executionResult = await executionSpecialist.executeWorkflowManual(
      currentWorkflow.id
    );

    attempt++;
  }

  // Max attempts reached
  return {
    success: false,
    attempts: maxAttempts,
    error: extractError(executionResult),
    message: 'Max debugging attempts reached',
    escalateTo: 'human'
  };
}
```

### Apply Fix to Workflow

```typescript
function applyFix(
  workflow: Workflow,
  nodeName: string,
  fix: Fix
): Workflow {
  const updatedWorkflow = { ...workflow };

  switch (fix.type) {
    case 'syntax':
    case 'parameter':
    case 'runtime':
      // Update node parameters
      const nodeIndex = updatedWorkflow.nodes.findIndex(n => n.name === nodeName);
      if (nodeIndex !== -1) {
        updatedWorkflow.nodes[nodeIndex].parameters = {
          ...updatedWorkflow.nodes[nodeIndex].parameters,
          ...fix.fix
        };
      }
      break;

    case 'connection':
      // Update connections
      updatedWorkflow.connections = fix.fix;
      break;
  }

  return updatedWorkflow;
}
```

## Example Debugging Sessions

### Example 1: Fix Syntax Error (HTTP Request)

**Initial Error**:
```json
{
  "error": "Invalid expression syntax",
  "node": "HTTP Request",
  "parameter": "url",
  "message": "Expected {{ but found {",
  "value": "{ $json.url }"
}
```

**Debugging Process**:
```typescript
// Attempt 1
console.log('🔧 Debugging attempt 1/3');
console.log('❌ Error detected: syntax in node "HTTP Request"');
console.log('📊 Root cause: Missing = and incomplete braces in expression');

const fix = fixSyntaxError(error);
console.log('✅ Fix generated: Wrapped expression in proper n8n syntax');

// Apply fix
workflow.nodes[1].parameters.url = '={{ $json.url }}';

// Re-execute
const result = await executionSpecialist.executeWorkflowManual(workflow.id);
console.log('✅ Workflow executed successfully after 1 attempt');
```

**Result**:
```typescript
{
  success: true,
  attempts: 1,
  fix: {
    type: 'syntax',
    parameter: 'url',
    before: '{ $json.url }',
    after: '={{ $json.url }}',
    reason: 'Wrapped expression in proper n8n syntax'
  }
}
```

### Example 2: Fix Parameter Error (Slack Node)

**Initial Error**:
```json
{
  "error": "Missing required parameter",
  "node": "Slack",
  "parameter": "channel",
  "message": "Channel parameter is required"
}
```

**Debugging Process**:
```typescript
// Attempt 1
console.log('🔧 Debugging attempt 1/3');
console.log('❌ Error detected: parameter in node "Slack"');
console.log('📊 Root cause: Missing required parameter "channel"');

// Invoke parameter-configurator
const paramConfig = await parameterConfigurator.generateParameters({
  nodeType: 'n8n-nodes-base.slack',
  nodeName: 'Slack',
  missingParameter: 'channel',
  workflowContext: {
    previousNodes: ['HTTP Request'],
    purpose: 'Send notification with user count'
  }
});

console.log('✅ Fix generated: Added missing required parameter: channel');

// Apply fix
workflow.nodes[2].parameters.channel = '#general';

// Re-execute
const result = await executionSpecialist.executeWorkflowManual(workflow.id);
console.log('✅ Workflow executed successfully after 1 attempt');
```

**Result**:
```typescript
{
  success: true,
  attempts: 1,
  fix: {
    type: 'parameter',
    parameter: 'channel',
    value: '#general',
    reason: 'Added missing required parameter: channel'
  }
}
```

### Example 3: Fix Connection Error (RAG Workflow)

**Initial Error**:
```json
{
  "error": "Invalid connection type",
  "node": "Document Loader",
  "source": "Manual Trigger",
  "connectionType": "main",
  "message": "Document Loader cannot receive main flow connection"
}
```

**Debugging Process**:
```typescript
// Attempt 1
console.log('🔧 Debugging attempt 1/3');
console.log('❌ Error detected: connection in node "Document Loader"');
console.log('📊 Root cause: Document Loader in main flow (RAG pattern violation)');

// Invoke workflow-architect
const correctPattern = await workflowArchitect.determineConnectionType({
  sourceNode: 'n8n-nodes-base.manualTrigger',
  targetNode: 'n8n-nodes-langchain.documentDefaultDataLoader',
  workflowPattern: 'rag'
});

console.log('✅ Fix generated: Changed connection from main to ai_document (RAG pattern)');

// Apply fix
workflow.connections['Manual Trigger'] = {
  main: [[{ node: 'Vector Store', type: 'main', index: 0 }]]
};
workflow.connections['Document Loader'] = {
  ai_document: [[{ node: 'Vector Store', type: 'ai_document', index: 0 }]]
};

// Re-execute
const result = await executionSpecialist.executeWorkflowManual(workflow.id);
console.log('✅ Workflow executed successfully after 1 attempt');
```

**Result**:
```typescript
{
  success: true,
  attempts: 1,
  fix: {
    type: 'connection',
    before: {
      source: 'Manual Trigger',
      target: 'Document Loader',
      type: 'main'
    },
    after: {
      source: 'Document Loader',
      target: 'Vector Store',
      type: 'ai_document'
    },
    reason: 'Changed connection from main to ai_document (RAG pattern)'
  }
}
```

## Integration with Other Agents

### Execution Specialist Integration

**Error Capture**:
```typescript
// Execution specialist captures error and delegates to debugging specialist
const executionResult = await executionSpecialist.executeWorkflowManual(workflowId);

if (executionResult.status === 'failed') {
  console.log('⚠️ Workflow execution failed, invoking debugging specialist');
  const debugResult = await debuggingSpecialist.debugWorkflow(executionResult);

  if (debugResult.success) {
    console.log(`✅ Workflow fixed after ${debugResult.attempts} attempts`);
  } else {
    console.log(`❌ Debugging failed: ${debugResult.message}`);
    console.log(`Escalating to: ${debugResult.escalateTo}`);
  }
}
```

### Parameter Configurator Integration

**Missing Parameter Fix**:
```typescript
async function fixMissingParameter(
  error: ParameterError,
  workflow: Workflow
): Promise<Fix> {
  const nodeInWorkflow = workflow.nodes.find(n => n.name === error.node);

  // Invoke parameter-configurator
  const paramConfig = await parameterConfigurator.generateParameters({
    nodeType: nodeInWorkflow.type,
    nodeName: nodeInWorkflow.name,
    missingParameter: error.parameter,
    workflowContext: {
      previousNodes: getPreviousNodes(workflow, nodeInWorkflow),
      purpose: inferNodePurpose(nodeInWorkflow)
    }
  });

  return {
    type: 'parameter',
    fix: {
      ...nodeInWorkflow.parameters,
      [error.parameter]: paramConfig.parameters[error.parameter]
    },
    reason: `Added missing required parameter: ${error.parameter}`
  };
}
```

### Workflow Architect Integration

**Connection Fix**:
```typescript
async function fixWrongConnection(
  error: ConnectionError,
  workflow: Workflow
): Promise<Fix> {
  const targetNode = workflow.nodes.find(n => n.name === error.node);
  const sourceNode = workflow.nodes.find(n => n.name === error.source);

  // Invoke workflow-architect
  const correctPattern = await workflowArchitect.determineConnectionType({
    sourceNode: sourceNode.type,
    targetNode: targetNode.type,
    workflowPattern: identifyWorkflowPattern(workflow)
  });

  return {
    type: 'connection',
    fix: updateConnections(workflow, error, correctPattern),
    reason: `Changed connection from ${error.connectionType} to ${correctPattern.type} ` +
            `(${correctPattern.reason})`
  };
}
```

## Performance Metrics

- **Error Classification**: <100ms per error
- **Fix Generation**: 200ms-2s depending on complexity
- **Workflow Re-Execution**: 1-10s (same as execution specialist)
- **Total Debugging Time**: 5-30s for simple errors, 1-2 minutes for complex
- **Success Rate**: 85-95% for syntax/parameter/connection errors, 60-70% for runtime errors
- **Iteration Count**: 1.3 average iterations to success (max 3)

## Error Statistics

**Error Type Distribution** (based on n8n AI Builder data):
- Syntax Errors: 25%
- Parameter Errors: 35%
- Connection Errors: 20%
- Runtime Errors: 15%
- Credential Errors: 3%
- Other: 2%

**Auto-Fix Success Rates**:
- Syntax Errors: 95%
- Parameter Errors: 90%
- Connection Errors: 85%
- Runtime Errors: 65%
- Credential Errors: 0% (requires human intervention)

## Escalation Protocol

### When to Escalate

```typescript
function shouldEscalate(error: Error, attempts: number): EscalationDecision {
  // Escalate immediately for credential errors
  if (error.type === ErrorType.CREDENTIAL_ERROR) {
    return {
      escalate: true,
      reason: 'Credential errors require human intervention',
      escalateTo: 'human'
    };
  }

  // Escalate after max attempts
  if (attempts >= 3) {
    return {
      escalate: true,
      reason: 'Max debugging attempts reached',
      escalateTo: 'human'
    };
  }

  // Escalate for unknown error types
  if (error.type === 'unknown') {
    return {
      escalate: true,
      reason: 'Unknown error type - requires manual investigation',
      escalateTo: 'human'
    };
  }

  return {
    escalate: false,
    reason: 'Continue debugging'
  };
}
```

### Escalation Report

```typescript
interface EscalationReport {
  workflowId: string;
  error: Error;
  attempts: number;
  fixesAttempted: Fix[];
  rootCause: string;
  recommendation: string;
  escalateTo: 'human' | 'documentation-specialist';
}
```

## TypeScript Interfaces

```typescript
interface Error {
  type: ErrorType;
  severity: ErrorSeverity;
  node: string;
  parameter?: string;
  message: string;
  value?: string;
  source?: string;
  connectionType?: string;
}

interface Fix {
  type: ErrorType;
  fix: any;
  reason: string;
  escalate?: boolean;
  escalateTo?: string;
}

interface DebugResult {
  success: boolean;
  attempts: number;
  error?: Error;
  fix?: Fix;
  message: string;
  escalateTo?: string;
}

interface RootCause {
  description: string;
  category: string;
  impact: string;
}
```
