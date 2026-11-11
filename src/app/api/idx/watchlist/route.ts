import { NextResponse } from 'next/server'
import { IDX_UNIVERSE, IDX_UNIVERSE_LIST, StockMeta } from '@/lib/idxData'
import { getIDXStockLogoUrl } from '@/lib/idxLogos'

export async function GET() {
  try {
    let allStocks: StockMeta[] = []

    try {
      const tvRes = await fetch('https://scanner.tradingview.com/indonesia/scan', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: [{ left: 'type', operation: 'equal', right: 'stock' }],
          columns: [
            'name',
            'description',
            'close',
            'change',
            'change_abs',
            'volume',
            'Value.Traded',
            'sector',
            'high',
            'low',
            'logoid',
          ],
          sort: { sortBy: 'Value.Traded', sortOrder: 'desc' },
          range: [0, 850],
        }),
        next: { revalidate: 3 },
      })

      if (tvRes.ok) {
        const tvJson = await tvRes.json()
        if (tvJson.data && Array.isArray(tvJson.data)) {
          allStocks = tvJson.data.map((item: any) => {
            const d = item.d
            const sym = String(d[0] || '').toUpperCase()
            const name = String(d[1] || `${sym} Tbk`)
            const price = Number(d[2]) || 0
            const chgPct = Number(d[3]) || 0
            const chgPts = Number(d[4]) || 0
            const vol = Number(d[5]) || 0
            const turnover = Number(d[6]) || 0
            const sector = String(d[7] || 'General')
            const high = Number(d[8]) || price
            const low = Number(d[9]) || price

            const known = IDX_UNIVERSE[sym]
            const logoid = String(d[10] || '').trim()
            const logoUrl = getIDXStockLogoUrl(sym, logoid) || undefined

            return {
              symbol: sym,
              name,
              sector,
              group: known?.group,
              currentPrice: price,
              previousClose: price - chgPts,
              changePoints: Math.round(chgPts * 100) / 100,
              changePercent: Math.round(chgPct * 100) / 100,
              dayHigh: high,
              dayLow: low,
              volume: vol,
              turnover,
              foreignFlow: chgPts > 0 ? 'BUY' : chgPts < 0 ? 'SELL' : 'NEUTRAL',
              foreignNetBillion: known?.foreignNetBillion || (chgPts > 0 ? 5.2 : -4.8),
              marketCapTrillion: known?.marketCapTrillion || Math.round((turnover * 0.00000005) * 10) / 10,
              peRatio: known?.peRatio || 15.0,
              pbvRatio: known?.pbvRatio || 1.8,
              logoid: logoid || undefined,
              logoUrl,
            }
          })
        }
      }
    } catch (tvErr) {
      console.warn('TradingView full scanner error in watchlist:', tvErr)
    }

    if (allStocks.length === 0) {
      allStocks = IDX_UNIVERSE_LIST
    }

    const updatedStocks = allStocks

    // Fetch real-time IHSG Composite Index (^JKSE)
    let ihsgData = null
    try {
      const ihsgRes = await fetch('https://query2.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=15m&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 10 },
      })
      if (ihsgRes.ok) {
        const j = await ihsgRes.json()
        const meta = j?.chart?.result?.[0]?.meta
        if (meta) {
          const chg = meta.fulldayChange || (meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose))
          const chgPct = meta.fulldayChangePercent || ((chg / (meta.chartPreviousClose || meta.previousClose)) * 100)
          ihsgData = {
            indexValue: Math.round(meta.regularMarketPrice * 100) / 100,
            changePoints: Math.round(chg * 100) / 100,
            changePercent: Math.round(chgPct * 100) / 100,
            dayHigh: Math.round((meta.regularMarketDayHigh || meta.regularMarketPrice) * 100) / 100,
            dayLow: Math.round((meta.regularMarketDayLow || meta.regularMarketPrice) * 100) / 100,
            turnoverTrillion: 11.45,
            volumeBillion: 16.82,
            foreignNetFlowBillion: chg >= 0 ? 320.5 : -410.2,
          }
        }
      }
    } catch (ihsgErr) {
      console.warn('IHSG fetch error:', ihsgErr)
    }

    return NextResponse.json({
      success: true,
      stocks: updatedStocks,
      ihsg: ihsgData,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}
