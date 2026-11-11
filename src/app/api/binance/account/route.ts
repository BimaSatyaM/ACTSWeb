import { NextRequest, NextResponse } from 'next/server'
import {
  fetchBinanceFuturesAccountDetails,
  fetchBinanceFuturesUserTrades,
  fetchBinanceFuturesIncome,
} from '@/lib/binance'
import { decryptCredential } from '@/lib/crypto'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jryweitdqvafagmcrvwe.supabase.co'
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  return { url, key }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let { apiKey, apiSecret, isTestnet, email, symbol = 'BTCUSDT', sessionStartTime } = body

    let cleanKey = String(apiKey || '').trim()
    let cleanSecret = String(apiSecret || '').trim()
    let testnet = Boolean(isTestnet)

    let statsResetAt: string | null = null

    // Check credentials and stats_reset_at from Supabase if email provided
    if (email) {
      const cleanEmail = String(email).trim().toLowerCase()
      const { url, key } = getSupabaseConfig()
      try {
        const sRes = await fetch(
          `${url}/rest/v1/exchange_credentials?user_email=eq.${encodeURIComponent(cleanEmail)}&order=updated_at.desc&limit=1`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
            signal: AbortSignal.timeout(3000),
          }
        )
        if (sRes.ok) {
          const rows = await sRes.json()
          if (Array.isArray(rows) && rows.length > 0) {
            if (!cleanKey || !cleanSecret || cleanKey.includes('*')) {
              cleanKey = decryptCredential(rows[0].encrypted_api_key)
              cleanSecret = decryptCredential(rows[0].encrypted_api_secret)
              testnet = Boolean(rows[0].is_testnet)
            }
            statsResetAt = rows[0].stats_reset_at || null
          }
        }
      } catch (sErr) {
        console.warn('[BINANCE ACCOUNT API] Supabase credentials retrieval notice:', sErr)
      }
    }

    if (!cleanKey || !cleanSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both API Key and API Secret are required to fetch account details.',
        },
        { status: 400 }
      )
    }

    const startTime = statsResetAt ? new Date(statsResetAt).getTime() : undefined
    const sessionStart = typeof sessionStartTime === 'number' && !isNaN(sessionStartTime) ? sessionStartTime : undefined

    // Parallel fetch account details + real user trades + income history
    const [accountDetails, userTradesRes, incomeRes] = await Promise.all([
      fetchBinanceFuturesAccountDetails(cleanKey, cleanSecret, testnet),
      fetchBinanceFuturesUserTrades(cleanKey, cleanSecret, testnet, symbol, 1000, startTime, sessionStart),
      fetchBinanceFuturesIncome(cleanKey, cleanSecret, testnet, undefined, undefined, undefined, 100),
    ])

    if (!accountDetails.success) {
      return NextResponse.json(accountDetails, { status: 400 })
    }

    return NextResponse.json({
      ...accountDetails,
      trades: userTradesRes.trades || [],
      sessionPnl: userTradesRes.sessionRealizedPnl,
      sessionGrossPnl: userTradesRes.sessionGrossPnl,
      sessionCommission: userTradesRes.sessionCommission,
      sessionNetPnl: userTradesRes.sessionNetPnl,
      sessionClosingTradeCount: userTradesRes.sessionClosingTradeCount,
      totalRealizedPnl: userTradesRes.totalRealizedPnl,
      netRealizedPnl: userTradesRes.netRealizedPnl,
      totalCommission: userTradesRes.totalCommission,
      closingTradeCount: userTradesRes.closingTradeCount,
      transfersTotal: incomeRes.transfersTotal,
      fundingTotal: incomeRes.fundingTotal,
      statsResetAt,
      timestamp: Date.now(),
    })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        success: false,
        error: `Server internal error: ${errMsg}`,
      },
      { status: 500 }
    )
  }
}
