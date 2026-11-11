'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardGating } from '@/components/dashboard/DashboardGating'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading: authLoading } = useAuth()
  const pathname = usePathname()

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-accent-theme border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isApproved = profile?.approved === true
  const hasAcceptedRules = profile?.rulesAccepted === true
  const isDashboardUnlocked = isApproved && hasAcceptedRules
  
  // Account/Profile page is always accessible for any logged in user (Free Tier, Pending, or Pro)
  const isAccountPage = pathname === '/dashboard/account'
  const isAcademyRoute = pathname?.startsWith('/dashboard/academy')

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col md:flex-row w-full">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-5">
        {isDashboardUnlocked || isAccountPage || (Boolean(user) && isAcademyRoute) ? (
          children
        ) : (
          <DashboardGating />
        )}
      </main>
    </div>
  )
}
