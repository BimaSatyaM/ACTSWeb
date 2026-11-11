/**
 * ACTS True Weighted R-Multiple Bracket Math Engine
 * Conforms to PROJECT.md § Interface Contracts and ACTS Architectural Rules:
 * - Initial Risk = |Entry - SL|
 * - Full Stop-loss = -1.000R
 * - TP1 (+1.0R) exits 40% (ratchets stop to Breakeven 0.0R)
 * - TP2 (+2.0R) exits 35% (trails stop to TP1 +1.0R)
 * - TP3 (+3.5R) exits 25%
 * - Full TP3 Win = +1.975R (0.40 * 1.0 + 0.35 * 2.0 + 0.25 * 3.5 = 1.975R)
 * - TP1 Breakeven = +0.400R (0.40 * 1.0 + 0.60 * 0.0)
 * - TP2 Trailing TP1 = +1.350R (0.40 * 1.0 + 0.35 * 2.0 + 0.25 * 1.0)
 */

import type {
  TradeDirection,
  TradeBracketInput,
  TradeBracketResult,
  BracketSetup,
  ReplayTradeState,
  PositionSizingResult,
} from '../types/academy'

export const TP1_WEIGHT = 0.40
export const TP2_WEIGHT = 0.35
export const TP3_WEIGHT = 0.25
export const FULL_TP3_R_MULTIPLE = 1.975

/**
 * Validates prices and constructs strict ACTS bracket price targets.
 */
export function calculateBrackets(
  direction: TradeDirection,
  entry: number,
  sl: number
): BracketSetup {
  if (entry <= 0 || sl <= 0) {
    throw new Error('Prices must be strictly positive numbers.')
  }
  const risk = Math.abs(entry - sl)
  if (risk === 0) {
    throw new Error('Risk cannot be zero (Entry price cannot equal Stop-Loss).')
  }

  if (direction === 'LONG') {
    if (sl >= entry) {
      throw new Error('For LONG positions, Stop-Loss must be strictly below Entry price.')
    }
    return {
      direction,
      entry,
      sl,
      risk,
      tp1: Number((entry + 1.0 * risk).toFixed(4)),
      tp2: Number((entry + 2.0 * risk).toFixed(4)),
      tp3: Number((entry + 3.5 * risk).toFixed(4)),
      weightTp1: TP1_WEIGHT,
      weightTp2: TP2_WEIGHT,
      weightTp3: TP3_WEIGHT,
    }
  } else {
    if (sl <= entry) {
      throw new Error('For SHORT positions, Stop-Loss must be strictly above Entry price.')
    }
    return {
      direction,
      entry,
      sl,
      risk,
      tp1: Number((entry - 1.0 * risk).toFixed(4)),
      tp2: Number((entry - 2.0 * risk).toFixed(4)),
      tp3: Number((entry - 3.5 * risk).toFixed(4)),
      weightTp1: TP1_WEIGHT,
      weightTp2: TP2_WEIGHT,
      weightTp3: TP3_WEIGHT,
    }
  }
}

/**
 * Evaluates trade state against candle updates with ACTS bracket progression.
 * Prioritizes capital preservation (Stop-Loss takes precedence if touched).
 */
export function evaluateBarOutcome(
  bracket: BracketSetup,
  candle: { high: number; low: number },
  currentState: ReplayTradeState,
  candleIndex: number
): ReplayTradeState {
  if (currentState.isClosed) return currentState

  let { currentSl, tp1Hit, tp2Hit } = currentState

  if (bracket.direction === 'LONG') {
    // 1. Check Stop-Loss (Capital Protection has absolute priority)
    if (candle.low <= currentSl) {
      if (!tp1Hit) {
        return {
          isClosed: true,
          currentSl,
          tp1Hit: false,
          tp2Hit: false,
          tp3Hit: false,
          exitReason: 'SL',
          realizedR: -1.0,
          exitCandleIndex: candleIndex,
        }
      } else if (!tp2Hit) {
        // TP1 hit (40% @ +1.0R), remaining 60% stopped out at currentSl
        const slR = (currentSl - bracket.entry) / bracket.risk
        const realizedR = Number((TP1_WEIGHT * 1.0 + (1 - TP1_WEIGHT) * slR).toFixed(4))
        return {
          isClosed: true,
          currentSl,
          tp1Hit: true,
          tp2Hit: false,
          tp3Hit: false,
          exitReason: 'TP1_BREAKEVEN',
          realizedR,
          exitCandleIndex: candleIndex,
        }
      } else {
        // TP1 hit (40% @ 1.0R), TP2 hit (35% @ 2.0R), remaining 25% stopped out
        const slR = (currentSl - bracket.entry) / bracket.risk
        const realizedR = Number((TP1_WEIGHT * 1.0 + TP2_WEIGHT * 2.0 + TP3_WEIGHT * slR).toFixed(4))
        return {
          isClosed: true,
          currentSl,
          tp1Hit: true,
          tp2Hit: true,
          tp3Hit: false,
          exitReason: currentSl >= bracket.tp1 ? 'TP2_TRAILING_TP1' : 'TP1_BREAKEVEN',
          realizedR,
          exitCandleIndex: candleIndex,
        }
      }
    }

    // 2. Check TP3
    if (tp2Hit && candle.high >= bracket.tp3) {
      return {
        isClosed: true,
        currentSl,
        tp1Hit: true,
        tp2Hit: true,
        tp3Hit: true,
        exitReason: 'TP3',
        realizedR: FULL_TP3_R_MULTIPLE, // 0.40*1.0 + 0.35*2.0 + 0.25*3.5 = +1.975R
        exitCandleIndex: candleIndex,
      }
    }

    // 3. Check TP2
    if (tp1Hit && !tp2Hit && candle.high >= bracket.tp2) {
      tp2Hit = true
      currentSl = bracket.tp1 // Trail stop to TP1 (+1.0R)
    }

    // 4. Check TP1
    if (!tp1Hit && candle.high >= bracket.tp1) {
      tp1Hit = true
      currentSl = bracket.entry // Ratchet stop to Breakeven (0.0R)
    }
  } else {
    // SHORT Direction
    // 1. Check Stop-Loss
    if (candle.high >= currentSl) {
      if (!tp1Hit) {
        return {
          isClosed: true,
          currentSl,
          tp1Hit: false,
          tp2Hit: false,
          tp3Hit: false,
          exitReason: 'SL',
          realizedR: -1.0,
          exitCandleIndex: candleIndex,
        }
      } else if (!tp2Hit) {
        const slR = (bracket.entry - currentSl) / bracket.risk
        const realizedR = Number((TP1_WEIGHT * 1.0 + (1 - TP1_WEIGHT) * slR).toFixed(4))
        return {
          isClosed: true,
          currentSl,
          tp1Hit: true,
          tp2Hit: false,
          tp3Hit: false,
          exitReason: 'TP1_BREAKEVEN',
          realizedR,
          exitCandleIndex: candleIndex,
        }
      } else {
        const slR = (bracket.entry - currentSl) / bracket.risk
        const realizedR = Number((TP1_WEIGHT * 1.0 + TP2_WEIGHT * 2.0 + TP3_WEIGHT * slR).toFixed(4))
        return {
          isClosed: true,
          currentSl,
          tp1Hit: true,
          tp2Hit: true,
          tp3Hit: false,
          exitReason: currentSl <= bracket.tp1 ? 'TP2_TRAILING_TP1' : 'TP1_BREAKEVEN',
          realizedR,
          exitCandleIndex: candleIndex,
        }
      }
    }

    // 2. Check TP3
    if (tp2Hit && candle.low <= bracket.tp3) {
      return {
        isClosed: true,
        currentSl,
        tp1Hit: true,
        tp2Hit: true,
        tp3Hit: true,
        exitReason: 'TP3',
        realizedR: FULL_TP3_R_MULTIPLE,
        exitCandleIndex: candleIndex,
      }
    }

    // 3. Check TP2
    if (tp1Hit && !tp2Hit && candle.low <= bracket.tp2) {
      tp2Hit = true
      currentSl = bracket.tp1 // Trail stop to TP1 (+1.0R)
    }

    // 4. Check TP1
    if (!tp1Hit && candle.low <= bracket.tp1) {
      tp1Hit = true
      currentSl = bracket.entry // Ratchet stop to Breakeven (0.0R)
    }
  }

  return {
    isClosed: false,
    currentSl,
    tp1Hit,
    tp2Hit,
    tp3Hit: false,
    exitReason: 'ACTIVE',
    realizedR: 0,
    exitCandleIndex: -1,
  }
}

/**
 * Evaluates trade bracket outcome against high and low bounds.
 * Implements calculateTradeBracketOutcome interface contract from PROJECT.md
 */
export function calculateTradeBracketOutcome(
  bracket: TradeBracketInput,
  highPrice: number,
  lowPrice: number,
  exitPrice?: number
): TradeBracketResult {
  const initialRisk = Math.abs(bracket.entryPrice - bracket.stopLossPrice)
  if (initialRisk === 0) {
    throw new Error('Initial risk cannot be zero')
  }

  const isLong = bracket.direction === 'LONG'

  // If discretionary exit price specified
  if (exitPrice !== undefined) {
    const r = isLong
      ? (exitPrice - bracket.entryPrice) / initialRisk
      : (bracket.entryPrice - exitPrice) / initialRisk
    return {
      initialRisk,
      rMultiple: Number(r.toFixed(4)),
      outcome: r <= -1.0 ? 'STOP_LOSS' : r >= 0 ? 'BREAKEVEN' : 'STOP_LOSS',
      tp1Weight: TP1_WEIGHT,
      tp2Weight: TP2_WEIGHT,
      tp3Weight: TP3_WEIGHT,
      breakdown: `Manual exit at ${exitPrice} (${r.toFixed(2)}R)`,
    }
  }

  // Check SL first for capital protection
  const hitSL = isLong ? lowPrice <= bracket.stopLossPrice : highPrice >= bracket.stopLossPrice
  const hitTP1 = isLong ? highPrice >= bracket.takeProfit1Price : lowPrice <= bracket.takeProfit1Price
  const hitTP2 = isLong ? highPrice >= bracket.takeProfit2Price : lowPrice <= bracket.takeProfit2Price
  const hitTP3 = isLong ? highPrice >= bracket.takeProfit3Price : lowPrice <= bracket.takeProfit3Price

  if (hitSL) {
    return {
      initialRisk,
      rMultiple: -1.0,
      outcome: 'STOP_LOSS',
      tp1Weight: TP1_WEIGHT,
      tp2Weight: TP2_WEIGHT,
      tp3Weight: TP3_WEIGHT,
      breakdown: 'Stop-loss breached (-1.0R). Immediate exit for capital preservation.',
    }
  }

  if (hitTP3 && hitTP2 && hitTP1) {
    return {
      initialRisk,
      rMultiple: FULL_TP3_R_MULTIPLE,
      outcome: 'TP3_HIT',
      tp1Weight: TP1_WEIGHT,
      tp2Weight: TP2_WEIGHT,
      tp3Weight: TP3_WEIGHT,
      breakdown: 'Full TP3 achieved (+1.975R): 40% @ 1.0R + 35% @ 2.0R + 25% @ 3.5R.',
    }
  }

  if (hitTP2 && hitTP1) {
    // If SL was hit after TP2, trailed stop is at TP1 (+1.0R) -> +1.350R
    const r = hitSL ? 1.350 : 1.475
    return {
      initialRisk,
      rMultiple: r,
      outcome: 'TP2_HIT',
      tp1Weight: TP1_WEIGHT,
      tp2Weight: TP2_WEIGHT,
      tp3Weight: TP3_WEIGHT,
      breakdown: `TP2 reached (+${r}R): 40% @ 1.0R + 35% @ 2.0R with trailed stop.`,
    }
  }

  if (hitTP1) {
    // If SL was hit after TP1, stop was moved to breakeven (0.0R) -> +0.400R
    const r = hitSL ? 0.400 : 0.700
    return {
      initialRisk,
      rMultiple: r,
      outcome: hitSL ? 'BREAKEVEN' : 'TP1_HIT',
      tp1Weight: TP1_WEIGHT,
      tp2Weight: TP2_WEIGHT,
      tp3Weight: TP3_WEIGHT,
      breakdown: `TP1 reached (+${r}R): 40% scaled out at 1.0R.`,
    }
  }

  return {
    initialRisk,
    rMultiple: 0,
    outcome: 'BREAKEVEN',
    tp1Weight: TP1_WEIGHT,
    tp2Weight: TP2_WEIGHT,
    tp3Weight: TP3_WEIGHT,
    breakdown: 'Position open within bracket bounds.',
  }
}

/**
 * Calculates position sizing and risk amount according to ACTS invariant:
 * Size = (AccountBalance * Risk%) / |Entry - SL|
 */
export function validateRiskPercentage(
  accountBalance: number,
  riskPercent: number,
  entry: number,
  sl: number
): PositionSizingResult {
  if (accountBalance <= 0) {
    return {
      positionSize: 0,
      riskAmount: 0,
      isValid: false,
      warning: 'Account balance must be positive.',
    }
  }

  if (riskPercent <= 0) {
    return {
      positionSize: 0,
      riskAmount: 0,
      isValid: false,
      warning: 'Risk percentage must be greater than 0%.',
    }
  }

  const riskPerUnit = Math.abs(entry - sl)
  if (riskPerUnit === 0) {
    return {
      positionSize: 0,
      riskAmount: 0,
      isValid: false,
      warning: 'Entry and Stop-Loss cannot be identical.',
    }
  }

  const riskAmount = (accountBalance * riskPercent) / 100
  const positionSize = Number((riskAmount / riskPerUnit).toFixed(6))

  let warning: string | undefined
  if (riskPercent > 2.0) {
    warning = `Risk of ${riskPercent}% exceeds recommended 1-2% institutional risk management threshold.`
  }

  return {
    positionSize,
    riskAmount: Number(riskAmount.toFixed(2)),
    isValid: true,
    warning,
  }
}

export const calculatePositionSize = validateRiskPercentage
