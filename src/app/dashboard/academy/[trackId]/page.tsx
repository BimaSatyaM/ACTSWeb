'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getTrackById } from '@/data/academy'
import { useAuth } from '@/context/AuthContext'
import { useAcademyProgress } from '@/hooks/useAcademyProgress'
import { AcademyUnlockModal } from '@/components/academy/AcademyUnlockModal'
import { EsmaLossBanner } from '@/components/academy/EsmaLossBanner'

export default function TrackOverviewPage() {
  const params = useParams()
  const trackId = (params?.trackId as string) || ''
  const track = getTrackById(trackId)

  const { profile } = useAuth()
  const { isLessonCompleted } = useAcademyProgress()

  const isApproved = profile?.approved === true
  const hasAcceptedRules = profile?.rulesAccepted === true
  const isUnlocked = isApproved && hasAcceptedRules

  if (!track) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Track not found</h1>
        <p className="text-xs text-slate-600">
          The requested curriculum track does not exist.
        </p>
        <Link
          href="/dashboard/academy"
          className="inline-flex h-8 items-center rounded-lg bg-[#0369a1] px-3.5 text-xs font-semibold text-white hover:bg-[#0284c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
        >
          Back to Academy
        </Link>
      </div>
    )
  }

  const allLessons = track.modules.flatMap((m) => m.lessons)
  const totalLessons = allLessons.length
  const completedCount = allLessons.filter((l) => isLessonCompleted(l.id)).length
  const trackPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const nextLesson = allLessons.find((l) => !isLessonCompleted(l.id)) || allLessons[0]

  // Track Gating Defense Check: Non-free tracks require unlocked account
  const isTrackGated = !track.isFree && !isUnlocked

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link
          href="/dashboard/academy"
          className="hover:text-[#0369a1] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
        >
          Trading Academy
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate">{track.title}</span>
      </nav>

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-900/10 pb-5">
        <div className="space-y-1.5 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {track.title}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {track.description}
          </p>
        </div>

        {nextLesson && (!isTrackGated || nextLesson.isFree) ? (
          <Link
            href={`/dashboard/academy/${track.id}/${nextLesson.slug || nextLesson.id}`}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#0369a1] px-4 text-xs font-semibold text-white hover:bg-[#0284c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] self-start sm:self-auto flex-shrink-0"
          >
            <span>{completedCount > 0 ? 'Continue lesson' : 'Start track'}</span>
          </Link>
        ) : null}
      </header>

      <section
        aria-label="Track Summary"
        className="rounded-xl border border-slate-900/10 bg-[#faf2df] grid grid-cols-3 divide-x divide-slate-900/10"
      >
        <div className="p-4 sm:px-5">
          <span className="block text-xs font-medium text-slate-500">Lessons completed</span>
          <span className="mt-1 block text-xl font-bold text-slate-900 font-mono tabular-nums">
            {completedCount} <span className="text-xs font-normal text-slate-500">/ {totalLessons} ({trackPct}%)</span>
          </span>
        </div>

        <div className="p-4 sm:px-5">
          <span className="block text-xs font-medium text-slate-500">Modules</span>
          <span className="mt-1 block text-xl font-bold text-slate-900 font-mono tabular-nums">
            {track.modules.length}
          </span>
        </div>

        <div className="p-4 sm:px-5">
          <span className="block text-xs font-medium text-slate-500">Estimated time</span>
          <span className="mt-1 block text-xl font-bold text-slate-900 font-mono tabular-nums">
            {track.estimatedHours} <span className="text-xs font-normal text-slate-500">hours</span>
          </span>
        </div>
      </section>

      {isTrackGated && (
        <section aria-label="Member Access Gate">
          <AcademyUnlockModal mode="inline" trackTitle={track.title} />
        </section>
      )}

      <section className="space-y-5">
        <h2 className="text-base font-bold text-slate-900">
          Syllabus
        </h2>

        <div className="space-y-4">
          {track.modules.map((module) => (
            <div
              key={module.id}
              className="rounded-2xl border border-slate-900/10 bg-[#faf2df] overflow-hidden"
            >
              <div className="border-b border-slate-900/10 bg-[#f3ead2]/50 p-4 sm:px-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {module.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">{module.description}</p>
                </div>
                <span className="text-xs text-slate-500 font-medium flex-shrink-0 font-mono tabular-nums">
                  {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                </span>
              </div>

              <div className="divide-y divide-slate-900/10">
                {module.lessons.map((lesson) => {
                  const isCompleted = isLessonCompleted(lesson.id)
                  const isLocked = isTrackGated && !lesson.isFree
                  const isNext = nextLesson?.id === lesson.id && !isCompleted

                  const rowContent = (
                    <div
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-3 text-xs transition-colors ${
                        isNext ? 'border-l-2 border-l-[#0369a1] bg-[#e0f2fe]/40' : ''
                      } ${!isLocked ? 'hover:bg-[#f3ead2]/60' : ''}`}
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              isCompleted
                                ? 'bg-emerald-600'
                                : isNext
                                ? 'bg-[#0369a1]'
                                : 'bg-slate-400'
                            }`}
                          />
                          <h4 className="text-sm font-semibold text-slate-900 truncate">
                            {lesson.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 pl-4">
                          {lesson.learningObjectives?.[0] || 'Core trading principles and application.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0 pl-4 sm:pl-0 font-mono tabular-nums">
                        {lesson.chartExercise && (
                          <span className="text-[#0369a1] font-medium">Chart replay</span>
                        )}
                        {lesson.macroEvent && (
                          <span className="text-amber-800 font-medium">Macro release</span>
                        )}
                        <span className="w-16 text-right">
                          {lesson.readingTimeMinutes} min
                        </span>
                        <span
                          className={`w-16 text-right font-medium ${
                            isCompleted
                              ? 'text-emerald-700 font-semibold'
                              : isLocked
                              ? 'text-slate-500'
                              : 'text-[#0369a1] font-semibold'
                          }`}
                        >
                          {isCompleted ? 'Done' : isLocked ? 'Locked' : 'Open'}
                        </span>
                      </div>
                    </div>
                  )

                  if (isLocked) {
                    return (
                      <div key={lesson.id} className="opacity-60 cursor-not-allowed">
                        {rowContent}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={lesson.id}
                      href={`/dashboard/academy/${track.id}/${lesson.slug || lesson.id}`}
                      className="block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
                    >
                      {rowContent}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <EsmaLossBanner />
    </div>
  )
}
