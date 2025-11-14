/**
 * Simple smoke test to verify programmatic API imports work
 * This validates that all generators export their functions correctly
 */

import type { AppConfig as ReactWebAppConfig } from '../create-react-web/index.js';
import type { AppConfig as ExpressApiConfig } from '../create-express-api/index.js';
import type { AppConfig as ReactNativeAppConfig } from '../create-react-native/index.js';
import type { AppConfig as ElectronAppConfig } from '../create-electron/index.js';
import type { PackageConfig } from '../create-library/index.js';
import type {
  ProjectConfig,
  FeatureConfig,
  TechStackConfig,
  ValidationResult,
  GeneratedApp,
  RuleRecommendation,
} from './types.js';

// Import the generator functions (not calling them, just verifying imports)
import { createReactWebApp } from '../create-react-web/index.js';
import { createExpressApi } from '../create-express-api/index.js';
import { createReactNativeApp } from '../create-react-native/index.js';
import { createElectronApp } from '../create-electron/index.js';
import { createPackage } from '../create-library/index.js';

/**
 * Type validation tests - these should all compile without errors
 */
function validateTypes() {
  // Test React Web config
  const webConfig: ReactWebAppConfig = {
    name: 'test-web',
    packageScope: '@test',
    description: 'Test app',
    features: {
      routing: true,
      stateManagement: 'zustand',
      ui: 'mantine',
      tailwind: true,
    },
  };

  // Test Express API config
  const apiConfig: ExpressApiConfig = {
    name: 'test-api',
    packageScope: '@test',
    description: 'Test API',
    sampleModule: 'user',
    features: {
      database: 'prisma',
      validation: 'zod',
      auth: true,
      cors: true,
      logging: true,
    },
  };

  // Test React Native config
  const mobileConfig: ReactNativeAppConfig = {
    name: 'test-mobile',
    packageScope: '@test',
    description: 'Test mobile app',
    template: 'expo-router',
    features: {
      navigation: false,
      stateManagement: 'zustand',
      ui: 'react-native-paper',
    },
  };

  // Test Electron config
  const desktopConfig: ElectronAppConfig = {
    name: 'test-desktop',
    packageScope: '@test',
    description: 'Test desktop app',
    features: {
      stateManagement: 'zustand',
      ui: 'mantine',
      tailwind: true,
      autoUpdater: false,
    },
  };

  // Test Package config
  const packageConfig: PackageConfig = {
    name: 'test-lib',
    workspaceFolder: 'packages',
    dependencies: [],
    includeUIDeps: false,
    packageScope: '@test',
  };

  // Test mega-setup types
  const projectConfig: ProjectConfig = {
    name: 'test-project',
    description: 'Test project',
    packageScope: '@test',
    projectType: ['web', 'api'],
    targetPlatforms: ['vercel'],
    features: {
      authentication: true,
      database: true,
      fileUploads: false,
      realtime: false,
      email: false,
      payments: false,
      adminDashboard: false,
      apiDocs: true,
    },
    techStack: {
      frontend: {
        framework: 'react',
        uiLibrary: 'mantine',
        stateManagement: 'zustand',
        routing: true,
      },
      backend: {
        framework: 'express',
        database: 'prisma',
        validation: 'zod',
        authentication: 'jwt',
        cors: true,
        logging: true,
      },
    },
    deployment: {
      target: 'vercel',
    },
  };

  // Test validation result
  const validationResult: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    autoFixed: [],
    summary: 'All validations passed',
  };

  // Test generated app
  const generatedApp: GeneratedApp = {
    name: 'test-web',
    type: 'web',
    path: '/path/to/test-web',
    success: true,
  };

  // Test rule recommendation
  const recommendation: RuleRecommendation = {
    ruleName: 'no-console',
    filePath: 'src/index.ts',
    reason: 'Avoid console.log in production',
    priority: 'high',
    category: 'frontend',
  };

  return {
    webConfig,
    apiConfig,
    mobileConfig,
    desktopConfig,
    packageConfig,
    projectConfig,
    validationResult,
    generatedApp,
    recommendation,
  };
}

/**
 * Function signature validation
 * This ensures all generator functions have the expected signatures
 */
function validateFunctionSignatures() {
  // These should all be callable functions
  const generators = {
    createReactWebApp,
    createExpressApi,
    createReactNativeApp,
    createElectronApp,
    createPackage,
  };

  // Verify they're all functions
  Object.entries(generators).forEach(([name, fn]) => {
    if (typeof fn !== 'function') {
      throw new Error(`${name} is not a function`);
    }
  });

  return generators;
}

/**
 * Main test runner
 */
export function runApiTests(): void {
  console.log('Running programmatic API smoke tests...\n');

  try {
    console.log('1. Validating type definitions...');
    validateTypes();
    console.log('   ✅ All types compile correctly\n');

    console.log('2. Validating function signatures...');
    const generators = validateFunctionSignatures();
    console.log(`   ✅ All ${Object.keys(generators).length} generator functions are callable\n`);

    console.log('3. Summary:');
    console.log('   - React Web generator: READY');
    console.log('   - Express API generator: READY');
    console.log('   - React Native generator: READY');
    console.log('   - Electron generator: READY');
    console.log('   - Library generator: READY');
    console.log('   - Type definitions: READY\n');

    console.log('✅ All programmatic API tests passed!\n');
  } catch (error) {
    console.error('❌ API tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runApiTests();
}
