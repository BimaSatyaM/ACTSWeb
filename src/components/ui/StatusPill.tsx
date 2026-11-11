import React from 'react'

interface StatusPillProps {
  isOnline: boolean
  isLoading?: boolean
  label?: string
  className?: string
}

export const StatusPill: React.FC<StatusPillProps> = ({ isOnline, isLoading = false, label, className = '' }) => {
  const displayLabel = isLoading ? 'Loading...' : (isOnline ? (label || 'Live') : 'Offline')
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-0.5 text-xs font-semibold select-none leading-none ${className}`}>
      <span className="relative flex h-2 w-2 items-center justify-center">
        {isOnline && !isLoading && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        )}
        <span 
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isLoading 
              ? 'bg-amber-400 animate-pulse' 
              : isOnline 
                ? 'bg-emerald-400' 
                : 'bg-rose-500'
          }`} 
        />
      </span>
      <span className={`text-xs font-semibold leading-none ${isOnline ? 'text-zinc-200' : 'text-rose-400'}`}>
        {displayLabel}
      </span>
    </div>
  )
}
