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
      {/* ── Top KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Market Sentiment Posture */}
        <div className="p-4 rounded-xl bg-[#0d121f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Market Sentiment
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${
              sentiment && sentiment.score > 0.1 ? 'bg-emerald-400' : sentiment && sentiment.score < -0.1 ? 'bg-rose-400' : 'bg-cyan-400'
            }`} />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white truncate">
            {sentiment ? sentiment.posture : 'Analyzing...'}
          </div>
          <p className="text-[11px] font-mono text-cyan-400">
            Score: {sentiment ? `${sentiment.score > 0 ? '+' : ''}${sentiment.score}` : '0.00'}
          </p>
        </div>

        {/* Card 2: Bullish Catalysts */}
        <div className="p-4 rounded-xl bg-[#0d121f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Bullish Catalysts
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {sentiment?.bullishCount || 0}{' '}
            <span className="text-xs font-normal text-slate-400">Articles</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Acquisitions, buybacks &amp; earnings</p>
        </div>

        {/* Card 3: Bearish Risks */}
        <div className="p-4 rounded-xl bg-[#0d121f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Bearish Risks
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {sentiment?.bearishCount || 0}{' '}
            <span className="text-xs font-normal text-slate-400">Articles</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Corrections &amp; foreign net sells</p>
        </div>

        {/* Card 4: Official Disclosures & UMA */}
        <div className="p-4 rounded-xl bg-[#0d121f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              BEI Disclosures &amp; UMA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {disclosures.length}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({umaCount} Alerts)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Regulatory filings &amp; surveillance</p>
        </div>
      </div>

      {/* ── View Switcher Toolbar ── */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0d121f] border border-white/[0.08]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setView('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'ALL'
                ? 'bg-[#ff2e54] text-white border border-[#ff2e54]'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            ⚡ All Intelligence
          </button>

          <button
            onClick={() => setView('CONGLOMERATE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'CONGLOMERATE'
                ? 'bg-[#ff2e54] text-white border border-[#ff2e54]'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            🏢 Conglomerate Radar
          </button>

          <button
            onClick={() => setView('DISCLOSURES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'DISCLOSURES'
                ? 'bg-[#ff2e54] text-white border border-[#ff2e54]'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            🏛️ BEI Disclosures ({disclosures.length})
          </button>

          <button
            onClick={() => setView('WIRE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'WIRE'
                ? 'bg-[#ff2e54] text-white border border-[#ff2e54]'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            📰 Financial Wire ({articles.length})
          </button>
        </div>

        <button
          onClick={fetchNews}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-[#070b14] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-slate-400 hover:text-white transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Content Body ── */}
      {loading ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-12 text-center space-y-3">
          <div className="inline-block w-7 h-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-text-secondary">
            Syncing live Indonesian news wire and conglomerate radar...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-6 text-center space-y-2">
          <p className="text-sm font-bold text-rose-400">Failed to load news intelligence</p>
          <p className="text-xs font-mono text-text-muted">{error}</p>
          <button
            onClick={fetchNews}
            className="px-4 py-1.5 rounded-lg bg-white/[0.08] text-xs font-bold text-white hover:bg-white/[0.12] transition-colors"
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
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-12 text-center space-y-3">
          <div className="inline-block w-7 h-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-text-secondary">Loading News &amp; Rumor Terminal...</p>
        </div>
      }
    >
      <IDXNewsPageContent />
    </Suspense>
  )
}
