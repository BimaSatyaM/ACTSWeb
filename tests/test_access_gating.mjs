// ACTS Academy Access Gating Unit Test Suite
//
// Verifies the access model and architectural invariants:
// 1. Unapproved logged-in user can access /dashboard/academy and Track 1 (Foundations).
// 2. Unapproved logged-in user cannot access non-free tracks (Tracks 2-4) without unlock modal.
// 3. Every non-Academy dashboard page (/dashboard, /dashboard/signals, /dashboard/auto-trading, /dashboard/news, /dashboard/calendar)
// remains 100% locked behind (isApproved && hasAcceptedRules).
// 4. Static and AST verification of layout.tsx, [trackId]/page.tsx, and [lessonId]/page.tsx defense guards.
//
// Run with: node tests/test_access_gating.mjs or node --test tests/test_access_gating.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

// Pure evaluation function mirroring src/app/dashboard/layout.tsx
function evaluateDashboardLayoutAccess({ user, profile, pathname }) {
  const isApproved = profile?.approved === true
  const hasAcceptedRules = profile?.rulesAccepted === true
  const isDashboardUnlocked = isApproved && hasAcceptedRules

  const isAccountPage = pathname === '/dashboard/account'
  const isAcademyRoute = pathname?.startsWith('/dashboard/academy')

  const canAccessLayout = isDashboardUnlocked || isAccountPage || (Boolean(user) && isAcademyRoute)
  return {
    isDashboardUnlocked,
    isAccountPage,
    isAcademyRoute,
    canAccessLayout, // true = renders children; false = renders <DashboardGating />
  }
}

// Pure evaluation function mirroring src/app/dashboard/academy/[trackId]/page.tsx
function evaluateTrackOverviewAccess({ profile, track }) {
  const isApproved = profile?.approved === true
  const hasAcceptedRules = profile?.rulesAccepted === true
  const isUnlocked = isApproved && hasAcceptedRules

  // Track Gating Defense Check: Non-free tracks require unlocked account
  const isTrackGated = !track.isFree && !isUnlocked

  return {
    isUnlocked,
    isTrackGated, // true = renders inline <AcademyUnlockModal />
    isAccessibleWithoutModal: !isTrackGated
  }
}

// Pure evaluation function mirroring src/app/dashboard/academy/[trackId]/[lessonId]/page.tsx
function evaluateLessonReaderAccess({ profile, track, lesson }) {
  const isApproved = profile?.approved === true
  const hasAcceptedRules = profile?.rulesAccepted === true
  const isUnlocked = isApproved && hasAcceptedRules

  // Gating defense: If track is not free and user is not unlocked
  const isGated = Boolean(track && !track.isFree && !lesson?.isFree && !isUnlocked)

  return {
    isUnlocked,
    isGated, // true = renders <AcademyUnlockModal /> instead of lesson article content
    isContentAccessible: !isGated
  }
}

// Helper to load Track datasets
function loadTrack(relativePath, exportName) {
  const fullPath = path.resolve(ROOT_DIR, relativePath)
  const sourceCode = fs.readFileSync(fullPath, 'utf8')
  const transpiled = ts.transpileModule(sourceCode, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  })
  const moduleObj = { exports: {} }
  const fn = new Function('exports', 'require', 'module', transpiled.outputText)
  fn(moduleObj.exports, require, moduleObj)
  return moduleObj.exports[exportName]
}

const track1 = loadTrack('src/data/academy/track1_foundations.ts', 'track1Foundations')
const track2 = loadTrack('src/data/academy/track2_technical.ts', 'track2Technical')
const track3 = loadTrack('src/data/academy/track3_macro.ts', 'track3Macro')
const track4 = loadTrack('src/data/academy/track4_legends.ts', 'track4Legends')

// ─────────────────────────────────────────────────────────────────────────────
// 1. Static Invariant Code Verification
// ─────────────────────────────────────────────────────────────────────────────

test('Access Gating: src/app/dashboard/layout.tsx enforces strict gating logic', () => {
  const layoutPath = path.resolve(ROOT_DIR, 'src/app/dashboard/layout.tsx')
  assert.ok(fs.existsSync(layoutPath), 'layout.tsx must exist')
  const content = fs.readFileSync(layoutPath, 'utf8')

  assert.match(content, /isApproved\s*=\s*profile\?\.approved\s*===\s*true/, 'Requires exact profile.approved check')
  assert.match(content, /hasAcceptedRules\s*=\s*profile\?\.rulesAccepted\s*===\s*true/, 'Requires exact profile.rulesAccepted check')
  assert.match(content, /isDashboardUnlocked\s*=\s*isApproved\s*&&\s*hasAcceptedRules/, 'Requires both approved AND rules accepted')
  assert.match(content, /isAcademyRoute\s*=\s*pathname\?\.startsWith\(['"]\/dashboard\/academy['"]\)/, 'Requires startsWith /dashboard/academy')
  assert.match(content, /isDashboardUnlocked\s*\|\|\s*isAccountPage\s*\|\|\s*\(\s*Boolean\(user\)\s*&&\s*isAcademyRoute\s*\)/, 'Exact boolean access predicate')
  assert.match(content, /<DashboardGating\s*\/>/, 'Renders <DashboardGating /> on locked state')
})

test('Access Gating: [trackId]/page.tsx enforces track-level gating modal', () => {
  const trackPagePath = path.resolve(ROOT_DIR, 'src/app/dashboard/academy/[trackId]/page.tsx')
  assert.ok(fs.existsSync(trackPagePath), '[trackId]/page.tsx must exist')
  const content = fs.readFileSync(trackPagePath, 'utf8')

  assert.match(content, /isTrackGated\s*=\s*!track\.isFree\s*&&\s*!isUnlocked/, 'Enforces isTrackGated formula')
  assert.match(content, /<AcademyUnlockModal\s+mode="inline"/, 'Renders inline <AcademyUnlockModal /> when gated')
})

test('Access Gating: [trackId]/[lessonId]/page.tsx enforces lesson content gating defense', () => {
  const lessonPagePath = path.resolve(ROOT_DIR, 'src/app/dashboard/academy/[trackId]/[lessonId]/page.tsx')
  assert.ok(fs.existsSync(lessonPagePath), '[trackId]/[lessonId]/page.tsx must exist')
  const content = fs.readFileSync(lessonPagePath, 'utf8')

  assert.match(content, /isGated\s*=\s*Boolean\(\s*track\s*&&\s*!track\.isFree\s*&&\s*!lesson\?\.isFree\s*&&\s*!isUnlocked\s*\)/, 'Enforces isGated formula')
  assert.match(content, /isGated\s*\?\s*\(\s*<div[^>]*>\s*<AcademyUnlockModal/, 'Guards lesson article behind isGated check')
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Track Data Free/Pro Configuration
// ─────────────────────────────────────────────────────────────────────────────

test('Access Gating: Track dataset isFree configurations conform to specifications', () => {
  assert.equal(track1.isFree, true, 'Track 1 (Foundations) must be free')
  assert.equal(track2.isFree, false, 'Track 2 (Technical Analysis) must NOT be free')
  assert.equal(track3.isFree, false, 'Track 3 (Macroeconomics) must NOT be free')
  assert.equal(track4.isFree, false, 'Track 4 (Legends) must NOT be free')
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. User Access Model: Unapproved Logged-in User
// ─────────────────────────────────────────────────────────────────────────────

const unapprovedUser = {
  user: { uid: 'unapproved_user_001', email: 'free_tier@acts.trade' },
  profile: { approved: false, rulesAccepted: false }
}

test('Access Gating: Unapproved logged-in user can access /dashboard/academy layout', () => {
  const res = evaluateDashboardLayoutAccess({
    user: unapprovedUser.user,
    profile: unapprovedUser.profile,
    pathname: '/dashboard/academy'
  })
  assert.equal(res.canAccessLayout, true, 'Unapproved logged-in user MUST be allowed into /dashboard/academy')
  assert.equal(res.isDashboardUnlocked, false, 'Dashboard remains not unlocked')
  assert.equal(res.isAcademyRoute, true)
})

test('Access Gating: Unapproved logged-in user can access Track 1 (Foundations) without unlock modal', () => {
  // Track Overview
  const trackOverview = evaluateTrackOverviewAccess({
    profile: unapprovedUser.profile,
    track: track1
  })
  assert.equal(trackOverview.isTrackGated, false, 'Track 1 overview must NOT be gated')
  assert.equal(trackOverview.isAccessibleWithoutModal, true)

  // Every lesson in Track 1
  for (const mod of track1.modules) {
    for (const lesson of mod.lessons) {
      const lessonAccess = evaluateLessonReaderAccess({
        profile: unapprovedUser.profile,
        track: track1,
        lesson
      })
      assert.equal(lessonAccess.isGated, false, `Track 1 lesson "${lesson.id}" must NOT be gated`)
      assert.equal(lessonAccess.isContentAccessible, true)
    }
  }
})

test('Access Gating: Unapproved logged-in user CANNOT access non-free tracks (Tracks 2-4) without unlock modal', () => {
  const nonFreeTracks = [track2, track3, track4]

  for (const track of nonFreeTracks) {
    // 1. Track Overview is gated with unlock modal
    const trackOverview = evaluateTrackOverviewAccess({
      profile: unapprovedUser.profile,
      track
    })
    assert.equal(trackOverview.isTrackGated, true, `Track "${track.id}" overview MUST be gated for unapproved user`)
    assert.equal(trackOverview.isAccessibleWithoutModal, false)

    // 2. Every lesson in non-free track is gated with unlock modal
    for (const mod of track.modules) {
      for (const lesson of mod.lessons) {
        const lessonAccess = evaluateLessonReaderAccess({
          profile: unapprovedUser.profile,
          track,
          lesson
        })
        assert.equal(lessonAccess.isGated, true, `Non-free lesson "${lesson.id}" in "${track.id}" MUST be gated`)
        assert.equal(lessonAccess.isContentAccessible, false)
      }
    }
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Non-Academy Dashboard Pages 100% Locked Invariant
// ─────────────────────────────────────────────────────────────────────────────

test('Access Gating: Non-Academy dashboard pages remain 100% locked for unapproved logged-in user', () => {
  const nonAcademyRoutes = [
    '/dashboard',
    '/dashboard/signals',
    '/dashboard/auto-trading',
    '/dashboard/news',
    '/dashboard/calendar',
    '/dashboard/idx',
    '/dashboard/idx/orderbook',
    '/dashboard/idx/watchlist',
    '/dashboard/admin'
  ]

  for (const route of nonAcademyRoutes) {
    const res = evaluateDashboardLayoutAccess({
      user: unapprovedUser.user,
      profile: unapprovedUser.profile,
      pathname: route
    })
    assert.equal(res.canAccessLayout, false, `Route "${route}" MUST be locked for unapproved user (<DashboardGating />)`)
    assert.equal(res.isDashboardUnlocked, false)
    assert.equal(res.isAcademyRoute, false)
    assert.equal(res.isAccountPage, false)
  }
})

test('Access Gating: Non-Academy dashboard pages remain locked if approved but rules not accepted', () => {
  const userApprovedNoRules = {
    user: { uid: 'u_approved_no_rules' },
    profile: { approved: true, rulesAccepted: false }
  }

  const routes = ['/dashboard', '/dashboard/signals', '/dashboard/auto-trading', '/dashboard/news', '/dashboard/calendar']
  for (const route of routes) {
    const res = evaluateDashboardLayoutAccess({
      user: userApprovedNoRules.user,
      profile: userApprovedNoRules.profile,
      pathname: route
    })
    assert.equal(res.canAccessLayout, false, `Route "${route}" MUST be locked if rules not accepted`)
  }
})

test('Access Gating: Non-Academy dashboard pages remain locked if rules accepted but not approved', () => {
  const userRulesNoApproval = {
    user: { uid: 'u_rules_no_approval' },
    profile: { approved: false, rulesAccepted: true }
  }

  const routes = ['/dashboard', '/dashboard/signals', '/dashboard/auto-trading', '/dashboard/news', '/dashboard/calendar']
  for (const route of routes) {
    const res = evaluateDashboardLayoutAccess({
      user: userRulesNoApproval.user,
      profile: userRulesNoApproval.profile,
      pathname: route
    })
    assert.equal(res.canAccessLayout, false, `Route "${route}" MUST be locked if not approved`)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Approved Pro User: Full Access Model
// ─────────────────────────────────────────────────────────────────────────────

const approvedProUser = {
  user: { uid: 'pro_user_777', email: 'trader@acts.trade' },
  profile: { approved: true, rulesAccepted: true }
}

test('Access Gating: Approved Pro user has full access across all dashboard pages and all Academy tracks', () => {
  const allRoutes = [
    '/dashboard',
    '/dashboard/signals',
    '/dashboard/auto-trading',
    '/dashboard/news',
    '/dashboard/calendar',
    '/dashboard/account',
    '/dashboard/academy',
    '/dashboard/academy/foundations',
    '/dashboard/academy/technical-analysis',
    '/dashboard/academy/macroeconomics',
    '/dashboard/academy/legends'
  ]

  for (const route of allRoutes) {
    const res = evaluateDashboardLayoutAccess({
      user: approvedProUser.user,
      profile: approvedProUser.profile,
      pathname: route
    })
    assert.equal(res.canAccessLayout, true, `Pro user MUST access layout on "${route}"`)
  }

  // All tracks (1-4) accessible without unlock modal
  const allTracks = [track1, track2, track3, track4]
  for (const track of allTracks) {
    const trackOverview = evaluateTrackOverviewAccess({
      profile: approvedProUser.profile,
      track
    })
    assert.equal(trackOverview.isTrackGated, false, `Pro user must not see gating modal on "${track.id}"`)

    for (const mod of track.modules) {
      for (const lesson of mod.lessons) {
        const lessonAccess = evaluateLessonReaderAccess({
          profile: approvedProUser.profile,
          track,
          lesson
        })
        assert.equal(lessonAccess.isGated, false, `Pro user must not see gating modal on lesson "${lesson.id}"`)
        assert.equal(lessonAccess.isContentAccessible, true)
      }
    }
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Logged Out User Defense
// ─────────────────────────────────────────────────────────────────────────────

test('Access Gating: Logged-out user (user === null) is locked from Academy and dashboard', () => {
  const resAcademy = evaluateDashboardLayoutAccess({
    user: null,
    profile: null,
    pathname: '/dashboard/academy'
  })
  assert.equal(resAcademy.canAccessLayout, false, 'Logged-out user CANNOT access /dashboard/academy')

  const resDashboard = evaluateDashboardLayoutAccess({
    user: null,
    profile: null,
    pathname: '/dashboard'
  })
  assert.equal(resDashboard.canAccessLayout, false, 'Logged-out user CANNOT access /dashboard')
})
