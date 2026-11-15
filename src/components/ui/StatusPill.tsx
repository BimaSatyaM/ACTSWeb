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
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium select-none leading-none ${className}`}>
      <span className="relative flex h-2 w-2 items-center justify-center">
        {isOnline && !isLoading && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-40" />
        )}
        <span 
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isLoading 
              ? 'bg-amber-500 animate-pulse' 
              : isOnline 
                ? 'bg-emerald-600' 
                : 'bg-rose-600'
          }`} 
        />
      </span>
      <span className={`text-xs font-semibold leading-none ${isOnline ? 'text-slate-950' : 'text-rose-600'}`}>
        {displayLabel}
      </span>
    </div>
  )
}
