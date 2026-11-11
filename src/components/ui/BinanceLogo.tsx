import React from 'react'

interface BinanceLogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  withText?: boolean
  variant?: 'yellow' | 'white' | 'badge'
}

export function BinanceLogo({
  className = '',
  size = 'md',
  withText = false,
  variant = 'yellow',
}: BinanceLogoProps) {
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  }

  const dim = sizeMap[size] || sizeMap.md

  return (
    <div className={`inline-flex items-center gap-2 flex-shrink-0 ${className}`}>
      {variant === 'badge' ? (
        <div className={`${dim} rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/30 flex items-center justify-center p-1 shadow-[0_0_12px_rgba(240,185,11,0.2)]`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6595-2.7174-2.7154 7.353-7.353z"
              fill="#F0B90B"
            />
          </svg>
        </div>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${dim} flex-shrink-0 select-none`}
        >
          <path
            d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6595-2.7174-2.7154 7.353-7.353z"
            fill={variant === 'white' ? '#FFFFFF' : '#F0B90B'}
          />
        </svg>
      )}

      {withText && (
        <span className="font-sans font-bold tracking-tight text-white uppercase text-sm">
          BINANCE
        </span>
      )}
    </div>
  )
}
