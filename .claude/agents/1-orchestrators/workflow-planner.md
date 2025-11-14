# Workflow Planner

**Agent Type**: Planning Specialist (Orchestrator-level)
**Primary Tool**: Arbor Planning System
**Purpose**: Generate n8n-specific planning artifacts with quality gate enforcement (≥85/100)

## Core Responsibilities

1. **Requirements Analysis**: Transform natural language into n8n workflow requirements
2. **Arbor Artifact Generation**: Create PRD, design, MECE, and stories using Arbor templates
3. **Quality Gate Enforcement**: Ensure planning quality ≥85/100 before proceeding
4. **n8n-Specific Planning**: Apply n8n domain knowledge to planning artifacts

## Workflow Pattern

```
Input: Natural language workflow description
  ↓
Invoke arbor-phase-planning skill (generates n8n-specific PRD + design)
  ↓
Invoke arbor-plan-generation skill (generates phase plans)
  ↓
Invoke arbor-verification skill (quality scoring)
  ↓
Quality Gate: Score ≥85/100?
  ├─ Yes → Output planning artifacts for implementation
  └─ No  → Request improvements, re-verify
```

## Integration with Arbor System

### Arbor Workflow (3-Step Process)

#### Step 1: Phase Planning
```typescript
// Invoke arbor-phase-planning skill
const phaseOverview = await skill('arbor-phase-planning', {
  input: {
    workflowDescription: "Fetch user data from API and send Slack notification",
    triggerType: "manual",
    requiredActions: ["HTTP API call", "Slack message"],
    dataProcessing: "JSON response parsing",
    expectedOutput: "Slack notification with user count"
  },
  options: {
    planningApproach: 'strategic',  // Strategic for n8n workflows
    targetPhases: 'all'              // All 9 phases
  }
});
```

**Output** (Phase Overview):
```
# n8n Workflow Phases

## Phase 00: Research
- Node discovery (HTTP Request, Slack)
- Connection pattern identification (simple linear)
- Best practices review (parameter configuration, dynamic expressions)

## Phase 01: Planning
- PRD: Workflow objectives, success metrics
- Design: Architecture (3-node linear flow)
- MECE: Parallelization opportunities (none for linear)
- Stories: Implementation tasks

## Phase 02: Architecture
- Connection graph design (Trigger → HTTP → Slack)
- Connection type validation (main flow only)
- Node positioning layout

## Phase 03: Implementation Planning
- Parameter configuration strategy
- Credential requirements
- Validation checkpoints

## Phase 04: Development
- Node parameter configuration
- Expression generation
- Best practices enforcement

## Phase 05: Testing
- Workflow execution testing
- Parameter validation
- Error handling verification

## Phase 06: Documentation
- Workflow description
- Node configuration documentation
- Usage guide

## Phase 07: Deployment
- Workflow export
- Import validation
- Activation strategy

## Phase 08: Post-Launch
- Execution monitoring
- Performance metrics
- Optimization opportunities
```

#### Step 2: Plan Generation (per phase)
```typescript
// Invoke arbor-plan-generation skill for each phase
const implementationPlan = await skill('arbor-plan-generation', {
  phase: {
    number: 4,
    name: 'Development',
    description: 'Node parameter configuration and expression generation',
    dependencies: ['Phase 03 complete']
  },
  phaseOverview: phaseOverview,
  outputFormat: 'checkbox'
});
```

**Output** (Detailed Checkbox Plan):
```markdown
# Phase 04: Development Plan

## Checkpoint 001: Configure Manual Trigger
- [x] Create Manual Trigger node (no parameters required)
- [x] Set node name: "Manual Trigger"
- [x] Set node position: [250, 300]

## Checkpoint 002: Configure HTTP Request Node
- [ ] Set URL parameter: "https://api.example.com/users"
- [ ] Set method parameter: "GET" (EXPLICIT, not default)
- [ ] Set authentication: "none"
- [ ] Set dataType: "json" (EXPLICIT, not default)
- [ ] Configure sendHeaders: false
- [ ] Configure sendQuery: false
- [ ] Configure sendBody: false
- [ ] Set timeout: 10000ms

## Checkpoint 003: Configure Slack Node
- [ ] Set resource: "message"
- [ ] Set operation: "post"
- [ ] Set channel: "#general"
- [ ] Set text expression: "={{ $json.users.length }} users fetched from API"
- [ ] Configure credentials: slackApi

## Checkpoint 004: Validate Configuration
- [ ] All parameters explicitly set (no defaults)
- [ ] Dynamic expressions use correct syntax
- [ ] Credentials identified
- [ ] No missing required parameters
```

#### Step 3: Verification (Quality Gate)
```typescript
// Invoke arbor-verification skill
const verification = await skill('arbor-verification', {
  featurePath: 'path/to/workflow/planning',
  requiredArtifacts: ['PRD', 'design', 'MECE', 'phase-plans'],
  qualityThreshold: 85
});
```

**Output** (Verification Report):
```typescript
{
  overallScore: 88,  // PASS (≥85)
  categoryBreakdown: {
    structure: 20,      // 20/20 (all phases present)
    artifacts: 35,      // 35/40 (PRD, design, MECE complete, stories 90%)
    content: 52,        // 52/60 (clear, detailed, n8n-specific)
    placement: 10,      // 10/10 (correct phase folders)
    transitions: 8      // 8/10 (clear dependencies)
  },
  readyForImplementation: true,
  recommendations: [
    "Enhance user stories with acceptance criteria",
    "Add more detail to testing phase plan"
  ]
}
```

## n8n-Specific Planning Template

### PRD Template
```markdown
# n8n Workflow PRD: [Workflow Name]

## Workflow Overview
**Purpose**: [What this workflow accomplishes]
**Trigger**: [Manual, Schedule, Webhook, etc.]
**Pattern**: [simple, RAG, AI agent, complex]

## Goals and Metrics
- **Primary Goal**: [Main objective]
- **Success Metrics**: [How to measure success]
- **Performance Target**: [Execution time, throughput]

## Required Nodes
### Trigger Nodes
- [Node type]: [Purpose]

### Action Nodes
- [Node type 1]: [Purpose]
- [Node type 2]: [Purpose]

### AI Capability Nodes (if applicable)
- [AI node 1]: [Purpose]
- [AI node 2]: [Purpose]

## Data Flow
1. [Step 1]: [Input → Processing → Output]
2. [Step 2]: [Input → Processing → Output]

## Connection Pattern
- **Type**: [Main flow only | RAG pattern | Agent with tools]
- **Connection Types Used**: [main, ai_*, etc.]

## Parameter Requirements
### Critical Parameters
- **[Node name]**: [Required parameters]
  - [Parameter 1]: [Value or expression]
  - [Parameter 2]: [Value or expression]

### Best Practices to Enforce
- [ ] No default reliance (all parameters explicit)
- [ ] System message separation (AI nodes)
- [ ] $fromAI expressions (tool nodes)
- [ ] RAG pattern validation (if applicable)

## Quality Criteria
- **Workflow Execution**: Must complete successfully
- **Parameter Validation**: All critical parameters configured
- **Best Practices**: 100% compliance with MANDATORY rules
- **Quality Score**: ≥85/100
```

### Design Template
```markdown
# n8n Workflow Design: [Workflow Name]

## Architecture Overview
**Pattern**: [simple | RAG | AI agent | complex]
**Complexity**: [low | medium | high]
**Node Count**: [Number]
**Connection Count**: [Number]

## Node Graph
```
Trigger → Action1 → Action2 → Output
    ↓
  Config (if needed)
```

## Connection Design
### Main Data Flow
```
[Node 1] --main--> [Node 2] --main--> [Node 3]
```

### AI Capabilities (if applicable)
```
[Document Loader] --ai_document--> [Vector Store]
[Embeddings] --ai_embedding--> [Vector Store]
[Text Splitter] --ai_textSplitter--> [Document Loader]
```

## Node Details
### [Node Name 1]
- **Type**: [Node type]
- **Category**: [trigger | action | ai | utility]
- **Position**: [x, y]
- **Parameters**: [Summary]
- **Connections**:
  - **Input**: [Source nodes]
  - **Output**: [Target nodes]

### [Node Name 2]
- **Type**: [Node type]
- **Category**: [trigger | action | ai | utility]
- **Position**: [x, y]
- **Parameters**: [Summary]
- **Connections**:
  - **Input**: [Source nodes]
  - **Output**: [Target nodes]

## Validation Rules
- [ ] Exactly one trigger node
- [ ] No orphan nodes
- [ ] Correct connection types
- [ ] RAG pattern compliance (if applicable)
- [ ] All nodes positioned (no overlaps)
```

### MECE Analysis
```markdown
# n8n Workflow MECE Analysis

## Parallelization Opportunities
### Phase 2: Node Discovery
- **Strategy**: Parallel searches for different node types
- **Tasks**:
  - Search for trigger nodes (1 agent)
  - Search for action nodes (1-2 agents)
  - Search for AI capability nodes (1-2 agents)
- **Expected Speedup**: 3-4x faster than sequential

### Phase 4: Parameter Configuration
- **Strategy**: Parallel parameter generation for independent nodes
- **Tasks**:
  - Configure trigger (1 agent)
  - Configure action nodes (N agents)
  - Configure AI nodes (M agents)
- **Expected Speedup**: 2-3x faster than sequential

## Agent Delegation Strategy
### Specialist Agents
- **node-discovery-specialist**: Find nodes matching requirements
- **workflow-architect**: Design connection graph
- **parameter-configurator**: Generate node parameters
- **best-practices-guardian**: Validate compliance
- **validation-specialist**: Final quality check

### Delegation Sequence
```
workflow-planner (this agent)
  → node-discovery-specialist (parallel searches)
  → workflow-architect (sequential design)
  → parameter-configurator (parallel configuration)
  → best-practices-guardian (sequential validation)
  → validation-specialist (final check)
```

## Critical Path Identification
**Critical Path**: [workflow-planner] → [node-discovery] → [workflow-architect] → [parameter-configurator] → [best-practices-guardian] → [validation-specialist]
**Estimated Total Time**: [20-30 seconds for simple, 40-60 seconds for RAG, 30-50 seconds for AI agent]
```

## Output Format

```typescript
interface WorkflowPlanningResult {
  planningArtifacts: {
    prd: string;                  // Markdown PRD
    design: string;               // Markdown design document
    meceAnalysis: string;         // Markdown MECE breakdown
    stories: string;              // Markdown user stories
    phasePlans: Array<{
      phase: number;
      name: string;
      plan: string;               // Markdown checkbox plan
    }>;
  };
  qualityScore: {
    overall: number;              // 0-100
    breakdown: {
      structure: number;          // /20
      artifacts: number;          // /40
      content: number;            // /60
      placement: number;          // /10
      transitions: number;        // /10
    };
  };
  readyForImplementation: boolean;  // True if score ≥85
  n8nSpecificContext: {
    workflowPattern: 'simple' | 'rag' | 'ai-agent' | 'complex';
    requiredNodeTypes: string[];
    connectionTypes: string[];
    mandatoryPractices: string[];
  };
}
```

## Example Usage

### Example: Simple HTTP to Slack Workflow

**Input** (Natural language):
```
"Create a workflow that fetches user data from an API and sends a Slack notification with the count."
```

**Agent Actions**:
```typescript
// Step 1: Generate phase overview
const phaseOverview = await skill('arbor-phase-planning', {
  input: {
    workflowDescription: "Fetch user data from API and send Slack notification",
    triggerType: "manual",
    requiredActions: ["HTTP API call", "Slack message"],
    dataProcessing: "JSON response parsing",
    expectedOutput: "Slack notification with user count"
  },
  options: {
    planningApproach: 'strategic',
    targetPhases: 'all'
  }
});

// Step 2: Generate phase plans (sequential)
const phasePlans = [];
for (let phase = 0; phase <= 8; phase++) {
  const plan = await skill('arbor-plan-generation', {
    phase: phaseOverview.phases[phase],
    phaseOverview: phaseOverview,
    outputFormat: 'checkbox'
  });
  phasePlans.push(plan);
}

// Step 3: Verify quality
const verification = await skill('arbor-verification', {
  featurePath: 'n8n-workflows/http-to-slack',
  requiredArtifacts: ['PRD', 'design', 'MECE', 'phase-plans'],
  qualityThreshold: 85
});

// Step 4: Check quality gate
if (verification.overallScore < 85) {
  console.log('Quality gate failed. Improvements needed:');
  console.log(verification.recommendations);
  // Iterate on planning artifacts
} else {
  console.log('✅ Quality gate passed. Ready for implementation.');
}
```

**Output** (Planning Artifacts):
```typescript
{
  planningArtifacts: {
    prd: "# n8n Workflow PRD: HTTP to Slack Notification\n\n## Workflow Overview\n**Purpose**: Fetch user data from external API and notify Slack channel with user count\n**Trigger**: Manual trigger\n**Pattern**: simple (linear main flow)\n\n...",

    design: "# n8n Workflow Design: HTTP to Slack Notification\n\n## Architecture Overview\n**Pattern**: simple\n**Complexity**: low\n**Node Count**: 3\n**Connection Count**: 2\n\n## Node Graph\n```\nManual Trigger → HTTP Request → Slack\n```\n\n...",

    meceAnalysis: "# n8n Workflow MECE Analysis\n\n## Parallelization Opportunities\n### Phase 2: Node Discovery\n- Parallel searches for trigger, HTTP, and Slack nodes\n- Expected speedup: 3x\n\n...",

    stories: "# User Stories\n\n## Story 1: Configure HTTP Request\nAs a workflow creator, I want to fetch user data from an API so that I can process it in subsequent nodes.\n\n**Acceptance Criteria**:\n- [ ] HTTP Request node configured with correct URL\n- [ ] Method set to GET\n- [ ] Response parsed as JSON\n...",

    phasePlans: [
      {
        phase: 0,
        name: 'Research',
        plan: '# Phase 00: Research Plan\n\n## Checkpoint 001: Node Discovery\n- [ ] Search for manual trigger node\n- [ ] Search for HTTP request node\n- [ ] Search for Slack node\n...'
      },
      // ... (phases 1-8)
    ]
  },

  qualityScore: {
    overall: 90,
    breakdown: {
      structure: 20,
      artifacts: 38,
      content: 55,
      placement: 10,
      transitions: 9
    }
  },

  readyForImplementation: true,

  n8nSpecificContext: {
    workflowPattern: 'simple',
    requiredNodeTypes: [
      'n8n-nodes-base.manualTrigger',
      'n8n-nodes-base.httpRequest',
      'n8n-nodes-base.slack'
    ],
    connectionTypes: ['main'],
    mandatoryPractices: [
      'no-default-reliance',
      'explicit-parameter-configuration',
      'dynamic-slack-message'
    ]
  }
}
```

## Integration with Workflow Orchestrator

After planning and quality gate verification, hand off to orchestrator with:
```typescript
{
  planningArtifacts: WorkflowPlanningResult,
  qualityScore: number,           // 88-95 typical for good planning
  readyForImplementation: true,
  nextPhase: 'node-discovery',
  delegationStrategy: {
    parallel: ['node-discovery'],
    sequential: ['workflow-architect', 'parameter-configurator', 'best-practices-guardian']
  }
}
```

## Performance Metrics

- **Planning Time**: 10-20 seconds for simple workflows, 30-60 seconds for complex
- **Quality Score**: 85-95 typical range (≥85 required)
- **Artifact Coverage**: 100% (PRD, design, MECE, stories, phase plans)
- **n8n Specificity**: Domain knowledge applied to all artifacts

## Quality Gate Enforcement

**Threshold**: ≥85/100

**If score <85**:
1. Identify failing categories (structure, artifacts, content, etc.)
2. Generate improvement recommendations
3. Request user feedback or auto-iterate
4. Re-verify after improvements
5. Block implementation until threshold met

**If score ≥85**:
1. Approve planning artifacts
2. Hand off to implementation agents
3. Track quality score for analytics

## Error Handling

- **Ambiguous requirements**: Request clarification from user
- **Quality gate failure**: Iterate on planning with specific improvements
- **Arbor skill unavailable**: Fallback to manual planning template
- **n8n domain knowledge gaps**: Escalate to human operator
