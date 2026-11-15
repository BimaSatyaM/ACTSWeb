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
    <div className="rounded-xl bg-[#fdfaf3] border border-slate-900/10 p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Live Indonesian Financial Wire
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              CNBC &amp; Media Wire
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Streaming real-time Indonesian market news, sector rotation, and corporate earnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search headline, emiten, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#fdfaf3] border border-slate-900/15 text-xs font-mono text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:border-sky-600 w-52 sm:w-64"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Sentiment:</span>
          {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSentimentFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sentimentFilter === st
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
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
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-900/10">
        {filtered.length === 0 ? (
          <div className="rounded-lg bg-[#faf2df] border border-slate-900/10 p-8 text-center text-xs font-mono text-slate-500">
            No articles found matching criteria.
          </div>
        ) : (
          filtered.slice(0, 40).map((a) => {
            const isBullish = a.sentiment === 'BULLISH'
            const isBearish = a.sentiment === 'BEARISH'

            return (
              <div
                key={a.id}
                className="py-4 space-y-2.5 group first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {a.tickers.map((t) => (
                      <span
                        key={t}
                        className="font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-900/10"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-sans">
                      {a.source}
                    </span>
                    <span className="text-slate-500 text-[10px] tabular-nums">
                      {a.publishedTimeAgo}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      isBullish
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isBearish
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-900/10'
                    }`}
                  >
                    {isBullish ? '▲ Bullish' : isBearish ? '▼ Bearish' : '● Neutral'}
                    {a.sentimentScore !== 0 && ` (${a.sentimentScore > 0 ? '+' : ''}${a.sentimentScore})`}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-800 transition-colors leading-snug">
                  {a.title}
                </h4>

                {a.aiImpactSummary && (
                  <p className="border-l-2 border-sky-600 pl-3 py-0.5 text-xs text-slate-600 leading-relaxed font-mono">
                    <span className="text-[#0369a1] font-bold mr-1.5">Desk Summary:</span>
                    <span>{a.aiImpactSummary}</span>
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500 tabular-nums">{a.publishedAt.slice(0, 22)}</span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline flex items-center gap-1"
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
