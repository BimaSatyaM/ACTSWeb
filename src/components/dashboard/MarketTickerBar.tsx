'use client'

import React from 'react'
import useSWR from 'swr'

interface TickerItem {
  symbol: string
  name: string
  price: number
  change24h: number
  category: 'crypto' | 'macro' | 'forex'
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const DEFAULT_TICKERS: TickerItem[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 68450.0, change24h: 3.41, category: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: 2640.5, change24h: 2.15, category: 'crypto' },
  { symbol: 'SOL', name: 'Solana', price: 148.2, change24h: 4.82, category: 'crypto' },
  { symbol: 'BNB', name: 'BNB', price: 586.3, change24h: 1.1, category: 'crypto' },
  { symbol: 'XAUUSD', name: 'Gold', price: 2512.4, change24h: 0.65, category: 'forex' },
  { symbol: 'SPX', name: 'S&P 500', price: 5620.8, change24h: 0.84, category: 'macro' },
  { symbol: 'NDX', name: 'Nasdaq', price: 19740.2, change24h: 1.12, category: 'macro' },
  { symbol: 'DJI', name: 'Dow Jones', price: 40850.0, change24h: 0.31, category: 'macro' },
  { symbol: 'VIX', name: 'Volatility', price: 15.2, change24h: -2.18, category: 'macro' },
]

export function MarketTickerBar({ className = '' }: { className?: string }) {
  const [livePrices, setLivePrices] = React.useState<Record<string, { price: number; change24h: number }>>({})
  const [flashSymbols, setFlashSymbols] = React.useState<Record<string, 'up' | 'down'>>({})
  const prevPricesRef = React.useRef<Record<string, number>>({})

  const { data } = useSWR<{ tickers: TickerItem[] }>('/api/market-prices', fetcher, {
    refreshInterval: 1000,
    revalidateOnFocus: true,
  })

  // Live WebSocket streaming for Crypto Binance Futures USDⓈ-M (@aggTrade + @ticker)
  React.useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout
    let endpointIdx = 0
    const streams = 'btcusdt@trade/btcusdt@aggTrade/ethusdt@trade/ethusdt@aggTrade/solusdt@trade/solusdt@aggTrade/bnbusdt@trade/bnbusdt@aggTrade/btcusdt@ticker/ethusdt@ticker/solusdt@ticker/bnbusdt@ticker'
    const endpoints = [
      `wss://fstream.binance.com/ws/${streams}`,
      `wss://fstream-auth.binance.com/ws/${streams}`,
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
            const msg = JSON.parse(event.data)
            
            // Sub-second millisecond trade tick (@trade or @aggTrade)
            if (msg.e === 'aggTrade' || msg.e === 'trade') {
              const sym = msg.s === 'BTCUSDT' ? 'BTC' : msg.s === 'ETHUSDT' ? 'ETH' : msg.s === 'SOLUSDT' ? 'SOL' : msg.s === 'BNBUSDT' ? 'BNB' : null
              if (sym) {
                const livePrice = parseFloat(parseFloat(msg.p).toFixed(2))

                // Price flash animation
                const prev = prevPricesRef.current[sym]
                if (prev !== undefined && prev !== livePrice) {
                  const dir = livePrice > prev ? 'up' : 'down'
                  setFlashSymbols((f) => ({ ...f, [sym]: dir }))
                  setTimeout(() => {
                    setFlashSymbols((f) => {
                      const next = { ...f }
                      delete next[sym]
                      return next
                    })
                  }, 180)
                }
                prevPricesRef.current[sym] = livePrice

                setLivePrices((curr) => ({
                  ...curr,
                  [sym]: {
                    price: livePrice,
                    change24h: curr[sym]?.change24h ?? 0,
                  },
                }))
              }
            }

            // 24hr Ticker update (keep latest real-time trade price)
            if (msg.e === '24hrTicker') {
              const sym = msg.s === 'BTCUSDT' ? 'BTC' : msg.s === 'ETHUSDT' ? 'ETH' : msg.s === 'SOLUSDT' ? 'SOL' : msg.s === 'BNBUSDT' ? 'BNB' : null
              if (sym) {
                setLivePrices((curr) => ({
                  ...curr,
                  [sym]: {
                    price: curr[sym]?.price ?? parseFloat(parseFloat(msg.c).toFixed(2)),
                    change24h: parseFloat(parseFloat(msg.P).toFixed(2)),
                  },
                }))
              }
            }
          } catch {}
        }
        ws.onerror = () => {
          endpointIdx++
          setLivePrices({})
          ws?.close()
        }
        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000)
        }
      } catch {
        endpointIdx++
        setLivePrices({})
        reconnectTimeout = setTimeout(connectWs, 3000)
      }
    }

    connectWs()
    return () => {
      clearTimeout(reconnectTimeout)
      if (ws) {
        ws.onclose = null
        ws.onerror = null
        try {
          ws.close()
        } catch {}
      }
    }
  }, [])

  const baseTickers = data?.tickers && data.tickers.length > 0 ? data.tickers : DEFAULT_TICKERS
  const tickers = baseTickers.map((t) => {
    const live = livePrices[t.symbol]
    if (live && Math.abs(live.price - t.price) / (t.price || 1) <= 0.005) {
      return {
        ...t,
        price: live.price,
        change24h: live.change24h,
      }
    }
    return t
  })

  // Format price helper
  const formatPrice = (price: number, symbol: string) => {
    if (symbol === 'BTC' || symbol === 'ETH' || symbol === 'XAUUSD' || symbol === 'SPX' || symbol === 'NDX' || symbol === 'DJI') {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return price < 10 ? price.toFixed(3) : price.toFixed(2)
  }

  return (
    <div className={`flex items-center bg-[#090d18]/90 border border-white/[0.08] rounded-xl h-8 overflow-hidden select-none shadow-sm ${className}`}>
      <div className="bg-accent-theme text-white font-black text-[10px] tracking-wider uppercase px-3 h-full flex items-center justify-center flex-shrink-0 z-10 shadow-md whitespace-nowrap gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span>MARKET LIVE</span>
      </div>

      <div className="overflow-hidden relative flex-1 h-full flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#090d18] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#090d18] to-transparent z-10 pointer-events-none" />

        <div className="animate-ticker-slide flex items-center whitespace-nowrap pl-4">
          {[...tickers, ...tickers].map((item, idx) => {
            const isPositive = item.change24h >= 0
            const flash = flashSymbols[item.symbol]
            return (
              <div key={`${item.symbol}-${idx}`} className="inline-flex items-center">
                <div className="inline-flex items-center text-xs font-mono mx-4">
                  <span className="text-zinc-400 font-semibold mr-1.5 text-[11px]">
                    {item.category === 'crypto' ? `${item.symbol} Perp` : item.symbol}
                  </span>
                  <span
                    className={`font-bold mr-1.5 text-[11px] transition-colors duration-75 ${
                      flash === 'up'
                        ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                        : flash === 'down'
                        ? 'text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                        : 'text-white'
                    }`}
                  >
                    ${formatPrice(item.price, item.symbol)}
                  </span>
                  <span
                    className={`text-[10.5px] font-bold flex items-center ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? `+${item.change24h.toFixed(2)}%` : `${item.change24h.toFixed(2)}%`}
                  </span>
                </div>
                <div className="w-[1px] h-3.5 bg-white/[0.15]" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
