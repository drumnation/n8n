import { readFile, writeFile, mkdir } from 'fs/promises';
import type { ProjectConfig, GeneratedApp } from './types.js';

export async function updateDocumentation(
  config: ProjectConfig,
  generatedApps: GeneratedApp[],
): Promise<void> {
  await updateRootReadme(config, generatedApps);
  await updateRootChangelog(config, generatedApps);
  await updateSystemOverview(config, generatedApps);

  console.log('  ✓ Documentation updated');
}

async function updateRootReadme(
  config: ProjectConfig,
  apps: GeneratedApp[],
): Promise<void> {
  try {
    const readme = await readFile('README.md', 'utf-8');

    // Update project name and description in first heading and description
    let updated = readme
      .replace(/^# .+$/m, `# ${toTitleCase(config.name)}`)
      .replace(/^> .+$/m, `> ${config.description}`);

    // Build package tables
    const successfulApps = apps.filter((a) => a.success);
    const appsTable = successfulApps
      .filter((a) => a.type !== 'library')
      .map((app) => `| \`${app.path}\` | ${app.type} | ${app.name} |`)
      .join('\n');

    const packagesTable = successfulApps
      .filter((a) => a.type === 'library')
      .map((app) => `| \`${app.path}\` | library | ${app.name} |`)
      .join('\n');

    // Better replacement logic for apps section
    const appsHeader = '## Applications';
    const appsTableHeader = '| Path | Type | Description |\n|------|------|-------------|';

    if (updated.includes(appsHeader)) {
      // Find the apps section and replace just the table rows
      const appsStart = updated.indexOf(appsHeader);
      const afterHeader = updated.substring(appsStart);
      const nextSection = afterHeader.indexOf('\n## ', appsHeader.length);

      if (nextSection !== -1) {
        // There's a next section - replace content between sections
        const appsSection = afterHeader.substring(0, nextSection);
        const newAppsSection = `${appsHeader}\n\n${appsTableHeader}\n${appsTable}\n`;
        updated = updated.substring(0, appsStart) + newAppsSection + afterHeader.substring(nextSection);
      } else {
        // Apps section is at the end
        const newAppsSection = `${appsHeader}\n\n${appsTableHeader}\n${appsTable}\n`;
        updated = updated.substring(0, appsStart) + newAppsSection;
      }
    } else {
      // No apps section exists - append it
      updated += `\n${appsHeader}\n\n${appsTableHeader}\n${appsTable}\n`;
    }

    // Better replacement logic for packages section
    if (packagesTable) {
      const packagesHeader = '## Packages';
      const packagesTableHeader = '| Path | Type | Description |\n|------|------|-------------|';

      if (updated.includes(packagesHeader)) {
        // Find the packages section and replace just the table rows
        const packagesStart = updated.indexOf(packagesHeader);
        const afterHeader = updated.substring(packagesStart);
        const nextSection = afterHeader.indexOf('\n## ', packagesHeader.length);

        if (nextSection !== -1) {
          // There's a next section - replace content between sections
          const packagesSection = afterHeader.substring(0, nextSection);
          const newPackagesSection = `${packagesHeader}\n\n${packagesTableHeader}\n${packagesTable}\n`;
          updated = updated.substring(0, packagesStart) + newPackagesSection + afterHeader.substring(nextSection);
        } else {
          // Packages section is at the end
          const newPackagesSection = `${packagesHeader}\n\n${packagesTableHeader}\n${packagesTable}\n`;
          updated = updated.substring(0, packagesStart) + newPackagesSection;
        }
      } else {
        // No packages section exists - append it
        updated += `\n${packagesHeader}\n\n${packagesTableHeader}\n${packagesTable}\n`;
      }
    }

    await writeFile('README.md', updated);
  } catch (error) {
    console.warn('  Warning: Could not update README.md:', error);
  }
}

async function updateRootChangelog(
  config: ProjectConfig,
  apps: GeneratedApp[],
): Promise<void> {
  try {
    const changelog = await readFile('CHANGELOG.md', 'utf-8');

    const date = new Date().toISOString().split('T')[0];
    const successfulApps = apps.filter((a) => a.success);

    const entry = `## [1.0.0] - ${date}

### Added

${successfulApps.map((a) => `- Generated ${a.type}: \`${a.path}\``).join('\n')}
- Complete project setup from mega-setup generator
- Comprehensive PRD and documentation

`;

    // Insert after # Changelog heading
    const updated = changelog.replace(
      /(# Changelog\n\n)/,
      `$1${entry}`,
    );

    await writeFile('CHANGELOG.md', updated);
  } catch (error) {
    console.warn('  Warning: Could not update CHANGELOG.md:', error);
  }
}

async function updateSystemOverview(
  config: ProjectConfig,
  apps: GeneratedApp[],
): Promise<void> {
  try {
    await mkdir('docs/architecture', { recursive: true });

    const diagram = generateMermaidDiagram(apps, config);
    const date = new Date().toISOString().split('T')[0];
    const successfulApps = apps.filter((a) => a.success);

    const overview = `---
title: System Overview
last_updated: ${date}
---

# System Overview

## Architecture

\`\`\`mermaid
${diagram}
\`\`\`

## Applications

${successfulApps
  .filter((a) => a.type !== 'library')
  .map((a) => `- **${a.name}** (\`${a.path}\`) - ${a.type}`)
  .join('\n')}

## Packages

${successfulApps
  .filter((a) => a.type === 'library')
  .map((a) => `- **${a.name}** (\`${a.path}\`) - Shared library`)
  .join('\n')}

## Tech Stack

${generateTechStackSection(config)}

## Features

${generateFeaturesSection(config)}

## Deployment

**Target:** ${config.deployment.target === 'not-sure' ? 'To be determined' : toTitleCase(config.deployment.target)}
`;

    await writeFile('docs/architecture/system-overview.md', overview);
  } catch (error) {
    console.warn('  Warning: Could not update system-overview.md:', error);
  }
}

function generateMermaidDiagram(
  apps: GeneratedApp[],
  config: ProjectConfig,
): string {
  const successfulApps = apps.filter((a) => a.success);
  const appNodes = successfulApps.filter((a) => a.type !== 'library');
  const pkgNodes = successfulApps.filter((a) => a.type === 'library');

  let diagram = 'graph TB\n    Root[Monorepo Root]\n';

  // Add app nodes
  appNodes.forEach((app) => {
    const nodeId = app.name.replace(/-/g, '');
    diagram += `    Root --> ${nodeId}[${app.name}<br/>${app.type}]\n`;
  });

  // Add package nodes
  pkgNodes.forEach((pkg) => {
    const nodeId = pkg.name.replace(/-/g, '');
    diagram += `    Root --> ${nodeId}[${pkg.name}<br/>library]\n`;
  });

  // Add connections based on config
  const hasWeb = config.projectType.includes('web');
  const hasApi = config.projectType.includes('api');
  const hasMobile = config.projectType.includes('mobile');
  const hasDesktop = config.projectType.includes('desktop');

  if (hasWeb && hasApi) {
    diagram += '    web[web] --> api[api]\n';
  }

  if (hasMobile && hasApi) {
    diagram += '    mobile[mobile] --> api[api]\n';
  }

  if (hasDesktop && hasApi) {
    diagram += '    desktop[desktop] --> api[api]\n';
  }

  // Connect packages to apps
  const hasSharedTypes = pkgNodes.some((p) => p.name === 'shared-types');
  if (hasSharedTypes) {
    if (hasWeb) diagram += '    web[web] --> sharedtypes[shared-types]\n';
    if (hasMobile) diagram += '    mobile[mobile] --> sharedtypes[shared-types]\n';
    if (hasDesktop) diagram += '    desktop[desktop] --> sharedtypes[shared-types]\n';
    if (hasApi) diagram += '    api[api] --> sharedtypes[shared-types]\n';
  }

  return diagram;
}

function generateTechStackSection(config: ProjectConfig): string {
  const stack: string[] = [];

  if (config.techStack.frontend) {
    const fe = config.techStack.frontend;
    stack.push(
      `### Frontend\n\n- Framework: ${toTitleCase(fe.framework)}\n- UI Library: ${toTitleCase(fe.uiLibrary)}\n- State Management: ${toTitleCase(fe.stateManagement)}\n- Routing: ${fe.routing ? 'Yes' : 'No'}`,
    );
  }

  if (config.techStack.backend) {
    const be = config.techStack.backend;
    stack.push(
      `### Backend\n\n- Framework: ${toTitleCase(be.framework)}\n- Database: ${toTitleCase(be.database)}\n- Validation: ${toTitleCase(be.validation)}\n- Authentication: ${toTitleCase(be.authentication)}\n- CORS: ${be.cors ? 'Enabled' : 'Disabled'}\n- Logging: ${be.logging ? 'Enabled' : 'Disabled'}`,
    );
  }

  return stack.join('\n\n');
}

function generateFeaturesSection(config: ProjectConfig): string {
  const enabledFeatures = Object.entries(config.features)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => `- ${toTitleCase(feature)}`);

  if (enabledFeatures.length === 0) {
    return '- No additional features configured';
  }

  return enabledFeatures.join('\n');
}

function toTitleCase(str: string): string {
  if (!str) return 'None';
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
