'use client'

import React, { useState } from 'react'
import { IDXStockChart } from '@/components/dashboard/idx/IDXStockChart'
import { IDXWatchlistTable } from '@/components/dashboard/idx/IDXWatchlistTable'
import { StockMeta, IDX_UNIVERSE } from '@/lib/idxData'

export default function IDXWatchlistPage() {
  const [selectedStock, setSelectedStock] = useState<StockMeta>(IDX_UNIVERSE['BNBR'] || IDX_UNIVERSE['BBCA'])

  const handlePriceUpdate = (price: number, change: number, changePct: number) => {
    setSelectedStock((prev) => ({
      ...prev,
      currentPrice: price,
      changePoints: change,
      changePercent: changePct,
    }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ── Left: Compact Chart Engine with Live Telemetry ── */}
      <div className="lg:col-span-7">
        <IDXStockChart
          key={selectedStock.symbol}
          symbol={selectedStock.symbol}
          meta={selectedStock}
          initialTimeframe="15m"
          height={340}
          showStatsStrip={true}
          onPriceUpdate={handlePriceUpdate}
        />
      </div>

      {/* ── Right: Indonesian Equities List (Beside Chart) ── */}
      <div className="lg:col-span-5">
        <IDXWatchlistTable
          selectedSymbol={selectedStock.symbol}
          onSelectStock={(stock) => setSelectedStock(stock)}
          compact={true}
        />
      </div>
    </div>
  )
}
