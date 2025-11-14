import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

interface MonorepoConfig {
  name: string;
  description: string;
  packageManager: 'pnpm' | 'yarn' | 'npm';
  packageScope: string;
  features: {
    brainMonitor: boolean;
    testing: boolean;
    prettier: boolean;
    eslint: boolean;
    typescript: boolean;
  };
  initialApps: string[];
}

async function getExeca() {
  const { execa } = await import('execa');
  return execa;
}

async function initializeMonorepo(config: MonorepoConfig, targetDir: string) {
  console.log(`\n🏗️  Initializing monorepo: ${config.name}\n`);

  const monorepoRoot = path.join(process.cwd(), targetDir);

  // Create directory structure
  await fs.mkdir(monorepoRoot, { recursive: true });
  await fs.mkdir(path.join(monorepoRoot, 'apps'), { recursive: true });
  await fs.mkdir(path.join(monorepoRoot, 'packages'), { recursive: true });
  await fs.mkdir(path.join(monorepoRoot, 'tooling'), { recursive: true });
  await fs.mkdir(path.join(monorepoRoot, 'docs'), { recursive: true });
  await fs.mkdir(path.join(monorepoRoot, 'docs/architecture'), { recursive: true });
  await fs.mkdir(path.join(monorepoRoot, 'docs/guides'), { recursive: true });
  await fs.mkdir(path.join(monorepoRoot, '_errors'), { recursive: true });
  await fs.mkdir(path.join(monorepoRoot, '_logs'), { recursive: true });

  // Generate root package.json
  const rootPackageJson = {
    name: config.name,
    version: '1.0.0',
    description: config.description,
    type: 'module',
    private: true,
    scripts: {
      dev: 'turbo run dev',
      build: 'turbo run build',
      clean: 'turbo run clean',
      typecheck: 'turbo run typecheck',
      lint: 'turbo run lint',
      format: 'turbo run format',
      test: 'turbo run test',
      'test:unit': 'turbo run test:unit',
      'test:integration': 'turbo run test:integration',
      'test:e2e': 'turbo run test:e2e',
      'test:coverage': 'turbo run test:coverage',
    },
    keywords: ['monorepo', config.packageScope.replace('@', ''), 'typescript'],
    author: `${config.name} Contributors`,
    license: 'MIT',
    devDependencies: {
      turbo: '^2.5.4',
      typescript: '^5.7.2',
      tsx: '^4.19.2',
    },
    packageManager: `${config.packageManager}@latest`,
    engines: {
      node: '>=18.0.0',
    },
  };

  // Add brain-monitor scripts if enabled
  if (config.features.brainMonitor) {
    Object.assign(rootPackageJson.scripts, {
      'brain:validate': 'brain-monitor validate',
      'brain:watch': 'brain-monitor watch',
      'brain:typecheck-failures': 'brain-monitor typecheck',
      'brain:lint-failures': 'brain-monitor lint',
      'brain:format-failures': 'brain-monitor format',
      'brain:logs': 'brain-monitor logs',
      'brain:dev': 'brain-monitor dev',
      'brain:test-failures-unit': 'brain-monitor test unit',
      'brain:test-failures-integration': 'brain-monitor test integration',
      'brain:test-failures-e2e': 'brain-monitor test e2e',
    });
    rootPackageJson.devDependencies['@kit/brain-monitor'] = 'workspace:*';
  }

  if (config.features.testing) {
    rootPackageJson.devDependencies['@kit/testing'] = 'workspace:*';
    rootPackageJson.devDependencies['vitest'] = '^3.2.4';
    rootPackageJson.devDependencies['@vitest/ui'] = '^3.2.4';
  }

  await fs.writeFile(
    path.join(monorepoRoot, 'package.json'),
    JSON.stringify(rootPackageJson, null, 2) + '\n',
  );

  // Generate pnpm-workspace.yaml
  if (config.packageManager === 'pnpm') {
    const workspaceYaml = `packages:
  - 'apps/*'
  - 'packages/*'
  - 'tooling/*'
`;
    await fs.writeFile(
      path.join(monorepoRoot, 'pnpm-workspace.yaml'),
      workspaceYaml,
    );
  }

  // Generate turbo.json
  const turboConfig = {
    $schema: 'https://turbo.build/schema.json',
    globalDependencies: ['**/.env'],
    tasks: {
      build: {
        dependsOn: ['^build'],
        outputs: ['dist/**', '.next/**', '!.next/cache/**'],
      },
      lint: {
        dependsOn: ['^lint'],
        outputs: ['node_modules/.cache/.eslintcache'],
      },
      'lint:fix': {
        dependsOn: ['^lint:fix'],
        outputs: ['node_modules/.cache/.eslintcache'],
      },
      format: {
        outputs: ['node_modules/.cache/.prettiercache'],
      },
      'format:fix': {
        outputs: ['node_modules/.cache/.prettiercache'],
      },
      typecheck: {
        dependsOn: ['^typecheck'],
        outputs: [],
      },
      test: {
        dependsOn: ['^build'],
        outputs: ['coverage/**'],
        inputs: ['src/**/*.tsx', 'src/**/*.ts', 'test/**/*.ts', 'test/**/*.tsx'],
      },
      'test:unit': {
        dependsOn: ['^build'],
        outputs: ['coverage/**'],
        inputs: ['src/**/*.tsx', 'src/**/*.ts', 'test/**/*.ts', 'test/**/*.tsx'],
      },
      'test:integration': {
        dependsOn: ['^build'],
        outputs: ['coverage/**'],
        inputs: ['src/**/*.tsx', 'src/**/*.ts', 'test/**/*.ts', 'test/**/*.tsx'],
      },
      'test:e2e': {
        dependsOn: ['^build'],
        outputs: ['coverage/**'],
        inputs: ['src/**/*.tsx', 'src/**/*.ts', 'test/**/*.ts', 'test/**/*.tsx'],
      },
      dev: {
        cache: false,
        persistent: true,
      },
    },
  };

  await fs.writeFile(
    path.join(monorepoRoot, 'turbo.json'),
    JSON.stringify(turboConfig, null, 2) + '\n',
  );

  // Generate tsconfig.base.json
  const tsconfigBase = {
    $schema: 'https://json.schemastore.org/tsconfig',
    display: 'Default',
    compilerOptions: {
      composite: false,
      declaration: true,
      declarationMap: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      inlineSources: false,
      isolatedModules: true,
      moduleResolution: 'bundler',
      module: 'ESNext',
      noUnusedLocals: false,
      noUnusedParameters: false,
      preserveWatchOutput: true,
      skipLibCheck: true,
      strict: true,
      target: 'ES2022',
      lib: ['ES2022'],
    },
    exclude: ['node_modules'],
  };

  await fs.writeFile(
    path.join(monorepoRoot, 'tsconfig.base.json'),
    JSON.stringify(tsconfigBase, null, 2) + '\n',
  );

  // Generate root tsconfig.json
  const rootTsconfig = {
    files: [],
    references: [],
  };

  await fs.writeFile(
    path.join(monorepoRoot, 'tsconfig.json'),
    JSON.stringify(rootTsconfig, null, 2) + '\n',
  );

  // Generate .gitignore
  const gitignore = `# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage
*.lcov
.nyc_output

# Production
dist
build
.next
out

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Turbo
.turbo

# IDEs
.idea
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
*.swp
*.swo
*~

# OS
Thumbs.db
`;

  await fs.writeFile(path.join(monorepoRoot, '.gitignore'), gitignore);

  // Generate README.md
  const readme = `# ${config.name}

${config.description}

## Getting Started

### Prerequisites

- Node.js 18+
- ${config.packageManager === 'pnpm' ? 'pnpm 9+' : config.packageManager === 'yarn' ? 'Yarn 1.22+' : 'npm 9+'}

### Installation

\`\`\`bash
${config.packageManager} install
\`\`\`

### Development

Start all apps in development mode:

\`\`\`bash
${config.packageManager} dev
\`\`\`

### Building

Build all apps and packages:

\`\`\`bash
${config.packageManager} build
\`\`\`

### Testing

Run all tests:

\`\`\`bash
${config.packageManager} test
\`\`\`

${config.features.brainMonitor ? `### Brain Monitor

This monorepo uses Brain Monitor for validation coordination:

\`\`\`bash
# Check validation status
${config.packageManager} brain:validate

# Watch mode for continuous validation
${config.packageManager} brain:watch

# Start dev servers with logging
${config.packageManager} brain:dev
\`\`\`

` : ''}## Monorepo Structure

\`\`\`
${config.name}/
├── apps/              # Applications
├── packages/          # Shared packages
├── tooling/           # Shared tooling (@kit/*)
├── docs/              # Documentation
├── _errors/           # Validation reports
└── _logs/             # Development logs
\`\`\`

## Package Naming Convention

- Apps: \`${config.packageScope}/[app-name]\`
- Packages: \`${config.packageScope}/[package-name]\`
- Tooling: \`@kit/[tool-name]\`

## Scripts

- \`${config.packageManager} dev\` - Start development servers
- \`${config.packageManager} build\` - Build all packages and apps
- \`${config.packageManager} lint\` - Lint all packages
- \`${config.packageManager} typecheck\` - Type check all packages
- \`${config.packageManager} test\` - Run all tests
- \`${config.packageManager} clean\` - Clean all build artifacts

## Contributing

Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
`;

  await fs.writeFile(path.join(monorepoRoot, 'README.md'), readme);

  // Generate CHANGELOG.md
  const changelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial monorepo setup
${config.initialApps.length > 0 ? config.initialApps.map(app => `- ${app} application`).join('\n') : ''}

## [1.0.0] - ${new Date().toISOString().split('T')[0]}

### Added
- Initial release
`;

  await fs.writeFile(path.join(monorepoRoot, 'CHANGELOG.md'), changelog);

  // Create VS Code settings
  await fs.mkdir(path.join(monorepoRoot, '.vscode'), { recursive: true });
  
  const vscodeSettings = {
    'typescript.tsdk': 'node_modules/typescript/lib',
    'typescript.enablePromptUseWorkspaceTsdk': true,
    'typescript.preferences.importModuleSpecifier': 'relative',
    'javascript.preferences.importModuleSpecifier': 'relative',
    'search.exclude': {
      '**/node_modules': true,
      '**/dist': true,
      '**/.turbo': true,
      '**/coverage': true,
    },
    'files.watcherExclude': {
      '**/node_modules/**': true,
      '**/.turbo/**': true,
      '**/dist/**': true,
    },
  };

  if (config.features.testing) {
    vscodeSettings['vitest.enable'] = true;
    vscodeSettings['vitest.maximumConfigs'] = 15;
  }

  await fs.writeFile(
    path.join(monorepoRoot, '.vscode/settings.json'),
    JSON.stringify(vscodeSettings, null, 2) + '\n',
  );

  const vscodeExtensions = {
    recommendations: [
      'dbaeumer.vscode-eslint',
      'esbenp.prettier-vscode',
      ...(config.features.testing ? ['vitest.explorer'] : []),
    ],
  };

  await fs.writeFile(
    path.join(monorepoRoot, '.vscode/extensions.json'),
    JSON.stringify(vscodeExtensions, null, 2) + '\n',
  );

  // Create .env.example
  const envExample = `# Environment variables template
# Copy this file to .env and fill in your values

NODE_ENV=development
`;

  await fs.writeFile(path.join(monorepoRoot, '.env.example'), envExample);

  // Create placeholder files for _errors and _logs
  await fs.writeFile(
    path.join(monorepoRoot, '_errors/.gitkeep'),
    '# This directory is used by brain-monitor for validation reports\n',
  );

  await fs.writeFile(
    path.join(monorepoRoot, '_logs/.gitkeep'),
    '# This directory is used by brain-monitor for development logs\n',
  );

  // Create basic documentation
  const architectureReadme = `---
title: "Architecture Documentation"
description: "System architecture and design decisions"
keywords: [architecture, design, monorepo]
last_updated: "${new Date().toISOString().split('T')[0]}"
---

# Architecture Documentation

This directory contains architectural documentation for ${config.name}.

## Structure

- **system-overview.md** - High-level system architecture
- **backend.md** - Backend architecture and patterns
- **frontend.md** - Frontend architecture and patterns
- **infrastructure.md** - Infrastructure and deployment
- **security.md** - Security architecture and practices

## Architecture Decision Records (ADRs)

ADRs document significant architectural decisions. See the \`decisions/\` subdirectory.

## Getting Started

Start with [system-overview.md](./system-overview.md) for a high-level overview of the system.
`;

  await fs.writeFile(
    path.join(monorepoRoot, 'docs/architecture/README.md'),
    architectureReadme,
  );

  console.log(`\n✅ Monorepo structure created!\n`);

  // Initialize git if not already in a git repo
  if (!existsSync(path.join(monorepoRoot, '.git'))) {
    console.log('📦 Initializing git repository...\n');
    const execaFn = await getExeca();
    await execaFn('git', ['init'], {
      cwd: monorepoRoot,
      stdio: 'inherit',
    });
    await execaFn('git', ['add', '.'], {
      cwd: monorepoRoot,
      stdio: 'inherit',
    });
    await execaFn(
      'git',
      ['commit', '-m', 'chore: initialize monorepo structure'],
      {
        cwd: monorepoRoot,
        stdio: 'inherit',
      },
    );
  }

  console.log(`✅ Monorepo initialized successfully!\n`);
  console.log(`📂 Location: ${monorepoRoot}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   cd ${targetDir}`);
  console.log(`   ${config.packageManager} install`);
  if (config.initialApps.length > 0) {
    console.log(`\n💡 Generate your initial apps:`);
    config.initialApps.forEach((app) => {
      console.log(`   ${config.packageManager} gen:${app}`);
    });
  }
  console.log(`\n📖 Documentation: ${path.join(targetDir, 'docs/README.md')}\n`);
}

async function main() {
  console.log('\n🎯 Monorepo Initializer\n');
  console.log('This will create a new monorepo from scratch using your project template.\n');

  const response = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Monorepo name (e.g., "my-project"):',
      validate: (value: string) =>
        /^[a-z0-9-]+$/.test(value) ? true : 'Use lowercase letters, numbers, and hyphens only',
    },
    {
      type: 'text',
      name: 'targetDir',
      message: 'Directory to create in (relative to current):',
      initial: (prev: string) => prev || 'my-project',
    },
    {
      type: 'text',
      name: 'description',
      message: 'Project description:',
      initial: 'A modern monorepo project',
    },
    {
      type: 'text',
      name: 'packageScope',
      message: 'Package scope (e.g., "@mycompany"):',
      initial: (prev: string, values: any) => `@${values.name}`,
      validate: (value: string) =>
        /^@[a-z0-9-]+$/.test(value) ? true : 'Must start with @ and use lowercase',
    },
    {
      type: 'select',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { title: 'pnpm (recommended)', value: 'pnpm' },
        { title: 'yarn', value: 'yarn' },
        { title: 'npm', value: 'npm' },
      ],
      initial: 0,
    },
    {
      type: 'multiselect',
      name: 'features',
      message: 'Select features to include:',
      choices: [
        { title: 'Brain Monitor (validation coordination)', value: 'brainMonitor', selected: true },
        { title: 'Testing (@kit/testing)', value: 'testing', selected: true },
        { title: 'Prettier (code formatting)', value: 'prettier', selected: true },
        { title: 'ESLint (code linting)', value: 'eslint', selected: true },
        { title: 'TypeScript', value: 'typescript', selected: true },
      ],
      min: 1,
    },
    {
      type: 'multiselect',
      name: 'initialApps',
      message: 'What types of apps do you want to generate? (optional)',
      choices: [
        { title: 'React Web (Vite)', value: 'react-web' },
        { title: 'React Native', value: 'react-native' },
        { title: 'Electron Desktop', value: 'electron' },
        { title: 'Express API', value: 'express-api' },
      ],
      hint: 'You can generate these later with pnpm gen:*',
    },
  ]);

  if (!response.name) {
    console.log('\n❌ Monorepo initialization cancelled\n');
    return;
  }

  // Check if target directory exists
  const targetPath = path.join(process.cwd(), response.targetDir);
  if (existsSync(targetPath)) {
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Directory ${response.targetDir} already exists. Continue anyway?`,
      initial: false,
    });

    if (!confirm) {
      console.log('\n❌ Aborted\n');
      return;
    }
  }

  const features = response.features.reduce(
    (acc: any, feature: string) => {
      acc[feature] = true;
      return acc;
    },
    {
      brainMonitor: false,
      testing: false,
      prettier: false,
      eslint: false,
      typescript: false,
    },
  );

  await initializeMonorepo(
    {
      name: response.name,
      description: response.description,
      packageManager: response.packageManager,
      packageScope: response.packageScope,
      features,
      initialApps: response.initialApps || [],
    },
    response.targetDir,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

