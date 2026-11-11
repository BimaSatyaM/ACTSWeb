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
    <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white font-mono">
              e-IPO Pipeline & Status Tracker
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
              BEI / e-IPO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Monitoring penawaran umum perdana saham Indonesia, penundaan OJK, dan pembatalan emiten.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              filter === 'ACTIVE'
                ? 'bg-[#ff2e54] text-white'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <span>Aktif ({activeIPOs.length})</span>
            {activeIPOs.length === 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setFilter('CANCELED')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              filter === 'CANCELED'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <span>Batal / Suspended ({canceledIPOs.length})</span>
          </button>

          <button
            onClick={() => setFilter('CLOSED')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
              filter === 'CLOSED'
                ? 'bg-[#ff2e54] text-white'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            Selesai / Listing ({closedIPOs.length})
          </button>

          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
              filter === 'ALL'
                ? 'bg-[#ff2e54] text-white'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            Semua ({ipos.length})
          </button>
        </div>
      </div>

      {filter === 'ACTIVE' && activeIPOs.length === 0 ? (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-8 sm:p-10 text-center space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-xl text-amber-400">
            ⏳
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">
              Tidak Ada Penawaran IPO yang Sedang Aktif
            </h4>
            <p className="text-xs text-text-secondary max-w-lg mx-auto font-mono leading-relaxed">
              Saat ini di Bursa Efek Indonesia / Stockbit belum ada emiten dalam masa <span className="text-white font-semibold">Book Building</span> ataupun <span className="text-white font-semibold">Offering</span>. Penawaran terbaru seperti <span className="text-rose-400 font-bold">SWAP</span> resmi dibatalkan/ditarik kembali sebelum pencatatan.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setFilter('CANCELED')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
            >
              Lihat Detail Pembatalan SWAP →
            </button>
            <button
              onClick={() => setFilter('CLOSED')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono bg-white/[0.04] hover:bg-white/[0.08] text-text-secondary hover:text-white border border-white/[0.08] transition-colors"
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
                    ? 'bg-rose-500/[0.03] border-rose-500/20 hover:border-rose-500/40'
                    : 'bg-[#070b14] border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black font-mono px-2.5 py-0.5 rounded-lg border ${
                        isCanceled
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 line-through'
                          : 'bg-white/[0.06] text-white border-white/[0.08]'
                      }`}>
                        {ipo.code}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 truncate max-w-[120px]">
                        {ipo.sector}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono border ${stageMeta.color}`}
                    >
                      {stageMeta.label}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug">
                    {ipo.name}
                  </h4>

                  {isCanceled && ipo.cancellationNote && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-rose-400 font-mono flex items-center gap-1">
                        <span>⚠️ Status Batal di Stockbit &amp; e-IPO</span>
                      </div>
                      <p className="text-[11px] text-rose-200/90 leading-relaxed font-mono">
                        {ipo.cancellationNote}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#0d121f] border border-white/[0.06] text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Rentang Harga</span>
                      <span className="font-bold text-white">
                        {ipo.finalPrice ? `Rp ${ipo.finalPrice.toLocaleString('id-ID')}` : ipo.priceRange}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Target Emisi</span>
                      <span className={`font-bold ${isCanceled ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                        Rp {ipo.targetProceedsBillion.toLocaleString('id-ID')} M
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Saham Ditawarkan</span>
                      <span className="text-white">
                        {ipo.sharesOfferedMillion.toLocaleString('id-ID')}M lembar
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Jadwal Listing</span>
                      <span className={`font-bold ${isCanceled ? 'text-rose-400' : 'text-cyan-400'}`}>
                        {ipo.listingDate}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex items-start justify-between text-slate-400 gap-2">
                      <span className="text-slate-500 shrink-0 text-[10px]">Penjamin Emisi:</span>
                      <span className="text-right truncate max-w-[190px] text-white">
                        {ipo.underwriter}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06]">
                  <a
                    href={ipo.prospectusUrl || 'https://www.e-IPO.co.id'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-1.5 rounded-lg text-center text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 transition-colors font-mono"
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
