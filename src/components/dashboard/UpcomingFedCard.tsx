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
      <div className={`p-5 sm:p-6 rounded-2xl bg-[#faf2df] border border-slate-900/10 flex flex-col justify-between space-y-4 ${className}`}>
        {isLoading && events.length === 0 ? (
          <div className="space-y-3 py-2 animate-pulse flex-1">
            <div className="h-14 border-b border-slate-900/10" />
            <div className="h-14 border-b border-slate-900/10" />
            <div className="h-14" />
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-mono flex-1 flex items-center justify-center">
            No high-impact releases scheduled for the current session.
          </div>
        ) : (
          <div className="divide-y divide-slate-900/10 flex-1">
            {sortedEvents.slice(0, 3).map((ev, idx) => {
              const isHigh = ev.impact === 'HIGH'
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full text-left py-3 first:pt-0 last:pb-0 hover:bg-[#f3ead2]/50 -mx-2 px-2 rounded-lg transition-colors duration-150 group cursor-pointer space-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums uppercase tracking-wider">
                    <span className="font-bold text-slate-500">
                      {formatCalendarBadge(ev.date_time)} · {formatEventTime(ev.date_time)}
                    </span>
                    <span
                      className={`font-extrabold ${
                        isHigh ? 'text-rose-700' : 'text-amber-800'
                      }`}
                    >
                      {ev.impact}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#0369a1] transition-colors leading-snug">
                    {ev.title}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500">
                    <div className="flex items-center gap-3">
                      {ev.forecast && (
                        <span>F: <strong className="text-slate-900 font-semibold">{ev.forecast}</strong></span>
                      )}
                      {ev.previous && (
                        <span>P: <strong className="text-slate-600">{ev.previous}</strong></span>
                      )}
                    </div>

                    {ev.actual ? (
                      <span className="text-[10px] font-bold text-emerald-700">
                        ACT {ev.actual}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#0369a1] group-hover:underline flex items-center gap-0.5">
                        <span>Inspect</span>
                        <span>→</span>
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="pt-3 border-t border-slate-900/10">
          <Link
            href="/dashboard/news"
            className="w-full flex items-center justify-between py-1 text-slate-900 text-xs font-semibold transition-colors group hover:text-[#0369a1]"
          >
            <span>Live News & Macro Sentiment Desk</span>
            <span className="group-hover:translate-x-0.5 transition-transform text-slate-500 font-mono">→</span>
          </Link>
        </div>
      </div>

      <MacroEventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        articles={articles}
      />
    </>
  )
}
