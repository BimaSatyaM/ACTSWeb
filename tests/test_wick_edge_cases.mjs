import assert from 'node:assert/strict'
import { calculateTradeBracketOutcome, calculateBrackets } from '../src/lib/bracketMath.ts'

console.log('=== ADVERSARIAL EDGE CASE HARNESS: CANDLE SPANNING SL & ALL TPs ===\n')

// 1. LONG Setup:
// Entry = 60,000, SL = 59,000, TP1 = 61,000 (+1R), TP2 = 62,000 (+2R), TP3 = 63,500 (+3.5R)
const longBracket = {
  entryPrice: 60000,
  stopLossPrice: 59000,
  takeProfit1Price: 61000,
  takeProfit2Price: 62000,
  takeProfit3Price: 63500,
  direction: 'LONG',
}

// Mega-wick candle spanning well below SL and well above TP3:
// High = 65000 (breaches TP1, TP2, TP3), Low = 58000 (breaches SL)
const megaWickLong = calculateTradeBracketOutcome(longBracket, 65000, 58000)
console.log('LONG Mega-Wick Result:', megaWickLong)

assert.equal(megaWickLong.outcome, 'STOP_LOSS', `Expected STOP_LOSS, got ${megaWickLong.outcome}`)
assert.equal(megaWickLong.rMultiple, -1.0, `Expected -1.0R, got ${megaWickLong.rMultiple}`)
assert.match(megaWickLong.breakdown, /Stop-loss breached \(-1\.0R\)/)

// Exact touch test for LONG: High = 63500 (exact TP3), Low = 59000 (exact SL)
const exactTouchLong = calculateTradeBracketOutcome(longBracket, 63500, 59000)
console.log('LONG Exact Touch Result:', exactTouchLong)
assert.equal(exactTouchLong.outcome, 'STOP_LOSS', `Expected STOP_LOSS on exact touch, got ${exactTouchLong.outcome}`)
assert.equal(exactTouchLong.rMultiple, -1.0, `Expected -1.0R on exact touch, got ${exactTouchLong.rMultiple}`)

// 2. SHORT Setup:
// Entry = 60,000, SL = 61,000, TP1 = 59,000 (+1R), TP2 = 58,000 (+2R), TP3 = 56,500 (+3.5R)
const shortBracket = {
  entryPrice: 60000,
  stopLossPrice: 61000,
  takeProfit1Price: 59000,
  takeProfit2Price: 58000,
  takeProfit3Price: 56500,
  direction: 'SHORT',
}

// Mega-wick candle spanning well above SL and well below TP3:
// High = 62000 (breaches SL), Low = 55000 (breaches TP1, TP2, TP3)
const megaWickShort = calculateTradeBracketOutcome(shortBracket, 62000, 55000)
console.log('SHORT Mega-Wick Result:', megaWickShort)

assert.equal(megaWickShort.outcome, 'STOP_LOSS', `Expected STOP_LOSS, got ${megaWickShort.outcome}`)
assert.equal(megaWickShort.rMultiple, -1.0, `Expected -1.0R, got ${megaWickShort.rMultiple}`)
assert.match(megaWickShort.breakdown, /Stop-loss breached \(-1\.0R\)/)

// Exact touch test for SHORT: High = 61000 (exact SL), Low = 56500 (exact TP3)
const exactTouchShort = calculateTradeBracketOutcome(shortBracket, 61000, 56500)
console.log('SHORT Exact Touch Result:', exactTouchShort)
assert.equal(exactTouchShort.outcome, 'STOP_LOSS', `Expected STOP_LOSS on exact touch, got ${exactTouchShort.outcome}`)
assert.equal(exactTouchShort.rMultiple, -1.0, `Expected -1.0R on exact touch, got ${exactTouchShort.rMultiple}`)

console.log('\n[ALL EDGE CASE ASSERTIONS PASSED WITH 100% CAPITAL PROTECTION COMPLIANCE]')
