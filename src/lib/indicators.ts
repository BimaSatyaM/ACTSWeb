// Pure TypeScript Technical Indicators Engine
// Zero-dependency O(N) calculations for TradingView lightweight-charts
// Conforms to PROJECT.md § Interface Contracts

import type { CandleData, IndicatorPoint, BollingerBandsPoint, MACDPoint } from '../types/academy'

// 1. Exponential Moving Average (EMA)
// Formula: EMA_t = Close_t * k + EMA_(t-1) * (1 - k), where k = 2 / (period + 1)
export function calculateEMA(data: CandleData[], period: number): IndicatorPoint[] {
  if (!data || data.length < period || period <= 0) return []

  const k = 2 / (period + 1)
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i].close
  }
  let ema = sum / period

  const result: IndicatorPoint[] = [
    { time: data[period - 1].time, value: Number(ema.toFixed(4)) },
  ]

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * k + ema
    result.push({ time: data[i].time, value: Number(ema.toFixed(4)) })
  }

  return result
}

// 2. Relative Strength Index (RSI) using Wilder's RMA (14 period default)
export function calculateRSI(data: CandleData[], period = 14): IndicatorPoint[] {
  if (!data || data.length <= period || period <= 0) return []

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close
    if (diff > 0) gains += diff
    else losses += Math.abs(diff)
  }

  let avgGain = gains / period
  let avgLoss = losses / period
  const result: IndicatorPoint[] = []

  const computeValue = (ag: number, al: number): number => {
    if (al === 0 && ag === 0) return 50.0 // Flat price action edge case
    if (al === 0) return 100.0
    if (ag === 0) return 0.0
    const rs = ag / al
    return Number((100 - 100 / (1 + rs)).toFixed(2))
  }

  result.push({ time: data[period].time, value: computeValue(avgGain, avgLoss) })

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? Math.abs(diff) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    result.push({ time: data[i].time, value: computeValue(avgGain, avgLoss) })
  }

  return result
}

// 3. Moving Average Convergence Divergence (MACD 12, 26, 9)
export function calculateMACD(
  data: CandleData[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDPoint[] {
  if (!data || data.length < slowPeriod + signalPeriod || fastPeriod >= slowPeriod) {
    return []
  }

  const fastK = 2 / (fastPeriod + 1)
  const slowK = 2 / (slowPeriod + 1)

  let fastSum = 0
  for (let i = 0; i < fastPeriod; i++) {
    fastSum += data[i].close
  }
  let fastEMA = fastSum / fastPeriod

  for (let i = fastPeriod; i < slowPeriod; i++) {
    fastEMA = (data[i].close - fastEMA) * fastK + fastEMA
  }

  let slowSum = 0
  for (let i = 0; i < slowPeriod; i++) {
    slowSum += data[i].close
  }
  let slowEMA = slowSum / slowPeriod

  const macdValues: { time: number | string; val: number }[] = []
  for (let i = slowPeriod; i < data.length; i++) {
    fastEMA = (data[i].close - fastEMA) * fastK + fastEMA
    slowEMA = (data[i].close - slowEMA) * slowK + slowEMA
    macdValues.push({ time: data[i].time, val: fastEMA - slowEMA })
  }

  if (macdValues.length < signalPeriod) return []

  const signalK = 2 / (signalPeriod + 1)
  let sigSum = 0
  for (let i = 0; i < signalPeriod; i++) {
    sigSum += macdValues[i].val
  }
  let signalEMA = sigSum / signalPeriod

  const result: MACDPoint[] = []

  for (let i = signalPeriod - 1; i < macdValues.length; i++) {
    if (i >= signalPeriod) {
      signalEMA = (macdValues[i].val - signalEMA) * signalK + signalEMA
    }
    const t = macdValues[i].time
    const m = macdValues[i].val
    const s = signalEMA
    result.push({
      time: t,
      macd: Number(m.toFixed(4)),
      signal: Number(s.toFixed(4)),
      histogram: Number((m - s).toFixed(4)),
    })
  }

  return result
}

// 4. Bollinger Bands (20 period, 2 standard deviations)
export function calculateBollingerBands(
  data: CandleData[],
  period = 20,
  stdDevMultiplier = 2
): BollingerBandsPoint[] {
  if (!data || data.length < period || period <= 0) return []

  const result: BollingerBandsPoint[] = []

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close
    }
    const mean = sum / period

    let varianceSum = 0
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(data[j].close - mean, 2)
    }
    const stdDev = Math.sqrt(varianceSum / period)

    result.push({
      time: data[i].time,
      upper: Number((mean + stdDevMultiplier * stdDev).toFixed(4)),
      middle: Number(mean.toFixed(4)),
      lower: Number((mean - stdDevMultiplier * stdDev).toFixed(4)),
    })
  }

  return result
}

// 5. Average True Range (ATR 14) with Wilder's RMA
export function calculateATR(data: CandleData[], period = 14): IndicatorPoint[] {
  if (!data || data.length <= period || period <= 0) return []

  const tr: number[] = [data[0].high - data[0].low]
  for (let i = 1; i < data.length; i++) {
    const hl = data[i].high - data[i].low
    const hc = Math.abs(data[i].high - data[i - 1].close)
    const lc = Math.abs(data[i].low - data[i - 1].close)
    tr.push(Math.max(hl, hc, lc))
  }

  let atrSum = 0
  for (let i = 0; i < period; i++) {
    atrSum += tr[i]
  }
  let atr = atrSum / period

  const result: IndicatorPoint[] = [
    { time: data[period].time, value: Number(atr.toFixed(4)) },
  ]

  for (let i = period + 1; i < data.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period
    result.push({ time: data[i].time, value: Number(atr.toFixed(4)) })
  }

  return result
}

// Aliases for compatibility
export const computeEMA = calculateEMA
export const computeRSI = calculateRSI
export const computeMACD = calculateMACD
export const computeBollingerBands = calculateBollingerBands
export const computeATR = calculateATR
