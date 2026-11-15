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
        color: 'text-sky-800 bg-sky-50 border-sky-200',
        step: 1,
      }
    case 'OFFERING':
      return {
        label: 'Offering (Penawaran Umum)',
        color: 'text-amber-800 bg-amber-50 border-amber-200',
        step: 2,
      }
    case 'ALLOTMENT':
      return {
        label: 'Allotment (Penjatahan & Distribusi)',
        color: 'text-[#0369a1] bg-sky-50 border-sky-200',
        step: 3,
      }
    case 'LISTING':
      return {
        label: 'Listing (Pencatatan Perdana BEI)',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
        step: 4,
      }
    case 'CANCELED':
      return {
        label: 'Batal / Canceled',
        color: 'text-rose-800 bg-rose-50 border-rose-200',
        step: 0,
      }
    case 'CLOSED':
      return {
        label: 'Selesai / Closed',
        color: 'text-slate-600 bg-slate-100 border-slate-300',
        step: 4,
      }
  }
}
