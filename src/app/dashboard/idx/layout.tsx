'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IDXMarketClock } from '@/components/dashboard/idx/IDXMarketClock'

interface TabItem {
  name: string
  href: string
}

const IDX_TABS: TabItem[] = [
  { name: 'Overview', href: '/dashboard/idx' },
  { name: 'Watchlist & Tickers', href: '/dashboard/idx/watchlist' },
  { name: 'Live Order Book', href: '/dashboard/idx/orderbook' },
  { name: 'Key Stats & Valuation', href: '/dashboard/idx/keystats' },
  { name: 'e-IPO & Actions', href: '/dashboard/idx/corporate-actions' },
  { name: 'News & Rumors', href: '/dashboard/idx/news' },
]

export default function IDXLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>IDX Institutional Terminal</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  Indonesia · BEI
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time IDX market data, live 10-level DOM order books, corporate actions, and regulatory radar.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Direct Feed: Live</span>
            </span>
          </div>
        </div>

        <IDXMarketClock />
      </div>

      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 overflow-x-auto custom-scrollbar">
        {IDX_TABS.map((tab) => {
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-white/[0.08] text-white border border-white/[0.14] shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              {tab.name}
            </Link>
          )
        })}
      </div>

      <div>{children}</div>
    </div>
  )
}
