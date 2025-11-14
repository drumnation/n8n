#!/usr/bin/env tsx
/**
 * Environment Setup Script
 *
 * This script ensures that the root .env file exists before running the dev server.
 * If .env doesn't exist, it copies from .env.example.
 *
 * Usage: pnpm env:check (runs automatically before `pnpm dev`)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const MONOREPO_ROOT = path.resolve(__dirname, '../..');
const ENV_FILE = path.join(MONOREPO_ROOT, '.env');
const ENV_EXAMPLE = path.join(MONOREPO_ROOT, '.env.example');

function checkAndSetupEnv(): void {
  console.log('🔍 Checking environment configuration...\n');

  // Check if .env exists
  if (fs.existsSync(ENV_FILE)) {
    console.log('✅ Root .env file found');
    return;
  }

  console.log('⚠️  Root .env file not found');

  // Check if .env.example exists
  if (!fs.existsSync(ENV_EXAMPLE)) {
    console.error('❌ Error: .env.example not found at monorepo root');
    console.error('   Please create .env.example with required variables');
    process.exit(1);
  }

  // Copy .env.example to .env
  console.log('📝 Creating .env from .env.example...');
  try {
    fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
    console.log('✅ Created root .env file');
    console.log('\n⚙️  Next steps:');
    console.log('   1. Edit .env and add your values (especially OPENAI_API_KEY for server-side AI)');
    console.log('   2. Never commit .env to version control');
    console.log('   3. Use .env.example to document required variables\n');
  } catch (error) {
    console.error('❌ Error creating .env file:', error);
    process.exit(1);
  }
}

// Run the check
checkAndSetupEnv();
