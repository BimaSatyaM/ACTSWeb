'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Badge } from '@/components/ui/Badge'
import { StatusPill } from '@/components/ui/StatusPill'
import { AssetIcon } from '@/components/ui/AssetIcon'
import { PerformanceCurveCard } from '@/components/dashboard/PerformanceCurveCard'
import { MarketTickerBar } from '@/components/dashboard/MarketTickerBar'
import { UpcomingFedCard } from '@/components/dashboard/UpcomingFedCard'
import { MultiTierProgressTracker } from '@/components/dashboard/MultiTierProgressTracker'
import { BinanceLogo } from '@/components/ui/BinanceLogo'
import { useAuth } from '@/context/AuthContext'

const fetcher = (url: string) => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const headers: HeadersInit = {}
  if (anonKey) {
    headers['apikey'] = anonKey
    headers['Authorization'] = `Bearer ${anonKey}`
  }
  return fetch(url, { headers }).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    return res.json()
  })
}

interface ConfluenceFactor {
  factor_name: string
  points: number
}

interface SignalOutcome {
  system_outcome: 'PENDING' | 'TARGET_PROFIT_HIT' | 'STOP_LOSS_HIT'
  system_outcome_detail: string | null
  system_resolved_at: string | null
  status: string
  user_confirmed: boolean
  user_outcome: string | null
  user_confirmed_at: string | null
}

interface SignalEvent {
  event_id: string
  published_at: string
  outcome?: SignalOutcome | null
  payload: {
    tier: 'SIGNAL' | 'WATCHLIST'
    confluence_score: number
    grade: string
    regime_labels?: string[]
    setup_context?: {
      symbol: string
      direction: 'BUY' | 'SELL'
      entry_price: number
      stop_loss: number
      leverage: number
      risk_pct: number
      invalidation_clause?: string
      tp1?: { target_price: number; rr_ratio: number }
      tp2?: { target_price: number; rr_ratio: number }
      tp3?: { target_price: number; rr_ratio: number }
    }
    confluence_result?: {
      active_regimes?: string[]
      breakdown?: ConfluenceFactor[]
    }
  }
}

export default function DashboardOverview() {
  const { profile } = useAuth()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  const statusUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-status`
  const signalsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-signals?limit=1`
  const regimeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-regime`

  const { data: statusData, error: statusError } = useSWR(statusUrl, fetcher, { refreshInterval: 5000 })
  const { data: signalsData, error: signalsError } = useSWR(signalsUrl, fetcher, { refreshInterval: 5000 })
  const { data: regimeData } = useSWR(regimeUrl, fetcher, { refreshInterval: 10000 })

  const isOnline = statusData ? statusData.brain_online : false
  const isLoadingStatus = !statusData && !statusError
  const isLoadingSignals = !signalsData && !signalsError

  const signalsList: SignalEvent[] = signalsData?.signals || []
  const latestSignal = signalsList[0]

  const formatTime = (tsStr: string) => {
    try {
      const date = new Date(tsStr)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return tsStr
    }
  }

  const formatDate = (tsStr: string) => {
    try {
      const date = new Date(tsStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return tsStr
    }
  }

  const calculateUptime = (startedAt: string | null, nowVal: number) => {
    if (!startedAt) return 'N/A'
    try {
      const start = new Date(startedAt)
      const diff = nowVal - start.getTime()
      if (diff < 0) return '0m'
      const mins = Math.floor(diff / 60000)
      const hrs = Math.floor(mins / 60)
      const days = Math.floor(hrs / 24)
      if (days > 0) return `${days}d ${hrs % 24}h ${mins % 60}m`
      if (hrs > 0) return `${hrs}h ${mins % 60}m`
      return `${mins}m`
    } catch {
      return 'N/A'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <MarketTickerBar className="w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d121f]/80 hover:bg-[#0d121f] border border-white/[0.08] hover:border-emerald-500/30 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between space-y-3 shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider">System Engine</span>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400'}`} />
          </div>
          <div className="space-y-0.5">
            <span className="text-xl font-bold text-white tracking-tight block">
              {isLoadingStatus ? 'Loading...' : (isOnline ? 'Active' : 'Offline')}
            </span>
            <span className="text-[11px] text-text-secondary font-mono block">
              Uptime: {calculateUptime(statusData?.engine_started_at, now)}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d121f]/80 hover:bg-[#0d121f] border border-white/[0.08] hover:border-indigo-500/30 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between space-y-3 shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider">Active Regime</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
              {regimeData?.confidence ? `${(regimeData.confidence * 100).toFixed(0)}% Conf` : 'Dynamic'}
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg font-bold text-white tracking-tight truncate">
              {regimeData?.current_labels?.length 
                ? regimeData.current_labels.join(' + ').replace(/_/g, ' ') 
                : 'Trending / Breakout'}
            </div>
            <span className="text-[11px] text-text-secondary font-mono block">
              Multi-factor confluence active
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d121f]/80 hover:bg-[#0d121f] border border-white/[0.08] hover:border-cyan-500/30 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between space-y-3 shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider">Heartbeat Cycle</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xl font-bold text-white tracking-tight block">
              {statusData?.minutes_since_last_event !== undefined
                ? `${statusData.minutes_since_last_event}m ago`
                : 'Real-time'}
            </span>
            <span className="text-[11px] text-text-secondary font-mono block">
              15m candle evaluation
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d121f]/80 hover:bg-[#0d121f] border border-white/[0.08] hover:border-amber-500/30 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between space-y-3 shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider">Last Signal</span>
            <span className="text-[10px] font-mono text-zinc-400 font-semibold">
              {statusData?.latest_signal_at ? formatDate(statusData.latest_signal_at) : 'Real-time'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-xl font-bold text-white tracking-tight block">
              {statusData?.latest_signal_at ? formatTime(statusData.latest_signal_at) : 'Active'}
            </span>
            <span className="text-[11px] text-text-secondary font-mono block">
              Continuous autonomous feed
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0d121f]/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 shadow-xl">
        <PerformanceCurveCard />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-white">Latest Trading Signal</h2>
            <Link 
              href="/dashboard/signals" 
              className="text-xs font-semibold text-accent-theme hover:underline flex items-center gap-1 group"
            >
              <span>View Live Chart & Signals</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          {isLoadingSignals ? (
            <div className="p-6 rounded-2xl animate-pulse space-y-4 bg-[#0d121f]/80 border border-white/[0.08] backdrop-blur-md">
              <div className="h-6 w-32 bg-white/[0.06] rounded-md" />
              <div className="h-16 bg-white/[0.04] rounded-lg" />
            </div>
          ) : !latestSignal ? (
            <div className="p-8 rounded-2xl text-center text-text-secondary text-xs bg-[#0d121f]/80 border border-white/[0.08] backdrop-blur-md">
              No recent signals recorded. Indicators evaluating live market...
            </div>
          ) : (
            (() => {
              const payload = latestSignal.payload
              const setup = payload.setup_context
              const isSignal = payload.tier === 'SIGNAL'
              const isBuy = setup?.direction === 'BUY'

              return (
                <div className={`p-5 sm:p-6 rounded-2xl bg-[#0d121f]/90 border ${isBuy ? 'border-emerald-500/25 hover:border-emerald-500/40' : 'border-rose-500/25 hover:border-rose-500/40'} backdrop-blur-xl space-y-5 shadow-xl transition-all duration-200`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                    <div className="flex items-center gap-3">
                      <AssetIcon symbol={setup?.symbol || 'BTCUSDT'} size="md" />
                      <span className="text-xl font-extrabold text-white tracking-tight">
                        {setup?.symbol || 'BTCUSDT'}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
                        isBuy 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                        {isBuy ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                            <polyline points="17 18 23 18 23 12" />
                          </svg>
                        )}
                        <span>{setup?.direction || (isBuy ? 'BUY' : 'SELL')}</span>
                      </span>
                      <Badge variant={isSignal ? 'SIGNAL' : 'WATCHLIST'}>
                        {payload.tier}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-text-muted uppercase tracking-wider block">Confluence Score</span>
                        <span className="text-base font-black text-white font-mono">
                          {payload.confluence_score.toFixed(1)}<span className="text-xs text-text-muted font-normal">/100</span>
                        </span>
                      </div>
                      <div className="text-right border-l border-white/[0.08] pl-3">
                        <span className="text-[10px] text-text-muted uppercase tracking-wider block">Grade</span>
                        <span className="text-xs font-bold text-zinc-200">
                          {payload.grade.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <MultiTierProgressTracker
                    entryPrice={setup?.entry_price || 0}
                    stopLoss={setup?.stop_loss || 0}
                    tp1={setup?.tp1}
                    tp2={setup?.tp2}
                    tp3={setup?.tp3}
                    direction={setup?.direction}
                    systemOutcome={latestSignal.outcome?.system_outcome}
                    systemOutcomeDetail={latestSignal.outcome?.system_outcome_detail}
                    status={latestSignal.outcome?.status}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-white/[0.06] text-xs">
                    <div className="flex items-center gap-2 text-text-muted text-[11px] font-mono">
                      <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Published at {formatDate(latestSignal.published_at)} • {formatTime(latestSignal.published_at)}</span>
                    </div>

                    <Link
                      href="/dashboard/signals"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-theme hover:underline group cursor-pointer"
                    >
                      <span>Open Live Chart & Telemetry</span>
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                  </div>
                </div>
              )
            })()
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative group rounded-2xl bg-[#0d121f]/90 hover:bg-[#0f172a]/95 border border-white/[0.08] hover:border-amber-500/30 backdrop-blur-xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BinanceLogo size="md" variant="yellow" />
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Auto-Pilot Terminal
                    </h3>
                    <span className="text-[10px] font-mono text-amber-400/90 tracking-wider uppercase font-semibold block">
                      Algorithmic Execution
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  Non-custodial 24/7 cloud execution on Bitcoin Futures with dynamic bracket stops, scale-out targets, and automated trailing protection.
                </p>

                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-1 text-[11px] font-mono text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90" />
                    <span>BTCUSDT Futures</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90" />
                    <span>Dynamic Bracket</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90" />
                    <span>1:2.0+ R:R</span>
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/dashboard/auto-trading"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline transition-all group/btn cursor-pointer"
                >
                  <span>Configure Auto-Pilot</span>
                  <span className="group-hover/btn:translate-x-1 transition-transform font-mono">→</span>
                </Link>
              </div>
            </div>

            <div className="relative group rounded-2xl bg-[#0d121f]/90 hover:bg-[#0f172a]/95 border border-white/[0.08] hover:border-cyan-500/30 backdrop-blur-xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-cyan-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Performance Calendar
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-400/90 tracking-wider uppercase font-semibold block">
                      Session Journal & Audit
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  Review daily trade outcomes, win rates, and target profit logs across historical market sessions with interactive multi-tier trade inspection.
                </p>

                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-1 text-[11px] font-mono text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/90" />
                    <span>Session Breakdown</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/90" />
                    <span>Win Rate Heatmap</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/90" />
                    <span>Trade Audits</span>
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/dashboard/calendar"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-all group/btn cursor-pointer"
                >
                  <span>Open Calendar</span>
                  <span className="group-hover/btn:translate-x-1 transition-transform font-mono">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-white">Upcoming Fed & Macro Events</h2>
            <Link 
              href="/dashboard/news" 
              className="text-xs font-semibold text-accent-theme hover:underline flex items-center gap-1"
            >
              <span>All News</span>
              <span>→</span>
            </Link>
          </div>

          <UpcomingFedCard />
        </div>
      </div>

      <footer className="pt-6 pb-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-text-muted font-mono">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} ACTS (Adaptive Confluence Trading System).</span>
          <span className="hidden sm:inline text-zinc-600">·</span>
          <span className="hidden sm:inline">All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span>Quantitative Execution Engine</span>
          <span className="text-zinc-600">·</span>
          <span>v2.4.0 Multi-Regime</span>
        </div>
      </footer>
    </div>
  )
}
