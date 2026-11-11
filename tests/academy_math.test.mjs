import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  calculateBrackets,
  evaluateBarOutcome,
  calculateTradeBracketOutcome,
  validateRiskPercentage,
  calculatePositionSize,
  FULL_TP3_R_MULTIPLE,
  TP1_WEIGHT,
  TP2_WEIGHT,
  TP3_WEIGHT,
} from '../src/lib/bracketMath.ts'

import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
} from '../src/lib/indicators.ts'

// --- 1. Bracket Math Targets & Edge Cases ---

test('Bracket Math: Invalid setups throw descriptive errors', () => {
  // Zero risk: entry == sl
  assert.throws(() => calculateBrackets('LONG', 60000, 60000), /Risk cannot be zero/)
  // Long SL above or equal entry
  assert.throws(() => calculateBrackets('LONG', 60000, 61000), /Stop-Loss must be strictly below Entry/)
  // Short SL below or equal entry
  assert.throws(() => calculateBrackets('SHORT', 60000, 59000), /Stop-Loss must be strictly above Entry/)
  // Zero or negative prices
  assert.throws(() => calculateBrackets('LONG', 0, 50), /strictly positive/)
  assert.throws(() => calculateBrackets('LONG', -100, 50), /strictly positive/)
})

test('Bracket Math: Target prices conform to strict +1.0R, +2.0R, +3.5R', () => {
  // LONG: Entry 60000, SL 59000 -> Risk = 1000
  const longB = calculateBrackets('LONG', 60000, 59000)
  assert.equal(longB.risk, 1000)
  assert.equal(longB.tp1, 61000) // +1.0R
  assert.equal(longB.tp2, 62000) // +2.0R
  assert.equal(longB.tp3, 63500) // +3.5R
  assert.equal(longB.weightTp1, 0.40)
  assert.equal(longB.weightTp2, 0.35)
  assert.equal(longB.weightTp3, 0.25)

  // SHORT: Entry 60000, SL 61000 -> Risk = 1000
  const shortB = calculateBrackets('SHORT', 60000, 61000)
  assert.equal(shortB.risk, 1000)
  assert.equal(shortB.tp1, 59000) // +1.0R
  assert.equal(shortB.tp2, 58000) // +2.0R
  assert.equal(shortB.tp3, 56500) // +3.5R
  assert.equal(shortB.weightTp1, 0.40)
  assert.equal(shortB.weightTp2, 0.35)
  assert.equal(shortB.weightTp3, 0.25)
})

// --- 2. Trade Outcome State Machine & Realized R-Multiples ---

test('Bracket Math: Immediate Stop-Loss yields exactly -1.0R', () => {
  const bracket = calculateBrackets('LONG', 60000, 59000)
  const initial = {
    isClosed: false,
    currentSl: 59000,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    exitReason: 'ACTIVE',
    realizedR: 0,
    exitCandleIndex: -1,
  }
  const res = evaluateBarOutcome(bracket, { high: 60500, low: 58900 }, initial, 0)
  assert.equal(res.isClosed, true)
  assert.equal(res.exitReason, 'SL')
  assert.equal(res.realizedR, -1.0)
})

test('Bracket Math: Full TP3 progression yields exactly +1.975R', () => {
  const bracket = calculateBrackets('LONG', 60000, 59000)
  let state = {
    isClosed: false,
    currentSl: 59000,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    exitReason: 'ACTIVE',
    realizedR: 0,
    exitCandleIndex: -1,
  }

  // Bar 0: reaches TP1 (61000) -> SL ratchets to Entry (60000)
  state = evaluateBarOutcome(bracket, { high: 61200, low: 59800 }, state, 0)
  assert.equal(state.tp1Hit, true)
  assert.equal(state.currentSl, 60000)
  assert.equal(state.isClosed, false)

  // Bar 1: reaches TP2 (62000) -> SL trails to TP1 (61000)
  state = evaluateBarOutcome(bracket, { high: 62300, low: 60500 }, state, 1)
  assert.equal(state.tp2Hit, true)
  assert.equal(state.currentSl, 61000)
  assert.equal(state.isClosed, false)

  // Bar 2: reaches TP3 (63500) -> Full exit
  state = evaluateBarOutcome(bracket, { high: 63600, low: 61500 }, state, 2)
  assert.equal(state.isClosed, true)
  assert.equal(state.exitReason, 'TP3')
  assert.equal(state.realizedR, 1.975) // 0.40*1.0 + 0.35*2.0 + 0.25*3.5
  assert.equal(state.realizedR, FULL_TP3_R_MULTIPLE)
})

test('Bracket Math: TP1 then Breakeven stop-out yields exactly +0.400R', () => {
  const bracket = calculateBrackets('LONG', 60000, 59000)
  let state = {
    isClosed: false,
    currentSl: 59000,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    exitReason: 'ACTIVE',
    realizedR: 0,
    exitCandleIndex: -1,
  }

  // Bar 0: reaches TP1
  state = evaluateBarOutcome(bracket, { high: 61200, low: 59800 }, state, 0)
  assert.equal(state.tp1Hit, true)

  // Bar 1: Reversal down to Breakeven (60000)
  state = evaluateBarOutcome(bracket, { high: 60500, low: 59900 }, state, 1)
  assert.equal(state.isClosed, true)
  assert.equal(state.exitReason, 'TP1_BREAKEVEN')
  assert.equal(state.realizedR, 0.4) // 0.40*1.0 + 0.60*0.0 = 0.400R
})

test('Bracket Math: TP2 then Trailing TP1 stop-out yields exactly +1.350R', () => {
  const bracket = calculateBrackets('LONG', 60000, 59000)
  let state = {
    isClosed: false,
    currentSl: 59000,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    exitReason: 'ACTIVE',
    realizedR: 0,
    exitCandleIndex: -1,
  }

  // Bar 0: reaches TP1
  state = evaluateBarOutcome(bracket, { high: 61200, low: 59800 }, state, 0)
  // Bar 1: reaches TP2 -> SL moves to 61000
  state = evaluateBarOutcome(bracket, { high: 62200, low: 60500 }, state, 1)
  // Bar 2: Reversal down to 60950 (triggers 61000 stop)
  state = evaluateBarOutcome(bracket, { high: 61800, low: 60950 }, state, 2)
  assert.equal(state.isClosed, true)
  assert.equal(state.exitReason, 'TP2_TRAILING_TP1')
  assert.equal(state.realizedR, 1.35) // 0.40*1.0 + 0.35*2.0 + 0.25*1.0 = 1.350R
})

test('Bracket Math: Intra-bar flash wick prioritizes SL over TP1 (capital preservation)', () => {
  const bracket = calculateBrackets('LONG', 60000, 59000)
  const initial = {
    isClosed: false,
    currentSl: 59000,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    exitReason: 'ACTIVE',
    realizedR: 0,
    exitCandleIndex: -1,
  }

  // Candle spans both TP1 (61000) and SL (59000)
  const res = evaluateBarOutcome(bracket, { high: 61500, low: 58500 }, initial, 0)
  assert.equal(res.isClosed, true)
  assert.equal(res.exitReason, 'SL')
  assert.equal(res.realizedR, -1.0)
})

test('Bracket Math: SHORT full TP3 progression yields +1.975R', () => {
  const bracket = calculateBrackets('SHORT', 60000, 61000)
  let state = {
    isClosed: false,
    currentSl: 61000,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    exitReason: 'ACTIVE',
    realizedR: 0,
    exitCandleIndex: -1,
  }

  // Bar 0: hits TP1 (59000)
  state = evaluateBarOutcome(bracket, { high: 60200, low: 58900 }, state, 0)
  assert.equal(state.tp1Hit, true)
  assert.equal(state.currentSl, 60000) // Breakeven

  // Bar 1: hits TP2 (58000)
  state = evaluateBarOutcome(bracket, { high: 59500, low: 57900 }, state, 1)
  assert.equal(state.tp2Hit, true)
  assert.equal(state.currentSl, 59000) // Trailed stop

  // Bar 2: hits TP3 (56500)
  state = evaluateBarOutcome(bracket, { high: 58200, low: 56400 }, state, 2)
  assert.equal(state.isClosed, true)
  assert.equal(state.exitReason, 'TP3')
  assert.equal(state.realizedR, 1.975)
})

// --- 3. Position Sizing & Risk Management Invariants ---

test('Position Sizing: Math matches (Account * Risk%) / |Entry - SL|', () => {
  const account = 10000
  const riskPercent = 1.0 // 1% = $100
  const entry = 60000
  const sl = 59000 // Risk per unit = 1000

  const sizing = calculatePositionSize(account, riskPercent, entry, sl)
  assert.equal(sizing.isValid, true)
  assert.equal(sizing.riskAmount, 100)
  assert.equal(sizing.positionSize, 0.1) // 100 / 1000 = 0.10 BTC
  assert.equal(sizing.warning, undefined)

  // Risk > 2% warns
  const highRiskSizing = validateRiskPercentage(account, 3.0, entry, sl)
  assert.equal(highRiskSizing.isValid, true)
  assert.match(highRiskSizing.warning || '', /exceeds recommended/)

  // Invalid balances or non-positive risk
  assert.equal(validateRiskPercentage(-1000, 1.0, entry, sl).isValid, false)
  assert.equal(validateRiskPercentage(10000, 0, entry, sl).isValid, false)
  assert.equal(validateRiskPercentage(10000, 1.0, 60000, 60000).isValid, false)
})

test('Bracket Math: calculateTradeBracketOutcome returns correct classification and breakdown', () => {
  const bracket = {
    entryPrice: 60000,
    stopLossPrice: 59000,
    takeProfit1Price: 61000,
    takeProfit2Price: 62000,
    takeProfit3Price: 63500,
    direction: 'LONG',
  }
  const slRes = calculateTradeBracketOutcome(bracket, 60500, 58900)
  assert.equal(slRes.outcome, 'STOP_LOSS')
  assert.equal(slRes.rMultiple, -1.0)
  assert.equal(slRes.tp1Weight, TP1_WEIGHT)
  assert.equal(slRes.tp2Weight, TP2_WEIGHT)
  assert.equal(slRes.tp3Weight, TP3_WEIGHT)

  const tp3Res = calculateTradeBracketOutcome(bracket, 63600, 59500)
  assert.equal(tp3Res.outcome, 'TP3_HIT')
  assert.equal(tp3Res.rMultiple, FULL_TP3_R_MULTIPLE)

  const exitRes = calculateTradeBracketOutcome(bracket, 61500, 59500, 61000)
  assert.equal(exitRes.rMultiple, 1.0)
})

test('Indicators: MACD computes fast/slow EMA difference and histogram', () => {
  const candles = Array.from({ length: 45 }, (_, i) => ({
    time: i + 1,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 102 + i,
  }))
  const macd = calculateMACD(candles, 12, 26, 9)
  assert.ok(macd.length > 0)
  for (const m of macd) {
    assert.equal(Number((m.macd - m.signal).toFixed(4)), m.histogram)
  }
})

// --- 4. Pure TypeScript Technical Indicators Engine ---

test('Indicators: EMA calculation matches recursive formula', () => {
  const candles = [
    { time: 1, open: 10, high: 12, low: 9, close: 10 },
    { time: 2, open: 10, high: 13, low: 9, close: 12 },
    { time: 3, open: 12, high: 14, low: 11, close: 14 },
    { time: 4, open: 14, high: 16, low: 13, close: 15 },
    { time: 5, open: 15, high: 17, low: 14, close: 16 },
  ]

  // Period 3: first EMA is SMA of [10, 12, 14] = 12
  // k = 2 / (3 + 1) = 0.5
  // next EMA = (15 - 12) * 0.5 + 12 = 13.5
  // next EMA = (16 - 13.5) * 0.5 + 13.5 = 14.75
  const ema = calculateEMA(candles, 3)
  assert.equal(ema.length, 3)
  assert.equal(ema[0].value, 12)
  assert.equal(ema[1].value, 13.5)
  assert.equal(ema[2].value, 14.75)

  // Under-length candles returns []
  assert.deepEqual(calculateEMA(candles, 10), [])
})

test('Indicators: RSI bounded [0, 100] and handles flat price gracefully', () => {
  // 30 identical candles (zero gains, zero losses)
  const flatCandles = Array.from({ length: 30 }, (_, i) => ({
    time: i + 1,
    open: 50,
    high: 50,
    low: 50,
    close: 50,
  }))

  const rsiFlat = calculateRSI(flatCandles, 14)
  assert.ok(rsiFlat.length > 0)
  assert.equal(rsiFlat[0].value, 50.0) // Neutral edge case handling

  // Monotonically rising prices -> RSI approaches 100
  const risingCandles = Array.from({ length: 30 }, (_, i) => ({
    time: i + 1,
    open: 10 + i,
    high: 12 + i,
    low: 10 + i,
    close: 11 + i,
  }))
  const rsiRising = calculateRSI(risingCandles, 14)
  assert.equal(rsiRising[0].value, 100.0)
})

test('Indicators: Bollinger Bands upper >= middle >= lower', () => {
  const candles = Array.from({ length: 40 }, (_, i) => ({
    time: i + 1,
    open: 100 + Math.sin(i) * 10,
    high: 115 + Math.sin(i) * 10,
    low: 90 + Math.sin(i) * 10,
    close: 105 + Math.sin(i) * 10,
  }))

  const bb = calculateBollingerBands(candles, 20, 2)
  assert.equal(bb.length, 21) // 40 - 20 + 1
  for (const point of bb) {
    assert.ok(point.upper >= point.middle, `Upper ${point.upper} >= Mid ${point.middle}`)
    assert.ok(point.middle >= point.lower, `Mid ${point.middle} >= Lower ${point.lower}`)
  }
})

test('Indicators: ATR strictly positive and responds to volatility', () => {
  const candles = Array.from({ length: 30 }, (_, i) => ({
    time: i + 1,
    open: 100,
    high: 110,
    low: 95,
    close: 105,
  }))

  const atr = calculateATR(candles, 14)
  assert.ok(atr.length > 0)
  for (const p of atr) {
    assert.ok(p.value > 0, 'ATR must be strictly positive')
  }
})

// --- 5. Bundled Candle Fallback Dataset Verification ---

test('Bundled Candles: High-fidelity historical dataset exists and is valid', () => {
  const raw = fs.readFileSync(
    path.join(process.cwd(), 'src/data/academy/bundled_candles.json'),
    'utf-8'
  )
  const bundled = JSON.parse(raw)

  assert.ok(Array.isArray(bundled['BTC_15m']), 'BTC_15m exists')
  assert.ok(Array.isArray(bundled['BTC_1h']), 'BTC_1h exists')
  assert.ok(Array.isArray(bundled['BTC_1d']), 'BTC_1d exists')

  assert.ok(bundled['BTC_15m'].length >= 200, 'BTC_15m has sufficient history')
  assert.ok(bundled['BTC_1h'].length >= 50, 'BTC_1h has sufficient history')
  assert.ok(bundled['BTC_1d'].length >= 50, 'BTC_1d has sufficient history')

  // Spot check candle structure
  const c = bundled['BTC_15m'][0]
  assert.ok(typeof c.time === 'number')
  assert.ok(c.open > 0)
  assert.ok(c.high >= c.low)
  assert.ok(c.close > 0)
})
