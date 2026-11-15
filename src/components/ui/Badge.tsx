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
          textColor: 'text-emerald-700',
          dot: 'bg-emerald-600',
        }
      case 'WATCHLIST':
        return {
          textColor: 'text-amber-700',
          dot: 'bg-amber-500',
        }
      case 'NOT_HIT':
        return {
          textColor: 'text-rose-700',
          dot: 'bg-rose-600',
        }
      case 'NEUTRAL':
      default:
        return {
          textColor: 'text-slate-600',
          dot: 'bg-slate-500',
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

