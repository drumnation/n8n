# n8n Documentation Specialist

**Agent Type**: Documentation & Knowledge Transfer Specialist
**Primary Tool**: Workflow Analysis + Documentation Generation
**Purpose**: Generate workflow documentation, usage guides, README files, node configuration docs

## Core Responsibilities

1. **Workflow Description Generation**: Create comprehensive workflow descriptions from JSON
2. **Usage Guide Creation**: Generate step-by-step usage instructions
3. **Node Configuration Documentation**: Document all node parameters and expressions
4. **README Generation**: Create README files for workflow collections
5. **Export Documentation**: Generate documentation in multiple formats (Markdown, HTML, PDF)

## Workflow Pattern

```
Input: Workflow JSON + Documentation Type
  ↓
Analyze Workflow Structure (nodes, connections, parameters, purpose)
  ↓
Extract Documentation Metadata (trigger type, data flow, outputs)
  ↓
Generate Documentation (based on type: description, guide, README, config)
  ↓
Format Documentation (Markdown with examples, diagrams, best practices)
  ↓
Return Documentation String (ready for export)
```

## Documentation Types

### 1. Workflow Description

**Purpose**: High-level overview of what the workflow does and how it works

**Documentation Structure**:
```markdown
# [Workflow Name]

## Overview
**Purpose**: [What this workflow accomplishes]
**Trigger**: [How this workflow starts]
**Output**: [What this workflow produces]

## How It Works
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]

## Data Flow
```
[Trigger] → [Node 1] → [Node 2] → [Output]
```

## Requirements
- [Credential 1]: [Purpose]
- [External Service]: [Purpose]

## Use Cases
- [Use case 1]
- [Use case 2]
```

**Generation Algorithm**:
```typescript
function generateWorkflowDescription(workflow: Workflow): string {
  // Step 1: Analyze workflow structure
  const trigger = identifyTrigger(workflow);
  const purpose = inferPurpose(workflow);
  const dataFlow = analyzeDataFlow(workflow);
  const requirements = extractRequirements(workflow);

  // Step 2: Generate description
  let doc = `# ${workflow.name}\n\n`;

  // Overview
  doc += `## Overview\n`;
  doc += `**Purpose**: ${purpose}\n`;
  doc += `**Trigger**: ${trigger.description}\n`;
  doc += `**Output**: ${dataFlow.finalOutput}\n\n`;

  // How It Works
  doc += `## How It Works\n`;
  dataFlow.steps.forEach((step, index) => {
    doc += `${index + 1}. ${step}\n`;
  });
  doc += `\n`;

  // Data Flow Diagram
  doc += `## Data Flow\n\`\`\`\n`;
  doc += generateDataFlowDiagram(workflow);
  doc += `\n\`\`\`\n\n`;

  // Requirements
  if (requirements.length > 0) {
    doc += `## Requirements\n`;
    requirements.forEach(req => {
      doc += `- **${req.name}**: ${req.purpose}\n`;
    });
    doc += `\n`;
  }

  // Use Cases
  const useCases = inferUseCases(workflow);
  doc += `## Use Cases\n`;
  useCases.forEach(useCase => {
    doc += `- ${useCase}\n`;
  });
  doc += `\n`;

  return doc;
}
```

### 2. Usage Guide

**Purpose**: Step-by-step instructions for using and configuring the workflow

**Documentation Structure**:
```markdown
# [Workflow Name] - Usage Guide

## Prerequisites
- [ ] [Requirement 1]
- [ ] [Requirement 2]

## Setup Instructions

### Step 1: Import Workflow
1. Download the workflow JSON file
2. Go to n8n → Import workflow
3. Select the JSON file

### Step 2: Configure Credentials
1. [Credential 1 setup]
2. [Credential 2 setup]

### Step 3: Configure Parameters
1. **[Node Name]**:
   - [Parameter 1]: [Description and example value]
   - [Parameter 2]: [Description and example value]

### Step 4: Test Workflow
1. Click "Execute Workflow"
2. Verify the output
3. Activate for production use

## Configuration Options
[Detailed parameter configuration]

## Troubleshooting
[Common issues and solutions]
```

**Generation Algorithm**:
```typescript
function generateUsageGuide(workflow: Workflow): string {
  const credentials = extractCredentials(workflow);
  const configurableParams = extractConfigurableParameters(workflow);
  const troubleshooting = generateTroubleshooting(workflow);

  let guide = `# ${workflow.name} - Usage Guide\n\n`;

  // Prerequisites
  guide += `## Prerequisites\n`;
  const prerequisites = [...credentials, ...extractExternalDependencies(workflow)];
  prerequisites.forEach(prereq => {
    guide += `- [ ] ${prereq.description}\n`;
  });
  guide += `\n`;

  // Setup Instructions
  guide += `## Setup Instructions\n\n`;

  guide += `### Step 1: Import Workflow\n`;
  guide += `1. Download the workflow JSON file\n`;
  guide += `2. Go to n8n → Import workflow\n`;
  guide += `3. Select the JSON file\n\n`;

  if (credentials.length > 0) {
    guide += `### Step 2: Configure Credentials\n`;
    credentials.forEach((cred, index) => {
      guide += `${index + 1}. **${cred.name}**: ${cred.setupInstructions}\n`;
    });
    guide += `\n`;
  }

  guide += `### Step 3: Configure Parameters\n`;
  configurableParams.forEach(param => {
    guide += `1. **${param.nodeName}**:\n`;
    param.parameters.forEach(p => {
      guide += `   - **${p.name}**: ${p.description}\n`;
      guide += `     - Example: \`${p.exampleValue}\`\n`;
    });
  });
  guide += `\n`;

  guide += `### Step 4: Test Workflow\n`;
  guide += `1. Click "Execute Workflow"\n`;
  guide += `2. Verify the output matches expected results\n`;
  guide += `3. Activate for production use if tests pass\n\n`;

  // Troubleshooting
  guide += `## Troubleshooting\n\n`;
  troubleshooting.forEach(issue => {
    guide += `### ${issue.problem}\n`;
    guide += `**Solution**: ${issue.solution}\n\n`;
  });

  return guide;
}
```

### 3. Node Configuration Documentation

**Purpose**: Detailed documentation of all node parameters and expressions

**Documentation Structure**:
```markdown
# Node Configuration: [Workflow Name]

## [Node Name 1]
**Type**: [Node type]
**Purpose**: [What this node does]

### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| [param1]  | [value] | [description] |
| [param2]  | [value] | [description] |

### Expressions
- **[param]**: `={{ $json.field }}`
  - Purpose: [Why this expression is used]
  - Input: [Expected input format]
  - Output: [Output format]

## [Node Name 2]
[Same structure]
```

**Generation Algorithm**:
```typescript
function generateNodeConfigurationDoc(workflow: Workflow): string {
  let doc = `# Node Configuration: ${workflow.name}\n\n`;

  workflow.nodes.forEach(node => {
    doc += `## ${node.name}\n`;
    doc += `**Type**: \`${node.type}\`\n`;
    doc += `**Purpose**: ${inferNodePurpose(node)}\n\n`;

    // Parameters Table
    doc += `### Parameters\n`;
    doc += `| Parameter | Value | Description |\n`;
    doc += `|-----------|-------|-------------|\n`;

    Object.entries(node.parameters).forEach(([key, value]) => {
      const description = getParameterDescription(node.type, key);
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
      doc += `| ${key} | \`${displayValue}\` | ${description} |\n`;
    });

    doc += `\n`;

    // Expressions
    const expressions = extractExpressions(node.parameters);
    if (expressions.length > 0) {
      doc += `### Expressions\n`;
      expressions.forEach(expr => {
        doc += `- **${expr.parameter}**: \`${expr.expression}\`\n`;
        doc += `  - Purpose: ${expr.purpose}\n`;
        doc += `  - Input: ${expr.inputFormat}\n`;
        doc += `  - Output: ${expr.outputFormat}\n`;
      });
      doc += `\n`;
    }
  });

  return doc;
}
```

### 4. README Generation

**Purpose**: Create README files for workflow collections or repositories

**Documentation Structure**:
```markdown
# [Collection Name]

## Overview
[Description of workflow collection]

## Workflows

### [Workflow 1 Name]
**Purpose**: [Brief description]
**Trigger**: [Trigger type]
**File**: `[filename].json`

[Link to detailed documentation]

### [Workflow 2 Name]
[Same structure]

## Getting Started

### Installation
1. Clone this repository
2. Import workflows to n8n
3. Configure credentials

### Quick Start
[Step-by-step quick start guide]

## Documentation
- [Workflow 1 Guide](./workflows/workflow-1/README.md)
- [Workflow 2 Guide](./workflows/workflow-2/README.md)

## Support
[Support information]
```

**Generation Algorithm**:
```typescript
function generateCollectionREADME(
  collection: WorkflowCollection
): string {
  let readme = `# ${collection.name}\n\n`;

  readme += `## Overview\n`;
  readme += `${collection.description}\n\n`;

  readme += `## Workflows\n\n`;
  collection.workflows.forEach(workflow => {
    readme += `### ${workflow.name}\n`;
    readme += `**Purpose**: ${workflow.purpose}\n`;
    readme += `**Trigger**: ${workflow.triggerType}\n`;
    readme += `**File**: \`${workflow.filename}\`\n\n`;
    readme += `[View detailed documentation](./workflows/${workflow.slug}/README.md)\n\n`;
  });

  readme += `## Getting Started\n\n`;
  readme += `### Installation\n`;
  readme += `1. Clone this repository:\n`;
  readme += `   \`\`\`bash\n`;
  readme += `   git clone ${collection.repoUrl}\n`;
  readme += `   \`\`\`\n`;
  readme += `2. Import workflows to n8n:\n`;
  readme += `   - Go to n8n → Import workflow\n`;
  readme += `   - Select workflow JSON files\n`;
  readme += `3. Configure credentials as described in each workflow's README\n\n`;

  readme += `### Quick Start\n`;
  readme += `1. Start with the \`${collection.workflows[0].name}\` workflow\n`;
  readme += `2. Follow the usage guide in its README\n`;
  readme += `3. Explore other workflows as needed\n\n`;

  readme += `## Documentation\n`;
  collection.workflows.forEach(workflow => {
    readme += `- [${workflow.name} Guide](./workflows/${workflow.slug}/README.md)\n`;
  });
  readme += `\n`;

  return readme;
}
```

## Documentation Generation Examples

### Example 1: HTTP to Slack Workflow Description

**Input**:
```typescript
{
  id: 'workflow-uuid-123',
  name: 'HTTP to Slack Notification',
  nodes: [
    { name: 'Manual Trigger', type: 'n8n-nodes-base.manualTrigger' },
    {
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      parameters: {
        url: 'https://api.example.com/users',
        method: 'GET',
        dataType: 'json'
      }
    },
    {
      name: 'Slack',
      type: 'n8n-nodes-base.slack',
      parameters: {
        resource: 'message',
        operation: 'post',
        channel: '#general',
        text: '={{ $json.users.length }} users fetched from API'
      }
    }
  ]
}
```

**Generated Documentation**:
```markdown
# HTTP to Slack Notification

## Overview
**Purpose**: Fetch user data from external API and send count notification to Slack
**Trigger**: Manual trigger (for testing and on-demand execution)
**Output**: Slack message with user count

## How It Works
1. Trigger workflow manually or via webhook
2. Send HTTP GET request to https://api.example.com/users
3. Parse JSON response containing user list
4. Extract user count from response
5. Send Slack notification with count to #general channel

## Data Flow
```
Manual Trigger → HTTP Request (GET /users) → Slack (post message)
```

## Requirements
- **Slack Credentials**: OAuth2 or API key for posting messages
- **External API**: Access to https://api.example.com/users endpoint

## Use Cases
- Scheduled monitoring of user count changes
- Daily reporting of system metrics
- Integration testing for API availability
- Alert notifications when user count exceeds threshold
```

### Example 2: RAG Workflow Usage Guide

**Input**:
```typescript
{
  id: 'workflow-uuid-456',
  name: 'Document RAG Workflow',
  nodes: [
    { name: 'Manual Trigger' },
    { name: 'Document Loader' },
    { name: 'Text Splitter' },
    { name: 'Embeddings OpenAI' },
    { name: 'Vector Store' }
  ]
}
```

**Generated Usage Guide**:
```markdown
# Document RAG Workflow - Usage Guide

## Prerequisites
- [ ] OpenAI API key (for embeddings)
- [ ] Vector database account (Pinecone, Weaviate, or similar)
- [ ] Document files (PDF, TXT, or HTML)

## Setup Instructions

### Step 1: Import Workflow
1. Download the workflow JSON file
2. Go to n8n → Import workflow
3. Select `document-rag-workflow.json`

### Step 2: Configure Credentials
1. **OpenAI API Key**:
   - Go to Settings → Credentials
   - Add new credential: OpenAI
   - Enter your API key from https://platform.openai.com/api-keys

2. **Vector Database**:
   - Add credential for your vector database (e.g., Pinecone)
   - Enter API key and environment details

### Step 3: Configure Parameters
1. **Document Loader**:
   - **documentType**: Select file type (PDF, TXT, HTML)
   - **filePath**: Path to documents to load
   - Example: `/data/documents/*.pdf`

2. **Text Splitter**:
   - **chunkSize**: Number of characters per chunk (default: 1000)
   - **chunkOverlap**: Overlap between chunks (default: 200)
   - Example: `1000` / `200`

3. **Embeddings OpenAI**:
   - **model**: Embedding model to use
   - Example: `text-embedding-ada-002`

4. **Vector Store**:
   - **namespace**: Collection name in vector database
   - Example: `documents`

### Step 4: Test Workflow
1. Click "Execute Workflow"
2. Verify documents are loaded successfully
3. Check vector database for new embeddings
4. Activate for continuous document ingestion

## Configuration Options

### Document Loading
- **Supported Formats**: PDF, TXT, HTML, Markdown
- **Batch Size**: Process up to 100 documents per execution
- **File Watching**: Enable to auto-process new documents

### Chunking Strategy
- **Fixed Size**: Consistent chunk sizes (recommended for most use cases)
- **Semantic**: Split by paragraphs or sections (better context preservation)
- **Hybrid**: Combine fixed size with semantic boundaries

### Embeddings
- **Model Selection**: `text-embedding-ada-002` (recommended), `text-embedding-3-small`, `text-embedding-3-large`
- **Batch Processing**: Process 100 chunks per API call for efficiency

## Troubleshooting

### "Document Loader failed to read files"
**Solution**: Check file paths and permissions. Ensure n8n has read access to document directory.

### "OpenAI API rate limit exceeded"
**Solution**: Reduce batch size or add delay between API calls. Upgrade OpenAI plan if needed.

### "Vector database connection timeout"
**Solution**: Verify API credentials and network connectivity. Check vector database service status.

### "Embeddings dimension mismatch"
**Solution**: Ensure all embeddings use the same model. Re-process documents if model changed.
```

### Example 3: Node Configuration Documentation

**Input**: HTTP to Slack workflow

**Generated Node Configuration Doc**:
```markdown
# Node Configuration: HTTP to Slack Notification

## Manual Trigger
**Type**: `n8n-nodes-base.manualTrigger`
**Purpose**: Start workflow manually for testing or on-demand execution

### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| _No parameters_ | - | Manual trigger has no configuration parameters |

## HTTP Request
**Type**: `n8n-nodes-base.httpRequest`
**Purpose**: Fetch user data from external API endpoint

### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| url | `https://api.example.com/users` | API endpoint to fetch user data |
| method | `GET` | HTTP method for request |
| dataType | `json` | Expected response data type |
| sendHeaders | `false` | Do not send custom headers |
| sendQuery | `false` | Do not send query parameters |
| sendBody | `false` | Do not send request body |

### Expressions
_No dynamic expressions used in this node_

## Slack
**Type**: `n8n-nodes-base.slack`
**Purpose**: Send notification message to Slack channel with user count

### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| resource | `message` | Slack resource type |
| operation | `post` | Post a new message |
| channel | `#general` | Slack channel to post message |
| text | `={{ $json.users.length }} users fetched from API` | Message text with dynamic user count |

### Expressions
- **text**: `={{ $json.users.length }} users fetched from API`
  - Purpose: Display user count in Slack message
  - Input: JSON response from HTTP Request node with `users` array
  - Output: String like "42 users fetched from API"
```

## Integration with Other Agents

### Workflow Orchestrator Integration

**Documentation Generation After Workflow Creation**:
```typescript
// After workflow generated and validated
const workflow = await workflowOrchestrator.generateWorkflow(requirements);

// Generate comprehensive documentation
const docs = {
  description: await documentationSpecialist.generateWorkflowDescription(workflow),
  usageGuide: await documentationSpecialist.generateUsageGuide(workflow),
  nodeConfig: await documentationSpecialist.generateNodeConfigurationDoc(workflow)
};

// Save documentation
fs.writeFileSync('workflow-description.md', docs.description);
fs.writeFileSync('usage-guide.md', docs.usageGuide);
fs.writeFileSync('node-configuration.md', docs.nodeConfig);
```

### Testing Specialist Integration

**Test Documentation Generation**:
```typescript
// After test execution
const testReport = await testingSpecialist.executeTestSuite(testSuite);

// Generate test documentation
const testDocs = await documentationSpecialist.generateTestDocumentation(testReport);

fs.writeFileSync('test-report.md', testDocs);
```

## Performance Metrics

- **Workflow Description**: 500ms-1s generation time
- **Usage Guide**: 1-2s generation time (depends on complexity)
- **Node Configuration Doc**: 500ms-1s generation time
- **README Generation**: 2-5s for collections (multiple workflows)
- **Export to PDF**: 3-10s (using markdown-pdf conversion)

## Export Formats

### Supported Formats

```typescript
enum DocumentationFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
  JSON = 'json'
}
```

### Export Functions

```typescript
async function exportDocumentation(
  workflow: Workflow,
  format: DocumentationFormat
): Promise<string | Buffer> {
  const markdownDoc = await generateAllDocumentation(workflow);

  switch (format) {
    case DocumentationFormat.MARKDOWN:
      return markdownDoc;

    case DocumentationFormat.HTML:
      return convertMarkdownToHTML(markdownDoc);

    case DocumentationFormat.PDF:
      return convertMarkdownToPDF(markdownDoc);

    case DocumentationFormat.JSON:
      return JSON.stringify({
        workflow: workflow.name,
        documentation: {
          description: generateWorkflowDescription(workflow),
          usageGuide: generateUsageGuide(workflow),
          nodeConfig: generateNodeConfigurationDoc(workflow)
        }
      }, null, 2);
  }
}
```

## TypeScript Interfaces

```typescript
interface WorkflowDocumentation {
  description: string;
  usageGuide: string;
  nodeConfiguration: string;
  readme?: string;
}

interface NodeDocumentation {
  nodeName: string;
  nodeType: string;
  purpose: string;
  parameters: ParameterDoc[];
  expressions: ExpressionDoc[];
}

interface ParameterDoc {
  name: string;
  value: any;
  description: string;
}

interface ExpressionDoc {
  parameter: string;
  expression: string;
  purpose: string;
  inputFormat: string;
  outputFormat: string;
}

interface WorkflowCollection {
  name: string;
  description: string;
  workflows: Array<{
    name: string;
    purpose: string;
    triggerType: string;
    filename: string;
    slug: string;
  }>;
  repoUrl?: string;
}
```

## Documentation Best Practices

### 1. Clear and Concise

- Use simple language, avoid jargon
- Explain technical terms when necessary
- Provide examples for complex concepts

### 2. User-Focused

- Write from the user's perspective
- Include prerequisites and setup instructions
- Provide troubleshooting for common issues

### 3. Complete and Accurate

- Document all parameters and configurations
- Explain all expressions and dynamic values
- Include use cases and examples

### 4. Maintainable

- Use templates for consistency
- Auto-generate documentation when possible
- Version documentation with workflow changes

### 5. Accessible

- Support multiple formats (Markdown, HTML, PDF)
- Include diagrams and visual aids
- Provide search-friendly structure
