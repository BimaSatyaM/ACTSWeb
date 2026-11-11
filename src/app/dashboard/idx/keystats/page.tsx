'use client'

import React, { useState, useEffect, useTransition, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { IDXKeyStats, IDXPeerItem } from '@/lib/idxKeystats'
import { IDXKeyStatsCard } from '@/components/dashboard/idx/IDXKeyStatsCard'
import { IDXPeerComparison } from '@/components/dashboard/idx/IDXPeerComparison'

const POPULAR_TICKERS = [
  { symbol: 'BBCA', label: 'BCA (Mega Cap)' },
  { symbol: 'BBRI', label: 'BRI (Banking)' },
  { symbol: 'BMRI', label: 'Mandiri' },
  { symbol: 'BREN', label: 'Barito Renewables' },
  { symbol: 'BUMI', label: 'Bumi Resources' },
  { symbol: 'BNBR', label: 'Bakrie Group' },
  { symbol: 'ASII', label: 'Astra Int.' },
  { symbol: 'TLKM', label: 'Telkom' },
  { symbol: 'ADRO', label: 'Adaro Energy' },
  { symbol: 'ICBP', label: 'Indofood CBP' },
]

function IDXKeyStatsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSymbol = searchParams.get('symbol') || 'BBCA'

  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol.toUpperCase())
  const [searchInput, setSearchInput] = useState('')
  const [stats, setStats] = useState<IDXKeyStats | null>(null)
  const [peers, setPeers] = useState<IDXPeerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const fetchKeyStats = async (sym: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/idx/keystats?symbol=${sym}`)
      if (!res.ok) {
        throw new Error(`Failed to load key stats for ${sym}`)
      }
      const data = await res.json()
      if (data.success && data.stats) {
        setStats(data.stats)
        setPeers(data.peers || [])
      } else {
        throw new Error(data.error || 'No fundamental data found')
      }
    } catch (err: any) {
      console.error('Error fetching keystats:', err)
      setError(err.message || 'Error loading fundamentals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeyStats(currentSymbol)
  }, [currentSymbol])

  const handleSelectSymbol = (sym: string) => {
    const cleanSym = sym.toUpperCase().trim()
    setCurrentSymbol(cleanSym)
    setSearchInput('')
    startTransition(() => {
      router.push(`/dashboard/idx/keystats?symbol=${cleanSym}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      handleSelectSymbol(searchInput)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Search & Conglomerate Quick-Pills ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#0d121f] border border-white/[0.08]">
        {/* Symbol Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search ticker (e.g. BBRI, BREN, BNBR)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 pl-9 rounded-lg bg-[#070b14] border border-white/[0.08] text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ff2e54]/50 transition-colors"
            />
            <svg
              className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#ff2e54] hover:bg-[#e02647] text-white text-xs font-bold font-mono transition-all shadow-sm cursor-pointer"
          >
            Inspect
          </button>
        </form>

        {/* Quick Conglomerate Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
            Quick:
          </span>
          {POPULAR_TICKERS.map((item) => {
            const isSelected = item.symbol === currentSymbol
            return (
              <button
                key={item.symbol}
                onClick={() => handleSelectSymbol(item.symbol)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#ff2e54] text-white border border-[#ff2e54]'
                    : 'bg-[#070b14] text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.06]'
                }`}
              >
                {item.symbol}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-12 text-center space-y-4">
          <div className="inline-block w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-text-secondary">
            Fetching institutional fundamentals for <span className="text-white font-bold">{currentSymbol}</span>...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-8 text-center space-y-3">
          <div className="text-rose-400 text-sm font-bold">Unable to load valuation profile</div>
          <p className="text-xs font-mono text-text-muted">{error}</p>
          <button
            onClick={() => fetchKeyStats(currentSymbol)}
            className="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-bold text-white transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <IDXKeyStatsCard stats={stats} />
          <IDXPeerComparison
            currentSymbol={currentSymbol}
            sectorName={stats.sector}
            peers={peers}
            onSelectPeer={handleSelectSymbol}
          />
        </div>
      ) : null}
    </div>
  )
}

export default function IDXKeyStatsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-12 text-center space-y-4">
          <div className="inline-block w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-text-secondary">Loading IDX Key Stats Terminal...</p>
        </div>
      }
    >
      <IDXKeyStatsPageContent />
    </Suspense>
  )
}
