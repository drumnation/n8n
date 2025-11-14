import prompts from 'prompts';
import type { ProjectConfig } from './types.js';

export async function runDiscovery(): Promise<ProjectConfig> {
  console.log('  Gathering project requirements...\n');

  const answers = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Project name (lowercase, hyphenated):',
      initial: 'my-app',
      validate: (value: string) =>
        /^[a-z0-9-]+$/.test(value)
          ? true
          : 'Use lowercase letters, numbers, and hyphens only',
    },
    {
      type: 'text',
      name: 'description',
      message: 'Project description:',
      initial: 'A new Brain Garden project',
    },
    {
      type: 'text',
      name: 'packageScope',
      message: 'Package scope (e.g., @mycompany):',
      initial: '@myorg',
      validate: (value: string) =>
        /^@[a-z0-9-]+$/.test(value)
          ? true
          : 'Must start with @ and use lowercase',
    },
    {
      type: 'multiselect',
      name: 'projectType',
      message: 'What do you want to build? (Space to select, Enter to continue)',
      choices: [
        { title: 'Web App (React + Vite)', value: 'web' },
        { title: 'Mobile App (React Native)', value: 'mobile' },
        { title: 'Desktop App (Electron)', value: 'desktop' },
        { title: 'API/Backend (Express)', value: 'api' },
      ],
      min: 1,
    },
    {
      type: 'multiselect',
      name: 'features',
      message: 'Select features to include:',
      choices: [
        { title: 'User Authentication', value: 'authentication' },
        { title: 'Database Support', value: 'database' },
        { title: 'File Uploads', value: 'fileUploads' },
        { title: 'Real-time (WebSockets)', value: 'realtime' },
        { title: 'Email Sending', value: 'email' },
        { title: 'Payment Processing', value: 'payments' },
        { title: 'Admin Dashboard', value: 'adminDashboard' },
        { title: 'API Documentation', value: 'apiDocs' },
      ],
    },
    {
      type: (prev, values) =>
        values.projectType.includes('web') ||
        values.projectType.includes('desktop')
          ? 'select'
          : null,
      name: 'frontendUi',
      message: 'Frontend UI library:',
      choices: [
        { title: 'Mantine (component library)', value: 'mantine' },
        { title: 'Tailwind CSS (utility-first)', value: 'tailwind' },
        { title: 'None (custom styles)', value: 'none' },
      ],
      initial: 0,
    },
    {
      type: (prev, values) =>
        values.projectType.includes('web') ||
        values.projectType.includes('mobile') ||
        values.projectType.includes('desktop')
          ? 'select'
          : null,
      name: 'frontendState',
      message: 'State management:',
      choices: [
        { title: 'Zustand (lightweight)', value: 'zustand' },
        { title: 'Redux Toolkit', value: 'redux' },
        { title: 'React Context only', value: 'context' },
        { title: 'None', value: 'none' },
      ],
      initial: 0,
    },
    {
      type: (prev, values) =>
        values.features.includes('database') && values.projectType.includes('api')
          ? 'select'
          : null,
      name: 'backendDatabase',
      message: 'Database ORM/ODM:',
      choices: [
        { title: 'Prisma (PostgreSQL/MySQL/SQLite)', value: 'prisma' },
        { title: 'Mongoose (MongoDB)', value: 'mongoose' },
        { title: 'None (add later)', value: 'none' },
      ],
      initial: 0,
    },
    {
      type: (prev, values) =>
        values.projectType.includes('api') ? 'select' : null,
      name: 'backendValidation',
      message: 'Request validation:',
      choices: [
        { title: 'Zod', value: 'zod' },
        { title: 'Yup', value: 'yup' },
        { title: 'None', value: 'none' },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'deploymentTarget',
      message: 'Deployment target:',
      choices: [
        { title: 'Vercel', value: 'vercel' },
        { title: 'AWS', value: 'aws' },
        { title: 'Heroku', value: 'heroku' },
        { title: 'Self-hosted', value: 'self-hosted' },
        { title: "Not sure yet", value: 'not-sure' },
      ],
      initial: 4,
    },
  ]);

  // Handle cancellation
  if (!answers.name) {
    console.log('\n❌ Setup cancelled\n');
    process.exit(0);
  }

  // Transform answers into ProjectConfig
  return transformAnswers(answers);
}

function transformAnswers(answers: any): ProjectConfig {
  // Build feature config
  const featuresList = answers.features || [];
  const features = {
    authentication: featuresList.includes('authentication'),
    database: featuresList.includes('database'),
    fileUploads: featuresList.includes('fileUploads'),
    realtime: featuresList.includes('realtime'),
    email: featuresList.includes('email'),
    payments: featuresList.includes('payments'),
    adminDashboard: featuresList.includes('adminDashboard'),
    apiDocs: featuresList.includes('apiDocs'),
  };

  // Build tech stack config
  const projectTypes = answers.projectType || [];
  const hasFrontend =
    projectTypes.includes('web') ||
    projectTypes.includes('mobile') ||
    projectTypes.includes('desktop');
  const hasBackend = projectTypes.includes('api');

  const techStack: ProjectConfig['techStack'] = {
    frontend: hasFrontend
      ? {
          framework: projectTypes.includes('mobile')
            ? 'react-native'
            : 'react',
          uiLibrary: answers.frontendUi || 'mantine',
          stateManagement: answers.frontendState || 'zustand',
          routing: true,
        }
      : null,
    backend: hasBackend
      ? {
          framework: 'express',
          database: answers.backendDatabase || 'none',
          validation: answers.backendValidation || 'zod',
          authentication: features.authentication ? 'jwt' : 'none',
          cors: true,
          logging: true,
        }
      : null,
  };

  return {
    name: answers.name,
    description: answers.description,
    packageScope: answers.packageScope,
    projectType: projectTypes,
    targetPlatforms: projectTypes,
    features,
    techStack,
    deployment: {
      target: answers.deploymentTarget,
    },
  };
}
