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

      <div className="border-y border-slate-900/10 py-4 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
        <div className="space-y-1 lg:pr-6">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
            <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-[0.14em]">
              System Engine
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight tabular-nums">
            {isLoadingStatus ? 'Loading...' : (isOnline ? 'Active' : 'Offline')}
          </div>
          <span className="text-[11px] text-slate-600 font-mono tabular-nums block">
            Uptime {calculateUptime(statusData?.engine_started_at, now)}
          </span>
        </div>

        <div className="space-y-1 lg:border-l border-slate-900/10 lg:px-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-[0.14em]">
              Active Regime
            </span>
            <span className="text-[10px] font-mono text-[#0369a1] font-bold tabular-nums">
              {regimeData?.confidence ? `${(regimeData.confidence * 100).toFixed(0)}% CONF` : 'DYNAMIC'}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight truncate">
            {regimeData?.current_labels?.length
              ? regimeData.current_labels.join(' + ').replace(/_/g, ' ')
              : 'Trending / Breakout'}
          </div>
          <span className="text-[11px] text-slate-600 font-mono block">
            Multi-factor confluence active
          </span>
        </div>

        <div className="space-y-1 lg:border-l border-slate-900/10 lg:px-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
            <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-[0.14em]">
              Heartbeat Cycle
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
            {statusData?.minutes_since_last_event !== undefined
              ? `${statusData.minutes_since_last_event}m ago`
              : 'Real-time'}
          </div>
          <span className="text-[11px] text-slate-600 font-mono block">
            15m candle evaluation
          </span>
        </div>

        <div className="space-y-1 lg:border-l border-slate-900/10 lg:pl-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-[0.14em]">
              Last Signal
            </span>
            <span className="text-[10px] font-mono text-slate-600 font-semibold tabular-nums">
              {statusData?.latest_signal_at ? formatDate(statusData.latest_signal_at) : 'Real-time'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
            {statusData?.latest_signal_at ? formatTime(statusData.latest_signal_at) : 'Active'}
          </div>
          <span className="text-[11px] text-slate-600 font-mono block">
            Continuous autonomous feed
          </span>
        </div>
      </div>

      <PerformanceCurveCard />

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-[0.14em] font-bold text-slate-600">
                Latest Trading Signal
              </h2>
              <Link
                href="/dashboard/signals"
                className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline flex items-center gap-1 group"
              >
                <span>Live Chart & Signals</span>
                <span className="group-hover:translate-x-0.5 transition-transform font-mono">→</span>
              </Link>
            </div>

            {isLoadingSignals ? (
              <div className="p-6 rounded-2xl animate-pulse space-y-4 bg-[#faf2df] border border-slate-900/10">
                <div className="h-6 w-32 bg-slate-900/10 rounded-md" />
                <div className="h-16 bg-slate-900/5 rounded-lg" />
              </div>
            ) : !latestSignal ? (
              <div className="p-8 rounded-2xl text-center text-slate-500 text-xs font-mono bg-[#faf2df] border border-slate-900/10">
                No recent signals recorded. Indicators evaluating live market...
              </div>
            ) : (
              (() => {
                const payload = latestSignal.payload
                const setup = payload.setup_context
                const isSignal = payload.tier === 'SIGNAL'
                const isBuy = setup?.direction === 'BUY'

                return (
                  <div className={`p-5 sm:p-6 rounded-2xl bg-[#faf2df] border border-slate-900/10 border-t-2 ${isBuy ? 'border-t-emerald-600' : 'border-t-rose-600'} space-y-5`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/10 pb-4">
                      <div className="flex items-center gap-3">
                        <AssetIcon symbol={setup?.symbol || 'BTCUSDT'} size="md" />
                        <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                          {setup?.symbol || 'BTCUSDT'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${
                          isBuy ? 'text-emerald-700' : 'text-rose-700'
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
                        <span className="text-slate-500">·</span>
                        <Badge variant={isSignal ? 'SIGNAL' : 'WATCHLIST'}>
                          {payload.tier}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Confluence</span>
                          <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                            {payload.confluence_score.toFixed(1)}<span className="text-xs text-slate-500 font-normal">/100</span>
                          </span>
                        </div>
                        <div className="text-right border-l border-slate-900/10 pl-4">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Grade</span>
                          <span className="text-xs font-bold text-slate-800">
                            {payload.grade.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <MultiTierProgressTracker
                      symbol={setup?.symbol}
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

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-900/10 text-xs">
                      <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono tabular-nums">
                        <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Published {formatDate(latestSignal.published_at)} · {formatTime(latestSignal.published_at)}</span>
                      </div>

                      <Link
                        href="/dashboard/signals"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline group cursor-pointer"
                      >
                        <span>Open Execution Ticket</span>
                        <span className="group-hover:translate-x-0.5 transition-transform font-mono">→</span>
                      </Link>
                    </div>
                  </div>
                )
              })()
            )}
          </div>

          <div className="border-t border-slate-900/10 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Link
              href="/dashboard/auto-trading"
              className="group flex flex-col justify-between space-y-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284c7]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <BinanceLogo size="sm" variant="yellow" />
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0369a1] transition-colors">
                    Auto-Pilot Terminal
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-semibold">
                    · Algorithmic
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Non-custodial 24/7 cloud execution on Bitcoin Futures with bracket stops, scale-out targets, and trailing protection.
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                <span>BTCUSDT Futures · 1:2.0+ R:R</span>
                <span className="font-bold text-amber-800 group-hover:translate-x-0.5 transition-transform">
                  Configure →
                </span>
              </div>
            </Link>

            <Link
              href="/dashboard/calendar"
              className="group flex flex-col justify-between space-y-2.5 sm:border-l border-slate-900/10 sm:pl-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284c7]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#0284c7] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0369a1] transition-colors">
                    Performance Calendar
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#0369a1] font-semibold">
                    · Journal
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Daily outcome audit, session win rates, and target profit logs across historical sessions with multi-tier inspection.
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                <span>UTC Sessions · Trade Audits</span>
                <span className="font-bold text-[#0369a1] group-hover:translate-x-0.5 transition-transform">
                  Open Journal →
                </span>
              </div>
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-[0.14em] font-bold text-slate-600">
              Macro Releases
            </h2>
            <Link
              href="/dashboard/news"
              className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline flex items-center gap-1"
            >
              <span>All News</span>
              <span className="font-mono">→</span>
            </Link>
          </div>

          <UpcomingFedCard />
        </div>
      </div>

      <footer className="pt-6 pb-2 border-t border-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} ACTS (Adaptive Confluence Trading System).</span>
          <span className="hidden sm:inline text-slate-500">·</span>
          <span className="hidden sm:inline">All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span>Quantitative Execution Engine</span>
          <span className="text-slate-500">·</span>
          <span>v2.4.0 Multi-Regime</span>
        </div>
      </footer>
    </div>
  )
}
