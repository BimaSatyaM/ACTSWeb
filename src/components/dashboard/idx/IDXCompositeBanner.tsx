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
    <div className="p-5 sm:p-6 rounded-2xl bg-[#faf2df] border border-slate-900/10 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="uppercase font-bold tracking-wider text-slate-600">
              IDX Composite Index
            </span>
            <span className="text-slate-500">·</span>
            <span className="font-bold text-[#0369a1]">
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
              <span className="text-3xl sm:text-4xl font-black text-slate-950 font-mono tabular-nums tracking-tight">
                {ihsg.indexValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold font-mono tabular-nums ${
                isPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                <span>{isPositive ? '▲' : '▼'}</span>
                <span>{isPositive ? '+' : ''}{ihsg.changePoints.toFixed(2)}</span>
                <span>({isPositive ? '+' : ''}{ihsg.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-2 lg:border-l border-slate-900/10 lg:pl-6">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-slate-500">
            <span>Intraday Range</span>
            <span className="text-slate-800 font-bold tabular-nums">{currentPos}% of Span</span>
          </div>

          <div className="relative w-full h-1.5 bg-slate-900/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#0284c7] rounded-full"
              style={{ width: `${currentPos}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600">
            <span>Low {ihsg.dayLow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span>High {ihsg.dayHigh.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-900/10">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
            Market Turnover
          </span>
          <span className="font-mono tabular-nums font-bold text-slate-900 text-base sm:text-lg block">
            Rp {ihsg.turnoverTrillion.toFixed(2)} T
          </span>
          <span className="text-[10px] text-slate-500">Total Value Traded</span>
        </div>

        <div className="space-y-0.5 lg:border-l border-slate-900/10 lg:pl-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
            Volume &amp; Frequency
          </span>
          <span className="font-mono tabular-nums font-bold text-slate-900 text-base sm:text-lg block">
            {ihsg.volumeBillion.toFixed(2)} B <span className="text-xs font-normal text-slate-500">shares</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono tabular-nums">{ihsg.frequencyTrades.toLocaleString()} trades</span>
        </div>

        <div className="space-y-0.5 lg:border-l border-slate-900/10 lg:pl-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
            Foreign Net Flow
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono tabular-nums font-bold text-base sm:text-lg ${ihsg.foreignNetFlowBillion >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {ihsg.foreignNetFlowBillion >= 0 ? '+Rp ' : '-Rp '}
              {Math.abs(ihsg.foreignNetFlowBillion).toFixed(1)} B
            </span>
          </div>
          <span className={`text-[10px] font-semibold ${ihsg.foreignNetFlowBillion >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {ihsg.foreignNetFlowBillion >= 0 ? 'Net Foreign Inflow' : 'Net Foreign Outflow'}
          </span>
        </div>

        <div className="space-y-0.5 lg:border-l border-slate-900/10 lg:pl-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
            Market Breadth
          </span>
          <div className="flex items-center gap-3 pt-0.5 text-xs font-mono tabular-nums font-bold">
            <span className="text-emerald-700 flex items-center gap-1" title="Advancing">
              <span className="text-[10px]">▲</span> {ihsg.advancing}
            </span>
            <span className="text-rose-700 flex items-center gap-1" title="Declining">
              <span className="text-[10px]">▼</span> {ihsg.declining}
            </span>
            <span className="text-slate-500 flex items-center gap-1" title="Unchanged">
              <span className="text-[10px]">=</span> {ihsg.unchanged}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Advancing / Declining Ratio</span>
        </div>
      </div>
    </div>
  )
}
