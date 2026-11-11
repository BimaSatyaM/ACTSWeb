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
    <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
            <span>Sector Peer Benchmarking</span>
            <span className="text-xs font-normal text-slate-400">
              ({sectorName} Sector)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Compare valuation multiples, capital returns, and balance sheet risk against direct industry rivals.
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Click any row to inspect fundamentals
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[10px] bg-[#070b14]/50">
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
          <tbody className="divide-y divide-white/[0.04]">
            {peers.map((peer) => {
              const isActive = peer.symbol.toUpperCase() === currentSymbol.toUpperCase()

              return (
                <tr
                  key={peer.symbol}
                  onClick={() => onSelectPeer(peer.symbol)}
                  className={`cursor-pointer transition-colors group ${
                    isActive
                      ? 'bg-white/[0.04] border-l-2 border-[#ff2e54] font-semibold text-white'
                      : 'hover:bg-white/[0.02] text-slate-300'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <IDXStockLogo symbol={peer.symbol} name={peer.name} logoUrl={peer.logoUrl} size="xs" />
                      <span
                        className={`px-2 py-0.5 rounded font-black text-xs ${
                          isActive
                            ? 'bg-[#ff2e54] text-white'
                            : 'bg-white/[0.06] text-white group-hover:bg-white/[0.1]'
                        }`}
                      >
                        {peer.symbol}
                      </span>
                      <span className="truncate max-w-[160px] sm:max-w-[220px] text-slate-400 text-[11px]">
                        {peer.name}
                      </span>
                      {isActive && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          Active
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-white">
                    {formatIDR(peer.price)}
                  </td>

                  <td className="py-3 px-3 text-right text-cyan-400 font-bold">
                    {formatTrillion(peer.marketCapTrillion)}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.peRatio !== null && peer.peRatio < 12
                          ? 'text-emerald-400'
                          : peer.peRatio !== null && peer.peRatio > 25
                          ? 'text-rose-400'
                          : 'text-white'
                      }`}
                    >
                      {peer.peRatio !== null ? formatRatio(peer.peRatio) : '—'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.pbvRatio !== null && peer.pbvRatio < 1.0
                          ? 'text-emerald-400'
                          : peer.pbvRatio !== null && peer.pbvRatio > 3.0
                          ? 'text-rose-400'
                          : 'text-white'
                      }`}
                    >
                      {peer.pbvRatio !== null ? formatRatio(peer.pbvRatio) : '—'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.roe !== null && peer.roe >= 18
                          ? 'text-emerald-400'
                          : peer.roe !== null && peer.roe < 8
                          ? 'text-text-muted'
                          : 'text-white'
                      }`}
                    >
                      {peer.roe !== null ? `${peer.roe.toFixed(1)}%` : '—'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.dividendYield !== null && peer.dividendYield >= 5
                          ? 'text-amber-400'
                          : 'text-text-secondary'
                      }`}
                    >
                      {peer.dividendYield !== null ? `${peer.dividendYield.toFixed(1)}%` : '0.0%'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        peer.der !== null && peer.der > 2.5
                          ? 'text-rose-400'
                          : 'text-text-secondary'
                      }`}
                    >
                      {peer.der !== null ? formatRatio(peer.der) : '—'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right text-[11px] text-text-muted">
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
