'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { StatusPill } from './ui/StatusPill'
import { NotificationPopover } from './NotificationPopover'
import { UserAvatar } from './ui/UserAvatar'
import { useAuth } from '@/context/AuthContext'
import { Button } from './ui/Button'
import { ActsLogo } from './ui/ActsLogo'

const fetcher = (url: string) => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const headers: HeadersInit = {}
  if (anonKey) {
    headers['apikey'] = anonKey
    headers['Authorization'] = `Bearer ${anonKey}`
  }
  return fetch(url, { headers }).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    return res.json()
  })
}

export const Navbar: React.FC = () => {
  const pathname = usePathname()
  const { user, profile, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [localTime, setLocalTime] = useState<string>('')

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      setLocalTime(`${dateStr} ${timeStr}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Lock body scroll and handle Escape key when mobile drawer is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // SWR poller for heartbeat status check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const { data } = useSWR(
    supabaseUrl ? `${supabaseUrl}/functions/v1/get-status` : null,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  )

  const isOnline = data ? (data.brain_online ?? true) : true
  const isLoading = !data

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'About Us', path: '/about' },
  ]

  if (profile?.role === 'admin') {
    navLinks.push({ name: 'Admin Panel', path: '/dashboard/admin' })
  }

  let statusText = 'Live'
  if (!isOnline) {
    statusText = 'Offline'
  } else if (data?.current_regimes && data.current_regimes.length > 0) {
    statusText = 'Live'
  }

  return (
    <header className="sticky top-0 z-50 w-full h-14 glass-navbar flex items-center">
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-6 h-full">
          <Link
            href="/"
            aria-label="ACTS Home"
            className="flex items-center gap-2.5 group transition-colors duration-150"
          >
            <ActsLogo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-5 h-full pl-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path))
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`h-full inline-flex items-center text-xs tracking-wide border-b-2 transition-colors duration-150 ${isActive
                      ? 'border-[#0369a1] text-slate-950 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3.5">
          <div className="flex items-center justify-center">
            <NotificationPopover />
          </div>

          <span className="h-3.5 w-[1px] bg-slate-900/10" />

          <div className="flex items-center justify-center">
            <StatusPill isOnline={isOnline} isLoading={isLoading} label={statusText} />
          </div>

          <span className="h-3.5 w-[1px] bg-slate-900/10" />

          <span className="text-[11px] font-mono tabular-nums text-slate-500 select-none leading-none flex items-center">
            {localTime}
          </span>

          <span className="h-3.5 w-[1px] bg-slate-900/10" />

          {user ? (
            <Link
              href="/dashboard/account"
              className="flex items-center gap-2 py-1 text-slate-950 hover:text-[#0369a1] transition-colors duration-150 cursor-pointer"
              title="Account Settings"
            >
              <UserAvatar
                src={user.photoURL}
                name={profile?.displayName || user.displayName}
                size="sm"
              />
              <span className="text-xs font-semibold leading-none">
                {profile?.displayName || user.displayName || 'Trader'}
              </span>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="primary" className="px-3.5 py-1.5 text-xs font-semibold">
                Log In
              </Button>
            </Link>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2.5">
          <NotificationPopover />
          <StatusPill isOnline={isOnline} isLoading={isLoading} label={statusText} className="scale-90" />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer flex items-center justify-center"
            aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
          >
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/25 transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className="fixed inset-y-0 right-0 w-80 max-w-[82vw] bg-[#faf2df] border-l border-slate-900/10 p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200 overflow-y-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-4">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  aria-label="ACTS Home"
                  className="inline-flex items-center group"
                >
                  <ActsLogo size="sm" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-mono font-semibold text-slate-600 hover:text-slate-950 transition-colors cursor-pointer flex items-center gap-1.5"
                  aria-label="Close Menu"
                >
                  <span>Close</span>
                  <span>×</span>
                </button>
              </div>

              <nav className="flex flex-col divide-y divide-slate-900/8">
                {navLinks.map((link) => {
                  const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path))
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`text-sm py-3 pl-3 border-l-2 transition-colors ${isActive
                          ? 'border-[#0369a1] text-slate-950 font-bold'
                          : 'border-transparent text-slate-600 hover:text-slate-950 font-medium'
                        }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}
              </nav>

              {pathname.startsWith('/dashboard') && (
                <div className="space-y-2 pt-3 border-t border-slate-900/10">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                    Workspace Index
                  </span>
                  <div className="flex flex-col divide-y divide-slate-900/8">
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-xs font-medium py-2.5 text-slate-700 hover:text-slate-950">
                      01 · Overview
                    </Link>
                    <Link href="/dashboard/signals" onClick={() => setIsOpen(false)} className="text-xs font-medium py-2.5 text-slate-700 hover:text-slate-950">
                      02 · Live Signals
                    </Link>
                    <Link href="/dashboard/auto-trading" onClick={() => setIsOpen(false)} className="text-xs font-medium py-2.5 text-slate-700 hover:text-slate-950">
                      03 · Auto-Pilot
                    </Link>
                    <Link href="/dashboard/news" onClick={() => setIsOpen(false)} className="text-xs font-medium py-2.5 text-slate-700 hover:text-slate-950">
                      04 · Macro & News
                    </Link>
                    <Link href="/dashboard/idx" onClick={() => setIsOpen(false)} className="text-xs font-medium py-2.5 text-slate-700 hover:text-slate-950">
                      05 · IDX Equities
                    </Link>
                    <Link href="/dashboard/calendar" onClick={() => setIsOpen(false)} className="text-xs font-medium py-2.5 text-slate-700 hover:text-slate-950">
                      06 · Journal Calendar
                    </Link>
                    <Link
                      href="/dashboard/academy"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-medium py-2.5 text-slate-700 hover:text-slate-950 flex items-center justify-between"
                    >
                      <span>07 · Academy</span>
                      <span className="text-[9px] font-mono font-bold text-emerald-700 uppercase">FREE</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-900/10 pt-5 space-y-4">
              {user ? (
                <div className="space-y-3">
                  <Link
                    href="/dashboard/account"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 py-1.5 text-slate-900 hover:text-[#0369a1]"
                  >
                    <UserAvatar
                      src={user.photoURL}
                      name={profile?.displayName || user.displayName}
                      size="md"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">
                        {profile?.displayName || user.displayName || 'Trader'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">Account Settings</span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full text-left text-xs font-mono font-semibold text-rose-700 hover:text-rose-800 py-1 cursor-pointer"
                  >
                    Sign Out →
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" className="w-full justify-center text-xs py-2.5">
                    Log In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  )
}
