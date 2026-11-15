'use client'

import React from 'react'
import {
  IDXPeerItem,
  formatIDR,
  formatTrillion,
  formatPercent,
  formatRatio,
} from '@/lib/idxKeystats'
import { IDXStockLogo } from '@/components/ui/IDXStockLogo'

interface Props {
  currentSymbol: string
  sectorName: string
  peers: IDXPeerItem[]
  onSelectPeer: (symbol: string) => void
}

export function IDXPeerComparison({
  currentSymbol,
  sectorName,
  peers,
  onSelectPeer,
}: Props) {
  if (!peers || peers.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl bg-[#fdfaf3] border border-slate-900/10 p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            <span>Sector Peer Benchmarking</span>
            <span className="text-xs font-normal text-slate-500 font-sans">
              ({sectorName} Sector)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Compare valuation multiples, capital returns, and balance sheet risk against direct industry rivals.
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Click any row to inspect fundamentals
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
          <thead>
            <tr className="border-b border-slate-900/10 text-slate-600 uppercase tracking-wider text-[10px] bg-[#faf2df]/80 font-bold">
              <th className="py-2.5 px-3">Ticker / Company</th>
              <th className="py-2.5 px-3 text-right">Price (IDR)</th>
              <th className="py-2.5 px-3 text-right">Market Cap</th>
              <th className="py-2.5 px-3 text-right">P/E (TTM)</th>
              <th className="py-2.5 px-3 text-right">P/BV</th>
              <th className="py-2.5 px-3 text-right">ROE (%)</th>
              <th className="py-2.5 px-3 text-right">Div Yield</th>
              <th className="py-2.5 px-3 text-right">DER</th>
              <th className="py-2.5 px-3 text-right">52w High / Low</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/10">
            {peers.map((peer) => {
              const isActive = peer.symbol.toUpperCase() === currentSymbol.toUpperCase()

              return (
                <tr
                  key={peer.symbol}
                  onClick={() => onSelectPeer(peer.symbol)}
                  className={`cursor-pointer transition-colors group ${
                    isActive
                      ? 'bg-sky-50/70 border-l-2 border-sky-600 font-semibold text-slate-900'
                      : 'hover:bg-[#f3ead2]/40 text-slate-700'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <IDXStockLogo symbol={peer.symbol} name={peer.name} logoUrl={peer.logoUrl} size="xs" />
                      <span
                        className={`px-2 py-0.5 rounded font-black text-xs ${
                          isActive
                            ? 'bg-sky-600 text-white'
                            : 'bg-[#fdfaf3] text-slate-800 border border-slate-900/10 group-hover:bg-[#f3ead2]'
                        }`}
                      >
                        {peer.symbol}
                      </span>
                      <span className="truncate max-w-[160px] sm:max-w-[220px] text-slate-500 text-[11px] font-sans">
                        {peer.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-sky-800 font-mono">
                          Active
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatIDR(peer.price)}
                  </td>

                  <td className="py-3 px-3 text-right text-sky-800 font-bold">
                    {formatTrillion(peer.marketCapTrillion)}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.peRatio !== null && peer.peRatio < 12
                          ? 'text-emerald-700'
                          : peer.peRatio !== null && peer.peRatio > 25
                          ? 'text-rose-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {peer.peRatio !== null ? formatRatio(peer.peRatio) : '-'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.pbvRatio !== null && peer.pbvRatio < 1.0
                          ? 'text-emerald-700'
                          : peer.pbvRatio !== null && peer.pbvRatio > 3.0
                          ? 'text-rose-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {peer.pbvRatio !== null ? formatRatio(peer.pbvRatio) : '-'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.roe !== null && peer.roe >= 18
                          ? 'text-emerald-700'
                          : peer.roe !== null && peer.roe < 8
                          ? 'text-slate-500'
                          : 'text-slate-900'
                      }`}
                    >
                      {peer.roe !== null ? `${peer.roe.toFixed(1)}%` : '-'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.dividendYield !== null && peer.dividendYield >= 5
                          ? 'text-amber-800'
                          : 'text-slate-600'
                      }`}
                    >
                      {peer.dividendYield !== null ? `${peer.dividendYield.toFixed(1)}%` : '0.0%'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.der !== null && peer.der > 2.5
                          ? 'text-rose-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {peer.der !== null ? formatRatio(peer.der) : '-'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right text-[11px] text-slate-500">
                    {formatIDR(peer.week52Low)} - {formatIDR(peer.week52High)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
