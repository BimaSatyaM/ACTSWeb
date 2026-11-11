'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { AutoTradeRecord } from './AutoTradingPerformanceCalendar'

interface AutoTradingProgressionChartProps {
  isConnected: boolean
  isAutoTrading: boolean
}

interface ProgressionPoint {
  index: number
  label: string
  date: string
  time: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  outcome: 'TP_HIT' | 'SL_HIT' | 'OPEN'
  targetHit?: string
  tradePnl: number
  cumulativePnl: number
}

export function AutoTradingProgressionChart({
  isConnected,
  isAutoTrading,
}: AutoTradingProgressionChartProps) {
  const [mounted, setMounted] = useState<boolean>(false)
  const [trades, setTrades] = useState<AutoTradeRecord[]>([])
  const [hoveredCoord, setHoveredCoord] = useState<{ x: number; y: number; point: ProgressionPoint } | null>(null)
  const hoveredPoint = hoveredCoord?.point || null

  useEffect(() => {
    setMounted(true)
    const load = () => {
      try {
        const saved = localStorage.getItem('acts_autotrade_executions')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
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
            setTrades(records)
            return
          }
        }
        setTrades([])
      } catch {
        setTrades([])
      }
    }
    load()
    window.addEventListener('acts_executions_updated', load)
    return () => window.removeEventListener('acts_executions_updated', load)
  }, [])

  // Helper to extract timestamp or sequential sorting key from AutoTradeRecord
  const getRecordTimestamp = (t: AutoTradeRecord): number => {
    if (t.timestamp && typeof t.timestamp === 'number') return t.timestamp
    if (t.id && t.id.startsWith('binance-trade-')) {
      const idNum = parseInt(t.id.replace('binance-trade-', ''), 10)
      if (!isNaN(idNum) && idNum > 0) return idNum
    }
    if (t.date) {
      const cleanTime = (t.time || '00:00').replace(' UTC', '').trim()
      const iso = `${t.date}T${cleanTime.length === 5 ? cleanTime + ':00' : cleanTime}Z`
      const parsed = Date.parse(iso)
      if (!isNaN(parsed)) return parsed
    }
    return 0
  }

  // Build cumulative progression points in chronological order (oldest to newest)
  const points: ProgressionPoint[] = useMemo(() => {
    if (trades.length === 0) return []

    // Defensively sort trades chronologically (oldest first -> newest last)
    // This ensures Trade #1 is the earliest trade and Trade #N is the latest trade,
    // so profits and cumulative equity accumulate forward in time to today's peak.
    const sorted = [...trades].sort((a, b) => {
      const timeA = getRecordTimestamp(a)
      const timeB = getRecordTimestamp(b)
      if (timeA !== timeB) return timeA - timeB
      return (a.id || '').localeCompare(b.id || '')
    })

    let cumulative = 0
    return sorted.map((t, idx) => {
      cumulative += t.pnlUsdt
      const isWin = t.pnlUsdt > 0
      const safeOutcome: 'TP_HIT' | 'SL_HIT' = isWin ? 'TP_HIT' : 'SL_HIT'
      const safeTargetHit = isWin
        ? (t.targetHit && t.targetHit !== 'SL' ? t.targetHit : 'TP')
        : 'SL'

      return {
        index: idx + 1,
        label: `Signal #${idx + 1}`,
        date: t.date,
        time: t.time,
        symbol: t.symbol,
        direction: t.direction,
        outcome: safeOutcome,
        targetHit: safeTargetHit,
        tradePnl: t.pnlUsdt,
        cumulativePnl: parseFloat(cumulative.toFixed(2)),
      }
    })
  }, [trades])

  const hasData = points.length > 0
  const totalTpHits = points.filter((p) => p.outcome === 'TP_HIT').length
  const totalSlHits = points.filter((p) => p.outcome === 'SL_HIT').length
  const netPnl = hasData ? points[points.length - 1].cumulativePnl : 0

  // SVG Dimensions
  const width = 500
  const height = 200
  const padding = { top: 20, right: 20, bottom: 25, left: 35 }

  const chartCoords = useMemo(() => {
    if (!hasData) return { pathD: '', areaD: '', pointCoords: [], zeroY: height / 2 }

    const pnlValues = [0, ...points.map((p) => p.cumulativePnl)]
    const minPnl = Math.min(0, ...pnlValues)
    const maxPnl = Math.max(10, ...pnlValues)
    const pnlRange = maxPnl - minPnl || 1

    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const getX = (idx: number) => {
      if (points.length <= 1) return padding.left + chartW / 2
      return padding.left + (idx / (points.length - 1)) * chartW
    }

    const getY = (val: number) => {
      return padding.top + chartH - ((val - minPnl) / pnlRange) * chartH
    }

    const zeroY = getY(0)

    const coords = points.map((p, idx) => ({
      x: getX(idx),
      y: getY(p.cumulativePnl),
      point: p,
    }))

    // Generate smooth Bézier spline path across coordinates (Fritsch-Carlson/Monotonic clamp)
    const generateSmoothPath = (pts: Array<{ x: number; y: number }>): string => {
      if (pts.length === 0) return ''
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
      if (pts.length === 2) {
        const p1 = pts[0]
        const p2 = pts[1]
        const dx = (p2.x - p1.x) * 0.3
        return `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`
      }

      let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
      const n = pts.length
      const tension = 0.22

      for (let i = 0; i < n - 1; i++) {
        const p0 = pts[i - 1] || pts[i]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[i + 2] || p2

        const dx1 = (p2.x - p0.x) * tension
        const dy1 = (p2.y - p0.y) * tension
        const dx2 = (p3.x - p1.x) * tension
        const dy2 = (p3.y - p1.y) * tension

        let cp1x = p1.x + dx1
        let cp1y = p1.y + dy1
        let cp2x = p2.x - dx2
        let cp2y = p2.y - dy2

        // Monotonic clamp on Y to ensure horizontal plateaus stay flat and smooth transitions don't ripple
        const minY = Math.min(p1.y, p2.y)
        const maxY = Math.max(p1.y, p2.y)
        cp1y = Math.max(minY, Math.min(maxY, cp1y))
        cp2y = Math.max(minY, Math.min(maxY, cp2y))

        // Clamp X between points
        cp1x = Math.max(p1.x, Math.min(p2.x, cp1x))
        cp2x = Math.max(p1.x, Math.min(p2.x, cp2x))

        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
      }
      return path
    }

    const smoothLinePath = generateSmoothPath(coords)
    const areaPath = `${smoothLinePath} L ${coords[coords.length - 1].x.toFixed(1)} ${zeroY.toFixed(1)} L ${coords[0].x.toFixed(1)} ${zeroY.toFixed(1)} Z`

    return { pathD: smoothLinePath, areaD: areaPath, pointCoords: coords, zeroY }
  }, [hasData, points])

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#10141E]/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="space-y-2 border-b border-white/[0.05] pb-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide">
              Target Progression Curve
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20">
              Live Executions
            </span>
          </div>

          <span className="text-[11px] font-mono text-zinc-500">
            {hasData ? `${points.length} trades plotted` : 'Standby'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Return:</span>
            <span
              className={
                hasData
                  ? netPnl >= 0
                    ? 'text-[#00e676] font-bold'
                    : 'text-rose-400 font-bold'
                  : 'text-zinc-400 font-semibold'
              }
            >
              {hasData ? (netPnl >= 0 ? `+$${netPnl.toFixed(2)}` : `-$${Math.abs(netPnl).toFixed(2)}`) : '--'}
            </span>
            {hasData && <span className="text-[10px] text-zinc-600">USDT</span>}
          </div>

          <span className="text-zinc-700 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Target Hits:</span>
            <span className="text-white font-semibold">
              {hasData ? `${totalTpHits} TP (${totalSlHits} SL)` : '--'}
            </span>
          </div>

          <span className="text-zinc-700 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Gate:</span>
            <span className="text-[#F0B90B] font-bold">≥ 52.0</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-48 sm:h-52 rounded-xl bg-black/25 border border-white/[0.04] p-2 flex items-center justify-center overflow-hidden">
        {!mounted ? (
          <div className="text-xs font-mono text-zinc-600">Initializing canvas...</div>
        ) : !hasData ? (
          // Subtle, Minimalist Standby State
          <div className="flex flex-col items-center justify-center text-center px-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isAutoTrading && isConnected
                    ? 'bg-[#00e676] shadow-[0_0_8px_#00e676]'
                    : isConnected
                    ? 'bg-[#F0B90B] shadow-[0_0_8px_#F0B90B]'
                    : 'bg-zinc-600'
                }`}
              />
              <span className="text-xs font-mono font-semibold text-zinc-300">
                {isAutoTrading && isConnected
                  ? 'Bot Active • Monitoring 15m BTCUSDT'
                  : 'Radar Standby • Awaiting First Execution'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono max-w-sm leading-relaxed">
              Progression curve plots each executed target hit automatically as orders close on Binance.
            </p>
          </div>
        ) : (
          // Real Data Stepped Progression Line
          <div className="relative w-full h-full">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="progressionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e676" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00e676" stopOpacity="0.0" />
                </linearGradient>
                <filter id="curveGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#00e676" floodOpacity="0.35" />
                </filter>
              </defs>

              <line
                x1={padding.left}
                y1={chartCoords.zeroY}
                x2={width - padding.right}
                y2={chartCoords.zeroY}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />

              {chartCoords.areaD && (
                <path d={chartCoords.areaD} fill="url(#progressionGrad)" />
              )}

              {chartCoords.pathD && (
                <path
                  d={chartCoords.pathD}
                  fill="none"
                  stroke="#00e676"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#curveGlow)"
                />
              )}

              {chartCoords.pointCoords.map((pt, i) => {
                const isTp = pt.point.outcome === 'TP_HIT'
                const isHovered = hoveredCoord?.point.index === pt.point.index
                return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCoord(pt)}
                    onMouseLeave={() => setHoveredCoord(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="14"
                      fill="transparent"
                    />

                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill={isTp ? 'rgba(0, 230, 118, 0.25)' : 'rgba(239, 68, 68, 0.25)'}
                        stroke={isTp ? '#00e676' : '#ef4444'}
                        strokeWidth="1.5"
                      />
                    )}

                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5.5 : 4}
                      fill={isTp ? '#00e676' : '#ef4444'}
                      stroke="#0e121d"
                      strokeWidth="2"
                    />
                  </g>
                )
              })}
            </svg>

            {hoveredPoint && (
              <div
                className={`absolute p-2.5 rounded-xl bg-[#090d18]/95 border border-white/[0.12] shadow-2xl text-xs font-mono space-y-1 backdrop-blur-md animate-fadeIn z-20 pointer-events-none select-none ${
                  hoveredCoord && hoveredCoord.x > width * 0.5 ? 'top-2 left-2' : 'top-2 right-2'
                }`}
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-1">
                  <span className="font-bold text-white">{hoveredPoint.label}</span>
                  <span
                    className={`font-bold ${
                      hoveredPoint.outcome === 'TP_HIT' ? 'text-[#00e676]' : 'text-rose-400'
                    }`}
                  >
                    {hoveredPoint.outcome === 'TP_HIT'
                      ? (hoveredPoint.targetHit || 'TP HIT')
                      : 'STOP LOSS'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  {hoveredPoint.symbol} {hoveredPoint.direction} • {hoveredPoint.date} {hoveredPoint.time}
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-zinc-500">P&amp;L:</span>
                  <span
                    className={`font-bold ${
                      hoveredPoint.tradePnl >= 0 ? 'text-[#00e676]' : 'text-rose-400'
                    }`}
                  >
                    {hoveredPoint.tradePnl >= 0
                      ? `+$${hoveredPoint.tradePnl.toFixed(2)}`
                      : `-$${Math.abs(hoveredPoint.tradePnl).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px] pt-0.5 border-t border-white/[0.04]">
                  <span className="text-zinc-500">Cumulative:</span>
                  <span className="font-bold text-white">
                    ${hoveredPoint.cumulativePnl.toFixed(2)} USDT
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-0.5">
        <span>Monitoring 15m closes</span>
        <span>Non-custodial execution</span>
      </div>
    </div>
  )
}
