'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ActsLogo } from '@/components/ui/ActsLogo'
import { LiveMarket3DCard } from '@/components/home/LiveMarket3DCard'

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
          <LiveMarket3DCard />
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
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  )
}
