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
        'The Federal Open Market Committee establishes the target range for the federal funds rate, the benchmark rate at which commercial banks lend reserve balances overnight. The decision is followed immediately by the Fed Chair’s live press conference.',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-3xl bg-[#fdfaf3] border border-slate-900/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-900/10">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-medium text-[#0369a1] uppercase tracking-wider block truncate">
                  {dossier.agency}
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[#faf2df] text-slate-800 border border-slate-900/10 flex-shrink-0 rounded font-semibold">
                  OFFICIAL GOVERNMENT RELEASE
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                {event.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-[#f3ead2] rounded-lg transition-all font-mono text-sm cursor-pointer"
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {event.image_url && (
            <div className="w-full h-36 sm:h-44 relative overflow-hidden bg-[#faf2df] border border-slate-900/10 rounded-xl">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#fdfaf3] via-[#fdfaf3]/60 to-transparent flex flex-col justify-end p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-slate-900/10 rounded ${
                      isHigh
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {event.impact} IMPACT EVENT
                  </span>
                  <span className="text-slate-500 text-[10px]">·</span>
                  <span className="text-[10px] font-mono text-slate-700 font-semibold tabular-nums">
                    {formatFullDate(event.date_time)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 divide-x divide-slate-900/10 rounded-xl bg-[#faf2df] border border-slate-900/10 p-3 sm:p-4">
            <div className="space-y-0.5 pr-2 sm:pr-4">
              <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider block">
                Forecast (F)
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums block">
                {event.forecast || 'N/A'}
              </span>
              <span className="text-[9px] font-mono text-slate-500 block truncate">Market Consensus</span>
            </div>

            <div className="space-y-0.5 px-2 sm:px-4">
              <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider block">
                Previous (P)
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-700 font-mono tabular-nums block">
                {event.previous || 'N/A'}
              </span>
              <span className="text-[9px] font-mono text-slate-500 block truncate">Prior Release</span>
            </div>

            <div className="space-y-0.5 pl-2 sm:pl-4">
              <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider block">
                Actual Result
              </span>
              <span
                className={`text-sm sm:text-base font-bold font-mono tabular-nums block ${
                  isPending ? 'text-amber-800 animate-pulse' : 'text-emerald-700'
                }`}
              >
                {event.actual || (isPending ? 'Pending...' : 'Delivered')}
              </span>
              <span className="text-[9px] font-mono text-slate-500 block truncate">
                {isPending ? 'Awaiting Official Release' : 'Official Bureau Figure'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-900/10 bg-[#faf2df] overflow-hidden">
            <div className="flex border-b border-slate-900/10">
              <button
                onClick={() => setActiveTab('narrative')}
                className={`flex-1 py-2.5 px-3 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'narrative'
                    ? 'border-[#0369a1] text-slate-900 bg-[#fdfaf3] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Official Release Intelligence
              </button>
              <button
                onClick={() => setActiveTab('wires')}
                className={`flex-1 py-2.5 px-3 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'wires'
                    ? 'border-[#0369a1] text-slate-900 bg-[#fdfaf3] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Live Wires & Coverage ({macroArticles.length})
              </button>
              <button
                onClick={() => setActiveTab('impact')}
                className={`flex-1 py-2.5 px-3 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'impact'
                    ? 'border-[#0369a1] text-slate-900 bg-[#fdfaf3] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Market Transmission
              </button>
            </div>

            {activeTab === 'narrative' && (
              <div className="p-4 sm:p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0369a1] block">
                      Indicator Scope & Economic Definition
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Cadence: {dossier.releaseFrequency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {dossier.officialDescription}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-900/10">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    Official Agency Methodology
                  </span>
                  <div className="text-xs text-slate-600 leading-relaxed space-y-2 whitespace-pre-line">
                    {dossier.methodologySummary}
                  </div>
                </div>

                <div className="p-3.5 bg-[#fdfaf3] border border-slate-900/10 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">
                      Issuing Agency Telemetry Portal
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {dossier.agency}
                    </span>
                  </div>
                  <a
                    href={dossier.agencyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[10px] font-mono font-semibold bg-[#faf2df] hover:bg-[#f3ead2] text-[#0369a1] border border-slate-900/15 rounded transition-colors flex items-center gap-1"
                  >
                    <span>Visit Agency</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'wires' && (
              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0369a1] block">
                    {directlyRelatedArticles.length > 0
                      ? `Directly Matched Market Wire Stories (${directlyRelatedArticles.length})`
                      : 'Live Macroeconomic & Digital Asset Wires'}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Live RSS Feeds</span>
                  </span>
                </div>

                <div className="divide-y divide-slate-900/10">
                  {macroArticles.map((art, idx) => (
                    <a
                      key={idx}
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[#f3ead2]/50 -mx-2 px-2 rounded-lg transition-colors group"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums text-slate-500">
                          <span className="font-bold text-slate-800 uppercase">{art.source}</span>
                          <span>·</span>
                          <span className="text-slate-500">
                            {new Date(art.published_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>·</span>
                          <span className="px-1 py-0.2 bg-slate-900/5 text-slate-700 uppercase text-[9px] rounded font-semibold">
                            {art.category}
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-slate-900 group-hover:text-[#0369a1] truncate transition-colors">
                          {art.title}
                        </h5>
                      </div>

                      <span className="text-xs text-slate-500 group-hover:text-slate-900 transition-colors flex-shrink-0 font-mono">
                        Read ↗
                      </span>
                    </a>
                  ))}
                </div>

                <div className="p-3.5 bg-[#fdfaf3] border border-slate-900/10 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900">
                      Direct Official Source Feed
                    </span>
                    <a
                      href={dossier.agencyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-[#0369a1] hover:underline font-semibold"
                    >
                      Open {dossier.agency.split('·')[0].trim()} ↗
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Official statistical data is ingested directly from U.S. government releases and calendar feeds. Verifiable release bulletins and schedules are maintained directly on official dot-gov agency websites.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'impact' && (
              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#fdfaf3] border border-slate-900/10 border-l-2 border-l-[#0369a1] rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0369a1] block">
                      Bitcoin & Crypto (BTC/USDT)
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {dossier.cryptoImpact}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#fdfaf3] border border-slate-900/10 border-l-2 border-l-amber-600 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block">
                      Gold & Commodities (XAU/USD)
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {event.impact === 'HIGH'
                        ? 'High Sensitivity: Moves inversely to real yields and sovereign dollar strength. Easing signals fuel strong institutional safe-haven demand.'
                        : 'Moderate Sensitivity: Responds to inflation expectations and long-duration Treasury term premiums.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#fdfaf3] border border-slate-900/10 border-l-2 border-l-slate-400 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 block">
                    Global Currency & Sovereign Debt (DXY & 10Y Yield)
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dossier.marketImplication}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    Institutional Transmission Channels
                  </span>
                  <div className="space-y-1.5">
                    {dossier.transmissionMechanism.map((mech, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-600 bg-[#fdfaf3] p-2.5 border border-slate-900/10 rounded-lg"
                      >
                        <span className="text-[#0369a1] font-mono font-bold text-xs mt-0.5">▸</span>
                        <span>{mech}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 sm:p-4 bg-[#faf2df] border border-slate-900/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                <span>ACTS Factor 9: Confluence Strategy Impact</span>
              </span>
              <span className="text-[10px] font-mono text-[#0369a1] font-bold">Max +10.0 pts</span>
            </div>

            <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
              <p>
                • <strong className="text-slate-900">Dovish / Stimulative Policy:</strong> Evaluates as risk-on liquidity expansion, awarding up to <strong className="text-emerald-700">+10.0 pts</strong> for bullish BTC/USDT momentum.
              </p>
              <p>
                • <strong className="text-slate-900">Hawkish / Restrictive Policy:</strong> Awards <strong className="text-amber-800">0.0 pts</strong> and activates capital defense protocols to shield against volatility sweeps.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 border-t border-slate-900/10 bg-[#fdfaf3] flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-[#faf2df] border border-slate-900/10 text-slate-700 text-[10px] rounded font-mono">Esc</kbd> to return
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-[#0369a1] hover:bg-[#0284c7] text-white rounded-lg transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  )
}
