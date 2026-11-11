'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  Time,
} from 'lightweight-charts'
import { Candle, StockMeta } from '@/lib/idxData'
import { useIDXStream } from '@/lib/useIDXStream'
import { IDXStockLogo } from '@/components/ui/IDXStockLogo'

interface IDXStockChartProps {
  symbol: string
  meta: StockMeta
  initialTimeframe?: string
  height?: number
  showStatsStrip?: boolean
  onPriceUpdate?: (price: number, change: number, changePct: number) => void
}

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '1D']

export function IDXStockChart({
  symbol,
  meta,
  initialTimeframe = '15m',
  height = 360,
  showStatsStrip = false,
  onPriceUpdate,
}: IDXStockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const [timeframe, setTimeframe] = useState<string>(initialTimeframe)
  const [loading, setLoading] = useState<boolean>(true)
  const [candles, setCandles] = useState<Candle[]>([])
  
  // Real-time HUD hover telemetry
  const [hoverData, setHoverData] = useState<{
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  } | null>(null)

  const [livePrice, setLivePrice] = useState<number>(meta.currentPrice)
  const [liveChange, setLiveChange] = useState<number>(meta.changePoints)
  const [liveChangePct, setLiveChangePct] = useState<number>(meta.changePercent)

  // Sync state when meta prop changes
  useEffect(() => {
    setLivePrice(meta.currentPrice)
    setLiveChange(meta.changePoints)
    setLiveChangePct(meta.changePercent)
  }, [meta.symbol, meta.currentPrice, meta.changePoints, meta.changePercent])

  // ── 1. Fetch Candle Data ──
  const fetchCandles = useCallback(async (sym: string, tf: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/idx/quote?symbol=${sym}&timeframe=${tf}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.candles) {
          setCandles(data.candles)
          setLivePrice(data.meta.currentPrice)
          setLiveChange(data.meta.changePoints)
          setLiveChangePct(data.meta.changePercent)
        }
      }
    } catch (err) {
      console.error('Failed to fetch candles for', sym, err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCandles(symbol, timeframe)
  }, [symbol, timeframe, fetchCandles])

  // ── 2. Initialize Lightweight Chart Engine ──
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Clean up previous chart instance
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const container = chartContainerRef.current

    const chart = createChart(container, {
      width: container.clientWidth,
      height: height || 360,
      layout: {
        background: { type: ColorType.Solid, color: '#090b13' },
        textColor: '#71717a',
        fontFamily: 'var(--font-geist-mono, monospace), monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.25)',
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: '#181b2a',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.25)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#181b2a',
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: timeframe === '1m',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25, // Leaves bottom 25% for volume bars
        },
      },
    })

    // Volume series (Overlay at bottom)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.78, // volume bars occupy bottom 22%
        bottom: 0,
      },
    })

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: true,
      borderUpColor: '#10b981',
      borderDownColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries

    // Crosshair hover detail listener
    chart.subscribeCrosshairMove((param) => {
      if (
        !param.time ||
        param.point === undefined ||
        !param.seriesData.has(candleSeries)
      ) {
        setHoverData(null)
        return
      }

      const candleData = param.seriesData.get(candleSeries) as any
      const volData = param.seriesData.get(volumeSeries) as any

      if (candleData) {
        const d = new Date((param.time as number) * 1000)
        const timeFormatted = d.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })

        setHoverData({
          time: timeFormatted,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData ? volData.value : 0,
        })
      }
    })

    // Responsive resize handler
    const handleResize = () => {
      if (container && chart) {
        chart.applyOptions({
          width: container.clientWidth,
          height: height || 360,
        })
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [timeframe, height])

  // ── 3. Populate Chart Data ──
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) {
      return
    }

    const candleChartData = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    const volumeChartData = candles.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.28)',
    }))

    candleSeriesRef.current.setData(candleChartData)
    volumeSeriesRef.current.setData(volumeChartData)

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [candles])

  // ── 4. Real-time Sub-Second WebSocket Streaming ──
  useIDXStream({
    symbols: [symbol],
    onQuote: (quote) => {
      const cleanSym = symbol.replace('.JK', '').replace('IDX:', '').toUpperCase()
      if (quote.symbol === cleanSym && quote.price > 0) {
        setLivePrice(quote.price)
        setLiveChange(quote.changePoints)
        setLiveChangePct(quote.changePercent)

        if (onPriceUpdate) {
          onPriceUpdate(quote.price, quote.changePoints, quote.changePercent)
        }

        // Sub-second update into lightweight-charts canvas
        if (candleSeriesRef.current && candles.length > 0) {
          const lastCandle = candles[candles.length - 1]
          candleSeriesRef.current.update({
            time: lastCandle.time as Time,
            open: lastCandle.open,
            high: Math.max(lastCandle.high, quote.price),
            low: Math.min(lastCandle.low, quote.price),
            close: quote.price,
          })
        }
      }
    },
  })

  // ── 5. Background Poller for Candle History (Every 5s) ──
  useEffect(() => {
    let isMounted = true

    const pollCandles = async () => {
      try {
        const res = await fetch(`/api/idx/quote?symbol=${symbol}&timeframe=${timeframe}`)
        if (res.ok && isMounted) {
          const data = await res.json()
          if (data.success && data.meta) {
            // Keep meta stats aligned
            if (data.candles && data.candles.length > 0) {
              setCandles(data.candles)
            }
          }
        }
      } catch (err) {
        // silent fail
      }
    }

    const interval = setInterval(pollCandles, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [symbol, timeframe])

  const isPositive = liveChange >= 0

  return (
    <div className="flex flex-col rounded-xl bg-[#0d121f] border border-white/[0.08] overflow-hidden">
      {/* ── Top Bar: Ticker Telemetry HUD & Timeframe Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 bg-white/[0.01] border-b border-white/[0.08]">
        {/* Left: Stock Identity & Live Price */}
        <div className="flex items-center gap-3">
          <IDXStockLogo symbol={meta.symbol} name={meta.name} logoUrl={meta.logoUrl} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                {meta.symbol}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                IDX
              </span>
              {meta.group && (
                <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                  {meta.group}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono line-clamp-1 max-w-[140px] sm:max-w-xs">
              {meta.name}
            </p>
          </div>

          <div className="h-6 w-px bg-white/[0.08] hidden sm:block" />

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-black text-white font-mono tracking-tight">
              Rp {livePrice.toLocaleString()}
            </span>
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>{isPositive ? '+' : ''}{liveChange.toLocaleString()}</span>
              <span>({isPositive ? '+' : ''}{liveChangePct.toFixed(2)}%)</span>
            </span>
          </div>
        </div>

        {/* Right: Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-white/[0.08] self-start sm:self-auto">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-white/[0.12] text-white border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ── Compact Key Stats Telemetry Strip (Optional) ── */}
      {showStatsStrip && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-2 bg-[#070b14]/70 border-b border-white/[0.06] text-xs font-mono">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">24h H/L</span>
            <span className="text-white font-semibold text-[11px]">
              {meta.dayHigh ? meta.dayHigh.toLocaleString() : '-'} / {meta.dayLow ? meta.dayLow.toLocaleString() : '-'}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mkt Cap</span>
            <span className="text-white font-semibold text-[11px]">
              Rp {(meta.marketCapTrillion || 0).toFixed(1)} T
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">P/E · P/BV</span>
            <span className="text-white font-semibold text-[11px]">
              {(meta.peRatio || 0).toFixed(1)}x · {(meta.pbvRatio || 0).toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Foreign</span>
            <span className={`text-[11px] font-bold ${
              meta.foreignFlow === 'BUY' ? 'text-emerald-400' : meta.foreignFlow === 'SELL' ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {meta.foreignFlow === 'BUY' ? '+Rp ' : meta.foreignFlow === 'SELL' ? '-Rp ' : ''}{Math.abs(meta.foreignNetBillion || 0).toFixed(1)} B
            </span>
          </div>
        </div>
      )}

      {/* ── Floating Hover OHLC Data Strip ── */}
      <div className="flex items-center gap-3.5 px-4 py-1.5 bg-[#070b14] text-[11px] font-mono text-slate-400 border-b border-white/[0.06] overflow-x-auto custom-scrollbar">
        {hoverData ? (
          <>
            <span className="text-slate-400">{hoverData.time}</span>
            <span>O: <strong className="text-white">Rp {hoverData.open.toLocaleString()}</strong></span>
            <span>H: <strong className="text-emerald-400">Rp {hoverData.high.toLocaleString()}</strong></span>
            <span>L: <strong className="text-rose-400">Rp {hoverData.low.toLocaleString()}</strong></span>
            <span>C: <strong className="text-white">Rp {hoverData.close.toLocaleString()}</strong></span>
            <span>Vol: <strong className="text-white">{(hoverData.volume / 1000).toFixed(1)}k</strong></span>
          </>
        ) : (
          <span className="text-[10px] text-slate-500 italic">
            Hover over chart for candle details · Scroll to zoom · Drag to pan
          </span>
        )}
      </div>

      {/* ── Canvas Chart Container ── */}
      <div className="relative w-full" style={{ height: height || 360 }}>
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#090b13]/80 backdrop-blur-xs">
            <span className="w-8 h-8 border-2 border-[#ff2e54] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
