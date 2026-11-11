'use client'

import React from 'react'

interface MultiTierProgressTrackerProps {
  entryPrice: number
  stopLoss: number
  tp1?: { target_price: number; rr_ratio: number }
  tp2?: { target_price: number; rr_ratio: number }
  tp3?: { target_price: number; rr_ratio: number }
  direction?: 'BUY' | 'SELL' | string
  systemOutcome?: string | null
  systemOutcomeDetail?: string | null
  status?: string | null
  className?: string
}

export function MultiTierProgressTracker({
  entryPrice,
  stopLoss,
  tp1,
  tp2,
  tp3,
  direction = 'BUY',
  systemOutcome,
  systemOutcomeDetail,
  status,
  className = '',
}: MultiTierProgressTrackerProps) {
  const detail = systemOutcomeDetail?.toUpperCase() || ''
  const isResolved = status === 'RESOLVED'
  const isSLHit = systemOutcome === 'STOP_LOSS_HIT'
  const isTPHit = systemOutcome === 'TARGET_PROFIT_HIT'

  // Determine stage flags
  const isTP1Hit = isTPHit && (detail.includes('TP1') || detail.includes('TP2') || detail.includes('TP3'))
  const isTP2Hit = isTPHit && (detail.includes('TP2') || detail.includes('TP3'))
  const isTP3Hit = isTPHit && detail.includes('TP3')

  // Midpoint calculations for buffered trailing stop
  const tp1Price = tp1?.target_price ?? 0
  const tp2Price = tp2?.target_price ?? 0
  const tp3Price = tp3?.target_price ?? 0
  const midEntryTP1 = tp1Price > 0 ? (entryPrice + tp1Price) / 2 : entryPrice
  const midTP1TP2 = tp1Price > 0 && tp2Price > 0 ? (tp1Price + tp2Price) / 2 : tp1Price
  const midTP2TP3 = tp2Price > 0 && tp3Price > 0 ? (tp2Price + tp3Price) / 2 : tp2Price

  // Determine ratchet states
  const isTP1Ratcheted = isTPHit && (detail.includes('TP1_RATCHET') || detail.includes('TP2') || detail.includes('TP3'))
  const isTP2Ratcheted = isTPHit && (detail.includes('TP2_RATCHET') || detail.includes('TP3'))

  // Trailing Stop Loss value and status
  let trailingSLText = `$${stopLoss.toLocaleString()}`
  let trailingSLBadge = 'Initial SL'
  let trailingSLColor = 'text-rose-400'

  if (isTP2Hit) {
    if (isTP2Ratcheted && !isTP3Hit) {
      trailingSLText = tp2Price > 0 ? `$${tp2Price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Full TP2'
      trailingSLBadge = isResolved ? 'Exited @ Ratchet TP2 (+2.0R)' : 'Ratcheted to Full TP2 (+2.0R Locked)'
      trailingSLColor = isResolved ? 'text-zinc-400' : 'text-emerald-400'
    } else {
      trailingSLText = midTP1TP2 > 0 ? `$${midTP1TP2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Mid(TP1↔TP2)'
      trailingSLBadge = isResolved ? 'Exited @ Mid Trailing (+1.5R)' : 'Trailed to Mid(TP1↔TP2) (+1.5R Locked)'
      trailingSLColor = isResolved ? 'text-zinc-400' : 'text-emerald-400'
    }
  } else if (isTP1Hit) {
    if (isTP1Ratcheted && !isTP2Hit) {
      trailingSLText = tp1Price > 0 ? `$${tp1Price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Full TP1'
      trailingSLBadge = isResolved ? 'Exited @ Ratchet TP1 (+1.0R)' : 'Ratcheted to Full TP1 (+1.0R Locked)'
      trailingSLColor = isResolved ? 'text-zinc-400' : 'text-cyan-300'
    } else {
      trailingSLText = midEntryTP1 > 0 ? `$${midEntryTP1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Mid(Entry↔TP1)'
      trailingSLBadge = isResolved ? 'Exited @ Mid Trailing (+0.5R)' : 'Trailed to Mid(Entry↔TP1) (+0.5R Locked)'
      trailingSLColor = isResolved ? 'text-zinc-400' : 'text-cyan-300'
    }
  } else if (isSLHit) {
    trailingSLBadge = 'Stopped Out'
    trailingSLColor = 'text-rose-500'
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
      {/* Sleek Minimal Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          Multi-Tier Take Profit & Trailing SL
        </span>

        <div className="text-[11px] flex items-center gap-1.5">
          <span className="text-text-muted text-[10px]">Net Return:</span>
          <span className={`font-bold ${isSLHit ? 'text-rose-400' : isTPHit ? 'text-emerald-400' : 'text-zinc-300'}`}>
            {realizedRText}
          </span>
        </div>
      </div>

      {/* Modern Stepper Track (No nested box borders) */}
      <div className="relative pt-2 pb-1">
        {/* Continuous background connecting line */}
        <div className="absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-white/[0.08] z-0" />

        {/* SL Loss progress line if stopped out */}
        {isSLHit && (
          <div className="absolute top-[18px] left-[10%] w-[20%] h-[2px] bg-rose-500/70 transition-all duration-500 z-0" />
        )}

        {/* Take Profit progress highlight line */}
        <div
          className="absolute top-[18px] left-[30%] h-[2px] bg-emerald-500/70 transition-all duration-500 z-0"
          style={{
            width: isTP3Hit ? '60%' : isTP2Hit ? '40%' : isTP1Hit ? '20%' : '0%',
          }}
        />

        {/* 5 Milestones: SL, Entry, TP1, TP2, TP3 */}
        <div className="grid grid-cols-5 gap-2 relative z-10">
          {/* Node 0: SL */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-4 h-4 rounded-full bg-[#0d111c] border-2 flex items-center justify-center transition-all ${isSLHit
                  ? 'border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse'
                  : 'border-rose-500/40'
                }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isSLHit ? 'bg-rose-500' : 'bg-rose-500/50'
                  }`}
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-rose-400/80 block uppercase font-semibold">SL (-1.0R)</span>
              <span className={`text-xs font-bold block truncate ${isSLHit ? 'text-rose-400' : 'text-rose-300/80'}`}>
                ${stopLoss.toLocaleString()}
              </span>
              <span className={`text-[9px] font-semibold block ${isSLHit ? 'text-rose-400' : 'text-zinc-500'}`}>
                {isSLHit ? 'Triggered (-1R)' : 'Protection'}
              </span>
            </div>
          </div>

          {/* Node 1: Entry */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div className="w-4 h-4 rounded-full bg-[#0d111c] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-muted block uppercase">1. Entry</span>
              <span className="text-xs font-bold text-white block truncate">
                ${entryPrice.toLocaleString()}
              </span>
              <span className="text-[9px] text-cyan-300 font-semibold block">
                Filled (100%)
              </span>
            </div>
          </div>

          {/* Node 2: TP1 */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-4 h-4 rounded-full bg-[#0d111c] border-2 flex items-center justify-center transition-all ${isTP1Hit
                  ? 'border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'border-white/20'
                }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isTP1Hit ? 'bg-emerald-400' : 'bg-transparent'
                  }`}
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-muted block uppercase">2. TP1 (40%)</span>
              <span className={`text-xs font-bold block truncate ${isTP1Hit ? 'text-emerald-400' : 'text-zinc-400'}`}>
                ${tp1?.target_price ? tp1.target_price.toLocaleString() : 'N/A'}
              </span>
              <span className={`text-[9px] font-semibold block ${isTP1Hit ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {isTP1Hit ? 'Banked (40%)' : '+1.5R Target'}
              </span>
            </div>
          </div>

          {/* Node 3: TP2 */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-4 h-4 rounded-full bg-[#0d111c] border-2 flex items-center justify-center transition-all ${isTP2Hit
                  ? 'border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : isTP1Hit && !isResolved
                    ? 'border-amber-400 animate-pulse'
                    : 'border-white/20'
                }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isTP2Hit ? 'bg-emerald-400' : isTP1Hit && !isResolved ? 'bg-amber-400' : 'bg-transparent'
                  }`}
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-muted block uppercase">3. TP2 (35%)</span>
              <span className={`text-xs font-bold block truncate ${isTP2Hit ? 'text-emerald-400' : isTP1Hit && !isResolved ? 'text-amber-300' : 'text-zinc-400'}`}>
                ${tp2?.target_price ? tp2.target_price.toLocaleString() : 'N/A'}
              </span>
              <span className={`text-[9px] font-semibold block ${isTP2Hit ? 'text-emerald-400' : isTP1Hit && !isResolved ? 'text-amber-400' : 'text-zinc-500'}`}>
                {isTP2Hit ? 'Banked (35%)' : isTP1Hit && !isResolved ? 'Trailing' : isResolved && isTP1Hit ? 'Closed @ Mid' : '+2.8R Target'}
              </span>
            </div>
          </div>

          {/* Node 4: TP3 */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-4 h-4 rounded-full bg-[#0d111c] border-2 flex items-center justify-center transition-all ${isTP3Hit
                  ? 'border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                  : isTP2Hit && !isResolved
                    ? 'border-amber-400 animate-pulse'
                    : 'border-white/20'
                }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isTP3Hit ? 'bg-emerald-400' : isTP2Hit && !isResolved ? 'bg-amber-400' : 'bg-transparent'
                  }`}
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-muted block uppercase">4. TP3 (25%)</span>
              <span className={`text-xs font-bold block truncate ${isTP3Hit ? 'text-emerald-400' : isTP2Hit && !isResolved ? 'text-amber-300' : 'text-zinc-400'}`}>
                ${tp3?.target_price ? tp3.target_price.toLocaleString() : 'N/A'}
              </span>
              <span className={`text-[9px] font-semibold block ${isTP3Hit ? 'text-emerald-400' : isTP2Hit && !isResolved ? 'text-amber-400' : 'text-zinc-500'}`}>
                {isTP3Hit ? 'MAX ACHIEVED' : isTP2Hit && !isResolved ? 'Trailing' : isResolved && isTP1Hit ? 'Closed @ Mid' : '+4.5R Runner'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trailing SL Single-Line Footer (Clean & Borderless) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px]">
        <div className="inline-flex items-center gap-1.5 text-[11px]">
          <span className={`w-1.5 h-1.5 rounded-full ${isSLHit ? 'bg-rose-500' : isTP1Hit ? 'bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'bg-rose-400'}`} />
          <span className="text-text-muted text-[10px] uppercase font-semibold tracking-wider">Active Protection:</span>
          <span className={`font-bold ${trailingSLColor}`}>{trailingSLText}</span>
          <span className="text-text-muted text-[10px]">({trailingSLBadge})</span>
        </div>

        <div className="text-[10px] text-text-muted font-mono">
          {isTP2Hit && isTP2Ratcheted && !isResolved && '🔥 Price crossed Mid(TP2↔TP3) · SL ratcheted to Full TP2 (+2.0R locked)!'}
          {isTP2Hit && !isTP2Ratcheted && !isResolved && '🔥 75% profit banked · Initial buffer @ Mid(TP1↔TP2) (+1.5R locked).'}
          {isTP1Hit && isTP1Ratcheted && !isTP2Hit && !isResolved && '🚀 Price crossed Mid(TP1↔TP2) · SL ratcheted to Full TP1 (+1.0R locked)!'}
          {isTP1Hit && !isTP1Ratcheted && !isTP2Hit && !isResolved && '⚡ 40% profit banked · Initial buffer @ Mid(Entry↔TP1) (+0.5R locked).'}
          {!isTP1Hit && !isSLHit && '⏳ Evaluating candle closes toward TP1.'}
        </div>
      </div>
    </div>
  )
}
