/**
 * ACTS Web E2E Test Suite - Tier 3: Anti-Box Architecture & Layout Mandate
 * 28 Checks: Pairwise Combinations & Layout Nesting Audits
 * Enforces Anti-Box card-in-card elimination, pill-in-pill elimination, hairline dividers,
 * and open canvas layout integration across all 28 features.
 */

import { assert, assertZero } from './harness.mjs';
import { FEATURE_MAP } from './scanner.mjs';

export function registerTier3Tests(runner, scanner) {
  // ---------------------------------------------------------------------------
  // T3-01 (Feature 1): Font Canvas Binding & Zero Artificial Framing
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_01_font_canvas_binding',
    '[F01: Fonts & Tokens] Zero Artificial Box Framing in Global Styles',
    async () => {
      const css = scanner.readFile('src/app/globals.css');
      assert(css !== null, 'globals.css must exist');
      assert(css.includes('--bg-main: #edf7fe'), 'globals.css must bind canvas --bg-main to #edf7fe');
      assert(css.includes('--bg-card: #fdfaf3'), 'globals.css must bind paper sheet --bg-card to #fdfaf3');
      return 'globals.css binds root canvas and paper tokens without artificial wrapper';
    },
    { featureId: 1 }
  );

  // ---------------------------------------------------------------------------
  // T3-02 (Feature 2): Canvas Backdrop De-Orb & Flat Canvas Architecture
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_02_canvas_backdrop_deorb',
    '[F02: AppBackground] Flat Open Canvas Architecture (0 Orbs, 0 Box Borders)',
    async () => {
      const bg = scanner.readFile('src/components/AppBackground.tsx');
      assert(bg !== null, 'AppBackground.tsx must exist');
      const hasOrbs = /blur-3xl|blur-2xl/.test(bg);
      assert(!hasOrbs, 'AppBackground.tsx must eliminate floating blurry orbs');
      return 'AppBackground verified as clean flat canvas';
    },
    { featureId: 2 }
  );

  // ---------------------------------------------------------------------------
  // T3-03 (Feature 3): Global Chrome Polish Hairline Integration
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_03_chrome_hairline_integration',
    '[F03: Global Chrome] Navbar, Sidebar & Ticker Hairline Divider Integration',
    async () => {
      const audit = scanner.auditFeature(3);
      assertZero(audit.nestedCards.length, 'nested card boxes in chrome elements', audit.nestedCards);
      assertZero(audit.nestedPills.length, 'nested pill badges in chrome elements', audit.nestedPills);
      return 'Global chrome elements use open hairline integration without nested boxes';
    },
    { featureId: 3 }
  );

  // ---------------------------------------------------------------------------
  // T3-04 (Feature 4): Shared Brand & UI Primitives Unboxed Structure
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_04_primitives_unboxed_structure',
    '[F04: Primitives] Single-Tier Elevation & Zero Nested Pills in UI Primitives',
    async () => {
      const audit = scanner.auditFeature(4);
      assertZero(audit.nestedPills.length, 'nested pills inside Badge / StatusPill', audit.nestedPills);
      assertZero(audit.nestedCards.length, 'nested card boxes inside GlassCard', audit.nestedCards);
      return 'Shared UI primitives strictly adhere to single-tier elevation and unboxed structure';
    },
    { featureId: 4 }
  );

  // ---------------------------------------------------------------------------
  // T3-05 (Feature 5): Gating & Notification Chrome Unboxed Structure
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_05_gating_notification_unboxed',
    '[F05: Gating & Notifications] Zero Nested Cards in Popover and Gating',
    async () => {
      const audit = scanner.auditFeature(5);
      assertZero(audit.nestedCards.length, 'nested bg-white cards inside gating sheets', audit.nestedCards);
      return 'Gating and Notification popover unboxed into clean open sheets';
    },
    { featureId: 5 }
  );

  // ---------------------------------------------------------------------------
  // T3-06 (Feature 6): Landing Page Canvas Layout
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_06_landing_page_canvas_layout',
    '[F06: Landing Page] Open Canvas Layout & Single-Tier Paper Sheets',
    async () => {
      const audit = scanner.auditFeature(6);
      assertZero(audit.nestedCards.length, 'nested card-in-card containers on landing page', audit.nestedCards);
      return 'Landing page integrates directly with canvas using hairline dividers';
    },
    { featureId: 6 }
  );

  // ---------------------------------------------------------------------------
  // T3-07 (Feature 7): About & Quant Spec Columns
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_07_about_quant_spec_columns',
    '[F07: About Spec] 3-Agent Quant Flow Open Canvas Integration',
    async () => {
      const audit = scanner.auditFeature(7);
      assertZero(audit.nestedCards.length, 'nested card boxes in Quant Spec pillars', audit.nestedCards);
      return 'About & Quant Spec view renders open columns with hairline dividers';
    },
    { featureId: 7 }
  );

  // ---------------------------------------------------------------------------
  // T3-08 (Feature 8): Login Auth Sheet Single-Tier
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_08_login_auth_sheet_singletier',
    '[F08: Login Sheet] Single-Tier Paper Elevation with Unboxed Secondary Actions',
    async () => {
      const audit = scanner.auditFeature(8);
      assertZero(audit.nestedCards.length, 'nested cards inside login sheet', audit.nestedCards);
      return 'Login authentication card sits flat on canvas without nested containers';
    },
    { featureId: 8 }
  );

  // ---------------------------------------------------------------------------
  // T3-09 (Feature 9): Account Configuration Sheet Open
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_09_account_config_sheet_open',
    '[F09: Account Sheet] Unboxed Account Configuration & Profile Sheet',
    async () => {
      const audit = scanner.auditFeature(9);
      assertZero(audit.nestedCards.length, 'nested cards in account settings', audit.nestedCards);
      return 'Account settings view structured with open single-tier sheets';
    },
    { featureId: 9 }
  );

  // ---------------------------------------------------------------------------
  // T3-10 (Feature 10): Admin Panel Open Table
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_10_admin_panel_open_table',
    '[F10: Admin Panel] Open Table Layout with Divide-y Hairline Partitioning',
    async () => {
      const audit = scanner.auditFeature(10);
      assertZero(audit.nestedCards.length, 'nested card wrappers in admin token table', audit.nestedCards);
      return 'Admin token table renders cleanly with divide-slate-900/10 hairline dividers';
    },
    { featureId: 10 }
  );

  // ---------------------------------------------------------------------------
  // T3-11 (Feature 11): Dashboard Overview Shell
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_11_dashboard_overview_shell',
    '[F11: Dashboard Shell] Unboxed Widget Integration on Open Canvas',
    async () => {
      const audit = scanner.auditFeature(11);
      assertZero(audit.nestedCards.length, 'nested card-in-card wrappers in dashboard overview', audit.nestedCards);
      return 'Dashboard overview widgets integrate cleanly on open #edf7fe canvas';
    },
    { featureId: 11 }
  );

  // ---------------------------------------------------------------------------
  // T3-12 (Feature 12): Signals Deck Open Feed
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_12_signals_deck_open_feed',
    '[F12: Signals Deck] Open Signal Stream with Left-Border Status Accents',
    async () => {
      const audit = scanner.auditFeature(12);
      assertZero(audit.nestedCards.length, 'nested card-in-card wrappers in signals stream', audit.nestedCards);
      return 'Signals deck renders open list items with left-border accents';
    },
    { featureId: 12 }
  );

  // ---------------------------------------------------------------------------
  // T3-13 (Feature 13): Multi-Tier Progress Tracker Unboxed Nodes
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_13_progress_tracker_unboxed_nodes',
    '[F13: Progress Tracker] Unboxed Timeline Milestones (0 Nested Pill Badges)',
    async () => {
      const audit = scanner.auditFeature(13);
      assertZero(audit.nestedPills.length, 'nested pill-in-pill badges in progress tracker', audit.nestedPills);
      return 'Multi-tier progress tracker uses unboxed milestone nodes';
    },
    { featureId: 13 }
  );

  // ---------------------------------------------------------------------------
  // T3-14 (Feature 14): Macro News Modal Unboxed Dossier
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_14_macro_news_modal_unboxed',
    '[F14: Macro Dossier] Unboxed Metric Shelf & Articles in MacroEventModal',
    async () => {
      const modal = scanner.readFile('src/components/dashboard/MacroEventModal.tsx');
      assert(modal !== null, 'MacroEventModal.tsx must exist');
      const hasNestedCards = /bg-white\s+rounded-xl/.test(modal) || /bg-white\s+p-/.test(modal);
      assert(!hasNestedCards, 'MacroEventModal must eliminate nested bg-white cards inside modal sheet');
      return 'MacroEventModal dossier unboxed into hairline divider lists';
    },
    { featureId: 14 }
  );

  // ---------------------------------------------------------------------------
  // T3-15 (Feature 15): Auto-Trading Terminal Composite
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_15_autotrading_terminal_composite',
    '[F15: Auto-Trading Terminal] Open Hairline Partitions across Metrics & Tables',
    async () => {
      const audit = scanner.auditFeature(15);
      assertZero(audit.nestedCards.length, 'nested card-in-card containers in auto-trading terminal', audit.nestedCards);
      return 'Auto-trading terminal metrics and orderbook use open hairline partitions';
    },
    { featureId: 15 }
  );

  // ---------------------------------------------------------------------------
  // T3-16 (Feature 16): Auto-Trading Calendar Cells Flat Layout
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_16_autotrading_calendar_cells',
    '[F16: Auto-Trading Calendar] Flat Day Cells without Box Containers',
    async () => {
      const audit = scanner.auditFeature(16);
      assertZero(audit.nestedCards.length, 'nested card boxes in calendar day cells', audit.nestedCards);
      return 'Auto-trading execution calendar day cells sit flat on paper sheet';
    },
    { featureId: 16 }
  );

  // ---------------------------------------------------------------------------
  // T3-17 (Feature 17): Progression Chart Unboxed SVG
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_17_progression_chart_unboxed_svg',
    '[F17: Progression Chart] Unboxed SVG Chart Container (0 Nested Boxes, 0 Drop Shadows)',
    async () => {
      const audit = scanner.auditFeature(17);
      assertZero(audit.nestedCards.length, 'nested card box around SVG chart', audit.nestedCards);
      return 'Progression chart renders clean SVG curve without nested box wrappers';
    },
    { featureId: 17 }
  );

  // ---------------------------------------------------------------------------
  // T3-18 (Feature 18): Journal Calendar Grid Flat Integration
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_18_journal_calendar_grid',
    '[F18: Journal Calendar] Month Grid Flat Integration on Warm Cream Sheet',
    async () => {
      const audit = scanner.auditFeature(18);
      assertZero(audit.nestedCards.length, 'nested cards in journal calendar grid', audit.nestedCards);
      return 'Journal calendar month grid sits cleanly on cream sheet with hairline borders';
    },
    { featureId: 18 }
  );

  // ---------------------------------------------------------------------------
  // T3-19 (Feature 19): Calendar Day Detail Modal Open-Sheet Structure
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_19_calendar_day_detail_modal',
    '[F19: Day Detail Modal] Unboxed Signal Items with Divide-y & Left-Border Accents',
    async () => {
      const modal = scanner.readFile('src/components/dashboard/DayDetailModal.tsx');
      assert(modal !== null, 'DayDetailModal.tsx must exist');
      const hasNestedCards = /bg-white\s+border\s+border-slate-200/.test(modal) || /bg-white\s+p-/.test(modal);
      assert(!hasNestedCards, 'DayDetailModal must eliminate nested bg-white cards inside cream modal container');
      return 'DayDetailModal signal items unboxed into open list with divide-y and left-border accents';
    },
    { featureId: 19 }
  );

  // ---------------------------------------------------------------------------
  // T3-20 (Feature 20): IDX Fundamental Key Stats Unboxed Sheets
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_20_idx_fundamental_keystats',
    '[F20: IDX Key Stats] Unboxed 4 Fundamental Metric Cards from bg-white into #faf2df Sheets',
    async () => {
      const keyStats = scanner.readFile('src/components/dashboard/idx/IDXKeyStatsCard.tsx');
      assert(keyStats !== null, 'IDXKeyStatsCard.tsx must exist');
      const hasNestedWhite = /bg-white\s+border\s+border-slate-200/.test(keyStats);
      assert(!hasNestedWhite, 'IDXKeyStatsCard fundamental cards must not use nested bg-white boxes');
      return 'IDX fundamental metric cards unboxed into Palette 2.1 sheets';
    },
    { featureId: 20 }
  );

  // ---------------------------------------------------------------------------
  // T3-21 (Feature 21): IDX Corporate Actions Unboxed Counters
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_21_idx_corporate_actions_unboxed',
    '[F21: IDX Corporate Actions] Elimination of Pill-in-Pill Counters and Nested Boxes',
    async () => {
      const audit = scanner.auditFeature(21);
      assertZero(audit.nestedPills.length, 'pill-in-pill counters in corporate actions tabs', audit.nestedPills);
      assertZero(audit.nestedCards.length, 'nested card boxes in corporate actions', audit.nestedCards);
      return 'IDX Corporate Actions tab counters unboxed into clean typographic pairings';
    },
    { featureId: 21 }
  );

  // ---------------------------------------------------------------------------
  // T3-22 (Feature 22): IDX Watchlist & Order Book Mesh
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_22_idx_watchlist_orderbook_mesh',
    '[F22: IDX Order Book & Watchlist] Open Mesh Integration with Hairline Dividers',
    async () => {
      const audit = scanner.auditFeature(22);
      assertZero(audit.nestedCards.length, 'nested card boxes in watchlist or orderbook', audit.nestedCards);
      return 'IDX Watchlist and Order Book integrate seamlessly with hairline dividers';
    },
    { featureId: 22 }
  );

  // ---------------------------------------------------------------------------
  // T3-23 (Feature 23): IDX Market Clock Typographic Pairing
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_23_idx_market_clock_typographic',
    '[F23: IDX Market Clock] Unboxed Session Status and Timezone Pills into Clean Typography',
    async () => {
      const audit = scanner.auditFeature(23);
      assertZero(audit.nestedPills.length, 'nested pill-in-pill structures in market clock', audit.nestedPills);
      return 'IDX Market Clock renders unboxed typographic time and session status';
    },
    { featureId: 23 }
  );

  // ---------------------------------------------------------------------------
  // T3-24 (Feature 24): Academy Track Navigation
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_24_academy_track_navigation',
    '[F24: Academy Navigation] Single-Tier Track Cards and Module Lists',
    async () => {
      const audit = scanner.auditFeature(24);
      assertZero(audit.nestedCards.length, 'nested card containers in academy navigation', audit.nestedCards);
      return 'Academy track cards and module list use hairline dividers rather than nested boxes';
    },
    { featureId: 24 }
  );

  // ---------------------------------------------------------------------------
  // T3-25 (Feature 25): Academy Visuals 44 Mini-Cards Elimination
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_25_academy_visuals_44_minicards',
    '[F25: Academy Visuals] Elimination of 44 Nested bg-white Mini-Cards in LessonVisuals',
    async () => {
      const visuals = scanner.readFile('src/components/academy/LessonVisuals.tsx');
      assert(visuals !== null, 'LessonVisuals.tsx must exist');
      const whiteCardMatches = [...visuals.matchAll(/(?:^|[\s"'`])bg-white(?![a-zA-Z0-9_\/])/g)];
      assert(
        whiteCardMatches.length === 0,
        `LessonVisuals.tsx must eliminate all nested bg-white mini-cards (found ${whiteCardMatches.length})`
      );
      return 'LessonVisuals.tsx eliminated all 44 nested bg-white mini-cards in favor of open hairline layouts';
    },
    { featureId: 25 }
  );

  // ---------------------------------------------------------------------------
  // T3-26 (Feature 26): Academy Legends Quiz Unboxed
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_26_academy_legends_quiz_unboxed',
    '[F26: Legends & Quiz] Unboxed Operating Principles & Quiz Options',
    async () => {
      const legend = scanner.readFile('src/components/academy/LegendsProfileCard.tsx');
      assert(legend !== null, 'LegendsProfileCard.tsx must exist');
      const hasNestedCards = /bg-white\s+p-/.test(legend);
      assert(!hasNestedCards, 'LegendsProfileCard operating principles must not use nested bg-white card boxes');
      return 'Legends profile card and quiz options render without nested card boxes';
    },
    { featureId: 26 }
  );

  // ---------------------------------------------------------------------------
  // T3-27 (Feature 27): Academy Modals & Simulator
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_27_academy_modals_simulator',
    '[F27: Academy Simulator] Open-Sheet Toolbar & Modal Dialogs',
    async () => {
      const audit = scanner.auditFeature(27);
      assertZero(audit.nestedCards.length, 'nested card boxes in simulator or academy modals', audit.nestedCards);
      return 'Academy modals and chart simulator unboxed into clean open sheets';
    },
    { featureId: 27 }
  );

  // ---------------------------------------------------------------------------
  // T3-28 (Feature 28): Cross-Route Canvas Integration
  // ---------------------------------------------------------------------------
  runner.register(
    3,
    'T3_28_cross_route_canvas_integration',
    '[F28: Route Integration] Seamless #edf7fe Canvas Integration across All 19 Routes',
    async () => {
      const layout = scanner.readFile('src/app/layout.tsx');
      assert(layout !== null, 'src/app/layout.tsx must exist');
      assert(
        layout.includes('bg-[#edf7fe]') || layout.includes('AppBackground'),
        'src/app/layout.tsx must render clean Daylight canvas background'
      );
      return 'All 19 routes integrate with open #edf7fe canvas without outer boxed frames';
    },
    { featureId: 28 }
  );
}
