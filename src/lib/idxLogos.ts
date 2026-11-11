import idxLogosMap from './idxLogosMap.json'

// Verified TradingView logo keys for Indonesian equities (IDX / BEI).
// Vector assets are hosted on TradingView's public CDN:
// https://s3-symbol-logo.tradingview.com/{logoid}.svg
//
// Preloaded with 884+ Indonesian stock tickers from the official IDX universe.
export const KNOWN_IDX_LOGOS: Record<string, string> = {
  ...(idxLogosMap as Record<string, string>),
  // Priority blue-chip aliases
  BBCA: 'bank-central-asia',
  BBRI: 'bank-rakyat-indonesia',
  BMRI: 'bank-mandiri',
  BBNI: 'bank-negara-indonesia-persero-tbk',
  TLKM: 'telekom-indonesia',
  ASII: 'astra-international',
  GOTO: 'goto-gojek-tokopedia-rp-1',
  BREN: 'barito-pacific',
  BUMI: 'bumi-resources-minerals',
  BNBR: 'pt-bakrie-sumatera-plantations-tbk',
}

// Resolves the official vector SVG logo URL for an IDX stock.
// Returns null if no verified logo is known.
export function getIDXStockLogoUrl(symbol?: string, customLogoId?: string): string | null {
  if (customLogoId && customLogoId.trim().length > 0) {
    return `https://s3-symbol-logo.tradingview.com/${customLogoId.trim()}.svg`
  }

  if (!symbol) return null
  const clean = symbol.replace('.JK', '').replace('IDX:', '').toUpperCase().trim()

  const logoid = KNOWN_IDX_LOGOS[clean]
  if (logoid) {
    return `https://s3-symbol-logo.tradingview.com/${logoid}.svg`
  }

  return null
}
