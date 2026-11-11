import { NextResponse } from 'next/server'
import { binanceSecureFetch } from '@/lib/binance'

export interface TickerItem {
  symbol: string
  name: string
  price: number
  change24h: number
  changeDollar: number
  changePips: number
  high24h: number
  low24h: number
  volume24h: number
  category: 'crypto' | 'macro' | 'forex'
}

// Fallback baseline prices
const DEFAULT_TICKERS: TickerItem[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 71704.0,
    change24h: 8.85,
    changeDollar: 5830.0,
    changePips: 5830,
    high24h: 72490.0,
    low24h: 65892.0,
    volume24h: 3193895000,
    category: 'crypto',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2278.5,
    change24h: 15.35,
    changeDollar: 303.0,
    changePips: 303,
    high24h: 2333.65,
    low24h: 1961.86,
    volume24h: 2298548000,
    category: 'crypto',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 86.5,
    change24h: 7.25,
    changeDollar: 5.85,
    changePips: 58,
    high24h: 88.1,
    low24h: 80.64,
    volume24h: 441636000,
    category: 'crypto',
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    price: 641.5,
    change24h: 5.37,
    changeDollar: 32.68,
    changePips: 326,
    high24h: 649.0,
    low24h: 608.52,
    volume24h: 230737000,
    category: 'crypto',
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    price: 1.41,
    change24h: 2.15,
    changeDollar: 0.03,
    changePips: 3,
    high24h: 1.46,
    low24h: 1.38,
    volume24h: 185000000,
    category: 'crypto',
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.091,
    change24h: -1.24,
    changeDollar: -0.001,
    changePips: 1,
    high24h: 0.094,
    low24h: 0.089,
    volume24h: 98000000,
    category: 'crypto',
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.218,
    change24h: 1.05,
    changeDollar: 0.002,
    changePips: 2,
    high24h: 0.225,
    low24h: 0.212,
    volume24h: 45000000,
    category: 'crypto',
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 7.62,
    change24h: 2.84,
    changeDollar: 0.21,
    changePips: 21,
    high24h: 7.85,
    low24h: 7.42,
    volume24h: 32000000,
    category: 'crypto',
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    price: 12.17,
    change24h: 3.12,
    changeDollar: 0.37,
    changePips: 37,
    high24h: 12.45,
    low24h: 11.85,
    volume24h: 64000000,
    category: 'crypto',
  },
  {
    symbol: 'SUI',
    name: 'Sui',
    price: 0.792,
    change24h: 4.55,
    changeDollar: 0.035,
    changePips: 35,
    high24h: 0.825,
    low24h: 0.765,
    volume24h: 41000000,
    category: 'crypto',
  },
  {
    symbol: 'XAUUSD',
    name: 'Gold',
    price: 2512.4,
    change24h: 0.65,
    changeDollar: 16.2,
    changePips: 162,
    high24h: 2520.0,
    low24h: 2492.0,
    volume24h: 0,
    category: 'forex',
  },
  {
    symbol: 'SPX',
    name: 'S&P 500',
    price: 5620.8,
    change24h: 0.84,
    changeDollar: 46.8,
    changePips: 468,
    high24h: 5635.0,
    low24h: 5570.0,
    volume24h: 0,
    category: 'macro',
  },
  {
    symbol: 'NDX',
    name: 'Nasdaq',
    price: 19740.2,
    change24h: 1.12,
    changeDollar: 218.4,
    changePips: 2184,
    high24h: 19800.0,
    low24h: 19500.0,
    volume24h: 0,
    category: 'macro',
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones',
    price: 40850.0,
    change24h: 0.31,
    changeDollar: 126.0,
    changePips: 1260,
    high24h: 40920.0,
    low24h: 40680.0,
    volume24h: 0,
    category: 'macro',
  },
  {
    symbol: 'VIX',
    name: 'Volatility',
    price: 15.2,
    change24h: -2.18,
    changeDollar: -0.34,
    changePips: 34,
    high24h: 16.1,
    low24h: 14.9,
    volume24h: 0,
    category: 'macro',
  },
]

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // 1. Primary: Binance USDⓈ-M Futures Perpetual Tickers via DoH (matching ACTS engine & auto-trading)
  try {
    const futuresRes = await binanceSecureFetch('https://fapi.binance.com/fapi/v1/ticker/24hr')
    if (futuresRes.ok) {
      const data: any[] = await futuresRes.json()
      if (Array.isArray(data) && data.length > 0) {
        const parseFutures = (symbol: string, name: string, fallbackIndex: number): TickerItem => {
          const item = data.find((i) => i.symbol === `${symbol}USDT`)
          const fallback = DEFAULT_TICKERS[fallbackIndex]
          if (!item) return fallback
          const isFractional = symbol === 'DOGE' || symbol === 'ADA' || symbol === 'SUI'
          const price = parseFloat(parseFloat(item.lastPrice).toFixed(isFractional ? 4 : 2))
          const changeDollar = parseFloat(parseFloat(item.priceChange).toFixed(isFractional ? 4 : 2))
          const change24h = parseFloat(parseFloat(item.priceChangePercent).toFixed(2))
          const changePips = Math.round(Math.abs(changeDollar * (isFractional ? 1000 : 1)))
          const high24h = parseFloat(parseFloat(item.highPrice).toFixed(isFractional ? 4 : 2))
          const low24h = parseFloat(parseFloat(item.lowPrice).toFixed(isFractional ? 4 : 2))
          const volume24h = parseFloat(parseFloat(item.quoteVolume || "0").toFixed(0))

          return {
            symbol,
            name,
            price,
            change24h,
            changeDollar,
            changePips,
            high24h,
            low24h,
            volume24h,
            category: 'crypto',
          }
        }

        const tickers: TickerItem[] = [
          parseFutures('BTC', 'Bitcoin', 0),
          parseFutures('ETH', 'Ethereum', 1),
          parseFutures('SOL', 'Solana', 2),
          parseFutures('BNB', 'BNB', 3),
          parseFutures('XRP', 'XRP', 4),
          parseFutures('DOGE', 'Dogecoin', 5),
          parseFutures('ADA', 'Cardano', 6),
          parseFutures('AVAX', 'Avalanche', 7),
          parseFutures('LINK', 'Chainlink', 8),
          parseFutures('SUI', 'Sui', 9),
          DEFAULT_TICKERS[10], // XAUUSD
          DEFAULT_TICKERS[11], // SPX
          DEFAULT_TICKERS[12], // NDX
          DEFAULT_TICKERS[13], // DJI
          DEFAULT_TICKERS[14], // VIX
        ]

        return NextResponse.json(
          { tickers, timestamp: new Date().toISOString(), marketType: 'FUTURES_PERP' },
          {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        )
      }
    }
  } catch (err) {
    console.warn('Binance Futures ticker fetch warning, trying Spot fallback:', err)
  }

  // 2. Secondary Fallback: Direct Binance Spot Public Data API
  try {
    const binanceRes = await fetch(
      'https://data-api.binance.vision/api/v3/ticker/tradingDay?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22,%22BNBUSDT%22,%22XRPUSDT%22,%22DOGEUSDT%22,%22ADAUSDT%22,%22AVAXUSDT%22,%22LINKUSDT%22,%22SUIUSDT%22%5D',
      {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }
    )

    if (binanceRes.ok) {
      const data: any[] = await binanceRes.json()

      const parseBinance = (symbol: string, name: string, fallbackIndex: number): TickerItem => {
        const item = data.find((i) => i.symbol === `${symbol}USDT`)
        const fallback = DEFAULT_TICKERS[fallbackIndex]
        if (!item) return fallback
        const price = parseFloat(parseFloat(item.lastPrice).toFixed(symbol === 'DOGE' || symbol === 'ADA' || symbol === 'SUI' ? 4 : 2))
        const changeDollar = parseFloat(parseFloat(item.priceChange).toFixed(symbol === 'DOGE' || symbol === 'ADA' || symbol === 'SUI' ? 4 : 2))
        const change24h = parseFloat(parseFloat(item.priceChangePercent).toFixed(2))
        const changePips = Math.round(Math.abs(changeDollar * (symbol === 'DOGE' || symbol === 'ADA' || symbol === 'SUI' ? 1000 : 1)))
        const high24h = parseFloat(parseFloat(item.highPrice).toFixed(symbol === 'DOGE' || symbol === 'ADA' || symbol === 'SUI' ? 4 : 2))
        const low24h = parseFloat(parseFloat(item.lowPrice).toFixed(symbol === 'DOGE' || symbol === 'ADA' || symbol === 'SUI' ? 4 : 2))
        const volume24h = parseFloat(parseFloat(item.quoteVolume || "0").toFixed(0))

        return {
          symbol,
          name,
          price,
          change24h,
          changeDollar,
          changePips,
          high24h,
          low24h,
          volume24h,
          category: 'crypto',
        }
      }

      const tickers: TickerItem[] = [
        parseBinance('BTC', 'Bitcoin', 0),
        parseBinance('ETH', 'Ethereum', 1),
        parseBinance('SOL', 'Solana', 2),
        parseBinance('BNB', 'BNB', 3),
        parseBinance('XRP', 'XRP', 4),
        parseBinance('DOGE', 'Dogecoin', 5),
        parseBinance('ADA', 'Cardano', 6),
        parseBinance('AVAX', 'Avalanche', 7),
        parseBinance('LINK', 'Chainlink', 8),
        parseBinance('SUI', 'Sui', 9),
        DEFAULT_TICKERS[10], // XAUUSD
        DEFAULT_TICKERS[11], // SPX
        DEFAULT_TICKERS[12], // NDX
        DEFAULT_TICKERS[13], // DJI
        DEFAULT_TICKERS[14], // VIX
      ]

      return NextResponse.json(
        { tickers, timestamp: new Date().toISOString(), marketType: 'SPOT' },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      )
    }
  } catch (err) {
    console.error('Binance direct fetch error, trying CoinGecko fallback:', err)
  }

  // 2. Secondary Fallback: CoinGecko API
  try {
    const cgRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true',
      {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }
    )

    if (cgRes.ok) {
      const data = await cgRes.json()
      const computeMetrics = (usdPrice?: number, pctChange?: number, vol?: number, defaultFallback?: TickerItem): TickerItem => {
        if (!usdPrice || pctChange === undefined) return defaultFallback || DEFAULT_TICKERS[0]
        const prevPrice = usdPrice / (1 + pctChange / 100)
        const changeDollar = parseFloat((usdPrice - prevPrice).toFixed(2))
        const changePips = Math.round(Math.abs(changeDollar))
        const high24h = parseFloat((Math.max(usdPrice, prevPrice) * 1.008).toFixed(2))
        const low24h = parseFloat((Math.min(usdPrice, prevPrice) * 0.992).toFixed(2))

        return {
          symbol: defaultFallback?.symbol || 'BTC',
          name: defaultFallback?.name || 'Bitcoin',
          price: usdPrice,
          change24h: parseFloat(pctChange.toFixed(2)),
          changeDollar,
          changePips,
          high24h,
          low24h,
          volume24h: vol || 0,
          category: 'crypto',
        }
      }

      const tickers: TickerItem[] = [
        computeMetrics(data.bitcoin?.usd, data.bitcoin?.usd_24h_change, data.bitcoin?.usd_24h_vol, DEFAULT_TICKERS[0]),
        computeMetrics(data.ethereum?.usd, data.ethereum?.usd_24h_change, data.ethereum?.usd_24h_vol, DEFAULT_TICKERS[1]),
        computeMetrics(data.solana?.usd, data.solana?.usd_24h_change, data.solana?.usd_24h_vol, DEFAULT_TICKERS[2]),
        computeMetrics(data.binancecoin?.usd, data.binancecoin?.usd_24h_change, data.binancecoin?.usd_24h_vol, DEFAULT_TICKERS[3]),
        DEFAULT_TICKERS[4],
        DEFAULT_TICKERS[5],
        DEFAULT_TICKERS[6],
        DEFAULT_TICKERS[7],
        DEFAULT_TICKERS[8],
      ]

      return NextResponse.json({ tickers, timestamp: new Date().toISOString() })
    }
  } catch {
    // fallback
  }

  return NextResponse.json({ tickers: DEFAULT_TICKERS, timestamp: new Date().toISOString() })
}
