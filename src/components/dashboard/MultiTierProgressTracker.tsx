'use client'

import React from 'react'
import useSWR from 'swr'

const marketFetcher = (url: string) => fetch(url).then((res) => res.json())

interface MultiTierProgressTrackerProps {
  symbol?: string
  entryPrice: number
  stopLoss: number
  tp1?: { target_price: number; rr_ratio: number }
  tp2?: { target_price: number; rr_ratio: number }
  tp3?: { target_price: number; rr_ratio: number }
  direction?: 'BUY' | 'SELL' | string
  systemOutcome?: string | null
  systemOutcomeDetail?: string | null
  status?: string | null
  livePrice?: number
  className?: string
}

export function MultiTierProgressTracker({
  symbol = 'BTCUSDT',
  entryPrice,
  stopLoss,
  tp1,
  tp2,
  tp3,
  direction = 'BUY',
  systemOutcome,
  systemOutcomeDetail,
  status,
  livePrice,
  className = '',
}: MultiTierProgressTrackerProps) {
  const detail = systemOutcomeDetail?.toUpperCase() || ''
  const isResolved = status === 'RESOLVED'
  const isSLHit = systemOutcome === 'STOP_LOSS_HIT'
  const isTPHit = systemOutcome === 'TARGET_PROFIT_HIT'
  const isNotHit = systemOutcome === 'NOT_HIT' || systemOutcome === 'SUPERSEDED' || systemOutcome === 'EXPIRED'
  const isClosedByNewSignal =
    detail.startsWith('CLOSED_R:') ||
    systemOutcome === 'PROFIT_CLOSED' ||
    systemOutcome === 'LOSS_CLOSED' ||
    systemOutcome === 'BREAKEVEN_CLOSED'
  let closedRVal: number | null = null
  let closedPriceVal: number | null = null
  if (detail.startsWith('CLOSED_R:')) {
    const parts = detail.slice('CLOSED_R:'.length).split('@')
    const parsedR = parseFloat(parts[0])
    const parsedP = parts[1] ? parseFloat(parts[1]) : NaN
    if (!Number.isNaN(parsedR)) closedRVal = parsedR
    if (!Number.isNaN(parsedP)) closedPriceVal = parsedP
  }
  const isLiveTracking = !isResolved && !isSLHit && !isTPHit && !isNotHit && !isClosedByNewSignal

  const cleanSymbol = symbol.replace(/USDT$/i, '').toUpperCase() || 'BTC'
  const { data: marketData } = useSWR<{ tickers: { symbol: string; price: number }[] }>(
    isLiveTracking && livePrice === undefined ? '/api/market-prices' : null,
    marketFetcher,
    { refreshInterval: 1000, dedupingInterval: 500 }
  )
  const fetchedPrice = marketData?.tickers?.find((t) => t.symbol === cleanSymbol)?.price
  const currentPrice = livePrice ?? fetchedPrice ?? null

  // Determine stage flags
  const isTP1Hit =
    isTPHit &&
    (detail.includes('TP1') ||
      detail.includes('TP2') ||
      detail.includes('TP3') ||
      detail.includes('TP_SINGLE') ||
      !detail)
  const isTP2Hit = isTPHit && (detail.includes('TP2') || detail.includes('TP3'))
  const isTP3Hit = isTPHit && detail.includes('TP3')

  // Midpoint calculations for buffered trailing stop
  const tp1Price = tp1?.target_price ?? 0
  const tp2Price = tp2?.target_price ?? 0
  const tp3Price = tp3?.target_price ?? 0
  const isSingleTp = isClosedByNewSignal || !tp2Price || Math.abs(tp1Price - tp2Price) < 0.01 || detail === 'TP_SINGLE' || detail === 'TP1_SINGLE'
  const singleRr = tp1?.rr_ratio || 1.5

  if (isSingleTp) {
    const isSell = String(direction).toUpperCase() === 'SELL'
    const slDist = isSell ? stopLoss - entryPrice : entryPrice - stopLoss
    const tpDist = isSell ? entryPrice - tp1Price : tp1Price - entryPrice

    let tpFill = isTP1Hit ? 1 : 0
    let slFill = isSLHit ? 1 : 0
    let liveR: number | null = null

    if (isClosedByNewSignal && closedRVal !== null) {
      if (closedRVal >= 0) {
        tpFill = Math.min(1, Math.max(0, closedRVal / singleRr))
        slFill = 0
      } else {
        slFill = Math.min(1, Math.max(0, Math.abs(closedRVal)))
        tpFill = 0
      }
    } else if (isLiveTracking && currentPrice !== null && entryPrice > 0 && slDist > 0 && tpDist > 0) {
      const priceDelta = isSell ? entryPrice - currentPrice : currentPrice - entryPrice
      if (priceDelta >= 0) {
        tpFill = Math.min(1, Math.max(0, priceDelta / tpDist))
        slFill = 0
        liveR = tpFill * singleRr
      } else {
        slFill = Math.min(1, Math.max(0, -priceDelta / slDist))
        tpFill = 0
        liveR = -slFill
      }
    }

    const markerPct = slFill > 0 ? 50 - slFill * 33.33 : 50 + tpFill * 33.33
    const isInProfit = tpFill > 0 || isTP1Hit || (isClosedByNewSignal && (closedRVal ?? 0) > 0)
    const isInLoss = slFill > 0 || isSLHit || (isClosedByNewSignal && (closedRVal ?? 0) < 0)

    let savedClosePrice: number | null = null
    let savedCloseR: number | null = null
    if (isClosedByNewSignal && closedRVal !== null) {
      savedClosePrice = closedPriceVal
      savedCloseR = closedRVal
    } else if (isTP1Hit) {
      savedClosePrice = tp1Price > 0 ? tp1Price : null
      savedCloseR = singleRr
    } else if (isSLHit) {
      savedClosePrice = stopLoss > 0 ? stopLoss : null
      savedCloseR = -1.0
    }

    // tabular-nums
    const singleRealizedR = isClosedByNewSignal && closedRVal !== null
      ? `${closedRVal >= 0 ? '+' : ''}${closedRVal.toFixed(2)}R (Closed @ ${closedPriceVal !== null ? '$' + closedPriceVal.toLocaleString() : 'New Signal'})`
      : isSLHit
      ? '-1.00R (Loss)'
      : isTP1Hit
      ? `+${singleRr.toFixed(2)}R (100% Target Banked)`
      : liveR !== null
      ? `${liveR >= 0 ? '+' : ''}${liveR.toFixed(2)}R (Live)`
      : '0.00R (In Trade)'

    return (
      <div className={`space-y-3 pt-2 pb-1 font-mono ${className}`}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
            Single Target Profit (1:{singleRr.toFixed(1)} RR)
          </span>

          <div className="text-[11px] flex items-center gap-1.5">
            <span className="text-slate-500 text-[10px]">Net Return:</span>
            <span
              className={`font-bold tabular-nums ${
                isInLoss ? 'text-rose-600' : isInProfit ? 'text-emerald-700' : 'text-slate-700'
              }`}
            >
              {singleRealizedR}
            </span>
          </div>
        </div>

        <div className="relative pt-3 pb-1">
          {/* Base Track */}
          <div className="absolute top-[19px] left-[16.67%] right-[16.67%] h-[2px] bg-slate-200 z-0" />

          {/* Animated Drawdown Bar (Entry -> SL) */}
          <div
            className="absolute top-[19px] h-[2px] bg-gradient-to-l from-sky-500 via-rose-500 to-rose-600 shadow-xs transition-all duration-700 ease-out z-0"
            style={{
              left: `${50 - slFill * 33.33}%`,
              width: `${slFill * 33.33}%`,
            }}
          />

          {/* Animated Profit Bar (Entry -> TP) */}
          <div
            className="absolute top-[19px] left-[50%] h-[2px] bg-gradient-to-r from-sky-500 via-emerald-500 to-emerald-600 shadow-xs transition-all duration-700 ease-out z-0"
            style={{
              width: `${tpFill * 33.33}%`,
            }}
          />

          {/* Live / Closed Moving Price Indicator */}
          {((isLiveTracking && currentPrice !== null) || savedClosePrice !== null) && (() => {
            const displayPrice = isLiveTracking ? currentPrice! : savedClosePrice!
            const closedLabel = !isLiveTracking && savedCloseR !== null
              ? ` (${savedCloseR >= 0 ? '+' : ''}${savedCloseR.toFixed(2)}R)`
              : ''
            return (
              <div
                className="absolute top-[19px] -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20 pointer-events-none"
                style={{ left: `${markerPct}%` }}
              >
                <span
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold tabular-nums whitespace-nowrap ${
                    slFill > 0
                      ? 'text-rose-700'
                      : tpFill > 0
                      ? 'text-emerald-800'
                      : 'text-[#0369a1]'
                  }`}
                >
                  {/* tabular-nums */}${displayPrice.toLocaleString()}{closedLabel}
                </span>
                {isLiveTracking && (
                  <span
                    className={`absolute inset-0 w-3 h-3 -m-0.5 rounded-full animate-ping opacity-60 ${
                      slFill > 0 ? 'bg-rose-500' : tpFill > 0 ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                  />
                )}
                <span
                  className={`relative block w-2 h-2 rounded-full border border-white ring-1 ring-slate-400 ${
                    slFill > 0
                      ? 'bg-rose-600 shadow-xs'
                      : tpFill > 0
                      ? 'bg-emerald-600 shadow-xs'
                      : 'bg-sky-600 shadow-xs'
                  }`}
                />
              </div>
            )
          })()}

          <div className="grid grid-cols-3 gap-2 relative z-10">
            {/* Step 0: SL */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div
                className={`w-4 h-4 rounded-full bg-[#fdfaf3] border-2 flex items-center justify-center transition-all ${
                  isSLHit
                    ? 'border-rose-600 animate-pulse'
                    : 'border-rose-300'
                }`}
              >
                <span
                  className={`w-1 h-1 rounded-full ${
                    isSLHit ? 'bg-rose-600' : 'bg-rose-400'
                  }`}
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-rose-600 block uppercase font-semibold">Stop Loss</span>
                <span className={`text-xs font-bold block truncate tabular-nums ${isSLHit ? 'text-rose-700' : 'text-rose-600'}`}>
                  ${stopLoss.toLocaleString()}
                </span>
                <span className={`text-[9px] font-semibold block tabular-nums ${isSLHit ? 'text-rose-700' : 'text-slate-500'}`}>
                  {isSLHit ? 'Triggered (-1.0R)' : '-1.0R Risk'}
                </span>
              </div>
            </div>

            {/* Step 1: Entry */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-4 h-4 rounded-full bg-[#fdfaf3] border-2 border-sky-600 flex items-center justify-center shadow-xs">
                <span className="w-1 h-1 rounded-full bg-sky-600" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase">Entry</span>
                <span className="text-xs font-bold text-slate-900 block truncate tabular-nums">
                  ${entryPrice.toLocaleString()}
                </span>
                <span className="text-[9px] text-sky-700 font-semibold block">
                  {direction} Triggered
                </span>
              </div>
            </div>

            {/* Step 2: Target Profit */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div
                className={`w-4 h-4 rounded-full bg-[#fdfaf3] border-2 flex items-center justify-center transition-all ${
                  isTP1Hit
                    ? 'border-emerald-600'
                    : 'border-slate-300'
                }`}
              >
                <span
                  className={`w-1 h-1 rounded-full ${
                    isTP1Hit ? 'bg-emerald-600' : 'bg-transparent'
                  }`}
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase">Target Profit</span>
                <span className={`text-xs font-bold block truncate tabular-nums ${isTP1Hit ? 'text-emerald-700' : 'text-slate-600'}`}>
                  ${tp1?.target_price ? tp1.target_price.toLocaleString() : 'N/A'}
                </span>
                <span className={`text-[9px] font-semibold block tabular-nums ${isTP1Hit ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {isTP1Hit ? `Target Hit (+${singleRr.toFixed(1)}R)` : `+${singleRr.toFixed(1)}R (100% Exit)`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px]">
          <div className="inline-flex items-center gap-1.5 text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSLHit
                  ? 'bg-rose-600'
                  : isTP1Hit
                  ? 'bg-emerald-600'
                  : isClosedByNewSignal
                  ? ((closedRVal ?? 0) > 0 ? 'bg-emerald-600' : (closedRVal ?? 0) < 0 ? 'bg-rose-600' : 'bg-slate-400')
                  : 'bg-sky-600 animate-pulse'
              }`}
            />
            <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Active Protection:</span>
            <span className={`font-bold tabular-nums ${isSLHit ? 'text-rose-600' : (isTP1Hit || isClosedByNewSignal) ? 'text-slate-500' : 'text-rose-600'}`}>
              ${stopLoss.toLocaleString()}
            </span>
            <span className="text-slate-500 text-[10px]">
              ({isSLHit ? 'Stopped Out' : isTP1Hit ? 'Exited @ Target Profit' : isClosedByNewSignal ? 'Closed @ New Signal' : 'Initial SL'})
            </span>
          </div>

          <div className="text-[10px] text-slate-500 font-mono tabular-nums">
            {isTP1Hit && `100% Target profit banked (+${singleRr.toFixed(1)}R · Trade Closed)!`}
            {isSLHit && 'Stop loss hit (-1.0R). Capital defense executed.'}
            {isClosedByNewSignal && closedRVal !== null && `Closed at $${closedPriceVal !== null ? closedPriceVal.toLocaleString() : 'Market'} (${closedRVal >= 0 ? '+' : ''}${closedRVal.toFixed(2)}R) on new signal.` /* tabular-nums */}
            {!isTP1Hit && !isSLHit && !isClosedByNewSignal && `Active trade · Monitoring 1:${singleRr.toFixed(1)} RR target exit.`}
          </div>
        </div>
      </div>
    )
  }

  const midEntryTP1 = tp1Price > 0 ? (entryPrice + tp1Price) / 2 : entryPrice
  const midTP1TP2 = tp1Price > 0 && tp2Price > 0 ? (tp1Price + tp2Price) / 2 : tp1Price
  const midTP2TP3 = tp2Price > 0 && tp3Price > 0 ? (tp2Price + tp3Price) / 2 : tp2Price

  // Determine ratchet states
  const isTP1Ratcheted = isTPHit && (detail.includes('TP1_RATCHET') || detail.includes('TP2') || detail.includes('TP3'))
  const isTP2Ratcheted = isTPHit && (detail.includes('TP2_RATCHET') || detail.includes('TP3'))

  // Trailing Stop Loss value and status
  let trailingSLText = `$${stopLoss.toLocaleString()}`
  let trailingSLBadge = 'Initial SL'
  let trailingSLColor = 'text-rose-700'

  if (isTP2Hit) {
    if (isTP2Ratcheted && !isTP3Hit) {
      trailingSLText = tp2Price > 0 ? `$${tp2Price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` /* tabular-nums */ : 'Full TP2'
      trailingSLBadge = isResolved ? 'Exited @ Ratchet TP2 (+2.0R)' : 'Ratcheted to Full TP2 (+2.0R Locked)'
      trailingSLColor = isResolved ? 'text-slate-500' : 'text-emerald-700'
    } else {
      trailingSLText = midTP1TP2 > 0 ? `$${midTP1TP2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` /* tabular-nums */ : 'Mid(TP1↔TP2)'
      trailingSLBadge = isResolved ? 'Exited @ Mid Trailing (+1.5R)' : 'Trailed to Mid(TP1↔TP2) (+1.5R Locked)'
      trailingSLColor = isResolved ? 'text-slate-500' : 'text-emerald-700'
    }
  } else if (isTP1Hit) {
    if (isTP1Ratcheted && !isTP2Hit) {
      trailingSLText = tp1Price > 0 ? `$${tp1Price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` /* tabular-nums */ : 'Full TP1'
      trailingSLBadge = isResolved ? 'Exited @ Ratchet TP1 (+1.0R)' : 'Ratcheted to Full TP1 (+1.0R Locked)'
      trailingSLColor = isResolved ? 'text-slate-500' : 'text-[#0369a1]'
    } else {
      trailingSLText = midEntryTP1 > 0 ? `$${midEntryTP1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` /* tabular-nums */ : 'Mid(Entry↔TP1)'
      trailingSLBadge = isResolved ? 'Exited @ Mid Trailing (+0.5R)' : 'Trailed to Mid(Entry↔TP1) (+0.5R Locked)'
      trailingSLColor = isResolved ? 'text-slate-500' : 'text-[#0369a1]'
    }
  } else if (isSLHit) {
    trailingSLBadge = 'Stopped Out'
    trailingSLColor = 'text-rose-700'
  }

  // Calculate Realized R
  let realizedRText = '0.00R (In Trade)'
  if (isSLHit) {
    realizedRText = '-1.00R (Loss)'
  } else if (isTP3Hit) {
    const r1 = (tp1?.rr_ratio || 1.5) * 0.40
    const r2 = (tp2?.rr_ratio || 2.8) * 0.35
    const r3 = (tp3?.rr_ratio || 4.5) * 0.25
    const totalR = (r1 + r2 + r3).toFixed(2)
    realizedRText = `+${totalR}R (Full Target Banked)`
  } else if (isTP2Hit) {
    const r1 = (tp1?.rr_ratio || 1.5) * 0.40
    const r2 = (tp2?.rr_ratio || 2.8) * 0.35
    if (isResolved) {
      // Stopped at Trailing Mid(TP1, TP2) -> ~2.5R
      realizedRText = '+2.50R (TP2 + Mid Trailing Banked)'
    } else {
      const totalR = (r1 + r2).toFixed(2)
      realizedRText = `+${totalR}R (Banked · TP3 Runner Active)`
    }
  } else if (isTP1Hit) {
    const r1 = ((tp1?.rr_ratio || 1.5) * 0.40).toFixed(2)
    if (isResolved) {
      // Stopped at Trailing Mid(Entry, TP1) -> ~1.0R
      realizedRText = '+1.00R (TP1 + Mid Trailing Banked)'
    } else {
      realizedRText = `+${r1}R (40% Banked · TP2 Runner Active)`
    }
  }

  return (
    <div className={`space-y-3 pt-2 pb-1 font-mono ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
          Multi-Tier Take Profit & Trailing SL
        </span>

        <div className="text-[11px] flex items-center gap-1.5">
          <span className="text-slate-500 text-[10px]">Net Return:</span>
          <span className={`font-bold tabular-nums ${isSLHit ? 'text-rose-600' : isTPHit ? 'text-emerald-700' : 'text-slate-700'}`}>
            {realizedRText}
          </span>
        </div>
      </div>

      <div className="relative pt-2 pb-1">
        <div className="absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-slate-200 z-0" />

        {isSLHit && (
          <div className="absolute top-[18px] left-[10%] w-[20%] h-[2px] bg-rose-500/80 transition-all duration-500 z-0" />
        )}

        <div
          className="absolute top-[18px] left-[30%] h-[2px] bg-emerald-600/80 transition-all duration-500 z-0"
          style={{
            width: isTP3Hit ? '60%' : isTP2Hit ? '40%' : isTP1Hit ? '20%' : '0%',
          }}
        />

        <div className="grid grid-cols-5 gap-2 relative z-10">
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-4 h-4 rounded-full bg-[#fdfaf3] border-2 flex items-center justify-center transition-all ${isSLHit
                  ? 'border-rose-600 animate-pulse'
                  : 'border-rose-300'
                }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isSLHit ? 'bg-rose-600' : 'bg-rose-400'
                  }`}
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-rose-600 block uppercase font-semibold">SL (-1.0R)</span>
              <span className={`text-xs font-bold block truncate tabular-nums ${isSLHit ? 'text-rose-700' : 'text-rose-600'}`}>
                ${stopLoss.toLocaleString()}
              </span>
              <span className={`text-[9px] font-semibold block tabular-nums ${isSLHit ? 'text-rose-700' : 'text-slate-500'}`}>
                {isSLHit ? 'Triggered (-1R)' : 'Protection'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-1.5">
            <div className="w-4 h-4 rounded-full bg-[#fdfaf3] border-2 border-sky-600 flex items-center justify-center shadow-xs">
              <span className="w-1 h-1 rounded-full bg-sky-600" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 block uppercase">1. Entry</span>
              <span className="text-xs font-bold text-slate-900 block truncate tabular-nums">
                ${entryPrice.toLocaleString()}
              </span>
              <span className="text-[9px] text-sky-700 font-semibold block">
                Filled (100%)
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-4 h-4 rounded-full bg-[#fdfaf3] border-2 flex items-center justify-center transition-all ${isTP1Hit
                  ? 'border-emerald-600'
                  : 'border-slate-300'
                }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isTP1Hit ? 'bg-emerald-600' : 'bg-transparent'
                  }`}
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 block uppercase">2. TP1 (40%)</span>
              <span className={`text-xs font-bold block truncate tabular-nums ${isTP1Hit ? 'text-emerald-700' : 'text-slate-600'}`}>
                ${tp1?.target_price ? tp1.target_price.toLocaleString() : 'N/A'}
              </span>
              <span className={`text-[9px] font-semibold block tabular-nums ${isTP1Hit ? 'text-emerald-700' : 'text-slate-500'}`}>
                {isTP1Hit ? 'Banked (40%)' : '+1.5R Target'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-4 h-4 rounded-full bg-[#fdfaf3] border-2 flex items-center justify-center transition-all ${isTP2Hit
                  ? 'border-emerald-600'
                  : isTP1Hit && !isResolved
                    ? 'border-amber-500 animate-pulse'
                    : 'border-slate-300'
                }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isTP2Hit ? 'bg-emerald-600' : isTP1Hit && !isResolved ? 'bg-amber-500' : 'bg-transparent'
                  }`}
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 block uppercase">3. TP2 (35%)</span>
              <span className={`text-xs font-bold block truncate tabular-nums ${isTP2Hit ? 'text-emerald-700' : isTP1Hit && !isResolved ? 'text-amber-700' : 'text-slate-600'}`}>
                ${tp2?.target_price ? tp2.target_price.toLocaleString() : 'N/A'}
              </span>
              <span className={`text-[9px] font-semibold block tabular-nums ${isTP2Hit ? 'text-emerald-700' : isTP1Hit && !isResolved ? 'text-amber-700' : 'text-slate-500'}`}>
                {isTP2Hit ? 'Banked (35%)' : isTP1Hit && !isResolved ? 'Trailing' : isResolved && isTP1Hit ? 'Closed @ Mid' : '+2.8R Target'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-4 h-4 rounded-full bg-[#fdfaf3] border-2 flex items-center justify-center transition-all ${isTP3Hit
                  ? 'border-emerald-600'
                  : isTP2Hit && !isResolved
                    ? 'border-amber-500 animate-pulse'
                    : 'border-slate-300'
                }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isTP3Hit ? 'bg-emerald-600' : isTP2Hit && !isResolved ? 'bg-amber-500' : 'bg-transparent'
                  }`}
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 block uppercase">4. TP3 (25%)</span>
              <span className={`text-xs font-bold block truncate tabular-nums ${isTP3Hit ? 'text-emerald-700' : isTP2Hit && !isResolved ? 'text-amber-700' : 'text-slate-600'}`}>
                ${tp3?.target_price ? tp3.target_price.toLocaleString() : 'N/A'}
              </span>
              <span className={`text-[9px] font-semibold block tabular-nums ${isTP3Hit ? 'text-emerald-700' : isTP2Hit && !isResolved ? 'text-amber-700' : 'text-slate-500'}`}>
                {isTP3Hit ? 'MAX ACHIEVED' : isTP2Hit && !isResolved ? 'Trailing' : isResolved && isTP1Hit ? 'Closed @ Mid' : '+4.5R Runner'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px]">
        <div className="inline-flex items-center gap-1.5 text-[11px]">
          <span className={`w-1.5 h-1.5 rounded-full ${isSLHit ? 'bg-rose-600' : isTP1Hit ? 'bg-sky-600 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Active Protection:</span>
          <span className={`font-bold tabular-nums ${trailingSLColor}`}>{trailingSLText}</span>
          <span className="text-slate-500 text-[10px]">({trailingSLBadge})</span>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          {isTP2Hit && isTP2Ratcheted && !isResolved && 'Price crossed Mid(TP2↔TP3) · SL ratcheted to Full TP2 (+2.0R locked)!'}
          {isTP2Hit && !isTP2Ratcheted && !isResolved && '75% profit banked · Initial buffer @ Mid(TP1↔TP2) (+1.5R locked).'}
          {isTP1Hit && isTP1Ratcheted && !isTP2Hit && !isResolved && 'Price crossed Mid(TP1↔TP2) · SL ratcheted to Full TP1 (+1.0R locked)!'}
          {isTP1Hit && !isTP1Ratcheted && !isTP2Hit && !isResolved && '40% profit banked · Initial buffer @ Mid(Entry↔TP1) (+0.5R locked).'}
          {!isTP1Hit && !isSLHit && 'Evaluating candle closes toward TP1.'}
        </div>
      </div>
    </div>
  )
}
