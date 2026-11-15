'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { DayDetailModal } from '@/components/dashboard/DayDetailModal'

interface DaySummary {
  date: string
  signal_count: number
  watchlist_count: number
  profit_count: number
  loss_count: number
  net_outcome: 'positive' | 'negative' | 'neutral'
}

interface MonthData {
  month: string
  days: Record<string, DaySummary>
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const WEEKDAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function CalendarGrid() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState<number>(today.getUTCFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(today.getUTCMonth() + 1) // 1-indexed

  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  const monthParam = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

  const fetchMonthSummary = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const res = await fetch(
        `${supabaseUrl}/functions/v1/get-calendar-summary?month=${monthParam}&t=${Date.now()}`,
        {
          headers: {
            apikey: supabaseAnonKey || '',
            Authorization: `Bearer ${supabaseAnonKey || ''}`,
          },
        }
      )

      if (!res.ok) {
        throw new Error(`Failed to fetch calendar summary (${res.status})`)
      }

      const data: MonthData = await res.json()
      setMonthData(data)
    } catch (err) {
      console.error('Calendar summary error:', err)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [monthParam])

  useEffect(() => {
    fetchMonthSummary()
    const interval = setInterval(() => {
      fetchMonthSummary(true)
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchMonthSummary])

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

  // Calculate calendar grid days
  // First day of month:
  const firstDayObj = new Date(Date.UTC(currentYear, currentMonth - 1, 1))
  // JS getUTCDay: 0 (Sun), 1 (Mon), ..., 6 (Sat)
  // Convert to Mon=0, Tue=1, ..., Sun=6:
  const startDayOfWeek = (firstDayObj.getUTCDay() + 6) % 7

  // Days in month:
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate()

  // Today key:
  const todayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setModalOpen(true)
  }

  const [pickerOpen, setPickerOpen] = useState<boolean>(false)
  const [pickerYear, setPickerYear] = useState<number>(currentYear)

  // Sync picker year with current year when opened
  useEffect(() => {
    setPickerYear(currentYear)
  }, [currentYear, pickerOpen])

  const selectMonthYear = (monthIdx: number, yearNum: number) => {
    setCurrentMonth(monthIdx + 1)
    setCurrentYear(yearNum)
    setPickerOpen(false)
  }

  const dayEntries = Object.values(monthData?.days || {})
  const activeDaysCount = dayEntries.filter((d) => (d.signal_count || 0) + (d.watchlist_count || 0) > 0).length
  const totalSetupsMonth = dayEntries.reduce((acc, d) => acc + (d.signal_count || 0) + (d.watchlist_count || 0), 0)
  const totalWinsMonth = dayEntries.reduce((acc, d) => acc + (d.profit_count || 0), 0)
  const totalLossesMonth = dayEntries.reduce((acc, d) => acc + (d.loss_count || 0), 0)

  return (
    <GlassCard className="flex flex-col space-y-5 p-5 sm:p-6 relative overflow-visible">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900/10 pb-4 relative">
        <div className="flex flex-wrap items-center gap-6 text-xs font-mono tabular-nums">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Active Days</span>
            <span className="font-bold text-slate-900 text-sm">{activeDaysCount}</span>
          </div>
          <div className="border-l border-slate-900/10 pl-6">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Total Setups</span>
            <span className="font-bold text-slate-900 text-sm">{totalSetupsMonth}</span>
          </div>
          <div className="border-l border-slate-900/10 pl-6">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Target Hits</span>
            <span className="font-bold text-emerald-700 text-sm">{totalWinsMonth}W</span>
          </div>
          <div className="border-l border-slate-900/10 pl-6">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Stop Losses</span>
            <span className="font-bold text-rose-700 text-sm">{totalLossesMonth}L</span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-[#fdfaf3] hover:bg-[#f3ead2] border border-slate-900/15 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setPickerOpen(!pickerOpen)}
            className="group flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-slate-900 px-3 py-1.5 rounded-lg bg-[#fdfaf3] hover:bg-[#f3ead2] border border-slate-900/15 min-w-[130px] transition-colors cursor-pointer"
            aria-label="Open month and year picker"
          >
            <span>{MONTH_NAMES[currentMonth - 1]} {currentYear}</span>
            {loading ? (
              <span className="w-3 h-3 border-2 border-[#0284c7] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-transform duration-200 ${pickerOpen ? 'rotate-180 text-[#0369a1]' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-[#fdfaf3] hover:bg-[#f3ead2] border border-slate-900/15 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {pickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPickerOpen(false)}
                aria-hidden="true"
              />

              <div className="absolute right-0 top-11 z-50 w-64 p-4 rounded-2xl bg-[#fdfaf3] border border-slate-900/15 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900/10 pb-2.5">
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="p-1 rounded-md text-slate-600 hover:text-slate-900 bg-[#f3ead2]/60 hover:bg-[#f3ead2] transition-colors cursor-pointer"
                    aria-label="Previous Year"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <span className="text-sm font-extrabold text-slate-900 tracking-wide font-mono tabular-nums">
                    {pickerYear}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="p-1 rounded-md text-slate-600 hover:text-slate-900 bg-[#f3ead2]/60 hover:bg-[#f3ead2] transition-colors cursor-pointer"
                    aria-label="Next Year"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((name, idx) => {
                    const isSelected = currentMonth === idx + 1 && currentYear === pickerYear
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => selectMonthYear(idx, pickerYear)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0369a1] text-white font-bold'
                            : 'bg-[#faf2df] hover:bg-[#f3ead2] text-slate-700 border border-slate-900/10'
                        }`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>

                <div className="border-t border-slate-900/10 pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMonth(today.getUTCMonth() + 1)
                      setCurrentYear(today.getUTCFullYear())
                      setPickerOpen(false)
                    }}
                    className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#0369a1] hover:text-slate-900 cursor-pointer"
                  >
                    Jump to Today
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAY_NAMES.map((day) => (
          <div key={day} className="text-[10px] font-mono font-bold text-slate-500 tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[64px] rounded-lg bg-transparent opacity-0 pointer-events-none" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1
          const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          const isToday = dateStr === todayKey
          const daySummary = monthData?.days?.[dateStr] || null

          const profitCount = daySummary?.profit_count || 0
          const lossCount = daySummary?.loss_count || 0
          const totalSetups = (daySummary?.signal_count || 0) + (daySummary?.watchlist_count || 0)
          const hasTrades = profitCount > 0 || lossCount > 0
          const isPositive = daySummary?.net_outcome === 'positive'
          const isNegative = daySummary?.net_outcome === 'negative'

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDayClick(dateStr)}
              className={`group min-h-[68px] p-2.5 rounded-lg border flex flex-col justify-between items-start text-left transition-colors duration-150 cursor-pointer ${
                isToday
                  ? 'bg-[#e0f2fe] border-[#0284c7]'
                  : isPositive
                  ? 'bg-emerald-500/10 border-emerald-600/30 hover:bg-emerald-500/15'
                  : isNegative
                  ? 'bg-rose-500/10 border-rose-600/30 hover:bg-rose-500/15'
                  : 'bg-[#fdfaf3] border-slate-900/10 hover:bg-[#f3ead2]'
              }`}
            >
              <div className="flex items-center justify-between w-full font-mono tabular-nums">
                <span className={`text-xs font-bold ${isToday ? 'text-[#0369a1]' : 'text-slate-800 group-hover:text-slate-900'}`}>
                  {dayNum}
                </span>
                {totalSetups > 0 && (
                  <span className="text-[9px] text-slate-500">
                    {totalSetups} set
                  </span>
                )}
              </div>

              <div className="w-full mt-1 font-mono tabular-nums">
                {hasTrades ? (
                  <div className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                    isPositive
                      ? 'text-emerald-700'
                      : isNegative
                      ? 'text-rose-700'
                      : 'text-slate-600'
                  }`}>
                    {isPositive ? (
                      <svg className="w-2.5 h-2.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    ) : isNegative ? (
                      <svg className="w-2.5 h-2.5 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                        <polyline points="16 17 22 17 22 11" />
                      </svg>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    )}
                    <span>{profitCount}W {lossCount}L</span>
                  </div>
                ) : totalSetups > 0 ? (
                  <span className="text-[9px] font-medium text-[#0369a1] block truncate">
                    {totalSetups} Setups
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-600 block h-4">
                    -
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t border-slate-900/10 pt-3 text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <svg className="w-3 h-3 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span>Net Profitable</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <svg className="w-3 h-3 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
              <polyline points="16 17 22 17 22 11" />
            </svg>
            <span>Net Loss</span>
          </span>
        </div>
        <span className="text-[10px] text-slate-600">Click day for full drilldown</span>
      </div>

      <DayDetailModal
        date={selectedDate}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedDate(null)
        }}
      />
    </GlassCard>
  )
}
