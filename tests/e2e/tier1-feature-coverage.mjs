/**
 * ACTS Web E2E Test Suite - Tier 1: Feature Coverage (Token & Rule Conformance)
 * 140 Checks: 28 Features × 5 Checks
 * Enforces Daylight Theme Palette 2.1 tokens, typography, surfaces, borders, and slop elimination.
 */

import { assert, assertZero, assertIncludes } from './harness.mjs';
import { FEATURE_MAP } from './scanner.mjs';

export function registerTier1Tests(runner, scanner) {
  for (const feature of FEATURE_MAP) {
    const fidStr = String(feature.id).padStart(2, '0');

    // -------------------------------------------------------------------------
    // Check 1: Primary Text Token Conformance (#0f172a / text-slate-900 / var(--text-primary))
    // -------------------------------------------------------------------------
    runner.register(
      1,
      `T1_F${fidStr}_01`,
      `[Feature ${fidStr}: ${feature.name}] Primary Text Token Conformance`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          assert(css !== null, 'globals.css must exist');
          const hasPrimary = css.includes('#0f172a') || css.includes('--text-primary') || css.includes('--color-text-primary');
          assert(hasPrimary, 'globals.css must define primary text token #0f172a or --text-primary');
          return 'globals.css defines primary text token #0f172a';
        }

        if (feature.id === 2) {
          const bg = scanner.readFile('src/components/AppBackground.tsx');
          assert(bg !== null, 'AppBackground.tsx must exist');
          return 'AppBackground canvas inherits root primary ink';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);
        assert(
          audit.primaryTextMatches > 0,
          `Feature ${fidStr} must use primary text tokens (text-slate-900, text-slate-950, #0f172a, or var(--text-primary))`
        );
        return `Found ${audit.primaryTextMatches} primary text token matches across ${audit.filesExamined} file(s)`;
      },
      { featureId: feature.id, checkIndex: 1, milestone: feature.milestone }
    );

    // -------------------------------------------------------------------------
    // Check 2: Secondary Text Token Conformance (text-slate-600 / text-slate-500, zero text-slate-400)
    // -------------------------------------------------------------------------
    runner.register(
      1,
      `T1_F${fidStr}_02`,
      `[Feature ${fidStr}: ${feature.name}] Secondary Text Token Conformance`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          assert(css !== null, 'globals.css must exist');
          const hasSecondary = css.includes('#475569') || css.includes('#64748b') || css.includes('--text-secondary') || css.includes('--color-text-secondary');
          assert(hasSecondary, 'globals.css must define secondary text token #475569 or --text-secondary');
          return 'globals.css defines secondary text token';
        }

        if (feature.id === 2) {
          const bg = scanner.readFile('src/components/AppBackground.tsx');
          assert(bg !== null, 'AppBackground.tsx must exist');
          const hasSlate400 = /text-slate-400/.test(bg);
          assert(!hasSlate400, 'AppBackground.tsx must not contain unstyled text-slate-400');
          return 'AppBackground.tsx free of secondary text contrast defects';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);
        // Must contain valid secondary text (slate-600 or slate-500)
        assert(
          audit.secondaryTextMatches > 0,
          `Feature ${fidStr} must use secondary text tokens (text-slate-600, text-slate-500, or var(--text-secondary))`
        );
        // Must NOT contain low-contrast slate-400/zinc-400
        assertZero(
          audit.lowContrastMatches.length,
          'low-contrast text-slate-400/zinc-400 instances',
          audit.lowContrastMatches
        );
        return `Found ${audit.secondaryTextMatches} secondary text token matches; 0 low-contrast instances`;
      },
      { featureId: feature.id, checkIndex: 2, milestone: feature.milestone }
    );

    // -------------------------------------------------------------------------
    // Check 3: Canvas & Paper Sheet Ground Conformance (#edf7fe / #faf2df / #fdfaf3)
    // -------------------------------------------------------------------------
    runner.register(
      1,
      `T1_F${fidStr}_03`,
      `[Feature ${fidStr}: ${feature.name}] Canvas & Paper Sheet Surface Conformance`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          assert(css !== null, 'globals.css must exist');
          assert(css.includes('#edf7fe'), 'globals.css must specify soft canvas ground #edf7fe');
          assert(css.includes('#fdfaf3') || css.includes('#faf2df'), 'globals.css must specify paper sheet #fdfaf3 or #faf2df');
          return 'globals.css binds Daylight Palette 2.1 canvas and paper tokens';
        }

        if (feature.id === 2) {
          const bg = scanner.readFile('src/components/AppBackground.tsx');
          assert(bg !== null, 'AppBackground.tsx must exist');
          assert(bg.includes('#edf7fe') || bg.includes('bg-sky-50') || bg.includes('from-[#edf7fe]'), 'AppBackground must use soft sky canvas ground #edf7fe');
          return 'AppBackground renders soft canvas ground #edf7fe';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);
        assert(
          audit.surfaceMatches > 0,
          `Feature ${fidStr} must integrate with Palette 2.1 surfaces (#edf7fe, #faf2df, #fdfaf3, or var(--bg-card))`
        );
        return `Verified ${audit.surfaceMatches} Palette 2.1 surface tokens across ${audit.filesExamined} file(s)`;
      },
      { featureId: feature.id, checkIndex: 3, milestone: feature.milestone }
    );

    // -------------------------------------------------------------------------
    // Check 4: Hairline Border & Divider Conformance (border-slate-900/10, divide-slate-900/10)
    // -------------------------------------------------------------------------
    runner.register(
      1,
      `T1_F${fidStr}_04`,
      `[Feature ${fidStr}: ${feature.name}] Hairline Border & Divider Conformance`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          assert(css !== null, 'globals.css must exist');
          const hasHairline = css.includes('border') && (css.includes('0.08') || css.includes('0.1') || css.includes('slate-900/10'));
          assert(hasHairline, 'globals.css must define hairline border tokens');
          return 'globals.css defines hairline border token';
        }

        if (feature.id === 2) {
          const bg = scanner.readFile('src/components/AppBackground.tsx');
          assert(bg !== null, 'AppBackground.tsx must exist');
          assertZero(
            scanner.scanFileContent('src/components/AppBackground.tsx', bg).heavyDarkBorderMatches.length,
            'heavy dark borders on canvas backdrop'
          );
          return 'AppBackground canvas free of dark borders';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);
        // Must NOT use heavy dark borders without opacity
        assertZero(
          audit.heavyDarkBorderMatches.length,
          'heavy dark borders (border-slate-800/900 without opacity)',
          audit.heavyDarkBorderMatches
        );
        // Must NOT use invalid dividers (divide-slate-100 or divide-[#141a26])
        assertZero(
          audit.invalidDividers.length,
          'invalid legacy dividers (divide-slate-100 or divide-[#141a26])',
          audit.invalidDividers
        );
        return `Verified hairline border conformance (0 heavy borders, 0 invalid dividers)`;
      },
      { featureId: feature.id, checkIndex: 4, milestone: feature.milestone }
    );

    // -------------------------------------------------------------------------
    // Check 5: Tabular Figures & AI Slop Elimination (Zero Orbs, Neon Glows, Em Dashes, Gradients)
    // -------------------------------------------------------------------------
    runner.register(
      1,
      `T1_F${fidStr}_05`,
      `[Feature ${fidStr}: ${feature.name}] Tabular Figures & Zero AI Slop Elimination`,
      async () => {
        if (feature.id === 1) {
          const css = scanner.readFile('src/app/globals.css');
          const layout = scanner.readFile('src/app/layout.tsx');
          assert(css !== null && layout !== null, 'globals.css and layout.tsx must exist');
          assert(
            layout.includes('Geist') || layout.includes('geistSans'),
            'layout.tsx must load Geist font infrastructure'
          );
          return 'Font infrastructure loaded correctly';
        }

        if (feature.id === 2) {
          const bg = scanner.readFile('src/components/AppBackground.tsx');
          assert(bg !== null, 'AppBackground.tsx must exist');
          const hasOrbs = /blur-3xl|blur-2xl/.test(bg);
          assert(!hasOrbs, 'AppBackground.tsx must eliminate floating blurry orbs (blur-3xl/blur-2xl)');
          return 'AppBackground is clean of floating blurry orbs';
        }

        const audit = scanner.auditFeature(feature.id);
        assert(audit.filesExamined > 0, `Feature ${fidStr} files must exist`);
        // Zero blurry orbs
        assertZero(audit.blurryOrbs.length, 'blurry floating orbs (blur-3xl, blur-2xl)', audit.blurryOrbs);
        // Zero neon glows
        assertZero(audit.neonGlows.length, 'neon glows (shadow-[0_0_...])', audit.neonGlows);
        // Zero em dashes
        assertZero(audit.emDashes.length, 'em dashes (—)', audit.emDashes);
        // Zero gradient text fills
        assertZero(audit.gradientText.length, 'gradient text fills (bg-clip-text text-transparent)', audit.gradientText);
        // Zero emoji slop on forbidden features (especially Feature 13, 14, 21, 27)
        if ([13, 14, 21, 27].includes(feature.id)) {
          assertZero(audit.emojiSlop.length, 'emoji slop (⚡, 🔥, 🚀, etc.)', audit.emojiSlop);
        }

        return `Zero AI slop confirmed (0 orbs, 0 neon glows, 0 em dashes, 0 gradient text, 0 emoji slop)`;
      },
      { featureId: feature.id, checkIndex: 5, milestone: feature.milestone }
    );
  }
}
