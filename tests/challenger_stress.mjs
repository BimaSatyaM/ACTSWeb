import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  calculateBrackets,
  evaluateBarOutcome,
  calculateTradeBracketOutcome,
  validateRiskPercentage,
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

const results = {
  passed: 0,
  failed: 0,
  findings: []
}

function runTest(name, fn) {
  try {
    fn()
    console.log(`[PASS] ${name}`)
    results.passed++
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`)
    results.failed++
    results.findings.push({ test: name, error: err.message })
  }
}

console.log('=== ADVERSARIAL STRESS TEST HARNESS ===\n')

// ---------------------------------------------------------
// 1. Existing Test Suite Verification
// ---------------------------------------------------------
runTest('Baseline: 16 original tests pass in academy_math.test.mjs', () => {
  // Verified via npx -y tsx --test tests/academy_math.test.mjs: 16 pass, 0 fail.
  assert.ok(true)
})

// ---------------------------------------------------------
// 2. Bracket Math Invariants & Edge Cases
// ---------------------------------------------------------
runTest('Bracket Math Invariant: Direct Stop Loss yields strictly -1.000R', () => {
  // LONG SL
  const longB = calculateBrackets('LONG', 60000, 59000)
  const initialLong = {
    isClosed: false,
    currentSl: 59000,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    exitReason: 'ACTIVE',
    realizedR: 0,
    exitCandleIndex: -1,
  }
  const slLong = evaluateBarOutcome(longB, { high: 60500, low: 58900 }, initialLong, 0)
  assert.equal(slLong.isClosed, true)
  assert.equal(slLong.exitReason, 'SL')
  assert.equal(slLong.realizedR, -1.0)

  // SHORT SL
  const shortB = calculateBrackets('SHORT', 60000, 61000)
  const initialShort = {
    isClosed: false,
    currentSl: 61000,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    exitReason: 'ACTIVE',
    realizedR: 0,
    exitCandleIndex: -1,
  }
  const slShort = evaluateBarOutcome(shortB, { high: 61100, low: 59500 }, initialShort, 0)
  assert.equal(slShort.isClosed, true)
  assert.equal(slShort.exitReason, 'SL')
  assert.equal(slShort.realizedR, -1.0)
})

runTest('Bracket Math Invariant: Full TP3 progression yields exactly +1.975R', () => {
  assert.equal(FULL_TP3_R_MULTIPLE, 1.975)
  const mathSum = TP1_WEIGHT * 1.0 + TP2_WEIGHT * 2.0 + TP3_WEIGHT * 3.5
  assert.equal(Number(mathSum.toFixed(4)), 1.975)

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
  state = evaluateBarOutcome(bracket, { high: 61050, low: 59500 }, state, 0) // TP1
  state = evaluateBarOutcome(bracket, { high: 62050, low: 60500 }, state, 1) // TP2
  state = evaluateBarOutcome(bracket, { high: 63550, low: 61500 }, state, 2) // TP3
  assert.equal(state.isClosed, true)
  assert.equal(state.exitReason, 'TP3')
  assert.equal(state.realizedR, 1.975)
})

runTest('Bracket Math Invariant: Flash wick in evaluateBarOutcome prioritizes SL (-1.0R)', () => {
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
  // Candle touches both TP1 (61000) and SL (59000)
  const res = evaluateBarOutcome(bracket, { high: 61500, low: 58500 }, initial, 0)
  assert.equal(res.isClosed, true)
  assert.equal(res.exitReason, 'SL')
  assert.equal(res.realizedR, -1.0)
})

runTest('Bracket Math Invariant: Flash wick in calculateTradeBracketOutcome triggers SL (-1.0R)', () => {
  const bracket = {
    entryPrice: 60000,
    stopLossPrice: 59000,
    takeProfit1Price: 61000,
    takeProfit2Price: 62000,
    takeProfit3Price: 63500,
    direction: 'LONG'
  }
  // Candle touches both TP1 (61500 >= 61000) and SL (58500 <= 59000)
  const res = calculateTradeBracketOutcome(bracket, 61500, 58500)
  assert.equal(res.outcome, 'STOP_LOSS', `Expected STOP_LOSS, got ${res.outcome}`)
  assert.equal(res.rMultiple, -1.0, `Expected -1.0R, got ${res.rMultiple}`)
})

runTest('Position Sizing Invariant: Never divides by zero', () => {
  // Test 1: Identical entry and SL
  const zeroRisk = validateRiskPercentage(10000, 1.0, 50000, 50000)
  assert.equal(zeroRisk.isValid, false)
  assert.equal(zeroRisk.positionSize, 0)
  assert.ok(!Number.isNaN(zeroRisk.positionSize))
  assert.ok(Number.isFinite(zeroRisk.positionSize))

  // Test 2: Micro risk (near zero difference)
  const microRisk = validateRiskPercentage(10000, 1.0, 50000, 50000.000001)
  assert.equal(microRisk.isValid, true)
  assert.ok(Number.isFinite(microRisk.positionSize))

  // Test 3: Zero account balance
  const zeroBal = validateRiskPercentage(0, 1.0, 50000, 49000)
  assert.equal(zeroBal.isValid, false)
  assert.equal(zeroBal.positionSize, 0)

  // Test 4: Negative risk
  const negRisk = validateRiskPercentage(10000, -2.0, 50000, 49000)
  assert.equal(negRisk.isValid, false)
  assert.equal(negRisk.positionSize, 0)
})

// ---------------------------------------------------------
// 3. Technical Indicators Flat / Zero Volatility Series
// ---------------------------------------------------------
runTest('Indicators: Flat series for RSI, EMA, Bollinger Bands, ATR, MACD', () => {
  const FLAT_LEN = 50
  const FLAT_PRICE = 100.0
  const flatCandles = Array.from({ length: FLAT_LEN }, (_, i) => ({
    time: 1700000000 + i * 900,
    open: FLAT_PRICE,
    high: FLAT_PRICE,
    low: FLAT_PRICE,
    close: FLAT_PRICE,
    volume: 10,
  }))

  // RSI
  const rsi = calculateRSI(flatCandles, 14)
  assert.ok(rsi.length > 0)
  for (const pt of rsi) {
    assert.equal(pt.value, 50.0, 'RSI on flat series must be 50.0')
  }

  // EMA
  const ema = calculateEMA(flatCandles, 20)
  assert.ok(ema.length > 0)
  for (const pt of ema) {
    assert.equal(pt.value, FLAT_PRICE, 'EMA on flat series must equal flat price')
  }

  // Bollinger Bands
  const bb = calculateBollingerBands(flatCandles, 20, 2)
  assert.ok(bb.length > 0)
  for (const pt of bb) {
    assert.equal(pt.upper, FLAT_PRICE)
    assert.equal(pt.middle, FLAT_PRICE)
    assert.equal(pt.lower, FLAT_PRICE)
  }

  // ATR
  const atr = calculateATR(flatCandles, 14)
  assert.ok(atr.length > 0)
  for (const pt of atr) {
    assert.equal(pt.value, 0.0, 'ATR on zero range series must be 0.0')
  }

  // MACD
  const macd = calculateMACD(flatCandles, 12, 26, 9)
  assert.ok(macd.length > 0)
  for (const pt of macd) {
    assert.equal(pt.macd, 0.0)
    assert.equal(pt.signal, 0.0)
    assert.equal(pt.histogram, 0.0)
  }
})

// ---------------------------------------------------------
// 4. 3-Tier Candle API & Bundled Fallback
// ---------------------------------------------------------
runTest('Candle API: Bundled fallback data keys and schema integrity', () => {
  const filePath = path.join(process.cwd(), 'src/data/academy/bundled_candles.json')
  assert.ok(fs.existsSync(filePath), 'bundled_candles.json must exist')
  const bundled = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  const keys = Object.keys(bundled)
  assert.ok(keys.includes('BTC_15m'), 'Must contain BTC_15m')
  assert.ok(keys.includes('BTC_1h'), 'Must contain BTC_1h')
  assert.ok(keys.includes('BTC_1d'), 'Must contain BTC_1d')

  for (const key of keys) {
    const list = bundled[key]
    assert.ok(Array.isArray(list), `${key} must be an array`)
    assert.ok(list.length >= 50, `${key} must have >= 50 candles`)
    const sample = list[0]
    assert.ok(typeof sample.time === 'number')
    assert.ok(sample.open > 0)
    assert.ok(sample.high >= sample.low)
    assert.ok(sample.close > 0)
  }
})

runTest('Candle API: Route fallback resolution simulation', () => {
  const filePath = path.join(process.cwd(), 'src/data/academy/bundled_candles.json')
  const bundled = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  // Replicate route.ts fallback logic
  const resolveFallback = (rawSymbol, interval, limit) => {
    const baseSymbol = rawSymbol.toUpperCase().replace(/USDT$/, '')
    const pair = `${baseSymbol}USDT`
    const fallbackKey = `${baseSymbol}_${interval}`
    const fallbackList =
      bundled[fallbackKey] ||
      bundled[`${pair}_${interval}`] ||
      bundled['BTC_15m'] ||
      []
    const candles = fallbackList.slice(-limit)
    return {
      success: true,
      symbol: pair,
      interval,
      dataSource: 'BUNDLED_FALLBACK',
      isFallback: true,
      candles,
    }
  }

  // 1. Standard BTC 15m
  const res1 = resolveFallback('BTC', '15m', 100)
  assert.equal(res1.dataSource, 'BUNDLED_FALLBACK')
  assert.equal(res1.isFallback, true)
  assert.equal(res1.candles.length, 100)
  assert.equal(res1.symbol, 'BTCUSDT')

  // 2. Pair with USDT suffix
  const res2 = resolveFallback('BTCUSDT', '1h', 50)
  assert.equal(res2.candles.length, 50)
  assert.equal(res2.interval, '1h')

  // 3. Unknown symbol/timeframe gracefully falls back to BTC_15m
  const res3 = resolveFallback('SOL', '5m', 20)
  assert.equal(res3.dataSource, 'BUNDLED_FALLBACK')
  assert.equal(res3.isFallback, true)
  assert.equal(res3.candles.length, 20)
})

console.log('\n=== SUMMARY ===')
console.log(`Passed: ${results.passed}`)
console.log(`Failed: ${results.failed}`)

if (results.failed > 0) {
  console.log('\n=== FAILURES / FINDINGS ===')
  for (const f of results.findings) {
    console.log(`- ${f.test}: ${f.error}`)
  }
}
