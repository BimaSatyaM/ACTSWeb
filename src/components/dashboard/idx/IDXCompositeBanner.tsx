'use client'

import React from 'react'
import Image from 'next/image'

export interface IHSGMarketData {
  indexValue: number
  changePoints: number
  changePercent: number
  dayHigh: number
  dayLow: number
  turnoverTrillion: number
  volumeBillion: number
  frequencyTrades: number
  foreignNetFlowBillion: number
  advancing: number
  declining: number
  unchanged: number
}

// Fallback / Initial institutional snapshot
const DEFAULT_IHSG: IHSGMarketData = {
  indexValue: 7760.42,
  changePoints: 42.15,
  changePercent: 0.55,
  dayHigh: 7785.40,
  dayLow: 7712.18,
  turnoverTrillion: 12.85,
  volumeBillion: 18.42,
  frequencyTrades: 1245612,
  foreignNetFlowBillion: 482.5,
  advancing: 285,
  declining: 215,
  unchanged: 240,
}

interface IDXCompositeBannerProps {
  data?: Partial<IHSGMarketData>
}

export function IDXCompositeBanner({ data }: IDXCompositeBannerProps) {
  const ihsg = { ...DEFAULT_IHSG, ...data }
  const isPositive = ihsg.changePoints >= 0

  // Calculate day range pin position (0 - 100%)
  const rangeSpan = ihsg.dayHigh - ihsg.dayLow
  const currentPos = rangeSpan > 0 ? Math.min(100, Math.max(0, Math.round(((ihsg.indexValue - ihsg.dayLow) / rangeSpan) * 100))) : 50

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0d121f] border border-white/[0.08] shadow-sm space-y-5">
      {/* ── Top Row: Index Level, Change & Day Range ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              IDX Composite Index
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300 border border-white/[0.08] font-mono">
              ^JKSE · IHSG
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 mt-2">
            <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0">
              <Image
                src="/assets/idx-emblem.png"
                alt="IHSG Logo"
                width={44}
                height={44}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {ihsg.indexValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold font-mono border ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {isPositive ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
                <span>{isPositive ? '+' : ''}{ihsg.changePoints.toFixed(2)}</span>
                <span>({isPositive ? '+' : ''}{ihsg.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Daily Range Slider Bar ── */}
        <div className="w-full lg:w-80 space-y-2 p-3 rounded-xl bg-[#121829]/60 border border-white/[0.06]">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Low: {ihsg.dayLow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span>High: {ihsg.dayHigh.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="relative w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-emerald-500/50 rounded-full"
              style={{ width: `${currentPos}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-all duration-300"
              style={{ left: `calc(${currentPos}% - 5px)` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Day Range</span>
            <span className="font-mono text-slate-200 font-semibold">{currentPos}% of Range</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Strip: Institutional Market Telemetry ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
        <div className="space-y-0.5">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
            Market Turnover
          </span>
          <span className="font-mono font-bold text-white text-base sm:text-lg block">
            Rp {ihsg.turnoverTrillion.toFixed(2)} T
          </span>
          <span className="text-[10px] text-slate-500">Total Value Traded</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
            Volume & Frequency
          </span>
          <span className="font-mono font-bold text-white text-base sm:text-lg block">
            {ihsg.volumeBillion.toFixed(2)} B <span className="text-xs font-normal text-slate-500">shares</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{ihsg.frequencyTrades.toLocaleString()} trades</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
            Foreign Net Flow
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-bold text-base sm:text-lg ${ihsg.foreignNetFlowBillion >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ihsg.foreignNetFlowBillion >= 0 ? '+Rp ' : '-Rp '}
              {Math.abs(ihsg.foreignNetFlowBillion).toFixed(1)} B
            </span>
          </div>
          <span className={`text-[10px] font-medium ${ihsg.foreignNetFlowBillion >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
            {ihsg.foreignNetFlowBillion >= 0 ? 'Net Foreign Inflow' : 'Net Foreign Outflow'}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
            Market Breadth
          </span>
          <div className="flex items-center gap-2.5 pt-0.5 text-xs font-mono font-bold">
            <span className="text-emerald-400 flex items-center gap-1" title="Advancing">
              <span className="text-[10px]">▲</span> {ihsg.advancing}
            </span>
            <span className="text-rose-400 flex items-center gap-1" title="Declining">
              <span className="text-[10px]">▼</span> {ihsg.declining}
            </span>
            <span className="text-slate-400 flex items-center gap-1" title="Unchanged">
              <span className="text-[10px]">=</span> {ihsg.unchanged}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Advancing / Declining Ratio</span>
        </div>
      </div>
    </div>
  )
}
