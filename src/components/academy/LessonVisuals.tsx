'use client'

import React, { useState } from 'react'

interface LessonVisualProps {
  type: string
}

export function LessonVisual({ type }: LessonVisualProps) {
  switch (type.trim().toLowerCase()) {
    case 'candlestick-sr-zones':
      return <CandlestickAndSrZonesVisual />
    case 'market-structure-bos':
      return <MarketStructureBosVisual />
    case 'ema-ribbon':
      return <EmaRibbonVisual />
    case 'rsi-divergence':
      return <RsiDivergenceVisual />
    case 'macd-momentum':
      return <MacdMomentumVisual />
    case 'bollinger-atr':
      return <BollingerAtrVisual />
    case 'confluence-stack':
      return <ConfluenceStackVisual />
    case 'orderbook-depth':
      return <OrderBookDepthVisual />
    case 'order-types-matrix':
      return <OrderTypesMatrixVisual />
    case 'position-sizer':
      return <PositionSizerVisual />
    case 'bracket-r-math':
      return <BracketRMathVisual />
    case 'pre-trade-checklist':
      return <PreTradeChecklistVisual />
    case 'macro-cpi-transmission':
      return <MacroCpiTransmissionVisual />
    case 'macro-fomc-tools':
      return <MacroFomcToolsVisual />
    case 'macro-yield-curve':
      return <MacroYieldCurveVisual />
    case 'macro-dxy-basket':
      return <MacroDxyBasketVisual />
    case 'macro-surprise-delta':
      return <MacroSurpriseDeltaVisual />
    default:
      return null
  }
}

interface SimCandle {
  o: number
  h: number
  l: number
  c: number
}

// Generates N continuous, gap-free candlesticks (open[i] === close[i-1])
// anchored to exact structural price waypoints so charts have 55-65 dense
// institutional bars with zero artificial vertical gaps.
function buildContinuousCandles(
  waypoints: { bar: number; price: number }[],
  noiseAmp: number
): SimCandle[] {
  const candles: SimCandle[] = []
  if (waypoints.length < 2) return candles

  let prevClose = waypoints[0].price

  for (let w = 0; w < waypoints.length - 1; w++) {
    const start = waypoints[w]
    const end = waypoints[w + 1]
    const span = Math.max(1, end.bar - start.bar)

    for (let step = 1; step <= span; step++) {
      const barIdx = start.bar + step
      const t = step / span
      const linear = start.price + (end.price - start.price) * t
      const isEndpoint = step === span
      // Add deterministic micro-structure wave so up/down candles alternate naturally
      const wave = isEndpoint
        ? 0
        : Math.sin(barIdx * 2.15) * noiseAmp * 0.55 +
          Math.cos(barIdx * 1.35) * noiseAmp * 0.25

      const open = prevClose
      const close = Number((linear + wave).toFixed(2))
      const bodyMax = Math.max(open, close)
      const bodyMin = Math.min(open, close)
      const upperWick =
        noiseAmp * (0.28 + 0.38 * Math.abs(Math.sin(barIdx * 1.7 + 0.5)))
      const lowerWick =
        noiseAmp * (0.28 + 0.38 * Math.abs(Math.cos(barIdx * 1.9 + 0.3)))

      candles.push({
        o: open,
        h: Number((bodyMax + upperWick).toFixed(2)),
        l: Number((bodyMin - lowerWick).toFixed(2)),
        c: close,
      })
      prevClose = close
    }
  }

  return candles
}

function computeSimpleEma(candles: SimCandle[], period: number, initialOffset = 0): number[] {
  if (candles.length === 0) return []
  const k = 2 / (period + 1)
  let ema = candles[0].c + initialOffset
  return candles.map((c) => {
    ema = (c.c - ema) * k + ema
    return ema
  })
}

// 1. CANDLESTICK ANATOMY & SUPPORT/RESISTANCE LIQUIDITY ZONES (60 Dense Bars)
function CandlestickAndSrZonesVisual() {
  const srCandles = buildContinuousCandles(
    [
      { bar: 0, price: 80050 },
      { bar: 5, price: 80445 }, // R1 touch 1 (80,451)
      { bar: 9, price: 80110 },
      { bar: 14, price: 80455 }, // R1 touch 2
      { bar: 18, price: 80695 }, // R2 touch 1 (80,696)
      { bar: 22, price: 80440 }, // R1 flip test
      { bar: 26, price: 80825 }, // R3 touch 1 (80,827)
      { bar: 30, price: 80685 }, // R2 test
      { bar: 34, price: 80830 }, // R3 touch 2
      { bar: 38, price: 80450 }, // R1 test
      { bar: 42, price: 79645 }, // Breakdown to Support (79,640) S1 touch 1
      { bar: 46, price: 79990 },
      { bar: 50, price: 79638 }, // S1 touch 2 (Double bottom in Support Zone)
      { bar: 52, price: 79810 }, // <-- LONG ENTRY TRIGGER BAR (Bullish confirmation off Support)
      { bar: 56, price: 80210 },
      { bar: 60, price: 80451 }, // Hits TP2 at Resistance 1
    ],
    65
  )

  const minPrice = 79380
  const maxPrice = 81020
  const chartH = 360
  const chartW = 735
  const priceToY = (p: number) =>
    22 + ((maxPrice - p) / (maxPrice - minPrice)) * (chartH - 44)
  const barToX = (idx: number) => 22 + idx * 11.6

  const entryBar = 51
  const entryX = barToX(entryBar)
  const entryPrice = 79810
  const slPrice = 79510
  const tp1Price = 80110
  const tp2Price = 80451
  const tp3Price = 80827

  return (
    <div data-ui className="my-6 space-y-5">
      <div className="rounded-lg border border-[#1a2030] bg-[#070b14] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1a2030]">
          <span className="text-xs sm:text-sm font-semibold text-white">
            OHLC Candlestick Microstructure (Bullish Impulse vs. Bearish Rejection)
          </span>
          <span className="text-xs text-[#94a3b8] [font-variant-numeric:tabular-nums]">
            Every candle records 4 auction prices: Open, High, Low, Close
          </span>
        </div>

        <svg
          viewBox="0 0 780 230"
          className="w-full h-auto select-none"
          role="img"
          aria-label="Bullish and Bearish Candlestick OHLC Anatomy"
        >
          {[42, 85, 145, 188].map((y) => (
            <line
              key={y}
              x1="20"
              y1={y}
              x2="760"
              y2={y}
              stroke="#141c2b"
              strokeDasharray="3 3"
            />
          ))}

          <text x="180" y="24" textAnchor="middle" fill="#3fc07a" fontSize="12.5" fontWeight="600">
            BULLISH CANDLE (Close &gt; Open)
          </text>
          <line x1="180" y1="42" x2="180" y2="188" stroke="#3fc07a" strokeWidth="2.5" />
          <rect
            x="148"
            y="80"
            width="64"
            height="68"
            rx="2"
            fill="#3fc07a"
            fillOpacity="0.25"
            stroke="#3fc07a"
            strokeWidth="2"
          />
          <line x1="180" y1="42" x2="238" y2="42" stroke="#3fc07a" strokeDasharray="2 2" />
          <text x="246" y="46" fill="#e2e8f0" fontSize="11.5">
            High ($76,840) · Upper Wick
          </text>

          <line x1="212" y1="80" x2="238" y2="80" stroke="#3fc07a" />
          <text x="246" y="84" fill="#3fc07a" fontSize="11.5" fontWeight="600">
            Close ($76,620) · Buyers win session
          </text>

          <text x="180" y="118" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="600">
            REAL BODY
          </text>

          <line x1="212" y1="148" x2="238" y2="148" stroke="#3fc07a" />
          <text x="246" y="152" fill="#cbd5e1" fontSize="11.5">
            Open ($75,980) · Session start
          </text>

          <line x1="180" y1="188" x2="238" y2="188" stroke="#3fc07a" strokeDasharray="2 2" />
          <text x="246" y="192" fill="#94a3b8" fontSize="11.5">
            Low ($75,710) · Lower Wick (Demand tail)
          </text>

          <line x1="425" y1="16" x2="425" y2="210" stroke="#1a2030" />

          <text x="545" y="24" textAnchor="middle" fill="#e5566f" fontSize="12.5" fontWeight="600">
            BEARISH CANDLE (Close &lt; Open)
          </text>
          <line x1="520" y1="42" x2="520" y2="188" stroke="#e5566f" strokeWidth="2.5" />
          <rect
            x="488"
            y="80"
            width="64"
            height="68"
            rx="2"
            fill="#e5566f"
            fillOpacity="0.25"
            stroke="#e5566f"
            strokeWidth="2"
          />
          <line x1="520" y1="42" x2="578" y2="42" stroke="#e5566f" strokeDasharray="2 2" />
          <text x="586" y="46" fill="#94a3b8" fontSize="11.5">
            High ($76,840) · Supply rejection wick
          </text>

          <line x1="552" y1="80" x2="578" y2="80" stroke="#e5566f" />
          <text x="586" y="84" fill="#cbd5e1" fontSize="11.5">
            Open ($76,620) · Session start
          </text>

          <text x="520" y="118" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="600">
            REAL BODY
          </text>

          <line x1="552" y1="148" x2="578" y2="148" stroke="#e5566f" />
          <text x="586" y="152" fill="#e5566f" fontSize="11.5" fontWeight="600">
            Close ($75,980) · Sellers win session
          </text>

          <line x1="520" y1="188" x2="578" y2="188" stroke="#e5566f" strokeDasharray="2 2" />
          <text x="586" y="192" fill="#e2e8f0" fontSize="11.5">
            Low ($75,710) · Session low
          </text>
        </svg>
      </div>

      <div className="rounded-lg border border-[#1a2030] bg-[#070b14] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1a2030]">
          <div>
            <div className="text-xs sm:text-sm font-semibold text-white">
              Support &amp; Resistance Liquidity Zones + Long Bounce Trade Setup (60 Continuous Bars)
            </div>
            <div className="text-xs text-[#94a3b8]">
              Shaded horizontal supply/demand bands with touch counts (R 4x–6x, S 3x) and full Entry / Stop-Loss / Target bracket box
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs [font-variant-numeric:tabular-nums]">
            <span className="text-[#e5566f]">■ Resistance Zone</span>
            <span className="text-[#3fc07a]">■ Support Zone &amp; Profit Box</span>
            <span className="text-[#38bdf8]">● Entry Trigger</span>
          </div>
        </div>

        <svg
          viewBox="0 0 860 365"
          className="w-full h-auto select-none"
          role="img"
          aria-label="60-candle chart with Support and Resistance zones and Long Trade Setup Box"
        >
          {[79640, 80000, 80451, 80696, 80827].map((p) => (
            <line
              key={p}
              x1="14"
              y1={priceToY(p)}
              x2={chartW}
              y2={priceToY(p)}
              stroke="#131b2c"
              strokeWidth="1"
            />
          ))}

          <rect
            x="14"
            y={priceToY(80865)}
            width={chartW - 14}
            height={priceToY(80790) - priceToY(80865)}
            fill="#e5566f"
            fillOpacity="0.15"
          />
          <line x1="14" y1={priceToY(80827)} x2={chartW} y2={priceToY(80827)} stroke="#e5566f" strokeWidth="1.3" />
          <rect x="24" y={priceToY(80827) - 18} width="168" height="16" rx="2" fill="#2c1620" stroke="#e5566f" strokeWidth="0.8" />
          <text x="32" y={priceToY(80827) - 7} fill="#fda4af" fontSize="10" fontWeight="600">
            Resistance 80,827.13 · R 4x
          </text>

          <rect
            x="14"
            y={priceToY(80725)}
            width={chartW - 14}
            height={priceToY(80660) - priceToY(80725)}
            fill="#e5566f"
            fillOpacity="0.12"
          />
          <line
            x1="14"
            y1={priceToY(80696)}
            x2={chartW}
            y2={priceToY(80696)}
            stroke="#e5566f"
            strokeWidth="1.1"
            strokeDasharray="4 2"
          />
          <rect x="24" y={priceToY(80696) - 17} width="168" height="16" rx="2" fill="#2c1620" stroke="#e5566f" strokeWidth="0.8" />
          <text x="32" y={priceToY(80696) - 6} fill="#fda4af" fontSize="10" fontWeight="600">
            Resistance 80,696.00 · R 5x
          </text>

          <rect
            x="14"
            y={priceToY(80485)}
            width={chartW - 14}
            height={priceToY(80415) - priceToY(80485)}
            fill="#e5566f"
            fillOpacity="0.16"
          />
          <line x1="14" y1={priceToY(80451)} x2={chartW} y2={priceToY(80451)} stroke="#e5566f" strokeWidth="1.4" />
          <rect x="24" y={priceToY(80451) - 17} width="168" height="16" rx="2" fill="#2c1620" stroke="#e5566f" strokeWidth="0.8" />
          <text x="32" y={priceToY(80451) - 6} fill="#fda4af" fontSize="10" fontWeight="600">
            Resistance 80,451.18 · R 6x
          </text>

          <rect
            x="14"
            y={priceToY(79690)}
            width={chartW - 14}
            height={priceToY(79595) - priceToY(79690)}
            fill="#3fc07a"
            fillOpacity="0.16"
          />
          <line x1="14" y1={priceToY(79640)} x2={chartW} y2={priceToY(79640)} stroke="#3fc07a" strokeWidth="1.4" />
          <rect x="24" y={priceToY(79640) - 17} width="156" height="16" rx="2" fill="#122b20" stroke="#3fc07a" strokeWidth="0.8" />
          <text x="32" y={priceToY(79640) - 6} fill="#86efac" fontSize="10" fontWeight="600">
            Support 79,640.00 · S 3x
          </text>

          <rect
            x={entryX}
            y={priceToY(tp3Price)}
            width={chartW - entryX - 4}
            height={priceToY(entryPrice) - priceToY(tp3Price)}
            fill="#3fc07a"
            fillOpacity="0.14"
            stroke="#3fc07a"
            strokeWidth="1.2"
          />
          <line
            x1={entryX}
            y1={priceToY(tp1Price)}
            x2={chartW - 4}
            y2={priceToY(tp1Price)}
            stroke="#3fc07a"
            strokeDasharray="3 3"
          />
          <text x={entryX + 6} y={priceToY(tp1Price) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
            TP1 $80,110 (+1.0R · 40%)
          </text>
          <text x={entryX + 6} y={priceToY(tp2Price) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
            TP2 $80,451 (+2.0R · 35%)
          </text>
          <text x={entryX + 6} y={priceToY(tp3Price) + 12} fill="#86efac" fontSize="9.5" fontWeight="600">
            TP3 $80,827 (+3.5R · 25%)
          </text>

          <rect
            x={entryX}
            y={priceToY(entryPrice)}
            width={chartW - entryX - 4}
            height={priceToY(slPrice) - priceToY(entryPrice)}
            fill="#e5566f"
            fillOpacity="0.20"
            stroke="#e5566f"
            strokeWidth="1.2"
          />
          <text x={entryX + 6} y={priceToY(slPrice) - 5} fill="#fda4af" fontSize="9.5" fontWeight="600">
            STOP-LOSS $79,510 (−1.0R Below Support)
          </text>

          <line
            x1={entryX}
            y1={priceToY(entryPrice)}
            x2={chartW}
            y2={priceToY(entryPrice)}
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {srCandles.map((c, idx) => {
            const x = barToX(idx)
            const isUp = c.c >= c.o
            const color = isUp ? '#3fc07a' : '#e5566f'
            const yHigh = priceToY(c.h)
            const yLow = priceToY(c.l)
            const yOpen = priceToY(c.o)
            const yClose = priceToY(c.c)
            const bodyTop = Math.min(yOpen, yClose)
            const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2)
            return (
              <g key={idx}>
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
                <rect x={x - 3.4} y={bodyTop} width="6.8" height={bodyHeight} fill={color} rx="0.8" />
              </g>
            )
          })}

          <circle cx={entryX} cy={priceToY(entryPrice)} r="5" fill="#38bdf8" stroke="#070b14" strokeWidth="1.5" />
          <rect
            x={entryX - 185}
            y={priceToY(entryPrice) - 11}
            width="175"
            height="22"
            rx="3"
            fill="#0d1829"
            stroke="#38bdf8"
            strokeWidth="1.2"
          />
          <text x={entryX - 97} y={priceToY(entryPrice) + 3.5} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
            LONG ENTRY @ $79,810 →
          </text>

          <line x1={chartW} y1="12" x2={chartW} y2={chartH - 12} stroke="#262f45" strokeWidth="1" />
          {[
            { price: '80,827.13', y: priceToY(80827), bg: '#e5566f', fg: '#ffffff' },
            { price: '80,696.00', y: priceToY(80696), bg: '#be3e55', fg: '#ffffff' },
            { price: '80,451.18', y: priceToY(80451), bg: '#e5566f', fg: '#ffffff' },
            { price: '79,810.00', y: priceToY(79810), bg: '#0284c7', fg: '#ffffff' },
            { price: '79,640.00', y: priceToY(79640), bg: '#247b50', fg: '#ffffff' },
            { price: '79,510.00', y: priceToY(79510), bg: '#881337', fg: '#fda4af' },
          ].map((tag, i) => (
            <g key={i}>
              <rect x={chartW + 5} y={tag.y - 9} width="112" height="18" rx="2" fill={tag.bg} />
              <text x={chartW + 13} y={tag.y + 3.5} fill={tag.fg} fontSize="10.5" fontWeight="600">
                {tag.price}
              </text>
            </g>
          ))}
        </svg>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1a2030] text-xs [font-variant-numeric:tabular-nums]">
          <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
            <div className="text-[#94a3b8] text-[11px]">1. Liquidity Zone</div>
            <div className="text-white font-semibold mt-0.5">Support $79,640 (S 3x)</div>
            <div className="text-[#64748b] text-[11px]">Multi-touch demand absorption</div>
          </div>
          <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
            <div className="text-[#38bdf8] text-[11px]">2. Entry Trigger</div>
            <div className="text-white font-semibold mt-0.5">Long @ $79,810</div>
            <div className="text-[#64748b] text-[11px]">Bullish rejection candle close</div>
          </div>
          <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
            <div className="text-[#e5566f] text-[11px]">3. Stop-Loss (−1.0R)</div>
            <div className="text-white font-semibold mt-0.5">$79,510 ($300 Risk)</div>
            <div className="text-[#64748b] text-[11px]">Placed below Support zone wick</div>
          </div>
          <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
            <div className="text-[#3fc07a] text-[11px]">4. Targets (+1.975R)</div>
            <div className="text-white font-semibold mt-0.5">$80,110 / $80,451 / $80,827</div>
            <div className="text-[#64748b] text-[11px]">Scale out into Resistance bands</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. MARKET STRUCTURE: HH, HL, BOS & CHoCH VISUAL CHART (60 Dense Bars + Setup Box)
function MarketStructureBosVisual() {
  const bars = buildContinuousCandles(
    [
      { bar: 0, price: 75150 },
      { bar: 8, price: 76120 }, // HH1 ($76,120)
      { bar: 14, price: 75560 }, // HL1 ($75,560)
      { bar: 23, price: 76850 }, // BOS 1 -> HH2 ($76,850)
      { bar: 30, price: 76220 }, // HL2 Key Structural Low ($76,220)
      { bar: 38, price: 77380 }, // BOS 2 -> HH3 ($77,380)
      { bar: 43, price: 76520 }, // Pullback
      { bar: 47, price: 77080 }, // LH (Failed Lower High $77,080)
      { bar: 52, price: 75820 }, // CHoCH Breakdown below HL2 ($76,220)
      { bar: 56, price: 76240 }, // Bearish Retest of broken HL2 supply flip -> SHORT ENTRY TRIGGER!
      { bar: 62, price: 75180 }, // Bearish expansion into TP1/TP2/TP3
    ],
    58
  )

  const minP = 74900
  const maxP = 77680
  const chartW = 745
  const chartH = 370
  const toY = (p: number) => 24 + ((maxP - p) / (maxP - minP)) * (chartH - 48)
  const toX = (i: number) => 22 + i * 11.5

  const entryIdx = 55
  const entryX = toX(entryIdx)
  const entryP = 76240
  const slP = 76640 // Above retest supply zone & LH structure (+400 risk)
  const tp1P = 75840 // -400 (+1.0R)
  const tp2P = 75440 // -800 (+2.0R)
  const tp3P = 75020 // (+3.05R / structural target)

  return (
    <div data-ui className="my-6 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1a2030]">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-white">
            Market Structure: Bullish BOS Continuation, Bearish CHoCH Breakdown &amp; Retest Setup (62 Bars)
          </div>
          <div className="text-xs text-[#94a3b8]">
            Wait for CHoCH candle close below Key Higher Low (HL2), then enter on the pullback retest with Stop-Loss above the zone
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs [font-variant-numeric:tabular-nums]">
          <span className="text-[#3fc07a]">── BOS (Trend Continuation)</span>
          <span className="text-[#e5566f]">── CHoCH (Trend Reversal)</span>
          <span className="text-[#38bdf8]">● Retest Entry</span>
        </div>
      </div>

      <svg
        viewBox="0 0 860 375"
        className="w-full h-auto select-none"
        role="img"
        aria-label="62-candle Market Structure chart showing HH, HL, BOS, CHoCH, and Short Retest Setup Box"
      >
        {[75200, 75800, 76220, 76850, 77380].map((p) => (
          <line key={p} x1="14" y1={toY(p)} x2={chartW} y2={toY(p)} stroke="#131b2c" strokeWidth="1" />
        ))}

        <rect
          x={toX(28)}
          y={toY(76310)}
          width={chartW - toX(28)}
          height={toY(76150) - toY(76310)}
          fill="#e2a84b"
          fillOpacity="0.14"
        />
        <line
          x1={toX(29)}
          y1={toY(76220)}
          x2={toX(56)}
          y2={toY(76220)}
          stroke="#e5566f"
          strokeWidth="1.6"
          strokeDasharray="5 3"
        />

        <line
          x1={toX(7)}
          y1={toY(76120)}
          x2={toX(19)}
          y2={toY(76120)}
          stroke="#3fc07a"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x={toX(13)} y={toY(76120) - 7} textAnchor="middle" fill="#3fc07a" fontSize="10" fontWeight="600">
          BOS 1 (+Close)
        </text>

        <line
          x1={toX(22)}
          y1={toY(76850)}
          x2={toX(35)}
          y2={toY(76850)}
          stroke="#3fc07a"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x={toX(28)} y={toY(76850) - 7} textAnchor="middle" fill="#3fc07a" fontSize="10" fontWeight="600">
          BOS 2 (+Close)
        </text>

        <rect
          x={entryX}
          y={toY(slP)}
          width={chartW - entryX - 4}
          height={toY(entryP) - toY(slP)}
          fill="#e5566f"
          fillOpacity="0.20"
          stroke="#e5566f"
          strokeWidth="1.2"
        />
        <text x={entryX + 6} y={toY(slP) + 13} fill="#fda4af" fontSize="9.5" fontWeight="600">
          STOP-LOSS $76,640 (−1.0R)
        </text>

        <rect
          x={entryX}
          y={toY(entryP)}
          width={chartW - entryX - 4}
          height={toY(tp3P) - toY(entryP)}
          fill="#3fc07a"
          fillOpacity="0.14"
          stroke="#3fc07a"
          strokeWidth="1.2"
        />
        <line x1={entryX} y1={toY(tp1P)} x2={chartW - 4} y2={toY(tp1P)} stroke="#3fc07a" strokeDasharray="3 3" />
        <text x={entryX + 6} y={toY(tp1P) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP1 $75,840 (+1.0R · 40%)
        </text>
        <line x1={entryX} y1={toY(tp2P)} x2={chartW - 4} y2={toY(tp2P)} stroke="#3fc07a" strokeDasharray="3 3" />
        <text x={entryX + 6} y={toY(tp2P) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP2 $75,440 (+2.0R · 35%)
        </text>
        <text x={entryX + 6} y={toY(tp3P) - 5} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP3 $75,020 (+3.0R · 25%)
        </text>

        <line x1={entryX} y1={toY(entryP)} x2={chartW} y2={toY(entryP)} stroke="#38bdf8" strokeWidth="2" />

        {bars.map((b, i) => {
          const x = toX(i)
          const up = b.c >= b.o
          const col = up ? '#3fc07a' : '#e5566f'
          const top = Math.min(toY(b.o), toY(b.c))
          const h = Math.max(Math.abs(toY(b.c) - toY(b.o)), 2)
          return (
            <g key={i}>
              <line x1={x} y1={toY(b.h)} x2={x} y2={toY(b.l)} stroke={col} strokeWidth="1.2" />
              <rect x={x - 3.3} y={top} width="6.6" height={h} fill={col} rx="0.8" />
            </g>
          )
        })}

        <text x={toX(7)} y={toY(76120) - 14} textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="600">
          HH1
        </text>
        <text x={toX(13)} y={toY(75560) + 22} textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="600">
          HL1
        </text>
        <text x={toX(22)} y={toY(76850) - 14} textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="600">
          HH2
        </text>
        <rect x={toX(29) - 48} y={toY(76220) + 12} width="96" height="17" rx="2" fill="#0d1829" stroke="#38bdf8" strokeWidth="0.8" />
        <text x={toX(29)} y={toY(76220) + 24} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
          HL2 (Key Low)
        </text>

        <text x={toX(37)} y={toY(77380) - 14} textAnchor="middle" fill="#3fc07a" fontSize="10.5" fontWeight="600">
          HH3 ($77,380)
        </text>

        <rect x={toX(46) - 52} y={toY(77080) - 28} width="104" height="17" rx="2" fill="#2c1620" stroke="#e5566f" strokeWidth="0.8" />
        <text x={toX(46)} y={toY(77080) - 16} textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="600">
          LH (Failed High)
        </text>

        <rect x={toX(44) - 58} y={toY(76220) + 12} width="116" height="17" rx="2" fill="#2c1620" stroke="#e5566f" strokeWidth="0.8" />
        <text x={toX(44)} y={toY(76220) + 24} textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="600">
          CHoCH Breakdown
        </text>

        <circle cx={entryX} cy={toY(entryP)} r="5" fill="#38bdf8" stroke="#070b14" strokeWidth="1.5" />
        <rect x={entryX - 135} y={toY(entryP) - 34} width="150" height="20" rx="3" fill="#0d1829" stroke="#38bdf8" strokeWidth="1.2" />
        <text x={entryX - 60} y={toY(entryP) - 21} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
          SHORT RETEST ENTRY
        </text>

        <line x1={chartW} y1="12" x2={chartW} y2={chartH - 12} stroke="#262f45" />
        {[
          { p: '77,380.00', y: toY(77380), bg: '#1e293b', fg: '#cbd5e1' },
          { p: '76,640.00', y: toY(slP), bg: '#881337', fg: '#fda4af' },
          { p: '76,240.00', y: toY(entryP), bg: '#0284c7', fg: '#ffffff' },
          { p: '75,840.00', y: toY(tp1P), bg: '#247b50', fg: '#ffffff' },
          { p: '75,440.00', y: toY(tp2P), bg: '#247b50', fg: '#ffffff' },
          { p: '75,020.00', y: toY(tp3P), bg: '#166534', fg: '#86efac' },
        ].map((t, idx) => (
          <g key={idx}>
            <rect x={chartW + 5} y={t.y - 9} width="106" height="18" rx="2" fill={t.bg} />
            <text x={chartW + 12} y={t.y + 3.5} fill={t.fg} fontSize="10" fontWeight="600">
              {t.p}
            </text>
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1a2030] text-xs [font-variant-numeric:tabular-nums]">
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#94a3b8] text-[11px]">1. Structure Shift</div>
          <div className="text-white font-semibold mt-0.5">CHoCH Below $76,220</div>
          <div className="text-[#64748b] text-[11px]">Candle closes below Key HL2</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#38bdf8] text-[11px]">2. Where to Enter</div>
          <div className="text-white font-semibold mt-0.5">Retest @ $76,240</div>
          <div className="text-[#64748b] text-[11px]">Wait for pullback to broken HL2</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#e5566f] text-[11px]">3. Stop-Loss (−1.0R)</div>
          <div className="text-white font-semibold mt-0.5">$76,640 ($400 Risk)</div>
          <div className="text-[#64748b] text-[11px]">Above retest wick &amp; supply zone</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#3fc07a] text-[11px]">4. Targets (+1.975R)</div>
          <div className="text-white font-semibold mt-0.5">$75,840 / $75,440 / $75,020</div>
          <div className="text-[#64748b] text-[11px]">40% @ 1R, 35% @ 2R, 25% @ 3.5R</div>
        </div>
      </div>
    </div>
  )
}

// 3. EMA 20 / 50 / 200 DYNAMIC RIBBON & PULLBACK SETUP (60 Continuous Bars)
function EmaRibbonVisual() {
  const bars = buildContinuousCandles(
    [
      { bar: 0, price: 76200 },
      { bar: 10, price: 76950 },
      { bar: 18, price: 76620 }, // Pullback #1 into 20/50 EMA pocket
      { bar: 28, price: 77680 },
      { bar: 36, price: 77250 }, // Pullback #2 into 20/50 EMA pocket
      { bar: 44, price: 78150 },
      { bar: 49, price: 77760 }, // Pullback #3 into 20/50 EMA pocket -> LONG ENTRY TRIGGER ($77,800)
      { bar: 60, price: 78980 }, // Expansion into TP1 & TP2
    ],
    52
  )

  const ema20 = computeSimpleEma(bars, 9, -80)
  const ema50 = computeSimpleEma(bars, 22, -260)
  const ema200 = bars.map((_, i) => 75850 + i * 24)

  const minP = 75700
  const maxP = 79350
  const chartW = 745
  const chartH = 350
  const toY = (p: number) => 20 + ((maxP - p) / (maxP - minP)) * (chartH - 40)
  const toX = (i: number) => 22 + i * 11.8

  const ribbonPolygon = [
    ...bars.map((_, i) => `${toX(i)},${toY(ema20[i])}`),
    ...[...bars].map((_, idx) => {
      const i = bars.length - 1 - idx
      return `${toX(i)},${toY(ema50[i])}`
    }),
  ].join(' ')

  const entryIdx = 49
  const entryX = toX(entryIdx)
  const entryP = 77800
  const slP = 77300
  const tp1P = 78300
  const tp2P = 78800
  const tp3P = 79250

  return (
    <div data-ui className="my-6 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1a2030]">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-white">
            EMA 20 / 50 / 200 Trend Ribbon &amp; Dynamic Value Pocket Entry Setup (60 Bars)
          </div>
          <div className="text-xs text-[#94a3b8]">
            Never chase extended green candles; wait for price to pull back into the shaded 20–50 EMA pocket above a rising 200 EMA
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs [font-variant-numeric:tabular-nums]">
          <span className="text-[#38bdf8]">── EMA 20</span>
          <span className="text-[#e2a84b]">── EMA 50</span>
          <span className="text-[#cbd5e1]">── EMA 200 (Regime Floor)</span>
        </div>
      </div>

      <svg
        viewBox="0 0 860 355"
        className="w-full h-auto select-none"
        role="img"
        aria-label="60-candle chart showing EMA 20, 50, 200 ribbon and Pullback Entry Setup Box"
      >
        {[76000, 76800, 77800, 78800].map((p) => (
          <line key={p} x1="14" y1={toY(p)} x2={chartW} y2={toY(p)} stroke="#131b2c" />
        ))}

        <polygon points={ribbonPolygon} fill="#38bdf8" fillOpacity="0.12" />

        <polyline
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeDasharray="5 3"
          points={ema200.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')}
        />
        <polyline
          fill="none"
          stroke="#e2a84b"
          strokeWidth="2"
          points={ema50.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')}
        />
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          points={ema20.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')}
        />

        <rect
          x={entryX}
          y={toY(tp3P)}
          width={chartW - entryX - 4}
          height={toY(entryP) - toY(tp3P)}
          fill="#3fc07a"
          fillOpacity="0.14"
          stroke="#3fc07a"
          strokeWidth="1.2"
        />
        <line x1={entryX} y1={toY(tp1P)} x2={chartW - 4} y2={toY(tp1P)} stroke="#3fc07a" strokeDasharray="3 3" />
        <text x={entryX + 6} y={toY(tp1P) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP1 $78,300 (+1.0R)
        </text>
        <line x1={entryX} y1={toY(tp2P)} x2={chartW - 4} y2={toY(tp2P)} stroke="#3fc07a" strokeDasharray="3 3" />
        <text x={entryX + 6} y={toY(tp2P) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP2 $78,800 (+2.0R)
        </text>
        <text x={entryX + 6} y={toY(tp3P) + 12} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP3 (+3.5R)
        </text>

        <rect
          x={entryX}
          y={toY(entryP)}
          width={chartW - entryX - 4}
          height={toY(slP) - toY(entryP)}
          fill="#e5566f"
          fillOpacity="0.20"
          stroke="#e5566f"
          strokeWidth="1.2"
        />
        <text x={entryX + 6} y={toY(slP) - 5} fill="#fda4af" fontSize="9.5" fontWeight="600">
          SL $77,300 (Below 50 EMA)
        </text>

        <line x1={entryX} y1={toY(entryP)} x2={chartW} y2={toY(entryP)} stroke="#38bdf8" strokeWidth="2" />

        {bars.map((b, i) => {
          const x = toX(i)
          const up = b.c >= b.o
          const col = up ? '#3fc07a' : '#e5566f'
          const top = Math.min(toY(b.o), toY(b.c))
          const h = Math.max(Math.abs(toY(b.c) - toY(b.o)), 2)
          return (
            <g key={i}>
              <line x1={x} y1={toY(b.h)} x2={x} y2={toY(b.l)} stroke={col} strokeWidth="1.2" />
              <rect x={x - 3.4} y={top} width="6.8" height={h} fill={col} rx="0.8" />
            </g>
          )
        })}

        <circle cx={toX(18)} cy={toY(76620)} r="5" fill="none" stroke="#38bdf8" strokeWidth="1.8" />
        <text x={toX(18)} y={toY(76620) + 18} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
          Pullback #1 (20/50 Pocket)
        </text>

        <circle cx={toX(36)} cy={toY(77250)} r="5" fill="none" stroke="#38bdf8" strokeWidth="1.8" />
        <text x={toX(36)} y={toY(77250) + 18} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
          Pullback #2 (20/50 Pocket)
        </text>

        <circle cx={entryX} cy={toY(entryP)} r="5" fill="#38bdf8" stroke="#070b14" strokeWidth="1.5" />
        <rect x={entryX - 165} y={toY(entryP) - 10} width="155" height="20" rx="3" fill="#0d1829" stroke="#38bdf8" strokeWidth="1.2" />
        <text x={entryX - 87} y={toY(entryP) + 3.5} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
          PULLBACK ENTRY @ $77,800 →
        </text>

        <text x={toX(42)} y={toY(ema200[42]) + 18} fill="#cbd5e1" fontSize="10" fontWeight="600">
          200 EMA Bullish Regime Filter (Price &gt; 200 EMA)
        </text>

        <line x1={chartW} y1="12" x2={chartW} y2={chartH - 12} stroke="#262f45" />
        {[
          { p: '78,800.00', y: toY(tp2P), bg: '#247b50', fg: '#ffffff' },
          { p: '78,300.00', y: toY(tp1P), bg: '#247b50', fg: '#ffffff' },
          { p: '77,800.00', y: toY(entryP), bg: '#0284c7', fg: '#ffffff' },
          { p: '77,300.00', y: toY(slP), bg: '#881337', fg: '#fda4af' },
          { p: '77,290.00', y: toY(ema200[59]), bg: '#1e293b', fg: '#cbd5e1' },
        ].map((t, idx) => (
          <g key={idx}>
            <rect x={chartW + 5} y={t.y - 9} width="106" height="18" rx="2" fill={t.bg} />
            <text x={chartW + 12} y={t.y + 3.5} fill={t.fg} fontSize="10" fontWeight="600">
              {t.p}
            </text>
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1a2030] text-xs [font-variant-numeric:tabular-nums]">
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#94a3b8] text-[11px]">1. Regime Filter</div>
          <div className="text-white font-semibold mt-0.5">Price &gt; 200 EMA</div>
          <div className="text-[#64748b] text-[11px]">20 EMA &gt; 50 EMA &gt; 200 EMA</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#38bdf8] text-[11px]">2. Where to Enter</div>
          <div className="text-white font-semibold mt-0.5">20/50 EMA Pocket ($77,800)</div>
          <div className="text-[#64748b] text-[11px]">Enter on bullish bounce candle</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#e5566f] text-[11px]">3. Stop-Loss (−1.0R)</div>
          <div className="text-white font-semibold mt-0.5">$77,300 ($500 Risk)</div>
          <div className="text-[#64748b] text-[11px]">Below 50 EMA &amp; pullback low</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#3fc07a] text-[11px]">4. Targets (+1.975R)</div>
          <div className="text-white font-semibold mt-0.5">$78,300 / $78,800 / $79,550</div>
          <div className="text-[#64748b] text-[11px]">Scale out into trend extension</div>
        </div>
      </div>
    </div>
  )
}

// 4. RSI (14) REGULAR & HIDDEN DIVERGENCE DUAL-PANE VISUAL (58 Continuous Bars)
function RsiDivergenceVisual() {
  const bars = buildContinuousCandles(
    [
      { bar: 0, price: 77450 },
      { bar: 10, price: 76420 }, // Trough 1: Price $76,420 | RSI 24.2
      { bar: 18, price: 77080 },
      { bar: 27, price: 76110 }, // Trough 2: Price Lower Low $76,110 | RSI Higher Low 33.8!
      { bar: 30, price: 76800 }, // <-- LONG ENTRY TRIGGER BAR (Reversal confirmation)
      { bar: 40, price: 77850 },
      { bar: 47, price: 77120 }, // Hidden Bullish Div: Price Higher Low $77,120 | RSI Lower Low 35.0
      { bar: 58, price: 78650 },
    ],
    55
  )

  // Deterministic RSI curve matching the exact price troughs & peaks
  const rsiWaypoints = [
    { bar: 0, price: 54 },
    { bar: 10, price: 24.2 },
    { bar: 18, price: 52 },
    { bar: 27, price: 33.8 },
    { bar: 30, price: 49 },
    { bar: 40, price: 68 },
    { bar: 47, price: 35.0 },
    { bar: 58, price: 72 },
  ]
  const rsiBars = buildContinuousCandles(rsiWaypoints, 2.2)

  const chartW = 745
  const pToY = (p: number) => 20 + ((78900 - p) / (78900 - 75850)) * 210
  const rToY = (r: number) => 262 + ((90 - r) / 80) * 115
  const toX = (i: number) => 22 + i * 12.2

  const entryIdx = 29
  const entryX = toX(entryIdx)
  const entryP = 76800
  const slP = 76050
  const tp1P = 77550
  const tp2P = 78300

  return (
    <div data-ui className="my-6 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1a2030]">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-white">
            Synchronized Price &amp; RSI(14) Sub-Pane: Regular Bullish Divergence Entry Setup (58 Bars)
          </div>
          <div className="text-xs text-[#94a3b8]">
            Price prints a Lower Low ($76,420 → $76,110) while RSI prints a Higher Low (24.2 → 33.8); enter on the bullish confirmation close
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs [font-variant-numeric:tabular-nums]">
          <span className="text-[#3fc07a]">── Regular Bullish Div</span>
          <span className="text-[#e2a84b]">── Hidden Bullish Div</span>
        </div>
      </div>

      <svg
        viewBox="0 0 860 400"
        className="w-full h-auto select-none"
        role="img"
        aria-label="58-candle dual-pane chart with Price on top and RSI 14 below showing Regular and Hidden Bullish Divergence"
      >
        {[76200, 77000, 77800, 78600].map((p) => (
          <line key={p} x1="14" y1={pToY(p)} x2={chartW} y2={pToY(p)} stroke="#131b2c" />
        ))}

        <rect
          x={entryX}
          y={pToY(tp2P)}
          width={toX(44) - entryX}
          height={pToY(entryP) - pToY(tp2P)}
          fill="#3fc07a"
          fillOpacity="0.14"
          stroke="#3fc07a"
          strokeWidth="1.2"
        />
        <line x1={entryX} y1={pToY(tp1P)} x2={toX(44)} y2={pToY(tp1P)} stroke="#3fc07a" strokeDasharray="3 3" />
        <text x={entryX + 6} y={pToY(tp1P) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP1 $77,550 (+1.0R)
        </text>
        <text x={entryX + 6} y={pToY(tp2P) + 12} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP2 $78,300 (+2.0R)
        </text>

        <rect
          x={entryX}
          y={pToY(entryP)}
          width={toX(44) - entryX}
          height={pToY(slP) - pToY(entryP)}
          fill="#e5566f"
          fillOpacity="0.20"
          stroke="#e5566f"
          strokeWidth="1.2"
        />
        <text x={entryX + 6} y={pToY(slP) - 5} fill="#fda4af" fontSize="9.5" fontWeight="600">
          SL $76,050 (−1.0R Below Div Low)
        </text>
        <line x1={entryX} y1={pToY(entryP)} x2={toX(44)} y2={pToY(entryP)} stroke="#38bdf8" strokeWidth="2" />

        {bars.map((b, i) => {
          const x = toX(i)
          const up = b.c >= b.o
          const col = up ? '#3fc07a' : '#e5566f'
          const top = Math.min(pToY(b.o), pToY(b.c))
          const h = Math.max(Math.abs(pToY(b.c) - pToY(b.o)), 2)
          return (
            <g key={i}>
              <line x1={x} y1={pToY(b.h)} x2={x} y2={pToY(b.l)} stroke={col} strokeWidth="1.2" />
              <rect x={x - 3.4} y={top} width="6.8" height={h} fill={col} rx="0.8" />
            </g>
          )
        })}

        <line x1={toX(9)} y1={pToY(76360)} x2={toX(26)} y2={pToY(76050)} stroke="#e5566f" strokeWidth="2" />
        <text x={toX(17)} y={pToY(76050) + 15} textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="600">
          Price: Lower Low ($76,420 → $76,110)
        </text>

        <circle cx={entryX} cy={pToY(entryP)} r="5" fill="#38bdf8" stroke="#070b14" strokeWidth="1.5" />
        <rect x={entryX - 150} y={pToY(entryP) - 24} width="142" height="19" rx="3" fill="#0d1829" stroke="#38bdf8" strokeWidth="1.1" />
        <text x={entryX - 79} y={pToY(entryP) - 11} textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="600">
          CONFIRMATION ENTRY →
        </text>

        <line x1="14" y1="248" x2={chartW} y2="248" stroke="#262f45" strokeWidth="1" />
        <text x="20" y="264" fill="#94a3b8" fontSize="10" fontWeight="600">
          RSI (14) SUB-PANE (30 Oversold / 70 Overbought)
        </text>

        <rect x="14" y={rToY(70)} width={chartW - 14} height={rToY(30) - rToY(70)} fill="#1e293b" fillOpacity="0.28" />
        <line x1="14" y1={rToY(70)} x2={chartW} y2={rToY(70)} stroke="#e5566f" strokeDasharray="3 3" strokeWidth="0.9" />
        <line x1="14" y1={rToY(50)} x2={chartW} y2={rToY(50)} stroke="#475569" strokeDasharray="2 2" strokeWidth="0.7" />
        <line x1="14" y1={rToY(30)} x2={chartW} y2={rToY(30)} stroke="#3fc07a" strokeDasharray="3 3" strokeWidth="0.9" />

        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          points={rsiBars.map((r, i) => `${toX(i)},${rToY(r.c)}`).join(' ')}
        />

        <line x1={toX(9)} y1={rToY(24.2)} x2={toX(26)} y2={rToY(33.8)} stroke="#3fc07a" strokeWidth="2.2" />
        <circle cx={toX(9)} cy={rToY(24.2)} r="4" fill="#3fc07a" />
        <circle cx={toX(26)} cy={rToY(33.8)} r="4" fill="#3fc07a" />
        <text x={toX(17)} y={rToY(24.2) + 15} textAnchor="middle" fill="#3fc07a" fontSize="10" fontWeight="600">
          RSI: Higher Low (24.2 → 33.8 · Seller Exhaustion)
        </text>

        <line x1={toX(26)} y1={rToY(33.8)} x2={toX(46)} y2={rToY(35.0)} stroke="#e2a84b" strokeWidth="1.8" strokeDasharray="4 2" />
        <circle cx={toX(46)} cy={rToY(35.0)} r="4" fill="#e2a84b" />
        <text x={toX(46)} y={rToY(35.0) + 15} textAnchor="middle" fill="#e2a84b" fontSize="10" fontWeight="600">
          Hidden Div Reset (35.0)
        </text>

        <line x1={chartW} y1="12" x2={chartW} y2="390" stroke="#262f45" />
        <text x={chartW + 8} y={rToY(70) + 3} fill="#e5566f" fontSize="10" fontWeight="600">
          RSI 70
        </text>
        <text x={chartW + 8} y={rToY(50) + 3} fill="#94a3b8" fontSize="10">
          RSI 50
        </text>
        <text x={chartW + 8} y={rToY(30) + 3} fill="#3fc07a" fontSize="10" fontWeight="600">
          RSI 30
        </text>
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1a2030] text-xs [font-variant-numeric:tabular-nums]">
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#94a3b8] text-[11px]">1. Divergence Signal</div>
          <div className="text-white font-semibold mt-0.5">Price LL + RSI HL</div>
          <div className="text-[#64748b] text-[11px]">Downward velocity is exhausting</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#38bdf8] text-[11px]">2. Where to Enter</div>
          <div className="text-white font-semibold mt-0.5">Confirmation @ $76,800</div>
          <div className="text-[#64748b] text-[11px]">Wait for bullish structure close</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#e5566f] text-[11px]">3. Stop-Loss (−1.0R)</div>
          <div className="text-white font-semibold mt-0.5">$76,050</div>
          <div className="text-[#64748b] text-[11px]">Below the 2nd divergence trough</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#3fc07a] text-[11px]">4. Targets (+1.975R)</div>
          <div className="text-white font-semibold mt-0.5">$77,400 / $78,000 / $78,900</div>
          <div className="text-[#64748b] text-[11px]">40% @ 1R, 35% @ 2R, 25% @ 3.5R</div>
        </div>
      </div>
    </div>
  )
}

// 5. MACD (12, 26, 9) DUAL-PANE MOMENTUM & HISTOGRAM VISUAL (56 Continuous Bars)
function MacdMomentumVisual() {
  const bars = buildContinuousCandles(
    [
      { bar: 0, price: 77400 },
      { bar: 12, price: 76750 },
      { bar: 20, price: 76980 }, // Bullish MACD crossover
      { bar: 28, price: 77500 }, // <-- LONG ENTRY TRIGGER BAR (MACD crosses Zero Line with expanding histogram)
      { bar: 42, price: 78850 }, // Peak momentum, histogram begins contracting
      { bar: 55, price: 78220 },
    ],
    52
  )

  const ema12 = computeSimpleEma(bars, 7, -40)
  const ema26 = computeSimpleEma(bars, 16, 80)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const sigLine: number[] = []
  let s = macdLine[0]
  const kSig = 2 / 7
  for (let i = 0; i < macdLine.length; i++) {
    s = (macdLine[i] - s) * kSig + s
    sigLine.push(s)
  }
  const hist = macdLine.map((m, i) => m - sigLine[i])

  const chartW = 745
  const pToY = (p: number) => 20 + ((79200 - p) / (79200 - 76500)) * 205
  const zeroY = 320
  const maxM = Math.max(...macdLine.map(Math.abs), ...sigLine.map(Math.abs), 120)
  const mToY = (v: number) => zeroY - (v / maxM) * 58
  const toX = (i: number) => 24 + i * 12.6

  const entryIdx = 27
  const entryX = toX(entryIdx)
  const entryP = 77500
  const slP = 77000
  const tp1P = 78000
  const tp2P = 78500
  const tp3P = 79050

  return (
    <div data-ui className="my-6 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1a2030]">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-white">
            MACD (12, 26, 9) Dual-Pane: Zero-Line Breakout Setup &amp; Histogram Contraction (55 Bars)
          </div>
          <div className="text-xs text-[#94a3b8]">
            Enter when MACD crosses above the Signal line &amp; Zero Line (0.0) with expanding green histogram bars
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs [font-variant-numeric:tabular-nums]">
          <span className="text-[#38bdf8]">── MACD Line</span>
          <span className="text-[#e2a84b]">── Signal Line</span>
          <span className="text-[#3fc07a]">■ Histogram</span>
        </div>
      </div>

      <svg
        viewBox="0 0 860 395"
        className="w-full h-auto select-none"
        role="img"
        aria-label="55-candle chart with MACD 12, 26, 9 sub-pane and Zero-Line Breakout Trade Setup Box"
      >
        {[76800, 77500, 78200, 78900].map((p) => (
          <line key={p} x1="14" y1={pToY(p)} x2={chartW} y2={pToY(p)} stroke="#131b2c" />
        ))}

        <rect
          x={entryX}
          y={pToY(tp3P)}
          width={toX(48) - entryX}
          height={pToY(entryP) - pToY(tp3P)}
          fill="#3fc07a"
          fillOpacity="0.14"
          stroke="#3fc07a"
          strokeWidth="1.2"
        />
        <line x1={entryX} y1={pToY(tp1P)} x2={toX(48)} y2={pToY(tp1P)} stroke="#3fc07a" strokeDasharray="3 3" />
        <text x={entryX + 6} y={pToY(tp1P) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP1 $78,000 (+1.0R)
        </text>
        <line x1={entryX} y1={pToY(tp2P)} x2={toX(48)} y2={pToY(tp2P)} stroke="#3fc07a" strokeDasharray="3 3" />
        <text x={entryX + 6} y={pToY(tp2P) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP2 $78,500 (+2.0R)
        </text>
        <text x={entryX + 6} y={pToY(tp3P) + 12} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP3 $79,250 (+3.5R)
        </text>

        <rect
          x={entryX}
          y={pToY(entryP)}
          width={toX(48) - entryX}
          height={pToY(slP) - pToY(entryP)}
          fill="#e5566f"
          fillOpacity="0.20"
          stroke="#e5566f"
          strokeWidth="1.2"
        />
        <text x={entryX + 6} y={pToY(slP) - 5} fill="#fda4af" fontSize="9.5" fontWeight="600">
          SL $77,000 (−1.0R)
        </text>
        <line x1={entryX} y1={pToY(entryP)} x2={toX(48)} y2={pToY(entryP)} stroke="#38bdf8" strokeWidth="2" />

        {bars.map((b, i) => {
          const x = toX(i)
          const up = b.c >= b.o
          const col = up ? '#3fc07a' : '#e5566f'
          const top = Math.min(pToY(b.o), pToY(b.c))
          const h = Math.max(Math.abs(pToY(b.c) - pToY(b.o)), 2)
          return (
            <g key={i}>
              <line x1={x} y1={pToY(b.h)} x2={x} y2={pToY(b.l)} stroke={col} strokeWidth="1.2" />
              <rect x={x - 3.4} y={top} width="6.8" height={h} fill={col} rx="0.8" />
            </g>
          )
        })}

        <circle cx={entryX} cy={pToY(entryP)} r="5" fill="#38bdf8" stroke="#070b14" strokeWidth="1.5" />
        <rect x={entryX - 165} y={pToY(entryP) - 10} width="155" height="20" rx="3" fill="#0d1829" stroke="#38bdf8" strokeWidth="1.2" />
        <text x={entryX - 87} y={pToY(entryP) + 3.5} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
          ZERO-LINE BREAK ENTRY →
        </text>

        <line x1="14" y1="242" x2={chartW} y2="242" stroke="#262f45" />
        <text x="20" y="258" fill="#94a3b8" fontSize="10" fontWeight="600">
          MACD (12, 26, 9) SUB-PANE
        </text>

        <line x1="14" y1={zeroY} x2={chartW} y2={zeroY} stroke="#475569" strokeDasharray="3 3" />

        {hist.map((hVal, i) => {
          const x = toX(i)
          const yVal = mToY(hVal * 1.6)
          const top = Math.min(zeroY, yVal)
          const bh = Math.max(Math.abs(zeroY - yVal), 1.5)
          const col = hVal >= 0 ? '#3fc07a' : '#e5566f'
          return <rect key={i} x={x - 3} y={top} width="6" height={bh} fill={col} fillOpacity="0.6" />
        })}

        <polyline
          fill="none"
          stroke="#e2a84b"
          strokeWidth="1.8"
          points={sigLine.map((v, i) => `${toX(i)},${mToY(v)}`).join(' ')}
        />
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          points={macdLine.map((v, i) => `${toX(i)},${mToY(v)}`).join(' ')}
        />

        <circle cx={entryX} cy={zeroY} r="4.5" fill="#38bdf8" />
        <text x={entryX} y="378" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
          MACD Crosses Above Zero Line (0.0)
        </text>
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1a2030] text-xs [font-variant-numeric:tabular-nums]">
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#94a3b8] text-[11px]">1. Momentum Shift</div>
          <div className="text-white font-semibold mt-0.5">MACD &gt; Signal &amp; &gt; 0</div>
          <div className="text-[#64748b] text-[11px]">12 EMA crosses above 26 EMA</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#38bdf8] text-[11px]">2. Where to Enter</div>
          <div className="text-white font-semibold mt-0.5">Breakout Close @ $77,500</div>
          <div className="text-[#64748b] text-[11px]">Expanding positive histogram</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#e5566f] text-[11px]">3. Stop-Loss (−1.0R)</div>
          <div className="text-white font-semibold mt-0.5">$77,000 ($500 Risk)</div>
          <div className="text-[#64748b] text-[11px]">Below impulse trigger bar low</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#3fc07a] text-[11px]">4. Early Exit Warning</div>
          <div className="text-white font-semibold mt-0.5">Histogram Contraction</div>
          <div className="text-[#64748b] text-[11px]">Scale out at TP1/TP2/TP3</div>
        </div>
      </div>
    </div>
  )
}

// 6. BOLLINGER BANDS SQUEEZE & 1.5x ATR STOP-LOSS VISUAL (60 Continuous Bars)
function BollingerAtrVisual() {
  const bars = buildContinuousCandles(
    [
      { bar: 0, price: 78100 },
      { bar: 8, price: 77450 },
      { bar: 15, price: 77820 },
      { bar: 22, price: 77680 }, // Volatility compresses into tight Bollinger Squeeze
      { bar: 30, price: 77740 },
      { bar: 38, price: 77690 },
      { bar: 41, price: 78000 }, // <-- BREAKOUT ENTRY BAR (Closes outside Upper Band!)
      { bar: 50, price: 79250 },
      { bar: 58, price: 80100 }, // Hits TP3 ($80,100)
    ],
    38
  )

  const mid = computeSimpleEma(bars, 10, 0)
  const upper = mid.map((m, i) => {
    const isSqueeze = i >= 16 && i <= 38
    const width = isSqueeze ? 160 : i > 38 ? 480 : 380
    return m + width
  })
  const lower = mid.map((m, i) => {
    const isSqueeze = i >= 16 && i <= 38
    const width = isSqueeze ? 160 : i > 38 ? 480 : 380
    return m - width
  })

  const minP = 76900
  const maxP = 80450
  const chartW = 745
  const chartH = 350
  const toY = (p: number) => 20 + ((maxP - p) / (maxP - minP)) * (chartH - 40)
  const toX = (i: number) => 22 + i * 12.1

  const bandPoly = [
    ...bars.map((_, i) => `${toX(i)},${toY(upper[i])}`),
    ...[...bars].map((_, idx) => {
      const i = bars.length - 1 - idx
      return `${toX(i)},${toY(lower[i])}`
    }),
  ].join(' ')

  const entryIdx = 40
  const entryX = toX(entryIdx)
  const entryP = 78000
  const slP = 77400 // 1.5x ATR(14) = $600 below entry
  const tp1P = 78600
  const tp2P = 79200
  const tp3P = 80100

  return (
    <div data-ui className="my-6 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1a2030]">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-white">
            Bollinger Band (20, 2σ) Squeeze Breakout &amp; 1.5× ATR(14) Stop-Loss Setup (58 Bars)
          </div>
          <div className="text-xs text-[#94a3b8]">
            Wait for the bands to pinch into a tight Squeeze, enter on a decisive candle close outside the Upper Band, and size Stop-Loss at 1.5× ATR
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs [font-variant-numeric:tabular-nums]">
          <span className="text-[#38bdf8]">── Bollinger Bands (±2σ)</span>
          <span className="text-[#e2a84b]">── Squeeze Zone</span>
          <span className="text-[#e5566f]">── 1.5× ATR Stop</span>
        </div>
      </div>

      <svg
        viewBox="0 0 860 355"
        className="w-full h-auto select-none"
        role="img"
        aria-label="58-candle chart showing Bollinger Band Squeeze, Breakout Entry, and 1.5x ATR Stop-Loss Box"
      >
        {[77400, 78000, 78600, 79200, 80100].map((p) => (
          <line key={p} x1="14" y1={toY(p)} x2={chartW} y2={toY(p)} stroke="#131b2c" />
        ))}

        <polygon points={bandPoly} fill="#38bdf8" fillOpacity="0.10" />

        <rect
          x={toX(16)}
          y={toY(77980)}
          width={toX(38) - toX(16)}
          height={toY(77480) - toY(77980)}
          rx="3"
          fill="none"
          stroke="#e2a84b"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x={toX(27)} y={toY(77980) - 8} textAnchor="middle" fill="#e2a84b" fontSize="10" fontWeight="600">
          Bollinger Band Squeeze (Volatility Compression)
        </text>

        <polyline fill="none" stroke="#38bdf8" strokeWidth="1.5" points={upper.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')} />
        <polyline fill="none" stroke="#94a3b8" strokeWidth="1.1" strokeDasharray="3 3" points={mid.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')} />
        <polyline fill="none" stroke="#38bdf8" strokeWidth="1.5" points={lower.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')} />

        <rect
          x={entryX}
          y={toY(tp3P)}
          width={chartW - entryX - 4}
          height={toY(entryP) - toY(tp3P)}
          fill="#3fc07a"
          fillOpacity="0.14"
          stroke="#3fc07a"
          strokeWidth="1.2"
        />
        <line x1={entryX} y1={toY(tp1P)} x2={chartW - 4} y2={toY(tp1P)} stroke="#3fc07a" strokeDasharray="3 3" />
        <text x={entryX + 6} y={toY(tp1P) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP1 $78,600 (+1.0R)
        </text>
        <line x1={entryX} y1={toY(tp2P)} x2={chartW - 4} y2={toY(tp2P)} stroke="#3fc07a" strokeDasharray="3 3" />
        <text x={entryX + 6} y={toY(tp2P) - 4} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP2 $79,200 (+2.0R)
        </text>
        <text x={entryX + 6} y={toY(tp3P) + 12} fill="#86efac" fontSize="9.5" fontWeight="600">
          TP3 $80,100 (+3.5R)
        </text>

        <rect
          x={entryX}
          y={toY(entryP)}
          width={chartW - entryX - 4}
          height={toY(slP) - toY(entryP)}
          fill="#e5566f"
          fillOpacity="0.20"
          stroke="#e5566f"
          strokeWidth="1.2"
        />
        <text x={entryX + 6} y={toY(slP) - 5} fill="#fda4af" fontSize="9.5" fontWeight="600">
          SL = Entry − 1.5×ATR ($77,400)
        </text>
        <line x1={entryX} y1={toY(entryP)} x2={chartW} y2={toY(entryP)} stroke="#38bdf8" strokeWidth="2" />

        {bars.map((b, i) => {
          const x = toX(i)
          const up = b.c >= b.o
          const col = up ? '#3fc07a' : '#e5566f'
          const top = Math.min(toY(b.o), toY(b.c))
          const h = Math.max(Math.abs(toY(b.c) - toY(b.o)), 2)
          return (
            <g key={i}>
              <line x1={x} y1={toY(b.h)} x2={x} y2={toY(b.l)} stroke={col} strokeWidth="1.2" />
              <rect x={x - 3.4} y={top} width="6.8" height={h} fill={col} rx="0.8" />
            </g>
          )
        })}

        <circle cx={entryX} cy={toY(entryP)} r="5" fill="#38bdf8" stroke="#070b14" strokeWidth="1.5" />
        <rect x={entryX - 165} y={toY(entryP) - 32} width="160" height="20" rx="3" fill="#0d1829" stroke="#38bdf8" strokeWidth="1.2" />
        <text x={entryX - 85} y={toY(entryP) - 19} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
          SQUEEZE BREAKOUT ENTRY
        </text>

        <line x1={chartW} y1="12" x2={chartW} y2={chartH - 12} stroke="#262f45" />
        {[
          { p: '80,100.00', y: toY(tp3P), bg: '#166534', fg: '#86efac' },
          { p: '79,200.00', y: toY(tp2P), bg: '#247b50', fg: '#ffffff' },
          { p: '78,600.00', y: toY(tp1P), bg: '#247b50', fg: '#ffffff' },
          { p: '78,000.00', y: toY(entryP), bg: '#0284c7', fg: '#ffffff' },
          { p: '77,400.00', y: toY(slP), bg: '#881337', fg: '#fda4af' },
        ].map((t, idx) => (
          <g key={idx}>
            <rect x={chartW + 5} y={t.y - 9} width="106" height="18" rx="2" fill={t.bg} />
            <text x={chartW + 12} y={t.y + 3.5} fill={t.fg} fontSize="10" fontWeight="600">
              {t.p}
            </text>
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1a2030] text-xs [font-variant-numeric:tabular-nums]">
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#e2a84b] text-[11px]">1. Volatility Setup</div>
          <div className="text-white font-semibold mt-0.5">20, 2σ Band Squeeze</div>
          <div className="text-[#64748b] text-[11px]">Standard deviation narrows</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#38bdf8] text-[11px]">2. Where to Enter</div>
          <div className="text-white font-semibold mt-0.5">Upper Band Close ($78,000)</div>
          <div className="text-[#64748b] text-[11px]">Candle closes outside Upper Band</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#e5566f] text-[11px]">3. ATR Stop-Loss (−1.0R)</div>
          <div className="text-white font-semibold mt-0.5">$77,400 (1.5× ATR = $600)</div>
          <div className="text-[#64748b] text-[11px]">Outside normal bar noise</div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[#3fc07a] text-[11px]">4. Targets (+1.975R)</div>
          <div className="text-white font-semibold mt-0.5">$78,600 / $79,200 / $80,100</div>
          <div className="text-[#64748b] text-[11px]">40% @ 1R, 35% @ 2R, 25% @ 3.5R</div>
        </div>
      </div>
    </div>
  )
}

// 7. UNCORRELATED 4-FACTOR CONFLUENCE STACK VISUAL
function ConfluenceStackVisual() {
  const factors = [
    {
      dim: 'Factor 1 · Market Structure',
      signal: '4H Support/Resistance Polarity Flip Zone ($77,550–$77,650)',
      metric: '4 historical touches (R 3x → S 1x)',
      color: 'text-[#3fc07a]',
    },
    {
      dim: 'Factor 2 · Trend Filter',
      signal: 'Price trading above rising 200 EMA & pulling into 50 EMA pocket',
      metric: 'Bullish regime confirmed',
      color: 'text-[#38bdf8]',
    },
    {
      dim: 'Factor 3 · Momentum Velocity',
      signal: '14-period RSI Regular Bullish Divergence + MACD Zero-Line Cross',
      metric: 'Seller exhaustion verified',
      color: 'text-[#e2a84b]',
    },
    {
      dim: 'Factor 4 · Volatility & Bracket',
      signal: 'Stop-Loss sized at 1.5× ATR ($77,000) · Weighted TP1/TP2/TP3 Bracket',
      metric: 'Expected Full Target: +1.975R',
      color: 'text-white',
    },
  ]

  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1a2030]">
        <span className="text-xs font-semibold text-white">
          Orthogonal 4-Factor Confluence Stack (Zero Multicollinearity)
        </span>
        <span className="text-[11px] text-[#3fc07a] font-medium">
          4 / 4 Independent Dimensions Aligned
        </span>
      </div>

      <div className="divide-y divide-[#141a26] [font-variant-numeric:tabular-nums]">
        {factors.map((f, idx) => (
          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className={`text-xs font-semibold ${f.color}`}>{f.dim}: </span>
              <span className="text-xs text-[#cbd5e1]">{f.signal}</span>
            </div>
            <span className="text-[11px] text-[#94a3b8] shrink-0">{f.metric}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 8. LIMIT ORDER BOOK (LOB) DEPTH LADDER & SLIPPAGE VISUAL
function OrderBookDepthVisual() {
  const asks = [
    { price: 65030, size: 2.5, total: 5.5, pct: 100 },
    { price: 65020, size: 1.8, total: 3.0, pct: 55 },
    { price: 65010, size: 1.2, total: 1.2, pct: 22 },
  ]
  const bids = [
    { price: 65000, size: 1.5, total: 1.5, pct: 25 },
    { price: 64990, size: 2.1, total: 3.6, pct: 60 },
    { price: 64980, size: 3.4, total: 7.0, pct: 100 },
  ]

  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 [font-variant-numeric:tabular-nums]">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1a2030]">
        <span className="text-xs font-semibold text-white">
          BTC/USDT Limit Order Book (LOB) Depth Ladder &amp; Market Sweep Simulation
        </span>
        <span className="text-[11px] text-[#94a3b8]">
          Maker (Resting Limit) vs. Taker (Market Sweep)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded border border-[#1a2030] bg-[#0a0f1a] p-3 text-xs space-y-1.5">
          <div className="grid grid-cols-3 text-[11px] text-[#64748b] pb-1 border-b border-[#141a26]">
            <span>Price (USDT)</span>
            <span className="text-right">Size (BTC)</span>
            <span className="text-right">Cumulative</span>
          </div>

          {asks.map((a) => (
            <div key={a.price} className="relative grid grid-cols-3 py-1 px-1.5 rounded overflow-hidden">
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#e5566f]/15 pointer-events-none"
                style={{ width: `${a.pct}%` }}
              />
              <span className="relative text-[#e5566f] font-medium">${a.price.toLocaleString()}</span>
              <span className="relative text-right text-[#cbd5e1]">{a.size.toFixed(2)}</span>
              <span className="relative text-right text-[#94a3b8]">{a.total.toFixed(2)}</span>
            </div>
          ))}

          <div className="py-1.5 px-2 my-1 rounded bg-[#070b14] border border-[#1a2030] flex items-center justify-between text-[11px]">
            <span className="text-white font-medium">Bid–Ask Spread: $10.00</span>
            <span className="text-[#94a3b8]">0.015% (Tight Liquidity)</span>
          </div>

          {bids.map((b) => (
            <div key={b.price} className="relative grid grid-cols-3 py-1 px-1.5 rounded overflow-hidden">
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#3fc07a]/15 pointer-events-none"
                style={{ width: `${b.pct}%` }}
              />
              <span className="relative text-[#3fc07a] font-medium">${b.price.toLocaleString()}</span>
              <span className="relative text-right text-[#cbd5e1]">{b.size.toFixed(2)}</span>
              <span className="relative text-right text-[#94a3b8]">{b.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="rounded border border-[#1a2030] bg-[#0a0f1a] p-3 flex flex-col justify-between text-xs space-y-3">
          <div className="space-y-2">
            <div className="text-white font-semibold">
              Execution Trace: 4.00 BTC Market Buy (Taker)
            </div>
            <p className="text-[#94a3b8] leading-relaxed">
              A 4.00 BTC Market Order exceeds the 1.20 BTC resting at the best ask ($65,010) and walks up three levels of the order book:
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[#cbd5e1]">
                <span>Tier 1: 1.20 BTC @ $65,010</span>
                <span className="text-white">$78,012.00</span>
              </div>
              <div className="flex justify-between text-[#cbd5e1]">
                <span>Tier 2: 1.80 BTC @ $65,020</span>
                <span className="text-white">$117,036.00</span>
              </div>
              <div className="flex justify-between text-[#cbd5e1]">
                <span>Tier 3: 1.00 BTC @ $65,030</span>
                <span className="text-white">$65,030.00</span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#141a26] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Volume-Weighted Avg Price (VWAP):</span>
              <span className="text-white font-semibold">$65,019.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Adverse Slippage Cost vs. Best Ask:</span>
              <span className="text-[#e5566f] font-medium">+$9.50 / BTC ($38.00 total)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 9. ORDER TYPES EXECUTION MATRIX VISUAL
function OrderTypesMatrixVisual() {
  const rows = [
    {
      type: 'Limit Order',
      role: 'Maker (Adds Liquidity)',
      priceControl: 'Exact price or better',
      execCertainty: 'Not assured (waits for match)',
      bestUse: 'Patient pullbacks into S/R & EMA value zones; scaling out at TP1/TP2/TP3',
      color: 'text-[#3fc07a]',
    },
    {
      type: 'Market Order',
      role: 'Taker (Removes Liquidity)',
      priceControl: 'None (sweeps available book)',
      execCertainty: 'Immediate execution',
      bestUse: 'Emergency position exits or high-liquidity momentum triggers',
      color: 'text-[#38bdf8]',
    },
    {
      type: 'Stop-Market Order',
      role: 'Taker on Trigger',
      priceControl: 'Triggers at stop; fills at market',
      execCertainty: 'Immediate exit execution on trigger',
      bestUse: 'Mandatory protective Stop-Loss (-1.0R) to ensure capital exit',
      color: 'text-[#e5566f]',
    },
    {
      type: 'Stop-Limit Order',
      role: 'Limit posted on Trigger',
      priceControl: 'Strict limit price cap',
      execCertainty: 'Can be skipped in flash crashes!',
      bestUse: 'Breakout entries only · NEVER use for protective Stop-Losses',
      color: 'text-[#e2a84b]',
    },
  ]

  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs [font-variant-numeric:tabular-nums]">
        <thead>
          <tr className="border-b border-[#1a2030] bg-[#0a0f1a] text-[#94a3b8]">
            <th className="py-2.5 px-3.5 font-medium">Order Type</th>
            <th className="py-2.5 px-3.5 font-medium">Book Role</th>
            <th className="py-2.5 px-3.5 font-medium">Price Control</th>
            <th className="py-2.5 px-3.5 font-medium">Execution Certainty</th>
            <th className="py-2.5 px-3.5 font-medium">Institutional Use Case</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#141a26]">
          {rows.map((r) => (
            <tr key={r.type} className="hover:bg-[#0a0f1a]/60">
              <td className={`py-2.5 px-3.5 font-semibold ${r.color}`}>{r.type}</td>
              <td className="py-2.5 px-3.5 text-[#cbd5e1]">{r.role}</td>
              <td className="py-2.5 px-3.5 text-white">{r.priceControl}</td>
              <td className="py-2.5 px-3.5 text-[#cbd5e1]">{r.execCertainty}</td>
              <td className="py-2.5 px-3.5 text-[#94a3b8]">{r.bestUse}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 10. INTERACTIVE 1% POSITION SIZING CALCULATOR WIDGET
function PositionSizerVisual() {
  const [equity, setEquity] = useState<number>(10000)
  const [riskPct, setRiskPct] = useState<number>(1.0)
  const [entry, setEntry] = useState<number>(60000)
  const [sl, setSl] = useState<number>(58800)

  const riskDollars = (equity * riskPct) / 100
  const stopDist = Math.abs(entry - sl)
  const stopPct = entry > 0 ? (stopDist / entry) * 100 : 0
  const units = stopDist > 0 ? riskDollars / stopDist : 0
  const notional = units * entry
  const effLeverage = equity > 0 ? notional / equity : 0

  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 [font-variant-numeric:tabular-nums]">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1a2030]">
        <span className="text-xs font-semibold text-white">
          Interactive 1% Risk Position Sizing &amp; Exposure Calculator
        </span>
        <span className="text-[11px] text-[#3fc07a]">
          Formula: Units = (Equity × Risk%) / |Entry − SL|
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
        <div>
          <label className="block text-[#94a3b8] mb-1">Account Equity ($)</label>
          <input
            type="number"
            value={equity}
            onChange={(e) => setEquity(Math.max(100, Number(e.target.value) || 0))}
            className="w-full h-8 px-2.5 rounded bg-[#0a0f1a] border border-[#262f45] text-white focus:outline-none focus:border-[#ff2e54]"
          />
        </div>
        <div>
          <label className="block text-[#94a3b8] mb-1">Risk per Trade (%)</label>
          <input
            type="number"
            step="0.25"
            value={riskPct}
            onChange={(e) => setRiskPct(Math.min(10, Math.max(0.1, Number(e.target.value) || 0)))}
            className="w-full h-8 px-2.5 rounded bg-[#0a0f1a] border border-[#262f45] text-white focus:outline-none focus:border-[#ff2e54]"
          />
        </div>
        <div>
          <label className="block text-[#94a3b8] mb-1">Entry Price ($)</label>
          <input
            type="number"
            value={entry}
            onChange={(e) => setEntry(Math.max(1, Number(e.target.value) || 0))}
            className="w-full h-8 px-2.5 rounded bg-[#0a0f1a] border border-[#262f45] text-white focus:outline-none focus:border-[#ff2e54]"
          />
        </div>
        <div>
          <label className="block text-[#94a3b8] mb-1">Stop-Loss Price ($)</label>
          <input
            type="number"
            value={sl}
            onChange={(e) => setSl(Math.max(1, Number(e.target.value) || 0))}
            className="w-full h-8 px-2.5 rounded bg-[#0a0f1a] border border-[#262f45] text-white focus:outline-none focus:border-[#ff2e54]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t border-[#141a26] text-xs">
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[11px] text-[#94a3b8]">1R Capital Risk</div>
          <div className="text-sm font-semibold text-[#e5566f] mt-0.5">
            ${riskDollars.toFixed(2)}
          </div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[11px] text-[#94a3b8]">Stop Distance</div>
          <div className="text-sm font-semibold text-white mt-0.5">
            ${stopDist.toLocaleString()} ({stopPct.toFixed(2)}%)
          </div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[11px] text-[#94a3b8]">Position Size</div>
          <div className="text-sm font-semibold text-[#3fc07a] mt-0.5">
            {units.toFixed(4)} BTC
          </div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[11px] text-[#94a3b8]">Notional Value</div>
          <div className="text-sm font-semibold text-white mt-0.5">
            ${notional.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="rounded bg-[#0a0f1a] border border-[#1a2030] p-2.5">
          <div className="text-[11px] text-[#94a3b8]">Notional Ratio</div>
          <div className="text-sm font-semibold text-[#38bdf8] mt-0.5">
            {effLeverage.toFixed(2)}×
          </div>
        </div>
      </div>
    </div>
  )
}

// 11. ACTS TRUE WEIGHTED BRACKET MATH (+1.975R) VISUAL LADDER
function BracketRMathVisual() {
  const levels = [
    {
      label: 'TP3 · Final Runner Target (+3.5R)',
      price: '$63,500',
      weight: '25% of position',
      contrib: '+0.875R',
      rule: 'Closes final 25% runner; total realized return = +1.975R',
      color: 'text-[#3fc07a]',
      barBg: 'bg-[#3fc07a]',
    },
    {
      label: 'TP2 · Core Expansion Target (+2.0R)',
      price: '$62,000',
      weight: '35% of position',
      contrib: '+0.700R',
      rule: 'Locks in +0.700R; trails Stop-Loss on remaining 25% up to TP1 (+1.0R)',
      color: 'text-[#3fc07a]',
      barBg: 'bg-[#3fc07a]',
    },
    {
      label: 'TP1 · Risk-Off Target (+1.0R)',
      price: '$61,000',
      weight: '40% of position',
      contrib: '+0.400R',
      rule: 'Locks in +0.400R; moves Stop-Loss on remaining 60% to Breakeven ($60,000)',
      color: 'text-[#3fc07a]',
      barBg: 'bg-[#3fc07a]',
    },
    {
      label: 'ENTRY · Structural Trigger (0.0R)',
      price: '$60,000',
      weight: '100% initial size',
      contrib: '0.000R',
      rule: '1R Distance = $1,000 ($60,000 Entry − $59,000 Stop-Loss)',
      color: 'text-[#38bdf8]',
      barBg: 'bg-[#38bdf8]',
    },
    {
      label: 'STOP-LOSS · Structural Invalidation (−1.0R)',
      price: '$59,000',
      weight: '100% protected',
      contrib: '−1.000R',
      rule: 'Maximum loss capped strictly at 1.0% of account equity',
      color: 'text-[#e5566f]',
      barBg: 'bg-[#e5566f]',
    },
  ]

  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 [font-variant-numeric:tabular-nums]">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1a2030]">
        <span className="text-xs font-semibold text-white">
          ACTS True Weighted Exit Bracket Architecture (40% @ 1.0R · 35% @ 2.0R · 25% @ 3.5R)
        </span>
        <span className="text-xs font-semibold text-[#3fc07a]">
          Full TP3 Realized Return = +1.975R
        </span>
      </div>

      <div className="space-y-2">
        {levels.map((lv) => (
          <div
            key={lv.label}
            className="rounded border border-[#1a2030] bg-[#0a0f1a] p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <span className={`w-1.5 h-8 rounded-sm shrink-0 mt-0.5 ${lv.barBg}`} />
              <div>
                <div className={`font-semibold ${lv.color}`}>
                  {lv.label} · <span className="text-white">{lv.price}</span>
                </div>
                <div className="text-[#94a3b8] text-[11px] mt-0.5">{lv.rule}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:text-right shrink-0 pl-4 sm:pl-0">
              <span className="text-[#cbd5e1]">{lv.weight}</span>
              <span className={`font-semibold w-16 text-right ${lv.color}`}>{lv.contrib}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 12. INTERACTIVE 5-GATE PRE-TRADE INVARIANT CHECKLIST
function PreTradeChecklistVisual() {
  const gates = [
    {
      id: 'regime',
      title: 'Gate 1 · Higher-Timeframe Regime Alignment',
      desc: '4H/1D market structure (HH/HL or LH/LL) and 200 EMA slope align with trade direction.',
    },
    {
      id: 'invalidation',
      title: 'Gate 2 · Structural Invalidation Stop-Loss',
      desc: 'Stop-Loss is placed beyond a structural swing pivot and >= 1.5× ATR(14) outside noise.',
    },
    {
      id: 'sizing',
      title: 'Gate 3 · 1.0% Capital Risk Cap',
      desc: 'Position size calculated strictly via Units = (Equity × 0.01) / |Entry − SL|.',
    },
    {
      id: 'bracket',
      title: 'Gate 4 · True Weighted Bracket (+1.975R)',
      desc: 'TP1 (+1.0R, 40%), TP2 (+2.0R, 35%), and TP3 (+3.5R, 25%) limit orders pre-staged.',
    },
    {
      id: 'macro',
      title: 'Gate 5 · Macro Catalyst Clearance',
      desc: 'No Tier-1 release (CPI, NFP, FOMC Rate Decision) scheduled within the next 60 minutes.',
    },
  ]

  const [checked, setChecked] = useState<Record<string, boolean>>({
    regime: true,
    invalidation: true,
    sizing: true,
    bracket: true,
    macro: true,
  })

  const passedCount = Object.values(checked).filter(Boolean).length
  const allPassed = passedCount === gates.length

  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 [font-variant-numeric:tabular-nums]">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1a2030]">
        <span className="text-xs font-semibold text-white">
          Interactive ACTS 5-Gate Pre-Trade Execution Verification
        </span>
        <span
          className={`text-xs font-semibold ${
            allPassed ? 'text-[#3fc07a]' : 'text-[#e5566f]'
          }`}
        >
          {allPassed
            ? 'STATUS: CONFIRMED (1.0× SIZING AUTHORIZED)'
            : `STATUS: VETOED (${passedCount}/5 GATES PASSED · DO NOT ENTER)`}
        </span>
      </div>

      <div className="space-y-2">
        {gates.map((g) => {
          const isOn = Boolean(checked[g.id])
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setChecked((prev) => ({ ...prev, [g.id]: !prev[g.id] }))}
              className={`w-full text-left rounded border p-2.5 transition-colors flex items-start justify-between gap-3 ${
                isOn
                  ? 'border-[#1a2030] bg-[#0a0f1a]'
                  : 'border-[#e5566f]/40 bg-[#1a0f16]'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-white">{g.title}</div>
                <div className="text-[11px] text-[#94a3b8] mt-0.5">{g.desc}</div>
              </div>
              <span
                className={`text-xs font-semibold shrink-0 ${
                  isOn ? 'text-[#3fc07a]' : 'text-[#e5566f]'
                }`}
              >
                {isOn ? 'PASS' : 'FAIL'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 13. MACRO VISUALS (CPI Transmission, FOMC Tools, Yield Curve, DXY, Delta)
function MacroCpiTransmissionVisual() {
  const steps = [
    {
      step: '1. Catalyst Shock',
      hot: 'Core CPI prints hotter than consensus (e.g., 0.4% vs 0.2% forecast)',
      cool: 'Core CPI prints cooler than consensus (e.g., 0.1% vs 0.2% forecast)',
    },
    {
      step: '2. Fed Policy Repricing',
      hot: 'Fed Funds futures price out rate cuts; higher-for-longer terminal rate',
      cool: 'Fed Funds futures price in earlier/deeper FOMC interest rate cuts',
    },
    {
      step: '3. Sovereign Yields & DXY',
      hot: 'US 2Y & 10Y Treasury yields surge; US Dollar Index (DXY) rallies',
      cool: 'US 2Y & 10Y Treasury yields drop; US Dollar Index (DXY) weakens',
    },
    {
      step: '4. BTC Liquidity Impact',
      hot: 'Liquidity tightens → rapid downside sweep & margin flush in BTC',
      cool: 'Liquidity expands → risk-on impulse & upside breakout in BTC',
    },
  ]

  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs [font-variant-numeric:tabular-nums]">
        <thead>
          <tr className="border-b border-[#1a2030] bg-[#0a0f1a] text-[#94a3b8]">
            <th className="py-2.5 px-3.5 font-medium">Transmission Stage</th>
            <th className="py-2.5 px-3.5 font-medium text-[#e5566f]">Hawkish Shock (Hot CPI)</th>
            <th className="py-2.5 px-3.5 font-medium text-[#3fc07a]">Dovish Shock (Cool CPI)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#141a26]">
          {steps.map((s) => (
            <tr key={s.step}>
              <td className="py-2.5 px-3.5 font-semibold text-white">{s.step}</td>
              <td className="py-2.5 px-3.5 text-[#cbd5e1]">{s.hot}</td>
              <td className="py-2.5 px-3.5 text-[#cbd5e1]">{s.cool}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MacroFomcToolsVisual() {
  return (
    <div data-ui className="my-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      <div className="rounded-lg border border-[#1a2030] bg-[#070b14] p-4 space-y-2">
        <div className="text-white font-semibold border-b border-[#1a2030] pb-2">
          Tool 1 · Federal Funds Target Rate (Price of Money)
        </div>
        <p className="text-[#cbd5e1] leading-relaxed">
          <strong className="text-[#e5566f]">Rate Hikes:</strong> Raises overnight interbank borrowing cost, reprices sovereign yields higher, and cools credit expansion.
        </p>
        <p className="text-[#cbd5e1] leading-relaxed">
          <strong className="text-[#3fc07a]">Rate Cuts:</strong> Lowers cost of capital, reduces yield on cash reserves, and stimulates risk-asset allocation.
        </p>
      </div>
      <div className="rounded-lg border border-[#1a2030] bg-[#070b14] p-4 space-y-2">
        <div className="text-white font-semibold border-b border-[#1a2030] pb-2">
          Tool 2 · Fed Balance Sheet (Quantity of Money)
        </div>
        <p className="text-[#cbd5e1] leading-relaxed">
          <strong className="text-[#3fc07a]">Quantitative Easing (QE):</strong> Central bank creates reserves to buy Treasuries/MBS, directly injecting base liquidity.
        </p>
        <p className="text-[#cbd5e1] leading-relaxed">
          <strong className="text-[#e5566f]">Quantitative Tightening (QT):</strong> Bonds mature without reinvestment, draining liquidity reserves from commercial banks.
        </p>
      </div>
    </div>
  )
}

function MacroYieldCurveVisual() {
  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1a2030]">
        <span className="text-xs font-semibold text-white">
          U.S. Treasury Yield Curve: Normal Upward Slope vs. 2Y–10Y Recession Inversion
        </span>
        <div className="flex items-center gap-3 text-[11px] [font-variant-numeric:tabular-nums]">
          <span className="text-[#3fc07a]">── Normal Curve (10Y &gt; 2Y)</span>
          <span className="text-[#e5566f]">── Inverted Curve (2Y &gt; 10Y Warning)</span>
        </div>
      </div>

      <svg
        viewBox="0 0 600 185"
        className="w-full h-auto select-none"
        role="img"
        aria-label="Comparison of Normal upward Treasury Yield Curve and Inverted Treasury Yield Curve"
      >
        <line x1="50" y1="20" x2="50" y2="155" stroke="#262f45" />
        <line x1="50" y1="155" x2="560" y2="155" stroke="#262f45" />

        {[
          { x: 80, m: '3M' },
          { x: 180, m: '2Y Note' },
          { x: 300, m: '5Y Note' },
          { x: 420, m: '10Y Bond' },
          { x: 530, m: '30Y Bond' },
        ].map((t) => (
          <text key={t.m} x={t.x} y="172" textAnchor="middle" fill="#94a3b8" fontSize="10">
            {t.m}
          </text>
        ))}

        <polyline
          fill="none"
          stroke="#3fc07a"
          strokeWidth="2.2"
          points="80,130 180,112 300,90 420,68 530,52"
        />
        <circle cx="180" cy="112" r="3.5" fill="#3fc07a" />
        <text x="180" y="128" textAnchor="middle" fill="#3fc07a" fontSize="9.5">
          2Y: 3.50%
        </text>
        <circle cx="420" cy="68" r="3.5" fill="#3fc07a" />
        <text x="420" y="56" textAnchor="middle" fill="#3fc07a" fontSize="9.5">
          10Y: 4.25%
        </text>

        <polyline
          fill="none"
          stroke="#e5566f"
          strokeWidth="2.2"
          strokeDasharray="5 3"
          points="80,42 180,48 300,78 420,98 530,92"
        />
        <circle cx="180" cy="48" r="3.5" fill="#e5566f" />
        <text x="180" y="36" textAnchor="middle" fill="#e5566f" fontSize="9.5" fontWeight="600">
          2Y: 4.85%
        </text>
        <circle cx="420" cy="98" r="3.5" fill="#e5566f" />
        <text x="420" y="114" textAnchor="middle" fill="#e5566f" fontSize="9.5" fontWeight="600">
          10Y: 3.90% (Spread −95 bps)
        </text>
      </svg>
    </div>
  )
}

function MacroDxyBasketVisual() {
  const weights = [
    { cur: 'Euro (EUR)', pct: 57.6, color: 'bg-[#38bdf8]' },
    { cur: 'Japanese Yen (JPY)', pct: 13.6, color: 'bg-[#3fc07a]' },
    { cur: 'British Pound (GBP)', pct: 11.9, color: 'bg-[#e2a84b]' },
    { cur: 'Canadian Dollar (CAD)', pct: 9.1, color: 'bg-[#cbd5e1]' },
    { cur: 'Swedish Krona (SEK)', pct: 4.2, color: 'bg-[#64748b]' },
    { cur: 'Swiss Franc (CHF)', pct: 3.6, color: 'bg-[#475569]' },
  ]

  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 [font-variant-numeric:tabular-nums]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1a2030] text-xs">
        <span className="font-semibold text-white">
          ICE U.S. Dollar Index (DXY) Trade-Weighted Currency Basket
        </span>
        <span className="text-[#94a3b8]">6 Sovereign Currencies</span>
      </div>

      <div className="space-y-2 text-xs">
        {weights.map((w) => (
          <div key={w.cur} className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[#cbd5e1]">{w.cur}</span>
              <span className="text-white font-semibold">{w.pct}%</span>
            </div>
            <div className="w-full h-2 rounded bg-[#0a0f1a] overflow-hidden">
              <div className={`h-full ${w.color}`} style={{ width: `${w.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MacroSurpriseDeltaVisual() {
  return (
    <div data-ui className="my-5 rounded-lg border border-[#1a2030] bg-[#070b14] p-4 space-y-3 text-xs [font-variant-numeric:tabular-nums]">
      <div className="font-semibold text-white border-b border-[#1a2030] pb-2">
        CPI Surprise Delta (Δ = Actual − Consensus Forecast) &amp; Execution Protocol
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="rounded border border-[#1a2030] bg-[#0a0f1a] p-3">
          <div className="text-white font-semibold">Case 1 · In-Line (Δ = 0.0%)</div>
          <div className="text-[#94a3b8] mt-1">
            Actual 0.2% vs Forecast 0.2%. Consensus already priced in; initial 60-second algos whipsaw both sides before resuming prior trend.
          </div>
        </div>
        <div className="rounded border border-[#1a2030] bg-[#0a0f1a] p-3">
          <div className="text-[#e5566f] font-semibold">Case 2 · Hot Surprise (Δ = +0.3%)</div>
          <div className="text-[#94a3b8] mt-1">
            Actual 0.5% vs Forecast 0.2%. Severe hawkish shock; yields &amp; DXY spike; order book thins and BTC sweeps downside liquidity.
          </div>
        </div>
        <div className="rounded border border-[#1a2030] bg-[#0a0f1a] p-3">
          <div className="text-[#3fc07a] font-semibold">Case 3 · Cool Surprise (Δ = −0.3%)</div>
          <div className="text-[#94a3b8] mt-1">
            Actual −0.1% vs Forecast 0.2%. Dovish shock; yields drop; wait for the 15m structure close after spreads normalize to enter long.
          </div>
        </div>
      </div>
    </div>
  )
}
