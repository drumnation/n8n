# Brain Monitor - Development Rules for AI Agents

Validation orchestration tooling

**Generated:** 2025-10-22
**Source:** .cursor/rules-source/*.mdc (auto-generated from modular rules)
**Context:** monorepo, global, node, backend, tooling, validation, monitoring

---

## Core Rules (Always Apply)

### monorepo-structure-and-configuration


# Monorepo Structure and Configuration (v4)

## ⚠️ CRITICAL STRUCTURAL UNDERSTANDING

This document contains ESSENTIAL information about how the monorepo is structured and the development philosophy behind it. It must be understood for ALL operations in the codebase.

### Core Principles

1.  **ESM-Only:** We exclusively use ES Modules. CommonJS (`require`, `module.exports`) is not used. This simplifies our tooling and aligns with the modern JavaScript ecosystem.
2.  **No Build Step for Libraries:** Packages in `/packages` are not "built" into a `dist` folder. We export TypeScript source files (`.ts`, `.tsx`) directly. A runtime transpiler (like `tsx`) handles this for us, enabling instantaneous hot-reloading and simpler debugging.
3.  **Configuration is SHARED:** All tooling configuration (ESLint, Prettier, TypeScript, Testing) is centralized in the `/tooling` directory and consumed by all other workspaces. **DO NOT** create duplicate or one-off configurations.
4.  **Strict Naming & Structure:** Packages and folder structures follow a strict, predictable pattern. **DO NOT** deviate from it.
5.  **Agent Coordination First:** Before running any command, always check the `_errors/` and `_logs/` directories managed by `@kit/brain-monitor` to prevent redundant work.

### Devil's Advocate: Why No CommonJS?

You're right to want to keep things simple with ESM-only. But for the sake of completeness, here's the trade-off:

  * **Pros (Our Approach):** Massively simplified build process (or lack thereof), single module system to reason about, aligns with web standards, and enables cleaner, more modern syntax like top-level `await`.
  * **Cons:** Dropping CJS means older Node.js environments or tools that *only* support `require()` cannot consume our packages natively. Since we control the entire stack within this monorepo and all our applications are ESM-compatible, this is a trade-off we gladly accept for the significant boost in developer experience and simplicity.

-----

## 📂 Monorepo Layout

```txt
/apps          Executable applications (e.g., servers, web frontends)
/packages      Shared libraries consumed by apps or other packages
/tooling        Shared tooling and configuration (`@kit/*`)
/_errors        Real-time validation failure reports (via @kit/brain-monitor)
/_logs          Real-time server logs (via @kit/brain-monitor)
```

### 🏷 Naming Patterns

Packages must be scoped to align with their location and purpose.

```txt
/apps          @[app-name]
/packages      @[app-name]/[package-name]
/tooling       @kit/*
```

-----

## 📦 Package Configuration (The "No Build" Way)

This is the most critical change from `v3`. Library packages in `/packages` **do not have a build step**.

### `package.json` Template for a Library

This is the standard template for any new or converted library in `/packages`.

```json
{
  "name": "@[app-name]/[package-name]",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    // Points directly to the TypeScript source file
    ".": "./src/index.ts",
    // Allows importing sub-modules directly
    "./*": "./src/*.ts"
  },
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "files": [
    "src"
  ],
  "scripts": {
    "clean": "rimraf node_modules .turbo",
    "format": "prettier --check \"**/*.{ts,tsx,md}\"",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@kit/env-loader": "workspace:*"
  },
  "devDependencies": {
    "@kit/eslint-config": "workspace:*",
    "@kit/prettier-config": "workspace:*",
    "@kit/testing": "workspace:*",
    "@kit/tsconfig": "workspace:*"
  },
  "eslintConfig": {
    "root": true,
    "extends": [
      "@kit/eslint-config/base"
    ]
  },
  "prettier": "@kit/prettier-config"
}
```

### `tsconfig.json` for a Library

Note the absence of `"outDir"` and `"declaration"`. We are not compiling to a separate directory.

```json
{
  "extends": "@kit/tsconfig/node", // or "@kit/tsconfig/react"
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

-----

## 🚀 Root `package.json` & Turbo Pipeline

The root `package.json` contains scripts that run across the entire monorepo using Turborepo. The `turbo.json` file configures the dependency graph and caching for these tasks.

### Root `package.json`

```json
{
  "name": "your-monorepo-name",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "clean": "turbo run clean",
    "format": "turbo run format",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",

    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:unit": "turbo run test:unit",
    "test:integration": "turbo run test:integration",
    "test:e2e": "turbo run test:e2e",
    "test:storybook": "turbo run test:storybook",
    "test:e2e:browser": "turbo run test:e2e:browser",

    "brain:validate": "turbo run validate",
    "brain:logs": "pnpm --filter=@kit/brain-monitor run logs",
    "brain:typecheck-failures": "pnpm --filter=@kit/brain-monitor run typecheck-failures",
    "brain:test-failures": "pnpm --filter=@kit/brain-monitor run test-failures",
    "brain:lint-failures": "pnpm --filter=@kit/brain-monitor run lint-failures",
    "brain:format-failures": "pnpm --filter=@kit/brain-monitor run format-failures"
  },
  "devDependencies": {
    "turbo": "latest",
    "tsx": "latest",
    "typescript": "latest"
  },
  "packageManager": "pnpm@9.x.x"
}
```

### Root `turbo.json`

This pipeline is configured for our "no-build" library strategy and includes the agentic validation tasks.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "cache": true
    },
    "typecheck": {
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "validate": {
      "dependsOn": ["lint", "typecheck", "test"],
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

  * **`build`**: Only applies to `apps`. `dist/**` and `.next/**` are specified as outputs for caching. Libraries have no `build` script, so Turbo ignores them for this task.
  * **`dev` / `test:watch`**: Marked as non-cacheable and persistent for long-running processes.
  * **`lint` / `typecheck` / `test`**: These tasks are fully cacheable. If the source files haven't changed, the results are pulled from the cache instantly.
  * **`validate`**: This is the master task for `@kit/brain-monitor`. It depends on all other validation tasks completing first.

-----

## 🧪 Unified Testing – `@kit/testing`

The `@kit/testing` package provides a unified, modern, and highly modular testing framework for the entire monorepo. It uses a lazy-loaded API to improve performance.

### Available Configurations & Modern API

Instead of importing a static config object, you now call an async function that returns a configuration. This is faster and more flexible.

| Legacy Export (v3)                | Modern API (v4)                               | Purpose                               |
| --------------------------------- | --------------------------------------------- | ------------------------------------- |
| `unitConfig`                      | `await configs.vitest.unit()`                 | Unit tests (Vitest + JSDOM)           |
| `integrationConfig`               | `await configs.vitest.integration()`          | Integration tests (Vitest + Node)     |
| `e2eConfig`                       | `await configs.vitest.e2e()`                  | Backend/API E2E tests (Vitest)        |
| `storybookConfig`                 | `await configs.vitest.storybook()`            | Storybook component tests (Vitest)    |
| `playwrightConfig`                | `await configs.playwright.browser()`          | Browser E2E tests (Playwright)        |
| `playwrightBackendConfig`         | `await configs.playwright.api()`              | Backend/API tests (Playwright)        |
| `storybookE2EConfig`              | `await configs.playwright.storybook()`        | Storybook E2E tests (Playwright)      |
| `testRunnerConfig`                | `await configs.storybook.testRunner()`        | For `@storybook/test-runner`          |

### Example `vitest.config.ts` (Modern API)

```typescript
// vitest.config.ts
import { mergeConfig } from 'vitest/config';
import { configs, presets } from '@kit/testing';

// Load the base configuration asynchronously
const baseConfig = await configs.vitest.unit();

// Merge with custom overrides using presets
export default mergeConfig(baseConfig, {
  test: {
    // Use a stricter coverage preset
    coverage: presets.coverage.strict,
    // Use a longer timeout preset
    ...presets.timeouts.medium,
  }
});
```

For the full API, migration steps, and available presets, see the detailed README in `tooling/testing/README.md`.

-----

## 🧠 Agent Coordination – `@kit/brain-monitor`

To prevent multiple AI agents from performing the same time-consuming tasks (like running tests or type-checking) and to provide a centralized place for debugging, we use `@kit/brain-monitor`.

**MANDATORY BEHAVIOR:** Before running any validation or server command, **ALWAYS check the `_errors/` and `_logs/` directories first.**

### Workflow

1.  **Check for Existing Errors:**

    ```bash
    # See if type-checking has already failed
    cat _errors/errors.typecheck-failures.md

    # See if any tests are failing
    cat _errors/errors.test-failures.md
    ```

2.  **Run Validation (Only if Needed):** If the reports are stale or empty, run the validation.

    ```bash
    # Run all validations and generate reports
    pnpm brain:validate

    # Or run just one
    pnpm brain:test-failures
    ```

3.  **Debug Servers:** Check logs before restarting a server.

    ```bash
    # Watch the API server log in real-time
    tail -f _logs/financial-api.log

    # Or start all dev servers with logging enabled
    pnpm dev
    ```

This workflow saves time and compute resources, and provides a clear task list for fixing issues. For full CLI details, see the README in `tooling/brain-monitor/README.md`.

-----

## 🔑 Environment Variables – `@kit/env-loader`

The `@kit/env-loader` package provides a standardized way to load and access environment variables across all applications and packages.

### Installation & Setup

It should be added as a dependency to any package that needs access to environment variables.

```bash
pnpm add @kit/env-loader
```

### Loading Order

The loader searches for `.env` files in a hierarchical order, with earlier locations taking precedence:

1.  **`monorepo-root/.env`**: Global variables shared across all apps.
2.  **`apps/my-app/.env`**: Local variables that override the global ones for a specific app.
3.  `process.env`: System-level environment variables (highest priority).

### Usage Example (Node.js Backend)

At the entry point of your application (`server.ts`, `index.ts`), load the environment.

```typescript
// In apps/backend/src/server.ts
import { loadEnvironment, requireEnv, getIntEnv } from '@kit/env-loader/node';

const result = loadEnvironment({
  appName: 'backend-api',
  required: ['DATABASE_URL', 'API_KEY']
});

if (!result.success) {
  console.error('FATAL: Missing required environment variables:', result.missingRequired);
  process.exit(1);
}

const PORT = getIntEnv('PORT', 8080);
const API_KEY = requireEnv('API_KEY'); // Throws an error if not found
```

### Usage Example (Browser Frontend)

In browser-based apps (e.g., Vite/React), the bundler exposes the variables. You only need the helper functions. **Remember to prefix public variables** (e.g., `VITE_`).

```typescript
// In apps/frontend/src/api/client.ts
import { getEnv, requireEnv } from '@kit/env-loader/browser';

const API_URL = getEnv('VITE_API_URL', 'http://localhost:8080');
const PUBLIC_KEY = requireEnv('VITE_STRIPE_PUBLIC_KEY');
```

This package does not require any `turbo.json` configuration as it runs at runtime within your application code. For more details, see `tooling/env-loader/README.md`.

---

## 🔗 Related Rules

### Backend Development Patterns

**For Express.js Applications:**
See `monorepo-node-express-architecture.rules.mdc` for:
- HTTP API server architecture
- File naming: `<feature>.<role>.ts`
- Routes, controllers, middleware patterns
- Express-specific DI with Effect/fp-ts

**For Scripts, CLIs, and Standalone Programs:**
See `node.functional-isolated-concerns.rules.mdc` for:
- Functional programming patterns (no classes)
- File organization: `feature/<name>.<purpose>.ts`
- Background workers and batch processors
- Pure functions and isolated concerns

**Decision Guide:**
- Building HTTP API? → Use Express Architecture
- Building script/CLI/worker? → Use Functional Isolated Concerns
- Both in same app? → Express for HTTP layer, Functional for utilities


---

## Contextual Rules (Apply When Relevant)

### brain-monitor-validation
**File Patterns:** _errors/**/*, _logs/**/*
**Scopes:** validation, monitoring, testing


# Brain Monitor Error Checking Rules

## 🧠 MANDATORY: Check Brain Monitor Reports First

Before running ANY validation commands, ALWAYS check the brain-monitor reports:

```bash
# 1. Check overall validation status FIRST
cat _errors/validation-summary.md

# 2. Check specific error reports if needed
cat _errors/reports/errors.typecheck-failures.md
cat _errors/reports/errors.test-failures-*.md
cat _errors/reports/errors.lint-failures.md
cat _errors/reports/errors.format-failures.md
```

## 📁 Brain Monitor Directory Structure

```txt
_errors/
├── validation-summary.md      # Overall status - check this FIRST
├── reports/                   # Detailed error reports
│   ├── errors.typecheck-failures.md
│   ├── errors.lint-failures.md
│   ├── errors.format-failures.md
│   └── errors.test-failures-*.md
└── .counts/                   # Hidden run count tracking

_logs/                         # Real-time server logs
└── [app-name].log
```

## 🚀 Brain Monitor Commands

| Task | Command | Output Location |
|------|---------|-----------------|
| All Validations | `pnpm brain:validate` | `_errors/validation-summary.md` |
| Watch Mode (Fast) | `pnpm brain:watch` | `_errors/watch-summary.md` + individual reports |
| Watch Mode (All) | `pnpm brain:watch --all` | `_errors/watch-summary.md` + individual reports |
| TypeScript Only | `pnpm brain:typecheck-failures` | `_errors/reports/errors.typecheck-failures.md` |
| Lint Only | `pnpm brain:lint-failures` | `_errors/reports/errors.lint-failures.md` |
| Format Only | `pnpm brain:format-failures` | `_errors/reports/errors.format-failures.md` |
| Unit Tests | `pnpm brain:test-failures-unit` | `_errors/reports/errors.test-failures-unit.md` |
| Integration Tests | `pnpm brain:test-failures-integration` | `_errors/reports/errors.test-failures-integration.md` |
| E2E Tests | `pnpm brain:test-failures-e2e` | `_errors/reports/errors.test-failures-e2e.md` |
| Server Logs | `pnpm brain:logs [app]?` | Real-time log monitoring |

## ⚡ Efficiency Rules

1. **ALWAYS** check `validation-summary.md` first - it has error counts for all validations
2. **ONLY** run validations if reports are stale (>10 minutes old) or don't exist
3. **NEVER** run `pnpm brain:validate` if you only need to check one type of error
4. **USE** specific commands (`brain:typecheck-failures`, etc.) for targeted validation
5. **PREFER** `pnpm brain:watch` for continuous feedback during development
6. **CHECK** `watch-summary.md` when watch mode is active

### How to Check if Reports are Stale

```bash
# Check if validation-summary.md is older than 10 minutes
if [ -f _errors/validation-summary.md ]; then
  AGE=$(find _errors/validation-summary.md -mmin +10 2>/dev/null | wc -l)
  if [ "$AGE" -eq 1 ]; then
    echo "Reports are stale, running validation..."
    pnpm brain:validate
  else
    echo "Reports are fresh, reading existing reports..."
    cat _errors/validation-summary.md
  fi
else
  echo "No reports found, running initial validation..."
  pnpm brain:validate
fi
```

## 🔄 Workflow

1. Check summary: `cat _errors/validation-summary.md`
2. If errors exist, check specific report: `cat _errors/reports/errors.[type]-failures.md`
3. Fix errors based on the report (see Related Rules section for fixing guidance)
4. Run ONLY the specific validation: `pnpm brain:[type]-failures`
5. Repeat until clean

Remember: The reports are your task lists - read them first, run commands second!

### Error Handling

**If `_errors/` directory doesn't exist:**
```bash
# Brain-monitor will create it on first run
pnpm brain:validate
```

**If brain-monitor package isn't installed:**
```bash
# Install it first
pnpm install
# Then run validation
pnpm brain:validate
```

**If validation-summary.md exists but specific report is missing:**
```bash
# Run the specific validation to regenerate it
pnpm brain:typecheck-failures  # or whichever is missing
```

### Example: validation-summary.md Content

```markdown
# Validation Summary

Last updated: 2025-01-15 14:30:22

## Status Overview
- ✅ TypeScript: 0 errors
- ⚠️  Linting: 3 warnings
- ❌ Tests: 2 failures
- ✅ Formatting: 0 issues

## Quick Actions
- Fix test failures: `cat _errors/reports/errors.test-failures-unit.md`
- Review lint warnings: `cat _errors/reports/errors.lint-failures.md`

## Next Steps
1. Fix failing tests in packages/auth
2. Address lint warnings in apps/client
```

---

## 🔗 Related Rules (Testing Trio)

This rule is part of the **Testing Trio** that provides comprehensive auto-validation:

1. **`brain-monitor-validation.rules.mdc`** (THIS RULE) - Coordinates agent communication via `_errors/` reports
2. **`tests.continuous-validation.rules.mdc`** - Auto-executes tests after changes
3. **`tests.unified-testing.rules.mdc`** - Ensures TDD methodology and test quality

### The Complete Auto-Validation Workflow

**STEP 1: Check Reports First** (brain-monitor)
```bash
cat _errors/validation-summary.md  # Check overall status
```

**STEP 2: Fix Issues** (unified-testing)
- Follow TDD 5-step process for new tests
- Use proper test patterns and quality standards

**STEP 3: Auto-Validation** (continuous-validation)
- Tests run automatically after changes
- Results written back to `_errors/` reports

**STEP 4: Repeat**
- Check reports again
- Fix remaining issues
- Continuous feedback loop

### Why All Three Rules?

**Without brain-monitor:** Agents waste time re-running validations
**Without continuous-validation:** Tests must be run manually
**Without unified-testing:** Tests are low-quality and brittle

**Together:** You get the "full king treatment" - automatic, high-quality validation with minimal effort.

---

## 📖 Error-Fixing Quick Reference

When reports show errors, consult these rules for fixing guidance:

| Error Type | Relevant Rule | Purpose |
|------------|---------------|---------|
| Test failures | `tests.unified-testing.rules.mdc` | TDD workflow, test patterns |
| TypeScript errors | `monorepo-structure-and-configuration.rules.mdc` | TypeScript configuration |
| Lint errors | (ESLint config in `/tooling`) | Code style standards |
| Format errors | (Prettier config in `/tooling`) | Code formatting rules |
| Component issues | `component-design-decision-tree.rules.mdc` | UI component patterns |

**Pro Tip:** After fixing errors, re-run ONLY the specific validation:
```bash
# Fixed TypeScript errors? Only run:
pnpm brain:typecheck-failures

# Fixed tests? Only run:
pnpm brain:test-failures-unit
```


### cm-proxy-rules
**File Patterns:** apps/server/src/modules/cm-proxy/**/*
**Scopes:** backend, api, proxy

Never use "Bearer {token}" format. CM API does not take that format. It just takes token.

### monorepo-documentation-strategy
**File Patterns:** docs/**/*, **/README.md, **/CHANGELOG.md
**Scopes:** documentation, monorepo

# Monorepo Documentation Strategy

<!-- ==================== METADATA ==================== -->
ruleType: always
description: >
  Comprehensive documentation strategy for monorepo projects covering location, format,
  maintenance, and cross-referencing standards.
whenToUse:
  - Creating new documentation
  - Updating existing documentation
  - After completing any feature or refactor
  - When adding new packages or apps to the monorepo
# =====================================================

## 📂 Documentation Location Hierarchy

The monorepo uses a hierarchical documentation approach to ensure domain knowledge is stored at the appropriate scope level.

### 1. Package/App-Level Documentation
- **Primary Location:** Inside each package or app in a `docs/` subfolder
  ```
  packages/ui/docs/            # UI package-specific docs
  apps/web/docs/               # Web app-specific docs
  ```
- **Purpose:** Package-specific implementation details, API usage, internal patterns

### 2. Feature-Level Documentation
- **Location:** `/docs/features/[feature-name]/`
- **Purpose:** Documentation for features that span multiple packages

### 3. Global Documentation
- **Location:**
  ```
  /docs/architecture/          # System-wide architecture
  /docs/concepts/              # Shared concepts and patterns
  /docs/architecture/adr/      # Architecture Decision Records
  ```
- **Purpose:** Project-wide knowledge and design decisions

### Documentation Placement Decision Matrix

| Documentation Type | Placement Location |
|--------------------|-------------------|
| Feature spanning multiple packages | `/docs/features/[feature-name]/` |
| Implementation in shared workspace package | `packages/[pkg]/docs/` |
| Package-level setup or design notes | `packages/[pkg]/README.md` or `packages/[pkg]/docs/` |
| App-specific implementation details | `apps/[app]/docs/` (if present) or `/docs/apps/[app]/` |
| Architectural decisions | `/docs/architecture/adr/` |

## 📄 Documentation Creation Standards

### File Naming
Use kebab-case filenames that reflect the topic clearly:
- `auth-token-refresh-flow.md`
- `data-fetching-patterns.md`
- `button-component-api.md`

### YAML Frontmatter (Required)

All documentation files must include YAML frontmatter with the following fields:

```yaml
---
title: "API Caching Pattern"
description: "Explains the custom caching strategy used in `@api` for SSR and client hydration."
keywords:
  - api
  - caching
  - SWR
  - react-query
  - ssr
  - hydration
related_features: ["dashboard-data-pipeline"]
related_concepts: ["react-query-vs-swr"]
related_adr: ["001-cache-layer-decision"]
last_updated: "YYYY-MM-DD"  # Always use ISO 8601 format
---
```

### Document Structure

1. **Introduction** (immediately after frontmatter)
   - 2-4 sentence summary of the document's purpose
   - Provides context for search and RAG indexing

2. **Content Sections**
   - Use clear H2/H3 headers with relevant keywords
   - Short, atomic sections are preferred over long narratives
   - Include code examples where appropriate
   - Use tables for comparisons or options

3. **Cross-References**
   - Link to related documentation as appropriate
   - Use standardized cross-linking (see section below)

4. **Conclusion**
   - Summary of key points
   - Next steps or related topics to explore

## 🔄 Documentation Maintenance

### Index File Updates

Update relevant `.index.md` files when creating or modifying documentation:

- `docs/features/features.index.md`
- `docs/concepts/concepts.index.md`
- `docs/architecture/adr.index.md`
- `docs/packages/[pkg]/[pkg].index.md` (if applicable)

For each document, add an entry with format:
```markdown
- [[Document Title]](./document-filename.md): Brief description.
```

### Avoiding Duplication

Before creating new documentation:
1. Check index files for similar topics
2. Search for existing documentation with similar keywords
3. If similar documentation exists, consider updating or expanding it instead

### Documentation Review

After significant changes:
1. Update the `last_updated` field in the frontmatter
2. Verify that all cross-links still work
3. Check that examples remain current
4. Ensure all index files are updated

## 🔗 Cross-Linking Standards

### Relative Path Links
Use relative paths when linking between documents in the same package or nearby:
```markdown
[Authentication Flow](mdc:../../shared/docs/auth-flow.md)
```

### Agent-Readable References
Use @ notation when referencing documentation for agent processing:
```markdown
@docs/packages/ui/index.md
```

### External Links
For external resources, include the full URL and consider adding a timestamp:
```markdown
[React Query Documentation](mdc:https:/tanstack.com/query/latest) (as of 2025-04)
```

## 📚 Documentation Types

### README.md Files
- **Purpose:** Quick start, installation, primary usage examples
- **Location:** Root of each package, app, and the monorepo

### API Documentation
- **Purpose:** Detailed interface specifications, usage guidelines
- **Location:** `packages/[pkg]/docs/api/`

### Architecture Decision Records (ADRs)
- **Purpose:** Document significant architectural decisions
- **Location:** `/docs/architecture/adr/`
- **Format:** Follow standard ADR template with:
  - Title and date
  - Status (proposed, accepted, superseded)
  - Context
  - Decision
  - Consequences

### Guides and Tutorials
- **Purpose:** Step-by-step instructions for common tasks
- **Location:** `packages/[pkg]/docs/guides/` or `/docs/guides/`

## 🔍 Documentation Lookup Priority

When searching for relevant documentation:

1. **First,** look for `docs/` within the current package or app
2. **Then,** check shared or global documentation areas
3. **Use** `.index.md` files to guide lookup
4. **Never** assume knowledge lives only in root-level documentation

## ✅ Documentation Completeness Checklist

- [ ] Appropriate location based on scope
- [ ] Complete YAML frontmatter
- [ ] Clear introduction and purpose statement
- [ ] Well-structured content with descriptive headings
- [ ] Code examples (if applicable)
- [ ] Cross-links to related documentation
- [ ] Updated index files
- [ ] Last updated timestamp is current

### monorepo-node-express-architecture
**File Patterns:** apps/server/**/*, services/**/*, apps/*/src/modules/**/*, apps/*/src/infra/**/*
**Scopes:** express, backend, api, node, mongodb

## **Cursor Agent Rule: Modular Monorepo Architecture & Enforcement**

**Objective:** Maintain a highly modular, consistent, and maintainable TypeScript/Node.js/Express codebase within a pnpm monorepo, optimized for AI agent processing and developer productivity.

**Core Principle:** Strict adherence to separation of concerns via bounded contexts, standardized naming, and automated enforcement.

### **1\. Monorepo & Project Structure**

* **Layout:** Use pnpm workspaces.  
  / (root)  
  ├─ package.json        \# defines workspaces: \["apps/\*", "packages/\*"\]  
  ├─ pnpm-workspace.yaml  
  ├─ tsconfig.base.json  \# Base TS config with path aliases  
  ├─ apps/  
  │   └─ server/         \# Main Express application  
  │       ├─ src/  
  │       ├─ package.json  
  │       └─ tsconfig.json \# Extends tsconfig.base.json  
  └─ packages/  
      ├─ auth/           \# Example reusable package (e.g., auth logic)  
      ├─ database/       \# Example shared DB connectors/models  
      └─ utils/          \# Example shared utility functions

* **Package Decision:** Move code to /packages/\* if:  
  * It's reused across multiple applications (/apps/\*).  
  * It requires independent versioning and release cycles.  
* **Application Structure (apps/server/src):**  
  src/  
  ├─ modules/            \# Feature-specific bounded contexts  
  │   └─ \<feature\>/      \# e.g., user, post, order  
  │       ├─ \<feature\>.\<role\>.ts \# (controller, service, repo, etc.)  
  │       ├─ \<feature\>.test.ts  
  │       └─ index.ts          \# Barrel file exporting public API ONLY  
  ├─ shared/             \# Code shared \*within\* this app only  
  │   ├─ logging/  
  │   ├─ errors/  
  │   └─ validation/       \# Shared validation schemas/logic  
  ├─ infra/              \# Infrastructure concerns (lowest level)  
  │   ├─ http/             \# Express server setup, middleware registration  
  │   │   ├─ server.ts  
  │   │   └─ routes.ts       \# Aggregates routes from modules  
  │   └─ db/               \# Database connection setup, migrations  
  │       └─ prisma.client.ts \# Or other ORM/DB client setup  
  └─ main.ts             \# Application entry point: bootstrap, DI container setup

### **2\. File Naming & Content Conventions**

* **Filename Pattern:** Strictly use \<feature\>.\<role\>.ts.  
* **Role Suffixes:** controller, service, repo (repository/data access), schema (validation, e.g., Zod), dto (Data Transfer Object), types, middleware, util, test.  
* **Single Responsibility:** Each file must address only *one* concern corresponding to its role suffix.  
  * \*.controller.ts: Handle HTTP request/response cycle, input validation (using DTOs/Schemas), delegate to services. **No business logic.**  
  * \*.service.ts: Contain core business logic, orchestrate calls to repositories or other services.  
  * \*.repo.ts: Abstract data persistence logic (database queries, external API calls).  
  * \*.schema.ts: Define validation schemas (e.g., Zod) for input/output.  
  * \*.dto.ts: Define plain data structures for transferring data (often validated by schemas).  
  * \*.types.ts: Define TypeScript interfaces/types specific to the feature module.  
  * \*.middleware.ts: Express middleware specific to a feature or shared.  
  * \*.util.ts: Pure helper functions specific to a feature or shared.  
  * \*.test.ts: Unit/integration tests for the corresponding feature module files.  
* **Barrel Exports (index.ts):** Each module (/modules/\<feature\>) **must** have an index.ts that explicitly exports only the necessary public API elements (e.g., controllers for routes, service interfaces if needed elsewhere). **Avoid export \***.

### **3\. Size & Complexity Limits (Enforced via Linting)**

* **Max File Length:** 500 lines (eslint: max-lines-per-file).  
* **Max Function Length:** 75 lines (eslint: max-lines-per-function).  
* **Cyclomatic Complexity:** ≤ 10 (eslint: complexity).  
* **Nesting Depth:** ≤ 4 (eslint: max-depth).  
* **Action:** If limits are exceeded, refactor immediately by extracting logic into smaller, focused functions or new files following the naming convention.

### 4. Dependency Management & Coupling

* **Dependency Injection (DI): Mandatory.**  
  *Use a *functional* DI approach—no classes or decorators.*

  * **Allowed toolkits (pick one):**  
    * `effect` Context/Layer  
    * `fp-ts` Reader / ReaderTaskEither  
    * Any lightweight, function-first injector (e.g. `typed-inject` used with plain functions).

  * **Services & Repositories** **must** be *pure factory functions* that return a value with callable methods, e.g.

    ```ts
    // makeUserRepo.ts
    export const makeUserRepo = (deps: { db: DbClient }) => ({
      list: () => deps.db.query<User[]>('SELECT * FROM users'),
    });
    ```

  * **Controllers / Routes** **must** be curried functions that take their dependencies first, then runtime params:

    ```ts
    // makeGetUsers.ts
    export const makeGetUsers =
      (userRepo: ReturnType<typeof makeUserRepo>) =>
        async (_req, res) => res.json(await userRepo.list());
    ```

  * **Composition root** wires *concrete* implementations once per app / test:

    ```ts
    import { Layer, Effect } from 'effect';
    import { makeUserRepo } from './repos/makeUserRepo';

    const DbLive = Layer.succeed<DbClient>({ ... });

    const AppLayer = Layer.effectContext(({ db }) => ({
      userRepo: makeUserRepo({ db }),
    })).merge(DbLive);

    export const program = mainEffect.provide(AppLayer);
    ```

* **Path Aliases:** *(unchanged—keep tsconfig paths to avoid ../../../)*  
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@server/*": ["apps/server/src/*"],
        "@shared/*": ["apps/server/src/shared/*"],
        "@<feature>/*": ["apps/server/src/modules/<feature>/*"],
        "@pkg/auth/*": ["packages/auth/src/*"]
      }
    }
  }

  }

* **Imports:** Use named imports. Avoid default exports where possible, except for the main application instance or framework-required defaults.

### **5\. Error Handling & Logging**

* **Centralized Errors:** Define custom application errors (e.g., AppError, ValidationError) extending Error in shared/errors/. Include an ErrorMapper or similar utility.  
* **Error Middleware:** Implement a single, global error handling middleware in infra/http/ that catches all errors, maps them using the ErrorMapper, and sends a standardized JSON error response. Controllers **must** wrap async route handlers with a utility function that catches promise rejections and passes them to next().  
* **Logging:** Use a structured logger (e.g., pino) initialized in shared/logging/.  
  * Inject or create child loggers per module/service with appropriate context (e.g., module name).  
  * **Ban console.log, console.error, etc.** (enforce via eslint: no-console).

### **6\. Validation**

* **Schema-Based:** Use a library like Zod or Yup for defining validation schemas in \*.schema.ts files.  
* **DTOs:** Use \*.dto.ts files for defining data shapes for API requests/responses.  
* **Application:** Validate incoming request data (body, query, params) in controllers (or dedicated middleware) using schemas before passing data to services. Services should expect validated, domain-appropriate data types.

### **7\. Testing**

* **Co-location:** Test files (\<feature\>.test.ts) **must** reside within the same module folder as the code they test.  
* **Coverage:** Enforce minimum test coverage thresholds per package/module via CI (e.g., jest \--coverage). Aim for high coverage on services and critical utilities.  
* **Types:** Write unit tests for services, utils, and repositories (using mocks for external dependencies like databases). Write integration tests for controllers/routes, testing the flow through middleware, service, and repository layers (potentially hitting a test database).

### **8\. Code Generation & Scaffolding**

* **Mandatory Scaffolding:** Use a scaffolding tool (e.g., Plop.js, Hygen) to generate the standard file/folder structure for new features (pnpm run generate feature \<name\>).  
* **Template Updates:** The scaffold templates **must** be kept up-to-date with the ruleset.  
* **PR Enforcement:** Pull requests adding new features manually (without using the generator) **should** be rejected unless the generator itself is being updated in the same PR.

### **9\. Duplication & Orphan Prevention (Enforced via CI)**

* **DRY Principle:** Before writing new code, **always** search the monorepo (apps/\* and packages/\*) for existing, reusable logic. Extract shared logic into shared/ or a dedicated packages/ library.  
* **CI Checks:**  
  * depcheck: Fail build on unused dependencies.  
  * eslint-plugin-unused-imports: Fail build on unused imports/variables.  
  * Custom Script/Lint Rule (Optional but Recommended): Detect unreferenced .ts files within src/ that aren't index.ts or main.ts.

### **10\. Versioning & Releases (for /packages/\*)**

* **SemVer:** All shared libraries in /packages/\* **must** follow Semantic Versioning.  
* **Changesets:** Use changesets (or similar tool) to manage versioning and generate changelogs for packages. Every PR modifying a package **must** include a changeset file.  
* **Automated Releases:** Set up CI/CD pipelines to automatically publish changed packages based on changeset information.

**Agent Instruction:** Apply these rules rigorously when creating new files, refactoring existing code, or adding features. Prioritize modularity, consistency, and adherence to defined patterns and limits. Use the scaffolding tool for new features. Report violations found during refactoring tasks.

---

## 🔗 Related Rules

### Backend Architecture Patterns

**For Express Applications:**
Use this rule (`monorepo-node-express-architecture.rules.mdc`) when:
- Building a full Express.js API server
- Need structured routes, middleware, and HTTP handling
- Working within the `/apps/server/` directory

**For Scripts, CLIs, and Standalone Node Programs:**
See `node.functional-isolated-concerns.rules.mdc` when:
- Building scripts, CLIs, or background workers
- NOT using Express framework
- Need functional programming patterns without HTTP layer
- Working in `/packages/` or utility scripts

**Key Differences:**
| Aspect | Express Architecture (This Rule) | Functional Isolated Concerns |
|--------|----------------------------------|------------------------------|
| Use Case | HTTP APIs, web servers | Scripts, CLIs, workers |
| Structure | `modules/`, `infra/http/` | `feature/` with concern files |
| HTTP Layer | Required | Not present |
| DI Pattern | Effect/fp-ts layers | Closure/HOF patterns |
| File Pattern | `<feature>.<role>.ts` | `<feature>/<name>.<purpose>.ts` |

**Recommendation:**
- Express apps can use functional-isolated-concerns for non-HTTP modules (e.g., `/modules/analytics/`)
- Scripts should NEVER use Express architecture patterns

### node.functional-isolated-concerns
**File Patterns:** scripts/**/*, tooling/**/*, packages/**/cli/**/*, **/*.script.ts
**Scopes:** node, backend, tooling


# Rule: Functional Isolated Concerns Architecture

**Use this pattern for:** Scripts, CLIs, background workers, utility packages
**NOT for:** Express.js applications (see `monorepo-node-express-architecture.rules.mdc` instead)

---

## 🔗 When to Use This Rule

**✅ Use Functional Isolated Concerns when:**
- Building standalone scripts or CLIs
- Creating background workers or batch processors
- Developing utility packages in `/packages/`
- Working on non-HTTP Node.js programs

**❌ Use Express Architecture instead when:**
- Building HTTP APIs or web servers
- Need routes, controllers, and middleware
- Working in `/apps/server/` directory
- See: `monorepo-node-express-architecture.rules.mdc`

---

#### 1. **Core Principles**
* **ALWAYS** use functional programming patterns (NO CLASSES)
* **ALWAYS** organize code into isolated concern files
* **COMBINE** both transformations in a single refactoring pass
* **NEVER** create class wrappers or compatibility layers

#### 2. **Refactoring Triggers & Process**
**WHEN** encountering code that violates either principle:
1. **ANALYZE** the entire module/class structure first
2. **TRANSFORM** to functional patterns WHILE splitting into concern files
3. **NEVER** do two-pass refactoring (class→functional→isolated)
4. **DELETE** all class-based code without creating wrappers

#### 3. **Critical Anti-patterns FORBIDDEN**
```typescript
// ❌ NEVER create backward compatible class wrappers:
class UserService {
  constructor() {
    this.create = createUser;  // NO!
    this.find = findUser;      // NO!
  }
}

// ❌ NEVER create "function bag" objects mimicking classes:
export const userService = {
  create: createUser,  // This is just a class in disguise
  find: findUser
};

// ✅ INSTEAD: Direct function exports
export { createUser, findUser };
```

#### 4. **Single-Pass Transformation Pattern**
**FROM** class-based or monolithic code **TO** functional isolated concerns:

```typescript
// BEFORE: user.ts (class-based monolithic)
class UserService {
  private db: Database;
  
  async createUser(data) { ... }
  async findUser(id) { ... }
  validateEmail(email) { ... }
  hashPassword(password) { ... }
}

// AFTER: user/ folder structure
user/
├── user.service.ts        // Pure business logic functions
├── user.repository.ts     // Data access functions
├── user.validation.ts     // Validation functions
├── user.utils.ts          // Utility functions
├── user.types.ts          // Type definitions
└── index.ts               // Exports
```

#### 5. **Mandatory Refactoring Steps**
**WHEN** refactoring a file named `feature.ts` or class into folder structure:
1. **CREATE** new folder named `feature/`
2. **SPLIT** content into `feature/[name].[purpose].ts` files using functional patterns
3. **CREATE** `feature/index.ts` with exports
4. **UPDATE ALL IMPORTS** in the ENTIRE codebase:
   - Find all files importing from `./feature`, `../feature`, etc.
   - Update imports to point to new structure
   - **ESPECIALLY** update all test files (`.test.ts`, `.spec.ts`)
5. **VERIFY** imports are updated by searching for the old import pattern
6. **DELETE** the original `feature.ts` file
7. **RUN TESTS** to ensure they fail if any imports were missed
8. **VERIFY** no duplicate exports or backward compatibility code exists

**CRITICAL**: Tests MUST be updated BEFORE deleting the original file, otherwise tests will pass with stale imports.

#### 6. **Functional Transformation Rules**
**Classes → Functions mapping:**
- Class methods → Exported pure functions
- Constructor dependencies → Function parameters or closure
- Instance state → Function arguments or returned state
- Private methods → Non-exported functions in same file
- Static methods → Regular exported functions

**State management patterns:**
```typescript
// INSTEAD OF: this.state mutation
// USE: Return new state
const updateUser = (user: User, updates: Partial<User>): User => ({
  ...user,
  ...updates
});

// INSTEAD OF: Dependency injection via constructor
// USE: Higher-order functions or explicit parameters
const createUserService = (db: Database) => ({
  create: (data: UserData) => createUser(db, data),
  find: (id: string) => findUser(db, id)
});
```

#### 7. **File Organization by Concern**
**Standard concern mapping for functional code:**
- `.service.ts` → Pure business logic (no I/O)
- `.repository.ts` → Data access (I/O isolated here)
- `.controller.ts` → HTTP handling (request/response)
- `.validation.ts` → Pure validation functions
- `.utils.ts` → Pure utility functions
- `.types.ts` → TypeScript interfaces/types
- `.effects.ts` → Side effects (logging, external APIs)
- `.constants.ts` → Constant values
- `.test.ts` or `.spec.ts` → Test files

#### 8. **Functional Patterns by Concern Type**

**Services (Pure Business Logic):**
```typescript
// user.service.ts
export const calculateUserScore = (user: User, activities: Activity[]): number =>
  activities.reduce((score, activity) => score + activity.points, user.baseScore);

export const applyDiscount = (price: number, user: User): number =>
  user.isPremium ? price * 0.8 : price;
```

**Repositories (I/O Operations):**
```typescript
// user.repository.ts
export const createUser = async (db: Database, data: UserData): Promise<User> =>
  db.insert('users', data);

export const findUserById = async (db: Database, id: string): Promise<User | null> =>
  db.findOne('users', { id });
```

**Controllers (HTTP Handling):**
```typescript
// user.controller.ts
export const handleCreateUser = (deps: Dependencies) => async (req: Request, res: Response) => {
  const validated = validateUserData(req.body);
  const user = await createUser(deps.db, validated);
  res.json(user);
};
```

#### 9. **Dependency Management**
**INSTEAD OF** class constructor injection:
```typescript
// Option 1: Closure pattern
export const createUserHandlers = (deps: Dependencies) => ({
  create: handleCreateUser(deps),
  find: handleFindUser(deps),
  update: handleUpdateUser(deps)
});

// Option 2: Explicit parameters
export const createUser = async (db: Database, data: UserData): Promise<User> =>
  db.insert('users', data);

// Option 3: Reader monad pattern (advanced)
export const createUser = (data: UserData) => (deps: Dependencies): Promise<User> =>
  deps.db.insert('users', data);
```

#### 10. **Import Rules**
* **Within same feature:** Use relative imports (`./user.types`)
* **Cross-feature:** Use absolute imports from feature root (`@/features/auth/auth.types`)
* **Shared modules:** Use absolute imports (`@/shared/utils/logger`)
* **Circular dependencies:** FORBIDDEN - refactor immediately if detected

#### 11. **Validation Checklist**
Before completing any refactoring:
1. ✓ No classes exist (except documented exceptions)
2. ✓ All functions are pure where possible
3. ✓ Side effects isolated to specific files
4. ✓ Each file has single concern
5. ✓ File follows `[name].[purpose].ts` pattern
6. ✓ Dependencies passed explicitly
7. ✓ No mutable state (use immutable updates)
8. ✓ ALL imports updated (search for old import patterns)
9. ✓ ALL test imports updated specifically
10. ✓ Original file deleted
11. ✓ Tests run against NEW structure (not old file)
12. ✓ No backward compatibility wrappers exist
13. ✓ No "function bag" objects mimicking classes

#### 12. **Import Update Verification**
```typescript
// REQUIRED verification after refactoring:
verifyNoStaleImports(oldFileName: string) {
  const staleImportPatterns = [
    `from './${oldFileName}'`,
    `from '../${oldFileName}'`,
    `from '../../${oldFileName}'`,
    `import '${oldFileName}'`,
    `require('${oldFileName}')`,
    `require('./${oldFileName}')`
  ];
  
  // Search entire codebase for these patterns
  // If found, refactoring is INCOMPLETE
}
```

#### 13. **Refactoring Decision Tree**
```
FOR each class or monolithic file:
  1. IDENTIFY all methods and their concerns
  2. GROUP methods by concern type
  3. FOR each concern group:
     - CREATE new file with functional exports
     - TRANSFORM class methods to pure functions
     - EXTRACT shared types to .types.ts
  4. UPDATE all imports atomically
  5. DELETE original file
  6. VERIFY tests still pass
```

#### 14. **Subfolder Strategy**
* **Decision tree for component placement:**
  ```txt
  IF component is used by multiple features → create in /shared/[component]/
  ELSE IF component is sub-concern of single feature → create in /[feature]/[sub-concern]/
  ELSE → create as /[feature]/[name].[purpose].ts
  ```
* **Subfolder creation criteria:**
  * Multiple files of same concern type (>3 validators → `/validation/` subfolder)
  * Complex sub-features with >5 related files
  * Feature-specific implementations not used elsewhere

#### 15. **Exception Handling**
**Classes are ONLY allowed when:**
1. Framework requires it (with documented reason)
2. Third-party library inheritance (with no functional alternative)
3. Performance-critical stateful operations (with benchmarks proving 20%+ improvement)

**Exception documentation:**
```ts
/**
 * @exception CLASS_BASED_COMPONENT
 * @reason React Native requires class components for ErrorBoundary
 * @functional-alternative none available in framework version 0.72
 * @reevaluate 2025-Q2
 */
```

#### 16. **Anti-patterns to Avoid**
- Creating "function bags" (objects with function properties mimicking classes)
- Backward compatibility class wrappers
- Over-using closures leading to memory leaks
- Mixing concerns in a single function
- Hidden side effects in seemingly pure functions
- Partial refactoring (leaving some methods in classes)
- Default exports (always use named exports)

#### 17. **Performance Optimizations**
**When refactoring, apply these optimizations:**
- Use function composition over method chaining
- Leverage currying for partial application
- Consider memoization for expensive pure functions
- Use lazy evaluation where appropriate
- Prefer `const` functions over `function` declarations

#### 18. **Enforcement**
* **Block operations that:**
  * Create new classes without documented exceptions
  * Create compatibility wrappers
  * Leave original files after refactoring
  * Complete refactoring with stale imports
  * Mix paradigms (functional + class in same module)
* **Auto-fix when possible:**
  * Convert simple classes to functions
  * Update import paths
  * Remove empty compatibility files

---

## 19. Event-Driven Side-Effects (Pub/Sub)

* **Emitter:** Export a singleton `EventEmitter` from `shared/events/eventBus.ts`.
* **Subscribers:**  
  * Drop handlers in either  
    * `modules/<feature>/<feature>.subscriber.ts`, **or**  
    * `subscribers/<domain>.subscriber.ts` (cross-feature).  
  * Handlers register via **import side-effect** in a loader (see §20).
* **Pattern:** Services emit `eventBus.emit('user.signup', payload)`; subscribers react (`eventBus.on('user.signup', handler)`) to send emails, analytics, etc., without polluting service logic.
* **Testing:** Unit-test subscribers; mock `eventBus` in service tests.

---

## 20. Background Jobs & Scheduling

* **Default runner:** *Agenda.js* (Mongo) or *Bree* (SQL/FS).
* **Folder:** `jobs/<jobName>.job.ts` exporting `{ name, schedule, handler }`.
* **Registration:** `loaders/jobLoader.ts`  
  1. Globs `jobs/**/*.job.ts`  
  2. Registers each job with Agenda/Bree  
  3. Starts the scheduler at bootstrap.
* **Rule of thumb:** Long-running, retryable tasks → **jobs**; immediate side-effects → **subscribers**.

---

## 21. Loaders Bootstrap Pattern (Express only)

```txt
loaders/
├─ expressLoader.ts   # sets up app + routes
├─ dbLoader.ts        # prisma / mongoose connect
├─ loggerLoader.ts    # pino config
├─ diLoader.ts        # container bindings
├─ jobLoader.ts       # §19
└─ eventLoader.ts     # wires subscribers

```

`main.ts` awaits each loader in order, passing shared context.  
*`infra/` may still host low-level utilities; “loader” files are purely for bootstrapping.*

---

## 22. Living API Docs

* **Tool:** *Optic* (or *zod-openapi*).  
* **Process:**  
  1. Capture real traffic or convert Zod schemas → OpenAPI JSON.  
  2. Commit spec to `docs/openapi.yaml`; CI fails on uncommitted diffs.  
* **Agent hook:** When a controller/schema changes, auto-update the OpenAPI spec.


### project-wide-proxy-rules
**File Patterns:** apps/server/src/modules/proxy/**/*, apps/server/src/middleware/**/*
**Scopes:** backend, api, proxy, middleware

## Project-Wide Proxy Rules

This project uses a proxy server (`@cortals/server` workspace, code in `apps/server`) to mediate communication between the frontend application (Portals) and the backend Content Manager (CM) server.  These rules are designed to clarify when and how to interact with the proxy and the local database (`@cortals/pg-service` workspace).

**Rule 1: Proxy for CM API Requests**
   - **Description:** All requests intended for the Content Manager API must be routed through the proxy server. The proxy server is responsible for handling authentication, request transformation, and response interception before forwarding requests to the CM server.
   - **Rationale:** This ensures consistent interaction with the CM API, allows for centralized handling of concerns like authentication and data augmentation, and provides a point of control for interacting with the legacy CM system.
   - **Example:** When fetching users, roles, or workgroups from Content Manager, the request should be directed to the proxy endpoints (e.g., `/api/cm/users`, `/api/cm/roles`, `/api/cm/workgroups`).

**Rule 2: Local Database for Portal-Specific Data**
   - **Description:** The local PostgreSQL database (`@cortals/pg-service`) should be used for managing data that is specific to the Portals application and does not directly reside within Content Manager. This includes permission groups, portal-specific user roles, and any other data needed for the Portals frontend functionality.
   - **Rationale:**  This allows Portals to manage its own data independently of the CM system, enabling features and customizations that are specific to the portal application.
   - **Example:**  Managing permission groups, their children, and mappings should be done by directly querying and modifying the local database using functions from `@cortals/pg-service/query/cortals`.

**Rule 3: No Direct Local Database Modifications for CM Data**
   - **Description:**  Do not attempt to use the local database to directly modify or access data that is primarily managed by Content Manager. The Content Manager database is not directly accessible, and all interactions with CM data should occur through the CM API via the proxy.
   - **Rationale:**  Direct database modifications could lead to data inconsistencies, bypass CM's business logic and security measures, and create maintenance headaches.
   - **Exception:** Caching or storing a subset of CM data in the local database for performance or specific portal features is acceptable, but the source of truth remains the CM system, and updates should be synchronized via the CM API.

**Rule 4: Proxy Bypass for Portal-Internal Requests**
   - **Description:** Requests that are internal to the Portals application and do not interact with the Content Manager API should bypass the proxy. This includes requests for static assets, health checks, and any portal-specific API endpoints that operate solely on the local database or application logic.
   - **Rationale:**  Sending internal requests through the proxy adds unnecessary overhead and complexity. Direct communication within the Portals application components is more efficient for internal operations.
   - **Example:** Requests to `/health` endpoint, serving static files from the `client/dist` directory, or accessing portal-specific permission group APIs should not be proxied.

**Rule 5: CM API Token Handling**
    - **Description:** When making requests to the CM API through the proxy, API tokens are required for authentication. The proxy server is responsible for obtaining and managing these tokens.  **Crucially, when including the token in headers for CM API requests, use the token value directly, without the "Bearer" prefix.**
    - **Rationale:** The CM API authentication scheme expects the API token directly in the `apiToken` header, not in the standard "Bearer" format.  Following this convention is essential for successful authentication.
    - **Reference:** See `services/cm/src/api/auth.ts` for how tokens are obtained and `services/cm/src/proxy/proxy.ts` for how they are used in proxy requests.
    - **Cursor Rule File:**  `cm-proxy-rules.mdc` (Rule file provided earlier in the conversation)

**Directory Specific Rules for `@cm` (services/cm):**

**Rule 6: `@cm` Workspace - Proxy Server Logic**
    - **Description:** The `@cm` workspace contains the code for the proxy server logic, including middleware, request routing, and API interaction with Content Manager.  Code in this directory is responsible for handling requests intended for the CM API and mediating between the Portals frontend and the CM backend.
    - **Rationale:**  Encapsulating proxy logic within the `@cm` workspace promotes modularity and separation of concerns. It clearly delineates the code responsible for proxying CM requests from other parts of the application.
    - **Location:**  `services/cm/*`
    - **Key Files:**
        - `services/cm/src/proxy/*`: Contains proxy middleware and request handling logic.
        - `services/cm/src/api/*`:  Defines API interaction functions (e.g., token retrieval, role fetching).
        - `services/cm/src/middleware/*`: Includes middleware for authentication and request modification.
        - `services/cm/src/proxy/router.ts`: Defines routing logic for proxy responses and custom handling.

**Rule 7: `@cm` Workspace - No Direct Database Access (Except Portal DB)**
    - **Description:** Code within the `@cm` workspace should primarily interact with the Content Manager API.  Direct access to the Content Manager database is prohibited.  However, it *can* interact with the Portals PostgreSQL database (`@cortals/pg-service`) for purposes like storing API keys or augmenting CM data with portal-specific information.
    - **Rationale:**  Maintaining a clear separation between proxy logic and direct CM database access is crucial for architectural integrity and maintainability.  Interactions with the Portals database are acceptable for supporting proxy functionality and portal features.
    - **Database Interaction:** When database interaction is needed, use the `db` object exported from `services/cm/src/db.ts`, which is a wrapper around `@cortals/pg-service`.

**Mermaid Diagram:**

```mermaid
graph LR
    subgraph Frontend Application (Portals)
        FE[Frontend App (Portals)]
    end

    subgraph Server Workspace (`@cortals/server`)
        ProxyServer[Proxy Server (`@cortals/server`)]
        OpenAPI[OpenAPI Spec (`openapi.yaml`)]
    end

    subgraph CM Service Workspace (`@cortals/cm-service`)
        ProxyCode[Proxy Code (`@cortals/cm-service/src/proxy/*`)]
    end

    subgraph Portal Database Workspace (`@cortals/pg-service`)
        PortalDB[Portal DB (`@cortals/pg-service`)]
    end

    subgraph Backend Server (Content Manager)
        CMServer[Backend Server (CM)]
        CMDB[CM Database (Implicit Access)]
    end

    FE --> ProxyServer: CM API Requests
    FE -->> PortalServerInternal: Portal-Internal Requests (e.g., Static Files, Health)
    ProxyServer -->> PortalDB: Portal Data Queries/Updates
    ProxyServer --> CMServer: Proxied CM API Requests
    CMServer --> CMDB: Implicit DB Access
    CMServer --> ProxyServer: CM API Responses
    ProxyServer --> FE: Proxied CM API Responses
    ProxyCode --o ProxyServer: Implements Proxy Logic
    OpenAPI --o ProxyServer: Documents Proxy API


    style ProxyServer fill:#f9f,stroke:#333,stroke-width:2px
    style PortalDB fill:#ccf,stroke:#333,stroke-width:2px
    style CMServer fill:#efe,stroke:#333,stroke-width:2px
    style CMDB fill:#eee,stroke:#333,stroke-width:2px
    style FE fill:#cee,stroke:#333,stroke-width:2px
    style ProxyCode fill:#fcf,stroke:#333,stroke-width:2px
    style OpenAPI fill:#fce,stroke:#333,stroke-width:2px

    classDef internal stroke-dasharray: 5 5;
    class PortalServerInternal internal;
```

**Explanation of the Diagram:**

* **Components:** The diagram clearly outlines the major components: Frontend App, Proxy Server, CM Server, Portal DB, and CM DB. It also highlights the location of the OpenAPI spec and Proxy code.
* **Request Flow:** Arrows indicate the direction of requests and responses.
    * Solid arrows represent CM API requests going through the proxy.
    * Dashed arrows represent Portal-internal requests bypassing the proxy.
* **Data Flow:** Arrows also show data flow, such as the Proxy Server interacting with the Portal DB.
* **Workspace and Code Location:** Subgraphs and labels indicate the workspace and key code locations for different components, especially for the Proxy Server and Proxy Code.
* **Implicit CM DB Access:** The CM DB is marked as "Implicit Access" to emphasize that Portals and the Proxy Server do not directly interact with it; access is only through the CM Server.
* **Styling:**  Different colors and styles are used to visually distinguish the components and their roles.


### tests.continuous-validation
**File Patterns:** _errors/**/*, _logs/**/*, **/*.test.ts, **/*.test.tsx
**Scopes:** testing, validation, monitoring

**Purpose**: Establish a self-validating development loop where every meaningful change is immediately verified through automated testing, ensuring code quality and preventing regression accumulation.

## Core Principle
Tests are the source of truth for functional correctness. The agent must validate all work through the existing test suite before considering any task complete.

## Scope Definition

### When to Trigger Validation
**Always trigger after:**
- Feature implementation or modification
- Bug fixes
- Code refactoring (structural changes)
- Dependency updates that affect runtime behavior
- Configuration changes affecting application logic
- Branch merges or external code integration

**Skip validation for:**
- Documentation-only changes
- Comment additions/modifications
- Formatting/linting fixes that don't change logic
- Asset additions (images, fonts) without code impact

### Change Detection
Use git status or file modification timestamps to determine if code changes occurred since last validation.

## Implementation Strategy

### 1. Test Runner Discovery
```bash
# Priority order for detection:
1. Check package.json scripts: "test", "test:unit", "test:integration"
2. Look for config files: vitest.config.*, jest.config.*, playwright.config.*
3. Scan for test directories: __tests__, tests/, spec/
4. Check for CI configuration hints in .github/workflows/ or .gitlab-ci.yml
```

### 2. Execution Strategy
**Default approach:**
```bash
npm run test  # or pnpm/yarn equivalent
```

**Optimized scoping:**
- **Single file changes**: Run tests for that specific file/module
- **Package in monorepo**: Use workspace-specific test commands
- **Feature area**: Use test tags or patterns when available
- **Time constraints**: Run fast tests first, defer slower integration tests

**Example filtering:**
```bash
# File-specific
npm test -- src/components/Button.test.ts

# Pattern-based
npm test -- --grep "authentication"

# Package-specific (monorepo)
npm test packages/ui
```

### 3. Failure Response Protocol

**On test failure:**
1. **STOP** all further development work
2. **ANALYZE** the failure:
   - **Code regression**: Fix the broken functionality
   - **Test needs update**: Verify intent with user, then update test
   - **Flaky/brittle test**: Document issue, consider test improvement
   - **Environmental**: Check dependencies, setup, or configuration

3. **RESOLVE** before proceeding:
   - Never suppress or ignore failing tests
   - Never auto-update tests without understanding the change
   - Document the resolution approach in commit message

### 4. Success Logging
```txt
✅ Validation passed: [X] tests, [Y]ms - [action-description] at [timestamp]
📊 Coverage delta: [change if available]
```

### 5. No-Test Scenarios
**When no relevant tests exist:**
1. Log warning: `⚠️  No tests found to validate changes in [affected-area]`
2. Suggest creating basic functionality tests
3. Reference test-writing guidelines if available
4. Continue with explicit acknowledgment of unvalidated state

## Advanced Configuration

### Performance Optimization
- **Fast feedback**: Run unit tests before integration tests
- **Parallel execution**: Use test runner's parallel capabilities when safe
- **Smart selection**: Run tests related to changed files when tooling supports it
- **Timeout limits**: Set reasonable limits for test execution (suggest 5-10 minutes for full suite)

### Context Awareness
- **TDD mode**: When implementing failing tests first, expect and handle intentional failures
- **Feature flags**: Skip tests for disabled features when appropriate
- **Environment specific**: Adjust test selection based on development vs. CI environment

### Integration Points
- **Pre-commit hooks**: Complement, don't duplicate existing git hooks
- **CI/CD coordination**: Log validation results that CI can reference
- **IDE integration**: Respect existing test watchers and editor integrations

## Error Handling & Recovery

### Failure Categories & Responses
1. **Test execution failure** (can't run tests):
   - Check environment setup
   - Verify dependencies
   - Report infrastructure issue

2. **Test assertion failure** (tests run but fail):
   - Follow failure response protocol above
   - Maintain git state for easy rollback

3. **Timeout or resource issues**:
   - Try scoped test run
   - Report performance concern
   - Continue with warning if critical path

### Rollback Strategy
If immediate fix isn't clear:
1. Stash or commit current changes with clear marker
2. Revert to last known-good state
3. Re-analyze the change approach
4. Document the issue for user review

## Monitoring & Feedback

### Success Metrics
Track and report:
- Test execution time trends
- Failure frequency and categories
- Coverage changes
- Test suite health indicators

### Continuous Improvement
- Suggest test gaps when patterns emerge
- Recommend performance optimizations
- Identify and flag brittle tests
- Monitor for test suite maintenance needs

## Usage Notes
- This rule works best with `tests.unified-testing.rules.mdc` for test quality
- Integrates with version control workflows and CI/CD systems
- Designed for both individual development and team collaboration
- Balances thoroughness with development velocity

---

## 🔗 Related Rules (Testing Trio)

This rule is part of the **Testing Trio** that provides comprehensive auto-validation:

1. **`brain-monitor-validation.rules.mdc`** - Coordinates agent communication via `_errors/` reports
2. **`tests.continuous-validation.rules.mdc`** (THIS RULE) - Auto-executes tests after changes
3. **`tests.unified-testing.rules.mdc`** - Ensures TDD methodology and test quality

**How They Work Together:**
- `brain-monitor`: Prevents redundant validation runs, provides task lists
- `continuous-validation`: Automatically runs tests when code changes
- `unified-testing`: Guides test CREATION with 5-step TDD process

See `brain-monitor-validation.rules.mdc` for the complete workflow.