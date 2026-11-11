import { NextRequest, NextResponse } from 'next/server'
import { verifyBinanceFuturesCredentials } from '@/lib/binance'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { apiKey, apiSecret, isTestnet } = body

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both API Key and API Secret are required.',
        },
        { status: 400 }
      )
    }

    const verification = await verifyBinanceFuturesCredentials(
      String(apiKey),
      String(apiSecret),
      Boolean(isTestnet)
    )

    if (!verification.success) {
      return NextResponse.json(verification, { status: 400 })
    }

    // Security Assurance: Check that Withdrawals are not enabled
    // Note: On Binance API keys, the user should never check "Enable Withdrawals".
    const withdrawalSecurityWarning = verification.canWithdraw
      ? 'WARNING: This API key has withdrawals enabled. For your security, we strongly recommend disabling withdrawal permissions on Binance.'
      : null

    return NextResponse.json({
      ...verification,
      withdrawalSecurityWarning,
      timestamp: Date.now(),
    })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        success: false,
        error: `Server internal error during verification: ${errMsg}`,
      },
      { status: 500 }
    )
  }
}
