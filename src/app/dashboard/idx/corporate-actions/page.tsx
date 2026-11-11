'use client'

import React, { useState, useEffect, Suspense } from 'react'
import {
  IDXDividendItem,
  IDXRUPSItem,
  IDXIPOItem,
} from '@/lib/idxCorporateActions'
import { IDXCorporateActionsCard } from '@/components/dashboard/idx/IDXCorporateActionsCard'
import { IDXIPOCard } from '@/components/dashboard/idx/IDXIPOCard'

type ViewFilter = 'ALL' | 'DIVIDENDS' | 'IPO' | 'RUPS'

function IDXCorporateActionsPageContent() {
  const [view, setView] = useState<ViewFilter>('ALL')
  const [dividends, setDividends] = useState<IDXDividendItem[]>([])
  const [rupsEvents, setRupsEvents] = useState<IDXRUPSItem[]>([])
  const [ipoPipeline, setIpoPipeline] = useState<IDXIPOItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/idx/corporate-actions')
      if (!res.ok) throw new Error('Failed to load corporate actions and IPO data')
      const data = await res.json()
      if (data.success) {
        setDividends(data.dividends || [])
        setRupsEvents(data.rupsEvents || [])
        setIpoPipeline(data.ipoPipeline || [])
      } else {
        throw new Error(data.error || 'Unknown error occurred')
      }
    } catch (err: any) {
      console.error('Error in corporate actions page:', err)
      setError(err.message || 'Error loading corporate calendar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // KPI calculations
  const activeIPOs = ipoPipeline.filter(
    (i) => i.stage !== 'CANCELED' && i.stage !== 'CLOSED'
  )
  const totalProceeds = activeIPOs.reduce((acc, ipo) => acc + (ipo.targetProceedsBillion || 0), 0)
  const maxYield = dividends.reduce((max, d) => Math.max(max, d.dividendYield), 0)
  const upcomingDividendsCount = dividends.filter((d) => d.daysToExDate >= 0).length

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0d121f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              e-IPO in Pipeline
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${activeIPOs.length > 0 ? 'bg-cyan-400' : 'bg-amber-400'}`} />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {activeIPOs.length}{' '}
            <span className="text-xs font-normal text-slate-400">Aktif</span>
          </div>
          <p className="text-[11px] text-amber-400/90 font-mono">
            {activeIPOs.length === 0 ? 'SWAP: Batal (Kosong di Stockbit)' : 'Active Book Building'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0d121f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Total Target Proceeds
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            Rp {(totalProceeds / 1000).toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">Trillion</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Target emisi penawaran aktif</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0d121f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Upcoming Dividends
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {upcomingDividendsCount}{' '}
            <span className="text-xs font-normal text-slate-400">Payouts</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Cum-dates approaching</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0d121f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Peak Dividend Yield
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-400">
            {maxYield.toFixed(2)}%
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Top annualized yield on board</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0d121f] border border-white/[0.08]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setView('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'ALL'
                ? 'bg-[#ff2e54] text-white border border-[#ff2e54]'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            📋 All Events
          </button>

          <button
            onClick={() => setView('IPO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'IPO'
                ? 'bg-[#ff2e54] text-white border border-[#ff2e54]'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            🚀 e-IPO Pipeline ({activeIPOs.length} Aktif)
          </button>

          <button
            onClick={() => setView('DIVIDENDS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'DIVIDENDS'
                ? 'bg-[#ff2e54] text-white border border-[#ff2e54]'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            💰 Cash Dividends ({dividends.length})
          </button>

          <button
            onClick={() => setView('RUPS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              view === 'RUPS'
                ? 'bg-[#ff2e54] text-white border border-[#ff2e54]'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            🏛️ RUPS &amp; Disclosures ({rupsEvents.length})
          </button>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-[#070b14] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-slate-400 hover:text-white transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-12 text-center space-y-3">
          <div className="inline-block w-7 h-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-text-secondary">
            Syncing corporate actions calendar and e-IPO pipeline...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-6 text-center space-y-2">
          <p className="text-sm font-bold text-rose-400">Failed to sync corporate calendar</p>
          <p className="text-xs font-mono text-text-muted">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-1.5 rounded-lg bg-white/[0.08] text-xs font-bold text-white hover:bg-white/[0.12] transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {(view === 'ALL' || view === 'IPO') && (
            <IDXIPOCard ipos={ipoPipeline} />
          )}

          {(view === 'ALL' || view === 'DIVIDENDS' || view === 'RUPS') && (
            <IDXCorporateActionsCard
              dividends={dividends}
              rupsEvents={rupsEvents}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function IDXCorporateActionsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-12 text-center space-y-3">
          <div className="inline-block w-7 h-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-text-secondary">
            Loading Corporate Actions Terminal...
          </p>
        </div>
      }
    >
      <IDXCorporateActionsPageContent />
    </Suspense>
  )
}
