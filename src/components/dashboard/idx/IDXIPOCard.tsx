'use client'

import React, { useState } from 'react'
import { IDXIPOItem, IPOStage, formatIPOStageLabel } from '@/lib/idxCorporateActions'

interface Props {
  ipos: IDXIPOItem[]
}

type StageFilter = 'ACTIVE' | 'CANCELED' | 'CLOSED' | 'ALL'

export function IDXIPOCard({ ipos }: Props) {
  const [filter, setFilter] = useState<StageFilter>('ACTIVE')

  const activeIPOs = ipos.filter(
    (i) => i.stage !== 'CANCELED' && i.stage !== 'CLOSED'
  )
  const canceledIPOs = ipos.filter((i) => i.stage === 'CANCELED')
  const closedIPOs = ipos.filter((i) => i.stage === 'CLOSED')

  const displayedIPOs = ipos.filter((ipo) => {
    if (filter === 'ACTIVE') return ipo.stage !== 'CANCELED' && ipo.stage !== 'CLOSED'
    if (filter === 'CANCELED') return ipo.stage === 'CANCELED'
    if (filter === 'CLOSED') return ipo.stage === 'CLOSED'
    return true
  })

  return (
    <div className="rounded-xl bg-[#fdfaf3] border border-slate-900/10 p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              e-IPO Pipeline & Status Tracker
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-900/10">
              BEI / e-IPO
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Monitoring penawaran umum perdana saham Indonesia, penundaan OJK, dan pembatalan emiten.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              filter === 'ACTIVE'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            <span>Aktif ({activeIPOs.length})</span>
            {activeIPOs.length === 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setFilter('CANCELED')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              filter === 'CANCELED'
                ? 'bg-rose-50 text-rose-800 border border-rose-300 font-bold'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            <span>Batal / Suspended ({canceledIPOs.length})</span>
          </button>

          <button
            onClick={() => setFilter('CLOSED')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
              filter === 'CLOSED'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            Selesai / Listing ({closedIPOs.length})
          </button>

          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
              filter === 'ALL'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            Semua ({ipos.length})
          </button>
        </div>
      </div>

      {filter === 'ACTIVE' && activeIPOs.length === 0 ? (
        <div className="rounded-xl bg-[#faf2df] border border-slate-900/10 p-8 sm:p-10 text-center space-y-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Tidak Ada Penawaran IPO yang Sedang Aktif
            </h4>
            <p className="text-xs text-slate-600 max-w-lg mx-auto font-mono leading-relaxed">
              Saat ini di Bursa Efek Indonesia / Stockbit belum ada emiten dalam masa <span className="text-slate-900 font-semibold">Book Building</span> ataupun <span className="text-slate-900 font-semibold">Offering</span>. Penawaran terbaru seperti <span className="text-rose-700 font-bold">SWAP</span> resmi dibatalkan/ditarik kembali sebelum pencatatan.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setFilter('CANCELED')}
              className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline cursor-pointer"
            >
              Lihat Detail Pembatalan SWAP →
            </button>
            <button
              onClick={() => setFilter('CLOSED')}
              className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline cursor-pointer"
            >
              Lihat Riwayat IPO Terdahulu →
            </button>
          </div>
        </div>
      ) : (
        // ── Cards Grid ──
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedIPOs.map((ipo) => {
            const isCanceled = ipo.stage === 'CANCELED'
            const stageMeta = formatIPOStageLabel(ipo.stage)

            return (
              <div
                key={ipo.code}
                className={`rounded-xl border p-4 space-y-3.5 flex flex-col justify-between transition-all ${
                  isCanceled
                    ? 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                    : 'bg-[#faf2df] border-slate-900/10 hover:border-slate-900/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black font-mono px-2.5 py-0.5 rounded-lg border ${
                        isCanceled
                          ? 'bg-rose-100 text-rose-800 border-rose-200 line-through'
                          : 'bg-[#fdfaf3] text-slate-900 border-slate-900/10'
                      }`}>
                        {ipo.code}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 truncate max-w-[120px]">
                        {ipo.sector}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono border ${stageMeta.color}`}
                    >
                      {stageMeta.label}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {ipo.name}
                  </h4>

                  {isCanceled && ipo.cancellationNote && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-rose-800 font-mono flex items-center gap-1">
                        <span>Status Batal di Stockbit &amp; e-IPO</span>
                      </div>
                      <p className="text-[11px] text-rose-900 leading-relaxed font-mono">
                        {ipo.cancellationNote}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/10 text-xs font-mono tabular-nums">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-sans">Rentang Harga</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {ipo.finalPrice ? `Rp ${ipo.finalPrice.toLocaleString('id-ID')}` : ipo.priceRange}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-sans">Target Emisi</span>
                      <span className={`font-bold tabular-nums ${isCanceled ? 'text-slate-500 line-through' : 'text-emerald-700'}`}>
                        Rp {ipo.targetProceedsBillion.toLocaleString('id-ID')} M
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block font-sans">Saham Ditawarkan</span>
                      <span className="text-slate-800">
                        {ipo.sharesOfferedMillion.toLocaleString('id-ID')}M lembar
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-sans">Jadwal Listing</span>
                      <span className={`font-bold ${isCanceled ? 'text-rose-700' : 'text-sky-800'}`}>
                        {ipo.listingDate}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex items-start justify-between text-slate-500 gap-2">
                      <span className="text-slate-500 shrink-0 text-[10px] font-sans">Penjamin Emisi:</span>
                      <span className="text-right truncate max-w-[190px] text-slate-800 font-medium">
                        {ipo.underwriter}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900/10">
                  <a
                    href={ipo.prospectusUrl || 'https://www.e-IPO.co.id'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline font-mono"
                  >
                    Keterbukaan e-IPO Resmi ↗
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
