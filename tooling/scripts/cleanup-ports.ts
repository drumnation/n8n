#!/usr/bin/env tsx

/**
 * Cleanup Ports Utility
 *
 * This script kills processes running on specific ports to prevent
 * "port already in use" errors when starting dev servers.
 *
 * Usage:
 *   tsx cleanup-ports.ts <port1> <port2> ...
 *   tsx cleanup-ports.ts 3000 5240
 */

import { execSync } from 'child_process';

function killProcessOnPort(port: number): void {
  try {
    console.log(`🔍 Checking port ${port}...`);

    // Try to find process using the port
    const result = execSync(`lsof -ti:${port}`, { encoding: 'utf-8' }).trim();

    if (result) {
      const pids = result.split('\n').filter(Boolean);

      for (const pid of pids) {
        console.log(`   ⚠️  Port ${port} is in use by process ${pid}`);
        console.log(`   🔪 Killing process ${pid}...`);

        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log(`   ✅ Process ${pid} killed successfully`);
        } catch (killError) {
          console.log(`   ⚠️  Could not kill process ${pid} (may have already exited)`);
        }
      }
    } else {
      console.log(`   ✅ Port ${port} is available`);
    }
  } catch (error: any) {
    // lsof returns non-zero exit code if no process found
    if (error.status === 1) {
      console.log(`   ✅ Port ${port} is available`);
    } else {
      console.log(`   ⚠️  Error checking port ${port}:`, error.message);
    }
  }
}

function main() {
  const ports = process.argv.slice(2).map(Number);

  if (ports.length === 0) {
    console.error('❌ No ports specified');
    console.error('Usage: tsx cleanup-ports.ts <port1> <port2> ...');
    console.error('Example: tsx cleanup-ports.ts 3000 5240');
    process.exit(1);
  }

  console.log('🧹 Cleaning up ports...\n');

  for (const port of ports) {
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(`❌ Invalid port number: ${port}`);
      continue;
    }

    killProcessOnPort(port);
  }

  console.log('\n✨ Port cleanup complete!');
}

main();
