'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'

export interface MarketSessionInfo {
  sessionName: string
  isOpen: boolean
  statusColor: string
  nextEventLabel: string
  timeUntilNext: string
  subNote?: string
  progressPercent: number
}

function getJakartaSession(now: Date): MarketSessionInfo {
  // Convert current time to Jakarta (WIB / UTC+7)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const wib = new Date(utc + 7 * 3600000)

  const day = wib.getDay() // 0 = Sun, 6 = Sat
  const isWeekend = day === 0 || day === 6
  const isFriday = day === 5

  const hours = wib.getHours()
  const minutes = wib.getMinutes()
  const seconds = wib.getSeconds()
  const totalSeconds = hours * 3600 + minutes * 60 + seconds

  // Official IDX Normal Trading Hours (WIB):
  // Pre-Opening: 08:45 - 08:59:59 (order placement/matching)
  // Regular Open: 09:00
  // Session 1: 09:00 - 12:00 (Mon-Thu) / 09:00 - 11:30 (Fri)
  // Break: 12:00 - 13:30 (Mon-Thu) / 11:30 - 14:00 (Fri)
  // Session 2: 13:30 - 15:49:59 (Mon-Thu) / 14:00 - 15:49:59 (Fri)
  // Pre-Closing Auction: 15:50 - 16:00:00 (matching at 16:00)
  // Post-Trading (Closing Price): 16:00 - 16:15:00
  // Market Closed: > 16:15 (or > 16:00)
  const preOpenStart = 8 * 3600 + 45 * 60 // 08:45
  const session1Start = 9 * 3600 // 09:00 (Real Market Open)
  const session1End = isFriday ? 11 * 3600 + 30 * 60 : 12 * 3600 // 11:30 Fri / 12:00 Mon-Thu

  const session2Start = isFriday ? 14 * 3600 : 13 * 3600 + 30 * 60 // 14:00 Fri / 13:30 Mon-Thu
  const preCloseStart = 15 * 3600 + 50 * 60 // 15:50 (3:50 PM continuous close)
  const marketClose = 16 * 3600 // 16:00 (4:00 PM Real Close)
  const postTradingEnd = 16 * 3600 + 15 * 60 // 16:15 (Post-Trading end)

  const formatCountdown = (diffSeconds: number) => {
    if (diffSeconds <= 0) return '00:00:00'
    const h = Math.floor(diffSeconds / 3600)
    const m = Math.floor((diffSeconds % 3600) / 60)
    const s = diffSeconds % 60
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`
  }

  // 1. Weekend (Saturday & Sunday)
  if (isWeekend) {
    return {
      sessionName: 'Weekend · Market Closed',
      isOpen: false,
      statusColor: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
      nextEventLabel: 'Opens Monday',
      timeUntilNext: 'Mon 09:00 WIB',
      subNote: 'Pre-Open 08:45',
      progressPercent: 0,
    }
  }

  // 2. Before 08:45 WIB on Weekday
  if (totalSeconds < preOpenStart) {
    const diffToOpen = session1Start - totalSeconds
    const diffToPreOpen = preOpenStart - totalSeconds
    return {
      sessionName: 'Market Closed',
      isOpen: false,
      statusColor: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
      nextEventLabel: 'Market Opens in',
      timeUntilNext: formatCountdown(diffToOpen),
      subNote: `Pre-Open in ${formatCountdown(diffToPreOpen)}`,
      progressPercent: 0,
    }
  }

  // 3. Pre-Opening (08:45 - 09:00 WIB) - Order Entry & Price Formation
  if (totalSeconds >= preOpenStart && totalSeconds < session1Start) {
    const totalDuration = session1Start - preOpenStart
    const elapsed = totalSeconds - preOpenStart
    return {
      sessionName: 'Pre-Opening (Order Entry)',
      isOpen: true,
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      nextEventLabel: 'Regular Trading in',
      timeUntilNext: formatCountdown(session1Start - totalSeconds),
      subNote: 'Opens 09:00',
      progressPercent: Math.min(100, Math.round((elapsed / totalDuration) * 100)),
    }
  }

  // 4. Session 1 Trading (09:00 - 12:00 Mon-Thu / 09:00 - 11:30 Fri)
  if (totalSeconds >= session1Start && totalSeconds < session1End) {
    const totalDuration = session1End - session1Start
    const elapsed = totalSeconds - session1Start
    return {
      sessionName: 'Session 1 Trading',
      isOpen: true,
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      nextEventLabel: isFriday ? 'Friday Break in' : 'Lunch Break in',
      timeUntilNext: formatCountdown(session1End - totalSeconds),
      subNote: isFriday ? 'Until 11:30' : 'Until 12:00',
      progressPercent: Math.min(100, Math.round((elapsed / totalDuration) * 100)),
    }
  }

  // 5. Lunch / Friday Break (12:00 - 13:30 Mon-Thu / 11:30 - 14:00 Fri)
  if (totalSeconds >= session1End && totalSeconds < session2Start) {
    const totalDuration = session2Start - session1End
    const elapsed = totalSeconds - session1End
    return {
      sessionName: isFriday ? 'Friday Break · Paused' : 'Lunch Break · Paused',
      isOpen: false,
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      nextEventLabel: 'Session 2 Resumes in',
      timeUntilNext: formatCountdown(session2Start - totalSeconds),
      subNote: isFriday ? '14:00 WIB' : '13:30 WIB',
      progressPercent: Math.min(100, Math.round((elapsed / totalDuration) * 100)),
    }
  }

  // 6. Session 2 Continuous Trading (13:30/14:00 - 15:50 WIB)
  if (totalSeconds >= session2Start && totalSeconds < preCloseStart) {
    const totalDuration = preCloseStart - session2Start
    const elapsed = totalSeconds - session2Start
    return {
      sessionName: 'Session 2 Trading',
      isOpen: true,
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      nextEventLabel: 'Pre-Closing in',
      timeUntilNext: formatCountdown(preCloseStart - totalSeconds),
      subNote: 'Until 15:50',
      progressPercent: Math.min(100, Math.round((elapsed / totalDuration) * 100)),
    }
  }

  // 7. Pre-Closing Auction (15:50 - 16:00 WIB)
  if (totalSeconds >= preCloseStart && totalSeconds < marketClose) {
    const totalDuration = marketClose - preCloseStart
    const elapsed = totalSeconds - preCloseStart
    return {
      sessionName: 'Pre-Closing Auction',
      isOpen: true,
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      nextEventLabel: 'Real Close in',
      timeUntilNext: formatCountdown(marketClose - totalSeconds),
      subNote: 'Matching 16:00',
      progressPercent: Math.min(100, Math.round((elapsed / totalDuration) * 100)),
    }
  }

  // 8. Post-Trading Session (16:00 - 16:15 WIB) - Closing Price Trades
  if (totalSeconds >= marketClose && totalSeconds < postTradingEnd) {
    const totalDuration = postTradingEnd - marketClose
    const elapsed = totalSeconds - marketClose
    return {
      sessionName: 'Post-Trading (Closing Price)',
      isOpen: true,
      statusColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      nextEventLabel: 'Final Close in',
      timeUntilNext: formatCountdown(postTradingEnd - totalSeconds),
      subNote: 'Ends 16:15',
      progressPercent: Math.min(100, Math.round((elapsed / totalDuration) * 100)),
    }
  }

  // 9. After Hours (> 16:15 WIB)
  return {
    sessionName: 'Market Closed',
    isOpen: false,
    statusColor: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    nextEventLabel: isFriday ? 'Opens Monday' : 'Opens Next Day',
    timeUntilNext: isFriday ? 'Mon 09:00 WIB' : '09:00 WIB',
    subNote: 'Pre-Open 08:45',
    progressPercent: 100,
  }
}

export function IDXMarketClock() {
  const [timeStr, setTimeStr] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')
  const [session, setSession] = useState<MarketSessionInfo>({
    sessionName: 'Calculating...',
    isOpen: false,
    statusColor: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    nextEventLabel: 'Session Clock',
    timeUntilNext: '--',
    progressPercent: 0,
  })

  useEffect(() => {
    const update = () => {
      const now = new Date()
      // WIB Time
      const utc = now.getTime() + now.getTimezoneOffset() * 60000
      const wib = new Date(utc + 7 * 3600000)

      setTimeStr(wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB')
      setDateStr(
        wib.toLocaleDateString('en-US', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      )
      setSession(getJakartaSession(now))
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#0d121f] border border-white/[0.08] shadow-sm">
      {/* ── Left: Market Time & Date ── */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
          <Image
            src="/assets/idx-emblem.png"
            alt="IDX Logo"
            width={28}
            height={28}
            priority
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-white font-mono tracking-tight">{timeStr || 'Loading...'}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08]">
            WIB · UTC+7
          </span>
          <span className="hidden sm:inline text-xs text-slate-400 font-medium">({dateStr || 'Jakarta Trading Desk'})</span>
        </div>
      </div>

      {/* ── Right: Session Status & Countdown ── */}
      <div className="flex flex-col sm:items-end w-full sm:w-auto gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${session.statusColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${session.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{session.sessionName}</span>
          </span>
          <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-400">{session.nextEventLabel}:</span>
            <span className="font-bold text-white">{session.timeUntilNext}</span>
            {session.subNote && (
              <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06]">
                {session.subNote}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar for active session */}
        {session.isOpen && (
          <div className="w-full sm:w-44 h-1 bg-white/[0.06] rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${session.progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
