import React from 'react'
import Image from 'next/image'

export interface IDXLogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  withText?: boolean
  subtitle?: boolean
  variant?: 'badge' | 'icon' | 'mark'
}

export function IDXLogo({
  className = '',
  size = 'md',
  withText = false,
  subtitle = false,
  variant = 'badge',
}: IDXLogoProps) {
  const sizeMap = {
    xs: { box: 'w-4 h-4', img: 14, p: 'p-0.5', rounded: 'rounded' },
    sm: { box: 'w-7 h-7', img: 18, p: 'p-1', rounded: 'rounded-lg' },
    md: { box: 'w-9 h-9', img: 24, p: 'p-1.5', rounded: 'rounded-lg' },
    lg: { box: 'w-11 h-11', img: 30, p: 'p-2', rounded: 'rounded-xl' },
    xl: { box: 'w-14 h-14', img: 40, p: 'p-2.5', rounded: 'rounded-xl' },
  }

  const currentSize = sizeMap[size] || sizeMap.md

  return (
    <div className={`inline-flex items-center gap-2.5 flex-shrink-0 ${className}`}>
      {variant === 'badge' ? (
        <div
          className={`${currentSize.box} ${currentSize.rounded} ${currentSize.p} bg-gradient-to-br from-red-600/20 via-red-500/10 to-transparent border border-red-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.2)] flex-shrink-0`}
        >
          <Image
            src="/assets/idx-emblem.png"
            alt="IDX Logo"
            width={currentSize.img}
            height={currentSize.img}
            className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            priority
          />
        </div>
      ) : variant === 'mark' ? (
        <div className={`relative flex items-center justify-center flex-shrink-0 ${currentSize.box}`}>
          <Image
            src="/assets/idx-mark.png"
            alt="IDX Logo"
            width={currentSize.img * 1.5}
            height={currentSize.img * 1.5}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      ) : (
        <div className={`relative flex items-center justify-center flex-shrink-0 ${currentSize.box}`}>
          <Image
            src="/assets/idx-emblem.png"
            alt="IDX Logo"
            width={currentSize.img}
            height={currentSize.img}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      )}

      {withText && (
        <div className="flex flex-col">
          <span className="font-sans font-extrabold tracking-tight text-white uppercase text-sm leading-none flex items-center gap-1">
            <span>IDX</span>
            <span className="text-[10px] text-red-400 font-bold tracking-wider">BEI</span>
          </span>
          {subtitle && (
            <span className="text-[9px] text-text-muted font-medium tracking-wide uppercase mt-0.5">
              Indonesia Stock Exchange
            </span>
          )}
        </div>
      )}
    </div>
  )
}
