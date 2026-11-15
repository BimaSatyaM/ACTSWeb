'use client'

import React, { useState, useMemo } from 'react'
import { StreamTrade } from '@/lib/useIDXStream'

interface IDXRunningTradeTapeProps {
  trades: StreamTrade[]
  activeSymbol?: string
  onSelectStock?: (symbol: string) => void
}

export function IDXRunningTradeTape({
  trades,
  activeSymbol,
  onSelectStock,
}: IDXRunningTradeTapeProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'block'>('all')

  // Calculate live trade velocity (trades in the last 5 seconds)
  const tradeVelocity = useMemo(() => {
    const now = Date.now()
    const recent = trades.filter((t) => now - t.timestamp < 5000)
    return recent.length > 0 ? Math.max(1, Math.round(recent.length / 5)) : 0
  }, [trades])

  // Filtered trade list
  const displayTrades = useMemo(() => {
    let list = trades
    if (filterMode === 'active' && activeSymbol) {
      list = list.filter((t) => t.symbol === activeSymbol)
    } else if (filterMode === 'block') {
      list = list.filter((t) => t.lots >= 500)
    }
    return list
  }, [trades, activeSymbol, filterMode])

  // Cumulative session lots and turnover based on displayed trades
  const { sessionLots, sessionTurnoverBillion } = useMemo(() => {
    let lots = 0
    let turnover = 0
    for (const t of displayTrades) {
      lots += t.lots
      turnover += t.lots * 100 * t.price
    }
    return {
      sessionLots: lots,
      sessionTurnoverBillion: Math.round((turnover / 1_000_000_000) * 100) / 100,
    }
  }, [displayTrades])

  return (
    <div className="flex flex-col h-full rounded-xl bg-[#fdfaf3] border border-slate-200/80 overflow-hidden shadow-xs">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-[#faf2df]/60 border-b border-slate-200/80 gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tradeVelocity > 0 ? 'bg-sky-600 animate-pulse' : 'bg-slate-400'}`} />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Running Trade Tape
          </h3>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
            tradeVelocity > 0 ? 'bg-sky-50 text-sky-800 border border-sky-200/70' : 'bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}>
            {tradeVelocity} trades/s
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#f0ebe1] p-0.5 rounded-lg border border-slate-200/80 text-[11px] font-mono">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filterMode === 'all' ? 'bg-[#faf2df] text-sky-950 font-bold shadow-xs border border-slate-900/15' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Market
          </button>
          {activeSymbol && (
            <button
              onClick={() => setFilterMode('active')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filterMode === 'active' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeSymbol} Only
            </button>
          )}
          <button
            onClick={() => setFilterMode('block')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filterMode === 'block' ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Block ≥500
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-2 bg-[#f8f5ee] border-b border-slate-200/80 text-[11px] font-mono">
        <div>
          <span className="text-slate-500 text-[10px] block">Streamed Lots</span>
          <span className="text-slate-900 font-bold">{sessionLots.toLocaleString()} lots</span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 text-[10px] block">Tape Value</span>
          <span className="text-emerald-700 font-bold">Rp {sessionTurnoverBillion.toLocaleString()} B</span>
        </div>
      </div>

      <div className="grid grid-cols-5 text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-500 px-4 py-2 bg-[#f0ebe1]/70 border-b border-slate-200/80">
        <span>Time</span>
        <span>Stock</span>
        <span className="text-right">Price</span>
        <span className="text-right">Lots</span>
        <span className="text-right">Action</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[480px] divide-y divide-slate-900/10 text-xs font-mono">
        {displayTrades.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-base">
              🛑
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 font-mono">Market Session Closed</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                No active trade matching. The exchange is closed. Tape resumes next trading session at 09:00 WIB.
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                Regular Trading: 09:00 - 15:50 WIB (Pre-Open 08:45)
              </span>
            </div>
          </div>
        ) : (
          displayTrades.map((t, index) => {
            const isBuy = t.side === 'BUY'
            const isFirst = index === 0

            return (
              <div
                key={t.id}
                onClick={() => onSelectStock && onSelectStock(t.symbol)}
                className={`grid grid-cols-5 items-center px-4 py-2 hover:bg-sky-50/40 cursor-pointer transition-colors ${
                  isFirst ? 'bg-sky-50/60 border-l-2 border-sky-600' : ''
                }`}
              >
                <span className="text-slate-500 text-[11px]">{t.time}</span>

                <span className="font-bold text-slate-900 flex items-center gap-1">
                  {t.symbol}
                  {t.lots >= 500 && (
                    <span className="text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                      BLOCK
                    </span>
                  )}
                </span>

                <span className={`text-right font-bold ${isBuy ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Rp {t.price.toLocaleString()}
                </span>

                <span className="text-right text-slate-600 font-medium">
                  {t.lots.toLocaleString()}
                </span>

                <div className="text-right">
                  <span
                    className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      isBuy
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {t.isForeign ? 'F.' : 'D.'}{t.side}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
