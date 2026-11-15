'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { MarketSentimentCard } from '@/components/dashboard/MarketSentimentCard'
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

const ITEMS_PER_PAGE = 5

export default function NewsSentimentPage() {
  const [filter, setFilter] = useState<'all' | 'rumor' | 'macro' | 'crypto'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMacroEvent, setSelectedMacroEvent] = useState<EconomicEvent | null>(null)

  const { data, isLoading } = useSWR<NewsApiResponse>('/api/news', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  })

  const articles = data?.articles || []
  const macroEvents = data?.macro_events || []

  // Ensure macroeconomic events are sorted strictly ascending chronologically: Today first, Tomorrow second
  const sortedMacroEvents = [...macroEvents].sort((a, b) => {
    const timeA = new Date(a.date_time).getTime() || 0
    const timeB = new Date(b.date_time).getTime() || 0
    return timeA - timeB
  })

  // Filter and deduplicate
  const filteredArticles = articles.filter((a) => {
    if (filter === 'all') return true
    return a.category === filter
  })

  // Strictly enforce max 25 items (5 pages * 5 items).
  const cappedArticles = filteredArticles.slice(0, 25)
  const totalPages = Math.max(1, Math.ceil(cappedArticles.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedArticles = cappedArticles.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const formatPubTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Recent'
    }
  }

  const formatCalendarDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      return `${weekday}, ${monthDay} · ${timePart}`
    } catch {
      return dateStr
    }
  }

  const formatCalendarBadge = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      if (d.getTime() < now.getTime() - 7200000) return 'RELEASED'
      if (d.toDateString() === now.toDateString()) return 'TODAY'
      const tomorrow = new Date(now.getTime() + 86400000)
      if (d.toDateString() === tomorrow.toDateString()) return 'TOMORROW'
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
    } catch {
      return 'UPCOMING'
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900/10 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Market News & Sentiment
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Real-time economic calendar schedule, breaking market rumors with verified media, and institutional macro intelligence evaluated for <strong className="text-slate-900 font-medium">Global Crypto & US Macro assets (BTC/USDT)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold font-mono">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span>Live Updated News</span>
          </div>

          <Link
            href="/dashboard/signals"
            className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline flex items-center gap-1 transition-colors"
          >
            <span>Live Signals</span>
            <span className="font-mono">→</span>
          </Link>
        </div>
      </div>

      <MarketSentimentCard />

      <div className="grid lg:grid-cols-12 items-start gap-8 border-t border-slate-900/10 pt-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/10 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Breaking News &amp; Rumors</h2>

            <div className="flex items-center gap-4 text-[11px] font-mono font-bold uppercase tracking-wider">
              {(['all', 'rumor', 'macro', 'crypto'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setFilter(cat)
                    setCurrentPage(1)
                  }}
                  className={`pb-1 border-b-2 transition-colors duration-150 cursor-pointer ${
                    filter === cat
                      ? 'border-[#0369a1] text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading && articles.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#faf2df] border border-slate-900/10 space-y-3">
              <div className="h-4 bg-slate-900/10 w-3/4 animate-pulse rounded" />
              <div className="h-4 bg-slate-900/5 w-1/2 animate-pulse rounded" />
              <div className="h-4 bg-slate-900/5 w-2/3 animate-pulse rounded" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-8 rounded-2xl text-center text-xs font-mono text-slate-500 bg-[#faf2df] border border-slate-900/10">
              No articles found in this category. Select All to view the full intelligence feed.
            </div>
          ) : (
            <div className="rounded-2xl bg-[#faf2df] border border-slate-900/10 p-5 space-y-4">
              <div className="divide-y divide-slate-900/10">
                {paginatedArticles.map((article, idx) => {
                  const isRumor = article.category === 'rumor'
                  const isMacro = article.category === 'macro'
                  return (
                    <a
                      key={idx}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-row items-start gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-[#f3ead2]/50 -mx-2 px-2 rounded-lg transition-colors duration-150 group"
                    >
                      {article.image_url && (
                        <div className="w-24 h-16 flex-shrink-0 relative overflow-hidden rounded-md bg-slate-900/5">
                          <img
                            src={article.image_url}
                            alt={article.title}
                            width={96}
                            height={64}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono tabular-nums">
                          <span className="font-bold text-slate-800 uppercase tracking-wider">{article.source}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-500">{formatPubTime(article.published_at)}</span>
                          <span className="text-slate-500">·</span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isRumor
                                ? 'text-amber-800'
                                : isMacro
                                ? 'text-[#0369a1]'
                                : 'text-slate-600'
                            }`}
                          >
                            {article.category}
                          </span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0369a1] transition-colors leading-snug line-clamp-2">
                          {article.title}
                        </h3>

                        <div className="text-[11px] font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                          Read full article →
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-900/10 text-xs font-mono tabular-nums">
                  <span className="text-slate-500 text-[11px]">
                    {(safePage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(safePage * ITEMS_PER_PAGE, cappedArticles.length)} of {cappedArticles.length}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="text-xs font-bold text-slate-700 hover:text-[#0369a1] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      ← Prev
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-1.5 py-0.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                            safePage === pageNum
                              ? 'border-[#0369a1] text-slate-900'
                              : 'border-transparent text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="text-xs font-bold text-slate-700 hover:text-[#0369a1] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Macroeconomic Calendar</h2>
              <span className="text-[10px] font-mono text-slate-500">
                (F = Forecast · P = Previous)
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0369a1]">
              High-Impact
            </span>
          </div>

          <div className="divide-y divide-slate-900/10">
            {sortedMacroEvents.slice(0, 5).map((ev, idx) => {
              const isHigh = ev.impact === 'HIGH'
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedMacroEvent(ev)}
                  className="w-full text-left py-3.5 first:pt-0 hover:bg-[#faf2df]/70 -mx-2 px-2 rounded-lg transition-colors duration-150 group cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0369a1] uppercase tracking-wider">
                        {formatCalendarBadge(ev.date_time)}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-600">{formatCalendarDate(ev.date_time)}</span>
                    </div>

                    <span
                      className={`font-bold uppercase tracking-wider flex-shrink-0 ${
                        isHigh ? 'text-rose-700' : 'text-amber-800'
                      }`}
                    >
                      {ev.impact}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#0369a1] transition-colors">
                    {ev.title}
                  </h3>

                  <div className="flex items-center justify-between pt-0.5 text-[11px] font-mono tabular-nums text-slate-500">
                    <div className="flex items-center gap-3">
                      {ev.forecast ? (
                        <span>F: <strong className="text-slate-900 font-semibold">{ev.forecast}</strong></span>
                      ) : (
                        <span>Forecast: <strong className="text-slate-500">N/A</strong></span>
                      )}
                      {ev.previous && (
                        <span>P: <strong className="text-slate-600">{ev.previous}</strong></span>
                      )}
                    </div>

                    <div>
                      {ev.actual ? (
                        <span className="text-[10px] uppercase font-bold text-emerald-700">
                          Actual: {ev.actual}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider text-[#0369a1] font-bold group-hover:underline">
                          Inspect →
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="border-t border-slate-900/10 pt-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="font-bold text-slate-700 uppercase tracking-wider">
                Factor 9 Confluence Execution
              </span>
              <span className="text-slate-500 tabular-nums">Max +10.0 pts</span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Macro alignment gives up to <strong className="text-slate-900">+10.0 pts</strong> for fundamental setups (ETF inflows, dovish Fed). Opposing sentiment awards <strong className="text-slate-900">0.0 pts</strong> to protect capital from macro shocks.
            </p>
          </div>
        </div>
      </div>

      <MacroEventModal
        event={selectedMacroEvent}
        onClose={() => setSelectedMacroEvent(null)}
        articles={articles}
      />
    </div>
  )
}
