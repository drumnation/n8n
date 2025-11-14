#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { execSync } from 'child_process';

const REPO_ROOT = join(__dirname, '../..');
const ENV_FILE = join(REPO_ROOT, '.env');

// Port ranges for different worktrees (avoids conflicts)
// Using IANA private/dynamic port range (49152-65535) to avoid conflicts
// See: https://www.iana.org/assignments/service-names-port-numbers/
const PORT_RANGES = {
  VITE_PORT: { start: 50000, end: 50100 },  // Frontend dev servers
  PORT: { start: 50100, end: 50200 },       // Backend API servers
};

interface EnvConfig {
  section: string;
  variables: Record<string, { value: string; comment?: string }>;
}

interface PortAllocation {
  vitePort: number;
  serverPort: number;
}

/**
 * Check if a port is actually in use on the system
 */
function isPortInUse(port: number): boolean {
  try {
    execSync(`lsof -i:${port}`, { stdio: 'ignore' });
    return true; // Port is in use
  } catch {
    return false; // Port is free
  }
}

/**
 * Find all worktrees and their allocated ports
 */
function findAllocatedPorts(): Set<number> {
  const allocatedPorts = new Set<number>();

  // Check parent directory for other worktrees
  const parentDir = dirname(REPO_ROOT);

  try {
    const entries = readdirSync(parentDir);

    for (const entry of entries) {
      const entryPath = join(parentDir, entry);

      // Skip if not a directory
      if (!statSync(entryPath).isDirectory()) continue;

      // Check for .env file
      const envPath = join(entryPath, '.env');
      if (!existsSync(envPath)) continue;

      // Parse .env and extract ports
      const envContent = readFileSync(envPath, 'utf-8');
      const portMatches = envContent.match(/^(?:VITE_)?PORT=(\d+)/gm);

      if (portMatches) {
        portMatches.forEach(match => {
          const port = parseInt(match.split('=')[1]);
          if (!isNaN(port)) {
            allocatedPorts.add(port);
          }
        });
      }
    }
  } catch (error) {
    console.log('ℹ️  Could not scan for other worktrees (this is fine)');
  }

  // Also check main repo (go up one more level to find worktrees/)
  try {
    const mainRepoPath = join(parentDir, '..');
    const mainEnvPath = join(mainRepoPath, '.env');

    if (existsSync(mainEnvPath)) {
      const envContent = readFileSync(mainEnvPath, 'utf-8');
      const portMatches = envContent.match(/^(?:VITE_)?PORT=(\d+)/gm);

      if (portMatches) {
        portMatches.forEach(match => {
          const port = parseInt(match.split('=')[1]);
          if (!isNaN(port)) {
            allocatedPorts.add(port);
          }
        });
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return allocatedPorts;
}

/**
 * Find next available port in range
 * Checks both allocated ports in .env files AND actual system port usage
 */
function findAvailablePort(start: number, end: number, allocatedPorts: Set<number>): number {
  for (let port = start; port <= end; port++) {
    // Check if port is allocated in .env files
    if (allocatedPorts.has(port)) {
      continue;
    }

    // Double-check: is the port actually in use on the system?
    if (isPortInUse(port)) {
      console.log(`   ⚠️  Port ${port} is in use by another process (skipping)`);
      allocatedPorts.add(port); // Mark as allocated to avoid trying again
      continue;
    }

    return port;
  }
  throw new Error(`No available ports in range ${start}-${end}`);
}

/**
 * Allocate unique ports for this worktree
 */
function allocateUniquePorts(): PortAllocation {
  const allocatedPorts = findAllocatedPorts();

  console.log(`📊 Found ${allocatedPorts.size} ports already in use: ${Array.from(allocatedPorts).sort((a, b) => a - b).join(', ')}`);

  const vitePort = findAvailablePort(
    PORT_RANGES.VITE_PORT.start,
    PORT_RANGES.VITE_PORT.end,
    allocatedPorts
  );

  // Mark vite port as used
  allocatedPorts.add(vitePort);

  const serverPort = findAvailablePort(
    PORT_RANGES.PORT.start,
    PORT_RANGES.PORT.end,
    allocatedPorts
  );

  return { vitePort, serverPort };
}

/**
 * Get worktree-specific database name
 */
function getWorktreeDatabaseName(): string {
  const worktreeName = basename(REPO_ROOT);

  // Sanitize name for MongoDB (alphanumeric + underscores/hyphens only)
  const sanitized = worktreeName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

  return `cheddar-${sanitized}`;
}

function generateEnvFile(): void {
  console.log('🔧 Generating .env file with unique ports...\n');

  // Check if .env already exists
  if (existsSync(ENV_FILE)) {
    console.log('⚠️  .env file already exists. Skipping generation.');
    console.log('   To regenerate, delete .env and run this script again.\n');
    return;
  }

  // Allocate unique ports
  const ports = allocateUniquePorts();
  console.log(`\n🎯 Allocated ports for this worktree:`);
  console.log(`   Frontend (Vite): ${ports.vitePort}`);
  console.log(`   Backend (Server): ${ports.serverPort}\n`);

  // Auto-detect OpenAI API key from environment (server-side only)
  const openaiKey = process.env.OPENAI_API_KEY || 'sk-your-api-key-here';
  const hasRealKey = openaiKey !== 'sk-your-api-key-here';

  // Get unique database name
  const dbName = getWorktreeDatabaseName();

  // Define environment configuration with dynamic ports
  const config: EnvConfig[] = [
    {
      section: 'SHARED CONFIGURATION',
      variables: {
        NODE_ENV: { value: 'development' },
        DEFAULT_USER_ID: {
          value: 'demo-user-id',
          comment:
            'Backend user ID for seeding scripts. MUST match VITE_DEFAULT_USER_ID. Options: "demo-user-id" (default) or "auth0|661968490baf780caa95fd8d" (personal data)',
        },
        VITE_DEFAULT_USER_ID: {
          value: 'demo-user-id',
          comment:
            'Frontend user ID (Vite requires VITE_* prefix). MUST match DEFAULT_USER_ID for database mode to work.',
        },
      },
    },
    {
      section: 'FRONTEND (VITE) - Public variables exposed to browser',
      variables: {
        VITE_USE_LOCAL_DATA: {
          value: 'true',
          comment:
            'Data Source: true = local files (primary dev mode), false = database (requires backend)',
        },
        VITE_PORT: {
          value: String(ports.vitePort),
          comment: 'Auto-assigned unique port for this worktree',
        },
        VITE_LOG_LEVEL: { value: 'info' },
        VITE_API_BASE_URL: {
          value: `http://localhost:${ports.serverPort}`,
          comment: 'Points to backend server port',
        },
      },
    },
    {
      section: 'BACKEND (SERVER) - Private variables',
      variables: {
        PORT: {
          value: String(ports.serverPort),
          comment: 'Auto-assigned unique port for this worktree',
        },
        MONGO_URL: {
          value: `mongodb://localhost:27017/${dbName}`,
          comment: 'Unique database per worktree to avoid conflicts',
        },
        SESSION_SECRET: {
          value: 'your-session-secret-change-in-production',
          comment: 'Change this in production!',
        },
        OPENAI_API_KEY: {
          value: openaiKey,
          comment: 'Required for AgentCopilot (uses OpenAI GPT-4 for intelligent tool calling)',
        },
        LOG_LEVEL: { value: 'info' },
        LOG_DIR: { value: './logs' },
      },
    },
  ];

  // Generate file content
  const worktreeName = basename(REPO_ROOT);
  const lines: string[] = [
    '# Cheddar Finance Monorepo - Environment Variables',
    `# Worktree: ${worktreeName}`,
    '# Generated by: pnpm generate:env',
    `# Frontend Port: ${ports.vitePort} | Backend Port: ${ports.serverPort}`,
    '',
  ];

  config.forEach((section, sectionIndex) => {
    // Add section divider
    lines.push('# ' + '='.repeat(77));
    lines.push(`# ${section.section}`);
    lines.push('# ' + '='.repeat(77));
    lines.push('');

    // Add variables
    Object.entries(section.variables).forEach(([key, { value, comment }]) => {
      if (comment) {
        lines.push(`# ${comment}`);
      }
      lines.push(`${key}=${value}`);
    });

    // Add spacing between sections
    if (sectionIndex < config.length - 1) {
      lines.push('');
    }
  });

  // Write the file
  writeFileSync(ENV_FILE, lines.join('\n') + '\n', 'utf-8');

  console.log('✅ .env file generated successfully!\n');

  // Show configuration summary
  console.log('📋 Configuration Summary:');
  console.log(`   Worktree: ${worktreeName}`);
  console.log(`   Frontend: http://localhost:${ports.vitePort}`);
  console.log(`   Backend:  http://localhost:${ports.serverPort}/api/v1`);
  console.log(`   Database: ${dbName}`);
  console.log('');

  // Show status
  if (hasRealKey) {
    console.log('✅ OpenAI API key detected and configured');
  } else {
    console.log('⚠️  OpenAI API key not found in environment');
    console.log('   Please set OPENAI_API_KEY in .env to enable AgentCopilot');
  }

  console.log('\n📝 Next steps:');
  console.log('   1. Review .env and update any placeholder values');
  console.log('   2. Set OPENAI_API_KEY in .env if you want to use AgentCopilot');
  console.log('   3. Run: pnpm dev\n');

  console.log('💡 Tip: You can now run multiple worktrees simultaneously!');
  console.log('   Each worktree has unique ports and database.\n');
}

// Run the script
generateEnvFile();
