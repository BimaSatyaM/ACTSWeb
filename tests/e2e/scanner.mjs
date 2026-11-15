/**
 * ACTS Web E2E Scanner Engine
 * High-performance AST analysis and token-splitting scanner for Daylight Palette 2.1 & Anti-Box Mandate.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultActsWebDir = path.resolve(__dirname, '../..');

const require = createRequire(path.join(defaultActsWebDir, 'package.json'));
let ts = null;
try {
  ts = require('typescript');
} catch (e) {
  // Fallback to global or node resolution if needed
}

export const FEATURE_MAP = [
  { id: 1, name: 'Font Infrastructure & Token Binding', milestone: 'M1', files: ['src/app/globals.css', 'src/app/layout.tsx'] },
  { id: 2, name: 'Canvas & Background De-Orb', milestone: 'M1', files: ['src/components/AppBackground.tsx'] },
  { id: 3, name: 'Global Chrome Polish', milestone: 'M1', files: ['src/components/Navbar.tsx', 'src/components/dashboard/DashboardSidebar.tsx', 'src/components/dashboard/MarketTickerBar.tsx'] },
  { id: 4, name: 'Shared Brand & UI Primitives', milestone: 'M1', files: ['src/components/ui/BinanceLogo.tsx', 'src/components/ui/IDXLogo.tsx', 'src/components/ui/AssetIcon.tsx', 'src/components/ui/StatusPill.tsx', 'src/components/ui/Badge.tsx', 'src/components/ui/UserAvatar.tsx', 'src/components/ui/GlassCard.tsx', 'src/components/ui/Button.tsx'] },
  { id: 5, name: 'Gating & Notification Chrome', milestone: 'M1', files: ['src/components/dashboard/DashboardGating.tsx', 'src/components/NotificationPopover.tsx'] },
  { id: 6, name: 'Landing Page Revamp', milestone: 'M2', files: ['src/app/page.tsx'] },
  { id: 7, name: 'About & Quant Spec Revamp', milestone: 'M2', files: ['src/app/about/page.tsx'] },
  { id: 8, name: 'Login / Auth Sheet Revamp', milestone: 'M2', files: ['src/app/login/page.tsx'] },
  { id: 9, name: 'Account Configuration Sheet', milestone: 'M2', files: ['src/app/dashboard/account/page.tsx'] },
  { id: 10, name: 'Admin Panel Sheet', milestone: 'M2', files: ['src/app/dashboard/admin/page.tsx'] },
  { id: 11, name: 'Dashboard Overview Shell', milestone: 'M3', files: ['src/app/dashboard/page.tsx', 'src/components/dashboard/TradingViewChart.tsx', 'src/components/dashboard/LivePriceCard.tsx', 'src/components/dashboard/PerformanceCurveCard.tsx', 'src/components/dashboard/UpcomingFedCard.tsx'] },
  { id: 12, name: 'Live Signals Deck', milestone: 'M3', files: ['src/app/dashboard/signals/page.tsx'] },
  { id: 13, name: 'Multi-Tier Progress Tracker', milestone: 'M3', files: ['src/components/dashboard/MultiTierProgressTracker.tsx'] },
  { id: 14, name: 'Macro News Feed & Event Dossier', milestone: 'M3', files: ['src/app/dashboard/news/page.tsx', 'src/components/dashboard/MacroEventModal.tsx'] },
  { id: 15, name: 'Modern Auto-Trading Terminal', milestone: 'M4', files: ['src/app/dashboard/auto-trading/page.tsx', 'src/components/dashboard/autotrading/ModernAutoTradingTerminal.tsx'] },
  { id: 16, name: 'Auto-Trading Performance Calendar', milestone: 'M4', files: ['src/components/dashboard/autotrading/AutoTradingPerformanceCalendar.tsx'] },
  { id: 17, name: 'Auto-Trading Progression Chart', milestone: 'M4', files: ['src/components/dashboard/autotrading/AutoTradingProgressionChart.tsx'] },
  { id: 18, name: 'Journal Performance Calendar', milestone: 'M4', files: ['src/app/dashboard/calendar/page.tsx', 'src/components/dashboard/CalendarGrid.tsx'] },
  { id: 19, name: 'Calendar Day Detail Modal', milestone: 'M4', files: ['src/components/dashboard/DayDetailModal.tsx'] },
  { id: 20, name: 'IDX Overview & Key Stats', milestone: 'M5', files: ['src/app/dashboard/idx/page.tsx', 'src/components/dashboard/idx/IDXKeyStatsCard.tsx', 'src/components/dashboard/idx/IDXCompositeBanner.tsx', 'src/components/dashboard/idx/IDXPeerComparison.tsx'] },
  { id: 21, name: 'IDX Corporate Actions & e-IPO', milestone: 'M5', files: ['src/app/dashboard/idx/corporate-actions/page.tsx', 'src/app/dashboard/idx/ipo/page.tsx', 'src/components/dashboard/idx/IDXCorporateActionsCard.tsx', 'src/components/dashboard/idx/IDXIPOCard.tsx'] },
  { id: 22, name: 'IDX Watchlist, Order Book & Radar', milestone: 'M5', files: ['src/app/dashboard/idx/watchlist/page.tsx', 'src/app/dashboard/idx/orderbook/page.tsx', 'src/app/dashboard/idx/news/page.tsx', 'src/components/dashboard/idx/IDXWatchlistTable.tsx', 'src/components/dashboard/idx/IDXOrderBook.tsx', 'src/components/dashboard/idx/IDXConglomerateRadar.tsx', 'src/components/dashboard/idx/IDXNewsFeed.tsx', 'src/components/dashboard/idx/IDXDisclosuresCard.tsx', 'src/components/dashboard/idx/IDXRunningTradeTape.tsx'] },
  { id: 23, name: 'IDX Market Clock', milestone: 'M5', files: ['src/components/dashboard/idx/IDXMarketClock.tsx'] },
  { id: 24, name: 'Academy Core & Track Navigation', milestone: 'M6', files: ['src/app/dashboard/academy/page.tsx', 'src/app/dashboard/academy/[trackId]/page.tsx', 'src/app/dashboard/academy/[trackId]/[lessonId]/page.tsx'] },
  { id: 25, name: 'Academy Visuals & Mini-Cards', milestone: 'M6', files: ['src/components/academy/LessonVisuals.tsx'] },
  { id: 26, name: 'Academy Profile Cards & Quizzes', milestone: 'M6', files: ['src/components/academy/LegendsProfileCard.tsx', 'src/components/academy/LessonQuiz.tsx'] },
  { id: 27, name: 'Academy Modals & Simulator', milestone: 'M6', files: ['src/components/academy/MacroEventEmbed.tsx', 'src/components/academy/AcademyUnlockModal.tsx', 'src/components/academy/ChartSimulator.tsx', 'src/components/academy/EducationalDisclaimer.tsx', 'src/components/academy/EsmaLossBanner.tsx'] },
  { id: 28, name: 'Comprehensive E2E Verification & Build Integrity', milestone: 'M7', files: ['src/app/globals.css', 'src/app/layout.tsx', 'src/app/dashboard/layout.tsx', 'src/app/dashboard/idx/layout.tsx'] }
];

export class Scanner {
  constructor(actsWebDir = defaultActsWebDir) {
    this.actsWebDir = actsWebDir;
  }

  resolvePath(relPath) {
    return path.resolve(this.actsWebDir, relPath);
  }

  fileExists(relPath) {
    return fs.existsSync(this.resolvePath(relPath));
  }

  readFile(relPath) {
    const fullPath = this.resolvePath(relPath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf8');
  }

  extractClassTokens(node, sf) {
    if (!ts || (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node))) return [];
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    for (const prop of opening.attributes.properties) {
      if (ts.isJsxAttribute(prop) && prop.name.getText(sf) === 'className') {
        if (prop.initializer) {
          if (ts.isStringLiteral(prop.initializer)) {
            return prop.initializer.text.split(/[\s`"'$]+/).filter(Boolean);
          }
          if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
            const text = prop.initializer.expression.getText(sf);
            return text.split(/[\s`"'${}?:]+/).filter(Boolean);
          }
        }
      }
    }
    return [];
  }

  scanJsxAst(relPath, content) {
    const fullPath = this.resolvePath(relPath);
    const astResults = {
      unreadableTextTraps: [],
      nestedCards: [],
      nestedPills: [],
      openSheets: []
    };

    if (!ts || (!relPath.endsWith('.tsx') && !relPath.endsWith('.jsx'))) {
      return astResults;
    }

    const sf = ts.createSourceFile(fullPath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    const walk = (node, ancestors = []) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const opening = ts.isJsxElement(node) ? node.openingElement : node;
        const tagName = opening.tagName.getText(sf);
        const tokens = this.extractClassTokens(node, sf);
        const baseTokens = tokens.map(t => t.split('/')[0]);

        const isSolidDark = baseTokens.some(t =>
          ['bg-[#0369a1]', 'bg-[#0284c7]', 'bg-sky-600', 'bg-sky-700', 'bg-emerald-600', 'bg-emerald-700', 'bg-rose-600', 'bg-rose-700', 'bg-slate-900', 'bg-slate-950', 'bg-[#050812]', 'bg-black'].includes(t)
        );
        const hasDarkAncestor = ancestors.some(a => a.isSolidDark);

        // Tier 2 Check 2: Unreadable Text Trap (text-white on light surfaces without dark container)
        const hasLightText = baseTokens.some(t => ['text-white', 'text-zinc-100', 'text-slate-100', 'text-gray-100'].includes(t));
        if (hasLightText && !isSolidDark && !hasDarkAncestor) {
          astResults.unreadableTextTraps.push({ tag: tagName, tokens, file: relPath });
        }

        // Tier 3: Nested Pills (pill badge inside pill badge, excluding progress bar tracks)
        const isPill = tokens.includes('rounded-full');
        const isProgressBar = tokens.some(t => /^h-(?:1|1\.5|2|2\.5|3|3\.5|4)$/.test(t)) && (tokens.includes('rounded-full') || tokens.includes('overflow-hidden'));
        const hasPillAncestor = ancestors.some(a => a.tokens.includes('rounded-full') && !a.isProgressBar);
        if (isPill && hasPillAncestor && !isProgressBar) {
          astResults.nestedPills.push({ tag: tagName, tokens, file: relPath });
        }

        // Tier 3: Nested Cards (bg-white or bg-slate-50 inside cream sheet bg-[#faf2df]/bg-[#fdfaf3] or GlassCard)
        const isCream = baseTokens.some(t => ['bg-[#faf2df]', 'bg-[#fdfaf3]', 'bg-cream'].includes(t)) || tagName === 'GlassCard';
        const isWhiteCard = baseTokens.some(t => ['bg-white', 'bg-slate-50', 'bg-zinc-50'].includes(t)) || (tagName === 'GlassCard' && ancestors.some(a => a.isCream));
        const hasCreamAncestor = ancestors.some(a => a.isCream);
        if (isWhiteCard && hasCreamAncestor) {
          astResults.nestedCards.push({ tag: tagName, tokens, file: relPath });
        }

        const current = { tagName, tokens, isSolidDark, isCream, isProgressBar };
        const nextAncestors = [...ancestors, current];

        ts.forEachChild(node, child => walk(child, nextAncestors));
        return;
      }
      ts.forEachChild(node, child => walk(child, ancestors));
    };

    walk(sf);
    return astResults;
  }

  scanFileContent(relPath, content) {
    const lines = content.split('\n');

    // 1. Primary Text Token Check (#0f172a, text-slate-900, text-slate-950, var(--text-primary))
    const primaryTextMatches = [
      ...content.matchAll(/(?:^|[\s"'`])text-(?:slate-900|slate-950|\[#0f172a\])(?![a-zA-Z0-9_\/])/g),
      ...content.matchAll(/var\(--(?:color-)?text-primary\)/g),
      ...content.matchAll(/#0f172a/g)
    ];

    // 2. Secondary Text Token Check (text-slate-600, text-slate-500, #475569, #64748b, var(--text-secondary))
    const secondaryTextMatches = [
      ...content.matchAll(/(?:^|[\s"'`])text-(?:slate-600|slate-500|\[#475569\]|\[#64748b\])(?![a-zA-Z0-9_\/])/g),
      ...content.matchAll(/var\(--(?:color-)?text-secondary\)/g)
    ];

    // 3. Low-Contrast Secondary Text Violations (< 4.5:1 WCAG: text-slate-400, text-zinc-400, text-gray-400)
    const lowContrastMatches = [
      ...content.matchAll(/(?:^|[\s"'`])text-(?:slate|zinc|gray|neutral|stone)-400(?![a-zA-Z0-9_\/])/g)
    ].map(m => m[0].trim());

    // 4. Canvas Ground & Paper Sheet Tokens (#edf7fe, #faf2df, #fdfaf3, #f3ead2, var(--bg-main), var(--bg-card))
    const surfaceMatches = [
      ...content.matchAll(/(?:^|[\s"'`])bg-(?:\[#edf7fe\]|\[#faf2df\]|\[#fdfaf3\]|\[#f3ead2\]|cream)(?![a-zA-Z0-9_\/])/g),
      ...content.matchAll(/#(?:edf7fe|faf2df|fdfaf3|f3ead2)/gi),
      ...content.matchAll(/var\(--bg-(?:main|card|elevated)\)/g)
    ];

    // 5. Hairline Borders & Dividers (border-slate-900/10, border-slate-900/15, divide-slate-900/10, var(--border))
    const hairlineBorderMatches = [
      ...content.matchAll(/(?:border|divide)-(?:slate-900\/10|slate-900\/15|slate-900\/8|slate-900\/5|slate-900\/20)/g),
      ...content.matchAll(/rgba\(15,\s*23,\s*42,\s*0\.08\)/g),
      ...content.matchAll(/var\(--border\)/g)
    ];

    // 6. Heavy / Dark Borders (border-slate-800, border-slate-900 without opacity slash)
    const heavyDarkBorderMatches = [
      ...content.matchAll(/(?:^|[\s"'`])border-(?:slate-800|slate-900|slate-950|zinc-800|zinc-900)(?![a-zA-Z0-9_\/])/g)
    ].map(m => m[0].trim());

    // 7. Invalid Dividers (divide-slate-100, divide-[#141a26])
    const invalidDividers = [
      ...content.matchAll(/\bdivide-(?:slate-100|\[#141a26\])\b/g)
    ].map(m => m[0].trim());

    // 8. Dark Mode Residuals (stray dark: variants or solid dark background cards)
    const darkVariants = [...content.matchAll(/\bdark:[a-zA-Z0-9_\-\/\[\]#:]+/g)].map(m => m[0]);
    const solidDarkCards = [
      ...content.matchAll(/(?:^|[\s"'`])bg-(?:slate-950|zinc-900|zinc-950|\[#050812\]|\[#121215\])(?![a-zA-Z0-9_\/])/g)
    ].map(m => m[0].trim());

    // 9. Status Semantic Violations (neon green #00e676, #00ff00, text-green-400, text-red-400, yellow #F0B90B on text)
    const neonStatusMatches = [
      ...content.matchAll(/(?:#00e676|#00ff00|\btext-green-400\b|\btext-red-400\b)/gi)
    ].map(m => m[0]);

    // 10. AI Slop: Blurry Orbs (blur-3xl, blur-2xl)
    const blurryOrbs = [
      ...content.matchAll(/\bblur-(?:3xl|2xl)\b/g)
    ].map(m => m[0]);

    // 11. AI Slop: Neon Glows & Artificial Box Shadows (shadow-[0_0_8px...], drop-shadow-[0_0_...)
    const neonGlows = [
      ...content.matchAll(/(?:shadow|drop-shadow)-\[0_0_[0-9]+px/g)
    ].map(m => m[0]);

    // 12. AI Slop: Em Dashes (— or \u2014)
    const emDashes = [
      ...content.matchAll(/[—\u2014]/g)
    ].map(m => m[0]);

    // 13. AI Slop: Gradient Text fills (bg-clip-text text-transparent)
    const gradientText = [
      ...content.matchAll(/bg-clip-text\s+text-transparent|text-transparent\s+bg-clip-text/g)
    ].map(m => m[0]);

    // 14. AI Slop: Emojis (⚡, 🔥, 🚀, 🏛, 💰, etc.)
    const emojiSlop = [
      ...content.matchAll(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}⚡🔥🚀🏛💰]/gu)
    ].map(m => m[0]).filter(m => !['✕', '✓', '✔', '✖'].includes(m));

    // 15. Financial Numeric Tabular Boundary Analysis
    let missingTabularFigures = [];
    lines.forEach((line, idx) => {
      // If line contains financial numeric variables or formatters
      if (
        /\$\{[^}]*(?:price|balance|pnl|return|change|volume|amount|rate|rMultiple|winRate)[^}]*\}/i.test(line) ||
        /(?:formatPrice|formatCurrency|formatPercent|formatNumber)\([^)]+\)/i.test(line)
      ) {
        const ctx = lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 3)).join(' ');
        if (!ctx.includes('tabular-nums')) {
          missingTabularFigures.push({ lineNum: idx + 1, snippet: line.trim() });
        }
      }
    });

    return {
      primaryTextMatches: primaryTextMatches.length,
      secondaryTextMatches: secondaryTextMatches.length,
      lowContrastMatches,
      surfaceMatches: surfaceMatches.length,
      hairlineBorderMatches: hairlineBorderMatches.length,
      heavyDarkBorderMatches,
      invalidDividers,
      darkResiduals: [...darkVariants, ...solidDarkCards],
      neonStatusMatches,
      blurryOrbs,
      neonGlows,
      emDashes,
      gradientText,
      emojiSlop,
      missingTabularFigures
    };
  }

  auditFeature(featureId) {
    const feature = FEATURE_MAP.find(f => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature ID ${featureId} not found in FEATURE_MAP`);
    }

    const summary = {
      feature,
      filesExamined: 0,
      missingFiles: [],
      totalLines: 0,
      primaryTextMatches: 0,
      secondaryTextMatches: 0,
      lowContrastMatches: [],
      surfaceMatches: 0,
      hairlineBorderMatches: 0,
      heavyDarkBorderMatches: [],
      invalidDividers: [],
      darkResiduals: [],
      neonStatusMatches: [],
      blurryOrbs: [],
      neonGlows: [],
      emDashes: [],
      gradientText: [],
      emojiSlop: [],
      missingTabularFigures: [],
      unreadableTextTraps: [],
      nestedCards: [],
      nestedPills: []
    };

    for (const relPath of feature.files) {
      const content = this.readFile(relPath);
      if (content === null) {
        summary.missingFiles.push(relPath);
        continue;
      }
      summary.filesExamined++;
      summary.totalLines += content.split('\n').length;

      const contentAnalysis = this.scanFileContent(relPath, content);
      summary.primaryTextMatches += contentAnalysis.primaryTextMatches;
      summary.secondaryTextMatches += contentAnalysis.secondaryTextMatches;
      summary.lowContrastMatches.push(...contentAnalysis.lowContrastMatches);
      summary.surfaceMatches += contentAnalysis.surfaceMatches;
      summary.hairlineBorderMatches += contentAnalysis.hairlineBorderMatches;
      summary.heavyDarkBorderMatches.push(...contentAnalysis.heavyDarkBorderMatches);
      summary.invalidDividers.push(...contentAnalysis.invalidDividers);
      summary.darkResiduals.push(...contentAnalysis.darkResiduals);
      summary.neonStatusMatches.push(...contentAnalysis.neonStatusMatches);
      summary.blurryOrbs.push(...contentAnalysis.blurryOrbs);
      summary.neonGlows.push(...contentAnalysis.neonGlows);
      summary.emDashes.push(...contentAnalysis.emDashes);
      summary.gradientText.push(...contentAnalysis.gradientText);
      summary.emojiSlop.push(...contentAnalysis.emojiSlop);
      summary.missingTabularFigures.push(...contentAnalysis.missingTabularFigures);

      const astAnalysis = this.scanJsxAst(relPath, content);
      summary.unreadableTextTraps.push(...astAnalysis.unreadableTextTraps);
      summary.nestedCards.push(...astAnalysis.nestedCards);
      summary.nestedPills.push(...astAnalysis.nestedPills);
    }

    return summary;
  }
}
