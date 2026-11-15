#!/usr/bin/env node
/**
 * ACTS Web E2E Test Suite Runner CLI
 *
 * Usage:
 *   node scripts/run-e2e-tests.mjs [options]
 *
 * Options:
 *   --tier=1|2|3|4|all    Run a specific test tier (default: all)
 *   --skip-build          Skip full Next.js production build during Tier 4 checks
 *   --format=spec|tap     Output format: 'spec' (default) or 'tap' (TAP 13)
 *   --json                Output results as JSON object
 *   --feature=ID          Filter tests by feature ID (1 to 28)
 *   --help, -h            Show this help message
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TestRunner } from '../tests/e2e/harness.mjs';
import { Scanner } from '../tests/e2e/scanner.mjs';
import { registerTier1Tests } from '../tests/e2e/tier1-feature-coverage.mjs';
import { registerTier2Tests } from '../tests/e2e/tier2-boundary-contrast.mjs';
import { registerTier3Tests } from '../tests/e2e/tier3-anti-box-nesting.mjs';
import { registerTier4Tests } from '../tests/e2e/tier4-build-scenarios.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const actsWebDir = path.resolve(__dirname, '..');

function parseArgs(args) {
  const options = {
    tier: 'all',
    skipBuild: false,
    format: 'spec',
    json: false,
    feature: null,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--tier' || arg.startsWith('--tier=')) {
      const val = arg.startsWith('--tier=') ? arg.slice(7) : '';
      if (!['1', '2', '3', '4', 'all'].includes(val)) {
        console.error(`Error: Invalid --tier value: "${val}". Must be one of: 1, 2, 3, 4, all`);
        process.exit(1);
      }
      options.tier = val;
    } else if (arg === '--skip-build') {
      options.skipBuild = true;
    } else if (arg === '--format' || arg.startsWith('--format=')) {
      const val = arg.startsWith('--format=') ? arg.slice(9) : '';
      if (!['spec', 'tap'].includes(val)) {
        console.error(`Error: Invalid --format value: "${val}". Must be one of: spec, tap`);
        process.exit(1);
      }
      options.format = val;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--tap') {
      options.format = 'tap';
    } else if (arg === '--feature' || arg.startsWith('--feature=')) {
      const val = arg.startsWith('--feature=') ? arg.slice(10) : '';
      const num = Number(val);
      if (!val || !/^\d+$/.test(val) || !Number.isInteger(num) || num < 1 || num > 28) {
        console.error(`Error: Invalid --feature value: "${val}". Must be an integer between 1 and 28`);
        process.exit(1);
      }
      options.feature = num;
    } else {
      console.error(`Error: Unrecognized option: "${arg}"`);
      process.exit(1);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
ACTS Web E2E Test Suite Runner

Usage:
  node scripts/run-e2e-tests.mjs [options]
  npm run test:e2e -- [options]

Options:
  --tier=1|2|3|4|all    Run a specific test tier (default: all)
                        Tier 1: Feature Coverage (Token & Rule Conformance, 140 checks)
                        Tier 2: Boundary & Corner Cases (Contrast & Tabular, 140 checks)
                        Tier 3: Cross-Feature Combinations & Anti-Box Mandate (28 checks)
                        Tier 4: Real-World Workload Scenarios & Build Integrity (14 checks)
  --skip-build          Skip full 'npm run build' execution during Tier 4 (verifies cache)
  --format=spec|tap     Output reporter format (spec: human-readable, tap: TAP 13)
  --json                Output results as structured JSON
  --feature=ID          Filter tests by feature ID (1 to 28)
  --help, -h            Show this help message
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const scanner = new Scanner(actsWebDir);
  const runner = new TestRunner(options);

  // Register all 4 test tiers (total 322 automated checks)
  registerTier1Tests(runner, scanner);
  registerTier2Tests(runner, scanner);
  registerTier3Tests(runner, scanner);
  registerTier4Tests(runner, scanner);

  // Execute test suite
  await runner.run();

  // Print report
  const allPassed = runner.printReport();

  // Exit with standard Unix status code
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
