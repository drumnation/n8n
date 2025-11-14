import { readdir, access, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { ProjectConfig, RuleRecommendation } from './types.js';

export async function recommendRules(
  config: ProjectConfig,
): Promise<RuleRecommendation[]> {
  const recommendations: RuleRecommendation[] = [];
  const rulesSourcePath = '.cursor/rules-source';

  // Check if rules-source directory exists
  try {
    await access(rulesSourcePath);
  } catch {
    console.warn('  Warning: .cursor/rules-source directory not found');
    return recommendations;
  }

  // Scan for available rules
  const files = await readdir(rulesSourcePath);
  const ruleFiles = files.filter((f) => f.endsWith('.rules.mdc'));

  // Frontend rules
  if (
    config.projectType.includes('web') ||
    config.projectType.includes('mobile') ||
    config.projectType.includes('desktop')
  ) {
    addRecommendationIfExists(
      recommendations,
      ruleFiles,
      'atomic-design-component-strategy',
      rulesSourcePath,
      'Component organization best practices for React applications',
      'high',
      'frontend',
    );

    addRecommendationIfExists(
      recommendations,
      ruleFiles,
      'react-bulletproof-component-pattern',
      rulesSourcePath,
      'React component standards and patterns',
      'high',
      'frontend',
    );

    addRecommendationIfExists(
      recommendations,
      ruleFiles,
      'react-component-standards',
      rulesSourcePath,
      'Consistent React component development',
      'high',
      'frontend',
    );
  }

  // Backend rules
  if (config.projectType.includes('api')) {
    addRecommendationIfExists(
      recommendations,
      ruleFiles,
      'monorepo-node-express-architecture',
      rulesSourcePath,
      'Express API architecture patterns and best practices',
      'high',
      'backend',
    );

    addRecommendationIfExists(
      recommendations,
      ruleFiles,
      'backend-functional-patterns',
      rulesSourcePath,
      'Functional programming patterns for backend',
      'medium',
      'backend',
    );
  }

  // Testing rules (always recommended)
  addRecommendationIfExists(
    recommendations,
    ruleFiles,
    'tests.tdd-workflow',
    rulesSourcePath,
    'Test-driven development workflow',
    'high',
    'testing',
  );

  addRecommendationIfExists(
    recommendations,
    ruleFiles,
    'testing-strategy',
    rulesSourcePath,
    'Comprehensive testing strategy',
    'high',
    'testing',
  );

  // Documentation rules (always recommended)
  addRecommendationIfExists(
    recommendations,
    ruleFiles,
    'monorepo-documentation-strategy',
    rulesSourcePath,
    'Documentation standards and guidelines',
    'medium',
    'documentation',
  );

  addRecommendationIfExists(
    recommendations,
    ruleFiles,
    'ai-documentation-maintenance',
    rulesSourcePath,
    'AI-assisted documentation maintenance',
    'medium',
    'documentation',
  );

  // Monorepo rules (always recommended)
  addRecommendationIfExists(
    recommendations,
    ruleFiles,
    'monorepo-foundation',
    rulesSourcePath,
    'Core monorepo structure and conventions',
    'high',
    'monorepo',
  );

  // Database rules
  if (config.features.database) {
    if (config.techStack.backend?.database === 'prisma') {
      addRecommendationIfExists(
        recommendations,
        ruleFiles,
        'prisma-best-practices',
        rulesSourcePath,
        'Prisma ORM best practices',
        'medium',
        'backend',
      );
    } else if (config.techStack.backend?.database === 'mongoose') {
      addRecommendationIfExists(
        recommendations,
        ruleFiles,
        'mongoose-patterns',
        rulesSourcePath,
        'Mongoose ODM patterns',
        'medium',
        'backend',
      );
    }
  }

  // State management rules
  if (config.techStack.frontend?.stateManagement === 'redux') {
    addRecommendationIfExists(
      recommendations,
      ruleFiles,
      'redux-toolkit-patterns',
      rulesSourcePath,
      'Redux Toolkit state management patterns',
      'medium',
      'frontend',
    );
  } else if (config.techStack.frontend?.stateManagement === 'zustand') {
    addRecommendationIfExists(
      recommendations,
      ruleFiles,
      'zustand-patterns',
      rulesSourcePath,
      'Zustand state management patterns',
      'medium',
      'frontend',
    );
  }

  // Verify rules exist
  const verifiedRecommendations = await verifyRules(recommendations);

  console.log(
    `  ✓ Recommended ${verifiedRecommendations.length} rules (${verifiedRecommendations.filter((r) => r.priority === 'high').length} high priority)`,
  );

  // Apply recommended rules
  if (verifiedRecommendations.length > 0) {
    await applyRecommendedRules(verifiedRecommendations, config);
  }

  return verifiedRecommendations;
}

function addRecommendationIfExists(
  recommendations: RuleRecommendation[],
  availableFiles: string[],
  ruleName: string,
  basePath: string,
  reason: string,
  priority: 'high' | 'medium' | 'low',
  category: RuleRecommendation['category'],
): void {
  // Check various file name patterns
  const patterns = [
    `${ruleName}.rules.mdc`,
    `${ruleName}.mdc`,
    // Check with number prefix (e.g., 01-monorepo-foundation.rules.mdc)
    ...availableFiles.filter((f) => f.includes(ruleName)),
  ];

  const matchingFile = availableFiles.find((f) =>
    patterns.some((p) => f === p || f.endsWith(ruleName + '.rules.mdc')),
  );

  if (matchingFile) {
    recommendations.push({
      ruleName,
      filePath: join(basePath, matchingFile),
      reason,
      priority,
      category,
    });
  }
}

async function verifyRules(
  recommendations: RuleRecommendation[],
): Promise<RuleRecommendation[]> {
  const verified: RuleRecommendation[] = [];

  for (const rec of recommendations) {
    try {
      await access(rec.filePath);
      verified.push(rec);
    } catch {
      // Rule file doesn't exist, skip it
      console.warn(
        `  Warning: Recommended rule not found: ${rec.filePath}`,
      );
    }
  }

  return verified;
}

async function applyRecommendedRules(
  recommendations: RuleRecommendation[],
  config: ProjectConfig,
): Promise<void> {
  console.log('  Applying recommended rules to project...');

  try {
    // Create .cursor/rules directory if it doesn't exist
    await mkdir('.cursor/rules', { recursive: true });

    // Create a rules index file
    const rulesIndex = recommendations
      .map((r) => {
        return `## ${r.ruleName}

**Priority:** ${r.priority}
**Category:** ${r.category}
**Reason:** ${r.reason}
**Source:** ${r.filePath}
`;
      })
      .join('\n---\n\n');

    const indexContent = `# Recommended Rules for ${config.name}

This file lists all recommended rules for this project based on its configuration.

${rulesIndex}

## How to Use

These rules are sourced from \`.cursor/rules-source/\` and should be applied via the rules build system:

\`\`\`bash
pnpm rules:build
\`\`\`

This will regenerate all platform-specific rule files (CLAUDE.md, GEMINI.md, etc.).
`;

    await writeFile('.cursor/rules-index.md', indexContent);
    console.log('  ✓ Created rules index at .cursor/rules-index.md');

    // Create per-app documentation helpers (Fix 5)
    await createPerAppDocumentation(recommendations, config);
  } catch (error) {
    console.warn('  Warning: Could not apply rules:', error);
  }
}

async function createPerAppDocumentation(
  recommendations: RuleRecommendation[],
  config: ProjectConfig,
): Promise<void> {
  // Create documentation helpers for each generated app
  const apps = config.projectType;

  for (const appType of apps) {
    const appName = appType === 'api' ? 'api' : appType === 'web' ? 'web' : appType === 'mobile' ? 'mobile' : 'desktop';
    const appPath = `apps/${appName}`;

    try {
      // Create docs directory in app
      await mkdir(`${appPath}/docs`, { recursive: true });

      // Filter relevant rules for this app type
      const relevantRules = recommendations.filter((r) => {
        if (appType === 'api') {
          return r.category === 'backend' || r.category === 'testing' || r.category === 'documentation';
        } else {
          return r.category === 'frontend' || r.category === 'testing' || r.category === 'documentation';
        }
      });

      const appRulesDoc = `# ${appName.toUpperCase()} - Development Guidelines

## Relevant Rules

This app should follow these development rules:

${relevantRules
  .map((r) => {
    return `### ${r.ruleName}

- **Priority:** ${r.priority}
- **Reason:** ${r.reason}
- **Source:** \`${r.filePath}\`
`;
  })
  .join('\n')}

## Quick Reference

For full rule details, refer to the monorepo root \`.cursor/rules-source/\` directory.

To regenerate consolidated rules:

\`\`\`bash
pnpm rules:build
\`\`\`
`;

      await writeFile(`${appPath}/docs/development-guidelines.md`, appRulesDoc);
      console.log(`  ✓ Created guidelines for ${appName}`);
    } catch (error) {
      // App directory might not exist yet, skip
    }
  }
}
