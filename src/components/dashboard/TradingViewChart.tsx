'use client'

import React, { useEffect, useRef, memo } from 'react'

interface TradingViewChartProps {
  symbol?: string
  interval?: string
}

function TradingViewChartComponent({
  symbol = 'BINANCE:BTCUSDT.P',
  interval = '15',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Ensure Binance crypto symbols target Perpetual Contracts (.P)
    let resolvedSymbol = symbol
    if (resolvedSymbol.startsWith('BINANCE:') && !resolvedSymbol.endsWith('.P') && !resolvedSymbol.includes('USDTPERP')) {
      resolvedSymbol = `${resolvedSymbol}.P`
    }

    // Avoid duplicate insertions
    container.innerHTML = `
      <div class="tradingview-widget-container__widget" style="height: 100%; width: 100%;"></div>
    `

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: resolvedSymbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(13, 17, 28, 0.85)',
      gridColor: 'rgba(255, 255, 255, 0.04)',
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    })

    container.appendChild(script)

    return () => {
      // Safe cleanup without destroying element during in-flight async load
      if (script && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [symbol, interval])

  return (
    <div className="w-full h-[520px] rounded-xl overflow-hidden border border-white/[0.08] bg-[#0d111c]/80 backdrop-blur-md">
      <div 
        ref={containerRef} 
        className="tradingview-widget-container w-full h-full"
      >
        <div className="tradingview-widget-container__widget w-full h-full" />
      </div>
    </div>
  )
}

export const TradingViewChart = memo(TradingViewChartComponent)

