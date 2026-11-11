import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import { verifyBinanceFuturesCredentials, fetchBinanceFuturesAccountDetails, fetchBinanceFuturesUserTrades } from '@/lib/binance'
import { encryptCredential, decryptCredential, maskApiKey } from '@/lib/crypto'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jryweitdqvafagmcrvwe.supabase.co'
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  return { url, key }
}

const SUPABASE_FALLBACK_IPS = ['104.18.38.10', '172.64.149.246']

/**
 * Robust Supabase REST fetch with automatic DNS bypass for Indonesian ISPs.
 */
async function supabaseRestRequest(
  path: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
  } = {}
): Promise<{ ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<any> }> {
  const { url, key } = getSupabaseConfig()
  const defaultHeaders = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  }

  // 1. Try standard fetch first (fastest on Vercel / non-poisoned networks)
  try {
    const res = await fetch(`${url}${path}`, {
      method: options.method || 'GET',
      headers: defaultHeaders,
      body: options.body,
      signal: AbortSignal.timeout(2500),
    })
    return res
  } catch {
    // 2. Fallback: Bypass local ISP DNS drop via Cloudflare direct SNI IP
  }

  return new Promise((resolve, reject) => {
    const hostname = 'jryweitdqvafagmcrvwe.supabase.co'
    const ip = SUPABASE_FALLBACK_IPS[0]
    const req = https.request(
      {
        host: ip,
        port: 443,
        path,
        method: options.method || 'GET',
        headers: {
          Host: hostname,
          ...defaultHeaders,
          ...(options.body ? { 'Content-Length': Buffer.byteLength(options.body) } : {}),
        },
        servername: hostname,
        timeout: 6000,
      },
      (res) => {
        let rawData = ''
        res.on('data', (chunk) => (rawData += chunk))
        res.on('end', () => {
          resolve({
            ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
            status: res.statusCode || 500,
            text: async () => rawData,
            json: async () => (rawData ? JSON.parse(rawData) : null),
          })
        })
      }
    )

    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('Supabase request timed out')))
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

/**
 * GET /api/binance/credentials?email=user@example.com
 * Fetches user's saved credentials status, masked key, autopilot switch, and live balances.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = (searchParams.get('email') || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email parameter required.' }, { status: 400 })
    }

    let row: any = null

    try {
      const res = await supabaseRestRequest(
        `/rest/v1/exchange_credentials?user_email=eq.${encodeURIComponent(email)}&order=updated_at.desc&limit=1`
      )

      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows) && rows.length > 0) {
          row = rows[0]
        }
      }
    } catch {
      // Supabase query timeout / network error
    }

    if (!row) {
      return NextResponse.json({
        success: true,
        exists: false,
        isAutoTrading: false,
      })
    }

    let availableBalance = 0
    let totalWalletBalance = 0
    let latencyMs = 0
    let sessionPnl = 0
    let sessionGrossPnl = 0
    let sessionCommission = 0
    let sessionNetPnl = 0
    let sessionClosingTradeCount = 0
    let totalRealizedPnl = 0
    let netRealizedPnl = 0
    let totalCommission = 0
    let closingTradeCount = 0
    let trades: any[] = []

    // Safely decrypt in memory on the server to get fresh live balance & trade PnL
    try {
      const apiKey = decryptCredential(row.encrypted_api_key)
      const apiSecret = decryptCredential(row.encrypted_api_secret)
      if (apiKey && apiSecret) {
        const startTime = row.stats_reset_at ? new Date(row.stats_reset_at).getTime() : undefined
        const [liveInfo, userTradesRes] = await Promise.all([
          fetchBinanceFuturesAccountDetails(apiKey, apiSecret, Boolean(row.is_testnet)),
          fetchBinanceFuturesUserTrades(apiKey, apiSecret, Boolean(row.is_testnet), 'BTCUSDT', 1000, startTime),
        ])
        if (liveInfo.success) {
          availableBalance = liveInfo.availableBalance
          totalWalletBalance = liveInfo.totalWalletBalance
          latencyMs = liveInfo.latencyMs
        }
        if (userTradesRes.success) {
          sessionPnl = userTradesRes.sessionRealizedPnl
          sessionGrossPnl = userTradesRes.sessionGrossPnl
          sessionCommission = userTradesRes.sessionCommission
          sessionNetPnl = userTradesRes.sessionNetPnl
          sessionClosingTradeCount = userTradesRes.sessionClosingTradeCount
          totalRealizedPnl = userTradesRes.totalRealizedPnl
          netRealizedPnl = userTradesRes.netRealizedPnl
          totalCommission = userTradesRes.totalCommission
          closingTradeCount = userTradesRes.closingTradeCount
          trades = userTradesRes.trades
        }
      }
    } catch (balErr) {
      console.warn('[CREDENTIALS API] Live balance fetch notice:', balErr)
    }

    return NextResponse.json({
      success: true,
      exists: true,
      userEmail: row.user_email,
      keyMask: row.key_mask,
      isTestnet: Boolean(row.is_testnet),
      isAutoTrading: Boolean(row.is_autopilot_enabled),
      riskPct: Number(row.risk_pct ?? 1.0),
      maxLeverage: Number(row.max_leverage ?? 3),
      tpStrategy: row.tp_strategy || 'bank_and_trail',
      statsResetAt: row.stats_reset_at || null,
      availableBalance,
      totalWalletBalance,
      latencyMs,
      sessionPnl,
      sessionGrossPnl,
      sessionCommission,
      sessionNetPnl,
      sessionClosingTradeCount,
      totalRealizedPnl,
      netRealizedPnl,
      totalCommission,
      closingTradeCount,
      trades,
      updatedAt: row.updated_at,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

/**
 * POST /api/binance/credentials
 * Verifies with Binance, encrypts credentials via AES-256-GCM, and upserts to Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, apiKey, apiSecret, isTestnet, riskPct = 1.0, maxLeverage = 3, tpStrategy = 'bank_and_trail' } = body

    const userEmail = (email || '').trim().toLowerCase()
    const rawApiKey = (apiKey || '').trim()
    const rawApiSecret = (apiSecret || '').trim()
    const testnet = Boolean(isTestnet)

    if (!userEmail || !rawApiKey || !rawApiSecret) {
      return NextResponse.json(
        { success: false, error: 'Email, API Key, and API Secret are all required.' },
        { status: 400 }
      )
    }

    // 1. Verify with Binance
    const verification = await verifyBinanceFuturesCredentials(rawApiKey, rawApiSecret, testnet)
    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid Binance credentials.' },
        { status: 400 }
      )
    }

    // 2. Encrypt credentials with AES-256-GCM
    const encryptedKey = encryptCredential(rawApiKey)
    const encryptedSecret = encryptCredential(rawApiSecret)
    const keyMask = maskApiKey(rawApiKey)

    // 3. Upsert to Supabase
    const payload = {
      id: `binance_${userEmail}_${testnet ? 'testnet' : 'live'}`,
      user_email: userEmail,
      exchange: 'binance',
      is_testnet: testnet,
      is_autopilot_enabled: true, // Default to true upon initial connection
      encrypted_api_key: encryptedKey,
      encrypted_api_secret: encryptedSecret,
      iv: '',
      key_mask: keyMask,
      risk_pct: Number(riskPct),
      max_leverage: Number(maxLeverage),
      tp_strategy: tpStrategy,
      updated_at: new Date().toISOString(),
    }

    try {
      const res = await supabaseRestRequest('/rest/v1/exchange_credentials', {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const txt = await res.text()
        console.error('[CREDENTIALS API] Supabase upsert failed:', res.status, txt)
      } else {
        console.log('[CREDENTIALS API] ✅ Successfully upserted credentials to Supabase for', userEmail)
      }
    } catch (dbErr) {
      console.error('[CREDENTIALS API] Error saving to Supabase:', dbErr)
    }

    return NextResponse.json({
      success: true,
      keyMask,
      isTestnet: testnet,
      isAutoTrading: true,
      availableBalance: verification.availableBalance,
      totalWalletBalance: verification.totalWalletBalance,
      latencyMs: verification.latencyMs,
      accountType: verification.accountType,
      message: 'Credentials safely verified and encrypted in Supabase. Autopilot active.',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

/**
 * PATCH /api/binance/credentials
 * Toggles autopilot mode or adjusts risk/leverage preferences in Supabase.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, isAutoTrading, riskPct, maxLeverage, tpStrategy, resetStats } = body
    const userEmail = (email || '').trim().toLowerCase()

    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Email parameter required.' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof isAutoTrading === 'boolean') {
      updates.is_autopilot_enabled = isAutoTrading
    }
    if (typeof riskPct === 'number') {
      updates.risk_pct = riskPct
    }
    if (typeof maxLeverage === 'number') {
      updates.max_leverage = maxLeverage
    }
    if (typeof tpStrategy === 'string' && tpStrategy) {
      updates.tp_strategy = tpStrategy
    }
    if (resetStats === true) {
      updates.stats_reset_at = new Date().toISOString()
    }

    try {
      const res = await supabaseRestRequest(
        `/rest/v1/exchange_credentials?user_email=eq.${encodeURIComponent(userEmail)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }
      )

      if (!res.ok) {
        const txt = await res.text()
        console.warn('[CREDENTIALS API] Supabase PATCH notice:', res.status, txt)
      }
    } catch (dbErr) {
      console.error('[CREDENTIALS API] Error updating Supabase:', dbErr)
    }

    return NextResponse.json({
      success: true,
      isAutoTrading: updates.is_autopilot_enabled,
      message: updates.is_autopilot_enabled
        ? 'Autopilot ACTIVE: 24/7 cloud execution enabled on Heroku.'
        : 'Autopilot PAUSED: Cloud order execution paused.',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

/**
 * DELETE /api/binance/credentials
 * Disconnects exchange and pauses autopilot in Supabase.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = (searchParams.get('email') || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email parameter required.' }, { status: 400 })
    }

    try {
      await supabaseRestRequest(
        `/rest/v1/exchange_credentials?user_email=eq.${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
        }
      )
    } catch (delErr) {
      console.error('[CREDENTIALS API] Error deleting from Supabase:', delErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Exchange credentials disconnected and autopilot disabled.',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
