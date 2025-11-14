import { execa } from 'execa';
import { readFile, access } from 'fs/promises';
import type { ValidationResult } from './types.js';

export async function validateSetup(): Promise<ValidationResult> {
  console.log('  Running pnpm install...');

  try {
    await execa('pnpm', ['install'], { stdio: 'inherit' });
  } catch (error) {
    console.warn('  Warning: pnpm install had issues');
  }

  console.log('  Running incremental validation...');

  // Run validations incrementally instead of all at once
  const validationSteps = [
    { name: 'typecheck', command: 'typecheck' },
    { name: 'lint', command: 'lint' },
    { name: 'format', command: 'format' },
    { name: 'test', command: 'test' },
  ];

  const errors: any[] = [];
  const warnings: any[] = [];
  const fixed: string[] = [];

  for (const step of validationSteps) {
    console.log(`  Validating: ${step.name}...`);

    try {
      await execa('pnpm', [step.command], { stdio: 'pipe' });
      console.log(`  ✓ ${step.name} passed`);
    } catch (error) {
      console.warn(`  ⚠️  ${step.name} failed, attempting fix...`);

      // Attempt auto-fix for fixable validations
      if (step.name === 'format') {
        try {
          await execa('pnpm', ['format', '--write'], { stdio: 'pipe' });
          fixed.push('format');
          console.log('    ✓ Format fixed');

          // Re-run validation
          await execa('pnpm', [step.command], { stdio: 'pipe' });
        } catch {
          errors.push({
            type: step.name,
            file: '',
            message: `${step.name} validation failed`,
          });
        }
      } else if (step.name === 'lint') {
        try {
          await execa('pnpm', ['lint', '--fix'], { stdio: 'pipe' });
          fixed.push('lint');
          console.log('    ✓ Lint fixed');

          // Re-run validation
          await execa('pnpm', [step.command], { stdio: 'pipe' });
        } catch {
          errors.push({
            type: step.name,
            file: '',
            message: `${step.name} validation failed after auto-fix`,
          });
        }
      } else {
        // Cannot auto-fix typecheck or test errors
        errors.push({
          type: step.name,
          file: '',
          message: `${step.name} validation failed`,
        });
      }
    }
  }

  // Read detailed validation summary if available
  const summaryDetails = await readValidationSummary();
  errors.push(...summaryDetails.errors);
  warnings.push(...summaryDetails.warnings);

  const success = errors.length === 0;
  const summary = success
    ? 'All validations passed'
    : `${errors.length} validation error(s) found - see _errors/ for details`;

  return {
    success,
    errors,
    warnings,
    autoFixed: fixed,
    summary,
  };
}

async function readValidationSummary(): Promise<{
  errors: any[];
  warnings: any[];
}> {
  try {
    await access('_errors/validation-summary.md');
    const content = await readFile('_errors/validation-summary.md', 'utf-8');

    // Parse markdown to extract errors (simplified)
    const errors: any[] = [];
    const warnings: any[] = [];

    // Look for error patterns
    const errorMatches = content.match(/❌.*$/gm);
    if (errorMatches) {
      errorMatches.forEach((match) => {
        errors.push({
          type: 'unknown',
          file: '',
          message: match,
        });
      });
    }

    // Look for warning patterns
    const warningMatches = content.match(/⚠️.*$/gm);
    if (warningMatches) {
      warningMatches.forEach((match) => {
        warnings.push({
          type: 'unknown',
          message: match,
        });
      });
    }

    return { errors, warnings };
  } catch {
    return { errors: [], warnings: [] };
  }
}
