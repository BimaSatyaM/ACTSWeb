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
          badgeClass: 'bg-emerald-500/15 text-emerald-300',
          scoreColor: 'text-emerald-400',
          indicatorColor: 'bg-emerald-400',
        }
      case 'BULLISH':
        return {
          label: 'Bullish Bias',
          points: '+10.0 pts',
          badgeClass: 'bg-emerald-500/10 text-emerald-400',
          scoreColor: 'text-emerald-400',
          indicatorColor: 'bg-emerald-400',
        }
      case 'BEARISH':
        return {
          label: 'Bearish Bias',
          points: '0.0 pts',
          badgeClass: 'bg-amber-500/10 text-amber-400',
          scoreColor: 'text-amber-400',
          indicatorColor: 'bg-amber-400',
        }
      case 'STRONG_BEARISH':
        return {
          label: 'Strong Bearish',
          points: '0.0 pts',
          badgeClass: 'bg-rose-500/15 text-rose-300',
          scoreColor: 'text-rose-400',
          indicatorColor: 'bg-rose-400',
        }
      default:
        return {
          label: 'Neutral',
          points: '0.0 pts',
          badgeClass: 'bg-zinc-500/10 text-zinc-300',
          scoreColor: 'text-zinc-200',
          indicatorColor: 'bg-zinc-300',
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
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#0d121f]/90 via-[#0d121f]/70 to-[#070b14]/90 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            Macro & Rumor Sentiment
          </h2>
          <span className="text-[10px] font-mono text-text-muted">· BTC/USDT Scope</span>
        </div>

        <div className="flex items-center gap-3">
          {sentiment.high_impact_warning && (
            <span className="text-[11px] font-mono font-semibold text-amber-400 flex items-center gap-1">
              <span>⚠️</span>
              <span>Macro Event Ahead</span>
            </span>
          )}

          <div className={`text-xs font-bold font-mono ${config.scoreColor} flex items-center gap-1.5`}>
            <span>{config.label}</span>
            <span className="opacity-75 font-normal">({score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)})</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider font-mono">Fundamental Bias Meter</span>
          <span className="font-mono text-text-secondary text-xs">
            Score: <strong className={config.scoreColor}>{score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}</strong>
            <span className="text-text-muted font-normal ml-1 font-mono">[-1.0 to +1.0]</span>
          </span>
        </div>

        <div className="relative w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/[0.08]">
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/25 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/40 via-zinc-500/20 to-emerald-500/40" />
          <div
            className={`absolute top-0 bottom-0 w-2.5 rounded-full ${config.indicatorColor} shadow-md shadow-white/40 transition-all duration-700 ease-out -ml-1 z-20`}
            style={{ left: `${normalizedPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-text-muted font-mono">
          <span className="text-rose-400 font-medium">Bearish (-1.0)</span>
          <span className="text-zinc-400">Neutral (0.0)</span>
          <span className="text-emerald-400 font-medium">Bullish (+1.0)</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20 space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Dominant Market Driver</span>
          </span>
          {sentiment.speaker_entity && (
            <span className="font-mono text-text-muted">
              Source: <strong className="text-zinc-200 font-semibold">{sentiment.speaker_entity}</strong>
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-200 italic leading-relaxed">
          &ldquo;{sentiment.dominant_narrative}&rdquo;
        </p>

        {sentiment.confluence_impact && (
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5 pt-1.5 border-t border-white/[0.06]">
            <span className="text-cyan-400 font-semibold font-mono text-[10px]">Factor 9:</span>
            <span className="text-zinc-300">{sentiment.confluence_impact}</span>
          </div>
        )}
      </div>

      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-text-muted font-mono border-t border-white/[0.04]">
        <div className="flex items-center gap-2 truncate">
          <span className="text-text-muted uppercase tracking-wider">Top Catalyst:</span>
          <span className="text-text-secondary truncate">{sentiment.key_factors?.[0] || 'Spot ETF inflows and rate stability.'}</span>
        </div>

        <span className="text-text-muted flex-shrink-0">
          Updated: <strong className="text-text-secondary font-normal">{formatEvaluatedTime(sentiment.evaluated_at)}</strong>
        </span>
      </div>
    </div>
  )
}
