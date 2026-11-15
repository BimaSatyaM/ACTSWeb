'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface MathPillar {
  id: string
  num: string
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
    num: '01',
    title: 'Composite Factor Convergence',
    tag: 'FACTOR LINEAR COMBINATION',
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
    num: '02',
    title: 'Isotonic Probability Calibration',
    tag: 'MONOTONIC MAPPING',
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
    num: '03',
    title: 'Wald Statistical Rigor',
    tag: 'CONFIDENCE BOUNDING',
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
    num: '04',
    title: 'Fractional Kelly Risk Sizing',
    tag: 'GEOMETRIC CAPITAL DEFENSE',
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
    color: '#059669',
    characteristics: 'ADX > 25, EMA20 > EMA50 > EMA200 alignment, positive cumulative volume delta, sustained bid depth.',
    favoredEngines: 'Trend Confluence Momentum, Volume-Weighted Pullback Entries, Breakout Continuation.',
    riskPosture: 'Aggressive Kelly Sizing (0.50x), trailing stop loss brackets anchored to EMA20 dynamic band.',
  },
  {
    code: 'REGIME 02',
    name: 'Trending Bear',
    color: '#e11d48',
    characteristics: 'Structural lower-highs, ADX > 25, EMA alignment reversed, heavy ask wall dominance, elevated downside realized volatility.',
    favoredEngines: 'Short Momentum Confluence, Resistance Rejection, Volatility Expansion Breakdown.',
    riskPosture: 'Standard Kelly Sizing (0.40x), tight ATR trailing stops to defend against counter-trend squeezes.',
  },
  {
    code: 'REGIME 03',
    name: 'Volatile Choppy',
    color: '#d97706',
    characteristics: 'Choppiness Index > 60, low directional ADX (< 20), mean-reverting price swings across wide Bollinger Bands.',
    favoredEngines: 'Session VWAP Band Reversion, Bollinger Dynamic Band Extremes, RSI Divergence Oscillators.',
    riskPosture: 'Defensive Kelly Sizing (0.25x), rapid profit-taking brackets, breakout engines strictly muted.',
  },
  {
    code: 'REGIME 04',
    name: 'Low-Vol Compression',
    color: '#0284c7',
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
    <main className="min-h-full bg-[#edf7fe] text-slate-900 flex flex-col">
      <div className="w-full border-b border-slate-900/10 py-2.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0369a1]" />
            <span className="text-slate-700 uppercase tracking-wider font-bold">
              ACTS QUANTITATIVE SPECIFICATION · SYSTEM ARCHITECTURE
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-slate-600 font-semibold">
            <span>ENGINE: MULTI-REGIME CONFLUENCE</span>
            <span>VERIFICATION: PAPER SANDBOX</span>
          </div>
        </div>
      </div>

      <section className="pt-14 pb-16 border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            <div className="font-mono text-xs font-bold text-[#0369a1] uppercase tracking-widest mb-5">
              QUANTITATIVE THEORY &amp; SYSTEM DESIGN
            </div>

            <h1
              className="font-sans font-black text-slate-950 leading-[0.94] mb-7 tracking-tight"
              style={{ fontSize: 'clamp(2.75rem, 6vw, 4.75rem)' }}
            >
              Mathematical <span className="text-[#0369a1]">Confluence.</span>
              <br />
              Zero Heuristics.
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-3xl mb-10 font-normal">
              Financial markets are non-stationary, multi-fractal systems where isolated indicators
              decay rapidly. ACTS replaces subjective interpretation with deterministic factor convergence,
              isotonic probability calibration, and continuous regime-adaptive risk sizing.
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-[#0369a1] hover:bg-[#0284c7] text-white font-sans font-bold tracking-wide text-sm px-7 py-3.5 rounded-xl transition-colors duration-150 inline-flex items-center gap-2.5 cursor-pointer"
              >
                <span>Launch Terminal</span>
                <span>→</span>
              </button>
              <Link
                href="/dashboard/signals"
                className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-[#0369a1] transition-colors"
              >
                Inspect Signal Matrix →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-slate-900/10 mt-14 py-8 gap-y-6 lg:divide-x lg:divide-slate-900/10">
            <div className="lg:pr-6">
              <div className="font-mono text-2xl sm:text-3xl font-black text-[#0369a1] mb-1 tabular-nums">
                K = 5
              </div>
              <div className="font-sans font-bold text-slate-900 text-sm">Orthogonal Factors</div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Trend, Vol, Book, VWAP, Mom
              </div>
            </div>
            <div className="lg:px-6">
              <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-700 mb-1 tabular-nums">
                P_cal
              </div>
              <div className="font-sans font-bold text-slate-900 text-sm">Isotonic Calibration</div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Brier-Optimized Mapping
              </div>
            </div>
            <div className="lg:px-6">
              <div className="font-mono text-2xl sm:text-3xl font-black text-slate-950 mb-1 tabular-nums">
                95% CI
              </div>
              <div className="font-sans font-bold text-slate-900 text-sm">Wald Statistical Rigor</div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Sample-Size Drift Defense
              </div>
            </div>
            <div className="lg:pl-6">
              <div className="font-mono text-2xl sm:text-3xl font-black text-[#0369a1] mb-1 tabular-nums">
                f* &lt;= 0.50x
              </div>
              <div className="font-sans font-bold text-slate-900 text-sm">Fractional Kelly Sizing</div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Geometric Ruin Protection
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest mb-3 font-bold">
              MATHEMATICAL FOUNDATION
            </div>
            <h2 className="font-sans font-black text-slate-950 text-4xl sm:text-5xl leading-[0.95] tracking-tight">
              The Engine <span className="text-slate-500">Mathematics.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4 divide-y divide-slate-900/10 border-y border-slate-900/10">
              {MATH_PILLARS.map((p, idx) => {
                const isSelected = activeMath === idx
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveMath(idx)}
                    className={`w-full text-left py-5 px-4 border-l-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#0369a1] bg-[#faf2df]/75'
                        : 'border-transparent hover:bg-[#faf2df]/40'
                    }`}
                  >
                    <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                      {p.num} · {p.tag}
                    </div>
                    <div className={`font-sans font-bold text-lg tracking-tight ${isSelected ? 'text-slate-950' : 'text-slate-600'}`}>
                      {p.title}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="lg:col-span-8 rounded-2xl border border-slate-900/10 bg-[#faf2df] p-7 sm:p-10 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-4">
                <span className="font-mono text-xs text-[#0369a1] uppercase tracking-widest font-bold">
                  {currentMath.num} · {currentMath.tag}
                </span>
                <span className="font-mono text-[11px] text-emerald-700 uppercase font-bold">
                  Rigorous Verification
                </span>
              </div>

              <div>
                <h3 className="font-sans font-black text-slate-950 text-2xl sm:text-3xl tracking-tight mb-3">
                  {currentMath.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {currentMath.summary}
                </p>
              </div>

              <div className="border-y border-slate-900/10 py-4 font-mono overflow-x-auto">
                <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1.5 font-bold">
                  Mathematical Formulation
                </div>
                <div className="text-[#0369a1] font-bold text-sm sm:text-base">
                  {currentMath.formula}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider font-semibold pb-2">
                  Variable Specifications
                </div>
                <div className="divide-y divide-slate-900/10">
                  {currentMath.variables.map((v, i) => (
                    <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-5 text-xs">
                      <span className="font-mono font-bold text-slate-950 min-w-[96px]">
                        {v.sym}
                      </span>
                      <span className="text-slate-600 font-sans">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-slate-900/10">
                <div className="font-mono text-[10px] text-[#0369a1] uppercase tracking-wider mb-1 font-bold">
                  Engineering Rationale
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentMath.engineeringRationale}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest mb-3 font-bold">
              ROBUSTNESS ENGINEERING
            </div>
            <h2 className="font-sans font-black text-slate-950 text-4xl sm:text-5xl leading-[0.95] tracking-tight">
              Why Our System <span className="text-slate-500">Is Strong.</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-900/10 border-y border-slate-900/10">
            {STRENGTH_PILLARS.map((s) => (
              <div key={s.num} className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 space-y-1.5">
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="font-bold text-[#0369a1] tabular-nums">{s.num}</span>
                    <span className="text-emerald-700 font-bold uppercase tracking-wider">{s.metric}</span>
                  </div>
                  <h3 className="font-sans font-black text-slate-950 text-xl tracking-tight">
                    {s.title}
                  </h3>
                </div>

                <div className="lg:col-span-4">
                  <span className="font-mono text-[10px] text-rose-700 uppercase block mb-1.5 font-bold tracking-wider">
                    Industry Failure Mode
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.problem}</p>
                </div>

                <div className="lg:col-span-4">
                  <span className="font-mono text-[10px] text-emerald-700 uppercase block mb-1.5 font-bold tracking-wider">
                    ACTS Solution
                  </span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{s.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest mb-3 font-bold">
                MACRO ENVIRONMENT MODELING
              </div>
              <h2 className="font-sans font-black text-slate-950 text-4xl sm:text-5xl leading-[0.95] tracking-tight">
                4-Regime <span className="text-slate-500">Classification.</span>
              </h2>
            </div>
            <p className="font-mono text-xs text-slate-600 max-w-sm">
              Continuous classification ensures strategy compatibility. Incompatible vectors are muted during hostile regimes.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-900/10 bg-[#faf2df] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900/10 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-5 font-bold">REGIME</th>
                    <th className="py-4 px-4 font-bold">QUANTITATIVE SIGNATURES</th>
                    <th className="py-4 px-4 font-bold">FAVORED ENGINES</th>
                    <th className="py-4 px-5 font-bold">RISK POSTURE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/10 text-xs">
                  {REGIMES.map((r) => (
                    <tr key={r.code} className="hover:bg-[#f3ead2]/50 transition-colors">
                      <td className="py-5 px-5 align-top min-w-[175px]">
                        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-500">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                          <span>{r.code}</span>
                        </div>
                        <div className="font-sans font-black text-slate-950 text-base tracking-tight mt-1">
                          {r.name}
                        </div>
                      </td>
                      <td className="py-5 px-4 align-top text-slate-600 leading-relaxed max-w-xs">
                        {r.characteristics}
                      </td>
                      <td className="py-5 px-4 align-top text-slate-800 font-medium leading-relaxed max-w-xs">
                        {r.favoredEngines}
                      </td>
                      <td className="py-5 px-5 align-top font-mono text-[11px] text-[#0369a1] leading-relaxed max-w-xs">
                        {r.riskPosture}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest mb-3 font-bold">
              MULTI-AGENT PIPELINE
            </div>
            <h2 className="font-sans font-black text-slate-950 text-4xl sm:text-5xl leading-[0.95] tracking-tight">
              Three-Agent <span className="text-slate-500">Validation Loop.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-y border-slate-900/10 divide-y md:divide-y-0 md:divide-x divide-slate-900/10">
            <div className="py-8 md:pr-8 space-y-3">
              <div className="font-mono text-xs font-bold text-[#0369a1]">01 · HYPOTHESIS &amp; GENERATION</div>
              <h3 className="font-sans font-black text-slate-950 text-2xl tracking-tight">The Analyst</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingests high-frequency tick data, computes rolling orderbook imbalances, and scans multi-timeframe EMA matrices on candle close to propose candidate entries.
              </p>
            </div>

            <div className="py-8 md:px-8 space-y-3">
              <div className="font-mono text-xs font-bold text-emerald-700">02 · ADVERSARIAL VETO</div>
              <h3 className="font-sans font-black text-slate-950 text-2xl tracking-tight">The Critic</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applies counterfactual stress-testing against the proposed signal. Verifies that the regime classification is valid and that liquidity depth is sufficient to absorb the order.
              </p>
            </div>

            <div className="py-8 md:pl-8 space-y-3">
              <div className="font-mono text-xs font-bold text-slate-900">03 · SIZING &amp; EXECUTION</div>
              <h3 className="font-sans font-black text-slate-950 text-2xl tracking-tight">The Optimizer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Runs isotonic probability calibration, calculates dynamic Kelly sizing, and locks in deterministic ATR bracket targets into the paper execution ledger.
              </p>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-slate-900/10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              Research Disclosure
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
              ACTS (Adaptive Confluence Trading System) is an autonomous algorithmic research and paper
              trading execution framework. All signals, trade simulations, and confluence scores are
              generated exclusively within a paper sandbox environment for educational and quantitative
              exploration. No live capital is accepted, solicited, or committed. Not financial advice.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#faf2df] border-b border-slate-900/10 py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl space-y-2.5">
            <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest font-bold">
              READY FOR SYSTEMATIC EXECUTION
            </div>
            <h2 className="font-sans font-black text-slate-950 text-3xl sm:text-4xl leading-tight tracking-tight">
              Explore The Live Terminal.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Inspect real-time market regimes, examine factor confluence convergence, and track automated paper executions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#0369a1] hover:bg-[#0284c7] text-white font-sans font-bold tracking-wide text-sm px-7 py-3.5 rounded-xl transition-colors duration-150 inline-flex items-center gap-2.5 cursor-pointer"
            >
              <span>Launch Terminal</span>
              <span>→</span>
            </button>
            <Link
              href="/dashboard/signals"
              className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-[#0369a1] transition-colors"
            >
              Signal Matrix →
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#edf7fe] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="font-sans text-slate-950 font-black text-lg tracking-tight">ACTS</span>
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest border-l border-slate-900/15 pl-2.5">
                QUANT v2.4
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-600 max-w-md leading-relaxed">
              Adaptive Confluence Trading System: Algorithmic trading research, paper execution, and
              multi-regime confluence telemetry for digital assets.
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
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
                className="font-mono text-xs text-slate-600 hover:text-[#0369a1] uppercase tracking-wider transition-colors font-medium"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} ACTS Engine
          </div>
        </div>
      </footer>
    </main>
  )
}
