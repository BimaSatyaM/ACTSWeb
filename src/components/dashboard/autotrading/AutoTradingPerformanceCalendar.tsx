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
    <div className="rounded-2xl border border-slate-900/10 bg-[#faf2df] p-6 space-y-5">
      <div className="space-y-2 border-b border-slate-900/10 pb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                Auto-Trading Performance Calendar
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Tracks executed signal cycles, TP hits, and Stop-Loss triggers from your connected Binance account
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-[#faf2df] hover:bg-[#f3ead2] border border-slate-900/15 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              title="Previous Month"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="px-3 py-1 rounded-lg bg-[#fdfaf3] border border-slate-900/15 text-xs font-mono font-bold text-slate-900 min-w-[120px] text-center tabular-nums">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-[#faf2df] hover:bg-[#f3ead2] border border-slate-900/15 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              title="Next Month"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono tabular-nums pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Executions:</span>
            <span className="text-slate-900 font-semibold tabular-nums">
              {hasAnyData ? `${monthlyStats.totalExecutions} signals` : '--'}
            </span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">TP Hits:</span>
            <span className={hasAnyData && monthlyStats.tpHits > 0 ? 'text-emerald-700 font-bold tabular-nums' : 'text-slate-600 font-semibold tabular-nums'}>
              {hasAnyData ? `${monthlyStats.tpHits} (${Math.round(monthlyStats.winRate)}%)` : '--'}
            </span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Stop-Loss:</span>
            <span className={hasAnyData && monthlyStats.slHits > 0 ? 'text-rose-700 font-bold tabular-nums' : 'text-slate-600 font-semibold tabular-nums'}>
              {hasAnyData ? `${monthlyStats.slHits}` : '--'}
            </span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Net Return:</span>
            <span
              className={
                hasAnyData
                  ? monthlyStats.netPnl >= 0
                    ? 'text-emerald-700 font-bold tabular-nums'
                    : 'text-rose-700 font-bold tabular-nums'
                  : 'text-slate-600 font-semibold tabular-nums'
              }
            >
              {hasAnyData ? (monthlyStats.netPnl >= 0 ? `+$${monthlyStats.netPnl.toFixed(2)}` : `-$${Math.abs(monthlyStats.netPnl).toFixed(2)}`) : '--'}
            </span>
            {hasAnyData && <span className="text-[10px] text-slate-500 tabular-nums">USDT</span>}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-1 text-[11px] font-mono font-semibold text-slate-500 uppercase">
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
                  className="min-h-[58px] sm:min-h-[64px] rounded-xl bg-slate-100/40 border border-transparent opacity-30"
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
                      ? 'bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-300 text-slate-900 cursor-pointer shadow-xs'
                      : 'bg-rose-50/80 hover:bg-rose-100/80 border-rose-300 text-slate-900 cursor-pointer shadow-xs'
                    : 'bg-[#faf2df]/60 border-slate-900/10 text-slate-700 cursor-default'
                } ${cell.isToday ? 'ring-2 ring-[#0284c7] shadow-sm' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono font-semibold tabular-nums ${
                      cell.isToday
                        ? 'text-amber-800 font-bold'
                        : hasTrades
                        ? 'text-slate-900 font-bold'
                        : 'text-slate-600 font-medium'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {cell.isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" title="Today (Standby)" />
                  )}

                  {hasTrades && (
                    <div className="flex items-center gap-1">
                      {cell.hasTpHit && (
                        <span className="text-[9px] font-mono font-bold text-emerald-700">
                          TP
                        </span>
                      )}
                      {cell.hasSlHit && (
                        <span className="text-[9px] font-mono font-bold text-rose-700">
                          SL
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {hasTrades ? (
                  <div className="mt-1">
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-bold block leading-none tabular-nums ${
                        isProfit ? 'text-emerald-700' : isLoss ? 'text-rose-700' : 'text-slate-500'
                      }`}
                    >
                      {cell.netPnl >= 0 ? `+$${cell.netPnl.toFixed(1)}` : `-$${Math.abs(cell.netPnl).toFixed(1)}`}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block mt-0.5 tabular-nums">
                      {cell.trades.length} {cell.trades.length === 1 ? 'signal' : 'signals'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-mono text-slate-500 block mt-1 tabular-nums">--</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-900/10 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-600">
          <span
            className={`w-2 h-2 rounded-full ${
              isAutoTrading && isConnected
                ? 'bg-emerald-500 animate-pulse'
                : isConnected
                ? 'bg-amber-500'
                : 'bg-slate-400'
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

        <span className="text-[11px] text-slate-500 tabular-nums">
          {hasAnyData
            ? `${monthlyStats.totalExecutions} total auto-trading signals executed`
            : '0 auto-trades executed yet this month'}
        </span>
      </div>

      {selectedDayTrades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-[#fdfaf3] border border-slate-900/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                  Auto-Trading Executions • {selectedDayTrades.date}
                </h3>
                <p className="text-xs text-slate-600">
                  {selectedDayTrades.trades.length}{' '}
                  {selectedDayTrades.trades.length === 1 ? 'signal executed' : 'signals executed'} on Binance Futures
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayTrades(null)}
                className="p-1.5 rounded-lg bg-[#faf2df] hover:bg-[#f3ead2] border border-slate-900/15 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-slate-900/10 max-h-[360px] overflow-y-auto pr-1">
              {selectedDayTrades.trades.map((t) => (
                <div
                  key={t.id}
                  className="py-3.5 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          t.direction === 'LONG'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-300'
                        }`}
                      >
                        {t.direction} {t.leverage}x
                      </span>
                      <span className="font-bold text-slate-900">{t.symbol}</span>
                      <span className="text-slate-500 text-[10px] tabular-nums">• {t.time}</span>
                    </div>

                    <span
                      className={`font-bold tabular-nums ${
                        t.outcome === 'TP_HIT' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {t.outcome === 'TP_HIT'
                        ? `✓ ${t.targetHit ? (t.targetHit.endsWith('HIT') ? t.targetHit : `${t.targetHit} HIT`) : 'TP HIT'}`
                        : '✕ STOP HIT'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-900/10">
                    <div>
                      <span className="block text-[10px] text-slate-500">Entry</span>
                      <span className="text-slate-900 font-bold font-mono tabular-nums">${t.entryPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500">Exit / Target</span>
                      <span className="text-slate-900 font-bold font-mono tabular-nums">${t.exitPrice.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-500">Realized PnL</span>
                      <span className={`font-bold font-mono tabular-nums ${t.pnlUsdt >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {t.pnlUsdt >= 0 ? `+$${t.pnlUsdt.toFixed(2)}` : `-$${Math.abs(t.pnlUsdt).toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {t.note && (
                    <div className="text-[10px] text-slate-600 border-l-2 border-[#0369a1] pl-2.5 py-0.5">
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
                className="px-4 py-2 rounded-xl bg-[#faf2df] hover:bg-[#f3ead2] border border-slate-900/15 text-xs font-mono text-slate-800 transition-all cursor-pointer"
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
