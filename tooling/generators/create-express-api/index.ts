import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import { pascalCase, toCamelCase } from '../utils.js';

interface AppConfig {
  name: string;
  packageScope: string;
  description: string;
  features: {
    database: 'prisma' | 'mongoose' | 'none';
    validation: 'zod' | 'yup' | 'none';
    auth: boolean;
    cors: boolean;
    logging: boolean;
  };
  sampleModule: string;
}

async function getExeca() {
  const { execa } = await import('execa');
  return execa;
}

async function createExpressApi(config: AppConfig) {
  const appDir = path.join('apps', config.name);
  const packageName = `${config.packageScope}/${config.name}`;

  console.log(`\n🚀 Creating Express API: ${packageName}\n`);

  // Create directory structure following monorepo-node-express-architecture
  await fs.mkdir(appDir, { recursive: true });
  await fs.mkdir(path.join(appDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/modules'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/modules', config.sampleModule), {
    recursive: true,
  });
  await fs.mkdir(path.join(appDir, 'src/shared'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/shared/errors'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/shared/logging'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/infra'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/infra/http'), { recursive: true });

  if (config.features.database !== 'none') {
    await fs.mkdir(path.join(appDir, 'src/infra/db'), { recursive: true });
  }

  // Create package.json
  const packageJson = {
    name: packageName,
    private: true,
    version: '0.1.0',
    type: 'module',
    description: config.description,
    main: 'dist/main.js',
    scripts: {
      dev: 'tsx watch src/main.ts',
      build: 'tsc',
      start: 'node dist/main.js',
      lint: 'eslint . --ext .ts',
      typecheck: 'tsc --noEmit',
      format: 'prettier --check "src/**/*.ts"',
      test: 'vitest run',
      'test:watch': 'vitest',
      clean: 'rimraf node_modules .turbo dist',
    },
    dependencies: {
      express: '^5.0.1',
      '@kit/env-loader': 'workspace:*',
    },
    devDependencies: {
      '@types/express': '^5.0.0',
      '@types/node': '^22.10.2',
      '@kit/eslint-config': 'workspace:*',
      '@kit/prettier-config': 'workspace:*',
      '@kit/testing': 'workspace:*',
      '@kit/tsconfig': 'workspace:*',
      tsx: '^4.19.2',
      typescript: '^5.7.2',
      vitest: '^3.2.4',
    },
    eslintConfig: {
      root: true,
      extends: ['@kit/eslint-config/services', '@kit/eslint-config/apps'],
    },
    prettier: '@kit/prettier-config',
  };

  // Add optional dependencies
  if (config.features.database === 'prisma') {
    packageJson.dependencies['@prisma/client'] = '^6.2.1';
    packageJson.devDependencies['prisma'] = '^6.2.1';
    packageJson.scripts['db:generate'] = 'prisma generate';
    packageJson.scripts['db:migrate'] = 'prisma migrate dev';
    packageJson.scripts['db:push'] = 'prisma db push';
  } else if (config.features.database === 'mongoose') {
    packageJson.dependencies['mongoose'] = '^8.9.3';
  }

  if (config.features.validation === 'zod') {
    packageJson.dependencies['zod'] = '^3.24.1';
  } else if (config.features.validation === 'yup') {
    packageJson.dependencies['yup'] = '^1.4.0';
  }

  if (config.features.auth) {
    packageJson.dependencies['jsonwebtoken'] = '^9.0.2';
    packageJson.devDependencies['@types/jsonwebtoken'] = '^9.0.7';
  }

  if (config.features.cors) {
    packageJson.dependencies['cors'] = '^2.8.5';
    packageJson.devDependencies['@types/cors'] = '^2.8.17';
  }

  if (config.features.logging) {
    packageJson.dependencies['pino'] = '^9.6.0';
    packageJson.dependencies['pino-pretty'] = '^13.0.0';
  }

  await fs.writeFile(
    path.join(appDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n',
  );

  // Create tsconfig.json
  const tsconfig = {
    extends: '@kit/tsconfig/node',
    compilerOptions: {
      outDir: 'dist',
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
        '@modules/*': ['./src/modules/*'],
        '@shared/*': ['./src/shared/*'],
        '@infra/*': ['./src/infra/*'],
      },
    },
    include: ['src'],
    exclude: ['node_modules', 'dist'],
  };

  await fs.writeFile(
    path.join(appDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2) + '\n',
  );

  // Create main.ts
  const mainTs = `import { loadEnvironment } from '@kit/env-loader/node';
import { createServer } from '@infra/http/server${config.features.logging ? '.js' : '.js'};
${config.features.database !== 'none' ? `import { connectDatabase } from '@infra/db/connection.js';` : ''}
${config.features.logging ? `import { logger } from '@shared/logging/logger.js';` : ''}

async function bootstrap() {
  // Load environment variables
  const env = loadEnvironment({
    appName: '${config.name}',
    required: ['PORT'${config.features.database === 'prisma' ? ", 'DATABASE_URL'" : ''}${config.features.database === 'mongoose' ? ", 'MONGO_URI'" : ''}],
  });

  if (!env.success) {
    console.error('Failed to load environment:', env.missingRequired);
    process.exit(1);
  }
${config.features.database !== 'none' ? `
  // Connect to database
  await connectDatabase();
` : ''}
  // Create and start server
  const server = createServer();
  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    ${config.features.logging ? `logger.info(\`🚀 Server running on port \${PORT}\`);` : `console.log(\`🚀 Server running on port \${PORT}\`);`}
  });
}

bootstrap().catch((error) => {
  ${config.features.logging ? `logger.error('Fatal error during bootstrap:', error);` : `console.error('Fatal error during bootstrap:', error);`}
  process.exit(1);
});
`;

  await fs.writeFile(path.join(appDir, 'src/main.ts'), mainTs);

  // Create server.ts
  const serverTs = `import express from 'express';
${config.features.cors ? `import cors from 'cors';` : ''}
${config.features.logging ? `import { logger } from '@shared/logging/logger.js';` : ''}
import { createRoutes } from './routes.js';
import { errorHandler } from '@shared/errors/handler.js';

export function createServer() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
${config.features.cors ? `  app.use(cors());` : ''}
${config.features.logging ? `
  // Request logging
  app.use((req, _res, next) => {
    logger.info({ method: req.method, path: req.path }, 'Incoming request');
    next();
  });
` : ''}
  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  createRoutes(app);

  // Error handling
  app.use(errorHandler);

  return app;
}
`;

  await fs.writeFile(
    path.join(appDir, 'src/infra/http/server.ts'),
    serverTs,
  );

  // Create routes.ts
  const routesTs = `import type { Express } from 'express';
import { create${pascalCase(config.sampleModule)}Routes } from '@modules/${config.sampleModule}/index.js';

export function createRoutes(app: Express) {
  const apiRouter = app;

  // Register module routes
  create${pascalCase(config.sampleModule)}Routes(apiRouter);

  // 404 handler
  apiRouter.use('*', (_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}
`;

  await fs.writeFile(
    path.join(appDir, 'src/infra/http/routes.ts'),
    routesTs,
  );

  // Create error handler
  const errorHandlerTs = `import type { Request, Response, NextFunction } from 'express';
${config.features.logging ? `import { logger } from '@shared/logging/logger.js';` : ''}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  ${config.features.logging ? `logger.error(err, 'Request error');` : `console.error('Request error:', err);`}

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Unknown error
  return res.status(500).json({
    error: 'Internal server error',
  });
}
`;

  await fs.writeFile(
    path.join(appDir, 'src/shared/errors/handler.ts'),
    errorHandlerTs,
  );

  // Create logger if enabled
  if (config.features.logging) {
    const loggerTs = `import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
  level: process.env.LOG_LEVEL || 'info',
});
`;
    await fs.writeFile(
      path.join(appDir, 'src/shared/logging/logger.ts'),
      loggerTs,
    );
  }

  // Create database connection if enabled
  if (config.features.database === 'prisma') {
    const connectionTs = `import { PrismaClient } from '@prisma/client';
${config.features.logging ? `import { logger } from '@shared/logging/logger.js';` : ''}

export const db = new PrismaClient();

export async function connectDatabase() {
  try {
    await db.$connect();
    ${config.features.logging ? `logger.info('✅ Database connected');` : `console.log('✅ Database connected');`}
  } catch (error) {
    ${config.features.logging ? `logger.error(error, '❌ Database connection failed');` : `console.error('❌ Database connection failed:', error);`}
    throw error;
  }
}

export async function disconnectDatabase() {
  await db.$disconnect();
}
`;
    await fs.writeFile(
      path.join(appDir, 'src/infra/db/connection.ts'),
      connectionTs,
    );

    // Create minimal Prisma schema
    await fs.mkdir(path.join(appDir, 'prisma'), { recursive: true });
    const prismaSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Example model
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    await fs.writeFile(path.join(appDir, 'prisma/schema.prisma'), prismaSchema);
  } else if (config.features.database === 'mongoose') {
    const connectionTs = `import mongoose from 'mongoose';
${config.features.logging ? `import { logger } from '@shared/logging/logger.js';` : ''}

export async function connectDatabase() {
  try {
    const uri = process.env.MONGO_URI!;
    await mongoose.connect(uri);
    ${config.features.logging ? `logger.info('✅ MongoDB connected');` : `console.log('✅ MongoDB connected');`}
  } catch (error) {
    ${config.features.logging ? `logger.error(error, '❌ MongoDB connection failed');` : `console.error('❌ MongoDB connection failed:', error);`}
    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
`;
    await fs.writeFile(
      path.join(appDir, 'src/infra/db/connection.ts'),
      connectionTs,
    );
  }

  // Create sample module following <feature>.<role>.ts pattern
  const moduleName = config.sampleModule;
  const pascalName = pascalCase(moduleName);
  const camelName = toCamelCase(moduleName);

  // Types
  const typesTs = `export interface ${pascalName} {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${pascalName}Input {
  name: string;
}

export interface Update${pascalName}Input {
  name?: string;
}
`;
  await fs.writeFile(
    path.join(appDir, `src/modules/${moduleName}/${moduleName}.types.ts`),
    typesTs,
  );

  // Repository
  const repoTs = `import type { ${pascalName}, Create${pascalName}Input, Update${pascalName}Input } from './${moduleName}.types.js';
${config.features.database === 'prisma' ? `import { db } from '@infra/db/connection.js';` : ''}

export const make${pascalName}Repository = (${config.features.database === 'prisma' ? 'deps: { db: typeof db }' : ''}) => ({
  async findAll(): Promise<${pascalName}[]> {
    ${config.features.database === 'prisma' ? `return deps.db.user.findMany();` : `// TODO: Implement database query
    return [];`}
  },

  async findById(id: string): Promise<${pascalName} | null> {
    ${config.features.database === 'prisma' ? `return deps.db.user.findUnique({ where: { id } });` : `// TODO: Implement database query
    return null;`}
  },

  async create(input: Create${pascalName}Input): Promise<${pascalName}> {
    ${config.features.database === 'prisma' ? `return deps.db.user.create({ data: input });` : `// TODO: Implement database insert
    return {
      id: 'temp-id',
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };`}
  },

  async update(id: string, input: Update${pascalName}Input): Promise<${pascalName} | null> {
    ${config.features.database === 'prisma' ? `return deps.db.user.update({ where: { id }, data: input });` : `// TODO: Implement database update
    return null;`}
  },

  async delete(id: string): Promise<boolean> {
    ${config.features.database === 'prisma' ? `await deps.db.user.delete({ where: { id } });
    return true;` : `// TODO: Implement database delete
    return false;`}
  },
});

export type ${pascalName}Repository = ReturnType<typeof make${pascalName}Repository>;
`;
  await fs.writeFile(
    path.join(appDir, `src/modules/${moduleName}/${moduleName}.repo.ts`),
    repoTs,
  );

  // Service
  const serviceTs = `import type { ${pascalName}Repository } from './${moduleName}.repo.js';
import type { Create${pascalName}Input, Update${pascalName}Input } from './${moduleName}.types.js';
import { AppError } from '@shared/errors/handler.js';

export const make${pascalName}Service = (deps: { repository: ${pascalName}Repository }) => ({
  async getAll() {
    return deps.repository.findAll();
  },

  async getById(id: string) {
    const ${camelName} = await deps.repository.findById(id);
    if (!${camelName}) {
      throw new AppError('${pascalName} not found', 404);
    }
    return ${camelName};
  },

  async create(input: Create${pascalName}Input) {
    // Add business logic validation here
    return deps.repository.create(input);
  },

  async update(id: string, input: Update${pascalName}Input) {
    const ${camelName} = await deps.repository.update(id, input);
    if (!${camelName}) {
      throw new AppError('${pascalName} not found', 404);
    }
    return ${camelName};
  },

  async delete(id: string) {
    const success = await deps.repository.delete(id);
    if (!success) {
      throw new AppError('${pascalName} not found', 404);
    }
  },
});

export type ${pascalName}Service = ReturnType<typeof make${pascalName}Service>;
`;
  await fs.writeFile(
    path.join(appDir, `src/modules/${moduleName}/${moduleName}.service.ts`),
    serviceTs,
  );

  // Controller
  const controllerTs = `import type { Request, Response, NextFunction } from 'express';
import type { ${pascalName}Service } from './${moduleName}.service.js';

export const make${pascalName}Controller = (deps: { service: ${pascalName}Service }) => ({
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await deps.service.getAll();
      res.json(items);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await deps.service.getById(req.params.id);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await deps.service.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await deps.service.update(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deps.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
});

export type ${pascalName}Controller = ReturnType<typeof make${pascalName}Controller>;
`;
  await fs.writeFile(
    path.join(appDir, `src/modules/${moduleName}/${moduleName}.controller.ts`),
    controllerTs,
  );

  // Module index (barrel exports + router)
  const moduleIndexTs = `import type { Express, Router } from 'express';
import { Router as createRouter } from 'express';
${config.features.database === 'prisma' ? `import { db } from '@infra/db/connection.js';` : ''}
import { make${pascalName}Repository } from './${moduleName}.repo.js';
import { make${pascalName}Service } from './${moduleName}.service.js';
import { make${pascalName}Controller } from './${moduleName}.controller.js';

export * from './${moduleName}.types.js';

export function create${pascalName}Routes(app: Express): Router {
  // Create dependencies
  const repository = make${pascalName}Repository(${config.features.database === 'prisma' ? '{ db }' : ''});
  const service = make${pascalName}Service({ repository });
  const controller = make${pascalName}Controller({ service });

  // Create router
  const router = createRouter();

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  // Mount router
  app.use('/api/${moduleName}', router);

  return router;
}
`;
  await fs.writeFile(
    path.join(appDir, `src/modules/${moduleName}/index.ts`),
    moduleIndexTs,
  );

  // Create .env.example
  const envExample = `# Server Configuration
PORT=3000
NODE_ENV=development
${config.features.logging ? `LOG_LEVEL=info
` : ''}
${config.features.database === 'prisma' ? `# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
` : ''}
${config.features.database === 'mongoose' ? `# Database (MongoDB)
MONGO_URI="mongodb://localhost:27017/mydb"
` : ''}
${config.features.auth ? `# Authentication
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
` : ''}`;

  await fs.writeFile(path.join(appDir, '.env.example'), envExample);

  // Create .gitignore
  const gitignore = `# Dependencies
node_modules

# Production
dist
*.local

# Environment
.env

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Logs
*.log
logs

# Turbo
.turbo

# Testing
coverage

# Database
${config.features.database === 'prisma' ? `prisma/migrations
` : ''}
`;

  await fs.writeFile(path.join(appDir, '.gitignore'), gitignore);

  // Install dependencies
  console.log('\n📦 Installing dependencies...\n');
  const execaFn = await getExeca();
  await execaFn('pnpm', ['install'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  if (config.features.database === 'prisma') {
    console.log('\n🔧 Generating Prisma client...\n');
    await execaFn('pnpm', ['--filter', packageName, 'db:generate'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
  }

  console.log(`\n✅ Express API created successfully!\n`);
  console.log(`📂 Location: ${appDir}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Copy .env.example to .env and configure`);
  if (config.features.database === 'prisma') {
    console.log(`   2. Run 'pnpm --filter ${packageName} db:push' to sync database`);
  }
  console.log(`   ${config.features.database === 'prisma' ? '3' : '2'}. cd ${appDir}`);
  console.log(`   ${config.features.database === 'prisma' ? '4' : '3'}. pnpm dev\n`);
}

async function main() {
  console.log('\n🚀 Express API Generator\n');

  const response = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'API name (e.g., "my-api"):',
      validate: (value: string) =>
        /^[a-z0-9-]+$/.test(value) ? true : 'Use lowercase letters, numbers, and hyphens only',
    },
    {
      type: 'text',
      name: 'packageScope',
      message: 'Package scope (e.g., "@mycompany"):',
      initial: '@my-company',
      validate: (value: string) =>
        /^@[a-z0-9-]+$/.test(value) ? true : 'Must start with @ and use lowercase',
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      initial: 'An Express REST API',
    },
    {
      type: 'text',
      name: 'sampleModule',
      message: 'Sample module name (e.g., "user", "product"):',
      initial: 'user',
      validate: (value: string) =>
        /^[a-z]+$/.test(value) ? true : 'Use lowercase letters only',
    },
    {
      type: 'select',
      name: 'database',
      message: 'Database:',
      choices: [
        { title: 'Prisma (PostgreSQL/MySQL/SQLite)', value: 'prisma' },
        { title: 'Mongoose (MongoDB)', value: 'mongoose' },
        { title: 'None (add later)', value: 'none' },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'validation',
      message: 'Request validation:',
      choices: [
        { title: 'Zod', value: 'zod' },
        { title: 'Yup', value: 'yup' },
        { title: 'None', value: 'none' },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'auth',
      message: 'Include JWT authentication?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'cors',
      message: 'Include CORS middleware?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'logging',
      message: 'Include Pino logger?',
      initial: true,
    },
  ]);

  if (!response.name) {
    console.log('\n❌ API creation cancelled\n');
    return;
  }

  await createExpressApi({
    name: response.name,
    packageScope: response.packageScope,
    description: response.description,
    sampleModule: response.sampleModule,
    features: {
      database: response.database,
      validation: response.validation,
      auth: response.auth,
      cors: response.cors,
      logging: response.logging,
    },
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// EXPORT for programmatic usage
export { createExpressApi, type AppConfig };
