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
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>IDX Institutional Terminal</span>
                <span className="text-xs font-semibold text-slate-500">
                  Indonesia · BEI
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Real-time IDX market data, live 10-level DOM order books, corporate actions, and regulatory radar.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Direct Feed: Live</span>
            </span>
          </div>
        </div>

        <IDXMarketClock />
      </div>

      <div className="flex items-center gap-6 border-b border-slate-900/10 overflow-x-auto custom-scrollbar">
        {IDX_TABS.map((tab) => {
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors duration-150 ${
                isActive
                  ? 'border-[#0369a1] text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
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
