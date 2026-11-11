'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

interface TickerData {
  sym: string
  price: string
  change: string
  up: boolean
}

const DEFAULT_TICKERS: TickerData[] = [
  { sym: 'BTC/USDT', price: '71,704.00', change: '+8.85%', up: true },
  { sym: 'ETH/USDT', price: '2,278.50', change: '+15.35%', up: true },
  { sym: 'SOL/USDT', price: '86.50', change: '+7.25%', up: true },
  { sym: 'BNB/USDT', price: '641.50', change: '+5.37%', up: true },
  { sym: 'XRP/USDT', price: '0.5840', change: '-1.12%', up: false },
  { sym: 'S&P 500', price: '5,648.10', change: '-0.32%', up: false },
  { sym: 'NASDAQ', price: '18,094.55', change: '+0.54%', up: true },
  { sym: 'GOLD', price: '2,391.40', change: '-0.11%', up: false },
  { sym: 'OIL/WTI', price: '82.15', change: '+1.03%', up: true },
  { sym: 'EUR/USD', price: '1.0841', change: '+0.09%', up: true },
]

interface PairPreview {
  symbol: string
  name: string
  price: string
  change: string
  up: boolean
  high: string
  low: string
  volume: string
  regime: string
  confidence: string
  score: string
  kelly: string
  chartPoints: number[]
}

const PAIR_PREVIEWS: Record<string, PairPreview> = {
  BTC: {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    price: '71,704.00',
    change: '+8.85%',
    up: true,
    high: '72,490.00',
    low: '65,892.00',
    volume: '$3.19B',
    regime: 'Trending Bull',
    confidence: '86%',
    score: '8.4 / 10',
    kelly: '1.35x',
    chartPoints: [62, 58, 65, 60, 72, 70, 85, 80, 88, 92, 90, 96, 94, 108, 104, 116, 112, 122, 118, 134],
  },
  ETH: {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    price: '2,278.50',
    change: '+15.35%',
    up: true,
    high: '2,333.65',
    low: '1,961.86',
    volume: '$2.30B',
    regime: 'Volatile Choppy',
    confidence: '74%',
    score: '7.6 / 10',
    kelly: '0.85x',
    chartPoints: [45, 52, 48, 64, 58, 76, 70, 84, 80, 94, 88, 104, 98, 115, 108, 120, 114, 128, 122, 138],
  },
  SOL: {
    symbol: 'SOL/USDT',
    name: 'Solana',
    price: '86.50',
    change: '+7.25%',
    up: true,
    high: '88.10',
    low: '80.64',
    volume: '$441.6M',
    regime: 'Low-Vol Compression',
    confidence: '79%',
    score: '8.1 / 10',
    kelly: '1.10x',
    chartPoints: [50, 48, 55, 53, 62, 60, 68, 65, 75, 72, 82, 80, 92, 89, 102, 98, 112, 108, 120, 130],
  },
}

function MiniChart({ points }: { points: number[] }) {
  const w = 560
  const h = 150
  const min = Math.min(...points)
  const max = Math.max(...points)
  const pad = 12

  const pts = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  const areaPath =
    `M${pad},${h - pad} ` +
    points.map((v, i) => {
      const x = pad + (i / (points.length - 1)) * (w - pad * 2)
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2)
      return `L${x},${y}`
    }).join(' ') +
    ` L${w - pad},${h - pad} Z`

  const lastIdx = points.length - 1
  const lastX = pad + (lastIdx / (points.length - 1)) * (w - pad * 2)
  const lastY = h - pad - ((points[lastIdx] - min) / (max - min)) * (h - pad * 2)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="actsTerminalChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff2e54" stopOpacity="0.4" />
          <stop offset="65%" stopColor="#ff2e54" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ff2e54" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#actsTerminalChartGrad)" />
      <polyline
        points={pts}
        fill="none"
        stroke="#ff2e54"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Outer radar pulse */}
      <circle cx={lastX} cy={lastY} r="10" fill="#ff2e54" opacity="0.25" className="animate-ping" />
      {/* Center solid coordinate ping */}
      <circle cx={lastX} cy={lastY} r="5" fill="#ff2e54" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  )
}

function TickerBar() {
  const fetcher = (url: string) => fetch(url).then((res) => res.json())
  const { data } = useSWR('/api/market-prices', fetcher, { refreshInterval: 15000 })

  let items: TickerData[] = DEFAULT_TICKERS

  if (data?.tickers && Array.isArray(data.tickers) && data.tickers.length > 0) {
    items = data.tickers.slice(0, 10).map((t: any) => ({
      sym: `${t.symbol}/USDT`,
      price: Number(t.price).toLocaleString('en-US', {
        minimumFractionDigits: t.price < 2 ? 4 : 2,
        maximumFractionDigits: t.price < 2 ? 4 : 2,
      }),
      change: `${t.change24h >= 0 ? '+' : ''}${t.change24h.toFixed(2)}%`,
      up: t.change24h >= 0,
    }))
  }

  const doubled = [...items, ...items]

  return (
    <div className="w-full overflow-hidden border-b border-[#1c2438] bg-[#070b14]/95 backdrop-blur z-20">
      <div className="animate-ticker-slide flex items-center gap-0 whitespace-nowrap">
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-6 py-2.5 border-r border-[#1c2438] transition-colors hover:bg-white/[0.03]"
          >
            <span className="font-mono text-xs font-bold text-[#94a3b8] tracking-wider uppercase">
              {item.sym}
            </span>
            <span className="font-mono text-xs font-semibold text-[#f8fafc]">{item.price}</span>
            <span
              className={`font-mono text-xs font-bold ${
                item.up ? 'text-[#10b981]' : 'text-[#ff2e54]'
              }`}
            >
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Hero() {
  const router = useRouter()
  const [selectedPair, setSelectedPair] = useState<'BTC' | 'ETH' | 'SOL'>('BTC')
  const preview = PAIR_PREVIEWS[selectedPair]

  return (
    <section className="relative min-h-[88vh] flex flex-col justify-center overflow-hidden bg-[#070b14] pt-12 pb-24 border-b border-[#1c2438]">
      {/* Precision coordinate grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#f8fafc 1px, transparent 1px), linear-gradient(90deg, #f8fafc 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Brand signature crimson ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ff2e54] opacity-[0.06] blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left column: Institutional Positioning */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff2e54] block shadow-[0_0_10px_#ff2e54] animate-pulse" />
            <span className="font-mono text-xs font-bold text-[#94a3b8] uppercase tracking-widest">
              Live Engine: Telemetry Synced
            </span>
          </div>

          <h1
            className="font-sans font-black text-white leading-[0.92] uppercase mb-6 tracking-tight select-none"
            style={{ fontSize: 'clamp(3.5rem, 7.5vw, 6.5rem)' }}
          >
            Trade
            <br />
            <span className="text-[#ff2e54]">Without</span>
            <br />
            Limits.
          </h1>

          <p className="text-[#94a3b8] text-lg leading-relaxed max-w-lg mb-10 font-normal">
            Adaptive Confluence Trading System. Autonomous multi-regime classification, mathematical
            factor convergence, and automated paper execution for digital assets.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
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
              Signal Matrix
            </Link>
            <Link
              href="/about"
              className="border border-transparent hover:border-[#1c2438] text-[#64748b] hover:text-[#94a3b8] font-sans font-medium uppercase tracking-wider text-sm px-6 py-4 transition-all duration-150 flex items-center justify-center"
            >
              System Architecture
            </Link>
          </div>

          {/* Institutional Architecture Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#1c2438]">
            <div>
              <div className="font-sans font-extrabold text-white text-lg leading-tight">4 Regimes</div>
              <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider">
                Bull / Bear / Chop / Comp
              </div>
            </div>
            <div>
              <div className="font-sans font-extrabold text-white text-lg leading-tight">5 Engines</div>
              <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider">
                Factor Convergence
              </div>
            </div>
            <div>
              <div className="font-sans font-extrabold text-[#10b981] text-lg leading-tight">15s Cycle</div>
              <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider">
                Telemetry Polling
              </div>
            </div>
            <div>
              <div className="font-sans font-extrabold text-[#ff2e54] text-lg leading-tight">Paper Mode</div>
              <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider">
                Zero Capital Risk
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Terminal & MiniChart */}
        <div className="relative">
          <div className="bg-[#0b101c] border border-[#1c2438] p-6 shadow-2xl relative">
            {/* Pair Switcher Header */}
            <div className="flex items-center justify-between mb-4 border-b border-[#1c2438] pb-3">
              <div className="flex items-center gap-2">
                {(['BTC', 'ETH', 'SOL'] as const).map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`font-mono text-xs px-3 py-1 font-bold transition-colors cursor-pointer ${
                      selectedPair === pair
                        ? 'bg-[#ff2e54] text-white'
                        : 'text-[#64748b] hover:text-white bg-white/[0.03]'
                    }`}
                  >
                    {pair}/USDT
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#64748b]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block animate-pulse" />
                <span>BINANCE STREAM</span>
              </div>
            </div>

            {/* Price & Change Banner */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-xs text-[#64748b] uppercase tracking-wider mb-1">
                  {preview.name} Reference Price
                </div>
                <div className="font-sans font-black text-white text-3xl tracking-tight">
                  ${preview.price}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs text-[#64748b] mb-1">24h Change</div>
                <div
                  className={`font-mono font-bold text-xl ${
                    preview.up ? 'text-[#10b981]' : 'text-[#ff2e54]'
                  }`}
                >
                  {preview.change}
                </div>
              </div>
            </div>

            {/* Live SVG Chart */}
            <div className="h-[150px] mb-4">
              <MiniChart points={preview.chartPoints} />
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-0 border-t border-[#1c2438] pt-4">
              {[
                { label: '24h Volume', val: preview.volume },
                { label: '24h High', val: `$${preview.high}` },
                { label: '24h Low', val: `$${preview.low}` },
              ].map((s) => (
                <div key={s.label} className="text-center border-r border-[#1c2438] last:border-r-0">
                  <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider mb-1">
                    {s.label}
                  </div>
                  <div className="font-mono text-sm font-bold text-[#f8fafc]">{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Confluence Telemetry Card */}
          <div className="mt-4 bg-[#101726] border border-[#1c2438] p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1c2438] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="font-mono text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Autonomous Engine Telemetry
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#ff2e54] font-bold">
                SCORE {preview.score}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-mono text-[10px] text-[#64748b] block uppercase">
                  Regime Detection
                </span>
                <span className="font-sans font-bold text-white">
                  {preview.regime}{' '}
                  <span className="text-[#10b981] font-mono text-[11px]">
                    ({preview.confidence})
                  </span>
                </span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#64748b] block uppercase">
                  Position Sizing
                </span>
                <span className="font-mono font-bold text-[#f8fafc]">
                  Kelly Multiplier: {preview.kelly}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1c2438] flex items-center justify-between font-mono text-[10px] text-[#64748b]">
              <span>Execution Signals & Brackets</span>
              <span className="text-[#94a3b8] flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff2e54]" />
                Token Protected
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const STATS = [
  { val: '4 REGIMES', label: 'Market Classification', sub: 'Bull, Bear, Volatile Chop, Compression' },
  { val: '5 ENGINES', label: 'Confluence Convergence', sub: 'Order Flow, Momentum, Vol, VWAP, Macro' },
  { val: '15s CYCLE', label: 'Telemetry Polling', sub: 'Low-latency Binance and CoinGecko feed' },
  { val: '0 RISK', label: 'Paper Trading Sandbox', sub: 'Simulated quantitative risk modeling' },
]

function Stats() {
  return (
    <section className="border-b border-[#1c2438] bg-[#090d18]">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#1c2438]">
        {STATS.map((s) => (
          <div key={s.label} className="px-8 py-10 transition-colors hover:bg-white/[0.015]">
            <div className="font-sans font-black text-[#ff2e54] text-3xl sm:text-4xl mb-2 uppercase tracking-tight">
              {s.val}
            </div>
            <div className="font-sans font-bold text-[#f8fafc] text-sm mb-1">{s.label}</div>
            <div className="font-mono text-[11px] text-[#64748b] uppercase tracking-wider">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

interface CapabilityItem {
  num: string
  title: string
  tag: string
  desc: string
  formula: string
  metrics: { label: string; val: string }[]
}

const CAPABILITIES: CapabilityItem[] = [
  {
    num: '01',
    title: 'Confluence Scoring Engine',
    tag: 'FACTOR CONVERGENCE',
    desc: 'Computes real-time signals by evaluating technical convergence on candle closes. Combines EMA alignments, ATR volatility filters, and orderbook imbalance into a composite confluence score.',
    formula: 'Score = w1*EMA + w2*ATR + w3*Imbalance + w4*VWAP',
    metrics: [
      { label: 'Order Flow Imbalance', val: '+68% Bid Dominance' },
      { label: 'Volatility Band (ATR)', val: '2.4x Dynamic Width' },
      { label: 'Session VWAP Delta', val: '+0.82% Above Anchor' },
    ],
  },
  {
    num: '02',
    title: '4-Regime Market Classifier',
    tag: 'REGIME DETECTION',
    desc: 'Dynamically classifies the macro environment into Trending Bull, Trending Bear, Volatile Choppy, or Low-Vol Compression to ensure strategies trade only in compatible market conditions.',
    formula: 'Regime = argmax P(R | Trend_ADX, Realized_Vol, Chop_Index)',
    metrics: [
      { label: 'Trending Bull', val: 'Active (86% Confidence)' },
      { label: 'Choppiness Index', val: '38.4 (Low Fragmentation)' },
      { label: 'ADX Trend Strength', val: '34.2 (Strong Momentum)' },
    ],
  },
  {
    num: '03',
    title: 'Dynamic Kelly Risk Sizing',
    tag: 'POSITION RISK ENGINE',
    desc: 'Applies fractional Kelly Criterion sizing to scale trade sizes according to calibrated win probabilities and risk-reward payoff ratios, preventing portfolio drawdown during adverse regimes.',
    formula: 'f* = (b*p - q) / b  |  Size = min(f* * Kelly_Mult, Max_Risk)',
    metrics: [
      { label: 'Calculated Win Prob (p)', val: '64.2%' },
      { label: 'Target Payoff Ratio (b)', val: '2.71 : 1' },
      { label: 'Fractional Kelly Multiplier', val: '0.50x Conservative' },
    ],
  },
  {
    num: '04',
    title: 'Self-Learning Feedback Loop',
    tag: 'AUTONOMOUS CALIBRATION',
    desc: 'Continuously monitors paper trade outcomes and runs counterfactual resolution checks. Uses Isotonic Regression to calibrate raw signal confidence and adjusts model weights dynamically.',
    formula: 'P_calibrated = IsotonicRegression(Raw_Score, Resolution_History)',
    metrics: [
      { label: 'Brier Calibration Score', val: '0.142 (High Precision)' },
      { label: 'Weight Drift Tolerance', val: '< 5% per 100 Candles' },
      { label: 'Counterfactual Checks', val: 'Automated 15m Horizon' },
    ],
  },
]

function Capabilities() {
  const [active, setActive] = useState(0)
  const current = CAPABILITIES[active]

  return (
    <section className="py-24 bg-[#070b14] border-b border-[#1c2438]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <div className="font-mono text-xs text-[#ff2e54] uppercase tracking-widest mb-4 font-bold">
            // Architecture & Core Engines
          </div>
          <h2 className="font-sans font-black text-white uppercase text-5xl md:text-7xl leading-[0.92] tracking-tight">
            Built for
            <br />
            <span className="text-[#64748b]">Systematic</span> Traders.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-[#1c2438]">
          {/* Navigation selector */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#1c2438]">
            {CAPABILITIES.map((c, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-full text-left p-8 border-b border-[#1c2438] last:border-b-0 transition-colors duration-150 group cursor-pointer ${
                  active === i ? 'bg-[#0c1220]' : 'hover:bg-[#0a0e1a]'
                }`}
              >
                <div className="flex items-start gap-5">
                  <span
                    className={`font-mono text-xs font-bold ${
                      active === i ? 'text-[#ff2e54]' : 'text-[#475569]'
                    } mt-1 transition-colors`}
                  >
                    {c.num}
                  </span>
                  <div className="flex-1">
                    <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-widest mb-2 font-semibold">
                      {c.tag}
                    </div>
                    <div
                      className={`font-sans font-bold text-xl uppercase mb-2 transition-colors ${
                        active === i ? 'text-white' : 'text-[#94a3b8] group-hover:text-white'
                      }`}
                    >
                      {c.title}
                    </div>
                    {active === i && (
                      <p className="text-sm text-[#94a3b8] leading-relaxed animate-in fade-in duration-200">
                        {c.desc}
                      </p>
                    )}
                  </div>
                  <div
                    className={`ml-3 transition-all duration-200 ${
                      active === i ? 'translate-x-0 opacity-100' : 'opacity-0 -translate-x-1'
                    }`}
                  >
                    <div className="w-1.5 h-8 bg-[#ff2e54] shadow-[0_0_8px_#ff2e54]" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Interactive Technical Terminal Pane */}
          <div className="bg-[#090d18] p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#1c2438] pb-4 mb-6">
                <div className="font-mono text-xs text-[#ff2e54] uppercase tracking-widest font-bold">
                  // {current.tag}
                </div>
                <div className="font-mono text-[11px] text-[#64748b] uppercase">
                  Engine Status: Active
                </div>
              </div>

              <div className="font-sans font-black text-white text-2xl sm:text-3xl uppercase mb-4 tracking-tight">
                {current.title}
              </div>

              <div className="bg-[#05080f] border border-[#1c2438] p-4 font-mono text-xs text-[#94a3b8] mb-8 overflow-x-auto">
                <div className="text-[#64748b] text-[10px] uppercase mb-1">Mathematical Model:</div>
                <div className="text-[#f8fafc] font-semibold">{current.formula}</div>
              </div>

              <div className="space-y-4">
                <div className="font-mono text-[10px] text-[#64748b] uppercase tracking-wider">
                  Live Engine Parameters:
                </div>
                {current.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-[#1c2438] bg-[#0c1220]"
                  >
                    <span className="font-mono text-xs text-[#94a3b8]">{m.label}</span>
                    <span className="font-mono text-xs font-bold text-[#10b981]">{m.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-[#1c2438] flex items-center justify-between">
              <span className="font-mono text-xs text-[#64748b]">
                Telemetry verification: Supabase heartbeat synced
              </span>
              <Link
                href="/dashboard/signals"
                className="font-mono text-xs text-[#ff2e54] hover:text-[#e11d48] uppercase tracking-wider font-bold transition-colors"
              >
                Inspect Live Matrix &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const AUDIT_SIGNALS = [
  {
    pair: 'BTC/USDT',
    type: 'TREND CONFLUENCE LONG',
    regime: 'Trending Bull',
    score: '8.4 / 10',
    entry: '$68,420.00',
    exit: '$71,020.00',
    result: '+3.80% Resolved',
    kelly: '1.35x Size',
    factors: 'EMA20/50 Cross + Orderbook Imbalance + Volume Delta',
  },
  {
    pair: 'ETH/USDT',
    type: 'MEAN REVERSION LONG',
    regime: 'Volatile Choppy',
    score: '7.6 / 10',
    entry: '$2,210.00',
    exit: '$2,263.00',
    result: '+2.40% Resolved',
    kelly: '0.85x Size',
    factors: 'Bollinger Band Lower Touch + Session VWAP Anchor',
  },
  {
    pair: 'SOL/USDT',
    type: 'BREAKOUT EXPANSION',
    regime: 'Low-Vol Compression',
    score: '8.1 / 10',
    entry: '$81.40',
    exit: '$85.60',
    result: '+5.15% Resolved',
    kelly: '1.10x Size',
    factors: 'ATR Squeeze Release + ADX > 25 + Bid Depth Surge',
  },
]

function SignalAudit() {
  return (
    <section className="py-24 bg-[#070b14] border-b border-[#1c2438]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="font-mono text-xs text-[#ff2e54] uppercase tracking-widest mb-4 font-bold">
              // Real-Time Signal Audit
            </div>
            <h2 className="font-sans font-black text-white uppercase text-5xl md:text-6xl leading-[0.92] tracking-tight">
              Confluence
              <br />
              <span className="text-[#64748b]">In Action.</span>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="font-mono text-xs text-[#64748b] uppercase tracking-wider font-semibold">
              Simulated In Paper Sandbox
            </div>
            <Link
              href="/dashboard/signals"
              className="border border-[#1c2438] hover:border-[#ff2e54]/50 text-white font-mono text-xs uppercase px-4 py-2 bg-white/[0.02] transition-colors"
            >
              Full Signal Ledger &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#1c2438]">
          {AUDIT_SIGNALS.map((s, i) => (
            <div
              key={i}
              className="p-8 border-b md:border-b-0 md:border-r border-[#1c2438] last:border-r-0 flex flex-col justify-between gap-6 hover:bg-[#0c1220] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                    {s.pair}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 border border-[#10b981]/20">
                    {s.result}
                  </span>
                </div>

                <div className="font-sans font-bold text-white text-lg mb-1 uppercase tracking-tight">
                  {s.type}
                </div>
                <div className="font-mono text-xs text-[#64748b] uppercase mb-4">
                  Regime: <span className="text-[#94a3b8]">{s.regime}</span>
                </div>

                <div className="bg-[#05080f] border border-[#1c2438] p-3 mb-4 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-[#94a3b8]">
                    <span>Entry: {s.entry}</span>
                    <span>Exit: {s.exit}</span>
                  </div>
                  <div className="flex justify-between text-[#64748b]">
                    <span>Confluence: {s.score}</span>
                    <span>{s.kelly}</span>
                  </div>
                </div>

                <p className="text-[#94a3b8] text-xs leading-relaxed">
                  <span className="text-[#64748b] font-mono uppercase block text-[10px] mb-1">
                    Convergence Factors:
                  </span>
                  {s.factors}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1c2438] flex items-center justify-between font-mono text-[10px] text-[#64748b] uppercase">
                <span>Execution: Paper Sandbox</span>
                <span className="text-[#10b981]">Verified Outcome</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const HOW_STEPS = [
  {
    n: '1',
    title: 'Launch the Terminal',
    desc: 'Open the autonomous trading dashboard to view real-time candle streaming, orderbook telemetry, and regime status with zero registration friction.',
  },
  {
    n: '2',
    title: 'Inspect Regime Confluence',
    desc: 'Analyze multi-engine convergence scores across order flow imbalance, ATR volatility, session VWAP, and algorithmic momentum indicators.',
  },
  {
    n: '3',
    title: 'Simulate in Paper Sandbox',
    desc: 'Simulate trading strategies using automated Kelly Criterion position sizing, dynamic risk controls, and automated outcome resolution.',
  },
]

function HowItWorks() {
  return (
    <section className="py-24 bg-[#090d18] border-b border-[#1c2438]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <div className="font-mono text-xs text-[#ff2e54] uppercase tracking-widest mb-4 font-bold">
            // Execution Workflow
          </div>
          <h2 className="font-sans font-black text-white uppercase text-5xl md:text-6xl leading-[0.92] tracking-tight">
            Three Steps.
            <br />
            <span className="text-[#64748b]">Zero Capital Risk.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#1c2438]">
          {HOW_STEPS.map((s, i) => (
            <div
              key={i}
              className="p-10 border-b md:border-b-0 md:border-r border-[#1c2438] last:border-r-0 relative overflow-hidden group hover:bg-[#0c1322] transition-colors duration-200"
            >
              {/* Giant watermark number */}
              <div
                className="absolute top-0 right-3 font-sans font-black text-[#151e33] group-hover:text-[#1c2844] transition-colors pointer-events-none select-none"
                style={{ fontSize: 'clamp(6rem, 12vw, 9rem)', lineHeight: 0.9 }}
              >
                {s.n}
              </div>
              <div className="relative z-10">
                <div className="w-8 h-1 bg-[#ff2e54] mb-8 shadow-[0_0_8px_#ff2e54]" />
                <div className="font-sans font-black text-white text-2xl uppercase mb-4 tracking-tight">
                  {s.title}
                </div>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  const router = useRouter()

  return (
    <section className="relative overflow-hidden bg-[#ff2e54] py-24 text-white">
      {/* Precision coordinate grid texture */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#ff5978] blur-[120px] opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <div className="font-mono text-xs text-white/80 uppercase tracking-widest mb-6 font-bold">
          // Autonomous Quantitative Trading
        </div>
        <h2
          className="font-sans font-black text-white uppercase leading-[0.88] mb-8 tracking-tight select-none"
          style={{ fontSize: 'clamp(3rem, 8.5vw, 7.5rem)' }}
        >
          Execute With
          <br />
          Mathematical Confluence.
        </h2>
        <p className="text-white/90 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
          Access the institutional web terminal, evaluate real-time market regimes, and simulate
          strategies with zero capital risk.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white text-[#ff2e54] hover:bg-[#f8fafc] font-sans font-black uppercase tracking-wider text-base px-10 py-4 transition-all duration-150 flex items-center gap-3 shadow-2xl cursor-pointer"
          >
            Launch Terminal
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 9h12M11 5l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              />
            </svg>
          </button>
          <Link
            href="/dashboard/signals"
            className="border-2 border-white/60 hover:border-white text-white font-sans font-bold uppercase tracking-wider text-base px-10 py-4 transition-all duration-150"
          >
            Explore Signal Matrix
          </Link>
          <a
            href="https://t.me/AytasATbot"
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-white/20 hover:border-white text-white/80 hover:text-white font-sans font-bold uppercase tracking-wider text-base px-8 py-4 transition-all duration-150"
          >
            Telegram Bot
          </a>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12 pt-8 border-t border-white/20">
          {[
            { tag: 'STREAM', label: 'Real-Time Binance Feed' },
            { tag: 'SAFETY', label: 'Zero Capital Risk Paper Mode' },
            { tag: 'CONFLUENCE', label: 'Multi-Engine Weighting' },
            { tag: 'ALERTS', label: 'Telegram Notification Bot' },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 font-bold">
                {badge.tag}
              </span>
              <span className="font-mono text-xs text-white/90 uppercase tracking-wider font-semibold">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
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
  )
}

export default function Home() {
  return (
    <div className="min-h-full bg-[#070b14] text-[#f8fafc] flex flex-col">
      <TickerBar />
      <Hero />
      <Stats />
      <Capabilities />
      <SignalAudit />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  )
}
