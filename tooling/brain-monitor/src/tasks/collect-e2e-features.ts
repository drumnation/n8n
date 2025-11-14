#!/usr/bin/env tsx

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import {
  ensureDirectories,
  getCountFilePath,
  getErrorReportPath,
} from "../utils/paths.js";
import { join } from "path";

// Ensure directories exist
ensureDirectories();

// Run count tracking
const RUN_COUNT_FILE = getCountFilePath("e2e-features");
let runCount = 1;
try {
  runCount = parseInt(readFileSync(RUN_COUNT_FILE, "utf-8"), 10) + 1;
} catch {
  // File doesn't exist, start at 1
}
writeFileSync(RUN_COUNT_FILE, runCount.toString());

// Get current git info
let branchName = "unknown";
let commitHash = "unknown";
try {
  branchName = execSync("git branch --show-current", {
    encoding: "utf-8",
  }).trim();
  commitHash = execSync("git rev-parse --short HEAD", {
    encoding: "utf-8",
  }).trim();
} catch {
  // Git commands failed
}

// Get current date/time using date command
const currentDate = execSync('date +"%A, %B %d, %Y at %I:%M:%S %p"', {
  encoding: "utf-8",
}).trim();

// Check if dev server is running
let devServerRunning = false;
try {
  execSync("curl -s http://localhost:5173 > /dev/null 2>&1");
  devServerRunning = true;
} catch {
  devServerRunning = false;
}

// Run E2E feature tests
console.log("🎯 Running E2E feature tests with Playwright...");
let testOutput = "";
let exitCode = 0;
let jsonResults: any = null;

try {
  // Change to financial-ui directory and run playwright tests
  testOutput = execSync(
    `cd apps/financial-ui && npx playwright test e2e/accounts.spec.ts --reporter=json`,
    {
      encoding: "utf-8",
      env: {
        ...process.env,
        CI: "true",
      },
      shell: "/bin/sh",
    },
  );

  // Parse JSON output
  jsonResults = JSON.parse(testOutput);
} catch (error: any) {
  testOutput = error.stdout || "";
  exitCode = error.status || 1;

  // Try to parse JSON from error output
  try {
    jsonResults = JSON.parse(testOutput);
  } catch {
    // If JSON parsing fails, try to extract from error
    if (error.stdout) {
      try {
        jsonResults = JSON.parse(error.stdout);
      } catch {
        // Failed to parse JSON
      }
    }
  }
}

// Process results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;
let failedSpecs: any[] = [];

if (jsonResults && jsonResults.suites) {
  jsonResults.suites.forEach((suite: any) => {
    // Handle nested suites
    const processSpecs = (suiteData: any) => {
      if (suiteData.specs) {
        suiteData.specs.forEach((spec: any) => {
          // Check if test is skipped
          const isSkipped =
            spec.tests?.[0]?.status === "skipped" ||
            spec.tests?.[0]?.annotations?.some((a: any) => a.type === "skip");

          if (isSkipped) {
            skippedTests++;
          } else {
            totalTests++;
            if (spec.ok) {
              passedTests++;
            } else {
              failedTests++;
              const error =
                spec.tests?.[0]?.results?.[0]?.errors?.[1]?.message ||
                spec.tests?.[0]?.results?.[0]?.error?.message ||
                "Unknown error";
              failedSpecs.push({
                title: spec.title || "Unknown test",
                file: suite.file || "Unknown file",
                error: error,
              });
            }
          }
        });
      }

      // Process nested suites
      if (suiteData.suites) {
        suiteData.suites.forEach(processSpecs);
      }
    };

    processSpecs(suite);
  });
} else if (jsonResults && jsonResults.stats) {
  // Use stats if available
  totalTests =
    (jsonResults.stats.expected || 0) + (jsonResults.stats.unexpected || 0);
  passedTests = jsonResults.stats.expected || 0;
  failedTests = jsonResults.stats.unexpected || 0;
  skippedTests = jsonResults.stats.skipped || 0;
}

// Generate markdown report
const markdownContent = `# 🎯 E2E Feature Tests Report

[✓ Date compliance: All dates generated via command] **Last Updated:** ${currentDate}
**Run:** #${runCount} | **Branch:** ${branchName} | **Commit:** ${commitHash}
**Status:** ${failedTests === 0 ? "✅ All tests passed" : `❌ ${failedTests} tests failed`}
**Dev Server:** ${devServerRunning ? "🟢 Running on port 5173" : "🔴 Not running"}

## 📊 Summary

- **Total Tests:** ${totalTests}
- **Passed:** ${passedTests} ✅
- **Failed:** ${failedTests} ❌
- **Skipped:** ${skippedTests} ⏭️
- **Success Rate:** ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%

## 🔍 Test Results

### Account Management Features
${jsonResults ? generateTestResults(jsonResults) : "No test results available"}

${
  failedTests > 0
    ? `## ❌ Failed Tests

${failedSpecs
  .map(
    (spec, index) => `### ${index + 1}. ${spec.title}
**File:** \`${spec.file}\`
**Error:** 
\`\`\`
${spec.error}
\`\`\`
`,
  )
  .join("\n")}`
    : ""
}

## 🤖 Agent Workflow Instructions

**FOR CLAUDE SUB-AGENTS:** E2E test failures indicate broken functionality. Follow this workflow:

### 📋 Fixing E2E Test Failures:
1. **Read the error messages** - They often indicate the exact problem
2. **Check if the dev server is running** on port 5173
3. **Verify the test selectors** match the current UI
4. **Fix the underlying functionality** that's causing the test to fail
5. **Re-run tests:** \`npx playwright test apps/financial-ui/e2e/accounts.spec.ts\`

### 🚨 Common Issues:
- **Timeout errors:** Elements not appearing within expected time
- **Selector errors:** UI has changed and selectors need updating
- **Server not running:** Start with \`pnpm dev\`
- **API failures:** Check if backend is returning expected data

## ⚡ Quick Actions

- **Re-run E2E tests:** \`pnpm brain:e2e-features\`
- **Run specific test:** \`npx playwright test apps/financial-ui/e2e/accounts.spec.ts --grep "test name"\`
- **Debug mode:** \`npx playwright test --debug\`
- **UI mode:** \`npx playwright test --ui\`
- **Start dev server:** \`pnpm dev\`

---
*Updated automatically by E2E feature test runner*
`;

// Helper function to generate test results
function generateTestResults(results: any): string {
  if (!results.suites || results.suites.length === 0) {
    return "No test suites found";
  }

  const output: string[] = [];

  const processSpecs = (suiteData: any, indent: string = "") => {
    if (suiteData.title) {
      output.push(`${indent}**${suiteData.title}**`);
    }

    if (suiteData.specs) {
      suiteData.specs.forEach((spec: any) => {
        const isSkipped =
          spec.tests?.[0]?.status === "skipped" ||
          spec.tests?.[0]?.annotations?.some((a: any) => a.type === "skip");
        const icon = isSkipped ? "⏭️" : spec.ok ? "✅" : "❌";
        output.push(`${indent}- ${icon} ${spec.title || "Unknown test"}`);
      });
    }

    if (suiteData.suites) {
      suiteData.suites.forEach((nested: any) =>
        processSpecs(nested, indent + "  "),
      );
    }
  };

  results.suites.forEach((suite: any) => processSpecs(suite));

  return output.join("\n");
}

// Write the markdown file
writeFileSync(getErrorReportPath("errors.e2e-features.md"), markdownContent);

console.log(`\n📊 E2E Feature Test Summary:`);
console.log(`- Total tests: ${totalTests}`);
console.log(`- Passed: ${passedTests} ✅`);
console.log(`- Failed: ${failedTests} ❌`);
console.log(`- Skipped: ${skippedTests} ⏭️`);
console.log(`- Report: _errors/reports/errors.e2e-features.md`);

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
