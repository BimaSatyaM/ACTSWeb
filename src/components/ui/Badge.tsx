import React from 'react'

interface BadgeProps {
  variant: 'SIGNAL' | 'WATCHLIST' | 'HIT' | 'NOT_HIT' | 'NEUTRAL'
  children: React.ReactNode
  className?: string
  withDot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, className = '', withDot = true }) => {
  const getStyles = () => {
    switch (variant) {
      case 'SIGNAL':
      case 'HIT':
        return {
          textColor: 'text-emerald-400',
          dot: 'bg-emerald-400',
        }
      case 'WATCHLIST':
        return {
          textColor: 'text-amber-400',
          dot: 'bg-amber-400',
        }
      case 'NOT_HIT':
        return {
          textColor: 'text-rose-400',
          dot: 'bg-rose-400',
        }
      case 'NEUTRAL':
      default:
        return {
          textColor: 'text-zinc-400',
          dot: 'bg-zinc-400',
        }
    }
  }

  const { textColor, dot } = getStyles()

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${textColor} ${className}`}>
      {withDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      )}
      <span>{children}</span>
    </span>
  )
}

