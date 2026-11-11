'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface MathPillar {
  id: string
  title: string
  tag: string
  formula: string
  summary: string
  variables: { sym: string; desc: string }[]
  engineeringRationale: string
}

const MATH_PILLARS: MathPillar[] = [
  {
    id: 'confluence',
    title: 'Composite Factor Convergence',
    tag: 'SYSTEM MATHEMATICS // 01',
    formula: 'C(t) = SUM [ w_i(R_t) * f_i(x_t) ]  for i = 1 to K',
    summary:
      'Rather than relying on single lagging indicators that decay under regime changes, ACTS computes a dynamic linear combination of orthogonal market factors. Weights are strictly parameterized by the active market regime.',
    variables: [
      { sym: 'C(t)', desc: 'Composite confluence score at candle close t, normalized to [0, 10]' },
      { sym: 'R_t', desc: 'Active market regime (Trending Bull, Trending Bear, Chop, Compression)' },
      { sym: 'w_i(R_t)', desc: 'Regime-conditioned weight vector dynamically assigned to factor i' },
      { sym: 'f_i(x_t)', desc: 'Normalized factor input (Trend, Volatility, Orderbook, VWAP, Momentum)' },
    ],
    engineeringRationale:
      'Eliminates single-point indicator failure. A signal requires simultaneous confirmation across trend structure, volatility expansion, and orderbook liquidity depth.',
  },
  {
    id: 'isotonic',
    title: 'Isotonic Probability Calibration',
    tag: 'SYSTEM MATHEMATICS // 02',
    formula: 'min SUM [ (y_j - P_cal(C_j))^2 ]  subject to P_cal(C_a) <= P_cal(C_b) for C_a <= C_b',
    summary:
      'Raw indicator scores do not represent true win probabilities. ACTS applies non-parametric isotonic regression to map heuristic scores directly to empirical resolution frequencies without imposing arbitrary parametric assumptions.',
    variables: [
      { sym: 'P_cal', desc: 'Calibrated win probability bounded monotonically in [0.0, 1.0]' },
      { sym: 'y_j', desc: 'Binary empirical outcome (1 = Take-Profit Hit, 0 = Stop-Loss Hit)' },
      { sym: 'C_j', desc: 'Historical raw confluence score evaluated at candle close' },
      { sym: 'Brier', desc: 'Brier calibration score minimized across rolling resolution windows' },
    ],
    engineeringRationale:
      'Solves heuristic overconfidence. A raw score of 8.5/10 is statistically mapped to its verified empirical win rate (e.g. 64.2%), ensuring honest sizing inputs.',
  },
  {
    id: 'wald',
    title: 'Wald Statistical Rigor',
    tag: 'SYSTEM MATHEMATICS // 03',
    formula: 'CI_95% = p_hat +/- 1.96 * SQRT[ (p_hat * (1 - p_hat)) / N ]',
    summary:
      'To prevent the system from overfitting to small-sample lucky streaks, model parameter adjustments and factor validation require 95% Wald confidence interval validation over historical sample size N.',
    variables: [
      { sym: 'p_hat', desc: 'Observed empirical sample win rate across test sample' },
      { sym: 'N', desc: 'Total count of resolved independent trades in current regime' },
      { sym: '1.96', desc: 'Two-tailed normal critical value for alpha = 0.05' },
      { sym: 'Delta_w', desc: 'Weight adjustment restricted to maximum 5% drift per 100 observations' },
    ],
    engineeringRationale:
      'Filters out statistical noise. The optimizer rejects strategy parameter revisions unless the lower bound of the 95% confidence interval exceeds breakeven expectation.',
  },
  {
    id: 'kelly',
    title: 'Fractional Kelly Risk Sizing',
    tag: 'SYSTEM MATHEMATICS // 04',
    formula: 'f* = lambda * [ (b * p - q) / b ]  where q = 1 - p and lambda = 0.50',
    summary:
      'Position sizing is calculated mathematically via the continuous Kelly Criterion with a conservative fractional multiplier (lambda = 0.50). Trade size scales with edge and drops during uncertainty.',
    variables: [
      { sym: 'f*', desc: 'Fraction of total paper equity allocated to the active position' },
      { sym: 'b', desc: 'Payoff ratio defined as Target Profit % divided by Stop Loss %' },
      { sym: 'p', desc: 'Isotonically calibrated win probability from Engine 02' },
      { sym: 'lambda', desc: 'Fractional safety dampener preventing geometric volatility drag' },
    ],
    engineeringRationale:
      'Prevents mathematical gambler ruin. When calibrated edge p shrinks or volatility widens stop-loss distance, Kelly automatically reduces trade size.',
  },
]

interface StrengthPillar {
  num: string
  title: string
  problem: string
  solution: string
  metric: string
}

const STRENGTH_PILLARS: StrengthPillar[] = [
  {
    num: '01',
    title: 'Regime-Shift Immunity',
    problem:
      'Conventional algorithmic strategies fail because they run static rules: applying trend-following systems in range-bound chop, or running mean-reversion during parabolic breakouts.',
    solution:
      'ACTS runs an autonomous 4-regime classification engine (ADX, Realized Volatility, Choppiness Index). When chop is detected, breakout engines are muted and only mean-reversion anchors are qualified.',
    metric: '4 Isolated Regime Models',
  },
  {
    num: '02',
    title: 'Microstructure & Orderbook Depth',
    problem:
      'Price action candles alone are vulnerable to spoofing, liquidity traps, and low-volume wick slippage on retail crypto exchanges.',
    solution:
      'Signals require simultaneous confirmation from Level-2 orderbook top-of-book depth skew and bid/ask volume imbalance. A breakout without real bid liquidity support is rejected.',
    metric: 'L2 Imbalance Thresholding',
  },
  {
    num: '03',
    title: 'Anti-Overfitting & Drift Control',
    problem:
      'Backtesting curves often look stellar due to brute-force historical parameter fitting, only to collapse immediately when deployed in forward live testing.',
    solution:
      'ACTS employs strict weight drift limits (< 5% adjustment per 100 candles) combined with continuous counterfactual auditing of unselected signals to confirm alpha persistence.',
    metric: '< 5% Parameter Drift Cap',
  },
  {
    num: '04',
    title: 'Deterministic Risk Lockout',
    problem:
      'Manual trading and loose algorithmic bots suffer from emotional execution drift: moving stop losses further away during adverse price excursions.',
    solution:
      'Every paper order generated by ACTS locks in deterministic Take-Profit and Stop-Loss brackets computed from dynamic ATR multiples at the exact instant of candle close. Zero manual intervention.',
    metric: 'Dynamic ATR Bracket Hard-Lock',
  },
]

interface RegimeDetail {
  code: string
  name: string
  color: string
  characteristics: string
  favoredEngines: string
  riskPosture: string
}

const REGIMES: RegimeDetail[] = [
  {
    code: 'REGIME 01',
    name: 'Trending Bull',
    color: '#10b981',
    characteristics: 'ADX > 25, EMA20 > EMA50 > EMA200 alignment, positive cumulative volume delta, sustained bid depth.',
    favoredEngines: 'Trend Confluence Momentum, Volume-Weighted Pullback Entries, Breakout Continuation.',
    riskPosture: 'Aggressive Kelly Sizing (0.50x), trailing stop loss brackets anchored to EMA20 dynamic band.',
  },
  {
    code: 'REGIME 02',
    name: 'Trending Bear',
    color: '#ff2e54',
    characteristics: 'Structural lower-highs, ADX > 25, EMA alignment reversed, heavy ask wall dominance, elevated downside realized volatility.',
    favoredEngines: 'Short Momentum Confluence, Resistance Rejection, Volatility Expansion Breakdown.',
    riskPosture: 'Standard Kelly Sizing (0.40x), tight ATR trailing stops to defend against violent counter-trend short squeezes.',
  },
  {
    code: 'REGIME 03',
    name: 'Volatile Choppy',
    color: '#f59e0b',
    characteristics: 'Choppiness Index > 60, low directional ADX (< 20), mean-reverting price swings across wide Bollinger Bands.',
    favoredEngines: 'Session VWAP Band Reversion, Bollinger Dynamic Band Extremes, RSI Divergence Oscillators.',
    riskPosture: 'Defensive Kelly Sizing (0.25x), rapid profit-taking brackets, breakout engines strictly muted.',
  },
  {
    code: 'REGIME 04',
    name: 'Low-Vol Compression',
    color: '#06b6d4',
    characteristics: 'Narrowing Bollinger Bandwidth, ATR compression to rolling multi-day lows, dry orderbook volume.',
    favoredEngines: 'Pre-Breakout Volatility Squeeze Detectors, Range Boundary Compression Scanners.',
    riskPosture: 'Selective Exposure (0.35x), asymmetric payoff targets (>= 3:1) anticipating volatility expansion.',
  },
]

export default function About() {
  const router = useRouter()
  const [activeMath, setActiveMath] = useState(0)
  const currentMath = MATH_PILLARS[activeMath]

  return (
    <main className="min-h-full bg-[#070b14] text-[#f8fafc] flex flex-col">
      {/* Top Specification Header Ribbon */}
      <div className="w-full overflow-hidden border-b border-[#1c2438] bg-[#070b14]/95 backdrop-blur py-2.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#ff2e54] block shadow-[0_0_8px_#ff2e54] animate-pulse" />
            <span className="text-[#94a3b8] uppercase tracking-wider font-bold">
              ACTS Quantitative Specification: Architecture & Mathematical Modeling
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[#64748b]">
            <span>ENGINE: MULTI-REGIME CONFLUENCE</span>
            <span>VERIFICATION: PAPER SANDBOX</span>
          </div>
        </div>
      </div>

      {/* Hero Section: Institutional Quantitative Identity */}
      <section className="relative overflow-hidden bg-[#070b14] pt-16 pb-20 border-b border-[#1c2438]">
        {/* Precision coordinate grid background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#f8fafc 1px, transparent 1px), linear-gradient(90deg, #f8fafc 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Crimson ambient glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#ff2e54] opacity-[0.05] blur-[140px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs font-bold text-[#ff2e54] uppercase tracking-widest">
                // System Architecture & Quantitative Theory
              </span>
            </div>

            <h1
              className="font-sans font-black text-white leading-[0.92] uppercase mb-8 tracking-tight select-none"
              style={{ fontSize: 'clamp(2.75rem, 6.5vw, 5.25rem)' }}
            >
              Mathematical
              <br />
              <span className="text-[#ff2e54]">Confluence.</span>
              <br />
              Zero Heuristics.
            </h1>

            <p className="text-[#94a3b8] text-lg sm:text-xl leading-relaxed max-w-3xl mb-12 font-normal">
              Financial markets are non-stationary, multi-fractal systems where isolated indicators
              decay rapidly. ACTS replaces subjective interpretation with deterministic factor convergence,
              isotonic probability calibration, and continuous regime-adaptive risk sizing.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-[#ff2e54] hover:bg-[#e11d48] text-white font-sans font-bold uppercase tracking-wider text-sm px-8 py-4 transition-all duration-150 flex items-center gap-3 shadow-[0_0_25px_-5px_rgba(255,46,84,0.4)] cursor-pointer"
              >
                Launch Terminal
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
              <Link
                href="/dashboard/signals"
                className="border border-[#1c2438] hover:border-[#ff2e54]/50 text-[#94a3b8] hover:text-white font-sans font-semibold uppercase tracking-wider text-sm px-8 py-4 transition-all duration-150 flex items-center justify-center bg-white/[0.02]"
              >
                Inspect Signal Matrix
              </Link>
            </div>
          </div>

          {/* Quick Mathematical Telemetry Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-[#1c2438] mt-16 bg-[#090d18]">
            <div className="p-6 border-r border-[#1c2438]">
              <div className="font-mono text-2xl sm:text-3xl font-black text-[#ff2e54] mb-1">
                K = 5
              </div>
              <div className="font-sans font-bold text-white text-sm">Orthogonal Factors</div>
              <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider mt-1">
                Trend, Vol, Book, VWAP, Mom
              </div>
            </div>
            <div className="p-6 border-r border-[#1c2438]">
              <div className="font-mono text-2xl sm:text-3xl font-black text-[#10b981] mb-1">
                P_cal
              </div>
              <div className="font-sans font-bold text-white text-sm">Isotonic Calibration</div>
              <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider mt-1">
                Brier-Optimized Mapping
              </div>
            </div>
            <div className="p-6 border-r border-[#1c2438]">
              <div className="font-mono text-2xl sm:text-3xl font-black text-white mb-1">
                95% CI
              </div>
              <div className="font-sans font-bold text-white text-sm">Wald Statistical Rigor</div>
              <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider mt-1">
                Sample-Size Drift Defense
              </div>
            </div>
            <div className="p-6">
              <div className="font-mono text-2xl sm:text-3xl font-black text-[#06b6d4] mb-1">
                f* &lt;= 0.50x
              </div>
              <div className="font-sans font-bold text-white text-sm">Fractional Kelly Sizing</div>
              <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider mt-1">
                Geometric Ruin Protection
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Mathematical Foundation Console */}
      <section className="py-24 bg-[#090d18] border-b border-[#1c2438]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <div className="font-mono text-xs text-[#ff2e54] uppercase tracking-widest mb-4 font-bold">
              // Mathematical Foundation
            </div>
            <h2 className="font-sans font-black text-white uppercase text-4xl sm:text-6xl leading-[0.92] tracking-tight">
              The Engine
              <br />
              <span className="text-[#64748b]">Mathematics.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-[#1c2438]">
            {/* Left selector column */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#1c2438] bg-[#070b14]">
              {MATH_PILLARS.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActiveMath(idx)}
                  className={`w-full text-left p-6 sm:p-8 border-b border-[#1c2438] last:border-b-0 transition-colors cursor-pointer ${
                    activeMath === idx ? 'bg-[#0c1220]' : 'hover:bg-[#0a0e1a]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider mb-2">
                        {p.tag}
                      </div>
                      <div
                        className={`font-sans font-bold text-lg sm:text-xl uppercase transition-colors ${
                          activeMath === idx ? 'text-white' : 'text-[#94a3b8]'
                        }`}
                      >
                        {p.title}
                      </div>
                    </div>
                    <div
                      className={`w-1.5 h-8 bg-[#ff2e54] shadow-[0_0_8px_#ff2e54] transition-opacity ${
                        activeMath === idx ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Right formula inspection terminal */}
            <div className="lg:col-span-7 bg-[#0b101c] p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#1c2438] pb-4 mb-6">
                  <span className="font-mono text-xs text-[#ff2e54] uppercase tracking-widest font-bold">
                    {currentMath.tag}
                  </span>
                  <span className="font-mono text-[11px] text-[#10b981] uppercase font-bold">
                    Rigorous Verification
                  </span>
                </div>

                <h3 className="font-sans font-black text-white text-2xl sm:text-3xl uppercase tracking-tight mb-4">
                  {currentMath.title}
                </h3>

                <p className="text-[#94a3b8] text-sm leading-relaxed mb-6">
                  {currentMath.summary}
                </p>

                {/* Formula display terminal */}
                <div className="bg-[#05080f] border border-[#1c2438] p-5 font-mono text-sm text-[#f8fafc] mb-8 overflow-x-auto">
                  <div className="text-[#64748b] text-[10px] uppercase tracking-wider mb-2">
                    Mathematical Formulation:
                  </div>
                  <div className="text-[#10b981] font-bold text-base sm:text-lg">
                    {currentMath.formula}
                  </div>
                </div>

                {/* Variable Breakdown */}
                <div className="space-y-3 mb-8">
                  <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider">
                    Variable Specifications:
                  </div>
                  {currentMath.variables.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 border border-[#1c2438] bg-[#070b14] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs"
                    >
                      <span className="font-mono font-bold text-[#ff2e54] min-w-[90px]">
                        {v.sym}
                      </span>
                      <span className="text-[#94a3b8] font-sans">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rationale callout */}
              <div className="pt-6 border-t border-[#1c2438] bg-[#05080f]/50 p-4 border border-[#1c2438]">
                <div className="font-mono text-[10px] text-[#ff2e54] uppercase tracking-wider mb-1 font-bold">
                  Engineering Rationale:
                </div>
                <div className="text-xs text-[#94a3b8] leading-relaxed">
                  {currentMath.engineeringRationale}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Why Our System is Strong & Robust */}
      <section className="py-24 bg-[#070b14] border-b border-[#1c2438]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <div className="font-mono text-xs text-[#ff2e54] uppercase tracking-widest mb-4 font-bold">
              // Robustness Engineering
            </div>
            <h2 className="font-sans font-black text-white uppercase text-4xl sm:text-6xl leading-[0.92] tracking-tight">
              Why Our System
              <br />
              <span className="text-[#64748b]">Is Strong.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#1c2438]">
            {STRENGTH_PILLARS.map((s, idx) => (
              <div
                key={s.num}
                className="p-8 sm:p-12 border-b md:border-b-0 border-[#1c2438] last:border-b-0 md:even:border-l border-t md:first:border-t-0 md:[&:nth-child(2)]:border-t-0 hover:bg-[#0c1220] transition-colors"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-[#ff2e54]">{s.num}</span>
                  <span className="font-mono text-[10px] text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 border border-[#10b981]/20 uppercase">
                    {s.metric}
                  </span>
                </div>

                <h3 className="font-sans font-bold text-white text-2xl uppercase mb-6 tracking-tight">
                  {s.title}
                </h3>

                <div className="space-y-4 text-xs leading-relaxed">
                  <div>
                    <span className="font-mono text-[10px] text-[#ff2e54] uppercase block mb-1">
                      The Industry Failure Mode:
                    </span>
                    <p className="text-[#94a3b8]">{s.problem}</p>
                  </div>

                  <div className="pt-4 border-t border-[#1c2438]">
                    <span className="font-mono text-[10px] text-[#10b981] uppercase block mb-1">
                      The ACTS Solution:
                    </span>
                    <p className="text-[#f8fafc]">{s.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: 4-Regime Classification Breakdown */}
      <section className="py-24 bg-[#090d18] border-b border-[#1c2438]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="font-mono text-xs text-[#ff2e54] uppercase tracking-widest mb-4 font-bold">
                // Macro Environment Modeling
              </div>
              <h2 className="font-sans font-black text-white uppercase text-4xl sm:text-6xl leading-[0.92] tracking-tight">
                4-Regime
                <br />
                <span className="text-[#64748b]">Classification.</span>
              </h2>
            </div>
            <div className="font-mono text-xs text-[#94a3b8] max-w-sm">
              Continuous classification ensures strategy compatibility. Incompatible vectors are automatically muted during hostile regimes.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#1c2438]">
            {REGIMES.map((r, i) => (
              <div
                key={r.code}
                className="p-8 border-b lg:border-b-0 border-[#1c2438] last:border-b-0 lg:border-r lg:last:border-r-0 bg-[#070b14] flex flex-col justify-between gap-6 hover:bg-[#0c1220] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-[#64748b]">{r.code}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]"
                      style={{ backgroundColor: r.color, boxShadow: `0 0 8px ${r.color}` }}
                    />
                  </div>

                  <div className="font-sans font-black text-white text-2xl uppercase tracking-tight mb-4">
                    {r.name}
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-[#64748b] uppercase block mb-1">
                        Quantitative Signatures:
                      </span>
                      <p className="text-[#94a3b8] leading-relaxed">{r.characteristics}</p>
                    </div>

                    <div className="pt-3 border-t border-[#1c2438]">
                      <span className="font-mono text-[10px] text-[#64748b] uppercase block mb-1">
                        Favored Strategies:
                      </span>
                      <p className="text-[#f8fafc] font-medium leading-relaxed">{r.favoredEngines}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1c2438]">
                  <span className="font-mono text-[10px] text-[#ff2e54] uppercase block mb-1">
                    Risk Posture:
                  </span>
                  <span className="font-mono text-[11px] text-[#94a3b8]">{r.riskPosture}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Multi-Agent Validation Pipeline */}
      <section className="py-24 bg-[#070b14] border-b border-[#1c2438]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <div className="font-mono text-xs text-[#ff2e54] uppercase tracking-widest mb-4 font-bold">
              // Multi-Agent Pipeline
            </div>
            <h2 className="font-sans font-black text-white uppercase text-4xl sm:text-6xl leading-[0.92] tracking-tight">
              Three-Agent
              <br />
              <span className="text-[#64748b]">Validation Loop.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#1c2438]">
            <div className="p-10 border-b md:border-b-0 md:border-r border-[#1c2438] bg-[#090d18] hover:bg-[#0c1220] transition-colors">
              <div className="font-mono text-xs font-bold text-[#ff2e54] mb-3">// AGENT 01</div>
              <div className="font-sans font-black text-white text-2xl uppercase tracking-tight mb-4">
                The Analyst
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
                Ingests high-frequency tick data, computes rolling orderbook imbalances, and scans multi-timeframe EMA matrices on candle close to propose candidate entries.
              </p>
              <div className="border-t border-[#1c2438] pt-4 font-mono text-[10px] text-[#64748b] uppercase">
                Role: Hypothesis & Signal Generation
              </div>
            </div>

            <div className="p-10 border-b md:border-b-0 md:border-r border-[#1c2438] bg-[#090d18] hover:bg-[#0c1220] transition-colors">
              <div className="font-mono text-xs font-bold text-[#10b981] mb-3">// AGENT 02</div>
              <div className="font-sans font-black text-white text-2xl uppercase tracking-tight mb-4">
                The Critic
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
                Applies counterfactual stress-testing against the proposed signal. Verifies that the regime classification is valid and that liquidity depth is sufficient to absorb the order.
              </p>
              <div className="border-t border-[#1c2438] pt-4 font-mono text-[10px] text-[#64748b] uppercase">
                Role: Adversarial Signal Veto
              </div>
            </div>

            <div className="p-10 bg-[#090d18] hover:bg-[#0c1220] transition-colors">
              <div className="font-mono text-xs font-bold text-[#06b6d4] mb-3">// AGENT 03</div>
              <div className="font-sans font-black text-white text-2xl uppercase tracking-tight mb-4">
                The Optimizer
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
                Runs isotonic probability calibration, calculates dynamic Kelly sizing, and locks in deterministic ATR bracket targets into the paper execution ledger.
              </p>
              <div className="border-t border-[#1c2438] pt-4 font-mono text-[10px] text-[#64748b] uppercase">
                Role: Calibrated Sizing & Execution
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Research Disclosure & Safety Framework */}
      <section className="py-20 bg-[#070b14] border-b border-[#1c2438]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="border border-[#1c2438] bg-[#0b101c] p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff2e54] block" />
              <span className="font-mono text-xs font-bold text-[#ff2e54] uppercase tracking-widest">
                Research Disclosure & Simulation Framework
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed max-w-4xl font-normal">
              ACTS (Adaptive Confluence Trading System) is an autonomous algorithmic research and paper
              trading execution framework. All signals, trade simulations, and confluence scores are
              generated exclusively within a paper sandbox environment for educational and quantitative
              exploration. No live capital is accepted, solicited, or committed. Historical paper outcomes
              and counterfactual modeling do not guarantee future live market results. Not financial advice.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Action CTA Banner */}
      <section className="relative overflow-hidden bg-[#ff2e54] py-20 text-white">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="font-mono text-xs text-white/80 uppercase tracking-widest mb-4 font-bold">
            // Ready for Systematic Execution
          </div>
          <h2
            className="font-sans font-black text-white uppercase leading-[0.88] mb-8 tracking-tight select-none"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            Explore The Live Terminal.
          </h2>
          <p className="text-white/90 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Inspect real-time market regimes, examine factor confluence convergence, and track automated paper executions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white text-[#ff2e54] hover:bg-[#f8fafc] font-sans font-black uppercase tracking-wider text-sm px-8 py-4 transition-all duration-150 flex items-center gap-3 shadow-2xl cursor-pointer"
            >
              Launch Terminal
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                />
              </svg>
            </button>
            <Link
              href="/dashboard/signals"
              className="border-2 border-white/60 hover:border-white text-white font-sans font-bold uppercase tracking-wider text-sm px-8 py-4 transition-all duration-150"
            >
              Signal Matrix
            </Link>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="bg-[#05080f] border-t border-[#1c2438] py-14">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 bg-[#ff2e54] flex items-center justify-center shadow-[0_0_10px_#ff2e54]">
                <span className="font-sans text-white font-black text-xs leading-none">A</span>
              </div>
              <span className="font-sans text-white font-black text-lg tracking-wider uppercase">
                ACTS
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#64748b] uppercase tracking-wider max-w-md leading-relaxed">
              Adaptive Confluence Trading System: Algorithmic trading research, paper execution, and
              multi-regime confluence telemetry for digital assets. Educational and research simulation platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-8">
            {[
              { label: 'Terminal', href: '/dashboard' },
              { label: 'Signal Matrix', href: '/dashboard/signals' },
              { label: 'Architecture', href: '/about' },
              { label: 'News Feed', href: '/dashboard/news' },
              { label: 'Telegram Bot', href: 'https://t.me/AytasATbot' },
              { label: 'GitHub', href: 'https://github.com/BimaSatyaM/ACTS' },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="font-mono text-xs text-[#64748b] hover:text-[#f8fafc] uppercase tracking-wider transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="font-mono text-[11px] text-[#475569] uppercase tracking-wider">
            &copy; {new Date().getFullYear()} ACTS Engine. Open Telemetry.
          </div>
        </div>
      </footer>
    </main>
  )
}
