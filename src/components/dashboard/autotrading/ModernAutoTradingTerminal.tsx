'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import useSWR from 'swr'
import { BinanceLogo } from '@/components/ui/BinanceLogo'
import { BinancePosition, BinanceOpenOrder, BinanceUserTrade } from '@/lib/binance'
import { useAuth } from '@/context/AuthContext'
import { AutoTradingPerformanceCalendar, AutoTradeRecord } from './AutoTradingPerformanceCalendar'
import { AutoTradingProgressionChart } from './AutoTradingProgressionChart'
import { LivePriceCard } from '@/components/dashboard/LivePriceCard'

const DEFAULT_USDT_TO_IDR = 17730
const BTC_PRICE = 78000

export interface ConnectedAccount {
  apiKey: string
  apiSecret?: string
  isTestnet: boolean
  accountType?: 'FUTURES' | 'SPOT'
  availableBalance: number
  totalWalletBalance: number
  latencyMs: number
  connectedAt: number
}

export function ModernAutoTradingTerminal() {
  const { user } = useAuth()
  const activeEmail = (
    user?.email ||
    (typeof window !== 'undefined' ? localStorage.getItem('acts_user_email') || 'bima@acts.trade' : 'bima@acts.trade')
  ).toLowerCase()

  // Connection State
  const [account, setAccount] = useState<ConnectedAccount | null>(null)
  const [isAutoTrading, setIsAutoTrading] = useState<boolean>(false)
  const [positions, setPositions] = useState<BinancePosition[]>([])
  const [marginRatio, setMarginRatio] = useState<number>(0)

  // Realized Trade PnL & Executed Fills State
  const [sessionPnl, setSessionPnl] = useState<number | null>(null)
  const [sessionGrossPnl, setSessionGrossPnl] = useState<number | null>(null)
  const [sessionCommission, setSessionCommission] = useState<number | null>(null)
  const [sessionNetPnl, setSessionNetPnl] = useState<number | null>(null)
  const [sessionClosingTradeCount, setSessionClosingTradeCount] = useState<number>(0)
  const [totalCommission, setTotalCommission] = useState<number | null>(null)
  const [totalRealizedPnl, setTotalRealizedPnl] = useState<number | null>(null)
  const [netRealizedPnl, setNetRealizedPnl] = useState<number | null>(null)
  const [closingTradeCount, setClosingTradeCount] = useState<number>(0)
  const [userTrades, setUserTrades] = useState<BinanceUserTrade[]>([])

  // API Form State (when connecting)
  const [inputApiKey, setInputApiKey] = useState('')
  const [inputApiSecret, setInputApiSecret] = useState('')
  const [isTestnet, setIsTestnet] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  // Risk & Position Engine State
  const [riskPct, setRiskPct] = useState<number>(1.0)
  const [maxLeverage, setMaxLeverage] = useState<number>(3)
  const [tpStrategy, setTpStrategy] = useState<'bank_and_trail' | 'quick_bank'>('bank_and_trail')
  const [capitalUsdt, setCapitalUsdt] = useState<number>(50)
  const [selectedPreset, setSelectedPreset] = useState<number>(0)

  // Live USDT to IDR exchange rate state (defaults to ~17,730 with live CoinGecko polling)
  const [usdtToIdr, setUsdtToIdr] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('acts_usdt_idr_rate')
      if (cached && !isNaN(Number(cached)) && Number(cached) > 10000) {
        return Number(cached)
      }
    }
    return DEFAULT_USDT_TO_IDR
  })

  // Periodically fetch live Tether USDT/IDR exchange rate
  useEffect(() => {
    let isSubscribed = true
    const fetchLiveIdrRate = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=idr', {
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          const data = await res.json()
          const rate = data?.tether?.idr
          if (typeof rate === 'number' && rate > 10000 && isSubscribed) {
            const roundedRate = Math.round(rate)
            setUsdtToIdr(roundedRate)
            localStorage.setItem('acts_usdt_idr_rate', String(roundedRate))
          }
        }
      } catch {
        // Fallback to existing or default rate
      }
    }

    fetchLiveIdrRate()
    const interval = setInterval(fetchLiveIdrRate, 60000)
    return () => {
      isSubscribed = false
      clearInterval(interval)
    }
  }, [])

  // Status notification
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Binance Open Orders & Execution State
  const [openOrders, setOpenOrders] = useState<BinanceOpenOrder[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isCancellingAll, setIsCancellingAll] = useState(false)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)

  // Fetch latest active confluence signal so LivePriceCard & Execution Bridge always have rich signal context
  const signalsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-signals?limit=1`
  const { data: signalsData } = useSWR(signalsUrl, (url: string) => fetch(url).then((res) => res.json()), {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  })
  const latestSignal = signalsData?.signals?.[0]

  const [executionLogs, setExecutionLogs] = useState<
    Array<{ id: string; time: string; msg: string; type: 'info' | 'success' | 'warn' }>
  >([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      msg: 'Execution bridge initialized. Ready for Testnet bracket orders.',
      type: 'info',
    },
  ])

  // Helper to add timestamped execution logs with localStorage persistence (capped at 20 entries)
  const addExecutionLog = (msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setExecutionLogs((prev) => {
      const next = [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          time: new Date().toLocaleTimeString(),
          msg,
          type,
        },
        ...prev.slice(0, 19),
      ]
      try {
        localStorage.setItem('acts_execution_logs', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  // Restore execution logs from localStorage immediately on mount (filtered and capped at 20)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('acts_execution_logs')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out diagnostic health checks, parameter-less test pings, resolved Buffer errors, and non-execution audit logs
          const cleaned = parsed
            .filter(
              (item: any) =>
                !item.msg?.includes('Missing required trade parameters') &&
                !item.msg?.includes('Buffer is not defined') &&
                !item.msg?.includes('if you believe you received this message') &&
                !item.msg?.includes('[LAST SIGNAL]') &&
                !item.msg?.includes('Below threshold') &&
                !item.msg?.includes('Emitted > 30m ago') &&
                !item.msg?.includes('13.229.110.191') &&
                !item.msg?.includes('52.69.176.199') &&
                !item.msg?.includes('43.206.136.34')
            )
            .slice(0, 20)
          setExecutionLogs(cleaned)
          localStorage.setItem('acts_execution_logs', JSON.stringify(cleaned))
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Synchronizes real executed fills to client-side localStorage for Calendar & Progression Chart
  // Reconstructs distinct signal trade cycles from Binance fills so that multi-tier TP (TP1/TP2/TP3)
  // or multi-fill SL bracket exits count as ONE signal outcome (1 TP or 1 SL per signal).
  const syncTradesToLocalStorage = (trades: BinanceUserTrade[], statsResetAt?: string | null) => {
    try {
      let resetTime = 0
      if (statsResetAt) {
        resetTime = new Date(statsResetAt).getTime()
      } else {
        const localReset = localStorage.getItem('acts_stats_reset_at')
        if (localReset) resetTime = Number(localReset) || 0
      }

      const eligibleTrades = resetTime > 0 ? (trades || []).filter((t) => t.time >= resetTime) : (trades || [])

      if (eligibleTrades.length === 0) {
        localStorage.setItem('acts_autotrade_executions', JSON.stringify([]))
        window.dispatchEvent(new Event('acts_executions_updated'))
        return
      }

      // Sort chronologically ascending (oldest first, newest last)
      const sorted = [...eligibleTrades].sort((a, b) => a.time - b.time)

      interface TradeCycle {
        startTime: number
        endTime: number
        symbol: string
        direction: 'LONG' | 'SHORT'
        entryPrice: number
        exitPrice?: number
        entryQty: number
        entryFills: BinanceUserTrade[]
        exitFills: BinanceUserTrade[]
        totalRealizedPnl: number
        totalCommission: number
      }

      let netPos = 0
      let activeCycle: TradeCycle | null = null
      const completedCycles: TradeCycle[] = []

      for (const t of sorted) {
        const signedQty = t.side === 'BUY' ? t.qty : -t.qty
        const prevPos = netPos
        netPos = parseFloat((netPos + signedQty).toFixed(6))

        // Flat tracking (no position currently active)
        if (Math.abs(prevPos) < 1e-6) {
          // If fill has realizedPnl despite flat tracking, it was an exit of an untracked earlier position
          if (Math.abs(t.realizedPnl) > 1e-5) {
            const isShort = t.side === 'BUY'
            const estEntry = t.qty > 0
              ? isShort ? t.price + (t.realizedPnl / t.qty) : t.price - (t.realizedPnl / t.qty)
              : t.price
            completedCycles.push({
              startTime: t.time,
              endTime: t.time,
              symbol: t.symbol,
              direction: isShort ? 'SHORT' : 'LONG',
              entryPrice: parseFloat(estEntry.toFixed(1)),
              exitPrice: parseFloat(t.price.toFixed(1)),
              entryQty: t.qty,
              entryFills: [],
              exitFills: [t],
              totalRealizedPnl: t.realizedPnl,
              totalCommission: t.commission,
            })
            netPos = 0
            continue
          }

          // New signal entry
          activeCycle = {
            startTime: t.time,
            endTime: t.time,
            symbol: t.symbol,
            direction: signedQty > 0 ? 'LONG' : 'SHORT',
            entryPrice: t.price,
            entryQty: Math.abs(signedQty),
            entryFills: [t],
            exitFills: [],
            totalRealizedPnl: 0,
            totalCommission: t.commission,
          }
        } else {
          // We have an existing position
          const isEntryAdd = Math.sign(signedQty) === Math.sign(prevPos)

          if (isEntryAdd) {
            if (activeCycle) {
              activeCycle.entryQty += Math.abs(signedQty)
              activeCycle.entryFills.push(t)
              activeCycle.totalCommission += t.commission
              const totalCost = activeCycle.entryFills.reduce((acc, f) => acc + f.price * f.qty, 0)
              activeCycle.entryPrice = totalCost / activeCycle.entryQty
            }
          } else {
            // Exit fill (TP1, TP2, TP3 or SL trigger)
            if (activeCycle) {
              activeCycle.exitFills.push(t)
              activeCycle.totalRealizedPnl += t.realizedPnl
              activeCycle.totalCommission += t.commission
              activeCycle.endTime = t.time

              if (Math.abs(netPos) < 1e-6) {
                // Fully closed signal cycle
                completedCycles.push(activeCycle)
                activeCycle = null
              } else if (Math.sign(netPos) !== Math.sign(prevPos)) {
                // Position reversed into opposite direction
                completedCycles.push(activeCycle)
                activeCycle = {
                  startTime: t.time,
                  endTime: t.time,
                  symbol: t.symbol,
                  direction: netPos > 0 ? 'LONG' : 'SHORT',
                  entryPrice: t.price,
                  entryQty: Math.abs(netPos),
                  entryFills: [t],
                  exitFills: [],
                  totalRealizedPnl: 0,
                  totalCommission: 0,
                }
              }
            } else {
              const isShort = t.side === 'BUY'
              const estEntry = t.qty > 0
                ? isShort ? t.price + (t.realizedPnl / t.qty) : t.price - (t.realizedPnl / t.qty)
                : t.price
              completedCycles.push({
                startTime: t.time,
                endTime: t.time,
                symbol: t.symbol,
                direction: isShort ? 'SHORT' : 'LONG',
                entryPrice: parseFloat(estEntry.toFixed(1)),
                exitPrice: parseFloat(t.price.toFixed(1)),
                entryQty: t.qty,
                entryFills: [],
                exitFills: [t],
                totalRealizedPnl: t.realizedPnl,
                totalCommission: t.commission,
              })
            }
          }
        }
      }

      // Include activeCycle if it has exit fills executed
      if (activeCycle && activeCycle.exitFills.length > 0) {
        completedCycles.push(activeCycle)
      }

      // Map completed signal cycles to AutoTradeRecord with exactly 1 outcome per signal
      const formattedExecutions: AutoTradeRecord[] = completedCycles.map((cycle, idx) => {
        // Realized PnL occurs when the position is EXITED, not when it is opened.
        // Use exit timestamp (cycle.endTime) so profit is attributed to the day it was realized.
        const outcomeTime = cycle.endTime || cycle.startTime
        const d = new Date(outcomeTime)

        // Use local calendar date (YYYY-MM-DD) so it matches the user's browser local date
        // (e.g. Asia/Jakarta UTC+7) rather than UTC .toISOString() which causes a 1-day lag.
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        // Net PnL = Realized PnL minus Binance trading commissions/fees
        const netRealized = cycle.totalRealizedPnl - (cycle.totalCommission || 0)
        const isWin = netRealized > 0.0001

        let exitPrice = cycle.exitPrice
        if (cycle.exitFills.length > 0) {
          const exitCost = cycle.exitFills.reduce((acc, f) => acc + f.price * f.qty, 0)
          const exitUnits = cycle.exitFills.reduce((acc, f) => acc + f.qty, 0)
          if (exitUnits > 0) {
            exitPrice = exitCost / exitUnits
          }
        }
        const finalExitPrice = parseFloat((exitPrice || cycle.entryPrice).toFixed(1))
        const finalEntryPrice = parseFloat(cycle.entryPrice.toFixed(1))

        // Determine target tier reached
        let targetHit: 'TP1' | 'TP2' | 'TP3' | 'SL' = 'SL'
        if (isWin) {
          const profitFills = cycle.exitFills.filter((f) => f.realizedPnl > 0.0001)
          const pointsDiff = Math.abs(finalExitPrice - finalEntryPrice)
          if (profitFills.length >= 3 || pointsDiff >= 400) {
            targetHit = 'TP3'
          } else if (profitFills.length === 2 || pointsDiff >= 250) {
            targetHit = 'TP2'
          } else {
            targetHit = 'TP1'
          }
        }

        const estMargin = (finalEntryPrice * (cycle.entryQty || 0.001)) / 2
        const pnlPct = estMargin > 0
          ? parseFloat(((netRealized / estMargin) * 100).toFixed(2))
          : parseFloat(((netRealized / 50.0) * 100).toFixed(2))

        const pnlUsdt = parseFloat(netRealized.toFixed(2))

        return {
          id: `binance-signal-${cycle.startTime}-${idx}`,
          date: dateStr,
          time: timeStr,
          symbol: cycle.symbol,
          direction: cycle.direction,
          leverage: 2,
          entryPrice: finalEntryPrice,
          exitPrice: finalExitPrice,
          confluenceScore: 57.3,
          outcome: isWin ? 'TP_HIT' : 'SL_HIT',
          targetHit,
          pnlUsdt,
          pnlPct,
          note: `Signal Trade #${idx + 1} • ${cycle.exitFills.length} fills • Fees: $${cycle.totalCommission.toFixed(3)} USDT`,
          timestamp: outcomeTime,
        }
      })

      localStorage.setItem('acts_autotrade_executions', JSON.stringify(formattedExecutions))
      window.dispatchEvent(new Event('acts_executions_updated'))
    } catch {
      // ignore
    }
  }

  // Refresh Account Balances & Live Positions & Trades from Binance
  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefreshBalance = async (targetAccount = account, silent = false) => {
    if (!targetAccount?.apiKey) return
    if (!silent) setIsRefreshing(true)

    try {
      const res = await fetch('/api/binance/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: targetAccount.apiKey,
          apiSecret: targetAccount.apiSecret || '',
          isTestnet: targetAccount.isTestnet,
          email: activeEmail,
          symbol: 'BTCUSDT',
          sessionStartTime: new Date().setHours(0, 0, 0, 0),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        const updated: ConnectedAccount = {
          ...targetAccount,
          availableBalance: data.availableBalance,
          totalWalletBalance: data.totalWalletBalance,
          latencyMs: data.latencyMs,
          connectedAt: Date.now(),
        }
        setAccount(updated)
        setPositions(data.positions || [])
        setMarginRatio(data.marginRatio || 0)

        if (typeof data.sessionPnl === 'number') {
          setSessionPnl(data.sessionPnl)
          localStorage.setItem('acts_session_pnl', String(data.sessionPnl))
        }
        if (typeof data.sessionGrossPnl === 'number') setSessionGrossPnl(data.sessionGrossPnl)
        if (typeof data.sessionCommission === 'number') setSessionCommission(data.sessionCommission)
        if (typeof data.sessionNetPnl === 'number') setSessionNetPnl(data.sessionNetPnl)
        if (typeof data.sessionClosingTradeCount === 'number') setSessionClosingTradeCount(data.sessionClosingTradeCount)
        if (typeof data.netRealizedPnl === 'number') {
          setNetRealizedPnl(data.netRealizedPnl)
        }
        if (typeof data.totalCommission === 'number') {
          setTotalCommission(data.totalCommission)
        }
        if (typeof data.totalRealizedPnl === 'number') {
          setTotalRealizedPnl(data.totalRealizedPnl)
        }
        if (typeof data.closingTradeCount === 'number') {
          setClosingTradeCount(data.closingTradeCount)
        }
        if (data.statsResetAt) {
          localStorage.setItem('acts_stats_reset_at', String(new Date(data.statsResetAt).getTime()))
        }
        if (Array.isArray(data.trades)) {
          const resetTime = data.statsResetAt
            ? new Date(data.statsResetAt).getTime()
            : Number(localStorage.getItem('acts_stats_reset_at') || 0)
          const validTrades = resetTime > 0 ? data.trades.filter((t: any) => t.time >= resetTime) : data.trades
          setUserTrades(validTrades)
          syncTradesToLocalStorage(validTrades, data.statsResetAt)
        }

        localStorage.setItem('acts_binance_account', JSON.stringify(updated))
        if (!silent) {
          setStatusMsg({
            text: `Synced: $${data.availableBalance.toFixed(2)} USDT available (${data.latencyMs}ms)`,
            type: 'success',
          })
        }
      }
    } catch {
      if (!silent) {
        setStatusMsg({ text: 'Failed to refresh Binance balances.', type: 'error' })
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false)
        setTimeout(() => setStatusMsg(null), 3000)
      }
    }
  }

  // Reset Performance Stats & Calendar History
  const [isResettingStats, setIsResettingStats] = useState(false)
  const handleResetStats = async () => {
    if (!activeEmail) return
    const confirmed = window.confirm(
      'Are you sure you want to reset your auto-trading performance stats and calendar? This will clear historical test execution logs and start fresh from now.'
    )
    if (!confirmed) return

    setIsResettingStats(true)
    try {
      const res = await fetch('/api/binance/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeEmail, resetStats: true }),
      })
      if (res.ok) {
        const nowMs = Date.now()
        localStorage.setItem('acts_stats_reset_at', String(nowMs))
        localStorage.setItem('acts_autotrade_executions', JSON.stringify([]))
        localStorage.setItem('acts_session_pnl', '0')
        setUserTrades([])
        setSessionPnl(0)
        setSessionGrossPnl(0)
        setSessionNetPnl(0)
        setNetRealizedPnl(0)
        setTotalRealizedPnl(0)
        setTotalCommission(0)
        setClosingTradeCount(0)
        window.dispatchEvent(new Event('acts_executions_updated'))
        setStatusMsg({ text: 'Performance stats and calendar reset successfully!', type: 'success' })
        setTimeout(() => handleRefreshBalance(account, true), 1000)
      }
    } catch {
      setStatusMsg({ text: 'Failed to reset stats.', type: 'error' })
    } finally {
      setIsResettingStats(false)
    }
  }

  // Fetch Open Orders from Binance
  const handleFetchOpenOrders = async (targetAccount = account) => {
    if (!targetAccount?.apiKey) return
    setIsLoadingOrders(true)
    try {
      const res = await fetch('/api/binance/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: targetAccount.apiKey,
          apiSecret: targetAccount.apiSecret || '',
          isTestnet: targetAccount.isTestnet,
          email: activeEmail,
          symbol: 'BTCUSDT',
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setOpenOrders(data.orders || [])
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingOrders(false)
    }
  }

  // 1. Restore local cache immediately on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('acts_binance_account')
      if (saved) {
        const parsed: ConnectedAccount = JSON.parse(saved)
        setAccount(parsed)
        handleRefreshBalance(parsed, true)
        handleFetchOpenOrders(parsed)
      }
      const savedPnl = localStorage.getItem('acts_session_pnl')
      if (savedPnl !== null && !isNaN(parseFloat(savedPnl))) {
        setSessionPnl(parseFloat(savedPnl))
      }
      const savedActive = localStorage.getItem('acts_autotrading_active')
      if (savedActive && saved) {
        setIsAutoTrading(savedActive === 'true')
      }
      const savedLogs = localStorage.getItem('acts_execution_logs')
      if (savedLogs) {
        try {
          const parsed = JSON.parse(savedLogs)
          if (Array.isArray(parsed)) {
            const cleaned = parsed
              .filter(
                (item: any) =>
                  !item.msg?.includes('Missing required trade parameters') &&
                  !item.msg?.includes('Buffer is not defined') &&
                  !item.msg?.includes('if you believe you received this message') &&
                  !item.msg?.includes('[LAST SIGNAL]') &&
                  !item.msg?.includes('Below threshold') &&
                  !item.msg?.includes('Emitted > 30m ago') &&
                  !item.msg?.includes('13.229.110.191') &&
                  !item.msg?.includes('52.69.176.199') &&
                  !item.msg?.includes('43.206.136.34') &&
                  !item.msg?.includes('3.1.80.47')
              )
              .slice(0, 20)
            setExecutionLogs(cleaned)
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // 2. Query Supabase for cloud-saved credentials & true autopilot state
  useEffect(() => {
    if (!activeEmail) return

    const loadCloudCredentials = async () => {
      try {
        const res = await fetch(`/api/binance/credentials?email=${encodeURIComponent(activeEmail)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.exists) {
            setAccount((prev) => ({
              apiKey: data.keyMask || prev?.apiKey || 'Linked API',
              apiSecret: prev?.apiSecret || '',
              isTestnet: data.isTestnet,
              availableBalance: data.availableBalance || prev?.availableBalance || 0,
              totalWalletBalance: data.totalWalletBalance || prev?.totalWalletBalance || 0,
              latencyMs: data.latencyMs || prev?.latencyMs || 0,
              connectedAt: Date.now(),
            }))
            setIsAutoTrading(Boolean(data.isAutoTrading))
            localStorage.setItem('acts_autotrading_active', String(data.isAutoTrading))
            if (typeof data.riskPct === 'number') setRiskPct(data.riskPct)
            if (typeof data.maxLeverage === 'number') setMaxLeverage(data.maxLeverage)
            if (data.tpStrategy === 'bank_and_trail' || data.tpStrategy === 'quick_bank') {
              setTpStrategy(data.tpStrategy)
              localStorage.setItem('acts_tp_strategy', data.tpStrategy)
            }

            if (typeof data.sessionPnl === 'number') {
              setSessionPnl(data.sessionPnl)
              localStorage.setItem('acts_session_pnl', String(data.sessionPnl))
            }
            if (typeof data.sessionGrossPnl === 'number') setSessionGrossPnl(data.sessionGrossPnl)
            if (typeof data.sessionCommission === 'number') setSessionCommission(data.sessionCommission)
            if (typeof data.sessionNetPnl === 'number') setSessionNetPnl(data.sessionNetPnl)
            if (typeof data.sessionClosingTradeCount === 'number') setSessionClosingTradeCount(data.sessionClosingTradeCount)
            if (typeof data.netRealizedPnl === 'number') {
              setNetRealizedPnl(data.netRealizedPnl)
            }
            if (typeof data.totalCommission === 'number') {
              setTotalCommission(data.totalCommission)
            }
            if (typeof data.totalRealizedPnl === 'number') {
              setTotalRealizedPnl(data.totalRealizedPnl)
            }
            if (data.statsResetAt) {
              localStorage.setItem('acts_stats_reset_at', String(new Date(data.statsResetAt).getTime()))
            }
            if (Array.isArray(data.trades)) {
              const resetTime = data.statsResetAt
                ? new Date(data.statsResetAt).getTime()
                : Number(localStorage.getItem('acts_stats_reset_at') || 0)
              const validTrades = resetTime > 0 ? data.trades.filter((t: any) => t.time >= resetTime) : data.trades
              setUserTrades(validTrades)
              syncTradesToLocalStorage(validTrades, data.statsResetAt)
            }
          }
        }
      } catch (cloudErr) {
        console.warn('[AUTOTRADING] Cloud credentials load notice:', cloudErr)
      }
    }

    loadCloudCredentials()
  }, [activeEmail])

  // 3. Real-time synchronization of cloud executions from Supabase event_log
  useEffect(() => {
    const fetchLiveExecutions = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseUrl || !supabaseKey) return

        let clearedAt = 0
        try {
          const c = localStorage.getItem('acts_logs_cleared_at')
          if (c) clearedAt = parseInt(c, 10) || 0
        } catch {}

        const res = await fetch(
          `${supabaseUrl}/rest/v1/event_log?event_type=in.(BinanceTradeExecutedEvent,BinanceTradePreservedEvent,BinanceTradeFailedEvent,SignalFiredEvent)&order=published_at.desc&limit=30`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            signal: AbortSignal.timeout(4000),
          }
        )

        if (res.ok) {
          const events = await res.json()
          if (Array.isArray(events) && events.length > 0) {
            const formatted = events
              .filter((ev: any) => {
                // If user cleared the log, do not restore past events that happened before the clear
                if (ev.published_at && new Date(ev.published_at).getTime() <= clearedAt) {
                  return false
                }
                // Ignore ancient historical events older than 24 hours
                const eventAgeMs = ev.published_at ? Date.now() - new Date(ev.published_at).getTime() : 0
                if (eventAgeMs > 24 * 60 * 60 * 1000) {
                  return false
                }
                const p = typeof ev.payload === 'string' ? JSON.parse(ev.payload) : ev.payload
                if (!p) return false

                if (ev.event_type === 'SignalFiredEvent') {
                  const score = Number(p.confluence_score || p.total_score || 0)
                  return p.tier === 'SIGNAL' || score >= 52.0
                }

                if (!p.direction) return false
                const errStr = String(p.error || '')
                if (
                  errStr.includes('Missing required trade parameters') ||
                  errStr.includes('Buffer is not defined') ||
                  errStr.includes('if you believe you received this message') ||
                  errStr.includes('geoblock') ||
                  errStr.includes('52.69.176.199') ||
                  errStr.includes('43.206.136.34') ||
                  errStr.includes('13.229.110.191') ||
                  errStr.includes('3.1.80.47')
                ) {
                  return false
                }
                return true
              })
              .map((ev: any) => {
                const p = typeof ev.payload === 'string' ? JSON.parse(ev.payload) : ev.payload
                const timeStr = ev.published_at ? new Date(ev.published_at).toLocaleTimeString() : 'Just now'
                if (ev.event_type === 'SignalFiredEvent') {
                  const setup = p.setup_context || {}
                  const score = Number(p.confluence_score || p.total_score || 0)
                  const dir = setup.direction || p.direction || 'BUY'
                  const entry = Number(setup.entry_price || p.entry_price || 0)
                  const sl = Number(setup.stop_loss || p.stop_loss || 0)
                  return {
                    id: ev.event_id,
                    time: timeStr,
                    msg: `[SIGNAL DETECTED 🎯] ${dir} BTCUSDT (Score: ${score.toFixed(1)}) | Entry: ~$${entry.toLocaleString()} | SL: $${sl.toLocaleString()}`,
                    type: 'info' as const,
                  }
                }
                if (ev.event_type === 'BinanceTradePreservedEvent') {
                  return {
                    id: ev.event_id,
                    time: timeStr,
                    msg: `[24/7 CLOUD 🛡️] Same-direction ${p.direction} signal: Preserved active trade @ $${Number(p.entry_price).toFixed(1)}. Redundant entry skipped.`,
                    type: 'info' as const,
                  }
                }
                if (ev.event_type === 'BinanceTradeFailedEvent') {
                  return {
                    id: ev.event_id,
                    time: timeStr,
                    msg: `[EXECUTION FAILED] ${p.direction || ''} ${p.symbol || 'BTCUSDT'}: ${p.error || 'Execution rejected by Binance'}`,
                    type: 'warn' as const,
                  }
                }
                const viaStr = p.executed_via ? ` [${p.executed_via}]` : ''
                return {
                  id: ev.event_id,
                  time: timeStr,
                  msg: `[24/7 CLOUD${viaStr}] ${p.direction} ${p.symbol} Executed #${p.entry_order_id} @ $${Number(p.entry_price).toFixed(1)} | SL: $${Number(p.sl_price).toFixed(1)} | TP1: $${Number(p.tp1_price || 0).toFixed(1)} (Score: ${Number(p.confluence_score || 0).toFixed(1)})`,
                  type: 'success' as const,
                }
              })

            setExecutionLogs((prev) => {
              const existingIds = new Set(prev.map((p) => p.id))
              const newItems = formatted.filter((f) => !existingIds.has(f.id))
              if (newItems.length > 0) {
                const merged = [...newItems, ...prev].slice(0, 20)
                try {
                  localStorage.setItem('acts_execution_logs', JSON.stringify(merged))
                } catch {
                  // ignore
                }
                return merged
              }
              return prev.slice(0, 20)
            })
          }
        }
      } catch {
        // ignore
      }
    }

    fetchLiveExecutions()
    const interval = setInterval(fetchLiveExecutions, 8000)
    return () => clearInterval(interval)
  }, [])

  // Auto-sync positions, balance, and open orders every 20 seconds while local keys exist
  useEffect(() => {
    if (account?.apiKey && account?.apiSecret) {
      const interval = setInterval(() => {
        handleRefreshBalance(account, true)
        handleFetchOpenOrders(account)
      }, 20000)
      return () => clearInterval(interval)
    }
  }, [account?.apiKey, account?.apiSecret, account?.isTestnet])


  // ─────────────────────────────────────────────────────────────
  // 24/7 CLOUD AUTOPILOT MONITORING:
  // Heroku executes all signals autonomously 24/7 in the cloud.
  // The browser terminal operates strictly as a real-time monitor
  // and dashboard — it NEVER dispatches automatic orders to prevent
  // double-execution race conditions.
  // ─────────────────────────────────────────────────────────────
  const lastCloudEventIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!account?.apiKey || !isAutoTrading) return

    const fetchCloudExecutionEvents = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseUrl || !supabaseKey) return

        // Only fetch events published in the last 5 minutes to avoid replaying ancient historical logs
        const recentCutoff = new Date(Date.now() - 300000).toISOString()
        const res = await fetch(
          `${supabaseUrl}/rest/v1/event_log?event_type=in.(BinanceTradeExecutedEvent,BinanceTradePreservedEvent,BinanceTradeFailedEvent,BreakoutShadowSignalEvent,BreakoutShadowTradeClosedEvent)&published_at=gt.${encodeURIComponent(recentCutoff)}&order=published_at.desc&limit=5`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            signal: AbortSignal.timeout(4000),
          }
        )

        if (!res.ok) return
        const events = await res.json()
        if (!Array.isArray(events) || events.length === 0) return

        // Process only events newer than the last seen event
        for (const evt of events.reverse()) {
          if (!lastCloudEventIdRef.current) {
            lastCloudEventIdRef.current = evt.event_id
            continue
          }

          if (evt.event_id <= lastCloudEventIdRef.current) continue
          lastCloudEventIdRef.current = evt.event_id

          const p = typeof evt.payload === 'string' ? JSON.parse(evt.payload) : evt.payload
          if (evt.event_type === 'BinanceTradeExecutedEvent') {
            addExecutionLog(
              `[CLOUD 24/7 🚀] ${p.direction} Executed @ ~$${Number(p.entry_price || 0).toLocaleString()} | SL: $${Number(p.sl_price || 0).toLocaleString()} | TP1: $${Number(p.tp1_price || 0).toLocaleString()} (Order #${p.entry_order_id || 'N/A'})`,
              'success'
            )
            handleRefreshBalance(account, true)
            handleFetchOpenOrders(account)
          } else if (evt.event_type === 'BinanceTradePreservedEvent') {
            addExecutionLog(
              `[CLOUD 24/7 🛡️] Same-direction ${p.direction} signal: Preserved active trade @ $${Number(p.entry_price || 0).toLocaleString()}. Redundant entry skipped.`,
              'info'
            )
          } else if (evt.event_type === 'BinanceTradeFailedEvent') {
            addExecutionLog(`[CLOUD 24/7 ⚠️] Execution failed: ${p.error || 'Unknown error'}`, 'warn')
          } else if (evt.event_type === 'BreakoutShadowSignalEvent') {
            addExecutionLog(
              `[PLAYBOOK B SHADOW 🚀] 1H Trend Breakout: ${p.direction} @ ~$${Number(p.entry_price || 0).toLocaleString()} | SL: $${Number(p.stop_loss || 0).toLocaleString()} | Exit: $${Number(p.channel_exit_price || 0).toLocaleString()} (Macro: ${p.macro_trend})`,
              'info'
            )
          } else if (evt.event_type === 'BreakoutShadowTradeClosedEvent') {
            const rVal = Number(p.realized_r || 0)
            const rText = `${rVal >= 0 ? '+' : ''}${rVal.toFixed(2)}R`
            addExecutionLog(
              `[PLAYBOOK B SHADOW 🏁] Trade Closed (${p.status}) @ ~$${Number(p.exit_price || 0).toLocaleString()} | ${rText} | Held: ${p.bars_held || 0}h`,
              rVal > 0 ? 'success' : 'warn'
            )
          }
        }
      } catch {
        // quiet ignore
      }
    }

    // Initial check and periodic polling every 20s
    fetchCloudExecutionEvents()
    const interval = setInterval(fetchCloudExecutionEvents, 20000)
    return () => clearInterval(interval)
  }, [account?.apiKey, isAutoTrading])

  // Connect & Verify API Credentials (AES-256 Encrypted in Supabase)
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputApiKey.trim() || !inputApiSecret.trim()) {
      setConnectError('Please enter both your Binance API Key and Secret.')
      return
    }

    setIsConnecting(true)
    setConnectError(null)

    try {
      const res = await fetch('/api/binance/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeEmail,
          apiKey: inputApiKey.trim(),
          apiSecret: inputApiSecret.trim(),
          isTestnet,
          riskPct,
          maxLeverage,
          tpStrategy,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const newAcc: ConnectedAccount = {
          apiKey: inputApiKey.trim(),
          apiSecret: inputApiSecret.trim(),
          isTestnet,
          accountType: data.accountType || 'FUTURES',
          availableBalance: data.availableBalance,
          totalWalletBalance: data.totalWalletBalance,
          latencyMs: data.latencyMs,
          connectedAt: Date.now(),
        }
        setAccount(newAcc)
        setIsAutoTrading(true)
        localStorage.setItem('acts_binance_account', JSON.stringify(newAcc))
        localStorage.setItem('acts_autotrading_active', 'true')
        localStorage.setItem('acts_user_email', activeEmail)

        addExecutionLog(
          `[CONNECTED] API Key encrypted with AES-256 & saved in Supabase. Autopilot active on Heroku.`,
          'success'
        )
        setStatusMsg({
          text: `Binance Connected! AES-256 Encrypted & Autopilot ACTIVE ($${data.availableBalance.toFixed(2)} USDT)`,
          type: 'success',
        })
        setTimeout(() => setStatusMsg(null), 5000)
      } else {
        setConnectError(data.error || 'Connection failed. Please check your Binance API credentials.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setConnectError(`Network error: ${msg}`)
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect & Revoke Cloud Autopilot
  const handleDisconnect = async () => {
    setAccount(null)
    setIsAutoTrading(false)
    setPositions([])
    localStorage.removeItem('acts_binance_account')
    localStorage.removeItem('acts_autotrading_active')

    try {
      await fetch(`/api/binance/credentials?email=${encodeURIComponent(activeEmail)}`, {
        method: 'DELETE',
      })
    } catch {
      // ignore
    }

    addExecutionLog('[DISCONNECTED] Exchange credentials removed. Autopilot paused.', 'warn')
    setStatusMsg({ text: 'Binance account disconnected. Cloud auto-pilot paused.', type: 'info' })
    setTimeout(() => setStatusMsg(null), 4000)
  }

  // Toggle Bot Master Switch (Syncs with Supabase 24/7 Heroku Engine)
  const handleToggleBot = async () => {
    if (!account) {
      setStatusMsg({
        text: 'Link your Binance API Key below to activate autonomous execution.',
        type: 'error',
      })
      setTimeout(() => setStatusMsg(null), 4000)
      return
    }

    const next = !isAutoTrading
    setIsAutoTrading(next)
    localStorage.setItem('acts_autotrading_active', String(next))

    try {
      await fetch('/api/binance/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeEmail,
          isAutoTrading: next,
          riskPct,
          maxLeverage,
        }),
      })
    } catch (toggleErr) {
      console.warn('[AUTOTRADING] Error syncing toggle state with Supabase:', toggleErr)
    }

    addExecutionLog(
      next
        ? '[AUTOPILOT ON] 24/7 Cloud Execution active on Heroku. Bracket orders will execute on signals ≥ 52.0.'
        : '[AUTOPILOT OFF] Cloud execution paused.',
      next ? 'success' : 'warn'
    )

    setStatusMsg({
      text: next
        ? 'Auto-Pilot ACTIVE: 24/7 cloud execution running on Heroku (Score ≥ 52.0).'
        : 'Auto-Pilot PAUSED: Cloud execution paused.',
      type: 'success',
    })
    setTimeout(() => setStatusMsg(null), 5000)
  }

  // Handle TP Strategy change (Bank & Trail vs Quick Bank)
  const handleTpStrategyChange = async (strat: 'bank_and_trail' | 'quick_bank') => {
    setTpStrategy(strat)
    localStorage.setItem('acts_tp_strategy', strat)
    if (!activeEmail) return
    try {
      await fetch('/api/binance/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeEmail,
          tpStrategy: strat,
        }),
      })
      addExecutionLog(
        strat === 'bank_and_trail'
          ? '[STRATEGY] Multi-Tier active: Bank cash at TP1, trail runner to TP2/TP3.'
          : '[STRATEGY] Quick Bank active: 100% position exits immediately at TP1.',
        'info'
      )
    } catch (err) {
      console.warn('[AUTOTRADING] Error updating TP strategy:', err)
    }
  }




  // Cancel an individual order
  const handleCancelOrder = async (orderId: number) => {
    if (!account?.apiKey && !activeEmail) return
    setCancellingOrderId(orderId)
    try {
      const res = await fetch('/api/binance/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: account?.apiKey || '',
          apiSecret: account?.apiSecret || '',
          email: activeEmail,
          userEmail: activeEmail,
          isTestnet: account?.isTestnet ?? true,
          action: 'CANCEL',
          symbol: 'BTCUSDT',
          orderId,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatusMsg({ text: `Order #${orderId} cancelled on Binance.`, type: 'success' })
        setOpenOrders((prev) => prev.filter((o) => o.orderId !== orderId))
        addExecutionLog(`[ORDER CANCELLED] #${orderId} removed from Binance.`, 'info')
        setTimeout(() => handleFetchOpenOrders(account), 600)
      } else {
        setStatusMsg({ text: data.error || 'Failed to cancel order.', type: 'error' })
      }
    } catch {
      setStatusMsg({ text: 'Error cancelling order.', type: 'error' })
    } finally {
      setCancellingOrderId(null)
      setTimeout(() => setStatusMsg(null), 4000)
    }
  }

  // Cancel all open orders for symbol
  const handleCancelAllOrders = async () => {
    if (!account?.apiKey && !activeEmail) return
    setIsCancellingAll(true)
    try {
      const res = await fetch('/api/binance/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: account?.apiKey || '',
          apiSecret: account?.apiSecret || '',
          email: activeEmail,
          userEmail: activeEmail,
          isTestnet: account?.isTestnet ?? true,
          action: 'CANCEL_ALL',
          symbol: 'BTCUSDT',
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatusMsg({ text: 'All open orders on Binance flushed.', type: 'success' })
        setOpenOrders([])
        addExecutionLog('[ALL ORDERS FLUSHED] Cancelled all active open orders for BTCUSDT.', 'warn')
        setTimeout(() => handleFetchOpenOrders(account), 600)
      } else {
        setStatusMsg({ text: data.error || 'Failed to flush open orders.', type: 'error' })
      }
    } catch {
      setStatusMsg({ text: 'Network error flushing orders.', type: 'error' })
    } finally {
      setIsCancellingAll(false)
      setTimeout(() => setStatusMsg(null), 4000)
    }
  }

  // Market Close an active position
  const [isClosingPosition, setIsClosingPosition] = useState(false)
  const handleClosePosition = async (pos: BinancePosition) => {
    if (!account?.apiKey && !activeEmail) return
    setIsClosingPosition(true)
    try {
      const exitSide = pos.side === 'LONG' ? 'SELL' : 'BUY'
      const res = await fetch('/api/binance/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: account?.apiKey || '',
          apiSecret: account?.apiSecret || '',
          email: activeEmail,
          userEmail: activeEmail,
          isTestnet: account?.isTestnet ?? true,
          action: 'MARKET_CLOSE',
          symbol: pos.symbol,
          side: exitSide,
          quantity: pos.positionAmt.toFixed(3),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatusMsg({ text: `Closed ${pos.symbol} position @ Market price.`, type: 'success' })
        addExecutionLog(`[POSITION CLOSED] Market exit executed for ${pos.symbol} (${pos.positionAmt} BTC).`, 'info')
        // Cancel orphan orders & refresh
        handleCancelAllOrders()
        handleRefreshBalance(account, true)
      } else {
        setStatusMsg({ text: data.error || 'Failed to close position.', type: 'error' })
      }
    } catch {
      setStatusMsg({ text: 'Error closing position.', type: 'error' })
    } finally {
      setIsClosingPosition(false)
      setTimeout(() => setStatusMsg(null), 4000)
    }
  }

  // Simulator Calculations
  const isConnected = Boolean(account)
  const effectiveCapital = isConnected ? account!.totalWalletBalance : capitalUsdt
  const capitalIdr = Math.round(effectiveCapital * usdtToIdr)
  const riskAmountUsdt = (effectiveCapital * riskPct) / 100
  const riskAmountIdr = Math.round(riskAmountUsdt * usdtToIdr)

  const minContractValue = 0.001 * BTC_PRICE // $78 at 78k
  const positionValueUsdt = Math.max(minContractValue, effectiveCapital * maxLeverage * 0.5)
  const positionBtc = (positionValueUsdt / BTC_PRICE).toFixed(3)
  const canPartialScale = positionValueUsdt >= minContractValue * 3

  // Fee and Net Edge Simulation for ~35 setups/mo
  const monthlyWins = 15
  const monthlyLosses = 6
  const grossMonthlyProfit = monthlyWins * (riskAmountUsdt * 2.2) - monthlyLosses * riskAmountUsdt
  const roundtripFee = positionValueUsdt * 0.001
  const monthlyFees = 25 * roundtripFee
  const netMonthlyProfit = Math.max(0, grossMonthlyProfit - monthlyFees)
  const netMonthlyIdr = Math.round(netMonthlyProfit * usdtToIdr)
  const estMonthlyGainPct = effectiveCapital > 0 ? ((netMonthlyProfit / effectiveCapital) * 100).toFixed(1) : '0.0'

  // Dynamic Ambient Equity Curve built directly from real closed trades
  const ambientCurve = useMemo(() => {
    const closingTrades = userTrades.filter((t) => Math.abs(t.realizedPnl) > 0.00001).reverse()
    if (!isConnected || closingTrades.length === 0) {
      return {
        linePath: 'M 0 80 L 500 80',
        areaPath: 'M 0 80 L 500 80 L 500 100 L 0 100 Z',
      }
    }

    let cum = 0
    const points = [0]
    closingTrades.forEach((t) => {
      cum += t.realizedPnl - (t.commission || 0)
      points.push(cum)
    })

    const maxVal = Math.max(...points, 1)
    const minVal = Math.min(...points, 0)
    const range = maxVal - minVal || 1

    const width = 500
    const height = 100
    const padTop = 15
    const padBottom = 20
    const usableH = height - padTop - padBottom

    const coords = points.map((p, idx) => {
      const x = Math.round((idx / (points.length - 1)) * width)
      const y = Math.round(padTop + usableH - ((p - minVal) / range) * usableH)
      return { x, y }
    })

    const linePath = coords.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')
    const areaPath = `${linePath} L 500 100 L 0 100 Z`

    return { linePath, areaPath }
  }, [isConnected, userTrades])

  // Local calendar day session stats (from 00:00:00 local user time)
  const localTodayStats = useMemo(() => {
    const today00Local = new Date()
    today00Local.setHours(0, 0, 0, 0)
    const todayStartMs = today00Local.getTime()

    const todayTrades = userTrades.filter((t) => t.time >= todayStartMs)
    if (todayTrades.length === 0) {
      return null
    }

    const grossPnl = parseFloat(todayTrades.reduce((acc, t) => acc + t.realizedPnl, 0).toFixed(4))
    const commission = parseFloat(todayTrades.reduce((acc, t) => acc + t.commission, 0).toFixed(4))
    const netPnl = parseFloat((grossPnl - commission).toFixed(4))
    const closingTrades = todayTrades.filter((t) => Math.abs(t.realizedPnl) > 0.0001)

    return {
      netPnl,
      grossPnl,
      commission,
      closingTradeCount: closingTrades.length,
      totalTradeCount: todayTrades.length,
    }
  }, [userTrades])

  const fallbackSignal = {
    entryPrice: 84401.99,
    direction: 'SELL' as const,
    tp1Price: 84140.80,
    stopLossPrice: 84663.18,
    symbol: 'BTC',
  }

  const activePosition = positions.length > 0 ? positions[0] : null
  const tpOrder = openOrders.find((o) => o.type.includes('TAKE_PROFIT') || o.type === 'TAKE_PROFIT_MARKET')
  const slOrder = openOrders.find((o) => o.type.includes('STOP') || o.type === 'STOP_MARKET')

  const cardSymbol = activePosition?.symbol || latestSignal?.payload?.setup_context?.symbol || fallbackSignal.symbol
  const cardEntryPrice = activePosition
    ? activePosition.entryPrice
    : (latestSignal?.payload?.setup_context?.entry_price || fallbackSignal.entryPrice)
  const cardDirection = activePosition
    ? (activePosition.side === 'LONG' ? 'BUY' : 'SELL')
    : (latestSignal?.payload?.confluence_result?.direction || latestSignal?.payload?.setup_context?.direction || fallbackSignal.direction)
  const cardTp1Price = tpOrder
    ? (tpOrder.stopPrice > 0 ? tpOrder.stopPrice : tpOrder.price)
    : (latestSignal?.payload?.setup_context?.tp1?.target_price || fallbackSignal.tp1Price)
  const cardStopLossPrice = slOrder
    ? (slOrder.stopPrice > 0 ? slOrder.stopPrice : slOrder.price)
    : (latestSignal?.payload?.setup_context?.stop_loss || fallbackSignal.stopLossPrice)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono flex items-center justify-between shadow-lg transition-all ${
            statusMsg.type === 'success'
              ? 'bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-[#F0B90B]'
              : statusMsg.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-white hover:opacity-75 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOP MONITORING ROW: HERO TERMINAL + LIVE MARKET PRICE
          Hero Card on Left (lg:col-span-8), Live Market Price on Right (lg:col-span-4)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Master Terminal Hero Card (Binance Futures Connected) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#090d18] border border-white/[0.07] shadow-2xl overflow-hidden flex flex-col justify-between">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/[0.05] bg-white/[0.01]">
            {/* Status Indicator */}
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                {isAutoTrading && isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isAutoTrading && isConnected
                      ? 'bg-[#00e676] shadow-[0_0_8px_#00e676]'
                      : isConnected
                      ? 'bg-[#F0B90B] shadow-[0_0_8px_#F0B90B]'
                      : 'bg-zinc-600'
                  }`}
                />
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-[0.15em] uppercase text-white">
                  {isAutoTrading && isConnected
                    ? 'BOT ACTIVE'
                    : isConnected
                    ? 'BOT STANDBY (CONNECTED)'
                    : 'AUTONOMOUS RADAR (OFFLINE)'}
                </span>
                <span className="text-zinc-500 text-xs hidden sm:inline">•</span>
                <span className="text-xs text-zinc-400 hidden sm:inline font-mono">
                  Playbook A: 15m S/R (Live) • Playbook B: 1H Breakout (Shadow)
                </span>
              </div>
            </div>

            {/* Master Switch & Live Refresh */}
            <div className="flex items-center gap-3">
              {isConnected && (
                <button
                  type="button"
                  onClick={() => handleRefreshBalance(account, false)}
                  disabled={isRefreshing}
                  title="Sync balance from Binance"
                  className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg
                    className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#F0B90B]' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </button>
              )}

              {/* Tactile Capsule Toggle */}
              <button
                type="button"
                onClick={handleToggleBot}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                  isAutoTrading && isConnected
                    ? 'border-[#00e676]/40 bg-[#00e676]/10 text-[#00e676]'
                    : 'border-white/10 bg-black/40 text-zinc-400 hover:border-white/20'
                }`}
              >
                <span className="text-xs font-mono font-bold tracking-wider">
                  {isAutoTrading && isConnected ? 'AUTOPILOT ON' : 'ENABLE BOT'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAutoTrading && isConnected ? 'bg-[#00e676] shadow-[0_0_8px_#00e676]' : 'bg-zinc-600'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Hero Metrics Row (No nested border boxes, just clean confident typography) */}
          <div className="px-6 pt-6 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* 1. Wallet Equity */}
              <div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 block mb-1">
                  Wallet Equity
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                    {isConnected ? `$${account!.totalWalletBalance.toFixed(2)}` : '--'}
                  </span>
                  {isConnected && <span className="text-xs font-mono text-zinc-500">USDT</span>}
                </div>
                <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">
                  {isConnected ? `≈ Rp ${capitalIdr.toLocaleString('id-ID')}` : 'Link account to track'}
                </span>
              </div>

              {/* 2. Available Margin */}
              <div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 block mb-1">
                  Available Margin
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-[#F0B90B] tracking-tight">
                    {isConnected ? `$${account!.availableBalance.toFixed(2)}` : '--'}
                  </span>
                  {isConnected && <span className="text-xs font-mono text-zinc-500">USDT</span>}
                </div>
                <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">
                  {isConnected ? 'Ready for bracket orders' : 'Zero collateral active'}
                </span>
              </div>

              {/* 3. Realized P&L (Session P&L with Fee Transparency) */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                    Session P&L
                  </span>
                </div>

                {(() => {
                  const displayPnl = localTodayStats ? localTodayStats.netPnl : (sessionNetPnl ?? sessionPnl)
                  const displayGross = localTodayStats ? localTodayStats.grossPnl : sessionGrossPnl
                  const displayFees = localTodayStats ? localTodayStats.commission : sessionCommission
                  const displayFills = localTodayStats ? localTodayStats.closingTradeCount : sessionClosingTradeCount

                  return (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        {isConnected && displayPnl !== null ? (
                          <span
                            className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${
                              displayPnl >= 0 ? 'text-[#00e676]' : 'text-rose-400'
                            }`}
                          >
                            {displayPnl >= 0
                              ? `+$${displayPnl.toFixed(2)}`
                              : `-$${Math.abs(displayPnl).toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="text-2xl sm:text-3xl font-mono font-bold text-zinc-600">
                            --
                          </span>
                        )}
                        {isConnected && displayPnl !== null && (
                          <span className="text-xs font-mono text-zinc-500">USDT</span>
                        )}
                      </div>

                      {/* Transparent Breakdown of Gross vs Trading Fees */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                        {isConnected && displayPnl !== null ? (
                          <>
                            <span className="text-zinc-500">{displayFills} fills</span>
                            <span className="text-zinc-600">•</span>
                            <span>
                              Gross:{' '}
                              <strong
                                className={
                                  displayGross !== null && displayGross >= 0
                                    ? 'text-[#00e676]'
                                    : 'text-rose-400'
                                }
                              >
                                {displayGross !== null
                                  ? `${displayGross >= 0 ? '+' : ''}$${displayGross.toFixed(2)}`
                                  : '--'}
                              </strong>
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-amber-400/90 font-medium">
                              Fees: -${(displayFees ?? 0).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-500">Awaiting live trades</span>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Integrated Ambient Equity Curve (Built from real trade progression) */}
            <div className="relative h-24 sm:h-28 w-full mt-4 -mb-2">
              <svg
                viewBox="0 0 500 100"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="modernTerminalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0B90B" stopOpacity={isConnected ? 0.25 : 0.04} />
                    <stop offset="100%" stopColor="#F0B90B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {/* Area Fill */}
                <path
                  d={ambientCurve.areaPath}
                  fill="url(#modernTerminalGrad)"
                />

                {/* Line */}
                <path
                  d={ambientCurve.linePath}
                  fill="none"
                  stroke={isConnected ? '#F0B90B' : '#27272a'}
                  strokeWidth={isConnected ? 2.5 : 1.5}
                  strokeDasharray={isConnected && userTrades.length > 0 ? undefined : '4 4'}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Telemetry Footer Bar */}
          <div className="px-6 py-3 border-t border-white/[0.05] bg-white/[0.01] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[#F0B90B]">
                <BinanceLogo size="xs" />
                <span className="font-semibold text-zinc-200">
                  {isConnected ? 'Binance Futures Connected' : 'Binance Futures Standby'}
                </span>
              </div>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-zinc-400 hidden sm:inline">
                Playbook A: 15m S/R (Live) | Playbook B: 1H Breakout (Shadow)
              </span>
            </div>

            <div className="flex items-center gap-3 text-zinc-500">
              {isConnected ? (
                <>
                  <span>
                    Key: {account!.apiKey.slice(0, 6)}••••{account!.apiKey.slice(-4)}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400">{account!.latencyMs}ms</span>
                </>
              ) : (
                <span>Not Connected</span>
              )}
            </div>
          </div>
        </div>

        {/* Live Market Price Card (Placed Right Beside Binance Futures Connected Box) */}
        <div className="lg:col-span-4">
          <LivePriceCard
            symbol={cardSymbol}
            entryPrice={cardEntryPrice}
            direction={cardDirection}
            tp1Price={cardTp1Price}
            stopLossPrice={cardStopLossPrice}
            compact
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. WORKSPACE GRID: 2 CLEAN COLUMNS (No Box Bloat)
          Left: Connection & Live Positions
          Right: Risk Management & Position Sizing Engine
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols): Binance Account & Positions + Performance Calendar */}
        <div className="lg:col-span-7 space-y-6">
          {/* Binance Futures Connection Card */}
          <div className="rounded-2xl bg-[#090d18] border border-white/[0.07] p-6 shadow-xl space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
            <div className="flex items-center gap-3">
              <BinanceLogo size="sm" variant="badge" />
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Binance Futures Connection
                </h2>
                <p className="text-xs text-text-muted">
                  Non-custodial trading API (funds remain 100% on Binance)
                </p>
              </div>
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-xs font-mono text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Connected State vs Connect Form */}
          {isConnected ? (
            <div className="space-y-4">
              {/* Account Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                    Wallet Equity
                  </span>
                  <span className="text-base font-bold font-mono text-white">
                    ${account!.totalWalletBalance.toFixed(2)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                    Available Margin
                  </span>
                  <span className="text-base font-bold font-mono text-[#F0B90B]">
                    ${account!.availableBalance.toFixed(2)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                    Environment
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {account!.isTestnet ? 'Testnet' : account!.accountType === 'SPOT' ? 'Live Spot' : 'Live Futures'}
                  </span>
                </div>
              </div>

              {/* Active Positions Table or Clean Idle State */}
              {positions.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    Open Futures Contracts ({positions.length})
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="text-zinc-500 border-b border-white/[0.05]">
                          <th className="py-2">Symbol</th>
                          <th className="py-2">Side</th>
                          <th className="py-2">Entry</th>
                          <th className="py-2">Mark</th>
                          <th className="py-2 text-right">PnL</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {positions.map((p, idx) => {
                          const displayMark = p.markPrice > 0 ? p.markPrice : (BTC_PRICE > 0 ? BTC_PRICE : p.entryPrice)
                          const livePnl = p.unRealizedProfit !== 0 ? p.unRealizedProfit : (displayMark - p.entryPrice) * p.positionAmt * (p.side === 'LONG' ? 1 : -1)
                          return (
                            <tr key={idx} className="text-zinc-300">
                              <td className="py-2 font-bold text-white">{p.symbol}</td>
                              <td className="py-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    p.side === 'LONG' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                                  }`}
                                >
                                  {p.side} {p.leverage}x
                                </span>
                              </td>
                              <td className="py-2">${p.entryPrice.toLocaleString()}</td>
                              <td className="py-2">${displayMark.toLocaleString()}</td>
                              <td className="py-2 text-right font-bold">
                                <span className={livePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {livePnl >= 0 ? `+$${livePnl.toFixed(2)}` : `-$${Math.abs(livePnl).toFixed(2)}`}
                                </span>
                              </td>
                              <td className="py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleClosePosition(p)}
                                  disabled={isClosingPosition}
                                  className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-[10px] font-mono cursor-pointer disabled:opacity-50 transition-all"
                                >
                                  {isClosingPosition ? 'Closing...' : 'Close'}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.02] flex items-center justify-between text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Engine standby • Monitoring 15m candles for Score ≥ 52.0</span>
                  </div>
                  <span className="text-zinc-500">{openOrders.length} Open Orders</span>
                </div>
              )}

              {/* Recent Trade Fills (Both Opening & Closing) from Binance Futures */}
              {userTrades.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      Recent Trade Fills (Binance Futures)
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-zinc-400">
                        Today Net:{' '}
                        {(() => {
                          const todayVal = localTodayStats ? localTodayStats.netPnl : sessionNetPnl
                          return (
                            <strong className={todayVal !== null && todayVal >= 0 ? 'text-[#00e676]' : 'text-rose-400'}>
                              {todayVal !== null ? `${todayVal >= 0 ? '+' : ''}$${todayVal.toFixed(2)}` : '--'}
                            </strong>
                          )
                        })()}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-400">
                        All-Time:{' '}
                        <strong className={netRealizedPnl !== null && netRealizedPnl >= 0 ? 'text-[#00e676]' : 'text-rose-400'}>
                          {netRealizedPnl !== null ? `${netRealizedPnl >= 0 ? '+' : ''}$${netRealizedPnl.toFixed(2)}` : '--'}
                        </strong>
                      </span>
                      <button
                        onClick={handleResetStats}
                        disabled={isResettingStats}
                        className="px-2 py-0.5 ml-1 text-[10px] font-mono text-zinc-400 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 rounded transition-colors"
                        title="Reset trade performance history and calendar to start fresh"
                      >
                        {isResettingStats ? 'Resetting...' : 'Reset Stats'}
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="text-zinc-500 border-b border-white/[0.05]">
                          <th className="py-1.5">Time</th>
                          <th className="py-1.5">Side</th>
                          <th className="py-1.5">Price</th>
                          <th className="py-1.5">Qty</th>
                          <th className="py-1.5 text-right">Gross PnL</th>
                          <th className="py-1.5 text-right">Fee (USDT)</th>
                          <th className="py-1.5 text-right">Net Return</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {userTrades
                          .slice(0, 30)
                          .map((t) => {
                            const isEntry = Math.abs(t.realizedPnl) <= 0.0001
                            const fillNet = isEntry ? -(t.commission || 0) : t.realizedPnl - (t.commission || 0)

                            let sideBadge = ''
                            let sideClass = ''
                            if (isEntry) {
                              if (t.side === 'BUY') {
                                sideBadge = 'BUY (Entry)'
                                sideClass = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              } else {
                                sideBadge = 'SELL (Entry)'
                                sideClass = 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                              }
                            } else {
                              if (t.side === 'BUY') {
                                sideBadge = 'BUY (Cover)'
                                sideClass = 'text-emerald-400 bg-emerald-500/10'
                              } else {
                                sideBadge = 'SELL (Exit)'
                                sideClass = 'text-amber-400 bg-amber-500/10'
                              }
                            }

                            return (
                              <tr key={t.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                                <td className="py-1.5 text-zinc-400 text-[11px]">
                                  {new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                                <td className="py-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${sideClass}`}>
                                    {sideBadge}
                                  </span>
                                </td>
                                <td className="py-1.5">${t.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1.5">{t.qty} BTC</td>
                                <td className="py-1.5 text-right font-medium">
                                  {isEntry ? (
                                    <span className="text-zinc-500 font-mono text-[11px]">--</span>
                                  ) : (
                                    <span className={t.realizedPnl >= 0 ? 'text-[#00e676]' : 'text-rose-400'}>
                                      {t.realizedPnl >= 0 ? `+$${t.realizedPnl.toFixed(2)}` : `-$${Math.abs(t.realizedPnl).toFixed(2)}`}
                                    </span>
                                  )}
                                </td>
                                <td className="py-1.5 text-right text-amber-400/90 text-[11px]">
                                  -${(t.commission || 0).toFixed(4)}
                                </td>
                                <td className="py-1.5 text-right font-bold">
                                  {isEntry ? (
                                    <span className="text-zinc-500 text-[11px]">
                                      -${(t.commission || 0).toFixed(4)}
                                    </span>
                                  ) : (
                                    <span className={fillNet >= 0 ? 'text-[#00e676]' : 'text-rose-400'}>
                                      {fillNet >= 0 ? `+$${fillNet.toFixed(2)}` : `-$${Math.abs(fillNet).toFixed(2)}`}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}



              {/* ─────────────────────────────────────────────────────────────
                  ACTIVE BINANCE OPEN ORDERS TABLE
                 ───────────────────────────────────────────────────────────── */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Active Binance Open Orders ({openOrders.length})
                    </span>
                    {isLoadingOrders && (
                      <span className="text-[10px] font-mono text-zinc-500 animate-pulse">Syncing...</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {openOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCancelAllOrders}
                        disabled={isCancellingAll}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-mono text-rose-300 hover:text-rose-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isCancellingAll ? 'Flushing...' : 'Flush All Orders'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleFetchOpenOrders()}
                      disabled={isLoadingOrders}
                      className="text-[11px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {openOrders.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-white/[0.05] bg-white/[0.01]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="text-zinc-500 border-b border-white/[0.05] bg-white/[0.02]">
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Side</th>
                          <th className="py-2.5 px-3">Trigger / Stop</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {openOrders.map((ord) => {
                          const isSl = ord.type === 'STOP_MARKET' || ord.type.includes('STOP')
                          const isTp = ord.type === 'TAKE_PROFIT_MARKET' || ord.type.includes('TAKE_PROFIT')
                          return (
                            <tr key={ord.orderId} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    isSl
                                      ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                                      : isTp
                                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                      : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                                  }`}
                                >
                                  {ord.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold">
                                <span className={ord.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                                  {ord.side}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-white font-bold">
                                {ord.stopPrice > 0 ? `$${ord.stopPrice.toLocaleString()}` : `$${ord.price.toLocaleString()}`}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-400">
                                {ord.closePosition || ord.origQty === 0
                                  ? 'Full Position '
                                  : `${ord.origQty} BTC `}
                                <span className="text-[10px] text-zinc-500">
                                  ({ord.closePosition ? 'Close' : 'Reduce'})
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(ord.orderId)}
                                  disabled={cancellingOrderId === ord.orderId}
                                  className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-rose-500/20 text-[10px] font-mono text-zinc-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {cancellingOrderId === ord.orderId ? '...' : 'Cancel'}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-white/[0.01] border border-dashed border-white/[0.06] text-center text-xs font-mono text-zinc-500">
                    No pending orders on Binance. Orders trigger automatically on score ≥ 52.0.
                  </div>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  EXECUTION LOG AUDIT TRAIL
                 ───────────────────────────────────────────────────────────── */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
                    Execution Bridge Log ({executionLogs.length}/20)
                  </span>
                  {executionLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setExecutionLogs([])
                        try {
                          localStorage.removeItem('acts_execution_logs')
                          localStorage.setItem('acts_logs_cleared_at', Date.now().toString())
                        } catch {}
                      }}
                      className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      Clear Log
                    </button>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-white/[0.05] font-mono text-[11px] max-h-28 overflow-y-auto space-y-1">
                  {executionLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                      <span
                        className={
                          log.type === 'success'
                            ? 'text-emerald-400'
                            : log.type === 'warn'
                            ? 'text-rose-400'
                            : 'text-zinc-300'
                        }
                      >
                        {log.msg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety note */}
              <div className="p-3 rounded-xl bg-white/[0.02] flex items-start gap-2.5 text-xs text-zinc-400 leading-relaxed">
                <span className="text-[#F0B90B] font-bold text-sm">✓</span>
                <span>
                  <strong>Non-custodial active:</strong> Withdrawals are disabled on your API key. ACTS only issues algorithmic bracket orders directly via Binance Futures.
                </span>
              </div>
            </div>
          ) : (
            /* Disconnected Form (Clean, Modern, Anti-Slop) */
            <form onSubmit={handleConnect} className="space-y-4">
              {/* Environment Switcher */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Account Type</label>
                <div className="flex items-center p-1 rounded-lg bg-black/40 border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsTestnet(false)}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                      !isTestnet ? 'bg-[#F0B90B] text-black shadow-md' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Live Futures
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTestnet(true)}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                      isTestnet ? 'bg-[#F0B90B] text-black shadow-md' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Testnet
                  </button>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">API Key</label>
                <input
                  type="text"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder="Paste your Binance API key"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] text-xs font-mono text-white placeholder:text-zinc-600 outline-none transition-all"
                />
              </div>

              {/* API Secret */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">API Secret</label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] font-mono text-zinc-500 hover:text-[#F0B90B] cursor-pointer"
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={inputApiSecret}
                  onChange={(e) => setInputApiSecret(e.target.value)}
                  placeholder="Paste your Binance API secret"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] text-xs font-mono text-white placeholder:text-zinc-600 outline-none transition-all"
                />
              </div>

              {connectError && (
                <p className="text-xs font-mono text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  {connectError}
                </p>
              )}

              {/* Connect Button */}
              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-3 rounded-xl bg-[#F0B90B] hover:bg-[#dca409] text-black font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-lg hover:shadow-[#F0B90B]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="3" strokeDasharray="30" />
                    </svg>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <BinanceLogo size="xs" />
                    <span>Connect &amp; Verify Binance Account</span>
                  </>
                )}
              </button>

              {/* Safety Bullets */}
              <div className="pt-2 text-xs text-zinc-400 space-y-1.5 border-t border-white/[0.05]">
                <p className="flex items-center gap-2">
                  <span className="text-[#F0B90B] font-bold">✓</span>
                  <span><strong>Trade-Only Access:</strong> Enable Futures only. Never enable Withdrawals.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#00e676] font-bold">✓</span>
                  <span><strong>AES-256-GCM Encrypted:</strong> Credentials safely encrypted in Supabase under your account for 24/7 cloud execution.</span>
                </p>
              </div>
            </form>
          )}
          </div>

          {/* Dedicated Auto-Trading Performance Calendar (Tracks Bot Executions Only) */}
          <AutoTradingPerformanceCalendar
            isConnected={isConnected}
            isAutoTrading={isAutoTrading}
            accountBalance={account?.availableBalance}
          />
        </div>

        {/* RIGHT COLUMN (5 Cols): Risk Engine & Sizing Simulator + Target Progression Chart */}
        <div className="lg:col-span-5 space-y-6">
          {/* Risk Engine & Sizing Card */}
          <div className="rounded-2xl bg-[#090d18] border border-white/[0.07] p-6 shadow-xl space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Risk Engine &amp; Sizing
              </h2>
              <p className="text-xs text-text-muted">
                Strict guardrails to protect capital on Bitcoin Futures
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 font-mono text-[10px]">
              V2.4 Guardrails
            </span>
          </div>

          {/* Risk Per Trade Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold">Risk Per Trade</span>
              <span className="font-mono font-bold text-[#F0B90B]">{riskPct.toFixed(1)}% of Equity</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 0.5, label: '0.5% Safe' },
                { val: 1.0, label: '1.0% Standard' },
                { val: 1.5, label: '1.5% Aggressive' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setRiskPct(item.val)}
                  className={`py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer text-center ${
                    riskPct === item.val
                      ? 'bg-[#F0B90B] text-black font-bold shadow-md'
                      : 'bg-white/[0.03] text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Leverage Cap */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold">Max Leverage Safety Cap</span>
              <span className="font-mono font-bold text-white">{maxLeverage}x Isolated</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 5].map((lev) => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => setMaxLeverage(lev)}
                  className={`py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer text-center ${
                    maxLeverage === lev
                      ? 'bg-white/[0.12] text-white font-bold border border-white/20'
                      : 'bg-white/[0.03] text-zinc-400 hover:text-white'
                  }`}
                >
                  {lev}x Leverage
                </button>
              ))}
            </div>
          </div>

          {/* Take Profit & Trailing Strategy Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold">Take Profit Strategy</span>
              <span className="font-mono font-bold text-[#F0B90B]">
                {tpStrategy === 'bank_and_trail' ? 'Bank & Trail (Multi-Tier)' : 'Quick Bank (Single TP1)'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTpStrategyChange('bank_and_trail')}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                  tpStrategy === 'bank_and_trail'
                    ? 'border-[#F0B90B]/50 bg-[#F0B90B]/10 text-white shadow-md'
                    : 'border-white/[0.05] bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-white">Bank &amp; Trail</span>
                  {tpStrategy === 'bank_and_trail' && (
                    <span className="w-2 h-2 rounded-full bg-[#F0B90B] shadow-[0_0_6px_#F0B90B]" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Banks cash at TP1, then trails remaining lots to TP2/TP3 with ratchet SL.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTpStrategyChange('quick_bank')}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                  tpStrategy === 'quick_bank'
                    ? 'border-[#00e676]/50 bg-[#00e676]/10 text-white shadow-md'
                    : 'border-white/[0.05] bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-white">Quick Bank</span>
                  {tpStrategy === 'quick_bank' && (
                    <span className="w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676]" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Closes 100% immediately at TP1 for maximum win rate and instant cash.
                </p>
              </button>
            </div>
          </div>

          {/* Position Size Simulation Output */}
          <div className="p-4 rounded-xl bg-white/[0.02] space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Effective Capital:</span>
              <span className="font-bold text-white">${effectiveCapital.toFixed(2)} USDT (≈ Rp {capitalIdr.toLocaleString('id-ID')})</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Max Dollar Loss per SL (-1.0R):</span>
              <span className="font-bold text-rose-400">-${riskAmountUsdt.toFixed(2)} USDT (Rp {riskAmountIdr.toLocaleString('id-ID')})</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Binance Order Value:</span>
              <span className="font-bold text-white">${positionValueUsdt.toFixed(0)} USDT ({positionBtc} BTC)</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
              <span className="text-white font-semibold">Net Monthly Edge (after fees):</span>
              <span className="font-bold text-[#00e676]">+{estMonthlyGainPct}% (+Rp {netMonthlyIdr.toLocaleString('id-ID')})</span>
            </div>
          </div>

          {/* Capital Preset Buttons (if not connected, allows previewing) */}
          {!isConnected && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-zinc-500 font-mono uppercase block">
                Quick Simulation Presets:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Rp 800.000 ($50)', val: 50 },
                  { label: 'Rp 5.000.000 ($320)', val: 320 },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCapitalUsdt(p.val)
                      setSelectedPreset(idx)
                    }}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      capitalUsdt === p.val
                        ? 'bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clean Hybrid Execution Rule (Anti-Slop Single Line) */}
          <div className="p-3 rounded-xl bg-white/[0.02] text-xs text-zinc-400 leading-relaxed">
            <span className="text-white font-semibold">Hybrid Execution Framework: </span>
            Setups with <strong>Score ≥ 52.0</strong> are auto-executed 24/7 with zero screen time. Setups between <strong>45.0 – 51.9</strong> are sent live to your Telegram as discretionary manual scalp signals.
          </div>
          </div>

          {/* Dedicated Auto-Trading Target Progression Chart */}
          <AutoTradingProgressionChart
            isConnected={isConnected}
            isAutoTrading={isAutoTrading}
          />
        </div>
      </div>
    </div>
  )
}
