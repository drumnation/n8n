import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pascalCase } from '../utils.js';

interface AppConfig {
  name: string;
  packageScope: string;
  description: string;
  features: {
    routing: boolean;
    stateManagement: 'redux' | 'zustand' | 'none';
    ui: 'shadcn' | 'mantine' | 'none';
    tailwind: boolean;
  };
}

async function getExeca() {
  const { execa } = await import('execa');
  return execa;
}

async function createReactWebApp(config: AppConfig) {
  const appDir = path.join('apps', config.name);
  const packageName = `${config.packageScope}/${config.name}`;

  console.log(`\n🚀 Creating React Web app: ${packageName}\n`);

  // Create directory structure
  await fs.mkdir(appDir, { recursive: true });
  await fs.mkdir(path.join(appDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/components'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/pages'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'public'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: packageName,
    private: true,
    version: '0.1.0',
    type: 'module',
    description: config.description,
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      lint: 'eslint . --ext .ts,.tsx',
      typecheck: 'tsc --noEmit',
      format: 'prettier --check "src/**/*.{ts,tsx,css}"',
      clean: 'rimraf node_modules .turbo dist',
    },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
    },
    devDependencies: {
      '@types/react': '^18.3.11',
      '@types/react-dom': '^18.3.1',
      '@vitejs/plugin-react': '^4.3.4',
      '@kit/eslint-config': 'workspace:*',
      '@kit/prettier-config': 'workspace:*',
      '@kit/tsconfig': 'workspace:*',
      typescript: '^5.7.2',
      vite: '^6.0.3',
    },
    eslintConfig: {
      root: true,
      extends: ['@kit/eslint-config/react', '@kit/eslint-config/apps'],
    },
    prettier: '@kit/prettier-config',
  };

  // Add optional dependencies
  if (config.features.routing) {
    packageJson.dependencies['react-router-dom'] = '^6.28.0';
  }

  if (config.features.stateManagement === 'redux') {
    packageJson.dependencies['@reduxjs/toolkit'] = '^2.3.0';
    packageJson.dependencies['react-redux'] = '^9.1.2';
  } else if (config.features.stateManagement === 'zustand') {
    packageJson.dependencies['zustand'] = '^5.0.2';
  }

  if (config.features.ui === 'mantine') {
    packageJson.dependencies['@mantine/core'] = '^7.15.3';
    packageJson.dependencies['@mantine/hooks'] = '^7.15.3';
  }

  if (config.features.tailwind) {
    packageJson.devDependencies['tailwindcss'] = '^3.4.15';
    packageJson.devDependencies['postcss'] = '^8.4.49';
    packageJson.devDependencies['autoprefixer'] = '^10.4.20';
  }

  await fs.writeFile(
    path.join(appDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n',
  );

  // Create tsconfig.json
  const tsconfig = {
    extends: '@kit/tsconfig/react',
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }],
  };

  await fs.writeFile(
    path.join(appDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2) + '\n',
  );

  // Create tsconfig.node.json
  const tsconfigNode = {
    extends: '@kit/tsconfig/node',
    compilerOptions: {
      composite: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
    },
    include: ['vite.config.ts'],
  };

  await fs.writeFile(
    path.join(appDir, 'tsconfig.node.json'),
    JSON.stringify(tsconfigNode, null, 2) + '\n',
  );

  // Create vite.config.ts (fixed __dirname for ESM)
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
`;

  await fs.writeFile(path.join(appDir, 'vite.config.ts'), viteConfig);

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pascalCase(config.name)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  await fs.writeFile(path.join(appDir, 'index.html'), indexHtml);

  // Create src/main.tsx
  const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

  await fs.writeFile(path.join(appDir, 'src/main.tsx'), mainTsx);

  // Create src/App.tsx
  const appTsx = `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>${pascalCase(config.name)}</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
`;

  await fs.writeFile(path.join(appDir, 'src/App.tsx'), appTsx);

  // Create src/index.css
  const indexCss = config.features.tailwind
    ? `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`
    : `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}
`;

  await fs.writeFile(path.join(appDir, 'src/index.css'), indexCss);

  // Create tailwind.config.js if needed
  if (config.features.tailwind) {
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
    await fs.writeFile(path.join(appDir, 'tailwind.config.js'), tailwindConfig);

    const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
    await fs.writeFile(path.join(appDir, 'postcss.config.js'), postcssConfig);
  }

  // Create .gitignore
  const gitignore = `# Dependencies
node_modules

# Production
dist
dist-ssr
*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Logs
*.log

# Turbo
.turbo

# Testing
coverage
`;

  await fs.writeFile(path.join(appDir, '.gitignore'), gitignore);

  // Install dependencies
  console.log('\n📦 Installing dependencies...\n');
  const execaFn = await getExeca();
  await execaFn('pnpm', ['install'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  console.log(`\n✅ React Web app created successfully!\n`);
  console.log(`📂 Location: ${appDir}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   cd ${appDir}`);
  console.log(`   pnpm dev\n`);
}

async function main() {
  console.log('\n🎨 React Web App Generator\n');

  const response = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'App name (e.g., "my-web-app"):',
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
      initial: 'A React web application',
    },
    {
      type: 'confirm',
      name: 'routing',
      message: 'Include React Router?',
      initial: true,
    },
    {
      type: 'select',
      name: 'stateManagement',
      message: 'State management:',
      choices: [
        { title: 'Redux Toolkit (RTK Query)', value: 'redux' },
        { title: 'Zustand (lightweight)', value: 'zustand' },
        { title: 'None (React state only)', value: 'none' },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'ui',
      message: 'UI library:',
      choices: [
        { title: 'Mantine (components + hooks)', value: 'mantine' },
        { title: 'shadcn/ui (to be added)', value: 'shadcn', disabled: true },
        { title: 'None (custom styles)', value: 'none' },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'tailwind',
      message: 'Include Tailwind CSS?',
      initial: true,
    },
  ]);

  if (!response.name) {
    console.log('\n❌ App creation cancelled\n');
    return;
  }

  await createReactWebApp({
    name: response.name,
    packageScope: response.packageScope,
    description: response.description,
    features: {
      routing: response.routing,
      stateManagement: response.stateManagement,
      ui: response.ui,
      tailwind: response.tailwind,
    },
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// EXPORT for programmatic usage
export { createReactWebApp, type AppConfig };
