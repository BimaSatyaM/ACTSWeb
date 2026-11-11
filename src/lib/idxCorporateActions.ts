export interface IDXDividendItem {
  symbol: string
  name: string
  sector: string
  currentPrice: number
  dividendPerShare: number // IDR
  dividendYield: number // %
  cumDate: string // YYYY-MM-DD
  exDate: string // YYYY-MM-DD
  paymentDate: string // YYYY-MM-DD
  daysToExDate: number
  status: 'UPCOMING' | 'CUM_PERIOD' | 'EX_PASSED' | 'PAID'
}

export interface IDXRUPSItem {
  symbol: string
  name: string
  sector: string
  eventType: 'RUPS Tahunan (AGM)' | 'RUPS Luar Biasa (EGM)' | 'Laporan Keuangan Q3' | 'Laporan Keuangan Audit'
  scheduledDate: string // YYYY-MM-DD
  daysRemaining: number
  agendaSnippet: string
}

export type IPOStage = 'BOOK_BUILDING' | 'OFFERING' | 'ALLOTMENT' | 'LISTING' | 'CANCELED' | 'CLOSED'

export interface IDXIPOItem {
  code: string
  name: string
  sector: string
  stage: IPOStage
  priceRange: string // e.g. "Rp 150 - Rp 200"
  finalPrice?: number // IDR
  targetProceedsBillion: number // Billion IDR
  sharesOfferedMillion: number // Million shares
  underwriter: string
  bookBuildingPeriod: string // e.g. "01 Sep - 08 Sep 2026"
  offeringPeriod: string // e.g. "15 Sep - 20 Sep 2026"
  listingDate: string // e.g. "24 Sep 2026"
  prospectusUrl?: string
  warrantBonus?: string // e.g. "1:1 Waran Seri I"
  cancellationNote?: string // e.g. "Dibatalkan / Suspended"
}

export function formatIPOStageLabel(stage: IPOStage): {
  label: string
  color: string
  step: number
} {
  switch (stage) {
    case 'BOOK_BUILDING':
      return {
        label: 'Book Building (Penawaran Awal)',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        step: 1,
      }
    case 'OFFERING':
      return {
        label: 'Offering (Penawaran Umum)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        step: 2,
      }
    case 'ALLOTMENT':
      return {
        label: 'Allotment (Penjatahan & Distribusi)',
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        step: 3,
      }
    case 'LISTING':
      return {
        label: 'Listing (Pencatatan Perdana BEI)',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        step: 4,
      }
    case 'CANCELED':
      return {
        label: 'Batal / Canceled',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        step: 0,
      }
    case 'CLOSED':
      return {
        label: 'Selesai / Closed',
        color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
        step: 4,
      }
  }
}
