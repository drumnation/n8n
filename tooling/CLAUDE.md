# Tooling Packages - Development Rules

Shared configurations and build tools (ESLint, Prettier, TypeScript, Brain Monitor)

**Generated:** 2025-10-13
**Source:** .cursor/rules/*.mdc (auto-generated from modular rules)
**Context:** monorepo, global, tooling, node, backend

---

## Table of Contents

1. [00 Meta Rules System](#00-meta-rules-system)
2. [01 Foundation](#01-foundation)
3. [02 Validation Testing](#02-validation-testing)
4. [05 Backend Express](#05-backend-express)
5. [06 Backend Functional](#06-backend-functional)
6. [07 Documentation](#07-documentation)
7. [08 Workflow](#08-workflow)
8. [09 Ai Documentation Maintenance](#09-ai-documentation-maintenance)

---

## 00 Meta Rules System

> **When to apply:** Rules system architecture and modification protocol - ALWAYS read this first

> **Scopes:** monorepo, global


# Meta-Rules: Rules System Architecture

**⚠️ CRITICAL: READ THIS FIRST BEFORE FOLLOWING ANY OTHER RULES**

This file defines how the rules system works and how to modify it. All AI platforms (Claude, Gemini, Cline, Windsurf, LangGraph agents) must understand this architecture.

## Rules System Architecture

### Source of Truth: Modular .mdc Files
All rules are defined in **modular `.rules.mdc` files** in `.cursor/rules/`:
- `00-meta-rules-system.rules.mdc` - This file (meta-rules)
- `01-foundation.rules.mdc` - Core monorepo foundation
- `02-validation-testing.rules.mdc` - Brain monitor & TDD
- `03-frontend-patterns.rules.mdc` - Component patterns
- `04-react-standards.rules.mdc` - React best practices
- `05-backend-express.rules.mdc` - Express architecture
- `06-backend-functional.rules.mdc` - Functional patterns
- `07-documentation.rules.mdc` - Documentation & versioning
- `08-workflow.rules.mdc` - PR creation & commands
- `09-ai-documentation-maintenance.rules.mdc` - AI documentation maintenance

### Generated Files (DO NOT EDIT)
These files are **auto-generated** from the source `.rules.mdc` files:

**Never edit these files directly:**
- `docs/ai-platforms/CLAUDE.md` (Monorepo root context)
- `apps/web/CLAUDE.md` (React/Frontend context)
- `apps/server/CLAUDE.md` (Express/Backend context)
- `packages/universal/CLAUDE.md` (Universal package context)
- `tooling/CLAUDE.md` (Tooling packages context)
- `docs/ai-platforms/GEMINI.md` (and all other GEMINI.md files)
- `docs/ai-platforms/AGENTS.md` (and all other AGENTS.md files)
- `docs/ai-platforms/.clinerules` (Cline platform)
- `docs/ai-platforms/.windsurfrules` (Windsurf platform)

### YAML Frontmatter Structure
Each `.rules.mdc` file MUST include YAML frontmatter:

```yaml
---
description: Brief description of when to apply this rule
globs:
  - "**/*.ts"  # File patterns this rule applies to
  - "**/*.tsx"
alwaysApply: true  # or false
scopes:
  - monorepo  # Which contexts include this rule
  - global
  - react
  - frontend
---
```

**Available scopes:**
- `global` - Applies everywhere (all contexts)
- `monorepo` - Monorepo-wide rules
- `react`, `frontend`, `ui`, `components`, `vite`, `mantine` - Frontend/React contexts
- `express`, `backend`, `api`, `node`, `mongodb` - Backend/Server contexts
- `shared` - Universal package
- `tooling` - Tooling packages

**Special scope:**
- `*` - Include ALL rules (used only for monorepo root context)

## Rule Modification Protocol

### ⚠️ NEVER EDIT GENERATED FILES DIRECTLY

**ALWAYS follow this workflow:**

1. **Edit source `.rules.mdc` files** in `.cursor/rules/`
2. **Run the build command** to regenerate all platform files:
   ```bash
   pnpm rules:build
   ```
3. **Verify the output** in generated files

### Watch Mode (For Active Development)
```bash
pnpm rules:watch
```
This automatically rebuilds when `.rules.mdc` files change.

### What Happens When You Build
The build script (`.cursor/sync/build-consolidated-rules.ts`):
1. Reads all `.rules.mdc` files
2. Filters rules by scope for each context
3. Generates hierarchical CLAUDE.md files (5 contexts)
4. Generates hierarchical GEMINI.md files (5 contexts)
5. Generates hierarchical AGENTS.md files (5 contexts)
6. Generates single-file formats (.clinerules, .windsurfrules)

### Adding a New Rule File
1. Create `.cursor/rules/XX-new-rule.rules.mdc`
2. Add YAML frontmatter with description, globs, alwaysApply, and scopes
3. Write the rule content
4. Run `pnpm rules:build`
5. Verify the rule appears in appropriate generated files

### Modifying an Existing Rule
1. Edit the source `.rules.mdc` file
2. Run `pnpm rules:build`
3. Verify changes in generated files

### Removing a Rule
1. Delete (or rename with `_` prefix) the `.rules.mdc` file
2. Run `pnpm rules:build`
3. Verify rule is removed from generated files

## Documentation Placement Policy

**STRICT RULE: No documentation files in repository root**

### Allowed in Root Directory
- `README.md` - Project overview and quick start
- `CHANGELOG.md` - Version history
- `.env.example` - Environment variable template
- Configuration files (`.gitignore`, `tsconfig.json`, `package.json`, etc.)

### Required Placement for All Other Documentation
All other documentation MUST be placed under `/docs`:

```
/docs
├── architecture/        # System architecture, design decisions
├── features/           # Feature-specific documentation
├── development/        # Development guides, workflows
└── ai-platforms/       # AI platform rules (CLAUDE.md, GEMINI.md, etc.)
```

**Examples of PROHIBITED files in root:**
- ❌ `DOCUMENTATION_AUDIT.md` → Move to `/docs/development/`
- ❌ `ENV_SETUP_GUIDE.md` → Move to `/docs/development/`
- ❌ `ARCHITECTURE.md` → Move to `/docs/architecture/`
- ❌ `FEATURE_SPEC.md` → Move to `/docs/features/`
- ❌ Any other `.md` files except README.md and CHANGELOG.md

**Rationale:**
- Keeps root directory clean and focused
- Provides clear information architecture
- Prevents documentation sprawl
- Makes it easy to find documentation

## Quick Reference

### Daily Workflow Commands
```bash
# Edit a rule
vim .cursor/rules/03-frontend-patterns.rules.mdc

# Rebuild (required after editing)
pnpm rules:build

# Watch mode (auto-rebuild)
pnpm rules:watch
```

### File Organization
```
.cursor/
├── rules/              # SOURCE OF TRUTH (edit these)
│   ├── 00-meta-rules-system.rules.mdc
│   ├── 01-foundation.rules.mdc
│   ├── 02-validation-testing.rules.mdc
│   └── ...
├── sync/               # Build tooling
│   └── build-consolidated-rules.ts
└── docs/               # Documentation

docs/ai-platforms/      # GENERATED (never edit)
├── CLAUDE.md
├── GEMINI.md
├── AGENTS.md
├── .clinerules
└── .windsurfrules

apps/web/               # GENERATED (never edit)
├── CLAUDE.md
├── GEMINI.md
└── AGENTS.md

apps/server/            # GENERATED (never edit)
├── CLAUDE.md
├── GEMINI.md
└── AGENTS.md

packages/universal/     # GENERATED (never edit)
├── CLAUDE.md
├── GEMINI.md
└── AGENTS.md

tooling/                # GENERATED (never edit)
├── CLAUDE.md
├── GEMINI.md
└── AGENTS.md
```

### Build Script Locations
- **Script:** `.cursor/sync/build-consolidated-rules.ts`
- **Commands defined in:** `package.json` (root)

## Why This Matters

### For AI Assistants
- **Cursor** reads `.mdc` files directly from `.cursor/rules/`
- **Claude Code** uses `CLAUDE.md` files scoped to working directory
- **Gemini** uses `GEMINI.md` files scoped to working directory
- **Cline** uses `.clinerules` (single-file format)
- **Windsurf** uses `.windsurfrules` (single-file format)
- **LangGraph/Agents** use `AGENTS.md` files scoped to context

### For Developers
- Single source of truth prevents rule conflicts
- Hierarchical contexts provide focused, relevant rules
- Generated files ensure consistency across platforms
- Documentation placement policy keeps repository organized

### For the Project
- Maintainable: Edit once, deploy everywhere
- Scalable: Easy to add new rules or platforms
- Discoverable: Clear structure makes rules easy to find
- Auditable: Git history tracks rule changes in source files

---

**Remember:** If you're an AI assistant and you notice documentation in the root directory (except README.md, CHANGELOG.md, .env.example), suggest moving it to the appropriate `/docs` subdirectory.

**Remember:** If you're an AI assistant modifying rules, ALWAYS edit the source `.rules.mdc` files and run `pnpm rules:build`. NEVER edit generated files (CLAUDE.md, GEMINI.md, AGENTS.md, .clinerules, .windsurfrules) directly.


---

## 01 Foundation

> **When to apply:** Core monorepo foundation - structure, ESM, environment variables

> **Scopes:** monorepo, global


# Monorepo Foundation

## Core Principles
- **ESM-Only:** ES Modules exclusively. No CommonJS.
- **No Build for Libraries:** Packages export TypeScript source directly.
- **Shared Config:** All tooling centralized in `/tooling`. Never duplicate.
- **Agent Coordination:** Check `_errors/` and `_logs/` before running commands.

## Structure
```
/apps          # Executable applications (@cheddar-monorepo/[app-name])
/packages      # Shared libraries (@cheddar-monorepo/[package-name])
/tooling       # Shared config (@kit/*)
/_errors       # Validation reports (brain-monitor)
/_logs         # Real-time server logs
```

### Naming Patterns
- `/apps` → `@cheddar-monorepo/web`, `@cheddar-monorepo/server`
- `/packages` → `@cheddar-monorepo/universal`
- `/tooling` → `@kit/env-loader`, `@kit/eslint`, etc.

## Package Configuration Templates

### `package.json` for Libraries (/packages)
```json
{
  "name": "@cheddar-monorepo/[package-name]",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "files": ["src"],
  "scripts": {
    "clean": "rimraf node_modules .turbo",
    "format": "prettier --check \"**/*.{ts,tsx,md}\"",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@kit/eslint-config": "workspace:*",
    "@kit/prettier-config": "workspace:*",
    "@kit/testing": "workspace:*",
    "@kit/tsconfig": "workspace:*"
  },
  "eslintConfig": {
    "root": true,
    "extends": ["@kit/eslint-config/base"]
  },
  "prettier": "@kit/prettier-config"
}
```

### `tsconfig.json` for Libraries
**Note:** No `outDir` or `declaration` - we export source directly.
```json
{
  "extends": "@kit/tsconfig/node",
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

## Turbo Pipeline Configuration

### Root `turbo.json`
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
    "lint": { "cache": true },
    "typecheck": { "cache": true },
    "test": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "validate": {
      "dependsOn": ["lint", "typecheck", "test"],
      "cache": true
    }
  }
}
```

## Environment Variables (@kit/env-loader)
**Loading order:** `monorepo-root/.env` → `apps/my-app/.env` → `process.env`

```typescript
// Node.js
import { loadEnvironment, requireEnv } from '@kit/env-loader/node';
const result = loadEnvironment({ appName: 'api', required: ['DATABASE_URL'] });

// Browser (prefix with VITE_)
import { getEnv } from '@kit/env-loader/browser';
const API_URL = getEnv('VITE_API_URL', 'http://localhost:8080');
```


---

## 02 Validation Testing

> **When to apply:** Brain monitor validation workflow and TDD process

> **Scopes:** monorepo, global


# Validation & Testing

## Brain Monitor (MANDATORY)
**Always check reports FIRST:**
```bash
# Step 1: Check validation summary (DO THIS FIRST!)
cat _errors/validation-summary.md

# Step 2: Check dev server status
cat _logs/index.md

# Step 3: Tail logs if needed (don't start servers if already running!)
tail -f _logs/[package-name].log

# Step 4: Review specific errors if needed
cat _errors/reports/errors.typecheck-failures.md
cat _errors/reports/errors.lint-failures.md
cat _errors/reports/errors.test-failures-unit.md
```

**IMPORTANT: Crystal/Worktree Synchronization**
- `_logs/` and `_errors/` directories are tracked in git
- Logs persist on filesystem and sync across worktrees
- Multiple agents can read same logs without conflicts
- Check logs before starting dev servers to avoid duplication
- See `docs/automation/CRITICAL-Error-Task-Lists.md` for full coordination guide

## Commands
| Task | Command | When to Use |
|------|---------|-------------|
| Check Status | `cat _errors/validation-summary.md` | ALWAYS first! |
| All Validations | `pnpm brain:validate` | When reports are stale (>10 min) |
| Watch Mode | `pnpm brain:watch` | During active development |
| TypeScript | `pnpm brain:typecheck-failures` | Type errors only |
| Tests | `pnpm brain:test-failures-unit` | Unit test failures only |
| Dev Servers | `pnpm brain:dev` | Start with automatic logging |
| Monitor Logs | `pnpm brain:logs` | Real-time log monitoring |

**Before Starting Servers:**
- Check `_logs/index.md` to see if servers are already running
- Avoid duplicate `pnpm dev` commands (causes port conflicts)
- Only one agent should run `pnpm dev` per worktree
- Other agents should monitor logs via `tail -f _logs/*.log`

## TDD 5-Step Workflow

**STEP 1: ORIENT** - Choose test type (E2E > Integration > Unit)
**STEP 2: SCAFFOLD** - Create test file
**STEP 3: RED** - Write failing test
**STEP 4: GREEN** - Minimal code to pass
**STEP 5: REFACTOR** - Clean up

| Test Type | Path | Pattern | Runner |
|-----------|------|---------|--------|
| Unit | `<same-dir>` | `<name>.unit.test.ts(x)` | Vitest |
| Integration | `testing/integration/` | `<module>.integration.test.ts(x)` | Vitest |
| Backend E2E | `testing/e2e/` | `<scenario>.backend.e2e.test.ts` | Vitest |
| Browser E2E | `testing/e2e/` | `<scenario>.browser.e2e.ts` | Playwright |


---

## 05 Backend Express

> **When to apply:** Express.js backend architecture patterns

> **Scopes:** express, backend, api, node, mongodb


# Express Architecture

## Structure
```
src/
├─ modules/              # Feature modules
│   └─ <feature>/
│       ├─ <feature>.controller.ts
│       ├─ <feature>.service.ts
│       ├─ <feature>.repo.ts
│       └─ index.ts
├─ shared/               # App-internal
├─ infra/                # HTTP, DB setup
└─ main.ts
```

## File Naming
`<feature>.<role>.ts` where role = controller | service | repo | schema | dto | types | middleware

## Functional DI Pattern
```typescript
// Repository
export const makeUserRepo = (deps: { db: DbClient }) => ({
  list: () => deps.db.query<User[]>('SELECT * FROM users'),
});

// Controller
export const makeGetUsers = (userRepo: ReturnType<typeof makeUserRepo>) =>
  async (_req, res) => res.json(await userRepo.list());
```

## Limits (ESLint enforced)
- Max file: 500 lines
- Max function: 75 lines
- Complexity: ≤10
- Nesting: ≤4


---

## 06 Backend Functional

> **When to apply:** Functional patterns for scripts, CLIs, and standalone Node programs

> **Scopes:** node, backend, tooling


# Functional Isolated Concerns

## Use Cases
- Scripts, CLIs, background workers
- NOT for Express apps (see `05-backend-express.rules.mdc`)

## Structure
```
feature/
├─ feature.service.ts     # Pure business logic
├─ feature.repository.ts  # Data access
├─ feature.validation.ts  # Pure validation
├─ feature.types.ts       # TypeScript types
└─ index.ts               # Exports
```

## Transformation Rules
- Classes → Pure functions
- Constructor deps → Function params or closure
- Instance state → Function arguments
- Private methods → Non-exported functions

## Refactoring Checklist
- [ ] No classes exist
- [ ] All functions pure where possible
- [ ] Side effects isolated
- [ ] File pattern: `<name>.<purpose>.ts`


---

## 07 Documentation

> **When to apply:** Documentation strategy and versioning standards

> **Scopes:** monorepo, global, shared


# Documentation & Versioning

## Documentation Placement Policy

**⚠️ STRICT RULE: No documentation files in repository root**

See `00-meta-rules-system.rules.mdc` for complete policy details.

**Allowed in root:**
- `README.md` - Project overview
- `CHANGELOG.md` - Version history
- `.env.example` - Environment template
- Configuration files only

**All other documentation goes under `/docs`:**
- `/docs/architecture/` - System-wide architecture
- `/docs/features/` - Feature-specific docs
- `/docs/development/` - Development guides
- `/docs/ai-platforms/` - AI platform rules

## Documentation Hierarchy
1. **Package-level:** `packages/ui/docs/` (implementation details)
2. **Feature-level:** `/docs/features/[name]/` (cross-package)
3. **Global:** `/docs/architecture/` (system-wide)

## Required Files (Per Package)
- [ ] `README.md` (Overview, Installation, Usage, API)
- [ ] `CHANGELOG.md` (Keep a Changelog format)
- [ ] `package.json` (SemVer version)

## YAML Frontmatter
```yaml
---
title: "Feature Name"
description: "Brief description"
keywords: [api, caching]
last_updated: "YYYY-MM-DD"
---
```

## Versioning (SemVer 2.0.0)
- **MAJOR** (x.0.0) - Breaking changes
- **MINOR** (0.x.0) - New features
- **PATCH** (0.0.x) - Bug fixes

## CHANGELOG Updates
Move `[Unreleased]` → `[x.y.z] - YYYY-MM-DD` on release


---

## 08 Workflow

> **When to apply:** PR creation, git workflow, and essential commands

> **Scopes:** monorepo, global


# Workflow & Commands

## PR Creation Workflow

**1. Branch:**
```bash
git checkout qa && git pull origin qa
git checkout -b hotfix/descriptive-name
```

**2. PR Template:**
```markdown
# 🚑 Hotfix: [Brief Description]
## 🔍 Issue
[Issue description]
## 🛠 Fix
[Fix description]
## 📋 Changes
- [Change 1]
## 🧪 Testing
- [ ] [Test step 1]
```

**3. Create:**
```bash
printf '[content]' > /tmp/pr_description.md
gh pr create --base qa --head hotfix/branch --body-file /tmp/pr_description.md
rm /tmp/pr_description.md
```

## Pre-Review Checklist
- [ ] Check `_errors/validation-summary.md`
- [ ] All tests pass
- [ ] Updated CHANGELOG.md
- [ ] PR description accurate

## Essential Commands
```bash
pnpm dev                    # Start all apps
pnpm brain:validate         # Run all validations
pnpm brain:watch            # Watch mode
pnpm test                   # All tests
pnpm rules:build            # Regenerate rules
```


---

## 09 Ai Documentation Maintenance

> **When to apply:** AI agent responsibilities for documentation maintenance

> **Scopes:** global, monorepo


# AI Documentation Maintenance

> **When to apply:** Always - AI agents are responsible for maintaining documentation as part of every task

> **Scopes:** global, monorepo

## AI Agent Documentation Responsibilities

**Documentation is not optional** - it's an integral part of every task. If documentation is not updated, the task is incomplete.

### Your Role
- You are a documentation steward, not just a code writer
- Every change you make MUST be reflected in documentation
- Documentation decay is a bug - treat it as such
- Future AI agents will rely on your documentation accuracy

## Before Starting Any Task

1. **Read Relevant Documentation**
   - Review README.md in affected packages
   - Check CHANGELOG.md for recent changes
   - Read feature docs in `docs/features/` if applicable
   - Understand the three-tier documentation hierarchy

2. **Understand the Hierarchy**
   - **Package-level**: `packages/*/docs/` - Implementation details
   - **Feature-level**: `docs/features/*/` - Cross-package features
   - **Global**: `docs/architecture/` - System-wide architecture

3. **Check Existing Documentation**
   - Is there a README.md? Is it accurate?
   - Is there a CHANGELOG.md? Is it up-to-date?
   - Are there related feature docs?
   - Is the documentation structure complete?

## During Task Execution

1. **Keep Documentation Notes**
   - Track all changes for CHANGELOG entries
   - Note any breaking changes (version bump required)
   - Identify cross-package impacts (feature docs needed)
   - Document new APIs, functions, or components

2. **Identify Documentation Scope**
   - Single package change? → Update package README/CHANGELOG
   - Multi-package feature? → Create/update feature docs
   - Breaking change? → Version bump + migration guide
   - New package? → Full documentation suite required

3. **Monitor Impact**
   - Does this change affect other packages?
   - Will this break existing integrations?
   - Are there deprecations to announce?
   - Do examples need updating?

## Before Completing Any Task

**MANDATORY CHECKLIST** - Complete before marking task done:

- [ ] **CHANGELOG.md updated** with all changes in affected packages
- [ ] **README.md updated** if functionality, API, or usage changed
- [ ] **Feature docs created/updated** if changes span multiple packages
- [ ] **Version number bumped** if breaking changes (follow SemVer)
- [ ] **YAML frontmatter added** to any new markdown files
- [ ] **Links verified** between related documentation files
- [ ] **Code examples tested** and confirmed accurate
- [ ] **Migration guide written** for breaking changes

### Documentation Verification

Run this mental checklist:
1. Can a new developer understand what changed?
2. Are all new features documented?
3. Are breaking changes clearly marked?
4. Do all links work?
5. Are code examples copy-pasteable and correct?

## When Creating New Packages

**ALWAYS create complete documentation structure:**

1. **README.md** with these sections:
   - YAML frontmatter (title, description, keywords, last_updated)
   - Overview and purpose
   - Installation instructions
   - Exports and API surface
   - Usage examples with code
   - Testing instructions
   - Configuration details
   - Related documentation links

2. **CHANGELOG.md** with:
   - Keep a Changelog format
   - [Unreleased] section
   - Initial version entry with date
   - All features listed under [Added]

3. **docs/** directory with:
   - Implementation details
   - Architecture decisions
   - API reference
   - Integration guides

4. **Update root README.md**:
   - Add package to monorepo structure
   - Link to package documentation

## When Creating New Features

1. **Determine Feature Scope**
   - Is this feature used by multiple packages?
   - Does it span frontend and backend?
   - Is it a core system capability?

2. **Create Feature Documentation** if cross-package:
   - Location: `docs/features/[feature-name]/`
   - README.md with YAML frontmatter
   - Architecture overview
   - Data flow diagrams (text-based)
   - Integration points
   - Testing strategy
   - Related package links

3. **Update Package Documentation**:
   - Reference feature docs from package READMEs
   - Add feature-specific examples
   - Document package-specific implementation

## Documentation Quality Standards

### Writing Style
- **Clear and concise** - No fluff or marketing speak
- **Actionable** - Provide steps, not just descriptions
- **Complete** - Include all necessary information
- **Accurate** - Test all examples and verify links
- **Consistent** - Follow established patterns

### Code Examples
- **Working** - Must be copy-paste ready
- **Realistic** - Show actual use cases
- **Typed** - Include TypeScript types
- **Commented** - Explain non-obvious parts
- **Up-to-date** - Reflect current API

### YAML Frontmatter (Required)
```yaml
---
title: "Descriptive Title"
description: "Brief description of content"
keywords: [relevant, search, terms]
last_updated: "YYYY-MM-DD"
---
```

## CHANGELOG Entry Guidelines

Follow Keep a Changelog categories:

- **Added** - New features, new files, new capabilities
- **Changed** - Changes to existing functionality
- **Deprecated** - Features marked for removal
- **Removed** - Deleted features or files
- **Fixed** - Bug fixes
- **Security** - Security fixes or improvements

### Good CHANGELOG Entries
```markdown
### Added
- User authentication with Passport JWT strategy
- Transaction categorization with hierarchical categories
- Plaid integration for automatic transaction sync

### Changed
- API endpoints now return ISO 8601 timestamps
- Database queries optimized with indexes

### Fixed
- Transaction date parsing now handles all timezones
- Memory leak in WebSocket connections
```

### Bad CHANGELOG Entries
```markdown
### Added
- Stuff
- Things
- Updates

### Changed
- Fixed bugs
- Improved performance
```

## Version Bumping (SemVer 2.0.0)

Determine version bump type:

- **MAJOR (x.0.0)** - Breaking changes
  - API changes that break existing code
  - Removed features or exports
  - Changed function signatures
  - Requires migration guide

- **MINOR (0.x.0)** - New features (backward compatible)
  - New endpoints or functions
  - New optional parameters
  - New exports
  - No breaking changes

- **PATCH (0.0.x)** - Bug fixes (backward compatible)
  - Bug fixes only
  - Documentation updates
  - Performance improvements
  - No API changes

## Reference Documentation

- **Documentation hierarchy**: `docs/README.md`
- **Documentation rules**: `.cursor/rules/07-documentation.rules.mdc`
- **Rules system**: `.cursor/docs/README.md`
- **Keep a Changelog**: https://keepachangelog.com/
- **Semantic Versioning**: https://semver.org/

## Common Scenarios

### Scenario 1: Adding a New Feature to Existing Package
1. Implement feature with tests
2. Update package README.md with usage example
3. Add entry to package CHANGELOG.md under [Unreleased] → Added
4. Bump MINOR version if releasing
5. Update `last_updated` in YAML frontmatter

### Scenario 2: Fixing a Bug
1. Fix bug with test coverage
2. Add entry to CHANGELOG.md under [Unreleased] → Fixed
3. Bump PATCH version if releasing
4. Update related documentation if behavior changed

### Scenario 3: Breaking Change
1. Implement change
2. Write migration guide in CHANGELOG or docs/
3. Update all examples and documentation
4. Mark old API as deprecated first (if possible)
5. Add entry under [Unreleased] → Changed or Removed
6. Bump MAJOR version
7. Update `last_updated` everywhere affected

### Scenario 4: New Cross-Package Feature
1. Implement feature across packages
2. Create `docs/features/[feature-name]/README.md`
3. Update all affected package READMEs
4. Add CHANGELOG entries to all affected packages
5. Update `docs/features/README.md` with feature list
6. Bump appropriate versions

## Error Prevention

### Don't Do This
- ❌ Make changes without updating documentation
- ❌ Batch documentation updates at the end
- ❌ Copy-paste from AI without verifying
- ❌ Leave broken links
- ❌ Skip CHANGELOG entries
- ❌ Forget version bumps on breaking changes
- ❌ Write vague or incomplete descriptions

### Do This Instead
- ✅ Update docs as you code
- ✅ Verify all examples actually work
- ✅ Test all links and references
- ✅ Write detailed CHANGELOG entries
- ✅ Bump versions correctly
- ✅ Provide clear migration guides
- ✅ Review documentation before completing task

## Automation & Tools

### Before Committing
```bash
# Check that docs are up-to-date
pnpm rules:build  # Regenerate consolidated rules
git status        # Verify documentation changes included
```

### Documentation Validation
- All markdown files should have YAML frontmatter
- All code examples should have language tags
- All internal links should be relative
- All external links should be HTTPS

## Final Reminder

**No task is complete until documentation is updated.**

If you're unsure whether to update documentation, **err on the side of updating it**. Over-documentation is better than under-documentation.

Future you (and future AI agents) will thank you.
