import { NextRequest, NextResponse } from 'next/server'
import {
  cancelAllBinanceFuturesOrders,
  cancelBinanceFuturesOrder,
  fetchBinanceFuturesAccountDetails,
  placeBinanceFuturesOrder,
  submitSignalBracketOrder,
  submitTestBracketOrder,
} from '@/lib/binance'
import { decryptCredential } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let { apiKey, apiSecret, userEmail, isTestnet = true, action, symbol = 'BTCUSDT', orderId } = body

    // If apiKey is masked, 'Linked API', or missing secret, attempt to decrypt from Supabase
    if ((!apiSecret || !apiKey || String(apiKey).includes('*') || String(apiKey) === 'Linked API') && (userEmail || body.email)) {
      const emailToLookup = String(userEmail || body.email).trim().toLowerCase()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jryweitdqvafagmcrvwe.supabase.co'
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      try {
        const credRes = await fetch(
          `${supabaseUrl}/rest/v1/exchange_credentials?user_email=eq.${encodeURIComponent(emailToLookup)}&order=updated_at.desc&limit=1`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        )
        if (credRes.ok) {
          const rows = await credRes.json()
          if (Array.isArray(rows) && rows.length > 0) {
            apiKey = decryptCredential(rows[0].encrypted_api_key)
            apiSecret = decryptCredential(rows[0].encrypted_api_secret)
            if (typeof rows[0].is_testnet === 'boolean') {
              isTestnet = rows[0].is_testnet
            }
          }
        }
      } catch (dbErr) {
        console.warn('[ORDER API] Supabase decryption lookup notice:', dbErr)
      }
    }

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: 'Binance API Key and Secret are required.' },
        { status: 400 }
      )
    }

    if (action === 'TEST_BRACKET') {
      // Execute verified 0.001 BTC bracket order (Supports Testnet and Live)
      const result = await submitTestBracketOrder(String(apiKey), String(apiSecret), Boolean(isTestnet))
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }

    if (action === 'EXECUTE_SIGNAL_BRACKET') {
      const { setup } = body
      if (!setup || !setup.direction || !setup.entryPrice || !setup.stopLoss) {
        return NextResponse.json(
          { success: false, error: 'setup object with direction, entryPrice, and stopLoss is required.' },
          { status: 400 }
        )
      }
      const result = await submitSignalBracketOrder(
        String(apiKey),
        String(apiSecret),
        setup,
        Boolean(isTestnet)
      )

      // Post execution log to Supabase event_log
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jryweitdqvafagmcrvwe.supabase.co'
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      if (supabaseKey) {
        try {
          const eventType = result.success ? 'BinanceTradeExecutedEvent' : 'BinanceTradeFailedEvent'
          const eventId = `EVT_${result.success ? 'BEX' : 'BFAIL'}_${Math.random().toString(36).substring(2, 10)}`
          await fetch(`${supabaseUrl}/rest/v1/event_log`, {
            method: 'POST',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event_id: eventId,
              event_type: eventType,
              payload: {
                symbol: setup.symbol || 'BTCUSDT',
                direction: setup.direction,
                ...result,
                executed_via: 'WEB_TERMINAL_BRIDGE',
                user_email: userEmail || body.email,
              },
              published_at: new Date().toISOString(),
            }),
          })
        } catch (logErr) {
          console.warn('[ORDER API] Notice logging to event_log:', logErr)
        }
      }

      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }

    if (action === 'MARKET_CLOSE') {
      const { side = 'SELL', quantity } = body
      if (!quantity) {
        return NextResponse.json(
          { success: false, error: 'quantity is required for market close.' },
          { status: 400 }
        )
      }
      const result = await placeBinanceFuturesOrder(
        String(apiKey),
        String(apiSecret),
        {
          symbol: String(symbol),
          side: String(side),
          type: 'MARKET',
          quantity: String(quantity),
          reduceOnly: 'true',
        },
        Boolean(isTestnet)
      )
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }

    if (action === 'CANCEL') {
      if (!orderId) {
        return NextResponse.json(
          { success: false, error: 'orderId is required to cancel an order.' },
          { status: 400 }
        )
      }
      const result = await cancelBinanceFuturesOrder(
        String(apiKey),
        String(apiSecret),
        String(symbol),
        Number(orderId),
        Boolean(isTestnet)
      )
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }

    if (action === 'CANCEL_ALL') {
      if (!body.force) {
        try {
          const acc = await fetchBinanceFuturesAccountDetails(
            String(apiKey),
            String(apiSecret),
            Boolean(isTestnet)
          )
          const activePos = acc.positions?.find(
            (p: any) => p.symbol === symbol && Math.abs(parseFloat(String(p.positionAmt || '0'))) > 0.0001
          )
          if (activePos) {
            return NextResponse.json(
              {
                success: false,
                error: `Safety Guard: Active ${activePos.positionAmt} ${symbol} position is open. Protective bracket orders cannot be cancelled while position is active.`,
              },
              { status: 400 }
            )
          }
        } catch {
          // If position check network call fails, proceed
        }
      }

      const result = await cancelAllBinanceFuturesOrders(
        String(apiKey),
        String(apiSecret),
        String(symbol),
        Boolean(isTestnet)
      )
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }

    return NextResponse.json(
      { success: false, error: `Unsupported order action: ${action}` },
      { status: 400 }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, error: `Internal API error: ${msg}` },
      { status: 500 }
    )
  }
}
