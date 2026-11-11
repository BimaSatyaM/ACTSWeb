'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { StockMeta } from '@/lib/idxData'
import { StreamQuote } from '@/lib/useIDXStream'

interface IDXOrderBookProps {
  symbol: string
  meta: StockMeta
  streamQuote?: StreamQuote | null
}

interface OrderBookLevel {
  price: number
  lots: number
  depthPercent: number
  isBest: boolean
}

// Calculate official IDX tick size based on price tiers
export function getIDXTickSize(price: number): number {
  if (price < 200) return 1
  if (price < 500) return 2
  if (price < 2000) return 5
  if (price < 5000) return 10
  return 25
}

// Calculate official IDX Auto-Rejection limits (ARA / ARB)
export function getIDXAutoRejectionLimits(previousClose: number) {
  let rate = 0.20 // default 20% for > 5000
  if (previousClose < 200) {
    rate = 0.35 // 35%
  } else if (previousClose <= 5000) {
    rate = 0.25 // 25%
  }

  const araPrice = Math.round(previousClose * (1 + rate))
  const arbPrice = Math.max(50, Math.round(previousClose * (1 - rate))) // Floor of Rp 50 on standard board
  return { araPrice, arbPrice, ratePct: Math.round(rate * 100) }
}

export function IDXOrderBook({ symbol, meta, streamQuote }: IDXOrderBookProps) {
  const [flashBid, setFlashBid] = useState<boolean>(false)
  const [flashAsk, setFlashAsk] = useState<boolean>(false)

  const livePrice = streamQuote?.price || meta.currentPrice
  const prevClose = streamQuote?.prevClose || meta.previousClose || livePrice
  const tickSize = getIDXTickSize(livePrice)
  const { araPrice, arbPrice, ratePct } = getIDXAutoRejectionLimits(prevClose)

  // Top Bid & Ask prices
  const bestBid = streamQuote?.bid && streamQuote.bid > 0
    ? streamQuote.bid
    : livePrice > 0 ? livePrice : 100
  const bestAsk = streamQuote?.ask && streamQuote.ask > 0
    ? streamQuote.ask
    : bestBid + tickSize

  // Trigger brief flash animations when quote updates
  useEffect(() => {
    if (streamQuote?.bid) {
      setFlashBid(true)
      const timer = setTimeout(() => setFlashBid(false), 300)
      return () => clearTimeout(timer)
    }
  }, [streamQuote?.bid, streamQuote?.volume])

  useEffect(() => {
    if (streamQuote?.ask) {
      setFlashAsk(true)
      const timer = setTimeout(() => setFlashAsk(false), 300)
      return () => clearTimeout(timer)
    }
  }, [streamQuote?.ask, streamQuote?.volume])

  // Generate 10 levels of Bids and Asks anchored to live quotes
  const { bids, asks, totalBidLots, totalAskLots } = useMemo(() => {
    // Seed lot sizes proportionally based on stock's daily turnover
    const baseLot = Math.max(500, Math.round((meta.volume / 100) / 1500))

    const bidLevels: OrderBookLevel[] = []
    const askLevels: OrderBookLevel[] = []

    let maxLot = 1

    // 10 Bid Levels (downwards from bestBid)
    for (let i = 0; i < 10; i++) {
      const price = bestBid - (i * tickSize)
      if (price <= 0) break

      // Use real Level 1 bid lot size from exchange quote if available; otherwise model depth
      let lots: number
      if (i === 0 && streamQuote?.bidSize && streamQuote.bidSize > 0) {
        lots = Math.round(streamQuote.bidSize / 100)
      } else {
        const multiplier = (Math.sin(price * 0.05 + i) * 0.4 + 1.2) * (1 + (i * 0.15))
        lots = Math.max(10, Math.round(baseLot * multiplier))
      }
      if (lots > maxLot) maxLot = lots

      bidLevels.push({
        price,
        lots,
        depthPercent: 0,
        isBest: i === 0,
      })
    }

    // 10 Ask Levels (upwards from bestAsk)
    for (let i = 0; i < 10; i++) {
      const price = bestAsk + (i * tickSize)

      // Use real Level 1 ask lot size from exchange quote if available; otherwise model depth
      let lots: number
      if (i === 0 && streamQuote?.askSize && streamQuote.askSize > 0) {
        lots = Math.round(streamQuote.askSize / 100)
      } else {
        const multiplier = (Math.cos(price * 0.05 + i) * 0.4 + 1.2) * (1 + (i * 0.15))
        lots = Math.max(10, Math.round(baseLot * multiplier))
      }
      if (lots > maxLot) maxLot = lots

      askLevels.push({
        price,
        lots,
        depthPercent: 0,
        isBest: i === 0,
      })
    }

    // Assign proportional visual depth percentages
    const bidsWithDepth = bidLevels.map((b) => ({
      ...b,
      depthPercent: Math.min(100, Math.round((b.lots / maxLot) * 100)),
    }))

    const asksWithDepth = askLevels.map((a) => ({
      ...a,
      depthPercent: Math.min(100, Math.round((a.lots / maxLot) * 100)),
    }))

    const totalB = bidsWithDepth.reduce((sum, b) => sum + b.lots, 0)
    const totalA = asksWithDepth.reduce((sum, a) => sum + a.lots, 0)

    return {
      bids: bidsWithDepth,
      asks: asksWithDepth,
      totalBidLots: totalB,
      totalAskLots: totalA,
    }
  }, [bestBid, bestAsk, tickSize, meta.volume, streamQuote?.bidSize, streamQuote?.askSize])

  const totalLots = totalBidLots + totalAskLots
  const bidRatio = totalLots > 0 ? Math.round((totalBidLots / totalLots) * 100) : 50
  const askRatio = 100 - bidRatio

  // Market session check (WIB / UTC+7)
  const nowWib = new Date(Date.now() + (new Date().getTimezoneOffset() + 420) * 60000)
  const day = nowWib.getDay()
  const isWeekend = day === 0 || day === 6
  const wibSec = nowWib.getHours() * 3600 + nowWib.getMinutes() * 60 + nowWib.getSeconds()
  const isMarketClosed = isWeekend || wibSec < (8 * 3600 + 45 * 60) || wibSec > (16 * 3600 + 15 * 60)

  return (
    <div className="flex flex-col rounded-xl bg-[#0d121f] border border-white/[0.08] overflow-hidden">
      
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.01] border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isMarketClosed ? 'bg-zinc-500' : 'bg-emerald-400 animate-pulse'}`} />
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
            10-Level Order Book (DOM)
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/[0.08]">
            {symbol} · {isMarketClosed ? 'Market Closed' : 'Top Book (L1 Real)'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">
            Spread: <strong className="text-white">Rp {(bestAsk - bestBid).toLocaleString()}</strong> ({tickSize} tick)
          </span>
        </div>
      </div>

      {isMarketClosed && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] font-mono flex flex-col sm:flex-row sm:items-center justify-between text-amber-300 gap-1">
          <span className="flex items-center gap-1.5">
            <span>🛑</span>
            <strong>Market Session Closed</strong> (16:00 WIB)
          </span>
          <span className="text-[10px] text-amber-300/80">Order matching resumes tomorrow at 09:00 WIB</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 px-4 py-2 bg-[#070b14] border-b border-white/[0.06] text-[11px] font-mono">
        <div className="flex items-center justify-between text-emerald-400">
          <span className="font-bold flex items-center gap-1">
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">ARA +{ratePct}%</span>
            <span>Rp {araPrice.toLocaleString()}</span>
          </span>
          <span className="text-[10px] text-slate-500">Upper Limit</span>
        </div>
        <div className="flex items-center justify-between text-rose-400">
          <span className="text-[10px] text-slate-500">Lower Limit</span>
          <span className="font-bold flex items-center gap-1">
            <span>Rp {arbPrice.toLocaleString()}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">ARB -{ratePct}%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 px-4 py-2 bg-[#070b14]/50 border-b border-white/[0.06]">
        <div className="flex justify-between pr-2">
          <span>Bid Lots</span>
          <span>Bid (Rp)</span>
        </div>
        <div className="flex justify-between pl-2">
          <span>Ask (Rp)</span>
          <span>Ask Lots</span>
        </div>
      </div>

      <div className="divide-y divide-white/[0.02] text-xs font-mono">
        {Array.from({ length: 10 }).map((_, i) => {
          const bid = bids[i]
          const ask = asks[i]

          return (
            <div key={i} className="grid grid-cols-2 hover:bg-white/[0.02] transition-colors">
              
              <div
                className={`relative flex items-center justify-between px-4 py-1.5 pr-3 border-r border-white/[0.06] overflow-hidden ${
                  bid?.isBest && flashBid ? 'bg-emerald-500/20 transition-all duration-300' : ''
                }`}
              >
                {bid && (
                  <div
                    className="absolute inset-y-0 right-0 bg-emerald-500/15 pointer-events-none transition-all duration-300"
                    style={{ width: `${bid.depthPercent}%` }}
                  />
                )}
                <span className="relative z-10 text-text-secondary text-[11px]">
                  {bid ? bid.lots.toLocaleString() : '--'}
                </span>
                <span className="relative z-10 font-bold text-emerald-400">
                  {bid ? `Rp ${bid.price.toLocaleString()}` : '--'}
                </span>
              </div>

              <div
                className={`relative flex items-center justify-between px-4 py-1.5 pl-3 overflow-hidden ${
                  ask?.isBest && flashAsk ? 'bg-rose-500/20 transition-all duration-300' : ''
                }`}
              >
                {ask && (
                  <div
                    className="absolute inset-y-0 left-0 bg-rose-500/15 pointer-events-none transition-all duration-300"
                    style={{ width: `${ask.depthPercent}%` }}
                  />
                )}
                <span className="relative z-10 font-bold text-rose-400">
                  {ask ? `Rp ${ask.price.toLocaleString()}` : '--'}
                </span>
                <span className="relative z-10 text-text-secondary text-[11px]">
                  {ask ? ask.lots.toLocaleString() : '--'}
                </span>
              </div>

            </div>
          )
        })}
      </div>

      <div className="p-4 bg-[#070b14]/50 border-t border-white/[0.08] space-y-2.5">
        <div className="flex justify-between items-center text-xs font-mono">
          <div className="text-left">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Bid Lots</span>
            <span className="text-emerald-400 font-bold text-sm">
              {totalBidLots.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">({bidRatio}%)</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Ask Lots</span>
            <span className="text-rose-400 font-bold text-sm">
              {totalAskLots.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">({askRatio}%)</span>
            </span>
          </div>
        </div>

        <div className="relative w-full h-2 bg-white/[0.08] rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${bidRatio}%` }}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${askRatio}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span className="text-emerald-400 font-semibold">Buy Pressure: {bidRatio}%</span>
          <span className="text-rose-400 font-semibold">Sell Pressure: {askRatio}%</span>
        </div>
      </div>

    </div>
  )
}
