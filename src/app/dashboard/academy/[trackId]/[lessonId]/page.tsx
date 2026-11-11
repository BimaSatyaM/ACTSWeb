'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getTrackById, getLessonById, getAdjacentLessons } from '@/data/academy'
import { useAuth } from '@/context/AuthContext'
import { useAcademyProgress } from '@/hooks/useAcademyProgress'
import { MarkdownRenderer } from '@/components/academy/MarkdownRenderer'
import { ChartSimulator } from '@/components/academy/ChartSimulator'
import { MacroEventEmbed } from '@/components/academy/MacroEventEmbed'
import { LessonQuiz } from '@/components/academy/LessonQuiz'
import { EducationalDisclaimer } from '@/components/academy/EducationalDisclaimer'
import { AcademyUnlockModal } from '@/components/academy/AcademyUnlockModal'
import { EsmaLossBanner } from '@/components/academy/EsmaLossBanner'

export default function LessonReaderPage() {
  const params = useParams()
  const router = useRouter()
  const trackId = (params?.trackId as string) || ''
  const lessonId = (params?.lessonId as string) || ''

  const track = getTrackById(trackId)
  const lesson = getLessonById(trackId, lessonId)
  const { prevLesson, nextLesson } = getAdjacentLessons(trackId, lesson?.id || lessonId)

  const { profile } = useAuth()
  const {
    markLessonComplete,
    recordQuizScore,
    markExerciseComplete,
    setLastVisitedLesson,
    isLessonCompleted,
    isExerciseCompleted,
    getQuizScore,
  } = useAcademyProgress()

  const isApproved = profile?.approved === true
  const hasAcceptedRules = profile?.rulesAccepted === true
  const isUnlocked = isApproved && hasAcceptedRules

  // Gating defense: If track is not free and user is not unlocked
  const isGated = Boolean(track && !track.isFree && !lesson?.isFree && !isUnlocked)

  useEffect(() => {
    if (lesson && !isGated) {
      setLastVisitedLesson(lesson.id)
    }
  }, [lesson, isGated, setLastVisitedLesson])

  if (!track || !lesson) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-3">
        <h1 className="text-xl font-semibold text-white">Lesson not found</h1>
        <p className="text-xs text-[#94a3b8]">
          The requested lesson could not be located in track &quot;{trackId}&quot;.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/academy"
            className="inline-flex h-8 items-center rounded bg-white px-3.5 text-xs font-medium text-[#070b14] hover:bg-[#e2e8f0] transition-colors"
          >
            Academy Home
          </Link>
          {track && (
            <Link
              href={`/dashboard/academy/${track.id}`}
              className="inline-flex h-8 items-center rounded border border-[#262f45] bg-[#0a0f1a] px-3.5 text-xs font-medium text-white hover:bg-[#141b29] transition-colors"
            >
              Track syllabus
            </Link>
          )}
        </div>
      </div>
    )
  }

  const currentModule = track.modules.find((m) => m.id === lesson.moduleId)
  const completed = isLessonCompleted(lesson.id)

  const handleNextLesson = () => {
    markLessonComplete(lesson.id)
    if (nextLesson) {
      router.push(`/dashboard/academy/${track.id}/${nextLesson.slug || nextLesson.id}`)
    } else {
      router.push(`/dashboard/academy/${track.id}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#94a3b8]">
        <Link
          href="/dashboard/academy"
          className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
        >
          Trading Academy
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/academy/${track.id}`}
          className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54] truncate max-w-[220px]"
        >
          {track.title}
        </Link>
        <span>/</span>
        <span className="text-white font-medium truncate max-w-[280px]">{lesson.title}</span>
      </nav>

      {/* Gating Defense */}
      {isGated ? (
        <div className="space-y-6">
          <AcademyUnlockModal
            mode="inline"
            trackTitle={`${track.title} — ${lesson.title}`}
          />
          <EsmaLossBanner />
        </div>
      ) : (
        <article className="space-y-8">
          {/* Lesson Title Row (no pills above heading) */}
          <header className="space-y-2 border-b border-[#1a2030] pb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-white leading-snug">
              {lesson.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#94a3b8] [font-variant-numeric:tabular-nums]">
              <span>{currentModule?.title || track.title}</span>
              <span>·</span>
              <span>{lesson.readingTimeMinutes} min read</span>
              {completed && (
                <>
                  <span>·</span>
                  <span className="text-[#3fc07a] font-medium">Completed</span>
                </>
              )}
            </div>
          </header>

          {/* Learning Objectives (flat panel, no icon in a box) */}
          {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
            <section
              aria-label="Learning Objectives"
              className="rounded-lg border border-[#1a2030] bg-[#0a0f1a] p-4 sm:p-5 space-y-2.5"
            >
              <h2 className="text-sm font-semibold text-white">
                Learning objectives
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                {lesson.learningObjectives.map((obj, idx) => (
                  <li key={`obj-${idx}`}>{obj}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Interactive Chart Simulator Integration (Prominent Top Workspace) */}
          {lesson.chartExercise && (
            <section
              aria-label="Interactive Chart Simulation Exercise"
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Interactive chart &amp; indicator simulator
                  </h2>
                  <p className="text-xs text-[#94a3b8]">
                    Step forward bar by bar, inspect Support/Resistance zones &amp; oscillator sub-panes, and place an Entry/SL bracket to verify the +1.975R setup.
                  </p>
                </div>

                {isExerciseCompleted(lesson.chartExercise.id) && (
                  <span className="text-xs font-medium text-[#3fc07a]">
                    Simulation completed
                  </span>
                )}
              </div>

              <ChartSimulator
                exerciseConfig={lesson.chartExercise}
                onTradeComplete={() => {
                  if (lesson.chartExercise) {
                    markExerciseComplete(lesson.chartExercise.id)
                  }
                }}
                height={480}
              />

              {lesson.chartExercise.explanation && (
                <p className="rounded-lg border border-[#1a2030] bg-[#0a0f1a] p-3.5 text-xs text-[#cbd5e1] leading-relaxed">
                  <span className="font-medium text-white">Setup context: </span>
                  {lesson.chartExercise.explanation}
                </p>
              )}
            </section>
          )}

          {/* Core Lesson Content & Visual Chart Diagrams */}
          <section className="text-[#cbd5e1] leading-relaxed space-y-4">
            <MarkdownRenderer content={lesson.contentMarkdown} />
          </section>

          {/* Macro Event Integration */}
          {lesson.macroEvent && (
            <section
              aria-label="Macroeconomic Calendar Data"
              className="space-y-3 pt-6 border-t border-[#1a2030]"
            >
              <h3 className="text-base font-semibold text-white">
                Economic calendar release
              </h3>
              <MacroEventEmbed macroEvent={lesson.macroEvent} />
            </section>
          )}

          {/* Comprehension Quiz */}
          {lesson.quiz && lesson.quiz.length > 0 && (
            <section
              aria-label="Knowledge Verification Quiz"
              className="pt-6 border-t border-[#1a2030]"
            >
              <LessonQuiz
                quiz={lesson.quiz}
                lessonId={lesson.id}
                initialScore={getQuizScore(lesson.id)}
                onQuizSubmit={(score, total) => {
                  recordQuizScore(lesson.id, score, total)
                }}
              />
            </section>
          )}

          {/* Primary Sources */}
          {lesson.primarySources && lesson.primarySources.length > 0 && (
            <section
              aria-label="Verified Primary Sources"
              className="rounded-lg border border-[#1a2030] bg-[#0a0f1a] p-4 sm:p-5 space-y-3"
            >
              <h3 className="text-sm font-semibold text-white">
                Primary sources and references
              </h3>
              <ul className="space-y-2 text-xs divide-y divide-[#141a26]">
                {lesson.primarySources.map((ps, idx) => (
                  <li key={`source-${idx}`} className="pt-2 first:pt-0">
                    <a
                      href={ps.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white underline underline-offset-2 hover:text-[#cbd5e1]"
                    >
                      {ps.title}
                    </a>
                    {ps.note && (
                      <p className="text-[#94a3b8] mt-0.5 leading-relaxed">{ps.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Bottom Sequential Navigation Bar */}
          <nav
            aria-label="Lesson Navigation"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#1a2030]"
          >
            {prevLesson ? (
              <Link
                href={`/dashboard/academy/${track.id}/${prevLesson.slug || prevLesson.id}`}
                className="inline-flex h-9 items-center gap-2 rounded border border-[#262f45] bg-[#0a0f1a] px-4 text-xs font-medium text-white hover:bg-[#141b29] transition-colors w-full sm:w-auto justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
              >
                <span>Previous: {prevLesson.title.slice(0, 26)}</span>
              </Link>
            ) : (
              <Link
                href={`/dashboard/academy/${track.id}`}
                className="inline-flex h-9 items-center gap-2 rounded border border-[#262f45] bg-[#0a0f1a] px-4 text-xs font-medium text-white hover:bg-[#141b29] transition-colors w-full sm:w-auto justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
              >
                Back to syllabus
              </Link>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => markLessonComplete(lesson.id)}
                className={`h-9 rounded px-4 text-xs font-medium transition-colors border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54] ${
                  completed
                    ? 'border-[#3fc07a]/40 bg-[#172a1d] text-[#3fc07a]'
                    : 'border-[#262f45] bg-[#0a0f1a] text-[#cbd5e1] hover:text-white hover:bg-[#141b29]'
                }`}
              >
                {completed ? 'Completed' : 'Mark complete'}
              </button>

              <button
                type="button"
                onClick={handleNextLesson}
                className="inline-flex h-9 items-center gap-2 rounded bg-white px-4 text-xs font-medium text-[#070b14] hover:bg-[#e2e8f0] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
              >
                <span>{nextLesson ? 'Next lesson' : 'Finish track'}</span>
              </button>
            </div>
          </nav>

          {/* Quiet Footnotes */}
          <div className="space-y-3 pt-2">
            <EsmaLossBanner />
            <EducationalDisclaimer />
          </div>
        </article>
      )}
    </div>
  )
}
