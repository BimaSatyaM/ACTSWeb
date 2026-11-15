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
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300">
            CUM PERIOD (Buy for Div)
          </span>
        )
      case 'UPCOMING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-50 text-sky-800 border border-sky-200">
            In {days} days
          </span>
        )
      case 'EX_PASSED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
            Ex-Date Passed
          </span>
        )
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-900/10">
            Distributed
          </span>
        )
    }
  }

  return (
    <div className="rounded-xl bg-[#fdfaf3] border border-slate-900/10 p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('dividends')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'dividends'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            <span>Cash Dividends</span>
            <span className="text-[10px] font-mono opacity-60 tabular-nums font-semibold">
              {dividends.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rups')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rups'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
            }`}
          >
            <span>RUPS &amp; Disclosures</span>
            <span className="text-[10px] font-mono opacity-60 tabular-nums font-semibold">
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
            className="px-3 py-1.5 rounded-lg bg-[#fdfaf3] border border-slate-900/15 text-xs font-mono text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:border-sky-600 w-44 sm:w-56"
          />

          {activeTab === 'dividends' && (
            <select
              value={minYield}
              onChange={(e) => setMinYield(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg bg-[#fdfaf3] border border-slate-900/15 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-sky-600 cursor-pointer"
            >
              <option value={0} className="bg-[#fdfaf3] text-slate-900">All Yields</option>
              <option value={4} className="bg-[#fdfaf3] text-slate-900">&gt; 4% Yield</option>
              <option value={8} className="bg-[#fdfaf3] text-slate-900">&gt; 8% High Yield</option>
            </select>
          )}
        </div>
      </div>

      {activeTab === 'dividends' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-900/10 text-slate-600 uppercase tracking-wider text-[10px] bg-[#faf2df]/80 font-bold">
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
            <tbody className="divide-y divide-slate-900/10">
              {filteredDividends.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No dividends matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDividends.map((div) => {
                  const isHighYield = div.dividendYield >= 8

                  return (
                    <tr
                      key={div.symbol}
                      className="hover:bg-[#f3ead2]/40 transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-[#fdfaf3] border border-slate-900/10 group-hover:bg-[#f3ead2] transition-colors">
                            {div.symbol}
                          </span>
                          <span className="truncate max-w-[140px] sm:max-w-[200px] text-slate-600 text-[11px] font-sans">
                            {div.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatIDR(div.currentPrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-700 tabular-nums">
                        {formatIDR(div.dividendPerShare)}
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            isHighYield
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {div.dividendYield.toFixed(2)}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-emerald-700 tabular-nums">
                        {div.cumDate}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                        {div.exDate}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
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
              <tr className="border-b border-slate-900/10 text-slate-600 uppercase tracking-wider text-[10px] bg-[#faf2df]/80 font-bold">
                <th className="py-2.5 px-3">Emiten</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Key Agenda / Disclosures</th>
                <th className="py-2.5 px-3 text-right">Event Date</th>
                <th className="py-2.5 px-3 text-right">Countdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/10">
              {filteredRUPS.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No scheduled RUPS meetings found.
                  </td>
                </tr>
              ) : (
                filteredRUPS.map((rups, idx) => (
                  <tr
                    key={`${rups.symbol}-${idx}`}
                    className="hover:bg-[#f3ead2]/40 transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-[#fdfaf3] border border-slate-900/10 group-hover:bg-[#f3ead2]">
                          {rups.symbol}
                        </span>
                        <span className="truncate max-w-[150px] sm:max-w-[200px] text-slate-600 text-[11px] font-sans">
                          {rups.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        {rups.eventType}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 text-[11px] max-w-sm truncate font-sans">
                      {rups.agendaSnippet}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                      {rups.scheduledDate}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 tabular-nums">
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
