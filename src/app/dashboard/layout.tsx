'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardGating } from '@/components/dashboard/DashboardGating'
import { DashboardWorkspaceSkeleton } from '@/components/ui/Skeleton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading: authLoading } = useAuth()
  const pathname = usePathname()

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col md:flex-row w-full">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">
          <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <DashboardWorkspaceSkeleton />
          </div>
        </main>
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

      <main className="flex-1 min-w-0">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {isDashboardUnlocked || isAccountPage || (Boolean(user) && isAcademyRoute) ? (
            children
          ) : (
            <DashboardGating />
          )}
        </div>
      </main>
    </div>
  )
}
