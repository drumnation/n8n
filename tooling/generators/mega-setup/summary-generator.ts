import { writeFile } from 'fs/promises';
import type {
  ProjectConfig,
  GeneratedApp,
  RuleRecommendation,
  ValidationResult,
} from './types.js';

export async function generateSummary(
  config: ProjectConfig,
  results: {
    generatedApps: GeneratedApp[];
    rules: RuleRecommendation[];
    validation: ValidationResult;
  },
): Promise<void> {
  const successfulApps = results.generatedApps.filter((a) => a.success);
  const failedApps = results.generatedApps.filter((a) => !a.success);

  const summary = `# 🎉 Project Setup Complete!

## Project: ${toTitleCase(config.name)}

${config.description}

---

## Generated Structure

### Applications

${successfulApps
  .filter((a) => a.type !== 'library')
  .map((a) => `- ✅ \`${a.path}\` - ${a.type}`)
  .join('\n')}

### Packages

${successfulApps
  .filter((a) => a.type === 'library')
  .map((a) => `- ✅ \`${a.path}\` - Shared library`)
  .join('\n')}

${
  failedApps.length > 0
    ? `\n### ⚠️ Failed Generations\n\n${failedApps.map((a) => `- ❌ ${a.name}: ${a.error}`).join('\n')}\n`
    : ''
}

---

## Documentation Created

- ✅ **PRD**: \`docs/architecture/prd.md\`
- ✅ **System Overview**: \`docs/architecture/system-overview.md\`
- ✅ **Root README**: \`README.md\` (updated)
- ✅ **CHANGELOG**: \`CHANGELOG.md\` (updated)

---

## Rules Recommended

### High Priority (${results.rules.filter((r) => r.priority === 'high').length})

${results.rules
  .filter((r) => r.priority === 'high')
  .map((r) => `- **${r.ruleName}** - ${r.reason}`)
  .join('\n')}

### Medium Priority (${results.rules.filter((r) => r.priority === 'medium').length})

${results.rules
  .filter((r) => r.priority === 'medium')
  .map((r) => `- **${r.ruleName}** - ${r.reason}`)
  .join('\n')}

### Low Priority (${results.rules.filter((r) => r.priority === 'low').length})

${results.rules
  .filter((r) => r.priority === 'low')
  .map((r) => `- **${r.ruleName}** - ${r.reason}`)
  .join('\n') || '_(None)_'}

---

## Validation Status

${results.validation.success ? '✅ **All validations passed!**' : '⚠️ **Some issues found**'}

${
  results.validation.autoFixed.length > 0
    ? `\n**Auto-fixed:** ${results.validation.autoFixed.join(', ')}\n`
    : ''
}

${
  results.validation.errors.length > 0
    ? `\n### Errors (${results.validation.errors.length})\n\nCheck \`_errors/validation-summary.md\` for details.\n`
    : ''
}

${
  results.validation.warnings.length > 0
    ? `\n### Warnings (${results.validation.warnings.length})\n\nCheck \`_errors/validation-summary.md\` for details.\n`
    : ''
}

---

## Tech Stack

${generateTechStackSummary(config)}

---

## Features Enabled

${generateFeaturesSummary(config)}

---

## Next Steps

### 1. Review Documentation

Start by reviewing the generated PRD to understand the project structure:

\`\`\`bash
cat docs/architecture/prd.md
\`\`\`

### 2. Configure Environment

${config.projectType.includes('api') ? 'Set up your environment variables for the API:\n\n```bash\ncp apps/api/.env.example apps/api/.env\n# Edit apps/api/.env with your configuration\n```\n' : ''}
${config.features.database && config.techStack.backend?.database === 'prisma' ? '\n### 3. Set Up Database\n\nInitialize your database:\n\n```bash\npnpm --filter @' + config.packageScope.slice(1) + '/api db:push\n```\n' : ''}

### ${config.features.database && config.techStack.backend?.database === 'prisma' ? '4' : '3'}. Start Development

Start all applications in development mode:

\`\`\`bash
pnpm dev
\`\`\`

Individual applications:

${successfulApps
  .filter((a) => a.type !== 'library')
  .map((a) => `- **${a.name}**: \`pnpm --filter ${config.packageScope}/${a.name} dev\``)
  .join('\n')}

### ${config.features.database && config.techStack.backend?.database === 'prisma' ? '5' : '4'}. Run Tests

Execute the test suite:

\`\`\`bash
pnpm test
\`\`\`

### ${config.features.database && config.techStack.backend?.database === 'prisma' ? '6' : '5'}. Validate Setup

Check for any issues:

\`\`\`bash
pnpm brain:validate
\`\`\`

Or check the summary:

\`\`\`bash
pnpm brain:check
\`\`\`

---

## Common Commands

| Command | Description |
|---------|-------------|
| \`pnpm dev\` | Start all apps in development mode |
| \`pnpm build\` | Build all apps for production |
| \`pnpm test\` | Run all tests |
| \`pnpm test:watch\` | Run tests in watch mode |
| \`pnpm lint\` | Lint all code |
| \`pnpm format\` | Format all code |
| \`pnpm typecheck\` | Type check all code |
| \`pnpm brain:validate\` | Run all validation checks |
| \`pnpm brain:watch\` | Watch for errors in real-time |
| \`pnpm brain:check\` | Check validation summary |

---

## Project Structure

\`\`\`
${config.name}/
├── apps/                   # Applications
${successfulApps
  .filter((a) => a.type !== 'library')
  .map((a) => `│   ├── ${a.name}/`)
  .join('\n')}
├── packages/               # Shared packages
${successfulApps
  .filter((a) => a.type === 'library')
  .map((a) => `│   ├── ${a.name}/`)
  .join('\n')}
├── tooling/                # Build tooling
│   ├── brain-monitor/      # Error monitoring
│   ├── generators/         # Code generators
│   └── tsconfig/           # TypeScript configs
├── docs/                   # Documentation
│   └── architecture/       # Architecture docs
├── _errors/                # Validation reports
└── _logs/                  # Development logs
\`\`\`

---

## Need Help?

### Documentation

- **PRD**: \`docs/architecture/prd.md\`
- **System Overview**: \`docs/architecture/system-overview.md\`
- **Template Usage**: \`docs/TEMPLATE_USAGE.md\`
- **Brain Monitor**: \`tooling/brain-monitor/README.md\`

### Guides

- **Development**: \`docs/guides/development.md\`
- **Testing**: \`docs/guides/testing.md\`
- **Deployment**: \`docs/guides/deployment.md\`

### Troubleshooting

If you encounter issues:

1. Check \`_errors/validation-summary.md\` for validation errors
2. Check \`_logs/\` for application logs
3. Run \`pnpm brain:validate\` to see current status
4. Review the relevant application's README in its directory

---

## Deployment

**Target**: ${config.deployment.target === 'not-sure' ? 'To be determined' : toTitleCase(config.deployment.target)}

${
  config.deployment.target === 'vercel'
    ? 'This project is configured for Vercel deployment. See `docs/guides/deployment.md` for instructions.'
    : config.deployment.target === 'aws'
      ? 'This project is configured for AWS deployment. See `docs/guides/deployment.md` for instructions.'
      : config.deployment.target === 'heroku'
        ? 'This project is configured for Heroku deployment. See `docs/guides/deployment.md` for instructions.'
        : config.deployment.target === 'self-hosted'
          ? 'This project is configured for self-hosted deployment. See `docs/guides/deployment.md` for instructions.'
          : 'Deployment instructions will be added once the target is determined.'
}

---

**Generated**: ${new Date().toISOString().split('T')[0]}
**Generator**: Brain Garden Mega Setup v1.0.0
`;

  await writeFile('SETUP_SUMMARY.md', summary);
  console.log('  ✓ Summary created at SETUP_SUMMARY.md');

  // Also display abbreviated version in console
  console.log('\n' + generateConsoleSummary(config, results));
}

function generateConsoleSummary(
  config: ProjectConfig,
  results: {
    generatedApps: GeneratedApp[];
    rules: RuleRecommendation[];
    validation: ValidationResult;
  },
): string {
  const successfulApps = results.generatedApps.filter((a) => a.success);

  return `
╔═══════════════════════════════════════════════════════════════╗
║                 🎉 SETUP COMPLETE!                           ║
╚═══════════════════════════════════════════════════════════════╝

Project: ${config.name}
Generated: ${successfulApps.length} apps/packages
Rules: ${results.rules.length} recommended
Status: ${results.validation.success ? '✅ Validated' : '⚠️ Needs attention'}

Next Steps:
  1. Review: cat docs/architecture/prd.md
  2. Start: pnpm dev
  3. Test: pnpm test
  4. Validate: pnpm brain:check

Full summary: SETUP_SUMMARY.md
`;
}

function generateTechStackSummary(config: ProjectConfig): string {
  const items: string[] = [];

  if (config.techStack.frontend) {
    const fe = config.techStack.frontend;
    items.push(
      `**Frontend**: ${toTitleCase(fe.framework)}, ${toTitleCase(fe.uiLibrary)}, ${toTitleCase(fe.stateManagement)}`,
    );
  }

  if (config.techStack.backend) {
    const be = config.techStack.backend;
    items.push(
      `**Backend**: ${toTitleCase(be.framework)}, ${toTitleCase(be.database)}, ${toTitleCase(be.validation)}`,
    );
  }

  return items.join('\n');
}

function generateFeaturesSummary(config: ProjectConfig): string {
  const enabled = Object.entries(config.features)
    .filter(([_, value]) => value)
    .map(([key, _]) => `- ✅ ${toTitleCase(key)}`);

  if (enabled.length === 0) {
    return '- No additional features configured';
  }

  return enabled.join('\n');
}

function toTitleCase(str: string): string {
  if (!str) return 'None';
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
