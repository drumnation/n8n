/**
 * Monorepo Setup for Universal Testing Standard
 *
 * This module handles the automatic setup of proper monorepo testing infrastructure
 * based on the patterns discovered in brain-garden-studio.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import chalk from "chalk";
import { execSync } from "child_process";

interface MonorepoConfig {
  isMonorepo: boolean;
  hasWorkspace: boolean;
  hasTurbo: boolean;
  hasProperRootPackageJson: boolean;
  workspacePatterns: string[];
  packageManager: "npm" | "pnpm" | "yarn";
}

interface VitestProject {
  name: string;
  root: string;
  environment: "node" | "jsdom";
  include: string[];
  exclude: string[];
}

export async function detectMonorepoStructure(): Promise<MonorepoConfig> {
  const cwd = process.cwd();

  // Check for workspace configuration files
  const pnpmWorkspace = existsSync(join(cwd, "pnpm-workspace.yaml"));
  const yarnWorkspace = existsSync(join(cwd, "yarn.lock"));
  const npmWorkspace =
    existsSync(join(cwd, "package.json")) &&
    JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")).workspaces;

  const hasWorkspace = pnpmWorkspace || yarnWorkspace || npmWorkspace;
  const hasTurbo = existsSync(join(cwd, "turbo.json"));

  // Detect package manager
  let packageManager: "npm" | "pnpm" | "yarn" = "npm";
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) packageManager = "pnpm";
  else if (existsSync(join(cwd, "yarn.lock"))) packageManager = "yarn";

  // Check workspace patterns
  let workspacePatterns: string[] = [];
  if (pnpmWorkspace) {
    const pnpmConfig = readFileSync(join(cwd, "pnpm-workspace.yaml"), "utf8");
    const match = pnpmConfig.match(/packages:\s*\n((?:\s*-\s*'[^']*'\s*\n)*)/);
    if (match) {
      workspacePatterns = match[1]!
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("-"))
        .map((line) => line.replace(/^-\s*'([^']*)'/, "$1"));
    }
  }

  // Check if root package.json is properly configured for monorepo
  let hasProperRootPackageJson = false;
  if (existsSync(join(cwd, "package.json"))) {
    const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"));
    hasProperRootPackageJson =
      pkg.private === true &&
      pkg.scripts?.typecheck?.includes("turbo") &&
      pkg.scripts?.lint?.includes("turbo") &&
      pkg.scripts?.test?.includes("turbo");
  }

  return {
    isMonorepo: hasWorkspace,
    hasWorkspace,
    hasTurbo,
    hasProperRootPackageJson,
    workspacePatterns,
    packageManager,
  };
}

export function generateRootPackageJson(config: MonorepoConfig): object {
  const projectName = process.cwd().split("/").pop() || "monorepo-project";

  return {
    name: projectName,
    version: "1.0.0",
    description: `${projectName} - AI-assisted development monorepo`,
    type: "module",
    private: true,
    scripts: {
      dev: "turbo run dev",
      build: "turbo run build",
      clean: "turbo run clean",
      typecheck: "turbo run typecheck",
      lint: "turbo run lint",
      format: "turbo run format",
      test: "turbo run test",
      "test:unit": "turbo run test:unit",
      "test:integration": "turbo run test:integration",
      "test:e2e": "turbo run test:e2e",
      "test:coverage": "turbo run test:coverage",
      // Brain monitor scripts (added by main init)
      "brain:validate": "brain-monitor validate",
      "brain:watch": "brain-monitor watch",
      "brain:typecheck-failures": "brain-monitor typecheck",
      "brain:lint-failures": "brain-monitor lint",
      "brain:format-failures": "brain-monitor format",
      "brain:logs": "brain-monitor logs",
      "brain:dev": "brain-monitor dev",
      "brain:test-failures-unit": "brain-monitor test unit",
      "brain:test-failures-integration": "brain-monitor test integration",
      "brain:test-failures-e2e": "brain-monitor test e2e",
      "ci:test": "brain-monitor ci:test",
      "ci:test:validate": "brain-monitor ci:test --job validate",
    },
    keywords: ["monorepo", "ai", "development", "testing"],
    author: `${projectName} Contributors`,
    license: "MIT",
    devDependencies: {
      "@kit/brain-monitor": "workspace:*",
      "@vitest/ui": "^3.2.4",
      chalk: "^5.3.0",
      turbo: "^2.5.4",
      vitest: "^3.2.4",
    },
    packageManager: `${config.packageManager}@latest`,
    engines: {
      node: ">=18.0.0",
      [config.packageManager]: ">=9.0.0",
    },
  };
}

export function generateTurboConfig(): object {
  return {
    $schema: "https://turbo.build/schema.json",
    globalDependencies: ["**/.env"],
    tasks: {
      build: {
        dependsOn: ["^build"],
        outputs: ["dist/**", ".next/**", "!.next/cache/**"],
      },
      lint: {
        dependsOn: ["^lint"],
        outputs: ["node_modules/.cache/.eslintcache"],
      },
      "lint:fix": {
        dependsOn: ["^lint:fix"],
        outputs: ["node_modules/.cache/.eslintcache"],
      },
      format: {
        outputs: ["node_modules/.cache/.prettiercache"],
      },
      "format:fix": {
        outputs: ["node_modules/.cache/.prettiercache"],
      },
      typecheck: {
        dependsOn: ["^typecheck"],
        outputs: [],
      },
      test: {
        dependsOn: ["^build"],
        outputs: ["coverage/**"],
        inputs: [
          "src/**/*.tsx",
          "src/**/*.ts",
          "test/**/*.ts",
          "test/**/*.tsx",
        ],
      },
      "test:unit": {
        dependsOn: ["^build"],
        outputs: ["coverage/**"],
        inputs: [
          "src/**/*.tsx",
          "src/**/*.ts",
          "test/**/*.ts",
          "test/**/*.tsx",
        ],
      },
      "test:integration": {
        dependsOn: ["^build"],
        outputs: ["coverage/**"],
        inputs: [
          "src/**/*.tsx",
          "src/**/*.ts",
          "test/**/*.ts",
          "test/**/*.tsx",
        ],
      },
      "test:e2e": {
        dependsOn: ["^build"],
        outputs: ["coverage/**"],
        inputs: [
          "src/**/*.tsx",
          "src/**/*.ts",
          "test/**/*.ts",
          "test/**/*.tsx",
        ],
      },
      dev: {
        cache: false,
        persistent: true,
      },
    },
  };
}

async function findPackagesNeedingVitestConfigs(
  workspacePatterns: string[],
): Promise<string[]> {
  const packagesNeedingConfigs: string[] = [];
  const cwd = process.cwd();

  for (const pattern of workspacePatterns) {
    try {
      const globPattern = pattern.replace("*", "");
      const result = execSync(
        `find ${globPattern} -maxdepth 2 -name "package.json" -not -path "*/node_modules/*"`,
        { encoding: "utf8", cwd },
      );

      if (result.trim()) {
        const packagePaths = result.trim().split("\n");

        for (const pkgPath of packagePaths) {
          const packageDir = join(cwd, pkgPath.replace("/package.json", ""));
          const pkg = JSON.parse(readFileSync(join(cwd, pkgPath), "utf8"));

          // Check if package has test scripts but no vitest config
          const hasTestScripts =
            pkg.scripts &&
            (pkg.scripts.test ||
              pkg.scripts["test:unit"] ||
              pkg.scripts["test:integration"]);

          const hasVitestConfig =
            existsSync(join(packageDir, "vitest.config.ts")) ||
            existsSync(join(packageDir, "vitest.config.js"));

          const usesKitTesting =
            pkg.devDependencies?.["@kit/testing"] ||
            pkg.peerDependencies?.["@kit/testing"];

          // Skip brain-sync packages - they get synced to other projects and shouldn't have own testing
          const isSyncPackage = pkg.name?.includes("brain-sync");

          if (
            hasTestScripts &&
            !hasVitestConfig &&
            usesKitTesting &&
            !isSyncPackage
          ) {
            packagesNeedingConfigs.push(packageDir);
          }
        }
      }
    } catch (error) {
      // Pattern might not exist, continue
    }
  }

  return packagesNeedingConfigs;
}

async function ensurePackageVitestConfigs(
  packageDirs: string[],
): Promise<void> {
  for (const packageDir of packageDirs) {
    const pkg = JSON.parse(
      readFileSync(join(packageDir, "package.json"), "utf8"),
    );

    // Determine the appropriate config based on package type
    let configContent = "";

    if (packageDir.includes("/tooling/")) {
      // Tooling packages typically need unit testing with Node environment
      configContent = `import { defineConfig } from 'vitest/config';
import { configs } from '@kit/testing';

export default defineConfig(await configs.vitest.unit());`;
    } else if (pkg.dependencies?.react || pkg.peerDependencies?.react) {
      // React packages need jsdom environment
      configContent = `import { defineConfig } from 'vitest/config';
import { configs } from '@kit/testing';

export default defineConfig(await configs.vitest.unit());`;
    } else {
      // Generic packages
      configContent = `import { defineConfig } from 'vitest/config';
import { configs } from '@kit/testing';

export default defineConfig(await configs.vitest.unit());`;
    }

    const configPath = join(packageDir, "vitest.config.ts");
    writeFileSync(configPath, configContent);
    console.log(chalk.green(`✅ Created vitest.config.ts for ${pkg.name}`));
  }
}

export async function setupMonorepoTesting(): Promise<void> {
  console.log(chalk.blue("🔧 Setting up universal testing standard..."));

  const config = await detectMonorepoStructure();
  const cwd = process.cwd();

  if (!config.isMonorepo) {
    console.log(
      chalk.yellow(
        "⚠️  Single package project detected - skipping monorepo setup",
      ),
    );
    return;
  }

  console.log(
    chalk.gray(
      `• Detected ${config.packageManager} monorepo with workspace patterns: ${config.workspacePatterns.join(", ")}`,
    ),
  );

  // 1. Set up proper root package.json if needed
  if (!config.hasProperRootPackageJson) {
    console.log(chalk.gray("• Creating proper root package.json..."));

    // Backup existing package.json if it's not a proper root config
    if (existsSync(join(cwd, "package.json"))) {
      const existing = JSON.parse(
        readFileSync(join(cwd, "package.json"), "utf8"),
      );
      if (
        !existing.private ||
        !existing.scripts?.typecheck?.includes("turbo")
      ) {
        writeFileSync(
          join(cwd, "package.json.backup"),
          JSON.stringify(existing, null, 2),
        );
        console.log(
          chalk.yellow(
            "• Backed up existing package.json to package.json.backup",
          ),
        );
      }
    }

    const rootPkg = generateRootPackageJson(config);
    writeFileSync(
      join(cwd, "package.json"),
      JSON.stringify(rootPkg, null, 2) + "\n",
    );
    console.log(chalk.green("✅ Created proper root package.json"));
  }

  // 2. Set up Turbo configuration if needed
  if (!config.hasTurbo) {
    console.log(chalk.gray("• Creating turbo.json..."));
    const turboConfig = generateTurboConfig();
    writeFileSync(
      join(cwd, "turbo.json"),
      JSON.stringify(turboConfig, null, 2) + "\n",
    );
    console.log(chalk.green("✅ Created turbo.json"));
  } else {
    // Check if turbo.json uses old pipeline format and update
    const turboPath = join(cwd, "turbo.json");
    const turboContent = readFileSync(turboPath, "utf8");
    if (turboContent.includes('"pipeline"')) {
      console.log(chalk.gray("• Updating turbo.json to v2.x format..."));
      const updated = turboContent
        .replace('"pipeline"', '"tasks"')
        .replace(
          "https://turborepo.org/schema.json",
          "https://turbo.build/schema.json",
        );
      writeFileSync(turboPath, updated);
      console.log(chalk.green("✅ Updated turbo.json to v2.x format"));
    }
  }

  // 3. Ensure packages have proper individual vitest configs (if using @kit/testing)
  console.log(chalk.gray("• Checking package vitest configurations..."));
  const packagesNeedingConfigs = await findPackagesNeedingVitestConfigs(
    config.workspacePatterns,
  );

  if (packagesNeedingConfigs.length > 0) {
    console.log(
      chalk.gray(
        `• Found ${packagesNeedingConfigs.length} packages that may need vitest configs`,
      ),
    );
    // We'll add individual configs based on @kit/testing pattern if needed
    await ensurePackageVitestConfigs(packagesNeedingConfigs);
  }

  // 4. Update VS Code settings for better monorepo integration
  const vscodeDir = join(cwd, ".vscode");
  const settingsPath = join(vscodeDir, "settings.json");

  if (existsSync(vscodeDir)) {
    console.log(
      chalk.gray("• Updating VS Code settings for monorepo development..."),
    );

    let settings = {};
    if (existsSync(settingsPath)) {
      const content = readFileSync(settingsPath, "utf8");
      // Strip comments from JSON before parsing
      const cleanedContent = content
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");
      try {
        settings = JSON.parse(cleanedContent);
      } catch (error) {
        console.log(
          chalk.yellow("⚠️  Could not parse VS Code settings, skipping update"),
        );
        return;
      }
    }

    // Add better monorepo development settings
    const monorepoSettings = {
      "typescript.preferences.importModuleSpecifier": "relative",
      "javascript.preferences.importModuleSpecifier": "relative",
      "vitest.maximumConfigs": 15, // Allow more configs for monorepo
      "search.exclude": {
        "**/node_modules": true,
        "**/dist": true,
        "**/.turbo": true,
        "**/coverage": true,
      },
    };

    Object.assign(settings, monorepoSettings);

    if (!existsSync(vscodeDir)) {
      execSync(`mkdir -p "${vscodeDir}"`);
    }

    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
    console.log(
      chalk.green("✅ Updated VS Code settings for monorepo development"),
    );
  }

  console.log(chalk.green("✅ Universal testing standard setup complete!"));
  console.log(chalk.cyan("\nNext steps:"));
  console.log(
    `  1. Run '${config.packageManager} install' to update dependencies`,
  );
  console.log(
    `  2. Run '${config.packageManager} typecheck' to test workspace coordination`,
  );
  console.log(
    `  3. Run '${config.packageManager} brain:validate' to verify everything works`,
  );
}

// For standalone testing
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMonorepoTesting().catch(console.error);
}
