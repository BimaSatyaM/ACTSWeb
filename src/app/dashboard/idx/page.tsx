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
    <div className="space-y-8">
      <IDXCompositeBanner data={ihsgData || undefined} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#faf2df] border border-slate-900/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900/10">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Core Universe Watchlist
              </h2>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">
                · LIVE 3S
              </span>
            </div>
            <Link
              href="/dashboard/idx/watchlist"
              className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline transition-colors flex items-center gap-1"
            >
              <span>Full Watchlist</span>
              <span className="font-mono">→</span>
            </Link>
          </div>

          <div className="divide-y divide-slate-900/10">
            {displayStocks.map((s) => {
              const isPos = s.changePoints >= 0
              return (
                <div key={s.symbol} className="py-2.5 flex items-center justify-between hover:bg-[#f3ead2]/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <IDXStockLogo
                      symbol={s.symbol}
                      name={s.name}
                      logoUrl={s.logoUrl}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm font-mono">{s.symbol}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          · {s.group || s.sector}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 line-clamp-1">{s.name}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums">
                    <span className="font-bold text-slate-900 text-sm block">
                      Rp {s.currentPrice.toLocaleString()}
                    </span>
                    <div className="flex items-center justify-end gap-2 mt-0.5 text-[11px]">
                      <span className={`font-bold ${isPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isPos ? '+' : ''}{s.changePercent.toFixed(2)}%
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className={`text-[10px] font-bold ${
                        s.foreignFlow === 'BUY'
                          ? 'text-emerald-700'
                          : s.foreignFlow === 'SELL'
                          ? 'text-rose-700'
                          : 'text-slate-500'
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

        <div className="p-5 sm:p-6 rounded-2xl bg-[#faf2df] border border-slate-900/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900/10">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Live Order Book (DOM)
              </h2>
              <span className="text-[10px] font-mono text-[#0369a1] font-bold">
                · BBCA DEPTH
              </span>
            </div>
            <Link
              href="/dashboard/idx/orderbook"
              className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline transition-colors flex items-center gap-1"
            >
              <span>10-Level DOM</span>
              <span className="font-mono">→</span>
            </Link>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 border-b border-slate-900/10 pb-1.5">
              <div className="flex justify-between">
                <span>Bid Lots</span>
                <span>Bid Price</span>
              </div>
              <div className="flex justify-between">
                <span>Offer Price</span>
                <span>Offer Lots</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono tabular-nums">
              <div className="divide-y divide-slate-900/10">
                {domBids.map((b) => (
                  <div key={b.price} className="relative flex justify-between items-center py-2 px-2 overflow-hidden">
                    <div
                      className="absolute inset-y-0.5 right-0 bg-emerald-600/15 rounded-xs transition-all duration-300 pointer-events-none"
                      style={{ width: b.width }}
                    />
                    <span className="relative z-10 text-slate-600">{b.lots.toLocaleString()}</span>
                    <span className="relative z-10 font-bold text-emerald-700">Rp {b.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="divide-y divide-slate-900/10">
                {domAsks.map((a) => (
                  <div key={a.price} className="relative flex justify-between items-center py-2 px-2 overflow-hidden">
                    <div
                      className="absolute inset-y-0.5 left-0 bg-rose-600/15 rounded-xs transition-all duration-300 pointer-events-none"
                      style={{ width: a.width }}
                    />
                    <span className="relative z-10 font-bold text-rose-700">Rp {a.price.toLocaleString()}</span>
                    <span className="relative z-10 text-slate-600">{a.lots.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-900/10 text-xs font-mono tabular-nums">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <span className="font-bold">ARA (+20%):</span>
                <span>Rp {araPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-700">
                <span className="font-bold">ARB (-20%):</span>
                <span>Rp {arbPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2 border-t border-slate-900/10">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Corporate Actions &amp; e-IPO
            </h2>
            <Link
              href="/dashboard/idx/corporate-actions"
              className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline transition-colors flex items-center gap-1"
            >
              <span>All Actions</span>
              <span className="font-mono">→</span>
            </Link>
          </div>

          <div className="divide-y divide-slate-900/10">
            {CORPORATE_ACTIONS_PREVIEW.map((c) => (
              <div key={c.ticker} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono">{c.ticker}</span>
                    <span className="text-[11px] font-mono font-semibold text-amber-800">
                      · {c.type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 block mt-0.5">{c.value}</span>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-[10px] text-slate-500 block">Cum Date: {c.cumDate}</span>
                  <span className="text-xs font-bold text-emerald-700">{c.yieldPct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              BEI Intelligence &amp; Rumor Radar
            </h2>
            <Link
              href="/dashboard/idx/news"
              className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline transition-colors flex items-center gap-1"
            >
              <span>Disclosures Feed</span>
              <span className="font-mono">→</span>
            </Link>
          </div>

          <div className="divide-y divide-slate-900/10">
            {DISCLOSURES_PREVIEW.map((d, i) => (
              <div key={i} className="py-3 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0369a1]">{d.ticker}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-600 font-sans">{d.source}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-500 tabular-nums">{d.time}</span>
                  </div>
                  <span className={`font-bold text-[10px] ${
                    d.impact === 'BULLISH' ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {d.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-snug line-clamp-2">
                  {d.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
