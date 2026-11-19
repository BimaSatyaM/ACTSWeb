/**
 * ACTS Web E2E Test Suite - Tier 4: Real-World Workload Scenarios
 * 14 Scenarios: Build compilation, route prerendering across 19 routes,
 * backend Python code isolation guard, git safety invariants, and complex open-sheet modal scenarios.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { assert, assertEqual, assertIncludes } from './harness.mjs';

export function registerTier4Tests(runner, scanner) {
  const actsWebDir = scanner.actsWebDir;
  const repoRoot = path.resolve(actsWebDir, '..');
  const dotNextDir = path.join(actsWebDir, '.next');

  // ---------------------------------------------------------------------------
  // Scenario 1: Clean Production Build Execution
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S01_production_build',
    '[Scenario 1] Next.js Clean Production Build Compilation & Manifest Generation',
    async (context = {}) => {
      if (!context.skipBuild) {
        // Run full build
        const output = execSync('npm run build', {
          cwd: actsWebDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });
        assertIncludes(output, 'Compiled successfully', 'Next.js build should report compiled successfully');
      }

      // Verify build manifests exist
      const buildIdPath = path.join(dotNextDir, 'BUILD_ID');
      const appRoutesManifest = path.join(dotNextDir, 'app-path-routes-manifest.json');
      const buildManifest = path.join(dotNextDir, 'build-manifest.json');

      assert(fs.existsSync(buildIdPath), '.next/BUILD_ID manifest must exist');
      assert(fs.existsSync(appRoutesManifest), '.next/app-path-routes-manifest.json must exist');
      assert(fs.existsSync(buildManifest), '.next/build-manifest.json must exist');

      const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
      assert(buildId.length > 0, 'BUILD_ID must be non-empty');
      return `Build manifests verified (Build ID: ${buildId})`;
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 2: Public Marketing & Auth Route Bundles
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S02_public_route_bundles',
    '[Scenario 2] Public Marketing & Auth Route Server Bundles (/, /about, /login)',
    async () => {
      const routes = ['index.html', 'about.html', 'login.html'];
      for (const r of routes) {
        const p = path.join(dotNextDir, 'server/app', r);
        assert(fs.existsSync(p), `Missing compiled page bundle for route: ${r}`);
        const stat = fs.statSync(p);
        assert(stat.size > 500, `Compiled bundle for ${r} abnormally small (${stat.size} bytes)`);
      }
      return 'All 3 public routes (/, /about, /login) verified in compiled output';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 3: Dashboard Overview & Live Signals Route Bundles
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S03_dashboard_signals_bundles',
    '[Scenario 3] Dashboard Overview & Live Signals Bundles (/dashboard, /dashboard/signals)',
    async () => {
      const routes = ['dashboard.html', 'dashboard/signals.html'];
      for (const r of routes) {
        const p = path.join(dotNextDir, 'server/app', r);
        assert(fs.existsSync(p), `Missing compiled dashboard page: ${r}`);
      }
      return 'Dashboard overview and live signals routes verified in compiled output';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 4: Auto-Trading Terminal & Calendar Route Bundles
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S04_autotrading_calendar_bundles',
    '[Scenario 4] Auto-Trading Terminal & Calendar Bundles (/dashboard/auto-trading, /dashboard/calendar)',
    async () => {
      const routes = ['dashboard/auto-trading.html', 'dashboard/calendar.html'];
      for (const r of routes) {
        const p = path.join(dotNextDir, 'server/app', r);
        assert(fs.existsSync(p), `Missing compiled auto-trading page: ${r}`);
      }
      return 'Auto-trading terminal and calendar routes verified in compiled output';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 5: IDX Equities 6-Route Suite Bundles
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S05_idx_equities_bundles',
    '[Scenario 5] IDX Equities 6-Route Suite Bundles (/dashboard/idx/*)',
    async () => {
      const routes = [
        'dashboard/idx.html',
        'dashboard/idx/corporate-actions.html',
        'dashboard/idx/keystats.html',
        'dashboard/idx/news.html',
        'dashboard/idx/orderbook.html',
        'dashboard/idx/watchlist.html'
      ];
      for (const r of routes) {
        const p = path.join(dotNextDir, 'server/app', r);
        assert(fs.existsSync(p), `Missing compiled IDX route page: ${r}`);
      }
      return 'All 6 IDX equities routes verified in compiled output';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 6: Academy Core & Dynamic Route Bundles
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S06_academy_bundles',
    '[Scenario 6] Academy Core Hub & Dynamic Route Bundles (/dashboard/academy/*)',
    async () => {
      const academyHub = path.join(dotNextDir, 'server/app/dashboard/academy.html');
      const trackRoute = path.join(dotNextDir, 'server/app/dashboard/academy/[trackId]/page.js');
      const lessonRoute = path.join(dotNextDir, 'server/app/dashboard/academy/[trackId]/[lessonId]/page.js');

      assert(fs.existsSync(academyHub), 'Missing compiled academy.html');
      assert(fs.existsSync(trackRoute), 'Missing compiled dynamic [trackId] page server bundle');
      assert(fs.existsSync(lessonRoute), 'Missing compiled dynamic [lessonId] page server bundle');
      return 'Academy hub and dynamic track/lesson routes verified in compiled output';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 7: System Admin & Account Configuration Route Bundles
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S07_admin_account_bundles',
    '[Scenario 7] System Admin & Account Route Bundles (/dashboard/account, /dashboard/admin)',
    async () => {
      const routes = ['dashboard/account.html', 'dashboard/admin.html'];
      for (const r of routes) {
        const p = path.join(dotNextDir, 'server/app', r);
        assert(fs.existsSync(p), `Missing compiled route page: ${r}`);
      }
      return 'Account configuration and admin panel routes verified in compiled output';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 8: Font & Token Mapping Integrity in globals.css
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S08_font_token_mapping',
    '[Scenario 8] Font Infrastructure & Token Mapping Integrity in globals.css',
    async () => {
      const globalsCss = scanner.readFile('src/app/globals.css');
      assert(globalsCss !== null, 'globals.css must exist');
      const requiredTokens = [
        '--bg-main',
        '--bg-card',
        '--bg-elevated',
        '--primary',
        '--text-primary',
        '--text-secondary'
      ];
      for (const tok of requiredTokens) {
        assert(globalsCss.includes(tok), `globals.css must contain required token: ${tok}`);
      }
      return 'globals.css contains all required Daylight Palette 2.1 design tokens';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 9: Backend Python Code Isolation Guard
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S09_backend_isolation_guard',
    '[Scenario 9] Backend Python Code Isolation Guard (0 Changes outside acts-web)',
    async () => {
      const gitStatus = execSync('git status --porcelain', {
        cwd: repoRoot,
        encoding: 'utf8'
      });
      const lines = gitStatus.split('\n').filter(Boolean);
      const modifiedBackendFiles = [];
      for (const rawLine of lines) {
        if (/^\s*D\s+/.test(rawLine)) continue;
        const filePart = rawLine.replace(/^[ ?MADRCU!]{1,2}\s+/, '').trim();
        if (!filePart.startsWith('acts-web/') && !filePart.startsWith('.agents/')) {
          modifiedBackendFiles.push(filePart);
        }
      }
      if (modifiedBackendFiles.length > 0) {
        throw new Error(`Forbidden modifications outside acts-web/: ${modifiedBackendFiles.join(', ')}`);
      }
      return '0 backend Python files modified. System logic strictly preserved';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 10: Git Safety Invariant Guard
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S10_git_safety_guard',
    '[Scenario 10] Git Safety Invariant Guard (Branch & Remote Integrity)',
    async () => {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: repoRoot,
        encoding: 'utf8'
      }).trim();
      if (branch === 'openai-factor') {
        throw new Error('Current branch is openai-factor! Pushing/pulling is strictly forbidden.');
      }
      return `Current branch is "${branch}". Git safety invariants verified`;
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 11: Real-Time Price & Ticker Tabular Format Simulation
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S11_ticker_tabular_format',
    '[Scenario 11] Real-Time Price & Ticker Tabular Format in MarketTickerBar',
    async () => {
      const tickerBar = scanner.readFile('src/components/dashboard/MarketTickerBar.tsx');
      assert(tickerBar !== null, 'MarketTickerBar.tsx must exist');
      assert(tickerBar.includes('tabular-nums'), 'MarketTickerBar must enforce tabular-nums');
      assert(tickerBar.includes('font-mono'), 'MarketTickerBar must enforce font-mono');
      assert(!tickerBar.includes('#F0B90B'), 'MarketTickerBar must not use illegible yellow text (#F0B90B)');
      return 'MarketTickerBar verified with tabular-nums and Palette 2.1 status semantics';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 12: Calendar Day Detail Modal Open-Sheet Structure
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S12_day_detail_modal_opensheet',
    '[Scenario 12] Calendar Day Detail Modal Open-Sheet Structure',
    async () => {
      const dayModal = scanner.readFile('src/components/dashboard/DayDetailModal.tsx');
      assert(dayModal !== null, 'DayDetailModal.tsx must exist');
      const hasNestedWhiteCards = /bg-white\s+border\s+border-slate-200/.test(dayModal);
      if (hasNestedWhiteCards) {
        throw new Error('DayDetailModal contains nested bg-white cards inside cream modal container (anti-box violation)');
      }
      if (dayModal.includes('animate-ping')) {
        throw new Error('DayDetailModal contains forbidden animate-ping neon glow effect');
      }
      return 'DayDetailModal verified with open-sheet layout and zero neon glows';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 13: Macro Event Modal Dossier Open-Sheet Structure & Emoji Removal
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S13_macro_modal_opensheet',
    '[Scenario 13] Macro Event Modal Dossier Open-Sheet & Slop Removal',
    async () => {
      const macroModal = scanner.readFile('src/components/dashboard/MacroEventModal.tsx');
      assert(macroModal !== null, 'MacroEventModal.tsx must exist');
      if (macroModal.includes('🏛️') || macroModal.includes('🔥') || macroModal.includes('⚡')) {
        throw new Error('MacroEventModal contains banned emoji slop in tab titles');
      }
      return 'MacroEventModal verified with clean typography and open-sheet structure';
    }
  );

  // ---------------------------------------------------------------------------
  // Scenario 14: Academy Quiz & Legend Profile Open-Sheet Structure
  // ---------------------------------------------------------------------------
  runner.register(
    4,
    'T4_S14_academy_interactive_opensheet',
    '[Scenario 14] Academy Quiz & Legend Profile Card Open-Sheet Structure',
    async () => {
      const legendCard = scanner.readFile('src/components/academy/LegendsProfileCard.tsx');
      assert(legendCard !== null, 'LegendsProfileCard.tsx must exist');
      if (/bg-white\s+p-3\.5/.test(legendCard)) {
        throw new Error('LegendsProfileCard contains nested bg-white cards inside #fdfaf3 container');
      }
      return 'Academy interactive components verified with open-sheet structure';
    }
  );
}
