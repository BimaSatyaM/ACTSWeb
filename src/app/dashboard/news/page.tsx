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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Market News & Sentiment
          </h1>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Real-time economic calendar schedule, breaking market rumors with verified media, and institutional macro intelligence evaluated for <strong className="text-zinc-300 font-medium">Global Crypto & US Macro assets (BTC/USDT)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Updated News</span>
          </div>

          <Link
            href="/dashboard/signals"
            className="text-xs font-semibold text-accent-theme hover:underline flex items-center gap-1 transition-colors"
          >
            <span>Live Signals</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      <MarketSentimentCard />

      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-white/[0.06] items-start gap-8 lg:gap-0 border-t border-white/[0.06]">
        <div className="space-y-4 lg:pr-6 pb-8 lg:pb-0 pt-6 border-b border-white/[0.06] lg:border-b-0">
          <div className="h-10 flex items-center justify-between px-1 border-b border-transparent">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Breaking News & Rumors</h2>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              {(['all', 'rumor', 'macro', 'crypto'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setFilter(cat)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    filter === cat
                      ? 'bg-accent-theme text-white shadow-[0_0_12px_rgba(255,46,84,0.35)]'
                      : 'text-text-muted hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading && articles.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0d111c]/75 border border-white/[0.08] backdrop-blur-md space-y-3">
              <div className="h-4 bg-white/[0.06] w-3/4 animate-pulse rounded" />
              <div className="h-4 bg-white/[0.04] w-1/2 animate-pulse rounded" />
              <div className="h-4 bg-white/[0.04] w-2/3 animate-pulse rounded" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-8 rounded-2xl text-center text-xs text-text-secondary bg-[#0d111c]/75 border border-white/[0.08]">
              No articles found in this category.
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedArticles.map((article, idx) => {
                const isRumor = article.category === 'rumor'
                const isMacro = article.category === 'macro'
                return (
                  <a
                    key={idx}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-row items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-200 group overflow-hidden h-[120px] shadow-sm"
                  >
                    {article.image_url ? (
                      <div className="w-28 h-20 flex-shrink-0 relative overflow-hidden rounded-lg bg-[#141926]">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-lg bg-white/[0.02] text-text-muted text-[10px] font-mono border border-white/[0.04]">
                        <span className="text-xl mb-1">📰</span>
                        <span>{article.source}</span>
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className="font-bold text-zinc-300 uppercase tracking-wider font-mono">{article.source}</span>
                        <span className="text-text-muted">·</span>
                        <span className="font-mono text-text-muted">{formatPubTime(article.published_at)}</span>
                        <span className="text-text-muted">·</span>
                        <span
                          className={`text-[9px] font-mono font-medium uppercase tracking-wider ${
                            isRumor
                              ? 'text-amber-400'
                              : isMacro
                              ? 'text-cyan-400'
                              : 'text-text-muted'
                          }`}
                        >
                          {article.category}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-accent-theme transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h3>

                      <div className="flex items-center gap-1 text-[11px] font-medium text-text-muted group-hover:text-white transition-colors">
                        <span>Read full article</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </div>
                    </div>
                  </a>
                )
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                  <span className="text-text-muted text-[11px] font-mono">
                    Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, cappedArticles.length)} of {cappedArticles.length} (Page {safePage} of {totalPages})
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none border border-white/[0.08] text-zinc-300 transition-colors"
                    >
                      ← Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 flex items-center justify-center text-xs font-mono font-bold rounded-lg transition-all ${
                          safePage === pageNum
                            ? 'bg-accent-theme text-white shadow-[0_0_10px_rgba(255,46,84,0.4)]'
                            : 'bg-white/[0.03] text-text-muted hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none border border-white/[0.08] text-zinc-300 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:pl-6 pt-6">
          <div className="h-10 flex items-center justify-between px-1 border-b border-transparent">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-white">Macroeconomic Calendar</h2>
              <span className="text-[10px] font-mono text-text-muted">
                (F = Forecast · P = Previous)
              </span>
            </div>
            <div className="flex items-center p-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                High-Impact Events
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {sortedMacroEvents.slice(0, 5).map((ev, idx) => {
              const isHigh = ev.impact === 'HIGH'
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedMacroEvent(ev)}
                  role="button"
                  tabIndex={0}
                  className="flex flex-row items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-cyan-500/30 transition-all duration-200 group overflow-hidden h-[120px] cursor-pointer shadow-sm"
                >
                  {ev.image_url ? (
                    <div className="w-28 h-20 flex-shrink-0 relative overflow-hidden rounded-lg bg-black/40">
                      <img
                        src={ev.image_url}
                        alt={ev.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[8px] font-mono font-bold text-cyan-300 uppercase tracking-wider bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
                          {formatCalendarBadge(ev.date_time)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-28 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-lg bg-white/[0.02] text-center p-1.5 border border-white/[0.04]">
                      <span className="text-lg mb-0.5">🏛️</span>
                      <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider">USD EVENT</span>
                      <span className="text-[9px] font-mono font-bold text-text-muted mt-0.5">{formatCalendarBadge(ev.date_time)}</span>
                    </div>
                  )}

                  <div className="space-y-1 flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-zinc-300 uppercase tracking-wider font-mono">FEDERAL RELEASE</span>
                        <span className="text-text-muted">·</span>
                        <span className="font-mono text-text-muted">{formatCalendarDate(ev.date_time)}</span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider flex-shrink-0 ${
                          isHigh ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {ev.impact}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
                      {ev.title}
                    </h3>

                    <div className="flex items-center justify-between pt-0.5 text-[11px] font-mono text-text-muted">
                      <div className="flex items-center gap-3">
                        {ev.forecast ? (
                          <span>F: <strong className="text-zinc-200 font-semibold">{ev.forecast}</strong></span>
                        ) : (
                          <span>Forecast: <strong className="text-text-muted">N/A</strong></span>
                        )}
                        {ev.previous && (
                          <span>P: <strong className="text-text-muted">{ev.previous}</strong></span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 font-mono">
                        {ev.actual ? (
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20">
                            Actual: {ev.actual}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-cyan-400 group-hover:underline flex items-center gap-1">
                            <span>DETAILS</span>
                            <span>→</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-3.5 bg-transparent space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Factor 9 Confluence Execution
              </span>
              <span className="text-[10px] font-mono text-text-muted">Max +10.0 pts</span>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed">
              Macro alignment gives up to <strong className="text-zinc-200">+10.0 pts</strong> for fundamental setups (ETF inflows, dovish Fed). Opposing sentiment awards <strong className="text-zinc-200">0.0 pts</strong> to protect capital from macro shocks.
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
