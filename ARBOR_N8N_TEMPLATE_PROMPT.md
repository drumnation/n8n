# Prompt for Creating n8n Workflow Arbor Planning Template

**Task**: Create a comprehensive Arbor planning template specifically for n8n workflow design.

**File Location**: `.claude/skills/arbor/templates/n8n-workflow.md`

**Context**: This template will be used by the `workflow-planner` agent to generate planning artifacts for n8n workflows. It must integrate with the existing Arbor planning system while incorporating n8n-specific domain knowledge.

---

## Requirements

### 1. Template Structure

The template should follow the standard Arbor template format with these sections:

```yaml
# Template Metadata
name: "n8n Workflow Planning Template"
version: "1.0.0"
domain: "workflow-automation"
quality_threshold: 85  # Minimum score to proceed to implementation

# PRD Template Section
prd:
  workflow_specification:
    - Workflow purpose and business goals
    - Trigger requirements (schedule, webhook, event-based)
    - Required integrations and services
    - Data flow requirements
    - Expected outputs and deliverables
    - Success criteria and metrics

  node_requirements:
    - Trigger nodes needed (with justification)
    - Action nodes needed (with justification)
    - AI capability nodes needed (if applicable)
    - Utility nodes needed (transformations, routing, etc.)
    - Connection patterns required

  quality_criteria:
    - Performance requirements (execution time, throughput)
    - Reliability requirements (error handling, retries)
    - Maintainability requirements (reusability, clarity)
    - Best practices compliance (RAG patterns, system messages, etc.)

# Design Template Section
design:
  connection_graph:
    - Node placement strategy
    - Connection type mapping (main, ai_languageModel, ai_tool, etc.)
    - Data flow diagram (source → target chains)
    - RAG pattern compliance (if applicable)

  parameter_configuration:
    - Required parameters per node
    - Dynamic parameter strategy ($fromAI expressions)
    - System message vs user context separation (for AI nodes)
    - Workflow Configuration node setup

  validation_strategy:
    - Connection type validation rules
    - Parameter completeness checks
    - Best practices compliance checks
    - Quality gate definitions

# MECE Analysis Section
mece:
  parallelization_opportunities:
    - Which nodes can be created in parallel?
    - Which parameters can be configured in parallel?
    - Which connections can be established in parallel?

  agent_delegation:
    - Node Discovery phase: Which node types to search for?
    - Parameter Configuration phase: Which nodes need LLM assistance?
    - Validation phase: What validations to run?

  critical_path:
    - What are the dependencies between creation steps?
    - What must be sequential vs parallel?
    - What are the quality gates?

# User Stories Section (n8n-specific format)
stories:
  workflow_creation:
    - "As a workflow builder, I need to [trigger] so that [action]"
    - "As a workflow builder, I need to connect [source] to [target] via [connection_type] so that [capability]"
    - "As a workflow builder, I need to configure [node] with [parameters] so that [outcome]"

  best_practices_compliance:
    - "As a workflow validator, I need to ensure RAG pattern compliance so that Document Loaders are AI capabilities, not data processors"
    - "As a workflow validator, I need to ensure system message separation so that AI behavior is consistent"
    - "As a workflow validator, I need to ensure Workflow Configuration node exists so that parameters are centralized"

# Validation Rules Section (n8n-specific)
validation:
  mandatory_checks:
    - [ ] RAG pattern compliance (if Vector Store used)
    - [ ] System message vs user context separation (if AI nodes used)
    - [ ] Workflow Configuration node present after trigger
    - [ ] All nodes explicitly configured (no default parameters)
    - [ ] Connection types valid for source and target nodes
    - [ ] Document Loader connected via ai_document, not main
    - [ ] AI Agent has language model connection
    - [ ] Vector Store has embedding connection
    - [ ] Tool nodes use $fromAI expressions where appropriate
    - [ ] Triggers have no input connections

  quality_scoring:
    structure_validation: 20  # All phases complete, correct folder structure
    connection_correctness: 25  # Valid connection types, proper graph
    parameter_completeness: 20  # All nodes configured, no defaults
    best_practices_compliance: 25  # RAG, system messages, Workflow Config
    documentation_quality: 10  # Clear explanations, setup instructions
```

### 2. Reference Documents to Incorporate

Use these knowledge base documents as authoritative sources:

1. **`.claude/knowledge/n8n-node-ecosystem-summary.md`**
   - Node categories (triggers, actions, AI, utilities)
   - LangChain AI node breakdown
   - Node taxonomy by domain

2. **`.claude/knowledge/n8n-connection-patterns.md`**
   - 13 connection types and usage matrix
   - 5 common workflow patterns
   - Connection validation rules
   - RAG workflow pattern (CRITICAL)

3. **`.claude/knowledge/n8n-best-practices.md`**
   - 7-phase workflow creation sequence
   - 13 best practice categories
   - Mandatory enforcement rules
   - Configuration examples

### 3. n8n-Specific Template Features

#### PRD Template Should Include
- **Workflow Purpose**: Clear description of what the workflow does
- **Trigger Strategy**: Schedule-based, webhook, event-driven, manual
- **Node Inventory**:
  - List of required node types with justifications
  - Connection pattern requirements
  - Parameter configuration needs
- **Data Flow Specification**:
  - Input data format
  - Transformation requirements
  - Output data format
- **Best Practices Requirements**:
  - RAG pattern compliance (if Vector Store used)
  - System message separation (if AI nodes used)
  - Workflow Configuration node requirement

#### Design Template Should Include
- **Connection Graph Design**:
  - Visual representation (Mermaid diagram format)
  - Connection type annotations (main, ai_languageModel, ai_tool, etc.)
  - Data flow arrows with labels
- **Node Configuration Strategy**:
  - Static vs dynamic parameters
  - $fromAI expressions for tool nodes
  - System message vs user context for AI nodes
- **Validation Checkpoints**:
  - Pre-implementation validation (connection graph correctness)
  - Post-implementation validation (workflow JSON validity)

#### MECE Analysis Should Include
- **Parallelization Plan**:
  - Phase 2 (Discovery): Search for multiple node types in parallel
  - Phase 3 (Analysis): Get details for all nodes in parallel
  - Phase 4 (Creation): Add all nodes in parallel
  - Phase 5 (Connection): Connect all node pairs in parallel
  - Phase 6 (Configuration): Update all parameters in parallel
- **Critical Path**:
  - Must search before adding (discovery → creation)
  - Must add before connecting (creation → connection)
  - Must connect before configuring (connection → configuration)

#### Validation Rules Should Include
- **Connection Type Validation**:
  ```
  IF node type is "Vector Store" THEN
    MUST have ai_embedding connection
  IF node type is "AI Agent" THEN
    MUST have ai_languageModel connection
  IF node type is "Document Loader" THEN
    MUST NOT have main output connections
    MUST connect via ai_document to Vector Store
  ```

- **Parameter Configuration Validation**:
  ```
  IF node type is "Document Loader" AND processing files THEN
    MUST set dataType='binary'
  IF node type is "AI Agent Tool" THEN
    MUST configure BOTH systemMessage AND text fields
  IF node type is "Tool" (ends with "Tool") THEN
    SHOULD use $fromAI expressions for dynamic parameters
  ```

- **Best Practices Validation**:
  ```
  MUST have Workflow Configuration node after trigger
  IF AI nodes present THEN
    MUST separate system message from user context
  IF Vector Store used THEN
    MUST follow RAG pattern (Document Loader as AI capability)
  ```

### 4. Quality Scoring Breakdown

The template should define how to score planning artifacts (total: 100 points):

```yaml
quality_scoring:
  structure_validation: 20 points
    - All required sections present
    - Correct Arbor folder structure
    - Phase markers complete

  connection_correctness: 25 points
    - Connection types valid for node types
    - Graph topology correct (triggers at start, no cycles)
    - RAG pattern followed (if applicable)

  parameter_completeness: 20 points
    - All nodes have parameter specifications
    - No reliance on defaults
    - $fromAI expressions used appropriately

  best_practices_compliance: 25 points
    - Workflow Configuration node present
    - System message separation (AI nodes)
    - RAG pattern compliance (Vector Stores)
    - Tool node configuration ($fromAI)

  documentation_quality: 10 points
    - Clear setup instructions
    - Usage examples provided
    - Edge cases documented

minimum_score_to_proceed: 85
```

### 5. Example Workflow to Include in Template

Include a complete example for a RAG workflow:

```yaml
example_rag_workflow:
  prd:
    purpose: "Index PDF documents into vector store for semantic search"
    trigger: "Manual trigger or schedule-based"
    nodes_required:
      - Manual Trigger (n8n-nodes-base.manualTrigger)
      - HTTP Request (n8n-nodes-base.httpRequest) - download PDF
      - Vector Store (n8n-nodes-langchain.vectorStore)
      - Document Loader (n8n-nodes-langchain.documentLoader)
      - Embeddings OpenAI (n8n-nodes-langchain.embeddingsOpenAi)
      - Text Splitter (n8n-nodes-langchain.textSplitter)

  design:
    connection_graph: |
      Manual Trigger --[main]--> HTTP Request --[main]--> Vector Store
      Document Loader --[ai_document]--> Vector Store
      Embeddings OpenAI --[ai_embedding]--> Vector Store
      Text Splitter --[ai_textSplitter]--> Document Loader

    parameters:
      http_request:
        - url: "https://example.com/document.pdf"
        - method: "GET"
      document_loader:
        - dataType: "binary"  # CRITICAL - not 'json'
        - loader: "pdfLoader"
      embeddings:
        - model: "text-embedding-3-small"

  validation:
    - RAG pattern followed (Document Loader via ai_document, not main)
    - Document Loader dataType set to 'binary' (not default 'json')
    - Vector Store has both main input and ai_embedding connection
```

### 6. Template Usage Instructions

The template should include clear instructions for the workflow-planner agent:

```markdown
## How to Use This Template

### For Simple Workflows (Trigger → Action → Notification)
1. Fill out PRD with clear workflow purpose
2. Identify 3-5 required nodes
3. Design simple linear connection graph
4. Specify basic parameters
5. Run validation checks

### For RAG Workflows (Vector Store + Document Processing)
1. **CRITICAL**: Follow RAG pattern exactly
2. Identify all AI capability nodes needed
3. Design connection graph with ai_document, ai_embedding, ai_textSplitter
4. Set Document Loader dataType='binary' for files
5. Run RAG-specific validation checks

### For AI Agent Workflows (Multi-Agent with Tools)
1. Separate system message from user context
2. Configure all tool nodes with $fromAI expressions
3. Design connection graph with ai_languageModel, ai_tool, ai_memory
4. Include Workflow Configuration node
5. Run AI-specific validation checks

### For All Workflows
1. Always include Workflow Configuration node after trigger
2. Never rely on default parameters
3. Run all validation checks before implementation
4. Aim for quality score ≥85/100
```

---

## Deliverable

Create the file `.claude/skills/arbor/templates/n8n-workflow.md` with:

1. Complete template structure following Arbor format
2. n8n-specific sections for PRD, Design, MECE, Stories, Validation
3. Quality scoring breakdown (100 points total, ≥85 to proceed)
4. 3 complete examples (simple, RAG, AI agent workflows)
5. Usage instructions for workflow-planner agent
6. Validation rules with TypeScript/pseudocode examples
7. References to knowledge base documents

**Quality Requirements**:
- Template must be comprehensive (cover all workflow types)
- Must enforce all 13 best practice categories
- Must include validation rules that catch common mistakes
- Must integrate seamlessly with existing Arbor system
- Must enable 80% token reduction via structured planning

**Success Criteria**:
- Workflow-planner agent can generate complete planning artifacts using this template
- Generated artifacts score ≥85/100 on first attempt (with good input)
- All mandatory n8n best practices enforced through template structure
- Template prevents common mistakes (RAG pattern, default parameters, system messages)

---

## Additional Context

### Why This Template is Critical

1. **Quality Gates**: Arbor verification uses this template to score planning artifacts (≥85 required)
2. **Token Efficiency**: Structured template reduces planning context from ~10K to ~2K tokens
3. **Best Practices Enforcement**: Template structure ensures compliance without manual checking
4. **Agent Coordination**: Provides common vocabulary for all specialist agents

### Integration with Multi-Agent System

The template will be used by:
- **workflow-planner**: Generates planning artifacts following this template
- **workflow-architect**: Uses design section to create connection graph
- **parameter-configurator**: Uses parameter specifications to generate configs
- **validation-specialist**: Uses validation rules to check compliance
- **best-practices-guardian**: Uses validation checklist to enforce requirements

### Key Design Principles

1. **Mandatory over Optional**: If it's a best practice, it's mandatory in the template
2. **Explicit over Implicit**: Every requirement spelled out clearly
3. **Validated over Assumed**: Every claim must be checkable
4. **Examples over Abstractions**: Concrete examples for every pattern
5. **Prevention over Detection**: Template structure prevents mistakes before they happen

---

**Hand this entire prompt to the Arbor planning specialist agent to create the template.**
