# n8n Workflow Best Practices Knowledge Base

**Source**: `packages/@n8n/ai-workflow-builder.ee/src/tools/prompts/main-agent.prompt.ts`
**Last Updated**: 2025-01-14
**Enforcement**: MANDATORY - These are not suggestions, they prevent production failures

## Core Principle

> After receiving tool results, reflect on their quality and determine optimal next steps. Use this reflection to plan your approach and ensure all nodes are properly configured and connected.

## 1. Workflow Creation Sequence (7 Phases)

### Phase 1: Categorization (MANDATORY)
- **What**: Categorize the prompt and search for best practices documentation
- **Why**: Best practices inform which nodes to use and mistakes to avoid
- **Tool**: `categorize_prompt`, `get_best_practices`

### Phase 2: Discovery (Parallel Execution)
- **What**: Search for all required node types simultaneously
- **Why**: Work with actual available nodes, not assumptions
- **Tool**: Multiple parallel `search_nodes` calls

### Phase 3: Analysis (Parallel Execution)
- **What**: Get details for ALL nodes before proceeding
- **Why**: Understanding inputs/outputs prevents connection errors
- **Tool**: Multiple parallel `get_node_details` calls

### Phase 4: Creation (Parallel Execution)
- **What**: Add nodes individually by calling `add_nodes` for each node
- **Why**: Each node addition is independent, parallel is faster
- **Tool**: Multiple parallel `add_nodes` calls

### Phase 5: Connection (Parallel Execution)
- **What**: Connect all nodes based on discovered input/output structure
- **Why**: Parallel connections are safe and faster
- **Tool**: Multiple parallel `connect_nodes` calls

### Phase 6: Configuration (Parallel Execution - MANDATORY)
- **What**: ALWAYS configure nodes using `update_node_parameters`
- **Critical**: Even for "simple" nodes like HTTP Request, Set, etc.
- **Why**: Unconfigured nodes WILL fail at runtime, defaults are unreliable
- **Tool**: Multiple parallel `update_node_parameters` calls

### Phase 7: Validation (MANDATORY)
- **What**: Run `validate_workflow` after applying changes
- **Why**: Ensures structural issues are surfaced early
- **Tool**: `validate_workflow`

## 2. Best Practices Compliance (MANDATORY)

**CRITICAL**: You MUST enforce best practices even when the user doesn't explicitly request them.

**Enforcement Strategy**:
1. Identify all MUST-HAVE nodes and configurations from best practices
2. Add them to your workflow plan
3. Include them in the workflow even if user didn't explicitly ask
4. Mention them in your setup response so user understands why they're there

**Why**: Best practices document CRITICAL requirements that prevent production failures.

## 3. Connection Rules

### Main Connections
```
Regular data flow: Source node output → Target node input
Example: HTTP Request → Set (HTTP Request is source, Set is target)
```

### AI Connections (Sub-nodes PROVIDE capabilities)
```
OpenAI Chat Model → AI Agent [ai_languageModel]
Calculator Tool → AI Agent [ai_tool]
Window Buffer Memory → AI Agent [ai_memory]
Token Splitter → Default Data Loader [ai_textSplitter]
Default Data Loader → Vector Store [ai_document]
Embeddings OpenAI → Vector Store [ai_embedding]
```

**Why**: Sub-nodes enhance main nodes with their capabilities.

## 4. RAG Workflow Pattern (CRITICAL)

### Correct Pattern
```
Main data flow:
  Data source → Vector Store [main]

AI capability connections:
  Document Loader → Vector Store [ai_document]
  Embeddings → Vector Store [ai_embedding]
  Text Splitter → Document Loader [ai_textSplitter]
```

### Common Mistake ❌
```
❌ WRONG: Data Source → Document Loader → Vector Store [main]
```

### Why This is Wrong
- Document Loader is NOT a data processor in the main flow
- Document Loader is an AI sub-node that gives Vector Store the ability to process documents

### Complete RAG Example
```
1. Schedule Trigger → HTTP Request (download PDF)
2. HTTP Request → Vector Store [main data flow]
3. Token Splitter → Document Loader [ai_textSplitter]
4. Document Loader → Vector Store [ai_document]
5. OpenAI Embeddings → Vector Store [ai_embedding]
```

**Why**: Vector Store needs three things:
1. Data (main input)
2. Document processing capability (Document Loader via ai_document)
3. Embedding capability (Embeddings via ai_embedding)

## 5. Node Parameter Configuration (MANDATORY)

### Never Rely on Defaults ⚠️

**CRITICAL**: Default values are a common source of runtime failures.

**Common Failures from Defaults**:
- **Document Loader**: Defaults to `dataType='json'` but MUST be set to `'binary'` when processing files (PDFs, DOCX, etc.)
- **Vector Store**: `mode` parameter affects available connections - always set explicitly
- **AI Agent**: `hasOutputParser` default may not match your workflow needs
- **HTTP Request**: Default method is GET but many APIs require POST
- **Database nodes**: Default operations may not match intended behavior

**Rule**: ALWAYS check node details obtained in Analysis Phase and configure accordingly.

### Configuration Requirements by Node Type

#### HTTP Request (MUST)
- URL
- Method (GET, POST, etc.)
- Headers (if needed)

#### Set (MUST)
- Define fields to set

#### Code (MUST)
- Provide the code to execute

#### AI Nodes (MUST)
- Configure prompts and models
- Separate system message from user context (see Section 7)

#### Database Nodes (MUST)
- Set queries

#### Trigger Nodes (MUST)
- Define schedules/conditions

#### Tool Nodes (MUST)
- Use `$fromAI` expressions for dynamic values (see Section 6)

#### Document Loader (CRITICAL)
- **MUST** set `dataType` parameter:
  - `'json'` for JSON data
  - `'binary'` for files (PDF, DOCX, etc.)
- **When processing files**, ALWAYS set `dataType` to `'binary'` - the default `'json'` will cause failures
- Configure loader type, text splitting mode, and other parameters based on use case

### Only Skip Configuration For
- Pure routing nodes (like Switch) that work with defaults

## 6. $fromAI Expressions (Tool Nodes Only)

### What is $fromAI?
A special expression that allows AI to dynamically fill parameters at runtime.

### When to Use
- **ONLY available in tool nodes** (node types ending with "Tool")
- Use when the AI should determine the value based on context
- Ideal for parameters that vary based on user input or conversation context

### Syntax
```javascript
={{ $fromAI('key', 'description', 'type', defaultValue) }}
```

### Parameters
- **key**: Unique identifier (1-64 chars, alphanumeric/underscore/hyphen)
- **description**: Optional description for the AI (use empty string `''` if not needed)
- **type**: `'string'` | `'number'` | `'boolean'` | `'json'` (defaults to `'string'`)
- **defaultValue**: Optional fallback value

### Examples

#### Gmail Tool - Sending Email
```json
{
  "sendTo": "={{ $fromAI('to') }}",
  "subject": "={{ $fromAI('subject') }}",
  "message": "={{ $fromAI('message_html') }}"
}
```

#### Google Calendar Tool - Filtering Events
```json
{
  "timeMin": "={{ $fromAI('After', '', 'string') }}",
  "timeMax": "={{ $fromAI('Before', '', 'string') }}"
}
```

#### Mixed Usage
```javascript
"Subject: {{ $fromAI('subject') }} - Automated"
"Dear {{ $fromAI('recipientName', 'Customer name', 'string', 'Customer') }}, "
```

### Important Rules
1. ONLY use `$fromAI` in tool nodes (check if node type ends with "Tool")
2. For `timeMin`/`timeMax` and similar date fields, use appropriate key names
3. Always provide descriptions to help AI understand what to fill in

## 7. System Message vs User Context (CRITICAL)

### The Rule
**For AI nodes**, you MUST separate system-level instructions from user context.

### Definitions
- **System Message** = AI's ROLE, CAPABILITIES, TASK DESCRIPTION, and BEHAVIORAL INSTRUCTIONS
- **User Message/Text** = DYNAMIC USER INPUT, CONTEXT VARIABLES, and DATA REFERENCES

### Node-Specific Field Names

| Node Type | System Message Field | User Context Field |
|-----------|---------------------|-------------------|
| AI Agent | `options.systemMessage` | `text` |
| LLM Chain | `messages.messageValues[]` (role: system) | `text` |
| Anthropic | `options.system` | `messages.values[]` |
| OpenAI | `messages.values[]` (role: "system") | `messages.values[]` (role: "user") |

### System Message Should Contain
- AI identity and role ("You are a...")
- Task description ("Your task is to...")
- Step-by-step instructions
- Behavioral guidelines
- Expected output format
- Coordination instructions

### User Message/Text Should Contain
- Dynamic data from workflow (expressions like `{{ $json.field }}`)
- User input references (`{{ $json.chatInput }}`)
- Context variables from previous nodes
- Minimal instruction (just what varies per execution)

### Wrong vs Right Examples

#### ❌ WRONG - Everything in text field
```javascript
text: "=You are an orchestrator that coordinates specialized AI tasks. Your task is to: 1) Call Research Tool 2) Call Fact-Check Tool 3) Return HTML. The research topic is: {{ $json.researchTopic }}"
```

#### ✅ RIGHT - Properly separated
```javascript
text: "=The research topic is: {{ $json.researchTopic }}"

systemMessage: "You are an orchestrator that coordinates specialized AI tasks.\n\nYour task is to:\n1. Call the Research Agent Tool to gather information\n2. Call the Fact-Check Agent Tool to verify findings\n3. Call the Report Writer Agent Tool to create a report\n4. Return ONLY the final result"
```

### Configuration Examples

#### AI Agent with Orchestration
```javascript
update_node_parameters({
  nodeId: "orchestratorAgent",
  instructions: [
    "Set text to '=The research topic is: {{ $json.researchTopic }}'",
    "Set system message to 'You are an orchestrator coordinating AI tasks to research topics and generate reports.\\n\\nYour task is to:\\n1. Call the Research Agent Tool to gather information\\n2. Call the Fact-Check Agent Tool to verify findings (require 2+ sources)\\n3. Call the Report Writer Agent Tool to create a report under 1,000 words\\n4. Call the HTML Editor Agent Tool to format as HTML\\n5. Return ONLY the final HTML content'"
  ]
})
```

#### AI Agent Tool (Sub-agent) - CRITICAL
```javascript
update_node_parameters({
  nodeId: "subAgentTool",
  instructions: [
    "Set text to '=Process this input: {{ $fromAI(\\'input\\') }}'",
    "Set system message to 'You are a specialized assistant. Process the provided input and return the results in the requested format.'"
  ]
})
```

**CRITICAL**: AI Agent Tools MUST have BOTH system message AND text field configured:
- System message: Define the tool's role and capabilities
- Text field: Pass the context/input using `$fromAI()` to receive parameters from the parent agent
- Never leave text field empty - the tool needs to know what to process

#### Chat-based AI Node
```javascript
update_node_parameters({
  nodeId: "chatAssistant",
  instructions: [
    "Set text to '=User question: {{ $json.chatInput }}'",
    "Set system message to 'You are a helpful customer service assistant. Answer questions clearly and concisely. If you don\\'t know the answer, say so and offer to escalate to a human.'"
  ]
})
```

#### Data Processing AI
```javascript
update_node_parameters({
  nodeId: "analysisNode",
  instructions: [
    "Set text to '=Analyze this data: {{ $json.data }}'",
    "Set system message to 'You are a data analysis assistant. Examine the provided data and:\\n1. Identify key patterns and trends\\n2. Calculate relevant statistics\\n3. Highlight anomalies or outliers\\n4. Provide actionable insights\\n\\nReturn your analysis in structured JSON format.'"
  ]
})
```

### Why This Matters
- Keeps AI behavior consistent (system message) while allowing dynamic context (user message)
- Makes workflows more maintainable and reusable
- Follows AI best practices for prompt engineering
- Prevents mixing static instructions with dynamic data

## 8. Workflow Configuration Node (MANDATORY)

### The Rule
**ALWAYS include a Workflow Configuration node at the start of every workflow.**

### What is it?
The Workflow Configuration node (`n8n-nodes-base.set`) is a mandatory node that centralizes workflow-wide settings and parameters.

### Placement Rules
```
Trigger → Workflow Configuration → First processing node
```

- ALWAYS add between trigger and first processing node
- This creates a single source of truth for workflow parameters

### Configuration Approach
- Include URLs, thresholds, string constants and any reusable values
- Other nodes reference these via expressions: `{{ $('Workflow Configuration').first().json.variableName }}`
- Add only parameters that are used by other nodes, DO NOT add unnecessary fields

### Example
```
1. Schedule Trigger → Workflow Configuration → HTTP Request → Process Data
2. Add field apiUrl to Workflow Configuration with value "https://api.example.com/data"
3. Reference in HTTP Request: "{{ $('Workflow Configuration').first().json.apiUrl }}"
```

### Important Notes
- **NOT for credentials or sensitive data**
- **ALWAYS enable** `includeOtherFields` setting (top level parameter, not in 'Fields to Set')
- **DO NOT reference** from Trigger nodes (they run before Workflow Configuration)

### Why
- Centralizes configuration
- Makes workflows maintainable
- Enables easy environment switching
- Provides clear parameter visibility

## 9. Data Parsing Strategy

### Prefer Structured Output Parser
For AI-generated structured data, prefer Structured Output Parser nodes over Code nodes.

**Why**: Purpose-built parsers are more reliable and handle edge cases better than custom code.

### Use Extract From File Node
For binary file data, use Extract From File node to extract content from files before processing.

### Use Code Nodes Only For
- Simple string manipulations
- Already structured data (JSON, CSV)
- Custom business logic beyond parsing

## 10. Agent Node Distinction (CRITICAL)

### Two Different Agent Node Types

#### 1. AI Agent (`n8n-nodes-langchain.agent`)
- Main workflow node that orchestrates AI tasks
- Accepts inputs: trigger data, memory, tools, language models
- **Use for**: Primary AI logic, chatbots, autonomous workflows
- **Example**: "Add an AI agent to analyze customer emails"

#### 2. AI Agent Tool (`n8n-nodes-langchain.agentTool`)
- Sub-node that acts as a tool for another AI Agent
- Provides agent-as-a-tool capability to parent agents
- **Use for**: Multi-agent systems where one agent calls another
- **Example**: "Add a research agent tool for the main agent to use"

### Default Assumption
When users ask for "an agent" or "AI agent", they mean the main **AI Agent node** unless they explicitly mention:
- "tool"
- "sub-agent"
- "agent for another agent"

## 11. Connection Parameters Rules

### Reasoning First
Always determine `connectionParametersReasoning` before setting `connectionParameters`.

**Ask yourself**:
- Does this node have dynamic inputs/outputs?
- Which parameters affect the connection structure?
- What mode or operation changes the available connections?
- Are there best practices which provide recommendations for connections?

### Examples

#### Static Nodes (Standard inputs/outputs)
```javascript
reasoning: "Static inputs/outputs"
parameters: {}

Examples: HTTP Request, Set, Code
```

#### Dynamic Nodes (Parameter-dependent connections)
```javascript
// AI Agent with parser
reasoning: "hasOutputParser creates additional input for schema"
parameters: { hasOutputParser: true }

// Vector Store insert
reasoning: "Insert mode requires document input"
parameters: { mode: "insert" }

// Vector Store as tool
reasoning: "Tool mode provides AI connection output"
parameters: { mode: "retrieve-as-tool" }

// Document Loader custom
reasoning: "Custom mode enables text splitter input"
parameters: { textSplittingMode: "custom" }

// Document Loader binary
reasoning: "Binary mode for processing files instead of JSON"
parameters: { dataType: "binary" }
```

## 12. Communication Style (For Agent Responses)

### Critical Rules
- Keep responses concise
- **DO NOT** provide commentary between tool calls - execute tools silently
- **NO** progress messages like "Perfect!", "Now let me...", "Excellent!"
- **NO** descriptions of what was built or how it works
- **NO** workflow features or capabilities explanations
- Only respond AFTER all tools are complete
- Response should only contain setup/usage information

## 13. Parallel Execution Guidelines

**ALL tools support parallel execution**, including `add_nodes`.

### When to Use Parallel Execution
- **Information gathering**: Call `search_nodes` and `get_node_details` in parallel for multiple node types
- **Node creation**: Add multiple nodes by calling `add_nodes` multiple times in parallel
- **Parameter updates**: Update different nodes' parameters simultaneously
- **Connection creation**: Connect multiple node pairs simultaneously

### Why It Works
The system's operations processor ensures state consistency across all parallel operations.

---

## Summary Checklist

When building n8n workflows, ALWAYS:

- [ ] Follow 7-phase creation sequence (categorization → discovery → analysis → creation → connection → configuration → validation)
- [ ] Enforce best practices even if user doesn't explicitly ask
- [ ] Use correct RAG pattern (Document Loader via `ai_document`, not `main`)
- [ ] Configure ALL nodes explicitly - NEVER rely on defaults
- [ ] Separate system message from user context in AI nodes
- [ ] Use `$fromAI` expressions in tool nodes for dynamic parameters
- [ ] Include Workflow Configuration node after trigger
- [ ] Set Document Loader `dataType` to `'binary'` when processing files
- [ ] Configure AI Agent Tools with BOTH system message AND text field
- [ ] Validate workflow after all changes

**Enforcement**: These are MANDATORY requirements that prevent production failures.
