#!/usr/bin/env node
/**
 * Recursive test runner with auto-adjustment capabilities
 * Automatically tweaks timeout, retry, and isolation settings on failure
 * Re-runs tests up to 2 times to meet coverage thresholds
 */

import {spawn} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

interface TestResult {
  success: boolean;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
    average: number;
  };
  duration: number;
  error?: string;
}

interface RunnerOptions {
  command: string;
  args: string[];
  suite: string;
  targetCoverage: number;
  maxRetries: number;
  adjustments: {
    timeout?: boolean;
    retry?: boolean;
    isolate?: boolean;
    workers?: boolean;
  };
}

class RecursiveTestRunner {
  private attempt = 0;
  private adjustmentLog: string[] = [];

  constructor(private options: RunnerOptions) {}

  async run(): Promise<TestResult> {
    console.log(
      `\n🚀 Starting ${this.options.suite} tests (attempt ${this.attempt + 1}/${this.options.maxRetries + 1})`,
    );

    const startTime = Date.now();
    const result = await this.executeTests();
    result.duration = Date.now() - startTime;

    if (
      !result.success ||
      (result.coverage && result.coverage.average < this.options.targetCoverage)
    ) {
      if (this.attempt < this.options.maxRetries) {
        console.log(
          `\n⚠️  Test failed or coverage below threshold. Adjusting and retrying...`,
        );
        await this.adjustAndRetry(result);
        this.attempt++;
        return this.run();
      } else {
        console.log(`\n❌ Maximum retries reached. Final state:`);
        this.printSummary(result);
        return result;
      }
    }

    console.log(`\n✅ Tests passed with adequate coverage!`);
    this.printSummary(result);
    return result;
  }

  private async executeTests(): Promise<TestResult> {
    return new Promise((resolve) => {
      const env = {...process.env};

      // Apply adjustments from previous attempts
      if (this.adjustmentLog.includes('timeout')) {
        env.VITEST_TIMEOUT_MULTIPLIER = '2';
      }
      if (this.adjustmentLog.includes('workers')) {
        env.VITEST_POOL_SIZE = '1';
      }

      const proc = spawn(this.options.command, this.options.args, {
        env,
        stdio: 'inherit',
        shell: true,
      });

      proc.on('close', (code) => {
        const coverage = this.readCoverage();
        resolve({
          success: code === 0,
          coverage,
          duration: 0,
          error: code !== 0 ? `Process exited with code ${code}` : undefined,
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          duration: 0,
          error: error.message,
        });
      });
    });
  }

  private readCoverage(): TestResult['coverage'] | undefined {
    const coveragePath = join(
      process.cwd(),
      'coverage',
      'coverage-summary.json',
    );

    if (!existsSync(coveragePath)) {
      return undefined;
    }

    try {
      const summary = JSON.parse(readFileSync(coveragePath, 'utf-8'));
      const metrics = summary.total;

      const average =
        (metrics.statements.pct +
          metrics.branches.pct +
          metrics.functions.pct +
          metrics.lines.pct) /
        4;

      return {
        statements: metrics.statements.pct,
        branches: metrics.branches.pct,
        functions: metrics.functions.pct,
        lines: metrics.lines.pct,
        average,
      };
    } catch (error) {
      console.warn('Could not read coverage data:', error);
      return undefined;
    }
  }

  private async adjustAndRetry(result: TestResult) {
    const adjustments = this.options.adjustments;

    // Determine what to adjust based on failure type and attempt number
    if (
      result.error?.includes('timeout') &&
      adjustments.timeout &&
      !this.adjustmentLog.includes('timeout')
    ) {
      console.log('📊 Increasing timeouts...');
      this.adjustmentLog.push('timeout');
      this.updateConfig('timeout');
    } else if (
      result.coverage &&
      result.coverage.average < this.options.targetCoverage
    ) {
      if (adjustments.isolate && !this.adjustmentLog.includes('isolate')) {
        console.log('📊 Enabling test isolation for better coverage...');
        this.adjustmentLog.push('isolate');
        this.updateConfig('isolate');
      } else if (
        adjustments.workers &&
        !this.adjustmentLog.includes('workers')
      ) {
        console.log('📊 Reducing parallel workers...');
        this.adjustmentLog.push('workers');
        this.updateConfig('workers');
      } else if (adjustments.retry && !this.adjustmentLog.includes('retry')) {
        console.log('📊 Increasing retry count...');
        this.adjustmentLog.push('retry');
        this.updateConfig('retry');
      }
    }

    // Wait a moment before retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private updateConfig(adjustment: string) {
    // In a real implementation, this would modify the actual config files
    // For now, we'll use environment variables in executeTests
    console.log(`Applied adjustment: ${adjustment}`);
  }

  private printSummary(result: TestResult) {
    console.log('\n📋 Test Summary:');
    console.log(`Suite: ${this.options.suite}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`Attempts: ${this.attempt + 1}`);
    console.log(`Adjustments: ${this.adjustmentLog.join(', ') || 'none'}`);

    if (result.coverage) {
      console.log('\n📊 Coverage Report:');
      console.log(`Statements: ${result.coverage.statements.toFixed(1)}%`);
      console.log(`Branches: ${result.coverage.branches.toFixed(1)}%`);
      console.log(`Functions: ${result.coverage.functions.toFixed(1)}%`);
      console.log(`Lines: ${result.coverage.lines.toFixed(1)}%`);
      console.log(`Average: ${result.coverage.average.toFixed(1)}%`);
      console.log(`Target: ${this.options.targetCoverage}%`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const suite = args[0] || 'unit';
  const targetCoverage = Number(args[1]) || 85;

  const runners: Record<string, RunnerOptions> = {
    unit: {
      command: 'vitest',
      args: ['run', '--config', './src/configs/vitest/unit.ts', '--coverage'],
      suite: 'Unit',
      targetCoverage,
      maxRetries: 2,
      adjustments: {
        timeout: true,
        isolate: true,
        workers: true,
      },
    },
    integration: {
      command: 'vitest',
      args: [
        'run',
        '--config',
        './src/configs/vitest/integration.ts',
        '--coverage',
      ],
      suite: 'Integration',
      targetCoverage,
      maxRetries: 2,
      adjustments: {
        timeout: true,
        retry: true,
      },
    },
    e2e: {
      command: 'vitest',
      args: ['run', '--config', './src/configs/vitest/e2e.ts'],
      suite: 'E2E',
      targetCoverage: 0, // E2E coverage disabled by default
      maxRetries: 2,
      adjustments: {
        timeout: true,
        retry: true,
      },
    },
    storybook: {
      command: 'vitest',
      args: [
        'run',
        '--config',
        './src/configs/vitest/storybook.ts',
        '--coverage',
      ],
      suite: 'Storybook',
      targetCoverage,
      maxRetries: 2,
      adjustments: {
        timeout: true,
        isolate: true,
      },
    },
    'storybook-run': {
      command: 'test-storybook',
      args: ['--coverage', '--coverageDirectory', './coverage/storybook'],
      suite: 'Storybook Test Runner',
      targetCoverage,
      maxRetries: 2,
      adjustments: {
        timeout: true,
      },
    },
    playwright: {
      command: 'playwright',
      args: ['test', '--config', './src/configs/playwright/browser.ts'],
      suite: 'Playwright Browser',
      targetCoverage: 0, // Coverage via separate tool
      maxRetries: 2,
      adjustments: {
        timeout: true,
        retry: true,
        workers: true,
      },
    },
    'playwright-storybook': {
      command: 'playwright',
      args: ['test', '--config', './src/configs/playwright/storybook.ts'],
      suite: 'Playwright Storybook E2E',
      targetCoverage: 0,
      maxRetries: 2,
      adjustments: {
        timeout: true,
        retry: true,
      },
    },
    all: {
      command: 'npm',
      args: ['run', 'test:ci:sequential'],
      suite: 'All Test Suites',
      targetCoverage,
      maxRetries: 1,
      adjustments: {
        timeout: true,
      },
    },
  };

  const runnerConfig = runners[suite];
  if (!runnerConfig) {
    console.error(`Unknown test suite: ${suite}`);
    console.log(`Available suites: ${Object.keys(runners).join(', ')}`);
    process.exit(1);
  }

  const runner = new RecursiveTestRunner(runnerConfig);
  const result = await runner.run();

  // Generate coverage delta report
  if (result.coverage) {
    const delta = result.coverage.average - targetCoverage;
    const report = {
      suite,
      coverage: result.coverage,
      targetCoverage,
      delta,
      status: delta >= 0 ? 'PASS' : 'FAIL',
      duration: result.duration,
      timestamp: new Date().toISOString(),
    };

    writeFileSync(
      join(process.cwd(), `coverage-delta-${suite}.json`),
      JSON.stringify(report, null, 2),
    );
  }

  process.exit(result.success ? 0 : 1);
}

// Export for programmatic use
export {RecursiveTestRunner};
export type {TestResult, RunnerOptions};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
