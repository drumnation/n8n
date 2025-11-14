import fs from 'fs/promises';

export const createReduxSlice = (packageName: string) => {
  const pascalName = packageName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const camelName = pascalName.charAt(0).toLowerCase() + pascalName.slice(1);

  return `import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@scala-cme/shared-redux';

export interface ${pascalName}State {
  loading: boolean;
  error: string | null;
}

const initialState: ${pascalName}State = {
  loading: false,
  error: null,
};

const ${camelName}Slice = createSlice({
  name: '${camelName}',
  initialState,
  reducers: {
    setState: (_, action: PayloadAction<${pascalName}State>) => {
      return action.payload;
    },
  },
});

export const { setState } = ${camelName}Slice.actions;

export const select${pascalName} = (state: RootState) =>
  state.${camelName} ?? initialState;

export default ${camelName}Slice.reducer;
`;
};

export const createReduxIndex = (packageName: string) => {
  const camelName = packageName
    .split('-')
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `export * from './${camelName}Slice';`;
};

export const getEslintConfig = (workspaceFolder: string, includeUIDeps: boolean) => {
  const configs = ['@kit/eslint-config/base', '@kit/eslint-config/sort'];
  
  if (includeUIDeps) {
    configs.splice(1, 0, '@kit/eslint-config/react');
  }
  
  if (workspaceFolder === 'apps') {
    configs.push('@kit/eslint-config/apps');
  }

  return {
    root: true,
    extends: configs
  };
};

export const createPluginComponent = (packageName: string) => {
  const pascalName = packageName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `import React from 'react';

const ${pascalName}: React.FC = () => {
  return (
    <div>
      <h1>${pascalName}</h1>
    </div>
  );
};

export default ${pascalName};
`;
};

export const createPluginConfig = (packageName: string) => {
  const pascalName = packageName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const camelName = pascalName.charAt(0).toLowerCase() + pascalName.slice(1);

  return `import { PluginConfigType } from '@scala-cme/shared-types';
import ${pascalName} from './components/${pascalName}';
import ${camelName}Reducer from './redux/${camelName}Slice';

const ${pascalName}PluginConfig: PluginConfigType<typeof ${camelName}Reducer> = {
  id: '${packageName}',
  mainNav: {
    link: '/${packageName}',
    name: '${pascalName}',
    order: 1,
    subNav: [
      {
        component: ${pascalName},
        link: '/${packageName}/all',
        name: 'SEE ALL ${pascalName.toUpperCase()}',
      },
    ],
    type: 'nav',
  },
  reducer: ${camelName}Reducer,
  type: 'plugin',
};

export default ${pascalName}PluginConfig;
`;
};

export const updateRealPlugins = async (packageName: string) => {
  const realPluginsPath = 'packages/shared-plugin-registry/src/plugins/realPlugins.ts';
  const pascalName = packageName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  try {
    // Read existing content
    const content = await fs.readFile(realPluginsPath, 'utf-8');
    
    // Add new import
    const newImport = `import ${pascalName}PluginConfig from '@scala-cme/${packageName}/pluginConfig';`;
    
    // Split content into lines
    const lines = content.split('\n');
    
    // Find the last import line
    const lastImportIndex = lines.findLastIndex((line: string) => line.startsWith('import'));
    
    // Insert new import after last import
    lines.splice(lastImportIndex + 1, 0, newImport);
    
    // Update the realPlugins array
    const exportLine = lines.findIndex((line: string) => line.includes('export const realPlugins'));
    if (exportLine === -1) {
      throw new Error('Could not find realPlugins export in file');
    }

    const match = lines[exportLine]?.match(/\[(.*)\]/);
    if (!match) {
      throw new Error('Could not parse realPlugins array');
    }

    const arrayContent = match[1] || '';
    const plugins = arrayContent.split(',').map((p: string) => p.trim()).filter(Boolean);
    plugins.push(`${pascalName}PluginConfig`);
    
    lines[exportLine] = `export const realPlugins = [${plugins.join(', ')}];`;
    
    // Write back to file
    await fs.writeFile(realPluginsPath, lines.join('\n'));
    
    // Read package.json
    const registryPackageJsonPath = 'packages/shared-plugin-registry/package.json';
    const packageJsonContent = await fs.readFile(registryPackageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    // Add new plugin to peerDependencies
    if (!packageJson.peerDependencies) {
      packageJson.peerDependencies = {};
    }
    packageJson.peerDependencies[`@scala-cme/${packageName}`] = 'workspace:*';

    // Write back package.json
    await fs.writeFile(
      registryPackageJsonPath, 
      JSON.stringify(packageJson, null, 2) + '\n'
    );

    // Format package.json
    const execaFn = await getExeca();
    await execaFn('pnpm', ['prettier', '--write', realPluginsPath], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    return true;
  } catch (error) {
    console.error('Failed to update realPlugins.ts:', error);
    return false;
  }
};

async function getExeca() {
  const { execa } = await import('execa');
  return execa;
} 