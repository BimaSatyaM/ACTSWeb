'use client'

import React, { useState } from 'react'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-20 h-20 text-xl',
  }

  const initial = (name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'U')

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || 'Account Avatar'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImageError(true)}
        className={`${sizeClasses[size]} rounded-full border border-slate-900/10 object-cover flex-shrink-0 shadow-xs ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-[#0369a1] border border-[#0369a1]/20 text-white font-bold font-mono flex items-center justify-center flex-shrink-0 shadow-xs ${className}`}
      title={name || 'User Profile'}
    >
      {initial}
    </div>
  )
}
