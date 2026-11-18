'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { Market3DGlobe } from './Market3DGlobe'
import { Skeleton } from '@/components/ui/Skeleton'
import { AssetIcon } from '@/components/ui/AssetIcon'

type PairKey = 'BTC' | 'ETH' | 'SOL' | 'BNB' | 'XRP' | 'LINK' | 'AVAX' | 'SUI'

interface TickerItem {
  symbol: string
  name: string
  price: number
  change24h: number
  high24h: number
  low24h: number
  volume24h: number
}

const PAIR_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB',
  XRP: 'XRP',
  LINK: 'Chainlink',
  AVAX: 'Avalanche',
  SUI: 'Sui',
}

const jsonFetcher = (url: string) => fetch(url).then((r) => r.json())

const supabaseFetcher = (url: string) => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const headers: HeadersInit = {}
  if (anonKey) {
    headers['apikey'] = anonKey
    headers['Authorization'] = `Bearer ${anonKey}`
  }
  return fetch(url, { headers }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })
}

function formatPrice(value: number, symbol: string): string {
  const isFractional = ['DOGE', 'ADA', 'SUI', 'XRP'].includes(symbol)
  const decimals = isFractional ? 4 : 2
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatCompactVol(vol: number): string {
  if (!vol || vol <= 0) return '—'
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  return `$${vol.toLocaleString('en-US')}`
}

export function LiveMarket3DCard() {
  const [selectedPair, setSelectedPair] = useState<PairKey>('BTC')
  const [wsPrice, setWsPrice] = useState<number | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [pricePulse, setPricePulse] = useState<'up' | 'down' | null>(null)

  // Whole-card hover follow state (integer/clamped to keep text razor-sharp)
  const cardRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef({ rx: 0, ry: 0, tx: 0, ty: 0, active: false })
  const currentRef = useRef({ rx: 0, ry: 0, tx: 0, ty: 0 })
  const [reducedMotion, setReducedMotion] = useState(false)

  const prevPriceRef = useRef<number | null>(null)
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Smooth pointer-follow loop for the entire card box (no text-blurring scale/translateZ)
  useEffect(() => {
    if (reducedMotion) return
    let rafId = 0

    const tick = () => {
      const t = targetRef.current
      const c = currentRef.current
      const ease = 0.14

      c.rx += (t.rx - c.rx) * ease
      c.ry += (t.ry - c.ry) * ease
      c.tx += (t.tx - c.tx) * ease
      c.ty += (t.ty - c.ty) * ease

      if (cardRef.current) {
        const isIdle =
          !t.active &&
          Math.abs(c.rx) < 0.02 &&
          Math.abs(c.ry) < 0.02 &&
          Math.abs(c.tx) < 0.05 &&
          Math.abs(c.ty) < 0.05

        if (isIdle) {
          cardRef.current.style.transform = ''
        } else {
          cardRef.current.style.transform = `perspective(1200px) translate3d(${c.tx.toFixed(1)}px, ${c.ty.toFixed(1)}px, 0) rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg)`
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [reducedMotion])

  const handleCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    targetRef.current = {
      ry: (x - 0.5) * 10,
      rx: (0.5 - y) * 8,
      tx: (x - 0.5) * 10,
      ty: (y - 0.5) * 8,
      active: true,
    }
  }

  const handleCardPointerLeave = () => {
    targetRef.current = { rx: 0, ry: 0, tx: 0, ty: 0, active: false }
  }

  // 1. Live Futures Perpetual Tickers
  const { data: marketData } = useSWR<{ tickers: TickerItem[] }>(
    '/api/market-prices',
    jsonFetcher,
    { refreshInterval: 5000, revalidateOnFocus: true }
  )

  // 2. Live Engine Status + Signal & Watchlist Track Win Rates
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const { data: statusData } = useSWR(
    supabaseUrl ? `${supabaseUrl}/functions/v1/get-status` : null,
    supabaseFetcher,
    { refreshInterval: 15000 }
  )
  const { data: signalPerf } = useSWR<{
    metrics?: { total_trades: number; wins: number; losses: number; win_rate: number }
  }>(
    supabaseUrl ? `${supabaseUrl}/functions/v1/get-performance?timeframe=1M&epoch=live&tier=signal` : null,
    supabaseFetcher,
    { refreshInterval: 60000 }
  )
  const { data: watchlistPerf } = useSWR<{
    metrics?: { total_trades: number; wins: number; losses: number; win_rate: number }
  }>(
    supabaseUrl ? `${supabaseUrl}/functions/v1/get-performance?timeframe=1M&epoch=live&tier=watchlist` : null,
    supabaseFetcher,
    { refreshInterval: 60000 }
  )

  // Reset WS tick when pair changes
  useEffect(() => {
    setWsPrice(null)
    setWsConnected(false)
    prevPriceRef.current = null
  }, [selectedPair])

  // 3. Sub-second WebSocket live trade stream
  useEffect(() => {
    let ws: WebSocket | null = null
    let disposed = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let endpointIdx = 0

    const streamPair = `${selectedPair.toLowerCase()}usdt`
    const isFractional = ['DOGE', 'ADA', 'SUI', 'XRP'].includes(selectedPair)
    const endpoints = [
      `wss://fstream.binance.com/ws/${streamPair}@aggTrade`,
      `wss://data-stream.binance.vision/ws/${streamPair}@aggTrade`,
    ]

    const connect = () => {
      if (disposed) return
      try {
        ws = new WebSocket(endpoints[endpointIdx % endpoints.length])
        ws.onopen = () => {
          if (!disposed) setWsConnected(true)
        }
        ws.onmessage = (ev) => {
          if (disposed) return
          try {
            const msg = JSON.parse(ev.data)
            if (msg?.p) {
              const nextPrice = parseFloat(parseFloat(msg.p).toFixed(isFractional ? 4 : 2))
              if (prevPriceRef.current !== null && nextPrice !== prevPriceRef.current) {
                setPricePulse(nextPrice > prevPriceRef.current ? 'up' : 'down')
                if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
                pulseTimeoutRef.current = setTimeout(() => setPricePulse(null), 260)
              }
              prevPriceRef.current = nextPrice
              setWsPrice(nextPrice)
            }
          } catch {
            // ignore malformed tick
          }
        }
        ws.onerror = () => {
          endpointIdx += 1
          ws?.close()
        }
        ws.onclose = () => {
          if (!disposed) {
            setWsConnected(false)
            endpointIdx += 1
            retryTimer = setTimeout(connect, 2500)
          }
        }
      } catch {
        endpointIdx += 1
        retryTimer = setTimeout(connect, 2500)
      }
    }

    connect()

    return () => {
      disposed = true
      if (retryTimer) clearTimeout(retryTimer)
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
      ws?.close()
    }
  }, [selectedPair])

  const allTickers = useMemo(() => marketData?.tickers || [], [marketData])
  const ticker = allTickers.find((t) => t.symbol === selectedPair)
  const displayPrice = wsPrice ?? ticker?.price ?? null
  const change24h = ticker?.change24h ?? null
  const isUp = change24h !== null ? change24h >= 0 : true
  const pairDisplayName = PAIR_NAMES[selectedPair] || selectedPair

  const activeRegime =
    statusData?.current_regimes?.[0]?.replace(/_/g, ' ') || 'Scanning Regimes'

  const sigMetrics = signalPerf?.metrics
  const watchMetrics = watchlistPerf?.metrics

  return (
    <div
      ref={cardRef}
      onPointerMove={handleCardPointerMove}
      onPointerLeave={handleCardPointerLeave}
      className="rounded-2xl border border-slate-900/12 hover:border-[#0369a1]/35 bg-[#faf2df] p-6 space-y-4 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.12)] hover:shadow-[0_22px_44px_-16px_rgba(3,105,161,0.18)] transition-[border-color,box-shadow] duration-200 will-change-transform"
    >
      {/* Live Price + 24h Change */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AssetIcon symbol={selectedPair} size="md" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                {pairDisplayName} Live Perpetual ({selectedPair}/USDT)
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 uppercase tracking-wider">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    wsConnected ? 'bg-emerald-600 animate-pulse' : 'bg-[#0369a1]'
                  }`}
                />
                <span>{wsConnected ? 'LIVE' : 'PERP'}</span>
              </span>
            </div>
            <div
              className={`font-mono font-black text-3xl tracking-tight tabular-nums transition-colors duration-150 ${
                pricePulse === 'up'
                  ? 'text-emerald-700'
                  : pricePulse === 'down'
                  ? 'text-rose-700'
                  : 'text-slate-950'
              }`}
            >
              {displayPrice !== null ? (
                `$${formatPrice(displayPrice, selectedPair)}`
              ) : (
                <Skeleton className="h-8 w-40 mt-0.5" />
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            24h Change
          </div>
          <div
            className={`font-mono font-bold text-lg tabular-nums ${
              change24h === null
                ? 'text-slate-500'
                : isUp
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}
          >
            {change24h !== null
              ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`
              : '—'}
          </div>
        </div>
      </div>

      {/* Interactive 3D Market Sphere & Orbiting Assets */}
      <Market3DGlobe
        tickers={allTickers}
        selectedSymbol={selectedPair}
        onSelectSymbol={(sym) => setSelectedPair(sym as PairKey)}
      />

      {/* Real 24h Market Stats */}
      <div className="grid grid-cols-3 gap-4 border-t border-slate-900/10 pt-4 font-mono">
        <div>
          <div className="text-[10px] text-slate-500 uppercase">24h Vol</div>
          <div className="text-xs font-bold text-slate-950 tabular-nums mt-0.5">
            {ticker ? formatCompactVol(ticker.volume24h) : '—'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">24h High</div>
          <div className="text-xs font-bold text-slate-950 tabular-nums mt-0.5">
            {ticker ? `$${formatPrice(ticker.high24h, selectedPair)}` : '—'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">24h Low</div>
          <div className="text-xs font-bold text-slate-950 tabular-nums mt-0.5">
            {ticker ? `$${formatPrice(ticker.low24h, selectedPair)}` : '—'}
          </div>
        </div>
      </div>

      {/* System Track Win Rate (Signal & Watchlist) */}
      <div className="grid grid-cols-3 gap-4 border-t border-slate-900/10 pt-4 font-mono">
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Signal Win Rate</div>
          <div className="text-xs font-bold text-emerald-700 tabular-nums mt-0.5">
            {sigMetrics ? `${sigMetrics.win_rate.toFixed(1)}%` : '—'}
            {sigMetrics && (
              <span className="text-[10px] font-normal text-slate-500 ml-1">
                ({sigMetrics.wins}W/{sigMetrics.losses}L)
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Watchlist Win Rate</div>
          <div className="text-xs font-bold text-[#0369a1] tabular-nums mt-0.5">
            {watchMetrics ? `${watchMetrics.win_rate.toFixed(1)}%` : '—'}
            {watchMetrics && (
              <span className="text-[10px] font-normal text-slate-500 ml-1">
                ({watchMetrics.wins}W/{watchMetrics.losses}L)
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Active Regime</div>
          <div className="text-xs font-bold text-slate-950 mt-0.5 truncate" title={activeRegime}>
            {activeRegime}
          </div>
        </div>
      </div>
    </div>
  )
}
