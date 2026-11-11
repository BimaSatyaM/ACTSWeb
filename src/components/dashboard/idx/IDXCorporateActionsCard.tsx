'use client'

import React, { useState, useMemo } from 'react'
import { IDXDividendItem, IDXRUPSItem } from '@/lib/idxCorporateActions'
import { formatIDR } from '@/lib/idxKeystats'

interface Props {
  dividends: IDXDividendItem[]
  rupsEvents: IDXRUPSItem[]
}

type TabType = 'dividends' | 'rups'

export function IDXCorporateActionsCard({ dividends, rupsEvents }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('dividends')
  const [filterQuery, setFilterQuery] = useState('')
  const [minYield, setMinYield] = useState<number>(0)

  const filteredDividends = useMemo(() => {
    return dividends.filter((d) => {
      const matchText =
        d.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
        d.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        d.sector.toLowerCase().includes(filterQuery.toLowerCase())
      const matchYield = d.dividendYield >= minYield
      return matchText && matchYield
    })
  }, [dividends, filterQuery, minYield])

  const filteredRUPS = useMemo(() => {
    return rupsEvents.filter((r) => {
      return (
        r.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.sector.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.eventType.toLowerCase().includes(filterQuery.toLowerCase())
      )
    })
  }, [rupsEvents, filterQuery])

  const getStatusBadge = (status: IDXDividendItem['status'], days: number) => {
    switch (status) {
      case 'CUM_PERIOD':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
            🔥 CUM PERIOD (Buy for Div)
          </span>
        )
      case 'UPCOMING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            ⏳ In {days} days
          </span>
        )
      case 'EX_PASSED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Ex-Date Passed
          </span>
        )
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-text-muted">
            Distributed
          </span>
        )
    }
  }

  return (
    <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('dividends')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'dividends'
                ? 'bg-[#ff2e54] text-white'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <span>💰 Cash Dividends</span>
            <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
              {dividends.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rups')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rups'
                ? 'bg-[#ff2e54] text-white'
                : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <span>🏛️ RUPS & Disclosures</span>
            <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
              {rupsEvents.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter emiten or sector..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#070b14] border border-white/[0.08] text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ff2e54]/50 w-44 sm:w-56"
          />

          {activeTab === 'dividends' && (
            <select
              value={minYield}
              onChange={(e) => setMinYield(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg bg-[#070b14] border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-[#ff2e54]/50 cursor-pointer"
            >
              <option value={0} className="bg-[#070b14] text-white">All Yields</option>
              <option value={4} className="bg-[#070b14] text-white">&gt; 4% Yield</option>
              <option value={8} className="bg-[#070b14] text-white">&gt; 8% High Yield</option>
            </select>
          )}
        </div>
      </div>

      {activeTab === 'dividends' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[10px] bg-[#070b14]/50">
                <th className="py-2.5 px-3">Emiten / Company</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">DPS (IDR)</th>
                <th className="py-2.5 px-3 text-right">Dividend Yield</th>
                <th className="py-2.5 px-3 text-right">Cum Date</th>
                <th className="py-2.5 px-3 text-right">Ex Date</th>
                <th className="py-2.5 px-3 text-right">Payment Date</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredDividends.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted">
                    No dividends matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDividends.map((div) => {
                  const isHighYield = div.dividendYield >= 8

                  return (
                    <tr
                      key={div.symbol}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white px-2 py-0.5 rounded bg-white/[0.06] group-hover:bg-white/[0.1] transition-colors">
                            {div.symbol}
                          </span>
                          <span className="truncate max-w-[140px] sm:max-w-[200px] text-text-secondary text-[11px]">
                            {div.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-white">
                        {formatIDR(div.currentPrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatIDR(div.dividendPerShare)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            isHighYield
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {div.dividendYield.toFixed(2)}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-emerald-400">
                        {div.cumDate}
                      </td>

                      <td className="py-3 px-3 text-right text-text-secondary">
                        {div.exDate}
                      </td>

                      <td className="py-3 px-3 text-right text-text-secondary">
                        {div.paymentDate}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {getStatusBadge(div.status, div.daysToExDate)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // ── Table View: RUPS & Disclosures ──
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[10px] bg-[#070b14]/50">
                <th className="py-2.5 px-3">Emiten</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Key Agenda / Disclosures</th>
                <th className="py-2.5 px-3 text-right">Event Date</th>
                <th className="py-2.5 px-3 text-right">Countdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredRUPS.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    No scheduled RUPS meetings found.
                  </td>
                </tr>
              ) : (
                filteredRUPS.map((rups, idx) => (
                  <tr
                    key={`${rups.symbol}-${idx}`}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white px-2 py-0.5 rounded bg-white/[0.06] group-hover:bg-white/[0.1]">
                          {rups.symbol}
                        </span>
                        <span className="truncate max-w-[150px] sm:max-w-[200px] text-text-secondary text-[11px]">
                          {rups.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {rups.eventType}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-text-secondary text-[11px] max-w-sm truncate">
                      {rups.agendaSnippet}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-white">
                      {rups.scheduledDate}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {rups.daysRemaining > 0 ? `In ${rups.daysRemaining} days` : 'Today'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
