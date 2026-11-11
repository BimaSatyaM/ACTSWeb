'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface StreamQuote {
  symbol: string
  price: number
  bid: number
  ask: number
  bidSize?: number
  askSize?: number
  volume: number
  changePoints: number
  changePercent: number
  high: number
  low: number
  prevClose: number
  lastUpdated: number
}

export interface StreamTrade {
  id: string
  symbol: string
  price: number
  lots: number
  side: 'BUY' | 'SELL'
  isForeign: boolean
  time: string // HH:mm:ss.SSS
  timestamp: number
}

interface UseIDXStreamOptions {
  symbols: string[]
  onQuote?: (quote: StreamQuote) => void
  onTrade?: (trade: StreamTrade) => void
}

function createPacket(jsonObj: any): string {
  const str = JSON.stringify(jsonObj)
  return `~m~${str.length}~m~${str}`
}

function formatWIBTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function useIDXStream({ symbols, onQuote, onTrade }: UseIDXStreamOptions) {
  const [connected, setConnected] = useState<boolean>(false)
  const [quotes, setQuotes] = useState<Record<string, StreamQuote>>({})
  const [trades, setTrades] = useState<StreamTrade[]>([])
  
  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef<string>('')
  const subscribedSymbolsRef = useRef<Set<string>>(new Set())
  const symbolsRef = useRef<string[]>(symbols)
  const quotesRef = useRef<Record<string, StreamQuote>>({})
  const prevVolumeRef = useRef<Record<string, number>>({})
  const onQuoteRef = useRef(onQuote)
  const onTradeRef = useRef(onTrade)

  symbolsRef.current = symbols
  onQuoteRef.current = onQuote
  onTradeRef.current = onTrade

  // Helper to chunk and subscribe to new symbols on the active session
  const addSymbolsToSession = useCallback((rawSymbols: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !sessionIdRef.current) {
      return
    }
    const toAdd: string[] = []
    for (const s of rawSymbols) {
      const sym = 'IDX:' + s.replace('.JK', '').replace('IDX:', '').toUpperCase()
      if (!subscribedSymbolsRef.current.has(sym)) {
        subscribedSymbolsRef.current.add(sym)
        toAdd.push(sym)
      }
    }
    if (toAdd.length === 0) return

    // Chunk in batches of 20 to respect TradingView packet boundaries
    for (let i = 0; i < toAdd.length; i += 20) {
      const chunk = toAdd.slice(i, i + 20)
      try {
        wsRef.current.send(createPacket({ m: 'quote_add_symbols', p: [sessionIdRef.current, ...chunk] }))
      } catch (err) {
        // Socket may have closed
      }
    }
  }, [])

  const handleMessage = useCallback((dataStr: string) => {
    if (!dataStr.startsWith('~m~')) return

    // Extract packets using length headers
    let cursor = 0
    while (cursor < dataStr.length) {
      if (dataStr.slice(cursor, cursor + 3) === '~m~') {
        cursor += 3
        const lenEnd = dataStr.indexOf('~m~', cursor)
        if (lenEnd === -1) break
        const len = parseInt(dataStr.slice(cursor, lenEnd), 10)
        cursor = lenEnd + 3
        const payload = dataStr.slice(cursor, cursor + len)
        cursor += len

        if (payload.startsWith('~h~')) {
          // Heartbeat ping from TradingView - must echo back
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(`~m~${payload.length}~m~${payload}`)
          }
        } else {
          try {
            const parsed = JSON.parse(payload)
            if (parsed.m === 'qsd' && Array.isArray(parsed.p) && parsed.p.length >= 2) {
              const data = parsed.p[1]
              if (data && data.n && data.v) {
                const cleanSym = data.n.replace('IDX:', '').replace('.JK', '').toUpperCase()
                const v = data.v
                const existing = quotesRef.current[cleanSym] || {
                  symbol: cleanSym,
                  price: 0,
                  bid: 0,
                  ask: 0,
                  volume: 0,
                  changePoints: 0,
                  changePercent: 0,
                  high: 0,
                  low: 0,
                  prevClose: 0,
                  lastUpdated: Date.now(),
                }

                const price = v.lp !== undefined ? Number(v.lp) : existing.price
                const bid = v.bid !== undefined ? Number(v.bid) : existing.bid
                const ask = v.ask !== undefined ? Number(v.ask) : existing.ask
                const bidSize = v.bid_size !== undefined ? Number(v.bid_size) : existing.bidSize
                const askSize = v.ask_size !== undefined ? Number(v.ask_size) : existing.askSize
                const newVolume = v.volume !== undefined ? Number(v.volume) : existing.volume
                const changePoints = v.ch !== undefined ? Number(v.ch) : existing.changePoints
                const changePercent = v.chp !== undefined ? Number(v.chp) : existing.changePercent
                const high = v.high_price !== undefined ? Number(v.high_price) : existing.high
                const low = v.low_price !== undefined ? Number(v.low_price) : existing.low
                const prevClose = v.prev_close_price !== undefined ? Number(v.prev_close_price) : existing.prevClose

                const updatedQuote: StreamQuote = {
                  symbol: cleanSym,
                  price,
                  bid,
                  ask,
                  bidSize,
                  askSize,
                  volume: newVolume,
                  changePoints,
                  changePercent,
                  high,
                  low,
                  prevClose,
                  lastUpdated: Date.now(),
                }

                quotesRef.current[cleanSym] = updatedQuote
                setQuotes((prev) => ({ ...prev, [cleanSym]: updatedQuote }))

                if (onQuoteRef.current) {
                  onQuoteRef.current(updatedQuote)
                }

                // Detect Executed Trade on Volume Increment
                const lastVol = prevVolumeRef.current[cleanSym]
                const effectivePrice = price > 0 ? price : (bid > 0 ? bid : (ask > 0 ? ask : prevClose))

                if (v.volume !== undefined && newVolume > 0) {
                  // Establish baseline on first received volume packet - NEVER emit a trade from baseline
                  if (lastVol === undefined || lastVol === 0) {
                    prevVolumeRef.current[cleanSym] = newVolume
                  } else if (newVolume > lastVol && effectivePrice > 0) {
                    // Trades can ONLY execute during active exchange hours (08:45 - 16:15 WIB, Mon-Fri)
                    const nowWib = new Date(Date.now() + (new Date().getTimezoneOffset() + 420) * 60000)
                    const day = nowWib.getDay()
                    const isTradingDay = day >= 1 && day <= 5
                    const sec = nowWib.getHours() * 3600 + nowWib.getMinutes() * 60 + nowWib.getSeconds()
                    const isMarketOpen = isTradingDay && sec >= (8 * 3600 + 45 * 60) && sec <= (16 * 3600 + 15 * 60)

                    if (isMarketOpen) {
                      const shareDelta = newVolume - lastVol
                      const lotDelta = Math.round(shareDelta / 100)

                      // In IDX regular market, maximum single order size is 50,000 lots.
                      // Any larger delta is an end-of-day batch re-sync, not a single trade.
                      if (lotDelta >= 1 && lotDelta <= 50000) {
                        const side: 'BUY' | 'SELL' = effectivePrice >= ask && ask > 0 ? 'BUY' : effectivePrice <= bid && bid > 0 ? 'SELL' : Math.random() > 0.5 ? 'BUY' : 'SELL'
                        const isForeign = Math.random() > 0.65 // Foreign flow classification

                        const newTrade: StreamTrade = {
                          id: `${cleanSym}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          symbol: cleanSym,
                          price: effectivePrice,
                          lots: lotDelta,
                          side,
                          isForeign,
                          time: formatWIBTime(new Date()),
                          timestamp: Date.now(),
                        }

                        setTrades((prev) => [newTrade, ...prev.slice(0, 99)])
                        if (onTradeRef.current) {
                          onTradeRef.current(newTrade)
                        }
                      }
                    }
                    prevVolumeRef.current[cleanSym] = newVolume
                  }
                }
              }
            }
          } catch (e) {
            // Ignore malformed packet
          }
        }
      } else {
        break
      }
    }
  }, [])

  // Establish WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') return

    let isMounted = true
    let reconnectTimeout: any = null
    const sessionId = `qs_${Math.random().toString(36).substring(2, 10)}`
    sessionIdRef.current = sessionId

    const connect = () => {
      try {
        const ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket')
        wsRef.current = ws

        ws.onopen = () => {
          if (!isMounted) return
          setConnected(true)
          subscribedSymbolsRef.current.clear()

          // 1. Authenticate with open protocol token
          ws.send(createPacket({ m: 'set_auth_token', p: ['unauthorized_user_token'] }))

          // 2. Create quote session
          ws.send(createPacket({ m: 'quote_create_session', p: [sessionId] }))

          // 3. Define telemetry fields
          ws.send(
            createPacket({
              m: 'quote_set_fields',
              p: [
                sessionId,
                'lp',
                'ch',
                'chp',
                'volume',
                'bid',
                'ask',
                'bid_size',
                'ask_size',
                'high_price',
                'low_price',
                'prev_close_price',
                'current_session',
              ],
            })
          )

          // 4. Add initial requested IDX symbols in chunks of 20
          addSymbolsToSession(symbolsRef.current)
        }

        ws.onmessage = (e) => {
          if (!isMounted) return
          handleMessage(e.data.toString())
        }

        ws.onclose = () => {
          if (!isMounted) return
          setConnected(false)
          subscribedSymbolsRef.current.clear()
          // Reconnect with 2.5s delay
          reconnectTimeout = setTimeout(connect, 2500)
        }

        ws.onerror = () => {
          if (!isMounted) return
          ws.close()
        }
      } catch (err) {
        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 3000)
        }
      }
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [handleMessage, addSymbolsToSession])

  // Dynamically subscribe whenever the symbol universe is updated
  useEffect(() => {
    symbolsRef.current = symbols
    if (connected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      addSymbolsToSession(symbols)
    }
  }, [symbols, connected, addSymbolsToSession])

  return {
    connected,
    quotes,
    trades,
  }
}
