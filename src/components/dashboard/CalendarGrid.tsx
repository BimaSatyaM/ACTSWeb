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

  return (
    <GlassCard className="flex flex-col space-y-4 p-5 sm:p-6 relative overflow-visible">
      
      <div className="flex items-center justify-between relative">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Performance Calendar</h3>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-text-secondary hover:text-white transition-all cursor-pointer"
            aria-label="Previous Month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="group flex items-center justify-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 min-w-[130px] transition-all cursor-pointer shadow-sm active:scale-95"
            aria-label="Open month and year picker"
          >
            <span>{MONTH_NAMES[currentMonth - 1]} {currentYear}</span>
            {loading ? (
              <span className="w-3 h-3 border-2 border-accent-theme border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg 
                className={`w-3.5 h-3.5 text-text-muted group-hover:text-white transition-transform duration-200 ${pickerOpen ? 'rotate-180 text-accent-theme' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-text-secondary hover:text-white transition-all cursor-pointer"
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

              <div className="absolute right-0 top-11 z-50 w-64 p-4 rounded-2xl bg-[#0c0e18]/95 border border-white/15 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] animate-in fade-in zoom-in-95 duration-150 space-y-3">
                
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                  <button
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="p-1 rounded-md text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.1] transition-all cursor-pointer"
                    aria-label="Previous Year"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <span className="text-sm font-extrabold text-white tracking-wide font-mono">
                    {pickerYear}
                  </span>

                  <button
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="p-1 rounded-md text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.1] transition-all cursor-pointer"
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
                        onClick={() => selectMonthYear(idx, pickerYear)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent-theme text-white shadow-[0_0_12px_rgba(255,46,84,0.35)] font-bold'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] text-text-secondary hover:text-white border border-white/[0.04]'
                        }`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>

                <div className="border-t border-white/[0.06] pt-2 text-center">
                  <button
                    onClick={() => {
                      setCurrentMonth(today.getUTCMonth() + 1)
                      setCurrentYear(today.getUTCFullYear())
                      setPickerOpen(false)
                    }}
                    className="text-[10px] uppercase font-bold tracking-wider text-accent-blue hover:text-accent-blue/80 cursor-pointer"
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
          <div key={day} className="text-[10px] font-bold text-text-muted/80 tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[64px] rounded-xl bg-transparent opacity-0 pointer-events-none" />
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
              onClick={() => handleDayClick(dateStr)}
              className={`group min-h-[68px] p-2.5 rounded-xl border flex flex-col justify-between items-start text-left transition-all duration-200 cursor-pointer ${
                isToday
                  ? 'bg-accent-theme/10 border-accent-theme/40 shadow-[0_0_14px_rgba(255,46,84,0.2)]'
                  : isPositive
                  ? 'bg-emerald-500/[0.03] border-emerald-500/15 hover:bg-emerald-500/[0.07] hover:border-emerald-500/30 hover:-translate-y-0.5'
                  : isNegative
                  ? 'bg-rose-500/[0.03] border-rose-500/15 hover:bg-rose-500/[0.07] hover:border-rose-500/30 hover:-translate-y-0.5'
                  : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-mono font-bold ${isToday ? 'text-accent-theme' : 'text-white/80 group-hover:text-white'}`}>
                  {dayNum}
                </span>
                {totalSetups > 0 && (
                  <span className="text-[9px] font-mono text-text-muted/60">
                    {totalSetups} set
                  </span>
                )}
              </div>

              <div className="w-full mt-1">
                {hasTrades ? (
                  <div className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono ${
                    isPositive
                      ? 'text-emerald-400'
                      : isNegative
                      ? 'text-rose-400'
                      : 'text-zinc-300'
                  }`}>
                    {isPositive ? (
                      <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    ) : isNegative ? (
                      <svg className="w-2.5 h-2.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                        <polyline points="16 17 22 17 22 11" />
                      </svg>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    )}
                    <span>{profitCount}W {lossCount}L</span>
                  </div>
                ) : totalSetups > 0 ? (
                  <span className="text-[9px] font-mono font-medium text-cyan-300/80 block truncate">
                    {totalSetups} Setups
                  </span>
                ) : (
                  <span className="text-[9px] text-text-muted/30 font-mono block h-4">
                    —
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 text-[10px] text-text-muted">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span>Net Profitable</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <svg className="w-3 h-3 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
              <polyline points="16 17 22 17 22 11" />
            </svg>
            <span>Net Loss</span>
          </span>
        </div>
        <span className="text-[10px] text-text-muted/70">Click day for full drilldown</span>
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
