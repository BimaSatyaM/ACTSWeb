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
const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as EquityPoint
    return (
      <div className="p-2.5 bg-[#090d18]/98 border border-white/[0.15] shadow-2xl text-left space-y-1 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-1">
          <span className="text-[11px] font-bold text-white font-mono">{d.timestamp || d.label}</span>
          <span className="text-[10px] font-mono text-zinc-400">
            {d.daily_r >= 0 ? `+${d.daily_r.toFixed(1)}R` : `${d.daily_r.toFixed(1)}R`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs font-mono">
          <span className="text-zinc-400 text-[10px]">Cumulative:</span>
          <span className={`font-bold ${d.cumulative_r >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {d.cumulative_r >= 0 ? `+${d.cumulative_r.toFixed(1)}R` : `${d.cumulative_r.toFixed(1)}R`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs font-mono">
          <span className="text-zinc-400 text-[10px]">Win Rate:</span>
          <span className="font-semibold text-white">{d.running_win_rate}%</span>
        </div>
        <div className="text-[9px] text-zinc-400 pt-0.5 border-t border-white/[0.05]">
          {d.trades_count === 0
            ? (d.timestamp.includes('(') ? d.timestamp.slice(d.timestamp.indexOf('(') + 1, -1) : 'Warmup / 0 Trades')
            : `${d.wins} Wins, ${d.losses} Losses (${d.trades_count} trades)`}
        </div>
      </div>
    )
  }
  return null
}

export function PerformanceCurveCard({ className = '' }: { className?: string }) {
  const [epoch, setEpoch] = useState<'live' | 'legacy'>('live')
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M')
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC')
  const [liveBtcTicker, setLiveBtcTicker] = useState<TickerItem | null>(null)

  // 1. Fetch Performance & Equity Curve Data scoped to live reset or full start-to-end legacy archive
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const query = epoch === 'legacy' ? 'epoch=legacy' : `timeframe=${timeframe}&epoch=live`
  const endpoint = supabaseUrl
    ? `${supabaseUrl}/functions/v1/get-performance?${query}`
    : `/api/performance?${query}`

  const { data, error, isLoading } = useSWR<PerformanceResponse>(endpoint, fetcher, {
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

  const curve = data?.equity_curve || []
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

        // Match the closest/most recent trade outcome state from curve
        let match = curve[0]
        for (const p of curve) {
          const pTime = new Date(p.date || p.timestamp || Date.now()).getTime()
          if (pTime <= timeMs + 1800000) {
            match = p
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
            ? `${timestamp} (Live Epoch • Active Monitoring)`
            : `${timestamp} (Legacy Period • Archived)`
        slots.push({
          date: dStr,
          id: `slot_${epoch}_${timeframe}_${dStr}_${i}`,
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
  }, [curve, timeframe, epoch])

  const archiveRangeLabel = React.useMemo(() => {
    if (epoch !== 'legacy' || curve.length === 0) return 'Aug 17 – Nov 5, 2026'
    const fmt = (raw: string) =>
      new Date(`${raw.split('T')[0]}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    const first = curve[0]?.date
    const last = curve[curve.length - 1]?.date
    return first && last ? `${fmt(first)} – ${fmt(last)}` : 'Aug 17 – Nov 5, 2026'
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

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${className}`}>
      <div className="lg:col-span-8 flex flex-col justify-between space-y-4 border-b lg:border-b-0 border-white/[0.06] pb-6 lg:pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="text-accent-theme">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
                <span>Cumulative Performance Curve</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-text-muted">
                  R-Multiple
                </span>
                {epoch === 'legacy' ? (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300">
                    Old Data ({archiveRangeLabel})
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                    Reset Active (Nov 11+)
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-text-secondary">
                {epoch === 'legacy'
                  ? `Complete pre-reset history from first trade to last trade (${archiveRangeLabel}).`
                  : 'Chronological outcome drift starting from Nov 11 reset epoch. Old data preserved in archive.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setEpoch('live')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all duration-150 cursor-pointer ${
                  epoch === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                New (Nov 11+)
              </button>
              <button
                type="button"
                onClick={() => setEpoch('legacy')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all duration-150 cursor-pointer ${
                  epoch === 'legacy'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                Old Data
              </button>
            </div>

            {epoch === 'live' ? (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                {(['1D', '1W', '1M', '3M', '1Y'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono uppercase transition-all duration-150 cursor-pointer ${
                      timeframe === tf
                        ? 'bg-accent-theme text-white shadow-[0_0_12px_rgba(255,46,84,0.4)]'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] font-mono font-semibold text-amber-300">
                Full Archive ({archiveRangeLabel})
              </div>
            )}
          </div>
        </div>

        <div className="relative w-full h-[240px] pt-2 select-none overflow-hidden flex-1">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 animate-pulse">
              <div className="w-6 h-6 border-2 border-accent-theme border-t-transparent animate-spin" />
              <span className="text-xs text-text-muted font-mono">Computing smooth performance curve...</span>
            </div>
          ) : error || chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-center p-6">
              <span className="text-xs font-mono text-text-muted">
                Live market session recording in progress...
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c41e3a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#c41e3a" stopOpacity={0.0} />
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
                        fill="#71717a"
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

                <Tooltip content={<CustomChartTooltip />} />

                <Area
                  type="monotone"
                  dataKey="value"
                  baseValue="dataMin"
                  stroke="#c41e3a"
                  strokeWidth={2.4}
                  fill="url(#redGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col justify-between space-y-6 lg:border-l border-white/[0.06] lg:pl-6">
        <div className="space-y-3.5 border-b border-white/[0.06] pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AssetIcon symbol={btcTicker.symbol} size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">{btcTicker.symbol} / USDT</span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                    Spot
                  </span>
                </div>
                <span className="text-[11px] text-zinc-300 font-mono">{btcTicker.name} Live Feed</span>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono ${
                isBtcPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <span>{isBtcPositive ? '▲' : '▼'}</span>
                <span>{Math.abs(btcTicker.change24h).toFixed(2)}% Today</span>
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              ${btcTicker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
              <span className="flex items-center gap-1">
                <span className="text-zinc-400">Delta:</span>
                <span className={isBtcPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {btcTicker.changeDollar >= 0 
                    ? `+$${btcTicker.changeDollar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                    : `-$${Math.abs(btcTicker.changeDollar).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </span>
              <span className="text-[11px] text-zinc-400">
                {btcTicker.changePips >= 0 ? `+${btcTicker.changePips.toLocaleString()}` : `-${Math.abs(btcTicker.changePips).toLocaleString()}`} pips
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
            <div className="py-1">
              <span className="text-zinc-400 block text-[10px]">Daily High</span>
              <span className="font-bold text-white">${btcTicker.high24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="py-1">
              <span className="text-zinc-400 block text-[10px]">Daily Low</span>
              <span className="font-bold text-white">${btcTicker.low24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Performance
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 font-mono">
                {epoch === 'legacy' ? 'Old Data • Full Archive' : `${timeframe} Outcome Drift`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1.5 px-0.5">
            <div>
              <span className="text-xs font-bold text-zinc-200 block tracking-tight">Net Gain</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Avg: {metrics ? (metrics.avg_r_per_trade >= 0 ? `+${metrics.avg_r_per_trade.toFixed(2)}R` : `${metrics.avg_r_per_trade.toFixed(2)}R`) : '0.00R'}/trade
              </span>
            </div>
            <span className={`text-sm sm:text-base font-bold font-mono ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics ? (metrics.net_r >= 0 ? `+${metrics.net_r.toFixed(1)}R` : `${metrics.net_r.toFixed(1)}R`) : '0.0R'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 px-0.5">
            <div>
              <span className="text-xs font-bold text-zinc-200 block tracking-tight">Win Rate</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {metrics?.wins || 0}W / {metrics?.losses || 0}L ({metrics?.total_trades || 0} total)
              </span>
            </div>
            <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
              {metrics?.win_rate !== undefined ? `${metrics.win_rate.toFixed(1)}%` : '0.0%'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 px-0.5">
            <div>
              <span className="text-xs font-bold text-zinc-200 block tracking-tight">Profit Factor</span>
              <span className="text-[11px] text-zinc-400 font-mono">Gross Win / Loss ratio</span>
            </div>
            <span className="text-sm sm:text-base font-bold font-mono text-white">
              {metrics?.profit_factor ? metrics.profit_factor.toFixed(2) : '1.00'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 px-0.5">
            <div>
              <span className="text-xs font-bold text-zinc-200 block tracking-tight">Max Drawdown</span>
              <span className="text-[11px] text-zinc-400 font-mono">Peak to trough risk</span>
            </div>
            <span className="text-sm sm:text-base font-bold font-mono text-rose-400">
              {metrics?.max_drawdown_r !== undefined ? `${metrics.max_drawdown_r.toFixed(1)}R` : '0.0R'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
