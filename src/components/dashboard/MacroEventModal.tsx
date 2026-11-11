'use client'

import React, { useState, useEffect } from 'react'

export interface EconomicEvent {
  title: string
  country: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  date_time: string
  forecast?: string | null
  previous?: string | null
  actual?: string | null
  image_url?: string
}

export interface NewsArticle {
  title: string
  source: string
  url: string
  published_at: string
  category: 'crypto' | 'rumor' | 'macro'
  image_url?: string
}

interface MacroEventModalProps {
  event: EconomicEvent | null
  onClose: () => void
  articles?: NewsArticle[]
}

interface MacroDossier {
  agency: string
  agencyUrl: string
  indicatorName: string
  releaseFrequency: string
  officialDescription: string
  methodologySummary: string
  marketImplication: string
  cryptoImpact: string
  transmissionMechanism: string[]
}

function getEventDossier(event: EconomicEvent): MacroDossier {
  const t = event.title.toLowerCase()

  // 1. PPI (Producer Price Index)
  if (t.includes('ppi') || t.includes('producer price')) {
    return {
      agency: 'U.S. Bureau of Labor Statistics (BLS) · Dept. of Labor',
      agencyUrl: 'https://www.bls.gov/ppi/',
      indicatorName: 'Producer Price Index (PPI) for Final Demand',
      releaseFrequency: 'Monthly (typically 8:30 AM ET)',
      officialDescription:
        'The Producer Price Index (PPI) measures the average changes in selling prices received by domestic producers for their output. It serves as an essential leading indicator of wholesale inflation before costs filter downstream into consumer retail prices.',
      methodologySummary:
        'Sampled across approximately 10,000 monthly price quotations spanning domestic manufacturing, agriculture, mining, and service industries. Core PPI strips out volatile food, energy, and commercial trade services to evaluate underlying pipeline inflation.',
      marketImplication:
        'Wholesale pipeline inflation influences FOMC policy rate projections. A hotter-than-expected print raises short-term Treasury yields and delays rate-cut expectations, while soft prints confirm sustained disinflation.',
      cryptoImpact:
        'Constructive on in-line or soft prints. Lower pipeline inflation suppresses the US Dollar Index (DXY) and 2Y Treasury yields, providing liquidity tailwinds for Bitcoin (BTC/USDT) spot capital inflows.',
      transmissionMechanism: [
        'Pipeline Inflation Transmission: Directly informs forward-looking PCE deflator projections monitored by the Fed.',
        'Fed Funds Futures: Modulates the implied probability of 25bps vs 50bps rate adjustments at upcoming FOMC meetings.',
        'Cost of Capital Discount: Softer wholesale inflation compresses yields, expanding institutional risk asset appetite.',
      ],
    }
  }

  // 2. Jobless Claims / Labor Data
  if (t.includes('jobless') || t.includes('claims') || t.includes('unemployment') || t.includes('payroll')) {
    return {
      agency: 'Employment & Training Administration · U.S. Dept. of Labor',
      agencyUrl: 'https://www.dol.gov/ui/data.pdf',
      indicatorName: 'Weekly Initial & Continuing Unemployment Claims',
      releaseFrequency: 'Weekly (Every Thursday at 8:30 AM ET)',
      officialDescription:
        'Tracks the weekly number of individuals who filed for initial state unemployment insurance benefits across the United States. It provides the earliest, most responsive high-frequency telemetry on layoffs and labor market velocity.',
      methodologySummary:
        'Aggregated directly from state workforce agencies under the federal-state unemployment insurance system. The 4-week moving average is monitored to smooth out seasonal volatility and holiday reporting variations.',
      marketImplication:
        'Initial claims remaining near historical lows (sub-230K) demonstrate economic resilience without immediate recession danger. Claims persistently rising above 250K signal accelerating labor softening and prompt faster monetary easing.',
      cryptoImpact:
        'Orderly labor market cooling supports a dovish monetary policy posture without triggering hard-landing growth panic, preserving stable market liquidity for digital assets.',
      transmissionMechanism: [
        'High-Frequency Labor Health: Detects turning points in the domestic business cycle weeks before monthly payroll releases.',
        'Fed Dual Mandate: Labor softening tilts the Federal Reserve toward rate reductions under the maximum sustainable employment mandate.',
        'Credit Conditions: Sustained employment supports consumer debt servicing and institutional risk appetite.',
      ],
    }
  }

  // 3. CPI (Consumer Price Index)
  if (t.includes('cpi') || t.includes('consumer price')) {
    return {
      agency: 'U.S. Bureau of Labor Statistics (BLS) · Dept. of Labor',
      agencyUrl: 'https://www.bls.gov/cpi/',
      indicatorName: 'Consumer Price Index for All Urban Consumers (CPI-U)',
      releaseFrequency: 'Monthly (typically 8:30 AM ET)',
      officialDescription:
        'The primary monthly gauge tracking price changes paid by urban consumers for a representative market basket of consumer goods and services. It represents the spending habits of approximately 93% of the U.S. population.',
      methodologySummary:
        'Calculated from monthly prices collected in 75 urban areas from roughly 23,000 retail and service establishments and 50,000 rental housing units. Core CPI strips out volatile food and energy prices to isolate persistent structural inflation.',
      marketImplication:
        'The single most volatile monthly macro release. Disinflation confirms the Federal Reserve easing cycle, lowering real yields across global sovereign debt and spurring cross-asset rallies.',
      cryptoImpact:
        'High Bullish Alignment (+10.0 pts in Factor 9). When CPI prints at or below expectations, the dollar weakens and market liquidity expands, historically correlating with aggressive BTC/USDT price appreciation.',
      transmissionMechanism: [
        'Monetary Policy Trajectory: The direct catalyst determining whether the FOMC cuts, pauses, or hikes the federal funds target rate.',
        'US Dollar Index (DXY): Inversely correlated with digital asset valuations; falling inflation softens the sovereign dollar.',
        'Real Yield Contraction: Declining inflation expectations suppress real benchmark bond yields, reducing the opportunity cost of holding scarce digital assets.',
      ],
    }
  }

  // 4. Consumer Sentiment & Inflation Expectations (University of Michigan)
  if (t.includes('michigan') || t.includes('sentiment') || t.includes('inflation expectations')) {
    return {
      agency: 'Surveys of Consumers · University of Michigan',
      agencyUrl: 'https://data.sca.isr.umich.edu/',
      indicatorName: 'Index of Consumer Sentiment & 1Y/5Y Inflation Expectations',
      releaseFrequency: 'Bi-Monthly (Preliminary mid-month, Final end-of-month at 10:00 AM ET)',
      officialDescription:
        'Assesses consumer confidence regarding personal finances, short-term economic prospects, and long-term economic horizons. Includes widely referenced consumer inflation expectations across 1-year and 5-year outlooks.',
      methodologySummary:
        'Conducted via telephone interviews with at least 500 households nationwide. Aggregates responses on current economic conditions and consumer expectations into standardized index values benchmarked against 1966 baseline levels.',
      marketImplication:
        'Consumer spending drives roughly 70% of U.S. GDP. Central bankers monitor long-term inflation expectations to ensure public psychology remains firmly anchored around the 2.0% target.',
      cryptoImpact:
        'Resilient sentiment alongside stable inflation expectations confirms macro stability, encouraging institutional asset managers to maintain risk allocations.',
      transmissionMechanism: [
        'Consumer Spending Expectations: Provides forward guidance on consumer spending velocity and economic momentum.',
        'Inflation Psychology: The Fed monitors 5-year inflation expectations to ensure consumer perceptions do not become unanchored.',
      ],
    }
  }

  // 5. Retail Sales
  if (t.includes('retail') || t.includes('sales')) {
    return {
      agency: 'U.S. Census Bureau · Dept. of Commerce',
      agencyUrl: 'https://www.census.gov/retail/',
      indicatorName: 'Advance Monthly Sales for Retail & Food Services',
      releaseFrequency: 'Monthly (typically 8:30 AM ET)',
      officialDescription:
        'Estimates aggregate consumer spending across retail merchandise and food services in the United States. Serves as a vital barometer for domestic consumer demand and economic health.',
      methodologySummary:
        'Compiled from a stratified random survey of approximately 5,500 retail firms nationwide. Figures are adjusted for seasonal variations and trading-day differences, but are not adjusted for price inflation.',
      marketImplication:
        'Healthy retail sales dispel immediate recession fears and support corporate earnings. Overheated spending, however, can raise concerns over demand-pull inflation resurgence.',
      cryptoImpact:
        'Steady consumer demand validates steady macroeconomic health, establishing a constructive macro foundation for digital asset adoption and trading volume.',
      transmissionMechanism: [
        'Personal Consumption Component: Feeds directly into quarterly GDP calculation models by the BEA.',
        'Corporate Cash Flows: Healthy consumer spending sustains corporate revenues and institutional balance sheet strength.',
      ],
    }
  }

  // 6. FOMC / Federal Funds Rate / Fed Press Conference
  if (t.includes('fomc') || t.includes('federal funds') || t.includes('rate decision') || t.includes('powell') || t.includes('statement')) {
    return {
      agency: 'Federal Open Market Committee (FOMC) · Federal Reserve System',
      agencyUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
      indicatorName: 'Federal Funds Target Rate & FOMC Press Conference',
      releaseFrequency: '8 Scheduled Meetings Per Year (Statement 2:00 PM ET, Presser 2:30 PM ET)',
      officialDescription:
        'The Federal Open Market Committee establishes the target range for the federal funds rate—the benchmark rate at which commercial banks lend reserve balances overnight. The decision is followed immediately by the Fed Chair’s live press conference.',
      methodologySummary:
        'Determined by consensus vote of the 12-member committee (7 Board of Governors, President of the NY Fed, and 4 rotating regional Fed Presidents). Accompanied quarterly by the Summary of Economic Projections (SEP "dot plot").',
      marketImplication:
        'The premier volatility event in global capital markets. Dictates the global cost of sovereign dollar liquidity, Treasury yield curves, and quantitative tightening (QT) balance sheet parameters.',
      cryptoImpact:
        'Maximum Volatility Confluence (+10.0 pts in Factor 9). Shifts in central bank liquidity conditions historically represent the primary macroeconomic determinant of multi-month Bitcoin expansion and contraction cycles.',
      transmissionMechanism: [
        'Global Sovereign Benchmark: Establishes base risk-free rates across the entire international financial architecture.',
        'M2 Global Money Supply: Interest rate reductions expand global liquidity, directly benefiting decentralized stores of value.',
        'Press Conference Guidance: Chair remarks on labor balance and terminal rates trigger immediate cross-asset repricing.',
      ],
    }
  }

  // 7. GDP (Gross Domestic Product)
  if (t.includes('gdp') || t.includes('gross domestic product')) {
    return {
      agency: 'Bureau of Economic Analysis (BEA) · Dept. of Commerce',
      agencyUrl: 'https://www.bea.gov/data/gdp/gross-domestic-product',
      indicatorName: 'Gross Domestic Product (GDP) by Quarter',
      releaseFrequency: 'Quarterly (Advance, Second, and Final estimates at 8:30 AM ET)',
      officialDescription:
        'The most comprehensive measure of total U.S. economic output. Captures personal consumption expenditures, private domestic business investment, government spending, and net exports.',
      methodologySummary:
        'Aggregated by the BEA from monthly Census Bureau trade data, BLS price indexes, and Department of the Treasury fiscal accounts. Final estimate incorporates complete inventory adjustments.',
      marketImplication:
        'Confirms the finalized pace of quarterly economic expansion or contraction, confirming whether the economy is in an expansionary soft landing or contractionary regime.',
      cryptoImpact:
        'Positive GDP growth reduces recession risk premia, maintaining favorable risk-on conditions across alternative capital markets.',
      transmissionMechanism: [
        'National Output Benchmark: Finalized accounting of aggregate economic activity and productivity.',
        'Corporate Profitability: Underpins macroeconomic corporate earnings and institutional investment allocation.',
      ],
    }
  }

  // 8. PCE (Personal Consumption Expenditures)
  if (t.includes('pce') || t.includes('consumption expenditures')) {
    return {
      agency: 'Bureau of Economic Analysis (BEA) · Dept. of Commerce',
      agencyUrl: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index',
      indicatorName: 'Core Personal Consumption Expenditures (PCE) Price Index',
      releaseFrequency: 'Monthly (typically 8:30 AM ET)',
      officialDescription:
        'The Federal Reserve’s officially preferred barometer of consumer inflation. Tracks price movements of goods and services purchased by domestic consumers, incorporating substitution behavior as prices fluctuate.',
      methodologySummary:
        'Derived from GDP consumer expenditure data using chained Fisher index formulas. Core PCE excludes volatile food and energy costs to provide the FOMC with the cleanest view of secular inflation trends.',
      marketImplication:
        'Directly dictates FOMC policy decisions. When Core PCE tracks toward 2.0%, the Federal Reserve possesses clear justification to lower the policy rate toward neutral.',
      cryptoImpact:
        'Strong Bullish Catalyst on disinflationary prints. Soft PCE prints reassure institutional capital that the easing cycle remains intact, fostering sustained crypto inflows.',
      transmissionMechanism: [
        'Fed Target Benchmark: The specific statutory indicator evaluated against the FOMC 2.0% annual inflation mandate.',
        'Real Yield Repricing: Declining inflation widens real policy restrictiveness unless benchmark nominal rates are cut in tandem.',
      ],
    }
  }

  // Fallback: General Bureau Indicator
  return {
    agency: 'U.S. Federal Statistical Agencies · Official Economic Release',
    agencyUrl: 'https://www.forexfactory.com/calendar',
    indicatorName: event.title,
    releaseFrequency: 'Scheduled Periodic Economic Release',
    officialDescription:
      `The official economic release for ${event.title} provides fundamental data points regarding domestic economic velocity, output, or liquidity conditions ingested by institutional algorithmic trading systems.`,
    methodologySummary:
      'Compiled and audited according to federal statistical standards. Ingested across algorithmic execution desks to calibrate sovereign yield curves and multi-asset volatility exposure.',
    marketImplication:
      'Maintains orderly financial market conditions within historical confidence intervals without introducing unexpected systemic risk.',
    cryptoImpact:
      'Neutral to Constructive. Predictable macroeconomic baseline allows technical price structure, order flow, and spot demand to guide Bitcoin price discovery.',
    transmissionMechanism: [
      'Liquidity Transmission: Orderly economic baseline supports stable order book depth and predictable market spreads.',
      'Confluence Weighting: Factor 9 maintains calibrated fundamental scoring.',
    ],
  }
}

export function MacroEventModal({ event, onClose, articles = [] }: MacroEventModalProps) {
  const [activeTab, setActiveTab] = useState<'narrative' | 'wires' | 'impact'>('narrative')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (event) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [event, onClose])

  if (!event) return null

  const eventTime = new Date(event.date_time).getTime() || 0
  const now = Date.now()
  const isPending = !event.actual && eventTime > now
  const isHigh = event.impact === 'HIGH'

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // Strict keyword matching for related articles
  const titleWords = event.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['speaks', 'policy', 'report', 'index', 'rate', 'economic', 'weekly', 'prelim', 'core', 'release'].includes(w))

  const directlyRelatedArticles = articles.filter((art) => {
    const artTitle = art.title.toLowerCase()
    return titleWords.some((kw) => artTitle.includes(kw))
  }).slice(0, 5)

  // Fallback to broader macro/crypto market articles from real RSS feed
  const macroArticles = (directlyRelatedArticles.length > 0
    ? directlyRelatedArticles
    : articles.filter((art) => art.category === 'macro' || art.title.toLowerCase().includes('fed') || art.title.toLowerCase().includes('inflation') || art.title.toLowerCase().includes('rate'))
  ).slice(0, 4)

  const dossier = getEventDossier(event)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div
        className="relative w-full max-w-3xl bg-[#0d111c] border border-white/[0.12] shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[92vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header Bar ── */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <span className="text-xl flex-shrink-0">🏛️</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-medium text-cyan-400 uppercase tracking-wider block truncate">
                  {dossier.agency}
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                  OFFICIAL GOVERNMENT RELEASE
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                {event.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/[0.1] transition-all font-mono text-sm"
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Visual Hero Banner */}
          {event.image_url && (
            <div className="w-full h-36 sm:h-44 relative overflow-hidden bg-black/60 border border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d111c] via-[#0d111c]/50 to-transparent flex flex-col justify-end p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {event.impact} IMPACT EVENT
                  </span>
                  <span className="text-text-muted text-[10px]">·</span>
                  <span className="text-[10px] font-mono text-cyan-300">
                    {formatFullDate(event.date_time)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Metric Comparison Grid (Forecast vs Previous vs Actual) ── */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 bg-white/[0.03] border border-white/[0.08] space-y-0.5">
              <span className="text-[9px] font-mono font-medium text-text-muted uppercase block">
                Forecast (F)
              </span>
              <span className="text-sm sm:text-base font-bold text-white font-mono block">
                {event.forecast || 'N/A'}
              </span>
              <span className="text-[9px] font-mono text-text-muted block truncate">Market Consensus</span>
            </div>

            <div className="p-3 bg-white/[0.03] border border-white/[0.08] space-y-0.5">
              <span className="text-[9px] font-mono font-medium text-text-muted uppercase block">
                Previous (P)
              </span>
              <span className="text-sm sm:text-base font-bold text-zinc-300 font-mono block">
                {event.previous || 'N/A'}
              </span>
              <span className="text-[9px] font-mono text-text-muted block truncate">Prior Release</span>
            </div>

            <div
              className={`p-3 border space-y-0.5 ${
                isPending
                  ? 'bg-white/[0.02] border-white/[0.06]'
                  : 'bg-emerald-500/[0.08] border-emerald-500/25'
              }`}
            >
              <span className="text-[9px] font-mono font-medium text-text-muted uppercase block">
                Actual Result
              </span>
              <span
                className={`text-sm sm:text-base font-bold font-mono block ${
                  isPending ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {event.actual || (isPending ? 'Pending...' : 'Delivered')}
              </span>
              <span className="text-[9px] font-mono text-text-muted block truncate">
                {isPending ? 'Awaiting Official Release' : 'Official Bureau Figure'}
              </span>
            </div>
          </div>

          {/* ── Tabbed Intelligence Dossier ── */}
          <div className="border border-white/[0.08] bg-white/[0.01] overflow-hidden">
            {/* Tabs Navigation */}
            <div className="flex border-b border-white/[0.08] bg-black/40">
              <button
                onClick={() => setActiveTab('narrative')}
                className={`flex-1 py-2.5 px-3 text-xs font-mono font-semibold transition-all border-b-2 ${
                  activeTab === 'narrative'
                    ? 'border-cyan-400 text-white bg-white/[0.04]'
                    : 'border-transparent text-text-muted hover:text-white'
                }`}
              >
                📋 Official Release Intelligence
              </button>
              <button
                onClick={() => setActiveTab('wires')}
                className={`flex-1 py-2.5 px-3 text-xs font-mono font-semibold transition-all border-b-2 ${
                  activeTab === 'wires'
                    ? 'border-cyan-400 text-white bg-white/[0.04]'
                    : 'border-transparent text-text-muted hover:text-white'
                }`}
              >
                📰 Live Wires & Official Coverage ({macroArticles.length})
              </button>
              <button
                onClick={() => setActiveTab('impact')}
                className={`flex-1 py-2.5 px-3 text-xs font-mono font-semibold transition-all border-b-2 ${
                  activeTab === 'impact'
                    ? 'border-cyan-400 text-white bg-white/[0.04]'
                    : 'border-transparent text-text-muted hover:text-white'
                }`}
              >
                ⚡ Market Transmission
              </button>
            </div>

            {/* Tab 1: Detailed Official Release Intelligence */}
            {activeTab === 'narrative' && (
              <div className="p-4 sm:p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                      Indicator Scope & Economic Definition
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      Cadence: {dossier.releaseFrequency}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                    {dossier.officialDescription}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted block">
                    Official Agency Methodology
                  </span>
                  <div className="text-xs text-text-secondary leading-relaxed space-y-2 whitespace-pre-line">
                    {dossier.methodologySummary}
                  </div>
                </div>

                {/* Official Source Link Card */}
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-text-muted block">
                      Issuing Agency Telemetry Portal
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {dossier.agency}
                    </span>
                  </div>
                  <a
                    href={dossier.agencyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[10px] font-mono font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1"
                  >
                    <span>Visit Agency</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            )}

            {/* Tab 2: Live Wires & Official Coverage (100% Real Live Articles) */}
            {activeTab === 'wires' && (
              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                    {directlyRelatedArticles.length > 0
                      ? `Directly Matched Market Wire Stories (${directlyRelatedArticles.length})`
                      : 'Live Macroeconomic & Digital Asset Wires'}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live RSS Feeds</span>
                  </span>
                </div>

                {/* Real Live News Wire Articles */}
                <div className="space-y-2">
                  {macroArticles.map((art, idx) => (
                    <a
                      key={idx}
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] transition-all group"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
                          <span className="font-bold text-cyan-300 uppercase">{art.source}</span>
                          <span>·</span>
                          <span className="text-zinc-400">
                            {new Date(art.published_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>·</span>
                          <span className="px-1 py-0.2 bg-white/[0.06] text-zinc-300 uppercase text-[9px]">
                            {art.category}
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-white group-hover:text-cyan-400 truncate transition-colors">
                          {art.title}
                        </h5>
                      </div>

                      <span className="text-xs text-text-muted group-hover:text-white transition-colors flex-shrink-0 font-mono">
                        Read ↗
                      </span>
                    </a>
                  ))}
                </div>

                {/* Official Source Reference Link */}
                <div className="p-3 bg-cyan-500/[0.04] border border-cyan-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                      Direct Official Source Feed
                    </span>
                    <a
                      href={dossier.agencyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-cyan-400 hover:underline"
                    >
                      Open {dossier.agency.split('·')[0].trim()} ↗
                    </a>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Official statistical data is ingested directly from U.S. government releases and calendar feeds. Verifiable release bulletins and schedules are maintained directly on official dot-gov agency websites.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Transmission Mechanisms & Multi-Asset Flow */}
            {activeTab === 'impact' && (
              <div className="p-4 sm:p-5 space-y-3.5">
                {/* 2-Column Asset Impact Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* BTC / Crypto Impact */}
                  <div className="p-3 bg-cyan-500/[0.05] border border-cyan-500/20 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <span>₿</span>
                      <span>Bitcoin & Crypto (BTC/USDT)</span>
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {dossier.cryptoImpact}
                    </p>
                  </div>

                  {/* Gold / Commodities Impact */}
                  <div className="p-3 bg-amber-500/[0.05] border border-amber-500/20 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <span>🥇</span>
                      <span>Gold & Commodities (XAU/USD)</span>
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {event.impact === 'HIGH'
                        ? 'High Sensitivity: Moves inversely to real yields and sovereign dollar strength. Easing signals fuel strong institutional safe-haven demand.'
                        : 'Moderate Sensitivity: Responds to inflation expectations and long-duration Treasury term premiums.'}
                    </p>
                  </div>
                </div>

                {/* Macro Market Implication */}
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <span>💵</span>
                    <span>Global Currency & Sovereign Debt (DXY & 10Y Yield)</span>
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {dossier.marketImplication}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted block">
                    Institutional Transmission Channels
                  </span>
                  <div className="space-y-1.5">
                    {dossier.transmissionMechanism.map((mech, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-text-secondary bg-white/[0.02] p-2.5 border border-white/[0.04]"
                      >
                        <span className="text-cyan-400 font-mono font-bold text-xs mt-0.5">▸</span>
                        <span>{mech}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Factor 9 Confluence Impact Analysis ── */}
          <div className="p-3.5 sm:p-4 bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>ACTS Factor 9: Confluence Strategy Impact</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300">Max +10.0 pts</span>
            </div>

            <div className="text-xs text-text-secondary space-y-1 leading-relaxed">
              <p>
                • <strong className="text-zinc-200">Dovish / Stimulative Policy:</strong> Evaluates as risk-on liquidity expansion, awarding up to <strong className="text-emerald-400">+10.0 pts</strong> for bullish BTC/USDT momentum.
              </p>
              <p>
                • <strong className="text-zinc-200">Hawkish / Restrictive Policy:</strong> Awards <strong className="text-amber-400">0.0 pts</strong> and activates capital defense protocols to shield against volatility sweeps.
              </p>
            </div>
          </div>
        </div>

        {/* ── Bottom Action Bar ── */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] font-mono text-text-muted">
            Press <kbd className="px-1.5 py-0.5 bg-white/[0.08] text-white text-[10px]">Esc</kbd> to return
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.12] transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  )
}
