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
        return 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
      case 'BULLISH':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      case 'BEARISH':
        return 'bg-rose-50 text-rose-800 border-rose-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getTypeBadge = (type: IDXDisclosureItem['type']) => {
    switch (type) {
      case 'UMA':
        return 'bg-amber-50 text-amber-900 border-amber-300'
      case 'SUSPENSI':
        return 'bg-rose-50 text-rose-800 border-rose-200'
      case 'UNFREEZE':
        return 'bg-sky-50 text-sky-800 border-sky-200'
      case 'BUYBACK':
      case 'AKUISISI':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      default:
        return 'bg-purple-50 text-purple-800 border-purple-200'
    }
  }

  return (
    <div className="rounded-xl bg-[#fdfaf3] border border-slate-900/10 p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Official BEI Regulatory Disclosures
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              idx.co.id Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Official announcements from Bursa Efek Indonesia: UMA warnings, Trading Suspensions, and M&amp;A Filings.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'UMA', 'AKUISISI', 'BUYBACK', 'UNFREEZE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                filterType === t
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-900/10">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="py-4 space-y-2.5 group first:pt-0 last:pb-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-900/10">
                  {item.ticker}
                </span>
                <span className="text-slate-500 text-[11px] truncate max-w-xs font-sans">
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
                <span className="text-slate-500 text-[11px] tabular-nums">
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

            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-800 transition-colors leading-snug">
              {item.title}
            </h4>

            <p className="text-xs font-mono text-slate-600 leading-relaxed">
              {item.details}
            </p>

            <div className="pt-2 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">Divisi Penilaian &amp; Pengawasan Perusahaan BEI</span>
              <a
                href={item.filingUrl || 'https://www.idx.co.id'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline flex items-center gap-1"
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
