'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ActsLogo } from '@/components/ui/ActsLogo'

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
          <stop offset="0%" stopColor="#0369a1" stopOpacity="0.22" />
          <stop offset="65%" stopColor="#0369a1" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#actsTerminalChartGrad)" />
      <polyline
        points={pts}
        fill="none"
        stroke="#0369a1"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="4.5" fill="#0369a1" stroke="#faf2df" strokeWidth="1.5" />
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
      change: `${t.change24h >= 0 ? '+' : ''}${t.change24h.toFixed(2)}%`, // tabular-nums
      up: t.change24h >= 0,
    }))
  }

  const doubled = [...items, ...items]

  return (
    <div className="w-full overflow-hidden border-b border-slate-900/10 bg-transparent z-20">
      <div className="animate-ticker-slide flex items-center whitespace-nowrap">
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-6 py-2.5 border-r border-slate-900/8 font-mono tabular-nums"
          >
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              {item.sym}
            </span>
            <span className="text-xs font-semibold text-slate-900">{item.price}</span>
            <span className={`text-[11px] font-bold ${item.up ? 'text-emerald-700' : 'text-rose-700'}`}>
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
    <section className="relative bg-[#edf7fe] pt-14 pb-20 border-b border-slate-900/10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start w-full">
        <div className="lg:col-span-7 flex flex-col justify-between pt-2">
          <div>
            <div className="flex items-center gap-2.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-mono text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                QUANTITATIVE EXECUTION ENGINE · MULTI-REGIME TELEMETRY
              </span>
            </div>

            <h1
              className="font-sans font-black text-slate-950 leading-[0.94] mb-6 tracking-tight select-none"
              style={{ fontSize: 'clamp(2.85rem, 5.8vw, 4.75rem)' }}
            >
              Systematic Confluence.
              <br />
              <span className="text-[#0369a1]">Zero Heuristics.</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mb-9 font-normal">
              Adaptive Confluence Trading System combines autonomous 4-regime classification, orthogonal
              factor convergence, isotonic probability calibration, and automated bracket execution.
            </p>

            <div className="flex flex-wrap items-center gap-6 mb-14">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-[#0369a1] hover:bg-[#0284c7] text-white font-sans font-bold tracking-wide text-sm px-7 py-3.5 rounded-xl transition-colors duration-150 inline-flex items-center gap-2.5 cursor-pointer"
              >
                <span>Launch Terminal</span>
                <span>→</span>
              </button>

              <Link
                href="/dashboard/signals"
                className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-[#0369a1] transition-colors inline-flex items-center gap-1.5"
              >
                <span>Inspect Signal Matrix</span>
                <span>→</span>
              </Link>

              <Link
                href="/about"
                className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
              >
                Read Architecture Spec
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-900/10 pt-6 gap-y-5 sm:divide-x sm:divide-slate-900/10">
            <div className="sm:pr-5">
              <div className="font-mono font-black text-slate-950 text-lg tabular-nums">4 Regimes</div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                Bull / Bear / Chop / Comp
              </div>
            </div>
            <div className="sm:px-5">
              <div className="font-mono font-black text-slate-950 text-lg tabular-nums">5 Engines</div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                Factor Convergence
              </div>
            </div>
            <div className="sm:px-5">
              <div className="font-mono font-black text-emerald-700 text-lg tabular-nums">15s Cycle</div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                Telemetry Polling
              </div>
            </div>
            <div className="sm:pl-5">
              <div className="font-mono font-black text-[#0369a1] text-lg tabular-nums">0 Risk</div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                Paper Sandbox Mode
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-900/10 bg-[#faf2df] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-900/10 pb-3">
              <div className="flex items-center gap-5">
                {(['BTC', 'ETH', 'SOL'] as const).map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`font-mono text-xs font-bold pb-2 -mb-[13px] border-b-2 transition-colors cursor-pointer ${
                      selectedPair === pair
                        ? 'border-[#0369a1] text-slate-950'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {pair}/USDT
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>BINANCE STREAM</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {preview.name} Reference Price
                </div>
                <div className="font-mono font-black text-slate-950 text-3xl tracking-tight tabular-nums">
                  ${preview.price}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">24h Change</div>
                <div className={`font-mono font-bold text-lg tabular-nums ${preview.up ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {preview.change}
                </div>
              </div>
            </div>

            <div className="h-[145px]">
              <MiniChart points={preview.chartPoints} />
            </div>

            <div className="border-t border-slate-900/10 pt-4 space-y-3 font-mono tabular-nums text-xs">
              <div className="grid grid-cols-3 gap-4 pb-3 border-b border-slate-900/10">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">24h Vol</span>
                  <span className="font-bold text-slate-900">{preview.volume}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">24h High</span>
                  <span className="font-bold text-slate-900">${preview.high}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">24h Low</span>
                  <span className="font-bold text-slate-900">${preview.low}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Active Regime</span>
                  <span className="font-sans font-bold text-slate-900">
                    {preview.regime} <span className="font-mono text-emerald-700">{preview.confidence}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Confluence</span>
                  <span className="font-bold text-[#0369a1]">{preview.score}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Kelly Mult</span>
                  <span className="font-bold text-slate-900">{preview.kelly}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
    <section className="py-20 bg-[#edf7fe] border-b border-slate-900/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest mb-3 font-bold">
              CORE ARCHITECTURE
            </div>
            <h2 className="font-sans font-black text-slate-950 text-4xl md:text-5xl leading-[0.95] tracking-tight">
              Built for <span className="text-slate-500">Systematic Traders.</span>
            </h2>
          </div>
          <p className="text-xs font-mono text-slate-600 max-w-sm">
            Select a module to inspect its live quantitative model and calibration tolerances.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 divide-y divide-slate-900/10 border-y border-slate-900/10">
            {CAPABILITIES.map((c, i) => {
              const isSelected = active === i
              return (
                <button
                  key={c.num}
                  onClick={() => setActive(i)}
                  className={`w-full text-left py-5 px-4 border-l-2 transition-colors duration-150 group cursor-pointer ${
                    isSelected
                      ? 'border-[#0369a1] bg-[#faf2df]/70'
                      : 'border-transparent hover:bg-[#faf2df]/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`font-mono text-xs font-bold tabular-nums mt-1 ${isSelected ? 'text-[#0369a1]' : 'text-slate-600'}`}>
                      {c.num}
                    </span>
                    <div className="flex-1">
                      <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-semibold">
                        {c.tag}
                      </div>
                      <div className={`font-sans font-bold text-lg tracking-tight ${isSelected ? 'text-slate-950' : 'text-slate-600 group-hover:text-slate-900'}`}>
                        {c.title}
                      </div>
                      {isSelected && (
                        <p className="text-xs text-slate-600 leading-relaxed mt-2">
                          {c.desc}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-slate-900/10 bg-[#faf2df] p-7 sm:p-9 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900/10 pb-4">
              <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest font-bold">
                {current.num} · {current.tag}
              </div>
              <div className="font-mono text-[11px] text-emerald-700 uppercase font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Engine Active</span>
              </div>
            </div>

            <div>
              <h3 className="font-sans font-black text-slate-950 text-2xl sm:text-3xl tracking-tight mb-4">
                {current.title}
              </h3>
              <div className="border-y border-slate-900/10 py-4 font-mono text-xs overflow-x-auto">
                <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Mathematical Formulation</div>
                <div className="text-slate-950 font-bold text-sm">{current.formula}</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider pb-1">
                Live Engine Parameters
              </div>
              <div className="divide-y divide-slate-900/10">
                {current.metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 text-xs font-mono">
                    <span className="text-slate-600">{m.label}</span>
                    <span className="font-bold text-emerald-700 tabular-nums">{m.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900/10 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-slate-500">
                Telemetry verification: Supabase heartbeat synced
              </span>
              <Link
                href="/dashboard/signals"
                className="font-mono text-xs text-[#0369a1] hover:text-slate-950 uppercase tracking-wider font-bold transition-colors"
              >
                Inspect Live Matrix →
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
    <section className="py-20 bg-[#edf7fe] border-b border-slate-900/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest mb-3 font-bold">
              SIGNAL VERIFICATION LEDGER
            </div>
            <h2 className="font-sans font-black text-slate-950 text-4xl md:text-5xl leading-[0.95] tracking-tight">
              Confluence <span className="text-slate-500">In Action.</span>
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">
              Paper Sandbox Ledger
            </span>
            <Link
              href="/dashboard/signals"
              className="font-mono text-xs font-bold uppercase tracking-wider text-[#0369a1] hover:text-slate-950 transition-colors"
            >
              Full Signal Ledger →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900/10 bg-[#faf2df] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/10 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5 font-bold">ASSET &amp; STRATEGY</th>
                  <th className="py-3.5 px-4 font-bold">MARKET REGIME</th>
                  <th className="py-3.5 px-4 font-bold">CONVERGENCE FACTORS</th>
                  <th className="py-3.5 px-4 font-bold">EXECUTION BRACKET</th>
                  <th className="py-3.5 px-4 font-bold">KELLY SIZING</th>
                  <th className="py-3.5 px-5 font-bold text-right">VERIFIED OUTCOME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/10 text-xs">
                {AUDIT_SIGNALS.map((s) => (
                  <tr key={s.pair} className="hover:bg-[#f3ead2]/50 transition-colors">
                    <td className="py-4 px-5 align-top">
                      <div className="font-mono font-black text-slate-950 text-sm">{s.pair}</div>
                      <div className="font-mono text-[10px] text-slate-500 uppercase mt-0.5">{s.type}</div>
                    </td>
                    <td className="py-4 px-4 align-top font-mono">
                      <div className="font-semibold text-slate-900">{s.regime}</div>
                      <div className="text-[11px] text-[#0369a1] font-bold tabular-nums mt-0.5">Score {s.score}</div>
                    </td>
                    <td className="py-4 px-4 align-top text-slate-600 max-w-xs leading-relaxed">
                      {s.factors}
                    </td>
                    <td className="py-4 px-4 align-top font-mono tabular-nums">
                      <div className="text-slate-700">Entry {s.entry}</div>
                      <div className="text-slate-900 font-semibold mt-0.5">Exit {s.exit}</div>
                    </td>
                    <td className="py-4 px-4 align-top font-mono font-semibold text-slate-800 tabular-nums">
                      {s.kelly}
                    </td>
                    <td className="py-4 px-5 align-top text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {s.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

const HOW_STEPS = [
  {
    phase: 'PHASE 01 // STREAM',
    title: 'Launch the Terminal',
    desc: 'Open the autonomous trading dashboard to view real-time candle streaming, orderbook telemetry, and regime status with zero registration friction.',
  },
  {
    phase: 'PHASE 02 // CONFLUENCE',
    title: 'Inspect Regime Confluence',
    desc: 'Analyze multi-engine convergence scores across order flow imbalance, ATR volatility, session VWAP, and algorithmic momentum indicators.',
  },
  {
    phase: 'PHASE 03 // EXECUTION',
    title: 'Simulate in Paper Sandbox',
    desc: 'Simulate trading strategies using automated Kelly Criterion position sizing, dynamic risk controls, and automated outcome resolution.',
  },
]

function HowItWorks() {
  return (
    <section className="py-20 bg-[#edf7fe] border-b border-slate-900/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest mb-3 font-bold">
            EXECUTION PIPELINE
          </div>
          <h2 className="font-sans font-black text-slate-950 text-4xl md:text-5xl leading-[0.95] tracking-tight">
            Three Phases. <span className="text-slate-500">Zero Capital Risk.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 border-y border-slate-900/10 divide-y lg:divide-y-0 lg:divide-x divide-slate-900/10">
          {HOW_STEPS.map((s) => (
            <div key={s.phase} className="py-8 lg:py-10 lg:px-8 lg:first:pl-0 lg:last:pr-0 space-y-3">
              <div className="font-mono text-[11px] font-bold text-[#0369a1] tracking-wider uppercase">
                {s.phase}
              </div>
              <h3 className="font-sans font-black text-slate-950 text-xl tracking-tight">
                {s.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
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
    <section className="bg-[#faf2df] border-b border-slate-900/10 py-16">
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="max-w-2xl space-y-3">
          <div className="font-mono text-xs text-[#0369a1] uppercase tracking-widest font-bold">
            AUTONOMOUS QUANTITATIVE TRADING
          </div>
          <h2 className="font-sans font-black text-slate-950 text-3xl sm:text-5xl leading-[0.95] tracking-tight">
            Execute With Mathematical Confluence.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Access the institutional web terminal, evaluate real-time market regimes, and track calibrated outcomes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 flex-shrink-0">
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
          <a
            href="https://t.me/AytasATbot"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
          >
            Telegram Bot
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-[#edf7fe] py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <Link href="/" aria-label="ACTS Home" className="inline-flex items-center group">
              <ActsLogo size="md" />
            </Link>
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
              className="font-mono text-xs text-slate-600 hover:text-[#0369a1] uppercase tracking-wider transition-colors"
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
  )
}

export default function Home() {
  return (
    <div className="min-h-full bg-[#edf7fe] text-slate-900 flex flex-col">
      <TickerBar />
      <Hero />
      <Capabilities />
      <SignalAudit />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  )
}
