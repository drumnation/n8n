import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import { pascalCase } from '../utils.js';

interface AppConfig {
  name: string;
  packageScope: string;
  description: string;
  features: {
    stateManagement: 'redux' | 'zustand' | 'none';
    ui: 'mantine' | 'none';
    tailwind: boolean;
    autoUpdater: boolean;
  };
}

async function getExeca() {
  const { execa } = await import('execa');
  return execa;
}

async function createElectronApp(config: AppConfig) {
  const appDir = path.join('apps', config.name);
  const packageName = `${config.packageScope}/${config.name}`;

  console.log(`\n💻 Creating Electron React app: ${packageName}\n`);

  // Create directory structure
  await fs.mkdir(appDir, { recursive: true });
  await fs.mkdir(path.join(appDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/main'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/renderer'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/renderer/components'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/renderer/pages'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/preload'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'resources'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: packageName,
    private: true,
    version: '0.1.0',
    type: 'module',
    description: config.description,
    main: 'dist-electron/main/index.js',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build && electron-builder',
      'build:dir': 'vite build && electron-builder --dir',
      'build:mac': 'vite build && electron-builder --mac',
      'build:win': 'vite build && electron-builder --win',
      'build:linux': 'vite build && electron-builder --linux',
      preview: 'vite preview',
      lint: 'eslint . --ext .ts,.tsx',
      typecheck: 'tsc --noEmit',
      format: 'prettier --check "src/**/*.{ts,tsx,css}"',
      clean: 'rimraf node_modules .turbo dist dist-electron',
    },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
    },
    devDependencies: {
      '@types/react': '^18.3.11',
      '@types/react-dom': '^18.3.1',
      '@vitejs/plugin-react': '^4.3.4',
      'electron': '^33.2.0',
      'electron-builder': '^25.1.8',
      '@kit/eslint-config': 'workspace:*',
      '@kit/prettier-config': 'workspace:*',
      '@kit/tsconfig': 'workspace:*',
      'typescript': '^5.7.2',
      'vite': '^6.0.3',
      'vite-plugin-electron': '^0.28.9',
      'vite-plugin-electron-renderer': '^0.14.6',
    },
    build: {
      appId: `com.${config.packageScope.replace('@', '')}.${config.name}`,
      productName: pascalCase(config.name),
      directories: {
        output: 'release/${version}',
      },
      files: ['dist', 'dist-electron'],
      mac: {
        target: ['dmg', 'zip'],
        category: 'public.app-category.utilities',
      },
      win: {
        target: ['nsis', 'zip'],
      },
      linux: {
        target: ['AppImage', 'deb'],
        category: 'Utility',
      },
    },
    eslintConfig: {
      root: true,
      extends: ['@kit/eslint-config/react', '@kit/eslint-config/apps'],
    },
    prettier: '@kit/prettier-config',
  };

  // Add optional dependencies
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

  if (config.features.autoUpdater) {
    packageJson.dependencies['electron-updater'] = '^6.3.9';
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
        '@main/*': ['./src/main/*'],
        '@renderer/*': ['./src/renderer/*'],
        '@preload/*': ['./src/preload/*'],
      },
      module: 'ESNext',
      moduleResolution: 'bundler',
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

  // Create vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
      },
      {
        entry: 'src/preload/index.ts',
        onstart(options) {
          options.reload();
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@preload': path.resolve(__dirname, './src/preload'),
    },
  },
  server: {
    port: 5173,
  },
});
`;

  await fs.writeFile(path.join(appDir, 'vite.config.ts'), viteConfig);

  // Create src/main/index.ts (Electron main process)
  const mainIndex = `import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main
// │ │ └── preload
// │
process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

// IPC handlers
ipcMain.handle('ping', () => 'pong');
`;

  await fs.writeFile(path.join(appDir, 'src/main/index.ts'), mainIndex);

  // Create src/preload/index.ts
  const preloadIndex = `import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ping: () => ipcRenderer.invoke('ping'),
  // Add more API methods here as needed
  onMainMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message));
  },
});

export type ElectronAPI = {
  ping: () => Promise<string>;
  onMainMessage: (callback: (message: string) => void) => void;
};

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
`;

  await fs.writeFile(path.join(appDir, 'src/preload/index.ts'), preloadIndex);

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';" />
    <title>${pascalCase(config.name)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/renderer/main.tsx"></script>
  </body>
</html>
`;

  await fs.writeFile(path.join(appDir, 'index.html'), indexHtml);

  // Create src/renderer/main.tsx
  const rendererMain = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Remove Preload scripts loading
postMessage({ payload: 'removeLoading' }, '*');

// Use contextBridge
window.electron.onMainMessage((message) => {
  console.log('Message from main process:', message);
});
`;

  await fs.writeFile(path.join(appDir, 'src/renderer/main.tsx'), rendererMain);

  // Create src/renderer/App.tsx
  const appTsx = `import { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const testPing = async () => {
      const result = await window.electron.ping();
      setMessage(\`Electron IPC test: \${result}\`);
    };
    testPing();
  }, []);

  return (
    <div className="app">
      <h1>${pascalCase(config.name)}</h1>
      <p>{message}</p>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <p className="read-the-docs">
        Edit src/renderer/App.tsx and save to test HMR
      </p>
    </div>
  );
}

export default App;
`;

  await fs.writeFile(path.join(appDir, 'src/renderer/App.tsx'), appTsx);

  // Create src/renderer/index.css
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

#root {
  width: 100%;
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

.read-the-docs {
  color: #888;
}
`;

  await fs.writeFile(path.join(appDir, 'src/renderer/index.css'), indexCss);

  // Create tailwind.config.js if needed
  if (config.features.tailwind) {
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
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
dist-electron
release
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

# Electron
out/
`;

  await fs.writeFile(path.join(appDir, '.gitignore'), gitignore);

  // Install dependencies
  console.log('\n📦 Installing dependencies...\n');
  const execaFn = await getExeca();
  await execaFn('pnpm', ['install'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  console.log(`\n✅ Electron React app created successfully!\n`);
  console.log(`📂 Location: ${appDir}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   cd ${appDir}`);
  console.log(`   pnpm dev\n`);
  console.log(`💡 Build for production:`);
  console.log(`   pnpm build:mac   # macOS`);
  console.log(`   pnpm build:win   # Windows`);
  console.log(`   pnpm build:linux # Linux\n`);
}

async function main() {
  console.log('\n💻 Electron React App Generator\n');

  const response = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'App name (e.g., "my-desktop-app"):',
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
      initial: 'An Electron desktop application',
    },
    {
      type: 'select',
      name: 'stateManagement',
      message: 'State management:',
      choices: [
        { title: 'Redux Toolkit', value: 'redux' },
        { title: 'Zustand (lightweight)', value: 'zustand' },
        { title: 'None (React state only)', value: 'none' },
      ],
      initial: 1,
    },
    {
      type: 'select',
      name: 'ui',
      message: 'UI library:',
      choices: [
        { title: 'Mantine', value: 'mantine' },
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
    {
      type: 'confirm',
      name: 'autoUpdater',
      message: 'Include auto-updater support?',
      initial: false,
    },
  ]);

  if (!response.name) {
    console.log('\n❌ App creation cancelled\n');
    return;
  }

  await createElectronApp({
    name: response.name,
    packageScope: response.packageScope,
    description: response.description,
    features: {
      stateManagement: response.stateManagement,
      ui: response.ui,
      tailwind: response.tailwind,
      autoUpdater: response.autoUpdater,
    },
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// EXPORT for programmatic usage
export { createElectronApp, type AppConfig };
