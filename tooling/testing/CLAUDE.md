# Testing - Development Rules

Test configuration and utilities

**Generated:** 2025-10-22
**Source:** .cursor/rules-source/*.mdc (auto-generated from modular rules)
**Context:** monorepo, global, node, tooling, testing, validation, tdd, documentation

---

## Table of Contents

1. [Brain Monitor Validation](#brain-monitor-validation)
2. [Monorepo Documentation Strategy](#monorepo-documentation-strategy)
3. [Monorepo Node Express Architecture](#monorepo-node-express-architecture)
4. [Monorepo Package Docs Versioning](#monorepo-package-docs-versioning)
5. [Monorepo Structure And Configuration](#monorepo-structure-and-configuration)
6. [Node.functional Isolated Concerns](#node.functional-isolated-concerns)
7. [Pr Creation Guidelines](#pr-creation-guidelines)
8. [Storybook First Composition](#storybook-first-composition)
9. [Testid](#testid)
10. [Tests.continuous Validation](#tests.continuous-validation)
11. [Tests.tdd Workflow](#tests.tdd-workflow)
12. [Tests.unified Testing](#tests.unified-testing)

---

## Brain Monitor Validation

> **When to apply:** Brain monitor validation workflow and error management

> **Scopes:** validation, monitoring, testing


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


---

## Monorepo Documentation Strategy

> **When to apply:** Documentation strategy and hierarchy for the monorepo

> **Scopes:** documentation, monorepo

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

---

## Monorepo Node Express Architecture

> **When to apply:** Express.js architecture with functional DI patterns and modular structure

> **Scopes:** express, backend, api, node, mongodb

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

---

## Monorepo Package Docs Versioning

> **When to apply:** Package documentation and versioning standards

> **Scopes:** documentation, versioning, packages

# Monorepo README & Changelog Management

<!-- ==================== METADATA ==================== -->
whenToUse:
  - Creating a new package or app in the monorepo
  - Making changes to any existing package
  - Releasing a new version of any package
  - Adding features, fixing bugs, or making breaking changes
  - Updating workspace configuration or dependencies
description: >
  Comprehensive standards for monorepo documentation lifecycle: package READMEs, changelogs, 
  and versioning. Ensures consistent documentation and versioning across all workspace packages.
# =====================================================

## Related Rules:
# - Required foundation: monorepo-library-setup.rules.mdc (base monorepo structure)
# - Broader documentation: monorepo-documentation-strategy.rules.mdc (general docs)
# - Consider with: monorepo-contributing.rules.mdc (for open source projects)

## 1. Documentation File Validation (MANDATORY)

Every package in the monorepo MUST maintain these fundamental files:

| File | Purpose | Required Sections |
|------|---------|-------------------|
| `README.md` | Package description, installation, usage | Overview, Installation, Usage, API (if applicable) |
| `CHANGELOG.md` | Version history, release notes | Unreleased, Previous Versions |
| `package.json` | Package metadata, dependencies | name, version (must follow SemVer) |

### Automated Validation

When working with any package, the agent MUST:

1. Check for the existence of all required files
2. If any file is missing, automatically create it using the templates in section 6
3. Report the creation: "Created missing [filename] for [package]"
4. Never consider a task complete until all packages modified have valid documentation

## 2. README.md Requirements

### Content Structure

Every package README must include:

1. **Title and Description** - Clear explanation of package purpose
2. **Installation** - How to install/use within the monorepo
3. **Usage Examples** - Code snippets showing common use cases
4. **API Documentation** - For libraries/shared components
5. **Dependencies** - Key external or internal dependencies

### README Update Triggers

Update the README whenever:

- Adding new features or API methods
- Changing usage patterns or requirements
- Modifying supported options/configuration
- Revising dependencies
- Making breaking changes

## 3. CHANGELOG.md Requirements

### Format Standard

Follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```md
# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature X

### Changed
- Updated dependency Y

## [1.0.0] - YYYY-MM-DD

### Added
- Initial release
```

### Entry Categories

Group changes into these categories:

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Features that will be removed
- **Removed** - Features that were removed
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

### Changelog Update Process

1. Always add changes to `[Unreleased]` section first
2. When releasing a version, rename `[Unreleased]` to `[x.y.z] - YYYY-MM-DD`
3. Add a new empty `[Unreleased]` section at the top
4. Include links to version comparison when possible

## 4. Versioning Standards

### Semantic Versioning

All packages MUST follow [SemVer 2.0.0](https://semver.org/):

- **MAJOR** (`x.0.0`) - Incompatible API changes
- **MINOR** (`0.x.0`) - Backwards-compatible functionality
- **PATCH** (`0.0.x`) - Backwards-compatible bug fixes

### Version Synchronization

Ensure version numbers are synchronized between:
- CHANGELOG.md entries
- package.json "version" field
- Any version references in README.md

## 5. Automated Documentation Workflow

### When Making Package Changes

1. **Detect Modified Packages** - Identify which workspace packages were modified
2. **Update Changelogs** - Add entries to `[Unreleased]` in each modified package
3. **Check READMEs** - Update if the changes affect usage, API, or behavior
4. **Ensure Consistency** - Verify all documentation is aligned with changes

### When Releasing Versions

1. **Prepare Version** - Move `[Unreleased]` changes to new version section
2. **Update package.json** - Bump version field according to SemVer rules
3. **Update README** - Update any version references or version-specific docs
4. **Commit Format** - `chore(package-name): release x.y.z`

## 6. File Templates for New Packages

### README.md Template

```md
# Package Name

Brief description of what this package does and its purpose in the monorepo.

## Installation

This package is part of the monorepo and can be used by adding it to your project dependencies:

```json
"dependencies": {
  "@project/package-name": "workspace:*"
}
```

## Usage

```typescript
import { Something } from '@project/package-name';

// Usage example
const result = Something.doThing();
```

## API

### `functionName(param1, param2)`

Description of what the function does.

**Parameters:**
- `param1` (type): Description
- `param2` (type): Description

**Returns:**
- (returnType): Description

## Dependencies

- List key dependencies here
```

### CHANGELOG.md Template

```md
# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial implementation
```

## 7. Root README.md Management

The root-level README.md serves as the entry point to the entire monorepo and must be updated whenever:

1. **New Package Added** - Add to workspace package list with description
2. **Architecture Changes** - Update diagrams or descriptions of project structure
3. **Dev Workflow Changes** - Update commands or procedures for development
4. **Dependency Updates** - Document major dependency version changes

### Root README Structure

```md
# Project Name

Brief project overview and purpose.

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [@project/package-a](./packages/package-a) | Description of package A | 1.2.0 |
| [@project/package-b](./packages/package-b) | Description of package B | 0.5.1 |

## Development

Installation and development workflow instructions.

## Architecture

High-level architecture description or diagrams.
```

## 8. Pre-Completion Checklist

Before marking any task complete, verify:

- [ ] All modified packages have updated changelog entries
- [ ] Version numbers are consistent across changelog and package.json
- [ ] READMEs reflect any API or usage changes
- [ ] Root README is updated if new packages were added

---

## Monorepo Structure And Configuration

> **When to apply:** Core monorepo structure, ESM-only, no-build libraries, shared config, agent coordination

> **Scopes:** monorepo, global


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

## Node.functional Isolated Concerns

> **When to apply:** Functional patterns for scripts, CLIs, and standalone Node programs

> **Scopes:** node, backend, tooling


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


---

## Pr Creation Guidelines

> **When to apply:** Pull request creation guidelines and workflow

> **Scopes:** git, workflow, documentation


# PR Creation and Management Guidelines

## Overview
This document outlines the standardized process for creating and managing pull requests, including hotfix workflows, PR description formatting, and cleanup procedures.

## 🔄 Workflow Steps

### 1. Branch Creation
```bash
# For hotfixes
git checkout qa
git pull origin qa
git checkout -b hotfix/descriptive-name

# For features
git checkout main
git pull origin main
git checkout -b feature/descriptive-name
```

### 2. PR Description Creation
```bash
# Create temporary description file
printf '# 🚑 [PR Type]: Brief Title\n\n## 🔍 Issue\n[Issue description]\n\n## 🛠 Fix\n[Fix description]\n\n## 📋 Changes\n- [Change 1]\n- [Change 2]\n\n## 🧪 Testing\n- [ ] [Test item 1]\n- [ ] [Test item 2]\n\n## ⏰ Created\n%s\n\n#Tags #MoreTags' "$(date +'%A, %B %d, %Y at %I:%M:%S %p')" > /tmp/pr_description.md
```

### 3. PR Creation Using GitHub CLI
```bash
# Create new PR
gh pr create --base [target_branch] --head [source_branch] --title "[PR Title]" --body-file /tmp/pr_description.md

# Update existing PR
gh pr edit [PR_NUMBER] --body-file /tmp/pr_description.md
```

### 4. Cleanup
```bash
# Remove temporary files
rm /tmp/pr_description.md
```

## 📝 PR Description Templates

<!-- markdownlint-disable MD025 -->
<!-- Note: H1 headings in templates below are intentional examples for PR descriptions -->

### Hotfix Template
\`\`\`markdown
# 🚑 Hotfix: [Brief Description]

## 🔍 Issue
[Describe the issue being fixed]

## 🛠 Fix
[Describe the fix implemented]

## 📋 Changes
- [Change 1]
- [Change 2]

## 🧪 Testing
- [ ] [Test step 1]
- [ ] [Test step 2]

## ⏰ Created
[DATE]

#Hotfix #[AdditionalTags]
\`\`\`

### Feature Template
\`\`\`markdown
# ✨ Feature: [Brief Description]

## 🎯 Purpose
[Describe the feature's purpose]

## 📋 Changes
- [Change 1]
- [Change 2]

## 🧪 Testing
- [ ] [Test step 1]
- [ ] [Test step 2]

## 📚 Documentation
- [ ] Updated relevant docs
- [ ] Added comments where needed

## ⏰ Created
[DATE]

#Feature #[AdditionalTags]
\`\`\`

## 🎨 Formatting Guidelines

1. **Emojis**
   - Use relevant emojis at section headers
   - Keep emoji usage consistent within templates
   - Common emojis:
     - 🚑 Hotfix
     - ✨ Feature
     - 🐛 Bug fix
     - 📚 Documentation
     - 🧪 Testing
     - ⚡ Performance
     - 🔒 Security

2. **Markdown Best Practices**
   - Use backticks (\`) for code, commands, and technical terms
   - Use bullet points (-) for lists
   - Use checkboxes (- [ ]) for testing items
   - Use headers (##) for clear section separation
   - Add blank lines between sections

3. **Content Structure**
   - Keep titles concise and descriptive
   - Use active voice in descriptions
   - List changes in bullet points
   - Include specific testing steps
   - Add relevant tags

## 🔄 Post-PR Workflow

1. **For Hotfixes**
   ```bash
   # After QA approval
   git checkout main
   git pull origin main
   git merge hotfix/[branch-name]
   git push origin main
   ```

2. **Branch Cleanup**
   ```bash
   # After successful merge
   git branch -d [branch-name]
   git push origin --delete [branch-name]
   ```

## 🚫 Common Pitfalls to Avoid

1. Don't include sensitive information in PR descriptions
2. Don't leave testing steps vague or incomplete
3. Don't forget to clean up temporary files
4. Don't merge without required approvals
5. Don't leave outdated branches lingering

## 🔍 PR Review Guidelines

1. **Before Requesting Review**
   - [ ] All tests pass
   - [ ] Code follows style guidelines
   - [ ] PR description is complete and formatted
   - [ ] Changes are properly scoped
   - [ ] Temporary files are cleaned up

2. **After Review**
   - [ ] Address all comments
   - [ ] Update PR description if needed
   - [ ] Re-request review if necessary
   - [ ] Clean up feature branches after merge

---

## 🔗 Related Rules

### Validation Before PR Creation
**IMPORTANT:** Before creating a PR, check validation reports to ensure quality:

- **`brain-monitor-validation.rules.mdc`** - Check `_errors/validation-summary.md` first
  - Prevents pushing code with known issues
  - Provides clear task list of what needs fixing
  - Saves CI/CD time and reviewer effort

- **`tests.continuous-validation.rules.mdc`** - Auto-test execution
  - Tests run automatically after changes
  - Results appear in `_errors/` reports
  - Part of the Testing Trio workflow

- **`tests.unified-testing.rules.mdc`** - Test quality standards
  - Ensures tests follow TDD principles
  - Provides testing patterns and best practices
  - Part of the Testing Trio workflow

### Monorepo Context
- **`monorepo-structure-and-configuration.rules.mdc`** - Monorepo conventions
- **`monorepo-package-docs-versioning.rules.mdc`** - Package versioning in PRs

### Best Practice Integration
**Before marking PR ready for review:**
1. Run `cat _errors/validation-summary.md` to check status
2. Fix any failing tests/lints shown in reports
3. Update CHANGELOG.md for affected packages
4. Ensure PR description reflects actual changes

---

## Storybook First Composition

> **When to apply:** Storybook-first component development - build UI components in isolation with stories before integration

> **Scopes:** react, storybook, testing, ui, components

# Rule: Storybook-First Component Composition

## Purpose:
Enforce a design and implementation methodology where all UI components are built in isolation and documented in Storybook *before* they are used in any application screen or feature.

This approach supports testable, composable, visually validated components ideal for scalable development and AI-assisted iteration.

---

## Scope:
Applies to all UI components within the `components/`, `ui/`, or `shared/` directories in frontend projects.

---

## Agent Behavior:

1. **Build UI Components in Isolation First**
   - Do not begin page/screen-level implementation until all required atomic or reusable components are complete.
   - Each component must be implemented independently of the app context.

2. **Create Full Storybook Coverage**
   - Every component must have a `.stories.tsx` file that includes:
     - 🟢 Default case
     - 🚧 Edge cases (e.g., loading, error, empty state)
     - 🎨 Variants (e.g., size, theme, disabled)
     - 📱 Responsive views (optional)
   - Stories must serve as living documentation.

3. **Wrap External UI Libraries**
   - If using design libraries (e.g. shadcn/ui, MUI, Radix), create thin wrappers:
     - Enforce project-wide props/interfaces
     - Customize styling consistently
     - Enable override and extension

4. **Add Snapshot or Visual Regression Testing (if enabled)**
   - If snapshot tooling (e.g. Storybook + Chromatic, Percy, or Playwright visual) is configured:
     - Each Storybook story is treated as a visual contract.
     - Run snapshot tests for each story to detect style/layout regressions.

5. **Verify Component Behavior**
   - Write functional interaction tests for interactivity (e.g., Storybook interaction tests, Playwright + story).
   - No mocking unless interacting with an external service or system boundary.

6. **Document Design Intent and Usage**
   - Use Storybook docs or comments to describe:
     - When/where to use the component
     - Important design constraints or accessibility concerns
     - Behavior on various screen sizes or themes

7. **Support Atomic Design and Reusability**
   - Structure components to support atomic principles:
     - Atoms (Button, Input)
     - Molecules (FormField, Card)
     - Organisms (Modal, Sidebar)
   - Organize files and stories accordingly for composability.

---

## Outcome:
When followed correctly, this rule ensures:
- The UI can be visually and behaviorally validated before integration
- Regression detection is visual and precise
- Design tokens, styling, and component logic are isolated and composable
- AI agents can safely update UI code with immediate visual feedback

---

## Notes:
- Storybook-first is a **pre-app strategy**. It may be followed by page/story assembly plans or E2E testing.
- This pattern pairs well with the `auto-test-validation.rules.mdc` rule and `functional-validation-test.rules.mdc`.

---

## Related Rules:
- See `component-design-decision-tree.rules.mdc` for when to apply this pattern
- Combine with `atomic-design-component-strategy.rules.mdc` when wrapping third-party components
- Use `mobile-first-design.rules.mdc` or `platform-pathways-pattern.rules.mdc` for responsiveness
- Integrates with `tests.unified-testing.rules.mdc` for component testing

---

## Related Prompts:
- `.brain/prompts/testing/generate-storybook-snapshots.prompt.md` (optional)
- `.brain/prompts/testing/create-visual-regression-checks.prompt.md` (optional)


---

## Testid

> **When to apply:** TestID management and conventions for consistent testing

> **Scopes:** testing, react, frontend

# Guide: Adding New TestIDs to @your-package/testids

## 1. Directory Structure Overview

```txt
packages/testids/
├── src/
│   ├── packages/
│   │   ├── admin-ui/
│   │   ├── navigation-ui/
│   │   └── your-new-package/
│   └── index.ts
```

## 2. Adding a New Package

### 2.1. Create Package Structure

```txt
packages/testids/src/packages/your-package/
├── index.ts
├── feature-name/
│   ├── index.ts
│   ├── feature-name.testids.ts
│   └── feature-name.types.ts
```

### 2.2. Follow Naming Conventions

- Use kebab-case for test IDs
- Use PascalCase for exported constants
- Follow pattern: `[feature]-[component]-[element]`

## 3. Implementation Steps

### 3.1. Create Feature TestIDs File

```typescript
/**
 * WARNING: These test IDs are critical for automated testing.
 * Do not modify without approval from the testing team.
 */

export const FeatureNameTestIds = {
  Container: 'feature-container',
  // Group related elements
  Form: {
    Container: 'feature-form-container',
    Input: 'feature-form-input',
    Submit: 'feature-form-submit'
  },
  // Include states
  States: {
    Loading: 'feature-loading',
    Error: 'feature-error'
  }
} as const;
```

### 3.2. Create Types File

```typescript
import { FeatureNameTestIds } from './feature-name.testids';

export type IFeatureNameTestIds = typeof FeatureNameTestIds;
```

### 3.3. Create Feature Index File

```typescript
export { FeatureNameTestIds, type IFeatureNameTestIds } from './feature-name.testids';
```

### 3.4. Create Package Index File

```typescript
import { FeatureNameTestIds } from './feature-name';

export const YourPackageTestIds = {
  FeatureName: FeatureNameTestIds
} as const;

export type IYourPackageTestIds = typeof YourPackageTestIds;
```

### 3.5. Update Main Index File

```typescript

export { AdminUITestIds, type IAdminUITestIds } from './admin-ui';
export { NavigationUITestIds, type INavigationUITestIds } from './navigation-ui';
export { YourPackageTestIds, type IYourPackageTestIds } from './your-package';
```

## 4. TestID Guidelines

### 4.1. Naming Patterns

- Components: `[feature]-[component]-[element]`

  ```typescript
  Container: 'users-list-container'
  Button: 'users-list-add-button'
  ```

- Modals: `[feature]-[name]-modal-[element]`

  ```typescript
  Container: 'users-create-modal-container'
  Submit: 'users-create-modal-submit'
  ```

- Forms: `[feature]-[form]-[field]`

  ```typescript
  Input: 'users-form-email'
  Select: 'users-form-role'
  ```

### 4.2. Structure Best Practices

- Group related elements hierarchically
- Include state-related testIDs
- Keep IDs unique within feature scope
- Use consistent naming across similar components

## 5. Validation Rules

### 5.1. Required Checks

```typescript
// All testIDs must:
- Use kebab-case
- Start with feature name
- Be unique within feature scope
- Follow established patterns
- Be grouped logically
```

### 5.2. Common Patterns

```typescript
{
  Container: `${feature}-container`,
  States: {
    Loading: `${feature}-loading`,
    Error: `${feature}-error`
  },
  Actions: {
    Submit: `${feature}-submit`,
    Cancel: `${feature}-cancel`
  }
}
```

## 6. Usage Example

```typescript
// In your component:
import { YourPackageTestIds } from '@cortals/testids';

const YourComponent = () => (
  <div data-testid={YourPackageTestIds.FeatureName.Container}>
    <form data-testid={YourPackageTestIds.FeatureName.Form.Container}>
      <input data-testid={YourPackageTestIds.FeatureName.Form.Input} />
      <button data-testid={YourPackageTestIds.FeatureName.Form.Submit}>
        Submit
      </button>
    </form>
  </div>
);
```

## 7. Quality Checklist

Before submitting:

- [ ] TestIDs follow kebab-case convention
- [ ] All constants are properly typed
- [ ] Exports are properly set up
- [ ] TestIDs are unique within feature scope
- [ ] Groups are logically organized
- [ ] Documentation is included
- [ ] Types are properly exported
- [ ] Main index.ts is updated

Remember to follow the existing patterns in the codebase and maintain consistency with the established structure. This ensures maintainability and makes it easier for other developers to work with the testIDs.


---

## Tests.continuous Validation

> **When to apply:** Continuous validation and testing strategy with brain monitor integration

> **Scopes:** testing, validation, monitoring

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

---

## Tests.tdd Workflow

> **When to apply:** Test-Driven Development (TDD) workflow with 5-step process

> **Scopes:** testing, tdd

# TDD Workflow for New Features and Tests

## 🤖 AI Verification First Approach

**Core Principle**: Write tests that enable AI to reliably verify that functionality actually works for users.

**Key Question**: *"If this test passes, will AI know the feature works for real users?"*

## 🚦 Step-by-Step TDD Workflow

### 1. Choose Test Type Based on AI Verification Value
Ask: **"Which test best proves this behavior to an AI?"**

**Decision Framework**:
- **Critical User Workflow?** → **Browser E2E** (Highest AI verification value)
- **API or Business Logic?** → **Backend E2E** (Very High AI verification value)  
- **Feature Integration?** → **Integration** (High AI verification value)
- **Pure Function/Utility?** → **Unit** (Low AI verification value)

**AI Verification Value by Test Type**:
- **Browser E2E** — Complete user journey validation (AI can trust workflow works)
- **Backend E2E** — Full workflow without browser (AI can trust API/business logic works)
- **Integration** — Multiple modules + real dependencies (AI can trust feature components work together)
- **Unit** — Pure function/isolated class (AI cannot trust overall functionality from this alone)

### 2. Scaffold the File (📁 + 📄)  
Use this table to build the path & filename:

| Test Type        | Path template (relative to package root) | File name pattern                     | Runner      | AI Verification Value |
|------------------|-------------------------------------------|---------------------------------------|-------------|----------------------|
| Unit             | `<same-dir-as-source>`                    | `<sourceName>.unit.test.ts(x)`        | Vitest      | Low                  |
| Integration      | `testing/integration/`                    | `<module>.integration.test.ts(x)`     | Vitest      | High                 |
| Backend E2E      | `testing/e2e/`                            | `<scenario>.backend.e2e.test.ts`      | Vitest      | Very High            |
| Browser E2E      | `testing/e2e/`                            | `<scenario>.browser.e2e.ts`           | Playwright  | Very High            |

Then create an **empty failing test** (e.g. `test.todo('…')`).

### 3. Red (Write Failing Test)
Write the failing assertion that expresses **user-observable behavior**:

#### ✅ AI Verification Test Examples

**Browser E2E (Highest Value)**:
```javascript
test('user can complete purchase and receive confirmation', async () => {
  // This test enables AI to verify the entire purchase workflow works
  const user = await createTestUser();
  const product = await createTestProduct();
  
  await page.goto('/login');
  await login(user);
  await addProductToCart(product);
  await proceedToCheckout();
  await fillPaymentDetails();
  await submitOrder();
  
  // AI can trust: if this passes, purchase workflow works for users
  await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
  await expect(page.locator('[data-testid="order-number"]')).toContainText(/ORD-\d+/);
});
```

**Backend E2E (Very High Value)**:
```javascript
test('user registration creates account and sends welcome email', async () => {
  // This test enables AI to verify registration functionality works end-to-end
  const userData = { email: 'test@example.com', password: 'SecurePass123!' };
  
  const response = await api.post('/auth/register', userData);
  
  // AI can trust: if this passes, registration works completely
  expect(response.status).toBe(201);
  expect(response.data.user.id).toBeDefined();
  
  // Verify user was actually created in database
  const dbUser = await User.findByEmail(userData.email);
  expect(dbUser).toBeDefined();
  
  // Verify welcome email was sent
  const sentEmails = await getTestEmails();
  expect(sentEmails).toContainEqual(
    expect.objectContaining({
      to: userData.email,
      subject: expect.stringContaining('Welcome')
    })
  );
});
```

**Integration Test (High Value)**:
```javascript
test('payment service processes transactions with real gateway', async () => {
  // This test enables AI to verify payment processing works with real dependencies
  const order = await createTestOrder({ total: 100.00 });
  
  const result = await paymentService.processPayment({
    orderId: order.id,
    amount: order.total,
    paymentMethod: 'test-card'
  });
  
  // AI can trust: if this passes, payment processing works with real systems
  expect(result.success).toBe(true);
  expect(result.transactionId).toBeDefined();
  
  // Verify database was updated
  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder.status).toBe('paid');
});
```

#### ❌ Avoid Low AI Verification Value Tests

```javascript
// ❌ LOW VALUE: Tests implementation, not functionality
test('password validation function returns correct boolean', () => {
  expect(validatePassword('weak')).toBe(false);
  expect(validatePassword('Strong123!')).toBe(true);
  // AI cannot trust: if this passes, actual registration might still be broken
});

// ❌ LOW VALUE: Over-mocked, no real verification
test('user service calls repository with correct parameters', () => {
  const mockRepo = jest.fn();
  const service = new UserService(mockRepo);
  service.createUser({ name: 'John' });
  expect(mockRepo).toHaveBeenCalledWith({ name: 'John' });
  // AI cannot trust: mocks work, but real functionality unknown
});
```

### 4. Green (Implement Minimal Code)
Implement minimal code to pass the new test:
- Focus on making the **end-to-end workflow** work
- Don't over-engineer individual components
- **AI Goal**: Ensure the test passes by making the feature actually work for users

### 5. Refactor (Clean Up While Keeping Tests Green)
Clean up design & code smells while keeping tests green:
- Improve variable/function naming
- Extract repeated code into helper functions
- Simplify logic where possible
- **AI Goal**: Maintain confidence that feature works while improving code quality

### 6. Repeat until Feature Complete
Continue the Red-Green-Refactor cycle until the feature is fully implemented.

**AI Verification Focus**: Prioritize tests that verify complete user scenarios over isolated component tests.

## 🎯 AI-First Test Selection Strategy

### When to Write Each Test Type

#### **Start with High AI Verification Value Tests**
1. **Browser E2E**: For features with UI interaction
   - User registration/login flows
   - Purchase/checkout processes
   - Complex form workflows
   - Navigation and routing

2. **Backend E2E**: For API and business logic
   - Authentication flows
   - Data processing workflows
   - Integration with external services
   - Business rule validation

3. **Integration**: For feature components
   - Service layer interactions
   - Database operations
   - Multi-module workflows

#### **Add Unit Tests Sparingly**
- Complex algorithms or business rules
- Input validation logic
- Utility functions with edge cases
- **Only after** higher-value tests are in place

### Test Progression Example

```javascript
// 1. Start with Browser E2E (Highest AI Value)
test('user can register, login, and access dashboard', async () => {
  // Complete user workflow test
});

// 2. Add Backend E2E (Very High AI Value)  
test('registration API creates user and sends verification email', async () => {
  // API workflow test
});

// 3. Add Integration Tests (High AI Value)
test('auth service validates credentials with real database', async () => {
  // Service integration test
});

// 4. Add Unit Tests Only If Needed (Low AI Value)
test('password strength validator handles edge cases', () => {
  // Complex logic test - only if algorithm is complex
});
```

## ⚠️ Agent Execution Guidelines

**For AI agents running tests**: Always use non-interactive commands:

```bash
# ✅ Agent-safe test execution
pnpm test:run                           # Non-interactive test run
pnpm test:ci                            # CI mode
npx vitest run                          # Force run mode
npx playwright test                     # Playwright default non-interactive

# ❌ Avoid interactive modes
pnpm test                               # May enter watch mode
npx vitest                              # Defaults to watch mode
```

## ✅ Definition of Done

### AI Verification Checklist
- [ ] **Primary test type chosen** based on AI verification value (E2E > Integration > Unit)
- [ ] **Test verifies user-observable behavior**, not implementation details  
- [ ] **Minimal mocking** in critical paths - uses real systems where possible
- [ ] **Clear success criteria** - passing test means feature works for users
- [ ] **Complete workflow coverage** - test covers end-to-end user scenario

### Technical Checklist
- [ ] The chosen test type is documented in the test header
- [ ] At least one meaningful failing test became green  
- [ ] All existing tests (unit / integration / e2e) pass
- [ ] No unused mocks; external behavior validated
- [ ] Code & tests pushed with a descriptive commit message

## 🤖 AI Development Success Indicators

**Goal**: Tests enable AI to confidently verify functionality works

**Indicators**:
- ✅ **AI can run tests and trust results**: Passing tests mean features work for users
- ✅ **Clear feedback loop**: Failed tests indicate actual broken functionality
- ✅ **End-to-end coverage**: Critical user workflows have test coverage
- ✅ **Minimal false positives**: Tests don't pass when features are broken
- ✅ **Development velocity**: AI can iterate confidently based on test feedback

## 📚 Reference Testing Resources

For detailed guidance on testing frameworks, runner configuration, and advanced testing patterns, see:
- `tests.structure-and-standards.rules.mdc` - Complete testing standards with AI verification principles
- `@kit/testing` - Test runner configurations and utilities
- `packages/brain-sync-prompts/prompts/testing/creation/write-ai-verification-tests.prompt.md` - Detailed AI verification test patterns

---

## Tests.unified Testing

> **When to apply:** Unified testing strategy across unit, integration, and E2E tests

> **Scopes:** testing


## 🚨 UNIFIED TEST CREATION PROCESS (Single Integrated Flow)

This 5-step process is the single source of truth for creating any new test. It integrates the TDD philosophy with the practical application of skill-jacks.

### 🧭 **STEP 1: ORIENT & DECIDE**

**Goal:** Establish the "why" and "what" of your test.

1.  **Absorb the Philosophy:** First, read the core testing philosophy to align your mindset. This is non-negotiable.
    * **Read:** `.brain/skill-jacks/testing/creation/ai-verification-tdd-workflow.skill-jack.ts`
2.  **Choose Test Type:** Based on the goal of providing maximum AI confidence, select the single best test type for the behavior you need to verify.
    * **Ask:** *"Which test type most effectively proves this specific behavior from an end-user or consumer's perspective?"*
    * **Read:** `.brain/skill-jacks/testing/patterns/test-strategy-selection.skill-jack.ts` to guide your decision between:
        * **Unit Test:** For pure functions or isolated logic.
        * **Integration Test:** For interactions between several internal modules.
        * **Backend E2E Test:** For a complete user workflow via APIs or CLI, without a browser.
        * **Browser E2E Test:** For a full user journey in a browser.

### 🎯 **STEP 2: SCAFFOLD**

**Goal:** Create the test file and an empty, pending test case.

1.  **Determine File Path:** Use the table below to determine the correct location and name for your test file.
| Test Type        | Path Template (relative to package root) | File Name Pattern                     | Runner      |
|:-----------------|:-------------------------------------------|:--------------------------------------|:------------|
| **Unit** | `<same-dir-as-source>`                     | `<sourceName>.unit.test.ts(x)`        | Vitest      |
| **Integration** | `testing/integration/`                     | `<module>.integration.test.ts(x)`     | Vitest      |
| **Backend E2E** | `testing/e2e/`                             | `<scenario>.backend.e2e.test.ts`      | Vitest      |
| **Browser E2E** | `testing/e2e/`                             | `<scenario>.browser.e2e.ts`           | Playwright  |
2.  **Create an Empty Failing Test:** Populate the new file with a `test.todo()` or an empty test block.
    * *Example:* `test.todo('should successfully register a new user via the API');`

### 🔴 **STEP 3: RED**

**Goal:** Write a failing test that clearly expresses the desired behavior.

1.  **Consult the Pattern:** Before writing code, read the relevant skill-jack(s) for your chosen test type to understand the correct patterns (e.g., Test Object Model, Page Object Model). Refer to the **Quick Reference Menu** below for the exact file paths.
2.  **Write the Assertion:** Implement the test case. Focus on the final, observable outcome and write a specific assertion that will fail because the feature code doesn't exist yet.

### 🟢 **STEP 4: GREEN**

**Goal:** Write the minimum amount of application code required to make the test pass.

1.  **Implement the Feature:** Write just enough code to satisfy the test's assertion. Do not add extra logic or handle edge cases yet.
2.  **Verify the Pass:** Run the specific test file to confirm it now passes.
    * **Run:** `pnpm test:run path/to/your/new-test.ts`

### 🔧 **STEP 5: REFACTOR**

**Goal:** Clean up the implementation and test code while keeping all tests green.

1.  **Improve the Code:** Refactor both the application code and the test code. Improve names, remove duplication, and simplify logic.
2.  **Maintain the Safety Net:** After each significant change, run the full test suite to ensure you haven't broken existing functionality.
    * **Run:** `pnpm test:run`
3.  **Repeat:** Continue the Red-Green-Refactor cycle until the feature is complete.

---

## 📚 Quick Reference: Skill-Jack Menu

Use this menu to find the correct skill-jack for your chosen test type in the **RED** step.

### Core Patterns (Essential)
| Test Type          | Skill-Jack(s) to Read                                                                                                                                                              |
|:-------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Unit/Integration** | `.brain/skill-jacks/testing/core-patterns/unit-test-first-principles.skill-jack.ts`<br>`.brain/skill-jacks/testing/core-patterns/vitest-test-object-model.skill-jack.ts`          |
| **Browser E2E** | `.brain/skill-jacks/testing/core-patterns/playwright-browser-e2e.skill-jack.ts`<br>`.brain/skill-jacks/testing/core-patterns/playwright-pom-patterns.skill-jack.ts`                 |
| **Backend E2E** | `.brain/skill-jacks/testing/core-patterns/backend-api-e2e.skill-jack.ts`                                                                                                             |
| **CLI E2E** | `.brain/skill-jacks/testing/core-patterns/cli-application-e2e.skill-jack.ts`                                                                                                         |
| **Component** | `.brain/skill-jacks/testing/core-patterns/storybook-component-testing.skill-jack.ts`                                                                                                 |

### Specific Techniques (Specialized Scenarios)
| Scenario         | Skill-Jack to Read                                                                                 |
|:-----------------|:---------------------------------------------------------------------------------------------------|
| **Async Code** | `.brain/skill-jacks/testing/specific-techniques/async-testing-patterns.skill-jack.ts`                |
| **Databases** | `.brain/skill-jacks/testing/specific-techniques/database-testing-patterns.skill-jack.ts`             |
| **Performance** | `.brain/skill-jacks/testing/specific-techniques/performance-testing-strategies.skill-jack.ts`        |
| **Security** | `.brain/skill-jacks/testing/specific-techniques/security-testing-patterns.skill-jack.ts`             |
| **API Contracts**| `.brain/skill-jacks/testing/specific-techniques/api-contract-testing.skill-jack.ts`                  |

---

## ⚡ Other Mandatory Workflows

These processes are mandatory for their respective tasks.

### **Test Execution**
1.  **ORIENT:** Read `.brain/skill-jacks/testing/execution/test-execution-strategies.skill-jack.ts`
2.  **DECIDE:** Determine the scope (e.g., single test, suite, full CI/CD run).
3.  **SETUP:** Prepare the environment and required dependencies.
4.  **EXECUTE:** Run the tests with appropriate monitoring.

### **Test Debugging**
1.  **ORIENT:** Read `.brain/skill-jacks/testing/debugging/test-debugging-strategies.skill-jack.ts`
2.  **DECIDE:** Characterize the failure type (e.g., logic error, environment issue, timing problem).
3.  **ISOLATE:** Apply a systematic debugging approach to find the root cause.
4.  **FIX:** Implement the solution and verify with the test.

### **Test Quality Analysis**
1.  **ORIENT:** Read `.brain/skill-jacks/testing/quality/test-quality-analysis.skill-jack.ts`
2.  **ASSESS:** Evaluate tests against AI verification confidence and maintainability criteria.
3.  **MEASURE:** Analyze metrics like code coverage, performance, and flakiness.
4.  **IMPROVE:** Generate and apply specific recommendations for improvement.

---

## 📋 Test Implementation Standards

### 🧭 Testing Philosophy
1.  **Test real use, not implementation details.**
    -   Focus on behavior observable to users or consuming code.
    -   Avoid coupling tests to internal implementation details.
2.  **Mock only external dependencies.**
    -   Mock HTTP, time, environment variables, databases.
    -   Use real implementations of internal application code.
3.  **One-to-One Principle:**
    -   A passing test means the feature works.
    -   A failing test means something is broken.
    -   Tests should have clear, specific intent.
4.  **Test Type Selection:**
    -   **Unit tests:** Pure functions, isolated utilities, helpers.
    -   **Integration tests:** Modules with their actual dependencies.
    -   **E2E tests:** Complete workflows from the user's perspective.
5.  **Small, high-signal suite that runs on every change.**
6.  **Test failure requires investigation, not deletion.**

### 📁 Test File Structure & Naming
| Test Type   | Location Pattern                 | File Naming Pattern               | Runner     |
|:------------|:---------------------------------|:----------------------------------|:-----------|
| Unit        | Co-located with source code      | `<fileName>.unit.test.ts(x)`      | Vitest     |
| Integration | `<pkg>/testing/integration/`     | `<feature>.integration.test.ts(x)`| Vitest     |
| Backend E2E | `<pkg>/testing/e2e/`             | `<scenario>.backend.e2e.test.ts`  | Vitest     |
| Browser E2E | `<pkg>/testing/e2e/`             | `<scenario>.browser.e2e.ts`       | Playwright |

#### File Structure Example
For a package `packages/auth`:
```txt
packages/auth/
├── src/
│   ├── login.ts
│   ├── login.unit.test.ts              // Unit tests co-located with source
│   └── utils/
│       ├── validation.ts
│       └── validation.unit.test.ts
├── testing/
│   ├── integration/
│   │   └── auth-flow.integration.test.ts
│   └── e2e/
│       ├── login-flow.backend.e2e.test.ts
│       └── signup-flow.browser.e2e.ts
```

### 🛠️ Test Implementation Standards
-   **Clarity:** Test descriptions should clearly state what behavior is being tested.
-   **Structure:** Use the Arrange-Act-Assert pattern for test structure.
-   **Focus:** Each test should focus on a single behavior or scenario.
-   **Data:** Prefer table-driven tests for similar scenarios with different inputs/outputs.

### 🚫 Common Anti-patterns to Avoid
-   **Snapshot overuse:** Only use for UI component structure verification, not for application logic.
-   **Implementation testing:** Do not test internal methods or state directly. Focus on the public interface.
-   **Overlapping tests:** Do not duplicate coverage across different test types.
-   **Brittle assertions:** Avoid overly specific assertions that break with minor, unrelated changes.

### 🧰 Framework-Specific Guidance
For proper configuration, see:
-   **Unit tests:** `@kit/testing/unit`
-   **Integration tests:** `@kit/testing/integration`
-   **Backend E2E tests:** `@kit/testing/e2e`
-   **Playwright (Browser):** `@kit/testing/playwright`
-   **Playwright (Backend):** `@kit/testing/playwright-backend`

---

## ⚠️ AGENT COMPLIANCE & VALIDATION

### Key Directives
* **NEVER** skip the 5-step process for test creation.
* **ALWAYS** begin with the `ORIENT & DECIDE` step.
* **NEVER** write implementation code before a failing test (the **RED** step).
* **ALWAYS** use the full, exact file paths provided in the Quick Reference menu to read skill-jacks.
* **ALWAYS** use the Test Object Model (TOM) or Page Object Model (POM) patterns as guided by the skill-jacks.
* **NEVER** guess at file paths; use the exact paths listed.

### Validation Checklist
- [ ] Did I follow the 5-step `ORIENT -> SCAFFOLD -> RED -> GREEN -> REFACTOR` process exactly?
- [ ] Did I read the philosophy skill-jack in Step 1?
- [ ] Did I read the correct pattern skill-jack from the menu in Step 3?
- [ ] Does my test verify behavior, not implementation?
- [ ] Is the final code clean and the entire test suite 100% green?
- [ ] Does the test provide high AI verification confidence?

---

## 🔗 Related Rules (Testing Trio)

This rule is part of the **Testing Trio** that provides comprehensive auto-validation:

1. **`brain-monitor-validation.rules.mdc`** - Coordinates agent communication via `_errors/` reports
2. **`tests.continuous-validation.rules.mdc`** - Auto-executes tests after changes
3. **`tests.unified-testing.rules.mdc`** (THIS RULE) - Ensures TDD methodology and test quality

**How They Work Together:**
- `brain-monitor`: Check `_errors/` first before running validations
- `continuous-validation`: Auto-runs tests when you make changes
- `unified-testing`: Guides HOW to write tests (this rule)

**For Full Auto-Validation:** All three rules must be active (`alwaysApply: true`).

See `brain-monitor-validation.rules.mdc` for the complete workflow.