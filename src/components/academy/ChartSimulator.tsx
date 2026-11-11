'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  UTCTimestamp,
} from 'lightweight-charts'
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
} from '@/lib/indicators'
import {
  calculateBrackets,
  evaluateBarOutcome,
  FULL_TP3_R_MULTIPLE,
} from '@/lib/bracketMath'
import {
  CandleData,
  ChartExerciseConfig,
  TradeDirection,
  BracketSetup,
  ReplayTradeState,
} from '@/types/academy'
import bundledCandlesData from '@/data/academy/bundled_candles.json'

interface ChartSimulatorProps {
  symbol?: string
  timeframe?: string
  initialBars?: number
  exerciseConfig?: ChartExerciseConfig
  onTradeComplete?: (result: { rMultiple: number; outcome: string; exitReason: string }) => void
  height?: number
}

interface ActiveIndicators {
  srZones: boolean
  ema20: boolean
  ema50: boolean
  ema200: boolean
  bb: boolean
  rsi: boolean
  macd: boolean
  atr: boolean
}

interface SrZone {
  type: 'RESISTANCE' | 'SUPPORT'
  price: number
  touches: number
}

function computeSrZones(visible: CandleData[]): SrZone[] {
  if (visible.length < 8) return []
  const latestClose = visible[visible.length - 1].close
  const pivotHighs: number[] = []
  const pivotLows: number[] = []

  for (let i = 2; i < visible.length - 2; i++) {
    const c = visible[i]
    if (
      c.high >= visible[i - 1].high &&
      c.high >= visible[i - 2].high &&
      c.high >= visible[i + 1].high &&
      c.high >= visible[i + 2].high
    ) {
      pivotHighs.push(c.high)
    }
    if (
      c.low <= visible[i - 1].low &&
      c.low <= visible[i - 2].low &&
      c.low <= visible[i + 1].low &&
      c.low <= visible[i + 2].low
    ) {
      pivotLows.push(c.low)
    }
  }

  const tolerance = latestClose * 0.0045
  const clusterLevels = (levels: number[], type: 'RESISTANCE' | 'SUPPORT'): SrZone[] => {
    const clusters: { sum: number; count: number }[] = []
    for (const lvl of levels) {
      const existing = clusters.find((cl) => Math.abs(cl.sum / cl.count - lvl) <= tolerance)
      if (existing) {
        existing.sum += lvl
        existing.count += 1
      } else {
        clusters.push({ sum: lvl, count: 1 })
      }
    }

    return clusters
      .map((cl) => {
        const avgPrice = Number((cl.sum / cl.count).toFixed(2))
        // Count total bar wicks/bodies testing this zone band
        const bandTouches = visible.filter(
          (b) => b.high >= avgPrice - tolerance * 0.6 && b.low <= avgPrice + tolerance * 0.6
        ).length
        return {
          type,
          price: avgPrice,
          touches: Math.max(cl.count + 1, Math.min(bandTouches, 8)),
        }
      })
      .sort((a, b) => b.touches - a.touches)
  }

  const resCandidates = clusterLevels(
    pivotHighs.filter((p) => p >= latestClose * 0.998),
    'RESISTANCE'
  ).slice(0, 2)

  const supCandidates = clusterLevels(
    pivotLows.filter((p) => p <= latestClose * 1.002),
    'SUPPORT'
  ).slice(0, 2)

  return [...resCandidates, ...supCandidates]
}

export function ChartSimulator({
  symbol: defaultSymbol = 'BTCUSDT',
  timeframe: defaultTimeframe = '15m',
  initialBars: defaultInitialBars = 260,
  exerciseConfig,
  onTradeComplete,
  height = 480,
}: ChartSimulatorProps) {
  const symbol = exerciseConfig?.symbol || defaultSymbol
  const timeframe = exerciseConfig?.timeframe || defaultTimeframe
  const initialBars = Math.max(exerciseConfig?.setupBarIndex || defaultInitialBars, 120)

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  const entryLineRef = useRef<IPriceLine | null>(null)
  const slLineRef = useRef<IPriceLine | null>(null)
  const tp1LineRef = useRef<IPriceLine | null>(null)
  const tp2LineRef = useRef<IPriceLine | null>(null)
  const tp3LineRef = useRef<IPriceLine | null>(null)
  const srPriceLinesRef = useRef<IPriceLine[]>([])

  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [candles, setCandles] = useState<CandleData[]>([])
  const [replayIndex, setReplayIndex] = useState<number>(initialBars)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playSpeed, setPlaySpeed] = useState<number>(800)
  const [isFallback, setIsFallback] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [indicators, setIndicators] = useState<ActiveIndicators>(() => {
    const rawDefaults = (exerciseConfig?.defaultIndicators || ['EMA20', 'RSI14']).map((d) =>
      d.toLowerCase()
    )
    const hasAny = (keys: string[]) => keys.some((k) => rawDefaults.includes(k))
    return {
      srZones: true,
      ema20: hasAny(['ema20']) || rawDefaults.length === 0,
      ema50: hasAny(['ema50']),
      ema200: hasAny(['ema200']),
      bb: hasAny(['bb', 'bb20_2', 'bollinger']),
      rsi: hasAny(['rsi', 'rsi14']) || rawDefaults.length === 0,
      macd: hasAny(['macd']),
      atr: hasAny(['atr', 'atr14']),
    }
  })

  const [hudValues, setHudValues] = useState<{
    close: number
    rsi?: number
    macd?: { macd: number; signal: number; hist: number }
    atr?: number
  }>({ close: 0 })

  const [direction, setDirection] = useState<TradeDirection>(
    exerciseConfig?.suggestedDirection || 'LONG'
  )
  const [entryPrice, setEntryPrice] = useState<string>(
    exerciseConfig?.suggestedEntry ? String(exerciseConfig.suggestedEntry) : ''
  )
  const [slPrice, setSlPrice] = useState<string>(
    exerciseConfig?.suggestedSL ? String(exerciseConfig.suggestedSL) : ''
  )
  const [activeBracket, setActiveBracket] = useState<BracketSetup | null>(null)
  const [tradeState, setTradeState] = useState<ReplayTradeState | null>(null)

  const hasInitializedRangeRef = useRef<boolean>(false)
  const hasAutoStagedBracketRef = useRef<boolean>(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setErrorMessage(null)
    hasInitializedRangeRef.current = false
    hasAutoStagedBracketRef.current = false

    const bundled = bundledCandlesData as Record<string, CandleData[]>
    const base = symbol.toUpperCase().replace(/USDT$/, '')
    const fallbackList =
      bundled[`${base}_${timeframe}`] ||
      bundled[`${symbol}_${timeframe}`] ||
      bundled['BTC_15m'] ||
      []

    async function fetchCandles() {
      // For curated lesson exercises with a specific historical entry level,
      // prefer the deterministic 500-bar historical dataset so price matches the lesson setup 100%.
      if (exerciseConfig?.suggestedEntry && fallbackList.length > 0) {
        const idx = Math.min(initialBars, fallbackList.length) - 1
        const setupBar = fallbackList[Math.max(0, idx)]
        if (
          setupBar &&
          Math.abs(setupBar.close - exerciseConfig.suggestedEntry) / setupBar.close < 0.03
        ) {
          if (active) {
            setCandles(fallbackList)
            setIsFallback(true)
            setReplayIndex(Math.min(initialBars, fallbackList.length))
            setLoading(false)
          }
          return
        }
      }

      try {
        const res = await fetch(
          `/api/academy/candles?symbol=${symbol}&interval=${timeframe}&limit=500`
        )
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        const data = await res.json()

        if (active && data.candles && Array.isArray(data.candles) && data.candles.length > 0) {
          setCandles(data.candles)
          setIsFallback(Boolean(data.isFallback))
          setReplayIndex(Math.min(initialBars, data.candles.length))
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('[ChartSimulator] API fetch failed, utilizing bundled fallback:', err)
      }

      if (active) {
        if (fallbackList.length > 0) {
          setCandles(fallbackList)
          setIsFallback(true)
          setReplayIndex(Math.min(initialBars, fallbackList.length))
        } else {
          setErrorMessage('No historical candle data available.')
        }
        setLoading(false)
      }
    }

    fetchCandles()
    return () => {
      active = false
    }
  }, [symbol, timeframe, initialBars, exerciseConfig?.suggestedEntry])

  const visibleCandles = useMemo(
    () => candles.slice(0, replayIndex),
    [candles, replayIndex]
  )

  const srZones = useMemo(
    () => (indicators.srZones ? computeSrZones(visibleCandles) : []),
    [visibleCandles, indicators.srZones]
  )

  const rsiSeriesData = useMemo(
    () => (indicators.rsi ? calculateRSI(visibleCandles, 14) : []),
    [visibleCandles, indicators.rsi]
  )

  const macdSeriesData = useMemo(
    () => (indicators.macd ? calculateMACD(visibleCandles, 12, 26, 9) : []),
    [visibleCandles, indicators.macd]
  )

  const updatePriceLines = useCallback((bracket: BracketSetup | null) => {
    const series = candleSeriesRef.current
    if (!series) return

    if (entryLineRef.current) {
      series.removePriceLine(entryLineRef.current)
      entryLineRef.current = null
    }
    if (slLineRef.current) {
      series.removePriceLine(slLineRef.current)
      slLineRef.current = null
    }
    if (tp1LineRef.current) {
      series.removePriceLine(tp1LineRef.current)
      tp1LineRef.current = null
    }
    if (tp2LineRef.current) {
      series.removePriceLine(tp2LineRef.current)
      tp2LineRef.current = null
    }
    if (tp3LineRef.current) {
      series.removePriceLine(tp3LineRef.current)
      tp3LineRef.current = null
    }

    if (!bracket) return

    entryLineRef.current = series.createPriceLine({
      price: bracket.entry,
      color: '#38bdf8',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `ENTRY (${bracket.entry})`,
    })

    slLineRef.current = series.createPriceLine({
      price: bracket.sl,
      color: '#e5566f',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `SL -1.0R (${bracket.sl})`,
    })

    tp1LineRef.current = series.createPriceLine({
      price: bracket.tp1,
      color: '#3fc07a',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `TP1 +1.0R 40% (${bracket.tp1})`,
    })

    tp2LineRef.current = series.createPriceLine({
      price: bracket.tp2,
      color: '#3fc07a',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `TP2 +2.0R 35% (${bracket.tp2})`,
    })

    tp3LineRef.current = series.createPriceLine({
      price: bracket.tp3,
      color: '#247b50',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `TP3 +3.5R 25% (${bracket.tp3})`,
    })
  }, [])

  useEffect(() => {
    if (!isMounted || !containerRef.current) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const container = containerRef.current
    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#070b14' },
        textColor: '#94a3b8',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.25)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#181b2a',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.25)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#181b2a',
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 8,
        minBarSpacing: 4,
        rightOffset: 6,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: { top: 0.08, bottom: 0.20 },
      },
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#3fc07a',
      downColor: '#e5566f',
      borderVisible: true,
      borderUpColor: '#3fc07a',
      borderDownColor: '#e5566f',
      wickUpColor: '#3fc07a',
      wickDownColor: '#e5566f',
    })

    const ema20Series = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 2,
      title: 'EMA 20',
      priceLineVisible: false,
    })
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#e2a84b',
      lineWidth: 2,
      title: 'EMA 50',
      priceLineVisible: false,
    })
    const ema200Series = chart.addSeries(LineSeries, {
      color: '#cbd5e1',
      lineWidth: 2,
      title: 'EMA 200',
      priceLineVisible: false,
    })
    const bbUpperSeries = chart.addSeries(LineSeries, {
      color: 'rgba(56, 189, 248, 0.75)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB Upper',
      priceLineVisible: false,
    })
    const bbMiddleSeries = chart.addSeries(LineSeries, {
      color: 'rgba(148, 163, 184, 0.5)',
      lineWidth: 1,
      title: 'BB Mid',
      priceLineVisible: false,
    })
    const bbLowerSeries = chart.addSeries(LineSeries, {
      color: 'rgba(56, 189, 248, 0.75)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB Lower',
      priceLineVisible: false,
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries
    ema20SeriesRef.current = ema20Series
    ema50SeriesRef.current = ema50Series
    ema200SeriesRef.current = ema200Series
    bbUpperSeriesRef.current = bbUpperSeries
    bbMiddleSeriesRef.current = bbMiddleSeries
    bbLowerSeriesRef.current = bbLowerSeries

    const resizeObserver = new ResizeObserver(() => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth })
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [isMounted, height])

  useEffect(() => {
    const series = candleSeriesRef.current
    if (!series || !volumeSeriesRef.current || visibleCandles.length === 0) return

    series.setData(
      visibleCandles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    )

    volumeSeriesRef.current.setData(
      visibleCandles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume || 0,
        color:
          c.close >= c.open
            ? 'rgba(63, 192, 122, 0.25)'
            : 'rgba(229, 86, 111, 0.25)',
      }))
    )

    // Update S/R Zone Price Lines on chart (Photo 1 style!)
    for (const oldLine of srPriceLinesRef.current) {
      series.removePriceLine(oldLine)
    }
    srPriceLinesRef.current = []

    if (indicators.srZones && srZones.length > 0) {
      for (const z of srZones) {
        const isRes = z.type === 'RESISTANCE'
        const line = series.createPriceLine({
          price: z.price,
          color: isRes ? 'rgba(229, 86, 111, 0.75)' : 'rgba(63, 192, 122, 0.75)',
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `${isRes ? 'Resistance' : 'Support'} ${z.price.toLocaleString()} (${isRes ? 'R' : 'S'} ${z.touches}x)`,
        })
        srPriceLinesRef.current.push(line)
      }
    }

    if (indicators.ema20 && ema20SeriesRef.current) {
      const data = calculateEMA(visibleCandles, 20)
      ema20SeriesRef.current.setData(
        data.map((d) => ({ time: d.time as UTCTimestamp, value: d.value }))
      )
    } else if (ema20SeriesRef.current) {
      ema20SeriesRef.current.setData([])
    }

    if (indicators.ema50 && ema50SeriesRef.current) {
      const data = calculateEMA(visibleCandles, 50)
      ema50SeriesRef.current.setData(
        data.map((d) => ({ time: d.time as UTCTimestamp, value: d.value }))
      )
    } else if (ema50SeriesRef.current) {
      ema50SeriesRef.current.setData([])
    }

    if (indicators.ema200 && ema200SeriesRef.current) {
      const data = calculateEMA(visibleCandles, 200)
      ema200SeriesRef.current.setData(
        data.map((d) => ({ time: d.time as UTCTimestamp, value: d.value }))
      )
    } else if (ema200SeriesRef.current) {
      ema200SeriesRef.current.setData([])
    }

    if (indicators.bb && bbUpperSeriesRef.current && bbMiddleSeriesRef.current && bbLowerSeriesRef.current) {
      const data = calculateBollingerBands(visibleCandles, 20, 2)
      bbUpperSeriesRef.current.setData(
        data.map((d) => ({ time: d.time as UTCTimestamp, value: d.upper }))
      )
      bbMiddleSeriesRef.current.setData(
        data.map((d) => ({ time: d.time as UTCTimestamp, value: d.middle }))
      )
      bbLowerSeriesRef.current.setData(
        data.map((d) => ({ time: d.time as UTCTimestamp, value: d.lower }))
      )
    } else {
      bbUpperSeriesRef.current?.setData([])
      bbMiddleSeriesRef.current?.setData([])
      bbLowerSeriesRef.current?.setData([])
    }

    const latest = visibleCandles[visibleCandles.length - 1]
    const atrPoints = indicators.atr ? calculateATR(visibleCandles, 14) : []

    if (!hasInitializedRangeRef.current && chartRef.current && visibleCandles.length > 0) {
      hasInitializedRangeRef.current = true
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: Math.max(0, visibleCandles.length - 85),
        to: visibleCandles.length + 6,
      })
    }

    setHudValues({
      close: latest.close,
      rsi: rsiSeriesData.length > 0 ? rsiSeriesData[rsiSeriesData.length - 1].value : undefined,
      macd:
        macdSeriesData.length > 0
          ? {
              macd: macdSeriesData[macdSeriesData.length - 1].macd,
              signal: macdSeriesData[macdSeriesData.length - 1].signal,
              hist: macdSeriesData[macdSeriesData.length - 1].histogram,
            }
          : undefined,
      atr: atrPoints.length > 0 ? atrPoints[atrPoints.length - 1].value : undefined,
    })

    if (!hasAutoStagedBracketRef.current && latest) {
      hasAutoStagedBracketRef.current = true
      const cfgEntry = exerciseConfig?.suggestedEntry
      const cfgSl = exerciseConfig?.suggestedSL
      const useCfg =
        cfgEntry !== undefined &&
        cfgSl !== undefined &&
        Math.abs(latest.close - cfgEntry) / latest.close < 0.03

      const resolvedEntry = useCfg ? cfgEntry : Number(latest.close.toFixed(2))
      const resolvedSl = useCfg
        ? cfgSl
        : direction === 'LONG'
          ? Number((latest.close * 0.99).toFixed(2))
          : Number((latest.close * 1.01).toFixed(2))

      setEntryPrice(String(resolvedEntry))
      setSlPrice(String(resolvedSl))

      try {
        const bracket = calculateBrackets(direction, resolvedEntry, resolvedSl)
        setActiveBracket(bracket)
        updatePriceLines(bracket)
        setTradeState({
          isClosed: false,
          currentSl: bracket.sl,
          tp1Hit: false,
          tp2Hit: false,
          tp3Hit: false,
          exitReason: 'ACTIVE',
          realizedR: 0,
          exitCandleIndex: -1,
        })
      } catch {
        // Ignore invalid auto-stage bracket
      }
    }
  }, [
    visibleCandles,
    indicators,
    srZones,
    rsiSeriesData,
    macdSeriesData,
    direction,
    exerciseConfig?.suggestedEntry,
    exerciseConfig?.suggestedSL,
    updatePriceLines,
  ])

  useEffect(() => {
    if (!activeBracket || !tradeState || tradeState.isClosed || candles.length === 0) return

    const currentBar = candles[replayIndex - 1]
    if (!currentBar) return

    const nextState = evaluateBarOutcome(
      activeBracket,
      { high: currentBar.high, low: currentBar.low },
      tradeState,
      replayIndex - 1
    )

    if (
      nextState.isClosed !== tradeState.isClosed ||
      nextState.currentSl !== tradeState.currentSl ||
      nextState.realizedR !== tradeState.realizedR
    ) {
      setTradeState(nextState)

      if (slLineRef.current && nextState.currentSl !== tradeState.currentSl) {
        slLineRef.current.applyOptions({
          price: nextState.currentSl,
          title: `Trailed SL (${nextState.currentSl})`,
        })
      }

      if (nextState.isClosed && onTradeComplete) {
        onTradeComplete({
          rMultiple: nextState.realizedR,
          outcome: nextState.exitReason,
          exitReason: nextState.exitReason,
        })
      }
    }
  }, [candles, replayIndex, activeBracket, tradeState, onTradeComplete])

  const handleApplyBracket = useCallback(() => {
    const e = parseFloat(entryPrice)
    const s = parseFloat(slPrice)
    if (isNaN(e) || isNaN(s) || e <= 0 || s <= 0) {
      alert('Please enter valid positive numbers for Entry and Stop Loss.')
      return
    }

    try {
      const bracket = calculateBrackets(direction, e, s)
      setActiveBracket(bracket)
      updatePriceLines(bracket)

      setTradeState({
        isClosed: false,
        currentSl: bracket.sl,
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
        exitReason: 'ACTIVE',
        realizedR: 0,
        exitCandleIndex: -1,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(msg)
    }
  }, [direction, entryPrice, slPrice, updatePriceLines])

  const handleClearBracket = useCallback(() => {
    setActiveBracket(null)
    setTradeState(null)
    updatePriceLines(null)
  }, [updatePriceLines])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= candles.length) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, playSpeed)
    return () => clearInterval(interval)
  }, [isPlaying, playSpeed, candles.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying((p) => !p)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        setReplayIndex((prev) => Math.min(prev + 1, candles.length))
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        setReplayIndex((prev) => Math.max(prev - 1, 20))
      } else if (e.code === 'KeyR') {
        e.preventDefault()
        hasInitializedRangeRef.current = false
        hasAutoStagedBracketRef.current = false
        setReplayIndex(initialBars)
        setIsPlaying(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [candles.length, initialBars])

  if (!isMounted) {
    return (
      <div
        className="w-full rounded-lg bg-[#070b14] border border-[#1a2030] flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-xs text-[#64748b]">Loading chart...</span>
      </div>
    )
  }

  if (errorMessage && candles.length === 0) {
    return (
      <div
        className="w-full rounded-lg bg-[#070b14] border border-[#2c1a20] flex flex-col items-center justify-center p-6 text-center"
        style={{ height }}
      >
        <span className="text-sm text-[#e5566f] font-medium mb-1">Chart data unavailable</span>
        <span className="text-xs text-[#94a3b8] max-w-md">{errorMessage}</span>
      </div>
    )
  }

  // Prepare last 75 points for visual RSI / MACD oscillator sub-panes
  const subPaneCount = 75
  const recentRsi = rsiSeriesData.slice(-subPaneCount)
  const recentMacd = macdSeriesData.slice(-subPaneCount)

  return (
    <div data-ui className="flex flex-col rounded-lg bg-[#070b14] border border-[#1a2030] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0a0f1a] border-b border-[#1a2030] text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white text-sm">{symbol}</span>
          <span className="text-[#94a3b8]">{timeframe}</span>
          <span className="text-[#64748b]">·</span>
          {isFallback ? (
            <span
              className="text-[#cbd5e1]"
              title="Curated 500-bar historical replay dataset"
            >
              Historical replay dataset (500 bars)
            </span>
          ) : (
            <span className="text-[#3fc07a]">Live feed</span>
          )}
          {loading && <span className="text-[#64748b]">Updating...</span>}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#94a3b8] [font-variant-numeric:tabular-nums]">
          <span>
            Close <strong className="text-white font-medium">${hudValues.close.toLocaleString()}</strong>
          </span>
          {srZones.map((z, i) => (
            <span
              key={i}
              className={z.type === 'RESISTANCE' ? 'text-[#e5566f]' : 'text-[#3fc07a]'}
            >
              {z.type === 'RESISTANCE' ? 'Res' : 'Sup'}{' '}
              <strong className="font-semibold">${z.price.toLocaleString()}</strong> ({z.type === 'RESISTANCE' ? 'R' : 'S'} {z.touches}x)
            </span>
          ))}
          {hudValues.rsi !== undefined && (
            <span>
              RSI(14) <strong className="text-[#38bdf8] font-medium">{hudValues.rsi}</strong>
            </span>
          )}
          {hudValues.macd && (
            <span>
              MACD <strong className="text-[#38bdf8] font-medium">{hudValues.macd.macd}</strong> /{' '}
              <span className="text-[#e2a84b]">{hudValues.macd.signal}</span>
            </span>
          )}
          {hudValues.atr !== undefined && (
            <span>
              ATR(14) <strong className="text-white font-medium">${hudValues.atr}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#070b14] border-b border-[#1a2030] text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              hasInitializedRangeRef.current = false
              hasAutoStagedBracketRef.current = false
              setReplayIndex(initialBars)
              setIsPlaying(false)
            }}
            type="button"
            className="h-7 px-2.5 rounded border border-[#262f45] bg-[#0a0f1a] text-[#cbd5e1] hover:text-white transition-colors"
            aria-label="Reset Replay"
          >
            Reset
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            type="button"
            className={`h-7 px-3 rounded font-medium border transition-colors ${
              isPlaying
                ? 'border-[#ff2e54] bg-[#141b29] text-white'
                : 'border-[#262f45] bg-white text-[#070b14] hover:bg-[#e2e8f0]'
            }`}
            aria-label={isPlaying ? 'Pause Replay' : 'Play Replay'}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => setReplayIndex((prev) => Math.min(prev + 1, candles.length))}
            disabled={replayIndex >= candles.length}
            type="button"
            className="h-7 px-2.5 rounded border border-[#262f45] bg-[#0a0f1a] text-[#cbd5e1] hover:text-white disabled:opacity-40 transition-colors"
            aria-label="Next Bar"
          >
            Next bar
          </button>

          <div className="flex items-center gap-1 ml-2 pl-3 border-l border-[#1a2030] [font-variant-numeric:tabular-nums]">
            {[1500, 800, 300].map((ms, idx) => (
              <button
                key={ms}
                type="button"
                onClick={() => setPlaySpeed(ms)}
                className={`px-1.5 py-0.5 text-xs transition-colors ${
                  playSpeed === ms
                    ? 'border-b border-[#ff2e54] text-white font-medium'
                    : 'text-[#64748b] hover:text-[#cbd5e1]'
                }`}
              >
                {idx === 0 ? '1x' : idx === 1 ? '2x' : '5x'}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#64748b] pl-2 [font-variant-numeric:tabular-nums]">
            Bar <span className="text-[#cbd5e1]">{replayIndex}</span> of {candles.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(
            ['srZones', 'ema20', 'ema50', 'ema200', 'bb', 'rsi', 'macd', 'atr'] as const
          ).map((key) => {
            const labels: Record<string, string> = {
              srZones: 'S/R Zones',
              ema20: 'EMA 20',
              ema50: 'EMA 50',
              ema200: 'EMA 200',
              bb: 'Bollinger',
              rsi: 'RSI 14',
              macd: 'MACD',
              atr: 'ATR 14',
            }
            const active = indicators[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIndicators((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`py-1 text-xs transition-colors ${
                  active
                    ? 'border-b border-[#ff2e54] text-white font-medium'
                    : 'text-[#64748b] hover:text-[#cbd5e1]'
                }`}
                aria-pressed={active}
              >
                {labels[key]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative w-full" style={{ height }}>
        <div ref={containerRef} className="w-full h-full" />

        {indicators.srZones && srZones.length > 0 && (
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 pointer-events-none [font-variant-numeric:tabular-nums]">
            {srZones.map((z, idx) => {
              const isRes = z.type === 'RESISTANCE'
              return (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded border text-[11px] font-medium flex items-center gap-1.5 ${
                    isRes
                      ? 'bg-[#2c1620]/90 border-[#e5566f]/50 text-[#fda4af]'
                      : 'bg-[#122b20]/90 border-[#3fc07a]/50 text-[#86efac]'
                  }`}
                >
                  <span>
                    {isRes ? 'Resistance' : 'Support'} {z.price.toLocaleString()}
                  </span>
                  <span className="px-1 rounded bg-[#070b14]/70 text-white font-semibold">
                    {isRes ? 'R' : 'S'} {z.touches}x
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {tradeState && (
          <div className="absolute top-3 right-20 z-10 flex flex-col gap-1.5 items-end [font-variant-numeric:tabular-nums]">
            <div
              className={`px-3 py-1.5 rounded border flex items-center gap-2 text-xs ${
                tradeState.isClosed
                  ? tradeState.realizedR > 0
                    ? 'bg-[#172a1d] text-[#3fc07a] border-[#3fc07a]/40'
                    : 'bg-[#2c1a20] text-[#e5566f] border-[#e5566f]/40'
                  : 'bg-[#0a0f1a] text-white border-[#262f45]'
              }`}
            >
              <span className="font-medium">{tradeState.exitReason}</span>
              <span className="font-semibold">
                {tradeState.realizedR > 0 ? `+${tradeState.realizedR}R` : `${tradeState.realizedR}R`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] bg-[#0a0f1a] border border-[#1a2030] rounded px-2 py-1">
              <span className={tradeState.tp1Hit ? 'text-[#3fc07a]' : 'text-[#64748b]'}>
                TP1 40% @ 1.0R
              </span>
              <span className="text-[#262f45]">·</span>
              <span className={tradeState.tp2Hit ? 'text-[#3fc07a]' : 'text-[#64748b]'}>
                TP2 35% @ 2.0R
              </span>
              <span className="text-[#262f45]">·</span>
              <span className={tradeState.tp3Hit ? 'text-[#3fc07a]' : 'text-[#64748b]'}>
                TP3 25% @ 3.5R
              </span>
            </div>
          </div>
        )}
      </div>

      {indicators.rsi && recentRsi.length > 1 && (
        <div className="border-t border-[#1a2030] bg-[#070b14] px-4 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8] mb-1.5 [font-variant-numeric:tabular-nums]">
            <span className="font-medium text-white">RSI (14) Momentum Oscillator Sub-Pane (75 bars)</span>
            <div className="flex items-center gap-3">
              <span className="text-[#e5566f]">Overbought 70</span>
              <span className="text-[#94a3b8]">Midline 50</span>
              <span className="text-[#3fc07a]">Oversold 30</span>
              <span className="text-[#38bdf8] font-semibold">
                Current: {recentRsi[recentRsi.length - 1].value}
              </span>
            </div>
          </div>
          <svg viewBox="0 0 780 92" className="w-full h-24 select-none" role="img" aria-label="RSI 14 Sub-Pane">
            <rect x="0" y="18" width="740" height="52" fill="#1e293b" fillOpacity="0.28" />
            <line x1="0" y1="18" x2="740" y2="18" stroke="#e5566f" strokeDasharray="3 3" strokeWidth="0.9" />
            <line x1="0" y1="44" x2="740" y2="44" stroke="#475569" strokeDasharray="2 2" strokeWidth="0.8" />
            <line x1="0" y1="70" x2="740" y2="70" stroke="#3fc07a" strokeDasharray="3 3" strokeWidth="0.9" />
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.0"
              points={recentRsi
                .map((pt, idx) => {
                  const x = (idx / Math.max(recentRsi.length - 1, 1)) * 735
                  const y = 84 - (Math.min(Math.max(pt.value, 5), 95) / 100) * 76
                  return `${x.toFixed(1)},${y.toFixed(1)}`
                })
                .join(' ')}
            />
            <text x="746" y="21" fill="#e5566f" fontSize="10" fontWeight="600">
              70
            </text>
            <text x="746" y="47" fill="#64748b" fontSize="9.5">
              50
            </text>
            <text x="746" y="73" fill="#3fc07a" fontSize="10" fontWeight="600">
              30
            </text>
          </svg>
        </div>
      )}

      {indicators.macd && recentMacd.length > 1 && (
        <div className="border-t border-[#1a2030] bg-[#070b14] px-4 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8] mb-1.5 [font-variant-numeric:tabular-nums]">
            <span className="font-medium text-white">MACD (12, 26, 9) Momentum Sub-Pane (75 bars)</span>
            <div className="flex items-center gap-3">
              <span className="text-[#38bdf8]">
                MACD: {recentMacd[recentMacd.length - 1].macd}
              </span>
              <span className="text-[#e2a84b]">
                Signal: {recentMacd[recentMacd.length - 1].signal}
              </span>
              <span
                className={
                  recentMacd[recentMacd.length - 1].histogram >= 0
                    ? 'text-[#3fc07a] font-semibold'
                    : 'text-[#e5566f] font-semibold'
                }
              >
                Hist: {recentMacd[recentMacd.length - 1].histogram}
              </span>
            </div>
          </div>
          {(() => {
            const maxAbs = Math.max(
              ...recentMacd.map((m) =>
                Math.max(Math.abs(m.macd), Math.abs(m.signal), Math.abs(m.histogram), 1)
              )
            )
            const zeroY = 46
            const toY = (v: number) => zeroY - (v / maxAbs) * 36
            const stepW = 735 / Math.max(recentMacd.length, 1)
            return (
              <svg viewBox="0 0 780 92" className="w-full h-24 select-none" role="img" aria-label="MACD Sub-Pane">
                <line x1="0" y1={zeroY} x2="740" y2={zeroY} stroke="#475569" strokeDasharray="3 3" strokeWidth="0.9" />
                {recentMacd.map((m, idx) => {
                  const x = idx * stepW + 1.5
                  const yVal = toY(m.histogram)
                  const top = Math.min(zeroY, yVal)
                  const bh = Math.max(Math.abs(zeroY - yVal), 1.5)
                  return (
                    <rect
                      key={idx}
                      x={x}
                      y={top}
                      width={Math.max(stepW - 2.2, 2.5)}
                      height={bh}
                      fill={m.histogram >= 0 ? '#3fc07a' : '#e5566f'}
                      fillOpacity="0.6"
                    />
                  )
                })}
                <polyline
                  fill="none"
                  stroke="#e2a84b"
                  strokeWidth="1.6"
                  points={recentMacd
                    .map((m, idx) => `${(idx * stepW + stepW / 2).toFixed(1)},${toY(m.signal).toFixed(1)}`)
                    .join(' ')}
                />
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.9"
                  points={recentMacd
                    .map((m, idx) => `${(idx * stepW + stepW / 2).toFixed(1)},${toY(m.macd).toFixed(1)}`)
                    .join(' ')}
                />
                <text x="746" y={zeroY + 3} fill="#94a3b8" fontSize="10">
                  0.0
                </text>
              </svg>
            )
          })()}
        </div>
      )}

      {activeBracket && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1a2030] border-t border-[#1a2030] bg-[#080d18] text-xs [font-variant-numeric:tabular-nums]">
          <div className="px-3.5 py-2.5 space-y-0.5">
            <span className="block text-[11px] font-semibold text-white">1. Staged Setup Direction</span>
            <span className="block text-[#94a3b8]">
              <strong className={direction === 'LONG' ? 'text-[#3fc07a]' : 'text-[#e5566f]'}>
                {direction}
              </strong>{' '}
              setup on {symbol} ({timeframe})
            </span>
          </div>
          <div className="px-3.5 py-2.5 space-y-0.5">
            <span className="block text-[11px] font-semibold text-[#38bdf8]">2. Where to Enter (Cyan Line)</span>
            <span className="block text-[#cbd5e1]">
              Entry at <strong>${activeBracket.entry.toLocaleString()}</strong> on bar #{replayIndex} close
            </span>
          </div>
          <div className="px-3.5 py-2.5 space-y-0.5">
            <span className="block text-[11px] font-semibold text-[#e5566f]">3. Stop-Loss Invalidation (-1.0R)</span>
            <span className="block text-[#cbd5e1]">
              SL at <strong>${activeBracket.sl.toLocaleString()}</strong> (1R risk = ${activeBracket.risk.toFixed(2)})
            </span>
          </div>
          <div className="px-3.5 py-2.5 space-y-0.5">
            <span className="block text-[11px] font-semibold text-[#3fc07a]">4. Scale-Out Targets (+{FULL_TP3_R_MULTIPLE}R)</span>
            <span className="block text-[#cbd5e1]">
              TP1 ${activeBracket.tp1.toLocaleString()} · TP2 ${activeBracket.tp2.toLocaleString()} · TP3 ${activeBracket.tp3.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0a0f1a] border-t border-[#1a2030] text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 border-r border-[#1a2030] pr-3">
            <button
              type="button"
              onClick={() => setDirection('LONG')}
              className={`py-1 text-xs transition-colors ${
                direction === 'LONG'
                  ? 'border-b border-[#3fc07a] text-[#3fc07a] font-semibold'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => setDirection('SHORT')}
              className={`py-1 text-xs transition-colors ${
                direction === 'SHORT'
                  ? 'border-b border-[#e5566f] text-[#e5566f] font-semibold'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              Short
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="bracket-entry" className="text-[#94a3b8]">
              Entry
            </label>
            <input
              id="bracket-entry"
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="h-7 w-24 px-2 rounded bg-[#070b14] border border-[#262f45] text-white text-xs [font-variant-numeric:tabular-nums] focus:outline-none focus:border-[#ff2e54]"
              placeholder="Entry"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="bracket-sl" className="text-[#94a3b8]">
              Stop loss
            </label>
            <input
              id="bracket-sl"
              type="number"
              step="any"
              value={slPrice}
              onChange={(e) => setSlPrice(e.target.value)}
              className="h-7 w-24 px-2 rounded bg-[#070b14] border border-[#262f45] text-white text-xs [font-variant-numeric:tabular-nums] focus:outline-none focus:border-[#ff2e54]"
              placeholder="Stop loss"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyBracket}
            className="h-7 px-3 rounded bg-white hover:bg-[#e2e8f0] text-[#070b14] font-medium transition-colors"
          >
            Place bracket
          </button>
          {activeBracket && (
            <button
              type="button"
              onClick={handleClearBracket}
              className="h-7 px-2.5 rounded border border-[#262f45] bg-[#070b14] hover:bg-[#141b29] text-[#cbd5e1] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <span className="text-xs text-[#94a3b8]">
          Click <strong className="text-white font-medium">Play</strong> or{' '}
          <strong className="text-white font-medium">Next bar</strong> to step the chart forward and test the bracket
        </span>
      </div>
    </div>
  )
}

export default ChartSimulator
