'use client'

import React, { useState, useEffect, Suspense } from 'react'
import {
  IDXNewsArticle,
  IDXDisclosureItem,
} from '@/lib/idxNews'
import { IDXConglomerateRadar } from '@/components/dashboard/idx/IDXConglomerateRadar'
import { IDXDisclosuresCard } from '@/components/dashboard/idx/IDXDisclosuresCard'
import { IDXNewsFeed } from '@/components/dashboard/idx/IDXNewsFeed'

type ViewMode = 'ALL' | 'CONGLOMERATE' | 'DISCLOSURES' | 'WIRE'

interface MarketSentimentData {
  score: number
  posture: string
  bullishCount: number
  bearishCount: number
  neutralCount: number
}

function IDXNewsPageContent() {
  const [view, setView] = useState<ViewMode>('ALL')
  const [articles, setArticles] = useState<IDXNewsArticle[]>([])
  const [disclosures, setDisclosures] = useState<IDXDisclosureItem[]>([])
  const [sentiment, setSentiment] = useState<MarketSentimentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNews = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/idx/news')
      if (!res.ok) throw new Error('Failed to fetch IDX news intelligence')
      const data = await res.json()
      if (data.success) {
        setArticles(data.articles || [])
        setDisclosures(data.disclosures || [])
        setSentiment(data.marketSentiment || null)
      } else {
        throw new Error(data.error || 'Unknown error occurred')
      }
    } catch (err: any) {
      console.error('Error fetching IDX news:', err)
      setError(err.message || 'Error loading news intelligence')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const umaCount = disclosures.filter((d) => d.type === 'UMA' || d.type === 'SUSPENSI').length

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#fdfaf3] border border-slate-900/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Market Sentiment
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${
              sentiment && sentiment.score > 0.1 ? 'bg-emerald-600' : sentiment && sentiment.score < -0.1 ? 'bg-rose-600' : 'bg-sky-600'
            }`} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 truncate">
            {sentiment ? sentiment.posture : 'Analyzing...'}
          </div>
          <p className="text-[11px] font-mono text-sky-800 font-semibold tabular-nums">
            Score: {sentiment ? `${sentiment.score > 0 ? '+' : ''}${sentiment.score}` : '0.00'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#fdfaf3] border border-slate-900/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Bullish Catalysts
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {sentiment?.bullishCount || 0}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">Articles</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Acquisitions, buybacks &amp; earnings</p>
        </div>

        <div className="p-4 rounded-xl bg-[#fdfaf3] border border-slate-900/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Bearish Risks
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {sentiment?.bearishCount || 0}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">Articles</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Corrections &amp; foreign net sells</p>
        </div>

        <div className="p-4 rounded-xl bg-[#fdfaf3] border border-slate-900/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              BEI Disclosures &amp; UMA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
            {disclosures.length}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">
              ({umaCount} Alerts)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Regulatory filings &amp; surveillance</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#fdfaf3] border border-slate-900/10 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setView('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'ALL'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            All Intelligence
          </button>

          <button
            onClick={() => setView('CONGLOMERATE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'CONGLOMERATE'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            Conglomerate Radar
          </button>

          <button
            onClick={() => setView('DISCLOSURES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'DISCLOSURES'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            BEI Disclosures ({disclosures.length})
          </button>

          <button
            onClick={() => setView('WIRE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'WIRE'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            Financial Wire ({articles.length})
          </button>
        </div>

        <button
          onClick={fetchNews}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-[#faf2df]/80 hover:bg-[#faf2df] border border-slate-900/10 text-xs font-mono text-slate-600 hover:text-slate-900 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-[#fdfaf3] border border-slate-900/10 p-12 text-center space-y-3 shadow-xs">
          <div className="inline-block w-7 h-7 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-slate-600">
            Syncing live Indonesian news wire and conglomerate radar...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center space-y-2">
          <p className="text-sm font-bold text-rose-700">Failed to load news intelligence</p>
          <p className="text-xs font-mono text-slate-500">{error}</p>
          <button
            onClick={fetchNews}
            className="px-4 py-1.5 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {(view === 'ALL' || view === 'CONGLOMERATE') && (
            <IDXConglomerateRadar articles={articles} />
          )}

          {(view === 'ALL' || view === 'DISCLOSURES') && (
            <IDXDisclosuresCard disclosures={disclosures} />
          )}

          {(view === 'ALL' || view === 'WIRE') && (
            <IDXNewsFeed articles={articles} />
          )}
        </div>
      )}
    </div>
  )
}

export default function IDXNewsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl bg-[#fdfaf3] border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <div className="inline-block w-7 h-7 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-slate-600">Loading News &amp; Rumor Terminal...</p>
        </div>
      }
    >
      <IDXNewsPageContent />
    </Suspense>
  )
}
