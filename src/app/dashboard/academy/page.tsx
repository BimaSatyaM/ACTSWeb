'use client'

import React from 'react'
import Link from 'next/link'
import { ACADEMY_TRACKS, PHASE2_TRACKS, getLessonById } from '@/data/academy'
import { useAcademyProgress } from '@/hooks/useAcademyProgress'
import { EsmaLossBanner } from '@/components/academy/EsmaLossBanner'

export default function AcademyHomePage() {
  const { progress } = useAcademyProgress()

  const launchLessons = ACADEMY_TRACKS.flatMap((track) =>
    track.modules.flatMap((m) => m.lessons)
  )
  const totalLaunchLessons = launchLessons.length
  const completedLaunchLessons = launchLessons.filter((l) =>
    progress.completedLessonIds.includes(l.id)
  ).length
  const overallPercentage =
    totalLaunchLessons > 0 ? Math.round((completedLaunchLessons / totalLaunchLessons) * 100) : 0

  const totalQuizzes = launchLessons.filter((l) => l.quiz && l.quiz.length > 0).length
  const passedQuizzes = Object.values(progress.quizScores).filter((q) => q.passed).length

  const totalExercises = launchLessons.filter((l) => l.chartExercise).length
  const completedExercises = progress.completedExerciseIds.length

  let resumeLesson = null
  let resumeTrack = null

  if (progress.lastVisitedLessonId) {
    for (const track of ACADEMY_TRACKS) {
      const found = getLessonById(track.id, progress.lastVisitedLessonId)
      if (found) {
        resumeLesson = found
        resumeTrack = track
        break
      }
    }
  }

  const firstTrack = ACADEMY_TRACKS[0]
  const defaultLesson = firstTrack?.modules[0]?.lessons[0]

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-900/10 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Trading Academy
          </h1>
          <p className="text-sm text-slate-600">
            Order book mechanics, bracket risk math, bar-by-bar chart replay, and macroeconomic releases.
          </p>
        </div>

        {resumeLesson && resumeTrack ? (
          <Link
            href={`/dashboard/academy/${resumeTrack.id}/${resumeLesson.slug || resumeLesson.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-xs font-semibold text-white hover:bg-[#0284c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] self-start sm:self-auto flex-shrink-0"
          >
            <span>Continue: {resumeLesson.title.slice(0, 32)}</span>
          </Link>
        ) : defaultLesson ? (
          <Link
            href={`/dashboard/academy/${firstTrack.id}/${defaultLesson.slug || defaultLesson.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-xs font-semibold text-white hover:bg-[#0284c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] self-start sm:self-auto flex-shrink-0"
          >
            <span>Start Foundations track</span>
          </Link>
        ) : null}
      </header>

      <section
        aria-label="Coursework Progress"
        className="border-y border-slate-900/10 py-5 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0"
      >
        <div className="lg:pr-6">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Lessons completed</span>
          <span className="mt-1 block text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {completedLaunchLessons} <span className="text-sm font-normal text-slate-500">/ {totalLaunchLessons}</span>
          </span>
          <span className="mt-0.5 block text-xs text-slate-600">Across 4 core tracks</span>
        </div>

        <div className="lg:border-l border-slate-900/10 lg:px-6">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Comprehension checks</span>
          <span className="mt-1 block text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {passedQuizzes} <span className="text-sm font-normal text-slate-500">/ {totalQuizzes}</span>
          </span>
          <span className="mt-0.5 block text-xs text-slate-600">70% passing threshold</span>
        </div>

        <div className="lg:border-l border-slate-900/10 lg:px-6">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Chart simulations</span>
          <span className="mt-1 block text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {completedExercises} <span className="text-sm font-normal text-slate-500">/ {totalExercises}</span>
          </span>
          <span className="mt-0.5 block text-xs text-slate-600">Interactive candle replay</span>
        </div>

        <div className="lg:border-l border-slate-900/10 lg:pl-6">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Overall completion</span>
          <span className="mt-1 block text-2xl font-bold font-mono text-[#0369a1] tabular-nums">
            {overallPercentage}%
          </span>
          <span className="mt-0.5 block text-xs text-slate-600">Synced across devices</span>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Core curriculum
          </h2>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {ACADEMY_TRACKS.length} tracks · {totalLaunchLessons} lessons
          </span>
        </div>

        <div className="space-y-4">
          {ACADEMY_TRACKS.map((track) => {
            const trackLessons = track.modules.flatMap((m) =>
              m.lessons.map((l) => ({ ...l, moduleTitle: m.title }))
            )
            const completedCount = trackLessons.filter((l) =>
              progress.completedLessonIds.includes(l.id)
            ).length

            return (
              <div
                key={track.id}
                className="rounded-2xl border border-slate-900/10 bg-[#faf2df] overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 border-b border-slate-900/10 bg-[#f3ead2]/50">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900">
                        <Link
                          href={`/dashboard/academy/${track.id}`}
                          className="hover:text-[#0369a1] hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
                        >
                          {track.title}
                        </Link>
                      </h3>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          track.isFree ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        · {track.isFree ? 'Free access' : 'Member access'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {track.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs flex-shrink-0 font-mono tabular-nums">
                    <span className="text-slate-600 font-medium">
                      {completedCount}/{trackLessons.length} done · {track.estimatedHours}h
                    </span>
                    <Link
                      href={`/dashboard/academy/${track.id}`}
                      className="text-[#0369a1] hover:text-slate-900 underline underline-offset-2 font-bold font-sans"
                    >
                      Open track
                    </Link>
                  </div>
                </div>

                <div className="divide-y divide-slate-900/10">
                  {trackLessons.map((lesson) => {
                    const isDone = progress.completedLessonIds.includes(lesson.id)
                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/academy/${track.id}/${lesson.slug || lesson.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-2.5 text-xs hover:bg-[#f3ead2]/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              isDone ? 'bg-emerald-600' : 'bg-slate-500'
                            }`}
                          />
                          <span className="text-slate-900 font-semibold truncate">
                            {lesson.title}
                          </span>
                          <span className="hidden md:inline text-slate-500 truncate">
                            {lesson.moduleTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-slate-500 flex-shrink-0 pl-4 sm:pl-0 font-mono tabular-nums">
                          {lesson.chartExercise && (
                            <span className="text-[#0369a1] font-medium">Chart replay</span>
                          )}
                          {lesson.macroEvent && (
                            <span className="text-amber-800 font-medium">Macro release</span>
                          )}
                          <span className="w-14 text-right">{lesson.readingTimeMinutes} min</span>
                          <span
                            className={`w-16 text-right font-medium ${
                              isDone ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                            }`}
                          >
                            {isDone ? 'Done' : 'Read'}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-3 pt-2">
        <div className="flex items-baseline justify-between border-b border-slate-900/10 pb-2.5">
          <h2 className="text-base font-bold text-slate-900">
            Phase 2 syllabus outlines
          </h2>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {PHASE2_TRACKS.length} planned tracks
          </span>
        </div>

        <div className="divide-y divide-slate-900/10">
          {PHASE2_TRACKS.map((track) => {
            const lessonCount = track.modules.flatMap((m) => m.lessons).length
            return (
              <div
                key={track.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3.5 text-xs"
              >
                <div className="space-y-0.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{track.title}</span>
                    <span className="text-slate-500">· {track.tagline}</span>
                  </div>
                  <p className="text-slate-600 line-clamp-1">
                    {track.modules.map((m) => m.title).join(' · ')}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-slate-500 flex-shrink-0 font-mono tabular-nums">
                  <span>{lessonCount} lessons</span>
                  <span className="w-10 text-right">{track.estimatedHours}h</span>
                  <span className="text-slate-500 w-16 text-right font-medium">Planned</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <EsmaLossBanner />
    </div>
  )
}
