'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  UTCTimestamp,
  SeriesMarker,
  Time,
} from 'lightweight-charts'
import { calculateEMA, calculateStochastic } from '@/lib/indicators'
import type { CandleApiResponse, CandleData } from '@/types/academy'

export interface ChartSignalBracket {
  event_id: string
  published_at: string
  direction: 'BUY' | 'SELL'
  tier: 'SIGNAL' | 'WATCHLIST'
  score: number
  entryPrice?: number
  stopLoss?: number
  tp1Price?: number
}

interface ActsConfluenceChartProps {
  symbol?: string
  defaultInterval?: '5m' | '15m' | '1h' | '4h'
  activeSignal?: ChartSignalBracket | null
  recentSignals?: ChartSignalBracket[]
}

const TIMEFRAMES: ('5m' | '15m' | '1h' | '4h')[] = ['5m', '15m', '1h', '4h']

const jsonFetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })

function computePivotSR(candles: CandleData[]): { resistance: number | null; support: number | null } {
  if (candles.length < 15) return { resistance: null, support: null }
  const slice = candles.slice(-120)
  const lastClose = slice[slice.length - 1].close
  const highs: number[] = []
  const lows: number[] = []

  for (let i = 2; i < slice.length - 2; i++) {
    const c = slice[i]
    if (
      c.high >= slice[i - 1].high &&
      c.high >= slice[i - 2].high &&
      c.high >= slice[i + 1].high &&
      c.high >= slice[i + 2].high &&
      c.high > lastClose
    ) {
      highs.push(c.high)
    }
    if (
      c.low <= slice[i - 1].low &&
      c.low <= slice[i - 2].low &&
      c.low <= slice[i + 1].low &&
      c.low <= slice[i + 2].low &&
      c.low < lastClose
    ) {
      lows.push(c.low)
    }
  }

  highs.sort((a, b) => a - b)
  lows.sort((a, b) => b - a)

  return {
    resistance: highs.length > 0 ? highs[0] : null,
    support: lows.length > 0 ? lows[0] : null,
  }
}

function fmtPrice(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '—'
  return v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function ActsConfluenceChart({
  symbol = 'BTCUSDT',
  defaultInterval = '15m',
  activeSignal = null,
  recentSignals = [],
}: ActsConfluenceChartProps) {
  const [interval, setInterval] = useState<'5m' | '15m' | '1h' | '4h'>(defaultInterval)
  const [showEma20, setShowEma20] = useState(true)
  const [showEma50, setShowEma50] = useState(true)
  const [showEma200, setShowEma200] = useState(true)
  const [showStoch, setShowStoch] = useState(true)
  const [showSR, setShowSR] = useState(true)
  const [showBracket, setShowBracket] = useState(true)

  const [hoverCandle, setHoverCandle] = useState<CandleData | null>(null)

  const mainContainerRef = useRef<HTMLDivElement>(null)
  const stochContainerRef = useRef<HTMLDivElement>(null)
  const mainChartRef = useRef<IChartApi | null>(null)
  const stochChartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const stochKSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const stochDSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const priceLinesRef = useRef<IPriceLine[]>([])
  const markersPluginRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null)

  const cleanSymbol = symbol.replace(/^BINANCE:/i, '').replace(/\.P$/i, '').toUpperCase()

  const { data: candleRes, isLoading, error } = useSWR<CandleApiResponse>(
    `/api/academy/candles?symbol=${encodeURIComponent(cleanSymbol)}&interval=${interval}&limit=300`,
    jsonFetcher,
    { refreshInterval: 15000, revalidateOnFocus: false }
  )

  const candles = useMemo(() => candleRes?.candles ?? [], [candleRes])

  const indicators = useMemo(() => {
    if (candles.length === 0) {
      return { ema20: [], ema50: [], ema200: [], stoch: [], sr: { resistance: null, support: null } }
    }
    return {
      ema20: calculateEMA(candles, 20),
      ema50: calculateEMA(candles, 50),
      ema200: calculateEMA(candles, 200),
      stoch: calculateStochastic(candles, 5, 3, 3),
      sr: computePivotSR(candles),
    }
  }, [candles])

  // Initialize charts once
  useEffect(() => {
    const mainEl = mainContainerRef.current
    if (!mainEl) return

    const mainChart = createChart(mainEl, {
      layout: {
        background: { type: ColorType.Solid, color: '#fdfaf3' },
        textColor: '#475569',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(15, 23, 42, 0.05)' },
        horzLines: { color: 'rgba(15, 23, 42, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(3, 105, 161, 0.35)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(3, 105, 161, 0.35)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(15, 23, 42, 0.08)',
        scaleMargins: { top: 0.08, bottom: 0.2 },
      },
      timeScale: {
        borderColor: 'rgba(15, 23, 42, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    })

    const candleSeries = mainChart.addSeries(CandlestickSeries, {
      upColor: '#047857',
      downColor: '#be123c',
      borderVisible: false,
      wickUpColor: '#047857',
      wickDownColor: '#be123c',
    })

    const volSeries = mainChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.84, bottom: 0 },
    })

    const ema20Series = mainChart.addSeries(LineSeries, {
      color: '#0369a1',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    const ema50Series = mainChart.addSeries(LineSeries, {
      color: '#b45309',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    const ema200Series = mainChart.addSeries(LineSeries, {
      color: '#475569',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    mainChartRef.current = mainChart
    candleSeriesRef.current = candleSeries
    volSeriesRef.current = volSeries
    ema20SeriesRef.current = ema20Series
    ema50SeriesRef.current = ema50Series
    ema200SeriesRef.current = ema200Series
    markersPluginRef.current = createSeriesMarkers(candleSeries, [])

    const handleResize = () => {
      if (mainEl) {
        mainChart.applyOptions({ width: mainEl.clientWidth, height: mainEl.clientHeight })
      }
      if (stochContainerRef.current && stochChartRef.current) {
        stochChartRef.current.applyOptions({
          width: stochContainerRef.current.clientWidth,
          height: stochContainerRef.current.clientHeight,
        })
      }
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(mainEl)
    handleResize()

    return () => {
      ro.disconnect()
      markersPluginRef.current = null
      mainChart.remove()
      mainChartRef.current = null
      candleSeriesRef.current = null
    }
  }, [])

  // Mount/unmount Stochastic (5,3,3) synchronized sub-pane
  useEffect(() => {
    const stochEl = stochContainerRef.current
    const mainChart = mainChartRef.current
    if (!showStoch || !stochEl || !mainChart) {
      if (stochChartRef.current) {
        stochChartRef.current.remove()
        stochChartRef.current = null
        stochKSeriesRef.current = null
        stochDSeriesRef.current = null
      }
      return
    }

    const stochChart = createChart(stochEl, {
      layout: {
        background: { type: ColorType.Solid, color: '#fdfaf3' },
        textColor: '#475569',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(15, 23, 42, 0.04)' },
        horzLines: { color: 'rgba(15, 23, 42, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(3, 105, 161, 0.35)', width: 1, style: LineStyle.Dashed },
        horzLine: { visible: false },
      },
      rightPriceScale: {
        borderColor: 'rgba(15, 23, 42, 0.08)',
        autoScale: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(15, 23, 42, 0.08)',
        visible: false,
      },
      handleScroll: { vertTouchDrag: false },
      width: stochEl.clientWidth,
      height: stochEl.clientHeight,
    })

    const stochK = stochChart.addSeries(LineSeries, {
      color: '#0369a1',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
    })

    const stochD = stochChart.addSeries(LineSeries, {
      color: '#b45309',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    stochK.createPriceLine({
      price: 80,
      color: 'rgba(190, 18, 60, 0.35)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: 'OB',
    })
    stochK.createPriceLine({
      price: 20,
      color: 'rgba(4, 120, 87, 0.35)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: 'OS',
    })

    stochChartRef.current = stochChart
    stochKSeriesRef.current = stochK
    stochDSeriesRef.current = stochD

    let syncing = false
    const onMainRange = (range: { from: number; to: number } | null) => {
      if (syncing || !range) return
      syncing = true
      try {
        stochChart.timeScale().setVisibleLogicalRange(range)
      } catch {
        // Ignore before data loads
      }
      syncing = false
    }
    const onStochRange = (range: { from: number; to: number } | null) => {
      if (syncing || !range) return
      syncing = true
      try {
        mainChart.timeScale().setVisibleLogicalRange(range)
      } catch {
        // Ignore before data loads
      }
      syncing = false
    }

    mainChart.timeScale().subscribeVisibleLogicalRangeChange(onMainRange)
    stochChart.timeScale().subscribeVisibleLogicalRangeChange(onStochRange)

    return () => {
      mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(onMainRange)
      stochChart.timeScale().unsubscribeVisibleLogicalRangeChange(onStochRange)
      stochChart.remove()
      stochChartRef.current = null
      stochKSeriesRef.current = null
      stochDSeriesRef.current = null
    }
  }, [showStoch])

  // Populate data, indicators, markers, and crosshair hover
  useEffect(() => {
    const mainChart = mainChartRef.current
    const candleSeries = candleSeriesRef.current
    const volSeries = volSeriesRef.current
    if (!mainChart || !candleSeries || !volSeries || candles.length === 0) return

    const formattedCandles = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    candleSeries.setData(formattedCandles)

    volSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume ?? 0,
        color: c.close >= c.open ? 'rgba(4, 120, 87, 0.22)' : 'rgba(190, 18, 60, 0.20)',
      }))
    )

    ema20SeriesRef.current?.setData(
      showEma20 ? indicators.ema20.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })) : []
    )
    ema50SeriesRef.current?.setData(
      showEma50 ? indicators.ema50.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })) : []
    )
    ema200SeriesRef.current?.setData(
      showEma200 ? indicators.ema200.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })) : []
    )

    if (showStoch && stochKSeriesRef.current && stochDSeriesRef.current) {
      stochKSeriesRef.current.setData(
        indicators.stoch.map((p) => ({ time: p.time as UTCTimestamp, value: p.k }))
      )
      stochDSeriesRef.current.setData(
        indicators.stoch.map((p) => ({ time: p.time as UTCTimestamp, value: p.d }))
      )
    }

    // Remove previous price lines
    for (const pl of priceLinesRef.current) {
      try {
        candleSeries.removePriceLine(pl)
      } catch {
        // Already removed
      }
    }
    priceLinesRef.current = []

    // Draw S/R levels
    if (showSR) {
      if (indicators.sr.resistance !== null) {
        priceLinesRef.current.push(
          candleSeries.createPriceLine({
            price: indicators.sr.resistance,
            color: 'rgba(190, 18, 60, 0.45)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'RES',
          })
        )
      }
      if (indicators.sr.support !== null) {
        priceLinesRef.current.push(
          candleSeries.createPriceLine({
            price: indicators.sr.support,
            color: 'rgba(4, 120, 87, 0.45)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'SUP',
          })
        )
      }
    }

    // Draw Active Signal Execution Bracket (Entry, SL, TP)
    if (showBracket && activeSignal) {
      if (activeSignal.entryPrice) {
        priceLinesRef.current.push(
          candleSeries.createPriceLine({
            price: activeSignal.entryPrice,
            color: '#0369a1',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `${activeSignal.direction} ENTRY`,
          })
        )
      }
      if (activeSignal.tp1Price) {
        priceLinesRef.current.push(
          candleSeries.createPriceLine({
            price: activeSignal.tp1Price,
            color: '#047857',
            lineWidth: 1,
            lineStyle: LineStyle.LargeDashed,
            axisLabelVisible: true,
            title: 'TP 1.5R',
          })
        )
      }
      if (activeSignal.stopLoss) {
        priceLinesRef.current.push(
          candleSeries.createPriceLine({
            price: activeSignal.stopLoss,
            color: '#be123c',
            lineWidth: 1,
            lineStyle: LineStyle.LargeDashed,
            axisLabelVisible: true,
            title: 'SL -1R',
          })
        )
      }
    }

    // Draw Signal Markers aligned to nearest candle timestamps
    if (markersPluginRef.current) {
      const firstTs = Number(candles[0].time)
      const lastTs = Number(candles[candles.length - 1].time)
      const markers: SeriesMarker<Time>[] = []

      for (const sig of recentSignals) {
        const sigSec = Math.floor(new Date(sig.published_at).getTime() / 1000)
        if (Number.isNaN(sigSec) || sigSec < firstTs || sigSec > lastTs + 3600) continue
        // Snap to closest candle timestamp
        let closest = candles[0]
        let minDiff = Math.abs(Number(closest.time) - sigSec)
        for (const c of candles) {
          const diff = Math.abs(Number(c.time) - sigSec)
          if (diff < minDiff) {
            minDiff = diff
            closest = c
          }
        }
        const isBuy = sig.direction === 'BUY'
        markers.push({
          time: closest.time as UTCTimestamp,
          position: isBuy ? 'belowBar' : 'aboveBar',
          color: isBuy ? '#047857' : '#be123c',
          shape: isBuy ? 'arrowUp' : 'arrowDown',
          text: `${sig.direction} ${sig.score.toFixed(0)}`,
        })
      }

      markers.sort((a, b) => Number(a.time) - Number(b.time))
      markersPluginRef.current.setMarkers(markers)
    }

    // Sync visible range to recent 90 bars
    const total = candles.length
    const visibleRange = { from: Math.max(0, total - 90), to: total + 4 }
    mainChart.timeScale().setVisibleLogicalRange(visibleRange)
    if (showStoch && stochChartRef.current) {
      try {
        stochChartRef.current.timeScale().setVisibleLogicalRange(visibleRange)
      } catch {
        // Ignore
      }
    }

    const candleByTime = new Map<number, CandleData>()
    for (const c of candles) candleByTime.set(Number(c.time), c)

    const onCrosshair = (param: { time?: Time }) => {
      if (!param.time) {
        setHoverCandle(null)
        return
      }
      const found = candleByTime.get(Number(param.time))
      setHoverCandle(found ?? null)
    }
    mainChart.subscribeCrosshairMove(onCrosshair)
    return () => {
      mainChart.unsubscribeCrosshairMove(onCrosshair)
    }
  }, [candles, indicators, showEma20, showEma50, showEma200, showStoch, showSR, showBracket, activeSignal, recentSignals])

  const displayCandle = hoverCandle ?? (candles.length > 0 ? candles[candles.length - 1] : null)
  const lastEma20 = indicators.ema20.length > 0 ? indicators.ema20[indicators.ema20.length - 1].value : null
  const lastEma50 = indicators.ema50.length > 0 ? indicators.ema50[indicators.ema50.length - 1].value : null
  const lastEma200 = indicators.ema200.length > 0 ? indicators.ema200[indicators.ema200.length - 1].value : null
  const lastStoch = indicators.stoch.length > 0 ? indicators.stoch[indicators.stoch.length - 1] : null
  const isUp = displayCandle ? displayCandle.close >= displayCandle.open : true

  const toggleBtnClass = (active: boolean) =>
    `pb-1 text-[11px] font-mono transition-colors cursor-pointer border-b-2 ${
      active
        ? 'border-[#0369a1] text-slate-900 font-bold'
        : 'border-transparent text-slate-500 hover:text-slate-900'
    }`

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-900/10 bg-[#fdfaf3]">
      {/* Top Unboxed Toolbar — Timeframes & ACTS Indicator Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 pb-2 border-b border-slate-900/10">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold text-slate-900 tracking-tight">
            {cleanSymbol}
          </span>
          <div className="flex items-center gap-3" role="group" aria-label="Chart timeframe">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setInterval(tf)}
                className={toggleBtnClass(interval === tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3.5" role="group" aria-label="ACTS indicators">
          <button type="button" onClick={() => setShowEma20((v) => !v)} className={toggleBtnClass(showEma20)}>
            <span className="text-[#0369a1]">EMA 20</span>
          </button>
          <button type="button" onClick={() => setShowEma50((v) => !v)} className={toggleBtnClass(showEma50)}>
            <span className="text-[#b45309]">EMA 50</span>
          </button>
          <button type="button" onClick={() => setShowEma200((v) => !v)} className={toggleBtnClass(showEma200)}>
            <span className="text-slate-600">EMA 200</span>
          </button>
          <button type="button" onClick={() => setShowStoch((v) => !v)} className={toggleBtnClass(showStoch)}>
            Stoch 5,3,3
          </button>
          <button type="button" onClick={() => setShowSR((v) => !v)} className={toggleBtnClass(showSR)}>
            S/R
          </button>
          <button type="button" onClick={() => setShowBracket((v) => !v)} className={toggleBtnClass(showBracket)}>
            Bracket
          </button>
        </div>
      </div>

      {/* Inline OHLC & Indicator Telemetry Readout (Unboxed, Tabular Nums) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[11px] font-mono tabular-nums text-slate-600 border-b border-slate-900/5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span>
            O <strong className="text-slate-900">{fmtPrice(displayCandle?.open)}</strong>
          </span>
          <span>
            H <strong className="text-slate-900">{fmtPrice(displayCandle?.high)}</strong>
          </span>
          <span>
            L <strong className="text-slate-900">{fmtPrice(displayCandle?.low)}</strong>
          </span>
          <span>
            C{' '}
            <strong className={isUp ? 'text-emerald-700' : 'text-rose-700'}>
              {fmtPrice(displayCandle?.close)}
            </strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
          {showEma20 && lastEma20 !== null && (
            <span className="text-[#0369a1]">EMA20 {fmtPrice(lastEma20)}</span>
          )}
          {showEma50 && lastEma50 !== null && (
            <span className="text-[#b45309]">EMA50 {fmtPrice(lastEma50)}</span>
          )}
          {showEma200 && lastEma200 !== null && (
            <span className="text-slate-600">EMA200 {fmtPrice(lastEma200)}</span>
          )}
        </div>
      </div>

      {/* Main Candlestick + EMA + Bracket Canvas */}
      <div className="relative w-full">
        {isLoading && candles.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#fdfaf3] text-xs font-mono text-slate-500">
            Loading {cleanSymbol} {interval} candles...
          </div>
        )}
        {error && candles.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#fdfaf3] text-xs font-mono text-rose-700">
            Unable to load live candles. Retrying...
          </div>
        )}
        <div
          ref={mainContainerRef}
          className={`w-full ${showStoch ? 'h-[380px]' : 'h-[480px]'}`}
        />
      </div>

      {/* Synchronized Stochastic (5, 3, 3) Sub-Pane */}
      {showStoch && (
        <div className="border-t border-slate-900/10">
          <div className="flex items-center justify-between px-4 py-1 text-[10px] font-mono tabular-nums text-slate-500">
            <span>STOCH (5, 3, 3)</span>
            {lastStoch && (
              <div className="flex items-center gap-3">
                <span className="text-[#0369a1] font-semibold">%K {lastStoch.k.toFixed(1)}</span>
                <span className="text-[#b45309] font-semibold">%D {lastStoch.d.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div ref={stochContainerRef} className="w-full h-[108px]" />
        </div>
      )}
    </div>
  )
}
