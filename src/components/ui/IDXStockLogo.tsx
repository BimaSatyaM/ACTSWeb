'use client'

import React, { useState } from 'react'
import { getIDXStockLogoUrl } from '@/lib/idxLogos'

export interface IDXStockLogoProps {
  symbol: string
  name?: string
  logoUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function IDXStockLogo({
  symbol = '',
  name,
  logoUrl,
  size = 'md',
  className = '',
}: IDXStockLogoProps) {
  const [hasError, setHasError] = useState(false)

  const cleanSym = symbol.replace('.JK', '').replace('IDX:', '').toUpperCase().trim()
  const resolvedUrl = logoUrl || getIDXStockLogoUrl(cleanSym)

  const sizeConfig = {
    xs: { box: 'w-4 h-4', font: 'text-[9px]', rounded: 'rounded' },
    sm: { box: 'w-5 h-5', font: 'text-[10px]', rounded: 'rounded' },
    md: { box: 'w-8 h-8', font: 'text-xs', rounded: 'rounded-md' },
    lg: { box: 'w-10 h-10', font: 'text-sm', rounded: 'rounded-lg' },
    xl: { box: 'w-12 h-12', font: 'text-base', rounded: 'rounded-xl' },
  }[size] || { box: 'w-8 h-8', font: 'text-xs', rounded: 'rounded-md' }

  // Fallback monogram if no logo is available or if load fails
  if (!resolvedUrl || hasError) {
    return (
      <div
        className={`${sizeConfig.box} ${sizeConfig.rounded} bg-white/[0.06] flex items-center justify-center font-bold ${sizeConfig.font} font-mono text-text-secondary select-none flex-shrink-0 ${className}`}
        title={name || cleanSym}
      >
        {cleanSym.slice(0, 2)}
      </div>
    )
  }

  return (
    <div
      className={`${sizeConfig.box} flex items-center justify-center flex-shrink-0 select-none ${className}`}
      title={name || `${cleanSym} Tbk`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedUrl}
        alt={cleanSym}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain rounded-md select-none pointer-events-none"
        loading="lazy"
      />
    </div>
  )
}
