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
    <div className="flex flex-col h-full rounded-xl bg-[#0d121f] border border-white/[0.08] overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-white/[0.01] border-b border-white/[0.08] gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tradeVelocity > 0 ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-500'}`} />
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
            Running Trade Tape
          </h3>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
            tradeVelocity > 0 ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
          }`}>
            {tradeVelocity} trades/s
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#070b14] p-0.5 rounded-lg border border-white/[0.08] text-[11px] font-mono">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filterMode === 'all' ? 'bg-white/[0.12] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Market
          </button>
          {activeSymbol && (
            <button
              onClick={() => setFilterMode('active')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filterMode === 'active' ? 'bg-[#ff2e54] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {activeSymbol} Only
            </button>
          )}
          <button
            onClick={() => setFilterMode('block')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filterMode === 'block' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Block ≥500
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-2 bg-[#070b14] border-b border-white/[0.06] text-[11px] font-mono">
        <div>
          <span className="text-slate-500 text-[10px] block">Streamed Lots</span>
          <span className="text-white font-bold">{sessionLots.toLocaleString()} lots</span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 text-[10px] block">Tape Value</span>
          <span className="text-emerald-400 font-bold">Rp {sessionTurnoverBillion.toLocaleString()} B</span>
        </div>
      </div>

      <div className="grid grid-cols-5 text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 px-4 py-2 bg-[#070b14]/50 border-b border-white/[0.06]">
        <span>Time</span>
        <span>Stock</span>
        <span className="text-right">Price</span>
        <span className="text-right">Lots</span>
        <span className="text-right">Action</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[480px] divide-y divide-white/[0.02] text-xs font-mono">
        {displayTrades.length === 0 ? (
          <div className="p-8 text-center text-text-muted space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-base">
              🛑
            </div>
            <div>
              <p className="text-xs font-bold text-white font-mono">Market Session Closed</p>
              <p className="text-[11px] text-text-muted mt-1 max-w-xs mx-auto">
                No active trade matching. The exchange is closed. Tape resumes next trading session at 09:00 WIB.
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-text-secondary border border-white/[0.06]">
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
                className={`grid grid-cols-5 items-center px-4 py-2 hover:bg-white/[0.04] cursor-pointer transition-colors ${
                  isFirst ? 'bg-white/[0.04] border-l-2 border-cyan-400' : ''
                }`}
              >
                <span className="text-text-muted text-[11px]">{t.time}</span>

                <span className="font-bold text-white flex items-center gap-1">
                  {t.symbol}
                  {t.lots >= 500 && (
                    <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                      BLOCK
                    </span>
                  )}
                </span>

                <span className={`text-right font-bold ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Rp {t.price.toLocaleString()}
                </span>

                <span className="text-right text-text-secondary font-medium">
                  {t.lots.toLocaleString()}
                </span>

                <div className="text-right">
                  <span
                    className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      isBuy
                        ? t.isForeign
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                          : 'bg-emerald-500/10 text-emerald-400'
                        : t.isForeign
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                        : 'bg-rose-500/10 text-rose-400'
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
