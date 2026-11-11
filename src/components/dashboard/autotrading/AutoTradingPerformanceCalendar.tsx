'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'

export interface AutoTradeRecord {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm UTC
  symbol: string
  direction: 'LONG' | 'SHORT'
  leverage: number
  entryPrice: number
  exitPrice: number
  confluenceScore: number
  outcome: 'TP_HIT' | 'SL_HIT' | 'OPEN'
  targetHit?: 'TP1' | 'TP2' | 'TP3' | 'SL'
  pnlUsdt: number
  pnlPct: number
  note?: string
  timestamp?: number
}

interface AutoTradingPerformanceCalendarProps {
  isConnected: boolean
  isAutoTrading: boolean
  accountBalance?: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function AutoTradingPerformanceCalendar({
  isConnected,
  isAutoTrading,
}: AutoTradingPerformanceCalendarProps) {
  const today = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1) // 1-indexed

  const [trades, setTrades] = useState<AutoTradeRecord[]>([])
  const [selectedDayTrades, setSelectedDayTrades] = useState<{ date: string; trades: AutoTradeRecord[] } | null>(null)

  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

  // Load purely REAL bot executions from client localStorage
  const loadTrades = useCallback(() => {
    try {
      const saved = localStorage.getItem('acts_autotrade_executions')
      if (saved) {
        let parsed: AutoTradeRecord[] = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const resetTime = Number(localStorage.getItem('acts_stats_reset_at') || 0)
          if (resetTime > 0) {
            parsed = parsed.filter((t) => {
              const tTime = t.timestamp || Date.parse(`${t.date}T${(t.time || '00:00').replace(' UTC', '')}Z`) || 0
              return tTime >= resetTime
            })
          }
          if (parsed.length === 0) {
            setTrades([])
            return
          }

          // If legacy raw fills exist in localStorage (id starts with 'binance-trade-'),
          // consolidate them so multi-tier TP/SL fills count as 1 signal outcome
          let records = parsed
          if (parsed.some((t) => t.id && t.id.startsWith('binance-trade-'))) {
            const consolidated: AutoTradeRecord[] = []
            let curSignal: AutoTradeRecord | null = null
            for (const t of parsed) {
              const tTime = t.timestamp || Date.parse(`${t.date}T${(t.time || '00:00').replace(' UTC', '')}Z`) || 0
              const curTime = curSignal ? (curSignal.timestamp || 0) : 0
              if (
                !curSignal ||
                curSignal.direction !== t.direction ||
                curSignal.date !== t.date ||
                Math.abs(tTime - curTime) > 30 * 60 * 1000
              ) {
                if (curSignal) consolidated.push(curSignal)
                curSignal = { ...t }
              } else {
                curSignal.pnlUsdt = parseFloat((curSignal.pnlUsdt + t.pnlUsdt).toFixed(2))
                curSignal.outcome = curSignal.pnlUsdt > 0 ? 'TP_HIT' : 'SL_HIT'
                if (t.targetHit === 'TP3' || curSignal.targetHit === 'TP3') {
                  curSignal.targetHit = 'TP3'
                } else if (t.targetHit === 'TP2' || curSignal.targetHit === 'TP2') {
                  curSignal.targetHit = 'TP2'
                } else if (curSignal.outcome === 'TP_HIT') {
                  curSignal.targetHit = 'TP1'
                } else {
                  curSignal.targetHit = 'SL'
                }
                curSignal.timestamp = Math.max(curTime, tTime)
              }
            }
            if (curSignal) consolidated.push(curSignal)
            records = consolidated
          }

          setTrades(records.filter((t) => t.date && t.date.startsWith(monthStr)))
          return
        }
      }
      // Strictly no fake mock data
      setTrades([])
    } catch {
      setTrades([])
    }
  }, [monthStr])

  useEffect(() => {
    loadTrades()
    const handleUpdated = () => loadTrades()
    window.addEventListener('acts_executions_updated', handleUpdated)
    return () => window.removeEventListener('acts_executions_updated', handleUpdated)
  }, [loadTrades])

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  // Aggregate monthly stats strictly from real executed trades
  const monthlyStats = useMemo(() => {
    const totalExecutions = trades.length
    const tpHits = trades.filter((t) => t.outcome === 'TP_HIT').length
    const slHits = trades.filter((t) => t.outcome === 'SL_HIT').length
    const netPnl = trades.reduce((acc, t) => acc + t.pnlUsdt, 0)
    const winRate = totalExecutions > 0 ? (tpHits / totalExecutions) * 100 : 0

    return {
      totalExecutions,
      tpHits,
      slHits,
      netPnl,
      winRate,
    }
  }, [trades])

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const map: Record<string, AutoTradeRecord[]> = {}
    for (const t of trades) {
      if (!map[t.date]) {
        map[t.date] = []
      }
      map[t.date].push(t)
    }
    return map
  }, [trades])

  // Calendar days layout calculation (Monday to Sunday)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const startDayIndex = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

    const cells: Array<{
      dayNum: number | null
      dateStr: string | null
      trades: AutoTradeRecord[]
      netPnl: number
      hasTpHit: boolean
      hasSlHit: boolean
      isToday: boolean
    }> = []

    // Padding for previous month days
    for (let i = 0; i < startDayIndex; i++) {
      cells.push({
        dayNum: null,
        dateStr: null,
        trades: [],
        netPnl: 0,
        hasTpHit: false,
        hasSlHit: false,
        isToday: false,
      })
    }

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayTrades = tradesByDate[dateStr] || []
      const netPnl = dayTrades.reduce((acc, t) => acc + t.pnlUsdt, 0)
      const hasTpHit = dayTrades.some((t) => t.outcome === 'TP_HIT')
      const hasSlHit = dayTrades.some((t) => t.outcome === 'SL_HIT')
      const isToday = dateStr === todayStr

      cells.push({
        dayNum: d,
        dateStr,
        trades: dayTrades,
        netPnl,
        hasTpHit,
        hasSlHit,
        isToday,
      })
    }

    return cells
  }, [currentYear, currentMonth, tradesByDate, today])

  const hasAnyData = monthlyStats.totalExecutions > 0

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#10141E]/80 backdrop-blur-xl p-6 shadow-xl space-y-5">
      <div className="space-y-2 border-b border-white/[0.05] pb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Auto-Trading Performance Calendar
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Tracks executed signal cycles, TP hits, and Stop-Loss triggers from your connected Binance account
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Previous Month"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono font-bold text-white min-w-[120px] text-center">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Next Month"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Executions:</span>
            <span className="text-white font-semibold">
              {hasAnyData ? `${monthlyStats.totalExecutions} signals` : '--'}
            </span>
          </div>

          <span className="text-zinc-700 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">TP Hits:</span>
            <span className={hasAnyData && monthlyStats.tpHits > 0 ? 'text-[#00e676] font-bold' : 'text-zinc-400 font-semibold'}>
              {hasAnyData ? `${monthlyStats.tpHits} (${Math.round(monthlyStats.winRate)}%)` : '--'}
            </span>
          </div>

          <span className="text-zinc-700 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Stop-Loss:</span>
            <span className={hasAnyData && monthlyStats.slHits > 0 ? 'text-rose-400 font-bold' : 'text-zinc-400 font-semibold'}>
              {hasAnyData ? `${monthlyStats.slHits}` : '--'}
            </span>
          </div>

          <span className="text-zinc-700 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Net Return:</span>
            <span
              className={
                hasAnyData
                  ? monthlyStats.netPnl >= 0
                    ? 'text-[#00e676] font-bold'
                    : 'text-rose-400 font-bold'
                  : 'text-zinc-400 font-semibold'
              }
            >
              {hasAnyData
                ? monthlyStats.netPnl >= 0
                  ? `+$${monthlyStats.netPnl.toFixed(2)}`
                  : `-$${Math.abs(monthlyStats.netPnl).toFixed(2)}`
                : '--'}
            </span>
            {hasAnyData && <span className="text-[10px] text-zinc-600">USDT</span>}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-1 text-[11px] font-mono font-semibold text-zinc-500 uppercase">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell, idx) => {
            if (!cell.dayNum) {
              return (
                <div
                  key={`pad-${idx}`}
                  className="min-h-[58px] sm:min-h-[64px] rounded-xl bg-black/10 border border-transparent opacity-20"
                />
              )
            }

            const hasTrades = cell.trades.length > 0
            const isProfit = cell.netPnl > 0
            const isLoss = cell.netPnl < 0

            return (
              <button
                key={cell.dateStr!}
                type="button"
                onClick={() => {
                  if (hasTrades) {
                    setSelectedDayTrades({ date: cell.dateStr!, trades: cell.trades })
                  }
                }}
                disabled={!hasTrades}
                className={`min-h-[58px] sm:min-h-[64px] rounded-xl p-2 text-left flex flex-col justify-between transition-all relative border select-none ${
                  hasTrades
                    ? isProfit
                      ? 'bg-[#00e676]/[0.08] hover:bg-[#00e676]/[0.15] border-[#00e676]/30 cursor-pointer shadow-[0_0_12px_rgba(0,230,118,0.08)]'
                      : 'bg-rose-500/[0.08] hover:bg-rose-500/[0.15] border-rose-500/30 cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.08)]'
                    : 'bg-black/20 border-white/[0.04] cursor-default'
                } ${cell.isToday ? 'ring-1 ring-[#F0B90B] shadow-[0_0_8px_rgba(240,185,11,0.2)]' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono font-semibold ${
                      cell.isToday
                        ? 'text-[#F0B90B] font-bold'
                        : hasTrades
                        ? 'text-white'
                        : 'text-zinc-600'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {cell.isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F0B90B] shadow-[0_0_6px_#F0B90B]" title="Today (Standby)" />
                  )}

                  {hasTrades && (
                    <div className="flex items-center gap-1">
                      {cell.hasTpHit && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-[#00e676]/20 text-[#00e676]">
                          TP
                        </span>
                      )}
                      {cell.hasSlHit && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400">
                          SL
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {hasTrades ? (
                  <div className="mt-1">
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-bold block leading-none ${
                        isProfit ? 'text-[#00e676]' : isLoss ? 'text-rose-400' : 'text-zinc-300'
                      }`}
                    >
                      {cell.netPnl >= 0
                        ? `+$${cell.netPnl.toFixed(1)}`
                        : `-$${Math.abs(cell.netPnl).toFixed(1)}`}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">
                      {cell.trades.length} {cell.trades.length === 1 ? 'signal' : 'signals'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-mono text-zinc-700 block mt-1">--</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/[0.05] text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-400">
          <span
            className={`w-2 h-2 rounded-full ${
              isAutoTrading && isConnected
                ? 'bg-[#00e676] animate-pulse'
                : isConnected
                ? 'bg-[#F0B90B]'
                : 'bg-zinc-600'
            }`}
          />
          <span>
            {isAutoTrading && isConnected
              ? 'Bot Active: Auto-logging executed bracket orders to this calendar'
              : isConnected
              ? 'Bot Standby: Ready to log trades once autopilot is toggled on'
              : 'Terminal Offline: Connect Binance API to synchronize live executions'}
          </span>
        </div>

        <span className="text-[11px] text-zinc-500">
          {hasAnyData
            ? `${monthlyStats.totalExecutions} total auto-trading signals executed`
            : '0 auto-trades executed yet this month'}
        </span>
      </div>

      {selectedDayTrades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e121d] border border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Auto-Trading Executions • {selectedDayTrades.date}
                </h3>
                <p className="text-xs text-text-muted">
                  {selectedDayTrades.trades.length}{' '}
                  {selectedDayTrades.trades.length === 1 ? 'signal executed' : 'signals executed'} on Binance Futures
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayTrades(null)}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {selectedDayTrades.trades.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          t.direction === 'LONG'
                            ? 'bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {t.direction} {t.leverage}x
                      </span>
                      <span className="font-bold text-white">{t.symbol}</span>
                      <span className="text-zinc-500 text-[10px]">• {t.time}</span>
                    </div>

                    <span
                      className={`font-bold ${
                        t.outcome === 'TP_HIT' ? 'text-[#00e676]' : 'text-rose-400'
                      }`}
                    >
                      {t.outcome === 'TP_HIT'
                        ? `✓ ${t.targetHit ? (t.targetHit.endsWith('HIT') ? t.targetHit : `${t.targetHit} HIT`) : 'TP HIT'}`
                        : '✕ STOP HIT'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-400 pt-1 border-t border-white/[0.03]">
                    <div>
                      <span className="block text-[10px] text-zinc-500">Entry</span>
                      <span className="text-white">${t.entryPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500">Exit / Target</span>
                      <span className="text-white">${t.exitPrice.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-zinc-500">Realized PnL</span>
                      <span
                        className={`font-bold ${
                          t.pnlUsdt >= 0 ? 'text-[#00e676]' : 'text-rose-400'
                        }`}
                      >
                        {t.pnlUsdt >= 0
                          ? `+$${t.pnlUsdt.toFixed(2)}`
                          : `-$${Math.abs(t.pnlUsdt).toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {t.note && (
                    <div className="text-[10px] text-zinc-400 bg-black/30 px-2.5 py-1 rounded-md">
                      {t.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayTrades(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-white transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
