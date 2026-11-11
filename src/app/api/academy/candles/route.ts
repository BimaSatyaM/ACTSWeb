import { NextRequest, NextResponse } from 'next/server'
import { binanceSecureFetch } from '@/lib/binance'
import bundledCandlesData from '@/data/academy/bundled_candles.json'
import { CandleApiResponse, CandleData, CandleDataSource } from '@/types/academy'

interface CachedEntry {
  timestamp: number
  data: CandleApiResponse
}

// In-memory 60s cache to minimize exchange rate limits and optimize response times
const MEMORY_CACHE = new Map<string, CachedEntry>()
const CACHE_TTL_MS = 60_000 // 60 seconds

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawSymbol = searchParams.get('symbol') || 'BTC'
  const interval = searchParams.get('interval') || searchParams.get('timeframe') || '15m'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '200', 10), 10), 1000)

  // Normalize pair symbol (e.g., BTC -> BTCUSDT, BTCUSDT -> BTCUSDT)
  const baseSymbol = rawSymbol.toUpperCase().replace(/USDT$/, '')
  const pair = `${baseSymbol}USDT`

  const cacheKey = `${pair}:${interval}:${limit}`
  const cached = MEMORY_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  }

  // --- Tier 1: Binance USDⓈ-M Futures via DoH / Whitelisted Proxy ---
  try {
    const futuresUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${pair}&interval=${interval}&limit=${limit}`
    const res = await binanceSecureFetch(futuresUrl)
    if (res.ok) {
      const raw = await res.json()
      if (Array.isArray(raw) && raw.length > 0) {
        const candles: CandleData[] = raw.map((k: any) => ({
          time: Math.floor(k[0] / 1000), // ms -> sec
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        }))

        const payload: CandleApiResponse = {
          success: true,
          symbol: pair,
          interval,
          dataSource: 'BINANCE_FUTURES' as CandleDataSource,
          isFallback: false,
          candles,
          timestamp: new Date().toISOString(),
        }

        MEMORY_CACHE.set(cacheKey, { timestamp: Date.now(), data: payload })
        return NextResponse.json(payload, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        })
      }
    }
  } catch (err) {
    console.warn(`[Academy Candles API] Tier 1 Binance Futures unavailable for ${pair}:`, err)
  }

  // --- Tier 2: Binance Spot API ---
  try {
    const spotUrl = `https://data-api.binance.vision/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`
    const spotRes = await binanceSecureFetch(spotUrl)
    if (spotRes.ok) {
      const raw = await spotRes.json()
      if (Array.isArray(raw) && raw.length > 0) {
        const candles: CandleData[] = raw.map((k: any) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        }))

        const payload: CandleApiResponse = {
          success: true,
          symbol: pair,
          interval,
          dataSource: 'BINANCE_SPOT' as CandleDataSource,
          isFallback: false,
          candles,
          timestamp: new Date().toISOString(),
        }

        MEMORY_CACHE.set(cacheKey, { timestamp: Date.now(), data: payload })
        return NextResponse.json(payload, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        })
      }
    }
  } catch (err) {
    console.warn(`[Academy Candles API] Tier 2 Binance Spot unavailable for ${pair}:`, err)
  }

  // --- Tier 3: Bundled Historical Fallback JSON ---
  const bundled = bundledCandlesData as Record<string, CandleData[]>
  const fallbackKey = `${baseSymbol}_${interval}`
  const fallbackList: CandleData[] =
    bundled[fallbackKey] ||
    bundled[`${pair}_${interval}`] ||
    bundled['BTC_15m'] ||
    []

  const candles = fallbackList.slice(-limit)

  const fallbackPayload: CandleApiResponse = {
    success: true,
    symbol: pair,
    interval,
    dataSource: 'BUNDLED_FALLBACK' as CandleDataSource,
    isFallback: true,
    candles,
    timestamp: new Date().toISOString(),
  }

  // Cache fallback briefly (15s) so recovering network switches back to live quickly
  MEMORY_CACHE.set(cacheKey, { timestamp: Date.now(), data: fallbackPayload })

  return NextResponse.json(fallbackPayload, {
    headers: {
      'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
    },
  })
}
