import { TaskResult, ValidationTask } from "../types.js";
import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { existsSync } from "fs";

const execAsync = promisify(exec);

export const name = "e2e-features";

const task: ValidationTask = {
  name: "E2E Features",
  script: "e2e-features",
  emoji: "🎭",
  outputFile: "errors.e2e-features.md",
};

export async function validate(): Promise<TaskResult> {
  const startTime = Date.now();

  try {
    // Check if Playwright is installed
    const playwrightPath = join(
      process.cwd(),
      "node_modules",
      "@playwright",
      "test",
    );
    if (!existsSync(playwrightPath)) {
      return {
        task,
        success: false,
        duration: Date.now() - startTime,
        errorCount: 1,
      };
    }

    // Run specific feature tests
    const { stdout, stderr } = await execAsync(
      "npx playwright test apps/financial-ui/e2e/accounts.spec.ts --reporter=json",
      {
        cwd: process.cwd(),
        env: { ...process.env, CI: "true" },
      },
    );

    // Parse test results
    const results = JSON.parse(stdout);
    const totalTests = results.suites.reduce(
      (acc: number, suite: any) => acc + suite.specs.length,
      0,
    );
    const passedTests = results.suites.reduce(
      (acc: number, suite: any) =>
        acc + suite.specs.filter((spec: any) => spec.ok).length,
      0,
    );
    const failedTests = totalTests - passedTests;

    if (failedTests > 0) {
      return {
        task,
        success: false,
        duration: Date.now() - startTime,
        errorCount: failedTests,
      };
    }

    return {
      task,
      success: true,
      duration: Date.now() - startTime,
      errorCount: 0,
    };
  } catch (error: any) {
    // Check if it's just test failures
    if (error.code === 1 && error.stdout) {
      try {
        const results = JSON.parse(error.stdout);
        const totalTests =
          results.suites?.reduce(
            (acc: number, suite: any) => acc + suite.specs.length,
            0,
          ) || 0;
        const passedTests =
          results.suites?.reduce(
            (acc: number, suite: any) =>
              acc + suite.specs.filter((spec: any) => spec.ok).length,
            0,
          ) || 0;
        const failedTests = totalTests - passedTests;

        return {
          task,
          success: false,
          duration: Date.now() - startTime,
          errorCount: failedTests,
        };
      } catch (parseError) {
        // Fall through to general error handling
      }
    }

    return {
      task,
      success: false,
      duration: Date.now() - startTime,
      errorCount: 1,
    };
  }
}

export async function collect(): Promise<any> {
  const result = await validate();

  return {
    name: "E2E Feature Tests",
    status: result.success ? "success" : "failure",
    duration: result.duration,
    timestamp: new Date().toISOString(),
    errorCount: result.errorCount,
  };
}
