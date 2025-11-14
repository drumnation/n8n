import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import { pascalCase } from '../utils.js';

interface AppConfig {
  name: string;
  packageScope: string;
  description: string;
  template: 'expo' | 'expo-router' | 'bare';
  features: {
    navigation: boolean;
    stateManagement: 'redux' | 'zustand' | 'none';
    ui: 'react-native-paper' | 'tamagui' | 'none';
  };
}

async function getExeca() {
  const { execa } = await import('execa');
  return execa;
}

async function createReactNativeApp(config: AppConfig) {
  const appDir = path.join('apps', config.name);
  const packageName = `${config.packageScope}/${config.name}`;

  console.log(`\n📱 Creating React Native app: ${packageName}\n`);

  // Create directory structure
  await fs.mkdir(appDir, { recursive: true });
  await fs.mkdir(path.join(appDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/components'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'src/screens'), { recursive: true });
  await fs.mkdir(path.join(appDir, 'assets'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: packageName,
    private: true,
    version: '0.1.0',
    description: config.description,
    main: config.template.startsWith('expo') ? 'expo-router' : 'index.js',
    scripts: {
      start: config.template.startsWith('expo') ? 'expo start' : 'react-native start',
      android: config.template.startsWith('expo') ? 'expo start --android' : 'react-native run-android',
      ios: config.template.startsWith('expo') ? 'expo start --ios' : 'react-native run-ios',
      web: config.template.startsWith('expo') ? 'expo start --web' : 'echo "Web not supported"',
      lint: 'eslint . --ext .ts,.tsx',
      typecheck: 'tsc --noEmit',
      format: 'prettier --check "src/**/*.{ts,tsx}"',
      clean: 'rimraf node_modules .turbo',
    },
    dependencies: {
      react: '^18.3.1',
      'react-native': '^0.76.5',
    },
    devDependencies: {
      '@types/react': '^18.3.11',
      '@kit/eslint-config': 'workspace:*',
      '@kit/prettier-config': 'workspace:*',
      '@kit/tsconfig': 'workspace:*',
      typescript: '^5.7.2',
    },
    eslintConfig: {
      root: true,
      extends: ['@kit/eslint-config/react', '@kit/eslint-config/apps'],
    },
    prettier: '@kit/prettier-config',
  };

  // Add Expo dependencies if needed
  if (config.template.startsWith('expo')) {
    packageJson.dependencies['expo'] = '^52.0.28';
    packageJson.dependencies['expo-status-bar'] = '~2.0.0';

    if (config.template === 'expo-router') {
      packageJson.dependencies['expo-router'] = '^4.0.16';
      packageJson.dependencies['expo-linking'] = '~7.0.4';
      packageJson.dependencies['expo-constants'] = '~17.0.3';
    }

    packageJson.devDependencies['@babel/core'] = '^7.26.0';
  }

  // Add navigation
  if (config.features.navigation && config.template !== 'expo-router') {
    packageJson.dependencies['@react-navigation/native'] = '^7.0.13';
    packageJson.dependencies['@react-navigation/native-stack'] = '^7.1.7';
    packageJson.dependencies['react-native-screens'] = '^4.4.0';
    packageJson.dependencies['react-native-safe-area-context'] = '^5.0.0';
  }

  // Add state management
  if (config.features.stateManagement === 'redux') {
    packageJson.dependencies['@reduxjs/toolkit'] = '^2.3.0';
    packageJson.dependencies['react-redux'] = '^9.1.2';
  } else if (config.features.stateManagement === 'zustand') {
    packageJson.dependencies['zustand'] = '^5.0.2';
  }

  // Add UI library
  if (config.features.ui === 'react-native-paper') {
    packageJson.dependencies['react-native-paper'] = '^5.12.6';
    packageJson.dependencies['react-native-vector-icons'] = '^10.2.0';
  } else if (config.features.ui === 'tamagui') {
    packageJson.dependencies['tamagui'] = '^1.120.3';
    packageJson.dependencies['@tamagui/config'] = '^1.120.3';
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
      jsx: 'react-native',
      resolveJsonModule: true,
    },
    include: ['src', '*.ts', '*.tsx'],
    exclude: ['node_modules'],
  };

  await fs.writeFile(
    path.join(appDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2) + '\n',
  );

  // Create app.json for Expo
  if (config.template.startsWith('expo')) {
    const appJson = {
      expo: {
        name: pascalCase(config.name),
        slug: config.name,
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'light',
        newArchEnabled: true,
        splash: {
          image: './assets/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
        ios: {
          supportsTablet: true,
          bundleIdentifier: `${config.packageScope}.${config.name}`.replace('@', ''),
        },
        android: {
          adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#ffffff',
          },
          package: `${config.packageScope}.${config.name}`.replace('@', '').replace('/', '.'),
        },
        web: {
          favicon: './assets/favicon.png',
        },
        experiments: {
          typedRoutes: true,
        },
      },
    };

    await fs.writeFile(
      path.join(appDir, 'app.json'),
      JSON.stringify(appJson, null, 2) + '\n',
    );

    // Create babel.config.js
    const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
`;
    await fs.writeFile(path.join(appDir, 'babel.config.js'), babelConfig);
  }

  // Create App.tsx
  const appTsx = config.template === 'expo-router'
    ? `// Expo Router handles the app entry point
// See app/_layout.tsx for the root layout
export { default } from './app/_layout';
`
    : `import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, StatusBar } from 'react-native';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>${pascalCase(config.name)}</Text>
        <Text style={styles.subtitle}>Welcome to React Native!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
});

export default App;
`;

  await fs.writeFile(path.join(appDir, 'App.tsx'), appTsx);

  // Create entry point
  if (config.template.startsWith('expo')) {
    // Expo Router structure
    if (config.template === 'expo-router') {
      await fs.mkdir(path.join(appDir, 'app'), { recursive: true });

      const layoutTsx = `import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '${pascalCase(config.name)}' }} />
    </Stack>
  );
}
`;
      await fs.writeFile(path.join(appDir, 'app/_layout.tsx'), layoutTsx);

      const indexTsx = `import { Text, View, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>${pascalCase(config.name)}</Text>
      <Text style={styles.subtitle}>Welcome to Expo Router!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
});
`;
      await fs.writeFile(path.join(appDir, 'app/index.tsx'), indexTsx);
    }

    // Regular Expo entry
    const indexJs = `import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
`;
    await fs.writeFile(path.join(appDir, 'index.js'), indexJs);
  } else {
    // Bare React Native entry
    const indexJs = `import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
`;
    await fs.writeFile(path.join(appDir, 'index.js'), indexJs);
  }

  // Create .gitignore
  const gitignore = `# Dependencies
node_modules

# Expo
.expo
.expo-shared
dist

# Native
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
ios/
android/

# Metro
.metro-health-check*

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# MacOS
.DS_Store
*.pem

# Local env
.env*.local

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

  console.log(`\n✅ React Native app created successfully!\n`);
  console.log(`📂 Location: ${appDir}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   cd ${appDir}`);
  console.log(`   pnpm start\n`);

  if (config.template.startsWith('expo')) {
    console.log(`📱 Scan the QR code with Expo Go app to preview on your device\n`);
  }
}

async function main() {
  console.log('\n📱 React Native App Generator\n');

  const response = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'App name (e.g., "my-mobile-app"):',
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
      initial: 'A React Native mobile application',
    },
    {
      type: 'select',
      name: 'template',
      message: 'Template:',
      choices: [
        { title: 'Expo (managed workflow)', value: 'expo' },
        { title: 'Expo Router (file-based routing)', value: 'expo-router' },
        { title: 'Bare React Native', value: 'bare', disabled: true },
      ],
      initial: 1,
    },
    {
      type: (prev) => (prev === 'expo' || prev === 'bare' ? 'confirm' : null),
      name: 'navigation',
      message: 'Include React Navigation?',
      initial: true,
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
        { title: 'React Native Paper', value: 'react-native-paper' },
        { title: 'Tamagui', value: 'tamagui', disabled: true },
        { title: 'None (custom styles)', value: 'none' },
      ],
      initial: 0,
    },
  ]);

  if (!response.name) {
    console.log('\n❌ App creation cancelled\n');
    return;
  }

  await createReactNativeApp({
    name: response.name,
    packageScope: response.packageScope,
    description: response.description,
    template: response.template,
    features: {
      navigation: response.navigation ?? false,
      stateManagement: response.stateManagement,
      ui: response.ui,
    },
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// EXPORT for programmatic usage
export { createReactNativeApp, type AppConfig };
