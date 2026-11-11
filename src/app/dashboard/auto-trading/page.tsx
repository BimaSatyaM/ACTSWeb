'use client'

import React from 'react'
import Link from 'next/link'
import { BinanceLogo } from '@/components/ui/BinanceLogo'
import { ModernAutoTradingTerminal } from '@/components/dashboard/autotrading/ModernAutoTradingTerminal'

export default function AutoTradingPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono mb-1">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">Auto Trading</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <BinanceLogo size="lg" />
            <span>Binance Futures Auto-Pilot</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/signals"
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <span>Live Signals &amp; Telemetry</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      <ModernAutoTradingTerminal />
    </div>
  )
}
