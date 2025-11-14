# Phase 2 Requirements - Testing & Runtime Integration

**Date**: 2025-01-14
**Priority**: High
**Based On**: User feedback during Phase 1 completion

## Critical Requirements

### 1. Workflow Execution Capabilities

**Requirement**: Agent should be able to start and stop workflows

**Implementation**:
- **Start Workflow**: `./packages/cli/bin/n8n execute --id=workflow-id`
- **Stop Workflow**: Kill process or use n8n API
- **Activate/Deactivate**: Update workflow `active` flag via API

**Agent Needed**: `n8n-execution-specialist`

**Capabilities**:
- Execute workflow by ID or by file
- Monitor execution status (running, completed, failed)
- Start workflows in background
- Stop running workflows
- Activate/deactivate workflows for webhook/schedule triggers

**Example Usage**:
```typescript
// Start workflow
const execution = await executeWorkflow({
  workflowId: 'uuid-123',
  mode: 'background'
});

// Monitor execution
const status = await getExecutionStatus(execution.id);

// Stop execution
await stopExecution(execution.id);
```

### 2. Execution Results Monitoring

**Requirement**: Agent should be able to see the results of every workflow

**Implementation**:
- Parse execution logs
- Extract output data from each node
- Capture errors and warnings
- Display execution trace (node-by-node)

**Agent Needed**: `n8n-execution-specialist` (same agent)

**Capabilities**:
- View execution results in real-time
- Display output data from each node
- Show execution trace (which nodes executed, in what order)
- Capture execution metadata (duration, memory usage)
- Export execution results for analysis

**Example Output**:
```typescript
{
  executionId: "exec-uuid-456",
  workflowId: "workflow-uuid-123",
  status: "success",
  duration: "2.5s",
  results: [
    {
      nodeId: "uuid-1",
      nodeName: "Manual Trigger",
      output: { json: {} }
    },
    {
      nodeId: "uuid-2",
      nodeName: "HTTP Request",
      output: { json: { users: [...], count: 42 } }
    },
    {
      nodeId: "uuid-3",
      nodeName: "Slack",
      output: { json: { message: "42 users fetched from API" } }
    }
  ]
}
```

### 3. Automatic Error Debugging

**Requirement**: Use the errors in workflows to debug and fix them automatically while building a workflow

**Implementation**:
- Execute workflow
- Capture errors (syntax, runtime, parameter, connection)
- Analyze error patterns
- Identify root cause
- Generate fix
- Apply fix and re-execute
- Iterate until workflow succeeds

**Agent Needed**: `n8n-debugging-specialist`

**Error Types to Handle**:

#### Syntax Errors
```json
{
  "error": "Invalid expression syntax",
  "node": "HTTP Request",
  "parameter": "url",
  "message": "Expected {{ but found {",
  "fix": "Change '{ $json.url }' to '={{ $json.url }}'"
}
```

#### Parameter Errors
```json
{
  "error": "Missing required parameter",
  "node": "Slack",
  "parameter": "channel",
  "message": "Channel parameter is required",
  "fix": "Add channel: '#general'"
}
```

#### Connection Errors
```json
{
  "error": "Invalid connection type",
  "node": "Document Loader",
  "source": "Manual Trigger",
  "connectionType": "main",
  "message": "Document Loader cannot receive main flow connection",
  "fix": "Remove main connection, connect via ai_document to Vector Store"
}
```

#### Runtime Errors
```json
{
  "error": "Execution failed",
  "node": "HTTP Request",
  "message": "Connection timeout after 10000ms",
  "fix": "Increase timeout to 30000ms in options.timeout"
}
```

**Debugging Workflow**:
```
1. Execute workflow
   ↓
2. Capture error
   ↓
3. Classify error type
   ↓
4. Analyze root cause
   ↓
5. Generate fix (invoke parameter-configurator or workflow-architect)
   ↓
6. Apply fix to workflow
   ↓
7. Re-execute workflow
   ↓
8. Iterate until success (max 3 attempts)
```

### 4. GROVE Workflow for n8n Workflow Creation

**Requirement**: We should most definitely have an arbor workflow for creating n8n workflow plans within the grove system

**Implementation**:
- **Custom Arbor Template**: `.claude/skills/arbor/templates/n8n-workflow.md`
- **Project-Specific**: Override global Arbor templates
- **n8n Domain Knowledge**: Template includes node types, connection patterns, best practices

**Template Sections**:

#### PRD Template (n8n-specific)
```markdown
# n8n Workflow PRD

## Workflow Overview
- **Purpose**: [What this workflow accomplishes]
- **Trigger**: [Manual | Schedule | Webhook | Event]
- **Pattern**: [simple | RAG | AI agent | complex]

## Required Nodes
- **Trigger Nodes**: [List with purpose]
- **Action Nodes**: [List with purpose]
- **AI Capability Nodes**: [List with purpose]

## Data Flow
[Step-by-step data transformation]

## Connection Pattern
- **Type**: [Main flow only | RAG pattern | Agent with tools]
- **Connection Types**: [main, ai_document, ai_tool, etc.]

## Quality Criteria
- Execution success: [Pass/Fail]
- Parameter validation: [All configured]
- Best practices: [100% compliance]
- Quality score: [≥85/100]
```

#### Design Template (n8n-specific)
```markdown
# n8n Workflow Design

## Architecture Overview
**Pattern**: [simple | RAG | AI agent]
**Node Count**: [Number]
**Connection Count**: [Number]

## Node Graph
[ASCII diagram of connections]

## Connection Design
### Main Data Flow
[Connection details]

### AI Capabilities
[AI-specific connections]

## Validation Rules
- [ ] Exactly one trigger
- [ ] No orphan nodes
- [ ] Correct connection types
- [ ] RAG pattern compliance (if applicable)
```

#### MECE Analysis (n8n-specific)
```markdown
# n8n Workflow MECE Analysis

## Parallelization Opportunities
- **Phase 2 (Node Discovery)**: Parallel searches
- **Phase 4 (Parameter Configuration)**: Parallel node configuration

## Agent Delegation Strategy
- node-discovery-specialist: Find nodes
- workflow-architect: Design connections
- parameter-configurator: Configure parameters
- best-practices-guardian: Validate compliance
```

#### Test Plan Template (NEW)
```markdown
# n8n Workflow Test Plan

## Test Cases
### TC1: Successful Execution
- Execute workflow with valid inputs
- Verify all nodes execute successfully
- Check output matches expected results

### TC2: Error Handling
- Execute workflow with invalid inputs
- Verify errors are caught and logged
- Check workflow doesn't crash

### TC3: Parameter Validation
- Verify all parameters are configured
- Check no reliance on defaults
- Validate dynamic expressions work

### TC4: Best Practices Compliance
- Check RAG pattern (if applicable)
- Verify system message separation (if AI workflow)
- Validate $fromAI expressions (if tool nodes)
```

### 5. Project-Specific Sub-Agents

**Requirement**: This augmentation of ~/.claude/agents is specific to this project, so we would OVERRIDE the global orchestrator config for arbor and add new n8n sub agents here in this project

**Implementation**:
- **Location**: `/.claude/agents/` (project-specific)
- **Purpose**: n8n-specific agents that don't belong in global config
- **Override**: Project agents override global agents with same name

**New Sub-Agents to Create**:

#### `n8n-execution-specialist.md`
**Location**: `.claude/agents/2-specialists/n8n-execution-specialist.md`

**Purpose**: Execute workflows, monitor results, manage workflow lifecycle

**Capabilities**:
- Start workflows (by ID or file)
- Stop running workflows
- View execution results
- Monitor execution status
- Export execution data

#### `n8n-debugging-specialist.md`
**Location**: `.claude/agents/2-specialists/n8n-debugging-specialist.md`

**Purpose**: Parse errors, fix workflows automatically, iterate until success

**Capabilities**:
- Classify errors (syntax, parameter, connection, runtime)
- Analyze root cause
- Generate fixes (invoke parameter-configurator or workflow-architect)
- Apply fixes to workflow
- Re-execute and validate

#### `n8n-testing-specialist.md`
**Location**: `.claude/agents/2-specialists/n8n-testing-specialist.md`

**Purpose**: Run test workflows, validate execution, generate test reports

**Capabilities**:
- Create test cases (success, error, parameter, compliance)
- Execute test workflows
- Validate results against expected output
- Generate test reports
- Track test coverage

#### `n8n-documentation-specialist.md`
**Location**: `.claude/agents/2-specialists/n8n-documentation-specialist.md`

**Purpose**: Generate workflow documentation, usage guides, README files

**Capabilities**:
- Generate workflow description from JSON
- Create usage guides
- Document node configurations
- Generate README files
- Export documentation

### 6. Complete GROVE Workflow

**Requirement**: Following the grove workflow completely, writing tests against them, documenting the workflow

**Complete GROVE Process for n8n Workflows**:

```
Phase 00: Research
- [ ] Analyze user requirements
- [ ] Identify workflow pattern (simple, RAG, AI agent)
- [ ] Review n8n best practices
- [ ] Research similar workflows

Phase 01: Planning (Arbor)
- [ ] Generate PRD (workflow-planner + arbor-phase-planning)
- [ ] Generate Design (workflow-planner + arbor-plan-generation)
- [ ] Generate MECE Analysis
- [ ] Verify quality (arbor-verification ≥85/100)

Phase 02: Node Discovery
- [ ] Search for trigger nodes (node-discovery-specialist)
- [ ] Search for action nodes (parallel)
- [ ] Search for AI capability nodes (parallel)
- [ ] Validate node coverage

Phase 03: Architecture Design
- [ ] Design connection graph (workflow-architect)
- [ ] Validate connection types
- [ ] Enforce RAG pattern (if applicable)
- [ ] Calculate node positions

Phase 04: Parameter Configuration
- [ ] Configure trigger parameters
- [ ] Configure action parameters (parallel)
- [ ] Configure AI parameters (parallel)
- [ ] Validate all parameters set (no defaults)

Phase 05: Best Practices Compliance
- [ ] Run compliance checks (best-practices-guardian)
- [ ] Validate RAG pattern (CRITICAL)
- [ ] Validate system message separation
- [ ] Validate $fromAI expressions

Phase 06: Testing
- [ ] Create test cases (n8n-testing-specialist)
- [ ] Execute test workflows
- [ ] Debug errors (n8n-debugging-specialist)
- [ ] Validate results
- [ ] Generate test report

Phase 07: Documentation
- [ ] Generate workflow description (n8n-documentation-specialist)
- [ ] Create usage guide
- [ ] Document node configurations
- [ ] Generate README

Phase 08: Quality Verification
- [ ] Final quality scoring (validation-specialist)
- [ ] Verify score ≥85/100
- [ ] Export workflow JSON
- [ ] Deployment approval

Phase 09: Deployment & Monitoring (NEW)
- [ ] Import workflow to n8n (n8n-execution-specialist)
- [ ] Activate workflow
- [ ] Monitor execution results
- [ ] Track performance metrics
- [ ] Optimize based on data
```

## Implementation Plan (Phase 2)

### Week 3: Testing Infrastructure

**Tasks**:
1. Create `n8n-execution-specialist.md` agent
2. Create `n8n-debugging-specialist.md` agent
3. Create `n8n-testing-specialist.md` agent
4. Test with 4 sample workflows (simple, RAG, AI agent, complex)

**Success Criteria**:
- ✅ Workflows execute successfully via CLI
- ✅ Execution results captured and displayed
- ✅ Errors detected and classified
- ✅ Test reports generated

### Week 4: Runtime Integration

**Tasks**:
1. Integrate n8n CLI execution
2. Parse execution logs and results
3. Implement error debugging loop
4. Test automatic fixes (3 iterations max)

**Success Criteria**:
- ✅ Agent can start/stop workflows
- ✅ Agent can view execution results
- ✅ Agent can debug and fix errors automatically
- ✅ Workflow succeeds after debugging

### Week 5: GROVE Workflow

**Tasks**:
1. Create custom Arbor template (`.claude/skills/arbor/templates/n8n-workflow.md`)
2. Create `n8n-documentation-specialist.md` agent
3. Implement complete GROVE workflow (9 phases)
4. Test end-to-end workflow generation + testing + documentation

**Success Criteria**:
- ✅ Custom Arbor template created
- ✅ All 9 GROVE phases implemented
- ✅ Documentation auto-generated
- ✅ End-to-end workflow succeeds (planning → implementation → testing → documentation → deployment)

## Key Metrics

### Phase 2 Success Metrics

**Execution**:
- Workflow execution success rate: ≥90%
- Error detection accuracy: ≥95%
- Automatic fix success rate: ≥80%

**Testing**:
- Test coverage: 100% (all nodes tested)
- Test execution time: <10 seconds per workflow
- Test report completeness: ≥90%

**GROVE**:
- Planning quality: ≥85/100 (Arbor)
- Implementation quality: ≥85/100 (validation-specialist)
- Documentation quality: ≥90% completeness

**Overall**:
- End-to-end workflow generation time: <2 minutes (simple), <5 minutes (complex)
- Quality score: ≥85/100
- Token efficiency: 80% reduction maintained

## User Expectations

Based on user feedback:

1. ✅ **"Agent should be able to start and stop workflows"**
   - Implemented in `n8n-execution-specialist`

2. ✅ **"Agent should be able to see the results of every workflow"**
   - Execution monitoring in `n8n-execution-specialist`

3. ✅ **"Use the errors in workflows to debug and fix them automatically while building a workflow"**
   - Implemented in `n8n-debugging-specialist`

4. ✅ **"We should most definitely have an arbor workflow for creating n8n workflow plans within the grove system"**
   - Custom Arbor template (`.claude/skills/arbor/templates/n8n-workflow.md`)
   - Complete GROVE workflow (9 phases)

5. ✅ **"If there is anything in particular that would make a custom grove/arbor workflow for creating n8n workflows, writing tests against them, documenting the workflow, following the grove workflow completely"**
   - Testing phase (Phase 06)
   - Documentation phase (Phase 07)
   - All phases implemented end-to-end

6. ✅ **"This augmentation of ~/.claude/agents is specific to this project, so we would OVERRIDE the global orchestrator config for arbor and add new n8n sub agents here in this project"**
   - Project-specific agents in `/.claude/agents/`
   - Override global config for n8n-specific capabilities

## Conclusion

Phase 2 requirements clearly defined based on user feedback:

1. **Runtime Integration**: Execution, monitoring, debugging capabilities
2. **Testing Infrastructure**: Test generation, execution, validation
3. **GROVE Workflow**: Custom Arbor template, complete 9-phase workflow
4. **Project-Specific Agents**: Override global config with n8n-specific sub-agents

**Timeline**: Week 3-5 (3 weeks)

**Priority**: High (critical for production readiness)

**Dependencies**: Phase 1 complete (all specialist agents created)

**Next Steps**: Begin Week 3 implementation with `n8n-execution-specialist` agent creation.
