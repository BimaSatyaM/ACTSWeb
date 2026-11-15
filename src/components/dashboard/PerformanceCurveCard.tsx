'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { AssetIcon } from '@/components/ui/AssetIcon'
import { TickerItem } from '@/app/api/market-prices/route'

interface EquityPoint {
  date: string
  label: string
  timestamp: string
  daily_r: number
  cumulative_r: number
  equity_value: number
  percent_gain: number
  running_win_rate: number
  trades_count: number
  wins: number
  losses: number
}

interface PerformanceResponse {
  timeframe: string
  epoch?: 'live' | 'legacy'
  tier?: 'signal' | 'watchlist'
  epoch_start?: string
  epoch_end?: string | null
  current_equity: number
  percent_gain: number
  metrics: {
    total_trades: number
    wins: number
    losses: number
    win_rate: number
    net_r: number
    profit_factor: number
    max_drawdown_r: number
    avg_r_per_trade: number
  }
  equity_curve: EquityPoint[]
}

type PerformanceView = 'signals' | 'watchlist' | 'legacy'

const VIEW_TABS: Array<{ id: PerformanceView; label: string }> = [
  { id: 'signals', label: 'Signals (Nov 11+)' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'legacy', label: 'Old Data' },
]

const RESET_EPOCH_DATE = '2026-11-11'

const fetcher = (url: string) => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const headers: HeadersInit = {}
  if (anonKey) {
    headers['apikey'] = anonKey
    headers['Authorization'] = `Bearer ${anonKey}`
  }
  return fetch(url, { headers }).then((res) => {
    if (!res.ok) throw new Error('Failed to load performance telemetry')
    return res.json()
  })
}

const marketFetcher = (url: string) => fetch(url).then((res) => res.json())

// Custom Glass Tooltip for Recharts
const CustomChartTooltip = ({ active, payload, isWatchlist = false }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as EquityPoint
    return (
      <div className="p-2.5 bg-[#fdfaf3] border border-slate-900/10 shadow-xl rounded-lg text-left space-y-1">
        <div className="flex items-center justify-between gap-3 border-b border-slate-900/10 pb-1">
          <span className="text-[11px] font-bold text-slate-900 font-mono tabular-nums">{d.timestamp || d.label}</span>
          <span className="text-[10px] font-mono tabular-nums text-slate-600">
            {d.daily_r >= 0 ? `+${d.daily_r.toFixed(1)}R` : `${d.daily_r.toFixed(1)}R`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs font-mono tabular-nums">
          <span className="text-slate-500 text-[10px]">Cumulative:</span>
          <span className={`font-bold tabular-nums ${d.cumulative_r >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {d.cumulative_r >= 0 ? `+${d.cumulative_r.toFixed(1)}R` : `${d.cumulative_r.toFixed(1)}R`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs font-mono tabular-nums">
          <span className="text-slate-500 text-[10px]">Win Rate:</span>
          <span className="font-semibold text-slate-900 tabular-nums">{d.running_win_rate}%</span>
        </div>
        <div className="text-[9px] text-slate-500 pt-0.5 border-t border-slate-900/10 font-mono tabular-nums">
          {d.trades_count === 0
            ? (d.timestamp.includes('(') ? d.timestamp.slice(d.timestamp.indexOf('(') + 1, -1) : `Warmup / 0 ${isWatchlist ? 'Setups' : 'Trades'}`)
            : `${d.wins} Wins, ${d.losses} Losses (${d.trades_count} ${isWatchlist ? 'setups' : 'trades'})`}
        </div>
      </div>
    )
  }
  return null
}

export function PerformanceCurveCard({ className = '' }: { className?: string }) {
  const [view, setView] = useState<PerformanceView>('signals')
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M')
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC')
  const [liveBtcTicker, setLiveBtcTicker] = useState<TickerItem | null>(null)

  const epoch = view === 'legacy' ? 'legacy' : 'live'
  const isWatchlist = view === 'watchlist'

  // 1. Fetch Performance & Equity Curve Data scoped to signals, watchlist, or legacy archive
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const query = view === 'legacy'
    ? 'epoch=legacy'
    : `timeframe=${timeframe}&epoch=live&tier=${isWatchlist ? 'watchlist' : 'signal'}`
  const endpoint = supabaseUrl
    ? `${supabaseUrl}/functions/v1/get-performance?${query}`
    : `/api/performance?${query}`

  const { data, error, isLoading, mutate } = useSWR<PerformanceResponse>(endpoint, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  })

  // 2. Fetch Live Market Ticker Prices (every 5 seconds)
  const { data: marketData } = useSWR<{ tickers: TickerItem[] }>('/api/market-prices', marketFetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  })

  // 3. Ultra-Fast Sub-Second Binance Live WebSocket Feed (@aggTrade + @ticker)
  React.useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connectWs = () => {
      try {
        ws = new WebSocket('wss://data-stream.binance.vision/ws/btcusdt@trade/btcusdt@aggTrade/btcusdt@ticker')
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            
            // Sub-second real-time trade tick (@trade or @aggTrade)
            if ((msg.e === 'aggTrade' || msg.e === 'trade') && msg.s === 'BTCUSDT') {
              const livePrice = parseFloat(parseFloat(msg.p).toFixed(2))
              setLiveBtcTicker((prev) => {
                const prevOpen = prev?.high24h && prev?.change24h !== undefined ? prev.price / (1 + prev.change24h / 100) : livePrice
                const changeDollar = parseFloat((livePrice - prevOpen).toFixed(2))
                const changePips = Math.round(Math.abs(changeDollar))
                return {
                  symbol: 'BTC',
                  name: 'Bitcoin',
                  price: livePrice,
                  change24h: prev?.change24h ?? 0,
                  changeDollar,
                  changePips,
                  high24h: prev?.high24h ?? livePrice,
                  low24h: prev?.low24h ?? livePrice,
                  volume24h: prev?.volume24h ?? 0,
                  category: 'crypto',
                }
              })
            }

            // 24hr Stats update (keep latest real-time trade price)
            if (msg.e === '24hrTicker' && msg.s === 'BTCUSDT') {
              const change24h = parseFloat(parseFloat(msg.P).toFixed(2))
              const changeDollar = parseFloat(parseFloat(msg.p).toFixed(2))
              const high24h = parseFloat(parseFloat(msg.h).toFixed(2))
              const low24h = parseFloat(parseFloat(msg.l).toFixed(2))
              const volume24h = parseFloat(parseFloat(msg.q).toFixed(0))
              const changePips = Math.round(Math.abs(changeDollar))

              setLiveBtcTicker((prev) => ({
                symbol: 'BTC',
                name: 'Bitcoin',
                price: prev?.price ?? parseFloat(parseFloat(msg.c).toFixed(2)),
                change24h,
                changeDollar: prev?.changeDollar ?? changeDollar,
                changePips: prev?.changePips ?? changePips,
                high24h: prev?.high24h ? Math.max(prev.high24h, high24h) : high24h,
                low24h: prev?.low24h ? Math.min(prev.low24h, low24h) : low24h,
                volume24h,
                category: 'crypto',
              }))
            }
          } catch {}
        }
        ws.onerror = () => ws?.close()
        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 2000)
        }
      } catch {
        reconnectTimeout = setTimeout(connectWs, 3000)
      }
    }

    connectWs()
    return () => {
      clearTimeout(reconnectTimeout)
      if (ws) {
        ws.onclose = null
        ws.onerror = null
        try {
          ws.close()
        } catch {}
      }
    }
  }, [])

  const fetchedTicker = marketData?.tickers?.find((t) => t.symbol === selectedAsset) || marketData?.tickers?.[0]
  const btcTicker = (selectedAsset === 'BTC' && liveBtcTicker) ? liveBtcTicker : (fetchedTicker || {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 71704.0,
    change24h: 8.85,
    changeDollar: 5830.0,
    changePips: 5830,
    high24h: 72490.0,
    low24h: 65892.0,
    volume24h: 3193895000,
    category: 'crypto' as const,
  })

  const curve = React.useMemo(() => data?.equity_curve ?? [], [data?.equity_curve])
  const metrics = data?.metrics
  const netR = metrics?.net_r ?? 0
  const isNetPositive = netR >= 0
  const isBtcPositive = btcTicker.change24h >= 0

  // Format data for Recharts <Area> with strictly unique keys to prevent tooltip collision
  // Ensures clean 24-hour chronological hourly resolution for 1D in live mode, and full start-to-end history for legacy archive
  const chartData = React.useMemo(() => {
    if (!curve || curve.length === 0) return []

    // ── Legacy Archive: Fixed start-to-end span across all historical trades (no 1D/1W/1M/3M/1Y slicing) ──
    if (epoch === 'legacy') {
      return curve.map((item, idx) => {
        const dStr = (item.date || item.timestamp || '').split('T')[0]
        const dObj = dStr ? new Date(`${dStr}T00:00:00Z`) : new Date()
        const label = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
        const timestamp = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
        return {
          ...item,
          id: `slot_legacy_${dStr}_${idx}`,
          label,
          timestamp,
          value: item.cumulative_r,
        }
      })
    }

    // ── 1D: True 24-Hour Chronological Hourly Sequence (25 points) ──
    if (timeframe === '1D') {
      const now = new Date()
      const currentHour = new Date(now)
      currentHour.setMinutes(0, 0, 0)

      const slots: typeof curve = []
      for (let i = 24; i >= 0; i--) {
        const slotTime = new Date(currentHour.getTime() - i * 3600 * 1000)
        const timeMs = slotTime.getTime()

        let match = i === 0 ? curve[curve.length - 1] : curve[0]
        if (i !== 0) {
          for (const p of curve) {
            const pTime = new Date(p.date || p.timestamp || now.toISOString()).getTime()
            if (pTime <= timeMs + 1800000) {
              match = p
            }
          }
        }

        const hourStr = slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        const labelText = i === 0 ? 'Now' : hourStr
        const tooltipTime = i === 0 ? `${hourStr} (Now)` : hourStr

        slots.push({
          ...match,
          date: slotTime.toISOString(),
          label: labelText,
          timestamp: tooltipTime,
          cumulative_r: match ? match.cumulative_r : 0,
        })
      }

      return slots.map((item, idx) => {
        const prevCumulative = idx > 0 ? slots[idx - 1].cumulative_r : item.cumulative_r
        const hourlyDelta = parseFloat((item.cumulative_r - prevCumulative).toFixed(2))
        return {
          ...item,
          id: `slot_1d_${idx}_${item.date}`,
          daily_r: hourlyDelta,
          value: item.cumulative_r,
        }
      })
    }

    // ── Multi-Day Timeframes (1W, 1M, 3M, 1Y) ──
    const targetDays = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : 365

    // Build lookup dictionary from backend curve by date (YYYY-MM-DD)
    const curveByDate = new Map<string, EquityPoint>()
    for (const p of curve) {
      const dStr = (p.date || p.timestamp || '').split('T')[0]
      if (dStr) {
        curveByDate.set(dStr, p)
      }
    }

    const now = new Date()
    const windowStartMs = now.getTime() - (targetDays - 1) * 24 * 60 * 60 * 1000
    const windowStartStr = new Date(windowStartMs).toISOString().split('T')[0]

    // Pre-initialize lastKnownPoint if there was data prior to this window
    let lastKnownPoint: EquityPoint | null = null
    for (const p of curve) {
      const dStr = (p.date || p.timestamp || '').split('T')[0]
      if (dStr && dStr < windowStartStr) {
        lastKnownPoint = p
      }
    }

    const slots: Array<EquityPoint & { id: string; value: number }> = []

    for (let i = targetDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dStr = d.toISOString().split('T')[0]

      const isEnd = i === 0
      const label = timeframe === '1W'
        ? (isEnd ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }))
        : timeframe === '1Y'
        ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : (isEnd ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

      const timestamp = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

      if (curveByDate.has(dStr)) {
        const item = curveByDate.get(dStr)!
        lastKnownPoint = item
        slots.push({
          ...item,
          id: `slot_${epoch}_${timeframe}_${dStr}_${i}`,
          label,
          timestamp,
          value: item.cumulative_r,
        })
      } else if (lastKnownPoint) {
        // Active trading period, but no closed trades on this specific calendar date
        slots.push({
          ...lastKnownPoint,
          date: dStr,
          id: `slot_${epoch}_${timeframe}_${dStr}_${i}`,
          label,
          timestamp,
          daily_r: 0,
          value: lastKnownPoint.cumulative_r,
        })
      } else {
        const emptyLabel =
          dStr >= RESET_EPOCH_DATE
            ? `${timestamp} (${isWatchlist ? 'Watchlist · Non-Capital' : 'Signals · Active Monitoring'})`
            : `${timestamp} (Legacy Period · Archived)`
        slots.push({
          date: dStr,
          id: `slot_${view}_${timeframe}_${dStr}_${i}`,
          label,
          timestamp: emptyLabel,
          daily_r: 0,
          cumulative_r: 0,
          equity_value: 10000.0,
          percent_gain: 0,
          running_win_rate: 0,
          trades_count: 0,
          wins: 0,
          losses: 0,
          value: 0,
        })
      }
    }

    return slots
  }, [curve, timeframe, epoch, view, isWatchlist])

  const archiveRangeLabel = React.useMemo(() => {
    if (epoch !== 'legacy' || curve.length === 0) return 'Aug 17 - Nov 5, 2026'
    const fmt = (raw: string) =>
      new Date(`${raw.split('T')[0]}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    const first = curve[0]?.date
    const last = curve[curve.length - 1]?.date
    return first && last ? `${fmt(first)} - ${fmt(last)}` : 'Aug 17 - Nov 5, 2026'
  }, [epoch, curve])

  // Compute 5 evenly spaced tick IDs across the date range to completely eliminate stacking
  const axisTicks = React.useMemo(() => {
    if (!chartData.length) return []
    if (chartData.length <= 5) return chartData.map((d) => d.id)
    const count = 5
    const step = (chartData.length - 1) / (count - 1)
    const indices = Array.from({ length: count }, (_, i) => Math.min(Math.round(i * step), chartData.length - 1))
    const uniqueIndices = Array.from(new Set(indices))
    return uniqueIndices.map((idx) => chartData[idx].id)
  }, [chartData])

  const daySpan = btcTicker.high24h - btcTicker.low24h
  const rangePct = daySpan > 0 ? Math.min(100, Math.max(0, ((btcTicker.price - btcTicker.low24h) / daySpan) * 100)) : 50

  return (
    <div className={`rounded-2xl border border-slate-900/10 bg-[#faf2df] p-5 sm:p-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 flex flex-col justify-between space-y-5 border-b lg:border-b-0 border-slate-900/10 pb-6 lg:pb-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-900/10 pb-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                <span className={isWatchlist ? 'text-amber-700 font-bold' : 'text-[#0369a1] font-bold'}>
                  {isWatchlist ? 'WATCHLIST R' : 'R-MULTIPLE'}
                </span>
                <span>·</span>
                <span>
                  {epoch === 'legacy'
                    ? `PRE-RESET ARCHIVE (${archiveRangeLabel})`
                    : `${timeframe} OUTCOME DRIFT`}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Cumulative Performance Curve
              </h3>
              <p className="text-xs text-slate-600">
                {epoch === 'legacy'
                  ? `Pre-reset Signal history (${archiveRangeLabel}).`
                  : isWatchlist
                  ? 'Sub-threshold Watchlist setups since Nov 11 (non-capital).'
                  : 'Executed Signal trades since Nov 11 reset.'}
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-start sm:items-end gap-2.5">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 text-[11px] font-bold font-mono" role="group" aria-label="Performance data source">
                {VIEW_TABS.map((tab) => {
                  const isActive = view === tab.id
                  const activeClasses =
                    tab.id === 'watchlist'
                      ? 'text-amber-800 border-amber-600'
                      : 'text-[#0369a1] border-[#0369a1]'
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setView(tab.id)}
                      className={`relative pb-1 whitespace-nowrap transition-colors duration-150 border-b-2 after:content-[''] after:absolute after:-inset-y-2.5 after:-inset-x-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                        isActive
                          ? activeClasses
                          : 'text-slate-500 hover:text-slate-900 border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              <div className="min-h-[24px] flex items-center">
                {epoch === 'live' ? (
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold font-mono uppercase" role="group" aria-label="Timeframe window">
                    {(['1D', '1W', '1M', '3M', '1Y'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        aria-pressed={timeframe === tf}
                        onClick={() => setTimeframe(tf)}
                        className={`relative pb-0.5 transition-colors duration-150 border-b after:content-[''] after:absolute after:-inset-y-2.5 after:-inset-x-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                          timeframe === tf
                            ? (isWatchlist ? 'text-amber-800 border-amber-700' : 'text-[#0369a1] border-[#0369a1]')
                            : 'text-slate-500 hover:text-slate-900 border-transparent'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-[24px]" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-900/10 pb-4">
            <div className="space-y-0.5">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Net Gain</span>
              <span className={`block text-base sm:text-lg font-bold font-mono tabular-nums ${isNetPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                {metrics ? (metrics.net_r >= 0 ? `+${metrics.net_r.toFixed(1)}R` : `${metrics.net_r.toFixed(1)}R`) : '0.0R'}
              </span>
              <span className="block text-[10px] font-mono tabular-nums text-slate-500">
                Avg {metrics ? (metrics.avg_r_per_trade >= 0 ? `+${metrics.avg_r_per_trade.toFixed(2)}R` : `${metrics.avg_r_per_trade.toFixed(2)}R`) : '0.00R'}/{isWatchlist ? 'setup' : 'trade'}
              </span>
            </div>

            <div className="space-y-0.5 sm:border-l border-slate-900/10 sm:pl-4">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Win Rate</span>
              <span className="block text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-700">
                {metrics?.win_rate !== undefined ? `${metrics.win_rate.toFixed(1)}%` : '0.0%'}
              </span>
              <span className="block text-[10px] font-mono tabular-nums text-slate-500">
                {metrics?.wins || 0}W / {metrics?.losses || 0}L ({metrics?.total_trades || 0} total)
              </span>
            </div>

            <div className="space-y-0.5 sm:border-l border-slate-900/10 sm:pl-4">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Profit Factor</span>
              <span className="block text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900">
                {metrics?.profit_factor ? metrics.profit_factor.toFixed(2) : '1.00'}
              </span>
              <span className="block text-[10px] font-mono text-slate-500">Gross Win / Loss</span>
            </div>

            <div className="space-y-0.5 sm:border-l border-slate-900/10 sm:pl-4">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Max Drawdown</span>
              <span className="block text-base sm:text-lg font-bold font-mono tabular-nums text-rose-700">
                {metrics?.max_drawdown_r !== undefined ? `${metrics.max_drawdown_r.toFixed(1)}R` : '0.0R'}
              </span>
              <span className="block text-[10px] font-mono text-slate-500">Peak to trough</span>
            </div>
          </div>

          <div className="relative w-full h-[230px] pt-1 select-none overflow-hidden flex-1">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
                <div className="w-6 h-6 border-2 border-[#0284c7] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span className="text-xs text-slate-500 font-mono">Loading performance curve...</span>
              </div>
            ) : error ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6" role="alert">
                <span className="text-xs font-mono text-rose-700">
                  Unable to load performance metrics. Check network connectivity and retry.
                </span>
                <button
                  type="button"
                  onClick={() => mutate()}
                  className="min-h-[44px] px-4 rounded-lg border border-slate-900/15 bg-[#fdfaf3] hover:bg-[#f3ead2] text-xs font-mono font-bold text-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
                >
                  Retry
                </button>
              </div>
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-center p-6">
                <span className="text-xs font-mono text-slate-500">
                  {epoch === 'legacy'
                    ? 'No archived Signal trades found in legacy history.'
                    : isWatchlist
                    ? 'No Watchlist setups tracked in this window yet.'
                    : 'No executed Signal trades recorded since Nov 11 reset.'}
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="id"
                    ticks={axisTicks}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={({ x, y, payload, index }: any) => {
                      const item = chartData.find((d) => d.id === payload?.value) || chartData[index]
                      const text = item ? (item.label || item.timestamp) : payload?.value
                      const isFirst = index === 0
                      const isLast = index === axisTicks.length - 1
                      const textAnchor = isFirst ? 'start' : isLast ? 'end' : 'middle'
                      return (
                        <text
                          x={x}
                          y={y + 12}
                          fill="#64748b"
                          fontSize={10}
                          fontFamily="monospace"
                          textAnchor={textAnchor}
                        >
                          {text}
                        </text>
                      )
                    }}
                    padding={{ left: 0, right: 0 }}
                  />

                  <YAxis
                    hide
                    domain={[(dataMin: number) => dataMin - 1.0, (dataMax: number) => dataMax + 1.0]}
                  />

                  <Tooltip content={<CustomChartTooltip isWatchlist={isWatchlist} />} />

                  <Area
                    type="monotone"
                    dataKey="value"
                    baseValue="dataMin"
                    stroke={isWatchlist ? '#d97706' : '#0284c7'}
                    strokeWidth={2.4}
                    fill={isWatchlist ? 'url(#amberGrad)' : 'url(#oceanGrad)'}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-6 lg:border-l border-slate-900/10 lg:pl-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AssetIcon symbol={btcTicker.symbol} size="md" />
                <div>
                  <div className="text-xs font-bold text-slate-900 tracking-tight font-mono">
                    {btcTicker.symbol} / USDT <span className="text-slate-500 font-normal">· SPOT</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{btcTicker.name} Live Feed</span>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono tabular-nums ${
                isBtcPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                <span>{isBtcPositive ? '▲' : '▼'}</span>
                <span>{Math.abs(btcTicker.change24h).toFixed(2)}%</span>
              </span>
            </div>

            <div className="space-y-1.5 border-y border-slate-900/10 py-4">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
                ${btcTicker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="text-slate-500">24H DELTA</span>
                  <span className={`tabular-nums ${isBtcPositive ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}`}>
                    {btcTicker.changeDollar >= 0 ? `+$${btcTicker.changeDollar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `-$${Math.abs(btcTicker.changeDollar).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </span>
                <span className="text-slate-500 tabular-nums">
                  {btcTicker.changePips >= 0 ? `+${btcTicker.changePips.toLocaleString()}` : `-${Math.abs(btcTicker.changePips).toLocaleString()}`} pips
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500">
                <span>24H Range Envelope</span>
                <span className="tabular-nums text-slate-700 font-semibold">{rangePct.toFixed(0)}% of span</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isBtcPositive ? 'bg-emerald-600' : 'bg-rose-600'}`}
                  style={{ width: `${rangePct}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono tabular-nums">
                <div>
                  <span className="text-slate-500 block text-[10px]">DAILY LOW</span>
                  <span className="font-bold text-slate-900">${btcTicker.low24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">DAILY HIGH</span>
                  <span className="font-bold text-slate-900">${btcTicker.high24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900/10 pt-4 space-y-2 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 uppercase tracking-wider">Epoch Scope</span>
              <span className="font-bold text-slate-800">
                {epoch === 'legacy'
                  ? 'Full Archive'
                  : isWatchlist
                  ? 'Non-Capital Watchlist'
                  : 'Nov 11+ Live Ledger'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 uppercase tracking-wider">Curve Basis</span>
              <span className="font-bold text-slate-800">1R Risk Normalized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
