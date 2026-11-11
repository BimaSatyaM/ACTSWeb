import React from 'react'
import { getIDXStockLogoUrl } from '@/lib/idxLogos'

interface AssetIconProps {
  symbol: string
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const AssetIcon: React.FC<AssetIconProps> = ({
  symbol = 'BTCUSDT',
  className = '',
  size = 'md',
}) => {
  const cleanSymbol = symbol.toUpperCase().replace(/[-_]/g, '')
  
  // Extract base currency (e.g. BTC from BTCUSDT, ETH from ETHUSDT, XAU from XAUUSD)
  let baseAsset = cleanSymbol
  if (cleanSymbol.endsWith('USDT') && cleanSymbol.length > 4) {
    baseAsset = cleanSymbol.slice(0, -4)
  } else if (cleanSymbol.endsWith('USD') && cleanSymbol.length > 3) {
    baseAsset = cleanSymbol.slice(0, -3)
  } else if (cleanSymbol.endsWith('BUSD') && cleanSymbol.length > 4) {
    baseAsset = cleanSymbol.slice(0, -4)
  }

  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  }[size]

  // Supported Crypto Assets with official logos
  const CRYPTO_ICONS: Record<string, { name: string; shadow: string }> = {
    BTC: { name: 'Bitcoin', shadow: 'shadow-[0_0_12px_rgba(247,147,26,0.35)]' },
    ETH: { name: 'Ethereum', shadow: 'shadow-[0_0_12px_rgba(98,126,234,0.35)]' },
    SOL: { name: 'Solana', shadow: 'shadow-[0_0_12px_rgba(20,241,149,0.35)]' },
    BNB: { name: 'BNB', shadow: 'shadow-[0_0_12px_rgba(243,186,47,0.35)]' },
    XRP: { name: 'XRP', shadow: 'shadow-[0_0_12px_rgba(255,255,255,0.25)]' },
    ADA: { name: 'Cardano', shadow: 'shadow-[0_0_12px_rgba(0,51,173,0.35)]' },
    AVAX: { name: 'Avalanche', shadow: 'shadow-[0_0_12px_rgba(232,65,66,0.35)]' },
    LINK: { name: 'Chainlink', shadow: 'shadow-[0_0_12px_rgba(42,90,218,0.35)]' },
    DOGE: { name: 'Dogecoin', shadow: 'shadow-[0_0_12px_rgba(195,166,52,0.35)]' },
    SUI: { name: 'Sui', shadow: 'shadow-[0_0_12px_rgba(77,162,255,0.35)]' },
  }

  if (CRYPTO_ICONS[baseAsset]) {
    const meta = CRYPTO_ICONS[baseAsset]
    return (
      <span
        className={`inline-flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden ${meta.shadow} ${sizeClasses} ${className}`}
        title={`${meta.name} (${baseAsset})`}
      >
        <img
          src={`/icons/crypto/${baseAsset.toLowerCase()}.svg`}
          alt={baseAsset}
          className="w-full h-full object-cover select-none pointer-events-none"
          loading="eager"
        />
      </span>
    )
  }

  // Commodities / Gold (XAUUSD / GOLD)
  if (baseAsset === 'XAU' || baseAsset === 'GOLD') {
    return (
      <span className={`inline-flex items-center justify-center flex-shrink-0 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#FFD700] to-[#FFF8DC] text-[#4A3B00] shadow-[0_0_12px_rgba(255,215,0,0.4)] font-extrabold ${sizeClasses} ${className}`} title="Gold (XAUUSD)">
        <span className="leading-none text-[65%] font-black tracking-tighter">AU</span>
      </span>
    )
  }

  // Indonesian Stocks (IDX - e.g. BBCA, BBRI, TLKM, ASII, GOTO, BMRI, BUMI, etc.)
  const idxLogoUrl = getIDXStockLogoUrl(baseAsset)
  if (idxLogoUrl) {
    return (
      <span
        className={`inline-flex items-center justify-center flex-shrink-0 select-none ${sizeClasses} ${className}`}
        title={`${baseAsset} (IDX)`}
      >
        <img
          src={idxLogoUrl}
          alt={baseAsset}
          className="w-full h-full object-contain rounded-md select-none pointer-events-none"
          loading="lazy"
        />
      </span>
    )
  }

  // Dynamic Fallback for Other Assets
  return (
    <span className={`inline-flex items-center justify-center flex-shrink-0 rounded-full bg-gradient-to-br from-white/[0.15] to-white/[0.05] border border-white/[0.15] text-white shadow-sm font-bold uppercase ${sizeClasses} ${className}`} title={symbol}>
      <span className="leading-none text-[60%] tracking-tight">
        {baseAsset.slice(0, 2)}
      </span>
    </span>
  )
}
