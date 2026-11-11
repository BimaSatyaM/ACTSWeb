export interface IDXKeyStats {
  symbol: string
  name: string
  price: number
  sector: string
  industry: string
  group?: string
  logoUrl?: string

  // Valuation Multiples
  marketCap: number // IDR
  marketCapTrillion: number // Trillion IDR
  marketCapTier: 'Mega Cap (>100T)' | 'Large Cap (10T-100T)' | 'Mid Cap (1T-10T)' | 'Small Cap (<1T)'
  peRatio: number | null // P/E TTM
  pbvRatio: number | null // P/BV FQ
  psRatio: number | null // Price to Sales TTM
  evEbitda: number | null // EV/EBITDA TTM

  // Profitability & Margins
  roe: number | null // ROE %
  roa: number | null // ROA %
  netMargin: number | null // Net Margin %
  operatingMargin: number | null // Operating Margin %

  // Balance Sheet & Solvency
  der: number | null // Debt-to-Equity ratio
  totalDebt: number | null // IDR
  totalDebtTrillion: number | null // Trillion IDR
  currentRatio: number | null

  // Shareholder & Earnings Power
  eps: number | null // IDR
  dividendYield: number | null // %
  totalShares: number | null
  revenueTTM: number | null // IDR
  revenueTTMTrillion: number | null // Trillion IDR
  netIncomeTTM: number | null // IDR
  netIncomeTTMTrillion: number | null // Trillion IDR

  // 52-Week Range
  week52High: number
  week52Low: number
  rangePositionPct: number // 0-100% position from Low to High
  distFrom52wHighPct: number // e.g. -14.2%
  distFrom52wLowPct: number // e.g. +35.1%

  // Institutional Intelligence Badges
  badges: Array<{
    label: string
    variant: 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple'
    description: string
  }>
}

export interface IDXPeerItem {
  symbol: string
  name: string
  price: number
  sector: string
  marketCapTrillion: number
  logoUrl?: string
  peRatio: number | null
  pbvRatio: number | null
  roe: number | null
  dividendYield: number | null
  der: number | null
  week52High: number
  week52Low: number
}

export function formatIDR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—'
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(val))}`
}

export function formatTrillion(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—'
  return `${(val).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} T`
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—'
  const sign = val > 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}%`
}

export function formatRatio(val: number | null | undefined, suffix: string = 'x'): string {
  if (val === null || val === undefined || isNaN(val)) return '—'
  return `${val.toFixed(2)}${suffix}`
}
