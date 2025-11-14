import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import {parseArgs} from 'node:util';
import {getWorkspacePackages, pascalCase, toCamelCase} from '../utils';
import {
  createPluginComponent,
  createPluginConfig,
  createReduxSlice,
  getEslintConfig,
  updateRealPlugins,
} from './templates';

interface PackageConfig {
  name: string;
  workspaceFolder: string;
  dependencies: string[];
  includeUIDeps: boolean;
  packageScope?: string; // Optional package scope (default: @starter)
}

interface PackageExports {
  '.': string;
  './types': string;
  [key: `./${string}`]: string;
}

const WORKSPACE_FOLDERS = [
  'apps',
  'packages',
  'plugins',
  'services',
  'tooling',
];

const UI_PEER_DEPS = {
  '@types/react': '^18.3.11',
  '@types/react-dom': '^18.3.1',
  '@types/styled-components': '^5.1.34',
  react: '18.3.1',
  'react-dom': '^18.3.1',
  'react-redux': '^9.1.2',
  'styled-components': '^5.3.11',
  '@reduxjs/toolkit': '^2.3.0',
};

async function getExeca() {
  const {execa} = await import('execa');
  return execa;
}

export async function createPackage(config: PackageConfig) {
  const scope = config.packageScope || '@starter';
  const fullPackageName = config.name.startsWith('@') ? config.name : `${scope}/${config.name}`;
  const packageNameWithoutScope = fullPackageName.split('/')[1] || config.name;

  const packageDir = path.join(
    config.workspaceFolder,
    packageNameWithoutScope,
  );

  // Create directory structure
  await fs.mkdir(packageDir, {recursive: true});
  await fs.mkdir(path.join(packageDir, 'src'), {recursive: true});
  await fs.mkdir(path.join(packageDir, 'src/types'), {recursive: true});

  // Create package.json
  interface PackageJson {
    name: string;
    private: boolean;
    version: string;
    main: string;
    author: string;
    description: string;
    scripts: Record<string, string>;
    exports: PackageExports;
    eslintConfig: {
      root: boolean;
      extends: string[];
    };
    prettier: string;
    typesVersions: {
      '*': {
        '*': string[];
      };
    };
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
  }

  const camelName = toCamelCase(packageNameWithoutScope);

  const packageJson: PackageJson = {
    name: fullPackageName,
    private: true,
    version: '1.0.0',
    main: 'src/index.ts',
    author: '',
    description: '',
    scripts: {
      clean: 'git clean -xdf .turbo node_modules',
      format: 'prettier --check "**/*.{ts,tsx}"',
      lint: 'eslint .',
      typecheck: 'tsc --noEmit',
      test: 'vitest run --config ../../tooling/testing/src/configs/vitest/unit.ts',
      'test:unit': 'vitest run --config ../../tooling/testing/src/configs/vitest/unit.ts',
      'test:watch': 'vitest --config ../../tooling/testing/src/configs/vitest/unit.ts',
    },
    exports:
      config.workspaceFolder === 'plugins'
        ? ({
            '.': './src/index.ts',
            './types': './src/types/index.ts',
            './pluginConfig': './src/pluginConfig.tsx',
            [`./${camelName}Slice`]: `./src/redux/${camelName}Slice.ts`,
          } as const)
        : ({
            '.': './src/index.ts',
            './types': './src/types/index.ts',
          } as const),
    eslintConfig: getEslintConfig(config.workspaceFolder, config.includeUIDeps),
    prettier: '@kit/prettier-config',
    typesVersions: {
      '*': {
        '*': ['src/*'],
      },
    },
    dependencies: {},
    devDependencies: {
      '@kit/eslint-config': 'workspace:*',
      '@kit/prettier-config': 'workspace:*',
      '@kit/testing': 'workspace:*',
      '@kit/tsconfig': 'workspace:*',
    },
    peerDependencies: config.includeUIDeps ? UI_PEER_DEPS : {},
  };

  // Add selected workspace dependencies
  config.dependencies.forEach((dep) => {
    if (!packageJson.peerDependencies) {
      packageJson.peerDependencies = {};
    }
    (packageJson.peerDependencies as Record<string, string>)[dep] =
      'workspace:*';
  });

  await fs.writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );

  // Create tsconfig.json
  const tsconfig = {
    extends: '@kit/tsconfig/base',
    compilerOptions: {
      tsBuildInfoFile: 'node_modules/.cache/tsbuildinfo.json',
      baseUrl: '.',
      paths: {},
    },
    include: ['*.ts', '*.tsx', '*.css', 'src', 'src/**/*.d.ts', '*.d.ts'],
    exclude: ['node_modules'],
  };

  await fs.writeFile(
    path.join(packageDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2),
  );

  // Create index files
  await fs.writeFile(
    path.join(packageDir, 'src/index.ts'),
    "export * from './types';\n",
  );

  await fs.writeFile(
    path.join(packageDir, 'src/types/index.ts'),
    "export * from './styled.d';\n",
  );

  // Create styled.d.ts if UI deps are included
  if (config.includeUIDeps) {
    const styledDts = `import 'styled-components';
import type { Theme } from '@scala-cme/shared-redux/types';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {
    // Extend the theme interface if needed
    _brand: 'DefaultTheme';
  }
}`;

    await fs.writeFile(
      path.join(packageDir, 'src/types/styled.d.ts'),
      styledDts,
    );

    // Update types/index.ts to export styled.d
    await fs.writeFile(
      path.join(packageDir, 'src/types/index.ts'),
      "export * from './styled.d';\n",
    );
  }

  // If it's a plugin, create Redux files
  if (config.workspaceFolder === 'plugins') {
    // Create components directory
    await fs.mkdir(path.join(packageDir, 'src/components'), {recursive: true});

    // Create redux directory and files
    const reduxDir = path.join(packageDir, 'src/redux');
    await fs.mkdir(reduxDir, {recursive: true});

    const packageNameWithoutPrefix = config.name.replace('@scala-cme/', '');
    const camelName = toCamelCase(packageNameWithoutPrefix);

    // Create component file
    await fs.writeFile(
      path.join(
        packageDir,
        `src/components/${pascalCase(packageNameWithoutPrefix)}.tsx`,
      ),
      createPluginComponent(packageNameWithoutPrefix),
    );

    // Create plugin config
    await fs.writeFile(
      path.join(packageDir, 'src/pluginConfig.tsx'),
      createPluginConfig(packageNameWithoutPrefix),
    );

    // Create redux files
    await fs.writeFile(
      path.join(reduxDir, `${camelName}Slice.ts`),
      createReduxSlice(packageNameWithoutPrefix),
    );

    await fs.writeFile(
      path.join(reduxDir, 'index.ts'),
      `export * from './${camelName}Slice';\nexport type { ${pascalCase(packageNameWithoutPrefix)}State } from './${camelName}Slice';`,
    );

    // Update package.json exports
    packageJson.exports = {
      ...packageJson.exports,
      [`./${camelName}Slice`]: `./src/redux/${camelName}Slice.ts`,
    };

    // Write updated package.json back to disk
    await fs.writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify(packageJson, null, 2) + '\n',
    );

    // Update main index.ts
    await fs.writeFile(
      path.join(packageDir, 'src/index.ts'),
      `export { default } from './components/${pascalCase(packageNameWithoutPrefix)}';\nexport * from './types';\nexport { default as pluginConfig } from './pluginConfig';`,
    );

    // If it's a plugin, update the shared-plugin-registry
    const success = await updateRealPlugins(
      config.name.replace('@scala-cme/', ''),
    );
    if (success) {
      console.log('✅ Updated shared-plugin-registry with new plugin');
    } else {
      console.warn(
        '⚠️ Failed to update shared-plugin-registry. Please add plugin manually.',
      );
    }

    if (!packageJson.peerDependencies) {
      packageJson.peerDependencies = {};
    }
    packageJson.peerDependencies['@scala-cme/shared-plugin-registry'] =
      'workspace:*';
  }

  // Update package.json with correct eslint config
  packageJson.eslintConfig = getEslintConfig(
    config.workspaceFolder,
    config.includeUIDeps,
  );

  // Format generated files
  const execaFn = await getExeca();

  // First install dependencies
  await execaFn('pnpm', ['install'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  // Then run eslint after dependencies are installed
  await execaFn('pnpm', ['eslint', '--fix', '.'], {
    cwd: path.join(process.cwd(), packageDir),
  });

  console.log(
    `✅ Package ${config.name} created successfully in ${config.workspaceFolder}!`,
  );
}

async function main() {
  // Parse CLI arguments
  const { values } = parseArgs({
    options: {
      name: { type: 'string', short: 'n' },
      folder: { type: 'string', short: 'f' },
      scope: { type: 'string', short: 's' },
      ui: { type: 'boolean', short: 'u', default: false },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
    strict: false,
  });

  if (values.help) {
    console.log(`
Usage: pnpm gen:library [options]

Options:
  -n, --name <name>       Package name (required)
  -f, --folder <folder>   Workspace folder (default: packages)
  -s, --scope <scope>     Package scope (default: @starter)
  -u, --ui                Include UI peer dependencies
  -h, --help              Show help

Examples:
  # Interactive mode
  pnpm gen:library

  # Non-interactive mode
  pnpm gen:library --name shared-utils --folder packages
  pnpm gen:library -n shared-ui -f packages -u
  pnpm gen:library -n shared-utils -s @mycompany
`);
    return;
  }

  const workspacePackages = await getWorkspacePackages();

  // If CLI arguments provided, use them; otherwise, prompt
  let response: {
    name?: string;
    workspaceFolder?: string;
    includeUIDeps?: boolean;
    dependencies?: string[];
    packageScope?: string;
  };

  if (values.name) {
    // Non-interactive mode
    response = {
      name: values.name,
      workspaceFolder: values.folder || 'packages',
      includeUIDeps: values.ui || false,
      dependencies: [],
      packageScope: values.scope || '@starter',
    };
    console.log(`\n📦 Creating library: ${response.packageScope}/${response.name}\n`);
  } else {
    // Interactive mode
    response = await prompts([
      {
        type: 'select',
        name: 'workspaceFolder',
        message: 'Select workspace folder:',
        choices: WORKSPACE_FOLDERS.map((folder) => ({
          title: folder,
          value: folder,
        })),
      },
      {
        type: 'text',
        name: 'name',
        message: 'Package name:',
        validate: (value: string) =>
          value.length > 0 ? true : 'Package name is required',
      },
      {
        type: 'text',
        name: 'packageScope',
        message: 'Package scope:',
        initial: '@starter',
      },
      {
        type: 'confirm',
        name: 'includeUIDeps',
        message: 'Include UI peer dependencies?',
        initial: false,
      },
      {
        type: 'multiselect',
        name: 'dependencies',
        message: 'Select workspace dependencies:',
        choices: workspacePackages.map((pkg) => ({
          title: pkg,
          value: pkg,
        })),
      },
    ]);
  }

  if (!response.name || !response.workspaceFolder) {
    console.log('Package creation cancelled');
    return;
  }

  await createPackage({
    name: response.name,
    workspaceFolder: response.workspaceFolder,
    dependencies: response.dependencies || [],
    includeUIDeps: response.includeUIDeps || false,
    packageScope: response.packageScope || '@starter',
  });
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// EXPORT for programmatic usage (createPackage is already exported above)
export type { PackageConfig };
