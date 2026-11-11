#!/usr/bin/env node
/**
 * ACTS Academy Content Integrity & Regulatory Compliance Verifier
 * 
 * Verifies:
 * 1. Schema integrity for all curriculum tracks and lessons:
 *    - learningObjectives (>= 1 item)
 *    - readingTimeMinutes (> 0)
 *    - check-for-understanding: quiz (questions, options/choices, explanations) OR chartExercise (symbol, setupBarIndex, entry, sl, tp1, tp2, tp3, explanation)
 *    - primarySources (>= 1, valid http/https URLs)
 * 2. Prohibited hype words scanner across all curriculum, components, and pages.
 * 3. Regulatory ESMA disclosure (74-89% retail CFD loss rate with official EUR-Lex decision link).
 * 4. Legends check: John D. Rockefeller and Changpeng Zhao (CZ) explicit distinction as business/infrastructure builders, not chart traders.
 * 5. SMC/ICT check: Academic and scientific disclaimer for retail SMC/ICT concepts.
 * 
 * Run with: node scripts/verify_academy_content.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

// ANSI Color Helpers
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const CYAN = '\x1b[36m'
const DIM = '\x1b[2m'

let totalChecks = 0
let failedChecks = 0

function logHeader(title) {
  console.log(`\n${BOLD}${CYAN}=== ${title} ===${RESET}`)
}

function logPass(msg) {
  totalChecks++
  console.log(`  ${GREEN}✔${RESET} ${msg}`)
}

function logFail(msg, detail = null) {
  totalChecks++
  failedChecks++
  console.error(`  ${RED}✖ [FAIL]${RESET} ${BOLD}${msg}${RESET}`)
  if (detail) {
    console.error(`    ${DIM}${detail}${RESET}`)
  }
}

/**
 * Load and transpile a TypeScript curriculum file in-memory using typescript.transpileModule
 */
function loadTsModule(relativePath) {
  const fullPath = path.resolve(ROOT_DIR, relativePath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`)
  }
  const sourceCode = fs.readFileSync(fullPath, 'utf8')
  const transpiled = ts.transpileModule(sourceCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      removeComments: false
    }
  })

  const moduleObj = { exports: {} }
  const fn = new Function('exports', 'require', 'module', transpiled.outputText)
  fn(moduleObj.exports, require, moduleObj)

  return moduleObj.exports
}

/**
 * Validate standard URL structure
 */
function isValidUrl(stringUrl) {
  if (!stringUrl || typeof stringUrl !== 'string') return false
  if (!stringUrl.startsWith('http://') && !stringUrl.startsWith('https://')) return false
  try {
    const parsed = new URL(stringUrl)
    return Boolean(parsed.hostname)
  } catch {
    return false
  }
}

console.log(`${BOLD}ACTS Academy Forensic Content Integrity & Compliance Audit${RESET}`)
console.log(`${DIM}Root directory: ${ROOT_DIR}${RESET}`)

// ─────────────────────────────────────────────────────────────────────────────
// 1. Load Curriculum Tracks
// ─────────────────────────────────────────────────────────────────────────────
logHeader('1. Loading Curriculum Datasets')

const trackFiles = [
  { file: 'src/data/academy/track1_foundations.ts', exportName: 'track1Foundations' },
  { file: 'src/data/academy/track2_technical.ts', exportName: 'track2Technical' },
  { file: 'src/data/academy/track3_macro.ts', exportName: 'track3Macro' },
  { file: 'src/data/academy/track4_legends.ts', exportName: 'track4Legends' }
]

const loadedTracks = []

for (const tf of trackFiles) {
  try {
    const exports = loadTsModule(tf.file)
    const track = exports[tf.exportName]
    if (!track) {
      logFail(`Missing export "${tf.exportName}" in ${tf.file}`)
    } else {
      loadedTracks.push(track)
      logPass(`Loaded "${track.title}" (${track.id}) with ${track.modules?.length || 0} modules`)
    }
  } catch (err) {
    logFail(`Failed to load ${tf.file}`, err.message)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Validate Every Lesson Schema & Check-for-Understanding
// ─────────────────────────────────────────────────────────────────────────────
logHeader('2. Verifying Lesson Pedagogical Schema & Check-For-Understanding')

let totalLessonsCount = 0
let totalQuizzesCount = 0
let totalExercisesCount = 0
let totalSourcesCount = 0

for (const track of loadedTracks) {
  if (!Array.isArray(track.modules) || track.modules.length === 0) {
    logFail(`Track "${track.id}" has no modules`)
    continue
  }

  for (const mod of track.modules) {
    if (!Array.isArray(mod.lessons) || mod.lessons.length === 0) {
      logFail(`Module "${mod.id}" in Track "${track.id}" has no lessons`)
      continue
    }

    for (const lesson of mod.lessons) {
      totalLessonsCount++
      const lessonRef = `${track.id} -> ${mod.id} -> ${lesson.id} ("${lesson.title}")`

      // 1. Learning Objectives (>= 1 item)
      if (!Array.isArray(lesson.learningObjectives) || lesson.learningObjectives.length === 0) {
        logFail(`Missing learningObjectives in ${lessonRef}`)
      } else {
        const invalidObjectives = lesson.learningObjectives.filter((o) => typeof o !== 'string' || !o.trim())
        if (invalidObjectives.length > 0) {
          logFail(`Blank or non-string learning objective in ${lessonRef}`)
        }
      }

      // 2. Reading Time Minutes (> 0)
      if (typeof lesson.readingTimeMinutes !== 'number' || lesson.readingTimeMinutes <= 0) {
        logFail(`Invalid readingTimeMinutes (${lesson.readingTimeMinutes}) in ${lessonRef}`)
      }

      // 3. Check-for-Understanding: EITHER quiz OR chartExercise
      const hasQuiz = Array.isArray(lesson.quiz) && lesson.quiz.length > 0
      const hasChartExercise = Boolean(lesson.chartExercise)

      if (!hasQuiz && !hasChartExercise) {
        logFail(`No check-for-understanding found in ${lessonRef}. Must have quiz or chartExercise.`)
      }

      if (hasQuiz) {
        totalQuizzesCount += lesson.quiz.length
        lesson.quiz.forEach((q, idx) => {
          const qRef = `${lessonRef} [Quiz Q${idx + 1}: ${q.id || 'no-id'}]`
          if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
            logFail(`Quiz question missing prompt in ${qRef}`)
          }
          if (!Array.isArray(q.options) || q.options.length < 2) {
            logFail(`Quiz question must have >= 2 choices in ${qRef}`)
          } else {
            const emptyChoice = q.options.some((opt) => typeof opt !== 'string' || !opt.trim())
            if (emptyChoice) {
              logFail(`Quiz question contains empty choice in ${qRef}`)
            }
          }
          if (
            typeof q.correctIndex !== 'number' ||
            q.correctIndex < 0 ||
            q.correctIndex >= (q.options?.length || 0)
          ) {
            logFail(`Invalid correctIndex (${q.correctIndex}) in ${qRef}`)
          }
          if (!q.explanation || typeof q.explanation !== 'string' || !q.explanation.trim()) {
            logFail(`Quiz question missing explanation in ${qRef}`)
          }
        })
      }

      if (hasChartExercise) {
        totalExercisesCount++
        const ce = lesson.chartExercise
        const ceRef = `${lessonRef} [ChartExercise: ${ce.id || 'no-id'}]`

        if (!ce.symbol || typeof ce.symbol !== 'string') {
          logFail(`Chart exercise missing symbol in ${ceRef}`)
        }
        if (typeof ce.setupBarIndex !== 'number' || ce.setupBarIndex < 0) {
          logFail(`Chart exercise invalid setupBarIndex (${ce.setupBarIndex}) in ${ceRef}`)
        }

        const entry = ce.suggestedEntry ?? ce.entry
        const sl = ce.suggestedSL ?? ce.sl
        const tp1 = ce.suggestedTP1 ?? ce.tp1
        const tp2 = ce.suggestedTP2 ?? ce.tp2
        const tp3 = ce.suggestedTP3 ?? ce.tp3

        if (typeof entry !== 'number' || entry <= 0) {
          logFail(`Chart exercise missing/invalid entry price in ${ceRef}`)
        }
        if (typeof sl !== 'number' || sl <= 0) {
          logFail(`Chart exercise missing/invalid Stop-Loss price in ${ceRef}`)
        }
        if (typeof tp1 !== 'number' || tp1 <= 0) {
          logFail(`Chart exercise missing/invalid TP1 price in ${ceRef}`)
        }
        if (typeof tp2 !== 'number' || tp2 <= 0) {
          logFail(`Chart exercise missing/invalid TP2 price in ${ceRef}`)
        }
        if (typeof tp3 !== 'number' || tp3 <= 0) {
          logFail(`Chart exercise missing/invalid TP3 price in ${ceRef}`)
        }
        if (!ce.explanation || typeof ce.explanation !== 'string' || !ce.explanation.trim()) {
          logFail(`Chart exercise missing explanation in ${ceRef}`)
        }
      }

      // 4. Primary Sources (>= 1, valid title and valid http/https URL)
      if (!Array.isArray(lesson.primarySources) || lesson.primarySources.length === 0) {
        logFail(`Missing primarySources in ${lessonRef}`)
      } else {
        lesson.primarySources.forEach((src, sIdx) => {
          totalSourcesCount++
          const srcRef = `${lessonRef} [Source ${sIdx + 1}]`
          if (!src.title || typeof src.title !== 'string' || !src.title.trim()) {
            logFail(`Primary source missing title in ${srcRef}`)
          }
          if (!isValidUrl(src.url)) {
            logFail(`Primary source invalid URL ("${src.url}") in ${srcRef}`)
          }
        })
      }
    }
  }
}

logPass(`Verified ${totalLessonsCount} lessons across ${loadedTracks.length} tracks`)
logPass(`Validated ${totalQuizzesCount} interactive quiz questions`)
logPass(`Validated ${totalExercisesCount} interactive chart exercises with complete bracket math parameters`)
logPass(`Validated ${totalSourcesCount} primary-source citations with verified http/https protocols`)

// ─────────────────────────────────────────────────────────────────────────────
// 3. Prohibited Hype Words Copy Scanner
// ─────────────────────────────────────────────────────────────────────────────
logHeader('3. Scanning for Prohibited Hype & Promotional Vocabulary')

const PROHIBITED_REGEX =
  /\b(guaranteed|guarantee|risk-free|risk free|zero risk|easy money|make money fast|passive income|secret formula|secret algorithm|foolproof|can't lose|get rich|financial freedom in \d+|100% win rate|win rate guaranteed|copy our trades|guaranteed returns|surefire)\b/i

const SCAN_DIRS = [
  'src/data/academy',
  'src/components/academy',
  'src/app/dashboard/academy'
]

let scannedFilesCount = 0
let hypeViolationsCount = 0

function scanDirectory(relDir) {
  const fullDir = path.resolve(ROOT_DIR, relDir)
  if (!fs.existsSync(fullDir)) return

  const entries = fs.readdirSync(fullDir, { withFileTypes: true })
  for (const entry of entries) {
    const entryRel = path.join(relDir, entry.name)
    const entryFull = path.join(fullDir, entry.name)

    if (entry.isDirectory()) {
      scanDirectory(entryRel)
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      scannedFilesCount++
      const content = fs.readFileSync(entryFull, 'utf8')
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        const match = line.match(PROHIBITED_REGEX)
        if (match) {
          hypeViolationsCount++
          logFail(
            `Prohibited hype word "${match[0]}" detected in ${entryRel}:${idx + 1}`,
            line.trim()
          )
        }
      })
    }
  }
}

for (const dir of SCAN_DIRS) {
  scanDirectory(dir)
}

if (hypeViolationsCount === 0) {
  logPass(`Scanned ${scannedFilesCount} curriculum and UI files: 0 prohibited hype words found`)
} else {
  logFail(`Found ${hypeViolationsCount} prohibited hype word violation(s) across scanned files`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Regulatory ESMA Disclosure Check
// ─────────────────────────────────────────────────────────────────────────────
logHeader('4. Verifying Statutory ESMA Regulatory Disclosure')

const esmaBannerPath = path.resolve(ROOT_DIR, 'src/components/academy/EsmaLossBanner.tsx')

if (!fs.existsSync(esmaBannerPath)) {
  logFail(`EsmaLossBanner.tsx component missing at ${esmaBannerPath}`)
} else {
  const bannerContent = fs.readFileSync(esmaBannerPath, 'utf8')

  // Check 74-89% retail loss range
  const lossRateRegex = /(74%?\s*(and|-|–|to)\s*89%|74–89%|74-89%)/i
  const hasLossRate = lossRateRegex.test(bannerContent)
  const mentionsRetailLoss = /retail.*lose\s+money/i.test(bannerContent)

  if (hasLossRate && mentionsRetailLoss) {
    logPass('Verified 74-89% retail CFD loss rate disclosure')
  } else {
    logFail('EsmaLossBanner.tsx missing mandated 74-89% retail investor loss statement')
  }

  // Check official ESMA EU decision link
  const officialDecisionUrl = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018D0796'
  if (bannerContent.includes(officialDecisionUrl)) {
    logPass(`Verified official EUR-Lex regulatory link: ${officialDecisionUrl}`)
  } else if (/https:\/\/eur-lex\.europa\.eu\/[^\s"']+/i.test(bannerContent)) {
    logPass('Verified official EUR-Lex regulatory link (custom URI)')
  } else {
    logFail('EsmaLossBanner.tsx missing active official EUR-Lex regulatory decision URL')
  }

  // Check ESMA decision reference
  if (bannerContent.includes('2018/796') || /ESMA.*2018/i.test(bannerContent)) {
    logPass('Verified statutory reference to ESMA Decision (EU) 2018/796')
  } else {
    logFail('EsmaLossBanner.tsx missing citation to ESMA Decision (EU) 2018/796')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Legends Structural Check: Rockefeller & Changpeng Zhao
// ─────────────────────────────────────────────────────────────────────────────
logHeader('5. Verifying Legends Distinction: John D. Rockefeller & Changpeng Zhao')

const legendsTrack = loadedTracks.find((t) => t.id === 'legends')

if (!legendsTrack) {
  logFail('Legends track (track4Legends) not loaded')
} else {
  const rzLesson = legendsTrack.modules
    ?.flatMap((m) => m.lessons)
    ?.find(
      (l) =>
        l.id === 'lesson-4-3-1' ||
        (l.title.includes('Rockefeller') && l.title.includes('Changpeng Zhao'))
    )

  if (!rzLesson) {
    logFail('Could not locate John D. Rockefeller & Changpeng Zhao lesson in Legends track')
  } else {
    const text = rzLesson.contentMarkdown || ''
    const mentionsRockefeller = /Rockefeller/i.test(text)
    const mentionsCZ = /(Changpeng Zhao|CZ)/i.test(text)
    const mentionsBuilders = /(industrial|infrastructure|business|enterprise)\s+builders/i.test(text)
    const distinguishesChartTraders = /not\s+(discretionary\s+|technical\s+)?chart\s+traders/i.test(text)

    if (mentionsRockefeller && mentionsCZ && mentionsBuilders && distinguishesChartTraders) {
      logPass(
        'Verified explicit statement identifying Rockefeller and CZ as infrastructure/business builders, NOT technical chart traders'
      )
    } else {
      logFail(
        'Rockefeller and CZ lesson missing mandatory categorical distinction distinguishing enterprise builders from chart traders',
        JSON.stringify({ mentionsRockefeller, mentionsCZ, mentionsBuilders, distinguishesChartTraders })
      )
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SMC / ICT Scientific & Academic Disclaimer Check
// ─────────────────────────────────────────────────────────────────────────────
logHeader('6. Verifying SMC/ICT Academic & Scientific Validation Notice')

const technicalTrack = loadedTracks.find((t) => t.id === 'technical-analysis')

if (!technicalTrack) {
  logFail('Technical analysis track (track2Technical) not loaded')
} else {
  const smcLesson = technicalTrack.modules
    ?.flatMap((m) => m.lessons)
    ?.find(
      (l) =>
        l.contentMarkdown?.includes('Smart Money Concepts') ||
        l.contentMarkdown?.includes('SMC/ICT') ||
        l.contentMarkdown?.includes('Order Blocks')
    )

  if (!smcLesson) {
    logFail('Could not locate lesson discussing Smart Money Concepts (SMC/ICT)')
  } else {
    const text = smcLesson.contentMarkdown || ''
    const mentionsDisclaimerHeader =
      /Scientific\s+(&|\+)?\s*Academic\s+Validation\s+Notice/i.test(text) ||
      /Pedagogical\s+Disclosure/i.test(text)
    const mentionsLackEmpiricalValidation =
      /lack\s+(peer-reviewed\s+)?empirical\s+validation/i.test(text)
    const mentionsAcademicLiterature =
      /academic\s+(financial\s+)?economics|quantitative\s+literature/i.test(text)

    if (mentionsDisclaimerHeader && mentionsLackEmpiricalValidation && mentionsAcademicLiterature) {
      logPass(
        'Verified academic disclosure stating retail SMC/ICT concepts lack peer-reviewed empirical validation'
      )
    } else {
      logFail(
        'SMC/ICT lesson missing explicit peer-reviewed academic validation disclaimer',
        JSON.stringify({ mentionsDisclaimerHeader, mentionsLackEmpiricalValidation, mentionsAcademicLiterature })
      )
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Summary & Exit Code
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}=== Content Integrity Audit Summary ===${RESET}`)
console.log(`  Total Checks Executed : ${BOLD}${totalChecks}${RESET}`)
console.log(`  Passed Checks         : ${BOLD}${GREEN}${totalChecks - failedChecks}${RESET}`)
console.log(`  Failed Checks         : ${BOLD}${failedChecks > 0 ? RED : GREEN}${failedChecks}${RESET}`)

if (failedChecks === 0) {
  console.log(`\n${GREEN}${BOLD}✔ ALL CONTENT INTEGRITY & REGULATORY COMPLIANCE CHECKS PASSED (0 FAILURES)${RESET}\n`)
  process.exit(0)
} else {
  console.error(`\n${RED}${BOLD}✖ CONTENT INTEGRITY AUDIT FAILED WITH ${failedChecks} DEFECT(S)${RESET}\n`)
  process.exit(1)
}
