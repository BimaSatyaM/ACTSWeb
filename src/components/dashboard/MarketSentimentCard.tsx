'use client'

import React from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
})

interface SentimentData {
  sentiment_score: number
  bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH'
  speaker_entity?: string
  dominant_narrative: string
  confluence_impact?: string
  high_impact_warning: boolean
  key_factors: string[]
  evaluated_at: string
}

interface NewsApiResponse {
  articles: Array<{ title: string; source: string; category: string }>
  macro_events: Array<{ title: string; impact: string }>
  sentiment?: SentimentData
  fetched_at: string
}

export function MarketSentimentCard() {
  const { data } = useSWR<NewsApiResponse>('/api/news', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  })

  const sentiment: SentimentData = data?.sentiment || {
    sentiment_score: 0.0,
    bias: 'NEUTRAL',
    speaker_entity: 'Live Macro Desk',
    dominant_narrative: 'Monitoring global macro liquidity feeds and breaking Bitcoin catalysts...',
    confluence_impact: 'Factor 9 maintains neutral 0.0 pts posture pending session confirmation.',
    high_impact_warning: false,
    key_factors: [
      'Macro liquidity posture balanced across global sessions.',
      'Spot market orderflow and ETF net flows steady.'
    ],
    evaluated_at: data?.fetched_at || new Date().toISOString(),
  }

  const score = sentiment.sentiment_score ?? 0.0
  const normalizedPct = Math.max(0, Math.min(100, ((score + 1.0) / 2.0) * 100))

  const getBiasConfig = (bias: string) => {
    switch (bias) {
      case 'STRONG_BULLISH':
        return {
          label: 'Strong Bullish',
          points: '+10.0 pts',
          badgeClass: 'bg-emerald-50 text-emerald-800',
          scoreColor: 'text-emerald-700',
          indicatorColor: 'bg-emerald-600',
        }
      case 'BULLISH':
        return {
          label: 'Bullish Bias',
          points: '+10.0 pts',
          badgeClass: 'bg-emerald-50 text-emerald-800',
          scoreColor: 'text-emerald-700',
          indicatorColor: 'bg-emerald-600',
        }
      case 'BEARISH':
        return {
          label: 'Bearish Bias',
          points: '0.0 pts',
          badgeClass: 'bg-amber-50 text-amber-800',
          scoreColor: 'text-amber-700',
          indicatorColor: 'bg-amber-500',
        }
      case 'STRONG_BEARISH':
        return {
          label: 'Strong Bearish',
          points: '0.0 pts',
          badgeClass: 'bg-rose-50 text-rose-800',
          scoreColor: 'text-rose-700',
          indicatorColor: 'bg-rose-600',
        }
      default:
        return {
          label: 'Neutral',
          points: '0.0 pts',
          badgeClass: 'bg-slate-100 text-slate-700',
          scoreColor: 'text-slate-800',
          indicatorColor: 'bg-slate-500',
        }
    }
  }

  const config = getBiasConfig(sentiment.bias)

  const formatEvaluatedTime = (isoString?: string) => {
    if (!isoString) return 'Just now'
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Live'
    }
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#faf2df] border border-slate-900/10 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Macro &amp; Rumor Sentiment
          </h2>
          <span className="text-[10px] font-mono text-slate-500">· BTC/USDT Scope</span>
        </div>

        <div className="flex items-center gap-3 font-mono tabular-nums">
          {sentiment.high_impact_warning && (
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Macro Event Ahead ·
            </span>
          )}

          <div className={`text-xs font-bold ${config.scoreColor} flex items-center gap-1.5`}>
            <span>{config.label}</span>
            <span className="opacity-75 font-normal">({score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
            <span className="font-semibold text-slate-500 uppercase tracking-wider">Fundamental Bias Meter</span>
            <span className="text-slate-600 text-xs">
              Score <strong className={config.scoreColor}>{score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}</strong>
              <span className="text-slate-500 font-normal ml-1">[-1.0 to +1.0]</span>
            </span>
          </div>

          <div className="relative w-full h-2 rounded-full bg-slate-900/10 overflow-hidden">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-900/25 z-10" />
            <div
              className={`absolute top-0 bottom-0 w-2.5 rounded-full ${config.indicatorColor} transition-all duration-500 ease-out -ml-1 z-20`}
              style={{ left: `${normalizedPct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono tabular-nums">
            <span className="text-rose-700 font-semibold">Bearish (-1.0)</span>
            <span className="text-slate-500">Neutral (0.0)</span>
            <span className="text-emerald-700 font-semibold">Bullish (+1.0)</span>
          </div>
        </div>

        <div className="lg:col-span-7 lg:border-l border-slate-900/10 lg:pl-6 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
            <span className="font-bold uppercase tracking-wider text-[#0369a1]">
              Dominant Market Driver
            </span>
            {sentiment.speaker_entity && (
              <span className="text-slate-500">
                Source: <strong className="text-slate-900 font-semibold">{sentiment.speaker_entity}</strong>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-800 leading-relaxed">
            &ldquo;{sentiment.dominant_narrative}&rdquo;
          </p>

          {sentiment.confluence_impact && (
            <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1">
              <span className="text-[#0369a1] font-semibold font-mono text-[10px]">FACTOR 9:</span>
              <span className="text-slate-700">{sentiment.confluence_impact}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500 font-mono border-t border-slate-900/10">
        <div className="flex items-center gap-2 truncate">
          <span className="text-slate-500 uppercase tracking-wider">Top Catalyst:</span>
          <span className="text-slate-700 truncate">{sentiment.key_factors?.[0] || 'Spot ETF inflows and rate stability.'}</span>
        </div>

        <span className="text-slate-500 flex-shrink-0 tabular-nums">
          Updated: <strong className="text-slate-700 font-normal">{formatEvaluatedTime(sentiment.evaluated_at)}</strong>
        </span>
      </div>
    </div>
  )
}
