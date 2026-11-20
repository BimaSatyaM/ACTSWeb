'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { Badge } from '@/components/ui/Badge'
import { AssetIcon } from '@/components/ui/AssetIcon'
import { TradingViewChart } from '@/components/dashboard/TradingViewChart'
import { ActsConfluenceChart, ChartSignalBracket } from '@/components/dashboard/ActsConfluenceChart'
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
  const [chartMode, setChartMode] = useState<'acts' | 'tv'>('acts')

  const signalsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-signals?limit=5`
  const { data: signalsData, error: signalsError, mutate: mutateSignals } = useSWR(signalsUrl, fetcher, { refreshInterval: 30000, revalidateOnFocus: false })

  const isLoadingSignals = !signalsData && !signalsError
  const signalsList: SignalEvent[] = signalsData?.signals || []

  // Ensure selectedSignalIndex is within bounds if signalsList changes
  const activeIndex = selectedSignalIndex < signalsList.length ? selectedSignalIndex : 0
  const activeSignal = signalsList[activeIndex]

  const chartSignals: ChartSignalBracket[] = signalsList.map((sig) => {
    const dir = (sig.payload.confluence_result?.direction || sig.payload.setup_context?.direction || 'BUY').toUpperCase()
    return {
      event_id: sig.event_id,
      published_at: sig.published_at,
      direction: dir === 'SELL' ? 'SELL' : 'BUY',
      tier: sig.tier,
      score: sig.payload.confluence_score,
      entryPrice: sig.payload.setup_context?.entry_price,
      stopLoss: sig.payload.setup_context?.stop_loss,
      tp1Price: sig.payload.setup_context?.tp1?.target_price,
    }
  })
  const activeChartSignal = chartSignals[activeIndex] || null

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-slate-900/10 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#0369a1] font-bold block mb-1">
            Telemetry & Confluence Execution Desk
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Live Signals & Chart Telemetry
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Interactive multi-pair perpetual charting paired with 15-minute multi-regime confluence verification.
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-600 flex items-center gap-2.5">
          <span>15M EVALUATION LOOP</span>
          <span className="text-slate-500">·</span>
          <span>POLL 30S</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
            <span className="font-bold text-slate-800 uppercase tracking-wider">Market Chart (Perpetual)</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3" role="tablist" aria-label="Chart engine">
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartMode === 'acts'}
                  onClick={() => setChartMode('acts')}
                  className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
                    chartMode === 'acts'
                      ? 'border-[#0369a1] text-slate-900 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ACTS Indicators
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartMode === 'tv'}
                  onClick={() => setChartMode('tv')}
                  className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
                    chartMode === 'tv'
                      ? 'border-[#0369a1] text-slate-900 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  TradingView
                </button>
              </div>
              <span className="hidden sm:inline text-slate-400">·</span>
              <span className="hidden sm:inline">BINANCE:BTCUSDT.P</span>
            </div>
          </div>
          {chartMode === 'acts' ? (
            <ActsConfluenceChart
              symbol="BTCUSDT"
              defaultInterval="15m"
              activeSignal={activeChartSignal}
              recentSignals={chartSignals}
            />
          ) : (
            <TradingViewChart symbol="BINANCE:BTCUSDT.P" interval="15" />
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <LivePriceCard
            compact
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

      <div className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-mono uppercase tracking-[0.14em] font-bold text-slate-600">
              Signal Stream Tape
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Latest 5 Setups</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Click any setup below to inspect execution bracket</span>
        </div>

        {signalsList.length > 0 && (
          <div className="flex items-center gap-6 overflow-x-auto border-y border-slate-900/10" role="tablist" aria-label="Recent signals">
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
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedSignalIndex(idx)}
                  className={`shrink-0 flex items-center gap-2.5 py-3 border-b-2 text-xs font-mono transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                    isSelected
                      ? 'border-[#0369a1] text-slate-900 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <AssetIcon symbol={sig.payload.setup_context?.symbol || 'BTCUSDT'} size="xs" />
                  <span className="uppercase">{isLatest ? 'LATEST' : `#${idx + 1}`}</span>
                  <span className={`font-bold ${isBuy ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {direction}
                  </span>
                  <span className="tabular-nums font-bold text-slate-900">{score}</span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{time}</span>
                </button>
              )
            })}
          </div>
        )}

        {isLoadingSignals ? (
          <div className="p-6 rounded-2xl bg-[#faf2df] border border-slate-900/10 animate-pulse space-y-4">
            <div className="h-6 w-48 bg-slate-900/10 rounded" />
            <div className="h-24 bg-slate-900/5 rounded" />
          </div>
        ) : !activeSignal ? (
          <div className="text-center py-12 rounded-2xl bg-[#faf2df] border border-slate-900/10 text-slate-500 text-xs font-mono">
            No active signals in stream. Indicators evaluating candle closes...
          </div>
        ) : (
          (() => {
            const sig = activeSignal
            const payload = sig.payload
            const setup = payload.setup_context
            const isSignal = payload.tier === 'SIGNAL'
            const activeDirection = payload.confluence_result?.direction || setup?.direction || 'BUY'
            const isBuy = activeDirection.toUpperCase() === 'BUY'
            const activeSymbol = payload.confluence_result?.symbol || setup?.symbol || 'BTCUSDT'
            const isSingleTp =
              !setup?.tp2?.target_price ||
              (setup?.tp1 as any)?.allocation_pct >= 0.99 ||
              Math.abs((setup?.tp1?.target_price || 0) - (setup?.tp2?.target_price || 0)) < 0.01

            const sysOut = sig.outcome?.system_outcome
            const sysDet = sig.outcome?.system_outcome_detail || ''
            const sysDetUpper = sysDet.toUpperCase()
            const isClosedByNewSig =
              sysDetUpper.startsWith('CLOSED_R:') ||
              sysOut === 'PROFIT_CLOSED' ||
              sysOut === 'LOSS_CLOSED' ||
              sysOut === 'BREAKEVEN_CLOSED'
            let closedR: number | null = null
            let closedPrice: number | null = null
            if (sysDetUpper.startsWith('CLOSED_R:')) {
              const parts = sysDetUpper.slice('CLOSED_R:'.length).split('@')
              const parsedR = parseFloat(parts[0])
              const parsedP = parts[1] ? parseFloat(parts[1]) : NaN
              if (!Number.isNaN(parsedR)) closedR = parsedR
              if (!Number.isNaN(parsedP)) closedPrice = parsedP
            }
            const closedRStr = closedR !== null
              ? `${closedR >= 0 ? '+' : ''}${closedR.toFixed(2)}R`
              : sysOut === 'PROFIT_CLOSED' ? '+0.00R' : sysOut === 'LOSS_CLOSED' ? '-0.00R' : '0.00R'
            const closedIsWin = sysOut === 'PROFIT_CLOSED' || (closedR !== null && closedR > 0)
            const closedIsLoss = sysOut === 'LOSS_CLOSED' || (closedR !== null && closedR < 0)

            return (
              <div key={sig.event_id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className={`lg:col-span-7 rounded-2xl bg-[#faf2df] border border-slate-900/10 border-t-2 ${isBuy ? 'border-t-emerald-600' : 'border-t-rose-600'} p-5 sm:p-6 space-y-6`}>
                  <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-900/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <AssetIcon symbol={activeSymbol} size="md" />
                      <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                        {activeSymbol}
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

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Score</span>
                        <span className="font-bold font-mono tabular-nums text-slate-900">
                          {payload.confluence_score.toFixed(1)}/100
                        </span>
                      </div>
                      <div className="border-l border-slate-900/10 pl-3">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Grade</span>
                        <span className="font-semibold text-slate-800">
                          {payload.grade.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="border-l border-slate-900/10 pl-3 text-right">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Published</span>
                        <span className="font-mono tabular-nums text-slate-600 text-[11px]">
                          {formatDate(sig.published_at)} {formatTime(sig.published_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 border-b border-slate-900/10 pb-5 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Entry Price</span>
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900">${setup?.entry_price?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Stop Loss</span>
                      <span className="text-sm font-bold font-mono tabular-nums text-rose-700">${setup?.stop_loss?.toLocaleString()}</span>
                    </div>
                    {isSingleTp ? (
                      <>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Target Profit (100%)</span>
                          <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">${setup?.tp1?.target_price?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Risk : Reward</span>
                          <span className="text-sm font-bold font-mono tabular-nums text-[#0369a1]">1 : {(setup?.tp1?.rr_ratio || 1.5).toFixed(1)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Target TP1</span>
                          <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">${setup?.tp1?.target_price?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Target TP2 / TP3</span>
                          <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                            ${setup?.tp2?.target_price?.toLocaleString()} / ${setup?.tp3?.target_price?.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Leverage · Risk</span>
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        {setup?.leverage?.toFixed(1)}x · {setup?.risk_pct?.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Execution Status</span>
                      <span className={`text-sm font-bold ${
                        sysOut === 'TARGET_PROFIT_HIT' || (isClosedByNewSig && closedIsWin) ? 'text-emerald-700' :
                        sysOut === 'STOP_LOSS_HIT' || (isClosedByNewSig && closedIsLoss) ? 'text-rose-700' :
                        (sysOut === 'NOT_HIT' || sysOut === 'SUPERSEDED' || isClosedByNewSig) ? 'text-slate-500' :
                        'text-emerald-700'
                      }`}>
                        {sysOut === 'TARGET_PROFIT_HIT' ? 'Target Profit Hit' :
                         sysOut === 'STOP_LOSS_HIT' ? 'Stop Loss Hit' :
                         isClosedByNewSig ? `Closed (${closedRStr})` :
                         (sysOut === 'NOT_HIT' || sysOut === 'SUPERSEDED') ? 'Not Hit' :
                         'Active Signal'}
                      </span>
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
                    systemOutcome={sig.outcome?.system_outcome}
                    systemOutcomeDetail={sig.outcome?.system_outcome_detail}
                    status={sig.outcome?.status}
                  />

                  {setup?.invalidation_clause && (
                    <div className="border-l-2 border-amber-600 pl-3.5 py-0.5 text-xs text-slate-700">
                      <span className="font-bold font-mono uppercase text-[10px] tracking-wider text-amber-800 block mb-0.5">
                        Invalidation Clause
                      </span>
                      {setup.invalidation_clause}
                    </div>
                  )}

                  <div className="border-t border-slate-900/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                      System Target Status
                    </span>
                    <div>
                      {(() => {
                        const outcome = sig.outcome
                        if (!outcome || outcome.system_outcome === 'PENDING') {
                          return (
                            <div className="inline-flex items-center gap-1.5 text-amber-800 text-xs font-semibold font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                              <span>Awaiting Target Resolution (Running)</span>
                            </div>
                          )
                        }
                        if (isClosedByNewSig) {
                          // tabular-nums
                          const priceLabel = closedPrice !== null ? ` · $${closedPrice.toLocaleString()}` : ''
                          const colorClass = closedIsWin ? 'text-emerald-700' : closedIsLoss ? 'text-rose-700' : 'text-slate-600'
                          return (
                            <div className={`inline-flex items-center gap-1.5 ${colorClass} text-xs font-bold font-mono tabular-nums`}>
                              <span>{`Closed @ New Signal (${closedRStr}${priceLabel})`}</span>
                            </div>
                          )
                        }
                        if (outcome.system_outcome === 'TARGET_PROFIT_HIT') {
                          const det = outcome.system_outcome_detail?.toUpperCase() || 'TP1'
                          let badgeText = `Target Profit Hit (${det})`
                          if (det === 'TP_SINGLE' || det === 'TP1_SINGLE') badgeText = 'Target Profit Hit (+1.5R · 100% Exit)'
                          else if (det === 'TP2_TRAILING_MID' || det === 'TP2_TRAILING_TP1') badgeText = 'TP2 Reached · Exited @ Mid Trailing (+2.5R Banked)'
                          else if (det === 'TP1_TRAILING_MID' || det === 'TP1_BREAKEVEN') badgeText = 'TP1 Reached · Exited @ Mid Trailing (+1.0R Banked)'
                          else if (det.includes('TP3')) badgeText = 'Max Target Hit (TP3 · All Targets Reached)'
                          else if (det.includes('TP2')) badgeText = 'TP2 Reached (+2.8R) · Runner Active'
                          else if (det.includes('TP1')) badgeText = 'TP1 Reached (+1.5R) · Runner Active'

                          return (
                            <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold font-mono tabular-nums">
                              <img src="/assets/trading.png" alt="Trading Icon" className="w-4 h-4 object-contain" />
                              <span>{badgeText}</span>
                            </div>
                          )
                        }
                        if (outcome.system_outcome === 'STOP_LOSS_HIT') {
                          return (
                            <div className="inline-flex items-center gap-1.5 text-rose-700 text-xs font-bold font-mono tabular-nums">
                              <img src="/assets/trading.png" alt="Trading Icon" className="w-4 h-4 object-contain" />
                              <span>Stop Loss Hit (-1.00R)</span>
                            </div>
                          )
                        }
                        if (outcome.system_outcome === 'NOT_HIT' || outcome.system_outcome === 'SUPERSEDED') {
                          return (
                            <div className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-bold font-mono">
                              <span>SESSION EXPIRED (NOT HIT)</span>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900/10 pb-2.5">
                    <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-[0.14em]">
                      Confluence Breakdown
                    </h3>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      TOTAL {payload.confluence_score.toFixed(1)} PTS
                    </span>
                  </div>

                  <div className="space-y-3">
                    {payload.confluence_result?.breakdown?.map((factor, idx) => {
                      const pct = Math.min(100, (Math.max(0, factor.points) / 20) * 100)
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs gap-2">
                            <span className="text-slate-800 font-medium">{factor.factor_name}</span>
                            <span className={`font-mono text-xs font-bold tabular-nums ${factor.points > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {factor.points > 0 ? `+${factor.points.toFixed(1)}` : '-'}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-slate-900/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${factor.points > 0 ? 'bg-emerald-600' : 'bg-transparent'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {payload.confluence_result?.active_regimes && payload.confluence_result.active_regimes.length > 0 && (
                    <div className="border-t border-slate-900/10 pt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600">
                      <span className="uppercase tracking-wider text-slate-500">Active Regimes:</span>
                      <span className="font-bold text-[#0369a1]">
                        {payload.confluence_result.active_regimes.map((r) => r.replace(/_/g, ' ')).join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}
