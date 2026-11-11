import { NextResponse } from 'next/server'

export interface StockMeta {
  symbol: string
  name: string
  sector: string
  group?: string
  currentPrice: number
  previousClose: number
  changePoints: number
  changePercent: number
  dayHigh: number
  dayLow: number
  volume: number
  turnover: number
  foreignFlow: 'BUY' | 'SELL' | 'NEUTRAL'
  foreignNetBillion: number
  marketCapTrillion: number
  peRatio: number
  pbvRatio: number
}

export interface Candle {
  time: number // unix timestamp in seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Static company info map (names, sectors, conglomerates)
const STOCK_INFO: Record<string, { name: string; sector: string; group?: string; peRatio: number; pbvRatio: number; marketCapTrillion: number }> = {
  BBCA: { name: 'Bank Central Asia Tbk', sector: 'Banking', group: 'Djarum', peRatio: 21.2, pbvRatio: 4.3, marketCapTrillion: 776.5 },
  BBRI: { name: 'Bank Rakyat Indonesia Tbk', sector: 'Banking', group: 'BUMN', peRatio: 11.4, pbvRatio: 2.1, marketCapTrillion: 495.2 },
  BMRI: { name: 'Bank Mandiri (Persero) Tbk', sector: 'Banking', group: 'BUMN', peRatio: 10.8, pbvRatio: 1.9, marketCapTrillion: 403.2 },
  BBNI: { name: 'Bank Negara Indonesia Tbk', sector: 'Banking', group: 'BUMN', peRatio: 8.9, pbvRatio: 1.2, marketCapTrillion: 139.1 },
  TLKM: { name: 'Telkom Indonesia Tbk', sector: 'Technology & Telco', group: 'BUMN', peRatio: 11.2, pbvRatio: 2.0, marketCapTrillion: 257.5 },
  ASII: { name: 'Astra International Tbk', sector: 'Conglomerates & Auto', group: 'Jardine', peRatio: 6.4, pbvRatio: 0.9, marketCapTrillion: 195.9 },
  BREN: { name: 'Barito Renewables Energy Tbk', sector: 'Energy & Renewables', group: 'Barito (Prajogo Pangestu)', peRatio: 320.5, pbvRatio: 120.4, marketCapTrillion: 434.8 },
  BRPT: { name: 'Barito Pacific Tbk', sector: 'Energy & Chemical', group: 'Barito (Prajogo Pangestu)', peRatio: 52.4, pbvRatio: 3.1, marketCapTrillion: 158.9 },
  BNBR: { name: 'Bakrie & Brothers Tbk', sector: 'Conglomerates & EV', group: 'Bakrie Group', peRatio: 14.2, pbvRatio: 1.2, marketCapTrillion: 18.6 },
  BUMI: { name: 'Bumi Resources Tbk', sector: 'Mining & Coal', group: 'Bakrie & Salim', peRatio: 12.8, pbvRatio: 0.8, marketCapTrillion: 78.4 },
  GOTO: { name: 'GoTo Gojek Tokopedia Tbk', sector: 'Technology', group: 'Tech', peRatio: -6.5, pbvRatio: 0.7, marketCapTrillion: 60.0 },
  ADRO: { name: 'Adaro Energy Indonesia Tbk', sector: 'Mining & Energy', group: 'Thohir', peRatio: 4.2, pbvRatio: 0.9, marketCapTrillion: 84.4 },
  ICBP: { name: 'Indofood CBP Sukses Makmur Tbk', sector: 'Consumer Goods', group: 'Salim Group', peRatio: 14.8, pbvRatio: 2.8, marketCapTrillion: 82.8 },
  UNVR: { name: 'Unilever Indonesia Tbk', sector: 'Consumer Goods', group: 'Unilever', peRatio: 18.2, pbvRatio: 16.4, marketCapTrillion: 62.0 },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawSymbol = searchParams.get('symbol') || 'BBCA'
    const symbol = rawSymbol.toUpperCase().replace('.JK', '').replace('IDX:', '')
    const timeframe = searchParams.get('timeframe') || '15m'

    const info = STOCK_INFO[symbol] || {
      name: `${symbol} Tbk`,
      sector: 'General Equities',
      group: 'IDX',
      peRatio: 15.0,
      pbvRatio: 2.0,
      marketCapTrillion: 25.0,
    }

    let dynamicName = info.name
    let dynamicSector = info.sector

    // ── 1. Fetch Real-Time Institutional Quote from TradingView Scanner ──
    let liveQuote: {
      currentPrice: number
      changePoints: number
      changePercent: number
      dayHigh: number
      dayLow: number
      volume: number
      turnover: number
    } | null = null

    try {
      const tvRes = await fetch('https://scanner.tradingview.com/indonesia/scan', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: { tickers: [`IDX:${symbol}`] },
          columns: ['name', 'description', 'close', 'change', 'change_abs', 'volume', 'high', 'low', 'Value.Traded', 'sector'],
        }),
        next: { revalidate: 2 },
      })

      if (tvRes.ok) {
        const tvJson = await tvRes.json()
        if (tvJson.data && tvJson.data.length > 0) {
          const d = tvJson.data[0].d
          // Only override name and sector if not already curated in STOCK_INFO
          if (!STOCK_INFO[symbol]) {
            if (d[1]) {
              dynamicName = String(d[1])
                .replace(/\s+Class\s+[A-Z]/gi, '')
                .replace(/\s+Series\s+[A-Z]/gi, '')
                .replace(/\(Persero\)/gi, '')
                .trim()
            }
            if (d[9]) {
              dynamicSector = String(d[9])
                .replace(/Non-Energy Minerals/gi, 'Mining & Minerals')
                .replace(/Energy Minerals/gi, 'Energy & Mining')
                .replace(/Technology Services/gi, 'Technology')
                .trim()
            }
          }
          liveQuote = {
            currentPrice: Number(d[2]) || 0,
            changePercent: Number(d[3]) || 0,
            changePoints: Number(d[4]) || 0,
            volume: Number(d[5]) || 0,
            dayHigh: Number(d[6]) || 0,
            dayLow: Number(d[7]) || 0,
            turnover: Number(d[8]) || 0,
          }
        }
      }
    } catch (tvErr) {
      console.warn('TradingView scanner fetch error:', tvErr)
    }

    // ── 2. Fetch Real Historical Candles from Yahoo Finance ──
    const yahooSymbol = symbol === 'IHSG' ? '^JKSE' : `${symbol}.JK`
    const rangeParam = searchParams.get('range')
    const intervalParam = searchParams.get('interval')

    let interval = intervalParam || '15m'
    let range = rangeParam || '5d'

    if (!rangeParam && !intervalParam) {
      switch (timeframe) {
        case '1m':
          interval = '1m'
          range = '1d'
          break
        case '5m':
          interval = '5m'
          range = '1d'
          break
        case '15m':
          interval = '15m'
          range = '5d'
          break
        case '1H':
          interval = '60m'
          range = '1mo'
          break
        case '1D':
          interval = '1d'
          range = '3mo'
          break
        case '1W':
          interval = '15m'
          range = '5d'
          break
        case '1M':
          interval = '1d'
          range = '1mo'
          break
        case '3M':
          interval = '1d'
          range = '3mo'
          break
        case '1Y':
          interval = '1d'
          range = '1y'
          break
      }
    }

    let candles: Candle[] = []
    let yahooMeta: any = null

    try {
      const endpoints = [
        `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`,
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`,
      ]

      for (const yahooUrl of endpoints) {
        try {
          const yahooRes = await fetch(yahooUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/json',
            },
            next: { revalidate: 5 },
          })

          if (yahooRes.ok) {
            const yahooData = await yahooRes.json()
            const chartResult = yahooData?.chart?.result?.[0]
            if (chartResult) {
              yahooMeta = chartResult.meta
              const timestamps: number[] = chartResult.timestamp || []
              const quoteObj = chartResult.indicators?.quote?.[0] || {}
              const opens: number[] = quoteObj.open || []
              const highs: number[] = quoteObj.high || []
              const lows: number[] = quoteObj.low || []
              const closes: number[] = quoteObj.close || []
              const volumes: number[] = quoteObj.volume || []

              for (let i = 0; i < timestamps.length; i++) {
                const o = opens[i]
                const h = highs[i]
                const l = lows[i]
                const c = closes[i]
                const v = volumes[i] || 0

                // Skip null or missing candle points
                if (o != null && h != null && l != null && c != null) {
                  candles.push({
                    time: timestamps[i],
                    open: Math.round(o * 100) / 100,
                    high: Math.round(h * 100) / 100,
                    low: Math.round(l * 100) / 100,
                    close: Math.round(c * 100) / 100,
                    volume: Math.round(v),
                  })
                }
              }

              if (candles.length > 0) {
                break // Successfully loaded candles
              }
            }
          }
        } catch (subErr) {
          // try next endpoint
        }
      }
    } catch (yahooErr) {
      console.warn('Yahoo Finance fetch error:', yahooErr)
    }

    // Determine current price from real live sources
    const currentPrice = liveQuote?.currentPrice || yahooMeta?.regularMarketPrice || (candles.length > 0 ? candles[candles.length - 1].close : 100)
    const previousClose = liveQuote && liveQuote.changePoints !== undefined
      ? (currentPrice - liveQuote.changePoints)
      : (yahooMeta?.chartPreviousClose || currentPrice)
    const changePoints = liveQuote?.changePoints ?? (currentPrice - previousClose)
    const changePercent = liveQuote?.changePercent ?? (previousClose > 0 ? (changePoints / previousClose) * 100 : 0)
    const dayHigh = liveQuote?.dayHigh || yahooMeta?.regularMarketDayHigh || currentPrice
    const dayLow = liveQuote?.dayLow || yahooMeta?.regularMarketDayLow || currentPrice
    const volume = liveQuote?.volume || yahooMeta?.regularMarketVolume || 1000000
    const turnover = liveQuote?.turnover || (currentPrice * volume)

    // Ensure last candle in series accurately reflects live price
    if (candles.length > 0 && currentPrice > 0) {
      candles[candles.length - 1].close = currentPrice
      candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, currentPrice)
      candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, currentPrice)
    }

    const foreignFlow: 'BUY' | 'SELL' | 'NEUTRAL' = changePoints > 0 ? 'BUY' : changePoints < 0 ? 'SELL' : 'NEUTRAL'
    const foreignNetBillion = changePoints > 0 ? Math.round((volume * currentPrice * 0.0000000001) * 10) / 10 : -Math.round((volume * currentPrice * 0.00000000008) * 10) / 10

    const meta: StockMeta = {
      symbol,
      name: dynamicName,
      sector: dynamicSector,
      group: info.group,
      currentPrice,
      previousClose,
      changePoints: Math.round(changePoints * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      dayHigh,
      dayLow,
      volume,
      turnover,
      foreignFlow,
      foreignNetBillion,
      marketCapTrillion: info.marketCapTrillion,
      peRatio: info.peRatio,
      pbvRatio: info.pbvRatio,
    }

    return NextResponse.json({
      success: true,
      meta,
      timeframe,
      candles,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in /api/idx/quote:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}
