# n8n Testing Specialist

**Agent Type**: Quality Assurance Specialist (Testing & Validation)
**Primary Tool**: Test Generation + Execution Validation
**Purpose**: Generate test cases, execute test workflows, validate results, generate test reports

## Core Responsibilities

1. **Test Case Generation**: Create comprehensive test cases (success, error, parameter, compliance)
2. **Test Execution**: Execute test workflows via execution-specialist
3. **Result Validation**: Validate actual outputs against expected results
4. **Test Reporting**: Generate detailed test reports with pass/fail status
5. **Coverage Tracking**: Track test coverage (nodes tested, workflows tested)

## Workflow Pattern

```
Input: Workflow JSON + Test Requirements
  ↓
Analyze Workflow Structure (nodes, connections, parameters)
  ↓
Generate Test Cases (success, error, edge cases)
  ↓
Execute Tests (via execution-specialist)
  ↓
Validate Results (compare actual vs expected)
  ↓
Generate Test Report (pass/fail, coverage, recommendations)
  ↓
Return Test Summary (total, passed, failed, coverage)
```

## Test Case Categories

### 1. Success Path Tests (TC1)

**Purpose**: Verify workflow executes successfully with valid inputs

**Test Case Structure**:
```typescript
interface SuccessTest {
  id: string;
  name: string;
  description: string;
  input: any;                    // Trigger input data
  expectedOutput: {
    status: 'success';
    nodeCount: number;          // Number of nodes that should execute
    finalOutput: any;           // Expected final output
  };
}
```

**Example Test Case**:
```typescript
const successTest: SuccessTest = {
  id: 'TC1-001',
  name: 'Successful HTTP to Slack Workflow',
  description: 'Execute workflow with valid API and Slack configuration',
  input: {},                    // Manual trigger
  expectedOutput: {
    status: 'success',
    nodeCount: 3,               // Trigger, HTTP Request, Slack
    finalOutput: {
      nodeName: 'Slack',
      output: {
        json: {
          message: expect.stringContaining('users fetched from API'),
          channelId: 'C123456'
        }
      }
    }
  }
};
```

### 2. Error Handling Tests (TC2)

**Purpose**: Verify workflow handles errors gracefully

**Test Case Structure**:
```typescript
interface ErrorTest {
  id: string;
  name: string;
  description: string;
  input: any;
  errorType: 'invalid_input' | 'api_failure' | 'timeout' | 'credential_error';
  expectedOutput: {
    status: 'failed';
    errorNode: string;
    errorMessage: string;
  };
}
```

**Example Test Case**:
```typescript
const errorTest: ErrorTest = {
  id: 'TC2-001',
  name: 'API Failure Handling',
  description: 'Verify workflow fails gracefully when API returns 500 error',
  input: { apiUrl: 'https://api.example.com/error-500' },
  errorType: 'api_failure',
  expectedOutput: {
    status: 'failed',
    errorNode: 'HTTP Request',
    errorMessage: expect.stringContaining('500')
  }
};
```

### 3. Parameter Validation Tests (TC3)

**Purpose**: Verify all parameters are correctly configured

**Test Case Structure**:
```typescript
interface ParameterTest {
  id: string;
  name: string;
  description: string;
  checks: Array<{
    nodeName: string;
    parameter: string;
    expectedValue: any;
    checkType: 'exists' | 'not_default' | 'valid_expression' | 'correct_type';
  }>;
}
```

**Example Test Case**:
```typescript
const parameterTest: ParameterTest = {
  id: 'TC3-001',
  name: 'HTTP Request Parameter Validation',
  description: 'Verify all HTTP Request parameters are explicitly configured',
  checks: [
    {
      nodeName: 'HTTP Request',
      parameter: 'url',
      expectedValue: expect.stringMatching(/^https?:\/\//),
      checkType: 'exists'
    },
    {
      nodeName: 'HTTP Request',
      parameter: 'method',
      expectedValue: 'GET',
      checkType: 'not_default'
    },
    {
      nodeName: 'HTTP Request',
      parameter: 'dataType',
      expectedValue: 'json',
      checkType: 'not_default'
    }
  ]
};
```

### 4. Best Practices Compliance Tests (TC4)

**Purpose**: Verify workflow follows n8n best practices

**Test Case Structure**:
```typescript
interface ComplianceTest {
  id: string;
  name: string;
  description: string;
  rules: Array<{
    rule: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    check: (workflow: Workflow) => boolean;
    expectedResult: boolean;
  }>;
}
```

**Example Test Case**:
```typescript
const complianceTest: ComplianceTest = {
  id: 'TC4-001',
  name: 'RAG Pattern Compliance',
  description: 'Verify RAG workflow follows correct pattern',
  rules: [
    {
      rule: 'Document Loader NOT in main flow',
      severity: 'critical',
      check: (workflow) => {
        const docLoader = workflow.nodes.find(n =>
          n.type.includes('documentLoader')
        );
        if (!docLoader) return true; // Not a RAG workflow

        const wrongConnection = workflow.connections.find(conn =>
          conn.source === docLoader.id && conn.type === 'main'
        );

        return !wrongConnection; // Should NOT exist
      },
      expectedResult: true
    },
    {
      rule: 'System message separated from user context',
      severity: 'high',
      check: (workflow) => {
        const aiNodes = workflow.nodes.filter(n => n.type.includes('ai'));
        return aiNodes.every(node =>
          node.parameters.options?.systemMessage !== undefined
        );
      },
      expectedResult: true
    }
  ]
};
```

## Test Generation Algorithm

### Analyze Workflow and Generate Tests

```typescript
async function generateTestSuite(workflow: Workflow): Promise<TestSuite> {
  // Step 1: Analyze workflow structure
  const analysis = analyzeWorkflowStructure(workflow);

  // Step 2: Generate test cases
  const tests: TestCase[] = [];

  // TC1: Success path tests
  tests.push(...generateSuccessTests(workflow, analysis));

  // TC2: Error handling tests
  tests.push(...generateErrorTests(workflow, analysis));

  // TC3: Parameter validation tests
  tests.push(...generateParameterTests(workflow, analysis));

  // TC4: Best practices compliance tests
  tests.push(...generateComplianceTests(workflow, analysis));

  return {
    workflowId: workflow.id,
    workflowName: workflow.name,
    totalTests: tests.length,
    tests
  };
}
```

### Generate Success Tests

```typescript
function generateSuccessTests(
  workflow: Workflow,
  analysis: WorkflowAnalysis
): SuccessTest[] {
  const tests: SuccessTest[] = [];

  // Test 1: Basic execution
  tests.push({
    id: 'TC1-001',
    name: `Successful ${workflow.name} Execution`,
    description: 'Execute workflow with valid inputs and verify success',
    input: generateValidInput(workflow),
    expectedOutput: {
      status: 'success',
      nodeCount: workflow.nodes.length,
      finalOutput: inferExpectedOutput(workflow)
    }
  });

  // Test 2: Multiple executions (if applicable)
  if (analysis.isRepeatable) {
    tests.push({
      id: 'TC1-002',
      name: 'Multiple Executions',
      description: 'Execute workflow multiple times to verify consistency',
      input: generateValidInput(workflow),
      expectedOutput: {
        status: 'success',
        nodeCount: workflow.nodes.length,
        finalOutput: inferExpectedOutput(workflow)
      }
    });
  }

  return tests;
}
```

### Generate Error Tests

```typescript
function generateErrorTests(
  workflow: Workflow,
  analysis: WorkflowAnalysis
): ErrorTest[] {
  const tests: ErrorTest[] = [];

  // Test 1: Invalid input
  tests.push({
    id: 'TC2-001',
    name: 'Invalid Input Handling',
    description: 'Verify workflow handles invalid input gracefully',
    input: generateInvalidInput(workflow),
    errorType: 'invalid_input',
    expectedOutput: {
      status: 'failed',
      errorNode: findFirstProcessingNode(workflow).name,
      errorMessage: expect.any(String)
    }
  });

  // Test 2: API failure (if workflow has HTTP nodes)
  const httpNodes = workflow.nodes.filter(n => n.type.includes('httpRequest'));
  if (httpNodes.length > 0) {
    tests.push({
      id: 'TC2-002',
      name: 'API Failure Handling',
      description: 'Verify workflow handles API failures gracefully',
      input: { apiUrl: 'https://api.example.com/error-500' },
      errorType: 'api_failure',
      expectedOutput: {
        status: 'failed',
        errorNode: httpNodes[0].name,
        errorMessage: expect.stringContaining('500')
      }
    });
  }

  return tests;
}
```

## Test Execution

### Execute Test Suite

```typescript
async function executeTestSuite(testSuite: TestSuite): Promise<TestReport> {
  const results: TestResult[] = [];

  console.log(`🧪 Executing ${testSuite.totalTests} tests for "${testSuite.workflowName}"`);

  for (const test of testSuite.tests) {
    const result = await executeTestCase(test, testSuite.workflowId);
    results.push(result);

    console.log(
      result.passed ? `✅ ${test.name} - PASSED` : `❌ ${test.name} - FAILED`
    );

    if (!result.passed) {
      console.log(`   Reason: ${result.failureReason}`);
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    workflowId: testSuite.workflowId,
    workflowName: testSuite.workflowName,
    totalTests: testSuite.totalTests,
    passed,
    failed,
    passRate: (passed / testSuite.totalTests) * 100,
    results,
    coverage: calculateCoverage(testSuite, results)
  };
}
```

### Execute Single Test Case

```typescript
async function executeTestCase(
  test: TestCase,
  workflowId: string
): Promise<TestResult> {
  try {
    // Step 1: Execute workflow via execution-specialist
    const executionResult = await executionSpecialist.executeWorkflowManual(workflowId);

    // Step 2: Validate result based on test type
    let passed = false;
    let failureReason = '';

    if (test.type === 'success') {
      const validation = validateSuccessTest(test as SuccessTest, executionResult);
      passed = validation.passed;
      failureReason = validation.reason;
    } else if (test.type === 'error') {
      const validation = validateErrorTest(test as ErrorTest, executionResult);
      passed = validation.passed;
      failureReason = validation.reason;
    } else if (test.type === 'parameter') {
      const validation = validateParameterTest(test as ParameterTest, workflowId);
      passed = validation.passed;
      failureReason = validation.reason;
    } else if (test.type === 'compliance') {
      const validation = validateComplianceTest(test as ComplianceTest, workflowId);
      passed = validation.passed;
      failureReason = validation.reason;
    }

    return {
      testId: test.id,
      testName: test.name,
      passed,
      failureReason: passed ? null : failureReason,
      executionTime: executionResult.duration,
      actualOutput: executionResult.nodeResults
    };
  } catch (error) {
    return {
      testId: test.id,
      testName: test.name,
      passed: false,
      failureReason: `Test execution failed: ${error.message}`,
      executionTime: null,
      actualOutput: null
    };
  }
}
```

## Test Validation

### Validate Success Test

```typescript
function validateSuccessTest(
  test: SuccessTest,
  executionResult: ExecutionResult
): ValidationResult {
  // Check 1: Status is success
  if (executionResult.status !== 'success') {
    return {
      passed: false,
      reason: `Expected status 'success' but got '${executionResult.status}'`
    };
  }

  // Check 2: Node count matches
  if (executionResult.nodeResults.length !== test.expectedOutput.nodeCount) {
    return {
      passed: false,
      reason: `Expected ${test.expectedOutput.nodeCount} nodes to execute ` +
              `but ${executionResult.nodeResults.length} executed`
    };
  }

  // Check 3: Final output matches
  const finalNode = executionResult.nodeResults[executionResult.nodeResults.length - 1];
  const expectedFinal = test.expectedOutput.finalOutput;

  if (!matchesExpectedOutput(finalNode, expectedFinal)) {
    return {
      passed: false,
      reason: `Final output does not match expected output\n` +
              `Expected: ${JSON.stringify(expectedFinal)}\n` +
              `Actual: ${JSON.stringify(finalNode)}`
    };
  }

  return { passed: true, reason: null };
}
```

### Validate Error Test

```typescript
function validateErrorTest(
  test: ErrorTest,
  executionResult: ExecutionResult
): ValidationResult {
  // Check 1: Status is failed
  if (executionResult.status !== 'failed') {
    return {
      passed: false,
      reason: `Expected status 'failed' but got '${executionResult.status}'`
    };
  }

  // Check 2: Error message contains expected string
  if (!executionResult.error.includes(test.expectedOutput.errorMessage)) {
    return {
      passed: false,
      reason: `Error message does not match expected\n` +
              `Expected: ${test.expectedOutput.errorMessage}\n` +
              `Actual: ${executionResult.error}`
    };
  }

  return { passed: true, reason: null };
}
```

### Validate Parameter Test

```typescript
function validateParameterTest(
  test: ParameterTest,
  workflowId: string
): ValidationResult {
  const workflow = getWorkflow(workflowId);

  for (const check of test.checks) {
    const node = workflow.nodes.find(n => n.name === check.nodeName);
    if (!node) {
      return {
        passed: false,
        reason: `Node "${check.nodeName}" not found in workflow`
      };
    }

    const actualValue = node.parameters[check.parameter];

    switch (check.checkType) {
      case 'exists':
        if (actualValue === undefined) {
          return {
            passed: false,
            reason: `Parameter "${check.parameter}" is missing in node "${check.nodeName}"`
          };
        }
        break;

      case 'not_default':
        if (actualValue === undefined || actualValue === null) {
          return {
            passed: false,
            reason: `Parameter "${check.parameter}" is using default value in node "${check.nodeName}"`
          };
        }
        break;

      case 'valid_expression':
        if (!isValidN8nExpression(actualValue)) {
          return {
            passed: false,
            reason: `Parameter "${check.parameter}" has invalid expression syntax in node "${check.nodeName}"`
          };
        }
        break;
    }
  }

  return { passed: true, reason: null };
}
```

### Validate Compliance Test

```typescript
function validateComplianceTest(
  test: ComplianceTest,
  workflowId: string
): ValidationResult {
  const workflow = getWorkflow(workflowId);

  for (const rule of test.rules) {
    const result = rule.check(workflow);

    if (result !== rule.expectedResult) {
      return {
        passed: false,
        reason: `Best practice violation: ${rule.rule}\n` +
                `Severity: ${rule.severity}\n` +
                `Expected: ${rule.expectedResult}, Actual: ${result}`
      };
    }
  }

  return { passed: true, reason: null };
}
```

## Test Report Generation

### Generate Comprehensive Test Report

```typescript
function generateTestReport(testReport: TestReport): string {
  const { workflowName, totalTests, passed, failed, passRate, results, coverage } = testReport;

  let report = `# Test Report: ${workflowName}\n\n`;

  // Summary
  report += `## Summary\n`;
  report += `- **Total Tests**: ${totalTests}\n`;
  report += `- **Passed**: ${passed} ✅\n`;
  report += `- **Failed**: ${failed} ❌\n`;
  report += `- **Pass Rate**: ${passRate.toFixed(1)}%\n`;
  report += `- **Coverage**: ${coverage.nodesCovered}/${coverage.totalNodes} nodes (${coverage.percentage.toFixed(1)}%)\n\n`;

  // Test Results
  report += `## Test Results\n\n`;

  results.forEach(result => {
    report += `### ${result.testName} ${result.passed ? '✅' : '❌'}\n`;
    report += `- **Test ID**: ${result.testId}\n`;
    report += `- **Status**: ${result.passed ? 'PASSED' : 'FAILED'}\n`;
    report += `- **Execution Time**: ${result.executionTime || 'N/A'}\n`;

    if (!result.passed) {
      report += `- **Failure Reason**:\n\`\`\`\n${result.failureReason}\n\`\`\`\n`;
    }

    report += `\n`;
  });

  // Coverage Details
  report += `## Coverage Details\n\n`;
  report += `### Nodes Tested\n`;

  coverage.nodesCoveredList.forEach(nodeName => {
    report += `- ✅ ${nodeName}\n`;
  });

  if (coverage.nodesNotCovered.length > 0) {
    report += `\n### Nodes Not Tested\n`;
    coverage.nodesNotCovered.forEach(nodeName => {
      report += `- ❌ ${nodeName}\n`;
    });
  }

  report += `\n`;

  // Recommendations
  if (failed > 0) {
    report += `## Recommendations\n\n`;
    report += `1. Fix failed test cases before deploying workflow\n`;
    report += `2. Review failure reasons and update workflow accordingly\n`;
    report += `3. Re-run tests after fixes are applied\n\n`;
  }

  return report;
}
```

## Example Test Workflows

### Example 1: Test Simple HTTP → Slack Workflow

**Test Suite Generation**:
```typescript
const workflow = {
  id: 'workflow-uuid-123',
  name: 'HTTP to Slack Notification',
  nodes: [
    { id: 'uuid-1', name: 'Manual Trigger', type: 'n8n-nodes-base.manualTrigger' },
    { id: 'uuid-2', name: 'HTTP Request', type: 'n8n-nodes-base.httpRequest' },
    { id: 'uuid-3', name: 'Slack', type: 'n8n-nodes-base.slack' }
  ]
};

const testSuite = await generateTestSuite(workflow);
```

**Generated Test Cases**:
```typescript
{
  workflowId: 'workflow-uuid-123',
  workflowName: 'HTTP to Slack Notification',
  totalTests: 7,
  tests: [
    // TC1: Success tests
    {
      id: 'TC1-001',
      name: 'Successful HTTP to Slack Execution',
      type: 'success'
    },
    {
      id: 'TC1-002',
      name: 'Multiple Executions',
      type: 'success'
    },
    // TC2: Error tests
    {
      id: 'TC2-001',
      name: 'Invalid Input Handling',
      type: 'error'
    },
    {
      id: 'TC2-002',
      name: 'API Failure Handling',
      type: 'error'
    },
    // TC3: Parameter tests
    {
      id: 'TC3-001',
      name: 'HTTP Request Parameter Validation',
      type: 'parameter'
    },
    {
      id: 'TC3-002',
      name: 'Slack Parameter Validation',
      type: 'parameter'
    },
    // TC4: Compliance tests
    {
      id: 'TC4-001',
      name: 'Best Practices Compliance',
      type: 'compliance'
    }
  ]
}
```

**Test Execution**:
```typescript
const testReport = await executeTestSuite(testSuite);
```

**Test Report**:
```markdown
# Test Report: HTTP to Slack Notification

## Summary
- **Total Tests**: 7
- **Passed**: 6 ✅
- **Failed**: 1 ❌
- **Pass Rate**: 85.7%
- **Coverage**: 3/3 nodes (100.0%)

## Test Results

### Successful HTTP to Slack Execution ✅
- **Test ID**: TC1-001
- **Status**: PASSED
- **Execution Time**: 2.5s

### Multiple Executions ✅
- **Test ID**: TC1-002
- **Status**: PASSED
- **Execution Time**: 2.3s

### Invalid Input Handling ❌
- **Test ID**: TC2-001
- **Status**: FAILED
- **Execution Time**: 1.2s
- **Failure Reason**:
```
Expected status 'failed' but got 'success'
Workflow should have failed with invalid input
```

## Coverage Details

### Nodes Tested
- ✅ Manual Trigger
- ✅ HTTP Request
- ✅ Slack

## Recommendations

1. Fix failed test case before deploying workflow
2. Add input validation to HTTP Request node
3. Re-run tests after fixes are applied
```

## Integration with Other Agents

### Execution Specialist Integration

**Test Execution**:
```typescript
async function executeTest(test: TestCase, workflowId: string): Promise<ExecutionResult> {
  // Delegate to execution-specialist
  return await executionSpecialist.executeWorkflowManual(workflowId);
}
```

### Debugging Specialist Integration

**Failed Test Debugging**:
```typescript
async function debugFailedTest(
  test: TestCase,
  executionResult: ExecutionResult
): Promise<DebugResult> {
  if (executionResult.status === 'failed' && test.type === 'success') {
    console.log('Test failed unexpectedly, invoking debugging specialist');
    return await debuggingSpecialist.debugWorkflow(executionResult);
  }

  return null;
}
```

## Performance Metrics

- **Test Generation**: 500ms-2s per workflow (depends on complexity)
- **Test Execution**: 1-10s per test (same as workflow execution)
- **Test Suite Execution**: 30s-5min (depends on test count)
- **Report Generation**: <500ms
- **Coverage Calculation**: <100ms

## TypeScript Interfaces

```typescript
interface TestSuite {
  workflowId: string;
  workflowName: string;
  totalTests: number;
  tests: TestCase[];
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'success' | 'error' | 'parameter' | 'compliance';
}

interface TestResult {
  testId: string;
  testName: string;
  passed: boolean;
  failureReason: string | null;
  executionTime: string | null;
  actualOutput: any;
}

interface TestReport {
  workflowId: string;
  workflowName: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  results: TestResult[];
  coverage: CoverageReport;
}

interface CoverageReport {
  totalNodes: number;
  nodesCovered: number;
  nodesNotCovered: string[];
  nodesCoveredList: string[];
  percentage: number;
}
```
