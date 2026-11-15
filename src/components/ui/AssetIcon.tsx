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
  const CRYPTO_ICONS: Record<string, { name: string }> = {
    BTC: { name: 'Bitcoin' },
    ETH: { name: 'Ethereum' },
    SOL: { name: 'Solana' },
    BNB: { name: 'BNB' },
    XRP: { name: 'XRP' },
    ADA: { name: 'Cardano' },
    AVAX: { name: 'Avalanche' },
    LINK: { name: 'Chainlink' },
    DOGE: { name: 'Dogecoin' },
    SUI: { name: 'Sui' },
  }

  if (CRYPTO_ICONS[baseAsset]) {
    const meta = CRYPTO_ICONS[baseAsset]
    return (
      <span
        className={`inline-flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden ${sizeClasses} ${className}`}
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
      <span className={`inline-flex items-center justify-center flex-shrink-0 rounded-full bg-amber-400 border border-amber-300/80 text-amber-950 font-extrabold ${sizeClasses} ${className}`} title="Gold (XAUUSD)">
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
    <span className={`inline-flex items-center justify-center flex-shrink-0 rounded-full bg-sky-100/90 border border-slate-900/10 text-slate-900 shadow-xs font-bold uppercase ${sizeClasses} ${className}`} title={symbol}>
      <span className="leading-none text-[60%] tracking-tight">
        {baseAsset.slice(0, 2)}
      </span>
    </span>
  )
}
