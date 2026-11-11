import crypto from 'crypto'
import https from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'

const DNS_CACHE = new Map<string, { ip: string; expires: number }>()

const FALLBACK_IPS: Record<string, string> = {
  'fapi.binance.com': '108.138.141.24',
  'testnet.binancefuture.com': '18.64.37.110',
  'api.binance.com': '108.138.141.5',
}

// Fixed Webshare Japan Proxy (matching Heroku backend and Binance API Whitelist)
const DEFAULT_PROXY_URL = 'http://efncywgz:9irvkrz03l59@142.111.67.146:5611'

let cachedProxyAgent: HttpsProxyAgent<string> | null = null
let proxyDisabledUntil = 0

function getProxyAgent(): HttpsProxyAgent<string> | null {
  if (Date.now() < proxyDisabledUntil) {
    return null
  }
  const proxy = process.env.BINANCE_PROXY_URL || DEFAULT_PROXY_URL
  if (proxy && proxy.trim()) {
    if (!cachedProxyAgent) {
      cachedProxyAgent = new HttpsProxyAgent(proxy.trim())
    }
    return cachedProxyAgent
  }
  return null
}

// Resolves Binance hostnames using DNS-over-HTTPS (Cloudflare / Google)
// to bypass local ISP DNS poisoning (e.g., Kominfo / TrustPositif in Indonesia)
// without requiring the user to install a VPN.
export async function resolveBinanceHost(hostname: string): Promise<string> {
  const cached = DNS_CACHE.get(hostname)
  if (cached && Date.now() < cached.expires) {
    return cached.ip
  }

  // 1. Try Cloudflare DoH
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    const record = data.Answer?.find((a: any) => a.type === 1)
    if (record?.data) {
      DNS_CACHE.set(hostname, { ip: record.data, expires: Date.now() + 300000 })
      return record.data
    }
  } catch {
    // try fallback DoH
  }

  // 2. Try Google DoH
  try {
    const res = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    const record = data.Answer?.find((a: any) => a.type === 1)
    if (record?.data) {
      DNS_CACHE.set(hostname, { ip: record.data, expires: Date.now() + 300000 })
      return record.data
    }
  } catch {
    // fallback
  }

  return FALLBACK_IPS[hostname] || '108.138.141.24'
}

// Executes a secure HTTPS request to Binance.
// Prioritizes the whitelisted Webshare proxy so residential dynamic IPs (e.g. CBN Indonesia)
// never cause "Invalid API-key, IP, or permissions (-2015)" upon PC reboot.
// Falls back to direct DoH connection if proxy is unavailable.
export async function binanceSecureFetch(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
  } = {}
): Promise<{ ok: boolean; status: number; statusText: string; json: () => Promise<any> }> {
  const parsed = new URL(url)
  const proxyAgent = getProxyAgent()
  const isPrivate = Boolean(
    options.headers?.['X-MBX-APIKEY'] ||
    options.headers?.['x-mbx-apikey'] ||
    parsed.searchParams.has('signature')
  )

  // 1. Primary path: Route authenticated requests through whitelisted proxy (static Japan IP)
  // Public unauthenticated requests (like /fapi/v1/ticker/24hr) use direct DoH to conserve proxy quota!
  if (proxyAgent && isPrivate) {
    try {
      return await new Promise((resolve, reject) => {
        const req = https.request(
          {
            hostname: parsed.hostname,
            port: 443,
            path: parsed.pathname + parsed.search,
            method: options.method || 'GET',
            headers: {
              Host: parsed.hostname,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ACTS/1.0',
              ...options.headers,
            },
            agent: proxyAgent,
            timeout: 10000,
          },
          (res) => {
            // Check if this is a PROXY-level failure rather than a genuine Binance response:
            // Status 402 = Proxy bandwidth limit exceeded / payment required
            // Status 407 = Proxy Authentication Required
            // x-webshare-error = Webshare proxy service error header
            if (
              res.statusCode === 402 ||
              res.statusCode === 407 ||
              Boolean(res.headers['x-webshare-error'])
            ) {
              proxyDisabledUntil = Date.now() + 15 * 60 * 1000 // 15 minute cooldown for dead/unpaid proxy
              reject(
                new Error(
                  `Proxy unavailable (${res.statusCode} ${res.statusMessage || res.headers['x-webshare-reason'] || ''}). Failing over to direct DoH.`
                )
              )
              return
            }

            let rawData = ''
            res.on('data', (chunk) => {
              rawData += chunk
            })
            res.on('end', () => {
              resolve({
                ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
                status: res.statusCode || 500,
                statusText: res.statusMessage || '',
                json: async () => {
                  if (!rawData || !rawData.trim()) return null
                  try {
                    return JSON.parse(rawData)
                  } catch {
                    return { raw: rawData }
                  }
                },
              })
            })
          }
        )

        req.on('error', (err) => {
          proxyDisabledUntil = Date.now() + 15 * 60 * 1000
          reject(err)
        })
        req.on('timeout', () => {
          req.destroy(new Error('Binance Proxy API connection timed out'))
        })

        if (options.body) {
          req.write(options.body)
        }
        req.end()
      })
    } catch (proxyErr) {
      console.warn('[BINANCE PROXY] Request via proxy failed, falling back to direct DoH:', proxyErr)
    }
  }

  // 2. Fallback path: Direct connection with DNS-over-HTTPS
  const resolvedIp = await resolveBinanceHost(parsed.hostname)

  return new Promise((resolve, reject) => {
    const agent = new https.Agent({
      lookup: (h: any, opts: any, cb: any) => {
        if (typeof opts === 'function') {
          cb = opts
          opts = {}
        }
        if (opts && opts.all) {
          cb(null, [{ address: resolvedIp, family: 4 }])
        } else {
          cb(null, resolvedIp, 4)
        }
      },
    })

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: {
          Host: parsed.hostname,
          ...options.headers,
        },
        agent,
        servername: parsed.hostname,
        timeout: 10000,
      },
      (res) => {
        let rawData = ''
        res.on('data', (chunk) => {
          rawData += chunk
        })
        res.on('end', () => {
          resolve({
            ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
            status: res.statusCode || 500,
            statusText: res.statusMessage || '',
            json: async () => {
              if (!rawData || !rawData.trim()) return null
              try {
                return JSON.parse(rawData)
              } catch {
                return { raw: rawData }
              }
            },
          })
        })
      }
    )

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy(new Error('Binance API connection timed out'))
    })

    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

export interface BinanceAccountInfo {
  success: boolean
  isTestnet: boolean
  accountType?: 'FUTURES' | 'SPOT'
  canTrade: boolean
  canDeposit: boolean
  canWithdraw: boolean
  totalWalletBalance: number
  availableBalance: number
  totalUnrealizedProfit: number
  maxWithdrawAmount: number
  latencyMs: number
  error?: string
  errorCode?: number
}

export interface BinanceVerificationRequest {
  apiKey: string
  apiSecret: string
  isTestnet?: boolean
}

const BINANCE_FUTURES_LIVE_BASE = 'https://fapi.binance.com'
const BINANCE_FUTURES_TESTNET_BASE = 'https://testnet.binancefuture.com'
const BINANCE_SPOT_LIVE_BASE = 'https://api.binance.com'

// Creates HMAC-SHA256 signature for Binance REST API
export function generateBinanceSignature(queryString: string, apiSecret: string): string {
  return crypto
    .createHmac('sha256', apiSecret.trim())
    .update(queryString)
    .digest('hex')
}

// Maps Binance API numerical error codes to human-readable explanations & tips.
export function formatBinanceErrorMessage(code: number, rawMsg: string): string {
  switch (code) {
    case -2015:
      return 'Invalid API-key, IP, or permissions. Ensure "Enable Futures" is enabled on Binance, and IP Access is either "Unrestricted" or includes your current IP address.'
    case -2014:
      return 'API-key format invalid. Check that there are no accidental spaces or linebreaks in your API Key.'
    case -1021:
      return 'Timestamp outside of recvWindow. Your computer system clock may be out of sync with Binance servers.'
    case -1022:
      return 'Signature for this request is not valid. Please double-check your Binance API Secret.'
    case -2021:
      return 'Order would immediately trigger. Reduce leverage or wait for volatility to stabilize.'
    case -4001:
      return 'Futures account not opened or KYC not completed. Please open the Futures tab in your Binance app first.'
    case 402:
      return 'Proxy bandwidth limit reached. Direct connection fallback active.'
    default:
      return rawMsg || 'An unknown error occurred while communicating with Binance API.'
  }
}

// Verifies Binance credentials and retrieves live wallet balance & permission flags.
// First tests /fapi/v2/account (Futures). If Futures is not enabled on this key,
// automatically falls back to /api/v3/account (Spot & Margin).
export async function verifyBinanceFuturesCredentials(
  apiKey: string,
  apiSecret: string,
  isTestnet = false
): Promise<BinanceAccountInfo> {
  const cleanKey = apiKey.trim()
  const cleanSecret = apiSecret.trim()

  if (!cleanKey || !cleanSecret) {
    return {
      success: false,
      isTestnet,
      canTrade: false,
      canDeposit: false,
      canWithdraw: false,
      totalWalletBalance: 0,
      availableBalance: 0,
      totalUnrealizedProfit: 0,
      maxWithdrawAmount: 0,
      latencyMs: 0,
      error: 'API Key and Secret cannot be empty.',
    }
  }

  const timestamp = Date.now()
  const recvWindow = 5000
  const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`
  const signature = generateBinanceSignature(queryString, cleanSecret)

  const startTime = Date.now()

  // 1. Try Binance USDT-M Futures endpoint
  try {
    const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
    const endpoint = `${baseUrl}/fapi/v2/account?${queryString}&signature=${signature}`

    const res = await binanceSecureFetch(endpoint, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': cleanKey,
        'Content-Type': 'application/json',
      },
    })

    const latencyMs = Date.now() - startTime
    const data = await res.json()

    if (res.ok && !data.code) {
      return {
        success: true,
        isTestnet,
        accountType: 'FUTURES',
        canTrade: Boolean(data.canTrade),
        canDeposit: Boolean(data.canDeposit),
        canWithdraw: Boolean(data.canWithdraw),
        totalWalletBalance: parseFloat(data.totalWalletBalance || '0'),
        availableBalance: parseFloat(data.availableBalance || '0'),
        totalUnrealizedProfit: parseFloat(data.totalUnrealizedProfit || '0'),
        maxWithdrawAmount: parseFloat(data.maxWithdrawAmount || '0'),
        latencyMs,
      }
    }

    // 2. If Futures failed due to permissions (-2015, -4001, etc.) and it's not testnet,
    // fallback to check Binance Spot & Margin account
    if (!isTestnet && (data.code === -2015 || data.code === -4001 || data.code === -1002)) {
      const spotEndpoint = `${BINANCE_SPOT_LIVE_BASE}/api/v3/account?${queryString}&signature=${signature}`
      const spotRes = await binanceSecureFetch(spotEndpoint, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': cleanKey,
          'Content-Type': 'application/json',
        },
      })

      const spotData = await spotRes.json()
      if (spotRes.ok && !spotData.code) {
        const balances: Array<{ asset: string; free: string; locked: string }> = Array.isArray(spotData.balances)
          ? spotData.balances
          : []
        const usdt = balances.find((b) => b.asset === 'USDT')
        const usdc = balances.find((b) => b.asset === 'USDC')
        const usdtFree = parseFloat(usdt?.free || '0')
        const usdtLocked = parseFloat(usdt?.locked || '0')
        const usdcFree = parseFloat(usdc?.free || '0')

        return {
          success: true,
          isTestnet: false,
          accountType: 'SPOT',
          canTrade: Boolean(spotData.canTrade),
          canDeposit: Boolean(spotData.canDeposit),
          canWithdraw: Boolean(spotData.canWithdraw),
          totalWalletBalance: usdtFree + usdtLocked + usdcFree,
          availableBalance: usdtFree + usdcFree,
          totalUnrealizedProfit: 0,
          maxWithdrawAmount: usdtFree,
          latencyMs: Date.now() - startTime,
        }
      }
    }

    // If both failed or specific error
    const code = data.code || res.status
    const msg = formatBinanceErrorMessage(code, data.msg || res.statusText)
    return {
      success: false,
      isTestnet,
      canTrade: false,
      canDeposit: false,
      canWithdraw: false,
      totalWalletBalance: 0,
      availableBalance: 0,
      totalUnrealizedProfit: 0,
      maxWithdrawAmount: 0,
      latencyMs,
      error: msg,
      errorCode: code,
    }
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime
    const errMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      isTestnet,
      canTrade: false,
      canDeposit: false,
      canWithdraw: false,
      totalWalletBalance: 0,
      availableBalance: 0,
      totalUnrealizedProfit: 0,
      maxWithdrawAmount: 0,
      latencyMs,
      error: `Network connection failed: ${errMsg}. Check your internet connection or try with a VPN if Binance is restricted in your region.`,
    }
  }
}

export interface BinancePosition {
  symbol: string
  positionAmt: number
  side: 'LONG' | 'SHORT'
  entryPrice: number
  markPrice: number
  unRealizedProfit: number
  leverage: number
  isolated: boolean
  liquidationPrice: number
}

export interface BinanceAccountFullDetails {
  success: boolean
  isTestnet: boolean
  accountType?: 'FUTURES' | 'SPOT'
  canTrade: boolean
  totalWalletBalance: number
  availableBalance: number
  totalUnrealizedProfit: number
  totalMarginBalance: number
  totalInitialMargin: number
  totalMaintMargin: number
  marginRatio: number
  positions: BinancePosition[]
  latencyMs: number
  error?: string
}

// Fetches comprehensive Binance account state: balances, margin health, and open positions.
// Defaults to Futures; falls back to Spot if Futures is not enabled.
export async function fetchBinanceFuturesAccountDetails(
  apiKey: string,
  apiSecret: string,
  isTestnet = false
): Promise<BinanceAccountFullDetails> {
  const cleanKey = apiKey.trim()
  const cleanSecret = apiSecret.trim()

  if (!cleanKey || !cleanSecret) {
    return {
      success: false,
      isTestnet,
      canTrade: false,
      totalWalletBalance: 0,
      availableBalance: 0,
      totalUnrealizedProfit: 0,
      totalMarginBalance: 0,
      totalInitialMargin: 0,
      totalMaintMargin: 0,
      marginRatio: 0,
      positions: [],
      latencyMs: 0,
      error: 'API Key and Secret cannot be empty.',
    }
  }

  const timestamp = Date.now()
  const recvWindow = 5000
  const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`
  const signature = generateBinanceSignature(queryString, cleanSecret)

  const startTime = Date.now()
  try {
    const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
    const endpoint = `${baseUrl}/fapi/v2/account?${queryString}&signature=${signature}`

    const res = await binanceSecureFetch(endpoint, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': cleanKey,
        'Content-Type': 'application/json',
      },
    })

    const latencyMs = Date.now() - startTime
    const data = await res.json()

    if (res.ok && !data.code) {
      const totalWalletBalance = parseFloat(data.totalWalletBalance || '0')
      const availableBalance = parseFloat(data.availableBalance || '0')
      const totalUnrealizedProfit = parseFloat(data.totalUnrealizedProfit || '0')
      const totalMarginBalance = parseFloat(data.totalMarginBalance || '0')
      const totalInitialMargin = parseFloat(data.totalInitialMargin || '0')
      const totalMaintMargin = parseFloat(data.totalMaintMargin || '0')

      const marginRatio = totalMarginBalance > 0
        ? (totalMaintMargin / totalMarginBalance) * 100
        : 0

      // Filter non-zero active positions
      const rawPositions = Array.isArray(data.positions) ? data.positions : []
      const positions: BinancePosition[] = rawPositions
        .filter((p: any) => {
          const amt = parseFloat(p.positionAmt || '0')
          return Math.abs(amt) > 0.000001
        })
        .map((p: any) => {
          const amt = parseFloat(p.positionAmt || '0')
          return {
            symbol: p.symbol,
            positionAmt: Math.abs(amt),
            side: amt > 0 ? ('LONG' as const) : ('SHORT' as const),
            entryPrice: parseFloat(p.entryPrice || '0'),
            markPrice: parseFloat(p.markPrice || '0'),
            unRealizedProfit: parseFloat(p.unrealizedProfit || '0'),
            leverage: parseInt(p.leverage || '1', 10),
            isolated: Boolean(p.isolated),
            liquidationPrice: parseFloat(p.liquidationPrice || '0'),
          }
        })

      return {
        success: true,
        isTestnet,
        accountType: 'FUTURES',
        canTrade: Boolean(data.canTrade),
        totalWalletBalance,
        availableBalance,
        totalUnrealizedProfit,
        totalMarginBalance,
        totalInitialMargin,
        totalMaintMargin,
        marginRatio: parseFloat(marginRatio.toFixed(2)),
        positions,
        latencyMs,
      }
    }

    // Spot fallback
    if (!isTestnet && (data.code === -2015 || data.code === -4001 || data.code === -1002)) {
      const spotEndpoint = `${BINANCE_SPOT_LIVE_BASE}/api/v3/account?${queryString}&signature=${signature}`
      const spotRes = await binanceSecureFetch(spotEndpoint, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': cleanKey,
          'Content-Type': 'application/json',
        },
      })

      const spotData = await spotRes.json()
      if (spotRes.ok && !spotData.code) {
        const balances: Array<{ asset: string; free: string; locked: string }> = Array.isArray(spotData.balances)
          ? spotData.balances
          : []
        const usdt = balances.find((b) => b.asset === 'USDT')
        const usdc = balances.find((b) => b.asset === 'USDC')
        const usdtFree = parseFloat(usdt?.free || '0')
        const usdtLocked = parseFloat(usdt?.locked || '0')
        const usdcFree = parseFloat(usdc?.free || '0')

        return {
          success: true,
          isTestnet: false,
          accountType: 'SPOT',
          canTrade: Boolean(spotData.canTrade),
          totalWalletBalance: usdtFree + usdtLocked + usdcFree,
          availableBalance: usdtFree + usdcFree,
          totalUnrealizedProfit: 0,
          totalMarginBalance: usdtFree + usdtLocked + usdcFree,
          totalInitialMargin: 0,
          totalMaintMargin: 0,
          marginRatio: 0,
          positions: [],
          latencyMs: Date.now() - startTime,
        }
      }
    }

    const code = data.code || res.status
    const msg = formatBinanceErrorMessage(code, data.msg || res.statusText)
    return {
      success: false,
      isTestnet,
      canTrade: false,
      totalWalletBalance: 0,
      availableBalance: 0,
      totalUnrealizedProfit: 0,
      totalMarginBalance: 0,
      totalInitialMargin: 0,
      totalMaintMargin: 0,
      marginRatio: 0,
      positions: [],
      latencyMs,
      error: msg,
    }
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime
    const errMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      isTestnet,
      canTrade: false,
      totalWalletBalance: 0,
      availableBalance: 0,
      totalUnrealizedProfit: 0,
      totalMarginBalance: 0,
      totalInitialMargin: 0,
      totalMaintMargin: 0,
      marginRatio: 0,
      positions: [],
      latencyMs,
      error: `Network error: ${errMsg}`,
    }
  }
}

export interface BinanceOpenOrder {
  orderId: number
  symbol: string
  status: string
  clientOrderId: string
  price: number
  avgPrice: number
  origQty: number
  executedQty: number
  type: string
  side: 'BUY' | 'SELL'
  stopPrice: number
  time: number
  updateTime: number
  reduceOnly: boolean
  closePosition: boolean
}

// Places an individual order on Binance Futures.
export async function placeBinanceFuturesOrder(
  apiKey: string,
  apiSecret: string,
  params: Record<string, any>,
  isTestnet = false
): Promise<{ success: boolean; data?: any; error?: string }> {
  const cleanKey = apiKey.trim()
  const cleanSecret = apiSecret.trim()

  const timestamp = Date.now()
  const recvWindow = 5000
  const searchParams = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      searchParams.set(k, String(v))
    }
  }
  searchParams.set('timestamp', String(timestamp))
  searchParams.set('recvWindow', String(recvWindow))

  const queryString = searchParams.toString()
  const signature = generateBinanceSignature(queryString, cleanSecret)
  const fullBody = `${queryString}&signature=${signature}`

  const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
  const endpoint = `${baseUrl}/fapi/v1/order`

  try {
    const res = await binanceSecureFetch(endpoint, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': cleanKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: fullBody,
    })

    const data = await res.json()
    if (res.ok && !data.code) {
      return { success: true, data }
    }
    const code = data.code || res.status
    return {
      success: false,
      error: formatBinanceErrorMessage(code, data.msg || res.statusText),
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Order submission network error: ${msg}` }
  }
}

// Places a conditional Algo Order (STOP_MARKET, TAKE_PROFIT_MARKET, etc.)
// on Binance Futures (/fapi/v1/algoOrder).
// As of late 2025/2026, Binance deprecated conditional orders on standard /fapi/v1/order.
export async function placeBinanceFuturesAlgoOrder(
  apiKey: string,
  apiSecret: string,
  params: Record<string, any>,
  isTestnet = false
): Promise<{ success: boolean; data?: any; error?: string }> {
  const cleanKey = apiKey.trim()
  const cleanSecret = apiSecret.trim()

  const timestamp = Date.now()
  const recvWindow = 5000
  const searchParams = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      searchParams.set(k, String(v))
    }
  }
  searchParams.set('timestamp', String(timestamp))
  searchParams.set('recvWindow', String(recvWindow))

  const queryString = searchParams.toString()
  const signature = generateBinanceSignature(queryString, cleanSecret)
  const fullBody = `${queryString}&signature=${signature}`

  const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
  const endpoint = `${baseUrl}/fapi/v1/algoOrder`

  try {
    const res = await binanceSecureFetch(endpoint, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': cleanKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: fullBody,
    })

    const data = await res.json()
    if (res.ok && !data.code) {
      return { success: true, data }
    }
    const code = data.code || res.status
    return {
      success: false,
      error: formatBinanceErrorMessage(code, data.msg || res.statusText),
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Algo order submission network error: ${msg}` }
  }
}

// Cancels an individual open order on Binance Futures.
// Supports both standard orders (/fapi/v1/order) and algo conditional orders (/fapi/v1/algoOrder).
export async function cancelBinanceFuturesOrder(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  orderId: number,
  isTestnet = false
): Promise<{ success: boolean; data?: any; error?: string }> {
  const cleanKey = apiKey.trim()
  const cleanSecret = apiSecret.trim()

  const timestamp = Date.now()
  const recvWindow = 5000
  const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}&recvWindow=${recvWindow}`
  const signature = generateBinanceSignature(queryString, cleanSecret)

  const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
  const endpoint = `${baseUrl}/fapi/v1/order?${queryString}&signature=${signature}`

  try {
    const res = await binanceSecureFetch(endpoint, {
      method: 'DELETE',
      headers: {
        'X-MBX-APIKEY': cleanKey,
      },
    })
    const data = await res.json()
    if (res.ok && !data.code) {
      return { success: true, data }
    }

    // If order was not found in standard orders (e.g. -2011 Unknown order sent), try algo order endpoint
    const algoQuery = `algoId=${orderId}&timestamp=${timestamp}&recvWindow=${recvWindow}`
    const algoSig = generateBinanceSignature(algoQuery, cleanSecret)
    const algoEndpoint = `${baseUrl}/fapi/v1/algoOrder?${algoQuery}&signature=${algoSig}`

    const algoRes = await binanceSecureFetch(algoEndpoint, {
      method: 'DELETE',
      headers: {
        'X-MBX-APIKEY': cleanKey,
      },
    })
    const algoData = await algoRes.json()
    if (algoRes.ok && !algoData.code) {
      return { success: true, data: algoData }
    }

    return {
      success: false,
      error: formatBinanceErrorMessage(data.code || res.status, data.msg || res.statusText),
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Cancel error: ${msg}` }
  }
}

// Cancels all open orders on Binance Futures for a given symbol (both standard and algo orders).
export async function cancelAllBinanceFuturesOrders(
  apiKey: string,
  apiSecret: string,
  symbol: string = 'BTCUSDT',
  isTestnet = false
): Promise<{ success: boolean; data?: any; error?: string }> {
  const cleanKey = apiKey.trim()
  const cleanSecret = apiSecret.trim()

  const timestamp = Date.now()
  const recvWindow = 5000
  const queryString = `symbol=${symbol}&timestamp=${timestamp}&recvWindow=${recvWindow}`
  const signature = generateBinanceSignature(queryString, cleanSecret)

  const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
  const endpoint = `${baseUrl}/fapi/v1/allOpenOrders?${queryString}&signature=${signature}`
  const algoEndpoint = `${baseUrl}/fapi/v1/algoOpenOrders?${queryString}&signature=${signature}`

  try {
    const [res, algoRes] = await Promise.allSettled([
      binanceSecureFetch(endpoint, {
        method: 'DELETE',
        headers: {
          'X-MBX-APIKEY': cleanKey,
        },
      }),
      binanceSecureFetch(algoEndpoint, {
        method: 'DELETE',
        headers: {
          'X-MBX-APIKEY': cleanKey,
        },
      }),
    ])

    let ok = false
    let lastData: any = null

    if (res.status === 'fulfilled') {
      const data = await res.value.json()
      if (res.value.ok && !data.code) ok = true
      lastData = data
    }
    if (algoRes.status === 'fulfilled') {
      const data = await algoRes.value.json()
      if (algoRes.value.ok && !data.code) ok = true
      if (!lastData) lastData = data
    }

    // In addition, query open orders and cancel any remaining by ID to ensure 100% clean flush
    try {
      const openOrdersRes = await fetchBinanceFuturesOpenOrders(cleanKey, cleanSecret, symbol, isTestnet)
      if (openOrdersRes.success && openOrdersRes.orders.length > 0) {
        await Promise.allSettled(
          openOrdersRes.orders.map((o) =>
            cancelBinanceFuturesOrder(cleanKey, cleanSecret, symbol, o.orderId, isTestnet)
          )
        )
        ok = true
      }
    } catch {
      // ignore
    }

    return { success: ok, data: lastData }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Cancel all error: ${msg}` }
  }
}

// Fetches all currently active open orders on Binance Futures,
// including both standard limit orders (/fapi/v1/openOrders)
// and conditional algo orders (/fapi/v1/openAlgoOrders).
export async function fetchBinanceFuturesOpenOrders(
  apiKey: string,
  apiSecret: string,
  symbol?: string,
  isTestnet = false
): Promise<{ success: boolean; orders: BinanceOpenOrder[]; error?: string }> {
  const cleanKey = apiKey.trim()
  const cleanSecret = apiSecret.trim()

  const timestamp = Date.now()
  const recvWindow = 5000
  const symParam = symbol ? `symbol=${symbol}&` : ''
  const queryString = `${symParam}timestamp=${timestamp}&recvWindow=${recvWindow}`
  const signature = generateBinanceSignature(queryString, cleanSecret)

  const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
  const endpoint = `${baseUrl}/fapi/v1/openOrders?${queryString}&signature=${signature}`
  const algoEndpoint = `${baseUrl}/fapi/v1/openAlgoOrders?${queryString}&signature=${signature}`

  try {
    const [stdResult, algoResult] = await Promise.allSettled([
      binanceSecureFetch(endpoint, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': cleanKey,
        },
      }),
      binanceSecureFetch(algoEndpoint, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': cleanKey,
        },
      }),
    ])

    const orders: BinanceOpenOrder[] = []

    // 1. Process Standard Orders
    if (stdResult.status === 'fulfilled') {
      const stdData = await stdResult.value.json()
      if (stdResult.value.ok && Array.isArray(stdData)) {
        for (const o of stdData) {
          orders.push({
            orderId: Number(o.orderId),
            symbol: o.symbol,
            status: o.status,
            clientOrderId: o.clientOrderId || '',
            price: parseFloat(o.price || '0'),
            avgPrice: parseFloat(o.avgPrice || '0'),
            origQty: parseFloat(o.origQty || '0'),
            executedQty: parseFloat(o.executedQty || '0'),
            type: o.type,
            side: o.side,
            stopPrice: parseFloat(o.stopPrice || '0'),
            time: o.time,
            updateTime: o.updateTime,
            reduceOnly: Boolean(o.reduceOnly),
            closePosition: Boolean(o.closePosition),
          })
        }
      }
    }

    // 2. Process Algo Orders (Conditional SL / TP)
    if (algoResult.status === 'fulfilled') {
      const algoData = await algoResult.value.json()
      const algoList = Array.isArray(algoData)
        ? algoData
        : Array.isArray(algoData?.orders)
        ? algoData.orders
        : []

      for (const a of algoList) {
        orders.push({
          orderId: Number(a.algoId || a.orderId),
          symbol: a.symbol,
          status: a.algoStatus || a.status || 'NEW',
          clientOrderId: a.clientAlgoId || a.clientOrderId || '',
          price: parseFloat(a.price || '0'),
          avgPrice: parseFloat(a.actualPrice || a.avgPrice || '0'),
          origQty: parseFloat(a.quantity || a.origQty || '0'),
          executedQty: parseFloat(a.executedQty || '0'),
          type: a.orderType || a.type,
          side: a.side,
          stopPrice: parseFloat(a.triggerPrice || a.stopPrice || '0'),
          time: a.createTime || a.time || Date.now(),
          updateTime: a.updateTime || a.time || Date.now(),
          reduceOnly: Boolean(a.reduceOnly),
          closePosition: Boolean(a.closePosition),
        })
      }
    }

    return { success: true, orders }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, orders: [], error: `Fetch open orders error: ${msg}` }
  }
}

// Sets leverage for a symbol.
export async function setBinanceFuturesLeverage(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  leverage: number,
  isTestnet = false
): Promise<{ success: boolean; data?: any; error?: string }> {
  const timestamp = Date.now()
  const recvWindow = 5000
  const queryString = `symbol=${symbol}&leverage=${leverage}&timestamp=${timestamp}&recvWindow=${recvWindow}`
  const signature = generateBinanceSignature(queryString, apiSecret.trim())
  const fullBody = `${queryString}&signature=${signature}`

  const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
  const endpoint = `${baseUrl}/fapi/v1/leverage`

  try {
    const res = await binanceSecureFetch(endpoint, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey.trim(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: fullBody,
    })
    const data = await res.json()
    return { success: res.ok && !data.code, data }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

// Sets margin type (ISOLATED or CROSSED) for a symbol.
export async function setBinanceFuturesMarginType(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  marginType = 'ISOLATED',
  isTestnet = false
): Promise<{ success: boolean; data?: any; error?: string }> {
  const timestamp = Date.now()
  const recvWindow = 5000
  const queryString = `symbol=${symbol}&marginType=${marginType.toUpperCase()}&timestamp=${timestamp}&recvWindow=${recvWindow}`
  const signature = generateBinanceSignature(queryString, apiSecret.trim())
  const fullBody = `${queryString}&signature=${signature}`

  const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
  const endpoint = `${baseUrl}/fapi/v1/marginType`

  try {
    const res = await binanceSecureFetch(endpoint, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey.trim(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: fullBody,
    })
    const data = await res.json()
    // -4046 = already set
    if (data.code === -4046) {
      return { success: true, data: { msg: 'Already configured' } }
    }
    return { success: res.ok && !data.code, data }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}
// Fetches current Binance Futures ticker price for a symbol.
export async function fetchBinanceFuturesTickerPrice(
  symbol = 'BTCUSDT',
  isTestnet = false
): Promise<number> {
  const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
  const endpoint = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`
  try {
    const res = await binanceSecureFetch(endpoint)
    const data = await res.json()
    if (data?.price) {
      return parseFloat(data.price)
    }
  } catch {
    // fallback
  }
  return 77300.0
}

// Executes an instant 0.001 BTC bracket order on Binance Futures Testnet
// to verify end-to-end order routing:
// 1. Sets ISOLATED 3x leverage.
// 2. Places BUY MARKET for 0.001 BTC (POST /fapi/v1/order).
// 3. Places STOP_MARKET SL order ($500 below entry) via Algo Order API (POST /fapi/v1/algoOrder).
// 4. Places TAKE_PROFIT_MARKET TP order ($1000 above entry) via Algo Order API (POST /fapi/v1/algoOrder).
export async function submitTestBracketOrder(
  apiKey: string,
  apiSecret: string,
  isTestnet = false
): Promise<{
  success: boolean
  entryOrderId?: number
  entryPrice?: number
  slOrderId?: number
  slPrice?: number
  slError?: string
  tpOrderId?: number
  tpPrice?: number
  tpError?: string
  error?: string
}> {
  const symbol = 'BTCUSDT'

  // 1. Fetch live market price from Binance (Testnet or Live)
  const currentMarketPrice = await fetchBinanceFuturesTickerPrice(symbol, isTestnet)

  // 2. Ensure isolated margin & 3x leverage
  await setBinanceFuturesMarginType(apiKey, apiSecret, symbol, 'ISOLATED', isTestnet)
  await setBinanceFuturesLeverage(apiKey, apiSecret, symbol, 3, isTestnet)

  // 3. Market Entry Order (0.001 BTC) via standard order endpoint
  const entryRes = await placeBinanceFuturesOrder(
    apiKey,
    apiSecret,
    {
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: '0.001',
    },
    isTestnet
  )

  if (!entryRes.success || !entryRes.data) {
    return {
      success: false,
      error: `Entry order failed: ${entryRes.error || 'Unknown error'}`,
    }
  }

  const entryOrderId = entryRes.data.orderId
  const avgPrice = parseFloat(entryRes.data.avgPrice || '0')
  const cumQuote = parseFloat(entryRes.data.cumQuote || '0')
  const executedQty = parseFloat(entryRes.data.executedQty || '0')

  let fillPrice = avgPrice
  if (fillPrice <= 0 && cumQuote > 0 && executedQty > 0) {
    fillPrice = cumQuote / executedQty
  }
  if (fillPrice <= 0) {
    fillPrice = currentMarketPrice
  }

  // 4. Stop Loss ($500 below real fill price) via Algo Order API (/fapi/v1/algoOrder)
  const slPrice = Math.round((fillPrice - 500) * 10) / 10
  const slRes = await placeBinanceFuturesAlgoOrder(
    apiKey,
    apiSecret,
    {
      algoType: 'CONDITIONAL',
      symbol,
      side: 'SELL',
      type: 'STOP_MARKET',
      triggerPrice: slPrice.toFixed(1),
      closePosition: 'true',
      workingType: 'MARK_PRICE',
      priceProtect: 'TRUE',
    },
    isTestnet
  )

  // 5. Take Profit ($1000 above real fill price) via Algo Order API (/fapi/v1/algoOrder)
  const tpPrice = Math.round((fillPrice + 1000) * 10) / 10
  const tpRes = await placeBinanceFuturesAlgoOrder(
    apiKey,
    apiSecret,
    {
      algoType: 'CONDITIONAL',
      symbol,
      side: 'SELL',
      type: 'TAKE_PROFIT_MARKET',
      triggerPrice: tpPrice.toFixed(1),
      quantity: '0.001',
      reduceOnly: 'true',
      workingType: 'MARK_PRICE',
      priceProtect: 'TRUE',
    },
    isTestnet
  )

  return {
    success: true,
    entryOrderId,
    entryPrice: fillPrice,
    slOrderId: slRes.data?.algoId || slRes.data?.orderId,
    slPrice: slRes.success ? slPrice : undefined,
    slError: slRes.error,
    tpOrderId: tpRes.data?.algoId || tpRes.data?.orderId,
    tpPrice: tpRes.success ? tpPrice : undefined,
    tpError: tpRes.error,
  }
}

export const submitTestnetTestBracketOrder = submitTestBracketOrder

// Executes a live or testnet bracket order on Binance Futures from a verified trade signal setup:
// 1. Configures ISOLATED margin mode.
// 2. Sets leverage up to user's max leverage cap.
// 3. Dynamically sizes units based on live available USDT balance and risk %.
// 4. Submits MARKET entry order.
// 5. Submits primary STOP_MARKET conditional order.
// 6. Submits multi-tier TAKE_PROFIT_MARKET conditional orders (TP1 40%, TP2 35%, TP3 25%).
export async function submitSignalBracketOrder(
  apiKey: string,
  apiSecret: string,
  setup: {
    symbol?: string
    direction: 'BUY' | 'SELL'
    entryPrice: number
    stopLoss: number
    tp1?: number
    tp2?: number
    tp3?: number
    riskPct?: number
    maxLeverage?: number
    tpStrategy?: string
  },
  isTestnet = false
): Promise<{
  success: boolean
  status?: string
  message?: string
  symbol?: string
  direction?: string
  closedPrevious?: boolean
  previousSide?: string
  entryOrderId?: number
  entryPrice?: number
  filledUnits?: number
  slOrderId?: number
  slPrice?: number
  slError?: string
  tp1OrderId?: number
  tp1Price?: number
  tp2OrderId?: number
  tp2Price?: number
  tp3OrderId?: number
  tp3Price?: number
  error?: string
}> {
  const symbol = setup.symbol || 'BTCUSDT'
  const direction = setup.direction.toUpperCase() as 'BUY' | 'SELL'
  const exitSide = direction === 'BUY' ? 'SELL' : 'BUY'
  const maxLev = Math.min(setup.maxLeverage || 3, 5)
  const riskPct = setup.riskPct || 1.0

  // 1. Ensure isolated margin & configured leverage
  await setBinanceFuturesMarginType(apiKey, apiSecret, symbol, 'ISOLATED', isTestnet)
  await setBinanceFuturesLeverage(apiKey, apiSecret, symbol, maxLev, isTestnet)

  // 2. Inspect existing open positions for the target symbol
  const accDetails = await fetchBinanceFuturesAccountDetails(apiKey, apiSecret, isTestnet)

  // 2a. Position Concurrency & Reversal Guard:
  // Inspect existing open positions for the target symbol.
  const activePos = accDetails.positions?.find(
    (p) => p.symbol === symbol && Math.abs(p.positionAmt) > 0.0001
  )

  let previousClosed = false
  let previousSide: 'BUY' | 'SELL' | undefined
  let previousUnits: number | undefined
  let previousEntry: number | undefined

  if (activePos) {
    const currentSide = activePos.side === 'LONG' ? 'BUY' : 'SELL'
    if (currentSide === direction) {
      // OPTION A: Same-direction signal arrives while position is already open.
      // Keep original trade running with original entry price and brackets!
      return {
        success: true,
        symbol,
        direction,
        status: 'PRESERVED_EXISTING',
        message: `[OPTION A] Preserved active ${direction} position (${activePos.positionAmt} BTC @ $${activePos.entryPrice.toLocaleString()}). Redundant entry skipped.`,
        entryPrice: activePos.entryPrice,
        filledUnits: activePos.positionAmt,
      }
    }

    // Opposite side: Market Reversal
    previousClosed = true
    previousSide = currentSide
    previousUnits = activePos.positionAmt
    previousEntry = activePos.entryPrice

    // Reset/Exit previous trade immediately at market with reduceOnly
    const closeSide = activePos.side === 'LONG' ? 'SELL' : 'BUY'
    await placeBinanceFuturesOrder(
      apiKey,
      apiSecret,
      {
        symbol,
        side: closeSide,
        type: 'MARKET',
        quantity: activePos.positionAmt.toFixed(3),
        reduceOnly: 'true',
      },
      isTestnet
    )

    // Flush all pending orders (old SL/TP brackets)
    await cancelAllBinanceFuturesOrders(apiKey, apiSecret, symbol, isTestnet)

    // Small delay (250ms) for Binance matching engine to finalize position close and release margin
    await new Promise((r) => setTimeout(r, 250))
  }

  // 3. Pre-flight balance check and dynamic unit sizing
  const freshAcc = previousClosed
    ? await fetchBinanceFuturesAccountDetails(apiKey, apiSecret, isTestnet)
    : accDetails
  const availableBal = freshAcc.success ? freshAcc.availableBalance : accDetails.availableBalance

  let totalUnits = 0.001
  if (availableBal > 0) {
    const riskUsd = availableBal * (riskPct / 100.0)
    const slDist = Math.abs(setup.entryPrice - setup.stopLoss)
    if (slDist > 0) {
      const rawUnits = riskUsd / slDist
      totalUnits = Math.max(0.001, Math.floor(rawUnits * 1000) / 1000)
    }

    // Leverage safety cap
    const maxNotional = availableBal * maxLev * 0.95
    const currentNotional = totalUnits * setup.entryPrice
    if (currentNotional > maxNotional && maxNotional > 5.0) {
      const cappedUnits = Math.max(0.001, Math.floor((maxNotional / setup.entryPrice) * 1000) / 1000)
      totalUnits = cappedUnits
    }
  }
  totalUnits = parseFloat(totalUnits.toFixed(3))

  // 3. Market Entry Order
  const entryRes = await placeBinanceFuturesOrder(
    apiKey,
    apiSecret,
    {
      symbol,
      side: direction,
      type: 'MARKET',
      quantity: totalUnits.toFixed(3),
    },
    isTestnet
  )

  if (!entryRes.success || !entryRes.data) {
    return {
      success: false,
      error: `Entry order failed: ${entryRes.error || 'Unknown error'}`,
    }
  }

  const entryOrderId = entryRes.data.orderId
  const avgPrice = parseFloat(entryRes.data.avgPrice || '0')
  const cumQuote = parseFloat(entryRes.data.cumQuote || '0')
  const executedQty = parseFloat(entryRes.data.executedQty || '0')

  let fillPrice = avgPrice
  if (fillPrice <= 0 && cumQuote > 0 && executedQty > 0) {
    fillPrice = cumQuote / executedQty
  }
  if (fillPrice <= 0) {
    fillPrice = setup.entryPrice
  }

  // 4. Primary Stop Loss (STOP_MARKET)
  const slPrice = Math.round(setup.stopLoss * 10) / 10
  const slRes = await placeBinanceFuturesAlgoOrder(
    apiKey,
    apiSecret,
    {
      algoType: 'CONDITIONAL',
      symbol,
      side: exitSide,
      type: 'STOP_MARKET',
      triggerPrice: slPrice.toFixed(1),
      closePosition: 'true',
      workingType: 'MARK_PRICE',
      priceProtect: 'TRUE',
    },
    isTestnet
  )

  // 5. Take Profit Targets (TP1, TP2, TP3)
  let tp1OrderId: number | undefined
  let tp2OrderId: number | undefined
  let tp3OrderId: number | undefined
  const tpStrategy = setup.tpStrategy || 'bank_and_trail'

  if (tpStrategy !== 'quick_bank' && totalUnits >= 0.003 && setup.tp1 && setup.tp2 && setup.tp3) {
    const tp1Qty = parseFloat((Math.floor(totalUnits * 0.40 * 1000) / 1000).toFixed(3))
    const tp2Qty = parseFloat((Math.floor(totalUnits * 0.35 * 1000) / 1000).toFixed(3))
    const tp3Qty = parseFloat((totalUnits - tp1Qty - tp2Qty).toFixed(3))

    const tp1P = Math.round(setup.tp1 * 10) / 10
    const tp2P = Math.round(setup.tp2 * 10) / 10
    const tp3P = Math.round(setup.tp3 * 10) / 10

    const tp1Res = await placeBinanceFuturesAlgoOrder(
      apiKey,
      apiSecret,
      {
        algoType: 'CONDITIONAL',
        symbol,
        side: exitSide,
        type: 'TAKE_PROFIT_MARKET',
        triggerPrice: tp1P.toFixed(1),
        quantity: tp1Qty.toFixed(3),
        reduceOnly: 'true',
        workingType: 'MARK_PRICE',
        priceProtect: 'TRUE',
      },
      isTestnet
    )
    tp1OrderId = tp1Res.data?.algoId || tp1Res.data?.orderId

    const tp2Res = await placeBinanceFuturesAlgoOrder(
      apiKey,
      apiSecret,
      {
        algoType: 'CONDITIONAL',
        symbol,
        side: exitSide,
        type: 'TAKE_PROFIT_MARKET',
        triggerPrice: tp2P.toFixed(1),
        quantity: tp2Qty.toFixed(3),
        reduceOnly: 'true',
        workingType: 'MARK_PRICE',
        priceProtect: 'TRUE',
      },
      isTestnet
    )
    tp2OrderId = tp2Res.data?.algoId || tp2Res.data?.orderId

    const tp3Res = await placeBinanceFuturesAlgoOrder(
      apiKey,
      apiSecret,
      {
        algoType: 'CONDITIONAL',
        symbol,
        side: exitSide,
        type: 'TAKE_PROFIT_MARKET',
        triggerPrice: tp3P.toFixed(1),
        quantity: tp3Qty.toFixed(3),
        reduceOnly: 'true',
        workingType: 'MARK_PRICE',
        priceProtect: 'TRUE',
      },
      isTestnet
    )
    tp3OrderId = tp3Res.data?.algoId || tp3Res.data?.orderId
  } else if (setup.tp1) {
    const tp1P = Math.round(setup.tp1 * 10) / 10
    const tpRes = await placeBinanceFuturesAlgoOrder(
      apiKey,
      apiSecret,
      {
        algoType: 'CONDITIONAL',
        symbol,
        side: exitSide,
        type: 'TAKE_PROFIT_MARKET',
        triggerPrice: tp1P.toFixed(1),
        quantity: totalUnits.toFixed(3),
        reduceOnly: 'true',
        workingType: 'MARK_PRICE',
        priceProtect: 'TRUE',
      },
      isTestnet
    )
    tp1OrderId = tpRes.data?.algoId || tpRes.data?.orderId
  }

  const statusMsg = previousClosed
    ? (previousSide === direction
        ? `Reset: Closed previous ${previousSide} floating trade (${previousUnits} BTC @ $${previousEntry?.toFixed(1)}). Executed fresh ${direction} entry @ ~$${fillPrice.toFixed(1)} | SL: $${slPrice.toFixed(1)} | TP1: $${setup.tp1?.toFixed(1) || 'None'}`
        : `Reversed: Closed previous ${previousSide} trade (${previousUnits} BTC). Executed new ${direction} entry @ ~$${fillPrice.toFixed(1)} | SL: $${slPrice.toFixed(1)} | TP1: $${setup.tp1?.toFixed(1) || 'None'}`)
    : `Executed ${direction} entry @ ~$${fillPrice.toFixed(1)} | SL: $${slPrice.toFixed(1)} | TP1: $${setup.tp1?.toFixed(1) || 'None'}`

  return {
    success: true,
    status: previousClosed ? 'PREVIOUS_CLOSED_AND_NEW_ENTERED' : 'NEW_ORDER_ENTERED',
    message: statusMsg,
    closedPrevious: previousClosed,
    previousSide,
    entryOrderId,
    entryPrice: fillPrice,
    filledUnits: totalUnits,
    slOrderId: slRes.data?.algoId || slRes.data?.orderId,
    slPrice,
    slError: slRes.error,
    tp1OrderId,
    tp1Price: setup.tp1,
    tp2OrderId,
    tp2Price: setup.tp2,
    tp3OrderId,
    tp3Price: setup.tp3,
  }
}

export interface BinanceUserTrade {
  id: number
  orderId: number
  symbol: string
  side: 'BUY' | 'SELL'
  price: number
  qty: number
  realizedPnl: number
  commission: number
  commissionAsset: string
  time: number
  isMaker: boolean
}

export interface BinanceUserTradesResult {
  success: boolean
  trades: BinanceUserTrade[]
  totalRealizedPnl: number
  sessionRealizedPnl: number
  sessionGrossPnl: number
  sessionCommission: number
  sessionNetPnl: number
  sessionClosingTradeCount: number
  totalCommission: number
  netRealizedPnl: number
  closingTradeCount: number
  error?: string
}

// Fetches executed user trades from Binance Futures (/fapi/v1/userTrades)
// and calculates true realized profit, fees, and session PnL.
export async function fetchBinanceFuturesUserTrades(
  apiKey: string,
  apiSecret: string,
  isTestnet = false,
  symbol = 'BTCUSDT',
  limit = 1000,
  startTime?: number,
  sessionStartTime?: number
): Promise<BinanceUserTradesResult> {
  const cleanKey = apiKey.trim()
  const cleanSecret = apiSecret.trim()

  if (!cleanKey || !cleanSecret) {
    return {
      success: false,
      trades: [],
      totalRealizedPnl: 0,
      sessionRealizedPnl: 0,
      sessionGrossPnl: 0,
      sessionCommission: 0,
      sessionNetPnl: 0,
      sessionClosingTradeCount: 0,
      totalCommission: 0,
      netRealizedPnl: 0,
      closingTradeCount: 0,
      error: 'API Key and Secret required.',
    }
  }

  const timestamp = Date.now()
  const recvWindow = 5000
  let queryString = `symbol=${encodeURIComponent(symbol)}&limit=${limit}&timestamp=${timestamp}&recvWindow=${recvWindow}`
  if (startTime) {
    queryString += `&startTime=${startTime}`
  }
  const signature = generateBinanceSignature(queryString, cleanSecret)

  try {
    const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
    const endpoint = `${baseUrl}/fapi/v1/userTrades?${queryString}&signature=${signature}`

    const res = await binanceSecureFetch(endpoint, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': cleanKey,
        'Content-Type': 'application/json',
      },
    })

    const data = await res.json()
    if (!res.ok || data.code) {
      const code = data.code || res.status
      return {
        success: false,
        trades: [],
        totalRealizedPnl: 0,
        sessionRealizedPnl: 0,
        sessionGrossPnl: 0,
        sessionCommission: 0,
        sessionNetPnl: 0,
        sessionClosingTradeCount: 0,
        totalCommission: 0,
        netRealizedPnl: 0,
        closingTradeCount: 0,
        error: formatBinanceErrorMessage(code, data.msg || res.statusText),
      }
    }

    if (!Array.isArray(data)) {
      return {
        success: true,
        trades: [],
        totalRealizedPnl: 0,
        sessionRealizedPnl: 0,
        sessionGrossPnl: 0,
        sessionCommission: 0,
        sessionNetPnl: 0,
        sessionClosingTradeCount: 0,
        totalCommission: 0,
        netRealizedPnl: 0,
        closingTradeCount: 0,
      }
    }

    const trades: BinanceUserTrade[] = data.map((t: any) => ({
      id: Number(t.id),
      orderId: Number(t.orderId),
      symbol: String(t.symbol),
      side: (t.side || (t.buyer ? 'BUY' : 'SELL')).toUpperCase() as 'BUY' | 'SELL',
      price: parseFloat(t.price || '0'),
      qty: parseFloat(t.qty || '0'),
      realizedPnl: parseFloat(t.realizedPnl || '0'),
      commission: parseFloat(t.commission || '0'),
      commissionAsset: String(t.commissionAsset || 'USDT'),
      time: Number(t.time || 0),
      isMaker: Boolean(t.maker),
    }))

    // Sort descending by time (newest first)
    trades.sort((a, b) => b.time - a.time)

    // Calculate totals across returned trades
    const totalRealizedPnl = parseFloat(
      trades.reduce((acc, t) => acc + t.realizedPnl, 0).toFixed(4)
    )
    const totalCommission = parseFloat(
      trades.reduce((acc, t) => acc + t.commission, 0).toFixed(4)
    )
    const netRealizedPnl = parseFloat((totalRealizedPnl - totalCommission).toFixed(4))

    // Session PnL: trades in the current session (local sessionStartTime if provided, or UTC 00:00:00)
    let sessionStartMs = sessionStartTime
    if (!sessionStartMs || isNaN(sessionStartMs)) {
      const today00UTC = new Date()
      today00UTC.setUTCHours(0, 0, 0, 0)
      sessionStartMs = today00UTC.getTime()
    }

    const sessionTrades = trades.filter((t) => t.time >= sessionStartMs)
    const sessionGrossPnl = parseFloat(
      sessionTrades.reduce((acc, t) => acc + t.realizedPnl, 0).toFixed(4)
    )
    const sessionCommission = parseFloat(
      sessionTrades.reduce((acc, t) => acc + t.commission, 0).toFixed(4)
    )
    const sessionNetPnl = parseFloat((sessionGrossPnl - sessionCommission).toFixed(4))
    const sessionClosingTrades = sessionTrades.filter((t) => Math.abs(t.realizedPnl) > 0.00001)

    // True session realized PnL = NET (Gross PnL minus Binance trading fees/commissions)
    // If no trades today, fall back to overall netRealizedPnl
    const sessionRealizedPnl =
      sessionTrades.length > 0 ? sessionNetPnl : netRealizedPnl

    const closingTrades = trades.filter((t) => Math.abs(t.realizedPnl) > 0.00001)

    return {
      success: true,
      trades,
      totalRealizedPnl,
      sessionRealizedPnl,
      sessionGrossPnl,
      sessionCommission,
      sessionNetPnl,
      sessionClosingTradeCount: sessionClosingTrades.length,
      totalCommission,
      netRealizedPnl,
      closingTradeCount: closingTrades.length,
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      trades: [],
      totalRealizedPnl: 0,
      sessionRealizedPnl: 0,
      sessionGrossPnl: 0,
      sessionCommission: 0,
      sessionNetPnl: 0,
      sessionClosingTradeCount: 0,
      totalCommission: 0,
      netRealizedPnl: 0,
      closingTradeCount: 0,
      error: `Network error: ${errMsg}`,
    }
  }
}

export interface BinanceIncomeItem {
  symbol: string
  incomeType: string
  income: number
  asset: string
  info: string
  time: number
  tranId: number
  tradeId: string
}

export interface BinanceIncomeResult {
  success: boolean
  income: BinanceIncomeItem[]
  transfersTotal: number
  fundingTotal: number
  commissionTotal: number
  realizedPnlTotal: number
  error?: string
}

// Fetches complete Binance Futures cash flow history (/fapi/v1/income)
// including transfers, funding fees, realized PnL, and commissions.
export async function fetchBinanceFuturesIncome(
  apiKey: string,
  apiSecret: string,
  isTestnet = false,
  symbol?: string,
  incomeType?: string,
  startTime?: number,
  limit = 1000
): Promise<BinanceIncomeResult> {
  const cleanKey = apiKey.trim()
  const cleanSecret = apiSecret.trim()

  if (!cleanKey || !cleanSecret) {
    return {
      success: false,
      income: [],
      transfersTotal: 0,
      fundingTotal: 0,
      commissionTotal: 0,
      realizedPnlTotal: 0,
      error: 'API Key and Secret required.',
    }
  }

  const timestamp = Date.now()
  const recvWindow = 5000
  let queryString = `limit=${limit}&timestamp=${timestamp}&recvWindow=${recvWindow}`
  if (symbol) queryString += `&symbol=${encodeURIComponent(symbol)}`
  if (incomeType) queryString += `&incomeType=${encodeURIComponent(incomeType)}`
  if (startTime) queryString += `&startTime=${startTime}`
  const signature = generateBinanceSignature(queryString, cleanSecret)

  try {
    const baseUrl = isTestnet ? BINANCE_FUTURES_TESTNET_BASE : BINANCE_FUTURES_LIVE_BASE
    const endpoint = `${baseUrl}/fapi/v1/income?${queryString}&signature=${signature}`

    const res = await binanceSecureFetch(endpoint, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': cleanKey,
        'Content-Type': 'application/json',
      },
    })

    const data = await res.json()
    if (!res.ok || data.code) {
      const code = data.code || res.status
      return {
        success: false,
        income: [],
        transfersTotal: 0,
        fundingTotal: 0,
        commissionTotal: 0,
        realizedPnlTotal: 0,
        error: formatBinanceErrorMessage(code, data.msg || res.statusText),
      }
    }

    if (!Array.isArray(data)) {
      return {
        success: true,
        income: [],
        transfersTotal: 0,
        fundingTotal: 0,
        commissionTotal: 0,
        realizedPnlTotal: 0,
      }
    }

    const income: BinanceIncomeItem[] = data.map((item: any) => ({
      symbol: String(item.symbol || ''),
      incomeType: String(item.incomeType || ''),
      income: parseFloat(item.income || '0'),
      asset: String(item.asset || 'USDT'),
      info: String(item.info || ''),
      time: Number(item.time || 0),
      tranId: Number(item.tranId || 0),
      tradeId: String(item.tradeId || ''),
    }))

    income.sort((a, b) => b.time - a.time)

    let transfersTotal = 0
    let fundingTotal = 0
    let commissionTotal = 0
    let realizedPnlTotal = 0

    for (const item of income) {
      if (item.incomeType === 'TRANSFER') transfersTotal += item.income
      else if (item.incomeType === 'FUNDING_FEE') fundingTotal += item.income
      else if (item.incomeType === 'COMMISSION') commissionTotal += item.income
      else if (item.incomeType === 'REALIZED_PNL') realizedPnlTotal += item.income
    }

    return {
      success: true,
      income,
      transfersTotal: parseFloat(transfersTotal.toFixed(4)),
      fundingTotal: parseFloat(fundingTotal.toFixed(4)),
      commissionTotal: parseFloat(commissionTotal.toFixed(4)),
      realizedPnlTotal: parseFloat(realizedPnlTotal.toFixed(4)),
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      income: [],
      transfersTotal: 0,
      fundingTotal: 0,
      commissionTotal: 0,
      realizedPnlTotal: 0,
      error: `Network error: ${errMsg}`,
    }
  }
}

