#!/usr/bin/env tsx
/**
 * Worktree Environment Setup Script
 *
 * This script sets up environment files for git worktrees.
 * It creates a root .env file if it doesn't exist.
 *
 * Usage: pnpm env:setup-worktree
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const MONOREPO_ROOT = path.resolve(__dirname, '../..');
const ENV_FILE = path.join(MONOREPO_ROOT, '.env');
const ENV_EXAMPLE = path.join(MONOREPO_ROOT, '.env.example');

function setupWorktreeEnv(): void {
  console.log('🔧 Setting up worktree environment...\n');

  // Check if we're in a worktree
  const gitDir = path.join(MONOREPO_ROOT, '.git');
  const isWorktree = fs.existsSync(gitDir) && fs.statSync(gitDir).isFile();

  if (isWorktree) {
    console.log('📍 Git worktree detected');
  }

  // Check if .env exists
  if (fs.existsSync(ENV_FILE)) {
    console.log('✅ Root .env file already exists');
    console.log(`   Location: ${ENV_FILE}\n`);
    return;
  }

  console.log('⚠️  Root .env file not found');

  // Check if .env.example exists
  if (!fs.existsSync(ENV_EXAMPLE)) {
    console.error('❌ Error: .env.example not found');
    console.error(`   Expected at: ${ENV_EXAMPLE}`);
    console.error('\n   Creating default .env.example...\n');

    // Create a basic .env.example
    const defaultExample = `# Cheddar Finance - Environment Variables

# Frontend (Vite) - Public variables
# Local Data Mode - Uses file-based storage (primary development mode)
VITE_USE_LOCAL_DATA=true
VITE_PORT=5246

VITE_LOG_LEVEL=info
VITE_API_BASE_URL=http://localhost:3001

# Backend (Server) - Private variables
PORT=3001
MONGO_URL=mongodb://localhost:27017/cheddar
SESSION_SECRET=your-session-secret-change-in-production

# OpenAI API Key (server-side only - never expose to frontend)
# IMPORTANT: No VITE_ prefix - this is server-side only for security
OPENAI_API_KEY=sk-your-api-key-here

LOG_LEVEL=info
`;

    fs.writeFileSync(ENV_EXAMPLE, defaultExample);
    console.log('✅ Created .env.example');
  }

  // Copy .env.example to .env
  console.log('📝 Creating .env from .env.example...');
  try {
    fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
    console.log('✅ Created root .env file');
    console.log(`   Location: ${ENV_FILE}\n`);
    console.log('⚙️  Next steps:');
    console.log('   1. Edit .env and add your OPENAI_API_KEY (server-side, required for AI features)');
    console.log('   2. Update MONGO_URL if using database mode');
    console.log('   3. Never commit .env to version control\n');
  } catch (error) {
    console.error('❌ Error creating .env file:', error);
    process.exit(1);
  }
}

// Run the setup
setupWorktreeEnv();
