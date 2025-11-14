---
title: "@kit/generators"
description: "Project scaffolding and generation utilities for creating monorepos and apps"
keywords: [generators, scaffolding, cli, tooling, monorepo, react, electron, express]
last_updated: "2025-10-23"
---

# @kit/generators

> Project scaffolding and generation utilities for creating monorepos and applications

This directory contains code generators for bootstrapping entire monorepos and creating new applications using modern tooling patterns.

## Overview

These generators help you quickly scaffold production-ready projects with:
- **Monorepo structure** with Turborepo
- **Brain monitor integration** for validation coordination
- **ESM-only** module system
- **No-build libraries** (direct TypeScript exports)
- **Modern frameworks** (React, React Native, Electron, Express)

## 🚀 Mega Setup (Recommended)

The **mega setup system** provides a guided, all-in-one setup experience:

```bash
pnpm setup:mega
```

**What it does:**
- Conducts interactive discovery session (BMAD-style questions)
- Generates complete PRD from your answers
- Runs appropriate generators automatically
- Updates all documentation (README, CHANGELOG, system-overview)
- Recommends and activates rules based on project type
- Validates setup using brain-monitor
- Provides setup summary with next steps

**When to use:**
- Starting a new project from scratch
- Want a complete, validated setup quickly
- Prefer guided experience over manual configuration

**See:** [Mega Setup Guide](../../docs/guides/mega-setup-guide.md) for detailed documentation.

---

## Available Generators

For more control, you can use individual generators:

### 1. Monorepo Initializer

Bootstrap an entire monorepo from scratch with your preferred configuration.

**Command:**
```bash
pnpm gen:init
```

**Features:**
- Complete monorepo structure (apps/, packages/, tooling/)
- Turborepo configuration
- Brain Monitor integration
- TypeScript, ESLint, Prettier setup
- Git initialization
- VS Code workspace settings
- Documentation structure

**Use this when:** Starting a brand new project from scratch.

---

### 2. React Web App (Vite)

Create a modern React SPA with Vite.

**Command:**
```bash
pnpm gen:react-web
```

**Features:**
- Vite + React + TypeScript
- Optional: React Router, Redux/Zustand, Mantine UI, Tailwind CSS
- Hot Module Replacement (HMR)
- Production build optimization

**Use this when:** Building web applications or dashboards.

---

### 3. React Native App

Create a cross-platform mobile app with React Native.

**Command:**
```bash
pnpm gen:react-native
```

**Features:**
- Expo or Expo Router templates
- Optional: React Navigation, Redux/Zustand, React Native Paper
- iOS, Android, and Web support
- Fast Refresh

**Use this when:** Building mobile applications.

---

### 4. Electron Desktop App

Create a cross-platform desktop application with Electron + React.

**Command:**
```bash
pnpm gen:electron
```

**Features:**
- Electron + Vite + React
- Main process, renderer process, and preload script setup
- Optional: Redux/Zustand, Mantine UI, Tailwind CSS, auto-updater
- IPC communication examples
- Production builds for macOS, Windows, Linux

**Use this when:** Building desktop applications.

---

### 5. Express API

Create a REST API server with Express.js following functional patterns.

**Command:**
```bash
pnpm gen:express-api
```

**Features:**
- Express.js with TypeScript
- Functional DI pattern (no classes)
- Modular architecture (`<feature>.<role>.ts`)
- Optional: Prisma/Mongoose, Zod/Yup validation, JWT auth, CORS, Pino logging
- Sample CRUD module included

**Use this when:** Building backend APIs or microservices.

## Shared Utilities

### `utils.ts`

Shared utility functions used by all generators:

| Function | Purpose |
|----------|---------|
| `getWorkspacePackages()` | Scans workspace for available packages |
| `toCamelCase(str)` | Converts kebab-case to camelCase (e.g., 'my-module' → 'myModule') |
| `pascalCase(str)` | Converts kebab-case to PascalCase (e.g., 'my-module' → 'MyModule') |

## Usage Examples

### Starting a New Project

```bash
# Initialize a brand new monorepo
pnpm gen:init

# Answer the prompts:
# - Monorepo name: my-awesome-project
# - Package scope: @mycompany
# - Package manager: pnpm
# - Features: Brain Monitor, Testing, ESLint, Prettier
```

### Adding a Frontend App

```bash
# Navigate to your monorepo
cd my-awesome-project

# Generate a React web app
pnpm gen:react-web

# Answer the prompts:
# - App name: web
# - Include routing? Yes
# - State management: Redux Toolkit
# - UI library: Mantine
```

### Adding a Mobile App

```bash
# Generate a React Native app
pnpm gen:react-native

# Answer the prompts:
# - App name: mobile
# - Template: Expo Router
# - State management: Zustand
# - UI library: React Native Paper
```

### Adding an API Server

```bash
# Generate an Express API
pnpm gen:express-api

# Answer the prompts:
# - API name: api
# - Sample module: user
# - Database: Prisma
# - Include JWT auth? Yes
```

## Generated Structure Examples

### Monorepo Structure

```
my-project/
├── apps/              # Applications
│   ├── web/          # React web app
│   ├── mobile/       # React Native app
│   └── api/          # Express API
├── packages/         # Shared packages
├── tooling/          # Shared tooling (@kit/*)
│   ├── testing/
│   ├── eslint/
│   └── tsconfig/
├── docs/             # Documentation
├── _errors/          # Validation reports
├── _logs/            # Development logs
├── package.json      # Root package with turbo scripts
├── turbo.json        # Turborepo configuration
└── pnpm-workspace.yaml
```

### React Web App Structure

```
apps/web/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/
    └── pages/
```

### Express API Structure (Functional Pattern)

```
apps/api/
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── modules/
│   │   └── user/
│   │       ├── user.types.ts
│   │       ├── user.repo.ts      # Data access
│   │       ├── user.service.ts    # Business logic
│   │       ├── user.controller.ts # HTTP handlers
│   │       └── index.ts           # DI composition
│   ├── shared/
│   │   ├── errors/
│   │   └── logging/
│   └── infra/
│       ├── http/
│       │   ├── server.ts
│       │   └── routes.ts
│       └── db/
│           └── connection.ts
└── prisma/
    └── schema.prisma
```

## Design Philosophy

These generators follow key principles from your monorepo structure:

1. **ESM-Only**: All generated code uses ES Modules
2. **No-Build Libraries**: Packages export TypeScript source directly
3. **Functional Patterns**: Express APIs use functional DI (no classes)
4. **Brain Monitor Integration**: Validation coordination built-in
5. **Modern Tooling**: Vite, Turbo, TypeScript, ESLint, Prettier

## Adding New Generators

To create additional generators:

### Step 1: Create Directory

```bash
mkdir -p tooling/generators/{generator-name}
```

### Step 2: Create Main File

Create `tooling/generators/{generator-name}/index.ts`:
- `main()` function as entry point
- Interactive prompts using `prompts` library
- File generation with proper structure
- Dependency installation

### Step 3: Use Shared Utilities

```typescript
import { getWorkspacePackages, toCamelCase, pascalCase } from '../utils.js';
```

### Step 4: Add Script to Root package.json

```json
{
  "scripts": {
    "gen:{name}": "tsx tooling/generators/{generator-name}/index.ts"
  }
}
```

### Step 5: Follow Patterns

Study existing generators for patterns:
- Prompts with validation
- Directory structure creation
- File content generation
- Dependencies and configuration
- Post-generation steps

## Useful Generator Ideas

Consider creating generators for:
- **Shared UI Package**: Component library with Storybook
- **Shared Utils Package**: Utility functions
- **Database Package**: Prisma/Mongoose setup
- **Auth Package**: Authentication logic
- **Testing Package**: Test utilities and fixtures
- **CLI Tool**: Command-line interface
- **Worker Service**: Background job processor
- **GraphQL API**: Apollo Server setup

## Related Documentation

- [Monorepo Structure](/docs/architecture/system-overview.md) - Overall architecture
- [Backend Patterns](/.cursor/rules/05-backend-express.rules.mdc) - Express architecture
- [Functional Patterns](/.cursor/rules/06-backend-functional.rules.mdc) - Functional programming
- [Brain Monitor](/tooling/brain-monitor/README.md) - Validation coordination

## For AI Agents

### Generator Conventions

All generators:
- Use `prompts` for interactive input
- Generate complete, working code
- Install dependencies automatically
- Format generated files
- Create minimal but functional examples
- Include clear next steps in output

### File Naming Patterns

**Express APIs:** `<feature>.<role>.ts`
- `user.types.ts` - Type definitions
- `user.repo.ts` - Data access
- `user.service.ts` - Business logic
- `user.controller.ts` - HTTP handlers

**React Components:** PascalCase files
- `Button.tsx`, `UserProfile.tsx`

**Utilities:** camelCase with purpose
- `formatDate.ts`, `validateEmail.ts`

### Key Implementation Details

**Monorepo Initializer** (`init-monorepo/`):
- Creates full monorepo structure
- Configures Turborepo
- Sets up workspace configuration
- Initializes git repository

**Frontend Generators** (`create-react-*`, `create-electron/`):
- Use Vite for build tooling
- Include HMR configuration
- Optional state management
- Optional UI libraries

**Backend Generator** (`create-express-api/`):
- Functional DI pattern (no classes)
- Modular architecture
- Database integration options
- Sample CRUD module

### Testing Generated Code

After running a generator:
1. Navigate to generated directory
2. Run `pnpm install` if not auto-run
3. Run `pnpm dev` to test development server
4. Run `pnpm typecheck` to verify TypeScript
5. Run `pnpm lint` to verify code style
6. Run `pnpm test` if tests are generated
