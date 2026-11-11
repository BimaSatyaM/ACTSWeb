export type SentimentBias = 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH'

export type ConglomerateId = 'BAKRIE' | 'BARITO' | 'SALIM' | 'ASTRA' | 'BIG_BANKS' | 'GENERAL'

export interface IDXNewsArticle {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string // ISO or formatted WIB
  publishedTimeAgo: string // e.g. "2 hours ago"
  tickers: string[]
  conglomerate?: ConglomerateId
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  sentimentScore: number // -1.0 to +1.0
  aiImpactSummary: string
  category: 'CONGLOMERATE' | 'MARKET_OVERVIEW' | 'REGULATORY' | 'EARNINGS'
}

export interface IDXDisclosureItem {
  id: string
  ticker: string
  companyName: string
  type: 'UMA' | 'SUSPENSI' | 'UNFREEZE' | 'BUYBACK' | 'AKUISISI' | 'DIVIDEN' | 'RESTRUCTURING'
  title: string
  date: string
  timeWIB: string
  impact: 'BULLISH' | 'BEARISH' | 'HIGH_ALERT' | 'NEUTRAL'
  details: string
  filingUrl?: string
}

export const CONGLOMERATE_METADATA: Record<
  ConglomerateId,
  { name: string; icon: string; tickers: string[]; description: string }
> = {
  BAKRIE: {
    name: 'Bakrie Group',
    icon: '🏢',
    tickers: ['BNBR', 'BUMI', 'BRMS', 'ENRG', 'DEWA', 'VIVA', 'MDIA'],
    description: 'Debt restructurings, BNBR buybacks, BUMI asset acquisitions & gold mining.',
  },
  BARITO: {
    name: 'Barito Group (Prajogo Pangestu)',
    icon: '🌿',
    tickers: ['BREN', 'BRPT', 'TPIA', 'CUAN', 'BPII', 'PTRO'],
    description: 'Geothermal energy expansion, petrochemicals, and renewable M&A catalysts.',
  },
  SALIM: {
    name: 'Salim Group',
    icon: '🌾',
    tickers: ['AMMN', 'ICBP', 'INDF', 'MEDC', 'SIMP', 'LSIP'],
    description: 'Copper & gold smelter operations, consumer goods, and energy joint ventures.',
  },
  ASTRA: {
    name: 'Astra Group',
    icon: '🚗',
    tickers: ['ASII', 'UNTR', 'AUTO', 'AALI'],
    description: 'Automotive market share, heavy equipment mining, and agribusiness.',
  },
  BIG_BANKS: {
    name: 'Big 4 Banks & BUMN',
    icon: '🏦',
    tickers: ['BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'PGAS', 'ANTM'],
    description: 'Institutional foreign net flows, quarterly credit growth, and dividend guidance.',
  },
  GENERAL: {
    name: 'Broad Market (IHSG)',
    icon: '🇮🇩',
    tickers: [],
    description: 'Macroeconomic updates, Bank Indonesia rate decisions, and regional sentiment.',
  },
}
