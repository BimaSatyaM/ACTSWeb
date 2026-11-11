'use client'

import React, { useState } from 'react'
import { IDXDisclosureItem } from '@/lib/idxNews'

interface Props {
  disclosures: IDXDisclosureItem[]
}

export function IDXDisclosuresCard({ disclosures }: Props) {
  const [filterType, setFilterType] = useState<string>('ALL')

  const filtered = disclosures.filter((d) => {
    if (filterType === 'ALL') return true
    return d.type === filterType
  })

  const getImpactBadge = (impact: IDXDisclosureItem['impact']) => {
    switch (impact) {
      case 'HIGH_ALERT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
      case 'BULLISH':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      case 'BEARISH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      default:
        return 'bg-white/[0.06] text-text-secondary border-white/[0.1]'
    }
  }

  const getTypeBadge = (type: IDXDisclosureItem['type']) => {
    switch (type) {
      case 'UMA':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      case 'SUSPENSI':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      case 'UNFREEZE':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
      case 'BUYBACK':
      case 'AKUISISI':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      default:
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    }
  }

  return (
    <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 sm:p-6 space-y-5">
      {/* ── Header & Filter Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white font-mono">
              Official BEI Regulatory Disclosures
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              idx.co.id Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Official announcements from Bursa Efek Indonesia: UMA warnings, Trading Suspensions, and M&amp;A Filings.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'UMA', 'AKUISISI', 'BUYBACK', 'UNFREEZE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                filterType === t
                  ? 'bg-[#ff2e54] text-white'
                  : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Disclosures List ── */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-[#070b14] border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-2.5 group"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-black text-white px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
                  {item.ticker}
                </span>
                <span className="text-slate-400 text-[11px] truncate max-w-xs">
                  {item.companyName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadge(
                    item.type
                  )}`}
                >
                  {item.type}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">
                  {item.date} • {item.timeWIB}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getImpactBadge(
                    item.impact
                  )}`}
                >
                  {item.impact}
                </span>
              </div>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
              {item.title}
            </h4>

            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              {item.details}
            </p>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">Divisi Penilaian &amp; Pengawasan Perusahaan BEI</span>
              <a
                href={item.filingUrl || 'https://www.idx.co.id'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
              >
                <span>Lihat Pengumuman Resmi BEI</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
