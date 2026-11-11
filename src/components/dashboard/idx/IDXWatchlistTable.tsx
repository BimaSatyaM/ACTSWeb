'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { StockMeta, IDX_UNIVERSE_LIST } from '@/lib/idxData'
import { IDXStockLogo } from '@/components/ui/IDXStockLogo'

interface IDXWatchlistTableProps {
  selectedSymbol: string
  onSelectStock: (stock: StockMeta) => void
  compact?: boolean
}

const SECTOR_FILTERS = [
  'All',
  'LQ45',
  'Banking',
  'Energy & Mining',
  'Conglomerates',
  'Technology',
  'Consumer',
]

export function IDXWatchlistTable({
  selectedSymbol,
  onSelectStock,
  compact = false,
}: IDXWatchlistTableProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [stockList, setStockList] = useState<StockMeta[]>(IDX_UNIVERSE_LIST)
  const [isLive, setIsLive] = useState<boolean>(false)

  // ── Poll Real-Time Watchlist Batch from /api/idx/watchlist ──
  useEffect(() => {
    let isMounted = true

    const fetchLiveWatchlist = async () => {
      try {
        const res = await fetch('/api/idx/watchlist')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.stocks && isMounted) {
            setStockList(data.stocks)
            setIsLive(true)
          }
        }
      } catch (err) {
        console.warn('Could not fetch live watchlist:', err)
      }
    }

    fetchLiveWatchlist()
    const interval = setInterval(fetchLiveWatchlist, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const [displayLimit, setDisplayLimit] = useState<number>(50)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setDisplayLimit((prev) => Math.min(filteredStocks.length, prev + 50))
    }
  }

  const filteredStocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return stockList.filter((s) => {
      // If user is actively searching, search across all 845 Indonesian stocks
      if (q) {
        return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      }

      // Otherwise apply sector filter
      if (selectedFilter === 'LQ45') {
        const lq45List = ['BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'BREN', 'ADRO', 'ICBP', 'UNVR', 'BRPT']
        if (!lq45List.includes(s.symbol)) return false
      } else if (selectedFilter === 'Banking') {
        if (!s.sector.toLowerCase().includes('bank') && !s.sector.toLowerCase().includes('finance')) return false
      } else if (selectedFilter === 'Energy & Mining') {
        if (!s.sector.toLowerCase().includes('energy') && !s.sector.toLowerCase().includes('mineral') && !s.sector.toLowerCase().includes('mining')) return false
      } else if (selectedFilter === 'Conglomerates') {
        if (!s.sector.toLowerCase().includes('conglomerate') && !s.group) return false
      } else if (selectedFilter === 'Technology') {
        if (!s.sector.toLowerCase().includes('tech') && !s.sector.toLowerCase().includes('software')) return false
      } else if (selectedFilter === 'Consumer') {
        if (!s.sector.toLowerCase().includes('consumer')) return false
      }

      return true
    })
  }, [stockList, selectedFilter, searchQuery])

  // If searching, show all matched; otherwise display up to displayLimit
  const displayedStocks = searchQuery.trim() ? filteredStocks : filteredStocks.slice(0, displayLimit)

  // ── Compact Side-by-Side Mode ──
  if (compact) {
    return (
      <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] overflow-hidden flex flex-col h-[480px]">
        {/* ── Compact Header: Title & Search ── */}
        <div className="p-3.5 bg-white/[0.01] border-b border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-[#ff2e54]'}`} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Indonesian Equities
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                {filteredStocks.length}
              </span>
            </div>

            <div className="relative w-36 sm:w-44">
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticker..."
                className="w-full bg-[#070b14] border border-white/[0.08] focus:border-[#ff2e54]/50 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-hidden transition-colors font-mono"
              />
            </div>
          </div>

          {/* Sector Filters */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
            {SECTOR_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === f
                    ? 'bg-[#ff2e54]/20 text-white border border-[#ff2e54]/50'
                    : 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.05]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Stocks List ── */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]"
        >
          {displayedStocks.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No equities found matching "{searchQuery}"
            </div>
          ) : (
            displayedStocks.map((s) => {
              const isSelected = selectedSymbol === s.symbol
              const isPos = s.changePoints >= 0

              return (
                <div
                  key={s.symbol}
                  onClick={() => onSelectStock(s)}
                  className={`group flex items-center justify-between p-2.5 sm:px-3.5 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-white/[0.06] border-l-2 border-[#ff2e54]'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Left: Logo, Symbol & Name */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <IDXStockLogo
                      symbol={s.symbol}
                      name={s.name}
                      logoUrl={s.logoUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white font-mono text-xs">{s.symbol}</span>
                        {s.group && (
                          <span className="hidden sm:inline-block text-[9px] px-1 py-0.2 rounded bg-white/[0.04] text-slate-400 font-mono truncate max-w-[90px]">
                            {s.group}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[130px] sm:max-w-[170px]">
                        {s.name}
                      </p>
                    </div>
                  </div>

                  {/* Right: Price & Change */}
                  <div className="flex items-center gap-3 shrink-0 text-right font-mono">
                    <div>
                      <div className="text-xs font-bold text-white">
                        Rp {s.currentPrice.toLocaleString()}
                      </div>
                      <span className={`text-[9px] block ${
                        s.foreignFlow === 'BUY' ? 'text-emerald-400' : s.foreignFlow === 'SELL' ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {s.foreignFlow === 'BUY' ? '▲ F.Buy' : s.foreignFlow === 'SELL' ? '▼ F.Sell' : '• Neut'}
                      </span>
                    </div>

                    <div className="w-16 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isPos
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {isPos ? '+' : ''}{s.changePercent.toFixed(2)}%
                      </span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">
                        {isPos ? '+' : ''}{s.changePoints}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer Telemetry ── */}
        <div className="px-3 py-1.5 bg-[#070b14] border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Showing {displayedStocks.length} of {filteredStocks.length} stocks</span>
          <span>Click ticker to inspect</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] overflow-hidden space-y-3.5 p-4 sm:p-5">
      {/* ── Header: Search & Category Tabs ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-brand-primary'}`} />
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
            Indonesian Equities Watchlist
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
            {isLive ? 'LIVE STREAM' : 'FEED READY'}
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            {filteredStocks.length} Tickers
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol or name..."
            className="w-full bg-[#070b14] border border-white/[0.08] focus:border-[#ff2e54]/50 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden transition-colors font-mono"
          />
        </div>
      </div>

      {/* ── Category Filters Pills ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
        {SECTOR_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === f
                ? 'bg-[#ff2e54]/15 text-white border border-[#ff2e54]/40'
                : 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.05]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Interactive Stock Table ── */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider bg-[#070b14]/40">
              <th className="py-2.5 px-3">Ticker</th>
              <th className="py-2.5 px-3 text-right">Price (IDR)</th>
              <th className="py-2.5 px-3 text-right">Change (1D)</th>
              <th className="py-2.5 px-3 text-center">Foreign Flow</th>
              <th className="py-2.5 px-3 text-right">Turnover</th>
              <th className="py-2.5 px-3 text-right">Day Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {displayedStocks.map((s) => {
              const isSelected = selectedSymbol === s.symbol
              const isPos = s.changePoints >= 0
              const rangeSpan = s.dayHigh - s.dayLow
              const rangePos = rangeSpan > 0 ? Math.min(100, Math.max(0, Math.round(((s.currentPrice - s.dayLow) / rangeSpan) * 100))) : 50

              return (
                <tr
                  key={s.symbol}
                  onClick={() => onSelectStock(s)}
                  className={`group cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? 'bg-white/[0.04] border-l-2 border-[#ff2e54]'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Ticker & Name */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <IDXStockLogo
                        symbol={s.symbol}
                        name={s.name}
                        logoUrl={s.logoUrl}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono">{s.symbol}</span>
                          {s.group && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-white/[0.04] text-slate-400 font-mono">
                              {s.group}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 line-clamp-1 max-w-[180px]">
                          {s.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                    Rp {s.currentPrice.toLocaleString()}
                  </td>

                  {/* Change */}
                  <td className="py-2.5 px-3 text-right font-mono">
                    <span className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {isPos ? '+' : ''}{s.changePoints}
                    </span>
                  </td>

                  {/* Foreign Flow */}
                  <td className="py-2.5 px-3 text-center font-mono">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.foreignFlow === 'BUY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : s.foreignFlow === 'SELL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {s.foreignFlow === 'BUY' ? '▲ F.BUY' : s.foreignFlow === 'SELL' ? '▼ F.SELL' : '• NEUTRAL'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      {s.foreignNetBillion >= 0 ? '+' : ''}{s.foreignNetBillion} B
                    </span>
                  </td>

                  {/* Turnover */}
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    <span className="font-semibold text-white block">
                      Rp {(s.turnover / 1000000000).toFixed(1)} B
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {(s.volume / 1000000).toFixed(1)} M shs
                    </span>
                  </td>

                  {/* Day Range Bar */}
                  <td className="py-2.5 px-3 text-right font-mono">
                    <div className="w-24 ml-auto space-y-1">
                      <div className="relative w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-slate-600 rounded-full"
                          style={{ width: `${rangePos}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-2 bg-white rounded-xs"
                          style={{ left: `calc(${rangePos}% - 3px)` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>{s.dayLow}</span>
                        <span>{s.dayHigh}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Load More / Pagination Footer ── */}
      {!searchQuery.trim() && displayedStocks.length < filteredStocks.length && (
        <div className="pt-3 border-t border-white/[0.08] text-center">
          <button
            onClick={() => setDisplayLimit((prev) => prev + 50)}
            className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-[#070b14] hover:bg-white/[0.06] text-slate-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
          >
            Load More Tickers (Showing {displayedStocks.length} of {filteredStocks.length}) ↓
          </button>
        </div>
      )}
    </div>
  )
}
