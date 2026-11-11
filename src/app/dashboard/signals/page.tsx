'use client'

import React, { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { AssetIcon } from '@/components/ui/AssetIcon'
import { TradingViewChart } from '@/components/dashboard/TradingViewChart'
import { MultiTierProgressTracker } from '@/components/dashboard/MultiTierProgressTracker'
import { LivePriceCard } from '@/components/dashboard/LivePriceCard'
import { OtherCryptoPricesCard } from '@/components/dashboard/OtherCryptoPricesCard'

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

interface SignalEvent {
  event_id: string
  published_at: string
  tier: 'SIGNAL' | 'WATCHLIST'
  outcome?: {
    system_outcome: string | null
    system_outcome_detail?: string | null
    status?: string | null
    user_confirmed: boolean
    user_outcome: 'PROFIT' | 'LOSS' | null
    resolution_price: number | null
    resolved_at: string | null
  } | null
  payload: {
    symbol: string
    tier: 'SIGNAL' | 'WATCHLIST'
    confluence_score: number
    grade: string
    setup_context?: {
      symbol?: string
      direction: 'BUY' | 'SELL'
      entry_price: number
      stop_loss: number
      risk_pct: number
      leverage: number
      invalidation_clause?: string
      tp1?: { target_price: number; rr_ratio: number }
      tp2?: { target_price: number; rr_ratio: number }
      tp3?: { target_price: number; rr_ratio: number }
    }
    confluence_result?: {
      direction?: 'BUY' | 'SELL' | string
      symbol?: string
      active_regimes?: string[]
      breakdown?: ConfluenceFactor[]
    }
  }
}

export default function SignalsPage() {
  const [selectedSignalIndex, setSelectedSignalIndex] = useState<number>(0)
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false)
  const historyDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const signalsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-signals?limit=5`
  const { data: signalsData, error: signalsError, mutate: mutateSignals } = useSWR(signalsUrl, fetcher, { refreshInterval: 5000 })

  const isLoadingSignals = !signalsData && !signalsError
  const signalsList: SignalEvent[] = signalsData?.signals || []

  // Ensure selectedSignalIndex is within bounds if signalsList changes
  const activeIndex = selectedSignalIndex < signalsList.length ? selectedSignalIndex : 0
  const activeSignal = signalsList[activeIndex]

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

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Live Signals & Chart Telemetry</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Interactive multi-pair charting combined with 15-minute candle confluence signals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
            15m Evaluation Loop
          </span>
        </div>
      </div>

      {/* ── TradingView Chart Widget ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <span>Market Chart (Futures Perpetual)</span>
            <span className="text-[10px] text-zinc-400 font-mono">BINANCE:BTCUSDT.P • 15m Perpetual Candles</span>
          </span>
        </div>
        <TradingViewChart symbol="BINANCE:BTCUSDT.P" interval="15" />
      </div>

      {/* ── Live Signal Feed (1 Active Signal + 3-History Dropdown) ── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white">Live Signals</h2>
            <span className="text-[11px] text-text-muted hidden sm:inline">Auto-refreshes every 15s</span>
          </div>

          {/* Custom Dropdown Selector for 3 Latest Signals with Real SVG Icons */}
          {signalsList.length > 0 && (
            <div className="relative flex items-center gap-2 w-full sm:w-auto" ref={historyDropdownRef}>
              <span className="text-xs text-text-muted whitespace-nowrap hidden xs:inline">Signal History:</span>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white text-xs font-semibold focus:outline-none transition-all cursor-pointer shadow-sm flex items-center justify-between gap-2.5"
                aria-haspopup="listbox"
                aria-expanded={isHistoryOpen}
              >
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={activeSignal?.payload.setup_context?.symbol || 'BTCUSDT'} size="xs" />
                  {(() => {
                    const activeDir = activeSignal?.payload.confluence_result?.direction || activeSignal?.payload.setup_context?.direction || 'BUY'
                    const isBuy = activeDir.toUpperCase() === 'BUY'
                    return isBuy ? (
                      <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                        <polyline points="17 18 23 18 23 12" />
                      </svg>
                    )
                  })()}
                  <span className="font-mono text-xs">{activeSignal?.payload.confluence_result?.direction || activeSignal?.payload.setup_context?.direction || 'BUY'} {activeSignal?.payload.confluence_score?.toFixed(1)} pts</span>
                </div>
                <svg className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu Items */}
              {isHistoryOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-full sm:w-80 rounded-xl bg-[#0c101c]/98 border border-white/[0.1] shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl z-30 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {signalsList.map((sig, idx) => {
                    const isLatest = idx === 0
                    const direction = sig.payload.confluence_result?.direction || sig.payload.setup_context?.direction || 'BUY'
                    const isBuy = direction.toUpperCase() === 'BUY'
                    const score = sig.payload.confluence_score.toFixed(1)
                    const time = formatTime(sig.published_at)
                    const isSelected = activeIndex === idx

                    return (
                      <button
                        key={sig.event_id}
                        type="button"
                        onClick={() => {
                          setSelectedSignalIndex(idx)
                          setIsHistoryOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                            : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AssetIcon symbol={sig.payload.setup_context?.symbol || 'BTCUSDT'} size="xs" />
                          {isBuy ? (
                            <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                              <polyline points="17 6 23 6 23 12" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                              <polyline points="17 18 23 18 23 12" />
                            </svg>
                          )}
                          <span>
                            {isLatest ? 'Latest' : `Signal #${idx + 1}`} <span className="text-text-muted font-normal">({time})</span>
                          </span>
                        </div>
                        <span className={`text-[11px] font-mono font-bold ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {direction} {score} pts
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 2-Column Responsive Layout: Live Signal Card + Live Update Price Card ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-4">
            {isLoadingSignals ? (
              <GlassCard className="p-6 animate-pulse space-y-4">
                <div className="h-6 w-48 bg-white/[0.06] rounded" />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="h-24 bg-white/[0.04] rounded" />
                  <div className="h-24 bg-white/[0.04] rounded" />
                </div>
              </GlassCard>
            ) : !activeSignal ? (
              <GlassCard className="text-center py-12 text-text-secondary text-xs">
                No active signals in stream. Indicators evaluating candle closes...
              </GlassCard>
            ) : (
          (() => {
            const sig = activeSignal
            const payload = sig.payload
            const setup = payload.setup_context
            const isSignal = payload.tier === 'SIGNAL'
            const activeDirection = payload.confluence_result?.direction || setup?.direction || 'BUY'
            const isBuy = activeDirection.toUpperCase() === 'BUY'
            const activeSymbol = payload.confluence_result?.symbol || setup?.symbol || 'BTCUSDT'

            return (
              <GlassCard key={sig.event_id} className="p-5 sm:p-6 space-y-5 border-white/[0.09]">
                {/* Signal Header: Symbol → Direction → Confluence Score */}
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2.5">
                    <AssetIcon symbol={activeSymbol} size="md" />
                    <span className="text-xl font-extrabold text-white tracking-tight">
                      {activeSymbol}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${
                      isBuy ? 'text-emerald-400' : 'text-rose-400'
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
                    <span className="h-3 w-[1px] bg-white/[0.12]" />
                    <Badge variant={isSignal ? 'SIGNAL' : 'WATCHLIST'}>
                      {payload.tier}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-text-muted block">Score</span>
                      <span className="font-bold text-white">
                        {payload.confluence_score.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="border-l border-white/[0.06] pl-3">
                      <span className="text-[10px] text-text-muted block">Grade</span>
                      <span className="font-semibold text-zinc-300">
                        {payload.grade.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="border-l border-white/[0.06] pl-3 text-right">
                      <span className="text-[10px] text-text-muted block">Published</span>
                      <span className="font-mono text-zinc-400 text-[11px]">
                        {formatDate(sig.published_at)} {formatTime(sig.published_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signal Content Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left: Target Setup & Risk Parameters */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[11px]">Target Setup</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-text-muted block">Entry Price</span>
                        <span className="text-sm font-bold text-white">${setup?.entry_price?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-text-muted block">Stop Loss</span>
                        <span className="text-sm font-bold text-rose-400">${setup?.stop_loss?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-text-muted block">Target TP1</span>
                        <span className="text-sm font-bold text-emerald-400">${setup?.tp1?.target_price?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-text-muted block">Target TP2</span>
                        <span className="text-sm font-bold text-emerald-400">${setup?.tp2?.target_price?.toLocaleString()}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[11px] text-text-muted block">Target TP3 (Trailing)</span>
                        <span className="text-sm font-bold text-emerald-400">${setup?.tp3?.target_price?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-text-muted block">Leverage</span>
                        <span className="text-sm font-bold text-white">{setup?.leverage?.toFixed(1)}x</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-text-muted block">Target Risk</span>
                        <span className="text-sm font-bold text-white">{setup?.risk_pct?.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-text-muted block">Confluence Grade</span>
                        <span className="text-sm font-bold text-white">{payload.grade.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-text-muted block">Execution Status</span>
                        <span className={`text-sm font-bold ${
                          sig.outcome?.system_outcome === 'TARGET_PROFIT_HIT' ? 'text-emerald-400' :
                          sig.outcome?.system_outcome === 'STOP_LOSS_HIT' ? 'text-rose-400' :
                          (sig.outcome?.system_outcome === 'NOT_HIT' || sig.outcome?.system_outcome === 'SUPERSEDED') ? 'text-zinc-400' :
                          'text-emerald-400'
                        }`}>
                          {sig.outcome?.system_outcome === 'TARGET_PROFIT_HIT' ? 'Target Profit Hit' :
                           sig.outcome?.system_outcome === 'STOP_LOSS_HIT' ? 'Stop Loss Hit' :
                           (sig.outcome?.system_outcome === 'NOT_HIT' || sig.outcome?.system_outcome === 'SUPERSEDED') ? 'Not Hit' :
                           'Active Signal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Confluence Factors Breakdown */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[11px]">Confluence Factors</h3>
                    <div className="space-y-1.5 text-xs">
                      {payload.confluence_result?.breakdown?.map((factor, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-white/[0.03] last:border-b-0">
                          <span className="text-zinc-300 text-xs">{factor.factor_name}</span>
                          <span className={`font-mono text-xs font-bold ${factor.points > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                            {factor.points > 0 ? `+${factor.points.toFixed(1)}` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Multi-Tier Take Profit (Scale-Out & Trailing SL) Live Progress Tracker */}
                <MultiTierProgressTracker
                  entryPrice={setup?.entry_price || 0}
                  stopLoss={setup?.stop_loss || 0}
                  tp1={setup?.tp1}
                  tp2={setup?.tp2}
                  tp3={setup?.tp3}
                  direction={setup?.direction}
                  systemOutcome={sig.outcome?.system_outcome}
                  systemOutcomeDetail={sig.outcome?.system_outcome_detail}
                  status={sig.outcome?.status}
                />

                {/* Invalidation Clause */}
                {setup?.invalidation_clause && (
                  <div className="border-l-2 border-amber-500/40 pl-3.5 py-1 text-xs text-zinc-400 bg-transparent">
                    <span className="font-semibold text-zinc-200 block text-[11px]">Invalidation Clause</span>
                    {setup.invalidation_clause}
                  </div>
                )}

                {/* Signal Outcome Tracking */}
                <div className="border-t border-white/[0.06] pt-4">
                  {/* System Target Status */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-text-muted block">System Target Status</span>
                    <div>
                      {(() => {
                        const outcome = sig.outcome
                        if (!outcome || outcome.system_outcome === 'PENDING') {
                          return (
                            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>Awaiting Target Resolution (Running)...</span>
                            </div>
                          )
                        }
                        if (outcome.system_outcome === 'TARGET_PROFIT_HIT') {
                          const det = outcome.system_outcome_detail?.toUpperCase() || 'TP1'
                          let badgeText = `Target Profit Hit (${det})`
                          if (det === 'TP2_TRAILING_MID' || det === 'TP2_TRAILING_TP1') badgeText = 'TP2 Reached · Exited @ Mid Trailing (+2.5R Banked)'
                          else if (det === 'TP1_TRAILING_MID' || det === 'TP1_BREAKEVEN') badgeText = 'TP1 Reached · Exited @ Mid Trailing (+1.0R Banked)'
                          else if (det.includes('TP3')) badgeText = 'Max Target Hit (TP3 · All Targets Reached)'
                          else if (det.includes('TP2')) badgeText = 'TP2 Reached (+2.8R) · Runner Active'
                          else if (det.includes('TP1')) badgeText = 'TP1 Reached (+1.5R) · Runner Active'

                          return (
                            <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
                              <img src="/assets/trading.png" alt="Trading Icon" className="w-4 h-4 object-contain" />
                              <span>{badgeText}</span>
                            </div>
                          )
                        }
                        if (outcome.system_outcome === 'STOP_LOSS_HIT') {
                          return (
                            <div className="inline-flex items-center gap-1.5 text-rose-400 text-xs font-bold font-mono">
                              <img src="/assets/trading.png" alt="Trading Icon" className="w-4 h-4 object-contain" />
                              <span>Stop Loss Hit (-1.00R)</span>
                            </div>
                          )
                        }
                        if (outcome.system_outcome === 'NOT_HIT' || outcome.system_outcome === 'SUPERSEDED') {
                          return (
                            <div className="inline-flex items-center gap-1.5 text-zinc-400 text-xs font-bold font-mono">
                              <span>SESSION EXPIRED (NOT HIT)</span>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })()
        )}
          </div>

          {/* ── Right Column: Live Update Price Card + Other Crypto Pairs Card ── */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <LivePriceCard
              symbol={activeSignal?.payload.confluence_result?.symbol || activeSignal?.payload.setup_context?.symbol || 'BTC'}
              entryPrice={activeSignal?.payload.setup_context?.entry_price}
              direction={activeSignal?.payload.confluence_result?.direction || activeSignal?.payload.setup_context?.direction}
              tp1Price={activeSignal?.payload.setup_context?.tp1?.target_price}
              stopLossPrice={activeSignal?.payload.setup_context?.stop_loss}
            />
            <OtherCryptoPricesCard
              excludeSymbol={activeSignal?.payload.confluence_result?.symbol || activeSignal?.payload.setup_context?.symbol || 'BTC'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
