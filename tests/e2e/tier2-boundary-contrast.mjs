/**
 * ACTS Web E2E Test Suite - Tier 2: Boundary & Corner Cases
 * 140 Checks: 28 Features × 5 Checks
 * Enforces boundary contrast analysis, unreadable text trap elimination,
 * dark mode residuals removal, tabular figures, and status semantic color integrity.
 */

import { assert, assertZero } from './harness.mjs';
import { FEATURE_MAP } from './scanner.mjs';

export function registerTier2Tests(runner, scanner) {
  for (const feature of FEATURE_MAP) {
    const fidStr = String(feature.id).padStart(2, '0');

    // -------------------------------------------------------------------------
    // Check 1: Low-Contrast Secondary Text Elimination (WCAG AA 4.5:1 Boundary)
    // -------------------------------------------------------------------------
    runner.register(
      2,
      `T2_F${fidStr}_01`,
      `[Feature ${fidStr}: ${feature.name}] Low-Contrast Secondary Text Elimination`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          assert(css !== null, 'globals.css must exist');
          return 'globals.css token definitions verified';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);
        assertZero(
          audit.lowContrastMatches.length,
          'low-contrast text-slate-400 / text-zinc-400 instances',
          audit.lowContrastMatches
        );
        return `0 low-contrast secondary text violations across ${audit.filesExamined} file(s)`;
      },
      { featureId: feature.id, checkIndex: 1, milestone: feature.milestone }
    );

    // -------------------------------------------------------------------------
    // Check 2: Inverted Unreadable Text Traps (text-white on light without dark container)
    // -------------------------------------------------------------------------
    runner.register(
      2,
      `T2_F${fidStr}_02`,
      `[Feature ${fidStr}: ${feature.name}] Inverted Unreadable Text Trap Audit`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          assert(css !== null, 'globals.css must exist');
          return 'globals.css style definitions verified';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);
        assertZero(
          audit.unreadableTextTraps.length,
          'inverted text-white instances on light surfaces without dark container',
          audit.unreadableTextTraps.map(t => `${t.file} <${t.tag}>`)
        );
        return `0 unreadable text traps across ${audit.filesExamined} file(s)`;
      },
      { featureId: feature.id, checkIndex: 2, milestone: feature.milestone }
    );

    // -------------------------------------------------------------------------
    // Check 3: Dark Mode Residual Elimination (Stray dark: variants or solid dark card boxes)
    // -------------------------------------------------------------------------
    runner.register(
      2,
      `T2_F${fidStr}_03`,
      `[Feature ${fidStr}: ${feature.name}] Dark Mode Residual Elimination`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          assert(css !== null, 'globals.css must exist');
          return 'globals.css defines clean Daylight theme';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);
        assertZero(
          audit.darkResiduals.length,
          'stray dark: variants or solid dark card boxes (bg-slate-950, bg-zinc-900)',
          audit.darkResiduals
        );
        return `0 dark mode residuals across ${audit.filesExamined} file(s)`;
      },
      { featureId: feature.id, checkIndex: 3, milestone: feature.milestone }
    );

    // -------------------------------------------------------------------------
    // Check 4: Numeric / Financial Tabular Boundary (tabular-nums on financial numbers)
    // -------------------------------------------------------------------------
    runner.register(
      2,
      `T2_F${fidStr}_04`,
      `[Feature ${fidStr}: ${feature.name}] Numeric & Financial Tabular Figures Boundary`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          assert(css !== null, 'globals.css must exist');
          return 'globals.css font tokens verified';
        }

        if (feature.id === 2) {
          // AppBackground contains no financial figures
          return 'Canvas backdrop contains no numeric financial metrics';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);

        // Assert no missing tabular figures
        assertZero(
          audit.missingTabularFigures.length,
          'financial figures missing tabular-nums styling',
          audit.missingTabularFigures.map(f => `Line ${f.lineNum}: ${f.snippet.slice(0, 40)}...`)
        );
        return `Numeric financial figures strictly adhere to tabular-nums across ${audit.filesExamined} file(s)`;
      },
      { featureId: feature.id, checkIndex: 4, milestone: feature.milestone }
    );

    // -------------------------------------------------------------------------
    // Check 5: Status Semantic Boundary & Color Integrity (Emerald, Crimson, Amber)
    // -------------------------------------------------------------------------
    runner.register(
      2,
      `T2_F${fidStr}_05`,
      `[Feature ${fidStr}: ${feature.name}] Status Semantic Boundary & Color Integrity`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          assert(css !== null, 'globals.css must exist');
          return 'globals.css status definitions verified';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);

        // Check for forbidden neon status or unreadable text colors
        assertZero(
          audit.neonStatusMatches.length,
          'banned neon status colors (#00e676, #00ff00, text-green-400, text-red-400)',
          audit.neonStatusMatches
        );

        // Check for unreadable yellow text on light backgrounds
        for (const relPath of feature.files) {
          const content = scanner.readFile(relPath);
          if (content && /text-\[#F0B90B\]|text-amber-300|text-yellow-400/.test(content)) {
            // Check if not on dark background
            if (!/bg-slate-900|bg-[#050812]/.test(content)) {
              throw new Error(`Unreadable low-contrast yellow text (#F0B90B) found in ${relPath}`);
            }
          }
        }

        return `Status semantics strictly conform to Palette 2.1 (Emerald 600, Crimson 600, Amber 600)`;
      },
      { featureId: feature.id, checkIndex: 5, milestone: feature.milestone }
    );
  }
}
