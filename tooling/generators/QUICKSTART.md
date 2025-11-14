# Generator Quickstart Guide

## 🚀 Available Commands

```bash
# Initialize a brand new monorepo from scratch
pnpm gen:init

# Create a React web app (Vite + React + TypeScript)
pnpm gen:react-web

# Create a React Native mobile app (Expo)
pnpm gen:react-native

# Create an Electron desktop app (Electron + React)
pnpm gen:electron

# Create an Express REST API (Functional patterns)
pnpm gen:express-api
```

## 📋 Quick Decision Tree

### Starting from Scratch?
**Use:** `pnpm gen:init`
- Creates complete monorepo structure
- Sets up Turborepo, Brain Monitor, tooling
- Initializes git repository
- Then run other generators to add apps

### Building a Web Dashboard or SPA?
**Use:** `pnpm gen:react-web`
- Vite for blazing fast HMR
- React Router for navigation
- Redux/Zustand for state
- Mantine UI or Tailwind CSS

### Building a Mobile App?
**Use:** `pnpm gen:react-native`
- Expo for easy development
- Works on iOS, Android, Web
- Expo Router for navigation
- React Native Paper for UI

### Building a Desktop App?
**Use:** `pnpm gen:electron`
- Cross-platform (Mac, Windows, Linux)
- Main process + Renderer process setup
- IPC communication examples
- Auto-updater support

### Building a REST API?
**Use:** `pnpm gen:express-api`
- Express.js with TypeScript
- Functional DI pattern (no classes)
- Prisma or Mongoose database
- JWT auth, validation, logging

## 🎯 Common Workflows

### Workflow 1: Full-Stack Web App

```bash
# Step 1: Initialize monorepo
pnpm gen:init
# → Name: my-saas-platform
# → Scope: @mycompany
# → Features: All (Brain Monitor, Testing, ESLint, Prettier)

cd my-saas-platform

# Step 2: Create backend API
pnpm gen:express-api
# → Name: api
# → Database: Prisma (PostgreSQL)
# → Auth: Yes
# → Logging: Yes

# Step 3: Create frontend
pnpm gen:react-web
# → Name: web
# → Router: Yes
# → State: Redux Toolkit
# → UI: Mantine

# Step 4: Install dependencies
pnpm install

# Step 5: Start development
pnpm dev
```

### Workflow 2: Mobile + Backend

```bash
# Step 1: Initialize monorepo
pnpm gen:init
# → Name: my-mobile-app

cd my-mobile-app

# Step 2: Create API
pnpm gen:express-api
# → Name: api
# → Database: MongoDB (Mongoose)

# Step 3: Create mobile app
pnpm gen:react-native
# → Name: mobile
# → Template: Expo Router
# → State: Zustand

pnpm install
pnpm dev
```

### Workflow 3: Desktop App

```bash
# Step 1: Initialize monorepo
pnpm gen:init

cd my-desktop-app

# Step 2: Create Electron app
pnpm gen:electron
# → Name: desktop
# → UI: Mantine
# → State: Redux Toolkit
# → Auto-updater: Yes

pnpm install
pnpm dev
```

## 🔥 Pro Tips

### 1. Use Package Scope Consistently
All your packages should use the same scope:
- Apps: `@mycompany/web`, `@mycompany/api`
- Packages: `@mycompany/ui`, `@mycompany/utils`
- Tooling: `@kit/*` (shared across projects)

### 2. Leverage Brain Monitor
After generating apps, always check validation:
```bash
pnpm brain:validate    # Run all validations
pnpm brain:watch       # Watch mode during development
```

### 3. Follow Naming Conventions
- **Apps**: Descriptive names (`web`, `mobile`, `admin`, `api`)
- **Express modules**: Lowercase singular (`user`, `product`, `order`)
- **React components**: PascalCase (`UserProfile`, `ProductCard`)

### 4. Start Simple, Add Features Later
Don't add every feature at generation time:
- Start with minimal setup
- Add state management when you need it
- Add UI libraries as you build
- Add auth when you're ready to implement it

### 5. Use the Template as Your Base
This monorepo IS your template:
- When you need a new project, run `pnpm gen:init` in a new directory
- It will copy all your tooling configuration
- Your Brain Monitor setup comes for free
- All your ESLint/Prettier rules included

## 🆘 Troubleshooting

### Generator Command Not Found
```bash
# Make sure you're in the monorepo root
cd /path/to/scheduling-station

# Verify scripts exist
cat package.json | grep "gen:"
```

### Import Errors After Generation
```bash
# Run install from monorepo root
pnpm install

# Type check to see specific errors
pnpm typecheck
```

### Can't Start Dev Server
```bash
# Check if another instance is running
pnpm brain:logs

# Check for port conflicts
lsof -i :3000  # or whatever port
```

## 📚 Next Steps

After generating your apps:

1. **Review Generated Code**: Understand the structure before modifying
2. **Read the READMEs**: Each app has a README with specific instructions
3. **Check .env.example**: Copy to `.env` and configure
4. **Run Validations**: `pnpm typecheck && pnpm lint && pnpm test`
5. **Start Building**: Add your features!

## 🤝 Other Useful Generators to Build

Consider adding generators for:
- Shared UI component library (with Storybook)
- Database package (Prisma client wrapper)
- Auth package (JWT utilities)
- API client package (typed fetch wrapper)
- GraphQL API (Apollo Server)
- Serverless functions (Vercel/Netlify)

See `README.md` in this directory for how to add new generators.

