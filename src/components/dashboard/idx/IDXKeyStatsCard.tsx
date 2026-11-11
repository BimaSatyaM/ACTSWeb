'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  IDXKeyStats,
  formatIDR,
  formatTrillion,
  formatPercent,
  formatRatio,
} from '@/lib/idxKeystats'
import { IDXStockLogo } from '@/components/ui/IDXStockLogo'

interface Props {
  stats: IDXKeyStats
}

export function IDXKeyStatsCard({ stats }: Props) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1Y')
  const [showExtended, setShowExtended] = useState<boolean>(false)
  const [candles, setCandles] = useState<Array<{ time: number; close: number; high?: number; low?: number }>>([])
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(true)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Fetch real market historical candles for each stock & timeframe
  useEffect(() => {
    let isCancelled = false
    setIsLoadingChart(true)

    let range = '1y'
    let interval = '1d'

    switch (selectedTimeframe) {
      case '1D':
        range = '1d'
        interval = '5m'
        break
      case '1W':
        range = '5d'
        interval = '15m'
        break
      case '1M':
        range = '1mo'
        interval = '1d'
        break
      case '3M':
        range = '3mo'
        interval = '1d'
        break
      case '1Y':
      default:
        range = '1y'
        interval = '1d'
        break
    }

    fetch(`/api/idx/quote?symbol=${stats.symbol}&range=${range}&interval=${interval}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          if (data.success && Array.isArray(data.candles) && data.candles.length > 0) {
            setCandles(data.candles)
          } else {
            setCandles([])
          }
          setIsLoadingChart(false)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Error fetching candles for chart:', err)
          setIsLoadingChart(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [stats.symbol, selectedTimeframe])

  // Helpers for color styling
  const getBadgeColor = (variant: string) => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25'
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25'
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/25'
      default:
        return 'bg-white/10 text-white border-white/20'
    }
  }

  // 52-Week Range metrics (Macro context for the slider)
  const rangePos = Math.min(100, Math.max(0, stats.rangePositionPct))
  const low52 = stats.week52Low || 1
  const high52 = stats.week52High || low52 * 1.5

  const formatK = (v: number) => {
    if (v === null || v === undefined || isNaN(v)) return '—'
    const val = Math.round(v)
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`
    }
    if (val >= 10000) {
      return `${(val / 1000).toFixed(1)}K`
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(2)}K`
    }
    return `Rp ${val.toLocaleString('id-ID')}`
  }

  // Real chart geometry and price statistics calculations
  const {
    pts,
    linePath,
    areaPath,
    yMax,
    yMin,
    firstPrice,
    lastPrice,
    priceChange,
    priceChangePct,
    isPositive,
    tfSpread,
    minPrice,
    maxPrice,
    timeLabels,
  } = useMemo(() => {
    const svgWidth = 500
    const svgHeight = 120
    const padTop = 15
    const padBottom = 15
    const chartH = svgHeight - padTop - padBottom

    // Determine prices array
    let dataList: Array<{ time: number; close: number }> = []
    if (candles.length > 0) {
      dataList = candles
    } else {
      // Fallback points if offline
      const cur = stats.price || 1000
      dataList = [
        { time: Date.now() / 1000 - 86400 * 300, close: high52 * 0.9 },
        { time: Date.now() / 1000 - 86400 * 200, close: low52 * 1.05 },
        { time: Date.now() / 1000 - 86400 * 100, close: (low52 + high52) / 2 },
        { time: Date.now() / 1000, close: cur },
      ]
    }

    const prices = dataList.map((d) => d.close)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const spread = maxP - minP

    // Dynamic padding so intraday or weekly curves clearly show volatility
    const pad = spread > 0 ? spread * 0.08 : (maxP * 0.02 || 10)
    const calculatedYMax = Math.round(maxP + pad)
    const calculatedYMin = Math.max(0, Math.round(minP - pad))
    const yRange = calculatedYMax - calculatedYMin || 1

    const first = dataList[0].close
    const last = dataList[dataList.length - 1].close
    const change = last - first
    const changePct = first > 0 ? (change / first) * 100 : 0
    const positive = change >= 0

    // Coordinates
    const points = dataList.map((item, idx) => {
      const x = (idx / Math.max(1, dataList.length - 1)) * svgWidth
      const norm = (item.close - calculatedYMin) / yRange
      const clampedVal = Math.min(1, Math.max(0, norm))
      const y = svgHeight - padBottom - clampedVal * chartH
      return { x, y, price: item.close, time: item.time }
    })

    // Smooth cubic Bezier path
    let lPath = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cpX = (p0.x + p1.x) / 2
      lPath += ` C ${cpX.toFixed(1)},${p0.y.toFixed(1)} ${cpX.toFixed(1)},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`
    }
    const aPath = `${lPath} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`

    // X-Axis labels from actual candle timestamps
    const count = Math.min(6, dataList.length)
    const step = (dataList.length - 1) / Math.max(1, count - 1)
    const labels: string[] = []
    for (let i = 0; i < count; i++) {
      const idx = Math.round(i * step)
      const item = dataList[idx]
      if (!item) continue
      const d = new Date(item.time * 1000)
      if (selectedTimeframe === '1D') {
        labels.push(
          d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
        )
      } else if (selectedTimeframe === '1W') {
        labels.push(
          d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' })
        )
      } else if (selectedTimeframe === '1M' || selectedTimeframe === '3M') {
        labels.push(
          d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })
        )
      } else {
        labels.push(
          d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'Asia/Jakarta' })
        )
      }
    }

    return {
      pts: points,
      linePath: lPath,
      areaPath: aPath,
      yMax: calculatedYMax,
      yMin: calculatedYMin,
      firstPrice: first,
      lastPrice: last,
      priceChange: change,
      priceChangePct: changePct,
      isPositive: positive,
      tfSpread: spread,
      minPrice: minP,
      maxPrice: maxP,
      timeLabels: labels,
    }
  }, [candles, selectedTimeframe, stats.price, high52, low52])

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || pts.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width))
    const index = Math.round(ratio * (pts.length - 1))
    setHoverIndex(index)
  }

  const handleMouseLeave = () => {
    setHoverIndex(null)
  }

  const activeHover = hoverIndex !== null && pts[hoverIndex] ? pts[hoverIndex] : null
  const strokeColor = isPositive ? '#10b981' : '#f43f5e'
  const gradientId = isPositive ? 'areaGradEmerald' : 'areaGradRose'

  return (
    <div className="space-y-5">
      {/* ── 1. Hero Snapshot Banner ── */}
      <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 sm:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left: Logo, Symbol, Pills & Subtitles */}
          <div className="flex items-start gap-4 min-w-0">
            <div className="shrink-0">
              <IDXStockLogo
                symbol={stats.symbol}
                name={stats.name}
                logoUrl={stats.logoUrl}
                size="lg"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                  {stats.symbol}
                </h1>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                  {stats.marketCapTier}
                </span>
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 whitespace-nowrap">
                  {stats.sector}
                </span>
                {stats.industry && stats.industry !== stats.sector && (
                  <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 whitespace-nowrap hidden sm:inline-block">
                    {stats.industry}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                {stats.name}
              </h2>

              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                {stats.group ? <span className="text-slate-300">{stats.group} Group · </span> : null}
                <span>{stats.sector}</span>
                <span className="text-slate-600">·</span>
                <span>{stats.industry}</span>
                <span className="text-slate-600">·</span>
                <span>Indonesia</span>
              </p>
            </div>
          </div>

          {/* Right: Last Price, Distance from High & Market Capitalization */}
          <div className="flex items-center gap-6 sm:gap-8 shrink-0 lg:text-right border-t xl:border-t-0 pt-4 xl:pt-0 border-white/[0.06]">
            <div>
              <div className="text-[11px] text-slate-400 font-mono">
                Last Price (IDR)
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5 whitespace-nowrap">
                {formatIDR(stats.price)}
              </div>
              <div className="text-xs font-mono font-semibold text-rose-400 flex items-center gap-1 lg:justify-end mt-0.5 whitespace-nowrap">
                <span>↓</span>
                <span>{Math.abs(stats.distFrom52wHighPct).toFixed(2)}% (from 52W High)</span>
              </div>
            </div>

            <div className="h-12 sm:h-14 w-px bg-white/[0.08]" />

            <div>
              <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                Market Capitalization
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5 whitespace-nowrap">
                {formatTrillion(stats.marketCapTrillion)}
              </div>
              <div className="space-y-0.5 mt-1 text-[11px] font-mono text-slate-400">
                <div className="flex items-center justify-between lg:justify-end gap-3 whitespace-nowrap">
                  <span className="text-slate-500">52-Week High</span>
                  <span className="text-white font-semibold">{formatIDR(stats.week52High)}</span>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-3 whitespace-nowrap">
                  <span className="text-slate-500">52-Week Low</span>
                  <span className="text-white font-semibold">{formatIDR(stats.week52Low)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Dedicated Performance & Historical Chart Card ── */}
      <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 sm:p-6 space-y-4">
        {/* Performance Header & Timeframe Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPositive ? 'bg-emerald-400' : 'bg-rose-400'
              } ${isLoadingChart ? 'animate-ping' : ''}`}
            />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <span>{selectedTimeframe} Performance</span>
              <span className="text-slate-500 font-normal">·</span>
              <span className="text-slate-300">{stats.symbol}</span>
            </h3>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
              }`}
            >
              {isPositive ? '+' : ''}{formatIDR(priceChange)} ({formatPercent(priceChangePct)})
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-white/[0.06]">
            {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  selectedTimeframe === tf
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Split Grid: 52-Week Channel Slider on Left, Real Historical Chart on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
          {/* Left: 52-Week Channel & Slider (Macro Context) */}
          <div className="lg:col-span-5 space-y-4 pr-0 lg:pr-4">
            <div className="flex items-baseline justify-between font-mono">
              <div>
                <span className="text-lg sm:text-xl font-black text-white block">
                  {formatIDR(stats.week52Low)}
                </span>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-bold mt-0.5">
                  (52W Low)
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg sm:text-xl font-black text-white block">
                  {formatIDR(stats.week52High)}
                </span>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-bold mt-0.5">
                  (52W High)
                </span>
              </div>
            </div>

            {/* Slider Track with Glowing Handle */}
            <div className="relative h-2 w-full rounded-full bg-slate-800">
              <div
                className="absolute top-0 bottom-0 left-0 bg-slate-600 rounded-full transition-all duration-500"
                style={{ width: `${rangePos}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg -translate-x-1/2 transition-all duration-500 ring-4 ring-white/20"
                style={{ left: `${rangePos}%` }}
              />
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Trading at <span className="text-white font-bold">{rangePos}%</span> of 52-week channel
            </div>
          </div>

          {/* Right: Live Real Historical Chart */}
          <div className="lg:col-span-7 space-y-1.5 border-t lg:border-t-0 lg:border-l border-white/[0.06] pt-4 lg:pt-0 lg:pl-6">
            <div className="flex items-center gap-2">
              {/* Y-Axis Reference Ticks */}
              <div className="flex flex-col justify-between text-[10px] font-mono text-slate-500 h-28 sm:h-32 text-right shrink-0 pr-1 select-none">
                <span>{formatK(yMax)}</span>
                <span>{formatK(Math.round(yMax - (yMax - yMin) * 0.33))}</span>
                <span>{formatK(Math.round(yMax - (yMax - yMin) * 0.66))}</span>
                <span>{formatK(yMin)}</span>
              </div>

              {/* Area & Line SVG Canvas */}
              <div className="flex-1 h-28 sm:h-32 relative group">
                {isLoadingChart && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d121f]/60 backdrop-blur-[1px] rounded">
                    <span className="text-[10px] font-mono text-slate-400 animate-pulse">
                      Loading market data...
                    </span>
                  </div>
                )}
                <svg
                  ref={svgRef}
                  className="w-full h-full overflow-visible cursor-crosshair"
                  viewBox="0 0 500 120"
                  preserveAspectRatio="none"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <linearGradient id="areaGradEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                      <stop offset="65%" stopColor="#10b981" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="areaGradRose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
                      <stop offset="65%" stopColor="#f43f5e" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area Fill */}
                  <path d={areaPath} fill={`url(#${gradientId})`} />

                  {/* Glowing Stroke Curve */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Hover Crosshair and Dot */}
                  {activeHover && (
                    <g>
                      <line
                        x1={activeHover.x}
                        y1={0}
                        x2={activeHover.x}
                        y2={120}
                        stroke="#ffffff"
                        strokeOpacity="0.25"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <circle
                        cx={activeHover.x}
                        cy={activeHover.y}
                        r="4.5"
                        fill="#ffffff"
                        stroke={strokeColor}
                        strokeWidth="2.5"
                      />
                    </g>
                  )}
                </svg>

                {/* Floating Tooltip on Hover */}
                {activeHover && (
                  <div
                    className="absolute -top-7 pointer-events-none z-20 px-2 py-0.5 rounded bg-slate-900/90 border border-white/15 text-[10px] font-mono text-white shadow-xl -translate-x-1/2 whitespace-nowrap"
                    style={{ left: `${(activeHover.x / 500) * 100}%` }}
                  >
                    <span className="font-bold text-white">{formatIDR(activeHover.price)}</span>
                    <span className="text-slate-400 ml-1.5">
                      {new Date(activeHover.time * 1000).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Jakarta',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* X-Axis Dynamic Markers & Timeframe Range */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pl-8 pt-1">
              <div className="flex gap-3 sm:gap-6 select-none overflow-hidden">
                {timeLabels.map((lbl, idx) => (
                  <span key={idx}>{lbl}</span>
                ))}
              </div>
              <div className="text-slate-400 shrink-0 pl-2">
                Spread: <strong className="text-white">{formatIDR(tfSpread)}</strong>
                <span className="text-slate-600 mx-1.5">|</span>
                <span className="text-slate-500">L:</span>{' '}
                <strong className="text-slate-300">{formatIDR(minPrice)}</strong>
                <span className="text-slate-600 mx-1">·</span>
                <span className="text-slate-500">H:</span>{' '}
                <strong className="text-slate-300">{formatIDR(maxPrice)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Horizontal 3-Column Catalyst / Intelligence Cards ── */}
      {stats.badges && stats.badges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {stats.badges.slice(0, 3).map((badge, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-3.5 flex items-center gap-3"
            >
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold whitespace-nowrap shrink-0 ${getBadgeColor(
                  badge.variant
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{badge.label}</span>
              </span>
              <p className="text-[11px] text-slate-400 font-mono line-clamp-2 leading-relaxed">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── 4. Key Metric Panels Grid (With Real Vector SVG Icons) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Valuation Multiples */}
        <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 space-y-4 hover:border-white/[0.14] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Valuation Multiples
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
              Pricing
            </span>
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">P/E Ratio (TTM)</span>
              <span className="font-bold text-white">
                {stats.peRatio !== null ? formatRatio(stats.peRatio) : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">P/BV (Price to Book)</span>
              <span className="font-bold text-white">
                {stats.pbvRatio !== null ? formatRatio(stats.pbvRatio) : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Price to Sales (P/S)</span>
              <span className="font-bold text-white">
                {stats.psRatio !== null ? formatRatio(stats.psRatio) : '—'}
              </span>
            </div>

            {showExtended && (
              <>
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">EV / EBITDA</span>
                  <span className="font-bold text-white">
                    {stats.evEbitda !== null ? formatRatio(stats.evEbitda) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-slate-400">Market Cap</span>
                  <span className="font-bold text-cyan-400">
                    {formatTrillion(stats.marketCapTrillion)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Profitability & Returns */}
        <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 space-y-4 hover:border-white/[0.14] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5L21 8.25M16.5 3.75h4.5v4.5" />
                </svg>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Profitability & Returns
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Quality
            </span>
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Return on Equity (ROE)</span>
              <span className="font-bold text-emerald-400">
                {stats.roe !== null ? `${stats.roe.toFixed(2)}%` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Return on Assets (ROA)</span>
              <span className="font-bold text-white">
                {stats.roa !== null ? `${stats.roa.toFixed(2)}%` : '—'}
              </span>
            </div>

            {showExtended && (
              <>
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Net Profit Margin</span>
                  <span className="font-bold text-white">
                    {stats.netMargin !== null ? `${stats.netMargin.toFixed(2)}%` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-slate-400">Operating Margin</span>
                  <span className="font-bold text-white">
                    {stats.operatingMargin !== null ? `${stats.operatingMargin.toFixed(2)}%` : '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Balance Sheet & Solvency */}
        <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 space-y-4 hover:border-white/[0.14] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Balance Sheet & Solvency
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
              Risk Profile
            </span>
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Debt to Equity (DER)</span>
              <span className={`font-bold ${stats.der && stats.der > 2.0 ? 'text-rose-400' : 'text-white'}`}>
                {stats.der !== null ? formatRatio(stats.der) : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Total Debt (Trillion)</span>
              <span className="font-bold text-white">
                {stats.totalDebtTrillion !== null ? formatTrillion(stats.totalDebtTrillion) : '—'}
              </span>
            </div>

            {showExtended && (
              <>
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Current Ratio</span>
                  <span className="font-bold text-white">
                    {stats.currentRatio !== null ? formatRatio(stats.currentRatio) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-slate-400">Solvency Status</span>
                  <span className={`font-bold ${stats.der && stats.der < 1.0 ? 'text-emerald-400' : 'text-purple-400'}`}>
                    {stats.der && stats.der < 1.0 ? 'Fortress' : 'Balanced'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Earnings & Cash Flow */}
        <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 space-y-4 hover:border-white/[0.14] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                  />
                </svg>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Earnings & Cash Flow
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              Shareholder Value
            </span>
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Earnings Per Share (EPS)</span>
              <span className="font-bold text-white">
                {stats.eps !== null ? formatIDR(stats.eps) : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Dividend Yield</span>
              <span className="font-bold text-amber-400">
                {stats.dividendYield !== null ? `${stats.dividendYield.toFixed(2)}%` : '—'}
              </span>
            </div>

            {showExtended && (
              <>
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Revenue TTM</span>
                  <span className="font-bold text-white">
                    {stats.revenueTTMTrillion !== null ? formatTrillion(stats.revenueTTMTrillion) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-slate-400">Net Income TTM</span>
                  <span className="font-bold text-emerald-400">
                    {stats.netIncomeTTMTrillion !== null ? formatTrillion(stats.netIncomeTTMTrillion) : '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Toggle for Extended Metrics */}
      <div className="text-center pt-1">
        <button
          onClick={() => setShowExtended((prev) => !prev)}
          className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>{showExtended ? '▲ Hide Extended Metrics' : '▼ View Extended Fundamental Metrics'}</span>
        </button>
      </div>
    </div>
  )
}
