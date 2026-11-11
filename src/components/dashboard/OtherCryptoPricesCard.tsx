'use client'

import React, { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import { GlassCard } from '@/components/ui/GlassCard'
import { AssetIcon } from '@/components/ui/AssetIcon'

export interface CryptoPairTicker {
  symbol: string
  name: string
  price: number
  change24h: number
  changeDollar: number
  changePips: number
  high24h: number
  low24h: number
  volume24h?: number
}

interface OtherCryptoPricesCardProps {
  excludeSymbol?: string // e.g. "BTC" or "BTCUSDT"
  className?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const DEFAULT_CRYPTO_LIST: CryptoPairTicker[] = [
  { symbol: 'ETH', name: 'Ethereum', price: 2493.43, change24h: 1.55, changeDollar: 38.06, changePips: 380, high24h: 2523.97, low24h: 2450.0 },
  { symbol: 'SOL', name: 'Solana', price: 105.16, change24h: 2.67, changeDollar: 2.73, changePips: 27, high24h: 107.07, low24h: 102.22 },
  { symbol: 'BNB', name: 'BNB', price: 756.47, change24h: 0.79, changeDollar: 5.93, changePips: 59, high24h: 780.64, low24h: 743.91 },
  { symbol: 'XRP', name: 'XRP', price: 1.41, change24h: 2.15, changeDollar: 0.03, changePips: 30, high24h: 1.46, low24h: 1.38 },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.091, change24h: -1.24, changeDollar: -0.001, changePips: 10, high24h: 0.094, low24h: 0.089 },
  { symbol: 'ADA', name: 'Cardano', price: 0.218, change24h: 1.05, changeDollar: 0.002, changePips: 20, high24h: 0.225, low24h: 0.212 },
  { symbol: 'AVAX', name: 'Avalanche', price: 7.62, change24h: 2.84, changeDollar: 0.21, changePips: 21, high24h: 7.85, low24h: 7.42 },
  { symbol: 'LINK', name: 'Chainlink', price: 12.17, change24h: 3.12, changeDollar: 0.37, changePips: 37, high24h: 12.45, low24h: 11.85 },
  { symbol: 'SUI', name: 'Sui', price: 0.792, change24h: 4.55, changeDollar: 0.035, changePips: 35, high24h: 0.825, low24h: 0.765 },
  { symbol: 'BTC', name: 'Bitcoin', price: 79796.0, change24h: 0.21, changeDollar: 167.22, changePips: 167, high24h: 80200.0, low24h: 79545.96 },
]

export function OtherCryptoPricesCard({
  excludeSymbol = 'BTC',
  className = '',
}: OtherCryptoPricesCardProps) {
  const cleanExclude = excludeSymbol.replace(/USDT$/i, '').toUpperCase()

  // Available pairs excluding the active primary signal asset
  const availableSymbols = ['ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'SUI', 'BTC'].filter(
    (s) => s !== cleanExclude
  )

  const [selectedSymbol, setSelectedSymbol] = useState<string>(availableSymbols[0] || 'ETH')
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Live WebSocket state per pair
  const [liveTickers, setLiveTickers] = useState<Record<string, CryptoPairTicker>>({})
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null)
  const prevPriceRef = useRef<number | null>(null)
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reset price flash reference on pair switch
  useEffect(() => {
    prevPriceRef.current = null
    setPriceFlash(null)
  }, [selectedSymbol])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 1. SWR Fallback Data (1s interval for real-time live futures accuracy)
  const { data: marketData } = useSWR<{ tickers: CryptoPairTicker[] }>('/api/market-prices', fetcher, {
    refreshInterval: 1000,
    revalidateOnFocus: true,
  })

  // 2. Active Pair Ultra-Fast Binance Futures Live WebSocket Feed (@trade + @aggTrade + @ticker)
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout
    let endpointIdx = 0

    const streamPair = `${selectedSymbol.toLowerCase()}usdt`
    const endpoints = [
      `wss://data-stream.binance.vision/ws/${streamPair}@trade/${streamPair}@aggTrade/${streamPair}@ticker`,
      `wss://fstream.binance.com/ws/${streamPair}@trade/${streamPair}@aggTrade/${streamPair}@ticker`,
      `wss://fstream-auth.binance.com/ws/${streamPair}@trade/${streamPair}@aggTrade/${streamPair}@ticker`,
    ]

    const connectWs = () => {
      try {
        const url = endpoints[endpointIdx % endpoints.length]
        ws = new WebSocket(url)

        ws.onopen = () => {
          endpointIdx = 0
        }

        ws.onmessage = (event) => {
          try {
            const rawMsg = JSON.parse(event.data)
            const msg = rawMsg.data || rawMsg

            if (msg.e === 'aggTrade' || msg.e === 'trade') {
              const isFractional = ['DOGE', 'ADA', 'SUI'].includes(selectedSymbol)
              const livePrice = parseFloat(parseFloat(msg.p).toFixed(isFractional ? 4 : 2))

              // Trigger snappy 150ms micro-pulse flash
              if (prevPriceRef.current !== null && prevPriceRef.current !== livePrice) {
                const flash = livePrice > prevPriceRef.current ? 'up' : 'down'
                setPriceFlash(flash)
                if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
                flashTimeoutRef.current = setTimeout(() => setPriceFlash(null), 150)
              }
              prevPriceRef.current = livePrice

              setLiveTickers((curr) => {
                const fallback = DEFAULT_CRYPTO_LIST.find((c) => c.symbol === selectedSymbol)
                const existing = curr[selectedSymbol] || fallback || {
                  symbol: selectedSymbol,
                  name: selectedSymbol,
                  price: livePrice,
                  change24h: 0,
                  changeDollar: 0,
                  changePips: 0,
                  high24h: livePrice,
                  low24h: livePrice,
                }
                const prevOpen =
                  existing.high24h && existing.change24h !== undefined
                    ? existing.price / (1 + existing.change24h / 100)
                    : livePrice
                const changeDollar = parseFloat((livePrice - prevOpen).toFixed(isFractional ? 4 : 2))
                const changePips = Math.round(Math.abs(changeDollar * (isFractional ? 1000 : 1)))

                return {
                  ...curr,
                  [selectedSymbol]: {
                    ...existing,
                    price: livePrice,
                    changeDollar,
                    changePips,
                    high24h: Math.max(existing.high24h, livePrice),
                    low24h: Math.min(existing.low24h, livePrice),
                  },
                }
              })
            }

            if (msg.e === '24hrTicker' || msg.e === '24hrMiniTicker') {
              const change24h = parseFloat(parseFloat(msg.P || msg.p || '0').toFixed(2))
              const changeDollar = parseFloat(parseFloat(msg.p || msg.d || '0').toFixed(2))
              const high24h = parseFloat(parseFloat(msg.h || '0').toFixed(2))
              const low24h = parseFloat(parseFloat(msg.l || '0').toFixed(2))
              const volume24h = parseFloat(parseFloat(msg.q || '0').toFixed(0))
              const changePips = Math.round(Math.abs(changeDollar))

              setLiveTickers((curr) => {
                const fallback = DEFAULT_CRYPTO_LIST.find((c) => c.symbol === selectedSymbol)
                const existing = curr[selectedSymbol] || fallback || {
                  symbol: selectedSymbol,
                  name: selectedSymbol,
                  price: parseFloat(parseFloat(msg.c).toFixed(2)),
                  change24h,
                  changeDollar,
                  changePips,
                  high24h,
                  low24h,
                }

                return {
                  ...curr,
                  [selectedSymbol]: {
                    ...existing,
                    price: existing.price ?? parseFloat(parseFloat(msg.c).toFixed(2)),
                    change24h: change24h !== 0 ? change24h : existing.change24h,
                    changeDollar: changeDollar !== 0 ? changeDollar : existing.changeDollar,
                    changePips: changePips !== 0 ? changePips : existing.changePips,
                    high24h: Math.max(existing.high24h || 0, high24h),
                    low24h: existing.low24h ? Math.min(existing.low24h, low24h) : low24h,
                    volume24h,
                  },
                }
              })
            }
          } catch {}
        }

        ws.onerror = () => {
          endpointIdx++
          ws?.close()
        }
        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000)
        }
      } catch {
        endpointIdx++
        reconnectTimeout = setTimeout(connectWs, 3000)
      }
    }

    connectWs()
    return () => {
      clearTimeout(reconnectTimeout)
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
      if (ws) {
        ws.onclose = null
        ws.onerror = null
        try {
          ws.close()
        } catch {}
      }
    }
  }, [selectedSymbol])

  // Helper to get ticker for any symbol
  const getTicker = (sym: string): CryptoPairTicker => {
    const fromSwr = marketData?.tickers?.find((t) => t.symbol === sym)
    const live = liveTickers[sym]
    const fallback = DEFAULT_CRYPTO_LIST.find((c) => c.symbol === sym)
    const base = fromSwr || fallback

    if (live && base) {
      const isFractional = ['DOGE', 'ADA', 'SUI'].includes(sym)
      const livePrice = live.price
      const baseOpen = base.change24h !== undefined ? base.price - base.changeDollar : livePrice
      const changeDollar = (live.changeDollar !== 0 && live.change24h !== 0)
        ? live.changeDollar
        : (base.change24h !== undefined ? parseFloat((livePrice - baseOpen).toFixed(isFractional ? 4 : 2)) : base.changeDollar)
      const change24h = (live.change24h !== 0)
        ? live.change24h
        : (baseOpen > 0 ? parseFloat((((livePrice - baseOpen) / baseOpen) * 100).toFixed(2)) : base.change24h)
      const changePips = Math.round(Math.abs(changeDollar * (isFractional ? 1000 : 1)))

      return {
        ...base,
        price: livePrice,
        change24h,
        changeDollar,
        changePips,
        high24h: Math.max(live.high24h || 0, base.high24h || 0, livePrice),
        low24h: Math.min(
          live.low24h && live.low24h > 0 ? live.low24h : Infinity,
          base.low24h && base.low24h > 0 ? base.low24h : Infinity,
          livePrice
        ),
      }
    }
    if (fromSwr) return fromSwr
    return fallback || {
      symbol: sym,
      name: sym,
      price: 0,
      change24h: 0,
      changeDollar: 0,
      changePips: 0,
      high24h: 0,
      low24h: 0,
    }
  }

  const activeTicker = getTicker(selectedSymbol)
  const isPositive = activeTicker.change24h >= 0

  const rangeSpan = activeTicker.high24h - activeTicker.low24h
  const rangePct =
    rangeSpan > 0
      ? Math.max(0, Math.min(100, ((activeTicker.price - activeTicker.low24h) / rangeSpan) * 100))
      : 50

  const isFractional = ['DOGE', 'ADA', 'SUI'].includes(selectedSymbol)
  const formatDecimals = isFractional ? 4 : 2

  return (
    <GlassCard className={`p-5 sm:p-6 space-y-4 border-white/[0.09] ${className}`}>
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
        <span className="text-xs font-bold text-white tracking-tight uppercase">
          Other Crypto Pairs
        </span>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white hover:text-zinc-200 transition-colors cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <AssetIcon symbol={selectedSymbol} size="xs" />
            <span className="font-mono text-xs font-bold">{selectedSymbol} / USDT</span>
            <svg
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-white' : ''
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 max-h-[228px] overflow-y-auto overscroll-contain rounded-none bg-[#090d18]/98 border border-white/[0.15] shadow-[0_15px_35px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-40 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-white/[0.02] [&::-webkit-scrollbar-thumb]:bg-white/[0.2] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/[0.3] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-zinc-400 border-b border-white/[0.08] sticky top-0 bg-[#090d18] z-10 flex items-center justify-between">
                <span>Select Crypto Pair</span>
                <span className="text-[8px] text-zinc-500">Scroll for more</span>
              </div>
              {availableSymbols.map((sym) => {
                const item = getTicker(sym)
                const isSelected = sym === selectedSymbol
                const isItemPos = item.change24h >= 0
                const itemDecimals = ['DOGE', 'ADA', 'SUI'].includes(sym) ? 4 : 2

                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      setSelectedSymbol(sym)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white/[0.1] text-white'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AssetIcon symbol={sym} size="xs" />
                      <div className="text-left">
                        <span className="font-mono font-bold block leading-tight">{sym} / USDT</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{item.name}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-bold block leading-tight text-white">
                        ${item.price.toLocaleString('en-US', { minimumFractionDigits: itemDecimals, maximumFractionDigits: itemDecimals })}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          isItemPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isItemPos ? '▲ +' : '▼ '}
                        {Math.abs(item.change24h).toFixed(2)}%
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AssetIcon symbol={activeTicker.symbol} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight font-mono">
                {activeTicker.symbol} / USDT
              </span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-white/[0.05] text-zinc-300 border border-white/[0.1] rounded-none">
                Spot
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 font-mono">
                {activeTicker.name} Live Feed
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            </div>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold font-mono ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span>{isPositive ? '▲ +' : '▼ '}</span>
            <span>{Math.abs(activeTicker.change24h).toFixed(2)}% Today</span>
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div
          className={`text-2xl sm:text-3xl font-black font-mono tracking-tight transition-colors duration-75 ${
            priceFlash === 'up'
              ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]'
              : priceFlash === 'down'
              ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              : 'text-white'
          }`}
        >
          ${activeTicker.price.toLocaleString('en-US', { minimumFractionDigits: formatDecimals, maximumFractionDigits: formatDecimals })}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
          <span className="flex items-center gap-1">
            <span className="text-zinc-400">Delta:</span>
            <span className={isPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {activeTicker.changeDollar >= 0
                ? `+$${activeTicker.changeDollar.toLocaleString('en-US', { minimumFractionDigits: formatDecimals, maximumFractionDigits: formatDecimals })}`
                : `-$${Math.abs(activeTicker.changeDollar).toLocaleString('en-US', { minimumFractionDigits: formatDecimals, maximumFractionDigits: formatDecimals })}`}
            </span>
          </span>
          <span className="text-[11px] text-zinc-400">
            {activeTicker.changePips >= 0
              ? `+${activeTicker.changePips.toLocaleString()}`
              : `-${Math.abs(activeTicker.changePips).toLocaleString()}`}{' '}
            pips
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06] text-[11px] font-mono">
        <div className="py-1">
          <span className="text-zinc-400 block text-[10px]">Daily High</span>
          <span className="font-bold text-white">
            ${activeTicker.high24h.toLocaleString('en-US', { minimumFractionDigits: formatDecimals, maximumFractionDigits: formatDecimals })}
          </span>
        </div>
        <div className="py-1">
          <span className="text-zinc-400 block text-[10px]">Daily Low</span>
          <span className="font-bold text-white">
            ${activeTicker.low24h.toLocaleString('en-US', { minimumFractionDigits: formatDecimals, maximumFractionDigits: formatDecimals })}
          </span>
        </div>
      </div>

      <div className="pt-1 space-y-1">
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
          <span>24h Range</span>
          <span>
            ${activeTicker.low24h.toLocaleString('en-US', { maximumFractionDigits: formatDecimals })} — ${activeTicker.high24h.toLocaleString('en-US', { maximumFractionDigits: formatDecimals })}
          </span>
        </div>
        <div className="w-full h-1 bg-white/[0.05] rounded-none overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 ${
              isPositive ? 'bg-emerald-400/80' : 'bg-rose-400/80'
            }`}
            style={{ width: `${rangePct}%` }}
          />
        </div>
      </div>
    </GlassCard>
  )
}
