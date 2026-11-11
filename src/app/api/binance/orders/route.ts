import { NextRequest, NextResponse } from 'next/server'
import { fetchBinanceFuturesOpenOrders } from '@/lib/binance'
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
    let { apiKey, apiSecret, isTestnet = true, symbol, email } = body

    let cleanKey = String(apiKey || '').trim()
    let cleanSecret = String(apiSecret || '').trim()
    let testnet = Boolean(isTestnet)

    if ((!cleanKey || !cleanSecret || cleanKey.includes('*')) && email) {
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
            cleanKey = decryptCredential(rows[0].encrypted_api_key)
            cleanSecret = decryptCredential(rows[0].encrypted_api_secret)
            testnet = Boolean(rows[0].is_testnet)
          }
        }
      } catch {
        // ignore
      }
    }

    if (!cleanKey || !cleanSecret) {
      return NextResponse.json(
        { success: false, error: 'Binance API Key and Secret are required.' },
        { status: 400 }
      )
    }

    const result = await fetchBinanceFuturesOpenOrders(
      cleanKey,
      cleanSecret,
      symbol ? String(symbol) : undefined,
      testnet
    )

    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, orders: [], error: `Internal API error: ${msg}` },
      { status: 500 }
    )
  }
}
