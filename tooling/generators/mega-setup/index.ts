#!/usr/bin/env node
import { runDiscovery } from './discovery.js';
import { generatePRD } from './prd-generator.js';
import { runGenerators } from './generator-orchestrator.js';
import { updateDocumentation } from './documentation-updater.js';
import { recommendRules } from './rules-recommender.js';
import { validateSetup } from './validation-runner.js';
import { generateSummary } from './summary-generator.js';
import type { ProjectConfig } from './types.js';

export async function megaSetup(): Promise<void> {
  console.log('🚀 Brain Garden Mega Setup');
  console.log('==========================\n');

  try {
    // Phase 1: Discovery
    console.log('📋 Phase 1: Project Discovery');
    console.log('─────────────────────────────');
    const config = await runDiscovery();
    console.log(
      `\n  ✓ Project configuration complete: ${config.name}\n`,
    );

    // Phase 2: PRD Generation
    console.log('📝 Phase 2: Generating PRD');
    console.log('─────────────────────────────');
    await generatePRD(config);
    console.log('');

    // Phase 3: Code Generation
    console.log('⚙️  Phase 3: Generating Apps & Packages');
    console.log('─────────────────────────────────────');
    const generatedApps = await runGenerators(config);
    const successCount = generatedApps.filter((a) => a.success).length;
    console.log(
      `\n  ✓ Generated ${successCount}/${generatedApps.length} apps/packages\n`,
    );

    // Phase 4: Documentation
    console.log('📚 Phase 4: Updating Documentation');
    console.log('─────────────────────────────────');
    await updateDocumentation(config, generatedApps);
    console.log('');

    // Phase 5: Rules Recommendation
    console.log('🎯 Phase 5: Recommending Rules');
    console.log('─────────────────────────────');
    const rules = await recommendRules(config);
    console.log('');

    // Phase 6: Validation
    console.log('✅ Phase 6: Validating Setup');
    console.log('─────────────────────────────');
    const validation = await validateSetup();
    console.log(
      `\n  ${validation.success ? '✓' : '⚠️'} ${validation.summary}\n`,
    );

    // Phase 7: Summary
    console.log('📊 Phase 7: Generating Summary');
    console.log('─────────────────────────────');
    await generateSummary(config, { generatedApps, rules, validation });

    console.log(
      '\n✨ Setup complete! Review SETUP_SUMMARY.md for next steps.\n',
    );
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.error('\nPlease check the error above and try again.\n');
    process.exit(1);
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  megaSetup().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for programmatic usage
export { megaSetup as default };
export type { ProjectConfig } from './types.js';
