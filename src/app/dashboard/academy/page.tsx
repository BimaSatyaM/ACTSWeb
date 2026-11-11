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
      {/* Title Row (app-screens.md §4.3: one h1 at 24px, one sentence below, one primary action on right) */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1a2030] pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Trading Academy
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Order book mechanics, bracket risk math, bar-by-bar chart replay, and macroeconomic releases.
          </p>
        </div>

        {resumeLesson && resumeTrack ? (
          <Link
            href={`/dashboard/academy/${resumeTrack.id}/${resumeLesson.slug || resumeLesson.id}`}
            className="inline-flex h-9 items-center gap-2 rounded bg-white px-4 text-xs font-medium text-[#070b14] hover:bg-[#e2e8f0] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54] self-start sm:self-auto flex-shrink-0"
          >
            <span>Continue: {resumeLesson.title.slice(0, 32)}</span>
          </Link>
        ) : defaultLesson ? (
          <Link
            href={`/dashboard/academy/${firstTrack.id}/${defaultLesson.slug || defaultLesson.id}`}
            className="inline-flex h-9 items-center gap-2 rounded bg-white px-4 text-xs font-medium text-[#070b14] hover:bg-[#e2e8f0] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54] self-start sm:self-auto flex-shrink-0"
          >
            <span>Start Foundations track</span>
          </Link>
        ) : null}
      </header>

      {/* Divided KPI Strip (app-screens.md §5: one flat container split by 1px dividers, label over value) */}
      <section
        aria-label="Coursework Progress"
        className="rounded-lg border border-[#1a2030] bg-[#0a0f1a] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#1a2030]"
      >
        <div className="p-4 sm:p-5">
          <span className="block text-xs text-[#94a3b8]">Lessons completed</span>
          <span className="mt-1.5 block text-2xl font-normal text-white [font-variant-numeric:tabular-nums]">
            {completedLaunchLessons} <span className="text-sm text-[#64748b]">/ {totalLaunchLessons}</span>
          </span>
          <span className="mt-1 block text-xs text-[#64748b]">Across 4 core tracks</span>
        </div>

        <div className="p-4 sm:p-5">
          <span className="block text-xs text-[#94a3b8]">Comprehension checks</span>
          <span className="mt-1.5 block text-2xl font-normal text-white [font-variant-numeric:tabular-nums]">
            {passedQuizzes} <span className="text-sm text-[#64748b]">/ {totalQuizzes}</span>
          </span>
          <span className="mt-1 block text-xs text-[#64748b]">70% passing threshold</span>
        </div>

        <div className="p-4 sm:p-5">
          <span className="block text-xs text-[#94a3b8]">Chart simulations</span>
          <span className="mt-1.5 block text-2xl font-normal text-white [font-variant-numeric:tabular-nums]">
            {completedExercises} <span className="text-sm text-[#64748b]">/ {totalExercises}</span>
          </span>
          <span className="mt-1 block text-xs text-[#64748b]">Interactive candle replay</span>
        </div>

        <div className="p-4 sm:p-5">
          <span className="block text-xs text-[#94a3b8]">Overall completion</span>
          <span className="mt-1.5 block text-2xl font-normal text-white [font-variant-numeric:tabular-nums]">
            {overallPercentage}%
          </span>
          <span className="mt-1 block text-xs text-[#64748b]">Synced across devices</span>
        </div>
      </section>

      {/* Core Curriculum Tracks & Inline Syllabus Rows */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-white">
            Core curriculum
          </h2>
          <span className="text-xs text-[#94a3b8] [font-variant-numeric:tabular-nums]">
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
                className="rounded-lg border border-[#1a2030] bg-[#0a0f1a] overflow-hidden"
              >
                {/* Track Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 border-b border-[#1a2030]">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-semibold text-white">
                        <Link
                          href={`/dashboard/academy/${track.id}`}
                          className="hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
                        >
                          {track.title}
                        </Link>
                      </h3>
                      <span
                        className={`text-xs ${
                          track.isFree ? 'text-[#3fc07a]' : 'text-[#94a3b8]'
                        }`}
                      >
                        · {track.isFree ? 'Free access' : 'Member access'}
                      </span>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      {track.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs flex-shrink-0 [font-variant-numeric:tabular-nums]">
                    <span className="text-[#94a3b8]">
                      {completedCount}/{trackLessons.length} done · {track.estimatedHours}h
                    </span>
                    <Link
                      href={`/dashboard/academy/${track.id}`}
                      className="text-white hover:text-[#cbd5e1] underline underline-offset-2 font-medium"
                    >
                      Open track
                    </Link>
                  </div>
                </div>

                {/* Lesson Rows */}
                <div className="divide-y divide-[#141a26]">
                  {trackLessons.map((lesson) => {
                    const isDone = progress.completedLessonIds.includes(lesson.id)
                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/academy/${track.id}/${lesson.slug || lesson.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-2.5 text-xs hover:bg-[#111726] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              isDone ? 'bg-[#3fc07a]' : 'bg-[#2e3852]'
                            }`}
                          />
                          <span className="text-[#e2e8f0] font-medium truncate">
                            {lesson.title}
                          </span>
                          <span className="hidden md:inline text-[#64748b] truncate">
                            {lesson.moduleTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[#94a3b8] flex-shrink-0 pl-4 sm:pl-0 [font-variant-numeric:tabular-nums]">
                          {lesson.chartExercise && (
                            <span className="text-[#cbd5e1]">Chart replay</span>
                          )}
                          {lesson.macroEvent && (
                            <span className="text-[#cbd5e1]">Macro release</span>
                          )}
                          <span className="w-14 text-right">{lesson.readingTimeMinutes} min</span>
                          <span
                            className={`w-16 text-right ${
                              isDone ? 'text-[#3fc07a]' : 'text-[#94a3b8]'
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

      {/* Phase 2 Planned Syllabus Table */}
      <section className="space-y-3 pt-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-white">
            Phase 2 syllabus outlines
          </h2>
          <span className="text-xs text-[#94a3b8] [font-variant-numeric:tabular-nums]">
            {PHASE2_TRACKS.length} planned tracks
          </span>
        </div>

        <div className="rounded-lg border border-[#1a2030] bg-[#0a0f1a] divide-y divide-[#141a26]">
          {PHASE2_TRACKS.map((track) => {
            const lessonCount = track.modules.flatMap((m) => m.lessons).length
            return (
              <div
                key={track.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-3.5 text-xs"
              >
                <div className="space-y-0.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{track.title}</span>
                    <span className="text-[#64748b]">· {track.tagline}</span>
                  </div>
                  <p className="text-[#94a3b8] line-clamp-1">
                    {track.modules.map((m) => m.title).join(' · ')}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[#94a3b8] flex-shrink-0 [font-variant-numeric:tabular-nums]">
                  <span>{lessonCount} lessons</span>
                  <span className="w-10 text-right">{track.estimatedHours}h</span>
                  <span className="text-[#64748b] w-16 text-right">Planned</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Quiet Regulatory Footnote */}
      <EsmaLossBanner />
    </div>
  )
}
