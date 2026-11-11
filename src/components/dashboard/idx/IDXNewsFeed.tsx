'use client'

import React, { useState, useMemo } from 'react'
import { IDXNewsArticle } from '@/lib/idxNews'

interface Props {
  articles: IDXNewsArticle[]
}

export function IDXNewsFeed({ articles }: Props) {
  const [search, setSearch] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'>('ALL')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchText =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.source.toLowerCase().includes(search.toLowerCase()) ||
        a.tickers.some((t) => t.toLowerCase().includes(search.toLowerCase()))

      const matchSentiment = sentimentFilter === 'ALL' || a.sentiment === sentimentFilter
      const matchCategory = selectedCategory === 'ALL' || a.category === selectedCategory

      return matchText && matchSentiment && matchCategory
    })
  }, [articles, search, sentimentFilter, selectedCategory])

  return (
    <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 sm:p-6 space-y-5">
      {/* ── Toolbar: Search & Filters ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white font-mono">
              Live Indonesian Financial Wire
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CNBC &amp; Media Wire
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Streaming real-time Indonesian market news, sector rotation, and corporate earnings.
          </p>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search headline, emiten, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#070b14] border border-white/[0.08] text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ff2e54]/50 w-52 sm:w-64"
          />
        </div>
      </div>

      {/* ── Secondary Sentiment & Category Pills ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Sentiment:</span>
          {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSentimentFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sentimentFilter === st
                  ? 'bg-[#ff2e54] text-white'
                  : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Category:</span>
          {['ALL', 'CONGLOMERATE', 'MARKET_OVERVIEW', 'EARNINGS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white/[0.12] text-white border border-white/20'
                  : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Articles List ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg bg-[#070b14] border border-white/[0.06] p-8 text-center text-xs font-mono text-slate-500">
            No articles found matching criteria.
          </div>
        ) : (
          filtered.slice(0, 40).map((a) => {
            const isBullish = a.sentiment === 'BULLISH'
            const isBearish = a.sentiment === 'BEARISH'

            return (
              <div
                key={a.id}
                className="p-4 rounded-xl bg-[#070b14] border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-2.5 group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {a.tickers.map((t) => (
                      <span
                        key={t}
                        className="font-black text-white px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-400">
                      {a.source}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {a.publishedTimeAgo}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      isBullish
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isBearish
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-white/[0.06] text-slate-400'
                    }`}
                  >
                    {isBullish ? '▲ Bullish' : isBearish ? '▼ Bearish' : '● Neutral'}
                    {a.sentimentScore !== 0 && ` (${a.sentimentScore > 0 ? '+' : ''}${a.sentimentScore})`}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-brand-primary transition-colors leading-snug">
                  {a.title}
                </h4>

                {a.aiImpactSummary && (
                  <p className="text-[11px] font-mono text-slate-400 leading-relaxed bg-[#0d121f] p-2.5 rounded-lg border border-white/[0.06]">
                    <span className="text-brand-primary font-bold mr-1">AI Context:</span>
                    <span>{a.aiImpactSummary}</span>
                  </p>
                )}

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">{a.publishedAt.slice(0, 22)}</span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-brand-primary hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Read Article</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
