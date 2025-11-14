import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { ProjectConfig } from './types.js';

export async function generatePRD(config: ProjectConfig): Promise<void> {
  // Read template
  const templatePath = 'docs/maintenance/templates/prd-template.md';
  const template = await readFile(templatePath, 'utf-8');

  const date = new Date().toISOString().split('T')[0];

  // Replace placeholders with explicit delimiters
  let prd = template;

  // Simple text replacements
  prd = prd.replace(/\[PROJECT_NAME\]/g, config.name);
  prd = prd.replace(/\[Project Name\]/g, toTitleCase(config.name));
  prd = prd.replace(/\[DESCRIPTION\]/g, config.description);
  prd = prd.replace(/\[Brief description of the product\/feature - 1 sentence\]/g, config.description);
  prd = prd.replace(/YYYY-MM-DD/g, date);

  // Generate goals based on project type
  const goals = generateGoals(config);
  // More robust replacement - find the entire goals section
  prd = prd.replace(
    /1\. \*\*\[Goal 1 Title\]\*\*[\s\S]*?(?=\n## )/m,
    goals + '\n'
  );

  // Generate background context
  const background = generateBackgroundContext(config);
  prd = prd.replace(
    /\[Paragraph 1: Context and why this is needed\][\s\S]*?(?=\n## )/m,
    background + '\n'
  );

  // Generate functional requirements
  const functionalReqs = generateFunctionalRequirements(config);
  prd = prd.replace(
    /\*\*FR-001: \[Requirement Title\]\*\*[\s\S]*?(?=\n## )/m,
    functionalReqs + '\n'
  );

  // Generate non-functional requirements
  const nonFunctionalReqs = generateNonFunctionalRequirements(config);
  prd = prd.replace(
    /\*\*NFR-001: \[Performance\/Quality Requirement Title\]\*\*[\s\S]*?(?=\n## )/m,
    nonFunctionalReqs + '\n'
  );

  // Generate technical assumptions
  const techAssumptions = generateTechnicalAssumptions(config);
  prd = prd.replace(
    /\[Description of repository structure\][\s\S]*?(?=\n## )/m,
    techAssumptions + '\n'
  );

  // Generate epic list
  const epicList = generateEpicList(config);
  prd = prd.replace(
    /1\. \*\*\[Epic 1 Name\]\*\*[\s\S]*?(?=\n## |$)/m,
    epicList + '\n'
  );

  // Write PRD
  await mkdir('docs/architecture', { recursive: true });
  await writeFile('docs/architecture/prd.md', prd);

  console.log('  ✓ PRD created at docs/architecture/prd.md');
}

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateGoals(config: ProjectConfig): string {
  const goals: string[] = [];
  let goalNum = 1;

  if (config.projectType.includes('web')) {
    goals.push(
      `${goalNum}. **Build Modern Web Application**\n   - Create a responsive, performant web application using React and modern tooling\n`,
    );
    goalNum++;
  }

  if (config.projectType.includes('mobile')) {
    goals.push(
      `${goalNum}. **Deliver Mobile Experience**\n   - Provide native mobile experience for iOS and Android using React Native\n`,
    );
    goalNum++;
  }

  if (config.projectType.includes('desktop')) {
    goals.push(
      `${goalNum}. **Create Desktop Application**\n   - Build cross-platform desktop application with Electron\n`,
    );
    goalNum++;
  }

  if (config.projectType.includes('api')) {
    goals.push(
      `${goalNum}. **Establish Scalable Backend**\n   - Create RESTful API with Express.js following best practices\n`,
    );
    goalNum++;
  }

  if (config.features.authentication) {
    goals.push(
      `${goalNum}. **Implement Secure Authentication**\n   - Provide secure user authentication and authorization\n`,
    );
    goalNum++;
  }

  return goals.join('\n');
}

function generateBackgroundContext(config: ProjectConfig): string {
  const projectTypeText = config.projectType.join(', ').replace(/, ([^,]*)$/, ' and $1');

  const context = `This project aims to build ${config.description.toLowerCase()}. The system will consist of ${projectTypeText} components working together to deliver a cohesive user experience.

The primary motivation is to establish a modern, maintainable codebase using industry best practices and the Brain Garden monorepo template. This ensures scalability, code reusability, and efficient development workflows.

Success will be measured by functional completeness, code quality metrics (>80% test coverage), successful deployment to ${config.deployment.target === 'not-sure' ? 'production environment' : config.deployment.target}, and positive user feedback during initial rollout.
`;

  return context;
}

function generateFunctionalRequirements(config: ProjectConfig): string {
  const reqs: string[] = [];
  let reqNum = 1;

  if (config.projectType.includes('web') || config.projectType.includes('mobile') || config.projectType.includes('desktop')) {
    reqs.push(
      `**FR-${String(reqNum).padStart(3, '0')}: User Interface**\n- Responsive user interface with intuitive navigation\n- Consistent design language across all screens\n- Accessible components following WCAG AA standards\n`,
    );
    reqNum++;
  }

  if (config.features.authentication) {
    reqs.push(
      `**FR-${String(reqNum).padStart(3, '0')}: User Authentication**\n- User registration and login functionality\n- JWT-based session management\n- Password reset and account recovery\n`,
    );
    reqNum++;
  }

  if (config.features.database) {
    reqs.push(
      `**FR-${String(reqNum).padStart(3, '0')}: Data Persistence**\n- Store and retrieve user data securely\n- Support CRUD operations for all entities\n- Data integrity and validation\n`,
    );
    reqNum++;
  }

  if (config.projectType.includes('api')) {
    reqs.push(
      `**FR-${String(reqNum).padStart(3, '0')}: REST API**\n- RESTful endpoints following HTTP semantics\n- Request/response validation\n- Comprehensive error handling\n`,
    );
    reqNum++;
  }

  if (config.features.fileUploads) {
    reqs.push(
      `**FR-${String(reqNum).padStart(3, '0')}: File Management**\n- File upload with validation\n- Support for multiple file types\n- Secure file storage and retrieval\n`,
    );
    reqNum++;
  }

  return reqs.join('\n');
}

function generateNonFunctionalRequirements(config: ProjectConfig): string {
  const nfrs: string[] = [];

  nfrs.push(
    `**NFR-001: Performance**\n- API response time < 200ms for 95th percentile\n- Page load time < 2 seconds\n- Support 1000+ concurrent users\n`,
  );

  nfrs.push(
    `**NFR-002: Security**\n- All data encrypted in transit (HTTPS/TLS)\n- Input validation and sanitization\n- Protection against common vulnerabilities (OWASP Top 10)\n`,
  );

  nfrs.push(
    `**NFR-003: Code Quality**\n- Test coverage >80%\n- TypeScript strict mode enabled\n- All linting and formatting rules passing\n`,
  );

  return nfrs.join('\n');
}

function generateTechnicalAssumptions(config: ProjectConfig): string {
  const hasMultipleApps = config.projectType.length > 1;

  const repoStructure = `**Repository Structure**

Built as a pnpm monorepo following Brain Garden template structure:
- \`/apps\` - Application code (${config.projectType.join(', ')})
- \`/packages\` - Shared libraries and utilities
- \`/tooling\` - Shared configuration and build tools

All packages use TypeScript with ESM-only modules. No build step for libraries - source files exported directly.

**Service Architecture**

`;

  let architecture = '';

  if (hasMultipleApps) {
    architecture += 'Multi-application architecture with:\n';

    if (config.projectType.includes('web') || config.projectType.includes('mobile') || config.projectType.includes('desktop')) {
      architecture += '- Frontend application(s) consuming REST API\n';
    }

    if (config.projectType.includes('api')) {
      architecture += '- Express backend providing RESTful endpoints\n';
    }

    if (config.features.database) {
      architecture += `- Database layer using ${config.techStack.backend?.database || 'Prisma'} ORM\n`;
    }

    architecture += '- Shared TypeScript types across frontend/backend\n';
  } else {
    architecture += `Single application architecture:\n- ${config.projectType[0]} application\n`;
  }

  return repoStructure + architecture;
}

function generateEpicList(config: ProjectConfig): string {
  const epics: string[] = [];
  let epicNum = 1;

  epics.push(
    `${epicNum}. **Project Setup & Infrastructure** - Initialize monorepo with generators and tooling\n`,
  );
  epicNum++;

  if (config.features.authentication) {
    epics.push(
      `${epicNum}. **User Authentication** - Implement user registration, login, and session management\n`,
    );
    epicNum++;
  }

  if (config.features.database) {
    epics.push(
      `${epicNum}. **Data Layer** - Set up database schema, migrations, and data access layer\n`,
    );
    epicNum++;
  }

  if (config.projectType.includes('api')) {
    epics.push(
      `${epicNum}. **API Development** - Build RESTful API endpoints with validation and error handling\n`,
    );
    epicNum++;
  }

  if (config.projectType.includes('web') || config.projectType.includes('mobile') || config.projectType.includes('desktop')) {
    epics.push(
      `${epicNum}. **Frontend Development** - Create user interface components and pages\n`,
    );
    epicNum++;
  }

  epics.push(
    `${epicNum}. **Testing & Quality Assurance** - Implement comprehensive test suite (unit, integration, e2e)\n`,
  );
  epicNum++;

  epics.push(
    `${epicNum}. **Deployment & CI/CD** - Set up deployment pipeline and continuous integration\n`,
  );

  return epics.join('');
}
