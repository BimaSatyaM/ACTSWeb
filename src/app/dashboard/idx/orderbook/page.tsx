'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { StockMeta, IDX_UNIVERSE, IDX_UNIVERSE_LIST } from '@/lib/idxData'
import { useIDXStream } from '@/lib/useIDXStream'
import { IDXOrderBook } from '@/components/dashboard/idx/IDXOrderBook'
import { IDXRunningTradeTape } from '@/components/dashboard/idx/IDXRunningTradeTape'
import { IDXStockLogo } from '@/components/ui/IDXStockLogo'

type TickerCategory = 'liquid' | 'gainers' | 'bakrie' | 'buzz' | 'banks'

interface CategoryConfig {
  label: string
  icon: (cls?: string) => React.ReactNode
  tickers: string[]
}

const CATEGORY_MAP: Record<TickerCategory, CategoryConfig> = {
  liquid: {
    label: 'Most Active',
    icon: (cls = 'w-3.5 h-3.5') => (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      </svg>
    ),
    tickers: ['BBCA', 'BBRI', 'BMRI', 'BREN', 'BUMI', 'BRMS', 'TLKM', 'ANTM', 'AMMN', 'CUAN', 'ASII', 'GOTO', 'DSSA', 'MEDC'],
  },
  gainers: {
    label: 'Top Gainers',
    icon: (cls = 'w-3.5 h-3.5') => (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.25 18L9 11.25l4.5 4.5L21 8.25M16.5 3.75h4.5v4.5" />
      </svg>
    ),
    tickers: [], // dynamically computed from stockList
  },
  bakrie: {
    label: 'Bakrie Group',
    icon: (cls = 'w-3.5 h-3.5') => (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.75 21h16.5M4.5 3h15M6 3v18m12-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m-1.5 3h1.5m4.5-9h1.5m-1.5 3h1.5m-1.5 3h1.5m-1.5 3h1.5" />
      </svg>
    ),
    tickers: ['BNBR', 'BUMI', 'BRMS', 'ENZO', 'VIVA', 'MDIA', 'DEWA', 'UNSP'],
  },
  buzz: {
    label: 'Small / Mid Cap',
    icon: (cls = 'w-3.5 h-3.5') => (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    tickers: ['ENZO', 'RBMS', 'COCO', 'KIOS', 'DFAM', 'RAJA', 'BIPI', 'AYLS', 'TRIN', 'PTMP'],
  },
  banks: {
    label: 'Big Banks',
    icon: (cls = 'w-3.5 h-3.5') => (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5m-15 10.5V10.5M3 21h18" />
      </svg>
    ),
    tickers: ['BBCA', 'BBRI', 'BMRI', 'BBNI', 'BBTN', 'BDMN', 'BRIS', 'MEGA'],
  },
}

export default function IDXOrderBookPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BNBR')
  const [stockList, setStockList] = useState<StockMeta[]>(IDX_UNIVERSE_LIST)
  const [activeCategory, setActiveCategory] = useState<TickerCategory>('liquid')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)

  // Fetch real-time initial metadata for all 845 stocks
  useEffect(() => {
    let isMounted = true
    const fetchWatchlist = async () => {
      try {
        const res = await fetch('/api/idx/watchlist')
        if (res.ok && isMounted) {
          const data = await res.json()
          if (data.success && data.stocks) {
            setStockList(data.stocks)
          }
        }
      } catch (e) {
        // silent fail
      }
    }
    fetchWatchlist()
    return () => {
      isMounted = false
    }
  }, [])

  // Active stock object
  const activeStock = useMemo(() => {
    return stockList.find((s) => s.symbol === selectedSymbol) || IDX_UNIVERSE[selectedSymbol] || stockList[0]
  }, [stockList, selectedSymbol])

  // Search filter across all 845 Indonesian stocks
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return stockList.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 10)
  }, [stockList, searchQuery])

  // Dynamic tickers to display in the quick switcher strip
  const displayedCategoryTickers = useMemo(() => {
    if (activeCategory === 'gainers') {
      const topGainers = [...stockList]
        .filter(s => s.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 10)
        .map(s => s.symbol)
      return topGainers.length > 0 ? topGainers : ['BREN', 'BRMS', 'CUAN', 'BUMI', 'BNBR']
    }
    return CATEGORY_MAP[activeCategory]?.tickers || CATEGORY_MAP.liquid.tickers
  }, [activeCategory, stockList])

  // Symbols to subscribe over WebSocket (full Indonesian universe from stockList + active symbol)
  const streamSymbols = useMemo(() => {
    if (stockList && stockList.length > 0) {
      return Array.from(new Set([
        selectedSymbol,
        ...stockList.map((s) => s.symbol),
      ]))
    }
    return Array.from(new Set([
      'BNBR', 'BBCA', 'BBRI', 'BREN', 'BUMI', 'GOTO', 'BMRI', 'TLKM',
      'BRMS', 'ENZO', 'RBMS', 'COCO', 'CUAN', 'ANTM', selectedSymbol
    ]))
  }, [stockList, selectedSymbol])

  // ── Connect Sub-Second WebSocket Stream ──
  const { quotes, trades, connected } = useIDXStream({
    symbols: streamSymbols,
  })

  const currentStreamQuote = quotes[selectedSymbol] || null
  const livePrice = currentStreamQuote?.price || activeStock.currentPrice
  const liveChange = currentStreamQuote ? currentStreamQuote.changePoints : activeStock.changePoints
  const liveChangePct = currentStreamQuote ? currentStreamQuote.changePercent : activeStock.changePercent
  const isPos = liveChange >= 0

  return (
    <div className="space-y-5">
      
      {/* ── Top Bar: Ticker Switcher & Live Connection Status ── */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#0d121f] border border-white/[0.08] space-y-4">
        
        {/* Connection & Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tight font-mono">
              Depth of Market (DOM) & Tape
            </h1>
          </div>

          {/* Search Any IDX Stock Input */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#070b14] border border-white/[0.08] focus-within:border-[#ff2e54]/50 transition-colors">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search 884 IDX stocks (e.g. ENZO, BRMS, COCO)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setIsSearchOpen(true)
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-52 sm:w-64 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setIsSearchOpen(false)
                  }}
                  className="text-[10px] text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 py-1 rounded-xl bg-[#0d121f] border border-white/15 shadow-2xl z-50 divide-y divide-white/[0.04] max-h-72 overflow-y-auto">
                {searchResults.map((stock) => {
                  const q = quotes[stock.symbol]
                  const p = q?.price || stock.currentPrice
                  const chgPct = q ? q.changePercent : stock.changePercent

                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => {
                        setSelectedSymbol(stock.symbol)
                        setSearchQuery('')
                        setIsSearchOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white/[0.06] flex items-center justify-between text-xs font-mono transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-white block">{stock.symbol}</span>
                        <span className="text-[10px] text-slate-400 block line-clamp-1">{stock.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white block">Rp {p.toLocaleString()}</span>
                        <span className={`text-[10px] ${chgPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {chgPct >= 0 ? '+' : ''}{chgPct.toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Category Tabs & Quick Tickers Strip */}
        <div className="space-y-3">
          {/* Category Tabs with Real Vector Icons */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs font-mono">
            {(Object.keys(CATEGORY_MAP) as TickerCategory[]).map((cat) => {
              const item = CATEGORY_MAP[cat]
              const isActive = activeCategory === cat

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.08] text-white font-bold border border-white/20 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-[#ff2e54]' : 'text-slate-500'}>
                    {item.icon('w-3.5 h-3.5')}
                  </span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Quick Ticker Buttons Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {/* Active Stock Indicator Pill if not in current category */}
            {!displayedCategoryTickers.includes(selectedSymbol) && (
              <button
                onClick={() => setSelectedSymbol(selectedSymbol)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#ff2e54]/15 text-white border border-[#ff2e54]/50 flex items-center gap-2 whitespace-nowrap shadow-xs cursor-pointer ring-1 ring-[#ff2e54]/20"
              >
                <IDXStockLogo symbol={selectedSymbol} name={activeStock?.name} logoUrl={activeStock?.logoUrl} size="xs" />
                <span>{selectedSymbol}</span>
                <span className="text-[11px] text-slate-300">Rp {livePrice.toLocaleString()}</span>
                <span className={`text-[10px] font-bold ${activeStock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeStock.changePercent >= 0 ? '+' : ''}{activeStock.changePercent.toFixed(1)}%
                </span>
              </button>
            )}

            {/* Category Stock Buttons */}
            {displayedCategoryTickers.map((sym) => {
              const q = quotes[sym]
              const stockObj = stockList.find((s) => s.symbol === sym)
              const price = q?.price || stockObj?.currentPrice || '--'
              const chg = q ? q.changePercent : stockObj ? stockObj.changePercent : 0
              const isSelected = selectedSymbol === sym

              return (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff2e54]/15 text-white font-bold border border-[#ff2e54]/50 shadow-xs ring-1 ring-[#ff2e54]/20'
                      : 'bg-[#070b14] text-slate-400 font-medium hover:text-white hover:bg-white/[0.04] border border-white/[0.06]'
                  }`}
                >
                  <IDXStockLogo symbol={sym} name={stockObj?.name} logoUrl={stockObj?.logoUrl} size="xs" />
                  <span className={isSelected ? 'text-white font-bold' : 'text-slate-200'}>{sym}</span>
                  <span className={`text-[11px] ${isSelected ? 'text-white font-semibold' : 'text-slate-400'}`}>
                    {typeof price === 'number' ? `Rp ${price.toLocaleString()}` : price}
                  </span>
                  {typeof chg === 'number' && (
                    <span className={`text-[10px] font-semibold ${chg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {chg >= 0 ? '+' : ''}{chg.toFixed(1)}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Stock Real-time Telemetry Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-3.5">
            <IDXStockLogo
              symbol={activeStock.symbol}
              name={activeStock.name}
              logoUrl={activeStock.logoUrl}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {activeStock.symbol}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                  IDX · Equity
                </span>
                {activeStock.group && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                    {activeStock.group}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {activeStock.name} · <span className="text-slate-500">{activeStock.sector}</span>
              </p>
            </div>
          </div>

          {/* Live Price Pill & Key Metrics */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-left lg:text-right">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight block">
                Rp {livePrice.toLocaleString()}
              </span>
              <div className={`flex items-center lg:justify-end gap-1.5 text-xs font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span>{isPos ? '+' : ''}{liveChange}</span>
                <span>({isPos ? '+' : ''}{liveChangePct.toFixed(2)}%)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono border-l border-white/[0.08] pl-4">
              <div className="bg-[#070b14] px-3 py-1.5 rounded-lg border border-white/[0.05]">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">24h High / Low</span>
                <span className="text-white font-semibold">
                  {(currentStreamQuote?.high || activeStock.dayHigh).toLocaleString()} / {(currentStreamQuote?.low || activeStock.dayLow).toLocaleString()}
                </span>
              </div>
              <div className="bg-[#070b14] px-3 py-1.5 rounded-lg border border-white/[0.05]">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Traded Volume</span>
                <span className="text-slate-300">
                  {(currentStreamQuote?.volume || activeStock.volume).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Main Two-Column Grid: 10-Level Order Book (Left) vs Running Trade Tape (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 cols): 10-Level Order Book */}
        <div className="lg:col-span-7">
          <IDXOrderBook
            symbol={selectedSymbol}
            meta={activeStock}
            streamQuote={currentStreamQuote}
          />
        </div>

        {/* Right Column (5 cols): High-Velocity Running Trade Tape */}
        <div className="lg:col-span-5">
          <IDXRunningTradeTape
            trades={trades}
            activeSymbol={selectedSymbol}
            onSelectStock={(sym) => setSelectedSymbol(sym)}
          />
        </div>

      </div>

    </div>
  )
}
