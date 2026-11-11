'use client'

import React from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function AppBackground() {
  const pathname = usePathname()
  const isDashboard = pathname.startsWith('/dashboard')

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <Image
        src="/assets/wallpaperacts.png"
        alt="ACTS Background"
        fill
        priority
        className={`object-cover object-center transition-all duration-500 ${
          isDashboard ? 'opacity-[0.12] blur-sm' : 'opacity-65'
        }`}
      />

      {/* Dynamic Overlays: Dimmed & locked for dashboard, vibrant for Home and About Us */}
      {isDashboard ? (
        <>
          <div className="absolute inset-0 bg-[#070b14]/85" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/60 via-transparent to-[#070b14]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/40 via-transparent to-[#070b14]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#070b14_95%)]" />
        </>
      )}
    </div>
  )
}
