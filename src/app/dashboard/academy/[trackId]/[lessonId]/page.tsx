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
        <h1 className="text-xl font-bold text-slate-900">Lesson not found</h1>
        <p className="text-xs text-slate-600">
          The requested lesson could not be located in track &quot;{trackId}&quot;.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/academy"
            className="inline-flex h-8 items-center rounded-lg bg-[#0369a1] px-3.5 text-xs font-semibold text-white hover:bg-[#0284c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
          >
            Academy Home
          </Link>
          {track && (
            <Link
              href={`/dashboard/academy/${track.id}`}
              className="inline-flex h-8 items-center rounded-lg border border-slate-900/15 bg-[#faf2df] px-3.5 text-xs font-semibold text-slate-800 hover:bg-[#f3ead2] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
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
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
        <Link
          href="/dashboard/academy"
          className="hover:text-[#0369a1] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
        >
          Trading Academy
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/academy/${track.id}`}
          className="hover:text-[#0369a1] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7] truncate max-w-[220px]"
        >
          {track.title}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[280px]">{lesson.title}</span>
      </nav>

      {isGated ? (
        <div className="space-y-6">
          <AcademyUnlockModal
            mode="inline"
            trackTitle={`${track.title} - ${lesson.title}`}
          />
          <EsmaLossBanner />
        </div>
      ) : (
        <article className="space-y-8">
          <header className="space-y-2 border-b border-slate-900/10 pb-5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              {lesson.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono tabular-nums">
              <span>{currentModule?.title || track.title}</span>
              <span>·</span>
              <span>{lesson.readingTimeMinutes} min read</span>
              {completed && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold">Completed</span>
                </>
              )}
            </div>
          </header>

          {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
            <section
              aria-label="Learning Objectives"
              className="rounded-xl border border-slate-900/10 bg-[#faf2df] p-4 sm:p-5 space-y-2.5"
            >
              <h2 className="text-sm font-bold text-slate-900">
                Learning objectives
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {lesson.learningObjectives.map((obj, idx) => (
                  <li key={`obj-${idx}`}>{obj}</li>
                ))}
              </ul>
            </section>
          )}

          {lesson.chartExercise && (
            <section
              aria-label="Interactive Chart Simulation Exercise"
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Interactive chart &amp; indicator simulator
                  </h2>
                  <p className="text-xs text-slate-600">
                    Step forward bar by bar, inspect Support/Resistance zones &amp; oscillator sub-panes, and place an Entry/SL bracket to verify the +1.975R setup.
                  </p>
                </div>

                {isExerciseCompleted(lesson.chartExercise.id) && (
                  <span className="text-xs font-semibold text-emerald-700">
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
                <p className="rounded-xl border border-slate-900/10 bg-[#faf2df] p-3.5 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900">Setup context: </span>
                  {lesson.chartExercise.explanation}
                </p>
              )}
            </section>
          )}

          <section className="text-slate-800 leading-relaxed space-y-4">
            <MarkdownRenderer content={lesson.contentMarkdown} />
          </section>

          {lesson.macroEvent && (
            <section
              aria-label="Macroeconomic Calendar Data"
              className="space-y-3 pt-6 border-t border-slate-900/10"
            >
              <h3 className="text-base font-bold text-slate-900">
                Economic calendar release
              </h3>
              <MacroEventEmbed macroEvent={lesson.macroEvent} />
            </section>
          )}

          {lesson.quiz && lesson.quiz.length > 0 && (
            <section
              aria-label="Knowledge Verification Quiz"
              className="pt-6 border-t border-slate-900/10"
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

          {lesson.primarySources && lesson.primarySources.length > 0 && (
            <section
              aria-label="Verified Primary Sources"
              className="rounded-xl border border-slate-900/10 bg-[#faf2df] p-4 sm:p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900">
                Primary sources and references
              </h3>
              <ul className="space-y-2 text-xs divide-y divide-slate-900/10">
                {lesson.primarySources.map((ps, idx) => (
                  <li key={`source-${idx}`} className="pt-2 first:pt-0">
                    <a
                      href={ps.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#0369a1] underline underline-offset-2 hover:text-[#0284c7]"
                    >
                      {ps.title}
                    </a>
                    {ps.note && (
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{ps.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav
            aria-label="Lesson Navigation"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-900/10"
          >
            {prevLesson ? (
              <Link
                href={`/dashboard/academy/${track.id}/${prevLesson.slug || prevLesson.id}`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-900/15 bg-[#faf2df] px-4 text-xs font-semibold text-slate-800 hover:bg-[#f3ead2] transition-colors w-full sm:w-auto justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
              >
                <span>Previous: {prevLesson.title.slice(0, 26)}</span>
              </Link>
            ) : (
              <Link
                href={`/dashboard/academy/${track.id}`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-900/15 bg-[#faf2df] px-4 text-xs font-semibold text-slate-800 hover:bg-[#f3ead2] transition-colors w-full sm:w-auto justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
              >
                Back to syllabus
              </Link>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => markLessonComplete(lesson.id)}
                className={`h-9 rounded-lg px-4 text-xs font-semibold transition-colors border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7] cursor-pointer ${
                  completed
                    ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-800'
                    : 'border-slate-900/15 bg-[#faf2df] text-slate-700 hover:bg-[#f3ead2]'
                }`}
              >
                {completed ? 'Completed' : 'Mark complete'}
              </button>

              <button
                type="button"
                onClick={handleNextLesson}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-xs font-semibold text-white hover:bg-[#0284c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] cursor-pointer"
              >
                <span>{nextLesson ? 'Next lesson' : 'Finish track'}</span>
              </button>
            </div>
          </nav>

          <div className="space-y-3 pt-2">
            <EsmaLossBanner />
            <EducationalDisclaimer />
          </div>
        </article>
      )}
    </div>
  )
}
