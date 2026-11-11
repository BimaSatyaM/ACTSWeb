'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { MacroEventModal, EconomicEvent, NewsArticle } from '@/components/dashboard/MacroEventModal'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
})

interface NewsApiResponse {
  articles: NewsArticle[]
  macro_events: EconomicEvent[]
  fetched_at: string
}

export function UpcomingFedCard({ className = '' }: { className?: string }) {
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null)

  const { data, isLoading } = useSWR<NewsApiResponse>('/api/news', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  })

  const events = data?.macro_events || []
  const articles = data?.articles || []

  // Ensure macroeconomic events are sorted strictly ascending chronologically: Today first, Tomorrow second
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(a.date_time).getTime() || 0
    const timeB = new Date(b.date_time).getTime() || 0
    return timeA - timeB
  })

  const formatCalendarBadge = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      if (d.toDateString() === now.toDateString()) return 'TODAY'
      const tomorrow = new Date(now.getTime() + 86400000)
      if (d.toDateString() === tomorrow.toDateString()) return 'TOMORROW'
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return 'UPCOMING'
    }
  }

  const formatEventTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <>
      <div className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#0d121f]/90 to-[#070b14]/90 border border-white/[0.08] backdrop-blur-xl flex flex-col justify-between shadow-xl space-y-4 ${className}`}>
        {/* ── Event List (Top 3 Upcoming High-Impact Releases) ── */}
        {isLoading && events.length === 0 ? (
          <div className="space-y-3 py-2 animate-pulse flex-1">
            <div className="h-16 bg-white/[0.04] rounded-xl" />
            <div className="h-16 bg-white/[0.04] rounded-xl" />
            <div className="h-16 bg-white/[0.04] rounded-xl" />
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-secondary flex-1 flex items-center justify-center">
            No high-impact releases scheduled for the current session.
          </div>
        ) : (
          <div className="space-y-2 flex-1">
            {sortedEvents.slice(0, 3).map((ev, idx) => {
              const isHigh = ev.impact === 'HIGH'
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedEvent(ev)}
                  role="button"
                  tabIndex={0}
                  className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group overflow-hidden cursor-pointer border border-transparent hover:border-white/[0.06]"
                >
                  {/* Visual Media Thumbnail or Date Badge */}
                  {ev.image_url ? (
                    <div className="w-16 h-12 flex-shrink-0 relative overflow-hidden rounded-lg bg-black/40 border border-white/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ev.image_url}
                        alt={ev.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-0.5">
                        <span className="text-[7px] font-mono font-bold text-cyan-300 uppercase tracking-wider bg-black/80 px-1 py-0.2 rounded">
                          {formatCalendarBadge(ev.date_time)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-12 flex-shrink-0 flex flex-col items-center justify-center rounded-lg bg-white/[0.02] border border-white/[0.06] text-center p-1">
                      <span className="text-xs mb-0.5">🏛️</span>
                      <span className="text-[8px] font-mono font-bold text-cyan-300 tracking-wider">USD EVENT</span>
                    </div>
                  )}

                  {/* Event Text & Impact */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        {formatCalendarBadge(ev.date_time)} · {formatEventTime(ev.date_time)}
                      </span>
                      <span
                        className={`text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                          isHigh
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        }`}
                      >
                        {ev.impact}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors leading-snug">
                      {ev.title}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                      <div className="flex items-center gap-2">
                        {ev.forecast && (
                          <span>F: <strong className="text-zinc-200 font-semibold">{ev.forecast}</strong></span>
                        )}
                        {ev.previous && (
                          <span>P: <strong className="text-text-muted">{ev.previous}</strong></span>
                        )}
                      </div>

                      {ev.actual ? (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {ev.actual}
                        </span>
                      ) : (
                        <span className="text-[9px] text-cyan-400 group-hover:underline flex items-center gap-0.5">
                          <span>Details</span>
                          <span>→</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Footer Link to Live News & Sentiment AI ── */}
        <div className="pt-2 border-t border-white/[0.04]">
          <Link
            href="/dashboard/news"
            className="w-full flex items-center justify-between py-2 text-white text-xs font-semibold transition-all group hover:text-cyan-400"
          >
            <div className="flex items-center gap-2">
              <span className="text-accent-theme">📡</span>
              <span>Live News & Macro Sentiment AI</span>
            </div>
            <span className="group-hover:translate-x-0.5 transition-transform text-text-muted">→</span>
          </Link>
        </div>
      </div>

      {/* ── Interactive In-App Federal Event Detail Modal ── */}
      <MacroEventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        articles={articles}
      />
    </>
  )
}
