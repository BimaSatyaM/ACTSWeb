'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { IDXCompositeBanner } from '@/components/dashboard/idx/IDXCompositeBanner'
import { IDXStockLogo } from '@/components/ui/IDXStockLogo'
import { StockMeta, IDX_UNIVERSE_LIST } from '@/lib/idxData'

const DISCLOSURES_PREVIEW = [
  {
    source: 'BEI Disclosure',
    time: '14:20 WIB',
    ticker: 'BNBR',
    title: 'Keterbukaan Informasi: Pelaksanaan Program Pembelian Kembali Saham (Share Buyback) Tahap I',
    tag: 'Corporate Action',
    impact: 'BULLISH',
  },
  {
    source: 'OJK Regulatory',
    time: '11:45 WIB',
    ticker: 'BREN',
    title: 'Penyampaian Rencana Akuisisi Pembangkit Listrik Tenaga Angin (PLTB) Sidrap Kapasitas 75 MW',
    tag: 'M&A',
    impact: 'BULLISH',
  },
  {
    source: 'Market Rumor',
    time: '09:30 WIB',
    ticker: 'BUMI',
    title: 'Konsorsium Bakrie & Salim Menyiapkan Refinancing Obligasi Konversi Senilai Rp 2,4 Triliun',
    tag: 'Debt Restructuring',
    impact: 'NEUTRAL',
  },
]

const CORPORATE_ACTIONS_PREVIEW = [
  { ticker: 'BBCA', type: 'Cash Dividend', value: 'Rp 50 / share', cumDate: '15 Sep 2026', yieldPct: '1.2%' },
  { ticker: 'ASII', type: 'Interim Dividend', value: 'Rp 98 / share', cumDate: '18 Sep 2026', yieldPct: '2.1%' },
  { ticker: 'TLKM', type: 'RUPS / AGM', value: 'Penetapan Dividen Final', cumDate: '24 Sep 2026', yieldPct: '--' },
]

export default function IDXOverviewPage() {
  const [stocks, setStocks] = useState<StockMeta[]>(IDX_UNIVERSE_LIST)
  const [ihsgData, setIhsgData] = useState<any>(null)

  useEffect(() => {
    let isMounted = true

    const fetchLiveWatchlist = async () => {
      try {
        const res = await fetch('/api/idx/watchlist')
        if (res.ok && isMounted) {
          const data = await res.json()
          if (data.success) {
            if (data.stocks) setStocks(data.stocks)
            if (data.ihsg) setIhsgData(data.ihsg)
          }
        }
      } catch (err) {
        // silent fail
      }
    }

    fetchLiveWatchlist()
    const interval = setInterval(fetchLiveWatchlist, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Dynamic DOM levels based on real BBCA price
  const bbca = stocks.find((s) => s.symbol === 'BBCA') || stocks[0]
  const bbcaPrice = bbca?.currentPrice || 6300
  const tick = bbcaPrice > 5000 ? 25 : bbcaPrice > 2000 ? 10 : 5

  const domBids = [
    { price: bbcaPrice, lots: 48210, width: '100%' },
    { price: bbcaPrice - tick, lots: 39150, width: '81%' },
    { price: bbcaPrice - (tick * 2), lots: 65420, width: '95%' },
    { price: bbcaPrice - (tick * 3), lots: 22400, width: '46%' },
  ]

  const domAsks = [
    { price: bbcaPrice + tick, lots: 28400, width: '58%' },
    { price: bbcaPrice + (tick * 2), lots: 54100, width: '89%' },
    { price: bbcaPrice + (tick * 3), lots: 31200, width: '64%' },
    { price: bbcaPrice + (tick * 4), lots: 42300, width: '75%' },
  ]

  const araPrice = Math.round(bbcaPrice * 1.2)
  const arbPrice = Math.round(bbcaPrice * 0.8)

  const CORE_SYMBOLS = ['BBCA', 'BBRI', 'BREN', 'BNBR', 'BUMI', 'GOTO', 'BMRI', 'TLKM']
  const displayStocks = CORE_SYMBOLS.map((sym) => stocks.find((s) => s.symbol === sym)).filter(Boolean) as StockMeta[]

  return (
    <div className="space-y-6">
      <IDXCompositeBanner data={ihsgData || undefined} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d121f] border border-white/[0.08] space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-theme animate-pulse" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Core Universe Watchlist
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  LIVE 3s
                </span>
              </div>
              <Link
                href="/dashboard/idx/watchlist"
                className="text-xs font-semibold text-accent-theme hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Full Watchlist</span>
                <span>→</span>
              </Link>
            </div>

            <div className="divide-y divide-white/[0.04] mt-2">
              {displayStocks.map((s) => {
                const isPos = s.changePoints >= 0
                return (
                  <div key={s.symbol} className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <IDXStockLogo
                        symbol={s.symbol}
                        name={s.name}
                        logoUrl={s.logoUrl}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm font-mono">{s.symbol}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.05] text-slate-400 border border-white/[0.06]">
                            {s.group || s.sector}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 line-clamp-1">{s.name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-white text-sm font-mono block">
                        Rp {s.currentPrice.toLocaleString()}
                      </span>
                      <div className="flex items-center justify-end gap-2 mt-0.5">
                        <span className={`text-[11px] font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPos ? '+' : ''}{s.changePercent.toFixed(2)}%
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          s.foreignFlow === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : s.foreignFlow === 'SELL'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-zinc-500/10 text-zinc-400'
                        }`}>
                          F.{s.foreignFlow}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <Link
              href="/dashboard/idx/watchlist"
              className="block w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] transition-colors"
            >
              Open Interactive Chart & Watchlist →
            </Link>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d121f] border border-white/[0.08] space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Order Book (DOM)
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  BBCA · Depth
                </span>
              </div>
              <Link
                href="/dashboard/idx/orderbook"
                className="text-xs font-semibold text-accent-theme hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Full DOM</span>
                <span>→</span>
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 px-1">
                <div className="flex justify-between">
                  <span>Bid Lots</span>
                  <span>Bid Price</span>
                </div>
                <div className="flex justify-between">
                  <span>Offer Price</span>
                  <span>Offer Lots</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="space-y-1.5">
                  {domBids.map((b) => (
                    <div key={b.price} className="relative flex justify-between items-center px-2.5 py-1.5 rounded-lg overflow-hidden bg-white/[0.02]">
                      <div
                        className="absolute inset-y-0 right-0 bg-emerald-500/15 transition-all duration-300 pointer-events-none"
                        style={{ width: b.width }}
                      />
                      <span className="relative z-10 text-slate-400 text-xs">{b.lots.toLocaleString()}</span>
                      <span className="relative z-10 font-bold text-emerald-400">Rp {b.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {domAsks.map((a) => (
                    <div key={a.price} className="relative flex justify-between items-center px-2.5 py-1.5 rounded-lg overflow-hidden bg-white/[0.02]">
                      <div
                        className="absolute inset-y-0 left-0 bg-rose-500/15 transition-all duration-300 pointer-events-none"
                        style={{ width: a.width }}
                      />
                      <span className="relative z-10 font-bold text-rose-400">Rp {a.price.toLocaleString()}</span>
                      <span className="relative z-10 text-slate-400 text-xs">{a.lots.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-[#121829]/60 border border-white/[0.06] text-xs font-mono mt-3">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="font-bold">ARA (+20%):</span>
                  <span>Rp {araPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="font-bold">ARB (-20%):</span>
                  <span>Rp {arbPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <Link
              href="/dashboard/idx/orderbook"
              className="block w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] transition-colors"
            >
              Inspect 10-Level Order Book & Tape →
            </Link>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d121f] border border-white/[0.08] space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Corporate Actions & e-IPO
                </h2>
              </div>
              <Link
                href="/dashboard/idx/corporate-actions"
                className="text-xs font-semibold text-accent-theme hover:text-white transition-colors flex items-center gap-1"
              >
                <span>All Actions</span>
                <span>→</span>
              </Link>
            </div>

            <div className="space-y-2.5 mt-3">
              {CORPORATE_ACTIONS_PREVIEW.map((c) => (
                <div key={c.ticker} className="p-3 rounded-xl bg-[#121829]/60 border border-white/[0.06] flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{c.ticker}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-400/10 text-amber-300 border border-amber-400/20">
                        {c.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block mt-1">{c.value}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-400 block">Cum Date: {c.cumDate}</span>
                    <span className="text-xs font-bold text-emerald-400">{c.yieldPct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <Link
              href="/dashboard/idx/corporate-actions"
              className="block w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] transition-colors"
            >
              Explore e-IPO Pipeline & Corporate Actions Calendar →
            </Link>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d121f] border border-white/[0.08] space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  BEI Intelligence & Rumor Radar
                </h2>
              </div>
              <Link
                href="/dashboard/idx/news"
                className="text-xs font-semibold text-accent-theme hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Live Feed</span>
                <span>→</span>
              </Link>
            </div>

            <div className="space-y-2.5 mt-3">
              {DISCLOSURES_PREVIEW.map((d, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#121829]/60 border border-white/[0.06] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">{d.ticker}</span>
                      <span className="text-slate-400">{d.source}</span>
                      <span className="text-slate-500 font-mono">{d.time}</span>
                    </div>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                      d.impact === 'BULLISH'
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-zinc-400 bg-zinc-500/10'
                    }`}>
                      {d.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                    {d.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <Link
              href="/dashboard/idx/news"
              className="block w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] transition-colors"
            >
              Open BEI Disclosures & Conglomerate Radar →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
