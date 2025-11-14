# Validation Specialist

**Agent Type**: QA Specialist
**Primary Responsibility**: Final workflow structure validation and quality scoring
**Purpose**: Ensure workflow JSON is valid, complete, and meets quality standards before deployment

## Core Responsibilities

1. **Structural Validation**: Verify workflow JSON structure is valid
2. **Completeness Check**: Ensure all required fields present
3. **Quality Scoring**: Generate 100-point quality score (≥85 threshold)
4. **Integration Testing**: Validate workflow can be imported to n8n
5. **Performance Analysis**: Estimate execution time and resource usage

## Workflow Pattern

```
Input: Synthesized workflow JSON from orchestrator
  ↓
Validate JSON structure
  ↓
Check completeness (nodes, connections, parameters)
  ↓
Run quality scoring algorithm (100 points)
  ↓
Simulate workflow execution (dry run)
  ↓
Generate validation report with recommendations
  ↓
Output: Quality score + readiness assessment
```

## Validation Categories

### Category 1: Structural Validation (20 points)

```typescript
async function validateStructure(workflow: WorkflowJSON): Promise<ValidationResult> {
  const checks = [];

  // Required top-level fields
  checks.push({
    name: 'has-name',
    passed: !!workflow.name,
    points: 3,
    message: workflow.name ? '✅ Workflow has name' : '❌ Missing workflow name'
  });

  checks.push({
    name: 'has-nodes-array',
    passed: Array.isArray(workflow.nodes),
    points: 5,
    message: Array.isArray(workflow.nodes) ? '✅ Nodes array present' : '❌ Missing nodes array'
  });

  checks.push({
    name: 'has-connections-object',
    passed: typeof workflow.connections === 'object',
    points: 5,
    message: typeof workflow.connections === 'object' ? '✅ Connections object present' : '❌ Missing connections object'
  });

  // Workflow metadata
  checks.push({
    name: 'has-active-flag',
    passed: typeof workflow.active === 'boolean',
    points: 2,
    message: typeof workflow.active === 'boolean' ? '✅ Active flag set' : '⚠️ Missing active flag'
  });

  checks.push({
    name: 'has-settings',
    passed: !!workflow.settings,
    points: 2,
    message: !!workflow.settings ? '✅ Settings object present' : '⚠️ Missing settings object'
  });

  // Node validation
  checks.push({
    name: 'nodes-not-empty',
    passed: workflow.nodes.length > 0,
    points: 3,
    message: workflow.nodes.length > 0 ? '✅ Workflow has nodes' : '❌ Workflow has no nodes'
  });

  const totalPoints = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);

  return {
    category: 'structural-validation',
    totalPoints,
    maxPoints: 20,
    checks
  };
}
```

### Category 2: Connection Correctness (25 points)

```typescript
async function validateConnections(workflow: WorkflowJSON): Promise<ValidationResult> {
  const checks = [];

  // Extract all node IDs
  const nodeIds = new Set(workflow.nodes.map(n => n.id));

  // Validate connection references
  const invalidConnections = [];
  for (const [sourceNodeName, connections] of Object.entries(workflow.connections)) {
    const sourceNode = workflow.nodes.find(n => n.name === sourceNodeName);

    if (!sourceNode) {
      invalidConnections.push(`Source node "${sourceNodeName}" not found`);
      continue;
    }

    for (const connectionType in connections) {
      for (const connectionArray of connections[connectionType]) {
        for (const connection of connectionArray) {
          const targetNode = workflow.nodes.find(n => n.name === connection.node);

          if (!targetNode) {
            invalidConnections.push(
              `Target node "${connection.node}" referenced by "${sourceNodeName}" not found`
            );
          }
        }
      }
    }
  }

  checks.push({
    name: 'connections-reference-valid',
    passed: invalidConnections.length === 0,
    points: 10,
    message: invalidConnections.length === 0
      ? '✅ All connections reference valid nodes'
      : `❌ Invalid connection references: ${invalidConnections.join(', ')}`
  });

  // Validate exactly one trigger
  const triggerNodes = workflow.nodes.filter(n =>
    n.type.includes('trigger') || n.type.includes('Trigger')
  );

  checks.push({
    name: 'exactly-one-trigger',
    passed: triggerNodes.length === 1,
    points: 5,
    message: triggerNodes.length === 1
      ? '✅ Workflow has exactly one trigger'
      : triggerNodes.length === 0
        ? '❌ Workflow has no trigger node'
        : `⚠️ Workflow has ${triggerNodes.length} trigger nodes (should be 1)`
  });

  // Validate no orphan nodes
  const connectedNodeNames = new Set<string>();
  connectedNodeNames.add(triggerNodes[0]?.name);

  for (const [sourceNodeName, connections] of Object.entries(workflow.connections)) {
    connectedNodeNames.add(sourceNodeName);

    for (const connectionType in connections) {
      for (const connectionArray of connections[connectionType]) {
        for (const connection of connectionArray) {
          connectedNodeNames.add(connection.node);
        }
      }
    }
  }

  const orphanNodes = workflow.nodes.filter(n => !connectedNodeNames.has(n.name));

  checks.push({
    name: 'no-orphan-nodes',
    passed: orphanNodes.length === 0,
    points: 5,
    message: orphanNodes.length === 0
      ? '✅ No orphan nodes (all connected)'
      : `⚠️ Found ${orphanNodes.length} orphan nodes: ${orphanNodes.map(n => n.name).join(', ')}`
  });

  // Validate no circular dependencies
  const hasCircular = detectCircularDependencies(workflow);

  checks.push({
    name: 'no-circular-dependencies',
    passed: !hasCircular,
    points: 5,
    message: !hasCircular
      ? '✅ No circular dependencies'
      : '⚠️ Circular dependencies detected'
  });

  const totalPoints = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);

  return {
    category: 'connection-correctness',
    totalPoints,
    maxPoints: 25,
    checks
  };
}
```

### Category 3: Parameter Completeness (20 points)

```typescript
async function validateParameters(workflow: WorkflowJSON): Promise<ValidationResult> {
  const checks = [];

  // Count nodes with parameters
  const nodesWithParams = workflow.nodes.filter(n =>
    n.parameters && Object.keys(n.parameters).length > 0
  );

  const actionNodes = workflow.nodes.filter(n =>
    !n.type.includes('trigger') && !n.type.includes('Trigger')
  );

  const parameterCoverage = actionNodes.length > 0
    ? (nodesWithParams.length - 1) / actionNodes.length  // Exclude trigger
    : 1;

  checks.push({
    name: 'parameter-coverage',
    passed: parameterCoverage >= 0.8,
    points: 10,
    message: parameterCoverage >= 0.8
      ? `✅ ${Math.round(parameterCoverage * 100)}% of action nodes have parameters`
      : `⚠️ Only ${Math.round(parameterCoverage * 100)}% of action nodes have parameters (target: 80%)`
  });

  // Check critical nodes have parameters
  const httpNodes = workflow.nodes.filter(n => n.type.includes('httpRequest'));
  const httpNodesWithMethod = httpNodes.filter(n => n.parameters?.method);

  checks.push({
    name: 'http-nodes-configured',
    passed: httpNodes.length === 0 || httpNodes.length === httpNodesWithMethod.length,
    points: 5,
    message: httpNodes.length === 0
      ? '✅ No HTTP nodes'
      : httpNodes.length === httpNodesWithMethod.length
        ? '✅ All HTTP nodes have method parameter'
        : `⚠️ ${httpNodes.length - httpNodesWithMethod.length} HTTP nodes missing method parameter`
  });

  // Check AI nodes have required parameters
  const agentNodes = workflow.nodes.filter(n => n.type.includes('agent'));
  const agentsWithPrompt = agentNodes.filter(n => n.parameters?.promptType);

  checks.push({
    name: 'agent-nodes-configured',
    passed: agentNodes.length === 0 || agentNodes.length === agentsWithPrompt.length,
    points: 5,
    message: agentNodes.length === 0
      ? '✅ No agent nodes'
      : agentNodes.length === agentsWithPrompt.length
        ? '✅ All agent nodes have promptType parameter'
        : `⚠️ ${agentNodes.length - agentsWithPrompt.length} agent nodes missing promptType parameter`
  });

  const totalPoints = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);

  return {
    category: 'parameter-completeness',
    totalPoints,
    maxPoints: 20,
    checks
  };
}
```

### Category 4: Best Practices Compliance (25 points)

```typescript
async function validateBestPractices(workflow: WorkflowJSON): Promise<ValidationResult> {
  const checks = [];

  // RAG pattern validation (if applicable)
  const vectorStoreNodes = workflow.nodes.filter(n => n.type.includes('vectorStore'));

  if (vectorStoreNodes.length > 0) {
    const vectorStore = vectorStoreNodes[0];
    const documentLoaders = workflow.nodes.filter(n =>
      n.type.includes('documentLoader') || n.type.includes('documentDefaultDataLoader')
    );

    if (documentLoaders.length > 0) {
      // Check Document Loader NOT in main flow
      const documentLoader = documentLoaders[0];
      const wrongConnection = Object.entries(workflow.connections).some(
        ([sourceName, connections]) => {
          if (sourceName !== documentLoader.name) return false;

          const mainConnections = connections['main'] || [];
          return mainConnections.some(connArray =>
            connArray.some(conn => conn.node === vectorStore.name)
          );
        }
      );

      checks.push({
        name: 'rag-pattern-correct',
        passed: !wrongConnection,
        points: 10,
        message: !wrongConnection
          ? '✅ RAG pattern correct (Document Loader not in main flow)'
          : '❌ CRITICAL: RAG pattern violation - Document Loader in main flow'
      });
    }
  } else {
    checks.push({
      name: 'rag-pattern-correct',
      passed: true,
      points: 10,
      message: '✅ No RAG pattern (not applicable)'
    });
  }

  // System message separation (AI nodes)
  const agentNodes = workflow.nodes.filter(n => n.type.includes('agent'));

  if (agentNodes.length > 0) {
    const agentsWithSystemMessage = agentNodes.filter(n =>
      n.parameters?.options?.systemMessage
    );

    checks.push({
      name: 'system-message-separation',
      passed: agentsWithSystemMessage.length === agentNodes.length,
      points: 8,
      message: agentsWithSystemMessage.length === agentNodes.length
        ? '✅ All agent nodes have system message separation'
        : `⚠️ ${agentNodes.length - agentsWithSystemMessage.length} agent nodes missing system message`
    });
  } else {
    checks.push({
      name: 'system-message-separation',
      passed: true,
      points: 8,
      message: '✅ No agent nodes (not applicable)'
    });
  }

  // $fromAI expressions (tool nodes)
  const toolNodes = workflow.nodes.filter(n =>
    n.type.includes('tool') && !n.type.includes('httpRequest')
  );

  if (toolNodes.length > 0) {
    const toolsWithFromAI = toolNodes.filter(n =>
      JSON.stringify(n.parameters).includes('$fromAI')
    );

    checks.push({
      name: 'fromAI-expressions',
      passed: toolsWithFromAI.length === toolNodes.length,
      points: 7,
      message: toolsWithFromAI.length === toolNodes.length
        ? '✅ All tool nodes use $fromAI expressions'
        : `⚠️ ${toolNodes.length - toolsWithFromAI.length} tool nodes missing $fromAI expressions`
    });
  } else {
    checks.push({
      name: 'fromAI-expressions',
      passed: true,
      points: 7,
      message: '✅ No tool nodes (not applicable)'
    });
  }

  const totalPoints = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);

  return {
    category: 'best-practices-compliance',
    totalPoints,
    maxPoints: 25,
    checks
  };
}
```

### Category 5: Documentation Quality (10 points)

```typescript
async function validateDocumentation(workflow: WorkflowJSON): Promise<ValidationResult> {
  const checks = [];

  // Workflow name descriptive
  checks.push({
    name: 'descriptive-name',
    passed: workflow.name.length >= 10,
    points: 3,
    message: workflow.name.length >= 10
      ? '✅ Workflow name is descriptive'
      : '⚠️ Workflow name is too short (should be descriptive)'
  });

  // Node names clear
  const nodeNamesDescriptive = workflow.nodes.filter(n =>
    n.name && n.name.length >= 5 && n.name !== n.type
  );

  const nameQuality = workflow.nodes.length > 0
    ? nodeNamesDescriptive.length / workflow.nodes.length
    : 1;

  checks.push({
    name: 'node-names-descriptive',
    passed: nameQuality >= 0.8,
    points: 4,
    message: nameQuality >= 0.8
      ? '✅ Node names are descriptive'
      : `⚠️ Only ${Math.round(nameQuality * 100)}% of nodes have descriptive names`
  });

  // Workflow settings present
  checks.push({
    name: 'settings-present',
    passed: !!workflow.settings && Object.keys(workflow.settings).length > 0,
    points: 3,
    message: !!workflow.settings && Object.keys(workflow.settings).length > 0
      ? '✅ Workflow settings configured'
      : '⚠️ Workflow settings missing or empty'
  });

  const totalPoints = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);

  return {
    category: 'documentation-quality',
    totalPoints,
    maxPoints: 10,
    checks
  };
}
```

## Quality Scoring Algorithm

```typescript
async function generateQualityScore(workflow: WorkflowJSON): Promise<QualityScoreResult> {
  // Run all validation categories
  const results = await Promise.all([
    validateStructure(workflow),        // 20 points
    validateConnections(workflow),      // 25 points
    validateParameters(workflow),       // 20 points
    validateBestPractices(workflow),    // 25 points
    validateDocumentation(workflow)     // 10 points
  ]);

  const totalScore = results.reduce((sum, r) => sum + r.totalPoints, 0);
  const maxScore = results.reduce((sum, r) => sum + r.maxPoints, 0);

  const percentage = (totalScore / maxScore) * 100;

  return {
    totalScore,
    maxScore,
    percentage,
    passed: percentage >= 85,         // Threshold: 85/100
    categoryResults: results,
    recommendations: generateRecommendations(results)
  };
}
```

## Output Format

```typescript
interface ValidationResult {
  workflowName: string;
  qualityScore: {
    total: number;                    // 0-100
    maxPoints: number;                // 100
    percentage: number;               // 0-100
    passed: boolean;                  // ≥85
    breakdown: {
      structure: number;              // /20
      connections: number;            // /25
      parameters: number;             // /20
      bestPractices: number;          // /25
      documentation: number;          // /10
    };
  };
  validationChecks: Array<{
    category: string;
    name: string;
    passed: boolean;
    points: number;
    message: string;
  }>;
  recommendations: Array<{
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    message: string;
    action: string;
  }>;
  readyForDeployment: boolean;
  estimatedExecutionTime: string;
  performanceMetrics: {
    nodeCount: number;
    connectionCount: number;
    estimatedMemoryUsage: string;
    parallelizationOpportunities: number;
  };
}
```

## Example Usage

### Example 1: Simple HTTP to Slack Workflow (Score: 92/100)

**Input**:
```typescript
{
  "name": "Fetch Users and Notify Slack",
  "nodes": [...],  // 3 nodes
  "connections": {...},
  "active": false,
  "settings": {}
}
```

**Output**:
```typescript
{
  workflowName: "Fetch Users and Notify Slack",
  qualityScore: {
    total: 92,
    maxPoints: 100,
    percentage: 92,
    passed: true,  // ≥85
    breakdown: {
      structure: 20,        // 20/20 (perfect)
      connections: 25,      // 25/25 (perfect)
      parameters: 18,       // 18/20 (minor issue)
      bestPractices: 25,    // 25/25 (perfect)
      documentation: 4      // 4/10 (needs improvement)
    }
  },
  validationChecks: [
    {
      category: 'structural-validation',
      name: 'has-name',
      passed: true,
      points: 3,
      message: '✅ Workflow has name'
    },
    // ... (all other checks)
    {
      category: 'documentation-quality',
      name: 'node-names-descriptive',
      passed: false,
      points: 0,
      message: '⚠️ Only 66% of nodes have descriptive names'
    }
  ],
  recommendations: [
    {
      priority: 'LOW',
      category: 'documentation',
      message: 'Improve node naming for better clarity',
      action: 'Rename nodes to be more descriptive (e.g., "HTTP Request" → "Fetch User Data from API")'
    }
  ],
  readyForDeployment: true,
  estimatedExecutionTime: '2-5 seconds',
  performanceMetrics: {
    nodeCount: 3,
    connectionCount: 2,
    estimatedMemoryUsage: '< 50MB',
    parallelizationOpportunities: 0
  }
}
```

### Example 2: RAG Workflow with Violation (Score: 65/100 - FAIL)

**Input** (has RAG pattern violation):
```typescript
{
  "name": "Document RAG System",
  "nodes": [...],  // 5 nodes with Document Loader in main flow
  "connections": {...},  // Wrong connection type
  "active": false,
  "settings": {}
}
```

**Output**:
```typescript
{
  workflowName: "Document RAG System",
  qualityScore: {
    total: 65,
    maxPoints: 100,
    percentage: 65,
    passed: false,  // <85
    breakdown: {
      structure: 20,        // 20/20
      connections: 20,      // 20/25 (orphan node)
      parameters: 18,       // 18/20
      bestPractices: 0,     // 0/25 (CRITICAL RAG violation)
      documentation: 7      // 7/10
    }
  },
  validationChecks: [
    // ... (other checks)
    {
      category: 'best-practices-compliance',
      name: 'rag-pattern-correct',
      passed: false,
      points: 0,
      message: '❌ CRITICAL: RAG pattern violation - Document Loader in main flow'
    }
  ],
  recommendations: [
    {
      priority: 'CRITICAL',
      category: 'best-practices',
      message: 'Fix RAG pattern violation',
      action: 'Change Document Loader connection from main to ai_document. ' +
              'Document Loader is an AI capability, not a main flow processor.'
    }
  ],
  readyForDeployment: false,  // BLOCKED
  estimatedExecutionTime: '5-15 seconds',
  performanceMetrics: {
    nodeCount: 5,
    connectionCount: 4,
    estimatedMemoryUsage: '< 200MB',
    parallelizationOpportunities: 2
  }
}
```

## Integration with Workflow Orchestrator

After validation, return to orchestrator with:
```typescript
{
  workflow: WorkflowJSON,
  validationResult: ValidationResult,
  qualityScore: number,           // 0-100
  passed: boolean,                // ≥85
  readyForDeployment: boolean,
  criticalIssues: string[]
}
```

## Performance Metrics

- **Validation Time**: <2 seconds for simple workflows, <5 seconds for complex
- **Accuracy**: 100% structural validation, 95%+ quality prediction
- **Coverage**: All critical checks enforced

## Error Handling

- **Invalid JSON**: Return error, provide syntax hints
- **Missing fields**: Identify missing required fields
- **Score <85**: Block deployment, provide fix recommendations
- **CRITICAL violations**: Escalate to best-practices-guardian for detailed analysis
