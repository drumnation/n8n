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

// Ensure visual snapshots directory exists
const VISUAL_SNAPSHOTS_DIR = join(process.cwd(), "_errors", "visual-snapshots");
if (!existsSync(VISUAL_SNAPSHOTS_DIR)) {
  mkdirSync(VISUAL_SNAPSHOTS_DIR, { recursive: true });
}

// Run count tracking
const RUN_COUNT_FILE = getCountFilePath("visual");
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
  execSync(`curl -s http://localhost:${process.env.PORT || '3000'} > /dev/null 2>&1`);
  devServerRunning = true;
} catch {
  devServerRunning = false;
}

// Visual validation results
interface VisualValidationResult {
  page: string;
  path: string;
  status: "passed" | "failed";
  screenshot?: string;
  errors: string[];
  loadTime?: number;
  elements: {
    selector: string;
    found: boolean;
  }[];
}

const results: VisualValidationResult[] = [];

// Run visual validation script
console.log("🎨 Running visual validation with Playwright...");
let validationOutput = "";
let exitCode = 0;

try {
  // Run the visual validator script
  validationOutput = execSync(
    `tsx ${join(process.cwd(), "tooling/brain-monitor/src/tasks/visual-validator.ts")}`,
    {
      encoding: "utf-8",
      env: {
        ...process.env,
        VISUAL_SNAPSHOTS_DIR,
      },
    },
  );

  // Parse JSON output from the validator
  const jsonMatch = validationOutput.match(
    /JSON_OUTPUT_START(.*)JSON_OUTPUT_END/s,
  );
  if (jsonMatch && jsonMatch[1]) {
    const parsedResults = JSON.parse(jsonMatch[1].trim());
    results.push(...parsedResults);
  }
} catch (error: any) {
  validationOutput = error.stdout || "";
  exitCode = error.status || 1;

  // Try to parse partial results
  const jsonMatch = validationOutput.match(
    /JSON_OUTPUT_START(.*)JSON_OUTPUT_END/s,
  );
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsedResults = JSON.parse(jsonMatch[1].trim());
      results.push(...parsedResults);
    } catch {
      // Failed to parse JSON
    }
  }
}

// Count passed and failed
const passedCount = results.filter((r) => r.status === "passed").length;
const failedCount = results.filter((r) => r.status === "failed").length;
const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

// Generate markdown report
const markdownContent = `# 🎨 Visual Validation Report

[✓ Date compliance: All dates generated via command] **Last Updated:** ${currentDate}
**Run:** #${runCount} | **Branch:** ${branchName} | **Commit:** ${commitHash}
**Status:** ${failedCount === 0 ? "✅ All pages passed" : `❌ ${failedCount} pages failed`}
**Dev Server:** ${devServerRunning ? "🟢 Running" : "🔴 Not running"}

## 📊 Summary

- **Pages Tested:** ${results.length}
- **Passed:** ${passedCount}
- **Failed:** ${failedCount}
- **Total Errors:** ${totalErrors}

## 🔍 Page Results

${results
  .map((result) => {
    const icon = result.status === "passed" ? "✅" : "❌";
    const screenshotLink = result.screenshot
      ? `[View Screenshot](${result.screenshot.replace(process.cwd(), ".")})`
      : "No screenshot";

    return `### ${icon} ${result.page} (\`${result.path}\`)

- **Status:** ${result.status}
- **Load Time:** ${result.loadTime ? `${result.loadTime}ms` : "N/A"}
- **Screenshot:** ${screenshotLink}

#### Elements Checked:
${result.elements
  .map((el) => `- ${el.found ? "✓" : "✗"} \`${el.selector}\``)
  .join("\n")}

${
  result.errors.length > 0
    ? `#### Errors:
${result.errors.map((err) => `- ❌ ${err}`).join("\n")}`
    : ""
}
`;
  })
  .join("\n---\n\n")}

## 🤖 Agent Workflow Instructions

**FOR CLAUDE SUB-AGENTS:** Visual validation failures need investigation. Follow this workflow:

### 📋 Fixing Visual Issues:
1. **Check screenshots** in \`_errors/visual-snapshots/\`
2. **Review console errors** listed above
3. **Verify element selectors** match the current UI
4. **Fix any missing elements** or broken functionality
5. **Re-run:** \`pnpm brain:visual-validate\` to verify fixes

### 🚨 Common Issues:
- **Missing elements:** Component may not be rendering
- **Console errors:** JavaScript errors preventing UI from loading
- **Slow load times:** Performance issues or heavy operations
- **Dev server not running:** Start with \`pnpm dev\`

## ⚡ Quick Actions

- **Re-run validation:** \`pnpm brain:visual-validate\`
- **Start dev server:** \`pnpm dev\`
- **View screenshots:** \`ls -la _errors/visual-snapshots/\`
- **Clean old screenshots:** \`rm -rf _errors/visual-snapshots/*\`

---
*Updated automatically by visual validation script*
`;

// Write the markdown file
writeFileSync(getErrorReportPath("errors.visual-failures.md"), markdownContent);

console.log(`\n📊 Visual Validation Summary:`);
console.log(`- Pages tested: ${results.length}`);
console.log(`- Passed: ${passedCount}`);
console.log(`- Failed: ${failedCount}`);
console.log(`- Report: _errors/reports/errors.visual-failures.md`);
console.log(`- Screenshots: _errors/visual-snapshots/`);

// Exit with visual validation specific error code
process.exit(failedCount > 0 ? 3 : 0);
