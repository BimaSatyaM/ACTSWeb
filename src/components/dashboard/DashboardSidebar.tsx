'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: string
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { profile } = useAuth()

  const isApproved = profile?.approved === true
  const isAdmin = profile?.role === 'admin'

  const navItems: NavItem[] = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
    {
      name: 'Live Signals',
      href: '/dashboard/signals',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
    {
      name: 'Auto Trading',
      href: '/dashboard/auto-trading',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v3" />
          <line x1="8" y1="15" x2="8" y2="15.01" />
          <line x1="16" y1="15" x2="16" y2="15.01" />
        </svg>
      ),
    },
    {
      name: 'Live News',
      href: '/dashboard/news',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      ),
    },
    {
      name: 'IDX Market',
      href: '/dashboard/idx',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
    },
    {
      name: 'Performance Calendar',
      href: '/dashboard/calendar',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      ),
    },
    {
      name: 'Academy',
      href: '/dashboard/academy',
      badge: 'Free Tier',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
  ]

  if (isAdmin) {
    navItems.push({
      name: 'Admin Panel',
      href: '/dashboard/admin',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    })
  }

  return (
    <aside className="w-full md:w-60 flex-shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/[0.08] bg-transparent p-2.5 md:p-5 space-y-0 md:space-y-6 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:overflow-y-auto">
      {/* ── Top Section: Menu Title & Links ── */}
      <div className="space-y-0 md:space-y-4">
        <div className="px-2 hidden md:flex items-center justify-between">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Workspace
          </span>
        </div>

        <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname?.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ease-out whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-accent-theme/15 via-accent-theme/5 to-transparent text-white border-l-2 border-accent-theme font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'text-text-secondary hover:text-white hover:bg-white/[0.04] hover:translate-x-0.5 border-l-2 border-transparent'
                }`}
              >
                <span className={`inline-flex items-center justify-center transition-all duration-200 ease-out transform ${
                  isActive 
                    ? 'text-accent-theme scale-110' 
                    : 'text-text-muted group-hover:scale-110 group-hover:text-accent-theme'
                }`}>
                  {item.icon}
                </span>
                <span className="transition-colors duration-150 flex-1">{item.name}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-text-secondary border border-white/[0.08] font-mono group-hover:border-accent-theme/40 group-hover:text-white transition-colors">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ── Bottom Section: Access Status / Telegram CTA ── */}
      <div className="hidden md:block pt-3 pb-1">
        {isApproved ? (
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>{isAdmin ? 'Admin' : 'Pro Trader'}</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Connected to 24/7 autonomous confluence signal stream.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Access</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Pending Token</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Request an access token from admin to unlock live trading signals.
            </p>
            <a
              href="https://t.me/Mahenssss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#38bdf8] hover:text-white transition-colors"
            >
              <span>Get Token on Telegram</span>
              <span>→</span>
            </a>
          </div>
        )}
      </div>
    </aside>
  )
}
